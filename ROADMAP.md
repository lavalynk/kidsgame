# Roadmap

The daily run works top-down through **Up next**. Keith can reorder, add, or cross
things off anytime — or leave notes below.

## Notes from Keith

_(Add requests here, e.g. "make the dragon bigger" — the next run handles these first.)_

**Keith, Nov 23 (live): "I want every game menu to be retooled and every logo to be retooled to fit with the new phaser
library. Make it look sharp and use other libraries nifty necessary to make the menus better."** He picked the **glossy
arcade** look (shiny 3D buttons, gradient logo letters with a sweeping shine, animated backgrounds) and **shared kit first**,
then each game's own special screens in later runs. This goes BEFORE the rest of the new 10-point plan.
- [x] (Nov 23, part 1: **the shared menu kit + every logo + the hub.** Every canvas menu in every game, the hub, Sticker Book,
  My House, Jukebox, Parent corner, coloring + maze menus: glossy tiles / buttons / round buttons, gradient panel with a gold rim,
  titles on a shiny pink sign, the Fredoka font; title screens get a glowing background with slow light rays + floating sparkles and
  the logo drawn by Phaser piece by piece (spinning burst, the badge drops in, the name pops in with a shine sweeping across it).
  Mini RC Racers' logo is in the shared style now.)
- [x] Part 2: each game's own special screens, checked one by one and polished where they still look flat: RC's garage +
  Track Builder, Turbo Bike's shop + builder, Fishing's book / shop / aquarium, Jungle Jump's hero picker, Space's ship picker,
  the results pictures (podiums, cup tables), the Parent corner's charts.
  [x] (Nov 23, part 2a: **shops, books + builders.** Section headings in every list ("Upgrades", "Bait", "Sunny Pond", "Pick
  your bike") are little shiny purple ribbons with a gold twinkle each side; number chips (coins, shells, fish counts) are shiny
  with a shadow; colored cards (the bike builder's two boxes, Sticker Book pages) have a soft blend, a shadow and a light inner
  line; moving pictures (RC's Track Builder board, My House's room, the Jukebox stage) sit in a gold-rimmed frame. The Bike
  Shop and RC's My Car show **your bike / car on a gold stand in a spotlight** with slow light rays, next to the choices
  (above them on an upright phone). Next: part 2b = the results pictures (podiums, cup tables), Jungle Jump's hero picker,
  Space's ship picker, the Parent corner's charts.)
  [x] (Nov 23, part 2b: **pickers + charts.** Jungle Jump's hero picker and Space Defender's ship picker show **the hero /
  ship you picked big on the gold stand in a spotlight** (like the Bike Shop), your stars (+ treasures) under it, the others
  to pick next to it under a "Pick your hero / ship" ribbon (upright phone: one under the other); Space's auto-fire switch
  stays on top, the Weapon Book has its own ribbon. The Parent corner's two charts are shiny: soft lilac card, dashed guide
  lines, bars with a color blend, a shadow and a shine stripe, today's bar green with a gold star, a colored dot per game,
  each chart in a gold-rimmed frame; every Parent corner heading is a ribbon. Kit: a `heading` row, `pics` items with
  `frame: true`. Next: part 2c = the results pictures (RC + bike podiums, cup tables, the ghost race card).)
  [x] (Nov 23, part 2c: **the results.** On every results screen the stars stand in a soft golden glow with light rays and
  each star bursts into twinkles as it pops in; the medal and the games' big results pictures (RC's podium + cup podium,
  Turbo Bike's cup table + podium, the Ghost Race card) get the same glow; the score sits on a dark plaque with a gold rim
  and NEW BEST! is a pink ribbon that wiggles now and then. Calm motion: the glow stands still, no twinkles fly.
  **Part 2 is finished.** Next: part 3.)
  [x] (Nov 23, part 2d: **inside the results pictures.** RC's race podium + cup podium and Turbo Bike's cup podium have shiny
  gold / silver / bronze steps (color blend, shine, a shadow, a gold ring round yours), white numbers, a shadow on the floor,
  and soft light rays + a glow behind the winner (rays fade out at the ends). The cup trophies are shiny with rays and
  twinkles when you win. The points tables (RC Grand Prix, Turbo Bike cups) are shiny rows (yours gold) with shiny bars;
  Boo's and Wisp's ghost race cards are shiny rows with a glow behind the trophy / Wisp, and Wisp's week circles are shiny.
  Kit: `Arcade.svgGloss` in shared.js. To look at next: since part 2c the race results screen scrolls a little on a
  computer (the NEW BEST! words sit just under the edge); make the results fit without scrolling.)
- [x] Part 3: the HTML-only bits still left (the player editor on the hub, the "All done for today" wall, the maze + coloring
  top bars) in the same glossy style.
  (Nov 23, night: done. The player editor is a purple panel with a gold rim, your animal big in a gold ring with a golden
  glow, shiny animal / color / age buttons. The "All done for today!" and "Time for bed!" walls: slow light rays + twinkles
  behind a gold-rimmed panel, the words on a shiny pink (bedtime: purple) sign, shiny home + hold buttons. Every HTML round
  button (coloring + maze top bars, the in-game home / pause corners), the crayons, the coloring tools + tabs are shiny
  balls / boxes with a shine and a shadow (css/style.css "Glossy HTML buttons"). **The glossy menus note is finished.**
  Still open from part 2d: the race results screen scrolls a little on a computer; next: point 4's last part.)

**Keith, Nov 22 (live): "a new list of ten things to work on", including better graphics and playability.**
**The new 10-point plan: work top-down, one point (or one solid part of a point) per run.** Each point names the games it
starts with; when a point is too big for one run, write what's done in brackets under it, like the old plan.
1. [x] **Sharper characters in the older games.** Redraw the heroes, baddies and things with more detail and cleaner
       outlines (like Potion Quest's Nov 13 redraw): Jungle Jump's heroes + critters, Space Defender's ships + enemies,
       Treasure Trail's explorer + animals, Archery's targets + balloons. Keep the cute faces; never scary.
       [x] (Nov 22, part 1: **Jungle Jump**: all 5 heroes redrawn with a big round head on a small body and each animal's
       own details (Momo's heart face + curly tail, Pip's eye bumps + wide smile, Bun's teeth + puff tail, Rusty's
       dark ear tips + white cheeks + one-piece bushy tail, Bao's black ears/arms/legs); each world got its own critter
       with two big eyes: a ladybug, a glowing firefly, a snow puff in earmuffs, a gumdrop. Look at them with
       `python3 tools/preview_jungle.py`. Next: Space Defender's ships + enemies, then Treasure Trail, then Archery.)
       [x] (Nov 22, part 2: **Space Defender**: all 6 ships redrawn (a metal nozzle, a striped band, a 3-layer flame,
       glass with a shine, a pilot with hair + rosy cheeks, blinking wing lights on the jets, chasing rim lights on the
       saucers; the menu pictures match) and all 9 small enemies (soft shading + a shine, glowing antenna bulbs, they
       blink, blush cheeks; the bobber has a glass visor + spinning propellers, the cube robot mitten hands, the rock
       craters, the jelly curly legs, the bee-bot antennas, the planet stripes and a ring that goes round behind it).
       Mini bosses are big enemies, so they got the new look too. Look at them with `python3 tools/preview_space.py`.
       Next: Treasure Trail's explorer + animals, then Archery's targets + balloons.)
       [x] (Nov 22, part 3: **Treasure Trail**: the explorer redrawn with a big round head on a small body, two shiny
       eyes + eyebrows, hair under the hat, freckles, an open smile, a red spotted neckerchief and a blanket roll on the
       backpack (every hat fits the bigger head; same hit box). Hippos have a round head that goes on under the water, a big
       snout with nostrils + a smile, bigger eyes; snakes are 3 striped coils with a yellow tummy and a big two-eyed face;
       bats got pink-lined ears, a fluffy tuft and a happy mouth; the parrot a crest + rosy cheek. Look at them with
       `python3 tools/preview_trail.py`. Next: Archery's targets + balloons, the last part of point 1.)
       [x] (Nov 22, part 4: **Archery**: targets stand on a wooden easel with feet, have a straw back with stitches,
       softly shaded rings, a curved shine and a twinkle on the bullseye; the sliding target is on a candy-striped pole, the
       cart has turning wheel spokes and a waving flag; balloons are balloon-shaped and shiny with a knot, a curly ribbon,
       a gentle sway and a picture each (heart / dots / star / stripes) and go POP with a burst; the golden star is chubby,
       blinks, blushes and has twinkles circling it; the prize wheel has a red rim with running lights and a gold star hub.
       Look at them with `python3 tools/preview_archery.py`; new test `tests/test_archery.py`. **Point 1 is finished.**
       Next: point 2, living backgrounds.)
2. [x] **Living backgrounds.** Layered scenery that slides at different speeds (parallax), gently moving clouds / water /
       leaves, and a time-of-day look on a few levels. Painted once into hidden canvases (like Potion Quest and Fishing) so
       older tablets stay smooth; nothing moves in Calm motion.
       [x] (Nov 22, part 1: **Turbo Bike**: every one of the 10 places has 3 painted scenery strips behind the grandstands
       (far mountains / mesas / volcanoes / islands / a cloud castle, middle hills with trees, cacti, pines, houses or
       gumdrops, near hills with bushes, umbrellas, ferns, peppermints) that slide at different speeds; clouds drift by
       themselves, and each place has little things floating about (leaves, snowflakes, embers, bubbles, birds, gulls,
       fireflies, volcano smoke). Forest Flyer now races at **evening** and Snowy Peaks at **dawn**. Calm motion: the clouds
       stand still and nothing floats. Look at them with `python3 tools/preview_bike_scenery.py`; test `tests/test_bike_scenery.py`.
       Next part: **Jungle Jump + Treasure Trail** (they already have layers: add drifting clouds / leaves + a time of day),
       then Archery, Hoops and Putt-Putt Park (still scenes that gently breathe). Mini RC Racers is seen from above, so it's last.)
       [x] (Nov 22, part 2: **Jungle Jump + Treasure Trail**: Jungle Jump's 2nd level of each world has a time of day:
       Treetop Trail at **evening** (peach sky, glowing fireflies, autumn leaves), Windy Peak at **dawn** (pink sky, rosy
       snow), Jelly Hills at **twilight** (purple sky with twinkling stars); falling leaves in the forest, glow dots drifting
       up in the caves, soap bubbles in Candy Land; the seams in the hill strips are fixed. Treasure Trail: butterflies +
       falling leaves by the river, leaves + drifting mist in the deep jungle, sunbeams with golden dust at the temple, and
       **Sunset Swamp gets later room by room** (pink -> purple, stars come out, more and more fireflies). Calm motion: the
       clouds stand still, nothing floats, the corner leaves stop swaying. Look with `tools/preview_jungle_scenery.py` +
       `tools/preview_trail_scenery.py`; test `tests/test_living_scenery.py`.
       Next part: Archery, Hoops and Putt-Putt Park (still scenes that gently breathe), then Mini RC Racers.)
       [x] (Nov 22, part 3: **Archery**: the still scenery of each place is painted once (sky / far / land layers) and
       live bits breathe on top: drifting clouds, a windmill with turning sails and far snowy mountains in the meadow,
       swaying trees, nodding flowers, butterflies, a flock of birds now and then; at the beach a lighthouse island, a
       sailboat bobbing slowly across, rolling waves with twinkles, gulls and a swaying palm; in the snow a cabin with
       chimney smoke that leans with the wind. **Hilltop** is now at **evening** (lilac + peach sky, fireflies),
       **Prize Wheel** at **sunset** (pink sky, golden twinkles on the sea), **Snowy Slide** at **dawn** (pink snow).
       Calm motion: everything stands still, nothing floats (the wind lines stay, still, because they show the wind).
       Look with `python3 tools/preview_archery_scenery.py`; `tests/test_living_scenery.py` checks Archery too.
       Next part: Hoops and Putt-Putt Park, then Mini RC Racers.)
       [x] (Nov 22, part 4: **Hoop Heroes + Putt-Putt Park**. Hoops: two big windows high on the hall's back wall look
       out on a little town, and **the day goes by as you climb the ladder**: daytime with drifting clouds (Ruby, Dash,
       Sid), **sunset** (Sam, Bella), **evening** with the first stars (Tia, Wes) and **night** with a moon, twinkling
       stars, lit-up windows and a plane blinking by (the Champ, High Score). Two spotlights slowly sweep the hall with
       dust twinkling in them; the Champ's final has golden spotlights + falling confetti, High Score has colored disco
       lights; a carpet with arcade squiggles. Putt-Putt Park: soft cloud shadows drift across the whole course, two
       butterflies flutter about and bird shadows fly over the park, gulls glide over the beach, the sea twinkles, grass
       tufts / sand ripples; **holes 8 = sunset, holes 9 = evening** on both courses (fireflies come out), so the full
       9-hole round ends as the sun goes down. Still parts painted once; Calm motion: everything stands still.
       Look with `python3 tools/preview_hoops_scenery.py` + `tools/preview_golf_scenery.py`; test `tests/test_living_scenery.py`.
       Next part: Mini RC Racers (seen from above), the last part of point 2.)
       [x] (Nov 22, part 5: **Mini RC Racers** (seen from above): the ground outside the road has a texture on every track
       (grass tufts + clovers, waves on the sea, snow drifts + sparkles, sand ripples, fallen leaves, ferns, lava cracks,
       sprinkles, little clouds far below Cloud Castle), painted once into a small tile that repeats; the sea and the clouds
       below slide slowly. Soft cloud shadows drift over the whole track. Little visitors in the air: butterflies, gulls,
       snowflakes, falling leaves, birds + sand puffs, soap bubbles, fireflies + a shooting star on the moon, embers, see-through
       clouds. Lava pools bubble and smoke, swim rings bob, balloons bob, big flowers nod. **Autumn Woods = sunset, Desert
       Dunes = dawn, Jungle Rally = evening** (fireflies). Calm motion: it all stands still, nothing floats. Look with
       `python3 tools/preview_rc_scenery.py`; test `tests/test_rc_scenery.py`. **Point 2 is finished.** Next: point 3, game feel.)
3. [x] **Game feel ("juice") pass in every arcade game.** Squash and stretch on jumps and landings, little dust puffs,
       sparkle bursts on pickups, a tiny pause + flash on a hit, a satisfying sound for every action. Same feel across all
       games (shared helpers in the kit), all turned down in Calm motion.
       [x] (Nov 22, part 1: **the kit's game-feel helpers + Hoop Heroes, Putt-Putt Park, Bubble School.** Every kit game now
       has `g.juice`: squash-and-stretch springs, dust puffs, sparkle bursts with a ring, poofs, a tiny pause on a big hit,
       a soft flash, a little shake and numbers that boing; new sounds sparkle / poof / clang / thud / plink. Hoops: the
       ball squeezes as you pull back, stretches as it flies, squashes on the backboard, rim (clang! sparks, the rim
       wobbles) and every bounce on the ramp (little puffs); a basket sparkles and the score boings, a swish gets a tiny
       pause + a golden flash, ON FIRE flashes orange. Golf: the ball stretches the way you hit it with a puff of dust,
       squashes flat against walls / bumpers / crabs, sand puffs, the pipe poofs, the cup gets a tiny pause + sparkle ring
       (a hole in one: a golden flash), the putt counter boings. Bubble School: a right bubble bursts into little bubbles
       with a tiny pause, a wrong one wobbles like jelly, the score + newest pearl boing. Calm motion: small squashes, no
       flash or shake. Test `tests/test_juice.py`. Next part: Jungle Jump, Treasure Trail and Potion Quest (move their own
       squash / dust to `g.juice`, add the tiny pause + poofs on baddies).)
       [x] (Nov 22, part 2: **Jungle Jump, Treasure Trail, Potion Quest.** The heroes' squash & stretch is now the kit's
       springy one (a jump stretches, a landing squashes and wobbles back; a big fall goes *thud*), dust puffs fly
       backwards when you jump and roll. Jungle Jump: goodies sparkle with a ring and the counter boings, springs sparkle,
       smashing a boulder gives a tiny pause + a jiggle, a booped critter poofs, bumping one = a tiny pause + a soft pink
       flash + the hearts boing, the treasure chest flashes gold. Treasure Trail: grabbing / letting go of a vine stretches
       the explorer, a bump = a tiny pause + a jiggle, a treasure = sparkle ring + golden flash + the crown counter boings.
       Potion Quest: every bonk squashes the baddie like jelly with a tiny pause, poofed baddies make a poof cloud (the
       bosses: a golden flash + a big shake), shells go *clang*, the hero stretches into a swing, hops and the kings'
       landings squash + puff dust, pickups sparkle in their own color, hearts / potions / score boing, an ouch = a tiny
       pause + a soft flash; its old shake is now the kit's (still off in Calm motion). `tests/test_juice.py` covers all
       three. Next part: Turbo Bike, Mini RC Racers, Space Defender.)
       [x] (Nov 23, part 3: **Turbo Bike, Mini RC Racers, Space Defender.** Bike: it stretches as it flies off a ramp
       (dust puffs behind) and squashes onto its wheels when it lands (more after big air); jelly pads fling it up tall, boost
       pads stretch it long with a warm flash, lane changes give a tiny squish; a tumble = a tiny pause + a *thud* + a little
       shake (the kit's, off in Calm motion); tricks landed = a tiny pause + a golden flash + a sparkle ring, a Perfect landing a
       green ring; coins make the coin counter boing, overheating puffs steam and the heat meter boings (cooling arrows too).
       RC (seen from above, so cars squash along the way they point): bumps into walls, cars and critters squash them, ramps
       stretch on take-off and squash with a *thud* + dust on landing, boost pads and drift boosts stretch them long; gift boxes
       sparkle and the item box boings, coins and Free Drive stars sparkle with a ring, the lap number / Coin Rush count / star
       count boing; a hit by a snowball etc. = a tiny pause + a soft flash; Heart Battle: losing a heart = a tiny pause, a pink
       flash, the hearts boing, a knocked-out car poofs. Space: every bonk squashes an enemy like jelly, popped ones poof and the
       score boings, combos boing; power-ups sparkle and stretch the ship (Zoom stretches it most), a new weapon or power level
       makes the weapon picture boing; a bump = a tiny pause + a pink flash, the ship squashes and the lives boing, a shield pops
       in a blue poof; bosses jiggle when hit and a beaten boss = a tiny pause + a golden flash + a shake; calming a Chimera part
       flashes starlight. `tests/test_juice.py` covers all three. **Point 3 is finished.** Next: point 4, better touch controls.)
4. [ ] **Better touch controls on phones and tablets.** Bigger, clearer on-screen buttons with pictures, the same layout
       in every game, buttons that light up when pressed, and an optional "one thumb" mode for little kids (fewer buttons,
       the game helps more). Check every game held upright and sideways.
       [x] (Nov 23, part 1: **the kit's new touch pad**, in all 6 games with on-screen buttons (Turbo Bike, Mini RC Racers,
       Jungle Jump, Treasure Trail, Potion Quest, Fishing Frenzy). Every button has its own color (arrows blue, jump green,
       gas green, brake red, turbo orange, item yellow, magic purple) as a ring + tint, and **lights up** in that color with a
       glow while a finger is on it (the picture pops a little). Same layout everywhere: moving on the left, doing on the right,
       and the game's **main button** (Jump, Gas, Bonk, Cast) is the biggest one, on the outside edge where the thumb rests.
       The whole pad listens instead of each button: a thumb can **roll** from Left to Right (or Gas to Item) without lifting,
       a touch in the gap between two buttons still counts, a thumb that slips a little keeps holding, and two thumbs (or
       three fingers) work at once. A bit bigger on big tablets. New test `tests/test_touch.py` (real finger touches on a phone
       sideways, upright and a tablet). Next part: the "one thumb" mode for little kids.)
       [x] (Nov 23, part 2: **"one thumb" mode**, the setting + 3 games. Each player has a switch in Who's playing?
       (a phone with one big button / a phone with all its buttons); grown-ups pick Auto / One thumb / All buttons in the
       Parent corner (Auto = one thumb for little kids). **Turbo Bike**: only two big lane buttons (Up over Down); the bike
       rides by itself and always lands flat. **Mini RC Racers**: only Left + Right; the car drives itself, eases off
       before bends and steers back to the road, and a gift goes off by itself after a moment. **Fishing Frenzy**: only the
       big Cast / Reel button; the lure goes to the nearest fish by itself, an early tap never scares a fish, a wider
       green part when reeling. The controls card shows the one-thumb pictures. Test `tests/test_one_thumb.py`.
       Next part: one thumb for Jungle Jump, Treasure Trail and Potion Quest, then the check of every game upright + sideways.)
       [x] (Nov 23, part 3: **one thumb for Jungle Jump, Treasure Trail and Potion Quest**, so now every game with
       on-screen buttons has it. **Jungle Jump**: only the big Jump button; the hero walks by himself and **stops** at the
       edge of a gap, before thorns and in the wind (a jump is always the child's choice, never a surprise fall); a jump
       always goes forward; boulders and critters in the way: he rolls into them by himself; in the wind, hold to rise, and
       at the top he glides off to the ledge by himself (a pretend glide checks it lands safely first); a wall too high
       with a wind behind it: he walks back into the wind. **Treasure Trail**: only Jump; the explorer walks by himself and
       waits at ponds, in front of snakes and before quicksand (until it stays shut long enough to cross); at a vine pond a
       tap waits for the vine to come close, then jumps; on the vine a tap lets go only when that reaches the far bank;
       at a ladder he climbs down for the hidden treasure and back up by himself. **Potion Quest**: only Bonk; the hero
       walks to the baddies by himself (the test bot's walking: next to the nearest one, out of snowball lanes, away from a
       stomping king, to the pickups, on to the next wave); the potion magic goes off by itself with a full bag and a crowd
       or a boss (tunnel bats don't cost a heart in one thumb). A pretend little kid who only taps one button finished all 8
       Jungle Jump levels, all 4 Treasure Trail adventures and all 4 Potion Quest places. `tests/test_one_thumb.py` covers all six games.
       Next part (after Keith's glossy menus part 2): the check of every game held upright and sideways (the last part of point 4).)
5. [ ] **Playability check, game by game.** Let the test robots play every level on Easy / Normal / Challenge, measure how
       often they win and where they get stuck, and fix the unfair spots (too-hard jumps, long boss fights, checkpoints too
       far apart). Easy must really be easy; little kids should almost always finish.
6. [ ] **"Show me" how to play.** The first time a kid opens a game (and from the help button), a short moving demo:
       a see-through hand shows the moves, then "Your turn!". No reading needed. Replaces the still how-to pictures where
       a demo is clearer.
7. [ ] **More to play where a game feels short.** New levels for the games with the fewest: Archery (a 4th place),
       Treasure Trail (2 new adventures), Hoop Heroes (new challenge courts), Bubble School (shapes + colors topics),
       Space Defender (an easier "starter" sector for little kids).
8. [ ] **Something to work towards in every game.** A star counter per game that unlocks a new look every few stars (a hat,
       a color, a trail), a big "New!" celebration when it unlocks, and the unlocks shown in My House and the Sticker Book.
9. [ ] **Faster and smoother everywhere.** Pages open quicker (load the big library files only when a page needs them),
       steady frame rate on older tablets, less battery use when paused, plus a speed test that fails if a page gets slow.
10. [ ] **Hub glow-up.** Game tiles with a tiny moving preview of the game, a friendly arcade mascot that waves hello and
       points to today's surprise, and seasonal hub looks (snow in winter, leaves in autumn). Still clean and simple
       (Keith, Nov 22: "way too much on it" stays the rule).

**Keith, Nov 13 (asked in chat): three things, in this order.**
1. [x] **Mini golf** ("simple, like a putt putt type"): done Nov 13 as Putt-Putt Park (`golf/`), 9 holes.
       Ideas for later: a second course (beach / candy / space), Friends taking turns, moving bridges, a loop.
       [x] (Nov 22, very late: **Seaside Cove**, a second 9-hole course on the beach: a Beach tab on the hole picker, opens after
       park hole 3. New: crabs that scuttle to and fro (bouncy), a boardwalk over the water, sandcastles, beach-ball bumpers,
       tide pools with fish, a "big wave" hill, a shipwreck pipe, a lighthouse windmill; 4 new trophies.
       Ideas left: a candy or space course, Friends taking turns, a loop.)
2. [x] **Fishing game worked on.** (Nov 13, later: Keith said it "should be a little easier": done, see the
       changelog. Nov 13, night: the looks + more to do are done too: rowboat, new water + lake bottoms,
       more detailed fish, a new catch screen; shells, the Shell Shop (4 baits, 8 aquarium things),
       My Aquarium, 8 goals per place. Ideas for later: a second boat color / hats in the shop, a
       night-fishing place, goals for the Frenzy rounds, trade fish with Friends.) Keith picked: **how it looks** (better drawings of the water, fish, boat and
       the catch screen) and **more to do** (goals and rewards: an aquarium, a bait or rod shop, challenges).
       Not asked for: changing how casting / reeling plays, or adding more fish.
       [x] (Nov 22, night: **Moonlight Bay**, the night-fishing place from the ideas list: a 4th place (opens after finding 14 kinds),
       6 glowing night fish (Glow Minnow, Lantern Buddy, Starry Fin, Neon Ribbon, Moon Puffer, Comet Koi), its own 8 goals, a Frenzy,
       2 trophies. Ideas left: a second boat color / hats in the shop, goals for the Frenzy rounds, trade fish with Friends.)
3. [x] **A game like Golden Axe**: (Nov 13 evening, after Keith played: less lag, more detailed characters, fewer hero
       hearts, hero + potions carry over with Next, 5 new baddies and bigger groups: all done.) First version done Nov 13 as **Potion Quest** (`quest/`): 3 heroes, potions +
       3 sizes of spell, 4 kinds of baddie + the Blob King, 3 stages. Ideas for more runs: more stages (snow, cave,
       sky), a second boss, a jump, two players together, creatures to ride, a hero shop. The brief was:
       **A game like Golden Axe**: a side-scrolling adventure with our OWN heroes and creatures (no copied
       characters or names; baddies poof into sparkles, per the design rules).
       [x] (Nov 22, night run: **Frosty Peak**, a 4th place from the ideas list (more stages + a second boss): snow, fir trees,
       falling snowflakes; new snowman baddies that roll snowballs (a blue dashed lane shows first: step out of the way, or
       bonk the snowball); the **Frosty King**, a big snowman boss who loses a snowball every third until he's just a head;
       a new trophy. Ideas left: a cave or sky stage, a jump, two players together, creatures to ride, a hero shop.)
       Keith picked what matters most:
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
3. [x] **Feel and look**: jumps / ramps on the normal tracks, drifting with sparks, weather (rain, snow),
       a bigger and happier win screen.
       (Nov 21: ramps and rain / snow / wind were already in (ramps from the 2nd track on, weather in Free Play and the cups).
       New: **drifting** (hold a full turn while going fast: the tail slides out, sparks go blue, orange, pink;
       straighten up = a Zoom! boost) and the **finish-line party** (1st: fireworks, a donut, the rivals smile, a big gold
       trophy; 2nd/3rd: a few fireworks + a silver/bronze trophy) + a **bigger podium** with bunting, confetti and a crown.
       Ideas for later: drift sparks for the rivals too, a "drift" sticker, ramps on track 1, a drift button for phones.)
       **That finishes Keith's RC plan.** Next: the Turbo Bike plan (#8 builder). (Nov 21, night: #8 done. then #9 done too: the Turbo Bike plan is finished.)
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
- [x] Piano Star (Nov 21, night: the song list has 6 picture tabs along the top (Easy, Medium, Tricky, Low notes, Two hands, Free Play) instead of one list of 65; results with Hear it)
- [x] Mini RC Racers (Nov 21, late night: the 10-tile main menu, Cups, Free Play / Time Trial (Race / Drive / weather as round buttons that stay put), My Car (3 tabs), Heart Battle, Coin Rush, Follow, Trophies (tap one, then Go!), the Item Book, the Garage between cup races, and every results screen as pictures: podium, cup trophy + podium, you vs Boo)
- [x] RC's Track Builder (`rc/builder.js`: My tracks, the drawing board) and RC's Friends rooms (make / join / lobby) (Nov 21, latest:
      the board is a picture inside the menu you draw on with a finger; tools on the right, worlds / things / looks under the board)
- [x] The Friends lobby (`arcade/net.js`): Make a room / Join (8 big picture keys) / the lobby, shared by Hoops, Bike, Bubble School,
      Fishing and Archery (Nov 21, with the RC rooms)
- [x] Maze Explorer's map (Nov 21, after the RC rooms: friends + every maze's stone as picture tiles, the dots and back as big buttons;
      opens scrolled to the maze you're on). The maze itself and its win stars stay as they are (they're the game, not a menu).
- [x] Coloring's picture picker + "Done!" (Nov 21, evening: 4 round picture tabs that stay put, every page as a big tile showing
      the colors so far, home at the bottom; My pictures has a trash button: tap a picture to mark it, tap again to take it down;
      "Done!" shows the finished picture next to the big star). The coloring screen itself (crayons, tools) stays HTML: it's the game.
- [x] The Sticker Book (Nov 21, Saturday night: every game page a colored card with the game's picture (tap = play it) and its 4 big
      stickers; 2 pages at a time, arrows / swipe / arrow keys turn the page, dots show where you are; tap a sticker = see it big,
      with how to get it + Play for ones you don't have yet)
- [x] The hub (Nov 21, late Saturday: picture tabs that stay put, every game a big colored tile with its medals, the Daily Surprise
      as 3 tiles, play again, a bar with who's playing / music / little-big / hearts / Sticker Book / My House; hearts: tap the
      heart button, then tap games; Who's playing? as big picture tiles. The player editor stays HTML: it has a name to type.)
      **Keith, to decide:** two runs built the hub at the same time (Nov 21). The other version is on the branch `hub-canvas-alt`
      (not on main): a heart in each game tile's corner (one tap, no heart mode), the player editor drawn on the canvas too with a
      real typing box for the name, and Grown-ups held for 3 s right on the hub. Say "use the alt hub" (or "take its corner hearts /
      its player editor") and the next run will bring that over; otherwise just delete the branch.
- [x] My House (Nov 21, Saturday night: the whole page is one Phaser screen: a top row of picture tiles (home, the 4 rooms,
      Friends, your coins), the room as a live picture you still drag things in (toy box, hops, "try me" wiggle), the room's spots
      next to it and the shop under it; tap a wall / the sky = its things; Friends rooms + visiting as canvas screens too)
- [x] The Parent corner (Nov 21, last run of the day: the door is a big "Hold for 3 seconds" button that fills up green; inside, picture tabs
      for each kid (their animal), This device (gear) and Help; each kid: minutes today / this week / stickers / trophies, the last 7 days
      and what they played as two charts, time limit as big buttons, + 15 minutes, music on/off + volume; device: all sound, sound
      effects, drawing quality; help: private by design, Report a problem, clear the history (tap twice)).
      **That finishes Keith's "rewrite everything with Phaser 3 + Rex UI" list** (still HTML on purpose: the games themselves, the
      coloring screen's crayons, the player editor's name box, and the "All done for today!" wall that covers every page).
      Next run: back to the open lists: RC plan #3 "feel and look" (Notes from Keith), then the Turbo Bike plan (#8 builder).

**Keith, Nov 22 (live, with a phone screenshot):** [x] "Initial screen still doesn't scroll, if you go into a game and exit it
does" (finger scrolling in every canvas menu now reads the page's own touches and where the menu is on the screen right
then, instead of Phaser's saved measurement; Phaser re-measures at every touch too). [x] "Way too much on it. Eliminate the
last game stuff, improve the layout, make it cleaner": the play-again row is gone; the hub is now tabs (one row, pictures
only) on top, a small logo + the games in the middle, and a bar of 5 at the bottom that always stays put (who's playing,
surprise, stickers, house, jukebox). Music, little/big and the hearts moved into Who's playing?. Upright menus use the
whole height of a tall phone. Keith: say if it still won't scroll on the first screen.

**Keith, Nov 21 (live, late):** [x] "Cant swipe up on phone" (finger drags never scrolled the Phaser menus: fixed, `dragScroll()`
in canvasmenu.js). [x] "Main load screen is different than when you exit from a game" (the offline copy opened an old hub:
pages now come from the internet first; scripts are saved with their ?v=). Keith: say if the hub still looks different.

**Keith, Nov 21 (live):** [x] "I don't like this being there" (the Daily Surprise row on the hub): Keith picked a present on
today's game tile + a present button in the bar that opens the surprise screen (done). [x] "Hoop Heroes ball isn't falling the
right way": baskets and misses now fall, bounce and roll back for real (done; Keith: say if it was something else you saw).
[x] Hoop Heroes: "the ball needs to be pushed up, hard on a PC" + "computer is scoring way too fast and making all the shots" (done:
the ball sits higher, a basket is a ~80-dot pull; rivals shoot every 1.5-2 s and make under half; star targets lowered).
[x] "The Daily Surprise row is still there": an old saved copy on the device; the hub now reloads itself when a new version arrives.

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
       [x] (Nov 22, evening: **bedtime** per kid (Off / 6:30-9 pm, until 6 am): a sleepy star says "Time for bed!"; hold 3 s or
       "15 more minutes tonight" for a little longer. Ideas left: a weekly summary, lock single games, a PIN instead of holding,
       a weekend bedtime.)
10. [x] **Keep it healthy**: tests run automatically on GitHub for every change, faster on older tablets,
       a "report a problem" button (grown-ups only, in the parent corner) that opens an email to Keith,
       keep `CLAUDE.md` accurate.
       (Nov 16: done. `.github/workflows/tests.yml` runs every test file on each push; the kit draws fewer pixels when a
       device is slow ("lite"); Report a problem is in the Parent corner. **Keith: the report email has no address filled
       in yet** (your address would be public in the repo): put one in `REPORT_EMAIL` at the top of `parent/parent.js`
       if you want, or tell the next run which address to use.)

**The 10-point plan is finished (Nov 16).** (Nov 22, very late: the run picked Putt-Putt Park's second course, **Seaside Cove**, done.) (Nov 22, night: the run picked 4 new animal pages: zebra, dolphin, parrot, raccoon.) (Nov 22, very last run: 4 new Things pages: ambulance, cement mixer, motorcycle, treehouse; Things tab now 34.)
Next runs: Notes from Keith first; otherwise the open items below
(**the Turbo Bike plan is finished** (Nov 21: #9 the daily ghost race). Nov 21: the run picked the coloring book's open list
(magic crayons + coloring sounds, done). Nov 21 (late night): the run picked the **Jukebox** (Music ideas below, done). Nov 22: the run picked Maze **bridges + tunnels** (done). Next: the open ideas below, e.g. Maze ideas (penguin / frog / owl friends, bridges),
the Jukebox / music maker, or ask Keith what he'd like next).

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
8. [x] **Better track builder**: loops, water, boost pads; share your track over Friends
       (Nov 17: loops, water, jelly pads and moving ramps went in the builder. Nov 21, night: the rest is done. **Boost pads**
       (a new piece: ride over the orange pad = Zoom!), a bigger builder (tap a box, then tap the piece to put in it; + and -
       for 4 to 12 boxes; a dice for a surprise track) and **race friends on your track** (the room maker's own track is a
       tile in the Friends room). Ideas for later: 3 saved tracks like RC, boost pads on a built-in track, a builder sticker.)
9. [x] **Daily ghost challenge** (with the daily surprise, plan point 4)
       (Nov 21, very late: done. A **Ghost** button on the title menu (+ a Ghost Race tile under the cups): every day a new track,
       you against **Wisp**, a friendly see-through ghost rider (no Zip, Moxie or Bolt). Beat him = a little ghost on today's
       spot in a 7-day strip, the first win of the day = 1 house coin, 2 new trophies (Ghost chaser; secret: Ghost week =
       7 days in a row). Big kids: Wisp finishes at par x 1.15 (gas + turbo + not too many tumbles beats him); little kids:
       a sleepy Wisp (par x 1.6) on the 7 gentler tracks. Ideas for later: Wisp does tricks, a ghost bike paint in the shop
       for 10 wins, a Daily Surprise "beat the ghost" challenge.)
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
- [x] Friends ideas: Hoops head-to-head, Bubble School quiz race (done Nov 6, see the 10-point plan #3)
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
- [x] **Jukebox** (Nov 21, late night): a jukebox button in the hub's bar opens `jukebox/`: all 43 songs of the arcade as picture tiles
      (the game's picture + the song's number), your animal dances on a little stage, 5 mix buttons (slow, fast, high, party,
      under water) and 4 drum pads (drum, clap, bell, ta-da) that always land on the beat.
      Ideas for later: record your own mix, a dance-move picker, more pads (shaker, whistle), a Jukebox sticker.
- [x] **Music for the coloring book and maze** (Nov 22, off by default): a music-note button on both pages (the maze's top bar,
      the coloring screen's top bar + the picture picker's bottom row). Coloring = a soft music-box lullaby in the same key as the
      fill "bloops"; Maze = a tiptoe ukulele + whistle tune that sounds far away in the dark caves. Saved per player; both songs
      are in the Jukebox too. Ideas for later: a second song per page, the maze tune speeding up near the treat.

### Coloring game
- [x] Hub screen with big picture buttons for each game
- [x] Coloring game: tap-to-fill with a big crayon palette, undo, clear, back to hub
- [x] Art converter: Firefly line art in `art/` becomes tappable coloring pages
- [x] 20 animals from Keith's first sheet + 20 fruits from his second sheet
- [x] Page picker screen: thumbnails of every page, grouped into Animals and Fruit tabs
      (picture tabs, no words) — there are 44 pages now, arrows alone are too slow
- [x] **Dragon** (plus unicorn and tiger) from Keith's Firefly art
- [x] Sound effects: soft "pop" on fill, cheerful jingle when a picture is finished (Nov 21: a bubbly "bloop" on every fill,
      a different note each time; magic crayons twinkle; the cheer + confetti on "Done!" was already in since Nov 12)
- [x] "Done!" celebration (confetti/stars) when every region is colored (Nov 12)
- [x] Save finished pictures to a gallery on the device (My pictures, Nov 12)
- [x] Switch to hand-drawn art in Keith's style (thick outlines, big simple shapes):
      6 animals, 7 fruits, 5 things that go, with a third picker tab (car)
- [x] **Grow every tab to 30 pages — 18 new pages per run (6 + 6 + 6)** (Keith, Oct 30; done Nov 11: 30 / 30 / 30).
      No suns in pictures. Veggies go in the fruit tab.
      - Animals 18/30: cat, fish, bird, dog, bunny, turtle, lion, elephant, pig, owl, penguin, duck,
        cow, frog, monkey, giraffe, snail, whale (Nov 9).
        Ideas (never the bear): horse, sheep, zebra, fox, hedgehog, butterfly, ladybug, bee,
        octopus, crab, dinosaur
      - [x] Animals 34 (Nov 22, later): **horse, dinosaur, seal, squirrel** added (the Animals tab is past 30 now).
        Ideas left: flamingo, deer, kangaroo, koala, panda, peacock
      - [x] Animals 38 (Nov 22, night): **zebra, dolphin, parrot, raccoon** added.
      - [x] Animals 42 (Nov 22, latest): **panda, koala, flamingo, deer** added. Ideas left: kangaroo, peacock, fox, hedgehog, sheep.
      - Fruit & veggies 19/30: apple, banana, strawberry, pear, cherries, orange, watermelon,
        grapes, pineapple, lemon, carrot, corn, broccoli, peach, kiwi, avocado, mushroom,
        tomato, pumpkin (Nov 9).
        Ideas: peas, potato, onion, eggplant, coconut, blueberries, mango, pepper, cucumber,
        lettuce, radish
      - [x] Fruit & veggies 34 (Nov 22, final run): **plum, beet, lettuce, garlic** added. Ideas left: lime, fig, apricot, celery, zucchini, turnip.
      - Things 17/30: car, airplane, house, sailboat, train, bus, fire truck, rocket,
        helicopter, tractor, castle, hot-air balloon, submarine, digger, lighthouse, tent,
        dump truck (Nov 9).
        Ideas: police car, ambulance, bicycle, scooter, motorcycle, ship, garbage truck,
        school, barn, tow truck
- [x] Brush/free-draw mode in addition to tap-to-fill (the brush tool, 3 sizes)
- [x] Sparkle/pattern colors (rainbow, stripes, dots) (Nov 21: **magic crayons**: a magic-wand button next to the crayons
      opens a third box of 12: rainbow, sunset, ocean, pink dots, blue dots, stripes, candy stripes, checks, zigzag, stars,
      hearts and glitter. They fill a part with the pattern, show in the picker, My pictures and My House's picture wall.
      Brush lines and stickers get the crayon's main color. Ideas for later: a rainbow brush, more magic crayons as Daily Surprise prizes.)

### Maze game
- [x] Maze game: drag a finger/animal from start to goal, wide paths, no walls-hurt
- [x] Shape changes after each completed maze (circle → heart → square → diamond → star)
- [x] Friendly character + reward at the end of each maze (bee → flower, bunny → carrot,
      mouse → cheese) with a star burst and a little jingle
- [x] Gentle difficulty steps (5x5 grid → 6x6 → 7x7, then stays at 7x7)
- [x] More maze friends (puppy → bone, monkey → banana, fish → shell, kitten → yarn) (Nov 19: they join after 3 / 6 / 9 / 12 mazes)
- [x] "Show me" hint: after a while with no progress, the path gently sparkles (Nov 19)
- [x] Maze map + pick your friend; house, apple, cloud shapes; dark lantern caves (Nov 19)
- [x] Penguin, frog and owl friends (Nov 21, last run: penguin -> ice cream after 15 mazes, frog -> lily pad after 18, owl -> the moon
      after 21) + every friend has its own little call (when picked on the map and when it reaches its treat)
- [x] Bridges + tunnels (Nov 22): from the 4th maze, a little wooden bridge with a tunnel under it (1 on Easy and for little kids,
      1-2 on Normal, 2 on Challenge). One path goes over, the other goes under; in the tunnel your friend peeks out see-through.
- [x] **The cheeky treat** (Nov 22, last run; "a moving treat" from the ideas): from the 5th maze, every 3rd maze has a treat that
      wiggles "catch me!", giggles and hops a few steps away along the paths when your friend gets close (1 hop for little kids
      and on Easy, 2 on Normal, 3 on Challenge), then waits to be caught. It never hops onto a bridge, the start, the key or
      behind the locked door; in a dark cave the spot it lands on lights up.
- [x] **Maze Maker** (Nov 22, latest run; "a maze-maker" from the ideas): the map's pencil button opens My mazes (3 per player).
      Drag a finger from dot to dot to dig paths (the shovel), rub them out (the eraser), tap to put your friend, its treat and up
      to 6 gems where you like, pick the colors, undo, start again, or roll the dice for a surprise maze to change. The green play
      button lights up once the friend can reach the treat. Playing your own maze is just for fun (no stars or friends saved).
- [ ] Maze ideas: Friends: two explorers in one maze; share a made maze with a friend's phone

### Polish
- [x] Music on/off for each player (hub + pause menu) and mute button (music stays on by default — Keith can say if it should start off)
- [x] Add to Home Screen support (PWA / offline play) (done: the 10-point plan #1)
- [x] Publish on GitHub Pages
- [x] Accessibility pass (contrast, reduced motion) (Nov 22, late: **Calm motion**: Parent corner -> This device -> Motion: Normal / Calm
      (also on by itself when the device's own "reduce motion" is set): menus appear without bouncing, nothing hops / pulses / floats,
      no confetti, no screen shake in Space Defender, Potion Quest and Turbo Bike. **Contrast**: a new test reads every word on the
      menus (hub, Parent corner, a game's title + levels, RC, Sticker Book, My House, Jukebox) and checks it against what's behind it:
      all were already readable. Short button words now sit in the middle of their button.
      Ideas for later: a "read it to me" speaker on menu tiles, bigger words for grown-ups, a colorblind-friendly check of the games.)

## Done
See `CHANGELOG.md`.
