(function () {
  "use strict";

  const storageKey = "site-theme";
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const institutionalName =
    "Dr. Vishwanath Karad MIT World Peace University";

  function installInstitutionalLockup() {
    const bar = document.querySelector(".institution-bar");
    if (!bar || bar.querySelector(".institutional-lockup")) return;
    const inner = bar.querySelector(".institution-inner");
    if (!inner) return;

    const institutionHome = inner.querySelector(
      ".institution-home, .institution-name",
    );
    const href = institutionHome?.getAttribute("href") || "/";

    const lockup = document.createElement("a");
    lockup.className = "institutional-lockup";
    lockup.href = href;
    lockup.setAttribute("aria-label", `${institutionalName} home`);
    lockup.innerHTML =
      '<img class="institutional-lockup__logo" src="/demo-assets/brand/mitwpu-official-logo.webp" alt="" width="431" height="124" data-media-role="logo">';

    if (institutionHome) institutionHome.replaceWith(lockup);
    else inner.prepend(lockup);
  }

  function installInstitutionalNavigation() {
    const bar = document.querySelector(".institution-bar");
    if (!bar) return;
    const inner = bar.querySelector(".institution-inner");
    if (!inner) return;

    // Older page templates only supplied the university lock-up. Create the
    // standard navigation container so every page gets the same sticky bar.
    let nav = bar.querySelector(".institution-links");
    if (!nav) {
      nav = document.createElement("nav");
      nav.className = "institution-links";
      inner.append(nav);
    }
    const themeToggle = document.querySelector("[data-theme-toggle]");
    const duplicateInstitutionalNav = document.querySelector(
      ".site-header .site-nav.institutional-nav",
    );

    const links = [
      ["About", "/about/"],
      ["Academics", "/academics/"],
      ["Admissions", "/admissions/"],
      ["Research", "/research/"],
      ["People", "/people/"],
      ["Campus", "/life-at-mit-wpu/"],
      ["Search", "/search/"],
    ];
    const path = window.location.pathname.replace(/\/+$/, "/");
    const researchContext = /^\/(?:groups|facilities|photonics|quantum|astrophysics|bioinformatics)\//.test(path);
    nav.replaceChildren();
    nav.setAttribute("aria-label", "University navigation");
    links.forEach(([label, href]) => {
      const link = document.createElement("a");
      link.textContent = label;
      link.href = href;
      if (
        path === href
        || path.startsWith(href)
        || (href === "/research/" && researchContext)
      ) {
        link.setAttribute("aria-current", "page");
      }
      nav.append(link);
    });
    if (themeToggle) nav.append(themeToggle);
    if (duplicateInstitutionalNav && duplicateInstitutionalNav !== nav) {
      duplicateInstitutionalNav.remove();
      document.querySelector(".site-header")?.classList.add(
        "site-header--context-only",
      );
    }
  }

  function storedTheme() {
    try {
      const value = window.localStorage.getItem(storageKey);
      return value === "light" || value === "dark" ? value : "";
    } catch (_error) {
      return "";
    }
  }

  function preferredTheme() {
    return storedTheme() || (media.matches ? "dark" : "light");
  }

  function applyTheme(theme) {
    if (theme === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const dark = theme === "dark";
      button.setAttribute("aria-pressed", String(dark));
      button.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      button.title = dark ? "Switch to light mode" : "Switch to dark mode";
    });
  }

  function toggleTheme() {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    try {
      window.localStorage.setItem(storageKey, next);
    } catch (_error) {
      // The theme still changes for the current page when storage is unavailable.
    }
    applyTheme(next);
  }

  installInstitutionalLockup();
  installInstitutionalNavigation();

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(preferredTheme());
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.addEventListener("click", toggleTheme);
    });
  });

  const followDeviceTheme = (event) => {
    if (!storedTheme()) applyTheme(event.matches ? "dark" : "light");
  };
  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", followDeviceTheme);
  } else if (typeof media.addListener === "function") {
    media.addListener(followDeviceTheme);
  }
})();
