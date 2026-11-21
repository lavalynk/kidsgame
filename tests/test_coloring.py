"""Automated test: the coloring book's pages (plain HTML/CSS shapes since Nov 10).

Run:  python3 tests/test_coloring.py
Checks:
  * every page has a unique id, a known tab (animals / fruit / things) and a sky to color
  * every page has 7-22 colorable shapes, and no shape is too small for a finger
  * nothing pokes off the left, top or right of the picture (ground / water strips run edge to edge,
    and things may tuck into the ground at the bottom)
  * EVERY page opens from the address bar (#cow) and tapping its biggest shape fills it
  * brush, sticker, eraser, undo, redo and "start over" work; colors are saved and come back
  * a sticker can be colored with a crayon (and undone); the color is saved
  * coloring the LAST part of a picture pops up "Done!" (not before); "hang it" saves it to My pictures
  * render.js draws every page as SVG for My House (same parts, no errors)
  * a picture saved by the old SVG version doesn't break anything (its brush lines stay)
  * the picker (drawn by Phaser + Rex UI since Nov 21) shows every tab's pictures at desktop, phone and sideways size,
    big enough and on the screen; a tap opens a picture; My pictures opens and removes (two taps) a saved one
Screenshots land in tests/out/ (coloring_<tab>_<size>.png, coloring_tools.png).
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from cmenu import wait_screen, items, find, tap
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

    # ---- colorable stickers (Nov 12) ----
    pg.click('#clear')
    pg.click('.tool[data-tool=sticker]'); pg.mouse.click(*at(330, 80))
    pg.click('.tool[data-tool=fill]'); pg.locator('.crayon:not(.special)').nth(3).click()   # back to the fill tool + a crayon
    col = pg.evaluate('getComputedStyle(document.body).getPropertyValue("--cur").trim()')
    pg.mouse.click(*at(330, 80))
    sc = pg.evaluate("document.querySelector('#picture .sticker').__data.c")
    check(sc == col and col in pg.inner_html('#picture .sticker'), f'fill tool colors a sticker ({sc})')
    check(pg.evaluate(FILLED) == 0, '...and not the part under it')
    pg.click('#undo'); check(not pg.evaluate("document.querySelector('#picture .sticker').__data.c"), 'undo gives the sticker its own color back')
    pg.click('#redo'); pg.wait_for_timeout(400)
    saved_c = pg.evaluate("JSON.parse(localStorage.getItem('kidsColoring.v1')).pages.cat.stickers[0].c")
    check(saved_c == col, 'the sticker color is saved')
    pg.click('#clear')

    # ---- "Done!" when every part has a color (Nov 12) ----
    n = pg.evaluate("document.querySelectorAll('#picture > .r:not(.bg)').length")
    pts = pg.evaluate('''() => [...document.querySelectorAll('#picture > .r:not(.bg)')].map(r => {
        // a point inside this part that this part (not a later one) owns
        const b = r.getBoundingClientRect();
        for (let fy = 0.05; fy < 1; fy += 0.05) for (let fx = 0.05; fx < 1; fx += 0.05) {
          const x = b.left + b.width * fx, y = b.top + b.height * fy;
          if (document.elementsFromPoint(x, y).map(e => e.closest('.r')).find(Boolean) === r) return [x, y];
        }
        return null; })''')
    check(all(pts), f'every part of the cat can be tapped ({n} parts)')
    # (Nov 21: "Done!" is drawn by Phaser + Rex UI: screen 'coloring-done', buttons 'hang' + 'ok')
    done_open = lambda: pg.evaluate("ArcadeMenus.isOpen && ArcadeMenus.screen() === 'coloring-done'")
    for i, p in enumerate(pts):
        if i == len(pts) - 1: check(not done_open(), 'no "Done!" while a part is still white')
        if p: pg.mouse.click(*p)
    pg.wait_for_timeout(300)
    wait_screen(pg, 'coloring-done')
    check(done_open(), '"Done!" pops up when the last part gets a color')
    check(pg.evaluate("ArcadeMenus.current().rows[0].items.length") == 2, '"Done!" shows the finished picture next to the star')
    pg.screenshot(path=str(OUT / 'coloring_done.png'))
    gal = lambda: pg.evaluate("(JSON.parse(localStorage.getItem('kidsColoring.v1')) || {}).gallery.length")
    g0 = gal(); tap(pg, 'hang'); pg.wait_for_timeout(400)
    check(not done_open() and gal() == g0 + 1, '"hang it on my wall" saves it to My pictures')
    pg.click('#clear')

    # ---- every page as SVG (for My House's Art Room) ----
    r = pg.evaluate('''() => PAGES.map(p => {
        const d = document.createElement('div'); d.innerHTML = p.html;
        const n = d.querySelectorAll(':scope > .r').length;
        const fills = Array.from({ length: n }, () => '#06d6a0');
        const svg = ColorArt.pageSVG(p, { v: 2, fills, strokes: [], stickers: [] });
        return (svg.match(/#06d6a0/g) || []).length === n && !/NaN|undefined/.test(svg) ? null : p.id; }).filter(Boolean)''')
    check(not r, f'render.js draws every page as SVG with all its parts ({r})')

    # ---- a picture saved by the old SVG version ----
    pg.evaluate('''() => localStorage.setItem('kidsColoring.v1', JSON.stringify({ pages: { dog: {
        fills: ['#ef476f', '#ffd166', '', '#06d6a0'], strokes: [{ d: 'M50 50 L150 150', c: '#118ab2', w: 18 }], stickers: [] } },
        gallery: [], custom: [], palette: 0 }))''')
    pg.goto(URL + '#dog'); pg.reload(); pg.wait_for_timeout(300)
    check(pg.evaluate(FILLED) == 0 and pg.locator('#picture .stroke').count() == 1,
          'an old (SVG) save opens: its brush line stays, its old colors are skipped')

    # ---- the picker on desktop and phone (Nov 21: drawn by Phaser + Rex UI, screen 'coloring-pick') ----
    pg.evaluate('localStorage.clear()')
    for size, vp, touch in [('desktop', {'width': 1280, 'height': 800}, False), ('phone', {'width': 390, 'height': 844}, True),
                            ('sideways', {'width': 844, 'height': 390}, True)]:
        ctx = b.new_context(viewport=vp, has_touch=touch)
        pp = ctx.new_page(); pp.on('pageerror', lambda e: errors.append(str(e)))
        pp.goto(URL); wait_screen(pp, 'coloring-pick')
        for tab in ['animals', 'fruit', 'things']:
            tap(pp, 'tab-' + tab, touch); pp.wait_for_timeout(300)
            its = [i for i in items(pp) if i['attr'].startswith('page-')]
            check(len(its) == counts[tab], f'{size}: {tab} tab shows {len(its)} pictures')
            picked = [i['attr'] for i in items(pp) if i['picked']]
            check(picked == ['tab-' + tab], f'{size}: the {tab} tab is the yellow one')
            # (the pictures are big for little fingers; buttons at least 44 px like every game's canvas menus)
            big = all(min(i['w'], i['h']) >= (70 if i['attr'].startswith('page-') else 44) for i in items(pp) if i['shown'])
            check(big, f'{size}: pictures at least 70 px, buttons at least 44 px')
            inside = all(i['x'] >= 0 and i['y'] >= 0 and i['x'] + i['w'] <= vp['width'] + 1 and i['y'] + i['h'] <= vp['height'] + 1 for i in items(pp) if i['shown'])
            check(inside, f'{size}: nothing on the {tab} tab is off the screen')
            pp.screenshot(path=str(OUT / f'coloring_{tab}_{size}.png'))
        # tap a picture: it opens; the "all pictures" button brings the picker back
        first = [i for i in items(pp) if i['attr'].startswith('page-')][0]['attr']
        tap(pp, first, touch); pp.wait_for_timeout(300)
        check(not pp.evaluate('ArcadeMenus.isOpen') and pp.evaluate("location.hash") == '#' + first[5:], f'{size}: tapping a picture opens it ({first})')
        pp.click('#pick'); wait_screen(pp, 'coloring-pick')
        check(pp.evaluate("__coloringMenus().group") == 'things', f'{size}: back to the picker, same tab')
        # My pictures: empty frame, then one saved picture that can be opened and taken off the wall (two taps)
        tap(pp, 'tab-gallery', touch)
        check(not [i for i in items(pp) if i['attr'].startswith('art-')], f'{size}: My pictures starts empty')
        pp.goto(URL + '#' + first[5:]); pp.wait_for_timeout(300)
        pp.click('#save'); pp.wait_for_timeout(500)
        pp.click('#pick'); wait_screen(pp, 'coloring-pick'); tap(pp, 'tab-gallery', touch)
        arts = [i['attr'] for i in items(pp) if i['attr'].startswith('art-')]
        check(len(arts) == 1, f'{size}: the saved picture is in My pictures')
        tap(pp, arts[0], touch)
        check(not pp.evaluate('ArcadeMenus.isOpen') and pp.evaluate("location.hash") == '#' + arts[0], f'{size}: a saved picture opens')
        pp.click('#pick'); wait_screen(pp, 'coloring-pick')
        if pp.evaluate("__coloringMenus().group") != 'gallery': tap(pp, 'tab-gallery', touch)
        tap(pp, 'remove', touch); tap(pp, arts[0], touch)
        check(pp.evaluate("__coloringMenus().gallery") == 1 and find(pp, arts[0])['picked'], f'{size}: the first tap only marks it')
        pp.screenshot(path=str(OUT / f'coloring_remove_{size}.png'))
        tap(pp, arts[0], touch); pp.wait_for_timeout(300)
        check(pp.evaluate("__coloringMenus().gallery") == 0, f'{size}: the second tap takes it off the wall')
        tap(pp, 'home', touch); pp.wait_for_timeout(500)
        check(pp.url.endswith('/index.html') and '/coloring/' not in pp.url, f'{size}: the home button goes to the arcade')
        ctx.close()
    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
sys.exit(1 if fails else 0)
