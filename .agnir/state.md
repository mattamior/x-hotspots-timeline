# Current State — x-hotspots-timeline

Updated: 2026-10-13 (Asia/Shanghai)

## Project
Static GitHub Pages site of global news hotspots (Chinese UI). Live: https://mattamior.github.io/x-hotspots-timeline/ · published from `main` root (`.nojekyll` present, no build step).

## Shape
- `index.html` + `styles.css` + `app.js`; data loaded from `data/hotspots.json` (26 items as of 2026-10-13 morning).
- Responsive layout: desktop (>900px) shows a single-column timeline (max 1100px) where each card has text left and a small non-interactive Leaflet mini map right (260px, zoom 4, lazy-init via IntersectionObserver, destroyed/recreated on filter/search/breakpoint change); top map band hidden. Mobile (≤900px) keeps the sticky full-width top map band (240px) with card ↔ marker linking and no mini maps. Region filter + search apply to both.
- Updates via `node scripts/merge-hotspots.mjs scripts/batches/<date>-<slot>.json` (merge by id/url, sorted by publishedAt desc, updates `updatedAt`); see `scripts/update-hotspots.md`.
- Auto-updated 3× daily (08:05 / 12:05 / 20:05 Asia/Shanghai) by a scheduled digest that writes a batch, merges new items, and pushes to `main`.
