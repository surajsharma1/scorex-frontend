// ─────────────────────────────────────────────────────────────────────────────
// ScoreX Service Worker
// Strategy:
//   • /assets/*  → Cache-first (Vite hashes filenames, safe to cache forever)
//   • /overlays/* → Network-only (OBS overlays must always be fresh)
//   • index.html  → Network-first with 3s timeout fallback to cache
//   • Everything else → Network-first
//
// VERSIONING: bump CACHE_VERSION on every deploy to force all clients to
// discard old caches and re-fetch everything fresh.
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_VERSION = 'scorex-v1';
const ASSETS_CACHE  = `${CACHE_VERSION}-assets`;
const PAGES_CACHE   = `${CACHE_VERSION}-pages`;

// These are always fetched from network — never cached
const NETWORK_ONLY = [
  '/overlays/',
  '/api/',
  '/socket.io/',
];

// ── Install: pre-cache the app shell ────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGES_CACHE).then((cache) =>
      cache.addAll(['/'])
    ).then(() => self.skipWaiting())
  );
});

// ── Activate: delete ALL old caches from previous versions ──────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(key => key !== ASSETS_CACHE && key !== PAGES_CACHE)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: route each request to the right strategy ─────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests (Razorpay, backend, etc.)
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;

  // Network-only: overlays, API, socket
  if (NETWORK_ONLY.some(p => path.startsWith(p))) {
    event.respondWith(fetch(request));
    return;
  }

  // Cache-first: Vite hashed assets (/assets/index-AbCdEf.js)
  // These filenames change on every build so it's safe to cache forever
  if (path.startsWith('/assets/')) {
    event.respondWith(
      caches.open(ASSETS_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // Network-first with 3s timeout: HTML pages (including index.html)
  // Falls back to cache if network is slow/offline
  event.respondWith(networkFirstWithTimeout(request, 3000));
});

// ── Network-first with timeout helper ───────────────────────────────────────
async function networkFirstWithTimeout(request, timeoutMs) {
  const cache = await caches.open(PAGES_CACHE);

  try {
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeoutMs)
      ),
    ]);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Network failed or timed out — serve from cache
    const cached = await cache.match(request);
    if (cached) return cached;

    // Last resort: return cached index.html for any navigation request
    if (request.mode === 'navigate') {
      const indexFallback = await cache.match('/');
      if (indexFallback) return indexFallback;
    }

    // Completely offline and nothing cached — return a simple offline response
    return new Response(
      '<html><body style="background:#0a0a0a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1 style="color:#39ff14">ScoreX</h1><p>You are offline. Please check your internet connection.</p></div></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// ── Message: force update from app ──────────────────────────────────────────
// Call this from your app: navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
