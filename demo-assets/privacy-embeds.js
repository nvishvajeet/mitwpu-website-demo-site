(function () {
  "use strict";

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-privacy-video]");
    if (!button) return;

    var source = button.getAttribute("data-privacy-video-src");
    if (!source || !source.startsWith("https://www.youtube-nocookie.com/embed/")) {
      return;
    }

    var iframe = document.createElement("iframe");
    iframe.src = source;
    iframe.title =
      button.getAttribute("data-privacy-video-title") || "MIT-WPU video";
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer";
    iframe.allow =
      "accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    button.replaceWith(iframe);
    iframe.focus();
  });
})();
