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
      ["Research", "/research/"],
      ["Academics", "/academics/"],
      ["Admissions", "/admissions/"],
      ["People", "/people/"],
      ["Contact", "/contact-us/"],
      ["Campus", "/life-at-mit-wpu/"],
      ["Search", "/search/"],
    ];
    var path = window.location.pathname.replace(/\/+$/, "/");
    nav.replaceChildren();
    links.forEach(function (item) {
      var link = document.createElement("a");
      link.textContent = item[0];
      link.href = item[1];
      if (
        path === item[1]
        || (item[1] !== "/" && path.indexOf(item[1]) === 0)
      ) {
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

  function initMobileNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-global-nav]");
    if (!toggle || !nav) return;
    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setOpen(false);
    });
    document.addEventListener("click", function (event) {
      if (
        nav.classList.contains("is-open")
        && !event.target.closest("[data-global-masthead]")
      ) {
        setOpen(false);
      }
    });
    window.matchMedia("(min-width: 768px)").addEventListener("change", function (event) {
      if (event.matches) setOpen(false);
    });
  }

  installInstitutionalLockup();
  installInstitutionalNavigation();
  installScrollReveal();
  initMobileNav();
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
