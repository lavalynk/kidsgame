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
- (Nov 19) Things: put gift boxes, boost pads, bumpers, oil, a critter... on the road, tap one to take it away,
  the bin clears them, Undo brings them back; the race uses exactly those things
- (Nov 19) Look: laps 1-5, weather and road width; the race uses them; an old track (no things) still gets things by itself
Screenshots land in tests/out/.
"""
import json, pathlib
from playwright.sync_api import sync_playwright
import cmenu as cm
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
    r = pg.evaluate('__rcBuild.rect()')        # (the board on the canvas menu, Nov 21)
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
    cm.wait_screen(pg, 'rc-main')
    check(cm.count(pg, '[data-menu=build]') == 1 and cm.count(pg, '[data-menu]') == 10, 'main menu: 10 tiles incl. Build + Heart Battle')
    pg.screenshot(path=str(OUT / 'rc_build_menu.png'))
    cm.click(pg, '[data-menu=build]'); pg.wait_for_timeout(250)
    check(cm.count(pg, '[data-slot]') == 3, 'My tracks: 3 slots')
    cm.click(pg, '[data-slot="0"]'); pg.wait_for_timeout(250)
    st = S(pg)
    check(st['ok'] and len(st['pts']) >= 8 and st['L'] >= 6800, f'empty slot starts with a good track ({len(st["pts"])} dots, lap {st["L"]})')
    pg.screenshot(path=str(OUT / 'rc_build_start.png'))

    # ---- the dice ----
    good, bridges = 0, 0
    for i in range(25):
        cm.click(pg, '[data-dice]'); st = S(pg)
        good += st['ok']; bridges += st['bridge']
    check(good == 25, f'dice: 25 / 25 good tracks ({good})')
    check(bridges >= 1, f'dice: some figure 8s with a bridge ({bridges})')
    # a figure 8 straight from the check
    f8 = pg.evaluate("""(() => { const n = 14, out = []; for (let k = 0; k < n; k++) { const t = k / n * Math.PI * 2 + 1.6; out.push([3000 + 2300 * Math.sin(t), 1910 + 1150 * Math.sin(2 * t)]); } return out; })()""")

    # ---- drawing with a finger ----
    cm.click(pg, '[data-draw]'); check(S(pg)['draw'], 'Draw button turns drawing on')
    import math
    loop = [(3000 + 2000 * math.cos(a / 30 * 6.283), 1900 + 1200 * math.sin(a / 30 * 6.283)) for a in range(29)]
    drag(pg, loop)
    st = S(pg)
    check(not st['draw'] and st['ok'] and 8 <= len(st['pts']) <= 18, f'a drawn loop becomes {len(st["pts"])} dots, good to race')
    pg.screenshot(path=str(OUT / 'rc_build_drawn.png'))
    drawn_n = len(st['pts'])
    cm.click(pg, '[data-draw]')
    tiny = [(3000 + 300 * math.cos(a / 20 * 6.283), 1900 + 250 * math.sin(a / 20 * 6.283)) for a in range(19)]
    drag(pg, tiny)
    st = S(pg)
    check(st['ok'] and st['L'] >= 6800 and len(st['pts']) != drawn_n, f'a tiny drawing gets blown up to race size (lap {st["L"]})')
    cm.click(pg, '[data-draw]'); before = S(pg)['pts']
    drag(pg, [(3000, 1900), (3100, 1950)])
    check(S(pg)['pts'] == before, 'a little dash is not a track (nothing changes)')
    cm.click(pg, '[data-draw]')   # (off again)

    # ---- dragging a dot into trouble, then Undo ----
    cm.click(pg, '[data-undo]')     # back to the big drawn loop (before the tiny one)
    st = S(pg); pts = st['pts']
    check(len(pts) == drawn_n, 'undo goes back to the drawn loop')
    # pull one dot right across the middle, next to the far side of the loop
    k = min(range(len(pts)), key=lambda i: pts[i][1])            # the top dot
    far_y = max(p[1] for p in pts) - 150
    drag(pg, [pts[k], (pts[k][0], 1900), (pts[k][0], far_y)])
    st = S(pg)
    check(not st['ok'] and st['bad'] >= 1, f'road too close to itself -> red rings ({st["bad"]})')
    pg.wait_for_timeout(200); pg.screenshot(path=str(OUT / 'rc_build_problem.png'))
    cm.click(pg, '[data-race]'); pg.wait_for_timeout(300)
    check(cm.screen(pg) == 'rc-build', 'Race says no while there is a problem (still building)')
    cm.click(pg, '[data-undo]')
    check(S(pg)['ok'], 'Undo fixes it')

    # ---- tap the road = a new dot; worlds ----
    n0 = len(S(pg)['pts'])
    # tap the road halfway between the two dots that are furthest apart
    dense_pt = pg.evaluate("(() => { const p = __rcBuild.state().pts; let k = 0, d = 0; p.forEach((a, i) => { const b = p[(i + 1) % p.length], e = Math.hypot(b[0] - a[0], b[1] - a[1]); if (e > d) { d = e; k = i; } }); return __rcBuild.mid(k); })()")
    x, y = board_xy(pg, *dense_pt); pg.mouse.click(x, y); pg.wait_for_timeout(150)
    check(len(S(pg)['pts']) == n0 + 1, 'tapping the road adds a dot')
    cm.click(pg, '[data-world=candy]')
    check(S(pg)['theme'] == 'candy', 'picking a world')
    saved = pg.evaluate("Object.keys(localStorage).filter(k => (localStorage.getItem(k) || '').includes('myTracks'))")
    check(len(saved) == 1, f'saved in the player\'s RC save ({saved})')
    pg.screenshot(path=str(OUT / 'rc_build_candy.png'))

    # ---- race it ----
    cm.click(pg, '[data-race]')
    pg.wait_for_function("typeof __rcState === 'function' && __rcState().track.startsWith('my0') && __rcState().raceTime === 0")
    st = pg.evaluate('__rcState()')
    check(st['mode'] == 'free' and len(st['racers']) == 4 and st['laps'] == 3 and st['boxes'] > 0, 'Race: 4 cars, 3 laps, gift boxes')
    pg.evaluate('__rcStep(6)'); pg.wait_for_timeout(100)
    pg.screenshot(path=str(OUT / 'rc_build_race.png'))
    st = pg.evaluate(RUN)
    check(st['finished'], f'the computer driver finishes 3 laps on a home-made track (place {st["player"]["position"]})')
    pg.wait_for_timeout(900)
    pg.screenshot(path=str(OUT / 'rc_build_results.png'))
    cm.wait_screen(pg, 'results')
    btn = cm.find(pg, 'build')
    check(btn is not None, 'results have a Build button')
    if btn:
        cm.tap(pg, 'build'); pg.wait_for_timeout(300)
        check(cm.screen(pg) == 'rc-build' and pg.evaluate('ArcadeMenus.current().slot') == 0, 'Build goes back to the builder')
    feats = pg.evaluate("JSON.stringify(Object.entries(localStorage).filter(([k]) => k.includes('rc')).map(([k, v]) => JSON.parse(v)))")
    check('"won"' not in feats, 'home-made wins do not count toward the special paints')

    # ---- a figure 8 with a bridge (slot 2) + Drive ----
    pg.evaluate(f"""(() => {{ const k = Object.keys(localStorage).find(k => (localStorage.getItem(k) || '').includes('myTracks')); const s = JSON.parse(localStorage.getItem(k));
        s.games.rc.data.myTracks[1] = {{ pts: {json.dumps(f8)}.map(p => p.map(Math.round)), theme: 'moon' }}; localStorage.setItem(k, JSON.stringify(s)); }})()""")
    open_rc(pg, clear=False)
    cm.click(pg, '[data-menu=build]'); pg.wait_for_timeout(200)
    cm.click(pg, '[data-slot="1"]'); pg.wait_for_timeout(250)
    st = S(pg)
    check(st['ok'] and st['bridge'], 'a figure 8 is fine: it gets a bridge')
    pg.screenshot(path=str(OUT / 'rc_build_bridge.png'))
    cm.click(pg, '[data-race]')
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
    cm.click(pg, '[data-menu=build]'); pg.wait_for_timeout(200)
    check(pg.evaluate("ArcadeMenus.current().rows[0].items.filter(i => i.empty).length") == 3, 'player 2 starts with 3 empty slots')

    # ---- Things + Look (Nov 19) ----
    cm.click(pg, '[data-menu=build]') if cm.count(pg, '[data-menu=build]') else None
    pg.evaluate('__game.menu()'); pg.wait_for_timeout(300)
    cm.click(pg, '[data-menu=build]'); pg.wait_for_timeout(200)
    cm.click(pg, '[data-slot="2"]'); pg.wait_for_timeout(250)
    check(S(pg)['things'] is None, 'a new track has no things list yet (the race places them by itself)')
    cm.click(pg, '[data-things]'); pg.wait_for_timeout(150)
    check(S(pg)['mode'] == 'things' and cm.count(pg, '[data-piece]') == 7 and cm.count(pg, '[data-clear]') == 1, 'Things: 7 things to pick + a bin')
    def tap_road(f, off=0):
        q = pg.evaluate(f'__rcBuild.roadAt({f})'); x, y = board_xy(pg, q[0], q[1] + off); pg.mouse.click(x, y); pg.wait_for_timeout(80)
    cm.click(pg, '[data-piece=bumper]'); tap_road(0.25, 40)
    cm.click(pg, '[data-piece=critter]'); tap_road(0.45)
    cm.click(pg, '[data-piece=oil]'); tap_road(0.65, -40)
    st = S(pg); ks = [q['k'] for q in st['things']]
    check(ks.count('gift') >= 2 and ks[-3:] == ['bumper', 'critter', 'oil'], f'tapping the road puts things there (starting from the usual ones): {ks}')
    n = len(st['things'])
    xy = pg.evaluate(f'__rcBuild.thingXY({n - 1})'); x, y = board_xy(pg, xy[0], xy[1]); pg.mouse.click(x, y); pg.wait_for_timeout(100)
    check(len(S(pg)['things']) == n - 1, 'tapping a thing takes it away')
    cm.click(pg, '[data-undo]'); pg.wait_for_timeout(100)
    check(len(S(pg)['things']) == n, 'Undo brings it back')
    pg.screenshot(path=str(OUT / 'rc_build_things.png'))
    cm.click(pg, '[data-clear]'); pg.wait_for_timeout(100)
    check(S(pg)['things'] == [], 'the bin clears the road')
    cm.click(pg, '[data-piece=gift]'); tap_road(0.3)
    cm.click(pg, '[data-piece=bumper]'); tap_road(0.5, 40); tap_road(0.75, -40)
    cm.click(pg, '[data-piece=boost]'); tap_road(0.15)
    cm.click(pg, '[data-look]'); pg.wait_for_timeout(100)
    cm.click(pg, '[data-laps]'); cm.click(pg, '[data-laps]'); cm.click(pg, '[data-laps]')        # 3 -> 4 -> 5 -> 1
    cm.click(pg, '[data-sky=snow]'); cm.click(pg, '[data-width="76"]'); pg.wait_for_timeout(100)
    st = S(pg)
    check(st['laps'] == 1 and st['weather'] == 'snow' and st['hw'] == 76 and st['ok'], f"Look: laps {st['laps']}, weather {st['weather']}, road {st['hw']}")
    cm.click(pg, '[data-laps]'); pg.wait_for_timeout(50)       # 2 laps
    pg.screenshot(path=str(OUT / 'rc_build_look.png'))
    cm.click(pg, '[data-race]')
    pg.wait_for_function("typeof __rcStep === 'function' && __rcState().track.startsWith('my2') && __rcState().raceTime === 0")
    rs = pg.evaluate('__rcState()')
    check(rs['laps'] == 2 and rs['weather'] == 'snow' and rs['boxes'] == 3 and [p['kind'] for p in rs['pads']] == ['boost']
          and pg.evaluate('__rcExtras.bumpers().length') == 2 and rs['movers'] == [] and len(pg.evaluate('__rcHaz()')) == 0,
          f"the race uses exactly your things + looks (laps {rs['laps']}, {rs['weather']}, boxes {rs['boxes']}, pads {[p['kind'] for p in rs['pads']]})")
    hw = rs['hw']
    check(hw == 76, f'thin road in the race ({hw})')
    st = pg.evaluate(RUN)
    check(st['finished'] and st['player']['lap'] >= 2, f"2-lap race on your track finishes ({round(st['raceTime'])} s)")
    pg.evaluate('__game.menu()'); pg.wait_for_timeout(300)
    # an older track with no things list: the race still places things by itself
    pg.evaluate("(() => { delete __game.save.data.myTracks[2].things; __game.store(); })()")
    pg.evaluate("__game.play({ id: 'my-2' })")
    pg.wait_for_function("typeof __rcStep === 'function' && __rcState().track.startsWith('my2') && __rcState().raceTime === 0")
    nb = pg.evaluate('__rcState().boxes')
    check(nb >= 6, f'an old track (no things) still gets gift boxes by itself ({nb})')

    # ---- phone ----
    ph = b.new_page(viewport={'width': 844, 'height': 390}, is_mobile=True, has_touch=True)
    ph.on('pageerror', lambda e: errors.append(str(e)))
    open_rc(ph)
    ph.screenshot(path=str(OUT / 'rc_build_phone_menu.png'))
    cm.click(ph, '[data-menu=build]'); ph.wait_for_timeout(200)
    cm.click(ph, '[data-slot="0"]'); ph.wait_for_timeout(250)
    cm.wait_screen(ph, 'rc-build')
    its = ph.evaluate('ArcadeMenus.list()')
    box = [min(i['x'] for i in its), min(i['y'] for i in its), max(i['x'] + i['w'] for i in its), max(i['y'] + i['h'] for i in its)]
    check(box[0] >= 0 and box[1] >= 0 and box[2] <= 844 and box[3] <= 390 and all(i['shown'] for i in its), f'phone: the builder fits on screen {[round(v) for v in box]}')
    pts = S(ph)['pts']
    drag(ph, [pts[3], (pts[3][0] - 300, pts[3][1] + 200)])
    moved = S(ph)['pts'][3]
    check(abs(moved[0] - (pts[3][0] - 300)) < 60 and abs(moved[1] - (pts[3][1] + 200)) < 60, f'phone: dragging moves the right dot {pts[3]} -> {moved}')
    ph.screenshot(path=str(OUT / 'rc_build_phone.png'))

    b.close()

check(not errors, 'no JavaScript errors' + (': ' + '; '.join(errors[:3]) if errors else ''))
print('\n' + ('ALL PASS' if not fails else f'{len(fails)} FAILED'))
raise SystemExit(1 if fails else 0)
