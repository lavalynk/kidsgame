"""Look at Treasure Trail's living backgrounds (new plan point 2, part 2) before you ship them (for the daily dev runs).

Run:  python3 tools/preview_trail_scenery.py      (makes tests/out/preview_trail_scenery.png)
The first room of every adventure, then Sunset Swamp's rooms getting later and later (dusk -> night with stars
and fireflies). Background + path only (no explorer), with the floaters (leaves, butterflies, mist, dust, fireflies).
"""
import pathlib, base64
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent

JS = r'''() => {
  const S = window.__trailScene, K = 0.5, cols = 2;
  const sw = S.adventures.find(a => a.id === 'dusk');
  const looks = S.adventures.map(a => [a.id, 1]).concat([['dusk', 0], ['dusk', Math.round(sw.rooms / 2)], ['dusk', sw.rooms - 2], ['dusk', sw.rooms - 1]]);
  const rows = Math.ceil(looks.length / cols);
  const c = document.createElement('canvas'); c.width = cols * S.W * K; c.height = rows * S.H * K;
  const ctx = c.getContext('2d');
  looks.forEach(([id, r], i) => {
    ctx.save(); ctx.translate((i % cols) * S.W * K, Math.floor(i / cols) * S.H * K); ctx.scale(K, K);
    ctx.beginPath(); ctx.rect(0, 0, S.W, S.H); ctx.clip();
    S.draw(ctx, id, r, 3 + i * 1.7);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 34px sans-serif'; ctx.fillText(id + ' room ' + r, 16, S.H - 16);
    ctx.restore();
  });
  return c.toDataURL();
}'''

with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={'width': 1000, 'height': 700})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto((ROOT / 'trail' / 'index.html').as_uri()); pg.wait_for_function('window.__trailScene')
    url = pg.evaluate(JS)
    out = ROOT / 'tests' / 'out' / 'preview_trail_scenery.png'; out.parent.mkdir(exist_ok=True)
    out.write_bytes(base64.b64decode(url.split(',')[1]))
    b.close()
print('wrote', out, *(['ERRORS:'] + errs if errs else []))
