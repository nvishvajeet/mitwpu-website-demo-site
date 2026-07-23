(function () {
  "use strict";

  var search = document.querySelector("[data-unit-search]");
  var faculty = document.querySelector("[data-faculty-filter]");
  var kind = document.querySelector("[data-kind-filter]");
  var cards = Array.prototype.slice.call(
    document.querySelectorAll("[data-unit-card]"),
  );
  var count = document.querySelector("[data-unit-count]");
  var empty = document.querySelector("[data-no-results]");
  var pagination = document.querySelector("[data-unit-pagination]");
  var previous = document.querySelector("[data-page-previous]");
  var next = document.querySelector("[data-page-next]");
  var pageStatus = document.querySelector("[data-page-status]");
  var pageSize = 12;
  var currentPage = 1;

  if (!search || !faculty || !kind || cards.length === 0) return;

  function normalise(value) {
    return (value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function scrollToDirectory() {
    var target = document.querySelector(".directory-summary");
    if (!target) return;
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  function applyFilters(resetPage) {
    var query = normalise(search.value);
    var facultyValue = faculty.value;
    var kindValue = kind.value;
    var matches = cards.filter(function (card) {
      var matchesQuery =
        !query || normalise(card.getAttribute("data-search")).indexOf(query) !== -1;
      var matchesFaculty =
        !facultyValue || card.getAttribute("data-faculty") === facultyValue;
      var matchesKind =
        !kindValue || card.getAttribute("data-kind") === kindValue;
      return matchesQuery && matchesFaculty && matchesKind;
    });
    var pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
    if (resetPage) currentPage = 1;
    currentPage = Math.min(currentPage, pageCount);
    var first = (currentPage - 1) * pageSize;
    var last = first + pageSize;

    cards.forEach(function (card) {
      var matchIndex = matches.indexOf(card);
      card.hidden = matchIndex < first || matchIndex >= last;
    });

    if (count) {
      count.textContent =
        matches.length +
        (matches.length === 1 ? " result" : " results");
    }
    if (empty) empty.hidden = matches.length !== 0;
    if (pagination) pagination.hidden = matches.length <= pageSize;
    if (previous) previous.disabled = currentPage <= 1;
    if (next) next.disabled = currentPage >= pageCount;
    if (pageStatus) {
      pageStatus.textContent = "Page " + currentPage + " of " + pageCount;
    }
  }

  search.addEventListener("input", function () {
    applyFilters(true);
  });
  faculty.addEventListener("change", function () {
    applyFilters(true);
  });
  kind.addEventListener("change", function () {
    applyFilters(true);
  });
  if (previous) {
    previous.addEventListener("click", function () {
      if (currentPage <= 1) return;
      currentPage -= 1;
      applyFilters(false);
      scrollToDirectory();
    });
  }
  if (next) {
    next.addEventListener("click", function () {
      currentPage += 1;
      applyFilters(false);
      scrollToDirectory();
    });
  }
  applyFilters(true);
})();
