# Kids Game — instructions for the daily dev run

This repo is a small web game for kids ages 3–5 (pre-readers), built by Claude in
daily work sessions for Keith (repo owner). Each run starts fresh with no memory
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

## Design rules (ages 3–5)

- **No reading required.** Use pictures, icons, colors, and sound — never text-only buttons.
- **Big touch targets** (at least ~70px), works on phone, tablet, and desktop, portrait and landscape.
- **No fail states, no timers, no scores that punish.** Everything is gentle and rewarding.
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

## Tech

- Plain HTML/CSS/JavaScript, no build step, no dependencies. Must run by opening
  `index.html` or from GitHub Pages.
- Maze game: `maze/index.html` + `maze/maze.js` (mazes are generated, not drawn; the
  shapes and the friend/treat pairs are lists at the top of `maze.js`).
- Coloring pages are hand-drawn SVG in `coloring/animals.js`, `fruit.js`, `things.js`.
  Each fillable region is a shape with `class="region"`.
- `tools/` holds the Python art converters (only needed by the dev runs, not the game).
- Keep code simple and commented — Keith is learning from it.
