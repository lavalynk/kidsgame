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
        wait_screen(pg, 'title')
