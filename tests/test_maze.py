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
    walk(pg, ST(pg)['goal'])
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
    pg.wait_for_timeout(700); pg.click('#next', force=True); pg.wait_for_timeout(200)
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
    solve(pg); pg.wait_for_timeout(700); pg.click('#next', force=True); pg.wait_for_timeout(200)
    st = ST(pg)
    check(st['door'] is not None and st['keyCell'], 'Easy: maze 5 has a key + locked door')
    if st['door']:
        a, bb = st['door']
        walk(pg, a)            # walk up to the door, then try to go through
        pg.evaluate('k => __mazeTest.step(k)', bb)
        check(ST(pg)['here'] == a, 'locked door: you can\'t go through without the key')
        walk(pg, st['keyCell']); walk(pg, st['goal'])
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
    check(len(bud) == 8 and sum(i['locked'] for i in bud) == 3, 'map: dice + 7 friends, 3 still locked')
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
