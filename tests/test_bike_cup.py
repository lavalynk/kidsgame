"""Automated test: Turbo Bike's Championship cups (Keith's bike plan #6, Nov 18).

Run:  python3 tests/test_bike_cup.py
  Mini Cup      = Sunny Start, Dusty Hills, Candy Bounce in a row (always open)
  Championship  = all 10 tracks in a row (opens after the Mini Cup)
Every race gives points (10 / 7 / 5 / 3) to you, Zip, Moxie and Bolt; most points after the
last race wins the cup. The test plays a whole Mini Cup (a real ride, then quick ones),
checks the points, the trophy, the house coin and that the Championship opens; then starts
the Championship, leaves after race 1 and checks the tile carries on with race 2.
Screenshots in tests/out/bike-cup-*.png.
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu      # (Nov 21: Turbo Bike's menus are drawn with Phaser + Rex UI)
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

def fresh(pg, done=(), data=None):
    # (a pretend day whose Daily Surprise isn't about Turbo Bike: finishing it would add 2 more house coins)
    pg.goto((ROOT / 'bike' / 'index.html').as_uri())
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': 'big'}]}
    save = {'games': {'bike': {'levels': {k: {'done': True, 'stars': 1, 'time': 30} for k in done}, 'best': 0, 'unlocked': [], 'data': data or {}, 'achievements': []}}}
    pg.evaluate("([p, s]) => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); localStorage.setItem('kidsArcade.v1', s); localStorage.setItem('kidsArcade.testDay', '2026-11-21'); }",
                [json.dumps(prof), json.dumps(save)])
    pg.reload(); pg.wait_for_timeout(500)

def open_levels(pg):
    """the level picker's tiles (from wherever we are: the title menu or the results)"""
    if cmenu.screen(pg) != 'levels':
        if cmenu.screen(pg) == 'results': cmenu.tap(pg, 'menu')
        cmenu.to_title(pg)
        cmenu.tap(pg, 'levels'); cmenu.wait_screen(pg, 'levels')
    return [i for i in cmenu.items(pg) if i['attr'].startswith('level-')]

def tile(pg, name):
    return next((t for t in open_levels(pg) if t['label'] == name), None)

def tile_meta(pg, name):
    """the words under a level tile (e.g. '2/3')"""
    return pg.evaluate("""n => { const r = ArcadeMenus.current().rows[0]; const it = r.items.find(i => i.name === n);
      return (it.meta || []).filter(m => m.text).map(m => m.text).join(' '); }""", name)

def go(pg, name):
    """tap a level tile (scrolled out of sight or not) and wait for the race"""
    t = tile(pg, name)
    pg.evaluate('a => ArcadeMenus.tap(a)', t['attr'])
    wait_race(pg)

def wait_race(pg):
    cmenu.into_game(pg)
    pg.wait_for_function('typeof __bikeState === "function" && __bikeState().countdown <= 0', timeout=8000)

def row(pg, kind):
    return pg.evaluate("k => ArcadeMenus.current().rows.find(r => r.kind === k) || null", kind)

def big_label(pg):
    return pg.evaluate("ArcadeMenus.current().footer.items[0].label")

def next_btn(pg):
    cmenu.tap(pg, pg.evaluate("ArcadeMenus.current().footer.items[0].attr")); wait_race(pg)

def ride(pg):
    """the bot: gas all the way, turbo while the engine is cool"""
    pg.keyboard.down('ArrowRight'); turbo = False
    for _ in range(900):
        s = pg.evaluate('(() => { const s = __bikeState(); return { fin: s.finished, heat: s.bike.heat, over: s.bike.over }; })()')
        if s['fin']: break
        want = s['heat'] < 0.7 and s['over'] <= 0
        if want and not turbo: pg.keyboard.down('Space'); turbo = True
        if not want and turbo: pg.keyboard.up('Space'); turbo = False
        pg.wait_for_timeout(30)
    if turbo: pg.keyboard.up('Space')
    pg.keyboard.up('ArrowRight')

def zoom_to_finish(pg, wait=0):
    """a quick race: (optionally let the others ride a while first), then hop to just before the finish"""
    if wait: pg.wait_for_timeout(wait)
    pg.evaluate('(() => { const s = __bikeState(); s.bike.x = s.finishX - 40; s.bike.v = 400; s.bike.h = 0; s.bike.air = false; })()')
    pg.wait_for_function('__bikeState().finished', timeout=5000)

def results(pg):
    cmenu.wait_screen(pg, 'results')
    pg.wait_for_timeout(1000)

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 760})
    pg.on('pageerror', lambda e: errors.append(str(e)))

    # ---- the picker: Mini Cup open, Championship locked; PLAY never jumps into a cup ----
    fresh(pg)
    mini, big = tile(pg, 'Mini Cup'), tile(pg, 'Championship')
    check(mini is not None and not mini['locked'], 'Mini Cup tile is there and open')
    check(big is not None and big['locked'], 'Championship tile is there and locked')
    pg.screenshot(path=str(OUT / 'bike-cup-levels.png'))

    # ---- race 1 of the Mini Cup: a real ride on Sunny Start ----
    go(pg, 'Mini Cup')
    st = pg.evaluate('__bikeState()')
    check(st['cup'] and st['cup']['track'] == 't1' and st['cup']['race'] == 0, f"race 1 is Sunny Start ({st['cup']})")
    check(st['diff'] == 'easy', f"it plays at Sunny Start's difficulty ({st['diff']})")
    pg.wait_for_timeout(1500)
    pg.screenshot(path=str(OUT / 'bike-cup-hud.png'))
    ride(pg); results(pg)
    c = pg.evaluate('__bikeState().cup.state')
    check(c['race'] == 1 and sum(c['points'].values()) == 25, f"after race 1: 25 points shared out ({c['points']})")
    check(sorted(c['points'].values()) == [3, 5, 7, 10], f"one rider per place ({c['points']})")
    tb = row(pg, 'cup-table')
    check(tb and tb['riders'] == 4, f'the points table shows 4 riders ({tb and tb["riders"]})')
    check(tb and tb['flags'] == 3 and tb['done'] == 1, '3 flags for 3 races, 1 done')
    pg.screenshot(path=str(OUT / 'bike-cup-table.png'))
    check(big_label(pg) == 'Next race', 'the big button is Next race')

    # ---- race 2: quick; race 3: let the others ride first so I'm not first ----
    cmenu.tap(pg, 'next race'); wait_race(pg)            # (a real tap on the button)
    check(pg.evaluate('__bikeState().cup.track') == 't2', 'race 2 is Dusty Hills')
    zoom_to_finish(pg); results(pg)
    c = pg.evaluate('__bikeState().cup.state')
    check(c['race'] == 2 and sum(c['points'].values()) == 50 and c['last'][0] == 'You', f"race 2: I won it ({c['last']}, {c['points']})")
    next_btn(pg)
    check(pg.evaluate('__bikeState().cup.track') == 't7', 'race 3 is Candy Bounce')
    zoom_to_finish(pg, wait=16000); results(pg)
    st = pg.evaluate('__bikeState()')
    c = st['cup']['state']
    check(not c['active'] and c['race'] == 3 and sum(c['points'].values()) == 75, f"the cup is over: 75 points in all ({c['points']})")
    check(c['last'][0] != 'You', f"race 3: the others got there first ({c['last']})")
    table = sorted(c['points'].items(), key=lambda kv: -kv[1])
    rank = 1 + sum(1 for n, p in c['points'].items() if n != 'You' and p > c['points']['You'])
    check(st['cup']['best'] == rank, f"best place saved ({st['cup']['best']} vs {rank}, {table})")
    pd = row(pg, 'cup-podium')
    check(pd and pd['trophy'] == rank and pd['podium'] == 3, f'trophy + podium of 3 ({pd and {k: pd[k] for k in ("trophy", "podium")}})')
    check(big_label(pg) == 'New cup', 'the big button is New cup')
    pg.screenshot(path=str(OUT / 'bike-cup-podium.png'))
    sv = pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.v1'))")
    gd = sv['games']['bike']
    check(gd['data']['cupsDone']['mini'] == 1, 'cupsDone.mini = 1')
    if rank == 1:
        check(sv.get('houseBonus', 0) == 1 and 'minicup' in str(gd.get('achievements', [])), f"cup won: 1 house coin + Mini Cup trophy ({sv.get('houseBonus')})")
    check(gd['levels'].get('mini', {}).get('done'), 'the cup has its own record (levels.mini)')

    # ---- a won cup (made up save): first win gives the coin only once ----
    fresh(pg, data={'cups': {'mini': {'active': True, 'race': 2, 'points': {'You': 20, 'Zip': 10, 'Moxie': 8, 'Bolt': 6}, 'last': None}},
                    'cupsDone': {'mini': 1}, 'cupWins': {'mini': 1}})
    open_levels(pg)
    check('2/3' in tile_meta(pg, 'Mini Cup'), f"the tile shows how far the cup got ({tile_meta(pg, 'Mini Cup')!r})")
    check(not tile(pg, 'Championship')['locked'], 'the Championship is open after a Mini Cup')
    go(pg, 'Mini Cup')
    check(pg.evaluate('__bikeState().cup.track') == 't7', 'carries on with race 3')
    zoom_to_finish(pg); results(pg)
    sv = pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.v1'))")
    check(pg.evaluate('__bikeState().cup.best') == 1 and sv.get('houseBonus', 0) == 0, f"won again: no second house coin ({sv.get('houseBonus')})")
    check('champion' in pg.evaluate('ArcadeMenus.current().banner').lower(), 'the banner says champion')
    pg.screenshot(path=str(OUT / 'bike-cup-won.png'))

    # ---- the Championship: 10 races, race 1 = Sunny Start; leave after race 1, the tile carries on ----
    fresh(pg, data={'cupsDone': {'mini': 1}})
    go(pg, 'Championship')
    st = pg.evaluate('__bikeState()')
    check(st['cup']['key'] == 'big' and st['cup']['track'] == 't1', 'Championship race 1 = Sunny Start')
    zoom_to_finish(pg); results(pg)
    check((row(pg, 'cup-table') or {}).get('flags') == 10, '10 flags')
    pg.screenshot(path=str(OUT / 'bike-cup-table10.png'))
    cmenu.tap(pg, 'menu'); cmenu.wait_screen(pg, 'title')
    open_levels(pg)
    check('1/10' in tile_meta(pg, 'Championship'), f"tile shows 1/10 ({tile_meta(pg, 'Championship')!r})")
    go(pg, 'Championship')
    st = pg.evaluate('__bikeState()')
    check(st['cup']['track'] == 't2' and st['cup']['race'] == 1, f"carries on with race 2 = Dusty Hills ({st['cup']['track']})")

    # ---- the normal tracks still work as before (records, ghost) ----
    fresh(pg)
    go(pg, 'Sunny Start')
    check(pg.evaluate('__bikeState().cup') is None, 'Sunny Start on its own is not a cup race')
    zoom_to_finish(pg); results(pg)
    check(big_label(pg) == 'Next', 'normal results keep the Next button')

    # ---- phones, upright and sideways: the cup screens fit ----
    for vp in ({'width': 390, 'height': 844}, {'width': 844, 'height': 390}):
        p2 = b.new_page(viewport=vp, is_mobile=True, has_touch=True)
        p2.on('pageerror', lambda e: errors.append(str(e)))
        fresh(p2, data={'cups': {'mini': {'active': True, 'race': 2, 'points': {'You': 14, 'Zip': 17, 'Moxie': 10, 'Bolt': 9}, 'last': None}}, 'cupsDone': {'mini': 1}})
        p2.evaluate('a => ArcadeMenus.tap(a)', tile(p2, 'Mini Cup')['attr']); p2.wait_for_timeout(600)
        # (the phone may ask to turn sideways: play upright anyway)
        up = p2.locator('.ar-turnok')
        if up.count() and up.first.is_visible(): up.first.click(); p2.wait_for_timeout(300)
        wait_race(p2)
        zoom_to_finish(p2); results(p2)
        p2.screenshot(path=str(OUT / f"bike-cup-podium-{vp['width']}.png"))
        sw = p2.evaluate('document.documentElement.scrollWidth')
        check(sw <= vp['width'] + 1, f"phone {vp['width']}x{vp['height']}: no sideways scrolling ({sw})")
        btn = cmenu.find(p2, 'new cup')
        check(btn and btn['y'] >= 0 and btn['y'] + btn['h'] <= vp['height'], f"phone {vp['width']}: the New cup button is on the screen")
        cmenu.tap(p2, 'new cup', touch=True); wait_race(p2)
        check(p2.evaluate('__bikeState().cup.race') == 0, f"phone {vp['width']}: New cup starts a new cup")
        p2.close()
    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
