(() => {
  const DATA_URL = "data/hotspots.json";
  const $ = (sel) => document.querySelector(sel);

  const timeline = $("#timeline");
  const status = $("#status");
  const chipsEl = $("#region-chips");
  const searchEl = $("#search");
  const updatedEl = $("#updated-at");
  const themeBtn = $("#theme-toggle");
  const mapEl = $("#map");

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

  function formatTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return (
      new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
        .format(d)
        .replace(/\//g, "-") + " CST"
    );
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
    return ["全部", ...Array.from(set).sort((a, b) => a.localeCompare(b, "zh-CN"))];
  }

  function renderChips(regions) {
    chipsEl.innerHTML = regions
      .map(
        (r) =>
          `<button type="button" class="chip${r === activeRegion ? " active" : ""}" data-region="${escapeHtml(r)}" role="tab" aria-selected="${r === activeRegion}">${escapeHtml(r)}</button>`
      )
      .join("");
  }

  function filterItems() {
    const q = (searchEl.value || "").trim().toLowerCase();
    return allItems.filter((it) => {
      if (activeRegion !== "全部" && it.region !== activeRegion) return false;
      if (!q) return true;
      const hay = [it.title, it.location, it.summary, it.why, ...(it.tags || [])]
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
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  function renderTimeline(items) {
    if (!items.length) {
      timeline.innerHTML = `<li class="empty">没有匹配的热点，试试换个地区或关键词。</li>`;
      return;
    }

    timeline.innerHTML = items
      .map((it) => {
        const title = it.url
          ? `<a href="${escapeHtml(it.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(it.title)}</a>`
          : escapeHtml(it.title);
        const why = it.why
          ? `<p class="why"><strong>为什么值得关注</strong>${escapeHtml(it.why)}</p>`
          : "";
        const tags = (it.tags || [])
          .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
          .join("");
        const active = it.id === selectedId ? " active" : "";
        return `
          <li class="item${active}" data-id="${escapeHtml(it.id)}">
            <article class="card" tabindex="0" role="button" aria-pressed="${it.id === selectedId ? "true" : "false"}">
              <div class="card-top">
                <span class="loc">【${escapeHtml(it.location || "未知地点")}】</span>
                <time class="time" datetime="${escapeHtml(it.publishedAt || "")}">${escapeHtml(formatTime(it.publishedAt))}</time>
                <span class="source">${escapeHtml(it.source || "X 热点")}</span>
              </div>
              <h2>${title}</h2>
              <p class="summary">${escapeHtml(it.summary || "")}</p>
              ${why}
              ${tags ? `<div class="tags">${tags}</div>` : ""}
            </article>
          </li>`;
      })
      .join("");
  }

  function ensureMap() {
    if (mapReady || typeof L === "undefined") return;
    map = L.map(mapEl, {
      scrollWheelZoom: true,
      worldCopyJump: true,
    }).setView([20, 20], 2);

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
      ? `<a href="${escapeHtml(it.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(it.title)}</a>`
      : escapeHtml(it.title);
    const link = it.url
      ? `<a class="popup-link" href="${escapeHtml(it.url)}" target="_blank" rel="noopener noreferrer">在 X 上查看 →</a>`
      : "";
    return `
      <div class="popup-loc">【${escapeHtml(it.location || "未知地点")}】</div>
      <div class="popup-title">${title}</div>
      <p class="popup-summary">${escapeHtml(shortSummary(it.summary))}</p>
      ${link}`;
  }

  function renderMap(items) {
    ensureMap();
    if (!mapReady) {
      status.textContent = "地图库加载失败，请刷新重试。";
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
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 5 });
    }

    setTimeout(() => map.invalidateSize(), 80);
  }

  function refresh() {
    const items = filterItems();
    status.textContent = `显示 ${items.length} / ${allItems.length} 条`;

    if (selectedId && !items.some((it) => it.id === selectedId)) {
      selectedId = null;
    }

    renderTimeline(items);
    renderMap(items);
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
  themeBtn.addEventListener("click", toggleTheme);

  window.addEventListener("resize", () => {
    if (mapReady) setTimeout(() => map.invalidateSize(), 100);
  });

  async function boot() {
    initTheme();
    status.textContent = "正在加载热点…";
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
      updatedEl.textContent = data.updatedAt
        ? `更新于 ${formatTime(data.updatedAt)}`
        : `共 ${allItems.length} 条`;
      renderChips(uniqueRegions(allItems));
      refresh();
    } catch (err) {
      console.error(err);
      status.textContent = "加载失败：请确认 data/hotspots.json 可访问。";
      timeline.innerHTML = `<li class="empty">无法读取热点数据。</li>`;
      updatedEl.textContent = "加载失败";
    }
  }

  boot();
})();
