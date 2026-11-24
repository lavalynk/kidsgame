"""Automated test: Hoop Heroes' challenge courts (Nov 24, new plan point 7, part 5).

Run:  python3 tests/test_hoops_courts.py
  * the level picker has two picture tabs: Rivals (the ladder + High Score) and Courts (4 challenge courts);
    the first court is open, the others open one by one (a star on the one before)
  * the old rivals still play on the same difficulty as before (r1-r3 Easy, r4-r6 Normal, r7-r8 Challenge)
  * Golden Balls: every 3rd ball is golden and a golden basket is worth 5 (trophy "Golden touch")
  * Up and Down: the rim rides up and down, and a perfect shot still goes in at every height
  * Near and Far: the hoop glides near and far; out far a basket is worth 3
  * Hot Shots: the net starts on fire (a basket = 3), a miss puts it out, 2 in a row lights it again
  * a star on all 4 courts = the "Court star" trophy + the Disco ball
  * no JavaScript errors; screenshots in tests/out/hoops-court-*.png
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu as cm
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

def play(pg, lid):
    pg.evaluate(f"document.activeElement && document.activeElement.blur(); __game.play(__hoopsScene.level('{lid}'))")
    pg.wait_for_function(f"typeof __hoopsState === 'function' && __hoopsState().level === '{lid}' && __hoopsState().ready", timeout=8000)

def wait_ball(pg):
    # fast-forward until the ball has landed / gone in and the next one is in your hands
    for _ in range(40):
        pg.evaluate('__hoopsStep(0.25)')
        st = pg.evaluate('__hoopsState()')
        if st['ready'] and st['flying'] == 0: return st
    return pg.evaluate('__hoopsState()')

with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto((ROOT / 'hoops' / 'index.html').as_uri())
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': 'big'}]}
    pg.evaluate("p => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); }", json.dumps(prof))
    pg.reload(); pg.wait_for_timeout(800)

    # ---- the level picker: two tabs ----
    cm.to_title(pg)
    cm.tap(pg, 'levels'); cm.wait_screen(pg, 'levels')
    attrs = [i['attr'] for i in cm.items(pg)]
    check('tab-0' in attrs and 'tab-1' in attrs, f'the picker has two tabs ({[a for a in attrs if a.startswith("tab-")]})')
    check('level-r1' in attrs and 'level-free' in attrs and 'level-c1' not in attrs, 'the Rivals tab: the ladder + High Score')
    cm.tap(pg, 'tab-1'); pg.wait_for_timeout(500)
    its = {i['attr']: i for i in cm.items(pg)}
    check(all(f'level-c{n}' in its for n in range(1, 5)) and 'level-r1' not in its, 'the Courts tab: 4 challenge courts')
    check(not its['level-c1']['locked'] and all(its[f'level-c{n}']['locked'] for n in (2, 3, 4)), 'court 1 is open, courts 2-4 wait')
    pg.screenshot(path=str(OUT / 'hoops-court-picker.png'))

    # ---- the old rivals keep their difficulty ----
    want = {'r1': 'easy', 'r3': 'easy', 'r4': 'normal', 'r6': 'normal', 'r7': 'challenge', 'r8': 'challenge', 'c1': 'easy', 'c4': 'challenge'}
    got = {}
    for lid in want:
        play(pg, lid); got[lid] = pg.evaluate('__game.difficulty')
    check(got == want, f'every level plays on its own difficulty ({got})')

    # ---- Golden Balls ----
    play(pg, 'c1')
    golds, pts = [], []
    for i in range(6):
        golds.append(pg.evaluate('__hoopsCourt().goldNext'))
        s0 = pg.evaluate('__hoopsState().score')
        if i == 2: pg.wait_for_timeout(200); pg.screenshot(path=str(OUT / 'hoops-court-gold.png'))
        pg.evaluate('__hoopsAimAhead()'); st = wait_ball(pg); pts.append(st['score'] - s0)
    check(golds == [False, False, True, False, False, True], f'every 3rd ball is golden ({golds})')
    check(pts[2] == 5 and pts[5] == 5 and pts[0] == 2, f'a golden basket = 5, the others 2 ({pts})')
    check(pg.evaluate('__hoopsCourt().golden') == 2, 'two golden baskets counted')

    # ---- Up and Down ----
    play(pg, 'c2')
    rims, made = [], 0
    for i in range(8):
        rims.append(pg.evaluate('__hoopsCourt().rim'))
        m0 = pg.evaluate('__hoopsState().made')
        pg.evaluate('__hoopsAimAhead()'); wait_ball(pg)
        made += pg.evaluate('__hoopsState().made') - m0
        pg.evaluate('__hoopsStep(0.6)')
    check(max(rims) - min(rims) > 0.3, f'the rim rides up and down ({min(rims):.2f}-{max(rims):.2f} m)')
    check(made >= 7, f'a perfect shot goes in at every height ({made} of 8)')
    pg.evaluate('__hoopsStep(1.8)'); pg.wait_for_timeout(100); pg.screenshot(path=str(OUT / 'hoops-court-updown.png'))

    # ---- Near and Far ----
    play(pg, 'c3')
    zs, three, two, made = [], 0, 0, 0
    for i in range(10):
        c = pg.evaluate('__hoopsCourt()'); zs.append(c['z'])
        s0, m0 = pg.evaluate('__hoopsState().score'), pg.evaluate('__hoopsState().made')
        pg.evaluate('__hoopsAimAhead()'); st = wait_ball(pg)
        d = st['score'] - s0; made += st['made'] - m0
        if d == 3: three += 1
        if d == 2: two += 1
        pg.evaluate('__hoopsStep(0.7)')
    check(max(zs) - min(zs) > 0.9, f'the hoop glides near and far ({min(zs):.2f}-{max(zs):.2f} m)')
    check(three >= 1 and two >= 1, f'far = 3 points, near = 2 ({three} threes, {two} twos)')
    check(made >= 8, f'perfect shots go in near and far ({made} of 10)')
    for _ in range(30):
        if pg.evaluate('__hoopsCourt().three'): break
        pg.evaluate('__hoopsStep(0.2)')
    pg.wait_for_timeout(100); pg.screenshot(path=str(OUT / 'hoops-court-zoom.png'))
    check(not pg.evaluate("(() => { const s = __hoopsState(); return s.bonus; })()"), 'no hoop-slides-back bonus on Near and Far')

    # ---- Hot Shots ----
    play(pg, 'c4')
    check(pg.evaluate('__hoopsCourt().fire'), 'Hot Shots: the net starts on fire')
    pg.wait_for_timeout(150); pg.screenshot(path=str(OUT / 'hoops-court-hot.png'))
    s0 = pg.evaluate('__hoopsState().score'); pg.evaluate('__hoopsAimAhead()'); st = wait_ball(pg)
    check(st['score'] - s0 == 3, f'a basket on fire = 3 ({st["score"] - s0})')
    pg.evaluate('__hoopsShoot(0.2, 0)'); wait_ball(pg)
    check(not pg.evaluate('__hoopsCourt().fire'), 'a miss puts the fire out')
    s0 = pg.evaluate('__hoopsState().score'); pg.evaluate('__hoopsAimAhead()'); st = wait_ball(pg)
    check(st['score'] - s0 == 2 and not pg.evaluate('__hoopsCourt().fire'), 'not on fire: 2 points')
    pg.evaluate('__hoopsAimAhead()'); wait_ball(pg)
    check(pg.evaluate('__hoopsCourt().fire'), '2 in a row lights it again')

    # ---- a star on all 4 courts: Court star + the Disco ball; courts open one by one ----
    pg.evaluate("__hoopsKid(false)")
    for n in range(1, 5):
        play(pg, f'c{n}')
        pg.evaluate(f'__hoopsKid(true, {n * 101})')
        for _ in range(30):
            pg.evaluate('__hoopsStep(5)')
            if pg.evaluate('__hoopsKidReport().done'): break
        pg.wait_for_timeout(1300)
        rep = pg.evaluate('__hoopsKidReport()')
        check(rep['win'], f"c{n}: the pretend kid gets a star ({rep['score']} points)")
        pg.evaluate('__hoopsKid(false)')
    pg.wait_for_timeout(1200)
    pg.screenshot(path=str(OUT / 'hoops-court-results.png'))
    cm.wait_screen(pg, 'results'); cm.tap(pg, 'menu'); pg.wait_for_timeout(600)
    if cm.screen(pg) != 'levels': cm.tap(pg, 'levels'); cm.wait_screen(pg, 'levels')
    if not cm.find(pg, 'level-c1'): cm.tap(pg, 'tab-1'); pg.wait_for_timeout(500)
    its = {i['attr']: i for i in cm.items(pg)}
    check(all(f'level-c{n}' in its and not its[f'level-c{n}']['locked'] for n in range(1, 5)), 'the courts opened one by one (all open now)')
    ach = pg.evaluate("JSON.stringify(__game.save)")
    check('courts' in ach and 'golden' in ach, 'trophies Court star + Golden touch')
    check(pg.evaluate("__game.isUnlocked('ball-disco')"), 'the Disco ball is unlocked')
    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print(f'\n{len(fails)} failed' if fails else '\nAll passed')
sys.exit(1 if fails else 0)
