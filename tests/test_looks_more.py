"""The Star Road, part 3 (Nov 24, new plan point 8): looks in Turbo Bike and Mini RC Racers.
(Treasure Trail, Potion Quest and Fishing are in tests/test_looks.py.)

  * Mini RC Racers: 4 trails (behind your car)
  * Turbo Bike: hats on the rider's helmet + trails (8 looks)
  * each game's Looks screen opens (Mini RC Racers: from its own main menu, button `looks`, a NEW star when something's new)
  * playing really lets the worn trail out
  * Turbo Bike's rider really wears the hat (the picture changes where the helmet is)
  * no JavaScript errors
Screenshots: tests/out/looks/.   Run: python3 tests/test_looks_more.py
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

def open_game(b, game, save=None, vp=(1280, 720)):
    ctx = b.new_context(viewport={'width': vp[0], 'height': vp[1]})
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(f'{game}: {e}'))
    pg.goto((ROOT / game / 'index.html').as_uri())
    pg.evaluate('localStorage.clear()')
    if save is not None:
        pg.evaluate(f"localStorage.setItem('kidsArcade.v1', JSON.stringify({json.dumps(save)}))")
    pg.reload(); pg.wait_for_timeout(600)
    return pg

TRAILS = ['sparkles', 'hearts', 'bubbles', 'rainbow']
def rich(game, ids, worn, got=TRAILS, hat=None):
    return {'games': {game: {'levels': {i: {'stars': 3, 'done': True} for i in ids},
                             'looks': {'best': 99, 'got': got, 'fresh': [], 'hat': hat, 'trail': worn}}}}

def trails(pg): return pg.evaluate('__game.looks.info().trails')

with sync_playwright() as pw:
    b = pw.chromium.launch()

    # ---- the road in each game: trails only, or hats + trails for the bike ----
    for game, want in [('rc', 4), ('bike', 8)]:
        pg = open_game(b, game, {'games': {}})
        road = pg.evaluate('__game.looks.road().map(r => ({ kind: r.kind, stars: r.stars }))')
        ups = [r['stars'] for r in road]
        kinds = {r['kind'] for r in road}
        check(len(road) == want and ups[0] == 2 and all(a < c for a, c in zip(ups, ups[1:])) and (kinds == {'trail'} if want == 4 else kinds == {'hat', 'trail'}),
              f'{game}: {want} looks on the road, the first after 2 stars ({ups})')
        pg.close()

    # ---- Turbo Bike: the hat on the helmet + the rainbow out of the back wheel ----
    pg = open_game(b, 'bike', rich('bike', ['t1', 't2'], 'rainbow', got=['party', 'sparkles', 'flower', 'hearts', 'crown', 'bubbles', 'starhat', 'rainbow'], hat='crown'))
    cm.to_title(pg)
    cm.tap(pg, 'looks'); cm.wait_screen(pg, 'looks')
    tl = [i for i in cm.items(pg) if i['attr'].startswith('look-')]
    check(len(tl) == 8 and cm.find(pg, 'look-crown')['picked'] and cm.find(pg, 'look-rainbow')['picked'], 'bike: the Looks screen has 4 hats + 4 trails, the crown + rainbow worn')
    pg.screenshot(path=str(OUT / 'bike-looks.png'))
    cm.tap(pg, 'back'); cm.wait_screen(pg, 'title')
    pg.evaluate("__game.play(__bikeTrack('t1'))"); pg.wait_for_timeout(2600)     # (past the countdown)
    t0 = trails(pg)
    pg.keyboard.down('ArrowRight'); pg.wait_for_timeout(1500)
    pg.screenshot(path=str(OUT / 'bike-play.png'))
    t1 = trails(pg)
    pg.keyboard.up('ArrowRight')
    check(t1 - t0 >= 8 and pg.evaluate('__game.looks.info().hat') == 'crown', f'bike: riding lets the rainbow out ({t1 - t0}), the crown is on')
    # the hat really shows: the picture round the helmet with the hat vs. without it
    diff = pg.evaluate("""(async () => {
      const im = Arcade.looks.hatImg('crown'); if (!im.complete) await new Promise(r => im.onload = r);
      const c = document.querySelector('canvas'); const g = __game;
      const grab = () => { const x = c.getContext('2d'); return x.getImageData(0, 0, c.width, c.height).data; };
      g.state = 'still';                       // (the game stands still, the picture keeps being drawn)
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const a = grab();
      const L = g.save.looks; L.hat = null;
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const b2 = grab(); L.hat = 'crown'; g.state = 'play';
      let n = 0; for (let k = 0; k < a.length; k += 4) if (Math.abs(a[k] - b2[k]) + Math.abs(a[k + 1] - b2[k + 1]) + Math.abs(a[k + 2] - b2[k + 2]) > 90) n++;
      return n;
    })()""")
    check(60 < diff < 8000, f'bike: the crown is drawn on the rider ({diff} pixels change without it)')
    pg.close()

    # ---- Mini RC Racers: the Looks button on its own main menu, the trail behind your car ----
    pg = open_game(b, 'rc', {'games': {'rc': {'levels': {'t1': {'stars': 3}, 't2': {'stars': 3}}, 'looks': {'best': 6, 'got': ['sparkles'], 'fresh': [], 'hat': None, 'trail': 'sparkles'}}}})
    pg.evaluate("__game.save.looks.fresh = ['sparkles']")
    cm.to_title(pg); cm.wait_screen(pg, 'rc-main')
    lk = cm.find(pg, 'looks')
    check(lk is not None and lk['shown'], 'rc: the main menu has a Looks button')
    pg.screenshot(path=str(OUT / 'rc-main.png'))
    cm.tap(pg, 'looks'); cm.wait_screen(pg, 'looks')
    tl = {i['attr']: i for i in cm.items(pg) if i['attr'].startswith('look-')}
    check(len(tl) == 4 and tl['look-sparkles']['picked'] and tl['look-rainbow']['locked'], 'rc: 4 trails, sparkles worn, the rainbow still locked')
    pg.screenshot(path=str(OUT / 'rc-looks.png'))
    cm.tap(pg, 'back'); cm.wait_screen(pg, 'rc-main')
    check(pg.evaluate('__game.save.looks.fresh.length') == 0, 'rc: after looking, nothing is NEW any more; Back goes to the main menu')
    pg.evaluate("__game.play({ id: 't1' })"); pg.wait_for_timeout(3500)      # (past the countdown)
    t0 = trails(pg)
    pg.keyboard.down('ArrowUp'); pg.wait_for_timeout(1500)
    pg.screenshot(path=str(OUT / 'rc-play.png'))
    pg.keyboard.up('ArrowUp')
    t1 = trails(pg)
    check(t1 - t0 >= 8, f'rc: driving lets the sparkles out ({t1 - t0})')
    pg.close()

    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print(f"\n{len(fails)} failed" if fails else '\nall passed')
sys.exit(1 if fails else 0)
