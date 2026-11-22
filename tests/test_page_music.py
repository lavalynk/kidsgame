"""Automated test: music for the coloring book and the maze (Nov 22).

Run:  python3 tests/test_page_music.py

For each page (coloring/, maze/):
* there is a music button, and the music is OFF until it's tapped (no song plays on a fresh save)
* tapping it plays the page's own song (the arcade's band really plays it: the beat moves on)
* the choice is saved for this player: after a reload the button is still on and the song starts with the first touch
* tapping again stops it; another player keeps their own setting
* it plays even if the player switched the arcade music off on the hub (they asked for it here)
* the maze's dark caves make the music sound far away (muffled)
* desktop + phone (upright and sideways): the button is on screen and big enough, no errors (screenshots in tests/out/)
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu as cm
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

# where the arcade's band is in its song (moves on while a song plays)
STEP = "(() => { const t = Arcade.audio.track; return t && !t.paused ? t.step + t.idx * 0.001 + (t.phase === 'body' ? 1e6 : 0) : -1; })()"
PAGES = {
    'coloring': (ROOT / 'coloring' / 'index.html').as_uri() + '#cat',
    'maze': (ROOT / 'maze' / 'index.html').as_uri(),
}
with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    for name, url in PAGES.items():
        ctx = b.new_context(viewport={'width': 1280, 'height': 800})
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(f'{name}: {e}'))
        pg.on('console', lambda m: m.type == 'error' and errors.append(f'{name}: {m.text}'))
        pg.goto(url); pg.wait_for_timeout(1500)
        M = lambda: pg.evaluate('__pageMusic()')
        btn = pg.locator('#musicBtn')
        check(btn.is_visible(), f'{name}: the music button is there')
        check(M() == {'saved': False, 'playing': False}, f'{name}: music is off on a fresh save')
        check(btn.get_attribute('aria-pressed') == 'false', f'{name}: the button shows "off"')
        pg.mouse.click(5, 400); pg.wait_for_timeout(600)          # a touch somewhere else doesn't start it
        check(not M()['playing'], f'{name}: a tap elsewhere does not start the music')
        btn.click(); pg.wait_for_timeout(1500)
        m = M()
        check(m['saved'] and m['playing'], f'{name}: tapping the button plays the song ({m})')
        a = pg.evaluate(STEP); pg.wait_for_timeout(900); b2 = pg.evaluate(STEP)
        check(a >= 0 and b2 > a, f'{name}: the band is playing (step {a} -> {b2})')
        song = pg.evaluate("Arcade.audio.track.song.tempo")
        check(song == {'coloring': 88, 'maze': 104}[name], f'{name}: it is the page\'s own song (tempo {song})')
        check(pg.evaluate("Arcade.audio.musicGain.gain.value") > 0.1, f'{name}: the music is loud enough to hear')
        check(btn.get_attribute('aria-pressed') == 'true', f'{name}: the button shows "on"')
        pg.screenshot(path=str(OUT / f'page_music_{name}.png'))

        # saved: reload, the first touch starts it again
        pg.reload(); pg.wait_for_timeout(1500)
        check(M()['saved'] and btn.get_attribute('aria-pressed') == 'true', f'{name}: "on" is remembered after a reload')
        pg.mouse.click(5, 400); pg.wait_for_timeout(1200)
        check(M()['playing'], f'{name}: the first touch starts the saved music')

        # off again
        btn.click(); pg.wait_for_timeout(900)
        check(M() == {'saved': False, 'playing': False}, f'{name}: tapping again stops it')
        pg.wait_for_timeout(700)
        check(pg.evaluate("!Arcade.audio.track || Arcade.audio.track.gain.gain.value < 0.05"), f'{name}: the song faded away')

        # the hub's music switch is off for this player: the page's button still plays (they asked for it here)
        pg.evaluate("Arcade.store.settings().musicOn = false; Arcade.store.save()")
        pg.reload(); pg.wait_for_timeout(1200)
        btn.click(); pg.wait_for_timeout(1200)
        check(M()['playing'] and pg.evaluate("Arcade.audio.musicGain.gain.value") > 0.1, f'{name}: plays even with the hub music switched off')
        pg.evaluate("Arcade.store.settings().muted = true; Arcade.store.save(); Arcade.audio.applyVolumes()")
        check(pg.evaluate("Arcade.audio.master.gain.value") == 0, f'{name}: "all sound off" still makes it quiet')
        pg.evaluate("Arcade.store.settings().muted = false; Arcade.store.settings().musicOn = true; Arcade.store.save()")

        # another player has their own setting
        pg.evaluate("(() => { const p = Arcade.profiles; const id = p.add ? p.add({ name: 'Two', animal: 'fox' }) : null; if (id) p.use(typeof id === 'object' ? id.id : id); })()")
        pg.reload(); pg.wait_for_timeout(1200)
        other = pg.evaluate("Arcade.profiles.active().id")
        if other != 'p1':
            check(not M()['saved'], f'{name}: another player starts with music off')
        else:
            print(f'  (skip: could not add a second player on {name})')

        # the maze: dark caves muffle the music
        if name == 'maze':
            btn.click(); pg.wait_for_timeout(800)
            pg.evaluate("musicMood && (fogHoles = fogHoles || {}, musicMood())")
            pg.wait_for_timeout(800)
            f = pg.evaluate("Arcade.audio.bus.lp.frequency.value")
            check(f < 5000, f'maze: in a dark cave the music is muffled (filter {f:.0f} Hz)')
            pg.evaluate("fogHoles = null; musicMood()"); pg.wait_for_timeout(900)
            f = pg.evaluate("Arcade.audio.bus.lp.frequency.value")
            check(f > 15000, f'maze: outside the cave it is bright again ({f:.0f} Hz)')
        ctx.close()

    # the coloring picker (a canvas menu) has the same music switch at the bottom
    ctx = b.new_context(viewport={'width': 1280, 'height': 800})
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(f'picker: {e}'))
    pg.goto((ROOT / 'coloring' / 'index.html').as_uri()); cm.wait_screen(pg, 'coloring-pick'); pg.wait_for_timeout(600)
    m = cm.find(pg, 'music')
    check(m is not None and not m.get('picked'), 'picker: a music button at the bottom (off)')
    cm.tap(pg, 'music'); pg.wait_for_timeout(1300)
    check(pg.evaluate('__pageMusic()')['playing'], 'picker: tapping it plays the coloring song')
    cm.tap(pg, 'tab-gallery'); pg.wait_for_timeout(500)
    check(cm.find(pg, 'music') is not None, 'picker: the music button is in My pictures too')
    pg.evaluate("location.hash = '#cat'"); pg.wait_for_timeout(900)
    check(pg.locator('#musicBtn').get_attribute('aria-pressed') == 'true' and pg.evaluate('__pageMusic()')['playing'],
          'picker -> a page: the music keeps playing, the page button shows "on"')
    pg.locator('#musicBtn').click(); pg.wait_for_timeout(300)
    ctx.close()

    # phones: the button is on screen and big enough (upright and sideways)
    for name, url in PAGES.items():
        for vp in ({'width': 320, 'height': 568}, {'width': 390, 'height': 844}, {'width': 844, 'height': 390}, {'width': 1024, 'height': 768}):
            ctx = b.new_context(viewport=vp, has_touch=True, is_mobile=vp['width'] < 900)
            pg = ctx.new_page()
            pg.on('pageerror', lambda e: errors.append(f'{name}: {e}'))
            pg.goto(url); pg.wait_for_timeout(1300)
            r = pg.locator('#musicBtn').bounding_box()
            ok = r and r['x'] >= 0 and r['y'] >= 0 and r['x'] + r['width'] <= vp['width'] and r['y'] + r['height'] <= vp['height'] and r['width'] >= 40
            # nothing in the top bar overlaps the music button
            over = pg.evaluate("""(() => { const m = document.getElementById('musicBtn').getBoundingClientRect();
              return [...document.querySelectorAll('.round-btn, .ar-back')].filter(e => e.id !== 'musicBtn' && e.offsetParent).some(e => {
                const r = e.getBoundingClientRect(); return r.width && r.left < m.right - 1 && r.right > m.left + 1 && r.top < m.bottom - 1 && r.bottom > m.top + 1; }); })()""")
            check(ok and not over, f'{name} {vp["width"]}x{vp["height"]}: the music button is on screen, {r and round(r["width"])} px, nothing on top of it')
            if vp['width'] in (320, 844): pg.screenshot(path=str(OUT / f'page_music_{name}_{vp["width"]}.png'))
            ctx.close()
    b.close()

check(not errors, 'no JavaScript errors' + ('' if not errors else ': ' + '; '.join(errors[:4])))
print('ALL PASSED' if not fails else f'{len(fails)} FAILED')
sys.exit(1 if fails else 0)
