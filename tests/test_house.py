"""Automated test: My House - 3 rooms, moving things, and visiting a friend's house.

Run:  python3 tests/test_house.py
Checks:
  * Bedroom, Garden and Garage: switch rooms, every room has its spots, buy something in the garden
  * the garage shows your Mini RC Racers car (rc.js saves a picture when its menu opens)
  * drag a thing (and your animal) somewhere else: it stays there after a reload; "put it back"
  * the "My House" sticker comes from buying something (not just opening the house)
  * Friends (local switchboard, like test_friends.py): phone B visits phone A's house, sees A's
    things where A moved them and A's car; A sees B's animal walk in; hops show on both phones
  * desktop, phone upright and phone sideways layouts; no JavaScript errors
Screenshots land in tests/out/.
"""
import sys, time, socket, subprocess, pathlib, os, signal
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
PORT = 8798
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
HOUSE = (ROOT / 'house' / 'index.html').as_uri()
ST = lambda pg: pg.evaluate('__houseState()')

srv = None
with sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context(viewport={'width': 1280, 'height': 800})
    a = ctx.new_page(); a.on('pageerror', lambda e: errors.append('A: ' + str(e)))

    # ---- the RC car: opening RC's menu saves a picture of your car ----
    a.goto((ROOT / 'rc' / 'index.html').as_uri()); a.evaluate('localStorage.clear()'); a.reload(); a.wait_for_timeout(500)
    a.mouse.click(640, 380); a.wait_for_timeout(700)
    pic = a.evaluate("((Arcade.store.load().games.rc || {}).data || {}).garagePic || ''")
    check(pic.startswith('data:image/png'), f'RC saved a picture of your car for the garage ({len(pic)} bytes)')

    # ---- rooms ----
    a.goto(HOUSE); a.wait_for_timeout(400)
    s = ST(a)
    check(s['rooms'] == ['bedroom', 'garden', 'garage'] and s['room'] == 'bedroom' and len(s['spots']) == 12, f"3 rooms, starts in the bedroom (12 spots) ({s['rooms']})")
    check(a.locator('.rm').count() == 3, 'three big room buttons')
    a.click('[data-room=garden]'); a.wait_for_timeout(200)
    s = ST(a)
    check(s['room'] == 'garden' and len(s['spots']) == 10 and s['placed'].get('g-sky') == 'sky-day', f"garden: 10 spots, a blue sky to start ({len(s['spots'])})")
    # buy a kite: 1st tap tries it, 2nd buys it (3 coins to start)
    a.click('[data-spot=g-flyer]'); a.click('[data-item=flyer-kite]'); a.wait_for_timeout(100)
    check(ST(a)['trying'] == 'flyer-kite' and ST(a)['coins'] == 3, 'garden: first tap tries the kite')
    a.click('[data-item=flyer-kite]'); a.wait_for_timeout(200)
    s = ST(a)
    check(s['placed'].get('g-flyer') == 'flyer-kite' and s['coins'] == 2, f"garden: second tap buys it ({s['coins']} coins left)")
    a.wait_for_timeout(1200)
    have = a.evaluate("Arcade.store.load().stickers.have")
    check('arcade-3' in have, 'buying something gives the "My House" sticker')
    a.screenshot(path=str(OUT / 'house-garden.png'))

    # ---- drag the kite and your animal ----
    box = a.locator('#room > svg').bounding_box(); k = box['width'] / 800
    def drag(x0, y0, x1, y1):
        a.mouse.move(box['x'] + x0 * k, box['y'] + y0 * k); a.mouse.down()
        for i in range(1, 9): a.mouse.move(box['x'] + (x0 + (x1 - x0) * i / 8) * k, box['y'] + (y0 + (y1 - y0) * i / 8) * k); a.wait_for_timeout(16)
        a.mouse.up(); a.wait_for_timeout(200)
    drag(150, 75, 450, 95)            # the kite, over to the middle
    pos = ST(a)['pos']
    check(pos.get('g-flyer') and abs(pos['g-flyer'][0] - 300) < 8 and abs(pos['g-flyer'][1] - 20) < 8, f"drag: the kite moved ({pos.get('g-flyer')})")
    drag(490, 400, 300, 420)          # your animal (stands at x 490 in the garden)
    pos = ST(a)['pos']
    check(pos.get('me:garden') and pos['me:garden'][0] < -150, f"drag: your animal moved ({pos.get('me:garden')})")
    a.reload(); a.wait_for_timeout(300)
    check(ST(a)['room'] == 'garden' and ST(a)['pos'].get('g-flyer') == pos['g-flyer'], 'moved things stay put after a reload (and the garden is still open)')
    # a tap (no drag) on a thing opens its spot in the shop
    a.mouse.click(box['x'] + 680 * k, box['y'] + 466 * k)  # (the flower bed is empty: tap the ground does nothing)
    a.click('[data-spot=g-flyer]'); a.wait_for_timeout(100)
    check(a.locator('[data-back]').count() == 1, 'a moved thing gets a "put it back" button')
    a.click('[data-back]'); a.wait_for_timeout(100)
    check('g-flyer' not in ST(a)['pos'], 'put it back')

    # ---- putting things away (Keith, Nov 9): drag off the edge, or onto the toy box ----
    a.mouse.move(box['x'] + 150 * k, box['y'] + 75 * k); a.mouse.down()
    for i in range(1, 9): a.mouse.move(box['x'] + (150 + 400 * i / 8) * k, box['y'] + 75 * k); a.wait_for_timeout(16)
    check(a.locator('#room .awaybox').count() == 1, 'while dragging a thing, a toy box shows in the corner')
    for i in range(1, 9): a.mouse.move(box['x'] + (550 + 40 * i) * k, box['y'] + 75 * k); a.wait_for_timeout(16)   # off the right edge
    check(a.locator('#room .awaybox.on').count() == 1, 'off the edge: the toy box wiggles')
    a.screenshot(path=str(OUT / 'house-putaway.png'))
    a.mouse.up(); a.wait_for_timeout(500)
    s = ST(a)
    check(s['placed'].get('g-flyer') == '' and 'flyer-kite' in s['owned'] and a.locator('#room .awaybox').count() == 0, 'dropped off the edge: the kite is put away (still yours)')
    a.click('[data-item=flyer-kite]'); a.wait_for_timeout(100)
    check(ST(a)['placed'].get('g-flyer') == 'flyer-kite' and ST(a)['coins'] == 2, 'put it back from the shop for free')
    drag(150, 75, 730, 440)           # onto the toy box
    a.wait_for_timeout(400)
    check(ST(a)['placed'].get('g-flyer') == '', 'dropped on the toy box: put away')
    a.click('[data-item=flyer-kite]'); a.wait_for_timeout(100)
    drag(150, 75, 300, 75); drag(300, 75, 300, 400)     # a little move, then a drop in the middle: stays
    check(ST(a)['placed'].get('g-flyer') == 'flyer-kite', 'dropping anywhere else keeps it in the room')
    a.click('[data-back]'); a.wait_for_timeout(100)
    mx = 490 + ST(a)['pos']['me:garden'][0]
    drag(mx, 400, 900, 400)           # your animal can't be put away
    check(ST(a)['pos'].get('me:garden') and a.locator('#room [data-who="self"]').count() == 1, 'your animal can\'t be put away (it just stops at the edge)')
    drag(150, 75, 600, 70)            # move it again (for the friend to see)
    a.screenshot(path=str(OUT / 'house-garden-moved.png'))

    # ---- the garage: your RC car ----
    a.click('[data-room=garage]'); a.wait_for_timeout(200)
    check(a.locator('#room image').count() == 1, 'garage: your RC car is on the stand')
    a.locator('#room > svg').screenshot(path=str(OUT / 'house-garage.png'))

    # ---- sizes ----
    for name, vp in [('phone', {'width': 390, 'height': 844}), ('phone-wide', {'width': 844, 'height': 390}), ('tablet', {'width': 820, 'height': 1180})]:
        a.set_viewport_size(vp); a.reload(); a.wait_for_timeout(300)
        rb = a.locator('#room > svg').bounding_box()
        btns = a.evaluate('''[...document.querySelectorAll('.rm, .round, .tab, .item')].map(e => e.getBoundingClientRect()).filter(r => r.width)''')
        small = [bb for bb in btns if bb['width'] < 48]
        inside = rb['x'] >= 0 and rb['x'] + rb['width'] <= vp['width'] + 1
        scroll = a.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
        check(inside and not scroll and not small, f"{name}: room fits, buttons big enough ({len(small)} small)")
        a.screenshot(path=str(OUT / f'house-{name}.png'))
    a.set_viewport_size({'width': 1280, 'height': 800})

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

        a.click('#fbtn'); a.click('[data-make]'); a.wait_for_function('__houseState().seat === 0', timeout=10000)
        code = ST(a)['code']
        c.click('#fbtn'); c.click('[data-join]')
        for n in code: c.click(f'.net-keys [data-pic="{n}"]'); c.wait_for_timeout(80)
        c.wait_for_function('__houseState().seat === 1', timeout=10000)
        c.wait_for_function('__houseState().friends.length === 1 && __houseState().friends[0].placed > 20 && __houseState().friends[0].car', timeout=10000)
        a.wait_for_function('__houseState().friends.length === 1', timeout=5000)
        check(c.locator('[data-visit="0"]').count() == 1, "B's Friends window shows A's animal, ready to visit")
        check(a.locator('[data-visit="1"]').count() == 1, "A's Friends window shows B too")
        c.screenshot(path=str(OUT / 'house-friends.png'))
        a.click('[data-close]')
        c.click('[data-visit="0"]'); c.wait_for_timeout(300)
        s = ST(c)
        check(s['visiting'] == 0 and c.locator('#visit').is_visible() and not c.locator('.side').is_visible(), 'B is visiting A: friend banner, no shop')
        c.click('[data-room=garden]'); c.wait_for_timeout(200)
        html = c.locator('#room > svg').inner_html()
        apos = ST(a)['pos']['g-flyer']
        check(f'translate({apos[0]} {apos[1]})' in html, f"B sees A's kite where A moved it ({apos})")
        check(c.locator('#room [data-drag]').count() == 0, "B can't move A's things")
        a.wait_for_function("__houseState().guests.includes('1')", timeout=5000)
        check(True, "A sees B's animal walk into A's house")
        c.click('[data-room=garage]'); c.wait_for_timeout(200)
        check(c.locator('#room image').count() == 1, "B sees A's RC car in A's garage")
        c.locator('#room > svg').screenshot(path=str(OUT / 'house-visit-garage.png'))
        c.click('[data-room=garden]'); c.wait_for_timeout(200)
        c.locator('#room > svg').screenshot(path=str(OUT / 'house-visit.png'))
        a.click('[data-room=garden]'); a.wait_for_timeout(200)
        a.locator('#room > svg').screenshot(path=str(OUT / 'house-visited.png'))
        # B taps A's animal: it hops on both phones
        c.locator('#room [data-who="0"]').click(); a.wait_for_timeout(300)
        check('hop' in (a.locator('#room [data-who="self"]').get_attribute('class') or ''), "a hop on B's phone hops A's animal on A's phone")
        # A buys + changes something: B sees it
        a.click('[data-spot=g-flyer]'); a.click('[data-none]'); c.wait_for_timeout(800)
        check(c.locator('#room [data-layer="g-flyer"]').count() == 0, "A takes the kite away: it's gone on B's phone too")
        # B goes home
        c.click('[data-home]'); c.wait_for_timeout(300)
        check(ST(c)['visiting'] is None and c.locator('.side').is_visible(), 'B goes back home')
        a.wait_for_function("!__houseState().guests.includes('1')", timeout=5000)
        check(True, "B's animal leaves A's house")
        # A leaves the room
        a.click('#fbtn'); a.click('[data-leave]'); c.wait_for_function('__houseState().friends.length === 0', timeout=5000)
        check(True, 'A leaves: B sees nobody')
        ctx2.close()
    finally:
        if srv: os.killpg(os.getpgid(srv.pid), signal.SIGTERM)
    b.close()

check(not errors, f'no JavaScript errors ({errors[:3]})')
print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
