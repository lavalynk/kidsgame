"""Automated test: Mini RC Racers' menus drawn with Phaser + Rex UI (Keith, Nov 20: "rewrite everything
to utilize Phaser 3 + Rex UI"; RC moved over Nov 21).

Run:  python3 tests/test_rc_menus.py
With real taps on the canvas (tests/cmenu.py), like a child:
  * tap-to-start -> the main menu: 10 picture tiles + Items / Help / Arcade
  * every sub menu opens and Back comes home: Cups, Free Play (Race / Drive / weather), Time Trial,
    My Car (3 tabs, picking a paint saves it, a locked car doesn't), Heart Battle, Coin Rush,
    Follow, Trophies (tap a trophy -> Go!), the Item Book
  * a Mini Cup: results as a podium picture, the Garage between races (buying an upgrade
    takes coins; tabs), the last race's cup podium
  * Heart Battle and Ghost Race results are pictures too
  * phones (upright + sideways): every tile on the screen, nothing tiny; the Track Builder and the
    Friends rooms' picture keys fit too
  * no JavaScript errors
Screenshots: tests/out/rc-menu-*.png
"""
import sys, pathlib
from playwright.sync_api import sync_playwright
import cmenu as cm
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

def open_rc(pg):
    pg.goto((ROOT / 'rc' / 'index.html').as_uri()); pg.evaluate('localStorage.clear()'); pg.reload()
    cm.wait_screen(pg, 'tap')
    vp = pg.viewport_size
    pg.mouse.click(vp['width'] // 2, vp['height'] // 2)
    cm.wait_screen(pg, 'rc-main')

def race_out(pg):
    """The game runs: let the computer driver finish it, then wait for the results."""
    cm.into_game(pg); pg.evaluate('__rcAuto(true)')
    for _ in range(400):
        if pg.evaluate('__rcState().over'): break
        pg.evaluate('__rcStep(1)')
    cm.wait_screen(pg, 'results'); pg.wait_for_timeout(600)

SUBS = [('menu-cup', 'rc-cups'), ('menu-free', 'rc-tracks-free'), ('menu-trial', 'rc-tracks-trial'), ('menu-car', 'rc-car'),
        ('menu-battle', 'rc-battle'), ('menu-rush', 'rc-play-rush'), ('menu-follow', 'rc-play-follow'), ('menu-shelf', 'rc-shelf'), ('items', 'rc-items'),
        ('menu-build', 'rc-mytracks')]

with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    open_rc(pg)

    # ---- the main menu ----
    its = cm.items(pg)
    tiles = [i['attr'] for i in its if i['attr'].startswith('menu-')]
    check(len(tiles) == 10 and all(i['pic'] for i in its if i['attr'].startswith('menu-')), f'main menu: 10 picture tiles ({tiles})')
    check({'items', 'help', 'arcade'} <= {i['attr'] for i in its}, 'main menu: Items, Help and Arcade buttons')
    check(all(i['shown'] for i in its), 'main menu: everything on the screen at once (no scrolling on a computer)')
    pg.screenshot(path=str(OUT / 'rc-menu-main.png'))

    # ---- every sub menu opens and Back comes home ----
    for attr, sid in SUBS:
        cm.tap(pg, attr); cm.wait_screen(pg, sid)
        check(cm.find(pg, 'back') is not None and len(cm.items(pg)) >= 2, f'{attr} -> {sid} (with a Back button)')
        pg.screenshot(path=str(OUT / f'rc-menu-{sid}.png'))
        cm.tap(pg, 'back'); cm.wait_screen(pg, 'rc-main')
    cm.tap(pg, 'help'); cm.wait_screen(pg, 'help'); cm.tap(pg, 'ok'); cm.wait_screen(pg, 'rc-main')
    check(True, 'Help opens and comes back')

    # ---- Free Play: Race / Drive and the weather ----
    cm.tap(pg, 'menu-free'); cm.wait_screen(pg, 'rc-tracks-free')
    check(len(cm.attrs(pg, 'track-t')) == 10, 'Free Play: 10 race tracks')
    cm.tap(pg, 'kind-drive'); pg.wait_for_timeout(500)
    check(len(cm.attrs(pg, 'track-fd-')) == 10 and cm.find(pg, 'kind-drive')['picked'], 'Drive: 10 Free Drive tracks, the Drive button is yellow')
    cm.tap(pg, 'weather-snow'); pg.wait_for_timeout(500)
    check(pg.evaluate('__game.save.data.weather') == 'snow' and cm.find(pg, 'weather-snow')['picked'], 'tapping the snowflake picks snow')
    cm.tap(pg, 'kind-race'); cm.tap(pg, 'weather-sun'); cm.tap(pg, 'back'); cm.wait_screen(pg, 'rc-main')

    # ---- My Car: tabs, a paint, a locked car ----
    cm.tap(pg, 'menu-car'); cm.wait_screen(pg, 'rc-car')
    locked = [i for i in cm.items(pg) if i['attr'].startswith('style-') and i['locked']]
    check(cm.find(pg, 'style-classic')['picked'] and locked, 'My Car: the Zoomer is picked, other cars are locked')
    cm.tap(pg, locked[0]['attr']); pg.wait_for_timeout(300)
    check(pg.evaluate("__game.save.data.style || 'classic'") == 'classic', 'a locked car can not be picked')
    cm.tap(pg, 'tab-paint'); pg.wait_for_timeout(600)
    cm.tap(pg, 'paint-blue'); pg.wait_for_timeout(600)
    check(pg.evaluate('__game.save.data.paint') == 'blue' and cm.find(pg, 'paint-blue')['picked'], 'Paint: blue saved and shown yellow')
    pg.screenshot(path=str(OUT / 'rc-menu-paint.png'))
    cm.tap(pg, 'tab-decal'); pg.wait_for_timeout(600)
    check(len(cm.attrs(pg, 'decal-')) >= 5, 'Stickers tab: the stickers')
    cm.tap(pg, 'back'); cm.wait_screen(pg, 'rc-main')

    # ---- Trophies: tap one, then Go! ----
    cm.tap(pg, 'menu-shelf'); cm.wait_screen(pg, 'rc-shelf')
    check(len(cm.attrs(pg, 'tro-')) == 14, 'Trophies: 14 spots on the shelf')
    cm.tap(pg, 'tro-t3'); pg.wait_for_timeout(500)
    check(cm.find(pg, 'go-t3') is not None and cm.find(pg, 'tro-t3')['picked'], 'tapping a trophy shows Go!')
    cm.tap(pg, 'go-t3'); pg.wait_for_function("typeof __rcState === 'function' && __rcState().track === 't3'", timeout=8000)
    check(True, 'Go! starts a race on that track')
    pg.evaluate('__game.menu()'); cm.wait_screen(pg, 'rc-main')

    # ---- a Mini Cup: podium, garage, cup podium ----
    cm.tap(pg, 'menu-cup'); cm.wait_screen(pg, 'rc-cups'); cm.tap(pg, 'cup-mini')
    for r in range(3):
        race_out(pg)
        rows = pg.evaluate("ArcadeMenus.current().rows.map(r => r.kind || r.t)")
        if r < 2:
            check(rows[0] == 'podium' and cm.find(pg, 'garage') is not None, f'cup race {r + 1}: a podium picture + the Garage button ({rows})')
            if r == 0: pg.screenshot(path=str(OUT / 'rc-menu-race-results.png'))
            cm.tap(pg, 'garage'); cm.wait_screen(pg, 'rc-garage')
            cm.tap(pg, 'gtab-up'); pg.wait_for_timeout(500)
            c0 = pg.evaluate('__game.save.data.mini.coins')
            cm.tap(pg, 'up-engine'); pg.wait_for_timeout(500)
            check(pg.evaluate('__game.save.data.mini.coins') < c0 and pg.evaluate('__game.save.data.mini.up.engine') == r + 1, f'Garage: buying the engine takes coins (race {r + 1})')
            if r == 0: pg.screenshot(path=str(OUT / 'rc-menu-garage.png'))
            cm.tap(pg, 'gtab-pts'); pg.wait_for_timeout(500)
            check(pg.evaluate("ArcadeMenus.current().tab") == 'pts', 'Garage: the Points tab')
            cm.tap(pg, 'next')
        else:
            check(rows[0] == 'cup-podium' and cm.find(pg, 'new mini cup') is not None, f'end of the cup: the trophy + podium picture ({rows})')
            pg.screenshot(path=str(OUT / 'rc-menu-cup-end.png'))
    cm.tap(pg, 'menu'); cm.wait_screen(pg, 'rc-main')

    # ---- Heart Battle + Ghost Race results ----
    cm.tap(pg, 'menu-battle'); cm.wait_screen(pg, 'rc-battle'); cm.tap(pg, 'arena-hb-yard')
    race_out(pg)
    check(pg.evaluate("ArcadeMenus.current().rows[0].kind") == 'podium' and cm.find(pg, 'again') is not None, 'Heart Battle results: a podium + Again')
    pg.screenshot(path=str(OUT / 'rc-menu-battle-results.png'))
    cm.tap(pg, 'menu'); cm.wait_screen(pg, 'rc-battle'); cm.tap(pg, 'back'); cm.wait_screen(pg, 'rc-main')
    cm.tap(pg, 'menu-ghost'); race_out(pg)
    check(pg.evaluate("ArcadeMenus.current().rows[0].kind") == 'boo', 'Ghost Race results: you and Boo as a picture')
    pg.screenshot(path=str(OUT / 'rc-menu-boo-results.png'))

    # ---- phones ----
    for name, vp in [('phone-up', {'width': 390, 'height': 844}), ('phone-side', {'width': 844, 'height': 390}), ('tablet', {'width': 1024, 'height': 768})]:
        ctx = b.new_context(viewport=vp, has_touch=True, is_mobile=True)
        p = ctx.new_page(); p.on('pageerror', lambda e: errors.append(f'{name}: {e}'))
        open_rc(p)
        for attr, sid in [(None, 'rc-main')] + SUBS:
            if attr:
                cm.click(p, f'[data-{attr.replace("-", "=", 1)}]' if '-' in attr else f'[data-{attr}]'); cm.wait_screen(p, sid)
            its = cm.items(p)
            off = [i['attr'] for i in its if i['x'] < -1 or i['x'] + i['w'] > vp['width'] + 1]
            tiny = [i['attr'] for i in its if min(i['w'], i['h']) < 44]
            check(not off and not tiny, f'{name} {sid}: on the screen, nothing tiny (off {off[:3]}, tiny {tiny[:3]})')
            if sid in ('rc-main', 'rc-tracks-free'): p.screenshot(path=str(OUT / f'rc-menu-{name}-{sid}.png'))
            if attr: cm.click(p, '[data-back]'); cm.wait_screen(p, 'rc-main')
        # the Track Builder + the Friends rooms (canvas screens since Nov 21, later)
        cm.tap(p, 'menu-build'); cm.wait_screen(p, 'rc-mytracks'); cm.tap(p, 'slot-0'); cm.wait_screen(p, 'rc-build')
        cm.tap(p, 'look'); p.wait_for_timeout(300)
        p.screenshot(path=str(OUT / f'rc-menu-{name}-build.png'))
        its = cm.items(p)
        hidden = [i['attr'] for i in its if not i['shown'] or i['y'] < 0 or i['y'] + i['h'] > vp['height'] + 1]
        tiny = [i['attr'] for i in its if min(i['w'], i['h']) < 44]
        board = cm.find(p, 'board')
        check(not hidden and not tiny and board['w'] >= vp['width'] * 0.35, f"{name} builder: all on the screen, nothing tiny, board {round(board['w'])} px wide (hidden {hidden[:3]}, tiny {tiny[:3]})")
        cm.tap(p, 'back'); cm.wait_screen(p, 'rc-mytracks'); cm.tap(p, 'back'); cm.wait_screen(p, 'rc-main')
        p.evaluate("localStorage.setItem('kidsArcade.server', 'ws://127.0.0.1:9')")     # (a switchboard address, so Friends shows)
        cm.tap(p, 'menu-free'); cm.wait_screen(p, 'rc-tracks-free'); cm.tap(p, 'kind-friends'); cm.wait_screen(p, 'rc-friends')
        cm.tap(p, 'joinroom'); cm.wait_screen(p, 'rc-join')
        its = cm.items(p)
        check(len([i for i in its if i['attr'].startswith('pic-')]) == 8 and all(i['shown'] and min(i['w'], i['h']) >= 44 for i in its), f'{name} Friends join: 8 big picture keys on the screen')
        for n in (1, 4): cm.tap(p, f'pic-{n}')
        check(cm.find(p, 'slot-1') is not None and cm.find(p, 'empty-2') is not None, f'{name} Friends join: tapped pictures fill the slots')
        p.screenshot(path=str(OUT / f'rc-menu-{name}-join.png'))
        cm.tap(p, 'slot-0'); check(cm.find(p, 'empty-0') is not None, f'{name} Friends join: tap a slot to take it back')
        cm.tap(p, 'back'); cm.wait_screen(p, 'rc-friends')
        ctx.close()
    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
