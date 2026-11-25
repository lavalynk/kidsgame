"""Automated test: the hub's seasons (Nov 25, new plan point 10, part 2: "seasonal hub looks").

Run from the repo folder:   python3 tests/test_seasons.py
Checks, on the canvas hub:
  * Arcade.season() follows the date (Dec-Feb winter, Mar-May spring, Jun-Aug summer, Sep-Nov autumn), also a
    pretend test day (localStorage kidsArcade.testDay); kidsArcade.testSeason picks one ('off' = none)
  * each season: things fall (rise, for summer's bubbles) behind the menu, the rim has its decoration (a snow cap in
    winter, the two top corners otherwise) and Bop wears that season's clothes
  * the falling things sit BEHIND the game tiles (a tile's middle looks the same with and without them)
  * only the hub has a season (not "Who's playing?")
  * Calm motion: nothing falls, the rim decoration + Bop's clothes stay
  * the hub is still a resting menu (pacing), taps on the tiles still work
Screenshots: tests/out/season-*.png
"""
import pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from playwright.sync_api import sync_playwright
import cmenu

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
URL = (ROOT / 'index.html').as_uri()
errors, fails = [], []

def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

def fresh(b, vp, season=None, day=None, calm=False):
    ctx = b.new_context(viewport=vp, reduced_motion='reduce' if calm else 'no-preference')
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(URL)
    pg.evaluate('() => { localStorage.clear(); sessionStorage.clear(); }')
    if season: pg.evaluate(f"localStorage.setItem('kidsArcade.testSeason', '{season}')")
    if day: pg.evaluate(f"localStorage.setItem('kidsArcade.testDay', '{day}')")
    pg.reload()
    cmenu.wait_screen(pg, 'hub')
    pg.wait_for_timeout(700)
    return ctx, pg

with sync_playwright() as pw:
    b = pw.chromium.launch()
    DESK = {'width': 1280, 'height': 860}

    # ---- the date picks the season ----
    ctx, pg = fresh(b, DESK)
    for day, want in [('2026-12-20', 'winter'), ('2027-01-05', 'winter'), ('2026-02-28', 'winter'), ('2026-03-01', 'spring'),
                      ('2026-05-31', 'spring'), ('2026-06-01', 'summer'), ('2026-08-15', 'summer'), ('2026-09-01', 'autumn'), ('2026-11-25', 'autumn')]:
        got = pg.evaluate(f"() => {{ localStorage.setItem('kidsArcade.testDay', '{day}'); return Arcade.season(); }}")
        check(got == want, f'{day} is {want} ({got})')
    ctx.close()
    ctx, pg = fresh(b, DESK, day='2026-12-24')
    check(pg.evaluate('__hubState().season.season') == 'winter', 'a December day: the hub shows winter')
    ctx.close()

    # ---- each season ----
    for season, decor in [('winter', 1), ('spring', 2), ('summer', 2), ('autumn', 2)]:
        ctx, pg = fresh(b, DESK, season=season)
        st = pg.evaluate('__hubState()')
        check(st['season']['season'] == season, f'{season}: the hub is in {season}')
        check(st['season']['falling'] >= 1, f'{season}: things fall')
        check(st['season']['decor'] == decor, f'{season}: the rim decoration is there ({st["season"]["decor"]})')
        check(st['mascot']['dress'], f'{season}: Bop is dressed for it')
        check(pg.evaluate("ArcadeMenus.current().rows[0].dress") == pg.evaluate(f"Arcade.mascot.dress.{season}"), f'{season}: in the {season} clothes')
        pg.wait_for_timeout(2500)
        pg.screenshot(path=str(OUT / f'season-{season}.png'))
        ctx.close()

    # ---- behind the tiles: a tile's middle is the same picture over time (things fall behind it) ----
    ctx, pg = fresh(b, DESK, season='winter')
    pg.evaluate("ArcadeMenus.current().rows")
    tile = cmenu.find(pg, 'game-hoops')
    clip = {'x': tile['x'] + tile['w'] * 0.3, 'y': tile['y'] + tile['h'] * 0.25, 'width': tile['w'] * 0.4, 'height': tile['h'] * 0.3}
    shots = []
    for i in range(6):
        shots.append(pg.screenshot(clip=clip)); pg.wait_for_timeout(700)
    check(len(set(shots)) == 1, f'the snow falls behind the tiles ({len(set(shots))} different pictures of a tile)')
    pace = pg.evaluate('ArcadeMenus.pacing()')
    check(not pace['quick'], f'the hub with the snow is a resting menu ({pace})')
    # only the hub
    pg.evaluate("ArcadeMenus.tap('who')"); cmenu.wait_screen(pg, 'hub-players')
    check(pg.evaluate('__hubState().season.season') == '', '"Who\'s playing?" has no season')
    pg.evaluate("ArcadeMenus.tap('close')"); cmenu.wait_screen(pg, 'hub')
    check(pg.evaluate('__hubState().season.season') == 'winter', 'back on the hub: winter again')
    # the tiles still work
    cmenu.tap(pg, 'game-hoops'); pg.wait_for_timeout(1500)
    check('hoops' in pg.url, f'tapping a game tile still opens it ({pg.url[-30:]})')
    ctx.close()

    # ---- off ----
    ctx, pg = fresh(b, DESK, season='off')
    st = pg.evaluate('__hubState()')
    check(st['season']['season'] == '' and not st['mascot']['dress'], 'season off: no season, plain Bop')
    ctx.close()

    # ---- phones ----
    for name, vp in [('phone', {'width': 390, 'height': 844}), ('phone-side', {'width': 844, 'height': 390}), ('tablet', {'width': 820, 'height': 1180})]:
        ctx, pg = fresh(b, vp, season='winter')
        check(pg.evaluate('__hubState().season.decor') == 1, f'{name}: the snow cap is there')
        pg.wait_for_timeout(1500)
        pg.screenshot(path=str(OUT / f'season-{name}.png'))
        ctx.close()

    # ---- Calm motion ----
    ctx, pg = fresh(b, DESK, season='autumn', calm=True)
    st = pg.evaluate('__hubState()')
    check(st['season']['falling'] == 0, 'Calm motion: nothing falls')
    check(st['season']['decor'] == 2 and st['mascot']['dress'], 'Calm motion: the corner leaves + Bop\'s scarf stay')
    ctx.close()
    b.close()

check(not errors, f'no JavaScript errors ({errors[:3]})')
print('\nAll passed' if not fails else f'\n{len(fails)} FAILED')
sys.exit(1 if fails else 0)
