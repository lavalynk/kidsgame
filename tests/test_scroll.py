"""Automated test: a finger drag scrolls the canvas menus (Keith, Nov 21: "can't swipe up on phone").

Run:  python3 tests/test_scroll.py
Real touch events (Chrome's touch input, like a phone) on the hub held upright:
- swiping up moves the list of games up (by about as far as the finger went), swiping down brings it back;
- a swipe that starts on a game tile does NOT open the game;
- a sideways swipe doesn't scroll;
- a short tap still opens a game.
Also the bike levels list scrolls with a mouse drag. Screenshot: tests/out/scroll-hub.png
"""
import sys, pathlib
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

def tile_y(pg, attr):
    return pg.evaluate('a => ArcadeMenus.list().find(i => i.attr === a).y', attr)

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 412, 'height': 915}, has_touch=True, is_mobile=True)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto((ROOT / 'index.html').as_uri())
    pg.wait_for_function("window.ArcadeMenus && ArcadeMenus.screen() === 'hub'", timeout=8000); pg.wait_for_timeout(1200)
    cdp = ctx.new_cdp_session(pg)
    def swipe(x0, y0, x1, y1, steps=12):
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x0, 'y': y0}]})
        for i in range(1, steps + 1):
            cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x0 + (x1 - x0) * i / steps, 'y': y0 + (y1 - y0) * i / steps}]})
            pg.wait_for_timeout(30)
        pg.wait_for_timeout(150)                      # (stop before letting go: no glide)
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
        pg.wait_for_timeout(700)

    check(pg.evaluate('ArcadeMenus.scroller.isOverflow'), 'upright phone: the hub is taller than the screen')
    tiles = [i for i in cmenu.items(pg) if i['attr'].startswith('game-')]
    first = tiles[0]
    y0 = tile_y(pg, 'game-golf')
    # start the swipe ON a game tile that's in sight
    sx, sy = first['x'] + first['w'] / 2, min(first['y'] + first['h'] / 2, 860)
    swipe(sx, sy, sx, sy - 350)
    y1 = tile_y(pg, 'game-golf')
    room = pg.evaluate('-ArcadeMenus.scroller.bottomChildOY / Math.min(2, devicePixelRatio)')   # (how far the list can scroll, CSS px)
    check(y0 - y1 > min(250, room * 0.9), f'swiping up scrolls the games up ({y0:.0f} -> {y1:.0f}, room {room:.0f})')
    check(pg.evaluate("ArcadeMenus.screen()") == 'hub' and pg.url.endswith('index.html'), 'a swipe that starts on a game tile does not open it')
    pg.screenshot(path=str(OUT / 'scroll-hub.png'))
    swipe(200, 480, 200, 880)
    y2 = tile_y(pg, 'game-golf')
    check(y2 - y1 > min(250, room * 0.9), f'swiping down scrolls back ({y1:.0f} -> {y2:.0f})')
    swipe(80, 600, 380, 610)
    check(abs(tile_y(pg, 'game-golf') - y2) < 3, 'a sideways swipe does not scroll')
    # a quick tap still opens a game
    it = next(i for i in cmenu.items(pg) if i['attr'] == 'game-bike')
    pg.touchscreen.tap(it['x'] + it['w'] / 2, it['y'] + it['h'] / 2)
    pg.wait_for_url('**/bike/index.html', timeout=6000)
    check(True, 'a tap still opens a game')

    # ---- a mouse drag scrolls a game's level list too (bike, upright) ----
    pg2 = b.new_page(viewport={'width': 412, 'height': 915})
    pg2.on('pageerror', lambda e: errors.append(str(e)))
    pg2.goto((ROOT / 'bike' / 'index.html').as_uri()); pg2.wait_for_timeout(600)
    cmenu.to_title(pg2); cmenu.tap(pg2, 'levels'); cmenu.wait_screen(pg2, 'levels'); pg2.wait_for_timeout(600)
    t0 = pg2.evaluate('ArcadeMenus.scroller.t')
    pg2.mouse.move(200, 700); pg2.mouse.down()
    for i in range(1, 15): pg2.mouse.move(200, 700 - i * 25); pg2.wait_for_timeout(20)
    pg2.mouse.up(); pg2.wait_for_timeout(500)
    t1 = pg2.evaluate('ArcadeMenus.scroller.t')
    check(t1 > t0 + 0.2, f'bike levels: a drag scrolls the list ({t0:.2f} -> {t1:.2f})')
    check(pg2.evaluate("ArcadeMenus.screen()") == 'levels', 'and did not start a race')
    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
