"""Automated test: Mini RC Racers' living backgrounds (new plan point 2, part 5, Nov 22).

Run:  python3 tests/test_rc_scenery.py
Every track (t1-t10):
  * the scenery moves by itself (the sea / sky slide, cloud shadows, floaters, bubbling lava, bobbing rings...)
  * the ground has a texture (not one flat color) painted ONCE per place into a small tile
  * Autumn Woods = sunset, Desert Dunes = dawn, Jungle Rally = evening, and they look different with it
  * drawing the whole view stays quick
Calm motion: the scenery stands still. Then races on a phone (sideways) for a few seconds: no errors.
Look at all tracks with tools/preview_rc_scenery.py. Screenshots: tests/out/rc-scenery-*.png
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
URL = (ROOT / 'rc' / 'index.html').as_uri()
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

def open_rc(pg, calm=False):
    pg.goto(URL)
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': 'big'}]}
    pg.evaluate("([p, c]) => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p);"
                " if (c) localStorage.setItem('kidsArcade.parent', JSON.stringify({ motion: 'calm' })); }", [json.dumps(prof), calm])
    pg.reload(); pg.wait_for_timeout(400)
    vw = pg.viewport_size
    pg.mouse.click(vw['width'] // 2, vw['height'] // 2); pg.wait_for_timeout(600)

def play(pg, lid):
    pg.evaluate(f"__game.play({{ id: '{lid}' }})")
    pg.wait_for_function(f"typeof __rcStep === 'function' && __rcState().track === '{lid}' && __rcState().raceTime === 0")
    pg.evaluate('__rcAuto(true); __rcStep(3.4); __rcStep(4)')

# draw the view twice (scene times a and b) in ONE call (so nothing else moves in between);
# returns how different they are, the average color of each, and how bumpy the ground is
TWO = r'''([a, b, noTime]) => {
  const S = window.__rcScene, mk = () => { const c = document.createElement('canvas'); c.width = S.W; c.height = S.H; return c; };
  const c1 = mk(), c2 = mk();
  S.draw(c1.getContext('2d'), a, noTime); S.draw(c2.getContext('2d'), b, noTime);
  const d1 = c1.getContext('2d').getImageData(0, 0, S.W, S.H).data, d2 = c2.getContext('2d').getImageData(0, 0, S.W, S.H).data;
  let diff = 0, n = 0; const avg = [0, 0, 0];
  for (let i = 0; i < d1.length; i += 4 * 37) { for (let k = 0; k < 3; k++) { diff += Math.abs(d1[i + k] - d2[i + k]); avg[k] += d1[i + k]; } n++; }
  return { diff: diff / n / 3, avg: avg.map(v => v / n) };
}'''
GROUND = r'''() => {   // which ground tiles have been painted so far
  const S = window.__rcScene, id = S.tracks.find(t => t.id === __rcState().track).theme;
  S.draw(document.createElement('canvas').getContext('2d'), 0);   // (makes sure the tile is painted)
  return { tiles: S.tiles(), id };
}'''
SPEED = r'''() => { const S = window.__rcScene, c = document.createElement('canvas'); c.width = S.W; c.height = S.H; const x = c.getContext('2d');
  S.draw(x, 1); const t0 = performance.now(); for (let i = 0; i < 20; i++) S.draw(x, i * 0.05); return (performance.now() - t0) / 20; }'''

with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1280, 'height': 760})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    open_rc(pg)
    play(pg, 't1')                                  # (the hook is made when a race starts)
    tracks = pg.evaluate('__rcScene.tracks')
    times = {t['id']: t['time'] for t in tracks if t['time']}
    check(times == {'t4': 'sunset', 't5': 'dawn', 't9': 'evening'}, f'times of day: {times}')
    themes_seen = set()
    for t in tracks:
        play(pg, t['id'])
        themes_seen.add(t['theme'])
        r = pg.evaluate(TWO, [0, 3.3, False])
        check(r['diff'] > 0.15, f"{t['id']} ({t['theme']}): the scenery moves by itself ({r['diff']:.2f})")
        check(pg.evaluate('__rcScene.time()') == t['time'], f"{t['id']}: time of day in the race = {t['time']}")
        if t['time']:
            w = pg.evaluate(TWO, [2, 2, True])
            diff = sum(abs(x - y) for x, y in zip(r['avg'], w['avg']))
            check(diff > 12, f"{t['id']} at {t['time']} looks different from daytime ({diff:.1f})")
        gr = pg.evaluate(GROUND)
        check(sorted(gr['tiles']) == sorted(themes_seen), f"{t['id']}: ground tiles painted once per place ({gr['tiles']})")
        ms = pg.evaluate(SPEED)
        check(ms < 25, f"{t['id']}: drawing the whole view stays quick ({ms:.1f} ms)")
        check(sorted(pg.evaluate('__rcScene.tiles()')) == sorted(themes_seen), f"{t['id']}: no new tiles while racing")
        if t['id'] in ('t2', 't4', 't8', 't9'): pg.screenshot(path=str(OUT / f"rc-scenery-{t['id']}.png"))

    # ground texture: the grass outside the road isn't one flat color any more
    play(pg, 't1')
    tex = pg.evaluate(r'''() => { const S = window.__rcScene, c = document.createElement('canvas'); c.width = S.W; c.height = S.H; const x = c.getContext('2d');
      S.draw(x, 0); const d = x.getImageData(0, 0, S.W, S.H).data, seen = new Set();
      for (let i = 0; i < d.length; i += 4 * 7) { const k = d[i] + ',' + d[i + 1] + ',' + d[i + 2]; seen.add(k); }
      return seen.size; }''')
    check(tex > 200, f'the view has lots of colors (ground texture, {tex})')

    # ---- Calm motion: everything stands still ----
    open_rc(pg, calm=True)
    for lid in ('t2', 't8', 't10'):
        play(pg, lid)
        r = pg.evaluate(TWO, [0, 4.1, False])
        check(r['diff'] == 0, f'{lid}: in Calm motion the scenery stands still ({r["diff"]:.3f})')

    # ---- a real race on a phone held sideways ----
    ph = b.new_page(viewport={'width': 844, 'height': 390}, is_mobile=True, has_touch=True, device_scale_factor=1)
    ph.on('pageerror', lambda e: errors.append(str(e)))
    open_rc(ph)
    ph.evaluate("__game.play({ id: 't9' })")
    ph.wait_for_function("typeof __rcStep === 'function' && __rcState().track === 't9'")
    ph.evaluate('__rcAuto(true)'); ph.wait_for_timeout(6500)
    st = ph.evaluate('__rcState()')
    check(st['raceTime'] > 1, f"racing on a phone at evening ({st['raceTime']:.1f} s)")
    ph.screenshot(path=str(OUT / 'rc-scenery-phone.png'))
    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
sys.exit(1 if fails else 0)
