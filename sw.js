const CACHE = "pccc-mwwui71g";
const SHELL = ["/","/assets/shim.js","/assets/config.js","/assets/icon-192.png","/assets/icon-512.png","/assets/apple-touch-icon.png","/xe/bks-15cd-000-04/","/xe/bks-15cd-000-04/manifest.webmanifest","/xe/bks-15a-006-81/","/xe/bks-15a-006-81/manifest.webmanifest","/xe/bks-15a-007-04/","/xe/bks-15a-007-04/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Mạng trước, mất mạng thì dùng bản đã lưu. Chỉ xử lý tài nguyên cùng trang web.
// Lời gọi tới Apps Script đi qua thẻ <script> nên không đi qua service worker.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          e.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || new Response("Không có mạng.", {
        status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" }
      })))
  );
});
