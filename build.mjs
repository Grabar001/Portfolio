// Static site generator for albert-grabar.com.
// One set of templates, one JSON file of texts per language (src/i18n/*.json).
// Usage:  npm run build          → dist/ (warnings for missing details)
//         npm run build:strict   → fails if details are still missing (use before going live)
// To add a language: copy src/i18n/en.json to src/i18n/xx.json, translate it,
// add "xx" to LANGS below and file names to PAGES.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, "src");
const OUT = path.join(ROOT, "dist");
const STRICT = process.argv.includes("--strict");
const BASE_PATH = process.env.BASE_PATH || "/"; // "/Portfolio/" on GitHub Pages, "/" on albert-grabar.com
const TODAY = new Date().toISOString().slice(0, 10);
const YEAR = TODAY.slice(0, 4);

const readJson = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
const config = readJson("site.config.json");

const LANGS = ["fr", "en"];
const T = Object.fromEntries(LANGS.map((lang) => [lang, readJson(`src/i18n/${lang}.json`)]));

// Page id → file name in each language
const PAGES = {
  home: { fr: "index.html", en: "index.html" },
  services: { fr: "services.html", en: "services.html" },
  work: { fr: "realisations.html", en: "work.html" },
  about: { fr: "a-propos.html", en: "about.html" },
  contact: { fr: "contact.html", en: "contact.html" },
  thanks: { fr: "merci.html", en: "thanks.html" },
  legal: { fr: "mentions-legales.html", en: "legal-notice.html" },
  terms: { fr: "cgv.html", en: "terms.html" },
  privacy: { fr: "confidentialite.html", en: "privacy.html" },
  notfound: { fr: "404.html", en: null }, // one 404 page, at the root
};
const NAV = ["services", "work", "about", "contact"];
const NOINDEX = new Set(["thanks", "notfound"]);
const FONTS = [
  ["playfair-display", "playfair-display-latin-700-normal.woff2"],
  ["playfair-display", "playfair-display-latin-ext-700-normal.woff2"],
  ...["300", "400", "600"].flatMap((w) => [
    ["poppins", `poppins-latin-${w}-normal.woff2`],
    ["poppins", `poppins-latin-ext-${w}-normal.woff2`],
  ]),
];

const warnings = [];
const warn = (message) => warnings.push(message);

// ---------- Text helpers ----------
const esc = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// French typography: narrow no-break space before ; : ! ? and no-break space inside numbers + units
function typo(lang, text) {
  text = text.replace(/'/g, "\u2019");
  if (lang !== "fr") return text;
  return text
    .replace(/ ([;:!?])/g, " $1")
    .replace(/(\d) (€|%|h\b)/g, "$1 $2");
}

// Escaped text; {{key}} becomes ready-made HTML (html map) or an escaped value from site.config.json
function txt(lang, text, html = {}) {
  return esc(typo(lang, text)).replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (key in html) return html[key];
    if (key in config) return esc(String(config[key]));
    return match;
  });
}

// ---------- Links ----------
const dirOf = (lang) => (lang === "fr" ? "" : `${lang}/`);
const fileOf = (id, lang) => PAGES[id][lang] ?? PAGES[id].fr;
const absUrl = (id, lang) => {
  const file = fileOf(id, lang);
  return `${config.baseUrl}/${dirOf(lang)}${file === "index.html" ? "" : file}`;
};

function makeContext(lang, id) {
  // The 404 page can be served at any depth, so it uses absolute paths
  const absolute = id === "notfound";
  const up = absolute ? BASE_PATH : lang === "fr" ? "" : "../";
  return {
    lang,
    id,
    t: T[lang],
    asset: (p) => up + p,
    link: (target, hash = "") =>
      (absolute ? BASE_PATH + dirOf(lang) : "") + fileOf(target, lang) + (hash ? `#${hash}` : ""),
    // On the 404 page the language switch leads to the home page of the other language
    cross: (toLang) => up + dirOf(toLang) + (absolute ? "" : fileOf(id, toLang)),
    txt: (text, html) => txt(lang, text, html),
  };
}

// ---------- Layout ----------
function header(ctx) {
  const { t, lang } = ctx;
  const nav = NAV.map((target) => {
    const current = target === ctx.id ? ' aria-current="page"' : "";
    return `<li><a href="${ctx.link(target)}"${current}><span class="dot" aria-hidden="true"></span><span class="label">${esc(t.nav[target])}</span></a></li>`;
  }).join("");
  const langs = LANGS.map((l) => {
    const current = l === lang ? ' aria-current="true"' : "";
    return `<a href="${ctx.cross(l)}" hreflang="${l}" lang="${l}" title="${esc(T[l].name)}"${current}>${T[l].short}</a>`;
  }).join("");
  return `<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="${ctx.link("home")}"><span class="brand-name">Albert Grabar</span><span class="brand-tagline">${ctx.txt(t.ui.tagline)}</span></a>
    <nav class="site-nav" aria-label="${esc(t.ui.menu)}"><ul>${nav}</ul></nav>
    <div class="header-tools">
      <nav class="lang-switch" aria-label="${esc(t.ui.langLabel)}">${langs}</nav>
      <button type="button" class="theme-toggle" aria-pressed="false" title="${esc(t.ui.themeAria)}">${esc(t.ui.theme)}</button>
    </div>
  </div>
</header>`;
}

function footer(ctx) {
  const { t } = ctx;
  const f = t.footer;
  const ext = ' target="_blank" rel="noopener"';
  return `<footer class="site-footer">
  <div class="container">
    <div>
      <p class="f-brand">Albert Grabar</p>
      <p>${ctx.txt(f.identity)}</p>
      <p>${ctx.txt(f.vat)}</p>
      <p class="muted">${ctx.txt(f.b2b)}</p>
    </div>
    <div>
      <ul>${NAV.map((target) => `<li><a href="${ctx.link(target)}">${esc(t.nav[target])}</a></li>`).join("")}</ul>
    </div>
    <div>
      <ul>
        <li><a href="mailto:${esc(config.email)}">${esc(config.email)}</a></li>
        <li><a href="${esc(config.linkedin)}"${ext}>LinkedIn</a> · <a href="${esc(config.github)}"${ext}>GitHub</a></li>
        <li><a href="${ctx.link("legal")}">${esc(f.legal)}</a> · <a href="${ctx.link("terms")}">${esc(f.terms)}</a> · <a href="${ctx.link("privacy")}">${esc(f.privacy)}</a></li>
        <li class="muted">${ctx.txt(f.cookies)}</li>
      </ul>
      <p class="muted">© ${YEAR} Albert Grabar</p>
    </div>
  </div>
</footer>`;
}

function layout(ctx, { title, description, body, jsonld }) {
  const { lang, t, id } = ctx;
  const seo = NOINDEX.has(id)
    ? '<meta name="robots" content="noindex">'
    : [
        `<link rel="canonical" href="${absUrl(id, lang)}">`,
        ...LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${absUrl(id, l)}">`),
        `<link rel="alternate" hreflang="x-default" href="${absUrl(id, "fr")}">`,
      ].join("\n");
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${seo}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Albert Grabar">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${absUrl(id, lang)}">
<meta property="og:image" content="${config.baseUrl}/assets/img/og-${lang}.png">
<meta property="og:locale" content="${t.locale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#ffffff">
<link rel="icon" href="${ctx.asset("favicon.svg")}" type="image/svg+xml">
<link rel="preload" href="${ctx.asset("assets/fonts/playfair-display-latin-700-normal.woff2")}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${ctx.asset("assets/css/main.css")}">
<script src="${ctx.asset("assets/js/theme-init.js")}"></script>
<script src="${ctx.asset("assets/js/main.js")}" defer></script>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ""}
</head>
<body class="page-${id}">
<a class="skip-link" href="#main">${esc(t.ui.skip)}</a>
${header(ctx)}
<main id="main">
${body}
</main>
${footer(ctx)}
<canvas id="ripple-canvas" aria-hidden="true"></canvas>
</body>
</html>
`;
}

// ---------- Shared blocks ----------
function pageHead(ctx, h1, lead = "", leadHtml = {}) {
  return `<section class="page-head"><div class="container">
  <h1>${ctx.txt(h1)}</h1>
  ${lead ? `<p class="lead">${ctx.txt(lead, leadHtml)}</p>` : ""}
</div></section>`;
}

function ctaBand(ctx) {
  const h = ctx.t.home;
  return `<section class="cta-band"><div class="container">
  <h2>${ctx.txt(h.ctaTitle)}</h2>
  <p>${ctx.txt(h.ctaText)}</p>
  <a class="btn" href="${ctx.link("contact", "form")}">${ctx.txt(h.ctaButton)}</a>
  <p class="b2b">${ctx.txt(ctx.t.footer.b2b)}</p>
</div></section>`;
}

const hasImage = (name) => fs.existsSync(path.join(SRC, "static/assets/img", name));

function workCards(ctx, level) {
  const { t } = ctx;
  return t.work.projects
    .map((p) => {
      let cover = `<div class="cover cover-technoir" aria-hidden="true"><span>${esc(p.name)}</span></div>`;
      if (p.id !== "technoir") {
        const img = `work-${p.id}.webp`;
        if (hasImage(img)) {
          cover = `<div class="cover"><img src="${ctx.asset(`assets/img/${img}`)}" alt="" width="1200" height="750" loading="lazy"></div>`;
        } else {
          warn(`Нет картинки assets/img/${img} — карточка без превью`);
        }
      }
      const links = p.links
        .map((l) => {
          let href = l.href.replace(/\{\{(\w+)\}\}/g, (m, key) => config[key] ?? m);
          if (href.startsWith("demos/")) href = ctx.asset(href);
          const ext = l.external ? ' target="_blank" rel="noopener"' : "";
          const hint = l.external ? `<span class="visually-hidden"> ${esc(t.ui.external)}</span>` : "";
          return `<a class="more-link" href="${esc(href)}"${ext}>${esc(l.label)}${hint}</a>`;
        })
        .join("");
      return `<article class="card work-card is-hoverable">
  ${cover}
  <div class="body">
    <p class="tag">${ctx.txt(p.tag)}</p>
    <h${level}>${esc(p.name)}</h${level}>
    <p class="subtitle">${ctx.txt(p.subtitle)}</p>
    <p>${ctx.txt(p.text)}</p>
    <div class="links">${links}</div>
  </div>
</article>`;
    })
    .join("\n");
}

// ---------- Pages ----------
const render = {
  home(ctx) {
    const h = ctx.t.home;
    const body = `
<section class="hero"><div class="container">
  <p class="kicker">${ctx.txt(h.kicker)}</p>
  <h1>${ctx.txt(h.h1)}</h1>
  <p class="lead">${ctx.txt(h.lead)}</p>
  <div class="actions">
    <a class="btn" href="${ctx.link("contact")}?need=audit#form">${ctx.txt(h.ctaPrimary)}</a>
    <a class="btn btn-ghost" href="${ctx.link("services")}">${ctx.txt(h.ctaSecondary)}</a>
  </div>
</div></section>
<div class="container"><ul class="promises">${h.promises.map((p) => `<li>${ctx.txt(p)}</li>`).join("")}</ul></div>

<section class="section"><div class="container grid grid-2">
${h.doors
  .map(
    (d) => `<a class="card door" href="${ctx.link("services", d.anchor)}">
  <h2 class="card-title">${ctx.txt(d.title)}</h2>
  <p>${ctx.txt(d.text)}</p>
  <span class="more-link">${ctx.txt(d.link)}</span>
</a>`
  )
  .join("\n")}
</div></section>

<section class="section section-soft"><div class="container">
  <h2>${ctx.txt(h.breaksTitle)}</h2>
  <ul class="dash-list breaks">${h.breaks.map((b) => `<li>${ctx.txt(b)}</li>`).join("")}</ul>
</div></section>

<section class="section"><div class="container">
  <h2>${ctx.txt(h.stepsTitle)}</h2>
  <ol class="steps grid grid-3">${h.steps.map((s) => `<li><h3>${ctx.txt(s.title)}</h3><p>${ctx.txt(s.text)}</p></li>`).join("")}</ol>
</div></section>

<section class="section section-soft"><div class="container">
  <div class="section-head"><h2>${ctx.txt(h.pricesTitle)}</h2><a class="more-link" href="${ctx.link("services")}">${ctx.txt(h.pricesMore)}</a></div>
  <div class="grid grid-4">${h.prices
    .map(
      (p) => `<a class="card price-card" href="${ctx.link("services", p.anchor)}">
    <h3>${ctx.txt(p.name)}</h3>
    ${p.note ? `<p class="note-line">${ctx.txt(p.note)}</p>` : ""}
    <p class="price">${ctx.txt(p.price)}</p>
  </a>`
    )
    .join("")}</div>
</div></section>

<section class="section"><div class="container">
  <div class="section-head"><h2>${ctx.txt(h.workTitle)}</h2><a class="more-link" href="${ctx.link("work")}">${ctx.txt(h.workMore)}</a></div>
  <div class="grid grid-3">${workCards(ctx, 3)}</div>
</div></section>

<section class="section section-soft"><div class="container split">
  <h2>${ctx.txt(h.aboutTitle)}</h2>
  <div><p class="about-quote">${ctx.txt(h.aboutText)}</p><a class="more-link" href="${ctx.link("about")}">${ctx.txt(h.aboutMore)}</a></div>
</div></section>

<section class="section"><div class="container split">
  <h2>${ctx.txt(h.faqTitle)}</h2>
  <div class="faq">${h.faq.map((f) => `<details><summary>${ctx.txt(f.q)}</summary><p>${ctx.txt(f.a)}</p></details>`).join("")}</div>
</div></section>
${ctaBand(ctx)}`;
    const jsonld = {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: "Albert Grabar",
      url: absUrl("home", ctx.lang),
      email: config.email,
      description: h.description,
      areaServed: "FR",
      founder: {
        "@type": "Person",
        name: "Albert Grabar",
        jobTitle: ctx.lang === "fr" ? "Développeur web full-stack" : "Full-stack web developer",
        sameAs: [config.linkedin, config.github],
      },
    };
    return { title: h.title, description: h.description, body, jsonld };
  },

  services(ctx) {
    const s = ctx.t.services;
    const L = s.labels;
    const offers = s.offers
      .map(
        (o) => `<article class="offer" id="${o.id}">
  <div class="offer-head"><h2>${ctx.txt(o.name)}</h2><p class="offer-price">${ctx.txt(o.price)}</p></div>
  <div class="offer-body">
    <div>
      <h3>${ctx.txt(o.listTitle)}</h3>
      <ul class="dash-list">${o.list.map((item) => `<li>${ctx.txt(item)}</li>`).join("")}</ul>
    </div>
    <div>
      <dl class="facts">
        <dt>${esc(L.for)}</dt><dd>${ctx.txt(o.for)}</dd>
        ${o.result ? `<dt>${esc(L.result)}</dt><dd>${ctx.txt(o.result)}</dd>` : ""}
        <dt>${esc(L.price)}</dt><dd>${ctx.txt(o.priceNote)}</dd>
        <dt>${esc(L.delay)}</dt><dd>${ctx.txt(o.delay)}</dd>
        <dt>${esc(L.payment)}</dt><dd>${ctx.txt(o.payment)}</dd>
      </dl>
      <div class="actions">
        <a class="btn" href="${ctx.link("contact")}?need=${o.need}#form">${ctx.txt(o.cta)}</a>
        ${o.extraLink ? `<a class="more-link" href="${ctx.link("work")}">${ctx.txt(o.extraLink)}</a>` : ""}
      </div>
    </div>
  </div>
</article>`
      )
      .join("\n");
    const body = `${pageHead(ctx, s.h1, s.lead)}
<section class="section"><div class="container">
${offers}
<div class="notice"><p>${ctx.txt(s.vat)}</p><p>${ctx.txt(s.platforms)}</p></div>
</div></section>
${ctaBand(ctx)}`;
    return { title: s.title, description: s.description, body };
  },

  work(ctx) {
    const w = ctx.t.work;
    const body = `${pageHead(ctx, w.h1, w.lead)}
<section class="section"><div class="container grid grid-3">
${workCards(ctx, 2)}
</div></section>
${ctaBand(ctx)}`;
    return { title: w.title, description: w.description, body };
  },

  about(ctx) {
    const a = ctx.t.about;
    const cvLinks = LANGS.filter((l) => config.cv?.[l] && fs.existsSync(path.join(SRC, "static", config.cv[l])));
    if (cvLinks.length < LANGS.length) warn("Нет PDF с CV в src/static/files/ — блок «Recruteur ?» показан без недостающих файлов");
    const cvBlock = cvLinks.length
      ? `<div class="side-block"><h2>${ctx.txt(a.cvTitle)}</h2><p>${ctx.txt(a.cvText)}</p><ul class="dash-list">${cvLinks
          .map((l) => `<li><a href="${ctx.asset(config.cv[l])}" download>${esc(l === "fr" ? a.cvFr : a.cvEn)}</a></li>`)
          .join("")}</ul></div>`
      : "";
    const ext = ' target="_blank" rel="noopener"';
    const body = `${pageHead(ctx, a.h1)}
<section class="section" style="padding-top:24px"><div class="container split">
  <div class="prose">${a.paragraphs.map((p) => `<p>${ctx.txt(p)}</p>`).join("")}</div>
  <aside>
    <div class="side-block"><h2>${ctx.txt(a.skillsTitle)}</h2>
      ${a.skills.map((g) => `<div class="skill-group"><h3>${ctx.txt(g.title)}</h3><ul class="chips">${g.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("")}
    </div>
    <div class="side-block"><h2>${ctx.txt(a.languagesTitle)}</h2><p>${ctx.txt(a.languages)}</p></div>
    ${cvBlock}
    <div class="side-block"><h2>${ctx.txt(a.elsewhere)}</h2><p><a href="${esc(config.linkedin)}"${ext}>LinkedIn</a> · <a href="${esc(config.github)}"${ext}>GitHub</a></p></div>
  </aside>
</div></section>
${ctaBand(ctx)}`;
    return { title: a.title, description: a.description, body };
  },

  contact(ctx) {
    const c = ctx.t.contact;
    const F = c.fields;
    const mail = `<a href="mailto:${esc(config.email)}">${esc(config.email)}</a>`;
    const opt = `<span class="opt">(${esc(c.optional)})</span>`;
    const body = `${pageHead(ctx, c.h1, c.lead, { emailLink: mail })}
<section class="section" style="padding-top:24px"><div class="container split">
  <div>
    <div class="form-error" id="form-error" role="alert" tabindex="-1" hidden>${ctx.txt(c.error, { email: mail })}</div>
    <form id="form" class="form" method="post" action="${ctx.asset("contact.php")}" data-contact>
      <input type="hidden" name="lang" value="${ctx.lang}">
      <input type="hidden" name="started" value="">
      <div class="hp-field" aria-hidden="true"><label for="f-website">Website</label><input type="text" id="f-website" name="website" tabindex="-1" autocomplete="off"></div>
      <p class="small muted">* ${esc(c.required)}</p>
      <div class="form-row">
        <div class="field"><label for="f-name">${esc(F.name)} *</label><input type="text" id="f-name" name="name" required autocomplete="name" maxlength="120"></div>
        <div class="field"><label for="f-email">${esc(F.email)} *</label><input type="email" id="f-email" name="email" required autocomplete="email" maxlength="160"></div>
      </div>
      <div class="field"><label for="f-company">${esc(F.company)} *</label><input type="text" id="f-company" name="company" required autocomplete="organization" maxlength="200"></div>
      <div class="form-row">
        <div class="field"><label for="f-need">${esc(F.need)} *</label><select id="f-need" name="need" required><option value="">${esc(c.choose)}</option>${Object.entries(c.needs)
          .map(([value, label]) => `<option value="${value}">${ctx.txt(label)}</option>`)
          .join("")}</select></div>
        <div class="field"><label for="f-budget">${esc(F.budget)} ${opt}</label><select id="f-budget" name="budget"><option value="">${esc(c.choose)}</option>${c.budgets
          .map((label, i) => `<option value="${i}">${ctx.txt(label)}</option>`)
          .join("")}</select></div>
      </div>
      <div class="field"><label for="f-link">${esc(F.link)} ${opt}</label><input type="url" id="f-link" name="link" placeholder="https://" maxlength="300"></div>
      <div class="field"><label for="f-message">${esc(F.message)} *</label><textarea id="f-message" name="message" required minlength="10" maxlength="4000"></textarea></div>
      <div class="field"><label for="f-deadline">${esc(F.deadline)} ${opt}</label><input type="text" id="f-deadline" name="deadline" maxlength="120"></div>
      <label class="check"><input type="checkbox" name="pro" value="yes" required><span>${ctx.txt(F.pro)} *</span></label>
      <p class="small muted">${ctx.txt(c.privacy, { email: mail, privacyLink: `<a href="${ctx.link("privacy")}">${esc(c.privacyLink)}</a>` })}</p>
      <div><button class="btn" type="submit">${esc(c.submit)}</button></div>
    </form>
  </div>
  <aside class="contact-aside">
    <div class="side-block"><h2>${esc(c.asideEmail)}</h2><p>${mail}</p></div>
    <div class="side-block"><h2>${esc(c.asideReply)}</h2><p>${ctx.txt(c.asideReplyText)}</p></div>
    <div class="side-block"><h2>${esc(c.asidePlatforms)}</h2><p>${ctx.txt(c.platforms)}</p></div>
  </aside>
</div></section>`;
    return { title: c.title, description: c.description, body };
  },

  thanks(ctx) {
    const th = ctx.t.thanks;
    const body = `<section class="section"><div class="container center-page">
  <h1>${ctx.txt(th.h1)}</h1>
  <p class="lead">${ctx.txt(th.text)}</p>
  <p><a class="btn" href="${ctx.link("home")}">${ctx.txt(th.back)}</a></p>
</div></section>`;
    return { title: th.title, description: th.description, body };
  },

  legal: (ctx) => legalPage(ctx, "legal"),
  terms: (ctx) => legalPage(ctx, "terms"),
  privacy: (ctx) => legalPage(ctx, "privacy"),

  notfound(ctx) {
    const n = ctx.t.notfound;
    const body = `<section class="section"><div class="container center-page">
  <h1>${ctx.txt(n.h1)}</h1>
  <p class="lead">${ctx.txt(n.text)}</p>
  <div class="actions">
    <a class="btn" href="${BASE_PATH}">${ctx.txt(n.home)}</a>
    <a class="btn btn-ghost" href="${BASE_PATH}en/" lang="en">${ctx.txt(n.other)}</a>
  </div>
</div></section>`;
    return { title: n.title, description: n.description, body };
  },
};

function legalPage(ctx, id) {
  const meta = ctx.t[id];
  const raw = fs.readFileSync(path.join(SRC, "content", ctx.lang, `${id}.html`), "utf8");
  const content = raw.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (key === "privacyHref") return ctx.link("privacy");
    if (key === "termsHref") return ctx.link("terms");
    if (key in config) return esc(typo(ctx.lang, String(config[key])));
    warn(`Неизвестная метка {{${key}}} в content/${ctx.lang}/${id}.html`);
    return match;
  });
  const body = `${pageHead(ctx, meta.h1)}
<section class="section" style="padding-top:16px"><div class="container"><div class="prose">
${typo(ctx.lang, content)}
<p class="updated">${ctx.txt(ctx.t.updated.replace("{{date}}", TODAY))}</p>
</div></div></section>`;
  return { title: meta.title, description: meta.description, body };
}

// ---------- Build ----------
function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, entry.name);
    const b = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(a, b);
    else fs.copyFileSync(a, b);
  }
}

function write(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// Static files, demos, scripts, fonts, styles
copyDir(path.join(SRC, "static"), OUT);
copyDir(path.join(SRC, "demos"), path.join(OUT, "demos"));
copyDir(path.join(SRC, "js"), path.join(OUT, "assets/js"));
for (const [pkg, file] of FONTS) {
  const from = path.join(ROOT, "node_modules/@fontsource", pkg, "files", file);
  if (!fs.existsSync(from)) throw new Error(`Font missing: ${from} — run "npm install" first`);
  write(`assets/fonts/${file}`, fs.readFileSync(from));
}
write("assets/css/main.css", sass.compile(path.join(SRC, "styles/main.scss"), { style: "compressed" }).css);

// Contact form handler with the addresses from site.config.json
write(
  "contact.php",
  fs
    .readFileSync(path.join(SRC, "php/contact.php"), "utf8")
    .replace("__TO_EMAIL__", config.formRecipient)
    .replace("__FROM_EMAIL__", config.formSender)
);

// Pages
let pages = 0;
for (const [id, files] of Object.entries(PAGES)) {
  for (const lang of LANGS) {
    if (!files[lang]) continue;
    const ctx = makeContext(lang, id);
    write(dirOf(lang) + files[lang], layout(ctx, render[id](ctx)));
    pages++;
  }
}

// Sitemap and robots.txt
const indexable = Object.keys(PAGES).filter((id) => !NOINDEX.has(id));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${indexable
  .flatMap((id) =>
    LANGS.map(
      (lang) => `  <url>
    <loc>${absUrl(id, lang)}</loc>
    <lastmod>${TODAY}</lastmod>
${LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${absUrl(id, l)}"/>`).join("\n")}
  </url>`
    )
  )
  .join("\n")}
</urlset>
`;
write("sitemap.xml", sitemap);
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${config.baseUrl}/sitemap.xml\n`);

// Checks: details that must be filled before going live
for (const [key, value] of Object.entries(config)) {
  if (typeof value === "string" && /À COMPLÉTER|à compléter|\[/.test(value)) {
    warn(`site.config.json → "${key}" ещё не заполнен: ${value}`);
  }
}

console.log(`Готово: ${pages} страниц в dist/ (${LANGS.join(", ")}).`);
if (warnings.length) {
  console.log(`\nНужно доделать (${warnings.length}):`);
  [...new Set(warnings)].forEach((w) => console.log(` - ${w}`));
  if (STRICT) {
    console.error("\n--strict: сборка остановлена, заполните данные перед публикацией.");
    process.exit(1);
  }
}
