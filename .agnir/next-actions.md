# Next Actions — x-hotspots-timeline

Updated: 2026-10-14

1. Each scheduled digest: write batch under `scripts/batches/` → run merge script → checkpoint evaluation → commit → push `main` → verify ref + Cloudflare Pages (primary https://x-hotspots.lapplax.com) / GitHub Pages.
2. Every item must keep required fields (`id`, `title`, `location`, `summary`, `publishedAt`, `lat`, `lng`); don't invent items.
3. **Every new item must include `i18n.en/hi/es/fr/ar/ja/ko/id` with `title`, `location`, `summary`, `why`, `tags`** (faithful translations, same names/numbers, same tag count). Run merge; it must report `i18nWarnings: 0` (or use `--strict`).
4. **Parent: update the scheduled digest routine** so new batches include ja/ko/id translations (same fields as other non-zh langs).
5. New UI text must be added to all 9 languages in `i18n.js` (include `tz`/`tzAbbrev`/`footer2` if timezone-related).
6. Language picker is custom (`.lang-picker`); keep keyboard a11y and `hotspots-lang` / `?lang=` sync.
7. Keep `.nojekyll`, `wrangler.toml` (`pages_build_output_dir = "."`), and no-build static layout so CF + GH Pages serve from `main` root.
8. Prefer linking users to https://x-hotspots.lapplax.com (with filter query params); GH Pages remains a fallback.
