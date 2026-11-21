"""Automated test: Hoop Heroes - the ball falls the right way (Keith, Nov 21: "ball isn't falling the right way").

Run:  python3 tests/test_hoops.py
Shoots a basket, a long shot, a short shot and a wild one to the side, and follows the ball (__hoopsState().balls):
  * it never jumps: from one look to the next it moves a little (before the fix a basket stopped in mid-air under the
    net and then jumped down to the ramp, and a miss jumped straight onto the ramp)
  * a basket slides down through the net, then falls, bounces on the ramp and rolls back to you
  * it never goes through the side nets or the back of the cage
  * no JavaScript errors
"""
import sys, pathlib
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu as cm
ROOT = pathlib.Path(__file__).resolve().parent.parent
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={'width': 960, 'height': 540})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto((ROOT / 'hoops' / 'index.html').as_uri()); pg.evaluate('localStorage.clear()'); pg.reload()
    cm.to_title(pg)
    for _ in range(5):
        if not pg.evaluate('ArcadeMenus.isOpen'): break
        if cm.find(pg, 'ok'): cm.tap(pg, 'ok')
        else: pg.keyboard.press('Enter')
        pg.wait_for_timeout(500)
    pg.wait_for_function('window.__hoopsState && __hoopsState().ready', timeout=8000)
    # Keith, Nov 21: the ball sat on the bottom edge, no room to pull back on a PC. Now it's higher, and a real
    # mouse pull-back of a sensible length scores (the waiting ball's middle is in the top 3/4 of the game picture)
    pg.wait_for_function('__hoopsState().ready', timeout=8000); pg.wait_for_timeout(300)
    hand = pg.evaluate('__hoopsState().hand')
    cv = pg.evaluate("(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; })()")
    k = cv[3] / 540
    check(hand['y'] < 540 * 0.75 and hand['y'] + hand['r'] + 100 < 540, f"the waiting ball sits higher, with room to pull back under it (y {hand['y']:.0f} of 540)")
    pull = pg.evaluate('__hoopsPerfect()') * hand['pull']
    check(60 < pull < 120, f"a basket is a pull of about {pull:.0f} dots (not a tiny twitch, not off the screen)")
    sx, sy = cv[0] + (cv[2] / 2), cv[1] + hand['y'] * k
    made0 = pg.evaluate('__hoopsState().made')
    pg.mouse.move(sx, sy); pg.mouse.down()
    for i in range(1, 11): pg.mouse.move(sx, sy + pull * k * i / 10); pg.wait_for_timeout(16)
    pg.mouse.up()
    pg.wait_for_function('__hoopsState().balls.length === 0 || __hoopsState().balls[0].state !== "fly"', timeout=6000)
    check(pg.evaluate('__hoopsState().made') == made0 + 1, 'a real mouse pull-back of the right length scores')
    pg.wait_for_function('__hoopsState().balls.length === 0', timeout=8000)

    # Keith: "computer is scoring way too fast and making all the shots": every rival over a whole round
    rivals = pg.evaluate("__hoopsRivals()")
    for r in rivals:
        per_sec = r['rate'] * r['acc'] * 2
        check(per_sec <= 0.85 and r['acc'] <= 0.55, f"rival {r['name']}: about {per_sec * r['time']:.0f} points in {r['time']} s (under half go in)")
        check(r['stars'][0] > per_sec * r['time'] * 1.2, f"{r['name']}: 2 stars ({r['stars'][0]}) needs more than beating them")

    for name, js in [('basket', '__hoopsShoot(__hoopsPerfect(), 0)'), ('long', '__hoopsShoot(1.2, 0)'), ('short', '__hoopsShoot(0.45, 0)'),
                     ('wild', '__hoopsShoot(__hoopsPerfect(), 1.4)')]:
        pg.wait_for_function('__hoopsState().ready && __hoopsState().balls.length === 0', timeout=15000); pg.wait_for_timeout(200)
        made = pg.evaluate('__hoopsState().made')
        pg.evaluate(js)
        path = []
        for _ in range(120):
            pg.wait_for_timeout(25)
            bs = pg.evaluate('__hoopsState().balls')
            if not bs: break
            path.append(bs[0])
        jumps = [(a, c) for a, c in zip(path, path[1:]) if abs(a['h'] - c['h']) > 0.35 or abs(a['z'] - c['z']) > 0.5]
        inside = all(abs(p['x']) <= 0.89 and p['z'] <= 4.44 for p in path)
        states = []
        for p in path:
            if not states or states[-1] != p['state']: states.append(p['state'])
        check(not jumps, f"{name}: the ball never jumps ({jumps[:1]})")
        check(inside, f"{name}: the ball stays inside the cage")
        check(states[-1] == 'roll' and 'bounce' in states, f"{name}: it falls, bounces and rolls back to you ({' > '.join(states)})")
        if name == 'basket':
            check(pg.evaluate('__hoopsState().made') == made + 1 and states[:3] == ['fly', 'drop', 'bounce'], 'basket: in, through the net, then down')
    b.close()

check(not errors, f'no JavaScript errors ({errors[:3]})')
print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
sys.exit(1 if fails or errors else 0)
