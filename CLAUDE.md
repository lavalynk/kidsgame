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
   half-done things. **Right now (Keith, Oct 30): add 18 pages per run — 6 animals,
   6 fruit/veggies, 6 things — until every tab has 30 pages.** Then go back to features.
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
- **No ads, no links out, no data collection.**
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

- The hub (`index.html`) shows 11 cards: bike, rc, hoops, archery, jungle, trail, space,
  abc (Bubble School: counting, letters, math; reads questions aloud), coloring, maze, fishing. Each arcade game lives in its own folder and is built on the shared kit
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
  `Arcade.profiles.key('name')`. Favorites are `Arcade.store.isFavorite/toggleFavorite`.
- Automated tests live in `tests/` (run `python3 tests/test_players.py`; screenshots land in `tests/out/`).
- `tools/` holds the Python art converters (only needed by the dev runs, not the game).
- **Before every commit run `python3 tools/bump_version.py`** — it adds a fresh `?v=` to the
  script/CSS links so browsers load the new code instead of an old cached copy.
- Keep code simple and commented — Keith is learning from it.
