/* Lightbox for the gallery component. Enhancement: with this file absent each
   thumbnail is still a link to the full image.

   Delegated from the gallery container rather than bound per item, so a
   gallery whose items are rendered in the browser still opens — the one
   enhancement script here that survives later markup, and only because of the
   delegation. Everything else is bound at load.

   `data-full-src` wins over the thumbnail's own source because the visible
   image is a small crop. A full-size source therefore carries paired
   `data-full-width` and `data-full-height`; without a full source, the loaded
   thumbnail's natural size wins and its width/height attributes are the
   fallback. Incomplete media fails closed instead of opening a layout-shifting
   dialog. Uses <dialog>.showModal(), which brings the focus trap and Escape
   handling with it — do not reimplement those. */
(() => {
  const positiveInteger = (value) => {
    const number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : 0;
  };

  const lightboxRecord = (trigger, source) => {
    const fullSource = trigger.dataset.fullSrc || "";
    const width = positiveInteger(
      fullSource
        ? trigger.dataset.fullWidth
        : source.naturalWidth || source.getAttribute("width"),
    );
    const height = positiveInteger(
      fullSource
        ? trigger.dataset.fullHeight
        : source.naturalHeight || source.getAttribute("height"),
    );
    const src = fullSource || source.currentSrc || source.src;
    if (!src || !width || !height) return null;
    return {
      src,
      width,
      height,
      alt: source.alt,
      caption: trigger.dataset.caption || "",
    };
  };

  const enhance = (root) => {
    for (const gallery of root.querySelectorAll("[data-uwp-gallery]")) {
      const region = gallery.closest("[data-uwp-component='gallery']");
      const dialog = region?.querySelector("[data-uwp-lightbox]");
      const image = dialog?.querySelector("[data-uwp-lightbox-image]");
      const caption = dialog?.querySelector("[data-uwp-lightbox-caption]");
      if (!dialog || !image || !caption) continue;

      gallery.addEventListener("click", (event) => {
        const trigger = event.target.closest("[data-uwp-gallery-item]");
        const source = trigger?.querySelector("img");
        if (!source) return;
        const record = lightboxRecord(trigger, source);
        if (!record) return;
        image.width = record.width;
        image.height = record.height;
        image.src = record.src;
        image.alt = record.alt;
        caption.textContent = record.caption;
        dialog.showModal();
      });

      dialog
        .querySelector("[data-uwp-lightbox-close]")
        ?.addEventListener("click", () => dialog.close());
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
    }
  };

  const selfTest = () => {
    const source = {
      naturalWidth: 960,
      naturalHeight: 640,
      currentSrc: "/assets/gallery/thumb.jpg",
      src: "/assets/gallery/thumb.jpg",
      alt: "A teaching laboratory.",
      getAttribute(name) {
        return name === "width" ? "480" : "320";
      },
    };
    const full = lightboxRecord(
      {
        dataset: {
          fullSrc: "/assets/gallery/full.jpg",
          fullWidth: "1920",
          fullHeight: "1280",
          caption: "The laboratory during a class.",
        },
      },
      source,
    );
    if (
      !full ||
      full.src !== "/assets/gallery/full.jpg" ||
      full.width !== 1920 ||
      full.height !== 1280
    ) {
      throw new Error("full-size intrinsic dimensions are not preserved");
    }
    const thumbnail = lightboxRecord({ dataset: {} }, source);
    if (!thumbnail || thumbnail.width !== 960 || thumbnail.height !== 640) {
      throw new Error("thumbnail natural dimensions are not preserved");
    }
    const attributes = lightboxRecord(
      { dataset: {} },
      { ...source, naturalWidth: 0, naturalHeight: 0 },
    );
    if (!attributes || attributes.width !== 480 || attributes.height !== 320) {
      throw new Error("thumbnail attribute dimensions are not preserved");
    }
    const incomplete = lightboxRecord(
      { dataset: { fullSrc: "/assets/gallery/full.jpg" } },
      source,
    );
    if (incomplete !== null) {
      throw new Error("incomplete full-size metadata must fail closed");
    }
  };

  if (typeof document !== "undefined") enhance(document);
  if (
    typeof process !== "undefined" &&
    process.argv.includes("--self-test")
  ) {
    selfTest();
    process.stdout.write("PASS: gallery runtime media contract\n");
  }
})();
