/**
 * NanoScrape — client-side search palette  (new file: /search.js)
 *
 * Load after components.js on every page:
 *   <script src="/components.js"></script>
 *   <script src="/search.js"></script>
 *
 * Opens on: ⌘K / Ctrl+K, "/" (when not typing), any [data-ns-search-open] button,
 * and any input with [data-ns-search-input] (the homepage hero field).
 *
 * Index: /search-index.json — fetched lazily on first open, cached in memory
 * plus sessionStorage. Nothing is fetched for visitors who never search.
 * No URL is ever constructed here: every result navigates to its own `url`.
 */

(function () {
  'use strict';

  var INDEX_URL = '/search-index.json';
  var CACHE_KEY = 'ns-search-index-v1';
  var GROUPS = [
    { type: 'actor', label: { en: 'Actors', de: 'Aktoren', zh: '工具', fr: 'Acteurs' } },
    { type: 'tutorial', label: { en: 'Tutorials', de: 'Tutorials', zh: '教程', fr: 'Tutoriels' } },
    { type: 'template', label: { en: 'Templates', de: 'Vorlagen', zh: '模板', fr: 'Modèles' } },
    { type: 'category', label: { en: 'Categories & countries', de: 'Kategorien & Länder', zh: '分类与国家', fr: 'Catégories et pays' } }
  ];
  var CAP = 4;              // results shown per group
  var lang = (window.NanoScrapeComponents && window.NanoScrapeComponents.detectContext().currentLang) || 'en';

  var index = null, loading = false, root = null, input = null, list = null;
  var results = [], active = 0, open = false;

  // ---------------------------------------------------------------- data ----

  function loadIndex(cb) {
    if (index) return cb(index);
    try {
      var cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) { index = JSON.parse(cached); return cb(index); }
    } catch (e) {}
    if (loading) return;
    loading = true;
    fetch(INDEX_URL, { credentials: 'omit' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        index = data.items || data;
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(index)); } catch (e) {}
        loading = false;
        cb(index);
      })
      .catch(function () { loading = false; index = []; cb(index); });
  }

  // Every whitespace-separated word must appear somewhere in the haystack, so
  // "jobs germany" and "n8n sheets" both work. Name matches rank first.
  function search(q) {
    var s = q.trim().toLowerCase();
    if (!s || !index) return [];
    var words = s.split(/\s+/);
    var hits = [];
    for (var i = 0; i < index.length; i++) {
      var it = index[i];
      var name = (it.name || '').toLowerCase();
      var hay = name + ' ' + (it.meta || '').toLowerCase() + ' ' + (it.keywords || '').toLowerCase();
      var all = true;
      for (var w = 0; w < words.length; w++) if (hay.indexOf(words[w]) === -1) { all = false; break; }
      if (!all) continue;
      hits.push({ item: it, score: (name.indexOf(words[0]) === 0 ? 0 : (name.indexOf(words[0]) > -1 ? 1 : 2)) });
    }
    hits.sort(function (a, b) { return a.score - b.score; });

    var out = [];
    for (var g = 0; g < GROUPS.length; g++) {
      var group = GROUPS[g], items = [];
      for (var h = 0; h < hits.length; h++) if (hits[h].item.type === group.type) items.push(hits[h].item);
      if (items.length) out.push({ label: group.label[lang] || group.label.en, total: items.length, items: items.slice(0, CAP) });
    }
    return out;
  }

  // ---------------------------------------------------------------- view ----

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function build() {
    if (root) return;
    root = document.createElement('div');
    root.className = 'ns-pal';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.innerHTML =
      '<div class="ns-pal-box">' +
        '<div class="ns-pal-head"><span class="ns-pal-icon">\u2315</span>' +
        '<input class="ns-pal-input" type="search" autocomplete="off" spellcheck="false" aria-label="Search">' +
        '<button class="ns-pal-esc" type="button">Esc</button></div>' +
        '<div class="ns-pal-list" role="listbox"></div>' +
        '<div class="ns-pal-foot"><span>\u2191\u2193</span><span>\u21B5 open</span><span class="ns-pal-count"></span></div>' +
      '</div>';
    document.body.appendChild(root);
    input = root.querySelector('.ns-pal-input');
    list = root.querySelector('.ns-pal-list');

    root.addEventListener('click', function (e) { if (e.target === root) close(); });
    root.querySelector('.ns-pal-esc').addEventListener('click', close);
    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') { var a = flat()[active]; if (a) window.location.href = a.url; }
      else if (e.key === 'Escape') close();
    });
  }

  function flat() {
    var out = [];
    for (var i = 0; i < results.length; i++) for (var j = 0; j < results[i].items.length; j++) out.push(results[i].items[j]);
    return out;
  }

  function move(d) {
    var n = flat().length; if (!n) return;
    active = (active + d + n) % n;
    paint();
  }

  function render(q) {
    results = search(q);
    active = 0;
    var empty = q.trim() && !flat().length;
    if (empty) {
      list.innerHTML = '<div class="ns-pal-empty"><strong>No match for \u201C' + esc(q.trim()) + '\u201D</strong>' +
        '<span>Need this target scraped? <a href="mailto:contact@nanoscrape.com?subject=Actor%20request">Request an actor</a>.</span></div>';
    } else if (!q.trim()) {
      list.innerHTML = '<div class="ns-pal-hint">Search 131 actors, tutorials and templates \u2014 try \u201Cinstagram\u201D, \u201Cjobs germany\u201D, \u201Cn8n\u201D.</div>';
    } else {
      var html = '', n = 0;
      for (var g = 0; g < results.length; g++) {
        html += '<div class="ns-pal-group"><div class="ns-pal-glabel"><span>' + esc(results[g].label) + '</span>' +
          (results[g].total > CAP ? '<span>' + results[g].total + '</span>' : '') + '</div>';
        for (var i = 0; i < results[g].items.length; i++) {
          var it = results[g].items[i];
          html += '<a class="ns-pal-row" data-i="' + n + '" href="' + esc(it.url) + '" role="option">' +
            '<span class="ns-pal-ricon">' + esc(it.icon || '\u2022') + '</span>' +
            '<span class="ns-pal-rtext"><span class="ns-pal-rname">' + esc(it.name) + '</span>' +
            '<span class="ns-pal-rmeta">' + esc(it.meta) + '</span></span>' +
            '<span class="ns-pal-rurl">' + esc(it.url) + '</span></a>';
          n++;
        }
        html += '</div>';
      }
      list.innerHTML = html;
    }
    root.querySelector('.ns-pal-count').textContent = q.trim() ? flat().length + ' results' : '';
    paint();
  }

  function paint() {
    var rows = list.querySelectorAll('.ns-pal-row');
    for (var i = 0; i < rows.length; i++) rows[i].classList.toggle('is-active', i === active);
  }

  function openPalette(prefill) {
    build();
    loadIndex(function () { render(input.value); });
    open = true;
    root.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';
    if (prefill != null) input.value = prefill;
    input.focus();
    input.select();
    render(input.value);
  }

  function close() {
    if (!root) return;
    open = false;
    root.classList.remove('is-open');
    document.documentElement.style.overflow = '';
  }

  // --------------------------------------------------------------- wiring ---

  document.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase();
    if ((e.metaKey || e.ctrlKey) && k === 'k') { e.preventDefault(); open ? close() : openPalette(); return; }
    if (k === 'escape' && open) { close(); return; }
    if (k === '/' && !open) {
      var t = e.target.tagName;
      if (t !== 'INPUT' && t !== 'TEXTAREA' && !e.target.isContentEditable) { e.preventDefault(); openPalette(); }
    }
  });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-ns-search-open]');
    if (btn) { e.preventDefault(); openPalette(btn.getAttribute('data-ns-search-prefill')); }
  });

  // Homepage hero field: focusing or typing hands over to the palette, so hero
  // and nav search are one surface with one behaviour.
  document.addEventListener('focusin', function (e) {
    var f = e.target.closest && e.target.closest('[data-ns-search-input]');
    if (f && !open) { f.blur(); openPalette(f.value); }
  });

  function styles() {
    var s = document.createElement('style');
    s.id = 'ns-search-styles';
    s.textContent = [
      '.ns-pal{position:fixed;inset:0;background:rgba(5,7,12,.72);z-index:2000;display:none;justify-content:center;align-items:flex-start;padding:12vh 16px 16px;backdrop-filter:blur(2px)}',
      '.ns-pal.is-open{display:flex}',
      '.ns-pal-box{width:100%;max-width:560px;background:#0e1118;border:1px solid #2b3550;border-radius:14px;box-shadow:0 30px 70px rgba(0,0,0,.7);overflow:hidden;display:flex;flex-direction:column;max-height:78vh}',
      '.ns-pal-head{display:flex;align-items:center;gap:12px;padding:0 16px;height:56px;border-bottom:1px solid #1a1f2e;flex-shrink:0}',
      '.ns-pal-icon{color:#4d6480}',
      '.ns-pal-input{flex:1;background:none;border:none;outline:none;color:#dce8f5;font-size:1rem;height:100%;font-family:inherit;-webkit-appearance:none}',
      '.ns-pal-esc{border:1px solid #1a1f2e;background:none;color:#4d6480;font-size:.68rem;padding:5px 9px;border-radius:5px;font-family:ui-monospace,monospace;cursor:pointer;flex-shrink:0}',
      '.ns-pal-list{overflow-y:auto;-webkit-overflow-scrolling:touch;flex:1}',
      '.ns-pal-glabel{display:flex;justify-content:space-between;padding:10px 16px 6px;font-size:.68rem;text-transform:uppercase;letter-spacing:1.2px;color:#4d6480;font-weight:700}',
      '.ns-pal-row{display:flex;align-items:center;gap:12px;margin:0 8px 2px;padding:10px 12px;border-radius:8px;text-decoration:none;background:transparent}',
      '.ns-pal-row:hover,.ns-pal-row.is-active{background:#1a1f2e;text-decoration:none}',
      '.ns-pal-ricon{width:20px;text-align:center;flex-shrink:0;opacity:.85}',
      '.ns-pal-rtext{flex:1;min-width:0}',
      '.ns-pal-rname{display:block;color:#dce8f5;font-size:.9rem;font-weight:600}',
      '.ns-pal-rmeta{display:block;color:#7a99ba;font-size:.76rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ns-pal-rurl{color:#4d6480;font-size:.7rem;font-family:ui-monospace,monospace;flex-shrink:0}',
      '.ns-pal-hint,.ns-pal-empty{padding:20px 16px;color:#7a99ba;font-size:.85rem;line-height:1.6;display:flex;flex-direction:column;gap:6px}',
      '.ns-pal-empty strong{color:#dce8f5;font-weight:600}',
      '.ns-pal-foot{display:flex;gap:16px;padding:10px 16px;border-top:1px solid #1a1f2e;color:#4d6480;font-size:.72rem;flex-shrink:0}',
      '.ns-pal-count{margin-left:auto}',
      '@media (max-width:600px){',
        '.ns-pal{padding:0}',
        '.ns-pal-box{max-width:none;height:100%;max-height:none;border:none;border-radius:0}',
        '.ns-pal-row{padding:14px 12px;min-height:44px}',
        '.ns-pal-rurl{display:none}',
      '}'
    ].join('');
    document.head.appendChild(s);
  }
  styles();

  window.NanoScrapeSearch = { open: openPalette, close: close };
})();
