"""Automated test: Mini RC Racers' Track Builder (Nov 16).

Run:  python3 tests/test_rc_build.py   (about 1 minute)
Checks:
- the main menu has a Build tile; My tracks has 3 slots (empty = a green +)
- an empty slot starts with a ready-to-race track; the dice always makes a good track (some with a bridge)
- drawing a loop with a finger turns it into dots + a smooth road (a tiny drawing gets blown up to race size)
- dragging a dot onto another part of the road = red rings, Race says no; Undo fixes it
- tapping the road adds a dot; picking a world changes the look; everything is saved per player
- Race on your track: 4 cars, 3 laps, the computer driver finishes; results have a Build button back to the builder
- a figure 8 with a bridge races fine; Drive mode has 12 stars
- phone size: the builder fits and a finger drag on the (shrunk) board moves the right dot
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

TWO = json.dumps({'active': 'p1', 'list': [
    {'id': 'p1', 'name': 'Sam', 'pet': 'cat', 'color': '#ef476f', 'age': 'big'},
    {'id': 'p2', 'name': 'Ava', 'pet': 'dog', 'color': '#118ab2', 'age': 'big'}]})

def open_rc(pg, clear=True):
    pg.goto((ROOT / 'rc' / 'index.html').as_uri())
    if clear: pg.evaluate("p => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); }", TWO)
    pg.reload(); pg.wait_for_timeout(400)
    vw = pg.viewport_size
    pg.mouse.click(vw['width'] // 2, vw['height'] // 2); pg.wait_for_timeout(700)

def board_xy(pg, x, y):
    """track units -> page pixels on the builder board"""
    r = pg.evaluate("(() => { const r = document.querySelector('[data-board]').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })()")
    bw = pg.evaluate('__rcBuild.board()')
    return r[0] + x / bw['w'] * r[2], r[1] + y / bw['h'] * r[3]

def drag(pg, path, steps=4):
    x, y = board_xy(pg, *path[0]); pg.mouse.move(x, y); pg.mouse.down()
    for p in path[1:]:
        x, y = board_xy(pg, *p); pg.mouse.move(x, y, steps=steps)
    pg.mouse.up(); pg.wait_for_timeout(150)

S = lambda pg: pg.evaluate('__rcBuild.state()')
RUN = "(() => { __rcAuto(true); for (let k = 0; k < 500 && !__rcState().finished; k++) __rcStep(0.5); __rcStep(3); return __rcState(); })()"

with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1280, 'height': 760})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    open_rc(pg)

    # ---- menus ----
    check(pg.locator('[data-menu=build]').count() == 1 and pg.locator('.rc-modes4 > .ar-tile').count() == 7, 'main menu: 7 tiles incl. Build')
    pg.screenshot(path=str(OUT / 'rc_build_menu.png'))
    pg.click('[data-menu=build]'); pg.wait_for_timeout(250)
    check(pg.locator('[data-slot]').count() == 3, 'My tracks: 3 slots')
    pg.click('[data-slot="0"]'); pg.wait_for_timeout(250)
    st = S(pg)
    check(st['ok'] and len(st['pts']) >= 8 and st['L'] >= 6800, f'empty slot starts with a good track ({len(st["pts"])} dots, lap {st["L"]})')
    pg.screenshot(path=str(OUT / 'rc_build_start.png'))

    # ---- the dice ----
    good, bridges = 0, 0
    for i in range(25):
        pg.click('[data-dice]'); st = S(pg)
        good += st['ok']; bridges += st['bridge']
    check(good == 25, f'dice: 25 / 25 good tracks ({good})')
    check(bridges >= 1, f'dice: some figure 8s with a bridge ({bridges})')
    # a figure 8 straight from the check
    f8 = pg.evaluate("""(() => { const n = 14, out = []; for (let k = 0; k < n; k++) { const t = k / n * Math.PI * 2 + 1.6; out.push([3000 + 2300 * Math.sin(t), 1910 + 1150 * Math.sin(2 * t)]); } return out; })()""")

    # ---- drawing with a finger ----
    pg.click('[data-draw]'); check(S(pg)['draw'], 'Draw button turns drawing on')
    import math
    loop = [(3000 + 2000 * math.cos(a / 30 * 6.283), 1900 + 1200 * math.sin(a / 30 * 6.283)) for a in range(29)]
    drag(pg, loop)
    st = S(pg)
    check(not st['draw'] and st['ok'] and 8 <= len(st['pts']) <= 18, f'a drawn loop becomes {len(st["pts"])} dots, good to race')
    pg.screenshot(path=str(OUT / 'rc_build_drawn.png'))
    drawn_n = len(st['pts'])
    pg.click('[data-draw]')
    tiny = [(3000 + 300 * math.cos(a / 20 * 6.283), 1900 + 250 * math.sin(a / 20 * 6.283)) for a in range(19)]
    drag(pg, tiny)
    st = S(pg)
    check(st['ok'] and st['L'] >= 6800 and len(st['pts']) != drawn_n, f'a tiny drawing gets blown up to race size (lap {st["L"]})')
    pg.click('[data-draw]'); before = S(pg)['pts']
    drag(pg, [(3000, 1900), (3100, 1950)])
    check(S(pg)['pts'] == before, 'a little dash is not a track (nothing changes)')
    pg.click('[data-draw]')   # (off again)

    # ---- dragging a dot into trouble, then Undo ----
    pg.click('[data-undo]')     # back to the big drawn loop (before the tiny one)
    st = S(pg); pts = st['pts']
    check(len(pts) == drawn_n, 'undo goes back to the drawn loop')
    # pull one dot right across the middle, next to the far side of the loop
    k = min(range(len(pts)), key=lambda i: pts[i][1])            # the top dot
    far_y = max(p[1] for p in pts) - 150
    drag(pg, [pts[k], (pts[k][0], 1900), (pts[k][0], far_y)])
    st = S(pg)
    check(not st['ok'] and st['bad'] >= 1, f'road too close to itself -> red rings ({st["bad"]})')
    pg.wait_for_timeout(200); pg.screenshot(path=str(OUT / 'rc_build_problem.png'))
    pg.click('[data-race]'); pg.wait_for_timeout(300)
    check(pg.locator('[data-builder]').count() == 1, 'Race says no while there is a problem (still building)')
    pg.click('[data-undo]')
    check(S(pg)['ok'], 'Undo fixes it')

    # ---- tap the road = a new dot; worlds ----
    n0 = len(S(pg)['pts'])
    # tap the road halfway between the two dots that are furthest apart
    dense_pt = pg.evaluate("(() => { const p = __rcBuild.state().pts; let k = 0, d = 0; p.forEach((a, i) => { const b = p[(i + 1) % p.length], e = Math.hypot(b[0] - a[0], b[1] - a[1]); if (e > d) { d = e; k = i; } }); return __rcBuild.mid(k); })()")
    x, y = board_xy(pg, *dense_pt); pg.mouse.click(x, y); pg.wait_for_timeout(150)
    check(len(S(pg)['pts']) == n0 + 1, 'tapping the road adds a dot')
    pg.click('[data-world=candy]')
    check(S(pg)['theme'] == 'candy', 'picking a world')
    saved = pg.evaluate("Object.keys(localStorage).filter(k => (localStorage.getItem(k) || '').includes('myTracks'))")
    check(len(saved) == 1, f'saved in the player\'s RC save ({saved})')
    pg.screenshot(path=str(OUT / 'rc_build_candy.png'))

    # ---- race it ----
    pg.click('[data-race]')
    pg.wait_for_function("typeof __rcState === 'function' && __rcState().track.startsWith('my0') && __rcState().raceTime === 0")
    st = pg.evaluate('__rcState()')
    check(st['mode'] == 'free' and len(st['racers']) == 4 and st['laps'] == 3 and st['boxes'] > 0, 'Race: 4 cars, 3 laps, gift boxes')
    pg.evaluate('__rcStep(6)'); pg.wait_for_timeout(100)
    pg.screenshot(path=str(OUT / 'rc_build_race.png'))
    st = pg.evaluate(RUN)
    check(st['finished'], f'the computer driver finishes 3 laps on a home-made track (place {st["player"]["position"]})')
    pg.wait_for_timeout(900)
    pg.screenshot(path=str(OUT / 'rc_build_results.png'))
    btn = pg.locator('.ar-btn', has_text='Build')
    check(btn.count() >= 1, 'results have a Build button')
    if btn.count():
        btn.first.click(); pg.wait_for_timeout(300)
        check(pg.locator('[data-builder="0"]').count() == 1, 'Build goes back to the builder')
    feats = pg.evaluate("JSON.stringify(Object.entries(localStorage).filter(([k]) => k.includes('rc')).map(([k, v]) => JSON.parse(v)))")
    check('"won"' not in feats, 'home-made wins do not count toward the special paints')

    # ---- a figure 8 with a bridge (slot 2) + Drive ----
    pg.evaluate(f"""(() => {{ const k = Object.keys(localStorage).find(k => (localStorage.getItem(k) || '').includes('myTracks')); const s = JSON.parse(localStorage.getItem(k));
        s.games.rc.data.myTracks[1] = {{ pts: {json.dumps(f8)}.map(p => p.map(Math.round)), theme: 'moon' }}; localStorage.setItem(k, JSON.stringify(s)); }})()""")
    open_rc(pg, clear=False)
    pg.click('[data-menu=build]'); pg.wait_for_timeout(200)
    pg.click('[data-slot="1"]'); pg.wait_for_timeout(250)
    st = S(pg)
    check(st['ok'] and st['bridge'], 'a figure 8 is fine: it gets a bridge')
    pg.screenshot(path=str(OUT / 'rc_build_bridge.png'))
    pg.click('[data-race]')
    pg.wait_for_function("typeof __rcState === 'function' && __rcState().track.startsWith('my1') && __rcState().raceTime === 0")
    pg.evaluate('__rcStep(9)'); pg.wait_for_timeout(100)
    pg.screenshot(path=str(OUT / 'rc_build_bridge_race.png'))
    st = pg.evaluate(RUN)
    check(st['finished'] and all(r['lap'] >= 3 or r['finished'] for r in st['racers'] if r['name'] == 'You'), 'figure 8 race: the computer driver finishes over the bridge')
    pg.evaluate("__game.play({ id: 'myd-1' })")
    pg.wait_for_function("typeof __rcState === 'function' && __rcState().mode === 'drive' && __rcState().track.startsWith('my1')")
    check(pg.evaluate('__rcState().stars') == 12, 'Drive on your track: 12 stars')

    # ---- every player has their own tracks ----
    pg.evaluate("(() => { const p = JSON.parse(localStorage.getItem('kidsArcade.profiles')); p.active = 'p2'; localStorage.setItem('kidsArcade.profiles', JSON.stringify(p)); })()")
    open_rc(pg, clear=False)
    pg.click('[data-menu=build]'); pg.wait_for_timeout(200)
    check(pg.locator('.rc-mypic svg rect[stroke-dasharray]').count() == 3, 'player 2 starts with 3 empty slots')

    # ---- phone ----
    ph = b.new_page(viewport={'width': 844, 'height': 390}, is_mobile=True, has_touch=True)
    ph.on('pageerror', lambda e: errors.append(str(e)))
    open_rc(ph)
    ph.screenshot(path=str(OUT / 'rc_build_phone_menu.png'))
    ph.click('[data-menu=build]'); ph.wait_for_timeout(200)
    ph.click('[data-slot="0"]'); ph.wait_for_timeout(250)
    box = ph.evaluate("(() => { const r = document.querySelector('.rc-screen').getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; })()")
    check(box[0] >= 0 and box[1] >= 0 and box[2] <= 844 and box[3] <= 390, f'phone: the builder fits on screen {[round(v) for v in box]}')
    pts = S(ph)['pts']
    drag(ph, [pts[3], (pts[3][0] - 300, pts[3][1] + 200)])
    moved = S(ph)['pts'][3]
    check(abs(moved[0] - (pts[3][0] - 300)) < 60 and abs(moved[1] - (pts[3][1] + 200)) < 60, f'phone: dragging moves the right dot {pts[3]} -> {moved}')
    ph.screenshot(path=str(OUT / 'rc_build_phone.png'))

    b.close()

check(not errors, 'no JavaScript errors' + (': ' + '; '.join(errors[:3]) if errors else ''))
print('\n' + ('ALL PASS' if not fails else f'{len(fails)} FAILED'))
raise SystemExit(1 if fails else 0)
