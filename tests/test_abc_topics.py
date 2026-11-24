"""Automated test: Bubble School's Colors + Shapes topics (Nov 24, new plan point 7).

Run:  python3 tests/test_abc_topics.py
Checks: the two topics are open from the start (and don't lock the others: an old save with
Count to 5 done still has Letters A to E open), the old topics keep their Easy / Normal / Challenge,
the questions (colors / shapes, find + "what color / shape is the ...?"), little kids get the easy
colors + shapes with 3 bubbles, big kids 4 and all of them, every shape bubble has its own color,
a whole topic plays to the results, finishing both = the Rainbow shapes trophy + the Pufferfish,
and the pretend child finishes them. Screenshots in tests/out/abc-topics-*.png.
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright
import cmenu as cm
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

def open_page(b, little, vp={'width': 1280, 'height': 760}):
    pg = b.new_page(viewport=vp)
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto((ROOT / 'abc' / 'index.html').as_uri())
    prof = {'active': 'p1', 'list': [{'id': 'p1', 'name': '', 'pet': 'cat', 'color': '#ef476f', 'age': 'little' if little else 'big'}]}
    pg.evaluate("p => { localStorage.clear(); localStorage.setItem('kidsArcade.profiles', p); }", json.dumps(prof))
    pg.reload(); pg.wait_for_timeout(300)
    cm.to_title(pg)
    pg.evaluate("__game.save.data.voice = false")
    return pg

def play(pg, lid):
    pg.evaluate(f"__game.play(__abcLevel('{lid}'))")
    pg.wait_for_function(f"typeof __abcState === 'function' && __abcState().level === '{lid}'")
    pg.wait_for_timeout(700)

def questions(pg, lid, n=40):
    """Make n questions the way the game does (by answering), return [(kind, show, answer, choices, tints)]."""
    seen = []
    for _ in range(n):
        st = pg.evaluate('__abcState()')
        if st['done']: play(pg, lid); continue
        seen.append(pg.evaluate("(() => { const s = __abcState(); return s; })()"))
        pg.evaluate('__abcTap(__abcState().answer)'); pg.wait_for_timeout(60)
        pg.evaluate('__abcStep(1.4)')
    return seen

with sync_playwright() as pw:
    b = pw.chromium.launch()
    # ---- the topic list: open, locks, difficulty ----
    pg = open_page(b, False)
    cm.tap(pg, 'levels'); cm.wait_screen(pg, 'levels')
    lv = {i['attr']: i for i in cm.items(pg) if i['attr'].startswith('level-')}
    check('level-l14' in lv and 'level-l15' in lv, 'Colors + Shapes are on the topic list')
    check(not lv['level-l14']['locked'] and not lv['level-l15']['locked'], 'Colors + Shapes are open from the start')
    check(lv['level-l2']['locked'], 'Letters A to E still waits for Count to 5')
    pg.screenshot(path=str(OUT / 'abc-topics-list.png'))
    pg.evaluate("__game.save.levels.l1 = { done: true, stars: 3 }; __game.store()")
    cm.tap(pg, 'back'); cm.wait_screen(pg, 'title'); cm.tap(pg, 'levels'); cm.wait_screen(pg, 'levels')
    lv = {i['attr']: i for i in cm.items(pg) if i['attr'].startswith('level-')}
    check(not lv['level-l2']['locked'], 'an old save with Count to 5 done: Letters A to E is open (Colors / Shapes not needed)')
    check(lv['level-l3']['locked'], '... and Count to 10 still waits for Letters A to E')
    for lid, want in [('l14', 'easy'), ('l15', 'easy'), ('l1', 'easy'), ('l5', 'easy'), ('l6', 'normal'), ('l9', 'normal'), ('l10', 'challenge'), ('l13', 'challenge')]:
        play(pg, lid)
        got = pg.evaluate('__abcKidReport().diff')
        check(got == want, f'{lid} plays on {want} (got {got})')

    # ---- big kid: questions ----
    play(pg, 'l14')
    pg.screenshot(path=str(OUT / 'abc-topics-color-big.png'))
    qs = questions(pg, 'l14')
    colors = {'red', 'yellow', 'blue', 'green', 'orange', 'purple', 'pink', 'brown'}
    check(all(q['kind'] == 'color' and q['answer'] in colors and len(q['choices']) == 4 and q['answer'] in q['choices'] for q in qs),
          'big kid Colors: 4 color bubbles, the answer among them')
    check(len({q['answer'] for q in qs}) >= 6, f"big kid Colors: many colors asked ({sorted({q['answer'] for q in qs})})")
    check(any(c in ('pink', 'brown') for q in qs for c in q['choices']), 'big kid Colors: pink + brown show up')
    play(pg, 'l15')
    pg.wait_for_timeout(300)
    pg.screenshot(path=str(OUT / 'abc-topics-shape-big.png'))
    qs = questions(pg, 'l15')
    shapes = {'circle', 'square', 'triangle', 'star', 'heart', 'rectangle', 'oval', 'diamond'}
    check(all(q['kind'] == 'shape' and q['answer'] in shapes and len(q['choices']) == 4 for q in qs), 'big kid Shapes: 4 shape bubbles')
    check(len({q['answer'] for q in qs}) >= 6, f"big kid Shapes: many shapes asked ({sorted({q['answer'] for q in qs})})")
    check(all(len(set(q['tints'][c] for c in q['choices'])) == len(q['choices']) for q in qs), 'every shape bubble has its own color')
    check({q['show'] for q in qs} == {'shapefind', 'shapething'}, f"Shapes asks both kinds (find it / what shape is the ...?)")
    # (one whole level to the results)
    play(pg, 'l15')
    for _ in range(14):
        if pg.evaluate('__abcState().done'): break
        pg.evaluate('__abcTap(__abcState().answer)'); pg.evaluate('__abcStep(1.4)')
    check(pg.evaluate('__abcState().done'), 'Shapes plays to the end')
    pg.wait_for_timeout(1200)
    pg.screenshot(path=str(OUT / 'abc-topics-results.png'))
    play(pg, 'l14')
    for _ in range(14):
        if pg.evaluate('__abcState().done'): break
        pg.evaluate('__abcTap(__abcState().answer)'); pg.evaluate('__abcStep(1.4)')
    pg.wait_for_timeout(1500)
    check(pg.evaluate("__game.save.achievements.includes('rainbow')"), 'finishing Colors + Shapes = the Rainbow shapes trophy')
    check(pg.evaluate("__game.isUnlocked('friend-puffer')"), 'finishing Shapes = the Pufferfish joins')
    pg.close()

    # ---- little kid: easier sets, matching pictures, the pretend child ----
    pg = open_page(b, True, {'width': 844, 'height': 390})
    play(pg, 'l14')
    pg.screenshot(path=str(OUT / 'abc-topics-color-little.png'))
    qs = questions(pg, 'l14', 30)
    check(all(len(q['choices']) == 3 and q['answer'] not in ('pink', 'brown') and not set(q['choices']) & {'pink', 'brown'} for q in qs),
          'little kid Colors: 3 bubbles, only the 6 main colors')
    play(pg, 'l15')
    pg.screenshot(path=str(OUT / 'abc-topics-shape-little.png'))
    qs = questions(pg, 'l15', 30)
    check(all(len(q['choices']) == 3 and set(q['choices']) <= {'circle', 'square', 'triangle', 'star', 'heart'} for q in qs),
          'little kid Shapes: 3 bubbles, only circle / square / triangle / star / heart')
    for lid in ('l14', 'l15'):
        res = []
        for r in range(3):
            play(pg, lid)
            pg.evaluate(f'__abcKid(true, {r * 7919 + 13})')
            for _ in range(40):
                pg.evaluate('__abcStep(5)')
                if pg.evaluate('__abcKidReport().done'): break
            res.append(pg.evaluate('__abcKidReport()')); pg.evaluate('__abcKid(false)')
        check(all(x['done'] for x in res) and min(x['stars'] for x in res) >= 2,
              f"pretend little kid finishes {lid} with 2+ stars ({[x['stars'] for x in res]})")
    pg.close()
    b.close()
check(not errors, 'no JavaScript errors' + ('' if not errors else ': ' + '; '.join(errors[:3])))
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
sys.exit(1 if fails else 0)
