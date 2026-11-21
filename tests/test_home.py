"""The home button always takes you back to the arcade (Keith, Nov 20: "clicking the home button still isn't working right").

The round house button in the top-left corner used to sit UNDER the menus (title menu, pause menu, results), so a tap
on it did nothing while a menu was open. Now it sits on top. This taps it with a finger on the title menu, while
playing and on the pause menu, plus the menu's own "Arcade" button, in a few games, and checks we land on the hub.
Run: python3 tests/test_home.py
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu as cm
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
fails = []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

GAMES = ['hoops', 'jungle', 'bike', 'rc', 'golf', 'quest']
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for game in GAMES:
        for how in ['corner on the title menu', 'menu Arcade button', 'corner while playing', 'corner on the pause menu']:
            ctx = b.new_context(viewport={'width': 1280, 'height': 720}, has_touch=True); pg = ctx.new_page()
            pg.goto((ROOT / game / 'index.html').as_uri()); pg.evaluate('localStorage.clear()'); pg.reload(); pg.wait_for_timeout(800)
            canvas = cm.is_canvas(pg)
            if canvas: cm.to_title(pg)
            else: pg.mouse.click(640, 360)
            pg.wait_for_timeout(800)                              # (past the half-second tap guard)
            if how == 'menu Arcade button':
                if canvas: cm.tap(pg, 'arcade', touch=True)
                else:
                    el = pg.locator('.ar-nesitem[aria-label="Arcade"], .ar-btn[aria-label="Arcade"]').first
                    if not el.count(): ctx.close(); continue
                    bx = el.bounding_box(); pg.touchscreen.tap(bx['x'] + bx['width'] / 2, bx['y'] + bx['height'] / 2)
            else:
                if how != 'corner on the title menu':
                    if canvas: cm.tap(pg, 'start')
                    else: pg.keyboard.press('Enter')
                    pg.wait_for_timeout(1200)
                    if how == 'corner on the pause menu': pg.keyboard.press('Escape'); pg.wait_for_timeout(700)
                bx = pg.locator('.ar-back').bounding_box()
                pg.touchscreen.tap(bx['x'] + bx['width'] / 2, bx['y'] + bx['height'] / 2)
            pg.wait_for_timeout(900)
            check(pg.url.endswith('/index.html') and pg.url.split('/')[-2] != game, f'{game}: {how} goes home')
            ctx.close()
    b.close()
print(f'{len(fails)} failed' if fails else 'ALL PASSED')
sys.exit(1 if fails else 0)
