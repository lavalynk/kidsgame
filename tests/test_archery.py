"""Automated test: Bullseye Adventure (archery), mostly the Nov 22 redrawn targets + balloons.

Run:  python3 tests/test_archery.py
Checks:
  * the title menu opens and the menu pictures draw; a level starts
  * a balloon level: the aiming helper finds a shot that pops a balloon; firing it pops it (+5, "POP!" burst),
    every balloon has a picture (heart / dots / star / stripes)
  * a target level: the best shot lands in the rings and scores; the turning target, sliding pole, cart and prize
    wheel levels all draw and play a shot
  * Calm motion (Parent corner): still plays, nothing breaks
  * phone held sideways: the game fits; no JavaScript errors
Screenshots land in tests/out/ (archery-*.png). Look at the drawings with tools/preview_archery.py.
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
import cmenu as cm
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
URL = (ROOT / 'archery' / 'index.html').as_uri()
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
ST = lambda pg: pg.evaluate('__archeryState()')

# copies of a few levels from archery.js (the game takes any level made like these)
BALLOONS = {'id': 'l2', 'name': 'Balloon Party', 'theme': 'meadow', 'arrows': 6, 'wind': 0, 'stars': [10, 28, 45],
            'things': [{'kind': 'ring', 'x': 650, 'r': 55}, {'kind': 'balloon', 'x': 420, 'y': 250}, {'kind': 'balloon', 'x': 530, 'y': 185},
                       {'kind': 'balloon', 'x': 770, 'y': 215}, {'kind': 'balloon', 'x': 865, 'y': 300}]}
OTHERS = [
    {'id': 'l6', 'name': 'Prize Wheel', 'theme': 'beach', 'arrows': 7, 'wind': 0, 'stars': [12, 30, 50],
     'things': [{'kind': 'wheel', 'x': 690, 'R': 80, 'leg': 40, 'spin': 1.1, 'segs': [2, 5, 2, 10, 2, 5]}, {'kind': 'star', 'x': 480, 'y': 170}]},
    {'id': 'l5', 'name': 'Up and Down', 'theme': 'beach', 'arrows': 7, 'wind': 0, 'stars': [10, 28, 45],
     'things': [{'kind': 'ring', 'x': 720, 'r': 50, 'move': {'ax': 'y', 'amp': 110, 'speed': 1.1}}]},
    {'id': 'l7', 'name': 'Frosty Flip', 'theme': 'snow', 'arrows': 7, 'wind': 0, 'stars': [10, 26, 42],
     'things': [{'kind': 'ring', 'x': 700, 'r': 55, 'spin': 1.5}]},
    {'id': 'l8', 'name': 'Snowy Slide', 'theme': 'snow', 'arrows': 7, 'wind': 0, 'stars': [12, 30, 48],
     'things': [{'kind': 'ring', 'x': 650, 'r': 50, 'cart': True, 'move': {'ax': 'x', 'amp': 130, 'speed': 0.8}},
                {'kind': 'balloon', 'x': 450, 'y': 330, 'rise': 40, 'ph': 0}]},
]

# try lots of pretend shots, keep the one with the most points (kind = only count hits on that kind)
BEST = """(kind) => { let best = null;
  for (let a = -5; a <= 70; a += 1) for (let p = 0.3; p <= 1.001; p += 0.05) {
    const ev = __archerySim(a, p).filter(e => !kind || e.kind === kind);
    const pts = ev.reduce((n, e) => n + e.points, 0);
    if (!best || pts > best[2]) best = [a, p, pts];
  }
  __archeryFire(best[0], best[1]);      // (fire in the same breath: moving targets don't move while we search)
  return best; }"""

def fresh(pg, calm=False):
    pg.goto(URL)
    pg.evaluate("c => { localStorage.clear(); if (c) localStorage.setItem('kidsArcade.parent', JSON.stringify({ motion: 'calm' })); }", calm)
    pg.reload(); pg.wait_for_function('window.__game'); pg.wait_for_timeout(400)

def play(pg, level):
    pg.evaluate(f'document.activeElement && document.activeElement.blur(); __game.play({json.dumps(level)})')
    pg.wait_for_function("typeof __archeryState === 'function' && __archeryState().phase === 'ready'", timeout=8000)
    pg.wait_for_timeout(2400)

def shoot(pg, kind=None):
    before = ST(pg)['score']
    best = pg.evaluate(BEST, kind)
    return best, before

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={'width': 1100, 'height': 640})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    fresh(pg)
    cm.to_title(pg)
    check(cm.screen(pg) == 'title', 'the title menu opens')
    pg.screenshot(path=str(OUT / 'archery-title.png'))

    # ---- balloons ----
    play(pg, BALLOONS)
    pats = pg.evaluate("__archeryArt && __archeryArt.BALLOON_PATS")
    check(set(pats) >= {'heart', 'dots', 'star', 'stripes'}, f'balloons have pictures: {sorted(set(pats))}')
    best, before = shoot(pg, 'balloon')
    check(best[2] >= 5, f'the helper finds a shot that pops a balloon ({best})')
    pg.wait_for_timeout(500); pg.screenshot(path=str(OUT / 'archery-pop.png'))
    pg.wait_for_function("__archeryState().phase === 'ready' || __archeryState().phase === 'end'", timeout=10000)
    s = ST(pg)
    check(s['stats']['balloons'] >= 1 and s['score'] >= before + 5, f"a balloon popped (+5): {s['stats']} score {s['score']}")
    check(sum(1 for t in s['targets'] if t['kind'] == 'balloon' and not t['alive']) >= 1, 'the popped balloon is gone')
    best, before = shoot(pg, 'ring')
    pg.wait_for_function("__archeryState().phase === 'ready' || __archeryState().phase === 'end'", timeout=10000)
    s = ST(pg)
    check(s['score'] > before and s['stats']['hits'] >= 1, f"an arrow in the target scores ({before} -> {s['score']})")
    pg.screenshot(path=str(OUT / 'archery-target.png'))

    # ---- the other kinds of target ----
    for lv in OTHERS:
        play(pg, lv)
        best, before = shoot(pg)
        pg.wait_for_function("__archeryState().phase === 'ready' || __archeryState().phase === 'end'", timeout=10000)
        s = ST(pg)
        check(best[2] > 0 and s['score'] > before, f"{lv['name']}: a shot scores ({before} -> {s['score']})")
        pg.screenshot(path=str(OUT / f"archery-{lv['id']}.png"))

    # ---- Calm motion ----
    fresh(pg, calm=True)
    play(pg, OTHERS[0])
    a = pg.screenshot(); pg.wait_for_timeout(300)
    best, before = shoot(pg)
    pg.wait_for_function("__archeryState().phase === 'ready' || __archeryState().phase === 'end'", timeout=10000)
    check(ST(pg)['score'] > before, 'Calm motion: the prize wheel still plays')

    # ---- phone sideways ----
    ph = b.new_page(viewport={'width': 844, 'height': 390}, is_mobile=True, has_touch=True, device_scale_factor=2)
    ph.on('pageerror', lambda e: errors.append(str(e)))
    fresh(ph); play(ph, BALLOONS)
    ph.screenshot(path=str(OUT / 'archery-phone.png'))
    r = ph.evaluate("(() => { const c = document.querySelector('canvas'); const b = c.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom, innerWidth, innerHeight]; })()")
    check(r[0] >= -1 and r[1] >= -1 and r[2] <= r[4] + 1 and r[3] <= r[5] + 1, f'phone: the game fits the screen {r}')
    b.close()

check(not errors, 'no JavaScript errors' + (': ' + '; '.join(errors[:3]) if errors else ''))
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
sys.exit(1 if fails else 0)
