"""How long each game takes to draw one picture (Nov 24, new plan point 9 part 2: a steady frame rate on older tablets).

Run:  python3 tools/frametime.py              (every arcade game, ~2 min)
      python3 tools/frametime.py bike rc      (just these)
      python3 tools/frametime.py --slow 4     (pretend the computer is 4 times slower, like an older tablet; default 1 = steadier numbers)
      python3 tools/frametime.py --size 1920x1080   (a bigger screen = more pixels to paint)

Each game is started from its menu (the first level), a pretend child plays where the game has one (so things
happen on the screen), and after a few seconds the kit's counters (`Arcade.perf.cost()`) say how many milliseconds
one picture took (average + the worst one) and one game step. A picture has to be done in about 16 ms for 60 a
second; on an older tablet everything takes several times longer, so the slow-down makes the numbers look like one.
Also prints `lite` = whether the game already had to switch to its lite drawing (fewer pixels) to keep up.
Writes tests/out/frametime.json.
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / 'tests'))
import cmenu as cm
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)

# the pretend child (or bot) each game has, turned on once the game runs (see tools/playtest.py)
BOTS = {
    'bike': '__bikeKid(true, 1)', 'rc': '__rcKid(true, 1)', 'hoops': '__hoopsKid(true, 1)',
    'golf': '__golfBot && __golfBot(true)', 'archery': '__archeryKid(true, 1)', 'jungle': "__jungleBot('kid', false, null, 1)",
    'trail': '__trailBot(true, 1, false)', 'quest': "__questPick(0); __questBot('kid', 1)", 'space': '__spaceTest.kid(true, 1)',
    'abc': '__abcKid(true, 1)', 'fishing': '__fishingKid(true, 1)', 'piano': '',
}
GAMES = list(BOTS)

def measure(pw, game, slow, size, secs=5):
    b = pw.chromium.launch()
    pg = b.new_page(viewport=size)
    errors = []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto((ROOT / game / 'index.html').as_uri())
    pg.evaluate("localStorage.clear()"); pg.reload()
    cm.to_title(pg)
    if game == 'rc':                                    # (RC has its own main menu: Race -> the first track)
        cm.click(pg, '[data-menu=free]'); pg.wait_for_timeout(400)
        cm.tap(pg, cm.attrs(pg, 'track-')[0])
    else:
        cm.tap(pg, 'start')
    cm.into_game(pg)
    pg.wait_for_function("__game.state === 'play'", timeout=10000)
    bot = BOTS.get(game)
    if bot:
        try: pg.evaluate(f'(() => {{ {bot}; }})()')
        except Exception as e: print(f'  ({game}: no bot: {str(e)[:60]})')
    pg.evaluate('__game.setLite && (window.__startLite = __game.lite())')
    cdp = pg.context.new_cdp_session(pg)
    if slow > 1: cdp.send('Emulation.setCPUThrottlingRate', {'rate': slow})
    pg.wait_for_timeout(800)
    pg.evaluate('Arcade.perf.flush = true; Arcade.perf.reset()')
    pg.wait_for_timeout(int(secs * 1000))
    c = pg.evaluate('Object.assign(Arcade.perf.cost(), { lite: __game.lite(), state: __game.state })')
    if slow > 1: cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1})
    pg.screenshot(path=str(OUT / f'frametime-{game}.png'))
    b.close()
    c['errors'] = errors[:3]
    return c

if __name__ == '__main__':
    args = sys.argv[1:]
    slow, size = 1, {'width': 1280, 'height': 800}
    if '--slow' in args: i = args.index('--slow'); slow = float(args[i + 1]); del args[i:i + 2]
    if '--size' in args:
        i = args.index('--size'); w, h = args[i + 1].split('x'); size = {'width': int(w), 'height': int(h)}; del args[i:i + 2]
    games = args or GAMES
    out = {}
    with sync_playwright() as pw:
        print(f'{"game":10} {"draw ms":>8} {"worst":>7} {"step ms":>8} {"pictures":>8}  lite  (slow-down x{slow:g}, {size["width"]}x{size["height"]})')
        for gname in games:
            try: c = measure(pw, gname, slow, size)
            except Exception as e:
                print(f'{gname:10} failed: {str(e)[:100]}'); continue
            out[gname] = c
            print(f'{gname:10} {c["draw"]:8.2f} {c["worst"]:7.1f} {c["step"]:8.3f} {c["draws"]:8d}  {c["lite"]}  {c["state"]} {c["errors"] or ""}', flush=True)
    (OUT / 'frametime.json').write_text(json.dumps(out, indent=1))
