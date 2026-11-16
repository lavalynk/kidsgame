"""Automated test: the Parent corner, play time, the daily time limit and "lite" drawing (Nov 16).

Run:  python3 tests/test_parent.py   (about 1 minute)
Checks:
- the hub has a Grown-ups button: a tap does nothing, holding it for 3 seconds opens the Parent corner
- opening parent/ directly shows the same hold button first (the door)
- play time is counted per player, per game and per day; only 14 days are kept; the Parent corner itself isn't counted
- the Parent corner shows each kid's minutes, games, stickers; the limit, music and sound settings are saved
- a time limit: when today's time is used up the "All done for today!" screen covers the game (and the hub),
  the game is paused, keys don't reach it; the other player isn't affected; a new day clears it;
  holding the grown-ups button gives 15 more minutes
- "Report a problem" is an email link with technical details only (no names)
- drawing quality: "Always fast" draws the game with fewer pixels, "Always sharp" with all of them;
  on Automatic the kit switches to fast by itself when frames are slow, and remembers it
Screenshots land in tests/out/.
"""
import json, pathlib, urllib.parse
from playwright.sync_api import sync_playwright
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

def hold(pg, sel, ms):
    box = pg.locator(sel).bounding_box()
    pg.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)
    pg.mouse.down(); pg.wait_for_timeout(ms); pg.mouse.up(); pg.wait_for_timeout(250)

PS = lambda pg: pg.evaluate("Arcade.parent.load()")

with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1280, 'height': 800})
    pg.on('pageerror', lambda e: errors.append(str(e)))

    # ---- the door on the hub ----
    fresh(pg)
    btn = '#grownups [data-hold]'
    check(pg.locator(btn).count() == 1, 'hub: a Grown-ups hold button')
    pg.locator(btn).scroll_into_view_if_needed()
    pg.screenshot(path=str(OUT / 'parent_hub_button.png'))
    pg.click(btn); pg.wait_for_timeout(300)
    check('parent' not in pg.url, 'a tap on it does nothing')
    hold(pg, btn, 1200)
    check('parent' not in pg.url, 'holding for 1 second does nothing')
    hold(pg, btn, 3300); pg.wait_for_timeout(400)
    check('/parent/' in pg.url and pg.locator('[data-kid]').count() == 2, 'holding for 3 seconds opens the Parent corner (2 kids)')

    # ---- opening the page directly = the door first ----
    pg.evaluate("sessionStorage.removeItem('kidsArcade.parentOK')"); pg.reload(); pg.wait_for_timeout(300)
    check(pg.locator('[data-door]').count() == 1 and pg.locator('[data-kid]').count() == 0, 'parent/ opened directly: only the hold button')
    hold(pg, '[data-door] [data-hold]', 3300)
    check(pg.locator('[data-kid]').count() == 2, 'holding it there opens the page')
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
    pg.goto(url('parent/index.html')); pg.wait_for_timeout(300)
    k1, k2 = pg.locator('[data-kid=p1]'), pg.locator('[data-kid=p2]')
    check(k1.locator('[data-today]').inner_text() == '6 min' and k2.locator('[data-today]').inner_text() == '2 min', 'today: 6 min for Sam, 2 min for Ava')
    check(k1.locator('[data-week]').inner_text() == '46 min', 'last 7 days: 46 min for Sam (' + k1.locator('[data-week]').inner_text() + ')')
    games = k1.locator('[data-game]').evaluate_all("els => els.map(e => e.dataset.game)")
    check(games == ['jungle', 'piano', 'rc', 'hub'], f'games, most played first ({games})')
    check('Jungle Jump' in k1.inner_text() and 'Maze Explorer' in k2.inner_text() and 'Little kid' in k2.inner_text(), 'game names + the age preset are shown')
    check(k1.locator('[data-stickers]').inner_text().endswith('/ 68'), 'stickers out of 68')
    check(pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.profiles')).active") == 'p1', 'looking at the other kid does not switch players')
    pg.screenshot(path=str(OUT / 'parent_corner.png'), full_page=True)

    # ---- settings ----
    k1.locator('[data-limit]').select_option('15'); pg.wait_for_timeout(150)
    check(PS(pg)['limit'] == {'p1': 15} and '9 min left' in pg.locator('[data-left=p1]').inner_text(), 'time limit: 15 minutes for Sam, 9 left today')
    pg.click('[data-music=p2]'); pg.wait_for_timeout(150)
    m = pg.evaluate("[JSON.parse(localStorage.getItem('kidsArcade.v1') || '{}'), JSON.parse(localStorage.getItem('kidsArcade.v1.p2') || '{}')].map(s => (s.settings || {}).musicOn)")
    check(m[1] is False and m[0] is not False, f'music off for Ava only ({m})')
    pg.click('[data-mute]'); pg.wait_for_timeout(150)
    check(pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.sound')).muted") is True, 'all sound off is saved for the device')
    pg.click('[data-mute]')
    href = urllib.parse.unquote(pg.locator('[data-report]').get_attribute('href'))
    check(href.startswith('mailto:') and 'Arcade version' in href and 'Browser:' in href and 'Sam' not in href and 'Ava' not in href, 'Report a problem: an email with technical details, no names')

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
    ph.goto(url('parent/index.html')); ph.wait_for_timeout(300)
    wide = ph.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
    check(wide, 'phone: the Parent corner fits (no sideways scrolling)')
    ph.screenshot(path=str(OUT / 'parent_phone.png'), full_page=True)
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
    b.close()

check(not errors, 'no JavaScript errors' + (': ' + '; '.join(errors[:3]) if errors else ''))
print('\n' + ('ALL PASS' if not fails else f'{len(fails)} FAILED'))
raise SystemExit(1 if fails else 0)
