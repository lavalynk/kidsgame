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
    use_day(day_for('win:rc::')); pg.reload(); pg.wait_for_timeout(400)
    hs = pg.evaluate('__hubState().daily')
    check(hs and hs['ch']['game'] == 'rc' and not hs['done'], f"hub: today's surprise is 'win in RC' ({hs and hs['key']})")
    check(pg.locator('#daily .gift svg').count() == 1 and pg.locator('#daily .gm').count() == 1, 'hub: a present + the game picture')
    check(pg.locator('#daily [data-go=rc]').count() == 1, 'hub: a Play button that goes to the game')
    box = pg.locator('#daily [data-go]').bounding_box()
    check(box['width'] >= 70 and box['height'] >= 70, f"hub: Play button is big ({box['width']:.0f}px)")
    pg.screenshot(path=str(OUT / 'daily-hub.png'))
    pg.locator('#daily [data-say]').click()      # (reads it aloud; must not throw)

    # ---- really play: RC Free Drive (win) ----
    pg.goto((ROOT / 'rc' / 'index.html').as_uri()); pg.wait_for_timeout(1200)
    check('Surprise' in (pg.locator('.ar-toast').inner_text() if pg.locator('.ar-toast').count() else ''), 'RC: a "Surprise!" present pops up (today\'s surprise is here)')
    pg.mouse.click(640, 380); pg.wait_for_timeout(700)
    pg.click('[data-menu=free]'); pg.wait_for_timeout(300)
    pg.click('[data-kind=drive]'); pg.wait_for_timeout(200)
    pg.locator('[data-track]').first.click()
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

    pg.goto(HUB); pg.wait_for_timeout(400)
    hs = pg.evaluate('__hubState().daily')
    check(hs['done'] and pg.locator('#daily.done .tick').count() == 1 and pg.locator('#daily [data-go]').count() == 0, 'hub: the present is open, with a tick')
    coins = pg.locator('#house .bub').inner_text().strip()
    check(coins.endswith('5'), f"hub: house coins 3 + 2 = 5 ({coins})")
    pg.screenshot(path=str(OUT / 'daily-hub-done.png'))
    # playing more today gives nothing extra
    pg.evaluate("Arcade.daily.report('rc', { win: true })")
    check(pg.evaluate("Arcade.store.load().houseBonus") == 2, 'only one surprise a day')

    # ---- counting: catch 6 fish ----
    use_day(day_for('count:fishing:fish:6')); pg.reload(); pg.wait_for_timeout(300)
    hs = pg.evaluate('__hubState().daily')
    check(not hs['done'] and hs['total'] == 1 and hs['n'] == 0, f"new day: a new surprise, total kept ({hs['key']}, total {hs['total']})")
    pg.evaluate("for (let i = 0; i < 3; i++) Arcade.daily.add('fishing', 'fish', 1); Arcade.daily.add('bike', 'coins', 5)")
    pg.reload(); pg.wait_for_timeout(300)
    check(pg.locator('#daily .num').inner_text().replace(' ', '') == '3/6', f"hub: 3 / 6 fish ({pg.locator('#daily .num').inner_text()})")
    check(pg.locator('#daily .bar').count() == 1, 'hub: a progress bar')
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
        pg.set_viewport_size(vp); pg.reload(); pg.wait_for_timeout(400)
        bx = pg.locator('#daily').bounding_box()
        kids = pg.evaluate('''[...document.querySelectorAll('#daily > *')].map(e => { const r = e.getBoundingClientRect(); return [r.left, r.right]; })''')
        inside = all(l >= bx['x'] - 1 and r <= bx['x'] + bx['width'] + 1 for l, r in kids)
        scroll = pg.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
        check(inside and not scroll, f"{name}: the surprise box fits (no sideways scrolling)")
        pg.screenshot(path=str(OUT / f'daily-hub-{name}.png'))
    pg.set_viewport_size({'width': 1280, 'height': 800})

    # ---- the sticker book: the Surprise page ----
    pg.goto((ROOT / 'stickers' / 'index.html').as_uri()); pg.wait_for_timeout(500)
    st = pg.evaluate('__bookState()')
    check(st['pages'] == 14 and st['total'] == 60, f"book: 14 pages, 60 stickers ({st})")
    check(pg.locator('.page.wide .slot').count() == 8 and pg.locator('.page.wide .slot:not(.locked)').count() == 5, 'book: the Surprise page, 5 of 8 earned')
    pg.locator('.page.wide').scroll_into_view_if_needed()
    pg.screenshot(path=str(OUT / 'daily-book.png'), full_page=True)
    pg.click('[data-sticker="surprise-7"]'); pg.wait_for_timeout(300)
    check(pg.locator('#card a.go').count() == 0 and pg.locator('#card .num').inner_text() == '8', 'book: a locked Surprise sticker shows its number, no Play button')
    pg.screenshot(path=str(OUT / 'daily-book-zoom.png'))
    pg.click('#close'); pg.click('[data-sticker="surprise-1"]'); pg.wait_for_timeout(300)
    check('Cupcake' in pg.locator('#card').inner_text(), 'book: the Cupcake sticker, big')
    pg.screenshot(path=str(OUT / 'daily-book-cupcake.png'))

    b.close()

check(not errors, f'no JavaScript errors ({errors[:3]})')
print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
