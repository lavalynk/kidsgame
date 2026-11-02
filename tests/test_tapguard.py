"""Automated test: after tapping the title screen, the menu ignores taps for half a second.

Run:  python3 tests/test_tapguard.py
"""
import sys, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

with sync_playwright() as pw:
    b = pw.chromium.launch()
    # a menu button to press in each game (RC has its own menu with big buttons)
    for game, target in [('bike', '.ar-nesitem >> nth=0'), ('abc', '.ar-nesitem >> nth=0'), ('hoops', '.ar-nesitem >> nth=0'), ('rc', 'button:has-text("Free Play")')]:
        page = b.new_page(viewport={'width': 1280, 'height': 760})
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto((ROOT / game / 'index.html').as_uri())
        page.evaluate('localStorage.clear()'); page.reload(); page.wait_for_timeout(400)
        page.mouse.click(640, 380)                                     # tap to start
        page.wait_for_timeout(100)
        menu = page.evaluate("() => document.body.innerHTML.length")
        page.click(target, force=True); page.keyboard.press('Enter')  # quick tap on a menu button + Enter: ignored
        page.wait_for_timeout(150)
        check(page.evaluate("() => document.body.innerHTML.length") == menu, f'{game}: taps right after the title are ignored')
        page.wait_for_timeout(500)
        page.click(target); page.wait_for_timeout(400)                # after half a second: works again
        check(page.evaluate("() => document.body.innerHTML.length") != menu, f'{game}: menu works after half a second')
        page.close()
    b.close()
check(not errors, 'no JavaScript errors' + ('' if not errors else ': ' + '; '.join(errors[:3])))
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
sys.exit(1 if fails else 0)
