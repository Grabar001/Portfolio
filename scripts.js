document.addEventListener("DOMContentLoaded", function () {
    const introScreen = document.getElementById("intro-screen");
    const mainContent = document.getElementById("main-content");
    const themeToggle = document.getElementById("theme-toggle");
    const body = document.body;
  
    // Элемент канваса для ряби
    const canvas = document.getElementById('ripple-canvas');
    const ctx = canvas.getContext('2d');
  
    // Показываем основное содержимое после загрузки
    setTimeout(() => {
        introScreen.style.display = "none"; // Скрыть заставку
        mainContent.classList.add("visible"); // Показать основное содержимое

        // Смена темы на белую
        body.classList.replace("dark-theme", "light-theme");
  
        // Показываем кнопку переключения темы и канвас для ряби
        themeToggle.classList.remove("hide-on-load");
        canvas.classList.remove("hide-on-load");
    }, 3000);
  
    // Переключение темы
    themeToggle.addEventListener("click", () => {
        if (body.classList.contains("dark-theme")) {
            body.classList.replace("dark-theme", "light-theme");
        } else {
            body.classList.replace("light-theme", "dark-theme");
        }
  
        // Перезапускаем анимацию на элементах
        restartAnimation('.cyberpunk-text');
        restartAnimation('.skills-list');
        restartAnimation('.contact-info');
    });
  
    // Функция для перезапуска анимации
    function restartAnimation(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.style.animation = 'none';
            // Триггер перерисовки
            element.offsetHeight;
            element.style.animation = '';
        }
    }
  
    // Эффект ряби на воде, следующий за курсором
    let width, height;
    let ripples = [];
    
    function resizeCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
  
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
  
    // Создаем рябь при движении мыши
    document.addEventListener('mousemove', function (e) {
        // Проверяем, видим ли канвас (т.е. прошла ли заставка)
        if (!canvas.classList.contains("hide-on-load")) {
            createRipple(e.clientX, e.clientY);
        }
    });
  
    // Функция создания ряби
    function createRipple(x, y) {
        ripples.push({
            x: x,
            y: y,
            radius: 0,
            alpha: 1
        });
    }
  
    function animate() {
        ctx.clearRect(0, 0, width, height);
  
        ripples.forEach((ripple, index) => {
            ripple.radius += 2;
            ripple.alpha -= 0.02;
  
            if (ripple.alpha <= 0) {
                ripples.splice(index, 1);
            } else {
                ctx.beginPath();
                ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(${body.classList.contains('dark-theme') ? '255,255,255' : '0,0,0'}, ${ripple.alpha})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
  
        requestAnimationFrame(animate);
    }
  
    animate();
  
    // Находим ссылки и элементы
    const navLinks = document.querySelectorAll('nav ul li a');
    const bioRight = document.querySelector('.bio-right');
    const headerLeft = document.querySelector('.header-left');
  
    // Обработчик клика по навигационным ссылкам
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault(); // Предотвращаем переход по ссылке
  
            // Удаляем классы выбора со всех ссылок
            navLinks.forEach(l => l.classList.remove('selected'));
  
            // Добавляем класс выбора к текущей ссылке
            this.classList.add('selected');
  
            // Скрываем правый текстовый блок
            bioRight.classList.add('hidden');
  
            // Удаляем предыдущий контент, если есть
            const existingContent = document.querySelector('.cyberpunk-text, .skills-list, .contact-info');
            if (existingContent) {
                existingContent.remove();
            }
  
            // Определяем, какой раздел был выбран
            const section = this.getAttribute('href');
  
            if (section === '#projects') {
                // Создаем элемент для надписи "Coming Soon"
                const comingSoon = document.createElement('div');
                comingSoon.classList.add('cyberpunk-text');
                comingSoon.textContent = 'Coming Soon';
                document.body.appendChild(comingSoon);
  
                // Заставляем браузер применить стили перед изменением opacity
                getComputedStyle(comingSoon).opacity;
  
                // Показываем надпись "Coming Soon" с плавным появлением
                comingSoon.style.opacity = 1;
            } else if (section === '#skills') {
                // Создаем элемент для списка навыков
                const skillsList = document.createElement('ul');
                skillsList.classList.add('skills-list');
  
                const skills = [
                    'HTML5 / CSS3',
                    'JavaScript ES6+',
                    'Responsive Design',
                    'PHP 7+',
                    'SQL (MySQL, PostgreSQL)',
                    'Frameworks (Symfony, Laravel)',
                    'JavaScript Frameworks (React.js, Angular)',
                    'APIs and Web Services',
                    'Mobile Web Development',
                    'Version Control (Git)',
                    'Agile Methodologies',
                    'Project Management',
                    'UX/UI Design Principles',
                    'Testing and Debugging',
                    'Deployment and Hosting'
                ];
  
                skills.forEach(skill => {
                    const li = document.createElement('li');
                    li.textContent = skill;
                    skillsList.appendChild(li);
                });
  
                document.body.appendChild(skillsList);
  
                // Заставляем браузер применить стили перед изменением opacity
                getComputedStyle(skillsList).opacity;
  
                // Показываем список навыков с плавным появлением
                skillsList.style.opacity = 1;
            } else if (section === '#contact') {
                // Создаем элемент для контактной информации
                const contactInfo = document.createElement('div');
                contactInfo.classList.add('contact-info');
  
                // Создаем параграфы с контактной информацией
                const tel = document.createElement('p');
                tel.innerHTML = 'Tel: <a href="tel:+33779730742">+33 7 79 73 07 42</a>';
  
                const email = document.createElement('p');
                email.innerHTML = 'Email: <a href="mailto:grabarfamyli@gmail.com">grabarfamyli@gmail.com</a>';
  
                const linkedin = document.createElement('p');
                linkedin.innerHTML = 'LinkedIn: <a href="https://www.linkedin.com/in/albert-grabar" target="_blank">www.linkedin.com/in/albert-grabar</a>';
  
                // Добавляем параграфы в контейнер
                contactInfo.appendChild(tel);
                contactInfo.appendChild(email);
                contactInfo.appendChild(linkedin);
  
                document.body.appendChild(contactInfo);
  
                // Заставляем браузер применить стили перед изменением opacity
                getComputedStyle(contactInfo).opacity;
  
                // Показываем контактную информацию с плавным появлением
                contactInfo.style.opacity = 1;
            } else if (section === '#home') {
                // Показываем правый текстовый блок
                bioRight.classList.remove('hidden');
  
                // Убедимся, что никакие другие элементы не отображаются
                const existingContent = document.querySelector('.cyberpunk-text, .skills-list, .contact-info');
                if (existingContent) {
                    existingContent.remove();
                }
            }
        });
    });
  });