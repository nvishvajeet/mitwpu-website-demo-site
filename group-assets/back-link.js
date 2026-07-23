(function () {
  "use strict";

  function sameOriginReferrer() {
    if (!document.referrer) return null;
    try {
      const referrer = new URL(document.referrer);
      if (referrer.origin !== window.location.origin) return null;
      if (referrer.href === window.location.href) return null;
      return referrer;
    } catch (_error) {
      return null;
    }
  }

  function backLabel(referrer) {
    if (!referrer) return "← Back to people directory";
    if (/\/people\/(?:index\.html)?$/.test(referrer.pathname)) {
      return "← Back to people directory";
    }
    if (/\/science\/[^/]+\/people\.html$/.test(referrer.pathname)) {
      return "← Back to department people";
    }
    return "← Back";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const referrer = sameOriginReferrer();
    document.querySelectorAll("[data-context-back]").forEach((link) => {
      if (referrer) {
        // Keep only the same-origin path, query, and fragment in the fallback.
        link.href = `${referrer.pathname}${referrer.search}${referrer.hash}`;
      }
      link.textContent = backLabel(referrer);
      link.addEventListener("click", (event) => {
        if (!referrer || window.history.length <= 1) return;
        event.preventDefault();
        window.history.back();
      });
    });
  });
})();
