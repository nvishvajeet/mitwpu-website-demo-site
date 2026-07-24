(function () {
  "use strict";

  var root = document.documentElement;
  var button = document.querySelector("[data-theme-toggle]");
  var institutionalName =
    "Dr. Vishwanath Karad MIT World Peace University";

  function installInstitutionalLockup() {
    var header = document.querySelector(".site-header");
    var inner = header && header.querySelector(".header-inner");
    if (!inner || inner.querySelector(".institutional-lockup")) return;

    var existingBrand = inner.querySelector(":scope > .brand");
    var lockup = document.createElement("a");
    lockup.className = "institutional-lockup";
    lockup.href = existingBrand ? existingBrand.getAttribute("href") : "/";
    lockup.setAttribute("aria-label", institutionalName + " home");
    lockup.innerHTML =
      '<img class="institutional-lockup__logo" src="/demo-assets/brand/mitwpu-official-logo.webp" alt="" width="431" height="124" data-media-role="logo">';
    if (existingBrand) existingBrand.replaceWith(lockup);
    else inner.insertBefore(lockup, inner.firstChild);
  }

  function installInstitutionalNavigation() {
    var header = document.querySelector(".site-header");
    if (!header || header.querySelector(".masthead-brands")) return;

    var nav = header.querySelector(".site-nav, .primary-nav");
    if (!nav) return;

    var links = [
      ["Home", "/"],
      ["About", "/about/"],
      ["Academics", "/academics/"],
      ["Admissions", "/admissions/"],
      ["Research", "/research/"],
      ["People", "/people/"],
      ["Campus", "/life-at-mit-wpu/"],
      ["Search", "/search/"],
    ];
    var path = window.location.pathname.replace(/\/+$/, "/");
    nav.replaceChildren();
    links.forEach(function (item) {
      var link = document.createElement("a");
      link.textContent = item[0];
      link.href = item[1];
      if (path === item[1] || path.indexOf(item[1]) === 0) {
        link.setAttribute("aria-current", "page");
      }
      nav.appendChild(link);
    });
  }

  function installScrollReveal() {
    var reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    if (reduceMotion.matches || !("IntersectionObserver" in window)) return;

    var items = Array.prototype.slice.call(
      document.querySelectorAll(
        ".hero-copy, .hero-media, .leader-card, .directory-card, [data-reveal]",
      ),
    );
    if (!items.length) return;

    root.classList.add("reveal-enabled");
    items.forEach(function (item, index) {
      item.classList.add("reveal-item");
      item.style.setProperty("--reveal-delay", String(index % 4 * 45) + "ms");
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  installInstitutionalLockup();
  installInstitutionalNavigation();
  installScrollReveal();
  if (!button) return;

  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function updateButton() {
    var dark = currentTheme() === "dark";
    button.setAttribute("aria-pressed", String(dark));
    button.setAttribute(
      "aria-label",
      dark ? "Use light colour theme" : "Use dark colour theme",
    );
  }

  button.addEventListener("click", function () {
    var next = currentTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("site-theme", next);
    } catch (_error) {
      // The selected theme still applies for the current page.
    }
    updateButton();
  });

  updateButton();
})();
