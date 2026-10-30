# Kids Game — instructions for the daily dev run

This repo is a small web game for kids ages 3–5 (pre-readers), built by Claude in
daily work sessions for Keith (repo owner). Each run starts fresh with no memory
of earlier runs, so everything you need is in this repo.

## Every run

1. Read `ROADMAP.md` (the backlog) and the top of `CHANGELOG.md` (what was done last).
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

## Tech

- Plain HTML/CSS/JavaScript, no build step, no dependencies. Must run by opening
  `index.html` or from GitHub Pages.
- Coloring pages are SVG defined in `coloring/animals.js`: each fillable region is a
  shape with `class="region"`. Add new animals there.
- Keep code simple and commented — Keith is learning from it.
