(() => {
  const DATA_URL = "data/hotspots.json";
  const $ = (sel) => document.querySelector(sel);

  const timeline = $("#timeline");
  const status = $("#status");
  const chipsEl = $("#region-chips");
  const searchEl = $("#search");
  const updatedEl = $("#updated-at");
  const themeBtn = $("#theme-toggle");
  const refreshBtn = $("#refresh-btn");
  const autoRefreshBtn = $("#auto-refresh-btn");
  const mapEl = $("#map");
  const langPicker = $("#lang-picker");
  const langBtn = $("#lang-btn");
  const langBtnLabel = $("#lang-btn-label");
  const langMenu = $("#lang-menu");

  // ---- i18n ----
  const I18N = window.HOTSPOTS_I18N;
  const LANG_KEY = "hotspots-lang";
  const LANGS = I18N.languages.map((l) => l.code);
  let lang = (() => {
    const q = new URLSearchParams(location.search).get("lang");
    if (q && LANGS.includes(q)) { localStorage.setItem(LANG_KEY, q); return q; }
    const s = localStorage.getItem(LANG_KEY);
    return s && LANGS.includes(s) ? s : "zh";
  })();
  const langInfo = () => I18N.languages.find((l) => l.code === lang);
  function t(key, vars = {}) {
    const s = (I18N.strings[lang] && I18N.strings[lang][key]) ?? I18N.strings.zh[key] ?? key;
    return String(s).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
  }
  const regionLabel = (r) => (I18N.strings[lang].regions || {})[r] || I18N.strings.zh.regions[r] || r;
  // Item field in current language, falling back to zh source.
  function f(it, key) {
    const tr = it.i18n && it.i18n[lang];
    if (lang !== "zh" && tr && tr[key] !== undefined && tr[key] !== "" && !(Array.isArray(tr[key]) && !tr[key].length)) return tr[key];
    return it[key];
  }
  function applyStaticI18n() {
    const li = langInfo();
    document.documentElement.lang = li.locale;
    document.documentElement.dir = li.dir;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      if (el.dataset.i18n === "footer2") return; // filled by renderFooterTz with offset
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
    themeBtn.setAttribute("aria-label", t("themeToggle"));
    langBtn.setAttribute("aria-label", t("langLabel"));
    syncRefreshChrome();
    const cur = langInfo();
    langBtnLabel.textContent = cur.label;
    langMenu.querySelectorAll(".lang-option").forEach((btn) => {
      const selected = btn.dataset.lang === lang;
      btn.setAttribute("aria-selected", selected ? "true" : "false");
    });
    const u = new URL(location.href);
    if (lang === "zh") u.searchParams.delete("lang"); else u.searchParams.set("lang", lang);
    history.replaceState(null, "", u);
    renderFooterTz();
  }
  function buildLangMenu() {
    langMenu.innerHTML = I18N.languages.map((l) =>
      `<li role="presentation"><button type="button" class="lang-option" role="option" data-lang="${l.code}" aria-selected="${l.code === lang ? "true" : "false"}">${l.label}</button></li>`
    ).join("");
  }
  buildLangMenu();
  const locLabel = (it) => { const l = f(it, "location") || t("unknownLoc"); return lang === "zh" ? `【${l}】` : l; };
  let dataUpdatedAt = null;
  function renderUpdated() {
    updatedEl.textContent = dataUpdatedAt ? t("updated", { time: formatTime(dataUpdatedAt) }) : t("totalOnly", { total: allItems.length });
    renderFooterTz();
  }

  let allItems = [];
  let activeRegion = "全部";
  let selectedId = null;
  let map = null;
  let markerLayer = null;
  let mapReady = false;
  /** @type {Map<string, L.Marker>} */
  const markersById = new Map();

  const THEME_KEY = "hotspots-theme";

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    const theme = saved || (prefersLight ? "light" : "dark");
    document.documentElement.setAttribute("data-theme", theme);
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme") || "dark";
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
    if (mapReady) setTimeout(() => map.invalidateSize(), 50);
  }

  /** UTC offset minutes for `timeZone` at instant `date` (DST-aware). */
  function utcOffsetMinutes(date, timeZone) {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = {};
    for (const p of dtf.formatToParts(date)) {
      if (p.type !== "literal") parts[p.type] = p.value;
    }
    let hour = parseInt(parts.hour, 10);
    if (hour === 24) hour = 0; // rare 24:00 edge
    const asUTC = Date.UTC(
      +parts.year,
      +parts.month - 1,
      +parts.day,
      hour,
      +parts.minute,
      +parts.second
    );
    return Math.round((asUTC - date.getTime()) / 60000);
  }

  /** Format offset as +8, -5, +5:30 (ASCII sign). */
  function formatUtcOffset(mins) {
    const sign = mins >= 0 ? "+" : "-";
    const abs = Math.abs(mins);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return m ? `${sign}${h}:${String(m).padStart(2, "0")}` : `${sign}${h}`;
  }

  /** e.g. CST+8, ET-4, IST+5:30 — abbrev + offset at this instant. */
  function tzLabelAt(date) {
    const li = langInfo();
    const tz = li.timeZone || "Asia/Shanghai";
    const abbrev = t("tzAbbrev") || t("tz");
    return abbrev + formatUtcOffset(utcOffsetMinutes(date, tz));
  }

  function formatTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const li = langInfo();
    const tz = li.timeZone || "Asia/Shanghai";
    const parts = new Intl.DateTimeFormat(li.locale, {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(d);
    const get = (type) => (parts.find((p) => p.type === type) || {}).value || "";
    const y = get("year");
    const mo = get("month");
    const day = get("day");
    const h = get("hour");
    const mi = get("minute");
    const dateStr = lang === "zh"
      ? `${y}-${mo}-${day} ${h}:${mi}`
      : `${mo}/${day}/${y}, ${h}:${mi}`;
    return `${dateStr} ${tzLabelAt(d)}`;
  }

  function renderFooterTz() {
    const el = document.querySelector(".site-footer .muted");
    if (!el) return;
    const instant = dataUpdatedAt ? new Date(dataUpdatedAt) : new Date();
    const when = Number.isNaN(instant.getTime()) ? new Date() : instant;
    el.textContent = t("footer2", { tzLabel: tzLabelAt(when) });
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function uniqueRegions(items) {
    const set = new Set();
    items.forEach((it) => {
      if (it.region) set.add(it.region);
    });
    return ["全部", ...Array.from(set).sort((a, b) => regionLabel(a).localeCompare(regionLabel(b), langInfo().locale))];
  }

  function renderChips(regions) {
    chipsEl.innerHTML = regions
      .map(
        (r) =>
          `<button type="button" class="chip${r === activeRegion ? " active" : ""}" data-region="${escapeHtml(r)}" role="tab" aria-selected="${r === activeRegion}">${escapeHtml(regionLabel(r))}</button>`
      )
      .join("");
  }

  function filterItems() {
    const q = (searchEl.value || "").trim().toLowerCase();
    return allItems.filter((it) => {
      if (activeRegion !== "全部" && it.region !== activeRegion) return false;
      if (!q) return true;
      const hay = [f(it, "title"), f(it, "location"), f(it, "summary"), f(it, "why"), ...(f(it, "tags") || []),
        it.title, it.location, it.summary, it.why, ...(it.tags || [])]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  function shortSummary(text, max = 140) {
    const s = String(text || "").trim();
    if (s.length <= max) return s;
    return s.slice(0, max).replace(/\s+\S*$/, "") + "…";
  }

  function makeIcon(active) {
    return L.divIcon({
      className: "hotspot-marker" + (active ? " active" : ""),
      html: '<div class="hotspot-pin"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [0, -10],
    });
  }

  function syncHighlights() {
    timeline.querySelectorAll(".item").forEach((li) => {
      li.classList.toggle("active", li.dataset.id === selectedId);
    });
    markersById.forEach((marker, id) => {
      marker.setIcon(makeIcon(id === selectedId));
    });
  }

  function selectItem(id, { fromMap = false, openPopup = true } = {}) {
    selectedId = id;
    syncHighlights();

    const marker = markersById.get(id);
    if (marker && mapReady) {
      const latlng = marker.getLatLng();
      map.panTo(latlng, { animate: true });
      if (openPopup) marker.openPopup();
    }

    if (fromMap) {
      const card = timeline.querySelector(`.item[data-id="${CSS.escape(id)}"]`);
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  function renderTimeline(items) {
    if (!items.length) {
      timeline.innerHTML = `<li class="empty">${escapeHtml(t("empty"))}</li>`;
      return;
    }

    destroyMiniMaps();
    timeline.innerHTML = items
      .map((it) => {
        const title = it.url
          ? `<a href="${escapeHtml(it.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(f(it, "title"))}</a>`
          : escapeHtml(f(it, "title"));
        const why = f(it, "why")
          ? `<p class="why"><strong>${escapeHtml(t("why"))}</strong>${escapeHtml(f(it, "why"))}</p>`
          : "";
        const tags = (f(it, "tags") || [])
          .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
          .join("");
        const active = it.id === selectedId ? " active" : "";
        return `
          <li class="item${active}" data-id="${escapeHtml(it.id)}">
            <article class="card" tabindex="0" role="button" aria-pressed="${it.id === selectedId ? "true" : "false"}">
              <div class="card-top">
                <span class="loc">${escapeHtml(locLabel(it))}</span>
                <time class="time" datetime="${escapeHtml(it.publishedAt || "")}">${escapeHtml(formatTime(it.publishedAt))}</time>
                <span class="source">${escapeHtml(!it.source || it.source === "X 热点" ? t("source") : it.source)}</span>
              </div>
              <div class="card-main"><div class="card-text">
              <h2>${title}</h2>
              <p class="summary">${escapeHtml(f(it, "summary") || "")}</p>
              ${why}
              ${tags ? `<div class="tags">${tags}</div>` : ""}
              </div>
              ${Number.isFinite(it.lat) && Number.isFinite(it.lng) ? `<div class="card-map" data-lat="${it.lat}" data-lng="${it.lng}" aria-label="${escapeHtml(t("mapAria", { loc: f(it, "location") || "" }))}"></div>` : ""}
              </div>
            </article>
          </li>`;
      })
      .join("");
  }

  // ---- Desktop per-card mini maps ----
  const desktopMq = window.matchMedia("(min-width: 901px)");
  /** @type {Map<Element, L.Map>} */
  const miniMaps = new Map();
  let miniObserver = null;

  function destroyMiniMaps() {
    if (miniObserver) { miniObserver.disconnect(); miniObserver = null; }
    miniMaps.forEach((m) => m.remove());
    miniMaps.clear();
  }

  function initMiniMap(el) {
    if (miniMaps.has(el) || typeof L === "undefined") return;
    const lat = parseFloat(el.dataset.lat), lng = parseFloat(el.dataset.lng);
    const m = L.map(el, {
      center: [lat, lng], zoom: 4,
      zoomControl: false, dragging: false, scrollWheelZoom: false,
      doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false,
      attributionControl: true,
    });
    m.attributionControl.setPrefix("");
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18, attribution: "© OSM",
    }).addTo(m);
    L.marker([lat, lng], { icon: makeIcon(true), interactive: false }).addTo(m);
    miniMaps.set(el, m);
  }

  function setupMiniMaps() {
    if (!desktopMq.matches) return;
    const els = timeline.querySelectorAll(".card-map");
    if (!("IntersectionObserver" in window)) { els.forEach(initMiniMap); return; }
    miniObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { initMiniMap(e.target); miniObserver.unobserve(e.target); }
      });
    }, { rootMargin: "300px 0px" });
    els.forEach((el) => miniObserver.observe(el));
  }

  window.addEventListener("resize", syncLayoutVars);
  desktopMq.addEventListener("change", () => {
    destroyMiniMaps();
    if (desktopMq.matches) setupMiniMaps();
    else if (mapReady) setTimeout(() => { syncLayoutVars(); map.invalidateSize(); applyMinZoom(); renderMap(filterItems()); }, 50);
  });

  // Smallest zoom where the world fills the map width AND height (no blank bands).
  function applyMinZoom() {
    if (!map) return;
    const s = map.getSize();
    const z = Math.max(Math.log2(s.x / 256), Math.log2(s.y / 256));
    const minZ = Math.max(1, Math.ceil(z * 4) / 4);
    map.setMinZoom(minZ);
    if (map.getZoom() < minZ) map.setZoom(minZ);
  }

  function syncLayoutVars() {
    const hdr = document.querySelector(".site-header");
    const band = document.querySelector(".map-band");
    const root = document.documentElement.style;
    if (hdr) root.setProperty("--header-h", hdr.offsetHeight + "px");
    if (band) root.setProperty("--map-h", band.offsetHeight + "px");
    const fs = document.querySelector(".filter-sticky");
    if (fs) root.setProperty("--filter-h", fs.offsetHeight + "px");
  }
  syncLayoutVars();

  function ensureMap() {
    if (mapReady || typeof L === "undefined") return;
    map = L.map(mapEl, {
      scrollWheelZoom: true,
      worldCopyJump: true,
      zoomSnap: 0.25,
      maxBounds: [[-85, -540], [85, 540]],
      maxBoundsViscosity: 1.0,
    }).setView([20, 20], 2);
    applyMinZoom();
    window.addEventListener("resize", () => { syncLayoutVars(); applyMinZoom(); map.invalidateSize(); });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markerLayer = L.layerGroup().addTo(map);
    mapReady = true;
  }

  function popupHtml(it) {
    const title = it.url
      ? `<a href="${escapeHtml(it.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(f(it, "title"))}</a>`
      : escapeHtml(f(it, "title"));
    const link = it.url
      ? `<a class="popup-link" href="${escapeHtml(it.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("viewOnX"))}</a>`
      : "";
    return `
      <div class="popup-loc">${escapeHtml(locLabel(it))}</div>
      <div class="popup-title">${title}</div>
      <p class="popup-summary">${escapeHtml(shortSummary(f(it, "summary")))}</p>
      ${link}`;
  }

  function renderMap(items) {
    ensureMap();
    if (!mapReady) {
      status.textContent = t("mapFail");
      return;
    }

    markerLayer.clearLayers();
    markersById.clear();

    const withCoords = items.filter(
      (it) => Number.isFinite(it.lat) && Number.isFinite(it.lng)
    );

    if (!withCoords.length) {
      map.setView([20, 20], 2);
      return;
    }

    const bounds = [];

    withCoords.forEach((it) => {
      const marker = L.marker([it.lat, it.lng], {
        icon: makeIcon(it.id === selectedId),
      });
      marker.bindPopup(popupHtml(it), { maxWidth: 280 });
      marker.on("click", () => {
        selectItem(it.id, { fromMap: true, openPopup: true });
      });
      markerLayer.addLayer(marker);
      markersById.set(it.id, marker);
      bounds.push([it.lat, it.lng]);
    });

    if (selectedId && markersById.has(selectedId)) {
      const m = markersById.get(selectedId);
      map.panTo(m.getLatLng(), { animate: false });
      m.openPopup();
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 5);
    } else {
      map.invalidateSize();
      applyMinZoom();
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 5 });
    }

    setTimeout(() => { map.invalidateSize(); applyMinZoom(); }, 80);
  }

  function refresh() {
    const items = filterItems();
    status.textContent = t("count", { n: items.length, total: allItems.length });

    if (selectedId && !items.some((it) => it.id === selectedId)) {
      selectedId = null;
    }

    renderTimeline(items);
    renderMap(items);
    setupMiniMaps();
  }

  timeline.addEventListener("click", (e) => {
    if (e.target.closest("a")) return;
    const li = e.target.closest(".item[data-id]");
    if (!li) return;
    selectItem(li.dataset.id, { fromMap: false, openPopup: true });
  });

  timeline.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".card");
    if (!card) return;
    e.preventDefault();
    const li = card.closest(".item[data-id]");
    if (li) selectItem(li.dataset.id, { fromMap: false, openPopup: true });
  });

  chipsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    activeRegion = btn.dataset.region || "全部";
    renderChips(uniqueRegions(allItems));
    refresh();
  });

  searchEl.addEventListener("input", refresh);
  function setLang(code) {
    if (!LANGS.includes(code) || code === lang) {
      closeLangMenu();
      return;
    }
    lang = code;
    localStorage.setItem(LANG_KEY, lang);
    applyStaticI18n();
    renderUpdated();
    renderChips(uniqueRegions(allItems));
    refresh();
    syncLayoutVars();
    closeLangMenu();
    langBtn.focus();
  }

  function openLangMenu() {
    langPicker.classList.add("open");
    langBtn.setAttribute("aria-expanded", "true");
    langMenu.hidden = false;
    const selected = langMenu.querySelector('.lang-option[aria-selected="true"]') || langMenu.querySelector(".lang-option");
    if (selected) selected.focus();
  }

  function closeLangMenu() {
    langPicker.classList.remove("open");
    langBtn.setAttribute("aria-expanded", "false");
    langMenu.hidden = true;
  }

  function toggleLangMenu() {
    if (langMenu.hidden) openLangMenu();
    else closeLangMenu();
  }

  langBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleLangMenu();
  });

  langMenu.addEventListener("click", (e) => {
    const opt = e.target.closest(".lang-option");
    if (!opt) return;
    e.stopPropagation();
    setLang(opt.dataset.lang);
  });

  langBtn.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openLangMenu();
    } else if (e.key === "Escape") {
      closeLangMenu();
    }
  });

  langMenu.addEventListener("keydown", (e) => {
    const options = Array.from(langMenu.querySelectorAll(".lang-option"));
    const idx = options.indexOf(document.activeElement);
    if (e.key === "Escape") {
      e.preventDefault();
      closeLangMenu();
      langBtn.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      options[(idx + 1) % options.length].focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      options[(idx - 1 + options.length) % options.length].focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      options[0].focus();
    } else if (e.key === "End") {
      e.preventDefault();
      options[options.length - 1].focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (idx >= 0) setLang(options[idx].dataset.lang);
    } else if (e.key === "Tab") {
      closeLangMenu();
    }
  });

  document.addEventListener("click", (e) => {
    if (!langPicker.contains(e.target)) closeLangMenu();
  });

  themeBtn.addEventListener("click", toggleTheme);

  window.addEventListener("resize", () => {
    if (mapReady) setTimeout(() => map.invalidateSize(), 100);
  });

  // ---- Soft data reload + auto-refresh ----
  const AUTO_KEY = "hotspots-auto-refresh";
  const AUTO_MS = 5 * 60 * 1000;
  let loadingData = false;
  let autoRefreshOn = localStorage.getItem(AUTO_KEY) === "1";
  let autoTimer = null;

  function syncRefreshChrome() {
    if (!refreshBtn || !autoRefreshBtn) return;
    refreshBtn.setAttribute("aria-label", t("refreshBtn"));
    refreshBtn.title = t("refreshBtn");
    autoRefreshBtn.querySelector(".auto-refresh-label").textContent = t("autoRefresh");
    autoRefreshBtn.setAttribute("aria-pressed", autoRefreshOn ? "true" : "false");
    autoRefreshBtn.setAttribute("aria-label", autoRefreshOn ? t("autoRefreshOn") : t("autoRefreshOff"));
    autoRefreshBtn.title = autoRefreshOn ? t("autoRefreshOn") : t("autoRefreshOff");
  }

  function setLoading(on) {
    loadingData = on;
    if (!refreshBtn) return;
    refreshBtn.disabled = on;
    refreshBtn.classList.toggle("is-loading", on);
    refreshBtn.setAttribute("aria-busy", on ? "true" : "false");
  }

  async function loadData({ soft = false } = {}) {
    if (loadingData) return false;
    setLoading(true);
    if (!soft || !allItems.length) status.textContent = t("loading");
    else status.textContent = t("refreshLoading");
    try {
      const res = await fetch(DATA_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      allItems = Array.isArray(data.items) ? data.items.slice() : [];
      allItems.sort((a, b) => {
        const ta = new Date(a.publishedAt || 0).getTime();
        const tb = new Date(b.publishedAt || 0).getTime();
        return tb - ta;
      });
      dataUpdatedAt = data.updatedAt || null;
      // Keep filters; drop selection if the item disappeared.
      if (selectedId && !allItems.some((it) => it.id === selectedId)) selectedId = null;
      const regions = uniqueRegions(allItems);
      if (activeRegion !== "全部" && !regions.includes(activeRegion)) activeRegion = "全部";
      renderUpdated();
      renderChips(regions);
      refresh();
      syncLayoutVars();
      return true;
    } catch (err) {
      console.error(err);
      if (!allItems.length) {
        status.textContent = t("loadFail");
        timeline.innerHTML = `<li class="empty">${escapeHtml(t("noData"))}</li>`;
        updatedEl.textContent = t("loadFailShort");
      } else {
        status.textContent = t("loadFailShort");
        setTimeout(() => {
          const items = filterItems();
          status.textContent = t("count", { n: items.length, total: allItems.length });
        }, 2200);
      }
      return false;
    } finally {
      setLoading(false);
    }
  }

  function clearAutoTimer() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }

  function scheduleAutoRefresh() {
    clearAutoTimer();
    if (!autoRefreshOn) return;
    if (document.visibilityState === "hidden") return;
    autoTimer = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      loadData({ soft: true });
    }, AUTO_MS);
  }

  function setAutoRefresh(on) {
    autoRefreshOn = !!on;
    localStorage.setItem(AUTO_KEY, autoRefreshOn ? "1" : "0");
    syncRefreshChrome();
    scheduleAutoRefresh();
  }

  refreshBtn.addEventListener("click", () => loadData({ soft: true }));
  autoRefreshBtn.addEventListener("click", () => setAutoRefresh(!autoRefreshOn));

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      clearAutoTimer();
    } else if (autoRefreshOn) {
      scheduleAutoRefresh();
    }
  });

  async function boot() {
    initTheme();
    applyStaticI18n();
    syncRefreshChrome();
    await loadData({ soft: false });
    scheduleAutoRefresh();
  }

  boot();
})();
