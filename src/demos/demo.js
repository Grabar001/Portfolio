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

  /* ================= round 2: header, lightbox, slider hint, cart, wizards ================= */

  /* ---------- header shadow + compact height on scroll ---------- */
  function initHeader() {
    var header = document.querySelector("header.top");
    if (!header) return;
    var fab = document.querySelector(".fab");
    var sync = function () {
      header.classList.toggle("scrolled", window.scrollY > 40);
      // the floating call button appears once the first screen is behind
      if (fab) fab.classList.toggle("on", window.scrollY > window.innerHeight * 0.6);
    };
    window.addEventListener("scroll", sync, { passive: true });
    sync();
  }

  /* ---------- lightbox for photo galleries ---------- */
  function initLightbox() {
    var imgs = Array.prototype.slice.call(document.querySelectorAll("figure.ph img, .works img, .photo-row img, .swatch.photo-swatch img"));
    if (!imgs.length || typeof HTMLDialogElement === "undefined") return;
    var dlg = document.createElement("dialog");
    dlg.className = "lb";
    dlg.setAttribute("aria-label", "Photo agrandie");
    dlg.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure><span class="lb-count"></span>' +
      '<button type="button" class="lb-btn lb-close" aria-label="Fermer">×</button>' +
      '<button type="button" class="lb-btn lb-prev" aria-label="Photo précédente">‹</button>' +
      '<button type="button" class="lb-btn lb-next" aria-label="Photo suivante">›</button>';
    document.body.appendChild(dlg);
    var big = dlg.querySelector("img"), cap = dlg.querySelector("figcaption"), count = dlg.querySelector(".lb-count");
    var group = [], pos = 0;

    var caption = function (img) {
      var fig = img.closest("figure");
      var c = fig && fig.querySelector("figcaption");
      return c ? c.textContent.trim() : img.alt;
    };
    var show = function (i) {
      pos = (i + group.length) % group.length;
      var img = group[pos];
      big.src = img.currentSrc || img.src;
      big.alt = img.alt;
      cap.textContent = caption(img);
      count.textContent = (pos + 1) + " / " + group.length;
      // restart the zoom-in animation
      big.style.animation = "none"; void big.offsetWidth; big.style.animation = "";
    };
    imgs.forEach(function (img) {
      img.classList.add("zoomable");
      img.tabIndex = 0;
      img.setAttribute("role", "button");
      var open = function () {
        var section = img.closest("section") || document;
        group = imgs.filter(function (x) { return section.contains(x); });
        show(group.indexOf(img));
        dlg.showModal();
      };
      img.addEventListener("click", open);
      img.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });
    dlg.querySelector(".lb-close").addEventListener("click", function () { dlg.close(); });
    dlg.querySelector(".lb-prev").addEventListener("click", function () { show(pos - 1); });
    dlg.querySelector(".lb-next").addEventListener("click", function () { show(pos + 1); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg || e.target.tagName === "FIGURE") dlg.close(); });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(pos - 1);
      if (e.key === "ArrowRight") show(pos + 1);
    });
    var startX = null;
    dlg.addEventListener("pointerdown", function (e) { startX = e.clientX; });
    dlg.addEventListener("pointerup", function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX; startX = null;
      if (Math.abs(dx) > 50) show(pos + (dx < 0 ? 1 : -1));
    });
  }

  /* ---------- before/after: show the gesture once when the slider appears ---------- */
  function initSliderHint() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    var sliders = document.querySelectorAll(".ba-slider");
    if (!sliders.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var fig = e.target, input = fig.querySelector("input"), touched = false;
        input.addEventListener("pointerdown", function () { touched = true; }, { once: true });
        var keys = [[0, 50], [500, 28], [1100, 72], [1600, 50]], t0 = null;
        var frame = function (t) {
          if (touched) return;
          if (t0 === null) t0 = t;
          var el = t - t0, v = 50;
          for (var k = 1; k < keys.length; k++) {
            if (el <= keys[k][0]) {
              var a = keys[k - 1], b = keys[k], p = (el - a[0]) / (b[0] - a[0]);
              p = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // ease in-out
              v = a[1] + (b[1] - a[1]) * p;
              break;
            }
          }
          input.value = v; fig.style.setProperty("--pos", v + "%");
          if (el < keys[keys.length - 1][0]) requestAnimationFrame(frame);
        };
        setTimeout(function () { requestAnimationFrame(frame); }, 300 + Array.prototype.indexOf.call(sliders, fig) * 250);
      });
    }, { threshold: 0.6 });
    sliders.forEach(function (s) { io.observe(s); });
  }

  /* ---------- Café: click & collect basket ---------- */
  function parsePrice(text) { return parseFloat(text.replace(/[^\d,]/g, "").replace(",", ".")) || 0; }
  function euro(n) { return n.toFixed(2).replace(".", ",") + " €"; }

  function initCart() {
    var items = document.querySelectorAll(".menu-card .item");
    if (!items.length || typeof HTMLDialogElement === "undefined") return;
    var cart = {}; // name -> {price, qty}
    var fab = document.createElement("button");
    fab.type = "button"; fab.className = "cart-fab";
    fab.innerHTML = '🛍 Panier <b>0</b>';
    document.body.appendChild(fab);
    var dlg = document.createElement("dialog");
    dlg.className = "cart"; dlg.setAttribute("aria-label", "Panier");
    dlg.innerHTML = '<div class="cart-in"><div class="cart-head"><h2>Votre commande</h2><button type="button" class="cart-x" aria-label="Fermer">×</button></div>' +
      '<div class="cart-list"></div><div class="cart-foot"><div class="cart-total"><span>Total</span><span data-total>0,00 €</span></div>' +
      '<label>Retrait au comptoir<select><option>Dès que possible (10 min)</option><option>Dans 30 minutes</option><option>À 12:30</option><option>À 13:00</option></select></label>' +
      '<button type="button" class="btn" disabled>Payer et commander (désactivé sur la démo)</button>' +
      '<p class="note">Démo : sur un vrai site, paiement par carte via Stripe et ticket envoyé par SMS.</p></div></div>';
    document.body.appendChild(dlg);
    var list = dlg.querySelector(".cart-list"), totalEl = dlg.querySelector("[data-total]");

    var render = function () {
      var names = Object.keys(cart), count = 0, total = 0;
      list.innerHTML = "";
      names.forEach(function (n) {
        var it = cart[n]; count += it.qty; total += it.qty * it.price;
        var line = document.createElement("div");
        line.className = "cart-line";
        line.innerHTML = '<span></span><span class="qty"><button type="button" aria-label="Retirer un">−</button><b></b><button type="button" aria-label="Ajouter un">+</button></span><strong></strong>';
        line.children[0].textContent = n;
        line.querySelector("b").textContent = it.qty;
        line.children[2].textContent = euro(it.qty * it.price);
        var btns = line.querySelectorAll("button");
        btns[0].addEventListener("click", function () { it.qty--; if (!it.qty) delete cart[n]; render(); });
        btns[1].addEventListener("click", function () { it.qty++; render(); });
        list.appendChild(line);
      });
      if (!names.length) list.innerHTML = '<p class="cart-empty">Votre panier est vide.</p>';
      totalEl.textContent = euro(total);
      fab.querySelector("b").textContent = count;
      fab.classList.toggle("show", count > 0);
      fab.setAttribute("aria-label", "Ouvrir le panier : " + count + " article" + (count > 1 ? "s" : "") + ", " + euro(total));
    };

    var fly = function (from) {
      if (reduceMotion) return;
      var a = from.getBoundingClientRect(), dot = document.createElement("span");
      dot.className = "fly";
      dot.style.left = a.left + a.width / 2 + "px"; dot.style.top = a.top + a.height / 2 + "px";
      document.body.appendChild(dot);
      var tx = window.innerWidth - 80 - (a.left + a.width / 2), ty = window.innerHeight - 40 - (a.top + a.height / 2);
      requestAnimationFrame(function () {
        dot.style.transform = "translate(" + tx + "px," + ty + "px) scale(.4)";
        dot.style.opacity = ".2";
      });
      setTimeout(function () { dot.remove(); }, 750);
    };

    items.forEach(function (item) {
      var name = item.querySelector("span").textContent.trim();
      var price = parsePrice(item.querySelector("b").textContent);
      var add = document.createElement("button");
      add.type = "button"; add.className = "add"; add.textContent = "+";
      add.setAttribute("aria-label", "Ajouter " + name + " au panier");
      add.addEventListener("click", function () {
        cart[name] = cart[name] || { price: price, qty: 0 };
        cart[name].qty++;
        fly(add);
        add.classList.add("ok"); add.textContent = "✓";
        setTimeout(function () { add.classList.remove("ok"); add.textContent = "+"; }, 900);
        setTimeout(function () {
          render();
          fab.classList.remove("bump"); void fab.offsetWidth; fab.classList.add("bump");
        }, reduceMotion ? 0 : 600);
      });
      item.appendChild(add);
    });
    fab.addEventListener("click", function () { dlg.showModal(); });
    dlg.querySelector(".cart-x").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    render();
  }

  /* ---------- step-by-step forms (salon booking, plumber diagnosis) ---------- */
  var MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  var WEEKDAYS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

  function radioValue(form, name) {
    var r = form.querySelector('input[name="' + name + '"]:checked');
    return r || null;
  }

  function initSalonDays(form, state) {
    var days = form.querySelector(".days"), slots = Array.prototype.slice.call(form.querySelectorAll(".slots button"));
    var msg = form.querySelector(".slot-msg");
    if (!days) return;
    var pickDay = function (btn) {
      days.querySelectorAll("button").forEach(function (b) { b.classList.toggle("on", b === btn); b.setAttribute("aria-pressed", b === btn); });
      state.day = btn.dataset.label;
      var seed = parseInt(btn.dataset.seed, 10);
      slots.forEach(function (s, i) {
        s.disabled = (seed + i * 5) % 7 < 2; // a few slots look booked, different each day
        if (s.disabled && s.classList.contains("on")) { s.classList.remove("on"); state.slot = null; }
      });
      if (msg) msg.textContent = "";
    };
    var d = new Date();
    for (var n = 0, made = 0; made < 12 && n < 20; n++) {
      var day = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
      var closed = day.getDay() === 0 || day.getDay() === 1; // closed on Sunday and Monday
      var b = document.createElement("button");
      b.type = "button";
      b.innerHTML = "<small>" + WEEKDAYS[day.getDay()] + "</small><b>" + day.getDate() + "</b><small>" + MONTHS[day.getMonth()] + "</small>";
      b.dataset.label = WEEKDAYS[day.getDay()] + " " + day.getDate() + " " + MONTHS[day.getMonth()];
      b.dataset.seed = day.getDate() * 7 + day.getMonth() * 3;
      b.setAttribute("aria-pressed", "false");
      if (closed) { b.disabled = true; b.title = "Salon fermé"; }
      days.appendChild(b);
      made++;
    }
    days.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (b && !b.disabled) pickDay(b);
    });
    var first = days.querySelector("button:not(:disabled)");
    if (first) pickDay(first);
    form.querySelector(".slots").addEventListener("click", function (e) {
      var s = e.target.closest("button");
      if (!s || s.disabled) return;
      slots.forEach(function (x) { x.classList.toggle("on", x === s); x.setAttribute("aria-pressed", x === s); });
      state.slot = s.textContent;
      if (msg) msg.textContent = "Créneau choisi : " + state.day + " à " + state.slot;
    });
  }

  function salonSummary(form, state) {
    var svc = radioValue(form, "svc"), staff = radioValue(form, "staff");
    var box = form.querySelector("[data-sum]");
    box.innerHTML = "";
    [["Prestation", svc.value + " · " + svc.dataset.dur + " · " + svc.dataset.price],
     ["Coiffeuse", staff.value], ["Rendez-vous", state.day + " à " + state.slot],
     ["Adresse", "14 rue de l'Exemple, Paris 9e"]].forEach(function (r) {
      var line = document.createElement("div");
      line.innerHTML = "<strong></strong> : <span></span>";
      line.children[0].textContent = r[0]; line.children[1].textContent = r[1];
      box.appendChild(line);
    });
  }

  function diagResult(form) {
    var pb = radioValue(form, "pb"), urg = radioValue(form, "urg"), place = radioValue(form, "place");
    var box = form.querySelector("[data-result]");
    var range = pb.dataset.range, extra = place.dataset.extra, price;
    if (range.indexOf("-") === -1 || extra === "x") {
      price = "Sur devis";
    } else {
      var r = range.split("-").map(Number), f = parseFloat(urg.dataset.factor), x = parseFloat(extra);
      price = Math.round((r[0] * f + x) / 5) * 5 + " – " + Math.round((r[1] * f + x) / 5) * 5 + " €";
    }
    box.innerHTML = '<div><div class="price-big"></div><small>estimation, pièces standard comprises · confirmée par un devis écrit</small></div>' +
      '<div><strong>Intervention :</strong> <span data-delay></span></div><div class="advice">💡 <span></span></div>';
    box.querySelector(".price-big").textContent = price;
    box.querySelector("[data-delay]").textContent = place.value === "loin" ? "selon disponibilité" : urg.dataset.delay;
    box.querySelector(".advice span").textContent = "En attendant : " + pb.dataset.advice;
  }

  function initWizards() {
    document.querySelectorAll("form[data-wiz]").forEach(function (form) {
      var kind = form.dataset.wiz;
      var steps = Array.prototype.slice.call(form.querySelectorAll(".wiz-step"));
      var labels = form.querySelectorAll(".wiz-labels li");
      var bar = form.querySelector(".wiz-bar span");
      var prev = form.querySelector("[data-wiz=prev]"), next = form.querySelector("[data-wiz=next]");
      var err = form.querySelector(".wiz-err"), done = form.querySelector(".wiz-done");
      var state = { day: null, slot: null }, cur = 0;
      if (kind === "salon") initSalonDays(form, state);

      var go = function (i) {
        cur = i;
        steps.forEach(function (s, k) { s.classList.toggle("on", k === i); });
        labels.forEach(function (l, k) { l.classList.toggle("on", k === i); });
        if (bar) bar.style.width = ((i + 1) / steps.length * 100) + "%";
        prev.disabled = i === 0;
        next.textContent = i === steps.length - 1 ? next.dataset.final : "Continuer";
        err.textContent = "";
        if (i === steps.length - 1) {
          if (kind === "salon") salonSummary(form, state);
          if (kind === "diag") diagResult(form);
        }
      };
      var valid = function () {
        var need = steps[cur].dataset.need;
        if (!need) return true;
        if (need === "slot") {
          if (!state.slot) { err.textContent = "Choisissez un créneau horaire."; return false; }
          return true;
        }
        if (!radioValue(form, need)) { err.textContent = "Choisissez une option pour continuer."; return false; }
        return true;
      };
      // picking a tile moves on automatically (except when the user goes back to change it)
      form.addEventListener("change", function (e) {
        if (e.target.type === "radio" && steps[cur].contains(e.target) && cur < steps.length - 1) {
          err.textContent = "";
          setTimeout(function () { if (valid()) go(cur + 1); }, 280);
        }
      });
      prev.addEventListener("click", function () { if (cur > 0) go(cur - 1); });
      next.addEventListener("click", function () {
        if (!valid()) return;
        if (cur < steps.length - 1) { go(cur + 1); return; }
        // last step: show the confirmation screen (nothing is sent on the demo)
        Array.prototype.forEach.call(form.children, function (c) { if (c !== done) c.hidden = true; });
        done.hidden = false;
      });
      form.querySelector("[data-wiz=restart]").addEventListener("click", function () {
        Array.prototype.forEach.call(form.children, function (c) { c.hidden = false; });
        done.hidden = true;
        form.querySelectorAll("input[type=radio]").forEach(function (r) { r.checked = r.defaultChecked; });
        form.querySelectorAll(".slots button.on").forEach(function (b) { b.classList.remove("on"); });
        state.slot = null;
        go(0);
      });
      go(0);
    });
  }

  initReveal();
  initBeforeAfter();
  initCarousels();
  initOpenStatus();
  initMenuFilter();
  initHeader();
  initLightbox();
  initSliderHint();
  initCart();
  initWizards();
  initCalc();
  initZoneMap();
})();
