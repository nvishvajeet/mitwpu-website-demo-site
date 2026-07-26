#!/usr/bin/env node
/* Render the Bioinformatics microsite's page shell from university-web-patterns.
 *
 *     node bioinformatics/shell.mjs           # rewrite the five pages in place
 *     node bioinformatics/shell.mjs --check   # exit 1 if any page is out of date
 *     node bioinformatics/shell.mjs --ids     # the component ids the bundle needs
 *
 * Modelled on quantum/shell.mjs, which is the worked example. Read that file's
 * header first; this one only records where Bioinformatics differs.
 *
 * Why this runs at build time rather than in the browser
 * -----------------------------------------------------
 * The rendered shell is written into the HTML, not injected on load, because
 * the shell is load bearing for checks that only ever see the static file:
 *
 *   - tools/audit_template_provenance.py parses the released artifact with
 *     html.parser. A skip link or a footer that only exists after a script
 *     runs is, to that audit, missing.
 *   - tools/build_public_demo.py:install_global_masthead finds its insertion
 *     point by matching `class="… institution-bar"` in the source text.
 *   - the bypass link, the navigation and the footer are the parts of a page
 *     that must survive JavaScript being off.
 *
 * What is different here from quantum
 * -----------------------------------
 * This site has no renderer of its own: its pages load ../quantum/render.js
 * verbatim, and data.js publishes `window.RESEARCH_GROUP` for it to find. That
 * has two consequences.
 *
 * First, the template bundle emitted here has to satisfy a file this site does
 * not own, so TEMPLATE_IDS is checked against ../quantum/render.js rather than
 * maintained by hand — see checkSharedRenderer below.
 *
 * Second, that renderer requires `window.uwp`, and before this migration these
 * pages loaded neither the package renderer nor a template bundle. They threw
 * on load and rendered no research areas, no people and no contacts at all.
 * The three package scripts these pages now carry are what fix that; the
 * assertion in assertScripts is what keeps them.
 *
 * Templates are inlined at build time, never fetched (PROPAGATION_MODEL §2):
 *
 *     python3 vendor/university-web-patterns/tools/render.py --emit-js-templates \
 *         --ids "$(node bioinformatics/shell.mjs --ids)" \
 *         > bioinformatics/patterns.templates.js
 *
 * Regenerate that bundle after every `adopt_patterns.py` run, then re-run this
 * script. `--check` proves the committed pages match what the pinned package
 * renders today.
 */

/* Loaded for their side effects, in this order. render.js defines the global
 * `uwp`; patterns.templates.js registers itself with whatever it finds there.
 *
 * The package documents `const uwp = require(".../render.js")` for Node, and
 * that does not work here: this repository sets "type": "module", so every
 * .js file in it — including the vendored ones — is loaded as ESM, and
 * `require()` of an ESM file returns the module namespace rather than
 * `module.exports`. Both files assign to `globalThis` as well, so the global is
 * the wiring that works in both kinds of repository. */
import "../vendor/university-web-patterns/src/js/render.js";
import "./patterns.templates.js";

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/* The copyright line, composed from the one file that decides it.
 *
 * tools/uwp_shell.mjs is deliberately not imported here: it registers the
 * package's whole component set on the shared `uwp` global at import time and
 * this file registers its own bundle from ./patterns.templates.js. This is one
 * data field, not a second copy of the shell — and the year is optional,
 * because the footer file currently carries none.
 */
function copyrightNotice(holder) {
  const { copyright } = JSON.parse(
    readFileSync(
      path.join(HERE, "..", "demo-assets", "institutional-footer.json"),
      "utf8",
    ),
  );
  return ["©", copyright.year, holder].filter(Boolean).join(" ");
}


const uwp = globalThis.uwp;
uwp.registerComponents(
  JSON.parse(
    readFileSync(
      path.join(HERE, "../vendor/university-web-patterns/components.json"),
      "utf8",
    ),
  ),
);

/* Every component either half of this microsite renders. The first seven are
 * this file's; the rest are ../quantum/render.js's, in the browser. One list,
 * because one bundle and one stylesheet serve both.
 *
 * Two ids quantum/shell.mjs carries are deliberately absent: publication-group
 * and publication-groups. The shared renderer registers no use of them — its
 * publications page is local markup, because the package's component has no
 * slot beside the title for a person's external research-profile links, and on
 * this site those links are the entire reason someone with no selected
 * publications appears on the page at all. checkSharedRenderer catches it if
 * that ever changes. */
const SHELL_IDS = [
  "skip-link",
  "institution-bar",
  "masthead",
  "nav-item",
  "theme-toggle",
  "breadcrumbs",
  "footer",
];

const SHARED_RENDERER = "../quantum/render.js";

const TEMPLATE_IDS = [
  ...SHELL_IDS,
  "person-card",
  "portrait",
  "publication-list",
  "profile",
  "profile-section",
  "profile-detail-list",
  "profile-links",
  /* Rendered by the shared ../quantum/render.js, which carries the group
   * hiring notice. Not used on this site's pages today — no page here has the
   * container — but the bundle has to be able to render everything the shared
   * renderer can reach. */
  "notice",
];

/* The browser half of this site is a file in another directory, so the bundle
 * and that file can drift apart without anything noticing until a page throws
 * `unknown component` at a visitor. Read the ids straight out of it. */
function checkSharedRenderer() {
  const source = readFileSync(path.join(HERE, SHARED_RENDERER), "utf8");
  const used = new Set(
    [...source.matchAll(/uwp\.render\(\s*"([^"]+)"/g)].map((match) => match[1]),
  );
  const missing = [...used].filter((id) => !TEMPLATE_IDS.includes(id));
  if (missing.length) {
    throw new Error(
      `${SHARED_RENDERER} renders ${missing.join(", ")}, which is not in ` +
        "TEMPLATE_IDS in bioinformatics/shell.mjs. Add it, re-emit " +
        "bioinformatics/patterns.templates.js, and re-run this script.",
    );
  }
}

/* The stylesheets a page needs are recorded per component in components.json,
 * not guessed. Getting this wrong is silent: person-card and portrait are
 * styled in media.css rather than patterns.css, so leaving it out renders a
 * structurally correct directory in which every portrait is a full-width
 * image. Assert the registry's answer against what style.css imports. */
function checkStylesheets() {
  const wanted = uwp
    .pageAssets(TEMPLATE_IDS)
    .css.map((asset) => `../vendor/university-web-patterns/${asset}`);
  const stylesheet = readFileSync(path.join(HERE, "style.css"), "utf8");
  const missing = wanted.filter((href) => !stylesheet.includes(href));
  if (missing.length) {
    throw new Error(
      `bioinformatics/style.css does not import ${missing.join(", ")}, which ` +
        "components.json says these components need.",
    );
  }
}

/* The scripts, in the order the pages load them. The package renderer and the
 * template bundle have to precede the shared renderer, which throws without
 * them; navigation.js is what the masthead's `data-uwp-nav-toggle` button
 * needs, and is the only way to open the primary navigation below 56rem.
 *
 * The registry's other script, the package's own theme.js, is deliberately NOT
 * loaded. group-assets/theme.js is this repository's equivalent and does more:
 * it also installs the institutional lockup and replaces the institution bar's
 * links with the university-wide navigation. Both drive the toggle from the
 * same element; the legacy `data-theme-toggle` attribute the decoration below
 * restores is what connects them. */
const REQUIRED_SCRIPTS = [
  "../vendor/university-web-patterns/src/js/render.js",
  "patterns.templates.js",
  "../vendor/university-web-patterns/src/js/navigation.js",
  SHARED_RENDERER,
];

function assertScripts(html, file) {
  const positions = REQUIRED_SCRIPTS.map((src) => [
    src,
    html.indexOf(`<script src="${src}"`),
  ]);
  const missing = positions.filter(([, at]) => at === -1).map(([src]) => src);
  if (missing.length) {
    throw new Error(
      `${file}: does not load ${missing.join(", ")}. ${SHARED_RENDERER} ` +
        "throws without the package renderer and its template bundle, and " +
        "the mobile menu button does nothing without navigation.js.",
    );
  }
  for (let index = 1; index < positions.length; index += 1) {
    if (positions[index][1] < positions[index - 1][1]) {
      throw new Error(
        `${file}: loads ${positions[index][0]} before ` +
          `${positions[index - 1][0]}. These are deferred classic scripts, ` +
          "so they run in document order and the order is the contract.",
      );
    }
  }
}

/* -- the site's own data -------------------------------------------------
 *
 * Build-time only, so it lives here rather than in data.js: no page reads it
 * at runtime, and shipping it to the browser would be bytes nothing uses.
 */

const site = {
  name: "Bioinformatics Group",
  parent_name: "Department of Biosciences and Technology",
  home_url: "index.html",
};

const institution = {
  name: "MIT World Peace University · Pune, India",
  home_url: "../",
};

/* The institution bar's outbound links. group-assets/theme.js replaces the
 * contents of `.institution-links` on load with the university-wide
 * navigation and moves the theme toggle into it, so this is the no-JavaScript
 * form of that bar rather than what a visitor with scripts on will see.
 *
 * These two are internal, unlike Photonics' pair, which point at the real
 * university. Hence the `external` flag rather than a hardcoded new-tab link. */
const institutionLinks = [
  { label: "Research", href: "../research/" },
  { label: "People", href: "../people/" },
];

/* "Research profiles" rather than "Publications": this group publishes no
 * selected bibliography, and the page is a set of links to external indexes.
 * The label is the page's, not a house style, so it is data here. */
const navigation = [
  { page: "home", label: "Home", href: "index.html" },
  { page: "research", label: "Research", href: "research.html" },
  { page: "people", label: "People", href: "people.html" },
  {
    page: "publications",
    label: "Research profiles",
    href: "publications.html",
  },
  { page: "contact", label: "Contact", href: "contact.html" },
];

const footer = {
  location: "MIT World Peace University · Pune, India",
  /* The hand-written footer had one flat block of five links laid out in two
   * CSS columns. The package models a footer column as a group, so the same
   * five links become two named regions — which is also what a screen-reader
   * user gets to list and tell apart. Headings stay hidden, as they were. */
  groups: [
    {
      label: "This group",
      hide_heading: true,
      links: [
        { label: "Research", href: "research.html" },
        { label: "People", href: "people.html" },
        { label: "Research profiles", href: "publications.html" },
        { label: "Contact", href: "contact.html" },
      ],
    },
    {
      label: "University",
      hide_heading: true,
      links: [{ label: "MIT-WPU", href: "../" }],
    },
  ],
  /* Read from demo-assets/institutional-footer.json, not from any clock. The
   * hand-written footer filled this from `new Date().getFullYear()` in the
   * browser — so the line was also blank with JavaScript off — and this
   * generator then did the same from the build machine's, which meant the year
   * on the page and the year in the repository could disagree. When the year
   * was dropped from the footer file, the page had to be hand-edited to
   * follow, which is what put this generator and its own output out of step.
   * The file is the one place it is decided now, for the microsites as for the
   * institution. */
  note: copyrightNotice("MIT-WPU"),
};

/* Ancestors are the same on every page; only the last crumb changes. */
const breadcrumbAncestors = [
  { label: "Research", href: "../research/" },
  { label: "Research groups", href: "../groups/" },
  { label: "Bioinformatics group", href: "index.html" },
];

const pages = [
  { file: "index.html", page: "home", crumb: "Home" },
  { file: "research.html", page: "research", crumb: "Research" },
  { file: "people.html", page: "people", crumb: "People" },
  {
    file: "publications.html",
    page: "publications",
    crumb: "Research profiles",
  },
  { file: "contact.html", page: "contact", crumb: "Contact" },
];

const NAV_ID = "bioinformatics-primary-nav";

/* -- the transitional class scaffold -------------------------------------
 *
 * The package hardcodes its own class names and offers no slot for a second
 * one. Three things in this repository still match on the legacy names:
 *
 *   audit_template_provenance.py   `skip-link`, `site-footer`
 *   build_public_demo.py           `institution-bar`, `institution-links`
 *                                  (the anchors install_global_masthead
 *                                  searches for)
 *   group-assets/{site.css,theme.js}
 *                                  `.institution-bar`, `.institution-inner`,
 *                                  `.institution-home`, `.institution-links`,
 *                                  `.site-header`, `.site-nav`,
 *                                  `[data-theme-toggle]`
 *
 * All three match by token membership and tolerate extra tokens, so both names
 * can ride on one element and every existing assertion keeps passing
 * unmodified. This is done here, on rendered output — never by editing a
 * vendored template, which would fork the package and be caught by
 * `adopt_patterns.py --check`.
 *
 * `institution-home` is on this list and is not on quantum's. It is the hook
 * theme.js:installInstitutionalLockup replaces with the MIT-WPU logo; when it
 * is missing that function falls back to *prepending* the lockup, so the page
 * shows the logo and the plain-text home link side by side. Worth back-porting
 * to quantum/shell.mjs.
 *
 * Deliberately NOT added: `global-masthead`. install_global_masthead prepends
 * its own header carrying that token and the audit requires exactly one per
 * page; adding it here would make two.
 */
const LEGACY_DECORATIONS = [
  ['class="uwp-skip-link"', 'class="uwp-skip-link skip-link"'],
  [
    'class="uwp-institution-bar"',
    'class="uwp-institution-bar institution-bar"',
  ],
  [
    'class="uwp-institution-bar__inner uwp-shell"',
    'class="uwp-institution-bar__inner uwp-shell shell institution-inner"',
  ],
  [
    'class="uwp-institution-bar__home"',
    'class="uwp-institution-bar__home institution-home"',
  ],
  ['class="uwp-masthead"', 'class="uwp-masthead site-header"'],
  [
    'class="uwp-masthead__inner uwp-shell"',
    'class="uwp-masthead__inner uwp-shell shell header-inner"',
  ],
  ['class="uwp-nav" id=', 'class="uwp-nav site-nav" id='],
  [
    'class="uwp-theme-toggle" type="button" data-uwp-theme-toggle',
    'class="uwp-theme-toggle theme-toggle" type="button" data-theme-toggle data-uwp-theme-toggle',
  ],
  ['class="uwp-breadcrumbs"', 'class="uwp-breadcrumbs orientation-bar"'],
  ['class="uwp-footer"', 'class="uwp-footer site-footer"'],
  [
    'class="uwp-footer__grid uwp-shell"',
    'class="uwp-footer__grid uwp-shell shell footer-grid"',
  ],
];

function decorate(html) {
  let out = String(html);
  for (const [from, to] of LEGACY_DECORATIONS) {
    if (!out.includes(from)) continue;
    out = out.split(from).join(to);
  }
  return tidy(out);
}

/* The grammar has no `else`, so a template that renders one of two forms
 * spells it as `{{ #unless x }}…{{ /unless }}{{ #if x }}…{{ /if }}` with blank
 * lines around each. The branch that does not render leaves its blank lines
 * behind: footer.html emits three of them per link, nav-item.html four per
 * entry. Dropping blank lines changes no element and no text node. */
function tidy(html) {
  return html
    .split("\n")
    .filter((line) => line.trim() !== "")
    .join("\n");
}

/* Applied after decorate() so a package change that renames one of these
 * fails the build instead of silently dropping a legacy hook. */
const REQUIRED_TOKENS = [
  "skip-link",
  "institution-bar",
  "institution-inner",
  "institution-home",
  "institution-links",
  "site-header",
  "site-nav",
  "data-theme-toggle",
  "site-footer",
];

function assertLegacyHooks(html, file) {
  const missing = REQUIRED_TOKENS.filter((token) => !html.includes(token));
  if (missing.length) {
    throw new Error(
      `${file}: the rendered shell lost legacy hook(s) ${missing.join(", ")}. ` +
        "Update LEGACY_DECORATIONS in bioinformatics/shell.mjs to match the " +
        "package's current markup — do not edit the vendored template.",
    );
  }
}

/* -- composition ---------------------------------------------------------- */

function indent(html, spaces) {
  const pad = " ".repeat(spaces);
  return html
    .replace(/\n+$/, "")
    .split("\n")
    .map((line) => (line.trim() === "" ? "" : pad + line))
    .join("\n");
}

function institutionBarLinks() {
  const links = institutionLinks
    .map((link) =>
      link.external
        ? `<a href="${link.href}" target="_blank" rel="noopener noreferrer">` +
          `${uwp.escapeText(link.label)} <span aria-hidden="true">↗</span>` +
          '<span class="uwp-visually-hidden">(opens in a new tab)</span></a>'
        : `<a href="${link.href}">${uwp.escapeText(link.label)}</a>`,
    )
    .join("");
  return uwp.markup(
    `<nav class="institution-links" aria-label="Institutional links">${links}</nav>`,
  );
}

function brand() {
  return uwp.markup(
    `<a class="uwp-brand brand" href="${site.home_url}">` +
      `<strong>${uwp.escapeText(site.name)}</strong>` +
      `<small>${uwp.escapeText(site.parent_name)}</small></a>`,
  );
}

function navigationItems(current) {
  /* nav-item is two mutually exclusive blocks with blank lines between them,
   * so the branch that does not render still leaves its surrounding blank
   * lines behind. The renderer never re-indents a slot's content either. Both
   * are cosmetic and both are the client's to tidy. */
  const items = navigation.map((entry) =>
    String(
      uwp.render("nav-item", {
        item: {
          label: entry.label,
          href: entry.href,
          /* An attribute fragment, so it has to be Markup. */
          aria_current:
            entry.page === current ? uwp.markup(' aria-current="page"') : "",
        },
      }),
    ).trim(),
  );
  return uwp.markup(items.join("\n        "));
}

function breadcrumbItems(crumb) {
  const ancestors = breadcrumbAncestors.map(
    (item) =>
      `<li><a href="${item.href}">${uwp.escapeText(item.label)}</a></li>`,
  );
  ancestors.push(
    `<li><span aria-current="page">${uwp.escapeText(crumb)}</span></li>`,
  );
  return uwp.markup(ancestors.join("\n    "));
}

function shellTop(page) {
  const parts = [
    uwp.render("skip-link", {
      skip: { href: "#main", label: "Skip to content" },
    }),
    uwp.render("institution-bar", {
      institution,
      institution_bar_links: institutionBarLinks(),
    }),
    uwp.render("masthead", {
      site,
      navigation: { id: NAV_ID },
      brand: brand(),
      navigation_items: navigationItems(page.page),
      theme_toggle: uwp.render("theme-toggle", {}),
    }),
    uwp.render("breadcrumbs", {
      breadcrumb_items: breadcrumbItems(page.crumb),
    }),
  ];
  return decorate(parts.map(String).join(""));
}

function shellBottom() {
  return decorate(String(uwp.render("footer", { site, footer })));
}

/* -- page rewriting ------------------------------------------------------- */

const MARKERS = {
  top: ["<!-- uwp:shell-top -->", "<!-- /uwp:shell-top -->"],
  bottom: ["<!-- uwp:shell-bottom -->", "<!-- /uwp:shell-bottom -->"],
};

function replaceRegion(source, [open, close], body, file) {
  const start = source.indexOf(open);
  const end = source.indexOf(close);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(
      `${file}: missing ${open} … ${close}. Every page this script owns has ` +
        "to mark the region the shell is written into.",
    );
  }
  return (
    source.slice(0, start + open.length) +
    "\n" +
    indent(body, 2) +
    "\n  " +
    source.slice(end)
  );
}

function renderPage(source, page) {
  let out = replaceRegion(source, MARKERS.top, shellTop(page), page.file);
  out = replaceRegion(out, MARKERS.bottom, shellBottom(), page.file);
  assertLegacyHooks(out, page.file);
  assertScripts(out, page.file);
  return out;
}

function main(argv) {
  if (argv.includes("--ids")) {
    process.stdout.write(`${TEMPLATE_IDS.join(",")}\n`);
    return 0;
  }
  const check = argv.includes("--check");
  checkSharedRenderer();
  checkStylesheets();
  const stale = [];
  for (const page of pages) {
    const file = path.join(HERE, page.file);
    const source = readFileSync(file, "utf8");
    const updated = renderPage(source, page);
    if (updated === source) continue;
    if (check) stale.push(page.file);
    else writeFileSync(file, updated);
  }
  if (check && stale.length) {
    process.stderr.write(
      `bioinformatics shell is out of date in: ${stale.join(", ")}\n` +
        "Run: node bioinformatics/shell.mjs\n",
    );
    return 1;
  }
  const version = uwp.shared.version || "(unversioned)";
  process.stdout.write(
    check
      ? `bioinformatics shell matches university-web-patterns ${version}\n`
      : `bioinformatics shell rendered into ${pages.length} pages ` +
        `from university-web-patterns ${version}\n`,
  );
  return 0;
}

process.exitCode = main(process.argv.slice(2));
