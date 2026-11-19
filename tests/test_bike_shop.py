"""Automated test: Turbo Bike's Bike Shop (Keith's bike plan #7, Nov 19).

Run:  python3 tests/test_bike_shop.py
Coins you grab on the track go in your wallet (old saves start with every coin they ever got).
The Shop (a picture button on the title menu) sells:
  upgrades: Engine (faster), Cooler (turbo longer), Tires (landings + mud), 3 levels each
  looks:    paint colors, flames, helmet stickers
Checks buying, not-enough-coins, the upgrades really change the ride, looks show on the bike,
coins from a race land in the wallet, and the page fits on phones. Screenshots: tests/out/bike-shop-*.png
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

def fresh(pg, data=None):
    pg.goto((ROOT / 'bike' / 'index.html').as_uri())
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': 'big'}]}
    save = {'games': {'bike': {'levels': {}, 'best': 0, 'unlocked': [], 'data': data or {}, 'achievements': []}}}
    pg.evaluate("([p, s]) => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); localStorage.setItem('kidsArcade.v1', s); }",
                [json.dumps(prof), json.dumps(save)])
    pg.reload(); pg.wait_for_timeout(500)
    vp = pg.viewport_size
    if pg.locator('.ar-tapstart').count(): pg.mouse.click(vp['width'] // 2, vp['height'] // 2); pg.wait_for_timeout(700)

def saved(pg):
    return pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.v1')).games.bike")

def shop(pg):
    pg.click('[data-shop]'); pg.wait_for_timeout(400)

def tap(pg, sel):
    pg.locator('.ar-overlay.show ' + sel).first.click(); pg.wait_for_timeout(150)

def wallet(pg):
    return int(pg.locator('.ar-overlay.show [data-wallet] b').inner_text())

def race(pg):
    """start Sunny Start from the level grid"""
    pg.locator('.ar-overlay.show .ar-btn.big').first.click(); pg.wait_for_timeout(400)   # Back to the menu
    pg.click('[data-levels]'); pg.wait_for_timeout(400)
    pg.locator('.ar-overlay.show .ar-grid .ar-tile').first.click(); pg.wait_for_timeout(400)
    pg.wait_for_function('typeof __bikeState === "function" && __bikeState().countdown <= 0', timeout=8000)

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 760})
    pg.on('pageerror', lambda e: errors.append(str(e)))

    # ---- an old save: the wallet starts with every coin ever collected ----
    fresh(pg, {'coinsAll': 37})
    check(pg.locator('[data-shop]').count() == 1, 'the title menu has a Shop button')
    shop(pg)
    check(wallet(pg) == 37, f'old save: wallet = 37 coins ever collected ({wallet(pg)})')
    pg.screenshot(path=str(OUT / 'bike-shop-page.png'))

    # ---- buy an engine level; the next level is too dear: nothing happens ----
    tap(pg, '[data-up="engine"]')
    check(wallet(pg) == 17 and saved(pg)['data']['up']['engine'] == 1, f'engine level 1 for 20 coins (wallet {wallet(pg)})')
    tap(pg, '[data-up="engine"]')
    check(wallet(pg) == 17 and saved(pg)['data']['up']['engine'] == 1, 'level 2 costs 40: not enough coins, nothing bought')
    check('shopper' in json.dumps(saved(pg).get('achievements', [])), 'Bike shopper trophy')

    # ---- paint: buy blue (12), then the bike's own color is free again ----
    tap(pg, '[data-paint="#4cc9f0"]')
    d = saved(pg)['data']
    check(wallet(pg) == 5 and d['look']['paint'] == '#4cc9f0' and 'paint:#4cc9f0' in d['owned'], f'paint blue bought ({wallet(pg)}, {d["look"]})')
    tap(pg, '[data-paint="own"]'); tap(pg, '[data-paint="#4cc9f0"]')
    check(wallet(pg) == 5 and saved(pg)['data']['look']['paint'] == '#4cc9f0', 'owned paint: switching back and forth is free')
    tap(pg, '[data-flames]')
    check(wallet(pg) == 5 and not saved(pg)['data']['look']['flames'], 'flames cost 25: not enough coins')

    # ---- a rich save: everything ----
    fresh(pg, {'wallet': 1000})
    shop(pg)
    for u in ('engine', 'cool', 'tires'):
        for _ in range(4): tap(pg, f'[data-up="{u}"]')       # (the 4th tap on a full one does nothing)
    d = saved(pg)['data']
    check(d['up'] == {'engine': 3, 'cool': 3, 'tires': 3}, f"all upgrades at level 3 ({d['up']})")
    check(wallet(pg) == 1000 - (20 + 40 + 70) - 2 * (15 + 30 + 55), f'paid for all 9 levels ({wallet(pg)})')
    check('maxed' in json.dumps(saved(pg).get('achievements', [])), 'Super bike trophy')
    tap(pg, '[data-flames]'); tap(pg, '[data-sticker="heart"]')
    d = saved(pg)['data']
    check(d['look']['flames'] and d['look']['sticker'] == 'heart', f"flames + heart sticker on ({d['look']})")
    tap(pg, '[data-flames]'); tap(pg, '[data-sticker="heart"]')
    d = saved(pg)['data']
    check(not d['look']['flames'] and d['look']['sticker'] == '', 'tapping again takes them off (still owned)')
    w = wallet(pg)
    tap(pg, '[data-flames]'); tap(pg, '[data-sticker="star"]')
    check(wallet(pg) == w - 10, f'flames back on for free, a new star sticker costs 10 ({w} -> {wallet(pg)})')
    tap(pg, '[data-paint="#ff8c42"]')
    pg.screenshot(path=str(OUT / 'bike-shop-bought.png'))

    # ---- the ride: upgrades + looks reach the race ----
    race(pg)
    st = pg.evaluate('__bikeState()')
    r = st['ride']
    check(abs(r['top'] - 1.09) < 0.001 and abs(r['heat'] - 0.64) < 0.001 and abs(r['mud'] - 0.74) < 0.001,
          f"Red Rocket + max upgrades: top 1.09, heat 0.64, mud 0.74 ({r})")
    check(r['color'] == '#ff8c42' and r['flames'] and r['sticker'] == 'star', f'looks on the bike ({r})')
    # ride a bit: coins go in the wallet
    w0 = st['wallet']
    pg.keyboard.down('ArrowRight')
    for _ in range(300):
        s = pg.evaluate('(() => { const s = __bikeState(); return { c: s.coins, w: s.wallet, x: s.bike.x }; })()')
        if s['c'] >= 3: break
        pg.wait_for_timeout(40)
    pg.screenshot(path=str(OUT / 'bike-shop-ride.png'))
    pg.keyboard.up('ArrowRight')
    check(s['c'] > 0 and s['w'] == w0 + s['c'], f"track coins land in the wallet ({w0} + {s['c']} = {s['w']})")

    # ---- no shop stuff: rides exactly as before ----
    fresh(pg)
    pg.click('[data-levels]'); pg.wait_for_timeout(400)
    pg.locator('.ar-overlay.show .ar-grid .ar-tile').first.click(); pg.wait_for_timeout(400)
    pg.wait_for_function('typeof __bikeState === "function"')
    r = pg.evaluate('__bikeState().ride')
    check(r['top'] == 1 and r['heat'] == 1 and r['mud'] == 0.5 and r['color'] == '#ef476f' and not r['flames'], f'a new player rides the plain Red Rocket ({r})')

    # ---- phones: the shop fits, Back can be reached ----
    for vp in ({'width': 390, 'height': 844}, {'width': 844, 'height': 390}):
        p2 = b.new_page(viewport=vp, is_mobile=True, has_touch=True)
        p2.on('pageerror', lambda e: errors.append(str(e)))
        fresh(p2, {'wallet': 50})
        shop(p2)
        p2.screenshot(path=str(OUT / f"bike-shop-{vp['width']}.png"))
        sw = p2.evaluate('document.documentElement.scrollWidth')
        check(sw <= vp['width'] + 1, f"phone {vp['width']}x{vp['height']}: no sideways scrolling ({sw})")
        small = p2.evaluate("Math.min(...[...document.querySelectorAll('.ar-overlay.show .bk-swatch, .ar-overlay.show .ar-tile')].map(e => Math.min(e.offsetWidth, e.offsetHeight)))")
        check(small >= 58, f'phone {vp["width"]}: buttons big enough for fingers ({small}px)')
        back = p2.locator('.ar-overlay.show .ar-btn.big').first
        back.scroll_into_view_if_needed(); back.click(); p2.wait_for_timeout(400)
        check(p2.locator('[data-shop]').count() == 1, f"phone {vp['width']}: Back goes to the menu")
        p2.close()
    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
