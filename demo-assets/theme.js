(function () {
  "use strict";

  var storageKey = "site-theme";
  var root = document.documentElement;
  var media = window.matchMedia("(prefers-color-scheme: dark)");
  var institutionalName =
    "Dr. Vishwanath Karad MIT World Peace University";

  function installInstitutionalLockup() {
    var header = document.querySelector(".site-header");
    if (!header || header.querySelector(".institutional-lockup")) return;

    var inner = header.querySelector(".header-inner, .site-header__inner");
    if (!inner) return;

    var existingBrand = inner.querySelector(
      ":scope > .brand, :scope > .wordmark, :scope > .academic-brand"
    );
    var normalizedBrand = existingBrand
      ? existingBrand.textContent.replace(/\s+/g, " ").trim()
      : "";
    var genericBrand = normalizedBrand === "MIT World Peace University";
    var institutionHome = document.querySelector(".institution-home");
    var href = institutionHome
      ? institutionHome.getAttribute("href")
      : genericBrand && existingBrand
        ? existingBrand.getAttribute("href")
        : "/";

    var lockup = document.createElement("a");
    lockup.className = "institutional-lockup";
    lockup.href = href;
    lockup.setAttribute("aria-label", institutionalName + " home");
    lockup.innerHTML =
      '<img class="institutional-lockup__logo" src="/demo-assets/brand/mitwpu-official-logo.webp" alt="" width="431" height="124" data-media-role="logo">';

    if (genericBrand) {
      existingBrand.replaceWith(lockup);
      return;
    }

    var brands = document.createElement("div");
    brands.className = "masthead-brands";
    inner.insertBefore(brands, existingBrand || inner.firstChild);
    brands.appendChild(lockup);
    if (existingBrand) brands.appendChild(existingBrand);
  }

  function installInstitutionalNavigation() {
    var header = document.querySelector(".site-header");
    if (!header || header.querySelector(".masthead-brands")) return;

    var nav = header.querySelector(".site-nav, .primary-nav");
    if (!nav) return;

    var links = [
      ["About", "/about/"],
      ["Academics", "/academics/"],
      ["Admissions", "/admissions/"],
      ["Research", "/research/"],
      ["People", "/people/"],
      ["Campus", "/life-at-mit-wpu/"],
      ["Search", "/search/"],
    ];
    var path = window.location.pathname.replace(/\/+$/, "/");
    nav.replaceChildren();
    links.forEach(function (item) {
      var link = document.createElement("a");
      link.textContent = item[0];
      link.href = item[1];
      if (
        path === item[1]
        || (item[1] !== "/" && path.indexOf(item[1]) === 0)
      ) {
        link.setAttribute("aria-current", "page");
      }
      nav.appendChild(link);
    });
  }

  function initMobileNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-global-nav]");
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    function setSubmenuOpen(button, open) {
      var item = button.closest(".nav-item--menu");
      if (!item) return;
      item.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", String(open));
    }

    function closeSubmenus(except) {
      nav.querySelectorAll(".nav-item__disclosure").forEach(function (button) {
        if (button !== except) setSubmenuOpen(button, false);
      });
    }

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });

    // Tapping a destination closes the panel so the page is visible on arrival.
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        setOpen(false);
        closeSubmenus();
      }
    });

    // Escape and taps outside the masthead dismiss the menu.
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        setOpen(false);
        closeSubmenus();
      }
    });
    document.addEventListener("click", function (event) {
      if (
        nav.classList.contains("is-open")
        && !event.target.closest("[data-global-masthead]")
      ) {
        setOpen(false);
      }
      if (!event.target.closest("[data-global-masthead]")) closeSubmenus();
    });

    // Returning to a wide viewport must never leave the page with a hidden nav.
    window.matchMedia("(min-width: 768px)").addEventListener("change", function (event) {
      if (event.matches) setOpen(false);
    });

    nav.querySelectorAll(".nav-item__disclosure").forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.preventDefault();
        var item = btn.closest(".nav-item--menu");
        if (!item) return;
        var open = !item.classList.contains("is-open");
        closeSubmenus(btn);
        setSubmenuOpen(btn, open);
      });
    });
  }

  function initProgrammeDirectories() {
    document.querySelectorAll("[data-programme-directory]").forEach(function (directory) {
      var search = directory.querySelector("[data-programme-search]");
      var levelRoute = directory.querySelector("[data-programme-level-route]");
      var discipline = directory.querySelector("[data-programme-discipline]");
      var cards = Array.from(directory.querySelectorAll("[data-programme-card]"));
      var count = directory.querySelector("[data-programme-count]");
      var empty = directory.querySelector("[data-programme-empty]");
      var selectedCount = directory.querySelector("[data-programme-selected-count]");
      var compare = directory.querySelector("[data-programme-compare]");
      var clear = directory.querySelector("[data-programme-clear]");
      var comparison = directory.querySelector("[data-programme-comparison]");
      var comparisonGrid = directory.querySelector("[data-programme-comparison-grid]");
      if (!search || !discipline || cards.length === 0) return;

      function update() {
        var query = search.value.trim().toLocaleLowerCase();
        var selectedDiscipline = discipline.value;
        var visible = 0;
        cards.forEach(function (card) {
          var matchesQuery = !query || card.dataset.search.indexOf(query) !== -1;
          var matchesDiscipline =
            !selectedDiscipline || card.dataset.discipline === selectedDiscipline;
          var show = matchesQuery && matchesDiscipline;
          card.hidden = !show;
          if (show) visible += 1;
        });
        if (count) {
          count.textContent = visible + " " + (visible === 1 ? "programme" : "programmes");
        }
        if (empty) empty.hidden = visible !== 0;
      }

      function selectedCards() {
        return cards.filter(function (card) {
          var checkbox = card.querySelector("[data-programme-select]");
          return checkbox && checkbox.checked;
        });
      }

      function updateSelection() {
        var selected = selectedCards().length;
        if (selectedCount) selectedCount.textContent = selected + " selected";
        if (compare) compare.disabled = selected === 0;
        if (clear) clear.disabled = selected === 0;
        if (selected === 0 && comparison) comparison.hidden = true;
      }

      function renderComparison() {
        if (!comparison || !comparisonGrid) return;
        comparisonGrid.replaceChildren();
        selectedCards().forEach(function (card) {
          var article = document.createElement("article");
          var title = document.createElement("h3");
          var facts = document.createElement("p");
          var summary = document.createElement("p");
          var link = document.createElement("a");
          title.textContent = card.dataset.title;
          facts.textContent = [
            card.dataset.level,
            card.dataset.discipline,
            card.dataset.duration,
          ].filter(Boolean).join(" · ");
          summary.textContent = card.dataset.summary;
          link.href = card.dataset.href;
          link.textContent = "Programme details";
          article.append(title, facts, summary, link);
          comparisonGrid.append(article);
        });
        comparison.hidden = false;
        var heading = comparison.querySelector("h2");
        if (heading) heading.focus();
      }

      if (levelRoute) {
        levelRoute.addEventListener("change", function () {
          window.location.assign(levelRoute.value);
        });
      }
      search.addEventListener("input", update);
      discipline.addEventListener("change", update);
      cards.forEach(function (card) {
        var checkbox = card.querySelector("[data-programme-select]");
        if (checkbox) checkbox.addEventListener("change", updateSelection);
      });
      if (compare) compare.addEventListener("click", renderComparison);
      if (clear) {
        clear.addEventListener("click", function () {
          cards.forEach(function (card) {
            var checkbox = card.querySelector("[data-programme-select]");
            if (checkbox) checkbox.checked = false;
          });
          if (comparison) comparison.hidden = true;
          updateSelection();
        });
      }
    });
  }

  function storedTheme() {
    try {
      var value = window.localStorage.getItem(storageKey);
      return value === "light" || value === "dark" ? value : "";
    } catch (_error) {
      return "";
    }
  }

  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function preferredTheme() {
    return storedTheme() || (media.matches ? "dark" : "light");
  }

  function applyTheme(theme) {
    if (theme === "dark") root.setAttribute("data-theme", "dark");
    else root.setAttribute("data-theme", "light");

    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      var dark = theme === "dark";
      button.setAttribute("aria-pressed", String(dark));
      button.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      button.title = dark ? "Switch to light mode" : "Switch to dark mode";
    });
  }

  function toggleTheme() {
    var next = currentTheme() === "dark" ? "light" : "dark";
    try {
      window.localStorage.setItem(storageKey, next);
    } catch (_error) {
      // The selected theme still applies to the current page.
    }
    applyTheme(next);
  }

  installInstitutionalLockup();
  installInstitutionalNavigation();

  function initPage() {
    applyTheme(preferredTheme());
    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      button.addEventListener("click", toggleTheme);
    });
    initMobileNav();
    initProgrammeDirectories();
  }

  // Some pages load this shared file late while others defer it from <head>.
  // Initialise correctly in both cases so the same masthead always behaves alike.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPage, { once: true });
  } else {
    initPage();
  }

  function followDeviceTheme(event) {
    if (!storedTheme()) applyTheme(event.matches ? "dark" : "light");
  }

  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", followDeviceTheme);
  } else if (typeof media.addListener === "function") {
    media.addListener(followDeviceTheme);
  }
})();

/* ------------------------------------------------------------------ *
 * Global masthead dropdowns — standard hover-intent (added 2026-07-25)
 * Opens a menu when the pointer enters the item, and closes it ~240ms
 * after the pointer has left BOTH the trigger and its panel. The short
 * close-delay is the conventional fix for the "diagonal gap" problem:
 * moving from a narrow trigger into a wider panel (or briefly clipping a
 * sibling) no longer slams the menu shut. Drives the existing `.is-open`
 * class, so the CSS that already reveals `.nav-menu.is-open` does the
 * showing. Desktop pointers only; touch/mobile keep the click accordion.
 * Self-contained + idempotent so it is safe to load once per page.
 * ------------------------------------------------------------------ */
(function () {
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }
  ready(function () {
    if (document.documentElement.hasAttribute("data-nav-hover-intent")) return;
    document.documentElement.setAttribute("data-nav-hover-intent", "1");

    var desktop = window.matchMedia("(min-width: 768px)");
    var items = Array.prototype.slice.call(
      document.querySelectorAll("[data-global-masthead] .nav-item--menu")
    );
    if (!items.length) return;

    var timers = new WeakMap();

    function closeAll(except) {
      items.forEach(function (it) {
        if (it !== except) {
          clearTimeout(timers.get(it));
          it.classList.remove("is-open");
        }
      });
    }

    items.forEach(function (item) {
      function open() {
        if (!desktop.matches) return;      // mobile uses the click accordion
        clearTimeout(timers.get(item));
        closeAll(item);                    // one menu open at a time
        item.classList.add("is-open");
      }
      function scheduleClose() {
        if (!desktop.matches) return;
        clearTimeout(timers.get(item));
        timers.set(
          item,
          setTimeout(function () { item.classList.remove("is-open"); }, 240)
        );
      }
      // Pointer: mouseleave does not fire while the pointer is over the
      // panel (it is a DOM descendant), so the menu stays open over it;
      // the 240ms delay covers the brief off-element transit in between.
      item.addEventListener("mouseenter", open);
      item.addEventListener("mouseleave", scheduleClose);
      // Keyboard parity: focus opens, focus leaving the item closes.
      item.addEventListener("focusin", open);
      item.addEventListener("focusout", function (event) {
        if (desktop.matches && !item.contains(event.relatedTarget)) {
          item.classList.remove("is-open");
        }
      });
    });

    // Click outside the masthead, or Escape, dismisses any open menu.
    document.addEventListener("click", function (event) {
      if (!event.target.closest("[data-global-masthead]")) closeAll(null);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeAll(null);
    });
    // Crossing below the desktop breakpoint clears desktop open-state so the
    // mobile panel never inherits a stuck-open submenu.
    desktop.addEventListener("change", function (event) {
      if (!event.matches) closeAll(null);
    });
  });
})();
