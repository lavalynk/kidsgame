"""The Star Road (Nov 24, new plan point 8, part 1): stars in a game unlock new LOOKS for it.

Hats (party hat, flower crown, crown, star hat) and trails (sparkles, hearts, bubbles, a rainbow); a new one every few
stars, a big "New!" screen when one unlocks, a Looks screen (title menu button `looks`) to put them on.
Part 1 games: Jungle Jump (hats + trails), Putt-Putt Park, Hoop Heroes, Space Defender (trails).

Checks:
  * the road: 8 looks for Jungle Jump (4 for a trails-only game), the first after 2 stars, always going up
  * stars from before the Star Road count right away (shown as NEW on the Looks button + tiles)
  * the Looks screen: unlocked = can be worn (picked = yellow), locked = a padlock + the stars it needs, a tap does nothing
  * finishing a round that reaches a new look: the "New!" screen, "Wear it!" puts it on, then the results
    (with a chip: your stars / the next look's stars)
  * "New game" wipes the levels but never takes a look away; the "Show me" demo never unlocks anything
  * each game really lets the trail out while playing; Jungle Jump's hero really wears the hat
  * the Looks screen fits a computer and an upright phone without anything off the screen
  * no JavaScript errors
Screenshots + a picture of every hero in every hat: tests/out/looks/.   Run: python3 tests/test_looks.py
"""
import sys, json, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu as cm
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out' / 'looks'; OUT.mkdir(parents=True, exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

def open_game(b, game, save=None, vp=(1280, 720), mobile=False):
    ctx = b.new_context(viewport={'width': vp[0], 'height': vp[1]}, has_touch=mobile, is_mobile=mobile)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(f'{game}: {e}'))
    pg.goto((ROOT / game / 'index.html').as_uri())
    pg.evaluate('localStorage.clear()')
    pg.evaluate("localStorage.setItem('kidsArcade.testLooks', '1')")      # (headless tests only get the "New!" screen when they ask)
    if save is not None:
        pg.evaluate(f"localStorage.setItem('kidsArcade.v1', JSON.stringify({json.dumps(save)}))")
    pg.reload(); pg.wait_for_timeout(500)
    return pg

def looks(pg):
    return pg.evaluate('JSON.parse(JSON.stringify(__game.save.looks || null))')

with sync_playwright() as pw:
    b = pw.chromium.launch()

    # ---- 1. Jungle Jump: the road, the Looks screen, wearing ----
    save = {'games': {'jungle': {'levels': {'w1a': {'stars': 3, 'done': True}, 'w1b': {'stars': 2, 'done': True},
                                            'fr-x': {'stars': 3}}}}}       # (a Friends level never counts)
    pg = open_game(b, 'jungle', save)
    road = pg.evaluate('__game.looks.road().map(r => ({ id: r.id, kind: r.kind, stars: r.stars }))')
    ups = [r['stars'] for r in road]
    check(len(road) == 8 and ups[0] <= 2 and all(a < c for a, c in zip(ups, ups[1:])), f'jungle: 8 looks on the road, going up: {ups}')
    check([r['kind'] for r in road[:2]] == ['hat', 'trail'], 'jungle: hats and trails take turns')
    L = looks(pg)
    check(L and L['best'] == 5 and set(L['got']) == {r['id'] for r in road if r['stars'] <= 5}, f'jungle: stars from before count right away (5 stars -> {L and L["got"]})')
    cm.to_title(pg)
    lk = cm.find(pg, 'looks')
    check(lk is not None and lk['badge'], 'jungle: the title menu has a Looks button with a NEW star')
    chips = pg.evaluate("ArcadeMenus.texts().map(t => t.text)")
    check(any(t == f"5/{road[2]['stars']}" for t in chips), f'jungle: a chip says 5 / the next look ({[t for t in chips if "/" in t]})')
    pg.screenshot(path=str(OUT / 'jungle-title.png'))
    cm.tap(pg, 'looks'); cm.wait_screen(pg, 'looks')
    tiles = {i['attr']: i for i in cm.items(pg) if i['attr'].startswith('look-')}
    check(len(tiles) == 8 and all(t['shown'] for t in tiles.values()), 'jungle: all 8 looks are on the screen without scrolling')
    have = [a for a, t in tiles.items() if not t['locked']]
    check(sorted(have) == sorted('look-' + i for i in L['got']), f'jungle: unlocked tiles = the looks you have ({have})')
    check(all(t['pics'] == 1 for a, t in tiles.items() if t['locked']), 'jungle: a locked look shows a star + how many it needs')
    pg.screenshot(path=str(OUT / 'jungle-looks.png'))
    cm.tap(pg, 'look-crown')
    check(looks(pg)['hat'] is None, 'jungle: tapping a locked look does nothing')
    cm.tap(pg, 'look-party')
    check(looks(pg)['hat'] == 'party' and cm.find(pg, 'look-party')['picked'], 'jungle: tapping the party hat puts it on (yellow)')
    cm.tap(pg, 'look-party')
    check(looks(pg)['hat'] is None, 'jungle: tapping it again takes it off')
    cm.tap(pg, 'look-party'); cm.tap(pg, 'look-sparkles')
    check(looks(pg)['trail'] == 'sparkles', 'jungle: the sparkle trail goes on too')
    cm.tap(pg, 'back'); cm.wait_screen(pg, 'title')
    check(not cm.find(pg, 'looks')['badge'] and looks(pg)['fresh'] == [], 'jungle: after looking, the NEW star is gone')

    # ---- 2. playing: the trail comes out, the hat is on ----
    cm.tap(pg, 'start'); cm.into_game(pg)
    pg.wait_for_timeout(500)
    pg.keyboard.down('ArrowRight'); pg.wait_for_timeout(1500); pg.keyboard.up('ArrowRight')
    info = pg.evaluate('__game.looks.info()')
    check(info['trails'] >= 8 and info['hat'] == 'party', f'jungle: running lets the sparkles out ({info})')
    pg.screenshot(path=str(OUT / 'jungle-play.png'))
    pg.keyboard.down('ArrowRight'); pg.wait_for_timeout(100); pg.keyboard.up('ArrowRight')
    before = pg.evaluate('__game.looks.info().trails'); pg.wait_for_timeout(700)
    check(pg.evaluate('__game.looks.info().trails') - before <= 2, 'jungle: standing still, no trail')
    # the hat really is drawn on every hero (a picture of all of them: hero x hat)
    diffs = pg.evaluate("""(async () => {
      const A = __jungleArt, hats = Arcade.looks.HATS.map(h => h.id);
      for (const h of hats) { const im = Arcade.looks.hatImg(h); if (!im.complete) await new Promise(r => im.onload = r); }
      const big = document.createElement('canvas'); big.width = 90 * (hats.length + 1); big.height = 100 * A.HEROES.length;
      const bx = big.getContext('2d'); bx.fillStyle = '#bde0fe'; bx.fillRect(0, 0, big.width, big.height);
      const out = [];
      A.HEROES.forEach((hero, r) => {
        const draw = (hat) => { const c = document.createElement('canvas'); c.width = 90; c.height = 100; A.drawHero(c.getContext('2d'), hero, 45, 92, { state: 'idle', face: 1, hat }); return c; };
        const plain = draw(null), px = plain.getContext('2d').getImageData(0, 0, 90, 100).data;
        bx.drawImage(plain, 0, r * 100);
        hats.forEach((h, i) => {
          const c = draw(h), q = c.getContext('2d').getImageData(0, 0, 90, 100).data;
          let n = 0; for (let k = 3; k < q.length; k += 4) if (Math.abs(q[k] - px[k]) > 60 || Math.abs(q[k - 3] - px[k - 3]) > 60) n++;
          out.push(n); bx.drawImage(c, 90 * (i + 1), r * 100);
        });
      });
      window.__heroHats = big.toDataURL();
      return out;
    })()""")
    check(min(diffs) > 150, f'jungle: every hero shows every hat (changed pixels: min {min(diffs)})')
    import base64
    (OUT / 'jungle-hero-hats.png').write_bytes(base64.b64decode(pg.evaluate('__heroHats').split(',')[1]))

    # ---- 3. a round that reaches a new look: "New!", Wear it!, then the results ----
    nxt = road[2]
    pg.evaluate(f"__game.save.levels.w2a = {{ stars: {nxt['stars'] - 5} }}; __game.finish({{ win: true, stars: {nxt['stars'] - 5}, score: 40 }})")
    cm.wait_screen(pg, 'newlook', 6000)
    check(cm.find(pg, 'wear') and cm.find(pg, 'ok'), f'jungle: the "New!" screen for the {nxt["id"]} with Wear it! + OK')
    pg.wait_for_timeout(600); pg.screenshot(path=str(OUT / 'jungle-new.png'))
    cm.tap(pg, 'wear'); cm.wait_screen(pg, 'results')
    L = looks(pg)
    check(L[nxt['kind']] == nxt['id'] and nxt['id'] in L['got'] and nxt['id'] not in L['fresh'], f'jungle: Wear it! put the {nxt["id"]} on, then the results')
    texts = pg.evaluate("ArcadeMenus.texts().map(t => t.text)")
    after = next(r for r in road if r['id'] not in L['got'])
    check(f"{L['best']}/{after['stars']}" in texts, f"jungle: the results show the stars on the way to the next look ({[t for t in texts if '/' in t]})")
    pg.screenshot(path=str(OUT / 'jungle-results.png'))
    # a round that reaches nothing new goes straight to the results
    pg.evaluate("__game.restart()"); pg.wait_for_timeout(400)
    pg.evaluate("__game.finish({ win: true, stars: 1, score: 10 })")
    cm.wait_screen(pg, 'results', 6000)
    check(True, 'jungle: nothing new = straight to the results')
    # New game wipes the levels, never the looks
    pg.evaluate("for (const k in __game.save.levels) delete __game.save.levels[k]; __game.looks.check()")
    L2 = looks(pg)
    check(L2['got'] == L['got'] and L2['best'] == L['best'], 'jungle: a New game keeps every look (and the star count)')
    pg.close()

    # the "Show me" demo never unlocks anything
    pg = open_game(b, 'jungle', {'games': {'jungle': {'levels': {'w1a': {'stars': 1}}}}})
    pg.evaluate("localStorage.setItem('kidsArcade.testShowMe', '1')")
    got0 = looks(pg)['got']
    pg.evaluate("Arcade.demoOn = true; __game.save.levels.w3a = { stars: 3 }; __game.looks.check(); Arcade.demoOn = false; delete __game.save.levels.w3a")
    check(looks(pg)['got'] == got0, 'jungle: nothing unlocks during the "Show me" demo')
    pg.close()

    # ---- 4. the trails-only games: 4 looks each, the trail really comes out ----
    rich = lambda game, ids: {'games': {game: {'levels': {i: {'stars': 3, 'done': True} for i in ids},
                                               'looks': {'best': 60, 'got': ['sparkles', 'hearts', 'bubbles', 'rainbow'], 'fresh': [], 'hat': None, 'trail': 'rainbow'}}}}
    for game, ids, go in [
        ('golf', ['h1', 'h2', 'h3'], "__golfShoot(0, 0.7)"),
        ('hoops', ['ruby', 'dash'], "__hoopsShoot(__hoopsPerfect(), 0)"),
        ('space', ['s0', 's1'], "__spaceTest.nudge(0, 40)"),
    ]:
        pg = open_game(b, game, rich(game, ids))
        road = pg.evaluate('__game.looks.road().map(r => r.kind + ":" + r.stars)')
        check(len(road) == 4 and all(r.startswith('trail') for r in road), f'{game}: 4 trails on the road ({road})')
        cm.to_title(pg)
        cm.tap(pg, 'looks'); cm.wait_screen(pg, 'looks')
        tl = [i for i in cm.items(pg) if i['attr'].startswith('look-')]
        check(len(tl) == 4 and cm.find(pg, 'look-rainbow')['picked'], f'{game}: the Looks screen shows 4 trails, the rainbow worn')
        pg.screenshot(path=str(OUT / f'{game}-looks.png'))
        cm.tap(pg, 'back'); cm.wait_screen(pg, 'title')
        cm.tap(pg, 'start'); cm.into_game(pg)
        pg.wait_for_timeout(1500)
        for _ in range(3):
            pg.evaluate(go); pg.wait_for_timeout(450)
        info = pg.evaluate('__game.looks.info()')
        check(info['trails'] >= 5, f'{game}: the rainbow trail comes out while playing ({info["trails"]})')
        pg.screenshot(path=str(OUT / f'{game}-play.png'))
        pg.close()

    # ---- 5. the Looks screen on phones ----
    for name, vp in [('phone-upright', (390, 844)), ('phone-sideways', (844, 390))]:
        pg = open_game(b, 'jungle', {'games': {'jungle': {'levels': {'w1a': {'stars': 3}, 'w1b': {'stars': 3}, 'w2a': {'stars': 3}}}}}, vp, True)
        cm.to_title(pg)
        cm.tap(pg, 'looks', touch=True); cm.wait_screen(pg, 'looks')
        its = [i for i in cm.items(pg) if i['attr'].startswith('look-')]
        inside = all(i['x'] >= -1 and i['x'] + i['w'] <= vp[0] + 1 for i in its)
        small = min(min(i['w'], i['h']) for i in its)
        check(inside and small >= 44, f'jungle {name}: every look tile is on the screen and big enough (smallest {small:.0f}px)')
        pg.screenshot(path=str(OUT / f'jungle-looks-{name}.png'))
        pg.close()

    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print(f"\n{len(fails)} failed" if fails else '\nall passed')
sys.exit(1 if fails else 0)
