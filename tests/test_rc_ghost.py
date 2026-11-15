"""Automated test: Mini RC Racers' Daily Ghost Race and Trophy Shelf (Nov 15).

Run:  python3 tests/test_rc_ghost.py   (about 1 minute)
Checks:
- the main menu has the Ghost Race and Trophies tiles
- today's track comes from the date (another day = another track; little kids get one of the first 6)
- a ghost race: just you and Boo, 2 laps, no gift boxes; Boo drives on his own and you're 2nd if you sit still
- the computer driver beats Boo on every track; a little kid who presses nothing beats him on all 6 little tracks
- beating Boo: +1 on the shelf's ghost trophy and +1 house coin, but only once a day
- the shelf: 14 trophies (4 big + 1 per track), medals from the saves, tap an empty one -> Go starts that race
Screenshots land in tests/out/.
"""
import json, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

def profile(age):
    return json.dumps({'active': 'p1', 'list': [{'id': 'p1', 'name': 'Sam', 'pet': 'cat', 'color': '#ef476f', 'age': age}]})

def open_rc(pg, age='big', day='2026-11-15'):
    pg.goto((ROOT / 'rc' / 'index.html').as_uri())
    pg.evaluate("([p, d]) => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); localStorage.setItem('kidsArcade.testDay', d); }", [profile(age), day])
    pg.reload(); pg.wait_for_timeout(400)
    vw = pg.viewport_size
    pg.mouse.click(vw['width'] // 2, vw['height'] // 2); pg.wait_for_timeout(700)

def play(pg, track):
    pg.evaluate(f"__game.play({{ id: 'dg-{track}' }})")
    pg.wait_for_function(f"typeof __rcStep === 'function' && __rcState().mode === 'daily' && __rcState().track === '{track}' && __rcState().raceTime === 0")

def to_menu(pg):
    pg.wait_for_timeout(700)       # (the results screen comes 0.3 s after the finish)
    pg.evaluate('__game.menu()'); pg.wait_for_timeout(300)

RUN = "(() => { for (let k = 0; k < 400 && !__rcState().finished; k++) __rcStep(0.5); __rcStep(3); return __rcState(); })()"

with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1280, 'height': 760})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    open_rc(pg)

    # ---- main menu ----
    check(pg.locator('[data-menu=ghost]').count() == 1 and pg.locator('[data-menu=shelf]').count() == 1, 'menu: Ghost Race + Trophies tiles')
    meta = pg.locator('[data-menu=ghost] .meta').inner_text()
    check(meta.startswith('today:'), f'ghost tile shows today\'s track ({meta})')

    # ---- today's track ----
    tracks = []
    for day in ['2026-11-15', '2026-11-16', '2026-11-17']:
        pg.evaluate(f"localStorage.setItem('kidsArcade.testDay', '{day}')")
        pg.click('[data-menu=ghost]')
        pg.wait_for_function("typeof __rcStep === 'function' && __rcState().mode === 'daily'")
        tracks.append(pg.evaluate('__rcState().track'))
        pg.evaluate('__game.menu()'); pg.wait_for_timeout(300)
    check(len(set(tracks)) == 3, f'a new track every day ({tracks})')
    pg.evaluate("localStorage.setItem('kidsArcade.testDay', '2026-11-15')")

    # ---- a ghost race ----
    play(pg, tracks[0])
    st = pg.evaluate('__rcState()')
    check(st['laps'] == 2 and len(st['racers']) == 1 and st['boxes'] == 0, f"just you + Boo, 2 laps, no gifts (laps {st['laps']}, cars {len(st['racers'])}, boxes {st['boxes']})")
    check(st['boo'] and st['boo']['t'] > 20, f"Boo has a finish time ({st['boo']})")
    pg.screenshot(path=str(OUT / 'rc-ghost-start.png'))
    p0 = st['boo']['p']
    pg.evaluate('__rcStep(10)')
    st = pg.evaluate('__rcState()')
    check(st['boo']['p'] > p0 + 1500, f"Boo drives on his own ({p0} -> {st['boo']['p']})")
    check(st['boo']['place'] == 2, 'sitting still: you are 2nd')
    pg.screenshot(path=str(OUT / 'rc-ghost-race.png'))
    pg.evaluate('__rcStep(10); __rcAuto(true)')        # a really late start (20 s), then drive
    st = pg.evaluate(RUN)
    check(st['finished'] and st['player']['finishTime'] > st['boo']['t'], 'a late start: Boo wins')
    pg.wait_for_timeout(1200)
    check('Nice try' in pg.inner_text('body'), 'losing says "Nice try!"')
    check(pg.evaluate('__game.save.data.booWins || 0') == 0, 'a loss gives no ghost trophy')

    # ---- winning (the computer driver drives for you) ----
    house0 = pg.evaluate('Arcade.store.load().houseBonus || 0')
    play(pg, tracks[0]); pg.evaluate('__rcAuto(true)')
    st = pg.evaluate(RUN); pg.wait_for_timeout(1200)
    check(st['player']['finishTime'] < st['boo']['t'], f"autopilot beats Boo ({st['player']['finishTime']} < {st['boo']['t']})")
    check('beat Boo' in pg.inner_text('body'), 'results: "You beat Boo!"')
    pg.screenshot(path=str(OUT / 'rc-ghost-win.png'))
    d = pg.evaluate('JSON.stringify([__game.save.data.booWins, __game.save.data.booDay, Arcade.store.load().houseBonus || 0])')
    check(json.loads(d) == [1, '2026-11-15', house0 + 1], f'first win today: ghost trophy 1 + a house coin ({d})')
    play(pg, tracks[0]); pg.evaluate('__rcAuto(true)'); pg.evaluate(RUN); pg.wait_for_timeout(800)
    d = pg.evaluate('JSON.stringify([__game.save.data.booWins, Arcade.store.load().houseBonus || 0])')
    check(json.loads(d) == [1, house0 + 1], f'a second win the same day counts once ({d})')
    to_menu(pg)
    check('beaten today' in pg.locator('[data-menu=ghost]').inner_text(), 'ghost tile: beaten today')

    # ---- the computer driver beats Boo on every track (big kid's Boo) ----
    slow = []
    for i in range(1, 11):
        play(pg, f't{i}'); pg.evaluate('__rcAuto(true)')
        st = pg.evaluate(RUN)
        r = st['boo']['t'] / st['player']['finishTime']
        if r < 1.03: slow.append((i, round(r, 2)))
        to_menu(pg)
    check(not slow, f'autopilot beats Boo on all 10 tracks (too close: {slow})')

    # ---- the shelf ----
    pg.evaluate("""(() => { const g = __game, d = g.save.data; d.cupBest = 2; d.miniBest = 1; d.driveBest = { t1: 50 }; d.ghosts = { t4: { t: 20, f: [] } };
      d.place = { t2: 2, t3: 3 }; d.feats = Object.assign({}, d.feats, { won: { t1: true } }); g.store(); })()""")
    to_menu(pg)
    pg.click('[data-menu=shelf]'); pg.wait_for_timeout(300)
    medals = pg.evaluate("Object.fromEntries([...document.querySelectorAll('[data-tro]')].map(e => [e.dataset.tro, e.dataset.medal]))")
    check(len(medals) == 14, f'shelf: 14 trophies ({len(medals)})')
    want = {'mini': 'gold', 'cup': 'silver', 'boo': 'bronze', 'stars': 'bronze', 't1': 'gold', 't2': 'silver', 't3': 'bronze', 't4': '', 't10': ''}
    check(all(medals.get(k) == v for k, v in want.items()), f'shelf medals match the saves ({medals})')
    check(pg.locator('[data-count]').get_attribute('data-count') == '7', 'shelf count: 7 won')
    check(pg.locator('[data-tro=t4] .bd.on').count() == 1, 'Time Trial badge under Autumn Woods')
    pg.click('[data-tro=boo]'); pg.wait_for_timeout(300)
    pg.screenshot(path=str(OUT / 'rc-shelf.png'))
    pg.click('[data-tro=t9]'); pg.wait_for_timeout(200)
    pg.click('[data-go=t9]')
    pg.wait_for_function("typeof __rcStep === 'function' && __rcState().track === 't9'")
    check(pg.evaluate('__rcState().mode') == 'free', 'empty trophy -> Go starts a race on that track')

    # ---- little kids: a sleepy Boo, gentler tracks, and doing nothing still wins ----
    open_rc(pg, 'little')
    little_tracks = set()
    for k in range(10):
        pg.evaluate(f"localStorage.setItem('kidsArcade.testDay', '2026-12-{k + 1:02d}')")
        pg.click('[data-menu=ghost]')
        pg.wait_for_function("typeof __rcStep === 'function' && __rcState().mode === 'daily'")
        little_tracks.add(pg.evaluate('__rcState().track')); pg.evaluate('__game.menu()'); pg.wait_for_timeout(250)
    check(little_tracks == {f't{i}' for i in range(1, 7)}, f'little kids: all of the first 6 tracks, no others ({sorted(little_tracks)})')
    lost = []
    for i in range(1, 7):
        play(pg, f't{i}')
        st = pg.evaluate(RUN)
        if not (st['finished'] and st['player']['finishTime'] < st['boo']['t']): lost.append(i)
        to_menu(pg)
    check(not lost, f'little kid pressing nothing beats Boo on all 6 tracks (lost: {lost})')

    # ---- phone ----
    ph = b.new_page(viewport={'width': 844, 'height': 390}, is_mobile=True, has_touch=True)
    ph.on('pageerror', lambda e: errors.append(str(e)))
    open_rc(ph)
    ph.click('[data-menu=shelf]'); ph.wait_for_timeout(300)
    ph.screenshot(path=str(OUT / 'rc-shelf-phone.png'))
    box = ph.locator('.rc-shelf').bounding_box()
    check(box and box['x'] >= 0 and box['x'] + box['width'] <= 844 and box['y'] + box['height'] <= 390, 'phone: the shelf fits the screen')

    check(not errors, 'no JavaScript errors ' + str(errors[:3]))
    b.close()

print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED: ' + '; '.join(fails)))
raise SystemExit(1 if fails else 0)
