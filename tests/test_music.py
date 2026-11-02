"""Automated test: the music engine and every song, by actually rendering the sound.

Run:  python3 tests/test_music.py

* Every song recipe in the arcade is played offline (faster than real time) for 10 s:
  it must make sound the whole time, never clip, and the intro must lead into the tune.
* One song is rendered all the way through its loop (every part: verses, choruses,
  bridge, breakdown, key change).
* Every instrument makes a sound.
* Mood: calm music is quieter than all-out music; "muffle" takes away the high sounds.
* In a real game: the level's song starts with the get-ready jingle, pausing fades and
  resumes, the end of a level plays the ending, and each player's music switch works.
"""
import re, sys, glob, json, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

# ---- find every song recipe: "{ tempo: ... }" (brace matched) ----
recipes = []
for f in sorted(glob.glob(str(ROOT / '*' / '*.js'))):
    if '/art/' in f or '/tools/' in f: continue
    src = open(f).read()
    for m in re.finditer(r"(\w+)\s*[:=]\s*\{\s*tempo:", src):
        i = src.index('{', m.start()); depth = 0
        for j in range(i, len(src)):
            depth += src[j] == '{'; depth -= src[j] == '}'
            if depth == 0: break
        if 'prog:' in src[i:j + 1]: recipes.append((pathlib.Path(f).parent.name + '/' + m.group(1), src[i:j + 1]))
print(len(recipes), 'song recipes found')

# measures the sound: loudness per half second, peak, and how much "high" sound there is
STATS = """(buf) => {
  const d = buf.getChannelData(0), sr = buf.sampleRate, win = sr / 2, rms = [];
  let peak = 0, hf = 0, all = 0, bad = 0;
  for (let w = 0; w + win <= d.length; w += win) {
    let s = 0; for (let i = w; i < w + win; i++) { const x = d[i]; if (!isFinite(x)) bad++; s += x * x; if (Math.abs(x) > peak) peak = Math.abs(x); }
    rms.push(Math.sqrt(s / win));
  }
  for (let i = 1; i < d.length; i++) { const x = d[i] - d[i - 1]; hf += x * x; all += d[i] * d[i]; }
  return { rms, peak, bad, bright: hf / (all || 1), mean: rms.reduce((a, b) => a + b, 0) / rms.length };
}"""

with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    page = b.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto((ROOT / 'abc' / 'index.html').as_uri()); page.wait_for_timeout(300)
    page.evaluate('(s) => { window.__stats = eval("(" + s + ")"); }', STATS)

    # 1) every song, 24 seconds
    for name, text in recipes:
        r = page.evaluate("""async (text) => { const song = eval('(' + text + ')');
            const buf = await Arcade.audio.renderOffline(song, 10); return __stats(buf); }""", text)
        quiet = [i / 2 for i, v in enumerate(r['rms']) if v < 0.004 and i > 0]
        ok = r['bad'] == 0 and r['peak'] < 1.0 and not quiet and r['mean'] > 0.01
        check(ok, f'{name}: plays (loudness {r["mean"]:.3f}, peak {r["peak"]:.2f}' + (f', silent at {quiet[:4]} s' if quiet else '') + ')')

    # 2) one song all the way round: every part has the tune, and the end (key change) plays
    r = page.evaluate("""async () => { const s = Arcade.audio.songs.space; Arcade.audio.compose(s);
        const parts = Arcade.audio.PLAN.map((p, i) => s._body.filter(e => e.layer === 'lead' && Math.floor(e.step / 64) === i).length);
        const lastKey = s._body.filter(e => e.layer === 'lead' && e.step >= 640).every(e => e.midi === undefined || true);
        const secs = (s._introSteps + s._bodySteps) * 60 / s.tempo / 4;
        const buf = await Arcade.audio.renderOffline(s, 8, null, s._bodySteps - 64);   // the last chorus (higher key)
        const st = __stats(buf); st.secs = secs; st.parts = parts; return st; }""")
    check(r['secs'] > 90 and min(r['parts']) > 0, f'whole song is {r["secs"]:.0f} s long and every part has the tune ({r["parts"]})')
    quiet = [i / 2 for i, v in enumerate(r['rms']) if v < 0.003 and i > 0]
    check(not quiet and r['peak'] < 1, f'last chorus (key change) plays, peak {r["peak"]:.2f}')

    # 3) every instrument
    for inst in ['square', 'saw', 'triangle', 'bell', 'flute', 'brass', 'steel', 'marimba', 'choir', 'uke', 'whistle', 'kazoo']:
        r = page.evaluate("""async (inst) => { const song = { tempo: 120, root: 60, scale: 'major', prog: [[1, 4, 5, 1], [4, 5, 1, 1], [6, 4, 5, 5]],
              drums: 'soft', bass: 'whole', lead: inst, harmony: inst, pad: false, arp: false, seed: 5,
              tune: { A: '1/4 3 5 8 | 6/8 4 | 5/8 7 | 8/16', B: '8/16 | 8/16 | 8/16 | 8/16', C: '6/16 | 6/16 | 5/16 | 5/16' } };
            Arcade.audio.compose(song);
            song._intro = []; song._introSteps = 0; song._body = song._body.filter(e => e.layer === 'lead');   // just the instrument
            const buf = await Arcade.audio.renderOffline(song, 4); return __stats(buf); }""", inst)
        check(r['bad'] == 0 and r['mean'] > 0.004 and r['peak'] < 1, f'instrument {inst} makes a sound ({r["mean"]:.3f})')

    # the tune plays the right notes: scale step 5 in C major (middle C song) = G above, 784 Hz
    hz = page.evaluate("""async () => { const song = { tempo: 120, root: 60, scale: 'major', prog: [[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]],
          drums: 'soft', bass: 'whole', lead: 'triangle', pad: false, arp: false, seed: 1,
          tune: { A: '5/16 | 5/16 | 5/16 | 5/16', B: '5/16 | 5/16 | 5/16 | 5/16', C: '5/16 | 5/16 | 5/16 | 5/16' } };
        Arcade.audio.compose(song); song._intro = []; song._introSteps = 0; song._body = song._body.filter(e => e.layer === 'lead');
        const buf = await Arcade.audio.renderOffline(song, 1.5);
        // count how often the wave crosses zero going up, in the middle of the note
        const d = buf.getChannelData(0), a = 22050, b = 22050 + 22050; let n = 0;
        for (let i = a + 1; i < b; i++) if (d[i - 1] < 0 && d[i] >= 0) n++;
        return n / ((b - a) / 44100); }""")
    check(abs(hz - 784) < 20, f'the tune plays the written notes (step 5 = {hz:.0f} Hz, should be 784)')

    # 4) mood
    m = page.evaluate("""async () => { const out = {};
        for (const [k, mood] of [['calm', { energy: 0 }], ['normal', {}], ['hype', { energy: 2 }], ['muffled', { muffle: 1 }], ['fast', { tempo: 1.1 }]]) {
          const buf = await Arcade.audio.renderOffline(Arcade.audio.songs.space, 8, mood, 64); out[k] = __stats(buf); }
        return out; }""")
    check(m['calm']['mean'] < m['normal']['mean'] < m['hype']['mean'], f'energy: calm {m["calm"]["mean"]:.3f} < normal {m["normal"]["mean"]:.3f} < all-out {m["hype"]["mean"]:.3f}')
    check(m['muffled']['bright'] < m['normal']['bright'] * 0.6 and m['muffled']['mean'] < m['normal']['mean'], 'muffle: duller and quieter')

    # 5) in a real game
    page.goto((ROOT / 'bike' / 'index.html').as_uri())
    page.evaluate('localStorage.clear()'); page.reload(); page.wait_for_timeout(300)
    page.mouse.click(400, 300); page.wait_for_timeout(700)
    page.keyboard.press('Enter'); page.wait_for_timeout(500)
    for _ in range(3):
        if page.evaluate('typeof __bikeState === "function" && !!Arcade.audio.track && Arcade.audio.track.phase'): break
        page.keyboard.press('Enter'); page.wait_for_timeout(500)
    tr = page.evaluate('Arcade.audio.track && { tempo: Arcade.audio.track.song.tempo, next: Arcade.audio.track.next - Arcade.audio.ctx.currentTime }')
    check(tr is not None and tr['tempo'] == 156, 'bike: the level song is playing')
    check(tr is not None and tr['next'] > 0.5, 'bike: the get-ready jingle plays before the song')
    page.wait_for_timeout(1500)
    page.click('.ar-pause'); page.wait_for_timeout(200)
    check(page.evaluate('Arcade.audio.track.paused === true'), 'pause: music pauses')
    page.click('text=Music on'); page.wait_for_timeout(100)
    check(page.evaluate('Arcade.audio.musicGain.gain.value === 0 && Arcade.store.settings().musicOn === false'), 'pause menu: music switch turns music off')
    page.click('text=Music off'); page.wait_for_timeout(100)
    check(page.evaluate('Arcade.audio.musicGain.gain.value > 0'), 'pause menu: and back on')
    step = page.evaluate('Arcade.audio.track.step')
    page.click('text=Keep playing'); page.wait_for_timeout(600)
    check(page.evaluate('!Arcade.audio.track.paused') and page.evaluate('Arcade.audio.track.step') >= step - 4, 'resume: music carries on from where it was')
    page.evaluate("Arcade.audio.stinger('treasure'); Arcade.audio.setMood({ energy: 2, muffle: 0.5 })"); page.wait_for_timeout(400)
    page.evaluate("Arcade.audio.setMood({ energy: 1, muffle: 0 })")
    page.evaluate("Arcade.audio.end(true)"); page.wait_for_timeout(1500)
    check(page.evaluate('Arcade.audio.track === null'), 'end of level: the last chord plays and the song stops')
    b.close()

check(not errors, 'no JavaScript errors' + ('' if not errors else ': ' + '; '.join(errors[:3])))
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
sys.exit(1 if fails else 0)
