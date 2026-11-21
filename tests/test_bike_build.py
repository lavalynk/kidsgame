"""Automated test: Turbo Bike's better track builder (Keith's bike plan #8, Nov 21).

Run:  python3 tests/test_bike_build.py
- The builder: tap a box (it turns yellow), tap a piece = it goes in that box and the next box is picked;
  + adds a box (up to 12), - takes one away (at least 4), the dice makes a surprise track.
- Every piece is in the builder, the new Boost pad too.
- Boost pads: riding over one = "Zoom!" and the bike goes faster (the computer riders zoom too).
- A home-made track packs into a short text (for the Friends start message) and back.
(The Friends race on a home-made track is in tests/test_friends.py.)
Screenshots: tests/out/bike-build*.png
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

def fresh(pg, custom=None):
    pg.goto((ROOT / 'bike' / 'index.html').as_uri())
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': 'big'}]}
    data = {'custom': custom} if custom else {}
    save = {'games': {'bike': {'levels': {k: {'done': True, 'stars': 1, 'time': 30} for k in ['t1', 't2', 't3', 't4', 't5']},
                               'best': 0, 'unlocked': [], 'data': data, 'achievements': []}}}
    pg.evaluate("([p, s]) => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); localStorage.setItem('kidsArcade.v1', s); }",
                [json.dumps(prof), json.dumps(save)])
    pg.reload(); pg.wait_for_timeout(500)

def saved(pg):
    return pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.v1')).games.bike.data.custom")

def boxes(pg):
    return [i for i in cmenu.items(pg) if i['attr'].startswith('piece-')]

def tap(pg, attr):
    pg.evaluate('a => ArcadeMenus.tap(a)', attr); cmenu.wait_screen(pg, 'build'); pg.wait_for_timeout(120)

def open_builder(pg):
    cmenu.to_title(pg)
    cmenu.tap(pg, 'unlocks'); cmenu.wait_screen(pg, 'unlocks')
    cmenu.tap(pg, 'build'); cmenu.wait_screen(pg, 'build')

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 800})
    pg.on('pageerror', lambda e: errors.append(str(e)))

    # ---- pack / unpack ----
    fresh(pg)
    c = {'theme': 'snow', 'pieces': ['flat', 'boost', 'loop', 'splash', 'lift', 'jelly', 'big', 'boost2']}
    code = pg.evaluate('c => __bikeBuild.pack(c)', c)
    back = pg.evaluate('s => __bikeBuild.unpack(s)', code)
    check(code.startswith('my~snow~') and len(code) < 40, f'a track packs into a short text ({code})')
    check(back == c, f'and unpacks to the same track ({back})')
    junk = pg.evaluate("__bikeBuild.unpack('my~nowhere~')")
    check(junk['theme'] == 'meadow' and len(junk['pieces']) >= 1, f'a broken code still gives a track ({junk})')
    for _ in range(20):
        d = pg.evaluate('__bikeBuild.dice()')
        if not (6 <= len(d) <= 10 and d[0] == 'flat' and d.count('loop') <= 2 and all(d[i] != d[i + 1] for i in range(len(d) - 1))):
            check(False, f'dice track looks wrong ({d})'); break
    else: check(True, 'dice tracks: 6-10 boxes, start flat, no two the same in a row, at most 2 loops')

    # ---- the builder ----
    open_builder(pg)
    bx = boxes(pg)
    check(len(bx) == 8 and bx[0]['picked'], f'a new builder has 8 boxes, the first one picked ({len(bx)})')
    puts = [i['attr'][4:] for i in cmenu.items(pg) if i['attr'].startswith('put-')]
    check(len(puts) == 15 and 'boost' in puts and 'loop' in puts and 'splash' in puts, f'every piece is in the builder, Boost pad too ({puts})')
    pg.screenshot(path=str(OUT / 'bike-build.png'))
    tap(pg, 'piece-2'); check(boxes(pg)[2]['picked'], 'tapping a box picks it')
    tap(pg, 'put-boost')
    bx = boxes(pg)
    check(saved(pg)['pieces'][2] == 'boost' and bx[3]['picked'], 'tapping a piece puts it in the box and picks the next box')
    tap(pg, 'put-loop'); check(saved(pg)['pieces'][3] == 'loop', 'and the next piece goes in the next box')
    for _ in range(6): tap(pg, 'add')
    check(len(boxes(pg)) == 12, f'+ adds boxes up to 12 ({len(boxes(pg))})')
    dim = next(i for i in cmenu.items(pg) if i['attr'] == 'add')
    tap(pg, 'add'); check(len(boxes(pg)) == 12, 'and no more than 12')
    for _ in range(10): tap(pg, 'remove')
    check(len(boxes(pg)) == 4, f'- takes boxes away, down to 4 ({len(boxes(pg))})')
    tap(pg, 'dice')
    d = saved(pg)
    check(6 <= len(d['pieces']) <= 10 and len(boxes(pg)) == len(d['pieces']), f"the dice makes a surprise track ({d['pieces']}, {d['theme']})")
    pg.screenshot(path=str(OUT / 'bike-build-dice.png'))

    # ---- boost pads in a race ----
    fresh(pg, {'theme': 'meadow', 'pieces': ['flat', 'flat', 'boost', 'flat', 'boost2', 'flat']})
    open_builder(pg)
    cmenu.tap(pg, 'race'); cmenu.into_game(pg)
    pg.wait_for_function('typeof __bikeState === "function" && __bikeState().countdown <= 0', timeout=8000)
    st = pg.evaluate('__bikeState()')
    check(st['level'] == 'custom' and st['pieces'].count('boost') == 1, f"Race it! plays the home-made track ({st['pieces']})")
    pg.keyboard.down('ArrowRight')       # gas only (no turbo): normal top speed is 400
    top, zoomed, shot = 0, False, False
    for _ in range(400):
        s = pg.evaluate('(() => { const s = __bikeState(); return { v: s.bike.v, zoom: s.bike.zoom || 0, boosts: s.stats.boosts || 0, fin: s.finished, lane: s.bike.lane }; })()')
        top = max(top, s['v'])
        if s['zoom'] > 0 and not shot: pg.screenshot(path=str(OUT / 'bike-build-boost.png')); shot = True
        if s['boosts'] >= 1: zoomed = True
        if s['fin']: break
        pg.wait_for_timeout(40)
    pg.keyboard.up('ArrowRight')
    check(zoomed, 'riding over a boost pad (lane 1 = the start lane) counts a boost')
    check(top > 600, f'a boost pad makes the bike go much faster than gas alone ({top:.0f}, gas tops out at ~400)')
    ais = pg.evaluate('__bikeState().ais')
    check(max(a['x'] for a in ais) > 2000, f'the computer riders get round too ({[a["x"] for a in ais]})')

    # ---- phone sizes: the builder fits ----
    for vp in ({'width': 390, 'height': 844}, {'width': 844, 'height': 390}):
        p2 = b.new_page(viewport=vp, is_mobile=True, has_touch=True)
        p2.on('pageerror', lambda e: errors.append(str(e)))
        fresh(p2)
        open_builder(p2)
        p2.wait_for_timeout(400)
        p2.screenshot(path=str(OUT / f"bike-build-{vp['width']}.png"))
        its = cmenu.items(p2)
        top_btns = [i for i in its if i['attr'] in ('add', 'remove', 'dice')]
        check(len(top_btns) == 3 and all(i['y'] >= 0 and i['y'] + i['h'] <= vp['height'] + 1 for i in top_btns),
              f"phone {vp['width']}x{vp['height']}: + / - / dice are on screen")
        check(all(i['w'] >= 44 for i in its if i['attr'].startswith(('piece-', 'put-'))), f"phone {vp['width']}x{vp['height']}: tiles are big enough to tap")
        p2.close()
    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
