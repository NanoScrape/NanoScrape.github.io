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
    main: 'https://apify.com/santamaria-automations',
    org: 'https://apify.com/nanoscrape',
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
    const el = document.getElementById('site-header');
    if (!el) return;

    const ctx = detectContext();
    const currentLangObj = LANGUAGES.find(l => l.code === ctx.currentLang);

    // Back link (only on actor pages)
    let backLink = '';
    if (ctx.isActorPage) {
      const backLabels = { en: '← All actors', de: '← Alle Aktoren', zh: '← 所有工具', fr: '← Tous les acteurs' };
      const backUrl = getHomepageUrl(ctx.currentLang);
      backLink = '<a href="' + backUrl + '" class="nav-back">' + (backLabels[ctx.currentLang] || backLabels.en) + '</a>';
    }

    // Language dropdown
    let menuItems = '';
    for (const lang of LANGUAGES) {
      const url = buildLangUrl(lang.code, ctx.actorSlug, ctx.isActorPage);
      const activeClass = lang.code === ctx.currentLang ? ' class="active"' : '';
      menuItems += '<a href="' + url + '"' + activeClass + '>' + lang.label + '</a>';
    }

    const triggerLabel = currentLangObj ? currentLangObj.triggerLabel : 'EN';

    el.innerHTML =
      '<nav class="ns-nav">' +
        '<a href="' + getHomepageUrl(ctx.currentLang) + '" class="ns-logo">' +
          '<img src="/nanoscrape_logo.svg" alt="NanoScrape" width="120" height="28"> ' +
        '</a>' +
        '<div class="ns-nav-right">' +
          backLink +
          '<div class="ns-lang-dropdown">' +
            '<button class="ns-lang-trigger" aria-label="Language">🌐 ' + triggerLabel + ' ▾</button>' +
            '<div class="ns-lang-menu">' + menuItems + '</div>' +
          '</div>' +
        '</div>' +
      '</nav>';

    // Dropdown toggle
    const trigger = el.querySelector('.ns-lang-trigger');
    const dropdown = el.querySelector('.ns-lang-dropdown');
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
      '.ns-logo { display: flex; align-items: center; gap: 8px; color: #dce8f5; font-weight: 700; text-decoration: none; }' +
      '.ns-logo img { height: 28px; }' +
      '.ns-nav-right { display: flex; align-items: center; gap: 16px; }' +
      '.nav-back { color: #7a99ba; font-size: 0.85rem; text-decoration: none; }' +
      '.nav-back:hover { color: #0047ff; }' +

      '.ns-lang-dropdown { position: relative; display: inline-block; }' +
      '.ns-lang-trigger { background: none; border: 1px solid #1a1f2e; color: #7a99ba; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; min-height: 44px; display: flex; align-items: center; gap: 4px; }' +
      '.ns-lang-trigger:hover { border-color: #0047ff; color: #0047ff; }' +
      '.ns-lang-menu { display: none; position: absolute; right: 0; top: 100%; margin-top: 4px; background: #0e1118; border: 1px solid #1a1f2e; border-radius: 8px; min-width: 140px; z-index: 100; overflow: hidden; }' +
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
        '.ns-logo img { height: 22px; }' +
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
