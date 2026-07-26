(() => {
  const root = document.documentElement;
  const storageKey = "uwp-theme";
  let saved = null;

  try {
    saved = window.localStorage.getItem(storageKey);
  } catch {
    saved = null;
  }

  if (saved === "light" || saved === "dark") {
    root.dataset.theme = saved;
  }

  const effectiveTheme = () => {
    if (root.dataset.theme) return root.dataset.theme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const updateControls = () => {
    const dark = effectiveTheme() === "dark";
    for (const control of document.querySelectorAll("[data-uwp-theme-toggle]")) {
      control.setAttribute("aria-pressed", String(dark));
      control.setAttribute(
        "aria-label",
        dark ? "Switch to light theme" : "Switch to dark theme",
      );
    }
  };

  for (const control of document.querySelectorAll("[data-uwp-theme-toggle]")) {
    control.addEventListener("click", () => {
      const next = effectiveTheme() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try {
        window.localStorage.setItem(storageKey, next);
      } catch {
        /* A blocked preference store must not break theme switching. */
      }
      updateControls();
    });
  }

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener?.("change", updateControls);
  updateControls();
})();
