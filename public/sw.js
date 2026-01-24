const CACHE_NAME = 'kk-cache-v1';
const MATCHES = [
  'https://cdnjs.cloudflare.com/ajax/libs/tone/',
  'https://tonejs.github.io/audio/salamander/'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME));
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  const shouldCache = MATCHES.some(prefix => url.startsWith(prefix));
  if (!shouldCache) return;
  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(resp => {
        if (resp) return resp;
        return fetch(event.request).then(netResp => {
          cache.put(event.request, netResp.clone());
          return netResp;
        });
      })
    )
  );
});
