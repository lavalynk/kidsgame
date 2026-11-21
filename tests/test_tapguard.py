"""Automated test: after tapping the title screen, the menu ignores taps for half a second.

Run:  python3 tests/test_tapguard.py
"""
import sys, pathlib
from playwright.sync_api import sync_playwright
import cmenu as cm          # (canvas menus: tests/cmenu.py)
ROOT = pathlib.Path(__file__).resolve().parent.parent
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

with sync_playwright() as pw:
    b = pw.chromium.launch()
    # a menu button to press in each game (RC has its own menu with big buttons)
    # (games with canvas menus, drawn by Phaser + Rex UI: the same guard, tapped on the canvas, see tests/cmenu.py)
    for game in ['hoops']:
        page = b.new_page(viewport={'width': 1280, 'height': 760})
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto((ROOT / game / 'index.html').as_uri())
        page.evaluate('localStorage.clear()'); page.reload(); page.wait_for_timeout(400)
        cm.to_title(page)
        page.evaluate('Arcade.guardTaps(500)')                         # (what a tap on the title screen does)
        cm.tap(page, 'start'); page.keyboard.press('Enter'); page.wait_for_timeout(100)
        check(cm.screen(page) == 'title', f'{game}: taps right after the title are ignored')
        page.wait_for_timeout(500)
        cm.tap(page, 'start'); page.wait_for_timeout(400)
        check(page.evaluate('__game.state') == 'play', f'{game}: menu works after half a second')
        page.close()
    for game, target in [('bike', '.ar-nesitem >> nth=0'), ('abc', '.ar-nesitem >> nth=0'), ('rc', 'button:has-text("Free Play")')]:
        page = b.new_page(viewport={'width': 1280, 'height': 760})
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto((ROOT / game / 'index.html').as_uri())
        page.evaluate('localStorage.clear()'); page.reload(); page.wait_for_timeout(400)
        page.mouse.click(640, 380)                                     # tap to start
        page.wait_for_timeout(100)
        menu = page.evaluate("() => document.body.textContent.length")
        page.click(target, force=True); page.keyboard.press('Enter')  # quick tap on a menu button + Enter: ignored
        page.wait_for_timeout(150)
        check(page.evaluate("() => document.body.textContent.length") == menu, f'{game}: taps right after the title are ignored')
        page.wait_for_timeout(500)
        page.click(target); page.wait_for_timeout(400)                # after half a second: works again
        check(page.evaluate("() => document.body.textContent.length") != menu, f'{game}: menu works after half a second')
        page.close()
    # (Nov 20) a tap near the very edge of a button still counts (the bouncy press must not shrink the button away
    # from under the finger): press 3 px inside the edge of RC's Time Trial tile, on a touch screen too
    for touch in (False, True):
        ctx = b.new_context(viewport={'width': 1280, 'height': 760}, has_touch=touch, is_mobile=touch)
        page = ctx.new_page(); page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto((ROOT / 'rc' / 'index.html').as_uri()); page.evaluate('localStorage.clear()'); page.reload(); page.wait_for_timeout(400)
        page.mouse.click(640, 380); page.wait_for_timeout(1200)
        bx = page.locator('[data-menu=trial]').bounding_box()
        x, y = bx['x'] + 3, bx['y'] + bx['height'] / 2
        if touch: page.touchscreen.tap(x, y)
        else: page.mouse.move(x, y); page.mouse.down(); page.wait_for_timeout(120); page.mouse.up()
        page.wait_for_timeout(500)
        check(page.locator('.rc-head .ar-title', has_text='Time Trial').count() == 1, f"a {'touch' if touch else 'mouse'} tap at the very edge of a button counts")
        ctx.close()
    b.close()
check(not errors, 'no JavaScript errors' + ('' if not errors else ': ' + '; '.join(errors[:3])))
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
sys.exit(1 if fails else 0)
