"""One thumb mode (Nov 23, new plan point 4, part 2: better touch controls for little kids).

- the setting: Arcade.profiles.oneThumb() follows the age (little kids = one thumb) until a grown-up / kid picks;
  the hub's Who's playing? switch 'thumb' flips it, the Parent corner's thumb-auto / thumb-one / thumb-all set it
- in Turbo Bike, Mini RC Racers and Fishing Frenzy (phone sideways + upright, real finger touches):
  only the one-thumb buttons show, they are big, on the screen, not on top of each other, a finger holds its key
- the game helps more: the bike rides by itself (no gas button), the RC car drives itself + a gift goes off by itself,
  the fishing lure finds the nearest fish by itself and the green part is wider
- a big kid (all buttons) still gets the full set
Screenshots in tests/out/thumb/.
Run: python3 tests/test_one_thumb.py
"""
import sys, json, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu as cm
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out' / 'thumb'; OUT.mkdir(parents=True, exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

# (the same helpers as tests/test_touch.py)
def into_play(pg, game, w, h):
    """Hit Play the way a child does, until the game runs."""
    if game == 'rc':
        cm.wait_screen(pg, 'tap'); pg.touchscreen.tap(w / 2, h / 2); pg.wait_for_timeout(800)
        cm.click(pg, '[data-menu=free]'); pg.wait_for_timeout(400)
        cm.click(pg, '[data-track]'); pg.wait_for_timeout(500)
    else:
        cm.to_title(pg); pg.wait_for_timeout(600); cm.tap(pg, 'start', touch=True)
    for _ in range(10):
        pg.wait_for_timeout(400)
        if pg.evaluate("__game.state") == 'play' and not pg.evaluate("ArcadeMenus.isOpen"): break
        if pg.evaluate("ArcadeMenus.isOpen"):
            if game == 'quest' and cm.find(pg, 'hero-0'): cm.tap(pg, 'hero-0', touch=True)
            elif cm.find(pg, 'ok'): cm.tap(pg, 'ok', touch=True)
            elif cm.find(pg, 'start'): cm.tap(pg, 'start', touch=True)
            else: pg.keyboard.press('Enter')
    if pg.evaluate("document.body.classList.contains('ar-turnshow')"):      # (phone upright: play upright anyway)
        pg.click('.ar-turnok'); pg.wait_for_timeout(300)
    pg.wait_for_timeout(400)

def mid(b): return (b['x'] + b['w'] / 2, b['y'] + b['h'] / 2)

class Fingers:
    """Real touches through Chrome's DevTools: several fingers, each one moves on its own."""
    def __init__(self, pg): self.cdp = pg.context.new_cdp_session(pg); self.on = {}
    def send(self, kind):
        pts = [{'x': x, 'y': y, 'id': i, 'radiusX': 8, 'radiusY': 8, 'force': 1} for i, (x, y) in self.on.items()]
        self.cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': pts})
    def down(self, i, x, y): self.on[i] = (x, y); self.send('touchStart')
    def move(self, i, x, y): self.on[i] = (x, y); self.send('touchMove')
    def up(self, i):
        self.on.pop(i, None)
        self.cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': [{'x': x, 'y': y, 'id': j} for j, (x, y) in self.on.items()]})

def players(**fields):
    p = {'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f'}; p.update(fields)
    return json.dumps({'active': 'p1', 'list': [p]})

def open_game(b, game, w, h, prof):
    ctx = b.new_context(viewport={'width': w, 'height': h}, has_touch=True, is_mobile=True, device_scale_factor=1)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e, t=game: errors.append(f'{t}: {e}'))
    pg.goto((ROOT / game / 'index.html').as_uri())
    pg.evaluate("p => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); }", prof)
    pg.reload(); pg.wait_for_timeout(800)
    into_play(pg, game, w, h)
    return ctx, pg

def shown(P, kind=None): return [x for p in P['pads'] if p['shown'] and (kind is None or p['kind'] == kind) for x in p['buttons']]

with sync_playwright() as pw:
    b = pw.chromium.launch()

    # ---- the setting: hub switch ----
    ctx = b.new_context(viewport={'width': 1024, 'height': 768}, has_touch=True)
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(f'hub: {e}'))
    pg.goto((ROOT / 'index.html').as_uri())
    pg.evaluate("p => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); }", players())
    pg.reload(); pg.wait_for_timeout(1000)
    check(pg.evaluate("__hubState().thumb") is False, 'hub: a big kid starts with all the buttons')
    pg.evaluate("p => { localStorage.setItem('kidsArcade.profiles', p); }", players(age='little'))
    pg.reload(); pg.wait_for_timeout(1000)
    check(pg.evaluate("__hubState().thumb") is True, 'hub: a little kid gets one thumb by itself')
    cm.wait_screen(pg, 'hub'); cm.tap(pg, 'who'); cm.wait_screen(pg, 'hub-players')
    check(bool(cm.find(pg, 'thumb')), 'hub: Who\'s playing? has the one thumb switch')
    cm.tap(pg, 'thumb'); pg.wait_for_timeout(500)
    check(pg.evaluate("__hubState().thumb") is False and pg.evaluate("Arcade.profiles.active().thumb") is False, 'hub: the switch picks all buttons (and remembers it)')
    cm.tap(pg, 'thumb'); pg.wait_for_timeout(500)
    check(pg.evaluate("__hubState().thumb") is True, 'hub: and back to one thumb')
    pg.screenshot(path=str(OUT / 'hub-players.png'))
    ctx.close()

    # ---- the setting: Parent corner ----
    ctx = b.new_context(viewport={'width': 1024, 'height': 768})
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(f'parent: {e}'))
    pg.goto((ROOT / 'parent' / 'index.html').as_uri())
    pg.evaluate("p => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); sessionStorage.setItem('kidsArcade.parentOK', '1'); }", players())
    pg.reload(); pg.wait_for_timeout(1200)
    for v, want in (('one', True), ('all', False), ('auto', None)):
        cm.tap_shown(pg, 'thumb-' + v); pg.wait_for_timeout(400)
        got = pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.profiles')).list[0].thumb")
        check(got == want, f'parent: thumb-{v} saves {want} ({got})')
    item = cm.find(pg, 'thumb-auto')
    check(bool(item and item.get('picked') is not None or item), 'parent: the buttons are there')
    pg.screenshot(path=str(OUT / 'parent.png'))
    ctx.close()

    # ---- the games ----
    for game in ['bike', 'rc', 'fishing']:
        for shape, w, h in [('phone', 844, 390), ('upright', 390, 844)]:
            tag = f'{game} {shape}'
            ctx, pg = open_game(b, game, w, h, players(age='little'))
            check(pg.evaluate("__game.state") == 'play', f'{tag}: playing')
            P = pg.evaluate('__pads()')
            check(P['thumb'] is True, f'{tag}: one thumb is on')
            full, one = shown(P, 'full'), shown(P, 'thumb')
            check(not full and len(one) >= 1, f'{tag}: only the one-thumb buttons show ({[x["id"] for x in one]})')
            check(all(x['w'] >= 76 for x in one), f'{tag}: they are big ({sorted(round(x["w"]) for x in one)})')
            check(all(x['x'] >= 0 and x['y'] >= 0 and x['x'] + x['w'] <= w + 0.5 and x['y'] + x['h'] <= h + 0.5 for x in one), f'{tag}: on the screen')
            over = [(a['id'], c['id']) for i, a in enumerate(one) for c in one[i + 1:]
                    if a['x'] < c['x'] + c['w'] - 1 and c['x'] < a['x'] + a['w'] - 1 and a['y'] < c['y'] + c['h'] - 1 and c['y'] < a['y'] + a['h'] - 1]
            check(not over, f'{tag}: not on top of each other {over}')
            corners = pg.evaluate("[...document.querySelectorAll('.ar-corner')].filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; })")
            under = [x['id'] for x in one for c in corners if x['x'] < c[2] and c[0] < x['x'] + x['w'] and x['y'] < c[3] and c[1] < x['y'] + x['h']]
            check(not under, f'{tag}: not under the corner buttons {under}')
            F = Fingers(pg)
            a = one[0]
            F.down(0, *mid(a)); pg.wait_for_timeout(120)
            Q = pg.evaluate('__pads()')
            check(a['id'] in Q['keys'], f'{tag}: a finger on {a["id"]} holds it')
            pg.screenshot(path=str(OUT / f'{game}-{shape}.png'))
            F.up(0); pg.wait_for_timeout(120)
            if len(one) == 2:
                c = one[1]
                (x0, y0), (x1, y1) = mid(a), mid(c)
                F.down(1, x0, y0)
                for k in range(1, 7): F.move(1, x0 + (x1 - x0) * k / 6, y0 + (y1 - y0) * k / 6); pg.wait_for_timeout(20)
                pg.wait_for_timeout(80)
                check(pg.evaluate('__pads()')['keys'] == [c['id']], f'{tag}: the thumb rolls to {c["id"]}')
                F.up(1); pg.wait_for_timeout(100)

            if shape == 'phone':
                # ---- the game helps more ----
                if game == 'bike':
                    pg.wait_for_timeout(4500)       # (the countdown, then riding with no finger on anything)
                    st = pg.evaluate("(() => { const s = __bikeState(); return { x: s.bike.x, v: s.bike.v, cd: s.countdown }; })()")
                    check(st['v'] > 100 and st['x'] > 300, f'{tag}: the bike rides by itself ({st})')
                if game == 'rc':
                    pg.wait_for_timeout(4500)
                    s = pg.evaluate("__rcState().player")
                    check(s['speed'] > 60 or s['progress'] > 150, f'{tag}: the car drives itself (speed {s["speed"]}, progress {s["progress"]})')
                    pg.evaluate("__rcGive('bubble')"); pg.wait_for_timeout(2500)
                    check(pg.evaluate("__rcCars().find(c => c.isPlayer).item") is None, f'{tag}: a gift goes off by itself')
                    pg.wait_for_timeout(5000)
                    s2 = pg.evaluate("__rcState().player")
                    check(s2['progress'] > s['progress'] + 300, f'{tag}: still driving along the road ({s["progress"]} -> {s2["progress"]})')
                if game == 'fishing':
                    g0 = pg.evaluate("__fishingState().greenZone")
                    pg.keyboard.down('Space'); pg.wait_for_timeout(500); pg.keyboard.up('Space'); pg.wait_for_timeout(1600)
                    st = pg.evaluate("__fishingState()")
                    check(st['phase'] in ('waiting', 'nibble', 'bite', 'reeling'), f'{tag}: cast ({st["phase"]})')
                    if st['bobber']:
                        # pull the lure right up (the Up key still works), let go: it goes back down to the fish by itself
                        pg.keyboard.down('ArrowUp'); pg.wait_for_timeout(1500); pg.keyboard.up('ArrowUp')
                        t0 = pg.evaluate("__fishingState().bobber.lureTarget")
                        pg.wait_for_timeout(1500)
                        st2 = pg.evaluate("__fishingState()")
                        t1 = st2['bobber'] and st2['bobber']['lureTarget']
                        moved = st2['phase'] != 'waiting' or (t1 is not None and t1 > t0 + 40)
                        check(moved, f'{tag}: the lure goes down to the fish by itself ({round(t0)} -> {t1 and round(t1)}, {st2["phase"]})')
                    check(g0[1] - g0[0] > 0.5 * 1.15, f'{tag}: the green part is wider ({g0})')
            ctx.close()

        # a big kid: all the buttons
        ctx, pg = open_game(b, game, 844, 390, players())
        P = pg.evaluate('__pads()')
        check(P['thumb'] is False and shown(P, 'full') and not shown(P, 'thumb'), f'{game}: a big kid gets all the buttons')
        # and a little kid whose grown-up picked all buttons
        ctx.close()
        ctx, pg = open_game(b, game, 844, 390, players(age='little', thumb=False))
        P = pg.evaluate('__pads()')
        check(P['thumb'] is False and shown(P, 'full'), f'{game}: a little kid with "all buttons" picked gets them all')
        ctx.close()

    # a game without one-thumb buttons yet (Jungle Jump) keeps its full set
    ctx, pg = open_game(b, 'jungle', 844, 390, players(age='little'))
    P = pg.evaluate('__pads()')
    check(P['thumb'] is False and shown(P, 'full'), 'jungle: no one-thumb set yet, so all its buttons show')
    ctx.close()
    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
