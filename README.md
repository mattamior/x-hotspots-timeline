# 全球热点时间线 & 地图

纯静态全球时事热点站点：**左侧时间线 + 右侧粘性地图**（窄屏上下堆叠）。数据从 `data/hotspots.json` 加载，挂在 GitHub Pages。

## 在线地址

- 仓库：https://github.com/mattamior/x-hotspots-timeline
- 页面：https://mattamior.github.io/x-hotspots-timeline/

点击时间线卡片会定位并高亮对应地图标记；点击标记会滚动并高亮对应卡片。地区筛选与搜索同时作用于两者。

地图使用 Leaflet + OpenStreetMap（无需 API Key）。

## 本地预览

```bash
python3 -m http.server 8080
# 或 npx --yes serve .
```

打开 http://localhost:8080

## 如何更新热点

**推荐**：用合并脚本追加一批条目（见 [`scripts/update-hotspots.md`](scripts/update-hotspots.md)）：

```bash
node scripts/merge-hotspots.mjs scripts/batches/YYYY-MM-DD-evening.json
git add data/hotspots.json && git commit -m "data: add hotspots YYYY-MM-DD" && git push origin main
```

也可直接编辑 [`data/hotspots.json`](data/hotspots.json)：

1. 修改顶层 `updatedAt`（ISO 8601，建议带 `+08:00`）
2. 在 `items` 中增删改条目（**每条必须有 `lat` / `lng`**）

| 字段 | 说明 |
|------|------|
| `id` | 唯一 ID |
| `title` | 标题 |
| `location` | 地点标签 |
| `region` | 地区筛选（中东 / 欧洲 / 亚太 等） |
| `lat` / `lng` | 地图坐标（必填） |
| `url` | 可选 X 链接 |
| `summary` | 摘要 |
| `why` | 可选「为什么值得关注」 |
| `publishedAt` | ISO 时间，按北京时间显示 |
| `source` | 来源标签 |
| `tags` | 可选标签 |

推送到 `main` 后 Pages 通常一两分钟更新。

## 技术说明

- `index.html` + `styles.css` + `app.js` + `data/hotspots.json`
- 无后端、无构建
- 宽屏并排、地图 sticky；≤900px 地图在上、时间线在下
- GitHub Pages：`main` 根目录
