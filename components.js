/**
 * NanoScrape — Header + Footer + Language Switcher (v2)
 *
 * Drop-in replacement for /components.js
 *
 * Usage on every page (unchanged):
 * <div id="site-header"></div>
 * ... page content ...
 * <div id="site-footer"></div>
 * <script src="/components.js"></script>
 * <script src="/search.js"></script> <!-- new: search palette -->
 *
 * Optional per-page breadcrumb (sub-pages only):
 * <div id="site-header" data-crumb-section="Social media" data-crumb-title="Instagram Scraper"></div>
 *
 * URL contract: this file never invents URLs. Nav targets are
 * '/', '/tutorials/', '/templates/' and the localized homepage variants only.
 */

(function () {
 'use strict';

 // ==========================================================================
 // CONFIG
 // ==========================================================================

 var LANGUAGES = [
 { code: 'en', label: 'English', triggerLabel: 'EN', prefix: '' },
 { code: 'de', label: 'Deutsch', triggerLabel: 'DE', prefix: 'de' },
 { code: 'zh', label: '中文', triggerLabel: '中文', prefix: 'zh' },
 { code: 'fr', label: 'Français', triggerLabel: 'FR', prefix: 'fr' }
 ];

 var APIFY_PROFILES = {
 main: 'https://apify.com/santamaria-automations?fpr=0khfbz',
 org: 'https://apify.com/nanoscrape?fpr=0khfbz'
 };

 // Homepage, actor pages, and tutorial pages are localized. Templates are
 // still EN-only. For tutorials the localization uses language-specific
 // slugs (SEO), so the picker navigates via the page's own <link rel="alternate"
 // hreflang> tags — the writer emits those into every tutorial's <head>.
 var T = {
 en: { actors: 'Actors', tutorials: 'Tutorials', templates: 'Templates', search: 'Search actors, tutorials…', store: 'Apify Store', start: 'Start free', home: 'Home', lang: 'Language',
 colActors: 'Actors', colLearn: 'Learn', colBuild: 'Build', colCompany: 'NanoScrape',
 allActors: 'All 206 actors', allTutorials: 'All tutorials', allTemplates: 'All templates',
 tagline: 'Lightweight HTTP-only scraping actors on Apify.',
 legal: 'Actors run on Apify · Pay-per-result, no monthly fee · Links to apify.com contain our affiliate ID (?fpr=0khfbz) — pricing is unchanged for you.' },
 de: { actors: 'Aktoren', tutorials: 'Tutorials', templates: 'Vorlagen', search: 'Aktoren, Tutorials suchen…', store: 'Apify Store', start: 'Kostenlos starten', home: 'Start', lang: 'Sprache',
 colActors: 'Aktoren', colLearn: 'Lernen', colBuild: 'Bauen', colCompany: 'NanoScrape',
 allActors: 'Alle 206 Aktoren', allTutorials: 'Alle Tutorials', allTemplates: 'Alle Vorlagen',
 tagline: 'Leichtgewichtige HTTP-only Scraping-Aktoren auf Apify.',
 legal: 'Aktoren laufen auf Apify · Pay-per-Result, keine Monatsgebühr · Links zu apify.com enthalten unsere Affiliate-ID (?fpr=0khfbz) — der Preis bleibt für dich gleich.' },
 zh: { actors: '工具', tutorials: '教程', templates: '模板', search: '搜索工具、教程…', store: 'Apify 商店', start: '免费开始', home: '首页', lang: '语言',
 colActors: '工具', colLearn: '教程', colBuild: '模板', colCompany: 'NanoScrape',
 allActors: '全部 206 个工具', allTutorials: '全部教程', allTemplates: '全部模板',
 tagline: '在 Apify 上运行的轻量级纯 HTTP 抓取工具。',
 legal: '工具运行于 Apify · 按结果计费，无月费 · apify.com 的链接包含我们的合作伙伴 ID (?fpr=0khfbz) — 价格对您不变。' },
 fr: { actors: 'Acteurs', tutorials: 'Tutoriels', templates: 'Modèles', search: 'Rechercher acteurs, tutoriels…', store: 'Apify Store', start: 'Commencer', home: 'Accueil', lang: 'Langue',
 colActors: 'Acteurs', colLearn: 'Apprendre', colBuild: 'Construire', colCompany: 'NanoScrape',
 allActors: 'Les 206 acteurs', allTutorials: 'Tous les tutoriels', allTemplates: 'Tous les modèles',
 tagline: 'Acteurs de scraping HTTP légers sur Apify.',
 legal: 'Acteurs hébergés sur Apify · Paiement au résultat, sans abonnement · Les liens vers apify.com contiennent notre identifiant d\'affiliation (?fpr=0khfbz) — le prix reste identique pour vous.' }
 };

 // ==========================================================================
 // PATH DETECTION (unchanged logic from v1)
 // ==========================================================================

 function detectContext() {
 var path = window.location.pathname;
 var currentLang = 'en';

 // Tutorials: /{lang}/tutorials/{slug}/ for non-EN, /tutorials/{slug}/ for EN.
 var tutorialLangMatch = path.match(/^\/([a-z]{2})\/(tutorials|guides)\//);
 if (tutorialLangMatch) currentLang = tutorialLangMatch[1];

 for (var i = 0; i < LANGUAGES.length; i++) {
 var lang = LANGUAGES[i];
 if (!lang.prefix) continue;
 var actorMatch = path.match(/^\/actors\/([^\/]+)\//);
 if (actorMatch) {
 if (path.match(new RegExp('/actors/[^/]+/' + lang.prefix + '/'))) { currentLang = lang.code; break; }
 } else if (path === '/' + lang.prefix + '/' || path === '/' + lang.prefix) {
 currentLang = lang.code; break;
 }
 }

 var m = path.match(/\/actors\/([^\/]+)/);
 var actorSlug = m ? m[1] : null;
 var section = 'other';
 if (path === '/' || /^\/(de|zh|fr|es|it|pt)\/?$/.test(path)) section = 'home';
 else if (actorSlug) section = 'actors';
 else if (path.indexOf('/tutorials/') === 0 || /^\/[a-z]{2}\/tutorials\//.test(path)) section = 'tutorials';
 else if (path.indexOf('/templates/') === 0) section = 'templates';

 var isTutorialDetail = section === 'tutorials' && !/\/tutorials\/?$/.test(path);
 return { currentLang: currentLang, actorSlug: actorSlug, isActorPage: !!actorSlug, isTutorialDetail: isTutorialDetail, section: section, path: path };
 }

 // On tutorial detail pages the language picker uses the page's own
 // <link rel="alternate" hreflang> tags (rendered by the tutorial writer)
 // as the source of translated-sibling URLs. Falls back to the target-lang
 // tutorials hub if the current tutorial has no translation in that language.
 function tutorialAlternateHref(targetLang) {
 try {
 var links = document.querySelectorAll('link[rel="alternate"][hreflang]');
 for (var i = 0; i < links.length; i++) {
 var hl = links[i].getAttribute('hreflang');
 if (hl === targetLang) return links[i].getAttribute('href');
 }
 } catch (e) {}
 return null;
 }

 function buildLangUrl(targetLang, actorSlug, isActorPage, isTutorialDetail, section) {
 var lang = null;
 for (var i = 0; i < LANGUAGES.length; i++) if (LANGUAGES[i].code === targetLang) lang = LANGUAGES[i];
 if (!lang) return '/';
 if (isActorPage && actorSlug) {
 return targetLang === 'en' ? '/actors/' + actorSlug + '/' : '/actors/' + actorSlug + '/' + lang.prefix + '/';
 }
 if (isTutorialDetail) {
 // Prefer the page's own hreflang; if absent, fall back to the tutorials hub in target lang.
 var alt = tutorialAlternateHref(targetLang);
 if (alt) return alt;
 return tutorialsHubUrl(targetLang);
 }
 // Tutorials hub → keep users on the hub for the target language.
 if (section === 'tutorials') return tutorialsHubUrl(targetLang);
 return targetLang === 'en' ? '/' : '/' + lang.prefix + '/';
 }

 function homeUrl(langCode) {
 for (var i = 0; i < LANGUAGES.length; i++) {
 if (LANGUAGES[i].code === langCode) return LANGUAGES[i].prefix ? '/' + LANGUAGES[i].prefix + '/' : '/';
 }
 return '/';
 }

 // Language-aware tutorials hub URL. EN at /tutorials/, others under /{lang}/tutorials/.
 // Only languages with a published tutorials hub get a localized URL; the
 // rest fall back to the EN hub (no zh hub yet; it would 404).
 var TUTORIAL_HUB_LANGS = { fr: true, de: true };
 function tutorialsHubUrl(langCode) {
 for (var i = 0; i < LANGUAGES.length; i++) {
 if (LANGUAGES[i].code === langCode) return LANGUAGES[i].prefix && TUTORIAL_HUB_LANGS[langCode] ? '/' + LANGUAGES[i].prefix + '/tutorials/' : '/tutorials/';
 }
 return '/tutorials/';
 }

 function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

 // ==========================================================================
 // PARTIALS
 // ==========================================================================

 function langDropdown(ctx, t) {
 var items = '';
 for (var i = 0; i < LANGUAGES.length; i++) {
 var l = LANGUAGES[i];
 items += '<a href="' + buildLangUrl(l.code, ctx.actorSlug, ctx.isActorPage, ctx.isTutorialDetail, ctx.section) + '"' +
 (l.code === ctx.currentLang ? ' class="active" aria-current="true"' : '') + '>' + l.label + '</a>';
 }
 var trigger = 'EN';
 for (var j = 0; j < LANGUAGES.length; j++) if (LANGUAGES[j].code === ctx.currentLang) trigger = LANGUAGES[j].triggerLabel;
 return '<div class="ns-lang-dropdown">' +
 '<button class="ns-lang-trigger" aria-label="' + esc(t.lang) + '" aria-haspopup="true" aria-expanded="false">\uD83C\uDF10 ' + trigger + ' \u25BE</button>' +
 '<div class="ns-lang-menu" role="menu">' + items + '</div></div>';
 }

 // Nav links. Actors = the homepage (catalog lives there — URL structure kept).
 function navLinks(ctx, t) {
 var actorsHref = homeUrl(ctx.currentLang);
 var on = function (s) { return ctx.section === s ? ' class="ns-nav-link is-current"' : ' class="ns-nav-link"'; };
 return '<div class="ns-nav-links">' +
 '<a href="' + actorsHref + '"' + on(ctx.section === 'home' ? 'home' : 'actors').replace('is-current', (ctx.section === 'home' || ctx.section === 'actors') ? 'is-current' : '') + '>' + esc(t.actors) + '</a>' +
 '<a href="' + tutorialsHubUrl(ctx.currentLang) + '"' + on('tutorials') + '>' + esc(t.tutorials) + '</a>' +
 '<a href="/templates/"' + on('templates') + '>' + esc(t.templates) + '</a>' +
 '</div>';
 }

 function searchButton(t) {
 return '<button class="ns-search-trigger" data-ns-search-open aria-label="' + esc(t.search) + '">' +
 '<span class="ns-search-icon">\u2315</span>' +
 '<span class="ns-search-label">' + esc(t.search) + '</span>' +
 '<span class="ns-kbd">\u2318K</span></button>';
 }

 function breadcrumb(el, ctx, t) {
 var section = el.getAttribute('data-crumb-section');
 var title = el.getAttribute('data-crumb-title');
 if (!title) return '';
 var parts = ['<a href="' + homeUrl(ctx.currentLang) + '">' + esc(t.home) + '</a>'];
 if (ctx.section === 'actors') parts.push('<a href="' + homeUrl(ctx.currentLang) + '">' + esc(t.actors) + '</a>');
 if (ctx.section === 'tutorials') parts.push('<a href="' + tutorialsHubUrl(ctx.currentLang) + '">' + esc(t.tutorials) + '</a>');
 if (ctx.section === 'templates') parts.push('<a href="/templates/">' + esc(t.templates) + '</a>');
 if (section) parts.push('<span>' + esc(section) + '</span>');
 parts.push('<span class="current">' + esc(title) + '</span>');
 return '<nav class="ns-crumb" aria-label="Breadcrumb">' + parts.join('<span class="sep">/</span>') + '</nav>';
 }

 // ==========================================================================
 // HEADER
 // ==========================================================================

 function renderHeader() {
 var el = document.getElementById('site-header');
 if (!el) return;
 var ctx = detectContext();
 var t = T[ctx.currentLang] || T.en;
 var isHome = ctx.section === 'home';

 if (isHome) {
 // Homepage keeps the large centred logo; links sit above it.
 el.innerHTML =
 '<nav class="ns-nav ns-nav-home-bar">' +
 navLinks(ctx, t) +
 '<div class="ns-nav-right">' +
 langDropdown(ctx, t) +
 '<a class="ns-btn-primary" href="/actors/">' + esc(t.actors) + '</a>' +
 '<button class="ns-icon-btn ns-only-sm" data-ns-search-open aria-label="' + esc(t.search) + '">\u2315</button>' +
 '</div>' +
 '</nav>';
 } else {
 el.innerHTML =
 '<nav class="ns-nav">' +
 '<a href="' + homeUrl(ctx.currentLang) + '" class="ns-logo">' +
 '<img src="/nanoscrape_logo_square.png" alt="NanoScrape" class="ns-logo-icon" width="28" height="28">' +
 '<span class="ns-logo-text">NanoScrape</span>' +
 '</a>' +
 navLinks(ctx, t) +
 '<div class="ns-nav-right">' +
 searchButton(t) +
 '<button class="ns-icon-btn ns-only-sm" data-ns-search-open aria-label="' + esc(t.search) + '">\u2315</button>' +
 langDropdown(ctx, t) +
 '</div>' +
 '</nav>' +
 breadcrumb(el, ctx, t);
 }

 var trigger = el.querySelector('.ns-lang-trigger');
 var dropdown = el.querySelector('.ns-lang-dropdown');
 if (trigger && dropdown) {
 trigger.addEventListener('click', function (e) {
 e.stopPropagation();
 var open = dropdown.classList.toggle('open');
 trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
 });
 }
 }

 // ==========================================================================
 // FOOTER
 // ==========================================================================

 function renderFooter() {
 var el = document.getElementById('site-footer');
 if (!el) return;
 var ctx = detectContext();
 var t = T[ctx.currentLang] || T.en;
 var home = homeUrl(ctx.currentLang);

 var langLinks = '';
 for (var i = 0; i < LANGUAGES.length; i++) {
 var l = LANGUAGES[i];
 langLinks += '<a href="' + buildLangUrl(l.code, ctx.actorSlug, ctx.isActorPage, ctx.isTutorialDetail, ctx.section) + '"' +
 (l.code === ctx.currentLang ? ' class="active"' : '') + '>' + l.triggerLabel + '</a>';
 }

 el.innerHTML =
 '<footer class="ns-footer">' +
 '<div class="ns-footer-grid">' +
 '<div class="ns-footer-brand">' +
 '<img src="/nanoscrape_logo.svg" alt="NanoScrape" class="ns-footer-logo" width="140" height="30">' +
 '<p>' + esc(t.tagline) + '</p>' +
 '<div class="ns-footer-langs" aria-label="' + esc(t.lang) + '">' + langLinks + '</div>' +
 '</div>' +
 '<div class="ns-footer-col"><h4>' + esc(t.colActors) + '</h4>' +
 '<a href="/actors/">' + esc(t.allActors) + '</a>' +
 '<a href="/actors/job-scrapers/">Job scrapers</a>' +
 '<a href="/actors/directories/">Business directories</a>' +
 '<a href="/actors/social/">Social media</a>' +
 '<a href="/actors/ecommerce/">Ecommerce</a>' +
 '<a href="/actors/enrichment/">Enrichment</a>' +
 '</div>' +
 '<div class="ns-footer-col"><h4>' + esc(t.colLearn) + '</h4>' +
 '<a href="' + tutorialsHubUrl(ctx.currentLang) + '">' + esc(t.allTutorials) + '</a>' +
 '<a href="/tutorials/scrape-google-maps-with-n8n/">Google Maps with n8n</a>' +
 '<a href="/tutorials/instagram-scraper/">Instagram scraping</a>' +
 '<a href="/tutorials/google-maps-reviews-scraper/">Google Maps reviews</a>' +
 '<a href="/job-market-index/">Job Market Index</a>' +
 '</div>' +
 '<div class="ns-footer-col"><h4>' + esc(t.colBuild) + '</h4>' +
 '<a href="/templates/">' + esc(t.allTemplates) + '</a>' +
 '<a href="/templates/#n8n">n8n</a>' +
 '<a href="/templates/#make">Make</a>' +
 '<a href="/templates/#zapier">Zapier</a>' +
 '</div>' +
 '<div class="ns-footer-col"><h4>' + esc(t.colCompany) + '</h4>' +
 '<a href="/about/">About</a>' +
 '<a href="https://github.com/NanoScrape" target="_blank" rel="noopener">GitHub \u2197</a>' +
 '<a href="mailto:contact@nanoscrape.com">contact@nanoscrape.com</a>' +
 '<a href="/impressum/">Impressum</a>' +
 '<a href="/datenschutz/">Datenschutz</a>' +
 '<a href="/legal/">Legal &amp; Terms</a>' +
 '</div>' +
 '</div>' +
 '<div class="ns-footer-legal"><span>\u00A9 ' + new Date().getFullYear() + ' NanoScrape</span><span>' + esc(t.legal) + '</span></div>' +
 '</footer>';
 }

 // ==========================================================================
 // STYLES
 // ==========================================================================

 function injectStyles() {
 if (document.getElementById('ns-component-styles')) return;
 var s = document.createElement('style');
 s.id = 'ns-component-styles';
 s.textContent = [
 /* tokens already exist on every page: --bg --surface --border --text --muted --accent */
 '.ns-nav{display:flex;align-items:center;gap:20px;max-width:1060px;margin:0 auto;padding:14px 20px}',
 '.ns-nav-home-bar{max-width:1060px}',
 '.ns-logo{display:flex;align-items:center;gap:10px;color:#dce8f5;font-weight:700;text-decoration:none;flex-shrink:0}',
 '.ns-logo:hover{text-decoration:none}',
 '.ns-logo-icon{height:28px;width:28px;border-radius:4px}',
 '.ns-logo-text{font-size:1.05rem;font-weight:700;color:#dce8f5;letter-spacing:-0.5px}',
 '.ns-nav-links{display:flex;align-items:center;gap:18px}',
 '.ns-nav-link{color:#7a99ba;font-size:0.88rem;font-weight:500;text-decoration:none;white-space:nowrap}',
 '.ns-nav-link:hover{color:#dce8f5;text-decoration:none}',
 '.ns-nav-link.is-current{color:#dce8f5;font-weight:600;padding-bottom:2px;border-bottom:2px solid #0047ff}',
 '.ns-nav-right{display:flex;align-items:center;gap:12px;margin-left:auto}',
 '.ns-btn-primary{background:#0047ff;color:#fff;padding:0 15px;height:40px;border-radius:8px;font-weight:700;font-size:0.84rem;display:flex;align-items:center;white-space:nowrap;flex-shrink:0;text-decoration:none}',
 '.ns-btn-primary:hover{opacity:.9;text-decoration:none}',
 '.ns-search-trigger{display:flex;align-items:center;gap:10px;background:#0e1118;border:1px solid #1a1f2e;color:#4d6480;border-radius:8px;padding:0 12px;height:40px;min-width:210px;cursor:pointer;font-size:0.84rem;font-family:inherit;flex-shrink:0;white-space:nowrap}',
 '.ns-search-trigger:hover{border-color:#0047ff}',
 '.ns-search-label{flex:1;text-align:left}',
 '.ns-kbd{border:1px solid #1a1f2e;padding:2px 6px;border-radius:4px;font-family:ui-monospace,monospace;font-size:0.66rem}',
 '.ns-icon-btn{width:44px;height:44px;border:1px solid #1a1f2e;background:none;border-radius:9px;color:#7a99ba;font-size:1.05rem;cursor:pointer;flex-shrink:0}',
 '.ns-icon-btn:hover{border-color:#0047ff;color:#dce8f5}',
 '.ns-crumb{max-width:1060px;margin:0 auto;padding:10px 20px;display:flex;align-items:center;gap:8px;font-size:0.8rem;color:#7a99ba;border-top:1px solid #1a1f2e;flex-wrap:wrap}',
 '.ns-crumb a{color:#7a99ba;text-decoration:none}.ns-crumb a:hover{color:#0047ff}',
 '.ns-crumb .sep{color:#2b3550}.ns-crumb .current{color:#dce8f5}',

 '.ns-lang-dropdown{position:relative;display:inline-block;flex-shrink:0}',
 '.ns-lang-trigger{background:none;border:1px solid #1a1f2e;color:#7a99ba;padding:0 12px;height:40px;border-radius:8px;cursor:pointer;font-size:0.84rem;display:flex;align-items:center;gap:6px;white-space:nowrap;font-family:inherit}',
 '.ns-lang-trigger:hover{border-color:#0047ff;color:#dce8f5}',
 '.ns-lang-menu{display:none;position:absolute;right:0;top:100%;margin-top:4px;background:#0e1118;border:1px solid #1a1f2e;border-radius:8px;min-width:150px;z-index:1000;overflow:hidden}',
 '.ns-lang-dropdown.open .ns-lang-menu{display:block}',
 '.ns-lang-menu a{display:block;padding:11px 16px;color:#7a99ba;font-size:0.9rem;border-bottom:1px solid #1a1f2e;text-decoration:none;white-space:nowrap}',
 '.ns-lang-menu a:last-child{border-bottom:none}',
 '.ns-lang-menu a:hover{background:#1a1f2e;color:#dce8f5;text-decoration:none}',
 '.ns-lang-menu a.active{color:#0047ff;font-weight:600}',

 '.ns-footer{border-top:1px solid #1a1f2e;padding:40px 20px 22px;background:rgba(14,17,24,.4);font-size:0.84rem}',
 '.ns-footer-grid{display:grid;grid-template-columns:1.3fr 1fr 1fr 1fr 1fr;gap:32px;max-width:1060px;margin:0 auto}',
 '.ns-footer-brand p{color:#7a99ba;font-size:0.82rem;line-height:1.65;max-width:260px;margin:12px 0 0}',
 '.ns-footer-logo{height:30px;width:auto;opacity:.85}',
 '.ns-footer-langs{display:flex;gap:8px;margin-top:16px;flex-wrap:wrap}',
 '.ns-footer-langs a{border:1px solid #1a1f2e;color:#7a99ba;font-size:0.76rem;padding:5px 10px;border-radius:6px;text-decoration:none;white-space:nowrap;flex-shrink:0}',
 '.ns-footer-langs a:hover{border-color:#0047ff;text-decoration:none}',
 '.ns-footer-langs a.active{color:#dce8f5;border-color:#2b3550}',
 '.ns-footer-col{display:flex;flex-direction:column;gap:8px}',
 '.ns-footer-col h4{color:#dce8f5;font-size:0.76rem;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 4px}',
 '.ns-footer-col a{color:#7a99ba;font-size:0.84rem;text-decoration:none}',
 '.ns-footer-col a:hover{color:#dce8f5;text-decoration:none}',
 '.ns-footer-legal{max-width:1060px;margin:28px auto 0;padding-top:18px;border-top:1px solid #1a1f2e;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;color:#4d6480;font-size:0.78rem}',

 '.ns-only-sm{display:none}',
 '@media (max-width:860px){',
 '.ns-search-trigger,.ns-hide-sm{display:none}',
 '.ns-only-sm{display:flex;align-items:center;justify-content:center}',
 '.ns-nav{gap:12px;padding:10px 16px;flex-wrap:wrap}',
 '.ns-nav-links{order:3;width:100%;gap:16px;overflow-x:auto;padding-bottom:2px}',
 '.ns-footer{padding:32px 20px 20px}',
 '.ns-footer-grid{grid-template-columns:1fr 1fr;gap:28px 24px}',
 '.ns-footer-brand{grid-column:1/-1;text-align:center}',
 '.ns-footer-brand p{max-width:none;margin-left:auto;margin-right:auto}',
 '.ns-footer-brand .ns-footer-logo{margin:0 auto}',
 '.ns-footer-langs{justify-content:center}',
 '}',
 '@media (max-width:480px){',
 '.ns-logo-text{font-size:0.98rem}',
 '.ns-footer{padding:28px 20px 18px}',
 '.ns-footer-grid{grid-template-columns:1fr;gap:24px;text-align:center}',
 '.ns-footer-col{align-items:center}',
 '.ns-footer-col a{padding:2px 0}',
 '.ns-footer-legal{margin-top:22px;padding-top:16px;flex-direction:column;align-items:center;text-align:center;gap:6px}',
 '}'
 ].join('');
 document.head.appendChild(s);
 }

 document.addEventListener('click', function () {
 var open = document.querySelectorAll('.ns-lang-dropdown.open');
 for (var i = 0; i < open.length; i++) open[i].classList.remove('open');
 });

 // Actor pages: most actors only have some of the DE/FR/ZH pages, so the
 // language links (header menu + footer) are checked with a HEAD request and
 // removed when that language page does not exist (instead of linking a 404).
 function hideMissingActorLangs() {
 var ctx = detectContext();
 if (!ctx.isActorPage || !ctx.actorSlug || !window.fetch) return;
 var links = document.querySelectorAll('.ns-lang-menu a, .ns-footer-langs a');
 var byHref = {};
 for (var i = 0; i < links.length; i++) {
 var href = links[i].getAttribute('href');
 if (links[i].classList.contains('active') || href === '/actors/' + ctx.actorSlug + '/') continue;
 (byHref[href] = byHref[href] || []).push(links[i]);
 }
 Object.keys(byHref).forEach(function (href) {
 fetch(href, { method: 'HEAD' }).then(function (res) {
 if (res.ok) return;
 byHref[href].forEach(function (a) { if (a.parentNode) a.parentNode.removeChild(a); });
 }).catch(function () {});
 });
 }


 // ==========================================================================
 // ASK AI ROW (actor pages, tutorials, templates)
 // ==========================================================================
 // "Copy as Markdown / Ask ChatGPT / Ask Claude / Ask Google AI", same row as
 // the JobFeed docs. The Markdown is built from the page's own main content at
 // click time, so nothing is written per page.

 var ASK = {
 en: { copy: 'Copy as Markdown', copied: 'Copied', failed: 'Copy failed', gpt: 'Ask ChatGPT', claude: 'Ask Claude', google: 'Ask Google AI', label: 'Use this page with AI',
 actor: 'Read {url} and explain how to use the {name} on Apify for my use case: which inputs to set, what the output contains and what a run costs.',
 tutorial: 'Read {url} and walk me through the tutorial "{name}" step by step, then help me adapt it to my use case.',
 templates: 'Read {url} and help me pick the right NanoScrape template for my workflow.' },
 de: { copy: 'Als Markdown kopieren', copied: 'Kopiert', failed: 'Kopieren fehlgeschlagen', gpt: 'ChatGPT fragen', claude: 'Claude fragen', google: 'Google KI fragen', label: 'Diese Seite mit KI nutzen',
 actor: 'Lies {url} und erkläre mir, wie ich {name} auf Apify für meinen Anwendungsfall nutze: welche Eingaben ich setze, was die Ausgabe enthält und was ein Lauf kostet. Antworte auf Deutsch.',
 tutorial: 'Lies {url} und führe mich Schritt für Schritt durch das Tutorial „{name}“. Hilf mir danach, es an meinen Anwendungsfall anzupassen. Antworte auf Deutsch.',
 templates: 'Lies {url} und hilf mir, die passende NanoScrape-Vorlage für meinen Workflow zu finden. Antworte auf Deutsch.' },
 fr: { copy: 'Copier en Markdown', copied: 'Copié', failed: 'Échec de la copie', gpt: 'Demander à ChatGPT', claude: 'Demander à Claude', google: 'Demander à Google IA', label: 'Utiliser cette page avec une IA',
 actor: 'Lis {url} et explique-moi comment utiliser {name} sur Apify pour mon cas d’usage : quelles entrées définir, ce que contient la sortie et ce que coûte une exécution. Réponds en français.',
 tutorial: 'Lis {url} et guide-moi étape par étape dans le tutoriel « {name} », puis aide-moi à l’adapter à mon cas d’usage. Réponds en français.',
 templates: 'Lis {url} et aide-moi à choisir le bon modèle NanoScrape pour mon workflow. Réponds en français.' },
 zh: { copy: '复制为 Markdown', copied: '已复制', failed: '复制失败', gpt: '问 ChatGPT', claude: '问 Claude', google: '问 Google AI', label: '用 AI 使用本页',
 actor: '阅读 {url}，并解释如何在 Apify 上针对我的用例使用 {name}：需要设置哪些输入、输出包含什么、每次运行的费用是多少。请用中文回答。',
 tutorial: '阅读 {url}，一步步带我完成教程“{name}”，然后帮我把它应用到我的用例。请用中文回答。',
 templates: '阅读 {url}，帮我为我的工作流选择合适的 NanoScrape 模板。请用中文回答。' }
 };
 var ACTOR_HUBS = { 'job-scrapers': 1, directories: 1, marketplaces: 1, social: 1, ecommerce: 1, enrichment: 1, tools: 1, 'real-estate': 1, reviews: 1, 'search-news': 1, switzerland: 1, germany: 1, austria: 1, usa: 1, uk: 1, 'job-boards': 1 };

 function mdInline(node) {
 var out = '';
 for (var c = node.firstChild; c; c = c.nextSibling) out += mdNode(c, true);
 return out;
 }
 function mdNode(n, inline) {
 if (n.nodeType === 3) return n.nodeValue.replace(/\s+/g, ' ');
 if (n.nodeType !== 1) return '';
 var tag = n.tagName.toLowerCase();
 if (/^(script|style|svg|button|noscript|template|iframe|form|input|select|textarea|nav)$/.test(tag)) return '';
 if (n.classList.contains('ns-askai') || n.classList.contains('copy-btn') || n.getAttribute('aria-hidden') === 'true') return '';
 if (n.classList.contains('lang-panel') && !n.classList.contains('is-active')) return '';
 if (n.classList.contains('spec') && n.querySelector('.label') && n.querySelector('.value')) return '\n- **' + n.querySelector('.label').textContent.trim() + ':** ' + n.querySelector('.value').textContent.trim() + '\n';
 var txt;
 switch (tag) {
 case 'br': return '\n';
 case 'strong': case 'b': txt = mdInline(n).trim(); return txt ? '**' + txt + '**' : '';
 case 'em': case 'i': txt = mdInline(n).trim(); return txt ? '_' + txt + '_' : '';
 case 'code': return n.parentNode && n.parentNode.tagName === 'PRE' ? n.textContent : '`' + n.textContent + '`';
 case 'a':
 txt = mdInline(n).trim();
 var href = n.getAttribute('href');
 if (!txt) return '';
 if (!href || href.charAt(0) === '#' || /^javascript:/i.test(href)) return txt;
 return '[' + txt + '](' + n.href + ')';
 case 'img': return n.getAttribute('alt') ? '![' + n.getAttribute('alt') + '](' + n.src + ')' : '';
 }
 if (inline && !/^(div|p|ul|ol|li|table|pre|h[1-6]|section|article|blockquote|details|figure|dl)$/.test(tag)) return mdInline(n);
 switch (tag) {
 case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
 return '\n\n' + '######'.slice(0, +tag.charAt(1)) + ' ' + mdInline(n).trim() + '\n\n';
 case 'p': case 'summary': case 'dt': case 'dd': return '\n\n' + mdInline(n).trim() + '\n\n';
 case 'pre': return '\n\n```\n' + n.textContent.replace(/\n+$/, '') + '\n```\n\n';
 case 'blockquote': return '\n\n' + mdBlocks(n).trim().replace(/^/gm, '> ') + '\n\n';
 case 'ul': case 'ol':
 var items = [], k = 0;
 for (var c = n.firstChild; c; c = c.nextSibling) {
 if (c.nodeType !== 1 || c.tagName !== 'LI') continue;
 k++;
 var body = mdBlocks(c).trim().replace(/\n{2,}/g, '\n').replace(/\n/g, '\n   ');
 items.push((tag === 'ol' ? k + '. ' : '- ') + body);
 }
 return '\n\n' + items.join('\n') + '\n\n';
 case 'table':
 var rows = n.querySelectorAll('tr'), lines = [];
 for (var r = 0; r < rows.length; r++) {
 var cells = rows[r].querySelectorAll('th,td'), vals = [];
 for (var j = 0; j < cells.length; j++) vals.push(mdInline(cells[j]).trim().replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' '));
 lines.push('| ' + vals.join(' | ') + ' |');
 if (r === 0) lines.push('|' + vals.map(function () { return ' --- '; }).join('|') + '|');
 }
 return '\n\n' + lines.join('\n') + '\n\n';
 }
 return '\n' + mdBlocks(n) + '\n';
 }
 function mdBlocks(node) {
 var out = '', run = '';
 for (var c = node.firstChild; c; c = c.nextSibling) {
 var isInline = c.nodeType === 3 || (c.nodeType === 1 && /^(a|span|strong|b|em|i|code|br|img|small|sup|sub|abbr|time|mark|label)$/i.test(c.tagName));
 if (isInline) { run += mdNode(c, true); continue; }
 if (run.trim()) out += '\n\n' + run.trim() + '\n\n';
 run = '';
 out += mdNode(c, false);
 }
 if (run.trim()) out += '\n\n' + run.trim() + '\n\n';
 return out;
 }
 function pageMarkdown(root, title) {
 var md = mdBlocks(root).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
 var url = location.origin + location.pathname;
 if (md.indexOf('# ') !== 0) md = '# ' + title + '\n\n' + md;
 return md.replace(/^(# [^\n]*\n)/, '$1\nSource: ' + url + '\n') + '\n';
 }

 function copyText(text) {
 if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
 return new Promise(function (resolve, reject) {
 var ta = document.createElement('textarea');
 ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.top = '-1000px';
 document.body.appendChild(ta); ta.select();
 var ok = false;
 try { ok = document.execCommand('copy'); } catch (e) {}
 document.body.removeChild(ta);
 ok ? resolve() : reject();
 });
 }

 function renderAskAi() {
 var ctx = detectContext();
 var kind = null, root = null;
 if (ctx.isActorPage && !ACTOR_HUBS[ctx.actorSlug]) { kind = 'actor'; root = document.querySelector('.detail'); }
 else if (ctx.isTutorialDetail) { kind = 'tutorial'; root = document.querySelector('article.article'); }
 else if (ctx.section === 'templates') { kind = 'templates'; root = document.querySelector('main.hub') || document.querySelector('main'); }
 if (!root) return;
 var h1 = root.querySelector('h1');
 if (!h1) return;
 var anchor = root.querySelector('.ctas, .meta-row') || h1;
 var a = ASK[ctx.currentLang] || ASK.en;
 var name = h1.textContent.replace(/\s+/g, ' ').trim();
 if (kind === 'actor') {
 var ld = document.querySelectorAll('script[type="application/ld+json"]');
 for (var i = 0; i < ld.length; i++) {
 try {
 var j = JSON.parse(ld[i].textContent), list = [].concat(j['@graph'] || j);
 for (var k = 0; k < list.length; k++) if (/SoftwareApplication|Product/.test(list[k]['@type']) && list[k].name) { name = list[k].name; i = ld.length; break; }
 } catch (e) {}
 }
 }
 var url = location.origin + location.pathname;
 var prompt = a[kind].replace('{url}', url).replace('{name}', name);
 var q = encodeURIComponent(prompt);
 var ICON = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
 var row = document.createElement('div');
 row.className = 'ns-askai';
 row.setAttribute('role', 'group');
 row.setAttribute('aria-label', a.label);
 row.innerHTML =
 '<button type="button" class="ns-askai-btn" data-askai-copy>' + ICON + '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>' + esc(a.copy) + '</span></button>' +
 '<a class="ns-askai-btn" target="_blank" rel="noopener noreferrer" href="https://chatgpt.com/?hint=search&amp;q=' + q + '">' + ICON + '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' + esc(a.gpt) + '</a>' +
 '<a class="ns-askai-btn" target="_blank" rel="noopener noreferrer" href="https://claude.ai/new?q=' + q + '">' + ICON + '<path d="m12 3 1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z"/></svg>' + esc(a.claude) + '</a>' +
 '<a class="ns-askai-btn" target="_blank" rel="noopener noreferrer" href="https://www.google.com/search?udm=50&amp;q=' + q + '">' + ICON + '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' + esc(a.google) + '</a>' +
 '<span class="ns-askai-status" role="status" aria-live="polite"></span>';
 anchor.parentNode.insertBefore(row, anchor.nextSibling);
 var btn = row.querySelector('[data-askai-copy]'), label = btn.querySelector('span'), status = row.querySelector('.ns-askai-status');
 btn.addEventListener('click', function () {
 copyText(pageMarkdown(root, name)).then(function () { label.textContent = a.copied; status.textContent = a.copied; },
 function () { label.textContent = a.failed; status.textContent = a.failed; });
 setTimeout(function () { label.textContent = a.copy; status.textContent = ''; }, 2500);
 });
 var st = document.createElement('style');
 st.textContent = '.ns-askai{display:flex;flex-wrap:wrap;align-items:center;gap:8px 20px;margin:-16px 0 32px;font-size:0.84rem}' +
 '.ns-askai-btn{display:inline-flex;align-items:center;gap:6px;min-height:32px;background:none;border:0;padding:0;color:#7a99ba;font:inherit;font-size:0.84rem;cursor:pointer;text-decoration:none}' +
 '.ns-askai-btn:hover,.ns-askai-btn:focus-visible{color:#dce8f5;text-decoration:none}' +
 '.ns-askai-btn:focus-visible{outline:2px solid #0047ff;outline-offset:2px;border-radius:4px}' +
 '.ns-askai-status{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}' +
 '.meta-row + .ns-askai,h1 + .ns-askai{margin:0 0 28px}';
 document.head.appendChild(st);
 }

 // ==========================================================================
 // PHONE WIDTH: wide tables scroll inside their own box, not the whole page
 // ==========================================================================

 function wrapTables() {
 var tables = document.querySelectorAll('table.compare-table, .detail table, article.article table');
 for (var i = 0; i < tables.length; i++) {
 var t = tables[i];
 if (t.parentNode.classList && t.parentNode.classList.contains('ns-table-scroll')) continue;
 var box = document.createElement('div');
 box.className = 'ns-table-scroll';
 box.setAttribute('tabindex', '0');
 box.setAttribute('role', 'region');
 box.setAttribute('aria-label', (t.querySelector('th') || {}).textContent || 'Table');
 t.parentNode.insertBefore(box, t);
 box.appendChild(t);
 }
 var st = document.createElement('style');
 st.textContent = '.ns-table-scroll{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-bottom:32px}' +
 '.ns-table-scroll>table{margin-bottom:0}' +
 '.ns-table-scroll:focus-visible{outline:2px solid #0047ff;outline-offset:2px;border-radius:4px}' +
 '.ns-table-scroll th:first-child,.ns-table-scroll td:first-child{position:sticky;left:0;z-index:1;background:var(--bg,#080a10);box-shadow:1px 0 0 var(--border,#1a1f2e)}' +
 '@media (max-width:480px){.detail .specs{grid-template-columns:repeat(2,minmax(0,1fr))}.detail .spec{overflow-wrap:anywhere}}';
 document.head.appendChild(st);
 }

 injectStyles();
 renderHeader();
 renderFooter();
 hideMissingActorLangs();
 renderAskAi();
 wrapTables();

 window.NanoScrapeComponents = { languages: LANGUAGES, strings: T, detectContext: detectContext, homeUrl: homeUrl };
})();
