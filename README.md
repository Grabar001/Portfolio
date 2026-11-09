# albert-grabar.com — сайт v2

Сайт Альберта Грабара на французском, английском и русском, в стиле прежнего портфолио: чёрно-белый, Playfair Display + Poppins, эффект ряби, кнопка «Noir / Blanc».
Услуги для частных лиц и профессионалов; у каждой услуги своя страница с полным описанием.
Сайт статичный: страницы собираются из папки `src/` скриптом `build.mjs`. Готовый сайт — в папке `dist/`.
Сайт живёт только на https://www.albert-grabar.com; старый адрес grabar001.github.io/Portfolio перенаправляет туда.

## Что где лежит

| Путь | Что внутри |
| --- | --- |
| `site.config.json` | Реквизиты: SIRET, e-mail, телефон, адрес, хостер, медиатор, ссылки, куда приходят заявки |
| `src/i18n/fr.json`, `src/i18n/en.json` | Все тексты страниц, включая полные описания услуг (`services.offers[].detail`) |
| `src/content/fr/`, `src/content/en/` | Mentions légales, CGV (частные лица и профессионалы), политика конфиденциальности |
| `src/styles/main.scss` | Стили и эффекты |
| `src/js/` | Тема Noir / Blanc, эффекты при прокрутке, рябь, помощь форме |
| `src/php/contact.php` | Обработчик формы (PHP 8.1+): проверяет данные, ловит ботов, шлёт письмо |
| `src/demos/` | Два демо-сайта (вымышленные компании) |
| `src/static/` | `.htaccess`, иконка, картинки; `files/` — CV в PDF |

## Собрать

```bash
npm install
npm run build          # собирает dist/ и пишет, что ещё не заполнено
npm run build:strict   # то же, но останавливается, если не заполнены хостер или медиатор
```

`dist/index.html` можно открыть двойным кликом: всё работает без сервера, кроме формы.

## Что заполнить перед публикацией

1. `site.config.json` → `host`: реквизиты PlanetHoster (название компании, адрес, телефон) — из счёта.
2. `site.config.json` → `mediatorName`, `mediatorAddress`, `mediatorUrl`: медиатор потребителей. Обязателен, раз сайт предлагает услуги частным лицам.
3. Проверить телефон в `phone` (в старом CV и на старом сайте номера отличались одной цифрой).

Заявки с формы приходят на `formRecipient` (grabarweb@gmail.com) с адреса `formSender`.

## Поменять текст

Открой `src/i18n/fr.json` (или `en.json`), найди фразу, поменяй, запусти `npm run build`.

## Режим «только профессионалы»

`site.config.json` → `"consumers": false` (сейчас так): тексты из блока `b2b` в i18n, CGV без потребителей, медиатор не нужен.
Чтобы снова продавать частным лицам: `"consumers": true` + поля `mediator*`. Русские тексты и юридические страницы сейчас есть только для режима «только профессионалы».

## Добавить язык (например, украинский)

1. Скопируй `src/i18n/en.json` в `src/i18n/ru.json` и переведи.
2. В `build.mjs` добавь `"ru"` в `LANGS` и имена файлов в `PAGES`.
3. Добавь переводы юридических страниц в `src/content/ru/`.
4. Кириллица уже подключена: Playfair Display (заголовки) и Montserrat вместо Poppins (текст).

## Публикация

Пошаговая инструкция — в документе «Публикация сайта albert-grabar.com: GitHub и PlanetHoster». Коротко:

1. GitHub: отправить ветку `site-v2` (GitHub Desktop → Publish branch), открыть Pull Request.
2. PlanetHoster: резервная копия, TECH NOIR → `technoir.albert-grabar.com`.
3. `npm run build:strict`, загрузить **содержимое** `dist/` в `public_html` (FileZilla, SFTP, порт 5022), включая `.htaccess`.
4. Проверить форму, HTTPS, страницы; затем убрать `#` перед 6 строками блока «1)» в `.htaccess`: всё (albert-grabar.com, albertgrabar.com, http) будет вести на https://www.albert-grabar.com.
5. GitHub: Settings → Pages → Source «GitHub Actions», слить Pull Request — старый адрес начнёт перенаправлять на albert-grabar.com. Google Search Console: отправить `sitemap.xml`.

Автопубликация на PlanetHoster: `.github/workflows/deploy-planethoster.yml`, запуск вручную во вкладке Actions. Перед первым запуском нужны секреты FTP — инструкция в начале файла.
