"""Automated test: Space Defender's starter sector, Cloud Park (Nov 24, new plan point 7, part 2).

Run:  python3 tests/test_space_starter.py
Checks: Cloud Park is the first sector tile and open on a fresh save (sector 1 open, sector 2 still locked);
Play starts it for a new player; once a big kid is further along Play skips it (noStart), a little kid with
the same save is sent there; it's always Easy; bumping a robot there just pops it (no lost life) while in
sector 1 the same bump costs a life; nobody shoots in the waves; a whole run goes waves -> Baby Bobber ->
checkpoint -> waves -> Big Puffy Cloud -> clear in under 2 minutes with the Cloud hug trophy, and Next goes
on to sector 1; the Endless mode never meets the starter bosses. Screenshots in tests/out/space-starter-*.png.
"""
import json, pathlib
from playwright.sync_api import sync_playwright
import cmenu as cm
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

def open_page(b, little=False, save=None, vp={'width': 1280, 'height': 720}):
    pg = b.new_page(viewport=vp)
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto((ROOT / 'space' / 'index.html').as_uri())
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': 'little' if little else 'big'}]}
    pg.evaluate("p => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); }", json.dumps(prof))
    pg.reload(); pg.wait_for_timeout(300)
    cm.to_title(pg)
    if save:
        pg.evaluate("lv => { Object.assign(__game.save.levels, lv); __game.store(); }", save)
        pg.reload(); pg.wait_for_timeout(300); cm.to_title(pg)
    return pg

def play_tap(pg):
    """Tap the big Play button and say which sector started."""
    cm.tap(pg, 'start'); cm.into_game(pg)
    pg.wait_for_function("typeof __spaceState === 'function'")
    return pg.evaluate('__spaceState().sector')

def start(pg, sid):
    pg.evaluate("__game.save.data.autofire = true")
    pg.evaluate("(id) => __game.play(SpaceData.SECTORS.concat([SpaceData.STARTER, SpaceData.ENDLESS]).find(s => s.id === id))", sid)
    pg.wait_for_function(f"typeof __spaceTest === 'object' && __spaceState().sector === '{sid}'")

with sync_playwright() as pw:
    b = pw.chromium.launch()

    # ---- the sector picker on a fresh save ----
    pg = open_page(b)
    cm.tap(pg, 'levels'); cm.wait_screen(pg, 'levels')
    lv = [i for i in cm.items(pg) if i['attr'].startswith('level-')]
    by = {i['attr']: i for i in lv}
    check(lv and lv[0]['attr'] == 'level-s0' and not lv[0]['locked'], f'Cloud Park is the first sector tile and open ({[i["attr"] for i in lv[:3]]})')
    check('level-s1' in by and not by['level-s1']['locked'] and by.get('level-s2', {}).get('locked'), 'sector 1 is open, sector 2 still locked (nothing else changed)')
    pg.screenshot(path=str(OUT / 'space-starter-levels.png'))
    cm.tap(pg, 'level-s0'); cm.into_game(pg)
    pg.wait_for_function("typeof __spaceState === 'function'")
    check(pg.evaluate('__spaceState().sector') == 's0' and pg.evaluate('__game.difficulty') == 'easy', 'tapping it starts Cloud Park, on Easy')
    pg.close()

    # ---- Play: who goes where ----
    pg = open_page(b)
    check(play_tap(pg) == 's0', 'a brand-new player: Play starts Cloud Park')
    pg.close()
    far = {'s1': {'done': True, 'stars': 2}}
    pg = open_page(b, save=far)
    check(play_tap(pg) == 's2', 'a big kid who already cleared sector 1: Play goes on to sector 2 (not back to Cloud Park)')
    pg.close()
    pg = open_page(b, little=True, save=far)
    check(play_tap(pg) == 's0', 'a little kid with the same save: Play goes to Cloud Park')
    pg.close()

    # ---- gentle: a bump just pops the robot ----
    pg = open_page(b)
    for sid, want_same in (('s0', True), ('s1', False)):
        start(pg, sid); pg.evaluate('__spaceTest.step(2.5)')
        before = pg.evaluate('__spaceState().lives')
        pg.evaluate('__spaceTest.clear(); const s = __spaceTest.ship(); s.inv = 0; s.shield = 0; __spaceTest.bobber(); __spaceTest.step(0.2)')
        after = pg.evaluate('__spaceState().lives')
        check((after == before) == want_same, f'{sid}: bumping a robot ' + ('just pops it' if want_same else 'is a bonk') + f' (lives {before} -> {after})')

    # ---- a whole run (god mode, a bot lines up with things) ----
    BOT = """() => { const T = __spaceTest, p = T.peek(), s = __spaceState();
      let ty = s.y; if (p.capsules.length) ty = p.capsules[0][1]; else if (p.target) ty = p.target.y;
      else if (p.enemies.length) ty = p.enemies.reduce((a, b) => a[0] < b[0] ? a : b)[1];
      T.nudge(Math.max(-34, Math.min(34, 200 - s.x)), Math.max(-34, Math.min(34, ty - s.y))); T.step(0.1); return s.phase; }"""
    start(pg, 's0'); pg.evaluate('__spaceTest.god(true)')
    seen, t, minis, bigs, shooters, shot = [], 0, set(), set(), 0, False
    while t < 200:
        ph = pg.evaluate(BOT); t += 0.1
        if not seen or seen[-1] != ph: seen.append(ph)
        st = pg.evaluate('__spaceState()')
        if st['boss']: (minis if st['boss']['kind'] == 'mini' else bigs).add(st['boss']['id'])
        if ph == 'waves': shooters += pg.evaluate("__spaceTest.peek().enemies.filter(e => e[2] === 'shooter' || e[2] === 'orbiter' || e[2] === 'diver').length + __spaceState().bullets")
        if bigs and not shot and st['boss'] and st['boss']['hp'] < st['boss']['max']:
            pg.screenshot(path=str(OUT / 'space-starter-cloud.png')); shot = True
        if st['finished']: break
    st = pg.evaluate('__spaceState()')
    check(st['finished'] and 'breather' in seen and minis == {'babyBob'} and bigs == {'cloudy'},
          f'a whole run: {" > ".join(seen)}; mini {minis}, big {bigs}')
    check(30 <= t <= 120, f'it takes {t:.0f} s (a short first flight)')
    check(shooters == 0, 'nobody shoots in the waves (no shooters, divers or bubbles)')
    pg.wait_for_timeout(1800)
    check(pg.evaluate("__game.hasTrophy('cloud')"), 'the Cloud hug trophy')
    check(cm.screen(pg) == 'results', 'the results screen')
    pg.screenshot(path=str(OUT / 'space-starter-results.png'))
    nxt = next((i for i in cm.items(pg) if i['label'] == 'Next'), None)
    if nxt:
        pg.mouse.click(nxt['x'] + nxt['w'] / 2, nxt['y'] + nxt['h'] / 2); cm.into_game(pg)
        pg.wait_for_timeout(400)
    check(nxt and pg.evaluate("__spaceState().sector") == 's1', 'Next goes on to sector 1')

    # ---- Endless never meets the starter's bosses ----
    ids = pg.evaluate("""() => { const st = SpaceData.STARTER; return [Object.keys(SpaceData.MINIS).includes(st.mini), Object.keys(SpaceData.BIGS).includes(st.boss)]; }""")
    start(pg, 'endless'); pg.evaluate('__spaceTest.god(true); __spaceTest.step(3)')
    for _ in range(400):
        pg.evaluate(BOT)
        bo = pg.evaluate('__spaceState().boss')
        if bo: break
    check(ids == [True, True] and bo and bo['id'] not in ('babyBob', 'cloudy'), f'Endless starts with {bo and bo["id"]}, not a starter boss')

    # ---- a phone held sideways ----
    ph = open_page(b, little=True, vp={'width': 844, 'height': 390})
    cm.tap(ph, 'levels'); cm.wait_screen(ph, 'levels')
    ph.screenshot(path=str(OUT / 'space-starter-phone-levels.png'))
    start(ph, 's0'); ph.evaluate('__spaceTest.step(6)'); ph.wait_for_timeout(200)
    ph.screenshot(path=str(OUT / 'space-starter-phone.png'))
    b.close()
check(not errors, 'no JavaScript errors' + ('' if not errors else ': ' + '; '.join(errors[:3])))
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
raise SystemExit(1 if fails else 0)
