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
  levels: (g) => [ { id, name, pic: '<svg>', locked: bool, meta: 'optional html', section: 'optional heading', ...anything } ],
  levelsTitle: 'Pick a level',
  extraMenu: (g) => domElement, // optional extra stuff under the level grid (shop, bikes...)
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
| `g.sfx(name)` | click jump spring coin star pop hit bonk crash shoot zap boost power swish splash whoosh tick beep go win aww unlock |
| `g.tone(freq, seconds, {type, slide, vol, delay})` | custom beep |
| `g.finish({win, score, stars:0-3, medal:'gold'\|'silver'\|'bronze'\|null, time, title, lines:[...], next:bool, delay, buttons})` | end the round; the kit records bests per level and shows results. Optional `buttons: [{icon, label, cls, onClick}]` replaces Next/Again/Levels; `extraButtons` (same format) adds buttons in front of them |
| `g.save` | this game's saved record: `{levels: {id: {score, stars, medal, time, done}}, best, unlocked: [], data: {}}`. Put your own stuff in `g.save.data`, then call `g.store()` |
| `g.unlock(key, label)` / `g.isUnlocked(key)` | unlockables with a toast |
| `g.achieve(key, label)` | one-time achievement toast |
| `g.music.mood({energy, tempo, key, muffle})` | steer the song while playing: energy 0 = calm, 1 = normal, 2 = all-out; tempo 1.07 = a bit faster; key = half steps up (lands on the next bar); muffle 0..1 = behind a wall (caves). Reset to normal at every level start |
| `g.music.stinger(name)` | a little jingle on top of the song, in its key and on its beat: `'treasure'` `'streak'` `'lead'` `'lastlap'` `'boss'` |
| `g.play(levelObj)`, `g.menu()`, `g.restart()`, `g.panel(domEl)`, `g.menuMusic()` | navigation helpers (`menuMusic` starts the menu song, e.g. in a shop panel) |

Helpers: `Arcade.draw` (`rr`, `box`, `circle`, `star`, `starPath`, `text`, `meter`, `INK`),
`Arcade.math` (`clamp`, `lerp`, `rand`, `dist`, `seeded`, `nearestOnSegment`, `angleDiff`),
`Arcade.icons` (SVG strings: home pause play again next menu sound music mute lock star(on)
medal(kind) trophy left right up down jump fire gas brake turbo), `Arcade.Particles` (make your
own for world-space effects), `Arcade.h(tag, attrs, html)` for DOM.

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
