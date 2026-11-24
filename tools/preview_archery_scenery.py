"""Look at Archery's living backgrounds before you ship them (for the daily dev runs).

Run:  python3 tools/preview_archery_scenery.py      (makes tests/out/preview_archery_scenery.png)
One picture per level (4 places x 3 levels; Autumn Woods: Golden Woods = sunset: Hilltop = evening, Prize Wheel = sunset, Snowy Slide = dawn),
then the same Sunny Meadow 3 seconds later (things moved by themselves). Targets are left out: only the scenery.
"""
import pathlib, base64
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent

JS = r'''() => {
  const S = window.__archeryScene, ids = ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9', 'practice', 'fr-beach', 'fr-snow', 'l10', 'l11', 'l12'];
  const k = 0.5, cols = 3, c = document.createElement('canvas');
  c.width = cols * S.W * k; c.height = Math.ceil(ids.length / cols) * S.H * k;
  const ctx = c.getContext('2d');
  ids.forEach((id, i) => {
    ctx.save(); ctx.translate((i % cols) * S.W * k, Math.floor(i / cols) * S.H * k); ctx.scale(k, k);
    S.draw(ctx, id, i === 9 ? 5 : 2); ctx.restore();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect((i % cols) * S.W * k, Math.floor(i / cols) * S.H * k, S.W * k, S.H * k);
  });
  return c.toDataURL();
}'''

with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={'width': 1000, 'height': 700})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto((ROOT / 'archery' / 'index.html').as_uri()); pg.wait_for_function('window.__archeryScene')
    url = pg.evaluate(JS)
    out = ROOT / 'tests' / 'out' / 'preview_archery_scenery.png'; out.parent.mkdir(exist_ok=True)
    out.write_bytes(base64.b64decode(url.split(',')[1]))
    print('wrote', out, 'errors:', errs)
    b.close()
