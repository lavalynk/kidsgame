"""Automated test: Jungle Jump (4 worlds, 2 levels each).

Run:  python3 tests/test_jungle.py
Checks:
  * the level picker shows 8 picture tiles; a new player has only Leafy Forest open
  * finishing a world's 1st level opens its 2nd level AND the next world; "Next" goes 1st -> 2nd -> next world
  * old saves (only the 4 old levels done) keep everything: all 8 tiles open, stars + treasures still shown,
    the big Play button carries on with the first new level
  * EVERY level can be finished: the game's own robot (__jungleBot: it presses the same buttons a child has
    and tries moves on a pretend hero first) plays all 8, as a big kid and as a little kid (always Easy);
    in the 4 new levels the big kid's robot also climbs the trees, rides the winds and finds the treasure
  * the new ideas work: lanterns count left to right, the wind lifts you while you hold jump (and only then),
    the jelly pit bounces you back out, Glow Cave is dark and the other levels are not
  * the picker fits on a phone held sideways (844 x 390); no JavaScript errors
Screenshots land in tests/out/ (jungle-*.png).
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
URL = (ROOT / 'jungle' / 'index.html').as_uri()
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
ST = lambda pg: pg.evaluate('(() => { const s = __jungleState(); delete s.botLog; return s; })()')
OLD = ['forest', 'cave', 'snow', 'candy']                    # the levels from before (their ids must never change)
NEW = ['forest2', 'cave2', 'snow2', 'candy2']
ORDER = ['forest', 'forest2', 'cave', 'cave2', 'snow', 'snow2', 'candy', 'candy2']

# Where the robot should go: [column, row] tiles to stand on, in order; after the last one it heads for the balloon.
# (No route = straight to the balloon.) The big kid's routes visit each new level's special places + its treasure.
ROUTES = {
    'forest2': [[24, 14], [29, 12], [34, 10], [42, 10], [47, 8], [51, 6], [59, 4], [90, 10]],   # up the trees, the hilltop, glide to the treasure tree
    'cave2':   [[40, 8], [63, 5], [70, 8], [62, 8]],                                           # the tunnel, over the big rock, back into the secret room
    'snow2':   [[14, 14], [21, 6], [24, 10], [36, 6], [55, 10], [64, 6], [76, 3]],                    # into wind 1, all the way up (treasure), every terrace, the wind in the gap, the peak
    'candy2':  [[47, 3], [81, 10], [88, 5]],                                                   # the cake hill, then the super bounce (jump held) up to the treasure
}
LITTLE_ROUTES = {
    'forest2': [[53, 16], [59, 4]],                          # stay on the ground and take the lift up the hill
    'snow2':   [[24, 10], [36, 6], [55, 10], [64, 6], [76, 3]],
    'candy2':  [[47, 3]],
}

def fresh(pg, little=False, save=None):
    """A new player (big or little), optionally with a ready-made Jungle Jump save."""
    pg.goto(URL)
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': 'little' if little else 'big'}]}
    pg.evaluate("([p, s]) => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); if (s) localStorage.setItem('kidsArcade.v1', s); }",
                [json.dumps(prof), json.dumps({'games': {'jungle': save}}) if save else None])
    pg.reload(); pg.wait_for_timeout(500)

def open_picker(pg):
    """Title screen -> picture menu -> Levels. Returns the tiles."""
    vp = pg.viewport_size
    if pg.locator('.ar-tapstart').count(): pg.mouse.click(vp['width'] // 2, vp['height'] // 2); pg.wait_for_timeout(700)
    pg.click('[data-levels]'); pg.wait_for_timeout(500)
    return pg.locator('.ar-grid').first.locator('.ar-tile')

def tiles_state(pg):
    return pg.evaluate("[...document.querySelector('.ar-grid').querySelectorAll('.ar-tile')].map(t => ({ name: t.children[1].textContent, locked: t.classList.contains('locked'), pic: !!t.querySelector('.pic svg'), stars: t.querySelectorAll('.meta svg').length }))")

def play(pg, lid):
    pg.evaluate(f"document.activeElement && document.activeElement.blur(); __game.play(__jungleDebug.LEVELS.find(l => l.id === '{lid}'))")
    pg.wait_for_timeout(300)

def bot_play(pg, lid, route=None, fast=8, shot_at=None, shot=None):
    """The robot plays one level to the balloon (8x speed). After a "Nice try!" it taps Again, like a child would.
    Returns (last state, how many times it needed Again)."""
    play(pg, lid)
    agains = 0; shot_done = False
    pg.evaluate(f'__jungleBot(true, {fast}, {json.dumps(route or [])})')
    for _ in range(1200):
        pg.wait_for_timeout(100)
        st = ST(pg)
        if shot and not shot_done and st['x'] >= shot_at * 48:
            pg.evaluate('__jungleTest.botSpeed(1)'); pg.wait_for_timeout(250)          # normal speed for a nice picture
            pg.screenshot(path=str(OUT / shot)); shot_done = True
            pg.evaluate(f'__jungleTest.botSpeed({fast})')
        if st['finished'] and not st['dead']: break                                     # in the balloon!
        if st['finished'] and st['dead']:                                               # "Nice try!": tap Again (carries on at the last lantern)
            if agains >= 4: break
            pg.wait_for_selector('.ar-results', timeout=8000); pg.wait_for_timeout(300)
            pg.locator('.ar-results .ar-btn', has_text='Again').click(); pg.wait_for_timeout(400)
            agains += 1
            pg.evaluate(f'__jungleBot(true, {fast}, {json.dumps(route or [])})')
        if st['clock'] > 240: break                                                     # 4 minutes of game time: stuck
    pg.evaluate('__jungleBot(false)')
    return st, agains

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 760})
    pg.on('pageerror', lambda e: errors.append(str(e)))

    # ---- a new player: 8 tiles, only the first one open ----
    fresh(pg)
    tiles = open_picker(pg)
    ts = tiles_state(pg)
    check(len(ts) == 8 and all(t['pic'] for t in ts), f'picker: 8 levels, each with a picture ({len(ts)})')
    check([t['locked'] for t in ts] == [False] + [True] * 7, 'new player: only Leafy Forest is open')
    check([t['name'] for t in ts] == ['Leafy Forest', 'Treetop Trail', 'Crystal Cave', 'Glow Cave', 'Snowy Hills', 'Windy Peak', 'Candy Land', 'Jelly Hills'], 'each world is followed by its 2nd level')
    ids = pg.evaluate('__jungleDebug.LEVELS.map(l => l.id)')
    check(ids == ORDER and all(pg.evaluate(f"!!__jungleDebug.MAPS['{i}']") for i in ids), 'the 4 old level ids are unchanged, 4 new ones added')
    tiles.nth(1).click(); pg.wait_for_timeout(400)
    check(pg.locator('.ar-grid').count() == 1, 'a locked tile does not start')

    # ---- finish Leafy Forest: Treetop Trail AND Crystal Cave open; Next goes to Treetop Trail ----
    st, _ = bot_play(pg, 'forest')
    check(st['finished'] and not st['dead'], 'the robot finishes Leafy Forest')
    pg.wait_for_selector('.ar-results', timeout=8000); pg.wait_for_timeout(600)
    pg.screenshot(path=str(OUT / 'jungle-results.png'))
    lv = pg.evaluate('__game.save.levels')
    check(lv.get('forest', {}).get('done') is True, 'Leafy Forest is saved as done')
    pg.locator('.ar-results .ar-btn', has_text='Next').click(); pg.wait_for_timeout(600)
    check(ST(pg)['level']['id'] == 'forest2', f"Next after Leafy Forest = Treetop Trail ({ST(pg)['level']['id']})")
    pg.evaluate('__game.menu()'); pg.wait_for_timeout(500)
    open_picker(pg)
    check([t['locked'] for t in tiles_state(pg)] == [False, False, False, True, True, True, True, True], 'after Leafy Forest: Treetop Trail + Crystal Cave open, the rest locked')

    # ---- finish Treetop Trail: nothing else opens (worlds still open the old way); Next goes to Crystal Cave ----
    st, _ = bot_play(pg, 'forest2', ROUTES['forest2'])
    pg.wait_for_selector('.ar-results', timeout=8000); pg.wait_for_timeout(600)
    pg.locator('.ar-results .ar-btn', has_text='Next').click(); pg.wait_for_timeout(600)
    check(ST(pg)['level']['id'] == 'cave', f"Next after Treetop Trail = Crystal Cave ({ST(pg)['level']['id']})")
    pg.evaluate('__game.menu()'); pg.wait_for_timeout(500)
    open_picker(pg)
    check([t['locked'] for t in tiles_state(pg)] == [False, False, False, True, True, True, True, True], 'a 2nd level does not open the next world by itself')

    # ---- old saves: the 4 old levels done, nothing else ----
    old = {'levels': {k: {'done': True, 'stars': 2 + (i % 2), 'score': 1500} for i, k in enumerate(OLD)}, 'best': 1500, 'unlocked': ['hero-frog'],
           'data': {'best': {'forest': {'stars': 20, 'treasure': True}, 'cave': {'stars': 12, 'treasure': False}}, 'hero': 'frog'}, 'achievements': ['world', 'candy']}
    fresh(pg, save=old)
    open_picker(pg)
    ts = tiles_state(pg)
    check(not any(t['locked'] for t in ts), 'old save (4 old levels done): all 8 levels are open')
    check([t['stars'] for t in ts] == [4, 0, 3, 0, 3, 0, 3, 0], f"old save: stars (and the treasure) still show on the old levels ({[t['stars'] for t in ts]})")
    sv = pg.evaluate('__game.save')
    check(sv['data']['hero'] == 'frog' and 'hero-frog' in sv['unlocked'] and sv['levels']['candy']['done'], 'old save: hero, unlocks and progress kept')
    pg.screenshot(path=str(OUT / 'jungle-picker.png'))
    pg.locator('.ar-btn', has_text='Back').click(); pg.wait_for_timeout(400)
    pg.click('[data-start]'); pg.wait_for_timeout(600)
    check(ST(pg)['level']['id'] == 'forest2', f"old save: the big Play button starts the first new level ({ST(pg)['level']['id']})")
    # only the first world done (an old save in the middle of the game)
    fresh(pg, save={'levels': {'forest': {'done': True, 'stars': 1}, 'cave': {'done': True, 'stars': 1}}, 'best': 0, 'unlocked': [], 'data': {}, 'achievements': []})
    open_picker(pg)
    check([t['locked'] for t in tiles_state(pg)] == [False, False, False, False, False, True, True, True], 'old save with 2 worlds done: both their 2nd levels + Snowy Hills open')

    # ---- the new ideas, one by one ----
    fresh(pg); open_picker(pg)               # (through the menus first, like a child: the title screen listens for Space)
    # lanterns count from left to right (Treetop Trail has one high up on the hill)
    play(pg, 'forest2')
    pg.evaluate('__jungleTest.teleport(19 * 48, 16 * 48)'); pg.wait_for_timeout(300)
    check(ST(pg)['checkpoint'] == 0, f"Treetop Trail: the first lantern is lantern 1 ({ST(pg)['checkpoint']})")
    pg.evaluate('__jungleTest.teleport(59 * 48, 4 * 48)'); pg.wait_for_timeout(300)
    check(ST(pg)['checkpoint'] == 1, 'Treetop Trail: the hilltop lantern is lantern 2')
    check(ST(pg)['dark'] == 0, 'Treetop Trail is not dark')
    # the wind: hold jump = up, let go = down
    play(pg, 'snow2')
    pg.evaluate('__jungleTest.teleport(14.6 * 48, 13 * 48)'); pg.wait_for_timeout(100)
    pg.keyboard.down('Space'); pg.wait_for_timeout(1300)
    up = ST(pg)
    pg.screenshot(path=str(OUT / 'jungle-wind.png'))
    check(up['inWind'] and up['y'] < 10 * 48 and up['vy'] < 0, f"Windy Peak: holding jump in the wind carries you up (y {round(up['y'])}, speed {round(up['vy'])})")
    pg.keyboard.up('Space'); pg.wait_for_timeout(1500)
    down = ST(pg)
    check(down['y'] > up['y'] + 100 and down['onGround'], 'Windy Peak: let go and you drop back down')
    pg.evaluate('__jungleTest.teleport(8 * 48, 13 * 48)'); pg.keyboard.down('Space'); pg.wait_for_timeout(1200); pg.keyboard.up('Space')
    pg.wait_for_function('__jungleState().onGround', timeout=8000)     # (let the jump + leaf glide finish, however slow the computer)
    check(ST(pg)['y'] > 12 * 48 and not ST(pg)['inWind'], 'Windy Peak: no wind, no lift (outside the wind you just jump)')
    pits = pg.evaluate("__jungleDebug.MAPS.snow2.slice(-2).join('').includes('e') || __jungleDebug.MAPS.snow2[16].includes('.')")
    check(not pits, 'Windy Peak has no pits')
    # the jelly pit bounces you back out
    play(pg, 'candy2')
    pg.evaluate('__jungleTest.teleport(26 * 48, 9 * 48)'); pg.wait_for_timeout(400)
    low = ST(pg)['y']
    pg.keyboard.down('ArrowRight'); pg.wait_for_timeout(1800); pg.keyboard.up('ArrowRight'); pg.wait_for_timeout(400)
    st = ST(pg)
    check(st['x'] > 29 * 48 and st['onGround'] and st['hearts'] == st['maxHearts'], f"Jelly Hills: the jelly pit bounces you out the other side (x {round(st['x'] / 48)})")
    # Glow Cave is dark, with 5 lanterns
    play(pg, 'cave2'); pg.wait_for_timeout(500)
    st = ST(pg)
    check(st['dark'] > 0.5 and st['lanterns'] == 5, f"Glow Cave is dark and has 5 lanterns ({st['dark']}, {st['lanterns']})")
    px = pg.evaluate("(() => { const c = document.querySelector('canvas'), x = c.getContext('2d'); const f = (u, v) => { const d = x.getImageData(Math.round(c.width * u), Math.round(c.height * v), 1, 1).data; return d[0] + d[1] + d[2]; }; return [f(0.92, 0.3), f(0.12, 0.72)]; })()")
    check(px[0] < px[1], f'Glow Cave: far from the hero it is darker than next to the hero ({px})')
    play(pg, 'cave'); pg.wait_for_timeout(300)
    check(ST(pg)['dark'] == 0 and ST(pg)['lanterns'] == 2, 'Crystal Cave (the old level) is as before: not dark, 2 lanterns')

    # ---- a big kid's robot plays all 8 levels (new levels: the special route + the treasure) ----
    fresh(pg); open_picker(pg)
    SHOTS = {'forest2': 62, 'cave2': 44, 'snow2': 54, 'candy2': 60}
    for lid in ORDER:
        st, agains = bot_play(pg, lid, ROUTES.get(lid), shot_at=SHOTS.get(lid), shot=f'jungle-{lid}.png' if lid in SHOTS else None)
        ok = st['finished'] and not st['dead']
        check(ok, f"big kid: the robot finishes {lid} ({st['difficulty']}, {round(st['clock'])} s, {st['stars']}/{st['starsTotal']} goodies, lantern {st['checkpoint'] + 1}/{st['lanterns']}" + (f', Again x{agains}' if agains else '') + ')')
        if lid in NEW:
            check(st['treasure'], f'big kid: {lid}: the robot found the treasure')
            check(st['checkpoint'] >= 1, f'big kid: {lid}: lanterns were lit on the way')
        if ok: pg.wait_for_selector('.ar-results', timeout=8000); pg.wait_for_timeout(500)
    sv = pg.evaluate('__game.save')
    check(all(sv['levels'].get(i, {}).get('done') for i in ORDER), 'all 8 levels are saved as done')
    check('tour' in sv['achievements'], 'trophy: World tour (all 8 levels)')
    check(all((sv['data'].get('best') or {}).get(i, {}).get('treasure') for i in NEW), 'the 4 new treasures are saved')
    pg.locator('.ar-results .ar-btn', has_text='Next').click(); pg.wait_for_timeout(600)
    check(pg.locator('.ar-nesmenu, .ar-grid').count() > 0, 'Next after the last level goes back to the menu')

    # ---- a little kid (always Easy, slower clock) ----
    fresh(pg, little=True); open_picker(pg)
    for lid in ORDER:
        st, agains = bot_play(pg, lid, LITTLE_ROUTES.get(lid))
        ok = st['finished'] and not st['dead']
        check(ok and st['difficulty'] == 'easy' and agains == 0, f"little kid: the robot finishes {lid} on Easy, never a \"Nice try\" ({round(st['clock'])} s, {st['stars']}/{st['starsTotal']} goodies)")
        if ok: pg.wait_for_selector('.ar-results', timeout=8000); pg.wait_for_timeout(300)

    # ---- the test hooks are still there ----
    play(pg, 'forest')
    st = ST(pg)
    check(all(k in st for k in ['x', 'y', 'onGround', 'stars', 'starsTotal', 'hearts', 'checkpoint', 'treasure', 'finished', 'level', 'cam']), '__jungleState still has everything it had')
    b.close()

    # ---- phone held sideways: the picker fits ----
    b = pw.chromium.launch()
    ctx = b.new_context(viewport={'width': 844, 'height': 390}, has_touch=True, is_mobile=True)
    ph = ctx.new_page(); ph.on('pageerror', lambda e: errors.append(str(e)))
    fresh(ph, save=old)
    open_picker(ph)
    ph.screenshot(path=str(OUT / 'jungle-picker-phone.png'))
    boxes = ph.evaluate("[...document.querySelector('.ar-grid').querySelectorAll('.ar-tile')].map(t => { const r = t.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; })")
    check(len(boxes) == 8 and all(x0 >= 0 and y0 >= 0 and x1 <= 844 and y1 <= 390 for x0, y0, x1, y1 in boxes), 'phone: all 8 tiles are on the screen')
    check(all(x1 - x0 >= 70 and y1 - y0 >= 70 for x0, y0, x1, y1 in boxes), 'phone: tiles are big enough for small fingers')
    bk = ph.locator('.ar-btn', has_text='Back').bounding_box()
    check(bk and bk['y'] + bk['height'] <= 390, 'phone: the Back button is on the screen too')
    ph.locator('.ar-grid .ar-tile').nth(5).tap(); ph.wait_for_timeout(1200)
    ph.evaluate("document.querySelector('.ar-turnshow button, .ar-turn button') && document.querySelector('.ar-turnshow button, .ar-turn button').click()")
    ph.wait_for_timeout(1500)
    check(ph.evaluate('__jungleState().level.id') == 'snow2', 'phone: tapping the Windy Peak tile starts it')
    ph.screenshot(path=str(OUT / 'jungle-phone-play.png'))
    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print('\nALL PASS' if not fails else f'\n{len(fails)} FAILED:\n  ' + '\n  '.join(fails))
sys.exit(1 if fails else 0)
