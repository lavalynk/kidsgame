"""Automated test: the arcade hub (game-type tabs, hearts, "play again" row, phone layout).

Run from the repo folder:   python3 tests/test_hub.py
The hub is drawn by Phaser + Rex UI (Nov 21, "Canvas hub" in index.html), so this test taps the
canvas where ArcadeMenus.list() says things are (tests/cmenu.py), with the mouse or a finger.
At desktop, phone (upright + sideways) and tablet sizes it checks that the picture tabs filter
the games, that hearts (heart button, then tap games) bring the Faves tab and take it away again,
that opening a game puts it in "play again" for that player only, that every tap target is big
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
TYPES = {'race': {'bike', 'rc'}, 'action': {'jungle', 'trail', 'quest', 'space'},
         'sports': {'hoops', 'golf', 'archery', 'fishing'}, 'calm': {'abc', 'coloring', 'maze', 'piano'}}

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
        check(st['tab'] == 'all' and len(st['order']) == 14, f'{name}: All tab shows all 14 games')
        check(len(cmenu.attrs(page, 'game-')) == 14, f'{name}: 14 game tiles on the canvas')
        check('fav' not in st['tabs'] and not cmenu.find(page, 'tab-fav'), f'{name}: no Faves tab before any hearts')
        check(st['recent'] == [] and not cmenu.attrs(page, 'recent-'), f'{name}: no "play again" row on a fresh start')
        check(all(cmenu.find(page, a) for a in ['who', 'music', 'age', 'hearts', 'book', 'house', 'daily', 'grownups']),
              f'{name}: player, music, age, hearts, book, house, daily surprise and grown-ups buttons')

        # each type tab shows just its games
        for t, games in TYPES.items():
            tap(page, f'tab-{t}', touch)
            st = hub(page)
            shown = {a[5:] for a in cmenu.attrs(page, 'game-')}
            check(st['tab'] == t and set(st['order']) == games and shown == games, f'{name}: {t} tab shows {sorted(games)}')
        page.screenshot(path=str(OUT / f'hub-{name}-calm.png'))

        # hearts: heart button, tap two games, heart button again -> the Faves tab appears
        tap(page, 'tab-all', touch)
        tap(page, 'hearts', touch)
        check(page.evaluate('__hubState().hearting'), f'{name}: heart button turns on heart mode')
        tap(page, 'game-maze', touch); tap(page, 'game-rc', touch)
        check(page.url.endswith('index.html') and not page.url.endswith('maze/index.html'), f'{name}: in heart mode a tap hearts the game (no game opens)')
        picked = {i['attr'] for i in cmenu.items(page) if i['picked'] and i['attr'].startswith('game-')}
        check(picked == {'game-maze', 'game-rc'}, f'{name}: hearted games are yellow ({picked})')
        page.screenshot(path=str(OUT / f'hub-{name}-hearts.png'))
        tap(page, 'hearts', touch)
        st = hub(page)
        check('fav' in st['tabs'] and cmenu.find(page, 'tab-fav'), f'{name}: Faves tab appears after a heart')
        check(st['order'][:2] in (['rc', 'maze'], ['maze', 'rc']), f'{name}: hearted games come first ({st["order"][:2]})')
        page.screenshot(path=str(OUT / f'hub-{name}-faves.png'))
        tap(page, 'tab-fav', touch)
        st = hub(page)
        check(set(st['order']) == {'maze', 'rc'}, f'{name}: Faves tab shows only hearted games')
        tap(page, 'hearts', touch); tap(page, 'game-maze', touch); tap(page, 'game-rc', touch); tap(page, 'hearts', touch)
        st = hub(page)
        check(st['tab'] == 'all' and 'fav' not in st['tabs'] and len(st['order']) == 14, f'{name}: no hearts left -> back to All')

        # "play again": opening games remembers the last 3, newest first
        for g in ['bike', 'fishing', 'coloring', 'space']:
            page.evaluate(f"Arcade.store.markPlayed('{g}')")
        page.evaluate("Arcade.store.markPlayed('bike')")
        page.reload()
        st = hub(page)
        check(st['recent'] == ['bike', 'space', 'coloring'] and cmenu.attrs(page, 'recent-') == ['recent-clock', 'recent-bike', 'recent-space', 'recent-coloring'],
              f'{name}: play-again row is newest first ({st["recent"]})')
        tap(page, 'tab-sports', touch)
        check(not cmenu.attrs(page, 'recent-'), f'{name}: play-again row only on the All tab')
        # the tab is remembered after a reload
        tap(page, 'tab-race', touch); page.reload()
        check(hub(page)['tab'] == 'race', f'{name}: open tab remembered')
        tap(page, 'tab-all', touch)
        page.screenshot(path=str(OUT / f'hub-{name}.png'))

        # layout: nothing off the screen sideways; buttons big enough for little fingers
        sw = page.evaluate('document.documentElement.scrollWidth')
        check(sw <= vp['width'], f'{name}: no sideways scrolling ({sw} <= {vp["width"]})')
        its = [i for i in cmenu.items(page) if i['shown']]
        small = [i['attr'] for i in its if min(i['w'], i['h']) < 50]
        check(not small, f'{name}: every hub button is big enough for little fingers ({small} too small)')
        # (sideways; up and down, the scrolling part may cut a tile in half: that's scrolling)
        out = [i['attr'] for i in its if i['x'] < 0 or i['x'] + i['w'] > vp['width'] + 1]
        bar = [i['attr'] for i in its if i['attr'] in ('who', 'music', 'age', 'hearts', 'book', 'house', 'tab-all') and (i['y'] < 0 or i['y'] + i['h'] > vp['height'] + 1)]
        check(not out and not bar, f'{name}: nothing off the screen ({out + bar})')

        # tapping a play-again button opens that game (and it is recorded)
        tap(page, 'recent-space', touch)
        page.wait_for_url('**/space/index.html', timeout=5000)
        check(page.url.endswith('space/index.html'), f'{name}: play-again button opens the game')
        page.goto(URL)
        check(hub(page)['recent'][0] == 'space', f'{name}: opened game moves to the front')
        # a game tile opens its game
        tap(page, 'game-golf', touch)
        page.wait_for_url('**/golf/index.html', timeout=5000)
        check(page.url.endswith('golf/index.html'), f'{name}: a game tile opens the game')
        page.goto(URL); hub(page)

        # music + little/big buttons on the bar
        tap(page, 'music', touch)
        check(page.evaluate('__hubState().musicOn') is False, f'{name}: music button turns the music off')
        tap(page, 'music', touch)
        check(page.evaluate('__hubState().musicOn') is True, f'{name}: ...and on again')

        # a second player has their own play-again row
        page.evaluate("Arcade.profiles.use(Arcade.profiles.add({pet: 'frog'}).id)")
        page.evaluate("sessionStorage.setItem('kidsArcade.picked', '1')")
        page.reload()
        check(hub(page)['recent'] == [], f'{name}: new player has their own play-again row')
        page.evaluate("Arcade.profiles.use('p1')"); page.reload()
        check(hub(page)['recent'][0] == 'golf', f'{name}: player 1 keeps theirs')

        # the grown-ups button goes to the Parent corner (which asks for its own 3-second hold)
        tap(page, 'grownups', touch)
        page.wait_for_url('**/parent/index.html', timeout=5000)
        check(page.url.endswith('parent/index.html'), f'{name}: Grown-ups button opens the Parent corner')
        ctx.close()
    b.close()

if errors: print('JS errors:', errors)
print(f'\n{len(fails)} failed' if fails or errors else '\nall passed')
raise SystemExit(1 if fails or errors else 0)
