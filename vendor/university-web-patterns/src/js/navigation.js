/* Masthead navigation: the mobile disclosure panel and the desktop mega-menus.
   Everything here is enhancement — the nav is a real list of links and works
   with this file absent.

   ONE PATTERN. A top-level entry either is a plain link or opens a single
   2D mega panel (`.uwp-nav-item` holding a `.uwp-nav-mega`). There is no second
   kind of dropdown and nothing nested: a panel never opens another panel. That
   is the whole point of this rewrite — the navigation used to mix a
   sideways-cascading fly-out with the mega panel, which was neither uniform nor
   good (diagonal traversal, flicker), and both are gone. Every entry with
   children now behaves and is built identically.

   Two contracts a maintainer needs before touching anything below.

   1. This script sets the `.uwp-js` flag that patterns.css keys the entire
      collapsed-navigation design off (search patterns.css for `.uwp-js`).
      Without the flag the nav degrades to a plain horizontal scroller, which is
      the correct no-JS fallback. A page that loads theme.js but not this file
      gets NO flag, so its accordion never appears and its toggle button stays
      hidden — the nav still works, but not the way that page expected. If the
      flag ever needs to exist without this file's behaviour, it moves to its
      own tiny script; do not add a second setter.

   2. It wires the DOM once, at load, and observes nothing afterwards. Markup
      rendered into the page later — by src/js/render.js in the browser, or by
      any client script — is NOT enhanced. A client that renders navigation
      client-side must insert it before this file runs, or re-run the wiring
      itself. */
(() => {
  document.documentElement.classList.add("uwp-js");

  // How the panel opens, and why each number is what it is.
  //
  // The panel is a DOM child of its entry, so the entry's `:hover` and its
  // `mouseleave` both already span the trigger AND the panel: a pointer
  // travelling from the word in the bar down into the panel never leaves the
  // entry, so nothing has to reach across a gap. The close delay only has to
  // cover a pointer that clips a corner for a frame.
  //
  // Opening is a plain dwell. Entering an entry starts OPEN_DELAY; if the
  // pointer is still on the entry when it fires, the panel opens — whether or
  // not the pointer ever moved again. A fast sweep leaves each entry before the
  // delay elapses, so `mouseleave` cancels the timer (and the callback also
  // re-checks `:hover`), and a crossing opens nothing.
  //
  // A 2026 revision instead armed the open only from a `mousemove` measuring
  // the pointer below a rest-speed, to keep even a slow sweep from opening
  // anything. It backfired on the commonest case of all: a pointer that comes
  // to rest and holds STILL emits no `mousemove`, so it produced no sample and
  // the menu never opened — the reader had to jiggle the cursor to reveal it.
  // Measuring speed to find rest cannot see the most complete rest there is. A
  // clock needs no motion, so the dwell cannot have that fault.
  const CLOSE_DELAY = 200; // ms the panel stays after the pointer leaves the entry
  const OPEN_DELAY = 110; // ms a pointer must dwell on an entry before it opens
  const EDGE_GAP = 12; // px kept between the panel and the viewport edge

  const desktop = window.matchMedia("(min-width: 56.01rem)");
  // Pointer hover is an enhancement for a mouse or trackpad, never the
  // authority for touch. Keep the layout breakpoint coupled to patterns.css,
  // while disclosure clicks continue to own every coarse-pointer interaction.
  const fineHover = window.matchMedia(
    "(min-width: 56.01rem) and (hover: hover) and (pointer: fine)",
  );

  const items = [...document.querySelectorAll(".uwp-nav-item")];

  // aria-expanded is NOT read off `.is-open`, because the panel also shows on
  // `:focus-within` (a keyboard Tab into it), which sets no class. Deriving the
  // attribute from what patterns.css actually reveals — rule for rule — is what
  // stops a screen reader being told a menu is closed while it is open in front
  // of the reader:
  //
  //     showing = (is-open OR focus-within) AND NOT is-dismissed
  //
  // `.is-open` stays exactly what it was: the record of a deliberate open by
  // hover, click or arrow key. `.is-dismissed` is Escape's mark — focus is
  // still inside, so `:focus-within` would otherwise keep the panel revealed
  // after the reader dismissed it.
  const isShowing = (item) =>
    !item.classList.contains("is-dismissed") &&
    (item.classList.contains("is-open") || item.matches(":focus-within"));

  const syncExpanded = (item) => {
    item
      .querySelector(":scope > [data-uwp-nav-disclosure]")
      ?.setAttribute("aria-expanded", String(isShowing(item)));
  };

  // Near the right edge the panel would run off screen; measured while revealed
  // but within the same synchronous task, before paint, so there is no flash.
  // Without scripting the panel falls back to the masthead-wide layout, which
  // cannot overflow — see the `html:not(.uwp-js)` rules in patterns.css.
  const placePanel = (item) => {
    const panel = item.querySelector(":scope > .uwp-nav-mega");
    if (!panel) return;
    panel.classList.remove("uwp-nav-mega--left");
    if (!desktop.matches) return; // the accordion lays out in flow
    const viewport = document.documentElement.clientWidth;
    const spill = panel.getBoundingClientRect().right - (viewport - EDGE_GAP);
    if (spill <= 0) return;
    // The flip only helps while the panel then fits on the left. A panel wider
    // than the room either way is left hanging off the right, which is legible
    // from the start of the reading order; pushed off the left the masthead's
    // `overflow-x: clip` would cut its first column instead.
    panel.classList.add("uwp-nav-mega--left");
    if (EDGE_GAP - panel.getBoundingClientRect().left > spill) {
      panel.classList.remove("uwp-nav-mega--left");
    }
  };

  const setOpen = (item, open) => {
    item.classList.toggle("is-open", open);
    if (open) {
      item.classList.remove("is-dismissed");
      placePanel(item);
    } else if (item.matches(":focus-within")) {
      // Closing an entry the reader is still inside has to dismiss it, or
      // `:focus-within` goes on showing the panel and the close does nothing a
      // reader can see.
      item.classList.add("is-dismissed");
    }
    syncExpanded(item);
  };

  // One panel at a time on desktop: a masthead-wide panel and a neighbour must
  // never stack. (The mobile accordion is not exclusive — several entries may
  // sit expanded in the scrolled panel, so this is desktop-only by being called
  // only from the desktop paths below.)
  const closeOthers = (keep) => {
    for (const item of items) {
      if (item !== keep && item.classList.contains("is-open")) {
        setOpen(item, false);
      }
    }
  };

  const openExclusively = (item) => {
    closeOthers(item);
    setOpen(item, true);
  };

  // ---- Mobile: the whole primary-navigation panel -------------------------
  for (const toggle of document.querySelectorAll("[data-uwp-nav-toggle]")) {
    const navigation = toggle.getAttribute("aria-controls")
      ? document.getElementById(toggle.getAttribute("aria-controls"))
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

  // ---- Every entry: disclosure button, hover-intent, keyboard -------------
  for (const item of items) {
    const disclosure = item.querySelector(":scope > [data-uwp-nav-disclosure]");

    // Click / touch / Enter-Space on the button: a straight toggle. On desktop
    // it opens exclusively; in the accordion it opens alongside its siblings.
    disclosure?.addEventListener("click", (event) => {
      event.preventDefault();
      const open = !item.classList.contains("is-open");
      if (open && desktop.matches) openExclusively(item);
      else setOpen(item, open);
    });

    // Hover-intent: a plain dwell timer, not inferred cursor speed. Entering an
    // entry starts the clock; if the pointer is still on the entry when it
    // fires, the panel opens — whether or not the pointer ever moved again,
    // which is exactly what a still cursor needs and what the speed test could
    // not do.
    let openTimer = 0;
    let closeTimer = 0;

    const arm = () => {
      if (!fineHover.matches) return;
      window.clearTimeout(openTimer);
      openTimer = window.setTimeout(() => {
        // Re-checked, not assumed: a crossing pointer has already left (its
        // mouseleave cleared this), so only an entry still under the pointer
        // opens; and an Escape inside the delay may have dismissed it.
        if (!item.matches(":hover") || item.classList.contains("is-dismissed")) {
          return;
        }
        openExclusively(item);
      }, OPEN_DELAY);
    };

    item.addEventListener("mouseenter", () => {
      if (!fineHover.matches) return;
      // Entering starts the dwell clock and drops any pending close. A sweep
      // enters every entry it crosses but leaves each before the clock elapses,
      // so the mouseleave below cancels it; only a genuine rest lasts long
      // enough to open.
      window.clearTimeout(closeTimer);
      arm();
    });

    item.addEventListener("mouseleave", () => {
      if (!fineHover.matches) return;
      // A pending open is dropped, not left to fire from outside the entry. The
      // close waits out the grace period so a clipped corner does not shut a
      // panel the reader is heading into; re-entry cancels it (mouseenter).
      window.clearTimeout(openTimer);
      openTimer = 0;
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(() => setOpen(item, false), CLOSE_DELAY);
    });

    fineHover.addEventListener?.("change", (event) => {
      if (event.matches) return;
      window.clearTimeout(openTimer);
      window.clearTimeout(closeTimer);
      openTimer = 0;
      closeTimer = 0;
      if (!item.matches(":focus-within")) setOpen(item, false);
    });

    // A panel opened by click or arrow keys has no mouseleave to close it, so
    // it closes when focus leaves the entry — it is a menu, not a dialog, and
    // holds no focus trap.
    item.addEventListener("focusout", (event) => {
      if (event.relatedTarget && item.contains(event.relatedTarget)) return;
      // Focus has genuinely left, so an Escape that dismissed the entry has
      // nothing left to suppress; forget it.
      item.classList.remove("is-dismissed");
      if (!desktop.matches || item.matches(":hover")) {
        // Not closing (hover owns it, or the accordion holds it), but
        // `:focus-within` is now false, so aria may have flipped with no class
        // change.
        syncExpanded(item);
        return;
      }
      setOpen(item, false);
    });

    // Keyboard focus reveals the panel through `:focus-within`, which no handler
    // above sees; sync aria and measure the edge so a panel reached by Tab flips
    // exactly as a hovered one does. Deliberately does NOT call setOpen: a mouse
    // click focuses the button before its own handler runs, and opening here
    // would make that handler read the entry as already open and close it.
    item.addEventListener("focusin", () => {
      syncExpanded(item);
      if (desktop.matches) placePanel(item);
    });
  }

  // A click outside every open panel closes them all: a wide panel left over
  // the page is a curtain, not a menu. Desktop only — the accordion lives
  // inside the nav panel the toggle handler already owns.
  document.addEventListener("click", (event) => {
    if (!desktop.matches) return;
    for (const item of items) {
      if (item.classList.contains("is-open") && !item.contains(event.target)) {
        setOpen(item, false);
      }
    }
  });

  // Arrow keys, desktop only. Left/Right step across the top-level entries;
  // Down opens the focused entry and walks its links; Up walks back. This is
  // the disclosure-navigation pattern, not a menubar: links keep their natural
  // roles and tabindex, Tab still moves freely, and the accordion keeps plain
  // document order.
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
      const next =
        entries[entries.indexOf(entry) + (event.key === "ArrowRight" ? 1 : -1)];
      if (!next) return;
      event.preventDefault();
      (next.matches("a") ? next : next.querySelector(":scope > a"))?.focus();
      return;
    }

    // Down/Up walk one entry's own links; a plain top-level link has none.
    if (!entry.matches(".uwp-nav-item")) return;
    event.preventDefault();
    if (event.key === "ArrowDown" && !entry.classList.contains("is-open")) {
      openExclusively(entry);
    }
    const links = [...entry.querySelectorAll("a")].filter(
      (link) => link.getClientRects().length,
    );
    const target =
      links[links.indexOf(active) + (event.key === "ArrowDown" ? 1 : -1)];
    target?.focus();
  });

  // Escape closes any open panel and returns focus to its top-level link, where
  // a reader who just dismissed a panel expects to be. Clearing `.is-open` is
  // not enough: the returned focus lands inside the entry, so `:focus-within`
  // would hold the panel open with the class already gone. `.is-dismissed`
  // outranks the reveal (see patterns.css) until the entry is opened again or
  // focus leaves it, both of which clear it above.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const item = document.activeElement?.closest(".uwp-nav-item");
    for (const open of items) {
      if (open.classList.contains("is-open")) setOpen(open, false);
    }
    if (item) {
      item.classList.add("is-dismissed");
      (
        item.querySelector(":scope > .uwp-nav-item__link") ||
        item.querySelector(":scope > a")
      )?.focus();
      syncExpanded(item);
    }
  });
})();
