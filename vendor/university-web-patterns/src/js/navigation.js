/* Masthead navigation: mobile disclosure, dropdowns, cascading fly-outs and
   the mega panel. Everything here is enhancement — the nav is a real list of
   links and works with this file absent.

   Two contracts a maintainer needs before touching anything below.

   1. This script sets the `.uwp-js` flag that patterns.css keys the entire
      collapsed-navigation design off (search patterns.css for `.uwp-js`).
      Without the flag the nav degrades to a plain horizontal scroller, which
      is the correct no-JS fallback. Consequence: a page that loads theme.js
      but not navigation.js gets NO flag, so its accordion never appears and
      its toggle button stays hidden — the nav still works, but not the way
      that page's author expected. If the flag ever needs to exist without
      this file's behaviour, it moves to its own tiny script; do not add a
      second setter.

   2. It wires the DOM once, at load, and observes nothing afterwards. Markup
      rendered into the page later — by src/js/render.js in the browser, or by
      any client script — is NOT enhanced. A client that renders navigation
      client-side must insert it before this file runs, or re-run the wiring
      itself. The same is true of every other enhancement script here. */
(() => {
  document.documentElement.classList.add("uwp-js");

  const HOVER_CLOSE_DELAY = 220; // ms; bridges diagonal travel to a fly-out
  const EDGE_GAP = 12; // px kept between a fly-out and the viewport edge
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const desktop = window.matchMedia("(min-width: 56.01rem)");

  // One owner may be a top-level `.uwp-nav-item` (nav-item, nav-cascade or
  // nav-mega — the mega panel differs only in CSS) or a cascade's
  // `.uwp-nav-branch`. Opening and closing always go through these two, so
  // the disclosure button's aria-expanded tracks every path that reveals a
  // panel — hover, click, arrow keys — not only its own clicks.
  const setOpen = (owner, open) => {
    owner.classList.toggle("is-open", open);
    if (open) owner.classList.remove("is-dismissed");
    owner
      .querySelector(":scope > [data-uwp-nav-disclosure]")
      ?.setAttribute("aria-expanded", String(open));
  };

  // Top-level panels are exclusive on desktop: a masthead-wide mega panel and
  // a neighbouring drop-down must never stack. The mobile accordion is not
  // exclusive — several entries may sit expanded in the scrolled panel.
  const closeSiblings = (owner) => {
    const nav = owner.closest("[data-uwp-nav]");
    if (!nav) return;
    for (const open of nav.querySelectorAll(".uwp-nav-item.is-open")) {
      if (open !== owner && !open.contains(owner)) setOpen(open, false);
    }
  };

  // Mobile disclosure toggle for the whole primary-navigation panel.
  for (const toggle of document.querySelectorAll("[data-uwp-nav-toggle]")) {
    const controlledId = toggle.getAttribute("aria-controls");
    const navigation = controlledId
      ? document.getElementById(controlledId)
      : null;
    if (!navigation) continue;

    const close = () => {
      navigation.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    };

    toggle.addEventListener("click", () => {
      const opening = toggle.getAttribute("aria-expanded") !== "true";
      navigation.classList.toggle("is-open", opening);
      toggle.setAttribute("aria-expanded", String(opening));
      toggle.setAttribute("aria-label", opening ? "Close menu" : "Open menu");
    });

    navigation.addEventListener("click", (event) => {
      if (event.target.closest("a")) close();
    });

    desktop.addEventListener?.("change", (event) => {
      if (event.matches) close();
    });
  }

  // Disclosure buttons toggle a panel for touch + keyboard. A button may sit on
  // a top-level item (level 1) or on a cascade row (level 2); it toggles the
  // nearest of the two, so the same handler serves both levels and the mobile
  // accordion.
  for (const disclosure of document.querySelectorAll(
    "[data-uwp-nav-disclosure]",
  )) {
    const owner = disclosure.closest(".uwp-nav-branch, .uwp-nav-item");
    if (!owner) continue;
    disclosure.addEventListener("click", (event) => {
      event.preventDefault();
      const open = !owner.classList.contains("is-open");
      if (open && desktop.matches) closeSiblings(owner);
      setOpen(owner, open);
      // `placeMega` and `placeFlyout` are declared below; a click cannot run
      // before this file has finished evaluating, so neither is in its
      // temporal dead zone here.
      if (open) {
        if (owner.classList.contains("uwp-nav-branch")) placeFlyout(owner);
        else placeMega(owner);
      }
    });
  }

  // Edge-aware panel direction. Both the cascade fly-out and the mega panel
  // hang from one edge of the thing that opened them and can overflow the
  // viewport near the right edge; both answer by flipping to the opposite
  // edge. Measured while the panel is revealed but within the same synchronous
  // task, before paint, so there is no flash. Without this script the mega
  // panel falls back to the masthead-wide layout, which cannot overflow —
  // see the `html:not(.uwp-js)` rules in patterns.css.
  const place = (owner, selector, edgeClass) => {
    const panel = owner.querySelector(`:scope > ${selector}`);
    if (!panel) return;
    panel.classList.remove(edgeClass);
    const viewport = document.documentElement.clientWidth;
    const spill = panel.getBoundingClientRect().right - (viewport - EDGE_GAP);
    if (spill <= 0) return;

    // The flip is only an improvement while the panel fits on the other side.
    // A panel wider than the room either way — a four-column mega on a 1024px
    // laptop — is pushed off the LEFT edge instead, where the masthead's
    // `overflow-x: clip` cuts it off and a reader sees a panel with its first
    // column missing rather than its last. Overflowing right is at least
    // legible from the start of the reading order, so the worse of the two is
    // measured and rejected rather than assumed not to happen.
    panel.classList.add(edgeClass);
    if (EDGE_GAP - panel.getBoundingClientRect().left > spill) {
      panel.classList.remove(edgeClass);
    }
  };

  const placeFlyout = (branch) =>
    place(branch, ".uwp-nav-flyout", "uwp-nav-flyout--left");

  // Desktop only: the mobile accordion lays the panel out in flow, where the
  // edge classes mean nothing and a stale one would survive the resize.
  const placeMega = (item) => {
    if (!item.classList.contains("uwp-nav-item--mega")) return;
    const panel = item.querySelector(":scope > .uwp-nav-mega");
    if (!panel) return;
    if (!desktop.matches) {
      panel.classList.remove("uwp-nav-mega--left");
      return;
    }
    place(item, ".uwp-nav-mega", "uwp-nav-mega--left");
  };

  // Hover-intent for both levels. Open on pointer enter; close after a short
  // delay so a brief diagonal exit toward a nested panel does not snap it shut.
  // Fine pointers on wide viewports only; coarse pointers use the accordion.
  const wireHoverIntent = (element, isBranch) => {
    let closeTimer;

    const open = () => {
      window.clearTimeout(closeTimer);
      if (!finePointer.matches || !desktop.matches) return;
      if (isBranch) {
        const menu = element.closest(".uwp-nav-menu");
        if (menu) {
          for (const sibling of menu.querySelectorAll(
            ":scope > .uwp-nav-branch.is-open",
          )) {
            if (sibling !== element) setOpen(sibling, false);
          }
        }
      } else {
        closeSiblings(element);
      }
      setOpen(element, true);
      if (isBranch) placeFlyout(element);
      else placeMega(element);
    };

    const scheduleClose = () => {
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(() => {
        setOpen(element, false);
      }, HOVER_CLOSE_DELAY);
    };

    element.addEventListener("mouseenter", open);
    element.addEventListener("mouseleave", scheduleClose);

    // A panel opened by click or arrow keys has no mouseleave to close it, so
    // it closes when focus leaves it — it is a menu, not a dialog, and holds
    // no focus trap. The :hover guard keeps a pointer click on the disclosure
    // from closing-then-reopening on browsers that do not focus buttons on
    // click, and skips the case hover-intent already owns.
    element.addEventListener("focusout", (event) => {
      if (event.relatedTarget && element.contains(event.relatedTarget)) return;
      // Focus has genuinely left the entry, so an Escape that dismissed it has
      // nothing left to suppress; forget it before the guards below, which are
      // about closing rather than about the dismissal.
      element.classList.remove("is-dismissed");
      if (!desktop.matches) return;
      if (element.matches(":hover")) return;
      setOpen(element, false);
    });

    // Keyboard focus reveals the panel through CSS :focus-within, which no
    // handler above sees; measure on focus too so a panel reached by Tab or
    // the arrow keys flips at the edge exactly as a hovered one does.
    element.addEventListener("focusin", () => {
      if (!desktop.matches) return;
      if (isBranch) placeFlyout(element);
      else placeMega(element);
    });
  };

  for (const item of document.querySelectorAll(".uwp-nav-item")) {
    wireHoverIntent(item, false);
  }
  for (const branch of document.querySelectorAll(".uwp-nav-branch")) {
    wireHoverIntent(branch, true);
  }

  // A click that lands outside every open panel closes them all: a wide mega
  // panel left open over the page is a curtain, not a menu. Desktop only —
  // the mobile accordion sits inside the nav panel the [data-uwp-nav-toggle]
  // handler already owns.
  document.addEventListener("click", (event) => {
    if (!desktop.matches) return;
    for (const open of document.querySelectorAll(
      ".uwp-nav-item.is-open, .uwp-nav-branch.is-open",
    )) {
      if (!open.contains(event.target)) setOpen(open, false);
    }
  });

  // Arrow keys, desktop only: Left/Right step across the top-level entries,
  // Down opens the focused entry's panel and walks its links, Up walks back.
  // This is the disclosure-navigation pattern, not a menubar: links keep
  // their natural roles and tabindex, Tab still moves freely, and the mobile
  // accordion keeps its plain document order.
  const ARROWS = ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"];
  document.addEventListener("keydown", (event) => {
    if (!ARROWS.includes(event.key) || !desktop.matches) return;
    const active = document.activeElement;
    const nav = active?.closest?.("[data-uwp-nav]");
    if (!nav) return;

    const entries = [...nav.children].filter((child) =>
      child.matches("a, .uwp-nav-item"),
    );
    const entry = entries.find((candidate) => candidate.contains(active));
    if (!entry) return;

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const step = event.key === "ArrowRight" ? 1 : -1;
      const next = entries[entries.indexOf(entry) + step];
      if (!next) return;
      event.preventDefault();
      (next.matches("a") ? next : next.querySelector(":scope > a"))?.focus();
      return;
    }

    // Down/Up walk one entry's own links; plain top-level links have none.
    if (!entry.matches(".uwp-nav-item")) return;
    event.preventDefault();
    if (event.key === "ArrowDown" && !entry.classList.contains("is-open")) {
      closeSiblings(entry);
      setOpen(entry, true);
    }
    const links = [...entry.querySelectorAll("a")].filter(
      (link) => link.getClientRects().length,
    );
    const target =
      links[links.indexOf(active) + (event.key === "ArrowDown" ? 1 : -1)];
    target?.focus();
  });

  // Escape closes any open dropdown/fly-out and returns focus to the top-level
  // item link, which is where a reader who has just dismissed a panel expects
  // to be — not thrown back to the top of the document.
  //
  // Clearing `is-open` is not enough to collapse it. Under `.uwp-js` the panel
  // is revealed by `.is-open` OR `:focus-within` on the entry, and the link
  // focus lands inside the entry, so `:focus-within` holds the panel open with
  // `is-open` already gone — Escape appeared to do nothing. `is-dismissed`
  // outranks the reveal (see patterns.css) and lasts until the entry is opened
  // again or focus leaves it, both of which clear the class above.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const item = document.activeElement?.closest(".uwp-nav-item");
    for (const open of document.querySelectorAll(
      ".uwp-nav-branch.is-open, .uwp-nav-item.is-open",
    )) {
      setOpen(open, false);
    }
    if (item) {
      const link =
        item.querySelector(":scope > .uwp-nav-item__link") ||
        item.querySelector(":scope > a");
      item.classList.add("is-dismissed");
      link?.focus();
    }
  });
})();
