#!/usr/bin/env node
/**
 * Merge a JSON array (or {items:[...]}) of hotspot entries into data/hotspots.json.
 *
 * Usage:
 *   node scripts/merge-hotspots.mjs path/to/batch.json
 *   node scripts/merge-hotspots.mjs path/to/batch.json --dry-run
 *
 * Merge key: id, then url. Newer publishedAt wins on conflict.
 * Sorts items by publishedAt descending. Updates top-level updatedAt.
 *
 * i18n: zh fields at top level are the source. Each item should carry
 *   i18n: { en|hi|es|fr|ar|ja|ko|id: { title, location, summary, why, tags[] } }
 * Missing languages/fields produce warnings (site falls back to zh).
 * Pass --strict to fail instead of warn. On update, i18n is deep-merged per language.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data", "hotspots.json");

const REQUIRED = ["id", "title", "location", "summary", "publishedAt", "lat", "lng"];
const LANGS = ["en", "hi", "es", "fr", "ar", "ja", "ko", "id"];
const I18N_FIELDS = ["title", "location", "summary", "why", "tags"];

function i18nWarnings(item) {
  const w = [];
  for (const lang of LANGS) {
    const tr = item.i18n && item.i18n[lang];
    if (!tr) { w.push(`${item.id}: missing i18n.${lang}`); continue; }
    for (const f of I18N_FIELDS) {
      const v = tr[f];
      if (f === "why" && !item.why) continue;
      if (f === "tags" && !(item.tags || []).length) continue;
      if (v === undefined || v === "" || (Array.isArray(v) && !v.length)) w.push(`${item.id}: missing i18n.${lang}.${f}`);
    }
    if (f_tags_mismatch(item, tr)) w.push(`${item.id}: i18n.${lang}.tags length differs from zh tags`);
  }
  return w;
}
function f_tags_mismatch(item, tr) {
  return Array.isArray(tr.tags) && Array.isArray(item.tags) && tr.tags.length && tr.tags.length !== item.tags.length;
}

function usage(msg) {
  if (msg) console.error(msg);
  console.error("Usage: node scripts/merge-hotspots.mjs <batch.json> [--dry-run]");
  process.exit(msg ? 1 : 0);
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const strict = args.includes("--strict");
const batchPath = args.find((a) => !a.startsWith("--"));
if (!batchPath) usage("Missing batch file.");

const raw = JSON.parse(fs.readFileSync(path.resolve(batchPath), "utf8"));
const incoming = Array.isArray(raw) ? raw : raw.items;
if (!Array.isArray(incoming) || incoming.length === 0) {
  usage("Batch must be a non-empty JSON array or { items: [...] }.");
}

for (const [i, item] of incoming.entries()) {
  for (const key of REQUIRED) {
    if (item[key] === undefined || item[key] === null || item[key] === "") {
      usage(`Item[${i}] missing required field: ${key}`);
    }
  }
  if (typeof item.lat !== "number" || typeof item.lng !== "number") {
    usage(`Item[${i}] lat/lng must be numbers`);
  }
}

const warnings = incoming.flatMap(i18nWarnings);
if (warnings.length) {
  for (const w of warnings) console.warn(`WARN ${w}`);
  if (strict) usage(`--strict: ${warnings.length} i18n problem(s).`);
}

const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
const byKey = new Map();
for (const item of data.items || []) {
  byKey.set(item.id, item);
  if (item.url) byKey.set(`url:${item.url}`, item);
}

let added = 0;
let updated = 0;

for (const item of incoming) {
  const defaults = {
    region: item.region || "全球",
    source: item.source || "X 热点",
    tags: item.tags || [],
    why: item.why || "",
  };
  const merged = { ...defaults, ...item };

  const existing =
    byKey.get(merged.id) || (merged.url ? byKey.get(`url:${merged.url}`) : null);

  if (!existing) {
    data.items.push(merged);
    byKey.set(merged.id, merged);
    if (merged.url) byKey.set(`url:${merged.url}`, merged);
    added++;
    continue;
  }

  // Same story: keep newer publishedAt; otherwise overwrite fields from batch
  const existingTs = Date.parse(existing.publishedAt || 0) || 0;
  const newTs = Date.parse(merged.publishedAt || 0) || 0;
  const keep =
    newTs >= existingTs ? { ...existing, ...merged } : { ...merged, ...existing };
  const [older, newer] = newTs >= existingTs ? [existing, merged] : [merged, existing];
  const i18n = { ...(older.i18n || {}) };
  for (const [lang, tr] of Object.entries(newer.i18n || {})) i18n[lang] = { ...(i18n[lang] || {}), ...tr };
  if (Object.keys(i18n).length) keep.i18n = i18n;

  const idx = data.items.findIndex(
    (x) => x.id === existing.id || (existing.url && x.url === existing.url)
  );
  if (idx >= 0) data.items[idx] = keep;
  byKey.set(keep.id, keep);
  if (keep.url) byKey.set(`url:${keep.url}`, keep);
  updated++;
}

data.items.sort(
  (a, b) => (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0)
);

const newest = data.items[0]?.publishedAt;
data.updatedAt =
  newest && Date.parse(newest) > Date.parse(data.updatedAt || 0)
    ? newest
    : new Date().toISOString().replace(/\.\d{3}Z$/, "+08:00");

if (dryRun) {
  console.log(
    JSON.stringify(
      { dryRun: true, added, updated, i18nWarnings: warnings.length, total: data.items.length, updatedAt: data.updatedAt },
      null,
      2
    )
  );
  process.exit(0);
}

fs.writeFileSync(DATA, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(
  JSON.stringify(
    { ok: true, added, updated, i18nWarnings: warnings.length, total: data.items.length, updatedAt: data.updatedAt },
    null,
    2
  )
);
