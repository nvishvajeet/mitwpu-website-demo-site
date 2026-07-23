(function () {
  "use strict";

  const pageSize = 20;
  const state = {
    entries: [],
    visible: pageSize
  };
  const elements = {
    form: document.querySelector("#search-form"),
    query: document.querySelector("#search-query"),
    type: document.querySelector("#type-filter"),
    department: document.querySelector("#department-filter"),
    status: document.querySelector("#search-status"),
    results: document.querySelector("#search-results"),
    empty: document.querySelector("#search-empty"),
    error: document.querySelector("#search-error"),
    showMore: document.querySelector("#show-more")
  };

  function normalize(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("en-IN")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== "") node.textContent = text;
    return node;
  }

  function populateSelect(select, values) {
    [...new Set(values.filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "en-IN"))
      .forEach((value) => {
        const option = element("option", "", value);
        option.value = value;
        select.append(option);
      });
  }

  function readUrlState() {
    const params = new URLSearchParams(window.location.search);
    elements.query.value = params.get("q") || "";
    elements.type.value = params.get("type") || "";
    elements.department.value = params.get("department") || "";
  }

  function writeUrlState() {
    const params = new URLSearchParams();
    if (elements.query.value.trim()) params.set("q", elements.query.value.trim());
    if (elements.type.value) params.set("type", elements.type.value);
    if (elements.department.value) params.set("department", elements.department.value);
    window.history.replaceState(null, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
  }

  function scoreEntry(entry, tokens, phrase) {
    const title = normalize(entry.title);
    const excerpt = normalize(entry.excerpt);
    const department = normalize(entry.department);
    const text = normalize(entry.text);
    const haystack = `${title} ${department} ${excerpt} ${text}`;
    if (!tokens.every((token) => haystack.includes(token))) return -1;

    let score = 0;
    if (phrase && title === phrase) score += 100;
    else if (phrase && title.startsWith(phrase)) score += 55;
    else if (phrase && title.includes(phrase)) score += 35;
    tokens.forEach((token) => {
      if (title.split(" ").includes(token)) score += 12;
      else if (title.includes(token)) score += 7;
      if (department.includes(token)) score += 4;
      if (excerpt.includes(token)) score += 2;
    });
    if (entry.type === "Person") score += 1;
    return score;
  }

  function matchingEntries() {
    const phrase = normalize(elements.query.value);
    const tokens = phrase.split(" ").filter(Boolean);
    const type = elements.type.value;
    const department = elements.department.value;

    return state.entries
      .filter((entry) => (!type || entry.type === type)
        && (!department || entry.department === department))
      .map((entry) => ({ entry, score: scoreEntry(entry, tokens, phrase) }))
      .filter((result) => result.score >= 0)
      .sort((a, b) =>
        b.score - a.score
        || a.entry.title.localeCompare(b.entry.title, "en-IN")
      )
      .map((result) => result.entry);
  }

  function highlightedText(value, tokens) {
    const fragment = document.createDocumentFragment();
    const source = String(value || "");
    const normalizedTokens = [...new Set(tokens.filter((token) => token.length > 1))]
      .sort((a, b) => b.length - a.length);
    if (!normalizedTokens.length) {
      fragment.append(source);
      return fragment;
    }

    const escaped = normalizedTokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const expression = new RegExp(`(${escaped.join("|")})`, "gi");
    source.split(expression).forEach((part) => {
      if (normalizedTokens.includes(normalize(part))) fragment.append(element("mark", "", part));
      else fragment.append(part);
    });
    return fragment;
  }

  function resultItem(entry, tokens) {
    const item = element("li", "search-result");
    const meta = element("div", "result-meta");
    meta.append(element("span", "result-type", entry.type));
    if (entry.department) meta.append(element("span", "result-department", entry.department));

    const main = element("div", "result-main");
    const heading = element("h2");
    const link = element("a");
    link.href = entry.url;
    link.append(highlightedText(entry.title, tokens));
    heading.append(link);
    main.append(heading);
    const description = element("p");
    description.append(highlightedText(entry.excerpt, tokens));
    main.append(description);

    item.append(meta, main);
    return item;
  }

  function render({ announce = false } = {}) {
    const matches = matchingEntries();
    const visible = matches.slice(0, state.visible);
    const tokens = normalize(elements.query.value).split(" ").filter(Boolean);

    elements.results.replaceChildren(...visible.map((entry) => resultItem(entry, tokens)));
    elements.empty.hidden = matches.length !== 0;
    elements.error.hidden = true;
    elements.showMore.hidden = visible.length >= matches.length;
    elements.status.textContent = `${matches.length} ${matches.length === 1 ? "result" : "results"} found`;
    writeUrlState();
    if (announce) elements.status.focus({ preventScroll: true });
  }

  function resetSearch() {
    elements.query.value = "";
    elements.type.value = "";
    elements.department.value = "";
    state.visible = pageSize;
    window.history.replaceState(null, "", window.location.pathname);
    render();
    elements.query.focus();
  }

  let inputTimer = 0;
  function scheduleRender() {
    window.clearTimeout(inputTimer);
    inputTimer = window.setTimeout(() => {
      state.visible = pageSize;
      render();
    }, 100);
  }

  async function loadIndex() {
    try {
      const response = await fetch("search-index.json", { credentials: "same-origin" });
      if (!response.ok) throw new Error(`Search index returned ${response.status}`);
      const payload = await response.json();
      if (!payload || payload.version !== 1 || !Array.isArray(payload.entries)) {
        throw new Error("Search index has an unsupported format");
      }
      state.entries = payload.entries;
      populateSelect(elements.type, state.entries.map((entry) => entry.type));
      populateSelect(elements.department, state.entries.map((entry) => entry.department));
      readUrlState();
      render();
    } catch (error) {
      console.error(error);
      elements.status.textContent = "Search unavailable";
      elements.results.replaceChildren();
      elements.empty.hidden = true;
      elements.error.hidden = false;
      elements.showMore.hidden = true;
    }
  }

  elements.form.addEventListener("input", scheduleRender);
  elements.form.addEventListener("change", () => {
    state.visible = pageSize;
    render();
  });
  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    state.visible = pageSize;
    render({ announce: true });
  });
  elements.form.addEventListener("reset", (event) => {
    event.preventDefault();
    resetSearch();
  });
  elements.showMore.addEventListener("click", () => {
    state.visible += pageSize;
    render();
    elements.results.querySelectorAll("a")[state.visible - pageSize]?.focus();
  });
  window.addEventListener("popstate", () => {
    readUrlState();
    state.visible = pageSize;
    render();
  });
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const editing = target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || target instanceof HTMLSelectElement
      || target.isContentEditable;
    if (event.key === "/" && !editing) {
      event.preventDefault();
      elements.query.focus();
    } else if (event.key === "Escape" && document.activeElement === elements.query && elements.query.value) {
      elements.query.value = "";
      state.visible = pageSize;
      render();
    }
  });

  loadIndex();
})();
