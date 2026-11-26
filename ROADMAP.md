# Roadmap

The daily run works top-down through **Up next**. Keith can reorder, add, or cross
things off anytime — or leave notes below.

## Notes from Keith

_(Add requests here, e.g. "make the dragon bigger" — the next run handles these first.)_

**Keith, Nov 26 (live): "Create a claw game."** He picked: prizes go on a shelf in the game AND can sit in My House; grabbing is
"kid-fair" (how well the claw holds only depends on how near the middle of a toy it lands).
- [x] (Nov 26: **Claw Catch**, the 15th game. 4 machines (Toy Box, Ocean, Candy Shop, Star Station), 24 plush toys to win (each
  machine has 5 + 1 rare golden one), the Prize Shelf, a won plush in My House's toy spot, 4 stickers, 9 trophies, its own songs,
  one thumb + Show me + Star Road trails. Ideas for later: a two-player claw over Friends, more machines, seasonal prizes,
  a "surprise capsule" prize.)

**Question for Keith (from the Nov 23 RC playtest):** in Mini RC Racers, Left / Right turn the CAR, so when the car
drives down the screen they feel backwards, and that's where pretend big kids lose most races. Want an optional
"screen steering" switch (press the side of the screen the road goes to), or leave it as a skill to learn?

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
  Still open from part 2d: the race results screen scrolls a little on a computer (fixed Nov 23, with point 4 part 4); next: point 4's last part.)

**Keith, Nov 23 (live, phone screenshot): "It opens this screen, then for some reason it reloads. Work on the logos for this. I don't
think we need titles under them."**
- [x] (Nov 23: the hub no longer reloads itself after an update unless the page on screen is really old; the game tiles are
  shiny app-icon logos with no names, stars / medals / heart on a little pill under them.)

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
4. [x] **Better touch controls on phones and tablets.** Bigger, clearer on-screen buttons with pictures, the same layout
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
       [x] (Nov 23, part 4: **every game held upright and sideways, while playing.** New test `tests/test_orientation.py`: all
       12 arcade games + coloring + maze on a phone sideways, a phone upright, a small phone upright and a tablet both ways;
       Play is tapped like a child does, then: nothing sticks out, the game picture fills the screen one way, the touch buttons
       are on the screen, big enough (>= 60 px), never on top of each other or under the home / pause corners; a wide game on
       an upright phone shows "turn me" and waits, "play upright" plays; and the device is TURNED mid-game and back (the
       picture + buttons follow, the game goes on, no errors). Found + fixed: on a small phone held sideways (640 x 360) the
       coloring page was a tiny 130 px square (the crayon side took 430 px): the controls now take at most half, the page is
       240 px. Also fixed from glossy part 2d: the race results screen no longer scrolls a little on a computer (a results
       screen whose big picture is a bit too tall shrinks the picture to fit: `screen.fit` in canvasmenu.js).
       **Point 4 is finished.** Next: point 5, the playability check.)
5. [x] **Playability check, game by game.** Let the test robots play every level on Easy / Normal / Challenge, measure how
       often they win and where they get stuck, and fix the unfair spots (too-hard jumps, long boss fights, checkpoints too
       far apart). Easy must really be easy; little kids should almost always finish.
       [x] (Nov 23, part 1: **the playtest robot + Putt-Putt Park + Potion Quest.** New `tools/playtest.py`: pretend
       children play many times and it prints a table per game (`python3 tools/playtest.py golf` / `quest [big|little] [s3]`).
       Putt-Putt Park's pretend child sees the best putt but its hand wobbles (aim + power; little kids more,
       `__golfPlaytest`); Potion Quest's reacts late, misses bonks, wanders, rarely uses magic (`__questBot('kid')`).
       Found + fixed: **the Blob King** (Castle Bridge) took big kids 3-7 tries and 8-14 bumps: his landing ring now shows
       through the wind-up AND the hop (~2 s to walk out) and he lands exactly there: now 1 try, 1-3 bumps. **Mushroom
       Woods**: the last wave (8 baddies) was 6 slower ones and wave 4 has 2 minis fewer: 1-4 tries -> 1 try. Golf:
       **Bumper Garden** (an "easy" hole) had its big bumper on the straight line: 4.3 putts -> 2; **Boardwalk** a bit wider
       (little kids splashed); **Lighthouse** (beach 9) shorter windmill blades: little kids 6.9 -> 5.3 putts. Test
       `tests/test_playtest.py`. Little kids already won every Potion Quest place first try. Next part: Jungle Jump +
       Treasure Trail (they have bots too), then Turbo Bike, RC, Space, Archery, Hoops, Fishing, Bubble School.)
       [x] (Nov 23, part 2: **Jungle Jump + Treasure Trail.** Pretend children for both (`python3 tools/playtest.py jungle` /
       `trail [big|little] [level]`): big kids jump a moment late, let go of the leaf too soon, sometimes pick the 2nd-best
       move; little kids play one thumb and tap when the hero stops. Every level / adventure was won on the first go by both.
       Found + fixed (one thumb, Jungle Jump): a **spring or jelly block threw the hero onto the thorns behind it** (Snowy
       Hills, Candy Land, every time) -> in the air he now steers / glides to a safe landing (`landSafe()`); an **auto-roll
       went right over thorns** (Glow Cave, Treetop Trail) -> a roll checks the whole way (`rollSafe()`); **ice** in front
       of thorns made him slide in -> he stops sooner; a **stale "is the glide safe?" answer** stuck around after Again /
       a new level (clock went back to 0); pretend little kids found only 10-35% of the goodies = always 1 star -> goodies
       close by **fly to the hero** (`MAGNET`) and 2 stars start at a quarter. Bumps for little kids: ~1.5 a level -> ~0.1.
       Treasure Trail: the **tunnel bat** hovered right over the tunnel treasure (a bump nearly every time) -> it turns back
       before it; **hippos blow bubbles** for a moment before they dip; the vine is a bit easier to catch on Normal (54, was 48).
       Still to look at: big kids spend 2-4 minutes at Treetop Trail's lift / hill (others take under 1); Glow Cave + Jelly
       Hills cost big kids 2-3 falls (still won first go). Next part: Turbo Bike + Mini RC Racers.)
       [x] (Nov 23, part 3: **Turbo Bike + Mini RC Racers.** Pretend children for both (`python3 tools/playtest.py bike` /
       `rc [big|little] [track]`; `kidThink()` in each game, `__bikeKid` / `__rcKid`, fast-forward with `__bikeStep` /
       `__rcStep`). Bike, found + fixed: on Normal children **hold Gas over every jump** = nose-first tumbles, and off a
       fast **table top** even hands-off tumbled -> on Easy / Normal a button held since take-off doesn't tilt, and hands
       off the whole jump never tumbles (`b.held`, `b.handsOff`); **"Too hot!" was a surprise** -> steam + 3 rising beeps
       at the bike first; too hot on a hill **stopped the bike dead** -> it putters on (`putter`); one thumb had **no turbo,
       so no gold** on the first tracks -> auto turbo while cool (`b.autoTurbo`); Candy Bounce par 10.4 -> 11.4. RC: the
       **one-thumb self-driving ran wide on almost every bend** (12-35 s a race on the grass, hands off!) -> it looks at the
       bends ahead and steers for the middle of the road; near the edge a wrong-way press loses to the helper; rivals
       hurry more for little kids; a car **lost on the grass** (moving, so never "stuck") is lifted back after 4 s (3 little).
       Still open: big kids mix up left / right when the car drives down the screen (the robot's guess: 1 in 5 turns),
       which costs them most RC races on the harder tracks: Keith to decide (see Notes). Next part: Space, Archery, Hoops.)
       [x] (Nov 23, part 4: **Space Defender, Archery, Hoop Heroes.** Pretend children for all three (`python3 tools/playtest.py
       space` / `archery` / `hoops [big|little] [level]`; `kidThink()` in each game, `__spaceTest.kid` / `__archeryKid` /
       `__hoopsKid`, fast-forward `__spaceTest.step` / `__archeryStep` / `__hoopsStep`). Hoops, found + fixed: the **aim help
       aimed at where a sliding hoop WAS**, so Wiggle Wes beat everyone (little kids 0 of 6, big kids 16% in) -> it aims where
       the hoop will be when the ball gets there (little kids now win every round); on Challenge big kids **never beat Wes or
       the Champ** (0 of 12) -> a bit more help + hoop 0.225 on Challenge, rivals no faster on it, Wes's hoop slower (0.9) and
       Wes / the Champ shoot a little less often: now ~2 of 3 rounds; High Score's star marks 20% lower on Easy. Archery:
       Easy + Normal fine; on Challenge (no aiming dots) Big Blizzard was won 3 of 6 -> **the last shot's flight stays as faint
       dots** on Normal / Challenge (an arrow that flew off the screen left no clue), Big Blizzard's targets a bit bigger + a
       slower slide, goal 15 (was 17); Frosty Flip turns slower, goal 10. Space: every sector won on the first go by both kinds
       of pretend kid (0-3 bumps); a boss's **lasers** bumped them most -> 2 beams at a time on Easy / Normal (was 3).
       Next part: Fishing + Bubble School, the last of point 5.)
       [x] (Nov 24, part 5: **Fishing Frenzy + Bubble School.** Pretend children for both (`python3 tools/playtest.py
       fishing` / `abc [big|little] [level]`; `kidThink()` in each game, `__fishingKid` / `__abcKid`, fast-forward
       `__fishingStep` / `__abcStep`). Fishing, Easy + Normal fine (stars everywhere, little kids 2-3 stars everywhere);
       on **Challenge (Moonlight Bay)** every early tap on a nibble scared the fish away (4-12 fish lost in a 3-minute go)
       and reeling took ~20 s a fish (the green part is narrow, a child's thumb is a moment late), so the Frenzy gave
       0 stars in 4 of 6 rounds -> each fish forgives 1 early tap on Challenge (2 on Normal, was 1), **just outside the
       green (a new pale-green edge) still reels in at half speed**, Challenge Frenzy star marks x0.9 (were x1.05): now
       a star every round, ~15 s a fish. Bubble School: little kids tapped **the same wrong bubble again and again** (up
       to 13-18 taps on one question, each a "miss") -> a tried wrong bubble goes see-through and smaller and tapping it
       again is no new miss; **after 2 wrong tries on Easy (3 on Normal) the right bubble glows** and the question is read
       again; stars count the questions that needed a 2nd try (not every wrong tap; on Easy 3 stars with 2 of them, 2
       stars up to 5): little kids got 1 star on most topics, now mostly 2; bubbles still growing in (invisible) can't be
       tapped any more. **Point 5 is finished.** Next: point 6, "Show me" how to play.)
6. [x] **"Show me" how to play.** The first time a kid opens a game (and from the help button), a short moving demo:
       a see-through hand shows the moves, then "Your turn!". No reading needed. Replaces the still how-to pictures where
       a demo is clearer.
       [x] (Nov 24, part 1: **the kit's "Show me" + the 4 pull-and-tap games.** The first time a player presses Play, the
       REAL game plays itself for about 6-7 seconds while a see-through hand does the moves (a white ring pulses where
       the finger presses), with an eye picture in the corner = "watch"; then a big green "Your turn!" and the round
       starts fresh. Hoop Heroes: the hand pulls the ball down and lets go (2 baskets); Putt-Putt Park: finger on the
       ball, pull back the other way, let go (the test bot's best putt); Bullseye Adventure: pull back toward Pip and let
       go (a target, then a balloon); Bubble School: listens, then taps the right bubble (2 questions). Any tap or key
       skips it; the Help and Pause screens have a yellow **Show me** button (pointing hand) to watch it again. Nothing the
       demo does counts (no saves, stars, trophies, Daily Surprise). Test `tests/test_showme.py`.
       Next part: the button games (Turbo Bike, Mini RC Racers, Jungle Jump, Treasure Trail, Potion Quest, Space
       Defender, Fishing Frenzy): the hand presses the on-screen buttons (key pictures on a computer); they need TWO
       hands at once (hold Right + tap Jump), so the kit's hand gets a left + right thumb first. Then Piano Star.)
       [x] (Nov 24, part 2: **two hands + 4 button games.** The demo has a left hand too (the same see-through hand,
       mirrored): the left thumb presses the left buttons while the right thumb presses the right ones, at the same
       time. On a computer the key pictures sit on the same sides (arrows left, Space right). Turbo Bike: the right
       thumb holds Gas, then Turbo, then Gas again while the left thumb changes lanes (only where both lanes are flat);
       Jungle Jump: the left thumb holds Right, the right thumb taps Jump before gaps / thorns / steps and Roll into
       rocks and critters; Treasure Trail: the left thumb holds Right and lets go to wait at a snake, the right thumb
       jumps over logs and snakes and onto the vine; Fishing Frenzy: hold Cast to 3/4 power, lure up / down to a fish,
       wait out the little nibble, tap on the big dip, then hold / let go to keep the needle in the green (fish come
       quickly in the demo, and it ends a moment after the catch). One-thumb players see only the one big button.
       Next part: Mini RC Racers, Potion Quest, Space Defender, then Piano Star.)
       [x] (Nov 24, part 3: **Mini RC Racers, Potion Quest, Space Defender.** RC: a short countdown, then the right
       thumb holds Gas, taps the gift (the demo gets a turbo at "Go!") and holds Gas again, while the left thumb steers
       into the bends; one thumb: the car drives itself and the thumb only steers. Potion Quest: no "Pick your hero" in
       the demo; the left finger presses on the ground where to walk, the right thumb bonks when a baddie or a jar is
       close and casts the magic once when there's a crowd; one thumb: only Bonk. Space Defender: one finger slides a
       little behind the ship (never on top of it), so the ship lines up with the robots and dodges the bubbles while it
       fires. Also fixed: pressing Escape to pause Mini RC Racers sometimes jumped to its main menu instead of the
       Pause screen (a key pressed while a menu was asleep went to the old menu).
       Next part: Piano Star, the last of point 6.)
       [x] (Nov 24, late night, part 4: **Piano Star.** The see-through hand taps the glowing key, note after note (low
       on a white key, near the tip of a black one), so the song really plays along; in a two-hands song the left hand
       taps the low left-hand note right after the right hand taps its note; in Free Play the hand plays a little tune up
       and down the keys. As everywhere: once per player, a tap skips it, Show me on Help + Pause, nothing counts.
       **Point 6 is finished.** Next: point 7, more to play where a game feels short.)
7. [x] **More to play where a game feels short.** New levels for the games with the fewest: Archery (a 4th place),
       Treasure Trail (2 new adventures), Hoop Heroes (new challenge courts), Bubble School (shapes + colors topics),
       Space Defender (an easier "starter" sector for little kids).
       [x] (Nov 24, part 1: **Bubble School: Colors + Shapes**, two new topics for the youngest, right after Count to 5
       and open from the start (they don't lock anything, old saves play as before). The bubbles show paint blobs /
       shapes instead of words. Colors: "Find blue!" (little kids see the blob to match + the word; big kids only hear it
       and see the word) and "What color is the apple?" (a white apple, banana, water drop, leaf, carrot, grapes or pig
       that fills in with its color when you pop the right bubble). Shapes: "Find the heart!" (the shape in white on the
       card, every bubble a different color so it's the shape that counts) and "What shape is the pizza?" (ball, present,
       pizza; big kids also egg, kite, door). Little kids: 3 bubbles, 6 colors / circle, square, triangle, star, heart;
       big kids: 4 bubbles, + pink, brown, rectangle, oval, diamond. Finishing Shapes brings a new sea friend, the
       **Pufferfish**; both = the "Rainbow shapes" trophy; both are in the Friends quiz race too. Test
       `tests/test_abc_topics.py`. Next part: Space Defender's starter sector for little kids, then Archery's 4th place,
       Treasure Trail's 2 new adventures, Hoop Heroes' new courts.)
       [x] (Nov 24, latest, part 2: **Archery's 4th place, Autumn Woods**: 3 levels (Leaf Fall, Tree Swing, Golden Woods at sunset),
       a new kind of target that **swings on two ropes** from a wooden swing frame, orange hills with round red / gold trees, a
       red barn + silo, pumpkins, falling leaves that follow the wind, geese, fireflies at sunset, its own song, and a Friends
       place. Each level now says its own difficulty (`diff`), so the old levels kept theirs. Next part: Space Defender's
       starter sector, then Treasure Trail's 2 new adventures, Hoop Heroes' new courts.)
       [x] (Nov 24, latest, part 3: **Space Defender: Cloud Park**, an easy starter sector before sector 1, open from the
       start (it doesn't lock anything). A soft blue sky with puffy clouds and its own happy bell song. Only gentle
       bobbers and little squads fly in (nobody shoots), everything is slower, presents drop more often, one more life,
       and bumping into a robot just pops it ("boing", no bonk). Mini boss: **Baby Bobber** in a propeller cap (one big
       slow bubble, a few baby bobbers); big boss: **the Big Puffy Cloud**, a sleepy cloud with a rainbow that opens its
       eyes and puffs its cheeks before it blows a slow bubble or drizzles a few raindrops in marked columns. About a
       minute. New trophy "Cloud hug". Play sends little kids there first (also little kids who are further along);
       big kids only on their very first Play. Test `tests/test_space_starter.py`; the playtest robot flies it too.
       Next part: Treasure Trail's 2 new adventures, then Hoop Heroes' new courts.)
       [x] (Nov 24, latest, part 4: **Treasure Trail: 2 new adventures**, after Sunset Swamp. **Rainbow Falls** (11 rooms): a rainbow,
       cliffs with waterfalls rushing down, spray and blue butterflies, and a new room: **the raft**, a river too wide to jump; the
       raft waits at the bank, you step on, it floats you across (a little rope fence keeps you on) and you step off. **Mushroom
       Hollow** (12 rooms): giant spotty mushrooms instead of trees, glowing spores floating up, and a new room: **bouncy mushrooms**
       with happy faces in a pond; land on one and BOING over to the next (a treasure hangs up high on the way). Little kids (one
       thumb) wait for the raft by themselves, and one tap at the mushroom pond bounces them across. 3 new trophies (Raft ride, Boing
       boing, Over the rainbow). Pretend big + little kids win both on the first go. Test `tests/test_trail_new.py`.
       Next part: Hoop Heroes' new challenge courts, the last of point 7.)
       [x] (Nov 24, latest, part 5: **Hoop Heroes: 4 challenge courts**, on a new "Courts" tab of the picker (the rivals have
       their own tab). No rival: a twist instead, and your score earns the stars. **Golden Balls** (every 3rd ball glows gold
       and is worth 5), **Up and Down** (the hoop rides up and down), **Near and Far** (the hoop glides close and far away;
       far = 3 points, the backboard says so), **Hot Shots** (the net starts on fire: baskets on fire are worth 3, a miss puts
       it out, 2 in a row lights it again). The first court is open from the start, each one opens the next. A star on all
       four = the Court star trophy + a new **Disco ball**; also a "Golden touch" trophy. Every level now says its own
       difficulty, so the rivals kept theirs. Star marks from the playtest robot. Test `tests/test_hoops_courts.py`.
       **Point 7 is finished.** Next: point 8, something to work towards in every game.)
8. [x] **Something to work towards in every game.** A star counter per game that unlocks a new look every few stars (a hat,
       a color, a trail), a big "New!" celebration when it unlocks, and the unlocks shown in My House and the Sticker Book.
       [x] (Nov 24, part 1: **the Star Road in the kit + 4 games.** Every star counts towards new looks: 4 hats (party hat,
       flower crown, crown, star hat) and 4 trails (sparkles, hearts, bubbles, a rainbow), the first after 2 stars, then every
       few. A **Looks** button on the title menu (a NEW star when something new is there) opens the Looks screen: tap one to
       put it on, tap again to take it off; locked ones show how many stars they need. A round that reaches a new look shows
       a big purple **"New!"** with the look in a golden glow, confetti and a jingle: "Wear it!" or OK, then the results. The
       title menu and the results have a little chip: your stars / the next look. "New game" never takes a look away.
       **Jungle Jump**: hats on every hero + trails; **Putt-Putt Park** + **Hoop Heroes**: the ball's trail; **Space
       Defender**: the trail streams out of the ship's engine. Test `tests/test_looks.py`.
       Next part: the other games (Treasure Trail, Potion Quest, Archery, Turbo Bike, Mini RC Racers, Fishing, Bubble School,
       Piano Star; "a color" fits the bike + RC car), then the looks in My House + the Sticker Book.)
       [x] (Nov 24, part 2: **Treasure Trail, Potion Quest, Fishing Frenzy.** Treasure Trail: the trail floats out behind the
       explorer while walking (trails only: the explorer already has 6 hats of its own). Potion Quest: the hats go on any of
       the three heroes instead of the helmet / hood / wizard hat, and the trail follows you as you walk. Fishing Frenzy: the
       angler wears the hat instead of the place's own one, and the trail follows the lure, through the air on a cast and
       down under the water. **Archery is left as it is**: it already has its own hats + arrow trails that unlock with stars.
       Next part: Turbo Bike + Mini RC Racers (with a new kind of look, "a color" for the bike / car), Bubble School, Piano
       Star; then the looks in My House + the Sticker Book.)
       [x] (Nov 24, night, part 3: **Turbo Bike + Mini RC Racers.** Turbo Bike: **hats on the rider's helmet** + a trail
       streaming out of the back wheel; Mini RC Racers: a trail behind your car (every race kind + Heart Battle) and a pink
       **Looks** button at the bottom of its own main menu (a red NEW star when something's new). No "color" look yet: both
       already have paint in their shops (Bike Shop, My Car), so a Star Road color would double up. Test `tests/test_looks_more.py`.)
       [x] (Nov 24, night, part 3b (an overlapping run): **colors after all**, as the plan asked: 4 paint jobs that slowly
       glide between their colors (Bubblegum pink-lilac, Ocean blue-green, Sunset yellow-orange-red, Galaxy purple-blue,
       which twinkles on the RC car), on the Star Road of both racing games next to the hats + trails. They don't double up
       with the shops: picking a paint in the Bike Shop or RC's My Car takes the color look off, so the new paint shows.
       Next part: Bubble School + Piano Star (no hero: a magic finger trail / sparkles off the keys), then the looks in My
       House + the Sticker Book.)
       [x] (Nov 24, latest, part 4: **Bubble School + Piano Star.** Both get the 4 trails (no hero to put a hat on), a
       Looks button and the "New!" moment. Bubble School: the trail follows your finger as it slides over the water, a little
       puff of it comes out wherever you tap, and the right bubble bursts into it. Piano Star: every key you press sparkles
       your trail up out of the key (songs, Free Play and your own tunes playing back; not while the piano plays "Listen").
       Kit: `g.looks.splash()`. Test `tests/test_looks_tap.py`. **Every arcade game is on the Star Road now.**
       Next part (the last of point 8): show the looks in My House + the Sticker Book.)
       [x] (Nov 24, latest, part 5: **the looks in My House + the Sticker Book.** My House has a new **Looks** tile (the
       party hat) in its top row: your animal big in a golden glow, then every hat and trail; the ones you earned in ANY
       game can be tapped on and off, the rest have a padlock. The hat sits on your animal's head in every room, the trail
       puffs out when it hops and follows it while you drag it about, and friends who visit see your hat + trail too.
       The Sticker Book has a pink **Looks** button at the bottom: one card per game (11 games; Archery keeps its own),
       the looks you have bright and the ones still to earn pale with a "?", a count (e.g. 7 / 68); tap one to see it
       big (and Play for ones still to earn). Kit: `Arcade.looks.GAMES` / `roadOf()` / `gotIn()` / `owned()` / `puff()`.
       A look shows up outside its game once the game has been opened after the stars were earned. Test
       `tests/test_looks_book.py`. **Point 8 is finished.** Next: point 9, faster and smoother everywhere.)
9. [x] **Faster and smoother everywhere.** Pages open quicker (load the big library files only when a page needs them),
       steady frame rate on older tablets, less battery use when paused, plus a speed test that fails if a page gets slow.
       [x] (Nov 24, part 1: **smaller files + less work when nothing moves + the speed test.** Every page loads Phaser +
       Rex UI for its menus, so instead of skipping them they got smaller: Rex UI is now our own build with only the 7
       menu parts the arcade uses (268 KB instead of 824 KB, `tools/make_rexui.py`), Phaser is its build without the unused
       "Matter" physics (1048 KB instead of 1154 KB); the Sticker Book only loads Swiper when its fallback book needs it. So
       every page has about 690 KB (a third) less to read before the first menu shows. **Pacing:** a menu that just sits
       there draws ~30 pictures a second instead of 60 (or 120 on fast tablets), and every frame again the moment a finger
       touches it or a screen pops in; a paused game's picture is drawn once a second instead of 60 times; a game behind
       its title menu 30 a second. Playing is unchanged. `tests/test_speed.py` fails if the files grow back, a page takes
       too long to show its first menu, or a still menu / paused game gets busy again.
       [x] (Nov 24, part 1b, an overlapping run, added on top: **nothing drawn behind a title screen** (it covers the game
       completely) and **the nap**: a menu nobody touches for 40 seconds (a tablet left on the hub or a title screen)
       slows to 10 pictures a second; the first touch, key or mouse move wakes it, and that tap still counts. Both
       checked in `tests/test_speed.py`.)
       [x] (Nov 25, a top-up from a third overlapping run: every page preloads the two menu fonts from its `<head>` when
       opened from a web address, so the first menu doesn't wait for them; checked in `tests/test_speed.py`.)
       Next part: a steady frame rate on older tablets (find the slowest drawing in each game and make it cheaper).)
       [x] (Nov 24, night, part 2: **a steady frame rate on older tablets.** A new tool times every game's pictures
       (`tools/frametime.py`): Hoop Heroes was by far the slowest (three whole machines with wire mesh + glowing lights,
       ~30 ms a picture on the test computer), then Jungle Jump, Archery, Treasure Trail, Potion Quest. Hoops now paints
       each machine's cage once and copies it, its neon tubes too, and its bulbs / LEDs glow with a ready-made glow picture
       instead of a blur (~19 ms, a third less); Jungle Jump paints its sky once and its scenery strips at the screen's own
       sharpness; Archery, Treasure Trail and Potion Quest copy only the painted rows of their hills / ground layers
       (`Arcade.draw.layer()`; 15-30% quicker). For every game: the picture is opaque (less work for the browser), the
       lite drawing for slow tablets now switches on after 2.5 seconds of slow play in a row instead of 150 slow frames
       (that was 15 s of jerky play on a tablet managing 10 a second), and in lite the glows are skipped (blurs are among
       the slowest things to paint). `tests/test_frames.py` checks all that and gives every game a drawing budget.
       **Point 9 is finished.** Next: point 10, the hub glow-up.)
       [x] (Nov 25, an overlapping run, added on top: **Jungle Jump's tiles** were still drawn one by one every picture (dirt,
       pebbles, grass tops, outlines: ~1300 drawing steps a picture); now the level is painted once in tall strips and copied
       (~250, the picture looks the same, the strip ahead is painted before you reach it; the cave crystals are painted once
       too). **Treasure Trail** stopped for a blink at each new room (painting it); now the next room is painted ahead, a layer
       a picture, while you play, so walking in just swaps it in. Both checked in `tests/test_speed.py`.)
10. [x] **Hub glow-up.** Game tiles with a tiny moving preview of the game, a friendly arcade mascot that waves hello and
       points to today's surprise, and seasonal hub looks (snow in winter, leaves in autumn). Still clean and simple
       (Keith, Nov 22: "way too much on it" stays the rule).
       [x] (Nov 25, part 1: **Bop, the arcade's mascot.** A round sunny-yellow buddy with a pink star on his antenna stands
       next to the Kids Arcade logo on the hub. When the arcade opens he hops, waves hello, then points at a little speech
       bubble with **today's surprise present** in it (the opened present once it's done); tap him and the surprise screen
       opens. He breathes, blinks and waves again now and then. Nothing extra on the hub: he uses the room beside the logo
       (no Bop while picking hearts or on a phone held sideways, where there's no room). Calm motion: he just stands there
       pointing. His drawing is `arcade/mascot.js`; test `tests/test_mascot.py`.
       Next parts: seasonal hub looks (snow in winter, leaves in autumn; Bop can dress for the season too), then tiny moving
       previews on the game tiles.)
       [x] (Nov 25, part 2: **seasonal hub looks.** The hub follows the calendar: **winter** (Dec-Feb) = snowflakes drifting
       down behind the games and a snow cap with icicles along the top of the menu, Bop in pink earmuffs + a red striped
       scarf; **spring** (Mar-May) = pink cherry petals, blossoms in the two top corners, Bop in a flower crown; **summer**
       (Jun-Aug) = soap bubbles floating up, summer flowers in the corners, Bop with sunglasses up on his head; **autumn**
       (Sep-Nov) = orange / red / yellow leaves tumbling down, leaves in the corners, Bop in a cozy scarf with a leaf on his
       head. Only a few things at a time, always behind the game tiles (taps work as before); nothing falls in Calm motion
       or on a slow tablet (the corners + Bop's clothes stay). `Arcade.season()` in `arcade/mascot.js`, `seasonFx()` in
       canvasmenu.js; test `tests/test_seasons.py`. Next part: tiny moving previews on the game tiles, the last of point 10.)
       [x] (Nov 25, part 3: **tiny moving previews on the game tiles.** Every game's icon on the hub now plays a short
       moving preview of its game, one tile at a time, taking turns, with a little rest in between: the bike hops, the
       car drives off along the road and comes back round, the basketball arcs in and swishes through the net, the golf
       ball rolls into the hole (the flag wiggles), the arrow flies into the target, the monkey swings on its vine, gems
       hop out of the treasure chest, the potion wobbles + the star spins + the blob hops, the rocket blasts off and flies
       back in, the bubbles float + the school monster hops, the paint dots pop while the crayon scribbles, the smiley walks
       the maze path to the star, the fish wiggles and jumps, the music notes bounce. Each ends exactly like the icon (the
       test compares the pixels). Only tiles you can see play; none while picking hearts, in Calm motion, on a slow tablet
       or while the hub naps; the hub still rests at 30 pictures a second, and its pictures load only when a tile's turn
       comes, so the hub opens as fast as before. The maze icon lost one wall the dotted path went through. Parts + moves:
       `arcade/previews.js`; "Tile previews" in canvasmenu.js; preview `tools/preview_tiles.py`; test `tests/test_previews.py`.
       **Point 10 is finished, and with it the new 10-point plan.**)

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

**The 10-point plan is finished (Nov 16).** (Nov 22, very late: the run picked Putt-Putt Park's second course, **Seaside Cove**, done.) (Nov 22, night: the run picked 4 new animal pages: zebra, dolphin, parrot, raccoon.) (Nov 22, very last run: 4 new Things pages: ambulance, cement mixer, motorcycle, treehouse; Things tab now 34.) (Nov 26, latest: 4 new Things pages: drum, mailbox, pickup truck, toy blocks; Things tab now 46.) (Nov 26, newest: 4 new animal pages: guinea pig, skunk, camel, starfish; Animals tab now 58.) (Nov 26, night: 4 new fruit pages: papaya, olive, artichoke, dragon fruit; Fruit tab now 50.) (Nov 26, late: 4 new Things pages: wagon, skateboard, guitar, alarm clock; Things tab now 50.) (Nov 26, latest: 4 new animal pages: seahorse, puffin, moose, bat; Animals tab now 62.) (Nov 26, newest: 4 new fruit pages: blackberry, cranberries, kumquat, asparagus; Fruit tab now 54.)
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
- [x] **Claw Catch** (Keith, Nov 26): a claw machine full of plush toys; prize shelf + My House; `tests/test_claw.py`

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
      - [x] Animals 42 (Nov 22, latest): **panda, koala, flamingo, deer** added.
      - [x] Animals 46 (Nov 25): **kangaroo, tiger, hamster, walrus** added (fox, hedgehog + sheep were already in). Ideas left: peacock, otter, sloth, alpaca, guinea pig.
      - [x] Animals 50 (Nov 26): **otter, sloth, alpaca, peacock** added. Ideas left: guinea pig, owl chick, seahorse, beaver, goat.
      - [x] Animals 54 (Nov 26, night): **turkey, goat, beaver, rhino** added. Ideas left: guinea pig, owl chick, seahorse, camel, skunk.
      - [x] Animals 58 (Nov 26, newest): **guinea pig, skunk, camel, starfish** added. Ideas left: owl chick, seahorse, puffin, moose.
      - [x] Animals 62 (Nov 26, latest): **seahorse, puffin, moose, bat** added (owl chick skipped: the owl is already in). Ideas left: ostrich, mole, cheetah, lamb.
      - Fruit & veggies 19/30: apple, banana, strawberry, pear, cherries, orange, watermelon,
        grapes, pineapple, lemon, carrot, corn, broccoli, peach, kiwi, avocado, mushroom,
        tomato, pumpkin (Nov 9).
        Ideas: peas, potato, onion, eggplant, coconut, blueberries, mango, pepper, cucumber,
        lettuce, radish
      - [x] Fruit & veggies 34 (Nov 22, final run): **plum, beet, lettuce, garlic** added. Ideas left: lime, fig, apricot, celery, zucchini, turnip.
      - [x] Fruit & veggies 38 (Nov 25, night): **fig, cauliflower, celery, turnip** added. Ideas left: lime, apricot, zucchini, cabbage, sweet potato.
      - [x] Fruit & veggies 42 (Nov 26): **lime, apricot, zucchini, cabbage** added. 
      - [x] Fruit & veggies 46 (Nov 26, late night): **sweet potato, raspberry, chili pepper, peanut** added (radish, blueberries,
        coconut + mango were already in; an acorn squash was tried but looked like the pumpkin). Ideas left: blackberry, papaya, olive, green beans, cranberries.
      - [x] Fruit & veggies 50 (Nov 26, night): **papaya, olive, artichoke, dragon fruit** added (a green bean was tried but
        looked like a banana / a slug, so the dragon fruit took its place). 
      - [x] Fruit & veggies 54 (Nov 26, newest): **blackberry, cranberries (a bowl of them), kumquat, asparagus** added (green beans
        still skipped). Ideas left: starfruit, brussels sprout, leek, cantaloupe.
      - Things 17/30: car, airplane, house, sailboat, train, bus, fire truck, rocket,
        helicopter, tractor, castle, hot-air balloon, submarine, digger, lighthouse, tent,
        dump truck (Nov 9).
        Ideas: police car, ambulance, bicycle, scooter, motorcycle, ship, garbage truck,
        school, barn, tow truck
      - [x] Things 38 (Nov 25, late night): **tow truck, school, race car, snowman** added. Ideas left: crane, fire station, sled, teapot, robot.
      - [x] Things 42 (Nov 26, evening): **crane, fire station, teapot, robot** added.
      - [x] Things 46 (Nov 26, latest): **drum, mailbox, pickup truck, toy blocks** added.
      - [x] Things 50 (Nov 26, late): **wagon, skateboard, guitar, alarm clock** added (garbage truck, scooter, barn + kite were
        already in, so the old ideas list was out of date). Ideas left: sled (hard from rounded shapes), tricycle, rocking horse, lamp, sandcastle.
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
