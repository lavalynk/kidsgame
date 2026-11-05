# Changelog

Newest first. Written for humans.

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
