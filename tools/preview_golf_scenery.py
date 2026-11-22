"""Look at Putt-Putt Park's living backgrounds before you ship them (for the daily dev runs).

Run:  python3 tools/preview_golf_scenery.py      (makes tests/out/preview_golf_scenery.png)
One picture per hole (park h1-h9, beach b1-b9; h8 + b8 = sunset, h9 + b9 = evening), scenery + greens only
(no walls' extras, no ball), each at a different moment so the butterflies, gulls and fireflies show.
"""
import pathlib, base64
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent

JS = r'''() => {
  const S = window.__golfScene, ids = S.levels.map(l => l.id);
  const k = 0.42, cols = 3, c = document.createElement('canvas');
  c.width = cols * S.W * k; c.height = Math.ceil(ids.length / cols) * S.H * k;
  const ctx = c.getContext('2d');
  ids.forEach((id, i) => {
    ctx.save(); ctx.translate((i % cols) * S.W * k, Math.floor(i / cols) * S.H * k); ctx.scale(k, k); ctx.beginPath(); ctx.rect(0, 0, S.W, S.H); ctx.clip();
    S.draw(ctx, id, 3 + i * 1.7); ctx.restore();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect((i % cols) * S.W * k, Math.floor(i / cols) * S.H * k, S.W * k, S.H * k);
  });
  return c.toDataURL();
}'''

with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={'width': 1000, 'height': 700})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto((ROOT / 'golf' / 'index.html').as_uri()); pg.wait_for_function('window.__golfScene')
    url = pg.evaluate(JS)
    out = ROOT / 'tests' / 'out' / 'preview_golf_scenery.png'; out.parent.mkdir(exist_ok=True)
    out.write_bytes(base64.b64decode(url.split(',')[1]))
    print('wrote', out, 'errors:', errs)
    b.close()
