# Kids Game — instructions for the daily dev run

This repo is a **Kids Arcade**: ten small web games for kids ages ~4–10 (the coloring
book and maze stay friendly to pre-readers), built by Claude in daily work sessions for
Keith (repo owner). Each run starts fresh with no memory
of earlier runs, so everything you need is in this repo.

## Every run

1. Read `ROADMAP.md` (the backlog) and the top of `CHANGELOG.md` (what was done last).
2. Check open GitHub issues / Keith's notes in `ROADMAP.md` under **Notes from Keith** —
   those override the backlog order.
3. Pick the next unchecked item(s) in **Up next**. Do a solid, finished chunk —
   one meaningful feature or a batch of new hand-drawn coloring pages — rather than many
   half-done things. **Right now (Keith, Nov 5): work through "The 10-point plan" at the
   top of Up next, in order.** (Coloring pages, 18 per run until every tab has 30, are
   point 6 of that plan.)
4. Test it: open the pages in a headless browser (or at least load and lint the JS),
   make sure nothing on the hub or existing games broke.
5. Check the item off in `ROADMAP.md`, add a dated entry at the top of `CHANGELOG.md`
   (plain-language, written for Keith, not for developers).
6. Commit with a clear message and push to `main`.
7. Send Keith a short update: what changed, what's next, and the play link.

## Design rules (ages 4–10; Keith's arcade brief, Oct 31)

- **Minimal reading.** Every button has an icon; short words are OK. How-to-play screens use pictures.
- **Big touch targets** (at least ~70px), works on phone, tablet, and desktop, portrait and landscape.
- **Gentle challenge.** Arcade games may have timers, lives and medals, but losing is never harsh:
  "Nice try!" + one-tap retry, forgiving checkpoints, and Easy really is easy.
  The coloring book and maze stay fail-free.
- **No violence or scary stuff.** Enemies poof into sparkles; fish are caught and released.
- **No ads, no links out, no data collection.** No accounts, no names or anything about the kids sent anywhere,
  nothing stored on a server. The one exception is playing with friends (Keith, Nov 5): game moves go through the
  switchboard in `server/`, which keeps nothing and forgets each room when it empties.
- Bright, friendly colors; thick outlines on coloring pages; simple shapes.
- Animals must be original drawings (no copyrighted characters).

## Coloring art

**Claude draws every page by hand as SVG** (Keith's call, Oct 30 — the traced Firefly
art came out too wobbly). Pages live in three files, one per picker tab:
`coloring/animals.js`, `coloring/fruit.js`, `coloring/things.js` (vehicles, houses...).
Each page has an `id`, a `group` (`animals` / `fruit` / `things`) and an `svg`.

Keith's style rule for every page:
> simple coloring page for toddlers, cute cartoon, thick bold black outlines,
> plain white background, no shading, no gray, no color, large simple shapes

- The subject is BIG (fills most of the 400x400 canvas). Smooth curves (C/Q paths).
- Outlines are 8px (set in `coloring/index.html`, not per shape).
- Cute faces: big dark eyes with white shine dots, colorable blush cheeks, a simple smile.
  Fruit gets faces too; vehicles and houses don't.
- 7-25 colorable regions, none much smaller than ~20px across (little fingers).
- A full-canvas `<rect class="region bg">` so kids can color the sky, plus at most a
  simple ground strip or cloud. **No suns** (Keith doesn't like them). No busy scenes.
- Vegetables go in the fruit tab (`group: 'fruit'`).
- Animals must be original drawings (no copyrighted characters).
- After drawing, render each page blank AND filled with random colors, look at both
  screenshots, and fix anything off (gaps, stray lines, parts poking out, clipped edges).
- Never re-add anything Keith rejected (see `art/removed/`, e.g. the bear).

**Old traced art (paused).** `art/`, `tools/` and `coloring/traced.js` hold the earlier
Firefly-to-SVG converter and its output. The game no longer loads `traced.js`. Leave
them alone unless Keith asks to bring traced art back.

## Arcade games

- The hub (`index.html`) shows 12 cards: bike, rc, hoops, archery, jungle, trail, space,
  abc (Bubble School: counting, letters, math; reads questions aloud), coloring, maze, fishing,
  piano (Piano Star: 58 songs are text in `piano/songs.js`, e.g. `'E4q D4q C4h | ...'`; `clef: 'bass'` songs use the low piano C3-G4; only public-domain songs). Each arcade game lives in its own folder and is built on the shared kit
  in `arcade/` — **read `arcade/README.md` before touching a game.** `bike/bike.js` is the
  reference example.
- Every game keeps its `window.__<game>State` test hook so headless tests can drive it.
- Test a game by actually playing it headlessly (bots / test hooks), not just loading it.

## Tech

- Plain HTML/CSS/JavaScript, no build step, no dependencies. Must run by opening
  `index.html` or from GitHub Pages.
- Maze game: `maze/index.html` + `maze/maze.js` (mazes are generated, not drawn; the
  shapes, themes, sizes per difficulty and friend/treat pairs are lists in `maze.js`;
  key/door/gems are placed by `placeExtras()`). Progress saves under `kidsMaze.v1`.
- Coloring tools (fill, brush, eraser, stickers), undo/redo, auto-save and the gallery live
  in `coloring/coloring.js` (saved under `kidsColoring.v1`). Stickers are a list at the top.
- Coloring pages are hand-drawn SVG in `coloring/animals.js`, `fruit.js`, `things.js`.
  Each fillable region is a shape with `class="region"`.
- **Players**: `Arcade.profiles` (top of `arcade/shared.js`) holds the players. Every save key gets
  the player's id added (`kidsArcade.v1.p2`; player 1 keeps the plain names). Any new save must use
  `Arcade.profiles.key('name')`. Each player has an age preset (`Arcade.profiles.age()`: `little` 3-5 / `big` 6+);
  little kids always get Easy and games add help via `g.little` (see `arcade/README.md`). Favorites are `Arcade.store.isFavorite/toggleFavorite`; the hub's "play again" row is `Arcade.store.recent()/markPlayed(id)`.
- **Hub tabs**: each game in `GAMES` (top of `index.html`) has a `type` (`race` / `action` / `sports` / `calm`) that puts it under a picture tab.
- **Music**: songs are recipes with hand-written tunes (`tune: { A, B, C }`, `prog: [verse, chorus, bridge]`);
  see the comment above `songs:` in `arcade/shared.js` and the Music section of `arcade/README.md`.
  Games steer it with `g.music.mood({...})` and `g.music.stinger(name)`. Every new song needs a tune.
- **Space Defender** is three files: `space/data.js` (sectors, mini/big bosses, songs), `space/art.js`
  (every drawing: enemies, bosses, the Chimera, weapon icons) and `space/space.js` (rules, the 20 WEAPONS list,
  boss ATTACKS, the Chimera phases). `__game.play(SpaceData.SECTORS[i])` starts a sector in tests.
- Automated tests live in `tests/`: `test_players.py`, `test_hub.py`, `test_abc.py`, `test_tapguard.py`, `test_tunes.py`,
  `test_music.py` (~2 min), `test_rc_music.py`, `test_space.py` (~5 min), `test_age.py`, `test_piano.py`, `test_rc.py`, `test_stickers.py`, `test_friends.py`, `test_offline.py`. Run them all before pushing; screenshots land in `tests/out/`.
- **Sticker Book**: `arcade/stickers.js` (loaded after shared.js on every page) lists all 52 stickers, draws them and
  works out which ones a player has from their saves (`Arcade.stickers.check()` runs after every finish/trophy).
  The book page is `stickers/`. Every new game must be added to its GAMES list (4 stickers each).
- **Friends (several phones)**: `server/` is a Cloudflare Worker (one Durable Object per room, relays JSON
  messages, stores nothing; see `server/README.md`). `arcade/net.js` is the client: 3-picture room codes, picker,
  `Arcade.net.join(code)`. Its `SERVER` is Keith's deployed switchboard (wss://kids-arcade.lavalynk.workers.dev); redeploy with `cd server; npx wrangler deploy`.
  RC has a Friends race (`mode === 'friends'`, levels `fr-<track>`; items that reach other cars are sent with `tell()`
  and handled in `friendItem()`: each phone only ever changes its own car). Test: `tests/test_friends.py` (runs a local switchboard).
  Other kit games use the shared lobby `Arcade.net.party.menu(g, { choices, onStart, onBack })` and set `config.friends(g)`
  (the title menu then shows a Friends picture button). Hoops (`fr-s30`/`fr-s60`, `{t:'score'}`), Bike (`fr-<track>`,
  positions as `{t:'move'}`, own lane per seat) and Bubble School (`fr-<topic>`, pick = `topic~seed` so every phone gets the
  same questions; first right answer sends `{t:'move', q}` and everyone moves on) do this.
- **App + offline**: `manifest.webmanifest` (full screen, icons in `icons/`) and `sw.js` (service worker: saves every
  file on the device, cache-first, works offline). `tools/bump_version.py` also runs `tools/make_offline.py`, which writes
  the file list + a new VERSION into `sw.js`, so a pushed update reaches installed phones. New pages/folders get picked up
  automatically (`*/index.html`, `*/*.js`, `*/*.css`); anything else a page needs must be added in `make_offline.py`.
  Test: `tests/test_offline.py`.
- **My House**: `house/` (room drawings + shop in `house/house.js`). Coins = 3 + trophies in all games - spent, saved as `house`.
- **Phones** get `html.ar-phone` (set in shared.js): every page keeps a 5% border (Keith: use 90% of the phone).
  Upright, the kit covers wide games with a big "turn me" picture while playing (`ar-turnshow`; the game waits);
  a small button plays upright anyway (on-screen buttons then stack 2 across).
- Title screens and title menus are pictures only (big Play button, round icon buttons): no reading needed.
- `tools/` holds the Python art converters (only needed by the dev runs, not the game).
- **Before every commit run `python3 tools/bump_version.py`** — it adds a fresh `?v=` to the
  script/CSS links so browsers load the new code instead of an old cached copy.
- Keep code simple and commented — Keith is learning from it.
