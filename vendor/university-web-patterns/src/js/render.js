/* Substitute client data into a pattern template, in the browser.
 *
 * The twin of tools/render.py. Same grammar, same escaping, same absence
 * rule, same output — byte for byte. A client that builds some pages on a
 * build machine and some in the browser fills one set of templates with one
 * set of rules, instead of keeping a hand-written copy of the markup for the
 * pages Python cannot reach. Divergence between the two would be worse than
 * having neither, so the parity is tested rather than asserted:
 *
 *     python3 tools/render.py --parity-fixture | node src/js/render.js --parity
 *
 * renders every registered template through both renderers against the same
 * data and fails on the first byte that differs.
 *
 *
 * Templates are given, never fetched
 * ----------------------------------
 * A client never loads a template over the network, at build time or at
 * request time (PROPAGATION_MODEL.md §2 and §8.1). A renderer that called
 * fetch() would put the network back in the render path, make the page depend
 * on files being served from a particular place, and let a template change
 * without a commit in the client. So this renderer never reads a file. It is
 * given the template text it needs:
 *
 *     <script src="vendor/university-web-patterns/src/js/render.js" defer></script>
 *     <script src="assets/patterns.templates.js" defer></script>
 *     <script src="assets/directory.js" defer></script>
 *
 * where patterns.templates.js is generated at build time from the vendored
 * copy, and registers itself:
 *
 *     uwp.register({ "person-card": "<article ...>...</article>" });
 *
 * Generate it with:
 *
 *     python3 vendor/university-web-patterns/tools/render.py \
 *         --emit-js-templates > assets/patterns.templates.js
 *
 * That file registers itself with this one, so loading it after this script
 * is all a page has to do. A client that would rather emit the same object
 * from its own build may; either way the templates are inlined at build time
 * from the pinned vendored copy, and the page ships with them.
 *
 *
 * How to load this file
 * ---------------------
 * It defines a global, `uwp`, rather than exporting ES bindings, because the
 * pages that need it load their renderers as classic deferred scripts and the
 * rest of this package's JavaScript is written the same way. It also works
 * unchanged when loaded as a module script, imported for its side effect, or
 * required under Node:
 *
 *     <script src=".../render.js" defer></script>         // then window.uwp
 *     <script type="module" src=".../render.js"></script>  // then window.uwp
 *     import ".../render.js";                              // then globalThis.uwp
 *     const uwp = require(".../render.js");
 *
 * Module and deferred classic scripts both run after parsing, in document
 * order, so a `defer` script placed after this one can use `uwp` directly.
 *
 *
 * The grammar, in full
 * --------------------
 *     {{ name }}                  a top-level key
 *     {{ object.field }}          a dotted path
 *     {{ this }} / {{ this.f }}   the current item, inside #each
 *
 *     {{ #if path }} … {{ /if }}          render when path is truthy
 *     {{ #unless path }} … {{ /unless }}  render when path is falsy
 *     {{ #each path }} … {{ /each }}      render once per item
 *
 * No expressions, no comparisons, no helpers, no else. Everything above that
 * ceiling is a slot the client fills with rendered markup.
 *
 *
 * Escaping and absence
 * --------------------
 * Every value is HTML-escaped unless it is Markup. Wrap pre-rendered markup
 * with `uwp.markup(html)`; wrap nothing that came from client content.
 * `render()` and `join()` return Markup, so a rendered component drops into
 * another component's slot without being escaped twice. Note that `+` and
 * `Array.join` produce plain strings, which will be escaped when passed on:
 * use `uwp.join(parts)` to combine rendered pieces.
 *
 * Absent, null, undefined, false, "" and empty collections all render as the
 * empty string, and are the falsy set for #if and #unless. Truthiness is
 * spelled out here rather than left to the language, because JavaScript
 * considers [] and {} truthy and Python does not, and the two renderers have
 * to agree. Numbers always render, 0 included; true renders as "true".
 *
 * Floats are the one value whose text can differ between the two renderers,
 * because the languages format them differently. Pass a preformatted string
 * when a fractional number has to reach a template.
 *
 * HTML comments are authoring notes and are stripped before substitution, and
 * a block token alone on its line takes the line with it, so both renderers
 * produce the same whitespace.
 */

(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module && typeof module.exports === "object") {
    module.exports = api;
  }
  if (root) {
    root.uwp = root.uwp ? Object.assign(root.uwp, api) : api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* ----------------------------------------------------------------------
   * CHANGING THIS FILE OBLIGES YOU TO CHANGE tools/render.py
   * ----------------------------------------------------------------------
   * This is not "the JavaScript version" of the renderer, with the freedom
   * that implies. It is the same renderer, and a site may render the same
   * component through either one. The loud failure of a divergence is a page
   * that differs depending on where it was built. The quiet failure is one
   * renderer escaping a value the other passes through, which is a
   * cross-site scripting hole on whichever route nobody is looking at.
   *
   * Behaviours that must move together, in both files:
   *   the truthiness rule (isTruthy / is_truthy)
   *   the escape set and its exact entities (escapeText / escape)
   *   the absence rule (falsy renders empty, never an error)
   *   comment stripping, and standalone-block line folding — whitespace counts
   *   path resolution and the scope chain (resolve / _resolve)
   *   the version stamp (stampVersion / Renderer._stamp)
   *
   * Prove it, never assume it:
   *   python3 tools/render.py --parity-fixture | node src/js/render.js --parity
   *
   * That command is not decoration. The generator that hands templates to
   * this file once carried the release version in a comment and never set
   * it, so browser-rendered components would have shipped unstamped while
   * build-time ones stamped. It was found by running the check end to end,
   * not by reading the file — the comment said the right thing.
   *
   * docs/ARCHITECTURE.md §3 is the long form of why this pair exists.
   * ------------------------------------------------------------------- */

  /* The grammar is closed at three blocks. docs/ARCHITECTURE.md §4 says what
     the ceiling is holding back; read it before deciding it is the problem.
     Adding one here without adding it in render.py breaks parity by
     construction. */
  var BLOCK_KINDS = ["if", "unless", "each"];

  /* [\s\S] rather than . because JavaScript has no DOTALL flag and a token
     may span lines. All four patterns mirror render.py's; keep them so. */
  var TOKEN = /\{\{([\s\S]*?)\}\}/g;
  var DOTTED_PATH = /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/;
  var OPEN_TOKEN = /^#([A-Za-z]+)(?:\s+([\s\S]*))?$/;
  var CLOSE_TOKEN = /^\/([A-Za-z]+)\s*$/;

  /* Two comment passes, standalone first, so a comment owning its line takes
     the newline with it and the rendered markup does not grow a blank line
     per stripped documentation block. Inline-first would consume the comment
     and strand its indentation. Same reasoning for a block token alone on a
     line. Both renderers fold identically because whitespace is part of the
     byte-for-byte contract. */
  var STANDALONE_COMMENT = /^[ \t]*<!--[\s\S]*?-->[ \t]*\r?\n/gm;
  var INLINE_COMMENT = /<!--[\s\S]*?-->/g;
  var STANDALONE_BLOCK = /^[ \t]*(\{\{[ \t]*[#/][^{}]*?\}\})[ \t]*\r?\n/gm;

  /* Names never followed through a path. The leading-underscore rule matches
     the Python side; the rest are JavaScript's own ways out of an object,
     which Python has no equivalent of and therefore does not list.
     Known asymmetry: JavaScript's `in` walks the prototype chain, so a path
     segment naming an inherited Object.prototype member (toString, valueOf,
     hasOwnProperty …) resolves to a native function here and to nothing in
     render.py. No template uses such a segment — paths are literals in the
     template, never data — so nothing renders differently today, but do not
     introduce one, and prefer extending this list to discovering it in a
     parity failure. */
  var BLOCKED_SEGMENTS = { __proto__: true, constructor: true, prototype: true };

  var MISSING = { uwpMissing: true };

  function TemplateError(message) {
    var error = new Error(message);
    error.name = "TemplateError";
    return error;
  }

  function UnknownComponentError(message) {
    var error = new Error(message);
    error.name = "UnknownComponentError";
    return error;
  }

  // -- escaping ------------------------------------------------------------

  function Markup(value) {
    if (!(this instanceof Markup)) {
      return new Markup(value);
    }
    this.value = String(value);
  }
  Markup.prototype.toString = function () {
    return this.value;
  };
  Markup.prototype.toHTML = function () {
    return this.value;
  };
  Markup.prototype.valueOf = function () {
    return this.value;
  };

  function isMarkup(value) {
    if (value instanceof Markup) {
      return true;
    }
    return (
      value !== null &&
      typeof value === "object" &&
      (typeof value.toHTML === "function" || typeof value.__html__ === "function")
    );
  }

  function rawOf(value) {
    if (value instanceof Markup) {
      return value.value;
    }
    if (typeof value.toHTML === "function") {
      return String(value.toHTML());
    }
    return String(value.__html__());
  }

  /* "Is this a bag of things, whose emptiness decides a condition?"
     Date and RegExp are excluded because they are objects with no members,
     so Object.keys() would report them empty and a #if on a date would be
     false. That is the JavaScript-only trap in the truthiness rule: Python
     has no such objects reaching this branch, so the two renderers agree
     only because of these two exclusions. Anything else object-like whose
     emptiness is not the question belongs on this list too. */
  function isPlainCollection(value) {
    return (
      value !== null &&
      typeof value === "object" &&
      !(value instanceof Date) &&
      !(value instanceof RegExp)
    );
  }

  function collectionSize(value) {
    if (Array.isArray(value)) {
      return value.length;
    }
    if (typeof Map !== "undefined" && value instanceof Map) {
      return value.size;
    }
    if (typeof Set !== "undefined" && value instanceof Set) {
      return value.size;
    }
    return Object.keys(value).length;
  }

  /* Decide #if and #unless, identically to the Python renderer. Falsy:
   * absent, null, undefined, false, 0, "" and empty collections. */
  function isTruthy(value) {
    if (value === MISSING || value === null || value === undefined || value === false) {
      return false;
    }
    if (value === true) {
      return true;
    }
    if (typeof value === "number") {
      return value !== 0;
    }
    if (typeof value === "string") {
      return value !== "";
    }
    if (isMarkup(value)) {
      return rawOf(value) !== "";
    }
    if (isPlainCollection(value)) {
      return collectionSize(value) > 0;
    }
    return true;
  }

  /* The exact output of Python's html.escape(value, quote=True): five
     entities, and `'` as the numeric &#x27; rather than the named &apos;.
     Both of those are parity requirements, not preferences — a named entity
     here would differ from render.py on every apostrophe in every name.

     The ampersand MUST be replaced first. Replace `<` first and the `&` pass
     then rewrites the `&` of the `&lt;` it just produced, yielding
     `&amp;lt;` and putting the literal text "&lt;" on the page. It is the
     classic double-escape and it is invisible in a diff of this function;
     it shows up as visible entity text in a heading. */
  function escapeText(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  }

  /* Return value as markup, escaping it unless it is already markup.
   * Applies the absence rule: falsy values other than numbers become "". */
  function escape(value) {
    if (value === MISSING || value === null || value === undefined || value === false) {
      return new Markup("");
    }
    if (value === true) {
      return new Markup("true");
    }
    if (isMarkup(value)) {
      return new Markup(rawOf(value));
    }
    if (typeof value === "string") {
      return new Markup(escapeText(value));
    }
    if (typeof value === "number") {
      return new Markup(escapeText(String(value)));
    }
    if (isPlainCollection(value)) {
      if (collectionSize(value) === 0) {
        return new Markup("");
      }
      throw TemplateError(
        "cannot render a collection into a value placeholder (" +
          collectionSize(value) +
          " entries). Use {{ #each }} in the template, or render each item " +
          "and pass the joined markup into a slot."
      );
    }
    return new Markup(escapeText(String(value)));
  }

  /* Join rendered parts into one markup value, escaping anything unmarked. */
  function join(parts, separator) {
    var pieces = [];
    var list = Array.isArray(parts) ? parts : Array.prototype.slice.call(parts);
    for (var index = 0; index < list.length; index += 1) {
      pieces.push(String(escape(list[index])));
    }
    return new Markup(pieces.join(separator === undefined ? "\n" : separator));
  }

  // -- compilation ---------------------------------------------------------

  function stripComments(source) {
    return source.replace(STANDALONE_COMMENT, "").replace(INLINE_COMMENT, "");
  }

  function tidyBlocks(source) {
    return source.replace(STANDALONE_BLOCK, "$1");
  }

  function checkPath(expression, origin) {
    if (!DOTTED_PATH.test(expression)) {
      throw TemplateError(
        origin +
          ": {{ " +
          expression +
          " }} is not a path. A path is a dotted run of identifiers, such as " +
          "{{ site.name }}."
      );
    }
    return expression;
  }

  /* Compile template text into a node tree:
   *   {type:"text", text}
   *   {type:"value", path}
   *   {type:"block", kind, path, children} */
  function parse(source, origin) {
    var root = [];
    var stack = [];
    var current = root;
    var position = 0;
    var match;

    /* TOKEN is a /g regex held at module scope, so it carries lastIndex
       between calls. Without this reset, a compile that threw part-way
       through one template would leave the cursor mid-string and the NEXT
       template would be parsed from the middle — losing its opening markup
       silently. Reset here rather than making TOKEN local: it is shared with
       render.py's compiled pattern by intent, and a per-call regex would
       drift from it. */
    TOKEN.lastIndex = 0;
    while ((match = TOKEN.exec(source)) !== null) {
      if (match.index > position) {
        current.push({ type: "text", text: source.slice(position, match.index) });
      }
      position = TOKEN.lastIndex;
      var expression = match[1].trim();

      var close = CLOSE_TOKEN.exec(expression);
      if (close) {
        if (stack.length === 0) {
          throw TemplateError(
            origin + ": {{ /" + close[1] + " }} closes a block that was never opened."
          );
        }
        var frame = stack.pop();
        if (close[1] !== frame.kind) {
          throw TemplateError(
            origin +
              ": {{ /" +
              close[1] +
              " }} closes {{ #" +
              frame.kind +
              " " +
              frame.path +
              " }}. Blocks must nest."
          );
        }
        frame.parent.push({
          type: "block",
          kind: frame.kind,
          path: frame.path,
          children: current
        });
        current = frame.parent;
        continue;
      }

      var opener = OPEN_TOKEN.exec(expression);
      if (opener) {
        var kind = opener[1];
        var argument = (opener[2] || "").trim();
        if (BLOCK_KINDS.indexOf(kind) === -1) {
          throw TemplateError(
            origin +
              ": {{ #" +
              kind +
              " }} is not a block. This renderer has exactly three: #" +
              BLOCK_KINDS.join(", #") +
              "."
          );
        }
        if (!argument) {
          throw TemplateError(
            origin +
              ": {{ #" +
              kind +
              " }} needs a path, as in {{ #" +
              kind +
              " footer.groups }}."
          );
        }
        checkPath(argument, origin);
        stack.push({ kind: kind, path: argument, parent: current });
        current = [];
        continue;
      }

      if (/^[/#^!>&]/.test(expression)) {
        throw TemplateError(
          origin +
            ": {{ " +
            expression +
            " }} is not part of this template grammar, which is values plus #" +
            BLOCK_KINDS.join(", #") +
            "."
        );
      }
      current.push({ type: "value", path: checkPath(expression, origin) });
    }

    if (stack.length > 0) {
      var open = stack[stack.length - 1];
      throw TemplateError(
        origin + ": {{ #" + open.kind + " " + open.path + " }} is never closed."
      );
    }
    if (position < source.length) {
      root.push({ type: "text", text: source.slice(position) });
    }
    return root;
  }

  function compileTemplate(source, options) {
    var settings = options || {};
    var origin = settings.origin || "<source>";
    var prepared = settings.keepComments ? source : stripComments(source);
    return parse(tidyBlocks(prepared), origin);
  }

  // -- resolution ----------------------------------------------------------

  function resolveSegments(container, segments) {
    var current = container;
    for (var index = 0; index < segments.length; index += 1) {
      var segment = segments[index];
      if (current === null || current === undefined || current === MISSING) {
        return MISSING;
      }
      if (segment.charAt(0) === "_" || BLOCKED_SEGMENTS[segment] === true) {
        return MISSING;
      }
      if (typeof Map !== "undefined" && current instanceof Map) {
        if (!current.has(segment)) {
          return MISSING;
        }
        current = current.get(segment);
        continue;
      }
      if (typeof current !== "object" && typeof current !== "function") {
        return MISSING;
      }
      if (!(segment in Object(current))) {
        return MISSING;
      }
      current = current[segment];
    }
    return current;
  }

  function has(frame, key) {
    if (frame === null || frame === undefined || frame === MISSING) {
      return false;
    }
    if (typeof Map !== "undefined" && frame instanceof Map) {
      return frame.has(key);
    }
    if (typeof frame !== "object" && typeof frame !== "function") {
      return false;
    }
    return key in Object(frame);
  }

  function resolve(frames, path) {
    var segments = path.split(".");
    var head = segments[0];
    var rest = segments.slice(1);
    if (head === "this") {
      return resolveSegments(frames[frames.length - 1], rest);
    }
    for (var index = frames.length - 1; index >= 0; index -= 1) {
      if (has(frames[index], head)) {
        return resolveSegments(resolveSegments(frames[index], [head]), rest);
      }
    }
    return MISSING;
  }

  // -- rendering -----------------------------------------------------------

  function renderNodes(nodes, frames, strict, origin) {
    var out = "";
    for (var index = 0; index < nodes.length; index += 1) {
      var node = nodes[index];

      if (node.type === "text") {
        out += node.text;
        continue;
      }

      if (node.type === "value") {
        var value = resolve(frames, node.path);
        if (value === MISSING && strict) {
          throw TemplateError(
            origin +
              ": no value supplied for {{ " +
              node.path +
              " }} (strict mode). Pass null to render it empty on purpose."
          );
        }
        try {
          out += String(escape(value));
        } catch (error) {
          throw TemplateError(
            origin + ": {{ " + node.path + " }}: " + error.message
          );
        }
        continue;
      }

      var target = resolve(frames, node.path);

      if (node.kind === "if") {
        if (isTruthy(target)) {
          out += renderNodes(node.children, frames, strict, origin);
        }
        continue;
      }
      if (node.kind === "unless") {
        if (!isTruthy(target)) {
          out += renderNodes(node.children, frames, strict, origin);
        }
        continue;
      }

      if (target === MISSING || target === null || target === undefined || target === false) {
        continue;
      }
      var items;
      if (Array.isArray(target)) {
        items = target;
      } else if (typeof Set !== "undefined" && target instanceof Set) {
        items = Array.from(target);
      } else {
        throw TemplateError(
          origin +
            ": {{ #each " +
            node.path +
            " }} needs a list, not " +
            (typeof target === "object" ? "an object" : typeof target) +
            "."
        );
      }
      for (var item = 0; item < items.length; item += 1) {
        frames.push(items[item]);
        try {
          out += renderNodes(node.children, frames, strict, origin);
        } finally {
          frames.pop();
        }
      }
    }
    return out;
  }

  function renderNodeTree(nodes, data, options) {
    var settings = options || {};
    var origin = settings.origin || "<source>";
    var context = data === undefined || data === null ? {} : data;
    if (typeof context !== "object") {
      throw TemplateError(
        origin + ": render() takes an object of slot names to values, not " + typeof context
      );
    }
    return new Markup(renderNodes(nodes, [context], !!settings.strict, origin));
  }

  function renderSource(source, data, options) {
    var settings = options || {};
    return renderNodeTree(compileTemplate(source, settings), data, settings);
  }

  /* Every path a template refers to, in first-use order. */
  function templatePathsOf(source) {
    var names = [];
    (function walk(nodes) {
      for (var index = 0; index < nodes.length; index += 1) {
        var node = nodes[index];
        if (node.type === "value") {
          if (names.indexOf(node.path) === -1) {
            names.push(node.path);
          }
        } else if (node.type === "block") {
          if (names.indexOf(node.path) === -1) {
            names.push(node.path);
          }
          walk(node.children);
        }
      }
    })(compileTemplate(source));
    return names;
  }

  // -- registry ------------------------------------------------------------

  function splitAssets(assets) {
    var grouped = { css: [], js: [], other: [] };
    for (var index = 0; index < assets.length; index += 1) {
      var asset = String(assets[index]);
      if (/\.css$/.test(asset)) {
        grouped.css.push(asset);
      } else if (/\.js$/.test(asset)) {
        grouped.js.push(asset);
      } else {
        grouped.other.push(asset);
      }
    }
    return grouped;
  }

  /* Record the release beside the component id in the output. Mirrors
     Renderer._stamp in render.py exactly; the two must agree byte for byte.
     Only the first occurrence is stamped: that is the component's own root.
     Markup passed into a slot was already stamped when it was rendered. */
  function stampVersion(html, componentId, version) {
    if (!version || !componentId) {
      return html;
    }
    var marker = 'data-uwp-component="' + componentId + '"';
    var at = String(html).indexOf(marker);
    if (at === -1) {
      return html;
    }
    var text = String(html);
    return new Markup(
      text.slice(0, at + marker.length) +
        ' data-uwp-version="' + version + '"' +
        text.slice(at + marker.length)
    );
  }

  function Renderer(options) {
    var settings = options || {};
    this.templates = {};
    this.components = {};
    this.order = [];
    this.stylesheetOrder = [];
    this.compiled = {};
    this.version = settings.version ? String(settings.version) : "";
    if (settings.templates) {
      this.register(settings.templates);
    }
    if (settings.components) {
      this.registerComponents(settings.components);
    }
  }

  /* Register template sources: {componentId: templateText}.
     This is the only way a template gets in. There is no fetch() in this
     file and there must never be one: a renderer that loaded templates over
     the network would put the network back in the render path and let a
     site's appearance change with no commit in that site — see
     PROPAGATION_MODEL.md §2 and docs/ARCHITECTURE.md §6.
     The delete is not tidiness: `compiled` caches a parsed tree per id, and
     re-registering an id without dropping it would keep rendering the
     previous template while claiming to hold the new one. */
  Renderer.prototype.register = function (templates) {
    var ids = Object.keys(templates || {});
    for (var index = 0; index < ids.length; index += 1) {
      this.templates[ids[index]] = String(templates[ids[index]]);
      delete this.compiled[ids[index]];
    }
    return this;
  };

  /* Register the parsed contents of components.json, for asset lookup. */
  Renderer.prototype.registerComponents = function (document) {
    var list = (document && document.components) || [];
    if (document && document.version) {
      this.version = String(document.version);
    }
    if (document && document.stylesheet_order) {
      this.stylesheetOrder = document.stylesheet_order.slice();
    }
    for (var index = 0; index < list.length; index += 1) {
      var component = list[index];
      if (component && component.id) {
        this.components[component.id] = component;
        if (this.order.indexOf(component.id) === -1) {
          this.order.push(component.id);
        }
      }
    }
    return this;
  };

  Renderer.prototype.componentIds = function () {
    var ids = this.order.slice();
    var registered = Object.keys(this.templates);
    for (var index = 0; index < registered.length; index += 1) {
      if (ids.indexOf(registered[index]) === -1) {
        ids.push(registered[index]);
      }
    }
    return ids;
  };

  Renderer.prototype.templateSource = function (componentId) {
    if (!Object.prototype.hasOwnProperty.call(this.templates, componentId)) {
      var known = Object.keys(this.templates);
      throw UnknownComponentError(
        "no template registered for " +
          JSON.stringify(componentId) +
          ". " +
          (known.length
            ? "Registered: " + known.join(", ") + "."
            : "Nothing is registered: call uwp.register({id: templateText}) " +
              "with the templates emitted from the vendored copy at build " +
              "time. This renderer never fetches a template.")
      );
    }
    return this.templates[componentId];
  };

  Renderer.prototype.compiledTemplate = function (componentId) {
    if (!Object.prototype.hasOwnProperty.call(this.compiled, componentId)) {
      this.compiled[componentId] = compileTemplate(this.templateSource(componentId), {
        origin: "component " + JSON.stringify(componentId)
      });
    }
    return this.compiled[componentId];
  };

  Renderer.prototype.render = function (componentId, data, options) {
    var settings = options || {};
    return stampVersion(
      renderNodeTree(this.compiledTemplate(componentId), data, {
        strict: settings.strict,
        origin: "component " + JSON.stringify(componentId)
      }),
      componentId,
      this.version
    );
  };

  Renderer.prototype.templateSlots = function (componentId) {
    return templatePathsOf(this.templateSource(componentId));
  };

  Renderer.prototype.component = function (componentId) {
    if (!Object.prototype.hasOwnProperty.call(this.components, componentId)) {
      throw UnknownComponentError(
        "no registry entry for " +
          JSON.stringify(componentId) +
          ". Call uwp.registerComponents(componentsJson) with the vendored " +
          "components.json to look up assets."
      );
    }
    return this.components[componentId];
  };

  /* The CSS and JS a component needs, so a page can be assembled from the
   * registry instead of a hardcoded list that drifts. */
  Renderer.prototype.componentAssets = function (componentId) {
    return splitAssets(this.component(componentId).assets || []);
  };

  Renderer.prototype.componentSchemas = function (componentId) {
    return (this.component(componentId).schemas || []).slice();
  };

  /* The union of several components' assets for one page's <head>,
   * deduplicated. Scripts keep first-use order. Stylesheets are put back into
   * the cascade order declared once at the top of components.json, because
   * first-use order is the wrong answer for them: a page opens with skip-link,
   * which needs tokens and patterns and not readability, so first use puts
   * patterns.css before readability.css on every page that has a skip link.
   * No component can fix that on its own — none of them lists all four sheets.
   * The build-time renderer does exactly this; see the note in
   * tools/render.py. A sheet the order does not name keeps first-use order
   * after the ones it does. */
  Renderer.prototype.pageAssets = function (componentIds) {
    var seen = [];
    for (var index = 0; index < componentIds.length; index += 1) {
      var assets = this.component(componentIds[index]).assets || [];
      for (var asset = 0; asset < assets.length; asset += 1) {
        if (seen.indexOf(assets[asset]) === -1) {
          seen.push(assets[asset]);
        }
      }
    }
    var grouped = splitAssets(seen);
    var declared = this.stylesheetOrder;
    var rank = function (sheet) {
      var at = declared.indexOf(sheet);
      return at === -1 ? declared.length : at;
    };
    grouped.css = grouped.css
      .map(function (sheet, at) {
        return { sheet: sheet, at: at };
      })
      .sort(function (left, right) {
        return rank(left.sheet) - rank(right.sheet) || left.at - right.at;
      })
      .map(function (entry) {
        return entry.sheet;
      });
    return grouped;
  };

  var shared = new Renderer();

  var api = {
    Markup: Markup,
    Renderer: Renderer,
    markup: function (value) {
      return new Markup(value);
    },
    isMarkup: isMarkup,
    escape: escape,
    escapeText: escapeText,
    isTruthy: isTruthy,
    join: join,
    compileTemplate: compileTemplate,
    renderSource: renderSource,
    renderNodeTree: renderNodeTree,
    templatePaths: templatePathsOf,
    createRenderer: function (options) {
      return new Renderer(options);
    },
    shared: shared,
    register: function (templates) {
      return shared.register(templates);
    },
    registerComponents: function (document) {
      return shared.registerComponents(document);
    },
    render: function (componentId, data, options) {
      return shared.render(componentId, data, options);
    },
    componentIds: function () {
      return shared.componentIds();
    },
    templateSlots: function (componentId) {
      return shared.templateSlots(componentId);
    },
    componentAssets: function (componentId) {
      return shared.componentAssets(componentId);
    },
    componentSchemas: function (componentId) {
      return shared.componentSchemas(componentId);
    },
    pageAssets: function (componentIds) {
      return shared.pageAssets(componentIds);
    }
  };

  // -- self-test and parity check (Node only; inert in a browser) ----------

  function revive(value) {
    if (Array.isArray(value)) {
      return value.map(revive);
    }
    if (value !== null && typeof value === "object") {
      var keys = Object.keys(value);
      if (keys.length === 1 && keys[0] === "__markup__") {
        return new Markup(value.__markup__);
      }
      var out = {};
      for (var index = 0; index < keys.length; index += 1) {
        out[keys[index]] = revive(value[keys[index]]);
      }
      return out;
    }
    return value;
  }
  api.revive = revive;

  function selfTest(log) {
    var failures = [];
    var count = 0;

    function check(name, condition, detail) {
      count += 1;
      if (!condition) {
        failures.push(name + (detail ? ": " + detail : ""));
      }
    }
    function expectError(name, call) {
      count += 1;
      try {
        call();
      } catch (error) {
        if (error && error.name === "TemplateError") {
          return;
        }
        failures.push(name + ": wrong error " + (error && error.name));
        return;
      }
      failures.push(name + ": expected TemplateError, nothing was thrown");
    }

    var escaped = String(
      renderSource("{{ a }}", { a: 'Ada "Tiny" O\'Neil & Co <script>' })
    );
    check("escapes ampersand", escaped.indexOf("&amp;") !== -1, escaped);
    check("escapes angle brackets", escaped.indexOf("&lt;script&gt;") !== -1, escaped);
    check("escapes double quote", escaped.indexOf("&quot;") !== -1, escaped);
    check("escapes single quote", escaped.indexOf("&#x27;") !== -1, escaped);

    check(
      "dotted path resolves",
      String(renderSource("{{ a.b.c }}", { a: { b: { c: "deep" } } })) === "deep"
    );
    check(
      "missing key renders empty",
      String(renderSource("[{{ nope }}]", {})) === "[]"
    );
    check(
      "missing intermediate renders empty",
      String(renderSource("[{{ a.b.c }}]", { a: {} })) === "[]"
    );
    check(
      "null renders empty",
      String(renderSource("[{{ a }}]", { a: null })) === "[]"
    );
    check(
      "false renders empty, true renders true, zero renders zero",
      String(renderSource("[{{ a }}][{{ b }}][{{ c }}]", { a: false, b: true, c: 0 })) ===
        "[][true][0]"
    );
    check(
      "empty collections render empty",
      String(renderSource("[{{ a }}][{{ b }}]", { a: [], b: {} })) === "[][]"
    );

    var raw = String(
      renderSource("{{ a }}|{{ b }}", { a: new Markup("<b>x</b>"), b: "<b>x</b>" })
    );
    check("markup is not escaped", raw === "<b>x</b>|&lt;b&gt;x&lt;/b&gt;", raw);
    check(
      "render output nests without re-escaping",
      String(renderSource("<i>{{ s }}</i>", { s: renderSource("{{ a }}", { a: "<b>" }) })) ===
        "<i>&lt;b&gt;</i>"
    );
    check(
      "join keeps marked parts raw and escapes the rest",
      String(join([new Markup("<li>a</li>"), "<li>b</li>", null], "")) ===
        "<li>a</li>&lt;li&gt;b&lt;/li&gt;"
    );

    check(
      "each iterates",
      String(renderSource("{{ #each xs }}[{{ this }}]{{ /each }}", { xs: ["a", "b"] })) ===
        "[a][b]"
    );
    check(
      "each over an absent path renders nothing",
      String(renderSource("[{{ #each nope }}x{{ /each }}]", {})) === "[]"
    );
    check(
      "item keys shadow the outer scope",
      String(
        renderSource("{{ #each xs }}{{ label }}{{ /each }}", {
          label: "outer",
          xs: [{ label: "inner" }, {}]
        })
      ) === "innerouter"
    );
    check(
      "if and unless follow the shared truthiness rule",
      String(
        renderSource(
          "{{ #if a }}A{{ /if }}{{ #unless b }}B{{ /unless }}{{ #if c }}C{{ /if }}",
          { a: [1], b: [], c: {} }
        )
      ) === "AB"
    );

    expectError("unknown block", function () {
      renderSource("{{ #with a }}{{ /with }}", {});
    });
    expectError("unclosed block", function () {
      renderSource("{{ #each xs }}", {});
    });
    expectError("crossed block", function () {
      renderSource("{{ #if a }}{{ /each }}", {});
    });
    expectError("stray close", function () {
      renderSource("{{ /if }}", {});
    });
    expectError("non-identifier placeholder", function () {
      renderSource("{{ 3 + 4 }}", {});
    });
    expectError("non-empty collection in a value slot", function () {
      renderSource("{{ a }}", { a: ["x"] });
    });
    expectError("each over a scalar", function () {
      renderSource("{{ #each a }}x{{ /each }}", { a: "text" });
    });
    expectError("strict mode on a missing slot", function () {
      renderSource("{{ a }}", {}, { strict: true });
    });
    check(
      "prototype escapes are not followed",
      String(renderSource("[{{ a.constructor }}]", { a: {} })) === "[]"
    );
    check(
      "comments are stripped",
      String(renderSource("<!-- note {{ a }} -->x", { a: "y" })) === "x"
    );
    check(
      "keepComments retains them",
      String(renderSource("<!-- {{ a }} -->", { a: "y" }, { keepComments: true })) ===
        "<!-- y -->"
    );

    shared.register({ probe: '<p data-uwp-component="probe">{{ a }}</p>' });
    check("registered template renders", String(shared.render("probe", { a: "z" })) === '<p data-uwp-component="probe">z</p>');
    shared.registerComponents({
      components: [
        { id: "probe", template: "src/html/probe.html", assets: ["src/css/a.css", "src/js/b.js"], schemas: ["schemas/c.json"] }
      ]
    });
    var assets = shared.componentAssets("probe");
    check("componentAssets splits by kind", assets.css.length === 1 && assets.js.length === 1);
    check("pageAssets deduplicates", shared.pageAssets(["probe", "probe"]).css.length === 1);

    /* A page whose first component needs the later sheet and not the earlier
     * one: first-use order would load them backwards, and the declared
     * cascade order is what puts them right. Must match the same check in
     * tools/render.py. */
    var ordering = new Renderer();
    ordering.registerComponents({
      stylesheet_order: ["src/css/first.css", "src/css/second.css"],
      components: [
        { id: "late", assets: ["src/css/second.css"] },
        { id: "early", assets: ["src/css/first.css", "src/css/second.css", "src/css/loose.css"] }
      ]
    });
    var ordered = ordering.pageAssets(["late", "early"]).css;
    check(
      "pageAssets puts stylesheets back into the declared cascade order",
      ordered.join(",") === "src/css/first.css,src/css/second.css,src/css/loose.css",
      ordered.join(",")
    );
    count += 1;
    try {
      shared.render("absent-component", {});
      failures.push("unknown component: expected UnknownComponentError");
    } catch (error) {
      if (error.name !== "UnknownComponentError") {
        failures.push("unknown component: wrong error " + error.name);
      }
    }

    if (failures.length) {
      log("FAIL: " + failures.length + " of " + count + " checks failed");
      failures.forEach(function (failure) {
        log("  - " + failure);
      });
      return 1;
    }
    log("PASS: " + count + " render checks (JavaScript)");
    return 0;
  }
  api.selfTest = selfTest;

  /* Compare this renderer's output against the Python renderer's, case by
   * case, byte for byte. Input is the JSON from tools/render.py
   * --parity-fixture. */
  function parityCheck(fixture, log) {
    var cases = (fixture && fixture.cases) || [];
    var mismatches = 0;
    for (var index = 0; index < cases.length; index += 1) {
      var testCase = cases[index];
      var actual;
      try {
        actual = String(
          stampVersion(
            renderSource(testCase.template, revive(testCase.data)),
            testCase.stamp,
            testCase.version
          )
        );
      } catch (error) {
        log("MISMATCH " + testCase.name + ": " + error.name + ": " + error.message);
        mismatches += 1;
        continue;
      }
      if (actual !== testCase.expected) {
        mismatches += 1;
        log("MISMATCH " + testCase.name);
        var limit = Math.max(actual.length, testCase.expected.length);
        for (var at = 0; at < limit; at += 1) {
          if (actual.charAt(at) !== testCase.expected.charAt(at)) {
            log("  first difference at character " + at);
            log("    python: " + JSON.stringify(testCase.expected.slice(Math.max(0, at - 40), at + 40)));
            log("    browser: " + JSON.stringify(actual.slice(Math.max(0, at - 40), at + 40)));
            break;
          }
        }
      }
    }
    if (mismatches) {
      log("FAIL: " + mismatches + " of " + cases.length + " templates differ between the renderers");
      return 1;
    }
    log("PASS: " + cases.length + " template(s) render identically in both renderers");
    return 0;
  }
  api.parityCheck = parityCheck;

  if (
    typeof process !== "undefined" &&
    process.argv &&
    typeof console !== "undefined"
  ) {
    var log = function (line) {
      console.log(line);
    };
    if (process.argv.indexOf("--self-test") !== -1) {
      process.exitCode = selfTest(log);
    } else if (process.argv.indexOf("--parity") !== -1) {
      var chunks = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", function (chunk) {
        chunks += chunk;
      });
      process.stdin.on("end", function () {
        process.exitCode = parityCheck(JSON.parse(chunks), log);
      });
    }
  }

  return api;
});
