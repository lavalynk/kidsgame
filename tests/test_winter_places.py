"""Automated test: Winter Wonderland's snowy places (Nov 28, 20-point plan #6, part 2).

Run:  python3 tests/test_winter_places.py
Checks, for each game with a snowy place:
  * out of winter (and in a headless test that doesn't pretend a season) the snowy place isn't there
  * in winter (localStorage kidsArcade.testSeason = 'winter') it is, it opens, and a robot plays it through
  * its special thing works (Putt-Putt: the ball glides on ice, snowmen bounce, snow drifts slow it down)
Screenshots: tests/out/winter_<game>_*.png
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu as cm
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what, flush=True)
    if not ok: fails.append(what)

def fresh(pg, game, season=None):
    pg.goto((ROOT / game / 'index.html').as_uri())
    pg.evaluate("(s) => { localStorage.clear(); if (s) localStorage.setItem('kidsArcade.testSeason', s); }", season)
    pg.reload(); pg.wait_for_timeout(600)

def picker_tabs(pg):
    cm.wait_screen(pg, 'tap'); cm.to_title(pg); cm.tap(pg, 'levels'); cm.wait_screen(pg, 'levels')
    return [i for i in cm.items(pg) if i['attr'].startswith('tab-')]

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('pageerror', lambda e: errors.append(str(e)))

    # ================= Putt-Putt Park: Snowy Hollow =================
    G = '__golfState()'
    REST = '["aim", "in"].includes(__golfState().state) || __golfState().done'
    for season in ('summer', None):
        fresh(pg, 'golf', season)
        check(len(picker_tabs(pg)) == 2, f'golf ({season or "headless, no pretend"}): no Snow tab out of winter')
    fresh(pg, 'golf', 'winter')
    tabs = picker_tabs(pg)
    check(len(tabs) == 3, f'golf in winter: a 3rd tab, Snow ({len(tabs)})')
    cm.tap(pg, 'tab-2'); pg.wait_for_timeout(500)
    tiles = [(i['attr'], i['locked']) for i in cm.items(pg) if i['attr'].startswith('level-')]
    check(tiles == [('level-w1', False), ('level-w2', True), ('level-w3', True), ('level-course3', True)],
          f'Snow tab: 3 snowy holes + "all 3", the first one open ({tiles})')
    pg.screenshot(path=str(OUT / 'winter_golf_menu.png'))
    # the ice: a gentle putt glides much further than on the plain snow
    glide = pg.evaluate('''() => { const h = __golfWinter.hole('w1'), o = { cupR: 0, magnet: 0, magnetR: 0 };
        const go = (hh) => { const b = { x: 360, y: 305, vx: 260, vy: 0 }; let n = 0;
          while (Math.hypot(b.vx, b.vy) > 8 && n++ < 6000) __golfWinter.step(b, hh, 0, 1 / 360, o); return b.x - 360; };
        return [go(Object.assign({}, h, { ice: [] })), go(h)]; }''')
    check(glide[1] > glide[0] * 1.5, f'the ball glides on the ice: the same putt rolls {glide[1]:.0f} units on the ice, {glide[0]:.0f} without it')
    drift = pg.evaluate('''() => { const h = __golfWinter.hole('w2'), o = { cupR: 0, magnet: 0, magnetR: 0 };
        const b = { x: 520, y: 200, vx: 300, vy: 0 }; for (let i = 0; i < 60; i++) __golfWinter.step(b, h, 0, 1 / 360, o); return b.vx; }''')
    check(drift < 250, f'a snow drift slows the ball like sand ({drift:.0f})')
    for i in (1, 2, 3):
        pg.evaluate(f'__game.play({{"id": "w{i}"}})'); pg.wait_for_timeout(2500)
        s = pg.evaluate(G)
        check(s['hole'] == f'w{i}' and s['snow'], f'snowy hole {i} starts')
        pg.screenshot(path=str(OUT / f'winter_golf_w{i}.png'))
        for _ in range(10):
            s = pg.evaluate(G)
            if s['state'] == 'in' or s['done']: break
            pg.evaluate('__golfBot()'); pg.wait_for_function(REST, timeout=25000)
        pg.wait_for_function('__golfState().done', timeout=8000)
        s = pg.evaluate(G)
        check(s['strokes'] <= s['par'] + 2, f"snowy hole {i}: the bot is in after {s['strokes']} putts (par {s['par']})")
        pg.wait_for_timeout(1300)
    # a straight putt on Snowman Slalom bumps a snowman
    pg.evaluate('__game.play({"id": "w2"})'); pg.wait_for_timeout(2500)
    pg.evaluate('__golfShoot(Math.atan2(235 - 300, 380 - 200), 0.5)'); pg.wait_for_function(REST, timeout=15000)
    check(pg.evaluate('__golfState().bumps') > 0, 'Snowman Slalom: the ball bounced off a snowman')
    save = pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.v1')).games.golf")
    check(all(save['levels'].get(f'w{i}', {}).get('done') for i in (1, 2, 3)) and 'snowall' in save['achievements'] and 'icy' in save['achievements'],
          f"all 3 snowy holes saved as done; trophies Snow champ + Ice glider ({save['achievements']})")
    # after winter: the holes hide again, but what was done is kept
    pg.evaluate("localStorage.setItem('kidsArcade.testSeason', 'spring')"); pg.reload(); pg.wait_for_timeout(600)
    check(len(picker_tabs(pg)) == 2 and pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.v1')).games.golf.levels.w3.done"),
          'in spring the Snow tab is gone, but the snowy holes stay done for next winter')

    # ================= Turbo Bike: Frosty Village =================
    def bike_tiles(pg):
        cm.wait_screen(pg, 'tap'); cm.to_title(pg); cm.tap(pg, 'levels'); cm.wait_screen(pg, 'levels')
        return [i['attr'] for i in cm.items(pg) if i['attr'].startswith('level-')]
    fresh(pg, 'bike', 'summer')
    check('level-w1' not in bike_tiles(pg), 'bike: no Frosty Village out of winter')
    fresh(pg, 'bike', 'winter')
    tl = bike_tiles(pg)
    check('level-w1' in tl, f'bike in winter: the Frosty Village tile is there ({len(tl)} tiles)')
    pg.screenshot(path=str(OUT / 'winter_bike_menu.png'))
    def bike_ride(seed, little=False):
        pg.evaluate("document.activeElement && document.activeElement.blur(); __game.play(__bikeTrack('w1'))")
        pg.wait_for_function("typeof __bikeKid === 'function' && __bikeState().level === 'w1'")
        pg.evaluate(f'__bikeKid(true, {seed})')
        shot = False
        for _ in range(500):
            pg.evaluate('__bikeStep(0.1)')
            if not shot and pg.evaluate('__bikeState().bike.wet'):
                pg.evaluate('__bikeKid(false)'); pg.wait_for_timeout(120); pg.screenshot(path=str(OUT / 'winter_bike_drift.png')); shot = True
                pg.evaluate(f'__bikeKid(true, {seed})')
            if pg.evaluate('__bikeState().finished'): break
        r = pg.evaluate('__bikeKidReport()'); pg.evaluate('__bikeKid(false)')
        return r, shot
    r, shot = bike_ride(13)
    check(r['finished'] and shot, f"Frosty Village: a pretend big kid rides it through the snow drifts ({r['time']} s, {r['medal']}, {r['crashes']} tumbles)")
    check(r['medal'] in ('gold', 'silver'), f"...and gets a good medal (par {r['par']}: {r['medal']})")
    check(pg.evaluate("__bikeState().drifts") >= 3, f"the snow drifts went POOF ({pg.evaluate('__bikeState().drifts')} of 4)")
    pg.wait_for_timeout(2000)
    save = pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.v1')).games.bike")
    check(save['levels'].get('w1', {}).get('done') and 'frosty' in save['achievements'], f"saved as done + trophy Snow rider ({save['achievements']})")
    draw = pg.evaluate('''() => { const c = document.createElement('canvas'); c.width = 960; c.height = 540; const x = c.getContext('2d');
        __bikeScene.draw(x, 'winter', '', 300, 1); return c.toDataURL().length; }''')
    check(draw > 20000, 'bike: the Frosty Village scenery draws')

    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
sys.exit(1 if fails else 0)
