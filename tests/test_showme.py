""""Show me" how to play (Nov 24, new plan point 6). The first time a player starts a game, the real game plays itself
for a few seconds while a see-through hand does the moves (pulls the ball, the bow, putts, taps the right bubble),
then "Your turn!" and the round starts fresh. Nothing the demo does is saved. The Help and Pause screens have a
Show me button, a tap or a key skips it, and the 2nd time it doesn't come by itself.
Screenshots in tests/out/showme/.  Run: python3 tests/test_showme.py   (or: python3 tests/test_showme.py hoops golf)
"""
import sys, pathlib, json
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu as cm
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out' / 'showme'; OUT.mkdir(parents=True, exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

# each game: its state hook + "did the demo do something?" (scored / putted / answered)
GAMES = {
    'hoops':   ('__hoopsState()',   lambda s: s['score'] > 0),
    'golf':    ('__golfState()',    lambda s: s['strokes'] > 0),
    'archery': ('__archeryState()', lambda s: s['shots'] > 0),
    'abc':     ('__abcState()',     lambda s: s['score'] > 0),
}
only = sys.argv[1:]
names = [g for g in GAMES if not only or g in only]
SAVES = "JSON.stringify(Object.keys(localStorage).filter(k => !/showme|parent/.test(k)).sort().map(k => [k, localStorage.getItem(k)]))"

def open_game(b, game, flag=True, vp=(1000, 600), mobile=False):
    ctx = b.new_context(viewport={'width': vp[0], 'height': vp[1]}, has_touch=True, is_mobile=mobile)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e, gm=game: errors.append(f'{gm}: {e}'))
    pg.goto((ROOT / game / 'index.html').as_uri())
    pg.evaluate("localStorage.clear()" + ("; localStorage.setItem('kidsArcade.testShowMe', '1')" if flag else ''))
    pg.reload(); pg.wait_for_timeout(800)
    cm.to_title(pg); pg.wait_for_timeout(500)
    return ctx, pg

def demo(pg): return pg.evaluate('__showMe()')

with sync_playwright() as pw:
    b = pw.chromium.launch()
    for game in names:
        hook, did = GAMES[game]
        ctx, pg = open_game(b, game)
        saves = pg.evaluate(SAVES)
        cm.tap(pg, 'start'); pg.wait_for_timeout(300)
        d = demo(pg)
        check(d['on'] and pg.locator('.ar-controls').count() == 0, f'{game}: the first Play starts "Show me" (no controls card)')
        # watch it: the hand moves and presses, the game really plays
        spots, pressed, acted, shot = set(), False, False, False
        for i in range(100):
            d = demo(pg)
            if not d['on'] or d['ending']: break
            if d['hand']:
                spots.add((round(d['hand']['x']), round(d['hand']['y'])))
                pressed = pressed or d['hand']['pressing']
                h = d['hand']; vw = pg.viewport_size
                if not (0 <= h['x'] <= vw['width'] and 0 <= h['y'] <= vw['height']): check(False, f'{game}: the hand stays on the screen ({h})')
            acted = acted or did(pg.evaluate(hook))
            if d['hand'] and d['hand']['pressing'] and not shot: pg.screenshot(path=str(OUT / f'{game}.png')); shot = True
            pg.wait_for_timeout(110)
        check(len(spots) > 3 and pressed, f'{game}: the see-through hand moves and presses ({len(spots)} spots)')
        check(acted, f'{game}: the game really plays in the demo ({game} did something)')
        pg.wait_for_function('__showMe().ending', timeout=12000)
        check(pg.locator('.ar-demo.done .ar-demo-turn').is_visible(), f'{game}: "Your turn!" shows at the end')
        pg.screenshot(path=str(OUT / f'{game}_turn.png'))
        t0 = pg.evaluate('__game.time'); pg.wait_for_timeout(400)
        check(pg.evaluate('__game.time') == t0 or not demo(pg)['on'], f'{game}: the game waits while "Your turn!" shows')
        pg.wait_for_function('!__showMe().on', timeout=5000); pg.wait_for_timeout(200)
        s = pg.evaluate(hook)
        check(pg.evaluate('__game.state') == 'play' and pg.evaluate('__game.time') < 1.5 and not did(s),
              f'{game}: then the round starts fresh')
        check(pg.locator('.ar-demo').count() == 0 and not pg.evaluate('__game.demo'), f'{game}: the hand is gone')
        check(pg.evaluate(SAVES) == saves, f'{game}: nothing the demo did was saved')
        check(demo(pg)['seen'], f'{game}: remembered as seen (for this player)')
        # Pause -> Show me; a tap skips it
        pg.keyboard.press('Escape'); cm.wait_screen(pg, 'pause')
        check(cm.find(pg, 'showme') is not None, f'{game}: the Pause screen has a Show me button')
        cm.tap(pg, 'showme'); pg.wait_for_timeout(700)
        check(demo(pg)['on'] and not pg.evaluate('ArcadeMenus.isOpen'), f'{game}: Show me (pause) plays the demo')
        pg.touchscreen.tap(500, 300); pg.wait_for_timeout(150)
        check(demo(pg)['ending'], f'{game}: a tap skips to "Your turn!"')
        pg.wait_for_function('!__showMe().on', timeout=3000)
        check(pg.evaluate('__game.state') == 'play', f'{game}: and the game goes')
        # a key skips it too, and isn't a game key
        pg.evaluate('__game.showMe()'); pg.wait_for_timeout(300)
        pg.keyboard.press('Space'); pg.wait_for_timeout(100)
        check(demo(pg)['ending'], f'{game}: a key skips it too')
        pg.wait_for_function('!__showMe().on', timeout=3000)
        # 2nd time: no demo by itself; the Help screen has Show me
        pg.reload(); pg.wait_for_timeout(800); cm.to_title(pg); pg.wait_for_timeout(400)
        cm.tap(pg, 'help'); cm.wait_screen(pg, 'help')
        check(cm.find(pg, 'showme') is not None, f'{game}: the Help screen has a Show me button')
        cm.tap(pg, 'ok'); cm.wait_screen(pg, 'title')
        cm.tap(pg, 'start'); pg.wait_for_timeout(400)
        check(not demo(pg)['on'] and pg.evaluate('__game.state') == 'play', f'{game}: the 2nd time Play goes straight in')
        ctx.close()
        # Help -> Show me, on a fresh player
        ctx, pg = open_game(b, game, flag=False)
        cm.tap(pg, 'help'); cm.wait_screen(pg, 'help'); cm.tap(pg, 'showme'); pg.wait_for_timeout(600)
        check(demo(pg)['on'] and pg.evaluate('__game.state') == 'play', f'{game}: Show me (help) plays the demo')
        ctx.close()
    # robots (headless tests) never get it by themselves
    ctx, pg = open_game(b, 'hoops', flag=False)
    cm.tap(pg, 'start'); pg.wait_for_timeout(400)
    check(not demo(pg)['on'], 'headless tests without the flag: no demo by itself')
    ctx.close()
    # a phone held sideways: the hand + "Your turn!" fit
    if not only or 'hoops' in only:
        ctx, pg = open_game(b, 'hoops', vp=(740, 360), mobile=True)
        cm.tap(pg, 'start', touch=True); pg.wait_for_timeout(1800)
        pg.screenshot(path=str(OUT / 'phone.png'))
        h = demo(pg)['hand']
        check(h is not None and 0 <= h['x'] <= 740 and 0 <= h['y'] <= 360, f'phone: the hand is on the screen ({h})')
        pg.wait_for_function('__showMe().ending', timeout=12000)
        box = pg.evaluate("(() => { const r = document.querySelector('.ar-demo-turn').getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; })()")
        check(box[0] >= 0 and box[1] >= 0 and box[2] <= 740 and box[3] <= 360, f'phone: "Your turn!" fits ({box})')
        pg.screenshot(path=str(OUT / 'phone_turn.png'))
        ctx.close()
    b.close()
if errors: print('JS errors:', errors[:5])
print(f'{len(fails)} failed' if fails else 'ALL PASSED')
sys.exit(1 if fails or errors else 0)
