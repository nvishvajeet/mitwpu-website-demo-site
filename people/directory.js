(function () {
  "use strict";

  const pageSize = 24;
  const leadershipLandingSize = 16;
  const state = { page: 1, browseAll: false };
  const peopleOrder = window.MITWPU_PEOPLE_ORDER || {
    faculty: (a, b) => String(a.name).localeCompare(String(b.name), "en-IN"),
    displayName: (person) => String(person.name || ""),
    surname: (person) => String(person.name || "").split(/\s+/).at(-1) || ""
  };

  const elements = {
    form: document.querySelector("#directory-filters"),
    name: document.querySelector("#name-filter"),
    department: document.querySelector("#department-filter"),
    research: document.querySelector("#research-filter"),
    role: document.querySelector("#role-filter"),
    alphabet: document.querySelector("#alphabet-filter"),
    sort: document.querySelector("#sort-order"),
    grid: document.querySelector("#people-grid"),
    count: document.querySelector("#result-count"),
    showAll: document.querySelector("#show-all-people"),
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
    const parts = String(name || "")
      .replace(/^(?:(?:prof(?:essor)?|dr|mr|mrs|ms)\.?\s+)+/i, "")
      .split(/\s+/)
      .filter(Boolean);
    return [...new Set([parts[0], parts.at(-1)])]
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "MW";
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== "") node.textContent = text;
    return node;
  }

  function allPeople() {
    const records = new Map(
      (window.MITWPU_PUBLIC_PEOPLE || []).map((person) => [person.id, person]),
    );
    (window.MITWPU_PUBLIC_LEADERSHIP || []).forEach((leader) => {
      const existingId = leader.personId && records.has(leader.personId)
        ? leader.personId
        : leader.id;
      const existing = records.get(existingId);
      records.set(existingId, existing ? {
        ...existing,
        ...leader,
        id: existing.id,
        name: existing.name,
        preferredDisplayName:
          leader.preferredDisplayName || existing.preferredDisplayName || "",
        unitRoutes: [
          ...(leader.unitRoutes || []),
          ...(existing.unitRoutes || []),
        ].filter((route, index, routes) =>
          route && routes.indexOf(route) === index),
        unitNames: {
          ...(existing.unitNames || {}),
          ...(leader.unitNames || {}),
        },
        links: {
          ...(existing.links || {}),
          ...(leader.links || {}),
        },
      } : leader);
    });
    return [...records.values()].map((person) => ({
      ...person,
      displayName: peopleOrder.displayName(person)
    }));
  }

  const people = allPeople();

  function primaryUnitName(person) {
    if (person.directoryUnitName) return person.directoryUnitName;
    return person.unitNames && person.unitNames[person.department]
      ? person.unitNames[person.department]
      : person.departmentName || "";
  }

  const roleOptions = [
    ["university-leadership", "University leadership"],
    ["academic-leadership", "Deans and academic leaders"],
    ["professor", "Professors"],
    ["associate-professor", "Associate professors"],
    ["assistant-professor", "Assistant professors"],
    ["teaching-technical", "Teaching and technical staff"],
    ["researcher-student", "Researchers and students"],
    ["other", "Other roles"],
  ];

  function roleCategory(person) {
    if (person.directoryRole === "university-leadership") {
      return "university-leadership";
    }
    const role = normalize(
      `${person.designation || ""} ${person.role || ""} ${person.memberType || ""}`,
    );
    if (/\b(dean|director|head|coordinator|chief academic officer|registrar|vice chancellor)\b/.test(role)) {
      return "academic-leadership";
    }
    if (/\bassociate professor\b/.test(role)) return "associate-professor";
    if (/\bassistant professor\b/.test(role)) return "assistant-professor";
    if (/\bprofessor\b/.test(role)) return "professor";
    if (/\b(postdoctoral|doctoral|researcher|scholar|student)\b/.test(role)) {
      return "researcher-student";
    }
    if (/\b(lecturer|instructor|teaching|technical|laboratory|staff)\b/.test(role)) {
      return "teaching-technical";
    }
    return "other";
  }

  function surnameInitial(person) {
    return normalize(peopleOrder.surname(person)).charAt(0).toUpperCase();
  }

  function selectedLetter() {
    return elements.alphabet
      .querySelector("[data-letter][aria-pressed='true']")
      ?.dataset.letter || "";
  }

  function setSelectedLetter(letter) {
    elements.alphabet.querySelectorAll("[data-letter]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.letter === letter),
      );
    });
  }

  function populateDepartments() {
    const departments = new Map();
    people.forEach((person) => {
      (person.unitRoutes || [person.department]).forEach((route) => {
        const name = person.unitNames && person.unitNames[route]
          ? person.unitNames[route]
          : route === person.department
            ? person.departmentName
            : route;
        if (route && name) departments.set(route, name);
      });
    });
    [...departments.entries()]
      .sort((a, b) => a[1].localeCompare(b[1], "en-IN"))
      .forEach(([value, label]) => {
        const option = element("option", "", label);
        option.value = value;
        elements.department.append(option);
      });
  }

  function populateRoles() {
    const available = new Set(people.map(roleCategory));
    roleOptions.forEach(([value, label]) => {
      if (!available.has(value)) return;
      const option = element("option", "", label);
      option.value = value;
      elements.role.append(option);
    });
  }

  function populateAlphabet() {
    const available = new Set(people.map(surnameInitial).filter(Boolean));
    elements.alphabet.querySelectorAll("[data-letter]").forEach((button) => {
      const letter = button.dataset.letter;
      button.disabled = Boolean(letter) && !available.has(letter);
    });
  }

  function readUrlState() {
    const params = new URLSearchParams(window.location.search);
    elements.name.value = params.get("name") || "";
    elements.department.value = params.get("department") || "";
    elements.research.value = params.get("research") || "";
    elements.role.value = params.get("role") || "";
    setSelectedLetter((params.get("letter") || "").toUpperCase());
    elements.sort.value = params.get("sort") || "name";
    state.page = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1);
    state.browseAll = params.get("view") === "all" || [
      elements.name.value,
      elements.department.value,
      elements.research.value,
      elements.role.value,
      selectedLetter(),
    ].some(Boolean);
  }

  function writeUrlState() {
    const params = new URLSearchParams();
    if (elements.name.value.trim()) params.set("name", elements.name.value.trim());
    if (elements.department.value) params.set("department", elements.department.value);
    if (elements.research.value.trim()) params.set("research", elements.research.value.trim());
    if (elements.role.value) params.set("role", elements.role.value);
    if (selectedLetter()) params.set("letter", selectedLetter());
    if (elements.sort.value !== "name") params.set("sort", elements.sort.value);
    if (state.page > 1) params.set("page", String(state.page));
    if (
      state.browseAll &&
      !elements.name.value.trim() &&
      !elements.department.value &&
      !elements.research.value.trim() &&
      !elements.role.value &&
      !selectedLetter()
    ) {
      params.set("view", "all");
    }
    const next = `${window.location.pathname}${params.size ? `?${params}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", next);
  }

  function filteredPeople() {
    const name = normalize(elements.name.value);
    const research = normalize(elements.research.value);
    const department = elements.department.value;
    const role = elements.role.value;
    const letter = selectedLetter();

    const matches = people.filter((person) => {
      const researchText = normalize(`${person.research || ""} ${person.summary || ""}`);
      return (!name || normalize(`${person.displayName} ${person.name}`).includes(name))
        && (!department || (person.unitRoutes || [person.department]).includes(department))
        && (!research || researchText.includes(research))
        && (!role || roleCategory(person) === role)
        && (!letter || surnameInitial(person) === letter);
    });

    return matches.sort((a, b) => {
      if (elements.sort.value === "department") {
        return primaryUnitName(a).localeCompare(primaryUnitName(b), "en-IN")
          || peopleOrder.faculty(a, b);
      }
      return peopleOrder.faculty(a, b);
    });
  }

  function leadershipLanding(matches) {
    const featured = matches.filter(
      (person) => person.directoryRole === "university-leadership",
    );
    const leaders = featured.length
      ? featured
      : matches.filter((person) =>
        /\b(vice chancellor|chief academic officer|registrar|dean)\b/i.test(
          person.designation || "",
        ));
    return leaders
      .sort((a, b) =>
        (Number(a.leadershipOrder) || 0) - (Number(b.leadershipOrder) || 0)
        || peopleOrder.faculty(a, b))
      .slice(0, leadershipLandingSize);
  }

  function personCard(person) {
    const card = element("article", "person-card");
    card.id = person.id;
    const isLeadership = person.directoryRole === "university-leadership";
    if (isLeadership) card.classList.add("person-card--leadership");

    if (person.photoPath) {
      const photo = element("img", "person-photo");
      photo.src = person.photoPath;
      photo.alt = "";
      photo.loading = "lazy";
      photo.decoding = "async";
      photo.addEventListener("error", () => {
        const placeholder = element("div", "person-placeholder", initials(person.displayName));
        placeholder.setAttribute("aria-hidden", "true");
        photo.replaceWith(placeholder);
      }, { once: true });
      card.append(photo);
    } else {
      const placeholder = element("div", "person-placeholder", initials(person.displayName));
      placeholder.setAttribute("aria-hidden", "true");
      card.append(placeholder);
    }

    const main = element("div", "person-card-main");
    // Directory cards are signposts, not miniature profiles. Leadership cards
    // omit the redundant "University leadership" unit and show one role only.
    if (!isLeadership) {
      const contextualUnit = elements.department.value &&
        person.unitNames &&
        person.unitNames[elements.department.value]
        ? person.unitNames[elements.department.value]
        : primaryUnitName(person);
      const affiliationCount = (person.unitRoutes || []).length;
      const affiliationLabel = !elements.department.value && affiliationCount > 1
        ? `${contextualUnit} · +${affiliationCount - 1} ${affiliationCount === 2 ? "affiliation" : "affiliations"}`
        : contextualUnit;
      main.append(element("p", "person-department", affiliationLabel));
    }
    const heading = element("h2");
    const profileLink = element("a", "person-profile-link", person.displayName);
    profileLink.href = person.profilePath || `./${encodeURIComponent(person.id)}/`;
    heading.append(profileLink);
    main.append(heading);
    main.append(element("p", "person-designation", person.designation || "Faculty"));
    card.append(main);
    return card;
  }

  function render(options = {}) {
    const matches = filteredPeople();
    const hasFilters = Boolean(
      elements.name.value.trim() ||
      elements.department.value ||
      elements.research.value.trim() ||
      elements.role.value ||
      selectedLetter(),
    );
    const landingMode = !state.browseAll && !hasFilters;
    const pageCount = landingMode
      ? 1
      : Math.max(1, Math.ceil(matches.length / pageSize));
    state.page = landingMode ? 1 : Math.min(state.page, pageCount);
    const start = (state.page - 1) * pageSize;
    const visible = landingMode
      ? leadershipLanding(matches)
      : matches.slice(start, start + pageSize);
    const previousGridHeight = Math.ceil(elements.grid.getBoundingClientRect().height);
    const paginationTop = options.preservePagination && !elements.pagination.hidden
      ? elements.pagination.getBoundingClientRect().top
      : null;

    if (matches.length > pageSize && previousGridHeight > 0) {
      elements.grid.style.minHeight = `${previousGridHeight}px`;
    } else {
      elements.grid.style.minHeight = "";
    }
    elements.grid.replaceChildren(...visible.map(personCard));
    if (matches.length > pageSize) {
      const renderedGridHeight = Math.ceil(elements.grid.scrollHeight);
      elements.grid.style.minHeight =
        `${Math.max(previousGridHeight, renderedGridHeight)}px`;
    }
    elements.grid.hidden = matches.length === 0;
    elements.empty.hidden = matches.length !== 0;
    elements.count.textContent = landingMode
      ? "University leadership"
      : `${matches.length} ${matches.length === 1 ? "person" : "people"} found`;

    elements.showAll.hidden = !landingMode;
    elements.pagination.hidden = landingMode || matches.length <= pageSize;
    elements.previous.disabled = state.page === 1;
    elements.next.disabled = state.page === pageCount;
    elements.pageStatus.textContent = `Page ${state.page} of ${pageCount}`;

    writeUrlState();
    if (paginationTop !== null) {
      const movement = elements.pagination.getBoundingClientRect().top - paginationTop;
      if (Math.abs(movement) > 0.5) {
        const previousScrollBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollBy(0, movement);
        document.documentElement.style.scrollBehavior = previousScrollBehavior;
      }
    }
    if (options.focusResults) {
      elements.count.focus({ preventScroll: true });
    }
  }

  let inputTimer = 0;
  function scheduleRender() {
    window.clearTimeout(inputTimer);
    inputTimer = window.setTimeout(() => {
      state.page = 1;
      state.browseAll = true;
      render();
    }, 120);
  }

  function resetFilters() {
    window.clearTimeout(inputTimer);
    elements.name.value = "";
    elements.department.value = "";
    elements.research.value = "";
    elements.role.value = "";
    setSelectedLetter("");
    elements.sort.value = "name";
    state.page = 1;
    state.browseAll = false;
    window.history.replaceState(null, "", window.location.pathname);
    render();
    elements.name.focus();
  }

  populateDepartments();
  populateRoles();
  populateAlphabet();
  readUrlState();
  render();

  elements.form.addEventListener("input", (event) => {
    if (event.target.matches("input[type='search']")) scheduleRender();
  });
  elements.form.addEventListener("change", () => {
    state.page = 1;
    state.browseAll = true;
    render();
  });
  elements.form.addEventListener("reset", (event) => {
    event.preventDefault();
    resetFilters();
  });
  elements.sort.addEventListener("change", () => {
    state.page = 1;
    state.browseAll = true;
    render();
  });
  elements.showAll.addEventListener("click", () => {
    state.browseAll = true;
    state.page = 1;
    render({ focusResults: true });
  });
  elements.alphabet.addEventListener("click", (event) => {
    const button = event.target.closest("[data-letter]");
    if (!button || button.disabled) return;
    setSelectedLetter(button.dataset.letter);
    state.browseAll = true;
    state.page = 1;
    render({ focusResults: true });
  });
  elements.emptyClear.addEventListener("click", resetFilters);
  elements.previous.addEventListener("click", () => {
    state.page -= 1;
    render({ focusResults: true, preservePagination: true });
  });
  elements.next.addEventListener("click", () => {
    state.page += 1;
    render({ focusResults: true, preservePagination: true });
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
