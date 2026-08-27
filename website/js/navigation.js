/* ============================================
   Lil Tours & Travel — Navigation
   ============================================ */

(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var menuToggle = document.querySelector(".menu-toggle");
  var mobileNav = document.querySelector(".mobile-nav");
  var mobileLinks = mobileNav ? mobileNav.querySelectorAll("a") : [];
  var body = document.body;

  // --- Sticky Header ---
  function handleScroll() {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  // --- Mobile Menu ---
  function openMenu() {
    menuToggle.classList.add("active");
    mobileNav.classList.add("open");
    body.style.overflow = "hidden";
    menuToggle.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    menuToggle.classList.remove("active");
    mobileNav.classList.remove("open");
    body.style.overflow = "";
    menuToggle.setAttribute("aria-expanded", "false");
  }

  function toggleMenu() {
    if (mobileNav.classList.contains("open")) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", toggleMenu);
  }

  // Close mobile nav on link click
  for (var i = 0; i < mobileLinks.length; i++) {
    mobileLinks[i].addEventListener("click", closeMenu);
  }

  // Close on Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && mobileNav.classList.contains("open")) {
      closeMenu();
      menuToggle.focus();
    }
  });

  // --- Active Nav Link ---
  var sections = document.querySelectorAll("section[id]");
  var navLinks = document.querySelectorAll(".main-nav a[href^='#']");

  function setActiveLink() {
    var scrollPos = window.scrollY + 120;

    for (var i = 0; i < sections.length; i++) {
      var section = sections[i];
      var top = section.offsetTop;
      var height = section.offsetHeight;
      var id = section.getAttribute("id");

      if (scrollPos >= top && scrollPos < top + height) {
        for (var j = 0; j < navLinks.length; j++) {
          navLinks[j].classList.remove("active");
          if (navLinks[j].getAttribute("href") === "#" + id) {
            navLinks[j].classList.add("active");
          }
        }
      }
    }
  }

  window.addEventListener("scroll", setActiveLink, { passive: true });
  setActiveLink();
})();
