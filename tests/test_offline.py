"""Automated test: the arcade works like an app and offline.

Run:  python3 tests/test_offline.py
Serves the arcade on a local web address (service workers need one), opens the hub so
the offline copy gets saved, then turns the network OFF and opens every game, the
sticker book and the house. Also checks the app manifest and its icons.
"""
import sys, json, threading, pathlib, functools, http.server
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{srv.server_address[1]}/'

# the manifest + icons
m = json.loads((ROOT / 'manifest.webmanifest').read_text())
check(m['display'] == 'fullscreen' and m['start_url'] and len(m['icons']) >= 3, 'manifest: full screen, start page, icons')
check(all((ROOT / i['src']).exists() for i in m['icons']), 'manifest: every icon file exists')
sw = (ROOT / 'sw.js').read_text()
GAMES = ['bike', 'rc', 'hoops', 'archery', 'jungle', 'trail', 'space', 'abc', 'coloring', 'maze', 'fishing', 'piano', 'golf', 'quest', 'stickers', 'house']
check(all(f"'{g}/index.html'" in sw for g in GAMES), 'sw.js lists every page for offline play')

with sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context(viewport={'width': 1280, 'height': 760})
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(BASE + 'index.html')
    pg.wait_for_function("navigator.serviceWorker && navigator.serviceWorker.controller !== undefined", timeout=10000)
    pg.evaluate("navigator.serviceWorker.ready")
    # wait until every file is saved
    n = 0
    for _ in range(60):
        n = pg.evaluate("caches.keys().then(ks => ks.length ? caches.open(ks[0]).then(c => c.keys()).then(r => r.length) : 0)")
        if n >= sw.count("',") : break
        pg.wait_for_timeout(250)
    check(n >= 40, f'the offline copy is saved ({n} files)')
    check(pg.evaluate("document.querySelector('link[rel=manifest]') !== null"), 'hub links the manifest')
    pg.reload(); pg.wait_for_timeout(300)

    # network OFF: everything still opens
    ctx.set_offline(True)
    for g in GAMES:
        pg.goto(BASE + g + '/index.html'); pg.wait_for_timeout(500)
        ok = pg.evaluate("document.body && document.body.children.length > 0 && !!window.Arcade")
        check(ok, f'offline: {g} opens')
    pg.goto(BASE + 'index.html'); pg.wait_for_timeout(500)
    check(pg.locator('.card').count() == 14, 'offline: the hub shows all 14 games')
    # play a bit of a game offline
    pg.goto(BASE + 'rc/index.html'); pg.wait_for_timeout(500)
    pg.mouse.click(640, 380); pg.wait_for_timeout(600)
    pg.click('[data-menu=free]'); pg.wait_for_timeout(200)
    pg.locator('[data-track]').first.click()
    pg.wait_for_function('typeof __rcStep === "function"', timeout=5000)
    pg.evaluate('__rcAuto(true); __rcStep(8)')
    check(pg.evaluate('__rcState().player.progress') > 500, 'offline: RC really plays')
    pg.screenshot(path=str(OUT / 'offline-rc.png'))
    b.close()
srv.shutdown()

check(not errors, f'no JavaScript errors {errors[:3]}')
print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
