(function () {
  "use strict";

  var storageKey = "site-theme";
  var root = document.documentElement;
  var media = window.matchMedia("(prefers-color-scheme: dark)");

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
    else root.removeAttribute("data-theme");

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
