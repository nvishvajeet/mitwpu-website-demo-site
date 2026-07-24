(function () {
  "use strict";

  function initialiseScrollReveals() {
    var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches || !("IntersectionObserver" in window)) return;

    var groups = [
      [".activity .section-heading", 0],
      [".activity-card", 45],
      [".directory .section-heading", 0],
      [".directory-group", 60]
    ];
    var items = [];

    groups.forEach(function (group) {
      Array.prototype.forEach.call(document.querySelectorAll(group[0]), function (element, index) {
        element.classList.add("scroll-reveal");
        element.style.setProperty("--reveal-delay", String((index % 4) * group[1]) + "ms");
        items.push(element);
      });
    });
    if (!items.length) return;

    document.documentElement.classList.add("has-scroll-reveal");
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.12
    });
    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  function initialiseActivityRail(rail) {
    if (!rail) return;
    var interactionRegion = rail.closest(".activity") || rail;

    // Feed cards stay server-rendered; the rail works unchanged when a CMS
    // later supplies the same data-feed-list markup.
    var cards = Array.prototype.slice.call(rail.querySelectorAll(".activity-card"));
    if (!cards.length) return;

    var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var paused = motion.matches;
    var pointerInside = false;
    var focusInside = false;
    var timer = null;
    var scrollFrame = null;
    var resizeFrame = null;
    var activeIndex = 0;

    function cardDistance() {
      var grid = rail.querySelector(".activity-grid");
      var styles = window.getComputedStyle(grid);
      var gap = parseFloat(styles.columnGap || styles.gap) || 0;
      return cards[0].getBoundingClientRect().width + gap;
    }

    function currentIndex() {
      var distance = cardDistance();
      if (!distance) return 0;
      return Math.max(0, Math.min(maximumStart(), Math.round(rail.scrollLeft / distance)));
    }

    function visibleCount() {
      var distance = cardDistance();
      if (!distance) return 1;
      return Math.max(1, Math.min(cards.length, Math.round(rail.clientWidth / distance)));
    }

    function maximumStart() {
      return Math.max(0, cards.length - visibleCount());
    }

    function goTo(index, behavior) {
      var maximum = maximumStart();
      var target = index > maximum ? 0 : index < 0 ? maximum : index;
      activeIndex = target;
      rail.scrollTo({
        left: target * cardDistance(),
        behavior: behavior || (motion.matches ? "auto" : "smooth")
      });
    }

    function stopTimer() {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function startTimer() {
      stopTimer();
      if (paused || pointerInside || focusInside || document.hidden) return;
      timer = window.setInterval(function () {
        goTo(currentIndex() + 1);
      }, 6000);
    }

    function move(direction) {
      goTo(currentIndex() + direction);
      startTimer();
    }

    rail.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      move(event.key === "ArrowLeft" ? -1 : 1);
    });
    interactionRegion.addEventListener("pointerenter", function () {
      pointerInside = true;
      stopTimer();
    });
    interactionRegion.addEventListener("pointerleave", function () {
      pointerInside = false;
      startTimer();
    });
    interactionRegion.addEventListener("focusin", function () {
      focusInside = true;
      stopTimer();
    });
    interactionRegion.addEventListener("focusout", function (event) {
      if (interactionRegion.contains(event.relatedTarget)) return;
      focusInside = false;
      startTimer();
    });
    rail.addEventListener("scroll", function () {
      if (scrollFrame !== null) return;
      scrollFrame = window.requestAnimationFrame(function () {
        activeIndex = currentIndex();
        scrollFrame = null;
      });
    }, { passive: true });
    window.addEventListener("resize", function () {
      if (resizeFrame !== null) return;
      resizeFrame = window.requestAnimationFrame(function () {
        goTo(activeIndex, "auto");
        resizeFrame = null;
      });
    });
    document.addEventListener("visibilitychange", startTimer);

    function respondToMotionPreference(event) {
      paused = event.matches;
      startTimer();
    }

    if (motion.addEventListener) {
      motion.addEventListener("change", respondToMotionPreference);
    } else if (motion.addListener) {
      motion.addListener(respondToMotionPreference);
    }

    startTimer();
  }

  function initialiseHeroCarousel(carousel) {
    if (!carousel) return;
    var slides = Array.prototype.slice.call(
      carousel.querySelectorAll("[data-hero-slide]")
    );
    if (slides.length < 2) return;

    var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var activeIndex = 0;
    var pointerInside = false;
    var focusInside = false;
    var timer = null;

    function show(index) {
      activeIndex = index >= slides.length ? 0 : index < 0 ? slides.length - 1 : index;
      slides.forEach(function (slide, slideIndex) {
        var active = slideIndex === activeIndex;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", active ? "false" : "true");
      });
    }

    function stopTimer() {
      if (timer === null) return;
      window.clearInterval(timer);
      timer = null;
    }

    function startTimer() {
      stopTimer();
      if (motion.matches || pointerInside || focusInside || document.hidden) return;
      timer = window.setInterval(function () {
        show(activeIndex + 1);
      }, 6000);
    }

    carousel.addEventListener("pointerenter", function () {
      pointerInside = true;
      stopTimer();
    });
    carousel.addEventListener("pointerleave", function () {
      pointerInside = false;
      startTimer();
    });
    carousel.addEventListener("focusin", function () {
      focusInside = true;
      stopTimer();
    });
    carousel.addEventListener("focusout", function (event) {
      if (carousel.contains(event.relatedTarget)) return;
      focusInside = false;
      startTimer();
    });
    document.addEventListener("visibilitychange", startTimer);

    function respondToMotionPreference() {
      if (motion.matches) show(0);
      startTimer();
    }

    if (motion.addEventListener) {
      motion.addEventListener("change", respondToMotionPreference);
    } else if (motion.addListener) {
      motion.addListener(respondToMotionPreference);
    }

    show(0);
    startTimer();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initialiseScrollReveals();
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-hero-carousel]"),
      initialiseHeroCarousel
    );
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-activity-rail]"),
      initialiseActivityRail
    );
  });
})();
