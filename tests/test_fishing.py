"""Automated test: Fishing Frenzy (the Nov 13 "looks + more to do" update; Nov 21: menus drawn with Phaser + Rex UI).

Run:  python3 tests/test_fishing.py
Checks:
  * the title menu has picture buttons for the Fish Book, the Aquarium (Tank) and the Shop,
    and on a phone held sideways every button fits on the screen (two rows)
  * the game's own bot (__fishingBot) really fishes: casts, waits for the bite, reels in 3 fish
  * every catch gives shells; the first goal ("catch 3 fish") finishes and gives its shells,
    the catch card shows GOAL!, then the next goals (a Bluegill, 3 kinds, a Perch, a BIG Carp...)
  * the Shell Shop: too few shells = nothing bought; buying a plant / the Shrimp bait takes shells,
    the bait is picked and the game uses it
  * the Aquarium: one fish per kind found swims in it, tapping a fish shows its name, tapping the water drops food
  * the Fish Book shows the 3 x 8 goals + every fish; a timed round still ends with results; old saves (no shells) still load
  * the levels page: the rod picker (a locked rod can't be picked) and the Fish Book button
  * the three places draw (pond rowboat, pier, ice), at desktop and phone size; no JavaScript errors
Screenshots land in tests/out/ (fishing-*.png).
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
import cmenu as cm
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
URL = (ROOT / 'fishing' / 'index.html').as_uri()
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
ST = lambda pg: pg.evaluate('__fishingState()')

def fresh(pg, save=None):
    pg.goto(URL)
    pg.evaluate("localStorage.clear()")
    if save is not None:
        pg.evaluate("d => localStorage.setItem('kidsArcade.v1', JSON.stringify({games: {fishing: d}}))", save)
    pg.reload(); pg.wait_for_timeout(500)

def play(pg, lv):
    pg.evaluate(f'document.activeElement && document.activeElement.blur(); __game.play({json.dumps(lv)})'); pg.wait_for_timeout(2400)

def title_menu(pg):
    pg.evaluate('__game.menu()')
    cm.wait_screen(pg)
    if cm.screen(pg) == 'tap': cm.to_title(pg)
    cm.wait_screen(pg, 'title')
SHELLS = '__game.save.data.shells'

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    fresh(pg)

    # ---- title menu ----
    cm.to_title(pg)
    check(all(cm.find(pg, a) for a in ['book', 'tank', 'shopmenu']), 'title menu: Book, Tank and Shop picture buttons')
    pg.screenshot(path=str(OUT / 'fishing-menu.png'))

    # ---- the levels page: 6 places; Prizes: the rods + the Fish Book button ----
    cm.tap(pg, 'levels'); cm.wait_screen(pg, 'levels')
    check(len([i for i in cm.items(pg) if i['attr'].startswith('level-')]) == 6, 'levels: 6 place tiles')
    pg.screenshot(path=str(OUT / 'fishing-levels.png'))
    cm.tap(pg, 'back'); cm.wait_screen(pg, 'title')
    cm.tap(pg, 'unlocks'); cm.wait_screen(pg, 'unlocks')
    rods = [i for i in cm.items(pg) if i['attr'].startswith('rod-')]
    check(len(rods) == 4 and rods[0]['picked'] and all(r['locked'] for r in rods[1:]) and cm.find(pg, 'book-btn'), 'Prizes: the Twig Rod is picked, the other 3 are locked; a Fish Book button')
    pg.screenshot(path=str(OUT / 'fishing-prizes.png'))
    cm.tap(pg, 'rod-bamboo'); pg.wait_for_timeout(200)
    check(pg.evaluate('__game.save.data.rod || "twig"') == 'twig', 'a locked rod is not picked')
    cm.tap(pg, 'book-btn'); cm.wait_screen(pg, 'book')
    check(len([i for i in cm.items(pg) if i['attr'].startswith('fish-')]) == 19, 'the Fish Book has every fish (19)')
    cm.tap(pg, 'back'); cm.wait_screen(pg, 'title')

    # ---- the bot fishes for real: 3 fish = the first goal ----
    play(pg, {'id': 'pond-relax', 'loc': 'pond', 'mode': 'relax'})
    s = ST(pg)
    check(s['goal']['i'] == 0 and s['goal']['def'] == {'n': 3} and s['shells'] == 0, f"pond: goal 1 = catch 3 fish, 0 shells ({s['goal']})")
    pg.screenshot(path=str(OUT / 'fishing-pond.png'))
    pg.evaluate('__fishingBot(true)')
    seen = set()
    for k in range(400):
        ph = ST(pg)['phase']; seen.add(ph)
        if ST(pg)['caught'] >= 1: break
        if ph == 'reeling' and 'shot' not in seen: seen.add('shot'); pg.screenshot(path=str(OUT / 'fishing-reel.png'))
        pg.wait_for_timeout(100)
    check(ST(pg)['caught'] >= 1 and {'charging', 'flying', 'waiting', 'reeling'} <= seen, f'bot: cast, waited, reeled in a fish ({sorted(seen)})')
    pg.wait_for_timeout(500); pg.screenshot(path=str(OUT / 'fishing-card.png'))
    check(ST(pg)['shells'] >= 1, f"a catch gives shells ({ST(pg)['shells']})")
    pg.wait_for_function('__fishingState().caught >= 3', timeout=120000)
    pg.wait_for_timeout(200)
    s = ST(pg)
    check(s['goal']['i'] == 1 and s['goal']['def'] == {'sp': 'bluegill'}, f"3 fish -> goal 1 done, now: catch a Bluegill ({s['goal']})")
    check(s['stats']['goals'] == 1 and s['shells'] >= 3 + 5, f"the goal gave 5 shells ({s['shells']})")
    pg.evaluate('__fishingBot(false)'); pg.wait_for_timeout(2600)

    # ---- the next goals, one by one ----
    pg.evaluate("__fishingTest.catchNow('bluegill')"); pg.wait_for_timeout(700)
    s = ST(pg)
    check(s['goal']['i'] == 2 and s['card']['goal'], f"a Bluegill -> goal 2 done, the card says GOAL! ({s['goal']['i']})")
    pg.screenshot(path=str(OUT / 'fishing-goal.png'))
    for sp in ['minnow', 'carp']: pg.evaluate(f"__fishingTest.catchNow('{sp}')")
    check(ST(pg)['goal']['i'] == 3, 'find 3 kinds -> done')
    pg.evaluate("__fishingTest.catchNow('perch')")
    check(ST(pg)['goal']['i'] == 4, 'a Stripy Perch -> done')
    pg.evaluate("__fishingTest.catchNow('carp', 33)")
    check(ST(pg)['goal']['i'] == 4, 'a small Bubble Carp (33 cm) does NOT count for "42 cm or more"')
    pg.evaluate("__fishingTest.catchNow('carp', 50)")
    check(ST(pg)['goal']['i'] == 5, 'a big Bubble Carp (50 cm) -> done')
    pg.wait_for_timeout(1500)
    pg.screenshot(path=str(OUT / 'fishing-goalchip.png'))

    # ---- shop ----
    pg.evaluate('__fishingTest.shells(10)')
    title_menu(pg)
    cm.tap(pg, 'shopmenu'); cm.wait_screen(pg, 'shop')
    pg.screenshot(path=str(OUT / 'fishing-shop-before.png'))
    def buy(attr):
        # (the shop scrolls: a tile in view gets a real tap; one further down is tapped through the test hook)
        it = cm.find(pg, attr)
        vp = pg.viewport_size
        if it['y'] < 80 or it['y'] + it['h'] > vp['height'] - 120:
            pg.evaluate("a => ArcadeMenus.tap(a)", attr)       # (off the visible part: same as a tap)
        else: cm.tap(pg, attr)
        pg.wait_for_timeout(200)
    buy('decor-castle')
    check(pg.evaluate(SHELLS) == 10 and 'castle' not in (pg.evaluate('__game.save.data.decor') or []), 'too few shells: the castle is not bought')
    buy('decor-plants')
    check(pg.evaluate(SHELLS) == 5 and 'plants' in pg.evaluate('__game.save.data.decor'), 'sea plants bought for 5 shells')
    check(cm.find(pg, 'decor-plants')['picked'] and pg.evaluate('ArcadeMenus.current().rows[0].wallet') == 5, 'the shop redraws: plants ticked, 5 shells left')
    pg.evaluate('__fishingTest.shells(100)')
    buy('bait-shrimp')
    check(pg.evaluate('__game.save.data.bait') == 'shrimp' and pg.evaluate(SHELLS) == 75, 'Shrimp Snack bought (25) and picked')
    pg.evaluate('__fishingTest.shells(200)')
    for d in ['castle', 'chest', 'bubbler', 'snail', 'coral', 'star', 'rainbow']: buy('decor-' + d)
    check(len(pg.evaluate('__game.save.data.decor')) == 8, 'every tank thing bought')
    pg.screenshot(path=str(OUT / 'fishing-shop.png'))

    # ---- aquarium ----
    cm.tap(pg, 'tank-btn'); cm.wait_screen(pg, 'tank'); pg.wait_for_timeout(700)
    kinds = len(pg.evaluate('__game.save.data.book'))
    tank = pg.evaluate('__fishTank()')
    check(len(tank['fish']) == kinds and kinds >= 4, f'the aquarium has one fish per kind found ({len(tank["fish"])} / {kinds})')
    box = cm.find(pg, 'tank')
    k = box['w'] / 900
    f = pg.evaluate('__fishTank().fish[0]')
    pg.mouse.click(box['x'] + f['x'] * k, box['y'] + f['y'] * k); pg.wait_for_timeout(150)
    t1 = pg.evaluate('__fishTank().fish[0].x'); pg.wait_for_timeout(300)
    check(pg.evaluate('__fishTank().fish[0].x') != t1, 'the fish keep swimming while the tank is open')
    check(pg.evaluate('__fishTank().fish[0].label'), 'tap a fish: it shows its name')
    pg.mouse.click(box['x'] + 450 * k, box['y'] + 60 * k); pg.wait_for_timeout(100)
    fd = pg.evaluate('__fishTank().food')
    pg.wait_for_timeout(900)
    check(fd > 0, f'tap the water: food drops ({fd})')
    pg.screenshot(path=str(OUT / 'fishing-tank.png'))

    # ---- the book: goals ----
    title_menu(pg)
    cm.tap(pg, 'book'); cm.wait_screen(pg, 'book')
    goals = [i for i in cm.items(pg) if i['attr'].startswith('goal-')]
    done = [i for i in goals if i['pics'] == 1]
    check(len(goals) == 24 and len(done) == 5 and cm.find(pg, 'goal-pond-5')['picked'], f"Fish Book: 24 goals, 5 done, the 6th is next ({len(goals)}, {len(done)})")
    found = pg.evaluate("ArcadeMenus.current().rows[2].items.filter(i => i.found).length")
    check(found == len(pg.evaluate('__game.save.data.book')), f'Fish Book: the fish you caught have names ({found})')
    pg.screenshot(path=str(OUT / 'fishing-book.png'))

    # ---- the bait is used; the other places draw ----
    play(pg, {'id': 'pier-relax', 'loc': 'pier', 'mode': 'relax'})
    check(ST(pg)['bait'] == 'shrimp', 'the picked bait is used when fishing')
    pg.screenshot(path=str(OUT / 'fishing-pier.png'))
    play(pg, {'id': 'ice-relax', 'loc': 'ice', 'mode': 'relax'})
    pg.evaluate('__fishingBot(true)'); pg.wait_for_function('__fishingState().phase === "waiting"', timeout=10000); pg.wait_for_timeout(800)
    pg.screenshot(path=str(OUT / 'fishing-ice.png'))
    pg.evaluate('__fishingBot(false)')

    # ---- a timed round still ends with results ----
    play(pg, {'id': 'pond-timed', 'loc': 'pond', 'mode': 'timed'})
    pg.evaluate('__fishingTest.catchNow("trout")'); pg.wait_for_timeout(2600)
    pg.evaluate('__fishingTest.setTime(0)')
    cm.wait_screen(pg, 'results')
    chips = pg.evaluate("ArcadeMenus.current().rows.filter(r => r.t === 'chips').flatMap(r => r.items.map(c => c.text))")
    check('1' in chips and '7' not in chips and any('cm' in c for c in chips), f'timed round ends with the results: fish caught + best fish, as pictures ({chips})')
    pg.screenshot(path=str(OUT / 'fishing-results.png'))

    # ---- an old save (from before shells) still loads ----
    fresh(pg, {'levels': {}, 'best': 0, 'unlocked': ['loc-pier'], 'achievements': ['first'], 'data': {'book': {'minnow': {'n': 2, 'best': 7}}, 'total': 2, 'rod': 'twig'}})
    play(pg, {'id': 'pond-relax', 'loc': 'pond', 'mode': 'relax'})
    s = ST(pg)
    check(s['shells'] == 0 and s['bait'] == 'worm' and s['goal']['i'] == 0, 'old save: 0 shells, the worm, goal 1')

    # ---- phone held sideways: every menu picture is on the screen ----
    ctx = b.new_context(viewport={'width': 844, 'height': 390}, is_mobile=True, has_touch=True)
    ph = ctx.new_page(); ph.on('pageerror', lambda e: errors.append(str(e)))
    ph.goto(URL); ph.wait_for_timeout(500)
    cm.to_title(ph)
    boxes = cm.items(ph)
    check(len(boxes) >= 6 and all(bx['x'] >= 0 and bx['x'] + bx['w'] <= 844 and bx['y'] + bx['h'] <= 390 for bx in boxes), f'phone sideways: all {len(boxes)} menu pictures fit')
    ph.screenshot(path=str(OUT / 'fishing-phone-menu.png'))
    ph.evaluate("__game.menu()")
    cm.wait_screen(ph, 'title'); cm.tap(ph, 'tank', touch=True); cm.wait_screen(ph, 'tank')
    t = cm.find(ph, 'tank')
    check(t['w'] > 440 and t['x'] >= 0 and t['x'] + t['w'] <= 844, f"phone sideways: the aquarium is big ({round(t['w'])} px wide)")
    ph.screenshot(path=str(OUT / 'fishing-phone-tank.png'))
    ph.evaluate('__game.menu()'); cm.wait_screen(ph, 'title')
    ph.evaluate("__game.play({id: 'pond-relax', loc: 'pond', mode: 'relax'})"); ph.wait_for_timeout(2400)
    ph.evaluate("__fishingTest.catchNow('catfish')"); ph.wait_for_timeout(800)
    ph.screenshot(path=str(OUT / 'fishing-phone-card.png'))
    ctx.close()
    b.close()

check(not errors, 'no JavaScript errors' + (': ' + '; '.join(errors[:3]) if errors else ''))
print('\n%d failed' % len(fails) if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
