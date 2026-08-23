const CACHE_NAME = 'saju-pwa-v107';
// 배포 위치를 하드코딩하지 않는다.
// GitHub Pages는 /saju-manseryeok/ 아래, Cloudflare Pages는 루트에 올라가는데
// 서비스워커는 자기가 있는 자리를 알고 있으므로 거기서 알아내면 된다.
const BASE = new URL('./', self.location).pathname;

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req).then(response => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
      }
      return response;
    }).catch(() => {
      return caches.match(req).then(cached => {
        if (cached) return cached;
        if (req.mode === 'navigate') return caches.match(BASE + 'index.html');
        return new Response('', { status: 408 });
      });
    })
  );
});
