"""Look at Archery's targets, balloons, stars and the prize wheel before you ship them (for the daily dev runs).

Run:  python3 tools/preview_archery.py          (makes tests/out/preview_archery.png)
      python3 tools/preview_archery.py 1        (1 = real size; default 2 = bigger, to see the details)
Row 1: a target on its easel, a turning target (3 moments), the target on the sliding pole, the cart.
Row 2: the 6 balloons (every color + picture), the golden star (open eyes + blinking).
Row 3: the prize wheel (two moments) and the "POP!" burst (3 moments).
"""
import sys, pathlib, base64
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
K = float(sys.argv[1]) if len(sys.argv) > 1 else 2

JS = r'''(K) => {
  const A = window.__archeryArt, G = A.GROUND;
  const c = document.createElement('canvas'), Wd = 1000, RH = 260;
  c.width = Wd * K; c.height = 3 * RH * K;
  const ctx = c.getContext('2d'); ctx.scale(K, K);
  const sky = ctx.createLinearGradient(0, 0, 0, 3 * RH); sky.addColorStop(0, '#7fd0ff'); sky.addColorStop(1, '#e2f6ff');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, Wd, 3 * RH);
  // things stand on GROUND (470), so shift each row so the ground sits at its bottom
  const row = (i, f) => { ctx.save(); ctx.translate(0, (i + 1) * RH - 20 - G); ctx.fillStyle = '#6abf69'; ctx.fillRect(0, G, Wd, 20); f(); ctx.restore(); };
  const base = { alive: true, ph: 0, respawn: 0 };
  row(0, () => {
    A.draw(ctx, Object.assign({}, base, { kind: 'ring', x: 90, r: 60, leg: 28 }), 0);
    [0.3, 0.8, 1.6].forEach((t, i) => A.draw(ctx, Object.assign({}, base, { kind: 'ring', x: 230 + i * 120, r: 55, leg: 28, spin: 1.5 }), t));
    A.draw(ctx, Object.assign({}, base, { kind: 'ring', x: 640, r: 50, leg: 28, move: { ax: 'y', amp: 60, speed: 1 } }), 0.5);
    A.draw(ctx, Object.assign({}, base, { kind: 'ring', x: 840, r: 50, leg: 28, cart: true }), 0.7);
  });
  row(1, () => {
    for (let i = 0; i < 6; i++) A.draw(ctx, Object.assign({}, base, { kind: 'balloon', x: 70 + i * 115, y: G - 130, r: 30, color: A.BALLOON_COLORS[i], pat: A.BALLOON_PATS[i], ph: i }), 0.4);
    A.draw(ctx, Object.assign({}, base, { kind: 'star', x: 790, y: G - 110, r: 26 }), 1.0);
    A.draw(ctx, Object.assign({}, base, { kind: 'star', x: 920, y: G - 110, r: 26 }), 3.25);
  });
  row(2, () => {
    A.draw(ctx, Object.assign({}, base, { kind: 'wheel', x: 120, R: 80, leg: 40, spin: 1.1, segs: [2, 5, 2, 10, 2, 5] }), 0);
    A.draw(ctx, Object.assign({}, base, { kind: 'wheel', x: 340, R: 80, leg: 40, spin: 1.1, segs: [2, 5, 2, 10, 2, 5] }), 0.6);
    [0.02, 0.12, 0.24].forEach((t, i) => A.pop(ctx, 560 + i * 140, G - 120, '#ef476f', t));
  });
  return c.toDataURL();
}'''

with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={'width': 1000, 'height': 700})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto((ROOT / 'archery' / 'index.html').as_uri()); pg.wait_for_function('window.__archeryArt')
    url = pg.evaluate(JS, K)
    out = ROOT / 'tests' / 'out' / 'preview_archery.png'; out.parent.mkdir(exist_ok=True)
    out.write_bytes(base64.b64decode(url.split(',')[1]))
    b.close()
print('wrote', out, *(['ERRORS:'] + errs if errs else []))
