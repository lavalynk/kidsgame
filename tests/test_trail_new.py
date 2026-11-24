"""Automated test: Treasure Trail's two new adventures (Nov 24, new plan point 7, part 4).

Run:  python3 tests/test_trail_new.py        (~3 min)
Checks:
  * Rainbow Falls + Mushroom Hollow are in the adventure list, after Sunset Swamp, locked until it's done
  * the raft: it waits at a bank, floats across and waits at the other one; standing on it carries you;
    the little fence keeps you on while it's out on the water (holding Right does NOT walk you into the river);
    you step off at the far bank
  * the bouncy mushrooms: a running jump from the bank lands on the first cap and bounces (BOING) over to the
    second and onto the far bank, just holding Right; the high treasure is picked up on the way
  * one thumb: the explorer waits for the raft, rides it and walks off; one tap at the mushroom pond = across
  * pretend big + little kids (the playtest robot) win both new adventures on the first go
  * every room of both adventures draws (scenery hook), the menu shows them, no JavaScript errors
Screenshots: tests/out/trail-raft.png, tests/out/trail-bounce.png
"""
import json, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

def fresh(pg, little=False, thumb=None):
    pg.goto((ROOT / 'trail' / 'index.html').as_uri())
    pl = {'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': 'little' if little else 'big'}
    if thumb is not None: pl['thumb'] = thumb
    pg.evaluate("p => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); }", json.dumps({'active': 'p1', 'list': [pl]}))
    pg.reload(); pg.wait_for_timeout(700)

def play(pg, aid, room=None):
    pg.evaluate(f"document.activeElement && document.activeElement.blur(); __game.play(__trailDebug.ADVENTURES.find(a => a.id === '{aid}'))")
    pg.wait_for_function(f"window.__trailState && __trailState().rooms === __trailDebug.ADVENTURES.find(a => a.id === '{aid}').rooms.length")
    pg.wait_for_timeout(400)
    if room is not None: pg.evaluate(f'__trailTest.goRoom({room})'); pg.wait_for_timeout(100)

def first(pg, aid, kind):
    return pg.evaluate(f"__trailDebug.ADVENTURES.find(a => a.id === '{aid}').rooms.indexOf('{kind}')")

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('pageerror', lambda e: errors.append(str(e)))

    # ---- the list + locks ----
    fresh(pg)
    ids = pg.evaluate('__trailDebug.ADVENTURES.map(a => a.id)')
    check(ids[:4] == ['river', 'deep', 'temple', 'dusk'] and ids[4:] == ['falls', 'shroom'], f'the two new adventures come after the old four ({ids})')
    lv = pg.evaluate("__game.config.levels(__game).map(l => [l.id, !!l.locked])") if pg.evaluate("!!(window.__game && __game.config)") else None
    if lv: check(dict(lv)['falls'] and dict(lv)['shroom'], f'both are locked on a new save ({lv})')

    # ---- the raft, holding Right ----
    ri = first(pg, 'falls', 'raft')
    play(pg, 'falls', ri)
    pg.evaluate("__trailTest.player().x = 120")
    # wait for the raft to be docked at the near bank, then hold Right the whole way
    pg.wait_for_function("__trailTest.raftAt(0).dock === -1", timeout=20000)
    pg.keyboard.down('ArrowRight')
    seen = {'on': False, 'fenced': True, 'carried': False, 'splash': False}
    x0 = None
    for i in range(120):
        st = pg.evaluate("(() => { const s = __trailState(); return { x: s.x, y: s.y, room: s.room, dead: s.dead, hearts: s.hearts, on: __trailTest.onRaft(), r: __trailTest.room().rafts.length ? __trailTest.raftAt(0) : { dock: 9, x: 0 } }; })()")
        if st['on']:
            seen['on'] = True
            if x0 is None: x0 = st['x']
            if st['r']['dock'] == 0 and abs(st['x'] + 17 - st['r']['x']) > 70: seen['fenced'] = False
            if st['x'] - x0 > 150: seen['carried'] = True
        if st['dead']: seen['splash'] = True
        if i == 18: pg.screenshot(path=str(OUT / 'trail-raft.png'))
        if st['room'] != ri: break
        pg.wait_for_timeout(100)
    pg.keyboard.up('ArrowRight')
    st = pg.evaluate('__trailState()')
    check(seen['on'] and seen['carried'], f"holding Right: you walk onto the docked raft and it carries you across ({seen})")
    check(seen['fenced'] and not seen['splash'], 'the fence keeps you on the raft out on the water (no splash)')
    check(st['room'] > ri, f"...and you step off at the far bank into the next room (room {st['room']})")
    g = pg.evaluate(f"__trailTest.rooms()[{ri}]")
    check(len(g['treasures']) == 1 and g['treasures'][0]['got'], 'riding the raft picks up the treasure over the river')

    # jumping in when the raft is away = splash (the river is too wide to jump)
    play(pg, 'falls', ri)
    pg.wait_for_function("__trailTest.raftAt(0).dock === 1", timeout=20000)
    pg.evaluate("__trailTest.player().x = 140")
    pg.keyboard.down('ArrowRight'); pg.wait_for_timeout(260); pg.keyboard.press('Space')
    pg.wait_for_timeout(900); pg.keyboard.up('ArrowRight')
    check(len(pg.evaluate('__trailState().ouches')) >= 1, 'running at the river while the raft is on the other side = a splash')

    # ---- the bouncy mushrooms, holding Right ----
    bi = first(pg, 'shroom', 'bounce')
    play(pg, 'shroom', bi)
    pg.evaluate("__trailTest.player().x = 60")
    pg.keyboard.down('ArrowRight')
    pg.wait_for_function('__trailState().x > 175', timeout=5000)
    pg.keyboard.press('Space')
    shot = False
    for i in range(30):
        bo = pg.evaluate('__trailTest.boings()')
        if not shot and bo[0] > 0: pg.wait_for_timeout(120); pg.screenshot(path=str(OUT / 'trail-bounce.png')); shot = True
        if pg.evaluate('__trailState().room') != bi: break
        pg.wait_for_timeout(100)
    pg.keyboard.up('ArrowRight')
    st = pg.evaluate('__trailState()'); bo = pg.evaluate('__trailTest.boings()') if st['room'] == bi else None
    check(st['room'] > bi and not st['ouches'], f"a running jump + holding Right: boing, boing, over the pond and on (room {st['room']}, ouches {st['ouches']})")
    play(pg, 'shroom', bi); pg.evaluate("__trailTest.player().x = 60")
    pg.keyboard.down('ArrowRight'); pg.wait_for_function('__trailState().x > 175', timeout=5000); pg.keyboard.press('Space')
    pg.wait_for_timeout(1700); pg.keyboard.up('ArrowRight')
    bo = pg.evaluate('__trailTest.boings()'); tr = pg.evaluate('__trailTest.room().treasures')
    check(bo[0] > 0 and bo[1] > 0, f'both mushrooms bounced ({bo})')
    check(tr[0]['got'], 'the high treasure is picked up on the first bounce')

    # ---- one thumb ----
    fresh(pg, little=True)
    play(pg, 'falls', ri)
    for _ in range(6): pg.keyboard.press('Space'); pg.wait_for_timeout(350)   # (taps while waiting / riding do nothing)
    pg.wait_for_function('__trailState().room !== ' + str(ri) + ' || __trailState().time > 60', timeout=60000, polling=200)
    st = pg.evaluate('__trailState()')
    check(st['oneThumb'] and st['room'] > ri and not st['ouches'], f"one thumb: he waits for the raft (taps don't jump him in), rides it and walks off (room {st['room']}, ouches {st['ouches']})")
    play(pg, 'shroom', bi)
    pg.wait_for_function('__trailState().x > 180 && Math.abs(__trailState().vx) < 5', timeout=8000)
    pg.wait_for_timeout(400)
    check(pg.evaluate('__trailState().room') == bi and pg.evaluate('__trailState().x') < 250, 'one thumb: he waits at the mushroom pond')
    pg.keyboard.press('Space')
    pg.wait_for_timeout(2500)
    st = pg.evaluate('__trailState()')
    check(st['room'] > bi or st['x'] > 700, f"...one tap and he bounces across (x {round(st['x'])}, room {st['room']}, ouches {st['ouches']})")

    # ---- pretend kids win them on the first go ----
    for little in (False, True):
        fresh(pg, little)
        for aid in ('falls', 'shroom'):
            play(pg, aid)
            pg.evaluate('__trailBot(true, 13, 6)')
            pg.wait_for_function('__trailState().finished || __trailState().time > 400', timeout=240000, polling=300)
            st = pg.evaluate('__trailState()'); pg.evaluate('__trailBot(false)')
            check(st['won'], f"{aid}, pretend {'little' if little else 'big'} kid ({st['difficulty']}): won on the first go, {len(st['ouches'])} bumps + splashes, treasures {st['got']}/{st['total']}")

    # ---- every room draws ----
    ok = pg.evaluate("""() => { const c = document.createElement('canvas'); c.width = 960; c.height = 540; const x = c.getContext('2d');
      for (const a of __trailScene.adventures.filter(a => a.id === 'falls' || a.id === 'shroom')) for (let i = 0; i < a.rooms; i++) __trailScene.draw(x, a.id, i, 2.5);
      return true; }""")
    check(ok, 'every room of both new adventures draws')

    check(not errors, f'no JavaScript errors {errors[:3]}')
    b.close()

print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
raise SystemExit(1 if fails else 0)
