"""Automated test: Turbo Bike's 10 tracks (Keith's bike plan #5, Nov 17).

Run:  python3 tests/test_bike_tracks.py
The 5 new places each have one special thing:
  Splash Beach  = shallow water (splash, a bit slower)
  Candy Bounce  = jelly pads (BOING, high in the air, always land fine)
  Night Lights  = dark, with street lamps and a headlight
  Jungle Loops  = loop-de-loops (everyone makes it round)
  Cloud Castle  = ramps that go up and down
A bot rides each new track (gas + turbo, letting the engine cool) and checks it finishes,
the special thing happened, and the time is in the right area for the track's medal times.
Old saves: the first 5 tracks keep their difficulty, track 6 opens after Volcano Run.
Screenshots in tests/out/bike-<track>.png.
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu      # (Nov 21: Turbo Bike's menus are drawn with Phaser + Rex UI)
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

OLD = ['t1', 't2', 't3', 't4', 't5']
NEW = [('t6', 'splash'), ('t7', 'jelly'), ('t8', 'lights'), ('t9', 'loop'), ('t10', 'lift')]

def fresh(pg, done, little=False, viewport=None):
    pg.goto((ROOT / 'bike' / 'index.html').as_uri())
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': 'little' if little else 'big'}]}
    save = {'games': {'bike': {'levels': {k: {'done': True, 'stars': 1, 'time': 30} for k in done}, 'best': 0, 'unlocked': [], 'data': {}, 'achievements': []}}}
    pg.evaluate("([p, s]) => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); localStorage.setItem('kidsArcade.v1', s); }",
                [json.dumps(prof), json.dumps(save)])
    pg.reload(); pg.wait_for_timeout(500)

def open_levels(pg):
    cmenu.to_title(pg)
    cmenu.tap(pg, 'levels'); cmenu.wait_screen(pg, 'levels')
    return [i for i in cmenu.items(pg) if i['attr'].startswith('level-')]

def play(pg, index):
    tiles = open_levels(pg)
    # (tiles further down are scrolled out of sight: those go through the menu's own tap)
    pg.evaluate('a => ArcadeMenus.tap(a)', tiles[index]['attr'])
    cmenu.into_game(pg)
    pg.wait_for_function('typeof __bikeState === "function"')
    pg.wait_for_function('__bikeState().countdown <= 0', timeout=6000)

def ride(pg, shot_when=None, shot=None):
    """Gas all the way, turbo while the engine is cool. Returns (state, seen-special, took-shot)."""
    pg.keyboard.down('ArrowRight')
    turbo, seen, took = False, set(), False
    for _ in range(900):
        s = pg.evaluate('(() => { const s = __bikeState(); return { fin: s.finished, heat: s.bike.heat, over: s.bike.over, loop: !!s.bike.loop, bounce: !!s.bike.bounce, wet: !!s.bike.wet, lift: s.lift, dark: s.dark }; })()')
        for k in ('loop', 'bounce', 'wet', 'lift', 'dark'):
            if s[k]: seen.add(k)
        if not took and shot_when and s.get(shot_when):
            pg.screenshot(path=str(OUT / shot)); took = True
        if s['fin']: break
        want = s['heat'] < 0.7 and s['over'] <= 0
        if want and not turbo: pg.keyboard.down('Space'); turbo = True
        if not want and turbo: pg.keyboard.up('Space'); turbo = False
        pg.wait_for_timeout(30)
    if turbo: pg.keyboard.up('Space')
    pg.keyboard.up('ArrowRight')
    return pg.evaluate('__bikeState()'), seen, took

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 760})
    pg.on('pageerror', lambda e: errors.append(str(e)))

    # ---- the picker: 10 tracks, the new ones open one by one after Volcano Run ----
    fresh(pg, OLD)
    tiles = open_levels(pg)
    check(len(tiles) >= 10, f'10 track tiles ({len(tiles)})')
    locked = [tiles[i]['locked'] for i in range(10)]
    check(locked == [False] * 6 + [True] * 4, f'after Volcano Run only Splash Beach is new and open ({locked})')
    pg.screenshot(path=str(OUT / 'bike-levels.png'))

    # ---- old tracks keep their difficulty (the kit used to pick it from the position in the list) ----
    fresh(pg, [])
    play(pg, 0)
    check(pg.evaluate('__bikeState().diff') == 'easy', 'Sunny Start still plays on Easy')

    # ---- each new track: a bot rides it ----
    want_seen = {'splash': 'wet', 'jelly': 'bounce', 'lights': 'dark', 'loop': 'loop', 'lift': 'lift'}
    pars = {}
    for i, (tid, special) in enumerate(NEW):
        fresh(pg, OLD + [t for t, _ in NEW[:i]])
        play(pg, 5 + i)
        pars[tid] = pg.evaluate('__bikeState().par')
        st, seen, took = ride(pg, want_seen[special], f'bike-{tid}.png')
        check(st['finished'], f'{tid}: the bot finishes')
        check(want_seen[special] in seen, f'{tid}: its special thing happens ({special}: {sorted(seen)})')
        check(took, f'{tid}: screenshot of the special thing')
        # (this bot plays in real time; on GitHub's slower machines it reacts late now and then, so 3 is allowed)
        check(st['stats']['crashes'] <= 3, f"{tid}: at most three tumbles for a bot that never tilts ({st['stats']['crashes']})")
        t = st['raceTime']
        check(pars[tid] * 0.8 < t < pars[tid] * 1.45, f'{tid}: bot time {t:.1f} s fits the medal times (par {pars[tid]})')
        if special == 'loop': check(st['stats'].get('loops', 0) >= 3, f"{tid}: round all 3 loops ({st['stats'].get('loops', 0)})")
        if special == 'jelly': check(st['stats'].get('bounces', 0) >= 1, f"{tid}: bounced ({st['stats'].get('bounces', 0)})")
        check(max(a['x'] for a in st['ais']) > 3000, f"{tid}: the computer riders get round too ({[a['x'] for a in st['ais']]})")
        cmenu.wait_screen(pg, 'results')

    # ---- little kid on Jungle Loops + Candy Bounce: no tumbles at all ----
    for i in (1, 3):
        fresh(pg, OLD + [t for t, _ in NEW], little=True)
        play(pg, 5 + i)
        pg.keyboard.down('Space')
        for _ in range(400):
            if pg.evaluate('__bikeState().finished'): break
            pg.wait_for_timeout(60)
        pg.keyboard.up('Space')
        st = pg.evaluate('__bikeState()')
        check(st['finished'] and st['stats']['crashes'] == 0, f"little kid on {NEW[i][0]}: finished, no tumbles ({st['stats']['crashes']})")

    # ---- the track builder has the new pieces + the colors of finished places ----
    fresh(pg, OLD + ['t6', 't7'])
    cmenu.to_title(pg)
    cmenu.tap(pg, 'unlocks'); cmenu.wait_screen(pg, 'unlocks')      # the Prizes page has "Build a track"
    cmenu.tap(pg, 'build'); cmenu.wait_screen(pg, 'build')
    names = [i['label'] for i in cmenu.items(pg) if i['attr'].startswith('put-')]      # (Nov 21: every piece is a tile to tap)
    check(all(n in names for n in ['Splash', 'Jelly pad', 'Loop', 'Moving ramp']), f'builder pieces include the new ones ({names})')
    themes = [i['attr'] for i in cmenu.items(pg) if i['attr'].startswith('theme-')]
    check(len(themes) == 7, f'builder colors: 5 + beach + candy ({themes})')
    pg.evaluate("ArcadeMenus.tap('theme-beach')"); cmenu.wait_screen(pg, 'build')
    check(next(i for i in cmenu.items(pg) if i['attr'] == 'theme-beach')['picked'], 'tapping a color picks it')
    pg.screenshot(path=str(OUT / 'bike-builder.png'))
    cmenu.tap(pg, 'race'); pg.wait_for_function('typeof __bikeState === "function" && !ArcadeMenus.isOpen', timeout=6000)
    d = pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.v1')).games.bike.data.custom")
    check(d['theme'] == 'beach' and len(d['pieces']) == 8, f'Race it! saves the track and starts it ({d})')

    # ---- phone, upright and sideways: the picker fits ----
    for vp in ({'width': 390, 'height': 844}, {'width': 844, 'height': 390}):
        p2 = b.new_page(viewport=vp, is_mobile=True, has_touch=True)
        p2.on('pageerror', lambda e: errors.append(str(e)))
        fresh(p2, OLD + [t for t, _ in NEW])
        open_levels(p2)
        p2.screenshot(path=str(OUT / f"bike-levels-{vp['width']}.png"))
        sw = p2.evaluate('document.documentElement.scrollWidth')
        check(sw <= vp['width'] + 1, f"phone {vp['width']}x{vp['height']}: no sideways scrolling ({sw})")
        p2.close()
    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
