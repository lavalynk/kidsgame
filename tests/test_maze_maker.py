"""Automated test: the Maze Maker (Maze Explorer, Nov 22).

Run:  python3 tests/test_maze_maker.py
Checks:
  * the map has 3 "My mazes" tiles; tapping one opens the maker (an empty board, play button dim)
  * a real finger drag digs a path from dot to dot (also round a corner), the eraser rubs it out, undo works
  * the friend / treat / gem buttons place things with a tap (then back to digging)
  * play lights up once the friend can reach the treat; playing it: walk the maze, win, stars, nothing saved
    for the real mazes (no stars, done count or friends); the arrow goes back to the maker
  * the made maze is saved (still there after a reload) and its picture is on the map tile
  * the dice makes a whole maze that can be played; the colors button; start again
  * desktop, phone upright + sideways: the board and every button fit on the screen; no JavaScript errors
Screenshots land in tests/out/ (maze-maker-*.png).
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
URL = (ROOT / 'maze' / 'index.html').as_uri()
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
MK = lambda pg: pg.evaluate('__mazeMaker.state()')
ST = lambda pg: pg.evaluate('__mazeState()')

def fresh(pg, little=False):
    pg.goto(URL)
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': 'little' if little else 'big'}]}
    pg.evaluate("p => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); }", json.dumps(prof))
    pg.reload(); pg.wait_for_timeout(400)

def open_maker(pg, slot=0):
    pg.click('#mapBtn'); cmenu.wait_screen(pg, 'maze-map')
    cmenu.tap(pg, 'make'); cmenu.wait_screen(pg, 'maze-mine')
    cmenu.tap(pg, f'made-{slot}'); pg.wait_for_timeout(300)

def drag(pg, cells, touch=False):
    """A real finger (mouse) drag through the dots `cells`."""
    pts = [pg.evaluate('k => __mazeMaker.spot(k)', c) for c in cells]
    pg.mouse.move(*pts[0]); pg.mouse.down()
    for a, b in zip(pts, pts[1:]):
        for i in range(1, 6):
            pg.mouse.move(a[0] + (b[0] - a[0]) * i / 5, a[1] + (b[1] - a[1]) * i / 5)
    pg.mouse.up(); pg.wait_for_timeout(50)

def tap_dot(pg, k):
    x, y = pg.evaluate('k => __mazeMaker.spot(k)', k); pg.mouse.click(x, y); pg.wait_for_timeout(80)

def fits(pg):
    """Every maker button and the board are on the screen, not overlapping each other."""
    return pg.evaluate("""() => {
      const W = innerWidth, H = innerHeight, r = e => e.getBoundingClientRect();
      const els = [...document.querySelectorAll('#makerBar .round-btn')];
      const boxes = els.map(r), m = r(document.getElementById('maze'));
      const on = b => b.left >= -1 && b.top >= -1 && b.right <= W + 1 && b.bottom <= H + 1;
      const hit = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
      return { n: els.length, allOn: boxes.every(on) && on(m), overlap: boxes.some(b => hit(b, m)),
               small: Math.min(...boxes.map(b => b.width)), board: Math.round(m.width) };
    }""")

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 800})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    fresh(pg)

    # ---- the map's pencil opens My mazes: 3 tiles
    pg.click('#mapBtn'); cmenu.wait_screen(pg, 'maze-map')
    check(cmenu.find(pg, 'make') is not None, 'map: a pencil button (My mazes)')
    cmenu.tap(pg, 'make'); cmenu.wait_screen(pg, 'maze-mine')
    tiles = [i['attr'] for i in cmenu.items(pg) if i['attr'].startswith('made-')]
    check(tiles == ['made-0', 'made-1', 'made-2'], f'My mazes: 3 tiles {tiles}')
    pg.screenshot(path=str(OUT / 'maze-maker-map-empty.png'))
    cmenu.tap(pg, 'made-0'); pg.wait_for_timeout(300)
    mk = MK(pg); st = ST(pg)
    check(st['making'] and mk['slot'] == 0 and mk['n'] == 6 and mk['p'] == [] and not mk['canPlay'], 'maker open: empty 6 x 6 board, cannot play yet')
    check(pg.evaluate("document.getElementById('mk-play').classList.contains('dim')"), 'play button dim')
    check(not pg.is_visible('.top'), 'the top bar hides while making')

    # ---- dig a path with a real drag: along the top, then round a corner diagonally, then down
    drag(pg, ['0,0', '1,0', '2,0', '3,0'])
    mk = MK(pg)
    check(sorted(mk['p']) == ['0,0|1,0', '1,0|2,0', '2,0|3,0'], f'drag digs a path {mk["p"]}')
    drag(pg, ['3,0', '4,1'])       # diagonal = round the corner
    check(len(MK(pg)['p']) == 5, f'a diagonal digs round the corner {MK(pg)["p"]}')
    drag(pg, ['4,1', '4,2', '4,3', '4,4', '5,4', '5,5'])
    mk = MK(pg)
    check(mk['canPlay'] and not pg.evaluate("document.getElementById('mk-play').classList.contains('dim')"), 'the path reaches the treat: play lights up')
    # undo the last dig, redo it by hand
    pg.click('#mk-undo'); pg.wait_for_timeout(100)
    check(not MK(pg)['canPlay'] and len(MK(pg)['p']) == 5, 'undo takes the last drag back')
    drag(pg, ['4,1', '4,2', '4,3', '4,4', '5,4', '5,5'])
    # the eraser
    drag(pg, ['0,1', '0,2'])        # a side path
    pg.click('#mk-erase'); pg.wait_for_timeout(50)
    drag(pg, ['0,1', '0,2'])
    check('0,1|0,2' not in MK(pg)['p'] and MK(pg)['tool'] == 'erase', 'the eraser rubs a path out')
    pg.click('#mk-dig')
    drag(pg, ['0,0', '0,1', '0,2', '1,2'])   # a side path with a dead end (for a gem)
    # friend, treat, gem
    pg.click('#mk-treat'); tap_dot(pg, '4,4')
    mk = MK(pg)
    check(mk['g'] == '4,4' and mk['tool'] == 'dig', 'treat placed with a tap, back to digging')
    pg.click('#mk-friend'); tap_dot(pg, '4,4')
    check(MK(pg)['s'] == '0,0', 'the friend can\'t go on the treat')
    pg.click('#mk-friend'); tap_dot(pg, '1,0')
    check(MK(pg)['s'] == '1,0', 'friend placed')
    pg.click('#mk-gem'); tap_dot(pg, '1,2'); tap_dot(pg, '5,5'); tap_dot(pg, '3,3'); tap_dot(pg, '3,3')
    mk = MK(pg)
    check(sorted(mk['gems']) == ['1,2', '5,5'], f'gems: tap = hide, tap again = take away {mk["gems"]}')
    pg.screenshot(path=str(OUT / 'maze-maker-desktop.png'))
    f = fits(pg)
    check(f['n'] == 11 and f['allOn'] and not f['overlap'] and f['small'] >= 60, f'desktop: board + 11 buttons fit {f}')

    # ---- play it
    pg.click('#mk-play'); pg.wait_for_timeout(300)
    st = ST(pg)
    check(not st['making'] and st['mine'] == 0 and st['start'] == '1,0' and st['goal'] == '4,4' and len(st['gems']) == 2
          and st['shape'] == 'mine' and not st['door'] and st['bridges'] == [], 'playing my maze: my start, treat and gems')
    check(pg.is_visible('#editBtn') and not pg.is_visible('#shuffle'), 'playing: the pencil replaces the new-maze button')
    pg.screenshot(path=str(OUT / 'maze-maker-play.png'))
    before = pg.evaluate("JSON.parse(localStorage.getItem('kidsMaze.v1'))")
    for target in ['1,2', '5,5', '4,4']:
        for k in pg.evaluate('t => __mazeTest.route(__mazeState().here, t)', target) or []:
            pg.evaluate('k => __mazeTest.step(k)', k)
    pg.wait_for_timeout(900)
    st = ST(pg)
    check(st['won'] and pg.is_visible('#next') and pg.evaluate("document.querySelectorAll('#winStars svg.on').length") == 3, 'my maze won with both gems: 3 stars')
    after = pg.evaluate("JSON.parse(localStorage.getItem('kidsMaze.v1'))")
    check(after.get('done', 0) == before.get('done', 0) and after.get('stars') == before.get('stars') and after.get('top') == before.get('top'),
          'my maze doesn\'t count for the real mazes (stars, done, map)')
    pg.click('#next', force=True); pg.wait_for_timeout(300)   # (the arrow pulses)
    check(ST(pg)['making'] and MK(pg)['slot'] == 0, 'the arrow goes back to the maker')

    # ---- saved: reload, the map tile shows it, the maker has it
    pg.reload(); pg.wait_for_timeout(400)
    saved = pg.evaluate('__mazeMaker.saved()')
    check(saved[0] and saved[0]['s'] == '1,0' and saved[0]['g'] == '4,4' and len(saved[0]['p']) >= 10 and saved[1] is None, 'my maze is saved')
    open_maker(pg, 0)
    check(MK(pg)['canPlay'] and MK(pg)['s'] == '1,0', 'reopened: the same maze')
    pg.click('#mk-back'); cmenu.wait_screen(pg, 'maze-mine'); pg.wait_for_timeout(300)
    pg.screenshot(path=str(OUT / 'maze-maker-map.png'))
    check(not ST(pg)['making'] and ST(pg)['mine'] is None, 'back = My mazes, a normal maze underneath')
    check('M8 -2' in pg.evaluate("ArcadeMenus.current().rows[0].items[0].pic"), 'My mazes: the tile shows the maze I made')
    cmenu.tap(pg, 'back'); cmenu.wait_screen(pg, 'maze-map')
    cmenu.tap(pg, 'back'); pg.wait_for_timeout(200)

    # ---- slot 2: dice, colors, play, edit from the game, start again
    open_maker(pg, 2)
    pg.click('#mk-dice'); pg.wait_for_timeout(100)
    mk = MK(pg)
    check(mk['canPlay'] and len(mk['p']) == 35 and mk['s'] != mk['g'], f'dice: a whole maze (35 paths for 36 dots) {len(mk["p"])}')
    pg.click('#mk-paint'); pg.click('#mk-paint'); pg.wait_for_timeout(100)
    check(MK(pg)['t'] == 2, 'colors button: next colors')
    pg.screenshot(path=str(OUT / 'maze-maker-dice.png'))
    pg.click('#mk-play'); pg.wait_for_timeout(200)
    check(ST(pg)['theme'] == 'space' and ST(pg)['cells'] == 36, 'the dice maze plays in its colors')
    pg.click('#editBtn'); pg.wait_for_timeout(200)
    check(ST(pg)['making'] and MK(pg)['slot'] == 2, 'the pencil goes back to the maker')
    pg.click('#mk-clear'); pg.wait_for_timeout(100)
    check(MK(pg)['p'] == [] and not MK(pg)['canPlay'] and MK(pg)['t'] == 2, 'start again: empty board (colors kept)')
    pg.click('#mk-undo'); pg.wait_for_timeout(100)
    check(len(MK(pg)['p']) == 35, 'undo brings the maze back')
    pg.click('#mk-back'); cmenu.wait_screen(pg, 'maze-mine')
    cmenu.tap(pg, 'back'); cmenu.wait_screen(pg, 'maze-map')
    # the real mazes still work after making
    cmenu.tap(pg, 'level-0'); pg.wait_for_timeout(300)
    st = ST(pg)
    check(st['mine'] is None and st['shape'] == 'circle' and not st['making'] and pg.is_visible('#shuffle'), 'stone 1: back to the real mazes')

    # ---- little kids: 5 x 5
    fresh(pg, little=True)
    open_maker(pg, 1)
    check(MK(pg)['n'] == 5, 'little kids: big dots (5 x 5)')

    # ---- phones
    for name, vp, touch in [('phone-up', {'width': 360, 'height': 740}, True), ('phone-side', {'width': 740, 'height': 360}, True),
                            ('tablet', {'width': 820, 'height': 1180}, True)]:
        ctx = b.new_context(viewport=vp, has_touch=touch, is_mobile=True)
        p = ctx.new_page(); p.on('pageerror', lambda e: errors.append(str(e)))
        fresh(p)
        open_maker(p, 0)
        p.click('#mk-dice'); p.wait_for_timeout(150)
        f = fits(p)
        check(f['n'] == 11 and f['allOn'] and not f['overlap'] and f['small'] >= 44 and f['board'] >= 200, f'{name}: board + buttons fit {f}')
        p.screenshot(path=str(OUT / f'maze-maker-{name}.png'))
        ctx.close()

    check(not errors, f'no JavaScript errors {errors[:3]}')
    b.close()

print('\n' + ('ALL PASS' if not fails else f'{len(fails)} FAILED'))
sys.exit(1 if fails else 0)
