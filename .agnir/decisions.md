# Decisions — x-hotspots-timeline

Updated: 2026-10-14

- **2026-10-12** — Static GitHub Pages site, no backend/build; `.nojekyll` at root.
- **2026-10-12** — Timeline + map side-by-side on one page (Leaflet + OSM, no API key); stacked on narrow screens.
- **2026-10-12** — Data updates go through `scripts/merge-hotspots.mjs` with batch files in `scripts/batches/`.
- **2026-10-12** — Scheduled digest (08:05/12:05/20:05 Asia/Shanghai) auto-pushes new items to `main`.
- **2026-10-13** — Agnir Core/profile `1.0` / `repository-filesystem/1.0` from iorLab/agnir `v1.0.2` (`b5626394ec40a5cb7a28c01892acde07cc0adc8e`).
- **2026-10-13** — Layout changed per user: map moved to a sticky full-width top band under the search box; timeline single column below (replaces side-by-side). Map minZoom derived from container size so no blank tile area.
- **2026-10-13** — Desktop top map was too large: on >900px replaced by per-card mini maps (text left, map right); ≤900px keeps sticky top map band. Card↔marker linking only on mobile top map.
- **2026-10-13** — Desktop: filter/search block and count line made sticky below the header (offsets measured at runtime); mobile unchanged to preserve screen space under the sticky map.
- **2026-10-13** — Sticky filter bug (count line overlapping search): replaced separate sticky elements with one `.filter-sticky` wrapper.
- **2026-10-13** — Multi-language (zh/en/hi/es/fr/ar): zh stays source at top level; translations in `item.i18n.<lang>`; UI dictionary in `i18n.js`; region values remain zh enum keys. Merge script warns on missing translations (`--strict` fails).
- **2026-10-13** — Timeline dot moved to card vertical center.
- **2026-10-13** — Display timezone follows UI language (zh Shanghai, en New York, hi Kolkata, es Mexico City, fr Paris, ar Riyadh); stored timestamps unchanged.
- **2026-10-13** — Native `<select>` language control replaced with custom pill dropdown matching site chrome (keyboard + outside-click).
- **2026-10-13** — Timeline dots horizontally centered on the rail via shared `--rail-x` + translate; fixes content-box offset on `::before`.
- **2026-10-13** — Display timezone labels include DST-aware numeric UTC offset (e.g. CST+8, ET-4, IST+5:30).
- **2026-10-13** — Added Japanese (ja), Korean (ko), Indonesian (id): UI + all item i18n; zones Tokyo/Seoul/Jakarta; merge LANGS now 8 non-zh languages.
- **2026-10-13** — Improved card summary readability (contrast, size, CJK leading/tracking); layout unchanged.
- **2026-10-13** — Header refresh button (soft-reload hotspots.json) + optional 5-min auto-refresh (localStorage, paused when tab hidden); i18n for all 9 langs.
- **2026-10-13** — Refresh + auto-refresh merged into one split pill (main = refresh now, caret menu = auto toggle, "auto" badge when on).
- **2026-10-13** — Refresh control v2 replaces split pill (user found it ugly): single 36px pill matching lang/theme controls, SVG icon spins while loading, chevron opens popover with iOS-style switch + "every 5 min" hint, green corner dot when auto is on; behaviour unchanged.
- **2026-10-13** — Removed green corner status dot (user found it odd); auto-refresh ON now tints the refresh icon with --loc green (theme-aware), off = normal.
- **2026-10-13** — Time filter in sticky toolbar: segmented pill groups for range (all/today/3d/7d/custom date range; day boundaries in current language tz) and digest slot (morning/noon/evening from Asia/Shanghai hour: <10 / <16 / else). Combines with region+search; persisted via ?range= (all|today|3d|7d|YYYY-MM-DD..YYYY-MM-DD) and ?slot=; survives reload/auto-refresh; i18n ×9, RTL, mobile stacks.
- **2026-10-14** — Mobile UX: remove sticky top map band; show per-card mini maps on phone (same Leaflet embeds as desktop). Sticky filter collapses into floating “筛选” FAB on scroll-down; tap FAB or return near top to expand. Desktop sticky filter unchanged. i18n filtersFab/filtersFabExpand ×9; RTL FAB uses inset-inline-end.
- **2026-10-14** — Cloudflare Pages project `x-hotspots` Git-connected to `mattamior/x-hotspots-timeline` (main, empty build, root output). Custom domain `x-hotspots.lapplax.com` (CNAME → `x-hotspots.pages.dev`, proxied). Primary public URL is CF; GitHub Pages kept as fallback. Push to `main` auto-deploys CF.
- **2026-10-14** — Mobile v2: filters closed by default in a bottom sheet (FAB opens; close btn / backdrop / Escape; dialog+inert; active-filter count badge on FAB). Slim one-row sticky header (~47px): tagline + updated-at hidden; updated-at shown inside sheet. Desktop unchanged. Deploy now Cloudflare Pages (https://x-hotspots.lapplax.com) auto from main.
- **2026-10-14** — Favicon (globe + green pulse dot, accent gradient) + PWA: manifest.webmanifest (X热点, standalone, maskable icons), sw.js (versioned cache; shell stale-while-revalidate, navigations + /data/* network-first), _headers (manifest content-type, sw.js no-cache, data no-cache), viewport-fit=cover + safe-area header/container; theme-color follows theme toggle. Bump VERSION in sw.js when shell changes.
- **2026-10-14** — Icon v2 (X-inspired, not the X logo): black bg, white monoline round-cap crossing strokes; the top-right arm is replaced by a red (#ff3b30) hotspot pulse dot. Manifest bg/theme #000000; sw VERSION v2-2026-10-14-xicon.
- **2026-10-14** — Icon v3: full equal-width rounded X (all four arms) with red #ff3b30 hotspot dot centred on the crossing, separated by a black gap ring; halo dropped (tinted the strokes pink). sw VERSION v3-2026-10-14-xdot.
- **2026-10-14** — Icon v4: gap ring removed; red #ff3b30 dot (r 6.25 vs stroke 8.5 → ~1.5x stroke width) sits directly on the X crossing. sw VERSION v4-2026-10-14-xdot-plain.
