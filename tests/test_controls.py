"""The controls card pops up every time a game starts (Keith, Nov 20: "each game should have the controls pop up
when you hit go"). For every kit game: hit Play the way a child does -> the how-to pictures show, the game waits,
one tap closes the card and the game runs. "Start over" doesn't show it again. Screenshots in tests/out/controls/.
Run: python3 tests/test_controls.py   (or: python3 tests/test_controls.py hoops rc)
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu as cm
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out' / 'controls'; OUT.mkdir(parents=True, exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

GAMES = ['bike', 'rc', 'hoops', 'golf', 'archery', 'jungle', 'trail', 'quest', 'space', 'abc', 'fishing', 'piano']
only = sys.argv[1:]
if only: GAMES = [g for g in GAMES if g in only]
state = "__game.state"
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for game in GAMES:
        ctx = b.new_context(viewport={'width': 1000, 'height': 600}, has_touch=True); pg = ctx.new_page()
        pg.on('pageerror', lambda e, gm=game: errors.append(f'{gm}: {e}'))
        pg.goto((ROOT / game / 'index.html').as_uri())
        pg.evaluate("localStorage.clear(); localStorage.setItem('kidsArcade.testControls', '1')"); pg.reload(); pg.wait_for_timeout(800)
        # hit Play like a child
        if game == 'rc':                                              # (RC has its own menu: Free Play -> a track)
            pg.mouse.click(500, 300); pg.wait_for_timeout(800)
            pg.click('[data-menu=free]'); pg.wait_for_timeout(400)
            pg.locator('[data-track]').first.click(); pg.wait_for_timeout(500)
        elif cm.is_canvas(pg):
            cm.to_title(pg); pg.wait_for_timeout(600); cm.tap(pg, 'start')
        else:
            pg.mouse.click(500, 300); pg.wait_for_timeout(800)
            for _ in range(4):
                if pg.evaluate(state) == 'play': break
                start = pg.locator('[data-start]:visible, .ar-btn.big:visible').first
                if start.count(): start.evaluate('b => b.click()')
                else: pg.keyboard.press('Enter')
                pg.wait_for_timeout(700)
        pg.wait_for_timeout(500)
        if game == 'quest':                                             # (Potion Quest: the card comes after "Pick your hero")
            check(pg.locator('.ar-controls').count() == 0, 'quest: no card over "Pick your hero"')
            pg.evaluate('__questPick(0)'); pg.wait_for_timeout(300)
        shown = pg.locator('.ar-controls').count() == 1
        check(pg.evaluate(state) == 'play' and shown, f'{game}: the controls card pops up when Play is hit')
        if not shown: pg.screenshot(path=str(OUT / f'{game}_none.png')); ctx.close(); continue
        pg.screenshot(path=str(OUT / f'{game}.png'))
        t0 = pg.evaluate('__game.time'); pg.wait_for_timeout(800)
        check(pg.evaluate('__game.time') == t0, f'{game}: the game waits while the card is up')
        pics = pg.evaluate("document.querySelectorAll('.ar-controls .ar-step').length")
        check(pics >= 1, f'{game}: the card shows the how-to pictures ({pics})')
        box = pg.evaluate("(() => { const b = document.querySelector('.ar-ctl-box'), r = b.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth && b.scrollHeight <= b.clientHeight + 2; })()")
        check(box, f'{game}: the card fits on the screen')
        pg.touchscreen.tap(500, 300); pg.wait_for_timeout(700)
        check(pg.locator('.ar-controls').count() == 0 and pg.evaluate('__game.time') > t0, f'{game}: one tap closes it and the game goes')
        pg.evaluate('__game.restart()'); pg.wait_for_timeout(300)
        check(pg.locator('.ar-controls').count() == 0, f'{game}: "Start over" goes straight back to playing')
        pg.keyboard.press('Escape'); pg.wait_for_timeout(500); pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
        check(pg.evaluate(state) == 'play' and pg.locator('.ar-controls').count() == 0, f'{game}: pause + keep playing: no card')
        ctx.close()
    # a small phone sideways: the card still fits
    ctx = b.new_context(viewport={'width': 568, 'height': 320}, has_touch=True, is_mobile=True); pg = ctx.new_page()
    pg.goto((ROOT / 'hoops' / 'index.html').as_uri()); pg.evaluate("localStorage.clear(); localStorage.setItem('kidsArcade.testControls', '1')"); pg.reload(); pg.wait_for_timeout(800)
    cm.to_title(pg); pg.wait_for_timeout(600); cm.tap(pg, 'start'); pg.wait_for_timeout(600)
    fits = pg.evaluate("(() => { const b = document.querySelector('.ar-ctl-box'); if (!b) return false; const r = b.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight + 1 && r.right <= innerWidth + 1 && b.scrollHeight <= b.clientHeight + 2; })()")
    check(fits, 'small phone: the controls card fits')
    pg.screenshot(path=str(OUT / 'phone.png')); ctx.close()
    b.close()
if errors: print('JS errors:', errors[:5])
print(f'{len(fails)} failed' if fails else 'ALL PASSED')
sys.exit(1 if fails or errors else 0)
