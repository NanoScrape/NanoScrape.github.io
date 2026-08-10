/**
 * NanoScrape — Header + Footer + Language Switcher  (v2)
 *
 * Drop-in replacement for /components.js
 *
 * Usage on every page (unchanged):
 *   <div id="site-header"></div>
 *   ... page content ...
 *   <div id="site-footer"></div>
 *   <script src="/components.js"></script>
 *   <script src="/search.js"></script>      <!-- new: search palette -->
 *
 * Optional per-page breadcrumb (sub-pages only):
 *   <div id="site-header" data-crumb-section="Social media" data-crumb-title="Instagram Scraper"></div>
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
          allActors: 'All 131 actors', allTutorials: 'All tutorials', allTemplates: 'All templates',
          tagline: 'Lightweight HTTP-only scraping actors on Apify.',
          legal: 'Actors run on Apify · Pay-per-result, no monthly fee' },
    de: { actors: 'Aktoren', tutorials: 'Tutorials', templates: 'Vorlagen', search: 'Aktoren, Tutorials suchen…', store: 'Apify Store', start: 'Kostenlos starten', home: 'Start', lang: 'Sprache',
          colActors: 'Aktoren', colLearn: 'Lernen', colBuild: 'Bauen', colCompany: 'NanoScrape',
          allActors: 'Alle 131 Aktoren', allTutorials: 'Alle Tutorials', allTemplates: 'Alle Vorlagen',
          tagline: 'Leichtgewichtige HTTP-only Scraping-Aktoren auf Apify.',
          legal: 'Aktoren laufen auf Apify · Pay-per-Result, keine Monatsgebühr' },
    zh: { actors: '工具', tutorials: '教程', templates: '模板', search: '搜索工具、教程…', store: 'Apify 商店', start: '免费开始', home: '首页', lang: '语言',
          colActors: '工具', colLearn: '教程', colBuild: '模板', colCompany: 'NanoScrape',
          allActors: '全部 131 个工具', allTutorials: '全部教程', allTemplates: '全部模板',
          tagline: '在 Apify 上运行的轻量级纯 HTTP 抓取工具。',
          legal: '工具运行于 Apify · 按结果计费，无月费' },
    fr: { actors: 'Acteurs', tutorials: 'Tutoriels', templates: 'Modèles', search: 'Rechercher acteurs, tutoriels…', store: 'Apify Store', start: 'Commencer', home: 'Accueil', lang: 'Langue',
          colActors: 'Acteurs', colLearn: 'Apprendre', colBuild: 'Construire', colCompany: 'NanoScrape',
          allActors: 'Les 131 acteurs', allTutorials: 'Tous les tutoriels', allTemplates: 'Tous les modèles',
          tagline: 'Acteurs de scraping HTTP légers sur Apify.',
          legal: 'Acteurs hébergés sur Apify · Paiement au résultat, sans abonnement' }
  };

  // ==========================================================================
  // PATH DETECTION  (unchanged logic from v1)
  // ==========================================================================

  function detectContext() {
    var path = window.location.pathname;
    var currentLang = 'en';

    // Tutorials: /{lang}/tutorials/{slug}/ for non-EN, /tutorials/{slug}/ for EN.
    var tutorialLangMatch = path.match(/^\/([a-z]{2})\/tutorials\//);
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
  function tutorialsHubUrl(langCode) {
    for (var i = 0; i < LANGUAGES.length; i++) {
      if (LANGUAGES[i].code === langCode) return LANGUAGES[i].prefix ? '/' + LANGUAGES[i].prefix + '/tutorials/' : '/tutorials/';
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
            '<a class="ns-nav-link ns-hide-sm" href="' + APIFY_PROFILES.main + '" target="_blank" rel="noopener">' + esc(t.store) + ' \u2197</a>' +
            langDropdown(ctx, t) +
            '<a class="ns-btn-primary" href="' + APIFY_PROFILES.main + '" target="_blank" rel="noopener">' + esc(t.start) + '</a>' +
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
            '<a class="ns-btn-primary ns-hide-sm" href="' + APIFY_PROFILES.main + '" target="_blank" rel="noopener">' + esc(t.store) + ' \u2197</a>' +
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
            '<a href="' + home + '">' + esc(t.allActors) + '</a>' +
            '<a href="' + home + '#jobs">Job boards</a>' +
            '<a href="' + home + '#dirs">Business directories</a>' +
            '<a href="' + home + '#social">Social media</a>' +
            '<a href="' + home + '#ecom">Ecommerce</a>' +
            '<a href="' + home + '#enrichment">Enrichment</a>' +
          '</div>' +
          '<div class="ns-footer-col"><h4>' + esc(t.colLearn) + '</h4>' +
            '<a href="' + tutorialsHubUrl(ctx.currentLang) + '">' + esc(t.allTutorials) + '</a>' +
            '<a href="/tutorials/scrape-google-maps-with-n8n/">Google Maps with n8n</a>' +
            '<a href="/tutorials/instagram-scraper/">Instagram scraping</a>' +
            '<a href="/tutorials/google-maps-reviews-scraper/">Google Maps reviews</a>' +
          '</div>' +
          '<div class="ns-footer-col"><h4>' + esc(t.colBuild) + '</h4>' +
            '<a href="/templates/">' + esc(t.allTemplates) + '</a>' +
            '<a href="/templates/#n8n">n8n</a>' +
            '<a href="/templates/#make">Make</a>' +
            '<a href="/templates/#zapier">Zapier</a>' +
          '</div>' +
          '<div class="ns-footer-col"><h4>' + esc(t.colCompany) + '</h4>' +
            '<a href="' + APIFY_PROFILES.main + '" target="_blank" rel="noopener">Apify Store \u2197</a>' +
            '<a href="' + APIFY_PROFILES.org + '" target="_blank" rel="noopener">NanoScrape Org \u2197</a>' +
            '<a href="https://github.com/NanoScrape" target="_blank" rel="noopener">GitHub \u2197</a>' +
            '<a href="mailto:contact@nanoscrape.com">contact@nanoscrape.com</a>' +
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

  injectStyles();
  renderHeader();
  renderFooter();

  window.NanoScrapeComponents = { languages: LANGUAGES, strings: T, detectContext: detectContext, homeUrl: homeUrl };
})();
