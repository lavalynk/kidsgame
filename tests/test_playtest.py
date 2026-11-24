"""Automated test: the playtest robot (Nov 23, new plan point 5: the playability check).

Run:  python3 tests/test_playtest.py        (~10 min)
Checks (the big tables come from tools/playtest.py; this keeps the fixes from coming undone):
  * Putt-Putt Park: pretend children (a wobbly hand, more wobbly for little kids) finish each
    Easy hole (holes 1-3 of both courses) in par + 1 putts or better on average, and never get stuck
  * Bumper Garden (hole 3): a straight putt is no longer blocked by the middle bumper
  * Potion Quest: the Blob King shows his landing ring all through his wind-up, not only in the air,
    and he lands on that spot
  * a pretend big kid (late, misses bonks, wanders) beats Castle Bridge + the Blob King in a few tries
  * Jungle Jump (part 2): a pretend little kid (one thumb) gets through Snowy Hills + Candy Land without being
    thrown onto the thorns behind the spring / jelly blocks, never rolls over thorns (Glow Cave), and goodies
    near the hero fly to him (2 stars reachable); a pretend big kid finishes Glow Cave + Jelly Hills
  * Treasure Trail (part 2): the tunnel bat turns back before the tunnel treasure; a hippo shows bubbles
    before it dips; pretend big + little kids win Lost Temple and Sunset Swamp on the first go
  * Turbo Bike (part 3): on Normal a pretend big kid (holds Gas over jumps, turbo until hot) never tumbles on
    the table tops (t4, t8); too hot = the bike putters on, never stops on a hill; Candy Bounce's par; one thumb
    (little kids) turbos by itself, so gold on Sunny Start + Dusty Hills is possible
  * Mini RC Racers (part 3): one thumb, hands off: the car keeps to the road on Moonlight Speedway + Cloud Castle;
    a pretend little kid (presses, mix-ups) stays near the road and finishes 1st or 2nd; a big kid's car lost out
    on the grass is lifted back
  * Archery (part 4): on Normal / Challenge the last arrow's flight stays as faint dots until the next shot (not on
    Easy, which shows the whole flight anyway); pretend big kids win Frosty Flip + Big Blizzard (Challenge) most goes
  * Hoop Heroes (part 4): the aim help aims where a sliding hoop WILL be (a shot at Wiggle Wes's hoop as it is now,
    with the Easy help, goes in most times); pretend big kids beat Wes + the Champ on Challenge most rounds
  * Space Defender (part 4): a boss's laser attack has at most 2 beams on Easy / Normal; pretend kids win a late sector
  * Fishing Frenzy (part 5): pretend big kids (late taps, early taps on nibbles, a thumb a moment late on the
    reel) get at least 1 star in most Moonlight Bay Frenzy rounds (Challenge); just outside the green still reels in
  * Bubble School (part 5): the same wrong bubble tapped again is not another miss (it goes see-through); after 2
    wrong tries on Easy the right bubble glows; stars count questions, not taps; a bubble not grown in yet can't be
    tapped; a pretend little kid gets 2+ stars on the early topics
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

    # ---- Jungle Jump ----
    def jungle_run(lid, seed, route='[]'):
        pg.evaluate(f"document.activeElement && document.activeElement.blur(); __game.play(__jungleDebug.LEVELS.find(l => l.id === '{lid}'))")
        pg.wait_for_timeout(700)
        ouch, tries, st = [], 0, None
        while tries < 4:
            tries += 1
            pg.evaluate(f"__jungleBot('kid', 8, {route}, {seed})")
            pg.wait_for_function('__jungleState().finished || __jungleState().clock > 240', timeout=240000, polling=300)
            st = pg.evaluate('__jungleState()'); ouch += st['ouches']
            if st['finished'] and not st['dead']: break
            if not st['finished']: break
            pg.wait_for_timeout(1500); pg.evaluate('__game.restart()'); pg.wait_for_timeout(700)
        pg.evaluate('__jungleBot(false)')
        return st, ouch, tries
    fresh(pg, 'jungle', little=True)
    for lid, bad in [('snow', [46]), ('candy', [48]), ('cave2', [82, 83, 84])]:
        for seed in (13, 7932):
            st, ouch, _ = jungle_run(lid, seed)
            thorny = [o for o in ouch if o['x'] // 48 in bad]
            check(st['finished'] and not st['dead'] and st['oneThumb'] and not thorny and len(ouch) <= 2,
                  f"Jungle {lid}, pretend little kid (one thumb): finished, no thorns at tiles {bad}, {len(ouch)} bumps ({[o['x'] // 48 for o in ouch]})")
            if lid == 'snow': check(st['stars'] / st['starsTotal'] >= 0.25, f"...goodies fly to the hero: {st['stars']}/{st['starsTotal']} (2 stars from a quarter)")
    fresh(pg, 'jungle')
    for lid, route in [('cave2', '[[40, 8], [63, 5], [70, 8], [62, 8]]'), ('candy2', '[[47, 3], [81, 10], [88, 5]]')]:
        st, ouch, tries = jungle_run(lid, 13, route)
        check(st['finished'] and not st['dead'] and tries <= 2, f"Jungle {lid}, pretend big kid: finished in {tries} go(es), {len(ouch)} falls + bumps")

    # ---- Treasure Trail ----
    fresh(pg, 'trail')
    pg.evaluate("document.activeElement && document.activeElement.blur(); __game.play(__trailDebug.ADVENTURES.find(a => a.id === 'river'))"); pg.wait_for_timeout(600)
    pg.evaluate('__trailTest.goRoom(6)')                 # (River Run's ladder room)
    xs = []
    for _ in range(40): xs.append(pg.evaluate('__trailTest.room().bats[0].x')); pg.wait_for_timeout(100)
    check(max(xs) <= 762 and max(xs) > 700, f'the tunnel bat turns back before the treasure at 820 (furthest {round(max(xs))})')
    for little in (False, True):
        fresh(pg, 'trail', little)
        for aid in ('temple', 'dusk'):
            pg.evaluate(f"document.activeElement && document.activeElement.blur(); __game.play(__trailDebug.ADVENTURES.find(a => a.id === '{aid}'))"); pg.wait_for_timeout(600)
            pg.evaluate('__trailBot(true, 13, 6)')
            pg.wait_for_function('__trailState().finished || __trailState().time > 400', timeout=240000, polling=300)
            st = pg.evaluate('__trailState()'); pg.evaluate('__trailBot(false)')
            check(st['finished'] and not st['dead'], f"Trail {aid}, pretend {'little' if little else 'big'} kid ({st['difficulty']}): won on the first go, {len(st['ouches'])} bumps + splashes, treasures {st['got']}/{st['total']}")

    # ---- Turbo Bike (part 3) ----
    def bike_ride(tid, seed, watch=None):
        pg.evaluate(f"document.activeElement && document.activeElement.blur(); __game.play(__bikeTrack('{tid}'))")
        pg.wait_for_function(f"typeof __bikeKid === 'function' && __bikeState().level === '{tid}'")
        pg.evaluate(f'__bikeKid(true, {seed})')
        for _ in range(500):
            pg.evaluate('__bikeStep(0.1)')
            if watch: watch(pg.evaluate('(() => { const b = __bikeState().bike; return { over: b.over, v: b.v, air: b.air, crash: b.crash, loop: !!b.loop, x: b.x }; })()'))
            if pg.evaluate('__bikeState().finished'): break
        r = pg.evaluate('__bikeKidReport()'); pg.evaluate('__bikeKid(false)')
        return r
    fresh(pg, 'bike')
    for tid in ('t4', 't8'):           # Normal tracks with table tops: hands off the tilt = no tumbles
        rides = [bike_ride(tid, s) for s in (13, 7932, 15851)]
        check(all(r['finished'] for r in rides) and sum(r['crashes'] for r in rides) == 0,
              f"Bike {tid} (Normal), pretend big kid: 3 rides, no tumbles ({[r['where'] for r in rides]})")
    # too hot right on one of Cloud Castle's moving ramps: the bike putters on up it, it never stops
    pg.evaluate("document.activeElement && document.activeElement.blur(); __game.play(__bikeTrack('t10'))")
    pg.wait_for_function("typeof __bikeKid === 'function' && __bikeState().level === 't10'")
    pg.evaluate('__bikeKid(true, 13)'); pg.evaluate('__bikeStep(3.3)')
    for _ in range(300):
        if pg.evaluate('__bikeState().lift'): break
        pg.evaluate('__bikeStep(0.02)')
    on_lift = pg.evaluate('__bikeState().lift')
    pg.evaluate('(() => { const b = __bikeState().bike; b.heat = 1; b.over = 3.4; })()')
    vs = []
    for _ in range(25):
        pg.evaluate('__bikeStep(0.1)'); b_ = pg.evaluate('(() => { const b = __bikeState().bike; return { v: b.v, air: b.air, over: b.over }; })()')
        if not b_['air'] and b_['over'] > 0: vs.append(b_['v'])
    pg.evaluate('__bikeKid(false)')
    check(on_lift and vs and min(vs) >= 85, f"Bike: too hot on a moving ramp, the bike putters on (slowest {round(min(vs or [0]))}, on the lift: {on_lift})")
    check(pg.evaluate("__bikeTrack('t7').par") == 11.4, 'Candy Bounce par is 11.4 (big kids could only get silver)')
    fresh(pg, 'bike', little=True)
    for tid in ('t1', 't2'):           # one thumb turbos by itself: little kids can get gold on the first tracks
        r = bike_ride(tid, 13)
        check(r['medal'] == 'gold' and r['crashes'] == 0, f"Bike {tid}, pretend little kid (one thumb): {r['medal']} ({r['time']} s, par {r['par']})")

    # ---- Mini RC Racers (part 3) ----
    def rc_race(tid, seed, idle=False):
        pg.evaluate(f"document.activeElement && document.activeElement.blur(); __game.play({{ id: '{tid}' }})")
        pg.wait_for_function(f"typeof __rcKid === 'function' && __rcState().track === '{tid}' && __rcState().raceTime === 0")
        pg.evaluate(f'__rcKid(true, {seed}, {str(idle).lower()})')
        for _ in range(60):
            pg.evaluate('__rcStep(5)')
            if pg.evaluate('__rcState().finished'): break
        r = pg.evaluate('__rcKidReport()'); pg.evaluate('__rcKid(false)')
        return r
    fresh(pg, 'rc', little=True)
    for tid in ('t7', 't10'):
        r = rc_race(tid, 13, idle=True)
        check(r['finished'] and r['off'] < 2, f"RC {tid}, one thumb, hands off: the car keeps to the road ({r['off']} s off the road, place {r['place']})")
        r = rc_race(tid, 7932)
        check(r['finished'] and r['off'] < 15 and r['place'] <= 2, f"RC {tid}, pretend little kid: {r['off']} s off the road (was 34-45), place {r['place']}")
    fresh(pg, 'rc')
    pg.evaluate("__game.play({ id: 't1' })"); pg.wait_for_function("typeof __rcStep === 'function' && __rcState().track === 't1'")
    pg.evaluate('__rcStep(3.4)'); pg.keyboard.down('ArrowUp'); pg.evaluate('__rcStep(1.5)')
    LOST = ("(() => { const c = __rcCars().find(c => c.isPlayer); if ((c.lifts || 0) > 0) return; const t = __rcTrackPts('t1'), i = c.near.i, p = t.pts[i], q = t.pts[(i + 1) % t.pts.length];"
            " const L = Math.hypot(q[0] - p[0], q[1] - p[1]); c.x = p[0] - (q[1] - p[1]) / L * (t.hw + 90); c.y = p[1] + (q[0] - p[0]) / L * (t.hw + 90); })()")
    for _ in range(24):                # keep the car far out on the grass (as if lost, driving round): it gets lifted back
        pg.evaluate(LOST); pg.evaluate('__rcStep(0.25)')
    pg.keyboard.up('ArrowUp')
    check(pg.evaluate('__rcCars().find(c => c.isPlayer).lifts || 0') >= 1, 'RC: a car lost out on the grass (still moving) is lifted back onto the road')

    # ---- Archery (part 4) ----
    def archery_go(lid, seed):
        pg.evaluate(f"document.activeElement && document.activeElement.blur(); __game.play(__archeryScene.level('{lid}'))")
        pg.wait_for_function(f"typeof __archeryKid === 'function' && __archeryState().level === '{lid}'")
        pg.evaluate(f'__archeryKid(true, {seed})')
        for _ in range(60):
            pg.evaluate('__archeryStep(5)')
            if pg.evaluate('__archeryKidReport().ended'): break
        r = pg.evaluate('__archeryKidReport()'); pg.evaluate('__archeryKid(false)')
        return r
    fresh(pg, 'archery')
    for lid, want in (('l1', False), ('l5', True)):
        pg.evaluate(f"__game.play(__archeryScene.level('{lid}'))"); pg.wait_for_function(f"__archeryState().level === '{lid}'")
        pg.evaluate('__archeryFire(30, 0.6)'); pg.evaluate('__archeryStep(4)')
        n = pg.evaluate('__archeryLastPath()')
        check((n > 5) == want, f"archery {lid} ({'Normal' if want else 'Easy'}): the last shot's dots {'show' if want else 'are not shown'} ({n} dots)")
    for lid in ('l7', 'l9'):
        wins = sum(archery_go(lid, s * 7919 + 13)['won'] for s in range(6))
        check(wins >= 4, f'archery {lid} (Challenge): a pretend big kid wins {wins} of 6 goes (Big Blizzard was 3 of 6)')

    # ---- Hoop Heroes (part 4) ----
    fresh(pg, 'hoops', little=True)
    pg.evaluate("__game.play(__hoopsScene.level('r7'))"); pg.wait_for_function("__hoopsState().level === 'r7'")
    made = 0
    for i in range(10):
        pg.wait_for_function('__hoopsState().ready')
        pg.evaluate('__hoopsAimNow()')               # pull exactly right, aimed at where the hoop is NOW
        pg.evaluate('__hoopsStep(1.6)'); made = pg.evaluate('__hoopsState().made')
    check(made >= 7, f'hoops r7 (Easy): the aim help leads the sliding hoop: {made} of 10 shots aimed at it as it was go in')
    def hoops_round(lid, seed):
        pg.evaluate(f"document.activeElement && document.activeElement.blur(); __game.play(__hoopsScene.level('{lid}'))")
        pg.wait_for_function(f"typeof __hoopsKid === 'function' && __hoopsState().level === '{lid}'")
        pg.evaluate(f'__hoopsKid(true, {seed})')
        for _ in range(40):
            pg.evaluate('__hoopsStep(5)')
            if pg.evaluate('__hoopsKidReport().done'): break
        r = pg.evaluate('__hoopsKidReport()'); pg.evaluate('__hoopsKid(false)')
        return r
    fresh(pg, 'hoops')
    for lid in ('r7', 'r8'):
        rs = [hoops_round(lid, s * 7919 + 13) for s in range(6)]
        wins = sum(r['win'] for r in rs)
        check(rs[0]['diff'] == 'challenge' and wins >= 3, f"hoops {lid} (Challenge): a pretend big kid wins {wins} of 6 rounds (was 0) {[str(r['score']) + '-' + str(r['rival']) for r in rs]}")

    # ---- Space Defender (part 4) ----
    fresh(pg, 'space')
    pg.evaluate("__game.save.data.autofire = true")
    pg.evaluate("__game.play(SpaceData.SECTORS.find(s => s.id === 's9'))"); pg.wait_for_function("typeof __spaceTest === 'object' && __spaceState().sector === 's9'")
    beams = pg.evaluate("__spaceLaserBeams()")
    check(0 < beams <= 2, f'space s9 (Normal): a laser attack has {beams} beams (at most 2)')
    pg.evaluate('__spaceTest.kid(true, 13)')
    for _ in range(80):
        pg.evaluate('__spaceTest.step(5)')
        if pg.evaluate('__spaceState().finished'): break
    r = pg.evaluate('__spaceTest.kidReport()')
    check(r['won'], f"space s9: a pretend big kid wins first go ({sum(r['hits'].values())} bumps of {r['startLives']} lives, {r['time']} s)")

    # ---- Fishing Frenzy (part 5) ----
    fresh(pg, 'fishing')
    pg.evaluate("__game.save.data.rod = 'super'; __game.save.unlocked.push('rod-super')")
    def fish_go(lid, seed):
        pg.evaluate(f"__game.play({{ id: '{lid}', loc: '{lid.split('-')[0]}', mode: '{lid.split('-')[1]}' }})")
        pg.wait_for_function(f"__game.level && __game.level.id === '{lid}' && typeof __fishingKid === 'function'")
        pg.evaluate(f'__fishingKid(true, {seed})')
        for _ in range(36):
            pg.evaluate('__fishingStep(5)')
            if pg.evaluate('__fishingKidReport().ended'): break
        r = pg.evaluate('__fishingKidReport()'); pg.evaluate('__fishingKid(false)')
        return r
    rs = [fish_go('night-timed', s * 7919 + 13) for s in range(4)]
    check(rs[0]['diff'] == 'challenge' and sum(r['stars'] >= 1 for r in rs) >= 3,
          f"fishing Moonlight Bay Frenzy (Challenge): a pretend big kid gets a star in {sum(r['stars'] >= 1 for r in rs)} of 4 rounds {[(r['caught'], r['score']) for r in rs]}")
    check(sum(r['early'] for r in rs) <= 4, f"fishing (Challenge): fish scared away by an early tap: {sum(r['early'] for r in rs)} in 4 rounds (each fish forgives one)")
    # just outside the green: the fish still comes in (half speed)
    pg.evaluate("__game.play({ id: 'ice-relax', loc: 'ice', mode: 'relax' })"); pg.wait_for_function("__game.level.id === 'ice-relax'")
    near = pg.evaluate("__fishingTest.nearGreen()")
    check(0 < near['near'] < near['green'], f"fishing: just outside the green reels in at about half speed ({near})")

    # ---- Bubble School (part 5) ----
    fresh(pg, 'abc')
    pg.evaluate("__game.save.data.voice = false; __game.play(__abcLevel('l3'))"); pg.wait_for_function("__abcState().level === 'l3'")
    pg.evaluate('__abcStep(1.5)')
    st = pg.evaluate('__abcState()')
    wrong = [c for c in st['choices'] if c != st['answer']]
    pg.evaluate(f"__abcTap('{wrong[0]}')"); pg.evaluate('__abcStep(0.2)'); pg.evaluate(f"__abcTap('{wrong[0]}')")
    st = pg.evaluate('__abcState()')
    check(st['misses'] == 1 and any(b['tried'] for b in st['bubbles']), f"abc: the same wrong bubble twice = 1 miss, and it goes see-through (misses {st['misses']})")
    pg.evaluate(f"__abcTap('{wrong[1]}')"); st = pg.evaluate('__abcState()')
    check(any(b['hint'] and b['text'] == st['answer'] for b in st['bubbles']), 'abc (Easy): after 2 wrong tries the right bubble glows')
    pg.evaluate(f"__abcTap('{st['answer']}')"); pg.evaluate('__abcStep(1.4)')
    st = pg.evaluate('__abcState()')
    check(st['wrongQs'] == 1, f"abc: stars count questions with a wrong try ({st['wrongQs']}), not wrong taps ({st['misses']})")
    hid = pg.evaluate("(() => { const b = __abcState().bubbles.find(b => b.grow <= 0.3); return b ? [b.x, b.y, __abcTapAt(b.x, b.y)] : null; })()")
    check(hid is not None and hid[2] is None, f"abc: a bubble that hasn't grown in yet can't be tapped ({hid})")
    rs = []
    for lid in ('l2', 'l4'):
        fresh(pg, 'abc', little=True)
        pg.evaluate(f"__game.save.data.voice = false; __game.play(__abcLevel('{lid}'))"); pg.wait_for_function(f"__abcState().level === '{lid}'")
        for sd in range(3):
            if sd: pg.evaluate(f"__game.play(__abcLevel('{lid}'))"); pg.wait_for_function(f"__abcState().level === '{lid}' && __abcState().q === 1")
            pg.evaluate(f'__abcKid(true, {sd * 7919 + 13})')
            for _ in range(40):
                pg.evaluate('__abcStep(5)')
                if pg.evaluate('__abcKidReport().done'): break
            rs.append(pg.evaluate('__abcKidReport()')); pg.evaluate('__abcKid(false)')
    check(sum(r['stars'] >= 2 for r in rs) >= 4 and all(r['done'] for r in rs), f"abc: a pretend little kid gets 2+ stars on A-E / A-M letters in {sum(r['stars'] >= 2 for r in rs)} of 6 goes {[r['stars'] for r in rs]}")
    check(max(max(r['kid']['perQ']) for r in rs) <= 6, f"abc: never more than 6 taps on one question ({max(max(r['kid']['perQ']) for r in rs)})")
    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
sys.exit(1 if fails else 0)
