"""Automated test: a steady frame rate on older tablets (Nov 24, the new plan's point 9, part 2).

Run from the repo folder:   python3 tests/test_frames.py            (~2 min)
                            python3 tests/test_frames.py hoops      (the budget part for just these games)
  1. The kit counts how long the game's own drawing takes (`Arcade.perf.cost()`; tools/frametime.py prints a table).
  2. Lite drawing kicks in after a few SECONDS of slow play in a row (a hiccup isn't enough) (it used to wait for 150 slow frames: 15 s of jerky
     play on a tablet that managed 10 a second), and in lite the game's canvas skips glows (shadowBlur).
  3. `Arcade.draw.layer()` copies only the painted rows of a still layer, and the picture comes out the same.
  4. Hoop Heroes (the slowest game before) paints each machine's cage once and copies it after that.
  5. Every arcade game draws one playing picture (painting included) within a budget, so a game that gets much
     slower fails here. (The budget is generous: test computers paint without a graphics chip.)
  6. No JavaScript errors.
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / 'tools'))
from playwright.sync_api import sync_playwright
import cmenu as cm
import frametime

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what, flush=True)
    if not ok: fails.append(what)

BUDGET = 45        # ms for one picture at 1280 x 800 (they're about 5-20 ms on a normal computer)
want = sys.argv[1:]

with sync_playwright() as pw:
    if not want:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={'width': 1280, 'height': 800})
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.goto((ROOT / 'hoops' / 'index.html').as_uri())
        pg.evaluate('localStorage.clear()'); pg.reload()
        cm.to_title(pg); cm.tap(pg, 'start'); cm.into_game(pg)
        pg.wait_for_function("__game.state === 'play'", timeout=8000)

        # ---- 1. the counters ----
        pg.evaluate('Arcade.perf.reset()'); pg.wait_for_timeout(1200)
        c = pg.evaluate('Arcade.perf.cost()')
        check(c['draws'] > 20 and 0 < c['draw'] < 200, f"the kit times the game's drawing ({c['draws']} pictures, {c['draw']:.1f} ms each)")
        check(c['step'] >= 0 and c['worst'] >= c['draw'], f"... and its game steps ({c['step']:.3f} ms) + the worst picture ({c['worst']:.1f} ms)")

        # ---- 4. Hoop Heroes: each machine's cage is painted once ----
        n = len(pg.evaluate('__hoopsScene.cages()'))
        pg.wait_for_timeout(800)
        check(n >= 3 and len(pg.evaluate('__hoopsScene.cages()')) == n, f'hoops: the 3 cages are painted once and then copied ({n})')
        pg.screenshot(path=str(OUT / 'frames-hoops.png'))

        # ---- 2. lite drawing after a few slow seconds; no glows while lite ----
        check(pg.evaluate('__game.lite()') == 0 and pg.evaluate('__game.glows()'), 'a quick computer draws sharp, with glows')
        # make every picture slow (~60 ms: about 15 a second, like an old tablet) by waiting inside the drawing
        pg.evaluate('''() => { const o = CanvasRenderingContext2D.prototype.save;
          CanvasRenderingContext2D.prototype.save = function () {
            if (window.__slow && window.__slowF !== Arcade.perf.frames && this.canvas === document.querySelector('.ar-stage canvas')) {
              window.__slowF = Arcade.perf.frames;                               // (once a picture)
              const e = performance.now() + 60; while (performance.now() < e); }
            return o.apply(this, arguments); }; window.__slow = true; }''')
        pg.wait_for_timeout(1200); pg.evaluate('window.__slow = false'); pg.wait_for_timeout(1500)
        check(pg.evaluate('__game.lite()') == 0, 'a slow moment (about a second) is not enough for lite drawing')
        pg.evaluate('window.__slow = true; window.__t0 = performance.now()')
        try:
            pg.wait_for_function('__game.lite() >= 1', timeout=9000); t = pg.evaluate('(performance.now() - __t0) / 1000')
        except Exception:
            t = 99
        check(t < 6, f'slow pictures switch to lite drawing within a few seconds ({t:.1f} s; it used to take 150 slow frames)')
        g = pg.evaluate("(() => { const c = document.querySelector('.ar-stage canvas').getContext('2d'); c.shadowBlur = 20; return [__game.glows(), c.shadowBlur]; })()")
        check(g == [False, 0], f'in lite the game canvas skips glows ({g})')
        pg.evaluate('window.__slow = false; __game.setLite(0)')
        g = pg.evaluate("(() => { const c = document.querySelector('.ar-stage canvas').getContext('2d'); c.shadowBlur = 20; const v = c.shadowBlur; c.shadowBlur = 0; return [__game.glows(), v]; })()")
        check(g == [True, 20], f'back to sharp: glows again ({g})')
        pg.screenshot(path=str(OUT / 'frames-hoops-sharp.png'))

        # ---- 3. Arcade.draw.layer: only the painted rows, the same picture ----
        r = pg.evaluate('''() => {
          const mk = () => { const c = document.createElement('canvas'); c.width = 400; c.height = 300; return c; };
          const L = mk(), x = L.getContext('2d');
          x.fillStyle = '#3a7'; x.beginPath(); x.ellipse(200, 150, 180, 40, 0, 0, 7); x.fill();
          x.fillStyle = '#f00'; x.fillRect(30, 108, 4, 2);                      // (a tiny bit at the top edge)
          const b = Arcade.draw.band(L);
          const A = mk(), B = mk(), a = A.getContext('2d'), bb = B.getContext('2d');
          for (const c of [a, bb]) { c.fillStyle = '#88ccff'; c.fillRect(0, 0, 400, 300); }
          a.drawImage(L, 10, 5, 380, 285); Arcade.draw.layer(bb, L, 10, 5, 380, 285);
          const p = a.getImageData(0, 0, 400, 300).data, q = bb.getImageData(0, 0, 400, 300).data;
          let d = 0; for (let i = 0; i < p.length; i++) d = Math.max(d, Math.abs(p[i] - q[i]));
          const E = mk();                                                       // (an empty layer copies nothing)
          return { y0: b.y0, y1: b.y1, diff: d, empty: Arcade.draw.band(E) };
        }''')
        check(106 <= r['y0'] <= 108 and 190 <= r['y1'] <= 193, f"draw.band finds the painted rows ({r['y0']}..{r['y1']}, painted 108..190)")
        check(r['diff'] <= 2, f"draw.layer gives the same picture as copying the whole layer (biggest difference {r['diff']})")
        check(r['empty']['y1'] == 0, 'an empty layer has no rows to copy')
        b.close()

    # ---- 5. every game within the drawing budget ----
    for game in (want or frametime.GAMES):
        try: c = frametime.measure(pw, game, 1, {'width': 1280, 'height': 800}, secs=2.5)
        except Exception as e:
            check(False, f'{game}: could not measure ({str(e)[:80]})'); continue
        check(c['draw'] < BUDGET, f"{game}: one playing picture takes {c['draw']:.1f} ms (budget {BUDGET} ms; worst {c['worst']:.0f} ms)")
        errors += [f'{game}: {e}' for e in c['errors']]

check(not errors, f'no JavaScript errors ({errors[:3]})')
print(f'\n{len(fails)} failed' if fails else '\nAll passed')
sys.exit(1 if fails else 0)
