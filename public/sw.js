// Network-first, cache-fallback service worker for offline use.
//
// The JS bundle filename is content-hashed per build (index-<hash>.js), so
// there's nothing fixed to precache by name — instead this caches whatever
// gets successfully fetched while online, and falls back to that cache when
// the network fails. That means offline use works after at least one
// successful online visit, which is the standard way PWAs handle this.
//
// Bump CACHE_NAME whenever this file itself changes meaningfully, so old
// entries get cleared out on activate instead of accumulating forever.
const CACHE_NAME = 'core-app-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle same-origin GET requests — let everything else (Supabase
  // API calls, cross-origin fonts, etc.) go straight to the network as
  // normal. Those need to fail loudly when offline, not silently return
  // stale cached data for a live database call.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        // Navigating to a fresh URL while offline with nothing cached yet —
        // fall back to the app shell so it at least loads instead of
        // showing the browser's own offline error page.
        if (request.mode === 'navigate') {
          const shell = await caches.match('/index.html');
          if (shell) return shell;
        }
        throw new Error('offline and not cached');
      })
  );
});
