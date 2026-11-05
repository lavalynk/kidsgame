"""Automated test: Mini RC Racers polish (steering, race feedback, rivals, Free Drive).

Run:  python3 tests/test_rc.py
Checks: smooth steering (a tap is a nudge, holding = full turn), the slipstream behind
another car, rivals' faces when places change, the bouncing place arrow, the horn,
the Race / Drive switch in Free Play, and a whole Free Drive (find all 12 stars).
Screenshots land in tests/out/.
"""
import sys, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

def open_rc(pg):
    pg.goto((ROOT / 'rc' / 'index.html').as_uri()); pg.evaluate('localStorage.clear()'); pg.reload(); pg.wait_for_timeout(400)
    vw = pg.viewport_size
    pg.mouse.click(vw['width'] // 2, vw['height'] // 2); pg.wait_for_timeout(700)
    pg.click('[data-menu=free]'); pg.wait_for_timeout(400)

def start(pg, track_id):
    pg.click(f'[data-track="{track_id}"]'); pg.wait_for_timeout(300)
    pg.wait_for_function('typeof __rcStep === "function" && __rcState().track')

PLAYER = '__rcCars().find(c => c.isPlayer)'

with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1280, 'height': 760})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    open_rc(pg)

    # ---- Free Play menu: Race / Drive switch ----
    check(pg.locator('[data-kind]').count() == 2, 'Free Play: Race + Drive buttons')
    race_tiles = pg.locator('[data-track]').evaluate_all('els => els.map(e => e.dataset.track)')
    check(len(race_tiles) == 10 and not any(t.startswith(('fd-', 'tt-')) for t in race_tiles), f'Race shows the 10 race tracks ({len(race_tiles)})')
    pg.screenshot(path=str(OUT / 'rc-free-menu.png'))
    pg.click('[data-kind=drive]'); pg.wait_for_timeout(200)
    drive_tiles = pg.locator('[data-track]').evaluate_all('els => els.map(e => e.dataset.track)')
    check(len(drive_tiles) == 10 and all(t.startswith('fd-') for t in drive_tiles), f'Drive shows 10 Free Drive tracks ({len(drive_tiles)})')
    pg.screenshot(path=str(OUT / 'rc-drive-menu.png'))
    pg.click('[data-kind=race]'); pg.wait_for_timeout(200)

    # ---- a race on the Backyard track ----
    start(pg, race_tiles[0])
    pg.screenshot(path=str(OUT / 'rc-countdown.png'))       # rival name tags
    pg.evaluate('__rcStep(3.4)')                            # past "Go!"
    check(pg.evaluate('__rcState().racers.length') == 4, 'race: you + 3 rivals')

    # smooth steering
    # (keys pressed and stepped inside one JS call, so the real-time game loop can't sneak in)
    key = "(t, c) => window.dispatchEvent(new KeyboardEvent(t, { code: c, key: c, bubbles: true }))"
    s1, s2, s3 = pg.evaluate(f"""(() => {{ const k = {key}, P = () => {PLAYER};
      k('keydown', 'ArrowUp'); __rcStep(1);
      k('keydown', 'ArrowRight'); __rcStep(0.05); const a = P().steerIn;
      __rcStep(0.25); const b = P().steerIn;
      k('keyup', 'ArrowRight'); __rcStep(0.04); const c = P().steerIn;
      k('keyup', 'ArrowUp'); return [a, b, c]; }})()""")
    check(0.2 < s1 < 0.5, f'steering: a quick tap is only a nudge ({s1:.2f})')
    check(s2 > 0.99, f'steering: holding gives a full turn ({s2:.2f})')
    check(s3 < s2 - 0.4, f'steering: letting go straightens up fast ({s3:.2f})')

    # no horn any more (Keith): the gift button with no gift does nothing
    pg.evaluate(PLAYER + '.item = null')
    pg.keyboard.press('Space'); pg.evaluate('__rcStep(0.1)')
    check(not pg.evaluate(PLAYER + '.honks'), 'no horn: the gift button is quiet without a gift')
    # Candy Raceway has no secret shortcut (Keith)
    check(pg.evaluate("__rcTrackCheck().find(t => t.id === 't6').shortL") == 0, 'Candy Raceway: no shortcut')

    # slipstream: put you right behind a rival, both driving fast down the road
    pg.evaluate('__rcAuto(true)')
    best = pg.evaluate("""(() => {
      __rcStep(4);                         // everyone up to speed first
      const cs = __rcCars(), p = cs.find(c => c.isPlayer), r = cs.find(c => !c.isPlayer);
      const fx = Math.cos(r.a), fy = Math.sin(r.a);
      p.x = r.x - fx * 90; p.y = r.y - fy * 90; p.a = r.a; p.vx = r.vx; p.vy = r.vy;
      p.hint = r.hint; p.s = r.s; p.lap = r.lap; p.cp = r.cp; p.ai.lane = r.ai.lane; p.ai.laneTarget = r.ai.laneTarget;
      let best = 0;
      for (let i = 0; i < 20; i++) {         // keep you tucked in 90 px behind (as a steady driver would)
        p.x = r.x - Math.cos(r.a) * 90; p.y = r.y - Math.sin(r.a) * 90; p.a = r.a; p.vx = r.vx; p.vy = r.vy;
        __rcStep(0.05); best = Math.max(best, p.draft || 0); }
      return best; })()""")
    check(best > 0.3, f'slipstream: tucked in behind a rival builds up ({best:.2f})')
    pg.screenshot(path=str(OUT / 'rc-slipstream.png'))

    # passing: jump you ahead of everyone -> place arrow + a surprised rival
    pg.evaluate('''(() => {
      const cs = __rcCars(), p = cs.find(c => c.isPlayer);
      const lead = cs.filter(c => !c.isPlayer).sort((a, b) => b.progress - a.progress)[0];
      for (const c of cs) if (!c.isPlayer) { c.moodCool = 0; }
      p.x = lead.x + Math.cos(lead.a) * 260; p.y = lead.y + Math.sin(lead.a) * 260; p.a = lead.a;
      p.vx = lead.vx; p.vy = lead.vy; p.lap = lead.lap; p.cp = lead.cp; p.hint = lead.hint;
    })()''')
    pg.evaluate('__rcStep(0.1)')
    pos = pg.evaluate('__rcState().player.position')
    moods = pg.evaluate("__rcCars().filter(c => !c.isPlayer && c.mood).map(c => c.mood.kind)")
    check(pos == 1, f'jumped ahead: you are 1st ({pos})')
    check('oh' in moods, f'rivals you pass look surprised ({moods})')
    pg.evaluate('__rcStep(0.25)')
    pg.screenshot(path=str(OUT / 'rc-passed.png'))

    # finish the race on autopilot
    for _ in range(150):
        if pg.evaluate('__rcState().over'): break
        pg.evaluate('__rcStep(1)')
    pg.wait_for_timeout(900)
    check(pg.evaluate('__rcState().over'), 'race: finished on autopilot')

    # ---- Free Drive ----
    pg.goto((ROOT / 'rc' / 'index.html').as_uri()); pg.wait_for_timeout(400)
    pg.mouse.click(640, 380); pg.wait_for_timeout(700)
    pg.click('[data-menu=free]'); pg.wait_for_timeout(300)
    pg.click('[data-kind=drive]'); pg.wait_for_timeout(200)
    start(pg, 'fd-' + race_tiles[0])
    st = pg.evaluate('__rcState()')
    check(st['mode'] == 'drive' and len(st['racers']) == 1 and st['stars'] == 12, f"drive: just you and 12 stars ({st['mode']}, {len(st['racers'])}, {st['stars']})")
    pg.evaluate('__rcStep(3.4)')
    pg.keyboard.down('ArrowUp'); pg.evaluate('__rcStep(2)'); pg.keyboard.up('ArrowUp')
    pg.screenshot(path=str(OUT / 'rc-drive.png'))
    # autopilot round the track for a while: some stars on the road get picked up, no errors
    pg.evaluate('__rcAuto(true); __rcStep(25)')
    got = pg.evaluate('__rcState().starsGot')
    check(got >= 1, f'drive: driving round picks up stars ({got})')
    check(not pg.evaluate('__rcState().over'), 'drive: no laps, it keeps going')
    # collect the rest by hopping onto each one
    n = pg.evaluate('__rcStars().length')
    for i in range(n):
        if pg.evaluate(f'__rcStars()[{i}].got'): continue
        pg.evaluate(f'''(() => {{ const s = __rcStars()[{i}], p = {PLAYER};
          p.x = s.x; p.y = s.y; p.vx = 0; p.vy = 0; }})()''')
        pg.evaluate('__rcStep(0.02)')
        if i == n - 4: pg.screenshot(path=str(OUT / 'rc-drive-stars.png'))
    check(pg.evaluate('__rcState().starsGot') == n, f'drive: all {n} stars found')
    pg.evaluate('__rcStep(3)'); pg.wait_for_timeout(1200)
    check(pg.evaluate('__rcState().over'), 'drive: all stars = the end')
    title = pg.locator('.ar-res-banner').first.inner_text()
    check('star' in title.lower() or 'record' in title.lower(), f'drive results: "{title}"')
    best = pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.v1')).games.rc.data.driveBest")
    check(bool(best), f'drive: best time saved ({best})')
    pg.screenshot(path=str(OUT / 'rc-drive-done.png'))

    # ---- phone, sideways: HUD fits ----
    ph = b.new_page(viewport={'width': 844, 'height': 390}, is_mobile=True, has_touch=True, device_scale_factor=2)
    ph.on('pageerror', lambda e: errors.append(str(e)))
    open_rc(ph)
    ph.screenshot(path=str(OUT / 'rc-phone-menu.png'))
    start(ph, race_tiles[3])
    ph.evaluate('__rcAuto(true); __rcStep(12)')
    ph.screenshot(path=str(OUT / 'rc-phone-race.png'))
    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
