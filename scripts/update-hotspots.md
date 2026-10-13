# 更新热点到 GitHub Pages

站点数据源：`data/hotspots.json`。推送到 `main` 后 Pages 通常 1–2 分钟刷新。

## 推荐流程（合并脚本）

1. 新建一批条目 JSON（数组，或 `{ "items": [...] }`），字段见下表。文件可放在 `scripts/batches/`。

2. 合并进主数据文件：

```bash
node scripts/merge-hotspots.mjs scripts/batches/2026-10-12-evening.json
# 先检查不写盘：
node scripts/merge-hotspots.mjs scripts/batches/2026-10-12-evening.json --dry-run
```

脚本按 `id`（其次 `url`）去重；同 id 时取较新的 `publishedAt`；按时间倒序排序；更新顶层 `updatedAt`。

3. 提交并推送：

```bash
git add data/hotspots.json
git commit -m "data: add evening hotspots YYYY-MM-DD"
git push origin main
```

4. 可选：确认 Pages 构建

```bash
gh api repos/mattamior/x-hotspots-timeline/pages/builds --jq '.[0] | {status, created_at}'
# 或打开 Actions / Pages 部署记录
```

页面：https://mattamior.github.io/x-hotspots-timeline/

## 条目字段

| 字段 | 必填 | 说明 |
|------|------|------|
| `id` | 是 | 唯一 ID（可用 X trending 数字串） |
| `title` | 是 | 标题 |
| `location` | 是 | 地点，如 `美国·华盛顿` |
| `region` | 建议 | 筛选用：北美 / 欧洲 / 中东 / 亚太 / 拉美 / 非洲 / 全球 |
| `summary` | 是 | 3–5 句摘要 |
| `why` | 建议 | 「为什么值得关注」 |
| `publishedAt` | 是 | ISO 8601，建议 `+08:00` |
| `url` | 建议 | X 或其他来源链接 |
| `source` | 建议 | 默认 `X 热点` |
| `tags` | 可选 | 字符串数组 |
| `lat` / `lng` | 是 | 地图坐标（数字） |

| `i18n` | 是（新批次） | 其余 5 种语言译文，见下 |

## 多语言（i18n）

站点支持 zh（默认）/ en / hi / es / fr / ar。顶层 `title`、`location`、`summary`、`why`、`tags` 是**中文源文**；每条还必须带：

```json
"i18n": {
  "en": { "title": "...", "location": "Sweden · Stockholm", "summary": "...", "why": "...", "tags": ["..."] },
  "hi": { ... }, "es": { ... }, "fr": { ... }, "ar": { ... }
}
```

- 忠实翻译，不增删事实；人名、数字、日期保持一致；`tags` 数量与中文一致。
- `location` 用该语言的“国家 · 城市”写法，不加【】（中文才加）。
- 缺失时前端回退中文；合并脚本对缺失语言/字段打印 `WARN`，加 `--strict` 则直接失败。
- `region` 保持中文枚举值（北美/欧洲/中东/亚太/拉美/非洲/全球），界面翻译在 `i18n.js`。
- 界面文案集中在 `i18n.js`；新增 UI 文本需同时补 6 种语言。

## 手动编辑

也可直接改 `data/hotspots.json` 后 `git commit` + `git push`。务必保证每条有 `lat`/`lng`。

## Agnir

This repo is Agnir-enabled: before each commit run checkpoint evaluation per `AGNIR.md` (routine data merges are usually a no-op; do not force `.agnir/` changes).
