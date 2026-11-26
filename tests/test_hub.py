"""Automated test: the arcade hub (one list of games, hearts, no "play again" row, phone layout).

Run from the repo folder:   python3 tests/test_hub.py
The hub is drawn by Phaser + Rex UI (Nov 21, "Canvas hub" in index.html), so this test taps the
canvas where ArcadeMenus.list() says things are (tests/cmenu.py), with the mouse or a finger.
At desktop, phone (upright + sideways) and tablet sizes it checks that every game is in one list
(no category tabs: Keith, Nov 22 "categories can go away"), that hearted games (heart button, then
tap games) move to the front and back again, that there's no "play again" row, that every tap target is big
enough, and that nothing sticks out of the screen. Screenshots go to tests/out/ (not committed).
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

SIZES = [('desktop', {'width': 1280, 'height': 860}), ('phone', {'width': 390, 'height': 844}),
         ('phone-side', {'width': 844, 'height': 390}), ('tablet', {'width': 820, 'height': 1180})]

def hub(pg):
    cmenu.wait_screen(pg, 'hub')
    return pg.evaluate('__hubState()')

def tap(pg, attr, touch):
    """Tap it for real where it is (or through the menu when it's scrolled out of sight)."""
    cmenu.click(pg, f'[data-{attr}]' if '-' not in attr else '[data-{}={}]'.format(*attr.split('-', 1)), touch=touch)

with sync_playwright() as pw:
    b = pw.chromium.launch()
    for name, vp in SIZES:
        touch = name != 'desktop'
        ctx = b.new_context(viewport=vp, has_touch=touch, reduced_motion='reduce')
        page = ctx.new_page()
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(URL)
        page.evaluate('() => { localStorage.clear(); sessionStorage.clear(); }')
        page.reload()
        st = hub(page)
        check(st['canvas'] and page.is_hidden('#grid'), f'{name}: the hub is drawn by Phaser (HTML hub hidden)')
        check(len(st['order']) == 15, f'{name}: the hub shows all 15 games')
        check(len(cmenu.attrs(page, 'game-')) == 15, f'{name}: 15 game tiles on the canvas')
        check(not any(i['attr'].startswith('tab-') for i in cmenu.items(page)), f'{name}: no category tabs (Keith, Nov 22)')
        check(not cmenu.attrs(page, 'recent-'), f'{name}: no "play again" row (Keith, Nov 22)')
        check(all(cmenu.find(page, a) for a in ['who', 'book', 'house', 'daily', 'juke', 'grownups']),
              f'{name}: player, book, house, daily surprise, jukebox and grown-ups buttons')
        check(not any(cmenu.find(page, a) for a in ['music', 'age', 'hearts']), f'{name}: music / age / hearts are not on the hub (they are in Who\'s playing?)')
        bar = page.evaluate("ArcadeMenus.current().footer.items.map(i => i.attr)")
        check(bar == ['who', 'daily', 'book', 'house', 'juke'], f'{name}: the bar at the bottom has 5 buttons and always stays put ({bar})')
        page.screenshot(path=str(OUT / f'hub-{name}-calm.png'))

        # hearts: heart button, tap two games, heart button again -> they come first
        tap(page, 'who', touch); cmenu.wait_screen(page, 'hub-players')
        check(all(cmenu.find(page, a) for a in ['music', 'age', 'hearts']), f'{name}: Who\'s playing? has music, little/big and hearts')
        tap(page, 'hearts', touch)
        check(page.evaluate('__hubState().hearting') and page.evaluate('ArcadeMenus.screen()') == 'hub', f'{name}: the heart button goes back to the hub in heart mode')
        tap(page, 'game-maze', touch); tap(page, 'game-rc', touch)
        check(page.url.endswith('index.html') and not page.url.endswith('maze/index.html'), f'{name}: in heart mode a tap hearts the game (no game opens)')
        picked = {i['attr'] for i in cmenu.items(page) if i['picked'] and i['attr'].startswith('game-')}
        check(picked == {'game-maze', 'game-rc'}, f'{name}: hearted games are yellow ({picked})')
        page.screenshot(path=str(OUT / f'hub-{name}-hearts.png'))
        tap(page, 'hearts', touch)
        st = hub(page)
        check(st['order'][:2] in (['rc', 'maze'], ['maze', 'rc']), f'{name}: hearted games come first ({st["order"][:2]})')
        page.screenshot(path=str(OUT / f'hub-{name}-faves.png'))
        check(len(st['order']) == 15, f'{name}: hearts do not hide any game')
        tap(page, 'who', touch); cmenu.wait_screen(page, 'hub-players'); tap(page, 'hearts', touch)
        tap(page, 'game-maze', touch); tap(page, 'game-rc', touch); tap(page, 'hearts', touch)
        st = hub(page)
        check(st['order'][:2] == ['bike', 'rc'] and len(st['order']) == 15, f'{name}: no hearts left -> the usual order')

        # games played before: still no "play again" row
        for g in ['bike', 'fishing', 'coloring', 'space']:
            page.evaluate(f"Arcade.store.markPlayed('{g}')")
        page.reload(); hub(page)
        check(not cmenu.attrs(page, 'recent-'), f'{name}: no play-again row after playing games')
        page.screenshot(path=str(OUT / f'hub-{name}.png'))

        # layout: nothing off the screen sideways; buttons big enough for little fingers
        sw = page.evaluate('document.documentElement.scrollWidth')
        check(sw <= vp['width'], f'{name}: no sideways scrolling ({sw} <= {vp["width"]})')
        its = [i for i in cmenu.items(page) if i['shown']]
        small = [i['attr'] for i in its if min(i['w'], i['h']) < 50]
        check(not small, f'{name}: every hub button is big enough for little fingers ({small} too small)')
        # (sideways; up and down, the scrolling part may cut a tile in half: that's scrolling)
        out = [i['attr'] for i in its if i['x'] < 0 or i['x'] + i['w'] > vp['width'] + 1]
        bar = [i['attr'] for i in its if i['attr'] in ('who', 'daily', 'book', 'house', 'juke') and (i['y'] < 0 or i['y'] + i['h'] > vp['height'] + 1)]
        check(not out and not bar, f'{name}: nothing off the screen ({out + bar})')

        # a game tile opens its game
        tap(page, 'game-golf', touch)
        page.wait_for_url('**/golf/index.html', timeout=5000)
        check(page.url.endswith('golf/index.html'), f'{name}: a game tile opens the game')
        page.goto(URL); hub(page)

        # the music button (in Who's playing?)
        tap(page, 'who', touch); cmenu.wait_screen(page, 'hub-players')
        tap(page, 'music', touch)
        check(page.evaluate('__hubState().musicOn') is False, f'{name}: music button turns the music off')
        tap(page, 'music', touch)
        check(page.evaluate('__hubState().musicOn') is True, f'{name}: ...and on again')
        tap(page, 'close', touch); hub(page)

        # the grown-ups button goes to the Parent corner (which asks for its own 3-second hold)
        tap(page, 'grownups', touch)
        page.wait_for_url('**/parent/index.html', timeout=5000)
        check(page.url.endswith('parent/index.html'), f'{name}: Grown-ups button opens the Parent corner')
        ctx.close()
    b.close()

if errors: print('JS errors:', errors)
print(f'\n{len(fails)} failed' if fails or errors else '\nall passed')
raise SystemExit(1 if fails or errors else 0)
