// albert-grabar.com — theme switch, effects, contact form helpers.
// Every effect is optional: without JavaScript, or with "reduce motion", the page stays complete and static.
document.addEventListener("DOMContentLoaded", function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var each = function (selector, fn) { Array.prototype.forEach.call(document.querySelectorAll(selector), fn); };

  // ---------- Black / White theme ----------
  var toggle = document.querySelector(".theme-toggle");

  function currentTheme() {
    return root.classList.contains("theme-dark") ? "dark" : "light";
  }

  function applyTheme(theme) {
    root.classList.remove("theme-dark", "theme-light");
    root.classList.add("theme-" + theme);
    if (toggle) toggle.setAttribute("aria-pressed", String(theme === "dark"));
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#000000" : "#ffffff");
  }

  applyTheme(currentTheme());

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      var swap = function () {
        applyTheme(next);
        try { window.localStorage.setItem("theme", next); } catch (e) { /* storage blocked */ }
      };
      if (reduceMotion || !document.startViewTransition) {
        swap();
        return;
      }
      // The new theme grows as a circle from the button
      var r = toggle.getBoundingClientRect();
      var x = r.left + r.width / 2;
      var y = r.top + r.height / 2;
      var radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      root.classList.add("theme-switching");
      var transition = document.startViewTransition(swap);
      transition.ready.then(function () {
        root.animate(
          { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + radius + "px at " + x + "px " + y + "px)"] },
          { duration: 700, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" }
        );
      }).catch(function () { /* transition skipped */ });
      transition.finished.then(function () { root.classList.remove("theme-switching"); }, function () { root.classList.remove("theme-switching"); });
    });
  }

  // ---------- Ripple (signature effect of the original portfolio) ----------
  var canvas = document.getElementById("ripple-canvas");
  if (canvas && canvas.getContext && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var ripples = [];
    var animating = false;
    var lastMove = 0;

    var resize = function () {
      var dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    window.addEventListener("resize", resize);
    resize();

    var draw = function () {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ripples = ripples.filter(function (r) { return r.alpha > 0; });
      var rgb = currentTheme() === "dark" ? "255, 255, 255" : "0, 0, 0";
      ctx.lineWidth = 1.5;
      ripples.forEach(function (r) {
        r.radius += 2;
        r.alpha -= 0.018;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(" + rgb + ", " + Math.max(r.alpha, 0) + ")";
        ctx.stroke();
      });
      if (ripples.length) {
        window.requestAnimationFrame(draw);
      } else {
        animating = false;
      }
    };

    var addRipple = function (x, y, strength) {
      ripples.push({ x: x, y: y, radius: 0, alpha: strength });
      if (ripples.length > 60) ripples.shift();
      if (!animating) {
        animating = true;
        window.requestAnimationFrame(draw);
      }
    };

    // Softer than the portfolio: reading pages should stay calm
    document.addEventListener("pointermove", function (e) {
      var now = Date.now();
      if (now - lastMove < 40) return;
      lastMove = now;
      addRipple(e.clientX, e.clientY, 0.22);
    }, { passive: true });
    document.addEventListener("pointerdown", function (e) {
      addRipple(e.clientX, e.clientY, 0.5);
    }, { passive: true });
  }

  // ---------- Scroll: reveal blocks, count numbers, progress bar, header shadow ----------
  var header = document.querySelector(".site-header");
  var progress = document.querySelector(".scroll-progress span");
  var pending = [];

  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (!target) return;
    var start = null;
    var duration = 1300;
    var step = function (time) {
      if (start === null) start = time;
      var t = Math.min((time - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(target * eased));
      if (t < 1) window.requestAnimationFrame(step);
    };
    el.textContent = "0";
    window.requestAnimationFrame(step);
  }

  function show(el, animate) {
    el.classList.add("is-in");
    if (!animate) {
      el.classList.add("no-anim");
      return;
    }
    Array.prototype.forEach.call(el.querySelectorAll("[data-count]"), countUp);
  }

  if (!reduceMotion) {
    each("[data-stagger]", function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.style.setProperty("--i", String(i % 6));
      });
    });
    var limit = window.innerHeight * 0.92;
    each("[data-reveal], [data-stagger] > *", function (el) {
      // Blocks already on screen stay as they are: no flash, no delay
      if (el.getBoundingClientRect().top < limit) {
        show(el, false);
      } else {
        pending.push(el);
      }
    });
    root.classList.add("reveal-on");
    window.addEventListener("beforeprint", function () {
      pending.forEach(function (el) { show(el, false); });
      pending = [];
    });
  }

  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty("--progress", max > 0 ? String(Math.min(y / max, 1)) : "0");
    }
    if (pending.length) {
      var line = window.innerHeight * 0.88;
      pending = pending.filter(function (el) {
        if (el.getBoundingClientRect().top < line) {
          show(el, true);
          return false;
        }
        return true;
      });
    }
  }
  var requestTick = function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  };
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);
  onScroll();

  // ---------- Mouse-only effects: cursor ring, magnetic buttons, card spotlight ----------
  if (finePointer && !reduceMotion) {
    var ring = document.createElement("div");
    ring.className = "cursor-ring";
    ring.setAttribute("aria-hidden", "true");
    document.body.appendChild(ring);
    var pos = { x: -100, y: -100 };
    var target = { x: -100, y: -100 };
    var moving = false;
    var follow = function () {
      pos.x += (target.x - pos.x) * 0.2;
      pos.y += (target.y - pos.y) * 0.2;
      ring.style.transform = "translate3d(" + pos.x + "px, " + pos.y + "px, 0)";
      if (Math.abs(target.x - pos.x) > 0.2 || Math.abs(target.y - pos.y) > 0.2) {
        window.requestAnimationFrame(follow);
      } else {
        moving = false;
      }
    };
    var interactive = "a, button, summary, label, input, select, textarea";
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      target.x = e.clientX;
      target.y = e.clientY;
      if (!ring.classList.contains("is-visible")) {
        pos.x = target.x;
        pos.y = target.y;
        ring.classList.add("is-visible");
      }
      ring.classList.toggle("is-hover", !!(e.target.closest && e.target.closest(interactive)));
      if (!moving) {
        moving = true;
        window.requestAnimationFrame(follow);
      }
    }, { passive: true });
    document.addEventListener("pointerdown", function () { ring.classList.add("is-down"); }, { passive: true });
    document.addEventListener("pointerup", function () { ring.classList.remove("is-down"); }, { passive: true });
    document.documentElement.addEventListener("mouseleave", function () { ring.classList.remove("is-visible"); });

    each(".btn", function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        btn.style.translate = (dx * 10).toFixed(1) + "px " + (dy * 8).toFixed(1) + "px";
      });
      btn.addEventListener("pointerleave", function () { btn.style.translate = ""; });
    });

    each(".card, .offer, .feature", function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  // ---------- Contact form ----------
  var form = document.querySelector("form[data-contact]");
  if (form) {
    var started = form.querySelector('input[name="started"]');
    if (started) started.value = String(Math.floor(Date.now() / 1000));

    var params = new URLSearchParams(window.location.search);
    var errorBox = document.getElementById("form-error");
    if (params.get("error") && errorBox) {
      errorBox.hidden = false;
      errorBox.focus();
    }

    // Preselect the need when coming from an "Order" button (?need=audit)
    var need = params.get("need");
    var select = form.querySelector('select[name="need"]');
    if (need && /^[a-z]+$/.test(need) && select && select.querySelector('option[value="' + need + '"]')) {
      select.value = need;
    }

    // The company field is only useful for businesses
    var company = form.querySelector("[data-company]");
    var syncCompany = function () {
      var chosen = form.querySelector('input[name="client"]:checked');
      if (company) company.hidden = !!(chosen && chosen.value === "particulier");
    };
    Array.prototype.forEach.call(form.querySelectorAll('input[name="client"]'), function (radio) {
      radio.addEventListener("change", syncCompany);
    });
    syncCompany();
  }
});
