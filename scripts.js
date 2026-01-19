document.addEventListener("DOMContentLoaded", function () {
    const introScreen = document.getElementById("intro-screen");
    const mainContent = document.getElementById("main-content");
    const themeToggle = document.getElementById("theme-toggle");
    const body = document.body;

    // Элемент для ряби
    const canvas = document.getElementById("ripple-canvas");
    const ctx = canvas.getContext("2d");
    let ripples = [];

    // Инициализация: темная тема для заставки
    body.classList.add("dark-theme");

    // Показать основное содержимое после заставки
    setTimeout(() => {
        introScreen.style.display = "none"; // Скрыть заставку
        mainContent.classList.add("visible"); // Показать основное содержимое
        body.classList.replace("dark-theme", "light-theme"); // Переключить на светлую тему
        themeToggle.classList.remove("hide-on-load"); // Показать кнопку переключения темы
        canvas.classList.remove("hide-on-load"); // Показать canvas
    }, 3000);

    // Переключение темы
    themeToggle.addEventListener("click", () => {
        if (body.classList.contains("dark-theme")) {
            body.classList.replace("dark-theme", "light-theme");
        } else {
            body.classList.replace("light-theme", "dark-theme");
        }
    });

    // Настройка размеров canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Создание ряби
    function createRipple(x, y) {
        ripples.push({ x, y, radius: 0, alpha: 1 });
    }

    // Анимация ряби
    function animateRipples() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Фильтруем массив, оставляя только видимые круги
    ripples = ripples.filter(ripple => ripple.alpha > 0);

    ripples.forEach((ripple) => {
        ripple.radius += 2;
        ripple.alpha -= 0.02;

        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${body.classList.contains("dark-theme") ? "255, 255, 255" : "0, 0, 0"}, ${ripple.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    requestAnimationFrame(animateRipples);
}

    animateRipples();

    // Добавление ряби при движении мыши
    document.addEventListener("mousemove", (e) => {
        if (!canvas.classList.contains("hide-on-load")) {
            createRipple(e.clientX, e.clientY);
        }
    });

    // Управление навигацией
    const navLinks = document.querySelectorAll("nav ul li a");
    const bioRight = document.querySelector(".bio-right");

    navLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault(); // Отключить переход по ссылке

            // Удалить класс "selected" со всех ссылок
            navLinks.forEach((l) => l.classList.remove("selected"));

            // Добавить класс "selected" к текущей ссылке
            link.classList.add("selected");

            // Скрыть правый текстовый блок
            bioRight.classList.add("hidden");

            // Удалить предыдущий динамический контент
            document.querySelectorAll(".dynamic-content").forEach((el) => el.remove());

            const section = link.getAttribute("href");

            if (section === "#projects") {
                createComingSoon();
            } else if (section === "#skills") {
                createSkillsList();
            } else if (section === "#contact") {
                createContactInfo();
            } else if (section === "#home") {
                bioRight.classList.remove("hidden");
            }
        });
    });

    // Создание "Coming Soon"
    function createComingSoon() {
        const comingSoon = document.createElement("div");
        comingSoon.classList.add("dynamic-content", "cyberpunk-text");
        comingSoon.textContent = "Coming Soon";
        document.body.appendChild(comingSoon);
    }

    // Создание списка навыков
    function createSkillsList() {
        const skillsList = document.createElement("ul");
        skillsList.classList.add("dynamic-content", "skills-list");

        const skills = [
            "HTML5 / CSS3",
            "JavaScript ES6+",
            "Responsive Design",
            "PHP 7+",
            "SQL (MySQL, PostgreSQL)",
            "Frameworks (Symfony, Laravel)",
            "JavaScript Frameworks (React.js, Angular)",
            "APIs and Web Services",
            "Mobile Web Development",
            "Version Control (Git)",
            "Agile Methodologies",
            "Project Management",
            "UX/UI Design Principles",
            "Testing and Debugging",
            "Deployment and Hosting",
        ];

        skills.forEach((skill) => {
            const li = document.createElement("li");
            li.textContent = skill;
            skillsList.appendChild(li);
        });

        document.body.appendChild(skillsList);
    }

    // Создание контактной информации
    function createContactInfo() {
        const contactInfo = document.createElement("div");
        contactInfo.classList.add("dynamic-content", "contact-info");

        const tel = document.createElement("p");
        tel.innerHTML = 'Tel: <a href="tel:+33779730742">+33 7 79 73 07 42</a>';

        const email = document.createElement("p");
        email.innerHTML = 'Email: <a href="mailto:grabarfamyli@gmail.com">grabarfamyli@gmail.com</a>';

        const linkedin = document.createElement("p");
        linkedin.innerHTML = 'LinkedIn: <a href="https://www.linkedin.com/in/albert-grabar" target="_blank">www.linkedin.com/in/albert-grabar</a>';

        contactInfo.appendChild(tel);
        contactInfo.appendChild(email);
        contactInfo.appendChild(linkedin);

        document.body.appendChild(contactInfo);
    }
});