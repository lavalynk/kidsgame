"""Look at the hub's tiny moving tile previews (new plan point 10, part 3) before you ship them (for the daily dev runs).

Run:  python3 tools/preview_tiles.py [game ...]      (makes tests/out/preview_tiles.png)
One row per game: its preview at 8 moments from start to end (the first and the last must look like the icon),
drawn by the same code the hub uses (ArcadeMenus.paintPreview, parts from arcade/previews.js).
"""
import pathlib, base64, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / 'tests'))
from playwright.sync_api import sync_playwright
import cmenu
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)

JS = r'''async (only) => {
  const tiles = ArcadeMenus.current().rows.flatMap(r => r.items || []).filter(it => it && it.preview);
  const pick = tiles.filter(it => !only.length || only.includes(it.preview.id));
  const S = 150, N = 8, pad = 8;
  const c = document.createElement('canvas'); c.width = N * (S + pad) + 90; c.height = pick.length * (S + pad);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#2d1f6e'; ctx.fillRect(0, 0, c.width, c.height);
  const load = (svg) => new Promise(res => { const im = new Image(); im.onload = () => res(im);
    im.src = ArcadeMenus.svgURL(svg, S * 2, S * 2); });
  for (let r = 0; r < pick.length; r++) {
    const pv = pick[r].preview;
    const under = await load(pv.under), over = await load(pv.over);
    const parts = [];
    for (const pp of pv.parts) parts.push({ pp, im: await load(pp.svg) });
    const cv = document.createElement('canvas'); cv.width = cv.height = S * 2;
    for (let i = 0; i < N; i++) {
      ArcadeMenus.paintPreview(cv.getContext('2d'), S * 2, S * 2, under, over, parts, i / (N - 1));
      ctx.drawImage(cv, 90 + i * (S + pad), r * (S + pad), S, S);
    }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.fillText(pv.id, 8, r * (S + pad) + S / 2);
  }
  return c.toDataURL();
}'''

only = sys.argv[1:]
with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 860})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto((ROOT / 'index.html').as_uri()); cmenu.wait_screen(pg, 'hub')
    url = pg.evaluate(JS, only)
    (OUT / 'preview_tiles.png').write_bytes(base64.b64decode(url.split(',')[1]))
    print('wrote tests/out/preview_tiles.png', errs or '')
