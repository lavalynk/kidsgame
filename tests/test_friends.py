"""Automated test: Friends games on two phones (through a local switchboard): RC, Hoops, Bike, Bubble School, Fishing.

Run:  python3 tests/test_friends.py
Starts a local copy of the switchboard (server/, with "npx wrangler dev"), opens two
"phones", makes a room on one, types the 3 pictures on the other, starts a race, drives
both cars on autopilot and checks each phone sees the other's car and both get results.
Needs Node (npx downloads wrangler the first time). Screenshots land in tests/out/.
"""
import sys, time, socket, subprocess, pathlib, os, signal
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
PORT = 8799
fails, errors = [], []
def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

# ---- start the switchboard locally ----
wr = os.environ.get('WRANGLER', 'npx --yes wrangler@4')
srv = subprocess.Popen(f'{wr} dev --port {PORT} --ip 127.0.0.1', shell=True, cwd=ROOT / 'server',
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, preexec_fn=os.setsid)
for _ in range(120):
    try: socket.create_connection(('127.0.0.1', PORT), 1).close(); break
    except OSError: time.sleep(1)
time.sleep(2)

try:
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        phones = []
        for i in range(2):
            ctx = b.new_context(viewport={'width': 1280, 'height': 760})
            pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
            pg.goto((ROOT / 'rc' / 'index.html').as_uri())
            pg.evaluate(f"localStorage.clear(); localStorage.setItem('kidsArcade.server', 'ws://127.0.0.1:{PORT}')")
            pg.reload(); pg.wait_for_timeout(400)
            pg.mouse.click(640, 380); pg.wait_for_timeout(600)
            pg.click('[data-menu=free]'); pg.wait_for_timeout(300)
            phones.append(pg)
        a, c = phones
        check(a.locator('[data-kind=friends]').count() == 1, 'Free Play has a Friends button (switchboard set)')

        # phone A makes a room
        a.click('[data-kind=friends]'); a.wait_for_timeout(200)
        a.click('[data-host]'); a.wait_for_function('__rcRoom() && __rcRoom().seat === 0', timeout=10000)
        code = a.evaluate('__rcRoom().code')
        check(len(code) == 3, f'A made a room with 3 pictures {code}')
        a.screenshot(path=str(OUT / 'friends-lobby-host.png'))

        # phone B taps the same 3 pictures
        c.click('[data-kind=friends]'); c.wait_for_timeout(200)
        c.click('[data-joinroom]'); c.wait_for_timeout(200)
        for n in code: c.click(f'[data-pic="{n}"]'); c.wait_for_timeout(80)
        c.wait_for_function('__rcRoom() && __rcRoom().seat === 1', timeout=10000)
        a.wait_for_function('__rcRoom().peers === 1', timeout=5000); c.wait_for_function('__rcRoom().peers === 1', timeout=5000)
        a.wait_for_timeout(300)
        check(a.locator('[data-players] .av').count() == 2 and c.locator('[data-players] .av').count() == 2, 'both lobbies show 2 players')
        check(c.locator('[data-track]').count() == 0 and a.locator('[data-track]').count() == 10, 'only the room maker picks the track')
        c.screenshot(path=str(OUT / 'friends-lobby-guest.png'))

        # A picks a track: both phones start it
        a.click('[data-track="fr-t1"]')
        c.wait_for_function('typeof __rcState === "function" && __rcState().mode === "friends"', timeout=5000)
        check(a.evaluate('__rcState().mode') == 'friends' and c.evaluate('__rcState().track') == 't1', 'both phones start the same race')
        check(len(a.evaluate('__rcState().racers')) == 1, 'no computer racers in a friends race')

        # race on autopilot, a bit at a time on each phone (so messages flow between steps)
        for p in phones: p.evaluate('__rcAuto(true)')
        seen = False
        for i in range(200):
            for p in phones: p.evaluate('__rcStep(0.5)')
            a.wait_for_timeout(30)
            if i == 12:
                fa = a.evaluate('__rcFriends()')
                seen = len(fa['cars']) == 1 and fa['cars'][0]['p'] > 0
                a.screenshot(path=str(OUT / 'friends-race.png'))
            if i == 14:
                # items reach the other phone: honey lands on B's track, a bubble flies on B's screen
                check(a.evaluate('__rcState().boxes') > 0, 'friends races have gift boxes')
                h0 = c.evaluate("__rcHaz().filter(h => h.kind === 'honey').length")
                a.evaluate("__rcAuto(false); __rcGive('honey')"); a.keyboard.press('Space'); a.evaluate('__rcStep(0.05)')
                c.wait_for_timeout(400); c.evaluate('__rcStep(0.02)')
                check(c.evaluate("__rcHaz().filter(h => h.kind === 'honey').length") == h0 + 1, "A's honey appears on B's track")
                a.evaluate("__rcGive('bubble')"); a.keyboard.press('Space'); a.evaluate('__rcStep(0.02)')
                c.wait_for_timeout(400)
                check(c.evaluate('__rcBubbles().length') >= 1, "A's bubble flies on B's screen too")
                a.evaluate("__rcGive('popper')"); a.keyboard.press('Space'); a.evaluate('__rcStep(0.02); __rcAuto(true)')
                c.wait_for_timeout(300)
                c.screenshot(path=str(OUT / 'friends-items.png'))
                # gentle bump: put B's car right on top of A's (as A's phone sees it): A slides out a little
                bump = a.evaluate('''(() => { __rcAuto(false); const p = __rcCars().find(c => c.isPlayer), f = __rcFriends().cars[0];
                  p.x = f.x - 10; p.y = f.y; p.vx = 150; p.vy = 0; p.bumpCool = 0; p.shield = 0; p.star = 0; p.ghost = 0; p.phaseT = 0; p.air = 0; p.cloud = 0;
                  const x0 = p.x; __rcStep(1 / 120); const r = [x0, p.x, p.vx]; __rcAuto(true); return r; })()''')
                check(bump[1] < bump[0] and bump[2] < 150, f'gentle bump: my car slides back from a friend and slows ({bump})')
            if a.evaluate('__rcState().over') and c.evaluate('__rcState().over'): break
        check(seen, "A sees B's car moving on the track")
        check(a.evaluate('__rcState().over') and c.evaluate('__rcState().over'), 'both phones finish the race')
        a.wait_for_timeout(900)
        rows = a.locator('.ar-results').inner_text()
        check('1st' in rows and '2nd' in rows, 'results list both players in order')
        a.screenshot(path=str(OUT / 'friends-results.png'))

        # Again: any phone restarts the race for everyone
        c.locator('.ar-results button', has_text='Again').click()
        a.wait_for_function('__rcState().over === false && __rcState().countdown > 0', timeout=5000)
        check(True, 'Again on one phone restarts the race on both')
        # ---- Hoops head-to-head (the shared Friends lobby in arcade/net.js) ----
        for p in phones:
            p.goto((ROOT / 'hoops' / 'index.html').as_uri()); p.wait_for_timeout(500)
            p.mouse.click(640, 380); p.wait_for_timeout(700)
        check(a.locator('[data-friends]').count() == 1, 'Hoops title menu has a Friends picture button')
        a.click('[data-friends]'); a.wait_for_timeout(200); a.click('[data-host]')
        a.wait_for_function('Arcade.net.party.room && Arcade.net.party.room.seat === 0', timeout=10000)
        code = a.evaluate('Arcade.net.party.code')
        c.click('[data-friends]'); c.wait_for_timeout(200); c.click('[data-joinroom]'); c.wait_for_timeout(200)
        for n in code: c.click(f'[data-pic="{n}"]'); c.wait_for_timeout(80)
        a.wait_for_function("Object.keys(Arcade.net.party.peers).length === 1", timeout=8000)
        a.wait_for_timeout(300)
        check(a.locator('[data-pick]').count() == 2 and c.locator('[data-pick]').count() == 0, 'Hoops: room maker picks 30 or 60 seconds')
        a.click('[data-pick="s30"]')
        c.wait_for_function('typeof __hoopsState === "function" && __hoopsState().level === "fr-s30"', timeout=5000)
        check(a.evaluate('__hoopsState().level') == 'fr-s30', 'Hoops: both phones start the 30-second game')
        st = [p.evaluate('__hoopsState()') for p in phones]
        check(all(x['countdown'] > 2 and not x['started'] for x in st), 'Hoops: both phones count down 3, 2, 1')
        a.wait_for_timeout(300); a.screenshot(path=str(OUT / 'friends-hoops-countdown.png'))
        a.wait_for_function('__hoopsState().started', timeout=6000); c.wait_for_function('__hoopsState().started', timeout=6000)
        ta, tc = a.evaluate('__hoopsState().timeLeft'), c.evaluate('__hoopsState().timeLeft')
        check(abs(ta - tc) < 1, f'Hoops: after GO both clocks run together ({ta:.1f} / {tc:.1f})')
        for _ in range(4):
            a.evaluate('__hoopsShoot(__hoopsPerfect(), 0)'); a.wait_for_timeout(1300)
        sa = a.evaluate('__hoopsState().score')
        c.wait_for_timeout(600)
        check(sa > 0 and c.evaluate('__hoopsState().rival') == sa, f"Hoops: B's scoreboard shows A's score ({sa})")
        c.screenshot(path=str(OUT / 'friends-hoops.png'))
        for p in phones: p.evaluate('__hoopsEnd()')
        a.wait_for_function('__hoopsState().over', timeout=5000); a.wait_for_timeout(2600)
        check('You won' in a.locator('.ar-results').inner_text() or 'tie' in a.locator('.ar-results').inner_text().lower(), 'Hoops: results for the winner')
        a.screenshot(path=str(OUT / 'friends-hoops-results.png'))
        # ---- shared helper: open a game on both phones and meet in a Friends room ----
        def meet(game):
            for p in phones:
                p.goto((ROOT / game / 'index.html').as_uri()); p.wait_for_timeout(500)
                p.mouse.click(640, 380); p.wait_for_timeout(700)
            check(a.locator('[data-friends]').count() == 1, f'{game}: title menu has a Friends picture button')
            a.click('[data-friends]'); a.wait_for_timeout(200); a.click('[data-host]')
            a.wait_for_function('Arcade.net.party.room && Arcade.net.party.room.seat != null', timeout=10000)
            code = a.evaluate('Arcade.net.party.code')
            c.click('[data-friends]'); c.wait_for_timeout(200); c.click('[data-joinroom]'); c.wait_for_timeout(200)
            for n in code: c.click(f'[data-pic="{n}"]'); c.wait_for_timeout(80)
            a.wait_for_function("Object.keys(Arcade.net.party.peers).length === 1", timeout=8000)
            a.wait_for_timeout(300)

        # ---- Turbo Bike race ----
        meet('bike')
        check(a.locator('[data-pick]').count() == 5, 'bike: the room maker picks one of the 5 tracks')
        a.click('[data-pick="t1"]')
        c.wait_for_function('typeof __bikeState === "function" && __bikeState().countdown > 0', timeout=5000)
        check(c.evaluate('__bikeState().countdown') > 2, 'bike: both phones count down 3, 2, 1')
        for p in phones: p.keyboard.down('ArrowRight')
        a.wait_for_timeout(5500)
        fr = a.evaluate('__bikeState().friends')
        check(len(fr) == 1 and fr[0]['x'] > 400, f"bike: A sees B's rider moving ({fr})")
        a.screenshot(path=str(OUT / 'friends-bike.png'))
        for p in phones: p.keyboard.up('ArrowRight')
        c.evaluate('(() => { const s = __bikeState(); s.bike.x = s.finishX - 5; })()'); c.wait_for_timeout(500)
        a.evaluate('(() => { const s = __bikeState(); s.bike.x = s.finishX - 5; })()')
        a.wait_for_selector('.ar-results', timeout=8000); a.wait_for_timeout(400)
        res = a.locator('.ar-results').inner_text()
        check('1.' in res and '2.' in res, 'bike: results list both riders in order')
        a.screenshot(path=str(OUT / 'friends-bike-results.png'))

        # ---- Bubble School quiz race ----
        meet('abc')
        check(a.locator('[data-pick]').count() == 6, 'abc: the room maker picks one of 6 topics')
        a.locator('[data-pick^="l3~"]').click()
        c.wait_for_function('typeof __abcState === "function" && __abcState().level === "fr-l3"', timeout=5000)
        a.wait_for_timeout(600)
        qa, qc = a.evaluate('__abcState()'), c.evaluate('__abcState()')
        check(qa['answer'] == qc['answer'] and qa['choices'] == qc['choices'], f"abc: both phones get the same question ({qa['answer']})")
        a.evaluate('__abcTap(__abcState().answer)')
        c.wait_for_function('__abcState().q === 2', timeout=5000)
        check(True, "abc: when A gets it, B's question moves on too")
        c.screenshot(path=str(OUT / 'friends-abc.png'))
        a.wait_for_function('__abcState().q === 2', timeout=5000); c.wait_for_timeout(300)
        c.evaluate('__abcTap(__abcState().answer)')
        a.wait_for_function('__abcState().q === 3', timeout=5000)
        for i in range(3, 11):
            a.wait_for_function(f'__abcState().q === {i}', timeout=6000); a.wait_for_timeout(200)
            a.evaluate('__abcTap(__abcState().answer)')
        a.wait_for_selector('.ar-results', timeout=8000); a.wait_for_timeout(400)
        res = a.locator('.ar-results').inner_text()
        check('9' in res and '1' in res, 'abc: results show the stars (9 and 1)')
        a.screenshot(path=str(OUT / 'friends-abc-results.png'))

        # ---- Fishing together: the rarest fish wins ----
        meet('fishing')
        check(a.locator('[data-pick]').count() == 3, 'fishing: the room maker picks one of the 3 places')
        a.click('[data-pick="pier"]')
        c.wait_for_function('typeof __fishingState === "function" && __fishingState().friends && __fishingState().loc === "pier"', timeout=5000)
        check(c.evaluate('__fishingState().countdown') > 2, 'fishing: both phones count down 3, 2, 1')
        a.wait_for_timeout(300); a.screenshot(path=str(OUT / 'friends-fishing-countdown.png'))
        a.wait_for_function('__fishingState().countdown <= 0', timeout=6000); c.wait_for_function('__fishingState().countdown <= 0', timeout=6000)
        ta, tc = a.evaluate('__fishingState().timeLeft'), c.evaluate('__fishingState().timeLeft')
        check(abs(ta - tc) < 1, f'fishing: both clocks run together ({ta:.1f} / {tc:.1f})')
        a.evaluate("__fishingTest.catchNow('tuna')")      # A: a rare fish (3 stars)
        c.evaluate("__fishingTest.catchNow('golden')")    # B: a golden fish (4 stars)
        a.wait_for_timeout(600)
        fb = a.evaluate('Object.values(__fishingState().friendBest)')
        check(len(fb) == 1 and fb[0]['sp'] == 'golden', f"fishing: A knows B's best fish ({fb})")
        a.wait_for_timeout(1200); a.screenshot(path=str(OUT / 'friends-fishing.png'))
        for p in phones: p.evaluate('__fishingTest.setTime(0)')
        a.wait_for_selector('.ar-results', timeout=12000); c.wait_for_selector('.ar-results', timeout=12000); a.wait_for_timeout(500)
        ra, rc_ = a.locator('.ar-results').inner_text(), c.locator('.ar-results').inner_text()
        check('Rarest fish' in rc_ and 'Great fishing' in ra, f'fishing: the golden fish wins ({ra[:40]!r} / {rc_[:40]!r})')
        check('1.' in ra and '2.' in ra, 'fishing: results list both players')
        a.screenshot(path=str(OUT / 'friends-fishing-results.png'))
        b.close()
finally:
    os.killpg(os.getpgid(srv.pid), signal.SIGTERM)

check(not errors, f'no JavaScript errors {errors[:3]}')
print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
