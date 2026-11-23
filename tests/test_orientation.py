"""Every game held upright AND sideways, while PLAYING (Nov 23, new plan point 4, last part).

tests/test_phones.py checks the menus on many phone shapes; this one checks the games themselves:
for every arcade game on a phone (sideways + upright + a small upright phone) and a tablet (both ways):
  - Play works the way a child does it (taps), the game runs
  - nothing sticks out of the screen (no sideways page scrolling), the game picture fits on the screen
  - a phone held upright: the wide games show the big "turn me" picture and wait; "play upright"
    then plays
  - the touch buttons are on the screen, never under the home / pause corners
  - TURNING the device mid-game (sideways -> upright -> sideways): the picture follows, the buttons
    follow, the game keeps going, no JavaScript errors
  - a few seconds of real play with no errors
Coloring + maze: the page / maze fits, the buttons fit, turning works.
Screenshots in tests/out/orient/ (game-shape.png and game-shape-turned.png).
Run: python3 tests/test_orientation.py   (or: python3 tests/test_orientation.py rc jungle)
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu as cm
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out' / 'orient'; OUT.mkdir(parents=True, exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

KIT = ['bike', 'rc', 'hoops', 'golf', 'archery', 'jungle', 'trail', 'quest', 'space', 'abc', 'fishing', 'piano']
PAGES = ['coloring', 'maze']
only = sys.argv[1:]
if only: KIT = [g for g in KIT if g in only]; PAGES = [g for g in PAGES if g in only]
# (name, width, height, a phone?)
SHAPES = [('phone', 844, 390, True), ('upright', 390, 844, True), ('small', 360, 640, True),
          ('tablet', 1024, 768, False), ('tablet-up', 768, 1024, False)]

def into_play(pg, game, w, h):
    """Hit Play the way a child does, until the game runs."""
    if game == 'rc':
        cm.wait_screen(pg, 'tap'); pg.touchscreen.tap(w / 2, h / 2); pg.wait_for_timeout(800)
        cm.click(pg, '[data-menu=free]'); pg.wait_for_timeout(400)
        cm.click(pg, '[data-track]'); pg.wait_for_timeout(500)
    else:
        cm.to_title(pg); pg.wait_for_timeout(600); cm.tap(pg, 'start', touch=True)
    for _ in range(12):
        pg.wait_for_timeout(400)
        if pg.evaluate("__game.state") == 'play' and not pg.evaluate("ArcadeMenus.isOpen"): break
        if pg.evaluate("ArcadeMenus.isOpen"):
            its = cm.items(pg)
            if game == 'quest' and cm.find(pg, 'hero-0'): cm.tap(pg, 'hero-0', touch=True)
            elif cm.find(pg, 'ok'): cm.tap(pg, 'ok', touch=True)
            elif cm.find(pg, 'start'): cm.tap(pg, 'start', touch=True)
            else:
                # (a level / topic picker: the first open tile)
                tile = next((i for i in its if i.get('shown', True) and not i.get('locked') and
                             (i['attr'].startswith('level') or i['attr'].startswith('track') or i['attr'].startswith('topic'))), None)
                if tile: pg.touchscreen.tap(tile['x'] + tile['w'] / 2, tile['y'] + tile['h'] / 2)
                else: pg.keyboard.press('Enter')

LOOK = """() => {
  const r = (el) => { if (!el || !el.offsetParent && getComputedStyle(el).position !== 'fixed') return null;
    const b = el.getBoundingClientRect(); return b.width && b.height ? { x: b.left, y: b.top, w: b.width, h: b.height } : null; };
  const cv = document.querySelector('.ar-stage canvas, #stage canvas, canvas.ar-game') || [...document.querySelectorAll('canvas')].filter(c => !c.closest('.ar-cmenu')).sort((a, b) => b.width * b.height - a.width * a.height)[0];
  const pads = window.__pads ? __pads().pads.filter(p => p.shown).flatMap(p => p.buttons.filter(b => b.shown)) : [];
  return { vw: innerWidth, vh: innerHeight, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight,
    canvas: r(cv), corners: [...document.querySelectorAll('.ar-corner, .ar-back')].map(r).filter(Boolean), pads,
    turn: document.body.classList.contains('ar-turnshow'), state: window.__game ? __game.state : '' };
}"""

def overlap(a, b, pad=0):
    return a['x'] < b['x'] + b['w'] - pad and b['x'] < a['x'] + a['w'] - pad and a['y'] < b['y'] + b['h'] - pad and b['y'] < a['y'] + a['h'] - pad

def look_ok(pg, tag, phone):
    L = pg.evaluate(LOOK)
    vw, vh = L['vw'], L['vh']
    check(L['sw'] <= vw + 1, f'{tag}: no sideways scrolling ({L["sw"]} <= {vw})')
    c = L['canvas']
    check(c is not None, f'{tag}: the game picture is there')
    if c:
        check(c['x'] >= -1 and c['y'] >= -1 and c['x'] + c['w'] <= vw + 1 and c['y'] + c['h'] <= vh + 1, f'{tag}: the game picture fits on the screen')
        # (it fills the screen one way or the other: letterboxed, never tiny)
        use = max(c['w'] / vw, c['h'] / vh)
        check(use >= 0.85, f'{tag}: the game picture fills the screen one way ({use:.0%})')
    off = [p['id'] for p in L['pads'] if p['x'] < -1 or p['y'] < -1 or p['x'] + p['w'] > vw + 1 or p['y'] + p['h'] > vh + 1]
    check(not off, f'{tag}: every touch button is on the screen {off}')
    under = [p['id'] for p in L['pads'] for k in L['corners'] if overlap(p, k, 2)]
    check(not under, f'{tag}: no touch button under the home / pause corner {under}')
    small = [(p['id'], int(min(p['w'], p['h']))) for p in L['pads'] if min(p['w'], p['h']) < 60]
    check(not small, f'{tag}: the touch buttons are big enough for a thumb {small}')
    clash = [(a['id'], c['id']) for i, a in enumerate(L['pads']) for c in L['pads'][i + 1:] if overlap(a, c, 4)]
    check(not clash, f'{tag}: no touch buttons on top of each other {clash}')
    return L

def run_a_bit(pg):
    """A few seconds of real play: hold the main button / tap the middle (it should never throw)."""
    pg.keyboard.down('ArrowRight'); pg.wait_for_timeout(700); pg.keyboard.up('ArrowRight')
    pg.keyboard.press('Space'); pg.wait_for_timeout(700)

with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    for game in KIT:
        for shape, w, h, phone in SHAPES:
            tag = f'{game} {shape}'
            ctx = b.new_context(viewport={'width': w, 'height': h}, has_touch=True, is_mobile=phone, device_scale_factor=1)
            pg = ctx.new_page()
            pg.on('pageerror', lambda e, t=tag: errors.append(f'{t}: {e}'))
            pg.goto((ROOT / game / 'index.html').as_uri())
            pg.evaluate("localStorage.clear(); sessionStorage.clear()"); pg.reload(); pg.wait_for_timeout(800)
            into_play(pg, game, w, h)
            check(pg.evaluate("__game.state") == 'play', f'{tag}: the game is playing')
            wide = pg.evaluate("__game.W > __game.H")
            L = pg.evaluate(LOOK)
            if phone and h > w and wide:
                # a wide game on a phone held upright: "turn me" + the game waits
                check(L['turn'], f'{tag}: the big "turn me" picture shows')
                pg.screenshot(path=str(OUT / f'{game}-{shape}-turnme.png'))
                tb = pg.evaluate("(() => { const b = document.querySelector('.ar-turnok').getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; })()")
                check(tb['w'] >= 44 and tb['y'] + tb['h'] <= h, f'{tag}: the "play upright" button is on the screen ({tb["w"]:.0f} px)')
                pg.touchscreen.tap(tb['x'] + tb['w'] / 2, tb['y'] + tb['h'] / 2); pg.wait_for_timeout(400)
                check(not pg.evaluate("document.body.classList.contains('ar-turnshow')"), f'{tag}: "play upright" plays')
            else:
                check(not L['turn'], f'{tag}: no "turn me" picture')
            look_ok(pg, tag, phone)
            run_a_bit(pg)
            pg.screenshot(path=str(OUT / f'{game}-{shape}.png'))
            # turn the device mid-game
            pg.evaluate("sessionStorage.removeItem('ar-upright')")
            pg.set_viewport_size({'width': h, 'height': w}); pg.wait_for_timeout(700)
            T = pg.evaluate(LOOK)
            if phone and w > h and wide:
                check(T['turn'], f'{tag} -> turned upright: "turn me" shows, the game waits')
                pg.set_viewport_size({'width': w, 'height': h}); pg.wait_for_timeout(700)
                check(not pg.evaluate(LOOK)['turn'], f'{tag} -> turned back: playing again')
                look_ok(pg, f'{tag} turned back', phone)
            else:
                if not T['turn']: look_ok(pg, f'{tag} turned', phone)
                pg.screenshot(path=str(OUT / f'{game}-{shape}-turned.png'))
            check(pg.evaluate("__game.state") in ('play', 'pause', 'over'), f'{tag}: still in the game after turning')
            ctx.close()

    # ---- coloring + maze (their own pages) ----
    for game in PAGES:
        for shape, w, h, phone in SHAPES:
            tag = f'{game} {shape}'
            ctx = b.new_context(viewport={'width': w, 'height': h}, has_touch=True, is_mobile=phone, device_scale_factor=1)
            pg = ctx.new_page()
            pg.on('pageerror', lambda e, t=tag: errors.append(f'{t}: {e}'))
            pg.goto((ROOT / game / 'index.html').as_uri())
            pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(1000)
            if game == 'coloring':
                cm.wait_screen(pg, 'coloring-pick')
                t = next(i for i in cm.items(pg) if i['attr'].startswith('page-'))
                pg.touchscreen.tap(t['x'] + t['w'] / 2, t['y'] + t['h'] / 2); pg.wait_for_timeout(900)
                area = '#picture'
            else:
                if pg.evaluate("ArcadeMenus.isOpen"):
                    t = next((i for i in cm.items(pg) if i['attr'].startswith('level-')), None)
                    if t: pg.touchscreen.tap(t['x'] + t['w'] / 2, t['y'] + t['h'] / 2)
                    pg.wait_for_timeout(900)
                area = '#maze, svg#board, .maze-wrap'
            for step, (vw, vh) in (('', (w, h)), ('-turned', (h, w))):
                if step: pg.set_viewport_size({'width': vw, 'height': vh}); pg.wait_for_timeout(700)
                L = pg.evaluate("""(sel) => {
                  const el = document.querySelector(sel); const b = el && el.getBoundingClientRect();
                  const btn = [...document.querySelectorAll('button')].filter(x => x.offsetParent).map(x => x.getBoundingClientRect())
                    .filter(r => r.width > 0);
                  return { sw: document.documentElement.scrollWidth, vw: innerWidth, vh: innerHeight,
                    area: b ? { x: b.left, y: b.top, w: b.width, h: b.height } : null,
                    off: btn.filter(r => r.left < -1 || r.right > innerWidth + 1 || r.top < -1 || r.bottom > innerHeight + 1).length,
                    tiny: btn.filter(r => Math.min(r.width, r.height) < 36).length };
                }""", area)
                tg = tag + step
                check(L['sw'] <= L['vw'] + 1, f'{tg}: no sideways scrolling')
                a = L['area']
                check(a and a['x'] >= -1 and a['x'] + a['w'] <= L['vw'] + 1 and a['y'] + a['h'] <= L['vh'] + 1 and a['w'] >= min(L['vw'], L['vh']) * 0.5,
                      f'{tg}: the {"page" if game == "coloring" else "maze"} fits on the screen ({a and int(a["w"])} x {a and int(a["h"])})')
                check(L['off'] == 0, f'{tg}: every button on the screen ({L["off"]} off)')
                pg.screenshot(path=str(OUT / f'{game}-{shape}{step}.png'))
            ctx.close()
    b.close()

check(not errors, f'no JavaScript errors {errors[:5]}')
print('\n' + ('all passed' if not fails else f'{len(fails)} FAILED:\n  ' + '\n  '.join(fails)))
sys.exit(1 if fails else 0)
