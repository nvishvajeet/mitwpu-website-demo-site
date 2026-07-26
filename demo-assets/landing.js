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

  var HERO_INTERVAL = 6000;

  /* The hero's five campus photographs, and the controls that steer them.
   *
   * There are two quite different reasons the rotation can be stopped, and
   * keeping them apart is the whole design of this function:
   *
   *   `stopped`  — the reader pressed pause, or asked the operating system
   *                for reduced motion. This is a DECISION. Nothing clears it
   *                except the reader pressing play. Leaving the hero, moving
   *                the mouse away, switching tabs and coming back: none of
   *                them restart it. A pause that quietly expires is worse
   *                than no pause at all, because the reader stops trusting
   *                the button and has no way to find out they should.
   *
   *   `pointerInside` / `focusInside` / `document.hidden`
   *              — the reader is reading this, or is not here at all. These
   *                are CIRCUMSTANCES, and they clear themselves: rotation
   *                resumes when the reader moves away, provided they never
   *                pressed pause.
   *
   * startTimer() refuses on either, so the two compose without a third state:
   * hovering a paused carousel and leaving again does not start it.
   */
  function initialiseHeroCarousel(carousel) {
    if (!carousel) return;
    var slides = Array.prototype.slice.call(
      carousel.querySelectorAll("[data-hero-slide]")
    );
    if (slides.length < 2) return;

    var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var controls = carousel.querySelector("[data-hero-controls]");
    var toggle = carousel.querySelector("[data-hero-toggle]");
    var toggleName = carousel.querySelector("[data-hero-toggle-name]");
    var status = carousel.querySelector("[data-hero-status]");
    var meter = carousel.querySelector("[data-hero-meter]");
    var segments = [];
    var activeIndex = 0;
    var pointerInside = false;
    var focusInside = false;
    var timer = null;

    /* Reduced motion means the carousel opens stopped, not that the reader is
     * forbidden to start it. The preference says "do not move things at me
     * unasked"; pressing play is asking. */
    var stopped = motion.matches;

    if (meter) {
      slides.forEach(function () {
        var segment = document.createElement("span");
        segment.className = "hero-meter__segment";
        segment.appendChild(document.createElement("span")).className =
          "hero-meter__fill";
        meter.appendChild(segment);
        segments.push(segment);
      });
      meter.style.setProperty("--hero-interval", HERO_INTERVAL + "ms");
    }

    function paintMeter() {
      segments.forEach(function (segment, index) {
        segment.classList.toggle("is-active", index === activeIndex);
        segment.classList.toggle("is-seen", index < activeIndex);
      });
    }

    function show(index) {
      activeIndex = index >= slides.length ? 0 : index < 0 ? slides.length - 1 : index;
      slides.forEach(function (slide, slideIndex) {
        var active = slideIndex === activeIndex;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", active ? "false" : "true");
      });
      paintMeter();
      if (status) {
        status.textContent =
          "Photograph " + (activeIndex + 1) + " of " + slides.length;
      }
    }

    function stopTimer() {
      if (timer === null) return;
      window.clearInterval(timer);
      timer = null;
    }

    function startTimer() {
      stopTimer();
      if (stopped || pointerInside || focusInside || document.hidden) return;
      timer = window.setInterval(function () {
        show(activeIndex + 1);
      }, HERO_INTERVAL);
    }

    /* Two classes, because two different things are being reported and they
     * disagree constantly.
     *
     * `is-paused` is the toggle's own state and follows `stopped` alone. It
     * swaps the pause glyph for a play glyph. Hovering must NOT swap it: the
     * button would then offer to play a carousel that is going to resume by
     * itself the moment the pointer leaves, and pressing it would stop the
     * thing the reader was trying to start.
     *
     * `is-idle` is whether the rotation is actually advancing right now, for
     * any of the four reasons, and it freezes the meter's countdown. That one
     * SHOULD catch hover — a meter still counting down towards an advance
     * that has been suspended is telling the reader something untrue.
     *
     * The status line is live only while the reader is driving. Announcing
     * every automatic advance would talk over whatever else is being read,
     * six seconds at a time, to say something nobody asked for; announcing a
     * press of previous/next is confirming an action they just took.
     */
    function syncControls() {
      if (controls) {
        controls.classList.toggle("is-paused", stopped);
        controls.classList.toggle("is-idle", timer === null);
      }
      if (toggle) toggle.setAttribute("aria-pressed", stopped ? "true" : "false");
      if (toggleName) {
        toggleName.textContent = stopped
          ? "Play the campus photographs"
          : "Pause the campus photographs";
      }
      if (status) status.setAttribute("aria-live", stopped ? "polite" : "off");
    }

    /* The countdown has to be restarted whenever the interval is, or the two
     * drift apart: leaving a hovered hero starts a fresh six seconds while
     * the segment is still showing however much of the previous six it had
     * got through. Removing the class and reading offsetWidth forces the
     * style to settle before it goes back on, which is what makes the browser
     * treat it as a new animation rather than the same one continuing. */
    function restartMeter() {
      var segment = segments[activeIndex];
      if (!segment) return;
      segment.classList.remove("is-active");
      void segment.offsetWidth;
      segment.classList.add("is-active");
    }

    function run() {
      startTimer();
      if (timer !== null) restartMeter();
      syncControls();
    }

    function step(direction) {
      show(activeIndex + direction);
      run();
    }

    Array.prototype.forEach.call(
      carousel.querySelectorAll("[data-hero-step]"),
      function (button) {
        var direction = Number(button.getAttribute("data-hero-step")) || 1;
        button.addEventListener("click", function () {
          step(direction);
        });
      }
    );

    if (toggle) {
      toggle.addEventListener("click", function () {
        stopped = !stopped;
        if (stopped) stopTimer();
        run();
      });
    }

    carousel.addEventListener("pointerenter", function () {
      pointerInside = true;
      stopTimer();
      syncControls();
    });
    carousel.addEventListener("pointerleave", function () {
      pointerInside = false;
      run();
    });
    carousel.addEventListener("focusin", function () {
      focusInside = true;
      stopTimer();
      syncControls();
    });
    carousel.addEventListener("focusout", function (event) {
      if (carousel.contains(event.relatedTarget)) return;
      focusInside = false;
      run();
    });
    document.addEventListener("visibilitychange", run);

    /* Turning the preference ON mid-visit stops the carousel, because the
     * reader has just asked for stillness. Turning it OFF does not start it:
     * that would restart a carousel the reader may have paused by hand, and
     * `stopped` cannot tell the two apart once set. Leaving it stopped costs
     * one press of play; the other way round breaks the pause. */
    function respondToMotionPreference() {
      if (!motion.matches) return;
      stopped = true;
      show(0);
      stopTimer();
      syncControls();
    }

    if (motion.addEventListener) {
      motion.addEventListener("change", respondToMotionPreference);
    } else if (motion.addListener) {
      motion.addListener(respondToMotionPreference);
    }

    /* Revealed only now. The controls ship `hidden` in the markup, so a page
     * without this script shows the first photograph and no controls, rather
     * than three buttons that do nothing. */
    if (controls) controls.hidden = false;

    show(0);
    run();
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
