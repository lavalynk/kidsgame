// =====================================================================
// Jungle Jump — a side-scrolling platformer through four worlds.
//
// Built on PHASER 3 (Nov 20, Keith): Phaser's Arcade Physics runs the game world
// (the hero, critters and moving platforms are Phaser bodies; Phaser moves them
// and sorts out every bump). The menus, music and saves are the arcade kit's, and
// the drawings are still our own hand-drawn canvas pictures (crisp on any screen).
// See "THE PHASER ENGINE" below. phaser.min.js (in this folder) is the whole engine.
//
// How it works:
//  * Each level is a TEXT MAP (an array of strings, see the legend below).
//    One letter = one 48 x 48 px tile. Edit the letters to change a level!
//  * The hero is a box (30 x 42 px), a Phaser physics body. Every physics step
//    (1/120 s) we decide how fast it wants to go, and Phaser moves it and stops
//    it at walls, floors and ceilings (sideways first, then up/down: forceX).
//  * Jumping feels nice because of a few small tricks:
//      - "coyote time": you can still jump for a moment after running off a ledge
//      - "jump buffer": pressing jump just BEFORE landing still counts
//      - variable height: let go of jump early and gravity gets stronger,
//        so a tap is a little hop and holding is a big jump
//  * Falling in a pit or running out of hearts sends you back to the last
//    lantern you lit. On Easy you can never lose.
//  * Two special moves make this game its own thing:
//      - LEAF GLIDE: keep holding jump while falling and your leaf opens, so you
//        float down slowly (great for long gaps)
//      - ROLL: press the roll button (X, or Down while running) to curl up and
//        tumble forward. Rolling smashes cracked boulders and boops critters.
//    Critters are bouncy: landing on one just bounces you off it.
//  * Reach the hot-air balloon at the end of each level to fly home.
//  * Every world has TWO levels. The second one opens when you finish the first,
//    and each has one idea of its own: Treetop Trail (climb the trees, then one long
//    glide), Glow Cave (dark: lanterns light it up), Windy Peak (wind lifts your leaf)
//    and Jelly Hills (bouncy jelly everywhere).
// =====================================================================
(function () {
  const { draw, icons, math } = Arcade;
  const D = draw;
  const INK = D.INK;
  const W = 960, H = 540;          // view size
  const T = 48;                    // tile size in px
  const PW = 30, PH = 42;          // hero hit box
  const PLAT_W = 120, PLAT_H = 22; // moving platform size

  // ---- how the hero moves (pixels and seconds) ----
  const PHYS = {
    walk: 300, run: 390,         // top speeds; you start running after holding a direction for a bit (or Shift)
    runAfter: 0.6,
    accel: 2200, decel: 2600,    // speeding up / slowing down on the ground
    turn: 3400,                  // turning around is extra snappy
    airAccel: 1700, airDecel: 900,
    iceAccel: 600, iceDecel: 320, // ice is slippery: slow to start, slow to stop
    jumpV: 760,                  // jump speed (held jump reaches ~160 px = 3+ tiles)
    gRise: 1800,                 // gravity going up while jump is held
    gCut: 4200,                  // gravity going up after jump is let go (short hop)
    gFall: 3000,                 // gravity coming down
    maxFall: 900,                // never fall faster than this (7.5 px per step, much less than a tile)
    glideFall: 140,              // leaf glide: fall this slowly while holding jump
    windUp: 260, windPull: 6000, // wind (Windy Peak): hold jump in it and you rise this fast
    rollV: 620, rollTime: 0.38,  // roll: speed and how long it lasts
    rollCool: 0.25,
    springV: 1180,               // springs launch you ~8 tiles high
    jellyV: 760, jellyHoldV: 980, // bouncy candy (hold jump to bounce higher)
  };

  // ---------------------------------------------------------------
  // LEVEL MAPS
  // Legend (one letter per 48 px tile):
  //   .  air                      #  ground (looks different in each world)
  //   ~  slippery ice             =  thin platform you can jump up through
  //   B  cracked boulder: roll into it to smash it
  //   F  fake wall: looks solid, but you can walk right in (secrets!)
  //   o  bouncy candy block       ^  thorns / spikes (ouch!)
  //   S  spring                   *  goodie (berry / gem / snowflake / sweet)
  //   C  hidden treasure chest    K  checkpoint lantern
  //   G  goal: the hot-air balloon   P  where the hero starts
  //   c  critter (bouncy: land on it to bounce, roll into it to boop it)
  //   h  moving platform, slides right over the '>' marks and back
  //   v  moving platform, rides up the '|' marks and back down
  //   x  decoration (flower / crystal / snowman / lollipop)
  //   e  ground that only appears on Easy (fills pits, adds steps)
  // Only in the second levels:
  //   L  leafy treetop (solid, you stand on it)     t  tree trunk (just a picture behind you)
  //   u  wind blowing UP: hold jump inside it and your leaf carries you up
  // Falling off the bottom of the map = fell in a pit.
  // ---------------------------------------------------------------
  const MAPS = {
    forest: [
      '..............................................................................................................',
      '.....................................*........................................................................',
      '....................................*..*.C....................................................................',
      '......................................=====............................................*......................',
      '..........................................................*.*.......*...*.....................................',
      '....................****..................................BBB.........c...........***..|......................',
      '....................====.............................***.........##########.......===..|......................',
      '.....***......................................h>>>..............###########............|.......*.*.*..........',
      '..P......x.###.....x.......c........S......K.......x..^........############.....K......v........c....x..G.....',
      '###############eee#############ee#############eeee#########################eee#############e##################',
      '###############eee#############ee#############eeee#########################eee#############e##################',
    ],
    cave: [
      '################################################################################################################',
      '................................................................................................................',
      '...............................................................................**..*............................',
      '.................................................................................====...........................',
      '.............**.....................*...*...........................*.....................*.....................',
      '............BBBB...................#######...........****.......######....................|.....................',
      '........................**........##.....F...........====.......######....................|.....................',
      '......*.*.*......................###.*.*.F...h>>>............#########....................|.......*.*.*.........',
      '..P.........x...........^^....c.####..C..F.K.......x......c..#########.....K...S..^.......v....c........x..G....',
      '#################eee#########################eee######################eee############ee#########################',
      '#################eee#########################eee######################eee############ee#########################',
    ],
    snow: [
      '................................................................................................................',
      '................................................................................................................',
      '..........................................*..*.C................................................................',
      '............................................=====...............................................................',
      '........................................................*.*.........................*...........................',
      '........................................................BBB.........................|...........................',
      '.....................................................................*.*.*..........|..........***..............',
      '......***.............*..*..*....................h>>>.............#~~~~~~~~.........|...........................',
      '..P.......x...................c.......K...S...^...............c..##########....K....v...x.......^....c.....G....',
      '###################~~~~~~~~~~~~~~eee#############eee~~~~~~~~~~~~~##########eee#############ee~~~~~~~~~~~~#######',
      '#################################eee#############eee#######################eee#############ee###################',
    ],
    candy: [
      '....................................................................................................................',
      '....................................................................................................................',
      '.................................................C..................................................................',
      '............................................**=====.................................................................',
      '.........................................................*.*............*.*c*........*..............................',
      '..................*.*.*......****........................BBB..........#########......|..............................',
      '.................######......====.....................................#########......|..**..........................',
      '.....*.*.*.......######............h>>>............................############......|...............*.*.*..........',
      '..P.........x..o.######....c............K...oo..^......x.......c...############.....Kv.....^............c..x..G.....',
      '###############.###################eee#############eee#########################eee###############ee#################',
      '###############.###################eee#############eee#########################eee###############ee#################',
    ],
    // ---- the SECOND level of each world (unlocked by finishing the first) ----
    // Treetop Trail: climb the trees (or ride the lift) up the big hill, then glide all the way down.
    forest2: [
      '..........................................................................................................................',
      '..........................................................................................................................',
      '.......................................................................*..................................................',
      '..........................................................................*...............................................',
      '...........................................................K..x.............*.............................................',
      '.......................................................|.##########............*..........................................',
      '...................................................**..|.##########..............*........................................',
      '..................................................LLLL.|.##########.................*.....................................',
      '...............................................*....t..|.##########.......................................................',
      '..............................................LLL...t..|.##########..........................................*............',
      '..................................*..*.*.......t....t..|.##########.......................C..................*............',
      '.................................LLL=====LLL...t....t..|.##########...................LLLLLLL................*............',
      '.............................*....t.......t....t....t..|.##########.....................tt................................',
      '............................LLL...t.......t....t....t..|.##########.....................tt................................',
      '.............................t....t.......t....t....t..|.##########.....................tt...........*....................',
      '.......***.............LLL...t....t.......t....t....t..|.##########.....................tt..........*.....................',
      '..P..x........c....K....t....t....t...S...t....t....t..v.##########...........c.....S...tt......K...^^...c...S...x...G....',
      '###################################################################eeeeeeee###############################################',
      '###################################################################eeeeeeee###############################################',
    ],
    // Glow Cave: it is dark! You carry a little light, and every lantern you pass lights up the cave.
    cave2: [
      '##############################################################################################################################',
      '..................................###########.................................................................................',
      '..................................###########..................................****...........................................',
      '..................................###########..................................====...........................................',
      '..................................###########...............*.*.*............|................................................',
      '..................................................*.*.*..........c...........|............*.*.*........*......................',
      '................**.........................................#########.........|...............x........*.*.....................',
      '......***.............................B..........h>>>>>...###..**.FF.........|...........#######..............................',
      '..P........K....^^..x.........c.......B.***...K..........####.C.*.FF...K.x...v....^^.c..########..K.........c..K...^..x..G....',
      '#######################eee#######################eeeeee###############################################eee#####################',
      '#######################eee#######################eeeeee###############################################eee#####################',
    ],
    // Windy Peak: no pits at all. Step into the wind and hold jump to ride it up the mountain.
    snow2: [
      '......................................................................uu....................................................',
      '......................................................................uu....................................................',
      '.......................................................uu.............uu......**............................................',
      '................................uu.....................**.............uu....x...............................................',
      '..............uu................uu.......*..........*..uu..*..........uu##########.*........................................',
      '..............*u................uu....*.....*..........uu.........**..uu##########..........................................',
      '..............uu.....C..........uu..K....^....c........uu.......K.....uu##########~~~~.*....................................',
      '..............u*...====.....*...uu################.....uu.....########################..c...................................',
      '..............uu...........*.*..uu################.....uu.....########################~~~~.*................................',
      '..............*u................uu################.....uu.....############################..................................',
      '..............uu..K.....c...^...uu################.....uu..x..############################~~~~.*............................',
      '..............uu##############################################################################..............................',
      '..............uu##############################################################################~~~~..........................',
      '.......***....uu##################################################################################.......*.*.*..............',
      '..P..x.....c..uu##################################################################################...K......c....^..x..G....',
      '########################################################################################################~~~~~~~#############',
      '############################################################################################################################',
    ],
    // Jelly Hills: bouncy jelly everywhere (hold jump to bounce higher). Even the first pit is jelly.
    candy2: [
      '..............................................................................................................................',
      '..............................................................................................................................',
      '..................................................**..........................................................................',
      '..........................................*....K.....c...............................................*........................',
      '.............................................#############..*....*....*..................................*.*..................',
      '..............*.......................*...oo.#############..............................C............*........................',
      '.............................................#############..........................*.====.....*........h>>>>.................',
      '..............*...................*...oo.....#############..oo...oo...oo.....................*...*............................',
      '.........................***.................#############.........................*..........................................',
      '......***.........................oo.........#############....................................................................',
      '..P.......x.........c..........K............S#############....................K...............^^^....S.....c....c...x...G.....',
      '#############ooo########.....#############################eeeeeeeeeeeeeeeee########oo######oo#################################',
      '########################ooooo#############################eeeeeeeeeeeeeeeee###################################################',
    ],
  }; // ---- end of level maps ----

  // Each world has its own colors. (Drawing code below reads these.)
  // Each world has its own song.
  const SONGS = {
    forest: { tempo: 132, root: 55, scale: 'mixolydian', prog: [[1, 7, 4, 1], [4, 5, 1, 7], [6, 4, 7, 5]], drums: 'latin', bass: 'bounce', lead: 'flute', harmony: 'marimba', pad: false, arp: true, arpSound: 'marimba', seed: 1501,
        tune: { A: '5/2 8 r 8 8 7 5/4 | 4/2 7 r 7 7 6 4/4 | 6/2 8 r 8 8 10 8/4 | 5/8 r',
                B: '8/4 10/2 8 6/4 4 | 9/4 11/2 9 7/4 5 | 10/4 12/2 10 8/8 | 7/6 9/2 11/8',
                C: '10/4 8 6/8 | 8/4 6 4/8 | 9/4 7 11/8 | 9/16' } },   // a jungle flute
    cave:   { tempo: 104, root: 57, scale: 'dorian', prog: [[1, 7, 6, 7], [4, 4, 1, 5], [3, 4, 7, 7]], drums: 'halftime', bass: 'pulse', lead: 'bell', harmony: 'choir', pad: 'choir', arp: true, arpSound: 'marimba', seed: 1502,
        tune: { A: '5/4 3 5 8 | 7/6 4/2 2/8 | 6/4 8 10 8 | 7/16',
                B: '8/6 6/2 4/8 | 8/4 10 11/8 | 10/6 8/2 5/8 | 9/8 7',
                C: '10/8 7 | 8/8 6 | 7/4 9 11/8 | 9/16' } },   // twinkly cave bells
    snow:   { tempo: 120, root: 65, scale: 'major', prog: [[1, 4, 6, 5], [4, 5, 1, 1], [6, 3, 4, 5]], drums: 'march', bass: 'walk', lead: 'flute', harmony: 'bell', pad: 'choir', arp: true, bells: true, seed: 1503,
        tune: { A: '1/2 3 5/4 8 5 | 4/2 6 8/4 6 4 | 6/2 8 10/4 8 6 | 5/4 7 9/8',
                B: '8/4 8/2 6 8/4 10 | 9/4 9/2 7 9/4 12 | 10/6 8/2 12/8 | 8/16',
                C: '8/8 10 | 7/8 10 | 8/4 6 4/8 | 5/4 7 9/8' } },
    candy:  { tempo: 150, root: 67, scale: 'major', prog: [[1, 6, 4, 5], [6, 4, 1, 5], [2, 3, 4, 5]], drums: 'bubble', bass: 'octaves', lead: 'square', harmony: 'bell', lead2: 'kazoo', pad: true, arp: 'B', seed: 1504,
        tune: { A: '8/2 5 3 5 8 10 8/4 | 8/2 6 3 6 8 10 8/4 | 6/2 4 1 4 6 8 6/4 | 7/2 5 2 5 7/8',
                B: '10/4 10/2 8 6/8 | 8/4 8/2 6 4/8 | 8/4 10 12 10 | 9/8 r',
                C: '2/4 4 6/8 | 3/4 5 7/8 | 4/4 6 8/8 | 5/4 7 9/8' } },
  };
  const WORLDS = {
    forest: {
      sky: ['#8fdcff', '#e4fbff'], bg: '#8fdcff', far: '#a6dc98', mid: '#5fb85a', trunk: '#9a6235',
      dirt: '#b9783f', dirtDot: '#a0632f', top: '#6cc04a', topDark: '#4f9e35', hollow: '#6e4422',
      plank: '#d79a5f', plat: '#c68b59', block: '#f2b766', spike: '#e0457b',
      critter: '#ef476f', spots: '#2b2b2b',
    },
    cave: {
      sky: ['#3a2a6e', '#120c2b'], bg: '#1b1238', far: '#2c1f57', mid: '#3d2c73', trunk: '#3d2c73',
      dirt: '#5c4c8f', dirtDot: '#4b3c7a', top: '#8a78d0', topDark: '#6d5bb5', hollow: '#2a1f4d',
      plank: '#8d7bc4', plat: '#7d6ab8', block: '#a99be0', spike: '#5ee6d0',
      critter: '#ffb703', spots: '#fb8500', dark: true,
    },
    snow: {
      sky: ['#a9d6ff', '#f2f9ff'], bg: '#a9d6ff', far: '#e7f2ff', mid: '#2f7d5c', trunk: '#7a5236',
      dirt: '#8eb1d6', dirtDot: '#7c9fc6', top: '#ffffff', topDark: '#cfe3f7', hollow: '#5b7ea8',
      plank: '#b07a52', plat: '#9fdcf5', block: '#bfe6ff', spike: '#7fd3ff',
      critter: '#ffffff', spots: '#8ecae6',
    },
    candy: {
      sky: ['#ffc2e2', '#fff4fa'], bg: '#ffc2e2', far: '#ffd9ec', mid: '#b8f2e6', trunk: '#ffffff',
      dirt: '#8a4f2e', dirtDot: '#a8663f', top: '#ff8fc8', topDark: '#e86aa9', hollow: '#5a2f18',
      plank: '#f6d39a', plat: '#ffe08a', block: '#ffd166', spike: '#9b5de5',
      critter: '#7bd389', spots: '#4caf68',
    },
  };

  // What you collect in each world (it's all "stars" in the code and saves).
  const GOODIES = { forest: 'berries', cave: 'gems', snow: 'snowflakes', candy: 'sweets' };

  // The levels, in the order the "Next" button walks through them: each world has two.
  //   after: the level you must finish first (the 2nd level of a world opens when you
  //          finish its 1st; the next WORLD also opens then, just like before)
  //   two:   this is a world's second level (new picture; its song plays a step higher)
  //   dark:  how dark the cave is (0 = not at all, 1 = pitch black)
  //   time:  a time of day for the background ('evening' / 'dawn' / 'twilight', see TIMES)
  // (Never rename an id: the saves use them.)
  const LEVELS = [
    { id: 'forest',  world: 'forest', name: 'Leafy Forest' },
    { id: 'forest2', world: 'forest', name: 'Treetop Trail', after: 'forest', two: true, time: 'evening' },
    { id: 'cave',    world: 'cave',   name: 'Crystal Cave',  after: 'forest' },
    { id: 'cave2',   world: 'cave',   name: 'Glow Cave',     after: 'cave', two: true, dark: 0.76 },
    { id: 'snow',    world: 'snow',   name: 'Snowy Hills',   after: 'cave' },
    { id: 'snow2',   world: 'snow',   name: 'Windy Peak',    after: 'snow', two: true, time: 'dawn' },
    { id: 'candy',   world: 'candy',  name: 'Candy Land',    after: 'snow' },
    { id: 'candy2',  world: 'candy',  name: 'Jelly Hills',   after: 'candy', two: true, time: 'twilight' },
  ];

  // Heroes you can play as. The monkey is free; the rest are unlocked.
  const HEROES = [
    { id: 'monkey', name: 'Momo',  body: '#b5764a', belly: '#f5d3a6', extra: '#f7a8b8', need: null },
    { id: 'frog',   name: 'Pip',   body: '#6fd16a', belly: '#d7f5b0', extra: '#ff9eb5', need: 'Finish the Forest' },
    { id: 'bunny',  name: 'Bun',   body: '#ffffff', belly: '#ffe3ef', extra: '#ffb3cf', need: 'Collect 30 goodies' },
    { id: 'fox',    name: 'Rusty', body: '#ff8c42', belly: '#fff3e0', extra: '#2b2b2b', need: 'Find 2 treasures' },
    { id: 'panda',  name: 'Bao',   body: '#ffffff', belly: '#ffffff', extra: '#2b2b2b', need: 'Find 4 treasures' },
  ];

  // Which letters are solid, and which you can stand on.
  const SOLID = { '#': 1, '~': 1, 'B': 1, 'o': 1, 'L': 1 };
  const STAND = { '#': 1, '~': 1, 'B': 1, 'o': 1, 'L': 1, '=': 1 };

  // ---------------------------------------------------------------
  // Building a level from its text map
  // ---------------------------------------------------------------
  function buildWorld(def, difficulty) {
    const map = MAPS[def.id];
    const rows = map.length, cols = Math.max(...map.map(r => r.length));
    const easy = difficulty === 'easy';
    const w = {
      def, rows, cols, width: cols * T, height: rows * T, grid: [],
      stars: [], springs: [], chests: [], flags: [], critters: [], plats: [], decor: [],
      goal: null, start: { x: T, y: 0 }, bounce: {},
    };
    const ch = (r, c) => (map[r] && map[r][c]) || '.';
    const platSpeed = { easy: 70, normal: 90, challenge: 115 }[difficulty] || 90;
    for (let r = 0; r < rows; r++) {
      const line = [];
      for (let c = 0; c < cols; c++) {
        const k = ch(r, c);
        const cx = c * T + T / 2, bottom = (r + 1) * T;
        let tile = '.';
        switch (k) {
          case '#': case '~': case '=': case 'B': case 'o': case 'F': case '^': case 'L': case 't': case 'u': tile = k; break;
          case 'e': tile = easy ? '#' : '.'; break;
          case 'S': w.springs.push({ x: c * T + 6, y: bottom - 26, w: T - 12, h: 26, squish: 0 }); break;
          case '*':
            w.stars.push({ x: cx, y: r * T + T / 2, got: false });
            if (ch(r - 1, c) === 'u' || ch(r + 1, c) === 'u') tile = 'u';   // a goodie floating in the wind: the wind keeps blowing there
            break;
          case 'C': w.chests.push({ x: cx, y: bottom, open: false }); break;
          case 'K': w.flags.push({ x: cx, y: bottom, on: false }); break;
          case 'G': w.goal = { x: cx, y: bottom }; break;
          case 'P': w.start = { x: cx - PW / 2, y: bottom - PH }; break;
          case 'c': w.critters.push({ x: c * T + 6, y: bottom - 30, w: 36, h: 30, dir: -1, alive: true, poof: 0, x0: c * T + 6 }); break;
          case 'x': w.decor.push({ x: cx, y: bottom, k: (c * 7 + r * 3) % 3 }); break;
          case 'h': { // horizontal platform: travels across this tile and the '>' marks after it
            let n = 0; while (ch(r, c + 1 + n) === '>') n++;
            const span = (n + 1) * T;
            w.plats.push(makePlat(c * T, r * T, span - PLAT_W, 0, platSpeed, w.plats.length));
            break;
          }
          case 'v': { // vertical platform: rides from here up over the '|' marks
            let n = 0; while (ch(r - 1 - n, c) === '|') n++;
            w.plats.push(makePlat(c * T + T / 2 - PLAT_W / 2, r * T, 0, -n * T, platSpeed, w.plats.length));
            break;
          }
        }
        line.push(tile);
      }
      w.grid.push(line);
    }
    // the goal needs to exist even if a map forgets it
    if (!w.goal) w.goal = { x: w.width - 3 * T, y: w.height - 2 * T };
    w.starsTotal = w.stars.length;
    w.flags.sort((a, b) => a.x - b.x);       // lanterns count from left to right (also when they stand at different heights)
    return w;
  }

  function makePlat(x0, y0, dx, dy, speed, i) {
    const len = Math.max(1, Math.hypot(dx, dy));
    const p = { x0, y0, dx, dy, len, speed, phase: (i * 0.37) % 1, x: x0, y: y0, px: x0, py: y0 };
    return p;
  }
  // Platform position is a pure function of time: slide there and back,
  // slowing down gently at each end (so it's easy to hop on and off).
  function platPos(p, t) {
    const s = t * p.speed / p.len + p.phase;
    const u = 1 - Math.abs((s % 2) - 1);           // 0 → 1 → 0 ...
    const e = u * u * (3 - 2 * u);                  // smooth ends
    return { x: p.x0 + p.dx * e, y: p.y0 + p.dy * e };
  }
  function updatePlats(w, t) {
    for (const p of w.plats) {
      p.px = p.x; p.py = p.y;
      const q = platPos(p, t);
      p.x = q.x; p.y = q.y;
    }
  }

  // Tile lookups. Outside the left/right edges counts as a wall;
  // above the top is open air; below the bottom is a pit.
  function tileAt(w, c, r) {
    if (c < 0 || c >= w.cols) return '#';
    if (r < 0 || r >= w.rows) return '.';
    return w.grid[r][c];
  }
  const isSolid = (w, c, r) => !!SOLID[tileAt(w, c, r)];
  const overlap = (a, x, y, ww, hh) => a.x < x + ww && a.x + a.w > x && a.y < y + hh && a.y + a.h > y;

  // ---------------------------------------------------------------
  // The test robot's PRETEND hero physics (plain functions, no Phaser): the robot tries
  // out moves on a pretend copy of the hero before it presses any buttons.
  // (The real hero is moved by Phaser: see "THE PHASER ENGINE" below.)
  // ---------------------------------------------------------------
  function newPlayer(x, y) {
    return {
      x, y, w: PW, h: PH, vx: 0, vy: 0, onGround: false, groundTile: '.', plat: -1,
      coyote: 0, buffer: 0, jumping: false, boost: false, holdTime: 0, face: 1,
      gliding: false, roll: 0, rollCool: 0, airRoll: false,
      // looks only:
      sx: 1, sy: 1, runPhase: 0, invuln: 0, dead: 0, hurtT: 0,
    };
  }
  const approach = (v, target, step) => v < target ? Math.min(target, v + step) : Math.max(target, v - step);

  // Move sideways and stop at walls.
  function moveX(w, p, dx) {
    if (!dx) return;
    p.x += dx;
    const r0 = Math.floor(p.y / T), r1 = Math.floor((p.y + p.h - 0.01) / T);
    if (dx > 0) {
      const c = Math.floor((p.x + p.w - 0.01) / T);
      for (let r = r0; r <= r1; r++) if (isSolid(w, c, r)) { p.x = c * T - p.w; p.vx = Math.min(0, p.vx); return; }
    } else {
      const c = Math.floor(p.x / T);
      for (let r = r0; r <= r1; r++) if (isSolid(w, c, r)) { p.x = (c + 1) * T; p.vx = Math.max(0, p.vx); return; }
    }
  }

  // Move up/down: land on floors, one-way platforms and moving platforms; bump heads.
  function moveY(w, p, dy, ev) {
    const prevBottom = p.y + p.h;
    p.y += dy;
    p.onGround = false;
    p.plat = -1;
    const c0 = Math.floor(p.x / T), c1 = Math.floor((p.x + p.w - 0.01) / T);
    if (dy > 0) {
      const bottom = p.y + p.h;
      let landY = Infinity, landTile = '.', landPlat = -1;
      // tiles
      const r = Math.floor((bottom - 0.01) / T);
      const top = r * T;
      if (top >= prevBottom - 0.01 - dy) {
        for (let c = c0; c <= c1; c++) {
          const t = tileAt(w, c, r);
          if (SOLID[t] || (t === '=' && prevBottom <= top + 0.01)) {
            if (top < landY || (top === landY && c === Math.floor((p.x + p.w / 2) / T))) { landY = top; landTile = t; }
          }
        }
      }
      // moving platforms (you can only land on their tops)
      w.plats.forEach((pl, i) => {
        if (p.x < pl.x + PLAT_W && p.x + p.w > pl.x && prevBottom <= Math.max(pl.y, pl.py) + 0.5 && bottom >= pl.y && pl.y < landY) {
          landY = pl.y; landPlat = i; landTile = '=';
        }
      });
      if (landY < Infinity) {
        const impact = p.vy;
        p.y = landY - p.h;
        p.vy = 0;
        p.onGround = true; p.groundTile = landTile; p.plat = landPlat;
        p.jumping = false; p.boost = false;
        if (ev && ev.land) ev.land(impact);
      }
    } else if (dy < 0) {
      const r = Math.floor(p.y / T);
      let hit = false;
      for (let c = c0; c <= c1; c++) {
        if (isSolid(w, c, r)) {
          hit = true;
        }
      }
      if (hit) { p.y = (r + 1) * T; p.vy = 0; p.jumping = false; p.boost = false; }
    }
  }

  // One physics step for the hero.
  //   inp = { dir: -1|0|1, jumpHeld, jumpPressed, run }
  //   cfg = { coyote, buffer }  (seconds — Easy is more generous)
  //   ev  = optional callbacks: jump(), land(impact), head(c, r), spring(s), jelly()
  function stepPlayer(w, p, inp, dt, cfg, ev) {
    ev = ev || {};
    // 1) ride a moving platform: move with it before anything else
    if (p.plat >= 0 && w.plats[p.plat]) {
      const pl = w.plats[p.plat];
      moveX(w, p, pl.x - pl.px);
      p.y = pl.y - p.h;
    }
    // 2) ROLL: curl up and tumble forward (once per jump in the air)
    if (p.rollCool > 0) p.rollCool -= dt;
    if (inp.rollPressed && p.roll <= 0 && p.rollCool <= 0 && (p.onGround || !p.airRoll)) {
      p.roll = PHYS.rollTime; p.rollCool = PHYS.rollTime + PHYS.rollCool;
      if (!p.onGround) { p.airRoll = true; p.vy = Math.min(p.vy, 60); }
      if (ev.roll) ev.roll();
    }
    if (p.onGround) p.airRoll = false;
    if (p.roll > 0) {
      p.roll -= dt;
      p.vx = p.face * PHYS.rollV;
      // smash cracked boulders right in front of us
      const fc = Math.floor((p.face > 0 ? p.x + p.w + 4 : p.x - 4) / T);
      for (let r = Math.floor(p.y / T); r <= Math.floor((p.y + p.h - 1) / T); r++) {
        if (tileAt(w, fc, r) === 'B' && ev.smash) ev.smash(fc, r);
      }
    }
    runJumpGlide(w, p, inp, dt, cfg, ev);

    // 6) move: sideways first, then up/down
    moveX(w, p, p.vx * dt);
    const wasGround = p.onGround;
    moveY(w, p, p.vy * dt, ev);
    if (wasGround && !p.onGround && p.vy >= 0) p.coyote = cfg.coyote; // walked off a ledge: coyote timer starts now

    // 6) bouncy candy blocks
    if (p.onGround && p.groundTile === 'o') {
      p.vy = -(inp.jumpHeld ? PHYS.jellyHoldV : PHYS.jellyV);
      p.boost = true; p.jumping = false; p.onGround = false; p.coyote = 0; p.buffer = 0;
      if (ev.jelly) ev.jelly(Math.floor((p.x + p.w / 2) / T), Math.floor((p.y + p.h + 4) / T));
    }
    // 7) springs (landing on OR walking into them)
    for (const s of w.springs) {
      if (p.vy >= 0 && overlap(p, s.x, s.y + 6, s.w, s.h - 6)) {
        p.vy = -PHYS.springV; p.boost = true; p.jumping = false;
        p.onGround = false; p.plat = -1; p.coyote = 0; p.buffer = 0;
        s.squish = 1;
        if (ev.spring) ev.spring(s);
      }
    }
  }

  // Running, jumping, gravity, the leaf glide and the wind: how fast the hero wants to go.
  // (Shared by the real game (stepHero, Phaser moves it) and the robot's pretend hero (stepPlayer).)
  function runJumpGlide(w, p, inp, dt, cfg, ev) {
    // 3) run left/right
    const ice = p.onGround && p.groundTile === '~';
    if (inp.dir) { p.holdTime += dt; p.face = inp.dir; } else p.holdTime = 0;
    const top = (inp.run || p.holdTime > PHYS.runAfter) ? PHYS.run : PHYS.walk;
    const target = inp.dir * top;
    let rate;
    if (!inp.dir) rate = p.onGround ? (ice ? PHYS.iceDecel : PHYS.decel) : PHYS.airDecel;
    else if (p.vx * inp.dir < 0) rate = p.onGround ? (ice ? PHYS.iceAccel * 1.3 : PHYS.turn) : PHYS.airAccel * 1.4;
    else rate = p.onGround ? (ice ? PHYS.iceAccel : PHYS.accel) : PHYS.airAccel;
    if (p.roll <= 0) p.vx = approach(p.vx, target, rate * dt);

    // 4) jump (with coyote time + jump buffer)
    if (inp.jumpPressed) p.buffer = cfg.buffer;
    if (p.onGround) p.coyote = cfg.coyote;
    if (p.buffer > 0 && p.coyote > 0) {
      p.vy = -PHYS.jumpV;
      p.jumping = true; p.boost = false;
      p.coyote = 0; p.buffer = 0;
      p.onGround = false; p.plat = -1;
      if (ev.jump) ev.jump();
    }
    p.buffer -= dt;
    if (!p.onGround) p.coyote -= dt;

    // 5) gravity: lighter while rising with jump held, heavier after letting go.
    //    Falling with jump held = LEAF GLIDE: a slow, gentle float.
    let grav;
    if (p.vy < 0) grav = (p.boost || (p.jumping && inp.jumpHeld)) ? PHYS.gRise : PHYS.gCut;
    else { grav = PHYS.gFall; p.jumping = false; p.boost = false; }
    p.gliding = !p.onGround && p.vy >= 0 && inp.jumpHeld && p.roll <= 0;
    p.vy = Math.min(p.gliding ? PHYS.glideFall : PHYS.maxFall, p.vy + grav * dt);
    if (p.gliding && p.vy > PHYS.glideFall) p.vy = Math.max(PHYS.glideFall, p.vy - 2400 * dt);
    // 5b) WIND blowing up ('u' tiles): hold jump and the wind fills your leaf and lifts you.
    //     Let go and you drop like normal. (A fast jump is not slowed down.)
    p.inWind = tileAt(w, Math.floor((p.x + p.w / 2) / T), Math.floor((p.y + p.h / 2) / T)) === 'u';
    if (p.inWind && inp.jumpHeld && p.roll <= 0) {
      if (p.vy > -PHYS.windUp) p.vy = Math.max(-PHYS.windUp, p.vy - PHYS.windPull * dt);
      p.gliding = true; p.jumping = false; p.boost = true;
    }
  }

  // Thorn hit box: the lower part of a '^' tile.
  function thornHit(w, p) {
    const c0 = Math.floor(p.x / T), c1 = Math.floor((p.x + p.w - 0.01) / T);
    const r0 = Math.floor(p.y / T), r1 = Math.floor((p.y + p.h - 0.01) / T);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      if (tileAt(w, c, r) === '^' && overlap(p, c * T + 8, r * T + 20, T - 16, T - 20)) return { x: c * T + T / 2, y: r * T + T };
    }
    return null;
  }

  // =====================================================================
  // THE PHASER ENGINE (Nov 20: Jungle Jump now runs on Phaser 3)
  //
  // Phaser runs the game WORLD: every solid thing is a Phaser physics body, and
  // Phaser's Arcade Physics moves the hero, the critters and the moving
  // platforms and works out who bumps into whom (this.physics.add.collider /
  // overlap). The hero's FEEL (coyote time, jump buffer, short hops, the leaf
  // glide, the roll, wind, jelly) is still our own code: it decides the hero's
  // speed every step, and Phaser does the moving and the bumping.
  //
  // The DRAWING is still ours too (the hand-drawn canvas pictures further down):
  // the kit paints them straight onto the screen at the screen's own sharpness,
  // so nothing is stretched or smeared when things move. That's why Phaser runs
  // "headless" here: no picture of its own, just the world.
  //
  // One physics step = 1/120 s, exactly like the kit's game steps, so every
  // kit step does one Phaser step (world.singleStep()).
  // =====================================================================
  const eng = { ready: false };
  function bootPhaser() {
    if (eng.game || !window.Phaser) return;
    eng.game = new Phaser.Game({
      type: Phaser.HEADLESS, width: W, height: H, banner: false,
      audio: { noAudio: true },
      input: { keyboard: false, mouse: false, touch: false, gamepad: false },
      // gravity is 0: the hero's gravity is part of the jump feel (stepHero), critters walk on flat ground
      // forceX: sort out sideways bumps first, then up/down (like "move x, then y" in the old engine;
      // so jumping into the side of a ledge stops you instead of popping you up on top)
      physics: { default: 'arcade', arcade: { gravity: { y: 0 }, fps: 120, fixedStep: true, forceX: true } },
      scene: {
        key: 'jungle',
        create() {
          eng.scene = this; eng.world = this.physics.world; eng.ready = true;
          // We step the world ourselves, from the kit's game loop (world.singleStep() in stepWorld),
          // so Phaser's own loop must not step it as well: put the scene to sleep and stop the loop.
          this.scene.sleep();
          setTimeout(() => eng.game.loop.stop(), 0);
          if (world && eng.builtFor !== world) buildPhaser(world);
        },
      },
    });
  }

  // Turn the text map into Phaser bodies. Ground tiles of the same kind are glued into
  // big rectangles first (fewer bodies, and no little seams to snag on).
  function buildPhaser(w) {
    if (!eng.ready) return;
    const s = eng.scene, phys = s.physics;
    // clear the last level
    if (eng.objs) eng.objs.forEach(o => o.destroy());
    phys.world.colliders.destroy();
    eng.objs = []; eng.builtFor = w; eng.boulders = {};
    const keep = (o) => { eng.objs.push(o); return o; };
    phys.world.setBounds(0, -4000, w.width, w.height + 8000);
    phys.world.setBoundsCollision(true, true, false, false);    // walls at the left and right ends, open at the top and bottom (pits)

    // ---- solid ground: rectangles of one kind ('#' ground, '~' ice, 'o' jelly, 'L' treetop) ----
    eng.solids = keep(phys.add.staticGroup());
    eng.thin = keep(phys.add.staticGroup());          // '=' thin platforms: solid from above only
    const rects = [];
    for (let r = 0; r < w.rows; r++) {
      for (let c = 0; c < w.cols;) {
        const k = w.grid[r][c];
        if (!SOLID[k] && k !== '=') { c++; continue; }
        let c2 = c;
        if (k !== 'B') while (c2 + 1 < w.cols && w.grid[r][c2 + 1] === k) c2++;   // (boulders stay one each: they can be smashed)
        // the same run on the row above? then just make that rectangle taller
        const up = k === 'B' || k === '=' ? null : rects.find(q => q.k === k && q.c0 === c && q.c1 === c2 && q.r1 === r - 1);
        if (up) up.r1 = r; else rects.push({ k, c0: c, c1: c2, r0: r, r1: r });
        c = c2 + 1;
      }
    }
    for (const q of rects) {
      const x = q.c0 * T, y = q.r0 * T, ww = (q.c1 - q.c0 + 1) * T;
      const hh = q.k === '=' ? 16 : (q.r1 - q.r0 + 1) * T;
      const z = s.add.zone(x + ww / 2, y + hh / 2, ww, hh);
      z.kind = q.k;
      if (q.k === '=') {
        eng.thin.add(z);
        Object.assign(z.body.checkCollision, { down: false, left: false, right: false });
      } else eng.solids.add(z);
      if (q.k === 'B') eng.boulders[q.c0 + ',' + q.r0] = z;
      keep(z);
    }

    // ---- moving platforms: bodies that Phaser moves (we tell them how fast, every step) ----
    eng.plats = w.plats.map((pl, i) => {
      const z = keep(s.add.zone(pl.x + PLAT_W / 2, pl.y + PLAT_H / 2, PLAT_W, PLAT_H));
      phys.add.existing(z);
      z.body.setAllowGravity(false).setImmovable(true);
      Object.assign(z.body.checkCollision, { down: false, left: false, right: false });   // stand on top, jump up through
      z.index = i;
      return z;
    });

    // ---- the hero ----
    eng.hero = keep(s.add.zone(p.x + PW / 2, p.y + PH / 2, PW, PH));
    phys.add.existing(eng.hero);
    eng.hero.body.setAllowGravity(false).setCollideWorldBounds(true);
    eng.hero.body.setMaxVelocity(2000, 2000);
    // what the hero is standing on (filled in by the colliders during a step)
    const under = (h, thing) => { if (h.body.touching.down || h.body.blocked.down) eng.under = thing; };
    phys.add.collider(eng.hero, eng.solids, under);
    phys.add.collider(eng.hero, eng.thin, under);
    phys.add.collider(eng.hero, eng.plats, under);

    // ---- critters: little bodies that walk; the hero touching one is an "overlap" ----
    eng.critters = w.critters.map((cr) => {
      const z = keep(s.add.zone(cr.x + cr.w / 2, cr.y + cr.h / 2, cr.w, cr.h));
      phys.add.existing(z);
      z.body.setAllowGravity(false);
      z.cr = cr;
      return z;
    });
    phys.add.collider(eng.critters, eng.solids);
    phys.add.overlap(eng.hero, eng.critters, (h, z) => { if (z.cr.alive) eng.touchCritters.push(z.cr); });

    // ---- things you touch: goodies, chests, lanterns, springs, thorns, the balloon ----
    const sensor = (x, y, ww, hh, onTouch) => {
      const z = keep(s.add.zone(x + ww / 2, y + hh / 2, ww, hh));
      phys.add.existing(z, true);
      phys.add.overlap(eng.hero, z, onTouch);
      return z;
    };
    w.stars.forEach(st => sensor(st.x - 20, st.y - 20, 40, 40, () => eng.touch.stars.push(st)));
    w.chests.forEach(ch => sensor(ch.x - 26, ch.y - 44, 52, 44, () => eng.touch.chests.push(ch)));
    w.flags.forEach((f, i) => sensor(f.x - 22, f.y - 120, 44, 120, () => eng.touch.flags.push(i)));
    w.springs.forEach(sp => sensor(sp.x, sp.y + 6, sp.w, sp.h - 6, () => eng.touch.springs.push(sp)));
    for (let r = 0; r < w.rows; r++) for (let c = 0; c < w.cols; c++) {
      if (w.grid[r][c] === '^') sensor(c * T + 8, r * T + 20, T - 16, T - 20, () => { eng.touch.thorn = { x: c * T + T / 2, y: r * T + T }; });
    }
    sensor(w.goal.x - 30, w.goal.y - 210, 60, 210, () => { eng.touch.goal = true; });
    eng.touch = { stars: [], chests: [], flags: [], springs: [], thorn: null, goal: false };
    eng.touchCritters = [];
    syncHero();
  }

  // The hero was put somewhere new (start, lantern, test): move its Phaser body there too.
  function syncHero() {
    if (!eng.hero || eng.builtFor !== world) return;
    eng.hero.body.reset(p.x + PW / 2, p.y + PH / 2);
    eng.hero.body.setVelocity(p.vx || 0, p.vy || 0);
  }

  // A cracked boulder was smashed: take its body out of the world.
  function removeBoulder(c, r) {
    const z = eng.boulders && eng.boulders[c + ',' + r];
    if (z) { z.destroy(); delete eng.boulders[c + ',' + r]; }
  }

  // ONE STEP OF THE GAME WORLD.
  //  1) we decide how fast the hero wants to go (the feel: same rules as always),
  //  2) we tell the platforms and critters where to go,
  //  3) Phaser moves everything and sorts out the bumps,
  //  4) we read back where the hero ended up and what it's standing on.
  function stepWorld(w, inp, dt, ev) {
    const b = eng.hero.body;
    const wasGround = p.onGround, fallSpeed = p.vy;
    // ---- 1) platforms: speed = the distance to where they should be next step ----
    updatePlats(w, clock);
    for (const z of eng.plats) {
      const pl = w.plats[z.index];
      z.body.setVelocity((pl.x - z.body.x) / dt, (pl.y - z.body.y) / dt);
    }
    // ---- 2) the hero's speed (no moving yet) ----
    stepHero(w, p, inp, dt, cfg, ev);
    // riding a platform: go up and down with it (so you stay on it on the way down)
    const ride = p.onGround && p.plat >= 0 ? p.plat : -1;    // riding a platform (and not jumping off it)
    if (ride >= 0) p.vy = eng.plats[ride].body.velocity.y;
    else if (p.onGround && p.vy >= 0) p.vy = 30;            // a gentle push down keeps you on the ground
    const carry = ride >= 0 ? eng.plats[ride].body.velocity.x : 0;   // ...and sideways with it
    b.setVelocity(p.vx + carry, p.vy);
    // critters walk; they turn round at walls, ledges and thorns (critters are careful)
    for (const z of eng.critters) {
      const cr = z.cr;
      if (!cr.alive) { z.body.setVelocity(0, 0); z.body.enable = false; continue; }
      const front = cr.dir > 0 ? cr.x + cr.w + 1 : cr.x - 1, c = Math.floor(front / T);
      const rBody = Math.floor((cr.y + cr.h - 4) / T), rFeet = Math.floor((cr.y + cr.h + 4) / T);
      if (isSolid(w, c, rBody) || !STAND[tileAt(w, c, rFeet)] || tileAt(w, c, rBody) === '^' || z.body.blocked.left || z.body.blocked.right) cr.dir *= -1;
      z.body.setVelocity(cr.dir * critterSpeed, 0);
    }
    // ---- 3) Phaser: move + bump ----
    eng.under = null;
    eng.touch = { stars: [], chests: [], flags: [], springs: [], thorn: null, goal: false };
    eng.touchCritters = [];
    eng.world.singleStep();
    // ---- 4) read back ----
    p.x = b.x; p.y = b.y; p.vx = b.velocity.x - (b.blocked.left || b.blocked.right ? 0 : carry); p.vy = b.velocity.y;
    for (const z of eng.critters) { z.cr.x = z.body.x; z.cr.y = z.body.y; }
    for (const z of eng.plats) { const pl = w.plats[z.index]; pl.px = pl.x; pl.py = pl.y; pl.x = z.body.x; pl.y = z.body.y; }
    p.onGround = !!eng.under && p.vy >= 0;
    p.plat = -1;
    // standing on a moving platform? (feet right on its top, and not jumping off it)
    for (const z of eng.plats) {
      const pb = z.body;
      if (b.right > pb.left && b.left < pb.right && Math.abs(b.bottom - pb.top) <= 3 && b.velocity.y >= pb.velocity.y - 5) { p.onGround = true; p.plat = z.index; eng.under = z; }
    }
    // still over the platform we were riding: stay right on top of it (it may have gone down a bit faster than we fell)
    if (ride >= 0 && !(b.blocked.down || b.blocked.up)) {
      const z = eng.plats[ride], pb = z.body;
      if (b.right > pb.left && b.left < pb.right && b.bottom > pb.top - 12) {
        b.reset(b.center.x, pb.top - PH / 2); b.setVelocity(p.vx, pb.velocity.y);
        p.y = b.y; p.onGround = true; p.plat = ride; eng.under = z;
      }
    }
    p.groundTile = eng.under ? (eng.under.kind || '=') : '.';
    if (b.blocked.up || b.touching.up) { p.jumping = false; p.boost = false; }
    if (p.onGround) {
      p.vy = 0; p.jumping = false; p.boost = false;
      if (!wasGround && ev.land) ev.land(fallSpeed);
    }
    if (wasGround && !p.onGround && p.vy >= 0) p.coyote = cfg.coyote;   // walked off a ledge: coyote time starts now
    // bouncy jelly blocks
    if (p.onGround && p.groundTile === 'o') {
      p.vy = -(inp.jumpHeld ? PHYS.jellyHoldV : PHYS.jellyV);
      p.boost = true; p.jumping = false; p.onGround = false; p.coyote = 0; p.buffer = 0;
      if (ev.jelly) ev.jelly(Math.floor((p.x + p.w / 2) / T), Math.floor((p.y + p.h + 4) / T));
    }
    // springs (landing on OR walking into them)
    for (const sp of eng.touch.springs) {
      if (p.vy < 0 && !p.onGround && sp.squish > 0.5) continue;
      p.vy = -PHYS.springV; p.boost = true; p.jumping = false;
      p.onGround = false; p.plat = -1; p.coyote = 0; p.buffer = 0;
      sp.squish = 1;
      if (ev.spring) ev.spring(sp);
    }
    if (!p.onGround) b.setVelocityY(p.vy);
  }

  // The hero's feel: how fast it wants to go this step (Phaser does the moving).
  // The same rules as stepPlayer() below, without the moving part.
  function stepHero(w, p, inp, dt, cfg, ev) {
    if (p.rollCool > 0) p.rollCool -= dt;
    if (inp.rollPressed && p.roll <= 0 && p.rollCool <= 0 && (p.onGround || !p.airRoll)) {
      p.roll = PHYS.rollTime; p.rollCool = PHYS.rollTime + PHYS.rollCool;
      if (!p.onGround) { p.airRoll = true; p.vy = Math.min(p.vy, 60); }
      if (ev.roll) ev.roll();
    }
    if (p.onGround) p.airRoll = false;
    if (p.roll > 0) {
      p.roll -= dt;
      p.vx = p.face * PHYS.rollV;
      const fc = Math.floor((p.face > 0 ? p.x + p.w + 4 : p.x - 4) / T);
      for (let r = Math.floor(p.y / T); r <= Math.floor((p.y + p.h - 1) / T); r++) {
        if (tileAt(w, fc, r) === 'B' && ev.smash) ev.smash(fc, r);
      }
    }
    runJumpGlide(w, p, inp, dt, cfg, ev);
  }

  // ---------------------------------------------------------------
  // Game state
  // ---------------------------------------------------------------
  let world, theme, p, cfg, cam, fx, popups, heroDef;
  let got, treasure, cp, hearts, maxHearts, tries, finished, bonks, critterSpeed;
  let resume = null; // after "Nice try!", Again continues from the last flag
  let clock = 0;     // seconds played in this level (the moving platforms follow it)
  const bot = { on: false, fast: 1 };
  let ouchLog = [];                     // (playtest robot: every bump + fall this go, see logOuch())   // the test robot (see "The test robot" below)

  function heroUnlocked(g, h) { return h.id === 'monkey' || g.isUnlocked('hero-' + h.id); }
  function pickedHero(g) {
    const id = g.save.data.hero || 'monkey';
    return HEROES.find(h => h.id === id && heroUnlocked(g, h)) || HEROES[0];
  }
  // Best results per level live in g.save.data.best = { forest: {stars: n, treasure: true}, ... }
  function totals(g) {
    const best = g.save.data.best || {};
    let stars = 0, chests = 0;
    for (const k in best) { stars += best[k].stars || 0; chests += best[k].treasure ? 1 : 0; }
    return { stars, chests };
  }
  function checkUnlocks(g) {
    const t = totals(g);
    const done = id => g.save.levels[id] && g.save.levels[id].done;
    if (done('forest')) g.unlock('hero-frog', 'Pip the frog!');
    if (t.stars >= 30) g.unlock('hero-bunny', 'Bun the bunny!');
    if (t.chests >= 2) g.unlock('hero-fox', 'Rusty the fox!');
    if (t.chests >= 4) g.unlock('hero-panda', 'Bao the panda!');
  }

  function setup(g, level) {
    const def = level || LEVELS[0];
    world = buildWorld(def, g.difficulty);
    theme = WORLDS[def.world];
    document.body.style.setProperty('--ar-bg', theme.bg);
    heroDef = pickedHero(g);
    cfg = { coyote: g.pick(0.15, 0.1, 0.08), buffer: g.pick(0.18, 0.12, 0.1) };
    critterSpeed = g.pick(35, 60, 90);
    maxHearts = g.pick(5, 3, 3);
    hearts = maxHearts;
    tries = g.pick(Infinity, 3, 2);         // extra goes before "Nice try!"
    got = 0; treasure = false; cp = -1; finished = false; bonks = 0;
    clock = 0; ouchLog = []; bot.plan = null; bot.wi = 0; bot.best = -Infinity; bot.bestAt = 0;
    // a world's second level plays the same song a step higher and a touch faster
    if (def.two) g.music.mood({ key: 2, tempo: 1.04 });
    fx = new Arcade.Particles();
    popups = [];
    updatePlats(world, 0);
    p = newPlayer(world.start.x, world.start.y);
    bootPhaser();
    buildPhaser(world);         // the level's Phaser bodies (if Phaser is ready; otherwise the first step does it)
    // continue after a "Nice try!" from the last flag, keeping stars found
    if (resume && resume.id === def.id) {
      cp = resume.cp;
      world.flags.forEach((f, i) => { f.on = i <= cp; });
      resume.stars.forEach(i => { if (world.stars[i]) { world.stars[i].got = true; got++; } });
      if (resume.treasure) { treasure = true; world.chests.forEach(c => { c.open = true; }); }
      placeAtCheckpoint();
    }
    resume = null;
    cam = { x: 0, y: 0, look: 0 };
    snapCamera();

    // ---- hooks for automated tests ----
    window.__jungleState = () => ({
      x: p.x, y: p.y, vx: p.vx, vy: p.vy, onGround: p.onGround, onPlatform: p.plat >= 0,
      stars: got, starsTotal: world.starsTotal, hearts, maxHearts, tries, checkpoint: cp,
      treasure, finished, dead: p.dead > 0, invuln: p.invuln, face: p.face,
      level: { id: def.id, width: world.width, height: world.height, cols: world.cols, rows: world.rows },
      cam: { x: cam.x, y: cam.y }, time: g.time, clock, inWind: !!p.inWind, gliding: p.gliding,
      lanterns: world.flags.length, dark: world.def.dark || 0, difficulty: g.difficulty, bot: bot.on, botSpot: bot.wi, botLog: bot.log,
      ouches: ouchLog.slice(), oneThumb: !!g.oneThumb, goalX: world.goal.x,
    });
    // test-only: let the robot play. route = [[column, row], ...] tiles to stand on, in order
    // (none = head straight for the balloon); fast = how many game steps per step.
    // on = 'kid': the PRETEND CHILD of the playtest robot (tools/playtest.py; see kidPlan() below); seed = its dice
    window.__jungleBot = (on, fast, route, seed) => {
      bot.kid = on === 'kid'; bot.little = !!g.little; bot.rng = seed || 11; bot.kt = { still: 0, press: 0, wait: 0.6, hold: 0, next: 1 };
      bot.on = !!on; bot.fast = on ? (fast || 1) : 1; bot.plan = null; bot.wi = 0; bot.best = -Infinity; bot.bestAt = clock; bot.seed = 7;
      bot.route = (route || []).map(([c, r]) => ({ x: c * T + T / 2, y: (r + 1) * T }));
    };
    window.__jungleTest = {
      // test-only: jump the hero somewhere (world px, top-left of the hit box)
      teleport(x, y) { p.x = x; p.y = y; p.vx = 0; p.vy = 0; p.plat = -1; syncHero(); snapCamera(); },
      engine: () => eng,          // test-only: the Phaser world
      // test-only: run n real steps with made-up buttons (inp(t) -> control), return where the hero was
      steps(n, inp) { const out = []; for (let i = 0; i < n; i++) { clock += 1 / 120; stepWorld(world, inp(i / 120), 1 / 120, {}); out.push([p.x, p.y, p.onGround]); } return out; },
      world: () => world,
      botLog() { bot.log = []; },     // (debugging the robot: keep a list of its decisions)
      botSpeed(n) { bot.fast = n; },  // (slow the robot down for a screenshot, then speed it up again)
      player: () => p,
    };
  }

  function placeAtCheckpoint() {
    const f = cp >= 0 ? world.flags[cp] : null;
    const x = f ? f.x - PW / 2 : world.start.x, y = f ? f.y - PH : world.start.y;
    Object.assign(p, { x, y, vx: 0, vy: 0, plat: -1, onGround: false, jumping: false, boost: false, coyote: 0, buffer: 0 });
    syncHero();
  }

  function snapCamera() {
    cam.x = math.clamp(p.x + PW / 2 - W / 2, 0, Math.max(0, world.width - W));
    cam.y = math.clamp(p.y + PH / 2 - H * 0.56, 0, Math.max(0, world.height - H));
  }

  function popup(text, x, y, color = '#ffd166') { popups.push({ text, x, y, t: 0, color }); }

  // ---------------------------------------------------------------
  // Update (dt = 1/120 s)
  // ---------------------------------------------------------------
  // (The test robot can ask for several steps at once, to play in fast-forward.)
  function update(g, dt) { for (let i = 0; i < (bot.fast || 1); i++) tick(g, dt); }
  function tick(g, dt) {
    const inp = g.input;
    clock += dt;
    fx.update(dt);
    for (const q of popups) { q.t += dt; q.y -= 50 * dt; }
    popups = popups.filter(q => q.t < 1);
    for (const s of world.springs) s.squish = Math.max(0, s.squish - dt * 3);
    for (const k in world.bounce) { world.bounce[k] -= dt * 3; if (world.bounce[k] <= 0) delete world.bounce[k]; }
    if (!eng.ready) return;                                   // (Phaser is still starting up: a split second at most)
    if (eng.builtFor !== world) buildPhaser(world);
    if (finished && world.goal) world.goal.lift = (world.goal.lift || 0) + dt * 70;   // up, up and away!

    // poofed (fell / out of hearts): wait a moment, then pop back at the flag
    if (p.dead > 0) {
      p.dead -= dt;
      if (p.dead <= 0) {
        placeAtCheckpoint();
        bot.lost = true;
        p.invuln = 1.5;
        snapCamera();
        fx.burst(p.x + PW / 2, p.y + PH / 2, { count: 18, shape: 'star', speed: 200, size: 12, gravity: 0, life: 0.6 });
        g.sfx('pop');
      }
      followCamera(dt);
      return;
    }

    // read the controls
    const wasWind = p.inWind;
    const control = finished ? { dir: 0, jumpHeld: false, jumpPressed: false, run: false } : bot.on ? (bot.kid && g.oneThumb ? thumbControl(g, kidThumb(dt)) : botControl(dt)) : g.oneThumb ? thumbControl(g) : {
      dir: (inp.down('ArrowRight', 'KeyD') ? 1 : 0) - (inp.down('ArrowLeft', 'KeyA') ? 1 : 0),
      jumpHeld: inp.down('Space', 'ArrowUp', 'KeyW'),
      jumpPressed: inp.hit('Space', 'ArrowUp', 'KeyW'),
      run: inp.down('ShiftLeft', 'ShiftRight'),
      rollPressed: inp.hit('KeyX', 'KeyZ') || (inp.hit('ArrowDown', 'KeyS') && Math.abs(p.vx) > 60),
    };

    // (game feel, Nov 22: the hero's squash & stretch is the kit's springy g.juice.squash('hero'):
    //  .hit(-0.25) = stretch tall on a jump, .hit(0.3) = squash flat on a landing; it wobbles back by itself)
    const sq = g.juice.squash('hero');
    stepWorld(world, control, dt, {
      jump() { g.sfx('jump'); sq.hit(-0.25); dust(g, p.x + PW / 2, p.y + PH, 6, -p.face); },
      land(impact) {
        if (impact > 350) {
          const big = impact > 700;
          g.sfx(big ? 'thud' : 'land');                   // a soft thump (a bigger one from high up)
          sq.hit(big ? 0.34 : 0.24);
          dust(g, p.x + PW / 2, p.y + PH, big ? 12 : 7);
        }
      },
      smash(c, r) { g.achieve('smash'); breakBlock(g, c, r); popup('Smash!', c * T + T / 2, r * T, '#ffd166'); },
      roll() { g.sfx('whoosh'); sq.hit(0.2); dust(g, p.x + PW / 2, p.y + PH, 5, -p.face); },
      spring() { g.sfx('spring'); sq.hit(-0.35); g.juice.sparkle(p.x + PW / 2, p.y + PH, { to: fx, count: 6, colors: ['#ffd166', '#ffffff'] }); },
      jelly(c, r) {
        g.tone(330, 0.2, { slide: 660, type: 'sine', vol: 0.3 });
        world.bounce[c + ',' + r] = 1;
        sq.hit(0.3);
        g.juice.dust(p.x + PW / 2, p.y + PH, { to: fx, count: 6, colors: ['#ff6fb5', '#ffd6ec', '#fff'], size: 12 });
      },
    });

    // squash & stretch (drawn by drawHero); running animation
    p.sx = sq.sx; p.sy = sq.sy;
    p.runPhase += Math.abs(p.vx) * dt / 16;
    if (p.invuln > 0) p.invuln -= dt;
    if (p.hurtT > 0) p.hurtT -= dt;
    if (p.inWind && !wasWind) g.sfx('whoosh');           // stepping into the wind
    // standing in the wind without flying? After a moment, a little reminder pops up.
    world.windWait = p.inWind && p.onGround ? (world.windWait || 0) + dt : 0;
    if (world.windWait > 1.5) { world.windWait = -1.5; popup('Hold jump!', p.x + PW / 2, p.y - 30, '#ffffff'); }
    if (p.onGround && p.groundTile === '~' && Math.abs(p.vx) > 150 && Math.random() < dt * 20) {
      fx.burst(p.x + PW / 2, p.y + PH, { count: 1, colors: ['#ffffff', '#d6f3ff'], speed: 60, size: 7, life: 0.4, gravity: 0 });
    }

    if (!finished) {
      critterTouches(g, dt);
      // thorns (Phaser told us if we touched one)
      if (eng.touch.thorn) hurt(g, eng.touch.thorn.x);
      collect(g);
      // fell in a pit?
      if (p.y > world.height + 40) fellInPit(g);
    }
    followCamera(dt);
  }

  // soft dust puffs at the hero's feet (the kit's g.juice.dust, in the world: `to: fx`); dir = puff sideways
  function dust(g, x, y, n, dir) {
    const col = theme.dark ? ['#b9a8ff', '#8a78d0'] : world.def.world === 'snow' ? ['#ffffff', '#e2f1ff'] : ['#ffffff', '#f0e2c8'];
    g.juice.dust(x, y, { to: fx, count: n, colors: col, dir: dir || 0, size: 13 });
  }

  function breakBlock(g, c, r) {
    world.grid[r][c] = '.';
    removeBoulder(c, r);
    g.sfx('thud');
    fx.burst(c * T + T / 2, r * T + T / 2, { count: 14, shape: 'square', colors: [theme.block, '#ffffff', INK], speed: 260, size: 12, gravity: 900, life: 0.8 });
    g.juice.dust(c * T + T / 2, r * T + T / 2, { to: fx, count: 6, colors: ['#ffffff', theme.block], size: 18 });
    g.juice.stop(0.04); g.juice.shake(5);                 // a tiny pause + a little jiggle: SMASH!
  }

  // Critters walk by themselves (Phaser moves them, see stepWorld). Here: what happens when the
  // hero touches one (Phaser's overlap told us which ones).
  function critterTouches(g, dt) {
    for (const cr of world.critters) {
      if (!cr.alive) { cr.poof = Math.max(0, cr.poof - dt); continue; }
      cr.squish = Math.max(0, (cr.squish || 0) - dt * 3);
    }
    for (const cr of eng.touchCritters) {
      if (!cr.alive) continue;
      const feet = p.y + p.h;
      if (p.roll > 0) {
        // rolled into it: boop! it poofs into sparkles
        cr.alive = false; cr.poof = 0.4; bonks++; g.achieve('boop');
        g.sfx('poof');
        g.juice.poof(cr.x + cr.w / 2, cr.y + cr.h / 2, { to: fx });     // (game feel: a poof + a tiny pause)
        g.juice.stop(0.05);
        popup('Boop!', cr.x + cr.w / 2, cr.y - 10, '#ffd166');
      } else if (p.vy > 0 && feet - cr.y < 20) {
        // landed on top: critters are bouncy, so you just bounce off (they wobble)
        p.vy = -PHYS.jumpV * 0.9; p.jumping = true; p.boost = false;
        eng.hero.body.setVelocityY(p.vy);
        g.juice.squash('hero').hit(-0.28); cr.squish = 1;
        g.juice.dust(cr.x + cr.w / 2, cr.y, { to: fx, count: 5, colors: ['#ffffff', '#fff3b0'], size: 11 });
        g.tone(260, 0.18, { slide: 620, type: 'sine', vol: 0.3 });
        popup('Boing!', cr.x + cr.w / 2, cr.y - 10, '#ffffff');
      } else {
        hurt(g, cr.x + cr.w / 2);
      }
    }
  }

  // (the playtest robot counts where the bumps + falls happen: tools/playtest.py)
  function logOuch(k) { ouchLog.push({ k, x: Math.round(p.x + PW / 2), y: Math.round(p.y + PH), cp, t: +clock.toFixed(1) }); }

  function hurt(g, fromX) {
    if (p.invuln > 0 || p.dead > 0) return;
    logOuch('ouch');
    hearts--;
    g.sfx('hurt');
    p.invuln = 1.4; p.hurtT = 0.4;
    const away = Math.sign(p.x + PW / 2 - fromX) || -p.face;
    p.vx = away * 330; p.vy = -560; p.boost = true; p.jumping = false; p.onGround = false; p.plat = -1;
    eng.hero.body.setVelocity(p.vx, p.vy);
    fx.burst(p.x + PW / 2, p.y + PH / 2, { count: 10, colors: ['#ff6b6b', '#ffffff'], speed: 200, size: 9, life: 0.5 });
    // (game feel: a tiny pause, a soft pink flash, a little jiggle, the hero squashes; the hearts boing)
    g.juice.stop(0.06); g.juice.flash('#ff8fab', 0.22); g.juice.shake(5); g.juice.squash('hero').hit(0.3); g.juice.pop('hearts', 0.4);
    if (hearts <= 0) outOfHearts(g);
  }

  function fellInPit(g) {
    logOuch('pit');
    g.sfx('whoosh');
    if (g.difficulty !== 'easy') hearts--;     // Easy: pits don't cost a heart
    if (hearts <= 0) outOfHearts(g);
    else poof(g);
  }

  // Out of hearts: Easy just carries on; otherwise use up one "try".
  function outOfHearts(g) {
    if (tries !== Infinity) tries--;
    if (tries < 0) {
      // "Nice try!" — remember progress so Again starts at the last flag
      resume = { id: world.def.id, cp, stars: world.stars.map((s, i) => s.got ? i : -1).filter(i => i >= 0), treasure };
      finished = true;
      p.dead = 99;
      g.finish({
        win: false, title: 'Nice try!', score: score(g), stars: 0,
        lines: [goodieName() + ': ' + got + ' / ' + world.starsTotal, cp >= 0 ? 'Again starts at your last lantern!' : 'You can do it!'],
        next: false, delay: 900,
      });
      return;
    }
    hearts = maxHearts;
    poof(g);
  }

  function poof(g) {
    p.dead = 0.8;
    const px = p.x + PW / 2, py = math.clamp(p.y + PH / 2, 0, world.height - 10);
    fx.burst(px, py, { count: 14, colors: ['#ffffff', '#ffd6ec', '#bde0fe'], speed: 140, size: 16, gravity: -60, life: 0.7 });
    fx.burst(px, py, { count: 10, colors: ['#ffd166', '#ffffff'], speed: 240, size: 10, gravity: 40, life: 0.6, shape: 'star' });
  }

  const MAGNET = 110;                  // one thumb: goodies this close (px) come to the hero
  function collect(g) {
    // (Phaser's overlaps told us what the hero touched this step: eng.touch)
    // One thumb (playtest, Nov 23): the hero can't steer to goodies, so goodies close by fly to him (a magnet).
    const near = g.oneThumb && p.dead <= 0 ? world.stars.filter(s => !s.got && Math.hypot(s.x - (p.x + PW / 2), s.y - (p.y + PH / 2)) < MAGNET) : [];
    for (const s of near) g.juice.sparkle((s.x + p.x + PW / 2) / 2, (s.y + p.y + PH / 2) / 2, { to: fx, count: 5, size: 8 });
    for (const s of eng.touch.stars.concat(near)) {
      if (s.got) continue;
      s.got = true; got++;
      g.sfx('coin');
      g.juice.sparkle(s.x, s.y, { to: fx, count: 9, size: 10 });     // (game feel: a sparkle burst + the counter boings)
      g.juice.pop('goodies', 0.3);
      if (got === world.starsTotal) { popup('Got them all!', s.x, s.y - 30, '#06d6a0'); g.sfx('star'); g.music.stinger('streak'); }
    }
    for (const c of eng.touch.chests) {
      if (c.open) continue;
      c.open = true; treasure = true; g.achieve('treasure');
      g.sfx('power');
      popup('Treasure!', c.x, c.y - 70, '#ffd166');
      g.music.stinger('treasure');          // a twinkly jingle on top of the song
      fx.burst(c.x, c.y - 30, { count: 30, shape: 'star', speed: 280, size: 14, gravity: 250, life: 1 });
      g.juice.sparkle(c.x, c.y - 30, { to: fx, count: 6, size: 16 }); g.juice.stop(0.07); g.juice.flash('#fff3b0', 0.25);
    }
    eng.touch.flags.forEach((i) => {
      const f = world.flags[i];
      if (f.on) return;
      // light up this flag (and any earlier ones you skipped)
      for (let j = 0; j <= i; j++) world.flags[j].on = true;
      cp = Math.max(cp, i);
      g.sfx('star');
      g.juice.sparkle(f.x + 20, f.y - 100, { to: fx, count: 14, colors: ['#ffd166', '#ffb703', '#ffffff'], size: 11 });
    });
    // inside a secret room the music goes soft and muffled, like it's behind the wall
    const inside = tileAt(world, Math.floor((p.x + PW / 2) / T), Math.floor((p.y + PH / 2) / T)) === 'F';
    if (inside !== !!world.inSecret) { world.inSecret = inside; g.music.mood({ muffle: inside ? 0.6 : 0 }); }
    if (!finished && eng.touch.goal) win(g);
  }

  const goodieName = () => { const n = GOODIES[world.def.world] || 'goodies'; return n[0].toUpperCase() + n.slice(1); };
  function score(g) { return got * 100 + (treasure ? 1000 : 0) + bonks * 50 + Math.max(0, hearts) * 100 + (finished ? 500 : 0); }

  function win(g) {
    g.achieve('world');
    if (got === world.starsTotal) g.achieve('all-goodies');
    if (hearts === maxHearts) g.achieve('no-ouch');
    if (world.def.id === 'candy') g.achieve('candy');
    // (this level counts as done even though the kit only writes it down in g.finish, below)
    if (LEVELS.every(l => l.id === world.def.id || (g.save.levels[l.id] || {}).done)) g.achieve('tour');
    if (bonks === 0) g.achieve('gentle');
    finished = true;
    const frac = world.starsTotal ? got / world.starsTotal : 1;
    // 1 star = finished, 2 = lots of stars, 3 = (nearly) all stars AND the treasure
    // (one thumb: the hero walks by himself, so goodies off the path are hard to reach. The playtest
    // robot's pretend little kids picked up 10-35% and always got 1 star: so 2 stars at a quarter.)
    let rating = 1;
    if (frac >= (g.oneThumb ? 0.25 : g.pick(0.5, 0.7, 0.8))) rating = 2;
    if (treasure && frac >= (g.oneThumb ? 0.5 : g.pick(0.8, 1, 1))) rating = 3;
    const id = world.def.id;
    const best = g.save.data.best = g.save.data.best || {};
    const b = best[id] = best[id] || { stars: 0, treasure: false };
    b.stars = Math.max(b.stars, got);
    b.treasure = b.treasure || treasure;
    g.store();
    g.sfx('star');
    g.particles.burst(W / 2, 140, { count: 50, shape: 'star', speed: 360, size: 16 });
    g.finish({
      win: true, score: score(g), stars: rating, title: 'Hooray!',
      lines: [
        goodieName() + ': ' + got + ' / ' + world.starsTotal,
        treasure ? 'You found the treasure!' : 'A treasure is hidden somewhere…',
      ],
      next: true, delay: 1400,
    });
    setTimeout(() => checkUnlocks(g), 1700);
  }

  // ---------------------------------------------------------------
  // The test robot (only for the automated tests, see tests/test_jungle.py).
  // It plays with the same buttons a child has. Whenever it stands on the
  // ground it tries a handful of moves on a PRETEND copy of the hero (walk a
  // bit, hop, jump, jump + glide, roll, wait...), using the very same physics
  // function as the real game, and picks the move that ends up closest to
  // where it wants to go without touching thorns, pits or critters.
  // ---------------------------------------------------------------
  const BOT_MOVES = [
    { dir: 1, T: 0.12 },                    // walk on a little
    { dir: 1, T: 0.12, jump: 'held' },      // walk on with jump held down (jelly then bounces you extra high)
    { dir: 1, jump: 'tap' },                // a little hop
    { dir: 1, jump: 'rise' },               // a full jump
    { dir: 1, jump: 'hold' },               // jump, then glide with the leaf
    { dir: 0, jump: 'hold' },               // straight up (lifts, wind)
    { dir: 0, jump: 'hold', then: 1, T: 0.9 },   // ...and up for a moment, then drift sideways
    { dir: 0, jump: 'hold', then: 1, T: 1.6 },
    { dir: 0, jump: 'hold', then: 1, T: 2.4 },
    { dir: 1, roll: true, T: 0.45 },        // roll (smashes boulders, boops critters)
    { dir: 0, T: 0.2 },                     // wait
    { dir: 1, jump: 'rise', back: 0.3 },    // step back first, then jump (to get onto something overhead)
    { dir: 1, jump: 'hold', back: 0.3 },
    { dir: 1, jump: 'rise', back: 0.7 },
    { dir: 1, jump: 'hold', back: 0.7 },
  ];
  // the buttons a move presses, `t` seconds after it started
  function botInput(m, t, q, dt) {
    if (m.back) {                            // the run-up: walk away for a moment
      if (t < m.back) return { dir: -m.side, run: false, jumpPressed: false, jumpHeld: false, rollPressed: false };
      t -= m.back;
    }
    const dir = m.then && t >= m.T ? m.then * m.side : m.dir * m.side;
    return {
      dir, run: false,
      jumpPressed: !!m.jump && m.jump !== 'held' && t < dt * 1.5,
      jumpHeld: m.jump === 'hold' || m.jump === 'held' || (m.jump === 'rise' && (q.vy < 0 || t < 0.1)) || (m.jump === 'tap' && t < 0.08),
      rollPressed: !!m.roll && t < dt * 1.5,
    };
  }
  // where the robot is heading: the next spot of its route, or the balloon
  function botTarget() {
    const r = bot.route || [];
    return bot.wi < r.length ? r[bot.wi] : { x: world.goal.x, y: world.goal.y, goal: true };
  }
  const botDist = (q, tg) => Math.abs(q.x + PW / 2 - tg.x) + Math.abs(q.y + PH - tg.y) * (tg.goal ? 0.3 : 1.5);
  // try one move on a pretend hero; returns how good the spot is where it ends (bigger = better)
  function botTry(m, tg, dt) {
    const q = Object.assign({}, p);
    const w = Object.create(world);          // a pretend world: its own platforms, springs and (if smashed) boulders
    w.plats = world.plats.map(pl => Object.assign({}, pl));
    w.springs = world.springs.map(sp => Object.assign({}, sp));
    const ev = { smash(c, r) { if (w.grid === world.grid) w.grid = world.grid.map(row => row.slice()); w.grid[r][c] = '.'; } };
    let t = 0, tt = clock;
    for (let i = 0; i < 600; i++) {
      tt += dt; updatePlats(w, tt);
      stepPlayer(w, q, botInput(m, t, q, dt), dt, cfg, ev);
      t += dt;
      if (q.y > world.height + 40 || thornHit(w, q)) return -1e6;
      for (const cr of world.critters) {
        if (!cr.alive || !overlap(q, cr.x + cr.dir * critterSpeed * t * 0.5 - 8, cr.y, cr.w + 16, cr.h)) continue;
        if (q.roll > 0) continue;
        if (q.vy > 0 && q.y + q.h - cr.y < 20) { q.vy = -PHYS.jumpV * 0.9; q.jumping = true; continue; }   // boing
        return -1e5;
      }
      if (t >= (m.T || 0.05) + (m.back || 0) && q.onGround) break;
    }
    return -botDist(q, tg) - (q.onGround ? 0 : 300);
  }
  function botControl(dt) {
    const r = bot.route || [];
    // standing on the next spot of the route (or on a later one)? Then head for the one after it.
    if (p.onGround) for (let i = bot.wi; i < r.length; i++) {
      if (Math.abs(p.x + PW / 2 - r[i].x) < 60 && Math.abs(p.y + PH - r[i].y) < 30) bot.wi = i + 1;
    }
    // popped back at a lantern (or fell a long way): carry on from the nearest spot of the route
    if (bot.lost) {
      bot.lost = false; bot.plan = null; bot.wi = 0;
      let best = Infinity;
      r.forEach((s, i) => { const d = botDist(p, s); if (d < best) { best = d; bot.wi = i; } });
    }
    let pl = bot.plan;
    if (pl && pl.t >= (pl.m.T || 0.05) + (pl.m.back || 0) + (pl.late || 0) && (p.onGround || pl.t > 5)) pl = bot.plan = null;   // that move is over
    if (!pl) {
      const tg = botTarget();
      const dx = tg.x - (p.x + PW / 2);
      const side = Math.sign(dx) || 1;
      let bestScore = -Infinity, bestMove = null;
      for (const m0 of BOT_MOVES) {
        const m = Object.assign({ side }, m0);
        const sc = botTry(m, tg, dt);
        if (sc > bestScore + 0.5) { bestScore = sc; bestMove = m; }
      }
      // Not getting anywhere for 3 seconds? Try something silly (a made-up dice roll picks it;
      // always the same "dice", so a test run goes the same way every time).
      if (bestScore > (bot.best || -Infinity) + 4 || bot.bestWi !== bot.wi) { bot.best = bestScore; bot.bestWi = bot.wi; bot.bestAt = clock; }
      if (clock - bot.bestAt > 3) {
        bot.seed = ((bot.seed || 7) * 1103515245 + 12345) & 0x7fffffff;
        const m = Object.assign({}, BOT_MOVES[bot.seed % BOT_MOVES.length], { side: (bot.seed >> 8) % 2 ? 1 : -1 });
        if (botTry(m, tg, dt) > -1e4) bestMove = m;                 // (as long as it is not an ouch)
        if (clock - bot.bestAt > 8) { bot.best = -Infinity; bot.lost = true; }   // really lost: pick the nearest spot of the route again
      }
      pl = bot.plan = { m: bestMove, t: 0 };
      if (bot.kid) kidPlan(pl, tg, dt);
      if (bot.log) bot.log.push([+clock.toFixed(2), bot.wi, Math.round(p.x), Math.round(p.y), Math.round(bestScore)]);   // (time, spot, where, how good)
    }
    let c;
    if (pl.late && pl.t < pl.late) {            // the pretend child is a moment late: still walking (or standing), no jump yet
      c = { dir: pl.m.back || pl.m.dir === 0 ? 0 : pl.m.side * pl.m.dir, run: false, jumpPressed: false, jumpHeld: false, rollPressed: false };
    } else {
      c = botInput(pl.m, pl.t - (pl.late || 0), p, dt);
      if (pl.letGo && pl.t - (pl.late || 0) > pl.letGo) c.jumpHeld = false;    // ...and let go of the leaf too soon
    }
    pl.t += dt;
    return c;
  }

  // ---------------------------------------------------------------
  // THE PRETEND CHILD (Nov 23, new plan point 5, part 2: the playtest robot, tools/playtest.py).
  // Big kids: the robot above picks a good move, then the child does it a bit sloppily: the jump
  // comes a moment late (still walking on), sometimes the leaf is let go too soon, sometimes it
  // picks the second-best move. Little kids play one thumb (kidThumb): the hero walks by himself
  // and stops at gaps; the child taps Jump a little while after he stops, sometimes holds it
  // (a glide), sometimes taps for no reason, and in the wind holds on for a while, then lets go.
  // The numbers are a guess at a child, so the table shows WHERE to look, not exact answers.
  // ---------------------------------------------------------------
  const KID = { late: [0.14, 0.24], letGo: [0.25, 0.4], second: [0.12, 0.2], react: [0.5, 0.9], tapsPerSec: 0.15 };
  function kidRnd() { bot.rng = (bot.rng * 1103515245 + 12345) & 0x7fffffff; return bot.rng / 0x7fffffff; }
  function kidPlan(pl, tg, dt) {
    const L = bot.little ? 1 : 0;
    // (sometimes the second-best move, as long as the robot thinks it isn't an ouch)
    if (kidRnd() < KID.second[L]) {
      const side = pl.m.side, ranked = BOT_MOVES.map(m0 => Object.assign({ side }, m0)).map(m => [botTry(m, tg, dt), m]).sort((a, b) => b[0] - a[0]);
      if (ranked[1] && ranked[1][0] > -1e4) pl.m = ranked[1][1];
    }
    if (pl.m.jump && pl.m.jump !== 'held') pl.late = kidRnd() * KID.late[L];
    if (pl.m.jump === 'hold' && kidRnd() < KID.letGo[L]) pl.letGo = 0.3 + kidRnd() * 1.2;
  }
  function kidThumb(dt) {
    const k = bot.kt, out = { held: false, pressed: false };
    if (k.hold > 0) {                                        // holding the button
      k.hold -= dt; out.held = true;
      if (!k.down) { out.pressed = true; k.down = true; }
      return out;
    }
    k.down = false;
    const stopped = p.onGround && Math.abs(p.vx) < 15;
    k.still = stopped || p.inWind ? k.still + dt : 0;
    k.next -= dt;
    let go = false;
    if (k.still > k.wait) go = true;                         // he stopped (a gap, thorns, the wind): jump!
    else if (k.next <= 0) { k.next = 1 / KID.tapsPerSec * (0.5 + kidRnd()); go = kidRnd() < 0.5; }   // a tap now and then, for no reason
    if (go) {
      k.still = 0; k.wait = KID.react[0] + kidRnd() * (KID.react[1] - KID.react[0]);
      const r = kidRnd();
      k.hold = p.inWind ? 1 + kidRnd() * 3 : r < 0.45 ? 0.12 : 0.3 + kidRnd() * 1.4;   // a tap, or held on (glide)
    }
    return out;
  }

  // ---------------------------------------------------------------
  // ONE THUMB (Nov 23, new plan point 4, part 3): just the Jump button (for little kids).
  // The hero walks to the right by itself and STOPS: at the edge of a gap, before thorns,
  // and in the wind. So a jump is always the child's own choice, never a surprise fall.
  // A jump always goes forward. A boulder or a critter in the way? The hero rolls into it
  // by itself (smash! boop!). The arrow keys still work, and they win.
  // ---------------------------------------------------------------
  // Is it safe to walk on at x? Look down that column from the hero's feet: something to stand
  // on before thorns or the bottom of the map (a moving platform there counts too).
  // deep = how many rows down to look (a long drop onto ground is fine: no fall damage).
  function safeAt(x, feetY, topY, deep) {
    const c = Math.floor(x / T);
    for (let r = Math.floor(topY / T); r * T < feetY; r++) if (tileAt(world, c, r) === '^') return false;   // thorns right in front
    const r0 = Math.floor((feetY + 1) / T);
    for (let r = r0; r < Math.min(world.rows, r0 + (deep || world.rows)); r++) {
      const t = tileAt(world, c, r);
      if (t === '^') return false;
      if (STAND[t]) return true;
    }
    return world.plats.some(pl => x > pl.x + 6 && x < pl.x + PLAT_W - 6 && pl.y > feetY - 8 && pl.y < feetY + 3 * T);
  }
  // near the top of a wind (the air above the hero's middle isn't wind any more)?
  function windTop() { return tileAt(world, Math.floor((p.x + PW / 2) / T), Math.floor((p.y + PH / 2 - T * 0.8) / T)) !== 'u'; }
  // a pretend glide to the right (jump held), with the robot's pretend physics: lands safely?
  let glideMemo = { at: -1, ok: false };
  function glideSafe() {
    if (Math.abs(clock - glideMemo.at) < 0.1) return glideMemo.ok;   // (abs: the clock starts at 0 again on a new go)
    const q = Object.assign({}, p), w = Object.create(world), dt = 1 / 120;
    w.plats = world.plats.map(pl => Object.assign({}, pl));
    w.springs = world.springs.map(sp => Object.assign({}, sp));
    let ok = false, tt = clock;
    for (let i = 0; i < 480; i++) {
      tt += dt; updatePlats(w, tt);
      stepPlayer(w, q, { dir: 1, jumpHeld: true, jumpPressed: false, run: false }, dt, cfg, {});
      if (q.y > world.height || thornHit(w, q)) break;
      if (q.onGround && !q.inWind) { ok = true; break; }
    }
    glideMemo = { at: clock, ok };
    return ok;
  }
  // In the air (one thumb): where does this way of steering land? A pretend fall with the robot's
  // pretend physics: true = on something safe (not thorns, not the bottom of the map).
  // (Playtest, Nov 23: a spring or a jelly block used to throw the hero right onto the thorns behind it.)
  let airMemo = { at: -1, ok: {} };      // (each way of steering remembered for 0.05 s)
  function landSafe(dir, held) {
    const key = dir + ':' + held;
    if (Math.abs(clock - airMemo.at) > 0.05) airMemo = { at: clock, ok: {} };   // (abs: the clock starts at 0 again on a new go)
    if (key in airMemo.ok) return airMemo.ok[key];
    const q = Object.assign({}, p), w = Object.create(world), dt = 1 / 120;
    w.plats = world.plats.map(pl => Object.assign({}, pl));
    w.springs = world.springs.map(sp => Object.assign({}, sp));
    let ok = false, tt = clock;
    for (let i = 0; i < 360; i++) {
      tt += dt; updatePlats(w, tt);
      stepPlayer(w, q, { dir, jumpHeld: held, jumpPressed: false, run: false }, dt, cfg, {});
      // (thorns with a safety margin: just skimming past them in the pretend fall is too close)
      if (q.y > world.height || thornHit(w, { x: q.x - 12, y: q.y, w: q.w + 24, h: q.h + 8 })) break;
      // a critter where we come down (from the side, not landing on its head)? Not safe either.
      const t = (i + 1) * dt;
      if (world.critters.some(cr => cr.alive && overlap(q, cr.x + cr.dir * critterSpeed * t - 6, cr.y, cr.w + 12, cr.h) && !(q.vy > 0 && q.y + q.h - cr.y < 20))) break;
      if (q.onGround || q.inWind) { ok = true; break; }
    }
    airMemo.ok[key] = ok;
    return ok;
  }
  // a roll from here to x: every bit of the way safe? (not just where it ends: thorns in between count)
  function rollSafe(from, to, feet) {
    const step = Math.sign(to - from) * 20;
    for (let x = from; step > 0 ? x <= to : x >= to; x += step) if (!safeAt(x, feet, p.y)) return false;
    return safeAt(to, feet, p.y);
  }

  function thumbControl(g, fake) {
    const inp = g.input;
    // (fake = the pretend child's Jump button, from the playtest robot: kidThumb())
    const jumpHeld = fake ? fake.held : inp.down('Space', 'ArrowUp', 'KeyW'), jumpPressed = fake ? fake.pressed : inp.hit('Space', 'ArrowUp', 'KeyW');
    const keys = fake ? 0 : (inp.down('ArrowRight', 'KeyD') ? 1 : 0) - (inp.down('ArrowLeft', 'KeyA') ? 1 : 0);
    const c = { dir: keys, jumpHeld, jumpPressed, run: false, rollPressed: fake ? false : inp.hit('KeyX', 'KeyZ') };
    if (keys) return c;                                         // (a keyboard: the child steers)
    const feet = p.y + PH, front = p.x + PW;
    if (!p.onGround) {
      p.thumbBack = false;
      // in the air: keep going forward. Riding the wind up: first all the way to the top, then
      // glide off to the right if that lands somewhere safe (a pretend glide checks it first),
      // and the leaf stays open until we land (the child may let go of the button).
      if (p.inWind && jumpHeld) { c.dir = windTop() && glideSafe() ? 1 : 0; if (c.dir) p.thumbGlide = true; }
      else c.dir = 1;
      if (p.thumbGlide) c.jumpHeld = true;
      // going to land on thorns or in a pit (a spring, a jelly block or a bounce threw us)? Steer to a safe
      // spot instead: keep going, stop, or come back, and open the leaf if that helps.
      if (!p.inWind && p.vy > -200 && !landSafe(c.dir, c.jumpHeld)) {
        const way = [[c.dir, true], [0, c.jumpHeld], [0, true], [-1, c.jumpHeld], [-1, true]].find(([d, h]) => landSafe(d, h));
        if (way) { c.dir = way[0]; c.jumpHeld = way[1]; }
      }

      return c;
    }
    p.thumbGlide = false;
    if (p.inWind) { p.thumbBack = false; c.dir = 0; return c; }   // the wind: hold jump to fly up
    // a wall too high to jump, and a wind just behind? Walk back into the wind (until we're in it).
    const fc = Math.floor((front + 4) / T), fr = Math.floor((feet - 1) / T);
    if ([1, 2, 3, 4].every(k => isSolid(world, fc, fr - k + 1))) {
      for (let k = 1; k <= 8; k++) if (tileAt(world, Math.floor(p.x / T) - k, fr) === 'u') p.thumbBack = true;
    }
    if (p.thumbBack) { c.dir = -1; return c; }
    const reach = PHYS.rollV * PHYS.rollTime * 0.8;
    // waiting, and a critter sneaks up from behind? Turn round and roll into it (boop!), then carry on.
    if (p.roll > 0 && p.face < 0) { c.dir = 0; return c; }
    const behind = world.critters.some(cr => cr.alive && cr.dir > 0 && cr.x + cr.w > p.x - 90 && cr.x < p.x && cr.y < feet && cr.y + cr.h > p.y);
    if (behind && p.vx < 60 && p.roll <= 0 && p.rollCool <= 0 && rollSafe(p.x, p.x - reach, feet)) { p.face = -1; c.dir = 0; c.rollPressed = true; return c; }
    // how far the hero slides before stopping (ice is slippery: also ice just ahead), plus a little extra
    const iceNear = [0, 1, 2, 3].some(k => tileAt(world, Math.floor((front + k * T) / T), Math.floor((feet + 1) / T)) === '~');
    const stop = Math.max(0, p.vx) ** 2 / (2 * (p.groundTile === '~' || iceNear ? PHYS.iceDecel : PHYS.decel)) + 6;
    c.dir = safeAt(front + stop, feet, p.y) ? 1 : 0;
    // a boulder or a critter just ahead: roll into it (only where it's safe to roll on)
    let block = false;
    const bc = Math.floor((front + 20) / T);
    for (let r = Math.floor(p.y / T); r * T < feet; r++) if (tileAt(world, bc, r) === 'B') block = true;
    for (const cr of world.critters) {
      if (cr.alive && cr.x < front + 80 && cr.x + cr.w > p.x + PW / 2 && cr.y < feet && cr.y + cr.h > p.y) block = true;
    }
    if (block && p.roll <= 0 && rollSafe(front, front + reach, feet)) { c.rollPressed = true; p.face = 1; }
    return c;
  }

  function followCamera(dt) {
    // look ahead in the direction you're running, so you can see what's coming
    cam.look += ((p.vx / PHYS.run) * 140 - cam.look) * Math.min(1, dt * 2.5);
    const touch = document.body.classList.contains('ar-touch');
    const tx = p.x + PW / 2 + cam.look - W / 2;
    const ty = p.y + PH / 2 - H * (touch ? 0.5 : 0.56);
    cam.x += (tx - cam.x) * Math.min(1, dt * 7);
    cam.y += (ty - cam.y) * Math.min(1, dt * 5);
    cam.x = math.clamp(cam.x, 0, Math.max(0, world.width - W));
    cam.y = math.clamp(cam.y, 0, Math.max(0, world.height - H));
  }

  // ---------------------------------------------------------------
  // Drawing: background (SNES-style parallax: sky, 2 hazy far layers,
  // a detailed middle layer, then foreground bits in the corners)
  // ---------------------------------------------------------------
  const now = () => performance.now() / 1000;

  // lighter (k > 0) or darker (k < 0) version of a #rrggbb color
  function tint(hex, k) {
    const n = parseInt(hex.slice(1), 16), ch = [n >> 16, (n >> 8) & 255, n & 255];
    const f = (c) => Math.max(0, Math.min(255, Math.round(k >= 0 ? c + (255 - c) * k : c * (1 + k) + 25 * -k)));
    return '#' + ch.map(c => f(c).toString(16).padStart(2, '0')).join('');
  }

  // Layers that never change are painted ONCE into a hidden canvas (2x size so
  // phones stay sharp) and then just copied every frame, sliding with the camera.
  // paint(cx, w, h) draws one repeating strip that is `period` wide.
  const layerCache = {};
  // The scene being drawn right now (set at the top of drawBackground): which world, the time of
  // day, where the camera is and the scenery clock. Tests + the preview draw any level with it.
  let SC = { kind: 'forest', time: '', camX: 0, t: 0, yOff: () => 0 };
  function layer(ctx, key, period, h, speed, y, paint, below) {
    const tm = TIMES[SC.time], ck = key + (tm ? ':' + SC.time : '');
    let c = layerCache[ck];
    if (!c) {
      c = document.createElement('canvas'); c.width = period * 2; c.height = h * 2;
      const cx = c.getContext('2d'); cx.scale(2, 2); paint(cx, period, h);
      if (tm) {                     // time of day: wash the strip with the evening / dawn color (far strips more)
        cx.globalCompositeOperation = 'source-atop';
        cx.globalAlpha = tm.tint[1] * (1.2 - speed * 1.4); cx.fillStyle = tm.tint[0]; cx.fillRect(0, 0, period, h);
      }
      layerCache[ck] = c;
    }
    // (whole pixels + 1 px overlap, so no thin see-through line where two copies meet)
    const o = Math.round(((SC.camX * speed) % period + period) % period);
    for (let x = -o; x < W; x += period) ctx.drawImage(c, x, Math.round(y), period + 1, h);
    if (below && y + h < H) {
      ctx.fillStyle = below; ctx.fillRect(0, y + h - 1, W, H - y - h + 1);
      if (tm) { ctx.globalAlpha = tm.tint[1] * (1.2 - speed * 1.4); ctx.fillStyle = tm.tint[0]; ctx.fillRect(0, y + h - 1, W, H - y - h + 1); ctx.globalAlpha = 1; }
    }
  }
  // draw something at x and also one period left/right, so strips repeat seamlessly
  const wrap3 = (period, fn) => { fn(-period); fn(0); fn(period); };
  // a wavy hill line across the strip (sum of sines with whole waves so it repeats)
  function hillPath(cx, w, h, top, amp, waves, phase = 0) {
    cx.beginPath(); cx.moveTo(0, h);
    const steps = Math.ceil(w / 8);                 // (even steps that end exactly at w: no gap at the seam)
    for (let i = 0; i <= steps; i++) {
      const x = (w * i) / steps, a = (x / w) * Math.PI * 2;
      cx.lineTo(x, top + amp * (0.5 + 0.35 * Math.sin(a * waves + phase) + 0.15 * Math.sin(a * waves * 3 + phase * 2)));
    }
    cx.lineTo(w, h); cx.closePath();
  }
  // a fluffy blob of circles with a darker bottom and a light top (SNES-style shading)
  function puff(cx, x, y, r, base, line = 'rgba(43,43,43,0.55)') {
    const parts = [[0, 0, 1], [-0.75, 0.25, 0.7], [0.75, 0.25, 0.72], [-0.35, -0.45, 0.66], [0.4, -0.4, 0.6]];
    cx.save();
    cx.beginPath(); for (const [dx, dy, s] of parts) { cx.moveTo(x + dx * r + s * r, y + dy * r); cx.arc(x + dx * r, y + dy * r, s * r, 0, Math.PI * 2); }
    cx.fillStyle = base; cx.fill();
    cx.clip();
    cx.fillStyle = tint(base, -0.22); cx.beginPath(); cx.ellipse(x, y + r * 0.95, r * 1.8, r * 0.75, 0, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = tint(base, 0.28);
    for (const [dx, dy, s] of parts) { cx.beginPath(); cx.arc(x + dx * r - s * r * 0.25, y + dy * r - s * r * 0.3, s * r * 0.45, 0, Math.PI * 2); cx.fill(); }
    cx.restore();
    if (line) {
      cx.beginPath(); for (const [dx, dy, s] of parts) { cx.moveTo(x + dx * r + s * r, y + dy * r); cx.arc(x + dx * r, y + dy * r, s * r, 0, Math.PI * 2); }
      cx.save(); cx.globalCompositeOperation = 'destination-over'; cx.lineWidth = 7; cx.strokeStyle = line; cx.stroke(); cx.restore();
    }
  }

  // ---------------------------------------------------------------
  // Living backgrounds (new plan point 2, part 2, Nov 22)
  // ---------------------------------------------------------------
  // Time of day: a level's `time` changes the sky (3 colors, top to bottom), the soft glow,
  // the clouds, and washes the painted strips with `tint` = [color, how much].
  const TIMES = {
    evening:  { sky: ['#6f7fe0', '#f6a38f', '#ffd59a'], glow: 'rgba(255,186,120,0.6)', tint: ['#ff8a4c', 0.2], cloud: ['#ffe3d2', '#f2a88f'] },
    dawn:     { sky: ['#93aef2', '#f6bfd6', '#fff1d8'], glow: 'rgba(255,220,190,0.6)', tint: ['#ffa8c4', 0.15], cloud: ['#fff2f6', '#efc3d6'] },
    twilight: { sky: ['#40338a', '#9b74d6', '#ffb8dc'], glow: 'rgba(255,170,230,0.45)', tint: ['#5d46a8', 0.26], cloud: ['#ece0ff', '#b9a4ea'], stars: true },
  };
  // The scenery clock: stands still in Calm motion (Arcade.calm), so clouds stop and nothing floats.
  let sceneT = null;                 // (tests and the preview can pin it)
  const calmNow = () => !!(window.Arcade && Arcade.calm && Arcade.calm());
  const sceneClock = () => sceneT != null ? sceneT : calmNow() ? 0 : now();
  let floatN = 12;                   // how many floaters (fewer when the game draws "lite" on a slow tablet)

  // Little things that float about by themselves, worked out from the clock (nothing to keep).
  // They live in front of the scenery and behind the level. Hidden in Calm motion.
  function drawFloaters(ctx, n) {
    const { kind, time, camX, t } = SC, camY = SC.camY || 0;
    const wrapX = (x, span) => ((x % span) + span) % span - 60;
    if (kind === 'forest' && time === 'evening') {
      // fireflies: wander slowly and blink on and off
      for (let i = 0; i < n + 4; i++) {
        const x = wrapX(i * 173 + Math.sin(t * 0.5 + i * 2.1) * 50 - camX * 0.45, W + 120);
        const y = 150 + (i * 89) % 330 + Math.sin(t * 0.8 + i) * 22;
        const on = 0.25 + 0.75 * Math.max(0, Math.sin(t * 2.2 + i * 1.7));
        const gl = ctx.createRadialGradient(x, y, 1, x, y, 14);
        gl.addColorStop(0, 'rgba(255,240,140,' + (0.85 * on) + ')'); gl.addColorStop(1, 'rgba(255,220,90,0)');
        ctx.fillStyle = gl; ctx.fillRect(x - 14, y - 14, 28, 28);
        ctx.fillStyle = 'rgba(255,255,210,' + on + ')'; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (kind === 'forest') {
      // falling leaves: tumble down, sway side to side
      const cols = time === 'evening' ? ['#e9a03b', '#d2693c', '#c9b24a'] : ['#7cc95a', '#a5d65a', '#f2c14e'];
      for (let i = 0; i < Math.round(n * 0.6); i++) {
        const fall = 26 + (i % 4) * 7;
        const y = ((i * 131 + t * fall - camY * 0.3) % (H + 80) + H + 80) % (H + 80) - 40;
        const x = wrapX(i * 211 + Math.sin(t * 1.1 + i) * 40 - camX * 0.6 - t * 12, W + 120);
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 1.6 + i * 3) * 1.1);
        ctx.beginPath(); ctx.ellipse(0, 0, 9, 4.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = cols[i % 3]; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(43,43,43,0.6)'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(43,43,43,0.45)'; ctx.stroke();
        ctx.restore();
      }
    } else if (kind === 'cave') {
      // glow dots drifting up through the cave
      for (let i = 0; i < n + 6; i++) {
        const x = wrapX(i * 137 - camX * 0.5 + Math.sin(t * 0.7 + i) * 16, 1100);
        const y = ((i * 71 - t * (8 + i % 3 * 4)) % 520 + 520) % 520 + 10;
        ctx.globalAlpha = 0.45 + 0.35 * Math.sin(t * 1.9 + i);
        ctx.fillStyle = i % 2 ? '#5ee6d0' : '#ff7bd5';
        ctx.beginPath(); ctx.arc(x, y, 3 + (i % 3), 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (kind === 'snow') {
      ctx.fillStyle = time === 'dawn' ? 'rgba(255,240,246,0.95)' : 'rgba(255,255,255,0.9)';
      for (let i = 0; i < n * 3; i++) {
        const x = ((i * 97 + Math.sin(t * 0.8 + i) * 30 - camX * 0.7) % 1000 + 1000) % 1000 - 20;
        const y = ((i * 53 + t * (30 + (i % 4) * 12) - camY * 0.7) % 580 + 580) % 580 - 20;
        ctx.beginPath(); ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2); ctx.fill();
      }
    } else if (kind === 'candy') {
      // soap bubbles floating up, wobbling a little
      for (let i = 0; i < Math.round(n * 0.7); i++) {
        const r = 7 + (i % 4) * 3;
        const y = H + 30 - ((i * 97 + t * (22 + (i % 3) * 8)) % (H + 80));
        const x = wrapX(i * 157 + Math.sin(t * 1.3 + i * 2) * 18 - camX * 0.5, W + 120);
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = ['rgba(255,120,190,0.75)', 'rgba(120,200,255,0.75)', 'rgba(170,120,255,0.75)'][i % 3]; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.22, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  // Twilight stars: fixed in the sky, gently twinkling (they just shine in Calm motion).
  function drawStars(ctx, calm) {
    const { t } = SC;
    for (let i = 0; i < 26; i++) {
      const x = (i * 211 + (i % 3) * 37) % W, y = 18 + (i * 67) % 190;
      const tw = calm ? 0.8 : 0.45 + 0.55 * Math.abs(Math.sin(t * 1.4 + i * 1.3));
      ctx.globalAlpha = tw;
      if (i % 4 === 0) D.star(ctx, x, y, 5 + tw * 2, '#fff7c2', 0);
      else { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, 1.6 + (i % 2), 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }

  // view (tests + preview only): { level, camX, camY, t } draws that level's background with no game running
  function drawBackground(ctx, view) {
    const def = view ? LEVELS.find(l => l.id === view.level) : world.def;
    const kind = def.world, time = def.time || '', tm = TIMES[time];
    const calm = calmNow();
    const t = view && view.t != null ? (calm ? 0 : view.t) : sceneClock();
    const camX = view ? view.camX || 0 : cam.x, camY = view ? view.camY || 0 : cam.y;
    // Layers stay mostly fixed on screen (the ground is always near the middle of
    // the view); when you climb up they slide down just a little, near layers more
    // than far ones, which gives a feeling of depth.
    const yOff = view ? () => 0 : (speed) => Math.min(40, ((world.height - cam.y) - H) * speed * 0.3);
    SC = { kind, time, camX, camY, t, yOff };
    // sky: three colors + a soft glow
    const SKY = tm ? tm.sky : {
      forest: ['#5cc8ff', '#a8e6ff', '#e9fff4'], cave: ['#120a2e', '#2a1b5c', '#3d2a78'],
      snow: ['#6fb6f5', '#b9dcff', '#f1f8ff'], candy: ['#ff9fd2', '#ffc8e6', '#fff2fa'],
    }[kind];
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, SKY[0]); sky.addColorStop(0.55, SKY[1]); sky.addColorStop(1, SKY[2]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W * 0.7, H * 0.35, 10, W * 0.7, H * 0.35, 420);
    glow.addColorStop(0, tm ? tm.glow : kind === 'cave' ? 'rgba(160,120,255,0.35)' : 'rgba(255,255,240,0.55)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    if (tm && tm.stars) drawStars(ctx, calm);

    if (kind !== 'cave') {
      // soft shaded clouds drifting by themselves (and a little with the camera)
      for (let i = 0; i < 4; i++) {
        const x = ((i * 310 - camX * 0.04 + t * 7) % 1240 + 1240) % 1240 - 140;
        const y = 70 + (i % 2) * 54 + yOff(0.04);
        cloud(ctx, x, y, 0.9 + (i % 3) * 0.22, kind, tm);
      }
    }

    if (kind === 'forest') {
      layer(ctx, 'f1', 960, 300, 0.06, 140 + yOff(0.05), (cx, w, h) => {
        hillPath(cx, w, h, 20, 110, 3); cx.fillStyle = '#b4e2cf'; cx.fill();
        hillPath(cx, w, h, 80, 80, 2, 1.7); cx.fillStyle = '#93d2ad'; cx.fill();
      }, '#93d2ad');
      layer(ctx, 'f2', 720, 300, 0.16, 181 + yOff(0.12), (cx, w, h) => {   // a far line of treetops
        cx.fillStyle = '#66b878';
        wrap3(w, (o) => { for (let i = 0; i < 9; i++) { const x = o + i * 80 + 20, r = 42 + (i * 37) % 22; cx.beginPath(); cx.arc(x, 104 - (i * 53) % 30, r, 0, Math.PI * 2); cx.fill(); } });
        cx.fillRect(0, 104, w, h);
        cx.fillStyle = 'rgba(255,255,255,0.12)'; cx.fillRect(0, 0, w, h);
      }, '#78c088');
      layer(ctx, 'f3', 690, 380, 0.38, 150 + yOff(0.3), (cx, w, h) => {    // shaded trees
        wrap3(w, (o) => {
          for (let i = 0; i < 3; i++) {
            const x = o + i * 230 + 60, by = h - 10 - (i % 2) * 22;
            // trunk with a light side and a dark side
            cx.fillStyle = '#7a4a26'; cx.fillRect(x - 12, by - 150, 24, 160);
            cx.fillStyle = '#a0683a'; cx.fillRect(x - 12, by - 150, 9, 160);
            cx.fillStyle = 'rgba(0,0,0,0.18)'; for (let k = 0; k < 4; k++) cx.fillRect(x - 2 + (k % 2) * 6, by - 130 + k * 32, 3, 14);
            cx.lineWidth = 4; cx.strokeStyle = 'rgba(43,43,43,0.55)'; cx.strokeRect(x - 12, by - 150, 24, 160);
            puff(cx, x, by - 190, 62, i % 2 ? '#56b85a' : '#4cae58');
          }
        });
      }, '#3f8f45');
    } else if (kind === 'cave') {
      layer(ctx, 'c1', 640, H + 40, 0.08, -20 + yOff(0.06), (cx, w, h) => {   // far cave walls
        cx.fillStyle = '#251852';
        wrap3(w, (o) => {
          for (let i = 0; i < 8; i++) {
            const x = o + i * 80, len = 70 + (i * 41) % 90;
            cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x + 40, len); cx.lineTo(x + 80, 0); cx.fill();
            const ln2 = 90 + (i * 29) % 120;
            cx.beginPath(); cx.moveTo(x + 10, h); cx.lineTo(x + 50, h - ln2); cx.lineTo(x + 90, h); cx.fill();
          }
        });
        cx.fillRect(0, 0, w, 14);
      });
      layer(ctx, 'c2', 760, 420, 0.3, 60 + yOff(0.25), (cx, w, h) => {      // rock pillars + glowing crystals on rocks
        wrap3(w, (o) => {
          for (let i = 0; i < 2; i++) {
            const x = o + i * 380 + 120;
            cx.beginPath(); cx.moveTo(x - 60, h); cx.quadraticCurveTo(x - 34, h - 220, x, h - 300); cx.quadraticCurveTo(x + 34, h - 220, x + 60, h); cx.closePath();
            const gr = cx.createLinearGradient(x - 60, 0, x + 60, 0); gr.addColorStop(0, '#6a55c0'); gr.addColorStop(0.45, '#4f3c9c'); gr.addColorStop(1, '#33256e');
            cx.fillStyle = gr; cx.fill(); cx.lineWidth = 5; cx.strokeStyle = 'rgba(20,10,40,0.75)'; cx.stroke();
            cx.strokeStyle = 'rgba(255,255,255,0.15)'; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(x - 30, h - 40); cx.quadraticCurveTo(x - 20, h - 180, x - 4, h - 270); cx.stroke();
            // a rock with a glowing crystal cluster on it
            const rx = x + 170, ry = h - 120;
            cx.beginPath(); cx.ellipse(rx, ry, 56, 26, 0, Math.PI, 0); cx.lineTo(rx + 56, h); cx.lineTo(rx - 56, h); cx.closePath();
            cx.fillStyle = '#3b2b7a'; cx.fill(); cx.lineWidth = 5; cx.strokeStyle = 'rgba(20,10,40,0.75)'; cx.stroke();
            crystal(cx, rx, ry - 14, 1.0, i ? '#c77dff' : '#7a9cff', 0.55);   // dimmer than the real gems
          }
        });
      });
    } else if (kind === 'snow') {
      layer(ctx, 's1', 840, 330, 0.05, 150 + yOff(0.04), (cx, w, h) => {      // big hazy mountains
        wrap3(w, (o) => {
          for (let i = 0; i < 2; i++) {
            const x = o + i * 420 + 200, top = 20 + i * 40;
            cx.beginPath(); cx.moveTo(x - 260, h); cx.lineTo(x, top); cx.lineTo(x + 260, h); cx.closePath(); cx.fillStyle = '#c3dcf5'; cx.fill();
            cx.beginPath(); cx.moveTo(x, top); cx.lineTo(x + 260, h); cx.lineTo(x + 40, h); cx.closePath(); cx.fillStyle = '#a9c8ea'; cx.fill();     // shady side
            cx.beginPath(); cx.moveTo(x - 70, top + 80); cx.lineTo(x, top); cx.lineTo(x + 70, top + 80); cx.lineTo(x + 40, top + 66); cx.lineTo(x + 12, top + 90); cx.lineTo(x - 22, top + 64); cx.closePath();
            cx.fillStyle = '#ffffff'; cx.fill();
          }
        });
      }, '#b4d0ee');
      layer(ctx, 's2', 700, 220, 0.15, 330 + yOff(0.12), (cx, w, h) => {      // snowy hills with far pines
        cx.fillStyle = '#8fb9a6';
        wrap3(w, (o) => { for (let i = 0; i < 10; i++) { const x = o + i * 70 + 20, s = 26 + (i * 13) % 16; cx.beginPath(); cx.moveTo(x - s * 0.6, 70); cx.lineTo(x, 70 - s * 2.2); cx.lineTo(x + s * 0.6, 70); cx.fill(); } });
        hillPath(cx, w, h, 50, 50, 3); cx.fillStyle = '#e9f3ff'; cx.fill();
      }, '#e9f3ff');
      layer(ctx, 's3', 570, 330, 0.38, 200 + yOff(0.3), (cx, w, h) => {
        wrap3(w, (o) => { for (let i = 0; i < 3; i++) pine(cx, o + i * 190 + 70, h - 6 - (i % 2) * 16, 1 + (i % 3) * 0.12); });
      });
    } else if (kind === 'candy') {
      layer(ctx, 'k1', 900, 280, 0.06, 220 + yOff(0.05), (cx, w, h) => {      // cotton-candy hills
        hillPath(cx, w, h, 20, 110, 3); cx.fillStyle = '#ffd9ef'; cx.fill();
        hillPath(cx, w, h, 80, 80, 2, 2.1); cx.fillStyle = '#e7d4ff'; cx.fill();
      }, '#e7d4ff');
      layer(ctx, 'k2', 720, 240, 0.16, 300 + yOff(0.12), (cx, w, h) => {      // striped candy hills
        hillPath(cx, w, h, 20, 90, 2, 0.6); cx.fillStyle = '#ffb3d9'; cx.fill();
        cx.save(); cx.clip(); cx.strokeStyle = '#ffffff'; cx.globalAlpha = 0.5; cx.lineWidth = 14;
        for (let x = -300; x < w + 300; x += 60) { cx.beginPath(); cx.moveTo(x, h); cx.lineTo(x + 240, 0); cx.stroke(); }
        cx.restore();
      }, '#ffb3d9');
      layer(ctx, 'k3', 750, 360, 0.38, 170 + yOff(0.3), (cx, w, h) => {      // lollipops, candy canes, gumdrops
        wrap3(w, (o) => {
          lollipop(cx, o + 90, h - 4, 1.15, '#ff6fb5');
          candyCane(cx, o + 300, h - 4, 1.1);
          lollipop(cx, o + 470, h - 4, 1.0, '#7bd3f7');
          for (const [gx, col] of [[620, '#9b5de5'], [670, '#06d6a0']]) gumdrop(cx, o + gx, h - 4, 1.2, col);
        });
      });
    }
    // a little atmosphere haze over the background (keeps it behind the action)
    ctx.fillStyle = kind === 'cave' ? 'rgba(20,10,50,0.18)' : 'rgba(255,255,255,0.12)'; ctx.fillRect(0, 0, W, H);
    // things floating about (leaves, fireflies, glow dots, snowflakes, bubbles); none in Calm motion
    if (!calm) drawFloaters(ctx, floatN);
  }

  // Foreground: a few big, dark shapes in the bottom corners (in front of
  // everything, like the SNES "close-up" layer). Small enough not to hide anything.
  function drawForeground(ctx) {
    const kind = world.def.world, t = sceneClock();
    const sway = Math.sin(t * 1.2) * 0.05;          // (still in Calm motion: the clock stands still)
    const corner = (x, flip, fn) => { ctx.save(); ctx.translate(x, H); ctx.scale(flip, 1); fn(); ctx.restore(); };
    for (const [x, flip] of [[0, 1], [W, -1]]) corner(x, flip, () => {
      if (kind === 'forest') {
        for (const [a, len, col] of [[0.35, 150, '#24602c'], [0.95, 130, '#2f7a37'], [0.1, 110, '#1d5124']]) {
          ctx.save(); ctx.rotate(a + sway);
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(26, -len * 0.5, 4, -len); ctx.quadraticCurveTo(-22, -len * 0.5, 0, 0);
          ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#123318'; ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(2, -6); ctx.quadraticCurveTo(6, -len * 0.5, 4, -len + 10); ctx.stroke();
          ctx.restore();
        }
      } else if (kind === 'cave') {
        ctx.beginPath(); ctx.moveTo(-10, 0); ctx.quadraticCurveTo(10, -70, 60, -60); ctx.quadraticCurveTo(110, -50, 120, 0); ctx.closePath();
        ctx.fillStyle = '#140b30'; ctx.fill();
        crystal(ctx, 50, -40, 0.7, '#5ee6d0', 0.9);
      } else if (kind === 'snow') {
        ctx.beginPath(); ctx.moveTo(-10, 0); ctx.quadraticCurveTo(30, -64, 90, -40); ctx.quadraticCurveTo(130, -26, 150, 0); ctx.closePath();
        ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(43,43,43,0.5)'; ctx.stroke();
        ctx.fillStyle = '#d6e8fb'; ctx.beginPath(); ctx.ellipse(70, -6, 70, 14, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#fff'; for (const [sx, sy] of [[40, -44], [96, -32]]) D.star(ctx, sx, sy, 5 + Math.abs(Math.sin(t * 3 + sx)) * 3, '#ffffff', 0);
      } else {
        gumdrop(ctx, 34, 8, 1.6, '#ff6fb5');
        gumdrop(ctx, 92, 6, 1.05, '#9b5de5');
      }
    });
  }

  function cloud(ctx, x, y, s, kind, tm) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.arc(30, -14, 30, 0, Math.PI * 2); ctx.arc(62, 0, 24, 0, Math.PI * 2); ctx.rect(0, 0, 62, 22);
    ctx.fillStyle = tm ? tm.cloud[0] : kind === 'candy' ? '#fff0f8' : '#ffffff'; ctx.fill();
    ctx.clip();
    ctx.fillStyle = tm ? tm.cloud[1] : kind === 'candy' ? '#f7cfe6' : kind === 'snow' ? '#d5e6f8' : '#d7ecf7';
    ctx.beginPath(); ctx.ellipse(31, 26, 60, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function pine(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#6a4329'; ctx.fillRect(-8, -22, 16, 28); ctx.fillStyle = '#8a5a39'; ctx.fillRect(-8, -22, 6, 28);
    for (let i = 0; i < 3; i++) {
      const ty = -20 - i * 34, w = 48 - i * 10;
      ctx.beginPath(); ctx.moveTo(-w, ty); ctx.lineTo(0, ty - 58); ctx.lineTo(w, ty); ctx.closePath();
      ctx.fillStyle = '#2f7d5c'; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.fillStyle = '#226148'; ctx.beginPath(); ctx.moveTo(0, ty - 58); ctx.lineTo(w, ty); ctx.lineTo(w * 0.1, ty); ctx.closePath(); ctx.fill();   // shady side
      ctx.restore();
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(43,43,43,0.55)'; ctx.stroke();
      // snow on each layer, with a blue shade line under it
      ctx.beginPath(); ctx.moveTo(-w * 0.5, ty - 28); ctx.lineTo(0, ty - 58); ctx.lineTo(w * 0.5, ty - 28);
      ctx.quadraticCurveTo(w * 0.25, ty - 20, 0, ty - 26); ctx.quadraticCurveTo(-w * 0.25, ty - 20, -w * 0.5, ty - 28);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = '#bcd6f2'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-w * 0.45, ty - 26); ctx.quadraticCurveTo(-w * 0.2, ty - 18, 0, ty - 24); ctx.stroke();
    }
    ctx.restore();
  }
  function lollipop(ctx, x, y, s, color, alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(s, s);
    D.box(ctx, -5, -110, 10, 110, 4, '#ffffff', 4);
    ctx.fillStyle = '#dcdcdc'; ctx.fillRect(1, -106, 3, 102);
    D.circle(ctx, 0, -130, 36, color, 4);
    ctx.save(); ctx.beginPath(); ctx.arc(0, -130, 34, 0, Math.PI * 2); ctx.clip();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 5; a += 0.2) { const r = a * 2.1; ctx.lineTo(Math.cos(a) * r, -130 + Math.sin(a) * r); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.beginPath(); ctx.arc(10, -120, 36, 0, Math.PI * 2); ctx.fill();      // shade
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(-14, -146, 9, 5, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.restore();
  }
  function candyCane(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const path = () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -110); ctx.arc(-22, -110, 22, 0, Math.PI, true); };
    ctx.lineCap = 'round';
    path(); ctx.strokeStyle = INK; ctx.lineWidth = 22; ctx.stroke();
    path(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 14; ctx.stroke();
    path(); ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 14; ctx.setLineDash([10, 12]); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
  }
  function gumdrop(ctx, x, y, s, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(-22, 0); ctx.quadraticCurveTo(-24, -40, 0, -42); ctx.quadraticCurveTo(24, -40, 22, 0); ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = tint(color, -0.25); ctx.fillRect(4, -50, 30, 60); ctx.restore();
    ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = '#ffffff'; for (const [dx, dy] of [[-10, -26], [6, -32], [-2, -14], [10, -12]]) ctx.fillRect(dx, dy, 3, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(-9, -30, 4, 7, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function crystal(ctx, x, y, s, color, alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(s, s);
    ctx.shadowColor = color; ctx.shadowBlur = 22;
    for (const [dx, h, wd, a] of [[-16, 46, 14, -0.3], [0, 70, 18, 0], [16, 40, 13, 0.35]]) {
      ctx.save(); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(dx - wd, 0); ctx.lineTo(dx - wd, -h + 14); ctx.lineTo(dx, -h); ctx.lineTo(dx + wd, -h + 14); ctx.lineTo(dx + wd, 0); ctx.closePath();
      ctx.fillStyle = color; ctx.fill();
      ctx.shadowBlur = 0;
      // facets: a dark right face and a light left face
      ctx.fillStyle = tint(color, -0.3); ctx.beginPath(); ctx.moveTo(dx, -h); ctx.lineTo(dx + wd, -h + 14); ctx.lineTo(dx + wd, 0); ctx.lineTo(dx + 2, 0); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(dx - wd, 0); ctx.lineTo(dx - wd, -h + 14); ctx.lineTo(dx, -h); ctx.lineTo(dx + wd, -h + 14); ctx.lineTo(dx + wd, 0); ctx.closePath();
      ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(dx - wd + 5, -h + 18, 4, h - 26);
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------
  // Drawing: tiles
  // ---------------------------------------------------------------
  const groundLike = (t) => t === '#' || t === 'F';
  function hash(c, r) { return ((c * 73856093) ^ (r * 19349663)) >>> 0; }

  function drawTiles(ctx, c0, c1, r0, r1) {
    const g = (c, r) => (r >= world.rows ? '#' : tileAt(world, c, r));
    // pass 0: tree trunks (Treetop Trail). They are only a picture: you walk in front of them.
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      if (g(c, r) !== 't') continue;
      const x = c * T, y = r * T, hsh = hash(c, r);
      const lt = g(c - 1, r) !== 't', rt = g(c + 1, r) !== 't';       // two trunks side by side = one fat trunk
      const xa = x + (lt ? 9 : 0), xb = x + T - (rt ? 9 : 0);
      ctx.fillStyle = '#8a5a30'; ctx.fillRect(xa, y - 0.5, xb - xa, T + 1);
      if (lt) { ctx.fillStyle = '#a87240'; ctx.fillRect(xa, y - 0.5, 9, T + 1); }
      if (rt) { ctx.fillStyle = '#6e4422'; ctx.fillRect(xb - 8, y - 0.5, 8, T + 1); }
      ctx.strokeStyle = 'rgba(43,43,43,0.35)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(xa + 14 + hsh % 8, y + 8); ctx.lineTo(xa + 14 + hsh % 8, y + 24 + hsh % 12); ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = 4;
      ctx.beginPath();
      if (lt) { ctx.moveTo(xa, y); ctx.lineTo(xa, y + T); }
      if (rt) { ctx.moveTo(xb, y); ctx.lineTo(xb, y + T); }
      ctx.stroke();
    }
    // pass 1: ground fill + inner dots; secret rooms (F) get a dark "inside" color
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const t = g(c, r), x = c * T, y = r * T;
      if (t === '#') {
        groundTile(ctx, c, r, g);
      } else if (t === 'F') {
        ctx.fillStyle = theme.hollow; ctx.fillRect(x - 0.5, y - 0.5, T + 1, T + 1);
      }
    }
    // pass 2: outlines on the outside edges of the ground + grassy/snowy/frosting tops
    ctx.lineCap = 'round';
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      if (g(c, r) !== '#') continue;
      edges(ctx, c, r, (cc, rr) => groundLike(g(cc, rr)));
      if (!groundLike(g(c, r - 1))) topCap(ctx, c, r, !groundLike(g(c - 1, r)) || !!SOLID[g(c - 1, r - 1)], !groundLike(g(c + 1, r)) || !!SOLID[g(c + 1, r - 1)]);
    }
    // other tile types
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const t = g(c, r), x = c * T, y = r * T;
      if (t === '~') {
        const ice = ctx.createLinearGradient(x, y, x + T, y + T);
        ice.addColorStop(0, '#e2f8ff'); ice.addColorStop(0.6, '#b6e6fb'); ice.addColorStop(1, '#8fd0f0');
        ctx.fillStyle = ice; ctx.fillRect(x - 0.5, y - 0.5, T + 1, T + 1);
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(x + 10, y + 34); ctx.lineTo(x + 26, y + 18); ctx.stroke();
        ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 22, y + 38); ctx.lineTo(x + 32, y + 28); ctx.stroke();
        edges(ctx, c, r, (cc, rr) => g(cc, rr) === '~' || (rr > r && groundLike(g(cc, rr))));
        if (g(c, r - 1) !== '~') { ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y + 2, T, 6); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + T, y); ctx.stroke(); }
      } else if (t === 'B') {                 // cracked boulder: roll into it to smash it
        ctx.beginPath();
        ctx.moveTo(x + 6, y + T - 2); ctx.quadraticCurveTo(x + 1, y + 14, x + 14, y + 4); ctx.quadraticCurveTo(x + 26, y - 1, x + 38, y + 6);
        ctx.quadraticCurveTo(x + T, y + 16, x + T - 3, y + T - 2); ctx.closePath();
        const rock = ctx.createLinearGradient(x, y, x + T * 0.6, y + T);
        rock.addColorStop(0, '#d0cbc6'); rock.addColorStop(0.55, '#a8a29e'); rock.addColorStop(1, '#7d7672');
        ctx.fillStyle = rock; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
        ctx.strokeStyle = 'rgba(43,43,43,0.7)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x + 24, y + 6); ctx.lineTo(x + 20, y + 18); ctx.lineTo(x + 28, y + 26); ctx.lineTo(x + 22, y + 40); ctx.moveTo(x + 28, y + 26); ctx.lineTo(x + 38, y + 30); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(x + 14, y + 14, 6, 3, -0.6, 0, 7); ctx.fill();
      } else if (t === 'o') {
        const b = world.bounce[c + ',' + r] || 0;
        const sq = Math.sin(b * Math.PI * 3) * b * 6;
        D.box(ctx, x + 2, y + 2 + sq, T - 4, T - 4 - sq, 14, '#ff6fb5', 4);
        ctx.save(); D.rr(ctx, x + 4, y + 4 + sq, T - 8, T - 8 - sq, 12); ctx.clip();
        ctx.fillStyle = '#e04f98'; ctx.fillRect(x, y + T * 0.62 + sq * 0.5, T, T); ctx.restore();       // jelly shade
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        D.rr(ctx, x + 9, y + 9 + sq, 14, 8, 4); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 34, y + 30, 4, 0, Math.PI * 2); ctx.fill();
      } else if (t === '^') {
        thorns(ctx, x, y);
      } else if (t === 'L') {
        leafBlock(ctx, c, r, g);
      }
    }
    // thin platforms: one long plank per run of '='
    for (let r = r0; r <= r1; r++) {
      let c = c0;
      while (c <= c1) {
        if (g(c, r) !== '=') { c++; continue; }
        let e = c; while (e + 1 <= c1 + 3 && g(e + 1, r) === '=') e++;
        let s = c; while (s - 1 >= 0 && g(s - 1, r) === '=') s--;
        plank(ctx, s * T, r * T, (e - s + 1) * T);
        c = e + 1;
      }
    }
  }

  // A leafy treetop block (Treetop Trail): a bushy green cushion you can stand on.
  // A row of them makes one long treetop; the ends are rounded.
  function leafBlock(ctx, c, r, g) {
    const x = c * T, y = r * T, hsh = hash(c, r);
    const lt = g(c - 1, r) !== 'L', rt = g(c + 1, r) !== 'L';
    const shape = new Path2D();
    shape.moveTo(x - (lt ? 8 : 0), y + T - 4);
    if (lt) shape.quadraticCurveTo(x - 14, y + 14, x, y + 2); else shape.lineTo(x, y + 2);
    shape.quadraticCurveTo(x + 12, y - 7, x + 24, y + 1); shape.quadraticCurveTo(x + 36, y - 7, x + T, y + 2);   // two leafy bumps
    if (rt) shape.quadraticCurveTo(x + T + 14, y + 14, x + T + 8, y + T - 4); else shape.lineTo(x + T, y + T - 4);
    shape.quadraticCurveTo(x + 36, y + T + 5, x + 24, y + T - 3); shape.quadraticCurveTo(x + 12, y + T + 5, x - (lt ? 8 : 0), y + T - 4);
    ctx.fillStyle = '#56b85a'; ctx.fill(shape);
    ctx.save(); ctx.clip(shape);
    ctx.fillStyle = '#3f8f45'; ctx.fillRect(x - 16, y + 28, T + 32, 30);                 // darker underside
    ctx.fillStyle = '#7fd67a'; ctx.fillRect(x - 16, y - 8, T + 32, 16);                  // sunny top
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(x + 10 + hsh % 22, y + 9, 7, 3, -0.3, 0, 7); ctx.fill();
    ctx.restore();
    ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
    // outline: top and bottom always, the round ends only where the treetop stops
    ctx.beginPath();
    ctx.moveTo(x, y + 2); ctx.quadraticCurveTo(x + 12, y - 7, x + 24, y + 1); ctx.quadraticCurveTo(x + 36, y - 7, x + T, y + 2);
    if (rt) ctx.quadraticCurveTo(x + T + 14, y + 14, x + T + 8, y + T - 4); else ctx.moveTo(x + T, y + T - 4);
    ctx.quadraticCurveTo(x + 36, y + T + 5, x + 24, y + T - 3); ctx.quadraticCurveTo(x + 12, y + T + 5, x - (lt ? 8 : 0), y + T - 4);
    if (lt) ctx.quadraticCurveTo(x - 14, y + 14, x, y + 2);
    ctx.stroke();
    // a little leaf vein
    ctx.strokeStyle = 'rgba(30,80,30,0.4)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x + 12 + hsh % 14, y + 22); ctx.quadraticCurveTo(x + 22 + hsh % 14, y + 16, x + 30 + hsh % 14, y + 24); ctx.stroke();
  }

  // The wind (Windy Peak): a pale blue column with white arrows and swirls rushing upward,
  // so you can see without words which way it blows.
  function drawWind(ctx, c0, c1, r0, r1, t) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) {
      if (tileAt(world, c, r) !== 'u') continue;
      const x = c * T, y = r * T, hsh = hash(c, r);
      ctx.fillStyle = 'rgba(120,190,255,0.26)'; ctx.fillRect(x, y, T, T);
      // one arrow and one swirl per tile, each sliding up and wrapping around inside its tile
      for (let k = 0; k < 2; k++) {
        const u = ((t * (1.2 + k * 0.5) + ((hsh >>> (k * 3)) % 10) / 10) % 1);      // 0 -> 1 as it rises
        const sx = x + 12 + k * 24 + Math.sin(t * 3 + c + k) * 3, sy = y + T - u * T;
        ctx.globalAlpha = Math.sin(u * Math.PI);                                   // fades in and out at the tile's edges
        ctx.beginPath();
        if ((c + r + k) % 2) { ctx.moveTo(sx - 9, sy + 6); ctx.lineTo(sx, sy - 5); ctx.lineTo(sx + 9, sy + 6); }   // an arrow pointing up
        else { ctx.moveTo(sx, sy + 12); ctx.quadraticCurveTo(sx + 6, sy, sx, sy - 12); }                           // a swirl
        ctx.strokeStyle = 'rgba(70,140,220,0.55)'; ctx.lineWidth = 8; ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  // One ground tile, SNES-style: the deeper it is, the darker the dirt (shading
  // bands), with pebbles and specks, a light left edge, a dark right edge and a
  // dark underside, plus a soft shadow cast on whatever is below a ledge.
  function groundTile(ctx, c, r, g) {
    const x = c * T, y = r * T, kind = world.def.world;
    let d = 0; while (d < 3 && groundLike(g(c, r - 1 - d))) d++;          // how deep below the surface
    ctx.fillStyle = tint(theme.dirt, -0.09 * d); ctx.fillRect(x - 0.5, y - 0.5, T + 1, T + 1);
    if (d === 0) { ctx.fillStyle = tint(theme.dirt, 0.12); ctx.fillRect(x - 0.5, y + 10, T + 1, 10); }    // a lighter band under the top
    const hsh = hash(c, r);
    // specks
    ctx.fillStyle = tint(theme.dirtDot, -0.1 * d);
    for (let k = 0; k < 4; k++) ctx.fillRect(x + ((hsh >>> (k * 4)) % 40) + 2, y + ((hsh >>> (k * 4 + 2)) % 36) + 6, 3, 3);   // (>>> keeps the number positive, so specks stay inside the tile)
    // a pebble (or a chocolate chip / ice chunk) with a highlight
    if (hsh % 3 !== 0) {
      const px = x + 10 + (hsh % 26), py = y + 18 + ((hsh >> 5) % 20), pr = 4 + (hsh >> 9) % 3;
      ctx.fillStyle = kind === 'candy' ? '#5a2f18' : kind === 'snow' ? '#e3f1ff' : kind === 'cave' ? '#3d2f6e' : '#8d6e5a';
      ctx.beginPath(); ctx.ellipse(px, py, pr + 2, pr, 0, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(43,43,43,0.45)'; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.arc(px - 2, py - 2, 1.6, 0, Math.PI * 2); ctx.fill();
    }
    // forest: a little root curling down near the top
    if (kind === 'forest' && d === 1 && hsh % 4 === 0) {
      ctx.strokeStyle = '#7a4a26'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x + 20, y); ctx.quadraticCurveTo(x + 26, y + 14, x + 16, y + 26); ctx.stroke();
    }
    // cave: glowing crystal specks
    if (kind === 'cave' && hsh % 5 === 0) { ctx.fillStyle = hsh % 2 ? '#5ee6d0' : '#ff7bd5'; D.star(ctx, x + 34, y + 30, 4, ctx.fillStyle, 0); }
    // edge shading
    if (!groundLike(g(c - 1, r))) { ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(x, y, 6, T); }
    if (!groundLike(g(c + 1, r))) { ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(x + T - 8, y, 8, T); }
    if (!groundLike(g(c, r + 1)) && r + 1 < world.rows) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x, y + T - 8, T, 8);
      // the ledge's shadow falls on the air below it
      if (!SOLID[g(c, r + 1)]) {
        const sh = ctx.createLinearGradient(0, y + T, 0, y + T + 16);
        sh.addColorStop(0, 'rgba(0,0,0,0.22)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sh; ctx.fillRect(x, y + T, T, 16);
      }
    }
  }

  // Outline the sides of tile (c, r) that touch something not "same".
  function edges(ctx, c, r, same) {
    const x = c * T, y = r * T;
    ctx.strokeStyle = INK; ctx.lineWidth = 4;
    ctx.beginPath();
    if (!same(c, r - 1)) { ctx.moveTo(x, y); ctx.lineTo(x + T, y); }
    if (!same(c, r + 1)) { ctx.moveTo(x, y + T); ctx.lineTo(x + T, y + T); }
    if (!same(c - 1, r)) { ctx.moveTo(x, y); ctx.lineTo(x, y + T); }
    if (!same(c + 1, r)) { ctx.moveTo(x + T, y); ctx.lineTo(x + T, y + T); }
    ctx.stroke();
  }

  // The colorful top of the ground: grass, moss, snow or pink frosting.
  function topCap(ctx, c, r, leftEnd, rightEnd) {
    const x = c * T, y = r * T, kind = world.def.world;
    const x0 = x - (leftEnd ? 3 : 0), x1 = x + T + (rightEnd ? 3 : 0);
    ctx.beginPath();
    ctx.moveTo(x0, y - 3);
    ctx.lineTo(x1, y - 3);
    // wavy bottom edge (drips for candy, scallops otherwise)
    const n = 3;
    for (let i = n; i >= 0; i--) {
      const px = x + (T / n) * i;
      const deep = kind === 'candy' ? (hash(c, i) % 3 === 0 ? 24 : 14) : kind === 'snow' ? 18 : 15;
      if (i < n) ctx.quadraticCurveTo(px + T / n / 2, y + deep + 6, px, y + 11);
      else ctx.lineTo(x1, y + 11);
    }
    ctx.lineTo(x0, y + 11);
    ctx.closePath();
    ctx.fillStyle = theme.top; ctx.fill();
    // shading inside the cap: a dark bottom edge and a bright top stripe
    ctx.save(); ctx.clip();
    ctx.fillStyle = theme.topDark; ctx.fillRect(x0, y + 8, x1 - x0, 20);
    ctx.fillStyle = theme.top; ctx.fillRect(x0, y - 3, x1 - x0, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(x0, y - 1, x1 - x0, 3);
    ctx.restore();
    ctx.strokeStyle = tint(theme.topDark, -0.15); ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x0, y - 2); ctx.lineTo(x1, y - 2); ctx.stroke();
    if (leftEnd) { ctx.beginPath(); ctx.moveTo(x0, y - 2); ctx.lineTo(x0, y + 11); ctx.stroke(); }
    if (rightEnd) { ctx.beginPath(); ctx.moveTo(x1, y - 2); ctx.lineTo(x1, y + 11); ctx.stroke(); }
    // little grass blades / sprinkles
    const hsh = hash(c, r);
    if (kind === 'forest') {
      // grass tufts: a dark blade and a light blade
      const bx = x + 8 + (hsh % 26);
      ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.strokeStyle = theme.topDark; ctx.beginPath(); ctx.moveTo(bx, y - 2); ctx.lineTo(bx - 4, y - 11); ctx.moveTo(bx + 6, y - 2); ctx.lineTo(bx + 9, y - 10); ctx.stroke();
      ctx.strokeStyle = tint(theme.top, 0.35); ctx.beginPath(); ctx.moveTo(bx + 3, y - 2); ctx.lineTo(bx + 3, y - 13); ctx.stroke();
      if (hsh % 7 === 0) { D.circle(ctx, x + 36, y - 6, 3.5, ['#ffd166', '#ff8fc8', '#ffffff'][hsh % 3], 1.5); }
    } else if (kind === 'snow') {
      if (hsh % 3 === 0) D.star(ctx, x + 10 + (hsh % 28), y + 3, 2.5 + (hsh % 2), '#ffffff', 0);
      ctx.fillStyle = 'rgba(120,170,230,0.35)'; ctx.fillRect(x, y + 11, T, 3);
    } else if (kind === 'cave') {
      if (hsh % 2 === 0) { ctx.fillStyle = 'rgba(94,230,208,0.8)'; ctx.beginPath(); ctx.arc(x + 12 + (hsh % 24), y + 3, 2.2, 0, Math.PI * 2); ctx.fill(); }
    } else if (kind === 'candy') {
      const cols = ['#ffffff', '#7bd3f7', '#ffd166', '#06d6a0'];
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = cols[(hsh >> (i * 3)) % 4];
        ctx.save(); ctx.translate(x + 8 + i * 15, y + 4); ctx.rotate(((hsh >> i) % 5) * 0.6);
        ctx.fillRect(-4, -1.5, 8, 3); ctx.restore();
      }
    }
  }

  function plank(ctx, x, y, w) {
    const kind = world.def.world;
    const sh = ctx.createLinearGradient(0, y + 16, 0, y + 30);                // its shadow below
    sh.addColorStop(0, 'rgba(0,0,0,0.2)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = sh; ctx.fillRect(x + 6, y + 16, w - 12, 14);
    const wood = ctx.createLinearGradient(0, y, 0, y + 16);
    wood.addColorStop(0, tint(theme.plank, 0.3)); wood.addColorStop(0.5, theme.plank); wood.addColorStop(1, tint(theme.plank, -0.25));
    D.box(ctx, x + 1, y, w - 2, 16, 7, wood, 4);
    ctx.strokeStyle = 'rgba(80,40,10,0.18)'; ctx.lineWidth = 2;
    ctx.beginPath(); for (let px = x + 10; px < x + w - 20; px += 37) { ctx.moveTo(px, y + 8); ctx.lineTo(px + 18, y + 8); } ctx.stroke();
    ctx.strokeStyle = 'rgba(43,43,43,0.35)'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let px = x + T; px < x + w - 4; px += T) { ctx.moveTo(px, y + 3); ctx.lineTo(px, y + 13); }
    ctx.stroke();
    if (kind === 'snow') { ctx.fillStyle = '#ffffff'; D.rr(ctx, x + 2, y - 5, w - 4, 8, 4); ctx.fill(); }
  }

  function thorns(ctx, x, y) {
    const kind = world.def.world;
    if (kind === 'forest') {
      // a round bramble bush with pink thorns
      ctx.fillStyle = theme.spike;
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineJoin = 'round';
      for (const [dx, dy, a] of [[6, 30, -2.4], [12, 16, -1.9], [24, 10, -1.57], [36, 16, -1.2], [42, 30, -0.7]]) {
        ctx.beginPath();
        ctx.moveTo(x + dx + Math.cos(a - 0.5) * 8, y + dy + 8 + Math.sin(a - 0.5) * 8);
        ctx.lineTo(x + dx + Math.cos(a) * 14, y + dy + 8 + Math.sin(a) * 14);
        ctx.lineTo(x + dx + Math.cos(a + 0.5) * 8, y + dy + 8 + Math.sin(a + 0.5) * 8);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.beginPath(); ctx.ellipse(x + 24, y + 34, 22, 15, 0, Math.PI, 0); ctx.lineTo(x + 46, y + T); ctx.lineTo(x + 2, y + T); ctx.closePath();
      ctx.fillStyle = '#3f8f2c'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = '#e0457b';
      for (const [dx, dy] of [[14, 34], [30, 30], [24, 42]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 3, 0, Math.PI * 2); ctx.fill(); }
      return;
    }
    // spikes: icy, crystal or candy colored
    ctx.save();
    if (kind === 'cave') { ctx.shadowColor = theme.spike; ctx.shadowBlur = 14; }
    ctx.fillStyle = theme.spike; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 2, y + T);
    const tips = [[10, 18], [24, 8], [38, 18]];
    let px = x + 2;
    for (const [tx, ty] of tips) { ctx.lineTo(x + tx, y + ty); px = x + tx + 7; ctx.lineTo(Math.min(px, x + 46), y + T - 8); }
    ctx.lineTo(x + 46, y + T);
    ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (const [tx, ty] of tips) { ctx.beginPath(); ctx.moveTo(x + tx - 1, y + ty + 8); ctx.lineTo(x + tx - 4, y + ty + 20); ctx.lineTo(x + tx, y + ty + 20); ctx.fill(); }
    ctx.restore();
  }

  // The fake walls are drawn last, over the secret room, and fade when you go in.
  function drawFakeWalls(ctx, c0, c1, r0, r1) {
    const pc = (p.x + PW / 2) / T, pr = (p.y + PH / 2) / T;
    const inside = tileAt(world, Math.floor(pc), Math.floor(pr)) === 'F' ||
      tileAt(world, Math.floor((p.x + 2) / T), Math.floor(pr)) === 'F' || tileAt(world, Math.floor((p.x + PW - 2) / T), Math.floor(pr)) === 'F';
    world.fade = approach(world.fade || 0, inside ? 1 : 0, 0.06);
    const g = (c, r) => (r >= world.rows ? '#' : tileAt(world, c, r));
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      if (g(c, r) !== 'F') continue;
      const near = Math.abs(c + 0.5 - pc) < 8 && Math.abs(r + 0.5 - pr) < 6;
      ctx.save();
      ctx.globalAlpha = 1 - (near ? world.fade * 0.8 : 0);
      const x = c * T, y = r * T;
      ctx.fillStyle = theme.dirt; ctx.fillRect(x - 0.5, y - 0.5, T + 1, T + 1);
      ctx.fillStyle = theme.dirtDot;
      const hsh = hash(c, r);
      ctx.beginPath(); ctx.arc(x + 10 + (hsh % 24), y + 14 + ((hsh >> 5) % 22), 4, 0, Math.PI * 2); ctx.fill();
      edges(ctx, c, r, (cc, rr) => groundLike(g(cc, rr)));
      if (!groundLike(g(c, r - 1))) topCap(ctx, c, r, !groundLike(g(c - 1, r)), !groundLike(g(c + 1, r)));
      // a tiny crack hints that this wall is special
      if (hsh % 2 === 0) {
        ctx.strokeStyle = 'rgba(43,43,43,0.35)'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x + 30, y + 14); ctx.lineTo(x + 24, y + 24); ctx.lineTo(x + 31, y + 32); ctx.stroke();
      }
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------
  // Drawing: things in the level
  // ---------------------------------------------------------------
  function drawDecor(ctx, d) {
    const kind = world.def.world;
    if (kind === 'forest') {
      ctx.strokeStyle = '#3f8f2c'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x, d.y - 34); ctx.stroke();
      const col = ['#ff8fc8', '#ffd166', '#9b5de5'][d.k];
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; D.circle(ctx, d.x + Math.cos(a) * 10, d.y - 40 + Math.sin(a) * 10, 8, col, 3); }
      D.circle(ctx, d.x, d.y - 40, 7, '#ffd166', 3);
    } else if (kind === 'cave') {
      crystal(ctx, d.x, d.y, 0.8, d.k === 1 ? '#ff7bd5' : '#5ee6d0');
    } else if (kind === 'snow') {
      D.circle(ctx, d.x, d.y - 22, 22, '#ffffff', 4);
      D.circle(ctx, d.x, d.y - 58, 16, '#ffffff', 4);
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(d.x - 5, d.y - 61, 2.5, 0, 7); ctx.arc(d.x + 5, d.y - 61, 2.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#ff8c42'; ctx.beginPath(); ctx.moveTo(d.x, d.y - 56); ctx.lineTo(d.x + 14, d.y - 53); ctx.lineTo(d.x, d.y - 51); ctx.fill();
      ctx.fillStyle = '#ef476f'; ctx.fillRect(d.x - 15, d.y - 46, 30, 6);
    } else {
      lollipop(ctx, d.x, d.y, 0.55, ['#ff6fb5', '#7bd3f7', '#ffd166'][d.k]);
    }
  }

  // a soft oval shadow on the ground under something
  function dropShadow(ctx, x, y, rx, a = 0.22) {
    ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.28, 0, 0, Math.PI * 2); ctx.fill();
  }
  // SNES-style shading for a round shape (`shape` is a Path2D of its outline):
  // a darker crescent at the bottom-right and a soft light spot at the top-left.
  function shadeRound(ctx, shape, cx, cy, r, base) {
    ctx.save(); ctx.clip(shape);
    ctx.fillStyle = tint(base, -0.22); ctx.beginPath(); ctx.arc(cx + r * 0.35, cy + r * 0.5, r * 1.1, 0, Math.PI * 2);
    ctx.arc(cx - r * 0.15, cy - r * 0.15, r * 1.05, 0, Math.PI * 2, true); ctx.fill('evenodd');
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(cx - r * 0.38, cy - r * 0.42, r * 0.32, r * 0.2, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawPlatform(ctx, pl) {
    // dotted line showing where it goes
    ctx.save();
    ctx.setLineDash([4, 12]); ctx.lineCap = 'round';
    ctx.strokeStyle = theme.dark ? 'rgba(255,255,255,0.35)' : 'rgba(43,43,43,0.25)'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(pl.x0 + PLAT_W / 2, pl.y0 + PLAT_H / 2); ctx.lineTo(pl.x0 + pl.dx + PLAT_W / 2, pl.y0 + pl.dy + PLAT_H / 2); ctx.stroke();
    ctx.restore();
    const x = pl.x, y = pl.y;
    const sh = ctx.createLinearGradient(0, y + PLAT_H, 0, y + PLAT_H + 16);
    sh.addColorStop(0, 'rgba(0,0,0,0.22)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = sh; ctx.fillRect(x + 8, y + PLAT_H, PLAT_W - 16, 16);
    const gr = ctx.createLinearGradient(0, y, 0, y + PLAT_H);
    gr.addColorStop(0, tint(theme.plat, 0.3)); gr.addColorStop(0.55, theme.plat); gr.addColorStop(1, tint(theme.plat, -0.28));
    D.box(ctx, x, y, PLAT_W, PLAT_H, 9, gr, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; D.rr(ctx, x + 8, y + 4, PLAT_W - 16, 5, 3); ctx.fill();
    for (const bx of [x + 14, x + PLAT_W - 14]) D.circle(ctx, bx, y + 14, 3.5, '#ffffff', 2);
    // little arrows show which way it moves
    ctx.fillStyle = 'rgba(43,43,43,0.55)';
    const mx = x + PLAT_W / 2, my = y + 13;
    ctx.beginPath();
    if (pl.dx) { ctx.moveTo(mx - 16, my); ctx.lineTo(mx - 8, my - 5); ctx.lineTo(mx - 8, my + 5); ctx.moveTo(mx + 16, my); ctx.lineTo(mx + 8, my - 5); ctx.lineTo(mx + 8, my + 5); }
    else { ctx.moveTo(mx - 6, my - 1); ctx.lineTo(mx, my - 7); ctx.lineTo(mx + 6, my - 1); ctx.moveTo(mx - 6, my + 2); ctx.lineTo(mx, my + 8); ctx.lineTo(mx + 6, my + 2); }
    ctx.fill();
  }

  function drawSpring(ctx, s) {
    const k = Math.sin(s.squish * Math.PI * 4) * s.squish;
    const h = 22 - k * 10;
    const x = s.x, bottom = s.y + s.h;
    dropShadow(ctx, x + s.w / 2, bottom, s.w * 0.55);
    D.box(ctx, x + 2, bottom - 8, s.w - 4, 8, 3, '#8d99ae', 3);
    ctx.fillStyle = '#5c6677'; ctx.fillRect(x + 4, bottom - 4, s.w - 8, 2);
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x + s.w / 2 - 10, bottom - 8);
    for (let i = 1; i <= 4; i++) ctx.lineTo(x + s.w / 2 + (i % 2 ? 10 : -10), bottom - 8 - (h - 8) * i / 4);
    ctx.stroke();
    const top = ctx.createLinearGradient(0, bottom - h - 10, 0, bottom - h + 2);
    top.addColorStop(0, '#ff8aa3'); top.addColorStop(1, '#c72f55');
    D.box(ctx, x - 2, bottom - h - 10, s.w + 4, 12, 6, top, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; D.rr(ctx, x + 4, bottom - h - 8, s.w - 10, 3, 2); ctx.fill();
  }

  // The goodies you collect: different in every world.
  function drawStar(ctx, s, t) {
    const bob = Math.sin(t * 3 + s.x * 0.05) * 4;
    dropShadow(ctx, s.x, s.y + 26, 9 - bob * 0.5, 0.12);
    ctx.save(); ctx.translate(s.x, s.y + bob);
    ctx.scale(1 + Math.sin(t * 6 + s.x) * 0.03, 1 - Math.sin(t * 6 + s.x) * 0.03);
    drawGoodie(ctx, world.def.world, t + s.x * 0.01);
    ctx.restore();
  }
  function drawGoodie(ctx, kind, t) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (kind === 'cave') {                 // a sparkly gem
      ctx.rotate(Math.sin(t * 2) * 0.15);
      ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(-7, -15); ctx.lineTo(7, -15); ctx.lineTo(14, -6); ctx.lineTo(0, 16); ctx.closePath();
      ctx.fillStyle = '#5ee6d0'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(14, -6); ctx.moveTo(-5, -6); ctx.lineTo(0, 16); ctx.lineTo(5, -6); ctx.lineWidth = 2; ctx.stroke();
      D.star(ctx, 7, -10, 3 + Math.abs(Math.sin(t * 4)) * 2, '#ffffff', 0);
    } else if (kind === 'snow') {          // a snowflake
      ctx.rotate(t * 0.8);
      for (let k = 0; k < 6; k++) {
        ctx.save(); ctx.rotate(k * Math.PI / 3);
        ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -16); ctx.moveTo(0, -9); ctx.lineTo(-5, -13); ctx.moveTo(0, -9); ctx.lineTo(5, -13); ctx.stroke();
        ctx.strokeStyle = '#bfe6ff'; ctx.lineWidth = 3.5; ctx.stroke();
        ctx.restore();
      }
      D.circle(ctx, 0, 0, 5, '#ffffff', 2.5);
    } else if (kind === 'candy') {         // a wrapped sweet
      ctx.rotate(Math.sin(t * 2) * 0.25);
      for (const sg of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(sg * 10, 0); ctx.lineTo(sg * 19, -8); ctx.lineTo(sg * 19, 8); ctx.closePath();
        ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      }
      D.circle(ctx, 0, 0, 11, '#ff6fb5', 3.5);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 5, 0.5, 2.8); ctx.stroke();
    } else {                               // forest: a juicy berry with a leaf
      for (const [bx, by] of [[-5, -2], [5, -2], [0, 6], [-6, 7], [6, 7], [0, -3]]) D.circle(ctx, bx, by, 6.5, '#ef476f', 3);
      for (const [bx, by] of [[-6, -4], [4, -4], [-1, 4]]) D.circle(ctx, bx, by, 1.6, '#ffffff', 0);
      ctx.beginPath(); ctx.ellipse(5, -12, 8, 4, -0.5, 0, 7); ctx.fillStyle = '#6cc04a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    }
    // a sparkle glint that pops up every couple of seconds
    const gk = (t * 0.6) % 1;
    if (gk < 0.25) {
      const sz = Math.sin(gk / 0.25 * Math.PI) * 7;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(-8, -10 - sz); ctx.lineTo(-6.5, -11.5); ctx.lineTo(-8 + sz, -10); ctx.lineTo(-6.5, -8.5); ctx.lineTo(-8, -10 + sz); ctx.lineTo(-9.5, -8.5); ctx.lineTo(-8 - sz, -10); ctx.lineTo(-9.5, -11.5); ctx.closePath(); ctx.fill();
    }
  }


  function drawChest(ctx, c, t) {
    const x = c.x, y = c.y;
    if (c.open && c._openAt == null) c._openAt = t;            // (looks only) when it opened, for the lid animation
    const ok = c.open ? Math.min(1, (t - c._openAt) / 0.35) : 0;   // 0 = shut, 1 = wide open
    ctx.save();
    if (c.open) {
      ctx.globalAlpha = (0.5 + Math.sin(t * 4) * 0.2) * ok;
      ctx.fillStyle = '#fff3b0';
      ctx.beginPath(); ctx.moveTo(x - 18, y - 30); ctx.lineTo(x - 40, y - 100); ctx.lineTo(x + 40, y - 100); ctx.lineTo(x + 18, y - 30); ctx.fill();
      ctx.globalAlpha = 1;
    }
    dropShadow(ctx, x, y, 30);
    const wood = ctx.createLinearGradient(0, y - 30, 0, y);
    wood.addColorStop(0, '#c97a2b'); wood.addColorStop(1, '#8a4a14');
    D.box(ctx, x - 24, y - 30, 48, 30, 5, wood, 4);
    ctx.strokeStyle = 'rgba(60,25,0,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 20, y - 12); ctx.lineTo(x + 20, y - 12); ctx.stroke();
    D.box(ctx, x - 24, y - 30, 48, 8, 3, '#ffc93c', 3);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(x - 20, y - 28, 30, 2);
    if (c.open) {
      // the lid swings up and back, and gold coins pop out
      const lidY = y - 34 - ok * 20;                             // the lid pops up and tips back
      ctx.save(); ctx.translate(x, lidY); ctx.rotate(-ok * 0.25);
      D.box(ctx, -25, -14, 50, 16, 6, '#c97a2b', 4);
      ctx.fillStyle = '#7a3f10'; D.rr(ctx, -20, -2, 40, 4, 2); ctx.fill();          // the dark inside of the lid
      D.box(ctx, -25, -14, 50, 5, 3, '#ffc93c', 2.5);
      ctx.restore();
      for (let i = 0; i < 3; i++) {
        const cy2 = y - 32 - ok * (10 + i % 2 * 6) + Math.sin(t * 4 + i) * 1.5;
        D.circle(ctx, x - 12 + i * 12, cy2, 6, '#ffd166', 2.5);
        D.circle(ctx, x - 14 + i * 12, cy2 - 2, 1.6, '#fff8d0', 0);
      }
      const tw = (Math.sin(t * 6) + 1) / 2;
      D.star(ctx, x + 16, y - 46 - ok * 8, 3 + tw * 5, '#ffffff', 2);
      D.star(ctx, x - 18, y - 40, 2 + (1 - tw) * 4, '#fff3b0', 1.5);
    } else {
      ctx.beginPath(); ctx.moveTo(x - 24, y - 28); ctx.lineTo(x - 24, y - 40); ctx.quadraticCurveTo(x, y - 56, x + 24, y - 40); ctx.lineTo(x + 24, y - 28); ctx.closePath();
      ctx.fillStyle = '#c97a2b'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      D.box(ctx, x - 6, y - 34, 12, 14, 3, '#ffc93c', 3);
      // twinkle so it's easy to notice once found
      const tw = (Math.sin(t * 5) + 1) / 2;
      D.star(ctx, x + 20, y - 50, 4 + tw * 4, '#ffffff', 2);
    }
    ctx.restore();
  }

  // Checkpoint: a lantern on a post that lights up when you pass it.
  function drawFlag(ctx, f, t, big) {
    if (big) { drawBalloon(ctx, f, t); return; }
    const x = f.x, y = f.y;
    D.box(ctx, x - 5, y - 96, 10, 96, 4, '#9a6235', 4);                 // post
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y - 92); ctx.lineTo(x + 22, y - 92); ctx.lineTo(x + 22, y - 84); ctx.stroke();
    const sw = Math.sin(t * 2.5) * 0.12;
    ctx.save(); ctx.translate(x + 22, y - 84); ctx.rotate(sw);
    if (f.on) {                                                        // warm glow
      const gl = ctx.createRadialGradient(0, 20, 4, 0, 20, 60);
      gl.addColorStop(0, 'rgba(255,214,102,0.6)'); gl.addColorStop(1, 'rgba(255,214,102,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 20, 60, 0, 7); ctx.fill();
    }
    D.box(ctx, -12, 4, 24, 30, 8, f.on ? '#ffd166' : '#d9d9d9', 4);
    D.box(ctx, -15, 0, 30, 7, 3, '#ef476f', 3); D.box(ctx, -15, 32, 30, 7, 3, '#ef476f', 3);
    if (f.on) D.circle(ctx, 0, 19, 5 + Math.sin(t * 8) * 1, '#fff6c2', 0);
    ctx.restore();
  }
  // The goal: a hot-air balloon. When you reach it, you hop in and float away!
  function drawBalloon(ctx, f, t) {
    const lift = f.lift || 0, x = f.x, y = f.y - lift + Math.sin(t * 2) * 3;
    ctx.save(); ctx.translate(x, y - 26); ctx.rotate(Math.sin(t * 1.3) * 0.035); ctx.translate(-x, -(y - 26));   // a gentle sway
    ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - 20, y - 44); ctx.lineTo(x - 34, y - 110); ctx.moveTo(x + 20, y - 44); ctx.lineTo(x + 34, y - 110); ctx.stroke();
    // the balloon: colorful stripes
    const cols = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2'];
    ctx.save(); ctx.beginPath(); ctx.ellipse(x, y - 170, 70, 80, 0, 0, 7); ctx.clip();
    for (let k = 0; k < 6; k++) { ctx.fillStyle = cols[k % 4]; ctx.fillRect(x - 70 + k * 24, y - 260, 24, 200); }
    const shade = ctx.createRadialGradient(x - 26, y - 200, 10, x, y - 170, 90);       // round, shiny shading
    shade.addColorStop(0, 'rgba(255,255,255,0.35)'); shade.addColorStop(0.55, 'rgba(255,255,255,0)'); shade.addColorStop(1, 'rgba(40,20,60,0.4)');
    ctx.fillStyle = shade; ctx.fillRect(x - 72, y - 252, 144, 164);
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(x, y - 170, 70, 80, 0, 0, 7); ctx.lineWidth = 4.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 34, y - 110); ctx.quadraticCurveTo(x, y - 98, x + 34, y - 110); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(x - 34, y - 196, 10, 22, 0.3, 0, 7); ctx.fill();
    if (finished) { drawHero(ctx, heroDef, x, y - 30, { state: 'jump', face: 1, t }); }   // you, riding in the basket
    const bk = ctx.createLinearGradient(0, y - 46, 0, y - 6);
    bk.addColorStop(0, '#dca06c'); bk.addColorStop(1, '#9a6235');
    D.box(ctx, x - 26, y - 46, 52, 40, 8, bk, 4);               // the basket
    ctx.strokeStyle = 'rgba(43,43,43,0.4)'; ctx.lineWidth = 3;
    for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - 26 + k * 13, y - 44); ctx.lineTo(x - 26 + k * 13, y - 8); ctx.stroke(); }
    if (!finished) {                                                   // a little flame puffing
      ctx.beginPath(); ctx.moveTo(x - 8, y - 104); ctx.quadraticCurveTo(x, y - 128 - Math.sin(t * 12) * 6, x + 8, y - 104); ctx.closePath();
      ctx.fillStyle = '#ff8c42'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 4, y - 104); ctx.quadraticCurveTo(x, y - 118 - Math.sin(t * 12) * 4, x + 4, y - 104); ctx.closePath();
      ctx.fillStyle = '#ffd166'; ctx.fill();
    }
    ctx.restore();
  }


  // Critters: round, bouncy pom-pom bugs. Each world has its own kind:
  //   forest: a red spotty bug on little legs     cave: a glowing firefly with buzzing wings
  //   snow: a fluffy snowball in a scarf           candy: a wobbly gummy blob
  // They waddle (4-step walk), blink, and squash flat when you bounce on them.
  // ---------------------------------------------------------------
  // The critters (Nov 22 redraw, plan point 1: one proper little animal per world,
  // two big eyes, cleaner outlines). They never hurt anyone on purpose: bounce on
  // them and they poof into sparkles. (x, y) = bottom-center of the hit box.
  //   forest: a ladybug   cave: a glowing firefly   snow: a snow puff in earmuffs
  //   candy: a wobbly gumdrop
  // The picture is drawn facing LEFT (-x); cr.dir flips it.
  // kind = the world; the preview tool (tools/preview_jungle.py) passes it in.
  // ---------------------------------------------------------------
  function drawCritter(ctx, cr, t, kind = world.def.world) {
    if (!cr.alive) return;
    const theme = WORLDS[kind];
    const x = cr.x + cr.w / 2, y = cr.y + cr.h;
    const sq = (cr.squish || 0);
    const step = Math.floor((t * 8 + cr.x0) % 4);                 // 4 walk frames
    const fly = kind === 'cave';
    const hop = fly ? 6 + Math.sin(t * 5 + cr.x0) * 4 : kind === 'candy' ? [0, 2, 4, 2][step] : [0, 2, 0, 1][step];
    dropShadow(ctx, x, y, fly ? 14 : 18, fly ? 0.14 : 0.22);
    ctx.save(); ctx.translate(x, y); ctx.scale(cr.dir < 0 ? 1 : -1, 1);
    ctx.scale(1 + sq * 0.45, 1 - sq * 0.45);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const blink = ((t + cr.x0 * 0.37) % 2.8) < 0.12;
    const oof = sq > 0.3;
    const L = 3.5;
    const outline = (path, w = L) => { ctx.lineWidth = w; ctx.strokeStyle = INK; ctx.stroke(path); };
    // a filled + shaded + outlined oval (shade at the bottom-back, a shine at the top-front)
    const blob = (cx, cy, rx, ry, col, w = L) => {
      const pth = new Path2D(); pth.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.fill(pth);
      ctx.save(); ctx.clip(pth);
      ctx.fillStyle = tint(col, -0.2); ctx.beginPath(); ctx.ellipse(cx + rx * 0.25, cy + ry * 0.75, rx * 1.2, ry * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(cx - rx * 0.4, cy - ry * 0.5, rx * 0.28, ry * 0.18, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore(); outline(pth, w);
      return pth;
    };
    // two big friendly eyes (+ shine), closed when blinking, squeezed shut when bounced on
    const eyes = (cx, cy, gap, r, onDark) => {
      for (const s of [-1, 1]) {
        const ex = cx + s * gap;
        ctx.strokeStyle = onDark ? '#ffffff' : INK; ctx.lineWidth = 2.6;
        if (oof) { ctx.beginPath(); ctx.moveTo(ex - 3, cy - 3); ctx.lineTo(ex + 2, cy); ctx.lineTo(ex - 3, cy + 3); ctx.stroke(); continue; }
        if (blink) { ctx.beginPath(); ctx.arc(ex, cy - 1, r * 0.8, 0.2, Math.PI - 0.2); ctx.stroke(); continue; }
        D.circle(ctx, ex, cy, r, '#ffffff', 2.5);
        const look = -1.2 + Math.sin(t * 2 + cr.x0) * 0.8;          // looking ahead (left), a little wander
        D.circle(ctx, ex + look, cy + 0.5, r * 0.62, INK, 0);
        D.circle(ctx, ex + look + 1.2, cy - 1.2, r * 0.22, '#ffffff', 0);
      }
    };
    const smile = (cx, cy, w) => {
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
      if (oof) { ctx.beginPath(); ctx.ellipse(cx, cy + 1, 2.6, 3.2, 0, 0, 7); ctx.fillStyle = '#c8344f'; ctx.fill(); ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(cx, cy - 1, w, 0.25, Math.PI - 0.25); ctx.stroke(); }
    };
    const cheeks = (cx, cy, gap) => {
      ctx.fillStyle = 'rgba(255,107,129,0.6)';
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + s * gap, cy, 3.4, 2.3, 0, 0, 7); ctx.fill(); }
    };

    if (kind === 'forest') {
      // ---- a ladybug: six little legs, a spotted shell, a round dark head in front
      const by = -15 - hop;
      ctx.strokeStyle = INK; ctx.lineWidth = 3;
      [-12, -2, 8].forEach((lx, i) => {
        const lift = ((step + i) % 2) * 3;
        ctx.beginPath(); ctx.moveTo(lx, by + 6); ctx.lineTo(lx - 3, -1 - lift); ctx.lineTo(lx - 6, -1 - lift); ctx.stroke();
      });
      // antennae
      for (const s of [0, 1]) {
        const wob = Math.sin(t * 8 + s * 2) * 2;
        ctx.beginPath(); ctx.moveTo(-20 + s * 6, by - 9); ctx.quadraticCurveTo(-26 + s * 6, by - 22, -30 + s * 7 + wob, by - 24); ctx.stroke();
        D.circle(ctx, -30 + s * 7 + wob, by - 25, 3.2, INK, 0);
      }
      blob(-16, by - 1, 11, 10, '#4a4058');                            // head
      const shell = blob(4, by, 19, 14, theme.critter);                // the red shell
      ctx.save(); ctx.clip(shell);
      ctx.fillStyle = INK;
      for (const [sx, sy, r] of [[-6, -6, 3.6], [6, -9, 3.2], [14, -1, 3.4], [-2, 4, 3], [8, 6, 2.8]]) { ctx.beginPath(); ctx.arc(4 + sx, by + sy, r, 0, 7); ctx.fill(); }
      ctx.restore();
      ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(-8, by - 9); ctx.quadraticCurveTo(6, by - 4, 22, by + 2); ctx.stroke();   // where the wings meet
      eyes(-19, by - 3, 4.6, 4.4, false);
      cheeks(-17, by + 4, 7);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2;
      if (oof) { ctx.beginPath(); ctx.ellipse(-17, by + 5, 2.2, 2.6, 0, 0, 7); ctx.fillStyle = '#c8344f'; ctx.fill(); ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(-17, by + 3, 3, 0.3, Math.PI - 0.3); ctx.stroke(); }
    } else if (kind === 'cave') {
      // ---- a firefly: a glowing tail light, buzzing wings, a round face in front
      const by = -18 - hop;
      const pulse = 0.75 + Math.sin(t * 4 + cr.x0) * 0.25;
      const gl = ctx.createRadialGradient(12, by + 2, 3, 12, by + 2, 34);
      gl.addColorStop(0, `rgba(255,236,130,${0.6 * pulse})`); gl.addColorStop(1, 'rgba(255,236,130,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(12, by + 2, 34, 0, 7); ctx.fill();
      const wf = Math.sin(t * 40) * 0.45;
      for (const s of [0, 1]) {                                        // wings (behind)
        ctx.save(); ctx.translate(2 + s * 7, by - 9); ctx.rotate(0.35 + s * 0.35 + wf);
        const w = new Path2D(); w.ellipse(0, -10, 6.5, 12, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(225,242,255,0.8)'; ctx.fill(w); outline(w, 2.5);
        ctx.restore();
      }
      const tail = blob(15, by + 3, 10, 9, '#fff3a0');                 // the light
      ctx.save(); ctx.clip(tail); ctx.fillStyle = `rgba(255,255,255,${0.5 * pulse})`; ctx.beginPath(); ctx.arc(13, by + 1, 6, 0, 7); ctx.fill(); ctx.restore();
      blob(1, by + 1, 11, 9, theme.spots);                             // the striped middle
      ctx.strokeStyle = 'rgba(43,43,43,0.45)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(2, by - 7); ctx.lineTo(4, by + 9); ctx.moveTo(8, by - 6); ctx.lineTo(9, by + 8); ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = 3;                         // antennae
      for (const s of [0, 1]) {
        const wob = Math.sin(t * 8 + s * 2) * 2;
        ctx.beginPath(); ctx.moveTo(-14 + s * 7, by - 12); ctx.quadraticCurveTo(-20 + s * 7, by - 24, -22 + s * 8 + wob, by - 27); ctx.stroke();
        D.circle(ctx, -22 + s * 8 + wob, by - 28, 3.4, '#fff6b0', 2.2);
      }
      blob(-12, by, 13, 12, theme.critter);                            // head
      eyes(-15, by - 2, 5, 4.6, false);
      cheeks(-13, by + 5, 8);
      smile(-14, by + 6, 3.2);
    } else if (kind === 'snow') {
      // ---- a snow puff: a fluffy snowball in blue earmuffs and little boots
      const by = -18 - hop;
      [-8, 8].forEach((lx, i) => {
        const lift = ((step + i) % 2) * 3;
        blob(lx - 1, -4 - lift, 6.5, 4.8, '#5d9bd8', 3);
      });
      const fluff = new Path2D();
      for (let k = 0; k <= 30; k++) {
        const a = k / 30 * Math.PI * 2, r = 18 + (k % 2 ? 1.8 : -0.4);
        fluff.lineTo(Math.cos(a) * r, by + Math.sin(a) * r * 0.95);
      }
      fluff.closePath();
      ctx.fillStyle = '#f7fbff'; ctx.fill(fluff);
      ctx.save(); ctx.clip(fluff);
      ctx.fillStyle = '#d6e6f7'; ctx.beginPath(); ctx.ellipse(4, by + 14, 24, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore(); outline(fluff);
      // earmuffs: a band over the top and two round muffs
      ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, by, 17, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
      ctx.strokeStyle = '#5d9bd8'; ctx.lineWidth = 3.5; ctx.stroke();
      for (const s of [-1, 1]) blob(s * 16, by - 2, 5.5, 7, '#7ec4f0', 3);
      eyes(-5, by - 2, 5.5, 4.8, false);
      cheeks(-4, by + 6, 10);
      smile(-5, by + 7, 3.4);
    } else {
      // ---- a gumdrop: a wobbly jelly dome with sugar sprinkles
      const wob = Math.sin(t * 7 + cr.x0) * 1.6;
      const top = -34 - hop * 0.5 + wob;
      const drop = new Path2D();
      drop.moveTo(-19 - wob, -1); drop.quadraticCurveTo(-21 - wob, top + 6, 0, top);
      drop.quadraticCurveTo(21 + wob, top + 6, 19 + wob, -1); drop.quadraticCurveTo(0, 2, -19 - wob, -1); drop.closePath();
      ctx.fillStyle = theme.critter; ctx.fill(drop);
      ctx.save(); ctx.clip(drop);
      ctx.fillStyle = tint(theme.critter, -0.18); ctx.beginPath(); ctx.ellipse(5, 2, 26, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(-2, top + 16, 11, 12, 0, 0, Math.PI * 2); ctx.fill();   // see-through jelly
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(-9, top + 9, 4.5, 2.6, -0.7, 0, Math.PI * 2); ctx.fill();
      ['#ffffff', '#ffd166', '#ef476f', '#ffffff'].forEach((c, i) => {                                            // sugar sprinkles
        ctx.save(); ctx.translate(-8 + i * 6, top + 5 + (i % 2) * 3); ctx.rotate(i * 0.9); ctx.fillStyle = c; ctx.fillRect(-2.2, -1, 4.4, 2); ctx.restore();
      });
      ctx.restore(); outline(drop);
      eyes(-5, -17 - hop * 0.5 + wob * 0.5, 5.5, 4.6, false);
      cheeks(-4, -10 - hop * 0.5, 10);
      smile(-5, -9 - hop * 0.5, 3.4);
    }
    ctx.restore();
  }


  // ---------------------------------------------------------------
  // The hero. (x, y) = bottom-center. Also used for the menu pictures.
  //   o.state: idle | run | jump | fall | glide | hurt
  //   o.phase: the run cycle (grows as you run), o.t: time (for breathing,
  //   blinking, tail sway), o.sx/o.sy: squash & stretch, o.face: 1 or -1
  // Nov 22 redraw (plan point 1): a big round head on a small body (easier to
  // read on a phone), one clean outline weight, and each animal's own details:
  //   Momo the monkey: heart-shaped face, round ears, curly tail
  //   Pip the frog: eyes up on bumps, a wide smile, spots
  //   Bun the bunny: long ears, two front teeth, a puffy tail
  //   Rusty the fox: pointy ears with dark tips, white cheeks, a big bushy tail
  //   Bao the panda: black ears, arms, legs and eye patches
  // Layers, back to front: tail, back arm, feet, body, ears, head, face, front arm.
  // ---------------------------------------------------------------
  function drawHero(ctx, h, x, y, o = {}) {
    const face = o.face || 1;
    const state = o.state || 'idle';
    const ph = o.phase || 0, t = o.t || 0;
    const run = state === 'run', air = state === 'jump' || state === 'fall' || state === 'glide';
    ctx.save();
    ctx.translate(x, y);
    if (o.shadow) dropShadow(ctx, 0, 0, 17);          // a soft shadow under your feet when standing
    // idle breathing: a tiny up-and-down squash
    const breathe = state === 'idle' ? Math.sin(t * 3) * 0.025 : 0;
    ctx.scale((o.sx || 1) * (1 - breathe), (o.sy || 1) * (1 + breathe));
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const L = 3.5;
    const id = h.id;
    const WHITE = '#f6f9fd';
    const body = h.body === '#ffffff' ? WHITE : h.body;
    const belly = h.belly === '#ffffff' ? WHITE : h.belly;
    const limb = id === 'panda' ? '#34303a' : body;              // panda has black arms and legs
    const stroke = (pth, w = L) => { ctx.lineWidth = w; ctx.strokeStyle = INK; ctx.stroke(pth); };
    // fill a shape, shade its bottom/back (a crescent) + a small shine at the top-front, then outline it
    const part = (pth, col, cx, cy, rx, ry, w = L) => {
      ctx.fillStyle = col; ctx.fill(pth);
      ctx.save(); ctx.clip(pth);
      ctx.fillStyle = col === WHITE ? '#d9e3f0' : tint(col, -0.2);
      ctx.beginPath(); ctx.rect(cx - rx * 2, cy - ry * 2, rx * 4, ry * 4);
      ctx.ellipse(cx + face * rx * 0.18, cy - ry * 0.16, rx * 0.98, ry * 0.92, 0, 0, Math.PI * 2, true); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath(); ctx.ellipse(cx + face * rx * 0.1 - face * rx * 0.35, cy - ry * 0.55, rx * 0.26, ry * 0.15, -0.5 * face, 0, Math.PI * 2); ctx.fill();
      ctx.restore(); stroke(pth, w);
    };
    const oval = (cx, cy, rx, ry, rot = 0) => { const p2 = new Path2D(); p2.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2); return p2; };

    // run cycle: s1/s2 swing opposite ways; the body bobs twice per cycle
    const s1 = Math.sin(ph), c1 = Math.cos(ph);
    const bob = run ? -Math.abs(c1) * 4 : 0;
    const lean = run ? 0.08 : state === 'fall' ? -0.05 : 0;

    // where things are (feet at y = 0)
    const BY = -14;                       // body middle
    const HX = face * 1, HY = -33;        // head middle
    const HR = id === 'frog' ? 18.5 : 17.5, HRY = id === 'frog' ? 15 : 16.5;
    const FX = HX + face * 4.5;           // middle of the face (turned a little toward where you're going)

    // ---- feet
    const footAt = (side) => {
      if (run) { const k = side < 0 ? s1 : -s1, up = Math.max(0, side < 0 ? c1 : -c1); return [side * 6 + k * 8, -4 - up * 6]; }
      if (state === 'jump') return [side * 6, -9];                          // tucked up
      if (state === 'fall') return [side * 9, -2 + Math.sin(t * 14 + side) * 2]; // dangling and kicking
      if (state === 'glide') return [side * 6 + Math.sin(t * 6 + side) * 3, -1];
      if (state === 'hurt') return [side * 10, -3];
      return [side * 7.5, -4];
    };
    const drawFoot = (side) => {
      const [fx0, fy0] = footAt(side);
      ctx.save(); ctx.translate(fx0, fy0); ctx.scale(face, 1);
      const big = id === 'frog' || id === 'bunny' ? 1.15 : 1;          // hoppers have bigger feet
      const f = oval(2, 0, 8 * big, 5.2, 0);
      ctx.fillStyle = limb; ctx.fill(f);
      ctx.save(); ctx.clip(f); ctx.fillStyle = id === 'panda' ? '#55505c' : tint(belly, -0.04); ctx.fillRect(-10, 1.8, 24, 6); ctx.restore();   // the sole
      stroke(f, 3);
      ctx.lineWidth = 1.8; ctx.strokeStyle = id === 'panda' ? 'rgba(255,255,255,0.35)' : 'rgba(43,43,43,0.45)';   // toes
      ctx.beginPath(); ctx.moveTo(6 * big, -2.6); ctx.lineTo(6 * big, 0.6); ctx.moveTo(8.6 * big, -2); ctx.lineTo(8.6 * big, 1); ctx.stroke();
      ctx.restore();
    };
    // ---- arms: a short round arm with a hand at the end
    const armAngle = (side) => {                   // 0 = straight down, positive = outward and up
      if (run) return (side === face ? s1 : -s1) * 0.9 + 0.25;
      if (state === 'jump') return 2.5;            // both arms up
      if (state === 'fall') return 2.1 + Math.sin(t * 16 + side * 2) * 0.35;   // flapping
      if (state === 'glide') return 2.85;          // holding the leaf above the head
      if (state === 'hurt') return 2.2;
      return 0.4 + Math.sin(t * 3 + side) * 0.05;
    };
    const drawArm = (side) => {
      ctx.save(); ctx.translate(side * 10.5, BY - 5);
      ctx.rotate(-side * armAngle(side));
      const a = oval(0, 6.5, 4.6, 8.2);
      ctx.fillStyle = limb; ctx.fill(a);
      ctx.save(); ctx.clip(a); ctx.fillStyle = id === 'panda' ? '#4a4550' : tint(limb, -0.18); ctx.fillRect(side * face > 0 ? 1 : -9, -4, 8, 22); ctx.restore();
      stroke(a, 3);
      D.circle(ctx, 0, 14, 4.4, id === 'monkey' ? belly : limb, 3);
      ctx.restore();
    };

    ctx.translate(0, bob);
    ctx.rotate(lean * face);

    // ---- tail (behind everything), it sways
    const sway = Math.sin(t * (run ? 10 : 3)) * (run ? 0.35 : 0.15) + (air ? -0.3 : 0);
    ctx.save(); ctx.scale(face, 1); ctx.translate(-10, BY + 2); ctx.rotate(sway);
    if (id === 'monkey') {                       // a long curly tail
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-16, 2, -24, -10, -18, -22); ctx.bezierCurveTo(-13, -30, -4, -27, -6, -20);
      ctx.strokeStyle = INK; ctx.lineWidth = 9.5; ctx.stroke(); ctx.strokeStyle = body; ctx.lineWidth = 4.5; ctx.stroke();
    } else if (id === 'fox') {                   // a big bushy tail with a white tip, all one shape
      const tl = new Path2D();
      tl.moveTo(2, 3); tl.bezierCurveTo(-14, 8, -30, 2, -30, -16); tl.bezierCurveTo(-30, -26, -22, -30, -17, -26);
      tl.bezierCurveTo(-18, -14, -10, -6, 2, -6); tl.closePath();
      ctx.fillStyle = body; ctx.fill(tl);
      ctx.save(); ctx.clip(tl);
      ctx.fillStyle = tint(body, -0.2); ctx.beginPath(); ctx.ellipse(-12, 6, 20, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fffaf2'; ctx.beginPath(); ctx.ellipse(-25, -24, 11, 9, -0.5, 0, Math.PI * 2); ctx.fill();   // white tip
      ctx.restore();
      stroke(tl);
      ctx.strokeStyle = 'rgba(43,43,43,0.4)'; ctx.lineWidth = 2;            // a line where the white starts
      ctx.beginPath(); ctx.moveTo(-31, -15); ctx.quadraticCurveTo(-24, -14, -18, -22); ctx.stroke();
    } else if (id === 'bunny' || id === 'panda') {   // a little round puff
      const pf = oval(-2, 0, 7, 6.6);
      ctx.fillStyle = id === 'panda' ? '#34303a' : WHITE; ctx.fill(pf); stroke(pf, 3);
    }
    ctx.restore();

    // ---- back arm, feet, body
    drawArm(-face);
    drawFoot(-1); drawFoot(1);
    const bd = oval(0, BY, 13, 12);
    part(bd, body, 0, BY, 13, 12);
    const bl = oval(face * 3, BY + 1.5, 8, 8.5);                     // the tummy
    ctx.fillStyle = id === 'panda' ? WHITE : belly; ctx.fill(bl);
    ctx.save(); ctx.clip(bl); ctx.fillStyle = 'rgba(120,70,40,0.12)'; ctx.beginPath(); ctx.ellipse(face * 3, BY + 9, 10, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    if (id === 'panda') {                                             // panda: a black band over the shoulders
      ctx.save(); ctx.clip(bd); ctx.fillStyle = '#34303a'; ctx.fillRect(-16, BY - 14, 32, 8); ctx.restore(); stroke(bd);
    }

    // ---- ears (behind the head)
    const earUp = state === 'jump' || state === 'glide' ? -3 : state === 'fall' ? 3 : 0;
    const earWig = Math.sin(t * 4) * 0.06;
    if (id === 'monkey') {
      for (const s of [-1, 1]) {
        const ex0 = HX + s * 17, ey0 = HY + 1;
        part(oval(ex0, ey0, 8, 8), body, ex0, ey0, 8, 8);
        ctx.fillStyle = h.extra; ctx.beginPath(); ctx.ellipse(ex0 + s * 0.8, ey0, 4.4, 4.6, 0, 0, Math.PI * 2); ctx.fill();
      }
    } else if (id === 'bunny') {
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(HX + s * 7, HY - 13 + earUp);
        ctx.rotate(s * 0.16 + earWig * s + (state === 'fall' ? s * 0.5 : 0) + (run ? -face * 0.25 : 0));
        const ear = oval(0, -13, 6.5, 16);
        part(ear, WHITE, 0, -13, 6.5, 16);
        ctx.fillStyle = h.extra; ctx.beginPath(); ctx.ellipse(0, -12, 3, 10.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    } else if (id === 'fox') {
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(HX + s * 10, HY - 11); ctx.rotate(s * 0.25 + earWig * s);
        const ear = new Path2D(); ear.moveTo(-6.5, 4); ear.quadraticCurveTo(-3, -12 + earUp, 0, -15 + earUp); ear.quadraticCurveTo(3, -12 + earUp, 6.5, 4); ear.closePath();
        ctx.fillStyle = body; ctx.fill(ear);
        ctx.save(); ctx.clip(ear); ctx.fillStyle = '#3a2f2f'; ctx.fillRect(-8, -18 + earUp, 16, 9); ctx.restore();   // dark tips
        stroke(ear);
        ctx.fillStyle = '#ffe2c8'; ctx.beginPath(); ctx.moveTo(-2.8, 3); ctx.lineTo(0, -6 + earUp); ctx.lineTo(2.8, 3); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    } else if (id === 'panda') {
      for (const s of [-1, 1]) {
        const ex0 = HX + s * 13, ey0 = HY - 13;
        ctx.fillStyle = '#34303a'; const e = oval(ex0, ey0, 7.5, 7); ctx.fill(e); stroke(e);
        D.circle(ctx, ex0 - s * 1, ey0 - 1.5, 2.2, '#55505c', 0);
      }
    } else if (id === 'frog') {                  // the eye bumps on top
      for (const s of [-1, 1]) {
        const ex0 = HX + face * 3 + s * 8.5, ey0 = HY - 12;
        part(oval(ex0, ey0, 8.5, 8), body, ex0, ey0, 8.5, 8);
      }
    }

    // ---- head
    const hd = oval(HX, HY, HR, HRY);
    part(hd, body, HX, HY, HR, HRY);
    // the face patch for each animal (inside the head, so no outline pokes out)
    ctx.save(); ctx.clip(hd);
    if (id === 'monkey') {                       // heart-shaped face: two eye circles + a muzzle
      ctx.fillStyle = belly;
      ctx.beginPath(); ctx.arc(FX - 6, HY - 3, 7.5, 0, 7); ctx.arc(FX + 6, HY - 3, 7.5, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(FX, HY + 6, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
    } else if (id === 'fox') {                   // white cheeks
      ctx.fillStyle = '#fffaf2'; ctx.beginPath(); ctx.ellipse(FX, HY + 11, 16, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(FX, HY + 3, 4, 8, 0, 0, Math.PI * 2); ctx.fill();
    } else if (id === 'frog') {                  // a pale chin + two spots on the back of the head
      ctx.fillStyle = belly; ctx.beginPath(); ctx.ellipse(FX, HY + 11, 15, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = tint(body, -0.22);
      ctx.beginPath(); ctx.arc(HX - face * 12, HY - 4, 3.2, 0, 7); ctx.arc(HX - face * 7, HY - 9, 2.2, 0, 7); ctx.fill();
    } else if (id === 'monkey' || id === 'bunny') {
      // (bunny: the white head is the face)
    }
    if (id === 'monkey' || id === 'fox') {      // fur tufts on top
      ctx.strokeStyle = tint(body, -0.32); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(HX - 3, HY - 16); ctx.lineTo(HX - 1, HY - 12); ctx.moveTo(HX + 2, HY - 17); ctx.lineTo(HX + 3, HY - 12); ctx.stroke();
    }
    ctx.restore();
    if (id === 'monkey') {                       // the little hair tuft sticking up
      const tf = new Path2D(); tf.moveTo(HX - 3, HY - 15.5); tf.quadraticCurveTo(HX + 1, HY - 24, HX + 7, HY - 20); tf.quadraticCurveTo(HX + 4, HY - 18, HX + 4, HY - 15.5);
      ctx.fillStyle = body; ctx.fill(tf); stroke(tf, 3);
    }

    // ---- eyes: big and dark with two shine dots; they blink now and then
    const autoBlink = t > 0 && (state === 'idle' || state === 'run') && ((t + (id.length * 0.7)) % 3.4) < 0.13;
    const blink = o.blink || autoBlink;
    const eyeAt = (s) => id === 'frog' ? [HX + face * 3 + s * 8.5 + face, HY - 12.5] : [FX + s * 6.5 + face * 0.5, HY - 3];
    for (const s of [-1, 1]) {
      const [cx, ey] = eyeAt(s);
      if (id === 'panda') { ctx.beginPath(); ctx.ellipse(cx - face * 0.5, ey + 1, 5.6, 7.2, s * -0.45, 0, Math.PI * 2); ctx.fillStyle = '#34303a'; ctx.fill(); }
      const light = id === 'panda';
      if (state === 'hurt') {                        // dizzy little X eyes
        ctx.strokeStyle = light ? '#fff' : INK; ctx.lineWidth = 2.8;
        ctx.beginPath(); ctx.moveTo(cx - 3.2, ey - 3.2); ctx.lineTo(cx + 3.2, ey + 3.2); ctx.moveTo(cx + 3.2, ey - 3.2); ctx.lineTo(cx - 3.2, ey + 3.2); ctx.stroke();
        continue;
      }
      if (blink) {                                   // closed: a happy curved line
        ctx.strokeStyle = light ? '#fff' : INK; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, ey - 1, 3.8, 0.2, Math.PI - 0.2); ctx.stroke();
        continue;
      }
      const big = state === 'fall' ? 1.15 : 1;
      if (light) { ctx.beginPath(); ctx.ellipse(cx, ey, 3.6 * big, 4.6 * big, 0, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); }
      const rx = (light ? 2.7 : 3.9) * big, ry = (light ? 3.6 : 5.2) * big;
      ctx.beginPath(); ctx.ellipse(cx, ey + 0.5, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
      ctx.save(); ctx.clip(); ctx.fillStyle = '#5a4870'; ctx.beginPath(); ctx.ellipse(cx, ey + ry, rx, ry * 0.55, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();   // soft color at the bottom of the eye
      D.circle(ctx, cx + 1.3, ey - 1.8, 1.7 * big, '#ffffff', 0);
      D.circle(ctx, cx - 1.1, ey + 2.1, 0.85 * big, '#ffffff', 0);
    }
    // eyebrows: happy little arcs, worried when hurt or falling
    if (id !== 'frog') {
      ctx.strokeStyle = id === 'panda' ? '#8a8494' : 'rgba(43,43,43,0.75)'; ctx.lineWidth = 2.4;
      for (const s of [-1, 1]) {
        const [bx, ey] = eyeAt(s), by = ey - 9 + (state === 'jump' || state === 'glide' ? -1.2 : 0);
        ctx.beginPath();
        if (state === 'hurt' || state === 'fall') { ctx.moveTo(bx - 2.8, by + s * 1.1); ctx.lineTo(bx + 2.8, by - s * 1.1); }
        else ctx.arc(bx, by + 3, 3.2, Math.PI * 1.22, Math.PI * 1.78);
        ctx.stroke();
      }
    }
    // cheeks
    ctx.fillStyle = 'rgba(255,107,129,0.55)';
    const chY = id === 'frog' ? HY + 3 : HY + 5;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(FX + s * 11.5, chY, 3.6, 2.4, 0, 0, Math.PI * 2); ctx.fill(); }
    // nose
    const NY = HY + 3.5, MX = FX + face * 0.5;
    if (id === 'monkey') {                       // two nostrils on the muzzle
      ctx.fillStyle = INK; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(MX + s * 2, NY + 0.5, 1.1, 1.4, 0, 0, 7); ctx.fill(); }
    } else if (id !== 'frog') {
      ctx.fillStyle = id === 'bunny' ? '#ff8fb8' : INK;
      ctx.beginPath(); ctx.ellipse(MX, NY, id === 'bunny' ? 2.6 : 3.1, 2.1, 0, 0, Math.PI * 2); ctx.fill();
      D.circle(ctx, MX - 0.9, NY - 0.7, 0.8, '#ffffff', 0);
    }
    // mouth: smile, a happy open mouth in the air or running, an "o" when hurt
    const MY = id === 'frog' ? HY + 3 : NY + 3.5;
    const wide = id === 'frog' ? 8 : 4.5;
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    if (state === 'hurt' || state === 'fall') { ctx.fillStyle = '#c8344f'; ctx.beginPath(); ctx.ellipse(MX, MY + 2, 2.7, 3.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    else if (state === 'jump' || state === 'glide' || run) {
      ctx.beginPath(); ctx.moveTo(MX - wide, MY); ctx.quadraticCurveTo(MX, MY + (id === 'frog' ? 8 : 7), MX + wide, MY); ctx.closePath();
      ctx.fillStyle = '#c8344f'; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.ellipse(MX, MY + 3.4, wide * 0.45, 1.4, 0, 0, 7); ctx.fill();     // tongue
    } else {
      ctx.beginPath();
      if (id === 'frog') { ctx.moveTo(MX - wide, MY - 1); ctx.quadraticCurveTo(MX, MY + 6, MX + wide, MY - 1); }
      else { ctx.moveTo(MX - 4, MY); ctx.quadraticCurveTo(MX - 2, MY + 2.6, MX, MY); ctx.quadraticCurveTo(MX + 2, MY + 2.6, MX + 4, MY); }   // a little "w" smile
      ctx.stroke();
    }
    if (id === 'bunny' && state !== 'hurt' && state !== 'fall') {   // two front teeth
      ctx.fillStyle = '#ffffff'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.rect(MX - 2.4, MY + 0.8, 4.8, 3.6); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(MX, MY + 0.8); ctx.lineTo(MX, MY + 4.4); ctx.stroke();
    }

    // ---- front arm last, so it's on top of the body
    drawArm(face);
    ctx.restore();
  }

  // Rolling: the hero curls up into a ball with speed lines behind.
  function drawRollBall(ctx, h, x, y, face, spin, t) {
    const body = h.body === '#ffffff' ? '#f4f7fb' : h.body;
    // speed lines
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      ctx.lineWidth = 5 - k;
      const yy = y - 8 + k * 9, len = 16 + ((t * 40 + k * 7) % 10);
      ctx.beginPath(); ctx.moveTo(x - face * 24, yy); ctx.lineTo(x - face * (24 + len), yy); ctx.stroke();
    }
    ctx.restore();
    dropShadow(ctx, x, y + 20, 16);
    ctx.save(); ctx.translate(x, y); ctx.rotate(spin);
    const ball = new Path2D(); ball.arc(0, 0, 19, 0, Math.PI * 2);
    ctx.fillStyle = body; ctx.fill(ball);
    shadeRound(ctx, ball, 0, 0, 19, body);
    ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke(ball);
    // a curl line, a tucked ear and a closed happy eye so you can see it spin
    ctx.strokeStyle = tint(body, -0.35); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 11, 0.3, Math.PI * 1.4); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(6, -6, 7, 6, 0, 0, Math.PI * 2); ctx.fillStyle = h.belly; ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(7, -7, 3, 0.2, Math.PI - 0.2); ctx.stroke();
    D.circle(ctx, -8, 9, 5, h.id === 'panda' ? INK : (h.id === 'monkey' ? h.extra : tint(body, -0.15)), 2.5);
    ctx.restore();
  }

  // The big leaf the hero holds up while gliding: shaded, with veins, and its tips flutter.
  function drawLeaf(ctx, x, y, t) {
    const fl = Math.sin(t * 9) * 3;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 5) * 0.08);
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(0, -22); ctx.stroke();
    ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 2; ctx.stroke();
    const leaf = new Path2D();
    leaf.moveTo(-44, -16 + fl); leaf.quadraticCurveTo(-34, -54, 0, -56); leaf.quadraticCurveTo(34, -54, 44, -16 - fl);
    leaf.quadraticCurveTo(22, -26, 0, -24); leaf.quadraticCurveTo(-22, -26, -44, -16 + fl); leaf.closePath();
    const gr = ctx.createLinearGradient(0, -56, 0, -18);
    gr.addColorStop(0, '#9be36f'); gr.addColorStop(0.6, '#6cc04a'); gr.addColorStop(1, '#3f8f2c');
    ctx.fillStyle = gr; ctx.fill(leaf);
    ctx.save(); ctx.clip(leaf);
    ctx.fillStyle = 'rgba(30,80,20,0.25)'; ctx.beginPath(); ctx.ellipse(18, -24, 34, 10, 0, 0, Math.PI * 2); ctx.fill();   // shade on one half
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-16, -46, 14, 4, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(leaf);
    ctx.strokeStyle = '#3f8f2c'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(0, -52);
    for (const sg of [-1, 1]) { ctx.moveTo(0, -30); ctx.quadraticCurveTo(sg * 12, -34, sg * 24, -32); ctx.moveTo(0, -40); ctx.quadraticCurveTo(sg * 10, -46, sg * 18, -46); }
    ctx.stroke();
    ctx.restore();
  }

  function heroState() {
    if (p.hurtT > 0) return 'hurt';
    if (!p.onGround) return p.vy < -60 ? 'jump' : 'fall';
    return Math.abs(p.vx) > 25 ? 'run' : 'idle';
  }

  // ---------------------------------------------------------------
  // HUD
  // ---------------------------------------------------------------
  function heart(ctx, x, y, s, full) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 16, s / 16);
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.bezierCurveTo(-22, 0, -14, -18, 0, -6);
    ctx.bezierCurveTo(14, -18, 22, 0, 0, 14);
    ctx.fillStyle = full ? '#ef476f' : '#ffffff'; ctx.fill();
    ctx.lineWidth = 3.5 * 16 / s; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
    if (full) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(-7, -4, 3, 2, -0.6, 0, 7); ctx.fill(); }
    ctx.restore();
  }

  function drawHUD(g, ctx) {
    // hearts (left, after the home button)
    const hk = g.juice.size('hearts'), gk = g.juice.size('goodies');     // (numbers that boing: g.juice.pop)
    for (let i = 0; i < maxHearts; i++) heart(ctx, 118 + i * 38, 36, 17 * hk, i < hearts);
    if (tries !== Infinity) {
      // extra tries: tiny hero faces
      for (let i = 0; i < Math.max(0, tries); i++) {
        ctx.save(); ctx.translate(112 + i * 30, 92); ctx.scale(0.5, 0.5);
        drawHero(ctx, heroDef, 0, 0, { state: 'idle' });
        ctx.restore();
      }
    }
    // stars collected (middle)
    ctx.save(); ctx.translate(W / 2 - 50, 38); ctx.scale(1.2 * gk, 1.2 * gk); drawGoodie(ctx, world.def.world, now()); ctx.restore();
    D.text(ctx, got + '/' + world.starsTotal, W / 2 - 22, 40, { size: 32 * gk, align: 'left' });
    // treasure chest icon: grey until you find it
    const cx = W / 2 + 120, cy = 54;
    ctx.save();
    if (!treasure) ctx.globalAlpha = 0.45;
    D.box(ctx, cx - 18, cy - 22, 36, 22, 4, treasure ? '#b5651d' : '#bbbbbb', 3.5);
    ctx.beginPath(); ctx.moveTo(cx - 18, cy - 21); ctx.lineTo(cx - 18, cy - 30); ctx.quadraticCurveTo(cx, cy - 42, cx + 18, cy - 30); ctx.lineTo(cx + 18, cy - 21); ctx.closePath();
    ctx.fillStyle = treasure ? '#c97a2b' : '#cccccc'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
    D.box(ctx, cx - 5, cy - 26, 10, 11, 3, treasure ? '#ffc93c' : '#eeeeee', 2.5);
    ctx.restore();
    if (treasure) D.star(ctx, cx + 18, cy - 36, 8, '#ffffff', 2);
  }

  // ---------------------------------------------------------------
  // Draw everything
  // ---------------------------------------------------------------
  function render(g, ctx) {
    if (!world) { ctx.fillStyle = '#8fdcff'; ctx.fillRect(0, 0, W, H); return; }
    const t = now();
    floatN = g.lite && g.lite() ? 6 : 12;
    drawBackground(ctx);
    const ox = Math.round(cam.x), oy = Math.round(cam.y);
    ctx.save();
    ctx.translate(-ox, -oy);
    const c0 = Math.floor(ox / T) - 1, c1 = Math.floor((ox + W) / T) + 1;
    const r0 = Math.max(0, Math.floor(oy / T) - 1), r1 = Math.min(world.rows - 1, Math.floor((oy + H) / T) + 1);
    const visible = (x, pad = 120) => x > ox - pad && x < ox + W + pad;

    for (const d of world.decor) if (visible(d.x)) drawDecor(ctx, d);
    for (const f of world.flags) if (visible(f.x)) drawFlag(ctx, f, t, false);
    if (visible(world.goal.x)) drawFlag(ctx, world.goal, t, true);
    drawTiles(ctx, Math.max(0, c0), Math.min(world.cols - 1, c1), r0, r1);
    drawWind(ctx, Math.max(0, c0), Math.min(world.cols - 1, c1), r0, r1, t);
    for (const pl of world.plats) if (visible(pl.x, 300)) drawPlatform(ctx, pl);
    for (const s of world.springs) if (visible(s.x)) drawSpring(ctx, s);
    for (const c of world.chests) if (visible(c.x)) drawChest(ctx, c, t);
    for (const s of world.stars) if (!s.got && visible(s.x)) drawStar(ctx, s, t);
    for (const cr of world.critters) if (visible(cr.x)) drawCritter(ctx, cr, t);

    // the hero (blinks while safe after getting hurt). After the goal you're in the balloon.
    if (!finished && p.dead <= 0 && !(p.invuln > 0 && Math.floor(p.invuln * 10) % 2 === 0)) {
      const st = heroState();
      if (p.roll > 0) {                       // rolling: curled up into a spinning ball
        drawRollBall(ctx, heroDef, p.x + PW / 2, p.y + PH / 2 + 2, p.face, p.face * (PHYS.rollTime - p.roll) * 22, t);
      } else {
        if (p.gliding) drawLeaf(ctx, p.x + PW / 2, p.y - 6, t);
        drawHero(ctx, heroDef, p.x + PW / 2, p.y + PH + 1, {
          face: p.face, state: p.gliding ? 'glide' : st, phase: p.runPhase, sx: p.sx, sy: p.sy, t, shadow: p.onGround,
        });
      }
    }
    fx.draw(ctx);
    drawFakeWalls(ctx, Math.max(0, c0), Math.min(world.cols - 1, c1), r0, r1);
    for (const q of popups) D.text(ctx, q.text, q.x, q.y, { size: 26, color: q.color });
    ctx.restore();
    drawForeground(ctx);

    if (world.def.dark) drawDarkness(g, ctx, ox, oy, t);
    else if (theme.dark) {
      // soft darkness around the edges of the cave (the middle stays bright)
      const px = p.x + PW / 2 - ox, py = p.y + PH / 2 - oy;
      const v = ctx.createRadialGradient(px, py, 160, px, py, 620);
      v.addColorStop(0, 'rgba(10,4,30,0)'); v.addColorStop(1, 'rgba(10,4,30,0.55)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    }
    drawHUD(g, ctx);
  }

  // Glow Cave: the cave is dark, and everything that glows makes a soft pool of light.
  // We paint the darkness on a spare canvas and rub round holes into it ("destination-out"):
  // a big one around the hero, one at every lantern (much bigger once it is lit), and
  // little ones at the gems, fireflies, crystals, the open chest and the balloon.
  let darkCanvas = null;
  function drawDarkness(g, ctx, ox, oy, t) {
    if (!darkCanvas) { darkCanvas = document.createElement('canvas'); darkCanvas.width = W; darkCanvas.height = H; }
    const d = darkCanvas.getContext('2d');
    d.globalCompositeOperation = 'source-over';
    d.clearRect(0, 0, W, H);
    d.fillStyle = `rgba(10,4,30,${world.def.dark})`; d.fillRect(0, 0, W, H);
    d.globalCompositeOperation = 'destination-out';
    const light = (wx, wy, r, k = 1) => {
      const x = wx - ox, y = wy - oy;
      if (x < -r || x > W + r || y < -r || y > H + r) return;
      const gr = d.createRadialGradient(x, y, r * 0.2, x, y, r);
      gr.addColorStop(0, `rgba(0,0,0,${k})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      d.fillStyle = gr; d.beginPath(); d.arc(x, y, r, 0, 7); d.fill();
    };
    const flick = 1 + Math.sin(t * 7) * 0.02;                       // lantern light flickers a tiny bit
    light(p.x + PW / 2, p.y + PH / 2, g.pick(300, 250, 230));       // the hero's own light (bigger on Easy)
    for (const f of world.flags) light(f.x + 20, f.y - 60, f.on ? 250 * flick : 90, f.on ? 1 : 0.55);
    for (const s of world.stars) if (!s.got) light(s.x, s.y, 44, 0.75);
    for (const cr of world.critters) if (cr.alive) light(cr.x + cr.w / 2, cr.y + 8, 80, 0.8);
    for (const dc of world.decor) light(dc.x, dc.y - 26, 70, 0.6);
    for (const c of world.chests) if (c.open) light(c.x, c.y - 30, 120);
    // the crystal spikes glow too, so you always see them coming
    for (let c = Math.floor(ox / T); c <= Math.floor((ox + W) / T); c++) for (let r = 0; r < world.rows; r++) {
      if (tileAt(world, c, r) === '^') light(c * T + T / 2, r * T + 30, 64, 0.85);
    }
    light(world.goal.x, world.goal.y - 110 - (world.goal.lift || 0), 190);
    ctx.drawImage(darkCanvas, 0, 0, W, H);
  }

  // ---------------------------------------------------------------
  // Menus: level tiles and the hero picker
  // ---------------------------------------------------------------
  // The picture on a level's tile: sky + ground + the balloon, plus something from that level.
  function levelPic(lv) {
    const wd = WORLDS[lv.world], K = 'stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"';
    const extra = {
      forest: `<circle cx="96" cy="26" r="13" fill="${wd.mid}" ${K}/><rect x="93" y="38" width="6" height="12" fill="${wd.trunk}"/>`,
      cave: `<path d="M86 50 L92 26 L98 50 Z" fill="#5ee6d0" ${K}/><path d="M98 50 L104 34 L110 50 Z" fill="#ff7bd5" ${K}/><path d="M0 0 H120 V8 L110 18 L100 8 L80 14 L60 6 L40 16 L20 6 L0 12 Z" fill="${wd.far}"/>`,
      snow: `<path d="M70 50 L95 12 L120 50 Z" fill="#ffffff" ${K}/><rect x="30" y="44" width="36" height="8" fill="#c4efff" ${K}/>`,
      candy: `<rect x="95" y="24" width="4" height="28" fill="#fff" stroke="#2b2b2b" stroke-width="2"/><circle cx="97" cy="22" r="11" fill="#ff6fb5" ${K}/><rect x="34" y="40" width="18" height="12" rx="4" fill="#ff6fb5" ${K}/>`,
      // the second levels: tall trees to climb / a lantern glowing in the dark / wind on a peak / jelly blocks
      forest2: `<rect x="60" y="34" width="7" height="18" fill="${wd.trunk}" ${K}/><rect x="48" y="24" width="31" height="13" rx="6" fill="#56b85a" ${K}/><rect x="92" y="18" width="7" height="34" fill="${wd.trunk}" ${K}/><rect x="80" y="8" width="31" height="13" rx="6" fill="#56b85a" ${K}/>`,
      cave2: `<rect width="120" height="70" fill="#0d0722"/><circle cx="88" cy="30" r="26" fill="#ffd166" opacity="0.3"/><circle cx="88" cy="30" r="15" fill="#ffd166" opacity="0.4"/><rect x="72" y="14" width="5" height="38" rx="2" fill="#9a6235" ${K}/><path d="M76 17 H88 V22" fill="none" ${K}/><rect x="81" y="22" width="14" height="17" rx="5" fill="#ffd166" ${K}/><path d="M52 50 L57 34 L62 50 Z" fill="#5ee6d0" ${K}/>`,
      snow2: `<path d="M56 50 L88 6 L120 50 Z" fill="#ffffff" ${K}/><path d="M42 46 q7 -8 0 -16 M52 38 q7 -8 0 -16 M42 24 q7 -8 0 -14" fill="none" stroke="#3f8fd8" stroke-width="6" stroke-linecap="round"/><path d="M42 46 q7 -8 0 -16 M52 38 q7 -8 0 -16 M42 24 q7 -8 0 -14" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>`,
      candy2: `<rect x="46" y="38" width="16" height="13" rx="5" fill="#ff6fb5" ${K}/><rect x="70" y="26" width="16" height="13" rx="5" fill="#ff6fb5" ${K}/><rect x="94" y="14" width="16" height="13" rx="5" fill="#ff6fb5" ${K}/><path d="M54 32 q4 -12 14 -10 M78 20 q4 -12 14 -10" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 6"/>`,
    }[lv.id];
    const sky = lv.dark ? '#0d0722' : wd.sky[0];
    return `<svg viewBox="0 0 120 70"><rect width="120" height="70" fill="${sky}"/>${extra}<rect x="0" y="52" width="120" height="18" fill="${wd.dirt}"/><rect x="0" y="50" width="120" height="7" fill="${wd.top}" stroke="#2b2b2b" stroke-width="3"/><ellipse cx="22" cy="18" rx="20" ry="16" fill="#ef476f" stroke="#2b2b2b" stroke-width="2.5"/><path d="M12 6 V30 M22 2 V34 M32 6 V30" stroke="#ffd166" stroke-width="3"/><rect x="15" y="38" width="14" height="9" rx="2" fill="#c68b59" stroke="#2b2b2b" stroke-width="2"/></svg>`;
  }
  const chestSVG = `<svg viewBox="0 0 48 40" style="width:24px;height:22px;vertical-align:middle"><rect x="6" y="18" width="36" height="18" rx="3" fill="#b5651d" stroke="#2b2b2b" stroke-width="3"/><path d="M6 19 V12 Q24 0 42 12 V19 Z" fill="#c97a2b" stroke="#2b2b2b" stroke-width="3"/><rect x="20" y="14" width="8" height="9" rx="2" fill="#ffc93c" stroke="#2b2b2b" stroke-width="2"/></svg>`;

  function levels(g) {
    // A level opens when the one named in its `after` is finished. So finishing a world's
    // first level opens BOTH its second level and the next world (old saves keep everything).
    return LEVELS.map((lv) => {
      const prev = !lv.after || (g.save.levels[lv.after] || {}).done;
      const rec = g.save.levels[lv.id] || {};
      const best = (g.save.data.best || {})[lv.id];
      return {
        ...lv, pic: levelPic(lv), locked: !prev,
        meta: (rec.stars != null ? Arcade.starsHTML(rec.stars) : '') + (best && best.treasure ? ' ' + chestSVG : ''),
      };
    });
  }

  // Draw a hero onto a little canvas for the picker tiles.
  // (sharp = 2 for a tile, 4 for the big one on the stage)
  function heroPic(h, sharp = 2) {
    const c = document.createElement('canvas');
    c.width = 80 * sharp; c.height = 85 * sharp;    // tall enough for Bun's ears
    const x = c.getContext('2d');
    x.scale(sharp, sharp);
    drawHero(x, h, 42, 81, { state: 'idle', face: 1 });
    return c.toDataURL();
  }

  // The hero picker for the canvas menus (Phaser + Rex UI, Nov 20): the same tiles as extraMenu() below,
  // as "screen rows" for arcade/canvasmenu.js. redraw() draws the menu again after a pick.
  function extraRows(g, redraw) {
    checkUnlocks(g);
    const t = totals(g), hero = pickedHero(g), current = hero.id;
    // (Nov 23, glossy part 2b) the hero you picked stands big on a gold stand in a spotlight, with your stars and
    // treasures under it; the heroes to pick are next to it (under it on a phone held upright)
    return [
      { t: 'cols', cols: [
        { w: 230, rows: [{ t: 'pics', items: [{ img: heroPic(hero, 4), stage: true }], size: 130 },
          { t: 'chips', items: [{ svg: icons.star(true), text: String(t.stars) }, { svg: chestSVG, text: String(t.chests) }] }] },
        { w: 496, rows: [{ t: 'tiles', w: 150, h: 165, items: [{ heading: 'Pick your hero' }].concat(HEROES.map(h => {
          const ok = heroUnlocked(g, h);
          return { img: heroPic(h), name: h.name, meta: ok ? [] : [{ text: h.need }], locked: !ok, picked: h.id === current, attr: 'hero-' + h.id,
            onTap: () => { if (!ok) { Arcade.sfx('bonk'); return; } Arcade.sfx('click'); g.save.data.hero = h.id; g.store(); redraw(); } };
        })) }] },
      ] },
    ];
  }

  function extraMenu(g) {
    checkUnlocks(g);
    const wrap = Arcade.h('div');
    const t = totals(g);
    wrap.appendChild(Arcade.h('h2', { class: 'ar-title', style: 'font-size:24px;margin-top:16px' },
      'Pick your hero <span style="font-size:18px;white-space:nowrap">' + icons.star(true).replace('<svg', '<svg style="width:22px;height:22px;vertical-align:-3px"') + ' ' + t.stars + ' &nbsp;' + chestSVG + ' ' + t.chests + '</span>'));
    const row = Arcade.h('div', { class: 'ar-grid' });
    const current = pickedHero(g).id;
    for (const h of HEROES) {
      const ok = heroUnlocked(g, h);
      const tile = Arcade.h('button', { type: 'button', class: 'ar-tile' + (ok ? '' : ' locked') + (h.id === current ? ' picked' : '') },
        `<div class="pic"><img src="${heroPic(h)}" alt="" style="height:70px"></div><div>${h.name}</div>` +
        `<div class="meta">${ok ? '' : h.need}</div>` + (ok ? '' : `<div class="lock">${icons.lock}</div>`));
      tile.addEventListener('click', () => {
        if (!ok) { Arcade.sfx('bonk'); return; }
        Arcade.sfx('click');
        g.save.data.hero = h.id; g.store();
        row.querySelectorAll('.ar-tile').forEach(x => x.classList.remove('picked'));
        tile.classList.add('picked');
      });
      row.appendChild(tile);
    }
    wrap.appendChild(row);
    return wrap;
  }

  // ---------------------------------------------------------------
  // Start the game
  // ---------------------------------------------------------------
  const S = (inner) => `<svg viewBox="0 0 80 80">${inner}</svg>`;
  const L = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"';
  const monkeySVG = (x, y) => `<g transform="translate(${x} ${y})"><circle cx="-13" cy="-22" r="6" fill="#b5764a" ${L}/><circle cx="13" cy="-22" r="6" fill="#b5764a" ${L}/><circle cx="0" cy="-14" r="15" fill="#b5764a" ${L}/><ellipse cx="2" cy="-11" rx="9" ry="8" fill="#f5d3a6"/><circle cx="-2" cy="-17" r="2.5" fill="#2b2b2b"/><circle cx="6" cy="-17" r="2.5" fill="#2b2b2b"/></g>`;
  const ROLL_ICON = `<svg viewBox="0 0 48 48"><circle cx="28" cy="26" r="13" fill="#b5764a" stroke="#2b2b2b" stroke-width="4"/><path d="M22 20 A7 7 0 1 1 28 33" fill="none" stroke="#2b2b2b" stroke-width="3"/><path d="M4 18 H12 M2 26 H11 M4 34 H12" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/></svg>`;
  const LINK = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';   // outline style for the logo picture
  // the level picker: 8 levels = 2 tidy rows of 4 (one column per world's pair would be nice too, but 4 across fits phones)
  bootPhaser();     // start Phaser right away (it takes a moment), so it's ready before the first level
  document.head.appendChild(Arcade.h('style', {}, `.ar-panel .ar-grid:not(.ar-trophies) { grid-template-columns: repeat(4, minmax(0, 1fr)); }`));
  Arcade.start({
    id: 'jungle',
    littleSpeed: 0.85,            // little kids: everything moves a bit slower
    trophies: [
      { id: 'world', name: 'Balloon ride', how: 'Finish a world' },
      { id: 'smash', name: 'Rock roller', how: 'Roll into a cracked boulder' },
      { id: 'boop', name: 'Boop!', how: 'Roll into a critter' },
      { id: 'treasure', name: 'Treasure hunter', how: 'Find a hidden treasure chest' },
      { id: 'all-goodies', name: 'Got them all', how: 'Collect every goodie in a world' },
      { id: 'candy', name: 'Sweet ending', how: 'Finish Candy Land' },
      { id: 'tour', name: 'World tour', how: 'Finish all 8 levels' },
      { id: 'no-ouch', name: 'No ouchies', how: 'Finish a world with all your hearts', secret: true },
      { id: 'gentle', name: 'Gentle giant', how: 'Finish a world without booping anyone', secret: true },
    ],   // the trophy room (secret ones show '???' until earned)
    logo: Arcade.logo({
      badge: Arcade.badges.jungle,   // the round picture (arcade/badges.js)
      title: 'Jungle Jump', colors: ['#b9fbc0', '#6cc04a'], bg: '#a0e7a0', art: `<rect x="0" y="122" width="240" height="38" fill="#b9783f" ${LINK}/><rect x="0" y="122" width="240" height="9" fill="#6cc04a"/>
              <path d="M150 122 Q146 96 168 98 Q190 96 186 122 Z" fill="#a8a29e" ${LINK}/>
              <g transform="translate(196 22)"><ellipse cx="0" cy="22" rx="20" ry="24" fill="#ef476f" ${LINK}/><path d="M-8 0 V44 M8 0 V44" stroke="#ffd166" stroke-width="5"/><ellipse cx="0" cy="22" rx="20" ry="24" fill="none" ${LINK}/><rect x="-10" y="52" width="20" height="14" rx="3" fill="#c68b59" ${LINK}/></g>
              <g class="wobble"><path d="M44 46 Q70 18 96 46 Q70 38 44 46 Z" fill="#6cc04a" ${LINK}/><path d="M70 40 V60" stroke="#2b2b2b" stroke-width="3"/>
              <circle cx="56" cy="74" r="7" fill="#b5764a" ${LINK} stroke-width="3"/><circle cx="84" cy="74" r="7" fill="#b5764a" ${LINK} stroke-width="3"/>
              <circle cx="70" cy="80" r="17" fill="#b5764a" ${LINK}/><ellipse cx="72" cy="84" rx="10" ry="8" fill="#f5d3a6"/><circle cx="66" cy="78" r="2.5" fill="#2b2b2b"/><circle cx="76" cy="78" r="2.5" fill="#2b2b2b"/></g>` }),   // title screen
    menuMusic: { tempo: 128, root: 57, scale: 'mixolydian', prog: [[1, 4, 7, 4], [1, 5, 4, 1], [6, 7, 4, 5]], drums: 'latin', bass: 'bounce', lead: 'brass', harmony: 'flute', pad: true, arp: true, arpSound: 'marimba', seed: 1505,
        tune: { A: '8/4 r/2 8 8 7 5/4 | 6/4 r/2 6 6 8 6/4 | 7/4 r/2 7 9 7 4/4 | 6/8 4',
                B: '10/6 8/2 5/8 | 9/6 7/2 5/8 | 8/4 6 8 10 | 8/16',
                C: '6/8 8 | 7/8 9 | 8/4 6 4/8 | 5/4 7 9/8' } },   // the title/menu song (jungle brass!)
    title: 'Jungle Jump',
    view: { w: W, h: H },
    background: '#8fdcff',
    music: (g) => SONGS[(g.level || LEVELS[0]).world],
    levelsTitle: 'Pick a level',
    howTo: [
      { pic: S(`<path d="M14 40 H66" stroke="#2b2b2b" stroke-width="7" stroke-linecap="round"/><path d="M24 28 L12 40 L24 52 M56 28 L68 40 L56 52" fill="none" stroke="#2b2b2b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`), text: 'Run', keys: 'Left / Right' },
      { pic: S(`<path d="M10 70 H70" stroke="#6cc04a" stroke-width="8"/><path d="M20 66 Q30 10 58 30" fill="none" stroke="#118ab2" stroke-width="5" stroke-dasharray="6 6" stroke-linecap="round"/>${monkeySVG(58, 46)}`), text: 'Jump! Hold for higher', keys: 'Space / Up' },
      { pic: S(`<path d="M10 22 Q24 4 40 6 Q56 4 70 22 Q40 14 10 22 Z" fill="#6cc04a" ${L}/><path d="M40 8 V30" stroke="#2b2b2b" stroke-width="3"/>${monkeySVG(40, 62)}<path d="M18 50 v10 M62 46 v10" stroke="#8ecae6" stroke-width="4" stroke-linecap="round"/>`), text: 'Hold jump to glide with your leaf', keys: 'Hold Space' },
      { pic: S(`<rect x="22" y="4" width="36" height="74" rx="8" fill="#bfe1ff"/><path d="M32 30 L40 20 L48 30 M32 74 L40 64 L48 74" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 34 Q32 22 40 23 Q48 22 58 34 Q40 29 22 34 Z" fill="#6cc04a" ${L} stroke-width="3"/>${monkeySVG(40, 62)}`), text: 'Wind: hold jump to fly up', keys: 'Hold Space' },
      { pic: S(`<circle cx="44" cy="42" r="18" fill="#b5764a" ${L}/><path d="M36 34 A10 10 0 1 1 44 52" fill="none" stroke="#2b2b2b" stroke-width="3"/><path d="M8 30 H20 M4 42 H18 M8 54 H20" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/><path d="M62 52 L74 40 L70 60 Z" fill="#a8a29e" ${L}/>`), text: 'Roll to smash rocks and boop critters', keys: 'X / roll button' },
      { pic: S(`<circle cx="26" cy="44" r="7" fill="#ef476f" ${L} stroke-width="3"/><circle cx="36" cy="44" r="7" fill="#ef476f" ${L} stroke-width="3"/><circle cx="31" cy="53" r="7" fill="#ef476f" ${L} stroke-width="3"/><path d="M50 30 L60 18 L70 30 L60 52 Z" fill="#5ee6d0" ${L}/>`), text: 'Collect the goodies' },
      { pic: S(`<rect x="16" y="40" width="48" height="26" rx="4" fill="#b5651d" ${L}/><path d="M16 41 V30 Q40 12 64 30 V41 Z" fill="#c97a2b" ${L}/><rect x="34" y="34" width="12" height="12" rx="3" fill="#ffc93c" ${L}/><path d="M66 12 L69 18 L75 19 L70 23 L72 29 L66 26 L60 29 L62 23 L57 19 L63 18 Z" fill="#fff" ${L} stroke-width="2"/>`), text: 'Find the secret treasure' },
      { pic: S(`<circle cx="40" cy="52" r="18" fill="#ef476f" ${L}/><circle cx="34" cy="48" r="6" fill="#fff" ${L} stroke-width="3"/><circle cx="33" cy="48" r="2.5" fill="#2b2b2b"/><path d="M40 14 V30 M33 22 L40 14 L47 22" fill="none" stroke="#06d6a0" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`), text: 'Critters are bouncy: land on them to bounce' },
      { pic: S(`<rect x="20" y="14" width="8" height="60" rx="3" fill="#9a6235" ${L}/><rect x="36" y="26" width="24" height="28" rx="7" fill="#ffd166" ${L}/><rect x="33" y="22" width="30" height="7" rx="3" fill="#ef476f" ${L} stroke-width="3"/>`), text: 'Lanterns save your spot' },
      { pic: S(`<ellipse cx="40" cy="28" rx="22" ry="24" fill="#ef476f" ${L}/><path d="M30 6 V50 M50 6 V50" stroke="#ffd166" stroke-width="6"/><ellipse cx="40" cy="28" rx="22" ry="24" fill="none" ${L}/><path d="M28 48 L32 60 M52 48 L48 60" stroke="#2b2b2b" stroke-width="3"/><rect x="28" y="58" width="24" height="16" rx="4" fill="#c68b59" ${L}/>`), text: 'Reach the balloon to fly home!' },
    ],
    buttons: {
      left: [{ id: 'ArrowLeft', icon: icons.left, label: 'Left' }, { id: 'ArrowRight', icon: icons.right, label: 'Right' }],
      right: [{ id: 'KeyX', icon: ROLL_ICON, label: 'Roll' }, { id: 'Space', icon: icons.jump, label: 'Jump', main: true }],
    },
    // One thumb (Nov 23, plan point 4 part 3): only the big Jump button. The hero walks by itself,
    // waits at gaps, thorns and wind, and rolls into boulders + critters by itself (thumbControl).
    oneThumb: {
      buttons: { right: [{ id: 'Space', icon: icons.jump, label: 'Jump', main: true }] },
      howTo: [
        { pic: S(`<path d="M10 40 H60" stroke="#2b2b2b" stroke-width="8" stroke-linecap="round"/><path d="M48 24 L66 40 L48 56" fill="none" stroke="#06d6a0" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`), text: 'It walks by itself!' },
        { pic: S(`<path d="M4 58 H30 V78 M50 78 V58 H76" fill="none" stroke="#6cc04a" stroke-width="8"/><path d="M22 54 Q40 6 60 52" fill="none" stroke="#118ab2" stroke-width="5" stroke-dasharray="6 6" stroke-linecap="round"/>${monkeySVG(22, 40)}`), text: 'It waits. Tap to jump!' },
        { pic: S(`<path d="M10 22 Q24 4 40 6 Q56 4 70 22 Q40 14 10 22 Z" fill="#6cc04a" ${L}/><path d="M40 8 V30" stroke="#2b2b2b" stroke-width="3"/>${monkeySVG(40, 62)}`), text: 'Hold to glide and fly' },
        { pic: S(`<circle cx="30" cy="42" r="18" fill="#b5764a" ${L}/><path d="M22 34 A10 10 0 1 1 30 52" fill="none" stroke="#2b2b2b" stroke-width="3"/><path d="M52 52 L66 38 L62 62 Z" fill="#a8a29e" ${L}/>`), text: 'Rocks + critters: it rolls by itself' },
      ],
    },
    levels,
    extraMenu,
    extraRows,
    canvasMenus: true,            // (Nov 20) the menus are drawn with Phaser + Rex UI (arcade/canvasmenu.js)
    setup,
    update,
    draw: render,
  });

  // For automated tests: the level data and the hero physics, so a test can
  // check every level can really be finished using the same jump the game uses.
  // For the art preview (tools/preview_jungle.py): draw a hero or a critter anywhere.
  window.__jungleArt = { HEROES, WORLDS, drawHero, drawCritter, drawRollBall, drawLeaf };
  // Living backgrounds for tests + tools/preview_jungle_scenery.py: draw(ctx, level, camX, t) = one level's
  // background (+ floaters) with no game running; levels = [{ id, world, time }].
  window.__jungleScene = {
    W, H, TIMES,
    levels: LEVELS.map(l => ({ id: l.id, world: l.world, time: l.time || '' })),
    draw(ctx, level, camX, t, n) { const was = floatN; floatN = n || 12; drawBackground(ctx, { level, camX, t }); floatN = was; },
    cached: () => Object.keys(layerCache), canvas: (k) => layerCache[k],
  };
  window.__jungleDebug = { T, PW, PH, PLAT_W, PHYS, MAPS, LEVELS, buildWorld, newPlayer, stepPlayer, updatePlats, thornHit, overlap };
})();
