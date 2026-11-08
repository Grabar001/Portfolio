// albert-grabar.com — theme switch, ripple effect, contact form helpers.
document.addEventListener("DOMContentLoaded", function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
      applyTheme(next);
      try { window.localStorage.setItem("theme", next); } catch (e) { /* storage blocked */ }
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

    // Preselect the need when coming from a "Order" button (?need=audit)
    var need = params.get("need");
    var select = form.querySelector('select[name="need"]');
    if (need && /^[a-z]+$/.test(need) && select && select.querySelector('option[value="' + need + '"]')) {
      select.value = need;
    }
  }
});
