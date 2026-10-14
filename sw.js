// Minimal service worker: cache-first app shell, network-first data.
const VERSION = "v2-2026-10-14-xicon";
const SHELL = `xh-shell-${VERSION}`;
const DATA = `xh-data-${VERSION}`;
const SHELL_FILES = [
  "/", "/index.html", "/styles.css", "/app.js", "/i18n.js",
  "/manifest.webmanifest", "/favicon.svg", "/icons/icon-192.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== DATA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req, { cache: "no-store" });
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    throw err;
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(SHELL);
  const hit = await cache.match(req, { ignoreSearch: true });
  const net = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
  return hit || net;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // tiles, Leaflet CDN, fonts: browser default
  if (url.pathname.startsWith("/data/")) { e.respondWith(networkFirst(req, DATA)); return; }
  if (req.mode === "navigate") { e.respondWith(networkFirst(req, SHELL)); return; }
  e.respondWith(staleWhileRevalidate(req));
});
