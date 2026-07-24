(function () {
  "use strict";

  var search = document.querySelector("[data-unit-search]");
  var faculty = document.querySelector("[data-faculty-filter]");
  var cards = Array.prototype.slice.call(
    document.querySelectorAll("[data-unit-card]"),
  );
  var groups = Array.prototype.slice.call(
    document.querySelectorAll("[data-faculty-group]"),
  );
  var count = document.querySelector("[data-unit-count]");
  var empty = document.querySelector("[data-no-results]");

  if (cards.length === 0) return;

  function normalise(value) {
    return (value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function applyFilters() {
    var query = normalise(search ? search.value : "");
    var facultyValue = faculty ? faculty.value : "";
    var matches = cards.filter(function (card) {
      var matchesQuery =
        !query || normalise(card.getAttribute("data-search")).indexOf(query) !== -1;
      var matchesFaculty =
        !facultyValue || card.getAttribute("data-faculty") === facultyValue;
      return matchesQuery && matchesFaculty;
    });

    cards.forEach(function (card) {
      card.hidden = matches.indexOf(card) === -1;
    });
    groups.forEach(function (group) {
      var visibleCards = Array.prototype.filter.call(
        group.querySelectorAll("[data-unit-card]"),
        function (card) {
          return !card.hidden;
        },
      );
      group.hidden = visibleCards.length === 0;
      var groupCount = group.querySelector("[data-faculty-count]");
      if (groupCount) {
        groupCount.textContent =
          visibleCards.length +
          (visibleCards.length === 1 ? " academic unit" : " academic units");
      }
    });

    if (count) {
      count.textContent =
        matches.length +
        (matches.length === 1 ? " academic unit" : " academic units");
    }
    if (empty) empty.hidden = matches.length !== 0;
  }

  if (search) {
    search.addEventListener("input", function () {
      applyFilters();
    });
  }
  if (faculty) {
    faculty.addEventListener("change", function () {
      applyFilters();
    });
  }
  applyFilters();
})();
