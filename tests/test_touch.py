"""The touch pad (Nov 23, new plan point 4: better touch controls).

Every kit game with on-screen buttons (Turbo Bike, Mini RC Racers, Jungle Jump, Treasure Trail, Potion Quest,
Fishing Frenzy), on a phone sideways, a phone upright and a tablet, with real finger touches (CDP):
  - the buttons are big (>= 70 px; 68 on a phone held upright), on the screen, not on top of each other or the
    corner buttons; the game's main button is the biggest and sits on the outside edge
  - a finger on a button holds its key and the button lights up; letting go lets go
  - a thumb can ROLL from one button to the next without lifting (the key switches)
  - a touch in the gap between two buttons still presses one
  - two thumbs at once (left pad + right pad) hold both keys
Screenshots in tests/out/touch/.
Run: python3 tests/test_touch.py   (or: python3 tests/test_touch.py rc jungle)
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu as cm
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out' / 'touch'; OUT.mkdir(parents=True, exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

GAMES = ['bike', 'rc', 'jungle', 'trail', 'quest', 'fishing']
only = sys.argv[1:]
if only: GAMES = [g for g in GAMES if g in only]
SHAPES = [('phone', 844, 390), ('upright', 390, 844), ('tablet', 1024, 768)]

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

def pads(pg): return pg.evaluate('__pads()')
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

with sync_playwright() as pw:
    b = pw.chromium.launch()
    for game in GAMES:
        for shape, w, h in SHAPES:
            tag = f'{game} {shape}'
            ctx = b.new_context(viewport={'width': w, 'height': h}, has_touch=True, is_mobile=shape != 'tablet', device_scale_factor=1)
            pg = ctx.new_page()
            pg.on('pageerror', lambda e, t=tag: errors.append(f'{t}: {e}'))
            pg.goto((ROOT / game / 'index.html').as_uri())
            pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(800)
            into_play(pg, game, w, h)
            check(pg.evaluate("__game.state") == 'play', f'{tag}: the game is playing')
            P = pads(pg)
            btns = [x for p in P['pads'] for x in p['buttons']]
            shown = [x for x in btns if x['shown']]
            check(len(btns) >= 2 and len(shown) == len(btns), f'{tag}: all {len(btns)} touch buttons show')
            small = 67 if shape == 'upright' else 70
            check(all(x['w'] >= small and abs(x['w'] - x['h']) < 1 for x in shown), f'{tag}: every button is big (>= {small} px: {sorted(round(x["w"]) for x in shown)})')
            check(all(x['x'] >= 0 and x['y'] >= 0 and x['x'] + x['w'] <= w + 0.5 and x['y'] + x['h'] <= h + 0.5 for x in shown), f'{tag}: every button is on the screen')
            over = [(a['id'], c['id']) for i, a in enumerate(shown) for c in shown[i + 1:]
                    if a['x'] < c['x'] + c['w'] - 1 and c['x'] < a['x'] + a['w'] - 1 and a['y'] < c['y'] + c['h'] - 1 and c['y'] < a['y'] + a['h'] - 1]
            check(not over, f'{tag}: no buttons on top of each other {over}')
            corners = pg.evaluate("[...document.querySelectorAll('.ar-corner')].filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; })")
            under = [x['id'] for x in shown for c in corners if x['x'] < c[2] and c[0] < x['x'] + x['w'] and x['y'] < c[3] and c[1] < x['y'] + x['h']]
            check(not under, f'{tag}: no button under the corner buttons {under}')
            mains = [x for x in shown if x['main']]
            check(len(mains) == 1, f'{tag}: one main button ({[x["id"] for x in mains]})')
            if mains and shape != 'upright':
                m = mains[0]
                check(all(m['w'] >= x['w'] for x in shown), f'{tag}: the main button is the biggest')
                check(all(m['x'] >= x['x'] for x in shown), f'{tag}: the main button is on the outside edge (right)')
            check(all(x['color'] for x in shown), f'{tag}: every button has its color')

            # ---- real fingers ----
            F = Fingers(pg)
            side = next(p for p in P['pads'] if len(p['buttons']) >= 2)
            a, c = side['buttons'][0], side['buttons'][1]
            F.down(0, *mid(a)); pg.wait_for_timeout(120)
            Q = pads(pg); qa = next(x for p in Q['pads'] for x in p['buttons'] if x['id'] == a['id'])
            check(a['id'] in Q['keys'] and qa['down'], f'{tag}: a finger on {a["id"]} holds it and it lights up')
            if shape == 'phone': pg.screenshot(path=str(OUT / f'{game}-press.png'))
            # roll the thumb to the next button, in little steps, without lifting
            (x0, y0), (x1, y1) = mid(a), mid(c)
            for k in range(1, 7): F.move(0, x0 + (x1 - x0) * k / 6, y0 + (y1 - y0) * k / 6); pg.wait_for_timeout(20)
            pg.wait_for_timeout(80)
            Q = pads(pg)
            check(c['id'] in Q['keys'] and a['id'] not in Q['keys'], f'{tag}: rolling the thumb to {c["id"]} switches the key ({Q["keys"]})')
            lit = [x['id'] for p in Q['pads'] for x in p['buttons'] if x['down']]
            check(lit == [c['id']], f'{tag}: only {c["id"]} is lit ({lit})')
            F.up(0); pg.wait_for_timeout(100)
            Q = pads(pg)
            check(not Q['keys'] and not any(x['down'] for p in Q['pads'] for x in p['buttons']), f'{tag}: letting go lets go of everything')
            # a touch in the gap between two buttons still presses one
            gx, gy = (x0 + x1) / 2, (y0 + y1) / 2
            F.down(1, gx, gy); pg.wait_for_timeout(100)
            Q = pads(pg)
            check(len(Q['keys']) == 1 and Q['keys'][0] in (a['id'], c['id']), f'{tag}: a touch in the gap presses a button ({Q["keys"]})')
            F.up(1); pg.wait_for_timeout(100)
            # two thumbs at once
            if len(P['pads']) == 2 and mains:
                F.down(2, *mid(a)); F.down(3, *mid(mains[0])); pg.wait_for_timeout(120)
                Q = pads(pg)
                check(a['id'] in Q['keys'] and mains[0]['id'] in Q['keys'], f'{tag}: two thumbs hold {a["id"]} + {mains[0]["id"]} together')
                if shape == 'phone': pg.screenshot(path=str(OUT / f'{game}-two.png'))
                F.up(3); F.up(2); pg.wait_for_timeout(100)
                check(not pads(pg)['keys'], f'{tag}: both thumbs up = nothing held')
            if shape != 'phone': pg.screenshot(path=str(OUT / f'{game}-{shape}.png'))
            ctx.close()
    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
