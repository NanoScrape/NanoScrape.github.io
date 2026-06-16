/**
 * NanoScrape — Reusable Header + Footer + Language Switcher
 *
 * Usage: Add to every page:
 *   <div id="site-header"></div>
 *   ... page content ...
 *   <div id="site-footer"></div>
 *   <script src="/components.js"></script>
 */

(function() {
  'use strict';

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  const LANGUAGES = [
    { code: 'en', label: 'English', triggerLabel: 'EN', prefix: '' },
    { code: 'de', label: 'Deutsch', triggerLabel: 'DE', prefix: 'de' },
    { code: 'zh', label: '中文', triggerLabel: '中文', prefix: 'zh' },
    { code: 'fr', label: 'Français', triggerLabel: 'FR', prefix: 'fr' },
  ];

  const APIFY_PROFILES = {
    main: 'https://apify.com/santamaria-automations?fpr=0khfbz',
    org: 'https://apify.com/nanoscrape?fpr=0khfbz',
  };

  // ============================================================================
  // PATH DETECTION
  // ============================================================================

  function detectContext() {
    const path = window.location.pathname;

    // Detect language from path
    let currentLang = 'en';
    for (const lang of LANGUAGES) {
      if (lang.prefix && (path === '/' + lang.prefix + '/' || path.includes('/' + lang.prefix + '/'))) {
        // Check it's a language prefix, not part of an actor slug
        const actorMatch = path.match(/^\/actors\/([^\/]+)\//);
        if (actorMatch) {
          // On actor page — check if lang prefix comes AFTER slug
          if (path.match(new RegExp('/actors/[^/]+/' + lang.prefix + '/'))) {
            currentLang = lang.code;
            break;
          }
        } else {
          // Homepage variant
          if (path === '/' + lang.prefix + '/' || path === '/' + lang.prefix) {
            currentLang = lang.code;
            break;
          }
        }
      }
    }

    // Detect if on an actor page
    const actorMatch = path.match(/\/actors\/([^\/]+)/);
    const actorSlug = actorMatch ? actorMatch[1] : null;
    const isActorPage = !!actorSlug;

    return { currentLang, actorSlug, isActorPage, path };
  }

  function buildLangUrl(targetLang, actorSlug, isActorPage) {
    const lang = LANGUAGES.find(l => l.code === targetLang);
    if (!lang) return '/';

    if (isActorPage && actorSlug) {
      return targetLang === 'en'
        ? '/actors/' + actorSlug + '/'
        : '/actors/' + actorSlug + '/' + lang.prefix + '/';
    } else {
      return targetLang === 'en' ? '/' : '/' + lang.prefix + '/';
    }
  }

  function getHomepageUrl(langCode) {
    const lang = LANGUAGES.find(l => l.code === langCode);
    return lang && lang.prefix ? '/' + lang.prefix + '/' : '/';
  }

  // ============================================================================
  // HEADER
  // ============================================================================

  function renderHeader() {
    var el = document.getElementById('site-header');
    if (!el) return;

    var ctx = detectContext();
    var currentLangObj = LANGUAGES.find(function(l) { return l.code === ctx.currentLang; });
    var isHomepage = !ctx.isActorPage;

    // Language dropdown HTML
    var menuItems = '';
    for (var i = 0; i < LANGUAGES.length; i++) {
      var lang = LANGUAGES[i];
      var url = buildLangUrl(lang.code, ctx.actorSlug, ctx.isActorPage);
      var activeClass = lang.code === ctx.currentLang ? ' class="active"' : '';
      menuItems += '<a href="' + url + '"' + activeClass + '>' + lang.label + '</a>';
    }

    var triggerLabel = currentLangObj ? currentLangObj.triggerLabel : 'EN';

    var dropdownHtml =
      '<div class="ns-lang-dropdown">' +
        '<button class="ns-lang-trigger" aria-label="Language">\uD83C\uDF10 ' + triggerLabel + ' \u25BE</button>' +
        '<div class="ns-lang-menu">' + menuItems + '</div>' +
      '</div>';

    if (isHomepage) {
      // Homepage: centered SVG logo (includes tagline), larger, dropdown absolute top-right
      el.innerHTML =
        '<nav class="ns-nav ns-nav-home">' +
          dropdownHtml +
          '<a href="' + getHomepageUrl(ctx.currentLang) + '" class="ns-logo ns-logo-home">' +
            '<img src="/nanoscrape_logo.svg" alt="NanoScrape — Lightweight Web Scraping Actors">' +
          '</a>' +
        '</nav>';
    } else {
      // Actor page: square PNG icon + "NanoScrape" text, left-aligned
      var backLabels = { en: '\u2190 All actors', de: '\u2190 Alle Aktoren', zh: '\u2190 \u6240\u6709\u5DE5\u5177', fr: '\u2190 Tous les acteurs' };
      var backUrl = getHomepageUrl(ctx.currentLang);
      var backLink = '<a href="' + backUrl + '" class="nav-back">' + (backLabels[ctx.currentLang] || backLabels.en) + '</a>';

      el.innerHTML =
        '<nav class="ns-nav">' +
          '<a href="' + getHomepageUrl(ctx.currentLang) + '" class="ns-logo">' +
            '<img src="/nanoscrape_logo_square.png" alt="NanoScrape" class="ns-logo-icon">' +
            '<span class="ns-logo-text">NanoScrape</span>' +
          '</a>' +
          '<div class="ns-nav-right">' +
            backLink +
            dropdownHtml +
          '</div>' +
        '</nav>';
    }

    // Dropdown toggle
    var trigger = el.querySelector('.ns-lang-trigger');
    var dropdown = el.querySelector('.ns-lang-dropdown');
    if (trigger && dropdown) {
      trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });
    }
  }

  // ============================================================================
  // FOOTER
  // ============================================================================

  function renderFooter() {
    const el = document.getElementById('site-footer');
    if (!el) return;

    el.innerHTML =
      '<footer class="ns-footer">' +
        '<img src="/nanoscrape_logo.svg" alt="NanoScrape" class="ns-footer-logo">' +
        '<p>' +
          '<a href="' + APIFY_PROFILES.main + '" target="_blank" rel="noopener">Apify Store</a> · ' +
          '<a href="' + APIFY_PROFILES.org + '" target="_blank" rel="noopener">NanoScrape Org</a> · ' +
          '<a href="https://github.com/NanoScrape" target="_blank" rel="noopener">GitHub</a> · ' +
          '<a href="mailto:contact@nanoscrape.com">contact@nanoscrape.com</a>' +
        '</p>' +
      '</footer>';
  }

  // ============================================================================
  // STYLES (injected once)
  // ============================================================================

  function injectStyles() {
    if (document.getElementById('ns-component-styles')) return;

    const style = document.createElement('style');
    style.id = 'ns-component-styles';
    style.textContent =
      '.ns-nav { display: flex; align-items: center; justify-content: space-between; max-width: 1060px; margin: 0 auto; padding: 14px 20px; }' +
      '.ns-logo { display: flex; align-items: center; gap: 10px; color: #dce8f5; font-weight: 700; text-decoration: none; }' +
      '.ns-logo:hover { text-decoration: none; }' +
      '.ns-logo-icon { height: 28px; width: 28px; border-radius: 4px; }' +
      '.ns-logo-text { font-family: Arial, sans-serif; font-size: 1.1rem; font-weight: 700; color: #dce8f5; letter-spacing: -0.5px; }' +
      '.ns-nav-right { display: flex; align-items: center; gap: 16px; }' +
      '.nav-back { color: #7a99ba; font-size: 0.85rem; text-decoration: none; }' +
      '.nav-back:hover { color: #0047ff; }' +

      /* Homepage nav: centered SVG logo with tagline visible */
      '.ns-nav-home { justify-content: center; position: relative; padding: 20px; z-index: 10; }' +
      '.ns-logo-home { display: flex; justify-content: center; }' +
      '.ns-logo-home img { height: 70px; width: auto; }' +
      '.ns-nav-home .ns-lang-dropdown { position: absolute; right: 20px; top: 50%; transform: translateY(-50%); }' +

      '.ns-lang-dropdown { position: relative; display: inline-block; }' +
      '.ns-lang-trigger { background: none; border: 1px solid #1a1f2e; color: #7a99ba; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; min-height: 44px; display: flex; align-items: center; gap: 4px; }' +
      '.ns-lang-trigger:hover { border-color: #0047ff; color: #0047ff; }' +
      '.ns-lang-menu { display: none; position: absolute; right: 0; top: 100%; margin-top: 4px; background: #0e1118; border: 1px solid #1a1f2e; border-radius: 8px; min-width: 140px; z-index: 1000; overflow: hidden; }' +
      '.ns-lang-dropdown.open .ns-lang-menu { display: block; }' +
      '.ns-lang-menu a { display: block; padding: 10px 16px; color: #7a99ba; font-size: 0.9rem; border-bottom: 1px solid #1a1f2e; text-decoration: none; }' +
      '.ns-lang-menu a:last-child { border-bottom: none; }' +
      '.ns-lang-menu a:hover { background: #1a1f2e; color: #dce8f5; }' +
      '.ns-lang-menu a.active { color: #0047ff; font-weight: 600; }' +

      '.ns-footer { text-align: center; padding: 28px 20px; color: #7a99ba; font-size: 0.8rem; border-top: 1px solid #1a1f2e; }' +
      '.ns-footer-logo { height: 28px; margin-bottom: 8px; display: block; margin-left: auto; margin-right: auto; opacity: 0.6; }' +
      '.ns-footer a { color: #0047ff; text-decoration: none; }' +
      '.ns-footer a:hover { text-decoration: underline; }' +

      '@media (max-width: 480px) {' +
        '.ns-nav { flex-wrap: wrap; gap: 8px; }' +
        '.ns-logo-icon { height: 22px; width: 22px; }' +
        '.ns-logo-text { font-size: 0.95rem; }' +
        '.ns-logo-home img { height: 50px; }' +
        '.ns-nav-right { width: 100%; display: flex; justify-content: space-between; }' +
        '.nav-back { font-size: 0.8rem; }' +
        '.ns-lang-trigger { font-size: 0.8rem; padding: 4px 10px; }' +
      '}';

    document.head.appendChild(style);
  }

  // ============================================================================
  // INIT
  // ============================================================================

  // Close dropdown on outside click
  document.addEventListener('click', function() {
    document.querySelectorAll('.ns-lang-dropdown.open').forEach(function(d) {
      d.classList.remove('open');
    });
  });

  injectStyles();
  renderHeader();
  renderFooter();

})();
