"""Automated test: Bubble School plays a whole level by tapping the right bubbles.

Run:  python3 tests/test_abc.py
Checks the bubbles stay on screen (they bob in place, no floating away), that after a
right answer the other bubbles fly up and a new set grows in, and that the level ends
with the results screen. Screenshots of the transition land in tests/out/.
"""
import sys, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

with sync_playwright() as pw:
    b = pw.chromium.launch()
    for name, vp in [('desktop', {'width': 1280, 'height': 760}), ('phone', {'width': 844, 'height': 390})]:
        page = b.new_page(viewport=vp)
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto((ROOT / 'abc' / 'index.html').as_uri())
        page.evaluate('localStorage.clear()'); page.reload(); page.wait_for_timeout(300)
        page.mouse.click(vp['width'] // 2, vp['height'] // 2); page.wait_for_timeout(300)   # title -> menu
        page.keyboard.press('Enter'); page.wait_for_timeout(400)                              # NEW GAME
        for _ in range(4):                                                                   # any how-to / level screens
            if page.evaluate('typeof __abcState === "function"'): break
            page.keyboard.press('Enter'); page.wait_for_timeout(400)
        page.wait_for_function('typeof __abcState === "function"', timeout=5000)
        page.wait_for_timeout(800)
        s1 = page.evaluate('__abcState()')
        page.wait_for_timeout(2000)
        s2 = page.evaluate('__abcState()')
        moved = max(abs(a['y'] - c['y']) for a, c in zip(s1['bubbles'], s2['bubbles']))
        check(moved < 2, f'{name}: bubbles stay in their spots (moved {moved}px in 2 s)')
        check(all(200 < bb['y'] < 440 and 150 < bb['x'] < 940 for bb in s2['bubbles']), f'{name}: all bubbles on screen')
        page.screenshot(path=str(OUT / f'abc-{name}-question.png'))
        # right answer -> others fly up
        page.evaluate('__abcTap(__abcState().answer)')
        page.wait_for_timeout(600)
        page.screenshot(path=str(OUT / f'abc-{name}-flyaway.png'))
        s3 = page.evaluate('__abcState()')
        flying = [bb for bb in s3['bubbles'] if not bb['popped']]
        check(all(bb['y'] < 335 - 40 for bb in flying), f'{name}: other bubbles fly up after the right answer')
        page.wait_for_timeout(900)
        page.screenshot(path=str(OUT / f'abc-{name}-newset.png'))
        s4 = page.evaluate('__abcState()')
        check(s4['q'] == 2 and not any(bb['popped'] for bb in s4['bubbles']), f'{name}: a new question with new bubbles')
        # play out the rest of the level
        for _ in range(12):
            st = page.evaluate('__abcState()')
            if st['done']: break
            page.evaluate('__abcTap(__abcState().answer)'); page.wait_for_timeout(1500)
        check(page.evaluate('__abcState().done'), f'{name}: level finishes')
        page.wait_for_timeout(800)
        page.screenshot(path=str(OUT / f'abc-{name}-results.png'))
        page.close()
    b.close()
check(not errors, 'no JavaScript errors' + ('' if not errors else ': ' + '; '.join(errors[:3])))
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
sys.exit(1 if fails else 0)
