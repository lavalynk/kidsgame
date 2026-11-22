"""Look at Turbo Bike's living backgrounds (new plan point 2) before you ship them (for the daily dev runs).

Run:  python3 tools/preview_bike_scenery.py      (makes tests/out/preview_bike_scenery.png)
One picture per place (+ the evening and dawn looks), the background only (no track, no riders),
each drawn with the camera part-way along so you can see the strips join up.
"""
import pathlib, base64
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent

JS = r'''() => {
  const S = window.__bikeScene, Wd = 960, Hh = 400, K = 0.5;
  const looks = S.places.map(p => [p, '']).concat([['forest', 'evening'], ['snow', 'dawn']]);
  const cols = 3, rows = Math.ceil(looks.length / cols);
  const c = document.createElement('canvas'); c.width = cols * Wd * K; c.height = rows * Hh * K;
  const ctx = c.getContext('2d');
  looks.forEach(([p, tm], i) => {
    ctx.save(); ctx.translate((i % cols) * Wd * K, Math.floor(i / cols) * Hh * K); ctx.scale(K, K);
    ctx.beginPath(); ctx.rect(0, 0, Wd, Hh); ctx.clip();
    S.draw(ctx, p, tm, 2600 + i * 777, 3 + i);
    ctx.fillStyle = '#2b2b2b'; ctx.font = 'bold 34px sans-serif'; ctx.fillText(p + (tm ? ' (' + tm + ')' : ''), 16, 390);
    ctx.restore();
  });
  return c.toDataURL();
}'''

with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={'width': 1000, 'height': 700})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto((ROOT / 'bike' / 'index.html').as_uri()); pg.wait_for_function('window.__bikeScene')
    url = pg.evaluate(JS)
    out = ROOT / 'tests' / 'out' / 'preview_bike_scenery.png'; out.parent.mkdir(exist_ok=True)
    out.write_bytes(base64.b64decode(url.split(',')[1]))
    b.close()
print('wrote', out, *(['ERRORS:'] + errs if errs else []))
