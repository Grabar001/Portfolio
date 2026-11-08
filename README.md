# albert-grabar.com — сайт v2

Новый сайт Альберта Грабара на французском и английском, в стиле прежнего портфолио: чёрно-белый, Playfair Display + Poppins, эффект ряби, кнопка «Noir / Blanc».
Сайт статичный: страницы собираются из папки `src/` скриптом `build.mjs`. Готовый сайт — в папке `dist/`.

## Что где лежит

| Путь | Что внутри |
| --- | --- |
| `site.config.json` | Реквизиты: SIRET, e-mail, телефон, адрес, хостер, ссылки, куда приходят заявки |
| `src/i18n/fr.json`, `src/i18n/en.json` | Все тексты страниц |
| `src/content/fr/`, `src/content/en/` | Mentions légales, CGV, политика конфиденциальности |
| `src/styles/main.scss` | Стили |
| `src/js/` | Тема Noir / Blanc, рябь, помощь форме |
| `src/php/contact.php` | Обработчик формы (PHP 8.1+): проверяет данные, ловит ботов, шлёт письмо |
| `src/demos/` | Два демо-сайта (вымышленные компании) |
| `src/static/` | `.htaccess`, иконка, картинки; в `files/` положи CV |

## Собрать

```bash
npm install
npm run build          # собирает dist/ и пишет, что ещё не заполнено
npm run build:strict   # то же, но останавливается, если не заполнены адрес или хостер
```

`dist/index.html` можно открыть двойным кликом: всё работает без сервера, кроме формы.

## Что заполнить перед публикацией

1. `site.config.json` → `address`: адрес для mentions légales (домашний или домициляция).
2. `site.config.json` → `host`: реквизиты PlanetHoster (название компании, адрес, телефон) — из счёта или личного кабинета.
3. Ящик `contact@albert-grabar.com` в PlanetHoster (или переадресация на Gmail). Заявки с формы приходят на `formRecipient`.
4. CV: `src/static/files/cv-albert-grabar-fr.pdf` и `cv-albert-grabar-en.pdf` — тогда на странице «À propos» появится блок для рекрутеров.

## Поменять текст

Открой `src/i18n/fr.json` (или `en.json`), найди фразу, поменяй, запусти `npm run build`.

## Добавить язык (например, русский или украинский)

1. Скопируй `src/i18n/en.json` в `src/i18n/ru.json` и переведи.
2. В `build.mjs` добавь `"ru"` в `LANGS` и имена файлов в `PAGES`.
3. Добавь переводы юридических страниц в `src/content/ru/`.
4. В Poppins нет кириллицы: для RU/UK нужно подключить второй шрифт (например, Inter).

## Публикация на albert-grabar.com (PlanetHoster)

Первую публикацию делаем вместе (задачи T06–T07 плана):

1. Перенести TECH NOIR на поддомен `technoir.albert-grabar.com`: создать поддомен в панели, перенести файлы, включить SSL, закрыть от поисковиков.
2. Заполнить реквизиты (см. выше) и запустить `npm run build:strict`.
3. Загрузить **содержимое** `dist/` в папку домена albert-grabar.com (менеджер файлов или FTP), включая `.htaccess`.
4. Отправить себе тестовую заявку через форму.
5. Когда `https://www.albert-grabar.com` открывается без ошибок — убрать `#` перед 4 строками «force HTTPS + www» в `.htaccess`.
6. Google Search Console: добавить сайт и отправить `sitemap.xml`.

## GitHub

- Эта версия — ветка `site-v2`. Отправить: `git push -u origin site-v2`, затем открыть Pull Request и слить в `main`.
- После слияния GitHub Pages сам соберёт предпросмотр: https://grabar001.github.io/Portfolio/ (форма там не работает).
- Автопубликация на PlanetHoster: `.github/workflows/deploy-planethoster.yml`, запуск вручную во вкладке Actions. Перед первым запуском нужны секреты FTP — инструкция в начале файла.
