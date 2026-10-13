# Decisions — x-hotspots-timeline

Updated: 2026-10-13

- **2026-10-12** — Static GitHub Pages site, no backend/build; `.nojekyll` at root.
- **2026-10-12** — Timeline + map side-by-side on one page (Leaflet + OSM, no API key); stacked on narrow screens.
- **2026-10-12** — Data updates go through `scripts/merge-hotspots.mjs` with batch files in `scripts/batches/`.
- **2026-10-12** — Scheduled digest (08:05/12:05/20:05 Asia/Shanghai) auto-pushes new items to `main`.
- **2026-10-13** — Agnir Core/profile `1.0` / `repository-filesystem/1.0` from iorLab/agnir `v1.0.2` (`b5626394ec40a5cb7a28c01892acde07cc0adc8e`).
