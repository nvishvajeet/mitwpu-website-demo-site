(function () {
  "use strict";

  const facility = window.MITWPU_CRF || {
    capabilities: [],
    clusters: [],
    leadership: [],
    facultyContacts: []
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      "\"": "&quot;"
    })[character]);
  }

  function safeUrl(value) {
    if (typeof value !== "string" || value.trim() === "") return "";
    try {
      const url = new URL(value.trim(), window.location.href);
      return ["https:", "http:"].includes(url.protocol) ? url.href : "";
    } catch (_error) {
      return "";
    }
  }

  function equipmentCount() {
    return facility.clusters.reduce((total, cluster) => total + cluster.instruments.length, 0);
  }

  function capabilityInstruments(capability) {
    const clusterIds = new Set(capability.clusterIds || []);
    return facility.clusters
      .filter((cluster) => clusterIds.has(cluster.id))
      .flatMap((cluster) => cluster.instruments);
  }

  function capabilitySummary(capability) {
    const instruments = capabilityInstruments(capability);
    return `<article class="cluster-summary">
      <span class="cluster-number">${escapeHtml(capability.number)}</span>
      <div>
        <h3><a href="capabilities/${encodeURIComponent(capability.id)}/">${escapeHtml(capability.name)}</a></h3>
        <p>${escapeHtml(capability.summary)}</p>
        <p class="cluster-count">${instruments.length} ${instruments.length === 1 ? "research system" : "research systems"}</p>
      </div>
    </article>`;
  }

  function instrumentCard(instrument) {
    return `<article class="instrument-card">
      <p class="instrument-short-name">${escapeHtml(instrument.shortName)}</p>
      <h3>${escapeHtml(instrument.name)}</h3>
      <p class="instrument-model">${escapeHtml(instrument.model)}</p>
      <p>${escapeHtml(instrument.use)}</p>
    </article>`;
  }

  function renderOverview() {
    const target = document.getElementById("capability-overview");
    if (target) target.innerHTML = facility.capabilities.map(capabilitySummary).join("");
    document.querySelectorAll("[data-equipment-count]").forEach((node) => {
      node.textContent = equipmentCount();
    });
    document.querySelectorAll("[data-capability-count]").forEach((node) => {
      node.textContent = facility.capabilities.length;
    });
  }

  function renderInstruments() {
    const target = document.getElementById("instrument-clusters");
    if (!target) return;
    target.innerHTML = facility.clusters.map((cluster) => `
      <section class="instrument-cluster" id="${escapeHtml(cluster.id)}">
        <div class="instrument-cluster-heading">
          <span class="cluster-number">${escapeHtml(cluster.number)}</span>
          <div>
            <h2>${escapeHtml(cluster.name)}</h2>
            <p>${escapeHtml(cluster.summary)}</p>
          </div>
        </div>
        <div class="instrument-grid">${cluster.instruments.map(instrumentCard).join("")}</div>
      </section>`).join("");
  }

  function personRow(person) {
    const source = safeUrl(person.source);
    return `<article class="facility-person">
      <div>
        <h3>${source ? `<a href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer">${escapeHtml(person.name)}</a>` : escapeHtml(person.name)}</h3>
        <p>${escapeHtml(person.role)}</p>
      </div>
    </article>`;
  }

  function renderPeople() {
    const leadership = document.getElementById("research-leadership");
    if (leadership) leadership.innerHTML = facility.leadership.map(personRow).join("");
    const faculty = document.getElementById("facility-contacts");
    if (faculty) faculty.innerHTML = facility.facultyContacts.map(personRow).join("");
  }

  function initialize() {
    const active = document.body.dataset.page;
    const activeLink = document.querySelector(`[data-nav="${active}"]`);
    if (activeLink) activeLink.setAttribute("aria-current", "page");
    document.querySelectorAll("[data-current-year]").forEach((node) => {
      node.textContent = new Date().getFullYear();
    });
    renderOverview();
    renderInstruments();
    renderPeople();
    if (window.location.hash) {
      const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (target) {
        window.requestAnimationFrame(() => target.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "start"
        }));
      }
    }
  }

  document.addEventListener("DOMContentLoaded", initialize);
})();
