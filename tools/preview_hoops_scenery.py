"""Look at Hoop Heroes' living backgrounds before you ship them (for the daily dev runs).

Run:  python3 tools/preview_hoops_scenery.py      (makes tests/out/preview_hoops_scenery.png)
One picture per level, the hall only (no machines): the windows go day -> sunset (Sam, Bella) ->
evening (Tia, Wes) -> night (the Champ: golden spotlights + confetti; High Score: disco lights).
Drawn 1280 wide (a wide screen) except the last one, 960 wide (the narrowest the game gets).
"""
import pathlib, base64
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent

JS = r'''() => {
  const S = window.__hoopsScene, ids = S.levels.map(l => l.id).concat(['r1']);
  const k = 0.36, cols = 2, CW = 1280, c = document.createElement('canvas');
  c.width = cols * CW * k; c.height = Math.ceil(ids.length / cols) * S.H * k;
  const ctx = c.getContext('2d');
  ids.forEach((id, i) => {
    const w = i === ids.length - 1 ? 960 : CW;
    ctx.save(); ctx.translate((i % cols) * CW * k, Math.floor(i / cols) * S.H * k); ctx.scale(k, k);
    ctx.beginPath(); ctx.rect(0, 0, w, S.H); ctx.clip();
    S.draw(ctx, id, 4 + i * 1.3, w); ctx.restore();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect((i % cols) * CW * k, Math.floor(i / cols) * S.H * k, w * k, S.H * k);
  });
  return c.toDataURL();
}'''

with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={'width': 1000, 'height': 700})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto((ROOT / 'hoops' / 'index.html').as_uri()); pg.wait_for_function('window.__hoopsScene')
    url = pg.evaluate(JS)
    out = ROOT / 'tests' / 'out' / 'preview_hoops_scenery.png'; out.parent.mkdir(exist_ok=True)
    out.write_bytes(base64.b64decode(url.split(',')[1]))
    print('wrote', out, 'errors:', errs)
    b.close()
