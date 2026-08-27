/* ============================================
   Lil Tours & Travel — Scroll Animations
   ============================================ */

(function () {
  "use strict";

  // --- IntersectionObserver for scroll reveals ---
  if (!("IntersectionObserver" in window)) {
    // Fallback: show everything immediately
    var elements = document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children");
    for (var i = 0; i < elements.length; i++) {
      elements[i].classList.add("visible");
    }
    return;
  }

  var observerOptions = {
    root: null,
    rootMargin: "0px 0px -60px 0px",
    threshold: 0.1
  };

  var observer = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].isIntersecting) {
        entries[i].target.classList.add("visible");
        observer.unobserve(entries[i].target);
      }
    }
  }, observerOptions);

  var revealElements = document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children");
  for (var j = 0; j < revealElements.length; j++) {
    observer.observe(revealElements[j]);
  }

  // --- Hero Image Crossfade ---
  var heroImages = document.querySelectorAll(".hero-bg img");
  if (heroImages.length > 1) {
    var currentHero = 0;

    // Mark first as active
    heroImages[0].classList.add("active");

    setInterval(function () {
      heroImages[currentHero].classList.remove("active");
      currentHero = (currentHero + 1) % heroImages.length;
      heroImages[currentHero].classList.add("active");
    }, 5000);
  } else if (heroImages.length === 1) {
    heroImages[0].classList.add("active");
  }

  // --- Counter Animation (if stats section exists) ---
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length > 0) {
    var counterObserver = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          var el = entries[i].target;
          var target = parseInt(el.getAttribute("data-count"), 10);
          var duration = 2000;
          var start = 0;
          var startTime = null;

          function animate(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target);
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              el.textContent = target;
            }
          }

          requestAnimationFrame(animate);
          counterObserver.unobserve(el);
        }
      }
    }, { threshold: 0.5 });

    for (var k = 0; k < counters.length; k++) {
      counterObserver.observe(counters[k]);
    }
  }
})();
