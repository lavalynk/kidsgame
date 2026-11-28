# Changelog

Newest first. Written for humans.

## 2026-11-28 (Saturday, later) — Winter Wonderland: snowy places
Point 6 of the 20-point plan, part 2 (the last part).

From **December 1 to the end of February** four games get a snowy place (it melts away in spring and comes back next winter;
anything a child did there is kept):

- **Putt-Putt Park: Snowy Hollow.** A new Snow tab with 3 holes: a frozen puddle the ball glides right across, snowmen
  that bounce the ball like bumpers, and soft snow drifts that slow it down. Snow falls, pine trees wear snow.
- **Turbo Bike: Frosty Village.** A snowy evening race past little houses with lit windows and twinkly decorated trees. Snow
  drifts across the track go POOF in a cloud of powder when you ride through (or jump over them to stay fast).
- **Fishing Frenzy: Ice Fishing.** Icy Lake freezes over: you fish through 3 round holes in the ice (every cast drops into
  the nearest hole), with the fish swimming under the ice. The catches count in the Fish Book and Icy Lake's goals.
- **Archery: Snowman Party.** Snowmen with top hats stand in the snow: hit a hat and it flies off (+10).
- Each one has its own trophy (Snow champ, Ice glider, Snow rider, Ice fisher, Hat trick).
- **4 new snowy coloring pages** (these stay all year): igloo, sled, snow globe and a woolly hat.

**Point 6 is finished.** Next: point 7, color by number in the coloring book.

## 2026-11-28 (Saturday) — Winter presents
Point 6 of the 20-point plan (Winter Wonderland), part 1.

- **Every winter (December to February), every game gives each player a present after a round**, no stars needed:
  - a red-and-white **woolly hat** with a fluffy bobble (in the games with a hat: Jungle Jump, Turbo Bike, Potion Quest, Fishing),
  - a **snowflake trail**: little white snowflakes that drift down and slowly spin behind you (every game with trails),
  - and in Turbo Bike + Mini RC Racers a **Frosty** paint job: icy blue that glints white.
- After the first round in winter a big blue **"Winter presents!"** screen shows them side by side; "Wear it!" puts them on.
- On the Looks screen they sit at the end of each line with a snowflake mark; a child who looks there first can tap one to
  unwrap it right away.
- **Once you have them, you keep them all year** (they just don't get handed out in summer). The Sticker Book's Looks page and
  My House's Looks screen show them too, so your animal at home can wear the woolly hat.
- Next: the snowy places (a snowy Putt-Putt hole, a Turbo Bike track, ice fishing, an Archery level), then snowy coloring pages.

## 2026-11-27 (Friday, latest run) — My pictures never fill up
Point 5 of the 20-point plan.

- **The coloring book's "My pictures" wall has room for lots more pictures: 300 instead of 60.** The pictures are now kept
  in the browser's big storage (IndexedDB) instead of the small one (localStorage, about 5 MB for the whole arcade). Before,
  a busy artist with lots of brush lines could fill the small storage up, and then new pictures quietly stopped saving.
- **Old pictures move over by themselves** the first time the coloring book (or My House) opens, and they only leave the
  old place once they're safely stored in the new one, so nothing gets lost. After 300 pictures the oldest one makes room.
- My House's Art Room hangs your newest pictures from the new storage, like before. Each player keeps their own pictures;
  removing a player removes theirs too.
- If a browser has no big storage (some private windows), it simply works the old way.
- The helper library (idb-keyval, free Apache-2.0 license) is tiny (5 KB), loads only on the coloring book and My House,
  and works offline.

## 2026-11-27 (Friday, late night) — Piano Star gets a real piano
Point 4 of the 20-point plan.

- **Piano Star sounds like a real grand piano now.** The notes are recordings of a real concert piano (the free "Salamander
  Grand Piano"), so each key has the soft thump of the hammer and a long, warm ring. Every recording was evened out, so no key
  jumps out louder than the one next to it.
- **Pick your instrument:** a round button at the top of the game (next to the Listen speaker, or after Record + Play in Free
  Play) shows the instrument; tap it for the next one and it plays a little ta-da: **Piano, Music box** (tinkly, like a
  wind-up box), **Xylophone** (bright wooden bars) and the old **Toy piano**. There's also a **Sounds** button on the title
  menu with all four big. Each player's pick is remembered; recorded tunes and "Hear it" play on it too.
- The sound library (Tone.js, free MIT license) and the piano recordings only load on Piano Star, a moment after its menu
  appears, so the page opens just as fast; until they've arrived (a second or two) the old piano plays, so a key always
  makes a sound. Works offline and from the disk.
- Volume, mute and the room echo work like before (the new sounds go through the same knobs).

## 2026-11-27 (Friday, night run) — Claw Catch on real physics
Point 3 of the 20-point plan.

- **The plush toys in Claw Catch move like real toys now.** They roll, tumble off each other, lean on their neighbors and
  squish a little when they land (then boing back), and they like to sit back up after a tumble.
- **The claw really closes round a toy:** each finger closes until it touches the toy, so a grab near the side looks lopsided;
  the claw's finger tips nudge the toys next to it out of the way as it comes down.
- **Holding:** a toy grabbed in the middle hangs snug and still; one grabbed off the middle swings on the claw; near the edge it
  wiggles loose and tumbles back into the pile ("Oops!").
- **Still kid-fair:** how well the claw holds is still only about how near the middle the child aimed when they pressed the
  button. The toy they aimed at stays put while the claw comes down, so a bumped neighbor can never spoil a good aim. Easy,
  little kids, one thumb and the golden lucky claw all work like before.
- The physics library (Matter.js, free MIT license, 82 KB) is copied into the game, loads only on the Claw Catch page and works
  offline.

## 2026-11-27 (Friday, evening, a second run) — Hold to hear: a speech bubble
This run started on point 2 at the same time as the run above, which finished it first, so this run only adds to it.

- While a held button talks, a **little speech bubble with a speaker** pops up on it and floats away after a second, so a
  child can see which button is speaking (Calm motion: it just appears and fades).
- The check now looks at every game's first menu (all 13 arcade games), not just three: every button there has words to say.

## 2026-11-27 (Friday, evening run) — Hold a button to hear its name
Point 2 of the 20-point plan.

- **Hold to hear:** in every menu (the hub and its bottom bar, every game's menus, the coloring book, the maze map, the Sticker
  Book, My House, the Jukebox), keeping a finger on a button for a moment makes the device say its name out loud: "Sticker
  book", "My house", "Mini RC Racers", "Play", "Maze 4"... The button gives a little bounce so the child sees it heard them.
  Letting go after that does NOT press the button, so a child who can't read yet can listen first and tap after. A quick tap
  works just like before.
- Buttons that are only a picture got words to say (the bar's buttons, the player switches, the coloring tabs, the maze
  stones, Jukebox songs say which game they're from). Locked things add "Not yet!". Stickers you haven't found say "A sticker
  to find" (so the surprise isn't spoiled).
- It uses the device's own voice and stays quiet when all sound is off. **Parent corner -> Device -> Hold to hear** switches it
  off (it's on to start with).
- Also fixed an old test that still expected 68 stickers (there are 72 since Claw Catch).

## 2026-11-27 (Friday, Keith live) — Screen steering in Mini RC Racers + a new 20-point plan
Keith asked for a new 20-point plan, screen steering in Mini RC Racers, and libraries that could make the games better.

- **Screen steering** (point 1 of the new plan): a new **Steer** button on Mini RC Racers' main menu. When it's on (the button
  turns yellow), Left and Right mean "go to that side of the screen", so they don't feel backwards when the car drives down the
  screen. Holding a button until the car points that way keeps it going straight that way (no spinning in circles). Each player
  has their own setting; off = the old steering. The menu's bottom buttons are round now so all five fit on one line.
- **The 20-point plan** is at the top of ROADMAP.md: hold a button to hear its name, Claw Catch with real physics, a real piano
  sound, a coloring gallery that never fills up, Winter Wonderland, color by number, letter tracing, two new games (Feed the
  Animals for the youngest, 3D Bowling Buddies), a pet in My House, bike tricks, and more.
- **Libraries:** the plan brings in Matter.js (physics), Tone.js (piano), idb-keyval (bigger storage), three.js (3D) and ZzFX
  (sound effects), each only on the page that needs it. React isn't in it: our games draw on a canvas with Phaser, so React
  would add a big download without much to do (the ROADMAP note explains).
## 2026-11-27 (Friday, newest run) — 4 new animal pages
Picked from the open ideas (Animals were next in turn after Things).

- **Four new pages** in the coloring book's Animals tab (it has 86 now):
  - **Lemur**: sitting and facing you, with big round eye patches and a ringed tail curling up behind it (each ring is its own part to color).
  - **Stingray**: seen from above, gliding over the sand with wide round wings, four spots and a long thin tail.
  - **Kiwi Bird**: a round fluffy bird with a long thin beak reaching down to the ground and sturdy little legs.
  - **Armadillo**: a round shell with colorful bands, a little pointy ear and a long snout.
- Same style as always: thick outlines, big simple shapes (11-18 parts to color), a sky and a ground strip.

## 2026-11-27 (Friday, latest run) — 4 new Things pages
Picked from the open ideas (Things were next in turn after Fruit).

- **Four new pages** in the coloring book's Things tab (it has 74 now):
  - **Camera**: a chunky camera with a big round lens (three rings), a flash, a button and a stripe.
  - **Cookie Jar**: a round jar with a lid and knob, and a big chocolate-chip cookie on the front.
  - **Mitten**: a big mitten with its thumb out, three polka dots and a ribbed cuff.
  - **Bell**: a hand bell with a wooden handle, a stripe, a wide rim and the little ball peeking out underneath.
- Same style as always: thick outlines, big simple shapes (9-12 parts to color), a sky and a ground strip.

## 2026-11-27 (Friday, late) — 4 new fruit + veggie pages
Picked from the open ideas (Fruit was next in turn after Animals).

- **Four new pages** in the coloring book's Fruit tab (it has 74 now):
  - **Star Fruit**: a slice shaped like a soft, puffy star, with a smaller star inside, five seeds and a smiley face.
  - **Parsnip**: a long pointy root with three leafy stalks on top and little lines on its skin.
  - **Spinach**: a bunch of three big pointy leaves on stalks, tied with a band; the face is on the front leaf.
  - **Bean**: a big kidney bean lying on a soil hill, with a little sprout and two leaves growing out of its top.

## 2026-11-27 (Friday, night) — 4 new animal pages
Picked from the open ideas (Animals were next in turn after Things).

- **Four new pages** in the coloring book's Animals tab (it has 82 now):
  - **Cheetah**: sitting and facing you, with spots, little pointy ears, the dark "tear" lines under its eyes and a curly tail.
  - **Crocodile**: lying down with a long smiley snout, two big eye bumps on top and bumps along its back.
  - **Pelican**: standing tall with a tuft on its head, a wing, and its big beak with the stretchy pouch underneath.
  - **Dragonfly**: seen from above, four big wings, a striped tail and a big smiley head.
- Same style as always: thick outlines, big simple shapes (11-17 parts to color), a sky and a ground strip.
- A lamb and a llama were skipped: they'd look just like the sheep and the alpaca.

## 2026-11-27 (Friday, end of day) — 4 new Things pages
Picked from the open ideas (Things were next in turn after Fruit).

- **Four new pages** in the coloring book's Things tab (it has 70 now):
  - **Crayon**: one big crayon standing up, with its pointy tip, a paper wrapper, two stripes and an oval label.
  - **Traffic Light**: a tall box with three big round lights on a post with a little foot.
  - **Fire Hydrant**: a round top with a cap, a collar, a nozzle on each side and a big round one in front.
  - **Toaster**: two slices of toast popping up, a dial, a lever on the side, a stripe and little feet.
- Same style as always: thick outlines, big simple shapes (9-13 parts to color), a sky and a ground strip.

## 2026-11-27 (Friday, last run) — 4 new fruit + veggie pages
Picked from the open ideas (Fruit was next in turn after Animals).

- **Four new pages** in the coloring book's Fruit tab (it has 70 now):
  - **Walnut**: a round bumpy shell with the ridge down the top, two wrinkle lines and a leaf.
  - **Gooseberry**: a round berry with big stripes from top to bottom, a stem and a leaf.
  - **Pistachio**: an open shell with the round nut peeking out of the gap at the top.
  - **Quince**: a lumpy fruit with round shoulders, a stem and two leaves.
- Same style as always: thick outlines, big simple shapes (7-9 parts to color), a sky and a ground strip.
- A pomelo was skipped: it would look just like the grapefruit.

## 2026-11-27 (Friday, final) — 4 new animal pages
Picked from the open ideas (Animals were next in turn after Things).

- **Four new pages** in the coloring book's Animals tab (it has 78 now):
  - **Lobster**: standing up on its tail and waving two big pincers, a striped body and a tail fan.
  - **Worm**: popping up out of a little pile of dirt, a big round head and a band round its middle.
  - **Platypus**: a round furry body with a pale tummy, a wide duck bill, webbed feet and a flat tail.
  - **Ant**: from the side, a big head with two ball-tipped feelers, a little middle, a big bottom and three legs.
- Same style as always: thick outlines, big simple shapes (8-16 parts to color), a sky and a ground strip.
- A wombat was tried first, but from the front it looked like a bear, so the ant took its place.

## 2026-11-27 (Friday, newest) — 4 new Things pages
Picked from the open ideas (Things were next in turn after Fruit).

- **Four new pages** in the coloring book's Things tab (it has 66 now):
  - **Beach Ball**: a big ball on the sand with curved stripes from top to bottom and a round cap on top.
  - **Xylophone**: six bars from long to short on two slanted rails, a little nail at each end, and a mallet lying in front.
  - **Sand Pail**: a bucket heaped with sand, a round handle, a stripe round its middle and a spade stuck in the sand.
  - **Pencil**: one big slanted pencil with an eraser, a metal band, a striped body, the wooden tip and the lead.
- Same style as always: thick outlines, big simple shapes (7-12 parts to color), a sky and a ground strip.

## 2026-11-27 (Friday, latest) — 4 new fruit + veggie pages
Picked from the open ideas (Fruit was next in turn after Animals).

- **Four new pages** in the coloring book's Fruit tab (it has 66 now):
  - **Passion Fruit**: cut in half, seen from the front: the peel, a white ring, the juicy middle with eight seeds round a smiley face.
  - **Kohlrabi**: a round bulb with three leafy stalks growing out of its top and two little stubs on its sides.
  - **Butternut Squash**: a long neck and a big round bottom, with a stem and a leaf.
  - **Chestnut**: a round nut with a pointy top and a little tuft, and the pale patch across its bottom.
- Same style as always: thick outlines, big simple shapes (7-17 parts to color), a sky and a ground strip.
- An okra was tried but looked like a carrot, so the chestnut took its place.

## 2026-11-27 (Friday, late night) — 4 new animal pages
Picked from the open ideas (Animals were next in turn after Things).

- **Four new pages** in the coloring book's Animals tab (it has 74 now):
  - **Swan**: floating on the water, side view, a tall neck, a folded wing and two tail feathers.
  - **Donkey**: facing front with long tall ears, a fluffy tuft, a big smiley muzzle and little hooves.
  - **Badger**: a wide face with a stripe over each eye, small ears, a pointy snout with a round nose, a tummy and paws.
  - **Ostrich**: a fluffy cloud of a body with two wings, a long neck, a round head with a wide beak and long legs.
- Same style as always: thick outlines, big simple shapes (10-17 parts to color), a sky and a ground strip (the swan gets water).

## 2026-11-27 (Friday, night) — 4 new Things pages
Picked from the open ideas (Things were next in turn after Fruit).

- **Four new pages** in the coloring book's Things tab (it has 62 now):
  - **Birthday Cake**: two tiers on a plate, a frosting ledge, three candles with flames and three round sprinkles.
  - **Cocoa Mug**: a big mug with a stripe, a round handle, two marshmallows on top and a saucer underneath.
  - **Spinning Top**: a round top with a stripe across the middle, four dots, a little cap, a handle knob and a point.
  - **Wheelbarrow**: a deep tub with a rim, one big wheel, a leg, a long handle with a grip.
- Same style as always: thick outlines, big simple shapes (10-16 parts to color), a sky and a ground strip.

## 2026-11-27 (Friday, evening) — 4 new fruit + veggie pages
Picked from the open ideas (Fruit was next in turn after Animals).

- **Four new pages** in the coloring book's Fruit tab (it has 62 now):
  - **Grapefruit**: cut in half like a bowl, with the smiley peel underneath and six juicy wedges on top.
  - **Lychee**: a round fruit with a bumpy edge, a little stem and two leaves.
  - **Bok Choy**: three big leaves with veins fanning out over three white stalks; the face is on the front stalk.
  - **Acorn**: a round nut with a little point, a cap with a rim, a stem and a leaf.
- Same style as always: thick outlines, big simple shapes (10-15 parts to color), a sky and a ground strip.

## 2026-11-27 (Friday, later) — 4 new animal pages
Picked from the open ideas (Animals were next in turn after Things).

- **Four new pages** in the coloring book's Animals tab (it has 70 now):
  - **Hen**: side view, a round body with a wing, a fan of three tail feathers, a bumpy comb, a beak and a wattle.
  - **Pufferfish**: all puffed up and round, with soft spikes all the way round, a two-part tail, a fin and a little "o" mouth.
  - **Mole**: peeking out of a dirt mound with a big pink nose and two wide digging paws, plus two pebbles.
  - **Snake**: coiled up in three round loops with spots, its tail tip poking out and a big smiley head on top.
- Same style as always: thick outlines, big simple shapes (12-18 parts to color), a sky and a ground strip (sand for the pufferfish).

## 2026-11-27 (Friday) — 4 new Things pages
Picked from the open ideas (Things were next in turn after Fruit).

- **Four new pages** in the coloring book's Things tab (it has 58 now):
  - **Watering Can**: a smiley can with a handle ring at the back, a round top and a long spout with a sprinkler head.
  - **Piggy Bank**: a round pig with four short legs, two ears, a snout, a curly-tail bump and a coin above the slot.
  - **Rubber Duck**: floating on the water, with a big round head, a beak, a wing and a little tail.
  - **Backpack**: a handle loop, a flap with a buckle, a front pocket with a zipper and two side pockets.
- Same style as always: thick outlines, big simple shapes (9-15 parts to color), a sky and a ground strip (water for the duck).

## 2026-11-26 (Thursday, final run) — 4 new fruit + veggie pages
Picked from the open ideas (Fruit was next in turn after Animals).

- **Four new pages** in the coloring book's Fruit tab (it has 58 now):
  - **Persimmon**: a squat, roundish fruit with a big four-leaf cap and a little stem on top.
  - **Brussels Sprout**: a round little sprout with a leaf hugging each side, a leaf flap on top and a stubby stem.
  - **Leek**: tall and smiley, with three big leaves fanning out, a pale band, a long white stalk and three little roots.
  - **Cantaloupe**: a round melon with a stem and a leaf, and a slice of melon in front of it.
- Same style as always: thick outlines, big simple shapes (9-14 parts to color), a sky and a ground strip.
- A starfruit slice was tried first, but it looked just like the starfish page, so the persimmon took its place.

## 2026-11-26 (Thursday, newest run) — 4 new animal pages
Picked from the open ideas (Animals were next in turn after Things).

- **Four new pages** in the coloring book's Animals tab (it has 66 now):
  - **Toucan**: sitting on a branch, with a huge two-part beak, a ring round its eye, a white bib and a long tail.
  - **Caterpillar**: four round bumps in a wavy row, little feet, and a big smiley head with two antennae, on the grass.
  - **Gecko**: seen from above, with bulgy eyes, four legs with round sticky toes, two spots on its back and a curly tail.
  - **Narwhal**: a round little whale with a long horn, a tail fin, a flipper and a pale belly, over the waves.
- Same style as always: thick outlines, big simple shapes (13-20 parts to color), a sky and a ground strip.

## 2026-11-26 (Thursday, latest run) — 4 new Things pages
Picked from the open ideas (Things were next in turn after Fruit).

- **Four new pages** in the coloring book's Things tab (it has 54 now):
  - **Tricycle**: side view, a big front wheel with a pedal, a little back wheel under a step, a seat and handlebars.
  - **Sandcastle**: three towers with round tops and arched windows, a wall with a door, and a little flag.
  - **Lamp**: a table lamp with a polka-dot shade, a round base and a pull-chain bead.
  - **Rocking horse**: a toy horse with a saddle, a bumpy mane and a tail, on a big curved rocker.
- Same style as always: thick outlines, big simple shapes (13-16 parts to color), a sky and a floor or ground strip.

## 2026-11-26 (Thursday, newest) — 4 new fruit + veggie pages
Picked from the open ideas (Fruit was next in turn after Animals).

- **Four new pages** in the coloring book's Fruit tab (it has 54 now):
  - **Blackberry**: an egg-shaped berry with round bumps to color one by one, a leafy cap and a big leaf.
  - **Cranberries**: a bowl full of them (just right for Thanksgiving), one big smiley berry in the middle and four little ones.
  - **Kumquat**: two little oval citrus fruits hanging from a twig with two leaves.
  - **Asparagus**: three spears tied together with a band; the middle one smiles.
- Same style as always: thick outlines, big simple shapes (11-17 parts to color), a sky and a ground strip.

## 2026-11-26 (Thursday, latest) — 4 new animal pages
Picked from the open ideas (Animals were next in turn after Things).

- **Four new pages** in the coloring book's Animals tab (it has 62 now):
  - **Seahorse**: side view, with a crown of bumps, a long snout, a belly patch, a back fin and a curly tail.
  - **Puffin**: standing and facing you, with a big white face, a big striped beak, a white belly and orange feet.
  - **Moose**: a big smiley face with a soft nose, floppy ears and two wide, bumpy antlers.
  - **Bat**: a friendly little bat with its wings spread, big pointy ears and a belly patch, standing on a cloud.
- Same style as always: thick outlines, big simple shapes (13-17 parts to color), a sky, and a ground strip or a cloud.
- The ideas list also said "owl chick", but the owl is already in the book, so the bat took its place.

## 2026-11-26 (Thursday, late) — 4 new Things pages
Picked from the open ideas (Things was next in turn after Fruit).

- **Four new pages** in the coloring book's Things tab (it has 50 now):
  - **Wagon**: a little pull-along wagon with a long handle, a stripe on its side and two big wheels.
  - **Skateboard**: seen from above and tipped at a slant, with four wheels peeking out, a stripe and two dots to color.
  - **Guitar**: a big guitar standing up, with tuning pegs, a round sound hole, strings and a bridge.
  - **Alarm Clock**: a round clock with two bells on top, little feet, and hands pointing at 3 o'clock.
- Same style as always: thick outlines, big simple shapes (9-14 parts to color), a sky, and a cloud or a ground strip.
- The ideas list said garbage truck, scooter, barn and kite, but those were already in the book, so these four took their place.

## 2026-11-26 (Thursday, night) — 4 new fruit + veggie pages
Picked from the open ideas (Fruit was next in turn after Animals).

- **Four new pages** in the coloring book's Fruit tab (it has 50 now):
  - **Papaya**: cut in half, so you can color the skin, the soft inside and the seed hollow (with its little black seeds).
  - **Olive**: a big round olive with a stem, two long leaves and a shine.
  - **Artichoke**: a round, smiley artichoke with pointy leaves peeking out all round and a little stem.
  - **Dragon Fruit**: a big oval fruit with leafy tips poking out of its sides and a tuft on top.
- Same style as always: thick outlines, big simple shapes (8-14 parts to color), a sky and a ground strip.
- A green bean was tried too, but it looked like a banana, so the dragon fruit took its place. The first artichoke looked like a
  sunflower, so its leaves were made pointy and point up now.

## 2026-11-26 (Thursday, Keith live) — a new game: Claw Catch!
Keith asked for a claw game. It's the 15th game on the hub (the pink claw machine).

- **How to play:** slide the claw left and right (arrows, the on-screen buttons, or just drag a finger on the glass), then press the
  **big red button**. The claw drops, closes, lifts the toy and carries it to the prize chute all by itself. The toy pops out with a
  sparkle, big in the middle of the screen ("New!" the first time).
- **4 machines**, one after the other: **Toy Box** (bunny, kitty, puppy, duckling, froggy), **Ocean** (fishy, octopus, whale, crabby,
  seal pup), **Candy Shop** (cupcake, donut, ice cream, cookie, gumdrop) and **Star Station** (alien, planet, sleepy moon, flying
  saucer, robot). Each also has one rare **golden prize** (unicorn, starfish, rainbow lollipop, comet) that glows in the pile.
- **Fair for kids, like you picked:** no hidden tricks. How well the claw holds only depends on how near the **middle** of a toy it
  comes down. On Easy anywhere on a toy holds. On Normal / Challenge a toy grabbed near its edge wiggles or slips back ("Oops!"). After
  a couple of misses in a row the claw turns **golden** (the lucky claw) and holds anything it touches. A round is a handful of coins
  (8 / 7 / 6); stars come from how many prizes you win, and you never lose anything.
- **Help for little ones:** a dotted line shows where the claw will land and the toy under it lights up green (good spot) or yellow
  (near the edge). When the claw stands still, it slides onto the middle of the toy under it on Easy. In one-thumb mode the claw
  glides back and forth by itself and slows down over toys: just press Drop.
- **The Prize Shelf** (shelf button on the title menu) shows all 24 toys: the ones you won in color with how many, the rest as gray
  shapes. **My House:** any toy you won can sit in the bedroom's toy spot (next to the ball, blocks and robot; free, no coins).
- Also: 4 new stickers (17 pages in the Sticker Book now), 9 trophies, a Daily Surprise challenge ("Win a prize"), Star Road trails
  behind the claw, "Show me" (the hand slides the claw over a toy and presses the button), two new songs (also in the Jukebox), a tiny
  moving preview on its hub tile (the claw lifts its bunny), and it works offline.
- A new test (`tests/test_claw.py`) plays it: wins prizes, makes toys slip on Normal, gets the lucky claw, tries one thumb, the Prize
  Shelf and the bedroom spot, and checks phones.

Next: back to the open ideas (or more for the claw game: more machines, a two-player claw with Friends).

## 2026-11-26 (Thursday, newest) — 4 new animal pages
Picked from the open ideas (Animals were next in turn after Things).

- **Four new pages** in the coloring book's Animals tab (it has 58 now):
  - **Guinea Pig**: a round, chubby guinea pig facing you, with droopy little ears, puffy cheeks and two color patches (head and side).
  - **Skunk**: sitting up with a big bushy tail curling behind it; the tail stripe and the forehead stripe color on their own.
  - **Camel**: one big hump, four long legs and a long neck up to a round, smiley face that looks right at you.
  - **Starfish**: a chunky star with rounded arms, a dot on each arm and a happy face.
- Same style as always: thick outlines, big simple shapes (12-21 parts to color), a sky and a ground strip.
- The camel was first drawn too small, so it was made bigger; the skunk's tail poked off the edge a little and was pulled in.

Next: another open idea (Fruit pages are next in turn, or Maze with a friend, RC split screen), or anything you'd like!

## 2026-11-26 (Thursday, latest) — 4 new Things pages
Picked from the open ideas (Things were next in turn after Animals and Fruit).

- **Four new pages** in the coloring book's Things tab (it has 46 now):
  - **Drum**: a big round drum with three diamonds on the side and two drumsticks with round tips.
  - **Mailbox**: a classic loaf-shaped mailbox on a post, with its little flag up.
  - **Pickup Truck**: a cab with a big window, an open truck bed, big wheels, headlight and tail light.
  - **Toy Blocks**: two blocks with a circle and a diamond, and a third one stacked on top (a little crooked, like a real tower).
- Same style as always: thick outlines, big simple shapes, a sky, a cloud and a ground strip to color. Vehicles and toys don't get faces.
- The mailbox was first drawn from the front, but it looked like a doghouse, so it was redrawn from the side.

Next: another open idea (Animals are next in turn, or Maze with a friend, RC split screen), or anything you'd like!

## 2026-11-26 (Thursday, late night) — 4 new fruit + veggie pages
Picked from the open ideas (the Fruit tab was next in turn after Animals).

- **Four new pages** in the coloring book's Fruit tab (it has 46 now):
  - **Sweet Potato**: a long, smiley sweet potato with little root tails at each end and a sprout of two leaves on top.
  - **Raspberry**: a round berry with bumpy edges all the way round (each bump colors on its own) and a leafy cap with a stem.
  - **Chili Pepper**: a curvy chili with a green cap and stem, bending down to a pointy tip.
  - **Peanut**: a peanut in its shell, pinched in the middle, with three little dimples to color.
- Same style as always: thick outlines, big shapes, cute faces with blush cheeks, a sky and a ground strip to color.
- An acorn squash was tried too, but it looked just like the pumpkin page, so it was left out.

Next: another open idea (Things pages like a garbage truck or a kite, Maze with a friend, RC split screen), or anything you'd like!

## 2026-11-26 (Thursday, night) — 4 new animal pages (a turkey for Thanksgiving!)
Picked from the open ideas (Animals were next in turn after Things).

- **Four new pages** in the coloring book's Animals tab (it has 54 now):
  - **Turkey**: facing front with a fan of five big tail feathers, a round tummy, a little beak and a wobbly wattle.
  - **Goat**: two curved horns, floppy ears out to the sides, a long face with a smiley muzzle and a little beard.
  - **Beaver**: sitting up with its big flat tail behind it, puffy cheeks and two big front teeth.
  - **Rhino**: one big horn on its nose, a wide snout with a smile and little ears on top.
- Each page is big, simple shapes with thick outlines (13-17 parts to color), checked blank and filled in, and the coloring tests pass.

## 2026-11-26 (Thursday, evening) — 4 new Things pages
Picked from the open ideas (the Things tab was next in turn after Animals and Fruit).

- **Four new pages** in the coloring book's Things tab (it has 42 now):
  - **Crane**: a crane truck with a long arm reaching up, lifting a crate on its cable, three big wheels on the road.
  - **Fire Station**: a fire station with a tall tower and its little bell window, a big garage door, a round sign and a side door.
  - **Teapot**: a round, smiling teapot with a lid, a spout, a handle and blush cheeks.
  - **Robot**: a friendly robot with an antenna, big shiny eyes, a smile, a button on its chest, round hands and little feet.
- Same style as always: thick outlines, big shapes, a sky and a ground or road to color. The teapot and the robot get cute
  faces (like the snowman); the crane and the fire station don't.
- A sled was tried too, but it looked like a bench from the side with the shapes the pages use, so it was left out.

Next: another open idea (guinea pig + more animals, Maze with a friend, RC split screen), or anything you'd like!

## 2026-11-26 (Thursday, later) — 4 new fruit + veggie pages
Picked from the open ideas (the Fruit tab was next in turn after Animals).

- **Four new pages** in the coloring book's Fruit tab (it has 42 now):
  - **Lime**: a round lime with its little bumps at each end, a stem and a leaf.
  - **Apricot**: a round apricot with the soft crease down one side, a stem and a leaf.
  - **Zucchini**: a long zucchini lying on a slant with a stem at one end and a little flower at the other.
  - **Cabbage**: a round cabbage head tucked between two big outer leaves.
- Same style as always: thick outlines, big shapes, cute faces with blush cheeks, a sky and a ground strip to color.

Next: another open idea (Things pages like a crane or a robot, Maze with a friend, RC split screen), or anything you'd like!

## 2026-11-26 (Thursday) — 4 new animals to color
Picked from the open ideas (the Animals tab was next in turn after fruit and Things).

- **Four new animal pages** in the coloring book (the Animals tab has 50 now):
  - **Otter**: sitting up with little round ears and puffy cheeks, holding a shell, its flat tail on the ground.
  - **Sloth**: hanging from a branch with both arms, a light face with sleepy eye patches and a little smile.
  - **Alpaca**: a long neck, a fluffy cloud of hair on top, tall ears and a round, smiling muzzle.
  - **Peacock**: its big tail fanned out behind it with six feather "eyes" to color, and a little crest on its head.
- Same style as the others: thick outlines, big shapes, cute faces with blush cheeks, a sky (and ground) to color.

Next: another open idea (guinea pig + more animals, Maze with a friend, RC split screen), or anything you'd like!

## 2026-11-25 (Wednesday, late night) — 4 new Things pages
Picked from the open ideas: the Things tab hadn't grown since Nov 22 (the last two runs did animals and fruit).

- **Four new pages** in the coloring book's Things tab (it has 38 now):
  - **Tow Truck**: a cab with a light on its roof, a lifting arm with a hanging hook, big wheels on the road.
  - **School**: a schoolhouse with a bell tower, a clock in the roof, four windows and an arched door.
  - **Race Car**: a long low racer with a back wing, a driver's helmet peeking out and a round number spot to color.
  - **Snowman**: just in time for winter: a top hat, a carrot nose, a scarf, stick arms with mittens, and a big smile.
- Same style as always: thick outlines, big shapes, a sky and a ground or road to color. The snowman gets a cute face
  with blush cheeks; the vehicles and the school don't (like the other Things pages).

Next: another open idea (Maze with a friend, RC split screen), or anything you'd like!

## 2026-11-25 (Wednesday, night) — 4 new fruit + veggie pages
Picked from the open ideas again: the Fruit tab hadn't grown since Nov 22.

- **Four new pages** in the coloring book's Fruit tab (it has 38 now):
  - **Fig**: a round, teardrop-shaped fig with a little stem and a leaf.
  - **Cauliflower**: a fluffy bumpy top (each bump colors on its own) sitting in two big leaves.
  - **Celery**: three stalks side by side with leafy tufts on top; the middle one smiles.
  - **Turnip**: a round root with three pointy leaves and a little tail.
- Same style as always: thick outlines, big shapes, cute faces with blush cheeks, a sky and a ground strip to color.

Next: another open idea (Things pages like a police car or school bus, Maze with a friend, RC split screen), or anything you'd like!

## 2026-11-25 (Wednesday, evening) — 4 new animals to color
The new 10-point plan is finished, so this run picked from the open ideas: more coloring pages.

- **Four new animal pages** in the coloring book (the Animals tab has 46 now):
  - **Kangaroo**: sitting up with tall ears, its little paws resting on its pouch, big feet and a long tail.
  - **Tiger**: sitting like a big kitty, round ears, a few bold stripes on its head and sides, tail curled up.
  - **Hamster**: one round chubby ball with puffy cheek pouches, holding a seed in its tiny paws.
  - **Walrus**: a big round body, two flippers, puffy whisker cheeks and two long tusks.
- Same style as the others: thick outlines, big shapes, cute faces with blush cheeks, a sky and a ground strip to color.
- (The ideas list still had fox, hedgehog and sheep in it, but those pages were already there, so they were swapped for
  tiger, hamster and walrus.)

Next: another open idea from the roadmap (Maze: two explorers in one maze with a friend, RC split screen), or anything you'd like!

## 2026-11-25 (Wednesday, newest of all) — The game tiles come alive
The new plan, point 10 (the hub glow-up), part 3, the last part of the whole plan.

- **Every game's picture on the hub now plays a tiny preview of its game**, one tile at a time, taking turns:
  - Turbo Bike: the rider hops the bike over a bump, twice. Mini RC Racers: the car drives off along the road and comes
    back round. Hoop Heroes: the ball arcs in and swishes through the net. Putt-Putt Park: the ball rolls into the hole
    and the flag wiggles. Archery: the arrow flies in and wobbles in the target.
  - Jungle Jump: the monkey swings on its vine. Treasure Trail: gems hop out of the chest. Potion Quest: the potion
    wobbles, the star spins, the blob hops. Space Defender: the rocket blasts off and flies back in from below.
  - Bubble School: the letter bubbles float and the little monster hops. Coloring: the paint dots pop while the crayon
    scribbles. Maze: the smiley walks the path to the star. Fishing: the fish wiggles and jumps. Piano Star: the notes
    bounce to a beat.
- **Still calm and clean:** only one tile moves at a time, with a short rest in between, and only tiles you can see.
  Each preview ends looking exactly like the game's picture, so nothing jumps. Tapping a tile while it moves opens the
  game as always.
- **No moving tiles** while picking hearts, in Calm motion, on a slow tablet, or when nobody has touched the hub for a
  while. The hub opens just as fast as before (a preview's pictures are only made when its turn comes).
- The Maze picture had a wall that the dotted path went straight through; that wall is gone now.
- A new test (`tests/test_previews.py`) checks every preview starts and ends like the icon, one at a time, phones, the
  taps, heart mode and Calm motion.

**That finishes the new 10-point plan.** Next: pick from the open ideas in the roadmap (or anything you'd like!).

## 2026-11-25 (Wednesday, newest) — The hub follows the seasons
The new plan, point 10 (the hub glow-up), part 2.

- **The hub changes with the calendar**, on its own:
  - **Winter** (December to February): snowflakes drift down behind the games, a snow cap with little icicles sits
    on top of the menu, and Bop wears pink earmuffs and a red striped scarf.
  - **Spring** (March to May): pink cherry petals float down, blossoms in the two top corners, Bop wears a flower crown.
  - **Summer** (June to August): soap bubbles float up, bright summer flowers in the corners, Bop has sunglasses pushed
    up on his head.
  - **Autumn** (September to November, so right now): orange, red and yellow leaves tumble down, leaves in the corners,
    Bop wears a cozy scarf and a leaf has landed on his head.
- **Still clean:** only a few things fall at a time, always *behind* the game tiles, so nothing covers a picture and
  every tap works as before. Nothing new was added to the bar or the list.
- **Calm motion** (and slow tablets): nothing falls; the corner decoration and Bop's clothes stay.
- A new test (`tests/test_seasons.py`) checks each season, the dates, that the snow stays behind the tiles, phones,
  tablets and Calm motion.

Next: point 10, part 3 (the last part of the new plan): tiny moving previews on the game tiles.

## 2026-11-25 (Wednesday, latest) — Meet Bop!
The new plan, point 10 (the hub glow-up), part 1.

- **Bop, the arcade's own mascot**, now stands next to the Kids Arcade logo on the hub: a round, sunny-yellow buddy
  with big shiny eyes, rosy cheeks, a pink star on his antenna and little orange feet (our own character).
- **He says hello.** When the arcade opens he hops, waves, and then points at a little speech bubble with
  **today's surprise present** in it. Tap Bop (or the bubble) and the Daily Surprise screen opens. Once today's surprise
  is done, the present in his bubble is opened.
- **He feels alive without being busy:** he breathes gently, blinks every few seconds and gives a little wave now and
  then. He only waves hello once a visit, not every time the hub changes.
- **The hub stays clean:** Bop uses the empty room beside the logo, so nothing new was added to the bar or the list.
  No Bop while picking hearts, or on a phone held sideways (no room there; the present button in the bar still works).
- **Calm motion:** Bop just stands there pointing at the surprise, nothing moves.
- The hub still rests at 30 pictures a second (Bop doesn't keep it busy), and a new test (`tests/test_mascot.py`)
  checks his hello, pointing, blinking, the tap, phones, tablets and Calm motion.

Next: point 10, part 2: seasonal hub looks (snow in winter, leaves in autumn), then tiny moving previews on the game tiles.

## 2026-11-25 (Wednesday, later still) — Jungle Jump + Treasure Trail, smoother still
Two runs overlapped again: the other one (just below) finished point 9. This run had measured the games the same
day and found two slow spots the other didn't touch, so it added them on top:

- **Jungle Jump** drew every ground tile of the level from scratch every picture (dirt bands, pebbles, grass tops,
  outlines): about 1300 drawing steps a picture. Now the level is painted once in tall strips, and each picture just
  copies the 2-4 strips you can see: about 250 steps, and the picture looks exactly the same (the test compares
  them). The strip just ahead is painted before you get there, so walking on stays smooth. The bouncy jelly blocks
  still squash as before, and a smashed boulder repaints its strip. The glowing cave crystals are painted once too.
- **Treasure Trail** stopped for a blink every time you walked into the next room (it was painting that room's sky,
  trees and ground). Now, while you play a room, the next one is painted bit by bit in the background, so walking in
  just swaps the pictures: the slowest picture of the game is about 3 times shorter.
- The speed test checks both.

Next: point 10, the hub glow-up.

## 2026-11-25 (Wednesday, later) — Smoother on older tablets
The new plan, point 9 (faster and smoother everywhere), part 2, the last part.

- **Found the slow pictures.** A new little tool (`tools/frametime.py`) plays every game for a few seconds and times how
  long one picture takes to paint. Hoop Heroes was by far the slowest (it draws three whole machines with wire mesh,
  chasing lights and neon), then Jungle Jump, Archery, Treasure Trail and Potion Quest.
- **Hoop Heroes:** the cages (ramp, mesh, frame) don't move, so each is painted once and then just copied; the neon
  tubes too; the bulbs and LEDs glow with a ready-made glow picture instead of a blur. About a third quicker, and it
  looks the same.
- **Jungle Jump:** the sky is painted once instead of every picture, and the hills are painted at the screen's own
  sharpness (they used to be painted extra-sharp and shrunk every frame).
- **Archery, Treasure Trail, Potion Quest:** their hill + ground layers are mostly empty sky; now only the rows that
  have something in them are copied. 15-30% quicker.
- **Every game:**
  - the game picture tells the browser it has no see-through parts, which saves it some work;
  - on a slow tablet the "lite" drawing (fewer pixels, fewer sparkles) now switches on after 2.5 seconds of slow
    play instead of after 150 slow frames, which on a tablet managing 10 pictures a second was 15 seconds of jerky
    play. A short hiccup doesn't count;
  - in lite drawing the glows are skipped (a glow is a blur, one of the slowest things to paint). Grown-ups who
    pick "Sharp" in the Parent corner keep everything.
- **A new test** (`tests/test_frames.py`) checks the lite switch, the glows, the layer copying, and gives every game a
  time budget for one picture, so a game that gets much slower fails.

**Point 9 is finished.** Next: point 10, the hub glow-up (tiny moving previews on the game tiles, a friendly mascot
that waves and points to today's surprise, seasonal looks), keeping the hub clean and simple.

## 2026-11-25 (Wednesday) — Menu fonts sooner
Point 9 (faster and smoother), a small top-up to part 1. (A third run had built the same battery savers at the same
time as the two runs below; theirs were already on GitHub, so this run kept theirs and only added what was new.)

- **The menu words show up sooner on a first visit.** Every page now asks for the two menu fonts the moment it starts
  loading, instead of only after the big menu library has been read, so the first menu doesn't wait for them.
  (Only from the web address: a page opened straight from the computer's disk isn't allowed to do this, so it skips it.)
- The speed test checks it (both fonts asked for early, each fetched just once).
- Test fix: the Daily Surprise test missed the "Surprise!" toast in Mini RC Racers because a "New sticker!" toast
  replaced it a moment later; it now watches every toast.

## 2026-11-24 (Tuesday, newest) — Menus take a nap
The new plan, point 9 (faster and smoother), part 1 again: two runs overlapped. The other one (just below) made the
library files smaller and slowed still menus and paused games down; this run had built two battery savers it didn't
have, so it kept all of the other run's work and added them on top.

- **Nothing drawn behind a title screen.** A game's title screen covers the whole game picture, so the game doesn't
  draw it at all there any more (it was 30 times a second). It's drawn again the moment that screen goes.
- **Menus take a nap.** If nobody touches the page for 40 seconds (a tablet left lying on the hub or a title screen),
  the menu slows down to 10 pictures a second: the light rays and sparkles still drift, the device just works a lot
  less. The first touch, click, key or mouse move wakes it right away, and that touch still counts. The aquarium,
  My House, the Jukebox and the Track Builder never nap (things move there).
- The speed test checks both.

Next: point 9, part 2: a steady frame rate on older tablets.

## 2026-11-24 (Tuesday, newer still) — Lighter, and resting when nothing moves
The new plan, point 9 (faster and smoother everywhere), part 1.

- **Smaller files on every page.** Every game's menus are drawn with two big library files (Phaser + Rex UI). Rex UI
  came with about 90 kinds of menu parts and the arcade uses 7, so it's now our own build with just those 7: 268 KB
  instead of 824 KB. Phaser is now its version without a physics engine nobody here uses (1048 KB instead of 1154 KB).
  The Sticker Book's swipe library is only fetched when its old-style backup book is needed. All in all about 690 KB
  less on every page: that's a third less to download the first time, and after every update (installed phones
  fetch the new files again), and less for an older tablet to read before the first menu shows.
- **Resting when nothing moves (less battery).** A menu that just sits there now draws about 30 pictures a second
  instead of 60 (or 120 on fast tablets); the moment a finger touches it, or a new screen pops in, it's back to full
  speed so it still feels smooth. A paused game's picture is drawn once a second instead of 60 times (nothing in it
  moves anyway), and a game behind its title menu 30 times a second. Playing is exactly as before.
- **The speed test** (`tests/test_speed.py`): it fails if the files grow back, if any page takes too long to show
  its first menu, or if a still menu or a paused game gets busy again.
- **Fixed on the way:** Mini RC Racers' "You won!" screen had become a little too tall since the Star Road's
  "stars / next look" chip arrived, so it scrolled on a computer. Now NEW BEST! and that chip share one line.

Next: part 2, a steady frame rate on older tablets (find the slowest drawing in each game and make it cheaper).

## 2026-11-24 (Tuesday, newer) — Your looks at home and in the Sticker Book
The new plan, point 8 (something to work towards in every game), part 5, the last part.

- **My House:** a new **Looks** button (the party hat) in the top row. It shows your animal big, then all 4 hats and
  all 4 trails. Every hat or trail you earned with stars in **any** game can be worn at home: tap it to put it on, tap
  again to take it off; ones still to earn have a padlock. The hat sits on your animal's head in every room, and the
  trail puffs out when you tap your animal to make it hop (and follows it while you drag it around the room). Friends
  who visit your house over Friends see your hat and trail too.
- **Sticker Book:** a pink **Looks** button at the bottom opens a page of every game's looks (one colored card per
  game, 11 games, 68 looks in all): the ones you have are bright, the ones still to earn are pale with a "?". A count
  at the top says how many you have. Tap a look to see it big, with a Play button for that game if it's still to earn.
- Archery isn't on these pages: it keeps its own hats and arrow trails inside the game.
- Small thing to know: a look shows up at home and in the book after its game has been opened once since the stars
  were earned (the game is what counts its stars).

**Point 8 is finished.** Next: point 9, faster and smoother everywhere (pages that open quicker, smoother on older
tablets, less battery when paused, and a speed test).

## 2026-11-24 (Tuesday, latest) — The Star Road in Bubble School + Piano Star
The new plan, point 8 (something to work towards in every game), part 4.

- **Bubble School:** stars now unlock the 4 trails (sparkles, hearts, bubbles, a rainbow). It's a magic finger: the trail
  follows your finger as it slides over the water (or the mouse on a computer), a little puff of it comes out wherever you
  tap, and the right bubble bursts into it with the usual stars.
- **Piano Star:** the same 4 trails. Every key you press sparkles your trail up out of the key, in songs, in Free Play
  and when your recorded tunes play back. (Not when the piano plays a song for you with the Listen button.)
- Both games have the **Looks** button on the title menu, the NEW star, and the big "New!" moment when a round reaches a
  new look. No hats here: there's no hero to put one on.
- That means **every arcade game is on the Star Road now.**

Next: the last part of point 8, showing your looks in My House and the Sticker Book.

## 2026-11-24 (Tuesday, night, later) — Paint colors for the bike and the RC car
The new plan, point 8, part 3 again: two runs overlapped. The other one (just below) had already put hats + trails into
Turbo Bike and trails into Mini RC Racers; this run had built the one thing it left out, **colors**, so it kept all of
the other run's work and added the colors on top.

- **A new kind of look: colors.** Stars now also unlock 4 special paint jobs that slowly glide from one color to the
  next: **Bubblegum** (pink and lilac), **Ocean** (blue and green), **Sunset** (yellow, orange and red) and **Galaxy**
  (purple and blue; the RC car twinkles with little stars).
- **Turbo Bike** now has 12 looks to earn: 4 hats, 4 colors and 4 trails, side by side on the Looks screen.
- **Mini RC Racers** has 8: 4 colors and 4 trails. Your car wears the color all race long (also during "3, 2, 1").
- **Shop paints still work:** picking a paint in the Bike Shop or in RC's My Car takes the color look off again, so
  the paint you just picked is the one you see.

Next: Bubble School and Piano Star, then showing the looks in My House and the Sticker Book.

## 2026-11-24 (Tuesday, night) — The Star Road in Turbo Bike + Mini RC Racers
The new plan, point 8 (something to work towards in every game), part 3. (Two runs overlapped again: the other one
had already done Treasure Trail, Potion Quest and Fishing, so this run kept those and added the two racing games.)

- **Turbo Bike**: stars now unlock **hats for your rider** (party hat, flower crown, crown, star hat, sitting on top of
  the helmet) and **trails** that stream out of the back wheel (sparkles, hearts, bubbles, a rainbow). Pick them with the
  Looks button on the title menu.
- **Mini RC Racers**: a trail comes out behind your car in every kind of race and in Heart Battle. RC has its own main
  menu, so it got a new pink **Looks** button at the bottom (with a red NEW star when there's something new).
- Same as the other games: stars you already have count right away, the "New!" moment pops up after a round that
  reaches a new look, and "New game" never takes a look away.
- No "paint color" look for now: both games already let you paint your bike / car in their shops, so it would double up.

Next: Bubble School and Piano Star (no hero to dress up, so trails: a magic finger trail, sparkles off the piano keys),
then showing the looks in My House and the Sticker Book.

## 2026-11-24 (Tuesday, latest) — The Star Road in 3 more games
The new plan, point 8 (something to work towards in every game), part 2.

- **Treasure Trail:** stars now unlock the 4 trails (sparkles, hearts, bubbles, rainbow) that float out behind the
  explorer as you walk. No new hats here: the explorer already has 6 hats to earn in the game itself.
- **Potion Quest:** hats and trails. A hat you earned goes on the Knight, the Ranger or the Wizard instead of their own
  helmet / hood / pointy hat (take it off on the Looks screen to get theirs back), and the trail follows you as you walk.
- **Fishing Frenzy:** hats and trails. The fisher in the boat (or on the pier) wears your hat, and the trail follows
  the lure: through the air when you cast, then down under the water.
- Each of these games has the **Looks** button on its title menu now, the NEW star, and the big "New!" moment when a
  round's stars reach the next look. Stars you already had count right away.
- **Archery** stays as it is: it already had its own hats and arrow trails that unlock with stars.
- Behind the scenes: a Potion Quest test that waited for the first snowball now waits a little longer (the robot
  sometimes poofs the snowmen before they throw).

Next: Turbo Bike and Mini RC Racers (with a new kind of look: a paint color for the bike / car), Bubble School and
Piano Star; then showing the looks in My House and the Sticker Book.

## 2026-11-24 (Tuesday, evening) — Test fix (no game changes)
Two daily runs overlapped again and both built the Star Road (point 8, part 1). The one that finished first is on
the site, so this run kept it, checked it (the tests that GitHub flagged pass here: one thumb, My House, Jukebox) and
fixed one slow-machine test:

- **Jukebox test:** after tapping Home it waited only 1 second for the hub to open; on GitHub's slower machines that
  isn't always enough. It now waits up to 6 seconds.

## 2026-11-24 (Tuesday, newer) — The Star Road: stars unlock hats + trails
The new plan, point 8 (something to work towards in every game), part 1.

- **Every star now counts towards new looks.** Each game has its own little road of prizes: hats (a party hat, a flower
  crown, a crown and a purple star hat) and trails that follow you (sparkles, hearts, bubbles and a rainbow). The first
  one comes after just 2 stars, the next ones every few stars.
- **A "Looks" button** on the title menu (a party hat). It gets a little red NEW star when there's something new. The
  Looks screen shows the hats and trails side by side: tap one to put it on (it turns yellow), tap it again to take it
  off. The ones still to earn have a padlock and the number of stars they need.
- **A big "New!" moment.** When a round's stars reach a new look, a purple "New!" sign pops up with the new hat or trail
  in a golden glow, confetti and a happy jingle. "Wear it!" puts it straight on, OK keeps your old one; then the usual
  results.
- A small chip on the title menu and on the results shows how far you are: your stars / the stars the next look needs.
- **Jungle Jump**: all 5 heroes can wear the hats (even Bun with his long ears), and the trail floats out behind you
  while you run (nothing while you stand still). **Putt-Putt Park** and **Hoop Heroes**: the trail follows the ball.
  **Space Defender**: it streams out of the rocket's engine.
- Stars you already had count right away, so most kids will find a NEW look or two waiting. "New game" never takes a
  look away, and nothing unlocks during "Show me".

Next: the Star Road in the other games (Treasure Trail, Potion Quest, Archery, Turbo Bike, Mini RC Racers, Fishing,
Bubble School, Piano Star), then showing the looks in My House and the Sticker Book.

## 2026-11-24 (Tuesday, afternoon) — Test fixes (no game changes)
Two daily runs overlapped this morning and both built Hoop Heroes' challenge courts; the one that finished first is
the one on the site, so this run kept it and fixed what the automatic GitHub tests flagged instead:

- **Calm motion test** couldn't start on GitHub (a picture-reading helper wasn't installed there). Now it is.
- **Hoop Heroes test:** the "real mouse pull-back scores" check took a single shot; on GitHub's slower machines one
  shot can rattle out. It now gets up to 3 tries (it still scores on the first try here).

## 2026-11-24 (Tuesday) — Hoop Heroes: 4 challenge courts
The new plan, point 7 (more to play where a game feels short), part 5, the last part. **Point 7 is finished.**

- **A new "Courts" tab** on the Hoop Heroes picker (a gold star button next to the rivals' red face). Each court has
  no rival: it has a twist instead, and your score earns the stars.
- **Golden Balls:** every third ball glows gold with twinkles and a little "5" next to it. Sink it for 5 points and a
  shower of gold.
- **Up and Down:** the hoop slowly rides up and down the whole time, so you pull a bit harder when it's high.
- **Near and Far:** the hoop glides close to you and far away. When it's far, the backboard lights up "3 POINTS!", so
  it's worth waiting for the long shot.
- **Hot Shots:** the net starts ON FIRE, and every basket on fire is worth 3. A miss puts it out, but 2 in a row lights
  it again.
- The first court is open from the start; getting a star on one opens the next. A star on all four earns the
  **Court star** trophy and a new ball, the **Disco ball** (silvery, with a star trail). Sinking a golden ball is the
  **Golden touch** trophy.
- The aiming help (stronger on Easy) aims at where the moving hoop will be when the ball gets there, like it already
  did for the sliding hoops.
- The pretend children played every court: big kids get 2-3 stars, little kids (on Easy) 2-3 stars, nobody misses
  out on the first star.
- Behind the scenes: every Hoop Heroes level now says its own difficulty, so the rivals still play exactly as before.

Next: point 8 of the plan, something to work towards in every game (a star counter that unlocks new looks).

## 2026-11-24 (Tuesday, latest) — Treasure Trail: two new adventures
The new plan, point 7 (more to play where a game feels short), part 4.

- **Rainbow Falls** (opens after Sunset Swamp): a big soft rainbow in the sky, cliffs with waterfalls rushing down,
  spray drifting up and blue butterflies. 11 rooms.
- **New: the raft.** Some rivers are too wide to jump, so a little log raft (with a red flag) floats from bank to bank
  and waits at each one. Walk on, ride across, walk off. It has a rope fence, so you can't fall off while it's out on
  the water. If you jump in while it's on the other side, it's a splash. You can grab a treasure in the middle as
  you float past.
- **Mushroom Hollow** (opens after Rainbow Falls): giant spotty mushrooms instead of trees, and glowing spores
  floating gently up. 12 rooms.
- **New: bouncy mushrooms.** Two mushrooms with happy faces stand in a pond. Jump onto the first one and BOING, you
  bounce high over to the next and onto the far bank. A treasure hangs up high, right where the first bounce takes you.
  The mushroom squishes and grins when you land on it.
- **For little kids (one thumb):** the explorer waits on the bank for the raft by himself, rides it and walks off
  (tapping there does nothing, so no accidental splashes). At the mushroom pond he waits; one tap and he bounces across.
- 3 new trophies: Raft ride, Boing boing, and Over the rainbow (finish both new adventures).
- The pretend children played them: big kids (Challenge) and little kids (Easy) won both on the first go, with all or
  nearly all the treasure.

Next: the last part of point 7, new Hoop Heroes challenge courts.

## 2026-11-24 (Tuesday, latest) — Space Defender: Cloud Park, a starter sector
The new plan, point 7 (more to play where a game feels short), part 3.

- **A new first sector for the littlest pilots: Cloud Park.** It sits before Moon Base on the sector picker and is
  open from the start (it doesn't lock anything, and old progress is untouched). A soft blue sky full of puffy
  clouds, with its own slow, happy bell song.
- **Extra gentle:** only bobbing robots and little squads fly in, and none of them shoot. Everything moves slower,
  presents drop more often, you get one more life, and bumping into a robot just pops it with a "boing" (no bonk).
- **Two new boss friends:** the mini boss is **Baby Bobber** in a propeller cap (blows one big, slow bubble and lets
  out a few baby bobbers), and the big boss is **the Big Puffy Cloud**, a sleepy cloud with a rainbow behind it. It
  opens its eyes and puffs its cheeks before it blows a slow bubble or drizzles a few raindrops (the spots light up
  first). It gets tired quickly. The whole flight takes about a minute. New trophy: **Cloud hug**.
- **Who goes there:** little kids' Play button takes them to Cloud Park first (even if they've already flown further).
  Big kids only get it on their very first Play; after that Play goes on to the next real sector. Anyone can pick it.
- The playtest robot flew it: both pretend kids won every time, with no bumps, in under a minute.

Next: the rest of point 7: 2 new Treasure Trail adventures, then new Hoop Heroes courts.

## 2026-11-24 (Tuesday, latest) — Bullseye Adventure: a 4th place, Autumn Woods
The new plan, point 7 (more to play where a game feels short), part 2.

- **Autumn Woods** comes after Snowy Hills: orange hills with round red, orange and golden trees, a little red barn
  with a silo, pumpkins and fallen leaves in the grass. Leaves tumble down and drift with the wind (so you can see
  which way it blows), geese fly by, and the trees sway. It has its own cozy song.
- **3 new levels:** Leaf Fall (a target and balloons, one floating up), Tree Swing, and Golden Woods (at sunset, with
  fireflies; a turning target plus a swinging one, floating balloons and a golden star).
- **New kind of target: the swing.** It hangs on two ropes from a wooden swing frame and swings gently to and fro, so
  you shoot when it comes your way. Arrows that stick in it swing along with it.
- **Playing with friends** has a 4th place too: Autumn Woods.
- The new levels were tried by the pretend children: big kids win them every time, mostly with 2 stars (3 takes good
  aim); little kids (on Easy) get 3 stars.
- The older levels still play on the same difficulty as before (adding a place could otherwise have made level 4
  easier and level 7 easier, because the game used to work it out from the position in the list).

Next: more of point 7: Space Defender's easy starter sector for little kids, 2 new Treasure Trail adventures
and new Hoop Heroes courts.

## 2026-11-24 (Tuesday, very late) — Bubble School: Colors + Shapes
The new plan, point 7 (more to play where a game feels short), part 1.

- **Two new lessons for the littlest players**, right after Count to 5 and open from the very start (they don't
  lock anything, and nobody's old progress changes).
- **Colors:** the bubbles hold paint blobs. "Find blue!" (little kids see the blue blob on the card to match it,
  plus the word; big kids only hear it and see the word), and "What color is the apple?": the apple (or banana,
  water drop, leaf, carrot, grapes, pig) is drawn white and fills in with its color when you pop the right bubble.
- **Shapes:** the bubbles hold shapes, each a different color so it's the shape that counts. "Find the heart!" and
  "What shape is the pizza?" (ball, present, pizza; big kids also an egg, a kite and a door).
- Little kids get 3 bubbles and the main 6 colors / circle, square, triangle, star, heart. Big kids get 4 bubbles
  and also pink, brown, rectangle, oval and diamond.
- Finishing Shapes brings a new sea friend: a round, happy **Pufferfish**. Finishing both = the new
  "Rainbow shapes" trophy. Both lessons can be picked for the Friends quiz race too.
- The robot "little kid" finished both lessons with 3 stars every time.

Next: more of point 7: an easy starter sector in Space Defender for little kids, then 2 new Treasure Trail adventures and
new Hoop Heroes courts.

## 2026-11-24 (Tuesday, late night) — "Show me" part 4: Piano Star (point 6 is finished!)
The new plan, point 6 ("Show me" how to play), the last part.

- **Piano Star:** the first time a child picks a song, the see-through hand taps the glowing key, note after note, so
  the song really plays along for a few seconds (white keys low down, black keys near their tip). Then "Your turn!" and
  the song starts from the beginning.
- **Two-hands songs:** the left hand joins in and taps the low left-hand note right after the right hand taps its note.
- **Free Play:** the hand plays a little tune up and down the keys.
- As in every other game: once per player, a tap skips it, the yellow Show me button on the Help and Pause screens plays
  it again, and nothing the demo plays counts (no stars, no Free Play note count).

Every game in the arcade now has "Show me". Next: point 7, more to play where a game feels short (Archery's 4th place,
2 new Treasure Trail adventures, new Hoop Heroes courts, Bubble School shapes + colors, an easier Space sector).

## 2026-11-24 (Tuesday, night) — "Show me" part 3: racing, questing and flying
The new plan, point 6 ("Show me" how to play), part 3.

- **Mini RC Racers:** the first race starts with a short "1, Go!", then the see-through hands drive: the right
  thumb holds Gas, taps the gift button (the demo always gets a turbo at "Go!") and goes back to Gas, while the
  left thumb steers into each bend. Little kids with one thumb only see the steering (the car drives itself).
- **Potion Quest:** the demo skips "Pick your hero". The left finger presses on the ground where to walk, the right
  thumb taps Bonk when a baddie (or a jar) is close, and once there are a few baddies it shows the potion magic.
  One thumb: just the Bonk button.
- **Space Defender:** one finger slides on the screen a little behind and below the ship (so it never covers it):
  the ship moves the same way, lines up with the silly robots and slips away from the bubbles, firing all the time.
- **Fixed:** pressing Escape to pause Mini RC Racers sometimes jumped back to its main menu instead of showing the
  Pause screen.
- As before: once per player, a tap skips it, the yellow Show me button (Help + Pause) plays it again, nothing counts.

Next: Piano Star, the last part of point 6.

## 2026-11-24 (Tuesday, evening) — "Show me" part 2: two see-through hands for the button games
The new plan, point 6 ("Show me" how to play), part 2.

- **The demo hand has a twin.** A second see-through hand (the left one) joins in, so the demo can show
  "hold one button and tap another" with two thumbs at once, just like a child holds a tablet. On a computer the
  little key pictures sit on the same sides: the arrows by the left hand, Space by the right.
- **Turbo Bike:** the right thumb holds Gas, slides over to Turbo for a burst, then back to Gas, while the left
  thumb changes lanes (only on flat ground, so it always works).
- **Jungle Jump:** the left thumb holds Right; the right thumb taps Jump just before a gap, thorns or a step,
  and Roll to bonk a rock or a ladybug.
- **Treasure Trail:** the left thumb holds Right and lets go to wait at a snake; the right thumb jumps over the
  logs and the snake, then onto the vine.
- **Fishing Frenzy:** hold Cast and let go at a good power, move the lure up or down to a fish, wait through the
  little nibble, tap on the big dip, then hold and let go to keep the needle in the green. In the demo the fish
  come over quickly, and it ends a moment after the catch.
- **Little kids with one thumb** only see the one big button being tapped (the game walks / rides by itself).
- As before: the first Play shows it once per player, a tap skips it, the yellow Show me button (Help + Pause)
  plays it again, and nothing in the demo counts.

Next: part 3, Mini RC Racers, Potion Quest and Space Defender, then Piano Star.

## 2026-11-24 (Tuesday, later) — "Show me" how to play, part 1: a moving hand shows the moves
The new plan, point 6 ("Show me" how to play), part 1: the shared piece every game will use, and the first 4 games.

- **The first time a child presses Play** in Hoop Heroes, Putt-Putt Park, Bullseye Adventure or Bubble School, the
  real game plays itself for about 6-7 seconds while a **see-through white hand** does the moves, with a little
  white ring pulsing where the finger presses and an eye picture in the corner ("watch!").
  - **Hoop Heroes:** the hand puts a finger on the ball, pulls it straight down and lets go: two baskets.
  - **Putt-Putt Park:** finger on the ball, pull back the other way, let go (the best putt, so it often drops in).
  - **Bullseye Adventure:** finger down in front of Pip, pull back toward him and let go: the target, then a balloon.
  - **Bubble School:** listens to the question for a moment, then taps the right bubble (two questions).
- Then a big green **"Your turn!"** pops up, and the round starts fresh from the beginning.
- **A tap anywhere (or any key) skips it**, straight to "Your turn!".
- **Watch it again any time:** the Help screen (on the title menu) and the Pause screen have a new yellow **Show me**
  button with a pointing hand.
- It comes by itself only once per player per game. **Nothing the demo does counts**: no saved scores, stars,
  trophies, house coins or Daily Surprise progress.
- Works on phones, tablets and computers, upright and sideways; the home button still works during it.

Next: part 2, the games with on-screen buttons (Turbo Bike, Mini RC Racers, Jungle Jump, Treasure Trail, Potion
Quest, Space Defender, Fishing Frenzy): the hand will press the real on-screen buttons (and little key pictures on a
computer), with two hands at once for "hold Right + tap Jump". Then Piano Star.
- New test: `tests/test_showme.py`.

## 2026-11-24 (Tuesday) — Playability check, part 5: Fishing Frenzy + Bubble School (point 5 is finished!)
The new plan, point 5 (the playability check), the last part. The pretend-child robot now plays the last two games,
every place / topic, as a big kid and as a little kid, in fast-forward:
- **Fishing Frenzy:** casts after a moment (big kids love the longest cast), wiggles the lure, gets bored and casts
  again, sometimes taps on a little nibble (too early!), taps a moment after the big dip, and reels with a thumb that's
  always a moment late. Each place is fished with the rod a child would have by then.
- **Bubble School:** listens, then taps; knows the answer some of the time (less for little kids, less for harder
  topics), otherwise guesses. Little kids sometimes tap the same wrong bubble again, and fingers don't land exactly.

**What it found, and the fixes**
- **Fishing, Easy and Normal were fine** (stars everywhere; little kids got 2-3 stars at every place).
- **Fishing at Moonlight Bay (Challenge) was too fiddly.** Every early tap on a little nibble scared the fish away
  (a pretend big kid lost 4-12 fish in 3 minutes that way), and reeling took about 20 seconds a fish, because the green
  part is narrow and a child's thumb is always a moment late. The Frenzy gave no star in 4 of 6 rounds.
  Now: each fish forgives one early tap on Challenge ("Wait...", like Normal, which now forgives two); the reel bar has
  a **pale-green edge on both sides of the green: it still reels the fish in, at half speed**; and the Challenge
  Frenzy's star marks are a little lower. Now: a star every round, about 15 seconds a fish.
- **Bubble School: little kids tapped the same wrong bubble again and again** (up to 13-18 taps on one question, and
  every tap counted as a miss). Now a wrong bubble you tapped **goes see-through and a bit smaller**, so it's clear it's
  "not that one", and tapping it again isn't another miss.
- **A little help:** after 2 wrong tries on Easy (3 on Normal) **the right bubble glows softly** and the question is
  read out again. Challenge has no glow.
- **Stars were too stingy** with more bubbles: they counted every wrong tap, so on the later topics even good pretend
  big kids always got 1 star. Now stars count the questions that needed a second try (on Easy: 3 stars with up to 2 of
  those, 2 stars up to 5). Little kids went from mostly 1 star to mostly 2.
- A bubble that is still popping in (and can't be seen yet) can't be tapped by accident any more.

**Point 5 is finished:** all 11 arcade games have been played by the pretend children. Next is point 6, "Show me" how
to play (a moving see-through hand shows the moves the first time).
- Run it yourself: `python3 tools/playtest.py fishing` (or `abc`) prints a table.
- `tests/test_playtest.py` checks these fixes too.

## 2026-11-23 (Monday, latest) — Playability check, part 4: Space Defender, Bullseye Adventure, Hoop Heroes
The new plan, point 5 (the playability check), part 4. The pretend-child robot now plays three more games, every level,
as a big kid and as a little kid, in fast-forward:
- **Hoop Heroes:** shoots when a ball comes, with a "feel" for how hard to pull that gets better every shot (and is
  suddenly too short when the hoop moves back for the 3-point bonus); the hand wobbles; on a sliding hoop it aims at where
  the hoop is right now (big kids slowly learn to aim a bit ahead).
- **Bullseye Adventure:** picks the big target or a balloon, takes a moment to aim. On Easy it sees the whole flight;
  on Normal and Challenge it has to guess the pull and gets closer shot by shot.
- **Space Defender:** flies in line with the baddies, grabs presents, and dodges what it *notices*: bubbles and a
  boss's warning stripes are spotted a moment late, and not always.

**What it found, and the fixes**
- **Hoop Heroes, Wiggle Wes (the sliding hoop) beat everybody.** The game's aiming help aimed at where the hoop *was*
  when you let go, but the ball takes about a second to get there. Little kids lost all 6 rounds to Wes. Now the help aims
  where the hoop *will be*: little kids win every round, and big kids hit about half their shots there instead of 1 in 6.
- **Wes and the Champ on Challenge: pretend big kids won 0 of 12 rounds.** On Challenge the hoop is now a little
  bigger and the help a little stronger, the rivals don't speed up on Challenge any more, Wes's hoop slides a bit slower
  and Wes and the Champ shoot a bit less often. Now big kids win about 2 rounds in 3: still the hardest ones, but fair.
- **High Score on Easy:** little kids scored 36-44 and the first star was at 40, so they often got none. The star
  marks are 20% lower on Easy.
- **Bullseye Adventure, Big Blizzard (the last level, Challenge) was won only half the time.** On Challenge there are no
  aiming dots, and an arrow that flew off the screen left no clue at all. Now, on Normal and Challenge, **the last arrow's
  flight stays on the screen as faint dots** until the next shot, so a child can see "a bit higher, a bit softer". Big
  Blizzard's targets are a little bigger and slide less, and its goal is 15 points (was 17). Frosty Flip's target turns
  a little slower and its goal is 10 (was 12). Easy and Normal were already fine (3 stars on every Easy level).
- **Space Defender:** both kinds of pretend kid won every sector on the first go, with 0-3 bumps. What bumped them most
  was a boss's **laser beams** (several stripes at once). On Easy and Normal there are now at most 2 beams at a time
  (Challenge keeps 3).

- Run it yourself: `python3 tools/playtest.py hoops` (or `archery`, `space`) prints a table.
- `tests/test_playtest.py` checks these fixes too.

## 2026-11-23 (Monday, late night) — Playability check, part 3: Turbo Bike + Mini RC Racers
The new plan, point 5 (the playability check), part 3. The pretend-child robot now rides Turbo Bike and drives Mini RC
Racers, every track, as a big kid and as a little kid (one thumb), in fast-forward. How the pretend children play:
- **Turbo Bike, big kid:** holds Gas the whole time, loves Turbo (lets go when the engine looks hot, a moment late), and
  in the air most let go of Gas, some keep holding it, a few try to tilt the bike and overdo it.
- **Mini RC Racers, big kid:** looks where the road goes a moment late, holds a turn a bit too long, hardly ever brakes,
  looks away now and then, and sometimes **mixes up left and right when the car drives down the screen** (very common
  for children with cars seen from above).
- **Little kids** play one thumb: just a tap now and then.

**What it found, and the fixes (Turbo Bike)**
- **Table tops tipped children over on Normal.** Holding Gas in the air tilts the bike forward, and children hold Gas
  all the time, so every big jump ended nose-first. Also, off a fast table top the bike can't turn far enough by itself
  before it lands. Now, on Easy and Normal: a button that was already held when the bike took off doesn't tilt it (let
  go and press again to tilt), and hands off the tilt for the whole jump = never a tumble (at worst a wobble that slows
  you a bit). Tilting well still earns "Perfect!". Challenge stays as it was. Tumbles on Normal: about 1 a ride -> none.
- **"Too hot!" came as a surprise** (the heat meter is up in the corner; children watch the bike). Now, nearly too hot,
  steam puffs out of the bike and it beeps three times, getting higher, with a little "Hot!".
- **Too hot on a hill = the bike stopped dead** (Cloud Castle's moving ramps, 3 seconds on Challenge). Now it putters on
  slowly while it cools down.
- **Little kids could never get gold on the first two tracks** (no turbo button in one thumb). Now the bike turbos by
  itself while the engine is cool and stops before it gets hot. Little kids get gold everywhere now (they're on Easy).
- **Candy Bounce**: even good pretend riders only ever got silver; its medal time is a second longer (par 10.4 -> 11.4).

**What it found, and the fixes (Mini RC Racers)**
- **The self-driving car (one thumb / little kids) ran wide on nearly every bend, even with hands off**, out onto the
  grass and back: 12-35 seconds of every race. It only looked a little way ahead and only kept the car *pointing* along
  the road, not in the middle. Now it eases off for the bends coming up and steers for the middle of the road ahead,
  like the rival cars do: hands off = no time on the grass at all. And when a press near the edge would take the car
  off the road (the left/right mix-up), the helper wins.
  Pretend little kids: 16-45 s on the grass per race and often 4th -> about 3-8 s, and 1st or 2nd.
- Little kids then won by miles, all alone at the end, so rivals far behind hurry a bit more now.
- **A big kid lost out on the grass** (Cloud Castle: a whole minute of one race!) was never helped, because the help
  only came for a car standing still. Now a car out on the grass for 4 seconds (3 for little kids) is lifted back.
- Big kids still drift wide on the harder tracks; nearly all of that comes from the left/right mix-up. See the note for
  Keith below.

- Run it yourself: `python3 tools/playtest.py bike` or `python3 tools/playtest.py rc` (prints a table).
- `tests/test_playtest.py` checks these fixes too.

## 2026-11-23 (Monday, night) — Playability check, part 2: Jungle Jump + Treasure Trail
The new plan, point 5 (the playability check), part 2. The pretend-child robot from part 1 now plays Jungle Jump and
Treasure Trail too: a pretend big kid jumps a moment late and sometimes lets go of the leaf too soon; a pretend little kid
plays with one thumb and taps Jump a little while after the hero stops. Good news first: **both kinds of kid finished every
level and every adventure on the first go.** But they showed some unfair little spots, all fixed:

**Jungle Jump (one thumb, for little kids)**
- **Springs and jelly blocks threw the hero onto thorns.** In Snowy Hills and Candy Land there are thorns just behind a
  spring / bouncy block, and the hero landed on them every single time. Now, while flying, he steers to a safe spot
  (keeps going, stops, or opens his leaf).
- **Rolling over thorns.** When a critter was just past some thorns, the hero rolled at it straight over the thorns. Now he
  only rolls when the whole way is safe.
- **Ice before thorns**: he slid into them. He stops in time now.
- A hidden bug: after "Again" or a new level, the hero could keep an old "is it safe to glide?" answer for the whole go.
- **Goodies come to you.** With one thumb the hero walks by himself, so little kids picked up only 1 in 4-10 goodies and
  always got 1 star. Now goodies close by fly to the hero with a sparkle, and 2 stars start at a quarter of them.
- Little kids' bumps went from about 1.5 per level to almost none.

**Treasure Trail**
- **The tunnel bat** used to hover right over the treasure at the end of the tunnel, so fetching it nearly always meant a
  bump. The bat turns back a little earlier now; you still have to hop over it on the way.
- **Hippos warn you**: they blow bubbles for a moment before they dip under, so a child can see it coming.
- The swinging vine is a bit easier to catch on Normal (pretend big kids kept just missing it).

**Still to look at:** big kids take 2-4 minutes on Treetop Trail (most levels take under 1), mostly around the lift up the
hill. Glow Cave and Jelly Hills cost big kids 2-3 falls but they still win first go.

- Run it yourself: `python3 tools/playtest.py jungle` or `python3 tools/playtest.py trail` (prints a table).
- `tests/test_playtest.py` now checks these fixes too.

## 2026-11-23 (Monday, Keith live) — Game logos on the hub, and no more surprise reload
Keith sent a phone screenshot: the hub opened, then reloaded by itself, and he wanted the game pictures to be logos without titles.

- **The hub doesn't reload any more** when it opens. It used to reload once every time a new version had been pushed (and
  there were a lot of pushes today). Now it checks first: the page it already showed is the new one, so it stays put. It
  only reloads in the rare case the phone showed an old saved copy.
- **Game logos**: every game is now a big shiny app icon (rounded corners, a shine over the top, a thick outline), like the
  apps on a phone's home screen. No names under them: the picture says which game it is. Your stars, medals and the heart
  sit on a little white pill under the icon. Today's surprise present still bounces on its game's corner; while picking
  hearts, a hearted game glows yellow behind its icon.
- Checked: the hub at phone / sideways / computer sizes, players, hearts, Daily Surprise, scrolling, stickers, the home button,
  offline + a pretend update (no second load), Calm-motion contrast.
## 2026-11-23 (Monday, latest) — Playability check, part 1: a pretend-child robot, Putt-Putt Park + Potion Quest
The new plan, point 5 (the playability check), part 1.

- **A new robot that plays like a child**, not like a perfect bot (`tools/playtest.py`). In mini golf it sees a good
  putt but its hand wobbles (a little kid wobbles more). In Potion Quest it reacts a moment late, misses some bonks,
  wanders off now and then and forgets the magic. It plays every hole / place many times, as a big kid and as a little
  kid, and prints a table of how it went, so we can see the unfair spots.
- **Potion Quest: the Blob King was the big wall.** Pretend big kids needed 3 to 7 tries and got squashed 8-14 times
  by his jumps. Now the red ring showing where he'll land appears **while he winds up**, not only once he's in the
  air, so there are about 2 seconds to walk out of it, and he lands exactly on the ring. Now: won on the first try,
  1-3 bumps. He still hops and calls helpers; it's just fair now.
- **Mushroom Woods** was the next hardest: the last wave had 8 baddies arriving close together (now 6, a bit slower)
  and wave 4 has 2 fewer minis. Pretend big kids went from up to 4 tries to 1.
- **Putt-Putt Park:** **Bumper Garden** (hole 3, meant to be easy) had its big bumper exactly on the straight line to the
  cup, so a straight putt always bounced back: 4.3 putts on average. The bumper is a bit smaller and a step up now: 2
  putts (a wobbly putt still goes boing). The **Boardwalk** is a little wider (little kids kept splashing), and the
  **Lighthouse** (the last beach hole) has shorter windmill blades in the bend: little kids went from about 7 putts to 5.
- Everything else was fine: little kids won every Potion Quest place on the first try, and every other hole is about
  par for both big and little kids. The Frosty King is a fair final boss (1-2 tries).
- New test `tests/test_playtest.py` keeps these fixes from coming undone.

Next: point 5, part 2: the same check for Jungle Jump and Treasure Trail, then the other games.

## 2026-11-23 (Monday, late) — Every game checked upright + sideways; results fit on a computer
The new plan, point 4, last part: making sure every game works however the phone or tablet is held.

- **A new robot check** plays all 12 arcade games, the coloring book and the maze on 5 screens: a phone sideways, a phone
  upright, a small phone upright and a tablet both ways. It taps Play like a child would, then checks that nothing sticks out
  of the screen, the game fills the screen, every touch button is on the screen, big enough for a thumb, not on top of
  another button and not under the home / pause corners. Then it **turns the device in the middle of a game** and back:
  the picture and buttons follow and the game carries on. On an upright phone the wide games still show the big "turn me"
  picture and wait, and "play upright" still works.
- **Fixed: coloring on a small phone held sideways.** The crayons and tools took most of the screen and the picture was a
  tiny square. Now the controls take at most half, so the picture is almost twice as big.
- **Fixed: the race results screen scrolled a tiny bit on a computer** (the "NEW BEST!" words sat just under the edge). When a
  results picture (like the big podium) is a little too tall, it now shrinks just enough so everything fits without scrolling.
- Everything else passed: no game had buttons off the screen or under the corners, and turning the device never broke a game.

**That finishes point 4 (better touch controls).** Next: point 5, the playability check (robots play every level on
Easy / Normal / Challenge and we tune anything too hard or too easy).

## 2026-11-23 (Monday, night) — Glossy menus, part 3: the last plain bits get shiny
Keith's glossy-menus note, last part: the few screens that aren't drawn by Phaser now match the shiny canvas menus.

- **Making a player** (the pencil in "Who's playing?"): the box is a deep purple panel with a gold rim, like every other menu.
  Your animal sits big in a gold ring with a soft golden glow; the animals, colors, Little / Big and the tick / cross are
  shiny buttons, and the one you picked glows.
- **"All done for today!" and "Time for bed!"**: slow light rays turn behind a gold-rimmed panel, a few little stars twinkle,
  and the words sit on a shiny sign (pink for "all done", purple for bedtime). The home button and the grown-ups' hold button
  are shiny too. Calm motion: the rays and twinkles stand still.
- **Coloring book + maze**: every round button in the top bars, the crayons, the fill / brush / eraser / sticker tools and
  the size dots are now glossy, like little candy buttons, with a shine and a shadow. The home + pause buttons in the
  corner of every game got the same shine.
- Also fixed a test (the "taps right after the title are ignored" check) that had become too tight on time.
- Checked: hub, players, Parent corner (the walls + hold button), coloring, maze + Maze Maker, page music, home button,
  Calm-motion word contrast, offline, and phones for coloring / maze / Parent corner.

**That finishes Keith's glossy menus note.** Next: the race results screen still scrolls a tiny bit on a computer (from
part 2c), then back to the plan: point 4's last part (check every game held upright + sideways).
## 2026-11-23 (Monday, latest) — Glossy menus, part 2d: shiny podiums + tables inside the results pictures
Another run did part 2c (the golden glow, star twinkles and score plaque round the results) at the same time; this run
polished the pictures themselves.

- **Shiny podiums**: in Mini RC Racers (every race and the end of a cup) and Turbo Bike's cups, the 1-2-3 steps are now
  glossy gold, silver and bronze, with a shine across the top, a shadow, white numbers, and a gold ring round the step
  you're on. The podium casts a soft shadow on the floor.
- **A glow for the winner**: soft light rays fan out behind the winner (they fade away gently instead of stopping at an edge),
  a bit dimmer when you weren't in the top 3.
- **Shiny trophies**: the cup trophy at the end of a cup is shiny, glows, and gets rays + twinkles when you win it.
- **Points tables**: the cup points (Turbo Bike between races, RC's Grand Prix) are shiny rows, yours in gold, with shiny bars.
- **Ghost races**: Boo's (RC) and Wisp's (bike) cards have shiny rows, a glow behind the ghost trophy / Wisp, a spotlight on
  the new Ghost Car, and Wisp's week circles are shiny too.
- Also fixed an old test that hadn't caught up with the My Car stage from part 2a.
- Checked: the bike cup + ghost race, RC's race / cup / ghost / Heart Battle results, every RC menu, every game's canvas menus,
  the hub, the Calm-motion word contrast test and phones for RC + bike.

Next: part 3 of the glossy menus (the HTML-only bits: the player editor, the "All done for today" wall, the maze + coloring
top bars), then back to the plan: point 4's last part (every game held upright + sideways).
## 2026-11-23 (Monday, latest) — Glossy menus, part 2c: the results
Keith's glossy-menus note still comes first. (Two runs worked at the same time tonight: the other one did the hero / ship
pickers and the Parent charts, so this one kept only its own part: the results screens.)

- **Results feel like a prize**: the stars stand in a soft golden glow with light rays fanning out behind them, and each
  star bursts into little twinkles as it pops in.
- The **medal** gets the same glow, and so do the games' own big results pictures: Mini RC Racers' podium and cup podium,
  Turbo Bike's cup table and podium, and the Ghost Race card.
- **The score is on a plaque**: a dark sign with a gold rim ("SCORE" small, the number big), and a pink **NEW BEST!**
  ribbon next to it that gives a little wiggle now and then.
- The glow is painted to fit its row exactly, so nothing gets pushed down or needs scrolling. Calm motion: the glow
  stands still and no twinkles fly.
- Checked: the menu walk through every game, RC's finish-line party + podium, Turbo Bike's cups + Ghost Race, Jungle Jump,
  Space Defender, the Parent corner, phones, the hub, scrolling, offline, the Jukebox and the Calm-motion word contrast test.

That finishes part 2. Next: part 3 of the glossy menus (the few HTML bits left: the player editor, the "All done for today"
wall, the maze + coloring top bars), then the last part of point 4 (every game held upright and sideways).

## 2026-11-23 (Monday, late night) — Glossy menus, part 2b: hero + ship pickers, Parent corner charts
Keith's glossy-menus note still comes first, so this run did the next part of it.

- **Your hero on a stage**: in Jungle Jump's Unlocks page, the hero you picked stands big on the shiny gold stand in a
  spotlight, with slow light rays behind (like the Bike Shop). Your stars and treasures sit under it, and the heroes to pick
  are next to it under a "Pick your hero" ribbon. Tap another hero and it jumps onto the stage.
- **Your ship on a stage**: the same in Space Defender: your ship on the gold stand, the ships to pick under a "Pick your
  ship" ribbon. The auto-fire switch stays at the top (so it's seen without scrolling), and the Weapon Book got its own ribbon.
- On an upright phone the stage is on top and the picker below it.
- **Parent corner charts**: the screen-time chart and the "what they played" list are shiny now: a soft lilac card,
  dashed guide lines, bars with a color blend, a shadow and a white shine, today's bar green with a little gold star, a
  colored dot next to each game, and each chart sits in a gold-rimmed frame. The long-bar / minutes overlap in the games
  list is fixed. Every heading on the Parent corner is now a shiny ribbon.
- Checked: the canvas-menu walk through every game, Jungle Jump, Space Defender, the Parent corner, phones (Jungle, Space,
  Parent), scrolling, the hub and the Calm-motion word contrast test.

Next for this: part 2c, the results pictures (the RC + bike podiums, the cup tables, the ghost race card), then part 3
(the HTML-only bits: the player editor, the "All done for today" wall, the maze + coloring top bars).

## 2026-11-23 (Monday, night) — Glossy menus, part 2a: shops, books + builders
Keith's glossy-menus note still comes first, so this run did the next part of it: the games' own special screens.

- **Headings are little ribbons**: in long lists ("Upgrades", "Paint", "Bait", "Sunny Pond", "Pick your bike") the heading sits
  on a shiny purple ribbon with a gold twinkle on each side, so the sections are easy to tell apart.
- **Your bike and your car on a stage**: the Bike Shop and Mini RC Racers' My Car show the bike / car you've made standing on
  a shiny gold stand in a spotlight, with soft light rays turning slowly behind it. On a computer or tablet it stands on the
  left with the choices on the right; on an upright phone it's above them. Change the paint and it shows on the stage at once.
- **Shiny counters**: the coin, shell and fish-count chips have a shadow and a soft shade like the buttons.
- **Shiny cards**: the colored boxes in Turbo Bike's track builder (and the Sticker Book's pages) have a soft color blend, a
  shadow and a thin light line inside the edge.
- **Picture frames**: RC's Track Builder board, My House's room and the Jukebox's dance floor sit in a frame with a gold rim.
  (The aquarium already has its own glass tank, so it stays as it was.)
- Calm motion: the light rays stand still and the stage doesn't breathe.
- Checked: the menu tests, the bike shop + builder, fishing, RC builder + menus, My House, Jukebox, Sticker Book, scrolling,
  the hub and the Calm-motion word contrast test.

Next for this: part 2b, the results pictures (podiums, cup tables), Jungle Jump's hero picker, Space's ship picker and the
Parent corner's charts.
## 2026-11-23 (Monday, night) — Better touch buttons, part 3: one thumb in Jungle Jump, Treasure Trail and Potion Quest (new plan, point 4)
This run started before Keith's live glossy-menus session landed, and did the next part of point 4: the "one thumb" mode from
this morning now works in the three adventure games too. That's every game with on-screen buttons. (Little kids get it
by themselves; a grown-up can switch it in the Parent corner, a kid in *Who's playing?*.)

- **Jungle Jump**: just the big Jump button. The hero walks by himself and **stops and waits** at the edge of a gap,
  in front of thorns and in the wind, so a jump is always the child's own choice (never a surprise fall). A jump always
  goes forward. A boulder or a critter in the way? He rolls into it by himself (smash! boop!). In the wind: hold the
  button to fly up; at the top he glides off onto the ledge by himself (he checks first that it lands safely). If he
  walks up to a wall that's too high and there's a wind just behind him, he walks back into the wind.
- **Treasure Trail**: just Jump. The explorer walks by himself and waits at ponds, in front of the sleepy snakes and
  before quicksand (he only walks across when it will stay shut long enough). At a vine pond a tap **waits for the vine
  to swing close, then jumps**; on the vine a tap lets go only when that lands on the far bank. At a ladder he climbs
  down for the hidden treasure, fetches it and climbs back up by himself.
- **Potion Quest**: just the big Bonk button. The hero walks by himself: up next to the nearest baddie, out of the way
  of snowballs, away from a stomping king, to the apples and potions, and on to the next group. The child does the
  bonking. With a full bag of potions and a crowd (or a boss) the magic goes off by itself. Touching the ground to walk
  still works too.
- **Bats in Treasure Trail's tunnels** don't cost a heart in one thumb mode (the explorer walks the tunnel by
  himself, so it wouldn't be fair); they still bump him back.
- Each game's "how to play" card shows the one-thumb pictures ("It walks by itself!", "It waits. Tap to jump!").
- Keyboards still work as before.
- I let a pretend little kid play who only ever taps the one button (at random-ish moments): it finished **all 8
  Jungle Jump levels**, **all 4 Treasure Trail adventures** (every treasure found) and **all 4 Potion Quest places**.
- `tests/test_one_thumb.py` now checks all six games (the buttons on a phone held sideways and upright, real finger
  touches, and that each game really helps).

Next: Keith's glossy menus, part 2 (each game's own special screens) comes first, as his note says; after that, point 4's
last part = a check of every game held upright and sideways on phones.

## 2026-11-23 (Monday, evening, Keith live) — Glossy menus + new logos, part 1: the shared kit
Keith asked for every menu and every logo to be redone for the Phaser library, looking sharp. He picked the **glossy arcade**
look, and to do the shared parts first. Since every game's menus are made by the same kit, all of them change at once:
the hub, all 14 games, the Sticker Book, My House, the Jukebox, the Parent corner and the coloring + maze menus.

- **Shiny buttons and tiles**: every tile and button has a soft shadow under it, a darker band along the bottom and a white
  shine across the top, so it looks like a real arcade button. The round picture buttons are little shiny balls.
- **The big Play button glows**, the glow breathing in and out with it.
- **The menu panel** goes from purple to deep purple, with a gold rim and a thin light line inside it. Titles ("Pick a
  track", "Paused") sit on a shiny pink sign; "You did it!" banners are shiny too.
- **A rounder, friendlier font** (Fredoka) for the words on tiles and buttons. It's saved in the arcade, so it looks the same
  on every phone and works offline. The chunky title letters stay Lilita One.
- **Title screens come alive**: the game's color glows from the middle, soft light rays turn slowly behind the logo, little
  bubbles of light float up and twinkles pop here and there.
- **Every logo is drawn by Phaser now, piece by piece**: the starburst spins, the round picture drops in and bobs, and the
  name pops in with chunky 3D letters on a gentle arch, with a shine sweeping across it now and then. Mini RC Racers had its
  own road-picture logo; it now matches the others (a round racing picture + "Mini RC Racers"). The hub's small logo is in the
  new style too.
- **Calm motion** (Parent corner): nothing spins, floats, glows or pops in. **Slow devices** (lite drawing) skip the glow, the
  shine and the floating sparkles.
- No new big library was needed: the new effects use parts of Phaser and Rex UI the arcade already had (particles, the glow and
  shine effects, a color-blend box). Only the Fredoka font file was added (free, Open Font License).
- Checked: the menu tests (every game's menus, scrolling, the hub, phones, Calm motion contrast) pass.

Next for this: part 2, each game's own special screens (RC's garage + builder, the bike shop, the fishing book, results pictures).

## 2026-11-23 (Monday, latest) — Better touch buttons, part 2: "one thumb" mode (new plan, point 4)
No new notes from Keith and no open issues, so this run did the next part of point 4: an easier way to play on a
phone or tablet for the littlest kids. Fewer buttons, and the game does more of the work.

- **The switch**: in *Who's playing?* there's a new round button next to little / big kid: a phone with **one big
  button** (one thumb) or a phone with **all its buttons**. Little kids start on one thumb by themselves.
- **Parent corner**: each kid's page has *Touch buttons*: **Auto** (one thumb for little kids), **One thumb** or
  **All buttons**.
- **Turbo Bike**: just two big lane buttons, one above the other. The bike pedals by itself and always lands flat.
  (Up / Down in the air still does tricks.)
- **Mini RC Racers**: just Left and Right, side by side. The car drives by itself, slows a little before sharp bends,
  steers back onto the road, and a gift goes off by itself after a moment. Heart Battle drives by itself too.
- **Fishing Frenzy**: just the big Cast / Reel button. The lure sinks or rises to the nearest fish by itself, tapping
  too early never scares a fish away, and the green part is wider when reeling in.
- The "how to play" card before a round shows the one-thumb pictures ("It goes by itself!", "Change lanes"...).
- Keyboards still work as before; the switch only changes the on-screen buttons and how much the game helps.
- New test: `tests/test_one_thumb.py` (the switch, the Parent corner, real finger touches in all three games held
  sideways and upright, and that each game really helps).

Next: point 4, part 3 = one thumb for Jungle Jump, Treasure Trail and Potion Quest (they need the most thought: the
hero walks by itself and waits at gaps, etc.), then a check of every game held upright and sideways.

## 2026-11-23 (Monday, later) — Better touch buttons, part 1: the new touch pad (new plan, point 4)
The new 10-point plan's **point 4, better touch controls**, first part: the on-screen buttons that phones and tablets
get in Turbo Bike, Mini RC Racers, Jungle Jump, Treasure Trail, Potion Quest and Fishing Frenzy.

- **Every button has its own color**: arrows are blue, Jump and Gas green, Brake red, Turbo and Bonk orange, the gift
  (use item) yellow, Roll and Magic purple. At rest it's a colored ring with a soft tint, so they're easy to tell apart.
- **They light up when pressed**: the button fills with its color and glows, and its picture pops a little, so a kid
  can see the game heard them.
- **Same layout in every game**: moving on the left, doing on the right, and the game's **main button** (Jump, Gas,
  Bonk, Cast) is the biggest one, at the far right where the thumb rests. (Jungle Jump had its own big yellow buttons;
  it now uses the shared ones.)
- **Easier to hit**: a thumb can **slide** from Left to Right (or from Gas to the gift) without lifting; a touch in the
  gap between two buttons goes to the nearest one; a thumb that slips a little off its button keeps holding it; two
  thumbs (or more fingers) work at the same time. Long presses never pop up the phone's own menu.
- A bit bigger on big tablets. Held upright, the buttons still stack two across without touching.
- Calm motion: no glowing fade, the buttons just switch color.
- New test: `tests/test_touch.py` presses the buttons with real (pretend) fingers in all 6 games, on a phone sideways,
  a phone upright and a tablet: big enough, on the screen, not on top of each other or the corner buttons, light up,
  sliding, gaps, two thumbs.

Next: point 4, part 2 = an optional **"one thumb" mode** for little kids (fewer buttons, the game helps more).

## 2026-11-23 (Monday) — Game feel, part 3: Turbo Bike, Mini RC Racers, Space Defender (new plan, point 3 finished)
No new notes from Keith and no open issues, so this run did the last part of point 3, the "game feel" pass. These three
now use the same springy helpers as the other games, so every arcade game feels alike:

**Turbo Bike**
- The bike **stretches as it flies off a ramp** (dust puffs fly back) and **squashes onto its wheels when it lands**,
  more after big air. Jelly pads fling it up tall, boost pads stretch it long with a warm flash, lane changes give a little squish.
- A tumble: a tiny pause, a *thud* and a little shake. Landing a trick: a tiny pause, a golden flash and a sparkle ring;
  a Perfect landing gets a green one.
- Coins make the coin counter boing; overheating puffs a cloud of steam and the heat meter boings (cooling arrows too).

**Mini RC Racers** (seen from above, so the cars squash along the way they point)
- Bumping a wall, another car or a critter squashes the car; ramps stretch it on take-off and squash it with a *thud*
  and dust on landing; boost pads and drift boosts stretch it long.
- Gift boxes sparkle and the item box boings; coins and Free Drive stars sparkle with a ring; the lap number, the Coin Rush
  count and the star count boing.
- Getting hit by a snowball or a balloon: a tiny pause and a soft flash. Heart Battle: losing a heart = a tiny pause,
  a pink flash and the hearts boing; a car that's out of hearts poofs into a cloud.

**Space Defender**
- Every bonk **squashes an enemy like jelly**; popped ones poof into a little cloud and the score boings, combos too.
- Power-ups sparkle and stretch the ship (Zoom the most); a new weapon or power level makes the weapon picture boing.
- Getting bumped: a tiny pause, a soft pink flash, the ship squashes and the lives boing; a shield pops in a blue poof.
- Bosses jiggle when hit; beating one = a tiny pause, a golden flash and a shake. Calming a part of the Chimera flashes starlight.

**Calm motion** (Parent corner) keeps it all gentle: small squashes, no flashes, no shaking. `tests/test_juice.py` now plays
these three too. **That finishes point 3.** Next up: point 4, better touch controls on phones and tablets (bigger buttons
with pictures, the same layout in every game, buttons that light up, and a "one thumb" mode for little kids).

## 2026-11-22 (Sunday, latest run) — Game feel, part 2: Jungle Jump, Treasure Trail, Potion Quest (new plan, point 3)
No new notes from Keith and no open issues, so this run did the next part of point 3, the "game feel" pass. These three
games now use the same springy helpers as Hoops, golf and Bubble School, so everything feels alike:

**Jungle Jump**
- The hero **stretches tall on a jump and squashes flat on a landing**, then wobbles back like jelly; a big fall goes *thud*.
  Dust puffs fly backwards when you jump or roll.
- Goodies burst into sparkles with a ring and the **goodie counter boings**; springs sparkle too.
- Smashing a boulder: a tiny pause and a little jiggle. Booping a critter: a puff cloud and a tiny pause.
- Bumping into a critter: a tiny pause, a soft pink flash and the hearts boing. Finding the treasure flashes gold.

**Treasure Trail**
- The explorer squashes on landings, stretches on jumps and when grabbing or letting go of a vine, with dust puffs.
- A bump (log, snake, bat): a tiny pause and a little jiggle. A treasure: sparkles, a golden flash and the crown counter boings.

**Potion Quest**
- Every bonk **squashes the baddie like jelly** with a tiny pause; a baddie that's out of bonks poofs into a cloud.
  Beating a boss: a golden flash and a big shake. A snail hiding in its shell goes *clang*.
- The hero leans into each swing; the Blob King's and the hoppers' landings squash them and puff dust.
- Potions, apples and coins sparkle in their own color, and the hearts, potions and score boing when they change.
- Getting bumped: a tiny pause and a soft flash.

**Calm motion** (Parent corner) keeps it all gentle: small squashes, no flashes, no shaking. The test `tests/test_juice.py`
now plays these three games too. Next part: Turbo Bike, Mini RC Racers and Space Defender.

## 2026-11-22 (Sunday, newest run) — Game feel, part 1: Hoop Heroes, Putt-Putt Park, Bubble School (new plan, point 3)
No new notes from Keith and no open issues, so this run started point 3, the "game feel" (juice) pass. First the arcade
kit got a set of shared helpers every game can use (so all games feel the same), then three games that had the
least of it got the treatment:

**Hoop Heroes**
- The ball **squeezes as you pull back**, stretches as it leaves your hands and squashes when it hits the backboard.
- Hitting the rim goes **clang!** with little sparks, the rim wobbles and the game pauses for a blink.
- Every bounce on the ramp is a little *plink* with a squash and a puff.
- A basket sparkles round the net and your **score number boings**; a **swish** gets a tiny pause and a golden flash;
  going ON FIRE flashes orange and the screen gives a little shake. The words ("+2 Swish!", "GO!") pop in big.

**Putt-Putt Park**
- The ball **stretches the way you hit it** with a puff of grass, squashes flat against walls, bumpers and crabs,
  kicks up sand in the bunkers and poofs out of pipes.
- Dropping in the cup: a tiny pause and a ring of sparkles; a **hole in one** gets a golden flash. The putt counter boings.

**Bubble School**
- A right answer **bursts the bubble into little bubbles** with a tiny pause; the score and the newest pearl boing.
- A wrong bubble **wobbles like jelly** (still no fuss: "Try again!").

New sounds: sparkle, poof, clang, thud, plink. **Calm motion** (Parent corner) keeps it gentle: much smaller squashes,
no flashes, no shaking. Next part: Jungle Jump, Treasure Trail and Potion Quest. New test `tests/test_juice.py`.

## 2026-11-22 (Sunday, latest run) — Mini RC Racers: living backgrounds (new plan, point 2, part 5: point 2 finished)
No new notes from Keith and no open issues, so this run did the last part of point 2 ("living backgrounds").
RC is seen from above, so instead of sliding hills the ground itself comes alive:

- **The ground has a texture** on every track instead of one flat color: grass tufts and clovers in the Backyard,
  fallen leaves in Autumn Woods, ferns in the Jungle, snow drifts with sparkles, wind ripples in the desert sand,
  cracks glowing with lava in Volcano Valley, sprinkles at Candy Raceway.
- **The sea moves** at Sunny Beach (waves and twinkles drift by), and at Cloud Castle little clouds float by far below.
- **Cloud shadows** drift slowly over the whole track on sunny days.
- **Little visitors** fly over the race: butterflies, seagulls (with their shadows), snowflakes, spinning autumn leaves,
  birds and puffs of sand in the desert, soap bubbles at Candy Raceway, fireflies and a shooting star on the moon,
  warm sparks at the volcano, see-through clouds at Cloud Castle.
- **Things move by themselves:** lava pools bubble and puff smoke, swim rings bob in the sea, balloons bob, big flowers nod.
- **Times of day:** Autumn Woods is now raced at **sunset**, Desert Dunes at **dawn** (pink), and Jungle Rally in the
  **evening** with fireflies blinking everywhere. The road stays bright and easy to see.

**Calm motion** (Parent corner): everything stands still and nothing floats. The ground texture is painted once into a
small tile that repeats, so it stays smooth on older tablets. **That finishes point 2.** Next up: point 3, the "game feel"
pass (squash and stretch, dust puffs, sparkle bursts and a satisfying sound for every action, in every arcade game).

New picture tool `tools/preview_rc_scenery.py` and a new test `tests/test_rc_scenery.py`.

## 2026-11-22 (Sunday, newest run) — Hoop Heroes + Putt-Putt Park: living backgrounds (new plan, point 2, part 4)
No new notes from Keith and no open issues, so this run did the next part of point 2 ("living backgrounds").

**Hoop Heroes**
- **Windows on the arcade's back wall:** two big windows high up, left and right of the scoreboard, look out on a
  little town. **The day goes by as you climb the ladder:** Ruby, Dash and Sid play in the daytime (clouds drift by),
  Sam and Bella at **sunset** (a pink and gold sky), Tia and Wes in the **evening** (purple sky, the first stars, more
  lights on in the houses) and the Champ and High Score at **night** (a moon, twinkling stars, a plane blinking by).
- **Spotlights** slowly sweep across the hall with little specks of dust twinkling in them.
- **The Champ's final** has golden spotlights and confetti fluttering down; **High Score** has colored disco lights.
- The floor got an arcade carpet with little colored squiggles.

**Putt-Putt Park**
- **Cloud shadows** drift slowly across the whole course, like a real sunny day.
- **The park:** two butterflies flutter about and now and then two birds fly over (you see their shadows); little
  grass tufts in the lawn.
- **The beach:** seagulls glide over the sand (with their shadows), the sea twinkles, wind ripples in the sand.
- **Times of day:** hole 8 of each course is at **sunset** and hole 9 in the **evening**, with fireflies blinking.
  Play all 9 holes in a row and the sun goes down as you finish! The middle of the course stays bright and easy to see.

**Calm motion** (Parent corner): everything stands still and nothing floats (the crabs, windmills and sliders still
move, because they're part of the game). The still parts are painted once, so it stays smooth on older tablets.

New picture tools `tools/preview_hoops_scenery.py` and `tools/preview_golf_scenery.py`; `tests/test_living_scenery.py`
now checks both games too.

## 2026-11-22 (Sunday, later run) — Archery: living backgrounds (new plan, point 2, part 3)
No new notes from Keith and no open issues, so this run did the next part of point 2 ("living backgrounds"): Archery.

- **Sunny Meadow:** snowy blue mountains far away, a little windmill whose sails slowly turn, trees that sway in
  the breeze, flowers that nod, two butterflies fluttering over the grass and a flock of birds flying by now and then.
- **Sandy Beach:** a tiny island with a striped lighthouse, a sailboat bobbing slowly across the sea, waves that roll
  and twinkle, seagulls, a palm tree swaying, and starfish in the sand.
- **Snowy Hills:** a cozy cabin with a warm window and chimney smoke that puffs up and leans with the wind.
- **Times of day:** Hilltop is now an **evening** level (lilac and peach sky, fireflies blinking), Prize Wheel is at
  **sunset** (a pink sky with golden twinkles on the sea) and Snowy Slide at **dawn** (pink, rosy snow).
- **Calm motion** (Parent corner): everything stands still and nothing floats. The wind lines still show (they tell
  you which way the wind blows) but don't move.
- The still parts of each place are now painted once instead of every frame, so it stays smooth on older tablets.

New picture tool `tools/preview_archery_scenery.py` (every level at once); `tests/test_living_scenery.py` now checks
Archery too (moves by itself, times of day, painted once, quick, still in Calm motion, plays on a phone).

## 2026-11-22 (Sunday, latest run) — Jungle Jump + Treasure Trail: living backgrounds (new plan, point 2, part 2)
No new notes from Keith and no open issues, so this run did the next part of point 2 ("living backgrounds").

**Jungle Jump**
- **A time of day on every world's 2nd level:** Treetop Trail is now an **evening** level (a peach and lilac sky, pink
  clouds, a warm glow over the hills and fireflies blinking among the trees), Windy Peak is at **dawn** (a pink sky and
  rosy snow), and Jelly Hills is at **twilight** (a purple sky with twinkling stars). The 1st levels look like before.
- **Things floating about:** leaves tumble down in the forest (autumn colors in the evening), glow dots drift up
  through the caves, soap bubbles float up in Candy Land, and it still snows on the snowy hills.
- Fixed a thin line you could sometimes see where two copies of a hill strip met.

**Treasure Trail**
- **River Run:** butterflies flutter by and leaves fall from the trees.
- **Deep Jungle:** falling leaves and soft mist drifting low over the jungle.
- **Lost Temple:** slanting sunbeams that gently brighten and dim, with golden dust twinkling in them.
- **Sunset Swamp gets later as you go:** the first room is a pink sunset, and room by room the sky turns purple,
  the hills get darker, the stars come out and more and more fireflies light up. By the camp it's a starry night.

**Calm motion** (Parent corner): the clouds stand still, nothing floats and the big corner leaves stop swaying.
Slow tablets ("lite" drawing) get fewer floaters. Everything still is painted once, so it stays smooth.

New test `tests/test_living_scenery.py`, and two picture tools to look at every level at once:
`tools/preview_jungle_scenery.py` and `tools/preview_trail_scenery.py`.

## 2026-11-22 (Sunday, newest run) — Turbo Bike: living backgrounds (new plan, point 2, part 1)
No new notes from Keith and no open issues, so this run started point 2 of the new plan ("living backgrounds") with Turbo Bike.
- **Deeper scenery on all 10 tracks.** Behind the grandstands there are now three layers that slide at different
  speeds as you ride (far ones slowly, near ones faster), so the world feels deep:
  snowy mountains in the meadow, flat-topped mesas and cacti in the desert, a pine forest, pointy snow peaks,
  two smoking volcanoes with lava streaks, a cozy village with lit windows at night, islands with a lighthouse and a
  sailboat at the beach, frosted candy mountains and gumdrops, misty jungle mountains with ferns, and a castle on a
  cloud at Cloud Castle.
- **Things move by themselves**: clouds drift across the sky, birds flap by, gulls at the beach, falling leaves in the
  forest and jungle, snowflakes on Snowy Peaks, glowing embers and smoke at the volcano, fireflies at night, floating
  bubbles at Candy Bounce, and the beach waves roll.
- **Time of day**: Forest Flyer is now an evening race (orange sky, orange leaves) and Snowy Peaks a pink dawn race.
- **Calm motion** (Parent corner): the clouds stand still, nothing floats or twinkles, and the crowd sits still.
- **Still smooth on older tablets**: each layer is painted once into a hidden picture when the race starts, so a frame
  only copies three pictures (well under 1 ms).
- How the game plays didn't change at all.
- For the dev runs: `tools/preview_bike_scenery.py` (every place on one picture) and a new test,
  `tests/test_bike_scenery.py` (layers painted, they join up without a seam, they slide, Calm stands still, speed, real races).
- **Next**: point 2, part 2: Jungle Jump and Treasure Trail get drifting clouds / leaves and a time of day.

## 2026-11-22 (Sunday, run before) — Archery: new targets, balloons, star and prize wheel (new plan, point 1 finished)
No new notes from Keith and no open issues, so this run did the last part of point 1 ("sharper characters"): Archery.
- **Targets** now stand on a wooden easel with little feet, have a thick straw back (with stitches) peeking out on the
  side, softly shaded rings with a curved shine, and a little twinkle on the bullseye. The sliding target rides a
  candy-striped pole, and the snowy cart got wheels whose spokes turn as it rolls plus a waving yellow flag.
- **Balloons** are real balloon shapes now (round on top, narrowing to a knot), shiny, with a curly ribbon and a gentle
  sway. Each has a picture on it: a heart, polka dots, a star or stripes. Popping one makes a quick "POP!" burst.
- **The golden star** is chubby with a gold shine, blinks now and then, has rosy cheeks, and two twinkles circle it.
- **The prize wheel** has a red rim with little light bulbs that run round (they hold still in Calm motion) and a gold
  star in the middle. The level pictures in the menu got the new balloon and star too.
- Nothing about how the game plays changed: hit sizes and points are the same.
- New for the dev runs: `tools/preview_archery.py` (every target, balloon, star and wheel on one page) and a new test,
  `tests/test_archery.py`, that pops balloons and hits every kind of target.
- **Point 1 of the new plan is finished.** Next: point 2, "living backgrounds" (scenery that slides at different speeds).

## 2026-11-22 (Sunday, earlier) — Treasure Trail: a cuter explorer and jungle animals (new plan, point 1, part 3)
No new notes from Keith and no open issues, so this run went on with point 1 of the new plan ("sharper characters").
- **The explorer is redrawn**: a big round head on a small body (much easier to see on a phone), two big shiny eyes
  with eyebrows, brown hair peeking out under the hat, freckles, an open happy smile, a red neckerchief with white
  dots that flutters when running, and a rolled-up orange blanket on top of the backpack. Every hat (safari, pirate,
  cowboy, flower crown, golden crown) was made to fit the bigger head, and the parrot still rides on top. The explorer
  is the same size for the game, so jumps and landings work exactly as before.
- **Hippos** now have a round head that really goes on under the water (no more flat bottom), a big soft snout with
  nostrils and a smile, bigger eyes and rosy cheeks. They still blink, wiggle their ears, puff and yawn.
- **Snakes** are three striped coils with a yellow tummy and a big round face with two eyes and a smile.
- **Bats** got pink-lined ears, a fluffy tuft and a happy little mouth; **the parrot** got a crest and a rosy cheek.
- New helper for the dev runs: `tools/preview_trail.py` draws every pose, hat and animal on one page.
- Next: the last part of point 1, Archery's targets and balloons.

## 2026-11-22 (Sunday, latest run) — Space Defender: sharper ships and space critters (new plan, point 1, part 2)
No new notes from Keith and no open issues, so this run went on with point 1 of the new plan ("sharper characters").
- **All 6 ships are redrawn**: soft shading with a shine, a metal nozzle, a flame with a white-hot middle that
  flickers, and the pilot now has hair and rosy cheeks behind a shiny glass window. The rockets have a colored band
  and nose cone, the jets have wing stripes, a tail fin and blinking red/green wing-tip lights, and the saucers have an
  antenna light and lights that chase each other round the rim. The ship pictures in the menus match.
- **All 9 small space critters are redrawn** (same size, so nothing about dodging or hitting changed): every one is
  shaded with a shine, blinks now and then, and has blush cheeks. The round robot has a glass visor and spinning
  propeller ears, the cube robot waves mitten hands, the space rock has craters, the jelly has curly legs, the bee-bot
  has little antennas, the planet critter has stripes and its ring really goes round behind it, and the gift saucer's
  pilot waves from a shiny dome. Mini bosses are just big critters in hats, so they look sharper too.
- New helper for the dev runs: `tools/preview_space.py` draws every ship and critter on one page.
- Next: point 1 goes on with Treasure Trail's explorer and animals, then Archery.

## 2026-11-22 (Sunday, last run) — Jungle Jump: sharper heroes and critters (new plan, point 1, part 1)
First run on Keith's new 10-point plan. Point 1 is "sharper characters in the older games", and it starts with Jungle Jump.
- **All 5 heroes are redrawn**: a big round head on a small body (much easier to see on a phone), one clean outline,
  soft shading, and each animal's own details. Momo the monkey has a heart-shaped face, round pink ears and a curly
  tail. Pip the frog has his eyes up on bumps, a wide froggy smile and spots. Bun the bunny has two little front teeth
  and a puffy tail. Rusty the fox has dark-tipped ears, white cheeks and a big bushy tail with a white tip. Bao the panda
  has black ears, arms and legs and the panda eye patches. They still run, jump, flap, glide, blink and get dizzy.
- **Every world has its own critter now** (before, they were all the same one-eyed blob): a **ladybug** in the forest,
  a **glowing firefly** in the cave, a fluffy **snow puff in earmuffs** on the mountain, and a wobbly **gumdrop** in
  Jelly Hills. Each has two big friendly eyes and squeezes them shut when you bounce on it (then poofs into sparkles).
- The hero pictures in Unlocks got a bit taller so Bun's ears fit.
- New helper for the dev runs: `tools/preview_jungle.py` draws every hero in every pose and every critter on one page.
- Nothing about how the game plays changed; the robot still finishes every level.
- Next: point 1 goes on with Space Defender's ships and enemies, then Treasure Trail and Archery.

## 2026-11-22 (Sunday, night run) — Potion Quest: Frosty Peak + the Frosty King
No new notes from Keith and no open issues. Today had many maze, coloring and Parent corner runs, so this run picked
Potion Quest's ideas list ("more stages (snow, cave, sky), a second boss"): a 4th place up in the snow.
(Keith's new 10-point plan landed in the roadmap while this run was already building; the next run starts on point 1.)
- **Frosty Peak** opens after the Castle Bridge. Snowy mountains, fir trees with snow on their branches, an icy path and
  soft snowflakes drifting down (they hold still when the Parent corner's Motion is set to Calm). 6 waves.
- **New baddie: the snowman.** A little snowman with a bobble hat and scarf keeps its distance, lines up with your row,
  lifts a snowball over its head ("!") and rolls it at you. Before it rolls, a **blue dashed arrow on the ground** shows
  where it will go, so kids can step up or down out of the way. A bonk (or the Wizard's spark) breaks a snowball (+5),
  and a magic spell clears them all. Little kids get slower snowballs, a longer warning, and bonk snowballs by themselves.
- **The second boss: the Frosty King**, a big three-ball snowman with an ice crown. He waddles in, rolls a few snowballs
  (each lane shows first), then puffs out ("Puff puff") = bonk time. Walk right up to him and he slides away across the
  ice ("Wheee!"). Each third of his strength, one of his snowballs goes **POP** and he gets shorter, so you can see you're
  winning: 3 balls, then 2, then just his head. He calls little helpers twice.
- New trophy: **Snow way!** (poof the Frosty King). Winning says "Snow much fun!"
- Tests: `test_quest` now checks 4 places, the snowball lane + rolling, the bot clearing a snowy wave, the King getting
  shorter, and the bot beating Frosty Peak with the Knight.

## 2026-11-22 (Sunday, evening run) — Parent corner: a bedtime for each kid
No new notes from Keith and no open issues. Today had lots of maze and coloring runs, so this run picked "a bedtime (no play
after 7 pm)" from the Parent corner's ideas list.
- **Bedtime.** In the Parent corner, each kid's tab has a new **Bedtime** row: Off, 6:30, 7, 7:30, 8, 8:30 or 9 pm.
  From that time until 6 in the morning, a sleepy star tucked under a blanket says **"Time for bed! Good night! See you in the
  morning."** on every page (the hub and every game; a game pauses behind it). It works after midnight too.
- **A bit longer tonight:** a grown-up can hold the button on that screen for 3 seconds for 15 more minutes (counted from
  now), or tap "15 more minutes tonight" in the Parent corner beforehand. The extra time is only for that night.
- Each kid has their own bedtime; a kid without one isn't affected. Bedtime and the daily time limit work together
  (bedtime wins when both are up). Like everything in the Parent corner it's kept only on this device.
- Tests: `test_parent` now checks bedtime before/at/after it, at 2 am and 6 am, in a race (paused), the hold button, the
  other kid, the next evening, the Parent corner buttons, and that the screen fits on phones upright and sideways.

## 2026-11-22 (Sunday, latest run) — Maze Explorer: the Maze Maker (make your own mazes!)
No new notes from Keith and no open issues. The coloring book got 3 runs of new pages today, so this run picked a feature:
"a maze-maker" from the maze ideas list.
- **Make your own maze.** On the maze map there's a new pencil button. It opens **My mazes**: 3 big tiles (each player has
  their own 3). Tap a plus to start a new one.
- **Digging is just drawing:** the board is a grid of little dots. Drag your finger from dot to dot and a path appears
  behind it (with a soft digging sound). Cutting across a corner digs round it. The eraser rubs paths out again.
- **Put things where you like:** tap the friend button and then a dot to move your friend there; the treat button does the
  same for its treat; the gem button hides gems (up to 6, tap one again to take it away). After placing the friend or treat
  it goes back to digging by itself.
- **More buttons** (all pictures): back, undo (it remembers 40 steps), the dice (a whole surprise maze you can then change),
  the paint pot (4 color sets: garden, sea, space, candy) and the bin (start again; undo brings it back).
- **The green play button** lights up and pulses as soon as the friend can reach its treat. Tapping it too early wiggles it and
  makes your friend and the treat bounce, to show what still needs joining up.
- Playing your own maze works like any maze (trail, gems, the light bulb, a happy ending with stars). It's just for fun: it
  doesn't change the real mazes' stars, medals or new friends. A pencil button (top right) goes back to change it, and so does
  the arrow after you win. Mazes are saved, and the tiles show a little picture of each.
- Little kids get a 5 x 5 board (bigger dots), Challenge players 7 x 7, everyone else 6 x 6.
- Tests: a new `test_maze_maker` digs with a real finger drag, rubs out, undoes, places everything, plays and wins, checks it's
  saved and doesn't count for the real mazes, the dice and colors, and that everything fits on a computer, phones (upright and
  sideways) and a tablet. The old maze test still passes.

## 2026-11-22 (Sunday, very last run) — 4 new "things" to color: ambulance, cement mixer, motorcycle, treehouse
No new notes from Keith and no open issues. Animals has 42 pages and Fruit 34, but Things had been stuck at 30, so this run
drew 4 new pages for the Things tab (it now has 34).
- **Ambulance**: a big box van with a siren light on the roof and a round badge with a cross on its side.
- **Cement mixer**: a tilted mixing drum with two stripes, a cab with a window and three wheels.
- **Motorcycle**: big chunky wheels, a round tank, a seat, handlebars and a headlight, with a little cloud in the sky.
- **Treehouse**: a little house with a pointy roof, a door, a window and a porch, up in a big round tree on a hill.
- No faces on these (vehicles and houses don't get them). Checked blank and filled with colors and on a phone;
  the coloring test passes (shape count, sizes, nothing off the edge, tapping).

## 2026-11-22 (Sunday, final run) — 4 new fruit & veggie pages: plum, beet, lettuce, garlic
No new notes from Keith and no open issues. The Animals tab has grown to 42 today while Fruit & veggies sat at 30, so this run
drew 4 new pages for the fruit tab (it now has 34).
- **Plum**: a round plum with a little stem and a leaf, and the plum's line down one side.
- **Beet**: a round beet with three big leaves on top and a little root tail at the bottom.
- **Lettuce**: a lettuce head peeking out over two big front leaves, like it's giving itself a hug.
- **Garlic**: a garlic bulb made of three fat cloves, a pointy top and little roots.
- Each has a happy face (eyes with shine dots, cheeks to color, a smile). Checked blank and filled with colors and on a phone;
  the coloring test passes (shape count, sizes, nothing off the edge, tapping).

## 2026-11-22 (Sunday, last run) — Maze Explorer: the cheeky treat
No new notes from Keith and no open issues, so this run picked "a moving treat" from the maze ideas list.
- **Some treats want to play tag.** From the 5th maze, every 3rd maze has a cheeky treat: it wiggles side to side
  ("catch me!"), and when your friend gets 2 steps away it giggles ("tee-hee!"), leaves a little white puff and hops a few
  steps away along the paths, usually into a dead end. Then you go and get it.
- **Gentle on purpose:** it only hops 1 time for little kids and on Easy, 2 times on Normal, 3 on Challenge. After its last hop it
  stops wiggling and just waits. It never hops onto a bridge or the start, never onto the key, and never behind the locked
  door, so it can always be caught. In a dark cave the spot where it lands lights up so you can see where it went.
- The light bulb and the "stuck?" sparkle always point to where the treat is now.
- Tests: `test_maze` checks which mazes have a cheeky treat, how many hops for each difficulty and for little kids, that every
  hop lands at least 3 steps away and not on a bridge or the start, and that it's caught in the end (also in a dark cave with a door).

## 2026-11-22 (Sunday, latest) — 4 new animals to color: panda, koala, flamingo, deer
No new notes from Keith and no open issues, so this run drew 4 more animals from the coloring book's idea list
(the Animals tab now has 42 pages).
- **Panda**: sitting up and facing you, with its eye patches, ears, arms and feet as their own parts so they can be colored black (or any color).
- **Koala**: big round fluffy ears and a big shiny dark nose.
- **Flamingo**: standing in the water on two long legs, with a long neck, a bent beak with a dark tip, a wing and tail feathers.
- **Deer**: a young deer with little antlers, big ears and a round nose.
- Checked blank and filled with colors, on a computer and a phone; the coloring test passes (every page: shape count, sizes, edges, tapping).

## 2026-11-22 (Sunday, late night) — Fishing Frenzy: night fishing at Moonlight Bay
No new notes from Keith and no open issues, so this run picked an idea from the fishing list: "a night-fishing place".
- **Moonlight Bay**, a 4th place to fish. It opens once you've found 14 kinds of fish (so it's a reward for exploring the
  other three). It's night: a big sleepy moon with rosy cheeks, twinkling stars, fireflies blinking over the water, a little
  cottage with a warm window, and the moon's shiny path on the water. You fish from a wooden jetty with a glowing lantern
  and a sleepy cat curled up on a cushion (little "z"s float up). The angler wears purple pajamas and a stripy nightcap.
- **6 new night fish that glow** so they're easy to see in the dark water: Glow Minnow, Lantern Buddy (carries its own
  little lamp), Starry Fin, Neon Ribbon, Moon Puffer (rare) and the legendary **Comet Koi** with a crown. The bobber has a
  glowing tip at night, and the fishing line is light so it shows against the dark sky.
- **8 new goals** for the bay (32 in all), a Moonlight Bay Frenzy round, and 2 new trophies: Night owl (catch a fish by
  moonlight) and a secret one for the Comet Koi. The Fish Book now has 25 fish; Friends rooms can pick the bay too.
- Tests: `test_fishing` checks the bay is locked at first, opens after 14 kinds, only night fish swim there, it has its own
  goals, the robot catches a fish there (Night owl), and the Comet Koi gives its trophy. Checked on a computer and a phone.

## 2026-11-22 (Sunday, night, Keith live) — No more category tabs on the hub
Keith: "categories can go away". The row of picture tabs on top of the hub (All, Faves, Race, Action, Sports, Calm) is
gone: the hub is now just the logo and every game in one list, with the games you've hearted at the front.
Hearting still works the same (Who's playing? -> the heart -> tap games). Tests updated (`test_hub`).

## 2026-11-22 (Sunday, night) — 4 new animals to color: zebra, dolphin, parrot, raccoon
No new notes from Keith and no open issues, so this run drew 4 more animals from the coloring book's idea list
(the Animals tab now has 38 pages).
- **Zebra**: a front-facing zebra with a tufty mane, stripes on its forehead, cheeks, body and legs, and a big round nose.
- **Dolphin**: leaping out of the sea, with a fin on top, a little flipper and a two-part tail, smiling.
- **Parrot**: sitting on a branch, with 3 crest feathers, big wings, a hooked beak and 3 long tail feathers under the branch.
- **Raccoon**: sitting up, with its mask around the eyes (colorable, so it can be gray or any color) and a ringed tail
  made of 5 parts, so every ring can be a different color.
- Same style as the others: thick outlines, big shapes, cute faces with cheeks to color, a sky and a ground (the dolphin
  has the sea instead), no suns, nothing extra.
- Tests: `test_coloring` (every page: shapes, sizes, edges, tap-to-fill) and the hub + offline tests pass; the new pages
  were checked blank and colored-in, and on a phone and a computer.

## 2026-11-22 (Sunday, very late) — Putt-Putt Park: a second course at the beach
No new notes from Keith and no open issues, so this run picked an idea from the mini golf list: "a second course (beach)".
- **Seaside Cove**: 9 new holes by the sea. The hole picker now has two picture tabs at the top: the park flag and a
  palm tree. The beach opens once you've finished hole 3 in the park (so it's something to look forward to, not far away).
- **New things on the beach**: a friendly red **crab** that scuttles up and down (or side to side) and bounces the ball
  away; a wooden **boardwalk** across a pond (stay on it and you roll right over the water; fall off = splash, back to
  where you putted, like always); **sandcastles** to bank shots around; **beach balls** instead of bumpers; little tide
  pools with fish swimming in them; a "big wave" hill; a shipwreck pipe; and a lighthouse windmill with 3 arms on the last hole.
- **The look**: sand all round, the sea washing in and out along the top, palm trees, beach umbrellas, shells and starfish,
  a sea-green turf and a yellow flag.
- **All 9 beach holes in a row** has its own tile, and there are 4 new trophies (Beach champ, Day at the beach,
  Over the boardwalk, and a secret one for bouncing off a crab), so more house coins too.
- Still gentle: no losing, the same bigger pulling cup for little kids, and the cup helps after 8 putts.
- Tests: `test_golf` now also checks the Beach tab (locked, then open), plays all 9 beach holes with the robot, bounces
  off a crab, rolls over the boardwalk and splashes beside it, and plays the whole beach course. The other tests pass.
## 2026-11-22 (Sunday, late night) — Calm motion, and a check that every word is easy to read
No new notes from Keith and no open issues, so this run picked the **Accessibility pass** from the Polish list
(contrast + reduced motion), the last open item there.
- **Calm motion** (new): in the Parent corner, This device, there's a new **Motion: Normal / Calm** choice. Calm is for
  kids who find a lot of movement too much: menus just appear instead of bouncing in, nothing hops, pulses or floats
  (the present on the hub, the big Play button, the logos), no confetti, and **no screen shake** in Space Defender,
  Potion Quest and Turbo Bike. Buttons still squish a little when pressed, so a finger can see it counted. The games
  themselves still move, of course. If the tablet or phone already has its own "reduce motion" setting turned on, the
  arcade is calm by itself. It's saved on the device (like Drawing quality), so it's the same for every player.
- **Easy-to-read words**: a new test looks at every word on the menus (hub, Parent corner, a game's title and level
  picker, RC's main menu, Sticker Book, My House, Jukebox) on a computer and a phone, and checks each one against the
  color right behind it. Good news: all of them were already easy to read (dark words on light buttons, white words
  with a thick dark outline).
- Small fix found while looking: a short word on a wide button ("Calm", "Normal") sat at the left side of the button;
  now picture + word sit in the middle of every big button.
- New test: `tests/test_calm.py`. All the other tests pass too.

## 2026-11-22 (Sunday, evening) — A cleaner hub, and scrolling on the very first screen
Keith (live, with a phone screenshot): "Initial screen still doesn't scroll, if you go into a game and exit it does. This
menu has way too much on it. Need to eliminate the last game stuff, and just improve the layout and make it cleaner."
- **No more "play again" row** (the clock and the last 3 games).
- **3 simple parts, like an app**: the picture tabs in one row at the top (no words under them), the games in the
  middle (with a small logo above them), and a bar of 5 big round buttons at the bottom that always stays put:
  who's playing, the Daily Surprise, the Sticker Book, My House and the Jukebox. Before, the bar was 8 buttons in two
  rows that scrolled away with the games.
- **Music on/off, Little/Big kid and the hearts** moved into "Who's playing?" (tap your animal in the bar), under the
  players, because they're about the player. Hearts: tap the heart there, then tap games on the hub to heart them, and
  the yellow heart at the top when you're done.
- **Tall phones**: the menus now use the whole height of the screen held upright, instead of leaving an empty band
  above and below (in every game's menus, not just the hub).
- **Scrolling**: a finger drag now uses the phone's own touch events and works out where the menu is on the screen at
  that moment. Before, it went through Phaser, which measures where the menu is once and keeps that, and on a phone's
  first load the page can still be moving a little. Phaser also measures again at every touch now, so taps land right.
  I couldn't make it fail on the test computer, so Keith: say if the first screen still doesn't scroll.
- Tests: `test_hub` (no play-again row, 5-button bar that stays put, one row of tabs, music / age / hearts in Who's
  playing?), `test_age`, `test_players`, `test_scroll` updated; `test_phones` (every page), `test_rc_menus`,
  `test_canvas_menus`, `test_daily`, `test_stickers`, `test_jukebox`, `test_offline` and the rest pass.
## 2026-11-22 (Sunday, night) — 4 new animals to color
No new notes from Keith and no open issues, so this run drew new coloring pages (the daily task allows "3-5 new
coloring-page animals", and horse and dinosaur were still on the ideas list).
- **Horse**: facing you, with pointy ears, a two-tuft hair flick on top, a big round nose with a smile, and hooves.
- **Dinosaur**: a friendly long-neck dino from the side, with 3 back plates, a belly patch and a happy smile.
- **Seal**: sitting up on the ice with flippers, a round belly, whisker cheeks and a little black nose.
- **Squirrel**: a big curly tail behind it, little paws, pointy ears and a round belly.
- All four follow your style rules: one big subject, thick outlines, a sky to color, a ground strip, blush cheeks, no sun.
  Each has 13-15 parts to color, none too small for little fingers. The Animals tab now has 34 pictures.
- Tests: `test_coloring` (every page: shapes, edges, tap-to-fill, tools), `test_house` (the picture wall draws them),
  `test_stickers`, `test_hub`, `test_offline` and `test_phones` (coloring) pass.

## 2026-11-22 (Sunday, later) — Music for the coloring book and the maze
No new notes from Keith and no open issues, so this run picked the open Music idea "music for the coloring book and maze
(off by default)".
- **A music button** (two little notes) on both pages. It starts OFF: gray notes with a red line. Tap it and the notes turn
  yellow and pink and a song starts; tap again and it gently fades away.
- **Coloring book**: a soft, slow music-box lullaby with a flute. It's in the same key as the "bloop" a part makes when you
  fill it, so coloring sounds like playing along. The button is in the top bar while coloring, and at the bottom of the
  picture picker (next to home). The song keeps playing when you go from the picker to a picture and back.
- **Maze Explorer**: a tiptoe exploring tune on a ukulele with a whistle. In the dark lantern caves it sounds far away and a
  bit slower; out of the cave it's bright again. The button sits next to the light bulb and the map.
- **Each player keeps their own choice**, and it's remembered for next time (browsers only allow sound after the first tap,
  so a saved "on" starts with the first touch). It plays even if that player switched the arcade music off on the hub
  (they asked for it here); "all sound off" in the Parent corner still keeps it quiet. Another tab or the home screen pauses it.
- **Both new songs are in the Jukebox** too (now 45 songs), under the coloring and maze pictures.
- On the smallest phones the maze's top buttons got a bit smaller so all 5 fit in one row.
- Tests: new `test_page_music` (off at first, plays on tap, saved per player, stops, plays with the hub music off, muted
  still wins, the cave muffle, the picker's button, the button on 4 screen sizes). `test_tunes`, `test_music`,
  `test_coloring`, `test_maze`, `test_jukebox`, `test_hub`, `test_offline` and `test_phones` (coloring, maze, jukebox) pass.

## 2026-11-22 (Sunday) — Maze Explorer: bridges and tunnels
Keith's lists were all done and there were no new notes or issues, so this run picked the open Maze idea "bridges / tunnels".
- **Little wooden bridges** now show up in the mazes, from the 4th maze on: 1 bridge on Easy (and always for little kids),
  1-2 on Normal, 2 on Challenge. Each has planks, railings and round posts.
- **One path goes over the bridge, another goes under it** through a little tunnel (you see the dark tunnel openings on
  both sides). Drag your friend straight across to go over, or straight through the other way to go under.
- **In the tunnel your friend peeks out**: smaller and a bit see-through, and the colored trail hides under the bridge.
  On the bridge the trail is drawn on top. Back out the other side, everything looks normal again.
- Every bridge is always used by the maze (both ways lead somewhere), and nothing ever sits on a bridge or in a tunnel:
  no start, treat, key, gem or locked door. The light bulb hint and the "stuck?" sparkle go over or under bridges too.
- In the dark caves the bridges stay hidden until the lantern finds them. The first 3 mazes stay simple (no bridges).
- Tests: `test_maze` checks 90 new mazes (right number of bridges, over one way and under the other, every spot reachable,
  nothing on a bridge), drags a real finger through a tunnel and over a bridge, and finishes a maze with a bridge.
  It also waits properly for the "next" arrow now (it could miss it on a busy computer). `test_phones` (maze), `test_hub`,
  `test_offline`, `test_daily`, `test_stickers` and `test_jukebox` pass.

## 2026-11-21 (Saturday, late night) — The Jukebox: every arcade song, a dancing friend and drum pads
Keith's lists were all done, so this run picked the open Music idea "a Jukebox / music maker on the hub".
- **A jukebox button** (a pink jukebox) is now in the hub's bar, next to My House. It opens the Jukebox.
- **Every song in the arcade, 43 of them**, as big picture tiles: the game's picture with the song's number (RC has 11,
  Space Defender 7, Jungle Jump 5...). Tap one and it plays; the dice plays a surprise song, the red square stops.
- **Your animal dances** on a little stage with speakers that thump, sweeping lights, music notes and bars that jump
  with the sound. It sleeps (z z z) when nothing plays. Tap it and it spins.
- **Mix buttons** change the song while it plays: turtle = slow, rabbit = fast, the note with the arrow = higher,
  the disco ball = party (extra drums and sparkles), bubbles = under water.
- **Drum pads** to play along: a drum, a clap, a bell (always a note that fits the song) and a ta-da. A tap a little
  early waits for the beat, so it always sounds right. Space bar = the drum on a computer.
- The Jukebox plays even when that player switched the background music off (they came to hear songs); "all sound
  off" in the Parent corner still makes it quiet, and the time limit still counts (it shows as "Jukebox").
- The songs are copied out of the games by a little tool (`tools/make_jukebox.py`) every time a new version is made,
  so new songs show up in the Jukebox by themselves.
- Tests: new `test_jukebox` (every song tile plays, the mix buttons, pads on the beat, phones upright and sideways,
  the hub button); `test_phones` checks the Jukebox page too; `test_hub`, `test_offline`, `test_parent` pass.

## 2026-11-21 (Saturday night, latest) — Hoop Heroes: room to shoot on a PC, fair rivals; new versions show right away
Keith (live): "the ball probably needs to be pushed up on the screen a little bit, makes it hard on a PC to play with such
little space. Computer is scoring way too fast and making all the shots" (Wes had 90 with 13 seconds left).
- **The ball sits higher**: the waiting ball used to touch the bottom edge, so there was no room to pull back. Now it's
  about a ball higher, with room under it. A basket is a pull of about 80 dots (it was about 60, so a tiny wobble of the
  mouse could miss), and the far 3-point hoop about 135. With Space, the power bar's green part now matches the right power.
- **Rivals are fair**: they used to shoot about once a second and make most shots (100+ points in a round). Now they
  shoot about once every 1.5-2 seconds and less than half go in: Ruby gets about 12 points, The Champ about 55. The star
  targets came down to match (2 stars always needs more than just beating the rival).
- **"I still see the old Daily Surprise row"**: that was an old copy saved on the device. The hub now reloads itself once
  when a new version arrives, so changes show straight away. (Keith: close and reopen the arcade once, or pull down to
  refresh, to get this version; after that it updates by itself.)
- Tests: `test_hoops` also pulls back with the mouse for real (it scores), checks the ball has room under it, and checks every
  rival's points; `test_age`, `test_offline`, `test_canvas_menus`, `test_controls`, `test_tapguard` pass.

## 2026-11-21 (Saturday, last run) — Maze Explorer: penguin, frog and owl friends
Keith's lists were all done, so this run picked the open Maze idea "more friends (penguin, frog, owl)".
- **Three new maze friends**, each with its own treat at the end of the maze: a **penguin** who waddles to a
  three-scoop **ice cream**, a **frog** who hops to a **lily pad with a pink flower**, and an **owl** who flies to the
  **moon**. They join like the others: the penguin after 15 mazes, the frog after 18, the owl after 21. Until then
  they're dark shapes on the map (a surprise), and when one joins it pops up next to your stars. 10 friends in all now.
- **Every friend has its own voice:** a little tune of notes when you pick them on the map and when they reach their
  treat (after the "ta-da"). The bee buzzes low, the mouse squeaks high, the puppy goes "woof", the frog "rib-bit",
  the owl "hoo-hoo"...
- Tests: `test_maze` checks the new friends join at the right time, every friend has a picture, a treat and a call,
  and the owl can finish a maze; `test_hub`, `test_stickers`, `test_daily`, `test_canvas_menus` and the maze phone checks pass.

## 2026-11-21 (Saturday, latest) — Coloring book: magic crayons + happy sounds
Keith's backlog was all done, so this run picked the open items on the coloring book's list.
- **Magic crayons:** a new magic-wand button next to the crayons opens a third crayon box with 12 magic crayons:
  rainbow, sunset, ocean, pink dots, blue dots, stripes, candy stripes, checks, zigzag, stars, hearts and glitter.
  Tap one, tap a part of the picture, and it fills with the pattern (a rainbow sky, a polka-dot cat...). Undo, redo,
  saving and "Done!" all work the same. The patterns show in the picture picker, in My pictures and on My House's
  picture wall. The brush and stickers use the magic crayon's main color. The swap button goes back to the plain crayons.
- **Coloring sounds:** every fill now makes a soft bubbly "bloop" (a different happy note each time, so coloring sounds
  a little like a tune); magic crayons make a twinkle. The cheer + confetti when a picture is finished were already in.
- **Fixed:** the "New sticker!" message on the coloring and maze pages showed up as a giant picture that shoved the
  coloring page off the screen (those pages don't load the games' styles). It's now the small message at the top, like in the games.
- The crayons are a little smaller on computers so 12 crayons + swap + magic wand + "+" still fit in one row.
- Tests: `test_coloring` checks the magic box, a dotted part, a rainbow sky, brush color, undo, saving, the SVG drawing
  (thumbnails / My House) and that the picture keeps its size; `test_house`, `test_stickers`, `test_maze`, `test_hub`,
  `test_offline`, `test_home`, `test_canvas_menus` and the coloring + maze phone checks pass.

## 2026-11-21 (Saturday, very late) — Turbo Bike: the Daily Ghost Race
The last item of Keith's Turbo Bike plan (#9, "daily ghost challenge"), so **the whole Turbo Bike plan is done**.
- **Meet Wisp:** a friendly see-through ghost rider with a happy face and a trail of twinkles. A new **Ghost** button on
  Turbo Bike's title menu (and a Ghost Race tile under the cups) starts today's race: just you and Wisp, no Zip, Moxie or Bolt.
- **A new track every day**, picked from the date (it's the same all day, never the same two days in a row, and all 10 come round).
  Little kids only get the 7 gentler tracks (no volcano, loops or cloud castle).
- **How fast is Wisp?** Big kids: he finishes a bit slower than the track's "great time", so riding well (turbo, blue arrows,
  not too many tumbles) beats him; a robot that only holds gas + turbo beat him on 8 of 10 tracks. Little kids get a sleepy
  Wisp they beat even if they just steer.
- **Beat him** = "You beat Wisp!", a picture of you 1st and Wisp 2nd with both times, and a strip of this week's 7 days with
  a little ghost on every day you beat him. The first win each day gives **1 house coin**. Lose = "Nice try!" and one tap to go again.
- **2 new trophies:** Ghost chaser (beat Wisp) and a secret one for beating him 7 days in a row.
- Tests: new `test_bike_ghost` (the track of the day for big and little kids, Wisp's speed, win / lose / coin only once a day,
  a new day = a new track, the 7-day trophy, a real ride beats him, phones); `test_bike`, `test_bike_cup`, `test_bike_shop`,
  `test_bike_build`, `test_canvas_menus`, `test_daily`, `test_stickers` pass.

## 2026-11-21 (Saturday, late) — Keith: swiping on phones + an old hub showing up
Two things Keith found on his phone.
- **"Can't swipe up on phone":** dragging a finger didn't scroll ANY of the new Phaser menus (the hub, level lists,
  shops...), only a mouse wheel did, so on a phone held upright most of the games were out of reach. The menus now
  follow your finger up and down (and glide on a bit if you flick). A swipe that starts on a game tile scrolls and
  does not open the game; a quick tap still opens it. Sideways swipes (sliders, the Sticker Book's pages) are left alone,
  and the drawing boards (RC's Track Builder, My House's room) still draw / drag instead of scrolling.
- **"Main load screen is different than when you exit from a game":** the offline copy on the phone opened the arcade
  with the OLD hub, and the new one only showed after going into a game and back. Now pages always come fresh from the
  internet when there is internet (the saved copy is only for offline or a very slow connection), and every script is
  saved together with its version number, so a new page never gets an old script. (Coming back from a game the hub also
  shows the "play again" row with the game you just played: that part is on purpose.)
- Tests: new `test_scroll` (real touch swipes on the hub held upright, a swipe from a tile doesn't open it, a tap still
  does, sideways doesn't scroll, the bike level list scrolls); `test_offline`, `test_hub`, `test_house`, `test_stickers`,
  `test_parent`, `test_rc_build`, `test_canvas_menus`, `test_maze`, `test_coloring` pass.

## 2026-11-21 (Saturday, night) — Turbo Bike: a better track builder, boost pads, and racing friends on your own track
Turbo Bike plan #8 (the next open list after Keith's RC plan).
- **Boost pads:** a new piece for your own tracks. An orange strip with glowing yellow arrows: ride over it and the bike
  shoots forward ("Zoom!", a whoosh, sparks), even without pressing gas. The computer riders zoom on them too. The
  how-to-play pictures show it ("Orange pads: Zoom!").
- **A bigger, easier builder:** your track (on a brown card) and all 15 pieces (on a blue card) are next to each other now.
  Tap a box of your track (it turns yellow), then tap a piece: it goes in that box and the next box is picked, so you can
  build a whole track with quick taps instead of tapping each box round and round. The **+** button adds a box (up to 12),
  **-** takes the picked one away (at least 4), and the **dice** makes a surprise track in a surprise place. Every change is
  saved straight away. Upright on a phone the two cards sit one above the other.
- **Race friends on your own track:** in a Friends room, the room maker's home-made track is a tile next to the 10 tracks.
  The whole track travels in the start message (it's only a few letters), so every phone rides exactly the same one.
- Tests: new `test_bike_build` (the builder's taps, + / - / dice, boost pads speeding the bike up, the track as a short
  text and back, phone sizes); `test_friends` races two phones on a home-made track; `test_bike_tracks` updated for the new builder.

## 2026-11-21 (Saturday, late night) — Mini RC Racers: drifting with sparks + a finish-line party
The last part of Keith's RC plan, #3 "feel and look". (Ramps on the tracks and rain / snow / wind were already there,
so this run did the two missing bits.)
- **Drifting:** hold a full turn while going fast and your car slides round the bend with its tail swinging out. Sparks
  fly from the back wheels: **blue**, then **orange**, then **pink** the longer you hold it (each color has a little "ting").
  Straighten up and you get a boost: "Zoom!", "Super zoom!" or "Mega zoom!". Quick taps and slow turns never drift, so
  steering feels the same as before until you hold a turn on purpose. Little kids can drift too (their car drives itself,
  they just hold a side). Works in races and in Heart Battle (the big open arena is great for it). Only your car drifts:
  the computer cars drive the same as before.
- **Finish-line party:** come in **1st** and fireworks pop all around your car, it spins happy donuts, the camera comes in
  close, every rival smiles at you and a big gold trophy with a "1" bounces in at the top. **2nd or 3rd:** a few fireworks
  and a silver or bronze trophy. 4th: no fuss, just the gentle "Nice try!".
- **Bigger, happier podium** on the results: bigger cars and steps, bunting along the top, confetti and sparkles round your
  car when you made the top 3, and the winner wears a little gold crown. The row of 3 stars under it is gone for races
  (the podium already says it; the stars still count in the track list).
- Tests: new `test_rc_feel` (drifts, spark colors, the boost, no drift from taps or slow turns, little kids, the party,
  the podium fitting on a desktop and a phone held sideways); all the RC tests, `test_friends`, `test_canvas_menus` and
  `test_phones rc` pass.

## 2026-11-21 (Saturday, last run) — the Parent corner on the new menus
The last page on Keith's "rewrite everything with Phaser 3 + Rex UI" list: the **Parent corner** is now drawn by Phaser +
Rex UI, scaled to fit the screen like everything else.
- **The door:** one big "Hold for 3 seconds" button. It fills up with green while you hold it; let go early and it empties
  again (little kids tap, they rarely hold). The hub's Grown-ups button leads here.
- **Picture tabs along the top** that stay put: one for each kid (their animal), a gear for **this device** and a **?** for help.
- **Each kid:** chips with minutes today, minutes this week, stickers and trophies; two charts (the last 7 days, and which
  games they played, most first); the **time limit** as big buttons (No limit, 15 min ... 2 hours; the picked one is yellow)
  with how much is left today and a "+15 more minutes today" button; their **music** on/off and volume.
- **This device:** all sound on/off, the sound-effects volume, drawing quality (Automatic / Always fast / Always sharp).
- **Help:** "private by design", **Report a problem** (opens your email app, as before) and clearing the play-time history
  (tap twice, so it can't happen by accident).
- The menu kit learned **hold buttons** (any button can now say "only when held for 3 seconds").
- With that, every menu in the arcade is a Phaser menu. Still plain web page on purpose: the games themselves, the coloring
  screen's crayons, the box where you type a player's name, and the "All done for today!" wall.
- Tests: `test_parent` taps and holds the new page for real (desktop + phone), `test_phones` (parent, hub, house) and the other
  menu tests pass.

## 2026-11-21 (Saturday night, later) — Daily Surprise moved off the top of the hub + Hoop Heroes' ball falls right
Keith (live): "I don't like this being there, we should figure out a different way to display challenges" (the big row of
3 Daily Surprise tiles under the logo) and "hoop heroes ball isn't falling the right way". Keith picked option 3.
- **Daily Surprise:** the big row is gone. Today's game now wears a little **bouncing present** on the corner of its tile,
  so kids see where to go. A **present button** in the hub's bar (with a pink "!" until it's done) opens the Daily
  Surprise screen: the present (tap = hear the challenge again; it's read aloud when the screen opens), today's game
  (tap = play it, with how many you've got so far) and the prize (the mystery sticker + 2 coins). Once it's done, the
  present on the game tile goes away and the button shows the opened present.
- **Hoop Heroes:** after a basket the ball used to stop in mid-air under the net and then jump down to the ramp, and a
  missed ball jumped straight onto the ramp from wherever it was (and a wild shot could fly through the side nets). Now
  the ball slides down through the net, drops out under it, bounces on the ramp (smaller bounces each time) and rolls
  back to you. Misses fall and bounce the same way, and the side nets and the back of the cage bounce the ball back
  in. The machines next to yours do it too.
- Tests: new `test_hoops` (follows the ball after a basket, a long shot, a short shot and a wild one: no jumps, stays in
  the cage, falls, bounces, rolls); `test_daily`, `test_hub`, `test_players`, `test_age`, `test_stickers`, `test_phones`
  (hub + hoops), `test_canvas_menus`, `test_offline` pass.

## 2026-11-21 (Saturday night) — My House on the new menus
Next step of Keith's "rewrite everything with Phaser 3 + Rex UI": **My House** is now one screen drawn by Phaser + Rex UI,
scaled to fit like the games' menus.
- A row of big picture tiles on top: home, the four rooms (the open one is yellow), Friends (with how many friends are in
  the room) and your coins (tap them: the "win trophies to get coins" picture).
- The room is in the middle and works like before: drag anything (even your animal), drop it on the toy box or off the edge
  to put it away, tap your animal to make it hop, a thing you're trying wiggles. New: tap the wall, floor or sky and its
  choices open in the shop.
- The room's spots sit next to the room (under it on a phone held upright), the shop underneath: things you have get a tick,
  the others show their price, the one you're trying turns yellow with a green "buy" tick (tap again to buy).
- Friends: make a room / join with the 3 pictures, then tap a friend to visit, all as big picture screens. Visiting shows
  your friend's face and a "back to my house" tile; no shop.
- Tests: `test_house` (now taps the canvas page and drags in the room for real, desktop, phones and tablet, plus visiting a
  friend through a local switchboard), `test_stickers`, `test_phones` (house + hub), `test_offline`, `test_canvas_menus` pass.
- Next on this list: the Parent corner. (Keith asked tonight for a new look for the Daily Surprise on the hub and a fix for
  Hoop Heroes' ball: those come right after this.)

## 2026-11-21 (late Saturday) — the arcade hub on the new menus
Next step of Keith's "rewrite everything with Phaser 3 + Rex UI": the **hub** (the first page, with all the games) is now
drawn by Phaser + Rex UI, scaled to fit the screen like the games' menus.
- The picture tabs (All, Faves, Race, Action, Sports, Calm) sit at the top and stay put; the open one is yellow.
- Under them (scrolling): the Kids Arcade logo, the **Daily Surprise** as three big tiles (the present = hear today's
  challenge, the game = go play it, the prize sticker + coins), the **play again** row, and every game as a big tile in its
  own color with its medals and stars.
- A bar of round buttons: who's playing, music on/off, little/big kid, **hearts**, the Sticker Book (with a number for new
  stickers) and My House (with the coins). Sideways it stays at the bottom; on a phone held upright it's near the top.
- **Hearts work a bit differently**: tap the big heart button, then tap the games you love (they turn yellow), then tap the
  heart button again. Hearted games come first and get the Faves tab, as before.
- **Who's playing?** is big picture tiles too (the pencil = change a player, the + = a new player). The box where you type a
  name is still a normal page box, because a drawn menu can't do typing.
- **Grown-ups** button: it now opens the Parent corner's door, which asks for the same 3-second hold.
- Fixed in the menu kit: taps on a box lying over a drawn menu (like the "All done for today!" screen) could press the
  button underneath it. Now they can't.
- Tests: `test_hub`, `test_players`, `test_age`, `test_daily`, `test_parent`, `test_stickers` and `test_offline` tap the new hub
  for real on desktop, phones and tablet; phones, every game's menus, RC, maze, coloring, jungle, music and home still pass.
  (The house test's "visit a friend" part needs the local switchboard, which can't start in this run's sandbox; the rest passes.)
- Next on this list: My House, then the Parent corner.

## 2026-11-21 (Saturday, late) — fix: RC's menu didn't react to taps on Keith's Android phone
Keith: "RC menu isn't working" (taps did nothing, Android).
- What went wrong: on Android the browser bar slides in and out when a finger touches the screen, and every slide counts as
  "the screen changed size". The menu then redrew itself right in the middle of the tap, so when the finger lifted, the
  button under it was a brand-new one that had never seen the finger go down, and the tap was lost.
- The fix (it helps every menu drawn with the new Phaser menus, not just RC): the menu no longer redraws while a finger is on
  the screen (it waits until the finger lifts), and it doesn't redraw at all when the size didn't really change. After a redraw,
  Phaser also measures the menu again, so a finger always lands on the button that's drawn there.
- Tests: `test_rc_menus` now pretends to be an Android phone (upright and sideways) whose browser bar moves during a tap: the tap
  still works, the menu fits the new size, and a finger tap on Back works after. RC's menus, Track Builder, Friends, every game's
  menus, Sticker Book, Maze, Coloring, the home button and the phone test still pass.

## 2026-11-21 (Saturday night) — the Sticker Book on the new menus
Next step of Keith's "rewrite everything with Phaser 3 + Rex UI": the **Sticker Book** is now drawn by Phaser + Rex UI,
scaled to fit the screen like the games' menus.
- Every game has its own colored page: the game's round picture on the left (tap it to go play that game) and its 4 stickers
  as big tiles. Stickers your child has are bright, new ones are yellow, and the ones still to get are a dotted "?" with a
  little picture of how to get them (a flag = finish a race, 3 stars, a trophy...).
- It's still a real book: 2 pages at a time, the big arrows at the bottom (or a swipe sideways, or the arrow keys) turn the
  page, and a row of dots at the top shows where you are. The Daily Surprise page (8 stickers) has a page to itself.
- Tap a sticker to see it big: yours = its name + confetti; one you don't have yet = the game's picture + the hint picture
  (on white cards so they're easy to see) and a big green Play button for that game.
- On a phone held upright each page shows the game picture beside the stickers 2 by 2, so the tiles stay big for small fingers.
- Small menu-kit additions others can use: colored cards behind a row, a swipe to turn pages, several rows that stay put at the top.
  Also fixed: "not yet" buttons (like RC's Race while a track has a red ring) now really show pale; they looked normal before.
- Tests: `test_stickers` and `test_daily` tap the new book for real (arrows, swipe, keys, zoom, Play, home, phone upright);
  the phone test, every game's menus, RC's menus + Track Builder, Maze, Coloring, hub, house, players and offline still pass.
- Next on this list: the hub, My House and the Parent corner (one per run).

## 2026-11-21 (Saturday evening) — Coloring's picture picker on the new menus
Next step of Keith's "rewrite everything with Phaser 3 + Rex UI": the **Coloring** book's menus.
- **Picking a picture**: the four round picture tabs (animals, fruit & veggies, things, My pictures) sit at the top and
  stay put while the pictures scroll; the open tab is yellow. Every picture is a big tile that shows the colors your
  child has added so far. The green home button is at the bottom (on a phone held upright five buttons didn't fit on one row).
- **My pictures**: tap a picture to keep coloring it. To take one down, tap the trash can, then tap the picture twice
  (the first tap turns it yellow with a big red X, so nothing goes by accident). An empty wall shows an empty frame.
- **"Done!"** (every part colored): the finished picture now shows big next to the smiling star, with the hang-it-on-the-wall
  and keep-coloring buttons under them. Confetti as before.
- The coloring screen itself (crayons, brush, stickers) is unchanged: it's the game, not a menu.
- Tests: `test_coloring` taps the new picker for real with the mouse and a finger on desktop, phone upright and sideways
  (every tab, open a picture, back, save, open from My pictures, take it down, home). Phones, house, players, daily,
  offline, hub and the other suites still pass.
- Next on this list: the hub, Sticker Book, My House and the Parent corner.

## 2026-11-21 (Saturday) — Maze Explorer's map on the new menus
Next step of Keith's "rewrite everything with Phaser 3 + Rex UI", now on the pages that aren't kit games. First one: the
**map in Maze Explorer** (the folded-map button at the top).
- The map is drawn by Phaser + Rex UI like every game's menus, scaled to fit the screen: the dice + 7 friends on top
  (the one you picked is yellow; friends you haven't met yet are a grey shadow with a padlock and wobble "not yet"),
  then one stepping stone per maze (its shape on its colors, a lantern for a dark cave, its stars). The maze you're on is yellow.
- When you've played lots of mazes, the map now opens scrolled to the one you're on (before, kids had to scroll to find it).
- At the bottom: a big green back arrow and the dots button (Easy / Normal / Challenge), always on screen.
- Menu kit: tiles can let their picture fill the whole tile, a picture-only button keeps its picture in the middle, and a
  screen can open scrolled to one thing (any game can use these).
- Tests: `test_maze` taps the map for real (mouse and finger) on desktop, phone upright + sideways and tablet; the phone test,
  every game's menus, RC's menus and the other suites still pass.
- Next on this list: the hub, Sticker Book, My House, Coloring and the Parent corner (one or two per run).

## 2026-11-21 (latest) — RC's Track Builder and every Friends room on the new menus
Next step of Keith's "rewrite everything with Phaser 3 + Rex UI": the last old-style menus inside the games are gone.
All 14 games now draw every menu with Phaser + Rex UI, scaled to fit the screen.
- **Track Builder** (Mini RC Racers → Build): My tracks is three big tiles (an empty one shows a green +). The drawing
  board is now a picture inside the menu: drag the dots, tap the road for a new dot, draw a loop with Draw, put things
  on the road with Things. Everything works the same as before, just drawn by the new menus.
  The tools (Draw, Things, Look, New, Undo, Back) are big picture tiles on the right with Race and Drive under them; the
  worlds, things or looks sit in two rows under the board. Race and Drive turn pale (and wiggle "no") while the track
  has a red ring to fix. On a phone held upright the tools move under the board.
- **Friends rooms**: Make a room / Join are two big tiles; Join shows the 8 code pictures as big buttons and the 3
  pictures you've tapped turn yellow on top (tap one to take it back). The lobby shows the room's 3 pictures, everyone's
  animal, and (for whoever made the room) the tracks to pick. This is the same for Mini RC Racers and for the other
  Friends games (Hoops, Turbo Bike, Bubble School, Fishing, Archery).
- Small menu-kit additions others can use: columns side by side (`cols`), a moving picture you can drag on, buttons
  that look "not yet", and a lone picture in a tile now sits in the middle instead of at the top.
- Tests: `test_rc_build` now draws, drags and taps on the canvas board (all 40 checks pass), `test_friends` runs all six
  Friends games through the new rooms on two "phones" (all pass), `test_rc_menus` also checks the builder and the
  Join keys fit on a phone (upright, sideways, tablet).
- Next on this list: the pages that aren't games (the hub, Sticker Book, My House, Coloring, Maze, Parent corner).

## 2026-11-21 (late night) — Mini RC Racers on the new menus
Next step of Keith's "rewrite everything with Phaser 3 + Rex UI": **Mini RC Racers**, the biggest one, now draws its menus
with Phaser + Rex UI, scaled to fit the screen. That's 12 of the 14 games.
- **Main menu**: the same 10 picture tiles (Cups, Free Play, Time Trial, My Car, Ghost Race, Build, Heart Battle, Coin Rush,
  Follow, Trophies) and Items / Help / Arcade under them. On a computer or a phone held sideways everything fits at once.
- **Free Play / Time Trial**: Race, Drive and Friends plus the 4 weathers are one row of round picture buttons at the top
  (the one you picked is yellow) that stays put while the tracks scroll.
- **My Car**: Style / Paint / Stickers tabs; the yellow tile is your car as it is now, locked ones show a padlock + what unlocks them.
- **Trophies**: tap a trophy (or an empty spot) and a big Go! button takes you to try for it.
- **Item Book, Heart Battle, Coin Rush, Follow, Cups** all moved over too, and so did the **Garage** between Grand Prix races
  (Upgrades with their level dots, Stickers, the Points table, the next track + one flag per race).
- **Results are pictures**: the top 3 cars on a podium ("You!" over yours; in Heart Battle the hearts each car had left),
  the coins you won, the cup's flags, a trophy + podium at the end of a cup, and you vs Boo after a Ghost Race.
- Still the old menus (next run): the Track Builder and the Friends rooms.
- Tests: a new `test_rc_menus.py` taps through every RC menu for real (and on 3 phone/tablet sizes); all the older RC tests
  (races, ghost, modes, items, battle, extras, builder, Friends, music, tap guard, home button, ages, stickers, daily) were moved
  over to the new menus and pass.

## 2026-11-21 (night) — Piano Star on the new menus
Next step of Keith's "rewrite everything with Phaser 3 + Rex UI": **Piano Star** now draws all of its menus with Phaser +
Rex UI, scaled to fit the screen. That's 11 of the 14 games.
- **The song list has picture tabs.** 64 songs + Free Play used to be one very long list to scroll through. Now six round
  picture buttons sit along the top: Easy (1 star), Medium (2 stars), Tricky (3 stars), Low notes (a bass clef),
  Two hands, Free Play. Tap one and only those songs show; the open tab is yellow. The tabs stay put while the songs scroll.
  When you come back to the list it opens on the tab of the song you just played.
- The two-hands songs wear the picture of the song they come from (buns, lamb, star...) instead of six identical hands.
- **Results** are the new kind: medal, stars, score, Hear it (plays the whole song; tap again to stop), Next, Again, Menu.
- The tabs are part of the shared menu kit, so any game with a long list can use them (RC Racers' cups and tracks, maybe).
- Tests: `test_piano` taps every tab for real, checks every song is under one of them and plays a song from its tile;
  Piano joined `test_canvas_menus.py`; the phone test passes for the piano page.
- Next on this list: Mini RC Racers (the biggest one), then the pages that aren't kit games.

## 2026-11-21 (evening) — Fishing Frenzy on the new menus
Next step of Keith's "rewrite everything with Phaser 3 + Rex UI": **Fishing Frenzy** now draws all of its menus with Phaser +
Rex UI, scaled to fit the screen. That's 10 of the 14 games.
- **My Aquarium** lives inside the menu now and keeps moving: the fish swim, tap one to see its name, tap the water (or Feed)
  to drop food. How many kinds you've found is painted on the tank's stand. On a phone held sideways the tank is bigger than before.
- **Shell Shop**: your shells at the top, then Bait and "For my aquarium" as big picture tiles with the price (a shell + number).
  Buying something changes the screen right where you are.
- **Fish Book**: how many kinds + how many fish at the top, then the 8 goals per place (done = a green tick, the one you're on
  now is yellow), then every fish (a dark shape and ??? until you catch it; stars for how rare it is).
- **Prizes**: pick your rod (locked rods show a padlock and what unlocks them) and a Fish Book button.
- **Results** are pictures instead of words: a fish + how many you caught, your best fish + its size, shells, goals, the Fish Book.
  Fishing with Friends ends with one picture: place, face, best fish, its stars and size.
- The menu engine learned one new trick every game can use: a **moving picture** inside a menu (used for the aquarium).
- Tests: `test_fishing` taps the new menus for real (shop, tank, book, rods); Fishing joined `test_canvas_menus.py`;
  `test_friends`, `test_phones fishing`, `test_controls` and the other menu tests pass.
- Next on this list: Piano Star (the song list), then RC Racers.

## 2026-11-21 (later) — Turbo Bike on the new menus
Next step of Keith's "rewrite everything with Phaser 3 + Rex UI": **Turbo Bike Challenge** now draws all of its menus with
Phaser + Rex UI, scaled to fit the screen. That's 9 of the 14 games.
- **Bike Shop** is a menu screen now: your bike and your coins side by side at the top, then Upgrades (with the 3 level dots
  under each picture), Paint, and Flames + stickers. Buying something changes the screen right where you are: it doesn't
  jump back to the top any more.
- **Cups:** between races the points table (place, bike, name, a points bar, +points from this race) and the flags are one
  big picture; at the end of a cup the trophy stands next to the podium, and if you weren't in the top 3 your own row sits under it.
- **Pick your bike** (Prizes) and **Build a track** (8 piece boxes, the places to pick from, Race it!) are screens too.
- The menu engine got two small upgrades every game gets: a heading in a list of tiles now starts its own line (it used to
  sit squeezed next to the tiles), and a screen that redraws itself (a shop after buying) keeps its scroll spot.
- Tests: `test_bike`, `test_bike_shop`, `test_bike_cup`, `test_bike_tracks`, `test_tapguard`, `test_players` and `test_stickers`
  tap the new menus; Turbo Bike joined `test_canvas_menus.py`; the phone test passes for the bike page.
- Next on this list: Fishing Frenzy (book, tank, shop, goals), then Piano Star, then RC Racers.

## 2026-11-21 — Five more games on the new menus
Keith's "rewrite everything with Phaser 3 + Rex UI" job, next step: **Bullseye Adventure, Treasure Trail, Space Defender,
Bubble School and Putt-Putt Park** now draw all their menus with Phaser + Rex UI, scaled to fit the screen (the title menu,
the level picker, Help, Trophies, Pause, the results). That's 8 of the 14 games done.
- **Prizes pages rebuilt as tiles:** Bullseye's hats + arrow trails (the hat pictures got a bit taller so the tops of the hats
  aren't cut off), Treasure Trail's hats + the parrot (tap to take it along), Space Defender's ships, the Weapon Book (all 20)
  and the auto-fire switch, Bubble School's sea friends + the voice switch, Putt-Putt Park's ball colors. Locked ones show a
  padlock and how many stars they need; the switches sit at the top so nobody has to scroll to find them.
- Friends games (Bubble School quiz race, Archery taking turns) still use the same lobby and now end on the new results screen.
- Space Defender's "Checkpoint" button after losing past the mini boss works on the new results screen too.
- Tests: `test_canvas_menus.py` now walks all 8 converted games (mouse + finger, upright + sideways); `test_abc`, `test_golf`,
  `test_space`, `test_friends` and `test_tapguard` tap the new menus; the phone test passes for all five pages.
- Next on this list: the games with menus of their own (Turbo Bike, Fishing, Piano Star), then RC Racers.

## 2026-11-20 (midnight) — Home button fixed, controls pop up, Potion Quest on Phaser
- **The home button works again.** The round house button in the top-left corner sat *under* the menus (title menu,
  pause menu, results), so tapping it did nothing while a menu was open. It now sits on top of every menu. New test
  `tests/test_home.py` taps it with a finger on the title menu, while playing and on the pause menu (plus each menu's own
  Arcade button) in 6 games.
- **The controls pop up when you hit Play.** Every game now shows a card with its controls (the first how-to pictures: which
  button or key does what) every time a round starts. The game waits; one tap (or any key) and off you go. "Start over" skips
  it, and so do Friends games (the other phones don't wait). Potion Quest shows it after you pick your hero. Test: `tests/test_controls.py`.
- **Potion Quest redone on Phaser 3**, like Jungle Jump: the hero, every baddie and every potion/apple/coin on the ground
  are now Phaser physics bodies. Phaser moves them, keeps baddies from standing on top of each other and notices when you
  walk over a pickup. The drawings stay our crisp hand-drawn art (no blur), with a bit more detail on the heroes: chain mail
  and a gem in Rowan's sword, freckles, a bracer and a leaf brooch for Fern, round glasses and a moon on Pim's robe, belt pouches.
  Its menus are now drawn by Phaser + Rex UI too (the third game on the new menus).

## 2026-11-20 (very late) — Hoop Heroes' menus on Phaser + Rex UI
The second game on the new menus. Hoop Heroes' title menu, rival picker, ball picker (Prizes), trophies, help, pause
and results are now drawn by Phaser + Rex UI, scaled to fit the screen. The ball picker shows your ball big with its
trail, and every ball as a tile (locked ones say how to get them). A Friends game's results list each player as its own chip.
Little kids still see the little badge on the title menu. New test `tests/test_canvas_menus.py` taps through every
converted game's menus for real (mouse and finger, upright and sideways); the other tests that open Hoops' menus were updated.

## 2026-11-20 (late night) — Menus drawn with Phaser + Rex UI (Jungle Jump first)
Keith asked to rewrite every menu with Phaser 3 + the Rex UI plugin: menus drawn inside the game picture and scaled to fit
the screen. That's a big job, so it goes one game at a time, and every game keeps its old menus until its new ones pass the tests.

- **The new menu engine** (`arcade/canvasmenu.js`): every kit menu (the tap-to-start screen, the picture menu, the level
  picker, Help, Prizes, Trophies, New game, Pause with its volume sliders, and the results with stars and buttons) can now be
  drawn by Phaser, with Rex UI doing the buttons, the wrapping grids and the scrolling. The whole menu is scaled to fit the
  screen in one piece (sideways or upright; upright gets bigger buttons) and drawn at the screen's full sharpness.
- **Jungle Jump uses it now.** Its hero picker (Prizes) was rebuilt for it too.
- Buttons never shrink when pressed (only what's inside squishes), so taps near the edge always count.
- The other games are next, one per session (the list is in the roadmap). Phaser moved to `arcade/` so every game can share it.

## 2026-11-20 (late) — Buttons respond again
Keith: "the buttons don't seem to be responding too well". The bouncy press added earlier tonight shrank the whole
button the moment a finger touched it, so a tap near a button's edge ended up just outside it and didn't count.
Now the button keeps its size (only the picture and words inside squish, and it looks pressed), and the menus'
bounce-in is quicker and gentler. A new check in `tests/test_tapguard.py` taps 3 px from a button's edge (mouse and touch).

## 2026-11-20 (night) — Menus that fit every phone + bouncy menus + a swipeable Sticker Book
Keith said the menus still didn't look right on some phones and picked the plan: fix the phone problems first, then
make the menus feel slicker with GSAP (animations) and Swiper (swiping).

- **Phone fixes (all games at once):**
  - Menus, buttons and the game keep clear of the notch, rounded corners and the home bar on iPhones.
  - The bottom of the screen is measured the way the phone really shows it (Safari's address bar no longer cuts menus off).
  - Phones that enlarge text by themselves (Samsung) no longer break the layouts.
  - Menus that would have to shrink a lot to fit now scroll instead, so tiles stay big enough for little fingers.
  - Older phone browsers that can't shrink menus the usual way get a fallback that works.
- **Fixed on real screens** (found by the new phone test): Turbo Bike's, Hoops' and Bubble School's title-menu buttons went
  off the sides of upright phones; Fishing's and Archery's Play button was cut off on small phones held sideways; the
  coloring book's picture tabs and the maze's top buttons ran off the edge on small phones; My House's shop pushed the
  room off the screen on small phones; RC's menus were tiny on upright phones (now a tall layout, 3 tiles across) and
  its bottom buttons were tiny sideways (now bigger); and the on-screen driving buttons showed over the menus on phones.
- **Bouncy menus:** menus pop in and their tiles bounce in one after another; every button squishes when pressed. The hub's
  game boxes bounce in too. (Switched off on devices set to "reduce motion".)
- **The Sticker Book is a real book now:** a few pages at a time; swipe, or tap the big arrows, to turn the page, with
  page dots at the bottom.
- New test `tests/test_phones.py`: every page on 9 phone and tablet shapes, upright and sideways.

## 2026-11-20 (evening) — Jungle Jump now runs on Phaser
Keith liked the Phaser try-out, didn't like its motion blur, and asked to make Phaser the main version with a more detailed hero.
Done, with nothing lost: all 8 levels, the 5 animals, music, stars, treasures, stickers, saves and little-kid help are all still there.

- **Phaser is now the engine.** The ground, rocks, platforms, critters and the hero are Phaser physics bodies; Phaser moves
  them and works out every bump, and it tells the game when the hero touches a goodie, chest, lantern, spring, thorn or the balloon.
  The way the jump feels is the same as before (it was carefully tuned), and the robot test still finishes every level.
- **No more blur.** The Phaser demo drew a small picture and stretched it to the screen, which smeared when things moved.
  Now our own hand-drawn pictures are painted straight onto the screen at full sharpness, and Phaser just runs the world.
- **A bit more detail on the hero** (all 5 animals): eyebrows (worried when falling or hurt), fur marks on the back, a soft
  light along the front, toe lines and little fingers.
- The separate `jungle-phaser/` demo page is gone (it became the real game). Phaser is one 1.2 MB file in `jungle/`, saved
  on the device for offline play like everything else.

## 2026-11-20 (later) — A Phaser try-out of Jungle Jump (Keith asked)
Keith asked what Phaser is and wanted to see the difference. `jungle-phaser/` is the first Jungle Jump level (Leafy Forest)
rebuilt with the Phaser 3 game framework: same map, same moves (run, jump with short hops, leaf glide, roll), berries, a
chest, critters, thorns, a spring, lanterns, moving platforms and the balloon at the end. The top of `jungle-phaser/game.js`
explains what Phaser does for us and what's still our own code. It's a demo: not on the hub and not saved for offline play
(Phaser is one 1.2 MB file, kept in that folder). Open it at /jungle-phaser/.

## 2026-11-20 — Mini RC Racers: Coin Rush + Follow the Leader
The next part of Keith's RC plan ("new ways to play"). Two new picture tiles on RC's main menu (it now has 10 tiles, 5 across),
each with all 10 tracks to pick from.

- **Coin Rush**: grab as many coins as you can before the clock runs out (60 seconds; little kids get 90).
  Wavy rows of coins all round the track, a big shiny coin worth 5 now and then near the edge of the road, and two
  green stopwatches per lap that give you 5 more seconds. Coins come back after a few seconds, so every lap has coins.
  The last 5 seconds tick, and the clock flashes red in the last 10. Three stars under your coin count light up as you
  reach bronze, silver and gold. Your best score is kept per track, and the first gold on each track gives a house coin.
- **Follow the Leader**: Pip, a green car with a yellow flag, drives 2 laps weaving gently left and right, and leaves a
  trail of colorful music notes. Drive through them before they fade (each one plays the next note of a happy scale).
  Stay close: a dashed ring round Pip turns gold when you're near. If you fall far behind, Pip slows down and waits
  ("Over here!"), and an arrow points the way. Stars for how many notes you caught; first 3 stars on a track = a house coin.
  For little kids Pip goes slower and weaves less, the notes stay longer, and their car never drives past Pip.
- Neither mode counts as a race win (so they don't unlock race things by accident).
- New test `tests/test_rc_modes.py` plays both modes (coins, clocks, notes, Pip waiting, whole rounds, little kids, phones).

## 2026-11-19 (night) — Mini RC Racers: 30 items!
Keith thought 30 items total would be cool. There are now 24 gift-box items + 6 special ones = 30, all in the Item Book
(the book now shows 8 cards across so all 30 fit on one page).

- **9 new gift-box items:**
  - **Pogo Pad**: drop a bouncy pad behind you; the next car on it boings up in the air (and slows down).
  - **Bubble Trap**: drop a bubble behind you; the next car to touch it floats in a bubble.
  - **Glitter Trail**: you leave sparkles behind you for 4 seconds; cars driving over them wobble.
  - **Monster Wheels**: big chunky wheels for 6 seconds: lots of grip, and grass doesn't slow you down.
  - **Water Balloon**: throw it ahead in a big arc; SPLASH, and it leaves a puddle.
  - **Turbo Trio**: three boosts, one tap each.
  - **Lucky Dip**: a surprise! It turns into a random item and uses it right away.
  - **Busy Bee**: buzzes off after the car in 1st place (in Heart Battle: the car with the most hearts) and makes it wobble.
  - **Whirlwind**: a little tornado that spins away down the road and spins out whoever it touches.
- **3 new special items** (locked until you unlock them, like the first three):
  - **Bubble Dragon** (beat Boo in the Ghost Race): a friendly dragon flies over and drops a bubble on the cars ahead.
  - **Swap-O** (race on a track you built): you swap places with the car just in front of you!
  - **Disco Ball** (finish a cup): a disco ball on your car, and every other car spins round dancing.
- All new items work in Heart Battle too (they take hearts there). The computer cars use the 9 new ones, never the specials.
  In Friends races the throwing ones turn into plain bubbles, like the other throwing items.
- `tests/test_rc_items.py` now checks all 30 cards, the 6 unlocks, and what each new item does.

## 2026-11-19 (bedtime) — Mini RC Racers: the Item Book + 3 special items
Keith thought it'd be cool to see all the different pick-ups, or to have special unlockable ones. Both are in.

- **The Item Book**: a new yellow **Items** button at the bottom of RC's main menu. A card for each of the 15
  gift-box items: its picture, its name, what it does in a few words, and how many times you've had it. Items you
  haven't found yet are a dark shape with a "?", and the top shows how many you've found ("7 / 15"). The first time
  you get a new one in a race, "New in the book!" pops up.
- **3 special items**, locked at first (pink cards with a padlock that say how to unlock them):
  - **Mega Car** (win 5 races): your car grows HUGE for 5 seconds, a bit faster, and nothing can stop it; bump a car and
    it wobbles out of the way.
  - **Freeze Flake** (find 12 items in the book): every other car goes slow and slippery for 3 seconds, with icy rings.
  - **Firework Party** (win a Heart Battle): a little firework rocket chases each of the other cars and pops on it.
  - Once unlocked, they sometimes come out of your gift boxes (about 1 in 16), in races and in Heart Battle (where
    they take hearts). The computer cars never get them. A message pops up when one unlocks.
- New test: `tests/test_rc_items.py`.

## 2026-11-19 (late) — Mini RC Racers: a better Track Builder
Keith asked to make "create a race track" better and picked three things: put things on it, more looks, and race
friends on it. All three are in.

- **Things** (the new button with a gift box, a ramp and a bumper): a row of pictures appears under the board. Pick
  one and tap the road to put it there; tap something on the road to take it away; the bin clears the road.
  - **gift boxes** (a row of 3 across the road), **boost pads**, **jump ramps**, **bouncy bumpers**, **oil**,
    **puddles**, and the world's **moving critter** (a beach ball in the backyard, a crab on the beach, a snowball in
    the snow...). Bumpers, oil, puddles and critters go on the side of the road you tap.
  - Up to 16 things per track. The first time you open Things, the track starts with the usual few gift boxes, pads
    and puddles, so you can move them or add more. Tracks you made before keep working the old way until you do.
  - The race uses exactly what you put there.
- **Look** (the paint palette button): **laps** (tap the flag: 1 to 5), **weather** (sunny, rain, snow, wind) and
  **road width** (thin, normal, wide; a thin road is harder!).
- **Race friends on it**: in a Friends room, the room maker now sees their own tracks next to the 10 normal ones.
  Pick one and it's sent to every phone, things, laps and weather included, and everyone races it.
- Undo works for all of it. The small tool buttons are now pictures two across, to make room.
- Tests: `tests/test_rc_build.py` (things, looks, the race using them, old tracks) and `tests/test_friends.py`
  (a home-made track travels to the other phone).

## 2026-11-19 (night) — Mini RC Racers: cooler items, bumpers and more obstacles
Keith asked for "a couple cooler weapons", some of Heart Battle's bouncing circles on the tracks, and more obstacles.
(They're all friendly: things wobble, spin and bounce. Nothing breaks.)

- **3 new gift-box items** (in races and in Heart Battle):
  - **Giant Snowball**: rolls straight ahead and gets bigger as it goes. Every car it meets gets a little spin.
  - **Boomerang**: a spinning rainbow boomerang loops out in a big curve and comes back to you, bonking cars on the way.
  - **Triple Bubble**: three bubbles at once, in a fan.
  - A shield blocks them. In Heart Battle each hit takes a heart. The computer cars use them too.
- **Bouncy bumpers** (the round red/white/star ones from Heart Battle) on 5 tracks: Sunny Beach, Autumn Woods,
  Candy Raceway, Moonlight Speedway and Cloud Castle. They're always on one side of the road, so there's room to pass.
  Hit one and BOING, you bounce off. They pop bubbles too, so you can hide behind one.
- **A moving obstacle on every track.** New: a rolling **beach ball** (Backyard Loop), a rolling **pumpkin** with a
  smile (Autumn Woods), a bouncing **tumbleweed** (Desert Dunes), a floaty **moon rock** (Moonlight Speedway), a
  hopping **frog** (Jungle Rally) and a sleepy **cloud puff** (Cloud Castle). Bumping one is a gentle wobble.
- **Results screens fit again**: Keith's screenshot showed the Again / Menu buttons cut off at the bottom. The medal,
  stars and podium are a little smaller now so everything fits. Heart Battle shows each car's hearts left on its podium step.
- New test: `tests/test_rc_extras.py`.

## 2026-11-19 (evening) — Mini RC Racers: Heart Battle
Keith asked for a battle-royale mode in RC, with hearts instead of balloons so it isn't like Mario Kart, and to start
on it right away. It's a new **Heart Battle** tile on RC's main menu (a big heart in a little arena).

- **Pick an arena**: Garden Ring, Snowball Bowl or Candy Dome. Each is a big round arena with its own look and song.
- **Every car has 4 hearts**, floating over it. (Little kids get 6, and the computer cars are gentler with them.)
- **How you lose a heart**:
  - a **bubble** (it chases the car in front of you) pops one heart;
  - a car **boosting** (or with a Super Star) that bumps into you knocks one off. Normal bumps are just bumps;
  - a **Party Popper** knocks one off every car close by.
  - A **shield** blocks one hit. After losing a heart a car blinks for a moment and can't lose another straight away.
- **Out of hearts**: the car **poofs into sparkles** and leaves the arena. The **last car still driving wins**.
- A **ring of flowers** (snowballs, gumdrops) slowly closes in after 15 seconds, so everyone ends up meeting in the
  middle and a battle takes about 1½–2 minutes. If time runs out, the car with the most hearts wins.
- **4 big bouncy bumpers** to hide behind (they pop bubbles), **gift boxes** all round, and now and then a **heart to pick up**
  when someone has lost one.
- The gift boxes have battle things only (bubble, boost, shield, honey, spring, party popper, ghost, super star).
  Car powers that would make a car unbeatable (like the Ghost Car driving through everything) are switched off here.
- Out yourself? "Nice try!" and one tap on **Again**. Your first win in each arena gives a **house coin**.
- New test: `tests/test_rc_battle.py` (hearts, bumps, shields, bubbles, the ring, the heart pickup, winning, losing,
  little kids, a whole battle on autopilot, phones).

## 2026-11-19 (later) — Maze Explorer upgrade
Keith asked for a Maze Explorer upgrade. There were no details written down, so I picked things that make it more of an
*explorer* game while keeping it calm and fail-free (no timers, nothing to lose). Tell me what you'd like more of!

- **The map** (a new picture button, a folded treasure map). It shows:
  - **Your friends**: tap one to take them on every maze, or tap the dice to let them take turns (like before).
  - **Every maze you've reached** as a stepping stone with its shape and the stars you got. Tap one to play it again
    (good for going back for 3 stars). The maze you're on has a red ring.
  - The Easy / Normal / Challenge dots moved in here (fewer buttons on the maze screen, so phones held upright fit).
- **4 new friends** join as you play: a **puppy** (finds a bone) after 3 mazes, a **monkey** (banana) after 6,
  a **fish** (seashell) after 9 and a **kitten** (ball of yarn) after 12. Until then they're a dark shape with a padlock.
  When one joins, their face pops up next to the stars.
- **3 new maze shapes**: house, apple and cloud (8 shapes now).
- **Lantern caves**: a new cave look. On Normal and Challenge the cave is dark and your friend carries a lantern:
  every spot you've walked lights up and stays lit. The treat and the key glow so you always know where to go,
  but the gems hide in the dark. On Easy, and for little kids, the cave is lit up.
- **"Stuck?" sparkle**: if nobody moves for 15 seconds (9 for little kids), the next few steps sparkle by themselves and
  the light bulb wiggles. The bulb still shows the whole way when tapped.
- Old saves keep their place; the map knows every maze you'd reached.
- New test: `tests/test_maze.py` (solves mazes like a finger: key, door, gems, stars; new friends; the map;
  dark caves; the sparkle; phones upright and sideways).

## 2026-11-19 — Turbo Bike: the Bike Shop
Next on the Turbo Bike plan was **#7, the bike shop**. The coins you grab on the track can now be spent.

- A new **Shop** picture button on Turbo Bike's title menu (a yellow shopping bag). Your coins are at the top,
  with a big picture of your bike that changes as you buy things.
- **Every track coin goes in your wallet.** (It still counts toward house coins too: 25 coins = 1 house coin, like before.)
  Players who already collected coins start with all of them in the wallet.
- **Upgrades**, 3 levels each, for every bike you own:
  - **Engine** (20 / 40 / 70 coins): a bit faster each level.
  - **Cooler** (15 / 30 / 55): the engine heats up slower, so turbo lasts longer.
  - **Tires** (15 / 30 / 55): easier landings, a bit more grip, and mud slows you down less.
- **Looks**: 8 paint colors (12 coins each; the bike's own color is always free), **flames** on the tank (25),
  and 4 **helmet stickers**: star, heart, lightning bolt, smiley (10 each). Things you've bought stay yours: tap to
  switch them on and off. Not enough coins = the button wobbles, nothing is spent.
- Two new trophies: **Bike shopper** (buy anything) and **Super bike** (every upgrade to the top).
- New test: `tests/test_bike_shop.py` (buying, not enough coins, the upgrades really change the ride, the looks show on
  the bike, race coins land in the wallet, and the shop fits on phones).

## 2026-11-18 — Turbo Bike: Championship cups
Next on the Turbo Bike plan was **#6, the Championship cup**: several tracks in a row against Zip, Moxie and Bolt,
with points for every race and a big trophy at the end (like RC's Grand Prix, but with no garage in between).

- Two new tiles under **Cups** at the bottom of the track picker:
  - **Mini Cup**: Sunny Start, Dusty Hills and Candy Bounce in a row (about 3 minutes). Always open.
  - **Championship**: all 10 tracks in a row. It opens once you've finished a Mini Cup.
- Every race gives points: **10** for 1st, **7** for 2nd, **5** for 3rd, **3** for 4th. During a race, a little flag
  at the top shows which race it is ("2/3").
- After each race: everyone's points as colored bars (with "+10" etc. for that race), checkered flags for the races
  done so far, and a big **Next race** button.
- After the last race: a **trophy** (gold, silver or bronze by your place) and the top 3 riders on a podium.
  A tie goes to you. Then **New cup** or Menu.
- You can stop between races: the cup tile remembers where you were ("4/10") and carries on from there.
- The first time you win each cup: house coins (1 for the Mini Cup, 3 for the Championship). Two new trophies:
  **Mini Cup winner** and **Champion of champions**.
- Each race plays at its own track's difficulty, so the Championship gets harder as it goes. Cup races don't change your
  normal track times, medals or ghost bikes.
- New test: `tests/test_bike_cup.py` (plays a whole Mini Cup, checks the points, the trophy, the house coin, that the
  Championship opens, carrying on after leaving, and the screens on phones).

## 2026-11-17 — Turbo Bike: 5 new places, 10 tracks in all
Next on the list after the 10-point plan was the Turbo Bike plan's **#5, more tracks and places**. Each new
track has one special thing of its own. They open one by one after Volcano Run.

- **Splash Beach**: sand, palm trees and the sea behind the crowd. Shallow water runs right across the track:
  riding through it makes a big splash (and slows you down a little), so jumping over it is the fast way.
- **Candy Bounce**: pink sky and giant lollipops. Ride over a **pink jelly pad** and BOING, the bike flies high
  into the air. The bike stays level and always lands fine, so it's just fun (and a great moment for a trick).
- **Night Lights**: a night race under the stars and a moon. Street lamps light up pools of the track and your
  bike has a headlight. (Little kids get a lighter night.)
- **Jungle Loops**: three **loop-de-loops**. Roll onto one and the bike goes all the way round by itself, upside
  down at the top, and shoots out a bit faster. Zip, Moxie and Bolt do the loops too.
- **Cloud Castle**: a lavender road in the clouds with **ramps on springs that go up and down**. Time it so you hit
  one at the top. Landing near them is extra forgiving, since it's hard to know where the ground will be.
- **Build a track** has the new pieces too: Splash, Jelly pad, Loop and Moving ramp (that's part of plan #8). The
  colors of each new place open for your own tracks once you've finished that track.
- 3 new trophies: **Boing!**, **Loop-de-loop**, **World tour** (finish all 10 tracks).
- Each track now says how hard it plays, so the first five play exactly as before. (Little kids still get Easy everywhere.)
- New test: `tests/test_bike_tracks.py` (a robot rides every new track and checks its special thing happens,
  the medal times fit, little kids never tumble, and the picker fits on phones).

## 2026-11-16 (later) — The 10-point plan is finished: Jungle Jump's new levels, the Parent corner, tests on GitHub
Keith asked to finish the rest of the list in one go. Three parts:

**1. Jungle Jump: a second level in every world** (8 levels now; the last part of point 8)
- **Treetop Trail** (forest): climb from treetop to treetop up a big hill, then one long leaf glide down the far
  side along a trail of berries. A lift is the easy way up, and a spring puts you back if you fall.
- **Glow Cave** (cave): the cave is dark and your hero carries a pool of light. Each of the 5 lanterns lights up a big
  area when you pass it. Gems, fireflies, crystals and spikes all glow, so it's cosy, not scary. The treasure
  is in a secret room behind a pretend wall.
- **Windy Peak** (snow): columns of wind with little up-arrows. Step in and hold jump: your leaf carries you up the
  mountain. There are no pits at all; falling just lands you on a lower floor with its own wind.
- **Jelly Hills** (candy): bouncy jelly everywhere: a jelly pit that bounces you back out, jelly stairs, and
  jelly blocks across a big gap. The hardest level (big kids play it on Challenge; little kids get it on Easy).
- Finishing a world's first level opens its second level AND the next world, so nothing that was open is locked now.
  Next goes level 1 -> level 2 -> the next world. Old saves keep everything. One new trophy: **World tour** (all 8).
  The level picker is 2 tidy rows of 4. The new levels play their world's song a little higher and faster.
- Not checked by a real child yet: the two to watch are the wind (you have to find out "hold jump"; a short
  "Hold jump!" hint pops up) and Jelly Hills on Challenge.

**2. The Parent corner** (point 9)
- At the bottom of the arcade's front page there's a small **Grown-ups** button with a lock. A tap does nothing:
  **hold it for 3 seconds** (a green ring fills up) and the Parent corner opens.
- **For each kid**: minutes today and in the last 7 days (a little bar chart), which games they played and for
  how long, their stickers (out of 68) and trophies. Play time is counted from now on, only while the arcade is open
  and on screen, and kept for 14 days.
- **Time limit**: pick No limit / 15 / 30 / 45 minutes / 1 / 1.5 / 2 hours a day for each kid. When the time is up a
  sleepy moon says **"All done for today!"** and the games wait until tomorrow (the game pauses and goes quiet;
  nothing is lost). A grown-up can hold a button on that screen for 3 seconds to give 15 more minutes, or add
  them from the Parent corner.
- **Sound**: all sound on/off and the sound-effects volume for the device; music on/off and volume for each kid.
- **Nothing leaves the device.** It's all kept in the browser's own storage, like the saves.

**3. Keep it healthy** (point 10)
- **Tests run by themselves on GitHub**: every push now plays all the test files on GitHub's computers
  (the Actions tab; a green tick or red X shows next to each change).
- **Faster on older tablets**: when an action game runs slowly for a few seconds, the arcade now draws it a little
  less sharp (far fewer pixels to paint) and makes fewer sparkles, and remembers that for next time. In the
  Parent corner you can set Drawing quality to Automatic, Always fast or Always sharp. I could only test this by
  pretending the frames were slow, not on a real old tablet.
- **Report a problem** (in the Parent corner): opens your email app with a message started: what happened, which
  game, plus the arcade version, screen size and browser. Nothing about the kids, and nothing is sent until you
  press Send. **The "To" address is empty for now**, because an address in the code would be public on GitHub:
  see the note in `ROADMAP.md`.
- `CLAUDE.md` is up to date. New tests: `tests/test_jungle.py` (a robot finishes all 8 levels, as a big and a
  little kid) and `tests/test_parent.py`. All 25 test files pass.

## 2026-11-16 — Mini RC Racers: build your own tracks!
Another part of point 8 (Deeper favorites). The RC main menu has a new **Build** button (a road with a pencil).
- **My tracks**: 3 places for tracks of your own (each player has their own 3). An empty one is a big green +.
- **Draw it**: tap the pencil and pull a loop with your finger. The wobbly line becomes a smooth road with
  white dots on it. A tiny scribble is blown up to race size, and the start line goes on the straightest bit.
- **Shape it**: drag any dot to bend the road; tap the road between two dots to add a new dot.
  The dice makes a surprise track; the arrow undoes the last change. White arrows on the road show which way you race,
  and the checkered dot is the start.
- **10 worlds**: little pictures under the board pick the look (backyard, beach, snow, autumn, desert, candy,
  moonlight, jungle, clouds, volcano), with that world's scenery, music and critters (crabs, snowballs...).
- **No crashes into itself**: if two parts of the road get too close, or a bend is too tight, a red ring pulses
  there and the Race button wiggles "no" until you fix it (or tap Undo). But ONE crossing is allowed: it turns into
  a **bridge**, like Candy Raceway's figure 8 (the dice sometimes makes one).
- **Race** it against the 3 computer cars (3 laps, gift boxes, puddles) or **Drive** it and find the 12 stars.
  The results screen has a Build button that takes you straight back to keep improving it.
- Home-made wins are just for fun: they don't count toward the special paints or the trophy shelf (otherwise a tiny
  track would make them too easy). New test `tests/test_rc_build.py` draws, drags, breaks + fixes, races
  (also over a bridge) and checks the phone size. All test files pass.

## 2026-11-15 (later) — RC: the secret Ghost Car
Keith's idea: beat Boo 10 times and you unlock a ghost car.
- **Hidden until you win it**: it isn't in My Car at all, not even as a locked tile, and no hint says how to get it.
  On the 10th day you beat Boo, the results screen shows the car floating with "NEW!", plus confetti and a
  "Secret car" pop-up. (Only the first win each day counts, so that's 10 different days.)
- **The Ghost Car** is a see-through floating ghost with big eyes and a little "ooo" mouth, in your paint color.
  It drives right through everything: other cars, oil, puddles, honey, bubbles, crabs and snowballs, and creeks don't
  slow it. It always has a maxed engine and tires, even at the start of a new Grand Prix.
- **The catch**: gift boxes go right through it too, so you never get items. Track coins can still be picked up.
- The computer racers never get it. `tests/test_rc_ghost.py` now checks all of this.

## 2026-11-15 — Mini RC Racers: Daily Ghost Race + Trophy Shelf
Two more parts of point 8 (Deeper favorites). The RC main menu now has 6 big buttons instead of 4.
- **Ghost Race** (new button with a little ghost): every day there's a new track, and **Boo**, a friendly
  see-through ghost car, races you on it. 2 laps, just you and Boo: no gift boxes, no bumping (he's a ghost,
  you drive right through him), sunny weather. A bar at the top shows you and Boo moving toward the finish
  flag, with "1st" or "2nd" beside it, and an arrow points to Boo when he's ahead and off the screen.
  Boo never takes the secret shortcuts, so finding one helps. A close finish gets the slow-motion "Photo finish!".
- **Beat Boo** and the results say "You beat Boo!" with both cars and their times. The first win each day adds
  to your Ghost trophy and gives **1 house coin**; racing again that day is just for fun. The button then shows a
  gold star and "beaten today!". Lose and it's "Nice try!" with a big Again button.
- **Fair for everyone**: big kids get a quick Boo (the computer driver beats him by about 20% on every track; I
  tuned him track by track so no track is much harder than another). Little kids (3-5) get a sleepy Boo and only
  the 6 gentler tracks: in the test, a little kid who presses nothing at all still beats him on all 6.
- **Trophy Shelf** (new Trophies button): three wooden shelves with everything you've won in RC.
  Top shelf: Mini Cup, Grand Prix, the Ghost trophy (bronze after beating Boo once, silver after 5 days,
  gold after 10) and a Free Drive star (all stars found on 1 / 5 / 10 tracks). Below: one trophy per track
  (gold = you won a race there, silver / bronze = your best Free Play place), with the track's picture and two
  little badges: a stopwatch (you set a Time Trial lap) and a star (you found all its Free Drive stars).
  Trophies you haven't won are dashed outlines. Tap a trophy and it hops; tap any of them and a **Go!** button
  takes you straight to the race that wins it. The button on the menu shows how many you have (like "9 / 14").
- New test `tests/test_rc_ghost.py`: plays ghost races on every track (win, lose, once-a-day reward, little kids),
  checks the shelf against made-up saves, and checks the phone layout. All test files pass.

## 2026-11-14 — Piano Star: play with two hands, and record your own tunes
The Piano part of point 8 (Deeper favorites).
- **Two hands**: a new "Two hands" shelf in the song list (the tiles show a blue left hand and a pink right hand)
  with 6 songs: Hot Cross Buns, Mary Had a Little Lamb, Twinkle Twinkle, London Bridge, Ode to Joy and Jingle Bells.
  The right hand plays the tune as before; the left hand adds one or two low notes per bar. The music shows two
  staves like real piano music (treble on top, bass below) and the piano grows to two full octaves.
  When both hands have a note at the same time, both keys glow: tap them in any order (one finger at a time is fine)
  and the song moves on. The Listen button and "Hear it" play both hands. New trophy: **Two hands!**
- **Record your own tune** in Free Play: a red button records (it turns into a stop button, and a gold ring
  shows how much time is left, up to a minute), a green button plays your tune back with the keys going down
  and the notes written on the staff. Three colored discs at the top are 3 places for tunes; tapping one with a
  tune in it plays it. Tunes are saved on the device, separately for each player. New trophy: **My own tune**.
- Two new pictures on the how-to-play screen. `tests/test_piano.py` now also plays the two-hands songs with
  real taps and records, saves and plays back a tune. All test files pass.

## 2026-11-13 (night) — Fishing Frenzy: new looks + lots more to do
Keith asked for better drawings (water, fish, boat, the catch screen) and more to do (an aquarium, a shop, challenges).
**How it looks**
- **A rowboat on Sunny Pond**: the angler now sits in a red-and-white rowboat with an oar and a bucket, and it gently
  bobs on the waves. The Ocean Pier got a life ring, seaweed on the posts and a nicer sailboat; the Icy Lake shelf got
  cracks in the ice, longer icicles and a snowman with a scarf and stick arms.
- **New water and lake bottoms**: deeper water gets darker, sunlight wiggles just under the surface, the surface
  twinkles. Each place has its own bottom: a hollow log and mossy rocks in the pond, coral and a big old anchor at
  the pier, ice crystals in the lake. Far away: a red barn, a striped lighthouse, northern lights over the mountains.
  (These still parts are painted once, so it stays smooth on older tablets.)
- **Fish have more detail**: darker backs, a shiny stripe, soft scales and lines in their fins and tails.
- **New catch screen**: your fish wiggles in a little window of water, a ruler shows how big it is (compared with
  the biggest of its kind), then its stars, points and shells. NEW!, BIG! and GOAL! badges.
**More to do**
- **Shells**: every fish gives shells (rarer fish give more, a new kind gives 3 extra, a Frenzy doubles them).
- **Shell Shop** (new Shop button on the title screen): 4 baits that change what you catch: Wiggly Worm (free),
  Berry Bait (fish come quicker), Shrimp Snack (more rare fish) and Glitter Bait (more golden fish). Your lure
  looks like the bait. Plus 8 things for your aquarium: plants, a starfish, a bubble stone, coral, a snail,
  rainbow stones, a treasure chest (it opens!) and a castle.
- **My Aquarium** (Tank button): every kind of fish you've found swims in your own tank with what you bought.
  Tap a fish and it does a happy flip and shows its name; tap the water (or Feed) to drop food and they swim over to eat.
- **Goals**: each place has 8, one at a time, shown as a picture at the top while you fish (e.g. "catch 3 fish",
  a Stripy Perch, a Bubble Carp of 42 cm or more, any rare fish, the legendary fish). Finishing one gives shells
  (5 up to 20). All 24 are in the Fish Book with ticks.
- 3 new trophies (Goal!, Tank decorator, and a secret one). The title screen's small picture buttons now go in two rows
  when there are lots (so they fit on a phone held sideways).
- New test `tests/test_fishing.py`: the game's own bot casts, waits and reels fish in, plus goals, shop, aquarium,
  old saves and phone size. All test files pass.

## 2026-11-13 (evening) — Potion Quest: smoother, more detailed, more baddies
Keith played it and asked for five things.
- **Less laggy.** The backgrounds used to be redrawn shape by shape many times a second; now each one is painted
  once and just copied to the screen. The heroes also walk faster and bonk sooner, so it feels snappier.
- **More detailed characters.** The Knight has a cape, chest plate, shoulder pads, a shiny helmet and a real sword;
  the Ranger a ponytail, quiver of arrows, feathered hat and a leafy staff; the Wizard fluffy hair, a starry robe and
  a bent hat with a gold band. The baddies got shading, tummies, cheeks, long ears, and the Blob King a moustache and cape.
- **Fewer hearts for the hero**: 4 in the Meadow, 3 in the Woods and the Castle (the Knight has one more; little kids 5).
  Running out still restarts at the same group of baddies.
- **Your hero and your potions carry over** when you press Next (no "Pick your hero" in between).
  Starting a place from the menu still lets you choose.
- **More baddies, and 5 new kinds**: tiny quick blobs (one bonk), a big blob that pops into two tiny ones, a pink bird
  that swoops, a snail that hides in its shell after each bonk (clink!), and a walking boulder that stomps.
  Every group is bigger now (4 to 8 baddies), each place has one more group, and the Blob King calls tiny blobs.

## 2026-11-13 (later) — New game: Potion Quest, and fishing is easier
**Potion Quest** is the Golden Axe-style game Keith asked for: a walk-along adventure with our own heroes.
It's the 14th game on the front page (Action tab).
- **Pick your hero** (three big cards): **Rowan the Knight** (strong wide swing, one more heart, a bit slow),
  **Fern the Ranger** (fast feet, very quick bonks) and **Pim the Wizard** (zaps from far away, stronger spells).
- **How it plays:** touch where you want to walk (or arrow keys), the star button bonks (Space). Grumpy blobs
  come in groups; a few bonks and one goes dizzy and poofs into sparkles. When a group is gone: GO!
- **Magic potions:** break jars to find blue potions (up to 6). The potion button (X) uses them ALL for one
  spell that fills the screen: 1-2 potions = Magic, 3-4 = Big magic, 5-6 = MEGA MAGIC. Each hero has their own:
  a shower of stars, a whirlwind of leaves, rainbow comets.
- **Baddies:** blobs (walk up and bump), hoppers, rollers (step aside and they get dizzy), mushrooms that lob
  puffballs (a ring shows where one lands), and the **Blob King** at the end of the castle.
- **3 places:** Sunny Meadow, Mushroom Woods, Castle Bridge. A treasure chest waits at the end of each.
- **Gentle:** a bump costs one heart and you blink for a moment. Out of hearts = "Nice try!" and Again starts at
  the SAME group of baddies with full hearts. Apples give hearts back. Little kids bonk by themselves and get more hearts.
- 9 trophies, 4 new stickers (68 now), it joins the Daily Surprise, and `tests/test_quest.py` has a bot win
  every place with a different hero.

**Fishing is a little easier** (Keith): fewer fake nibbles, more time to tap when the fish bites, a bigger green
zone and a gentler pull while reeling, the line takes longer to snap, fish notice the lure sooner, and stars need
fewer points. On the easy places a too-early tap no longer scares the fish; on the middle ones each fish forgives one.

## 2026-11-13 — New game: Putt-Putt Park (mini golf)
Keith asked for a simple putt-putt golf game. It's the 13th game on the arcade's front page (Sports tab).
- **How it plays:** you look down on the hole. Pull back anywhere on the screen and let go, like a
  slingshot: the further you pull, the harder the putt. A dotted line shows where the ball will roll.
  (Keyboard: left / right to aim, hold Space for power.)
- **9 holes**, each with one new thing: Easy Street, The Corner (bounce off the slanted wall), Bumper
  Garden, Sandy Beach, Duck Pond (with a duck), Windmill (turning bars), Slippy Hill, Pipe Dream (the ball
  goes down a pipe to another green) and the Grand Finale (a sliding block and two slanted corners).
  Finish them all and **"All 9 holes"** opens: the whole course in a row with one score at the end.
- **Nobody loses.** Water just pops the ball back where it was. Par or better is 3 stars. Little kids get
  a bigger cup that pulls the ball in, and after 8 putts on a hole the cup starts pulling from far away.
- **Prizes:** 13 trophies (hole in one, bank shot, 4 secret ones) and 6 ball colors to win with stars,
  up to a rainbow ball. 4 new stickers for the Sticker Book (now 64), and it joins the Daily Surprise.
- A bot plays every hole in the new test (`tests/test_golf.py`), plus the pond, the pipe, the whole course,
  the little-kid help and a phone held sideways. All 19 test files pass.

**Also from Keith today** (written down in the roadmap, under Notes from Keith):
the **fishing game** gets worked on next (how it looks + more to do: aquarium, shop, challenges), then a
**Golden Axe-style adventure** with our own heroes (magic potions + pick your hero).

## 2026-11-12 — The coloring book is finished: "Done!", colorable stickers, and an Art Room
The last part of plan point 6.
- **"Done!"**: when a child colors the last part of a picture (the sky can stay white), a big smiling
  star pops up with confetti and a cheer. Two picture buttons: the heart frame **hangs it on the wall**
  (saves it to My pictures), the green tick keeps coloring. It also counts for the "color a picture"
  daily surprise.
- **Colorable stickers**: tap a sticker you placed with a crayon and it takes that color (purple stars,
  blue hearts...). Undo works, and the color is saved.
- **Art Room in My House** (a 4th room, the picture-frame button): your 6 newest pictures from My pictures
  hang in frames on the wall, exactly as you colored them, stickers and all. Empty frames show a soft star
  until you fill them. Things to buy: wall paint, floors, gold / rainbow / starry frames, an easel,
  paint pots, a crayon box and rugs. A friend visiting sees the frames empty (pictures stay on your device).
- Fixed along the way: the confetti on the coloring page used to push the picture off the screen.
- New tests: "Done!" only comes on the last part, the hang-it button saves, sticker coloring + undo,
  every one of the 90 pages draws correctly for the Art Room, and the Art Room shows your pictures.
  All 18 test files pass.

**Next:** plan point 7, one new no-reading game (building blocks, cooking + pet care, or a music maker).

## 2026-11-11 (later) — The banana is a real banana now
Keith said yes to redrawing it. The banana's body is now one smooth curved shape (a single SVG
outline inside the HTML page), so it bends like a real banana instead of looking like a bowl:
pointy brown tip on one end, stem on the other, happy face, cheeks, and a shine to color.
Only the banana uses this trick; every other page is still rounded HTML shapes.
A banana that was already colored in may show its colors on the wrong parts; "start over" fixes it.

## 2026-11-11 — Coloring book: every tab has 30 pages
18 new pages, drawn the simple way Keith asked for (one subject, big rounded shapes, 8-19 parts each,
no suns, no extras). All three tabs are now full: **30 animals, 30 fruit & veggies, 30 things.**
- **Animals (+6):** bee, butterfly, fox (pointy chin + big tail), hedgehog (side view, soft spikes),
  hippo, jellyfish.
- **Fruit & veggies (+5):** potato, half a coconut, cucumber, three blueberries with faces, pomegranate
  (with its little crown). All with happy faces.
- **Things (+7):** police car (lights on the roof), kick scooter, ship, red-barn-style barn with the
  X door, garbage truck, present with a bow and dots, rainbow between two clouds (6 stripes to color).
- I tried a cabbage and a front-facing hedgehog first; both looked like flowers, so they were swapped
  for the pomegranate and the side-view hedgehog.
- Checked every new page blank and colored in, plus the picker on phone and desktop. All 18 test files pass.

**Next:** the rest of plan point 6: a "Done!" celebration when a picture is fully colored,
colorable stickers, and finished pictures hanging on a wall in My House.

## 2026-11-10 (night) — Coloring pages cleaned up
Keith said the pages looked over-complicated, with lines that didn't meet and some funky drawings
(the sheep). I looked at all 72 pages one by one and simplified 23 of them.
- **Redrawn simpler (15):** sheep (now facing you, fluffy and round), bird, giraffe (big head + neck),
  whale, octopus (4 arms instead of 6), crab (round claws), peas, eggplant, airplane, train, kite,
  ice cream (one clean cone), windmill, bicycle (one frame bar), lion (fewer, bigger mane puffs).
- **Clutter taken away (8):** the cat's flower, the dog's collar, eye patch and tongue, the bunny's
  carrot, the tent's campfire, the lighthouse's light beams and birds, the submarine's periscope,
  seaweed and window rings, the ladybug's leaf, the turtle's wide shell rim.
- The busiest page went from 26 parts to 21; most pages now have 8-16 parts.
- New rule for future pages (in `CLAUDE.md`, and checked by the test): one subject, no extras,
  22 parts at most.
- **Lion redrawn again** (Keith: still over-complicated): the mane is now one big circle around the
  face, no tail, 12 parts instead of 21.
- **Not solved:** the banana still looks a bit like a bowl. A real banana curve can't be made from
  rounded HTML shapes; it needs either a different pose or one SVG shape. Keith to decide.
- Pictures already colored on these 23 pages may show colors on the wrong parts (the parts changed);
  "start over" fixes it.

## 2026-11-10 (evening) — 18 new coloring pages
Plan point 6 keeps going: 6 new pages in every tab, drawn the new HTML/CSS way (big rounded
shapes, thick outlines, a sky to color, no suns). Every tab now has 23-25 pages.
- **Animals (now 24):** chick, fluffy sheep, mouse, octopus with bubbles, ladybug on a leaf,
  crab with big claws and eyes on stalks.
- **Fruit & veggies (now 25):** bell pepper, eggplant, radish, peas in a pod (three little
  faces), mango, onion. All with happy faces, like the other fruit.
- **Things (now 23):** bicycle, kite with bows on its tail, umbrella in the rain, ice cream
  cone (waffle pieces to color), cupcake with a striped wrapper, windmill.
- Each page has 10-25 parts to color, none too small for little fingers. Checked every page
  blank and colored in, on desktop and phone.

## 2026-11-10 (later) — Every coloring page redrawn in HTML/CSS
Keith liked the HTML/CSS try-out, so **all 54 coloring pages** are now built that way (no animation,
as Keith asked). Pictures open straight away, finished.
- Same pictures, same 3 tabs (18 animals, 19 fruit & veggies, 17 things), but every page is now
  drawn from simple rounded shapes: smoother outlines, cleaner curves, and the lines are the
  same thickness everywhere, on the big picture and on the little ones in the picker.
- A few pictures got simpler shapes along the way: the house roof, the boat's sails, the castle
  and lighthouse roofs are rounded domes, the tent is a dome tent, the rocket's stars are sparkles,
  the lion's mane is a ring of puffs, the broccoli has 5 bumpy florets (now 11 parts to color).
- Everything else works like before: fill, brush, eraser, stickers, undo/redo, "start over",
  saving, the gallery and the thumbnails.
- **One thing to know:** pictures colored before today keep their brush lines and stickers, but
  their fill colors are cleared (the parts are in a new order, so old colors would land in the
  wrong places).
- New helper for the dev runs: `tools/preview_coloring.py` shows pages blank and colored in.
  `tests/test_coloring.py` now opens and colors **every** page and tries every tool.

## 2026-11-10 — Try-out: coloring pages built from HTML/CSS (demo only)
Keith asked to look at the coloring pages again: built from plain HTML/CSS, simple and clean,
with a staggered build that shows the depth. This is a **separate demo page**, the coloring book
itself hasn't changed: open `coloring/css-demo.html`
(https://lavalynk.github.io/kidsgame/coloring/css-demo.html).
- 6 pictures to judge the style: cat, frog, apple, pumpkin, car, hot-air balloon.
- When a picture opens, **each outline draws itself**, back to front (sky, ground, body, head...).
  Then the white shapes fill in, in the same order, and hide the lines that sit behind them.
  Last, the eyes and smiles pop in. About 4-5 seconds in all.
- Every shape is one HTML tag placed on the same 400 x 400 grid (center, size, rounding, tilt).
  The animation is all CSS: each shape's delay comes from its place in the stack.
- Tap a shape to color it. The round-arrow button plays the build again.
- If Keith likes it, the next step is moving all 54 pages over (fill, brush, stickers and the
  gallery keep working, with brush lines and stickers on a thin layer on top).

## 2026-11-09 (morning) — 18 new coloring pages
Start of plan point 6 (finish the coloring book). Every tab got 6 new hand-drawn pages, same
style as before: thick outlines, big shapes, happy faces on the animals and fruit, no suns.
- **Animals (now 18):** cow (with spots and a bell), frog on a lily pad, monkey, giraffe,
  snail with a ring shell, whale with a water spout.
- **Fruit & veggies (now 19):** peach, kiwi (cut in half, with seeds), avocado (with its big
  seed), mushroom with spots, tomato, pumpkin.
- **Things that go and places (now 17):** hot-air balloon, submarine with round windows,
  digger, lighthouse with light beams, camping tent with a little campfire, dump truck full of sand.
- Every new page was checked blank and colored in, and a few were fixed up (the whale's tail
  was off the edge, a cow spot covered an eye, the submarine's stripe poked out).
- New test: `tests/test_coloring.py` opens every new page, taps it to color it, and checks
  that no page has parts off the edge or too many/too few colorable spots.

## 2026-11-09 — Putting things away in My House
- **Drag a thing off the edge of the room to put it away** (Keith's idea). While you drag
  something, a **toy box** pops up in the bottom corner. Drop the thing on the toy box, or slide it
  right off the edge of the room: it fades, the box wiggles, and *swish*, it's put away.
- It's still yours: tap it in the shop (it has the green tick) to put it back, free.
- Your animal and the RC car can't be put away; they just stop at the edge.
- `tests/test_house.py` checks both ways of putting things away.

## 2026-11-08 (afternoon) — A bigger house: garden, garage, moving things, visiting friends
- **My House has 3 rooms now.** Three big picture buttons at the top switch between them:
  - **Bedroom**: the room you already had (everything you bought is still there).
  - **Garden** (new): sky (blue day, sunset, starry night with a moon, rainbow), ground (grass,
    flowers, sand, snow), a fence or hedge, a tree (apple, blossom, palm), a playhouse / tent /
    doghouse, a swing / slide / trampoline, a pond with a duck / fountain / sandbox, a flower bed
    (tulips, daisies, mushrooms), a garden pet (bunny, chick, tortoise) and a kite, hot-air
    balloon or butterflies in the sky.
  - **Garage** (new): **your Mini RC Racers car is parked in it**, the same car, paint and
    sticker you drive (it changes when you change your car in RC). Put it on a mat, a turntable or
    a golden podium. Also: wall and floor (racing checks, a race track), a roll-up door (or open,
    with a road outside), a tool wall / paint shelf / helmets, tires / toolbox / cones, a flag,
    a race poster or **your best RC cup**, lamps / neon / a disco ball, and a scooter, bike or go-kart.
  - Same rules as before: tap to try something, tap the tick to buy it. Garden and garage
    things cost 1-3 coins.
- **Drag anything anywhere.** Press on a thing in the room (or on your animal, or the car) and
  slide it somewhere else. It stays there. A curly-arrow button in the shop puts it back where it
  started. A quick tap on a thing opens its shop.
- **Visit a friend's house.** The two-people button at the top makes a room or joins one with the
  same 3 pictures as the Friends games. Then tap a friend's animal to walk into their house:
  you see all their rooms (where they put everything, their RC car, their trophies), and your
  animal shows up in their house on their phone too. Tap any animal and it hops on every phone.
  The house button brings you home. You can look but not move their things.
- Small fix: the "My House" sticker now comes from **buying** something, not just opening the house.
- New test: `tests/test_house.py` (rooms, buying, dragging, the RC car in the garage, and two
  phones visiting each other through a local switchboard).
- The switchboard didn't need changing (houses are sent in small pieces).

## 2026-11-08 — The Daily Surprise
- **Every day there's a wrapped present at the top of the arcade** with one small challenge in it,
  shown with pictures: the game's picture + what to do (a finish flag = win, 3 stars, coins, fish,
  3 games, a picture to color) and a big green Play button that goes straight to that game. The
  speaker button reads it out loud ("Collect 30 coins in Turbo Bike!") for kids who can't read yet.
- **Big kids** get things like "win a level in Hoop Heroes", "3 stars in Piano Star", "collect 30
  coins in Turbo Bike", "catch 6 fish", "play 3 different games" or "color a picture".
  **Little kids** (the sprout setting) get gentle ones: "play Space Defender" (winning not needed),
  "collect 10 coins", "catch 3 fish", "play 2 games", "finish a maze".
- Counting challenges show a progress bar on the present ("3 / 6").
- **Finishing it opens the present**: "Surprise! +2" pops up in the game, you get **2 coins for My
  House**, and the **next Surprise sticker** (8 new ones: Present, Cupcake, Party Hat, Ice Cream,
  Kite, Lollipop, Magic Wand, Party Popper). The Sticker Book has a new Surprise page for them,
  so there are now 60 stickers.
- When you open the game that today's surprise is in, a little present pops up to say "Surprise!".
- A new challenge comes at midnight; the same game never comes two days in a row. Each player has
  their own surprise and their own count. Nothing leaves the device.
- New test: `tests/test_daily.py` (really races in RC to finish one, checks coins, stickers,
  counting, little kids, phone sizes and the sticker book).

## 2026-11-07 — Archery with friends (taking turns)
- **Bullseye Adventure now has a Friends button** (the two-people picture on the title menu). One
  phone makes a room, the others tap the same 3 pictures, and the room maker picks a place:
  Sunny Meadow, Sandy Beach (the target slides up and down, a little wind) or Snowy Hills (the
  prize wheel).
- **Everyone takes turns on the same target**, 5 arrows each. When it's your turn your phone says
  **"Your turn!"** and your animal face pops up over Pip; on the other phones the face has little
  "waiting" dots. When a friend shoots, **their arrow flies on every phone** exactly the same way.
- At the top there's a card for each player: their face, their points and their arrows left. Pip's
  outfit and each arrow's feathers are in the shooter's color, so you can see whose arrows are in
  the target (if two friends picked the same color, one gets a different one).
- Balloons and the golden star come back before every turn, so it's fair for everybody. Targets and
  wind are the same size on every phone; little kids still get their long aiming line.
- Most points wins (ties are "A tie!"). "Again" starts a new round for everyone.
- This finishes point 3 of the plan (Friends games: Hoops, Turbo Bike, Bubble School, Fishing, Archery).
- `tests/test_friends.py` now also plays an archery round on two phones and checks both phones see
  the arrows land in the same place and agree on the points.

## 2026-11-06 (morning) — Fishing with friends
- **Fishing Frenzy now has a Friends button** (the two-people picture on the title menu). One phone
  makes a room, the others tap the same 3 pictures, and the room maker picks the place: Sunny Pond,
  Ocean Pier or Icy Lake (all three, even if someone hasn't unlocked them yet).
- Everyone gets **3, 2, 1, GO!** together and fishes for 90 seconds. **The rarest fish wins**
  (more stars wins; if it's the same kind of rare, the bigger fish wins).
- At the top of the screen there's a little card for every player: their animal face, the best fish
  they've caught so far and its stars. The one in the lead gets a gold star. When a friend lands a
  rare, legendary or golden fish, their name pops up ("Mia: LEGENDARY!").
- If you're reeling a fish in when the clock runs out, you get 5 extra seconds to land it. The results
  wait for everyone's last catch, then show each player's best fish, rarest first. "Again" on any phone
  starts a new round for everybody.
- `tests/test_friends.py` now also plays a Fishing round on two phones (the golden fish beats the rare tuna).

## 2026-11-06 (very late) — Smoother Turbo Bike tricks
- **Tricks feel smooth now.** The rider glides into the Superman / No-hands pose and back out
  again instead of snapping, and the bike **floats a little while a trick is going**, so there's
  time to finish it even off a small jump.
- **No more dropping straight to the ground:** pressing Up or Down on the way up a ramp used to
  change lanes right at the lip. Now it saves the trick and does it the moment you fly off. Tiny
  hops over bumps and logs don't start tricks any more.
- **Landing early is never a punishment:** a trick that's nearly done still counts; one that's just
  started simply stops ("Almost!"), with no slow-down and no tumble. The bike straightens itself up
  coming out of a trick so the landing is clean.
- The computer riders are drawn a little see-through and behind your bike, so you can always see
  your own tricks.
- `tests/test_bike.py` checks a trick pressed on the ramp lands with no tumble and no lane change.

## 2026-11-06 (late night) — Turbo Bike: tricks, coins, racers to beat
- **Tricks in the air!** While flying off a jump, press **Up** for a *Superman* (the rider flies out
  behind the bike) or **Down** for *No hands* (arms in the air). The lane buttons do tricks in the air.
  Land after the trick is done for a speed boost, stars and a cheer; you can even do 2 in one jump.
  Land in the middle of a trick and you just wobble (never a tumble).
- **Coins on the track.** Coins float along the path a bike flies off each jump, in a different lane
  each time, plus rows of coins on the flat bits: a reason to change lanes and go for big air. Big
  jumps have a gold star coin (+5). **Every 25 coins = 1 coin for your house** (My House).
- **Three computer riders**, Zip, Moxie and Bolt, race in the other lanes, so every race is a real
  race. Your place shows under the progress bar (1st, 2nd...) and in the results, next to your coins
  and tricks. They wait up a little if you fall behind and push a little if you're way ahead.
- **Feels faster:** speed lines and a little camera shake at top speed, a "whoosh" when the turbo
  kicks in.
- **Gentler, funnier tumbles:** shorter, and the rider pops back up with a hop, a puff of dust and
  "I'm OK!" / "Boing!".
- **Little kids:** the bike always lands flat (no tumbles) and the engine never overheats, on top of
  the bike pedalling itself.
- 2 new trophies: *Trick star* (5 tricks in one race) and *First place* (beat all three riders).
  The how-to pictures show tricks and coins.
- New automated test `tests/test_bike.py`: a bot rides a race doing tricks, and a little kid rides
  holding turbo the whole way without a single tumble.
- The rest of the Turbo Bike plan (10 tracks, a cup, a bike shop, a better builder, daily ghost) is
  on the roadmap.

## 2026-11-06 (tidy-up) — Player badge lines up
- On the game title menus, the little "who's playing" pill (your animal + the sprout for little kids)
  now lines up: both pictures are the same size with the same outline, sit on the same line, and the
  pill has an even edge all round.

## 2026-11-06 (night) — Turbo Bike and Bubble School with friends
- **Turbo Bike races with friends.** Tap the **Friends** picture on the title menu, make a room or
  join one (3 pictures), and the room maker picks one of the 5 tracks. Everyone gets 3, 2, 1, GO!
  together. Each kid starts in their own lane and sees the others riding next to them (in their own
  colors, with their name if they have one), plus a dot for each friend on the progress bar. At the
  finish everyone sees the order with animal faces and times. **Again** starts a new race for all.
- **Bubble School quiz race.** The room maker picks a topic (Count to 5, Count to 10, Letters A-M,
  All the letters, Adding to 10 or Brain buster). Every phone gets **the same question at the same
  time**. Whoever pops the right bubble first gets a star, then everyone moves on to the next question
  together ("Lily ★" pops up when a friend gets it). Kids who answer at almost the same moment both
  get the star. After 10 questions: everyone's stars, biggest first. Wrong answers still just wiggle.
- `tests/test_friends.py` now plays a Bike race and a Bubble School quiz between two phones too.

## 2026-11-06 (evening) — Hoops with friends: 3, 2, 1, GO! together
- Friends games of Hoop Heroes now start with a big **3, 2, 1, GO!** on every phone at the same
  time (with beeps). Nobody can shoot before GO, and everyone's clock starts at GO, so the
  30 or 60 seconds are the same for all players (before, each clock started at that kid's first shot).

## 2026-11-06 (later) — Hoop Heroes with friends
- **Hoop Heroes head-to-head on several phones.** The title menu has a new **Friends** picture
  (two kids). Make a room (3 pictures) or join one, just like RC. The room maker picks **30** or
  **60** seconds and everyone starts. Your friend's score lights up on the big scoreboard where the
  rival's used to be, and you see their basketballs fly into the machine next door.
- At the buzzer everyone sees the scores, biggest first, with each player's animal face.
  **Again** on any phone starts a new game for everyone.
- The Friends lobby is now a shared piece of the arcade kit (`Arcade.net.party` in `arcade/net.js`),
  so the next games (Bubble School, Fishing, Archery) can get Friends quickly.
- `tests/test_friends.py` now also plays a Hoops game between two phones.

## 2026-11-06 — Phones held upright
- **A big "turn me sideways" picture.** On a phone held upright, the wide games (all the arcade
  games) were tiny and their buttons piled on top of each other. Now a big animated picture of a
  phone turning covers the game and **the game waits** until the phone is turned. Menus and title
  screens still work upright; only the playing part asks to turn.
- **Playing upright anyway:** a small phone button under the picture (for phones with the turning
  locked) lets you play upright. Then the on-screen buttons get a little smaller and stack two
  across, so they never overlap, with Gas/Jump in the bottom corner where the thumb rests.
- Checked every game sideways at phone size: everything fits.
- `tests/test_stickers.py` now checks the turn picture, that the game waits, and that no buttons
  overlap upright.

## 2026-11-05 (midnight) — Kids Arcade is a real app now (works offline)
- **Add to Home Screen:** the arcade has its own app icon (the joystick). On Android a grown-up button
  "Add to Home Screen" appears at the bottom of the arcade screen. On iPhone/iPad the same button
  shows the 2 taps to do it in Safari (Share, then "Add to Home Screen").
- **Full screen:** opened from the home-screen icon there's no browser bar, so the games get the
  whole screen (still with the 5% border on phones).
- **Works offline:** the first time the arcade opens with internet, it quietly saves every game on
  the device. After that everything opens with no internet at all (car trips, planes): all 12
  games, the Sticker Book and My House. Only Friends races need the internet.
- **Updates still arrive:** when a new version is pushed, the app downloads it in the background
  and uses it the next time it's opened.
- As an app, it asks the phone not to clear the kids' saves (stickers, house, progress) when it
  tidies up space.
- New automated test `tests/test_offline.py`: saves the offline copy, switches the network off and
  opens every game (and plays a bit of RC).

## 2026-11-05 (very late) — Gentle bumps in Friends races
- Cars on different phones now **bump softly** instead of driving through each other: touch a friend's
  car and both cars slide a little apart with a "bonk" and a few sparkles. Never a crash or a spin.
- Each phone only moves its own car, so nothing jumps around. Ghost, Pogo Spring and Cloud Ride still
  pass right through; a Shield or Super Star means you don't get pushed (and you push a bit harder).

## 2026-11-05 (even later) — Items in Friends races
- **Friends races have gift boxes now**, with all the items from a normal race (no coin bags, since
  there are no coins in Free Play).
- Items reach the other phones:
  - **Bubble** flies at the friend in front of you and floats their car on their phone.
  - **Honey** lands on everyone's track: drive into it and you get stuck.
  - **Party Popper** throws confetti over everyone just ahead, and their cars wobble.
  - **Magnet** pulls you toward the friend in front.
  - Everyone can see your Super Star, Shield, Cloud Ride, Ghost and Pogo Spring jumps on your car.
  - A little tag shows who used what ("Lily: Honey!").
- If two friends picked the same car paint, the friend's car is shown in another color, so you can
  tell them apart.
- `tests/test_friends.py` now also checks that honey and bubbles reach the other phone.

## 2026-11-05 (bedtime) — Friends races are switched on
- Keith put the switchboard online (kids-arcade.lavalynk.workers.dev), so the **Friends** button now
  shows in Mini RC Racers > Free Play on every phone. Make a room on one phone, tap the same 3 pictures
  on the others, pick a track, race!
- If a phone can't reach the switchboard, it says "No connection" and goes back to the Friends screen.

## 2026-11-05 (late night) — Race your friends on other phones (almost ready)
- **Mini RC Racers: Friends races.** In Free Play a third button, **Friends**, sits next to Race and Drive:
  - **Make a room:** your phone shows 3 big pictures (like cat, rocket, banana).
  - **Join:** the other kids tap the same 3 pictures on their phones. Up to 4 players.
  - Everyone's animal shows up in the room. The kid who made the room taps a track and all the
    phones start the race together. Each kid drives on their own phone and sees the others' cars
    on the track, the race-order strip and the map.
  - At the end everyone sees the order with their animal faces and times. **Again** on any
    phone restarts the race for everybody.
  - No computer racers and no gift boxes in a friends race (just you and your friends).
- **The switchboard** that passes the moves between phones is a tiny Cloudflare program in the
  new `server/` folder. It keeps nothing: no names, no logs; a room is forgotten when everyone leaves.
- **One step for Keith:** in the `server` folder, run `npx wrangler deploy` and send me the address
  it prints. Until then the Friends button stays hidden (everything else works as before).
- The "no data collection" rule in the dev notes now spells out this one exception.
- New automated test `tests/test_friends.py`: starts a local switchboard, makes a room on one
  "phone", joins from a second, races both and checks they see each other.

## 2026-11-05 (night) — Sticker Book, My House, picture menus, phone border
- **Sticker Book** (new button on the arcade screen, a red book). 52 stickers to collect: 4 for
  every game plus 4 "arcade" ones. You get them just by playing:
  - round sticker = play the game, square = win a level, flower = 3 stars on a level,
    heart = 3 trophies (or win 5 levels). The coloring book counts finished pictures instead.
  - arcade stickers: play 3 games, play all 12, win 10 trophies, buy something for your house.
  - A "New sticker!" pop-up shows the sticker the moment you earn it. The book button shows a
    pink number for new ones, and new stickers wiggle in the book.
  - Stickers you don't have yet are dotted "?" shapes with a little picture of how to get them.
    Tap one to see it big, with a Play button that goes straight to that game.
  - Every player has their own book. Stickers already earned before today were added right away.
- **My House** (new button, a little yellow house). Each player has a room to decorate, with their
  animal standing in the middle (tap it and it hops).
  - **Every trophy = 1 coin** (the trophy stays in the trophy room). Everyone starts with 3 coins.
    The house button shows your coins.
  - 12 spots: wall paint, floor, bed, rug, curtains, lamp, plant, picture frame, trophy shelf (it
    shows your real trophies), party lights, a pet (fish, kitty or puppy) and a toy.
    36 things to buy, 1-3 coins each.
  - **Try before you buy:** the first tap puts it in the room (wiggling), a green tick appears,
    tap again to buy. Things you own can be swapped any time for free. Not enough coins? A
    picture shows "trophy -> coin".
  - One picture frame shows your newest sticker!
- **Title screens without reading.** "Tap to start!" is now a big green Play button with a little
  tapping hand. The title menu is pictures instead of a list of words: a big Play button, then
  round buttons for New game, Levels, Prizes, Trophies, Help and the Arcade (one short word under
  each). The logos are smaller so everything fits on a phone.
- **Phones use 90% of the screen.** Every page (arcade screen, all games, menus, coloring, maze,
  sticker book, house) keeps a 5% border all round, so nothing sits under rounded corners or the notch.
- **Mini RC Racers:** Candy Raceway has no secret shortcut any more, and the horn is gone (the gift
  button does nothing when you have no gift, like before).
- New automated test `tests/test_stickers.py` (stickers from a real race, the book, the house,
  picture menus in every game, the phone border).

## 2026-11-05 (evening) — Mini RC Racers: smoother steering, slipstream, Free Drive
- **Smoother steering.** The wheels now turn in over a split second instead of all at once,
  so a quick tap is a small nudge and holding the button is a full turn. Letting go
  straightens the car up fast. Much easier to stay on the road with little fingers.
- **Slipstream!** Drive right behind another car and white wind lines appear: you go a bit
  faster. Stay there a moment, then pull out to pass for a **"Slingshot!"** boost.
  The computer racers use it too, so races stay close.
- **Better race feedback:**
  - When your place changes the big number bounces, with a green arrow (moved up) or a soft
    blue one (moved down).
  - A new strip under the map shows the race order as colored dots (yours is the big one),
    so kids can see who is just in front.
  - If the car just ahead of you is off the screen, an arrow in its color at the edge points to it.
- **The rivals have personality:** their names float over their cars before the start, and a
  little speech bubble pops up with a big smile when they pass you, or a surprised "oh!"
  face when you pass them.
- **Horn:** with no gift in your pocket, the gift button honks "beep beep!" (cars nearby look
  surprised).
- **Free Drive** (new): in Free Play there are now two buttons, **Race** and **Drive**.
  Drive = just you on any track, no laps, no rivals, no rush. Find the **12 big stars** around
  the track (one hides on the shortcut). A star arrow at the edge of the screen points to the
  closest one, and the map shows the ones left. Find them all for confetti and a best time.
- Two new pictures in the RC how-to (slipstream and horn).
- New automated test `tests/test_rc.py`: checks the steering, slipstream, rivals' faces, horn,
  the Race/Drive menu, a full race and a whole Free Drive, on a computer screen and a phone.

## 2026-11-05 (later) — Piano Star: 50 new songs, bass clef, a "Hear it" button
- **50 new songs**, so there are **58** now, sorted into Easy, Medium and Tricky. All of them
  are old songs that belong to everyone:
  - **Kids' songs:** Rain Rain Go Away, All My Little Ducklings, The Frog Song, The Alphabet Song,
    Are You Sleeping (Frère Jacques), Big Ben Clock Chimes, Old MacDonald, The Itsy Bitsy Spider,
    Yankee Doodle, Camptown Races, Michael Row the Boat Ashore, The Farmer in the Dell, Three Blind Mice,
    Pop! Goes the Weasel, My Bonnie, Daisy Bell, Clementine, Oh! Susanna, Au Clair de la Lune,
    Aura Lee, Scarborough Fair, My Country 'Tis of Thee, Korobeiniki (the "Tetris" song).
  - **Holiday songs:** Deck the Halls, We Wish You a Merry Christmas, O Christmas Tree,
    Good King Wenceslas, Silent Night, Joy to the World, We Three Kings, Auld Lang Syne.
  - **Famous classical tunes:** Brahms' Lullaby, The Blue Danube, Minuet in G, Für Elise,
    Greensleeves, Eine kleine Nachtmusik, Mozart's 40th Symphony, The Entertainer, The Can-Can.
  - **10 songs in the bass clef** (their own section, "low notes"): Baa Baa Black Sheep,
    This Old Man, Lightly Row, Go Tell Aunt Rhody, Kumbaya, When the Saints Go Marching In,
    Going Home, Pachelbel's Canon, In the Hall of the Mountain King and Beethoven's Fifth.
    These show a real bass clef, and the piano moves down to the low notes (the C below middle C
    up to the G above it). The keys keep the same colors and letters.
- Some songs have little black-key notes now (Für Elise, Minuet in G, Greensleeves, The Entertainer...),
  drawn with a # sign on the staff.
- **No more replay at the end.** When you finish a song you go straight to the stars. A pink
  **"Hear it"** button there plays the whole song on the piano. Tap it again to stop.
- The song list is big enough for little fingers: it scrolls up and down instead of shrinking
  58 songs onto one screen.
- The songs now live in their own file, `piano/songs.js`, written in the same simple note code.
- `tests/test_piano.py` now checks every song: the notes are written correctly, every note is on
  the piano, the words line up with the notes, and 10 songs are bass clef. A bot plays all 58 to the end.

## 2026-11-05 — New game: Piano Star
- A **12th game** on the arcade (under the Calm tab): a colorful piano with **real sheet music**
  above it. Pick a song, and the notes scroll along a staff with a treble clef, bar lines,
  half notes, eighth notes and dotted notes, just like a music book.
- **Play note by note:** the next note glows; tap that key. Every note has a color (C red,
  D orange, E yellow, F green, G sky blue, A blue, B purple) and the keys wear the same colors
  and letters, so kids who can't read yet can still follow along. Under each note: its letter
  and the word you'd sing.
- **No rush, no losing.** Right first time = 100 points plus a streak bonus. A wrong key just
  plays its own note and the right key lights up with a gold ring.
- **8 songs**, easiest first: Hot Cross Buns, Mary Had a Little Lamb, Twinkle Twinkle Little Star,
  London Bridge, Jingle Bells, Ode to Joy, Row Row Row Your Boat and Happy Birthday (it sings
  "Happy birthday dear *(the player's name)*" when the player has a name).
  The first 3 songs show the colors and light up every key. The middle 3 are Normal: the key lights
  up after one wrong try. The last 2 are Challenge: the letters are hidden and the key lights up
  after two wrong tries. Little kids always get the easiest help.
- **Listen button** (speaker, top left) plays the song first so you know how it goes.
- When you finish: confetti, then the piano **plays your whole song back** in rhythm, then stars
  and a medal for how many notes were right first time.
- **Free Play:** a plain piano; the notes you play get written on the staff.
- On a computer you can also press the letter keys C D E F G A B.
- 7 trophies (first song, perfect song, 20 in a row, Happy Birthday, every song, little composer,
  and a secret one).
- New automated test `tests/test_piano.py`: a bot plays all 8 songs (tapping the real keys for the
  first one), checks the listen button, the wrong-key hint, the replay, the results and Free Play.

## 2026-11-04 (later) — Music on the arcade screen, easy-to-find Little kid button
- The arcade's main screen now has its **own song**: a bouncy marimba tune that starts as soon
  as you tap anything (browsers won't play sound before the first tap). Each player's music
  switch still turns it off.
- The song now starts **right away** on the first tap: straight into the tune (no quiet
  drum intro) with a quick fade in. iPhones and iPads needed the end of a tap before
  they'd allow sound, so it now listens for that too.
- **Little kid mode is now right on the main screen**: a new round button next to the music
  button. It shows a tall kid (Big) or a little kid with a sprout (Little), and one tap switches
  the player who's playing. (It's still in the player editor too.)
- Fixed: the little pop-up messages on the main screen ("Hi Mia!") had white words on white,
  so you couldn't read them. They're dark now.

## 2026-11-04 — Little kid / Big kid setting for each player
- When you make or change a player (tap the pencil on "Who's playing?"), there are now two
  big buttons: **Little (3-5)** and **Big (6+)**. Everyone starts on Big, which plays exactly
  like before.
- A **Little** player gets a small sprout badge on their picture (on the hub and in each game's
  menu) so grown-ups can see the gentle setting is on. For them:
  - **Every game is on Easy**, even the later levels that would normally get harder.
  - **Racing and action games run a bit slower** (Turbo Bike and Space Defender 20% slower,
    RC Racers, Jungle Jump and Treasure Trail 15% slower), so there's more time to react.
  - **Mini RC Racers:** the car drives forward by itself and eases off before sharp bends, so
    little ones only have to steer. If they wander off the road, a strong helping hand steers
    them back. The computer racers are a little slower and wait up if they get far ahead.
  - **Turbo Bike:** the bike pedals by itself (they steer, jump and use turbo), landings are
    extra forgiving and the engine heats up slower.
  - **Space Defender:** 2 extra lives on top of Easy's.
- New automated test `tests/test_age.py` checks the buttons and badges on computer and phone
  sizes, and plays the games as a little kid and a big kid (in RC a little kid who presses
  nothing at all still makes it round the track). All the older tests still pass.

## 2026-11-03 — A better arcade hub: game tabs, "play again", phone layout
- **Picture tabs** above the games: **All**, **Race** (checkered flag: Turbo Bike, RC Racers),
  **Action** (rocket: Jungle Jump, Treasure Trail, Space Defender), **Sports** (ball: Hoop Heroes,
  Bullseye, Fishing) and **Calm** (crayon: Bubble School, Coloring Book, Maze). One tap shows
  just those games. Each player's hub remembers which tab they had open.
- A **Faves** tab (pink heart) shows up as soon as a player hearts a game, and quietly goes
  away again if they un-heart everything.
- **"Play again" row:** a clock and big round buttons for the last 3 games this player
  opened, newest first. One tap jumps straight back in. Every player has their own.
- **Better on phones:** the game boxes are now two side by side (it was one per row, so
  kids had to scroll a long way), with a smaller logo at the top. Turned sideways, a phone
  shows four boxes across. The tabs always fit on one row. Tablets and computers look the same as before.
- New automated test `tests/test_hub.py` checks the tabs, the Faves tab, the play-again
  row (separate per player), button sizes and that nothing sticks out sideways on a phone,
  at computer, phone (both ways up) and tablet sizes. All the older tests still pass.

## 2026-11-02 (late night) — Space Defender overhaul: 10 sectors, 20 weapons, the Chimera
- **10 sectors** now (it was 3), each about 1–2 minutes: waves of enemies → a **mini boss**
  → more waves → a **big boss**. Sectors: Moon Base, Candy Nebula, Ring Planet, Comet
  Freeze, Jungle Planet, Lava Moon, Crystal Caves, Storm Giant, Neon City and the Edge of
  the Void. Each one has its own look (snow, a lava sea, crystal spikes, a neon grid...).
- **20 special weapons.** A friendly gift saucer flies by carrying a present: bubble it
  (or bump into it) and grab the capsule, and your gun turns into that weapon. Mini
  bosses always drop one too. Grab the same weapon again and it powers up (up to level 3).
  New sectors bring new weapons, so you find more as you go: Twin Bubbles, Triple
  Spread, Wide Fan, Rainbow Beam, Homing Hearts, Bouncy Balls, Laser Line, Star Spinner
  (stars circle your ship and block bubbles), Big Bubble, Rapid Fire, Cross Shot, Wiggle
  Wave, Boomerang, Lightning Zap, Rocket Pops, Snowflake Freezer (slows enemies), Ring
  Pulse, Petal Storm, Drone Buddies and Sonic Boom.
- **Weapon Book** in the Unlocks menu: every weapon you've found (a "?" for the rest).
- **10 mini bosses** (giant enemies wearing a crown, captain's hat, sunglasses, a bow,
  a top hat...) and **10 big bosses**, 7 of them new: Frosty the Snow Satellite,
  Professor Octo, Magma Mole, the Prism Queen, Thunder Whale, Mecha Kitty and the
  Twin-Moon Guardian.
- **The final battle: CHIMERA, THE EATER OF WORLDS.** A huge beast made of night sky:
  a lion head with a mane of star-fire and horns, a ram-horned goat head, a serpent for
  a tail and great bat wings. It eats a planet when it arrives! You pick one of three
  weapons, then calm each part in turn:
  1. the Lion (star-fire breath, a roar that shakes the screen),
  2. the Goat (lightning bolts, homing orbs),
  3. the Serpent (it lunges across the screen),
  4. the Eater of Worlds (it breathes in and pulls you toward its mouth: fly away, and
     bubble the mouth while it's open for double damage).
  Every attack is warned first (a flashing "!" and a yellow stripe). When it's beaten
  it turns into a constellation and the planets it ate pop back out.
  It looks fierce, but nothing is scary: beaten parts just go calm and starry.
- **Kind to little pilots:** sectors 1–3 play on Easy; after the mini boss there's a
  **checkpoint** ("Nice try!" offers to carry on from there), each Chimera part is a
  checkpoint, and a boss that's taken too long "gets tired" so fights never drag on.
- **New music:** 5 new hand-written songs (comet, lava, crystal, neon), a boss song for
  every big boss, and an epic Chimera battle song.
- Endless mode now cycles through all 10 places and all 20 bosses.
- New automated test `tests/test_space.py`: a bot plays all 10 sectors and the Chimera
  start to finish, checks each sector takes 1–2 minutes, tries all 20 weapons, and checks
  the checkpoint.

## 2026-11-02 (night) — Big music upgrade: real tunes, music that follows the game
- **Every song has a real, hand-written tune now** (32 songs: every game, every world,
  all 10 RC tracks and every title menu). Before, the computer made up the melodies;
  now each one has a catchy verse, a chorus that lifts, and a middle part.
- **Songs are longer and change as they go.** Each song plays like a real one: a short
  intro, verses, choruses with a harmony voice, a calmer middle part, a quiet "breakdown",
  and a last chorus that jumps up a key. It takes about 1½–2½ minutes before it repeats
  (it used to loop every half a minute).
- **Music that follows the game:**
  - Mini RC Racers: quiet music during "3, 2, 1", the band comes in at "Go!", all-out
    music while boosting or with a super star, a brass "ta-daa" and a key change when
    you take the lead, and the music speeds up on the last lap.
  - Turbo Bike: all-out music on turbo; calm while the engine cools down or after a crash.
  - Jungle Jump: a twinkly jingle when you find the treasure or every star; the music
    goes soft and muffled inside secret rooms.
  - Treasure Trail: treasure jingle; the music sounds far away down in the tunnels.
  - Bubble School: calm to start, and it gets brighter with every right answer in a row
    (with a little run of notes every 3). A wrong answer just makes it calm again.
  - Space Defender: a big "dun-dun-dun-DUNN" and a heavier beat when the boss arrives.
  - Hoop Heroes: all-out music when you're on fire. Fishing Frenzy: quiet while you wait
    for a nibble, exciting while you reel, a jingle when you catch one.
- **Smooth changes:** the menu song fades into the level song, every level starts with a
  short "get ready" drum roll and "da-da-DAA!" (not in RC, which has its own countdown,
  or Bubble School, which reads the question), pausing fades the music out and it picks
  up where it left off, and finishing a level plays one last big chord instead of
  cutting off.
- **New instruments:** steel drum (beach), marimba (jungle, autumn), "oooh" choir voices
  (space, snow, moonlight), ukulele (fishing), whistling (Bubble School, fishing) and a
  silly kazoo (Bubble School menu, candy levels).
- **Music switch for each player:** a big music button next to the player on the arcade
  home screen, and a "Music on/off" button in every pause menu. Each player keeps their
  own music setting and volume; sound effects stay shared.
- New automated tests: `tests/test_tunes.py` (every tune fits its chords and stays on
  the beat), `tests/test_music.py` (records every song and instrument and checks they
  really play, plus mood, pause, ending and the music switch) and
  `tests/test_rc_music.py` (drives a whole RC race and checks the music follows it).

## 2026-11-02 (evening) — No more accidental menu presses
- **After tapping "Tap to start!", the menu ignores taps for half a second** in every
  game. Before, the same tap (or a quick second one) could land on a menu button that
  had just appeared under a finger and start something by accident. Keys are ignored
  for that half second too.
- New automated test (`tests/test_tapguard.py`) checks this in Turbo Bike, Bubble
  School, Hoop Heroes and Mini RC Racers.

## 2026-11-02 (later) — Bubble School: calm, smooth bubbles
- **The bubbles stay put now.** Each answer bubble has its own spot and just bobs a
  little, so nothing floats off the top and jumps back in from the bottom anymore.
- **Smooth change between questions:** pop the right bubble and the other bubbles
  float up and fade away, the question card fades out, then the new question pops in
  and the new bubbles grow in one after another with a little "boing".
- Wrong bubbles still just wiggle ("Try again!").
- The golden starfish bonus bubble now drifts slowly along the sand under the answers,
  so it never covers a bubble, and a tap near both always picks the answer bubble.
- New automated test (`tests/test_abc.py`) plays a whole level on desktop and phone
  sizes and checks that the bubbles stay on screen.

## 2026-11-02 — Players: every kid gets their own saves
- **A "who's playing?" button** sits under the Kids Arcade logo. Tap it to see every
  player as a big animal face, tap a face to switch.
- **Make a player with the + button:** pick one of 8 animals (cat, dog, bunny, frog,
  chick, fox, mouse, owl), a color, and type a name if you like (names are optional,
  so little ones can just use their animal).
- **Each player has their own everything:** medals, stars, trophies, unlocks, the RC
  garage and coins, coloring pictures and gallery, maze progress and difficulty.
  Sound volume stays the same for everyone.
- **All the progress from before belongs to the first player** (the orange cat), so
  nothing was lost.
- **Favorites:** every game box has a heart. Tap it and that game jumps to the front
  for that player.
- When more than one player is set up, the arcade asks "Who's playing?" when it opens,
  and each game's menu shows the player's face next to the trophies.
- **Changing or removing players:** tap the pencil, then a face. The bin deletes a
  player and their saves — it needs two taps (it turns red first) so it can't happen
  by accident.
- New automated test (`tests/test_players.py`) checks all of this on desktop and
  phone sizes.

## 2026-11-03 (evening) — Better music and sound effects (every game)
- **The music sounds like a real band now** (the music box inside the games got an
  upgrade):
  - A "room" reverb, so it's warm instead of beepy, and the band is spread out left
    and right (hats on one side, shaker on the other, sparkles bouncing around).
  - New instruments: a breathy **flute**, a twinkly **music-box bell** and bright
    **brass**, and the old square and saw leads sound smoother.
  - Punchier kick drum, drum fills on toms at the end of each part, and a cymbal
    crash when the chorus starts.
  - In the chorus a second voice sings along a little lower (a harmony). In the last
    verse a bell plays the tune up high.
- **Jungle Jump and Treasure Trail songs use the new instruments:**
  - Jungle Jump: jungle flute in the forest, twinkly bells in the crystal cave, flute
    and bells in the snow, jungle brass on the title screen.
  - Treasure Trail: flute and brass for the adventure, brass on the title screen.
- **Every sound effect was rebuilt with layers:**
  - Coins ring, stars twinkle up, bubbles pop.
  - Springs go "boing", bonks wobble, splashes have little droplets, and whooshes
    swoop.
  - Winning plays a little fanfare with a drum hit, and losing plays a soft "wah wah
    wahhh".
  - New sounds: a soft thump when you land from a jump, and an "ouch" when you lose
    a heart (Jungle Jump and Treasure Trail).
- Sound effects are a bit louder next to the music, and there's a limiter so nothing
  ever crackles.

## 2026-11-03 (later) — Animated sprites, and Treasure Trail hearts count now
- **Treasure Trail: you can lose hearts now.** Falling in the water or quicksand
  costs a heart, and so does getting bumped by a log, a snake or a bat. You blink for
  a moment after a hit, the screen edges flash red and the hearts shake.
  - Early adventures (5 hearts, endless tries): run out of hearts and you go back to
    the start of the adventure. Treasures you already found stay found.
  - Later adventures: running out of hearts uses up a try. When there are no tries
    left it's "Nice try!", and Again starts in that same room.
- **Jungle Jump sprites:**
  - All 5 heroes have real running animation, plus jump, fall, glide and hurt poses.
    They breathe, blink, and their tails sway. Rolling is a spinning ball with speed
    lines.
  - Each world has its own animated critter: a spotted bug, a glowing firefly, a
    snowball in a scarf, a gummy blob. They waddle, blink and squash when you bounce
    on them.
  - Goodies bob and sparkle, and the chest pops open with coins.
- **Treasure Trail sprites:**
  - The explorer runs with swinging arms and legs, holds the vine with both hands,
    climbs ladders hand over hand, flails when bumped, and sinks with ripples (the
    hat stays floating!).
  - All the hats are more detailed, and the parrot sits on your hat and flaps.
  - Hippos blink, wiggle their ears and yawn. Snakes wake up and flick their tongue.
    Logs roll, and bats flap.

## 2026-11-03 — Jungle Jump and Treasure Trail get a 16-bit (SNES-style) look
- **Treasure Trail:**
  - Layered jungle backgrounds that slide at different speeds as you walk: a glowing
    sky, hazy mountains (a far-off temple in Lost Temple and Sunset Swamp), shaded
    tree trunks, puffy leaf clusters and hanging vines, plus ferns swaying in the
    front corners.
  - Shaded dirt with pebbles and roots; grass with tufts and little flowers.
  - Ponds with light rays and sparkles; textured quicksand; a brick tunnel with
    flickering torches.
  - Shaded hippos, snakes, logs and bats, a twisted leafy vine, a striped tent with
    a glowing campfire, a more detailed explorer and soft shadows under everyone.
    The treasure has turning light rays and sparkles.
- **Jungle Jump (all 4 worlds):** the same kind of layered backgrounds, built for
  each world:
  - forest: misty hills and leafy trees
  - cave: stalactites, rock pillars and crystals
  - snow: big snowy mountains and snowy pines
  - candy: cotton-candy hills, lollipops and candy canes
  Plus front-corner ferns, crystals, snow drifts or gumdrops. The ground has more
  shading, little details for each world, and soft shadows under ledges. The hero,
  critters, boulders, chests, springs and the balloon are shaded and shiny.
- Gameplay is exactly the same: the test bot still finishes every world.

## 2026-11-02 (bedtime) — Results you can read with your eyes
- **RC Racers race results are pictures now:** the top 3 cars stand on a podium
  (1, 2, 3), a "You!" tag shows which one is you, your car and place show underneath
  if you came 4th or lower, a big coin shows what you won, and a row of flags shows
  the races in the cup (checkered = done). No more lines of text.
- **Hoop Heroes and Bubble School results** use pictures with numbers: your rival's
  face and their score, a net with baskets made, a flame for your best streak, a "3"
  coin for bonus 3-pointers, a green tick for right answers, a golden star.
- (For the other games: any result can now be "picture + number", so they can switch
  over too.)

## 2026-11-02 (late) — A new look for the arcade hub
- The front page is now a dark arcade room with twinkly dots. The **Kids Arcade logo**
  is drawn in the same style as the game logos (a joystick badge and big 3D letters),
  with a rainbow neon line underneath.
- Every game card is now a **game box**: the game's round badge picture in front of
  spinning light rays in the game's color. On hover the rays spin faster, the badge
  tilts and the card glows. Each card has a number medallion, the name in the chunky
  font and a big Play button. The last row of cards is centered.
- The round badge pictures now live in one shared file, so the hub and the title
  screens always match. There are new badges for RC Racers, the Coloring Book, the
  Maze and Bubble School.

## 2026-11-02 (night) — New game: Bubble School (ABC 123)
- **Bubble School** is a new learning game. Ollie the octopus teacher asks a question
  and **reads it out loud**, so kids who can't read yet can play too. Tap the question
  to hear it again. Answer bubbles float up from the sea floor: pop the right one!
  A wrong bubble just wobbles ("Try again!"). There's no losing.
- **13 lessons that build up:** count to 5, letters A–E, count to 10, letters A–M,
  adding to 5, all the letters, first letters ("dog" → D, with a picture), taking
  away, adding to 10, big and little letters (b → B), take away to 10, spell it
  (C _ T), and a Brain Buster mix. The sums show dots to count on.
- 10 questions per lesson, with stars for getting them right the first time. Golden
  starfish bubbles float by for bonus points.
- **Sea friends to unlock** (crab, turtle, seahorse, jellyfish, whale, starfish,
  narwhal). They swim around in the background once you've earned them.
- Trophies, including two secrets. Tickle Ollie! There's a Voice on/off switch in
  Unlocks.
- On a keyboard you can also type the answer.
- The "New unlock!" pop-up now shows a gift instead of a lock.

## 2026-11-02 (evening) — Brand-new game logos
- Every arcade game has a new title-screen logo, like a real game box: a round badge
  with a fresh hand-drawn picture (a flaming hoop, an arrow in the bullseye, a monkey
  on a vine, an open treasure chest, a rocket, a jumping fish, a bike doing a wheelie)
  in front of a slowly spinning starburst. The name sits under it in big chunky 3D
  letters.
- New chunky font (Lilita One, free to use) for the logos, the menu words, panel titles
  and the results banner. It's stored inside the game, so it works offline too.

## 2026-11-02 (later) — Title → menu, games ramp up, cooler results and Hoop Heroes balls
- **Title screen first:** the logo and "Tap to start" (any key works). Then the menu.
- **Menu:** CONTINUE comes first once you've played, then **NEW GAME** (always there).
  New Game asks first, then starts again from level 1. Trophies and unlocks are kept.
- **No more difficulty picker.** Games get harder as you go instead: the first third of
  the levels play easy, the middle normal, and the last third challenge.
- **Cooler menus and results:** dark arcade-cabinet panels with a ring of blinking
  bulbs. The results screen has a ribbon banner, big glowing stars that "ding" as they
  land, the score counting up like an arcade machine, a bouncing NEW BEST! badge, and
  the game's facts as little chips.
- **Hoop Heroes balls:** 10 basketballs in different colors, one for beating each
  rival: Fire Red, Ice Blue, Neon Green, Hot Pink, Retro (red/white/blue), Galaxy,
  Lava, Golden, and Rainbow for 3 stars on everyone. The special ones leave a trail
  when you shoot: ice sparkles, neon glow, hearts, stars, lava embers, gold sparkles,
  rainbow. Pick yours from a wooden ball rack, with a big spinning preview.
- **New Hoop Heroes backboard:** a blue printed board with the HOOP HEROES logo, light
  rays, a faint basketball, a white shooter's square and chasing LED bulbs. It turns
  red-hot when you're on fire and shows "3 POINTS!" during the bonus.

## 2026-11-02 — Old-school title menus, and everything fits on phones
- **NES-style title screen in every arcade game** (all but RC Racers, which keeps its own
  menus). The logo has a short list next to it: START (or CONTINUE), LEVELS, UNLOCKS,
  TROPHIES, HELP, the difficulty (tap it to switch Easy / Normal / Challenge) and
  ARCADE. A blinking yellow arrow shows what's picked. Tap an option, or use Up/Down
  and Enter on a keyboard.
- **No more pop-ups in your face.** START goes straight into the game. The how-to
  pictures only show when you pick HELP.
- **Menus fit on phones.** On a short screen (a phone held sideways) the menus use
  tighter spacing, and any menu that's still too big shrinks to fit instead of being
  cut off. This works in every arcade game.
- **Hoop Heroes fills a wide phone screen** edge to edge, with no empty bars on the
  sides. You see a bit more of the machines next door.

## 2026-11-01 — Hoop Heroes is now a real pop-a-shot machine
- **First-person view:** you stand right at the machine, like at the arcade. The ball
  is in your hands, the wire cage arches over the wood ramp, and the hoop sits on a
  lit-up backboard.
- **Pull back and let go** to shoot (drag down, then release; pull further for a longer
  shot, pull to the side to aim). On a keyboard: arrows to aim, hold Space for the
  power bar.
- **Beat the clock and beat your rival.** A big scoreboard shows YOU, TIME and your
  rival. Rivals on the machine next to you shoot along with you. Beat 8 rivals in a
  row, from Ruby Rookie up to The Champ. Some of them have a hoop that slides side
  to side.
- **ON FIRE:** make 3 in a row and the net bursts into flames (the hoop gets a little
  bigger, too) until you miss.
- **3-point bonus:** in the last 10 seconds the hoop slides back and every basket is
  worth 3. A shot that drops after the buzzer still counts (secret trophy!).
- **A fancier arcade:** the machine has a lit-up
  marquee scoreboard with chasing bulbs, a glossy backboard, a court painted on the
  wood ramp, metal cage tubes and a blue cabinet, with soft neon lights behind.
  Identical machines stand on each side, partly in view: a kid shooting for fun on
  the left and your rival on the right. You can watch their shots go in (or miss).
- **Unlockable balls** (beach ball, melon, star, rainbow, golden), a High Score mode,
  and new trophies: From Downtown, Point Machine, Champion, Buzzer Beater...

## 2026-11-01 — Every arcade game plays like a video game now
- **Title screens for every arcade game**, each with its own logo (the game's picture
  plus its name in big chunky letters). Tap anywhere to start.
- **One big START button** instead of a page full of choices. It **continues where you
  left off**: the first level you haven't beaten yet. Once everything is beaten it says
  "Play again" and picks the level you have the fewest stars on.
  - The very first time you press Start, the how-to-play pictures show first.
  - Everything else is tucked into small buttons under Start: **Levels** (replay any
    level), **Unlocks** (heroes, bikes, balls, hats, ships...), **Trophies**, **Help**
    and **Arcade**. Easy / Normal / Challenge sits under those.
- **Trophies in every game**, about 6 to 9 each, and **some of them are secret** (they
  show "???" until you earn them). A pop-up tells you when you win one. Examples: Bike
  "Hot hot hot!" (overheat 3 times in a race), Hoops "Brick wall" (miss every shot),
  Jungle "Gentle giant" (finish without booping anyone), Treasure Trail "Dry socks"
  (never fall in).
- **Treasure Trail unlocks:** 5 hats for your explorer (safari, pirate, cowboy, flower
  crown, golden crown) and a **parrot friend** that flies along with you.
- **Every game has its own music now**, plus a separate title-screen song: punk-rock
  biking, laid-back basketball beats, folk / surf / snowy-bells songs for the 3 archery
  places, a different song for each Jungle Jump world, jungle drums for Treasure Trail,
  synth for space and a breezy ukulele-style song for fishing.
- RC Racers is unchanged.

## 2026-11-01 — Snappier jumping (all arcade games)
- **Fixed jump presses sometimes being ignored.** On fast screens (120 Hz phones and
  tablets, gaming monitors) a quick tap could be forgotten before the game looked at
  it, so jumping while running (Right + Up) sometimes did nothing. Every tap is
  now noticed, in **all** the arcade games.
- **Treasure Trail jumps are more forgiving:**
  - Pressing jump just before you land still jumps the moment you touch down.
  - You can still jump for a split second after running off an edge.

## 2026-11-01 — New game: Treasure Trail
- A **10th game** on the arcade page: **Treasure Trail**, a jungle-explorer adventure.
  You play a kid explorer in a big safari hat and run from screen to screen through
  the jungle.
  - **Swing on vines** over ponds: jump to grab, jump again to let go.
  - **Hop across hippos' backs.** They sometimes dip under the water (not on Easy).
  - **Quicksand** opens and closes: wait for it to close, or swing over it.
  - **Rolling logs** and **sleepy snakes** to jump over. They only bump you back,
    they never cost a heart.
  - **Trapdoors** with ladders down to a **tunnel** where treasure is hidden (watch
    for the friendly bat).
  - Collect the **treasures** (gems, crowns, coin bags, gold bars, rings), then reach
    the **camp** with the tent and campfire.
- **4 adventures:** River Run, Deep Jungle, Lost Temple and Sunset Swamp. Each one
  unlocks the next. Gold medal = all the treasure.
- Falling in the water or quicksand costs a heart and puts you back at the start of
  that room. On Easy you never lose hearts.
- It has its own jungle-drum song. The dots in the top corner show which room you're
  in and which rooms still hide treasure.

## 2026-11-01 — Jungle Jump gets its own style
- To make Jungle Jump feel less like other famous platformers:
  - **Leaf glide:** keep holding jump while falling and your hero holds up a big leaf
    and floats down slowly.
  - **Roll:** a new **roll button** (X key, or Down while running) curls you into a
    ball that tumbles forward. Rolling **smashes cracked boulders** and **boops
    critters** into sparkles. You get one roll in the air per jump, too.
  - **Critters are now bouncy** round pom-pom bugs with springy antennae. Landing on one
    just bounces you up ("Boing!"); only rolling into them boops them.
  - **Blocks you hit with your head are gone.** In their place are cracked boulders that
    you roll into.
  - Each world has **its own goodies**: berries (Forest), gems (Cave), snowflakes
    (Snow) and wrapped sweets (Candy).
  - **Checkpoints are lanterns** that light up and glow.
  - **The goal is a striped hot-air balloon.** Hop in and it floats away with you.
  - The how-to-play pictures show the new moves.
- All 4 worlds were re-tested with the play-bot and can still be finished.

## 2026-11-01 — RC: fair special cars, an easier Snowy shortcut, normal-size map
- **Fair's fair:** when you drive any special car (anything but the plain Zoomer), every
  rival gets a **random special car** too, with its special power. Rival Zoomers even
  rocket-start. In a plain Zoomer, the rivals drive plain Zoomers.
- **Snowy Park's secret path moved** to somewhere much easier to find: a straight run
  down the open snowy field on the left, from the left side of the track down to the
  bottom straight. It starts with a gentle turn off the road and saves a big chunk of
  the lap. (The old one was squeezed inside a hairpin.)
- The **mini-map is back to its old size**.

## 2026-11-01 — RC: bigger tracks, about 20 seconds a lap
- **Every track is bigger**, sized so a lap takes about **20 seconds**. With a
  fully upgraded car laps take 18 to 21 seconds; a brand-new Grand Prix car takes a bit
  longer. A 3-lap race is now about a minute.
  - Backyard Loop more than doubled, Sunny Beach is almost twice as big, and the others
    grew 10 to 70%.
  - Cloud Castle was the one track that was too long, so it shrank a little.
  - Candy Raceway was already right.
- Longer tracks get **more gift-box rows** (at least one every ~2700 px), a few more
  oil and puddle spots, and extra boost pads and ramps.
- Because the tracks changed shape, old **Time Trial ghosts and best times were
  cleared** (once) so they match the new tracks.
- Mini Cup prize coins now go by race number (1st, 2nd, 3rd race) instead of which
  track came up, so a random late track doesn't give a huge prize.

## 2026-11-01 — RC: a secret path on every track, 5 new items, creeks, jumps and boost lanes
- **Every track now has a hidden shortcut** (all 10). New ones on Backyard Loop, Desert
  Dunes, Candy Raceway, Moonlight Speedway and Cloud Castle (over the castle wall!).
  - A bobbing **yellow arrow sign** on the grass points the way in.
  - Shortcuts now curve gently off the road instead of needing a sharp turn, and they
    are wider.
  - **Snowy Park's icy shortcut was much too hard.** It now has a gentle way in, and the
    ice is half as slippery.
- **5 new items** (12 in all):
  - **Pogo Spring** (common): a big boing over everything
  - **Ghost** (common): you go see-through and drive right through cars and oil
  - **Magnet** (uncommon): pulls you toward the car in front
  - **Party Popper** (uncommon): confetti over the cars ahead makes them wobble
  - **Rainbow Warp** (rare, 3%): zip forward along the road
- **More to jump and zoom on:**
  - From track 2 on, every track has a **creek across the road** with a wooden **jump
    ramp** just before it. Fly over it, or splash through and slow down. Each track has
    its own kind: water, slush, quicksand, chocolate, moon dust, lava ("Hot hot!"), a
    jungle river and a cloud gap.
  - **More boost pads and ramps** (up to 9 on the later tracks).
  - Long **boost lanes** of flashing arrows along one side of the road on the later
    tracks.
- **Bigger mini-map** (about 40% larger) in the corner, with the shortcuts showing more
  clearly.

## 2026-11-01 — RC: menus shrink to fit phones
- Every RC menu (main menu, garage, results, cup podium, pause...) is now drawn at one
  size and **shrinks as a whole to fit the screen**. On a phone everything gets a bit
  smaller but nothing is cut off and nothing scrolls.
- The on-screen driving buttons hide while a menu is open, so they don't cover it.

## 2026-11-01 — RC: random Mini Cup, a podium for cup winners
- **The Mini Cup now picks 3 random tracks in a random order** every time you start
  one, so every Mini Cup is different. The rivals get a little faster each race,
  whatever the track.
- **New cup finish screen** (Mini Cup and Grand Prix): a big trophy in your color
  (gold, silver or bronze) with spinning light rays and twinkles, and the **top 3 cars
  standing on a podium**. The cars pop up one by one, the winner bounces, and your car
  wears a "You!" tag. 4th place is listed underneath.

## 2026-11-01 — RC: music on the title screen
- The upbeat menu song now starts on the **title screen** and keeps playing into the
  menus without restarting.
- Most browsers don't allow sound until you tap or press a key. When that happens, a
  bouncing yellow **music note button** appears in the top-right corner: tap it to start
  the music and stay on the title screen. Tapping anywhere else starts the game (and the
  music) as before.

## 2026-11-01 — RC: shortcuts, moving obstacles, night lights, Mini Cup and more
- **3 new hidden dirt shortcuts** on **Autumn Woods**, **Volcano Valley** and **Jungle
  Rally**. That's 5 tracks with a shortcut now. The computer racers find them too!
- **Moving obstacles** (gentle: they only make you wobble and slow down a little, never
  crash or spin you):
  - rolling **snowballs** on Snowy Park
  - scuttling **crabs** on Sunny Beach
  - bouncing **gumdrops** on Candy Raceway (drive under them while they're up high!)
  - **steam vents** on Volcano Valley that puff every few seconds, with little wisps
    as a warning
  - a shield protects you from all of them
- **Night lights on Moonlight Speedway:** the track is darker, every car has glowing
  headlights that light up the road ahead, and red tail lights.
- **Rival personalities:** Grape loves bubbles, Mango loves boosts, Sky loves clouds,
  Lime loves honey, and Bubblegum drives carefully (fewer wobbles, slower in bends). When
  a rival uses an item you can see, a name tag pops up ("Grape: Bubble!").
- **Mini Cup:** the first 3 tracks, about 5 minutes, with its own trophy. The menu's
  trophy button is now **Cups**, with **Mini Cup** and **Grand Prix** side by side
  (keep going or start over). Finishing either cup unlocks the Speedster.
- **Camera:** it zooms out a little when you go fast, and zooms in on the Candy
  Raceway bridge.
- **Photo finish!** If someone is right beside you just before the finish line on the
  last lap, everything goes into slow motion for a moment and the camera zooms in.
- **Each car's power has its own sound:** a quack (Duck), rocket whoosh (Rocket), UFO
  warble (UFO), ice cream van jingle (Ice Cream Van), tractor chug (Tractor), a big bong
  (Bubble Bus), a lucky ding (Hot Dog), a splish (Buggy), a sparkle (Cupcake), a rumble
  (Monster Truck) and a vroom (Zoomer and Speedster).
- **The menu music is now super upbeat:** fast and bouncy, with bells.

## 2026-11-01 — RC: 7 new car styles, every style has a special power, 3 new stickers
- **12 car styles now**, and each one has its **own special power** (small helps,
  so any car can still win; the computer racers always drive plain Zoomers):
  - **Zoomer**: rocket start at "Go!"
  - **Speedster**: faster, but a bit slidier
  - **Monster Truck**: grass doesn't slow you down
  - **Bubble Bus**: big and heavy (pushes others), and shields last twice as long
  - **Hot Dog**: better gift boxes
  - **Beach Buggy** (new): puddles and honey can't slow you
  - **Rubber Duck** (new): huge jumps, with a "Quack!" boost when you land
  - **Ice Cream Van** (new): rain and snow aren't slippery
  - **Tractor** (new): oil can't spin you
  - **Rocket** (new): stronger boosts
  - **Cupcake** (new): coins on the track count double
  - **UFO** (new): the wind can't push you and bubbles bounce off
- How to unlock the new ones: win on Sunny Beach (Buggy), win in the rain (Duck),
  win 3 races (Ice Cream Van), drive 30 laps (Tractor), hit 25 boost pads (Rocket),
  win on Candy Raceway (Cupcake), win on Moonlight Speedway (UFO). A pop-up tells you
  when you unlock one.
- **3 new stickers** in the garage sticker shop: **Checkered** (200), **Rainbow** (220)
  and **Galaxy** (250, a little space scene with a ringed planet).
- Fixed the Candy Raceway ramps: on the bottom half of each ramp the car was drawn
  *under* the ramp (it vanished for a moment). Now it stays on top the whole way, and its
  shadow drifts further away the higher it goes.
- Also fixed: after an update, some browsers kept playing the old version for a while
  (that's why Candy Raceway still looked like the old track). Every update now loads
  fresh right away.

## 2026-11-01 — RC: every menu is the same size
- Every RC screen is now **one fixed size**: main menu, My Car, Free Play, Time Trial,
  Grand Prix, Help, Pause, results and the garage. The box doesn't change shape anymore,
  and the title and Back button always sit in the same spot at the top.
- **My Car** is more compact: the car picture sits next to the Style / Paint / Stickers
  tabs, so everything fits without scrolling.
- **The garage** has tabs too: **Upgrades**, **Stickers** and **Points**. Your coins
  always show at the top, and the next track sits next to the "Next race" button.
- On very short screens (a phone held sideways) the box stays the same size and the
  inside scrolls.

## 2026-11-01 — RC: Candy Raceway is a figure 8 with a bridge
- **Candy Raceway is now a big figure 8.** The first time through the middle you drive
  under the bridge. The second time you go **up a ramp, over the bridge, and down**,
  right over the other cars.
- Up on the bridge your car looks bigger (closer to the camera) and there's a "whoosh"
  as you go up the ramp. Rails keep you from falling off, and the bridge throws a
  shadow on the road below.
- Cars on the bridge and cars underneath never bump into each other. Oil, puddles,
  gift boxes and boost pads are kept away from the crossing.

## 2026-11-01 — RC: title screen with a logo, bigger Cloud Castle
- **New title screen:** a big **Mini RC Racers** logo (checkered flags, a race track and a
  cute red car zooming by). Tap anywhere, or press any key, to start.
- The how-to-play pictures moved behind a blue **Help** button on the main menu.
- **Cloud Castle is much bigger** and looks nothing like Volcano Valley anymore. The road
  climbs up and down over **3 castle towers**, then sweeps back around. A lap is about
  60% longer and there are 5 rows of gift boxes, so it's a real final race for the Grand Prix.

## 2026-11-01 — RC: a new main menu with music
- The long scrolling menu is gone. The main menu now has **4 big buttons**:
  **Grand Prix**, **Free Play**, **Time Trial** and **My Car**.
  - **Grand Prix:** starts right away. If one is already going, you choose
    **Keep going** or **Start over**.
  - **Free Play** and **Time Trial:** pick the weather at the top, then a track.
  - **My Car:** a big picture of your car and 3 tabs: **Style**, **Paint** (including the
    special paints) and **Stickers**.
  - Every screen has a **Back** button.
- **Menu music:** a laid-back garage tune plays in the menus and in the Grand Prix
  garage, and it keeps going as you move between screens.
- The "Levels" button on the pause and results screens is now called **Menu**.

## 2026-11-01 — RC: special paints to unlock
- A new **Special paints** row in the menu, each won by doing something cool:
  - **Neon Green**: beat your ghost in a Time Trial
  - **Neon Pink**: grab all 6 coins in a row (Grand Prix)
  - **Neon Blue**: win a race in the snow
  - **Gold**: win 10 races
  - **Rainbow**: win at least once on every track
- Neon paints **glow** and leave a **light trail** behind your car. Gold **sparkles**
  and shines. Rainbow **changes color** as you drive and leaves a rainbow trail.
- A pop-up tells you the moment you unlock one. Like the other paints, they only change
  how your car looks, not how fast it goes.

## 2026-11-01 — RC: car styles, stickers, Time Trial, weather, jumps and more
- **5 car styles** (looks only, every car still drives the same): Zoomer is free; finish
  a Grand Prix for the **Speedster**; win bronze, silver and gold trophies for the
  **Monster Truck**, **Bubble Bus** and **Hot Dog**. Pick one under "Your car" in the menu.
- **Stickers:** stripes, polka dots, number 1, stars, hearts, flames and lightning.
  Buy them with leftover coins in the Grand Prix garage (100–180 coins). Once bought
  they're yours forever and you can switch them in the menu.
- **Time Trial** for every track: just you and a see-through **ghost car** that replays
  your best lap. Big lap timer on screen; beat your best for "New record!"
- **Coins on the track** in the Grand Prix: rows of spinning coins you drive through,
  with a rising "bling" for each one and "All 6!" for a full row. They add to your prize.
- **Weather:** rain (slippery, and puddles slowly grow), snow (very slippery, a bit
  slower) and wind (gusts push your car sideways; a wind arrow shows which way). The Grand
  Prix has its own weather per race; in free play and Time Trial you pick it in the menu.
- **Boost pads** (orange arrows) and **wooden jumps**: fly over oil, puddles and other cars.
- **A spoken "three, two, one, Go!"**, a crowd cheer at the finish line, and confetti
  when you pass someone on the last lap.

## 2026-11-01 — RC: 2 more tracks, a song for every track, better music everywhere
- **Two new tracks:** **Jungle Rally** (deep green jungle) and **Cloud Castle** (a road
  through the sky with puffy clouds and balloons). That's 10 tracks; the Grand Prix is
  now 10 races. The computer racers get a bit faster again on these two.
- **Every RC track has its own song:** bouncy pop (Backyard), surf with a swing (Beach),
  sleigh bells (Snowy Park), folky (Autumn), desert drums (Dunes), bubblegum (Candy),
  dreamy synth (Moonlight), fast rock (Volcano), jungle drums (Jungle Rally) and an airy
  sky song with bells (Cloud Castle).
- **Much better music in the whole arcade.** Instead of a 2-bar beep loop, every song is
  now a little band: drums (kick, snare, hi-hats, claps, shakers, bells), a bass line,
  soft chords, sparkly arpeggios and a real melody with a verse and a chorus, plus a bit
  of echo. All the other games got upgraded songs too.

## 2026-11-01 — RC: Lucky Charm upgrade, engine sounds
- **New 5th upgrade: Lucky Charm** (4-leaf clover). Each level makes gift boxes better:
  uncommon items (Cloud Ride, Honey) come more often, and rare items go up by 1% each.
  At max level, Super Star and Coin Bag are 6% each instead of 3%.
- Race prizes went up a bit (1st 300, 2nd 215, 3rd 155, 4th 110) to pay for the extra
  upgrade, so a Grand Prix still lets you buy most things by race 7.
- **Engine sounds!** Your car rumbles while waiting at the start, revs up with speed,
  gets louder on the gas and howls when you boost.
- **Tires screech** when you drift or spin, cars **thud** when they bump, and you hear a
  little "bling" every time you pass someone.
- All of it follows the sound slider and mute button in the pause menu.

## 2026-11-01 — RC: spins end facing forward, new Cloud Ride item
- **Spin-outs** (oil, getting bubbled) now always finish with your car pointing the right
  way down the road, so you can just keep driving.
- **Triple Boost is gone.** In its place: **Cloud Ride** (uncommon). Your car floats on a
  fluffy cloud for 3.5 seconds: grass doesn't slow you down (cut those corners!), you
  sail right over oil, puddles and honey, and you get a little extra speed.

## 2026-11-01 — RC items: common, uncommon, rare
- Gift-box items now come in three kinds:
  - **Common** (about 70%): Boost, Bubble, Shield
  - **Uncommon** (about 24%): Triple Boost, Honey
  - **Rare** (3% each): Super Star, Coin Bag (the coin bag only in the Grand Prix)
- Your place still tilts the common and uncommon odds (more boosts at the back, more
  shields and honey for the leader). Rare odds are always 3%.
- The item slot shows the kind: cream = common, green = uncommon, gold with sparkles =
  rare. Getting a rare plays a little fanfare and says "Rare!".

## 2026-11-01 — RC free play: maxed-out car
- **Free play has no garage any more:** your car always has every upgrade maxed out
  (engine, tires, turbo, nitro), and there are no coins. Just pick a track and race.
- To keep it exciting, the free-play rivals drive like they do on the last track.
- The garage and coins are now only in the Grand Prix. (Coin bags only show up there too.)

## 2026-11-01 — RC Racers: Grand Prix mode, new items
- **Grand Prix:** race all 8 tracks in a row, starting with a stock car and no coins.
  After every race you go to the **garage** to spend your coins, see the points table,
  and then go on to the next track. Points for every race (10 / 7 / 5 / 3); after race 8
  the best total wins the cup (gold, silver or bronze trophy). If you leave halfway, the
  cup waits for you ("Keep going: race 4 of 8").
- **Free play:** pick any of the 8 tracks, all open. It has its own garage and coins
  (separate from the Grand Prix).
- **More coins:** 1st 250, 2nd 180, 3rd 130, 4th 90 (later tracks pay more), so after
  7 Grand Prix races you can buy most of the upgrades.
- **4 new gift-box items:** Triple Boost (three boosts), Super Star (fast + nothing can
  stop you for 3 seconds), Honey (drop a sticky puddle behind you) and a Coin Bag
  (bonus coins). Cars at the back get the speedy ones more often.
- The paint colors are now neatly centered (the little cars face up).

## 2026-11-01 — Mini RC Racers: 8 tracks, coins and a garage
- **8 tracks now** (5 new): Autumn Woods, Desert Dunes (cacti), Candy Raceway (lollipops
  and donuts), Moonlight Speedway, and Volcano Valley (lava pools). Each one unlocks when
  you finish in the top 3 on the one before.
- **No difficulty setting** in this game any more. Instead the computer racers get a bit
  faster on every track.
- **Every car is the same.** Pick any paint color you like (6 colors, all free).
- **Coins after every race:** 1st = 100, 2nd = 60, 3rd = 40, 4th = 20, and later tracks
  pay more (up to 2.75x on Volcano Valley).
- **Garage upgrades** (5 levels each, 40 to 320 coins per level):
  **Engine** = higher top speed, **Tires** = more grip and sharper steering,
  **Turbo** = faster speed-up, **Nitro** = stronger, longer boosts from gift boxes.
- You start at the back of the grid now, so every race is about passing.

## 2026-10-31 — Coloring book and maze upgrades
- **Coloring book:** tap-to-fill works as before, plus a tool row:
  - a **brush** to draw freely (3 sizes), an **eraser**, and **10 stickers** (star, heart,
    flower, rainbow, balloon, smiley, crown, sparkle, paw, cloud), each in 3 sizes
  - **redo** next to undo; undo/redo work for every tool
  - a second box of soft crayons, plus a rainbow "+" button to pick **any color**
  - every picture now **saves itself** on the device, so coloring is still there tomorrow
  - the heart-frame button saves a copy to **My pictures**, a new gallery tab in the picker.
    Tap one to keep coloring it; tap the red X twice to remove it.
- **Maze:**
  - a dots button for **Easy / Normal / Challenge** (how big the mazes grow, up to 9 x 9)
  - **color themes** that change as you go (garden, sea, space, candy)
  - from the 3rd maze (5th on Easy), a **locked door** blocks the way until you fetch the **key**
  - **gems** to collect: finding them all gives 3 stars
  - a **light bulb** shows the way for a few seconds (to the key first)
  - **arrow keys** work, progress is saved, and you earn medals at 5, 10 and 20 mazes

## 2026-10-31 — The Kids Arcade: 9 games
- **New home screen:** a colorful arcade with nine game cards. Each card shows the medals
  and stars you've earned.
- **Seven brand-new games**, all original art and names:
  - **Turbo Bike** — dirt-bike racing over ramps against the clock. Lean in the air to land,
    use turbo but watch the heat, blue arrows cool you down. 5 tracks, bronze/silver/gold,
    a ghost of your best run, 4 bikes to unlock, and a build-your-own-track mode.
  - **Mini RC Racers** — top-down racing with three computer cars, 3 laps, oil slicks,
    puddles, a shortcut, boosts/shields/bubbles. 3 tracks, 4 cars to unlock.
  - **Hoop Heroes** — drag and flick to shoot. Real bounces off the rim, swishes, streaks.
    30- and 60-second modes plus challenge levels with moving hoops.
  - **Bullseye Adventure** — archery with a helpful aiming line on Easy. Balloons, spinning
    prize wheels, moving targets, wind. 9 levels plus practice, hats to unlock.
  - **Jungle Jump** — a platformer through a forest, a crystal cave, slippery snow and candy
    land. Stars, hidden treasure, springs, moving platforms, checkpoints, 5 heroes.
  - **Space Defender** — fly a little rocket and bubble-zap silly robots. Power-ups, combos,
    two goofy bosses (one is a cookie-jar UFO), 3 sectors plus endless mode.
  - **Fishing Frenzy** — cast, wait for the bite (not the nibble!), reel without snapping the
    line. Rare and golden fish, a fish book, 3 places, rods to unlock, relax or timed mode.
- **Every game has:** a picture how-to-play, Easy / Normal / Challenge, pause with volume
  and mute, restart, results with stars or medals, and saved best scores (on this device).
- The coloring book and maze are cards 7 and 8 and work as before.

## 2026-10-30 — The maze game works!
- **New maze game** (the blue button on the home screen). Each maze is cut out of a
  big shape: circle, heart, square, diamond, then star.
- Drag the little friend along the white paths to its treat: **bee → flower,
  bunny → carrot, mouse → cheese**. A colored trail shows where you've been.
- **No walls to bump and nothing to lose.** The friend only goes where the path goes,
  so sloppy fingers are fine. Going backwards just rolls up the trail.
- **Finishing** makes the friend hop, stars burst out, and a little "ta-da" plays.
  A big green arrow then brings the next maze, a new shape and a bit bigger
  (starts tiny, grows to 7 by 7 and stays there so paths stay finger-wide).
- The round-arrow button (top right) gives a different maze of the same size.
- Every maze is made up fresh, so no two are the same.

## 2026-10-30 — 18 new pictures, veggies, and no more suns
- **Took the suns out** of every picture (cat, bird, watermelon, house, sailboat).
- **6 new animals:** lion, elephant, pig, owl, penguin, duck.
- **6 new fruit & veggies:** grapes, pineapple, lemon, carrot, corn, broccoli.
  Veggies live in the fruit tab.
- **6 new things:** bus, fire truck, rocket (with stars), helicopter, tractor, castle.
- Now 36 pictures: animals 12, fruit & veggies 13, things 11. Each run adds 18 more
  until every tab has 30.

## 2026-10-30 — Hand-drawn pictures, plus a "things that go" tab
- **All pictures are now drawn by Claude** in your style: cute cartoon, thick bold
  black outlines, white, big simple shapes. The converted Firefly pages (wobbly lines,
  cut-off butterfly) are no longer in the game.
- **Animals (6):** cat, fish, bird, plus new dog, bunny (with a carrot), and turtle.
- **Fruit (7):** apple, banana, strawberry, pear, cherries, orange, watermelon — each
  with a happy face.
- **New third tab — a little car — for things (5):** car, airplane, house, sailboat, train.
- Outlines are thicker everywhere so they look bold, like a real coloring book.
- Fewer pictures than before (18 vs. 44) for now; new ones get added each run.

## 2026-10-30 — Picture picker
- **New picker screen.** Tapping Coloring now opens a big grid of every picture,
  so kids can jump straight to the one they want instead of pressing the arrows
  40 times.
- **Two picture tabs** at the top: a cat face for Animals (24) and an apple for
  Fruit (20). No words needed.
- The little pictures show the colors the child has already added, so they can
  find the one they were working on.
- On a picture, the new four-squares button (top left) goes back to the grid.
  The phone's back button does the same. The arrows now flip through just that tab.
- Which tab a picture goes in is set in `art/groups.json` — anything not listed
  there counts as an animal.

## 2026-10-30 — Bear removed
- Took the bear out at Keith's request (picture moved to `art/removed/`).

## 2026-10-30 — The dragon is here
- **New:** dragon, unicorn, tiger, and a new fish (replaces the hand-drawn one).
- **Upgraded:** cat, dog, lion, bunny, horse, bear, and elephant now use Keith's
  cleaner single pictures instead of the versions from the photo sheet. They're
  sharper and have more parts to color.
- The converter now also ignores the edge or shadow of a sheet of paper.

## 2026-10-30 — 40 new pages from Keith's art
- **New art converter.** Drop coloring-page images (Firefly, Adobe Express...) into
  `art/` — or a whole grid of them into `art/sheets/` — and they become tappable
  pages. It finds every enclosed area, closes small breaks in the lines, cleans up
  card borders, and zooms in on the drawing.
- **20 animals:** bear, bunny, butterfly, cat (the new sleepy cat replaces the old one),
  dog, dolphin, duck, elephant, fox, giraffe, hippo, horse, lion, monkey, owl,
  penguin, snail, turtle, whale, zebra.
- **20 fruits** (repeats skipped): apple, avocado, banana, blueberries, cherries,
  coconut, fig, grapes, kiwi, lemon, mango, orange, papaya, peach, pear, pineapple,
  pomegranate, raspberry, strawberry, watermelon.
- `art/README.md` has the Firefly prompt that works best.

## 2026-10-30 — Art upgrade
- Redrew the cat, fish, and bird in a cuter style: bigger heads, shiny eyes, blush cheeks,
  and more parts to color (inner ears, belly, stripes, fins, wing).
- Every picture now has a little scene to color too: sky or water, sun, cloud, bubbles,
  grass, seaweed, a flower, a branch with leaves.
- The picture is always a square now, so the background fills edge to edge on phones.
- Added an art style guide to the dev playbook so all 50 animals match.

## 2026-10-30 — Day 1: foundation
- Set up the project: roadmap, changelog, and instructions for the daily dev runs.
- **Hub screen**: two big picture buttons — the paint palette opens the coloring game,
  the maze button shows a "coming soon" wiggle for now.
- **Coloring game**: tap any part of a picture to fill it with the chosen crayon.
  12 big crayon colors, undo, start-over, and a home button. Arrows switch animals.
- **First three animals**: cat, fish, and bird.
