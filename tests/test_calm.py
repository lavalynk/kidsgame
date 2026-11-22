"""Automated test: the accessibility pass (Nov 22): Calm motion + readable words.

Run:  python3 tests/test_calm.py   (about 1-2 minutes)
Checks:
- the Parent corner (This device) has Motion: Normal / Calm; tapping Calm saves it, the page turns calm at once
  (html.ar-calm, Arcade.calm()), Normal turns it back; the HTML fallback has the same setting
- with Calm on: the hub's menu has no moving tweens (no hopping present, no pop-in), CSS animations are off,
  no confetti, games get no screen shake (Arcade.shakeK() = 0), a kit game's menus still work (tap through to playing)
- the device's own "reduce motion" setting turns calm on by itself (Normal can't switch it back on)
- every word on the canvas menus of the hub, the Parent corner, a game's title + level picker, the Sticker Book,
  My House, the maze map and the coloring picker is readable: words with a thick dark outline always are;
  words without one must have enough contrast with what's behind them (WCAG: 4.5, or 3 for big words),
  at desktop and phone sizes
Screenshots land in tests/out/.
"""
import io, json, pathlib, collections
from playwright.sync_api import sync_playwright
from PIL import Image
import sys; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cmenu as cm
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

ONE = json.dumps({'active': 'p1', 'list': [{'id': 'p1', 'name': 'Sam', 'pet': 'cat', 'color': '#ef476f', 'age': 'big'}]})
url = lambda p: (ROOT / p).as_uri()

def fresh(pg, page='index.html', calm=False):
    pg.goto(url(page))
    pg.evaluate("([p, c]) => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('kidsArcade.profiles', p);"
                " localStorage.setItem('kidsArcade.testDay', '2026-11-22'); sessionStorage.setItem('kidsArcade.picked', '1');"
                " sessionStorage.setItem('kidsArcade.parentOK', '1');"
                " if (c) localStorage.setItem('kidsArcade.parent', JSON.stringify({ motion: 'calm' })); }", [ONE, calm])
    pg.reload(); pg.wait_for_timeout(400)

def tweens(pg):
    """How many tweens are running in the menu's Phaser scene right now (moving pictures)."""
    return pg.evaluate("(() => { const g = ArcadeMenus._game(); const s = g && g.scene.scenes[0]; return s ? s.tweens.getTweens().length : -1; })()")

# ---- contrast (WCAG 2) ----
def lum(rgb):
    def ch(c):
        c = c / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(x) for x in rgb[:3])
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)
def hex_rgb(h):
    h = h.lstrip('#')
    if len(h) == 3: h = ''.join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def words_readable(pg, name):
    """Every word in sight: outlined (>= 1.5 px dark outline) or enough contrast with the color behind it."""
    pg.wait_for_timeout(500)
    shot = Image.open(io.BytesIO(pg.screenshot())).convert('RGB')
    pg.screenshot(path=str(OUT / f'calm_{name}.png'))
    W, H = shot.size
    k = W / pg.viewport_size['width']                           # (a phone screenshot has 2 dots per CSS pixel)
    bad, n = [], 0
    for t in pg.evaluate('ArcadeMenus.texts()'):
        if not t['shown'] or not t['text'].strip(): continue
        n += 1
        if t['stroke'] >= 1.5: continue                         # a thick dark outline reads on any color
        fg = hex_rgb(t['color'])
        # what's behind the words: the most common color on a ring just OUTSIDE their box (inside it, the soft
        # edges of the letters would count as background)
        x0, y0 = int(t['x'] * k) - 3, int(t['y'] * k) - 3
        x1, y1 = int((t['x'] + t['w']) * k) + 3, int((t['y'] + t['h']) * k) + 3
        ring = [(x, y0) for x in range(x0, x1)] + [(x, y1) for x in range(x0, x1)] + [(x0, y) for y in range(y0, y1)] + [(x1, y) for y in range(y0, y1)]
        cnt = collections.Counter(shot.getpixel((x, y)) for x, y in ring if 0 <= x < W and 0 <= y < H)
        bg = cnt.most_common(1)[0][0]
        need = 3.0 if t['size'] >= 18.5 else 4.5
        r = ratio(fg, bg)
        if r < need: bad.append(f"{t['text'][:30]!r} {t['color']} on {bg} = {r:.1f}")
    check(not bad, f'{name}: all {n} words in sight are readable' + (f' (hard to read: {bad[:4]})' if bad else ''))

with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1280, 'height': 800})
    pg.on('pageerror', lambda e: errors.append('desktop: ' + str(e)))

    # ---- 1. the setting in the Parent corner ----
    fresh(pg, 'parent/index.html'); cm.wait_screen(pg, 'parent')
    cm.tap(pg, 'device'); pg.wait_for_timeout(300)
    check(cm.find(pg, 'motion-auto') and cm.find(pg, 'motion-calm'), 'This device has Motion: Normal + Calm')
    check(next(i for i in cm.items(pg) if i['attr'] == 'motion-auto')['label'] == 'Normal', 'Normal is picked at first')
    cm.tap_shown(pg, 'motion-calm'); pg.wait_for_timeout(300)
    check(pg.evaluate("Arcade.parent.load().motion") == 'calm', 'tapping Calm saves it (motion: calm)')
    check(pg.evaluate("document.documentElement.classList.contains('ar-calm') && Arcade.calm() && Arcade.shakeK() === 0"),
          'the page turns calm at once (html.ar-calm, Arcade.calm(), shakeK 0)')
    words_readable(pg, 'parent_device')
    cm.tap_shown(pg, 'motion-auto'); pg.wait_for_timeout(300)
    check(pg.evaluate("Arcade.parent.load().motion === 'auto' && !document.documentElement.classList.contains('ar-calm') && !Arcade.calm()"),
          'Normal turns it back off')
    # the HTML fallback (no Phaser) has the setting too
    pg.route('**/phaser.min.js*', lambda r: r.abort())
    fresh(pg, 'parent/index.html')
    pg.wait_for_selector('[data-motion]', timeout=5000)
    pg.select_option('[data-motion]', 'calm'); pg.wait_for_timeout(200)
    check(pg.evaluate("Arcade.parent.load().motion") == 'calm', 'the HTML Parent corner has the Motion setting too')
    pg.unroute('**/phaser.min.js*')
    errors.clear()          # (without Phaser, Rex UI complains that Phaser is missing: expected on this pretend device)

    # ---- 2. the hub: normal vs calm ----
    fresh(pg); cm.wait_screen(pg, 'hub'); pg.wait_for_timeout(800)
    normal = tweens(pg)
    check(normal > 0, f'normal: the hub has moving pictures (the present hops: {normal} tweens)')
    words_readable(pg, 'hub')
    fresh(pg, calm=True); cm.wait_screen(pg, 'hub'); pg.wait_for_timeout(100)
    check(tweens(pg) == 0, f'calm: nothing moves on the hub menu, not even the pop-in ({tweens(pg)} tweens)')
    check(pg.evaluate("document.documentElement.classList.contains('ar-calm')"), 'calm: html.ar-calm is set on load')
    anim = pg.evaluate("""(() => { const d = document.createElement('div'); d.style.animation = 'ar-turn 2s infinite'; d.style.transition = 'transform 1s';
      document.body.appendChild(d); const cs = getComputedStyle(d); const r = [cs.animationName, cs.transitionDuration]; d.remove(); return r; })()""")
    check(anim[0] == 'none' and anim[1] in ('0s', ''), f'calm: CSS animations + transitions are off ({anim})')
    check(pg.evaluate("Arcade.confetti(80), document.querySelectorAll('.ar-confetti').length") == 0, 'calm: no confetti')
    # a press still works (and squishes a little without the boing): open Who's playing?
    cm.tap(pg, 'who'); pg.wait_for_timeout(300)
    check(cm.screen(pg) == 'hub-players', 'calm: the hub buttons still work (Who\'s playing? opens)')

    # ---- 3. a kit game with calm on: menus still work, into the game, no shake ----
    pg.goto(url('space/index.html')); cm.to_title(pg)
    check(tweens(pg) == 0, 'calm: Space Defender\'s title menu has no moving tweens')
    words_readable(pg, 'space_title')
    cm.tap(pg, 'levels'); cm.wait_screen(pg, 'levels'); words_readable(pg, 'space_levels')
    cm.tap(pg, 'back') if cm.find(pg, 'back') else pg.keyboard.press('Escape')
    cm.to_title(pg) if cm.screen(pg) != 'title' else None
    cm.tap(pg, 'start'); cm.into_game(pg)
    check(not pg.evaluate('ArcadeMenus.isOpen'), 'calm: tapping through the menus starts the game')
    check(pg.evaluate('Arcade.shakeK()') == 0, 'calm: the game gets no screen shake')

    # ---- 4. more menus: words readable (normal motion) ----
    for page, sid, name in [('stickers/index.html', 'stickers-book', 'stickers'), ('house/index.html', 'house', 'house'),
                            ('jungle/index.html', None, 'jungle_title'), ('rc/index.html', None, 'rc_main'), ('jukebox/index.html', 'jukebox', 'jukebox')]:
        fresh(pg, page)
        if sid: cm.wait_screen(pg, sid)
        else: cm.to_title(pg)
        words_readable(pg, name)
    fresh(pg, 'maze/index.html'); pg.evaluate('openMap && openMap()') if pg.evaluate("typeof openMap === 'function'") else None
    pg.wait_for_timeout(300)
    if pg.evaluate('ArcadeMenus.isOpen'): words_readable(pg, 'maze_map')
    fresh(pg, 'coloring/index.html')
    if pg.evaluate('ArcadeMenus.isOpen'): cm.wait_screen(pg, 'coloring-pick'); words_readable(pg, 'coloring_pick')

    # ---- 5. the device's own "reduce motion" ----
    ctx = b.new_context(viewport={'width': 1280, 'height': 800}, reduced_motion='reduce')
    pr = ctx.new_page(); pr.on('pageerror', lambda e: errors.append('reduced: ' + str(e)))
    fresh(pr); cm.wait_screen(pr, 'hub'); pr.wait_for_timeout(300)
    check(pr.evaluate("Arcade.calm() && document.documentElement.classList.contains('ar-calm')") and tweens(pr) == 0,
          'the device asking for less motion turns calm on by itself')
    ctx.close()

    # ---- 6. phone (upright) ----
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2)
    ph = ctx.new_page(); ph.on('pageerror', lambda e: errors.append('phone: ' + str(e)))
    fresh(ph); cm.wait_screen(ph, 'hub'); words_readable(ph, 'phone_hub')
    fresh(ph, 'parent/index.html'); cm.wait_screen(ph, 'parent'); cm.tap(ph, 'device'); ph.wait_for_timeout(300)
    cm.scroll_to(ph, 'motion-calm'); words_readable(ph, 'phone_parent_device')
    fresh(ph, 'stickers/index.html'); cm.wait_screen(ph, 'stickers-book'); words_readable(ph, 'phone_stickers')
    ctx.close()
    b.close()

check(not errors, 'no JavaScript errors' + (f': {errors[:3]}' if errors else ''))
print(f'\n{len(fails)} failed' if fails else '\nALL PASS')
sys.exit(1 if fails else 0)
