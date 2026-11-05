"""Automated test: the Sticker Book, My House, and the picture title menus.

Run:  python3 tests/test_stickers.py
Checks:
  * finishing a real game (RC Free Drive, all 12 stars) earns that game's stickers + a toast
  * the sticker book shows 13 pages / 52 stickers, new ones wiggle, tapping one shows it big
  * the hub's book button counts new stickers, the house button shows coins
  * My House: coins = 3 + trophies, try-then-buy, can't buy without coins, the "My House" sticker
  * every arcade game's title menu is pictures (a big Play + round buttons), not a word list
  * phones: the game view keeps a 5% border
Screenshots land in tests/out/.
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
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
    pg.click('[data-menu=free]'); pg.wait_for_timeout(300)
    pg.click('[data-kind=drive]'); pg.wait_for_timeout(200)
    pg.locator('[data-track]').first.click()
    pg.wait_for_function('typeof __rcStep === "function" && __rcState().track')
    pg.evaluate('''(() => { __rcStep(3.4); const p = __rcCars().find(c => c.isPlayer);
      for (const s of __rcStars()) { p.x = s.x; p.y = s.y; p.vx = p.vy = 0; __rcStep(0.02); } __rcStep(3); })()''')
    pg.wait_for_timeout(1400)
    have = SAVE(pg).get('stickers', {}).get('have', [])
    check({'rc-0', 'rc-1', 'rc-2'} <= set(have), f'RC Free Drive earned the RC stickers ({have})')
    check('New sticker' in pg.locator('.ar-toast').inner_text(), 'a "New sticker!" toast pops up')
    pg.screenshot(path=str(OUT / 'stickers-toast.png'))

    # ---- the sticker book ----
    pg.goto((ROOT / 'stickers' / 'index.html').as_uri()); pg.wait_for_timeout(500)
    st = pg.evaluate('__bookState()')
    check(st['pages'] == 13 and st['total'] == 52, f"book: 13 pages, 52 stickers ({st})")
    check(st['got'] >= 3 and st['fresh'] >= 3, f"book: the new stickers are there and marked new ({st['got']}, {st['fresh']})")
    check(pg.locator('.slot.new').count() >= 3, 'book: new stickers wiggle')
    pg.screenshot(path=str(OUT / 'stickers-book.png'), full_page=True)
    pg.click('[data-sticker="rc-0"]'); pg.wait_for_timeout(300)
    check(pg.locator('#zoom').is_visible() and 'Zoom Car' in pg.locator('#card').inner_text(), 'book: tap a sticker to see it big')
    pg.click('#close'); pg.click('[data-sticker="space-1"]'); pg.wait_for_timeout(300)
    check(pg.locator('#card a.go').count() == 1, 'book: a sticker you don\'t have shows how to get it + a Play button')
    pg.screenshot(path=str(OUT / 'stickers-zoom.png'))
    pg.reload(); pg.wait_for_timeout(300)
    check(pg.evaluate('__bookState().fresh') == 0, 'book: stickers are not "new" the second time')

    # ---- hub buttons ----
    pg.evaluate("""() => { const d = JSON.parse(localStorage.getItem('kidsArcade.v1'));
      d.games.bike = { levels: {}, achievements: ['t1', 't2', 't3', 't4'] }; localStorage.setItem('kidsArcade.v1', JSON.stringify(d)); }""")
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
    pg.click('#me'); pg.wait_for_timeout(200)
    pg.screenshot(path=str(OUT / 'house.png'))
    ph = b.new_page(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    ph.on('pageerror', lambda e: errors.append(str(e)))
    ph.goto((ROOT / 'house' / 'index.html').as_uri()); ph.wait_for_timeout(400)
    ph.screenshot(path=str(OUT / 'house-phone.png'))

    # ---- picture title menus in every arcade game ----
    for game in ['bike', 'hoops', 'archery', 'jungle', 'trail', 'space', 'abc', 'fishing', 'piano']:
        pg.goto((ROOT / game / 'index.html').as_uri()); pg.wait_for_timeout(500)
        tap = pg.locator('.ar-tapstart')
        check(tap.count() == 1 and tap.inner_text().strip() == '', f'{game}: title screen = a big Play picture, no words')
        pg.mouse.click(640, 380); pg.wait_for_timeout(700)
        big = pg.locator('.ar-nesitem.big .ic svg').count()
        small = pg.locator('.ar-picsmall .ar-nesitem .ic svg').count()
        check(big == 1 and small >= 3, f'{game}: menu = a big Play + {small} picture buttons')
        if game == 'space': pg.screenshot(path=str(OUT / 'menu-pictures.png'))

    # ---- phones: a 5% border around the game ----
    ph.goto((ROOT / 'bike' / 'index.html').as_uri()); ph.wait_for_timeout(500)
    ph.mouse.click(195, 420); ph.wait_for_timeout(700)
    ph.locator('.ar-nesitem.big').click(); ph.wait_for_timeout(800)
    for _ in range(3):
        if ph.locator('.ar-overlay.show').count() == 0: break
        ph.keyboard.press('Enter'); ph.wait_for_timeout(500)
    box = ph.evaluate("(() => { const r = document.querySelector('.ar-stage canvas').getBoundingClientRect(); return [r.width, r.height]; })()")
    check(box[0] <= 390 * 0.9 + 1, f'phone: the game is at most 90% of the screen wide ({box[0]:.0f} px of 390)')
    check(ph.evaluate("document.documentElement.classList.contains('ar-phone')"), 'phone: the 5% border is on')
    ph.screenshot(path=str(OUT / 'phone-border.png'))
    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
