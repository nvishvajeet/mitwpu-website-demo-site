/* Designed load states for framed photographs. See demo-assets/media-loading.css
 * for the why; this file is the mechanism.
 *
 * It manages the images that sit in a reserved, clipping frame — cards,
 * portraits, gallery tiles, single-figure heroes — and leaves everything else
 * alone: the masthead logo, footer marks, the profile-link glyphs, and the home
 * hero carousel, which already has its own crossfade and must not be given a
 * second opacity to fight with.
 *
 * The contract is progressive: the class that hides an image (`media-reveal`)
 * and the class that shows it (`is-loaded`) are both added by this script. A
 * cached image is marked loaded in the same tick it is marked revealable, so it
 * never flashes. If the script does not run, no `has-media-reveal` on <html> and
 * nothing is ever hidden. */
(function () {
  "use strict";

  var docEl = document.documentElement;

  // Frames that reserve and clip their box. The image's nearest such ancestor
  // is where the skeleton is drawn; if there is none, its immediate wrapper is
  // used, and if that is not a plain media wrapper the image is left untouched.
  var FRAME_SELECTOR = [
    ".image-zoom-link",
    ".activity-image",
    ".curated-media__card",
    ".uwp-card__media",
    ".uwp-lead-media",
    ".uwp-profile__portrait",
    ".uwp-feature-figure__media",
    ".uwp-feature-figure__frame",
    ".uwp-gallery__grid button",
    ".school-mini-person",
    ".uwp-portrait"
  ].join(",");

  // Never manage an image in these contexts: chrome, brand marks, tiny glyphs,
  // and the self-animating hero carousel.
  var SKIP_SELECTOR = [
    "header",
    "footer",
    ".uwp-masthead",
    ".global-masthead",
    ".global-footer",
    ".institutional-footer",
    ".masthead-brands",
    ".institutional-lockup",
    ".uwp-brand",
    ".uwp-profile-link-icons",
    ".hero-media",
    ".hero-slide",
    "[data-hero-slide]",
    "[data-hero-controls]"
  ].join(",");

  var observer = null;
  function ensureObserver() {
    if (observer || !("IntersectionObserver" in window)) return observer;
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-inview");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "200px 0px" });
    return observer;
  }

  function frameFor(img) {
    var framed = img.closest(FRAME_SELECTOR);
    if (framed && framed.contains(img)) return framed;
    var parent = img.parentElement;
    if (parent && /^(A|FIGURE|PICTURE|BUTTON|SPAN|DIV)$/.test(parent.tagName)) {
      return parent;
    }
    return null;
  }

  function settle(img, frame) {
    img.classList.add("is-loaded");
    if (!frame) return;
    frame.classList.remove("is-media-loading");
    frame.classList.remove("is-inview");
  }

  function manage(img) {
    if (img.dataset.mediaReveal) return;
    if (img.closest(SKIP_SELECTOR)) return;
    var frame = frameFor(img);
    if (!frame) return;

    img.dataset.mediaReveal = "on";
    img.classList.add("media-reveal");

    // Cached and already decoded: reveal in the same tick, no fade, no skeleton.
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add("is-loaded");
      return;
    }

    frame.classList.add("is-media-loading");
    var io = ensureObserver();
    if (io) io.observe(frame); else frame.classList.add("is-inview");

    img.addEventListener("load", function () { settle(img, frame); }, { once: true });
    img.addEventListener("error", function () { settle(img, frame); }, { once: true });
  }

  function scan(root) {
    var images = (root || document).getElementsByTagName("img");
    // Live collection — iterate over a snapshot length.
    for (var i = 0; i < images.length; i++) manage(images[i]);
  }

  function start() {
    docEl.classList.add("has-media-reveal");
    scan(document);

    // The people directory and a few galleries render their cards from data
    // after load, so watch for images inserted later and manage those too.
    if ("MutationObserver" in window) {
      var mo = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
          var added = mutations[i].addedNodes;
          for (var j = 0; j < added.length; j++) {
            var node = added[j];
            if (node.nodeType !== 1) continue;
            if (node.tagName === "IMG") manage(node);
            else if (node.getElementsByTagName) scan(node);
          }
        }
      });
      mo.observe(document.body || docEl, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
