"""Automated test: the tiny moving previews on the hub's game tiles (Nov 25, new plan point 10, part 3).

Run from the repo folder:   python3 tests/test_previews.py
Checks:
  * every game on the hub has a preview (arcade/previews.js), its cut-out parts are found in its badge, don't overlap,
    and every part starts and ends exactly where it sits in the icon (t = 0 and t = 1)
  * the first and last picture of every preview look like the icon itself (pixels compared)
  * on the hub the previews play one at a time, in turn, only on tiles you can see, and the tile is the icon again after
  * the hub stays a resting menu while one plays (pacing), and tapping a tile in the middle of its preview opens the game
  * none while picking hearts, none in Calm motion
  * an upright phone: only tiles in sight play
Screenshots: tests/out/previews-*.png
"""
import pathlib, sys, math
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from playwright.sync_api import sync_playwright
import cmenu

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
URL = (ROOT / 'index.html').as_uri()
errors, fails = [], []

def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

def fresh(b, vp, calm=False):
    ctx = b.new_context(viewport=vp, reduced_motion='reduce' if calm else 'no-preference')
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(URL)
    pg.evaluate('() => { localStorage.clear(); sessionStorage.clear(); }')
    pg.reload()
    cmenu.wait_screen(pg, 'hub')
    return ctx, pg

def wait_for(pg, js, ms=12000):
    try:
        pg.wait_for_function(js, timeout=ms); return True
    except Exception:
        return False

# the parts' poses at the start + end, and where each cut sits in its badge
SPEC_JS = r'''() => {
  const out = {};
  for (const id of Arcade.previews.games()) {
    const pv = Arcade.previews.build(id), badge = Arcade.badges[id];
    if (!pv) { out[id] = null; continue; }
    const ends = pv.parts.map(p => [Arcade.previews.pose(p, 0), Arcade.previews.pose(p, 1)]);
    // (some steps in between must move: a preview that doesn't move is no preview)
    const moves = pv.parts.some(p => [0.2, 0.4, 0.6, 0.8].some(t => { const q = Arcade.previews.pose(p, t);
      return Math.abs(q.x) + Math.abs(q.y) + Math.abs(q.r) * 30 + Math.abs(q.sx - 1) * 30 + Math.abs(q.a - 1) * 30 > 2; }));
    const cutLen = pv.parts.reduce((n, p) => n + p.svg.length, 0);
    out[id] = { ends, moves, parts: pv.parts.length, badge: badge.length, under: pv.under.length, cutLen, dur: pv.dur };
  }
  return out;
}'''

# the first + last preview pictures against the icon itself: mean color difference per pixel (0-255)
PIX_JS = r'''async () => {
  const tiles = ArcadeMenus.current().rows.flatMap(r => r.items || []).filter(it => it && it.preview);
  const S = 160, load = (svg) => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.src = ArcadeMenus.svgURL(svg, S, S); });
  const data = (draw) => { const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'); draw(x); return x.getImageData(0, 0, S, S).data; };
  const out = {};
  for (const it of tiles) {
    const pv = it.preview;
    const icon = await load(it.pic), under = await load(pv.under), over = await load(pv.over);
    const parts = []; for (const pp of pv.parts) parts.push({ pp, im: await load(pp.svg) });
    const a = data(x => x.drawImage(icon, 0, 0, S, S));
    const diff = (t) => { const b = data(x => ArcadeMenus.paintPreview(x, S, S, under, over, parts, t)); let d = 0; for (let i = 0; i < a.length; i++) d += Math.abs(a[i] - b[i]); return d / a.length; };
    out[pv.id] = [diff(0), diff(1), diff(0.4)];
  }
  return out;
}'''

with sync_playwright() as pw:
    b = pw.chromium.launch()

    # ---- the previews themselves ----
    ctx, pg = fresh(b, {'width': 1280, 'height': 860})
    games = pg.evaluate("ArcadeMenus.previewInfo.order")
    hub_games = pg.evaluate("ArcadeMenus.list().filter(i => i.attr.startsWith('game-')).map(i => i.attr.slice(5))")
    check(sorted(games) == sorted(hub_games) and len(games) == 15, f'every game on the hub has a preview ({len(games)} of {len(hub_games)})')
    spec = pg.evaluate(SPEC_JS)
    for gid, s in spec.items():
        if not s: check(False, f'{gid}: its parts are found in its badge'); continue
        rest = all(abs(q['x']) < 0.5 and abs(q['y']) < 0.5 and abs(math.remainder(q['r'], 2 * math.pi)) < 0.01 and abs(q['sx'] - 1) < 0.01
                   and abs(q['sy'] - 1) < 0.01 and q['a'] > 0.99 for e in s['ends'] for q in e)
        check(rest, f'{gid}: every part starts and ends where it sits in the icon')
        check(s['moves'], f'{gid}: something moves in between')
        # (cut parts don't overlap: what's left + the parts = the badge, give or take the <svg> wrappers)
        wrap = len('<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg"></svg>')
        extra = s['under'] + s['cutLen'] - s['badge'] - wrap * (s['parts'] + 1)
        check(0 <= extra <= 40 * s['parts'], f'{gid}: the cut-out parts don\'t overlap ({extra})')
        check(1800 <= s['dur'] <= 4000, f'{gid}: a preview of 2-4 seconds ({s["dur"]} ms)')
    pix = pg.evaluate(PIX_JS)
    for gid, (d0, d1, dm) in pix.items():
        check(d0 < 1.5 and d1 < 1.5, f'{gid}: the first + last pictures look like the icon (diff {d0:.2f} / {d1:.2f})')

    # ---- on the hub: one at a time, in turn ----
    pg.evaluate('ArcadeMenus.previewGap = 300; ArcadeMenus.previewFirst = 300')
    pg.evaluate("ArcadeMenus.tap('who')"); cmenu.wait_screen(pg, 'hub-players')
    pg.evaluate("ArcadeMenus.tap('close')"); cmenu.wait_screen(pg, 'hub')        # (a fresh hub with the quick timings)
    seen, most, shown_ok, rested = [], 0, True, True
    for i in range(60):
        pg.wait_for_timeout(150)
        tl = pg.evaluate('ArcadeMenus.previewTiles()')
        playing = [t for t in tl if t['playing']]
        most = max(most, len(playing))
        for t in playing:
            if not t['shown']: shown_ok = False
            if not seen or seen[-1] != t['id']: seen.append(t['id'])
        pc = pg.evaluate('ArcadeMenus.pacing()')
        if playing and i > 12 and pc['quick'] and pc['busyFor'] == 0: rested = False
        if i == 8: pg.screenshot(path=str(OUT / 'previews-desktop.png'))
    order = pg.evaluate("ArcadeMenus.previewInfo.order")
    check(len(seen) >= 3, f'previews play one after another ({seen})')
    check(most == 1, f'never more than one at a time ({most})')
    k = order.index(seen[0]) if seen else 0
    check(seen == (order[k:] + order[:k])[:len(seen)], 'in the order of the tiles (taking turns)')
    check(shown_ok, 'only tiles in sight play')
    check(rested, 'the hub stays a resting menu while one plays (not drawn every frame)')
    check(pg.evaluate('ArcadeMenus.previewInfo.frames') > 20, 'the preview pictures are drawn')
    # (in the rest between two previews every tile shows its own icon again)
    check(wait_for(pg, '!ArcadeMenus.previewTiles().some(t => t.playing) && ArcadeMenus.previewInfo.played >= 2', 6000), 'afterwards the tile is the icon again')

    # tap a tile in the middle of its preview: the game opens
    check(wait_for(pg, "ArcadeMenus.previewTiles().some(t => t.playing)", 8000), 'a preview is playing')
    gid = [t['id'] for t in pg.evaluate('ArcadeMenus.previewTiles()') if t['playing']][0]
    cmenu.tap(pg, 'game-' + gid)
    check(wait_for(pg, f"location.href.includes('/{gid}/')", 8000), f'tapping {gid} during its preview opens the game')
    ctx.close()

    # ---- heart mode: no previews ----
    ctx, pg = fresh(b, {'width': 1280, 'height': 860})
    pg.evaluate("ArcadeMenus.tap('who')"); cmenu.wait_screen(pg, 'hub-players')
    pg.evaluate("ArcadeMenus.tap('hearts')"); cmenu.wait_screen(pg, 'hub')
    check(pg.evaluate('ArcadeMenus.previewTiles().length') == 0, 'picking hearts: no previews')
    ctx.close()

    # ---- an upright phone (a short one, so not every tile fits): only tiles in sight ----
    ctx, pg = fresh(b, {'width': 375, 'height': 600})
    pg.evaluate('ArcadeMenus.previewGap = 200; ArcadeMenus.previewFirst = 200')
    pg.evaluate("ArcadeMenus.tap('who')"); cmenu.wait_screen(pg, 'hub-players')
    pg.evaluate("ArcadeMenus.tap('close')"); cmenu.wait_screen(pg, 'hub')
    tl = pg.evaluate('ArcadeMenus.previewTiles()')
    shown = [t['id'] for t in tl if t['shown']]
    check(0 < len(shown) < len(tl), f'phone: some tiles in sight ({len(shown)} of {len(tl)})')
    seen = set()
    for i in range(40):
        pg.wait_for_timeout(200)
        for t in pg.evaluate('ArcadeMenus.previewTiles()'):
            if t['playing']: seen.add(t['id']); check(t['shown'], f'phone: {t["id"]} plays while in sight') if not t['shown'] else None
        if i == 6: pg.screenshot(path=str(OUT / 'previews-phone.png'))
    check(seen and seen <= set(shown), f'phone: only tiles in sight played ({sorted(seen)})')
    ctx.close()

    # ---- Calm motion ----
    ctx, pg = fresh(b, {'width': 1280, 'height': 860}, calm=True)
    pg.evaluate('ArcadeMenus.previewGap = 200; ArcadeMenus.previewFirst = 200')
    pg.wait_for_timeout(4000)
    check(pg.evaluate('ArcadeMenus.previewInfo.played') == 0 and not pg.evaluate('ArcadeMenus.previewInfo.now'), 'Calm motion: no previews')
    ctx.close()
    b.close()

check(not errors, f'no JavaScript errors ({errors[:3]})')
print('\nAll passed' if not fails else f'\n{len(fails)} FAILED')
sys.exit(1 if fails else 0)
