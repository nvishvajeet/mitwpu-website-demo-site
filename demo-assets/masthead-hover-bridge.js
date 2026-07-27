/*
 * Hover-intent for the masthead's level-2 fly-outs.
 *
 * THE FAULT, measured rather than inferred. The cascade menus put their rows
 * in a column and hang each row's fly-out off the column's right edge
 * (`.uwp-nav-flyout { left: 100% }`). A reader who wants the fourth link of a
 * fly-out does not travel right along the row and then down inside the panel;
 * they cut the corner and go down-and-right. That path leaves the row it
 * started on almost immediately — the rows are 44px tall and the panel is
 * 240px to the right — and crosses the rows beneath it.
 *
 * Sampling the straight line from the middle of a branch row to its fly-out
 * with `elementFromPoint` finds the crossing on four of this site's five
 * branches. Driving it with a real pointer produces this, from Research:
 *
 *     enter  Research                      -> Research opens
 *     enter  Research > Research areas     -> its fly-out opens
 *     leave  Research > Research areas     (pointer at 623,202)
 *     close  Research > Research areas     (same millisecond)
 *     OPEN   Research > Research groups
 *
 * The panel the reader was travelling to is replaced, under the cursor,
 * by the one belonging to the row they were merely passing over. Move across
 * two rows and it happens twice. That is the flicker.
 *
 * WHY IT IS NOT A LAYOUT REGRESSION. None of this is about the masthead being
 * one row or two: the geometry that produces it is inside the drop-down
 * panel, and the panel hangs from the same y in both layouts because the bar
 * is 115px either way. It was verified before the two-row bar was reverted and
 * again after, with the same result both times.
 *
 * WHERE THE FIX BELONGS. Upstream, in university-web-patterns'
 * navigation.js. `wireHoverIntent` gives a top-level entry a 220ms close delay
 * (HOVER_CLOSE_DELAY) precisely so a diagonal does not snap it shut, and then
 * gives a `.uwp-nav-branch` no OPEN delay at all — a sibling's `mouseenter`
 * calls `setOpen(sibling, false)` on the open one synchronously. The grace it
 * spends on the way out is undone on the way in. The package fix is a symmetric
 * open delay on the branch level; this repository is pinned at 0.22.0 and
 * Template Central has unreleased work in its tree, so the fix is here for now
 * and should be deleted when the package carries it.
 *
 * WHAT THIS DOES. It holds the switch, and holds it in the only place a client
 * can: a capture-phase listener on the navigation sees a non-bubbling
 * `mouseenter` before the branch's own handlers do, so `stopImmediatePropagation`
 * keeps navigation.js from acting on a row the pointer is only crossing.
 *
 *   - pointer arrives on a branch while a SIBLING fly-out is open
 *       -> the enter is swallowed and held for HOLD ms
 *       -> still on that row when the timer fires: replayed, menus switch
 *       -> gone by then: dropped, and the fly-out the reader aimed at is
 *          still open because it was never told to close
 *   - the matching `mouseleave` on the open branch is swallowed too, but only
 *     while a hold is live and only when the pointer is going to another row
 *     of the SAME menu. Leaving the menu closes it exactly as before.
 *
 * Nothing here touches the keyboard or touch paths: the disclosure buttons,
 * `focusin`/`focusout` and Escape are navigation.js's and are not intercepted.
 * It is bounded to fine pointers on desktop widths, which is the same pair of
 * guards navigation.js puts on its own hover-intent, so the mobile accordion
 * never reaches this code.
 */
(function () {
  "use strict";

  var HOLD = 260; // ms; a corner cut takes 150-250ms, a decision takes longer

  var desktop = window.matchMedia("(min-width: 56.01rem)");
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)");

  function wire(nav) {
    var timer = null;
    var pending = null; // the row the pointer is crossing
    var guarded = null; // the open branch whose fly-out we are protecting

    function reset() {
      window.clearTimeout(timer);
      timer = null;
      pending = null;
      guarded = null;
    }

    nav.addEventListener(
      "mouseenter",
      function (event) {
        var branch = event.target;
        if (!branch || !branch.classList) return;
        if (!branch.classList.contains("uwp-nav-branch")) return;
        // Our own replay. Let it through to navigation.js untouched.
        if (branch.getAttribute("data-uwp-hover-replay") !== null) {
          branch.removeAttribute("data-uwp-hover-replay");
          return;
        }
        if (!desktop.matches || !fine.matches) return;

        var menu = branch.parentElement;
        if (!menu) return;
        var open = menu.querySelector(":scope > .uwp-nav-branch.is-open");
        if (!open || open === branch) return;

        // A sibling fly-out is open and the pointer has arrived here. It may
        // be asking for this row, or it may be on its way past it.
        event.stopImmediatePropagation();
        window.clearTimeout(timer);
        pending = branch;
        guarded = open;
        timer = window.setTimeout(function () {
          var target = pending;
          timer = null;
          pending = null;
          guarded = null;
          if (!target || !target.matches(":hover")) return;
          target.setAttribute("data-uwp-hover-replay", "");
          target.dispatchEvent(new MouseEvent("mouseenter"));
        }, HOLD);
      },
      true,
    );

    nav.addEventListener(
      "mouseleave",
      function (event) {
        var branch = event.target;
        if (branch !== guarded) return;
        // Only while a hold is live, and only for a pointer still inside this
        // branch's own menu. Anything else — leaving the menu, leaving the
        // masthead — is a real departure and closes on navigation.js's own
        // timer, which is the behaviour this file must not change.
        var menu = branch.parentElement;
        var to = event.relatedTarget;
        if (timer && menu && to && menu.contains(to)) {
          event.stopImmediatePropagation();
        }
      },
      true,
    );

    // A pointer that leaves the whole navigation mid-hold must not leave a
    // replay armed to fire behind it.
    nav.addEventListener("mouseleave", function (event) {
      if (event.target === nav) reset();
    });
    desktop.addEventListener?.("change", reset);
  }

  var navigations = document.querySelectorAll(
    "[data-global-masthead] [data-global-nav]",
  );
  for (var index = 0; index < navigations.length; index += 1) {
    wire(navigations[index]);
  }
})();
