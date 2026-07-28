(function () {
  "use strict";

  const facility = window.MITWPU_CRF || {
    capabilities: [],
    clusters: [],
    leadership: [],
    facultyContacts: [],
    operators: [],
    suppliedSources: {}
  };

  const operatorsById = new Map(
    (facility.operators || []).map((operator) => [operator.id, operator])
  );

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

  /* "A", "A and B" — never a bare comma-joined run for two names. Mirrors
     nameList() in tools/build_facility_capabilities.mjs, which renders the
     same card onto the five capability pages at build time. */
  function nameList(names) {
    if (names.length < 2) return names.join("");
    return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  }

  function operatorNames(instrument) {
    return (instrument.operatorIds || [])
      .map((id) => operatorsById.get(id))
      .filter(Boolean)
      .map((operator) => operator.name);
  }

  /* The line the pages print about where the operator names came from. It is
     stored once, in data.js, because the capability pages, this page and the
     people page all print it. */
  function operatorCredit() {
    const first = (facility.operators || [])[0];
    const source = first && (facility.suppliedSources || {})[first.source];
    return source ? source.credit : "";
  }

  function instrumentCard(instrument) {
    const names = operatorNames(instrument);
    const operators = names.length
      ? `<p class="instrument-operators"><span>Operated by</span> ${escapeHtml(nameList(names))}</p>`
      : "";
    return `<article class="instrument-card">
      <p class="instrument-short-name">${escapeHtml(instrument.shortName)}</p>
      <h3>${escapeHtml(instrument.name)}</h3>
      <p class="instrument-model">${escapeHtml(instrument.model)}</p>
      <p>${escapeHtml(instrument.use)}</p>
      ${operators}
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
    renderOperatorCredit();
  }

  function renderOperatorCredit() {
    const credit = operatorCredit();
    document.querySelectorAll("[data-operator-credit]").forEach((node) => {
      node.textContent = credit;
    });
  }

  /* Every instrument this person runs, in the order the facility lists them,
     each one linked to the capability page that describes it. "Which
     instruments does this person run" is the question a researcher arrives
     with; the spreadsheet answers it the other way round, so it is inverted
     here rather than published in the shape it was supplied in. */
  function operatorInstruments(operatorId) {
    const capabilityOf = new Map();
    facility.capabilities.forEach((capability) => {
      (capability.clusterIds || []).forEach((clusterId) => {
        capabilityOf.set(clusterId, capability.id);
      });
    });
    return facility.clusters.flatMap((cluster) =>
      cluster.instruments
        .filter((instrument) => (instrument.operatorIds || []).includes(operatorId))
        .map((instrument) => ({
          name: instrument.name,
          capabilityId: capabilityOf.get(cluster.id) || ""
        }))
    );
  }

  function operatorRow(operator) {
    const instruments = operatorInstruments(operator.id)
      .map((instrument) => {
        const label = escapeHtml(instrument.name);
        return instrument.capabilityId
          ? `<li><a href="capabilities/${encodeURIComponent(instrument.capabilityId)}/">${label}</a></li>`
          : `<li>${label}</li>`;
      })
      .join("");
    return `<article class="facility-person facility-operator">
      <div>
        <h3>${escapeHtml(operator.name)}</h3>
      </div>
      <ul class="operator-instruments">${instruments}</ul>
    </article>`;
  }

  function renderOperators() {
    const target = document.getElementById("instrument-operators");
    if (!target) return;
    target.innerHTML = (facility.operators || []).map(operatorRow).join("");
    renderOperatorCredit();
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
    // The page shell — masthead navigation with its aria-current, and the
    // footer with its pinned year — is rendered at build time by
    // tools/build_facility_capabilities.mjs from university-web-patterns,
    // so this file only fills the data-driven regions inside <main>.
    renderOverview();
    renderInstruments();
    renderPeople();
    renderOperators();
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
