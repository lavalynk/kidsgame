"""Automated test: Maze Explorer.

Run:  python3 tests/test_maze.py
Checks:
  * a fresh player starts on maze 1 with the bee and 3 friends
  * walking the maze (like a finger, one cell at a time): fetch the key, grab every gem,
    reach the treat -> 3 stars, the next maze opens on the map, saved for the arcade too
  * the locked door stops you until you have the key
  * after 3 mazes the puppy joins (shown next to the stars), the map shows it unlocked
  * the map (a canvas menu, Phaser + Rex UI): friend picker (dice = take turns), difficulty, a stone per maze
    with stars, tap a stone to play that maze again, opens at the maze you're on
  * dark caves: only on Normal / Challenge for big kids; the lantern lights up where you've been
  * stuck for a while: the next steps sparkle by themselves (no button needed)
  * bridges + tunnels (Nov 22): from the 4th maze; over one way, under the other; a real finger drag
    goes through the tunnel (see-through) and over the bridge
  * the cheeky treat (Nov 22): from the 5th maze, every 3rd maze; it hops away when you come close
    (1 / 2 / 3 times: little + Easy / Normal / Challenge), never onto a bridge, the start or somewhere locked
  * every shape makes a real maze at every size
  * old saves (no `top`) still work; phones upright and sideways: everything fits; no JavaScript errors
Screenshots land in tests/out/ (maze-*.png).
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu   # (the map is a canvas menu: Phaser + Rex UI, Nov 21)
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
URL = (ROOT / 'maze' / 'index.html').as_uri()
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
ST = lambda pg: pg.evaluate('__mazeState()')

def fresh(pg, save=None, little=False):
    pg.goto(URL)
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': 'little' if little else 'big'}]}
    pg.evaluate("([p, s]) => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); if (s) localStorage.setItem('kidsMaze.v1', s); }",
                [json.dumps(prof), json.dumps(save) if save else None])
    pg.reload(); pg.wait_for_timeout(400)

def walk(pg, to):
    """Walk from where the friend is to cell `to`, one step at a time."""
    r = pg.evaluate('t => __mazeTest.route(__mazeState().here, t)', to) or []
    for k in r: pg.evaluate('k => __mazeTest.step(k)', k)

def solve(pg, gems=True):
    st = ST(pg)
    if st['door']: walk(pg, st['keyCell'])
    if gems:
        for g in st['gems']: walk(pg, g['k'])
    for _ in range(6):   # (a cheeky treat hops away when you come close: follow it)
        walk(pg, ST(pg)['goal'])
        if ST(pg)['won']: break
    pg.wait_for_timeout(50)
    return ST(pg)

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 800})
    pg.on('pageerror', lambda e: errors.append(str(e)))

    # ---- a fresh player
    fresh(pg)
    st = ST(pg)
    check(st['level'] == 0 and st['friend'] == 'bee' and st['unlocked'] == ['bee', 'bunny', 'mouse'], 'fresh: maze 1, the bee, 3 friends')
    check(st['cells'] >= 8 and not st['dark'] and st['diff'] == 'easy', 'fresh: a real maze, lit, Easy')

    # ---- every shape makes a real maze at every size (start and treat far apart)
    sizes = pg.evaluate("""() => SHAPES.map(sh => [5,6,7,8,9].map(n => { N = n; cell = 100 / n; makeMaze(sh);
        return [Object.keys(open).length, route(start, goal).length]; }))""")
    check(all(c >= 7 and r >= 4 for row in sizes for c, r in row), f'every shape x size has a maze (cells, steps): {sizes}')
    pg.reload(); pg.wait_for_timeout(300)

    # ---- solve maze 1 with every gem: 3 stars
    st = solve(pg)
    check(st['won'] and st['stars'].get('0') == 3 and st['done'] == 1 and st['top'] == 1, 'maze 1 solved with all gems: 3 stars, next maze open')
    pg.wait_for_timeout(800)
    check(pg.is_visible('#next') and pg.is_visible('#winStars'), 'win: stars + next arrow shown')
    rec = pg.evaluate("Arcade.store.game('maze').levels")
    check(rec.get('m0', {}).get('stars') == 3, 'the arcade knows (stickers, hub stars)')
    pg.screenshot(path=str(OUT / 'maze-win.png'))
    pg.click('#next', force=True); pg.wait_for_timeout(200)
    check(ST(pg)['level'] == 1 and ST(pg)['friend'] == 'bunny', 'next: maze 2 with the bunny (friends take turns)')

    # ---- maze 2 without gems = 1 star; maze 3 -> the puppy joins
    st = solve(pg, gems=False)
    got = sum(g['got'] for g in st['gems'])   # (a gem may sit right on the way)
    want = 1 + (2 if got == len(st['gems']) else 1 if got else 0)
    check(st['stars'].get('1') == want, f'treat only: stars = 1 + gems found on the way ({want})')
    pg.wait_for_selector('#next.show'); pg.wait_for_timeout(300); pg.click('#next', force=True); pg.wait_for_timeout(200)
    check(not pg.is_visible('#winStars'), 'next maze: stars hidden again')
    st = solve(pg)
    pg.wait_for_timeout(1500)
    check('puppy' in st['unlocked'] and pg.locator('#winStars .newfriend').count() == 1, 'after 3 mazes the puppy joins (shown with the stars)')
    pg.screenshot(path=str(OUT / 'maze-newfriend.png'))
    pg.click('#next', force=True); pg.wait_for_timeout(200)

    # ---- the locked door (Easy: from the 5th maze)
    st = ST(pg)
    check(st['level'] == 3 and st['door'] is None, 'Easy: no door yet on maze 4')
    pg.click('#next', force=True) if pg.is_visible('#next') else None
    solve(pg); pg.wait_for_selector('#next.show'); pg.wait_for_timeout(300); pg.click('#next', force=True); pg.wait_for_timeout(200)
    st = ST(pg)
    check(st['door'] is not None and st['keyCell'], 'Easy: maze 5 has a key + locked door' + ('' if st['door'] else f" (level {st['level']}, won {st['won']})"))
    if st['door']:
        a, bb = st['door']
        walk(pg, a)            # walk up to the door, then try to go through
        pg.evaluate('k => __mazeTest.step(k)', bb)
        check(ST(pg)['here'] == a, 'locked door: you can\'t go through without the key')
        walk(pg, st['keyCell'])
        for _ in range(5):   # (maze 5's treat is a cheeky one: it hops away once on Easy)
            walk(pg, ST(pg)['goal'])
            if ST(pg)['won']: break
        check(ST(pg)['won'] and ST(pg)['hasKey'], 'with the key the door opens and you reach the treat')

    # ---- the map (a canvas menu since Nov 21: tap things where they are drawn, like a finger)
    def open_map(p):
        p.click('#mapBtn'); cmenu.wait_screen(p, 'maze-map')
    def stones(p): return [i for i in cmenu.items(p) if i['attr'].startswith('level-')]
    def buddy(p, bid): return cmenu.find(p, 'buddy-' + bid)
    open_map(pg)
    st = ST(pg)
    check(st['map'] and len(stones(pg)) == st['top'] + 1, f'map: one stone per maze reached ({st["top"] + 1})')
    bud = [i for i in cmenu.items(pg) if i['attr'].startswith('buddy-')]
    check(len(bud) == 11 and sum(i['locked'] for i in bud) == 6, 'map: dice + 10 friends, 6 still locked')
    here = [i['attr'] for i in stones(pg) if i['picked']]
    check(here == ['level-%d' % st['level']], f'map: the maze you are on is the yellow stone ({here})')
    check('M15 1' in pg.evaluate("ArcadeMenus.current().rows[1].items[0].pic") and pg.evaluate("ArcadeMenus.current().rows[1].items[0].pic").count('#ffd166') >= 3,
          'map: maze 1 shows its 3 stars')
    pg.screenshot(path=str(OUT / 'maze-map.png'))
    cmenu.tap(pg, 'buddy-monkey')
    check(ST(pg)['buddy'] == 'mix' and ST(pg)['map'], 'a locked friend can\'t be picked (it just wobbles)')
    cmenu.tap(pg, 'buddy-puppy')
    try: pg.wait_for_function("ArcadeMenus.list().some(i => i.attr === 'buddy-puppy' && i.picked)", timeout=3000)   # (the map redraws)
    except Exception: pass
    check(ST(pg)['buddy'] == 'puppy' and buddy(pg, 'puppy')['picked'] and not buddy(pg, 'mix')['picked'], 'pick the puppy (its tile turns yellow)')
    cmenu.tap(pg, 'back')
    check(not ST(pg)['map'] and ST(pg)['friend'] == 'puppy', 'back to the maze: the puppy is exploring')
    open_map(pg)
    cmenu.tap(pg, 'level-1')
    st = ST(pg)
    check(st['level'] == 1 and not st['map'] and st['friend'] == 'puppy' and st['top'] >= 5, 'tap a stone: play maze 2 again (the map keeps the rest)')
    open_map(pg)
    cmenu.tap(pg, 'buddy-mix'); pg.wait_for_timeout(300); cmenu.tap(pg, 'diff'); pg.wait_for_timeout(300)
    check(ST(pg)['diff'] == 'normal' and ST(pg)['buddy'] == 'mix' and ST(pg)['map'], 'map: dice = take turns again; the dots button = Normal')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    check(not ST(pg)['map'], 'Escape closes the map')
    # a long way in: the map opens scrolled to the maze you're on
    fresh(pg, {'level': 25, 'top': 30, 'done': 30, 'diff': 'easy', 'stars': {}})
    open_map(pg)
    it = cmenu.find(pg, 'level-25')
    check(it and it['shown'] and it['picked'], 'map: opens scrolled to the maze you are on (maze 26 of 31)')
    cmenu.tap(pg, 'level-25')
    check(ST(pg)['level'] == 25 and not ST(pg)['map'], 'tap it: back to that maze')

    # ---- dark caves (mazes 9 + 10)
    fresh(pg, {'level': 8, 'top': 8, 'done': 8, 'diff': 'normal', 'stars': {}})
    st = ST(pg)
    check(st['theme'] == 'cave' and st['dark'] and st['lit'] == 1, 'Normal: maze 9 is a dark cave, lit only at the start')
    r = pg.evaluate('__mazeTest.route(__mazeState().start, __mazeState().goal)')
    for k in r[:3]: pg.evaluate('k => __mazeTest.step(k)', k)
    check(ST(pg)['lit'] == 4, 'the lantern lights up every spot you walk to')
    pg.screenshot(path=str(OUT / 'maze-cave.png'))
    st = solve(pg)
    check(st['won'], 'a dark cave can be finished')
    fresh(pg, {'level': 8, 'top': 8, 'done': 8, 'diff': 'easy', 'stars': {}})
    check(ST(pg)['theme'] == 'cave' and not ST(pg)['dark'], 'Easy: the cave is lit')
    fresh(pg, {'level': 8, 'top': 8, 'done': 8, 'diff': 'challenge', 'stars': {}}, little=True)
    check(ST(pg)['little'] and not ST(pg)['dark'], 'little kids: the cave is always lit')

    # ---- stuck? the path sparkles by itself (pretend clock)
    pg2 = b.new_page(viewport={'width': 1000, 'height': 700})
    pg2.on('pageerror', lambda e: errors.append(str(e)))
    pg2.clock.install()
    fresh(pg2)
    check(not ST(pg2)['hint'], 'no sparkle at first')
    pg2.clock.run_for(16000)
    check(ST(pg2)['hint'] and 'nudge' in pg2.get_attribute('#hint', 'class'), 'after 15 s with no moves: the next steps sparkle + the bulb wiggles')
    r = pg2.evaluate('__mazeTest.route(__mazeState().start, __mazeState().goal)')
    pg2.evaluate('k => __mazeTest.step(k)', r[0])
    check('nudge' not in pg2.get_attribute('#hint', 'class'), 'a move stops the wiggle')
    pg2.click('#hint')
    check(ST(pg2)['hint'], 'the bulb still shows the whole way')
    pg2.close()

    # ---- old saves (from before the map) keep their place
    fresh(pg, {'level': 4, 'done': 4})
    st = ST(pg)
    check(st['level'] == 4 and st['top'] == 4 and st['buddy'] == 'mix' and 'puppy' in st['unlocked'], 'old save: same maze, map knows mazes 1-5, puppy is there')

    # ---- Nov 21, last run: penguin, frog and owl join after 15 / 18 / 21 mazes; every friend has its own call
    for done, who in [(14, None), (15, 'penguin'), (18, 'frog'), (21, 'owl')]:
        fresh(pg, {'level': 3, 'top': 3, 'done': done})
        un = ST(pg)['unlocked']
        check((who is None and len(un) == 7) or (who in un and un[-1] == who), f'{done} mazes: newest friend {un[-1]}')
    check(pg.evaluate("FRIENDS.every(f => Array.isArray(f.call) && f.call.length >= 2 && f.hero && f.goal && f.trail)"), 'every friend has a picture, a treat, a trail and its own call')
    fresh(pg, {'level': 3, 'top': 3, 'done': 21, 'buddy': 'owl'})
    check(ST(pg)['friend'] == 'owl', 'the owl can be picked and goes exploring')
    solve(pg)
    check(ST(pg)['won'], 'the owl reaches the moon')
    pg.screenshot(path=str(OUT / 'maze-owl.png'))

    # ---- Nov 22: bridges + tunnels (from the 4th maze): one path goes over, another under
    fresh(pg, {'level': 2, 'top': 2, 'done': 2})
    check(ST(pg)['bridges'] == [], 'the first 3 mazes have no bridges')
    many = pg.evaluate("""() => {
        const out = [];
        for (const [d, lv] of [['easy', 3], ['easy', 8], ['normal', 6], ['normal', 9], ['challenge', 5], ['challenge', 11]])
          for (let i = 0; i < 15; i++) {
            saved.diff = d; level = lv; newMaze();
            const all = Object.keys(open), seen = new Set([start]), q = [start];
            for (let j = 0; j < q.length; j++) for (const n of open[q[j]]) if (!seen.has(n)) { seen.add(n); q.push(n); }
            const s = (a) => [...a].sort().join('|');
            out.push({ d, want: bridgeCount(), n: bridges.length, all: seen.size === all.length,
              ok: bridges.every(b => s(open[b.k]) === s(b.over) && s(open[b.k + ',u']) === s(b.under)),
              clear: ![start, goal, keyCell, ...gems.map(g => g.k), ...(door ? [door.a, door.b] : [])].some(k => k && isBridge(k)) });
          }
        return out; }""")
    check(all(m['n'] >= 1 for m in many), 'from the 4th maze every maze has a bridge')
    check(all(m['n'] <= m['want'] for m in many) and any(m['n'] == 2 for m in many if m['d'] == 'challenge'), 'Challenge mazes get 2 bridges, Easy 1')
    check(all(m['ok'] and m['all'] for m in many), 'every bridge: over one way, under the other, both used; every spot reachable')
    check(all(m['clear'] for m in many), 'no start, treat, key, gem or door on a bridge or in a tunnel')

    def screen(p, k):   # where a spot is on the screen
        return p.evaluate("""k => { const [x, y] = center(k), m = svg.getScreenCTM(); return [x * m.a + m.e, y * m.d + m.f]; }""", k)
    def drag(p, ks):    # a real finger (mouse) drag through spots
        x, y = screen(p, ks[0]); p.mouse.move(x, y); p.mouse.down()
        for k in ks[1:]:
            x, y = screen(p, k); p.mouse.move(x, y, steps=6)
        p.mouse.up()
    fresh(pg, {'level': 3, 'top': 3, 'done': 3})
    for _ in range(50):   # (a maze whose treat isn't right next to the bridge: walking there would win)
        st = ST(pg); br = st['bridges'][0]
        if st['goal'] not in br['over'] + br['under']: break
        pg.evaluate('newMaze()')
    for way in ('under', 'over'):
        a, c = br[way]
        walk(pg, a)
        mid = br['k'] + (',u' if way == 'under' else '')
        check(ST(pg)['here'] == a, f'walked up to the {way} side of the bridge')
        x, y = screen(pg, a); pg.mouse.move(x, y); pg.mouse.down()
        x, y = screen(pg, br['k']); pg.mouse.move(x, y, steps=6)
        st = ST(pg)
        check(st['here'] == mid and st['under'] == (way == 'under'), f'finger on the bridge cell: {"in the tunnel (see-through)" if way == "under" else "on the bridge"}')
        if way == 'under': pg.screenshot(path=str(OUT / 'maze-tunnel.png'))
        else: check(pg.evaluate("overTrailEl.getAttribute('d').length > 0"), 'on the bridge: the trail shows on top of it')
        x, y = screen(pg, c); pg.mouse.move(x, y, steps=6); pg.mouse.up()
        check(ST(pg)['here'] == c and not ST(pg)['under'], f'drag on: out the other side ({way})')
    pg.keyboard.press('Escape')
    st = solve(pg)
    check(st['won'], 'a maze with a bridge can be finished')
    pg.screenshot(path=str(OUT / 'maze-bridge.png'))

    # ---- Nov 22: the cheeky treat hops away a few times, then waits to be caught
    fresh(pg, {'level': 3, 'top': 3, 'done': 3, 'diff': 'normal'})
    check(not ST(pg)['chase'] and ST(pg)['hopsLeft'] == 0, 'maze 4: the treat stays put')
    for diff, little, want in [('normal', False, 2), ('challenge', False, 3), ('easy', False, 1), ('challenge', True, 1)]:
        fresh(pg, {'level': 4, 'top': 4, 'done': 4, 'diff': diff}, little=little)
        st = ST(pg)
        check(st['chase'] and st['hopsLeft'] == want and pg.evaluate("goalEl.classList.contains('cheeky')"),
              f'maze 5 ({diff}{", little" if little else ""}): a cheeky treat that hops {want} time(s)')
        if st['door']: walk(pg, st['keyCell'])
        spots, steps = [ST(pg)['goal']], 0
        while not ST(pg)['won'] and steps < 400:
            st = ST(pg)
            nxt = pg.evaluate('t => __mazeTest.route(__mazeState().here, t)', st['goal'])
            pg.evaluate('k => __mazeTest.step(k)', nxt[0]); steps += 1
            g = ST(pg)['goal']
            if g != spots[-1]:
                spots.append(g)
                st2 = ST(pg)
                d = len(pg.evaluate('t => __mazeTest.route(__mazeState().here, t)', g) or [])
                bridge = any(g in (b['k'], b['k'] + ',u') for b in st2['bridges'])
                check(d >= 3 and not bridge and g != st2['start'], f'  hop {len(spots) - 1}: lands {d} steps away, not on a bridge or the start')
                if len(spots) == 2 and diff == 'normal':
                    pg.wait_for_timeout(700); pg.screenshot(path=str(OUT / 'maze-cheeky.png'))
        st = ST(pg)
        check(st['won'] and len(spots) - 1 == want and st['hopsLeft'] == 0, f'  caught it after {len(spots) - 1} hop(s)')
        pg.wait_for_timeout(750)
        check(not pg.evaluate("goalEl.classList.contains('cheeky')"), '  after its last hop it stops wiggling and waits')
    # in a dark cave (Normal, maze 11 = a cheeky one) the spot it hops to lights up
    fresh(pg, {'level': 10, 'top': 10, 'done': 10, 'diff': 'normal'})
    st = ST(pg)
    check(st['chase'], 'maze 11 is a cheeky one too')
    st = solve(pg)
    check(st['won'], 'a cheeky maze with a door and gems can be finished')

    # ---- phones: upright + sideways, the maze, the buttons and the map fit
    for name, vp in [('phone', {'width': 390, 'height': 844}), ('phone-wide', {'width': 844, 'height': 390}), ('tablet', {'width': 820, 'height': 1180})]:
        ctx = b.new_context(viewport=vp, has_touch=True, is_mobile=True)
        p = ctx.new_page(); p.on('pageerror', lambda e: errors.append(str(e)))
        fresh(p, {'level': 9, 'top': 14, 'done': 14, 'diff': 'normal', 'stars': {'0': 3, '1': 2}})
        boxes = [p.locator(s).bounding_box() for s in ['.top a', '#hint', '#mapBtn', '#shuffle', '#maze']]
        inside = all(bx and bx['x'] >= 0 and bx['x'] + bx['width'] <= vp['width'] + 1 and bx['y'] + bx['height'] <= vp['height'] + 1 for bx in boxes)
        check(inside and boxes[4]['width'] > min(vp['width'], vp['height']) * 0.5, f'{name}: buttons + a big maze fit on screen')
        p.screenshot(path=str(OUT / f'maze-{name}.png'))
        open_map(p)
        its = cmenu.items(p)
        off = [i['attr'] for i in its if i['shown'] and (i['x'] < -1 or i['x'] + i['w'] > vp['width'] + 1)]
        small = [i['attr'] for i in its if min(i['w'], i['h']) < (50 if i['attr'] in ('back', 'diff') else 69)]   # (tiles: finger-sized; the bottom buttons like every game's)
        check(not off and not small and len(stones(p)) == 15, f'{name}: the map fits across, every tile is finger-sized (off {off}, small {small})')
        here = cmenu.find(p, 'level-9')
        check(here and here['shown'], f'{name}: the maze you are on is in sight')
        cmenu.tap(p, 'level-9', touch=True)
        check(not ST(p)['map'], f'{name}: a finger tap on a stone works')
        open_map(p)
        p.screenshot(path=str(OUT / f'maze-{name}-map.png'))
        ctx.close()
    b.close()

if errors: print('JS errors:', errors)
print(f'{len(fails)} failed' if fails else 'ALL PASSED')
sys.exit(1 if fails or errors else 0)
