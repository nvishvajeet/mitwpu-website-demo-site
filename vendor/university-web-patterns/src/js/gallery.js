/* Lightbox for the gallery component. Enhancement: with this file absent each
   thumbnail is still a link to the full image.

   Delegated from the gallery container rather than bound per item, so a
   gallery whose items are rendered in the browser still opens — the one
   enhancement script here that survives later markup, and only because of the
   delegation. Everything else is bound at load.

   `data-full-src` wins over the thumbnail's own source because the visible
   image is a small crop; `currentSrc` before `src` so a responsive picture
   opens the size the browser actually chose. Uses <dialog>.showModal(), which
   brings the focus trap and Escape handling with it — do not reimplement
   those. */
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
