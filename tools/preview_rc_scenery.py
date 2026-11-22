"""Look at Mini RC Racers' living backgrounds before you ship them (for the daily dev runs).

Run:  python3 tools/preview_rc_scenery.py      (makes tests/out/preview_rc_scenery.png)
One picture per track (t1-t10) just after the start, each at a different moment so the floaters show.
Autumn Woods = sunset, Desert Dunes = dawn, Jungle Rally = evening.
"""
import pathlib, base64, json
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent

SHOT = r'''([id, t]) => {
  const S = window.__rcScene, c = document.createElement('canvas'); c.width = S.W; c.height = S.H;
  S.draw(c.getContext('2d'), t); return c.toDataURL();
}'''
JOIN = r'''(urls) => new Promise(done => {
  const k = 0.5, cols = 2, W = 960 * k, H = 540 * k, c = document.createElement('canvas');
  c.width = cols * W; c.height = Math.ceil(urls.length / cols) * H; const ctx = c.getContext('2d'); let left = urls.length;
  urls.forEach((u, i) => { const im = new Image(); im.onload = () => { ctx.drawImage(im, (i % cols) * W, Math.floor(i / cols) * H, W, H);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect((i % cols) * W, Math.floor(i / cols) * H, W, H); if (--left === 0) done(c.toDataURL()); }; im.src = u; });
})'''

with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 760})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto((ROOT / 'rc' / 'index.html').as_uri())
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': 'big'}]}
    pg.evaluate("p => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); }", json.dumps(prof))
    pg.reload(); pg.wait_for_timeout(500); pg.mouse.click(640, 380); pg.wait_for_timeout(600)
    urls = []
    for i in range(1, 11):
        pg.evaluate(f"__game.play({{ id: 't{i}' }})")
        pg.wait_for_function(f"typeof __rcStep === 'function' && __rcState().track === 't{i}' && __rcState().raceTime === 0")
        pg.evaluate('__rcStep(3.4); __rcStep(2.5)')
        urls.append(pg.evaluate(SHOT, [f't{i}', 4 + i * 1.3]))
    url = pg.evaluate(JOIN, urls)
    out = ROOT / 'tests' / 'out' / 'preview_rc_scenery.png'; out.parent.mkdir(exist_ok=True)
    out.write_bytes(base64.b64decode(url.split(',')[1]))
    print('wrote', out, 'errors:', errs)
    b.close()
