"""Automated test: Turbo Bike (tricks, coins, computer riders, gentle crashes, little-kid help).

Run:  python3 tests/test_bike.py
A bot rides Sunny Start holding the gas, does tricks off the jumps (Up / Down in the air),
and checks the computer riders race too, coins get collected, and the results show a place.
Then a "little kid" rides with no tilting at all and never tumbles. Screenshots in tests/out/.
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

def start(pg, little=False):
    pg.goto((ROOT / 'bike' / 'index.html').as_uri())
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': 'little' if little else 'big'}]}
    pg.evaluate("p => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); }", json.dumps(prof))
    pg.reload(); pg.wait_for_timeout(500)
    pg.mouse.click(640, 380); pg.wait_for_timeout(700)
    pg.locator('.ar-nesitem.big').click(); pg.wait_for_timeout(600)
    for _ in range(4):
        if pg.locator('.ar-overlay.show').count() == 0: break
        btn = pg.locator('.ar-overlay.show .ar-btn.big, .ar-overlay.show .ar-tile:not(.locked)').first
        if btn.count(): btn.click()
        else: pg.keyboard.press('Enter')
        pg.wait_for_timeout(500)
    pg.wait_for_function('typeof __bikeState === "function"')

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 760})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    start(pg)
    st = pg.evaluate('__bikeState()')
    check(len(st['ais']) == 3, f"3 computer riders ({len(st['ais'])})")
    check(st['coinCount'] > 15, f"coins on the track ({st['coinCount']})")
    pg.wait_for_function('__bikeState().countdown <= 0', timeout=6000)
    pg.keyboard.down('ArrowRight')
    tricks_tried, shot = 0, False
    for i in range(400):
        s = pg.evaluate('({ air: __bikeState().bike.air, fin: __bikeState().finished, x: __bikeState().bike.x })')
        if s['fin']: break
        if s['air'] and tricks_tried < 6:
            pg.keyboard.press('ArrowUp' if tricks_tried % 2 == 0 else 'ArrowDown'); tricks_tried += 1
            pg.wait_for_timeout(60)
            if not shot and pg.evaluate('!!__bikeState().bike.trick'):
                pg.screenshot(path=str(OUT / 'bike-trick.png')); shot = True
        pg.wait_for_timeout(50)
    pg.keyboard.up('ArrowRight')
    st = pg.evaluate('__bikeState()')
    check(st['finished'], 'the bot finishes the race')
    check(shot, 'a trick pose shows in the air')
    check(st['coins'] > 0, f"coins collected ({st['coins']})")
    check(max(a['x'] for a in st['ais']) > 1500, f"computer riders race along ({[a['x'] for a in st['ais']]})")
    pg.wait_for_selector('.ar-results', timeout=6000); pg.wait_for_timeout(500)
    res = pg.locator('.ar-results').inner_text()
    check(any(p in res for p in ['1st', '2nd', '3rd', '4th']), 'results show your place')
    pg.screenshot(path=str(OUT / 'bike-results.png'))

    # mid-race picture (computer riders, coins, speed lines)
    start(pg)
    pg.wait_for_function('__bikeState().countdown <= 0', timeout=6000)
    pg.keyboard.down('ArrowRight'); pg.keyboard.down('Space'); pg.wait_for_timeout(2500)
    pg.screenshot(path=str(OUT / 'bike-race.png'))
    pg.keyboard.up('Space'); pg.keyboard.up('ArrowRight')

    # little kid: the bike rides itself, lands flat and never overheats
    start(pg, little=True)
    pg.wait_for_function('__bikeState().countdown <= 0', timeout=6000)
    pg.keyboard.down('Space')
    for _ in range(300):
        if pg.evaluate('__bikeState().finished'): break
        pg.wait_for_timeout(60)
    pg.keyboard.up('Space')
    st = pg.evaluate('__bikeState()')
    check(st['finished'] and st['stats']['crashes'] == 0, f"little kid: finished with no tumbles ({st['stats']['crashes']})")
    check(not st['stats'].get('hot'), 'little kid: holding turbo the whole way never overheats')
    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
