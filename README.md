# 全球热点时间线 & 地图

一个纯静态的全球时事热点站点：时间线列表 + 地点地图。数据从 `data/hotspots.json` 加载，适合挂在 GitHub Pages 上。

## 在线地址

- 仓库：https://github.com/mattamior/x-hotspots-timeline
- 页面：https://mattamior.github.io/x-hotspots-timeline/

顶部可在 **时间线** / **地图** 之间切换。地图使用 Leaflet + OpenStreetMap（无需 API Key）。

## 本地预览

在仓库根目录起一个静态服务器即可（直接双击 `index.html` 时，部分浏览器会拦 `fetch` 本地 JSON）：

```bash
# Python
python3 -m http.server 8080

# 或 Node
npx --yes serve .
```

打开 http://localhost:8080

## 如何更新热点

编辑 [`data/hotspots.json`](data/hotspots.json)：

1. 修改顶层 `updatedAt`（建议 ISO 8601，带 `+08:00`）
2. 在 `items` 数组里增删改条目

每条字段说明：

| 字段 | 说明 |
|------|------|
| `id` | 唯一 ID（可用 X trending 数字） |
| `title` | 标题 |
| `location` | 地点，展示为【地点】 |
| `region` | 地区分组，用于顶部筛选芯片（如 中东 / 欧洲 / 亚太） |
| `lat` / `lng` | 地图坐标（城市或地标近似经纬度） |
| `url` | 可选，标题外链（通常是 X 热点页） |
| `summary` | 摘要，3–5 句 |
| `why` | 可选，「为什么值得关注」 |
| `publishedAt` | 发布时间，ISO 8601，按 Asia/Shanghai 显示 |
| `source` | 来源标签，默认「X 热点」 |
| `tags` | 可选标签数组 |

改完后提交并推送到 `main`，GitHub Pages 会自动更新（通常一两分钟）。

## 技术说明

- 纯静态：`index.html` + `styles.css` + `app.js` + `data/hotspots.json`
- 无后端、无构建步骤
- 时间线 + 地图双视图；地区筛选、关键词搜索、明暗主题
- 地图：Leaflet 1.9 + OSM 瓦片（CDN）
- GitHub Pages：从 `main` 分支根目录部署
