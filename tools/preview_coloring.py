"""Look at coloring pages before you ship them (for the daily dev runs).

Run:  python3 tools/preview_coloring.py cow frog apple      (or no names = every page)
Makes tests/out/preview_coloring.png: each page blank (top) and filled with random colors
(bottom), so gaps, stray lines, shapes poking out and clipped edges are easy to spot.
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
C = ROOT / 'coloring'
ids = sys.argv[1:]
src = ''.join((C / f).read_text() for f in ['animals.js', 'fruit.js', 'things.js'])
S = 220
html = f'''<html><head><style>{(C / 'pages.css').read_text()}
body {{ margin: 0; background: #bbb; padding: 6px; }}
.row {{ display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; width: {(S + 6) * 8}px; }}
.page {{ width: {S}px; }}</style></head><body><div class="row" id="a"></div><div class="row" id="b"></div>
<script>{src}</script><script>
const want = {json.dumps(ids)}, C = ['#ef476f','#ffd166','#06d6a0','#118ab2','#f78c6b','#9b5de5','#8ac926','#ff99c8','#a0c4ff'];
for (const p of PAGES) if (!want.length || want.includes(p.id)) for (const row of ['a', 'b']) {{
  const d = document.createElement('div'); d.className = 'page'; d.innerHTML = p.html; d.title = p.id;
  if (row === 'b') d.querySelectorAll('.r').forEach((r, i) => r.style.setProperty('--fill', C[(i * 7) % 9]));
  document.getElementById(row).appendChild(d);
}}
</script></body></html>'''
with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={'width': (S + 6) * 8 + 12, 'height': 600})
    pg.set_content(html); out = ROOT / 'tests' / 'out' / 'preview_coloring.png'
    out.parent.mkdir(exist_ok=True); pg.screenshot(path=str(out), full_page=True); b.close()
print('wrote', out)
