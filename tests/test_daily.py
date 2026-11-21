"""Automated test: the Daily Surprise (arcade/daily.js).

Run:  python3 tests/test_daily.py
Checks:
  * every challenge has a picture and words; the same game never comes two days in a row
  * the hub shows today's surprise (present, game, goal, Play), at desktop and phone sizes
  * really playing (RC Free Drive) finishes a "win in RC" surprise: 2 house coins + the 1st Surprise sticker
  * counting (fish), "3 stars", "play 3 games" and little-kid challenges work; a new day = a new surprise
  * a game whose surprise it is says "Surprise!" when it opens; the sticker book has the Surprise page
Uses localStorage 'kidsArcade.testDay' to pretend it's a certain day.
Screenshots land in tests/out/.
"""
import sys, pathlib
from playwright.sync_api import sync_playwright
import cmenu as cm
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
HUB = (ROOT / 'index.html').as_uri()

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 800})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(HUB); pg.evaluate('localStorage.clear()'); pg.reload(); pg.wait_for_timeout(400)

    # ---- the list of challenges ----
    info = pg.evaluate('''(() => {
      const D = Arcade.daily, bad = [];
      for (const c of D._all) { if (!D.pic(c) || /undefined/.test(D.words(c))) bad.push(D._key(c)); }
      // 120 days in a row, for big and little kids: never the same game twice in a row
      const rep = [];
      for (const little of [false, true]) {
        let prev = null;
        for (let i = 0; i < 120; i++) {
          const d = new Date(2026, 10, 1 + i), c = D._pick(D._day(d), little);
          const g = c.game || c.kind;
          if (g === prev) rep.push(D._day(d) + (little ? ' little' : ' big'));
          prev = g;
        }
      }
      return { n: D._all.length, bad, rep };
    })()''')
    check(not info['bad'], f"all {info['n']} challenges have a picture and words ({info['bad']})")
    check(not info['rep'], f"never the same game two days in a row ({info['rep'][:5]})")

    # find a day whose (big kid) surprise is a given challenge
    def day_for(key, little=False):
        return pg.evaluate('''([k, l]) => { const D = Arcade.daily;
          for (let i = 0; i < 400; i++) { const s = D._day(new Date(2027, 0, 1 + i)); if (D._key(D._pick(s, l)) === k) return s; } return null; }''', [key, little])
    def use_day(day):
        pg.evaluate('d => localStorage.setItem("kidsArcade.testDay", d)', day)

    # ---- the hub card ----
    use_day(day_for('win:rc::')); pg.reload(); cm.wait_screen(pg, 'hub')     # (Nov 21: the hub is drawn by Phaser)
    hs = pg.evaluate('__hubState().daily')
    check(hs and hs['ch']['game'] == 'rc' and not hs['done'], f"hub: today's surprise is 'win in RC' ({hs and hs['key']})")
    pic = pg.evaluate('__hubDailyPic()')
    check('M24 15 C16 3 8 9 16 15' in pic and 'hubclip' in pic, 'hub: a present (its bow) + the game picture')
    check(cm.find(pg, 'daily') is not None and cm.find(pg, 'go-rc') is not None, 'hub: a Play button that goes to the game')
    box = cm.find(pg, 'go-rc')
    check(box['w'] >= 70 and box['h'] >= 70, f"hub: Play button is big ({box['w']:.0f}px)")
    pg.screenshot(path=str(OUT / 'daily-hub.png'))
    cm.tap(pg, 'daily')      # (reads it aloud; must not throw)

    # ---- really play: RC Free Drive (win) ----
    pg.goto((ROOT / 'rc' / 'index.html').as_uri()); pg.wait_for_timeout(1200)
    check('Surprise' in (pg.locator('.ar-toast').inner_text() if pg.locator('.ar-toast').count() else ''), 'RC: a "Surprise!" present pops up (today\'s surprise is here)')
    pg.mouse.click(640, 380); pg.wait_for_timeout(700)
    cm.click(pg, '[data-menu=free]'); pg.wait_for_timeout(300)
    cm.click(pg, '[data-kind=drive]'); pg.wait_for_timeout(200)
    cm.click(pg, '[data-track]')
    pg.wait_for_function('typeof __rcStep === "function" && __rcState().track')
    pg.evaluate('''(() => { __rcStep(3.4); const p = __rcCars().find(c => c.isPlayer);
      for (const s of __rcStars()) { p.x = s.x; p.y = s.y; p.vx = p.vy = 0; __rcStep(0.02); } __rcStep(3); })()''')
    pg.wait_for_timeout(500)
    d = pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.v1'))")
    check(d['daily']['done'] and d['daily']['total'] == 1, f"RC: winning finished the surprise ({d['daily']})")
    check(d.get('houseBonus') == 2, f"RC: +2 house coins ({d.get('houseBonus')})")
    check('Surprise' in pg.locator('.ar-toast').inner_text(), 'RC: a "Surprise! +2" toast')
    pg.screenshot(path=str(OUT / 'daily-done-toast.png'))
    pg.wait_for_timeout(2400)
    d = pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.v1'))")
    check('surprise-0' in d['stickers']['have'], 'RC: the first Surprise sticker (Present)')

    pg.goto(HUB); cm.wait_screen(pg, 'hub')
    hs = pg.evaluate('__hubState().daily')
    pic = pg.evaluate('__hubDailyPic()')
    check(hs['done'] and 'M13 25 L21 33 L35 16' in pic and not cm.attrs(pg, 'go-'), 'hub: the present is open, with a tick')
    coins = pg.evaluate('__hubState().coins')
    check(coins == 5, f"hub: house coins 3 + 2 = 5 ({coins})")
    pg.screenshot(path=str(OUT / 'daily-hub-done.png'))
    # playing more today gives nothing extra
    pg.evaluate("Arcade.daily.report('rc', { win: true })")
    check(pg.evaluate("Arcade.store.load().houseBonus") == 2, 'only one surprise a day')

    # ---- counting: catch 6 fish ----
    use_day(day_for('count:fishing:fish:6')); pg.reload(); pg.wait_for_timeout(300)
    hs = pg.evaluate('__hubState().daily')
    check(not hs['done'] and hs['total'] == 1 and hs['n'] == 0, f"new day: a new surprise, total kept ({hs['key']}, total {hs['total']})")
    pg.evaluate("for (let i = 0; i < 3; i++) Arcade.daily.add('fishing', 'fish', 1); Arcade.daily.add('bike', 'coins', 5)")
    pg.reload(); cm.wait_screen(pg, 'hub')
    pic = pg.evaluate('__hubDailyPic()')
    check('>3 / 6</text>' in pic, "hub: 3 / 6 fish")
    check('width="114" height="20"' in pic, 'hub: a progress bar')
    pg.screenshot(path=str(OUT / 'daily-hub-count.png'))
    pg.evaluate("for (let i = 0; i < 3; i++) Arcade.daily.add('fishing', 'fish', 1)")
    check(pg.evaluate('Arcade.daily.today().done'), '6 fish: done')

    # ---- 3 stars ----
    use_day(day_for('stars:piano::3')); pg.reload(); pg.wait_for_timeout(300)
    pg.evaluate("Arcade.daily.report('piano', { win: true, stars: 2 })")
    check(not pg.evaluate('Arcade.daily.today().done'), '2 stars is not enough')
    pg.evaluate("Arcade.daily.report('piano', { win: true, stars: 3 })")
    check(pg.evaluate('Arcade.daily.today().done'), '3 stars: done')

    # ---- play 3 different games ----
    use_day(day_for('games:::3')); pg.reload(); pg.wait_for_timeout(300)
    pg.evaluate("Arcade.daily.report('hoops', {}); Arcade.daily.report('hoops', {}); Arcade.daily.report('maze', { win: true })")
    check(pg.evaluate('Arcade.daily.today().n') == 2 and not pg.evaluate('Arcade.daily.today().done'), '2 different games so far')
    pg.evaluate("Arcade.daily.report('coloring', { win: true })")
    check(pg.evaluate('Arcade.daily.today().done'), '3 different games: done')
    check(pg.evaluate("Arcade.store.load().houseBonus") == 8 and pg.evaluate("Arcade.store.load().daily.total") == 4, '4 surprises = 8 coins')

    # ---- little kids: gentle challenges ----
    day = day_for('play:space::', True)
    use_day(day)
    pg.evaluate("Arcade.profiles.update(Arcade.profiles.active().id, { age: 'little' }); const d = Arcade.store.load(); d.daily.day = ''; Arcade.store.save()")
    pg.reload(); pg.wait_for_timeout(300)
    hs = pg.evaluate('__hubState().daily')
    check(hs['ch']['kind'] == 'play' and hs['ch']['game'] == 'space', f"little kid: just 'play Space Defender' ({hs['key']})")
    pg.evaluate("Arcade.daily.report('space', { win: false })")
    check(pg.evaluate('Arcade.daily.today().done'), 'little kid: playing (even without winning) finishes it')

    # ---- phone sizes ----
    use_day(day_for('count:bike:coins:30')); pg.evaluate("Arcade.profiles.update(Arcade.profiles.active().id, { age: 'big' })")
    for name, vp in [('phone', {'width': 390, 'height': 844}), ('phone-wide', {'width': 844, 'height': 390}), ('tablet', {'width': 820, 'height': 1180})]:
        pg.set_viewport_size(vp); pg.reload(); cm.wait_screen(pg, 'hub')
        kids = [i for i in cm.items(pg) if i['attr'] == 'daily' or i['attr'].startswith('go-')]
        inside = len(kids) == 2 and all(i['x'] >= 0 and i['x'] + i['w'] <= vp['width'] for i in kids)
        scroll = pg.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
        check(inside and not scroll, f"{name}: the surprise box fits (no sideways scrolling)")
        pg.screenshot(path=str(OUT / f'daily-hub-{name}.png'))
    pg.set_viewport_size({'width': 1280, 'height': 800})

    # ---- the sticker book: the Surprise page ----
    pg.goto((ROOT / 'stickers' / 'index.html').as_uri()); cm.wait_screen(pg, 'stickers-book')   # (Nov 21: drawn by Phaser)
    st = pg.evaluate('__bookState()')
    check(st['pages'] == 16 and st['total'] == 68, f"book: 16 pages, 68 stickers ({st})")
    pg.evaluate('__bookShow("surprise-0")'); cm.wait_screen(pg, 'stickers-book')
    slots = [i for i in cm.items(pg) if i['attr'].startswith('sticker-surprise-')]
    have = [i for i in slots if pg.evaluate(f"Arcade.stickers.has('{i['attr'][8:]}')")]
    check(len(slots) == 8 and len(have) == 5 and all(i['shown'] for i in slots), f'book: the Surprise page, 5 of 8 earned ({len(slots)}, {len(have)})')
    pg.screenshot(path=str(OUT / 'daily-book.png'))
    words = lambda: [r.get('text') for r in pg.evaluate("ArcadeMenus.current().rows") if r.get('t') == 'text']
    cm.tap(pg, 'sticker-surprise-7'); cm.wait_screen(pg, 'stickers-one')
    check(cm.find(pg, 'play') is None and '8' in words(), f'book: a locked Surprise sticker shows its number, no Play button ({words()})')
    pg.screenshot(path=str(OUT / 'daily-book-zoom.png'))
    cm.tap(pg, 'close'); cm.wait_screen(pg, 'stickers-book')
    cm.tap(pg, 'sticker-surprise-1'); cm.wait_screen(pg, 'stickers-one')
    check('Cupcake' in words(), f'book: the Cupcake sticker, big ({words()})')
    pg.screenshot(path=str(OUT / 'daily-book-cupcake.png'))

    b.close()

check(not errors, f'no JavaScript errors ({errors[:3]})')
print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
