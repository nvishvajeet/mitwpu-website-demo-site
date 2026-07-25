(function () {
  "use strict";

  const storageKey = "site-theme";
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const institutionalName =
    "Dr. Vishwanath Karad MIT World Peace University";

  function installInstitutionalLockup() {
    const bar = document.querySelector(".institution-bar");
    if (!bar || bar.querySelector(".institutional-lockup")) return;
    const inner = bar.querySelector(".institution-inner");
    if (!inner) return;

    const institutionHome = inner.querySelector(
      ".institution-home, .institution-name",
    );
    const href = institutionHome?.getAttribute("href") || "/";

    const lockup = document.createElement("a");
    lockup.className = "institutional-lockup";
    lockup.href = href;
    lockup.setAttribute("aria-label", `${institutionalName} home`);
    lockup.innerHTML =
      '<img class="institutional-lockup__logo" src="/demo-assets/brand/mitwpu-official-logo.webp" alt="" width="431" height="124" data-media-role="logo">';

    if (institutionHome) institutionHome.replaceWith(lockup);
    else inner.prepend(lockup);
  }

  function installInstitutionalNavigation() {
    const bar = document.querySelector(".institution-bar");
    if (!bar) return;
    // The release builder already ships the canonical masthead (with its
    // dropdown mega-menu). Never rebuild it flat — that would wipe the menus.
    if (bar.hasAttribute("data-global-masthead")) return;
    const inner = bar.querySelector(".institution-inner");
    if (!inner) return;

    // Older page templates only supplied the university lock-up. Create the
    // standard navigation container so every page gets the same sticky bar.
    let nav = bar.querySelector(".institution-links");
    if (!nav) {
      nav = document.createElement("nav");
      nav.className = "institution-links";
      inner.append(nav);
    }
    const themeToggle = document.querySelector("[data-theme-toggle]");
    const duplicateInstitutionalNav = document.querySelector(
      ".site-header .site-nav.institutional-nav",
    );

    const links = [
      ["About", "/about/"],
      ["Academics", "/academics/"],
      ["Admissions", "/admissions/"],
      ["Research", "/research/"],
      ["People", "/people/"],
      ["Campus", "/life-at-mit-wpu/"],
      ["Search", "/search/"],
    ];
    const path = window.location.pathname.replace(/\/+$/, "/");
    const researchContext = /^\/(?:groups|facilities|photonics|quantum|astrophysics|bioinformatics)\//.test(path);
    nav.replaceChildren();
    nav.setAttribute("aria-label", "University navigation");
    links.forEach(([label, href]) => {
      const link = document.createElement("a");
      link.textContent = label;
      link.href = href;
      if (
        path === href
        || (href !== "/" && path.startsWith(href))
        || (href === "/research/" && researchContext)
      ) {
        link.setAttribute("aria-current", "page");
      }
      nav.append(link);
    });
    if (themeToggle) nav.append(themeToggle);
    if (duplicateInstitutionalNav && duplicateInstitutionalNav !== nav) {
      duplicateInstitutionalNav.remove();
      document.querySelector(".site-header")?.classList.add(
        "site-header--context-only",
      );
    }
  }

  function storedTheme() {
    try {
      const value = window.localStorage.getItem(storageKey);
      return value === "light" || value === "dark" ? value : "";
    } catch (_error) {
      return "";
    }
  }

  function preferredTheme() {
    return storedTheme() || (media.matches ? "dark" : "light");
  }

  function applyTheme(theme) {
    if (theme === "dark") root.setAttribute("data-theme", "dark");
    else root.setAttribute("data-theme", "light");
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const dark = theme === "dark";
      button.setAttribute("aria-pressed", String(dark));
      button.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      button.title = dark ? "Switch to light mode" : "Switch to dark mode";
    });
  }

  function toggleTheme() {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    try {
      window.localStorage.setItem(storageKey, next);
    } catch (_error) {
      // The theme still changes for the current page when storage is unavailable.
    }
    applyTheme(next);
  }

  const initMobileNav = () => {
    const toggle = document.querySelector("[data-nav-toggle]");
    const nav = document.querySelector("[data-global-nav]");
    if (!toggle || !nav) return;
    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    const setSubmenuOpen = (button, open) => {
      const item = button.closest(".nav-item--menu");
      if (!item) return;
      item.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", String(open));
    };
    const closeSubmenus = (except) => {
      nav.querySelectorAll(".nav-item__disclosure").forEach((button) => {
        if (button !== except) setSubmenuOpen(button, false);
      });
    };
    toggle.addEventListener("click", () => {
      setOpen(!nav.classList.contains("is-open"));
    });
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        setOpen(false);
        closeSubmenus();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        closeSubmenus();
      }
    });
    document.addEventListener("click", (event) => {
      if (
        nav.classList.contains("is-open")
        && !event.target.closest("[data-global-masthead]")
      ) {
        setOpen(false);
      }
      if (!event.target.closest("[data-global-masthead]")) closeSubmenus();
    });
    window.matchMedia("(min-width: 768px)").addEventListener("change", (event) => {
      if (event.matches) setOpen(false);
    });

    nav.querySelectorAll(".nav-item__disclosure").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        const item = btn.closest(".nav-item--menu");
        if (!item) return;
        const open = !item.classList.contains("is-open");
        closeSubmenus(btn);
        setSubmenuOpen(btn, open);
      });
    });
  };

  const initProgrammeDirectories = () => {
    document.querySelectorAll("[data-programme-directory]").forEach((directory) => {
      const search = directory.querySelector("[data-programme-search]");
      const levelRoute = directory.querySelector("[data-programme-level-route]");
      const discipline = directory.querySelector("[data-programme-discipline]");
      const cards = Array.from(directory.querySelectorAll("[data-programme-card]"));
      const count = directory.querySelector("[data-programme-count]");
      const empty = directory.querySelector("[data-programme-empty]");
      const selectedCount = directory.querySelector("[data-programme-selected-count]");
      const compare = directory.querySelector("[data-programme-compare]");
      const clear = directory.querySelector("[data-programme-clear]");
      const comparison = directory.querySelector("[data-programme-comparison]");
      const comparisonGrid = directory.querySelector("[data-programme-comparison-grid]");
      if (!search || !discipline || cards.length === 0) return;

      const update = () => {
        const query = search.value.trim().toLocaleLowerCase();
        const selectedDiscipline = discipline.value;
        let visible = 0;
        cards.forEach((card) => {
          const matchesQuery = !query || card.dataset.search.includes(query);
          const matchesDiscipline =
            !selectedDiscipline || card.dataset.discipline === selectedDiscipline;
          const show = matchesQuery && matchesDiscipline;
          card.hidden = !show;
          if (show) visible += 1;
        });
        if (count) count.textContent = `${visible} ${visible === 1 ? "programme" : "programmes"}`;
        if (empty) empty.hidden = visible !== 0;
      };

      const selectedCards = () =>
        cards.filter((card) => card.querySelector("[data-programme-select]")?.checked);

      const updateSelection = () => {
        const selected = selectedCards().length;
        if (selectedCount) selectedCount.textContent = `${selected} selected`;
        if (compare) compare.disabled = selected === 0;
        if (clear) clear.disabled = selected === 0;
        if (selected === 0 && comparison) comparison.hidden = true;
      };

      const renderComparison = () => {
        if (!comparison || !comparisonGrid) return;
        comparisonGrid.replaceChildren();
        selectedCards().forEach((card) => {
          const article = document.createElement("article");
          const title = document.createElement("h3");
          const facts = document.createElement("p");
          const summary = document.createElement("p");
          const link = document.createElement("a");
          title.textContent = card.dataset.title;
          facts.textContent = [card.dataset.level, card.dataset.discipline, card.dataset.duration]
            .filter(Boolean)
            .join(" · ");
          summary.textContent = card.dataset.summary;
          link.href = card.dataset.href;
          link.textContent = "Programme details";
          article.append(title, facts, summary, link);
          comparisonGrid.append(article);
        });
        comparison.hidden = false;
        comparison.querySelector("h2")?.focus();
      };

      levelRoute?.addEventListener("change", () => {
        window.location.assign(levelRoute.value);
      });
      search.addEventListener("input", update);
      discipline.addEventListener("change", update);
      cards.forEach((card) => {
        card.querySelector("[data-programme-select]")?.addEventListener(
          "change",
          updateSelection,
        );
      });
      compare?.addEventListener("click", renderComparison);
      clear?.addEventListener("click", () => {
        cards.forEach((card) => {
          const checkbox = card.querySelector("[data-programme-select]");
          if (checkbox) checkbox.checked = false;
        });
        if (comparison) comparison.hidden = true;
        updateSelection();
      });
    });
  };

  installInstitutionalLockup();
  installInstitutionalNavigation();

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(preferredTheme());
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.addEventListener("click", toggleTheme);
    });
    initMobileNav();
    initProgrammeDirectories();
  });

  const followDeviceTheme = (event) => {
    if (!storedTheme()) applyTheme(event.matches ? "dark" : "light");
  };
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

    var desktop = window.matchMedia("(min-width: 768px) and (pointer: fine)");
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
