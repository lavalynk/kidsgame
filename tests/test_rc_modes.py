"""Automated test: Mini RC Racers - Coin Rush + Follow the Leader (Nov 20, Keith's RC plan "new ways to play").

Run:  python3 tests/test_rc_modes.py
Checks:
  * the main menu has 10 tiles (5 x 2) incl. Coin Rush + Follow, and they fit on a phone
  * each opens a track picker with all 10 tracks
  * Coin Rush: the clock counts down, coins + big coins + clocks are on the track, driving over a coin
    counts it, a clock adds time, time's up -> results with a medal for the goals, a best score,
    a house coin for the first gold (only once); no gift boxes, no rivals
  * Follow the Leader: Pip drives ahead and drops music notes, notes fade away, driving through a
    note catches it, Pip waits when you're far behind, Pip's 2 laps end the round with stars
  * a whole round of each on autopilot (Coin Rush: gold; Follow: 3 stars with the test's follow-robot)
  * little kids: 90 seconds, Pip slower; a hands-off little kid still catches notes
  * playing these modes doesn't count as race wins (no Mega Car unlock from Coin Rush)
  * phones; no JavaScript errors
Screenshots land in tests/out/ (rc-modes-*.png).
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
import cmenu as cm
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
URL = (ROOT / 'rc' / 'index.html').as_uri()
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
ST = lambda pg: pg.evaluate('__rcState()')

def open_rc(pg, age='big', data=None):
    pg.goto(URL)
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': age}]}
    pg.evaluate("([p, d]) => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); if (d) localStorage.setItem('kidsArcade.v1', d); }",
                [json.dumps(prof), json.dumps({'games': {'rc': {'data': data}}}) if data else None])
    pg.reload(); pg.wait_for_timeout(400)
    vw = pg.viewport_size
    pg.mouse.click(vw['width'] // 2, vw['height'] // 2); pg.wait_for_timeout(700)

def start(pg, lid, go=True):
    mode = 'rush' if lid.startswith('cr') else 'follow'
    pg.evaluate(f"__game.play({{ id: '{lid}' }})")
    pg.wait_for_function(f"typeof __rcStep === 'function' && __rcState().mode === '{mode}' && __rcState().track === '{lid[3:]}' && __rcState().raceTime === 0 && !__rcState().over")
    if go: pg.evaluate('__rcStep(3.4)')

def play_out(pg, limit=200):
    t = 0
    while t < limit and not ST(pg)['over']:
        pg.evaluate('__rcStep(4)'); t += 4
    pg.wait_for_timeout(800)
    return t

# put your car on a spot, stopped
PUT = "([x, y]) => { const c = __rcCars()[0]; c.x = x; c.y = y; c.vx = c.vy = 0; }"

with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('pageerror', lambda e: errors.append(str(e)))

    # ---- menus
    open_rc(pg)
    cm.wait_screen(pg, 'rc-main')
    check(cm.count(pg, '[data-menu]') == 10, 'main menu: 10 tiles')
    check(cm.count(pg, '[data-menu=rush]') == 1 and cm.count(pg, '[data-menu=follow]') == 1, 'main menu: Coin Rush + Follow tiles')
    pg.screenshot(path=str(OUT / 'rc-modes-menu.png'))
    cm.click(pg, '[data-menu=rush]'); pg.wait_for_timeout(300)
    cm.wait_screen(pg, 'rc-play-rush')
    check(cm.count(pg, '[data-track^=cr-]') == 10, 'Coin Rush: 10 tracks to pick')
    pg.screenshot(path=str(OUT / 'rc-modes-rush-menu.png'))
    cm.click(pg, '[data-back]'); cm.wait_screen(pg, 'rc-main')
    cm.click(pg, '[data-menu=follow]'); pg.wait_for_timeout(300)
    cm.wait_screen(pg, 'rc-play-follow')
    check(cm.count(pg, '[data-track^=fl-]') == 10, 'Follow the Leader: 10 tracks to pick')
    pg.screenshot(path=str(OUT / 'rc-modes-follow-menu.png'))
    cm.click(pg, '[data-track=fl-t2]')
    pg.wait_for_function("typeof __rcStep === 'function' && __rcState().mode === 'follow' && __rcState().track === 't2'")

    # ---- Coin Rush
    start(pg, 'cr-t1', go=False)
    st = ST(pg); r = st['rush']
    kinds = pg.evaluate("__rcRush().reduce((o, c) => (o[c.kind] = (o[c.kind] || 0) + 1, o), {})")
    check(r['left'] == 60 and r['got'] == 0 and len(st['racers']) == 1 and st['boxes'] == 0, 'Coin Rush: 60 s, just you, no gift boxes')
    check(kinds.get('coin', 0) > 60 and kinds.get('big', 0) >= 4 and kinds.get('clock') == 2, f'Coin Rush: coins, big coins and 2 clocks on the track {kinds}')
    pg.evaluate('__rcStep(3.4)')
    left = ST(pg)['rush']['left']
    pg.evaluate('__rcStep(2)')
    check(abs(left - ST(pg)['rush']['left'] - 2) < 0.1, 'the clock counts down')
    # a coin
    c0 = pg.evaluate("(() => { const c = __rcRush().find(c => c.kind === 'coin' && !c.up && c.t <= 0); return [c.x, c.y]; })()")
    pg.evaluate(PUT, c0); pg.evaluate('__rcStep(0.05)')
    check(ST(pg)['rush']['got'] >= 1, 'drive over a coin: it counts')
    got = ST(pg)['rush']['got']
    big = pg.evaluate("(() => { const c = __rcRush().find(c => c.kind === 'big' && !c.up && c.t <= 0); return [c.x, c.y]; })()")
    pg.evaluate(PUT, big); pg.evaluate('__rcStep(0.05)')
    check(ST(pg)['rush']['got'] >= got + 5, 'a big coin: +5')
    left = ST(pg)['rush']['left']
    clk = pg.evaluate("(() => { const c = __rcRush().find(c => c.kind === 'clock' && !c.up); return [c.x, c.y]; })()")
    pg.evaluate(PUT, clk); pg.evaluate('__rcStep(0.05)')
    check(ST(pg)['rush']['left'] > left + 4, 'a clock: +5 seconds')
    pg.evaluate('__rcStep(0.05)')
    check(ST(pg)['rush']['clocks'] == 1, '...and it is gone for a while (not taken twice)')
    pg.screenshot(path=str(OUT / 'rc-modes-rush.png'))

    # a whole Coin Rush on autopilot: gold, best saved, a house coin (once)
    house0 = pg.evaluate("Arcade.store.load().houseBonus || 0")
    feats0 = pg.evaluate("JSON.stringify((__game.save.data.feat || {}).wins || 0)")
    # (the autopilot's luck varies a little: it gets up to 3 tries at gold)
    for tries in range(3):
        start(pg, 'cr-t1')
        pg.evaluate('__rcAuto(true)')
        pg.evaluate('__rcStep(20)'); pg.screenshot(path=str(OUT / 'rc-modes-rush-play.png'))
        play_out(pg)
        st = ST(pg)
        if st['rush']['got'] >= st['rush']['goal'][2]: break
    goal = st['rush']['goal']
    check(st['over'] and st['rush']['left'] == 0, f"Coin Rush: time's up ends the round ({st['rush']['got']} coins, goals {goal})")
    check(st['rush']['got'] >= goal[2], 'autopilot (a good driver) gets gold')
    cm.wait_screen(pg, 'results')
    check(cm.find(pg, 'again') is not None, 'results: an Again button')
    pg.wait_for_timeout(1500); pg.screenshot(path=str(OUT / 'rc-modes-rush-done.png'))
    best = pg.evaluate("__game.save.data.rushBest && __game.save.data.rushBest.t1")
    check(best >= st['rush']['got'], 'best score saved')
    check(pg.evaluate("Arcade.store.load().houseBonus || 0") == house0 + 1, 'first gold on a track: a house coin')
    check(pg.evaluate("JSON.stringify((__game.save.data.feat || {}).wins || 0)") == feats0, "a Coin Rush doesn't count as a race win")
    cm.tap(pg, 'again')
    pg.wait_for_function("__rcState().mode === 'rush' && __rcState().raceTime === 0 && !__rcState().over")
    check(ST(pg)['rush']['got'] == 0, 'Again: a fresh Coin Rush')
    pg.evaluate('__rcStep(3.4)'); pg.evaluate('__rcAuto(true)'); play_out(pg)
    check(pg.evaluate("Arcade.store.load().houseBonus || 0") == house0 + 1, 'the house coin only comes once per track')

    # ---- Follow the Leader
    start(pg, 'fl-t3', go=False)
    st = ST(pg); f = st['follow']
    check(len(st['racers']) == 1 and st['boxes'] == 0 and f['pip'] > st['player']['progress'] + 100, 'Follow: just you, Pip waits ahead of you')
    pg.evaluate('__rcStep(3.4)')
    pg.evaluate('__rcStep(3)')
    f = ST(pg)['follow']
    check(f['dropped'] >= 4 and f['notes'] >= 4, f"Pip drives off and drops music notes ({f['dropped']})")
    pg.screenshot(path=str(OUT / 'rc-modes-follow.png'))
    pg.evaluate('__rcStep(6)')       # you stand still: the old notes fade, Pip slows down and waits
    f = ST(pg)['follow']
    check(f['notes'] < f['dropped'], 'notes fade away after a while')
    check(f['rate'] < 0.3, f"you're far behind: Pip waits ({f['rate']})")
    start(pg, 'fl-t3'); pg.evaluate('__rcStep(2)')
    got = ST(pg)['follow']['got']
    n = pg.evaluate("(() => { const n = __rcFollow.notes().filter(n => !n.up).slice(-1)[0]; return [n.x, n.y]; })()")
    pg.evaluate(PUT, n); pg.evaluate('__rcStep(0.05)')
    check(ST(pg)['follow']['got'] == got + 1, 'drive through a note: caught!')

    # a whole round with the follow-robot: 3 stars
    start(pg, 'fl-t3')
    pg.evaluate('__rcAuto(true)')
    pg.evaluate('__rcStep(15)'); pg.screenshot(path=str(OUT / 'rc-modes-follow-play.png'))
    play_out(pg)
    st = ST(pg); f = st['follow']
    check(st['over'] and f['t'] >= f['end'] - 0.1, f"Pip's 2 laps end the round ({f['got']}/{f['dropped']} notes)")
    check(f['stars'] == 3, 'the follow-robot gets 3 stars')
    pg.wait_for_timeout(1500); pg.screenshot(path=str(OUT / 'rc-modes-follow-done.png'))
    check(pg.evaluate("__game.save.data.followBest && __game.save.data.followBest.t3") > 0.85, 'best saved')
    # standing still the whole time: Nice try (Pip waits, then the round still ends)
    start(pg, 'fl-t1')
    play_out(pg, 400)
    st = ST(pg)
    check(st['over'] and st['follow']['stars'] == 0, f"never moving: the round still ends, 0 stars ({st['follow']['t']} s)")

    # ---- little kids
    open_rc(pg, age='little')
    start(pg, 'cr-t4')
    check(ST(pg)['rush']['left'] > 89, 'little kids: 90 seconds')
    start(pg, 'fl-t4')
    play_out(pg)          # hands off: the car drives itself and stays behind Pip
    f = ST(pg)['follow']
    check(f['stars'] >= 1, f"little kids, hands off: still catches notes ({f['got']}/{f['dropped']})")

    # ---- phones
    for name, vp in [('phone-wide', {'width': 844, 'height': 390}), ('phone-tall', {'width': 390, 'height': 844}), ('tablet', {'width': 1024, 'height': 768})]:
        ctx = b.new_context(viewport=vp, has_touch=True, is_mobile=True)
        p = ctx.new_page(); p.on('pageerror', lambda e: errors.append(str(e)))
        open_rc(p)
        cm.wait_screen(p, 'rc-main')
        boxes = [i for i in cm.items(p) if i['attr'].startswith('menu-')]
        # (side to side they fit; up and down the menu scrolls when it has to: canvas menus, Nov 21)
        check(len(boxes) == 10 and all(bx['x'] >= 0 and bx['x'] + bx['w'] <= vp['width'] + 1 for bx in boxes) and boxes[0]['shown'], f'{name}: the 10 menu tiles fit')
        p.screenshot(path=str(OUT / f'rc-modes-{name}-menu.png'))
        cm.click(p, '[data-menu=rush]'); p.wait_for_timeout(300)
        cm.wait_screen(p, 'rc-play-rush')
        bx = [i for i in cm.items(p) if i['attr'].startswith('track-cr-')]
        check(len(bx) == 10 and all(i['x'] >= 0 and i['x'] + i['w'] <= vp['width'] + 1 for i in bx), f'{name}: all 10 tracks fit')
        p.screenshot(path=str(OUT / f'rc-modes-{name}-tracks.png'))
        if name != 'phone-tall':
            start(p, 'fl-t5'); p.evaluate('__rcAuto(true)'); p.evaluate('__rcStep(8)'); p.wait_for_timeout(300)
            p.screenshot(path=str(OUT / f'rc-modes-{name}-follow.png'))
        ctx.close()
    b.close()

if errors: print('JS errors:', errors)
print(f'{len(fails)} failed' if fails else 'ALL PASSED')
sys.exit(1 if fails or errors else 0)
