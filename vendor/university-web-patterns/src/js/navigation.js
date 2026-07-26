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
    });
  }

  // Edge-aware fly-out direction. Default placement is to the right of the row;
  // if that overflows the viewport, flip the panel to the left. Measured while
  // the panel is revealed but within the same synchronous task, before paint,
  // so there is no flash. The mega panel needs none of this: it is pinned to
  // both masthead edges by CSS alone.
  const placeFlyout = (branch) => {
    const flyout = branch.querySelector(":scope > .uwp-nav-flyout");
    if (!flyout) return;
    flyout.classList.remove("uwp-nav-flyout--left");
    const overflowsRight =
      flyout.getBoundingClientRect().right >
      document.documentElement.clientWidth - EDGE_GAP;
    flyout.classList.toggle("uwp-nav-flyout--left", overflowsRight);
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
      if (!desktop.matches) return;
      if (event.relatedTarget && element.contains(event.relatedTarget)) return;
      if (element.matches(":hover")) return;
      setOpen(element, false);
    });

    // Keyboard focus reveals the panel through CSS :focus-within; still measure
    // the fly-out so a focused branch flips at the edge too.
    if (isBranch) {
      element.addEventListener("focusin", () => {
        if (desktop.matches) placeFlyout(element);
      });
    }
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
  // item link, so :focus-within releases and the panel fully collapses.
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
      link?.focus();
    }
  });
})();
