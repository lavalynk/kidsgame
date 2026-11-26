"""Automated test: Claw Catch (the claw machine, Nov 26).

Run:  python3 tests/test_claw.py
Checks:
  * the title screen is a picture; the menu has Play, Levels and the Prize Shelf; 4 machines, only the Toy Box open
  * dropping the claw right over the middle of a toy wins it: it goes down the chute, onto the Prize Shelf (the save)
    and the Ocean machine opens
  * Normal: grabbing a toy near its edge = it slips back ("Oops!"); 2 misses in a row = the golden lucky claw,
    which then holds anything it touches
  * every coin used = the results screen (stars from the prizes won), with the prizes as pictures
  * Easy / little kids: a still claw eases onto the middle of the toy under it; one thumb: the claw slides by itself
  * keys and the big red button on the machine both drop the claw
  * the Prize Shelf shows all 24 toys; My House lets a won toy sit in the bedroom (the toy spot)
  * phone sizes: the game fits; no JavaScript errors
Screenshots land in tests/out/ (claw-*.png).
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
import cmenu as cm
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
URL = (ROOT / 'claw' / 'index.html').as_uri()
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
ST = lambda pg: pg.evaluate('__clawState()')

def fresh(pg, little=False, thumb=None):
    pg.goto(URL)
    pl = {'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': 'little' if little else 'big'}
    if thumb is not None: pl['thumb'] = thumb
    pg.evaluate("p => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); }", json.dumps({'active': 'p1', 'list': [pl]}))
    pg.reload(); pg.wait_for_timeout(500)

def play(pg, mid):
    pg.evaluate(f'document.activeElement && document.activeElement.blur(); __game.play({{id: "{mid}"}})')
    pg.wait_for_function("window.__clawState && __clawState() && __clawState().machine === '%s' && !ArcadeMenus.isOpen" % mid, timeout=8000)
    pg.wait_for_timeout(2300)          # (the "get ready" jingle)

def wait_aim(pg, timeout=15000):
    pg.wait_for_function("['aim', 'over'].includes(__clawState().phase) && !__clawState().show", timeout=timeout)

def drop_at(pg, x, key=True):
    pg.evaluate(f'__clawTest.moveTo({x})')
    if key: pg.keyboard.press('Space')
    else: pg.evaluate('__clawTest.drop()')
    pg.wait_for_function("__clawState().phase !== 'aim'", timeout=3000)

def edge_spot(pg, lo=0.84, hi=0.96):
    """A spot near the edge of a toy that nothing else covers: (x, toy id) or None."""
    for t in ST(pg)['toys']:
        if t['held'] or t['chute']: continue
        for side in (1, -1):
            for f in (0.9, 0.86, 0.93):
                x = t['x'] + side * f * t['r']
                u = pg.evaluate(f'__clawTest.under({x})')
                if u and u['id'] == t['id'] and lo <= u['off'] <= hi and 290 < x < 770: return x
    return None

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    fresh(pg)

    # ---- title + menus ----
    cm.wait_screen(pg, 'tap')
    its = cm.items(pg)
    check(len(its) == 1 and not its[0]['label'], 'title screen = a big Play picture, no words')
    pg.wait_for_timeout(1200); pg.screenshot(path=str(OUT / 'claw-title.png'))
    cm.to_title(pg)
    attrs = [i['attr'] for i in cm.items(pg)]
    check(attrs[0] == 'start' and 'levels' in attrs and 'shelf' in attrs, f'picture menu: Play, Levels, the Prize Shelf ({attrs})')
    cm.tap(pg, 'levels'); cm.wait_screen(pg, 'levels')
    tiles = [i for i in cm.items(pg) if i['attr'].startswith('level-')]
    check(len(tiles) == 4 and [t['locked'] for t in tiles] == [False, True, True, True], 'machines: 4, only the Toy Box open')
    pg.screenshot(path=str(OUT / 'claw-levels.png'))

    # ---- the Toy Box (Easy): straight over a toy = a prize ----
    play(pg, 'toys')
    st = ST(pg)
    check(st['phase'] == 'aim' and len(st['toys']) == 13 and st['tries'] == 8, f"Toy Box: 13 toys in the pile, 8 coins ({len(st['toys'])}, {st['tries']})")
    check(all(t['y'] < 460 and 280 < t['x'] < 810 for t in st['toys']), 'the pile settled inside the glass')
    pg.screenshot(path=str(OUT / 'claw-play.png'))
    bt = pg.evaluate('__clawTest.best()')
    drop_at(pg, bt['x'])
    pg.wait_for_timeout(700); pg.screenshot(path=str(OUT / 'claw-grab.png'))
    pg.wait_for_function("__clawState().won.length === 1", timeout=8000)
    pg.wait_for_timeout(300); pg.screenshot(path=str(OUT / 'claw-prize.png'))
    st = ST(pg)
    check(st['won'][0] == bt['id'], f"the toy under the claw is won ({bt['id']})")
    got = pg.evaluate("__game.save.data.got")
    check(got.get(bt['id']) == 1, f'it is on the Prize Shelf (the save: {got})')
    wait_aim(pg)
    check(len(ST(pg)['toys']) == 13, 'a new toy dropped in to fill the pile')

    # the big red button on the machine drops it too (a real mouse click on the drawn button)
    bt = pg.evaluate('__clawTest.best()'); pg.evaluate(f"__clawTest.moveTo({bt['x']})")
    box = pg.evaluate("(() => { const c = document.querySelector('canvas.ar-canvas') || [...document.querySelectorAll('canvas')].find(c => !c.closest('.ar-cmenu')); const r = c.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })()")
    b_ = pg.evaluate('__clawTest.btn()')
    pg.mouse.click(box['x'] + b_['x'] / 960 * box['w'], box['y'] + b_['y'] / 540 * box['h'])
    pg.wait_for_timeout(200)
    check(ST(pg)['phase'] != 'aim', 'tapping the big red button on the machine drops the claw')
    pg.wait_for_function("__clawState().won.length === 2", timeout=9000)
    wait_aim(pg)

    # little kid help on Easy: a still claw eases onto the middle of the toy under it
    bt = pg.evaluate('__clawTest.best()')
    toy = [t for t in ST(pg)['toys'] if abs(t['x'] - bt['x']) < 1][0]
    pg.evaluate(f"__clawTest.moveTo({bt['x'] + toy['r'] * 0.6})"); pg.wait_for_timeout(1500)
    u = pg.evaluate('__clawTest.under()')
    check(u and u['off'] < 0.15, f"Easy: the still claw eased onto the middle of the toy (off {u and round(u['off'], 2)})")

    # use up the coins: results
    while ST(pg)['used'] < ST(pg)['tries']:
        bt = pg.evaluate('__clawTest.best()'); drop_at(pg, bt['x'], key=False)
        pg.wait_for_function("['aim', 'over'].includes(__clawState().phase)", timeout=15000)
        if ST(pg)['phase'] == 'over': break
    cm.wait_screen(pg, 'results', timeout=10000); pg.wait_for_timeout(800)
    st = ST(pg)
    check(len(st['won']) >= 6, f"Easy: a prize with (almost) every coin ({len(st['won'])} of {st['tries']})")
    rows = [i for i in cm.items(pg)]
    pg.screenshot(path=str(OUT / 'claw-results.png'))
    check(pg.evaluate("(__game.save.levels.toys || {}).stars") == 3, 'Easy: 5+ prizes = 3 stars')
    lv = pg.evaluate("__game.save.levels.sea"); opened = [l for l in pg.evaluate("ArcadeMenus.list()")]
    # the Ocean opens
    pg.evaluate("__game.menu()"); pg.wait_for_timeout(500)
    cm.tap(pg, 'levels'); cm.wait_screen(pg, 'levels')
    tiles = [i for i in cm.items(pg) if i['attr'].startswith('level-')]
    check([t['locked'] for t in tiles] == [False, False, True, True], 'winning in the Toy Box opens the Ocean')

    # ---- Normal (Candy Shop): near the edge slips; 2 misses = the lucky claw ----
    play(pg, 'sweets')
    check(pg.evaluate('__game.difficulty') == 'normal' and ST(pg)['tries'] == 7, 'Candy Shop: Normal, 7 coins')
    slips = 0
    for _ in range(4):
        if ST(pg)['lucky']: break
        x = edge_spot(pg)
        if x is None: break
        drop_at(pg, x)
        pg.wait_for_function("__clawState().held || __clawState().phase === 'home' || __clawState().phase === 'carry'", timeout=5000)
        slipped = False
        for _ in range(40):
            s2 = ST(pg)
            if s2['oops']: slipped = True
            if s2['phase'] in ('home', 'carry', 'release', 'aim'): break
            pg.wait_for_timeout(100)
        if slipped: slips += 1
        wait_aim(pg)
    st = ST(pg)
    check(slips >= 2 and len(st['won']) == 0, f'Normal: grabbing near the edge slips ("Oops!") ({slips} slips, {len(st["won"])} won)')
    check(st['lucky'], 'after 2 misses in a row the claw turns golden (lucky claw)')
    pg.screenshot(path=str(OUT / 'claw-lucky.png'))
    x = edge_spot(pg, 0.7, 0.97) or edge_spot(pg, 0.5, 0.99)
    print('  (lucky drop at', x and round(x), pg.evaluate(f'__clawTest.under({x})') if x else None, ')')
    drop_at(pg, x if x is not None else pg.evaluate('__clawTest.best()')['x'])
    pg.wait_for_function("__clawState().won.length === 1 || __clawState().phase === 'aim'", timeout=12000)
    check(len(ST(pg)['won']) == 1, 'the lucky claw holds a toy even near its edge')

    # ---- one thumb: the claw slides by itself ----
    fresh(pg, little=True); cm.wait_screen(pg, 'tap'); cm.to_title(pg)
    play(pg, 'toys')
    check(pg.evaluate('__game.oneThumb') and pg.evaluate('__game.difficulty') == 'easy', 'little kid: one thumb + Easy')
    moved, last = 0, ST(pg)['cx']
    for _ in range(10):
        pg.wait_for_timeout(150); now = ST(pg)['cx']; moved += abs(now - last); last = now
    check(moved > 80, f'one thumb: the claw slides by itself ({round(moved)} px in 1.5 s)')
    pads = pg.evaluate('__pads()')
    pg.keyboard.press('Space'); pg.wait_for_function("__clawState().phase === 'aim' && __clawState().used === 1", timeout=12000)
    check(ST(pg)['used'] == 1, 'one thumb: Drop drops the claw')

    # ---- the Prize Shelf ----
    pg.evaluate("__game.save.data.got = { bunny: 2, starfish: 1 }; __game.store(); __game.menu()"); pg.wait_for_timeout(600)
    pg.evaluate('__clawTest.shelf()'); cm.wait_screen(pg, 'shelf')
    tl = [i for i in cm.items(pg) if i['attr'].startswith('prize-')]
    check(len(tl) == 24, f'Prize Shelf: all 24 toys ({len(tl)})')
    names = {i['attr']: i['label'] for i in tl}
    pg.screenshot(path=str(OUT / 'claw-shelf.png'))

    # ---- My House: a won toy sits in the bedroom ----
    pg.goto((ROOT / 'house' / 'index.html').as_uri()); pg.wait_for_timeout(1500)
    cm.wait_screen(pg, 'house')
    cm.tap_shown(pg, 'spot-toy'); pg.wait_for_timeout(400)
    its = [i['attr'] for i in cm.items(pg)]
    check('item-prize-bunny' in its and 'item-prize-starfish' in its and 'item-prize-kitty' not in its, 'house: the toy spot offers only the claw toys you won')
    cm.tap_shown(pg, 'item-prize-bunny'); pg.wait_for_timeout(400)
    placed = pg.evaluate("Arcade.store.load().house.placed.toy")
    check(placed == 'prize-bunny', f'house: tapping a won toy puts it in the bedroom, free ({placed})')
    pg.screenshot(path=str(OUT / 'claw-house.png'))

    # ---- phones ----
    for name, vp in [('phone sideways', {'width': 844, 'height': 390}), ('phone upright', {'width': 390, 'height': 844}), ('tablet', {'width': 1024, 'height': 768})]:
        p2 = b.new_page(viewport=vp, has_touch=True, is_mobile=True)
        p2.on('pageerror', lambda e: errors.append(str(e)))
        p2.goto(URL); p2.wait_for_timeout(600); cm.wait_screen(p2, 'tap'); cm.to_title(p2)
        play(p2, 'toys'); p2.wait_for_timeout(400)
        p2.screenshot(path=str(OUT / f"claw-{name.replace(' ', '-')}.png"))
        check(p2.evaluate("__clawState().phase") == 'aim', f'{name}: the game runs')
        p2.close()

    check(not errors, f'no JavaScript errors {errors[:3]}')
    b.close()
print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
