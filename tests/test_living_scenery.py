"""Automated test: living backgrounds in Jungle Jump + Treasure Trail (new plan point 2, part 2, Nov 22).

Run:  python3 tests/test_living_scenery.py
Jungle Jump, every level:
  * the background draws, slides with the camera (parallax) and moves by itself (clouds + floaters)
  * every painted strip joins up with itself (no thin line where two copies meet)
  * the 2nd level of a world has its time of day (Treetop Trail evening, Windy Peak dawn, Jelly Hills twilight)
    and looks different from the 1st level
Treasure Trail, every adventure:
  * the background draws and moves by itself; Sunset Swamp gets darker room by room
Archery, every level (Nov 22, part 3):
  * the background draws and moves by itself; Hilltop / Prize Wheel / Snowy Slide have their time of day
    and look different from the other levels of their place; the still parts are painted once (cached)
Hoop Heroes + Putt-Putt Park, every level (Nov 22, part 4):
  * Hoops: the windows go day -> sunset (Sam, Bella) -> evening (Tia, Wes) -> night (Champ, High Score);
    the hall moves by itself (spotlights, clouds / stars, confetti, disco), is painted once, quick
  * Golf: every hole moves by itself (cloud shadows, butterflies / gulls, the sea); h8 + b8 = sunset,
    h9 + b9 = evening and look different; painted once; quick
All: in Calm motion the background stands still, and drawing it stays quick.
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
    pg.wait_for_function({'jungle': 'window.__jungleScene', 'trail': 'window.__trailScene', 'archery': 'window.__archeryScene',
                       'hoops': 'window.__hoopsScene', 'golf': 'window.__golfScene'}[game])

# draw one background into a canvas; returns sampled pixels (+ the average brightness last)
def DRAW(hook):
    return r'''([a, b, c, bg]) => {
  const S = window.%s, cv = document.createElement('canvas'); cv.width = S.W; cv.height = S.H; const x = cv.getContext('2d');
  S.draw(x, a, b, c, 0, bg);
  const d = x.getImageData(0, 0, S.W, S.H).data, out = []; let sum = 0, n = 0;
  for (let i = 0; i < d.length; i += 4 * 53) { out.push(d[i], d[i + 1], d[i + 2]); sum += d[i] + d[i + 1] + d[i + 2]; n++; }
  out.push(sum / n / 3); return out;
}''' % hook
JD, TD, AD = DRAW('__jungleScene'), DRAW('__trailScene'), DRAW('__archeryScene')
# Hoops + Golf: draw(ctx, id, t, w)
def DRAW2(hook):
    return r'''([id, t, w]) => {
  const S = window.%s, W = w || S.W, cv = document.createElement('canvas'); cv.width = W; cv.height = S.H; const x = cv.getContext('2d');
  S.draw(x, id, t, W);
  const d = x.getImageData(0, 0, W, S.H).data, out = []; let sum = 0, n = 0;
  for (let i = 0; i < d.length; i += 4 * 53) { out.push(d[i], d[i + 1], d[i + 2]); sum += d[i] + d[i + 1] + d[i + 2]; n++; }
  out.push(sum / n / 3); return out;
}''' % hook
HD, GD = DRAW2('__hoopsScene'), DRAW2('__golfScene')
def quick(pg, hook, lid):
    return pg.evaluate('''([h, id]) => { const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const x = c.getContext('2d'); x.scale(2, 2);
      const S = window[h]; S.draw(x, id, 0); const t0 = performance.now();
      for (let i = 0; i < 60; i++) S.draw(x, id, i / 30);
      return (performance.now() - t0) / 60; }''', [hook, lid])
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
    check(len(advs) == 6, f'Treasure Trail: 6 adventures ({[a["id"] for a in advs]})')
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

    # ---------------- Archery ----------------
    fresh(pg, 'archery')
    alv = pg.evaluate('__archeryScene.levels')
    atimes = {l['id']: l['time'] for l in alv}
    check(atimes.get('l3') == 'evening' and atimes.get('l6') == 'sunset' and atimes.get('l8') == 'dawn',
          f'archery: times of day (Hilltop evening, Prize Wheel sunset, Snowy Slide dawn) ({atimes})')
    for l in alv:
        if l['id'].startswith('fr-'): continue
        d1 = pg.evaluate(AD, [l['id'], 2.0]); d2 = pg.evaluate(AD, [l['id'], 4.5])
        check(diff(d1, d2) > 0.15, f"archery {l['id']}: clouds / floaters move by themselves ({diff(d1, d2):.2f})")
    for one, two in (('l1', 'l3'), ('l4', 'l6'), ('l7', 'l8'), ('l10', 'l12')):
        d1, d2 = pg.evaluate(AD, [one, 1.0]), pg.evaluate(AD, [two, 1.0])
        check(diff(d1, d2) > 12, f'archery {two} ({atimes[two]}) looks different from {one} ({diff(d1, d2):.1f})')
    ms = pg.evaluate('''() => { const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const x = c.getContext('2d'); x.scale(2, 2);
      __archeryScene.draw(x, 'l6', 0); const t0 = performance.now();
      for (let i = 0; i < 60; i++) __archeryScene.draw(x, 'l6', i / 30);
      return (performance.now() - t0) / 60; }''')
    check(ms < 10, f'archery: drawing the background is quick ({ms:.2f} ms a frame)')
    pg.evaluate(AD, ['l6', 0]); n0 = len(pg.evaluate('__archeryScene.cached()'))
    for i in range(5): pg.evaluate(AD, ['l6', i])
    check(len(pg.evaluate('__archeryScene.cached()')) == n0, 'archery: the still scenery is painted once, not every frame')

    # ---------------- Hoop Heroes ----------------
    fresh(pg, 'hoops')
    hlv = pg.evaluate('__hoopsScene.levels')
    htimes = {l['id']: l['time'] for l in hlv}
    check(htimes == {'r1': 'day', 'r2': 'day', 'r3': 'day', 'r4': 'sunset', 'r5': 'sunset', 'r6': 'evening', 'r7': 'evening', 'r8': 'night', 'free': 'night',
                      'c1': 'day', 'c2': 'sunset', 'c3': 'evening', 'c4': 'night'},
          f'hoops: the day goes by up the ladder ({htimes})')
    check(pg.evaluate("__hoopsScene.level('r8').show") == 'finals' and pg.evaluate("__hoopsScene.level('free').show") == 'disco'
          and pg.evaluate("__hoopsScene.level('r8').time") == 60, "hoops: the Champ's final + High Score disco (and the clock's seconds are kept)")
    for l in hlv:
        d1 = pg.evaluate(HD, [l['id'], 2.0, 1280]); d2 = pg.evaluate(HD, [l['id'], 4.5, 1280])
        check(diff(d1, d2) > 0.15, f"hoops {l['id']}: the hall moves by itself ({diff(d1, d2):.2f})")
    for one, two in (('r1', 'r4'), ('r1', 'r6'), ('r1', 'r8')):
        d1, d2 = pg.evaluate(HD, [one, 1.0, 1280]), pg.evaluate(HD, [two, 1.0, 1280])
        check(diff(d1, d2) > 2, f'hoops {two} ({htimes[two]}) looks different from {one} ({diff(d1, d2):.1f})')
    ms = quick(pg, '__hoopsScene', 'r8')
    check(ms < 8, f'hoops: drawing the hall is quick ({ms:.2f} ms a frame)')
    pg.evaluate(HD, ['r8', 0, 960]); n0 = len(pg.evaluate('__hoopsScene.cached()'))
    for i in range(5): pg.evaluate(HD, ['r8', i, 960])
    check(len(pg.evaluate('__hoopsScene.cached()')) == n0, 'hoops: the still hall is painted once, not every frame')

    # ---------------- Putt-Putt Park ----------------
    fresh(pg, 'golf')
    glv = pg.evaluate('__golfScene.levels')
    gtimes = {l['id']: l['time'] for l in glv if l['time'] != 'day'}
    check(len(glv) == 18 and gtimes == {'h8': 'sunset', 'h9': 'evening', 'b8': 'sunset', 'b9': 'evening'}, f'golf: times of day ({gtimes})')
    for l in glv:
        d1 = pg.evaluate(GD, [l['id'], 2.0, 0]); d2 = pg.evaluate(GD, [l['id'], 4.5, 0])
        check(diff(d1, d2) > 0.15, f"golf {l['id']}: clouds / visitors / the sea move by themselves ({diff(d1, d2):.2f})")
    for one, two in (('h7', 'h8'), ('h7', 'h9'), ('b7', 'b8'), ('b7', 'b9')):
        d1, d2 = pg.evaluate(GD, [one, 1.0, 0]), pg.evaluate(GD, [two, 1.0, 0])
        check(abs(d1[-1] - d2[-1]) > 4 or diff(d1, d2) > 12, f'golf {two} ({gtimes[two]}) looks different from {one} ({diff(d1, d2):.1f})')
    ms = quick(pg, '__golfScene', 'b9')
    check(ms < 8, f'golf: drawing the scenery is quick ({ms:.2f} ms a frame)')
    pg.evaluate(GD, ['h3', 0, 0]); n0 = len(pg.evaluate('__golfScene.cached()'))
    for i in range(5): pg.evaluate(GD, ['h3', i, 0])
    check(len(pg.evaluate('__golfScene.cached()')) == n0, 'golf: the still scenery is painted once, not every frame')

    # ---------------- Calm motion: nothing moves by itself ----------------
    fresh(pg, 'jungle', calm=True)
    for lid in ('forest', 'forest2', 'cave', 'snow2', 'candy2'):
        a = pg.evaluate(JD, [lid, 500, 1.0]); b = pg.evaluate(JD, [lid, 500, 5.0])
        check(diff(a, b) == 0, f'jungle {lid}: in Calm motion the background stands still ({diff(a, b):.2f})')
    fresh(pg, 'trail', calm=True)
    for aid in ('river', 'deep', 'temple', 'dusk'):
        a = pg.evaluate(TD, [aid, 2, 1.0, True]); b = pg.evaluate(TD, [aid, 2, 5.0, True])
        check(diff(a, b) == 0, f'trail {aid}: in Calm motion the background stands still ({diff(a, b):.2f})')

    fresh(pg, 'archery', calm=True)
    for lid in ('l1', 'l3', 'l5', 'l6', 'l8', 'l9', 'l10', 'l12'):
        a = pg.evaluate(AD, [lid, 1.0]); b = pg.evaluate(AD, [lid, 5.0])
        check(diff(a, b) == 0, f'archery {lid}: in Calm motion the background stands still ({diff(a, b):.2f})')

    fresh(pg, 'hoops', calm=True)
    for lid in ('r1', 'r4', 'r6', 'r8', 'free'):
        a = pg.evaluate(HD, [lid, 1.0, 1280]); b = pg.evaluate(HD, [lid, 5.0, 1280])
        check(diff(a, b) == 0, f'hoops {lid}: in Calm motion the hall stands still ({diff(a, b):.2f})')
    fresh(pg, 'golf', calm=True)
    for lid in ('h1', 'h5', 'h9', 'b1', 'b3', 'b8'):
        a = pg.evaluate(GD, [lid, 1.0, 0]); b = pg.evaluate(GD, [lid, 5.0, 0])
        check(diff(a, b) == 0, f'golf {lid}: in Calm motion the scenery stands still ({diff(a, b):.2f})')

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
    # Archery: play Prize Wheel (sunset) on a phone held sideways, shoot one arrow
    ph2 = br.new_page(viewport={'width': 844, 'height': 390}, is_mobile=True, has_touch=True, device_scale_factor=2)
    ph2.on('pageerror', lambda e: errors.append(str(e)))
    fresh(ph2, 'archery')
    ph2.evaluate("document.activeElement && document.activeElement.blur(); __game.play(__archeryScene.level('l6'))")
    ph2.wait_for_function("typeof __archeryState === 'function' && __archeryState().phase === 'ready'", timeout=8000); ph2.wait_for_timeout(2400)
    for _ in range(4):
        if ph2.evaluate('window.ArcadeMenus && ArcadeMenus.isOpen'): ph2.keyboard.press('Enter'); ph2.wait_for_timeout(300)
    ph2.evaluate('__archeryFire(30, 0.7)'); ph2.wait_for_timeout(2000)
    st = ph2.evaluate('__archeryState()')
    check(st['level'] == 'l6' and st['shots'] >= 1, f"Prize Wheel (sunset) plays on a phone ({st['level']}, shots {st['shots']})")
    ph2.screenshot(path=str(OUT / 'scenery-archery-sunset-phone.png'))
    # Hoops: the Champ's final (night, confetti) on a phone; one basket
    fresh(ph2, 'hoops')
    ph2.evaluate("document.activeElement && document.activeElement.blur(); __game.play(__hoopsScene.level('r8'))")
    ph2.wait_for_function("window.__hoopsState && __hoopsState().ready && !ArcadeMenus.isOpen", timeout=8000); ph2.wait_for_timeout(600)
    ph2.evaluate('__hoopsShoot(__hoopsPerfect(), 0)'); ph2.wait_for_timeout(2500)
    st = ph2.evaluate('__hoopsState()')
    check(st['level'] == 'r8' and st['shots'] == 1 and st['timeLeft'] < 60, f"the Champ's final (night) plays on a phone (shots {st['shots']}, made {st['made']}, clock {st['timeLeft']:.1f})")
    ph2.screenshot(path=str(OUT / 'scenery-hoops-night-phone.png'))
    # Golf: Lighthouse (beach, evening) on a phone; the bot putts once
    fresh(ph2, 'golf')
    ph2.evaluate("document.activeElement && document.activeElement.blur(); __game.play({ id: 'b9' })")
    ph2.wait_for_function("window.__golfState && __golfState().hole === 'b9' && __golfState().state === 'aim' && !ArcadeMenus.isOpen", timeout=8000); ph2.wait_for_timeout(400)
    ph2.evaluate('__golfBot()'); ph2.wait_for_timeout(3000)
    st = ph2.evaluate('__golfState()')
    check(st['strokes'] >= 1, f"Lighthouse (evening) plays on a phone (strokes {st['strokes']})")
    ph2.screenshot(path=str(OUT / 'scenery-golf-evening-phone.png'))
    br.close()

check(not errors, f'no page errors {errors[:3]}')
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED: {fails}'))
sys.exit(1 if fails else 0)
