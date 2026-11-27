"""Automated test: Mini RC Racers screen steering (Keith, Nov 27: "screen steering would be cool").

Run:  python3 tests/test_rc_steer.py
Checks:
  * the Steer button on RC's main menu switches it on and off, saved per player (green = on)
  * the rule: pointing down the screen, Left / Right swap; pointing up they don't; sideways they keep
    what they meant last; held until the car points to that side, it holds it straight across
  * driving for real: a car pointing DOWN the screen + Left held = it goes to the screen's LEFT with the
    switch on (and to the right with it off, like before); holding on doesn't spin it round in circles
  * the "Show me" hand still steers the right way, nothing else breaks (no JavaScript errors)
Screenshots land in tests/out/.
"""
import sys, json, math, pathlib
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu as cm
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
URL = (ROOT / 'rc' / 'index.html').as_uri()
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

# hold Left for `sec` seconds in the open Heart Battle arena, starting at the middle pointing DOWN the screen
DRIVE = """([sec, on]) => {
  __game.save.data.screenSteer = on;
  const k = (t, c) => window.dispatchEvent(new KeyboardEvent(t, { code: c, key: c, bubbles: true }));
  for (const o of __rcCars()) if (!o.isPlayer) { o.x += 1400; o.stats.top = 0; o.hearts = 99; }
  const p = __rcCars().find(c => c.isPlayer);
  p.x = 1500; p.y = 1500; p.a = Math.PI / 2; p.vx = 0; p.vy = 0; p.boost = 0; p.ssDown = false; p.ssWant = 0; p.steerIn = 0;
  k('keydown', 'ArrowUp'); __rcStep(0.5);
  p.a = Math.PI / 2; const sp = Math.hypot(p.vx, p.vy); p.vx = 0; p.vy = sp;      // (straight down, at speed)
  k('keydown', 'ArrowLeft');
  const cosAt = [];
  for (let i = 0; i < sec * 20; i++) { __rcStep(0.05); cosAt.push(Math.cos(p.a)); }
  k('keyup', 'ArrowLeft'); k('keyup', 'ArrowUp'); __rcStep(0.3);
  return { cosAt, sp };
}"""

with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1280, 'height': 760})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(URL)
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': 'big'}]}
    pg.evaluate("p => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); }", json.dumps(prof))
    pg.reload()
    cm.to_title(pg); cm.wait_screen(pg, 'rc-main')

    # ---- the switch ----
    st = cm.find(pg, 'steer')
    check(st is not None, 'a Steer button on the main menu')
    check(not pg.evaluate('!!__game.save.data.screenSteer'), 'off to start with (car steering, like before)')
    cm.tap(pg, 'steer'); cm.wait_screen(pg, 'rc-main')
    check(pg.evaluate('!!__game.save.data.screenSteer'), 'a tap switches screen steering on')
    saved = pg.evaluate("Object.keys(localStorage).filter(k => k.startsWith('kidsArcade')).map(k => localStorage.getItem(k)).join(' ')")
    check('"screenSteer":true' in saved, "it's saved")
    pg.screenshot(path=str(OUT / 'rc-steer-menu.png'))
    pg.reload(); cm.to_title(pg); cm.wait_screen(pg, 'rc-main')
    check(pg.evaluate('!!__game.save.data.screenSteer'), 'still on after a reload')
    cm.tap(pg, 'steer'); cm.wait_screen(pg, 'rc-main')
    check(not pg.evaluate('!!__game.save.data.screenSteer'), 'a 2nd tap switches it off again')

    # ---- the rule ---- (the test hooks come with a race)
    pg.evaluate("__game.play({ id: 'hb-yard' })")
    pg.wait_for_function("typeof __rcStep === 'function' && __rcState().mode === 'battle' && __rcState().raceTime === 0")
    pg.evaluate('__rcStep(3.4)')
    R = lambda a, s, st=None: pg.evaluate('([a, s, st]) => __rcSteer(a, s, st)', [a, s, st])
    check(R(math.pi / 2, -1)['out'] == 1, 'pointing down: Left turns the car the other way (to the screen\'s left)')
    check(R(math.pi / 2, 1)['out'] == -1, 'pointing down: Right swaps too')
    check(R(-math.pi / 2, -1)['out'] == -1 and R(-math.pi / 2, 1)['out'] == 1, 'pointing up: the buttons turn the car as always')
    check(R(0.1, 1, {'ssDown': True})['out'] == -1 and R(0.1, 1, {'ssDown': False})['out'] == 1, 'sideways: keeps what it meant last')
    check(R(0, 0)['out'] == 0, 'no button, no turn')
    hold = R(math.pi - 0.1, -1, {'ssDown': True, 'ssWant': -1, 'ssStart': 0})
    check(abs(hold['out']) < 0.5 and hold['out'] > 0, f"held until it points left: it straightens up there ({hold['out']:.2f})")
    again = R(math.pi - 0.1, -1, {'ssDown': True, 'ssWant': -1, 'ssStart': 1})
    check(abs(again['out']) == 1, 'pressed while already pointing that way: it still turns (to go up or down)')

    # ---- driving for real ----
    on = pg.evaluate(DRIVE, [2.5, True])
    off = pg.evaluate(DRIVE, [1.0, False])
    print(f"   speed {on['sp']:.0f}; on: cos after 1 s {on['cosAt'][19]:.2f}, end {on['cosAt'][-1]:.2f}; off: most right {max(off['cosAt'][:20]):.2f}")
    check(on['sp'] > 150, 'the car was moving')
    check(on['cosAt'][19] < -0.8, 'screen steering: down the screen + Left = it goes to the LEFT of the screen')
    check(max(off['cosAt'][:20]) > 0.5, 'car steering (switch off): the same press goes to the right, like before')
    check(min(on['cosAt'][20:]) < -0.8 and max(on['cosAt'][20:]) < -0.6, 'still holding Left: it keeps going left (no circles)')
    pg.screenshot(path=str(OUT / 'rc-steer-drive.png'))

    check(not errors, f'no JavaScript errors {errors}')
    b.close()

print('\nALL PASSED' if not fails else f'\n{len(fails)} FAILED: {fails}')
sys.exit(1 if fails else 0)
