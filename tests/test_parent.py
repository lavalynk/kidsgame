"""Automated test: the Parent corner, play time, the daily time limit and "lite" drawing (Nov 16).

Run:  python3 tests/test_parent.py   (about 1 minute)
Checks:
- the hub has a Grown-ups button: it opens the door; a tap does nothing, holding for 3 seconds opens the Parent corner
- opening parent/ directly shows the same hold button first (the door)
- play time is counted per player, per game and per day; only 14 days are kept; the Parent corner itself isn't counted
- the Parent corner shows each kid's minutes, games, stickers; the limit, music and sound settings are saved
- a time limit: when today's time is used up the "All done for today!" screen covers the game (and the hub),
  the game is paused, keys don't reach it; the other player isn't affected; a new day clears it;
  holding the grown-ups button gives 15 more minutes
- a bedtime (Nov 22): from the bedtime until 6 am "Time for bed!" covers the games (also after midnight, also on a
  game, which pauses); the other player isn't affected; holding its button gives 15 more minutes from now;
  set in the Parent corner with picture-less time buttons (bed-<minutes>), plus "15 more minutes tonight"
- "Report a problem" is an email link with technical details only (no names)
- drawing quality: "Always fast" draws the game with fewer pixels, "Always sharp" with all of them;
  on Automatic the kit switches to fast by itself when frames are slow, and remembers it
Screenshots land in tests/out/.
"""
import json, pathlib, urllib.parse
from playwright.sync_api import sync_playwright
import sys; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu as cm
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

TWO = json.dumps({'active': 'p1', 'list': [
    {'id': 'p1', 'name': 'Sam', 'pet': 'cat', 'color': '#ef476f', 'age': 'big'},
    {'id': 'p2', 'name': 'Ava', 'pet': 'dog', 'color': '#118ab2', 'age': 'little'}]})
DAY = '2026-11-16'
url = lambda p: (ROOT / p).as_uri()

def fresh(pg, page='index.html', day=DAY):
    pg.goto(url(page))
    pg.evaluate("([p, d]) => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); localStorage.setItem('kidsArcade.testDay', d); sessionStorage.setItem('kidsArcade.picked', '1'); }", [TWO, day])
    pg.reload(); pg.wait_for_timeout(300)

def hold(pg, sel, ms, half=False):
    """Hold a button down for ms: an HTML one (a CSS selector) or a canvas one (its attr)."""
    if sel.startswith('['):
        box = pg.locator(sel).bounding_box()
    else:
        it = cm.find(pg, sel); box = {'x': it['x'], 'y': it['y'], 'width': it['w'], 'height': it['h']}
    pg.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)
    pg.mouse.down(); pg.wait_for_timeout(ms)
    if half:
        h = pg.evaluate('ArcadeMenus.holding || 0')
        check(0.3 < h < 0.7, f'the hold button fills up while held ({h:.2f} after {ms} ms)')
    pg.mouse.up(); pg.wait_for_timeout(250)

kids = lambda pg: [i['attr'] for i in cm.items(pg) if i['attr'].startswith('kid-')]

PS = lambda pg: pg.evaluate("Arcade.parent.load()")

with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1280, 'height': 800})
    pg.on('pageerror', lambda e: errors.append(str(e)))

    # ---- the door on the hub ----
    fresh(pg)
    # (Nov 21: the hub is drawn by Phaser; its Grown-ups button opens the Parent corner's door, the hold button)
    cm.wait_screen(pg, 'hub')
    check(cm.find(pg, 'grownups') is not None, 'hub: a Grown-ups button')
    pg.screenshot(path=str(OUT / 'parent_hub_button.png'))
    cm.click(pg, '[data-grownups]'); pg.wait_for_url('**/parent/index.html', timeout=5000)
    # (Nov 21: the Parent corner is drawn by Phaser too: the door is screen 'parent-door' with ONE hold button)
    cm.wait_screen(pg, 'parent-door')
    check([i['attr'] for i in cm.items(pg)] == ['hold', 'home'], 'it opens the door: only a hold button (+ home)')
    cm.tap(pg, 'hold'); pg.wait_for_timeout(300)
    check(cm.screen(pg) == 'parent-door', 'a tap on it does nothing')
    hold(pg, 'hold', 1200)
    check(cm.screen(pg) == 'parent-door', 'holding for 1 second does nothing')
    hold(pg, 'hold', 1500, half=True)
    pg.screenshot(path=str(OUT / 'parent_door_holding.png'))
    hold(pg, 'hold', 3300); pg.wait_for_timeout(400)
    check('/parent/' in pg.url and cm.screen(pg) == 'parent' and kids(pg) == ['kid-p1', 'kid-p2'], 'holding for 3 seconds opens the Parent corner (2 kids)')

    # ---- opening the page directly = the door first ----
    pg.evaluate("sessionStorage.removeItem('kidsArcade.parentOK')"); pg.reload(); cm.wait_screen(pg)
    check(cm.screen(pg) == 'parent-door', 'parent/ opened directly: only the hold button')
    hold(pg, 'hold', 3300)
    check(cm.screen(pg) == 'parent' and len(kids(pg)) == 2, 'holding it there opens the page')
    t0 = PS(pg)['time']
    pg.evaluate("for (let i = 0; i < 20; i++) Arcade.parent._tick()")
    check(PS(pg)['time'] == t0, 'time in the Parent corner is not play time')
    # (start the counting checks from zero: the real clock may have ticked once while we held the buttons)
    pg.evaluate("(() => { const d = Arcade.parent.load(); d.time = {}; Arcade.parent.save(d); })()")

    # ---- counting play time ----
    pg.goto(url('rc/index.html')); pg.wait_for_timeout(300)
    check(pg.evaluate("Arcade.parent.where") == 'rc', 'a game page knows which game it is')
    pg.evaluate("for (let i = 0; i < 60; i++) Arcade.parent._tick()")          # 60 ticks x 5 s = 5 minutes
    pg.goto(url('index.html')); pg.wait_for_timeout(300)
    pg.evaluate("for (let i = 0; i < 12; i++) Arcade.parent._tick()")          # 1 minute on the hub
    t = PS(pg)['time']
    check(t.get('p1', {}).get(DAY) == {'rc': 300, 'hub': 60}, f'5 min of RC + 1 min on the hub counted for player 1 ({t})')
    # player 2 plays the maze; and some made-up older days for both
    pg.evaluate("(() => { const p = JSON.parse(localStorage.getItem('kidsArcade.profiles')); p.active = 'p2'; localStorage.setItem('kidsArcade.profiles', JSON.stringify(p)); })()")
    pg.goto(url('maze/index.html')); pg.wait_for_timeout(300)
    pg.evaluate("for (let i = 0; i < 24; i++) Arcade.parent._tick()")
    t = PS(pg)['time']
    check(t['p2'][DAY] == {'maze': 120} and t['p1'][DAY] == {'rc': 300, 'hub': 60}, 'player 2 gets their own count')
    pg.evaluate("""(() => { for (let k = 1; k <= 20; k++) { localStorage.setItem('kidsArcade.testDay', '2026-10-' + String(k).padStart(2, '0')); Arcade.parent.add(600, 'bike', 'p1'); }
        localStorage.setItem('kidsArcade.testDay', '2026-11-14'); Arcade.parent.add(1500, 'jungle', 'p1'); localStorage.setItem('kidsArcade.testDay', '2026-11-15'); Arcade.parent.add(900, 'piano', 'p1');
        localStorage.setItem('kidsArcade.testDay', '2026-11-16'); Arcade.parent.add(5, 'rc', 'p1'); })()""")
    days = sorted(PS(pg)['time']['p1'].keys())
    check(len(days) == 14 and days[-1] == DAY and days[0] == '2026-10-10', f'only the last 14 days are kept ({len(days)}: {days[0]} .. {days[-1]})')

    # ---- the Parent corner shows it ----
    pg.evaluate("(() => { const p = JSON.parse(localStorage.getItem('kidsArcade.profiles')); p.active = 'p1'; localStorage.setItem('kidsArcade.profiles', JSON.stringify(p)); sessionStorage.setItem('kidsArcade.parentOK', '1'); })()")
    pg.goto(url('parent/index.html')); cm.wait_screen(pg, 'parent')
    v1, v2 = pg.evaluate("__parentView('p1')"), pg.evaluate("__parentView('p2')")
    check(v1['tab'] == 'p1' and cm.find(pg, 'kid-p1')['picked'], 'the first kid\'s tab is open')
    check(v1['today'] == '6 min' and v2['today'] == '2 min', 'today: 6 min for Sam, 2 min for Ava')
    check(v1['week'] == '46 min', 'last 7 days: 46 min for Sam (' + v1['week'] + ')')
    check(v1['games'] == ['jungle', 'piano', 'rc', 'hub'], f"games, most played first ({v1['games']})")
    check('6 min today' in v1['text'] and '46 min this week' in v1['text'] and '/ 68' in v1['text'], 'the chips show today, the week and stickers out of 68')
    check('Big kid' in v1['text'], 'the age preset is shown')
    pg.screenshot(path=str(OUT / 'parent_corner.png'))
    cm.tap(pg, 'kid-p2'); pg.wait_for_timeout(300)
    v2 = pg.evaluate("__parentView('p2')")
    check(v2['tab'] == 'p2' and 'Little kid' in v2['text'] and cm.find(pg, 'kid-p2')['picked'], 'Ava\'s tab: Little kid')
    check(pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.profiles')).active") == 'p1', 'looking at the other kid does not switch players')

    # ---- settings (tapped for real: scrolled into sight first) ----
    cm.tap(pg, 'kid-p1'); pg.wait_for_timeout(300)
    cm.tap_shown(pg, 'limit-15'); pg.wait_for_timeout(300)
    check(PS(pg)['limit'] == {'p1': 15} and '9 min left' in pg.evaluate("__parentView('p1')")['text'] and cm.find(pg, 'limit-15') is not None,
          'time limit: 15 minutes for Sam, 9 left today')
    pg.screenshot(path=str(OUT / 'parent_corner_limit.png'))
    cm.tap(pg, 'kid-p2'); pg.wait_for_timeout(300)
    cm.tap_shown(pg, 'music'); pg.wait_for_timeout(300)
    m = pg.evaluate("[JSON.parse(localStorage.getItem('kidsArcade.v1') || '{}'), JSON.parse(localStorage.getItem('kidsArcade.v1.p2') || '{}')].map(s => (s.settings || {}).musicOn)")
    check(m[1] is False and m[0] is not False, f'music off for Ava only ({m})')
    check(cm.find(pg, 'music')['label'] == 'Music: off', 'the button now says Music: off')
    cm.tap(pg, 'device'); pg.wait_for_timeout(300)
    cm.tap_shown(pg, 'mute'); pg.wait_for_timeout(300)
    check(pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.sound')).muted") is True, 'all sound off is saved for the device')
    cm.tap_shown(pg, 'mute'); pg.wait_for_timeout(300)
    cm.tap_shown(pg, 'gfx-fast'); pg.wait_for_timeout(300)
    check(PS(pg)['gfx'] == 'fast' and cm.find(pg, 'gfx-fast')['label'] == 'Always fast', 'drawing quality: Always fast is saved')
    cm.tap_shown(pg, 'gfx-auto'); pg.wait_for_timeout(300)
    pg.screenshot(path=str(OUT / 'parent_corner_device.png'))
    cm.tap(pg, 'help'); pg.wait_for_timeout(300)
    href = urllib.parse.unquote(pg.evaluate('__parentReport()'))
    check(href.startswith('mailto:') and 'Arcade version' in href and 'Browser:' in href and 'Sam' not in href and 'Ava' not in href, 'Report a problem: an email with technical details, no names')
    check(cm.find(pg, 'report') is not None, 'Help: a Report a problem button')
    pg.evaluate("Arcade.parent.add(60, 'rc', 'p1')")
    cm.tap_shown(pg, 'clear'); pg.wait_for_timeout(300)
    check(PS(pg)['time'] != {} and cm.find(pg, 'clear')['label'] == 'Tap again to clear it', 'clearing the history asks for a second tap')
    cm.tap_shown(pg, 'clear'); pg.wait_for_timeout(300)
    check(PS(pg)['time'] == {} and PS(pg)['limit'] == {'p1': 15}, 'the second tap clears the play time (the limit stays)')
    pg.screenshot(path=str(OUT / 'parent_corner_help.png'))
    cm.tap(pg, 'home'); pg.wait_for_url('**/kidsgame/index.html', timeout=5000)
    check(pg.url.endswith('/index.html') and '/parent/' not in pg.url, 'the home button goes back to the hub')
    # (the time-limit part below needs Sam's minutes again)
    pg.evaluate("Arcade.parent.add(365, 'rc', 'p1')")

    # ---- the time limit ----
    pg.goto(url('rc/index.html')); pg.wait_for_timeout(400)
    pg.mouse.click(640, 400); pg.wait_for_timeout(700)
    pg.evaluate("__game.play({ id: 't1' })"); pg.wait_for_timeout(500)
    check(pg.locator('[data-timeup]').count() == 0 and pg.evaluate("__game.state") == 'play', 'under the limit: the game plays')
    pg.evaluate("Arcade.parent.add(9 * 60 - 10); for (let i = 0; i < 3; i++) Arcade.parent._tick()"); pg.wait_for_timeout(200)
    check(pg.locator('[data-timeup]').count() == 1, 'time used up: "All done for today!" covers the game')
    check(pg.evaluate("__game.state") == 'paused', 'the game is paused')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    check(pg.evaluate("__game.state") == 'paused', 'keys do not reach the game behind it')
    before = PS(pg)['time']['p1'][DAY]['rc']
    pg.evaluate("for (let i = 0; i < 5; i++) Arcade.parent._tick()")
    check(PS(pg)['time']['p1'][DAY]['rc'] == before, 'the clock stops while that screen is up')
    pg.screenshot(path=str(OUT / 'parent_timeup.png'))
    pg.click('.pa-home'); pg.wait_for_timeout(500)
    check(pg.locator('[data-timeup]').count() == 1 and pg.url.endswith('index.html'), 'the home button goes to the hub, which is covered too')
    # the other player can still play
    pg.evaluate("(() => { const p = JSON.parse(localStorage.getItem('kidsArcade.profiles')); p.active = 'p2'; localStorage.setItem('kidsArcade.profiles', JSON.stringify(p)); })()")
    pg.reload(); pg.wait_for_timeout(300)
    check(pg.locator('[data-timeup]').count() == 0, 'player 2 (no limit) is not stopped')
    pg.evaluate("(() => { const p = JSON.parse(localStorage.getItem('kidsArcade.profiles')); p.active = 'p1'; localStorage.setItem('kidsArcade.profiles', JSON.stringify(p)); })()")
    pg.reload(); pg.wait_for_timeout(300)
    hold(pg, '[data-timeup] [data-hold]', 1000)
    check(pg.locator('[data-timeup]').count() == 1, 'a short press on "more minutes" does nothing')
    hold(pg, '[data-timeup] [data-hold]', 3300)
    check(pg.locator('[data-timeup]').count() == 0 and pg.evaluate("Arcade.parent.allowed()") == 30, 'a grown-up holds 3 seconds: 15 more minutes')
    pg.evaluate("Arcade.parent.add(15 * 60); Arcade.parent._tick()"); pg.wait_for_timeout(150)
    check(pg.locator('[data-timeup]').count() == 1, 'after those 15 minutes it comes back')
    pg.evaluate("localStorage.setItem('kidsArcade.testDay', '2026-11-17')"); pg.reload(); pg.wait_for_timeout(300)
    check(pg.locator('[data-timeup]').count() == 0 and pg.evaluate("Arcade.parent.allowed()") == 15, 'the next day: play again, back to 15 minutes')

    # ---- bedtime (Nov 22) ----
    T = lambda pg, t: pg.evaluate("t => localStorage.setItem('kidsArcade.testTime', t)", t)
    BED = lambda pg: pg.locator('[data-bedtime]').count()
    pg.evaluate("(() => { const d = Arcade.parent.load(); d.bed.p1 = 1170; Arcade.parent.save(d); })()")   # 7:30 pm
    T(pg, '19:00'); pg.reload(); pg.wait_for_timeout(300)
    check(BED(pg) == 0 and pg.evaluate("Arcade.parent.clock(1170)") == '7:30 pm', 'before bedtime (7 pm, bedtime 7:30 pm): play')
    T(pg, '19:30'); pg.evaluate("Arcade.parent._tick()"); pg.wait_for_timeout(150)
    check(BED(pg) == 1 and pg.locator('[data-timeup]').count() == 0, 'at 7:30 pm "Time for bed!" covers the hub')
    pg.screenshot(path=str(OUT / 'parent_bedtime.png'))
    T(pg, '02:00'); pg.reload(); pg.wait_for_timeout(300)
    check(BED(pg) == 1 and pg.evaluate("Arcade.parent.night()") == '2026-11-16', 'at 2 am it is still bedtime (last night\'s)')
    T(pg, '06:00'); pg.reload(); pg.wait_for_timeout(300)
    check(BED(pg) == 0, 'at 6 am: play again')
    # in a game: the game pauses
    T(pg, '19:00'); pg.goto(url('rc/index.html')); pg.wait_for_timeout(400)
    pg.mouse.click(640, 400); pg.wait_for_timeout(700)
    pg.evaluate("__game.play({ id: 't1' })"); pg.wait_for_timeout(500)
    T(pg, '19:35'); pg.evaluate("Arcade.parent._tick()"); pg.wait_for_timeout(200)
    check(BED(pg) == 1 and pg.evaluate("__game.state") == 'paused', 'bedtime in a race: the game pauses behind "Time for bed!"')
    hold(pg, '[data-bedtime] [data-hold]', 1000)
    check(BED(pg) == 1, 'a short press does nothing')
    T(pg, '19:40'); hold(pg, '[data-bedtime] [data-hold]', 3300)
    check(BED(pg) == 0 and pg.evaluate("Arcade.parent.bedtime()") == 1195, 'a grown-up holds 3 seconds: 15 more minutes from now (bedtime 7:55 pm)')
    T(pg, '19:56'); pg.evaluate("Arcade.parent._tick()"); pg.wait_for_timeout(150)
    check(BED(pg) == 1, 'after those 15 minutes it comes back')
    pg.evaluate("(() => { const p = JSON.parse(localStorage.getItem('kidsArcade.profiles')); p.active = 'p2'; localStorage.setItem('kidsArcade.profiles', JSON.stringify(p)); })()")
    pg.goto(url('index.html')); pg.wait_for_timeout(300)
    check(BED(pg) == 0, 'player 2 (no bedtime) is not stopped')
    pg.evaluate("localStorage.setItem('kidsArcade.testDay', '2026-11-18')"); T(pg, '19:40')
    pg.evaluate("(() => { const p = JSON.parse(localStorage.getItem('kidsArcade.profiles')); p.active = 'p1'; localStorage.setItem('kidsArcade.profiles', JSON.stringify(p)); })()")
    pg.reload(); pg.wait_for_timeout(300)
    check(BED(pg) == 1 and pg.evaluate("Arcade.parent.bedtime()") == 1170, 'the next evening: the extra minutes are gone (7:30 pm again)')
    # the Parent corner: pick a bedtime with the buttons
    T(pg, '18:00'); pg.evaluate("sessionStorage.setItem('kidsArcade.parentOK', '1')")
    pg.goto(url('parent/index.html')); cm.wait_screen(pg, 'parent')
    check(cm.find(pg, 'bed-1170')['picked'] or cm.find(pg, 'bed-1170')['label'] == '7:30 pm', 'Parent corner: a Bedtime row (7:30 pm)')
    cm.tap_shown(pg, 'bed-1200'); pg.wait_for_timeout(300)
    v = pg.evaluate("__parentView('p1')")
    check(PS(pg)['bed'] == {'p1': 1200} and 'Bedtime tonight: 8:00 pm' in v['text'], 'tapping 8 pm sets it (and says so)')
    cm.tap_shown(pg, 'late'); pg.wait_for_timeout(300)
    check(pg.evaluate("Arcade.parent.bedtime('p1')") == 1215 and '15 minutes later than usual' in pg.evaluate("__parentView('p1')")['text'], '"15 more minutes tonight" moves tonight\'s bedtime to 8:15 pm')
    pg.screenshot(path=str(OUT / 'parent_corner_bedtime.png'))
    cm.tap_shown(pg, 'bed-0'); pg.wait_for_timeout(300)
    check('p1' not in PS(pg)['bed'] and cm.find(pg, 'late') is None, 'Off takes the bedtime away')
    pg.evaluate("localStorage.removeItem('kidsArcade.testTime')")

    # ---- drawing quality (a sharp screen: 2 real pixels per dot) ----
    cx = b.new_context(viewport={'width': 1280, 'height': 760}, device_scale_factor=2)
    hd = cx.new_page(); hd.on('pageerror', lambda e: errors.append(str(e)))
    def canvas_ratio(gfx, slow=False):
        fresh(hd, 'bike/index.html')
        hd.evaluate("([g, s]) => { const d = Arcade.parent.load(); d.gfx = g; d.slow = s; Arcade.parent.save(d); }", [gfx, slow])
        hd.reload(); hd.wait_for_timeout(500)
        return hd.evaluate("(() => { const c = document.querySelector('canvas'); return c.width / c.getBoundingClientRect().width; })()")
    r_sharp, r_fast, r_auto, r_slow = canvas_ratio('sharp'), canvas_ratio('fast'), canvas_ratio('auto'), canvas_ratio('auto', True)
    check(abs(r_sharp - 2) < 0.05 and abs(r_auto - 2) < 0.05, f'sharp / automatic: every pixel is drawn ({r_sharp:.2f}, {r_auto:.2f})')
    check(abs(r_fast - 1) < 0.05 and abs(r_slow - 1) < 0.05, f'fast / a device known to be slow: half the pixels each way ({r_fast:.2f}, {r_slow:.2f})')
    check(abs(canvas_ratio('sharp', True) - 2) < 0.05, '"Always sharp" wins even on a slow device')
    # automatic: pretend the frames are slow (the kit's clock only sees the time between frames)
    fresh(hd, 'bike/index.html')
    hd.mouse.click(640, 380); hd.wait_for_timeout(700)
    hd.evaluate("__game.play(null)"); hd.wait_for_timeout(300)
    hd.evaluate("""(() => { const real = window.requestAnimationFrame; let fake = performance.now();
        window.requestAnimationFrame = (fn) => real(() => { fake += 45; fn(fake); }); })()""")
    hd.wait_for_function("__game.lite() >= 1", timeout=20000)
    check(hd.evaluate("Arcade.parent.load().slow") is True, 'automatic: slow frames switch a game to fast, and the device remembers')
    r = hd.evaluate("(() => { const c = document.querySelector('canvas'); return c.width / c.getBoundingClientRect().width; })()")
    check(r <= 1.05, f'...and the game is now drawn with fewer pixels ({r:.2f})')
    hd.screenshot(path=str(OUT / 'parent_lite_bike.png'))
    cx.close()

    # ---- phone ----
    ph = b.new_page(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    ph.on('pageerror', lambda e: errors.append(str(e)))
    fresh(ph)
    ph.evaluate("Arcade.parent.add(1500, 'rc'); Arcade.parent.add(700, 'coloring'); sessionStorage.setItem('kidsArcade.parentOK', '1')")
    ph.goto(url('parent/index.html')); cm.wait_screen(ph, 'parent')
    off = [i['attr'] for i in cm.items(ph) if i['x'] < -1 or i['x'] + i['w'] > 391]
    check(not off and ph.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), f'phone: the Parent corner fits (nothing off the sides: {off})')
    tabs = [i for i in cm.items(ph) if i['attr'] in ('kid-p1', 'kid-p2', 'device', 'help', 'home')]
    check(len(tabs) == 5 and all(i['w'] >= 48 and i['h'] >= 48 for i in tabs), 'phone: tabs + home are big enough to tap')
    ph.screenshot(path=str(OUT / 'parent_phone.png'))
    cm.tap_shown(ph, 'limit-30', touch=True)
    check(ph.evaluate("Arcade.parent.load().limit.p1") == 30, 'phone: a finger sets the time limit')
    ph.evaluate("(() => { const d = Arcade.parent.load(); d.limit = {}; Arcade.parent.save(d); })()")
    ph.evaluate("(() => { const d = Arcade.parent.load(); d.limit.p1 = 15; Arcade.parent.save(d); })()")
    ph.goto(url('index.html')); ph.wait_for_timeout(300)
    box = ph.locator('[data-timeup] [data-hold]').bounding_box()
    check(box is not None and box['y'] + box['height'] <= 844 and box['x'] >= 0 and box['x'] + box['width'] <= 390, 'phone: the "All done" screen fits, with its grown-ups button')
    ph.screenshot(path=str(OUT / 'parent_timeup_phone.png'))
    ls = b.new_page(viewport={'width': 844, 'height': 390}, is_mobile=True, has_touch=True)
    fresh(ls)
    ls.evaluate("(() => { const d = Arcade.parent.load(); d.limit.p1 = 15; Arcade.parent.save(d); Arcade.parent.add(1000); })()")
    ls.reload(); ls.wait_for_timeout(300)
    box = ls.locator('[data-timeup] [data-hold]').bounding_box()
    check(box is not None and box['y'] + box['height'] <= 390, 'phone sideways: it fits too')
    ls.screenshot(path=str(OUT / 'parent_timeup_phone_wide.png'))
    ls.evaluate("(() => { localStorage.setItem('kidsArcade.testTime', '21:00'); const d = Arcade.parent.load(); d.bed.p1 = 1170; Arcade.parent.save(d); })()")
    ls.reload(); ls.wait_for_timeout(300)
    box = ls.locator('[data-bedtime] [data-hold]').bounding_box()
    check(box is not None and box['y'] + box['height'] <= 390, 'phone sideways: "Time for bed!" fits too')
    ls.screenshot(path=str(OUT / 'parent_bedtime_phone_wide.png'))
    ph.evaluate("(() => { localStorage.setItem('kidsArcade.testTime', '21:00'); const d = Arcade.parent.load(); d.bed.p1 = 1170; Arcade.parent.save(d); })()")
    ph.reload(); ph.wait_for_timeout(300)
    box = ph.locator('[data-bedtime] [data-hold]').bounding_box()
    check(box is not None and box['y'] + box['height'] <= 844 and box['x'] >= 0 and box['x'] + box['width'] <= 390, 'phone: "Time for bed!" fits, with its grown-ups button')
    ph.screenshot(path=str(OUT / 'parent_bedtime_phone.png'))
    b.close()

check(not errors, 'no JavaScript errors' + (': ' + '; '.join(errors[:3]) if errors else ''))
print('\n' + ('ALL PASS' if not fails else f'{len(fails)} FAILED'))
raise SystemExit(1 if fails else 0)
