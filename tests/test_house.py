"""Automated test: My House - 4 rooms, moving things, and visiting a friend's house.

Run:  python3 tests/test_house.py
Since Nov 21 the page is drawn by Phaser + Rex UI (one canvas screen, 'house'); the test taps it for real
with tests/cmenu.py: tiles home, room-<id>, friends, coins, spot-<id>, none, item-<id>, back, and the room
itself (a live picture you drag things on).
Checks:
  * Bedroom, Garden and Garage: switch rooms, every room has its spots, buy something in the garden
  * the garage shows your Mini RC Racers car (rc.js saves a picture when its menu opens)
  * the Art Room hangs your newest coloring book pictures on its wall
  * drag a thing (and your animal) somewhere else: it stays there after a reload; "put it back"
  * drag a thing off the edge / onto the toy box: put away; tap the wall: its spot opens
  * the "My House" sticker comes from buying something (not just opening the house)
  * not enough coins: "win trophies" picture
  * Friends (local switchboard, like test_friends.py): phone B visits phone A's house, sees A's
    things where A moved them and A's car; A sees B's animal walk in; hops show on both phones
  * desktop, phone upright and phone sideways layouts; no JavaScript errors
Screenshots land in tests/out/.
"""
import sys, time, socket, subprocess, pathlib, os, signal
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from cmenu import wait_screen, find, tap, items
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
PORT = 8798
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
HOUSE = (ROOT / 'house' / 'index.html').as_uri()
ST = lambda pg: pg.evaluate('__houseState()')

def ready(pg):
    """The house screen is drawn and every layer of the room is loaded."""
    pg.wait_for_function("window.__houseState && __houseState().screen === 'house' && __houseState().loaded && ArcadeMenus.list().length > 0", timeout=8000)
    pg.wait_for_timeout(400)

def go(pg, attr):
    """Tap a tile and wait for the screen to be redrawn."""
    tap(pg, attr); pg.wait_for_timeout(250)

def room_box(pg):
    r = find(pg, 'room'); return r['x'], r['y'], r['w'] / 800

def drag(pg, x0, y0, x1, y1, up=True):
    """Drag in the room (room units: 800 x 500)."""
    bx, by, k = room_box(pg)
    pg.mouse.move(bx + x0 * k, by + y0 * k); pg.mouse.down()
    for i in range(1, 9): pg.mouse.move(bx + (x0 + (x1 - x0) * i / 8) * k, by + (y0 + (y1 - y0) * i / 8) * k); pg.wait_for_timeout(16)
    if up: pg.mouse.up(); pg.wait_for_timeout(300)

def room_tap(pg, x, y):
    bx, by, k = room_box(pg); pg.mouse.click(bx + x * k, by + y * k); pg.wait_for_timeout(250)

srv = None
with sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context(viewport={'width': 1280, 'height': 800})
    a = ctx.new_page(); a.on('pageerror', lambda e: errors.append('A: ' + str(e)))

    # ---- the RC car: opening RC's menu saves a picture of your car ----
    a.goto((ROOT / 'rc' / 'index.html').as_uri()); a.evaluate('localStorage.clear()'); a.reload(); a.wait_for_timeout(500)
    a.mouse.click(640, 380); a.wait_for_timeout(900)
    pic = a.evaluate("((Arcade.store.load().games.rc || {}).data || {}).garagePic || ''")
    check(pic.startswith('data:image/png'), f'RC saved a picture of your car for the garage ({len(pic)} bytes)')

    # ---- rooms ----
    a.goto(HOUSE); ready(a)
    s = ST(a)
    check(s['canvas'] and s['rooms'] == ['bedroom', 'garden', 'garage', 'art'] and s['room'] == 'bedroom' and len(s['spots']) == 12, f"canvas page, 4 rooms, starts in the bedroom (12 spots) ({s['rooms']})")
    rooms = [i for i in items(a) if i['attr'].startswith('room-')]
    check(len(rooms) == 4 and [i for i in rooms if i['picked']][0]['attr'] == 'room-bedroom', 'four big room tiles, the bedroom is yellow')
    check(len([i for i in items(a) if i['attr'].startswith('spot-')]) == 12 and find(a, 'home') and find(a, 'coins'), 'a tile per spot, home + coins tiles')
    a.screenshot(path=str(OUT / 'house-bedroom.png'))
    go(a, 'room-garden'); ready(a)
    s = ST(a)
    check(s['room'] == 'garden' and len(s['spots']) == 10 and s['placed'].get('g-sky') == 'sky-day', f"garden: 10 spots, a blue sky to start ({len(s['spots'])})")
    # buy a kite: 1st tap tries it, 2nd buys it (3 coins to start)
    go(a, 'spot-g-flyer'); go(a, 'item-flyer-kite')
    check(ST(a)['trying'] == 'flyer-kite' and ST(a)['coins'] == 3 and find(a, 'item-flyer-kite')['picked'] and find(a, 'item-flyer-kite')['pics'] == 2,
          'garden: first tap tries the kite (yellow tile with the green "buy" tick)')
    a.screenshot(path=str(OUT / 'house-trying.png'))
    go(a, 'item-flyer-kite')
    s = ST(a)
    check(s['placed'].get('g-flyer') == 'flyer-kite' and s['coins'] == 2, f"garden: second tap buys it ({s['coins']} coins left)")
    a.wait_for_timeout(1200)
    have = a.evaluate("Arcade.store.load().stickers.have")
    check('arcade-3' in have, 'buying something gives the "My House" sticker')
    # too dear: try the treehouse-ish dearest thing, tap again -> "win trophies" picture, nothing bought
    pricey = a.evaluate("""(() => { const c = __houseState().coins; for (const sp of __houseItems().find(r => r.room === 'garden').spots)
        for (let i = 0; i < sp.items.length; i++) if (sp.prices[i] > c) return [sp.id, sp.items[i]]; return null; })()""")
    if pricey: go(a, 'spot-' + pricey[0]); pricey = pricey[1]
    if pricey:
        go(a, 'item-' + pricey); go(a, 'item-' + pricey); a.wait_for_timeout(200)
        toast = a.evaluate("(document.querySelector('.ar-toast.show') || {}).innerHTML || ''")
        check(pricey not in ST(a)['owned'] and 'viewBox="0 0 150 48"' in toast, f'not enough coins for {pricey}: the "win trophies to get coins" picture')
    go(a, 'spot-g-flyer')
    a.screenshot(path=str(OUT / 'house-garden.png'))

    # ---- drag the kite and your animal ----
    drag(a, 150, 75, 450, 95)            # the kite, over to the middle
    pos = ST(a)['pos']
    check(pos.get('g-flyer') and abs(pos['g-flyer'][0] - 300) < 8 and abs(pos['g-flyer'][1] - 20) < 8, f"drag: the kite moved ({pos.get('g-flyer')})")
    drag(a, 490, 400, 300, 420)          # your animal (stands at x 490 in the garden)
    pos = ST(a)['pos']
    check(pos.get('me:garden') and pos['me:garden'][0] < -150, f"drag: your animal moved ({pos.get('me:garden')})")
    a.reload(); ready(a)
    check(ST(a)['room'] == 'garden' and ST(a)['pos'].get('g-flyer') == pos['g-flyer'], 'moved things stay put after a reload (and the garden is still open)')
    # a tap on the sky opens the sky's spot; a tap on the moved kite opens the kite's
    room_tap(a, 760, 30)
    check(ST(a)['spot'] == 'g-sky', f"tap the sky: the sky's things show ({ST(a)['spot']})")
    room_tap(a, 450, 95)
    check(ST(a)['spot'] == 'g-flyer' and find(a, 'back'), 'tap the moved kite: its things show, with a "put it back" tile')
    go(a, 'back')
    check('g-flyer' not in ST(a)['pos'], 'put it back')
    # your animal hops when tapped
    room_tap(a, 490 + ST(a)['pos']['me:garden'][0], 400)
    check('self' in ST(a)['hopping'], 'tap your animal: it hops')

    # ---- putting things away (Keith, Nov 9): drag off the edge, or onto the toy box ----
    drag(a, 150, 75, 550, 75, up=False)
    check(ST(a)['dragging'] and not ST(a)['away'], 'dragging a thing (the toy box shows in the corner)')
    bx, by, k = room_box(a)
    for i in range(1, 9): a.mouse.move(bx + (550 + 40 * i) * k, by + 75 * k); a.wait_for_timeout(16)   # off the right edge
    check(ST(a)['away'], 'off the edge: the toy box wiggles')
    a.screenshot(path=str(OUT / 'house-putaway.png'))
    a.mouse.up(); a.wait_for_timeout(600)
    s = ST(a)
    check(s['placed'].get('g-flyer') == '' and 'flyer-kite' in s['owned'] and not s['dragging'], 'dropped off the edge: the kite is put away (still yours)')
    go(a, 'item-flyer-kite')
    check(ST(a)['placed'].get('g-flyer') == 'flyer-kite' and ST(a)['coins'] == 2, 'put it back from the shop for free')
    drag(a, 150, 75, 730, 440)           # onto the toy box
    a.wait_for_timeout(500)
    check(ST(a)['placed'].get('g-flyer') == '', 'dropped on the toy box: put away')
    go(a, 'item-flyer-kite')
    drag(a, 150, 75, 300, 75); drag(a, 300, 75, 300, 400)     # a little move, then a drop in the middle: stays
    check(ST(a)['placed'].get('g-flyer') == 'flyer-kite', 'dropping anywhere else keeps it in the room')
    go(a, 'back')
    mx = 490 + ST(a)['pos']['me:garden'][0]
    drag(a, mx, 400, 900, 400)           # your animal can't be put away
    check(ST(a)['pos'].get('me:garden') and 'me:garden' in ST(a)['layers'], 'your animal can\'t be put away (it just stops at the edge)')
    drag(a, 150, 75, 600, 70)            # move it again (for the friend to see)
    a.screenshot(path=str(OUT / 'house-garden-moved.png'))

    # ---- the garage: your RC car ----
    go(a, 'room-garage'); ready(a)
    check(a.evaluate('__houseSVG()').count('<image') == 1, 'garage: your RC car is on the stand')
    a.screenshot(path=str(OUT / 'house-garage.png'))

    # ---- the Art Room: pictures from the coloring book hang on the wall ----
    a.goto((ROOT / 'coloring' / 'index.html').as_uri() + '#apple'); a.wait_for_timeout(300)
    a.evaluate('''() => { const d = document.createElement('div'); d.innerHTML = PAGES.find(p => p.id === 'apple').html;
        const n = d.querySelectorAll(':scope > .r').length, C = ['#ef476f', '#ffd166', '#06d6a0', '#4cc9f0'];
        const s = JSON.parse(localStorage.getItem('kidsColoring.v1') || '{"pages":{},"gallery":[]}');
        s.gallery = [{ id: 'a1', page: 'apple', t: 1, state: { v: 2, fills: Array.from({ length: n }, (_, i) => C[i % 4]), strokes: [], stickers: [{ k: 'heart', x: 320, y: 80, s: 0.6, c: '#9b5de5' }] } },
                     { id: 'a2', page: 'cat', t: 0, state: { v: 2, fills: ['#bde0fe', '#06d6a0'], strokes: [], stickers: [] } }];
        localStorage.setItem('kidsColoring.v1', JSON.stringify(s)); }''')
    a.goto(HOUSE); ready(a)
    go(a, 'room-art'); ready(a)
    s = ST(a)
    check(s['room'] == 'art' and len(s['spots']) == 5 and s['placed'].get('a-frame') == 'frame-wood', f"art room: 5 spots, wooden frames to start ({len(s['spots'])})")
    html = a.evaluate('__houseSVG()')
    check(html.count('<svg') == 7 and '#9b5de5' in html and '#bde0fe' in html, 'art room: 6 frames, your 2 pictures (with the colored sticker) hang in them')
    a.screenshot(path=str(OUT / 'house-art.png'))

    # ---- sizes ----
    for name, vp in [('phone', {'width': 390, 'height': 844}), ('phone-wide', {'width': 844, 'height': 390}), ('tablet', {'width': 820, 'height': 1180}), ('small-wide', {'width': 568, 'height': 320})]:
        a.set_viewport_size(vp); a.reload(); ready(a)
        its = items(a)
        rb = find(a, 'room')
        small = [i['attr'] for i in its if i['w'] < 40 or i['h'] < 40]
        off = [i['attr'] for i in its if i['x'] < -1 or i['x'] + i['w'] > vp['width'] + 1 or (not i.get('shown', True) and i['attr'] in ('room', 'home'))]
        check(rb['x'] >= 0 and rb['x'] + rb['w'] <= vp['width'] + 1 and not small and not off, f"{name}: room fits, tiles big enough ({small[:3]} small, {off[:3]} off)")
        a.screenshot(path=str(OUT / f'house-{name}.png'))
        if name == 'phone':      # drag works upright too (the room stays put above the part that scrolls)
            go(a, 'room-garden'); ready(a)
            before = ST(a)['pos'].get('g-flyer')
            drag(a, 600, 70, 500, 120)
            check(ST(a)['pos'].get('g-flyer') != before, f"phone upright: dragging in the room works ({before} -> {ST(a)['pos'].get('g-flyer')})")
            drag(a, 500, 120, 600, 70)
    a.set_viewport_size({'width': 1280, 'height': 800}); a.reload(); ready(a)

    # ---- visiting a friend (local switchboard) ----
    wr = os.environ.get('WRANGLER', 'npx --yes wrangler@4')
    srv = subprocess.Popen(f'{wr} dev --port {PORT} --ip 127.0.0.1', shell=True, cwd=ROOT / 'server',
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, preexec_fn=os.setsid)
    for _ in range(120):
        try: socket.create_connection(('127.0.0.1', PORT), 1).close(); break
        except OSError: time.sleep(1)
    time.sleep(2)
    try:
        a.evaluate(f"localStorage.setItem('kidsArcade.server', 'ws://127.0.0.1:{PORT}')"); a.reload(); a.wait_for_timeout(300)
        ctx2 = b.new_context(viewport={'width': 1280, 'height': 800})
        c = ctx2.new_page(); c.on('pageerror', lambda e: errors.append('B: ' + str(e)))
        c.goto(HOUSE); c.evaluate(f"localStorage.clear(); localStorage.setItem('kidsArcade.server', 'ws://127.0.0.1:{PORT}'); localStorage.setItem('kidsArcade.profiles', JSON.stringify({{ active: 'p1', list: [{{ id: 'p1', name: 'Bo', pet: 'dog', color: '#4cc9f0' }}] }}))")
        c.reload(); c.wait_for_timeout(300)

        ready(c)
        def tile_ok(pg, attr): return find(pg, attr) is not None
        go(a, 'friends'); wait_screen(a, 'house-friends'); tap(a, 'host')
        a.wait_for_function('__houseState().seat === 0', timeout=10000); wait_screen(a, 'house-room')
        code = ST(a)['code']
        go(c, 'friends'); wait_screen(c, 'house-friends'); tap(c, 'joinroom'); wait_screen(c, 'house-join')
        for n in code: tap(c, f'pic-{n}'); c.wait_for_timeout(120)
        c.wait_for_function('__houseState().seat === 1', timeout=10000)
        c.wait_for_function('__houseState().friends.length === 1 && __houseState().friends[0].placed > 20 && __houseState().friends[0].car', timeout=10000)
        a.wait_for_function('__houseState().friends.length === 1', timeout=5000)
        c.wait_for_function("ArcadeMenus.screen() === 'house-room' && ArcadeMenus.list().some(i => i.attr === 'visit-0')", timeout=5000)
        a.wait_for_function("ArcadeMenus.screen() === 'house-room' && ArcadeMenus.list().some(i => i.attr === 'visit-1')", timeout=5000)
        check(True, "B's Friends screen shows A's animal, ready to visit; A's shows B too")
        c.wait_for_timeout(400); c.screenshot(path=str(OUT / 'house-friends.png'))
        tap(a, 'close'); ready(a)
        check(ST(a)['screen'] == 'house' and tile_ok(a, 'friends'), 'A closes the Friends screen: back in the house')
        tap(c, 'visit-0'); ready(c)
        s = ST(c)
        check(s['visiting'] == 0 and tile_ok(c, 'gohome') and tile_ok(c, 'friend') and not tile_ok(c, 'coins') and not any(i['attr'].startswith('spot-') for i in items(c)),
              'B is visiting A: friend + my-house tiles, no spots, no shop')
        go(c, 'room-garden'); ready(c)
        html = c.evaluate('__houseSVG()')
        apos = ST(a)['pos']['g-flyer']
        check(f'translate({apos[0]} {apos[1]})' in html, f"B sees A's kite where A moved it ({apos})")
        before = ST(a)['pos']['g-flyer']
        drag(c, 150 + apos[0], 75 + apos[1], 300, 300)
        check(ST(a)['pos']['g-flyer'] == before and not ST(c)['dragging'], "B can't move A's things")
        a.wait_for_function("__houseState().guests.includes('1')", timeout=5000)
        check(True, "A sees B's animal walk into A's house")
        go(c, 'room-garage'); ready(c)
        check(c.evaluate('__houseSVG()').count('<image') == 1, "B sees A's RC car in A's garage")
        c.screenshot(path=str(OUT / 'house-visit-garage.png'))
        go(c, 'room-garden'); ready(c)
        c.screenshot(path=str(OUT / 'house-visit.png'))
        go(a, 'room-garden'); ready(a)
        a.screenshot(path=str(OUT / 'house-visited.png'))
        # B taps A's animal: it hops on both phones
        mx = 490 + ST(a)['pos'].get('me:garden', [0, 0])[0]; my = ST(a)['pos'].get('me:garden', [0, 0])[1]
        room_tap(c, mx, 400 + my); a.wait_for_timeout(100)
        check('self' in ST(a)['hopping'], "a hop on B's phone hops A's animal on A's phone")
        # A takes the kite away: B sees it
        go(a, 'spot-g-flyer'); go(a, 'none'); c.wait_for_timeout(800)
        check('g-flyer' not in ST(c)['layers'], "A takes the kite away: it's gone on B's phone too")
        # B goes home
        go(c, 'gohome'); ready(c)
        check(ST(c)['visiting'] is None and tile_ok(c, 'coins'), 'B goes back home')
        a.wait_for_function("!__houseState().guests.includes('1')", timeout=5000)
        check(True, "B's animal leaves A's house")
        # A leaves the room
        go(a, 'friends'); wait_screen(a, 'house-room'); tap(a, 'leave')
        c.wait_for_function('__houseState().friends.length === 0', timeout=5000)
        check(ST(a)['code'] is None, 'A leaves: B sees nobody')
        ctx2.close()
    finally:
        if srv: os.killpg(os.getpgid(srv.pid), signal.SIGTERM)
    b.close()

check(not errors, f'no JavaScript errors ({errors[:3]})')
print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
