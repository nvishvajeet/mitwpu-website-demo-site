(() => {
  for (const gallery of document.querySelectorAll("[data-uwp-gallery]")) {
    const region = gallery.closest("[data-uwp-component='gallery']");
    const dialog = region?.querySelector("[data-uwp-lightbox]");
    const image = dialog?.querySelector("[data-uwp-lightbox-image]");
    const caption = dialog?.querySelector("[data-uwp-lightbox-caption]");
    if (!dialog || !image || !caption) continue;

    gallery.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-uwp-gallery-item]");
      const source = trigger?.querySelector("img");
      if (!source) return;
      image.src = trigger.dataset.fullSrc || source.currentSrc || source.src;
      image.alt = source.alt;
      caption.textContent = trigger.dataset.caption || "";
      dialog.showModal();
    });

    dialog
      .querySelector("[data-uwp-lightbox-close]")
      ?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  }
})();
