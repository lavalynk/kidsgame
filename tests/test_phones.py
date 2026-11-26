"""Automated test: every page's menus fit on many phone shapes (Keith, Nov 20: "it still doesn't format
correctly on some phones").

Run:  python3 tests/test_phones.py          (or: python3 tests/test_phones.py rc jungle   for just some pages)
For every page (the hub, the 15 games, stickers, house, parent corner) on 9 screen shapes, upright and sideways:
  * the first screen, the title menu after a tap, and (kit games) the level picker are checked
  * nothing pokes out of the screen sideways (the page never scrolls left/right)
  * every button and tile is fully on the screen, or inside a menu that scrolls up and down
  * no tap target is tiny (at least 40 x 40 screen dots; the menus' big tiles are much bigger)
  * buttons don't sit under the corner buttons (home / pause)
  * no JavaScript errors
Screenshots of anything that fails land in tests/out/phones/.
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out' / 'phones'; OUT.mkdir(parents=True, exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

# (name, width, height) upright; each is also tried sideways
SHAPES = [
    ('small-android', 360, 640), ('iphone-se', 320, 568), ('iphone-8', 375, 667), ('iphone-14', 390, 844),
    ('iphone-pro-max', 430, 932), ('galaxy-s', 360, 780), ('pixel', 412, 915), ('fold-inner', 600, 720),
    ('ipad', 768, 1024),
]
PAGES = ['index', 'bike', 'rc', 'hoops', 'golf', 'archery', 'jungle', 'trail', 'quest', 'space', 'abc', 'coloring', 'maze',
         'fishing', 'piano', 'claw', 'stickers', 'house', 'parent', 'jukebox']
only = [a for a in sys.argv[1:]]
if only: PAGES = [p for p in PAGES if p in only]

# Look at everything you can tap in the open menu.
# A thing is OK if it's on the screen, or inside a box that scrolls (then you can scroll to it).
SCAN = """(() => {
  const vw = innerWidth, vh = innerHeight, out = { hscroll: document.documentElement.scrollWidth > vw + 2, off: [], tiny: [], under: [] };
  const corners = [...document.querySelectorAll('.ar-corner')].filter(c => c.offsetParent).map(c => c.getBoundingClientRect());
  const scrolls = (el) => { for (let p = el.parentElement; p; p = p.parentElement) { const s = getComputedStyle(p);
      if (/(auto|scroll)/.test(s.overflowY) && p.scrollHeight > p.clientHeight + 2) return true;
      if (/(auto|scroll)/.test(s.overflowX) && p.scrollWidth > p.clientWidth + 2) return true; } return false; };
  const name = (el) => (el.getAttribute('aria-label') || el.textContent || el.className || el.tagName).trim().replace(/\\s+/g, ' ').slice(0, 24);
  const items = [...document.querySelectorAll('button, .ar-tile, [role=button], a[href]')].filter(el => {
    if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return false;
    const s = getComputedStyle(el); if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return false;
    if (el.closest('.ar-pad') || el.closest('[aria-hidden=true]')) return false;   // (the driving buttons hide while menus are open)
    if (el.closest('.swiper-slide:not(.swiper-slide-active)')) return false;       // (a book page you swipe to: not on the screen yet, on purpose)
    const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2;
  });
  for (const el of items) {
    const r = el.getBoundingClientRect();
    const sideOut = (r.left < -2 || r.right > vw + 2) && !scrolls(el);
    const upOut = r.top < -2 || r.bottom > vh + 2;
    if (sideOut || (upOut && !scrolls(el))) out.off.push(name(el) + ' @' + [r.left, r.top, r.right, r.bottom].map(Math.round).join(','));
    if ((r.width < 40 || r.height < 40) && !el.closest('.ar-corner') && !el.classList.contains('ar-corner') && !el.closest('.ar-tiny-ok'))
      out.tiny.push(name(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    if (!el.classList.contains('ar-corner')) for (const c of corners) {
      const ox = Math.min(r.right, c.right) - Math.max(r.left, c.left), oy = Math.min(r.bottom, c.bottom) - Math.max(r.top, c.top);
      if (ox > 12 && oy > 12) out.under.push(name(el));
    }
  }
  return out;
})()"""

# canvas menus: the same checks on what ArcadeMenus.list() says can be tapped (things scrolled out of the
# panel are fine: only sideways and tiny count there)
CSCAN = """(() => { const vw = innerWidth, vh = innerHeight, out = { hscroll: false, off: [], tiny: [], under: [] };
  for (const i of ArcadeMenus.list()) {
    if (i.attr === '' && i.label === 'sfx' || i.label === 'music') continue;
    if (i.x < -2 || i.x + i.w > vw + 2) out.off.push(i.label + ' @' + [i.x, i.y, i.x + i.w, i.y + i.h].map(Math.round).join(','));
    if ((i.w < 40 || i.h < 40) && i.y > -2 && i.y + i.h < vh + 2) out.tiny.push(i.label + ' ' + Math.round(i.w) + 'x' + Math.round(i.h));
  }
  return out; })()"""

def look(pg, label):
    r = pg.evaluate("(window.ArcadeMenus && ArcadeMenus.isOpen) ? 'canvas' : ''") and pg.evaluate(CSCAN) or pg.evaluate(SCAN)
    bad = []
    if r['hscroll']: bad.append('the page scrolls sideways')
    if r['off']: bad.append('off the screen: ' + '; '.join(r['off'][:3]))
    if r['tiny']: bad.append('tiny: ' + '; '.join(r['tiny'][:3]))
    if r['under']: bad.append('under a corner button: ' + '; '.join(r['under'][:2]))
    if bad:
        pg.screenshot(path=str(OUT / (label.replace(' ', '_').replace('/', '-') + '.png')))
    return bad

def fresh(pg, page):
    url = (ROOT / ('index.html' if page == 'index' else f'{page}/index.html')).as_uri()
    pg.goto(url)
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': 'big'}]}
    pg.evaluate("p => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); sessionStorage.setItem('kidsArcade.parentOK', '1'); }", json.dumps(prof))
    pg.reload(); pg.wait_for_timeout(700)

with sync_playwright() as pw:
    b = pw.chromium.launch()
    for page in PAGES:
        problems = []
        for (shape, w, h) in SHAPES:
            for side in (False, True):
                vw, vh = (h, w) if side else (w, h)
                label = f"{page} {shape} {'sideways' if side else 'upright'}"
                ctx = b.new_context(viewport={'width': vw, 'height': vh}, has_touch=True, is_mobile=True, device_scale_factor=1)
                pg = ctx.new_page(); pg.on('pageerror', lambda e, l=label: errors.append(f'{l}: {e}'))
                fresh(pg, page)
                for what in ['first screen', 'after a tap', 'levels']:
                    canvas = pg.evaluate("!!(window.ArcadeMenus && ArcadeMenus.isOpen)")   # (menus drawn by Phaser + Rex UI)
                    if what == 'after a tap':
                        if canvas:
                            if pg.evaluate('ArcadeMenus.screen()') != 'tap': continue
                        elif not pg.locator('.ar-titlescreen .ar-tapstart, .ar-titlescreen:not(.ar-nes)').count(): continue
                        pg.mouse.click(vw // 2, vh // 2); pg.wait_for_timeout(1200 if canvas else 600)
                    if what == 'levels':
                        if canvas:
                            if not pg.evaluate("ArcadeMenus.tap('levels')"): continue
                            pg.wait_for_timeout(1200)
                        else:
                            lv = pg.locator('.ar-nesitem[aria-label="Levels"]')
                            if not lv.count(): continue
                            lv.first.evaluate('b => b.click()'); pg.wait_for_timeout(600)   # (a tap even if it's off the screen: that is reported above)
                    for bad in look(pg, f'{label} {what}'):
                        problems.append(f'{shape} {"sideways" if side else "upright"} ({vw}x{vh}), {what}: {bad}')
                ctx.close()
        check(not problems, f'{page}: menus fit on every phone shape' + ('' if not problems else '\n    ' + '\n    '.join(problems[:12]) + (f'\n    ... {len(problems) - 12} more' if len(problems) > 12 else '')))
    b.close()

if errors: print('JS errors:', errors[:5])
print(f'{len(fails)} failed' if fails else 'ALL PASSED')
sys.exit(1 if fails or errors else 0)
