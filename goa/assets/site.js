(function () {
  "use strict";
  var root = document.documentElement;
  var toggle = document.querySelector("[data-theme-toggle]");

  function preferredTheme() {
    try {
      var saved = localStorage.getItem("wpu-goa-theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch (error) {}
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (toggle) {
      var next = theme === "dark" ? "light" : "dark";
      toggle.setAttribute("aria-label", "Switch to " + next + " mode");
      toggle.setAttribute("title", "Switch to " + next + " mode");
      toggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    }
  }

  setTheme(preferredTheme());
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      try { localStorage.setItem("wpu-goa-theme", next); } catch (error) {}
      setTheme(next);
    });
  }

  var form = document.querySelector("[data-search-form]");
  var input = document.querySelector("[data-search-input]");
  var results = document.querySelector("[data-search-results]");
  var status = document.querySelector("[data-search-status]");
  if (!form || !input || !results || !status) return;

  var records = [];
  function render(query) {
    var needle = query.trim().toLowerCase();
    results.replaceChildren();
    if (!needle) {
      status.textContent = "Enter a title, topic, programme, institute or event.";
      return;
    }
    var matched = records.filter(function (record) {
      return record.search_text.indexOf(needle) !== -1;
    }).slice(0, 40);
    status.textContent = matched.length + (matched.length === 1 ? " result" : " results");
    matched.forEach(function (record) {
      var article = document.createElement("article");
      article.className = "card";
      var small = document.createElement("small");
      small.textContent = record.category;
      var heading = document.createElement("h3");
      var link = document.createElement("a");
      link.href = record.route;
      link.textContent = record.title;
      heading.appendChild(link);
      var copy = document.createElement("p");
      copy.textContent = record.description;
      article.append(small, heading, copy);
      results.appendChild(article);
    });
  }

  fetch("/goa/data/search-index.json")
    .then(function (response) {
      if (!response.ok) throw new Error("Search index unavailable");
      return response.json();
    })
    .then(function (data) {
      records = data.records || [];
      var query = new URLSearchParams(window.location.search).get("q") || "";
      input.value = query;
      render(query);
    })
    .catch(function () {
      status.textContent = "Search is temporarily unavailable. Browse the site index instead.";
    });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var query = input.value.trim();
    var url = new URL(window.location.href);
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    history.replaceState({}, "", url);
    render(query);
  });
})();
