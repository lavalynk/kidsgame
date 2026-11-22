"""Look at Jungle Jump's characters before you ship them (for the daily dev runs).

Run:  python3 tools/preview_jungle.py            (makes tests/out/preview_jungle.png)
      python3 tools/preview_jungle.py 2          (2 = bigger, to see the details)
Draws every hero in every pose (idle, run x2, jump, fall, glide, hurt, blink, rolling)
and every world's critter (walking, blinking, squished), on a sky and a dark cave
background, at the real game size (top) so you can judge how it reads while playing.
"""
import sys, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
K = float(sys.argv[1]) if len(sys.argv) > 1 else 1.5

JS = r'''(K) => {
  const A = window.__jungleArt;
  const c = document.createElement('canvas');
  const CW = 100, RH = 110;
  const poses = [['idle', 0, 0.5], ['run', 0.6, 1], ['run', 2.2, 1.3], ['jump', 0, 0], ['fall', 0, 0.4],
                 ['glide', 0, 0.3], ['hurt', 0, 0], ['idle', 0, 0, true], ['roll']];
  c.width = (poses.length + 1) * CW * K; c.height = (A.HEROES.length + 5) * RH * K;
  const ctx = c.getContext('2d'); ctx.scale(K, K);
  ctx.fillStyle = '#bfe8ff'; ctx.fillRect(0, 0, c.width, c.height);
  A.HEROES.forEach((h, r) => poses.forEach(([st, ph, t, blink], i) => {
    const x = 60 + i * CW, y = 20 + (r + 1) * RH - 20;
    ctx.fillStyle = '#7cc45a'; ctx.fillRect(x - 46, y, 92, 6);
    if (st === 'roll') { A.drawRollBall(ctx, h, x, y - 22, 1, 0.8, 0.3); return; }
    if (st === 'glide') A.drawLeaf(ctx, x, y - 49, t);
    A.drawHero(ctx, h, x, y, { state: st, phase: ph, t, face: i % 2 ? -1 : 1, blink, shadow: st === 'idle' });
  }));
  const kinds = Object.keys(A.WORLDS);
  kinds.forEach((k, r) => {
    const y0 = (A.HEROES.length + 1 + r) * RH;
    ctx.fillStyle = A.WORLDS[k].sky[0]; ctx.fillRect(0, y0 - 10, c.width / K, RH);
    [[0.0, 1, 0], [0.4, -1, 0], [1.3, 1, 0], [0.2, 1, 0.6], [2.1, -1, 0]].forEach(([t, dir, sq], i) => {
      const x = 60 + i * 130, y = y0 + RH - 30;
      ctx.fillStyle = A.WORLDS[k].top; ctx.fillRect(x - 50, y, 100, 6);
      A.drawCritter(ctx, { alive: true, x: x - 20, y: y - 40, w: 40, h: 40, dir, squish: sq, x0: 3 }, t, k);
    });
  });
  return c.toDataURL();
}'''

with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={'width': 1000, 'height': 700})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto((ROOT / 'jungle' / 'index.html').as_uri()); pg.wait_for_function('window.__jungleArt')
    url = pg.evaluate(JS, K)
    out = ROOT / 'tests' / 'out' / 'preview_jungle.png'; out.parent.mkdir(exist_ok=True)
    import base64; out.write_bytes(base64.b64decode(url.split(',')[1])); b.close()
print('wrote', out, *(['ERRORS:'] + errs if errs else []))
