const CACHE = 'coachboard-shell-v1';
const SHELL = ['./', './index.html', './style.css', './script.js', './auth.js', './manifest.webmanifest', './icon.svg'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('coachboard-shell-') && key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    if (request.mode === 'navigate') {
      event.respondWith(fetch(request).then(response => {
        if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put('./index.html', copy)); }
        return response;
      }).catch(() => caches.match('./index.html')));
      return;
    }
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(request, copy)); }
      return response;
    })));
    return;
  }
  // Cache only Firebase's versioned public JS modules; never cache API responses or private data.
  if (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok || response.type === 'opaque') { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(request, copy)); }
      return response;
    })));
  }
});