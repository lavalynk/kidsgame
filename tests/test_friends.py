"""Automated test: RC races with friends on two phones (through a local switchboard).

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
        b.close()
finally:
    os.killpg(os.getpgid(srv.pid), signal.SIGTERM)

check(not errors, f'no JavaScript errors {errors[:3]}')
print(f'\n{len(fails)} failed' if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
