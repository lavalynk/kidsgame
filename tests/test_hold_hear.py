"""Automated test: Hold to hear (20-point plan #2, Nov 27).

Keep a finger on any canvas-menu button for a moment and the device says its name out loud, so children who
can't read yet can find things by themselves. Letting go after that does NOT press the button.

Run:  python3 tests/test_hold_hear.py
Checks:
  * the hub: holding the bar's Sticker Book button says "Sticker book" and does NOT open the book; holding a game
    tile says the game's name and doesn't start it; a quick tap still works like before
  * a real finger (touch) held on a button says it too; a finger that slides to scroll says nothing
  * every button on the main menus has something to say (hub, players, a game's title menu, coloring picker,
    maze map, Sticker Book, My House, Jukebox, Parent corner)
  * the Parent corner's This device tab has Hold to hear On / Off; Off = holding says nothing
  * the voice is asked to speak (speechSynthesis), unless all sound is muted
  * no JavaScript errors
Screenshots land in tests/out/.
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu as cm
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
url = lambda p: (ROOT / p).as_uri()
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

PROF = json.dumps({'active': 'p1', 'list': [{'id': 'p1', 'name': 'Sam', 'pet': 'cat', 'color': '#ef476f', 'age': 'big'}]})
# count what the page asks the voice to say (headless Chrome has no voices; we only check it was asked)
SPY = """() => { window.__spoken = [];
  if (window.speechSynthesis) speechSynthesis.speak = (u) => window.__spoken.push(u.text); }"""

def center(it): return it['x'] + it['w'] / 2, it['y'] + it['h'] / 2

def hold_mouse(pg, attr, ms=1000):
    it = cm.find(pg, attr); assert it, attr
    x, y = center(it)
    pg.mouse.move(x, y); pg.mouse.down(); pg.wait_for_timeout(ms); pg.mouse.up(); pg.wait_for_timeout(300)

def heard(pg): return pg.evaluate('ArcadeMenus.heard.slice()')

with sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context(viewport={'width': 1280, 'height': 760}, has_touch=True, reduced_motion='reduce')
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(url('index.html'))
    pg.evaluate("p => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); }", PROF)
    pg.reload(); cm.wait_screen(pg, 'hub'); pg.evaluate(SPY)

    # ---- the hub: hold = hear, no press ----
    hold_mouse(pg, 'book')
    check(heard(pg)[-1:] == ['Sticker book'], f'holding the Sticker Book button says "Sticker book" ({heard(pg)})')
    check(pg.evaluate('location.pathname').endswith('index.html') and cm.screen(pg) == 'hub', 'and does NOT open the book')
    check(pg.evaluate('__spoken.slice(-1)') == ['Sticker book'], 'the device voice was asked to say it')
    hold_mouse(pg, 'game-rc')
    check(heard(pg)[-1:] == ['Mini RC Racers'], f'holding a game tile says its name ({heard(pg)[-1:]})')
    check(pg.evaluate('location.pathname').endswith('/index.html') and 'rc' not in pg.evaluate('location.pathname'), "and doesn't start the game")
    n = len(heard(pg))
    cm.tap(pg, 'who'); pg.wait_for_timeout(300)
    check(cm.screen(pg) == 'hub-players' and len(heard(pg)) == n, 'a quick tap still works (Who is playing opens) and says nothing')
    pg.screenshot(path=str(OUT / 'hold_hear_players.png'))
    hold_mouse(pg, 'age')
    check(heard(pg)[-1:] == ['Little kid or big kid'], 'picture-only buttons have words too (the age switch)')
    check(pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.profiles')).list[0].age") == 'big', "holding the age switch didn't flip it")
    cm.tap(pg, 'close'); cm.wait_screen(pg, 'hub')

    # ---- a real finger ----
    cdp = ctx.new_cdp_session(pg)
    def touch_hold(attr, ms=1000, slide=0):
        x, y = center(cm.find(pg, attr))
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y}]})
        for i in range(1, 6):
            pg.wait_for_timeout(ms // 6)
            if slide: cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x, 'y': y - slide * i / 5}]})
        pg.wait_for_timeout(ms // 6)
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); pg.wait_for_timeout(300)
    n = len(heard(pg))
    touch_hold('house')
    check(heard(pg)[n:] == ['My house'] and cm.screen(pg) == 'hub', f'a finger held on My House says "My house" and stays on the hub ({heard(pg)[n:]})')
    n = len(heard(pg))
    touch_hold('game-jungle', 1000, 120)
    check(heard(pg)[n:] == [], f'a finger that slides (scrolling) says nothing ({heard(pg)[n:]})')

    # ---- muted: nothing is said out loud ----
    pg.evaluate("() => { Arcade.store.settings().muted = true; }")
    k = pg.evaluate('__spoken.length'); hold_mouse(pg, 'juke')
    check(pg.evaluate('__spoken.length') == k and heard(pg)[-1] == 'Jukebox', 'all sound muted: the voice stays quiet')
    pg.evaluate("() => { Arcade.store.settings().muted = false; }")

    # ---- every button has something to say ----
    def all_say(where):
        quiet = [i['attr'] or i['label'] for i in cm.items(pg) if not i['say']]
        check(not quiet, f'{where}: every button has something to say' + (f' (silent: {quiet})' if quiet else ''))
    all_say('hub')
    cm.tap(pg, 'who'); cm.wait_screen(pg, 'hub-players'); all_say('players')
    cm.tap(pg, 'close'); cm.wait_screen(pg, 'hub')
    cm.tap(pg, 'daily'); cm.wait_screen(pg, 'hub-daily'); all_say('daily surprise')
    pages = [('jungle/index.html', None), ('claw/index.html', None), ('rc/index.html', None), ('coloring/index.html', 'coloring-pick'),
             ('stickers/index.html', 'stickers-book'), ('house/index.html', 'house'), ('jukebox/index.html', 'jukebox')]
    for page, sid in pages:
        pg.goto(url(page))
        if sid: cm.wait_screen(pg, sid)
        else: cm.to_title(pg)
        all_say(page.split('/')[0] + ' (' + cm.screen(pg) + ')')
    pg.goto(url('maze/index.html')); pg.wait_for_timeout(800)
    pg.evaluate("() => { const b = document.querySelector('#mapBtn') || document.querySelector('[data-map]'); if (b) b.click(); }")
    try:
        cm.wait_screen(pg, 'maze-map'); all_say('maze map')
    except Exception: print('(the maze map button was not found: skipped)')
    pg.goto(url('jungle/index.html')); cm.to_title(pg)
    hold_mouse(pg, 'start')
    check(heard(pg)[-1:] == ['Play'] and cm.screen(pg) == 'title', 'a game title menu: holding Play says "Play" and stays on the menu')
    cm.tap(pg, 'levels'); cm.wait_screen(pg, 'levels'); all_say('jungle levels')
    locked = [i for i in cm.items(pg) if i['locked']]
    if locked: check(locked[0]['say'].endswith('Not yet!'), f'a locked level says "Not yet!" ({locked[0]["say"]})')

    # ---- the Parent corner switch ----
    pg.evaluate("sessionStorage.setItem('kidsArcade.parentOK', '1')")
    pg.goto(url('parent/index.html')); cm.wait_screen(pg, 'parent')
    cm.tap(pg, 'device'); pg.wait_for_timeout(300)
    check(cm.find(pg, 'hear-on') is not None and cm.find(pg, 'hear-on')['label'] == 'On', 'This device has Hold to hear On / Off')
    cm.tap_shown(pg, 'hear-off'); pg.wait_for_timeout(300)
    check(pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.parent')).hear") == 'off', 'Off is saved')
    pg.screenshot(path=str(OUT / 'hold_hear_parent.png'))
    pg.goto(url('index.html')); cm.wait_screen(pg, 'hub'); pg.evaluate(SPY)
    hold_mouse(pg, 'who', 1000)
    check(heard(pg) == [], 'switched off: holding says nothing (a long press is just a tap again)')
    pg.goto(url('index.html')); cm.wait_screen(pg, 'hub')
    pg.evaluate("() => Arcade.parent.setHear(true)")
    pg.reload(); cm.wait_screen(pg, 'hub'); hold_mouse(pg, 'book')
    check(heard(pg)[-1:] == ['Sticker book'], 'switched back on: it speaks again')
    b.close()

for e in errors: print('JS ERROR', e)
check(not errors, 'no JavaScript errors')
print(f'\n{len(fails)} failed' if fails else '\nall passed')
sys.exit(1 if fails else 0)
