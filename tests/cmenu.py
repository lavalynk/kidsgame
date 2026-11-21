"""Helpers for games whose menus are drawn by Phaser + Rex UI (arcade/canvasmenu.js, Nov 20).

ArcadeMenus.list() says what can be tapped on the open menu and where it is (CSS pixels);
these helpers tap there for real, with the mouse or a finger, like a child would.
"""

def is_canvas(pg):
    """Does this page draw its menus with Phaser? (the menu canvas exists)"""
    return pg.evaluate("!!window.ArcadeMenus && !!document.querySelector('.ar-cmenu')")

def screen(pg):
    return pg.evaluate("ArcadeMenus.isOpen ? ArcadeMenus.screen() : ''")

def wait_screen(pg, sid=None, timeout=8000):
    """Wait until a menu (or this one: 'tap', 'title', 'levels', 'results', 'pause'...) is drawn."""
    cond = f"ArcadeMenus.screen() === '{sid}'" if sid else 'true'
    pg.wait_for_function(f"ArcadeMenus.isOpen && {cond} && ArcadeMenus.list().length > 0", timeout=timeout)
    pg.wait_for_timeout(350)                                     # (the pop-in)

def items(pg):
    return pg.evaluate('ArcadeMenus.list()')

def find(pg, what):
    return next((i for i in items(pg) if i['attr'] == what or i['label'] == what), None)

def tap(pg, what, touch=False):
    """Tap a menu thing (by its attr or its word) where it is on the screen."""
    it = find(pg, what)
    assert it, f'no {what!r} on the menu ({[i["attr"] or i["label"] for i in items(pg)]})'
    x, y = it['x'] + it['w'] / 2, it['y'] + it['h'] / 2
    if touch: pg.touchscreen.tap(x, y)
    else: pg.mouse.click(x, y)
    pg.wait_for_timeout(300)

def to_title(pg):
    """From the tap-to-start screen to the picture menu."""
    wait_screen(pg)
    if screen(pg) == 'tap':
        vp = pg.viewport_size
        pg.mouse.click(vp['width'] // 2, vp['height'] // 2)
        # (the picture menu; RC opens its own main menu instead: 'rc-main')
        pg.wait_for_function("ArcadeMenus.isOpen && ['title', 'rc-main'].includes(ArcadeMenus.screen()) && ArcadeMenus.list().length > 0", timeout=8000)
        pg.wait_for_timeout(350)
        pg.wait_for_timeout(300)                                 # (past the half-second tap guard after the title tap)

def into_game(pg):
    """After Play / a level tile: get past any menu in the way (the how-to page) until the game runs."""
    for _ in range(6):
        pg.wait_for_timeout(400)
        if not pg.evaluate('ArcadeMenus.isOpen'): return
        if find(pg, 'ok'): tap(pg, 'ok')
        else: pg.keyboard.press('Enter')

# ---- old HTML selectors on canvas menus (Mini RC Racers, Nov 21) ----
# RC's menus used to be HTML buttons like <button data-menu="free">. On the canvas menus the same
# thing has attr 'menu-free' (data-back -> 'back'), so the tests can keep their old selectors.
import re as _re
def attr_of(sel):
    m = _re.fullmatch(r'\[data-([\w-]+)(?:(\^?)=["\']?([^"\'\]]*)["\']?)?\]', sel.strip())
    if not m: return None
    name, starts, val = m.groups()
    return (name, val, bool(starts))

def matches(sel):
    """Every tappable thing on the open canvas menu that the old selector meant."""
    a = attr_of(sel)
    if not a: return []
    name, val, starts = a
    out = []
    for i in items_safe():
        at = i['attr']
        if val is None: ok = at == name or at.startswith(name + '-')
        elif starts: ok = at.startswith(name + '-' + val)
        else: ok = at == name + '-' + val or (at == name and val in ('1', 'true'))
        if ok: out.append(i)
    return out

_pg = None
def items_safe():
    return _pg.evaluate('window.ArcadeMenus && ArcadeMenus.isOpen ? ArcadeMenus.list() : []') if _pg else []

def click(pg, sel, touch=False, timeout=8000):
    """Click a menu thing by its old HTML selector: on the canvas menu if one is open and has it, else the HTML."""
    global _pg; _pg = pg
    if attr_of(sel):
        for _ in range(int(timeout / 200)):
            if pg.evaluate('!!window.ArcadeMenus && ArcadeMenus.isOpen'):
                found = matches(sel)
                if found:
                    pg.wait_for_timeout(250)                     # (the pop-in)
                    it = matches(sel)[0]
                    # (something scrolled out of sight can't be tapped by a finger: tap it through the menu instead)
                    if it.get('shown', True):
                        x, y = it['x'] + it['w'] / 2, it['y'] + it['h'] / 2
                        if touch: pg.touchscreen.tap(x, y)
                        else: pg.mouse.click(x, y)
                    else:
                        pg.evaluate('(a) => ArcadeMenus.tap(a)', it['attr'])
                    pg.wait_for_timeout(300)
                    return
            elif pg.locator(sel).count():
                break
            pg.wait_for_timeout(200)
    pg.click(sel)

def count(pg, sel):
    """How many things the old selector finds: on the canvas menu, or in the HTML."""
    global _pg; _pg = pg
    if pg.evaluate('!!window.ArcadeMenus && ArcadeMenus.isOpen') and attr_of(sel): return len(matches(sel))
    return pg.locator(sel).count()

def attrs(pg, prefix):
    """The attrs on the open canvas menu that start with prefix (e.g. 'track-')."""
    return [i['attr'] for i in pg.evaluate('ArcadeMenus.list()') if i['attr'].startswith(prefix)]

def scroll_to(pg, what, tries=25):
    """Scroll the open canvas menu (mouse wheel, like a grown-up would) until `what` is in sight; returns it."""
    for _ in range(tries):
        it = find(pg, what)
        assert it, f'no {what!r} on the menu'
        if it.get('shown', True): return it
        v = pg.evaluate("(() => { const b = ArcadeMenus.scroller.getBounds(), r = window.devicePixelRatio > 1 ? Math.min(2, devicePixelRatio) : 1; return { top: b.top / r, bottom: b.bottom / r, x: b.centerX / r }; })()")
        mid = it['y'] + it['h'] / 2
        pg.mouse.move(v['x'], (v['top'] + v['bottom']) / 2)
        pg.mouse.wheel(0, 160 if mid > v['bottom'] else -160)
        pg.wait_for_timeout(120)
    return find(pg, what)

def tap_shown(pg, what, touch=False):
    """Scroll `what` into sight, then tap it for real."""
    scroll_to(pg, what)
    pg.wait_for_timeout(150)
    tap(pg, what, touch)
