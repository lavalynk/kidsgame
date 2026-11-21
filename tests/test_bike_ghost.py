"""Automated test: Turbo Bike's Daily Ghost Race (Keith's bike plan #9, Nov 21).

Run:  python3 tests/test_bike_ghost.py
Every day one track is picked from the date and you race Wisp, a friendly see-through ghost
rider, on it (just the two of you). Beat him: a ghost in this week's strip, and the first win
of the day = 1 house coin. The test checks:
  - the track of the day (big kids: all 10 come round, never the same two days running;
    little kids: only the 7 gentler tracks)
  - the Ghost button on the title menu + the Ghost Race tile in the level picker
  - Wisp's ride is worked out at the start and ends at the track's par x 1.15 (little kids x 1.6),
    he moves during the race, no Zip / Moxie / Bolt
  - win (coin once per day, trophy), lose ("Nice try!", no coin), a new day = a new track,
    7 days in a row = the secret Ghost week trophy
  - a real ride (gas + turbo) on a big-kid track beats him; phones show the results
Screenshots in tests/out/bike-ghost-*.png.
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

PACE = {'big': 1.15, 'little': 1.6}

def fresh(pg, day, data=None, age='big'):
    pg.goto((ROOT / 'bike' / 'index.html').as_uri())
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': age}]}
    save = {'games': {'bike': {'levels': {}, 'best': 0, 'unlocked': [], 'data': data or {}, 'achievements': []}}}
    pg.evaluate("([p, s, d]) => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); localStorage.setItem('kidsArcade.v1', s); localStorage.setItem('kidsArcade.testDay', d); }",
                [json.dumps(prof), json.dumps(save), day])
    pg.reload(); pg.wait_for_timeout(500)
    cmenu.to_title(pg)

def wait_race(pg):
    cmenu.into_game(pg)
    pg.wait_for_function('typeof __bikeState === "function" && __bikeState().countdown <= 0', timeout=8000)

def zoom_to_finish(pg):
    pg.evaluate('(() => { const s = __bikeState(); s.bike.x = s.finishX - 40; s.bike.v = 400; s.bike.h = 0; s.bike.air = false; })()')
    pg.wait_for_function('__bikeState().finished', timeout=5000)

def results(pg):
    cmenu.wait_screen(pg, 'results'); pg.wait_for_timeout(900)

def saved(pg):
    return pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.v1'))")

def ride(pg):
    """the bot: gas all the way, turbo while the engine is cool"""
    pg.keyboard.down('ArrowRight'); turbo = False
    for _ in range(1200):
        s = pg.evaluate('(() => { const s = __bikeState(); return { fin: s.finished, heat: s.bike.heat, over: s.bike.over }; })()')
        if s['fin']: break
        want = s['heat'] < 0.7 and s['over'] <= 0
        if want and not turbo: pg.keyboard.down('Space'); turbo = True
        if not want and turbo: pg.keyboard.up('Space'); turbo = False
        pg.wait_for_timeout(30)
    if turbo: pg.keyboard.up('Space')
    pg.keyboard.up('ArrowRight')

def day_str(n):
    """day n after 2026-12-01"""
    import datetime
    return (datetime.date(2026, 12, 1) + datetime.timedelta(days=n)).isoformat()

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 760})
    pg.on('pageerror', lambda e: errors.append(str(e)))

    # a day whose Daily Surprise isn't about Turbo Bike (it would add 2 house coins of its own)
    fresh(pg, day_str(0))
    DAY = None
    for n in range(40):
        pg.evaluate("d => localStorage.setItem('kidsArcade.testDay', d)", day_str(n))
        if pg.evaluate("Arcade.daily.today().ch.game") != 'bike' and pg.evaluate("__bikeGhost.track(false)") == 't1':
            DAY = day_str(n); break
    check(DAY is not None, f'found a day with Sunny Start as the ghost track ({DAY})')

    # ---- the track of the day ----
    big, little = [], []
    for n in range(30):
        pg.evaluate("d => localStorage.setItem('kidsArcade.testDay', d)", day_str(n))
        big.append(pg.evaluate("__bikeGhost.track(false)")); little.append(pg.evaluate("__bikeGhost.track(true)"))
    check(all(big[i] != big[i + 1] for i in range(len(big) - 1)), 'big kids: never the same track two days running')
    check(len(set(big[:10])) == 10, f'big kids: all 10 tracks come round in 10 days ({big[:10]})')
    check(set(little) <= {'t1', 't2', 't3', 't4', 't6', 't7', 't8'} and len(set(little[:7])) == 7, f'little kids: the 7 gentler tracks ({little[:7]})')
    check(all(little[i] != little[i + 1] for i in range(len(little) - 1)), 'little kids: never the same track two days running')

    # ---- the title menu's Ghost button + the level tile ----
    fresh(pg, DAY)
    check(cmenu.find(pg, 'ghost') is not None, 'the title menu has a Ghost button')
    pg.screenshot(path=str(OUT / 'bike-ghost-title.png'))
    cmenu.tap(pg, 'levels'); cmenu.wait_screen(pg, 'levels')
    tile = cmenu.find(pg, 'level-dg-t1')
    check(tile is not None and not tile['locked'], 'the level picker has today\'s Ghost Race tile (Sunny Start)')
    cmenu.scroll_to(pg, 'level-dg-t1')
    pg.screenshot(path=str(OUT / 'bike-ghost-levels.png'))

    # ---- the race: just you and Wisp ----
    pg.evaluate("a => ArcadeMenus.tap(a)", 'level-dg-t1'); wait_race(pg)
    st = pg.evaluate('__bikeState()')
    check(st['level'] == 'dg-t1', f"the race is on today's track ({st['level']})")
    check(st['ais'] == [], 'no Zip, Moxie or Bolt')
    w = st['wisp']
    check(w and abs(w['target'] - st['par'] * PACE['big']) < 0.05, f"Wisp aims for par x {PACE['big']} ({w and w['target']}, par {st['par']})")
    check(w and abs(w['t'] - w['target']) < 0.3, f"Wisp's planned ride ends on time ({w and w['t']} vs {w and w['target']})")
    pg.wait_for_timeout(2000)
    x = pg.evaluate('__bikeState().wisp.x')
    check(x > 500, f'Wisp rides along ({x})')
    pg.screenshot(path=str(OUT / 'bike-ghost-race.png'))

    # ---- win: a ghost for today + 1 house coin, the trophy ----
    zoom_to_finish(pg); results(pg)
    sv = saved(pg); d = sv['games']['bike']['data']
    check(d.get('ghostWins') == 1 and d.get('ghostDay') == DAY and DAY in d.get('ghostDays', []), f"beat Wisp: saved ({d.get('ghostWins')}, {d.get('ghostDay')})")
    check(sv.get('houseBonus', 0) == 1, f"+1 house coin ({sv.get('houseBonus')})")
    check('ghost' in json.dumps(sv['games']['bike'].get('achievements', [])), 'Ghost chaser trophy')
    r = pg.evaluate("ArcadeMenus.current().rows.find(r => r.kind === 'ghost') || null")
    check(r and r['won'], 'the results show the you-vs-Wisp picture (won)')
    check('wisp' in pg.evaluate('ArcadeMenus.current().banner').lower(), 'the banner talks about Wisp')
    pg.screenshot(path=str(OUT / 'bike-ghost-won.png'))

    # ---- again the same day: no second coin ----
    cmenu.tap(pg, 'again'); wait_race(pg)
    zoom_to_finish(pg); results(pg)
    sv = saved(pg)
    check(sv.get('houseBonus', 0) == 1 and sv['games']['bike']['data']['ghostWins'] == 1, 'a 2nd win the same day: no extra coin')

    # ---- lose: let Wisp get there first ----
    cmenu.tap(pg, 'again'); wait_race(pg)
    his = pg.evaluate('__bikeState().wisp.t')
    pg.evaluate("t => { const s = __bikeState(); s.bike.v = 0; }", his)
    pg.wait_for_function(f"__bikeState().raceTime > {his + 0.3}", timeout=40000)
    zoom_to_finish(pg); results(pg)
    r = pg.evaluate("ArcadeMenus.current().rows.find(r => r.kind === 'ghost') || null")
    check(r and not r['won'], 'Wisp got there first: the picture shows him 1st')
    check(not pg.evaluate("ArcadeMenus.current().result.win"), 'not a win ("Nice try!" look)')
    check(cmenu.find(pg, 'again') is not None, 'one tap to try again')
    pg.screenshot(path=str(OUT / 'bike-ghost-lost.png'))

    # ---- a new day: a new track, no tick yet ----
    nxt = day_str([day_str(n) for n in range(40)].index(DAY) + 1)
    pg.evaluate("d => localStorage.setItem('kidsArcade.testDay', d)", nxt)
    cmenu.tap(pg, 'menu'); cmenu.wait_screen(pg, 'title')
    cmenu.tap(pg, 'levels'); cmenu.wait_screen(pg, 'levels')
    ids = [i['attr'] for i in cmenu.items(pg) if i['attr'].startswith('level-dg-')]
    check(len(ids) == 1 and ids[0] != 'level-dg-t1', f'a new day: a new ghost track ({ids})')

    # ---- 7 days in a row: the secret Ghost week trophy ----
    week = [day_str([day_str(n) for n in range(40)].index(DAY) - i) for i in range(1, 7)]
    fresh(pg, DAY, data={'ghostDays': week, 'ghostWins': 6, 'ghostDay': week[0]})
    cmenu.tap(pg, 'ghost'); wait_race(pg)
    zoom_to_finish(pg); results(pg)
    sv = saved(pg)
    check('ghostweek' in json.dumps(sv['games']['bike'].get('achievements', [])), '7 days in a row: Ghost week trophy')
    check(sv['games']['bike']['data']['ghostWins'] == 7, 'ghostWins = 7')
    pg.screenshot(path=str(OUT / 'bike-ghost-week.png'))

    # ---- little kids: a sleepy Wisp ----
    fresh(pg, DAY, age='little')
    cmenu.tap(pg, 'ghost'); wait_race(pg)
    st = pg.evaluate('__bikeState()')
    check(st['level'][3:] in ('t1', 't2', 't3', 't4', 't6', 't7', 't8'), f"little kids: a gentle track ({st['level']})")
    check(abs(st['wisp']['target'] - st['par'] * PACE['little']) < 0.05, f"little kids: Wisp aims for par x {PACE['little']} ({st['wisp']['target']})")

    # ---- a real ride on a big-kid day: gas + turbo beats Wisp on Sunny Start ----
    fresh(pg, DAY)
    cmenu.tap(pg, 'ghost'); wait_race(pg)
    ride(pg); results(pg)
    st = pg.evaluate('__bikeState()')
    check(st['raceTime'] < st['wisp']['t'], f"a real ride beats Wisp on Sunny Start ({st['raceTime']:.2f} vs {st['wisp']['t']})")

    # ---- phones: the results fit ----
    for vp in ({'width': 390, 'height': 844}, {'width': 844, 'height': 390}):
        p2 = b.new_page(viewport=vp, is_mobile=True, has_touch=True)
        p2.on('pageerror', lambda e: errors.append(str(e)))
        fresh(p2, DAY)
        cmenu.tap(p2, 'ghost', touch=True); p2.wait_for_timeout(600)
        up = p2.locator('.ar-turnok')
        if up.count() and up.first.is_visible(): up.first.click(); p2.wait_for_timeout(300)
        wait_race(p2)
        p2.wait_for_timeout(1500)
        p2.screenshot(path=str(OUT / f"bike-ghost-race-{vp['width']}.png"))
        zoom_to_finish(p2); results(p2)
        p2.screenshot(path=str(OUT / f"bike-ghost-won-{vp['width']}.png"))
        btn = cmenu.find(p2, 'again')
        check(btn and btn['y'] >= 0 and btn['y'] + btn['h'] <= vp['height'], f"phone {vp['width']}: the Again button is on the screen")
        sw = p2.evaluate('document.documentElement.scrollWidth')
        check(sw <= vp['width'] + 1, f"phone {vp['width']}: no sideways scrolling ({sw})")
        p2.close()

    b.close()

check(not errors, f'no page errors ({errors[:3]})')
print('\n' + ('ALL PASS' if not fails else f'{len(fails)} FAILED: {fails}'))
sys.exit(1 if fails else 0)
