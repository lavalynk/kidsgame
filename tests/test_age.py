"""Automated test: the Little / Big age preset for each player.

Run from the repo folder:   python3 tests/test_age.py
- Hub: the player editor has Little / Big buttons; a little kid gets a sprout badge.
- Games: a little kid always plays on Easy, racing/action games run slower
  (g.speed), and the extra help works: in RC and Turbo Bike the vehicle drives
  itself forward (a little kid who presses nothing still finishes laps in RC),
  RC rivals are slower, Space Defender gives 2 extra lives.
- A big kid's games are unchanged.
Screenshots go to tests/out/ (not committed).
"""
import json, pathlib
from playwright.sync_api import sync_playwright
import cmenu as cm          # (canvas menus: tests/cmenu.py)

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
errors, fails = [], []

def bar_icon(page, attr):
    """The picture on a button of the canvas hub's bar (who / music / age...)."""
    return page.evaluate("""(a) => { const c = ArcadeMenus.current(); for (const r of [c.footer].concat(c.rows)) for (const it of (r && r.items) || [])
        if (it.attr === a) return it.icon; return ''; }""", attr)

def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

def players(age):
    """two players; player 2 (playing) has the given age"""
    return json.dumps({'active': 'p2', 'list': [
        {'id': 'p1', 'name': 'Sam', 'pet': 'cat', 'color': '#ef476f'},
        {'id': 'p2', 'name': 'Mia', 'pet': 'frog', 'color': '#06d6a0', 'age': age}]})

def open_game(page, folder, age):
    url = (ROOT / folder / 'index.html').as_uri()
    page.goto(url)
    page.evaluate("(p) => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); }", players(age))
    page.reload(); page.wait_for_timeout(400)

def start_first_level(page):
    """title screen -> START (or the first item) -> playing"""
    if page.evaluate("!!window.ArcadeMenus && !!document.querySelector('.ar-cmenu')"):   # (wait until a canvas title screen is drawn)
        page.wait_for_function("ArcadeMenus.isOpen && ArcadeMenus.list().length > 0", timeout=8000)
    page.mouse.click(400, 300); page.wait_for_timeout(600)
    if page.evaluate("!!(window.ArcadeMenus && ArcadeMenus.isOpen)"):        # (menus drawn by Phaser + Rex UI, like Jungle Jump's)
        page.wait_for_function("ArcadeMenus.screen() === 'title' && ArcadeMenus.list().length > 0", timeout=8000); page.wait_for_timeout(400)
        it = next(i for i in page.evaluate('ArcadeMenus.list()') if i['attr'] == 'start')
        page.mouse.click(it['x'] + it['w'] / 2, it['y'] + it['h'] / 2)
    else:
        page.click('[data-start]')
    page.wait_for_timeout(500)
    page.wait_for_function("window.__game && __game.state === 'play'", timeout=8000)

with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])

    # ---------- hub: the editor's Little / Big buttons ----------
    for name, vp in [('desktop', {'width': 1280, 'height': 860}), ('phone', {'width': 390, 'height': 844})]:
        ctx = b.new_context(viewport=vp, has_touch=(name == 'phone'))
        page = ctx.new_page()
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto((ROOT / 'index.html').as_uri())
        page.evaluate('localStorage.clear(); sessionStorage.clear()'); page.reload()
        check(page.evaluate('__hubState().age') == 'big', f'{name}: player 1 starts as a big kid')
        cm.wait_screen(page, 'hub')
        cm.click(page, '[data-who]'); cm.wait_screen(page, 'hub-players'); cm.click(page, '[data-add]')
        check(page.is_visible('.pl-age[data-age=big].sel'), f'{name}: a new player starts on Big')
        sizes = page.evaluate("[...document.querySelectorAll('.pl-age')].map(b => Math.min(b.offsetWidth, b.offsetHeight))")
        check(len(sizes) == 2 and min(sizes) >= 70, f'{name}: age buttons are big ({sizes})')
        page.click('.pl-age[data-age=little]')
        page.fill('.pl-name', 'Mia')
        page.screenshot(path=str(OUT / f'age-{name}-editor.png'))
        page.click('[data-ok]')
        cm.wait_screen(page, 'hub-players')
        little = page.evaluate("Arcade.icons.little")
        tile = page.evaluate("ArcadeMenus.current().rows[0].items.find(i => i.attr === 'player-p2')")
        check(any(m.get('svg') == little for m in tile['meta']), f'{name}: picker shows the little badge')
        page.screenshot(path=str(OUT / f'age-{name}-picker.png'))
        cm.click(page, '[data-close]'); cm.wait_screen(page, 'hub')
        check(page.evaluate('__hubState().age') == 'little', f'{name}: new player is a little kid')
        cm.click(page, '[data-who]'); cm.wait_screen(page, 'hub-players')     # (the age button is in Who's playing? since Nov 22)
        check(bar_icon(page, 'age') == little, f'{name}: the age button shows the little kid')
        cm.click(page, '[data-close]'); cm.wait_screen(page, 'hub')
        page.screenshot(path=str(OUT / f'age-{name}-hub.png'))
        # change back to Big in the editor
        cm.click(page, '[data-who]'); cm.wait_screen(page, 'hub-players'); cm.click(page, '[data-edit]'); cm.click(page, '[data-player=p2]')
        page.click('.pl-age[data-age=big]'); page.click('[data-ok]'); cm.wait_screen(page, 'hub-players')
        check(page.evaluate('__hubState().age') == 'big' and bar_icon(page, 'age') == page.evaluate('Arcade.icons.big'), f'{name}: switch back to Big')
        # the age button in Who's playing? toggles Little / Big for this player
        cm.click(page, '[data-age]')
        check(page.evaluate('__hubState().age') == 'little' and bar_icon(page, 'age') == little, f'{name}: hub age button turns on Little')
        w = min(cm.find(page, 'age')['w'], cm.find(page, 'age')['h'])
        check(w >= 50, f'{name}: age button is big ({w:.0f}px)')
        check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{name}: top row fits (no sideways scroll)')
        page.wait_for_timeout(2500)          # (let the toast go)
        page.screenshot(path=str(OUT / f'age-{name}-hub-little.png'))
        cm.click(page, '[data-age]')
        check(page.evaluate('__hubState().age') == 'big', f'{name}: hub age button back to Big')
        cm.click(page, '[data-close]'); cm.wait_screen(page, 'hub')
        # hub music: the arcade song is playing (after the first tap)
        check(page.evaluate('__hubState().song') is True, f'{name}: the arcade song plays on the hub')
        ctx.close()

    page = b.new_page(viewport={'width': 1280, 'height': 760})
    page.on('pageerror', lambda e: errors.append(str(e)))

    # ---------- RC: little kid presses nothing and still races ----------
    res = {}
    for age in ['little', 'big']:
        open_game(page, 'rc', age)
        cm.wait_screen(page, 'tap'); page.mouse.click(640, 380); page.wait_for_timeout(700)
        cm.click(page, '[data-menu=free]'); page.wait_for_timeout(500)
        cm.click(page, '[data-track="t1"]'); page.wait_for_timeout(300)      # (Backyard Loop)
        page.wait_for_function('typeof __rcStep === "function"')
        page.evaluate("__game.state = 'paused'")       # (we step the race by hand, faster than real time)
        p0 = page.evaluate('__rcState().player.progress')
        xy0 = page.evaluate('[__rcState().player.x, __rcState().player.y]')
        page.evaluate('__rcStep(40)')
        st = page.evaluate('__rcState()')
        st['moved'] = st['player']['progress'] - p0
        st['dist'] = ((st['player']['x'] - xy0[0]) ** 2 + (st['player']['y'] - xy0[1]) ** 2) ** 0.5     # how far from the start spot (px)
        rival_top = page.evaluate("Math.max(...__rcCars().filter(c => !c.isPlayer).map(c => c.stats.top))")
        res[age] = (st, rival_top, page.evaluate('[__game.difficulty, __game.speed, __game.little]'))
        page.screenshot(path=str(OUT / f'age-rc-{age}.png'))
    st, top, kit = res['little']
    check(kit == ['easy', 0.85, True], f'rc little: easy + slower game time ({kit})')
    check(st['player']['lap'] >= 2, f"rc little: no buttons pressed, still drove {st['moved'] / st['L']:.1f} laps in 40 s")
    # (a rival, a bubble or the wind may give the parked car a shove at the very moment we look, so we
    #  check how far from its start spot it is after 40 s instead of its speed right now: passing rivals bump it
    #  along a bit, but it must not drive off round the track)
    big = res['big'][0]
    check(big['dist'] < 0.3 * big['L'] and big['player']['lap'] <= 1, f"rc big: car stays put without the gas button ({big['dist']:.0f} px from its start spot after 40 s; a lap is {big['L']:.0f})")
    check(res['big'][2][0] == 'normal' and res['big'][2][1] == 1, f"rc big: normal speed ({res['big'][2]})")
    check(top < res['big'][1] * 0.97, f"rc little: rivals are slower ({round(top)} vs {round(res['big'][1])})")

    # ---------- Turbo Bike: the bike pedals by itself ----------
    for age in ['little', 'big']:
        open_game(page, 'bike', age)
        start_first_level(page)
        page.wait_for_timeout(6000)
        x = page.evaluate('__bikeState().bike.x')
        kit = page.evaluate('[__game.difficulty, __game.speed]')
        if age == 'little':
            check(kit == ['easy', 0.8], f'bike little: easy + slower ({kit})')
            check(x > 300, f'bike little: rides forward with no buttons (x={round(x)})')
            page.screenshot(path=str(OUT / 'age-bike-little.png'))
        else:
            check(kit[1] == 1, f'bike big: normal speed ({kit})')

    # ---------- Space, Jungle, Trail: easy + slower; space gets 2 extra lives ----------
    for folder, speed in [('space', 0.8), ('jungle', 0.85), ('trail', 0.85)]:
        got = {}
        for age in ['little', 'big']:
            open_game(page, folder, age)
            if folder == 'space':
                page.wait_for_function('window.__game && window.SpaceData')
                page.evaluate('__game.play(SpaceData.SECTORS[6])')     # a later sector (Normal for big kids)
                page.wait_for_timeout(500)
                got[age] = page.evaluate('[__game.difficulty, __game.speed, __spaceState ? __spaceState().lives : null]')
            else:
                start_first_level(page)
                got[age] = page.evaluate('[__game.difficulty, __game.speed]')
            if age == 'little':
                page.wait_for_timeout(800)
                page.screenshot(path=str(OUT / f'age-{folder}-little.png'))
        check(got['little'][:2] == ['easy', speed], f"{folder} little: easy + speed {speed} ({got['little']})")
        check(got['big'][1] == 1, f"{folder} big: normal speed ({got['big']})")
        if folder == 'space':
            check(got['big'][0] == 'normal', 'space big: sector 7 is Normal')
            check(got['little'][2] == got['big'][2] + 2 + 1, f"space little: easy lives + 2 extra ({got['little'][2]} vs {got['big'][2]})")

    # ---------- the little badge on a game's title menu ----------
    open_game(page, 'hoops', 'little')
    cm.to_title(page)                 # (Hoops' menus are drawn by Phaser + Rex UI: the badge is a chip on the canvas menu)
    check(page.evaluate("ArcadeMenus.current().rows.some(r => r.t === 'chips' && r.items.some(c => c.little))"), 'title menu shows the little badge')
    page.screenshot(path=str(OUT / 'age-hoops-menu.png'))
    b.close()

check(not errors, 'no JavaScript errors' + (': ' + '; '.join(errors[:3]) if errors else ''))
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
raise SystemExit(1 if fails else 0)
