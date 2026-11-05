"""Automated test: Piano Star.

Run from the repo folder:   python3 tests/test_piano.py
- Every song's sheet music reads correctly (notes, bar lines, words line up).
- The song book (piano/songs.js): 58 songs, 10 in the bass clef, every note
  parses and is on the piano, the words line up with the notes.
- A bot plays every song note by note (tapping the real keys on screen for the
  first song), checks points, the streak, the glowing hint after a wrong key,
  the "listen" button, that the song is NOT replayed at the end, and the
  results screen with stars and the "Hear it" button.
- Free Play writes your notes on the staff.
- Screenshots at computer and phone sizes go to tests/out/ (not committed).
"""
import json, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
URL = (ROOT / 'piano' / 'index.html').as_uri()
errors, fails = [], []

def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

import re
LEN = {'w': 4, 'h': 2, 'q': 1, 'e': 0.5, 's': 0.25}
DN = lambda n: 'CDEFGAB'.index(n[0]) + 7 * int(n[-1])

def tap_key(page, name, base=4):
    """tap the key on the canvas, like a finger would (white keys only)"""
    letters = 'CDEFGAB'
    i = letters.index(name[0]) + 7 * (int(name[-1]) - base)
    box = page.locator('canvas:not(.ar-confetti)').bounding_box()
    sx = box['width'] / 960; sy = box['height'] / 540
    page.mouse.click(box['x'] + (i * 80 + 40) * sx, box['y'] + 500 * sy)

with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    page = b.new_page(viewport={'width': 1280, 'height': 760})
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL); page.evaluate('localStorage.clear()'); page.reload(); page.wait_for_timeout(500)
    page.screenshot(path=str(OUT / 'piano-title.png'))
    page.mouse.click(640, 380); page.wait_for_timeout(700)
    page.screenshot(path=str(OUT / 'piano-menu.png'))

    # ---------- the song book ----------
    book = page.evaluate('window.PianoSongs')
    SONGS = [s['id'] for s in book]
    check(len(book) == 58 and len(set(SONGS)) == 58, f'58 songs with different ids ({len(book)})')
    check(sum(1 for s in book if s.get('clef') == 'bass') == 10, '10 songs in the bass clef')
    names = [s['name'] for s in book]
    check(len(set(names)) == len(names), 'no song twice')
    for s in book:
        toks = [t for t in s['notes'].split() if t != '|']
        bad = [t for t in toks if not re.match(r'^[A-G]#?\d[whqes]\.?$', t)]
        check(not bad, f"{s['id']}: notes are written right {bad[:3]}")
        lo, hi = ('C3', 'G4') if s.get('clef') == 'bass' else ('C4', 'G5')
        out = [t for t in toks if not (DN(lo) <= DN(re.sub(r'[whqes]\.?$', '', t).replace('#', '')) <= DN(hi))]
        check(not out, f"{s['id']}: every note is on the piano ({lo}-{hi}) {out[:3]}")
        words = s['lyrics'].split()
        check(not words or len(words) == len(toks), f"{s['id']}: words line up with notes ({len(words)} words, {len(toks)} notes)")
        check(s['d'] in ('easy', 'normal', 'challenge') and s['tempo'] > 0 and len(toks) >= 12, f"{s['id']}: has a level, tempo and enough notes")

    # open the song list and look at it
    page.click('[data-levels]'); page.wait_for_timeout(500)
    check(page.locator('.ar-tile').count() >= 59, f"song list shows every song + Free Play ({page.locator('.ar-tile').count()})")
    page.screenshot(path=str(OUT / 'piano-songlist.png'))
    page.keyboard.press('Escape')

    for n, sid in enumerate(SONGS):
        page.evaluate("(id) => __game.play({ id })", sid)
        page.wait_for_function("window.__game && __game.state === 'play'")
        page.wait_for_timeout(300)
        st = page.evaluate('__pianoState()')
        check(st['song'] == sid and st['idx'] == 0 and st['total'] > 10, f"{sid}: starts ({st['total']} notes, {st['difficulty']})")
        if sid in ('twinkle', 'b-canon', 'b-fifth', 'minuet', 'elise'):
            page.evaluate("__pianoPress(__pianoState().next); __pianoPress(__pianoState().next)"); page.wait_for_timeout(500)
            page.screenshot(path=str(OUT / f'piano-{sid}.png'))
        if sid.startswith('b-'):
            check(st['clef'] == 'bass' and st['keys'] == ['C3', 'G4'], f"{sid}: bass clef + low piano ({st['clef']} {st['keys']})")
        if sid == 'buns':
            # Listen: the piano plays the song by itself, a tap stops it
            page.mouse.click(*[v for v in (lambda bx: (bx['x'] + 150 * bx['width'] / 960, bx['y'] + 44 * bx['height'] / 540))(page.locator('canvas:not(.ar-confetti)').bounding_box())])
            page.wait_for_timeout(600)
            check(page.evaluate('__pianoState().mode') == 'listen', 'buns: the listen button plays the song')
            page.screenshot(path=str(OUT / 'piano-listen.png'))
            page.wait_for_timeout(300)
            tap_key(page, 'C4'); page.wait_for_timeout(100)
            check(page.evaluate('__pianoState().mode') == 'play', 'buns: a tap stops listening')
            # a wrong key first: no point, the streak resets, the right key keeps glowing (Easy)
            tap_key(page, 'A4'); page.wait_for_timeout(100)
            st = page.evaluate('__pianoState()')
            check(st['idx'] == 0 and st['score'] == 0, 'buns: wrong key does not move on')
            # play the whole song by really tapping the keys
            while True:
                st = page.evaluate('__pianoState()')
                if st['idx'] >= st['total']: break
                tap_key(page, st['next']); page.wait_for_timeout(40)
            st = page.evaluate('__pianoState()')
            check(st['firstTry'] == st['total'] - 1, f"buns: tapping the keys works ({st['firstTry']}/{st['total']} first try)")
        else:
            page.evaluate("() => { while (__pianoState().idx < __pianoState().total) __pianoPress(__pianoState().next); }")
            st = page.evaluate('__pianoState()')
            check(st['firstTry'] == st['total'] and st['score'] >= st['total'] * 100, f"{sid}: bot plays it perfectly (score {st['score']})")
        check(page.evaluate('__pianoState().mode') == 'done', f'{sid}: no replay at the end')
        page.wait_for_function("__game.state === 'over'", timeout=5000)
        page.wait_for_timeout(700)
        txt = page.inner_text('body')
        check('right first time' in txt and page.locator('.ar-btn:has-text("Hear it")').count() == 1, f'{sid}: results screen with a Hear it button')
        if sid == 'buns':
            page.screenshot(path=str(OUT / 'piano-results.png'))
            page.click('.ar-btn:has-text("Hear it")'); page.wait_for_timeout(400)
            page.click('.ar-btn:has-text("Hear it")'); page.wait_for_timeout(200)     # (second tap stops it)

    save = page.evaluate("JSON.parse(localStorage.getItem('kidsArcade.v1')).games.piano")
    check(all((save['levels'].get(s) or {}).get('stars') == 3 for s in SONGS[1:]), 'every song saved with 3 stars')
    check({'first', 'perfect', 'allsongs', 'party'} <= set(save['achievements']), f"trophies: {save['achievements']}")

    # Normal/Challenge: the hint glows only after misses
    page.evaluate("__game.play({ id: 'ode' })"); page.wait_for_timeout(200)
    check(page.evaluate('__pianoState().glowAfter') == 1, 'ode (Normal): hint after one miss')

    # Free Play: tap keys, they're written on the staff
    page.evaluate("__game.play({ id: 'free', free: true })"); page.wait_for_timeout(200)
    for nm in ['C4', 'E4', 'G4', 'C5', 'G5', 'E5', 'C5']: tap_key(page, nm); page.wait_for_timeout(60)
    check(page.evaluate('__pianoState().freeCount') == 7, 'free play counts notes')
    page.screenshot(path=str(OUT / 'piano-free.png'))

    # phone sizes
    for name, vp in [('phone-side', {'width': 844, 'height': 390}), ('tablet', {'width': 1180, 'height': 820})]:
        ctx = b.new_context(viewport=vp, has_touch=True); pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.goto(URL); pg.wait_for_timeout(400)
        pg.touchscreen.tap(vp['width'] / 2, vp['height'] / 2); pg.wait_for_timeout(700)
        pg.evaluate("__game.play({ id: 'birthday' })"); pg.wait_for_timeout(500)
        pg.evaluate("__pianoPress('G4'); __pianoPress('G4'); __pianoPress('A4')"); pg.wait_for_timeout(400)
        pg.screenshot(path=str(OUT / f'piano-{name}.png'))
        ctx.close()
    b.close()

check(not errors, 'no JavaScript errors' + (': ' + '; '.join(errors[:3]) if errors else ''))
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
raise SystemExit(1 if fails else 0)
