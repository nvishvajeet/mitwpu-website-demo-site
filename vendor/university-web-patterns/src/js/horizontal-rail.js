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
