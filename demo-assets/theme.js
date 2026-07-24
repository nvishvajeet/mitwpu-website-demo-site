(function () {
  "use strict";

  var storageKey = "site-theme";
  var root = document.documentElement;
  var media = window.matchMedia("(prefers-color-scheme: dark)");
  var institutionalName =
    "Dr. Vishwanath Karad MIT World Peace University";

  function installInstitutionalLockup() {
    var header = document.querySelector(".site-header");
    if (!header || header.querySelector(".institutional-lockup")) return;

    var inner = header.querySelector(".header-inner, .site-header__inner");
    if (!inner) return;

    var existingBrand = inner.querySelector(
      ":scope > .brand, :scope > .wordmark, :scope > .academic-brand"
    );
    var normalizedBrand = existingBrand
      ? existingBrand.textContent.replace(/\s+/g, " ").trim()
      : "";
    var genericBrand = normalizedBrand === "MIT World Peace University";
    var institutionHome = document.querySelector(".institution-home");
    var href = institutionHome
      ? institutionHome.getAttribute("href")
      : genericBrand && existingBrand
        ? existingBrand.getAttribute("href")
        : "/";

    var lockup = document.createElement("a");
    lockup.className = "institutional-lockup";
    lockup.href = href;
    lockup.setAttribute("aria-label", institutionalName + " home");
    lockup.innerHTML =
      '<img class="institutional-lockup__logo" src="/demo-assets/brand/mitwpu-official-logo.webp" alt="" width="431" height="124" data-media-role="logo">';

    if (genericBrand) {
      existingBrand.replaceWith(lockup);
      return;
    }

    var brands = document.createElement("div");
    brands.className = "masthead-brands";
    inner.insertBefore(brands, existingBrand || inner.firstChild);
    brands.appendChild(lockup);
    if (existingBrand) brands.appendChild(existingBrand);
  }

  function installInstitutionalNavigation() {
    var header = document.querySelector(".site-header");
    if (!header || header.querySelector(".masthead-brands")) return;

    var nav = header.querySelector(".site-nav, .primary-nav");
    if (!nav) return;

    var links = [
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

  function storedTheme() {
    try {
      var value = window.localStorage.getItem(storageKey);
      return value === "light" || value === "dark" ? value : "";
    } catch (_error) {
      return "";
    }
  }

  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function preferredTheme() {
    return storedTheme() || (media.matches ? "dark" : "light");
  }

  function applyTheme(theme) {
    if (theme === "dark") root.setAttribute("data-theme", "dark");
    else root.setAttribute("data-theme", "light");

    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      var dark = theme === "dark";
      button.setAttribute("aria-pressed", String(dark));
      button.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      button.title = dark ? "Switch to light mode" : "Switch to dark mode";
    });
  }

  function toggleTheme() {
    var next = currentTheme() === "dark" ? "light" : "dark";
    try {
      window.localStorage.setItem(storageKey, next);
    } catch (_error) {
      // The selected theme still applies to the current page.
    }
    applyTheme(next);
  }

  installInstitutionalLockup();
  installInstitutionalNavigation();

  document.addEventListener("DOMContentLoaded", function () {
    applyTheme(preferredTheme());
    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      button.addEventListener("click", toggleTheme);
    });
  });

  function followDeviceTheme(event) {
    if (!storedTheme()) applyTheme(event.matches ? "dark" : "light");
  }

  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", followDeviceTheme);
  } else if (typeof media.addListener === "function") {
    media.addListener(followDeviceTheme);
  }
})();
