# Arcade kit — how a game is built

Every arcade game is a folder with two files, plain JavaScript, no build step:

```
mygame/index.html   (copy bike/index.html, change the title and script name)
mygame/mygame.js    (the game)
```

`index.html` loads `../css/style.css`, `../arcade/shared.css`, `../arcade/shared.js`,
then the game script. The game calls `Arcade.start({...})` once.
**`bike/bike.js` is the complete reference example. Copy its structure.**

## Arcade.start(config)

```js
Arcade.start({
  id: 'mygame',                 // save name; must match the hub card id
  title: 'My Game',
  view: { w: 960, h: 540 },     // fixed drawing size; the kit letterboxes it to any screen
  background: '#123456',        // page color around the view
  difficulty: false,           // optional: hide Easy/Normal/Challenge (game always plays 'normal')
  littleSpeed: 0.85,            // optional: little kids (age preset) play with game time this much slower (racing/action games)
  music: 'happy',               // 'happy' | 'race' | 'calm' | 'space' | 'jungle', or a song recipe object,
                                // or a function(g) returning either (see `songs` in shared.js for the recipe format)
  howTo: [ { pic: '<svg viewBox="0 0 80 80">…</svg>', text: 'Few words', keys: 'Arrow keys' } ],
  buttons: {                    // big on-screen buttons, shown only on touch screens
    left:  [ { id: 'ArrowLeft', icon: Arcade.icons.left, label: 'Left' } ],
    right: [ { id: 'Space',     icon: Arcade.icons.jump, label: 'Jump' } ],
  },                            // pressing one = pressing that key; games just read keys
                                // (Nov 23 touch pad) left = moving, right = doing. Optional per button:
                                // `main: true` = the game's main button (biggest, put it LAST = outside edge),
                                // `color: '#hex'` (default: arrows blue, Space green, KeyX purple); it lights up
                                // in that color while held. The whole pad takes the touches: thumbs can roll
                                // between buttons, a touch in a gap goes to the nearest one. `__pads()` for tests.
  oneThumb: {                   // (Nov 23) optional "one thumb" set for little kids (Arcade.profiles.oneThumb():
    buttons: { right: [...] },  //  little kids by default; Who's playing? switch `thumb`, Parent corner thumb-*)
    stack: ['right'],           // that side's buttons one above the other (Up over Down)
    howTo: [ ... ],             // the controls card's pictures in one-thumb mode
  },                            // while on, g.oneThumb is true: the game must HELP more (drive / aim by itself)
                                // for every button it took away. g.setOneThumb(on) for tests.
  levels: (g) => [ { id, name, pic: '<svg>', locked: bool, meta: 'optional html', section: 'optional heading', ...anything } ],
  levelsTitle: 'Pick a level',
  extraMenu: (g) => domElement, // optional extra stuff under the level grid (shop, bikes...)
  menuExtras: (g) => [ { icon: '<svg>', label: 'Shop', attr: 'data-shop', onClick() {} } ],
                                // optional: more round picture buttons on the title menu (Fishing: Book, Tank, Shop)
  logo: Arcade.logo({ title, title2, art, colors, bg }),   // title screen + the video-game menu (big START that
                                // continues, small Levels / Unlocks / Trophies / Help buttons)
  trophies: [{ id, name, how, secret }],   // trophy room; award with g.achieve(id)
  // (older:) logo: '<svg>…</svg>',         // optional: a title screen with this logo + "Tap to start!" instead of the
                                // how-to screen; the how-to pictures then open with g.help()
  mainMenu: (g) => {},          // optional: draw your OWN menu (with sub menus) instead of the level grid;
                                // show panels with g.panel(el), start a level with g.play(levelObj)
  menuMusic: 'calm',            // optional: a song for the menus (keeps playing between sub menus)
  readyJingle: false,           // optional: skip the "get ready" drum roll + da-da-DAA before the level song
                                // (for games with their own countdown or a voice at the start)
  panelClass: 'my-panel',       // optional: extra CSS class on every panel (e.g. to give them all one fixed size)
  levelsLabel: 'Menu',          // optional: name of the "Levels" button on pause/results screens
  setup(g, level) {},           // build everything for a level; called on start AND restart
  update(g, dt) {},             // dt is ALWAYS 1/120 s (fixed step). Only runs while playing.
  draw(g, ctx) {},              // paint the whole view every frame (also while paused)
  onPause(g) {}, onResume(g) {}, onFinish(g, result) {},
});
```

Flow the kit runs for you: how-to-play + difficulty → level picker (if `levels`) →
`setup` → play loop → `g.finish(result)` → results screen (Next / Again / Levels / Arcade).
Pause button, Esc/P key, and switching tabs all pause. Pause menu has volume sliders,
mute, difficulty (restarts), start over, levels, back to arcade.

## The `g` object

| | |
|---|---|
| `g.W`, `g.H` | view size |
| `g.difficulty` | `'easy' \| 'normal' \| 'challenge'`; `g.pick(easyVal, normalVal, challengeVal)`. Always `'easy'` for a little kid |
| `g.little` | true when the player's age preset is Little (about 3-5): add extra help (RC/bike drive themselves forward, Space gives 2 more lives) |
| `g.speed` | game-time speed (1, or `config.littleSpeed` for little kids) |
| `g.level` | the level object picked (or `null` when the game has no levels) |
| `g.time` | seconds since setup |
| `g.input.down('ArrowLeft','KeyA')` | key held (also touch buttons) |
| `g.input.hit('Space')` | true once per press |
| `g.input.pointer` | `{x, y, down, justDown, justUp, startX, startY}` in VIEW coordinates (mouse + touch) |
| `g.particles.burst(x, y, {count, colors, speed, size, life, gravity, shape:'circle'\|'star'\|'square', angle, spread})` | screen-space particles, drawn on top automatically |
| `g.sfx(name)` | click jump land spring coin star pop hit bonk crash shoot zap boost power swish splash whoosh tick beep go win aww unlock, and the game-feel sounds sparkle poof clang thud plink |
| `g.juice` | **game feel** (Nov 22): `squash(key)` (`.hit(0.3)` squash / `.hit(-0.3)` stretch, then `.apply(ctx, x, footY)` or `.sx/.sy`), `dust(x, y, {dir, color, to})`, `sparkle(x, y, {colors, to})`, `poof(x, y)`, `stop(0.05)` (tiny pause on a big hit), `flash(color, 0.25)`, `shake(px)`, `pop(key)` + `size(key)` (a number that boings). `to` = your own world-space Particles. All turned down in Calm motion. See "Game feel" below |
| `g.tone(freq, seconds, {type, slide, vol, delay})` | custom beep |
| `g.finish({win, score, stars:0-3, medal:'gold'\|'silver'\|'bronze'\|null, time, title, lines:[...], next:bool, delay, buttons})` | end the round; the kit records bests per level and shows results. Optional `buttons: [{icon, label, cls, onClick}]` replaces Next/Again/Levels; `extraButtons` (same format) adds buttons in front of them; `rows: [screen rows]` adds rows to a canvas-menu results screen (Turbo Bike's cup table) |
| `g.save` | this game's saved record: `{levels: {id: {score, stars, medal, time, done}}, best, unlocked: [], data: {}}`. Put your own stuff in `g.save.data`, then call `g.store()` |
| `g.unlock(key, label)` / `g.isUnlocked(key)` | unlockables with a toast |
| `g.looks` | the Star Road (Nov 24): `g.looks.hat` (worn hat id), `g.looks.trail(x, y, o)` every step. See "The Star Road" below |
| `g.achieve(key, label)` | one-time achievement toast |
| `g.music.mood({energy, tempo, key, muffle})` | steer the song while playing: energy 0 = calm, 1 = normal, 2 = all-out; tempo 1.07 = a bit faster; key = half steps up (lands on the next bar); muffle 0..1 = behind a wall (caves). Reset to normal at every level start |
| `g.music.stinger(name)` | a little jingle on top of the song, in its key and on its beat: `'treasure'` `'streak'` `'lead'` `'lastlap'` `'boss'` |
| `g.play(levelObj)`, `g.menu()`, `g.restart()`, `g.panel(domEl)`, `g.menuMusic()` | navigation helpers (`menuMusic` starts the menu song, e.g. in a shop panel) |

Helpers: `Arcade.draw` (`rr`, `box`, `circle`, `star`, `starPath`, `text`, `meter`, `INK`),
`Arcade.math` (`clamp`, `lerp`, `rand`, `dist`, `seeded`, `nearestOnSegment`, `angleDiff`),
`Arcade.icons` (SVG strings: home pause play again next menu sound music mute lock star(on)
medal(kind) trophy left right up down jump fire gas brake turbo), `Arcade.Particles` (make your
own for world-space effects), `Arcade.h(tag, attrs, html)` for DOM.

## Game feel (Nov 22, new plan point 3)

Every action should FEEL good, the same way in every game: use `g.juice` instead of hand-rolling it.

- **Jumps / launches**: `g.juice.squash('hero').hit(-0.25)` (stretch) + `g.sfx('jump')` + `g.juice.dust(x, feetY)`.
- **Landings / bounces**: `.hit(0.3)` (squash) + `g.juice.dust(x, y)` + `g.sfx('land')` (soft) or `'thud'` (big).
- **Pickups / scoring**: `g.juice.sparkle(x, y)` + `g.sfx('sparkle')` (or coin / star) + `g.juice.pop('score')` on the number.
- **Hits**: `g.juice.stop(0.05)` + `g.juice.flash('#fff', 0.2)` (+ `shake(6)` for really big ones). Baddies: `g.juice.poof(x, y)` + `g.sfx('poof')`.
- Draw a squashed thing with `ctx.save(); s.apply(ctx, x, bottomY); ...draw...; ctx.restore();` so it squashes onto the ground.
- Seen from above (Mini RC Racers): scale inside the thing's own rotated frame instead, so it squashes along the way it points.
- Lots of things (enemies): keep the spring on the thing (`e.sq = g.juice.squash(e).hit(0.2)`) and only draw squashed when `e.sq.a` isn't 0.

Calm motion turns it down by itself (small squashes, no flash or shake, fewer bits). Test: `tests/test_juice.py`.

## "Show me" how to play (Nov 24, new plan point 6)

The first time a player starts a game, the REAL game plays itself for a few seconds while a see-through hand does the
moves, then "Your turn!" and the round starts fresh. The Help and Pause screens get a Show me button (attr `showme`);
any tap or key skips it. Nothing the demo does counts: `store.save()`, toasts, `g.unlock`, `g.achieve`, the Daily
Surprise and `g.finish` are all off while `g.demo` is true, and the save is put back afterwards.

```js
showMe: {
  secs: 7,                                     // how long it plays
  think(g, hand, t) {                          // every step: steer the hand (t = seconds since the demo started)
    if (hand.busy() || !ready) return;
    hand.drag(x0, y0, x1, y1, 0.7, 0.25);      // view coords: finger down, slide, wait, let go (pulls, putts)
    // hand.tap(x, y)                          // a quick tap
    // hand.key('Space', 0.3)                  // press a key: the hand goes to the on-screen button (or a key picture)
  },
  moves: [{ t: 0.5, key: 'ArrowRight', hold: 1 }],   // or a fixed list on the game clock
}
```

The hand glides to each spot first (0.35 s), then presses. **Two hands** (Nov 24, part 2): a key is pressed by the hand on
its side of the on-screen buttons (on a computer: arrows = left hand, the rest = right hand), taps and drags by the right
hand, so `hand.key('ArrowRight', 5)` + `hand.key('Space', 0.3)` hold Right and tap Jump at once. Also `hand.busy('L' | 'R')`,
`hand.holding(id)`, `hand.release(id)` (let go early), `hand.done()` (end the demo now); `moves` and `keys` (the key
pictures) can be functions of `g` (one thumb gets other moves). `g.demo` is already true in `setup()`.
`hand.drag(x0, y0, x1, y1, dur, hold, 'L')` = the left hand drags (Potion Quest's walking finger); `showMe.sides = { ArrowUp: 'R' }` = which
hand presses a key on a computer (when the game has no on-screen button for it); `hand.tap(x, y, 'L')` = the left hand taps
(Piano Star's left-hand notes; the game has ONE pointer, so let the 2nd tap come ~0.2 s after the first).
Done: Hoop Heroes, Putt-Putt Park, Bullseye Adventure, Bubble School, Turbo Bike, Jungle Jump, Treasure Trail, Fishing Frenzy,
Mini RC Racers, Potion Quest, Space Defender, Piano Star (every game: point 6 is finished). Seen once per player (`kidsArcade.showme`). Headless tests only get it by themselves with localStorage
`kidsArcade.testShowMe`; `g.showMe()` starts it, `__showMe()` says what it's doing. Test: `tests/test_showme.py`.

## The Star Road: looks to work towards (Nov 24, new plan point 8)

Every star a player earns in a game counts towards new **looks** for that game: hats (party hat, flower crown, crown,
star hat) and trails (sparkles, hearts, bubbles, a rainbow). The kit does the rest: it works out a road of 8 looks
(4 for one kind) from how many stars the game has (the first after 2 stars, then evenly, never more than 8 apart, all
of them by three quarters of the stars), shows a **Looks** button on the title menu (a NEW star when something new is
there) with a chip "stars / next look", a big **"New!"** screen after a round that reaches one ("Wear it!" / OK, then
the results), and the stars-to-next chip on the results. Saved in `g.save.looks = { best, got, fresh, hat, trail }`;
`best` never goes down, so "New game" never takes a look away. Nothing unlocks during "Show me". Headless tests get a
toast instead of the "New!" screen unless they set localStorage `kidsArcade.testLooks`.

```js
looks: { kinds: ['hat', 'trail'] },        // or ['trail'] when there's no head to put a hat on
                                           // (optional max: (g) => how many stars there are, else levels x 3)
// drawing the hero:   Arcade.looks.drawHat(ctx, g.looks.hat, headTopX, headTopY, headWidth, tilt)
// every update step:  g.looks.trail(x, y, { to: myWorldParticles, on: moving })
//                     (a ship in scrolling space: { always: true, angle: Math.PI, speed: 170 })
```

`g.looks.hat` / `g.looks.trailId` = what's worn (null = nothing), `g.looks.info()` = { trails: bits let out } for tests,
`g.looks.road()`, `g.looks.check()`. The pictures are SVG in `Arcade.looks.HATS` / `TRAILS` (shared.js, "The Star Road").
Done: Jungle Jump (hats + trails), Putt-Putt Park, Hoop Heroes, Space Defender (trails); part 2: Treasure Trail (trails:
the explorer has its own hats), Potion Quest (hats via `Art.hero(..., { hat })`, replacing the hero's own; trail bits in
world space `lookFx`), Fishing Frenzy (the angler's hat in `drawAngler()`; the trail follows the lure). Archery keeps its own
older hats + arrow trails. Part 3: Turbo Bike (hats on the helmet: `drawBike` opt `hat`; trail from the back wheel),
Mini RC Racers (trail behind your car). A game with its own main menu (RC) opens the Looks screen with
`g.looks.screen(back)`; `g.looks.fresh()` = something NEW. Part 3b: a 3rd kind, **colors** (Bubblegum, Ocean, Sunset, Galaxy), a paint job that glides between its colors: paint the
thing with `g.looks.paint() || itsOwnColor` (`Arcade.looks.colorAt(id, t)`), and call `g.looks.takeOff('color')` when a shop
paint is picked. Turbo Bike (`kinds: ['hat', 'color', 'trail']`: 12 looks, narrower columns) + Mini RC Racers (`['color', 'trail']`).
Part 4: games you TAP rather than move in use
`g.looks.splash(x, y, { to, count, angle, spread, speed, scale })` = one puff of the worn trail's bits: Bubble School (the trail
follows the finger, a puff where it touches, the right bubble bursts into it), Piano Star (sparkles up out of each key you press).
Tests: `tests/test_looks.py`, `tests/test_looks_more.py`, `tests/test_looks_tap.py`.

**Outside the games** (part 5): `Arcade.looks.GAMES` lists which games have which kinds (keep it the same as `config.looks.kinds`
when a game gets looks: `tests/test_looks_book.py` checks), `gotIn(game)` / `owned(kind)` read what a player earned, `roadOf(game)`
is a game's looks in unlock order, `puff(particles, trailId, x, y)` lets a trail out anywhere. My House lets your animal wear
any earned hat + trail (Looks tile); the Sticker Book has a Looks page per game.

## Speed + battery (Nov 24, new plan point 9)

`config.draw(g, ctx)` is NOT called every frame any more outside of play: while `g.state` is `'paused'` the picture is
drawn about once a second (and at once after a resize or a state change), while it's `'menu'` or `'over'` about 30 times
a second. While playing (and during "Show me") it's every frame, as before. So never put game rules in `draw()`; keep
them in `update()`. The canvas menus pace themselves too (~30 pictures a second when nothing quick happens). Numbers for
tests: `Arcade.perf.draws` / `.menuFrames`, `ArcadeMenus.pacing()`; test `tests/test_speed.py`.

## House style (keep every game consistent)

- Original art only, drawn with canvas paths: bright colors, **thick dark outlines**
  (`#2b2b2b`, 3–5 px), rounded shapes, cute faces with shiny eyes. No copyrighted names/sprites.
- HUD: chunky outlined numbers via `Arcade.draw.text`. Keep the **top-left and top-right
  ~90 × 80 view px clear** (home and pause buttons sit there), and keep the bottom
  corners fairly clear on touch screens (on-screen buttons).
- Gentle for ages 4–10: losing is never harsh — results say "Nice try!" with one-tap retry.
  Easy mode should be really easy. No gore, nothing scary; defeated enemies poof into sparkles.
- Every game: a how-to-play with pictures, Easy/Normal/Challenge that actually change
  the gameplay, a real win/lose/complete condition, scoring, results via `g.finish`.
- Expose a small test hook, e.g. `window.__mygameState = () => ({...})`, for automated tests.

## Music

Songs are recipes plus a hand-written tune (see the long comment above `songs:` in
`shared.js`). Write tunes as text: `'5/4 3/2 2 1/4 3 | ...'` = scale step / length in
16ths (4 = a quarter note), 4 bars of 16 per phrase, `r/4` is a rest. Give every song
`prog: [verse, chorus, bridge]` and `tune: { A: verse, B: chorus, C: bridge }`.
`python3 tests/test_tunes.py` checks every bar adds up and the tune fits the chords;
`python3 tests/test_music.py` renders every song and checks it really plays.

The kit arranges each song into intro, verses, choruses, bridge, breakdown and a last
chorus a step higher (about 1.5-2.5 minutes before it loops). It crossfades between
songs, plays a "get ready" jingle before a level, fades on pause and carries on after,
and ends a level with one last chord. Instruments: square saw triangle bell flute brass
steel marimba choir uke whistle kazoo (`lead`, `harmony`, `lead2`), `pad: 'choir'`,
`arpSound: 'marimba' | 'uke' | 'steel'`.

Each player has their own music on/off switch (hub and pause menu, `settings.musicOn`)
and music volume; sound effects volume and "all sound off" are shared on the device.
