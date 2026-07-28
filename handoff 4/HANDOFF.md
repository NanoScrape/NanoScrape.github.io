# NanoScrape UX improvements — developer handoff

Static-site friendly: no build step, no framework, no dependencies. Vanilla JS in the
same style as the existing `components.js`.

**URL contract: nothing moves.** No path is renamed, no page is deleted, no redirect is
needed. The actor catalog stays on `/`, the localized homepages stay at `/de/`, `/fr/`,
`/zh/`, actor pages stay at `/actors/<slug>/` and `/actors/<slug>/<lang>/`, hubs stay at
`/tutorials/` and `/templates/`. Search and nav only *link* to paths that already exist.

Design reference: `UX Improvements.dc.html` in this project — option **3a** (desktop) and
**3m** (mobile, 390px). `Current Site.dc.html` is the before state.

---

## 1. Files

| File | Action | Notes |
|---|---|---|
| `handoff/components.js` | **replace** `/components.js` | Header v2 (nav links, search trigger, breadcrumb, language picker) + multi-column footer. Same `#site-header` / `#site-footer` mount points, same `LANGUAGES` config and path detection as v1. |
| `handoff/search.js` | **add** as `/search.js` | ⌘K / Ctrl+K palette, `/` shortcut, mobile full-screen sheet. ~4 KB, no deps. |
| `handoff/search-index.json` | **add** as `/search-index.json` | The search index. Generate at build time (see §4). |
| `handoff/home-hero.html` | paste into `index.html` | New hero + three path cards + scoped CSS + estimator script. Includes the DE/FR/ZH strings and the pricing corrections. |

Load order on **every** page:

```html
<div id="site-header"></div>
...
<div id="site-footer"></div>
<script src="/components.js"></script>
<script src="/search.js"></script>
```

Optional breadcrumb on sub-pages — put the labels on the existing mount point:

```html
<div id="site-header" data-crumb-section="Social media" data-crumb-title="Instagram Scraper"></div>
```

---

## 2. What changes, and why

**Homepage hero.** Was: a large logo and nothing else — no headline, no next step. Now:
headline, one-line value claim, a cost-estimate card (340px, presets 1k/10k/100k), and a
**full-width search line** below the two columns. The big-logo identity is kept, just at
56px inside the hero instead of standing alone.

**Tutorials + templates are now reachable.** Three path cards sit directly under the hero
(Actors / Tutorials / Templates), the nav carries the same three links on every page, and
the footer repeats them. Previously both hubs were unreachable from the homepage.

**Search.** One surface, three entry points: the hero field (focus hands over to the
palette), the nav search button on sub-pages, and ⌘K / Ctrl+K / `/` anywhere. Grouped
results: Actors → Tutorials → Templates → Categories & countries. All words must match,
so "jobs germany" and "n8n" both resolve. Empty state offers an actor request by email.
Index is fetched lazily on first open only, then cached in `sessionStorage` — visitors who
never search download nothing.

**Sub-page nav.** `← All actors` becomes a real nav (Actors / Tutorials / Templates with
the current section underlined) plus an optional breadcrumb line. The language picker
keeps its position, top right.

**Footer.** One line of links becomes five columns — Actors (with category anchors),
Learn, Build, NanoScrape — plus the language switcher repeated and a legal line.

**Pricing.** `$0.002/SERP` → `$0.001/SERP` everywhere, with `$0.0005` named as the floor
in the cost card. `90+` → `131+`. Files to touch: `index.html`, `/de/`, `/fr/`, `/zh/`
homepages, `llms.txt`, `README.md`.

---

## 3. i18n

`components.js` v2 carries a `T` table with EN/DE/ZH/FR strings for every nav, footer and
search label. Language detection and `buildLangUrl()` are unchanged from v1.

**Important:** `/tutorials/` and `/templates/` exist in English only today, so nav and
footer links to them always point at the unprefixed canonical path — never `/de/tutorials/`
(which would 404). When those hubs get translated, add the prefix logic in one place:
`navLinks()` and `renderFooter()` in `components.js`.

Search UI chrome is translated (group labels, placeholder). Index *content* is English;
if you localize it later, emit `search-index.<lang>.json` and switch `INDEX_URL` on
`lang` in `search.js`.

---

## 4. Generating `search-index.json`

Format per item:

```json
{ "type": "actor", "icon": "📖", "name": "Google Maps Scraper",
  "meta": "Directories · Global · $1/1k places",
  "url": "/actors/google-maps-scraper/",
  "keywords": "google maps places business directories local global" }
```

- `type`: `actor` | `tutorial` | `template` | `category`
- `url`: **must** be an existing path — the palette navigates to it verbatim
- `keywords`: lowercase, space separated. Include category, country (both English and
  local: `germany deutschland de`), tool (`n8n`, `make`, `zapier`), price tier, synonyms.
  This is what makes multi-word queries work.

Sources you already have: the `<h1>` + `.spec` values on each `/actors/<slug>/index.html`,
`tutorials/manifest.json`, the files under `templates/`, and the category headings in
`index.html`. The shipped file is a working starter with ~25 actors + all tutorials,
templates and categories — extend it to all 131 actors, ideally in the same script that
writes `sitemap.xml`.

Keep it under ~150 KB uncompressed (131 actors ≈ 30 KB) so the first-open fetch is
imperceptible.

---

## 5. Accessibility & performance notes

- Every touch target on mobile is ≥44px (nav icon buttons, palette rows, language chips).
- Palette: `role="dialog"`, `aria-modal`, arrow-key navigation, Enter to open, Esc to
  close, body scroll locked while open, focus returns on close.
- Language menu trigger toggles `aria-expanded`; current language marked `aria-current`.
- Hero has no images beyond the existing logo SVG. Cost bars are CSS only.
- No fonts added — the existing system stack is unchanged.
- Search adds one `fetch` **only** for visitors who open it.
- Nothing here needs JS to *navigate*: with JS disabled the hero, path cards, nav links
  and footer all render as plain links; only the palette is unavailable.

---

## 6. Suggested QA pass

1. `/`, `/de/`, `/fr/`, `/zh/` — hero renders, nav shows translated labels, language
   switcher still lands on the right homepage variant.
2. `/actors/instagram-scraper/` and `/actors/instagram-scraper/de/` — nav shows Actors
   underlined, breadcrumb correct, language switch keeps the actor slug.
3. `/tutorials/`, `/templates/` — nav highlights the right section, footer links resolve.
4. ⌘K on every page type; `/` shortcut; hero field focus. Query `instagram`,
   `jobs germany`, `n8n`, `zzz` (empty state).
5. 390px viewport: hero stacks, chips scroll, palette is full-screen, footer stacks.
6. Cost card: 1k / 10k / 100k update all three figures.
