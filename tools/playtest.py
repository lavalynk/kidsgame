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
  * Jungle Jump: big kids: the test robot picks a good move, the child does it a bit sloppily (the jump a
    moment late, the leaf let go too soon, sometimes the second-best move). Little kids play one thumb: they tap
    Jump a little while after the hero stops at a gap, sometimes hold it, sometimes tap for no reason
    (kidPlan() / kidThumb() in jungle.js).
  * Treasure Trail: they walk on and wait at the scary bits, SEE when a jump would be good (vine coming, hippo
    up, a log the right distance away) but press a moment late; sometimes jump without looking (kidPlay() in trail.js).
  * Potion Quest: they react late (a moment after things happen), miss some bonks, wander a bit,
    forget to step out of a snowball's lane now and then, and only sometimes use the magic
    (the 'kid' bot in quest.js, kidControls()).
  * Turbo Bike: big kids hold Gas the whole time and love Turbo (let go when the engine looks hot, a moment late);
    in the air most let go of Gas, some keep holding it (nose down), a few try to tilt and overdo it; lanes now and
    then. Little kids play one thumb: only a lane tap now and then (kidThink() in bike.js).
  * Mini RC Racers: big kids look where the road goes a moment late, hold a turn about as long as it needs (often too
    long), hardly brake, look away now and then, and mix up left and right when the car drives DOWN the screen; they
    back up when stuck. Little kids play one thumb: the car drives itself, they press left / right now and then
    (kidThink() in rc.js).
  * Bullseye Adventure (archery): picks something to shoot (mostly the big target, sometimes a balloon / star), takes
    a moment to aim. Easy shows the whole flight, so only the hand wobbles; on Normal / Challenge the child guesses the
    pull, aims at where a moving thing is NOW, and gets closer shot by shot (kidThink() in archery.js).
  * Hoop Heroes: shoots when a ball is there; a "feel" for the pull that gets closer each shot (and is suddenly short
    when the hoop moves back for the bonus); the hand wobbles; aims at a sliding hoop where it is now (big kids slowly
    learn to aim ahead). The game's aim help works on it like on a real child (kidThink() in hoops.js).
  * Space Defender: auto-fire on; looks at the screen every moment, flies in line with the nearest baddie / the boss,
    goes for presents, and moves away from danger it has NOTICED (bubbles, baddies, a boss's warning stripes: noticed
    a moment late, and not always; little kids miss more); looks away now and then (kidThink() in space.js).
  * Fishing Frenzy: only "presses" the big button (big kids also Up / Down now and then). Casts after a moment (big kids
    often go for the longest cast, let go of the meter a moment late), wiggles the lure now and then, gets bored and
    recasts; sometimes taps on a little nibble bob (too early); taps a moment after the big dip (sometimes looking away);
    reels with a thumb a moment late, aiming roughly at the green, or just holds until it looks red. Little kids: one
    thumb (kidThink() in fishing.js). Each place is played with the rod a child has by then (FISH_RODS).
  * Bubble School: listens, then taps after a few seconds; knows the answer some of the time (KNOW in abc.js, by kind of
    question and age), otherwise guesses; big kids try a different bubble after a wrong one, little kids sometimes tap
    the same one again; the finger lands near the bubble, not on it; now and then a little kid taps somewhere else.
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

# ---------------------------------------------------------------- Jungle Jump
# the routes the test robot follows (copied from tests/test_jungle.py: they lead to each level's treasure)
JUNGLE_ROUTES = {
    'big': {'forest2': [[24, 14], [29, 12], [34, 10], [42, 10], [47, 8], [51, 6], [59, 4], [90, 10]],
            'cave2': [[40, 8], [63, 5], [70, 8], [62, 8]],
            'snow2': [[14, 14], [21, 6], [24, 10], [36, 6], [55, 10], [64, 6], [76, 3]],
            'candy2': [[47, 3], [81, 10], [88, 5]]},
}
JUNGLE_LEVELS = ['forest', 'forest2', 'cave', 'cave2', 'snow', 'snow2', 'candy', 'candy2']
def jungle(pw, runs=3, who=('big', 'little')):
    """Each pretend child plays every level `runs` times (a different dice each time), tapping Again after a
    "Nice try!" (at most 6). Big kids steer with both thumbs; little kids play one thumb (the game walks).
    Counts the tries, the falls + bumps, the minutes, and the stretch of the level (8 tiles) with the most ouches."""
    rows = []
    for kind in who:
        b, pg, errors = page(pw, 'jungle', little=(kind == 'little'))
        print(f'Jungle Jump, {kind} kid: {runs} runs per level (tries, falls, bumps, minutes; the worst stretch)')
        for lid in [a for a in sys.argv[1:] if a in JUNGLE_LEVELS] or JUNGLE_LEVELS:
            route = json.dumps(JUNGLE_ROUTES.get(kind, {}).get(lid, []))
            for r in range(runs):
                pg.evaluate(f"document.activeElement && document.activeElement.blur(); __game.play(__jungleDebug.LEVELS.find(l => l.id === '{lid}'))")
                pg.wait_for_timeout(700)
                ouch, tries, won, mins, stuck = [], 0, False, 0, False
                while tries < 6 and not won:
                    tries += 1
                    pg.evaluate(f"__jungleBot('kid', 8, {route}, {r * 7919 + 13})")
                    pg.wait_for_function('__jungleState().finished || __jungleState().clock > 300', timeout=300000, polling=300)
                    st = pg.evaluate('__jungleState()')
                    ouch += st['ouches']; mins += st['clock'] / 60
                    won = st['finished'] and not st['dead']
                    if not won and st['clock'] > 300: stuck = True; break
                    if not won:
                        pg.wait_for_timeout(1500); pg.evaluate('__game.restart()'); pg.wait_for_timeout(700)
                pg.evaluate('__jungleBot(false)')
                spots = {}
                for o in ouch: spots[o['x'] // (48 * 8)] = spots.get(o['x'] // (48 * 8), 0) + 1
                worst = max(spots.items(), key=lambda kv: kv[1]) if spots else (None, 0)
                row = {'kid': kind, 'level': lid, 'difficulty': st['difficulty'], 'won': won, 'stuck': stuck, 'tries': tries,
                       'pits': sum(o['k'] == 'pit' for o in ouch), 'bumps': sum(o['k'] == 'ouch' for o in ouch),
                       'minutes': round(mins, 1), 'stars': f"{st['stars']}/{st['starsTotal']}", 'treasure': st['treasure'],
                       'worst': None if worst[0] is None else [worst[0] * 8, worst[0] * 8 + 7, worst[1]], 'ouches': ouch}
                rows.append(row)
                print(f"  {lid:8}{st['difficulty']:>10} {'won' if won else ('STUCK' if stuck else 'NOT WON'):8} tries {tries}  falls {row['pits']:2d}  bumps {row['bumps']:2d}"
                      f"  {mins:4.1f} min  stars {row['stars']:>6}{' +treasure' if st['treasure'] else ''}"
                      + (f"  worst: tiles {worst[0] * 8}-{worst[0] * 8 + 7} ({worst[1]})" if worst[0] is not None else ''))
        b.close()
    return rows, errors

# ---------------------------------------------------------------- Treasure Trail
TRAIL_ADVENTURES = ['river', 'deep', 'temple', 'dusk', 'falls', 'shroom']
def trail(pw, runs=3, who=('big', 'little')):
    """Each pretend child plays every adventure `runs` times, tapping Again after a "Nice try!" (at most 6).
    Counts the tries, bumps + splashes per kind of room, the minutes and the treasures."""
    rows = []
    for kind in who:
        b, pg, errors = page(pw, 'trail', little=(kind == 'little'))
        print(f'Treasure Trail, {kind} kid: {runs} runs per adventure (tries, ouches, minutes, treasures; the worst kind of room)')
        for aid in [a for a in sys.argv[1:] if a in TRAIL_ADVENTURES] or TRAIL_ADVENTURES:
            for r in range(runs):
                pg.evaluate(f"document.activeElement && document.activeElement.blur(); __game.play(__trailDebug.ADVENTURES.find(a => a.id === '{aid}'))")
                pg.wait_for_timeout(600)
                ouch, tries, won, mins, stuck = [], 0, False, 0, False
                while tries < 6 and not won:
                    tries += 1
                    pg.evaluate(f"__trailBot(true, {r * 7919 + 13}, 6)")
                    t0 = pg.evaluate('__trailState().time')
                    pg.wait_for_function(f'__trailState().finished || __trailState().time > {t0} + 400', timeout=300000, polling=300)
                    st = pg.evaluate('__trailState()')
                    ouch += st['ouches']; mins += (st['time'] - t0) / 60
                    won = st['finished'] and not st['dead']
                    if not st['finished']: stuck = True; break
                    if not won:
                        pg.wait_for_timeout(1500); pg.evaluate('__game.restart()'); pg.wait_for_timeout(600)
                pg.evaluate('__trailBot(false)')
                kinds = {}
                for o in ouch: kinds[o['type']] = kinds.get(o['type'], 0) + 1
                worst = max(kinds.items(), key=lambda kv: kv[1]) if kinds else (None, 0)
                row = {'kid': kind, 'adventure': aid, 'difficulty': st['difficulty'], 'won': won, 'stuck': stuck, 'tries': tries,
                       'ouches': ouch, 'byRoom': kinds, 'minutes': round(mins, 1), 'treasures': f"{st['got']}/{st['total']}"}
                rows.append(row)
                print(f"  {aid:7}{st['difficulty']:>10} {'won' if won else ('STUCK in ' + st['type'] if stuck else 'NOT WON'):8} tries {tries}  ouches {len(ouch):2d}"
                      f"  {mins:4.1f} min  treasures {row['treasures']:>5}  " + ' '.join(f'{k}:{v}' for k, v in sorted(kinds.items(), key=lambda kv: -kv[1])))
        b.close()
    return rows, errors

# ---------------------------------------------------------------- Turbo Bike
BIKE_TRACKS = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10']
def bike(pw, runs=6, who=('big', 'little')):
    """Each pretend child rides every track `runs` times in fast-forward (a different dice each time).
    Counts medals, places, tumbles, "Too hot!", wobbles and the time against par."""
    rows = []
    for kind in who:
        b, pg, errors = page(pw, 'bike', little=(kind == 'little'))
        print(f'Turbo Bike, {kind} kid: {runs} rides per track (medals g/s/b/-, places, time / par, tumbles, too hot, wobbles per ride)')
        for tid in [a for a in sys.argv[1:] if a in BIKE_TRACKS] or BIKE_TRACKS:
            rides = []
            for r in range(runs):
                pg.evaluate(f"document.activeElement && document.activeElement.blur(); __game.play(__bikeTrack('{tid}'))")
                pg.wait_for_function(f"typeof __bikeKid === 'function' && __bikeState().level === '{tid}'")
                pg.evaluate(f'__bikeKid(true, {r * 7919 + 13})')
                for _ in range(40):
                    pg.evaluate('__bikeStep(5)')
                    if pg.evaluate('__bikeState().finished'): break
                rides.append(pg.evaluate('__bikeKidReport()'))
            pg.evaluate('__bikeKid(false)')
            med = [sum(x['medal'] == m for x in rides) for m in ('gold', 'silver', 'bronze', None)]
            avg = lambda k: sum(x[k] for x in rides) / len(rides)
            row = {'kid': kind, 'track': tid, 'difficulty': rides[0]['diff'], 'par': rides[0]['par'], 'medals': med,
                   'places': [x['place'] for x in rides], 'timePar': round(avg('time') / rides[0]['par'], 2), 'worstPar': round(max(x['time'] for x in rides) / rides[0]['par'], 2),
                   'crashes': round(avg('crashes'), 1), 'hot': round(avg('hot'), 1), 'wobbles': round(avg('wobbles'), 1),
                   'unfinished': sum(not x['finished'] for x in rides), 'rides': rides}
            spots = {}
            for x in rides:
                for w in x['where']: spots[w] = spots.get(w, 0) + 1
            row['spots'] = dict(sorted(spots.items(), key=lambda kv: -kv[1]))
            rows.append(row)
            print(f"  {tid:4}{row['difficulty']:>10}  medals {'/'.join(map(str, med))}  places {row['places']}  time/par {row['timePar']:.2f} (worst {row['worstPar']:.2f})"
                  f"  tumbles {row['crashes']:.1f}  too hot {row['hot']:.1f}  wobbles {row['wobbles']:.1f}" + (f"  NOT FINISHED {row['unfinished']}" if row['unfinished'] else '')
                  + ('  where: ' + ', '.join(f'{k} x{v}' for k, v in list(row['spots'].items())[:3]) if spots else ''))
        b.close()
    return rows, errors

# ---------------------------------------------------------------- Mini RC Racers
RC_TRACKS = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10']
def rc(pw, runs=4, who=('big', 'little')):
    """Each pretend child races every track `runs` times in fast-forward (3 laps against the 3 rivals).
    Counts places, the time behind the winner, seconds off the road / stuck, wall bumps, lifts back onto the road."""
    rows = []
    for kind in who:
        b, pg, errors = page(pw, 'rc', little=(kind == 'little'))
        print(f'Mini RC Racers, {kind} kid: {runs} races per track (places, seconds behind the winner, per race: off the road s, stuck s, bumps, lifts, left/right mix-ups)')
        for tid in [a for a in sys.argv[1:] if a in RC_TRACKS] or RC_TRACKS:
            races = []
            for r in range(runs):
                pg.evaluate(f"document.activeElement && document.activeElement.blur(); __game.play({{ id: '{tid}' }})")
                pg.wait_for_function(f"typeof __rcKid === 'function' && __rcState().track === '{tid}' && __rcState().raceTime === 0")
                pg.evaluate(f'__rcKid(true, {r * 7919 + 13})')
                for _ in range(60):
                    pg.evaluate('__rcStep(5)')
                    if pg.evaluate('__rcState().finished'): break
                races.append(pg.evaluate('__rcKidReport()'))
            pg.evaluate('__rcKid(false)')
            avg = lambda k: sum(x[k] for x in races) / len(races)
            behind = [round(x['time'] - x['winner'], 1) if x['finished'] and x['winner'] else None for x in races]
            row = {'kid': kind, 'track': tid, 'places': [x['place'] for x in races], 'behind': behind,
                   'off': round(avg('off'), 1), 'slow': round(avg('slow'), 1), 'bumps': round(avg('bumps'), 1), 'lifts': round(avg('lifts'), 1),
                   'mixups': round(avg('mixups'), 1), 'time': round(avg('raceTime'), 1), 'unfinished': sum(not x['finished'] for x in races), 'races': races}
            rows.append(row)
            print(f"  {tid:4} places {row['places']}  behind {behind}  ({row['time']:.0f} s)  off road {row['off']:4.1f}  stuck {row['slow']:4.1f}"
                  f"  bumps {row['bumps']:4.1f}  lifts {row['lifts']:.1f}  mix-ups {row['mixups']:.1f}" + (f"  NOT FINISHED {row['unfinished']}" if row['unfinished'] else ''))
        b.close()
    return rows, errors

# ---------------------------------------------------------------- Bullseye Adventure (archery)
ARCHERY_LEVELS = ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9', 'l10', 'l11', 'l12']
def archery(pw, runs=6, who=('big', 'little')):
    """Each pretend child plays every level `runs` times in fast-forward (a different dice each time).
    Counts wins (1 star = the goal), stars, points against the goal, misses and how often the wanted thing was hit."""
    rows = []
    for kind in who:
        b, pg, errors = page(pw, 'archery', little=(kind == 'little'))
        print(f'Bullseye Adventure, {kind} kid: {runs} goes per level (wins, stars, points / goal, arrows, misses, wanted thing hit)')
        for lid in [a for a in sys.argv[1:] if a in ARCHERY_LEVELS] or ARCHERY_LEVELS:
            goes = []
            for r in range(runs):
                pg.evaluate(f"document.activeElement && document.activeElement.blur(); __game.play(__archeryScene.level('{lid}'))")
                pg.wait_for_function(f"typeof __archeryKid === 'function' && __archeryState().level === '{lid}'")
                pg.evaluate(f'__archeryKid(true, {r * 7919 + 13})')
                for _ in range(60):
                    pg.evaluate('__archeryStep(5)')
                    if pg.evaluate('__archeryKidReport().ended'): break
                goes.append(pg.evaluate('__archeryKidReport()'))
            pg.evaluate('__archeryKid(false)')
            k = [x['kid'] for x in goes]
            row = {'kid': kind, 'level': lid, 'difficulty': goes[0]['diff'], 'goal': goes[0]['thresholds'], 'wins': sum(x['won'] for x in goes),
                   'stars': [x['stars'] for x in goes], 'scores': [x['score'] for x in goes], 'arrows': goes[0]['arrows'],
                   'misses': round(sum(x['misses'] for x in k) / len(k), 1), 'wantedHit': round(sum(x['gotWanted'] for x in k) / max(1, sum(x['wanted'] for x in k)), 2),
                   'goes': goes}
            rows.append(row)
            print(f"  {lid:4}{row['difficulty']:>10}  wins {row['wins']}/{runs}  stars {row['stars']}  points {row['scores']} (goal {row['goal']})"
                  f"  arrows {row['arrows']}  misses {row['misses']:.1f}  wanted hit {row['wantedHit']:.0%}  " + ' '.join(f"{t}:{sum(x['got'].get(t, 0) for x in k)}/{sum(x['aimed'].get(t, 0) for x in k)}" for t in ('ring', 'wheel', 'balloon', 'star') if any(x['aimed'].get(t) for x in k)))
        b.close()
    return rows, errors

# ---------------------------------------------------------------- Hoop Heroes
HOOPS_LEVELS = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'free', 'c1', 'c2', 'c3', 'c4']
def hoops(pw, runs=6, who=('big', 'little')):
    """Each pretend child plays every round `runs` times in fast-forward. Counts wins against the rival, stars,
    both scores, how many shots went in, and how many 3-point bonus baskets."""
    rows = []
    for kind in who:
        b, pg, errors = page(pw, 'hoops', little=(kind == 'little'))
        print(f'Hoop Heroes, {kind} kid: {runs} rounds per rival (wins, stars, scores you-rival, baskets / shots, bonus baskets)')
        for lid in [a for a in sys.argv[1:] if a in HOOPS_LEVELS] or HOOPS_LEVELS:
            goes = []
            for r in range(runs):
                pg.evaluate(f"document.activeElement && document.activeElement.blur(); __game.play(__hoopsScene.level('{lid}'))")
                pg.wait_for_function(f"typeof __hoopsKid === 'function' && __hoopsState().level === '{lid}'")
                pg.evaluate(f'__hoopsKid(true, {r * 7919 + 13})')
                for _ in range(40):
                    pg.evaluate('__hoopsStep(5)')
                    if pg.evaluate('__hoopsKidReport().done'): break
                goes.append(pg.evaluate('__hoopsKidReport()'))
            pg.evaluate('__hoopsKid(false)')
            row = {'kid': kind, 'level': lid, 'difficulty': goes[0]['diff'], 'wins': sum(x['win'] for x in goes), 'stars': [x['stars'] for x in goes],
                   'scores': [f"{x['score']}-{x['rival']}" for x in goes], 'madeRate': round(sum(x['made'] for x in goes) / max(1, sum(x['shots'] for x in goes)), 2),
                   'shots': round(sum(x['shots'] for x in goes) / len(goes), 1), 'bonus': round(sum(x['bonusMade'] for x in goes) / len(goes), 1), 'goes': goes}
            rows.append(row)
            print(f"  {lid:5}{row['difficulty']:>10}  wins {row['wins']}/{runs}  stars {row['stars']}  scores {row['scores']}"
                  f"  in {row['madeRate']:.0%} of {row['shots']:.0f} shots  bonus {row['bonus']:.1f}")
        b.close()
    return rows, errors

# ---------------------------------------------------------------- Space Defender
SPACE_SECTORS = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10']
def space(pw, runs=3, who=('big', 'little')):
    """Each pretend child flies every sector `runs` times in fast-forward (auto-fire on). After a "Nice try!" it carries
    on from the checkpoint when there is one (at most 5 tries). Counts tries, bumps (and what bumped it), minutes."""
    rows = []
    for kind in who:
        b, pg, errors = page(pw, 'space', little=(kind == 'little'))
        pg.evaluate("__game.save.data.autofire = true")
        print(f'Space Defender, {kind} kid: {runs} runs per sector (tries, bumps / lives, minutes; what bumped it most)')
        for sid in [a for a in sys.argv[1:] if a in SPACE_SECTORS] or SPACE_SECTORS:
            for r in range(runs):
                pg.evaluate(f"document.activeElement && document.activeElement.blur(); __game.play(SpaceData.SECTORS.concat([SpaceData.STARTER]).find(s => s.id === '{sid}'))")
                pg.wait_for_function("typeof __spaceTest === 'object'")
                tries, won, hits, mins, bumps, lives, where = 0, False, {}, 0, 0, 0, []
                while tries < 5 and not won:
                    tries += 1
                    pg.wait_for_function(f"__spaceState().sector === '{sid}' && !__spaceState().finished")
                    pg.evaluate(f'__spaceTest.kid(true, {r * 7919 + tries * 31 + 13})')
                    for _ in range(80):
                        pg.evaluate('__spaceTest.step(5)')
                        if pg.evaluate('__spaceState().finished'): break
                    rep = pg.evaluate('__spaceTest.kidReport()')
                    for k, v in rep['hits'].items(): hits[k] = hits.get(k, 0) + v
                    mins += rep['time'] / 60; bumps += sum(rep['hits'].values()); lives = rep['startLives']
                    won = rep['won']
                    if not won:
                        where.append(('boss' if rep['boss'] == 'big' else 'mini' if rep['boss'] == 'mini' else f"wave {rep['part']}.{rep['wave']}"))
                        pg.evaluate('__spaceTest.kid(false)')
                        pg.wait_for_timeout(1700)
                        cp = pg.evaluate("ArcadeMenus.isOpen && ArcadeMenus.list().some(i => i.attr === 'checkpoint')")
                        pg.evaluate("ArcadeMenus.tap('checkpoint')" if cp else "__game.restart()")
                        pg.wait_for_timeout(600)
                pg.evaluate('__spaceTest.kid(false)')
                worst = sorted(hits.items(), key=lambda kv: -kv[1])[:3]
                row = {'kid': kind, 'sector': sid, 'difficulty': rep['diff'], 'won': won, 'tries': tries, 'lost at': where, 'bumps': bumps, 'lives': lives,
                       'minutes': round(mins, 1), 'hits': hits}
                rows.append(row)
                print(f"  {sid:4}{rep['diff']:>10} {'won' if won else 'NOT WON':7} tries {tries}  bumps {bumps:2d} ({lives} lives)  {mins:4.1f} min"
                      + (f"  lost at {where}" if where else '') + '  ' + ', '.join(f'{k} x{v}' for k, v in worst))
        b.close()
    return rows, errors

# ---------------------------------------------------------------- Fishing Frenzy
FISH_RODS = {'pond': 'twig', 'pier': 'bamboo', 'ice': 'super', 'night': 'super'}   # (bamboo: 5 fish caught, super: 8 kinds found)
FISH_LEVELS = ['pond-relax', 'pond-timed', 'pier-relax', 'pier-timed', 'ice-relax', 'ice-timed', 'night-relax', 'night-timed']
def fishing(pw, runs=4, who=('big', 'little')):
    """Each pretend child fishes every place `runs` times in fast-forward: a Frenzy round (90 s) to the end, a relax
    round for 3 minutes. Counts fish, stars, bites missed (too slow), fish scared by an early tap, snapped lines."""
    rows = []
    for kind in who:
        b, pg, errors = page(pw, 'fishing', little=(kind == 'little'))
        print(f'Fishing Frenzy, {kind} kid: {runs} goes per place (fish, stars, too slow / too early / snaps per go, seconds per fish waiting + reeling)')
        for lid in [a for a in sys.argv[1:] if a in FISH_LEVELS] or FISH_LEVELS:
            goes = []
            for r in range(runs):
                rod = FISH_RODS[lid.split('-')[0]]           # the rod a child has by the time a place opens
                pg.evaluate(f"__game.save.data.rod = '{rod}'; __game.save.unlocked.includes('rod-{rod}') || __game.save.unlocked.push('rod-{rod}')")
                pg.evaluate(f"document.activeElement && document.activeElement.blur(); __game.play({{ id: '{lid}', loc: '{lid.split('-')[0]}', mode: '{lid.split('-')[1]}' }})")
                pg.wait_for_function(f"typeof __fishingKid === 'function' && __game.level && __game.level.id === '{lid}'")
                pg.evaluate(f'__fishingKid(true, {r * 7919 + 13})')
                for _ in range(36):
                    pg.evaluate('__fishingStep(5)')
                    rep = pg.evaluate('__fishingKidReport()')
                    if rep['ended'] or (rep['mode'] == 'relax' and _ >= 35): break
                goes.append(rep)
                pg.evaluate('__fishingKid(false)')
            k = [x['kid'] for x in goes]
            avg = lambda f: round(sum(f(x) for x in goes) / len(goes), 1)
            row = {'kid': kind, 'level': lid, 'difficulty': goes[0]['diff'], 'fish': [x['caught'] for x in goes], 'stars': [x['stars'] for x in goes],
                   'scores': [x['score'] for x in goes], 'goal': goes[0]['thresholds'], 'late': avg(lambda x: x['kid']['late']), 'scared': avg(lambda x: x['early']),
                   'earlyTaps': avg(lambda x: x['kid'].get('earlyTaps', 0)), 'snaps': avg(lambda x: x['snaps']), 'recasts': avg(lambda x: x['kid']['recasts']),
                   'waitPerFish': round(sum(x['waitT'] for x in k) / max(1, sum(x['catches'] for x in k)), 1),
                   'reelPerFish': round(sum(x['reelT'] for x in k) / max(1, sum(x['catches'] for x in k)), 1),
                   'green': round(sum(x['inGreen'] for x in k) / max(0.01, sum(x['reelT'] for x in k)), 2), 'goes': goes}
            rows.append(row)
            print(f"  {lid:12}{row['difficulty']:>10} {goes[0]['rod']:7} fish {row['fish']}  stars {row['stars']}" + (f"  points {row['scores']} (goal {row['goal']})" if 'timed' in lid else '') +
                  f"  slow {row['late']}  scared {row['scared']} (early taps {row['earlyTaps']})  snaps {row['snaps']}  bored {row['recasts']}"
                  f"  wait {row['waitPerFish']} s + reel {row['reelPerFish']} s a fish (in green {row['green']:.0%})")
        b.close()
    return rows, errors

# ---------------------------------------------------------------- Bubble School
ABC_LEVELS = ['l1', 'l14', 'l15', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9', 'l10', 'l11', 'l12', 'l13']
def abc(pw, runs=4, who=('big', 'little')):
    """Each pretend child plays every topic `runs` times in fast-forward (10 questions). Counts wrong taps, stars,
    taps on the same wrong bubble again, finger slips onto a neighbour bubble, taps that hit nothing, minutes."""
    rows = []
    for kind in who:
        b, pg, errors = page(pw, 'abc', little=(kind == 'little'))
        pg.evaluate("__game.save.data.voice = false")
        print(f'Bubble School, {kind} kid: {runs} goes per topic (stars, wrong taps, same wrong bubble again, slips, missed taps, most taps on one question, minutes)')
        for lid in [a for a in sys.argv[1:] if a in ABC_LEVELS] or ABC_LEVELS:
            goes = []
            for r in range(runs):
                pg.evaluate(f"document.activeElement && document.activeElement.blur(); __game.play(__abcLevel('{lid}'))")
                pg.wait_for_function(f"typeof __abcKid === 'function' && __abcState().level === '{lid}'")
                pg.evaluate(f'__abcKid(true, {r * 7919 + 13})')
                for _ in range(40):
                    pg.evaluate('__abcStep(5)')
                    if pg.evaluate('__abcKidReport().done'): break
                goes.append(pg.evaluate('__abcKidReport()'))
                pg.evaluate('__abcKid(false)')
            k = [x['kid'] for x in goes]
            avg = lambda f: round(sum(f(x) for x in k) / len(k), 1)
            row = {'kid': kind, 'level': lid, 'difficulty': goes[0]['diff'], 'stars': [x['stars'] for x in goes], 'misses': [x['misses'] for x in goes],
                   'same': avg(lambda x: x['same']), 'slips': avg(lambda x: x['slips']), 'nothing': avg(lambda x: x['nothing']), 'hints': avg(lambda x: x['hints']),
                   'worstQ': max(max(x['perQ'] or [0]) for x in k), 'minutes': round(sum(x['time'] for x in k) / len(k) / 60, 1), 'done': all(x['done'] for x in goes), 'goes': goes}
            rows.append(row)
            print(f"  {lid:4}{row['difficulty']:>10}  stars {row['stars']}  wrong {row['misses']}  same again {row['same']}  slips {row['slips']}  missed {row['nothing']}"
                  f"  hints {row['hints']}  worst question {row['worstQ']} taps  {row['minutes']} min" + ('' if row['done'] else '  NOT DONE'))
        b.close()
    return rows, errors

GAMES = {'golf': golf, 'quest': quest, 'jungle': jungle, 'trail': trail, 'bike': bike, 'rc': rc, 'archery': archery, 'hoops': hoops, 'space': space, 'fishing': fishing, 'abc': abc}

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
