"""The playtest robot (Nov 23, new plan point 5: the playability check).

Pretend children play the games many times and we count how it went, so we can find the
spots that are too hard (or too easy) and fix them. Big kids and little kids are played
separately (little kids always get Easy plus extra help).

Run:  python3 tools/playtest.py            (every game it knows)
      python3 tools/playtest.py golf       (just one)
      python3 tools/playtest.py golf 30    (30 tries per hole instead of the usual)
Prints a table and writes tests/out/playtest_<game>.json.

How the pretend children play:
  * Putt-Putt Park: they see the best putt (like the test bot) but their hand wobbles: the aim is
    off by a few degrees and the power by a bit; little kids wobble more (KID in golf.js).
  * Potion Quest: they react late (a moment after things happen), miss some bonks, wander a bit,
    forget to step out of a snowball's lane now and then, and only sometimes use the magic
    (the 'kid' bot in quest.js, kidControls()).
The numbers are a model of a child, not a real child, so they show where to look, not the exact answer.
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)

def page(pw, game, little=False):
    b = pw.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    errors = []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto((ROOT / game / 'index.html').as_uri())
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': 'little' if little else 'big'}]}
    pg.evaluate("p => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); }", json.dumps(prof))
    pg.reload(); pg.wait_for_timeout(800)
    return b, pg, errors

# ---------------------------------------------------------------- Putt-Putt Park
def golf(pw, runs=16):
    b, pg, errors = page(pw, 'golf')
    pg.evaluate('__game.play({ id: "h1" })'); pg.wait_for_timeout(1500)
    rows = []
    print(f'Putt-Putt Park: {runs} tries per hole (avg putts / worst / splashes / stars)')
    print(f"{'hole':6}{'par':>4}  {'big kid':^26}  {'little kid':^26}")
    for hid in pg.evaluate('__golfHoles()'):
        r = {k: pg.evaluate(f'__golfPlaytest("{hid}", {str(k == "little").lower()}, {runs}, 7)') for k in ('big', 'little')}
        rows.append({'hole': hid, 'par': r['big']['par'], **r})
        cell = lambda x: f"{x['avg']:5.1f} {x['worst']:3d} {x['splash']:5.1f} {x['stars']:5.2f}" + (' STUCK' if x['stuck'] else '')
        print(f"{hid:6}{r['big']['par']:>4}  {cell(r['big']):26}  {cell(r['little']):26}")
    b.close()
    return rows, errors

# ---------------------------------------------------------------- Potion Quest
QUEST_STAGES = ['s1', 's2', 's3', 's4']
def quest(pw, runs=2, who=('big', 'little')):
    """Each pretend child plays every place `runs` times (heroes taken in turn), carrying on from the
    wave after "Nice try!" like a real child pressing Again (at most 8 tries). Counts the tries, the
    bumps per wave and how long each wave took (game seconds)."""
    rows = []
    for kind in who:
        b, pg, errors = page(pw, 'quest', little=(kind == 'little'))
        print(f'Potion Quest, {kind} kid: {runs} runs per place (tries to win, bumps, minutes; worst wave)')
        for sid in [a for a in sys.argv[1:] if a in QUEST_STAGES] or QUEST_STAGES:      # (e.g. 'playtest.py quest s3' = just Castle Bridge)
            for r in range(runs):
                hero = (r + QUEST_STAGES.index(sid)) % 3
                pg.evaluate(f'document.activeElement && document.activeElement.blur(); __game.play({{ id: "{sid}", fresh: true }})'); pg.wait_for_timeout(2400)
                pg.evaluate(f'__questPick({hero})')
                bumps, secs, tries, won = {}, {}, 0, False
                while tries < 8 and not won:
                    tries += 1
                    pg.evaluate("__questBot('kid', 4)")
                    pg.wait_for_function('__questState().won || __questState().lost', timeout=400000, polling=500)
                    st = pg.evaluate('__questState()')
                    for k, v in st['waveBumps'].items(): bumps[k] = bumps.get(k, 0) + v
                    for k, v in st['waveT'].items(): secs[k] = secs.get(k, 0) + v
                    won = st['won']
                    if not won:
                        pg.wait_for_timeout(1800); pg.evaluate('__game.restart()'); pg.wait_for_timeout(2400)
                row = {'kid': kind, 'stage': sid, 'hero': ['knight', 'ranger', 'wizard'][hero], 'difficulty': st['difficulty'],
                       'won': won, 'tries': tries, 'hearts': st['maxHearts'], 'bumps': bumps, 'secs': {k: round(v) for k, v in secs.items()}}
                rows.append(row)
                worst = max(bumps.items(), key=lambda kv: kv[1]) if bumps else ('-', 0)
                print(f"  {sid} {row['hero']:6} {st['difficulty']:9} {'won' if won else 'NOT WON':7} tries {tries}  bumps {sum(bumps.values()):2d}/{st['maxHearts']} hearts"
                      f"  {sum(secs.values()) / 60:4.1f} min  worst wave {worst[0]} ({worst[1]} bumps, {round(secs.get(worst[0], 0))} s)"
                      f"  waves(s): {[round(secs[k]) for k in sorted(secs, key=int)]}")
        b.close()
    return rows, errors

GAMES = {'golf': golf, 'quest': quest}

if __name__ == '__main__':
    pick = [a for a in sys.argv[1:] if a in GAMES] or list(GAMES)
    num = [int(a) for a in sys.argv[1:] if a.isdigit()]
    who = tuple(a for a in sys.argv[1:] if a in ('big', 'little'))       # (quest: just big or just little kids)
    if who: num = (num or [2]) + [who]
    with sync_playwright() as pw:
        for name in pick:
            t = time.time()
            rows, errors = GAMES[name](pw, *num)
            (OUT / f'playtest_{name}{"_" + "_".join(who) if who else ""}.json').write_text(json.dumps(rows, indent=1))
            print(f'({name}: {time.time() - t:.0f} s, JavaScript errors: {len(errors)})', errors[:3])
