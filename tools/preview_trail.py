"""Look at Treasure Trail's characters before you ship them (for the daily dev runs).

Run:  python3 tools/preview_trail.py            (makes tests/out/preview_trail.png)
      python3 tools/preview_trail.py 2          (2 = bigger, to see the details)
Row 1: the explorer standing, running (3 moments), jumping up, falling, hurt, climbing, swinging.
Row 2: the explorer in every hat, + with the parrot. Row 3: the parrot, bats (wing frames).
Row 4: hippos (up, blinking, yawning, half under), snakes (asleep, awake), a rolling log.
Drawn at the real game size on a jungle-green background.
"""
import sys, pathlib, base64
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
K = float(sys.argv[1]) if len(sys.argv) > 1 else 2

JS = r'''(K) => {
  const A = window.__trailArt, { GROUND, PW, PH } = window.__trailDebug;
  const c = document.createElement('canvas'), CW = 100, RH = 120;
  c.width = 10 * CW * K; c.height = 5 * RH * K;
  const ctx = c.getContext('2d'); ctx.scale(K, K);
  const sky = ctx.createLinearGradient(0, 0, 0, 5 * RH); sky.addColorStop(0, '#9ee6ff'); sky.addColorStop(1, '#7cc47a');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 10 * CW, 5 * RH);
  const pl = (o) => Object.assign({ x: -PW / 2, y: -PH, w: PW, h: PH, vx: 0, vy: 0, onGround: true, face: 1, mode: 'walk', run: 0, stun: 0 }, o);
  const at = (x, y, f) => { ctx.save(); ctx.translate(x, y); f(); ctx.restore(); };
  const ground = (y) => { ctx.fillStyle = 'rgba(80,50,20,0.25)'; ctx.fillRect(0, y, 10 * CW, 3); };
  // row 1: poses
  ground(RH - 10);
  const vine = { px: 0, py: -160, L: 100, A: 0.3, w: 1.5, ph: 0 };
  const poses = [{}, { vx: 200, run: 0.3 }, { vx: 200, run: 1.6 }, { vx: 200, run: 2.9 }, { onGround: false, vy: -300 },
    { onGround: false, vy: 400 }, { stun: 1 }, { mode: 'ladder', climbT: 0.2 }, { face: -1 }];
  poses.forEach((o, i) => at(55 + i * CW, RH - 10, () => A.drawExplorer(ctx, pl(o), 0.5 + i * 0.1, true)));
  // row 2: hats (+ the parrot on the last one)
  ground(2 * RH - 10);
  A.HATS.forEach((h, i) => { A.setHat(h.id, false); at(55 + i * CW, 2 * RH - 10, () => A.drawExplorer(ctx, pl({}), 0.5, true)); });
  A.setHat('safari', true); at(55 + 5 * CW, 2 * RH - 10, () => A.drawExplorer(ctx, pl({}), 0.5, false)); A.setHat('safari', false);
  // row 3: parrot + bats
  [0, 0.2, 4.3].forEach((t, i) => at(60 + i * CW, 3 * RH - 40, () => { ctx.scale(2, 2); A.drawParrot(ctx, 0, 0, t, i === 1); }));
  [0, 0.09, 0.17, 0.25, 1.4].forEach((t, i) => A.drawBat(ctx, { x: 360 + i * CW, y: 3 * RH - 55, ph: 0 }, t));
  // row 4: hippos (drawn at the pond surface: shift so GROUND sits on this row)
  const pondY = 4 * RH - 30;
  ctx.fillStyle = '#3aa7e0'; ctx.fillRect(0, pondY, 6 * CW, RH - 10 + 30);
  [[0, 0], [3.05, 0], [5.6, 0], [0.5, 1]].forEach(([t, k], i) => at(0, pondY - GROUND - 30, () => A.drawHippo(ctx, { cx: 70 + i * 140, ph: 0, up: 1 }, t)));
  ground(4 * RH - 10 + 70);
  at(0, 4 * RH + 60 - GROUND, () => { A.drawSnake(ctx, { x: 640 }, 4.9); A.drawSnake(ctx, { x: 760 }, 0.35); A.drawLog(ctx, { x: 900, a: 0.7 }); });
  return c.toDataURL();
}'''

with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={'width': 1000, 'height': 700})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto((ROOT / 'trail' / 'index.html').as_uri()); pg.wait_for_function('window.__trailArt')
    url = pg.evaluate(JS, K)
    out = ROOT / 'tests' / 'out' / 'preview_trail.png'; out.parent.mkdir(exist_ok=True)
    out.write_bytes(base64.b64decode(url.split(',')[1]))
    b.close()
print('wrote', out, *(['ERRORS:'] + errs if errs else []))
