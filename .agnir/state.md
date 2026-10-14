# Current State — x-hotspots-timeline

Updated: 2026-10-14 (Asia/Shanghai)

## Project
Static hotspot site. **Primary:** https://x-hotspots.lapplax.com (Cloudflare Pages project `x-hotspots`, Git-connected to this repo, production branch `main`, empty build, output `.`). Also: https://x-hotspots.pages.dev · GitHub Pages https://mattamior.github.io/x-hotspots-timeline/ · `.nojekyll` + `wrangler.toml`.

## Shape
- i18n: 9 languages zh (default/source) / en / hi / es / fr / ar / ja / ko / id. Custom header language picker (not native `<select>`): localStorage `hotspots-lang` + `?lang=`, keyboard accessible; sets `<html lang>` and `dir=rtl` for Arabic. UI strings in `i18n.js`; item translations in `data/hotspots.json` as `item.i18n.<lang>.{title,location,summary,why,tags}` with zh fallback. Fonts: Noto Sans SC/JP/KR/Devanagari/Arabic. All 26 items translated for all 8 non-zh languages (2026-10-13).
- Per-language display timezone + DST-aware UTC offset on header/card times and footer (stored ISO unchanged): zh Asia/Shanghai CST+8 · en America/New_York ET± · hi Asia/Kolkata IST+5:30 · es America/Mexico_City CST-6 · fr Europe/Paris CET± · ar Asia/Riyadh AST+3 · ja Asia/Tokyo JST+9 · ko Asia/Seoul KST+9 · id Asia/Jakarta WIB+7.
- Timeline rail: shared `--rail-x` centers vertical line and card dots (LTR/RTL); dots vertically centered on cards.
- Responsive: per-card mini maps everywhere. Desktop sticky `.filter-sticky`. Mobile: slim one-row header, filters in a bottom sheet opened by FAB (badge = active filter count), closed by default. Deploy: Cloudflare Pages from main → https://x-hotspots.lapplax.com.
- Updates via `node scripts/merge-hotspots.mjs` (LANGS: en/hi/es/fr/ar/ja/ko/id); scheduled digest 08:05/12:05/20:05 Asia/Shanghai — **parent must update digest routine for ja/ko/id**.
- 2026-10-13: Card body readability — higher contrast `--text-body`, larger summary (~1.02rem), CJK line-height ~1.85 / letter-spacing, more card padding, summary max-width ~46em.
- Header: refresh pill v2 (icon = refresh now, spins while loading; chevron popover = iOS switch for auto-refresh; icon tinted green when on) (~5 min, Page Visibility aware, `hotspots-auto-refresh`).
- Filters: region chips + time range pills (?range=) + digest slot pills (?slot=) + search.
