"""Winter Wonderland, part 1 (Nov 28, 20-point plan #6): the winter presents on the Star Road.

In winter (Dec, Jan, Feb: Arcade.season()) every game gives each player its winter looks after a round, no stars needed:
the Woolly hat, the Snowflake trail and the Frosty paint (only the kinds that game shows). Once you have them you keep them.

Checks:
  * Arcade.season() works on every game page now (it moved from mascot.js to shared.js); the hub still has it
  * outside winter (a pretend autumn day): no presents after a round, the Looks screen has the 4 + 4 Star Road looks only
  * in winter: finishing a round gives the presents, the big "New!" screen shows them (blue banner), "Wear it!" puts them on
  * the Looks screen in winter before a round: the presents are there to unwrap (a snowflake mark), a tap = yours + worn;
    5 tiles still fit on one line, nothing off the screen (computer + upright phone)
  * a present stays yours when winter is over; the Star Road (roadOf / road()) never changes
  * the Snowflake trail really comes out while playing (Jungle Jump), the woolly hat is drawn (it's a real picture)
  * Turbo Bike gets all three (hat, Frosty paint, snowflakes); Hoop Heroes only the snowflakes; Frosty glides between its colors
  * the Sticker Book's Looks page + My House's Looks screen show the presents you have
  * the "Show me" demo never hands presents out; no JavaScript errors
Screenshots: tests/out/winter/.   Run: python3 tests/test_winter_looks.py
"""
import sys, json, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu as cm
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out' / 'winter'; OUT.mkdir(parents=True, exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

WINTER, AUTUMN = '2026-12-14', '2026-10-14'

def open_page(b, page, day, save=None, vp=(1280, 720), mobile=False):
    ctx = b.new_context(viewport={'width': vp[0], 'height': vp[1]}, has_touch=mobile, is_mobile=mobile)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(f'{page}: {e}'))
    pg.goto((ROOT / page / 'index.html').as_uri() if page else (ROOT / 'index.html').as_uri())
    pg.evaluate('localStorage.clear()')
    pg.evaluate("localStorage.setItem('kidsArcade.testLooks', '1')")
    pg.evaluate(f"localStorage.setItem('kidsArcade.testDay', '{day}')")
    if save is not None:
        pg.evaluate(f"localStorage.setItem('kidsArcade.v1', JSON.stringify({json.dumps(save)}))")
    pg.reload(); pg.wait_for_timeout(500)
    return pg

def looks(pg):
    return pg.evaluate('JSON.parse(JSON.stringify(__game.save.looks || null))')

JSAVE = {'games': {'jungle': {'levels': {'w1a': {'stars': 3, 'done': True}, 'w1b': {'stars': 2, 'done': True}}}}}

with sync_playwright() as pw:
    b = pw.chromium.launch()

    # ---- 1. outside winter: nothing changes ----
    pg = open_page(b, 'jungle', AUTUMN, JSAVE)
    check(pg.evaluate("Arcade.season()") == 'autumn' and not pg.evaluate("Arcade.looks.winterNow()"), 'autumn day: Arcade.season() works in a game, not winter')
    road = pg.evaluate('__game.looks.road().map(r => r.id)')
    check(len(road) == 8 and 'woolly' not in road and 'snowflakes' not in road, f'the Star Road itself never has the presents ({road})')
    cm.to_title(pg)
    pg.evaluate("__game.finish({ win: true, stars: 1, score: 10 })")
    pg.wait_for_timeout(1500)
    got = looks(pg)['got']
    check('woolly' not in got and 'snowflakes' not in got, f'autumn: no presents after a round ({got})')
    pg.evaluate('__game.menu()'); cm.wait_screen(pg, 'title'); cm.tap(pg, 'looks'); cm.wait_screen(pg, 'looks')
    tiles = [i['attr'] for i in cm.items(pg) if i['attr'].startswith('look-')]
    check(len(tiles) == 8, f'autumn: the Looks screen has the 8 Star Road looks ({len(tiles)})')
    pg.close()

    # ---- 2. winter: a round gives the presents, the big "New!" screen ----
    pg = open_page(b, 'jungle', WINTER, JSAVE)
    check(pg.evaluate("Arcade.season()") == 'winter' and pg.evaluate("Arcade.looks.winterNow()"), 'winter day: it is winter')
    check(pg.evaluate("!__game.save.looks.got.includes('woolly')"), 'winter: no present before playing a round')
    cm.to_title(pg)
    pg.evaluate("__game.finish({ win: true, stars: 1, score: 10 })")
    cm.wait_screen(pg, 'newlook')
    words = pg.evaluate("ArcadeMenus.texts().map(t => t.text)")
    check('Winter presents!' in words, f'winter: the "New!" screen shows a present ({[w for w in words if "!" in w]})')
    pg.screenshot(path=str(OUT / 'jungle-new.png'))
    cm.tap(pg, 'wear')
    cm.wait_screen(pg, 'results')
    L = looks(pg)
    check('woolly' in L['got'] and 'snowflakes' in L['got'] and L['hat'] == 'woolly' and L['trail'] == 'snowflakes',
          f'winter: "Wear it!" puts on the woolly hat + the snowflakes ({L["hat"]}, {L["trail"]})')
    # playing: the snowflakes come out, the hat is drawn
    pg.evaluate('__game.menu()'); cm.wait_screen(pg, 'title')
    cm.tap(pg, 'start'); cm.into_game(pg); pg.wait_for_timeout(500)
    pg.keyboard.down('ArrowRight'); pg.wait_for_timeout(1500); pg.keyboard.up('ArrowRight')
    info = pg.evaluate('__game.looks.info()')
    check(info['trails'] >= 8 and info['hat'] == 'woolly' and info['trail'] == 'snowflakes', f'jungle: running lets snowflakes out, the woolly hat is on ({info})')
    pg.screenshot(path=str(OUT / 'jungle-play.png'))
    hat = pg.evaluate("""(async () => {
      const im = Arcade.looks.hatImg('woolly'); if (!im.complete) await new Promise(r => im.onload = r);
      const c = document.createElement('canvas'); c.width = c.height = 100; const x = c.getContext('2d');
      Arcade.looks.drawHat(x, 'woolly', 50, 80, 60);
      const d = x.getImageData(0, 0, 100, 100).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 100) n++; return n; })()""")
    check(hat > 1200, f'the woolly hat draws as a real picture ({hat} pixels)')
    # the "Show me" demo never hands anything out
    pg.evaluate("__game.save.looks.got = __game.save.looks.got.filter(id => !['woolly', 'snowflakes'].includes(id)); Arcade.demoOn = true")
    fresh = pg.evaluate("__game.looks.check(true).length")
    pg.evaluate("Arcade.demoOn = false")
    check(fresh == 0, 'the demo never gives presents')
    pg.close()

    # ---- 3. the Looks screen in winter before a round: unwrap a present ----
    for name, vp, mobile in [('computer', (1280, 720), False), ('phone', (390, 844), True)]:
        pg = open_page(b, 'jungle', WINTER, JSAVE, vp, mobile)
        cm.to_title(pg); cm.tap(pg, 'looks'); cm.wait_screen(pg, 'looks')
        tiles = {i['attr']: i for i in cm.items(pg) if i['attr'].startswith('look-')}
        check(len(tiles) == 10 and 'look-woolly' in tiles and 'look-snowflakes' in tiles, f'{name}: winter Looks screen = 8 + 2 presents ({len(tiles)})')
        vw = pg.viewport_size
        inside = all(t['x'] >= 0 and t['y'] >= 0 and t['x'] + t['w'] <= vw['width'] + 1 and t['y'] + t['h'] <= vw['height'] + 1 for t in tiles.values() if t['shown'])
        check(inside, f'{name}: nothing off the screen')
        if name == 'computer':
            ys = {round(tiles[a]['y']) for a in tiles if a in ('look-party', 'look-flowers', 'look-crown', 'look-wizard', 'look-woolly')}
            check(len(ys) == 1 and all(t['shown'] for t in tiles.values()), f'computer: 5 hats on one line, every look in sight ({ys})')
        check(not tiles['look-woolly']['locked'] and tiles['look-woolly']['badge'], f'{name}: the woolly hat waits to be unwrapped (a snowflake mark)')
        pg.screenshot(path=str(OUT / f'looks-{name}.png'))
        cm.tap_shown(pg, 'look-woolly')
        L = looks(pg)
        check('woolly' in L['got'] and L['hat'] == 'woolly', f'{name}: a tap = the woolly hat is yours + on')
        check(cm.find(pg, 'look-woolly')['picked'], f'{name}: then it shows as worn (yellow)')
        pg.close()

    # ---- 4. after winter: you keep them ----
    keep = {'games': {'jungle': {'levels': JSAVE['games']['jungle']['levels'],
                                 'looks': {'best': 5, 'got': ['party', 'sparkles', 'woolly'], 'fresh': [], 'hat': 'woolly', 'trail': None}}}}
    pg = open_page(b, 'jungle', AUTUMN, keep)
    cm.to_title(pg); cm.tap(pg, 'looks'); cm.wait_screen(pg, 'looks')
    tiles = [i['attr'] for i in cm.items(pg) if i['attr'].startswith('look-')]
    check('look-woolly' in tiles and 'look-snowflakes' not in tiles and len(tiles) == 9, f'after winter: the woolly hat stays, the snowflakes (never got) are gone ({len(tiles)})')
    check(pg.evaluate("__game.looks.hat") == 'woolly', 'after winter: still wearing it')
    pg.close()

    # ---- 5. Turbo Bike: all three; Hoop Heroes: only the snowflakes ----
    pg = open_page(b, 'bike', WINTER, {'games': {'bike': {'levels': {'t1': {'stars': 3, 'done': True}}}}})
    cm.to_title(pg)
    pg.evaluate("__game.finish({ win: true, stars: 1, score: 10 })")
    cm.wait_screen(pg, 'newlook'); cm.tap(pg, 'wear'); cm.wait_screen(pg, 'results')
    L = looks(pg)
    check(all(i in L['got'] for i in ['woolly', 'frost', 'snowflakes']) and L['color'] == 'frost', f'bike: woolly hat + Frosty paint + snowflakes ({L["got"]})')
    fr = pg.evaluate("[0, 0.8, 1.6, 2.4].map(t => Arcade.looks.colorAt('frost', t))")
    check(len(set(fr)) >= 3 and fr[0] == '#90e0ef', f'Frosty glides between its colors ({fr})')
    pg.evaluate('__game.menu()'); cm.wait_screen(pg, 'title'); cm.tap(pg, 'looks'); cm.wait_screen(pg, 'looks')
    pg.screenshot(path=str(OUT / 'bike-looks.png'))
    tiles = {i['attr']: i for i in cm.items(pg) if i['attr'].startswith('look-')}
    vw = pg.viewport_size
    check(len(tiles) == 15 and all(t['x'] + t['w'] <= vw['width'] + 1 for t in tiles.values()), f'bike: 12 + 3 looks, nothing off the side ({len(tiles)})')
    pg.close()
    pg = open_page(b, 'hoops', WINTER, {'games': {'hoops': {'levels': {}}}})
    cm.to_title(pg)
    pg.evaluate("__game.finish({ win: true, stars: 1, score: 10 })")
    cm.wait_screen(pg, 'newlook'); cm.tap(pg, 'ok'); cm.wait_screen(pg, 'results')
    got = looks(pg)['got']
    check('snowflakes' in got and 'woolly' not in got and 'frost' not in got, f'hoops: only the snowflake trail (no hats there) ({got})')
    pg.close()

    # ---- 6. outside the games: the Sticker Book + My House ----
    rich = {'games': {'jungle': {'levels': {}, 'looks': {'best': 5, 'got': ['party', 'woolly', 'snowflakes'], 'fresh': [], 'hat': None, 'trail': None}}}}
    pg = open_page(b, 'stickers', AUTUMN, rich)
    pg.wait_for_function("typeof __bookLooks === 'function'", timeout=8000)
    pg.evaluate("__bookLooks().open()"); cm.wait_screen(pg, 'stickers-looks')
    attrs = [i['attr'] for i in cm.items(pg)]
    check('look-jungle-woolly' in attrs and 'look-jungle-snowflakes' in attrs and 'look-bike-woolly' not in attrs,
          'sticker book: the presents you have show on their game\'s page (and not where you have none, out of winter)')
    pg.screenshot(path=str(OUT / 'book-looks.png'))
    pg.close()
    pg = open_page(b, 'house', AUTUMN, rich)
    pg.wait_for_timeout(800)
    cm.wait_screen(pg, 'house'); cm.tap(pg, 'looks'); cm.wait_screen(pg, 'house-looks')
    items = {i['attr']: i for i in cm.items(pg)}
    check('hat-woolly' in items and not items['hat-woolly']['locked'] and 'trail-snowflakes' in items, 'my house: the woolly hat + snowflakes can be worn')
    cm.tap_shown(pg, 'hat-woolly')
    check(pg.evaluate("__houseState().wear.hat") == 'woolly', 'my house: your animal wears the woolly hat')
    pg.screenshot(path=str(OUT / 'house-looks.png'))
    pg.close()
    pg = open_page(b, 'house', WINTER, rich, (390, 844), True)
    pg.wait_for_timeout(800)
    cm.wait_screen(pg, 'house'); cm.tap(pg, 'looks'); cm.wait_screen(pg, 'house-looks')
    hats = [i for i in cm.items(pg) if i['attr'].startswith('hat-')]
    check(len(hats) == 5 and len({round(h['y']) for h in hats}) == 1 and all(h['x'] + h['w'] <= 391 for h in hats),
          f'my house, winter, upright phone: 5 hats fit on one line ({len(hats)})')
    pg.screenshot(path=str(OUT / 'house-looks-phone.png'))
    pg.close()

    # ---- 7. the hub still knows the season (Bop's winter scarf) ----
    pg = open_page(b, '', WINTER)
    pg.wait_for_timeout(1200)
    check(pg.evaluate("Arcade.season()") == 'winter' and pg.evaluate("__hubState().season.season") == 'winter', 'hub: still winter for Bop + the snow')
    pg.close()
    b.close()

for e in errors: print('JS ERROR', e)
print(f'\n{len(fails)} failed, {len(errors)} JS errors')
sys.exit(1 if fails or errors else 0)
