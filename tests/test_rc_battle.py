"""Automated test: Mini RC Racers - Heart Battle (Keith, Nov 19).

Run:  python3 tests/test_rc_battle.py
Checks:
  * the main menu has a Heart Battle tile -> 3 arenas
  * a battle starts with 4 cars, 4 hearts each, 4 bumpers, gift boxes; car powers that would make
    a car unbeatable (Ghost Car) are switched off in the arena
  * a boosting car that bumps another knocks off a heart; a plain bump doesn't; a shield blocks it
  * a bubble aimed at a car pops one heart; a blinking car can't lose another one straight away
  * the ring of flowers closes in and keeps every car inside
  * a lost heart -> a heart to pick up appears; driving over it gives the heart back
  * out of hearts = poof (the car leaves); last car left wins: results, a house coin the first time
  * out yourself = "Nice try!" + Again (starts a fresh battle)
  * little kids: 6 hearts, gentler rivals
  * a whole battle played by the autopilot ends with one winner; phones; no JavaScript errors
Screenshots land in tests/out/ (rc-battle-*.png).
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
ST = lambda pg: pg.evaluate('__rcState()')
BT = lambda pg: pg.evaluate('__rcState().battle')

def open_rc(pg, age='big', data=None):
    pg.goto(URL)
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': age}]}
    pg.evaluate("([p, d]) => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); if (d) localStorage.setItem('kidsArcade.v1', d); }",
                [json.dumps(prof), json.dumps({'games': {'rc': {'data': data}}}) if data else None])
    pg.reload(); pg.wait_for_timeout(400)
    vw = pg.viewport_size
    pg.mouse.click(vw['width'] // 2, vw['height'] // 2); pg.wait_for_timeout(700)

def battle(pg, arena='hb-yard', go=True):
    pg.evaluate(f"__game.play({{ id: '{arena}' }})")
    pg.wait_for_function(f"typeof __rcStep === 'function' && __rcState().mode === 'battle' && __rcState().track === '{arena}' && __rcState().raceTime === 0")
    if go: pg.evaluate('__rcStep(3.4)')

# put two cars somewhere: a = [x, y, angle, speed], b likewise (offsets from the arena's middle)
PLACE = """([na, a, nb, b]) => { const [mx, my] = __rcBattle.mid, cs = __rcCars();
  for (const [n, p] of [[na, a], [nb, b]]) { const c = cs.find(o => o.name === n); c.x = mx + p[0]; c.y = my + p[1]; c.a = p[2]; c.vx = Math.cos(p[2]) * p[3]; c.vy = Math.sin(p[2]) * p[3];
    c.boost = 0; c.shield = 0; c.ghost = 0; c.star = 0; c.item = null; c.ai && (c.ai.t = 99); }
  for (const c of cs) if (c.name !== na && c.name !== nb) { c.x = mx - 700; c.y = my + (cs.indexOf(c) * 120 - 200); c.vx = c.vy = 0; } }"""
HEARTS = lambda pg, n: pg.evaluate(f"__rcState().battle.hearts[{json.dumps(n)}]")

with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('pageerror', lambda e: errors.append(str(e)))

    # ---- menu
    open_rc(pg, data={'booWins': 10, 'style': 'ghostcar'})
    check(pg.locator('[data-menu=battle]').count() == 1, 'main menu: a Heart Battle tile')
    pg.click('[data-menu=battle]'); pg.wait_for_timeout(300)
    check(pg.locator('[data-arena]').count() == 3, 'Heart Battle: 3 arenas to pick')
    pg.screenshot(path=str(OUT / 'rc-battle-menu.png'))
    pg.click('[data-arena=hb-snow]')
    pg.wait_for_function("typeof __rcStep === 'function' && __rcState().mode === 'battle'")
    st = ST(pg); bt = st['battle']
    check(st['track'] == 'hb-snow' and len(bt['left']) == 4 and all(v == 4 for v in bt['hearts'].values()), 'battle: 4 cars, 4 hearts each')
    check(bt['bumpers'] == 4 and bt['boxes'] >= 10 and st['style'] == 'ghostcar' and bt['perk'] is None, 'bumpers + gift boxes; the Ghost Car keeps its look but not its power')
    pg.screenshot(path=str(OUT / 'rc-battle-start.png'))

    # ---- bumps
    battle(pg)
    pg.evaluate(PLACE, ['You', [0, 0, 0, 380], 'Grape', [70, 0, 0, 0]])
    pg.evaluate('__rcStep(0.3)')
    check(HEARTS(pg, 'Grape') == 4 and HEARTS(pg, 'You') == 4, 'a plain bump: nobody loses a heart')
    pg.evaluate(PLACE, ['You', [0, 0, 0, 380], 'Grape', [70, 0, 0, 0]])
    pg.evaluate("__rcCars().find(c => c.isPlayer).boost = 1")
    pg.evaluate('__rcStep(0.3)')
    check(HEARTS(pg, 'Grape') == 3 and HEARTS(pg, 'You') == 4, 'a boosting car bumps another: one heart off')
    pg.evaluate(PLACE, ['You', [0, 0, 0, 380], 'Grape', [70, 0, 0, 0]])
    pg.evaluate("__rcCars().find(c => c.isPlayer).boost = 1; __rcCars().find(c => c.name === 'Grape').shield = 5")
    pg.evaluate('__rcStep(0.3)')
    check(HEARTS(pg, 'Grape') == 3 and pg.evaluate("__rcCars().find(c => c.name === 'Grape').shield") == 0, 'a shield blocks the hit (and is used up)')

    # ---- bubbles
    pg.evaluate(PLACE, ['You', [-300, 0, 0, 0], 'Mango', [150, 0, 0, 0]])
    pg.evaluate("__rcGive('bubble'); __rcBattle.use()")
    check(pg.evaluate('__rcBattle.bubbles()') == 1, 'Space fires a bubble')
    pg.evaluate('__rcStep(1.5)')
    check(HEARTS(pg, 'Mango') == 3, 'the bubble pops a heart off the car it chased')
    pg.evaluate(PLACE, ['You', [-300, 0, 0, 0], 'Mango', [150, 0, 0, 0]])
    pg.evaluate("__rcCars().find(c => c.name === 'Mango').ghost = 1.5; __rcGive('bubble'); __rcBattle.use(); __rcStep(1.2)")
    check(HEARTS(pg, 'Mango') == 3, 'a car that just lost a heart blinks and is safe for a moment')

    # ---- the ring closes in and keeps everyone inside
    r0 = BT(pg)['ring']
    pg.evaluate('__rcBattle.setTime(70); __rcStep(2)')
    r1 = BT(pg)['ring']
    inside = pg.evaluate("(() => { const [mx, my] = __rcBattle.mid; return __rcCars().every(c => Math.hypot(c.x - mx, c.y - my) <= __rcState().battle.ring); })()")
    check(r1 < r0 - 300 and inside, f'the flowers close in ({r0} -> {r1}) and every car stays inside')
    pg.screenshot(path=str(OUT / 'rc-battle-ring.png'))

    # ---- a heart to pick up
    battle(pg)
    # (the rivals wait at the edge for this bit, so they can't grab the heart first)
    pg.evaluate("__rcCars().filter(c => !c.isPlayer).forEach((c, k) => { c.stats.top = 0; c.stats.accel = 0; c.item = null; c.x = __rcBattle.mid[0] - 800 + k * 60; c.y = __rcBattle.mid[1] - 500; c.vx = c.vy = 0; })")
    pg.evaluate("__rcBattle.hurt('You')")
    check(HEARTS(pg, 'You') == 3, 'test hook: you lost a heart')
    pg.evaluate('__rcStep(13)')
    h = pg.evaluate('__rcBattle.heart()')
    check(h is not None, 'a heart to pick up appears')
    if h:
        # (the rivals may have bubbled you meanwhile, so count from now; blinking keeps you safe for the moment)
        before = HEARTS(pg, 'You')
        pg.evaluate("h => { const p = __rcCars().find(c => c.isPlayer); p.x = h.x; p.y = h.y; p.vx = p.vy = 0; p.ghost = 1.5; }", h)
        pg.evaluate('__rcStep(0.1)')
        check(before < 4 and HEARTS(pg, 'You') == before + 1 and not BT(pg)['heart'], f'drive over it: one heart back ({before} -> {HEARTS(pg, "You")})')

    # ---- knock everyone out: you win
    house0 = pg.evaluate("Arcade.store.load().houseBonus || 0")
    pg.evaluate("__rcBattle.hurt('Grape', 4)")
    bt = BT(pg)
    check(bt['out'] == ['Grape'] and 'Grape' not in bt['left'], 'out of hearts: poof, the car leaves the arena')
    pg.evaluate("__rcBattle.hurt('Mango', 4); __rcBattle.hurt('Bubblegum', 4); __rcStep(3)")
    pg.wait_for_timeout(800)
    st = ST(pg)
    check(st['over'] and 'You won' in pg.inner_text('.ar-panel'), 'last car left: You won!')
    check(st['battle']['order'] == ['You', 'Bubblegum', 'Mango', 'Grape'], f"results order: you, then the last ones out ({st['battle']['order']})")
    data = pg.evaluate("Arcade.store.load().games.rc.data")
    check(data.get('battleWins') == 1 and data.get('battleWon', {}).get('hb-yard') and pg.evaluate("Arcade.store.load().houseBonus") == house0 + 1, 'the win is saved + 1 house coin')
    pg.screenshot(path=str(OUT / 'rc-battle-win.png'))
    # a second win in the same arena: no second coin
    battle(pg)
    pg.evaluate("__rcBattle.hurt('Grape', 4); __rcBattle.hurt('Mango', 4); __rcBattle.hurt('Bubblegum', 4); __rcStep(3)"); pg.wait_for_timeout(800)
    check(pg.evaluate("Arcade.store.load().houseBonus") == house0 + 1, 'the house coin only comes once per arena')

    # ---- out yourself: Nice try + Again
    battle(pg)
    pg.evaluate("__rcBattle.hurt('Grape', 4); __rcBattle.hurt('You', 4); __rcStep(3)"); pg.wait_for_timeout(800)
    st = ST(pg)
    check(st['over'] and st['battle']['order'][-2:] == ['You', 'Grape'], 'you poofed: 3rd of 4')
    check(pg.locator('.ar-panel .ar-btn', has_text='Again').count() == 1, 'results: an Again button')
    pg.screenshot(path=str(OUT / 'rc-battle-out.png'))
    pg.click('.ar-panel .ar-btn:has-text("Again")')
    pg.wait_for_function("__rcState().mode === 'battle' && __rcState().raceTime === 0 && !__rcState().over")
    check(len(BT(pg)['left']) == 4, 'Again: a fresh battle with all 4 cars')

    # ---- a whole battle on autopilot
    battle(pg, 'hb-candy')
    pg.evaluate('__rcAuto(true)')
    t = 0
    while t < 170 and not ST(pg)['over']:
        pg.evaluate('__rcStep(5)'); t += 5
        if t == 30: pg.screenshot(path=str(OUT / 'rc-battle-play.png'))
    pg.wait_for_timeout(800)
    st = ST(pg)
    check(st['over'] and len(st['battle']['order']) == 4, f'autopilot: a whole battle ends with one winner in {t} s ({st["battle"]["order"][0]})')

    # ---- little kids
    open_rc(pg, age='little')
    battle(pg)
    hs = BT(pg)['hearts']
    top = pg.evaluate("__rcCars().map(c => c.stats.top)")
    check(hs['You'] == 6 and hs['Grape'] == 4 and top[1] < top[0] * 0.9, 'little kids: 6 hearts, slower rivals')

    # ---- phones
    for name, vp in [('phone-wide', {'width': 844, 'height': 390}), ('tablet', {'width': 1024, 'height': 768})]:
        ctx = b.new_context(viewport=vp, has_touch=True, is_mobile=True)
        p = ctx.new_page(); p.on('pageerror', lambda e: errors.append(str(e)))
        open_rc(p)
        p.click('[data-menu=battle]'); p.wait_for_timeout(300)
        boxes = [p.locator(f'[data-arena={a}]').bounding_box() for a in ['hb-yard', 'hb-snow', 'hb-candy']]
        check(all(bx and bx['x'] >= 0 and bx['x'] + bx['width'] <= vp['width'] + 1 and bx['width'] >= 70 for bx in boxes), f'{name}: the 3 arena tiles fit')
        p.screenshot(path=str(OUT / f'rc-battle-{name}-menu.png'))
        battle(p)
        p.evaluate('__rcStep(8)'); p.wait_for_timeout(300)
        p.screenshot(path=str(OUT / f'rc-battle-{name}.png'))
        ctx.close()
    b.close()

if errors: print('JS errors:', errors)
print(f'{len(fails)} failed' if fails else 'ALL PASSED')
sys.exit(1 if fails or errors else 0)
