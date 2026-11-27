// "My pictures" in the browser's BIG storage (Nov 27, 20-point plan #5).
//
// Until now the coloring book kept the pictures a child hangs on the wall inside its
// localStorage save. localStorage is small (about 5 MB for the WHOLE arcade on most
// phones), so after a few dozen pictures with brush lines it could fill up and new
// pictures quietly stopped saving. IndexedDB, the browser's bigger storage, has room
// for hundreds of megabytes. The little idb-keyval library (arcade/idb-keyval.min.js,
// Apache-2.0, see arcade/LIBRARIES.md) makes it as easy as localStorage:
//     idbKeyval.get(key) / idbKeyval.set(key, value)   (both give a Promise)
//
// window.ColorGallery is used by the coloring book AND My House (the Art Room's wall):
//   ColorGallery.load(saveKey)       -> Promise of the player's pictures (newest first).
//                                       The first time it also MOVES the old pictures
//                                       out of the localStorage save (only after they are
//                                       safely stored in IndexedDB).
//   ColorGallery.save(saveKey, list) -> stores the whole list.
//   ColorGallery.mode                -> 'idb' (big storage) or 'local' (no IndexedDB here,
//                                       e.g. some private windows: the old way, in localStorage)
//   ColorGallery.MAX                 -> how many pictures we keep (the oldest one goes after that)
// saveKey is the coloring book's save name for the player ('kidsColoring.v1', '...v1.p2').
(function () {
  const MAX = 300;                                   // was 60 in localStorage
  const idbKey = (saveKey) => 'gallery:' + saveKey;   // the name in IndexedDB
  const idb = window.idbKeyval && window.indexedDB ? window.idbKeyval : null;

  // the old localStorage save (pages, palette... and, before Nov 27, the gallery)
  function readLocal(saveKey) {
    try { return JSON.parse(localStorage.getItem(saveKey)) || {}; } catch (e) { return {}; }
  }
  function writeLocal(saveKey, obj) {
    try { localStorage.setItem(saveKey, JSON.stringify(obj)); return true; } catch (e) { return false; }
  }
  // put two lists together: every picture once (by its id), newest first
  function merge(a, b) {
    const seen = new Set(), out = [];
    for (const art of [].concat(a || [], b || [])) {
      if (!art || !art.id || seen.has(art.id)) continue;
      seen.add(art.id); out.push(art);
    }
    return out.sort((x, y) => (y.t || 0) - (x.t || 0)).slice(0, MAX);
  }

  const G = {
    MAX, mode: idb ? 'idb' : 'local', merge,
    load(saveKey) {
      const old = readLocal(saveKey).gallery || [];
      if (!idb) return Promise.resolve(old.slice(0, MAX));
      return idb.get(idbKey(saveKey)).then((list) => {
        if (!old.length) return list || [];
        // move the old pictures over: store them first, THEN take them out of localStorage
        const all = merge(list, old);
        return idb.set(idbKey(saveKey), all).then(() => {
          const s = readLocal(saveKey); delete s.gallery; writeLocal(saveKey, s);
          G.moved = (G.moved || 0) + old.length;
          return all;
        });
      }).catch(() => {                               // IndexedDB said no (blocked, broken): the old way
        G.mode = 'local';
        return old.slice(0, MAX);
      });
    },
    save(saveKey, list) {
      list = (list || []).slice(0, MAX);
      if (G.mode === 'idb') {
        return idb.set(idbKey(saveKey), list).catch(() => { G.mode = 'local'; return G.save(saveKey, list); });
      }
      // no big storage: in the localStorage save, like before (if it's full, keep dropping the oldest)
      const s = readLocal(saveKey);
      for (let n = Math.min(list.length, 60); n >= 0; n = n ? Math.floor(n * 0.8) : -1) {
        s.gallery = list.slice(0, n);
        if (writeLocal(saveKey, s)) break;
      }
      return Promise.resolve();
    },
  };
  window.ColorGallery = G;
})();
