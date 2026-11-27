"""Automated test: "My pictures" in the browser's big storage (Nov 27, 20-point plan #5).

Run:  python3 tests/test_gallery.py
Checks:
  * the coloring book keeps My pictures in IndexedDB (idb-keyval), not in the small localStorage save
  * old pictures (in the localStorage save from before) move over by themselves, and only leave
    localStorage once they are safely stored; they're still there after a reload
  * a picture hung up right away (before the big storage answers) is not lost
  * 300 pictures fit (more than the old 60, which is the most localStorage held), the oldest goes after that;
    the My pictures screen still opens quickly with lots of pictures; the localStorage save stays small
  * My House's Art Room hangs the newest pictures from the big storage
  * removing a player deletes their pictures too
  * without IndexedDB (some private windows) it still works the old way, in localStorage
Screenshots: tests/out/gallery_many.png, gallery_house.png.
"""
import sys, json, pathlib, time
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from cmenu import wait_screen, items, tap
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
URL = (ROOT / 'coloring' / 'index.html').as_uri()
HUB = (ROOT / 'index.html').as_uri()
HOUSE = (ROOT / 'house' / 'index.html').as_uri()
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what, flush=True)
    if not ok: fails.append(what)

# a colored picture of page `page` (fills only), newest = biggest t
def art(i, page='cat', color='#ef476f'):
    return {'id': f'old{i}', 'page': page, 't': 1000 + i, 'state': {'v': 2, 'fills': ['#bde0fe', color, color], 'strokes': [], 'stickers': []}}
IDB_GET = "(k) => idbKeyval.get(k).then(l => (l || []).length)"
LS = "() => JSON.parse(localStorage.getItem('kidsColoring.v1') || '{}')"
def ready(pg):
    pg.wait_for_function("window.__coloringMenus && __coloringMenus().ready", timeout=8000)

with sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context(viewport={'width': 1280, 'height': 800})
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(str(e)))

    # ---- 1. old pictures move over by themselves ----
    pg.goto(URL); pg.evaluate('localStorage.clear()')
    old = [art(i, 'cat' if i % 2 else 'dog') for i in range(5)]
    pg.evaluate("(g) => localStorage.setItem('kidsColoring.v1', JSON.stringify({ pages: { cat: { v: 2, fills: ['#ffd166'], strokes: [], stickers: [] } }, gallery: g, custom: [], palette: 0 }))", old)
    pg.reload(); ready(pg)
    m = pg.evaluate('__coloringMenus()')
    check(m['storage'] == 'idb', f"the coloring book uses the big storage ({m['storage']})")
    check(m['moved'] == 5 and m['gallery'] == 5, f"the 5 old pictures moved over ({m['moved']} moved, {m['gallery']} shown)")
    check(m['ids'] == ['old4', 'old3', 'old2', 'old1', 'old0'], f"...newest first ({m['ids']})")
    pg.wait_for_timeout(500)
    ls = pg.evaluate(LS)
    check('gallery' not in ls, 'they left the small localStorage save')
    check(ls.get('pages', {}).get('cat', {}).get('fills') == ['#ffd166'], 'the pages being colored stay in localStorage, untouched')
    check(pg.evaluate(IDB_GET, 'gallery:kidsColoring.v1') == 5, 'they are in IndexedDB')
    pg.reload(); ready(pg)
    check(pg.evaluate('__coloringMenus().gallery') == 5, 'after a reload all 5 are still there')
    tap(pg, 'tab-gallery')
    arts = [i['attr'] for i in items(pg) if i['attr'].startswith('art-')]
    check(len(arts) == 5, f'My pictures shows them ({len(arts)})')

    # ---- 2. a deep link to a picture waits for the big storage ----
    pg.goto(URL + '#art-old2'); ready(pg); pg.wait_for_timeout(300)
    check(not pg.evaluate('ArcadeMenus.isOpen') and pg.evaluate("location.hash") == '#art-old2'
          and pg.evaluate("[...document.querySelectorAll('#picture > .r')].some(r => r.style.getPropertyValue('--fill'))"),
          'opening #art-old2 shows that picture (once it has come from the big storage)')

    # ---- 3. hang a picture straight away: kept ----
    pg.goto(URL + '#apple')
    pg.evaluate("document.getElementById('save').click()")          # (maybe before the big storage answered)
    ready(pg); pg.wait_for_timeout(600)
    check(pg.evaluate('__coloringMenus().gallery') == 6, 'a picture hung up at once is added to the old ones')
    pg.reload(); ready(pg)
    check(pg.evaluate('__coloringMenus().gallery') == 6 and pg.evaluate(IDB_GET, 'gallery:kidsColoring.v1') == 6, '...and is still there after a reload')

    # ---- 4. lots of pictures ----
    many = [art(i, ['cat', 'dog', 'apple', 'cow'][i % 4], ['#ef476f', '#06d6a0', '#4cc9f0'][i % 3]) for i in range(299)]
    for a in many: a['id'] = f'many{a["t"]}'; a['state']['strokes'] = [{'c': '#9b5de5', 'w': 14, 'd': 'M20 200 ' + ' '.join(f'L{x} {200 + (x * 7) % 40}' for x in range(26, 380, 3))}] * 6
    pg.evaluate("(g) => idbKeyval.set('gallery:kidsColoring.v1', g)", many)
    pg.reload(); ready(pg)
    check(pg.evaluate('__coloringMenus().gallery') == 299, f"299 pictures load ({pg.evaluate('__coloringMenus().gallery')})")
    pg.evaluate("location.hash = '#cat'"); pg.wait_for_timeout(300)
    pg.evaluate("document.getElementById('save').click()"); pg.wait_for_timeout(200)
    pg.evaluate("document.getElementById('save').click()"); pg.wait_for_timeout(600)   # (a 2nd copy: 301 -> the oldest goes)
    m = pg.evaluate('__coloringMenus()')
    check(m['gallery'] == 300 and 'many1000' not in m['ids'], f"room for 300; after that the oldest goes ({m['gallery']})")
    size = pg.evaluate("(localStorage.getItem('kidsColoring.v1') || '').length")
    check(size < 20000, f'the localStorage save stays small ({size} letters)')
    big = pg.evaluate("idbKeyval.get('gallery:kidsColoring.v1').then(l => JSON.stringify(l).length)")
    check(big > 1_000_000, f'(the pictures are {big // 1024} KB: too big for localStorage on many phones)')
    pg.goto(URL); ready(pg)
    t0 = time.time(); tap(pg, 'tab-gallery'); wait_screen(pg, 'coloring-pick')
    pg.wait_for_function("ArcadeMenus.list().filter(i => i.attr.startsWith('art-')).length >= 300", timeout=15000)
    secs = time.time() - t0
    check(secs < 6, f'My pictures with 300 pictures opens in {secs:.1f} s')
    pg.screenshot(path=str(OUT / 'gallery_many.png'))

    # ---- 5. My House's Art Room ----
    pg.goto(HOUSE); pg.wait_for_function("window.__houseState && __houseState().pictures === 300", timeout=8000)
    pg.wait_for_timeout(600)
    if pg.evaluate("__houseState().room") != 'art':
        tap(pg, 'room-art'); pg.wait_for_timeout(800)
    html = pg.evaluate('__houseSVG()')
    check(html.count('<svg') >= 7 and '#9b5de5' in html, 'the Art Room hangs the newest pictures from the big storage')
    pg.screenshot(path=str(OUT / 'gallery_house.png'))

    # ---- 6. removing a player deletes their pictures ----
    pg.goto(HUB); pg.wait_for_timeout(500)
    pid = pg.evaluate("Arcade.profiles.add({ name: 'Two', pet: 'dog', color: '#06d6a0' }).id")
    key = pg.evaluate(f"Arcade.profiles.key('kidsColoring.v1', '{pid}')")
    pg.evaluate(f"Arcade.profiles.use('{pid}')")
    pg.goto(URL); ready(pg)
    check(pg.evaluate('__coloringMenus().gallery') == 0, "player 2 has their own (empty) My pictures")
    pg.goto(URL + '#dog'); ready(pg); pg.evaluate("document.getElementById('save').click()"); pg.wait_for_timeout(700)
    check(pg.evaluate(IDB_GET, 'gallery:' + key) == 1, f'player 2 hangs one up ({key})')
    pg.goto(HUB); pg.wait_for_timeout(400)
    pg.evaluate(f"Arcade.profiles.remove('{pid}')"); pg.wait_for_timeout(500)
    pg.goto(URL); ready(pg)
    check(pg.evaluate(IDB_GET, 'gallery:' + key) == 0, "removing player 2 deleted their pictures")
    check(pg.evaluate(IDB_GET, 'gallery:kidsColoring.v1') == 300, "...and not player 1's")
    ctx.close()

    # ---- 7. no IndexedDB: the old way ----
    ctx = b.new_context(viewport={'width': 390, 'height': 844})
    ctx.add_init_script("try { Object.defineProperty(window, 'indexedDB', { value: undefined }); } catch (e) {}")
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(URL); pg.evaluate('localStorage.clear()')
    pg.evaluate("(g) => localStorage.setItem('kidsColoring.v1', JSON.stringify({ pages: {}, gallery: g }))", old[:2])
    pg.goto(URL + '#cat'); pg.reload(); ready(pg)
    m = pg.evaluate('__coloringMenus()')
    check(m['storage'] == 'local' and m['gallery'] == 2, f"without IndexedDB the old pictures still show ({m['storage']}, {m['gallery']})")
    pg.evaluate("document.getElementById('save').click()"); pg.wait_for_timeout(600)
    check(len(pg.evaluate(LS).get('gallery', [])) == 3, '...and a new one saves in localStorage, like before')
    ctx.close()
    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
sys.exit(1 if fails else 0)
