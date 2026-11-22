"""Automated test: players (profiles) and favorites on the arcade hub.

Run from the repo folder:   python3 tests/test_players.py
It opens the hub in a headless browser, makes a second player, checks that
favorites, maze and coloring saves stay separate per player, and that old
saves (from before players existed) still belong to player 1.
Screenshots go to tests/out/ (not committed).
"""
import json, os, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from playwright.sync_api import sync_playwright
import cmenu      # (the hub is drawn by Phaser + Rex UI since Nov 21: tap it where ArcadeMenus.list() says)

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
URL = (ROOT / 'index.html').as_uri()
errors, fails = [], []

def meta(page, game):
    """The words under a game's tile on the canvas hub (its medals and stars)."""
    return page.evaluate("""(id) => { for (const r of ArcadeMenus.current().rows) for (const it of r.items || [])
        if (it.attr === 'game-' + id) return (it.meta || []).filter(m => m.text).map(m => m.text).join(' '); return ''; }""", game)

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
        page.reload()
        st = page.evaluate('__hubState()')
        check(st['players'] == 1 and st['player'] == 'p1', f'{name}: starts with one player')
        cmenu.wait_screen(page, 'hub')
        check(page.is_hidden('#players') and cmenu.screen(page) == 'hub', f'{name}: no picker with only one player')
        check('3' in meta(page, 'bike'), f'{name}: old save still shows on player 1')

        # favorite Fishing -> it moves to the front
        cmenu.click(page, '[data-who]'); cmenu.wait_screen(page, 'hub-players')       # (hearts: in Who's playing? since Nov 22)
        cmenu.click(page, '[data-hearts]'); cmenu.wait_screen(page, 'hub'); cmenu.click(page, '[data-game=fishing]'); cmenu.click(page, '[data-hearts]')
        st = page.evaluate('__hubState()')
        check(st['order'][0] == 'fishing' and st['favorites'] == ['fishing'], f'{name}: favorite moves to the front')

        # add a second player (frog, named Mia)
        cmenu.click(page, '[data-who]'); cmenu.wait_screen(page, 'hub-players'); cmenu.click(page, '[data-add]')
        page.click('.pl-pet[data-pet=frog]')
        page.fill('.pl-name', 'Mia')
        page.screenshot(path=str(OUT / f'{name}-editor.png'))
        page.click('[data-ok]')
        cmenu.wait_screen(page, 'hub-players')
        check(page.is_hidden('#players'), f'{name}: editor closes, back to the canvas picker')
        page.screenshot(path=str(OUT / f'{name}-picker.png'))
        cmenu.click(page, '[data-close]')
        cmenu.wait_screen(page, 'hub')
        st = page.evaluate('__hubState()')
        check(st['players'] == 2 and st['player'] == 'p2', f'{name}: new player is playing')
        check(st['favorites'] == [] and st['order'][0] == 'bike', f'{name}: new player has own favorites')
        check(meta(page, 'bike') == '', f'{name}: new player has no medals yet')
        page.screenshot(path=str(OUT / f'{name}-hub-p2.png'), full_page=False)
        # music switch: player 2 turns music off, player 1 still has it on
        cmenu.click(page, '[data-who]'); cmenu.wait_screen(page, 'hub-players'); cmenu.click(page, '[data-music]')
        cmenu.click(page, '[data-close]'); cmenu.wait_screen(page, 'hub')
        check(page.evaluate('__hubState().musicOn') is False and page.evaluate('Arcade.audio.musicGain ? Arcade.audio.musicGain.gain.value : 0') == 0, f'{name}: music switch turns music off')
        cmenu.click(page, '[data-who]'); cmenu.wait_screen(page, 'hub-players'); cmenu.click(page, '[data-player=p1]')
        check(page.evaluate('__hubState().musicOn') is True, f'{name}: player 1 still has music on')
        cmenu.click(page, '[data-who]'); cmenu.wait_screen(page, 'hub-players'); cmenu.click(page, '[data-player=p2]')
        cmenu.wait_screen(page, 'hub')
        cmenu.click(page, '[data-who]'); cmenu.wait_screen(page, 'hub-players')
        bar = page.evaluate("ArcadeMenus.current().rows.find(r => (r.items || []).some(i => i.attr === 'music'))")
        mic = next(i for i in bar['items'] if i['attr'] == 'music')['icon']
        check(page.evaluate('__hubState().musicOn') is False and mic == page.evaluate('Arcade.icons.musicOff'), f'{name}: player 2 keeps music off')
        page.screenshot(path=str(OUT / f'{name}-hub-music-off.png'), full_page=False)
        cmenu.click(page, '[data-close]'); cmenu.wait_screen(page, 'hub')

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
        cmenu.wait_screen(page, 'hub-players')
        check(cmenu.screen(page) == 'hub-players', f'{name}: picker opens with 2 players')
        cmenu.click(page, '[data-player=p1]')
        st = page.evaluate('__hubState()')
        check(st['player'] == 'p1' and st['favorites'] == ['fishing'], f'{name}: switching back keeps player 1 favorites')

        # delete player 2 (bin needs two taps) -> their saves are gone
        cmenu.click(page, '[data-who]'); cmenu.wait_screen(page, 'hub-players'); cmenu.click(page, '[data-edit]'); cmenu.click(page, '[data-player=p2]')
        page.click('[data-del]')
        check(page.evaluate('__hubState()')['players'] == 2, f'{name}: one tap on the bin does not delete')
        page.click('[data-del]', force=True)   # force: the red bin wiggles, so don't wait for it to hold still
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
