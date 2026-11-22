"""Look at Space Defender's ships and enemies before you ship them (for the daily dev runs).

Run:  python3 tools/preview_space.py            (makes tests/out/preview_space.png)
      python3 tools/preview_space.py 3          (3 = bigger, to see the details)
Row 1: the 6 ships (with their flame). Row 2: the same ships tilted + small (lives icon size).
Rows 3-4: every small enemy at 3 moments (blinking, wiggling) + flashing white when hit.
Row 5: a few mini bosses (a big enemy wearing a hat). All on the dark space background.
Also tests/out/preview_space_menu.png: the ship pictures the menus show (SVG).
"""
import sys, pathlib, base64
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
K = float(sys.argv[1]) if len(sys.argv) > 1 else 2

JS = r'''(K) => {
  const A = window.SpaceArt, SHIPS = window.__spaceShips;
  const c = document.createElement('canvas');
  const CW = 120, RH = 110, types = ['bobber', 'squad', 'diver', 'rock', 'shooter', 'zigzag', 'splitter', 'orbiter', 'gift'];
  c.width = 9 * CW * K; c.height = (4 + Math.ceil(types.length * 4 / 9) + 2) * RH * K;
  const ctx = c.getContext('2d'); ctx.scale(K, K);
  ctx.fillStyle = '#1b1f4b'; ctx.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 120; i++) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect((i * 97) % (9 * CW), (i * 53) % (c.height / K), 2, 2); }
  A.tick(0.37);
  SHIPS.forEach((s, i) => A.drawShip(ctx, 70 + i * 150, 60, s, {}));
  SHIPS.forEach((s, i) => { A.drawShip(ctx, 70 + i * 150, 160, s, { tilt: -0.25 }); A.drawShip(ctx, 130 + i * 150, 170, s, { scale: 0.42, noFlame: true }); });
  const cols = ['#ff8fab', '#8ecae6', '#ffd166'];
  let n = 0;
  types.forEach((type, ti) => [0, 1.7, 3.37, 0.5].forEach((t, k) => {
    const x = 60 + (n % 9) * CW, y = 2.6 * RH + Math.floor(n / 9) * RH; n++;
    A.tick(t);
    A.drawEnemy(ctx, { type, x, y, t, color: cols[(ti + k) % 3], r: 34, flash: k === 3 ? 1 : 0, dy: ti, rot: t, puff: type === 'shooter' && k === 2 ? 0.8 : 0, hp: 5, max: 8 });
  }));
  const minis = window.__spaceMinis;
  const y = 2.6 * RH + Math.ceil(n / 9) * RH + 80;
  minis.slice(0, 5).forEach((m, i) => { ctx.save(); ctx.translate(100 + i * 210, y); ctx.scale(0.75, 0.75); A.drawMini(ctx, { def: m, t: 1.1, mode: 'move', modeT: 0 }, false); ctx.restore(); });
  return c.toDataURL();
}'''

with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={'width': 1000, 'height': 700})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto((ROOT / 'space' / 'index.html').as_uri()); pg.wait_for_function('window.SpaceArt && window.__spaceShips')
    pg.evaluate('window.__spaceMinis = Object.values(SpaceData.MINIS || {})')
    url = pg.evaluate(JS, K)
    out = ROOT / 'tests' / 'out' / 'preview_space.png'; out.parent.mkdir(exist_ok=True)
    out.write_bytes(base64.b64decode(url.split(',')[1]))
    # the menu pictures (SVG, as the ship picker shows them) -> preview_space_menu.png
    pg.evaluate('''() => { const d = document.createElement('div'); d.id = 'pv';
      d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#fff;display:flex;gap:10px;padding:10px';
      d.innerHTML = __spaceShips.map(s => `<div style="width:140px">${__spaceShipSVG(s)}</div>`).join('');
      document.body.appendChild(d); }''')
    pg.screenshot(path=str(out.parent / 'preview_space_menu.png'), clip={'x': 0, 'y': 0, 'width': 920, 'height': 120})
    b.close()
print('wrote', out, *(['ERRORS:'] + errs if errs else []))
