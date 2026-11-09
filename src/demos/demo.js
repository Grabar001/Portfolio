/* Interactive parts of the demo sites (Lumen Plomberie, Café Brindille, Studio Éclat).
   Every feature checks that its markup exists, so one file serves all three demos.
   Without JavaScript the pages still work: content stays visible, forms stay readable. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- reveal on scroll ---------- */
  function initReveal() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    var selector = "main > section, main > div, .card, .menu-card, .svc, .rev, .member, figure.ph, .value, .works figure, .ba-slider, .step";
    var items = Array.prototype.slice.call(document.querySelectorAll(selector));
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) {
      // elements already on screen at load stay visible (no flash)
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
      // cards inside a horizontal carousel may never cross the viewport vertically
      if (el.parentElement && el.parentElement.closest(".car-track")) return;
      var siblings = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.transitionDelay = Math.min(siblings, 4) * 70 + "ms";
      el.classList.add("rv");
      io.observe(el);
    });
  }

  /* ---------- before / after sliders ---------- */
  function initBeforeAfter() {
    document.querySelectorAll(".ba-slider input[type=range]").forEach(function (input) {
      var fig = input.closest(".ba-slider");
      var update = function () { fig.style.setProperty("--pos", input.value + "%"); };
      input.addEventListener("input", update);
      update();
    });
  }

  /* ---------- carousels (reviews) ---------- */
  function initCarousels() {
    document.querySelectorAll(".carousel").forEach(function (car) {
      var track = car.querySelector(".car-track");
      var prev = car.querySelector("[data-car=prev]");
      var next = car.querySelector("[data-car=next]");
      if (!track || !prev || !next) return;
      var step = function () {
        var first = track.children[0];
        return first ? first.getBoundingClientRect().width + 18 : track.clientWidth;
      };
      var sync = function () {
        prev.disabled = track.scrollLeft < 5;
        next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 5;
      };
      prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
      next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });
      track.addEventListener("scroll", sync, { passive: true });
      window.addEventListener("resize", sync);
      sync();
    });
  }

  /* ---------- Café: "open now", in Paris time ---------- */
  // 0 = Sunday … 6 = Saturday; [opening hour, closing hour] or null when closed
  var CAFE_HOURS = [[9, 19], null, [8, 18], [8, 18], [8, 18], [8, 18], [9, 19]];
  var DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

  function parisNow() {
    var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    var get = function (t) { return parts.filter(function (p) { return p.type === t; })[0].value; };
    var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    return { day: day, hour: parseInt(get("hour"), 10) % 24 + parseInt(get("minute"), 10) / 60 };
  }

  function openStatus(hours) {
    var now = parisNow();
    var today = hours[now.day];
    if (today && now.hour >= today[0] && now.hour < today[1]) {
      return { open: true, text: "Ouvert maintenant · jusqu'à " + today[1] + " h" };
    }
    if (today && now.hour < today[0]) return { open: false, text: "Fermé · ouvre aujourd'hui à " + today[0] + " h" };
    for (var i = 1; i <= 7; i++) {
      var d = (now.day + i) % 7;
      if (hours[d]) return { open: false, text: "Fermé · ouvre " + (i === 1 ? "demain" : DAYS[d]) + " à " + hours[d][0] + " h" };
    }
    return { open: false, text: "Fermé" };
  }

  function initOpenStatus() {
    var els = document.querySelectorAll("[data-open-status]");
    if (!els.length) return;
    var render = function () {
      var s = openStatus(CAFE_HOURS);
      els.forEach(function (el) {
        el.textContent = s.text;
        el.classList.toggle("is-open", s.open);
        el.classList.toggle("is-closed", !s.open);
      });
    };
    render();
    setInterval(render, 60000);
  }

  /* ---------- Café: menu filter ---------- */
  function initMenuFilter() {
    var bar = document.querySelector(".menu-filter");
    if (!bar) return;
    var cards = document.querySelectorAll(".menu-card[data-cat]");
    bar.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-f]");
      if (!btn) return;
      bar.querySelectorAll("button").forEach(function (b) {
        b.classList.toggle("on", b === btn);
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      cards.forEach(function (c) {
        c.classList.toggle("hide", btn.dataset.f !== "all" && c.dataset.cat !== btn.dataset.f);
      });
    });
  }

  /* ---------- Salon: time slots that react to the chosen date ---------- */
  var SALON_OPEN_DAYS = [2, 3, 4, 5, 6]; // Tuesday to Saturday

  function initSlots() {
    var box = document.querySelector(".slots");
    if (!box) return;
    var form = box.closest("form");
    var dateInput = form && form.querySelector("input[type=date]");
    var msg = form && form.querySelector(".slot-msg");
    var buttons = Array.prototype.slice.call(box.querySelectorAll("button"));

    var select = function (btn) {
      buttons.forEach(function (b) {
        b.classList.toggle("on", b === btn);
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      if (msg) msg.textContent = btn ? "Créneau choisi : " + btn.textContent + " (démo, rien n'est envoyé)" : "";
    };

    var refresh = function () {
      if (!dateInput || !dateInput.value) {
        buttons.forEach(function (b) { b.disabled = false; });
        return;
      }
      var d = new Date(dateInput.value + "T12:00:00");
      var seed = d.getDate() * 7 + d.getMonth() * 3;
      var closed = SALON_OPEN_DAYS.indexOf(d.getDay()) === -1;
      buttons.forEach(function (b, i) {
        // a few slots look already booked; the pattern changes with the date
        b.disabled = closed || (seed + i * 5) % 7 < 2;
      });
      var current = box.querySelector("button.on");
      if (closed) { select(null); if (msg) msg.textContent = "Le salon est fermé le dimanche et le lundi."; }
      else if (current && current.disabled) select(null);
    };

    box.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (btn && !btn.disabled) select(btn);
    });
    if (dateInput) {
      var today = new Date();
      dateInput.min = today.toISOString().slice(0, 10);
      dateInput.addEventListener("change", refresh);
    }
  }

  /* ---------- Plomberie: price estimate ---------- */
  function formatEuro(n) {
    return Math.round(n / 5) * 5 + " €";
  }

  function initCalc() {
    var form = document.querySelector("form.calc");
    if (!form) return;
    var out = form.querySelector(".calc-out");
    var update = function () {
      var range = form.type.value.split("-").map(Number);
      var factor = parseFloat(form.when.value);
      var extra = form.far.checked ? 15 : 0;
      out.innerHTML = formatEuro(range[0] * factor + extra) + " – " + formatEuro(range[1] * factor + extra) +
        "<small>estimation, pièces standard comprises</small>";
      if (!reduceMotion) {
        out.classList.remove("bump");
        void out.offsetWidth; // restart the animation
        out.classList.add("bump");
        setTimeout(function () { out.classList.remove("bump"); }, 250);
      }
    };
    form.addEventListener("change", update);
  }

  /* ---------- Plomberie: zone chips highlight the map ---------- */
  function initZoneMap() {
    var chips = document.querySelectorAll(".chips span[data-z]");
    if (!chips.length) return;
    var toggle = function (id, on) {
      document.querySelectorAll('[data-z="' + id + '"]').forEach(function (el) { el.classList.toggle("hl", on); });
    };
    document.querySelectorAll("[data-z]").forEach(function (el) {
      el.addEventListener("mouseenter", function () { toggle(el.dataset.z, true); });
      el.addEventListener("mouseleave", function () { toggle(el.dataset.z, false); });
    });
    chips.forEach(function (chip) {
      chip.tabIndex = 0;
      chip.addEventListener("focus", function () { toggle(chip.dataset.z, true); });
      chip.addEventListener("blur", function () { toggle(chip.dataset.z, false); });
    });
  }

  initReveal();
  initBeforeAfter();
  initCarousels();
  initOpenStatus();
  initMenuFilter();
  initSlots();
  initCalc();
  initZoneMap();
})();
