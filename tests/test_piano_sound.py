"""Automated test: Piano Star's instruments (Nov 27, 20-point plan #4: a real piano).

Run from the repo folder:   python3 tests/test_piano_sound.py
- Tone.js + the piano notes are fetched after the menu is up (not in the page's script list), and get ready:
  13 grand piano recordings decoded, Tone.js on the arcade's own audio context.
- Every instrument really makes a sound (listened to with an AnalyserNode): piano, music box, xylophone;
  the toy piano is the old home-made one.
- Each piano recording on its own (Tone.Offline): none is much louder or softer than the others.
- The round instrument button in the game: tap = the next instrument (+ a little ta-da), saved per player,
  on songs (next to Listen) and in Free Play; the keys still play.
- The Sounds screen on the title menu: 4 pictures, the picked one is yellow, tap = pick.
- Without the piano notes (they didn't load), a key still plays (the old piano steps in).
- Screenshots go to tests/out/.
"""
import pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu as cm
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
URL = (ROOT / 'piano' / 'index.html').as_uri()
errors, fails = [], []

def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what, flush=True)
    if not ok: fails.append(what)

def tap(page, x, y):
    """click a point of the 960 x 540 game picture"""
    box = page.locator('canvas:not(.ar-confetti):not(.ar-cmenu canvas)').bounding_box()
    page.mouse.click(box['x'] + x * box['width'] / 960, box['y'] + y * box['height'] / 540)

# how loud the sound effects are right after a note (an analyser on the sound-effects knob; the long window
# holds the last 0.68 s, so the start of the note is always in it)
LOUD = '''([inst, midi]) => new Promise(ok => {
  const A = Arcade.audio, an = A.ctx.createAnalyser(); an.fftSize = 32768; A.sfxGain.connect(an);
  const played = inst ? PianoSound.play(inst, midi, 0.3, 0.03) : null;
  setTimeout(() => { const d = new Float32Array(an.fftSize); an.getFloatTimeDomainData(d); let s = 0; for (const v of d) s += v * v;
    A.sfxGain.disconnect(an); ok({ played, rms: Math.sqrt(s / d.length) }); }, 450); })'''
# each recording played by a Sampler on its own, drawn without the speakers: how loud is its first 0.4 s?
EACH = '''async () => {
  const real = Tone.getContext(), names = Object.keys(PIANO_NOTES), bufs = {};
  for (const n of names) { const bin = atob(PIANO_NOTES[n]), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    bufs[n] = await real.rawContext.decodeAudioData(a.buffer); }
  const out = await Tone.Offline(async () => {
    const s = new Tone.Sampler({ urls: bufs }).toDestination(); await Tone.loaded();
    names.forEach((n, i) => s.triggerAttackRelease(n, 0.5, 0.05 + i * 0.6, 0.8));
  }, names.length * 0.6 + 0.3);
  Tone.setContext(real);
  const d = out.getChannelData(0), sr = out.sampleRate;
  return names.map((n, i) => { let s = 0; const a = Math.floor((0.05 + i * 0.6) * sr), m = Math.floor(0.4 * sr);
    for (let j = a; j < a + m; j++) s += d[j] * d[j]; return [n, 20 * Math.log10(Math.sqrt(s / m))]; }); }'''

with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    page = b.new_page(viewport={'width': 1280, 'height': 760})
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL); page.evaluate('localStorage.clear()'); page.reload()
    cm.wait_screen(page, 'tap')

    # ---------- loading ----------
    html = (ROOT / 'piano' / 'index.html').read_text()
    check('sound.js' in html and 'tone.min.js' not in html and 'notes.js' not in html,
          'piano page: sound.js in the script list, Tone.js + the notes are fetched later')
    cm.to_title(page)
    page.wait_for_function('window.PianoSound && PianoSound.ready()', timeout=15000)
    info = page.evaluate('PianoSound.info()')
    check(info['tone'] and info['notes'] and not info['failed'], f"Tone.js + the piano notes loaded ({info['failed']})")
    check(len(info['samples']) == 13, f"13 piano recordings decoded ({info['samples']})")
    check(page.evaluate('Tone.getContext().rawContext === Arcade.audio.ctx'), "Tone.js plays on the arcade's own audio context (volume + mute work)")
    check(page.evaluate("[...document.scripts].some(s => /tone\\.min\\.js\\?v=/.test(s.src))"), 'Tone.js is fetched with the ?v= (found offline)')

    # ---------- every instrument makes a sound ----------
    page.evaluate('Arcade.audio.resume()')
    quiet = page.evaluate(LOUD, [None, 0])['rms']
    for inst in ['piano', 'musicbox', 'xylo']:
        r = page.evaluate(LOUD, [inst, 60])
        check(r['played'] and r['rms'] > 0.003 and r['rms'] > quiet * 5, f"{inst}: middle C makes a sound (loudness {r['rms']:.3f}, quiet {quiet:.4f})")
    check(page.evaluate(LOUD, ['toy', 60])['played'] is False, 'toy piano: left to the old home-made piano')
    r = page.evaluate(LOUD, ['piano', 49])
    check(r['played'] and r['rms'] > 0.01, f"piano: a black key between two recordings plays too ({r['rms']:.3f})")

    # ---------- the recordings are equally loud ----------
    each = page.evaluate(EACH)
    lv = [v for _, v in each]
    avg = sum(lv) / len(lv)
    off = [(n, round(v - avg, 1)) for n, v in each if abs(v - avg) > 4]
    check(not off, f'every piano recording is about as loud as the others (within 4 dB: {off or "all"})')

    # ---------- the Sounds screen ----------
    cm.tap(page, 'sound'); cm.wait_screen(page, 'piano-sound'); page.wait_for_timeout(500)
    its = cm.items(page)
    tiles = [i['attr'] for i in its if i['attr'].startswith('inst-')]
    check(tiles == ['inst-piano', 'inst-musicbox', 'inst-xylo', 'inst-toy'], f'Sounds screen: 4 instruments ({tiles})')
    check([i['attr'] for i in its if i.get('picked')] == ['inst-piano'], 'the grand piano is picked at first')
    check(all(i.get('say') for i in its if i['attr'].startswith('inst-')), 'every instrument says its name when held (hold to hear)')
    page.screenshot(path=str(OUT / 'piano-sounds.png'))
    n0 = page.evaluate('PianoSound.info().played')
    cm.tap(page, 'inst-musicbox'); page.wait_for_timeout(600)
    check(page.evaluate('__pianoSound().inst') == 'musicbox', 'tap the music box: picked')
    check([i['attr'] for i in cm.items(page) if i.get('picked')] == ['inst-musicbox'], 'the music box tile is yellow now')
    check(page.evaluate('PianoSound.info().played') - n0 >= 4, 'picking it plays a little ta-da on it')
    cm.tap(page, 'back'); page.wait_for_timeout(500)

    # ---------- in a song ----------
    page.evaluate("__game.play({ id: 'mary' })"); page.wait_for_timeout(700)
    st = page.evaluate('__pianoSound()')
    check(st['inst'] == 'musicbox', 'the song starts with the picked instrument')
    check(st['button']['x'] == 236, 'the instrument button sits next to Listen')
    n0 = page.evaluate('PianoSound.info().played')
    page.keyboard.press('KeyE'); page.wait_for_timeout(200)
    check(page.evaluate('PianoSound.info().played') == n0 + 1 and page.evaluate('__pianoState().idx') == 1, 'a key plays the music box and the song moves on')
    page.screenshot(path=str(OUT / 'piano-instrument-song.png'))
    seen = []
    for _ in range(4):
        tap(page, 236, 44); page.wait_for_timeout(350)
        seen.append(page.evaluate('__pianoSound().inst'))
    check(seen == ['xylo', 'toy', 'piano', 'musicbox'], f'the button goes round all 4 instruments ({seen})')
    check(page.evaluate('__pianoState().idx') == 1, "tapping the button doesn't count as a key")
    tap(page, 236, 44); page.wait_for_timeout(300)        # -> xylophone
    # saved for this player
    page.reload(); cm.wait_screen(page, 'tap'); cm.to_title(page)
    page.evaluate("__game.play({ id: 'free', free: true })"); page.wait_for_timeout(700)
    st = page.evaluate('__pianoSound()')
    check(st['inst'] == 'xylo', f"the instrument is remembered for this player ({st['inst']})")
    check(st['button']['x'] == 322, 'Free Play: the button sits after Record + Play')
    page.wait_for_function('PianoSound.ready()', timeout=15000)
    n0 = page.evaluate('PianoSound.info().played')
    for k in 'CEG': page.keyboard.press('Key' + k); page.wait_for_timeout(120)
    check(page.evaluate('PianoSound.info().played') == n0 + 3 and page.evaluate('__pianoState().freeCount') == 3, 'Free Play: the xylophone plays')
    page.screenshot(path=str(OUT / 'piano-instrument-free.png'))

    # ---------- the notes never load: the old piano steps in ----------
    page2 = b.new_page(viewport={'width': 844, 'height': 390})
    page2.on('pageerror', lambda e: errors.append(str(e)))
    page2.route('**/notes.js*', lambda route: route.abort())
    page2.goto(URL); cm.wait_screen(page2, 'tap'); cm.to_title(page2)
    page2.wait_for_function('PianoSound.info().failed', timeout=15000)
    page2.evaluate("__game.play({ id: 'mary' })"); page2.wait_for_timeout(600)
    page2.evaluate('Arcade.audio.resume()')
    page2.keyboard.press('KeyE')
    r = page2.evaluate(LOUD, [None, 0])
    check(r['rms'] > 0.01 and page2.evaluate('PianoSound.info().fallback') >= 1 and page2.evaluate('__pianoState().idx') == 1,
          f"without the piano notes a key still plays (the old piano, {r['rms']:.3f})")
    page2.screenshot(path=str(OUT / 'piano-instrument-phone.png'))
    b.close()

ignore = ('AudioContext was not allowed', 'net::ERR_FAILED')
errors = [e for e in errors if not any(i in e for i in ignore)]
check(not errors, f'no JavaScript errors {errors[:3]}')
print('\n' + ('All passed' if not fails else f'{len(fails)} FAILED: {fails}'))
sys.exit(1 if fails else 0)
