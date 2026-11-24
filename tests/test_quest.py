"""Automated test: Potion Quest (the walk-along adventure).

Run:  python3 tests/test_quest.py
Checks:
  * title = a picture; 4 places in the picker (only the Meadow open); "Pick your hero" shows 3 heroes
  * tapping a hero card picks it; touching the ground walks the hero there; Space bonks; a jar gives a potion
  * the magic button uses every potion for one spell (more potions = a bigger spell) and hits the baddies
  * the game's own bot wins the Meadow with the Knight, the Woods with the Ranger and the Castle (with the
    Blob King) with the Wizard: so every hero and every baddie really works
  * Frosty Peak (Nov 22): a snowman's snowball shows its lane first, then rolls; it bumps a hero who stands in it,
    a bonk breaks it; the Frosty King loses a snowball every third (3 -> 2 -> 1); the bot beats him with the Knight
  * pressing Next after a win keeps the same hero and the potions
  * out of hearts = "Nice try!", and "Again" starts at the SAME wave (not the beginning)
  * a little kid gets more hearts and bonks without pressing anything
  * phone held sideways: the game fits, with a Bonk and a Magic button; no JavaScript errors
  * Nov 20: the game runs on Phaser 3 (the hero, the baddies and the pickups are Phaser bodies), the menus are drawn by Phaser
Screenshots land in tests/out/ (quest-*.png).
"""
import sys, json, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu as cm                      # (the menus are drawn by Phaser + Rex UI since Nov 20)
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
    cm.wait_screen(pg)
    check(cm.screen(pg) == 'tap', 'title screen = a big Play picture, no words (drawn by Phaser)')
    pg.screenshot(path=str(OUT / 'quest-title.png'))
    cm.to_title(pg); cm.tap(pg, 'levels'); cm.wait_screen(pg, 'levels')
    tiles = [i for i in cm.items(pg) if i['attr'].startswith('level-')]
    check(len(tiles) == 4 and sum(1 for t in tiles if t['locked']) == 3, 'picker: 4 places, only the Meadow open')
    pg.screenshot(path=str(OUT / 'quest-menu.png'))
    play(pg, 's1')
    check(ST(pg)['phase'] == 'pick', 'a stage starts with "Pick your hero"')
    eng = pg.evaluate('__questTest.engine()')
    check(eng['ready'] and eng['phaser'].startswith('3.'), f"the game runs on Phaser {eng['phaser']}")
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
    eng = pg.evaluate('__questTest.engine()')
    check(eng['bodies'] >= 1, f"the hero is a Phaser body ({eng})")

    # ---- magic ----
    pg.evaluate('__questGive(5); __questWave(0); __questBot(true, 1)')
    pg.wait_for_function('__questState().locked && __questState().foes >= 2', timeout=20000)
    pg.evaluate('__questBot(false)')
    before = ST(pg)
    eng = pg.evaluate('__questTest.engine()')
    check(eng['foes'] >= 2, f"the baddies are Phaser bodies ({eng['foes']} in the world)")
    # Phaser keeps them apart: no two baddies on the ground in the same spot
    pg.wait_for_timeout(1500)
    apart = pg.evaluate("""(() => { const z = __questTest.spots(); let ok = true;
      for (let i = 0; i < z.length; i++) for (let j = i + 1; j < z.length; j++) if (Math.abs(z[i].x - z[j].x) < 6 && Math.abs(z[i].y - z[j].y) < 4) ok = false; return ok; })()""")
    check(apart, 'baddies never stand in the same spot')
    before = ST(pg)
    pg.keyboard.press('KeyX'); pg.wait_for_timeout(700)
    pg.screenshot(path=str(OUT / 'quest-magic.png'))
    pg.wait_for_timeout(1300)
    after = ST(pg)
    check(after['potions'] == 0 and after['spell'] == 3, f"magic: 5 potions = the biggest spell, and they are all used ({after['spell']})")
    check(after['poofed'] >= before['poofed'] + 2, f"magic: the baddies on the screen poof ({before['foes']} -> {after['foes']})")

    # ---- the bot wins every stage, one hero each ----
    for sid, hero, name in [('s1', 0, 'Knight'), ('s2', 1, 'Ranger'), ('s3', 2, 'Wizard'), ('s4', 0, 'Knight')]:
        st, n = bot_stage(pg, sid, hero)
        check(st['won'] and st['hero'] == ['knight', 'ranger', 'wizard'][hero], f"{sid}: the bot wins with the {name} ({st['poofed']} poofs, {st['hearts']}/{st['maxHearts']} hearts, try {n})")
        pg.wait_for_timeout(3600)
        if sid == 's1':
            pg.screenshot(path=str(OUT / 'quest-win.png'))
            # "Next" keeps your hero and your potions (no "Pick your hero" in between)
            cm.wait_screen(pg, 'results'); cm.tap(pg, 'next'); pg.wait_for_timeout(2600)
            nx = ST(pg)
            check(nx['stage'] == 's2' and nx['phase'] == 'play' and nx['hero'] == 'knight' and nx['potions'] == st['potions'],
                  f"Next: the Knight and the {st['potions']} potions carry on into the Woods ({nx['hero']}, {nx['potions']})")
    save = pg.evaluate("JSON.parse(localStorage.getItem('kidsArcade.v1')).games.quest")
    check(all(save['levels'].get(k, {}).get('done') for k in ['s1', 's2', 's3', 's4']), 'all 4 stages saved as done')
    check('king' in save['achievements'] and 'team' in save['achievements'] and 'frosty' in save['achievements'],
          f"trophies: the Blob King + the Frosty King + every hero won ({save['achievements']})")

    # ---- Frosty Peak: snowballs + the Frosty King ----
    play(pg, 's4'); pg.evaluate('__questPick(0); __questWave(0); __questBot(true, 1)')
    pg.wait_for_function('__questState().balls.length > 0', timeout=75000)   # (the bot sometimes poofs the first snowmen before they throw)
    pg.evaluate('__questBot(false)')
    b0 = ST(pg)['balls'][0]
    check(not b0['rolling'], f"a snowman's snowball waits first (its blue lane shows where it will roll)")
    pg.screenshot(path=str(OUT / 'quest-snow.png'))
    # just stand there: the snowman lines up with the hero's row and its snowball rolls in and bumps the hero
    pg.wait_for_function('__questState().ballHits >= 1 || __questState().lost', timeout=45000)
    check(ST(pg)['ballHits'] >= 1, 'standing in the lane: the snowball rolls in and bumps the hero (one heart)')
    pg.evaluate('__game.restart()'); pg.wait_for_timeout(2400); pg.evaluate('__questPick(0)')
    # the bot steps out of the lanes and bonks the snowballs: a whole wave with balls, try 3 times
    pg.evaluate('__questBot(true, 1)')
    pg.wait_for_function('__questState().wave >= 1 || __questState().lost', timeout=90000)
    check(ST(pg)['wave'] >= 1, 'the bot clears the first snowy wave (dodging the lanes)')
    pg.evaluate('__questWave(5); __questBot(true, 1)')
    pg.wait_for_function("__questState().bossType == 'snowking'", timeout=30000)
    pg.wait_for_timeout(2500); pg.evaluate('__questBot(false)')
    k = [ST(pg)['bossBalls']]
    pg.evaluate('__questTest.hurtBoss(12)'); pg.wait_for_timeout(300); k.append(ST(pg)['bossBalls'])
    pg.evaluate('__questTest.hurtBoss(11)'); pg.wait_for_timeout(300); k.append(ST(pg)['bossBalls'])
    check(k == [3, 2, 1], f"the Frosty King gets shorter: 3 -> 2 -> 1 snowballs ({k})")
    pg.screenshot(path=str(OUT / 'quest-frosty-king.png'))

    # ---- out of hearts: "Nice try!", and Again starts at the same wave ----
    play(pg, 's2'); pg.evaluate('__questPick(0); __questWave(2)')
    pg.evaluate('__questBot(true, 1)'); pg.wait_for_function('__questState().locked', timeout=20000); pg.evaluate('__questBot(false)')
    pg.screenshot(path=str(OUT / 'quest-fight.png'))
    pg.wait_for_function('__questState().lost', timeout=90000)             # (just standing there)
    pg.wait_for_timeout(2600)
    cm.wait_screen(pg, 'results')
    res = pg.evaluate('ArcadeMenus.current().result')
    check(res and not res['win'] and 'again' in [i['attr'] for i in cm.items(pg)], 'no hearts left: a gentle "Nice try!" with Again')
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
