"""Automated test: Potion Quest (the walk-along adventure).

Run:  python3 tests/test_quest.py
Checks:
  * title = a picture; 3 places in the picker (only the Meadow open); "Pick your hero" shows 3 heroes
  * tapping a hero card picks it; touching the ground walks the hero there; Space bonks; a jar gives a potion
  * the magic button uses every potion for one spell (more potions = a bigger spell) and hits the baddies
  * the game's own bot wins the Meadow with the Knight, the Woods with the Ranger and the Castle (with the
    Blob King) with the Wizard: so every hero and every baddie really works
  * pressing Next after a win keeps the same hero and the potions
  * out of hearts = "Nice try!", and "Again" starts at the SAME wave (not the beginning)
  * a little kid gets more hearts and bonks without pressing anything
  * phone held sideways: the game fits, with a Bonk and a Magic button; no JavaScript errors
Screenshots land in tests/out/ (quest-*.png).
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
URL = (ROOT / 'quest' / 'index.html').as_uri()
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
ST = lambda pg: pg.evaluate('__questState()')

def fresh(pg, little=False):
    pg.goto(URL)
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': 'little' if little else 'big'}]}
    pg.evaluate("p => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); }", json.dumps(prof))
    pg.reload(); pg.wait_for_timeout(500)
def play(pg, sid):
    pg.evaluate(f'document.activeElement && document.activeElement.blur(); __game.play({{ id: "{sid}" }})'); pg.wait_for_timeout(2400)
def view(pg):
    """Turn game coordinates (960 x 540) into page coordinates."""
    b = pg.locator('canvas').first.bounding_box()
    return lambda x, y: (b['x'] + x * b['width'] / 960, b['y'] + y * b['height'] / 540)
def bot_stage(pg, sid, hero, tries=3):
    """The bot plays a stage (3x speed). If it runs out of hearts it carries on from that wave. Returns (state, tries used)."""
    pg.evaluate(f'document.activeElement && document.activeElement.blur(); __game.play({{ id: "{sid}", fresh: true }})'); pg.wait_for_timeout(2400)   # (fresh = pick a hero again)
    pg.evaluate(f'__questPick({hero})')
    for n in range(1, tries + 1):
        pg.evaluate('__questBot(true, 3)')
        pg.wait_for_function('__questState().won || __questState().lost', timeout=150000)
        st = ST(pg)
        if st['won']: return st, n
        pg.wait_for_timeout(2500); pg.evaluate('__game.restart()'); pg.wait_for_timeout(2400)
    return ST(pg), tries

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    fresh(pg)

    # ---- title, picker, pick your hero ----
    tap = pg.locator('.ar-tapstart')
    check(tap.count() == 1 and tap.inner_text().strip() == '', 'title screen = a big Play picture, no words')
    pg.screenshot(path=str(OUT / 'quest-title.png'))
    pg.mouse.click(640, 380); pg.wait_for_timeout(700); pg.click('[data-levels]'); pg.wait_for_timeout(500)
    grid = pg.locator('.ar-grid').first
    check(grid.locator('.ar-tile').count() == 3 and grid.locator('.ar-tile.locked').count() == 2, 'picker: 3 places, only the Meadow open')
    pg.screenshot(path=str(OUT / 'quest-menu.png'))
    play(pg, 's1')
    check(ST(pg)['phase'] == 'pick', 'a stage starts with "Pick your hero"')
    pg.screenshot(path=str(OUT / 'quest-pick.png'))
    at = view(pg)
    pg.mouse.click(*at(480, 300)); pg.wait_for_timeout(300)              # the middle card
    s = ST(pg)
    check(s['phase'] == 'play' and s['hero'] == 'ranger', f"tapping the middle card picks the Ranger ({s['hero']})")
    check(pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.v1')).games.quest.data.hero") == 'ranger', 'the hero is remembered')

    # ---- walking, bonking, a jar, a potion ----
    pg.mouse.move(*at(330, 400)); pg.mouse.down(); pg.wait_for_timeout(1300); pg.mouse.up()
    s2 = ST(pg)
    check(s2['x'] > s['x'] + 100 and abs(s2['y'] - 400) < 12, f"touch the ground: the hero walks there ({s['x']},{s['y']} -> {s2['x']},{s2['y']})")
    pg.keyboard.press('Space'); pg.wait_for_timeout(500)                 # the first jar is right there (x 380)
    pg.keyboard.down('ArrowRight'); pg.wait_for_timeout(500); pg.keyboard.up('ArrowRight'); pg.wait_for_timeout(300)
    check(ST(pg)['potions'] == 1, f"bonk the jar, walk over the potion: 1 potion ({ST(pg)['potions']})")

    # ---- magic ----
    pg.evaluate('__questGive(5); __questWave(0); __questBot(true, 1)')
    pg.wait_for_function('__questState().locked && __questState().foes >= 2', timeout=20000)
    pg.evaluate('__questBot(false)')
    before = ST(pg)
    pg.keyboard.press('KeyX'); pg.wait_for_timeout(700)
    pg.screenshot(path=str(OUT / 'quest-magic.png'))
    pg.wait_for_timeout(1300)
    after = ST(pg)
    check(after['potions'] == 0 and after['spell'] == 3, f"magic: 5 potions = the biggest spell, and they are all used ({after['spell']})")
    check(after['poofed'] >= before['poofed'] + 2, f"magic: the baddies on the screen poof ({before['foes']} -> {after['foes']})")

    # ---- the bot wins every stage, one hero each ----
    for sid, hero, name in [('s1', 0, 'Knight'), ('s2', 1, 'Ranger'), ('s3', 2, 'Wizard')]:
        st, n = bot_stage(pg, sid, hero)
        check(st['won'] and st['hero'] == ['knight', 'ranger', 'wizard'][hero], f"{sid}: the bot wins with the {name} ({st['poofed']} poofs, {st['hearts']}/{st['maxHearts']} hearts, try {n})")
        pg.wait_for_timeout(3600)
        if sid == 's1':
            pg.screenshot(path=str(OUT / 'quest-win.png'))
            # "Next" keeps your hero and your potions (no "Pick your hero" in between)
            pg.locator('.ar-results .ar-btn', has_text='Next').click(); pg.wait_for_timeout(2600)
            nx = ST(pg)
            check(nx['stage'] == 's2' and nx['phase'] == 'play' and nx['hero'] == 'knight' and nx['potions'] == st['potions'],
                  f"Next: the Knight and the {st['potions']} potions carry on into the Woods ({nx['hero']}, {nx['potions']})")
    save = pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.v1')).games.quest")
    check(all(save['levels'].get(k, {}).get('done') for k in ['s1', 's2', 's3']), 'all 3 stages saved as done')
    check('king' in save['achievements'] and 'team' in save['achievements'], f"trophies: the Blob King + every hero won ({save['achievements']})")

    # ---- out of hearts: "Nice try!", and Again starts at the same wave ----
    play(pg, 's2'); pg.evaluate('__questPick(0); __questWave(2)')
    pg.evaluate('__questBot(true, 1)'); pg.wait_for_function('__questState().locked', timeout=20000); pg.evaluate('__questBot(false)')
    pg.screenshot(path=str(OUT / 'quest-fight.png'))
    pg.wait_for_function('__questState().lost', timeout=90000)             # (just standing there)
    pg.wait_for_timeout(2600)
    check(pg.locator('.ar-results.lose').count() == 1, 'no hearts left: a gentle "Nice try!"')
    pg.evaluate('__game.restart()'); pg.wait_for_timeout(2400)
    s = ST(pg)
    check(s['phase'] == 'play' and s['wave'] == 2 and s['hearts'] == s['maxHearts'] and s['x'] > 1000, f"Again: back at wave 3 with full hearts (wave {s['wave'] + 1}, x {s['x']})")

    # ---- a little kid ----
    big = s['maxHearts']
    fresh(pg, little=True); play(pg, 's1'); pg.evaluate('__questPick(0)')
    lit = ST(pg)
    check(lit['maxHearts'] > big, f"little kid: more hearts ({lit['maxHearts']} > {big})")
    at = view(pg)
    pg.mouse.move(*at(900, 440)); pg.mouse.down()                        # one finger held on the right: walk right
    pg.wait_for_function('__questState().poofed >= 1 || __questState().lost', timeout=60000)
    pg.mouse.up()
    check(ST(pg)['poofed'] >= 1, 'little kid: one finger held to walk right, the hero bonks by itself and poofs a blob')

    # ---- phone held sideways ----
    ph = b.new_page(viewport={'width': 844, 'height': 390}, has_touch=True, is_mobile=True)
    ph.on('pageerror', lambda e: errors.append('phone: ' + str(e)))
    fresh(ph); play(ph, 's1'); ph.evaluate('__questPick(2)'); ph.wait_for_timeout(400)
    box = ph.locator('canvas').first.bounding_box()
    btns = ph.evaluate("[...document.querySelectorAll('button')].filter(b => ['Bonk', 'Magic'].includes(b.getAttribute('aria-label')) && b.getBoundingClientRect().width > 0).map(b => Math.round(b.getBoundingClientRect().width))")
    check(box['x'] >= 0 and box['x'] + box['width'] <= 845 and box['y'] + box['height'] <= 391, f"phone sideways: the game fits ({round(box['width'])} x {round(box['height'])})")
    check(len(btns) == 2 and min(btns) >= 56, f'phone: big Bonk and Magic buttons ({btns})')
    ph.screenshot(path=str(OUT / 'quest-phone.png'))

    check(not errors, f'no JavaScript errors ({errors})')
    b.close()

print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
