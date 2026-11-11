"""Automated test: the coloring book's pages (plain HTML/CSS shapes since Nov 10).

Run:  python3 tests/test_coloring.py
Checks:
  * every page has a unique id, a known tab (animals / fruit / things) and a sky to color
  * every page has 7-22 colorable shapes, and no shape is too small for a finger
  * nothing pokes off the left, top or right of the picture (ground / water strips run edge to edge,
    and things may tuck into the ground at the bottom)
  * EVERY page opens from the address bar (#cow) and tapping its biggest shape fills it
  * brush, sticker, eraser, undo, redo and "start over" work; colors are saved and come back
  * a picture saved by the old SVG version doesn't break anything (its brush lines stay)
  * the picker shows every tab's thumbnails, at desktop and phone size, with no JavaScript errors
Screenshots land in tests/out/ (coloring_<tab>_<size>.png, coloring_tools.png).
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
URL = (ROOT / 'coloring' / 'index.html').as_uri()
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

# How many colored shapes are on screen
FILLED = "() => [...document.querySelectorAll('#picture > .r')].filter(r => r.style.getPropertyValue('--fill')).length"

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 800})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload(); pg.wait_for_timeout(400)

    # ---- the page list itself: draw each page at 400 x 400 and measure its shapes ----
    info = pg.evaluate('''() => {
      const d = document.createElement('div');
      d.className = 'page'; d.style.cssText = 'position:absolute;left:0;top:0;width:400px';
      document.body.appendChild(d);
      const out = PAGES.map(p => {
        d.innerHTML = p.html;
        const r = [...d.querySelectorAll(':scope > .r')];
        let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9, tiny = 0;
        for (const el of d.querySelectorAll(':scope > i:not(.bg)')) {
          const bb = el.getBoundingClientRect();
          if (bb.width > 380) continue;              // ground / water / road strips
          minX = Math.min(minX, bb.left); minY = Math.min(minY, bb.top);
          maxX = Math.max(maxX, bb.right); maxY = Math.max(maxY, bb.bottom);
        }
        for (const el of r) { const s = el.style; if (Math.min(+s.getPropertyValue('--w'), +s.getPropertyValue('--h')) < 16) tiny++; }
        return { id: p.id, group: p.group, html: !!p.html, regions: r.length, tiny,
                 bg: !!d.querySelector(':scope > .r.bg'), box: [minX, minY, maxX, maxY] };
      });
      d.remove(); return out;
    }''')
    ids = [p['id'] for p in info]
    check(len(ids) == len(set(ids)), f'{len(ids)} pages, all ids unique')
    check(all(p['html'] for p in info), 'every page is HTML shapes (page.html)')
    counts = {}
    for p in info: counts[p['group']] = counts.get(p['group'], 0) + 1
    check(set(counts) == {'animals', 'fruit', 'things'}, f'pages per tab: {counts}')
    check(all(n >= 30 for n in counts.values()), 'every tab has at least 30 pages')
    bad = [(p['id'], p['regions']) for p in info if not (7 <= p['regions'] <= 22) or not p['bg']]
    check(not bad, f'7-22 colorable shapes + a sky on every page {bad}')
    tiny = [p['id'] for p in info if p['tiny']]
    check(not tiny, f'no colorable shape thinner than 16 units {tiny}')
    off = [p['id'] for p in info if p['box'][0] < -2 or p['box'][1] < -2 or p['box'][2] > 402]
    check(not off, f'nothing pokes off the picture {off}')

    # ---- open EVERY page and color it in ----
    pg.set_viewport_size({'width': 900, 'height': 900})
    opened = []
    for pid in ids:
        pg.goto(URL + '#' + pid); pg.wait_for_timeout(60)
        shown = pg.evaluate("document.getElementById('picture').getAttribute('aria-label')")
        # tap the middle of the biggest shape that's really on top there (what a kid would tap first)
        pt = pg.evaluate('''() => {
          let best = null, area = 0;
          for (const el of document.querySelectorAll('#picture > .r:not(.bg)')) {
            const r = el.getBoundingClientRect();
            if (r.width * r.height > area) {
              const x = r.left + r.width / 2, y = r.top + r.height / 2;
              const hit = document.elementsFromPoint(x, y).map(e => e.closest && e.closest('.r')).find(e => e);
              if (hit === el) { area = r.width * r.height; best = [x, y]; }
            }
          }
          return best;
        }''')
        filled = 0
        if pt:
            pg.mouse.click(pt[0], pt[1]); pg.wait_for_timeout(30)
            filled = pg.evaluate(FILLED)
        if shown and filled == 1: opened.append(pid)
        else: print('   ', pid, shown, filled)
    check(len(opened) == len(ids), f'all {len(ids)} pages open and a tap fills one shape ({len(opened)})')

    # ---- the tools on one page ----
    pg.evaluate('localStorage.clear()')
    pg.goto(URL + '#cat'); pg.reload(); pg.wait_for_timeout(200)
    pg.click('.tool[data-tool=fill]')
    pg.locator('.crayon:not(.special)').nth(2).click()
    box = pg.locator('#picture').bounding_box()
    at = lambda x, y: (box['x'] + box['width'] * x / 400, box['y'] + box['height'] * y / 400)
    before = pg.evaluate(FILLED)
    pg.mouse.click(*at(200, 120))              # the cat's head
    pg.mouse.click(*at(30, 30))                # the sky
    check(pg.evaluate(FILLED) == before + 2, 'fill: head and sky get colored')
    pg.click('#undo'); check(pg.evaluate(FILLED) == before + 1, 'undo takes the last color back')
    pg.click('#redo'); check(pg.evaluate(FILLED) == before + 2, 'redo puts it back')
    pg.click('.tool[data-tool=brush]')
    pg.mouse.move(*at(60, 60)); pg.mouse.down(); pg.mouse.move(*at(120, 80), steps=8); pg.mouse.move(*at(160, 60), steps=8); pg.mouse.up()
    check(pg.locator('#picture .art-layer .stroke').count() == 1, 'brush draws a line on top')
    pg.click('.tool[data-tool=sticker]')
    pg.mouse.click(*at(330, 80))
    check(pg.locator('#picture .art-layer .sticker').count() == 1, 'a sticker lands where you tap')
    pg.screenshot(path=str(OUT / 'coloring_tools.png'))
    pg.click('.tool[data-tool=eraser]')
    pg.mouse.click(*at(330, 80))
    check(pg.locator('#picture .art-layer .sticker').count() == 0, 'the eraser rubs out the sticker')
    pg.wait_for_timeout(400)                   # auto-save waits a moment
    pg.reload(); pg.wait_for_timeout(300)
    st = pg.evaluate(f"({FILLED})()")
    check(st >= 2 and pg.locator('#picture .art-layer .stroke').count() == 1, f'colors + brush line come back after a reload ({st})')
    pg.click('#clear'); check(pg.evaluate(FILLED) == 0 and pg.locator('#picture .stroke').count() == 0, '"start over" clears the page')
    pg.click('#undo'); check(pg.evaluate(FILLED) >= 2, '...and can be undone')

    # ---- a picture saved by the old SVG version ----
    pg.evaluate('''() => localStorage.setItem('kidsColoring.v1', JSON.stringify({ pages: { dog: {
        fills: ['#ef476f', '#ffd166', '', '#06d6a0'], strokes: [{ d: 'M50 50 L150 150', c: '#118ab2', w: 18 }], stickers: [] } },
        gallery: [], custom: [], palette: 0 }))''')
    pg.goto(URL + '#dog'); pg.reload(); pg.wait_for_timeout(300)
    check(pg.evaluate(FILLED) == 0 and pg.locator('#picture .stroke').count() == 1,
          'an old (SVG) save opens: its brush line stays, its old colors are skipped')

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
