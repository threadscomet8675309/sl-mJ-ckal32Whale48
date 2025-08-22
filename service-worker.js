// service-worker.js (v3 - offline-first nav)
const CACHE = 'facetime-easy-v3';
const SCOPE = self.registration.scope;
const INDEX_URLS = [
  new URL('./', SCOPE).toString(),
  new URL('./index.html', SCOPE).toString()
];
const ASSETS = [
  ...INDEX_URLS,
  new URL('./manifest.webmanifest', SCOPE).toString(),
  new URL('./icons/icon-180.png', SCOPE).toString(),
  new URL('./icons/icon-192.png', SCOPE).toString(),
  new URL('./icons/icon-512.png', SCOPE).toString(),
];
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    self.skipWaiting();
  })());
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE) ? caches.delete(k) : Promise.resolve()));
    self.clients.claim();
  })());
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (req.mode === 'navigate' || (req.destination === 'document')) {
      for (const url of INDEX_URLS) {
        const hit = await cache.match(url, {ignoreVary: true, ignoreSearch: true});
        if (hit) return hit;
      }
      try {
        const resp = await fetch(req, {cache:'no-store'});
        return resp;
      } catch (_) {
        return new Response('Offline', {status:503, statusText:'Offline'});
      }
    }
    const cached = await cache.match(req, {ignoreVary:true, ignoreSearch:true});
    if (cached) return cached;
    try {
      const resp = await fetch(req, {cache:'no-store'});
      return resp;
    } catch (_) {
      return new Response('Offline', {status:503, statusText:'Offline'});
    }
  })());
});
