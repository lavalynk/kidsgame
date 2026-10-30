# Kids Game — instructions for the daily dev run

This repo is a small web game for kids ages 3–5 (pre-readers), built by Claude in
daily work sessions for Keith (repo owner). Each run starts fresh with no memory
of earlier runs, so everything you need is in this repo.

## Every run

1. Read `ROADMAP.md` (the backlog) and the top of `CHANGELOG.md` (what was done last).
   **New art first:** if Keith added images to `art/` or `art/sheets/` that aren't in the
   game yet, converting them is today's top job — see "Coloring art" below.
2. Check open GitHub issues / Keith's notes in `ROADMAP.md` under **Notes from Keith** —
   those override the backlog order.
3. Pick the next unchecked item(s) in **Up next**. Do a solid, finished chunk —
   one meaningful feature or ~3–5 new coloring pages — rather than many half-done things.
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

**Main source: Keith's Firefly line art.** Keith generates coloring pages (Adobe
Firefly / Express) and drops them in `art/` (single pictures) or `art/sheets/`
(grids of many). Never draw over or edit his art by hand — convert it:

1. `pip install -r tools/requirements.txt --break-system-packages` (if cv2 is missing).
2. For a new sheet: look at it, count columns/rows, name every cell (lowercase,
   hyphens, e.g. `sea-turtle`). Skip duplicates and anything already in the game
   (`ls art/`) with `-`. Never re-add anything in `art/removed/` — Keith rejected those. Then
   `python3 tools/split_sheet.py art/sheets/<file> <cols> <rows> <names...>`.
3. `python3 tools/trace_art.py` regenerates `coloring/traced.js` from all of `art/`.
4. Render every new page blank AND filled with random colors, look at the
   screenshots. Fix problems by tuning the tools (not by hand-editing traced.js).
   If a picture just won't trace well (big gaps, shading), leave it out and tell Keith.
5. Mention in the update which pages were added, and any that need better art.

Ideas for new pages go to Keith as Firefly prompt suggestions (see `art/README.md`)
rather than being hand-drawn.

**Hand-drawn SVG (fallback only).** The fish and bird in `coloring/animals.js`
are hand-drawn. Only hand-draw when Keith asks; then match this style:

- Cute proportions: big head, round body, smooth curves (C/Q paths), no sharp corners.
- Big dark eyes with white shine dots, colorable blush cheeks, a simple smile.
- 12–25 colorable regions: body parts plus markings (belly, inner ears, spots, stripes).
- A full-canvas background `<rect class="region bg">` so kids can color the sky/water.
- A simple scene that fits the animal: ground/sand/branch, sun/cloud/bubbles, a flower or leaf.
- Regions big enough for a small finger to hit (nothing much smaller than ~20px across).
- After drawing, render it blank AND filled with random colors, look at both screenshots,
  and fix anything that looks off (gaps, stray lines, parts poking out, clipped edges).

## Tech

- Plain HTML/CSS/JavaScript, no build step, no dependencies. Must run by opening
  `index.html` or from GitHub Pages.
- Coloring pages are SVG: hand-drawn ones in `coloring/animals.js`, traced ones
  generated into `coloring/traced.js` (never edit that file by hand). Each fillable
  region is a shape with `class="region"`.
- `tools/` holds the Python art converters (only needed by the dev runs, not the game).
- Keep code simple and commented — Keith is learning from it.
