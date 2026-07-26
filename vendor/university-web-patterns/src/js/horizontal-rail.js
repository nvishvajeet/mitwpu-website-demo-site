/* Previous/next buttons for the horizontal rail. Enhancement: the rail is a
   natively scrollable, keyboard-reachable overflow container without this.

   One step is one item, measured from the first child's rendered width plus
   the computed column-gap, rather than from a fixed number of pixels — the
   rail carries cards of different widths on different pages, and a fixed step
   leaves items half-cut at the edge. The clientWidth * 0.8 branch is only for
   an empty rail, where there is no item to measure.

   Wired once at load; a rail whose items arrive later gets no buttons. */
(() => {
  for (const rail of document.querySelectorAll("[data-uwp-rail]")) {
    const shell = rail.closest(".uwp-rail-shell");
    if (!shell) continue;

    const move = (direction) => {
      const firstItem = rail.firstElementChild;
      const gap = Number.parseFloat(getComputedStyle(rail).columnGap) || 0;
      const distance = firstItem
        ? firstItem.getBoundingClientRect().width + gap
        : rail.clientWidth * 0.8;
      rail.scrollBy({left: direction * distance, behavior: "smooth"});
    };

    shell
      .querySelector("[data-uwp-rail-previous]")
      ?.addEventListener("click", () => move(-1));
    shell
      .querySelector("[data-uwp-rail-next]")
      ?.addEventListener("click", () => move(1));
  }
})();
