"""Turn Piano Star's piano recordings (piano/samples/*.mp3) into piano/notes.js.

notes.js = `window.PIANO_NOTES = { C3: 'base64...', ... }`: the mp3 files as text, so the page can
load them with a plain <script> (works from GitHub Pages, from the disk and offline: sw.js saves
every */*.js). piano/sound.js decodes them. See piano/samples/README.md for where they come from.

To make the samples again from the original package (needs ffmpeg):
  npm pack @audio-samples/piano-mp3-velocity8@1.0.5 && tar xzf audio-samples-*.tgz
  python3 tools/make_piano_notes.py package/audio
"""
import base64, os, re, subprocess, sys
ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'piano', 'samples')
NOTES = ['C3', 'D#3', 'F#3', 'A3', 'C4', 'D#4', 'F#4', 'A4', 'C5', 'D#5', 'F#5', 'A5', 'C6']

def loudness(path):
    """how loud the first 0.4 s of a recording is (RMS in dB, from ffmpeg's astats)"""
    r = subprocess.run(['ffmpeg', '-v', 'info', '-t', '0.4', '-i', path, '-af', 'pan=mono|c0=FL,astats=measure_overall=RMS_level:measure_perchannel=0',
                        '-f', 'null', '-'], capture_output=True, text=True)
    return float(re.findall(r'RMS level dB: (-?[\d.]+)', r.stderr)[-1])

if len(sys.argv) > 1:   # cut + shrink the original recordings first
    # (only the left microphone: mixing the two together makes some notes thin, where the two mics' sound cancels out)
    # the recordings aren't all equally loud: each one is turned up / down to the same loudness,
    # so a song doesn't jump louder and softer from key to key
    level = {n: loudness(os.path.join(sys.argv[1], n + 'v8.mp3')) for n in NOTES}
    target = sum(level.values()) / len(level)
    for n in NOTES:
        gain = max(-6, min(6, target - level[n]))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(sys.argv[1], n + 'v8.mp3'), '-t', '3.2',
                        '-af', 'pan=mono|c0=FL,volume=%.2fdB,afade=t=out:st=2.0:d=1.2' % gain, '-ar', '32000', '-b:a', '48k',
                        os.path.join(OUT, n.replace('#', 's') + '.mp3')], check=True)
        print('%-4s %6.1f dB -> %+.1f dB' % (n, level[n], gain))

lines = []
for n in NOTES:
    data = open(os.path.join(OUT, n.replace('#', 's') + '.mp3'), 'rb').read()
    lines.append("  '%s': '%s'," % (n, base64.b64encode(data).decode()))
js = ('// Piano Star\'s grand piano notes (made by tools/make_piano_notes.py: never edit by hand).\n'
      '// Salamander Grand Piano V3 by Alexander Holm, CC BY 3.0, see piano/samples/README.md.\n'
      'window.PIANO_NOTES = {\n' + '\n'.join(lines) + '\n};\n')
open(os.path.join(ROOT, 'piano', 'notes.js'), 'w').write(js)
print('piano/notes.js: %d notes, %d KB' % (len(NOTES), len(js) // 1024))
