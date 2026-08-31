/* ============================================
   Lil Tours & Travel — Enquiry System
   ============================================
   Service selection, dynamic enquiry form,
   validation, WhatsApp conversion, success state.
   ============================================ */

(function () {
  "use strict";

  // --- WhatsApp Configuration ---
  var WHATSAPP_NUMBER = "256759327843";

  // --- API Configuration ---
  // Set to your registry domain in production, e.g. "https://registry.liltours.com"
  // Leave empty to use same-origin (registry served from same domain)
  var API_BASE_URL = "";

  // --- Service Definitions ---
  var SERVICES = {
    "Visa Services": {
      id: "visa",
      title: "Visa Assistance",
      description: "We can help you understand and prepare for your visa process. Our team provides guidance on documentation, application procedures, and requirements for a range of destinations.",
      fields: [
        { name: "destination", label: "Destination Country", type: "text", required: true, placeholder: "e.g. United States, United Kingdom" },
        { name: "travelPurpose", label: "Purpose of Travel", type: "select", required: true, options: ["", "Tourism", "Business", "Study", "Work", "Family Visit", "Medical", "Other"] },
        { name: "travelDate", label: "Intended Travel Period", type: "date", required: false },
        { name: "passportStatus", label: "Passport Status", type: "select", required: true, options: ["", "Have valid passport", "Need to apply/renew", "Have expired passport"] }
      ]
    },
    "Passport Assistance": {
      id: "passport",
      title: "Passport Assistance",
      description: "We help streamline the passport application and renewal process so you can focus on planning your journey.",
      fields: [
        { name: "passportAction", label: "What do you need?", type: "select", required: true, options: ["", "New passport application", "Passport renewal", "Passport replacement", "Other"] },
        { name: "destination", label: "Destination Country (if known)", type: "text", required: false, placeholder: "Optional" }
      ]
    },
    "Air Ticketing": {
      id: "air-ticket",
      title: "Air Ticketing",
      description: "Flight booking assistance for your next journey. We help you find the right flights at competitive rates.",
      fields: [
        { name: "departure", label: "Departure City", type: "text", required: true, placeholder: "e.g. Kampala" },
        { name: "destination", label: "Destination City", type: "text", required: true, placeholder: "e.g. London" },
        { name: "travelDate", label: "Travel Date", type: "date", required: true },
        { name: "returnDate", label: "Return Date", type: "date", required: false },
        { name: "tripType", label: "Trip Type", type: "select", required: true, options: ["", "One-way", "Return"] },
        { name: "travellers", label: "Number of Travellers", type: "number", required: true, placeholder: "1", min: 1, max: 20 }
      ]
    },
    "Work Abroad": {
      id: "work-abroad",
      title: "Work Abroad Consultancy",
      description: "Get professional guidance on overseas opportunities, documentation and travel requirements. We help you understand the process from start to finish.",
      fields: [
        { name: "destination", label: "Preferred Destination", type: "text", required: true, placeholder: "e.g. Canada, Australia" },
        { name: "industry", label: "Area / Industry of Interest", type: "text", required: false, placeholder: "e.g. Healthcare, IT, Construction" },
        { name: "consultationNotes", label: "Tell us what you need help with", type: "textarea", required: false, placeholder: "Describe your goals or questions..." }
      ]
    },
    "Car Hire": {
      id: "car-hire",
      title: "Car Hire",
      description: "Whether it's business travel, a tourism trip, or a special occasion, our car hire service gets you where you need to go.",
      fields: [
        { name: "pickupLocation", label: "Pickup Location", type: "text", required: true, placeholder: "e.g. Entebbe Airport" },
        { name: "dropoffLocation", label: "Drop-off Location", type: "text", required: false, placeholder: "Same as pickup if round trip" },
        { name: "hireDate", label: "Hire Date", type: "date", required: true },
        { name: "returnDate", label: "Return Date", type: "date", required: false },
        { name: "vehiclePreference", label: "Vehicle Preference", type: "select", required: false, options: ["", "Sedan", "SUV", "Van", "Minibus", "No preference"] }
      ]
    },
    "Hotel Reservations": {
      id: "hotel",
      title: "Hotel Reservations",
      description: "Comfortable stays at handpicked hotels worldwide. We help you find the right accommodation for your trip.",
      fields: [
        { name: "destination", label: "Destination / City", type: "text", required: true, placeholder: "e.g. Nairobi, Dubai" },
        { name: "checkinDate", label: "Check-in Date", type: "date", required: true },
        { name: "checkoutDate", label: "Check-out Date", type: "date", required: true },
        { name: "guests", label: "Number of Guests", type: "number", required: true, placeholder: "1", min: 1, max: 20 },
        { name: "accommodationType", label: "Accommodation Preference", type: "select", required: false, options: ["", "Budget", "Mid-range", "Luxury", "No preference"] }
      ]
    },
    "Airbnb Reservations": {
      id: "airbnb",
      title: "Airbnb Assistance",
      description: "Unique accommodations for every type of traveller. We help you find and book the perfect stay.",
      fields: [
        { name: "destination", label: "Destination / City", type: "text", required: true, placeholder: "e.g. Zanzibar, Marrakech" },
        { name: "checkinDate", label: "Check-in Date", type: "date", required: true },
        { name: "checkoutDate", label: "Check-out Date", type: "date", required: true },
        { name: "guests", label: "Number of Guests", type: "number", required: true, placeholder: "1", min: 1, max: 20 }
      ]
    },
    "Tourism": {
      id: "tourism",
      title: "Tourism & Travel",
      description: "Discover breathtaking destinations and create lasting memories. From local getaways to international adventures, we help you explore the world.",
      fields: [
        { name: "destination", label: "Preferred Destination", type: "text", required: true, placeholder: "e.g. Murchison Falls, Serengeti" },
        { name: "travellers", label: "Number of Travellers", type: "number", required: true, placeholder: "1", min: 1, max: 30 },
        { name: "travelDate", label: "Preferred Travel Period", type: "date", required: false },
        { name: "tripType", label: "Trip Type", type: "select", required: true, options: ["", "Day trip", "Weekend getaway", "Extended tour", "Custom itinerary"] },
        { name: "budgetRange", label: "Budget Range (optional)", type: "select", required: false, options: ["", "Budget-friendly", "Mid-range", "Premium", "Luxury", "Not sure yet"] }
      ]
    },
    "Delivery Services": {
      id: "delivery",
      title: "Delivery Services",
      description: "Reliable delivery solutions for your personal and business needs. Get a quotation for your delivery requirements.",
      fields: [
        { name: "pickupLocation", label: "Pickup Location", type: "text", required: true, placeholder: "e.g. Kampala City" },
        { name: "dropoffLocation", label: "Delivery Location", type: "text", required: true, placeholder: "e.g. Entebbe" },
        { name: "deliveryDate", label: "Preferred Delivery Date", type: "date", required: false },
        { name: "packageDetails", label: "Package Details", type: "textarea", required: false, placeholder: "Describe the item(s) to be delivered..." }
      ]
    },
    "Consultancy": {
      id: "consultancy",
      title: "Travel Consultancy",
      description: "Professional travel and general consultancy services. Whether you need advice on travel, visas, work abroad, or tourism planning — we're here to help.",
      fields: [
        { name: "consultationTopic", label: "Consultation Topic", type: "select", required: true, options: ["", "Travel planning", "Visa guidance", "Work abroad", "Tourism", "Other"] },
        { name: "consultationNotes", label: "Describe what you need help with", type: "textarea", required: true, placeholder: "Tell us about your travel plans or questions..." }
      ]
    }
  };

  // --- State ---
  var modal = null;
  var form = null;
  var currentService = null;
  var isOpen = false;

  // --- DOM Ready ---
  function init() {
    modal = document.getElementById("enquiry-modal");
    if (!modal) return;

    form = modal.querySelector("#enquiry-form");
    if (!form) return;

    bindModalEvents();
    bindServiceCards();
    checkUrlDeepLink();
  }

  // --- Modal Events ---
  function bindModalEvents() {
    // Close button
    var closeBtn = modal.querySelector(".enquiry-modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", closeModal);
    }

    // Backdrop click
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
    });

    // Escape key
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen) closeModal();
    });

    // Form submission
    form.addEventListener("submit", handleSubmit);

    // Reset button
    var resetBtn = modal.querySelector("#enquiry-reset");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        showFormState();
      });
    }

    // New enquiry button (from success state)
    var newBtn = modal.querySelector("#enquiry-new");
    if (newBtn) {
      newBtn.addEventListener("click", function () {
        showFormState();
        setTimeout(function () {
          var firstInput = form.querySelector("input:not([type=hidden]), select, textarea");
          if (firstInput) firstInput.focus();
        }, 100);
      });
    }

    // Retry button (from failure state)
    var retryBtn = modal.querySelector("#enquiry-retry");
    if (retryBtn) {
      retryBtn.addEventListener("click", function () {
        showFormState();
        setTimeout(function () {
          var firstInput = form.querySelector("input:not([type=hidden]), select, textarea");
          if (firstInput) firstInput.focus();
        }, 100);
      });
    }
  }

  // --- Service Cards ---
  function bindServiceCards() {
    var cards = document.querySelectorAll("[data-service]");
    for (var i = 0; i < cards.length; i++) {
      cards[i].addEventListener("click", function (e) {
        var serviceName = this.getAttribute("data-service");
        if (SERVICES[serviceName]) {
          e.preventDefault();
          openModal(serviceName);
        }
      });
    }
  }

  // --- URL Deep Link ---
  function checkUrlDeepLink() {
    var params = new URLSearchParams(window.location.search);
    var serviceParam = params.get("service");
    if (serviceParam) {
      // Find service by id or name
      var serviceName = null;
      for (var name in SERVICES) {
        if (SERVICES[name].id === serviceParam || name.toLowerCase().replace(/\s+/g, "-") === serviceParam) {
          serviceName = name;
          break;
        }
      }
      if (serviceName) {
        // Delay to ensure page is loaded
        setTimeout(function () {
          openModal(serviceName);
        }, 500);
      }
    }
  }

  // --- Open Modal ---
  function openModal(serviceName) {
    if (!modal || !SERVICES[serviceName]) return;

    currentService = serviceName;
    var service = SERVICES[serviceName];

    // Set service info
    var titleEl = modal.querySelector("#enquiry-service-title");
    var descEl = modal.querySelector("#enquiry-service-desc");
    if (titleEl) titleEl.textContent = service.title;
    if (descEl) descEl.textContent = service.description;

    // Set service field in hidden input
    var serviceInput = form.querySelector('input[name="service"]');
    if (serviceInput) serviceInput.value = serviceName;

    // Build dynamic fields
    buildDynamicFields(service.fields);

    // Show form state
    showFormState();

    // Show modal
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    isOpen = true;

    // Focus first input
    setTimeout(function () {
      var firstInput = form.querySelector("input:not([type=hidden]), select, textarea");
      if (firstInput) firstInput.focus();
    }, 300);
  }

  // --- Close Modal ---
  function closeModal() {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    isOpen = false;
    currentService = null;

    // Update URL
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }

  // --- Build Dynamic Fields ---
  function buildDynamicFields(fields) {
    var container = form.querySelector("#enquiry-dynamic-fields");
    if (!container) return;
    container.innerHTML = "";

    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      var group = document.createElement("div");
      group.className = "form-group";

      var label = document.createElement("label");
      label.setAttribute("for", "field-" + field.name);
      label.textContent = field.label;
      if (field.required) {
        var req = document.createElement("span");
        req.className = "required-marker";
        req.textContent = " *";
        req.setAttribute("aria-hidden", "true");
        label.appendChild(req);
      }
      group.appendChild(label);

      var input;
      if (field.type === "select") {
        input = document.createElement("select");
        input.id = "field-" + field.name;
        input.name = field.name;
        if (field.required) input.required = true;
        for (var j = 0; j < field.options.length; j++) {
          var opt = document.createElement("option");
          opt.value = field.options[j];
          opt.textContent = field.options[j] || "Select...";
          input.appendChild(opt);
        }
      } else if (field.type === "textarea") {
        input = document.createElement("textarea");
        input.id = "field-" + field.name;
        input.name = field.name;
        input.rows = 3;
        if (field.placeholder) input.placeholder = field.placeholder;
        if (field.required) input.required = true;
      } else {
        input = document.createElement("input");
        input.type = field.type;
        input.id = "field-" + field.name;
        input.name = field.name;
        if (field.placeholder) input.placeholder = field.placeholder;
        if (field.required) input.required = true;
        if (field.min !== undefined) input.min = field.min;
        if (field.max !== undefined) input.max = field.max;
      }

      group.appendChild(input);

      // Error message container
      var errorEl = document.createElement("div");
      errorEl.className = "field-error";
      errorEl.setAttribute("role", "alert");
      errorEl.setAttribute("aria-live", "polite");
      group.appendChild(errorEl);

      container.appendChild(group);
    }
  }

  // --- Validation ---
  function validateForm() {
    var valid = true;
    var errors = [];

    // Clear previous errors
    var errorEls = form.querySelectorAll(".field-error");
    for (var i = 0; i < errorEls.length; i++) {
      errorEls[i].textContent = "";
    }
    var invalidInputs = form.querySelectorAll(".invalid");
    for (var j = 0; j < invalidInputs.length; j++) {
      invalidInputs[j].classList.remove("invalid");
    }

    // Validate name
    var nameInput = form.querySelector('input[name="fullName"]');
    if (nameInput && !nameInput.value.trim()) {
      showFieldError(nameInput, "Full name is required.");
      valid = false;
    }

    // Validate phone
    var phoneInput = form.querySelector('input[name="phone"]');
    if (phoneInput && !phoneInput.value.trim()) {
      showFieldError(phoneInput, "Phone number is required.");
      valid = false;
    } else if (phoneInput && phoneInput.value.trim()) {
      var phone = phoneInput.value.replace(/[\s\-\(\)]/g, "");
      if (phone.length < 7 || !/^\+?[\d]+$/.test(phone)) {
        showFieldError(phoneInput, "Please enter a valid phone number.");
        valid = false;
      }
    }

    // Validate email if provided
    var emailInput = form.querySelector('input[name="email"]');
    if (emailInput && emailInput.value.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())) {
        showFieldError(emailInput, "Please enter a valid email address.");
        valid = false;
      }
    }

    // Validate service
    var serviceInput = form.querySelector('input[name="service"]');
    if (serviceInput && !serviceInput.value) {
      valid = false;
    }

    // Validate dynamic required fields
    var requiredFields = form.querySelectorAll("#enquiry-dynamic-fields [required]");
    for (var k = 0; k < requiredFields.length; k++) {
      var field = requiredFields[k];
      if (!field.value || (field.tagName === "SELECT" && !field.value)) {
        showFieldError(field, "This field is required.");
        valid = false;
      }
    }

    // Validate dates
    var dateInputs = form.querySelectorAll('input[type="date"]');
    for (var d = 0; d < dateInputs.length; d++) {
      var dateField = dateInputs[d];
      var endDateNames = ["returnDate", "checkoutDate"];
      if (endDateNames.indexOf(dateField.name) !== -1) {
        var startDateNames = ["travelDate", "hireDate", "checkinDate", "deliveryDate"];
        for (var s = 0; s < startDateNames.length; s++) {
          var travelDate = form.querySelector('input[name="' + startDateNames[s] + '"]');
          if (travelDate && travelDate.value && dateField.value && dateField.value < travelDate.value) {
            showFieldError(dateField, "This date must be after the start date.");
            valid = false;
            break;
          }
        }
      }
    }

    return valid;
  }

  function showFieldError(input, message) {
    input.classList.add("invalid");
    var group = input.closest(".form-group");
    if (group) {
      var errorEl = group.querySelector(".field-error");
      if (errorEl) errorEl.textContent = message;
    }
  }

  // --- Form Submission ---
  function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
    }

    var data = collectFormData();
    var message = generateWhatsAppMessage(data);
    var waUrl = WHATSAPP_NUMBER
      ? "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message)
      : null;

    var apiUrl = (API_BASE_URL || "") + "/api/enquiries";

    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        return res.json().then(function (body) {
          return { status: res.status, body: body };
        });
      })
      .then(function (result) {
        if (result.status === 201 && result.body.success) {
          showSuccessState(data.fullName, false);
          if (waUrl) {
            setTimeout(function () { window.open(waUrl, "_blank", "noopener"); }, 600);
          }
        } else {
          showSuccessState(data.fullName, true);
          if (waUrl) {
            setTimeout(function () { window.open(waUrl, "_blank", "noopener"); }, 600);
          }
        }
      })
      .catch(function () {
        showSuccessState(data.fullName, true);
        if (waUrl) {
          setTimeout(function () { window.open(waUrl, "_blank", "noopener"); }, 600);
        }
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Send Enquiry";
        }
      });
  }

  // --- Collect Form Data ---
  function collectFormData() {
    var data = {
      fullName: "",
      phone: "",
      email: "",
      district: "",
      service: "",
      destination: "",
      preferredDate: "",
      notes: "",
      details: {}
    };

    var inputs = form.querySelectorAll("input, select, textarea");
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      var name = input.name;
      var value = input.value ? input.value.trim() : "";

      if (name === "fullName") data.fullName = value;
      else if (name === "phone") data.phone = value;
      else if (name === "email") data.email = value;
      else if (name === "district") data.district = value;
      else if (name === "service") data.service = value;
      else if (name === "destination") data.destination = value;
      else if (name === "travelDate" || name === "hireDate" || name === "checkinDate" || name === "deliveryDate") {
        data.preferredDate = value;
      }
      else if (name === "consultationNotes" || name === "packageDetails") {
        data.notes = value;
      }
      else if (value && !["returnDate", "checkoutDate"].includes(name)) {
        // Capture service-specific fields into details
        data.details[name] = value;
        var labelEl = input.closest(".form-group");
        var labelText = labelEl ? (labelEl.querySelector("label") || {}).textContent : "";
        labelText = labelText ? labelText.replace(" *", "") : name;
        if (data.notes) data.notes += "\n" + labelText + ": " + value;
        else data.notes = labelText + ": " + value;
      }
    }

    return data;
  }

  // --- Generate WhatsApp Message ---
  function generateWhatsAppMessage(data) {
    var lines = [];
    lines.push("Hello Lil Tours & Travel,");
    lines.push("");
    lines.push("I would like assistance with:");
    lines.push("");
    lines.push("Service: " + (data.service || "General enquiry"));
    lines.push("Name: " + data.fullName);
    lines.push("Phone: " + data.phone);

    if (data.email) lines.push("Email: " + data.email);
    if (data.destination) lines.push("Destination: " + data.destination);
    if (data.preferredDate) lines.push("Preferred Date: " + data.preferredDate);

    // Add service-specific details
    var serviceFields = form.querySelectorAll("#enquiry-dynamic-fields input, #enquiry-dynamic-fields select, #enquiry-dynamic-fields textarea");
    for (var i = 0; i < serviceFields.length; i++) {
      var field = serviceFields[i];
      if (field.name && field.value && !["destination", "travelDate", "hireDate", "checkinDate", "deliveryDate"].includes(field.name)) {
        var fieldGroup = field.closest(".form-group");
        var fieldLabel = fieldGroup ? (fieldGroup.querySelector("label") || {}).textContent : "";
        fieldLabel = fieldLabel ? fieldLabel.replace(" *", "") : field.name;
        lines.push(fieldLabel + ": " + field.value);
      }
    }

    if (data.notes) {
      lines.push("");
      lines.push("Additional information:");
      lines.push(data.notes);
    }

    lines.push("");
    lines.push("Thank you.");

    return lines.join("\n");
  }

  // --- UI States ---
  function showFormState() {
    var formState = modal.querySelector(".enquiry-form-state");
    var successState = modal.querySelector(".enquiry-success-state");
    if (formState) formState.style.display = "";
    if (successState) successState.style.display = "none";

    // Clear errors
    var errors = form.querySelectorAll(".field-error");
    for (var i = 0; i < errors.length; i++) errors[i].textContent = "";
    var invalids = form.querySelectorAll(".invalid");
    for (var j = 0; j < invalids.length; j++) invalids[j].classList.remove("invalid");

    form.reset();
    if (currentService) {
      var serviceInput = form.querySelector('input[name="service"]');
      if (serviceInput) serviceInput.value = currentService;
    }
  }

  function showSuccessState(name, failed) {
    var formState = modal.querySelector(".enquiry-form-state");
    var successState = modal.querySelector(".enquiry-success-state");
    var failureState = modal.querySelector(".enquiry-failure-state");
    var nameEl = modal.querySelector("#success-user-name");
    var failNameEl = modal.querySelector("#fail-user-name");

    if (formState) formState.style.display = "none";
    if (failed) {
      if (successState) successState.style.display = "none";
      if (failureState) failureState.style.display = "";
      if (failNameEl) failNameEl.textContent = name || "there";
    } else {
      if (successState) successState.style.display = "";
      if (failureState) failureState.style.display = "none";
      if (nameEl) nameEl.textContent = name || "there";
    }
  }

  // --- Expose API ---
  window.LilEnquiry = {
    open: openModal,
    close: closeModal,
    SERVICES: SERVICES
  };

  // --- Initialize ---
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
