"""Automated test: the arcade hub (game-type tabs, "play again" row, phone layout).

Run from the repo folder:   python3 tests/test_hub.py
Opens the hub at desktop, phone (portrait + sideways) and tablet sizes, checks that
the picture tabs filter the games, that the Faves tab comes and goes with the hearts,
that opening a game puts it in "play again" for that player only, that every tap
target is big enough, and that nothing sticks out sideways on a phone.
Screenshots go to tests/out/ (not committed).
"""
import pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
URL = (ROOT / 'index.html').as_uri()
errors, fails = [], []
TYPES = {'race': {'bike', 'rc'}, 'action': {'jungle', 'trail', 'space'},
         'sports': {'hoops', 'archery', 'fishing'}, 'calm': {'abc', 'coloring', 'maze', 'piano'}}

def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

SIZES = [('desktop', {'width': 1280, 'height': 860}), ('phone', {'width': 390, 'height': 844}),
         ('phone-side', {'width': 844, 'height': 390}), ('tablet', {'width': 820, 'height': 1180})]

with sync_playwright() as pw:
    b = pw.chromium.launch()
    for name, vp in SIZES:
        touch = name != 'desktop'
        ctx = b.new_context(viewport=vp, has_touch=touch)
        page = ctx.new_page()
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(URL)
        page.evaluate('() => { localStorage.clear(); sessionStorage.clear(); }')
        page.reload()
        st = page.evaluate('__hubState()')
        check(st['tab'] == 'all' and len(st['order']) == 12, f'{name}: All tab shows all 12 games')
        check('fav' not in st['tabs'], f'{name}: no Faves tab before any hearts')
        check(st['recent'] == [] and page.is_hidden('#recent'), f'{name}: no "play again" row on a fresh start')

        # each type tab shows just its games
        for t, games in TYPES.items():
            page.click(f'[data-tab={t}]')
            st = page.evaluate('__hubState()')
            check(st['tab'] == t and set(st['order']) == games, f'{name}: {t} tab shows {sorted(games)}')
        page.screenshot(path=str(OUT / f'hub-{name}-calm.png'))

        # hearts: the Faves tab appears, shows only hearts, and goes away with the last one
        page.click('[data-tab=all]')
        page.click('[data-game=maze] .fav')
        page.click('[data-game=rc] .fav')
        st = page.evaluate('__hubState()')
        check('fav' in st['tabs'], f'{name}: Faves tab appears after a heart')
        rows = page.evaluate("new Set([...document.querySelectorAll('.tab')].map(t => Math.round(t.getBoundingClientRect().top))).size")
        check(rows == 1, f'{name}: all 6 tabs fit on one row')
        page.screenshot(path=str(OUT / f'hub-{name}-faves.png'))
        page.click('[data-tab=fav]')
        st = page.evaluate('__hubState()')
        check(set(st['order']) == {'maze', 'rc'}, f'{name}: Faves tab shows only hearted games')
        page.click('[data-game=maze] .fav'); page.click('[data-game=rc] .fav')
        st = page.evaluate('__hubState()')
        check(st['tab'] == 'all' and 'fav' not in st['tabs'] and len(st['order']) == 12, f'{name}: no hearts left -> back to All')

        # "play again": opening games remembers the last 3, newest first
        for g in ['bike', 'fishing', 'coloring', 'space']:
            page.evaluate(f"Arcade.store.markPlayed('{g}')")
        page.evaluate("Arcade.store.markPlayed('bike')")
        page.reload()
        st = page.evaluate('__hubState()')
        check(st['recent'] == ['bike', 'space', 'coloring'], f'{name}: play-again row is newest first ({st["recent"]})')
        page.click('[data-tab=sports]')
        check(page.is_hidden('#recent'), f'{name}: play-again row only on the All tab')
        st = page.evaluate('__hubState()')
        page.click('[data-tab=all]')
        # the tab is remembered after a reload
        page.click('[data-tab=race]'); page.reload()
        check(page.evaluate('__hubState().tab') == 'race', f'{name}: open tab remembered')
        page.click('[data-tab=all]')
        page.screenshot(path=str(OUT / f'hub-{name}.png'))
        page.screenshot(path=str(OUT / f'hub-{name}-full.png'), full_page=True)

        # tapping a play-again button opens that game (and it is recorded)
        page.click('[data-recent=space]')
        page.wait_for_url('**/space/index.html', timeout=5000)
        check(page.url.endswith('space/index.html'), f'{name}: play-again button opens the game')
        page.go_back(); page.wait_for_load_state()
        check(page.evaluate('__hubState().recent')[0] == 'space', f'{name}: opened game moves to the front')

        # a second player has their own play-again row
        page.evaluate("Arcade.profiles.use(Arcade.profiles.add({pet: 'frog'}).id)")
        page.evaluate("sessionStorage.setItem('kidsArcade.picked', '1')")
        page.reload()
        check(page.evaluate('__hubState().recent') == [], f'{name}: new player has their own play-again row')
        page.evaluate("Arcade.profiles.use('p1')"); page.reload()
        check(page.evaluate('__hubState().recent')[0] == 'space', f'{name}: player 1 keeps theirs')

        # layout: nothing sideways-scrolls; buttons big enough for little fingers
        sw = page.evaluate('document.documentElement.scrollWidth')
        check(sw <= vp['width'], f'{name}: no sideways scrolling ({sw} <= {vp["width"]})')
        small = page.evaluate("""() => [...document.querySelectorAll('.tab, .rc-btn, .card .fav, .who, .mus')]
            .map(e => e.getBoundingClientRect()).filter(r => Math.min(r.width, r.height) < 50 || r.width * r.height < 3900).length""")
        check(small == 0, f'{name}: every hub button is big enough for little fingers ({small} too small)')
        rows = page.evaluate("new Set([...document.querySelectorAll('.tab')].map(t => Math.round(t.getBoundingClientRect().top))).size")
        check(rows == 1, f'{name}: the picture tabs fit on one row')
        cols = page.evaluate("""() => new Set([...document.querySelectorAll('#grid .card')].slice(0, 4).map(c => Math.round(c.getBoundingClientRect().top))).size""")
        want = {'desktop': 2, 'phone': 2, 'phone-side': 1, 'tablet': 2}[name]   # rows used by the first 4 boxes
        check(cols == want, f'{name}: first 4 game boxes sit on {want} row(s) (got {cols})')
        ctx.close()
    b.close()

if errors: print('JS errors:', errors)
print(f'\n{len(fails)} failed' if fails or errors else '\nall passed')
raise SystemExit(1 if fails or errors else 0)
