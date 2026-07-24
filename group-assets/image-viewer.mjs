import PhotoSwipeLightbox from "./vendor/photoswipe/photoswipe-lightbox.esm.js";

const gallerySelector = "[data-image-gallery]";

if (document.querySelector(`${gallerySelector} a[data-pswp-item]`)) {
  const lightbox = new PhotoSwipeLightbox({
    gallery: gallerySelector,
    children: "a[data-pswp-item]",
    pswpModule: () => import("./vendor/photoswipe/photoswipe.esm.js"),
    bgOpacity: 0.94,
    clickToCloseNonZoomable: true,
    showHideAnimationType: "fade",
    wheelToZoom: true,
  });

  lightbox.on("uiRegister", () => {
    lightbox.pswp.ui.registerElement({
      name: "caption",
      order: 9,
      isButton: false,
      appendTo: "root",
      html: "",
      onInit: (element, photoSwipe) => {
        const updateCaption = () => {
          const item = photoSwipe.currSlide?.data?.element;
          element.textContent = item?.dataset.pswpCaption || "";
          element.hidden = !element.textContent;
        };
        photoSwipe.on("change", updateCaption);
        updateCaption();
      },
    });
  });

  lightbox.init();
}
