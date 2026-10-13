# Current State — x-hotspots-timeline

Updated: 2026-10-13 (Asia/Shanghai)

## Project
Static GitHub Pages site of global news hotspots (Chinese UI). Live: https://mattamior.github.io/x-hotspots-timeline/ · published from `main` root (`.nojekyll` present, no build step).

## Shape
- `index.html` + `styles.css` + `app.js`; data loaded from `data/hotspots.json` (26 items as of 2026-10-13 morning).
- Same-page layout: timeline left, sticky Leaflet + OpenStreetMap map right; stacks vertically at ≤900px. Card ↔ marker linked; region filter + search apply to both.
- Updates via `node scripts/merge-hotspots.mjs scripts/batches/<date>-<slot>.json` (merge by id/url, sorted by publishedAt desc, updates `updatedAt`); see `scripts/update-hotspots.md`.
- Auto-updated 3× daily (08:05 / 12:05 / 20:05 Asia/Shanghai) by a scheduled digest that writes a batch, merges new items, and pushes to `main`.
