/* ============================================
   Lil Tours & Travel — Main Script
   ============================================ */

(function () {
  "use strict";

  // --- WhatsApp Configuration ---
  // Replace with the actual WhatsApp number (country code without + or spaces)
  var WHATSAPP_NUMBER = ""; // e.g. "256700000000"

  function buildWhatsAppLink(service) {
    if (!WHATSAPP_NUMBER) {
      return "#contact";
    }
    var message = "Hello Lil Tours & Travel";
    if (service) {
      message += ", I am interested in " + service + ".";
    }
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
  }

  // Apply WhatsApp links to all elements with data-whatsapp attribute
  var whatsappElements = document.querySelectorAll("[data-whatsapp]");
  for (var i = 0; i < whatsappElements.length; i++) {
    (function (el) {
      var service = el.getAttribute("data-whatsapp");
      el.addEventListener("click", function (e) {
        if (WHATSAPP_NUMBER) {
          e.preventDefault();
          window.open(buildWhatsAppLink(service), "_blank", "noopener");
        }
      });
    })(whatsappElements[i]);
  }

  // Floating WhatsApp button
  var whatsappFloat = document.querySelector(".whatsapp-float");
  if (whatsappFloat && WHATSAPP_NUMBER) {
    whatsappFloat.href = buildWhatsAppLink("");
    whatsappFloat.setAttribute("target", "_blank");
    whatsappFloat.setAttribute("rel", "noopener");
  } else if (whatsappFloat) {
    whatsappFloat.href = "#contact";
  }

  // --- Smooth Scroll for Anchor Links ---
  var anchorLinks = document.querySelectorAll('a[href^="#"]');
  for (var j = 0; j < anchorLinks.length; j++) {
    anchorLinks[j].addEventListener("click", function (e) {
      var href = this.getAttribute("href");
      if (href === "#") return;
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        var headerHeight = document.querySelector(".site-header").offsetHeight || 72;
        var targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({ top: targetPosition, behavior: "smooth" });
      }
    });
  }

  // --- Footer Year ---
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // --- Keyboard support for service cards (role="button") ---
  var serviceCards = document.querySelectorAll('[data-service][role="button"]');
  for (var m = 0; m < serviceCards.length; m++) {
    serviceCards[m].addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.click();
      }
    });
  }
})();
