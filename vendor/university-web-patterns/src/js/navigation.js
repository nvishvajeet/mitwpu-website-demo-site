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
  // `mouseleave` both already span the trigger AND the panel. That is the whole
  // bridge: a pointer travelling from the word in the bar down into the panel
  // never leaves the entry, so nothing has to reach across a gap the way the
  // old sibling fly-out did. The close delay below only has to cover a pointer
  // that clips a corner for a frame.
  const CLOSE_DELAY = 200; // ms the panel stays after the pointer leaves the entry
  const SETTLE_DELAY = 90; // ms below rest-speed before a hovered entry opens

  // Opening on hover has one hard requirement: a fast horizontal sweep across
  // the whole bar must open NOTHING. The mistake every earlier version made was
  // to arm the open on ENTERING an entry and disarm it on leaving, on the
  // theory that a crossing pointer is inside an entry too briefly to matter.
  // It is not: an unhurried two-second sweep holds each ~85px entry for
  // 400–500ms, longer than any delay that still feels responsive, so every
  // entry crossed opened in turn — a row of sheets thrown down and torn away.
  //
  // What separates a crossing from an arrival is not time in the entry, it is
  // that the crossing is still MOVING. So nothing is armed by entering; a
  // reveal is armed only once a `mousemove` measures the pointer travelling
  // slower than REST_SPEED, and any faster move cancels one already waiting.
  // Cross at any ordinary speed and nothing is ever armed; come to rest on an
  // entry and it opens a settle later. A stalled event stream cannot forge a
  // stop, because the move that resumes it covers a large distance and reads as
  // fast. REST_SPEED is well under an ordinary sweep (~0.34px/ms) and only a
  // pointer deliberately crawling — most of ten seconds to cross the bar —
  // falls under it, where opening each panel in turn is the menu answering.
  const REST_SPEED = 0.1; // px/ms; at or above this the pointer is travelling
  const REST_SLOP = 4; // px of drift still counted as at rest
  const MIN_INTERVAL = 12; // ms; a shorter gap between moves carries no speed
  const EDGE_GAP = 12; // px kept between the panel and the viewport edge

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const desktop = window.matchMedia("(min-width: 56.01rem)");

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

    // Hover-intent. `anchor` is where the current rest began (the slop is
    // measured from it); `last` is the previous sample, so a speed is taken
    // between two real points rather than inferred from silence.
    let openTimer = 0;
    let closeTimer = 0;
    let anchorX = 0;
    let anchorY = 0;
    let lastX = 0;
    let lastY = 0;
    let lastT = 0;

    const arm = (x, y) => {
      window.clearTimeout(openTimer);
      anchorX = x;
      anchorY = y;
      openTimer = window.setTimeout(() => {
        // Re-checked, not assumed: the pointer may have left during the wait,
        // and an Escape inside it may have dismissed the entry from above.
        if (!item.matches(":hover") || item.classList.contains("is-dismissed")) {
          return;
        }
        openExclusively(item);
      }, SETTLE_DELAY);
    };

    item.addEventListener("mouseenter", (event) => {
      // Entering arms nothing — a sweep enters every entry it crosses. Just
      // drop any pending close and seed the speed sample.
      window.clearTimeout(closeTimer);
      window.clearTimeout(openTimer);
      openTimer = 0;
      anchorX = lastX = event.clientX;
      anchorY = lastY = event.clientY;
      lastT = event.timeStamp;
    });

    // Passive: this only reads the pointer, and a listener on every entry of
    // the bar must never be able to hold up a scroll.
    item.addEventListener(
      "mousemove",
      (event) => {
        // Once open the pointer is free to roam the panel — that is the reader
        // using the menu, not deciding to. Re-arming there only re-reveals what
        // is already revealed.
        if (item.classList.contains("is-open")) return;
        if (!finePointer.matches || !desktop.matches) return;
        const dt = event.timeStamp - lastT;
        // Too soon after the last sample to carry a speed: the browser fires
        // several moves per frame, and `mouseenter` shares its timestamp with
        // the move that crossed in. Leave the reference put and let the interval
        // grow, so a stalled stream that resumes far away still reads as travel.
        if (dt < MIN_INTERVAL) return;
        const dist =
          Math.abs(event.clientX - lastX) + Math.abs(event.clientY - lastY);
        lastX = event.clientX;
        lastY = event.clientY;
        lastT = event.timeStamp;
        if (dist / dt >= REST_SPEED) {
          // Travelling: nothing may be left armed, or the next stall in the
          // stream would let it fire mid-sweep. Re-anchor so the clock starts
          // the moment the pointer does slow.
          window.clearTimeout(openTimer);
          openTimer = 0;
          anchorX = event.clientX;
          anchorY = event.clientY;
          return;
        }
        // Slow enough to be settling. Start the clock once, from here; a drift
        // past the slop restarts it, so the reveal lands where the pointer came
        // to rest and not where it first dipped below speed.
        if (
          !openTimer ||
          Math.abs(event.clientX - anchorX) + Math.abs(event.clientY - anchorY) >
            REST_SLOP
        ) {
          arm(event.clientX, event.clientY);
        }
      },
      { passive: true },
    );

    item.addEventListener("mouseleave", () => {
      // A pending open is dropped, not left to fire from outside the entry. The
      // close waits out the grace period so a clipped corner does not shut a
      // panel the reader is heading into; re-entry cancels it (mouseenter).
      window.clearTimeout(openTimer);
      openTimer = 0;
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(() => setOpen(item, false), CLOSE_DELAY);
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
