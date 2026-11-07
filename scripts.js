document.addEventListener("DOMContentLoaded", function () {
    const introScreen = document.getElementById("intro-screen");
    const mainContent = document.getElementById("main-content");
    const themeToggle = document.getElementById("theme-toggle");
    const body = document.body;
    const canvas = document.getElementById("ripple-canvas");
    const ctx = canvas.getContext("2d");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const INTRO_DURATION = 3000;

    // localStorage/sessionStorage могут быть недоступны (приватный режим) — не ломаемся
    const storage = {
        get(store, key) {
            try { return window[store].getItem(key); } catch (e) { return null; }
        },
        set(store, key, value) {
            try { window[store].setItem(key, value); } catch (e) { /* игнорируем */ }
        },
    };

    // ---------- Тема ----------
    function preferredTheme() {
        const saved = storage.get("localStorage", "theme");
        if (saved === "dark" || saved === "light") return saved;
        // Сайт задуман светлым после заставки; тёмный — если так настроена система
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    function applyTheme(theme) {
        body.classList.remove("dark-theme", "light-theme");
        body.classList.add(theme + "-theme");
        themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute("content", theme === "dark" ? "#000000" : "#ffffff");
    }

    themeToggle.addEventListener("click", () => {
        const next = body.classList.contains("dark-theme") ? "light" : "dark";
        applyTheme(next);
        storage.set("localStorage", "theme", next);
    });

    // ---------- Заставка ----------
    // Заставка тёмная; после неё — выбранная тема
    applyTheme("dark");
    let introDone = false;
    let introTimer = null;

    function finishIntro() {
        if (introDone) return;
        introDone = true;
        clearTimeout(introTimer);
        introScreen.style.display = "none";
        mainContent.classList.add("visible");
        applyTheme(preferredTheme());
        themeToggle.classList.remove("hide-on-load");
        canvas.classList.remove("hide-on-load");
        storage.set("sessionStorage", "introSeen", "1");
        document.removeEventListener("keydown", finishIntro);
    }

    // Повторный заход в той же вкладке или «уменьшение движения» — без заставки
    if (storage.get("sessionStorage", "introSeen") || reduceMotion) {
        finishIntro();
    } else {
        introTimer = setTimeout(finishIntro, INTRO_DURATION);
        introScreen.addEventListener("click", finishIntro);
        document.addEventListener("keydown", finishIntro);
    }

    // ---------- Рябь ----------
    let ripples = [];
    let animating = false;
    let dpr = 1;

    function resizeCanvas() {
        dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(window.innerWidth * dpr);
        canvas.height = Math.round(window.innerHeight * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // рисуем в CSS-пикселях, но чётко на Retina
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    function createRipple(x, y) {
        ripples.push({ x, y, radius: 0, alpha: 1 });
        // Анимация запускается только когда есть что рисовать — не грузим процессор впустую
        if (!animating) {
            animating = true;
            requestAnimationFrame(animateRipples);
        }
    }

    function animateRipples() {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        ripples = ripples.filter((ripple) => ripple.alpha > 0);

        const rgb = body.classList.contains("dark-theme") ? "255, 255, 255" : "0, 0, 0";
        ctx.lineWidth = 2;
        ripples.forEach((ripple) => {
            ripple.radius += 2;
            ripple.alpha -= 0.02;
            ctx.beginPath();
            ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${rgb}, ${Math.max(ripple.alpha, 0)})`;
            ctx.stroke();
        });

        if (ripples.length) {
            requestAnimationFrame(animateRipples);
        } else {
            animating = false;
        }
    }

    if (!reduceMotion) {
        // pointer-события работают и для мыши, и для пальца
        document.addEventListener("pointermove", (e) => {
            if (introDone) createRipple(e.clientX, e.clientY);
        }, { passive: true });
        document.addEventListener("pointerdown", (e) => {
            if (introDone) createRipple(e.clientX, e.clientY);
        }, { passive: true });
    }

    // ---------- Навигация ----------
    // Разделы привязаны к адресу (#skills и т.п.): работает «Назад», можно делиться ссылкой
    const navLinks = document.querySelectorAll("nav a[data-section]");
    const panels = document.querySelectorAll(".panel");
    const sections = Array.from(navLinks, (link) => link.dataset.section);

    function showSection(name) {
        // Без адреса (первый заход) показываем Home, но все пункты меню остаются словами, как и раньше
        const explicit = sections.includes(name);
        if (!explicit) name = "home";

        navLinks.forEach((link) => {
            const active = link.dataset.section === name;
            link.classList.toggle("selected", active && explicit);
            if (active) link.setAttribute("aria-current", "page");
            else link.removeAttribute("aria-current");
        });

        panels.forEach((panel) => {
            panel.hidden = panel.id !== "section-" + name;
        });
    }

    navLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const name = link.dataset.section;
            if (location.hash.slice(1) !== name) {
                history.pushState(null, "", "#" + name);
            }
            showSection(name);
            if (!introDone) finishIntro();
        });
    });

    window.addEventListener("popstate", () => showSection(location.hash.slice(1)));
    showSection(location.hash.slice(1));
});
