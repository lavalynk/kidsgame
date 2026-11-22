"""Look at Jungle Jump's living backgrounds (new plan point 2, part 2) before you ship them (for the daily dev runs).

Run:  python3 tools/preview_jungle_scenery.py      (makes tests/out/preview_jungle_scenery.png)
One picture per level (the 2nd level of a world has its time of day: evening / dawn / twilight),
the background only (no tiles, no hero), with the floaters (leaves, fireflies, glow dots, snow, bubbles).
"""
import pathlib, base64
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent

JS = r'''() => {
  const S = window.__jungleScene, K = 0.5, cols = 2, rows = Math.ceil(S.levels.length / cols);
  const c = document.createElement('canvas'); c.width = cols * S.W * K; c.height = rows * S.H * K;
  const ctx = c.getContext('2d');
  S.levels.forEach((l, i) => {
    ctx.save(); ctx.translate((i % cols) * S.W * K, Math.floor(i / cols) * S.H * K); ctx.scale(K, K);
    ctx.beginPath(); ctx.rect(0, 0, S.W, S.H); ctx.clip();
    S.draw(ctx, l.id, 900 + i * 613, 3 + i * 1.7);
    ctx.fillStyle = '#2b2b2b'; ctx.font = 'bold 34px sans-serif'; ctx.fillText(l.id + (l.time ? ' (' + l.time + ')' : ''), 16, S.H - 16);
    ctx.restore();
  });
  return c.toDataURL();
}'''

with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={'width': 1000, 'height': 700})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto((ROOT / 'jungle' / 'index.html').as_uri()); pg.wait_for_function('window.__jungleScene')
    url = pg.evaluate(JS)
    out = ROOT / 'tests' / 'out' / 'preview_jungle_scenery.png'; out.parent.mkdir(exist_ok=True)
    out.write_bytes(base64.b64decode(url.split(',')[1]))
    b.close()
print('wrote', out, *(['ERRORS:'] + errs if errs else []))
