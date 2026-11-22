"""Automated test: living backgrounds in Jungle Jump + Treasure Trail (new plan point 2, part 2, Nov 22).

Run:  python3 tests/test_living_scenery.py
Jungle Jump, every level:
  * the background draws, slides with the camera (parallax) and moves by itself (clouds + floaters)
  * every painted strip joins up with itself (no thin line where two copies meet)
  * the 2nd level of a world has its time of day (Treetop Trail evening, Windy Peak dawn, Jelly Hills twilight)
    and looks different from the 1st level
Treasure Trail, every adventure:
  * the background draws and moves by itself; Sunset Swamp gets darker room by room
Both: in Calm motion the background stands still, and drawing it stays quick.
Then plays Treetop Trail (desktop) and Sunset Swamp (phone, sideways) for a few seconds: no errors.
Screenshots: tests/out/scenery-*.png (look at them all with tools/preview_jungle_scenery.py + preview_trail_scenery.py).
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

def fresh(pg, game, calm=False):
    pg.goto((ROOT / game / 'index.html').as_uri())
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': 'big'}]}
    pg.evaluate("([p, c]) => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p);"
                " if (c) localStorage.setItem('kidsArcade.parent', JSON.stringify({ motion: 'calm' })); }", [json.dumps(prof), calm])
    pg.reload()
    pg.wait_for_function('window.__jungleScene' if game == 'jungle' else 'window.__trailScene')

# draw one background into a canvas; returns sampled pixels (+ the average brightness last)
def DRAW(hook):
    return r'''([a, b, c, bg]) => {
  const S = window.%s, cv = document.createElement('canvas'); cv.width = S.W; cv.height = S.H; const x = cv.getContext('2d');
  S.draw(x, a, b, c, 0, bg);
  const d = x.getImageData(0, 0, S.W, S.H).data, out = []; let sum = 0, n = 0;
  for (let i = 0; i < d.length; i += 4 * 53) { out.push(d[i], d[i + 1], d[i + 2]); sum += d[i] + d[i + 1] + d[i + 2]; n++; }
  out.push(sum / n / 3); return out;
}''' % hook
JD, TD = DRAW('__jungleScene'), DRAW('__trailScene')
def diff(a, b): return sum(abs(x - y) for x, y in zip(a[:-1], b[:-1])) / (len(a) - 1)

with sync_playwright() as pw:
    br = pw.chromium.launch()
    pg = br.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('pageerror', lambda e: errors.append(str(e)))

    # ---------------- Jungle Jump ----------------
    fresh(pg, 'jungle')
    levels = pg.evaluate('__jungleScene.levels')
    check(len(levels) == 8, f'Jungle Jump: 8 levels ({[l["id"] for l in levels]})')
    times = {l['id']: l['time'] for l in levels}
    check(times.get('forest2') == 'evening' and times.get('snow2') == 'dawn' and times.get('candy2') == 'twilight',
          f'times of day on the 2nd levels ({times})')
    for l in levels:
        a = pg.evaluate(JD, [l['id'], 900, 2.0])
        moved = pg.evaluate(JD, [l['id'], 1150, 2.0])
        check(diff(a, moved) > 1, f"jungle {l['id']}: the scenery slides with the camera ({diff(a, moved):.1f})")
        later = pg.evaluate(JD, [l['id'], 900, 4.5])
        check(diff(a, later) > (0.1 if l['world'] == 'cave' else 0.2), f"jungle {l['id']}: clouds / floaters move by themselves ({diff(a, later):.2f})")
    # every painted strip joins up with itself: its first and last pixel columns match
    seams = pg.evaluate('''() => {
      const out = {};
      for (const k of __jungleScene.cached()) {
        const c = __jungleScene.canvas(k), x = c.getContext('2d');
        const L = x.getImageData(0, 0, 1, c.height).data, R = x.getImageData(c.width - 1, 0, 1, c.height).data;
        let s = 0; for (let i = 0; i < L.length; i++) s += Math.abs(L[i] - R[i]); out[k] = s / L.length;
      }
      return out; }''')
    bad = {k: round(v, 1) for k, v in seams.items() if v > 12}
    check(len(seams) >= 20 and not bad, f'jungle: all {len(seams)} strips join up with themselves (bad: {bad})')
    for one, two in (('forest', 'forest2'), ('snow', 'snow2'), ('candy', 'candy2')):
        d1, d2 = pg.evaluate(JD, [one, 0, 1.0]), pg.evaluate(JD, [two, 0, 1.0])
        check(diff(d1, d2) > 12, f'jungle {two} ({times[two]}) looks different from {one} ({diff(d1, d2):.1f})')
    ms = pg.evaluate('''() => { const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const x = c.getContext('2d'); x.scale(2, 2);
      __jungleScene.draw(x, 'forest2', 0, 1); const t0 = performance.now();
      for (let i = 0; i < 120; i++) __jungleScene.draw(x, 'forest2', i * 9, i / 30);
      return (performance.now() - t0) / 120; }''')
    check(ms < 10, f'jungle: drawing the background is quick ({ms:.2f} ms a frame)')

    # ---------------- Treasure Trail ----------------
    fresh(pg, 'trail')
    advs = pg.evaluate('__trailScene.adventures')
    check(len(advs) == 4, f'Treasure Trail: 4 adventures ({[a["id"] for a in advs]})')
    for a in advs:
        d1 = pg.evaluate(TD, [a['id'], 0, 2.0]); d2 = pg.evaluate(TD, [a['id'], 0, 4.5])
        check(diff(d1, d2) > 0.15, f"trail {a['id']}: clouds / floaters move by themselves ({diff(d1, d2):.2f})")
    sw = next(a for a in advs if a['id'] == 'dusk')
    bright = [pg.evaluate(TD, ['dusk', r, 1.0])[-1] for r in (0, sw['rooms'] // 2, sw['rooms'] - 1)]
    check(bright[0] > bright[1] > bright[2], f'Sunset Swamp gets darker room by room ({[round(b) for b in bright]})')
    river = pg.evaluate(TD, ['river', 0, 1.0])[-1]
    check(abs(river - pg.evaluate(TD, ['river', 5, 1.0])[-1]) < 12, 'River Run stays daytime all the way')
    ms = pg.evaluate('''() => { const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const x = c.getContext('2d'); x.scale(2, 2);
      __trailScene.draw(x, 'dusk', 9, 1); const t0 = performance.now();
      for (let i = 0; i < 60; i++) __trailScene.draw(x, 'dusk', 9, i / 30);
      return (performance.now() - t0) / 60; }''')
    check(ms < 14, f'trail: drawing a room is quick ({ms:.2f} ms a frame)')

    # ---------------- Calm motion: nothing moves by itself ----------------
    fresh(pg, 'jungle', calm=True)
    for lid in ('forest', 'forest2', 'cave', 'snow2', 'candy2'):
        a = pg.evaluate(JD, [lid, 500, 1.0]); b = pg.evaluate(JD, [lid, 500, 5.0])
        check(diff(a, b) == 0, f'jungle {lid}: in Calm motion the background stands still ({diff(a, b):.2f})')
    fresh(pg, 'trail', calm=True)
    for aid in ('river', 'deep', 'temple', 'dusk'):
        a = pg.evaluate(TD, [aid, 2, 1.0, True]); b = pg.evaluate(TD, [aid, 2, 5.0, True])
        check(diff(a, b) == 0, f'trail {aid}: in Calm motion the background stands still ({diff(a, b):.2f})')

    # ---------------- really playing ----------------
    def play(page, game, expr, name, key='ArrowRight'):
        fresh(page, game)
        page.evaluate(f"document.activeElement && document.activeElement.blur(); __game.play({expr})")
        page.wait_for_timeout(700)
        for _ in range(4):
            if page.evaluate('window.ArcadeMenus && ArcadeMenus.isOpen'): page.keyboard.press('Enter'); page.wait_for_timeout(300)
        page.keyboard.down(key); page.wait_for_timeout(2200); page.keyboard.up(key)
        page.screenshot(path=str(OUT / f'scenery-{name}.png'))
        return page
    play(pg, 'jungle', "__jungleDebug.LEVELS.find(l => l.id === 'forest2')", 'jungle-forest2')
    st = pg.evaluate('__jungleState()')
    check(st['cam']['x'] > 0 or st.get('x', 0) > 0, 'Treetop Trail (evening) plays')
    ph = br.new_page(viewport={'width': 844, 'height': 390}, is_mobile=True, has_touch=True, device_scale_factor=2)
    ph.on('pageerror', lambda e: errors.append(str(e)))
    play(ph, 'trail', "__trailDebug.ADVENTURES.find(a => a.id === 'dusk')", 'trail-dusk-phone')
    check(ph.evaluate('__trailState().x') > 70, f"Sunset Swamp plays on a phone (x {round(ph.evaluate('__trailState().x'))})")
    ph.evaluate("__trailTest.goRoom(12)"); ph.wait_for_timeout(500)
    ph.screenshot(path=str(OUT / 'scenery-trail-dusk-night-phone.png'))
    br.close()

check(not errors, f'no page errors {errors[:3]}')
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED: {fails}'))
sys.exit(1 if fails else 0)
