(function () {
  "use strict";

  function setText(selector, value) {
    var element = document.querySelector(selector);
    if (element && value !== undefined && value !== null) {
      element.textContent = String(value);
    }
  }

  function setPhases(selector, phases) {
    var container = document.querySelector(selector);
    if (!container || !Array.isArray(phases)) return;
    container.replaceChildren();
    phases.forEach(function (phase) {
      var card = document.createElement("section");
      card.className = "status-phase";

      var heading = document.createElement("h3");
      heading.textContent = String(phase.name);
      card.appendChild(heading);

      var summary = document.createElement("p");
      summary.className = "status-phase-summary";
      var percentage = document.createElement("strong");
      percentage.textContent = String(phase.percentage) + "%";
      summary.appendChild(percentage);
      summary.appendChild(document.createTextNode(" · " + String(phase.state)));
      card.appendChild(summary);

      var track = document.createElement("div");
      track.className = "status-phase-meter";
      track.setAttribute("role", "progressbar");
      track.setAttribute("aria-label", String(phase.name));
      track.setAttribute("aria-valuemin", "0");
      track.setAttribute("aria-valuemax", "100");
      track.setAttribute("aria-valuenow", String(phase.percentage));
      var fill = document.createElement("span");
      fill.style.width = String(phase.percentage) + "%";
      track.appendChild(fill);
      card.appendChild(track);

      container.appendChild(card);
    });
  }

  function render(status) {
    var weightedTotal = 0;
    var totalWeight = 0;
    if (Array.isArray(status.phases)) {
      status.phases.forEach(function (phase) {
        if (
          Number.isFinite(phase.weight) &&
          Number.isFinite(phase.percentage)
        ) {
          weightedTotal += phase.weight * phase.percentage;
          totalWeight += phase.weight;
        }
      });
    }
    var percentage = totalWeight
      ? Math.round(weightedTotal / totalWeight)
      : status.percentage;
    setText("[data-percentage]", percentage);
    setText("[data-phase]", status.phase);
    setText("[data-updated]", status.updated_at);
    setText("[data-eta]", status.eta);
    setPhases("[data-phases]", status.phases);

    var meter = document.querySelector("[data-meter]");
    var progress = document.querySelector('[role="progressbar"]');
    if (meter) meter.style.width = percentage + "%";
    if (progress) progress.setAttribute("aria-valuenow", percentage);
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
