"""Automated test: the arcade hub (game-type tabs, favorites, "play again" row, phone layout).

Run from the repo folder:   python3 tests/test_hub.py
Since Nov 21 the hub is drawn by Phaser + Rex UI (a canvas menu, see the "Canvas menus" section in index.html),
so this test taps the pictures on the canvas where ArcadeMenus.list() says they are, like a child would.
It opens the hub at desktop, phone (upright + sideways) and tablet sizes and checks that the picture tabs filter
the games, that the Faves tab comes and goes with the hearts, that opening a game puts it in "play again" for that
player only, that every tap target is big enough, that the first games show without scrolling (sideways screens)
and that nothing sticks out of the screen.
Screenshots go to tests/out/ (not committed).
"""
import pathlib, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
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

def hit(pg, attr, touch=False):
    """Tap a hub thing for real where it is (or, if it's scrolled out of sight, through the menu)."""
    it = cmenu.find(pg, attr)
    assert it, f'no {attr} on the hub ({[i["attr"] for i in cmenu.items(pg)]})'
    if it['shown']: cmenu.tap(pg, attr, touch)
    else: pg.evaluate('a => ArcadeMenus.tap(a)', attr); pg.wait_for_timeout(300)
    pg.wait_for_timeout(150)

def fresh(pg):
    pg.reload(); cmenu.wait_screen(pg, 'hub')

SIZES = [('desktop', {'width': 1280, 'height': 860}), ('phone', {'width': 390, 'height': 844}),
         ('phone-side', {'width': 844, 'height': 390}), ('tablet', {'width': 820, 'height': 1180})]

with sync_playwright() as pw:
    b = pw.chromium.launch()
    for name, vp in SIZES:
        touch = name != 'desktop'
        ctx = b.new_context(viewport=vp, has_touch=touch, reduced_motion='reduce')
        page = ctx.new_page()
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(URL)
        page.evaluate('() => { localStorage.clear(); sessionStorage.clear(); }')
        fresh(page)
        st = page.evaluate('__hubState()')
        check(st['canvas'] and st['screen'] == 'hub', f'{name}: the hub is drawn by Phaser (canvas menu)')
        check(not page.locator('#grid').is_visible(), f'{name}: the old HTML hub is hidden')
        check(st['tab'] == 'all' and len(st['order']) == 14 and len(cmenu.attrs(page, 'game-')) == 14, f'{name}: All tab shows all 14 games')
        check('fav' not in st['tabs'] and not cmenu.find(page, 'tab-fav'), f'{name}: no Faves tab before any hearts')
        check(st['recent'] == [] and not cmenu.attrs(page, 'recent-'), f'{name}: no "play again" row on a fresh start')
        hearts = cmenu.attrs(page, 'fav-')
        check(len(hearts) == 14, f'{name}: every game tile has a heart ({len(hearts)})')

        # the first games show without scrolling on sideways screens and the desktop
        if name in ('desktop', 'phone-side', 'tablet'):
            bike = cmenu.find(page, 'game-bike')
            check(bike['shown'], f'{name}: the first game tile is on the screen without scrolling')

        # each type tab shows just its games
        for t, games in TYPES.items():
            hit(page, f'tab-{t}', touch)
            st = page.evaluate('__hubState()')
            check(st['tab'] == t and set(st['order']) == games and set(a[5:] for a in cmenu.attrs(page, 'game-')) == games, f'{name}: {t} tab shows {sorted(games)}')
            check(page.evaluate(f"__hubTile('tab-{t}').color") == 'yellow' and page.evaluate("__hubTile('tab-all').color") == 'white', f'{name}: the open {t} tab is yellow')
        page.screenshot(path=str(OUT / f'hub-{name}-calm.png'))

        # hearts: the Faves tab appears, shows only hearts, and goes away with the last one
        hit(page, 'tab-all', touch)
        hit(page, 'fav-maze', touch)
        hit(page, 'fav-rc', touch)
        st = page.evaluate('__hubState()')
        check('fav' in st['tabs'] and cmenu.find(page, 'tab-fav'), f'{name}: Faves tab appears after a heart')
        check(st['order'][:2] == ['rc', 'maze'] or st['order'][:2] == ['maze', 'rc'], f'{name}: hearted games come first ({st["order"][:3]})')
        tabs = [i for i in cmenu.items(page) if i['attr'].startswith('tab-')]
        rows = len(set(round(i['y']) for i in tabs))
        want = 1 if vp['width'] >= vp['height'] else 2
        check(rows == want, f'{name}: the 6 tabs sit on {want} row(s) (got {rows})')
        check(all(i['x'] >= 0 and i['x'] + i['w'] <= vp['width'] for i in tabs), f'{name}: every tab is on the screen')
        page.screenshot(path=str(OUT / f'hub-{name}-faves.png'))
        hit(page, 'tab-fav', touch)
        st = page.evaluate('__hubState()')
        check(set(st['order']) == {'maze', 'rc'} and set(cmenu.attrs(page, 'game-')) == {'game-maze', 'game-rc'}, f'{name}: Faves tab shows only hearted games')
        hit(page, 'fav-maze', touch); hit(page, 'fav-rc', touch)
        st = page.evaluate('__hubState()')
        check(st['tab'] == 'all' and 'fav' not in st['tabs'] and len(st['order']) == 14, f'{name}: no hearts left -> back to All')

        # "play again": opening games remembers the last 3, newest first
        for g in ['bike', 'fishing', 'coloring', 'space']:
            page.evaluate(f"Arcade.store.markPlayed('{g}')")
        page.evaluate("Arcade.store.markPlayed('bike')")
        fresh(page)
        st = page.evaluate('__hubState()')
        check(st['recent'] == ['bike', 'space', 'coloring'] and cmenu.attrs(page, 'recent-') == ['recent-bike', 'recent-space', 'recent-coloring'], f'{name}: play-again row is newest first ({st["recent"]})')
        if name in ('desktop', 'phone-side'):
            check(cmenu.find(page, 'game-bike')['shown'], f'{name}: with "play again" the first game tile still shows without scrolling')
        hit(page, 'tab-sports', touch)
        check(not cmenu.attrs(page, 'recent-'), f'{name}: play-again row only on the All tab')
        # the tab is remembered after a reload
        hit(page, 'tab-race', touch); fresh(page)
        check(page.evaluate('__hubState().tab') == 'race' and cmenu.find(page, 'tab-race'), f'{name}: open tab remembered')
        hit(page, 'tab-all', touch)
        page.wait_for_timeout(300)
        page.screenshot(path=str(OUT / f'hub-{name}.png'))

        # layout: nothing off the screen sideways; buttons big enough for little fingers
        bad, small = [], []
        for i in cmenu.items(page):
            if i['x'] < -1 or i['x'] + i['w'] > vp['width'] + 1: bad.append(i['attr'])
            if i['shown'] and (min(i['w'], i['h']) < 44): small.append(f"{i['attr']} {i['w']:.0f}x{i['h']:.0f}")
        check(not bad, f'{name}: nothing pokes out sideways ({bad[:4]})')
        check(not small, f'{name}: every hub button is big enough for little fingers ({small[:4]})')
        sw = page.evaluate('document.documentElement.scrollWidth')
        check(sw <= vp['width'], f'{name}: no sideways scrolling ({sw} <= {vp["width"]})')
        tiles = [i for i in cmenu.items(page) if i['attr'].startswith('game-')][:4]
        rows = len(set(round(i['y']) for i in tiles))
        want = {'desktop': 1, 'phone': 2, 'phone-side': 1, 'tablet': 2}[name]   # rows used by the first 4 boxes
        check(rows == want, f'{name}: first 4 game tiles sit on {want} row(s) (got {rows})')

        # the page scrolls with the mouse wheel / a drag (the canvas panel), so the last game can be reached
        last = page.evaluate('__hubState().order').pop()
        page.evaluate('ArcadeMenus.scroller.t = 1'); page.wait_for_timeout(300)
        check(cmenu.find(page, f'game-{last}')['shown'] and cmenu.find(page, 'grownups')['shown'], f'{name}: scrolled down, the last game + Grown-ups show')
        page.screenshot(path=str(OUT / f'hub-{name}-bottom.png'))
        page.evaluate('ArcadeMenus.scroller.t = 0'); page.wait_for_timeout(200)

        # tapping a play-again button opens that game (and it is recorded)
        hit(page, 'recent-space', touch)
        page.wait_for_url('**/space/index.html', timeout=5000)
        check(page.url.endswith('space/index.html'), f'{name}: play-again button opens the game')
        page.go_back(); page.wait_for_load_state(); cmenu.wait_screen(page, 'hub')
        check(page.evaluate('__hubState().recent')[0] == 'space', f'{name}: opened game moves to the front')
        # tapping a game tile opens it
        hit(page, 'game-golf', touch)
        page.wait_for_url('**/golf/index.html', timeout=5000)
        check(page.url.endswith('golf/index.html'), f'{name}: a game tile opens the game')
        page.go_back(); page.wait_for_load_state(); cmenu.wait_screen(page, 'hub')

        # a second player has their own play-again row
        page.evaluate("Arcade.profiles.use(Arcade.profiles.add({pet: 'frog'}).id)")
        page.evaluate("sessionStorage.setItem('kidsArcade.picked', '1')")
        fresh(page)
        check(page.evaluate('__hubState().recent') == [] and not cmenu.attrs(page, 'recent-'), f'{name}: new player has their own play-again row')
        page.evaluate("Arcade.profiles.use('p1')"); fresh(page)
        check(page.evaluate('__hubState().recent')[0] == 'golf', f'{name}: player 1 keeps theirs')

        # turning the screen redraws the hub for the new shape
        if name == 'phone':
            page.set_viewport_size({'width': 844, 'height': 390}); page.wait_for_timeout(900)
            tabs = [i for i in cmenu.items(page) if i['attr'].startswith('tab-')]
            check(len(set(round(i['y']) for i in tabs)) == 1 and all(i['x'] + i['w'] <= 845 for i in cmenu.items(page)), 'phone turned sideways: the hub is redrawn to fit')
        ctx.close()
    b.close()

if errors: print('JS errors:', errors)
print(f'\n{len(fails)} failed' if fails or errors else '\nall passed')
raise SystemExit(1 if fails or errors else 0)
