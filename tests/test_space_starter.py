"""Automated test: Space Defender's starter sector, Cotton Clouds (Nov 24, new plan point 7).

Run:  python3 tests/test_space_starter.py
Checks: Cotton Clouds is first on the sector list and open; Moon Base is still open (nobody's save
gets locked) and an old save keeps its sectors; Play takes a little kid (and a brand-new player)
there, but a big kid who already flies the real sectors goes on to their next sector; it plays on
Easy with an extra life, only bobbers fly in (nobody blows bubbles at you), the bosses are Baby
Bobber + Puffy the Rain Cloud; a pretend little kid wins it first go; winning gives the First flight
trophy and Next goes to Moon Base. Screenshots in tests/out/space-starter-*.png.
"""
import json, pathlib
from playwright.sync_api import sync_playwright
import cmenu as cm
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

def open_page(b, little, levels=None, vp={'width': 1280, 'height': 720}):
    pg = b.new_page(viewport=vp)
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto((ROOT / 'space' / 'index.html').as_uri())
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': 'little' if little else 'big'}]}
    pg.evaluate("p => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); }", json.dumps(prof))
    pg.reload(); pg.wait_for_timeout(300)
    if levels:
        pg.evaluate("lv => { Object.assign(__game.save.levels, lv); __game.store(); }", levels)
        pg.reload(); pg.wait_for_timeout(300)
    cm.to_title(pg)
    return pg

def play_sector(pg):
    """Tap Play and get into the game; return which sector started."""
    cm.tap(pg, 'start'); cm.into_game(pg)
    pg.wait_for_function("typeof __spaceState === 'function' && __spaceState().phase")
    return pg.evaluate('__spaceState().sector')

with sync_playwright() as pw:
    b = pw.chromium.launch()

    # ---- little kid, brand new: the list + Play ----
    pg = open_page(b, True)
    cm.tap(pg, 'levels'); cm.wait_screen(pg, 'levels')
    lv = [i for i in cm.items(pg) if i['attr'].startswith('level-')]
    check(lv and lv[0]['attr'] == 'level-s0', f"Cotton Clouds is first on the sector list ({lv[0]['attr'] if lv else None})")
    d = {i['attr']: i for i in lv}
    check(not d['level-s0']['locked'] and not d['level-s1']['locked'], 'Cotton Clouds + Moon Base are both open')
    check(d['level-s2']['locked'], 'Candy Nebula still waits for Moon Base')
    pg.screenshot(path=str(OUT / 'space-starter-list.png'))
    cm.tap(pg, 'back'); cm.wait_screen(pg, 'title')
    check(play_sector(pg) == 's0', 'a little kid: Play starts Cotton Clouds')
    pg.close()

    # ---- big kids ----
    pg = open_page(b, False)
    check(play_sector(pg) == 's0', 'a brand-new big kid: Play starts Cotton Clouds too')
    pg.close()
    old = {'s1': {'done': True, 'stars': 3}, 's2': {'done': True, 'stars': 2}}
    pg = open_page(b, False, old)
    check(play_sector(pg) == 's3', 'a big kid with Moon Base + Candy Nebula done: Play goes on to Ring Planet (skips the starter)')
    pg.close()
    pg = open_page(b, True, old)
    check(play_sector(pg) == 's0', 'a little kid with an old save: Play offers the starter (not done yet)')
    pg.evaluate("__game.save.levels.s0 = { done: true, stars: 3 }; __game.store()")
    pg.close()

    # ---- the sector itself (little kid) ----
    pg = open_page(b, True)
    pg.evaluate("__game.play(SpaceData.STARTER)")
    pg.wait_for_function("typeof __spaceTest === 'object' && __spaceState().sector === 's0'")
    st = pg.evaluate('__spaceState()')
    check(pg.evaluate('__game.difficulty') == 'easy', 'it plays on Easy')
    check(st['lives'] == 8, f"a little kid gets 8 lives here (5 Easy + 2 little + 1 starter): {st['lives']}")
    pg.evaluate('__spaceTest.kid(true, 21)')
    kinds, minis, bigs = set(), set(), set()
    shots_by_enemies = 0
    for _ in range(400):
        pg.evaluate('__spaceTest.step(0.5)')
        p = pg.evaluate('__spaceTest.peek()')
        for e in p['enemies']: kinds.add(e[2])
        s = pg.evaluate('__spaceState()')
        if s['boss']: (minis if s['boss']['kind'] == 'mini' else bigs).add(s['boss']['id'])
        elif p['bullets'] and s['phase'] == 'waves': shots_by_enemies += len(p['bullets'])
        if s['boss'] and s['boss']['kind'] == 'big' and not pg.evaluate("window.__shotBoss"):
            pg.evaluate('__spaceTest.step(3)'); pg.screenshot(path=str(OUT / 'space-starter-boss.png')); pg.evaluate('window.__shotBoss = 1')
        if s['finished']: break
    rep = pg.evaluate('__spaceTest.kidReport()')
    check(kinds <= {'bobber', 'squad', 'gift'}, f'only bobbers (+ squads of them, + the gift saucer) fly in: {sorted(kinds)}')
    check(shots_by_enemies == 0, f'nobody blows bubbles in the waves ({shots_by_enemies})')
    check(minis == {'babyBob'} and bigs == {'puffy'}, f'the bosses are Baby Bobber + Puffy the Rain Cloud ({minis}, {bigs})')
    check(rep['won'], f"a pretend little kid wins it first go ({sum(rep['hits'].values())} bumps, {rep['time']} s)")
    check(40 <= rep['time'] <= 150, f"it's a short flight: {rep['time']} s")
    pg.wait_for_timeout(2500)
    cm.wait_screen(pg, 'results')
    pg.screenshot(path=str(OUT / 'space-starter-results.png'))
    check(pg.evaluate("__game.hasTrophy('starter')"),
          'the First flight trophy')
    cm.tap(pg, 'next'); cm.into_game(pg)
    pg.wait_for_function("typeof __spaceState === 'function' && __spaceState().sector !== 's0'")
    check(pg.evaluate('__spaceState().sector') == 's1', 'Next goes to Moon Base')
    pg.close()

    # ---- phone, upright + sideways: the background draws, no errors ----
    for vp in ({'width': 844, 'height': 390}, {'width': 390, 'height': 844}):
        pg = open_page(b, True, vp=vp)
        pg.evaluate("__game.play(SpaceData.STARTER)")
        pg.wait_for_function("typeof __spaceTest === 'object' && __spaceState().sector === 's0'")
        pg.evaluate('__spaceTest.step(6)'); pg.wait_for_timeout(300)
        pg.screenshot(path=str(OUT / f"space-starter-phone-{vp['width']}.png"))
        pg.close()
    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
raise SystemExit(1 if fails else 0)
