const CACHE_NAME = 'kk-cache-v2';

// CDN resources worth caching for offline/repeat use
const CACHE_PREFIXES = [
    'https://cdnjs.cloudflare.com/ajax/libs/tone/',
    'https://tonejs.github.io/audio/salamander/',
    'https://cdn.jsdelivr.net/gh/nbrosowsky/tonejs-instruments@master/samples/',
    'https://fonts.googleapis.com/',
    'https://fonts.gstatic.com/',
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME));
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    // Delete old caches on update
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const url = event.request.url;
    const shouldCache = CACHE_PREFIXES.some(prefix => url.startsWith(prefix));
    if (!shouldCache) return;

    event.respondWith(
        caches.open(CACHE_NAME).then(cache =>
            cache.match(event.request).then(cached => {
                if (cached) return cached;
                return fetch(event.request).then(response => {
                    // Only cache successful responses
                    if (response.ok) cache.put(event.request, response.clone());
                    return response;
                });
            })
        )
    );
});
