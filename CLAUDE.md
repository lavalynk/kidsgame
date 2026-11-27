# Kids Game — instructions for the daily dev run

This repo is a **Kids Arcade**: 15 small web games for kids ages ~4–10 (the coloring
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
   top of Up next, in order.** (Points 1-7 are done; point 7 became Putt-Putt Park, Nov 13.)
   (Keith's Nov 13 requests are done: mini golf, Potion Quest, and the fishing game's looks + more to do.)
   (Nov 18-19: Turbo Bike plan #6 cups + #7 bike shop done. Nov 19: Keith's Maze Explorer upgrade done.)
   (Nov 21, last run: the run picked Maze's 3 new friends + friend calls.) (Keith, Nov 19: the **RC Racers plan** under Notes from Keith is next, before the Turbo Bike list. Heart Battle is done.
   Nov 20: plan #2 "new ways to play" done (Coin Rush + Follow the Leader); next is RC plan #3 "feel and look".)
   (Nov 20-21: Keith's "every menu to Phaser + Rex UI" list is finished. Nov 21 (night): RC plan #3 "feel and look" done (drifting + the finish-line party), so **Keith's RC plan is finished**; next is the Turbo Bike list (#8 builder).) (Nov 21, later night: Turbo Bike #8 builder done. Then #9 the Daily Ghost Race done, so **the Turbo Bike plan is finished**; next: pick from the open ideas in `ROADMAP.md` and say which.) (Nov 21, late night: the run picked the Jukebox, done.) (Nov 22: the run picked Maze bridges + tunnels, done.) (Nov 22, later: the run picked music for the coloring book + maze, done. Nov 22 evening, Keith live: cleaner hub + first-screen scrolling, done.) (Nov 22, night: 4 new animal pages: horse, dinosaur, seal, squirrel.) (Nov 22, late night: the run picked the Accessibility pass (Calm motion + a contrast test), done.) (Nov 22, very late: the run picked Putt-Putt Park's 2nd course, Seaside Cove, done.) (Nov 22, night: 4 new animal pages: zebra, dolphin, parrot, raccoon.) (Nov 22, late night: the run picked Fishing's night place, Moonlight Bay, done.) (Nov 22, latest: 4 new animal pages: panda, koala, flamingo, deer.) (Nov 22, last run: the run picked Maze's cheeky treat ("a moving treat"), done.) (Nov 22, final run: 4 new fruit pages: plum, beet, lettuce, garlic.) (Nov 22, very last run: 4 new Things pages: ambulance, cement mixer, motorcycle, treehouse.) (Nov 22, latest run: the run picked the Maze Maker, done.) (Nov 22, evening run: the run picked the Parent corner's bedtime, done.) (Nov 22, night run: the run picked Potion Quest's 4th place, Frosty Peak + a 2nd boss, done.) (Nov 22, last run: new plan point 1, part 1 = Jungle Jump's heroes + critters, done.) (Nov 22, latest run: point 1, part 2 = Space Defender's ships + enemies, done; next part: Treasure Trail.) (Nov 22, newest run: point 1, part 3 = Treasure Trail's explorer + animals, done (`tools/preview_trail.py`, `window.__trailArt`); next part: Archery, the last of point 1.) (Nov 22, latest: point 1, part 4 = Archery's targets + balloons, done (`tools/preview_archery.py`, `window.__archeryArt`, `tests/test_archery.py`): **point 1 is finished; next is point 2, living backgrounds.**) (Nov 22, newest: point 2, part 1 = Turbo Bike's living backgrounds, done; next part: Jungle Jump + Treasure Trail.) (Nov 22, latest: point 2, part 2 = Jungle Jump + Treasure Trail living backgrounds, done; next part: Archery, Hoops, Putt-Putt Park.) (Nov 22, newest: point 2, part 3 = Archery's living backgrounds, done; next part: Hoops + Putt-Putt Park.) (Nov 22, latest: point 2, part 4 = Hoops + Putt-Putt Park living backgrounds, done; next part: Mini RC Racers, the last of point 2.) (Nov 22, newest: point 2, part 5 = Mini RC Racers' living backgrounds, done: **point 2 is finished; next is point 3, game feel ("juice").**) (Nov 22, newest: point 3, part 1 = the kit's `g.juice` helpers + Hoops, Putt-Putt Park, Bubble School, done; next part: Jungle Jump, Treasure Trail, Potion Quest.) (Nov 22, latest: point 3, part 2 = Jungle Jump, Treasure Trail, Potion Quest, done; next part: Turbo Bike, Mini RC Racers, Space Defender.) (Nov 23: point 3, part 3 = Turbo Bike, Mini RC Racers, Space Defender, done: **point 3 is finished; next is point 4, better touch controls.**) (Nov 23, later: point 4, part 1 = the kit's new touch pad (colors, light up, thumb rolling, main button), done; next part: "one thumb" mode for little kids.) (Nov 23, latest: point 4, part 2 = "one thumb" mode: the setting + Turbo Bike, Mini RC Racers, Fishing, done; next part: one thumb for Jungle Jump, Treasure Trail, Potion Quest.) (Nov 23, Keith live: **glossy menus + Phaser logos**, part 1 = the shared kit + every logo + the hub, done; see "Glossy menus" under Tech and Keith's note in ROADMAP.md: it goes before the rest of the plan.) (Nov 23, night: point 4, part 3 = one thumb for Jungle Jump, Treasure Trail, Potion Quest, done (this run had already started); next part of the plan: check every game held upright + sideways, the last of point 4 — but Keith's glossy menus part 2 comes first.) (Nov 23, night: glossy part 2a = shops, books + builders, done; next: part 2b.) (Nov 23, late night: glossy part 2b = hero + ship pickers on a stage, Parent corner charts, done; next: part 2c, the results pictures.) (Nov 23, latest: glossy part 2c = the results (stars + medal + podiums / cup tables on a golden glow, score plaque), done: **glossy part 2 is finished; next: glossy part 3 (the HTML-only bits), then point 4's last part.**) (Nov 23, latest too: glossy part 2d = the podiums, tables + ghost cards inside the results pictures, `Arcade.svgGloss`, done.) (Nov 23, night: glossy part 3 = the HTML bits (player editor, the walls, coloring + maze buttons), done: **Keith's glossy note is finished; next: the results screen that scrolls a little on a computer, then point 4's last part.**) (Nov 23, late: the results fit (`screen.fit`) + point 4, part 4 = every game upright + sideways while playing (`tests/test_orientation.py`; coloring's sideways side panel is at most half the screen), done: **point 4 is finished; next is point 5, the playability check.**) (Nov 23, latest: point 5, part 1 = the playtest robot (`tools/playtest.py`, pretend children) + Putt-Putt Park + Potion Quest, done; next part: Jungle Jump + Treasure Trail.) (Nov 23, night: point 5, part 2 = Jungle Jump + Treasure Trail, done; next part: Turbo Bike + Mini RC Racers.) (Nov 23, late night: point 5, part 3 = Turbo Bike + Mini RC Racers, done; next part: Space Defender, Archery, Hoops.) (Nov 23, latest: point 5, part 4 = Space Defender, Archery, Hoops, done; next part: Fishing + Bubble School, the last of point 5.) (Nov 24: point 5, part 5 = Fishing + Bubble School, done: **point 5 is finished; next is point 6, "Show me" how to play.**) (Nov 24, later: point 6, part 1 = the kit's "Show me" (`config.showMe`, see arcade/README.md) + Hoops, golf, Archery, Bubble School, done; next part: the button games (needs a 2nd hand: left + right thumb), then Piano.) (Nov 24, evening: point 6, part 2 = the 2nd hand (left + right thumb) + Turbo Bike, Jungle Jump, Treasure Trail, Fishing, done; next part: Mini RC Racers, Potion Quest, Space Defender, then Piano.) (Nov 24, night: point 6, part 3 = Mini RC Racers, Potion Quest, Space Defender, done; next part: Piano Star, the last of point 6.) (Nov 24, late night: point 6, part 4 = Piano Star, done: **point 6 is finished; next is point 7, more to play where a game feels short.**) (Nov 24, very late: point 7, part 1 = Bubble School's Colors + Shapes topics, done; next part: Space Defender's starter sector, then Archery, Treasure Trail, Hoops.) (Nov 24, latest: point 7, part 2 = Archery's 4th place, Autumn Woods, done.) (Nov 24, newest: point 7, part 3 = Space Defender's starter sector Cloud Park, done; next part: Treasure Trail's 2 new adventures, then Hoops.) (Nov 24, latest: point 7, part 4 = Treasure Trail's 2 new adventures, Rainbow Falls (rafts) + Mushroom Hollow (bouncy mushrooms), done; next part: Hoop Heroes' new courts, the last of point 7.) (Nov 24, newest: point 7, part 5 = Hoop Heroes' 4 challenge courts, done: **point 7 is finished; next is point 8, something to work towards in every game.**) (Nov 24, latest: point 8, part 1 = the kit's Star Road (`config.looks`, hats + trails, the "New!" screen, the Looks screen; see arcade/README.md) + Jungle Jump (hats + trails), Putt-Putt Park, Hoop Heroes, Space Defender (trails), done; next part: the other games (Treasure Trail, Potion Quest, Archery, Turbo Bike, Mini RC Racers, Fishing, Bubble School, Piano Star), then the looks in My House + the Sticker Book.) (Nov 24, latest: point 8, part 2 = Treasure Trail (trails), Potion Quest + Fishing (hats + trails), done; Archery keeps its own hats + trails; next part: Turbo Bike + Mini RC Racers (a new look kind: a color), Bubble School, Piano Star, then My House + the Sticker Book.) (Nov 24, night: point 8, part 3 = Turbo Bike (hats on the helmet + colors + trails) + Mini RC Racers (colors + trails, its own Looks button), two overlapping runs, the new look kind `color` (`Arcade.looks.COLORS`, `colorAt()`, `g.looks.paint()`), done; next part: Bubble School + Piano Star, then My House + the Sticker Book.) (Nov 24, latest: point 8, part 4 = Bubble School + Piano Star trails (`g.looks.splash()`), done; next part: the looks in My House + the Sticker Book, the last of point 8.) (Nov 24, newest: point 8, part 5 = the looks in My House (Looks tile, screen `house-looks`) + the Sticker Book (screen `stickers-looks`), done: **point 8 is finished; next is point 9, faster and smoother everywhere.**) (Nov 24, latest: point 9, part 1 = smaller library files (our own small Rex UI, Phaser without Matter, Swiper only in the fallback), pacing (still menus ~30 pictures a second, a paused game once a second) + the speed test `tests/test_speed.py`, done.) (Nov 24, overlapping run: point 9, part 1b = nothing drawn behind a title screen + the menu nap (10 a second after 40 s untouched), added on top, done; next part: a steady frame rate on older tablets.) (Nov 25, a third overlapping run: the menu fonts are preloaded on every page (from a web address), done; next part is still: a steady frame rate on older tablets.) (Nov 25: point 9, part 2 = a steady frame rate on older tablets (`tools/frametime.py`, quicker lite + no glows in lite, `Arcade.draw.layer`, Hoops + Jungle Jump + Archery + Trail + Quest cheaper pictures, `tests/test_frames.py`), done: **point 9 is finished; next is point 10, the hub glow-up.**) (Nov 25, overlapping run, on top: Jungle's tiles painted once in strips + Trail's next room painted ahead, done.) (Nov 25, latest: point 10, part 1 = Bop, the hub's mascot (`arcade/mascot.js`, row `mascot` in canvasmenu.js, `tests/test_mascot.py`), done; next part: seasonal hub looks, then moving previews on the tiles.) (Nov 25, newest: point 10, part 2 = seasonal hub looks (`Arcade.season()` + `Arcade.mascot.dress` in mascot.js, `screen.season` -> `seasonFx()` in canvasmenu.js, `tests/test_seasons.py`), done; next part: moving previews on the tiles, the last of point 10.) (Nov 25, latest: point 10, part 3 = tiny moving previews on the hub's game tiles (`arcade/previews.js`, "Tile previews" in canvasmenu.js, `tools/preview_tiles.py`, `tests/test_previews.py`), done: **the new 10-point plan is finished; next: pick from the open ideas in `ROADMAP.md` and say which.**) (Nov 25, evening: the run picked 4 new animal pages: kangaroo, tiger, hamster, walrus.) (Nov 25, night: 4 new fruit pages: fig, cauliflower, celery, turnip.) (Nov 25, late night: 4 new Things pages: tow truck, school, race car, snowman.) (Nov 26: 4 new animal pages: otter, sloth, alpaca, peacock.) (Nov 26, later: 4 new fruit pages: lime, apricot, zucchini, cabbage.) (Nov 26, evening: 4 new Things pages: crane, fire station, teapot, robot.) (Nov 26, night (Thanksgiving): 4 new animal pages: turkey, goat, beaver, rhino.) (Nov 26, late night: 4 new fruit pages: sweet potato, raspberry, chili pepper, peanut.) (Nov 26, Keith live: "Create a claw game" = **Claw Catch**, a 15th game, done; see "Claw Catch" under Arcade games.) (Nov 26, latest: 4 new Things pages: drum, mailbox, pickup truck, toy blocks.) (Nov 26, newest: 4 new animal pages: guinea pig, skunk, camel, starfish.) (Nov 26, night: 4 new fruit pages: papaya, olive, artichoke, dragon fruit.) (Nov 26, late: 4 new Things pages: wagon, skateboard, guitar, alarm clock.) (Nov 26, latest: 4 new animal pages: seahorse, puffin, moose, bat.) (Nov 26, newest: 4 new fruit pages: blackberry, cranberries, kumquat, asparagus.) (Nov 26, latest run: 4 new Things pages: tricycle, sandcastle, lamp, rocking horse.) (Nov 26, newest run: 4 new animal pages: toucan, caterpillar, gecko, narwhal.) (Nov 26, final run: 4 new fruit pages: persimmon, brussels sprout, leek, cantaloupe.) (Nov 27: 4 new Things pages: watering can, piggy bank, rubber duck, backpack.) (Nov 27, later: 4 new animal pages: hen, pufferfish, mole, snake.) (Nov 27, evening: 4 new fruit pages: grapefruit, lychee, bok choy, acorn.) (Nov 27, night: 4 new Things pages: birthday cake, cocoa mug, spinning top, wheelbarrow.) (Nov 27, late night: 4 new animal pages: swan, donkey, badger, ostrich.) (Nov 27, latest: 4 new fruit pages: passion fruit, kohlrabi, butternut squash, chestnut.) (Nov 27, newest: 4 new Things pages: beach ball, xylophone, sand pail, pencil.) (Nov 27, final: 4 new animal pages: lobster, worm, platypus, ant.) (Nov 27, last run: 4 new fruit pages: walnut, gooseberry, pistachio, quince.) (Nov 27, end of day: 4 new Things pages: crayon, traffic light, fire hydrant, toaster.) (Nov 27, night: 4 new animal pages: cheetah, crocodile, pelican, dragonfly.)
   **The 10-point plan is finished (Nov 16).**
   **NOW (Keith, Nov 22): work through "The new 10-point plan" at the top of Notes from Keith in `ROADMAP.md`, in order**
   (graphics + playability). One point, or one solid part of a point, per run; write what's done in brackets under it.
   Keith's other notes still come first. Say in the update which point you worked on.
4. Test it: open the pages in a headless browser (or at least load and lint the JS),
   make sure nothing on the hub or existing games broke. After pushing, GitHub runs every test file too
   (`.github/workflows/tests.yml`, one job per `tests/test_*.py`; a new test file is picked up by itself).
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
- **No ads, no links out, no data collection.** (The Parent corner's "Report a problem" is a `mailto:` the grown-up sends themselves.)  No accounts, no names or anything about the kids sent anywhere,
  nothing stored on a server. The one exception is playing with friends (Keith, Nov 5): game moves go through the
  switchboard in `server/`, which keeps nothing and forgets each room when it empties.
- Bright, friendly colors; thick outlines on coloring pages; simple shapes.
- Animals must be original drawings (no copyrighted characters).

## Coloring art

**Claude draws every page by hand in plain HTML/CSS** (Keith, Nov 10; before that it was
hand-drawn SVG, and before that traced Firefly art). Pages live in three files, one per picker tab:
`coloring/animals.js`, `coloring/fruit.js`, `coloring/things.js` (vehicles, houses...).
Each page has an `id`, a `group` (`animals` / `fruit` / `things`) and an `html`: a list of
`<i>` shapes on a 400 x 400 grid, back to front. **Read the top of `coloring/pages.css`** for
the shape language: `--cx --cy` center, `--w --h` size, `--r` (any border-radius) or `--k`
(rounded box) and `--rot`; class `r` = colorable, `r bg` = sky, `r flat` = road, `d` = dark
detail, `d w` = shine dot, `ln` / `ln up` = a curved line (smile). `r p` = one free-drawn SVG path
(the banana, chili and peanut use it; see `pages.css`, prefer rounded shapes). Useful shapes: a lens
leaf `--r:100% 0 100% 0`, a dome `--r:50% 50% 0 0 / 100% 100% 0 0`, a cloud
`--r:50% 50% 30% 30% / 80% 80% 20% 20%`, a rounded diamond ear `--r:12% 46% 46% 46%;--rot:36deg`.
No animation (Keith, Nov 10). `coloring/css-demo.html` is the first try-out (with the build animation).

Keith's style rule for every page:
> simple coloring page for toddlers, cute cartoon, thick bold black outlines,
> plain white background, no shading, no gray, no color, large simple shapes

- The subject is BIG (fills most of the 400x400 canvas). Smooth curves (C/Q paths).
- Outlines are 8px (set in `coloring/index.html`, not per shape).
- Cute faces: big dark eyes with white shine dots, colorable blush cheeks, a simple smile.
  Fruit gets faces too; vehicles and houses don't.
- 7-18 colorable shapes (22 is the limit, the test checks it), none much smaller than ~20 units across (little fingers).
- **Keep it uncluttered (Keith, Nov 10).** One subject and nothing else: no flowers, carrots, campfires,
  collars, extra bubbles or second clouds. If a part can't be drawn cleanly from rounded shapes, leave it out
  or pick an easier pose (facing front works best: big round head, small body). Parts must overlap properly
  where they join, so no outline ends in mid-air. Look at the page at 300px before shipping; if it reads
  as "funky", redraw it simpler.
- A full-canvas sky (`<i class="r bg" ...>`, the first shape) so kids can color it, plus at most a
  simple ground strip or cloud. **No suns** (Keith doesn't like them). No busy scenes.
- Vegetables go in the fruit tab (`group: 'fruit'`).
- Animals must be original drawings (no copyrighted characters).
- After drawing, run `python3 tools/preview_coloring.py <ids>` (each page blank AND filled with
  random colors, in `tests/out/preview_coloring.png`), look at it, and fix anything off
  (gaps, stray lines, parts poking out, clipped edges). Then `tests/test_coloring.py`.
- Never re-add anything Keith rejected (see `art/removed/`, e.g. the bear).

**Old traced art (paused).** `art/`, `tools/` and `coloring/traced.js` hold the earlier
Firefly-to-SVG converter and its output. The game no longer loads `traced.js`. Leave
them alone unless Keith asks to bring traced art back.

## Arcade games

- The hub (`index.html`) shows 15 cards: claw (Claw Catch, Nov 26), bike, rc, hoops, golf, archery, jungle, trail, quest, space,
  abc (Bubble School: counting, letters, math, colors + shapes; reads questions aloud; topics `l14` Colors / `l15` Shapes (Nov 24) are `open: true` = never locked, always Easy, skipped by the lock + `levelDifficulty` of the other topics; their bubbles draw a blob / shape for `b.text`; `__abcArt()` = the pictures; test `tests/test_abc_topics.py`), coloring, maze, fishing,
  piano (Piano Star: 64 songs are text in `piano/songs.js`, e.g. `'E4q D4q C4h | ...'`; `clef: 'bass'` songs use the low piano C3-G4;
  6 two-hands songs (end of songs.js) add `left: '...'`, show two staves and use C3-B4, notes that start together are one step
  (`parts`); Free Play records 3 tunes per player in `save.data.tunes`; only public-domain songs). Each arcade game lives in its own folder and is built on the shared kit
  in `arcade/` — **read `arcade/README.md` before touching a game.** `bike/bike.js` is the
  reference example.
- Every game keeps its `window.__<game>State` test hook so headless tests can drive it.
- Test a game by actually playing it headlessly (bots / test hooks), not just loading it.

## Tech

- Plain HTML/CSS/JavaScript, no build step, no dependencies, except the library files Keith picked (Nov 20), copied into
  `arcade/`: Phaser, Rex UI, GSAP and Swiper; see `arcade/LIBRARIES.md`.
- **Canvas menus (Phaser 3 + Rex UI)** (Keith, Nov 20: "rewrite everything to utilize Phaser 3 + Rex UI: menus drawn inside the
  game picture, scaled to fit"). `arcade/canvasmenu.js` (`window.ArcadeMenus`) draws a menu "screen" (title, banner, logo, rows:
  text / pics / stars / chips / tiles / round / buttons / slider, footer, onKey; see the comment at its top) on a Phaser canvas
  (`.ar-cmenu`, z 32) laid out on an 820 x 520 board (480 x 820 upright; Nov 22: taller up to 1040 on tall phones, `boardUpH()`) scaled to the screen at full pixel sharpness. SVG pictures
  become textures first (duplicate attributes and CSS animations are stripped: SVG-as-image is strict XML and frozen at time 0).
  A game opts in with `canvasMenus: true` (+ the 3 script tags: `../arcade/phaser.min.js`, `rexui.min.js`, `canvasmenu.js`); the
  kit's menus then build screens instead of HTML (`showScreen()`; `showHowTo`, `levelGrid`, `shellMenu`, `newGamePanel`,
  `unlockPanel`, `trophyPanel`, `titleScreen`, `pauseScreen`, `resultScreen` in shared.js). HTML bits a game hands in (level
  `meta`, result `lines`) are split into pictures + words (`ArcadeMenus.split`); a game's own extra menu stuff must be screen rows
  (`config.extraRows(g, redraw)`, e.g. Jungle Jump's hero picker), because a canvas can't show HTML. A game's own HTML panels
  (`g.panel(el)`) still work (they close the canvas menu). Buttons never change size when pressed. **Finger scrolling** (Nov 21, Keith: "can't swipe up on phone") is our own `dragScroll()` (Rex's drag scroller never saw touches: tiles on top swallow them; it's off with `scroller: false`): since Nov 22 the page's own touch/mouse events on the menu canvas (not Phaser's pointers: Keith's Android first screen didn't scroll), mapped with the canvas's rect right then; Phaser's `scale.updateBounds()` runs at every touchstart too; starts after a 14-unit vertical move, skips live rows with `onDown` and `noDrag` screens; test `tests/test_scroll.py` (real CDP touch swipes). Tests: `ArcadeMenus.isOpen`,
  `.screen()` ('tap', 'title', 'levels', 'results', 'pause', 'help', 'unlocks', 'trophies', 'new'), `.list()` (what can be tapped:
  label, attr, locked, picked, pic, pics, x/y/w/h in CSS px) and `.tap(attr)`; tap for real at the list's spot (see
  `tests/test_jungle.py` `tap()`). **Moving the games over, one per session:** Jungle Jump + Hoop Heroes + Potion Quest (Nov 20; Hoops' `extraRows` = the ball picker), Archery + Treasure Trail + Space Defender + Bubble School + Putt-Putt Park (Nov 21: their Prizes pages are `extraRows`; toggles like Space's auto-fire and Bubble School's voice are a `buttons` row placed FIRST so they're on screen without scrolling) and Turbo Bike (Nov 21, later: `shopScreen`, `editorScreen`, `extraRows`; the cup table/podium are one SVG each in `result.rows`) and Fishing (Nov 21, later still: `bookScreen`, `extraRows` = rods, aquarium.js `shopScreen` + `goalTiles`; the Aquarium is a `live` row: `{ t: 'live', canvas, w, attr, onTap(x, y) }` copies a canvas the game keeps drawing to the screen every frame; results lines are `{ icon, text }`; the Friends list is one SVG) and Piano Star (Nov 21, night: the kit's level picker got picture TABS: `config.levelTabs = { 'section name': { icon, label } }` shows one `section` at a time under a row of round tab buttons (attrs `tab-<i>`, the open one is `picked` = yellow); the tabs are a screen `top` row, which stays put above the scrolling part) and Mini RC Racers (Nov 21, late night: `canvasMenus: true` + its own `mainMenu`; every RC menu function starts with `if (CANVAS) { xScreen(g); return; }` (the "Canvas menus" section above "Start the game" in rc.js: `mainScreen`, `cupScreen`, `trackScreen`, `carScreen`, `battleScreen`, `playScreen`, `itemScreen`, `shelfScreen`, `garageScreen`); results are pictures (`podiumSVG`, `cupPodiumSVG`, `booSVG`, `standingsSVG`; `strip()` / `stripRow()` put several pictures + words side by side in ONE SVG, `nest()` puts an SVG inside another, `imgIn()` a painted car) handed in with `g.finish({ rowsTop: true, rows })` = the game's rows come first and stand in for the medal; screen ids `rc-main`, `rc-cups`, `rc-tracks-free/trial`, `rc-car`, `rc-battle`, `rc-play-rush/follow`, `rc-items`, `rc-shelf`, `rc-garage`; attrs are the old HTML ones: `data-menu="free"` -> `menu-free`, `track-<level id>`, `kind-drive`, `weather-snow`, `tab-paint`, `style-*`, `paint-*`, `decal-*`, `arena-*`, `item-*`, `tro-*` / `go-*`, `up-*`, `buy-*`, `gtab-*`) are done. RC's Track Builder (`rc/builder.js`, Nov 21 latest) is canvas screens too: `rc-mytracks` (tiles `slot-<n>`) and `rc-build` (`noDrag`; a `cols` row: the board is a `live` row `board` you drag on (`onDown/onMove/onUp`, the canvas sets `dirty`), picker tiles `world-*` / `piece-*` / `clear-1` / `laps-<n>` / `sky-*` / `width-<hw>`, tool tiles `draw` `things` `look` `dice` `undo` `back`, buttons `race` / `drive` (`dim` while the track has a problem)); `__rcBuild.rect()` = where the board is. The Friends rooms are the shared canvas screens in `arcade/net.js` (`friendsScreen`: tiles `host` / `joinroom`; `joinScreen`: keys `pic-0..7`, slots `slot-<i>` / `empty-<i>`; `codeRow`, `playersRow`); RC's lobby is `rc-lobby` (tiles `track-fr-<id>`, own tracks `track-fr-my<slot>`), the kit games' lobby `friends-lobby` (tiles `pick-<id>`). A lobby only redraws while it is the open screen. A tile with no `name` gives its picture more room. `screen.fit` (Nov 23, the kit's results screen sets it): a screen only a little too tall shrinks its biggest `pics` row (size >= 150) to fit instead of scrolling (at most a third; `fitShrink()`, drawn twice, the first try hidden). A game's own screen opened with `ArcadeMenus.open(screen)` again under the same `id` keeps its scroll spot (shops). In `tiles` rows a `{ heading }` gets a line of its own; `pics` items can be `{ img: dataURL }`; `g.finish({ rows })` adds screen rows to the results. A game's own result buttons get `attr` = the label in lower case (Space: `checkpoint`). Test helpers for canvas menus: `tests/cmenu.py` (`to_title`, `wait_screen`, `items`, `find`, `tap`, `into_game`; for RC's old tests `click(pg, '[data-menu=free]')`, `count(pg, sel)` and `attrs(pg, 'track-')` turn an old HTML selector into the canvas attr and fall back to the HTML; `list()` items have `shown` = not scrolled out of sight); a meta row with ONE line of words wraps (Item Book); `tests/test_canvas_menus.py` walks every converted game (add each new one to its `GAMES`; RC has its own main menu, so it has its own walk: `tests/test_rc_menus.py`). `Arcade.guardTaps(ms)` is exported for tests. Must run by opening `index.html` or from GitHub Pages.
- **Glossy menus + Phaser logos** (Nov 23, Keith live: "retool every menu and every logo to fit Phaser, make it look sharp"; he
  picked the glossy arcade look, shared kit first). In canvasmenu.js: `gloss(sizer, w, h, color, opt)` = layered backgrounds (shadow,
  box, bottom shade, top shine; returns the layers, [1] = the box), `ballTex(color, d, ring)` = round buttons (painted canvas texture),
  the panel = `roundRectangleCanvas` gradient + gold rim, titles / banners on a glossy sign, words in **Fredoka** (`arcade/fonts`,
  `@font-face` in css/style.css). Title screens: `backdrop()` (glow + slow rays + particles) and `drawLogo(spec, ...)`: `Arcade.logo()`
  records its pieces (`Arcade.logo.spec(svg)`: l1, l2, colors, tag, `badge` = a 300 x 300 SVG), drawn as burst + badge + `titleTex()`
  (letters painted on an arch, `paintLine()`) + twinkles, which pop in, spin, bob and shine (`preFX` shine/glow only with WebGL, not
  in Calm motion or lite drawing: `fxOK()`, `slow()`). A logo in a `pics` row (the hub) is one still picture (`logoStill()`). RC's
  logo is `Arcade.logo` now too (rc/index.html loads badges.js). Part 2a (Nov 23, night): `headingSign()` (tile `heading`s =
  a purple ribbon + gold twinkles), `cardBg()` (row `bg` cards), glossy `chips`, `stage(item, px)` (a `pics` item with
  `stage: true` = gold stand + spotlight + rays: the Bike Shop's bike, RC's My Car, both in a `cols` row), `framed()` (`live`
  rows get a gold-rimmed frame, `frame: false` = without; the aquarium). Things made BEFORE their background (to be measured)
  need `scene.children.bringToTop()`. Part 2b (Nov 23, late night): row `{ t: 'heading', text }` (a ribbon on its own; the Parent corner's headings), `pics` items
  `{ svg | img, frame: true }` (in a gold frame: the Parent charts, `shinyBar()` in parent.js), Jungle Jump's + Space's Unlocks = a `cols` row
  with the picked hero / ship on a `stage` (`heroPic(h, 4)`). Part 2c (Nov 23, latest): `spotlit(w, h, make)` = a golden glow + light
  rays painted to exactly the box (`rayBoxTex()`, so it never makes a row bigger; it breathes, not in Calm); `pics` rows with `glow: true`
  use it (the kit's `resultScreen()` sets it on the medal and on any results `pics` row of size >= 200: RC's podium, cup tables, the
  ghost card); the `stars` row is spotlit and each star `burst()`s twinkles (`popLater` entries `[obj, delay, sparks]`); row
  `{ t: 'plaque', label, value, best }` = the score on a gold-rimmed plaque (+ a NEW BEST! ribbon).
  Part 2d (Nov 23): the results pictures themselves (one SVG each) use
  `Arcade.svgGloss` (end of shared.js): `defs()` once per picture, then `step()` (podium steps 'gold' / 'silver' / 'bronze'),
  `pill()` (rows 'white' / 'me' / 'gold' / 'lilac'), `bar()`, `rays()` (fade out), `glow()`, `floor()`, `trophy()`, `sparkle()`; used by RC's
  `podiumSVG` / `cupPodiumSVG` / `standingsSVG` / `booSVG` (`GL`) and Turbo Bike's `cupTableRow` / `cupPodiumRow` / `ghostResultSVG`.
  Words in these pictures stay Arial Black (an SVG drawn as an image can't use Fredoka).
  Part 3 (Nov 23, night): the HTML bits. `css/style.css` "Glossy HTML buttons": `.round-btn`, `.crayon`, `.tool`, `.tab`, `.size`,
  `.pl-btn/pet/col/age` get inset shading + a drop shadow (box-shadow) and a shine (`::after`, icons raised above it with
  z-index); the button's color stays a plain `background`, so a page rule that sets `box-shadow` on one of these undoes the
  gloss (don't). The hub's player editor (`.pl-panel`) and the Parent wall (`.pa-wall`, CSS inside arcade/parent.js: rays
  `::before`, twinkles `::after`, gold-rimmed `.pa-wallbox`, the `h1` on a sign) copy the canvas panel's colors.
- **Menus on phones** (Nov 20, Keith: "doesn't format correctly on some phones"): every page has `viewport-fit=cover`; `css/style.css`
  sets `text-size-adjust: 100%`, `100dvh`, and `--safe-t/r/b/l` (the notch / home bar room); the kit's corner buttons, touch pads,
  overlay, title screens and game stage keep out of it (`resize()` and `fitPanel()` read the paddings). `fitPanel()` shrinks a menu
  with `setZoom()` (CSS zoom, or a scaled picture on browsers without zoom) and makes it scroll instead when it would shrink below 72%.
  Title-menu picture rows wrap (`.ar-picsmall`). RC's own menus: `html.rc-tall` (upright: 540 wide, as tall as the screen, 3 across,
  scrolls; the builder stays wide: `.rc-wide`) and `html.rc-small` (zoom under 60%: big bottom buttons). Test: `tests/test_phones.py`
  (every page x 9 phone shapes x upright/sideways: nothing off the screen, nothing tiny, nothing under the corner buttons).
- **Home button + controls card** (Nov 20, Keith): the corner home button (`.ar-back`, z 36) sits above every menu (HTML overlay
  z 30, canvas menu z 32) so it always works (test `tests/test_home.py`). Every kit game shows the **controls card** (`showControls()`
  in shared.js: the first `config.controlsSteps || 4` how-to pictures) each time a round starts; the game is frozen until a tap/key.
  Not on Start over (`startLevel(lv, true)`) or Friends levels (`fr-`). A game can delay it with `controlsCard: (g) => false` and
  call `g.showControls()` later (Potion Quest: after "Pick your hero"). Headless tests skip it (`navigator.webdriver`) unless
  localStorage `kidsArcade.testControls` is set (`tests/test_controls.py`).
- **Speed + battery** (Nov 24, new plan point 9): `arcade/rexui.min.js` is OUR small build (`tools/make_rexui.py`, entry
  `tools/rexui/entry.mjs`: only roundRectangle, roundRectangleCanvas, sizer, fixWidthSizer, overlapSizer, scrollablePanel,
  slider; a menu that needs another Rex part must add its Factory import there and rebuild) and `phaser.min.js` is Phaser's
  arcade-physics build (no Matter). Swiper is loaded by `stickers/book.js` only for the fallback book. **Pacing** (canvasmenu.js
  "Pacing"): the menu draws every frame only while `busy()` (a screen just built, a finger down, a wheel / glide, a `live` row),
  else at most ~30 a second (`fps: { limit }` + `game.loop._limitRate`); `ArcadeMenus.pacing()`. The kit loop (shared.js, end of
  `frame()`): a `paused` game is drawn once a second (at once after `resize()` / a state change: `redrawNow`), `menu` / `over`
  30 a second, under a title screen (`ArcadeMenus.covers()`) not at all, `play` + "Show me" every frame. **The nap** (Nov 24, later
  run, in "Pacing"): no touch / key / mouse move for `ArcadeMenus.napAfter` (40 s) = 10 a second (`ArcadeMenus.napping`, `poke()`). Counters `Arcade.perf` (`draws`, `menuFrames`). Test `tests/test_speed.py`
  (library sizes, every page's first menu in time, the pacing, the font preload). **Font preload** (Nov 25): each page with canvas
  menus has an inline `<script>` right after the css/style.css link that writes 2 `<link rel="preload" as="font" crossorigin>`
  tags, only when `location.protocol` is http(s) (from the disk a font preload is a CORS error); a new page copies it. Also (Nov 24): kit results with `rowsTop` (RC's podium) put NEW BEST! + the chips on one line (`cols`).
  Part 2 (Nov 24, night): a steady frame rate on older tablets. The game canvas is opaque (`alpha: false`: draw the whole
  picture); `Arcade.perf.cost()` / `.reset()` / `.flush` time a game's drawing, `tools/frametime.py` prints a table per game;
  lite drawing after 2.5 s of slow play in a row (`watchSpeed()`), and lite ignores `shadowBlur` on the game canvas (`g.glows()`);
  `Arcade.draw.layer()` / `.band()` copy only a still layer's painted rows (archery far/land, trail mid/ground, quest strips).
  Hoops: each machine's cage painted once (`cageFor()`, hook `__hoopsScene.cages()`), neon tubes in the hall, `glowDot()`
  sprites for bulbs / LEDs, only the hall front's two bands copied. Jungle: the sky painted once (`skyFor()`), strips at the
  screen's sharpness. Test `tests/test_frames.py` (lite timing, glows, `draw.layer`, a drawing budget per game). See arcade/README.md.
  On top (Nov 25, overlapping run): Jungle's tiles are painted once in strips (`drawTilesFast()` / `paintStrip()`, `STRIP` 8 tiles,
  `drawTiles(..., 'still' | 'live')`: jelly blocks stay live; a changed tile must call `forgetStrips(c)`; `__jungleScene.strips()` /
  `.stripsOff()`), cached `crystal()` pictures; Trail's `artSteps()` (a generator: far / mid / ground) + `buildAhead()` paints the next
  room one layer a picture (`__trailTest.art()`). Both in `tests/test_speed.py`. (Words cached as little pictures were measured
  slower in Chrome: not worth it.)
- **Calm motion** (Nov 22, accessibility pass): `Arcade.calm()` (top of shared.js) = the device asks for less motion OR the Parent
  corner's This device -> Motion is Calm (`motion: 'calm'` in `kidsArcade.parent`, `Arcade.parent.setMotion()`; buttons `motion-auto` /
  `motion-calm`). Calm: `html.ar-calm` (css/style.css stops every CSS animation + transition), no GSAP pop-ins, no confetti, canvas menus
  skip pop-ins / hopping badges / pulsing big buttons / floating logos (`calm()` in canvasmenu.js), and games multiply screen shake by
  `Arcade.shakeK()` (0 when calm: space, quest, bike). A new game with a camera shake must do the same. `ArcadeMenus.texts()` lists the
  words on a canvas menu (color, outline, where); `tests/test_calm.py` checks each one's contrast against a screenshot.
- **"Show me"** (Nov 24, new plan point 6): `config.showMe = { secs, think(g, hand, t), moves }` (shared.js "Show me" section, above
  `startLevel()`): the first Play per player (`kidsArcade.showme`, `wantDemo()`) runs the real game with a see-through hand (`.ar-demo`,
  z 34; `hand.drag/tap/key/busy`, view coords; keys go to the visible pad button or a key picture `.ar-keycap`), then "Your turn!"
  and `startLevel(lv, true)`. While `g.demo` / `Arcade.demoOn`: `store.save()`, toasts, unlock / achieve, daily and `finish()` do
  nothing, and the save is put back (`restoreInto()`). Buttons `showme` on the Help + Pause screens; `g.showMe()`, hook `__showMe()`;
  headless tests only with localStorage `kidsArcade.testShowMe`. Done: hoops, golf, archery, abc. Test: `tests/test_showme.py`.
  Part 2 (Nov 24, evening): TWO hands (`demo.R` / `demo.L`, the left one mirrored, `.ar-hand.left`): a key goes to the hand on
  its pad's side (`keySide()`: one-thumb pads when those show; on a computer arrows = L, the rest R; the key pictures sit in two
  `.ar-demo-keyset`s), taps + drags are R's; each hand works through its own list. `hand.busy(side)`, `hand.holding(id)`,
  `hand.release(id)`, `hand.done()` (end now); a hand already resting on a button presses at once; `moves` / `keys` can be
  `(g) => [...]` and a move's `key` a function. `g.demo` is already true during `setup()` (bike: 1.2 s countdown). Games: bike
  (moves + `think` lanes, `demoLane`), jungle / trail / fishing (`demoThink()` in each; fishing's fish come fast while `g.demo`).
  `__showMe().left` = the left hand.
  Part 3 (Nov 24, night): rc (`demoThink()` above `thumbItem()`: right = Gas / the gift (the demo gets one at "Go!"; countdown 1.4 s),
  left = steering toward the road ahead; `showMe.sides = { ArrowUp: 'R' }` = which hand a key is on a computer), quest (`demoThink()`
  above `alive()`: no hero picker while `g.demo`, 2 potions; `hand.drag(..., 'L')` = the left finger walks, right = Bonk / Magic),
  space (`demoThink()` above `kidThink()`: relative drags behind the ship; intro 0.6 s). `hand.drag` takes a 7th arg `side`.
  Canvas menus drop keys queued while asleep (`M.open`) and a closed menu has no key listener (the Escape that paused RC used to
  reach the old track screen's onKey).
  Part 4 (Nov 24, late night): piano (`demoThink()` above "Pressing a key": taps the glowing key (`keySpot(k)`); two-hands songs:
  `hand.tap(x, y, 'L')` for the left-hand note ~0.22 s after the right one (one pointer in the game); Free Play: `DEMO_TUNE`).
- **The Star Road** (Nov 24, new plan point 8): `config.looks = { kinds: ['hat', 'trail'] }` (shared.js "The Star Road": the
  catalog `Arcade.looks` = `HATS` / `TRAILS` as SVG, `drawHat(ctx, id, x, y, headW, tilt)` draws a hat from a cached picture;
  inside `start()`: `starRoad()` (8 looks, first at 2 stars, steps <= 8, all by 3/4 of the stars), `checkLooks()` (at start + in
  `finish()`; `save.looks = { best, got, fresh, hat, trail }`, `best` never goes down; nothing during the demo), `looksScreen()`
  (screen `looks`: a `cols` row Hats | Trails, tiles `look-<id>`, picked = worn, locked = stars needed), `newLookScreen()` (screen
  `newlook`, buttons `wear` / `ok`, then the results; headless tests only with localStorage `kidsArcade.testLooks`). Title menu button `looks` (round `badge` = NEW), chips "stars/next" on the
  title + results. In a game: `g.looks.hat`, `g.looks.trail(x, y, { to, on, key, always, angle, speed, scale })`, `info()`. New
  Particles shapes `heart`, `bubble`. Games: jungle (hat in `drawHero` `o.hat`), golf, hoops, space (trails); part 2: trail (trails only), quest
  (`Art.hero` `o.hat` replaces the hero's own hat; trail bits in `lookFx`, world space), fishing (hat in `drawAngler()`, trail on the lure);
  archery keeps its own older hats + arrow trails. Test `tests/test_looks.py`.
  Part 3 (Nov 24, night): bike (`drawBike` opt `hat`; trail from the back wheel, screen-space `always` + `angle`), rc (trail in
  `driftTick()` = your car only, to `fx`; RC has its own main menu, so the kit gives `g.looks.screen(back)` / `.fresh()` / `.next()` /
  `.stars()`; button `looks` on `rc-main`). Test `tests/test_looks_more.py`.
  Part 3b (Nov 24, night): a 3rd look kind `color` (`looks.COLORS`: bubblegum / ocean / sunset / galaxy (`twinkle`),
  `Arcade.looks.colorAt(id, t)` glides between a look's `colors`; `g.looks.paint(t)` = the color to paint with or null,
  `g.looks.colorId`, `g.looks.takeOff(kind)` (the Bike Shop + RC's My Car paint picks call it), headings `looks.NAMES`; 3 kinds =
  narrower Looks columns): bike (`kinds: ['hat', 'color', 'trail']`, paint in render + the progress dot) and rc (`['color', 'trail']`;
  the update tick sets `player.color` + drops `player.fx`, drawCar paints `c.isPlayer` with it, Galaxy twinkles). Test `tests/test_looks.py`.
  Part 4 (Nov 24, latest): the tapping games: `g.looks.splash(x, y, { to, count, angle, spread, speed, scale })` = a one-off puff
  of the worn trail's bits. abc (trail follows the finger / mouse, `key: 'finger'`; a puff in `tapAt()`; the right bubble bursts
  into it in `tapBubble()`), piano (`press()` + tune playback: the trail sparkles up out of the key; not in Listen). Test
  `tests/test_looks_tap.py`.
  Part 5 (Nov 24, newest): looks OUTSIDE the games. `Arcade.looks.GAMES` (game -> kinds; must match each game's `config.looks.kinds`,
  the test checks; archery isn't in it), `roadOf(game)`, `gotIn(game)` (= `games[game].looks.got`, filled in when the game runs
  `checkLooks()`), `owned(kind)` (earned in any game), `puff(particles, trailId, x, y, o)`. My House: nav tile `looks` -> screen
  `house-looks` (tiles `hat-<id>` / `trail-<id>`, footer `back`), saved as `house.wear = { hat, trail }` (`myWear()` only returns
  looks the player has); `animalBody(p, hat)` + `hatOn()`; the trail puffs on a hop (`trailPuff()`, `rparts` drawn over the room) and
  follows a dragged animal (`dragTrail()`); Friends' `hm.who` carries `hat` / `trail`. Sticker Book: footer button `looks` -> screen
  `stickers-looks` (tiles `lgame-<id>` = play, `look-<game>-<id>`, footer `back` / `home`) and `stickers-look` (`close`, `play`);
  hook `__bookLooks()`. `__houseState()` has `wear`, `puffs`, `bits`. Test `tests/test_looks_book.py`.
- **Game feel / juice** (Nov 22, new plan point 3): every kit game has `g.juice` (`makeJuice()` in shared.js, above the
  drawing helpers): `squash(key).hit(a)` springs (`.apply(ctx, x, footY)`, `.sx/.sy`), `dust`, `sparkle`, `poof` (shapes `puff` +
  `ring` in Particles; `to:` a game's own Particles), `stop(sec)` (the loop skips game steps: a tiny pause), `flash`, `shake` (the
  kit translates the picture in `drawFrame()`), `pop(key)` + `size(key)` (numbers that boing); new sfx sparkle / poof / clang /
  thud / plink. Calm motion: squash x0.35, no flash / shake, fewer bits. `__game.juice.info()` counts each use. See "Game feel"
  in arcade/README.md. Done: Hoops, golf, abc, jungle (hero = `squash('hero')` -> `p.sx/sy`, `dust(g, ...)`), trail (`gref`,
  `puff()` / `landed()`), quest (`squash(who)` springs per hero / foe drawn by `squashed()` in render, `feetDust()`; `S.shake` is gone,
  use `G.juice.shake`; hook `__questTest.ouch()`), bike (`squash('bike')` drawn round the wheels in render; a tumble = `juice.shake`, the
  old `shake` is only the top-speed rumble; `pop('coins')` / `pop('heat')`), rc (`squashCar(g, c, a)` sets `c.sq`; drawCar scales the car's
  own frame by `(sq.sy, sq.sx)` so it squashes along the way it points; world bits go `to: fx`; pops `lap` / `item` / `stars` / `rush` /
  `hearts`), space (`e.sq` / `boss.sq` = a spring per enemy / boss, drawn in render; `squash('ship')`; pops `score` / `lives` / `combo` /
  `weapon`; its own `shake` stays for roars). Every arcade game has it now. Test: `tests/test_juice.py`.
- **Bouncy menus** (GSAP, Nov 20): every page loads `arcade/gsap.min.js` before shared.js. The kit's `show()` calls `popIn(panel)`
  (`Arcade.popIn`, also the hub's game boxes): the panel pops, then `POP_KIDS` (tiles, menu pictures, buttons) bounce in one by one;
  pressing any `SQUISH` element squishes what's INSIDE it + `.ar-pressed` (never scale the button itself: taps near its edge would miss, Keith Nov 20). Off when the device asks for less motion (tests that measure layout right after a menu
  opens use Playwright `reduced_motion='reduce'`, like test_hub.py). The **Sticker Book** is a canvas menu (Nov 21, "Canvas menus" section at the end of
  `stickers/book.js`): screen `stickers-book` (`tab` = the spread; top = count chips + page dots; each game page is a row with
  `bg` = a colored card: tile `game-<id>` (tap = play) + tiles `sticker-<id>` (new = `picked`, not yet = `color` + hint `meta`);
  footer `prev` / `home` / `next`; `onSwipe` + arrow keys turn pages; 2 pages a spread, the Surprise page alone) and
  `stickers-one` (one sticker big; `close`, `play`). The Swiper book is only the fallback without Phaser. `__bookShow(id)` opens
  a sticker's spread, `__bookState()` (`spread`, `spreads`, `canvas`). Canvas-menu bits added for it: `screen.top` can be a list
  of rows, any row can have `bg` (a colored card), tile `color`, `screen.onSwipe(dir)`; dim buttons use Rex's local alpha.
  **Resizes** (Nov 21, Keith's Android "RC menu isn't working"): `refit()` in canvasmenu.js waits 120 ms, never redraws while a
  finger is down (`fingers`; Android's browser bar resizes the page mid-tap) or when the size didn't change, and `fit()` calls
  `game.scale.refresh()` after setting the canvas's CSS size (otherwise Phaser maps taps with the wrong scale). Test: the
  "android" part at the end of `tests/test_rc_menus.py` (a resize between touchStart and touchEnd).
- Maze game: `maze/index.html` + `maze/maze.js` (mazes are generated, not drawn; the
  shapes, themes, sizes per difficulty and friend/treat pairs are lists in `maze.js`;
  key/door/gems are placed by `placeExtras()`; **bridges** (Nov 22, `bridgeCount()`, from level 3): a bridge cell is two spots,
  `"x,y"` = over and `"x,y,u"` = under (`isUnder`, `cellOf`, `resolve(from, k)` picks over/under for a finger; `makeMaze()` joins
  each side pair through the bridge first, so both are always used; `drawBridge()`, `overTrailEl`, hero class `under`)). **Cheeky treat** (Nov 22): `isChase(lv)` (level >= 4, every 3rd), `chaseHops()` (1 little/Easy, 2 Normal, 3 Challenge), `maybeHop()` after every step moves `goal` 3-5 steps away (never bridge/start/key/locked), `#goal.cheeky`; state `chase`, `hopsLeft`. Progress saves under `kidsMaze.v1`.
  **Maze Maker** (Nov 22, "The Maze Maker" section near the end of maze.js): the map's footer button `make` opens screen `maze-mine`
  (tiles `made-0..2`, footer `back`); a tile opens the maker (`openMaker(slot)`, `body.making`: the top bar hides, `#makerBar` buttons
  `#mk-dig/erase/friend/treat/gem` + `#mk-back/undo/dice/paint/clear/play`). Dragging digs `mk.links` ('x,y|x,y'); saved in
  `saved.made[slot] = { n, p, s, g, gems, t }`. `playMine()` plays it (`made = { slot, t }`, `body.playmine`: `#editBtn` replaces
  `#shuffle`, `curShape()` = `MINE_SHAPE`, `curTheme()`); a made maze never changes stars / done / top. Hooks `__mazeMaker`
  (`state()`, `spot(k)` = screen px, `saved()`). Test: `tests/test_maze_maker.py`.
  Nov 19 upgrade: 8 shapes, 7 `FRIENDS` (each has `need` = mazes finished before it can be picked; Nov 21, last run: 10 friends,
  + penguin / frog / owl at 15 / 18 / 21, and each has `call` = its own notes, `friendCall()`, played on pick + win), a 5th theme
  `cave` (`dark: true`: on Normal/Challenge for big kids an SVG mask hides the maze except where the lantern has been,
  `light()`), the "stuck?" sparkle (`resetIdle()`, 15 s / 9 s for little kids), and the **map** (`openMap()`: friend picker
  incl. dice = take turns (`saved.buddy`), the difficulty dots, one stone per maze up to `saved.top`; tap = replay).
  The map is a canvas menu (Nov 21: `openMap()` builds screen `maze-map`: tiles `buddy-mix` / `buddy-<id>`, stones `level-<i>`,
  footer buttons `back` / `diff`; `screen.scrollTo` opens it at the current stone). Non-kit pages using canvas menus load the
  3 script tags themselves and get `.ar-cmenu` from `css/style.css`; they set `ArcadeMenus.lockIcon` if they use `locked` tiles.
  Test hooks `__mazeState()`, `__mazeTest.route/step`. Test: `tests/test_maze.py` (taps the map with `tests/cmenu.py`).
- **Music for coloring + maze** (Nov 22, off by default): `Arcade.pageMusic(btn, SONG, isOn, setOn)` (end of shared.js) makes a
  page's `#musicBtn` an on/off switch (saved as `saved.music` in the page's own save), plays the song after the first touch, pauses on
  a hidden tab, and overrides `applyVolumes` while on (like the Jukebox: plays with the hub music off, muted still wins). Returns
  `{ toggle, icon, isOn, on, mood, stinger }`. Songs: `COLORING_SONG` (coloring.js; the picker's footer has a `music` button too)
  and `MAZE_SONG` (maze.js; `musicMood()` muffles it in dark caves). Both are in `tools/make_jukebox.py`'s GAMES. Hook `__pageMusic()`.
- **Magic crayons** (Nov 21): the wand button (`#magicBox`, `saved.magic`) opens a 3rd crayon box. Each is listed in
  `ColorArt.MAGIC` (render.js: `grad` = a blend, `tile` = a 40 x 40 repeating picture, `main` = the plain color for brush
  lines / stickers / the size dots). A part's color is saved as `'~<name>'` (e.g. `~dots-pink`); `setFill()` keeps it in
  `data-f` and puts `ColorArt.magicCSS()` in `--fill` (+ `--fillp: url(#mg-<name>)` for the banana's SVG path, the page has
  hidden `<defs>`); `pageSVG()` adds `magicDefs()`. Fills make a "bloop" (`pop()`), magic ones twinkle (`twinkle()`).
  `css/style.css` styles the kit's `.ar-toast` for pages without arcade/shared.css (coloring, maze).
- Coloring tools (fill, brush, eraser, stickers), undo/redo, auto-save and the gallery live
  in `coloring/coloring.js` (saved under `kidsColoring.v1`). The picker and "Done!" are canvas menus (Nov 21, "Canvas menus"
  section near the end of coloring.js): screen `coloring-pick` (top row tabs `tab-animals/fruit/things/gallery`, tiles
  `page-<id>` / `art-<n>`, footer `home` + in My pictures `remove` (then tap a picture twice)) and `coloring-done` (`hang`, `ok`);
  the HTML picker / `#done` are only the fallback without Phaser. Test hook `__coloringMenus()`. Stickers are a list in `coloring/render.js`
  (`$C` = the color a child can change with the fill tool; a placed sticker saves it as `c`). Coloring the last
  part (the sky doesn't count) pops up "Done!" (`celebrate()`): hang it on the wall (= save to My pictures) or keep coloring.
- `coloring/render.js` (`ColorArt.pageSVG(page, state)`) draws a page + its colors as SVG; My House uses it for the
  Art Room's picture wall (the 6 newest pictures in My pictures). The test checks it draws every page.
- Coloring pages are HTML/CSS shapes in `coloring/animals.js`, `fruit.js`, `things.js`, styled by
  `coloring/pages.css`. Each colorable shape has `class="r"` and takes its color from `--fill`;
  brush lines and stickers go on a see-through SVG (`.art-layer`) on top. Saves are `v: 2`
  (fills from older SVG-era saves are skipped).
- **Players**: `Arcade.profiles` (top of `arcade/shared.js`) holds the players. Every save key gets
  the player's id added (`kidsArcade.v1.p2`; player 1 keeps the plain names). Any new save must use
  `Arcade.profiles.key('name')`. Each player has an age preset (`Arcade.profiles.age()`: `little` 3-5 / `big` 6+);
  little kids always get Easy and games add help via `g.little` (see `arcade/README.md`). Favorites are `Arcade.store.isFavorite/toggleFavorite`; the hub's "play again" row is `Arcade.store.recent()/markPlayed(id)`.
- **No hub tabs** (Keith, Nov 22: "categories can go away"): the hub shows every game in `GAMES` (top of `index.html`) in one list, hearted ones first (`shownGames()`).
- **The hub is a canvas menu** (Nov 21, "Canvas hub" section near the end of `index.html`; the HTML hub is only the fallback
  without Phaser, hidden by `body.cm`): screen `hub` (no tabs since Nov 22; rows = logo, Daily Surprise tiles `daily-say` /
  `daily-go` (`daily-game` once done) / `daily-prize`, play-again `recent-clock` + `recent-<id>` (All tab), game tiles
  `game-<id>` (Nov 23, Keith: "work on the logos, no titles under them": `logo: true` tiles = `logoTile()` in canvasmenu.js, the game's badge as a shiny app icon (`iconPic()` in index.html), no name, stars / medals / heart on a white pill under it; `label` keeps the name for tests), buttons `grownups` (goes to `parent/`, whose door asks for the 3-second hold) + `addhome`; the bar `who` `daily`
  `book` `house` `juke` is ALWAYS the footer (Nov 22, Keith: "way too much on it": no play-again row any more, tabs are one row of
  pictures without words (round row `size`), small logo, hidden on a sideways phone). **Hearts**: `hearts` in `hub-players` turns on heart
  mode, then a game tile toggles its heart (`picked` = hearted), the yellow `hearts` button on top of the hub = done. Screen `hub-players`:
  tiles `player-<id>`, `add`, the player's switches `music` / `age` / `hearts`, buttons `edit` / `close`. The player editor stays an HTML box (`#players`, it has a name to type); the canvas menu closes while it's
  open. `__hubState()` adds `canvas`, `screen`, `hearting`, `nav` ({fresh, coins}), `mascot`. **Bop** (Nov 25, plan point 10): the hub's top row is `{ t: 'mascot', logo, parts: Arcade.mascot, bubble, hello, attr: 'mascot' }` (`mascot()` in canvasmenu.js: pieces pinned in one overlapSizer, moved by `place()` from a `pose`; hello = hop + wave, then the right arm points at the bubble = today's `D.gift(done)`; tap = `dailyScreen()`; hello once a visit (`bopSaidHi`); not in heart mode / on a sideways phone; Calm = just pointing). **Seasons** (Nov 25): the hub screen has `season: Arcade.season()` (by month; tests: localStorage `kidsArcade.testSeason` = a season or 'off', or `kidsArcade.testDay`): `seasonFx()` in canvasmenu.js = falling snow / leaves / petals / rising bubbles (particles with a `deathZone` inside the panel, moved just above the panel's background with `scene.children.moveAbove(o, topShine)` so they stay behind the tiles; none in Calm / lite) + a still rim decoration (winter snow cap `snowCap()`, else corner clusters `ss-c-<season>`); the mascot row's `dress` = `Arcade.mascot.dress[season]` (a 200 x 220 piece over the body). `ArcadeMenus.seasonInfo`, `__hubState().season`; test `tests/test_seasons.py`. His art: `arcade/mascot.js` (body 200 x 220, `lids`, `armL` / `armR`, `bubble(svg)`). `ArcadeMenus.mascotInfo` = { waves, blinks, pointing, bubble }. NOTE: the menu's paced loop gives Phaser's `scene.time` no time, so timers in canvas menus must be tweens (`every()` in mascot()), not `time.addEvent`. Test `tests/test_mascot.py`. **Tile previews** (Nov 25, plan point 10 part 3): each hub game tile item has `preview` = `Arcade.previews.build(id)` (`arcade/previews.js`: parts cut out of the game's badge text (`cut: [from, to]`, `wrap`, `pivot`, `at(t)` = moves; every part must be at rest at t = 0 and 1) + `over` = `iconPic('')`; none in heart mode); canvasmenu.js "Tile previews": `previewAdd()` from `logoTile()`, ONE tile at a time in turn (`previewNext()`, `M.previewGap` / `M.previewFirst`), only tiles in sight, painted on a canvas texture `pv-<id>-<px>` by `paintPreview()` (`M.paintPreview`) that stands in for the icon, then back; not in Calm / lite / nap / finger down; pictures loaded only at its turn. `ArcadeMenus.previewInfo`, `.previewTiles()`. A badge edit must keep each preview's `cut` strings (the test notices). Canvas menus ignore taps whose DOM target
  isn't the menu canvas (`onCanvas()` in canvasmenu.js), so HTML boxes on top (editor, "All done" wall) never press what's under them.
- **Music**: songs are recipes with hand-written tunes (`tune: { A, B, C }`, `prog: [verse, chorus, bridge]`);
  see the comment above `songs:` in `arcade/shared.js` and the Music section of `arcade/README.md`.
  Games steer it with `g.music.mood({...})` and `g.music.stinger(name)`. Every new song needs a tune.
- **Space Defender** is three files: `space/data.js` (sectors, mini/big bosses, songs), `space/art.js`
  (every drawing: your ship `drawShip()` (Nov 22), enemies, bosses, the Chimera, weapon icons; `part()` = fill + shade + shine + outline;
  `tools/preview_space.py` shows ships + enemies; the menus' ship pictures are `shipSVG()` in space.js) and `space/space.js` (rules, the 20 WEAPONS list,
  boss ATTACKS, the Chimera phases). `__game.play(SpaceData.SECTORS[i])` starts a sector in tests.
  **Cloud Park** (Nov 24, plan point 7): `SpaceData.STARTER` (id `s0`, `starter: true`, theme `puff`, song `cloud`) is NOT in
  `SECTORS` (so nothing that counts the 10 sectors changes); `levels()` puts it first, never locked, `noStart` for big kids (Play
  skips it once they've played). `setup()` softens `K` for it; a bump in `updateEnemies()` pops the robot instead of a bonk. Its
  bosses `MINIS.babyBob` (acc `propeller`) + `BIGS.cloudy` (`ART.BIG.cloudy`) use the gentle ATTACKS `lazy` + `drizzle` (bullet
  kind `drop`); Endless skips them. Trophy `cloud`. Hook `__spaceTest.bobber()`. Test `tests/test_space_starter.py`.
- Automated tests live in `tests/`: `test_players.py`, `test_hub.py`, `test_mascot.py` (Bop, the hub's mascot), `test_seasons.py` (the hub's seasons), `test_previews.py` (the hub tiles' tiny moving previews), `test_abc.py`, `test_abc_topics.py` (Colors + Shapes), `test_tapguard.py`, `test_tunes.py`,
  `test_music.py` (~2 min), `test_rc_music.py`, `test_space.py` (~5 min), `test_space_starter.py` (Cloud Park, the starter sector), `test_trail_new.py` (Rainbow Falls + Mushroom Hollow: the raft, the bouncy mushrooms, one thumb, pretend kids), `test_age.py`, `test_piano.py`, `test_rc.py`, `test_rc_ghost.py`, `test_rc_build.py`, `test_rc_battle.py` (~2 min), `test_rc_modes.py` (~3 min), `test_rc_menus.py` (~3 min), `test_canvas_menus.py`, `test_home.py`, `test_controls.py` (~2 min), `test_phones.py` (~15 min: run a few pages with `python3 tests/test_phones.py rc jungle`), `test_rc_extras.py`, `test_rc_items.py`, `test_rc_feel.py` (drifting, the finish-line party, the podium), `test_jungle.py` (~5 min), `test_parent.py`, `test_stickers.py`, `test_friends.py`, `test_offline.py`, `test_bike.py`, `test_bike_tracks.py` (~4 min), `test_bike_cup.py` (~2 min), `test_bike_shop.py`, `test_bike_build.py`, `test_bike_ghost.py`, `test_scroll.py`, `test_daily.py`, `test_house.py`, `test_golf.py`, `test_maze.py`, `test_maze_maker.py`, `test_quest.py` (~3 min), `test_fishing.py` (~2 min), `test_jukebox.py`, `test_page_music.py` (coloring + maze music), `test_calm.py` (Calm motion + every menu word readable), `test_archery.py` (pops balloons, hits every kind of target), `test_bike_scenery.py` (Turbo Bike's living backgrounds), `test_living_scenery.py` (Jungle Jump, Treasure Trail, Archery, Hoops + golf living backgrounds), `test_rc_scenery.py` (RC's living backgrounds), `test_juice.py` (game feel: the kit's g.juice + Hoops, golf, Bubble School, Jungle Jump, Treasure Trail, Potion Quest, Turbo Bike, Mini RC Racers, Space Defender), `test_touch.py` (the touch pad: real finger touches in the 6 games with buttons, phone / upright / tablet), `test_one_thumb.py` (one-thumb mode: the setting, the buttons, the games helping), `test_orientation.py` (~10 min: every game + coloring + maze while playing, on 5 phone / tablet shapes, turned mid-game; `python3 tests/test_orientation.py rc coloring` runs a few), `test_playtest.py` (~12 min: the playtest robot's fixes: easy golf holes ~par for pretend kids, the Blob King's ring shows in his wind-up, a pretend kid beats Castle Bridge, Jungle/Trail/Bike/RC fixes, archery's last-shot dots, hoops leading a sliding hoop, 2 laser beams in Space, fishing's Challenge stars + pale-green reel edges, Bubble School's see-through tried bubbles + glowing hint), `test_showme.py` ("Show me": the hand's demo in hoops / golf / archery / abc + two hands in bike / jungle / trail / fishing / rc / quest + space's sliding finger + piano (two-hands songs, Free Play) (one thumb too, key pictures on a computer), skip, Help + Pause buttons, nothing saved), `test_hoops_courts.py` (Hoop Heroes' challenge courts: tabs, golden balls, up + down, near + far, hot shots, unlocks), `test_looks.py` (the Star Road: looks unlock with stars, the Looks + "New!" screens, hats + trails in the games), `test_looks_more.py` (Star Road part 3: Turbo Bike's helmet hats + trail, RC's Looks button + trail), `test_looks_tap.py` (Star Road part 4: Bubble School's finger trail + Piano Star's key sparkles), `test_looks_book.py` (Star Road part 5: the looks in My House + the Sticker Book), `test_speed.py` (point 9: small library files, every page opens in time, still menus + paused games aren't busy), `test_frames.py` (point 9 part 2: lite drawing after a few slow seconds, no glows while lite, `draw.layer`, every game's drawing within a budget), `test_hoops.py` (the ball after a shot: through the net, falls, bounces, rolls; never jumps or leaves the cage), `test_coloring.py` (every coloring page: shapes, edges, tap-to-fill, tools, old saves), `test_claw.py` (Claw Catch: grabbing, slips, the lucky claw, one thumb, the Prize Shelf, prizes in My House). Run them all before pushing; screenshots land in `tests/out/`.
- **Sticker Book**: `arcade/stickers.js` (loaded after shared.js on every page) lists all 72 stickers (4 per game, 4 arcade, 8 surprise), draws them and
  works out which ones a player has from their saves (`Arcade.stickers.check()` runs after every finish/trophy).
  The book page is `stickers/`. Every new game must be added to its GAMES list (4 stickers each).
- **Daily Surprise**: `arcade/daily.js` (loaded after stickers.js on every page) picks one challenge a day from the date
  (big kids: win / 3 stars / collect / play 3 games; little kids: gentler ones). The kit's `finish()` reports every round;
  counting challenges need `Arcade.daily.add(game, 'coins'|'fish', n)` in the game; maze + coloring call `Arcade.daily.report()`.
  Done = 2 house coins (`houseBonus`) + the next of 8 Surprise stickers. On the canvas hub (Keith, Nov 21: no big row) today's game tile
  has a bouncing present (tile `badge`, canvasmenu.js) and the bar's present `daily` opens screen `hub-daily` (`dailyScreen()` in index.html);
  `renderDaily()` is the HTML fallback.
  Tests pretend a day with localStorage `kidsArcade.testDay` (`tests/test_daily.py`).
- **Friends (several phones)**: `server/` is a Cloudflare Worker (one Durable Object per room, relays JSON
  messages, stores nothing; see `server/README.md`). `arcade/net.js` is the client: 3-picture room codes, picker,
  `Arcade.net.join(code)`. Its `SERVER` is Keith's deployed switchboard (wss://kids-arcade.lavalynk.workers.dev); redeploy with `cd server; npx wrangler deploy`.
  RC has a Friends race (`mode === 'friends'`, levels `fr-<track>`; items that reach other cars are sent with `tell()`
  and handled in `friendItem()`: each phone only ever changes its own car). Test: `tests/test_friends.py` (runs a local switchboard).
  Other kit games use the shared lobby `Arcade.net.party.menu(g, { choices, onStart, onBack })` and set `config.friends(g)`
  (the title menu then shows a Friends picture button). Hoops (`fr-s30`/`fr-s60`, `{t:'score'}`), Bike (`fr-<track>`,
  positions as `{t:'move'}`, own lane per seat) and Bubble School (`fr-<topic>`, pick = `topic~seed` so every phone gets the
  same questions; first right answer sends `{t:'move', q}` and everyone moves on) and Fishing (`fr-<place>`, 90 s, every catch
  sends `{t:'score', sp, cm, n}` = my best fish; rarest fish wins, then biggest) and Archery (`fr-<place>`, taking turns, 5 arrows each; the shooter sends `{t:'move', a, p, c}`
  = angle, power, level clock and every phone fires the same arrow; `{t:'score', s}` after it lands) do this. A game page needs `arcade/net.js` in its `<script>` list.
- **Hub reload** (Nov 23, Keith: "it opens, then reloads"): on `controllerchange` the hub only reloads when its own `?v=` (shared.js's address) differs from `VERSION` in sw.js (fetched fresh), i.e. when the page on screen really is old.
- **App + offline**: `manifest.webmanifest` (full screen, icons in `icons/`) and `sw.js` (service worker: saves every
  file on the device, works offline; Nov 21: pages are network-first (3 s, then the saved copy) so a new version shows at once; scripts/styles are cached as `file?v=<VERSION>` (VERSION = the ?v= from bump_version.py), exact match first, any version only when offline). `tools/bump_version.py` also runs `tools/make_offline.py`, which writes
  the file list + a new VERSION into `sw.js`, so a pushed update reaches installed phones. New pages/folders get picked up
  automatically (`*/index.html`, `*/*.js`, `*/*.css`); anything else a page needs must be added in `make_offline.py`.
  Test: `tests/test_offline.py`.
- **Jukebox** (Nov 21, late night): `jukebox/` (hub bar button `juke`). `jukebox/songs.js` = every song recipe copied out of the
  games by `tools/make_jukebox.py` (bump_version.py runs it; never edit songs.js by hand; `test_jukebox` checks it's fresh; a game's
  new song file must be added to its `GAMES` list). One canvas screen `jukebox`: top = the stage (a `live` row `stage`: the player's
  avatar dances to `beatNow()`, bars from an AnalyserNode on `musicGain`) + pads `pad-boom/clap/ding/tada` (played on the next 16th,
  `onBeat()`); mix buttons `mix-slow/fast/high/party/water` (= `Arcade.audio.setMood`; sideways they're in the round footer with
  `home` / `stop` / `dice`, upright a tiles row); song tiles `song-<game>-<n>`. It overrides `applyVolumes` so a player's music-off
  switch doesn't silence it (muted still does). Hooks `__jukebox()`, `__jukeboxPad(kind)` (returns the play time). Test: `tests/test_jukebox.py`.
- **My House**: `house/` (room drawings + shop in `house/house.js`). Since Nov 21 it's ONE canvas screen `house` ("The canvas page"
  section in house.js; the HTML is only the fallback): `top` = tiles `home`, `room-<id>`, `friends`, `coins` + the room (a `live` row
  `room`, our own canvas `rcv`, drawn layer by layer from `roomLayers()`: each layer an SVG image cut to its size (`layerPic`, via
  `ArcadeMenus.svgURL`), so drags / hops / the "try" wiggle just move a picture; `layerAt()` = the top-most layer with a colored pixel
  under the finger); spot tiles `spot-<id>`, shop tiles `none` / `item-<id>` / `back`. Friends screens `house-friends`, `house-join`,
  `house-room` (tiles `visit-<seat>`, buttons `leave` / `close`); visiting adds tiles `friend` / `gohome`. Hooks: `__houseState()`
  (`screen`, `layers`, `loaded`, `dragging`, `away`, `hopping`), `__houseSVG()` (the open room as one SVG). Coins = 3 + trophies in all games + `houseBonus` - spent, saved as `house`.
  4 rooms (`ROOMS`: bedroom `SPOTS`, `GARDEN`, `GARAGE`, `ART`; spot ids differ per room: `bed`, `g-tree`, `c-door`, `a-frame`), one `placed` map,
  `pos[spot] = [dx, dy]` for things dragged elsewhere (also `me:<room>` and `car`); dropping a thing on the toy box or off the room's edge puts it away (`putAway()`, `placed[spot] = ''`). The garage car is a picture RC saves
  (`games.rc.data.garagePic`, see `rememberCar()` in rc.js). Friends can visit (arcade/net.js); the switchboard only passes
  1 KB messages, so a house goes as `hm` + one `hr` per room + the car in `car` slices. Test: `tests/test_house.py`.
  Games can add house coins with `Arcade.store.load().houseBonus++` (Turbo Bike: 1 per 25 track coins).
- **Mini RC Racers extras** (`rc/rc.js`, Nov 15): the main menu has 10 tiles, 5 x 2 (`rc-modes5`; Heart Battle added Nov 19,
  Coin Rush + Follow Nov 20). **Ghost Race** = the Daily Ghost Race
  (`mode === 'daily'`, levels `dg-<track>`): `dailyTrack(g)` picks the track from the date (same clock as the Daily Surprise,
  so tests use `kidsArcade.testDay`), 2 laps against Boo, a see-through ghost car. `makeBoo()` works out his whole race at
  the start (centerline, speed from `vlim`, `BOO_PACE` big/little, `BOO_TUNE` per track) and `booAt(t)` plays it back.
  First win of the day: `booWins++` + 1 house coin. 10 wins unlock the **secret Ghost Car** (Keith, Nov 15: `STYLES` entry with
  `secret: true` = no tile or hint until won; perk `phase` = passes through cars, oil, puddles, honey, bubbles, movers, creeks,
  and gift boxes (so no items); always maxed engine + tires; never given to rivals, see `RIVAL_STYLES`). **Trophies** = the shelf (`shelfMenu`, `trophySVG`): 4 big trophies +
  1 per track, all worked out from the saves. Test: `tests/test_rc_ghost.py`.
  **Build** (Nov 16) = the Track Builder in `rc/builder.js` (loaded before rc.js; rc.js makes it with `builder()` and hands it
  THEMES, spline, makePath...). 3 tracks per player in `data.myTracks` (`{pts, theme, bridge, L}`, dots on a 6000 x 3820 board).
  `check(pts)` = the road may not come too close to itself or bend too tightly (red rings, Race says no); ONE clean
  crossing becomes a bridge. `def(g, slot)` turns a slot into a TRACKS-like def (`custom: true`, id changes with the shape);
  levels `my-<slot>` (Race, mode 'free') and `myd-<slot>` (Drive). Home-made wins don't count for paints/trophies.
  Nov 19: modes in the builder (`mode`: road / things / look; the row under the board changes). A track can have
  `things: [{k, f, lat}]` (`THINGS`: gift, boost, ramp, bumper, oil, puddle, critter; max 16; no list = the race places
  things itself; the first tap in Things mode starts from those) applied by `applyThings()` in rc.js; plus `laps`,
  `weather`, `hw` (`WIDTHS` 76/96/124; `check(pts, hw)`). `defFrom(t, slot)`; Friends: the host's slots are lobby tiles
  `fr-my<slot>`, the track goes in the start message as `mt` (`pack()` / `unpack()`, ids `mf-...`, `sharedTrack` in rc.js).
  Test hook `__rcBuild.state()`. Test: `tests/test_rc_build.py`.
  **Heart Battle** (Nov 19, Keith: a battle royale with hearts, NOT Mario Kart balloons) = `mode === 'battle'`, levels `hb-<arena>`
  (`ARENAS`: yard / snow / candy). The arena is a "track" whose centerline is a small circle with a huge `hw`, so the road is
  one disc and `drawWorld` just works (no start line). Everything else is in the "Heart Battle" section above `update()`:
  `battleStart()` (4 cars round the middle, `BATTLE` numbers, `BATTLE_ODDS`, only `BATTLE_PERKS` keep their power),
  `battleTick()` (its own loop after the countdown), `hurt()` / `knockOut()` (blinking = `c.ghost`), `battleAI()`,
  `battleBubbles()`, `battleItem()` (bubble / honey / popper), `battleBump()` (called from `collide()`: a boosting car
  knocks a heart off), the shrinking `ring`, `bumpers`, `heartPick`. Results = `battleOrder()` + `raceHTML`. First win per
  arena = 1 house coin. Test hooks `__rcState().battle`, `__rcBattle`. Test: `tests/test_rc_battle.py`.
  **Coin Rush + Follow the Leader** (Nov 20): the section of that name above `update()`. Coin Rush = `mode === 'rush'`, levels
  `cr-<track>`: `rushStart()` lays out `rush.coins` (kind coin / big / clock), `rushTick()` picks up + runs the clock,
  `RUSH_GOLD` per track (silver 60%, bronze 30%; little kids 90 s, x1.5), `data.rushBest`, first gold per track = 1 house coin.
  Follow the Leader = `mode === 'follow'`, levels `fl-<track>`: Pip is a planned drive (`planRun()`, shared with Boo; `planAt()`)
  with his own clock `lead.t` that slows when you're far behind (`FOLLOW.wait`, at most `patience` s), drops notes, 2 laps;
  `followStars()` from the part of the notes caught; `data.followBest`. Both: just you, sunny, no gift boxes, laps 99, never a
  race win. Track picker `playMenu(g, kind)`. Test hooks `__rcState().rush/.follow`, `__rcRush()`, `__rcFollow`; with `__rcAuto`
  the player follows Pip (`followPilot`). Test: `tests/test_rc_modes.py`.
  **Drifting + the finish-line party** (Nov 21, RC plan #3): `DRIFT` + `driftTick()` (after `drive()`; only YOUR car, called from
  both manual-control branches: races and Heart Battle): a full fast turn for `DRIFT.wait` s starts a drift (`c.drift.on`: less grip,
  a tighter turn, the car picture yaws), sparks level up at `DRIFT.lv`, letting go gives `DRIFT.boost[lv-1]`. `partyTick()` /
  `drawParty()` (above `collide()`): crossing the line 1st-3rd in free / cup / daily / friends = fireworks; 1st also donuts (the
  finished-player ctl), camera zoom, happy rivals, `endTimer` 3.2. `podiumSVG()` is bigger with bunting / confetti / a crown, and race
  results pass `starsRow: false` (a kit result option: the stars still count, no stars row). Hooks `__rcState().drift` / `.party`.
  Test: `tests/test_rc_feel.py`.
  **Living backgrounds** (Nov 22, new plan point 2, part 5): the "Living backgrounds" section above `drawWorld()`: `groundTile(id)`
  paints a `TILE` (320) texture once per theme (things near an edge are drawn again across it with `wrap()` so it joins up),
  `drawGround()` fills the view with it as a pattern (beach + sky patterns slide); `drawCloudShadows()` (one blob picture),
  `drawTimeWash()` (a track's `time`: t4 sunset, t5 dawn, t9 evening, `TIMES`), `drawFloaters()` (`FLOATERS` per theme, screen
  space); `drawDecor()` reads `scNow` (lava bubbles + smoke, swim rings, balloons, flowers). Everything uses `scT(g)` (0 in Calm
  motion; floaters hide). Hook `__rcScene` (tracks / time / tiles / draw(ctx, t, noTime)), preview `tools/preview_rc_scenery.py`,
  test `tests/test_rc_scenery.py`.
  **Cooler items + obstacles** (Nov 19, later): `snowball` (Giant Snowball, rolls + grows), `boomerang` (loops out and back),
  `blaster` (Triple Bubble = 3 `bubble`s via `quietItem`) in `ITEM_ODDS` / `BATTLE_ODDS` (each race row adds up to 100; Friends
  races turn them into bubbles: `SHOT_ITEMS`). Snowballs + boomerangs are `shots` (`throwShot`, `updateShots`, `shotHit`:
  race = wobble/spin, battle = a heart). `TRACK_BUMPERS` puts bouncy bumpers (the arena ones, `bounceBumpers`, `drawBumper`)
  on t2/t4/t6/t7/t10 at lat +-0.5 hw; the AI dodges them like hazards; they pop bubbles. Every theme has a mover now
  (`MOVER` map; `moveMover` + `drawMover`). Test: `tests/test_rc_extras.py`.
  **Item Book + specials** (Nov 19, Keith): `itemBook(g)` (Items button in the main menu's bottom row) shows `BOOK_ITEMS` (24)
  + `SPECIALS` (6: mega / freeze / fireworks / dragon / swap / disco, each with `need` + `ok(g)`); `data.itemsSeen` counts YOUR items (`sawItem()` in
  `giveItem()`), `data.specials` = unlocked ones (`checkSpecials()` toasts). `maybeSpecial()` swaps 6% of your gifts for an
  unlocked special (never rivals; Friends only Mega Car). Effects: `c.mega` (bigger, heavier, safe), `c.frozen` (slow +
  slippery), firework `shots` (one per car, `target`).
  The 12 newer items (Keith: "30 items total") are all in `newItem()`: things on the ground (pogo pad, bubble trap, glitter,
  balloon splash) are `traps` (`updateTraps` / `drawTraps`, races + battle); balloon / bee / whirl / dragon are `shots`;
  `c.grippy` (Monster Wheels), `c.trioLeft` (Turbo Trio), `c.disco`. Old odds were scaled x0.75 to make room (`NEW_ODDS`).
  Test hooks `__rcItems.roll(n, rival)`, `__rcExtras.traps()`. Test: `tests/test_rc_items.py`.
- **Jungle Jump** (`jungle/jungle.js`) runs on **Phaser 3** (Keith, Nov 20; `arcade/phaser.min.js`, 3.80.1, MIT) and its menus are
  canvas menus (`canvasMenus: true`, `extraRows` = the hero picker). Phaser runs HEADLESS: it is only the world engine (Arcade Physics
  bodies for the ground, boulders, thin platforms, moving platforms, critters, the hero, and overlap sensors for goodies, chests,
  lanterns, springs, thorns and the balloon: "THE PHASER ENGINE" section, `bootPhaser()`, `buildPhaser(world)`, `stepWorld()`).
  The kit still does menus, music, saves and the game loop: every kit step = one `world.singleStep()` (fps 120, `forceX`),
  and Phaser's own loop is stopped and its scene asleep (otherwise the world moves twice per step!). The hero's feel stays ours
  (`stepHero()` / `runJumpGlide()` set the speed, Phaser moves), and all drawing stays our hand-drawn canvas art (crisp, no blur).
  The test robot still plans with the old pretend physics (`stepPlayer`, same rules; `__jungleTest.steps(n, inp)` runs real steps
  to compare). 8 levels = 4 worlds x 2 (Nov 16: Treetop Trail, Glow Cave, Windy Peak, Jelly Hills).
  **Living backgrounds** (Nov 22, plan point 2): a level's `time` ('evening' / 'dawn' / 'twilight', `TIMES`) changes the sky,
  clouds and washes the painted strips (`layer()` caches one per time); `drawFloaters()` (leaves / fireflies / glow dots / snow /
  bubbles) and twilight `drawStars()`; `sceneClock()` stands still in Calm motion and floaters hide. `SC` = the scene being drawn.
  Hook `__jungleScene` (draw / levels / cached / canvas), preview `tools/preview_jungle_scenery.py`, test `tests/test_living_scenery.py`.
  Characters (Nov 22 redraw): `drawHero()` (big head `HX/HY` on a small body `BY`, per-animal parts) and `drawCritter(ctx, cr, t, kind)`
  (ladybug / firefly / snow puff / gumdrop, one per world); `window.__jungleArt` + `tools/preview_jungle.py` show them all.
  Maps are text (one letter per tile; `L` leafy treetop, `t` trunk (picture only), `u` wind: hold jump to rise).
  Finishing a world's 1st level unlocks its 2nd level and the next world. The kit picks a level's difficulty from its
  position in the level list, so think before reordering. Never rename a level id (saves). Test hooks: `__jungleState()`,
  `__jungleBot(on, fast, route)` (a greedy robot; `ROUTES` in `tests/test_jungle.py` must follow map edits).
  In tests go through the menu before pressing Space (the title screen listens for it).
- **Parent corner** (Nov 16): `arcade/parent.js` (loaded after daily.js on EVERY page; a new page needs the script tag) counts
  play time per player / game / day in localStorage `kidsArcade.parent` (`{limit, extra, bed, late, time, gfx, slow, motion}`, 14 days kept),
  shows the "All done for today!" wall when a player's daily limit is used up (pauses the kit game, eats keys; a grown-up
  holds 3 s for 15 more minutes) and offers `Arcade.parent.holdButton(label, onDone)`. The page is `parent/` (`parent/parent.js`;
  reading is fine there, it's for grown-ups): the hub's Grown-ups button sets sessionStorage `kidsArcade.parentOK`, otherwise
  the page shows its own hold button first. `REPORT_EMAIL` (top of parent.js) is empty on purpose until Keith picks an address.
  **Bedtime** (Nov 22): `bed[player]` = minutes after midnight (1170 = 7:30 pm), until `WAKE` (6 am); `isBedtime()`, `bedtime()`
  (+ tonight's `late` = `{night, min}`, `stayUp()` gives 15 min from now), `night()` (before 6 am = yesterday). The wall then is
  `[data-bedtime]` (sleepy star) instead of `[data-timeup]`; Parent corner buttons `bed-<min>` / `late`. Tests pretend a time
  with localStorage `kidsArcade.testTime` = '19:45'.
  Tests drive the clock with `Arcade.parent._tick()` / `.add(sec, game, player)`. Test: `tests/test_parent.py`.
  The page is a canvas menu (Nov 21, "The canvas page" in parent/parent.js; the HTML cards are only the fallback): screen
  `parent-door` (button `hold`: a canvas HOLD button, `{ hold: 3000 }` in a buttons row, `ArcadeMenus.holding` = how full) and
  `parent` (top = round tabs `kid-<id>` / `device` / `help`; kid rows: chips, two SVG charts (`weekSVG`, `gamesSVG`), buttons
  `limit-<min>`, `more`, `music`, slider `musicvol`; device: `mute`, slider `sfx`, `gfx-auto/fast/sharp`; help: `report`, `clear`
  (tap twice); footer `home`). Hooks `__parentView(id)` (what a kid's tab shows), `__parentReport()` (the mailto link).
  `tests/cmenu.py` `tap_shown(pg, attr)` scrolls the menu with the mouse wheel until the thing is in sight, then taps it.
- **Lite drawing** (Nov 16, in the kit's `start()`): slow frames for a while -> the canvas is drawn with fewer pixels
  (`lite` 1, then 2) + fewer particles, and `Arcade.parent.markSlow()` remembers it. The Parent corner's Drawing quality
  (`gfx`: auto / fast / sharp) overrides. `g.lite()` / `g.setLite(n)` for tests. Games need do nothing.
- **Turbo Bike tracks** (`bike/bike.js`, Nov 17): 10 `TRACKS`, each a list of `PIECES` names + a `theme` (`THEMES`) + `par`
  + `diff` (the game's `levelDifficulty`, so adding a track never changes the old ones; never change an id). The 5 newer
  places each have a `special`: `splash` (water across the track), `jelly` (bounce pads, always land fine), `lights`
  (theme `dark`: `drawNight()` cuts lamp + headlight holes in a dark layer), `loop` (`rideLoop()` takes the bike round by
  itself, also the computer riders), `lift` (moving ramps, height x `liftK()` on the race clock). Test: `tests/test_bike_tracks.py`.
  **Living backgrounds** (Nov 22, new plan point 2): the "Living backgrounds" section above `drawBg()`: `PAINT[theme].far/mid/near`
  paint 3 strips (`STRIPS`: top y + parallax speed + haze) ONCE into hidden canvases (`sceneFor()` / `paintScene()`, repainted only
  when the place, time or sharpness changes); each strip is `LOOP` (1440) wide and must join up with itself (use `ridge()` /
  `peaks()` / `mesas()` and `wrap(x, fn)` for things near an edge; the test checks the seam). Live and cheap: `drawClouds()`,
  `drawFloaters()` (`FLOATERS` per theme, worked out from the clock), `drawSmoke()`. A track's `time` ('evening' / 'dawn', `TIMES`)
  changes the sky + tints the strips. Calm motion: the scenery clock stops and floaters hide. Hook `__bikeScene` (draw / info /
  time / canvases); preview `tools/preview_bike_scenery.py`; test `tests/test_bike_scenery.py`.
  **Cups** (Nov 18): `CUPS` (`mini` = t1, t2, t7; `big` = all 10, open after one Mini Cup). The cup tiles at the end of `levels()`
  are made by `cupRace(g, key)` = the NEXT race's track with `id: key, cup: key, track, raceNo` (so the kit keeps one record per cup).
  Progress in `data.cups[key]` (`{active, race, points, last}`), `cupFinish()` gives `CUP_POINTS` and shows the table / podium.
  `data.cupsDone`, `cupBest`, `cupWins` (first win = house coins). Test: `tests/test_bike_cup.py`.
  **Bike Shop** (Nov 19): title-menu button (`menuExtras`) -> `openShop(g)`. `shopData(g)` = `data.wallet` (every track coin;
  old saves start at `coinsAll`), `data.up` ({engine, cool, tires}: 0-3, `UPGRADES`), `data.look` ({paint, flames, sticker}),
  `data.owned`. `myBike(g)` = picked bike + upgrades + looks (that's `bikeDef` in a race); `drawBike` opts `flames`, `sticker`
  (`drawSticker()`). Test: `tests/test_bike_shop.py`.
  **Builder** (Nov 21, night, plan #8): screen `build`: top buttons `add` / `remove` / `dice` (`diceTrack()`), a `cols` row =
  the track's boxes `piece-<i>` (picked = the box a piece goes in) + every piece `put-<name>` (`BUILD_PIECES`), places `theme-*`,
  `race`. 4-12 boxes (`MIN_BOXES` / `MAX_BOXES`), saved in `data.custom` on every change. Piece `boost` / `boost2` = boost pads
  (`boostAt()`, `b.zoom`; AIs too). Friends: the room maker's track is the lobby choice `my~<theme>~<letters>` (`packTrack()` /
  `unpackTrack()`; letters = places in `PIECE_KEYS` = `Object.keys(PIECES)`: only ever add pieces at the END), level `fr-my`.
  Hooks `__bikeBuild` (pack / unpack / dice / set), `__bikeState().level/.pieces/.theme`. Test: `tests/test_bike_build.py`.
  **Daily Ghost Race** (Nov 21, plan #9): "The Daily Ghost Race" section after the cups. `ghostTrack(little)` = the track from the
  date (same clock as the Daily Surprise: `kidsArcade.testDay`; big kids all 10 jumping 3 a day, little kids `LITTLE_GHOST`), level
  `ghostLevel(g)` = `dg-<track>` (`daily: true`, `noStart`, section 'Ghost Race', also the title menu's Ghost button `ghost`).
  Wisp = a computer rider (`stepRider()`, shared with Zip / Moxie / Bolt, no rubber band) whose whole ride `planWisp()` works out
  at the start (`simRider(skill)`, searched until he finishes at par x `GHOST_PACE`); `wispAt(t)` plays it back, `drawWisp()`
  (drawBike opt `ghost`). `ghostFinish()`: `data.ghostDay` / `ghostWins` / `ghostDays` (newest 30), first win a day = 1 house
  coin, trophies `ghost` + secret `ghostweek`; results = `ghostResultSVG()` (row kind 'ghost'). Hooks `__bikeGhost`
  (track / sim / play), `__bikeState().wisp`. Test: `tests/test_bike_ghost.py`.
- **Treasure Trail** (`trail/trail.js`): `ADVENTURES` (rooms left to right) + `THEMES`; each room's still art is painted once
  (`buildArt()`: `cvFar` / `cvMid` / `cvGround`). **Living backgrounds** (Nov 22): "Living backgrounds" section above `drawBackground()`:
  `drawFloaters()` per theme (river butterflies + leaves, deep leaves + mist, temple dust; dusk fireflies), `drawBeams()` (temple),
  `drawSkyBits()` (stars); Sunset Swamp gets later room by room (`duskK()` = room / last room, `NIGHT` colors). Calm motion: clock
  stands still, no floaters. Hook `__trailScene.draw(ctx, adv, room, t, n, bgOnly)`, preview `tools/preview_trail_scenery.py`.
  **Rainbow Falls + Mushroom Hollow** (Nov 24, plan point 7): adventures `falls` / `shroom` (after `dusk`; themes with `falls: true` =
  rainbow + cliffs with waterfalls (`FALLS`, streaks in `drawFloaters()` use `farOff`) / `shrooms: true` = `bigShroom()` instead of tree
  trunks, glowing spores). Two new room types: `raft` (`R.rafts`, `raftAt(r, t)` = {x, vx, dock -1/0/1}, a pure function of time like
  the hippos: waits `diff.raftWait` at each bank, floats at `diff.raftSpeed`; `raftUnder()`, `groundAt()` counts it; standing on it
  carries you; the "fence" clamps you onto it while an end isn't touching a bank; one thumb waits for `dock === -1` and ignores taps
  there) and `bounce` (`R.shrooms`, caps at `SHROOM_TOP`, `shroomAt()`, landing = `BOUNCE_V` up, `m.boing`; `jumpGood()` counts a cap
  as a landing). Trophies `raft`, `bounce`, `rainbow`. Hooks `__trailTest.raftAt/onRaft/boings`. Test `tests/test_trail_new.py`.
- **Archery living backgrounds** (Nov 22, plan point 2): "Living backgrounds" section in archery.js: `paintScene()` paints
  `sky` / `far` / `land` once per place + time + hills + sharpness (`sceneFor()`, `scenes`); live bits between them (`drawSails`,
  `drawBoat`, `drawWaves`, `drawBirds`, `drawSmoke`, swaying `tree` / `palm`, nodding `flower`) and `drawAir()` floaters are worked
  out from `scT()` (= 0 in Calm motion; floaters hide). Level `time`: `TIMES` evening / sunset / dawn (l3, l6, l8). Hook
  `__archeryScene` (draw / levels / cached / level(id)), preview `tools/preview_archery_scenery.py`, test `tests/test_living_scenery.py`.
  **Autumn Woods** (Nov 24, plan point 7): the 4th place (`THEMES.autumn`, levels l10-l12 + `fr-autumn`; `leaf()`, `pumpkin()`,
  `barn()`, `autumnTree()`, falling leaves in `drawAir()`). Ring targets can `swing: {top, len, amp, speed}` (a pendulum in
  `posOf()`, drawn by `drawSwing()`, no post under it in `probe()`). Every level has `diff` (`config.levelDifficulty`), so new
  levels never shift the old ones' difficulty.
- **Hoop Heroes challenge courts** (Nov 24, plan point 7): `LEVELS` c1-c4 have `court` ('gold' every 3rd ball = 5 points,
  `goldNow()`; 'updown' = `rimAt(t)` sets `RIM_H` (now a `let`, `BASE_RIM` 2.3); 'zoom' = `hoopZAt(t)`, far than `ZOOM_3` = 3 points,
  `threeNow()`, no bonus; 'hot' = starts on fire, fire baskets 3, relights at 2 in a row), `section: 'Challenges'` (rivals get
  'Rivals' in `levels()`; `config.levelTabs`), no rival (`solo()`), stars from `L.stars` (Easy x0.8). Each court opens after a star
  on the one before. `aimFor(t0)` = the perfect pull + aim at where the hoop WILL be (shoot's assist, demo, kid). Every level has
  `diff` (`config.levelDifficulty`). Trophies `golden`, `courts`; ball `disco`. Hooks `__hoopsCourt()`, `__hoopsAimAhead()`
  (`__hoopsAimNow()` still aims at the hoop as it is now). Test `tests/test_hoops_courts.py`.
- **Hoops + golf living backgrounds** (Nov 22, plan point 2, part 4): each game's "Living backgrounds" section. Hoops: a level's
  `sky` (NOT `time`: that's the clock's seconds) = day / sunset / evening / night (`TIMES`), the two windows (`windowRects()`), the hall
  painted once into `back` + `front` (`hallFor()` / `paintHall()`), live `drawWindowSky()` + `drawShow()` (spotlights; level `show`
  'finals' = confetti, 'disco'); the neighbors' veil starts at y 140. Golf: a hole's `time` (h8/b8 sunset, h9/b9 evening), `sceneInfo()`,
  `sceneBase()` (ground + still deco painted once; flowers + palms are live), `drawScenery()` (under the course), `drawAir()` (cloud
  shadows, butterflies / bird shadows / gulls, the time wash, fireflies; over the course, under the score). Both use `scT()` (0 in Calm
  motion). Hooks `__hoopsScene` (levels / draw / cached / level(id)), `__golfScene` (levels / draw / cached); previews
  `tools/preview_hoops_scenery.py`, `tools/preview_golf_scenery.py`; test `tests/test_living_scenery.py`.
- **Claw Catch** (`claw/`, Nov 26, Keith live: "Create a claw game"; he picked prizes for a shelf + My House, and kid-fair
  grabbing): `claw/prizes.js` (`window.ClawPrizes`: `MACHINES` (4: toys / sea / sweets / space = the levels), `LIST` = 24 plush toys as
  SVG (100 x 100, body circle r 34 at 50,56; 5 + 1 `rare` golden one per machine), `svg(id, gray)`, `won(save)`) is loaded by the game AND
  My House. `claw/claw.js`: the pile = balls with simple physics (`physics()`, `fillPile()` settles 13 toys at setup, `refill()` drops a new
  one after each prize); the claw's `phase`: aim -> down -> close -> up -> carry -> release -> home (-> `nextTry()` / `finishRound()`).
  How it holds only depends on how near the MIDDLE of the toy it comes down (`HOLD`: firm / wobble / slips via `slipAt`); `LUCKY_AFTER`
  misses in a row = the golden lucky claw (holds anything). Easy + little kids: a still claw eases onto the toy under it; one thumb:
  the claw slides by itself (`S.auto`), Drop only. The big red button is drawn on the machine (`BTN`, tappable) + the kit's pad.
  Levels' difficulty: `levelDifficulty` (toys Easy, sea + sweets Normal, space Challenge). Saved: `data.got = { toyId: n }`, `data.total`.
  Prize Shelf = screen `shelf` (title menu button `shelf`, tiles `prize-<id>`). My House: the bedroom's `toy` spot also has items `prize-<id>`
  (`price: 0` + `prize`: never bought, only listed once won, `hasPrize()`; no prizes yet = a locked `prize-none` tile). Hooks `__clawState()`, `__clawTest`
  (`moveTo`, `drop`, `best`, `under`, `btn`, `shelf`). Test `tests/test_claw.py`.
- **Putt-Putt Park** (`golf/golf.js`, mini golf, Nov 13): the 9 holes are a list (`HOLES`: greens as corner lists, tee, cup, par, and
  bumpers / sand / water / slopes / spinner / slider / pipes). Nov 22: a 2nd course, **Seaside Cove** (`BEACH`: holes `b1`-`b9`, adds
  `crabs` (moving bumpers, `crabPos()`), `bridges` (rects where water doesn't count: `wet()`), `castles` (blocks drawn as sandcastles));
  `COURSES` (section + `look` colors + course tile id `course` / `course2`), `courseOf(id)`; the picker has `levelTabs` Park / Beach;
  the beach opens after park hole 3 (`beachOpen`). All ball movement is one function, `step()`; the aiming dots and the
  test bot run the same function on a pretend ball (`sim()`). Test hooks: `__golfState()`, `__golfShoot(angle, power)`, `__golfBot()`.
  A new daily challenge list must keep "never the same game two days in a row" (`tests/test_daily.py`; the list is walked 7 at a time).
- **Potion Quest** (`quest/`, Nov 13; Keith's "game like Golden Axe"): `quest/art.js` = every drawing, `quest/quest.js` = the rules.
  Nov 20: runs on **Phaser 3** like Jungle Jump ("THE PHASER ENGINE" in quest.js: headless Arcade Physics; the hero, baddies on
  the ground (one group that collides with itself) and pickups (overlap -> `pickUp()`) are zones; the rules still set where
  everyone wants to go and `stepWorld()` turns that into speeds, `world.singleStep()`, reads back) + canvas menus.
  Test hooks `__questTest.engine()/spots()/win()`.
  Lists at the top of quest.js: `HEROES` (knight / ranger / wizard), `FOES` (blob, mini, bigblob, hopper, roller, shroom, flutter, shell, rocky, king,
  snowpal, snowking; a foe with `boss: 'name'` is a boss: `isBoss()`, the boss bar, the intro words) and `STAGES` (waves = where the screen stops +
  who comes; jars; optional `win` = the results title). **Frosty Peak** (Nov 22, `s4`, theme `snow`): snowmen roll **snowballs** (`S.balls`,
  `throwBall()` / `updateBalls()` / `breakBall()`; a ball first `wait`s while `Art.snowLane()` shows its blue lane; bonks, sparks and spells break
  them, the bot steps out of lanes); the 2nd boss, the Frosty King (`snowking`: walks in, rolls volleys, slides away "Wheee!" when you're close,
  puffs out after 2 volleys, calls helpers twice, `f.balls` 3 -> 2 -> 1 = one snowball pops off every third). Hooks `__questState().balls /
  .bossType / .bossBalls`, `__questTest.hurtBoss(n)`. Walk by touching the ground, Space = bonk, X = magic (uses all potions).
  Out of hearts restarts at the same wave (`resume`); Next keeps the hero + potions (`carry`). Backgrounds are painted once
  into hidden canvases (`layers()` in art.js) because drawing them every frame was laggy: keep new scenery in those strips. Test hooks: `__questState()`, `__questPick(i)`, `__questBot(on, speed)`,
  `__questWave(n)`, `__questGive(n)`. Original characters only: never copy Golden Axe's names or looks.
- **Fishing Frenzy** (`fishing/`): `fishing.js` = rules + drawings (the still parts of each place are painted once into hidden
  canvases, `layers()`; the pond angler sits in a bobbing rowboat, `boatBob()`). `aquarium.js` (loaded first, `window.FishExtras`)
  = the "more to do" from Nov 13: shells per catch, the Shell Shop (`BAITS`, `DECOR`), My Aquarium (an animated canvas: tap a
  fish = its name, tap the water = food) and 8 `GOALS` per place (one at a time, a picture at the top while fishing). The game
  hands it `window.FishGame` (fish list, `drawFish`...). Test hooks: `__fishingState()`, `__fishingTest`, `__fishingBot(on)`
  (plays by itself), `__fishTank()`. **Moonlight Bay** (Nov 22, `LOCS.night`, `night: true`, need 14 kinds): night fish have `glow`
  (a soft halo in `drawFish()`), `extra: 'lantern'`; `drawNightSky()`, `drawJetty()`, hat `nightcap`; goals in aquarium.js `GOALS.night`. The title menu's extra picture buttons (Book, Tank, Shop) use the kit's `menuExtras`. Canvas menus (Nov 21): screen ids `book`, `shop`, `tank`; tile attrs `rod-*`, `bait-*`, `decor-*`, `goal-<place>-<i>`, `fish-*`.
- **Touch pad** (Nov 23, new plan point 4, part 1): the kit's on-screen buttons (`config.buttons`, shared.js "On-screen touch
  buttons"): left pad = moving, right pad = doing; `main: true` = the biggest button, last in the list (outside edge); `color` (default
  by key: `PAD_COLORS`) = a tint at rest, lit up + glowing while held (`.down`). The PAD takes the touches (buttons are
  `pointer-events: none`): `padAt()` finds the nearest button, a thumb can roll from one to the next, several fingers each hold
  their own (`padHeld`, `padCount`). Hook `__pads()` (keys + every button's spot / lit / color). Test: `tests/test_touch.py`.
- **One thumb** (Nov 23, new plan point 4, part 2): `Arcade.profiles.oneThumb(p)` = the player's `thumb` (true / false) or, when
  not set, little kids. Switch `thumb` in the hub's `hub-players`; Parent corner buttons `thumb-auto/one/all`. A game opts in with
  `config.oneThumb = { buttons, stack, howTo }` (a 2nd pad set, class `thumb`; `body.ar-thumb` shows it instead of the `full` set) and
  helps more while `g.oneThumb`: Turbo Bike (lanes only, Up over Down; rides itself, lands flat), Mini RC Racers (Left + Right; drives
  itself with the little-kid steering help, gifts go off by themselves: `thumbItem()`), Fishing (Cast only; `lureHelper()` finds the
  nearest fish, early taps never scare, green x1.2), and (Nov 23, part 3) Jungle Jump (Jump only: `thumbControl()` walks right,
  stops where `safeAt()` says no (gap / thorns) and in wind, auto-rolls into boulders + critters, rides a wind to the top then
  glides off when `glideSafe()` (a pretend glide) lands safely, `p.thumbBack` = walk back into a wind before a too-high wall),
  Treasure Trail (Jump only: `thumbWalk()` waits at ponds / snakes / quicksand, fetches the tunnel treasure; at a vine pond a tap
  waits for `willGrab()`, on the vine a tap lets go when `landsFar()`; both use the pretend `flight()`) and Potion Quest (Bonk
  only: `controls()` walks with `botControls()`' moves, its magic too; a finger on the ground / arrow keys still win). Every
  game with buttons has it now. `__pads().thumb`, pads have `kind` + `shown`. Test: `tests/test_one_thumb.py`.
- **Phones** get `html.ar-phone` (set in shared.js): every page keeps a 5% border (Keith: use 90% of the phone).
  Upright, the kit covers wide games with a big "turn me" picture while playing (`ar-turnshow`; the game waits);
  a small button plays upright anyway (on-screen buttons then stack 2 across).
- Title screens and title menus are pictures only (big Play button, round icon buttons): no reading needed.
- **Playtest robot** (Nov 23, plan point 5): `python3 tools/playtest.py [game] [runs] [big|little] [stage]` plays a game many
  times as a pretend child and prints a table (also `tests/out/playtest_<game>.json`). Golf: `__golfPlaytest(id, little, runs, seed)`
  (all pretend putts with `sim()`: `kidHole()`, `KID` wobble, `cupFor()`); Potion Quest: `__questBot('kid', speed)` (`kidControls()`),
  `__questState().waveBumps / .waveT / .king`; Jungle Jump: `__jungleBot('kid', fast, route, seed)` (`kidPlan()` = big kids, sloppy
  moves; `kidThumb()` = little kids' one-thumb taps fed into `thumbControl(g, fake)`), `__jungleState().ouches` (each fall / bump);
  Treasure Trail: `__trailBot(on, seed, fast)` (`kidPlay()`: walks with `thumbWalk()`, jumps a moment late), `__trailState().ouches`.
  Turbo Bike: `__bikeKid(on, seed)` + `__bikeStep(sec)` + `__bikeKidReport()` (`kidThink()` / `kidPad` in bike.js, `__bikeTrack(id)` = a
  level for `g.play`; `stats.where` = 'piece:tumble/hot/wobble', `T.spans`, `pieceAt(x)`); Mini RC Racers: `__rcKid(on, seed, idle)` + `__rcStep`
  + `__rcKidReport()` (`kidThink()` in rc.js; counts off-road / stuck seconds, `c.wallBumps`, `c.lifts`, mix-ups). Fixes from it (Nov 23): bike
  air tilt on Easy / Normal ignores a button held since take-off (`b.held`) and hands-off jumps never tumble (`b.handsOff`), heat warning
  (steam + beeps from 0.78), overheated = `putter` (>= 90 on hills), one thumb `b.autoTurbo`; RC one thumb / little kids steer for the middle
  of the road ahead (`aimAt()`) and ease off for bends up to 180 ahead, a wrong-way press near the edge loses to the helper, `c.lostT` lifts a
  car that's been out on the grass 4 s (3 little).
  Archery: `__archeryKid(on, seed)` + `__archeryStep` + `__archeryKidReport()` (`kidThink()` / `bestShot()`: tries lots of pulls with
  `simulate(..., frozen)` = things held still, how a child without the full guide aims); `lastPath` = the last flight as faint dots on
  Normal / Challenge. Hoops: `__hoopsKid` + `__hoopsStep` + `__hoopsKidReport()` (rival dice `rivalRnd()` while the robot plays, so rounds
  repeat); the aim help leads a sliding hoop (`flightTime()`, `hoopXAt()`); High Score `goals`. Space: `__spaceTest.kid(on, seed)` /
  `.kidReport()` (`kidThink()` / `dangerAt()` / `noticed()` above "Drawing" in space.js; `hitShip(g, why)` names what bumped the ship).
  Fishing (Nov 24): `__fishingKid(on, seed)` + `__fishingStep` + `__fishingKidReport()` (`kidThink()` above `FishGame`: the child
  only "presses" Space / Up / Down via `kid.space` / `kid.depth`; `nibBobs` counts the nibble bobs it reacts to); fixes: early taps
  forgiven per fish `g.pick(all, 2, 1)` (`hooked.forgave` is a count), `NEAR` = the pale-green edges that reel at half speed,
  Challenge Frenzy stars x0.9; `__fishingTest.nearGreen()`. Bubble School: `__abcKid` + `__abcStep` + `__abcKidReport()`
  (`kidThink()` / `KNOW` above "Drawing" in abc.js; `kr()` is mulberry32), `__abcLevel(id)`, `__abcTapAt(x, y)` (taps go through
  `tapAt()`); a tried wrong bubble (`b.tried`) is see-through and no new miss, `b.hint` = the glow after 2 (Easy) / 3 (Normal)
  wrong tries, stars = `starsFor(g)` from `wrongQs` (questions with a wrong try), bubbles with `grow <= 0.3` can't be tapped.
  Jungle one-thumb safety (Nov 23): `landSafe(dir, held)` steers in the air, `rollSafe()`, goodie `MAGNET`; memos use
  `Math.abs(clock - at)` (the clock restarts at 0 on a new go). Add a game to its `GAMES` when its part of point 5 is done.
- `tools/` holds the Python art converters (only needed by the dev runs, not the game).
- **Before every commit run `python3 tools/bump_version.py`** — it adds a fresh `?v=` to the
  script/CSS links so browsers load the new code instead of an old cached copy.
- Keep code simple and commented — Keith is learning from it.
