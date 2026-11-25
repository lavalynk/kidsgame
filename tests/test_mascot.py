"""Automated test: Bop, the hub's mascot (Nov 25, new plan point 10, part 1).

Run from the repo folder:   python3 tests/test_mascot.py
Checks, on the canvas hub:
  * Bop stands next to the logo (attr 'mascot'), waves hello when the arcade opens, then points at a speech
    bubble with today's surprise present in it; he blinks now and then
  * drawing the hub again (hearts on + off) doesn't make him say hello again: he just stands there pointing
  * tapping him opens the Daily Surprise screen ('hub-daily'); closing it brings the hub back
  * heart mode and a phone held sideways (no room) have no Bop; upright phone + tablet do, and he fits
  * once today's surprise is done, the bubble shows the opened present
  * Calm motion: no hello wave, he's already pointing, nothing blinks or bobs
  * a hub with Bop on it is still a resting menu (pacing: not drawn every frame)
Screenshots: tests/out/mascot-*.png
"""
import pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from playwright.sync_api import sync_playwright
import cmenu

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
URL = (ROOT / 'index.html').as_uri()
errors, fails = [], []

def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

def bop(pg):
    return pg.evaluate('__hubState().mascot')

def fresh(b, vp, calm=False):
    ctx = b.new_context(viewport=vp, reduced_motion='reduce' if calm else 'no-preference')
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(URL)
    pg.evaluate('() => { localStorage.clear(); sessionStorage.clear(); }')
    pg.reload()
    cmenu.wait_screen(pg, 'hub')
    return ctx, pg

def wait_for(pg, js, ms=12000):
    try:
        pg.wait_for_function(js, timeout=ms); return True
    except Exception:
        return False

with sync_playwright() as pw:
    b = pw.chromium.launch()

    # ---- desktop: hello, point, blink ----
    ctx, pg = fresh(b, {'width': 1280, 'height': 860})
    it = cmenu.find(pg, 'mascot')
    check(it is not None and it['shown'], 'Bop is on the hub, in sight')
    check(it and it['w'] >= 70 and it['h'] >= 70, f'Bop is big enough to tap ({it and round(it["w"])} x {it and round(it["h"])})')
    logo = pg.evaluate("ArcadeMenus.current().rows[0]")
    check(logo['t'] == 'mascot' and logo['hello'] and 'svg' in logo['bubble'], 'the top row = the logo + Bop, saying hello, with a bubble')
    check(wait_for(pg, '__hubState().mascot.waves >= 1'), 'he waves hello')
    check(wait_for(pg, '__hubState().mascot.pointing && __hubState().mascot.bubble'), 'then he points at the bubble with the present')
    check(wait_for(pg, '__hubState().mascot.blinks >= 1', 8000), 'he blinks')
    pg.wait_for_timeout(1500)
    pace = pg.evaluate('ArcadeMenus.pacing()')
    check(not pace['quick'], f'the hub with Bop on it is a resting menu ({pace})')
    pg.screenshot(path=str(OUT / 'mascot-desktop.png'))

    # drawing the hub again: no new hello
    waves = bop(pg)['waves']
    pg.evaluate("ArcadeMenus.tap('who')"); cmenu.wait_screen(pg, 'hub-players')
    pg.evaluate("ArcadeMenus.tap('hearts')"); cmenu.wait_screen(pg, 'hub')
    check(cmenu.find(pg, 'mascot') is None, 'heart mode: no Bop (just the games)')
    pg.evaluate("ArcadeMenus.tap('hearts')"); pg.wait_for_timeout(600)
    check(cmenu.find(pg, 'mascot') is not None, 'back from heart mode: Bop is there again')
    check(not pg.evaluate("ArcadeMenus.current().rows[0].hello"), 'and he doesn\'t say hello again')
    check(bop(pg)['waves'] == waves and bop(pg)['pointing'], 'he just stands there pointing (no new wave)')

    # tap him: the surprise screen
    cmenu.tap(pg, 'mascot'); pg.wait_for_timeout(500)
    cmenu.wait_screen(pg, 'hub-daily')
    check(pg.evaluate('ArcadeMenus.screen()') == 'hub-daily', 'tapping Bop opens the Daily Surprise screen')
    check(bop(pg)['waves'] > waves, 'he waves when tapped')
    cmenu.tap(pg, 'close'); cmenu.wait_screen(pg, 'hub')
    check(cmenu.find(pg, 'mascot') is not None, 'closing it: back on the hub with Bop')

    # surprise done: the bubble holds the opened present
    pg.evaluate('''() => { const d = Arcade.store.load(); Arcade.daily.today(); d.daily.done = true; Arcade.store.save(); }''')
    pg.reload(); cmenu.wait_screen(pg, 'hub')
    open_gift = pg.evaluate("Arcade.mascot.bubble(Arcade.daily.gift(true))")
    check(pg.evaluate("ArcadeMenus.current().rows[0].bubble") == open_gift, 'surprise done: the bubble shows the opened present')
    ctx.close()

    # ---- phone + tablet sizes ----
    for name, vp, want in [('phone', {'width': 390, 'height': 844}, True), ('tablet', {'width': 820, 'height': 1180}, True),
                           ('phone-side', {'width': 844, 'height': 390}, False)]:
        ctx, pg = fresh(b, vp)
        it = cmenu.find(pg, 'mascot')
        check((it is not None) == want, f'{name}: Bop {"is" if want else "is not"} on the hub')
        if it:
            check(it['x'] >= 0 and it['x'] + it['w'] <= vp['width'] and it['y'] >= 0, f'{name}: Bop fits on the screen')
            wait_for(pg, '__hubState().mascot.pointing')
        pg.screenshot(path=str(OUT / f'mascot-{name}.png'))
        ctx.close()

    # ---- Calm motion ----
    ctx, pg = fresh(b, {'width': 1280, 'height': 860}, calm=True)
    pg.wait_for_timeout(4500)
    st = bop(pg)
    check(st['pointing'] and st['bubble'], 'Calm motion: Bop is already pointing at the bubble')
    check(st['waves'] == 0 and st['blinks'] == 0, f'Calm motion: no waving, no blinking ({st})')
    ctx.close()
    b.close()

check(not errors, f'no JavaScript errors ({errors[:3]})')
print('\nAll passed' if not fails else f'\n{len(fails)} FAILED')
sys.exit(1 if fails else 0)
