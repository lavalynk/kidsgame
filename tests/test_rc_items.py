"""Automated test: Mini RC Racers - the Item Book: 24 items + 6 special items = 30 (Keith, Nov 19:
"see all the different pick ups", "special unlockable pickups", "30 items total would be cool").

Run:  python3 tests/test_rc_items.py
Checks:
  * the main menu has an Items button; the book has a card for all 24 items + 6 specials
  * a new player has found nothing: dark "?" cards, 0 / 24, the 6 specials locked with what unlocks them
  * gift boxes you open in a race are counted in the book (rivals' are not)
  * Mega Car unlocks after 5 wins, Freeze Flake after finding 12 items, Firework Party after a Heart Battle win,
    Bubble Dragon after beating Boo, Swap-O after racing your own track, Disco Ball after a cup
  * unlocked specials come out of YOUR gift boxes now and then; the computer cars never get them
  * Mega Car: big, heavy, pushes cars aside; Freeze Flake: the others go slow + slippery; Firework Party:
    one rocket per car, they pop on their car; in Heart Battle a firework takes a heart
  * the 12 newer items work: Pogo Pad / Bubble Trap land on the road, Turbo Trio = 3 boosts, Swap-O swaps
    places, Disco Ball spins the others, Monster Wheels, Glitter Trail, Lucky Dip, Water Balloon, Busy Bee,
    Whirlwind, Bubble Dragon (in races and Heart Battle)
  * no JavaScript errors
Screenshots land in tests/out/ (rc-items-*.png).
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

def play(pg, tid):
    pg.evaluate(f"__game.play({{ id: '{tid}' }})")
    pg.wait_for_function(f"typeof __rcStep === 'function' && __rcState().track === '{tid}' && __rcState().raceTime === 0")
    pg.evaluate('__rcStep(3.4)')
def book(pg):
    pg.evaluate('__game.menu()'); pg.wait_for_timeout(250)
    pg.click('[data-items]'); pg.wait_for_timeout(250)
DATA = '__game.save.data'

with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(URL)
    pg.evaluate("localStorage.clear(); localStorage.setItem('kidsArcade.profiles', JSON.stringify({active: 'p1', list: [{id: 'p1', name: '', pet: 'cat', color: '#ef476f', age: 'big'}]}))")
    pg.reload(); pg.wait_for_timeout(400); pg.mouse.click(640, 360); pg.wait_for_timeout(700)

    # ---- an empty book
    check(pg.locator('[data-items]').count() == 1, 'main menu: an Items button')
    pg.click('[data-items]'); pg.wait_for_timeout(250)
    check(pg.locator('.rc-card').count() == 30, 'the book: 24 items + 6 specials = 30')
    check(pg.locator('[data-found]').get_attribute('data-found') == '0' and pg.locator('.rc-card.unknown').count() == 30, 'a new player: 0 / 24, every card a "?"')
    check(pg.locator('.rc-card.locked').count() == 6 and 'Win 5 races' in pg.inner_text('[data-item=mega]') and 'Beat Boo' in pg.inner_text('[data-item=dragon]'), 'the 6 specials are locked and say what unlocks them')
    fit = pg.evaluate("(() => { const p = [...document.querySelectorAll('.ar-panel')].find(x => x.offsetParent); return p.scrollHeight <= p.clientHeight + 2; })()")
    check(fit, 'all 30 cards fit on the page (no scrolling)')
    pg.screenshot(path=str(OUT / 'rc-items-empty.png'))

    # ---- items you get in a race go in the book
    play(pg, 't1')
    pg.evaluate('__rcAuto(true)')
    for _ in range(12): pg.evaluate('__rcStep(3)')
    seen = pg.evaluate(f'{DATA}.itemsSeen || {{}}')
    check(sum(seen.values()) >= 1, f'gift boxes you open are counted ({seen})')
    pg.evaluate('__rcItems.roll(50, true)')
    check(pg.evaluate(f'Object.values({DATA}.itemsSeen).reduce((a, b) => a + b, 0)') == sum(seen.values()), "the rivals' gift boxes are not counted")
    pg.evaluate('__rcItems.roll(300)')
    found = pg.evaluate(f"Object.keys({DATA}.itemsSeen).length")
    book(pg)
    check(int(pg.locator('[data-found]').get_attribute('data-found')) >= 12 and pg.locator('.rc-card:not(.unknown)').count() >= 12, f'opening lots of boxes fills the book ({found} kinds)')
    check(pg.locator('[data-item=freeze]:not(.locked)').count() == 1 and 'freeze' in pg.evaluate(f'{DATA}.specials || []'), 'finding 12 items unlocks the Freeze Flake')
    check(pg.locator('[data-item=mega].locked').count() == 1 and pg.locator('[data-item=fireworks].locked').count() == 1 and pg.locator('.rc-card.locked').count() == 5, 'the other 5 specials still locked')
    pg.screenshot(path=str(OUT / 'rc-items-book.png'))

    # ---- unlock the other two
    pg.evaluate(f"(() => {{ const d = {DATA}; d.feats = Object.assign(d.feats || {{}}, {{ wins: 5 }}); d.battleWins = 1; __game.store(); }})()")
    book(pg)
    check(pg.locator('.rc-card.locked').count() == 3, 'Mega Car + Firework Party unlocked, 3 to go')
    pg.evaluate(f"(() => {{ const d = {DATA}; d.feats.myRace = true; d.booWins = 1; d.cupsDone = 1; __game.store(); }})()")
    book(pg)
    check(pg.locator('.rc-card.locked').count() == 0 and len(pg.evaluate(f'{DATA}.specials')) == 6, 'beating Boo, racing your own track and a cup unlock the Bubble Dragon, Swap-O and Disco Ball')

    # ---- specials come out of your gift boxes (not the rivals')
    play(pg, 't1')
    SP = ['mega', 'freeze', 'fireworks', 'dragon', 'swap', 'disco']
    mine = pg.evaluate('__rcItems.roll(1500)'); theirs = pg.evaluate('__rcItems.roll(1500, true)')
    sp = lambda r: sum(r.get(k, 0) for k in SP)
    check(40 <= sp(mine) <= 180 and all(mine.get(k, 0) > 0 for k in SP), f'your gift boxes now and then give a special ({sp(mine)} / 1500)')
    check(sp(theirs) == 0, 'the computer cars never get a special')

    # ---- Mega Car
    pg.evaluate("__rcGive('mega'); __rcExtras.use(); __rcStep(0.5)")
    me = pg.evaluate("(() => { const p = __rcCars().find(c => c.isPlayer); return { mega: p.mega, shield: p.shield }; })()")
    check(me['mega'] > 4 and me['shield'] > 4, 'Mega Car: 5 seconds of big + safe')
    pg.evaluate("""(() => { const cs = __rcCars(), p = cs.find(c => c.isPlayer), o = cs.find(c => c.name === 'Grape');
      o.x = p.x + Math.cos(p.a) * 50; o.y = p.y + Math.sin(p.a) * 50; o.vx = o.vy = 0; o.wob = 0; p.vx = Math.cos(p.a) * 300; p.vy = Math.sin(p.a) * 300; })()""")
    pg.evaluate('__rcStep(0.1)')
    g = pg.evaluate("(() => { const cs = __rcCars(), p = cs.find(c => c.isPlayer), o = cs.find(c => c.name === 'Grape'); return { wob: o.wob, d: Math.hypot(o.x - p.x, o.y - p.y) }; })()")
    check(g['wob'] > 0 and g['d'] >= 50, f'the Mega Car pushes a car aside with a wobble ({g})')
    pg.screenshot(path=str(OUT / 'rc-items-mega.png'))
    pg.evaluate('__rcStep(5)')

    # ---- Freeze Flake
    pg.evaluate("__rcCars().forEach(c => { c.shield = 0; c.star = 0; c.mega = 0; }); __rcGive('freeze'); __rcExtras.use(); __rcStep(0.2)")
    fr = pg.evaluate("__rcCars().map(c => [c.isPlayer, c.frozen || 0])")
    check(all(f > 2 for p, f in fr if not p) and all(f == 0 for p, f in fr if p), f'Freeze Flake: every other car is frozen, not you ({fr})')
    pg.evaluate('__rcStep(3.2)')
    check(all(f == 0 for _, f in pg.evaluate("__rcCars().map(c => [c.isPlayer, c.frozen || 0])")), 'the freeze wears off after 3 seconds')

    # ---- Firework Party (cars placed close in front)
    pg.evaluate("""(() => { const cs = __rcCars(), p = cs.find(c => c.isPlayer); p.vx = p.vy = 0;
      cs.filter(c => !c.isPlayer).forEach((o, i) => { o.x = p.x + Math.cos(p.a) * (250 + i * 60) - Math.sin(p.a) * (i - 1) * 40; o.y = p.y + Math.sin(p.a) * (250 + i * 60) + Math.cos(p.a) * (i - 1) * 40;
        o.vx = o.vy = 0; o.wob = 0; o.spin = 0; o.shield = 0; o.ghost = 0; o.progress = p.progress + 300; }); })()""")
    pg.evaluate("__rcGive('fireworks'); __rcExtras.use(); __rcStep(0.05)")
    check(len([s for s in pg.evaluate('__rcExtras.shots()') if s['kind'] == 'firework']) == 3, 'Firework Party: 3 rockets')
    pg.screenshot(path=str(OUT / 'rc-items-fireworks.png'))
    hit = set()
    for _ in range(15):
        pg.evaluate('__rcStep(0.1)')
        for s in pg.evaluate('__rcExtras.shots()'): hit.update(s['hit'])
        for n, w in pg.evaluate("__rcCars().filter(c => !c.isPlayer).map(c => [c.name, c.wob > 0 || c.spin > 0])"):
            if w: hit.add(n)
    check(len(hit) == 3, f'each rocket pops on its car ({sorted(hit)})')

    # ---- Heart Battle: a firework takes a heart
    pg.evaluate("__game.play({ id: 'hb-yard' })")
    pg.wait_for_function("typeof __rcStep === 'function' && __rcState().mode === 'battle' && __rcState().raceTime === 0")
    pg.evaluate('__rcStep(3.4)')
    pg.evaluate("""(() => { const [mx, my] = __rcBattle.mid, cs = __rcCars(), p = cs.find(c => c.isPlayer); Object.assign(p, { x: mx - 300, y: my, a: 0, vx: 0, vy: 0 });
      cs.filter(c => !c.isPlayer).forEach((o, i) => { Object.assign(o, { x: mx + (i - 1) * 120, y: my - 100, vx: 0, vy: 0, ghost: 0, shield: 0 }); o.stats.top = 0; o.stats.accel = 0; o.item = null; }); })()""")
    pg.evaluate("__rcGive('fireworks'); __rcBattle.use(); __rcStep(2.5)")
    hs = pg.evaluate('__rcState().battle.hearts')
    check(sum(1 for k, v in hs.items() if k != 'You' and v == 3) >= 2, f'Heart Battle: fireworks take hearts ({hs})')

    # ---- the 12 newer items (Nov 19: "30 items total")
    ME = "__rcCars().find(c => c.isPlayer)"
    def fresh(tid='t1'):
        play(pg, tid)
        pg.evaluate("__rcCars().forEach(c => { c.item = null; c.ai && (c.ai.holdT = -99); })")
    def use(it, t=0.05):
        pg.evaluate(f"__rcGive('{it}'); __rcExtras.use(); __rcStep({t})")
    kinds = lambda: [t['kind'] for t in pg.evaluate('__rcExtras.traps()')]

    fresh()
    use('pogopad'); use('bubbletrap')
    check('pogo' in kinds() and 'btrap' in kinds(), f'Pogo Pad + Bubble Trap land on the road behind you ({kinds()})')
    # drive a rival over the pogo pad: up it goes
    pg.evaluate("""(() => { const t = __rcExtras.traps().find(t => t.kind === 'pogo'), o = __rcCars().find(c => c.name === 'Grape');
      Object.assign(o, { x: t.x, y: t.y, vx: 0, vy: 0, air: 0, h: 0, shield: 0, star: 0, ghost: 0 }); })()""")
    pg.evaluate('__rcStep(0.05)')
    check(pg.evaluate("__rcCars().find(c => c.name === 'Grape').air") > 0, 'a car on a Pogo Pad bounces up')

    fresh()
    use('trio')
    a = pg.evaluate(f"[{ME}.item, {ME}.boost > 0]")
    pg.evaluate('__rcExtras.use(); __rcStep(0.05); __rcExtras.use(); __rcStep(0.05)')
    check(a == ['trio', True] and pg.evaluate(f"{ME}.item") is None, f'Turbo Trio: three boosts, one tap each ({a})')

    use('glitter', 1.2)
    check(kinds().count('glitter') >= 4, 'Glitter Trail: sparkles behind you')
    use('grippy')
    check(pg.evaluate(f"{ME}.grippy") > 5, 'Monster Wheels: 6 seconds of big grippy wheels')
    use('lucky')
    check(pg.evaluate(f"{ME}.item") in (None, 'trio'), 'Lucky Dip turns into a surprise item and uses it')

    fresh()
    use('balloon', 1.0)
    check('splash' in kinds(), 'Water Balloon: lands with a splash puddle')
    use('whirl')
    check('whirl' in [s['kind'] for s in pg.evaluate('__rcExtras.shots()')], 'Whirlwind spins away down the road')
    use('bee')
    check('bee' in [s['kind'] for s in pg.evaluate('__rcExtras.shots()')], 'Busy Bee buzzes off')
    hit = False
    for _ in range(40):
        pg.evaluate('__rcStep(0.1)')
        if not any(s['kind'] == 'bee' for s in pg.evaluate('__rcExtras.shots()')): hit = True; break
    lead = pg.evaluate("(() => { const c = __rcCars().slice().sort((a, b) => a.position - b.position)[0]; return [c.name, c.wob, c.spin, c.bubbled || 0]; })()")
    check(hit, f'the bee reaches the car in front ({lead})')

    fresh()
    use('dragon', 1.5)
    check(len(pg.evaluate('__rcBubbles()')) >= 1 or pg.evaluate("__rcCars().some(c => !c.isPlayer && c.bubbled > 0)"), 'Bubble Dragon drops bubbles on the cars')

    fresh()
    st = pg.evaluate(f"(() => {{ const p = {ME}, o = __rcCars().find(c => c.position === p.position - 1); return {{ pos: p.position, other: o && o.name, ox: o && o.x, oy: o && o.y }}; }})()")
    use('swap', 0)
    me = pg.evaluate(f"[{ME}.x, {ME}.y]")
    check(st['other'] and abs(me[0] - st['ox']) < 5 and abs(me[1] - st['oy']) < 5, f"Swap-O: you swap places with the car in front ({st['other']})")

    fresh()
    use('disco')
    spins = pg.evaluate("__rcCars().filter(c => !c.isPlayer).map(c => c.spin > 0)")
    check(all(spins) and pg.evaluate(f"{ME}.disco") > 2, f'Disco Ball: every other car dances ({spins})')
    pg.screenshot(path=str(OUT / 'rc-items-disco.png'))

    # in Heart Battle: a Bubble Trap takes a heart
    pg.evaluate("__game.play({ id: 'hb-yard' })")
    pg.wait_for_function("typeof __rcStep === 'function' && __rcState().mode === 'battle' && __rcState().raceTime === 0")
    pg.evaluate('__rcStep(3.4)')
    pg.evaluate("""(() => { const [mx, my] = __rcBattle.mid, cs = __rcCars(), p = cs.find(c => c.isPlayer); Object.assign(p, { x: mx, y: my, a: 0, vx: 0, vy: 0 });
      cs.filter(c => !c.isPlayer).forEach((o, i) => { Object.assign(o, { x: mx + 600, y: my + (i - 1) * 300, vx: 0, vy: 0, ghost: 0, shield: 0 }); o.stats.top = 0; o.stats.accel = 0; o.item = null; }); })()""")
    pg.evaluate("__rcGive('bubbletrap'); __rcBattle.use(); __rcStep(0.05)")
    pg.evaluate("""(() => { const t = __rcExtras.traps().find(t => t.kind === 'btrap'), o = __rcCars().find(c => c.name === 'Grape');
      Object.assign(o, { x: t.x, y: t.y }); })()""")
    pg.evaluate('__rcStep(0.1)')
    check(pg.evaluate("__rcState().battle.hearts.Grape") == 3, 'Heart Battle: a Bubble Trap takes a heart')
    b.close()

if errors: print('JS errors:', errors)
print(f'{len(fails)} failed' if fails else 'ALL PASSED')
sys.exit(1 if fails or errors else 0)
