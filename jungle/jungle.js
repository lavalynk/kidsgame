// =====================================================================
// Jungle Jump — a side-scrolling platformer through four worlds.
//
// How it works:
//  * Each level is a TEXT MAP (an array of strings, see the legend below).
//    One letter = one 48 x 48 px tile. Edit the letters to change a level!
//  * The hero is a box (30 x 42 px). Every physics step (1/120 s) we move it
//    sideways first and push it out of any wall it hit, then up/down and push
//    it out of floors/ceilings. Doing one direction at a time is what makes
//    tile collision reliable (no getting stuck on the seams between tiles).
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
//  * Reach the hot-air balloon at the end of each world to fly home.
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
  }; // ---- end of level maps ----

  // Each world has its own colors. (Drawing code below reads these.)
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

  const LEVELS = [
    { id: 'forest', world: 'forest', name: 'Leafy Forest' },
    { id: 'cave',   world: 'cave',   name: 'Crystal Cave' },
    { id: 'snow',   world: 'snow',   name: 'Snowy Hills' },
    { id: 'candy',  world: 'candy',  name: 'Candy Land' },
  ];

  // Heroes you can play as. The monkey is free; the rest are unlocked.
  const HEROES = [
    { id: 'monkey', name: 'Momo',  body: '#b5764a', belly: '#f5d3a6', extra: '#f7a8b8', need: null },
    { id: 'frog',   name: 'Pip',   body: '#6fd16a', belly: '#d7f5b0', extra: '#ff9eb5', need: 'Finish the Forest' },
    { id: 'bunny',  name: 'Bun',   body: '#ffffff', belly: '#ffe3ef', extra: '#ffb3cf', need: 'Collect 30 goodies' },
    { id: 'fox',    name: 'Rusty', body: '#ff8c42', belly: '#fff3e0', extra: '#2b2b2b', need: 'Find 2 treasures' },
    { id: 'panda',  name: 'Bao',   body: '#ffffff', belly: '#ffffff', extra: '#2b2b2b', need: 'Find all 4 treasures' },
  ];

  // Which letters are solid, and which you can stand on.
  const SOLID = { '#': 1, '~': 1, 'B': 1, 'o': 1 };
  const STAND = { '#': 1, '~': 1, 'B': 1, 'o': 1, '=': 1 };

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
          case '#': case '~': case '=': case 'B': case 'o': case 'F': case '^': tile = k; break;
          case 'e': tile = easy ? '#' : '.'; break;
          case 'S': w.springs.push({ x: c * T + 6, y: bottom - 26, w: T - 12, h: 26, squish: 0 }); break;
          case '*': w.stars.push({ x: cx, y: r * T + T / 2, got: false }); break;
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
  // The hero's physics. Plain functions so tests can run them too.
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

  // Thorn hit box: the lower part of a '^' tile.
  function thornHit(w, p) {
    const c0 = Math.floor(p.x / T), c1 = Math.floor((p.x + p.w - 0.01) / T);
    const r0 = Math.floor(p.y / T), r1 = Math.floor((p.y + p.h - 0.01) / T);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      if (tileAt(w, c, r) === '^' && overlap(p, c * T + 8, r * T + 20, T - 16, T - 20)) return { x: c * T + T / 2, y: r * T + T };
    }
    return null;
  }

  // ---------------------------------------------------------------
  // Game state
  // ---------------------------------------------------------------
  let world, theme, p, cfg, cam, fx, popups, heroDef;
  let got, treasure, cp, hearts, maxHearts, tries, finished, bonks, critterSpeed;
  let resume = null; // after "Nice try!", Again continues from the last flag

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
    fx = new Arcade.Particles();
    popups = [];
    updatePlats(world, 0);
    p = newPlayer(world.start.x, world.start.y);
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
      cam: { x: cam.x, y: cam.y }, time: g.time,
    });
    window.__jungleTest = {
      // test-only: jump the hero somewhere (world px, top-left of the hit box)
      teleport(x, y) { p.x = x; p.y = y; p.vx = 0; p.vy = 0; p.plat = -1; snapCamera(); },
      world: () => world,
      player: () => p,
    };
  }

  function placeAtCheckpoint() {
    const f = cp >= 0 ? world.flags[cp] : null;
    const x = f ? f.x - PW / 2 : world.start.x, y = f ? f.y - PH : world.start.y;
    Object.assign(p, { x, y, vx: 0, vy: 0, plat: -1, onGround: false, jumping: false, boost: false, coyote: 0, buffer: 0 });
  }

  function snapCamera() {
    cam.x = math.clamp(p.x + PW / 2 - W / 2, 0, Math.max(0, world.width - W));
    cam.y = math.clamp(p.y + PH / 2 - H * 0.56, 0, Math.max(0, world.height - H));
  }

  function popup(text, x, y, color = '#ffd166') { popups.push({ text, x, y, t: 0, color }); }

  // ---------------------------------------------------------------
  // Update (dt = 1/120 s)
  // ---------------------------------------------------------------
  function update(g, dt) {
    const inp = g.input;
    fx.update(dt);
    for (const q of popups) { q.t += dt; q.y -= 50 * dt; }
    popups = popups.filter(q => q.t < 1);
    for (const s of world.springs) s.squish = Math.max(0, s.squish - dt * 3);
    for (const k in world.bounce) { world.bounce[k] -= dt * 3; if (world.bounce[k] <= 0) delete world.bounce[k]; }
    updatePlats(world, g.time);
    if (finished && world.goal) world.goal.lift = (world.goal.lift || 0) + dt * 70;   // up, up and away!

    // poofed (fell / out of hearts): wait a moment, then pop back at the flag
    if (p.dead > 0) {
      p.dead -= dt;
      if (p.dead <= 0) {
        placeAtCheckpoint();
        p.invuln = 1.5;
        snapCamera();
        fx.burst(p.x + PW / 2, p.y + PH / 2, { count: 18, shape: 'star', speed: 200, size: 12, gravity: 0, life: 0.6 });
        g.sfx('pop');
      }
      followCamera(dt);
      return;
    }

    // read the controls
    const control = finished ? { dir: 0, jumpHeld: false, jumpPressed: false, run: false } : {
      dir: (inp.down('ArrowRight', 'KeyD') ? 1 : 0) - (inp.down('ArrowLeft', 'KeyA') ? 1 : 0),
      jumpHeld: inp.down('Space', 'ArrowUp', 'KeyW'),
      jumpPressed: inp.hit('Space', 'ArrowUp', 'KeyW'),
      run: inp.down('ShiftLeft', 'ShiftRight'),
      rollPressed: inp.hit('KeyX', 'KeyZ') || (inp.hit('ArrowDown', 'KeyS') && Math.abs(p.vx) > 60),
    };

    stepPlayer(world, p, control, dt, cfg, {
      jump() { g.sfx('jump'); p.sx = 0.75; p.sy = 1.25; dust(p.x + PW / 2, p.y + PH, 6); },
      land(impact) {
        if (impact > 350) {
          p.sx = 1.3; p.sy = 0.72;
          dust(p.x + PW / 2, p.y + PH, impact > 700 ? 12 : 7);
        }
      },
      smash(c, r) { breakBlock(g, c, r); popup('Smash!', c * T + T / 2, r * T, '#ffd166'); },
      roll() { g.sfx('whoosh'); dust(p.x + PW / 2, p.y + PH, 5); },
      spring() { g.sfx('spring'); p.sx = 0.7; p.sy = 1.35; },
      jelly(c, r) {
        g.tone(330, 0.2, { slide: 660, type: 'sine', vol: 0.3 });
        world.bounce[c + ',' + r] = 1;
        p.sx = 1.3; p.sy = 0.75;
        fx.burst(p.x + PW / 2, p.y + PH, { count: 6, colors: ['#ff6fb5', '#ffd6ec', '#fff'], speed: 120, size: 8, life: 0.4 });
      },
    });

    // squash & stretch relax back to normal; running animation
    p.sx += (1 - p.sx) * Math.min(1, dt * 10);
    p.sy += (1 - p.sy) * Math.min(1, dt * 10);
    p.runPhase += Math.abs(p.vx) * dt / 16;
    if (p.invuln > 0) p.invuln -= dt;
    if (p.hurtT > 0) p.hurtT -= dt;
    if (p.onGround && p.groundTile === '~' && Math.abs(p.vx) > 150 && Math.random() < dt * 20) {
      fx.burst(p.x + PW / 2, p.y + PH, { count: 1, colors: ['#ffffff', '#d6f3ff'], speed: 60, size: 7, life: 0.4, gravity: 0 });
    }

    if (!finished) {
      updateCritters(g, dt);
      // thorns
      const th = thornHit(world, p);
      if (th) hurt(g, th.x);
      collect(g);
      // fell in a pit?
      if (p.y > world.height + 40) fellInPit(g);
    }
    followCamera(dt);
  }

  function dust(x, y, n) {
    const col = theme.dark ? ['#b9a8ff', '#8a78d0'] : world.def.world === 'snow' ? ['#ffffff', '#e2f1ff'] : ['#ffffff', '#f0e2c8'];
    fx.burst(x, y, { count: n, angle: -Math.PI / 2, spread: 2.8, speed: 110, size: 9, life: 0.45, gravity: 120, colors: col });
  }

  function breakBlock(g, c, r) {
    world.grid[r][c] = '.';
    g.sfx('pop');
    fx.burst(c * T + T / 2, r * T + T / 2, { count: 14, shape: 'square', colors: [theme.block, '#ffffff', INK], speed: 260, size: 12, gravity: 900, life: 0.8 });
  }

  function updateCritters(g, dt) {
    for (const cr of world.critters) {
      if (!cr.alive) { cr.poof = Math.max(0, cr.poof - dt); continue; }
      cr.squish = Math.max(0, (cr.squish || 0) - dt * 3);
      cr.x += cr.dir * critterSpeed * dt;
      // turn around at walls, ledges and thorns (critters are careful)
      const front = cr.dir > 0 ? cr.x + cr.w + 1 : cr.x - 1;
      const c = Math.floor(front / T);
      const rBody = Math.floor((cr.y + cr.h - 4) / T), rFeet = Math.floor((cr.y + cr.h + 4) / T);
      const blocked = isSolid(world, c, rBody) || !STAND[tileAt(world, c, rFeet)] || tileAt(world, c, rBody) === '^';
      if (blocked) { cr.dir *= -1; cr.x += cr.dir * critterSpeed * dt * 2; }
      // touching the hero?
      if (!overlap(p, cr.x, cr.y, cr.w, cr.h)) continue;
      const feet = p.y + p.h;
      if (p.roll > 0) {
        // rolled into it: boop! it poofs into sparkles
        cr.alive = false; cr.poof = 0.4; bonks++;
        g.sfx('pop');
        fx.burst(cr.x + cr.w / 2, cr.y + cr.h / 2, { count: 20, shape: 'star', speed: 240, size: 13, gravity: 200, life: 0.7 });
        popup('Boop!', cr.x + cr.w / 2, cr.y - 10, '#ffd166');
      } else if (p.vy > 0 && feet - cr.y < 20) {
        // landed on top: critters are bouncy, so you just bounce off (they wobble)
        p.vy = -PHYS.jumpV * 0.9; p.jumping = true; p.boost = false;
        p.sx = 0.75; p.sy = 1.25; cr.squish = 1;
        g.tone(260, 0.18, { slide: 620, type: 'sine', vol: 0.3 });
        popup('Boing!', cr.x + cr.w / 2, cr.y - 10, '#ffffff');
      } else {
        hurt(g, cr.x + cr.w / 2);
      }
    }
  }

  function hurt(g, fromX) {
    if (p.invuln > 0 || p.dead > 0) return;
    hearts--;
    g.sfx('hit');
    p.invuln = 1.4; p.hurtT = 0.4;
    const away = Math.sign(p.x + PW / 2 - fromX) || -p.face;
    p.vx = away * 330; p.vy = -560; p.boost = true; p.jumping = false; p.onGround = false; p.plat = -1;
    fx.burst(p.x + PW / 2, p.y + PH / 2, { count: 10, colors: ['#ff6b6b', '#ffffff'], speed: 200, size: 9, life: 0.5 });
    if (hearts <= 0) outOfHearts(g);
  }

  function fellInPit(g) {
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
    fx.burst(p.x + PW / 2, math.clamp(p.y + PH / 2, 0, world.height - 10), { count: 16, colors: ['#ffffff', '#ffd6ec', '#bde0fe'], speed: 180, size: 14, gravity: -60, life: 0.7 });
  }

  function collect(g) {
    for (const s of world.stars) {
      if (s.got || !overlap(p, s.x - 20, s.y - 20, 40, 40)) continue;
      s.got = true; got++;
      g.sfx('coin');
      fx.burst(s.x, s.y, { count: 10, shape: 'star', colors: ['#ffd166', '#fff3b0', '#ffffff'], speed: 160, size: 10, gravity: 100, life: 0.5 });
      if (got === world.starsTotal) { popup('Got them all!', s.x, s.y - 30, '#06d6a0'); g.sfx('star'); }
    }
    for (const c of world.chests) {
      if (c.open || !overlap(p, c.x - 26, c.y - 44, 52, 44)) continue;
      c.open = true; treasure = true;
      g.sfx('power');
      popup('Treasure!', c.x, c.y - 70, '#ffd166');
      fx.burst(c.x, c.y - 30, { count: 30, shape: 'star', speed: 280, size: 14, gravity: 250, life: 1 });
    }
    world.flags.forEach((f, i) => {
      if (f.on || !overlap(p, f.x - 22, f.y - 120, 44, 120)) return;
      // light up this flag (and any earlier ones you skipped)
      for (let j = 0; j <= i; j++) world.flags[j].on = true;
      cp = Math.max(cp, i);
      g.sfx('star');
      fx.burst(f.x + 20, f.y - 100, { count: 18, shape: 'star', speed: 200, size: 11, gravity: 150, life: 0.7 });
    });
    const gl = world.goal;
    if (!finished && overlap(p, gl.x - 30, gl.y - 210, 60, 210)) win(g);
  }

  const goodieName = () => { const n = GOODIES[world.def.world] || 'goodies'; return n[0].toUpperCase() + n.slice(1); };
  function score(g) { return got * 100 + (treasure ? 1000 : 0) + bonks * 50 + Math.max(0, hearts) * 100 + (finished ? 500 : 0); }

  function win(g) {
    finished = true;
    const frac = world.starsTotal ? got / world.starsTotal : 1;
    // 1 star = finished, 2 = lots of stars, 3 = (nearly) all stars AND the treasure
    let rating = 1;
    if (frac >= g.pick(0.5, 0.7, 0.8)) rating = 2;
    if (treasure && frac >= g.pick(0.8, 1, 1)) rating = 3;
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
  // Drawing: background (parallax layers per world)
  // ---------------------------------------------------------------
  const now = () => performance.now() / 1000;

  function drawBackground(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, theme.sky[0]); sky.addColorStop(1, theme.sky[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    const kind = world.def.world;
    const t = now();
    // layer offset: farther layers move less
    const off = (speed, period) => ((cam.x * speed) % period + period) % period;
    const yOff = (speed) => -cam.y * speed;

    if (kind === 'forest' || kind === 'candy' || kind === 'snow') {
      // drifting clouds
      ctx.fillStyle = kind === 'candy' ? '#ffe6f3' : '#ffffff';
      for (let i = 0; i < 4; i++) {
        const x = ((i * 300 - cam.x * 0.06 + t * 8) % 1200 + 1200) % 1200 - 120;
        const y = 60 + (i % 2) * 50 + yOff(0.05);
        cloud(ctx, x, y, 1 + (i % 3) * 0.2);
      }
    }
    if (kind === 'forest') {
      hills(ctx, 0.15, theme.far, 330 + yOff(0.1), 70, 380);
      // round trees
      const per = 230, o = off(0.4, per);
      for (let x = -o - per; x < W + per; x += per) {
        const i = Math.round((x + o + cam.x * 0.4) / per);
        const by = 420 + yOff(0.3) + (i % 2) * 18;
        ctx.fillStyle = theme.trunk; ctx.fillRect(x + 50, by - 70, 18, 90);
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(43,43,43,0.6)'; ctx.strokeRect(x + 50, by - 70, 18, 90);
        for (const [dx, dy, r] of [[30, -90, 38], [86, -94, 34], [58, -128, 44]]) D.circle(ctx, x + dx, by + dy, r, theme.mid, 0);
        ctx.strokeStyle = 'rgba(43,43,43,0.6)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(x + 58, by - 110, 64, Math.PI * 0.95, Math.PI * 2.05); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(0, 0, W, H);
    } else if (kind === 'cave') {
      // hanging rocks and far crystals, plus floating glow dots
      const per = 160, o = off(0.2, per);
      ctx.fillStyle = theme.far;
      for (let x = -o - per; x < W + per; x += per) {
        const i = Math.round((x + o + cam.x * 0.2) / per);
        const len = 60 + ((i * 37) % 5) * 22;
        ctx.beginPath(); ctx.moveTo(x, -10); ctx.lineTo(x + 40, len + yOff(0.15)); ctx.lineTo(x + 80, -10); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + 60, H + 10); ctx.lineTo(x + 100, H - len * 0.8 + yOff(0.15) + 60); ctx.lineTo(x + 140, H + 10); ctx.fill();
      }
      const per2 = 270, o2 = off(0.4, per2);
      for (let x = -o2 - per2; x < W + per2; x += per2) {
        const i = Math.round((x + o2 + cam.x * 0.4) / per2);
        const col = i % 2 ? '#ff7bd5' : '#5ee6d0';
        crystal(ctx, x + 100, 430 + yOff(0.3) + (i % 3) * 20, 0.9, col, 0.55);
      }
      for (let i = 0; i < 18; i++) {
        const x = ((i * 137 - cam.x * 0.5) % 1100 + 1100) % 1100 - 70;
        const y = (i * 71) % 480 + 30 + Math.sin(t * 1.3 + i) * 10;
        ctx.fillStyle = i % 2 ? 'rgba(94,230,208,0.55)' : 'rgba(255,123,213,0.5)';
        ctx.beginPath(); ctx.arc(x, y, 3 + (i % 3), 0, Math.PI * 2); ctx.fill();
      }
    } else if (kind === 'snow') {
      // snowy mountains + pine trees + falling snow
      const per = 420, o = off(0.12, per);
      for (let x = -o - per; x < W + per; x += per) {
        const by = 380 + yOff(0.08);
        ctx.beginPath(); ctx.moveTo(x - 40, by + 200); ctx.lineTo(x + 170, by - 190); ctx.lineTo(x + 380, by + 200); ctx.closePath();
        ctx.fillStyle = '#d4e7fb'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(43,43,43,0.35)'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 105, by - 70); ctx.lineTo(x + 170, by - 190); ctx.lineTo(x + 235, by - 70);
        ctx.lineTo(x + 205, by - 90); ctx.lineTo(x + 170, by - 60); ctx.lineTo(x + 135, by - 90); ctx.closePath();
        ctx.fillStyle = '#ffffff'; ctx.fill();
      }
      const per2 = 190, o2 = off(0.4, per2);
      for (let x = -o2 - per2; x < W + per2; x += per2) {
        const i = Math.round((x + o2 + cam.x * 0.4) / per2);
        pine(ctx, x + 60, 450 + yOff(0.3) + (i % 2) * 16, 0.9 + (i % 3) * 0.12);
      }
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 40; i++) {
        const x = ((i * 97 + Math.sin(t * 0.8 + i) * 30 - cam.x * 0.7) % 1000 + 1000) % 1000 - 20;
        const y = ((i * 53 + t * (30 + (i % 4) * 12) - cam.y * 0.7) % 580 + 580) % 580 - 20;
        ctx.beginPath(); ctx.arc(x, y, 2.5 + (i % 3), 0, Math.PI * 2); ctx.fill();
      }
    } else if (kind === 'candy') {
      // striped candy hills + giant lollipops
      hills(ctx, 0.15, theme.far, 340 + yOff(0.1), 80, 360, '#ffb3d9');
      const per = 250, o = off(0.4, per);
      for (let x = -o - per; x < W + per; x += per) {
        const i = Math.round((x + o + cam.x * 0.4) / per);
        lollipop(ctx, x + 80, 470 + yOff(0.3), 0.95 + (i % 2) * 0.25, ['#ff6fb5', '#7bd3f7', '#ffd166', '#9b5de5'][((i % 4) + 4) % 4], 0.85);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(0, 0, W, H);
    }
  }

  function cloud(ctx, x, y, s) {
    ctx.beginPath();
    ctx.arc(x, y, 26 * s, 0, Math.PI * 2); ctx.arc(x + 30 * s, y - 14 * s, 30 * s, 0, Math.PI * 2);
    ctx.arc(x + 62 * s, y, 24 * s, 0, Math.PI * 2); ctx.rect(x, y, 62 * s, 22 * s);
    ctx.fill();
  }
  function hills(ctx, speed, color, y0, amp, wl, stripe) {
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 16) {
      const wx = x + cam.x * speed;
      ctx.lineTo(x, y0 - Math.abs(Math.sin(wx / wl)) * amp - Math.sin(wx / (wl * 0.41)) * amp * 0.2);
    }
    ctx.lineTo(W, H); ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    if (stripe) {
      ctx.save(); ctx.clip();
      ctx.strokeStyle = stripe; ctx.lineWidth = 14;
      for (let x = -((cam.x * speed) % 60) - 400; x < W + 400; x += 60) { ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + 300, y0 - 200); ctx.stroke(); }
      ctx.restore();
    }
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(43,43,43,0.3)'; ctx.stroke();
  }
  function pine(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#7a5236'; ctx.fillRect(-7, -20, 14, 26);
    for (let i = 0; i < 3; i++) {
      const ty = -20 - i * 34, w = 46 - i * 10;
      ctx.beginPath(); ctx.moveTo(-w, ty); ctx.lineTo(0, ty - 56); ctx.lineTo(w, ty); ctx.closePath();
      ctx.fillStyle = theme.mid; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(43,43,43,0.55)'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-w * 0.45, ty - 30); ctx.lineTo(0, ty - 56); ctx.lineTo(w * 0.45, ty - 30); ctx.quadraticCurveTo(0, ty - 22, -w * 0.45, ty - 30);
      ctx.fillStyle = '#ffffff'; ctx.fill();
    }
    ctx.restore();
  }
  function lollipop(ctx, x, y, s, color, alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(s, s);
    D.box(ctx, -5, -110, 10, 110, 4, '#ffffff', 4);
    D.circle(ctx, 0, -130, 36, color, 4);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 5; a += 0.2) { const r = a * 2.1; ctx.lineTo(Math.cos(a) * r, -130 + Math.sin(a) * r); }
    ctx.stroke();
    ctx.restore();
  }
  function crystal(ctx, x, y, s, color, alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(s, s);
    ctx.shadowColor = color; ctx.shadowBlur = 22;
    for (const [dx, h, wd, a] of [[-16, 46, 14, -0.3], [0, 70, 18, 0], [16, 40, 13, 0.35]]) {
      ctx.save(); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(dx - wd, 0); ctx.lineTo(dx - wd, -h + 14); ctx.lineTo(dx, -h); ctx.lineTo(dx + wd, -h + 14); ctx.lineTo(dx + wd, 0); ctx.closePath();
      ctx.fillStyle = color; ctx.fill();
      ctx.shadowBlur = 0; ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(dx - wd + 5, -h + 18, 4, h - 26);
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
    // pass 1: ground fill + inner dots; secret rooms (F) get a dark "inside" color
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const t = g(c, r), x = c * T, y = r * T;
      if (t === '#') {
        ctx.fillStyle = theme.dirt; ctx.fillRect(x - 0.5, y - 0.5, T + 1, T + 1);
        const hsh = hash(c, r);
        ctx.fillStyle = theme.dirtDot;
        ctx.beginPath(); ctx.arc(x + 10 + (hsh % 24), y + 14 + ((hsh >> 5) % 22), 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 30 - ((hsh >> 9) % 18), y + 32 + ((hsh >> 13) % 10), 3, 0, Math.PI * 2); ctx.fill();
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
        ctx.fillStyle = '#c4efff'; ctx.fillRect(x - 0.5, y - 0.5, T + 1, T + 1);
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(x + 10, y + 34); ctx.lineTo(x + 26, y + 18); ctx.stroke();
        ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 22, y + 38); ctx.lineTo(x + 32, y + 28); ctx.stroke();
        edges(ctx, c, r, (cc, rr) => g(cc, rr) === '~' || (rr > r && groundLike(g(cc, rr))));
        if (g(c, r - 1) !== '~') { ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y + 2, T, 6); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + T, y); ctx.stroke(); }
      } else if (t === 'B') {                 // cracked boulder: roll into it to smash it
        ctx.beginPath();
        ctx.moveTo(x + 6, y + T - 2); ctx.quadraticCurveTo(x + 1, y + 14, x + 14, y + 4); ctx.quadraticCurveTo(x + 26, y - 1, x + 38, y + 6);
        ctx.quadraticCurveTo(x + T, y + 16, x + T - 3, y + T - 2); ctx.closePath();
        ctx.fillStyle = '#a8a29e'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
        ctx.strokeStyle = 'rgba(43,43,43,0.7)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x + 24, y + 6); ctx.lineTo(x + 20, y + 18); ctx.lineTo(x + 28, y + 26); ctx.lineTo(x + 22, y + 40); ctx.moveTo(x + 28, y + 26); ctx.lineTo(x + 38, y + 30); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(x + 14, y + 14, 6, 3, -0.6, 0, 7); ctx.fill();
      } else if (t === 'o') {
        const b = world.bounce[c + ',' + r] || 0;
        const sq = Math.sin(b * Math.PI * 3) * b * 6;
        D.box(ctx, x + 2, y + 2 + sq, T - 4, T - 4 - sq, 14, '#ff6fb5', 4);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        D.rr(ctx, x + 9, y + 9 + sq, 14, 8, 4); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 34, y + 30, 4, 0, Math.PI * 2); ctx.fill();
      } else if (t === '^') {
        thorns(ctx, x, y);
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
    ctx.strokeStyle = theme.topDark; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x0, y - 2); ctx.lineTo(x1, y - 2); ctx.stroke();
    if (leftEnd) { ctx.beginPath(); ctx.moveTo(x0, y - 2); ctx.lineTo(x0, y + 11); ctx.stroke(); }
    if (rightEnd) { ctx.beginPath(); ctx.moveTo(x1, y - 2); ctx.lineTo(x1, y + 11); ctx.stroke(); }
    // little grass blades / sprinkles
    const hsh = hash(c, r);
    if (kind === 'forest' && hsh % 3 === 0) {
      ctx.strokeStyle = theme.topDark; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x + 18, y - 2); ctx.lineTo(x + 14, y - 10); ctx.moveTo(x + 22, y - 2); ctx.lineTo(x + 24, y - 11); ctx.stroke();
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
    D.box(ctx, x + 1, y, w - 2, 16, 7, theme.plank, 4);
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

  function drawPlatform(ctx, pl) {
    // dotted line showing where it goes
    ctx.save();
    ctx.setLineDash([4, 12]); ctx.lineCap = 'round';
    ctx.strokeStyle = theme.dark ? 'rgba(255,255,255,0.35)' : 'rgba(43,43,43,0.25)'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(pl.x0 + PLAT_W / 2, pl.y0 + PLAT_H / 2); ctx.lineTo(pl.x0 + pl.dx + PLAT_W / 2, pl.y0 + pl.dy + PLAT_H / 2); ctx.stroke();
    ctx.restore();
    const x = pl.x, y = pl.y;
    D.box(ctx, x, y, PLAT_W, PLAT_H, 9, theme.plat, 4);
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
    D.box(ctx, x + 2, bottom - 8, s.w - 4, 8, 3, '#8d99ae', 3);
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x + s.w / 2 - 10, bottom - 8);
    for (let i = 1; i <= 4; i++) ctx.lineTo(x + s.w / 2 + (i % 2 ? 10 : -10), bottom - 8 - (h - 8) * i / 4);
    ctx.stroke();
    D.box(ctx, x - 2, bottom - h - 10, s.w + 4, 12, 6, '#ef476f', 4);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; D.rr(ctx, x + 4, bottom - h - 8, s.w - 10, 3, 2); ctx.fill();
  }

  // The goodies you collect: different in every world.
  function drawStar(ctx, s, t) {
    const bob = Math.sin(t * 3 + s.x * 0.05) * 4;
    ctx.save(); ctx.translate(s.x, s.y + bob);
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
  }


  function drawChest(ctx, c, t) {
    const x = c.x, y = c.y;
    ctx.save();
    if (c.open) {
      ctx.globalAlpha = 0.5 + Math.sin(t * 4) * 0.2;
      ctx.fillStyle = '#fff3b0';
      ctx.beginPath(); ctx.moveTo(x - 18, y - 30); ctx.lineTo(x - 40, y - 100); ctx.lineTo(x + 40, y - 100); ctx.lineTo(x + 18, y - 30); ctx.fill();
      ctx.globalAlpha = 1;
    }
    D.box(ctx, x - 24, y - 30, 48, 30, 5, '#b5651d', 4);
    D.box(ctx, x - 24, y - 30, 48, 8, 3, '#ffc93c', 3);
    if (c.open) {
      D.box(ctx, x - 24, y - 52, 48, 16, 6, '#c97a2b', 4);
      for (let i = 0; i < 3; i++) D.circle(ctx, x - 12 + i * 12, y - 32, 6, '#ffd166', 2.5);
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
    ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - 20, y - 44); ctx.lineTo(x - 34, y - 110); ctx.moveTo(x + 20, y - 44); ctx.lineTo(x + 34, y - 110); ctx.stroke();
    // the balloon: colorful stripes
    const cols = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2'];
    ctx.save(); ctx.beginPath(); ctx.ellipse(x, y - 170, 70, 80, 0, 0, 7); ctx.clip();
    for (let k = 0; k < 6; k++) { ctx.fillStyle = cols[k % 4]; ctx.fillRect(x - 70 + k * 24, y - 260, 24, 200); }
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(x, y - 170, 70, 80, 0, 0, 7); ctx.lineWidth = 4.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 34, y - 110); ctx.quadraticCurveTo(x, y - 98, x + 34, y - 110); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(x - 34, y - 196, 10, 22, 0.3, 0, 7); ctx.fill();
    if (finished) { drawHero(ctx, heroDef, x, y - 30, { state: 'jump', face: 1, t }); }   // you, riding in the basket
    D.box(ctx, x - 26, y - 46, 52, 40, 8, '#c68b59', 4);               // the basket
    ctx.strokeStyle = 'rgba(43,43,43,0.4)'; ctx.lineWidth = 3;
    for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - 26 + k * 13, y - 44); ctx.lineTo(x - 26 + k * 13, y - 8); ctx.stroke(); }
    if (!finished) {                                                   // a little flame puffing
      ctx.beginPath(); ctx.moveTo(x - 8, y - 104); ctx.quadraticCurveTo(x, y - 128 - Math.sin(t * 12) * 6, x + 8, y - 104); ctx.closePath();
      ctx.fillStyle = '#ff8c42'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
    }
  }


  // Critters: round, fuzzy, bouncy pom-pom bugs with springy antennae.
  function drawCritter(ctx, cr, t) {
    if (!cr.alive) return;
    const x = cr.x + cr.w / 2, y = cr.y + cr.h;
    const hop = Math.abs(Math.sin(t * 6 + cr.x0)) * 4, sq = (cr.squish || 0);
    ctx.save(); ctx.translate(x, y); ctx.scale(cr.dir < 0 ? 1 : -1, 1);
    ctx.scale(1 + sq * 0.35, 1 - sq * 0.35);
    // springy antennae
    ctx.strokeStyle = INK; ctx.lineWidth = 3;
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s * 6, -30 - hop); ctx.quadraticCurveTo(s * 14, -44 - hop, s * 10 + Math.sin(t * 8) * 2, -48 - hop); ctx.stroke();
      D.circle(ctx, s * 10 + Math.sin(t * 8) * 2, -49 - hop, 4, theme.spots, 2.5);
    }
    // fuzzy round body (bumpy outline)
    ctx.beginPath();
    for (let k = 0; k <= 20; k++) {
      const a = k / 20 * Math.PI * 2, r = 18 + (k % 2 ? 2 : 0);
      ctx.lineTo(Math.cos(a) * r, -18 - hop + Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fillStyle = theme.critter; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
    // little feet
    D.circle(ctx, -8, -2, 5, INK, 0); D.circle(ctx, 8, -2, 5, INK, 0);
    // one big friendly eye + a smile
    D.circle(ctx, -6, -22 - hop, 7.5, '#ffffff', 3);
    D.circle(ctx, -8 + Math.sin(t * 3), -22 - hop, 3.5, INK, 0);
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(-4, -12 - hop, 4, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,107,129,0.6)'; ctx.beginPath(); ctx.arc(6, -14 - hop, 3, 0, 7); ctx.fill();
    ctx.restore();
  }


  // ---------------------------------------------------------------
  // The hero. (x, y) = bottom-center. Also used for the menu pictures.
  // ---------------------------------------------------------------
  function drawHero(ctx, h, x, y, o = {}) {
    const face = o.face || 1;
    const state = o.state || 'idle';
    const ph = o.phase || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale((o.sx || 1), (o.sy || 1));
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    const bob = state === 'run' ? Math.abs(Math.sin(ph)) * -3 : state === 'idle' ? Math.sin((o.t || 0) * 3) * 1 : 0;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const L = 3.5;
    const body = h.body, belly = h.belly;
    // feet
    const f1 = state === 'run' ? Math.sin(ph) * 7 : state === 'jump' ? -3 : 0;
    const f2 = state === 'run' ? -Math.sin(ph) * 7 : state === 'jump' ? 3 : 0;
    const footCol = h.id === 'panda' ? INK : body;
    for (const [fx0, fo] of [[-8, f1], [8, f2]]) {
      ctx.beginPath(); ctx.ellipse(fx0 + fo, -4 - (state === 'jump' ? 3 : 0), 8, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = footCol; ctx.fill(); ctx.lineWidth = L; ctx.strokeStyle = INK; ctx.stroke();
    }
    ctx.translate(0, bob);
    // tails (behind the body)
    ctx.save(); ctx.scale(face, 1);
    if (h.id === 'monkey') {
      ctx.strokeStyle = INK; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(-14, -14); ctx.quadraticCurveTo(-34, -14, -30, -32); ctx.quadraticCurveTo(-26, -42, -20, -36); ctx.stroke();
      ctx.strokeStyle = body; ctx.lineWidth = 4.5; ctx.stroke();
    } else if (h.id === 'fox') {
      ctx.beginPath(); ctx.moveTo(-12, -12); ctx.quadraticCurveTo(-40, -8, -36, -34); ctx.quadraticCurveTo(-22, -26, -12, -22); ctx.closePath();
      ctx.fillStyle = body; ctx.fill(); ctx.lineWidth = L; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-31, -24); ctx.quadraticCurveTo(-38, -28, -36, -34); ctx.quadraticCurveTo(-30, -30, -27, -27); ctx.fillStyle = '#fff'; ctx.fill();
    } else if (h.id === 'bunny' || h.id === 'panda') {
      D.circle(ctx, -18, -16, 7, h.id === 'panda' ? INK : '#fff', L);
    }
    ctx.restore();
    // ears / eye bumps (behind the head)
    const earUp = state === 'jump' ? -3 : state === 'fall' ? 3 : 0;
    if (h.id === 'monkey') {
      for (const s of [-1, 1]) { D.circle(ctx, s * 19, -32, 8, body, L); D.circle(ctx, s * 19, -32, 4, h.extra, 0); }
    } else if (h.id === 'bunny') {
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(s * 8, -44 + earUp); ctx.rotate(s * 0.15 + (state === 'fall' ? s * 0.4 : 0));
        ctx.beginPath(); ctx.ellipse(0, -14, 6.5, 17, 0, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill(); ctx.lineWidth = L; ctx.strokeStyle = INK; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, -14, 3, 11, 0, 0, Math.PI * 2); ctx.fillStyle = h.extra; ctx.fill();
        ctx.restore();
      }
    } else if (h.id === 'fox') {
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(s * 6, -42); ctx.lineTo(s * 17, -60 + earUp); ctx.lineTo(s * 20, -36); ctx.closePath();
        ctx.fillStyle = body; ctx.fill(); ctx.lineWidth = L; ctx.strokeStyle = INK; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s * 10, -43); ctx.lineTo(s * 16, -54 + earUp); ctx.lineTo(s * 17, -41); ctx.closePath(); ctx.fillStyle = INK; ctx.fill();
      }
    } else if (h.id === 'panda') {
      for (const s of [-1, 1]) D.circle(ctx, s * 16, -38, 8, INK, L);
    } else if (h.id === 'frog') {
      for (const s of [-1, 1]) D.circle(ctx, s * 9 + face * 3, -40, 10, body, L);
    }
    // body + head (one round blob)
    ctx.beginPath(); ctx.ellipse(0, -24, 20, 21, 0, 0, Math.PI * 2);
    ctx.fillStyle = body; ctx.fill(); ctx.lineWidth = L; ctx.strokeStyle = INK; ctx.stroke();
    // face patch / belly
    ctx.beginPath(); ctx.ellipse(face * 4, -19, 13, 12, 0, 0, Math.PI * 2); ctx.fillStyle = belly; ctx.fill();
    if (h.id === 'monkey' || h.id === 'fox') { ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(43,43,43,0.35)'; ctx.stroke(); }
    // arms: up when jumping, swinging when running
    const armA = state === 'jump' ? -2.3 : state === 'fall' ? -1.2 : state === 'run' ? -0.3 + Math.sin(ph) * 0.6 : -0.15;
    const armCol = h.id === 'panda' ? INK : body;
    for (const s of [-1, 1]) {
      ctx.save(); ctx.translate(s * 16, -20); ctx.rotate(s * (Math.PI / 2 + armA) - s * Math.PI / 2 * 0 + (s < 0 ? 0 : 0));
      ctx.beginPath(); ctx.ellipse(0, 7 * 1, 5, 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = armCol; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      ctx.restore();
    }
    // eyes
    const ex = face * 4;
    const eyeY = h.id === 'frog' ? -41 : -27;
    const eyeDX = h.id === 'frog' ? 9 : 7;
    for (const s of [-1, 1]) {
      const cx = (h.id === 'frog' ? s * 9 + face * 3 : ex + s * eyeDX);
      if (h.id === 'panda') { ctx.beginPath(); ctx.ellipse(cx, eyeY + 1, 6.5, 8, s * -0.4, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill(); }
      if (o.blink) { ctx.strokeStyle = h.id === 'panda' ? '#fff' : INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 4, eyeY); ctx.lineTo(cx + 4, eyeY); ctx.stroke(); continue; }
      const big = state === 'fall' || state === 'hurt' ? 1.2 : 1;
      ctx.beginPath(); ctx.ellipse(cx + face, eyeY, 4 * big, 5.5 * big, 0, 0, Math.PI * 2); ctx.fillStyle = h.id === 'panda' ? '#fff' : INK; ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + face, eyeY + 0.5, 2.8 * big, 4 * big, 0, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
      D.circle(ctx, cx + face + 1.3, eyeY - 2, 1.7, '#ffffff', 0);
    }
    // cheeks
    ctx.fillStyle = 'rgba(255,107,129,0.55)';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(ex + s * 12, -17, 3.5, 0, Math.PI * 2); ctx.fill(); }
    // nose for the fox/panda/bunny
    if (h.id !== 'frog' && h.id !== 'monkey') { ctx.fillStyle = h.id === 'bunny' ? '#ff8fb8' : INK; ctx.beginPath(); ctx.ellipse(ex + face * 1, -21, 3, 2.2, 0, 0, Math.PI * 2); ctx.fill(); }
    // mouth: smile, or a happy "o" in the air
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    if (state === 'jump' || state === 'hurt') { ctx.fillStyle = '#c8344f'; ctx.beginPath(); ctx.ellipse(ex + face, -15, 3.2, 3.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(ex + face, -18, 5, 0.25, Math.PI - 0.25); ctx.stroke(); }
    ctx.restore();
  }

  // The big leaf the hero holds up while gliding.
  function drawLeaf(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 5) * 0.08);
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-40, -18); ctx.quadraticCurveTo(-30, -52, 0, -54); ctx.quadraticCurveTo(30, -52, 40, -18);
    ctx.quadraticCurveTo(0, -30, -40, -18); ctx.closePath();
    ctx.fillStyle = '#6cc04a'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.strokeStyle = '#4f9e35'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(0, -50);
    for (const sg of [-1, 1]) { ctx.moveTo(0, -32); ctx.lineTo(sg * 18, -42); ctx.moveTo(0, -42); ctx.lineTo(sg * 12, -49); }
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
    for (let i = 0; i < maxHearts; i++) heart(ctx, 118 + i * 38, 36, 17, i < hearts);
    if (tries !== Infinity) {
      // extra tries: tiny hero faces
      for (let i = 0; i < Math.max(0, tries); i++) {
        ctx.save(); ctx.translate(112 + i * 30, 92); ctx.scale(0.5, 0.5);
        drawHero(ctx, heroDef, 0, 0, { state: 'idle' });
        ctx.restore();
      }
    }
    // stars collected (middle)
    ctx.save(); ctx.translate(W / 2 - 50, 38); ctx.scale(1.2, 1.2); drawGoodie(ctx, world.def.world, now()); ctx.restore();
    D.text(ctx, got + '/' + world.starsTotal, W / 2 - 22, 40, { size: 32, align: 'left' });
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
    for (const pl of world.plats) if (visible(pl.x, 300)) drawPlatform(ctx, pl);
    for (const s of world.springs) if (visible(s.x)) drawSpring(ctx, s);
    for (const c of world.chests) if (visible(c.x)) drawChest(ctx, c, t);
    for (const s of world.stars) if (!s.got && visible(s.x)) drawStar(ctx, s, t);
    for (const cr of world.critters) if (visible(cr.x)) drawCritter(ctx, cr, t);

    // the hero (blinks while safe after getting hurt). After the goal you're in the balloon.
    if (!finished && p.dead <= 0 && !(p.invuln > 0 && Math.floor(p.invuln * 10) % 2 === 0)) {
      const st = heroState();
      if (p.roll > 0) {                       // rolling: tumble as a ball
        ctx.save(); ctx.translate(p.x + PW / 2, p.y + PH / 2 + 4);
        ctx.rotate(p.face * (PHYS.rollTime - p.roll) * 22);
        drawHero(ctx, heroDef, 0, 18, { face: p.face, state: 'jump', sx: 0.85, sy: 0.85, t });
        ctx.restore();
      } else {
        if (p.gliding) drawLeaf(ctx, p.x + PW / 2, p.y - 6, t);
        drawHero(ctx, heroDef, p.x + PW / 2, p.y + PH + 1, {
          face: p.face, state: p.gliding ? 'jump' : st, phase: p.runPhase, sx: p.sx, sy: p.sy, t,
          blink: st === 'idle' && (t % 3.2) < 0.12,
        });
      }
    }
    fx.draw(ctx);
    drawFakeWalls(ctx, Math.max(0, c0), Math.min(world.cols - 1, c1), r0, r1);
    for (const q of popups) D.text(ctx, q.text, q.x, q.y, { size: 26, color: q.color });
    ctx.restore();

    if (theme.dark) {
      // soft darkness around the edges of the cave (the middle stays bright)
      const px = p.x + PW / 2 - ox, py = p.y + PH / 2 - oy;
      const v = ctx.createRadialGradient(px, py, 160, px, py, 620);
      v.addColorStop(0, 'rgba(10,4,30,0)'); v.addColorStop(1, 'rgba(10,4,30,0.55)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    }
    drawHUD(g, ctx);
  }

  // ---------------------------------------------------------------
  // Menus: level tiles and the hero picker
  // ---------------------------------------------------------------
  function levelPic(id) {
    const wd = WORLDS[id];
    const extra = {
      forest: `<circle cx="96" cy="26" r="13" fill="${wd.mid}" stroke="#2b2b2b" stroke-width="3"/><rect x="93" y="38" width="6" height="12" fill="${wd.trunk}"/>`,
      cave: `<path d="M86 50 L92 26 L98 50 Z" fill="#5ee6d0" stroke="#2b2b2b" stroke-width="3"/><path d="M98 50 L104 34 L110 50 Z" fill="#ff7bd5" stroke="#2b2b2b" stroke-width="3"/><path d="M0 0 H120 V8 L110 18 L100 8 L80 14 L60 6 L40 16 L20 6 L0 12 Z" fill="${wd.far}"/>`,
      snow: `<path d="M70 50 L95 12 L120 50 Z" fill="#ffffff" stroke="#2b2b2b" stroke-width="3"/><rect x="30" y="44" width="36" height="8" fill="#c4efff" stroke="#2b2b2b" stroke-width="3"/>`,
      candy: `<rect x="95" y="24" width="4" height="28" fill="#fff" stroke="#2b2b2b" stroke-width="2"/><circle cx="97" cy="22" r="11" fill="#ff6fb5" stroke="#2b2b2b" stroke-width="3"/><rect x="34" y="40" width="18" height="12" rx="4" fill="#ff6fb5" stroke="#2b2b2b" stroke-width="3"/>`,
    }[id];
    return `<svg viewBox="0 0 120 70"><rect width="120" height="70" fill="${wd.sky[0]}"/>${extra}<rect x="0" y="52" width="120" height="18" fill="${wd.dirt}"/><rect x="0" y="50" width="120" height="7" fill="${wd.top}" stroke="#2b2b2b" stroke-width="3"/><ellipse cx="22" cy="18" rx="20" ry="16" fill="#ef476f" stroke="#2b2b2b" stroke-width="2.5"/><path d="M12 6 V30 M22 2 V34 M32 6 V30" stroke="#ffd166" stroke-width="3"/><rect x="15" y="38" width="14" height="9" rx="2" fill="#c68b59" stroke="#2b2b2b" stroke-width="2"/></svg>`;
  }
  const chestSVG = `<svg viewBox="0 0 48 40" style="width:24px;height:22px;vertical-align:middle"><rect x="6" y="18" width="36" height="18" rx="3" fill="#b5651d" stroke="#2b2b2b" stroke-width="3"/><path d="M6 19 V12 Q24 0 42 12 V19 Z" fill="#c97a2b" stroke="#2b2b2b" stroke-width="3"/><rect x="20" y="14" width="8" height="9" rx="2" fill="#ffc93c" stroke="#2b2b2b" stroke-width="2"/></svg>`;

  function levels(g) {
    return LEVELS.map((lv, i) => {
      const prev = i === 0 || (g.save.levels[LEVELS[i - 1].id] || {}).done;
      const rec = g.save.levels[lv.id] || {};
      const best = (g.save.data.best || {})[lv.id];
      return {
        ...lv, pic: levelPic(lv.world), locked: !prev,
        meta: (rec.stars != null ? Arcade.starsHTML(rec.stars) : '') + (best && best.treasure ? ' ' + chestSVG : ''),
      };
    });
  }

  // Draw a hero onto a little canvas for the picker tiles.
  function heroPic(h) {
    const c = document.createElement('canvas');
    c.width = 160; c.height = 140;
    const x = c.getContext('2d');
    x.scale(2, 2);
    drawHero(x, h, 40, 64, { state: 'idle', face: 1 });
    return c.toDataURL();
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
  Arcade.start({
    id: 'jungle',
    title: 'Jungle Jump',
    view: { w: W, h: H },
    background: '#8fdcff',
    music: 'jungle',
    levelsTitle: 'Pick a world',
    howTo: [
      { pic: S(`<path d="M14 40 H66" stroke="#2b2b2b" stroke-width="7" stroke-linecap="round"/><path d="M24 28 L12 40 L24 52 M56 28 L68 40 L56 52" fill="none" stroke="#2b2b2b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`), text: 'Run', keys: 'Left / Right' },
      { pic: S(`<path d="M10 70 H70" stroke="#6cc04a" stroke-width="8"/><path d="M20 66 Q30 10 58 30" fill="none" stroke="#118ab2" stroke-width="5" stroke-dasharray="6 6" stroke-linecap="round"/>${monkeySVG(58, 46)}`), text: 'Jump! Hold for higher', keys: 'Space / Up' },
      { pic: S(`<path d="M10 22 Q24 4 40 6 Q56 4 70 22 Q40 14 10 22 Z" fill="#6cc04a" ${L}/><path d="M40 8 V30" stroke="#2b2b2b" stroke-width="3"/>${monkeySVG(40, 62)}<path d="M18 50 v10 M62 46 v10" stroke="#8ecae6" stroke-width="4" stroke-linecap="round"/>`), text: 'Hold jump to glide with your leaf', keys: 'Hold Space' },
      { pic: S(`<circle cx="44" cy="42" r="18" fill="#b5764a" ${L}/><path d="M36 34 A10 10 0 1 1 44 52" fill="none" stroke="#2b2b2b" stroke-width="3"/><path d="M8 30 H20 M4 42 H18 M8 54 H20" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/><path d="M62 52 L74 40 L70 60 Z" fill="#a8a29e" ${L}/>`), text: 'Roll to smash rocks and boop critters', keys: 'X / roll button' },
      { pic: S(`<circle cx="26" cy="44" r="7" fill="#ef476f" ${L} stroke-width="3"/><circle cx="36" cy="44" r="7" fill="#ef476f" ${L} stroke-width="3"/><circle cx="31" cy="53" r="7" fill="#ef476f" ${L} stroke-width="3"/><path d="M50 30 L60 18 L70 30 L60 52 Z" fill="#5ee6d0" ${L}/>`), text: 'Collect the goodies' },
      { pic: S(`<rect x="16" y="40" width="48" height="26" rx="4" fill="#b5651d" ${L}/><path d="M16 41 V30 Q40 12 64 30 V41 Z" fill="#c97a2b" ${L}/><rect x="34" y="34" width="12" height="12" rx="3" fill="#ffc93c" ${L}/><path d="M66 12 L69 18 L75 19 L70 23 L72 29 L66 26 L60 29 L62 23 L57 19 L63 18 Z" fill="#fff" ${L} stroke-width="2"/>`), text: 'Find the secret treasure' },
      { pic: S(`<circle cx="40" cy="52" r="18" fill="#ef476f" ${L}/><circle cx="34" cy="48" r="6" fill="#fff" ${L} stroke-width="3"/><circle cx="33" cy="48" r="2.5" fill="#2b2b2b"/><path d="M40 14 V30 M33 22 L40 14 L47 22" fill="none" stroke="#06d6a0" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`), text: 'Critters are bouncy: land on them to bounce' },
      { pic: S(`<rect x="20" y="14" width="8" height="60" rx="3" fill="#9a6235" ${L}/><rect x="36" y="26" width="24" height="28" rx="7" fill="#ffd166" ${L}/><rect x="33" y="22" width="30" height="7" rx="3" fill="#ef476f" ${L} stroke-width="3"/>`), text: 'Lanterns save your spot' },
      { pic: S(`<ellipse cx="40" cy="28" rx="22" ry="24" fill="#ef476f" ${L}/><path d="M30 6 V50 M50 6 V50" stroke="#ffd166" stroke-width="6"/><ellipse cx="40" cy="28" rx="22" ry="24" fill="none" ${L}/><path d="M28 48 L32 60 M52 48 L48 60" stroke="#2b2b2b" stroke-width="3"/><rect x="28" y="58" width="24" height="16" rx="4" fill="#c68b59" ${L}/>`), text: 'Reach the balloon to fly home!' },
    ],
    buttons: {
      left: [{ id: 'ArrowLeft', icon: icons.left, label: 'Left' }, { id: 'ArrowRight', icon: icons.right, label: 'Right' }],
      right: [{ id: 'KeyX', icon: ROLL_ICON, label: 'Roll' }, { id: 'Space', icon: icons.jump, label: 'Jump' }],
    },
    levels,
    extraMenu,
    setup,
    update,
    draw: render,
  });

  // For automated tests: the level data and the hero physics, so a test can
  // check every level can really be finished using the same jump the game uses.
  window.__jungleDebug = { T, PW, PH, PLAT_W, PHYS, MAPS, LEVELS, buildWorld, newPlayer, stepPlayer, updatePlats, thornHit, overlap };
})();
