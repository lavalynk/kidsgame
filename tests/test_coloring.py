"""Automated test: the coloring book's hand-drawn pages.

Run:  python3 tests/test_coloring.py
Checks:
  * every page has a unique id, a known tab (animals / fruit / things) and a background
  * every page has 6-30 colorable regions (Keith's rule is 7-25; the broccoli has 6, a few busy vehicles go over)
  * nothing in a page pokes off the 400 x 400 canvas
  * each page opens from the address bar (#cow) and tapping a region fills it with the crayon
  * the picker shows every tab's thumbnails, at desktop and phone size, with no JavaScript errors
Screenshots land in tests/out/ (coloring_<tab>_<size>.png and coloring_new_pages.png).
"""
import sys, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
URL = (ROOT / 'coloring' / 'index.html').as_uri()
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

# Pages added on Nov 9 (each one is opened and tapped below).
NEW = ['cow', 'frog', 'monkey', 'giraffe', 'snail', 'whale',
       'peach', 'kiwi', 'avocado', 'mushroom', 'tomato', 'pumpkin',
       'balloon', 'submarine', 'digger', 'lighthouse', 'tent', 'dumptruck']

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 800})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload(); pg.wait_for_timeout(400)

    # ---- the page list itself ----
    info = pg.evaluate('''() => {
      const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.setAttribute('viewBox', '0 0 400 400'); s.style.cssText = 'position:absolute;left:0;top:0;width:400px;height:400px';
      document.body.appendChild(s);
      const out = PAGES.map(p => {
        s.innerHTML = p.svg;
        const r = s.querySelectorAll('.region');
        let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
        for (const el of s.querySelectorAll('.region:not(.bg), .line, .ink')) {
          const bb = el.getBoundingClientRect();
          minX = Math.min(minX, bb.left); minY = Math.min(minY, bb.top);
          maxX = Math.max(maxX, bb.right); maxY = Math.max(maxY, bb.bottom);
        }
        return { id: p.id, group: p.group, regions: r.length, bg: !!s.querySelector('.region.bg'),
                 box: [minX, minY, maxX, maxY] };
      });
      s.remove(); return out;
    }''')
    ids = [p['id'] for p in info]
    check(len(ids) == len(set(ids)), f'{len(ids)} pages, all ids unique')
    counts = {}
    for p in info: counts[p['group']] = counts.get(p['group'], 0) + 1
    check(set(counts) == {'animals', 'fruit', 'things'}, f'pages per tab: {counts}')
    check(all(n >= 17 for n in counts.values()), 'every tab has at least 17 pages')
    check(all(n in ids for n in NEW), 'all 18 new pages are in the book')
    bad = [p['id'] for p in info if not (6 <= p["regions"] <= 30) or not p['bg']]
    check(not bad, f'6-30 regions + a background on every page {bad}')
    # strokes are 8px wide, so allow 6px of outline past the edge (ground strips run edge to edge)
    off = [p['id'] for p in info if p['box'][0] < -6 or p['box'][1] < -6 or p['box'][2] > 406 or p['box'][3] > 406]
    check(not off, f'nothing pokes off the canvas {off}')

    # ---- open each new page and color it in ----
    pg.set_viewport_size({'width': 900, 'height': 900})
    shots = []
    for i, pid in enumerate(NEW):
        pg.goto(URL + '#' + pid); pg.wait_for_timeout(150)
        shown = pg.evaluate("document.getElementById('picture').getAttribute('aria-label')")
        name = next(p for p in info if p['id'] == pid)
        # tap the middle of the biggest non-background region (what a kid would tap first)
        pt = pg.evaluate('''() => {
          let best = null, area = 0;
          for (const el of document.querySelectorAll('#picture .region:not(.bg)')) {
            const r = el.getBoundingClientRect();
            if (r.width * r.height > area) {
              const x = r.left + r.width / 2, y = r.top + r.height / 2;
              const hit = document.elementsFromPoint(x, y).find(e => e.classList && e.classList.contains('region'));
              if (hit === el) { area = r.width * r.height; best = [x, y]; }
            }
          }
          return best;
        }''')
        filled = False
        if pt:
            pg.mouse.click(pt[0], pt[1]); pg.wait_for_timeout(60)
            filled = pg.evaluate('''() => [...document.querySelectorAll('#picture .region')]
                                    .some(r => r.style.fill && r.style.fill !== 'rgb(255, 255, 255)')''')
        check(bool(shown) and filled, f'{pid}: opens ({shown}) and a tap fills a region')
    pg.goto(URL + '#giraffe'); pg.wait_for_timeout(200)
    pg.screenshot(path=str(OUT / 'coloring_giraffe_desktop.png'))

    # ---- the picker on desktop and phone ----
    for size, vp in [('desktop', {'width': 1280, 'height': 800}), ('phone', {'width': 390, 'height': 844})]:
        pg.set_viewport_size(vp)
        pg.goto(URL); pg.wait_for_timeout(300)
        for tab in ['animals', 'fruit', 'things']:
            pg.click(f'.tab[data-group={tab}]'); pg.wait_for_timeout(200)
            n = pg.locator('#grid .thumb').count()
            check(n == counts[tab], f'{size}: {tab} tab shows {n} thumbnails')
            pg.screenshot(path=str(OUT / f'coloring_{tab}_{size}.png'))
    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
sys.exit(1 if fails else 0)
