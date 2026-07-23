(function () {
  "use strict";

  function setText(selector, value) {
    var element = document.querySelector(selector);
    if (element && value !== undefined && value !== null) {
      element.textContent = String(value);
    }
  }

  function setList(selector, items) {
    var list = document.querySelector(selector);
    if (!list || !Array.isArray(items)) return;
    list.replaceChildren();
    items.forEach(function (item) {
      var row = document.createElement("li");
      row.textContent = String(item);
      list.appendChild(row);
    });
  }

  function render(status) {
    setText("[data-percentage]", status.percentage);
    setText("[data-phase]", status.phase);
    setText("[data-updated]", status.updated_at);
    setText("[data-eta]", status.eta);
    setText("[data-pune-pages]", status.pune_pages);
    setText("[data-pune-media]", status.pune_media);
    setText("[data-goa-pages]", status.goa_pages);
    setText("[data-goa-media]", status.goa_media);
    setList("[data-completed]", status.completed);
    setList("[data-in-progress]", status.in_progress);
    setList("[data-blockers]", status.blockers);

    var meter = document.querySelector("[data-meter]");
    var progress = document.querySelector('[role="progressbar"]');
    if (meter) meter.style.width = status.percentage + "%";
    if (progress) progress.setAttribute("aria-valuenow", status.percentage);
    var blockerSection = document.querySelector("[data-blockers-section]");
    if (blockerSection) {
      blockerSection.hidden = !status.blockers || status.blockers.length === 0;
    }
  }

  async function refresh() {
    try {
      var response = await fetch("status.json?time=" + Date.now(), {
        cache: "no-store",
      });
      if (!response.ok) return;
      render(await response.json());
    } catch (_error) {
      return;
    }
  }

  refresh();
  window.setInterval(refresh, 60000);
})();
