// =====================================================================
// Offline play (the "service worker"): the browser runs this in the
// background. The first time the arcade opens, it saves a copy of every
// game on the device. After that the games open even with no internet
// (car trips, planes), straight from that copy.
//
// When a new version is pushed, tools/bump_version.py changes VERSION
// below (the same number as the ?v= on every script link). The browser
// notices sw.js changed and downloads a fresh copy of every file.
//
// Pages (the hub and each game's index.html) come from the internet FIRST
// when there is internet, and from the saved copy only when offline (Keith,
// Nov 21: the arcade opened with an OLD hub, and the new one only showed
// after going into a game and back). Scripts are saved with their ?v=, so a
// new page never gets an old script.
//
// The list of files is written by tools/make_offline.py (don't edit by hand).
// Friends races still need the internet (the switchboard); everything else works offline.
// =====================================================================
// ---- generated: start ----
const VERSION = '202611220441';
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'abc/index.html',
  'archery/index.html',
  'bike/index.html',
  'coloring/index.html',
  'fishing/index.html',
  'golf/index.html',
  'hoops/index.html',
  'house/index.html',
  'jukebox/index.html',
  'jungle/index.html',
  'maze/index.html',
  'parent/index.html',
  'piano/index.html',
  'quest/index.html',
  'rc/index.html',
  'space/index.html',
  'stickers/index.html',
  'trail/index.html',
  'abc/abc.js',
  'arcade/badges.js',
  'arcade/canvasmenu.js',
  'arcade/daily.js',
  'arcade/gsap.min.js',
  'arcade/net.js',
  'arcade/parent.js',
  'arcade/phaser.min.js',
  'arcade/rexui.min.js',
  'arcade/shared.js',
  'arcade/stickers.js',
  'arcade/swiper.min.js',
  'archery/archery.js',
  'bike/bike.js',
  'coloring/animals.js',
  'coloring/coloring.js',
  'coloring/fruit.js',
  'coloring/render.js',
  'coloring/things.js',
  'fishing/aquarium.js',
  'fishing/fishing.js',
  'golf/golf.js',
  'hoops/hoops.js',
  'house/house.js',
  'jukebox/jukebox.js',
  'jukebox/songs.js',
  'jungle/jungle.js',
  'maze/maze.js',
  'parent/parent.js',
  'piano/piano.js',
  'piano/songs.js',
  'quest/art.js',
  'quest/quest.js',
  'rc/builder.js',
  'rc/rc.js',
  'space/art.js',
  'space/data.js',
  'space/space.js',
  'stickers/book.js',
  'trail/trail.js',
  'arcade/shared.css',
  'arcade/swiper.min.css',
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
// scripts and styles are asked for as "rc.js?v=<VERSION>" by the pages: save them under that name
const withV = (f) => /\.(js|css)$/.test(f) ? f + '?v=' + VERSION : f;

// install: save every file (fresh from the network, not an old browser copy)
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(FILES.map(f => c.add(new Request(withV(f), { cache: 'reload' })).catch(() => { /* skip one bad file */ }))))
    .then(() => self.skipWaiting()));
});
// activate: throw away copies of older versions
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('kids-arcade-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// every request:
//  * a page: the internet first (so the arcade always opens on the newest version), the saved copy when
//    offline or when the internet is very slow (3 s)
//  * anything else: the saved copy with exactly the same name (fast, works offline); otherwise the internet
//    (and save it); offline and never saved under that name: any saved copy of that file (ignoring ?v=)
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const saved = async () => (await c.match(req)) || (await c.match(req, { ignoreSearch: true }));
    if (req.mode === 'navigate') {
      try {
        const res = await Promise.race([
          fetch(req, { cache: 'no-cache' }),
          new Promise((_, no) => setTimeout(() => no(new Error('slow')), 3000)),
        ]);
        if (res.ok) { c.put(req, res.clone()); return res; }
      } catch (err) { /* offline or slow: the saved copy below */ }
      return (await saved()) || (await c.match('./index.html')) || Response.error();
    }
    const hit = await c.match(req);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    } catch (err) {
      return (await saved()) || Response.error();
    }
  }));
});
