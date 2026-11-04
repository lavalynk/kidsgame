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

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
errors, fails = [], []

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
    page.mouse.click(400, 300); page.wait_for_timeout(600)
    page.click('[data-start]'); page.wait_for_timeout(500)
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
        page.click('#who'); page.click('.pl-tile.add')
        check(page.is_visible('.pl-age[data-age=big].sel'), f'{name}: a new player starts on Big')
        sizes = page.evaluate("[...document.querySelectorAll('.pl-age')].map(b => Math.min(b.offsetWidth, b.offsetHeight))")
        check(len(sizes) == 2 and min(sizes) >= 70, f'{name}: age buttons are big ({sizes})')
        page.click('.pl-age[data-age=little]')
        page.fill('.pl-name', 'Mia')
        page.screenshot(path=str(OUT / f'age-{name}-editor.png'))
        page.click('[data-ok]')
        check(page.locator('.pl-tile[data-id=p2] .agebadge').count() == 1, f'{name}: picker shows the little badge')
        page.screenshot(path=str(OUT / f'age-{name}-picker.png'))
        page.click('[data-close]')
        check(page.evaluate('__hubState().age') == 'little', f'{name}: new player is a little kid')
        check(page.locator('#who .agebadge').count() == 1, f'{name}: who button shows the little badge')
        page.screenshot(path=str(OUT / f'age-{name}-hub.png'))
        # change back to Big in the editor
        page.click('#who'); page.click('[data-edit]'); page.click('.pl-tile[data-id=p2]')
        page.click('.pl-age[data-age=big]'); page.click('[data-ok]'); page.click('[data-close]')
        check(page.evaluate('__hubState().age') == 'big' and page.locator('#who .agebadge').count() == 0, f'{name}: switch back to Big')
        # the age button on the hub itself toggles Little / Big for this player
        page.click('#age')
        check(page.evaluate('__hubState().age') == 'little' and page.locator('#who .agebadge').count() == 1, f'{name}: hub age button turns on Little')
        w = page.evaluate("Math.min(document.getElementById('age').offsetWidth, document.getElementById('age').offsetHeight)")
        check(w >= 70, f'{name}: hub age button is big ({w}px)')
        check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{name}: top row fits (no sideways scroll)')
        page.wait_for_timeout(2500)          # (let the toast go)
        page.screenshot(path=str(OUT / f'age-{name}-hub-little.png'))
        page.click('#age')
        check(page.evaluate('__hubState().age') == 'big', f'{name}: hub age button back to Big')
        # hub music: the arcade song is playing (after the first tap)
        check(page.evaluate('__hubState().song') is True, f'{name}: the arcade song plays on the hub')
        ctx.close()

    page = b.new_page(viewport={'width': 1280, 'height': 760})
    page.on('pageerror', lambda e: errors.append(str(e)))

    # ---------- RC: little kid presses nothing and still races ----------
    res = {}
    for age in ['little', 'big']:
        open_game(page, 'rc', age)
        page.mouse.click(640, 380); page.wait_for_timeout(700)
        page.click('button:has-text("Free Play")'); page.wait_for_timeout(500)
        page.locator('button').filter(has_text='Backyard').first.click(); page.wait_for_timeout(300)
        page.wait_for_function('typeof __rcStep === "function"')
        page.evaluate("__game.state = 'paused'")       # (we step the race by hand, faster than real time)
        p0 = page.evaluate('__rcState().player.progress')
        page.evaluate('__rcStep(40)')
        st = page.evaluate('__rcState()')
        st['moved'] = st['player']['progress'] - p0
        rival_top = page.evaluate("Math.max(...__rcCars().filter(c => !c.isPlayer).map(c => c.stats.top))")
        res[age] = (st, rival_top, page.evaluate('[__game.difficulty, __game.speed, __game.little]'))
        page.screenshot(path=str(OUT / f'age-rc-{age}.png'))
    st, top, kit = res['little']
    check(kit == ['easy', 0.85, True], f'rc little: easy + slower game time ({kit})')
    check(st['player']['lap'] >= 2, f"rc little: no buttons pressed, still drove {st['moved'] / st['L']:.1f} laps in 40 s")
    check(res['big'][0]['player']['speed'] < 20 and res['big'][0]['player']['lap'] <= 1, f"rc big: car stays put without the gas button (speed {res['big'][0]['player']['speed']})")
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
    page.mouse.click(400, 300); page.wait_for_timeout(600)
    check(page.locator('.ar-player .ar-age').count() == 1, 'title menu shows the little badge')
    page.screenshot(path=str(OUT / 'age-hoops-menu.png'))
    b.close()

check(not errors, 'no JavaScript errors' + (': ' + '; '.join(errors[:3]) if errors else ''))
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
raise SystemExit(1 if fails else 0)
