"""The Star Road, part 5 (Nov 24, new plan point 8): the looks outside the games, in My House + the Sticker Book.

  * Arcade.looks.GAMES says the same kinds as every game's own config.looks (so the book shows the right looks)
  * Arcade.looks.owned(kind) = the looks a player earned in ANY game (each once)
  * My House: a Looks tile opens 'house-looks' (4 hats + 4 trails; earned ones tappable, others locked);
    wearing a hat puts it on your animal's head (the room picture has it); a worn trail puffs out when the
    animal hops and follows it while it's dragged; a look you don't have can't be worn; it's saved per player
  * the Sticker Book: a Looks button opens 'stickers-looks' (one card per game with looks; earned looks bright,
    others "?"); a look opens big ('stickers-look'), Play for ones still to earn; Back = the book
  * phone upright too; no JavaScript errors
Screenshots: tests/out/looks/.   Run: python3 tests/test_looks_book.py
"""
import sys, json, re, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu as cm
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out' / 'looks'; OUT.mkdir(parents=True, exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

# a player who earned some looks: Jungle Jump (party hat + sparkles), Fishing (party hat again + crown), golf (hearts)
SAVE = {'games': {
    'jungle': {'levels': {}, 'looks': {'best': 9, 'got': ['party', 'sparkles'], 'fresh': [], 'hat': None, 'trail': None}},
    'fishing': {'levels': {}, 'looks': {'best': 20, 'got': ['party', 'sparkles', 'crown'], 'fresh': [], 'hat': None, 'trail': None}},
    'golf': {'levels': {}, 'looks': {'best': 5, 'got': ['sparkles', 'hearts'], 'fresh': [], 'hat': None, 'trail': None}},
}}

def open_page(b, path, vp=(1280, 720), save=SAVE):
    ctx = b.new_context(viewport={'width': vp[0], 'height': vp[1]})
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(f'{path}: {e}'))
    pg.goto((ROOT / path).as_uri())
    pg.evaluate('localStorage.clear()')
    pg.evaluate(f"localStorage.setItem('kidsArcade.v1', JSON.stringify({json.dumps(save)}))")
    pg.reload(); pg.wait_for_timeout(700)
    return pg

# ---- 1. the GAMES list matches every game's own config.looks ----
for game in ['bike', 'rc', 'hoops', 'jungle', 'trail', 'space', 'abc', 'fishing', 'piano', 'golf', 'quest', 'archery']:
    src = (ROOT / game / f'{game}.js').read_text()
    m = re.search(r"\n\s*looks: \{ kinds: \[([^\]]*)\]", src)
    kinds = re.findall(r"'(\w+)'", m.group(1)) if m else None
    shared = (ROOT / 'arcade' / 'shared.js').read_text()
    gm = re.search(r"\b" + game + r": \[([^\]]*)\]", shared[shared.index('const GAMES = {', shared.index('Looks outside the games')):])
    listed = re.findall(r"'(\w+)'", gm.group(1)) if gm else None
    check(kinds == listed, f'{game}: Arcade.looks.GAMES says {listed}, the game says {kinds}')

with sync_playwright() as pw:
    b = pw.chromium.launch()

    # ---- 2. owned(): each look once, from any game ----
    pg = open_page(b, 'house/index.html')
    own = pg.evaluate("({ hat: Arcade.looks.owned('hat').map(x => x.id), trail: Arcade.looks.owned('trail').map(x => x.id), color: Arcade.looks.owned('color').map(x => x.id) })")
    check(own == {'hat': ['party', 'crown'], 'trail': ['sparkles', 'hearts'], 'color': []}, f'owned(): every look earned in any game, once each ({own})')
    road = pg.evaluate("Arcade.looks.roadOf('bike').map(r => r.kind)")
    check(road[:3] == ['hat', 'color', 'trail'] and len(road) == 12, 'roadOf(bike): 12 looks in the order they unlock')

    # ---- 3. My House ----
    cm.wait_screen(pg, 'house')
    pg.wait_for_function('__houseState().loaded', timeout=8000)
    check(cm.find(pg, 'looks') is not None, 'house: a Looks tile in the top row')
    cm.tap(pg, 'looks'); cm.wait_screen(pg, 'house-looks')
    hats = [i for i in cm.items(pg) if i['attr'].startswith('hat-')]
    trails = [i for i in cm.items(pg) if i['attr'].startswith('trail-')]
    check(len(hats) == 4 and len(trails) == 4, 'house: the Looks screen has 4 hats + 4 trails')
    check([h['locked'] for h in hats] == [False, True, False, True], f"house: earned hats open, the rest locked ({[h['locked'] for h in hats]})")
    pg.screenshot(path=str(OUT / 'house-looks.png'))
    cm.tap(pg, 'hat-flowers'); pg.wait_for_timeout(200)
    check(pg.evaluate('__houseState().wear.hat') is None, 'house: a locked hat can\'t be worn')
    cm.tap(pg, 'hat-crown'); pg.wait_for_timeout(300)
    check(pg.evaluate('__houseState().wear.hat') == 'crown' and cm.find(pg, 'hat-crown')['picked'], 'house: tapping the crown puts it on (picked)')
    cm.tap(pg, 'trail-hearts'); pg.wait_for_timeout(300)
    check(pg.evaluate('__houseState().wear.trail') == 'hearts', 'house: tapping the heart trail puts it on')
    pg.screenshot(path=str(OUT / 'house-looks-worn.png'))
    cm.tap(pg, 'back'); cm.wait_screen(pg, 'house')
    pg.wait_for_function('__houseState().loaded', timeout=8000)
    svg = pg.evaluate('__houseSVG()')
    check('#ffd166' in svg and 'M18 86 L15 38 L34 58' in svg, 'house: the crown sits on your animal in the room')
    # tap the animal: it hops and the hearts puff out
    room = cm.find(pg, 'room')
    pg.wait_for_timeout(300)
    lay = pg.evaluate("__houseState().pos['me:bedroom'] || [0, 0]")
    rx, ry = room['x'] + room['w'] * (400 + lay[0]) / 800, room['y'] + room['h'] * (400 + lay[1]) / 500
    p0 = pg.evaluate('__houseState().puffs')
    pg.mouse.click(rx, ry); pg.wait_for_timeout(150)
    st = pg.evaluate('__houseState()')
    check('self' in st['hopping'] and st['puffs'] - p0 >= 8 and st['bits'] > 0, f"house: the animal hops and its hearts puff out ({st['puffs'] - p0} bits)")
    pg.screenshot(path=str(OUT / 'house-hop.png'))
    # drag it: the trail follows
    pg.wait_for_timeout(900)
    p1 = pg.evaluate('__houseState().puffs')
    pg.mouse.move(rx, ry); pg.mouse.down()
    for i in range(20):
        pg.mouse.move(rx - i * 8, ry); pg.wait_for_timeout(25)
    pg.screenshot(path=str(OUT / 'house-drag.png'))
    pg.mouse.up(); pg.wait_for_timeout(300)
    check(pg.evaluate('__houseState().puffs') - p1 >= 4, 'house: dragging the animal, its trail follows')
    # saved
    saved = pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.v1')).house.wear")
    check(saved == {'hat': 'crown', 'trail': 'hearts'}, f'house: what you wear is saved ({saved})')
    # take the hat off again
    cm.tap(pg, 'looks'); cm.wait_screen(pg, 'house-looks')
    cm.tap(pg, 'hat-crown'); pg.wait_for_timeout(200)
    check(pg.evaluate('__houseState().wear.hat') is None, 'house: tapping the worn hat takes it off')
    pg.close()

    # a player with no looks at all: everything locked, nothing worn even if the save says so
    pg = open_page(b, 'house/index.html', save={'house': {'wear': {'hat': 'crown', 'trail': 'rainbow'}}})
    cm.wait_screen(pg, 'house')
    check(pg.evaluate('__houseState().wear') == {'hat': None, 'trail': None}, 'house: looks you don\'t have are never worn')
    cm.tap(pg, 'looks'); cm.wait_screen(pg, 'house-looks')
    check(all(i['locked'] for i in cm.items(pg) if re.match(r'(hat|trail)-', i['attr'])), 'house: no looks earned = all locked')
    pg.close()

    # phone upright
    pg = open_page(b, 'house/index.html', vp=(390, 844))
    cm.wait_screen(pg, 'house')
    cm.tap(pg, 'looks'); cm.wait_screen(pg, 'house-looks')
    vis = [i for i in cm.items(pg) if i['attr'].startswith('hat-')]
    check(len(vis) == 4 and all(i['x'] >= 0 and i['x'] + i['w'] <= 390 for i in vis), 'house (phone upright): the hats fit across')
    pg.screenshot(path=str(OUT / 'house-looks-phone.png'))
    pg.close()

    # ---- 4. the Sticker Book ----
    pg = open_page(b, 'stickers/index.html')
    cm.wait_screen(pg, 'stickers-book')
    cm.tap(pg, 'looks'); cm.wait_screen(pg, 'stickers-looks')
    games = [i['attr'][6:] for i in cm.items(pg) if i['attr'].startswith('lgame-')]
    check(len(games) == 12 and 'archery' not in games, f'book: one Looks card per game with looks ({len(games)})')
    n = pg.evaluate('__bookLooks().count')
    check(n == {'got': 7, 'all': 72}, f'book: counts the looks earned in every game ({n})')
    ja = [i for i in cm.items(pg) if i['attr'].startswith('look-jungle-')]
    check(len(ja) == 8 and ja[0]['label'] == 'Party hat' and ja[2]['label'] == '?', 'book: Jungle Jump\'s 8 looks, earned ones named, the rest "?"')
    pg.screenshot(path=str(OUT / 'book-looks.png'))
    cm.tap_shown(pg, 'look-jungle-party'); cm.wait_screen(pg, 'stickers-look')
    check(cm.find(pg, 'play') is None and cm.find(pg, 'close'), 'book: an earned look opens big (no Play)')
    pg.screenshot(path=str(OUT / 'book-look-big.png'))
    cm.tap(pg, 'close'); cm.wait_screen(pg, 'stickers-looks')
    cm.tap_shown(pg, 'look-jungle-crown'); cm.wait_screen(pg, 'stickers-look')
    check(cm.find(pg, 'play') is not None, 'book: a look still to earn has a Play button')
    cm.tap(pg, 'close'); cm.wait_screen(pg, 'stickers-looks')
    cm.tap(pg, 'back'); cm.wait_screen(pg, 'stickers-book')
    check(True, 'book: Back goes to the book')
    pg.close()

    pg = open_page(b, 'stickers/index.html', vp=(390, 844))
    cm.wait_screen(pg, 'stickers-book')
    cm.tap(pg, 'looks'); cm.wait_screen(pg, 'stickers-looks')
    its = [i for i in cm.items(pg) if i['attr'].startswith('look-') and i.get('shown', True)]
    check(its and all(i['x'] >= 0 and i['x'] + i['w'] <= 390 and i['w'] >= 60 for i in its), 'book (phone upright): looks fit and are big enough')
    pg.screenshot(path=str(OUT / 'book-looks-phone.png'))
    pg.close()

    # the hub still opens fine
    pg = open_page(b, 'index.html')
    cm.wait_screen(pg, 'hub')
    pg.close()
    b.close()

check(not errors, 'no JavaScript errors' + (': ' + '; '.join(errors[:3]) if errors else ''))
print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
