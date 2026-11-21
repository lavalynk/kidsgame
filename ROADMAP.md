# Roadmap

The daily run works top-down through **Up next**. Keith can reorder, add, or cross
things off anytime — or leave notes below.

## Notes from Keith

_(Add requests here, e.g. "make the dragon bigger" — the next run handles these first.)_

**Keith, Nov 13 (asked in chat): three things, in this order.**
1. [x] **Mini golf** ("simple, like a putt putt type"): done Nov 13 as Putt-Putt Park (`golf/`), 9 holes.
       Ideas for later: a second course (beach / candy / space), Friends taking turns, moving bridges, a loop.
2. [x] **Fishing game worked on.** (Nov 13, later: Keith said it "should be a little easier": done, see the
       changelog. Nov 13, night: the looks + more to do are done too: rowboat, new water + lake bottoms,
       more detailed fish, a new catch screen; shells, the Shell Shop (4 baits, 8 aquarium things),
       My Aquarium, 8 goals per place. Ideas for later: a second boat color / hats in the shop, a
       night-fishing place, goals for the Frenzy rounds, trade fish with Friends.) Keith picked: **how it looks** (better drawings of the water, fish, boat and
       the catch screen) and **more to do** (goals and rewards: an aquarium, a bait or rod shop, challenges).
       Not asked for: changing how casting / reeling plays, or adding more fish.
3. [x] **A game like Golden Axe**: (Nov 13 evening, after Keith played: less lag, more detailed characters, fewer hero
       hearts, hero + potions carry over with Next, 5 new baddies and bigger groups: all done.) First version done Nov 13 as **Potion Quest** (`quest/`): 3 heroes, potions +
       3 sizes of spell, 4 kinds of baddie + the Blob King, 3 stages. Ideas for more runs: more stages (snow, cave,
       sky), a second boss, a jump, two players together, creatures to ride, a hero shop. The brief was:
       **A game like Golden Axe**: a side-scrolling adventure with our OWN heroes and creatures (no copied
       characters or names; baddies poof into sparkles, per the design rules). Keith picked what matters most:
       **magic potions** (collect them, set off a big screen-filling spell) and **pick your hero** (three heroes
       that each feel different). Not picked: two players together, creatures to ride. Expect several runs.

**Keith, Nov 19: "Maze Explorer is due an upgrade as well."**
- [x] Done Nov 19 (no details were written down, so the run picked): a map of every maze (replay any, see stars),
      pick your friend + 4 new friends who join as you play, 3 new shapes, dark lantern caves (Normal/Challenge),
      and a "stuck?" sparkle. **Keith: tell the next run what you'd like more of.** Ideas for later: more friends
      (penguin, frog, owl), bridges / tunnels, a moving treat, Friends: two explorers in one maze, a maze-maker.

**Keith, Nov 19 (asked in chat): "RC Racers - how can we make the game better?"** Keith picked three things
(nothing needs fixing first: "add new stuff"). Next runs: one solid chunk each, in this order.
1. [x] **Better Track Builder**: place your own ramps, boost pads and gift boxes; a shortcut piece;
       race a friend on your home-made track (Friends).
       (Nov 19: done, Keith picked "put things on it", "more looks", "race friends on it". Things: gift boxes, boost pads,
       jump ramps, bumpers, oil, puddles, the world's critter (16 per track). Look: laps 1-5, weather, thin / normal / wide road.
       Friends: the room maker's own tracks are in the lobby. Not done yet: a shortcut piece, decorations.)
2. [x] **New ways to play**: e.g. Coin Rush (grab coins before the clock runs out), **Heart Battle** (below, done Nov 19),
       Follow the Leader. Picture tiles on the main menu, no reading.
       (Nov 20: **Coin Rush** + **Follow the Leader** done, two new tiles on the main menu (now 10, 5 x 2).
       Coin Rush: 60 s (little kids 90), rows of coins, big coins (+5), clocks (+5 s), bronze/silver/gold per track.
       Follow the Leader: Pip drives 2 laps weaving left and right and leaves music notes; catch them before they fade.
       Ideas for later: both with Friends, Coin Rush on your own built tracks, trophies for them on the shelf.)
       - [x] **Heart Battle** (Nov 19, Keith asked to start it right away): 3 arenas, 4 hearts per car, flower ring closing in,
         bumpers, a heart to pick up, last car wins. Ideas for later: Heart Battle with Friends (several phones),
         more arenas (beach, moon), a Heart Battle trophy on the shelf, teams (2 vs 2).
       **Heart Battle (Keith, Nov 19): a battle-royale mode, NOT like Mario Kart's balloon battle.** Every car has
       **4 hearts** (shown over the car) instead of balloons. Last car still driving wins.
       Ideas to keep it our own + gentle (check with Keith if unsure): an open arena, not a race track;
       items knock off a heart (bubble, bump while boosting...); a heart pickup now and then; the safe area slowly
       shrinks (a ring of flowers / clouds closing in) so rounds stay short (~2 min); out of hearts = the car
       poofs into sparkles and you watch with a "Nice try!" + one-tap retry. Little kids: more hearts, gentler rivals.
3. [ ] **Feel and look**: jumps / ramps on the normal tracks, drifting with sparks, weather (rain, snow),
       a bigger and happier win screen.
- [x] **Keith, Nov 19 (later): "a couple cooler weapons", "those bouncing circles on some tracks", "more obstacles".** Done:
      Giant Snowball, Boomerang, Triple Bubble (races + Heart Battle); bouncy bumpers on 5 tracks; a moving obstacle on
      every track (beach ball, pumpkin, tumbleweed, moon rock, frog, cloud puff join the crab, snowball, gumdrop, steam).
      The results screens were also made to fit (Keith's screenshot: the buttons were cut off).
- [x] **Keith, Nov 19 (later): "see all the different pick ups" + "special unlockable pickups".** Done: the Item Book
      (Items button on RC's main menu: 15 items + 3 specials, found ones counted) and 3 specials: Mega Car (win 5 races),
      Freeze Flake (find 12 items), Firework Party (win a Heart Battle). Ideas for later: more specials (e.g. unlocked by
      the Ghost Race or the Track Builder), a sticker for a full book.
- [x] **Keith, Nov 19 (later): "I think 30 items total would be cool".** Done: 24 items + 6 specials. New items: Pogo Pad,
      Bubble Trap, Glitter Trail, Monster Wheels, Water Balloon, Turbo Trio, Lucky Dip, Busy Bee, Whirlwind. New specials:
      Bubble Dragon (beat Boo), Swap-O (race your own track), Disco Ball (finish a cup). Idea for later: a sticker for a full book.
Not picked (for now): two players on one screen.

**Keith, Nov 20: "make the menus better" (the list Claude wrote; Keith picked group 1, then GSAP + Swiper).**
1. [x] **Phone fixes** (Nov 20): notch / safe areas, real screen height (dvh), no text blow-up, scroll instead of tiny,
       zoom fallback, a phone test for every page (`tests/test_phones.py`). Several real overflows fixed (see the changelog).
2. [x] **GSAP** bouncy menus + squishy buttons (all pages) and **Swiper** for the Sticker Book (Nov 20).
3. [ ] Ideas from the list, not started: one menu layout for every game; swipe pages in the level pickers too (Swiper);
       bigger "locked" / "new!" signs with a hint picture; a speaker button that reads a tile's name; remember the last
       spot in the level picker; smooth page changes (View Transitions); one shared menu system instead of each game's own;
       a grown-up "menu preview" page. Phaser only for in-play overlays (pause / results), not the main menus.

**Keith, Nov 20 (later): "rewrite everything to utilize Phaser 3 + Rex UI" (menus drawn inside the game picture, scaled to fit).**
One game per session, each keeps its HTML menus until its canvas menus pass the tests (`arcade/canvasmenu.js`, see CLAUDE.md).
- [x] The canvas-menu engine + the kit's menus (title, picture menu, levels, help, prizes, trophies, new game, pause, results) (Nov 20)
- [x] Jungle Jump (Nov 20)
- [x] Hoop Heroes (Nov 20; its ball picker rebuilt as screen rows; `tests/test_canvas_menus.py` walks every converted game's menus)
- [x] Potion Quest (Nov 20, Keith: "redo Potion Quest with the Phaser graphics": Phaser engine underneath like Jungle Jump + canvas menus + more hero detail)
- [x] The games that only use the kit's menus: Archery, Treasure Trail, Space Defender, Bubble School, Putt-Putt Park (Nov 21; each Prizes page rebuilt as screen rows)
- [x] Turbo Bike (Nov 21: Bike Shop, the cup points table + podium, Pick your bike, the track builder; all canvas screens)
- [x] Fishing Frenzy (Nov 21, later: Fish Book + goals, Shell Shop, the Aquarium (a moving picture inside the menu), rods, results as pictures, the Friends list as one picture)
- [ ] Piano Star (song list)
- [ ] Mini RC Racers (the biggest: 10-tile main menu, cups, car garage, Track Builder, trophies, Item Book)
- [ ] The pages that aren't kit games: the hub, Sticker Book, My House, Coloring, Maze, Parent corner
- [ ] The Friends lobby (`arcade/net.js`)

**Keith, Nov 20 (later still):** [x] the home button works on every menu (it was hidden under them); [x] "each game should have the
controls pop up when you hit go": the controls card (every kit game, every time a round starts; not on Start over / Friends).
Not yet for Maze + Coloring (not kit games, tap-only).

## Up next

### The 10-point plan (Keith, Nov 5): work top-down through this list
1. [x] **Feels like a real app**: Add to Home Screen with its own icon, works offline (car trips, planes),
       opens full-screen without the browser bar (web app manifest + service worker that caches every game).
2. [x] **Phones held upright**: no overlapping on-screen buttons (e.g. Turbo Bike), games big enough, or a big
       friendly "turn me sideways" picture. Then one pass through every game at real phone sizes.
3. [x] **More Friends games** (done: Hoops, Turbo Bike, Bubble School, Fishing (Nov 6), Archery (Nov 7)): Hoops head-to-head (same 60 s, best score wins),
       Bubble School quiz race (first to pop the right answer), Fishing together (rarest fish wins),
       Archery taking turns on one target.
4. [x] **Daily surprise** (Nov 8): one small challenge a day ("collect 30 coins in RC", "3 stars on any maze");
       finishing it gives a special sticker or 2 house coins.
5. [x] **Grow the house** (Nov 8): more rooms (garden, bedroom, a garage showing your best RC car), drag things
       anywhere, visit a friend's house over Friends.
6. [x] **Finish the coloring book**: every tab to 30 pages (18 per run: 6 + 6 + 6), a "Done!" celebration,
       colorable stickers, finished pictures hang on a wall in your house.
       (Nov 9: first 18 pages done, now 18 / 19 / 17. Next run: 6 + 6 + 6 more.)
       (Nov 10: Keith liked the HTML/CSS try-out: all 54 pages are now HTML/CSS shapes, no animation.
       New pages are drawn the same way; see `coloring/pages.css`.)
       (Nov 10, evening: 18 more HTML/CSS pages, now 24 / 25 / 23. Next run: 6 + 5 + 7 to reach 30 each,
       then the "Done!" celebration, colorable stickers and the picture wall in the house.)
       (Nov 11: 18 more pages, **every tab now has 30** (done). Still to do for this point: the "Done!"
       celebration, colorable stickers, and finished pictures on a wall in your house.)
       (Nov 12: done! "Done!" star + confetti when the last part is colored, stickers can be colored
       with the crayons, and a new Art Room in My House hangs your 6 newest pictures on its wall.)
7. [x] **One new no-reading game** (Nov 13: Keith asked for mini golf, see Notes from Keith: Putt-Putt Park)
       (the original ideas, still open for later: building/stacking blocks, cooking + pet care, a music maker / jukebox.)
8. [x] **Deeper favorites**: RC track builder, trophy shelf, daily ghost race; Jungle Jump 2nd level per world;
       Piano two hands + record your own tune.
       (Nov 14: **Piano done**: 6 two-hands songs + record 3 tunes of your own in Free Play.
       Next run: RC trophy shelf + daily ghost race, then the RC track builder, then Jungle Jump's 2nd levels.)
       (Nov 15: **RC trophy shelf + daily ghost race done** (Boo the ghost car, a new track every day).
       Next run: the RC track builder, then Jungle Jump's 2nd levels.)
       (Nov 16: **RC Track Builder done**: draw a loop with your finger, drag the dots, dice for a surprise track,
       10 worlds, one crossing becomes a bridge, 3 tracks per player, Race or Drive on them.
       Ideas for later: a shortcut piece, place your own gift boxes / ramps, race a friend on your track.
       Next run: Jungle Jump's 2nd level per world (the last part of point 8).)
       (Nov 16, later: **Jungle Jump's 2nd levels done**: Treetop Trail, Glow Cave, Windy Peak, Jelly Hills. Point 8 is finished.)
9. [x] **Parent corner** behind a "hold for 3 seconds" button: what each kid plays, stickers, a time limit,
       sound settings. Nothing leaves the device.
       (Nov 16: done. Hold the Grown-ups button at the bottom of the hub. Ideas for later: a bedtime (no play after 7 pm),
       a weekly summary, lock single games, a PIN instead of holding.)
10. [x] **Keep it healthy**: tests run automatically on GitHub for every change, faster on older tablets,
       a "report a problem" button (grown-ups only, in the parent corner) that opens an email to Keith,
       keep `CLAUDE.md` accurate.
       (Nov 16: done. `.github/workflows/tests.yml` runs every test file on each push; the kit draws fewer pixels when a
       device is slow ("lite"); Report a problem is in the Parent corner. **Keith: the report email has no address filled
       in yet** (your address would be public in the repo): put one in `REPORT_EMAIL` at the top of `parent/parent.js`
       if you want, or tell the next run which address to use.)

**The 10-point plan is finished (Nov 16).** Next runs: Notes from Keith first; otherwise the open items below
(the Turbo Bike plan is the biggest list still open: the Championship cup (#6) is done (Nov 18), the bike shop (#7) too (Nov 19); next the better track builder (#8)).

### Turbo Bike plan (Keith, Nov 6)
1. [x] **Tricks in the air**: Up = Superman, Down = No hands; landed = speed boost + cheer; too late = a wobble
2. [x] **Coins on the track**: on the flight path over jumps (gold star coins on big ones) + rows in other lanes; 25 coins = 1 house coin
3. [x] **Feedback**: speed lines + gentle camera shake at top speed, turbo whoosh, softer/funnier tumble ("I'm OK!" hop)
4. [x] **Computer riders**: Zip, Moxie and Bolt race in the other lanes; place shown live and in the results
5. [x] **More tracks and places** (10 total: beach, snow, night race with lights, desert, candy), each with one special thing (loop, splash, moving platform)
       (Nov 17: done. Splash Beach (water), Candy Bounce (jelly pads), Night Lights (lamps + headlight), Jungle Loops
       (loop-de-loops), Cloud Castle (ramps that go up and down). The builder got the 4 new pieces too (part of #8).)
6. [x] **Championship cup**: all tracks in a row for points and a big trophy (like RC's Grand Prix)
       (Nov 18: done. Mini Cup = 3 tracks, always open; Championship = all 10, opens after a Mini Cup.
       Points 10 / 7 / 5 / 3 per race, a points table between races, trophy + podium at the end, stop and carry on later.)
7. [x] **Bike shop**: spend coins on upgrades (engine, cooler, tires) and looks (colors, flames, helmet sticker)
       (Nov 19: done. Shop button on the title menu; track coins go in a wallet; 3 upgrades x 3 levels, 8 paints, flames, 4 helmet stickers.)
8. [ ] **Better track builder**: loops, water, boost pads; share your track over Friends
9. [ ] **Daily ghost challenge** (with the daily surprise, plan point 4)
10. [x] **Little-kid help**: always lands flat, never overheats

### Arcade upgrades (Keith's 6 priorities, Nov 2)
- [x] **Players**: each kid picks an animal avatar (+ color, optional name); own progress, stickers,
      unlocks, coloring gallery, maze progress, difficulty and favorites. "Who's playing?" on the hub.
- [x] **Hub**: favorites (done with players), "play again" row, picture tabs (All / Faves / Race / Action / Sports / Calm), phone layout (2 boxes across, 4 sideways); `tests/test_hub.py`
- [x] **Age presets**: Little (3-5) / Big (6+) per player; little = always Easy, racing/action games run slower,
      RC + bike drive themselves forward with a strong steering hand, extra lives in Space; `tests/test_age.py`
- [x] **Mini RC Racers polish**: smooth steering (tap = nudge), slipstream + slingshot, place arrow + race-order strip,
      arrow to the car ahead, rivals' faces + name tags, horn, **Free Drive** (find 12 stars, no race); `tests/test_rc.py`
- [x] **Sticker collection**: an arcade-wide Sticker Book (52 stickers: 4 per game + 4 arcade ones), earned just by playing (Keith, Nov 5)
- [x] **My House** (Keith, Nov 5): decorate your avatar's room; every trophy = 1 coin (3 to start); 12 spots, 36 things, try before you buy
- [x] **Picture title screens + menus** (Keith, Nov 5): a big Play button instead of "Tap to start!", round picture buttons instead of the word list
- [x] **Phones use 90% of the screen** (Keith, Nov 5): a 5% border all round on every page
- [x] RC: no shortcut on Candy Raceway, horn removed (Keith, Nov 5)
- [x] **Multiplayer on several phones** (Keith, Nov 5): Cloudflare switchboard (`server/`) + 3-picture room codes + RC Friends race
- [x] **Keith: deploy the switchboard**: live at kids-arcade.lavalynk.workers.dev (Nov 5)
- [x] Items in friends races (Keith, Nov 5)
- [ ] Friends ideas: Hoops head-to-head, Bubble School quiz race
- [x] **Offline + tests**: Add to Home Screen / offline play (`tests/test_offline.py`)

### New games
- [x] **Piano Star** (Keith, Nov 5): sheet music for simple songs, play note by note for points; `tests/test_piano.py`
- [x] Piano: 50 more songs (58 in all), 10 in the bass clef; no replay at the end, a "Hear it" button instead (Keith, Nov 5)
- [x] Piano: a two-hands mode (treble + bass together), record & play back your own tune in Free Play (Nov 14)

### Kids Arcade (Keith's 9-game brief, Oct 31)
- [x] Shared arcade kit (`arcade/`): game loop, input + touch buttons, difficulty, pause,
      how-to-play, level picker, results with stars/medals, sounds + music, saving
- [x] Hub with 9 game cards (3 x 3), progress shown on each card
- [x] Turbo Bike Challenge — 5 tracks, heat, lanes, landings, crashes, medals, ghost, 4 bikes, track builder
- [x] Mini RC Racers — 3 tracks, 3 computer racers, laps/positions, oil/puddles, shortcut, items, 4 cars
- [x] RC rework (Keith): 8 tracks, no difficulty setting, all cars equal, coins per race, garage upgrades (engine, tires, turbo, nitro)
- [x] Hoop Heroes — 30 s / 60 s modes + challenge levels, moving hoops, streaks, ball designs
- [x] Bullseye Adventure — 9 levels in 3 places + practice, wind, balloons, wheels, moving targets, hats
- [x] Jungle Jump — 4 worlds (forest, cave, snow, candy), checkpoints, treasure, 5 heroes
- [x] Space Defender — 3 sectors with bosses + endless mode, power-ups, combos, ships
- [x] Fishing Frenzy — 3 places, relax + frenzy modes, nibble/bite timing, reeling, fish book, rods
- [x] Coloring book upgrades: brush + sizes, eraser, redo, 2 crayon boxes + any color, 10 stickers, auto-save + gallery
- [x] Maze upgrades: Easy/Normal/Challenge sizes, 4 color themes, key + locked door, gems & stars, hint bulb, arrow keys, saved progress + medals
- [x] Second level per Jungle world (Nov 16)
- [x] Space Defender overhaul (Keith, Nov 2): 10 sectors with mini + big bosses, 20 special weapons + Weapon Book, the Chimera final battle
- [x] RC Grand Prix: all 8 tracks in a row, garage between races, points + trophy; free play on any track with a maxed-out car (no garage)
- [x] RC: 10 tracks, each with its own song; new music engine for the whole arcade
- [x] RC items: cloud ride, super star, honey, coin bag (plus boost, shield, bubble)
- [x] RC extras: car styles won with Grand Prix trophies, stickers bought in the garage, Time Trial with a ghost car,
      coins on the track, weather (rain/snow/wind), boost pads and jumps, voice countdown + finish cheer + pass confetti
- [x] RC special paints (neon green/pink/blue, gold, rainbow) won with feats; glow + light trails
- [x] RC main menu with sub menus (Grand Prix / Free Play / Time Trial / My Car) + menu music
- [x] RC: shortcuts on 5 tracks, moving obstacles, night lights, rival personalities, Mini Cup, zoom camera, photo finish, perk sounds
- [x] Treasure Trail: a jungle explorer game (vines, hippos, quicksand, logs, ladders to hidden treasure), 4 adventures
- [x] Jungle Jump restyle: leaf glide, roll, bouncy critters, boulders, lanterns, balloon goal
- [ ] RC ideas: two-player split screen (done: trophy shelf, track builder, daily ghost race; the horn was removed)

### Music (Keith, Nov 2: "do 1-6")
- [x] Hand-written tunes for every song (verse, chorus, bridge), checked by `tests/test_tunes.py`
- [x] Music that follows the game (RC, bike, jungle, trail, Bubble School, space, hoops, fishing)
- [x] Smooth changes: crossfades, get-ready jingle, pause/resume, an ending chord
- [x] Longer songs: intro, verses, choruses, bridge, breakdown, key change (~1.5-2.5 min loop)
- [x] New instruments: steel drum, marimba, choir, ukulele, whistle, kazoo
- [x] Music on/off + volume per player
- [ ] Ideas: a Jukebox / music maker on the hub; music for the coloring book and maze (off by default)

### Coloring game
- [x] Hub screen with big picture buttons for each game
- [x] Coloring game: tap-to-fill with a big crayon palette, undo, clear, back to hub
- [x] Art converter: Firefly line art in `art/` becomes tappable coloring pages
- [x] 20 animals from Keith's first sheet + 20 fruits from his second sheet
- [x] Page picker screen: thumbnails of every page, grouped into Animals and Fruit tabs
      (picture tabs, no words) — there are 44 pages now, arrows alone are too slow
- [x] **Dragon** (plus unicorn and tiger) from Keith's Firefly art
- [ ] Sound effects: soft "pop" on fill, cheerful jingle when a picture is finished
- [ ] "Done!" celebration (confetti/stars) when every region is colored
- [ ] Save finished pictures to a gallery on the device
- [x] Switch to hand-drawn art in Keith's style (thick outlines, big simple shapes):
      6 animals, 7 fruits, 5 things that go, with a third picker tab (car)
- [x] **Grow every tab to 30 pages — 18 new pages per run (6 + 6 + 6)** (Keith, Oct 30; done Nov 11: 30 / 30 / 30).
      No suns in pictures. Veggies go in the fruit tab.
      - Animals 18/30: cat, fish, bird, dog, bunny, turtle, lion, elephant, pig, owl, penguin, duck,
        cow, frog, monkey, giraffe, snail, whale (Nov 9).
        Ideas (never the bear): horse, sheep, zebra, fox, hedgehog, butterfly, ladybug, bee,
        octopus, crab, dinosaur
      - Fruit & veggies 19/30: apple, banana, strawberry, pear, cherries, orange, watermelon,
        grapes, pineapple, lemon, carrot, corn, broccoli, peach, kiwi, avocado, mushroom,
        tomato, pumpkin (Nov 9).
        Ideas: peas, potato, onion, eggplant, coconut, blueberries, mango, pepper, cucumber,
        lettuce, radish
      - Things 17/30: car, airplane, house, sailboat, train, bus, fire truck, rocket,
        helicopter, tractor, castle, hot-air balloon, submarine, digger, lighthouse, tent,
        dump truck (Nov 9).
        Ideas: police car, ambulance, bicycle, scooter, motorcycle, ship, garbage truck,
        school, barn, tow truck
- [ ] Brush/free-draw mode in addition to tap-to-fill
- [ ] Sparkle/pattern colors (rainbow, stripes, dots)

### Maze game
- [x] Maze game: drag a finger/animal from start to goal, wide paths, no walls-hurt
- [x] Shape changes after each completed maze (circle → heart → square → diamond → star)
- [x] Friendly character + reward at the end of each maze (bee → flower, bunny → carrot,
      mouse → cheese) with a star burst and a little jingle
- [x] Gentle difficulty steps (5x5 grid → 6x6 → 7x7, then stays at 7x7)
- [x] More maze friends (puppy → bone, monkey → banana, fish → shell, kitten → yarn) (Nov 19: they join after 3 / 6 / 9 / 12 mazes)
- [x] "Show me" hint: after a while with no progress, the path gently sparkles (Nov 19)
- [x] Maze map + pick your friend; house, apple, cloud shapes; dark lantern caves (Nov 19)

### Polish
- [x] Music on/off for each player (hub + pause menu) and mute button (music stays on by default — Keith can say if it should start off)
- [ ] Add to Home Screen support (PWA / offline play)
- [x] Publish on GitHub Pages
- [ ] Accessibility pass (contrast, reduced motion)

## Done
See `CHANGELOG.md`.
