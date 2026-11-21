"""Automated test: the menus drawn with Phaser + Rex UI (arcade/canvasmenu.js, Keith Nov 20), in every game that uses them.

Run:  python3 tests/test_canvas_menus.py            (or: python3 tests/test_canvas_menus.py hoops)
For each game (one more joins every session, see ROADMAP):
  * tap-to-start -> the picture menu: a big Play + the small picture buttons, all with real taps on the canvas
  * Levels: every level is a tile (locked ones don't start), Back returns
  * Prizes: picking something changes the save; Trophies and Help open and come back
  * Play -> Pause (the corner button): the pause menu, Keep playing goes on
  * the end of a round -> results with Next / Again / Menu / Arcade; Again starts over
  * phones (upright + sideways): everything on the screen and big enough
  * no JavaScript errors
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
import cmenu as cm
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

# game -> (a prize to pick + the save key it sets, how to end a round now)
GAMES = {
    'jungle': {'prize': ('hero-monkey', 'hero', 'monkey'),
               'end': "(() => { const w = __jungleTest.world(); __jungleTest.teleport(w.goal.x - 15, w.goal.y - 60); })()"},
    'hoops':  {'prize': ('ball-classic', 'ball', 'classic'), 'end': '__hoopsEnd()'},
    'quest':  {'prize': None, 'end': '__questPick(0); __questTest.win()'},
    # (Nov 21: the five games that only use the kit's menus)
    'archery': {'prize': ('hat-cap', 'hat', 'cap'), 'end': '__game.finish({ win: true, stars: 2, score: 120 })'},
    'trail':   {'prize': ('hat-safari', 'hat', 'safari'), 'end': '__game.finish({ win: true, stars: 2, score: 120 })'},
    'space':   {'prize': ('ship-zippy', 'ship', 'zippy'), 'end': '__game.finish({ win: true, stars: 2, score: 120 })'},
    'abc':     {'prize': ('voice', 'voice', False), 'end': '__game.finish({ win: true, stars: 2, score: 120 })'},
    'golf':    {'prize': ('ball-white', 'ball', 'white'), 'end': '__game.finish({ win: true, stars: 2, score: 120 })'},
    # (Nov 21: Turbo Bike; its Shop, cups and track builder are walked in test_bike_shop / _cup / _tracks)
    'bike':    {'prize': ('bike-red', 'bike', 'red'), 'end': '__game.finish({ win: true, stars: 2, time: 30, medal: "silver", next: true })'},
}
only = sys.argv[1:]

with sync_playwright() as pw:
    b = pw.chromium.launch()
    for game, info in GAMES.items():
        if only and game not in only: continue
        pg = b.new_page(viewport={'width': 1280, 'height': 720})
        pg.on('pageerror', lambda e: errors.append(f'{game}: {e}'))
        pg.goto((ROOT / game / 'index.html').as_uri()); pg.evaluate('localStorage.clear()'); pg.reload(); pg.wait_for_timeout(400)
        cm.wait_screen(pg, 'tap')
        check(len(cm.items(pg)) == 1, f'{game}: tap-to-start shows one big Play picture')
        cm.to_title(pg)
        its = cm.items(pg)
        check(its[0]['attr'] == 'start' and {'levels', 'help', 'arcade'} <= {i['attr'] for i in its}, f"{game}: picture menu = Play + {[i['attr'] for i in its[1:]]}")
        pg.screenshot(path=str(OUT / f'cmenu-{game}-title.png'))
        # levels
        cm.tap(pg, 'levels'); cm.wait_screen(pg, 'levels')
        lv = [i for i in cm.items(pg) if i['attr'].startswith('level-')]
        locked = [i for i in lv if i['locked']]
        check(len(lv) >= 2 and all(i['pic'] for i in lv), f'{game}: levels are tiles with pictures ({len(lv)})')
        if locked:
            cm.tap(pg, locked[0]['attr']); pg.wait_for_timeout(300)
            check(cm.screen(pg) == 'levels', f'{game}: a locked level does not start')
        pg.screenshot(path=str(OUT / f'cmenu-{game}-levels.png'))
        cm.tap(pg, 'back'); cm.wait_screen(pg, 'title')
        # prizes, trophies, help
        if info['prize']:
            attr, key, val = info['prize']
            cm.tap(pg, 'unlocks'); cm.wait_screen(pg, 'unlocks')
            pg.evaluate(f"__game.save.data.{key} = 'zzz'")
            cm.tap(pg, attr); pg.wait_for_timeout(600)
            check(pg.evaluate(f'__game.save.data.{key}') == val, f'{game}: picking a prize saves it ({key} = {val})')
            cm.tap(pg, 'back'); cm.wait_screen(pg, 'title')
        cm.tap(pg, 'trophies'); cm.wait_screen(pg, 'trophies')
        check(len(cm.items(pg)) >= 2, f'{game}: trophies open')
        cm.tap(pg, 'back'); cm.wait_screen(pg, 'title')
        cm.tap(pg, 'help'); cm.wait_screen(pg, 'help')
        cm.tap(pg, 'ok'); cm.wait_screen(pg, 'title')
        # play, pause, results
        cm.tap(pg, 'start'); pg.wait_for_timeout(1500)
        check(pg.evaluate('__game.state') == 'play' and not pg.evaluate('ArcadeMenus.isOpen'), f'{game}: Play starts a round (the menu goes away)')
        pg.click('.ar-pause'); cm.wait_screen(pg, 'pause')
        check({'resume', 'restart', 'menu', 'arcade'} <= {i['attr'] for i in cm.items(pg)}, f'{game}: pause menu')
        pg.screenshot(path=str(OUT / f'cmenu-{game}-pause.png'))
        cm.tap(pg, 'resume'); pg.wait_for_timeout(400)
        check(pg.evaluate('__game.state') == 'play', f'{game}: Keep playing')
        pg.evaluate(info['end']); cm.wait_screen(pg, 'results', 12000)
        res = {i['attr'] for i in cm.items(pg)}
        check({'again', 'arcade'} <= res, f'{game}: results with {sorted(res)}')
        pg.wait_for_timeout(800); pg.screenshot(path=str(OUT / f'cmenu-{game}-results.png'))
        cm.tap(pg, 'again'); pg.wait_for_timeout(800)
        check(pg.evaluate('__game.state') == 'play', f'{game}: Again starts over')
        pg.close()
        # phones: a finger on the menus, upright and sideways
        for name, vp in [('phone-up', {'width': 390, 'height': 844}), ('phone-side', {'width': 844, 'height': 390})]:
            ctx = b.new_context(viewport=vp, has_touch=True, is_mobile=True)
            ph = ctx.new_page(); ph.on('pageerror', lambda e: errors.append(f'{game} {name}: {e}'))
            ph.goto((ROOT / game / 'index.html').as_uri()); ph.evaluate('localStorage.clear()'); ph.reload(); ph.wait_for_timeout(400)
            cm.to_title(ph)
            ok = all(i['x'] >= -1 and i['x'] + i['w'] <= vp['width'] + 1 and i['y'] >= -1 and i['y'] + i['h'] <= vp['height'] + 1 and min(i['w'], i['h']) >= 44 for i in cm.items(ph))
            check(ok, f'{game} {name}: every picture button is on the screen and big enough')
            cm.tap(ph, 'levels', touch=True); cm.wait_screen(ph, 'levels')
            ph.screenshot(path=str(OUT / f'cmenu-{game}-{name}.png'))
            check(cm.find(ph, 'back') is not None, f'{game} {name}: a finger opens the level picker')
            ctx.close()
    b.close()

check(not errors, 'no JavaScript errors' + ('' if not errors else ': ' + '; '.join(errors[:3])))
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
sys.exit(1 if fails else 0)
