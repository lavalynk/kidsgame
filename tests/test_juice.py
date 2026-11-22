"""Automated test: game feel ("juice", new plan point 3) - the kit's g.juice helpers and the games that use them.

Run:  python3 tests/test_juice.py
  * the kit: a squash springs back to normal by itself, a tiny pause (juice.stop) really stops the game clock for a
    blink and then lets it run on, flash / shake fade out, dust + sparkles make particles
  * Calm motion (Parent corner): squashes are much smaller, no flash, no shake
  * Hoop Heroes: a basket sparkles, the score number boings, the ball stretches when thrown; a rim hit clangs
  * Putt-Putt Park: a putt stretches the ball and puffs dust; a wall bounce squashes it
  * Bubble School: a right answer poofs the bubble + a tiny pause; a wrong one wobbles it like jelly
  * no JavaScript errors; screenshots in tests/out/juice-*.png
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

def open_game(pg, folder, calm=False):
    pg.goto((ROOT / folder / 'index.html').as_uri())
    pg.evaluate("c => { localStorage.clear(); if (c) localStorage.setItem('kidsArcade.parent', JSON.stringify({ motion: 'calm' })); }", calm)
    pg.reload(); pg.wait_for_timeout(300)
    cm.to_title(pg); cm.tap(pg, 'start'); cm.into_game(pg)
    pg.wait_for_function("__game.state === 'play'", timeout=8000)
    pg.wait_for_timeout(300)

INFO = '__game.juice.info()'

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('pageerror', lambda e: errors.append(str(e)))

    # ---------------- the kit (on Hoop Heroes) ----------------
    open_game(pg, 'hoops')
    pg.wait_for_function('__hoopsState().ready', timeout=8000)
    a = pg.evaluate("(() => { const s = __game.juice.squash('test').hit(0.4); return [s.sx, s.sy]; })()")
    check(a[0] > 1.3 and a[1] < 0.7, f'a squash makes it wide + short ({a[0]:.2f} x {a[1]:.2f})')
    pg.wait_for_timeout(700)
    a = pg.evaluate("(() => { const s = __game.juice.squash('test'); return [s.sx, s.sy]; })()")
    check(abs(a[0] - 1) < 0.02 and abs(a[1] - 1) < 0.02, f'... and springs back to normal by itself ({a[0]:.3f} x {a[1]:.3f})')
    # the tiny pause: the clock stands still, then runs on
    t0 = pg.evaluate('(__game.juice.stop(0.12), __game.time)')
    pg.wait_for_timeout(50)
    t1 = pg.evaluate('__game.time'); st = pg.evaluate(INFO)['stopped']
    pg.wait_for_timeout(400)
    t2 = pg.evaluate('__game.time')
    check(st and t1 - t0 < 0.02, f'juice.stop: the game stands still for a blink ({t1 - t0:.3f} s passed)')
    check(t2 - t1 > 0.2, f'... then carries on ({t2 - t1:.2f} s in 0.4 s)')
    pg.evaluate("__game.juice.flash('#fff', 0.4); __game.juice.shake(8)")
    i = pg.evaluate(INFO)
    check(i['flashing'] > 0.5 and i['shaking'] > 0.5, 'flash + shake start')
    pg.wait_for_timeout(600)
    i = pg.evaluate(INFO)
    check(i['flashing'] == 0 and i['shaking'] == 0, 'flash + shake fade out by themselves')
    n0 = pg.evaluate('__game.particles.list.length')
    pg.evaluate('__game.juice.dust(400, 400); __game.juice.sparkle(500, 300); __game.juice.poof(600, 300)')
    n1 = pg.evaluate('__game.particles.list.length')
    kinds = pg.evaluate("[...new Set(__game.particles.list.map(p => p.shape))]")
    check(n1 - n0 >= 15 and 'puff' in kinds and 'ring' in kinds and 'star' in kinds, f'dust / sparkle / poof make puffs, rings and stars ({n1 - n0} bits: {kinds})')

    # ---------------- Hoop Heroes ----------------
    pg.wait_for_function('__hoopsState().ready && __hoopsState().balls.length === 0', timeout=15000)
    before = pg.evaluate(INFO)
    pg.evaluate('__hoopsShoot(__hoopsPerfect(), 0)')
    pg.wait_for_timeout(60)
    sq = pg.evaluate(INFO)['squash'] - before['squash']
    check(sq >= 1, 'Hoops: the ball stretches as it is thrown')
    pg.wait_for_function('__hoopsState().made >= 1', timeout=6000)
    pg.wait_for_timeout(80)
    pg.screenshot(path=str(OUT / 'juice-hoops-basket.png'))
    i = pg.evaluate(INFO)
    check(i['sparkle'] > before['sparkle'] and i['pop'] > before['pop'], 'Hoops: a basket sparkles and the score boings')
    # a shot that hits the rim: aim a bit short so it clangs
    pg.wait_for_function('__hoopsState().ready && __hoopsState().balls.length === 0', timeout=15000)
    before = pg.evaluate(INFO); clang = False
    for pw_k in [0.93, 1.07, 0.9, 1.1, 0.96, 1.04]:
        pg.wait_for_function('__hoopsState().ready && __hoopsState().balls.length === 0', timeout=15000)
        pg.evaluate(f'__hoopsShoot(__hoopsPerfect() * {pw_k}, 0)')
        pg.wait_for_function('__hoopsState().balls.length === 0', timeout=15000)
        if pg.evaluate(INFO)['stop'] > before['stop']: clang = True; break
    check(clang, 'Hoops: hitting the rim or a swish gives a tiny pause')

    # ---------------- Calm motion ----------------
    open_game(pg, 'hoops', calm=True)
    a = pg.evaluate("(() => { const s = __game.juice.squash('c').hit(0.4); __game.juice.flash('#fff', 0.4); __game.juice.shake(8); return [s.sx, __game.juice.info().flashing, __game.juice.info().shaking]; })()")
    check(a[0] < 1.2 and a[1] == 0 and a[2] == 0, f'Calm motion: small squash ({a[0]:.2f}), no flash, no shake')

    # ---------------- Putt-Putt Park ----------------
    open_game(pg, 'golf')
    pg.wait_for_function("__golfState().state === 'aim'", timeout=8000)
    before = pg.evaluate(INFO)
    pg.evaluate('__golfShoot(0, 0.9)')
    pg.wait_for_timeout(40)
    i = pg.evaluate(INFO)
    q = pg.evaluate("(() => { const s = __game.juice.squash('ball'); return [s.sx, s.sy]; })()")
    check(i['dust'] > before['dust'] and q[0] < 0.9, f'Golf: a putt puffs dust and stretches the ball ({q[0]:.2f} x {q[1]:.2f})')
    pg.screenshot(path=str(OUT / 'juice-golf-putt.png'))
    pg.wait_for_function('["aim", "in"].includes(__golfState().state)', timeout=20000)
    i2 = pg.evaluate(INFO)
    check(i2['squash'] > i['squash'], 'Golf: a hard putt bounces off the walls and the ball squashes')

    # ---------------- Bubble School ----------------
    open_game(pg, 'abc')
    pg.wait_for_function("typeof __abcState === 'function' && __abcState().choices", timeout=8000)
    pg.wait_for_timeout(1200)
    s = pg.evaluate('__abcState()')
    wrong = next(c for c in s['choices'] if c != s['answer'])
    before = pg.evaluate(INFO)
    pg.evaluate(f'__abcTap({json.dumps(wrong)})')
    i = pg.evaluate(INFO)
    check(i['squash'] > before['squash'], 'Bubble School: a wrong bubble wobbles like jelly')
    pg.evaluate('__abcTap(__abcState().answer)')
    pg.wait_for_timeout(80)
    i2 = pg.evaluate(INFO)
    check(i2['poof'] > i['poof'] and i2['stop'] > i['stop'], 'Bubble School: a right answer poofs the bubble + a tiny pause')
    pg.screenshot(path=str(OUT / 'juice-abc-pop.png'))
    b.close()

check(not errors, f'no JavaScript errors ({errors[:3]})')
print(f'\n{len(fails)} failed' if fails else '\nall passed')
sys.exit(1 if fails else 0)
