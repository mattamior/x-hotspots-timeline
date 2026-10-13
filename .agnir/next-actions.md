# Next Actions — x-hotspots-timeline

Updated: 2026-10-13

1. Each scheduled digest: write batch under `scripts/batches/` → run merge script → checkpoint evaluation → commit → push `main` → verify ref/Pages.
2. Every item must keep required fields (`id`, `title`, `location`, `summary`, `publishedAt`, `lat`, `lng`); don't invent items.
3. Keep `.nojekyll` and the no-build static layout so Pages keeps serving from `main` root.
