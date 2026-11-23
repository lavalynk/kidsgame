"""Automated test: Mini RC Racers "feel and look" (Keith's RC plan #3, Nov 21).

Run:  python3 tests/test_rc_feel.py
Checks:
  * drifting: holding a full turn at speed starts a drift, the sparks go blue -> orange -> pink,
    straightening up gives a boost (+ "Zoom!"); a quick tap or a slow turn never drifts;
    computer cars never drift; little kids can drift too
  * the finish-line party: 1st place = fireworks, a donut, the camera comes in close, rivals smile,
    a gold trophy; results = the big podium picture (no stars row under it)
  * 4th place: no party, a gentle "Nice try!"
Screenshots land in tests/out/.
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

def open_rc(pg, age='big'):
    pg.goto(URL)
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': age}]}
    pg.evaluate("p => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); }", json.dumps(prof))
    pg.reload(); pg.wait_for_timeout(400)
    vw = pg.viewport_size
    pg.mouse.click(vw['width'] // 2, vw['height'] // 2); pg.wait_for_timeout(700)

def play(pg, lid, mode):
    pg.evaluate(f"__game.play({{ id: '{lid}' }})")
    pg.wait_for_function(f"typeof __rcStep === 'function' && __rcState().mode === '{mode}' && __rcState().raceTime === 0")
    pg.evaluate('__rcStep(3.4)')

# keys pressed and stepped inside one JS call, so the real-time game loop can't sneak in.
# The open Heart Battle arena is one big round road: room to drift in circles.
DRIFT = """(hold) => {
  const k = (t, c) => window.dispatchEvent(new KeyboardEvent(t, { code: c, key: c, bubbles: true }));
  const P = () => __rcCars().find(c => c.isPlayer);
  for (const o of __rcCars()) if (!o.isPlayer) { o.x += 1400; o.stats.top = 0; }   // (rivals out of the way)
  const p = P(); p.x = 1500; p.y = 1500; p.vx = p.vy = 0; p.boost = 0;
  k('keydown', 'ArrowUp'); __rcStep(1.6);
  const fast = Math.hypot(p.vx, p.vy);
  k('keydown', 'ArrowRight');
  let maxLv = 0, on = false, colors = [];
  for (let i = 0; i < hold * 30; i++) { __rcStep(1 / 30); const d = __rcState().drift; if (d && d.on) on = true; if (d && d.lv > maxLv) { maxLv = d.lv; colors.push(d.lv); } }
  const before = __rcState().drift;
  k('keyup', 'ArrowRight'); __rcStep(0.05);
  const after = __rcState().drift, boost = P().boost;
  k('keyup', 'ArrowUp'); __rcStep(0.5);
  return { fast, on, maxLv, colors, before, after, boost, rivalsDrift: __rcCars().some(c => !c.isPlayer && c.drift) };
}"""

with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1280, 'height': 760})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    open_rc(pg)

    # ---- drifting ----
    play(pg, 'hb-yard', 'battle')
    pg.evaluate("for (const o of __rcCars()) o.hearts = 99")    # (nobody gets knocked out while we test)
    r = pg.evaluate(DRIFT, 2.6)
    check(r['fast'] > 250, f"up to speed first ({r['fast']:.0f})")
    check(r['on'], 'holding a full turn at speed starts a drift')
    check(r['maxLv'] == 3 and r['colors'] == [1, 2, 3], f"the sparks go blue -> orange -> pink ({r['colors']})")
    check(not r['after']['on'] and r['boost'] > 0.5, f"straightening up = a boost ({r['boost']:.2f})")
    check(r['after']['boosts'] == 1, 'one drift boost counted')
    check(not r['rivalsDrift'], 'computer cars never drift')
    pg.screenshot(path=str(OUT / 'rc-drift.png'))

    # a short hold: drifting, but no sparks yet = no boost
    r = pg.evaluate(DRIFT, 0.4)
    check(r['maxLv'] == 0 and r['boost'] < 0.05, f"a short drift (no sparks yet) gives no boost ({r['maxLv']}, {r['boost']:.2f})")
    # a quick tap is only a nudge: no drift
    tap = pg.evaluate("""(() => {
      const k = (t, c) => window.dispatchEvent(new KeyboardEvent(t, { code: c, key: c, bubbles: true }));
      k('keydown', 'ArrowUp'); __rcStep(1);
      let on = false;
      for (let i = 0; i < 6; i++) { k('keydown', 'ArrowRight'); __rcStep(0.08); on = on || __rcState().drift.on; k('keyup', 'ArrowRight'); __rcStep(0.3); on = on || __rcState().drift.on; }
      k('keyup', 'ArrowUp'); return on; })()""")
    check(not tap, 'quick taps never start a drift')
    # slow: turning while crawling never drifts
    slow = pg.evaluate("""(() => {
      const k = (t, c) => window.dispatchEvent(new KeyboardEvent(t, { code: c, key: c, bubbles: true }));
      const p = __rcCars().find(c => c.isPlayer); p.vx = p.vy = 0;
      k('keydown', 'ArrowUp'); k('keydown', 'ArrowRight'); let on = false;
      for (let i = 0; i < 20; i++) { __rcStep(0.02); on = on || __rcState().drift.on; }
      k('keyup', 'ArrowRight'); k('keyup', 'ArrowUp'); return on; })()""")
    check(not slow, 'a slow turn from a standstill never drifts')

    # little kids: the car drives itself; holding a turn still drifts
    open_rc(pg, 'little')
    play(pg, 'hb-yard', 'battle')
    pg.evaluate("for (const o of __rcCars()) o.hearts = 99")
    r = pg.evaluate(DRIFT, 2.0)
    check(r['on'] and r['maxLv'] >= 2 and r['boost'] > 0.3, f"little kids can drift too (lv {r['maxLv']}, boost {r['boost']:.2f})")

    # ---- the finish-line party: 1st place ----
    open_rc(pg)
    play(pg, 't1', 'free')
    pg.evaluate("__rcAuto(true); __rcCars().find(c => c.isPlayer).stats.top *= 1.5")
    for _ in range(60):
        pg.evaluate('__rcStep(2)')
        if pg.evaluate('__rcState().finished'): break
    pg.evaluate('__rcStep(1.3)')
    st = pg.evaluate('__rcState()')
    check(st['party'] and st['party']['won'], f"1st place: a party ({st['party']})")
    check(st['party']['pops'] >= 3, f"fireworks pop ({st['party']['pops']})")
    check(st['zoom'] > 1.1, f"the camera comes in close ({st['zoom']:.2f})")
    check(pg.evaluate("__rcCars().filter(c => !c.isPlayer).every(c => c.mood && c.mood.kind === 'happy')"), 'the rivals smile at the winner')
    a0 = pg.evaluate("__rcCars().find(c => c.isPlayer).a"); pg.evaluate('__rcStep(0.5)'); a1 = pg.evaluate("__rcCars().find(c => c.isPlayer).a")
    check(abs(a1 - a0) > 0.6, f"the winner spins a happy donut ({a1 - a0:.2f} rad in 0.5 s)")
    pg.screenshot(path=str(OUT / 'rc-party.png'))
    pg.evaluate('__rcStep(3)')
    pg.wait_for_function("ArcadeMenus.isOpen && ArcadeMenus.screen() === 'results'", timeout=8000)
    pg.wait_for_timeout(900)
    rows = pg.evaluate("ArcadeMenus.current().rows.map(r => r.kind || r.t)")
    check(rows[0] == 'podium' and 'stars' not in rows, f"results: the big podium, no stars row ({rows})")
    svg = pg.evaluate("ArcadeMenus.current().rows[0].items[0]")
    check('#ffc93c' in svg and svg.count('<path') > 10, 'the podium has a crown + bunting')
    check(pg.evaluate("ArcadeMenus.current().rows[0].size") >= 300, 'the podium picture is big')
    # (Nov 23: screen.fit: the podium shrinks a little so the results never need scrolling on a computer)
    check(not pg.evaluate("ArcadeMenus.scroller.isOverflow"), 'results: fit without scrolling')
    pg.screenshot(path=str(OUT / 'rc-podium-win.png'))
    # every button still on the screen (nothing scrolled away)
    vh = pg.viewport_size['height']
    check(all(i['y'] + i['h'] <= vh for i in pg.evaluate('ArcadeMenus.list()')), 'results: every button fits on the screen')

    # ---- 4th place: no party ----
    pg.evaluate("__game.play({ id: 't1' })")
    pg.wait_for_function("__rcState().raceTime === 0 && !__rcState().finished")
    pg.evaluate("__rcStep(3.4); __rcAuto(true); __rcCars().find(c => c.isPlayer).stats.top *= 0.5")
    for _ in range(80):
        pg.evaluate('__rcStep(2)')
        if pg.evaluate('__rcState().finished'): break
    pg.evaluate('__rcStep(0.8)')
    st = pg.evaluate('__rcState()')
    check(st['party'] is None or (not st['party']['won'] and st['party']['pops'] == 0), f"4th: no fireworks ({st['party']})")
    pg.evaluate('__rcStep(3)')
    pg.wait_for_function("ArcadeMenus.isOpen && ArcadeMenus.screen() === 'results'", timeout=8000)
    pg.wait_for_timeout(700)
    pg.screenshot(path=str(OUT / 'rc-podium-4th.png'))
    check(pg.evaluate("ArcadeMenus.current().banner") == 'Nice try!', 'a gentle "Nice try!"')

    # ---- phone, sideways (the least room): the winner's podium still fits ----
    ph = b.new_page(viewport={'width': 844, 'height': 390}, is_mobile=True, has_touch=True)
    ph.on('pageerror', lambda e: errors.append(str(e)))
    open_rc(ph)
    play(ph, 't1', 'free')
    ph.evaluate("__rcAuto(true); __rcCars().find(c => c.isPlayer).stats.top *= 1.5")
    for _ in range(60):
        ph.evaluate('__rcStep(2)')
        if ph.evaluate('__rcState().finished'): break
    ph.evaluate('__rcStep(5)')
    ph.wait_for_function("ArcadeMenus.isOpen && ArcadeMenus.screen() === 'results'", timeout=8000)
    ph.wait_for_timeout(900)
    ph.screenshot(path=str(OUT / 'rc-podium-phone.png'))
    check(all(i['y'] + i['h'] <= 390 for i in ph.evaluate('ArcadeMenus.list()')), 'phone (sideways): every results button fits')
    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print(f'\n{len(fails)} failed' if fails else '\nall passed')
sys.exit(1 if fails else 0)
