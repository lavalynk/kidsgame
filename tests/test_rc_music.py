"""Automated test: Mini RC Racers music follows the race.

Run:  python3 tests/test_rc_music.py
Drives a whole race on autopilot and checks: quiet music in the countdown, the band
comes in at Go!, boosting = all-out music, the last lap speeds the music up, and taking
the lead moves the music up a key.
"""
import sys, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1280, 'height': 760})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto((ROOT / 'rc' / 'index.html').as_uri()); pg.evaluate('localStorage.clear()'); pg.reload(); pg.wait_for_timeout(400)
    pg.mouse.click(640, 380); pg.wait_for_timeout(700)
    pg.click('button:has-text("Free Play")'); pg.wait_for_timeout(500)
    pg.locator('button').filter(has_text='Backyard').first.click(); pg.wait_for_timeout(300)
    pg.wait_for_function('typeof __rcStep === "function"')
    check(pg.evaluate('Arcade.audio.mood.energy') < 0.5, 'countdown: quiet music')
    pg.evaluate('__rcAuto(true); __rcStep(3.5)')
    check(pg.evaluate('Arcade.audio.mood.energy') >= 1, 'Go!: the whole band comes in (all-out with a rocket start)')
    pg.evaluate("__rcGive('boost')"); pg.keyboard.press('Space'); pg.evaluate('__rcStep(0.3)')
    boosted = pg.evaluate('Arcade.audio.mood.energy')
    check(boosted == 2, f'boost: all-out music (energy {boosted})')
    keys, tempos = set(), set()
    for _ in range(120):
        st = pg.evaluate('__rcState()')
        if st.get('over') or st.get('finished'): break
        pg.evaluate('__rcStep(1)')
        keys.add(pg.evaluate('Arcade.audio.mood.key')); tempos.add(pg.evaluate('Arcade.audio.mood.tempo'))
    check(1.07 in tempos, f'last lap: music speeds up (tempos seen {sorted(tempos)})')
    check(2 in keys, f'taking the lead: music goes up a key (keys seen {sorted(keys)})')
    pg.wait_for_timeout(300)
    b.close()
check(not errors, 'no JavaScript errors' + ('' if not errors else ': ' + '; '.join(errors[:3])))
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
sys.exit(1 if fails else 0)
