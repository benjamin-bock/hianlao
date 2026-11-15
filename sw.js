// HianLao service worker: offline-first PWA.
// - API calls (/api/*) always go to the network.
// - Navigations: network-first, fallback to cache (then index.html).
// - Core assets (JS/CSS/HTML): network-first, fallback to cache — so updates
//   reach learners on the very next reload, while offline still works.
// - Audio: cache-first (immutable generated files).
const CACHE = 'hianlao-v5';
const CORE = [
  './', 'index.html', 'learn.html', 'lesson.html', 'words.html', 'grammar.html',
  'culture.html', 'account.html', 'review.html',
  'assets/css/main.css', 'assets/img/logo.svg',
  'assets/js/main.js', 'assets/js/store.js', 'assets/js/ui.js', 'assets/js/speech.js',
  'assets/js/audio-manifest.js',
  'assets/js/home.js', 'assets/js/learn.js', 'assets/js/lesson.js', 'assets/js/words.js',
  'assets/js/grammarpage.js', 'assets/js/culturepage.js', 'assets/js/account.js', 'assets/js/review.js',
  'assets/js/achievements.js',
  'assets/js/data/vocab.js', 'assets/js/data/units.js', 'assets/js/data/grammar.js', 'assets/js/data/culture.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return; // network only
  if (url.origin !== location.origin) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return r;
        })
        .catch(() => caches.match(e.request).then((m) => m || caches.match('index.html')))
    );
    return;
  }

  const isAudio = /\.(mp3|m4a|ogg|wav)$/i.test(url.pathname);
  if (isAudio) {
    e.respondWith(
      caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
        if (r.ok) {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return r;
      }))
    );
    return;
  }

  // Everything else: network-first so content updates land on reload.
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (r.ok) {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return r;
      })
      .catch(() => caches.match(e.request).then((m) => m || Response.error()))
  );
});
