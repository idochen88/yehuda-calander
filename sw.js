// Offline support: keeps a copy of the app's files on the phone.
// Only the app's own files are cached — sales data lives in localStorage and never leaves the device.
var CACHE = 'yehuda-calendar-v3';
var FILES = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', function (e) {
  // cache: 'reload' skips the browser's HTTP cache, so a new version is picked up right away
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(FILES.map(function (f) { return new Request(f, { cache: 'reload' }); }));
  }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Serve from the cache right away (works offline), and refresh it in the background
// so a newer version of the app shows up on the next launch.
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(e.request, { ignoreSearch: true }).then(function (cached) {
      var fresh = fetch(e.request.url, { cache: 'no-cache' }).then(function (res) {
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      }).catch(function () { return cached; });
      if (cached) { e.waitUntil(fresh); return cached; }
      return fresh;
    });
  }));
});
