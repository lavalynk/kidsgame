"""Automated test: the speed test (Nov 24, the new plan's point 9 "faster and smoother everywhere").

Run from the repo folder:   python3 tests/test_speed.py            (every page, ~3 min)
                            python3 tests/test_speed.py hub jungle  (just these)
It fails when a page gets slow or busy for nothing:
  1. The big library files stay small: Rex UI is our own small build (tools/make_rexui.py: only the 7 menu parts
     the arcade uses, was 844 KB), Phaser is the build without the unused "Matter" physics, and no page loads
     Swiper at the start (only the Sticker Book's fallback needs it, and loads it itself).
  2. Every page shows its first menu quickly (over a little web server, like GitHub Pages; the time per page
     is printed so a slow-down is easy to spot). The limit is generous: test computers are slow too.
  3. A still menu draws at most about 30 pictures a second, not 60+ (canvasmenu.js "Pacing"), but every frame
     while a finger is down, about 10 a second after nobody touched it for a while (the nap); a PAUSED game draws its
     picture about once a second; a game behind its title menu not at all (the title screen covers it);
     a game being played every frame (shared.js, the loop). Counters: `Arcade.perf` (draws, menuFrames).
  4. Nothing broke: no JavaScript errors anywhere.
Headless Chromium draws at about 60 frames a second, which is what these numbers assume.
"""
import functools, http.server, pathlib, re, sys, threading, time
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from playwright.sync_api import sync_playwright
import cmenu

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []

def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what, flush=True)
    if not ok: fails.append(what)

# ---- 1. the library files ----
KB = lambda f: (ROOT / 'arcade' / f).stat().st_size // 1024
check(KB('rexui.min.js') < 400, f'Rex UI is the small build ({KB("rexui.min.js")} KB, the full one was 824 KB)')
check(KB('phaser.min.js') < 1060, f'Phaser is the build without Matter physics ({KB("phaser.min.js")} KB, the full one was 1154 KB)')
pages = sorted(p.parent.name for p in ROOT.glob('*/index.html') if p.parent.name not in ('tests', 'art', 'tools'))
loaders = [p for p in pages if 'swiper.min.js' in (ROOT / p / 'index.html').read_text()]
check(not loaders, f'no page loads Swiper at the start ({loaders})')

# ---- a little web server (like GitHub Pages) ----
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{srv.server_address[1]}/'

ALL = ['hub'] + [p for p in pages if p not in ('art',)]
want = sys.argv[1:] or ALL
LIMIT = 6.0          # seconds until the first menu shows (it's well under 1 s on a normal computer)

def share(pg, sec=1.5):
    """Of the kit loop's turns (one per screen refresh), the part that drew the game picture (1.0 = every frame).
    (A share, not a count, so a busy test computer that manages fewer frames doesn't make it fail.)"""
    a = pg.evaluate('[Arcade.perf.frames, Arcade.perf.draws]'); pg.wait_for_timeout(int(sec * 1000))
    b = pg.evaluate('[Arcade.perf.frames, Arcade.perf.draws]')
    return (b[1] - a[1]) / max(1, b[0] - a[0])

def rate(pg, key, sec=2.0):
    """How many times a second `Arcade.perf[key]` goes up."""
    a = pg.evaluate(f'Arcade.perf.{key}'); pg.wait_for_timeout(int(sec * 1000)); b = pg.evaluate(f'Arcade.perf.{key}')
    return (b - a) / sec

with sync_playwright() as pw:
    br = pw.chromium.launch()

    # ---- 2. every page opens quickly ----
    for name in want:
        ctx = br.new_context(viewport={'width': 1024, 'height': 768}, service_workers='block')
        pg = ctx.new_page()
        pg.on('pageerror', lambda e, n=name: errors.append(f'{n}: {e}'))
        t0 = time.time()
        pg.goto(BASE if name == 'hub' else BASE + name + '/')
        try:
            # (the first menu: a canvas screen; the maze starts straight in a maze, the Sticker Book / My House on their page)
            pg.wait_for_function("(window.ArcadeMenus && ArcadeMenus.isOpen && ArcadeMenus.list().length > 0) || (window.__mazeState && __mazeState())",
                                 timeout=int(LIMIT * 2000))
            took = time.time() - t0
        except Exception:
            took = 99
        check(took < LIMIT, f'{name}: the first menu shows in {took:.2f} s (limit {LIMIT} s)')
        ctx.close()

    # ---- 3. a still menu / a paused game isn't busy for nothing ----
    if not sys.argv[1:] or 'hub' in want:
        ctx = br.new_context(viewport={'width': 1024, 'height': 768})
        pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(f'hub: {e}'))
        pg.goto(BASE); cmenu.wait_screen(pg, 'hub'); pg.wait_for_timeout(2000)    # (past the pop-in)
        # (headless Chromium paints Phaser's WebGL without a graphics chip, so a big menu may manage fewer than 30
        #  pictures a second here anyway: the test checks the pacing's choice + that it never goes above ~30)
        r = rate(pg, 'menuFrames')
        check(r <= 40 and pg.evaluate('ArcadeMenus.pacing().quick') is False, f'hub: the still menu is paced to at most ~30 pictures a second ({r:.0f})')
        it = cmenu.find(pg, 'game-hoops')
        pg.mouse.move(it['x'] + 4, it['y'] - 30); pg.mouse.down()               # (a finger down on the menu, off any tile)
        pg.wait_for_timeout(1200)
        check(pg.evaluate('ArcadeMenus.pacing().quick') is True, 'hub: with a finger down the menu draws every frame')
        pg.mouse.up(); pg.wait_for_timeout(1500)
        check(pg.evaluate('ArcadeMenus.pacing().quick') is False, 'hub: a little after the finger lifts it is paced again')
        # the nap: nobody touches the menu for a while (40 s; here 1 s) -> about 10 pictures a second; a touch wakes it,
        # and a tap on a napping menu still works the first time
        pg.mouse.move(2, 2); pg.evaluate('ArcadeMenus.napAfter = 1000'); pg.wait_for_timeout(1800)
        check(pg.evaluate('ArcadeMenus.pacing().napping') is True, 'hub: an untouched menu naps')
        r = rate(pg, 'menuFrames')
        check(r <= 13, f'hub: a napping menu draws about 10 pictures a second ({r:.0f})')
        pg.evaluate('ArcadeMenus.napAfter = 60000')
        cmenu.tap(pg, 'who')
        try: cmenu.wait_screen(pg, 'hub-players', timeout=3000); ok = True
        except Exception: ok = False
        check(ok and pg.evaluate('ArcadeMenus.pacing().napping') is False, f'hub: a tap wakes it and works at once ({cmenu.screen(pg)!r})')
        ctx.close()

    if not sys.argv[1:] or 'hoops' in want:
        ctx = br.new_context(viewport={'width': 1024, 'height': 768})
        pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(f'hoops: {e}'))
        pg.goto(BASE + 'hoops/'); cmenu.to_title(pg); pg.wait_for_timeout(1800)
        r = rate(pg, 'draws')
        check(r == 0 and pg.evaluate('ArcadeMenus.covers()'), f'hoops: behind the title menu (it covers the game) the game is not drawn at all ({r:.0f})')
        cmenu.tap(pg, 'start'); cmenu.into_game(pg)
        pg.wait_for_function("__game.state === 'play'", timeout=8000)
        r = share(pg)
        check(r >= 0.97, f'hoops: while playing the game is drawn every frame ({r:.2f} of the frames)')
        pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
        check(pg.evaluate('__game.state') == 'paused', 'hoops: Escape pauses')
        pg.wait_for_timeout(1500)
        r = rate(pg, 'draws', 3.0)
        check(r <= 2, f'hoops: a paused game is drawn about once a second ({r:.1f})')
        pg.wait_for_timeout(1500)
        r = rate(pg, 'menuFrames')
        check(r <= 40 and pg.evaluate('ArcadeMenus.pacing().quick') is False, f'hoops: the still pause menu is paced to at most ~30 a second ({r:.0f})')
        # a resize while paused: drawn again at once (a resized canvas is blank)
        a = pg.evaluate('Arcade.perf.draws'); pg.set_viewport_size({'width': 900, 'height': 700}); pg.wait_for_timeout(250)
        check(pg.evaluate('Arcade.perf.draws') > a, 'hoops: a resize while paused draws the game again at once')
        pg.screenshot(path=str(OUT / 'speed-hoops-paused.png'))
        pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
        check(pg.evaluate('__game.state') == 'play', 'hoops: Escape again plays on')
        r = share(pg, 1.0)
        check(r >= 0.97, f'hoops: playing again = every frame ({r:.2f} of the frames)')
        ctx.close()

    # ---- the Sticker Book's fallback (no Phaser) still gets Swiper, loaded when it's needed ----
    if not sys.argv[1:] or 'stickers' in want:
        ctx = br.new_context(viewport={'width': 1024, 'height': 768}, service_workers='block')
        ctx.route(re.compile(r'.*phaser\.min\.js.*'), lambda route: route.abort())
        pg = ctx.new_page()          # (no error check here: Rex UI can't load without Phaser, that's expected)
        pg.goto(BASE + 'stickers/')
        try:
            pg.wait_for_function('!!window.Swiper && document.querySelector(".swiper-initialized")', timeout=8000); ok = True
        except Exception: ok = False
        check(ok, 'stickers: without Phaser the HTML book loads Swiper by itself and turns pages')
        ctx.close()
    br.close()

check(not errors, f'no JavaScript errors ({errors[:3]})')
print(f'\n{len(fails)} failed' if fails else '\nAll passed')
sys.exit(1 if fails else 0)
