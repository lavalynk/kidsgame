"""Automated test: Turbo Bike's living backgrounds (new plan point 2, part 1, Nov 22).

Run:  python3 tests/test_bike_scenery.py
Checks, for every place:
  * the scenery strips are painted (far / mid / near; the beach has no middle strip: the sea is there)
  * each strip joins up with itself (the right edge matches the left edge: no seam when it repeats)
  * the strips slide at different speeds when the camera moves (parallax)
  * clouds and floaters move by themselves, but in Calm motion the background stands still
  * drawing the background stays quick (it only copies the painted strips)
Then races Forest Flyer (evening) and Snowy Peaks (dawn) for real, sideways on a desktop and upright on a phone,
and checks the time of day is on and no errors happen. Screenshots: tests/out/bike-scenery-*.png
(look at every place at once with `python3 tools/preview_bike_scenery.py`).
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

def fresh(pg, done=(), calm=False):
    pg.goto((ROOT / 'bike' / 'index.html').as_uri())
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': 'big'}]}
    save = {'games': {'bike': {'levels': {k: {'done': True, 'stars': 1, 'time': 30} for k in done}, 'best': 0, 'unlocked': [], 'data': {}, 'achievements': []}}}
    pg.evaluate("([p, s, c]) => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); localStorage.setItem('kidsArcade.v1', s);"
                " if (c) localStorage.setItem('kidsArcade.parent', JSON.stringify({ motion: 'calm' })); }", [json.dumps(prof), json.dumps(save), calm])
    pg.reload(); pg.wait_for_function('window.__bikeScene')

# draw a place's background into a 2x canvas; returns the pixels as a list (sampled) + strip info
DRAW = r'''([p, tm, cam, t]) => {
  const c = document.createElement('canvas'); c.width = 1920; c.height = 760; const x = c.getContext('2d'); x.scale(2, 2);
  __bikeScene.draw(x, p, tm, cam, t);
  const d = x.getImageData(0, 0, 1920, 760).data, out = [];
  for (let i = 0; i < d.length; i += 4 * 97) out.push(d[i], d[i + 1], d[i + 2]);
  return out;
}'''
def diff(a, b): return sum(abs(x - y) for x, y in zip(a, b)) / len(a)

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 760})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    fresh(pg)
    places = pg.evaluate('__bikeScene.places')
    check(len(places) == 11, f'11 places: 10 tracks + Frosty Village (winter) ({places})')

    for p in places:
        a = pg.evaluate(DRAW, [p, '', 1000, 2.0])
        info = pg.evaluate('__bikeScene.info()')
        want = ['far', 'near'] if p == 'beach' else ['far', 'mid', 'near']
        check(info['strips'] == want, f'{p}: strips painted {info["strips"]}')
        # the seam: compare the strip's first column with the column one LOOP over (they must match)
        seam = pg.evaluate('''() => __bikeScene.canvases().map(c => {
          const k = c.width / (__bikeScene.LOOP + 24), x = c.getContext('2d');
          const L = x.getImageData(2, 0, 1, c.height).data, R = x.getImageData(Math.round(__bikeScene.LOOP * k) + 2, 0, 1, c.height).data;
          let s = 0; for (let i = 0; i < L.length; i++) s += Math.abs(L[i] - R[i]); return s / L.length; })''')
        check(max(seam) < 6, f'{p}: every strip joins up with itself (edge difference {[round(s, 1) for s in seam]})')
        # parallax: move the camera a bit, the picture changes
        moved = pg.evaluate(DRAW, [p, '', 1100, 2.0])
        check(diff(a, moved) > 1, f'{p}: the scenery slides with the camera ({diff(a, moved):.1f})')
        # things move by themselves (the same camera, a later moment)
        later = pg.evaluate(DRAW, [p, '', 1000, 4.5])
        check(diff(a, later) > 0.2, f'{p}: clouds / floaters move by themselves ({diff(a, later):.2f})')

    # the time-of-day looks differ from the day look
    for p, tm in (('forest', 'evening'), ('snow', 'dawn')):
        day, tod = pg.evaluate(DRAW, [p, '', 0, 1.0]), pg.evaluate(DRAW, [p, tm, 0, 1.0])
        check(diff(day, tod) > 15, f'{p} at {tm} looks different from the day ({diff(day, tod):.1f})')

    # speed: the background is just a few picture copies
    ms = pg.evaluate('''() => { const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const x = c.getContext('2d'); x.scale(2, 2);
      __bikeScene.draw(x, 'jungle', '', 0, 1); const t0 = performance.now();
      for (let i = 0; i < 120; i++) __bikeScene.draw(x, 'jungle', '', i * 9, i / 30);
      return (performance.now() - t0) / 120; }''')
    check(ms < 8, f'drawing the background is quick ({ms:.2f} ms a frame)')

    # Calm motion: nothing moves by itself (real clock, two moments apart)
    fresh(pg, calm=True)
    for p in ('forest', 'snow', 'volcano', 'night', 'beach'):
        a = pg.evaluate(DRAW, [p, '', 1000, None]); pg.wait_for_timeout(400)
        b2 = pg.evaluate(DRAW, [p, '', 1000, None])
        check(diff(a, b2) == 0, f'{p}: in Calm motion the background stands still ({diff(a, b2):.2f})')

    # real races: Forest Flyer at evening (desktop), Snowy Peaks at dawn (phone, sideways + upright)
    def race(page, index, name, want_time):
        fresh(page, ['t1', 't2', 't3'])
        cmenu.to_title(page); cmenu.tap(page, 'levels'); cmenu.wait_screen(page, 'levels')
        tiles = [i for i in cmenu.items(page) if i['attr'].startswith('level-')]
        page.evaluate('a => ArcadeMenus.tap(a)', tiles[index]['attr'])
        cmenu.into_game(page)
        page.wait_for_function('typeof __bikeState === "function" && __bikeState().countdown <= 0', timeout=8000)
        page.keyboard.down('ArrowRight'); page.wait_for_timeout(2500)
        check(page.evaluate('__bikeScene.time()') == want_time, f'{name}: races at {want_time}')
        page.screenshot(path=str(OUT / f'bike-scenery-{name}.png'))
        page.keyboard.up('ArrowRight')
        st = page.evaluate('__bikeState()')
        check(st['bike']['x'] > 600, f"{name}: riding along fine ({round(st['bike']['x'])})")

    race(pg, 2, 'forest-evening', 'evening')
    ph = b.new_page(viewport={'width': 844, 'height': 390}, is_mobile=True, has_touch=True, device_scale_factor=2)
    ph.on('pageerror', lambda e: errors.append(str(e)))
    race(ph, 3, 'snow-dawn-phone', 'dawn')
    b.close()

check(not errors, f'no page errors {errors[:3]}')
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED: {fails}'))
sys.exit(1 if fails else 0)
