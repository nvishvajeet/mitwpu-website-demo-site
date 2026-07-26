/* The colour-theme switch: reads a stored choice, writes `data-theme` on the
   root element, and keeps every toggle control's state in step.

   This file owns ONE side of the contract in tokens.css. It only ever sets
   `data-theme` to "light" or "dark"; tokens.css does the rest, and gives that
   attribute authority over `prefers-color-scheme` in both directions. Neither
   half means anything alone: without this file a client simply follows the
   system preference, which is the intended no-JS behaviour, and the reason
   nothing here is required for the palette to work.

   Loaded as a deferred script like the rest, so a visitor with a stored
   choice that differs from their system preference may see one frame of the
   other theme. A client that minds should set `data-theme` from its own
   inline head script before first paint — same attribute, same storage key —
   rather than moving this file, which also wires the toggle controls and
   needs the DOM.

   localStorage access is wrapped both ways because a browser configured to
   block storage throws on read AND on write, and a blocked preference store
   must not take the switch down with it. */
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
