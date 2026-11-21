"""Automated test: the Sticker Book, My House, and the picture title menus.

Run:  python3 tests/test_stickers.py
Checks:
  * finishing a real game (RC Free Drive, all 12 stars) earns that game's stickers + a toast
  * the sticker book (drawn by Phaser) shows 16 pages / 68 stickers, new ones are yellow, arrows / swipe / keys turn
    pages, tapping one shows it big (+ Play for one you don't have), a phone upright fits a whole spread
  * the hub's book button counts new stickers, the house button shows coins
  * My House: coins = 3 + trophies, try-then-buy, can't buy without coins, the "My House" sticker
  * every arcade game's title menu is pictures (a big Play + round buttons), not a word list
  * phones: the game view keeps a 5% border
Screenshots land in tests/out/.
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu as cm
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
SAVE = lambda pg: pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.v1') || '{}')")

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 760})
    pg.on('pageerror', lambda e: errors.append(str(e)))

    # ---- earn stickers by really playing: RC Free Drive ----
    pg.goto((ROOT / 'rc' / 'index.html').as_uri()); pg.evaluate('localStorage.clear()'); pg.reload(); pg.wait_for_timeout(400)
    pg.mouse.click(640, 380); pg.wait_for_timeout(700)
    cm.click(pg, '[data-menu=free]'); pg.wait_for_timeout(300)
    cm.click(pg, '[data-kind=drive]'); pg.wait_for_timeout(200)
    cm.click(pg, '[data-track]')
    pg.wait_for_function('typeof __rcStep === "function" && __rcState().track')
    pg.evaluate('''(() => { __rcStep(3.4); const p = __rcCars().find(c => c.isPlayer);
      for (const s of __rcStars()) { p.x = s.x; p.y = s.y; p.vx = p.vy = 0; __rcStep(0.02); } __rcStep(3); })()''')
    pg.wait_for_timeout(1400)
    have = SAVE(pg).get('stickers', {}).get('have', [])
    check({'rc-0', 'rc-1', 'rc-2'} <= set(have), f'RC Free Drive earned the RC stickers ({have})')
    check('New sticker' in pg.locator('.ar-toast').inner_text(), 'a "New sticker!" toast pops up')
    pg.screenshot(path=str(OUT / 'stickers-toast.png'))

    # ---- the sticker book (Nov 21: drawn by Phaser + Rex UI, tests/cmenu.py taps it for real) ----
    pg.goto((ROOT / 'stickers' / 'index.html').as_uri())
    cm.wait_screen(pg, 'stickers-book')
    st = pg.evaluate('__bookState()')
    check(st['pages'] == 16 and st['total'] == 68, f"book: 16 pages, 68 stickers ({st})")
    check(st['got'] >= 3 and st['fresh'] >= 3, f"book: the new stickers are there and marked new ({st['got']}, {st['fresh']})")
    check(st.get('canvas') and not pg.locator('#book').is_visible(), 'book: drawn by Phaser (the HTML book is hidden)')
    pg.screenshot(path=str(OUT / 'stickers-book.png'))
    # a real book: a few pages at a time, the big arrow turns the page, a swipe does too
    check(st['spreads'] > 1 and st['spread'] == 0, f"book: pages to turn ({st['spreads']} spreads)")
    it = cm.items(pg)
    check(cm.find(pg, 'game-bike') and cm.find(pg, 'sticker-bike-0') and all(i['w'] >= 70 and i['h'] >= 70 for i in it if i['attr'].startswith('sticker-')),
          'book: the first spread shows a game picture + its stickers, all big')
    cm.tap(pg, 'prev'); pg.wait_for_timeout(200)
    check(pg.evaluate('__bookState().spread') == 0, 'book: no page before the first one (the back arrow wiggles)')
    cm.tap(pg, 'next'); pg.wait_for_timeout(500)
    check(pg.evaluate('__bookState().spread') == 1, 'book: the arrow turns the page')
    vp = pg.viewport_size
    pg.mouse.move(vp['width'] * 0.8, vp['height'] * 0.45); pg.mouse.down()
    pg.mouse.move(vp['width'] * 0.2, vp['height'] * 0.45, steps=8); pg.mouse.up(); pg.wait_for_timeout(600)
    check(pg.evaluate('__bookState().spread') == 2, 'book: a swipe turns the page too')
    pg.keyboard.press('ArrowLeft'); pg.wait_for_timeout(400)
    check(pg.evaluate('__bookState().spread') == 1, 'book: the arrow keys turn pages')
    new = [i for i in cm.items(pg) if i['picked'] and i['attr'].startswith('sticker-')]
    pg.evaluate('__bookShow("rc-0")'); cm.wait_screen(pg, 'stickers-book')
    check(cm.find(pg, 'sticker-rc-0')['picked'], 'book: new stickers are yellow')
    cm.tap(pg, 'sticker-rc-0'); cm.wait_screen(pg, 'stickers-one')
    check(not cm.find(pg, 'play') and cm.find(pg, 'close'), 'book: tap a sticker to see it big (yours: no Play button)')
    pg.screenshot(path=str(OUT / 'stickers-zoom-have.png'))
    cm.tap(pg, 'close'); cm.wait_screen(pg, 'stickers-book')
    pg.evaluate('__bookShow("space-1")'); cm.wait_screen(pg, 'stickers-book')
    cm.tap(pg, 'sticker-space-1'); cm.wait_screen(pg, 'stickers-one')
    check(cm.find(pg, 'play') is not None, 'book: a sticker you don\'t have shows how to get it + a Play button')
    pg.screenshot(path=str(OUT / 'stickers-zoom.png'))
    cm.tap(pg, 'play'); pg.wait_for_timeout(700)
    check('/space/' in pg.url, f'book: Play opens that game ({pg.url})')
    pg.goto((ROOT / 'stickers' / 'index.html').as_uri()); cm.wait_screen(pg, 'stickers-book')
    check(pg.evaluate('__bookState().fresh') == 0, 'book: stickers are not "new" the second time')
    # a phone held upright, with a finger
    bp = b.new_page(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    bp.on('pageerror', lambda e: errors.append(str(e)))
    bp.goto((ROOT / 'stickers' / 'index.html').as_uri()); cm.wait_screen(bp, 'stickers-book')
    tiles = [i for i in cm.items(bp) if i['attr'].startswith(('sticker-', 'game-'))]
    check(tiles and all(i['shown'] and i['w'] >= 60 for i in tiles) and all(0 <= i['x'] and i['x'] + i['w'] <= 390 for i in cm.items(bp)),
          f'phone upright: the whole spread fits, big tiles ({[round(i["w"]) for i in tiles]})')
    cm.tap(bp, 'next', touch=True); bp.wait_for_timeout(400)
    check(bp.evaluate('__bookState().spread') == 1, 'phone upright: a finger tap on the arrow turns the page')
    bp.screenshot(path=str(OUT / 'stickers-phone.png'))
    cm.tap(bp, 'home', touch=True); bp.wait_for_timeout(700)
    check(bp.url.endswith('/index.html') and '/stickers/' not in bp.url, 'phone upright: home goes back to the arcade')
    bp.close()
    pg.goto((ROOT / 'index.html').as_uri()); pg.wait_for_timeout(300)

    # ---- hub buttons ----
    pg.evaluate("""() => { const d = JSON.parse(localStorage.getItem('kidsArcade.v1'));
      d.games.bike = { levels: {}, achievements: ['t1', 't2', 't3', 't4'] }; d.houseBonus = 0; localStorage.setItem('kidsArcade.v1', JSON.stringify(d)); }""")
    pg.goto((ROOT / 'index.html').as_uri()); pg.wait_for_timeout(500)
    check(pg.locator('#book').count() == 1 and pg.locator('#house').count() == 1, 'hub: sticker book + house buttons')
    check(pg.locator('#house .bub').inner_text().strip() == '7', f"hub: house shows 3 + 4 trophies = 7 coins ({pg.locator('#house .bub').inner_text()})")
    check(pg.locator('#book .bub.new').count() == 1, 'hub: the book shows new stickers (bike, from the trophies)')

    # ---- My House ----
    pg.goto((ROOT / 'house' / 'index.html').as_uri()); pg.wait_for_timeout(400)
    hs = pg.evaluate('__houseState()')
    check(hs['coins'] == 7 and len(hs['spots']) == 12, f"house: 7 coins, 12 spots ({hs['coins']}, {len(hs['spots'])})")
    pg.click('[data-spot=bed]'); pg.click('[data-item=bed-purple]'); pg.wait_for_timeout(100)
    hs = pg.evaluate('__houseState()')
    check(hs['trying'] == 'bed-purple' and hs['coins'] == 7, 'house: first tap = try it in the room (free)')
    pg.click('[data-item=bed-purple]'); pg.wait_for_timeout(200)
    hs = pg.evaluate('__houseState()')
    check(hs['placed'].get('bed') == 'bed-purple' and hs['coins'] == 4, f"house: second tap buys it (coins {hs['coins']})")
    for sp, it in [('pet', 'pet-kitty'), ('lamp', 'lamp-pink')]:
        pg.click(f'[data-spot={sp}]'); pg.click(f'[data-item={it}]'); pg.click(f'[data-item={it}]'); pg.wait_for_timeout(100)
    hs = pg.evaluate('__houseState()')
    check(hs['placed'].get('pet') == 'pet-kitty' and hs['coins'] == 0, f"house: bought a kitty, then the lamp ({hs['coins']} coins)")
    pg.click('[data-spot=toy]'); pg.click('[data-item=toy-robot]'); pg.click('[data-item=toy-robot]'); pg.wait_for_timeout(100)
    hs = pg.evaluate('__houseState()')
    check('toy-robot' not in hs['owned'] and pg.locator('#how.show').count() == 1, 'house: no coins = no buying, a trophy->coin picture shows')
    pg.click('[data-spot=bed]'); pg.click('[data-none]'); pg.click('[data-item=bed-purple]')
    check(pg.evaluate('__houseState()')['placed'].get('bed') == 'bed-purple', 'house: things you own swap back for free')
    check('arcade-3' in SAVE(pg)['stickers']['have'], 'house: buying something earns the "My House" sticker')
    pg.click('#room [data-who="self"]'); pg.wait_for_timeout(200)   # (your animal hops)
    pg.screenshot(path=str(OUT / 'house.png'))
    ph = b.new_page(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    ph.on('pageerror', lambda e: errors.append(str(e)))
    ph.goto((ROOT / 'house' / 'index.html').as_uri()); ph.wait_for_timeout(400)
    ph.screenshot(path=str(OUT / 'house-phone.png'))

    # ---- picture title menus in every arcade game ----
    for game in ['bike', 'hoops', 'archery', 'jungle', 'trail', 'space', 'abc', 'fishing', 'piano', 'golf', 'quest']:
        pg.goto((ROOT / game / 'index.html').as_uri()); pg.wait_for_timeout(500)
        if pg.evaluate("!!window.ArcadeMenus && !!document.querySelector('.ar-cmenu')"):      # (menus drawn by Phaser + Rex UI)
            pg.wait_for_function("ArcadeMenus.isOpen && ArcadeMenus.list().length > 0", timeout=8000)
            it = pg.evaluate('ArcadeMenus.list()')
            check(pg.evaluate('ArcadeMenus.screen()') == 'tap' and len(it) == 1 and it[0]['label'] == '', f'{game}: title screen = a big Play picture, no words')
            pg.mouse.click(640, 380); pg.wait_for_function("ArcadeMenus.screen() === 'title' && ArcadeMenus.list().length > 0", timeout=8000)
            it = pg.evaluate('ArcadeMenus.list()')
            check(it[0]['attr'] == 'start' and len(it) - 1 >= 3, f'{game}: menu = a big Play + {len(it) - 1} picture buttons')
            continue
        tap = pg.locator('.ar-tapstart')
        check(tap.count() == 1 and tap.inner_text().strip() == '', f'{game}: title screen = a big Play picture, no words')
        pg.mouse.click(640, 380); pg.wait_for_timeout(700)
        big = pg.locator('.ar-nesitem.big .ic svg').count()
        small = pg.locator('.ar-picsmall .ar-nesitem .ic svg').count()
        check(big == 1 and small >= 3, f'{game}: menu = a big Play + {small} picture buttons')
        if game == 'space': pg.screenshot(path=str(OUT / 'menu-pictures.png'))

    # ---- phones: a 5% border around the game ----
    ph.goto((ROOT / 'bike' / 'index.html').as_uri()); ph.wait_for_timeout(500)
    cm.to_title(ph)                                     # (Nov 21: Turbo Bike's menus are drawn by Phaser, tests/cmenu.py)
    cm.tap(ph, 'start', touch=True); cm.into_game(ph)
    box = ph.evaluate("(() => { const r = document.querySelector('.ar-stage canvas').getBoundingClientRect(); return [r.width, r.height]; })()")
    check(box[0] <= 390 * 0.9 + 1, f'phone: the game is at most 90% of the screen wide ({box[0]:.0f} px of 390)')
    check(ph.evaluate("document.documentElement.classList.contains('ar-phone')"), 'phone: the 5% border is on')
    ph.screenshot(path=str(OUT / 'phone-border.png'))
    # phone upright: a big "turn me sideways" picture, the game waits; the small button plays upright anyway
    check(ph.evaluate("document.body.classList.contains('ar-turnshow')") and ph.locator('.ar-turn').is_visible(), 'phone upright: the big turn-me picture shows')
    t0 = ph.evaluate('__bikeState ? JSON.stringify(__bikeState()) : ""'); ph.wait_for_timeout(600)
    check(ph.evaluate('__bikeState ? JSON.stringify(__bikeState()) : ""') == t0, 'phone upright: the game waits while the picture shows')
    ph.click('.ar-turnok'); ph.wait_for_timeout(300)
    check(not ph.locator('.ar-turn').is_visible(), 'phone upright: the small button plays upright anyway')
    boxes = ph.evaluate("[...document.querySelectorAll('.ar-pad button')].filter(b => b.offsetParent).map(b => { const r = b.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; })")
    overlap = any(a[0] < b[2] - 2 and b[0] < a[2] - 2 and a[1] < b[3] - 2 and b[1] < a[3] - 2 for i, a in enumerate(boxes) for b in boxes[i + 1:])
    check(len(boxes) >= 4 and not overlap, f'phone upright: {len(boxes)} on-screen buttons, none overlapping')
    ph.screenshot(path=str(OUT / 'phone-upright.png'))
    ph.set_viewport_size({'width': 844, 'height': 390}); ph.wait_for_timeout(500)
    check(not ph.locator('.ar-turn').is_visible(), 'phone sideways: no turn-me picture')
    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
