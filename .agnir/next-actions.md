# Next Actions — x-hotspots-timeline

Updated: 2026-10-13

1. Each scheduled digest: write batch under `scripts/batches/` → run merge script → checkpoint evaluation → commit → push `main` → verify ref/Pages.
2. Every item must keep required fields (`id`, `title`, `location`, `summary`, `publishedAt`, `lat`, `lng`); don't invent items.
3. **Every new item must include `i18n.en/hi/es/fr/ar` with `title`, `location`, `summary`, `why`, `tags`** (faithful translations, same names/numbers, same tag count). Run merge; it must report `i18nWarnings: 0` (or use `--strict`).
4. New UI text must be added to all 6 languages in `i18n.js` (include `tz`/`tzAbbrev`/`footer2` if timezone-related).
5. Language picker is custom (`.lang-picker`); keep keyboard a11y and `hotspots-lang` / `?lang=` sync.
6. Keep `.nojekyll` and the no-build static layout so Pages keeps serving from `main` root.
