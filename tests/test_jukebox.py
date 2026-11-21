"""Automated test: the Jukebox (jukebox/): every song in the arcade, the dancer, the mix buttons, the drum pads.

Run:  python3 tests/test_jukebox.py

* jukebox/songs.js is up to date with the games' own songs (tools/make_jukebox.py).
* The hub's bar has the jukebox button and it opens the page.
* Every song tile plays its song (the arcade's band really plays it, and the dancer follows the beat).
* The mix buttons change the music (slow / fast / high / party / under water); slow and fast can't both be on.
* The drum pads make sound right on the beat (the next 16th note of the song).
* The Jukebox plays even when this player switched the background music off; "all sound off" still wins.
* Sideways and upright, desktop and phone: no errors, pictures on screen (screenshots in tests/out/).
"""
import sys, pathlib, subprocess
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu as cm
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

# 1) songs.js is what the tool makes from the games right now
sys.path.insert(0, str(ROOT / 'tools'))
import make_jukebox
check(make_jukebox.build() == (ROOT / 'jukebox' / 'songs.js').read_text(), 'jukebox/songs.js is up to date (run python3 tools/make_jukebox.py)')

JUKE = (ROOT / 'jukebox' / 'index.html').as_uri()
with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    def page(vp, url=JUKE, touch=False):
        ctx = b.new_context(viewport=vp, has_touch=touch, is_mobile=touch)
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and errors.append(m.text))
        pg.goto(url); pg.wait_for_timeout(1200)
        return pg

    # 2) the hub's jukebox button
    pg = page({'width': 1280, 'height': 800}, (ROOT / 'index.html').as_uri())
    cm.wait_screen(pg, 'hub')
    check(cm.find(pg, 'juke') is not None, 'the hub bar has the jukebox button')
    cm.tap(pg, 'juke'); pg.wait_for_timeout(1200)
    check(pg.url.endswith('jukebox/index.html'), 'the jukebox button opens the Jukebox')
    cm.wait_screen(pg, 'jukebox')
    J = lambda: pg.evaluate('__jukebox()')
    n = J()['songs']
    check(n >= 40, f'{n} songs in the Jukebox')
    tiles = [i['attr'] for i in cm.items(pg) if i['attr'].startswith('song-')]
    check(len(tiles) == n, 'a tile for every song')
    for a in ['stage', 'pad-boom', 'pad-clap', 'pad-ding', 'pad-tada', 'mix-slow', 'mix-fast', 'mix-high', 'mix-party', 'mix-water', 'home', 'stop', 'dice']:
        check(cm.find(pg, a) is not None, f'{a} is on the screen')
    check(J()['beat'] is None, 'nothing plays until a song is picked (the dancer sleeps)')

    # 3) every song plays (tap each tile for real; the song's band starts and the beat moves on)
    bad = []
    for a in tiles:
        cm.tap_shown(pg, a); pg.wait_for_timeout(120)
        s = J()
        if s['playing'] != a[5:] or not s['track']: bad.append(a)
    check(not bad, f'every song tile plays its song {bad[:5]}')
    pg.wait_for_timeout(900)
    b1 = J()['beat']; pg.wait_for_timeout(700); b2 = J()['beat']
    check(b1 is not None and b2 > b1, f'the beat moves on while a song plays ({b1} -> {b2})')
    check(J()['level'] > 0.02, f'the bars jump with the sound (level {J()["level"]:.3f})')
    picked = [i['attr'] for i in cm.items(pg) if i.get('picked') and i['attr'].startswith('song-')]
    check(picked == ['song-' + J()['playing']], 'the playing song is the yellow tile')

    # 4) the mix buttons
    cm.tap_shown(pg, 'mix-slow'); check(abs(J()['mood']['tempo'] - 0.78) < 1e-6, 'turtle = slower')
    cm.tap_shown(pg, 'mix-fast'); s = J()
    check(s['mood']['tempo'] > 1.2 and not s['mix']['slow'], 'rabbit = faster (and the turtle switches off)')
    cm.tap_shown(pg, 'mix-fast'); check(J()['mood']['tempo'] == 1, 'rabbit again = normal speed')
    cm.tap_shown(pg, 'mix-high'); check(J()['mood']['key'] == 7, 'high = the song goes up')
    cm.tap_shown(pg, 'mix-party'); check(J()['mood']['energy'] == 2, 'disco ball = party (all-out drums)')
    cm.tap_shown(pg, 'mix-water'); check(J()['mood']['muffle'] > 0.5, 'bubbles = under water')
    on = [i['attr'] for i in cm.items(pg) if i.get('picked') and i['attr'].startswith('mix-')]
    check(sorted(on) == ['mix-high', 'mix-party', 'mix-water'], f'the mix buttons that are on are yellow {on}')
    for a in ['mix-high', 'mix-party', 'mix-water']: cm.tap_shown(pg, a)
    check(J()['mood'] == {'energy': 1, 'tempo': 1, 'key': 0, 'muffle': 0}, 'all off = the song as it was')

    # 5) pads land on the beat: each hit is played at a time on the song's 16th-note grid, never late
    before = J()['pads']
    for a in ['pad-boom', 'pad-clap', 'pad-ding', 'pad-tada']: cm.tap(pg, a)
    check(J()['pads'] == before + 4, 'the pads count their taps')
    offs = pg.evaluate("""async () => { const A = Arcade.audio, res = [];
        for (let i = 0; i < 6; i++) {
          await new Promise(r => setTimeout(r, 37 + i * 29));       // (tap at odd moments)
          const tr = A.track, six = 60 / (tr.song.tempo * (A.mood.tempo || 1)) / 4, now = A.ctx.currentTime;
          const t = __jukeboxPad(['boom', 'clap', 'ding'][i % 3]), k = (tr.next - t) / six;
          res.push([+(Math.abs(k - Math.round(k))).toFixed(4), +(t - now).toFixed(3), +six.toFixed(3)]);
        }
        return res; }""")
    check(all(o[0] < 0.01 for o in offs), f'pad hits are on the 16th-note grid {[o[0] for o in offs]}')
    check(all(-0.001 <= o[1] <= o[2] + 0.02 for o in offs), f'pad hits wait at most one 16th note {[o[1] for o in offs]}')

    # 6) the player's "music off" switch doesn't silence the Jukebox; "all sound off" does
    vol = pg.evaluate("() => { const s = Arcade.store.settings(); s.musicOn = false; Arcade.store.save(); Arcade.audio.applyVolumes(); return Arcade.audio.musicGain.gain.value; }")
    check(vol > 0.1, f'the Jukebox still plays when this player has music off (music volume {vol:.2f})')
    m = pg.evaluate("() => { const s = Arcade.store.settings(); s.muted = true; Arcade.audio.applyVolumes(); const v = Arcade.audio.master.gain.value; s.muted = false; s.musicOn = true; Arcade.store.save(); Arcade.audio.applyVolumes(); return v; }")
    check(m == 0, 'all sound off still means quiet')

    # stop + dice
    cm.tap(pg, 'stop'); pg.wait_for_timeout(200)
    check(J()['playing'] is None and J()['beat'] is None, 'stop = quiet, the dancer goes to sleep')
    cm.tap(pg, 'dice'); pg.wait_for_timeout(200)
    check(J()['playing'] is not None and J()['track'], 'dice = a surprise song')
    cm.tap(pg, 'stage'); check(J()['spin'] > 0, 'tap the dancer = a spin')
    pg.screenshot(path=str(OUT / 'jukebox_desktop.png'))
    cm.tap(pg, 'home'); pg.wait_for_timeout(1000)
    check(pg.url.endswith('/index.html') and '/jukebox/' not in pg.url, 'home goes back to the hub')
    pg.context.close()

    # 7) phones: upright (pads under the stage, mix tiles), and sideways
    for name, vp in [('phone_up', {'width': 390, 'height': 844}), ('phone_side', {'width': 844, 'height': 390})]:
        pg = page(vp, touch=True)
        cm.wait_screen(pg, 'jukebox')
        J = lambda: pg.evaluate('__jukebox()')
        cm.tap_shown(pg, 'song-space-2', touch=True); pg.wait_for_timeout(600)
        check(J()['playing'] == 'space-2', f'{name}: a finger tap plays a song')
        cm.tap_shown(pg, 'pad-clap', touch=True)
        check(J()['pads'] == 1, f'{name}: a finger tap on a pad plays it')
        vw = vp['width']; vh = vp['height']
        offs = [i['attr'] for i in cm.items(pg) if i.get('shown', True) and (i['x'] < -1 or i['y'] < -1 or i['x'] + i['w'] > vw + 1 or i['y'] + i['h'] > vh + 1)]
        check(not offs, f'{name}: nothing shown is off the screen {offs[:4]}')
        pg.screenshot(path=str(OUT / f'jukebox_{name}.png'))
        pg.context.close()
    b.close()

check(not errors, f'no JavaScript errors {errors[:3]}')
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED: ' + '; '.join(fails)))
sys.exit(1 if fails else 0)
