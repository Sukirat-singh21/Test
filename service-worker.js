/* ───────────────────────────────────────────────────────────
   Service worker — Study Grove
   Strategy: NETWORK-FIRST for everything (HTML, JS, CSS, icons).

   Rationale: this app iterates fast, and "stale-while-revalidate" kept
   handing back yesterday's JS/CSS on the very first load after a deploy
   (the fresh copy only landed in time for the NEXT load). Network-first
   means: when you're online you ALWAYS get the newest files; the cache is
   only a fallback for when the network fails (offline / flaky). That keeps
   the PWA fully usable offline while never showing stale code to a live user.
   ─────────────────────────────────────────────────────────── */

const CACHE = 'study-grove-v76-bloom-chart-alignment';
const ASSETS = [
  './', 'index.html', 'style-rebuild.css', 'style-rebuild.css?v=62', 'style.css', 'style.css?v=mobile-legacy-4', 'style-mobile-polish.css', 'style-mobile-polish.css?v=30', 'app.js', 'app.js?v=53', 'sound.js', 'firebase.js', 'manifest.json',
  'icon-192.png', 'icon-512.png',
  'assets/branding/study-grove-icon.png', 'assets/branding/study-grove-icon-192.png', 'assets/branding/study-grove-icon-512.png',
  'assets/textures/grove.webp', 'assets/textures/grove.jpg',
  'assets/textures/lagoon.webp', 'assets/textures/lagoon.jpg',
  'assets/textures/hearth.webp', 'assets/textures/hearth.jpg',
  'assets/textures/grove-immersive.png', 'assets/textures/lagoon-immersive.png', 'assets/textures/hearth-immersive.png',
  'assets/previews/grove.webp', 'assets/previews/grove.jpg',
  'assets/previews/lagoon.webp', 'assets/previews/lagoon.jpg',
  'assets/previews/hearth.webp', 'assets/previews/hearth.jpg',
  'assets/photos/study-desk-mobile.webp', 'assets/photos/study-desk-mobile.jpg',
  'assets/photos/study-desk-desktop.webp', 'assets/photos/study-desk-desktop.jpg',
  'assets/sounds/shared/kenney-click.mp3', 'assets/sounds/shared/kenney-toggle.mp3',
  'assets/sounds/grove/wood-click.mp3', 'assets/sounds/grove/wood-creak.mp3',
  'assets/sounds/lagoon/water-drop.mp3',
  'assets/sounds/hearth/fire-crackle-short.mp3', 'assets/sounds/hearth/fire-crackle-loop.mp3',
  'assets/sounds/mythic/wind-chimes.mp3'
];

// Always bypass the cache for the service worker file itself so the browser
// can perform a fresh byte-for-byte update check on every fetch.
const SW_URL = self.location.href;

// Pre-populate the cache so offline works on first visit. We do NOT call
// skipWaiting() here on purpose: the in-page update banner (see index.html)
// handles the polite "refresh to update" prompt, so a running session
// isn't yanked out from under the user. Network-first fetching (below)
// means even the existing worker already serves fresh files while online,
// so waiting on activation never costs you stale code.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', event => {
  // Purge every OLD cache so a new release can't accidentally serve a
  // mismatched mix of last version's files.
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => k !== CACHE ? caches.delete(k) : null)))
      .then(() => self.clients.claim())
  );
});

// Lets the page force this waiting worker to activate immediately, right
// after the user taps the in-app "update available" prompt. Kept for
// compatibility with the existing update flow in index.html.
self.addEventListener('message', event => {
  const isSkip = event.data === 'SKIP_WAITING' || (event.data && event.data.type === 'SKIP_WAITING');
  if (isSkip) self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  // Never cache or intercept the service worker file itself — let the browser
  // always fetch a fresh copy for its update-check algorithm.
  if (event.request.url === SW_URL) return;

  // Network-first for ALL same-origin GETs (navigations, JS, CSS, icons).
  // Try the network; on success cache a fresh copy and return it. Only if
  // the network fails do we serve from cache — so offline still works but
  // online users never see stale code.
  const networkFirst = fetch(event.request)
    .then(resp => {
      // Only cache valid same-origin responses (skip opaque/error ones).
      if (resp && resp.status === 200 && resp.type === 'basic') {
        const copy = resp.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {});
      }
      return resp;
    })
    .catch(() =>
      // Offline / network error: fall back to cache, then to index.html.
      caches.open(CACHE).then(cache =>
        cache.match(event.request).then(cached => cached || cache.match('index.html'))
      )
    );

  event.respondWith(networkFirst);
});
