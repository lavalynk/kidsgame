"""The Star Road, part 4 (Nov 24, new plan point 8): trails in the two TAPPING games, Bubble School and Piano Star.
(These games have no hero to dress up, so they get the 4 trails only.)

  * each game's road = 4 trails, the first after 2 stars
  * the Looks button + Looks screen work (4 trail tiles, the worn one picked)
  * Bubble School: a finger (mouse) sliding over the water lets the trail out; a tap puffs it; the right bubble bursts into it
  * Piano Star: pressing a key sparkles the trail up out of the key, in a song and in Free Play
  * nothing comes out when no trail is worn
  * no JavaScript errors
Screenshots: tests/out/looks/.   Run: python3 tests/test_looks_tap.py
"""
import sys, json, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu as cm
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out' / 'looks'; OUT.mkdir(parents=True, exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

def open_game(b, game, save=None, vp=(1280, 720)):
    ctx = b.new_context(viewport={'width': vp[0], 'height': vp[1]})
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(f'{game}: {e}'))
    pg.goto((ROOT / game / 'index.html').as_uri())
    pg.evaluate('localStorage.clear()')
    if save is not None:
        pg.evaluate(f"localStorage.setItem('kidsArcade.v1', JSON.stringify({json.dumps(save)}))")
    pg.reload(); pg.wait_for_timeout(600)
    return pg

TRAILS = ['sparkles', 'hearts', 'bubbles', 'rainbow']
def rich(game, ids, worn):
    return {'games': {game: {'levels': {i: {'stars': 3, 'done': True} for i in ids},
                             'looks': {'best': 99, 'got': TRAILS, 'fresh': [], 'hat': None, 'trail': worn}}}}

def trails(pg): return pg.evaluate('__game.looks.info().trails')

with sync_playwright() as pw:
    b = pw.chromium.launch()

    # ---- the road: 4 trails each ----
    for game in ['abc', 'piano']:
        pg = open_game(b, game, {'games': {}})
        road = pg.evaluate('__game.looks.road().map(r => ({ kind: r.kind, stars: r.stars }))')
        ups = [r['stars'] for r in road]
        check(len(road) == 4 and ups[0] == 2 and all(a < c for a, c in zip(ups, ups[1:])) and {r['kind'] for r in road} == {'trail'},
              f'{game}: 4 trails on the road, the first after 2 stars ({ups})')
        pg.close()

    # ---- Bubble School ----
    pg = open_game(b, 'abc', rich('abc', ['l1', 'l2'], 'hearts'))
    cm.to_title(pg)
    cm.tap(pg, 'looks'); cm.wait_screen(pg, 'looks')
    tl = [i for i in cm.items(pg) if i['attr'].startswith('look-')]
    check(len(tl) == 4 and cm.find(pg, 'look-hearts')['picked'], 'abc: the Looks screen has 4 trails, hearts worn')
    pg.screenshot(path=str(OUT / 'abc-looks.png'))
    cm.tap(pg, 'look-rainbow'); pg.wait_for_timeout(300)
    check(pg.evaluate('__game.looks.info().trail') == 'rainbow', 'abc: tapping the rainbow puts it on')
    cm.tap(pg, 'back'); cm.wait_screen(pg, 'title')
    pg.evaluate("__game.play(__abcLevel('l1'))"); pg.wait_for_timeout(1500)
    box = pg.evaluate("(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; })()")
    t0 = trails(pg)
    # a finger sliding over the water (low down, away from the bubbles' taps): the mouse moving with the button up
    for i in range(30):
        pg.mouse.move(box[0] + box[2] * (0.15 + i * 0.022), box[1] + box[3] * 0.92); pg.wait_for_timeout(16)
    t1 = trails(pg)
    check(t1 - t0 >= 5, f'abc: a sliding finger lets the rainbow out ({t1 - t0})')
    pg.screenshot(path=str(OUT / 'abc-finger.png'))
    # a tap on the right bubble: a puff where the finger touches + the bubble bursts into the trail
    st = pg.evaluate('__abcState()')
    right = next(x for x in st['bubbles'] if x['text'] == st['answer'] and not x['popped'])
    t1 = trails(pg)
    got = pg.evaluate(f"__abcTapAt({right['x']}, {right['y']})")
    pg.wait_for_timeout(120)
    pg.screenshot(path=str(OUT / 'abc-pop.png'))
    t2 = trails(pg)
    check(got == st['answer'] and t2 - t1 >= 14, f'abc: popping the right bubble bursts into the trail ({t2 - t1} bits)')
    # nothing when no trail is worn
    pg.evaluate("__game.save.looks.trail = null"); pg.wait_for_timeout(1500)
    t3 = trails(pg)
    st = pg.evaluate('__abcState()')
    bb = next((x for x in st['bubbles'] if not x['popped']), None)
    if bb: pg.evaluate(f"__abcTapAt({bb['x']}, {bb['y']})")
    for i in range(20):
        pg.mouse.move(box[0] + box[2] * (0.6 - i * 0.02), box[1] + box[3] * 0.9); pg.wait_for_timeout(16)
    check(trails(pg) == t3, 'abc: no trail worn = nothing comes out')
    pg.close()

    # ---- Piano Star ----
    pg = open_game(b, 'piano', rich('piano', ['twinkle', 'ode'], 'sparkles'))
    cm.to_title(pg)
    cm.tap(pg, 'looks'); cm.wait_screen(pg, 'looks')
    check(len([i for i in cm.items(pg) if i['attr'].startswith('look-')]) == 4 and cm.find(pg, 'look-sparkles')['picked'],
          'piano: the Looks screen has 4 trails, sparkles worn')
    cm.tap(pg, 'back'); cm.wait_screen(pg, 'title')
    pg.evaluate("__game.play({ id: 'ode' })"); pg.wait_for_timeout(800)
    t0 = trails(pg)
    for _ in range(4):
        pg.evaluate("__pianoPress(__pianoState().next)"); pg.wait_for_timeout(90)
    pg.screenshot(path=str(OUT / 'piano-song.png'))
    t1 = trails(pg)
    check(t1 - t0 >= 12, f'piano: 4 right notes sparkle the trail up out of the keys ({t1 - t0})')
    # a wrong key still sparkles (it's your finger's magic, not a reward)
    st = pg.evaluate('__pianoState()')
    wrong = 'C4' if st['next'] != 'C4' else 'D4'
    pg.evaluate(f"__pianoPress('{wrong}')"); pg.wait_for_timeout(60)
    check(trails(pg) > t1, 'piano: any key press sparkles')
    # Free Play with the bubbles
    pg.evaluate("__game.save.looks.trail = 'bubbles'")
    pg.evaluate("__game.play({ id: 'free', free: true })"); pg.wait_for_timeout(600)
    t2 = trails(pg)
    for n in ['C4', 'E4', 'G4', 'C5']:
        pg.evaluate(f"__pianoPress('{n}')"); pg.wait_for_timeout(80)
    pg.screenshot(path=str(OUT / 'piano-free.png'))
    check(trails(pg) - t2 >= 12, 'piano: Free Play keys bubble too')
    # nothing when no trail is worn
    pg.evaluate("__game.save.looks.trail = null"); t3 = trails(pg)
    pg.evaluate("__pianoPress('D4')")
    check(trails(pg) == t3, 'piano: no trail worn = nothing comes out')
    pg.close()

    b.close()

check(not errors, 'no JavaScript errors' + (': ' + '; '.join(errors[:3]) if errors else ''))
print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
