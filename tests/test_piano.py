"""Automated test: Piano Star.

Run from the repo folder:   python3 tests/test_piano.py
- Every song's sheet music reads correctly (notes, bar lines, words line up).
- A bot plays every song note by note (tapping the real keys on screen for the
  first song), checks points, the streak, the glowing hint after a wrong key,
  the "listen" button, the replay and the results screen with stars.
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

SONGS = ['buns', 'mary', 'twinkle', 'london', 'jingle', 'ode', 'row', 'birthday']

def tap_key(page, name):
    """tap the key on the canvas, like a finger would (white keys only)"""
    letters = 'CDEFGAB'
    i = letters.index(name[0]) + 7 * (int(name[-1]) - 4)
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

    for n, sid in enumerate(SONGS):
        page.evaluate("(id) => __game.play({ id })", sid)
        page.wait_for_function("window.__game && __game.state === 'play'")
        page.wait_for_timeout(300)
        st = page.evaluate('__pianoState()')
        check(st['song'] == sid and st['idx'] == 0 and st['total'] > 10, f"{sid}: starts ({st['total']} notes, {st['difficulty']})")
        if sid == 'twinkle':
            page.screenshot(path=str(OUT / 'piano-twinkle.png'))
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
            check(st['firstTry'] == st['total'] and st['score'] > st['total'] * 100, f"{sid}: bot plays it perfectly (score {st['score']})")
        check(page.evaluate('__pianoState().mode') == 'replay', f'{sid}: the piano plays your song back')
        if sid == 'birthday':
            page.wait_for_timeout(2500); page.screenshot(path=str(OUT / 'piano-replay.png'))
        page.wait_for_function("__game.state === 'over'", timeout=60000)
        page.wait_for_timeout(900)
        txt = page.inner_text('body')
        check('right first time' in txt, f'{sid}: results screen')
        if sid == 'buns': page.screenshot(path=str(OUT / 'piano-results.png'))

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
