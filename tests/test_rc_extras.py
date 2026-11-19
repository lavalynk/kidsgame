"""Automated test: Mini RC Racers - new items, bumpers and obstacles (Keith, Nov 19:
"a couple cooler weapons", "those bouncing circles on some tracks", "more obstacles").

Run:  python3 tests/test_rc_extras.py
Checks:
  * every one of the 10 tracks has moving obstacles now (beach ball, pumpkin, tumbleweed, moon rock, frog, cloud puff...)
  * bouncy bumpers on 5 tracks, always on one side of the road; a car bounces off one and doesn't get stuck
  * Giant Snowball: rolls ahead and bonks the car in front (a shield blocks it)
  * Boomerang: loops out, hits a car on the way, and comes back
  * Triple Bubble: 3 bubbles at once
  * the new items come out of gift boxes; the computer cars use them too
  * in Heart Battle a snowball takes a heart
  * autopilot races on the bumper tracks still finish; the results screen fits (buttons inside); no JavaScript errors
Screenshots land in tests/out/ (rc-extras-*.png).
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

def race(pg, tid):
    pg.evaluate(f"__game.play({{ id: '{tid}' }})")
    pg.wait_for_function(f"typeof __rcStep === 'function' && __rcState().track === '{tid}' && __rcState().raceTime === 0")
    pg.evaluate('__rcStep(3.4)')

# put the player on the road at distance s (lat = sideways), facing along it, at `speed`;
# and car `other` `gap` px ahead in the same lane, stopped. The rest go far away.
PLACE = """([s, lat, speed, other, gap]) => {
  const cs = __rcCars(), P = __rcTrackPts(__rcState().track), step = P.step, n = P.pts.length;
  const idx = (d) => ((Math.round(d / step) % n) + n) % n;
  const at = (d) => { const i = idx(d), j = (i + 1) % n, [x, y] = P.pts[i], [x2, y2] = P.pts[j], L = Math.hypot(x2 - x, y2 - y);
    const tx = (x2 - x) / L, ty = (y2 - y) / L; return { x: x - ty * lat, y: y + tx * lat, a: Math.atan2(ty, tx) }; };
  const me = cs.find(c => c.isPlayer), p = at(s);
  Object.assign(me, { x: p.x, y: p.y, a: p.a, vx: Math.cos(p.a) * speed, vy: Math.sin(p.a) * speed, spin: 0, wob: 0, shield: 0, ghost: 0, item: null, hint: idx(s) });
  cs.filter(c => !c.isPlayer).forEach((c, k) => {
    const q = c.name === other ? at(s + gap) : at(s - 900 - k * 200);
    Object.assign(c, { x: q.x, y: q.y, a: q.a, vx: 0, vy: 0, spin: 0, wob: 0, shield: 0, ghost: 0, item: null, hint: idx(c.name === other ? s + gap : s - 900 - k * 200) });
    c.ai.reverse = 0;
  });
}"""

with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(URL)
    pg.evaluate("localStorage.clear(); localStorage.setItem('kidsArcade.profiles', JSON.stringify({active: 'p1', list: [{id: 'p1', name: '', pet: 'cat', color: '#ef476f', age: 'big'}]}))")
    pg.reload(); pg.wait_for_timeout(400); pg.mouse.click(640, 360); pg.wait_for_timeout(700)

    # ---- obstacles + bumpers on every track
    want_b = {'t2': 3, 't4': 2, 't6': 4, 't7': 3, 't10': 4}
    movers, bumps = {}, {}
    for i in range(1, 11):
        tid = f't{i}'
        pg.evaluate(f"__game.play({{ id: '{tid}' }})")
        pg.wait_for_function(f"typeof __rcStep === 'function' && __rcState().track === '{tid}' && __rcState().raceTime === 0")
        movers[tid] = pg.evaluate('__rcState().movers')
        bs = pg.evaluate('__rcExtras.bumpers()'); bumps[tid] = len(bs)
        hw = pg.evaluate(f"__rcTrackPts('{tid}').hw")
        if bs: check(all(abs(abs(x['lat']) - 0.5 * hw) < 2 for x in bs), f'{tid}: bumpers sit on one side of the road (room to pass)')
    check(all(len(m) >= 1 for m in movers.values()), f'every track has moving obstacles: {movers}')
    check(all(bumps.get(t, 0) == n for t, n in want_b.items()) and bumps['t1'] == 0, f'bumpers on 5 tracks: {bumps}')

    # ---- bounce off a bumper
    race(pg, 't6')
    bp = pg.evaluate('__rcExtras.bumpers()[0]')
    pg.evaluate(PLACE, [bp['s'] - 160, bp['lat'], 350, '', 0])
    pg.evaluate('__rcStep(0.8)')
    me = pg.evaluate('__rcState().player')
    d = ((me['x'] - bp['x']) ** 2 + (me['y'] - bp['y']) ** 2) ** 0.5
    check(d >= bp['r'] + 15, f'a car drives into a bumper: it bounces off (never inside it, {round(d)} px away)')
    pg.screenshot(path=str(OUT / 'rc-extras-bumper.png'))

    # ---- Giant Snowball
    race(pg, 't1')
    pg.evaluate(PLACE, [600, 0, 150, 'Grape', 260])
    pg.evaluate("__rcGive('snowball'); __rcExtras.use(); __rcStep(0.15)")
    check(pg.evaluate('__rcExtras.shots().length') == 1, 'Giant Snowball: rolls away')
    pg.screenshot(path=str(OUT / 'rc-extras-snowball.png'))
    pg.evaluate('__rcStep(0.6)')
    g = pg.evaluate("(() => { const c = __rcCars().find(c => c.name === 'Grape'); return { spin: c.spin, wob: c.wob }; })()")
    check(g['spin'] > 0 or g['wob'] > 0, 'the snowball bonks the car in front')
    pg.evaluate(PLACE, [600, 0, 150, 'Grape', 260])
    pg.evaluate("__rcCars().find(c => c.name === 'Grape').shield = 5; __rcGive('snowball'); __rcExtras.use(); __rcStep(0.75)")
    g = pg.evaluate("(() => { const c = __rcCars().find(c => c.name === 'Grape'); return { spin: c.spin, wob: c.wob, shield: c.shield }; })()")
    check(g['shield'] == 0 and g['spin'] <= 0 and g['wob'] <= 0, 'a shield blocks the snowball')

    # ---- Boomerang
    pg.evaluate(PLACE, [600, 0, 0, 'Mango', 240])
    pg.evaluate("__rcGive('boomerang'); __rcExtras.use(); __rcStep(0.3)")
    pg.screenshot(path=str(OUT / 'rc-extras-boomerang.png'))
    pg.evaluate('__rcStep(0.6)')
    hit = pg.evaluate("__rcExtras.shots().map(s => s.hit).flat()")
    pg.evaluate('__rcStep(1.0)')
    check('Mango' in hit and pg.evaluate('__rcExtras.shots().length') == 0, f'Boomerang: hits the car on its way ({hit}) and comes back')

    # ---- Triple Bubble
    pg.evaluate(PLACE, [600, 0, 100, 'Mango', 400])
    pg.evaluate("__rcGive('blaster'); __rcExtras.use()")
    check(pg.evaluate('__rcBubbles().length') == 3, 'Triple Bubble: 3 bubbles at once')

    # ---- gift boxes give the new items; rivals use them
    rolls = pg.evaluate("__rcRoll(2, true, 4000)")
    check(all(rolls.get(k, 0) > 50 for k in ['snowball', 'boomerang', 'blaster']), f'the new items come out of gift boxes ({ {k: rolls.get(k, 0) for k in ["snowball", "boomerang", "blaster"]} })')
    pg.evaluate(PLACE, [600, 0, 200, 'Grape', -200])
    pg.evaluate("(() => { const c = __rcCars().find(c => c.name === 'Grape'); c.item = 'snowball'; c.ai.holdT = 0; })()")
    pg.evaluate('__rcStep(1.5)')
    check(pg.evaluate("__rcCars().find(c => c.name === 'Grape').item") is None, 'a computer car uses its snowball on the car ahead')

    # ---- Heart Battle: a snowball takes a heart
    pg.evaluate("__game.play({ id: 'hb-yard' })")
    pg.wait_for_function("typeof __rcStep === 'function' && __rcState().mode === 'battle' && __rcState().raceTime === 0")
    pg.evaluate("__rcStep(3.4)")
    pg.evaluate("""(() => { const [mx, my] = __rcBattle.mid, cs = __rcCars(); const me = cs.find(c => c.isPlayer), t = cs.find(c => c.name === 'Grape');
      Object.assign(me, { x: mx - 250, y: my, a: 0, vx: 0, vy: 0 }); Object.assign(t, { x: mx + 50, y: my, vx: 0, vy: 0, ghost: 0, shield: 0 }); t.ai.t = 99; })()""")
    pg.evaluate("__rcGive('snowball'); __rcBattle.use(); __rcStep(0.7)")
    check(pg.evaluate("__rcState().battle.hearts.Grape") == 3, 'Heart Battle: a Giant Snowball takes a heart')

    # ---- whole races on bumper tracks still finish; the results fit
    for tid in ['t6', 't10']:
        race(pg, tid)
        pg.evaluate('__rcAuto(true)')
        for _ in range(60):
            pg.evaluate('__rcStep(4)')
            if pg.evaluate('__rcState().finished'): break
        st = pg.evaluate('__rcState()')
        check(st['finished'] and st['raceTime'] < 240, f"{tid}: autopilot race finishes ({round(st['raceTime'])} s)")
        pg.evaluate('__rcStep(3)'); pg.wait_for_timeout(1500)
        fit = pg.evaluate("(() => { const p = [...document.querySelectorAll('.ar-panel')].find(x => x.offsetParent); return p.scrollHeight <= p.clientHeight + 2; })()")
        check(fit, f'{tid}: the results screen fits (buttons inside the panel)')
        pg.screenshot(path=str(OUT / f'rc-extras-results-{tid}.png'))
    b.close()

if errors: print('JS errors:', errors)
print(f'{len(fails)} failed' if fails else 'ALL PASSED')
sys.exit(1 if fails or errors else 0)
