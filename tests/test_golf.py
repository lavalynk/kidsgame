"""Automated test: Putt-Putt Park (mini golf).

Run:  python3 tests/test_golf.py
Checks:
  * the title screen is a picture; the hole picker shows 9 holes + "all 9", only hole 1 open at first
  * pulling back with the mouse and letting go putts the ball (and counts 1 putt); the keyboard putts too
  * a bot (the game's own __golfBot: it tries lots of pretend putts) finishes EVERY hole within par + 2,
    gets stars, and the next hole unlocks
  * the pond pops the ball back where it was (no penalty), the pipe carries the ball across
  * all 9 holes in a row ("the course") ends with one results screen and a card of 9 scores
  * Seaside Cove (the beach course, Nov 22): a Beach tab on the hole picker, locked until park hole 3 is done;
    the bot finishes all 9 beach holes; a crab bounces the ball; the boardwalk carries the ball over the water
    (no splash) and missing it splashes; all 9 beach holes in a row
  * a little kid gets a bigger cup that pulls the ball in
  * phone held sideways: the game fits; no JavaScript errors
Screenshots land in tests/out/ (golf-*.png).
"""
import sys, json, math, pathlib
from playwright.sync_api import sync_playwright
import cmenu as cm          # (Nov 21: the menus are drawn by Phaser, tests/cmenu.py)
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
URL = (ROOT / 'golf' / 'index.html').as_uri()
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
ST = lambda pg: pg.evaluate('__golfState()')
REST = '["aim", "in"].includes(__golfState().state) || __golfState().done'

def fresh(pg, little=False):
    pg.goto(URL)
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': 'little' if little else 'big'}]}
    pg.evaluate("p => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); }", json.dumps(prof))
    pg.reload(); pg.wait_for_timeout(500)

def play(pg, level):
    pg.evaluate(f'document.activeElement && document.activeElement.blur(); __game.play({json.dumps(level)})'); pg.wait_for_timeout(2400)     # (the "get ready" jingle)

def bot_hole(pg, limit=10):
    """Let the bot putt until the ball is in. Returns the number of putts."""
    for _ in range(limit):
        st = ST(pg)
        if st['state'] == 'in' or st['done']: break
        pg.evaluate('__golfBot()')
        pg.wait_for_function(REST, timeout=25000)
    return ST(pg)['strokes']

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    fresh(pg)

    # ---- title + hole picker ----
    cm.wait_screen(pg, 'tap')
    its = cm.items(pg)
    check(len(its) == 1 and not its[0]['label'], 'title screen = a big Play picture, no words')
    pg.screenshot(path=str(OUT / 'golf-title.png'))
    cm.to_title(pg)                                               # Play -> the picture menu
    attrs = [i['attr'] for i in cm.items(pg)]
    check(attrs[0] == 'start' and 'unlocks' in attrs, 'picture menu: a big Play button + Prizes (ball colors)')
    cm.tap(pg, 'levels'); cm.wait_screen(pg, 'levels')
    tiles = [i for i in cm.items(pg) if i['attr'].startswith('level-')]
    check(len(tiles) == 10 and sum(i['locked'] for i in tiles) == 9, f'picker: 9 holes + the course, only hole 1 open ({len(tiles)})')
    cm.tap(pg, 'tab-1'); pg.wait_for_timeout(500)
    bt = [i for i in cm.items(pg) if i['attr'].startswith('level-')]
    check(len(bt) == 10 and all(i['locked'] for i in bt), 'Beach tab: everything locked at first (opens after park hole 3)')
    cm.tap(pg, 'tab-0'); pg.wait_for_timeout(500)
    pg.screenshot(path=str(OUT / 'golf-menu.png'))

    # ---- hole 1 by hand: pull back and let go ----
    play(pg, {'id': 'h1'})
    s = ST(pg)
    check(s['hole'] == 'h1' and s['strokes'] == 0 and s['state'] == 'aim' and s['holes'] == 9, f"hole 1 starts: ball on the tee, 0 putts ({s['state']})")
    pg.mouse.move(700, 400); pg.mouse.down(); pg.mouse.move(620, 400, steps=6); pg.wait_for_timeout(250)
    pg.screenshot(path=str(OUT / 'golf-aim.png'))
    pg.mouse.up(); pg.wait_for_timeout(200)
    s2 = ST(pg)
    check(s2['strokes'] == 1 and s2['moving'], 'pull back + let go = 1 putt, the ball rolls')
    pg.wait_for_function(REST, timeout=15000)
    s3 = ST(pg)
    check(s3['ball']['x'] > s['ball']['x'] + 40 and abs(s3['ball']['y'] - s['ball']['y']) < 12, f"pulled left -> the ball went right ({s['ball']} -> {s3['ball']})")
    if s3['state'] == 'aim':
        x0 = s3['ball']['x']
        pg.keyboard.down('Space'); pg.wait_for_timeout(350); pg.keyboard.up('Space'); pg.wait_for_timeout(200)
        check(ST(pg)['strokes'] == 2, 'keyboard: hold Space, let go = a putt')
        pg.wait_for_function(REST, timeout=15000)
    n = bot_hole(pg)
    pg.wait_for_function('__golfState().done', timeout=8000); pg.wait_for_timeout(1500)
    check(cm.screen(pg) == 'results', f'hole 1: in the cup after {n} putts, results show')
    pg.screenshot(path=str(OUT / 'golf-results.png'))

    # ---- the bot plays every hole ----
    for i in range(1, 10):
        play(pg, {'id': f'h{i}'})
        if i in (3, 5, 6, 7, 8, 9): pg.screenshot(path=str(OUT / f'golf-h{i}.png'))
        par = ST(pg)['par']
        n = bot_hole(pg)
        pg.wait_for_function('__golfState().done', timeout=8000)
        check(n <= par + 2, f'hole {i}: the bot is in after {n} putts (par {par})')
    pg.wait_for_timeout(1300)
    save = pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.v1')).games.golf")
    done = [k for k, v in save['levels'].items() if v.get('done')]
    check(len(done) == 9 and all(v.get('stars', 0) >= 1 for v in save['levels'].values()), f'all 9 holes saved as done, with stars ({len(done)})')
    check('all' in save['achievements'] and 'first' in save['achievements'], f"trophies: first hole + all nine ({len(save['achievements'])} trophies)")
    pg.wait_for_timeout(1200); pg.evaluate('__game.menu()'); pg.wait_for_timeout(500)
    cm.wait_screen(pg, 'title'); cm.tap(pg, 'levels'); cm.wait_screen(pg, 'levels')
    tiles = [i for i in cm.items(pg) if i['attr'].startswith('level-')]
    check(len(tiles) == 10 and not any(i['locked'] for i in tiles), 'picker: everything is open now (the course too)')
    pg.screenshot(path=str(OUT / 'golf-menu-open.png'))

    # ---- the pond: the ball pops back ----
    play(pg, {'id': 'h5'})
    s = ST(pg)
    pg.evaluate('__golfShoot(0, 0.35)')                    # straight at the pond
    pg.wait_for_function('__golfState().state === "splash"', timeout=8000)
    pg.wait_for_timeout(300); pg.screenshot(path=str(OUT / 'golf-splash.png'))
    pg.wait_for_function('__golfState().state === "aim"', timeout=5000)
    s2 = ST(pg)
    check(s2['ball'] == s['ball'] and s2['strokes'] == 1, f"pond: the ball is back on the tee, 1 putt counted ({s2['ball']})")

    # ---- the pipe ----
    play(pg, {'id': 'h8'})
    pg.evaluate('__golfShoot(0, 0.3)')
    pg.wait_for_function(REST, timeout=15000)
    s = ST(pg)
    check(s['ball']['x'] > 540, f"pipe: the ball came out on the other green ({s['ball']})")

    # ---- all 9 holes in a row ----
    play(pg, {'id': 'course', 'course': True})
    total = 0
    for i in range(9):
        pg.wait_for_function(f'__golfState().idx === {i} && __golfState().state === "aim"', timeout=10000)
        total += bot_hole(pg)
    pg.wait_for_function('__golfState().done', timeout=8000); pg.wait_for_timeout(1500)
    s = ST(pg)
    check(len(s['card']) == 9 and sum(s['card']) == total and cm.screen(pg) == 'results', f"the course: 9 holes in a row, {total} putts, one results screen ({s['card']})")
    pg.screenshot(path=str(OUT / 'golf-course.png'))

    # ---- Seaside Cove: the beach course (Nov 22) ----
    pg.evaluate('__game.menu()'); cm.wait_screen(pg, 'title'); cm.tap(pg, 'levels'); cm.wait_screen(pg, 'levels')
    tabs = [i for i in cm.items(pg) if i['attr'].startswith('tab-')]
    check(len(tabs) == 2, f'hole picker: 2 picture tabs, Park + Beach ({len(tabs)})')
    cm.tap(pg, 'tab-1'); pg.wait_for_timeout(500)
    tiles = [i for i in cm.items(pg) if i['attr'].startswith('level-')]
    check(len(tiles) == 10 and tiles[0]['attr'] == 'level-b1' and not tiles[0]['locked'], f'Beach tab: 9 beach holes + the course, hole 1 open ({[t["attr"] for t in tiles][:3]})')
    pg.screenshot(path=str(OUT / 'golf-beach-menu.png'))
    for i in range(1, 10):
        play(pg, {'id': f'b{i}'})
        s = ST(pg)
        check(s['beach'] and s['hole'] == f'b{i}', f'beach hole {i} starts')
        pg.screenshot(path=str(OUT / f'golf-b{i}.png'))
        n = bot_hole(pg)
        pg.wait_for_function('__golfState().done', timeout=8000)
        check(n <= s['par'] + 2, f"beach hole {i}: the bot is in after {n} putts (par {s['par']})")
    pg.wait_for_timeout(1300)
    save = pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.v1')).games.golf")
    check(all(save['levels'].get(f'b{i}', {}).get('done') for i in range(1, 10)) and 'beachall' in save['achievements'] and 'bridge' in save['achievements'],
          'all 9 beach holes saved as done; trophies Beach champ + Over the boardwalk')
    # the crab: putt straight at it on Crab Walk (it walks up and down the middle)
    play(pg, {'id': 'b2'})
    pg.evaluate('__golfShoot(0, 0.5)'); pg.wait_for_function(REST, timeout=15000)
    hit = ST(pg)['crabs'] > 0
    if not hit:                                                     # (it may have walked away: try once more)
        pg.evaluate('__golfShoot(Math.atan2(300 - __golfState().ball.y, 480 - __golfState().ball.x), 0.5)'); pg.wait_for_function(REST, timeout=15000)
        hit = ST(pg)['crabs'] > 0
    check(hit, 'Crab Walk: the ball bounced off the crab')
    # the boardwalk: straight over = no splash; aimed off it = splash
    play(pg, {'id': 'b3'})
    pg.evaluate('__golfShoot(0, 0.55)'); pg.wait_for_function(REST, timeout=15000)
    s = ST(pg)
    check(s['state'] == 'in' or s['ball']['x'] > 560, f"Boardwalk: straight along the bridge, over the water, no splash ({s['ball']})")
    play(pg, {'id': 'b3'})
    pg.evaluate('__golfShoot(-0.32, 0.5)')
    pg.wait_for_function('__golfState().state === "splash"', timeout=8000)
    pg.wait_for_function('__golfState().state === "aim"', timeout=5000)
    check(ST(pg)['ball']['x'] == 190, 'Boardwalk: off the side = splash, the ball pops back to the tee')
    # all 9 beach holes in a row
    play(pg, {'id': 'course2', 'course': True})
    for i in range(9):
        pg.wait_for_function(f'__golfState().idx === {i} && __golfState().state === "aim"', timeout=10000)
        bot_hole(pg)
    pg.wait_for_function('__golfState().done', timeout=8000); pg.wait_for_timeout(1500)
    s = ST(pg)
    check(s['beach'] and len(s['card']) == 9 and cm.screen(pg) == 'results', f"the beach course: 9 holes in a row ({s['card']})")

    # ---- a little kid: bigger cup that pulls ----
    big = ST(pg)
    fresh(pg, little=True); play(pg, {'id': 'h1'})
    lit = ST(pg)
    check(lit['cupR'] > big['cupR'] and lit['magnetR'] > big['magnetR'], f"little kid: bigger cup ({lit['cupR']} > {big['cupR']}) that pulls from further ({lit['magnetR']} > {big['magnetR']})")
    pg.evaluate('__golfShoot(0.06, 0.42)')                 # a bit off line
    pg.wait_for_function(REST, timeout=15000)
    check(ST(pg)['state'] == 'in', 'little kid: a slightly-off putt still drops in')

    # ---- phone held sideways ----
    ph = b.new_page(viewport={'width': 844, 'height': 390}, has_touch=True, is_mobile=True)
    ph.on('pageerror', lambda e: errors.append('phone: ' + str(e)))
    fresh(ph); play(ph, {'id': 'h3'})
    box = ph.locator('canvas').first.bounding_box()
    check(box['x'] >= 0 and box['y'] >= 0 and box['x'] + box['width'] <= 845 and box['y'] + box['height'] <= 391, f"phone sideways: the game fits ({round(box['width'])} x {round(box['height'])})")
    ph.screenshot(path=str(OUT / 'golf-phone.png'))

    check(not errors, f'no JavaScript errors ({errors})')
    b.close()

print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
