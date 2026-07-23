(function () {
  "use strict";

  const departments = {
    physics: "Physics",
    chemistry: "Chemistry",
    mathematics: "Mathematics & Statistics",
    biosciences: "Biosciences & Technology",
    "environmental-studies": "Environmental Studies"
  };
  const pageSize = 24;
  const state = { page: 1 };
  const peopleOrder = window.MITWPU_PEOPLE_ORDER || {
    faculty: (a, b) => String(a.name).localeCompare(String(b.name), "en-IN")
  };

  const elements = {
    form: document.querySelector("#directory-filters"),
    name: document.querySelector("#name-filter"),
    department: document.querySelector("#department-filter"),
    research: document.querySelector("#research-filter"),
    sort: document.querySelector("#sort-order"),
    grid: document.querySelector("#people-grid"),
    count: document.querySelector("#result-count"),
    total: document.querySelector("#directory-total"),
    empty: document.querySelector("#empty-state"),
    emptyClear: document.querySelector("#empty-clear"),
    pagination: document.querySelector("#pagination"),
    previous: document.querySelector("#previous-page"),
    next: document.querySelector("#next-page"),
    pageStatus: document.querySelector("#page-status")
  };

  function normalize(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("en-IN")
      .replace(/\s+/g, " ")
      .trim();
  }

  function initials(name) {
    return String(name || "")
      .replace(/^(dr|prof|mr|mrs|ms)\.?\s+/i, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "MW";
  }

  function externalUrl(value) {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : "";
    } catch (_error) {
      return "";
    }
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== "") node.textContent = text;
    return node;
  }

  function allPeople() {
    const source = window.SCIENCE_FACULTY || {};
    return Object.entries(source).flatMap(([department, people]) =>
      people
        .filter((person) => person.publicVisibility !== "hidden" && person.employmentStatus !== "former")
        .map((person) => ({
          ...person,
          department,
          departmentName: departments[department] || department
        }))
    );
  }

  const people = allPeople();

  function populateDepartments() {
    Object.entries(departments).forEach(([value, label]) => {
      if (!people.some((person) => person.department === value)) return;
      const option = element("option", "", label);
      option.value = value;
      elements.department.append(option);
    });
  }

  function readUrlState() {
    const params = new URLSearchParams(window.location.search);
    elements.name.value = params.get("name") || "";
    elements.department.value = params.get("department") || "";
    elements.research.value = params.get("research") || "";
    elements.sort.value = params.get("sort") || "name";
    state.page = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1);
  }

  function writeUrlState() {
    const params = new URLSearchParams();
    if (elements.name.value.trim()) params.set("name", elements.name.value.trim());
    if (elements.department.value) params.set("department", elements.department.value);
    if (elements.research.value.trim()) params.set("research", elements.research.value.trim());
    if (elements.sort.value !== "name") params.set("sort", elements.sort.value);
    if (state.page > 1) params.set("page", String(state.page));
    const next = `${window.location.pathname}${params.size ? `?${params}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", next);
  }

  function filteredPeople() {
    const name = normalize(elements.name.value);
    const research = normalize(elements.research.value);
    const department = elements.department.value;

    const matches = people.filter((person) => {
      const researchText = normalize(`${person.research || ""} ${person.summary || ""}`);
      return (!name || normalize(person.name).includes(name))
        && (!department || person.department === department)
        && (!research || researchText.includes(research));
    });

    return matches.sort((a, b) => {
      if (elements.sort.value === "department") {
        return a.departmentName.localeCompare(b.departmentName, "en-IN")
          || peopleOrder.faculty(a, b);
      }
      return peopleOrder.faculty(a, b);
    });
  }

  function addLink(container, label, rawUrl) {
    const url = externalUrl(rawUrl);
    if (!url) return;
    const link = element("a", "", label);
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.append(" ");
    const external = element("span", "", "↗");
    external.setAttribute("aria-hidden", "true");
    link.append(external);
    const assistive = element("span", "sr-only", " (opens in a new tab)");
    link.append(assistive);
    container.append(link);
  }

  function personCard(person) {
    const card = element("article", "person-card");
    card.id = person.id;

    if (person.photoPath) {
      const photo = element("img", "person-photo");
      photo.src = `../science/${person.photoPath}`;
      photo.alt = "";
      photo.loading = "lazy";
      photo.decoding = "async";
      photo.addEventListener("error", () => {
        const placeholder = element("div", "person-placeholder", initials(person.name));
        placeholder.setAttribute("aria-hidden", "true");
        photo.replaceWith(placeholder);
      }, { once: true });
      card.append(photo);
    } else {
      const placeholder = element("div", "person-placeholder", initials(person.name));
      placeholder.setAttribute("aria-hidden", "true");
      card.append(placeholder);
    }

    const main = element("div", "person-card-main");
    main.append(element("p", "person-department", person.departmentName));
    const heading = element("h2");
    const profileLink = element("a", "person-profile-link", person.name);
    profileLink.href = `./${encodeURIComponent(person.id)}/`;
    heading.append(profileLink);
    main.append(heading);
    main.append(element("p", "person-designation", person.designation || "Faculty"));

    const research = person.research || person.summary || "";
    if (research) main.append(element("p", "person-research", research));

    const links = element("div", "person-links");
    addLink(links, "University profile", person.links && person.links.profile);
    addLink(links, "Scholar", person.links && person.links.scholar);
    addLink(links, "ORCID", person.links && person.links.orcid);
    addLink(links, "Scopus", person.links && person.links.scopus);
    main.append(links);
    card.append(main);
    return card;
  }

  function render(options = {}) {
    const matches = filteredPeople();
    const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
    state.page = Math.min(state.page, pageCount);
    const start = (state.page - 1) * pageSize;
    const visible = matches.slice(start, start + pageSize);

    elements.grid.replaceChildren(...visible.map(personCard));
    elements.grid.hidden = matches.length === 0;
    elements.empty.hidden = matches.length !== 0;
    elements.count.textContent = `${matches.length} ${matches.length === 1 ? "person" : "people"} found`;

    elements.pagination.hidden = matches.length <= pageSize;
    elements.previous.disabled = state.page === 1;
    elements.next.disabled = state.page === pageCount;
    elements.pageStatus.textContent = `Page ${state.page} of ${pageCount}`;

    writeUrlState();
    if (options.focusResults) {
      elements.count.focus({ preventScroll: true });
      document.querySelector("#directory").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  let inputTimer = 0;
  function scheduleRender() {
    window.clearTimeout(inputTimer);
    inputTimer = window.setTimeout(() => {
      state.page = 1;
      render();
    }, 120);
  }

  function resetFilters() {
    elements.name.value = "";
    elements.department.value = "";
    elements.research.value = "";
    elements.sort.value = "name";
    state.page = 1;
    window.history.replaceState(null, "", window.location.pathname);
    render();
    elements.name.focus();
  }

  populateDepartments();
  readUrlState();
  elements.total.textContent = String(people.length);
  render();

  elements.form.addEventListener("input", scheduleRender);
  elements.form.addEventListener("change", () => {
    state.page = 1;
    render();
  });
  elements.form.addEventListener("reset", (event) => {
    event.preventDefault();
    resetFilters();
  });
  elements.sort.addEventListener("change", () => {
    state.page = 1;
    render();
  });
  elements.emptyClear.addEventListener("click", resetFilters);
  elements.previous.addEventListener("click", () => {
    state.page -= 1;
    render({ focusResults: true });
  });
  elements.next.addEventListener("click", () => {
    state.page += 1;
    render({ focusResults: true });
  });

  window.addEventListener("popstate", () => {
    readUrlState();
    render();
  });

  const targetId = decodeURIComponent(window.location.hash.slice(1));
  if (targetId && people.some((person) => person.id === targetId)) {
    const target = people.find((person) => person.id === targetId);
    elements.name.value = target.name;
    state.page = 1;
    render();
    window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ block: "center" });
    });
  }
})();
