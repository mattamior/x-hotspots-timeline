# Decisions — x-hotspots-timeline

Updated: 2026-10-13

- **2026-10-12** — Static GitHub Pages site, no backend/build; `.nojekyll` at root.
- **2026-10-12** — Timeline + map side-by-side on one page (Leaflet + OSM, no API key); stacked on narrow screens.
- **2026-10-12** — Data updates go through `scripts/merge-hotspots.mjs` with batch files in `scripts/batches/`.
- **2026-10-12** — Scheduled digest (08:05/12:05/20:05 Asia/Shanghai) auto-pushes new items to `main`.
- **2026-10-13** — Agnir Core/profile `1.0` / `repository-filesystem/1.0` from iorLab/agnir `v1.0.2` (`b5626394ec40a5cb7a28c01892acde07cc0adc8e`).
- **2026-10-13** — Layout changed per user: map moved to a sticky full-width top band under the search box; timeline single column below (replaces side-by-side). Map minZoom derived from container size so no blank tile area.
- **2026-10-13** — Desktop top map was too large: on >900px replaced by per-card mini maps (text left, map right); ≤900px keeps sticky top map band. Card↔marker linking only on mobile top map.
- **2026-10-13** — Desktop: filter/search block and count line made sticky below the header (offsets measured at runtime); mobile unchanged to preserve screen space under the sticky map.
