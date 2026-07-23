(function () {
  "use strict";

  const departments = window.SCIENCE_DEPARTMENTS || {};
  const facultyByDepartment = window.SCIENCE_FACULTY || {};
  const body = document.body;
  const departmentId = body.dataset.department || "";
  const page = body.dataset.page || "home";
  const department = departments[departmentId];
  const facultyRecords = Array.isArray(facultyByDepartment[departmentId]) ? facultyByDepartment[departmentId] : [];
  const peopleOrder = window.MITWPU_PEOPLE_ORDER || {
    faculty: (a, b) => String(a.name).localeCompare(String(b.name), "en-IN"),
    displayName: (person) => String(person.name || "")
  };
  const faculty = facultyRecords
    .filter((person) =>
      person.employmentStatus !== "former" && person.publicVisibility !== "hidden"
    )
    .sort(peopleOrder.faculty);
  const departmentOrder = ["physics", "chemistry", "mathematics", "biosciences", "environmental-studies"];

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
      const raw = value.trim();
      const url = new URL(raw, window.location.href);
      if (!["https:", "http:"].includes(url.protocol)) return "";
      return /^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith("//") ? url.href : raw;
    } catch (_error) {
      return "";
    }
  }

  function localHref(id, file = "index.html") {
    return page === "school" ? `${id}/${file}` : `../${id}/${file}`;
  }

  function initials(name) {
    return String(name)
      .replace(/[.]/g, "")
      .split(/\s+/)
      .filter((part) => part && !["dr", "prof", "mr", "mrs", "ms"].includes(part.toLowerCase()))
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  }

  function facultyPortrait(person) {
    const name = peopleOrder.displayName(person);
    if (!person.photoPath) {
      return `<div class="faculty-initials" aria-hidden="true">${escapeHtml(initials(name))}</div>`;
    }
    const prefix = page === "school" ? "" : "../";
    return `<img class="faculty-photo" src="${prefix}${escapeHtml(person.photoPath)}" alt="" loading="lazy" decoding="async">`;
  }

  function externalLink(url, label, className = "") {
    const href = safeUrl(url);
    if (!href) return "";
    const link = new URL(href, window.location.href);
    const opensNewTab = link.origin !== window.location.origin;
    return `<a${className ? ` class="${className}"` : ""} href="${escapeHtml(href)}"${opensNewTab ? ' target="_blank" rel="noopener noreferrer"' : ""}>${escapeHtml(label)}${opensNewTab ? ' <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span>' : ""}</a>`;
  }

  function renderHeader() {
    const target = document.getElementById("site-header");
    if (!target) return;
    const schoolHref = page === "school" ? "index.html" : "../index.html";
    const demoHomeHref = page === "school" ? "../" : "../../";
    const brand = page === "school"
      ? `<a class="brand" href="${demoHomeHref}"><strong>School of Science &amp; Environmental Studies</strong><small>MIT World Peace University</small></a>`
      : `<a class="brand" href="index.html"><strong>${escapeHtml(department.name)}</strong><small>School of Science &amp; Environmental Studies</small></a>`;
    const navItems = department ? [
      ["home", "Home", "index.html"],
      ...(department.researchThemes.length ? [["research", "Research", "research.html"]] : []),
      ...(faculty.length ? [["people", "People", "people.html"]] : []),
      ...(department.programmes.length ? [["academics", "Academics", "academics.html"]] : []),
      ...((department.events || []).length || (department.eventSeries || []).length ? [["events", "Events", "events.html"]] : []),
      ...(department.facilities.length ? [["facilities", "Facilities", "facilities.html"]] : [])
    ] : [];
    target.innerHTML = `
      <div class="institution-bar">
        <div class="shell institution-inner">
          <a class="institution-name" href="${demoHomeHref}">MIT World Peace University · Pune, India</a>
          <nav class="institution-links" aria-label="Institutional links">
            <a href="https://mitwpu.edu.in/" target="_blank" rel="noopener noreferrer">University ↗</a>
            <a href="https://research.mitwpu.edu.in/" target="_blank" rel="noopener noreferrer">Research portal ↗</a>
          </nav>
        </div>
      </div>
      <header class="site-header">
        <div class="shell header-inner">
          <div class="masthead-brands">
            <a class="institutional-lockup" href="${demoHomeHref}" aria-label="Dr. Vishwanath Karad MIT World Peace University home">
              <img class="institutional-lockup__logo" src="/demo-assets/brand/mitwpu-official-logo.jpg" alt="" width="431" height="124">
            </a>
            ${brand}
          </div>
          ${department ? `
            <nav class="site-nav" aria-label="Department navigation">
              ${navItems.map(([id, label, href]) => `<a data-nav="${id}" href="${href}"${page === id ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
              <button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch to dark mode" aria-pressed="false" title="Switch to dark mode"><span class="theme-icon theme-icon-light" aria-hidden="true"></span><span class="theme-icon theme-icon-dark" aria-hidden="true"></span><span class="switch-thumb" aria-hidden="true"></span></button>
            </nav>` : `
            <div class="school-header-actions">
              <a class="text-link" href="#departments">Departments ↓</a>
              <button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch to dark mode" aria-pressed="false" title="Switch to dark mode"><span class="theme-icon theme-icon-light" aria-hidden="true"></span><span class="theme-icon theme-icon-dark" aria-hidden="true"></span><span class="switch-thumb" aria-hidden="true"></span></button>
            </div>`}
        </div>
      </header>
      ${department ? `<div class="department-context"><div class="shell context-inner"><a href="${schoolHref}">School of Science</a><span aria-hidden="true">/</span><span>${escapeHtml(department.shortName)}</span><details><summary>Other departments</summary><div class="department-menu">${departmentOrder.filter((id) => id !== departmentId).map((id) => `<a href="${localHref(id)}">${escapeHtml(departments[id].shortName)}</a>`).join("")}</div></details></div></div>` : ""}`;
  }

  function renderFooter() {
    const target = document.getElementById("site-footer");
    if (!target) return;
    const prefix = page === "school" ? "" : "../";
    const demoHomeHref = page === "school" ? "../" : "../../";
    target.innerHTML = `
      <footer class="site-footer">
        <div class="shell science-footer-grid">
          <div>
            <strong>${department ? escapeHtml(department.name) : "School of Science & Environmental Studies"}</strong>
            <p>MIT World Peace University · Pune, India</p>
          </div>
          <nav class="footer-departments" aria-label="Science departments">
            ${departmentOrder.map((id) => `<a href="${prefix}${id}/">${escapeHtml(departments[id].shortName)}</a>`).join("")}
          </nav>
          <div class="footer-meta">
            <a href="${demoHomeHref}">MIT-WPU</a>
            <a href="https://research.mitwpu.edu.in/">Research portal</a>
            <span>© <span data-current-year></span> MIT-WPU</span>
          </div>
        </div>
      </footer>`;
    const year = target.querySelector("[data-current-year]");
    if (year) year.textContent = new Date().getFullYear();
  }

  function sectionHeading(eyebrow, title, action = "") {
    return `<div class="section-heading"><div>${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ""}<h2>${escapeHtml(title)}</h2></div>${action}</div>`;
  }

  function themeCard(theme, index, compact = false) {
    const people = Array.isArray(theme.faculty) && theme.faculty.length
      ? `<p class="theme-faculty"><strong>Selected faculty</strong> ${theme.faculty.map((name) => escapeHtml(name)).join(" · ")}</p>`
      : "";
    const links = Array.isArray(theme.links) && theme.links.length
      ? `<div class="theme-links">${theme.links.map((link) => externalLink(link.url, link.label)).join("")}</div>`
      : "";
    return `<article class="science-theme${compact ? " science-theme-compact" : ""}">
      <span class="theme-index">${String(index + 1).padStart(2, "0")}</span>
      <div>
        <h3>${escapeHtml(theme.title)}</h3>
        <p>${escapeHtml(theme.summary)}</p>
        ${compact ? "" : people}
        ${links}
      </div>
    </article>`;
  }

  function programmeRow(programme) {
    return `<article class="programme-row">
      <p>${escapeHtml(programme.level)}</p>
      <h3>${escapeHtml(programme.name)}</h3>
      ${externalLink(programme.url, "Programme details", "row-link")}
    </article>`;
  }

  function eventRow(event) {
    return `<article class="event-row">
      <div class="event-date"><span>${escapeHtml(event.status)}</span><strong>${escapeHtml(event.dates)}</strong></div>
      <div class="event-copy">
        <p class="eyebrow">${escapeHtml(event.type)}${event.programme ? ` · ${escapeHtml(event.programme)}` : ""}</p>
        <h3>${escapeHtml(event.title)}</h3>
      </div>
      ${externalLink(event.url, "Details", "row-link")}
    </article>`;
  }

  function renderHome() {
    const target = document.getElementById("page-content");
    if (!target || !department) return;
    const events = department.events || [];
    target.innerHTML = `
      <section class="department-hero">
        <div class="shell department-hero-grid">
          <div>
            <p class="eyebrow">School of Science &amp; Environmental Studies</p>
            <h1>${escapeHtml(department.name)}</h1>
            <p class="hero-lede">${escapeHtml(department.strapline)}</p>
          </div>
          <aside class="department-facts" aria-label="Department overview">
            <div><strong>${faculty.length}</strong><span>faculty</span></div>
            <div><strong>${department.researchThemes.length}</strong><span>research themes</span></div>
            <div><strong>${department.programmes.length}</strong><span>programmes</span></div>
          </aside>
        </div>
      </section>
      <section class="section department-introduction">
        <div class="shell intro-grid">
          <div><h2>Overview</h2></div>
          <div class="prose-large"><p>${escapeHtml(department.introduction)}</p><div class="inline-links"><a class="text-link" href="people.html">People →</a><a class="text-link" href="academics.html">Academic programmes →</a></div></div>
        </div>
      </section>
      <section class="section section-tint">
        <div class="shell">
          ${sectionHeading("", "Areas of enquiry", '<a class="text-link" href="research.html">Research overview →</a>')}
          <div class="science-theme-grid">${department.researchThemes.map((theme, index) => themeCard(theme, index, true)).join("")}</div>
        </div>
      </section>
      <section class="section">
        <div class="shell">
          ${sectionHeading("", "Programmes", '<a class="text-link" href="academics.html">All programmes →</a>')}
          <div class="programme-list programme-list-home">${department.programmes.slice(0, 4).map(programmeRow).join("")}</div>
        </div>
      </section>`;
  }

  function renderResearch() {
    const target = document.getElementById("page-content");
    if (!target || !department) return;
    target.innerHTML = `
      <section class="page-hero"><div class="shell page-hero-inner"><div><h1>Research</h1></div><p>${escapeHtml(department.introduction)}</p></div></section>
      <section class="section">
        <div class="shell">
          <div class="research-theme-list">${department.researchThemes.map(themeCard).join("")}</div>
        </div>
      </section>`;
  }

  function facultyCard(person) {
    const name = peopleOrder.displayName(person);
    const links = Object.entries(person.links || {}).map(([key, value]) => {
      const labels = { profile: "Profile", scholar: "Scholar", scopus: "Scopus", orcid: "ORCID" };
      return labels[key] ? externalLink(value, labels[key]) : "";
    }).join("");
    const summary = person.research || person.summary || "";
    return `<article class="faculty-card" id="${escapeHtml(person.id)}" data-name="${escapeHtml(`${name} ${person.name}`.toLowerCase())}">
      ${facultyPortrait(person)}
      <div class="faculty-card-main">
        <h2><a class="faculty-profile-link" href="../../people/${encodeURIComponent(person.id)}/">${escapeHtml(name)}</a></h2>
        <p class="faculty-designation">${escapeHtml(person.designation)}</p>
        ${summary ? `<p class="faculty-research">${escapeHtml(summary)}</p>` : ""}
        <div class="faculty-links">${links}${person.email ? `<a href="mailto:${escapeHtml(person.email)}">Email</a>` : ""}</div>
      </div>
    </article>`;
  }

  function renderPeopleList(query = "") {
    const target = document.getElementById("faculty-directory");
    if (!target) return;
    const normalizedQuery = query.trim().toLowerCase();
    const visible = faculty.filter((person) => {
      const haystack = `${peopleOrder.displayName(person)} ${person.name} ${person.designation} ${person.research} ${person.summary}`.toLowerCase();
      return !normalizedQuery || haystack.includes(normalizedQuery);
    });
    target.innerHTML = visible.length
      ? visible.map(facultyCard).join("")
      : `<div class="empty-directory"><h2>No matching faculty records</h2><p>Try a broader name or research-area search.</p></div>`;
    const count = document.getElementById("faculty-count");
    if (count) count.textContent = `${visible.length} ${visible.length === 1 ? "record" : "records"}`;
  }

  function renderPeople() {
    const target = document.getElementById("page-content");
    if (!target || !department) return;
    target.innerHTML = `
      <section class="page-hero"><div class="shell page-hero-inner"><div><h1>Faculty</h1></div></div></section>
      <section class="directory-controls-wrap">
        <div class="shell directory-controls">
          <div></div>
          <label class="faculty-search"><span class="sr-only">Search faculty</span><input id="faculty-search" type="search" placeholder="Search name or research area"><small id="faculty-count" aria-live="polite">${faculty.length} records</small></label>
        </div>
      </section>
      <section class="section faculty-directory-section"><div class="shell"><div id="faculty-directory" class="faculty-directory">${faculty.map(facultyCard).join("")}</div></div></section>`;

    if (window.SCIENCE_BUILD_MODE) return;
    const input = target.querySelector("#faculty-search");
    input.addEventListener("input", () => renderPeopleList(input.value));
    renderPeopleList();
  }

  function renderAcademics() {
    const target = document.getElementById("page-content");
    if (!target || !department) return;
    const grouped = department.programmes.reduce((result, item) => {
      (result[item.level] ||= []).push(item);
      return result;
    }, {});
    target.innerHTML = `
      <section class="page-hero"><div class="shell page-hero-inner"><div><h1>Academics</h1></div></div></section>
      <section class="section"><div class="shell academic-groups">${Object.entries(grouped).map(([level, programmes]) => `
        <section${level === "Doctoral" ? ' id="doctoral"' : ""} class="academic-group">
          <div class="academic-level"><h2>${escapeHtml(level)} programmes</h2></div>
          <div class="programme-list">${programmes.map(programmeRow).join("")}</div>
        </section>`).join("")}</div></section>`;
  }

  function renderEvents() {
    const target = document.getElementById("page-content");
    if (!target || !department) return;
    const events = department.events || [];
    target.innerHTML = `
      <section class="page-hero"><div class="shell page-hero-inner"><div><h1>Events</h1></div></div></section>
      ${events.length ? `<section class="section">
        <div class="shell">
          ${sectionHeading("", "Recent and past events")}
          <div class="event-list">${events.map(eventRow).join("")}</div>
        </div>
      </section>` : ""}
      ${(department.eventSeries || []).length ? `<section class="section section-tint">
        <div class="shell">
          ${sectionHeading("Recurring activity", "Department series")}
          <div class="series-grid">${(department.eventSeries || []).map((series) => `<article><span aria-hidden="true">—</span><h3>${escapeHtml(series)}</h3></article>`).join("")}</div>
        </div>
      </section>` : ""}`;
  }

  function renderFacilities() {
    const target = document.getElementById("page-content");
    if (!target || !department) return;
    target.innerHTML = `
      <section class="page-hero"><div class="shell page-hero-inner"><div><h1>Facilities</h1></div></div></section>
      <section class="section"><div class="shell facility-list">${department.facilities.map((facility, index) => `<article class="facility-row"><span>${String(index + 1).padStart(2, "0")}</span><div><h2>${escapeHtml(facility.name)}</h2><p>${escapeHtml(facility.note)}</p></div></article>`).join("")}</div></section>
      <section class="section section-tint"><div class="shell central-facility-link"><div><p class="eyebrow">Shared infrastructure</p><h2>MIT-WPU Research Facilities</h2><p>Significant shared research instruments and faculty contacts are maintained separately from routine teaching equipment.</p></div><a class="button button-primary" href="../../facilities/">Central facilities</a></div></section>`;
  }

  function renderSchool() {
    const target = document.getElementById("page-content");
    if (!target) return;
    const themes = [
      ["Quantum, photonics & advanced materials", "Physics and Chemistry"],
      ["Data, modelling & computation", "Mathematics, Statistics, and all science departments"],
      ["Molecular life science & biotechnology", "Biosciences and Technology"],
      ["Environment, climate & sustainability", "Environmental Studies with cross-school collaboration"]
    ];
    target.innerHTML = `
      <section class="school-hero"><div class="shell school-hero-grid"><div><p class="eyebrow">MIT World Peace University</p><h1>School of Science &amp; Environmental Studies</h1></div></div></section>
      <section id="departments" class="section"><div class="shell">${sectionHeading("Departments", "Science at MIT-WPU")}<div class="department-card-grid">${departmentOrder.map((id, index) => {
        const item = departments[id];
        const people = facultyByDepartment[id] || [];
        return `<article class="department-card"><span>${String(index + 1).padStart(2, "0")}</span><h2><a href="${id}/">${escapeHtml(item.shortName)}</a></h2><p>${escapeHtml(item.strapline)}</p><small>${people.length} faculty · ${item.programmes.length} programmes · ${item.researchThemes.length} research themes</small></article>`;
      }).join("")}</div></div></section>
      <section class="section section-tint"><div class="shell">${sectionHeading("Across departments", "Shared research directions")}<div class="cross-theme-grid">${themes.map(([title, note]) => `<article><h3>${escapeHtml(title)}</h3><p>${escapeHtml(note)}</p></article>`).join("")}</div></div></section>
      <section class="section school-actions"><div class="shell compact-callout-grid"><article><h2><a href="../groups/">Research groups →</a></h2></article><article><h2><a href="../facilities/">Research facilities →</a></h2></article></div></section>`;
  }

  function initialise() {
    renderHeader();
    renderFooter();
    if (page === "school") renderSchool();
    else if (!department) {
      document.getElementById("page-content").innerHTML = `<section class="section"><div class="shell"><h1>Department not found</h1></div></section>`;
    } else if (page === "home") renderHome();
    else if (page === "research") renderResearch();
    else if (page === "people") renderPeople();
    else if (page === "academics") renderAcademics();
    else if (page === "events") renderEvents();
    else if (page === "facilities") renderFacilities();
    document.title = page === "school"
      ? "School of Science & Environmental Studies · MIT-WPU"
      : `${page === "home" ? department.name : `${page[0].toUpperCase()}${page.slice(1)} · ${department.name}`} · MIT-WPU`;
  }

  initialise();
})();
