"""Automated test: the playtest robot (Nov 23, new plan point 5: the playability check).

Run:  python3 tests/test_playtest.py        (~3 min)
Checks (the big tables come from tools/playtest.py; this keeps the fixes from coming undone):
  * Putt-Putt Park: pretend children (a wobbly hand, more wobbly for little kids) finish each
    Easy hole (holes 1-3 of both courses) in par + 1 putts or better on average, and never get stuck
  * Bumper Garden (hole 3): a straight putt is no longer blocked by the middle bumper
  * Potion Quest: the Blob King shows his landing ring all through his wind-up, not only in the air,
    and he lands on that spot
  * a pretend big kid (late, misses bonks, wanders) beats Castle Bridge + the Blob King in a few tries
  * no JavaScript errors
"""
import sys, json, math, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

def fresh(pg, game, little=False):
    pg.goto((ROOT / game / 'index.html').as_uri())
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': 'little' if little else 'big'}]}
    pg.evaluate("p => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); }", json.dumps(prof))
    pg.reload(); pg.wait_for_timeout(700)

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('pageerror', lambda e: errors.append(str(e)))

    # ---- Putt-Putt Park ----
    fresh(pg, 'golf')
    pg.evaluate('__game.play({ id: "h3" })'); pg.wait_for_timeout(2000)
    r = pg.evaluate('__golfSim(0, 0.8)')                  # straight at the cup
    check(r['end'] == 'cup' or r['x'] > 560, f"Bumper Garden: a straight putt gets past the middle bumper ({r['end']} at x {round(r['x'])})")
    for hid in ['h1', 'h2', 'h3', 'b1', 'b2', 'b3']:
        for little in (False, True):
            t = pg.evaluate(f'__golfPlaytest("{hid}", {str(little).lower()}, 6, 11)')
            check(t['avg'] <= t['par'] + 1 and not t['stuck'],
                  f"{hid} ({'little' if little else 'big'} kid): par + 1 or better ({t['avg']:.1f} putts, par {t['par']}, worst {t['worst']})")

    # ---- Potion Quest: the Blob King ----
    fresh(pg, 'quest')
    pg.evaluate('document.activeElement && document.activeElement.blur(); __game.play({ id: "s3", fresh: true })'); pg.wait_for_timeout(2400)
    pg.evaluate('__questPick(0)'); pg.evaluate('__questWave(4)'); pg.evaluate('__questBot(true, 1)')
    pg.wait_for_function('__questState().king', timeout=20000); pg.evaluate('__questBot(false)')      # walk up to him, then stand still
    seen = {'windup': None, 'land': None}
    for _ in range(120):                                  # stand still and watch him (12 s)
        k = pg.evaluate('__questState().king')
        if k and k['state'] == 'windup' and k['land'] and not seen['windup']: seen['windup'] = k['land']
        if seen['windup'] and k and k['state'] == 'chase' and not seen['land']:
            seen['land'] = [s for s in pg.evaluate('__questTest.spots()') if s['type'] == 'king']
            break
        pg.wait_for_timeout(100)
    check(seen['windup'] is not None, f"the Blob King's landing ring shows during his wind-up ({seen['windup']})")
    if seen['windup'] and seen['land']:
        k = seen['land'][0]
        check(math.hypot(k['x'] - seen['windup'][0], k['y'] - seen['windup'][1]) < 20, f"...and he lands right there ({round(k['x'])},{round(k['y'])})")

    # a pretend big kid plays Castle Bridge (Normal) with the Knight, carrying on from the wave after "Nice try!"
    pg.evaluate('document.activeElement && document.activeElement.blur(); __game.play({ id: "s3", fresh: true })'); pg.wait_for_timeout(2400)
    pg.evaluate('__questPick(0)')
    tries, won = 0, False
    while tries < 4 and not won:
        tries += 1
        pg.evaluate("__questBot('kid', 4)")
        pg.wait_for_function('__questState().won || __questState().lost', timeout=300000, polling=500)
        won = pg.evaluate('__questState().won')
        if not won: pg.wait_for_timeout(1800); pg.evaluate('__game.restart()'); pg.wait_for_timeout(2400)
    check(won, f'a pretend big kid beats Castle Bridge + the Blob King (tries: {tries})')
    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
sys.exit(1 if fails else 0)
