"""Automated test: Space Defender, played by a bot.

Run:  python3 tests/test_space.py          (all 10 sectors + the Chimera, ~3 min)
      python3 tests/test_space.py s1 s4    (just some)

A simple bot flies the ship toward whatever it should bubble, grabs presents and
weapon capsules, and keeps firing. With "god mode" on (no bonks) it checks that
every sector runs start to finish:
  waves -> mini boss -> checkpoint + present -> waves -> big boss -> clear
and that each sector takes about 1-2 minutes. The Chimera fight must go through
all 4 phases and end with the win. Then a few quick checks: every one of the 20
weapons fires and bubbles things, a lost life after the mini boss offers the
checkpoint, and nothing throws an error. Screenshots land in tests/out/.
"""
import sys, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

# one bot "tick": steer toward the target, grab capsules, then run the game 0.1 s
BOT = """() => {
  const T = __spaceTest, p = T.peek(), s = __spaceState();
  let ty = s.y, tx = 200;
  if (p.capsules.length) { ty = p.capsules[0][1]; tx = Math.min(520, p.capsules[0][0]); }
  else if (p.target) ty = p.target.y;
  else if (p.enemies.length) { const e = p.enemies.reduce((a, b) => a[0] < b[0] ? a : b); ty = e[1]; }
  const dy = Math.max(-34, Math.min(34, ty - s.y)), dx = Math.max(-34, Math.min(34, tx - s.x));
  T.nudge(dx, dy);
  T.step(0.1);
  return s.phase;
}"""

def start(page, which):
    page.evaluate("__game.save.data.autofire = true")      # (on a desktop at Normal you press Space; the bot can't)
    page.evaluate("(id) => { const all = SpaceData.SECTORS.concat([SpaceData.FINAL, SpaceData.ENDLESS]); __game.play(all.find(s => s.id === id)); }", which)
    page.wait_for_function('typeof __spaceTest === "object"')
    page.evaluate('__spaceTest.god(true)')

with sync_playwright() as pw:
    b = pw.chromium.launch()
    page = b.new_page(viewport={'width': 1280, 'height': 720})
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto((ROOT / 'space' / 'index.html').as_uri())
    page.evaluate('localStorage.clear()'); page.reload(); page.wait_for_timeout(600)
    want = sys.argv[1:] or ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 'chimera']
    for sid in want:
        start(page, sid)
        seen, mini_t, boss_t, t = [], None, None, 0
        while t < 400:
            ph = page.evaluate(BOT); t += 0.1
            st = page.evaluate('__spaceState()')
            if not seen or seen[-1] != ph: seen.append(ph)
            if st['boss'] and st['boss']['kind'] == 'mini' and mini_t is None: mini_t = round(st['time'])
            if st['boss'] and st['boss']['kind'] == 'big' and boss_t is None: boss_t = round(st['time'])
            if sid == 'chimera' and st['chimera'] and st['chimera']['phase'] == 1 and not any(x == 'shot1' for x in seen):
                seen.append('shot1'); page.screenshot(path=str(OUT / 'space-chimera-goat.png'))
            if st['finished'] or page.evaluate('__game.state') == 'over': break
            if t > 30 and sid != 'chimera' and not any(x == 'shot0' for x in seen):
                seen.append('shot0'); page.screenshot(path=str(OUT / f'space-{sid}.png'))
        st = page.evaluate('__spaceState()')
        if sid == 'chimera':
            check(st['finished'] and st['chimera']['beaten'], f'chimera: all 4 phases beaten in {t:.0f} s (phases: {" > ".join(x for x in seen if not x.startswith("shot"))})')
        else:
            flow = [x for x in seen if not x.startswith('shot')]
            ok = st['finished'] and 'breather' in flow and mini_t is not None and boss_t is not None
            check(ok, f'{sid}: {t:.0f} s, mini boss at {mini_t} s, big boss at {boss_t} s, weapon {st["weapon"]["id"]} lv{st["weapon"]["lv"]}, found {len(st["found"])}')
            check(55 <= t <= 150, f'{sid}: length {t:.0f} s is about 1-2 minutes')
        page.wait_for_timeout(1500)
        page.screenshot(path=str(OUT / f'space-{sid}-end.png'))

    # every weapon fires and bubbles a rock in front of it
    if not sys.argv[1:]:
        start(page, 's1')
        page.evaluate('__spaceTest.step(2.5)')
        ws = page.evaluate("SpaceData && __spaceTest.weapons()")
        for w in ws:
            r = page.evaluate("""(w) => { const T = __spaceTest; T.clear(); T.weapon(w, 2); T.rock(); for (let i = 0; i < 30; i++) T.step(0.1); return T.rockHp(); }""", w)
            check(r < 1, f'weapon {w} bubbles things (rock hp left {r:.1f})')
        page.screenshot(path=str(OUT / 'space-weapons.png'))
        # lose after the mini boss -> the "Checkpoint" button
        start(page, 's1')
        page.evaluate("__spaceTest.god(false); __spaceTest.skipToPart2()")
        for _ in range(12):
            if page.evaluate('__game.state') == 'over': break
            page.evaluate('__spaceTest.bonk(); __spaceTest.step(2.1)')
        page.wait_for_timeout(1800)
        check(page.locator('button:has-text("Checkpoint")').count() == 1, 'losing after the mini boss offers the checkpoint')
        page.click('button:has-text("Checkpoint")'); page.wait_for_timeout(500)
        st = page.evaluate('__spaceState()')
        check(st['part'] == 2 and st['checkpoint'] == 1, 'checkpoint: starts again after the mini boss')
    b.close()
check(not errors, 'no JavaScript errors' + ('' if not errors else ': ' + '; '.join(errors[:3])))
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
sys.exit(1 if fails else 0)
