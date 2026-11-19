# Kids Game — instructions for the daily dev run

This repo is a **Kids Arcade**: 14 small web games for kids ages ~4–10 (the coloring
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
   (Keith, Nov 19: the **RC Racers plan** under Notes from Keith is next, before the Turbo Bike list. Heart Battle is done.)
   **The 10-point plan is finished (Nov 16).** Next: Notes from Keith first; otherwise the open items further down
   `ROADMAP.md` (the Turbo Bike plan is the biggest open list). Pick one solid chunk and say in the update what you picked.
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
(only the banana uses it; see `pages.css`, prefer rounded shapes). Useful shapes: a lens
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

- The hub (`index.html`) shows 14 cards: bike, rc, hoops, golf, archery, jungle, trail, quest, space,
  abc (Bubble School: counting, letters, math; reads questions aloud), coloring, maze, fishing,
  piano (Piano Star: 64 songs are text in `piano/songs.js`, e.g. `'E4q D4q C4h | ...'`; `clef: 'bass'` songs use the low piano C3-G4;
  6 two-hands songs (end of songs.js) add `left: '...'`, show two staves and use C3-B4, notes that start together are one step
  (`parts`); Free Play records 3 tunes per player in `save.data.tunes`; only public-domain songs). Each arcade game lives in its own folder and is built on the shared kit
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
  Nov 19 upgrade: 8 shapes, 7 `FRIENDS` (each has `need` = mazes finished before it can be picked), a 5th theme
  `cave` (`dark: true`: on Normal/Challenge for big kids an SVG mask hides the maze except where the lantern has been,
  `light()`), the "stuck?" sparkle (`resetIdle()`, 15 s / 9 s for little kids), and the **map** (`openMap()`: friend picker
  incl. dice = take turns (`saved.buddy`), the difficulty dots, one stone per maze up to `saved.top`; tap = replay).
  Test hooks `__mazeState()`, `__mazeTest.route/step`. Test: `tests/test_maze.py`.
- Coloring tools (fill, brush, eraser, stickers), undo/redo, auto-save and the gallery live
  in `coloring/coloring.js` (saved under `kidsColoring.v1`). Stickers are a list in `coloring/render.js`
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
- **Hub tabs**: each game in `GAMES` (top of `index.html`) has a `type` (`race` / `action` / `sports` / `calm`) that puts it under a picture tab.
- **Music**: songs are recipes with hand-written tunes (`tune: { A, B, C }`, `prog: [verse, chorus, bridge]`);
  see the comment above `songs:` in `arcade/shared.js` and the Music section of `arcade/README.md`.
  Games steer it with `g.music.mood({...})` and `g.music.stinger(name)`. Every new song needs a tune.
- **Space Defender** is three files: `space/data.js` (sectors, mini/big bosses, songs), `space/art.js`
  (every drawing: enemies, bosses, the Chimera, weapon icons) and `space/space.js` (rules, the 20 WEAPONS list,
  boss ATTACKS, the Chimera phases). `__game.play(SpaceData.SECTORS[i])` starts a sector in tests.
- Automated tests live in `tests/`: `test_players.py`, `test_hub.py`, `test_abc.py`, `test_tapguard.py`, `test_tunes.py`,
  `test_music.py` (~2 min), `test_rc_music.py`, `test_space.py` (~5 min), `test_age.py`, `test_piano.py`, `test_rc.py`, `test_rc_ghost.py`, `test_rc_build.py`, `test_rc_battle.py` (~2 min), `test_rc_extras.py`, `test_jungle.py` (~5 min), `test_parent.py`, `test_stickers.py`, `test_friends.py`, `test_offline.py`, `test_bike.py`, `test_bike_tracks.py` (~4 min), `test_bike_cup.py` (~2 min), `test_bike_shop.py`, `test_daily.py`, `test_house.py`, `test_golf.py`, `test_maze.py`, `test_quest.py` (~3 min), `test_fishing.py` (~2 min), `test_coloring.py` (every coloring page: shapes, edges, tap-to-fill, tools, old saves). Run them all before pushing; screenshots land in `tests/out/`.
- **Sticker Book**: `arcade/stickers.js` (loaded after shared.js on every page) lists all 68 stickers (4 per game, 4 arcade, 8 surprise), draws them and
  works out which ones a player has from their saves (`Arcade.stickers.check()` runs after every finish/trophy).
  The book page is `stickers/`. Every new game must be added to its GAMES list (4 stickers each).
- **Daily Surprise**: `arcade/daily.js` (loaded after stickers.js on every page) picks one challenge a day from the date
  (big kids: win / 3 stars / collect / play 3 games; little kids: gentler ones). The kit's `finish()` reports every round;
  counting challenges need `Arcade.daily.add(game, 'coins'|'fish', n)` in the game; maze + coloring call `Arcade.daily.report()`.
  Done = 2 house coins (`houseBonus`) + the next of 8 Surprise stickers. Hub box: `renderDaily()` in `index.html`.
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
- **App + offline**: `manifest.webmanifest` (full screen, icons in `icons/`) and `sw.js` (service worker: saves every
  file on the device, cache-first, works offline). `tools/bump_version.py` also runs `tools/make_offline.py`, which writes
  the file list + a new VERSION into `sw.js`, so a pushed update reaches installed phones. New pages/folders get picked up
  automatically (`*/index.html`, `*/*.js`, `*/*.css`); anything else a page needs must be added in `make_offline.py`.
  Test: `tests/test_offline.py`.
- **My House**: `house/` (room drawings + shop in `house/house.js`). Coins = 3 + trophies in all games + `houseBonus` - spent, saved as `house`.
  4 rooms (`ROOMS`: bedroom `SPOTS`, `GARDEN`, `GARAGE`, `ART`; spot ids differ per room: `bed`, `g-tree`, `c-door`, `a-frame`), one `placed` map,
  `pos[spot] = [dx, dy]` for things dragged elsewhere (also `me:<room>` and `car`); dropping a thing on the toy box or off the room's edge puts it away (`putAway()`, `placed[spot] = ''`). The garage car is a picture RC saves
  (`games.rc.data.garagePic`, see `rememberCar()` in rc.js). Friends can visit (arcade/net.js); the switchboard only passes
  1 KB messages, so a house goes as `hm` + one `hr` per room + the car in `car` slices. Test: `tests/test_house.py`.
  Games can add house coins with `Arcade.store.load().houseBonus++` (Turbo Bike: 1 per 25 track coins).
- **Mini RC Racers extras** (`rc/rc.js`, Nov 15): the main menu has 8 tiles (Heart Battle added Nov 19). **Ghost Race** = the Daily Ghost Race
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
  Test hook `__rcBuild.state()`. Test: `tests/test_rc_build.py`.
  **Heart Battle** (Nov 19, Keith: a battle royale with hearts, NOT Mario Kart balloons) = `mode === 'battle'`, levels `hb-<arena>`
  (`ARENAS`: yard / snow / candy). The arena is a "track" whose centerline is a small circle with a huge `hw`, so the road is
  one disc and `drawWorld` just works (no start line). Everything else is in the "Heart Battle" section above `update()`:
  `battleStart()` (4 cars round the middle, `BATTLE` numbers, `BATTLE_ODDS`, only `BATTLE_PERKS` keep their power),
  `battleTick()` (its own loop after the countdown), `hurt()` / `knockOut()` (blinking = `c.ghost`), `battleAI()`,
  `battleBubbles()`, `battleItem()` (bubble / honey / popper), `battleBump()` (called from `collide()`: a boosting car
  knocks a heart off), the shrinking `ring`, `bumpers`, `heartPick`. Results = `battleOrder()` + `raceHTML`. First win per
  arena = 1 house coin. Test hooks `__rcState().battle`, `__rcBattle`. Test: `tests/test_rc_battle.py`.
  **Cooler items + obstacles** (Nov 19, later): `snowball` (Giant Snowball, rolls + grows), `boomerang` (loops out and back),
  `blaster` (Triple Bubble = 3 `bubble`s via `quietItem`) in `ITEM_ODDS` / `BATTLE_ODDS` (each race row adds up to 100; Friends
  races turn them into bubbles: `SHOT_ITEMS`). Snowballs + boomerangs are `shots` (`throwShot`, `updateShots`, `shotHit`:
  race = wobble/spin, battle = a heart). `TRACK_BUMPERS` puts bouncy bumpers (the arena ones, `bounceBumpers`, `drawBumper`)
  on t2/t4/t6/t7/t10 at lat +-0.5 hw; the AI dodges them like hazards; they pop bubbles. Every theme has a mover now
  (`MOVER` map; `moveMover` + `drawMover`). Test: `tests/test_rc_extras.py`.
- **Jungle Jump** (`jungle/jungle.js`): 8 levels = 4 worlds x 2 (Nov 16: Treetop Trail, Glow Cave, Windy Peak, Jelly Hills).
  Maps are text (one letter per tile; `L` leafy treetop, `t` trunk (picture only), `u` wind: hold jump to rise).
  Finishing a world's 1st level unlocks its 2nd level and the next world. The kit picks a level's difficulty from its
  position in the level list, so think before reordering. Never rename a level id (saves). Test hooks: `__jungleState()`,
  `__jungleBot(on, fast, route)` (a greedy robot; `ROUTES` in `tests/test_jungle.py` must follow map edits).
  In tests go through the menu before pressing Space (the title screen listens for it).
- **Parent corner** (Nov 16): `arcade/parent.js` (loaded after daily.js on EVERY page; a new page needs the script tag) counts
  play time per player / game / day in localStorage `kidsArcade.parent` (`{limit, extra, time, gfx, slow}`, 14 days kept),
  shows the "All done for today!" wall when a player's daily limit is used up (pauses the kit game, eats keys; a grown-up
  holds 3 s for 15 more minutes) and offers `Arcade.parent.holdButton(label, onDone)`. The page is `parent/` (`parent/parent.js`;
  reading is fine there, it's for grown-ups): the hub's Grown-ups button sets sessionStorage `kidsArcade.parentOK`, otherwise
  the page shows its own hold button first. `REPORT_EMAIL` (top of parent.js) is empty on purpose until Keith picks an address.
  Tests drive the clock with `Arcade.parent._tick()` / `.add(sec, game, player)`. Test: `tests/test_parent.py`.
- **Lite drawing** (Nov 16, in the kit's `start()`): slow frames for a while -> the canvas is drawn with fewer pixels
  (`lite` 1, then 2) + fewer particles, and `Arcade.parent.markSlow()` remembers it. The Parent corner's Drawing quality
  (`gfx`: auto / fast / sharp) overrides. `g.lite()` / `g.setLite(n)` for tests. Games need do nothing.
- **Turbo Bike tracks** (`bike/bike.js`, Nov 17): 10 `TRACKS`, each a list of `PIECES` names + a `theme` (`THEMES`) + `par`
  + `diff` (the game's `levelDifficulty`, so adding a track never changes the old ones; never change an id). The 5 newer
  places each have a `special`: `splash` (water across the track), `jelly` (bounce pads, always land fine), `lights`
  (theme `dark`: `drawNight()` cuts lamp + headlight holes in a dark layer), `loop` (`rideLoop()` takes the bike round by
  itself, also the computer riders), `lift` (moving ramps, height x `liftK()` on the race clock). Test: `tests/test_bike_tracks.py`.
  **Cups** (Nov 18): `CUPS` (`mini` = t1, t2, t7; `big` = all 10, open after one Mini Cup). The cup tiles at the end of `levels()`
  are made by `cupRace(g, key)` = the NEXT race's track with `id: key, cup: key, track, raceNo` (so the kit keeps one record per cup).
  Progress in `data.cups[key]` (`{active, race, points, last}`), `cupFinish()` gives `CUP_POINTS` and shows the table / podium.
  `data.cupsDone`, `cupBest`, `cupWins` (first win = house coins). Test: `tests/test_bike_cup.py`.
  **Bike Shop** (Nov 19): title-menu button (`menuExtras`) -> `openShop(g)`. `shopData(g)` = `data.wallet` (every track coin;
  old saves start at `coinsAll`), `data.up` ({engine, cool, tires}: 0-3, `UPGRADES`), `data.look` ({paint, flames, sticker}),
  `data.owned`. `myBike(g)` = picked bike + upgrades + looks (that's `bikeDef` in a race); `drawBike` opts `flames`, `sticker`
  (`drawSticker()`). Test: `tests/test_bike_shop.py`.
- **Putt-Putt Park** (`golf/golf.js`, mini golf, Nov 13): the 9 holes are a list (`HOLES`: greens as corner lists, tee, cup, par, and
  bumpers / sand / water / slopes / spinner / slider / pipes). All ball movement is one function, `step()`; the aiming dots and the
  test bot run the same function on a pretend ball (`sim()`). Test hooks: `__golfState()`, `__golfShoot(angle, power)`, `__golfBot()`.
  A new daily challenge list must keep "never the same game two days in a row" (`tests/test_daily.py`; the list is walked 7 at a time).
- **Potion Quest** (`quest/`, Nov 13; Keith's "game like Golden Axe"): `quest/art.js` = every drawing, `quest/quest.js` = the rules.
  Lists at the top of quest.js: `HEROES` (knight / ranger / wizard), `FOES` (blob, mini, bigblob, hopper, roller, shroom, flutter, shell, rocky, king) and `STAGES`
  (waves = where the screen stops + who comes; jars). Walk by touching the ground, Space = bonk, X = magic (uses all potions).
  Out of hearts restarts at the same wave (`resume`); Next keeps the hero + potions (`carry`). Backgrounds are painted once
  into hidden canvases (`layers()` in art.js) because drawing them every frame was laggy: keep new scenery in those strips. Test hooks: `__questState()`, `__questPick(i)`, `__questBot(on, speed)`,
  `__questWave(n)`, `__questGive(n)`. Original characters only: never copy Golden Axe's names or looks.
- **Fishing Frenzy** (`fishing/`): `fishing.js` = rules + drawings (the still parts of each place are painted once into hidden
  canvases, `layers()`; the pond angler sits in a bobbing rowboat, `boatBob()`). `aquarium.js` (loaded first, `window.FishExtras`)
  = the "more to do" from Nov 13: shells per catch, the Shell Shop (`BAITS`, `DECOR`), My Aquarium (an animated canvas: tap a
  fish = its name, tap the water = food) and 8 `GOALS` per place (one at a time, a picture at the top while fishing). The game
  hands it `window.FishGame` (fish list, `drawFish`...). Test hooks: `__fishingState()`, `__fishingTest`, `__fishingBot(on)`
  (plays by itself), `__fishTank()`. The title menu's extra picture buttons (Book, Tank, Shop) use the kit's `menuExtras`.
- **Phones** get `html.ar-phone` (set in shared.js): every page keeps a 5% border (Keith: use 90% of the phone).
  Upright, the kit covers wide games with a big "turn me" picture while playing (`ar-turnshow`; the game waits);
  a small button plays upright anyway (on-screen buttons then stack 2 across).
- Title screens and title menus are pictures only (big Play button, round icon buttons): no reading needed.
- `tools/` holds the Python art converters (only needed by the dev runs, not the game).
- **Before every commit run `python3 tools/bump_version.py`** — it adds a fresh `?v=` to the
  script/CSS links so browsers load the new code instead of an old cached copy.
- Keep code simple and commented — Keith is learning from it.
