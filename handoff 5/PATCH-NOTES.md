# Patch notes — after first deploy

Two follow-ups from reviewing the live site. Both are small.

---

## 1. Header + footer look unchanged → stale cached `components.js`

`components.js` (v2) and `search.js` **are** deployed and correct in the repo, and the new
hero is live — which is the tell. HTML gets revalidated on every request, but the JS files
are served with a long cache lifetime, so browsers and the CDN in front of `www` are still
running the **v1** `components.js`. v1 renders exactly what you're seeing: the big centred
logo on the homepage and the single-line footer.

**Fix — version the script URLs** (do this on every page, all languages; a find/replace):

```html
<!-- before -->
<script src="/components.js"></script>
<script src="/search.js"></script>

<!-- after -->
<script src="/components.js?v=2"></script>
<script src="/search.js?v=2"></script>
```

Bump `?v=` on every future change to either file. To confirm before/after: open
`https://www.nanoscrape.com/components.js` in a private window and check the header
comment says `(v2)`; then hard-reload the homepage (Cmd/Ctrl+Shift+R) — the nav should show
Actors / Tutorials / Templates and the footer should be five columns.

If it still shows v1 after that, purge the CDN cache for `/components.js` and `/search.js`.

Nothing else needs to change — no markup edits, no re-implementation.

---

## 2. Catalog header + filter chips were missing from the handoff

My gap: `home-hero.html` covered the hero and path cards but not the catalog header row.
`catalog-header.html` in this folder has it — and the chips are **working filters**, not
decoration.

Replace, in `index.html`:

```html
<h2>Actor Catalog</h2>
<p class="subtitle">Pricing starts at $0.001/SERP. No monthly fees. Pay only for what you scrape.</p>
```

with the block from `catalog-header.html` (markup + CSS + script, all self-contained).

How the filtering works without touching the 131 cards: on load the script reads each
card's category from its `.category h3` heading and its price from the existing
`.price` span, then filters on those. Empty categories collapse, the `Show all …`
buttons hide while a filter is active, and hidden-by-default cards are revealed so matches
inside them aren't lost. `All 131` resets. No URLs change; `history` is untouched.

Also worth doing while you're in there: the `Das Oertliche Scraper` card still reads
`$0.002/SERP` — check whether that one is genuinely $0.002 or should be $0.001.
