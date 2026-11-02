"""Checks every hand-written tune in the arcade (no browser needed).

Run:  python3 tests/test_tunes.py

For each song recipe with a `tune: { A, B, C }` it checks:
  * every phrase is exactly 4 bars and every bar is exactly 16 sixteenths
    (so the tune never drifts off the beat)
  * the notes on the strong beats (1 and 3 of each bar) are notes of the chord
    playing under them, so the tune fits the chords (at least 85% of them)
  * the tune stays in a comfortable range
"""
import re, sys, glob, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
fails = []
def check(ok, what):
    if not ok: print('FAIL ' + what); fails.append(what)

TOK = re.compile(r'^(r|-?\d+)([#b]?)(?:/(\d+))?$')
def parse(text):
    notes, step, ln = [], 0, 4
    bars = []                       # length of each bar as written between "|"
    cur = 0
    for tok in text.split():
        if tok == '|': bars.append(cur); cur = 0; continue
        m = TOK.match(tok)
        if not m: raise ValueError('bad token ' + tok)
        if m.group(3): ln = int(m.group(3))
        if m.group(1) != 'r': notes.append((step, int(m.group(1)), ln))
        step += ln; cur += ln
    bars.append(cur)
    return notes, step, bars

songs = 0
for f in sorted(glob.glob(str(ROOT / '*' / '*.js'))):
    if '/art/' in f or '/tools/' in f: continue
    src = open(f).read()
    # each recipe: "prog: [[...], [...], [...]]" ... "tune: { A: '...', B: '...', C: '...' }"
    for m in re.finditer(r"(\w+)\s*[:=]\s*\{\s*tempo:[^{}]*?prog:\s*(\[\[[^\n{}]*?\]\])[^{}]*?tune:\s*\{\s*A:\s*'([^']*)',\s*B:\s*'([^']*)',\s*C:\s*'([^']*)'\s*\}", src, re.S):
        name, prog, A, B, C = m.groups()
        prog = eval(prog)
        songs += 1
        where = f'{pathlib.Path(f).parent.name}/{name}'
        on, total = 0, 0
        for sec, text, p in (('A', A, prog[0]), ('B', B, prog[1]), ('C', C, prog[2] if len(prog) > 2 else None)):
            check(p is not None, f'{where}: no bridge chords (prog[2])')
            if p is None: continue
            notes, length, bars = parse(text)
            check(length == 64, f'{where} {sec}: phrase is {length} sixteenths, should be 64')
            check(bars == [16, 16, 16, 16], f'{where} {sec}: bar lengths {bars}, should be [16, 16, 16, 16]')
            for step, deg, ln in notes:
                check(-4 <= deg <= 13, f'{where} {sec}: note {deg} is out of range')
                if step % 8 == 0:              # beats 1 and 3
                    chord = p[step // 16]
                    tones = {(chord - 1) % 7, (chord + 1) % 7, (chord + 3) % 7}
                    total += 1
                    if (deg - 1) % 7 in tones: on += 1
                    else: print(f'  note: {where} {sec} bar {step // 16 + 1} beat {step % 16 // 4 + 1}: {deg} over chord {chord}')
        check(total and on / total >= 0.85, f'{where}: only {on}/{total} strong-beat notes fit the chords')
print(f'{songs} songs checked')
check(songs >= 32, f"expected at least 32 songs with tunes, found {songs}")
print('ALL PASSED' if not fails else f'{len(fails)} FAILED')
sys.exit(1 if fails else 0)
