(() => {
  const DATA_URL = "data/hotspots.json";
  const $ = (sel) => document.querySelector(sel);

  const timeline = $("#timeline");
  const status = $("#status");
  const chipsEl = $("#region-chips");
  const searchEl = $("#search");
  const updatedEl = $("#updated-at");
  const themeBtn = $("#theme-toggle");

  let allItems = [];
  let activeRegion = "全部";

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
  }

  function formatTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d).replace(/\//g, "-") + " CST";
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

  function renderTimeline(items) {
    if (!items.length) {
      timeline.innerHTML = `<li class="empty">没有匹配的热点，试试换个地区或关键词。</li>`;
      status.textContent = "共 0 条";
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
        return `
          <li class="item">
            <article class="card">
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

    status.textContent = `显示 ${items.length} / ${allItems.length} 条`;
  }

  function refresh() {
    renderTimeline(filterItems());
  }

  chipsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    activeRegion = btn.dataset.region || "全部";
    renderChips(uniqueRegions(allItems));
    refresh();
  });

  searchEl.addEventListener("input", refresh);
  themeBtn.addEventListener("click", toggleTheme);

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
