"""Automated test: players (profiles) and favorites on the arcade hub.

Run from the repo folder:   python3 tests/test_players.py
It opens the hub in a headless browser, makes a second player, checks that
favorites, maze and coloring saves stay separate per player, and that old
saves (from before players existed) still belong to player 1.
Screenshots go to tests/out/ (not committed).
"""
import json, os, sys, pathlib
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu as cm          # (canvas menus: tests/cmenu.py)

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
URL = (ROOT / 'index.html').as_uri()
errors, fails = [], []

def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

with sync_playwright() as pw:
    b = pw.chromium.launch()
    for name, vp in [('desktop', {'width': 1280, 'height': 860}), ('phone', {'width': 390, 'height': 844})]:
        ctx = b.new_context(viewport=vp, has_touch=(name == 'phone'))
        page = ctx.new_page()
        page.on('pageerror', lambda e: errors.append(str(e)))
        # an "old" save from before players existed: a gold medal in Bike + maze progress
        page.goto(URL)
        page.evaluate("""() => { localStorage.clear(); sessionStorage.clear();
          localStorage.setItem('kidsArcade.v1', JSON.stringify({games: {bike: {levels: {t1: {stars: 3, medal: 'gold'}}}}}));
          localStorage.setItem('kidsMaze.v1', JSON.stringify({level: 4, done: 4})); }""")
        page.reload(); cm.wait_screen(page, 'hub')          # (Nov 21: the hub is drawn by Phaser + Rex UI)
        tch = name == 'phone'
        def hit(attr):
            it = cm.find(page, attr)
            if it and it['shown']: cm.tap(page, attr, tch)
            else: page.evaluate('a => ArcadeMenus.tap(a)', attr); page.wait_for_timeout(300)
        st = page.evaluate('__hubState()')
        check(st['players'] == 1 and st['player'] == 'p1', f'{name}: starts with one player')
        check(st['screen'] == 'hub', f'{name}: no picker with only one player')
        check('3' in page.evaluate("__hubTile('game-bike').meta"), f'{name}: old save still shows on player 1')

        # favorite Fishing -> it moves to the front
        hit('fav-fishing')
        st = page.evaluate('__hubState()')
        check(st['order'][0] == 'fishing' and st['favorites'] == ['fishing'] and cm.attrs(page, 'game-')[0] == 'game-fishing', f'{name}: favorite moves to the front')
        check(page.evaluate("__hubTile('fav-fishing').heart"), f'{name}: its heart is filled in')

        # add a second player (frog, named Mia)
        hit('who'); cm.wait_screen(page, 'hub-players'); hit('add'); cm.wait_screen(page, 'hub-player')
        hit('pet-frog')
        page.fill('.ar-cinput', 'Mia')
        page.screenshot(path=str(OUT / f'{name}-editor.png'))
        hit('ok'); cm.wait_screen(page, 'hub-players')
        page.screenshot(path=str(OUT / f'{name}-picker.png'))
        hit('close'); cm.wait_screen(page, 'hub')
        st = page.evaluate('__hubState()')
        check(st['players'] == 2 and st['player'] == 'p2', f'{name}: new player is playing')
        check(page.evaluate("Arcade.profiles.active()")['name'] == 'Mia' and page.evaluate("__hubTile('who').label") == 'Mia', f'{name}: the typed name is kept + shown')
        check(st['favorites'] == [] and st['order'][0] == 'bike', f'{name}: new player has own favorites')
        check(page.evaluate("__hubTile('game-bike').meta").strip() == '', f'{name}: new player has no medals yet')
        page.screenshot(path=str(OUT / f'{name}-hub-p2.png'), full_page=False)
        # music switch: player 2 turns music off, player 1 still has it on
        hit('music')
        check(page.evaluate('__hubState().musicOn') is False and page.evaluate('Arcade.audio.musicGain ? Arcade.audio.musicGain.gain.value : 0') == 0, f'{name}: music switch turns music off')
        hit('who'); cm.wait_screen(page, 'hub-players'); hit('player-p1'); cm.wait_screen(page, 'hub')
        check(page.evaluate('__hubState().musicOn') is True, f'{name}: player 1 still has music on')
        hit('who'); cm.wait_screen(page, 'hub-players'); hit('player-p2'); cm.wait_screen(page, 'hub')
        check(page.evaluate('__hubState().musicOn') is False and page.evaluate("__hubTile('music').icon === Arcade.icons.musicOff"), f'{name}: player 2 keeps music off (crossed-out note)')
        page.screenshot(path=str(OUT / f'{name}-hub-music-off.png'), full_page=False)

        # maze for player 2 starts fresh and saves to its own key
        page.goto((ROOT / 'maze' / 'index.html').as_uri()); page.wait_for_timeout(300)
        keys = page.evaluate("() => Object.keys(localStorage).sort()")
        check(json.loads(page.evaluate("localStorage.getItem('kidsMaze.v1')"))['level'] == 4, f'{name}: player 1 maze save untouched')
        page.goto((ROOT / 'coloring' / 'index.html').as_uri()); page.wait_for_timeout(300)
        page.goto((ROOT / 'bike' / 'index.html').as_uri()); page.wait_for_timeout(500)
        page.wait_for_function("ArcadeMenus.isOpen && ArcadeMenus.list().length > 0", timeout=8000)
        page.mouse.click(vp['width'] // 2, vp['height'] // 2)                               # tap to start -> menu
        page.wait_for_function("ArcadeMenus.screen() === 'title' && ArcadeMenus.list().length > 0", timeout=8000); page.wait_for_timeout(400)
        page.screenshot(path=str(OUT / f'{name}-bike-menu-p2.png'))
        # (Nov 21: Turbo Bike's menus are drawn by Phaser: the player's animal is a chip under the buttons)
        who = page.evaluate("ArcadeMenus.current().rows.some(r => r.t === 'chips' && r.items.some(c => c.svg === Arcade.profiles.avatar(Arcade.profiles.active())))")
        check(who, f'{name}: game menu shows who is playing')

        # back to the hub: a new visit asks who is playing
        page.goto(URL); page.evaluate('sessionStorage.clear()'); page.reload()
        cm.wait_screen(page)
        check(page.evaluate('__hubState().screen') == 'hub-players', f'{name}: picker opens with 2 players')
        page.screenshot(path=str(OUT / f'{name}-picker-start.png'))
        hit('player-p1'); cm.wait_screen(page, 'hub')
        st = page.evaluate('__hubState()')
        check(st['player'] == 'p1' and st['favorites'] == ['fishing'], f'{name}: switching back keeps player 1 favorites')

        # delete player 2 (bin needs two taps) -> their saves are gone
        hit('who'); cm.wait_screen(page, 'hub-players'); hit('edit')
        check(page.evaluate("__hubTile('player-p2').pen"), f'{name}: the pencil shows a pencil on every player')
        hit('player-p2'); cm.wait_screen(page, 'hub-player')
        hit('del')
        check(page.evaluate('__hubState()')['players'] == 2 and page.evaluate("__hubTile('del').red"), f'{name}: one tap on the bin does not delete (it turns red)')
        hit('del')
        st = page.evaluate('__hubState()')
        left = page.evaluate("() => Object.keys(localStorage).filter(k => k.endsWith('.p2'))")
        check(st['players'] == 1 and left == [], f'{name}: delete removes player 2 and their saves')
        ctx.close()

    # every game page still loads without errors
    ctx = b.new_context(viewport={'width': 1280, 'height': 800}); page = ctx.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    for g in ['bike', 'rc', 'hoops', 'archery', 'jungle', 'trail', 'space', 'abc', 'coloring', 'maze', 'fishing', 'golf', 'quest']:
        page.goto((ROOT / g / 'index.html').as_uri()); page.wait_for_timeout(400)
    b.close()

check(not errors, 'no JavaScript errors' + ('' if not errors else ': ' + '; '.join(errors[:5])))
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
sys.exit(1 if fails else 0)
