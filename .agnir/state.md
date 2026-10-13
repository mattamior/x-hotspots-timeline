# Current State — x-hotspots-timeline

Updated: 2026-10-13 (Asia/Shanghai)

## Project
Static GitHub Pages site of global news hotspots. Live: https://mattamior.github.io/x-hotspots-timeline/ · published from `main` root (`.nojekyll` present, no build step).

## Shape
- i18n: 6 languages zh (default/source) / en / hi / es / fr / ar. Custom header language picker (not native `<select>`): localStorage `hotspots-lang` + `?lang=`, keyboard accessible (Enter/Space/arrows/Escape/outside click); sets `<html lang>` and `dir=rtl` for Arabic (timeline mirrored). UI strings in `i18n.js`; item translations in `data/hotspots.json` as `item.i18n.<lang>.{title,location,summary,why,tags}` with zh fallback; search matches current language + zh. Noto Sans SC/Devanagari/Arabic fonts. All 26 items translated 2026-10-13.
- Per-language display timezone (data stays as stored ISO; only display converts): zh Asia/Shanghai CST · en America/New_York ET · hi Asia/Kolkata IST · es America/Mexico_City CST · fr Europe/Paris CET · ar Asia/Riyadh AST. Header "updated" and card times + footer timezone line all follow the selected language.
- Timeline rail: shared `--rail-x` centers the vertical line and each card dot (`translate(-50%,-50%)` / RTL `translate(50%,-50%)`); dots also vertically centered on each card.
- `index.html` + `styles.css` + `app.js` + `i18n.js`; data from `data/hotspots.json` (26 items as of 2026-10-13 morning).
- Responsive layout: desktop (>900px) single-column timeline (max 1100px) with text left + Leaflet mini map right (260px, zoom 4, IntersectionObserver lazy-init); top map band hidden; filter chips + search + count in one sticky `.filter-sticky` wrapper. Mobile (≤900px) sticky top map band (240px) with card↔marker linking, no mini maps.
- Updates via `node scripts/merge-hotspots.mjs scripts/batches/<date>-<slot>.json`; see `scripts/update-hotspots.md`.
- Auto-updated 3× daily (08:05 / 12:05 / 20:05 Asia/Shanghai) by scheduled digest → batch → merge → push `main`.
