/* membar service worker — MVP
 * Installable PWA + cache static Next.js assets for fast repeat loads.
 * HTML pages, API, and user data always go to network (no stale bias).
 */
const CACHE = "membar-static-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Skip API — always network
  if (url.pathname.startsWith("/api/")) return;

  // Cache-first for Next.js static chunks + images/fonts
  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|css)$/.test(url.pathname);

  if (!isStatic) return; // let HTML + everything else go to network normally

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
