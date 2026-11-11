// =====================================================================
// Offline play (the "service worker"): the browser runs this in the
// background. The first time the arcade opens, it saves a copy of every
// game on the device. After that the games open even with no internet
// (car trips, planes), straight from that copy.
//
// When a new version is pushed, tools/bump_version.py changes VERSION
// below. The browser notices sw.js changed, downloads a fresh copy of
// every file, and the next time the arcade opens it uses the new one.
//
// The list of files is written by tools/make_offline.py (don't edit by hand).
// Friends races still need the internet (the switchboard); everything else works offline.
// =====================================================================
// ---- generated: start ----
const VERSION = '20261111120534';
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'abc/index.html',
  'archery/index.html',
  'bike/index.html',
  'coloring/index.html',
  'fishing/index.html',
  'hoops/index.html',
  'house/index.html',
  'jungle/index.html',
  'maze/index.html',
  'piano/index.html',
  'rc/index.html',
  'space/index.html',
  'stickers/index.html',
  'trail/index.html',
  'abc/abc.js',
  'arcade/badges.js',
  'arcade/daily.js',
  'arcade/net.js',
  'arcade/shared.js',
  'arcade/stickers.js',
  'archery/archery.js',
  'bike/bike.js',
  'coloring/animals.js',
  'coloring/coloring.js',
  'coloring/fruit.js',
  'coloring/things.js',
  'fishing/fishing.js',
  'hoops/hoops.js',
  'house/house.js',
  'jungle/jungle.js',
  'maze/maze.js',
  'piano/piano.js',
  'piano/songs.js',
  'rc/rc.js',
  'space/art.js',
  'space/data.js',
  'space/space.js',
  'stickers/book.js',
  'trail/trail.js',
  'arcade/shared.css',
  'coloring/pages.css',
  'css/style.css',
  'arcade/fonts/LilitaOne-OFL.txt',
  'arcade/fonts/LilitaOne.woff2',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png'
];
// ---- generated: end ----
const CACHE = 'kids-arcade-' + VERSION;

// install: save every file (fresh from the network, not an old browser copy)
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(FILES.map(f => c.add(new Request(f, { cache: 'reload' })).catch(() => { /* skip one bad file */ }))))
    .then(() => self.skipWaiting()));
});
// activate: throw away copies of older versions
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('kids-arcade-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// every request: use the saved copy if there is one (fast, works offline);
// otherwise go to the network and save what comes back for next time.
// (ignoreSearch: "rc.js?v=123" finds the saved "rc.js")
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    } catch (err) {
      // offline and never saved: for a page, show the arcade home screen instead
      if (req.mode === 'navigate') return (await c.match('./index.html')) || Response.error();
      return Response.error();
    }
  }));
});
