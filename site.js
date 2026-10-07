/* ===========================================================
   Shared behaviour for every page under /the-wedding/
     · injects the glass FAB + right-side drawer menu
     · injects the Call / WhatsApp chooser used by .tel buttons
     · drives the FAQ-style accordions
   Menu items live here so all pages stay in step.
   =========================================================== */
(function () {
  "use strict";

  var MENU = [
    ["events.html",   "Events"],
    ["travel.html",   "Travel &amp; Stay"],
    ["wardrobe.html", "Wardrobe Guide"],
    ["faq.html",      "FAQ"],
    ["photos.html",   "Photos &amp; Videos"],
    ["contact.html",  "RSVP &amp; Contact"],
    ["guestbook.html","Guest Book"],
    ["artwork.html",  "The Artwork"]
  ];

  var here = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  /* ---------------- Cloudflare Web Analytics ----------------
     Every page under /the-wedding/ loads this file, so injecting the beacon
     here covers all of them at once. save-the-date.html is the separate public
     landing page and carries the same snippet inline.

     Cookieless and privacy-first, so it needs no consent banner. Paste the
     token from Cloudflare → Web Analytics → your site; while it is blank
     nothing is injected, so the page stays clean rather than half-wired. */
  var CF_BEACON_TOKEN = "54a4a3ceeaad49988fc08e6e9201ca8f";

  function loadAnalytics() {
    if (!CF_BEACON_TOKEN) return;
    var s = document.createElement("script");
    s.type = "module";
    s.src = "https://static.cloudflareinsights.com/beacon.min.js";
    s.setAttribute("data-cf-beacon", JSON.stringify({ token: CF_BEACON_TOKEN }));
    document.head.appendChild(s);
  }

  /* -------- Bottom-left home button (every page but the invitation) -------- */
  function buildHomeButton() {
    if (here === "index.html") return;
    var a = document.createElement("a");
    a.className = "home-fab";
    a.href = "index.html";
    a.setAttribute("aria-label", "Back to the invitation");
    a.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9.5V20h13V9.5" />' +
      '<path d="M9.75 20v-5.5h4.5V20" /></svg>';
    document.body.appendChild(a);
  }

  /* ---------------- FAB + drawer ---------------- */
  function buildMenu() {
    var fab = document.createElement("button");
    fab.className = "fab";
    fab.type = "button";
    fab.setAttribute("aria-label", "Open menu");
    fab.setAttribute("aria-expanded", "false");
    fab.innerHTML =
      '<span class="fab-dot"></span>' +
      '<span class="fab-icon"><span></span><span></span><span></span></span>';

    var overlay = document.createElement("div");
    overlay.className = "drawer-overlay";

    var drawer = document.createElement("nav");
    drawer.className = "drawer";
    drawer.setAttribute("aria-label", "Menu");

    var items = MENU.map(function (m) {
      var current = m[0].toLowerCase() === here ? ' aria-current="page"' : "";
      return '<li><a class="drawer-link" href="' + m[0] + '"' + current + '>' +
             '<span class="drawer-link-label">' + m[1] + "</span></a></li>";
    }).join("");

    drawer.innerHTML =
      '<ul class="drawer-nav">' + items + "</ul>" +
      (here === "index.html"
        ? ""
        : '<a class="drawer-home" href="index.html">&larr; Back to the invitation</a>') +
      '<div class="drawer-footer">' +
      '<img class="drawer-footer-logo" src="assets/images/sn_oval.webp" alt="" />' +
      "</div>";

    document.body.appendChild(fab);
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    var isOpen = false;
    function toggle(force) {
      isOpen = typeof force === "boolean" ? force : !isOpen;
      fab.classList.toggle("is-open", isOpen);
      drawer.classList.toggle("is-open", isOpen);
      overlay.classList.toggle("is-open", isOpen);
      fab.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
      fab.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.body.style.overflow = isOpen ? "hidden" : "";
    }

    fab.addEventListener("click", function () { toggle(); });
    overlay.addEventListener("click", function () { toggle(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen) toggle(false);
    });
  }

  /* ------------- Call / WhatsApp chooser -------------
     Any <button class="tel" data-name data-phone [data-wa="0"]>
     opens the sheet. data-phone is digits only, with country code. */
  function buildDialSheet() {
    if (!document.querySelector(".tel")) return;

    var sheet = document.createElement("div");
    sheet.className = "dial-sheet";
    sheet.hidden = true;
    sheet.innerHTML =
      '<div class="dial-card" role="dialog" aria-modal="true" aria-label="Contact options">' +
      '<p class="dial-name"></p>' +
      '<p class="dial-number"></p>' +
      '<div class="dial-actions">' +
      '<a class="dial-btn dial-call" href="#">Call</a>' +
      '<a class="dial-btn dial-btn--wa dial-wa" href="#" target="_blank" rel="noopener">WhatsApp</a>' +
      '<a class="dial-btn dial-btn--mail dial-mail" href="#">Email</a>' +
      "</div>" +
      '<button type="button" class="dial-close">Cancel</button>' +
      "</div>";
    document.body.appendChild(sheet);

    var nameEl = sheet.querySelector(".dial-name"),
        numEl = sheet.querySelector(".dial-number"),
        callLink = sheet.querySelector(".dial-call"),
        waLink = sheet.querySelector(".dial-wa"),
        mailLink = sheet.querySelector(".dial-mail");

    function close() { sheet.hidden = true; }

    document.querySelectorAll(".tel").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var phone = btn.dataset.phone;
        var email = btn.dataset.email;
        nameEl.textContent = btn.dataset.name || "";
        // data-display lets a button labelled something else ("Contact")
        // still show the number in the sheet
        numEl.textContent = btn.dataset.display || btn.textContent.trim();
        callLink.href = "tel:+" + phone;
        callLink.hidden = !phone;
        waLink.href = "https://wa.me/" + phone;
        waLink.hidden = !phone || btn.dataset.wa === "0";
        mailLink.href = "mailto:" + email;
        mailLink.hidden = !email;
        sheet.hidden = false;
      });
    });

    sheet.addEventListener("click", function (e) {
      if (e.target === sheet ||
          e.target.classList.contains("dial-btn") ||
          e.target.classList.contains("dial-close")) {
        close();
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !sheet.hidden) close();
    });
  }

  /* ---------------- Accordion ----------------
     <div class="acc-item"><button class="acc-q">…</button>
       <div class="acc-a"><div class="acc-a-inner">…</div></div></div>
     Height is measured from the inner wrapper so long answers
     open to their true size and stay scroll-friendly. */
  function buildAccordions() {
    var items = document.querySelectorAll(".acc-item");
    if (!items.length) return;

    items.forEach(function (item) {
      var btn = item.querySelector(".acc-q");
      var panel = item.querySelector(".acc-a");
      var inner = item.querySelector(".acc-a-inner");
      if (!btn || !panel || !inner) return;

      btn.setAttribute("aria-expanded", "false");

      panel.addEventListener("transitionend", function (e) {
        if (e.propertyName === "height" && item.classList.contains("is-open")) {
          panel.style.height = "auto";
        }
      });

      btn.addEventListener("click", function () {
        var open = !item.classList.contains("is-open");
        // pin the current height so both ends of the transition are explicit
        panel.style.height = panel.offsetHeight + "px";
        void panel.offsetHeight;
        item.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        panel.style.height = open ? inner.offsetHeight + "px" : "0px";
      });
    });

    window.addEventListener("resize", function () {
      document.querySelectorAll(".acc-item.is-open .acc-a").forEach(function (p) {
        p.style.height = "auto";
      });
    });
  }

  function init() {
    loadAnalytics();
    buildHomeButton();
    buildMenu();
    buildDialSheet();
    buildAccordions();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
