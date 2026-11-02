// =====================================================================
// Space Defender — a friendly side-scrolling space shooter.
//
// How it works:
//  * Your ship lives on the left part of the screen. Silly robots and goofy
//    aliens fly in from the right. Your ship blows "bubble shots" at them.
//    A bubbled enemy floats away inside its bubble and pops into stars and hearts.
//  * 10 SECTORS, about 1-2 minutes each:
//        waves of enemies -> a MINI BOSS -> more waves -> a BIG BOSS
//    Then the mega fight: CHIMERA, THE EATER OF WORLDS (4 heads/phases).
//  * 20 SPECIAL WEAPONS. A friendly gift saucer flies by carrying a present:
//    bubble it and grab the capsule, and your gun turns into that weapon.
//    Mini bosses always drop one. Grab the same weapon again = it powers up
//    (up to level 3). Every weapon you find goes in your Weapon Book.
//  * Bosses do 2-5 different attacks. Every attack is shown first (a
//    flashing "!" and a warning stripe) so kids have time to move away.
//  * Getting bonked never "destroys" the ship: it bonks, flashes and loses
//    one life. No lives left = "Nice try!" - and after a mini boss (or a
//    Chimera phase) you can carry on from that checkpoint.
//  * Power-ups: shield, speed and +1 life.
//
// Files: space/data.js (sectors, bosses, songs), space/art.js (all drawings),
// this file (the rules). Test hooks: window.__spaceState / __spaceTest.
// =====================================================================
(function () {
  const { draw, icons, math } = Arcade;
  const D = draw;
  const INK = D.INK;
  const ART = window.SpaceArt;
  const { THEMES, SECTORS, FINAL, ENDLESS, MINIS, BIGS, SONGS } = window.SpaceData;
  const W = 960, H = 540;
  const STEP = 1 / 120;

  // The ship may roam the left part of the screen only.
  const SHIP_MIN_X = 50, SHIP_MAX_X = 560, SHIP_MIN_Y = 56, SHIP_MAX_Y = H - 34;
  const SHIP_R = 16;                 // the ship's (kind, small) hit circle

  // Points for bubbling each enemy type (before the combo multiplier).
  const POINTS = { bobber: 100, squad: 100, diver: 150, shooter: 200, rock: 300, zigzag: 150, splitter: 200, orbiter: 250, gift: 0, mini: 2000, boss: 5000, chimera: 10000 };

  // Ships you can unlock with stars (just looks, they all fly the same).
  const SHIPS = [
    { id: 'zippy',    name: 'Zippy',    color: '#ef476f', accent: '#ffd166', shape: 'rocket', need: 0 },
    { id: 'bluebird', name: 'Bluebird', color: '#118ab2', accent: '#8ecae6', shape: 'jet',    need: 4 },
    { id: 'minty',    name: 'Minty',    color: '#06d6a0', accent: '#ffd166', shape: 'saucer', need: 8 },
    { id: 'sunny',    name: 'Sunny',    color: '#ffc93c', accent: '#ef476f', shape: 'rocket', need: 13 },
    { id: 'grape',    name: 'Grape',    color: '#9b5de5', accent: '#f15bb5', shape: 'jet',    need: 19 },
    { id: 'rainbow',  name: 'Rainbow',  color: 'rainbow', accent: '#ffffff', shape: 'saucer', need: 26 },
  ];
  const RAINBOW = ['#ef476f', '#ff8c42', '#ffd166', '#06d6a0', '#118ab2', '#9b5de5'];

  // Power-ups (not weapons): how long they last (seconds) and their colors.
  const POWERS = {
    shield: { time: 15, color: '#8ecae6' },
    speed:  { time: 10, color: '#06d6a0' },
    life:   { time: 0,  color: '#ef476f' },
  };

  // ---------------------------------------------------------------
  // THE 20 SPECIAL WEAPONS (+ the Bubble Blaster you start with).
  // Each weapon: id, name, color, gap (seconds between shots at level 1/2/3),
  // fire(lv) = what one shot does; some also have tick(dt, lv) for things
  // that happen all the time (beams, orbiting stars, lightning, drones).
  // shoot({...}) makes one shot. Shot options:
  //   vx, vy (speed), r (size), dmg (damage), pierce (goes through this many),
  //   kind (how it looks), life (seconds), home (turns toward enemies),
  //   bounce (bounces off the top/bottom), wave (wiggles), back (boomerang),
  //   splash (explodes), slow (freezes enemies for a bit), grow (gets bigger)
  // Damage is balanced so every weapon is roughly as strong as the others,
  // just different: some hit crowds, some hit hard, some protect you.
  // ---------------------------------------------------------------
  const ang = (a, sp) => ({ vx: Math.cos(a) * sp, vy: Math.sin(a) * sp });
  const WEAPONS = [
    { id: 'bubble', name: 'Bubble Blaster', color: '#8ecae6', gap: [0.14, 0.13, 0.12],
      fire() { shoot({}); } },
    { id: 'twin', name: 'Twin Bubbles', color: '#4cc9f0', gap: [0.14, 0.13, 0.13],
      fire(lv) { for (const dy of lv < 3 ? [-9, 9] : [-14, 0, 14]) shoot({ y: ship.y + dy, dmg: lv === 1 ? 0.8 : 0.85 }); } },
    { id: 'spread', name: 'Triple Spread', color: '#ff8c42', gap: [0.16, 0.16, 0.15],
      fire(lv) { const a = [[-0.2, 0, 0.2], [-0.3, -0.1, 0.1, 0.3], [-0.4, -0.2, 0, 0.2, 0.4]][lv - 1]; for (const x of a) shoot({ ...ang(x, 720), dmg: 0.8 }); } },
    { id: 'fan', name: 'Wide Fan', color: '#ffd166', gap: [0.24, 0.22, 0.2],
      fire(lv) { const n = [5, 7, 9][lv - 1], w = [0.45, 0.55, 0.65][lv - 1]; for (let i = 0; i < n; i++) shoot({ ...ang(-w + 2 * w * i / (n - 1), 620), dmg: 0.75, r: 8 }); } },
    { id: 'beam', name: 'Rainbow Beam', color: '#f15bb5', beam: true,
      dps: [9, 12, 15], width: [12, 15, 18] },
    { id: 'homing', name: 'Homing Hearts', color: '#ff5fa2', gap: [0.24, 0.22, 0.22],
      fire(lv) { for (const a of lv < 3 ? [-0.5, 0.5] : [-0.6, 0, 0.6]) shoot({ ...ang(a, 480), kind: 'heart', home: 7, dmg: [0.9, 1.1, 1.1][lv - 1], life: 2.4, r: 10 }); } },
    { id: 'bouncy', name: 'Bouncy Balls', color: '#9b5de5', gap: [0.22, 0.2, 0.2],
      fire(lv) { const a = [[-0.3, 0, 0.3], [-0.35, -0.1, 0.1, 0.35], [-0.5, -0.25, 0, 0.25, 0.5]][lv - 1]; for (const x of a) shoot({ ...ang(x, 560), kind: 'ball', bounce: true, life: 2.2, dmg: 1.15, r: 11 }); } },
    { id: 'laser', name: 'Laser Line', color: '#ff3d6e', gap: [0.1, 0.09, 0.08],
      fire(lv) { shoot({ vx: 1300, kind: 'laser', r: 6, pierce: [2, 3, 5][lv - 1], dmg: [0.7, 0.75, 0.8][lv - 1] }); } },
    { id: 'orbit', name: 'Star Spinner', color: '#ffc93c', gap: [0.2, 0.2, 0.2], stars: [3, 4, 5],
      fire() { shoot({ dmg: 0.8 }); } },
    { id: 'big', name: 'Big Bubble', color: '#bdf3ff', gap: [0.5, 0.45, 0.4],
      fire(lv) { shoot({ vx: 360, r: [24, 28, 32][lv - 1], dmg: [4, 5, 6][lv - 1], pierce: 99, kind: 'big', life: 3 }); } },
    { id: 'rapid', name: 'Rapid Fire', color: '#06d6a0', gap: [0.065, 0.055, 0.045],
      fire() { shoot({ ...ang(math.rand(-0.06, 0.06), 800), r: 6, dmg: 0.5 }); } },
    { id: 'cross', name: 'Cross Shot', color: '#118ab2', gap: [0.17, 0.16, 0.15],
      fire(lv) { const a = [[0, -1.57, 1.57], [0, -0.78, 0.78, -1.57, 1.57], [0, -0.78, 0.78, -1.57, 1.57, 3.14]][lv - 1]; for (const x of a) shoot({ ...ang(x, 640), dmg: x === 0 ? 1.6 : 0.9, r: x === 0 ? 11 : 9 }); } },   // (the forward one is extra strong)
    { id: 'wave', name: 'Wiggle Wave', color: '#4361ee', gap: [0.13, 0.12, 0.12],
      fire(lv) { for (const ph of [0, Math.PI]) shoot({ kind: 'orb', wave: { amp: [26, 34, 42][lv - 1], ph }, dmg: [0.8, 0.9, 1][lv - 1], r: 8 }); } },
    { id: 'boomerang', name: 'Boomerang', color: '#ff8c42', gap: [0.38, 0.36, 0.34],
      fire(lv) { for (const dy of lv === 1 ? [0] : [-20, 20]) shoot({ y: ship.y + dy, vx: 950, kind: 'boomer', back: true, pierce: 99, dmg: [1.6, 1.6, 2][lv - 1], r: 14, life: 2.6 }); } },
    { id: 'zap', name: 'Lightning Zap', color: '#ffd166', zap: true, every: [0.32, 0.28, 0.24], chain: [2, 3, 4] },
    { id: 'rockets', name: 'Rocket Pops', color: '#ef476f', gap: [0.4, 0.38, 0.36],
      fire(lv) { for (const dy of lv < 3 ? [-12, 12] : [-18, 0, 18]) shoot({ y: ship.y + dy, vx: 200, kind: 'rocket', accel: 1500, splash: [60, 75, 90][lv - 1], dmg: 2, r: 9 }); } },
    { id: 'freeze', name: 'Snowflake Freezer', color: '#9bf6ff', gap: [0.16, 0.16, 0.15],
      fire(lv) { const ys = [[0], [-10, 10], [-16, 0, 16]][lv - 1]; for (const dy of ys) shoot({ y: ship.y + dy, kind: 'flake', slow: 2, dmg: [1, 0.75, 0.7][lv - 1], r: 9 }); } },
    { id: 'ring', name: 'Ring Pulse', color: '#80ffdb', gap: [0.22, 0.2, 0.2], pulse: [0.6, 0.55, 0.5], reach: [220, 260, 300],
      fire() { shoot({ dmg: 0.9 }); } },
    { id: 'petal', name: 'Petal Storm', color: '#ffafcc', gap: [0.07, 0.06, 0.055],
      fire(lv) { const a = Math.sin(clock * 6) * 0.28; for (const s of lv < 3 ? [1] : [1, -1]) shoot({ ...ang(a * s, 660), kind: 'petal', dmg: [0.8, 0.9, 0.75][lv - 1], r: 9 }); } },
    { id: 'drones', name: 'Drone Buddies', color: '#adb5bd', gap: [0.15, 0.14, 0.14], drones: [2, 2, 3], droneGap: [0.26, 0.2, 0.2],
      fire() { shoot({ dmg: 0.9 }); } },
    { id: 'sonic', name: 'Sonic Boom', color: '#caffbf', gap: [0.32, 0.28, 0.25],
      fire(lv) { shoot({ vx: 520, kind: 'sonic', grow: 50, r: 16, pierce: 99, dmg: [2.4, 2.8, 3.2][lv - 1], life: 1.6 }); } },
  ];
  const WEAPON = Object.fromEntries(WEAPONS.map(w => [w.id, w]));
  const SPECIALS = WEAPONS.slice(1);         // the 20 you can find

  // ---------------------------------------------------------------
  // Game state (reset in setup)
  // ---------------------------------------------------------------
  let G = null;            // the kit's g object
  let sector, theme, ship, shipDesign;
  let shots, enemies, groups, ebullets, powerups, capsules, floaters, hearts, popups, rings, bolts, drones;
  let stars, planets;
  let lives, startLives, score, combo, comboT, bestCombo, hitsTaken, defeated, potential, sinceDrop;
  let part, waveIdx, waveT, waveLen, waveList, spawnQueue, phase, phaseT, banner, boss, chim, finished, clock, endlessLoop, checkpoint, pulseT, zapT;
  let fireCD, beamOn, song, shake;
  let resume = null;       // where "carry on from the checkpoint" starts
  const test = { god: false };   // test-only: ignore hits

  // Difficulty knobs, read from g.pick (+ the sector's tier) in setup
  let K = {};

  function totalStars(g) { return Object.values(g.save.levels).reduce((s, r) => s + (r.stars || 0), 0); }
  function shipUnlocked(g, s) { return s.need === 0 || g.isUnlocked('ship-' + s.id); }
  function pickedShip(g) {
    const id = g.save.data.ship || 'zippy';
    return SHIPS.find(s => s.id === id && shipUnlocked(g, s)) || SHIPS[0];
  }
  function checkUnlocks(g) {
    const n = totalStars(g);
    for (const s of SHIPS) if (s.need && n >= s.need) g.unlock('ship-' + s.id, s.name + ' ship!');
  }
  function isTouch() { return document.body.classList.contains('ar-touch'); }
  // Auto-fire: always on Easy; otherwise the saved choice (on by default for touch screens).
  function autoFire(g) {
    if (g.difficulty === 'easy') return true;
    const a = g.save.data.autofire;
    return a == null ? isTouch() : a;
  }
  function found(g) { return g.save.data.found || (g.save.data.found = []); }

  function setup(g, level) {
    G = g;
    sector = level || SECTORS[0];
    theme = THEMES[sector.theme] || THEMES.moon;
    document.body.style.setProperty('--ar-bg', theme.bg);
    shipDesign = pickedShip(g);
    const tier = sector.tier || 1, tk = (tier - 1) / 9;   // 0 .. 1 over the 10 sectors

    K = {
      lives: g.pick(5, 4, 3) + (sector.final ? 2 : 0),
      bulletSpeed: g.pick(115, 150, 200) * (1 + 0.3 * tk),   // enemy bubble speed (px/s)
      fireGap: g.pick(2.8, 2.0, 1.4) * (1 - 0.3 * tk),     // seconds between a shooter's shots
      count: g.pick(0.7, 1, 1.25),                          // how many enemies in each group
      hp: g.pick(0, 0, 1),                                  // extra health for enemies
      speed: g.pick(0.85, 1, 1.15) * (1 + 0.2 * tk),        // how fast enemies fly
      maxEnemies: g.pick(8, 12, 16) + Math.round(tk * 4),   // never more than this at once
      maxBullets: g.pick(6, 11, 16) + Math.round(tk * 6),   // ... or this many enemy bubbles
      bossHp: g.pick(90, 120, 150) * (1 + 0.5 * tk),        // big boss health (mini boss: less)
      drop: g.pick(0.16, 0.11, 0.08),                       // chance an enemy drops a power-up
      rest: g.pick(1.9, 1.35, 1.0) * (1 - 0.25 * tk),       // boss pause between attacks
      bulletR: g.pick(11, 10, 9),
      tier,
    };

    ship = { x: 150, y: H / 2, vx: 0, vy: 0, inv: 0, bonk: 0, shield: 0, speed: 0, tilt: 0,
             dragX: 0, dragY: 0, px: 0, py: 0, weapon: { id: 'bubble', lv: 1 } };
    shots = []; enemies = []; groups = []; ebullets = []; powerups = []; capsules = []; floaters = []; hearts = []; popups = [];
    rings = []; bolts = []; drones = [];
    lives = startLives = K.lives;
    score = 0; combo = 0; comboT = 0; bestCombo = 0; hitsTaken = 0; defeated = 0; potential = 0; sinceDrop = 0;
    part = 1; waveIdx = -1; waveT = 0; waveList = []; spawnQueue = []; boss = null; chim = null; finished = false; clock = 0; endlessLoop = 0;
    checkpoint = 0; pulseT = 0; zapT = 0; fireCD = 0; beamOn = false; shake = 0;
    song = SONGS[sector.song] || sector.song || 'space';
    phase = 'intro'; phaseT = 2.2;
    banner = { text: sector.name, sub: sector.endless ? 'How far can you go?' : sector.final ? 'The final battle!' : 'Get ready!', t: 2.2 };

    // carrying on from a checkpoint?
    if (resume && resume.id === sector.id) {
      checkpoint = resume.cp; score = resume.score; ship.weapon = { ...resume.weapon };
      if (!sector.final) { part = 2; banner = { text: sector.name, sub: 'Checkpoint!', t: 2.2 }; }
    }
    resume = null;
    if (sector.final) startFinal(g);
    makeBackground();
    g.sfx('go');

    // peek hooks for automated tests
    window.__spaceState = () => ({
      sector: sector.id, x: ship.x, y: ship.y, lives, score, combo, mult: mult(), part, wave: waveIdx + 1, waves: waveList.length, phase,
      enemies: enemies.length, boss: boss ? { kind: boss.kind, id: boss.id, hp: Math.max(0, Math.ceil(boss.hp)), max: boss.max } : null,
      bossHp: boss ? Math.max(0, Math.ceil(boss.hp)) : null, bossMax: boss ? boss.max : null,
      chimera: chim ? { phase: chim.phase, part: chim.part, hp: Math.max(0, Math.ceil(chim.hp)), max: chim.max, beaten: chim.beaten } : null,
      bullets: ebullets.length, shots: shots.length, powerups: powerups.length, capsules: capsules.length,
      weapon: { ...ship.weapon }, found: found(g).slice(), checkpoint,
      power: { shield: ship.shield, speed: ship.speed },
      hits: hitsTaken, defeated, bestCombo, finished, god: test.god, time: clock,
    });
    window.__spaceTest = {
      god(on) { test.god = !!on; },
      // run the game faster than real time (only while playing)
      step(seconds) { let n = Math.round(seconds / STEP); while (n-- > 0 && G.state === 'play') { update(G, STEP); G.particles.update(STEP); } },
      // drop a power-up / weapon capsule right in front of the ship
      give(kind) { powerups.push({ kind, x: ship.x + 60, y: ship.y, t: 0 }); },
      weapon(id, lv = 1) { equip(G, id); ship.weapon.lv = lv; },
      capsule(id) { capsules.push({ wid: id, x: ship.x + 70, y: ship.y, t: 0 }); },
      bulletsAt(x, y) { ebullets.push(makeBullet(x, y, -K.bulletSpeed, 0)); },
      // hurt whatever boss is on screen (to test boss flow quickly)
      hurtBoss(n) { if (boss) hurtBoss(G, n); else if (chim) hurtChimera(G, n); },
      // test bot helpers
      nudge(dx, dy) { ship.x = math.clamp(ship.x + dx, SHIP_MIN_X, SHIP_MAX_X); ship.y = math.clamp(ship.y + dy, SHIP_MIN_Y, SHIP_MAX_Y); },
      weapons() { return SPECIALS.map(w => w.id); },
      clear() { enemies = []; ebullets = []; capsules = []; powerups = []; shots = []; },
      rock() { const e = { type: 'rock', x: ship.x + 260, y: ship.y, y0: ship.y, r: 34, hp: 12, max: 12, vx: 0, rot: 0, t: 0, flash: 0, phase: 0, slow: 0, test: true }; enemies.push(e); },
      rockHp() { const e = enemies.find(x => x.test); return e ? Math.max(0, e.hp) : 0; },
      skipToPart2() { checkpoint = 1; boss = null; startPart(G, 2); },
      bonk() { ship.inv = 0; ship.shield = 0; hitShip(G); },
      ship: () => ship,
      // positions, so a test bot can aim and dodge
      peek() {
        return { enemies: enemies.map(e => [e.x, e.y, e.type]), bullets: ebullets.map(b => [b.x, b.y, b.vx, b.vy]),
                 boss: boss ? [boss.x, boss.y, boss.mode, boss.atk, boss.beamY, boss.chargeY] : null,
                 target: chim ? chimHit() : boss ? { x: boss.x, y: boss.y, r: boss.r } : null,
                 capsules: capsules.map(c => [c.x, c.y]), powerups: powerups.map(p => [p.x, p.y]) };
      },
    };
  }

  // ---------------------------------------------------------------
  // Background: three layers of stars + slow planets (parallax),
  // plus each place's own layer (moon floor, snow, lava, crystals...)
  // ---------------------------------------------------------------
  function makeBackground() {
    stars = [];
    const layers = [[45, 20, 1.5], [30, 55, 2.5], [16, 120, 3.5]]; // count, speed, size
    for (const [n, sp, sz] of layers) for (let i = 0; i < n; i++) {
      stars.push({ x: Math.random() * W, y: Math.random() * H, sp, sz, tw: Math.random() * 6 });
    }
    planets = theme.planets.map(([color, kind, r], i) => ({ color, kind, r, r0: r, x: 300 + i * 340 + Math.random() * 100, y: 110 + i * 150 + Math.random() * 40, sp: 6 + i * 8 }));
  }
  function setTheme(name) {
    theme = THEMES[name];
    document.body.style.setProperty('--ar-bg', theme.bg);
    makeBackground();
  }

  function mult() { return Math.min(5, 1 + Math.floor(combo / 4)); }
  function popup(text, x, y, color = '#ffd166', size = 26) { popups.push({ text, x, y, t: 0, color, size }); }

  // ---------------------------------------------------------------
  // Waves: each part of a sector is a few waves, made from the sector's
  // enemy pool. A seeded random picker means a sector is the same every time.
  // ---------------------------------------------------------------
  function makeWaves(nWaves, tier, pool, seed) {
    const R = math.seeded(seed);
    const pick = () => pool[Math.floor(R() * pool.length)];
    const list = [];
    for (let w = 0; w < nWaves; w++) {
      const groupsN = 2 + (tier >= 5 && w % 2 ? 1 : 0);
      const wave = [];
      for (let k = 0; k < groupsN; k++) {
        const type = pick(), at = k * 3.2;
        const grow = Math.floor(tier / 3);
        if (type === 'squad') wave.push({ at, type, rows: 2 + (tier >= 6 && R() < 0.5 ? 1 : 0), cols: 3 + Math.min(2, Math.floor(tier / 4)) });
        else if (type === 'rock' || type === 'splitter') wave.push({ at, type, n: 1 + Math.min(2, Math.floor(tier / 4)), gap: 2 });
        else if (type === 'shooter' || type === 'orbiter') wave.push({ at, type, n: 1 + Math.min(2, Math.floor(tier / 3)), gap: 2 });
        else wave.push({ at, type, n: 4 + Math.min(4, grow), gap: type === 'zigzag' ? 0.7 : 0.6, y: R() < 0.5 ? 'rand' : Math.round(120 + R() * (H - 240)) });
      }
      // the friendly gift saucer visits in the 2nd wave of each part
      if (w === 1) wave.push({ at: 1.5, type: 'gift', n: 1 });
      list.push(wave);
    }
    return list;
  }
  function startPart(g, p) {
    part = p;
    const idx = SECTORS.findIndex(s => s.id === sector.id);
    if (sector.endless) {
      const tier = Math.min(10, 2 + endlessLoop * 2 + (p - 1));
      const pool = ['bobber', 'squad', 'diver', 'shooter', 'rock', 'zigzag', 'splitter', 'orbiter'].slice(0, 4 + Math.min(4, endlessLoop * 2));
      waveList = makeWaves(3, tier, pool, 900 + endlessLoop * 10 + p);
    } else waveList = makeWaves(sector.waves[p - 1], sector.tier, sector.pool, (idx + 1) * 100 + p);
    phase = 'waves'; phaseT = 0;
    startWave(0);
  }
  function startWave(i) {
    waveIdx = i;
    waveT = 0;
    spawnQueue = [];
    for (const grp of waveList[i]) {
      if (grp.type === 'squad') {
        const cols = Math.max(2, Math.round(grp.cols * K.count));
        spawnQueue.push({ t: grp.at, type: 'squad', rows: grp.rows, cols });
        continue;
      }
      const n = grp.type === 'gift' ? 1 : Math.max(1, Math.round((grp.n || 1) * K.count));
      const y0 = grp.y === 'rand' || grp.y == null ? null : grp.y;
      for (let k = 0; k < n; k++) spawnQueue.push({ t: grp.at + k * (grp.gap || 1) / K.speed, type: grp.type, y: y0, k });
    }
    spawnQueue.sort((a, b) => a.t - b.t);
    waveLen = (spawnQueue.length ? spawnQueue[spawnQueue.length - 1].t : 0) + 6;   // (see updateFlow)
    banner = { text: 'Wave ' + (i + 1), sub: '', t: 1.2 };
    G.sfx('beep');
  }

  function spawn(ev) {
    const sp = K.speed;
    const col = theme.enemy;
    const base = { t: 0, flash: 0, phase: Math.random() * 6, slow: 0 };
    if (ev.type === 'squad') {
      // A formation: all members follow one shared "group" point
      const grp = { x: W + 80, y: math.clamp(H / 2 + math.rand(-60, 60), 150, H - 150), dir: 1, t: 0, targetX: W - 160 - ev.cols * 30 };
      groups.push(grp);
      for (let r = 0; r < ev.rows; r++) for (let c = 0; c < ev.cols; c++) {
        const e = Object.assign({}, base, { type: 'squad', grp, dx: c * 62, dy: (r - (ev.rows - 1) / 2) * 62, r: 22, hp: 1 + K.hp, color: col[(r + c) % 3] });
        e.x = grp.x + e.dx; e.y = grp.y + e.dy; e.max = e.hp;
        addEnemy(e);
      }
      return;
    }
    let e;
    const y = ev.y != null ? ev.y : math.rand(90, H - 70);
    switch (ev.type) {
      case 'bobber':
        e = { type: 'bobber', x: W + 40, y0: y, y, r: 23, hp: 1, vx: -120 * sp, amp: 55, color: col[0] }; break;
      case 'diver': {
        const top = (ev.k % 2) === 0;
        e = { type: 'diver', x: W + 40, y: top ? 70 : H - 60, r: 24, hp: K.hp ? 2 : 1, vx: -150 * sp, vy: 0, swoop: false, color: col[2] }; break;
      }
      case 'rock':
        e = { type: 'rock', x: W + 50, y: ev.y != null ? ev.y + (ev.k % 2 ? 90 : -40) : y, y0: 0, r: 34, hp: G.pick(4, 6, 8) + Math.floor(K.tier / 4), vx: -55 * sp, rot: 0,
              bumps: Array.from({ length: 9 }, () => 0.85 + Math.random() * 0.25) };
        e.y = math.clamp(e.y, 90, H - 80); e.y0 = e.y; break;
      case 'shooter':
        e = { type: 'shooter', x: W + 40, y: math.clamp(y, 100, H - 90), y0: 0, r: 24, hp: G.pick(2, 3, 4), stopX: W - 110 - Math.random() * 160,
              stay: 7, fireT: 1.2, puff: 0, color: col[1] };
        e.y0 = e.y; break;
      case 'zigzag':
        e = { type: 'zigzag', x: W + 40, y: math.clamp(y, 90, H - 90), r: 22, hp: 1 + (K.hp ? 1 : 0), vx: -160 * sp, vy: (ev.k % 2 ? 1 : -1) * 170 * sp, color: col[0] }; break;
      case 'splitter':
        e = { type: 'splitter', x: W + 50, y0: math.clamp(y, 110, H - 110), y: 0, r: 30, hp: G.pick(3, 4, 5), vx: -70 * sp, color: col[2] };
        e.y = e.y0; break;
      case 'orbiter':
        e = { type: 'orbiter', x: W + 50, cx: W - 140 - Math.random() * 200, cy: math.clamp(y, 140, H - 140), r: 24, hp: G.pick(2, 3, 4), oa: 0, stay: 6, fireT: 1.5, color: col[1] };
        e.y = e.cy; break;
      case 'gift':
        e = { type: 'gift', x: W + 40, y0: math.rand(120, H - 140), y: 0, r: 30, hp: 2, vx: -95, color: '#06d6a0', friendly: true };
        e.y = e.y0; break;
      default: return;
    }
    Object.assign(e, base, { max: e.hp });
    addEnemy(e);
  }
  function addEnemy(e) { enemies.push(e); potential += POINTS[e.type] || 0; }

  // ---------------------------------------------------------------
  // Update (dt = 1/120 s)
  // ---------------------------------------------------------------
  function update(g, dt) {
    clock += dt;
    ART.tick(clock);

    // background drifts left
    for (const s of stars) { s.x -= s.sp * dt; if (s.x < -4) { s.x = W + 4; s.y = Math.random() * H; } }
    for (const p of planets) {
      if (p.eaten) continue;
      if (p.pull) { p.x += (p.pull.x - p.x) * dt * 1.4; p.y += (p.pull.y - p.y) * dt * 1.4; p.r *= 1 - dt * 0.8; if (p.r < 4) p.eaten = true; continue; }
      p.x -= p.sp * dt; if (p.x < -p.r * 3) { p.x = W + p.r * 3 + Math.random() * 300; p.y = 80 + Math.random() * (H - 160); }
    }
    if (shake > 0) shake = Math.max(0, shake - dt);

    if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
    for (const p of popups) { p.t += dt; p.y -= 40 * dt; }
    popups = popups.filter(p => p.t < 1.0);

    updateShip(g, dt);
    updateWeapon(g, dt);
    updateShots(g, dt);
    updateFlow(g, dt);
    updateEnemies(g, dt);
    if (boss) updateBoss(g, dt);
    if (chim) updateChimera(g, dt);
    updateBullets(g, dt);
    updatePickups(g, dt);
    updateFx(dt);

    // combo slowly runs out if you stop bubbling things
    if (combo > 0) { comboT -= dt; if (comboT <= 0) combo = 0; }
  }

  // ---- the player's ship ----
  function updateShip(g, dt) {
    const s = ship;
    const inp = g.input;
    const fast = s.speed > 0 ? 1.5 : 1;
    let mx = 0, my = 0;
    if (!finished) {
      if (inp.down('ArrowLeft', 'KeyA')) mx -= 1;
      if (inp.down('ArrowRight', 'KeyD')) mx += 1;
      if (inp.down('ArrowUp', 'KeyW')) my -= 1;
      if (inp.down('ArrowDown', 'KeyS')) my += 1;
    }
    const p = inp.pointer;
    if (!finished && p.down) {
      // Relative drag: the ship moves the same way your finger moves,
      // so your finger never covers it.
      if (p.justDown || s.dragX === null) { s.dragX = p.x; s.dragY = p.y; s.px = s.x; s.py = s.y; }
      const tx = math.clamp(s.px + (p.x - s.dragX) * 1.3, SHIP_MIN_X, SHIP_MAX_X);
      const ty = math.clamp(s.py + (p.y - s.dragY) * 1.3, SHIP_MIN_Y, SHIP_MAX_Y);
      const max = 900 * fast * dt;
      const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy);
      const k = d > max ? max / d : 1;
      s.vx = dx * k / dt; s.vy = dy * k / dt;
      s.x += dx * k; s.y += dy * k;
      if (tx !== s.px + (p.x - s.dragX) * 1.3 || ty !== s.py + (p.y - s.dragY) * 1.3) { s.dragX = p.x; s.dragY = p.y; s.px = tx; s.py = ty; }
    } else {
      s.dragX = null;
      const sp = 340 * fast;
      const len = Math.hypot(mx, my) || 1;
      // smooth start/stop so it feels floaty, like space
      s.vx += ((mx / len) * sp - s.vx) * Math.min(1, dt * 14);
      s.vy += ((my / len) * sp - s.vy) * Math.min(1, dt * 14);
      s.x += s.vx * dt; s.y += s.vy * dt;
    }
    // the Chimera's big "devour" breath pulls you toward its mouth: fly away!
    if (chim && chim.suck > 0 && !finished) s.x += chim.suck * dt;
    s.x = math.clamp(s.x, SHIP_MIN_X, SHIP_MAX_X);
    s.y = math.clamp(s.y, SHIP_MIN_Y, SHIP_MAX_Y);
    s.tilt += (math.clamp(s.vy / 900, -0.25, 0.25) - s.tilt) * Math.min(1, dt * 10);

    for (const k of ['shield', 'speed']) if (s[k] > 0) s[k] = Math.max(0, s[k] - dt);
    if (s.inv > 0) s.inv -= dt;
    if (s.bonk > 0) s.bonk -= dt;
  }

  // ---------------------------------------------------------------
  // Weapons: firing, and the things some weapons do all the time
  // ---------------------------------------------------------------
  function wantFire(g) {
    const inp = g.input;
    return !finished && phase !== 'intro' && phase !== 'chimeraIntro' && (inp.down('Space', 'KeyJ', 'KeyX') || autoFire(g) || inp.pointer.down);
  }
  function shoot(o) {
    shots.push(Object.assign({ x: ship.x + 34, y: ship.y, vx: 720, vy: 0, r: 9, dmg: 1, pierce: 0, kind: 'bubble', life: 2, t: 0 }, o));
  }
  function updateWeapon(g, dt) {
    const w = WEAPON[ship.weapon.id], lv = ship.weapon.lv;
    const firing = wantFire(g);
    fireCD -= dt;
    beamOn = firing && !!w.beam;
    if (firing && w.fire && fireCD <= 0) {
      fireCD = w.gap[lv - 1];
      w.fire(lv);
      g.tone(980 + Math.random() * 120, 0.05, { type: 'sine', slide: 600, vol: 0.06 });
    }
    if (beamOn && Math.random() < dt * 30) g.tone(500 + Math.random() * 600, 0.05, { type: 'triangle', vol: 0.04 });
    // Lightning Zap: every so often, a bolt jumps to the nearest enemy and on to the next ones
    if (w.zap && firing) {
      zapT -= dt;
      if (zapT <= 0) { zapT = w.every[lv - 1]; zap(g, w.chain[lv - 1]); }
    }
    // Ring Pulse: rings of light ripple out from the ship
    if (w.pulse && firing) {
      pulseT -= dt;
      if (pulseT <= 0) { pulseT = w.pulse[lv - 1]; rings.push({ x: ship.x, y: ship.y, r: 20, max: w.reach[lv - 1], hit: new Set(), dmg: [3.5, 4, 4.5][lv - 1] }); }
    }
    // Drone Buddies: little helper drones fly beside you and shoot too
    const nD = w.drones ? w.drones[lv - 1] : 0;
    while (drones.length < nD) drones.push({ x: ship.x, y: ship.y, cd: Math.random() * 0.2 });
    drones.length = nD;
    drones.forEach((d, i) => {
      const spot = [[-10, -54], [-10, 54], [-46, 0]][i];
      d.x += (ship.x + spot[0] - d.x) * Math.min(1, dt * 8); d.y += (ship.y + spot[1] - d.y) * Math.min(1, dt * 8);
      d.cd -= dt;
      if (firing && d.cd <= 0) { d.cd = w.droneGap[lv - 1]; shots.push({ x: d.x + 16, y: d.y, vx: 700, vy: 0, r: 7, dmg: 0.8, pierce: 0, kind: 'bubble', life: 2, t: 0 }); }
    });
  }
  // Star Spinner: stars that circle the ship (they hit enemies and block bubbles)
  function orbitStars() {
    const w = WEAPON[ship.weapon.id];
    if (!w.stars) return [];
    const n = w.stars[ship.weapon.lv - 1];
    return Array.from({ length: n }, (_, i) => { const a = clock * 4 + i * Math.PI * 2 / n; return { x: ship.x + Math.cos(a) * 58, y: ship.y + Math.sin(a) * 58 }; });
  }
  function zap(g, chain) {
    // first target: the nearest thing in front of the ship
    const targets = enemies.filter(e => !e.dead && e.x > ship.x - 20);
    let from = { x: ship.x + 30, y: ship.y }, hits = 0;
    const path = [from];
    let cur = null, best = 470;
    for (const e of targets) { const d = math.dist(from.x, from.y, e.x, e.y); if (d < best) { best = d; cur = e; } }
    const bossT = boss && boss.hp > 0 && boss.mode !== 'enter' ? boss : null;
    const chimT = chim && !chim.beaten && chim.fighting ? chimHit() : null;
    if (!cur && (bossT || chimT)) {
      const t = bossT || chimT;
      if (math.dist(from.x, from.y, t.x, t.y) < 640) { path.push({ x: t.x, y: t.y }); bossT ? hurtBoss(g, 2.6) : hurtChimera(g, 2.6); hits++; }
    }
    const done = new Set();
    while (cur && hits <= chain) {
      done.add(cur); path.push({ x: cur.x, y: cur.y });
      hurtEnemy(g, cur, 1.8); hits++;
      const last = cur; cur = null; let bd = 180;
      for (const e of targets) { if (done.has(e) || e.dead) continue; const d = math.dist(last.x, last.y, e.x, e.y); if (d < bd) { bd = d; cur = e; } }
    }
    if (path.length > 1) { bolts.push({ path, t: 0 }); g.tone(1400, 0.06, { type: 'square', slide: 300, vol: 0.05 }); }
  }
  function equip(g, id) {
    const w = ship.weapon;
    if (w.id === id) {
      if (w.lv < 3) { w.lv++; popup('Level ' + w.lv + '!', ship.x, ship.y - 76, '#ffd166', 30); g.sfx('unlock'); if (w.lv === 3) g.achieve('maxed'); }
      else { score += 500; popup('+500', ship.x, ship.y - 76, '#ffd166', 26); g.sfx('coin'); }
    } else {
      ship.weapon = { id, lv: 1 };
      g.sfx('power');
    }
    banner = { text: WEAPON[id].name + '!', sub: ship.weapon.lv > 1 ? 'Power level ' + ship.weapon.lv : '', t: 1.6, small: true, color: WEAPON[id].color };
    const f = found(g);
    if (id !== 'bubble' && !f.includes(id)) {
      f.push(id); g.store();
      popup('New weapon!', ship.x, ship.y - 110, '#06d6a0', 26);
      if (f.length >= 10) g.achieve('arsenal10');
      if (f.length >= SPECIALS.length) g.achieve('arsenal');
    }
    fireCD = 0; pulseT = 0; zapT = 0;
  }
  // which weapon a capsule holds: one from this sector's list, often a new one for the book
  function pickWeapon(g) {
    const n = Math.min(SPECIALS.length, sector.weapons || 20);
    const pool = SPECIALS.slice(0, n);
    const f = found(g);
    const fresh = pool.filter(w => !f.includes(w.id));
    const cur = ship.weapon;
    if (cur.id !== 'bubble' && cur.lv < 3 && Math.random() < 0.3) return cur.id;          // a power-up for your gun
    if (fresh.length && Math.random() < 0.65) return fresh[Math.floor(Math.random() * fresh.length)].id;
    const others = pool.filter(w => w.id !== cur.id);
    return others[Math.floor(Math.random() * others.length)].id;
  }
  function dropCapsule(g, x, y) { capsules.push({ wid: pickWeapon(g), x: Math.min(x, W - 60), y: math.clamp(y, 70, H - 60), t: 0 }); }

  // ---- all the player's shots ----
  function updateShots(g, dt) {
    const bossT = boss && boss.hp > 0 && boss.mode !== 'enter' && boss.mode !== 'defeated' ? boss : null;
    const ch = chim && chim.fighting && !chim.beaten ? chimHit() : null;
    for (const b of shots) {
      b.t += dt;
      if (b.accel) b.vx = Math.min(900, b.vx + b.accel * dt);
      if (b.home) {                      // turn toward the nearest enemy (or boss)
        let tx = null, ty = null, bd = 1e9;
        for (const e of enemies) { if (e.dead || e.friendly) continue; const d = math.dist(b.x, b.y, e.x, e.y); if (d < bd) { bd = d; tx = e.x; ty = e.y; } }
        if (tx === null && (bossT || ch)) { const t = bossT || ch; tx = t.x; ty = t.y; }
        if (tx !== null) {
          const sp = Math.hypot(b.vx, b.vy), a = Math.atan2(b.vy, b.vx), want = Math.atan2(ty - b.y, tx - b.x);
          const na = a + math.clamp(math.angleDiff(a, want), -b.home * dt, b.home * dt);
          b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp;
        }
      }
      if (b.back) {                      // boomerang: slows down, turns round, comes home
        b.vx -= 760 * dt;                // (goes about 600 px, then comes back)
        if (b.vx < 0 && !b.turned) { b.turned = true; b.hit = null; }
        if (b.turned) { const a = Math.atan2(ship.y - b.y, ship.x - b.x); b.vy += (Math.sin(a) * 600 - b.vy) * Math.min(1, dt * 5); if (math.dist(b.x, b.y, ship.x, ship.y) < 30) b.gone = true; }
      }
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.bounce && (b.y < 20 || b.y > H - 20)) { b.vy = -b.vy; b.y = math.clamp(b.y, 20, H - 20); }
      if (b.grow) b.r = 16 + (b.grow - 16) * Math.min(1, b.t / 0.8);
    }
    shots = shots.filter(b => {
      if (b.gone || b.t > b.life || b.x > W + 40 || b.x < -40 || b.y < -40 || b.y > H + 40) return false;
      const by = b.wave ? b.y + Math.sin(b.t * 10 + b.wave.ph) * b.wave.amp * Math.min(1, b.t * 4) : b.y;
      b.dy = by;
      for (const e of enemies) {
        if (e.dead || (b.hit && b.hit.has(e))) continue;
        if (math.dist(b.x, by, e.x, e.y) < e.r + b.r) {
          hitWith(g, b, e);
          if (b.pierce <= 0) return false;
          b.pierce--; (b.hit = b.hit || new Set()).add(e);
        }
      }
      if (bossT && !(b.hit && b.hit.has(bossT)) && hitsBoss(b.x, by, b.r)) {
        hurtBoss(g, b.dmg); if (b.splash) explode(g, b);
        if (b.slow) bossT.slow = 0.6;
        if (b.pierce <= 0) return false; b.pierce = Math.max(0, b.pierce - 3); (b.hit = b.hit || new Set()).add(bossT);
      }
      if (ch && !(b.hit && b.hit.has(chim)) && math.dist(b.x, by, ch.x, ch.y) < ch.r + b.r) {
        hurtChimera(g, b.dmg); if (b.splash) explode(g, b);
        if (b.pierce <= 0) return false; b.pierce = Math.max(0, b.pierce - 3); (b.hit = b.hit || new Set()).add(chim);
      }
      return true;
    });
    // Rainbow Beam
    if (beamOn) {
      const w = WEAPON.beam, lv = ship.weapon.lv, dps = w.dps[lv - 1], half = w.width[lv - 1];
      for (const e of enemies) if (!e.dead && e.x > ship.x && Math.abs(e.y - ship.y) < e.r + half) hurtEnemy(g, e, dps * dt);
      if (bossT && Math.abs(bossT.y - ship.y) < bossT.r) hurtBoss(g, dps * dt);
      if (ch && Math.abs(ch.y - ship.y) < ch.r + half) hurtChimera(g, dps * dt);
    }
    // Star Spinner stars
    for (const st of orbitStars()) {
      for (const e of enemies) if (!e.dead && math.dist(st.x, st.y, e.x, e.y) < e.r + 12) hurtEnemy(g, e, 16 * dt);
      for (const b of ebullets) if (math.dist(st.x, st.y, b.x, b.y) < b.r + 12) { b.gone = true; popBullet(b); }
      if (bossT && hitsBoss(st.x, st.y, 12)) hurtBoss(g, 10 * dt);
      if (ch && math.dist(st.x, st.y, ch.x, ch.y) < ch.r + 12) hurtChimera(g, 10 * dt);
    }
    // Ring Pulse rings
    for (const rg of rings) {
      rg.r += 420 * dt;
      for (const e of enemies) if (!e.dead && !rg.hit.has(e) && Math.abs(math.dist(rg.x, rg.y, e.x, e.y) - rg.r) < e.r + 6) { rg.hit.add(e); hurtEnemy(g, e, rg.dmg); }
      for (const b of ebullets) if (Math.abs(math.dist(rg.x, rg.y, b.x, b.y) - rg.r) < b.r + 4) { b.gone = true; popBullet(b); }
      if (bossT && !rg.hit.has(bossT) && Math.abs(math.dist(rg.x, rg.y, bossT.x, bossT.y) - rg.r) < bossT.r) { rg.hit.add(bossT); hurtBoss(g, rg.dmg); }
      if (ch && !rg.hit.has(chim) && Math.abs(math.dist(rg.x, rg.y, ch.x, ch.y) - rg.r) < ch.r) { rg.hit.add(chim); hurtChimera(g, rg.dmg); }
    }
    rings = rings.filter(rg => rg.r < rg.max);
    for (const bo of bolts) bo.t += dt;
    bolts = bolts.filter(bo => bo.t < 0.14);
  }
  function hitWith(g, b, e) {
    if (e.friendly) { hurtEnemy(g, e, 1); return; }
    hurtEnemy(g, e, b.dmg);
    if (b.slow) e.slow = b.slow;
    if (b.splash) explode(g, b, e);
  }
  // Rocket Pops: a pop of sparkles that also bubbles things close by
  function explode(g, b, skip) {
    for (const e of enemies) if (!e.dead && e !== skip && !e.friendly && math.dist(b.x, b.y, e.x, e.y) < b.splash + e.r) hurtEnemy(g, e, 1.4);
    if (!skip && boss) hurtBoss(g, 0.8); else if (!skip && chim) hurtChimera(g, 0.8);     // a bit extra on bosses
    g.particles.burst(b.x, b.y, { count: 14, shape: 'star', gravity: 0, speed: 240, size: 11, life: 0.4, colors: ['#ffd166', '#ff8c42', '#fff'] });
    rings.push({ x: b.x, y: b.y, r: 10, max: b.splash, hit: new Set(enemies), dmg: 0, fx: true });
    b.splash = 0;
  }
  function popBullet(b) { if (G.particles.list.length < 260) G.particles.burst(b.x, b.y, { count: 4, gravity: 0, speed: 90, size: 7, life: 0.3, colors: ['#fff', '#bde0fe'] }); }

  function hurtEnemy(g, e, dmg) {
    e.hp -= dmg;
    e.flash = 0.08;
    if (e.hp <= 0 && !e.dead) {
      e.dead = true;
      if (e.friendly) {                   // the gift saucer opens its present
        dropCapsule(g, e.x, e.y + 20);
        popup('A present!', e.x, e.y - 40, '#06d6a0', 26);
        g.sfx('unlock');
        floaters.push({ e, t: 0 });
        return;
      }
      defeated++;
      combo++; comboT = 2.2; bestCombo = Math.max(bestCombo, combo); if (combo >= 20) g.achieve('combo20');
      const pts = (POINTS[e.type] || 100) * mult();
      score += pts;
      popup('+' + pts, e.x, e.y - 30, mult() > 1 ? '#ffd166' : '#ffffff', 22);
      if (combo > 0 && combo % 4 === 0 && mult() > 1) { popup('Combo x' + mult() + '!', e.x, e.y - 64, '#f15bb5', 28); g.sfx('coin'); }
      floaters.push({ e, t: 0 });
      g.sfx('pop');
      // a splitter pops into two little jellies
      if (e.type === 'splitter' && !e.small) for (const s of [-1, 1]) {
        const k = { type: 'bobber', x: e.x, y0: math.clamp(e.y + s * 36, 70, H - 70), r: 20, hp: 1, vx: -150 * K.speed, amp: 30, color: e.color, t: 0, flash: 0, phase: s, slow: 0, max: 1, small: true };
        k.y = k.y0; addEnemy(k);
      }
      maybeDrop(e);
    } else if (dmg >= 1) {
      g.tone(e.type === 'rock' ? 220 : 520, 0.05, { type: 'triangle', vol: 0.12 });
    }
  }

  // A defeated enemy sometimes leaves a power-up (and very rarely a weapon).
  // Rocks drop more often, and if nothing dropped for a while, the next one always does.
  function maybeDrop(e) {
    sinceDrop++;
    if (Math.random() < 0.035) { dropCapsule(G, e.x, e.y); return; }
    const chance = e.type === 'rock' ? 0.45 : K.drop;
    if (Math.random() < chance || sinceDrop >= 14) {
      sinceDrop = 0;
      const lifeOk = lives < startLives + 2;
      const bag = ['shield', 'speed', 'shield'].concat(lifeOk && Math.random() < 0.4 ? ['life'] : []);
      powerups.push({ kind: bag[(Math.random() * bag.length) | 0], x: e.x, y: e.y, t: 0 });
    }
  }

  // ---------------------------------------------------------------
  // What happens next:
  //   intro -> waves (part 1) -> mini boss -> waves (part 2) -> big boss -> clear
  // ---------------------------------------------------------------
  function updateFlow(g, dt) {
    if (phase === 'intro') {
      phaseT -= dt;
      if (phaseT <= 0) startPart(g, part);
      return;
    }
    if (phase === 'waves') {
      waveT += dt;
      // spawn whatever is due, but never more than the cap at once
      while (spawnQueue.length && spawnQueue[0].t <= waveT && enemies.length < K.maxEnemies) spawn(spawnQueue.shift());
      if (spawnQueue.length && enemies.length >= K.maxEnemies) for (const ev of spawnQueue) ev.t += dt; // wait
      const busy = enemies.some(e => !e.friendly);
      // next wave when everyone's bubbled (or flown home) - or, so it never drags on,
      // a few seconds after the last one arrived (stragglers just keep flying)
      const late = !spawnQueue.length && waveT > waveLen + (waveIdx + 1 >= waveList.length ? 6 : 0);
      if ((!spawnQueue.length && !busy) || late) {
        phaseT = (phaseT || 0) + dt;
        if (phaseT > 0.9 || late) {
          phaseT = 0;
          if (waveIdx + 1 < waveList.length) startWave(waveIdx + 1);
          else if (part === 1) startBoss(g, 'mini');
          else startBoss(g, 'big');
        }
      } else phaseT = 0;
      return;
    }
    if (phase === 'bossWarn') {
      phaseT -= dt;
      if (phaseT <= 0) phase = 'boss';
      return;
    }
    if (phase === 'breather') {       // a little rest after the mini boss
      phaseT -= dt;
      if (phaseT <= 0) { boss = null; startPart(g, 2); }
      return;
    }
    if (phase === 'clear') {
      phaseT -= dt;
      if (phaseT <= 0 && !finished) winSector(g);
    }
  }

  // ---- enemies move ----
  function updateEnemies(g, dt) {
    const s = ship;
    for (const grp of groups) {
      grp.t += dt;
      if (grp.x > grp.targetX && grp.t < 11) grp.x -= 160 * K.speed * dt;     // fly in
      else if (grp.t < 11) {
        grp.x -= 10 * dt;                                                   // creep closer
        grp.y += grp.dir * 70 * K.speed * dt;                               // sweep up and down
        if (grp.y < 130) grp.dir = 1;
        if (grp.y > H - 130) grp.dir = -1;
      } else grp.x -= 180 * K.speed * dt;                                   // time to leave
    }
    groups = groups.filter(grp => enemies.some(e => e.grp === grp));

    for (const e of enemies) {
      // frozen (Snowflake Freezer) enemies move at half speed
      if (e.slow > 0) e.slow -= dt;
      const edt = e.slow > 0 ? dt * 0.45 : dt;
      e.t += edt;
      if (e.flash > 0) e.flash -= dt;
      switch (e.type) {
        case 'bobber':
          e.x += e.vx * edt;
          e.y = e.y0 + Math.sin(e.t * 2.6 + e.phase) * e.amp;
          break;
        case 'squad':
          e.x = e.grp.x + e.dx + Math.sin(e.t * 3 + e.dy) * 4;
          e.y = e.grp.y + e.dy;
          break;
        case 'diver':
          // fly in along the edge, then swoop toward where the ship was
          e.x += e.vx * edt;
          if (!e.swoop && (e.x < W - 160 || e.t > 1.6)) { e.swoop = true; e.ty = s.y; g.sfx('whoosh'); }
          if (e.swoop) {
            e.vy += (math.clamp((e.ty - e.y) * 2.2, -230, 230) - e.vy) * Math.min(1, edt * 3);
            e.vx = Math.max(-270 * K.speed, e.vx - 120 * edt);
          }
          e.y += e.vy * edt;
          break;
        case 'rock':
          e.x += e.vx * edt;
          e.y = e.y0 + Math.sin(e.t * 0.9 + e.phase) * 18;
          e.rot += edt * 0.6;
          break;
        case 'shooter': case 'orbiter':
          if (e.type === 'shooter') {
            e.y = e.y0 + Math.sin(e.t * 1.7 + e.phase) * 22;
            if (e.x > e.stopX && e.stay > 0) { e.x -= 150 * K.speed * edt; break; }
          } else {
            // orbiter: fly to its spot, then circle it
            if (e.x > e.cx + 70 && e.stay > 0) { e.x -= 170 * K.speed * edt; e.y = e.cy; break; }
            if (e.stay > 0) { e.oa += edt * 1.6; e.x = e.cx + Math.cos(e.oa) * 70; e.y = e.cy + Math.sin(e.oa) * 70; }
          }
          if (e.stay > 0) {
            e.stay -= edt;
            e.fireT -= edt;
            // puff up (the warning!), then blow a slow bubble at the ship
            e.puff = e.fireT < 0.55 ? 1 - e.fireT / 0.55 : 0;
            if (e.fireT <= 0) {
              e.fireT = K.fireGap * (e.type === 'orbiter' ? 1.3 : 1);
              if (ebullets.length < K.maxBullets) {
                const a = Math.atan2(s.y - e.y, s.x - e.x);
                const spread = e.type === 'orbiter' ? [-0.25, 0.25] : [0];
                for (const da of spread) ebullets.push(makeBullet(e.x - 20, e.y, Math.cos(a + da) * K.bulletSpeed, Math.sin(a + da) * K.bulletSpeed));
                g.tone(300, 0.12, { type: 'sine', slide: 500, vol: 0.15 });
              }
            }
          } else { e.puff = 0; e.x -= 140 * edt; if (e.y0 != null) e.y0 -= 60 * edt; else e.y -= 60 * edt; }
          break;
        case 'zigzag':
          e.x += e.vx * edt; e.y += e.vy * edt;
          if (e.y < 80 || e.y > H - 70) { e.vy = -e.vy; e.y = math.clamp(e.y, 80, H - 70); }
          break;
        case 'splitter':
          e.x += e.vx * edt; e.y = e.y0 + Math.sin(e.t * 1.4 + e.phase) * 40;
          break;
        case 'gift':
          e.x += e.vx * dt; e.y = e.y0 + Math.sin(e.t * 2) * 30;
          break;
      }
      // bump into the ship? (the gift saucer just hands over its present)
      if (!e.dead && math.dist(e.x, e.y, s.x, s.y) < e.r + SHIP_R) {
        if (e.friendly) hurtEnemy(g, e, 99);
        else if (hitShip(g) && e.type !== 'rock') hurtEnemy(g, e, 99);
      }
    }
    // gone off the left side = they just fly home (no penalty)
    enemies = enemies.filter(e => !e.dead && e.x > -80 && e.y > -100 && e.y < H + 100);
  }

  function makeBullet(x, y, vx, vy, kind = 'bubble') {
    return { x, y, vx, vy, r: K.bulletR, kind, t: 0, color: ['#ff5fa2', '#ff8c42', '#ffd166'][(Math.random() * 3) | 0] };
  }

  function updateBullets(g, dt) {
    const born = [];
    for (const b of ebullets) {
      b.t += dt;
      if (b.home && b.t < b.home) {          // homing orbs steer toward you for a while
        const sp = Math.hypot(b.vx, b.vy), a = Math.atan2(b.vy, b.vx), want = Math.atan2(ship.y - b.y, ship.x - b.x);
        const na = a + math.clamp(math.angleDiff(a, want), -1.6 * dt, 1.6 * dt);
        b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp;
      }
      if (b.fall) b.vy += b.fall * dt;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.bounce && (b.y < 20 || b.y > H - 20)) { b.vy = -b.vy; b.y = math.clamp(b.y, 20, H - 20); }
      if (b.burst && b.t > b.burst) {        // a big bubble that pops into a ring of little ones
        b.gone = true;
        const n = G.pick(6, 8, 10);
        for (let i = 0; i < n; i++) { const a = i * Math.PI * 2 / n; born.push(makeBullet(b.x, b.y, Math.cos(a) * K.bulletSpeed * 0.8, Math.sin(a) * K.bulletSpeed * 0.8)); }
        g.sfx('pop');
      }
      if (math.dist(b.x, b.y, ship.x, ship.y) < b.r + SHIP_R - 3 && hitShip(g)) b.gone = true;
    }
    ebullets = ebullets.filter(b => !b.gone && b.x > -30 && b.x < W + 40 && b.y > -60 && b.y < H + 30 && b.t < (b.life || 12)).concat(born);
  }

  function updatePickups(g, dt) {
    for (const p of powerups.concat(capsules)) {
      p.t += dt;
      if (!p.stay) p.x -= (p.wid ? 45 : 60) * dt;     // (the Chimera's weapon choices wait for you)
      p.y += Math.sin(p.t * 3) * 20 * dt;
      // gentle magnet so little kids can grab them
      const d = math.dist(p.x, p.y, ship.x, ship.y);
      if (d < 120) { p.x += (ship.x - p.x) * dt * 3; p.y += (ship.y - p.y) * dt * 3; }
      if (d < 42) { p.got = true; if (p.wid) grabCapsule(g, p); else collect(g, p); }
    }
    powerups = powerups.filter(p => !p.got && p.x > -30);
    capsules = capsules.filter(p => !p.got && p.x > -30);
  }
  function grabCapsule(g, p) {
    equip(g, p.wid);
    score += 250;
    g.particles.burst(p.x, p.y, { count: 18, shape: 'star', gravity: 0, speed: 200, size: 13, life: 0.6, colors: [WEAPON[p.wid].color, '#fff', '#ffd166'] });
  }

  function collect(g, p) {
    const s = ship;
    if (p.kind === 'life') { g.achieve('life'); lives++; popup('+1 life!', s.x, s.y - 50, '#ef476f', 30); g.sfx('star'); }
    else {
      s[p.kind] = POWERS[p.kind].time;
      popup({ shield: 'Shield!', speed: 'Zoom!' }[p.kind], s.x, s.y - 50, POWERS[p.kind].color, 30);
      g.sfx('power');
    }
    score += 250;
    g.particles.burst(p.x, p.y, { count: 12, shape: 'star', gravity: 0, speed: 160, size: 12, life: 0.5, colors: [POWERS[p.kind].color, '#fff', '#ffd166'] });
  }

  // The ship got touched. Returns true if it counted.
  function hitShip(g) {
    const s = ship;
    if (s.inv > 0 || finished || test.god) return false;
    if (s.shield > 0) {
      s.shield = 0; s.inv = 1.0;
      g.sfx('pop'); popup('Pop!', s.x, s.y - 40, '#8ecae6');
      g.particles.burst(s.x, s.y, { count: 14, gravity: 0, speed: 200, colors: ['#8ecae6', '#fff'], size: 10, life: 0.5 });
      return true;
    }
    lives--; hitsTaken++;
    s.inv = 2.0; s.bonk = 0.5;
    combo = 0;
    g.sfx('bonk');
    g.particles.burst(s.x, s.y, { count: 10, shape: 'star', gravity: 0, speed: 150, colors: ['#ffd166', '#fff'], size: 12, life: 0.6 });
    // be kind: clear enemy bubbles close to the ship
    for (const b of ebullets) if (math.dist(b.x, b.y, s.x, s.y) < 180) b.gone = true;
    if (lives <= 0) loseGame(g);
    return true;
  }

  function updateFx(dt) {
    for (const f of floaters) { f.t += dt; f.e.y -= 70 * dt; f.e.x += 20 * dt; }
    floaters = floaters.filter(f => {
      if (f.t < 0.5) return true;
      // pop into sparkles and hearts
      if (G.particles.list.length < 260) G.particles.burst(f.e.x, f.e.y, { count: 10, shape: 'star', gravity: 0, speed: 170, size: 11, life: 0.5 });
      for (let i = 0; i < 3 && hearts.length < 45; i++) hearts.push({ x: f.e.x, y: f.e.y, vx: math.rand(-70, 70), vy: math.rand(-120, -40), t: 0, life: 0.9, c: ['#ef476f', '#f15bb5', '#ff8fab'][i] });
      return false;
    });
    for (const h of hearts) { h.t += dt; h.x += h.vx * dt; h.y += h.vy * dt; }
    hearts = hearts.filter(h => h.t < h.life);
  }

  // ---------------------------------------------------------------
  // Boss attacks. Every attack has:
  //   tele: seconds of warning before it happens
  //   dur:  how long the attack lasts
  //   prep / start / tick: what it does (b = the boss, o = where it shoots from)
  // Shared by the mini bosses, the big bosses and the Chimera.
  // ---------------------------------------------------------------
  const ATTACKS = {
    // a fan of bubbles toward the ship
    fan: { tele: 0.9, dur: 0.2, start(b, g) {
      const o = origin(b), n = g.pick(3, 5, 7) + (b.kind === 'big' && K.tier >= 6 ? 2 : 0);
      const a0 = Math.atan2(ship.y - o.y, ship.x - o.x);
      for (let i = 0; i < n; i++) bossShot(o.x - 30, o.y, a0 + (i - (n - 1) / 2) * 0.22, 1, 'star');
      g.sfx('zap');
    } },
    // three quick aimed puffs
    aim3: { tele: 0.8, dur: 1.0, start(b) { b.shotsLeft = 3; b.shotT = 0; },
      tick(b, g, dt) {
        b.shotT -= dt;
        if (b.shotsLeft > 0 && b.shotT <= 0) {
          const o = origin(b);
          b.shotT = 0.33; b.shotsLeft--;
          const a = Math.atan2(ship.y - o.y, ship.x - o.x);
          for (const da of g.pick([0], [-0.15, 0.15], [-0.2, 0, 0.2])) bossShot(o.x - 40, o.y + 10, a + da, 1.15, b.id === 'cookie' ? 'cookie' : 'bubble');
          g.sfx('shoot');
        }
      } },
    // a ring of bubbles all around
    ring: { tele: 1.0, dur: 0.2, start(b, g) {
      const o = origin(b), n = g.pick(8, 12, 16);
      const off = Math.random();
      for (let i = 0; i < n; i++) bossShot(o.x, o.y, off + i * Math.PI * 2 / n, 0.85, b.id === 'cookie' ? 'cookie' : 'bubble');
      g.sfx('pop');
    } },
    // a slowly turning spiral of stars
    spiral: { tele: 0.9, dur: 2.2, start(b) { b.spinA = Math.PI; b.shotT = 0; },
      tick(b, g, dt) {
        b.shotT -= dt;
        if (b.shotT <= 0) { const o = origin(b); b.shotT = g.pick(0.3, 0.2, 0.14); b.spinA += 0.55; bossShot(o.x, o.y, b.spinA, 0.9, b.chimera ? 'venom' : 'star'); bossShot(o.x, o.y, b.spinA + Math.PI, 0.9, b.chimera ? 'venom' : 'star'); }
      } },
    // a beam straight across: shown as a blinking stripe first
    beam: { tele: 1.4, dur: 1.0, prep(b) { b.beamY = math.clamp(ship.y, 70, H - 70); b.beamW = 26; },
      start(b, g) { g.sfx('zap'); },
      tick(b, g) { if (Math.abs(ship.y - b.beamY) < b.beamW + SHIP_R - 4) hitShip(g); } },
    // a few beams at once, with safe rows between them
    lasers: { tele: 1.5, dur: 0.9, prep(b) {
      const safe = math.clamp(ship.y + math.rand(-60, 60), 100, H - 100);
      b.beams = [];
      for (let y = 70; y < H - 40; y += 125) if (Math.abs(y - safe) > 90) b.beams.push(y);
      if (b.beams.length > 3) b.beams.length = 3;
      b.beamW = 22;
    },
      start(b, g) { g.sfx('zap'); },
      tick(b, g) { for (const y of b.beams) if (Math.abs(ship.y - y) < b.beamW + SHIP_R - 4) hitShip(g); } },
    // bounce across the screen at the ship's height, then come back
    charge: { tele: 1.1, dur: 2.4, prep(b) { b.chargeY = math.clamp(ship.y, 110, H - 110); },
      start(b, g) { g.sfx('boost'); },
      tick(b, g, dt, t) {
        b.y += (b.chargeY - b.y) * Math.min(1, dt * 8);
        if (t < 1.1) b.x -= 620 * dt;                       // whoosh left
        else b.x += (b.home - b.x) * Math.min(1, dt * 2.5); // drift back
        b.x = Math.max(110, b.x);
      } },
    // drop a few mini bobbers
    minions: { tele: 0.8, dur: 0.6, start(b, g) {
      const n = g.pick(2, 3, 4);
      for (let i = 0; i < n && enemies.length < K.maxEnemies; i++) {
        const e = { type: 'bobber', x: b.x - 40, y0: math.clamp(b.y + (i - (n - 1) / 2) * 90, 80, H - 80), r: 23, hp: 1, vx: -130 * K.speed, amp: 40, color: theme.enemy[i % 3], t: 0, flash: 0, phase: i, slow: 0 };
        e.y = e.y0; e.max = 1;
        addEnemy(e);
      }
      g.sfx('spring');
    } },
    // bubbles drop from the top in the marked columns
    rain: { tele: 1.1, dur: 1.2, prep(b) {
      const n = G.pick(3, 4, 5);
      b.cols = [];
      for (let i = 0; i < n; i++) b.cols.push(70 + (i + Math.random() * 0.6) * (SHIP_MAX_X + 40) / n);
      if (b.chimera) b.cols.push(math.clamp(ship.x + math.rand(-30, 30), 60, SHIP_MAX_X));
    },
      start(b) { b.shotT = 0; b.k = 0; },
      tick(b, g, dt) {
        b.shotT -= dt;
        if (b.shotT <= 0 && b.k < 3) {
          b.shotT = 0.35; b.k++;
          for (const x of b.cols) { const m = makeBullet(x, -20, 0, K.bulletSpeed * 1.2, b.chimera ? 'meteor' : 'bubble'); m.r += b.chimera ? 3 : 0; ebullets.push(m); }
          g.tone(700, 0.08, { type: 'sine', slide: 300, vol: 0.08 });
        }
      } },
    // a wall of bubbles with a gap to fly through
    wall: { tele: 0.9, dur: 0.3, prep(b) { b.gapY = math.rand(130, H - 130); },
      start(b, g) {
        for (let y = 30; y < H - 10; y += 44) if (Math.abs(y - b.gapY) > 80) ebullets.push(makeBullet(b.x - 60, y, -K.bulletSpeed * 0.9, 0));
        g.sfx('whoosh');
      } },
    // slow orbs that follow you for a bit
    homing: { tele: 0.9, dur: 0.6, start(b, g) {
      const o = origin(b), n = g.pick(2, 2, 3) + (b.chimera ? 1 : 0);
      for (let i = 0; i < n; i++) { const m = makeBullet(o.x - 30, o.y + (i - (n - 1) / 2) * 50, -K.bulletSpeed * 0.75, (i - 1) * 40, 'orb'); m.home = 2.6; m.r += 4; m.life = 7; ebullets.push(m); }
      g.sfx('power');
    } },
    // a big bubble that pops into a ring
    burst: { tele: 0.9, dur: 0.4, start(b, g) {
      const o = origin(b), a = Math.atan2(ship.y - o.y, ship.x - o.x);
      const m = makeBullet(o.x - 40, o.y, Math.cos(a) * K.bulletSpeed * 0.9, Math.sin(a) * K.bulletSpeed * 0.9, 'big'); m.r = 20; m.burst = 1.0;
      ebullets.push(m); g.sfx('shoot');
    } },
    // bubbles that bounce off the top and bottom
    bounce: { tele: 0.8, dur: 0.3, start(b, g) {
      const o = origin(b);
      for (const a of [-2.6, Math.PI, 2.6]) { const m = makeBullet(o.x - 30, o.y, Math.cos(a) * K.bulletSpeed, Math.sin(a) * K.bulletSpeed); m.bounce = true; ebullets.push(m); }
      g.sfx('spring');
    } },

    // ---- the Chimera's own attacks ----
    // Lion: star-fire breath straight across (a wide beam from its mouth)
    fire: { tele: 1.5, dur: 1.2, prep(b) { b.beamY = math.clamp(ship.y, 80, H - 80); b.beamW = 34; chim.jawTo = 0.8; },
      start(b, g) { g.sfx('zap'); roar(g, 0.4); },
      tick(b, g) { if (Math.abs(ship.y - b.beamY) < b.beamW + SHIP_R - 4) hitShip(g); },
      end() { chim.jawTo = 0; } },
    // Lion: a ROAR - a ring of bubbles with one gap in it, and the screen shakes
    roar: { tele: 1.0, dur: 0.6, prep() { chim.jawTo = 1; },
      start(b, g) {
        const o = origin(b), n = G.pick(14, 18, 22), gapA = Math.atan2(ship.y - o.y, ship.x - o.x) + math.rand(-0.3, 0.3);
        for (let i = 0; i < n; i++) { const a = i * Math.PI * 2 / n; if (Math.abs(math.angleDiff(a, gapA)) < 0.45) continue; bossShot(o.x, o.y, a, 0.8, 'fire'); }
        roar(g, 1); shake = 0.5;
      }, end() { chim.jawTo = 0; } },
    // Goat: lightning bolts strike down in the marked columns
    bolts: { tele: 1.3, dur: 0.6, prep(b) {
      b.cols = [];
      const n = G.pick(2, 3, 4);
      for (let i = 0; i < n; i++) b.cols.push(70 + (i + 0.2 + Math.random() * 0.6) * (SHIP_MAX_X - 20) / n);
    },
      start(b, g) { g.sfx('crash'); shake = 0.25; },
      tick(b, g) { for (const x of b.cols) if (Math.abs(ship.x - x) < 26 + SHIP_R - 4) hitShip(g); } },
    // Serpent: the snake head lunges right across the screen along a marked row
    strike: { tele: 1.2, dur: 1.6, prep(b) { b.chargeY = math.clamp(ship.y, 90, H - 70); },
      start(b, g) { g.sfx('whoosh'); },
      tick(b, g, dt, t) {
        const sn = chim.snake;
        sn.y += (b.chargeY - sn.y) * Math.min(1, dt * 10);
        if (t < 0.6) sn.x -= 1300 * dt; else sn.x += (chim.snakeHome.x - sn.x) * Math.min(1, dt * 3);
        sn.x = Math.max(60, sn.x);
        chim.snakeOpen = t < 0.7 ? 1 : 0;
        if (math.dist(sn.x, sn.y, ship.x, ship.y) < 40 + SHIP_R) hitShip(g);
      },
      end() { chim.snakeOpen = 0; } },
    // Eater of Worlds: it opens its mouth and breathes IN, pulling everything toward it.
    // Fly to the left! Its mouth is wide open, so it's the best time to hit it.
    devour: { tele: 1.3, dur: 3.2, prep() { chim.jawTo = 1; },
      start(b, g) { chim.suck = G.pick(110, 150, 190); roar(g, 0.6); for (const p of planets) if (!p.eaten && p.x < W + 50) p.pull = { x: chim.x, y: chim.y + 60 }; },
      tick(b, g, dt) {
        // stars and space dust get sucked in too
        if (Math.random() < dt * 30) G.particles.burst(math.rand(200, 600), math.rand(60, H - 60), { count: 1, angle: 0, spread: 0.2, speed: 500, gravity: 0, size: 6, life: 0.6, colors: ['#e0aaff', '#fff'] });
        if (math.dist(ship.x, ship.y, chim.x, chim.y + 60) < 110) hitShip(g);
      },
      end() { chim.suck = 0; chim.jawTo = 0; } },
  };
  // where a boss shoots from
  function origin(b) {
    if (!b.chimera) return { x: b.x, y: b.y };
    if (chim.part === 'goat') return { x: chim.x + 190, y: chim.y - 150 };
    if (chim.part === 'snake') return { x: chim.snake.x, y: chim.snake.y };
    return { x: chim.x - 10, y: chim.y + 60 };
  }
  function bossShot(x, y, a, speedK, kind) {
    if (ebullets.length >= K.maxBullets * 2) return;   // bosses get a bigger (but still capped) budget
    const sp = K.bulletSpeed * speedK;
    ebullets.push(makeBullet(x, y, Math.cos(a) * sp, Math.sin(a) * sp, kind));
  }

  // ---------------------------------------------------------------
  // Mini bosses and big bosses
  // ---------------------------------------------------------------
  function startBoss(g, kind) {
    let id = kind === 'mini' ? sector.mini : sector.boss;
    if (sector.endless) {
      const minis = Object.keys(MINIS), bigs = Object.keys(BIGS);
      id = kind === 'mini' ? minis[endlessLoop % minis.length] : bigs[endlessLoop % bigs.length];
    }
    const def = kind === 'mini' ? MINIS[id] : BIGS[id];
    const max = Math.round(K.bossHp * (kind === 'mini' ? 0.4 : 1) * (sector.endless ? 1 + endlessLoop * 0.2 : 1));
    boss = { kind, id, def, x: W + 160, y: H / 2, home: W - (kind === 'mini' ? 150 : 170), r: def.r, hp: max, max, t: 0, mode: 'enter', modeT: 0, atk: null, next: 0, flash: 0, wob: 0, slow: 0 };
    phase = 'bossWarn'; phaseT = 2.0;
    banner = { text: kind === 'mini' ? 'Mini boss!' : 'Boss!', sub: def.name, t: 2.4 };
    potential += kind === 'mini' ? POINTS.mini : POINTS.boss;
    g.sfx('power');
    if (kind === 'mini') { g.music.stinger('boss'); g.music.mood({ energy: 2 }); }
    else {
      // the big boss gets its own song (the sector's song fades out)
      song = SONGS.boss; Arcade.audio.play(song, { fade: 1.0 }); g.music.mood({ energy: 2 });
    }
  }

  function hitsBoss(x, y, r) {
    if (math.dist(x, y, boss.x, boss.y) < boss.r + r) return true;
    // the Guardian's two moons can be bubbled too
    if (boss.id === 'guardian' && boss.kind === 'big') for (const m of ART.guardianMoons(boss)) if (math.dist(x, y, m.x, m.y) < m.r + r) return true;
    return false;
  }

  function hurtBoss(g, dmg) {
    if (!boss || boss.mode === 'defeated' || boss.mode === 'enter') return;
    // a boss that's been fighting for a long time gets tired (so a fight never drags on)
    if (boss.t > 30) { dmg *= 1.6; if (!boss.tired) { boss.tired = true; popup("It's getting tired!", boss.x, boss.y - 120, '#9bf6ff', 30); } }
    boss.hp -= dmg;
    boss.flash = 0.06;
    if (dmg >= 1) g.tone(400 + Math.random() * 80, 0.04, { type: 'triangle', vol: 0.1 });
    if (boss.hp <= 0) {
      boss.hp = 0;
      boss.mode = 'defeated'; boss.modeT = 0;
      combo++; bestCombo = Math.max(bestCombo, combo);
      const pts = (boss.kind === 'mini' ? POINTS.mini : POINTS.boss) * mult();
      score += pts;
      popup('+' + pts, boss.x, boss.y - 110, '#ffd166', 40);
      ebullets = [];
      for (const e of enemies) if (!e.friendly) hurtEnemy(g, e, 99);   // everyone else gets bubbled too
      g.sfx('win');
      if (boss.kind === 'mini') {
        g.achieve('mini');
        g.music.mood({ energy: 1 }); g.music.stinger('treasure');
        dropCapsule(g, boss.x - 60, boss.y);                      // mini bosses always leave a weapon
        checkpoint = 1;
        phase = 'breather'; phaseT = 3.2;
        banner = { text: 'Checkpoint!', sub: 'Grab the present!', t: 2 };
      } else {
        g.music.stinger('treasure');
        phase = 'clear'; phaseT = 2.6;
      }
    }
  }

  function updateBoss(g, dt) {
    const b = boss;
    if (b.slow > 0) b.slow -= dt;
    b.t += dt; b.modeT += dt; b.wob += dt;
    if (b.flash > 0) b.flash -= dt;
    if (b.mode === 'defeated') {
      // floats away inside a giant bubble, popping hearts
      b.y -= 60 * dt; b.x += 40 * dt;
      if (Math.random() < dt * 12 && hearts.length < 45) hearts.push({ x: b.x + math.rand(-80, 80), y: b.y + math.rand(-60, 60), vx: math.rand(-60, 60), vy: -90, t: 0, life: 1.1, c: '#f15bb5' });
      if (b.modeT > 1.8 && !b.popped) {
        b.popped = true;
        g.particles.burst(b.x, b.y, { count: 40, shape: 'star', gravity: 0, speed: 320, size: 16, life: 0.9 });
        g.sfx('pop');
      }
      return;
    }
    if (b.mode === 'enter') {
      b.x -= 170 * dt;
      b.y = H / 2 + Math.sin(b.t) * 40;
      if (b.x <= b.home) { b.mode = 'rest'; b.modeT = 0; }
      return;
    }
    runAttacks(b, g, dt, b.def.attacks, () => {
      b.x += (b.home + Math.sin(b.t * 0.6) * 25 - b.x) * Math.min(1, dt * 2);
      b.y += (H / 2 + Math.sin(b.t * 0.8) * (b.kind === 'mini' ? 150 : 130) - b.y) * Math.min(1, dt * 1.5);
    });
    // bumping into the boss counts as a bonk
    if (math.dist(b.x, b.y, ship.x, ship.y) < b.r * 0.85 + SHIP_R) hitShip(g);
    if (b.id === 'guardian' && b.kind === 'big') for (const m of ART.guardianMoons(b)) if (math.dist(m.x, m.y, ship.x, ship.y) < m.r + SHIP_R - 4) hitShip(g);
  }
  // rest -> warning (tele) -> attack (act) -> rest ... taking turns through the list
  function runAttacks(b, g, dt, list, idle) {
    if (b.mode === 'rest') {
      idle();
      if (b.modeT > K.rest * (b.kind === 'mini' ? 1.15 : 1)) {
        b.atk = list[b.next % list.length]; b.next++;
        b.mode = 'tele'; b.modeT = 0;
        const A = ATTACKS[b.atk];
        if (A.prep) A.prep(b, g);
        g.sfx('beep');
      }
    } else if (b.mode === 'tele') {
      if (b.atk !== 'charge') idle();
      if (b.modeT > ATTACKS[b.atk].tele) { b.mode = 'act'; b.modeT = 0; ATTACKS[b.atk].start(b, g); }
    } else if (b.mode === 'act') {
      const A = ATTACKS[b.atk];
      if (A.tick) A.tick(b, g, dt, b.modeT);
      if (b.atk !== 'charge') idle();
      if (b.modeT > A.dur) { b.mode = 'rest'; b.modeT = 0; if (A.end) A.end(b, g); }
    }
  }

  // ---------------------------------------------------------------
  // THE CHIMERA, THE EATER OF WORLDS (the final mega fight)
  // Four phases. In each one a different part of it is awake and can be hit
  // (it glows): the LION head, the GOAT head, the SERPENT tail, and last of
  // all its great MOUTH, the "Eater of Worlds" itself.
  // ---------------------------------------------------------------
  const CHIMERA_PHASES = [
    { part: 'lion',  name: 'The Lion awakes!',     attacks: ['fire', 'roar', 'fan', 'rain'] },
    { part: 'goat',  name: 'The Goat awakes!',     attacks: ['bolts', 'homing', 'roar', 'bolts', 'spiral'] },
    { part: 'snake', name: 'The Serpent strikes!', attacks: ['strike', 'spiral', 'rain', 'strike', 'homing'] },
    { part: 'maw',   name: 'The Eater of Worlds!', attacks: ['devour', 'fire', 'bolts', 'roar', 'devour', 'homing', 'lasers'] },
  ];
  function startFinal(g) {
    phase = 'chimeraIntro'; phaseT = 6.5;
    const startPhase = checkpoint || 0;
    chim = { chimera: true, x: 680, y: 250, t: 0, jaw: 0, jawTo: 0, phase: startPhase, part: CHIMERA_PHASES[startPhase].part, hp: 1, max: 1,
             mode: 'rest', modeT: 0, next: 0, flash: 0, done: {}, snake: { x: 570, y: 465 }, snakeHome: { x: 570, y: 465 }, snakeOpen: 0, suck: 0,
             fighting: false, beaten: false, kind: 'chimera', alpha: 0 };
    for (let i = 0; i < startPhase; i++) chim.done[CHIMERA_PHASES[i].part] = true;
    banner = { text: 'CHIMERA', sub: 'The Eater of Worlds', t: 4.5, big: true };
    if (!startPhase) {
      // three weapon capsules float in: pick your favorite for the fight!
      const picks = [];
      while (picks.length < 3) { const w = SPECIALS[Math.floor(Math.random() * SPECIALS.length)].id; if (!picks.includes(w)) picks.push(w); }
      picks.forEach((w, i) => capsules.push({ wid: w, x: 330 + i * 70, y: 140 + i * 130, t: 0, stay: true }));
    }
  }
  function chimPhaseHp() { return Math.round(G.pick(170, 230, 290)); }
  function chimHit() {
    if (!chim) return null;
    const p = chim.part;
    if (p === 'lion') return { x: chim.x, y: chim.y + 5, r: 72 };
    if (p === 'goat') return { x: chim.x + 190, y: chim.y - 150, r: 64 };
    if (p === 'snake') return { x: chim.snake.x, y: chim.snake.y, r: 44 };
    return { x: chim.x, y: chim.y + 62, r: 50 + chim.jaw * 14 };
  }
  function roar(g, k) {
    // a deep, rumbly ROAR (made from a low wobbly tone + noise)
    g.tone(110, 0.9 * k + 0.3, { type: 'sawtooth', slide: 55, vol: 0.22 * k + 0.05, filter: 700, vib: 0.06, vibRate: 13 });
    Arcade.audio.noise(0.9 * k + 0.2, { filter: 'lowpass', freq: 600, sweep: 150, vol: 0.25 * k });
  }
  function updateChimera(g, dt) {
    const c = chim;
    c.t += dt; c.modeT += dt; c.phaseT = (c.phaseT || 0) + dt;
    if (c.flash > 0) c.flash -= dt;
    c.jaw += ((c.jawTo || 0) - c.jaw) * Math.min(1, dt * 6);
    c.alpha = Math.min(1, c.alpha + dt * 0.5);
    if (phase === 'chimeraIntro') {
      phaseT -= dt;
      // it rises out of the dark... and eats a planet!
      if (phaseT < 4.5 && !c.ateOne) { c.ateOne = true; c.jawTo = 1; roar(g, 1); shake = 1; for (const p of planets) if (!p.eaten) { p.pull = { x: c.x, y: c.y + 60 }; break; } }
      if (phaseT < 3 && c.jawTo) c.jawTo = 0;
      if (phaseT <= 0) startChimeraPhase(g, c.phase);
      return;
    }
    if (c.beaten) {
      c.endT += dt;
      // the beast turns into stars... and the worlds it ate pop back out
      if (c.endT > 1 && !c.released) { c.released = true; for (const p of planets) { p.eaten = false; p.pull = null; p.r = p.r0 || 30; p.x = c.x; p.y = c.y + 60; p.sp = -40 - Math.random() * 60; } g.music.stinger('treasure'); }
      if (c.endT > 1) for (const p of planets) { p.x += (p.homeX - p.x) * dt * 0.8; p.y += (p.homeY - p.y) * dt * 0.8; }
      if (Math.random() < dt * 20 && hearts.length < 45) hearts.push({ x: c.x + math.rand(-150, 250), y: c.y + math.rand(-200, 200), vx: math.rand(-40, 40), vy: -60, t: 0, life: 1.4, c: ['#ffd166', '#f15bb5', '#9bf6ff'][Math.floor(Math.random() * 3)] });
      if (c.endT > 6 && !finished) winSector(g);
      return;
    }
    if (c.mode === 'between') {          // a part was beaten: a short pause, then the next part wakes up
      if (c.modeT > 2.4) startChimeraPhase(g, c.phase + 1);
      return;
    }
    c.fighting = true;
    const ph = CHIMERA_PHASES[c.phase];
    runAttacks(c, g, dt, ph.attacks, () => {
      c.y += (250 + Math.sin(c.t * 0.7) * 30 - c.y) * Math.min(1, dt * 1.5);
      const sn = c.snake;
      if (c.atk !== 'strike' || c.mode !== 'act') { sn.x += (c.snakeHome.x + Math.sin(c.t * 1.3) * 20 - sn.x) * Math.min(1, dt * 3); sn.y += (c.snakeHome.y + Math.cos(c.t * 1.1) * 14 - sn.y) * Math.min(1, dt * 3); }
    });
    // the beast itself bumps you if you fly into it
    const hit = chimHit();
    if (math.dist(c.x, c.y, ship.x, ship.y) < 120 + SHIP_R) hitShip(g);
    if (hit && c.part === 'snake' && math.dist(hit.x, hit.y, ship.x, ship.y) < 34 + SHIP_R) hitShip(g);
  }
  function startChimeraPhase(g, i) {
    const c = chim;
    c.phase = i; c.part = CHIMERA_PHASES[i].part;
    phase = 'chimera';
    capsules = capsules.filter(k => !k.stay);      // the weapon choices you didn't take float away
    c.hp = c.max = chimPhaseHp(); c.phaseT = 0;
    c.mode = 'rest'; c.modeT = 0; c.next = 0; c.atk = null; c.fighting = true; c.jawTo = c.part === 'maw' ? 0.35 : 0;
    checkpoint = i;
    banner = { text: CHIMERA_PHASES[i].name, sub: ['Bubble its lion head!', 'Bubble the goat head!', 'Bubble the serpent!', 'Bubble its mouth!'][i], t: 2.4 };
    roar(g, 0.8); shake = 0.6;
    g.music.stinger('boss');
    g.music.mood({ energy: 2, key: i === 3 ? 2 : 0, tempo: i === 3 ? 1.06 : 1 });
  }
  function hurtChimera(g, dmg) {
    const c = chim;
    if (!c || c.beaten || c.mode === 'between' || !c.fighting) return;
    // its mouth takes double damage while it's wide open (during "devour")
    if (c.part === 'maw' && c.jaw > 0.6) dmg *= 2;
    if (c.modeT > 0 && c.phaseT > 50) dmg *= 1.5;     // a long fight: it's getting tired
    c.hp -= dmg; c.flash = 0.06;
    if (dmg >= 1) g.tone(300 + Math.random() * 60, 0.05, { type: 'triangle', vol: 0.1 });
    if (c.hp > 0) return;
    c.hp = 0;
    // this part goes calm (turns to starlight)
    c.done[c.part] = true;
    const h = chimHit();
    g.particles.burst(h.x, h.y, { count: 40, shape: 'star', gravity: 0, speed: 300, size: 15, life: 0.9, colors: ['#fff6c7', '#9bf6ff', '#e0aaff'] });
    ebullets = []; c.suck = 0; c.jawTo = 0; c.snakeOpen = 0; c.fighting = false;
    for (const e of enemies) hurtEnemy(g, e, 99);
    score += 5000 * mult(); popup('+' + 5000 * mult(), h.x, h.y - 80, '#ffd166', 40);
    g.sfx('win');
    if (c.phase < CHIMERA_PHASES.length - 1) {
      c.mode = 'between'; c.modeT = 0;
      banner = { text: ['Lion calmed!', 'Goat calmed!', 'Serpent calmed!'][c.phase], sub: 'Checkpoint!', t: 2 };
      checkpoint = c.phase + 1;
      // a little help between phases: a shield and maybe a life
      powerups.push({ kind: 'shield', x: 520, y: H / 2 - 60, t: 0 });
      if (lives < startLives) powerups.push({ kind: 'life', x: 520, y: H / 2 + 60, t: 0 });
    } else {
      // BEATEN! The Eater of Worlds turns into a constellation
      c.beaten = true; c.endT = 0;
      for (const p of planets) { p.homeX = 150 + Math.random() * 600; p.homeY = 90 + Math.random() * (H - 180); p.r0 = p.r0 || 30; }
      phase = 'won';
      banner = { text: 'You did it!', sub: 'The galaxy is saved!', t: 5, big: true };
      g.achieve('chimera'); if (hitsTaken === 0) g.achieve('chimeraNoHit');
      g.music.mood({ energy: 1, key: 0, tempo: 1 });
      shake = 0.8;
    }
  }

  // ---------------------------------------------------------------
  // Winning and losing
  // ---------------------------------------------------------------
  function winSector(g) {
    if (sector.endless) {
      // Endless: next loop, a bit harder, new colors
      endlessLoop++;
      boss = null;
      setTheme(['moon', 'candy', 'rings', 'ice', 'jungle', 'lava', 'crystal', 'storm', 'neon', 'void'][endlessLoop % 10]);
      banner = { text: 'Loop ' + (endlessLoop + 1) + '!', sub: 'Faster friends!', t: 2 };
      K.speed *= 1.05; K.fireGap *= 0.95;
      song = SONGS[['comet', 'lava', 'crystal', 'neon'][endlessLoop % 4]]; Arcade.audio.play(song, { fade: 1 });
      g.music.mood({ energy: 1 });
      startPart(g, 1);
      return;
    }
    finished = true;
    g.achieve('clear');
    if (hitsTaken === 0) g.achieve('nohit');
    if (!sector.final) g.achieve('boss');
    if (sector.id === 's10') g.achieve('sector10');
    const goal = Math.round(potential * 0.85);
    const stars = sector.final ? 1 + (lives >= 3 ? 1 : 0) + (hitsTaken <= 3 ? 1 : 0) : 1 + (lives >= startLives - 1 ? 1 : 0) + (score >= goal ? 1 : 0);
    g.finish({
      win: true, score, stars,
      title: sector.final ? 'Galaxy saved!' : 'Sector clear!',
      lines: [
        { icon: shipIconSVG(), text: String(lives) },
        { icon: WEAPON_SVG(ship.weapon.id), text: 'Lv ' + ship.weapon.lv },
        { icon: '<svg viewBox="0 0 40 40"><path d="M20 37 C6 33 8 18 16 6 Q18 16 23 14 C29 21 33 32 20 37 Z" fill="#ff8c42" stroke="#2b2b2b" stroke-width="3"/></svg>', text: String(bestCombo) },
      ],
      next: !sector.final, delay: sector.final ? 300 : 600,
    });
  }

  function loseGame(g) {
    finished = true;
    ship.inv = 99;
    if (sector.endless) {
      if (endlessLoop >= 2) g.achieve('loop3');
      const stars = score >= 60000 ? 3 : score >= 30000 ? 2 : score >= 10000 ? 1 : 0;
      g.finish({ win: false, score, stars, title: 'Great flying!', lines: ['Loops: ' + (endlessLoop + 1), 'Best combo: ' + bestCombo], delay: 1200 });
      return;
    }
    const lines = sector.final ? ['You reached: ' + CHIMERA_PHASES[chim.phase].part] : ['You got to ' + (boss ? (boss.kind === 'mini' ? 'the mini boss' : 'the big boss') : 'wave ' + Math.max(1, waveIdx + 1))];
    // carry on from the checkpoint (after the mini boss, or the Chimera part you got to)
    const cp = sector.final ? chim.phase : checkpoint;
    const opts = { win: false, score, stars: 0, title: 'Nice try!', lines, delay: 1200 };
    if (cp > 0) {
      const keep = { id: sector.id, cp, score: sector.final ? 0 : score, weapon: { ...ship.weapon } };
      opts.buttons = [
        { icon: icons.play, label: 'Checkpoint', cls: 'big', onClick: () => { resume = keep; g.restart(); } },
        { icon: icons.again, label: 'Start over', cls: 'yellow', onClick: () => { resume = null; g.restart(); } },
        { icon: icons.menu, label: 'Sectors', cls: 'blue', onClick: () => g.menu() },
      ];
    }
    g.finish(opts);
  }

  // ---------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------
  function drawBackground(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, theme.sky[0]); sky.addColorStop(1, theme.sky[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    const deco = theme.deco;
    if (deco === 'nebula') {          // soft colorful clouds of space dust, slowly turning
      for (let i = 0; i < 4; i++) {
        const x = ((i * 300 - clock * 6) % (W + 500) + W + 500) % (W + 500) - 250, y = 100 + (i * 131) % 340;
        const gr = ctx.createRadialGradient(x, y, 10, x, y, 220);
        gr.addColorStop(0, ['rgba(199,125,255,0.28)', 'rgba(247,37,133,0.2)', 'rgba(76,201,240,0.2)', 'rgba(155,93,229,0.25)'][i]); gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr; ctx.fillRect(x - 220, y - 220, 440, 440);
      }
    }
    if (theme.cloud) {
      ctx.fillStyle = theme.cloud;
      for (let i = 0; i < 5; i++) {
        const x = ((i * 260 - clock * 10) % (W + 400) + W + 400) % (W + 400) - 200;
        ctx.beginPath(); ctx.ellipse(x, 120 + (i * 97) % 320, 160, 70, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    // planets (slowest layer)
    for (const p of planets) if (!p.eaten) drawPlanet(ctx, p);
    // stars (twinkly)
    for (const s of stars) {
      ctx.globalAlpha = 0.55 + 0.45 * Math.sin(clock * 3 + s.tw);
      ctx.fillStyle = s.sz > 3 ? '#fff6c7' : '#ffffff';
      if (s.sz > 3) { D.starPath(ctx, s.x, s.y, s.sz * 1.4, s.sz * 0.6); ctx.fill(); }
      else ctx.fillRect(s.x, s.y, s.sz, s.sz);
    }
    ctx.globalAlpha = 1;
    if (deco === 'moonfloor') {
      // a bumpy moon floor with little domes far below
      const off = (clock * 25) % 320;
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, H - 26 - Math.sin((x + off) / 50) * 6);
      ctx.lineTo(W, H); ctx.closePath();
      ctx.fillStyle = theme.ground; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      for (let x = -off; x < W + 100; x += 320) {
        ctx.beginPath(); ctx.arc(x + 160, H - 22, 26, Math.PI, 0); ctx.closePath();
        ctx.fillStyle = '#bde0fe'; ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffd166'; ctx.fillRect(x + 152, H - 34, 8, 8); ctx.fillRect(x + 166, H - 34, 8, 8);
        D.circle(ctx, x + 60, H - 14, 9, '#7d8597', 3);
      }
    } else if (deco === 'snow') {     // drifting snowflakes
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (let i = 0; i < 40; i++) { const x = ((i * 97 - clock * (30 + i % 5 * 10)) % W + W) % W, y = ((i * 53 + clock * (20 + i % 4 * 8)) % H + H) % H; ctx.beginPath(); ctx.arc(x, y, 1.5 + i % 3, 0, Math.PI * 2); ctx.fill(); }
    } else if (deco === 'lava') {     // a glowing lava sea at the bottom with bubbles
      const off = clock * 40;
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, H - 22 - Math.sin((x + off) / 40) * 5);
      ctx.lineTo(W, H); ctx.closePath();
      const lg = ctx.createLinearGradient(0, H - 30, 0, H); lg.addColorStop(0, '#ffd166'); lg.addColorStop(1, '#ef476f');
      ctx.fillStyle = lg; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      for (let i = 0; i < 6; i++) { const k = (clock * 0.7 + i * 0.37) % 1; D.circle(ctx, (i * 173 + 60) % W, H - 20 - k * 30, 6 * (1 - k) + 1, '#ffd166', 2); }
    } else if (deco === 'crystals') { // crystal spikes on the floor and the ceiling
      const off = (clock * 30) % 240;
      for (let x = -off; x < W + 240; x += 120) for (const top of [0, 1]) {
        const h = 40 + ((x + off) * 7 % 50), y0 = top ? 0 : H, s = top ? 1 : -1;
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + 18, y0 + s * h); ctx.lineTo(x + 36, y0); ctx.closePath();
        ctx.fillStyle = top ? 'rgba(224,170,255,0.75)' : 'rgba(155,246,255,0.75)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      }
    } else if (deco === 'storm') {    // now and then a soft glow of lightning far away (gentle, no strobe)
      const k = Math.max(0, Math.sin(clock * 0.9) - 0.92) * 6;
      if (k > 0) { ctx.fillStyle = `rgba(255,255,220,${k * 0.25})`; ctx.fillRect(0, 0, W, H); }
    } else if (deco === 'grid') {     // a glowing neon floor grid
      ctx.save(); ctx.strokeStyle = 'rgba(247,37,133,0.55)'; ctx.lineWidth = 2;
      const hy = H - 110;
      for (let i = 0; i < 8; i++) { const k = ((i + (clock * 0.8) % 1) / 8); const y = hy + Math.pow(k, 2) * 110; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      for (let i = -10; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 30, hy); ctx.lineTo(W / 2 + i * 160, H); ctx.stroke(); }
      ctx.restore();
    }
  }

  function drawPlanet(ctx, p) {
    ctx.save();
    if (p.kind === 'ring') {
      ctx.lineWidth = 12; ctx.strokeStyle = '#ff8c42';
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * 1.8, p.r * 0.45, -0.25, Math.PI, Math.PI * 2); ctx.stroke();
    }
    D.circle(ctx, p.x, p.y, p.r, p.color, 4);
    ctx.save();
    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1, p.r - 2), 0, Math.PI * 2); ctx.clip();
    if (p.kind === 'moon') {
      for (const [dx, dy, rr] of [[-0.35, -0.2, 0.22], [0.3, 0.25, 0.16], [0.1, -0.45, 0.1]]) D.circle(ctx, p.x + dx * p.r, p.y + dy * p.r, rr * p.r, 'rgba(0,0,0,0.12)', 0);
    } else if (p.kind === 'swirl') {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = p.r * 0.18;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.7, i * Math.PI / 2 + clock * 0.3, i * Math.PI / 2 + 0.8 + clock * 0.3); ctx.stroke(); }
    } else if (p.kind === 'stripe' || p.kind === 'ring') {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let i = -2; i <= 2; i++) ctx.fillRect(p.x - p.r, p.y + i * p.r * 0.38 - p.r * 0.08, p.r * 2, p.r * 0.16);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(p.x - p.r * 0.4, p.y - p.r * 0.4, p.r * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
    if (p.kind === 'ring') {
      ctx.lineWidth = 12; ctx.strokeStyle = '#ff8c42';
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * 1.8, p.r * 0.45, -0.25, 0, Math.PI); ctx.stroke();
    }
    ctx.restore();
  }

  // ---- the player's ship (faces right) ----
  function shipFill(ctx, design, w) {
    if (design.color !== 'rainbow') return design.color;
    const gr = ctx.createLinearGradient(-w, 0, w, 0);
    RAINBOW.forEach((c, i) => gr.addColorStop(i / (RAINBOW.length - 1), c));
    return gr;
  }
  function drawShip(ctx, x, y, design, o = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(o.tilt || 0);
    const sc = o.scale || 1;
    ctx.scale(sc, sc);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const fill = shipFill(ctx, design, 36);
    if (!o.noFlame) {
      const f = 1 + Math.sin(clock * 40) * 0.2;
      ctx.beginPath(); ctx.moveTo(-30, -9); ctx.quadraticCurveTo(-30 - 26 * f, 0, -30, 9); ctx.closePath();
      ctx.fillStyle = '#ff8c42'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-30, -4); ctx.quadraticCurveTo(-30 - 13 * f, 0, -30, 4); ctx.closePath();
      ctx.fillStyle = '#ffd166'; ctx.fill();
    }
    ctx.lineWidth = 4; ctx.strokeStyle = INK;
    if (design.shape === 'saucer') {
      ctx.beginPath(); ctx.ellipse(0, 6, 38, 14, 0, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(2, 2, 20, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#bde0fe'; ctx.fill(); ctx.stroke();
      pilot(ctx, 4, -6);
      for (const lx of [-24, -8, 8, 24]) D.circle(ctx, lx, 10, 4, design.accent, 2.5);
    } else if (design.shape === 'jet') {
      ctx.beginPath(); ctx.moveTo(-10, -6); ctx.lineTo(-26, -28); ctx.lineTo(-12, -28); ctx.lineTo(12, -6); ctx.closePath();
      ctx.moveTo(-10, 6); ctx.lineTo(-26, 28); ctx.lineTo(-12, 28); ctx.lineTo(12, 6); ctx.closePath();
      ctx.fillStyle = design.accent; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-32, -12); ctx.lineTo(16, -12); ctx.quadraticCurveTo(42, -4, 44, 0); ctx.quadraticCurveTo(42, 4, 16, 12); ctx.lineTo(-32, 12); ctx.closePath();
      ctx.fillStyle = fill; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(8, -2, 14, 10, 0, 0, Math.PI * 2); ctx.fillStyle = '#bde0fe'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
      pilot(ctx, 9, -2);
    } else {
      ctx.beginPath(); ctx.moveTo(-20, -12); ctx.quadraticCurveTo(-34, -30, -36, -26); ctx.lineTo(-30, -8); ctx.closePath();
      ctx.moveTo(-20, 12); ctx.quadraticCurveTo(-34, 30, -36, 26); ctx.lineTo(-30, 8); ctx.closePath();
      ctx.fillStyle = design.accent; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-32, -15); ctx.lineTo(14, -15); ctx.quadraticCurveTo(40, -12, 46, 0); ctx.quadraticCurveTo(40, 12, 14, 15); ctx.lineTo(-32, 15);
      ctx.quadraticCurveTo(-38, 0, -32, -15); ctx.closePath();
      ctx.fillStyle = fill; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(30, -11); ctx.quadraticCurveTo(40, -8, 46, 0); ctx.quadraticCurveTo(40, 8, 30, 11); ctx.closePath();
      ctx.fillStyle = design.accent; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
      D.circle(ctx, 6, 0, 11, '#bde0fe', 3);
      pilot(ctx, 7, 0);
    }
    ctx.restore();
  }
  function pilot(ctx, x, y) {
    D.circle(ctx, x, y, 7, '#ffd6a5', 2);
    D.circle(ctx, x - 2.5, y - 1.5, 1.6, INK, 0); D.circle(ctx, x + 2.5, y - 1.5, 1.6, INK, 0);
    ctx.lineWidth = 1.6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(x, y + 1, 2.6, 0.2, Math.PI - 0.2); ctx.stroke();
  }

  // ---- bosses (pictures are in art.js; here: shaking, warnings, beams) ----
  function drawBoss(ctx, b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    if (b.mode === 'tele' && b.atk === 'charge') ctx.translate(Math.sin(clock * 60) * 4, 0);
    const flash = b.flash > 0;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const swell = b.mode === 'tele' && ['ring', 'fan', 'spiral', 'burst', 'homing'].includes(b.atk) ? 1 + Math.sin(b.modeT * 20) * 0.03 + b.modeT * 0.05 : 1;
    if (b.kind === 'mini') { ctx.scale(swell, swell); ART.drawMini(ctx, b, flash); }
    else ART.BIG[b.id](ctx, b, flash, swell);
    if (b.mode === 'defeated' && !b.popped) {
      const k = Math.min(1, b.modeT * 2);
      ctx.globalAlpha = 0.5;
      D.circle(ctx, 0, 10, (b.r + 40) * k, 'rgba(189,224,254,0.4)', 5);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(-b.r * 0.6 * k, -b.r * 0.6 * k, 14, 24, 0.7, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    if (b.mode !== 'defeated') drawWarnings(ctx, b);
  }
  // the flashing warnings before an attack, and beams while it happens (bosses and Chimera)
  function drawWarnings(ctx, b) {
    const blink = Math.floor(b.modeT * 8) % 2 === 0;
    const o = origin(b);
    if (b.mode === 'tele') {
      if (blink) D.text(ctx, '!', o.x - (b.chimera ? 70 : b.r) - 20, o.y - (b.chimera ? 80 : b.r), { size: 54, color: '#ffd166' });
      const stripe = (y, half) => {
        ctx.fillStyle = blink ? 'rgba(255,209,102,0.35)' : 'rgba(255,209,102,0.15)';
        ctx.fillRect(0, y - half, W, half * 2);
        ctx.setLineDash([18, 14]); ctx.lineWidth = 4; ctx.strokeStyle = '#ffd166';
        ctx.beginPath(); ctx.moveTo(0, y - half); ctx.lineTo(W, y - half); ctx.moveTo(0, y + half); ctx.lineTo(W, y + half); ctx.stroke();
        ctx.setLineDash([]);
      };
      const column = (x) => {
        ctx.fillStyle = blink ? 'rgba(255,209,102,0.3)' : 'rgba(255,209,102,0.12)';
        ctx.fillRect(x - 26, 0, 52, H);
        ctx.setLineDash([16, 12]); ctx.lineWidth = 3; ctx.strokeStyle = '#ffd166';
        ctx.beginPath(); ctx.moveTo(x - 26, 0); ctx.lineTo(x - 26, H); ctx.moveTo(x + 26, 0); ctx.lineTo(x + 26, H); ctx.stroke(); ctx.setLineDash([]);
      };
      if (b.atk === 'beam' || b.atk === 'fire') stripe(b.beamY, b.beamW);
      else if (b.atk === 'lasers') for (const y of b.beams) stripe(y, b.beamW);
      else if (b.atk === 'bolts') for (const x of b.cols) column(x);
      else if (b.atk === 'rain') for (const x of b.cols) { ctx.fillStyle = blink ? 'rgba(255,209,102,0.5)' : 'rgba(255,209,102,0.2)'; path3(ctx, x); }
      else if (b.atk === 'wall') { ctx.fillStyle = 'rgba(6,214,160,0.25)'; ctx.fillRect(0, b.gapY - 70, W, 140); D.text(ctx, '>>', 120, b.gapY, { size: 40, color: '#06d6a0' }); }
      else if (b.atk === 'charge' || b.atk === 'strike') {
        ctx.setLineDash([20, 16]); ctx.lineWidth = 6; ctx.strokeStyle = blink ? '#ffd166' : 'rgba(255,209,102,0.5)';
        const sx = b.atk === 'strike' ? chim.snake.x : b.x - b.r;
        ctx.beginPath(); ctx.moveTo(sx, b.chargeY); ctx.lineTo(80, b.chargeY); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(110, b.chargeY - 22); ctx.lineTo(80, b.chargeY); ctx.lineTo(110, b.chargeY + 22); ctx.stroke();
      } else if (b.atk === 'devour') {
        ctx.fillStyle = blink ? 'rgba(199,125,255,0.25)' : 'rgba(199,125,255,0.1)'; ctx.fillRect(0, 0, W, H);
        D.text(ctx, '<<  FLY AWAY!  <<', 300, 90, { size: 34, color: '#e0aaff' });
      }
    }
    if (b.mode === 'act') {
      if (b.atk === 'beam') candyBeam(ctx, b.beamY, b.beamW, o.x - 60);
      else if (b.atk === 'lasers') for (const y of b.beams) laserBeam(ctx, y, b.beamW, o.x - 40);
      else if (b.atk === 'fire') fireBeam(ctx, b.beamY, b.beamW, o.x - 20);
      else if (b.atk === 'bolts') for (const x of b.cols) lightning(ctx, x);
      else if (b.atk === 'devour') {
        ctx.strokeStyle = 'rgba(224,170,255,0.5)'; ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) { const y = 60 + i * 60, k = (clock * 2 + i * 0.3) % 1; ctx.beginPath(); ctx.moveTo(100 + k * 500, y); ctx.lineTo(160 + k * 500, y + (H / 2 - y) * 0.1); ctx.stroke(); }
      }
    }
  }
  function path3(ctx, x) { ctx.beginPath(); ctx.moveTo(x - 20, 0); ctx.lineTo(x + 20, 0); ctx.lineTo(x, 34); ctx.closePath(); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); }
  function candyBeam(ctx, y, half, x1) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, y - half, x1, half * 2); ctx.clip();
    ctx.fillStyle = '#fff'; ctx.fillRect(0, y - half, W, half * 2);
    ctx.fillStyle = '#f15bb5';
    for (let x = -60 + ((clock * 300) % 60); x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, y - half); ctx.lineTo(x + 30, y - half); ctx.lineTo(x + 10, y + half); ctx.lineTo(x - 20, y + half); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.strokeRect(-4, y - half, x1 + 4, half * 2);
  }
  function laserBeam(ctx, y, half, x1) {
    const k = 0.8 + Math.sin(clock * 40) * 0.2;
    ctx.fillStyle = '#ff3d6e'; ctx.fillRect(0, y - half * k, x1, half * 2 * k);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, y - half * 0.35, x1, half * 0.7);
    ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeRect(-4, y - half * k, x1 + 4, half * 2 * k);
  }
  function fireBeam(ctx, y, half, x1) {
    ctx.save();
    const gr = ctx.createLinearGradient(0, y - half, 0, y + half);
    gr.addColorStop(0, '#ff3d6e'); gr.addColorStop(0.5, '#ffd166'); gr.addColorStop(1, '#ff3d6e');
    ctx.beginPath(); ctx.moveTo(x1, y - half * 0.6);
    for (let x = x1; x >= 0; x -= 20) ctx.lineTo(x, y - half - Math.sin(x * 0.08 + clock * 30) * 6);
    for (let x = 0; x <= x1; x += 20) ctx.lineTo(x, y + half + Math.sin(x * 0.08 + clock * 30) * 6);
    ctx.closePath(); ctx.fillStyle = gr; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
  }
  function lightning(ctx, x) {
    ctx.save(); ctx.lineJoin = 'round';
    for (const [wdt, col] of [[16, INK], [10, '#ffd166'], [4, '#fff']]) {
      ctx.lineWidth = wdt; ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(x, 0);
      for (let y = 30, i = 0; y <= H; y += 40, i++) ctx.lineTo(x + ((i * 7919 + Math.floor(clock * 20)) % 3 - 1) * 16, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBullet(ctx, b) {
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 6, 0, Math.PI * 2); ctx.fill();
    switch (b.kind) {
      case 'star':
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.t * 4); D.star(ctx, 0, 0, b.r + 3, '#ffd166', 3); ctx.restore(); break;
      case 'cookie':
        D.circle(ctx, b.x, b.y, b.r, '#d4a373', 3);
        D.circle(ctx, b.x - 3, b.y - 2, 2, '#6f4518', 0); D.circle(ctx, b.x + 3, b.y + 3, 2, '#6f4518', 0); break;
      case 'orb': {
        const k = 1 + Math.sin(b.t * 10) * 0.1;
        D.circle(ctx, b.x, b.y, b.r * k, '#c77dff', 3); D.circle(ctx, b.x, b.y, b.r * 0.45, '#fff', 0); break;
      }
      case 'big':
        D.circle(ctx, b.x, b.y, b.r, b.burst && b.t > b.burst - 0.3 && Math.floor(b.t * 20) % 2 ? '#fff' : '#ff8fab', 3);
        D.circle(ctx, b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.25, '#fff', 0); break;
      case 'meteor':
        ctx.fillStyle = 'rgba(255,140,66,0.5)'; ctx.beginPath(); ctx.moveTo(b.x - b.r, b.y); ctx.lineTo(b.x, b.y - b.r * 3); ctx.lineTo(b.x + b.r, b.y); ctx.fill();
        D.circle(ctx, b.x, b.y, b.r, '#b5651d', 3); D.circle(ctx, b.x + 3, b.y - 2, 3, '#7a4a24', 0); break;
      case 'fire':
        D.circle(ctx, b.x, b.y, b.r, '#ff8c42', 3); D.circle(ctx, b.x, b.y, b.r * 0.5, '#ffd166', 0); break;
      case 'venom':
        D.circle(ctx, b.x, b.y, b.r, '#80ffdb', 3); D.circle(ctx, b.x - 2, b.y - 2, b.r * 0.3, '#fff', 0); break;
      default:
        D.circle(ctx, b.x, b.y, b.r, b.color, 3);
        D.circle(ctx, b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.3, '#fff', 0);
    }
  }

  // the player's shots (each weapon has its own look)
  function drawShot(ctx, s) {
    const y = s.dy != null ? s.dy : s.y;
    switch (s.kind) {
      case 'heart': ART.heart(ctx, s.x, y, 9, '#ff5fa2', 2.5); break;
      case 'ball': D.circle(ctx, s.x, y, s.r, '#9b5de5', 3); D.circle(ctx, s.x - 3, y - 3, 3, '#fff', 0); break;
      case 'laser':
        ctx.fillStyle = '#ff3d6e'; ctx.fillRect(s.x - 26, y - 4, 40, 8); ctx.fillStyle = '#fff'; ctx.fillRect(s.x - 24, y - 1.5, 36, 3); break;
      case 'big':
        D.circle(ctx, s.x, y, s.r, 'rgba(189,243,255,0.75)', 3); ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.ellipse(s.x - s.r * 0.4, y - s.r * 0.4, s.r * 0.18, s.r * 0.3, 0.7, 0, Math.PI * 2); ctx.fill(); break;
      case 'orb': D.circle(ctx, s.x, y, s.r, '#4361ee', 3); D.circle(ctx, s.x - 2, y - 2, 2.5, '#fff', 0); break;
      case 'boomer':
        ctx.save(); ctx.translate(s.x, y); ctx.rotate(s.t * 14);
        ctx.beginPath(); ctx.moveTo(-14, -12); ctx.quadraticCurveTo(12, -10, 14, 14); ctx.quadraticCurveTo(4, -2, -14, -2); ctx.closePath();
        ctx.fillStyle = '#ff8c42'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); break;
      case 'rocket':
        ctx.save(); ctx.translate(s.x, y);
        D.box(ctx, -12, -6, 22, 12, 5, '#ef476f', 3);
        ctx.beginPath(); ctx.moveTo(10, -6); ctx.lineTo(18, 0); ctx.lineTo(10, 6); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-12, -4); ctx.lineTo(-22 - Math.random() * 6, 0); ctx.lineTo(-12, 4); ctx.closePath(); ctx.fillStyle = '#ffd166'; ctx.fill();
        ctx.restore(); break;
      case 'flake':
        ctx.save(); ctx.translate(s.x, y); ctx.rotate(s.t * 3); ctx.lineWidth = 3; ctx.strokeStyle = '#e0fbfc'; ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.stroke(); }
        ctx.restore(); break;
      case 'petal':
        ctx.save(); ctx.translate(s.x, y); ctx.rotate(s.t * 8);
        ctx.beginPath(); ctx.ellipse(0, 0, 9, 5, 0, 0, Math.PI * 2); ctx.fillStyle = '#ffafcc'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); break;
      case 'sonic':
        ctx.save(); ctx.lineCap = 'round';
        for (const [wdt, col] of [[9, INK], [5, '#caffbf']]) { ctx.lineWidth = wdt; ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(s.x - s.r, y, s.r, -1, 1); ctx.stroke(); }
        ctx.restore(); break;
      default:
        D.circle(ctx, s.x, y, s.r, '#bdf3ff', 3);
        D.circle(ctx, s.x - s.r * 0.33, y - s.r * 0.33, s.r * 0.3, '#fff', 0);
    }
  }

  function powerIcon(ctx, kind, x, y, r) {
    const c = POWERS[kind].color;
    D.circle(ctx, x, y, r, c, 3);
    ctx.save(); ctx.translate(x, y);
    const k = r / 20;
    ctx.scale(k, k);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (kind === 'shield') {
      ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(10, -6); ctx.quadraticCurveTo(9, 8, 0, 12); ctx.quadraticCurveTo(-9, 8, -10, -6); ctx.closePath();
      ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    } else if (kind === 'speed') {
      ctx.beginPath(); ctx.moveTo(3, -12); ctx.lineTo(-7, 2); ctx.lineTo(0, 2); ctx.lineTo(-3, 12); ctx.lineTo(8, -3); ctx.lineTo(1, -3); ctx.closePath();
      ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
    } else if (kind === 'life') {
      ART.heart(ctx, 0, 1, 9, '#fff', 2.5);
    }
    ctx.restore();
  }
  // a weapon capsule: a glowing pill with the weapon's picture inside
  function drawCapsule(ctx, c) {
    const bob = 1 + Math.sin(c.t * 6) * 0.06, w = WEAPON[c.wid];
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.sin(c.t * 5) * 0.15;
    D.circle(ctx, c.x, c.y, 38 * bob, w.color, 0);
    ctx.globalAlpha = 1;
    for (let i = 0; i < 3; i++) { const a = c.t * 3 + i * 2.1; D.star(ctx, c.x + Math.cos(a) * 36, c.y + Math.sin(a) * 36, 5, '#fff', 0); }
    D.box(ctx, c.x - 32 * bob, c.y - 26 * bob, 64 * bob, 52 * bob, 24, '#fff', 4);
    ART.weaponIcon(ctx, w, c.x, c.y, 21 * bob);
    ctx.restore();
  }

  function drawHUD(g, ctx) {
    const under = ship.x < 380 && ship.y < 150;
    ctx.save();
    if (under) ctx.globalAlpha = 0.45;
    // lives as little ships (left, past the home button)
    const n = Math.min(lives, 7);
    for (let i = 0; i < n; i++) drawShip(ctx, 118 + i * 38, 30, shipDesign, { scale: 0.42, noFlame: true });
    if (lives > 7) D.text(ctx, '+' + (lives - 7), 118 + 7 * 38, 30, { size: 20 });
    D.text(ctx, String(score), 100, 70, { size: 32, align: 'left' });
    if (combo >= 2) {
      const m = mult();
      D.text(ctx, 'Combo ' + combo + (m > 1 ? '  x' + m : ''), 100, 104, { size: 22, align: 'left', color: m > 1 ? '#ffd166' : '#fff' });
      D.meter(ctx, 100, 120, 110, 10, comboT / 2.2, '#f15bb5');
    }
    ctx.restore();
    // your weapon (top right, left of the pause button) with its power level
    const w = WEAPON[ship.weapon.id];
    ART.weaponIcon(ctx, w, 818, 38, 24);
    for (let i = 0; i < 3; i++) D.circle(ctx, 804 + i * 14, 72, 5, i < ship.weapon.lv ? '#ffd166' : 'rgba(255,255,255,0.3)', 2);
    let x = 752;
    for (const k of ['shield', 'speed']) {
      if (ship[k] <= 0) continue;
      const frac = ship[k] / POWERS[k].time;
      ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.arc(x, 36, 24, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = POWERS[k].color; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.arc(x, 36, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); ctx.stroke();
      powerIcon(ctx, k, x, 36, 17);
      x -= 62;
    }
    // boss health / Chimera health / progress through the sector
    if (chim && phase !== 'chimeraIntro' && !chim.beaten) {
      const bw = 340, bx = W / 2 - bw / 2;
      D.text(ctx, 'CHIMERA', W / 2, 20, { size: 20, color: '#e0aaff' });
      for (let i = 0; i < 4; i++) {
        const seg = (bw - 18) / 4, sx = bx + i * (seg + 6);
        const frac = i < chim.phase ? 0 : i > chim.phase ? 1 : chim.hp / chim.max;
        D.meter(ctx, sx, 34, seg, 18, frac, ['#ff8c42', '#80ffdb', '#2a9d8f', '#f72585'][i]);
      }
    } else if (boss && phase !== 'bossWarn') {
      const bw = boss.kind === 'mini' ? 220 : 300, bx = W / 2 - bw / 2;
      D.meter(ctx, bx, 18, bw, 22, boss.hp / boss.max, boss.kind === 'mini' ? '#ff8c42' : '#ef476f');
      D.text(ctx, boss.def.name, W / 2, 56, { size: 18 });
    } else if (phase === 'waves' && !sector.endless) {
      // the sector map: wave dots, the mini boss, more dots, the big boss
      const n1 = sector.waves[0], n2 = sector.waves[1];
      const dots = [];
      for (let i = 0; i < n1; i++) dots.push({ kind: 'w', done: part > 1 || i < waveIdx, now: part === 1 && i === waveIdx });
      dots.push({ kind: 'm', done: part > 1 });
      for (let i = 0; i < n2; i++) dots.push({ kind: 'w', done: part === 2 && i < waveIdx, now: part === 2 && i === waveIdx });
      dots.push({ kind: 'b' });
      const x0 = W / 2 - (dots.length - 1) * 13;
      dots.forEach((d, i) => {
        const dx = x0 + i * 26;
        if (d.kind === 'w') D.circle(ctx, dx, 28, 7, d.done ? '#06d6a0' : d.now ? '#ffd166' : 'rgba(255,255,255,0.3)', 3);
        else D.star(ctx, dx, 28, d.kind === 'm' ? 9 : 13, d.done ? '#06d6a0' : d.kind === 'm' ? '#ff8c42' : '#ef476f', 3);
      });
    } else if (sector.endless && phase === 'waves') {
      D.text(ctx, 'Loop ' + (endlessLoop + 1) + '  Wave ' + (waveIdx + 1), W / 2, 30, { size: 24 });
    }
  }

  function render(g, ctx) {
    if (!sector) { ctx.fillStyle = THEMES.moon.sky[0]; ctx.fillRect(0, 0, W, H); return; }
    ART.tick(clock);
    ctx.save();
    if (shake > 0) ctx.translate(Math.sin(clock * 70) * shake * 8, Math.cos(clock * 53) * shake * 6);
    drawBackground(ctx);

    if (chim) {
      ctx.save(); ctx.globalAlpha = chim.alpha;
      if (chim.beaten) {
        const k = Math.min(1, chim.endT / 2);
        ctx.globalAlpha = 1 - k;
        drawChimera(ctx);
        ctx.globalAlpha = 1;
        ART.drawConstellation(ctx, chim.x - 40, chim.y, k);
      } else drawChimera(ctx);
      ctx.restore();
      if (!chim.beaten && chim.mode !== 'between' && chim.fighting) drawWarnings(ctx, chim);
    }
    for (const p of powerups) {
      const bob = 1 + Math.sin(p.t * 6) * 0.06;
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(p.x, p.y, 28 * bob, 0, Math.PI * 2); ctx.fill();
      powerIcon(ctx, p.kind, p.x, p.y, 20 * bob);
    }
    for (const c of capsules) drawCapsule(ctx, c);
    if (boss) drawBoss(ctx, boss);
    for (const e of enemies) ART.drawEnemy(ctx, e);
    // frozen enemies get a frosty ring
    for (const e of enemies) if (e.slow > 0) { ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(155,246,255,0.8)'; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 6, 0, Math.PI * 2); ctx.stroke(); }
    // bubbled enemies floating away
    for (const f of floaters) {
      ctx.save();
      ctx.translate(f.e.x, f.e.y); ctx.scale(0.8, 0.8); ctx.translate(-f.e.x, -f.e.y);
      ART.drawEnemy(ctx, f.e);
      ctx.restore();
      const r = f.e.r + 12 + f.t * 10;
      D.circle(ctx, f.e.x, f.e.y, r, 'rgba(189,224,254,0.35)', 3);
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(f.e.x - r * 0.45, f.e.y - r * 0.45, 4, 8, 0.7, 0, Math.PI * 2); ctx.fill();
    }
    for (const s of shots) drawShot(ctx, s);
    for (const rg of rings) {
      ctx.globalAlpha = 1 - rg.r / rg.max;
      ctx.lineWidth = rg.fx ? 6 : 8; ctx.strokeStyle = rg.fx ? '#ffd166' : '#80ffdb';
      ctx.beginPath(); ctx.arc(rg.x, rg.y, rg.r, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    for (const bo of bolts) {
      for (const [wdt, col] of [[8, INK], [4, '#ffd166']]) {
        ctx.lineWidth = wdt; ctx.strokeStyle = col; ctx.beginPath();
        bo.path.forEach((p, i) => { const jx = i ? math.rand(-6, 6) : 0, jy = i ? math.rand(-6, 6) : 0; if (i) ctx.lineTo(p.x + jx, p.y + jy); else ctx.moveTo(p.x, p.y); });
        ctx.stroke();
      }
    }
    if (beamOn) {
      const lv = ship.weapon.lv, y = ship.y, x0 = ship.x + 34;
      const bw = WEAPON.beam.width[lv - 1] + Math.sin(clock * 30) * 2;
      RAINBOW.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x0, y - bw + i * (bw * 2 / RAINBOW.length), W - x0, bw * 2 / RAINBOW.length + 0.5); });
      ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeRect(x0, y - bw, W - x0 + 10, bw * 2);
    }
    // drones and orbiting stars
    for (const d of drones) { D.circle(ctx, d.x, d.y, 11, '#adb5bd', 3); D.circle(ctx, d.x + 3, d.y, 4, '#06d6a0', 0); }
    for (const st of orbitStars()) D.star(ctx, st.x, st.y, 11, '#ffc93c', 3);
    // ship (flashes while it can't be hit)
    const s = ship;
    const show = s.inv <= 0 || finished || Math.floor(s.inv * 12) % 2 === 0;
    if (show) {
      const bonk = s.bonk > 0 ? Math.sin(s.bonk * 40) * 0.25 : 0;
      drawShip(ctx, s.x, s.y, shipDesign, { tilt: s.tilt + bonk });
      if (s.bonk > 0) for (let i = 0; i < 3; i++) { const a = clock * 8 + i * 2.1; D.star(ctx, s.x + Math.cos(a) * 30, s.y - 34 + Math.sin(a) * 8, 8, '#ffd166', 2); }
    }
    if (s.shield > 0) {
      const blink = s.shield < 2 && Math.floor(s.shield * 8) % 2 === 0;
      if (!blink) {
        D.circle(ctx, s.x + 4, s.y, 46 + Math.sin(clock * 5) * 2, 'rgba(142,202,230,0.28)', 4);
        ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.ellipse(s.x - 20, s.y - 24, 6, 11, 0.8, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (s.speed > 0 && Math.random() < 0.5) g.particles.burst(s.x - 36, s.y, { count: 1, angle: Math.PI, spread: 0.4, speed: 200, gravity: 0, size: 8, life: 0.3, colors: ['#06d6a0', '#fff'] });

    for (const b of ebullets) drawBullet(ctx, b);
    for (const h of hearts) { ctx.globalAlpha = 1 - h.t / h.life; ART.heart(ctx, h.x, h.y, 9, h.c, 2); }
    ctx.globalAlpha = 1;
    for (const p of popups) { ctx.globalAlpha = Math.min(1, (1 - p.t) * 2); D.text(ctx, p.text, p.x, p.y, { size: p.size, color: p.color }); }
    ctx.globalAlpha = 1;
    ctx.restore();

    drawHUD(g, ctx);

    if (banner) {
      const k = Math.min(1, banner.t * 3);
      ctx.globalAlpha = k;
      if (banner.small) {     // a new weapon: its name near the top
        D.text(ctx, banner.text, W / 2, 112, { size: 38, color: banner.color || '#ffd166' });
        if (banner.sub) D.text(ctx, banner.sub, W / 2, 150, { size: 24 });
      } else {
        const big = banner.big;
        D.text(ctx, banner.text, W / 2, H / 2 - 40, { size: big ? 86 : 64, color: big ? '#e0aaff' : /boss/i.test(banner.text) ? '#ff8fab' : '#ffd166' });
        if (banner.sub) D.text(ctx, banner.sub, W / 2, H / 2 + (big ? 34 : 20), { size: big ? 36 : 30 });
      }
      ctx.globalAlpha = 1;
    }
  }
  function drawChimera(ctx) {
    const c = chim;
    ART.drawChimera(ctx, { x: c.x, y: c.y, t: c.t, jaw: c.jaw, part: c.part, done: c.done, flash: c.flash, snake: c.snake,
      snakeOpen: c.snakeOpen, snakeAngle: c.atk === 'strike' && c.mode === 'act' ? 0 : Math.sin(c.t * 2) * 0.15, beaten: c.beaten,
      hit: c.fighting && c.mode !== 'between' && phase !== 'chimeraIntro' ? chimHit() : null });
  }

  // ---------------------------------------------------------------
  // Menus: sector tiles, ship picker, weapon book, auto-fire switch
  // ---------------------------------------------------------------
  function sectorPic(themeName, kind) {
    const t = THEMES[themeName];
    const [c, pk] = t.planets[0];
    let extra = '';
    if (pk === 'ring') extra = `<ellipse cx="60" cy="35" rx="40" ry="9" fill="none" stroke="#ff8c42" stroke-width="5" transform="rotate(-14 60 35)"/>`;
    if (pk === 'swirl') extra = `<path d="M52 30 Q60 22 68 30 Q60 42 52 34" fill="none" stroke="#fff" stroke-width="4"/>`;
    if (pk === 'moon') extra = `<circle cx="54" cy="30" r="5" fill="rgba(0,0,0,0.15)"/><circle cx="67" cy="42" r="4" fill="rgba(0,0,0,0.15)"/>`;
    if (pk === 'stripe') extra = `<rect x="40" y="28" width="40" height="5" fill="rgba(255,255,255,0.4)"/><rect x="40" y="38" width="40" height="5" fill="rgba(255,255,255,0.4)"/>`;
    let inner = `<circle cx="60" cy="35" r="20" fill="${c}" stroke="#2b2b2b" stroke-width="3"/>${extra}`;
    if (kind === 'endless') inner = `<path d="M40 35 C40 25 55 25 60 35 C65 45 80 45 80 35 C80 25 65 25 60 35 C55 45 40 45 40 35 Z" fill="none" stroke="#ffd166" stroke-width="6"/>`;
    if (kind === 'chimera') inner = `<path d="M30 14 Q42 0 44 22 M90 14 Q78 0 76 22" fill="none" stroke="#f1e3d3" stroke-width="5" stroke-linecap="round"/>
      <path d="M60 8 L70 18 L84 14 L82 28 L96 34 L84 42 L88 56 L72 52 L60 64 L48 52 L32 56 L36 42 L24 34 L38 28 L36 14 L50 18 Z" fill="#ff3d6e" stroke="#2b2b2b" stroke-width="3"/>
      <circle cx="60" cy="36" r="17" fill="#d9a066" stroke="#2b2b2b" stroke-width="3"/>
      <path d="M44 30 L56 34 M76 30 L64 34" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="52" cy="36" rx="4" ry="3" fill="#ffd166" stroke="#2b2b2b" stroke-width="1.5"/><ellipse cx="68" cy="36" rx="4" ry="3" fill="#ffd166" stroke="#2b2b2b" stroke-width="1.5"/>
      <path d="M52 44 Q60 52 68 44 Z" fill="#5a189a" stroke="#2b2b2b" stroke-width="2"/>`;
    return `<svg viewBox="0 0 120 70"><rect width="120" height="70" rx="8" fill="${t.sky[0]}"/><circle cx="15" cy="12" r="2" fill="#fff"/><circle cx="100" cy="18" r="2" fill="#fff"/><circle cx="90" cy="58" r="2" fill="#fff"/><circle cx="24" cy="56" r="2" fill="#fff"/>${inner}</svg>`;
  }

  function levels(g) {
    const list = SECTORS.map((s, i) => {
      const prev = i === 0 || (g.save.levels[SECTORS[i - 1].id] || {}).done;
      return { ...s, pic: sectorPic(s.theme), locked: !prev, meta: 'Sector ' + (i + 1) };
    });
    list.push({ ...FINAL, pic: sectorPic('lair', 'chimera'), locked: !(g.save.levels.s10 || {}).done, meta: 'The final battle', section: 'Final' });
    const rec = g.save.levels.endless || {};
    list.push({ ...ENDLESS, pic: sectorPic('candy', 'endless'), locked: !(g.save.levels.s1 || {}).done,
      meta: (rec.stars != null ? Arcade.starsHTML(rec.stars) : '') + (rec.score ? ' ' + rec.score : '') });
    return list;
  }

  function shipSVG(d) {
    const fill = d.color === 'rainbow' ? 'url(#rb)' : d.color;
    const defs = d.color === 'rainbow' ? `<defs><linearGradient id="rb">${RAINBOW.map((c, i) => `<stop offset="${i / 5}" stop-color="${c}"/>`).join('')}</linearGradient></defs>` : '';
    const L = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"';
    let body;
    if (d.shape === 'saucer') body = `<ellipse cx="50" cy="40" rx="38" ry="14" fill="${fill}" ${L}/><path d="M30 38 A20 20 0 0 1 70 38 Z" fill="#bde0fe" ${L}/><circle cx="50" cy="28" r="7" fill="#ffd6a5" stroke="#2b2b2b" stroke-width="2"/>`;
    else if (d.shape === 'jet') body = `<path d="M38 28 L22 8 L36 8 L60 28 Z M38 44 L22 64 L36 64 L60 44 Z" fill="${d.accent}" ${L}/><path d="M16 24 H64 Q90 32 92 36 Q90 40 64 48 H16 Z" fill="${fill}" ${L}/><ellipse cx="56" cy="34" rx="12" ry="8" fill="#bde0fe" ${L}/>`;
    else body = `<path d="M28 24 Q14 6 12 10 L18 28 Z M28 48 Q14 66 12 62 L18 44 Z" fill="${d.accent}" ${L}/><path d="M16 21 H62 Q88 24 94 36 Q88 48 62 51 H16 Q10 36 16 21 Z" fill="${fill}" ${L}/><circle cx="54" cy="36" r="10" fill="#bde0fe" ${L}/>`;
    return `<svg viewBox="0 0 100 72">${defs}<path d="M14 30 Q0 36 14 42 Z" fill="#ff8c42" stroke="#2b2b2b" stroke-width="3"/>${body}</svg>`;
  }
  function shipIconSVG() { return shipSVG(shipDesign || SHIPS[0]); }
  function WEAPON_SVG(id) { return `<img alt="" src="${ART.weaponIconURL(WEAPON[id])}" style="width:100%;height:100%">`; }

  function extraMenu(g) {
    const wrap = Arcade.h('div');
    checkUnlocks(g);                      // (in case you already have enough stars)
    const n = totalStars(g);
    wrap.appendChild(Arcade.h('h2', { class: 'ar-title', style: 'font-size:24px;margin-top:16px' }, 'Pick your ship'));
    const row = Arcade.h('div', { class: 'ar-grid' });
    const current = pickedShip(g).id;
    for (const s of SHIPS) {
      const ok = shipUnlocked(g, s);
      const tile = Arcade.h('button', { type: 'button', class: 'ar-tile' + (ok ? '' : ' locked') + (s.id === current ? ' picked' : '') },
        `<div class="pic">${shipSVG(s)}</div><div>${s.name}</div>` +
        `<div class="meta">${ok ? '' : icons.star(true).replace('<svg', '<svg style="width:18px;height:18px;vertical-align:middle"') + ' ' + n + ' / ' + s.need}</div>` +
        (ok ? '' : `<div class="lock">${icons.lock}</div>`));
      tile.addEventListener('click', () => {
        if (!ok) { Arcade.sfx('bonk'); return; }
        Arcade.sfx('click');
        g.save.data.ship = s.id; g.store();
        row.querySelectorAll('.ar-tile').forEach(t => t.classList.remove('picked'));
        tile.classList.add('picked');
      });
      row.appendChild(tile);
    }
    wrap.appendChild(row);
    // the Weapon Book: every special weapon you've found (? for the ones still out there)
    const f = found(g);
    wrap.appendChild(Arcade.h('h2', { class: 'ar-title', style: 'font-size:24px;margin-top:16px' }, `Weapon Book  ${f.length} / ${SPECIALS.length}`));
    const book = Arcade.h('div', { class: 'sp-book', style: 'display:flex;flex-wrap:wrap;justify-content:center;gap:10px;max-width:530px;margin:0 auto' });
    for (const w of SPECIALS) {
      const got = f.includes(w.id);
      book.appendChild(Arcade.h('div', { title: got ? w.name : '???', style: 'width:96px;text-align:center;font-weight:800;font-size:13px;color:#fff' },
        `<img alt="" src="${ART.weaponIconURL(w, !got)}" style="width:62px;height:62px;display:block;margin:0 auto 2px">${got ? w.name : '???'}`));
    }
    wrap.appendChild(book);
    // auto-fire on/off (Easy always has it on)
    const btns = Arcade.h('div', { class: 'ar-btns' });
    const af = Arcade.h('button', { type: 'button', class: 'ar-btn white' });
    const paint = () => { af.innerHTML = `${icons.fire}<span>Auto-fire: ${autoFire(g) ? 'on' : 'off'}${g.difficulty === 'easy' ? ' (Easy)' : ''}</span>`; };
    paint();
    af.addEventListener('click', () => {
      Arcade.sfx('click');
      if (g.difficulty === 'easy') { af.animate([{ transform: 'rotate(-3deg)' }, { transform: 'rotate(3deg)' }, { transform: 'none' }], 250); return; }
      g.save.data.autofire = !autoFire(g); g.store(); paint();
    });
    btns.appendChild(af);
    wrap.appendChild(btns);
    return wrap;
  }

  // ---------------------------------------------------------------
  // Start the game
  // ---------------------------------------------------------------
  const S = (inner) => `<svg viewBox="0 0 80 80">${inner}</svg>`;
  const howShip = `<g transform="translate(6 22) scale(0.6)">${shipSVG(SHIPS[0]).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`;
  const LINK = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
  window.__spaceArt = ART;          // test-only: draw the art on its own
  Arcade.start({
    id: 'space',
    trophies: [
      { id: 'clear', name: 'Sector clear', how: 'Clear a sector' },
      { id: 'mini', name: 'Mini boss!', how: 'Bubble a mini boss' },
      { id: 'boss', name: 'Big friend', how: 'Bubble a big boss' },
      { id: 'life', name: 'Extra life', how: 'Catch a +1 life' },
      { id: 'combo20', name: 'Combo king', how: 'A 20 combo' },
      { id: 'maxed', name: 'Powered up', how: 'Power a weapon up to level 3' },
      { id: 'arsenal10', name: 'Weapon collector', how: 'Find 10 special weapons' },
      { id: 'arsenal', name: 'Full Weapon Book', how: 'Find all 20 special weapons' },
      { id: 'sector10', name: 'Edge of the Void', how: 'Clear all 10 sectors' },
      { id: 'chimera', name: 'Galaxy saver', how: 'Calm Chimera, the Eater of Worlds' },
      { id: 'nohit', name: 'Untouchable', how: 'Clear a sector without a bonk', secret: true },
      { id: 'chimeraNoHit', name: 'Legend', how: 'Beat the Chimera without a bonk', secret: true },
      { id: 'loop3', name: 'Space marathon', how: 'Reach loop 3 in Endless', secret: true },
    ],
    logo: Arcade.logo({
      badge: Arcade.badges.space,
      title: 'Space Defender', colors: ['#9bf6ff', '#9b5de5'], bg: '#3d348b', art: `<circle cx="30" cy="30" r="3" fill="#fff"/><circle cx="200" cy="20" r="3" fill="#fff"/><circle cx="120" cy="50" r="2" fill="#fff"/><circle cx="220" cy="90" r="2" fill="#fff"/>
              <g class="wobble"><ellipse cx="170" cy="50" rx="32" ry="14" fill="#06d6a0" ${LINK}/><path d="M152 46 A18 18 0 0 1 188 46" fill="#bde0fe" ${LINK}/><circle cx="170" cy="40" r="5" fill="#2b2b2b"/></g>
              <path d="M70 140 L90 96 L110 140 Z" fill="#ffd166" ${LINK}/><rect x="84" y="112" width="12" height="10" rx="3" fill="#118ab2"/>
              <rect x="86" y="70" width="8" height="16" rx="4" fill="#f15bb5"/>` }),
    menuMusic: { tempo: 118, root: 57, scale: 'minor', prog: [[1, 6, 3, 7], [6, 7, 1, 1], [4, 5, 6, 7]], drums: 'halftime', bass: 'pulse', lead: 'saw', harmony: 'choir', pad: 'choir', arp: true, seed: 1701,
        tune: { A: '1/4 5 8 7/2 5 | 6/4 3 1/8 | 3/4 5 7 10 | 9/8 7',
                B: '10/8 8/4 6 | 9/8 7/4 4 | 8/4 10 12 10 | 8/16',
                C: '8/8 6 | 7/8 5 | 6/8 8 | 7/16' } },   // the title/menu song
    title: 'Space Defender',
    view: { w: W, h: H },
    background: THEMES.moon.bg,
    music: () => song,                   // the sector's song (the big boss swaps in its own)
    levelsTitle: 'Pick a sector',
    // the first 3 sectors are gentle (Easy, auto-fire on); after that the sectors get harder by themselves
    levelDifficulty: (lv) => (lv.tier || 1) <= 3 ? 'easy' : 'normal',
    howTo: [
      { pic: S(`${howShip}<path d="M64 14 V30 M56 22 H72" stroke="#ffd166" stroke-width="5" stroke-linecap="round"/><path d="M64 50 V66 M56 58 H72" stroke="#ffd166" stroke-width="5" stroke-linecap="round" opacity="0.6"/>`), text: 'Fly your ship', keys: 'Arrows / WASD or drag' },
      { pic: S(`${howShip.replace('translate(6 22)', 'translate(0 22)')}<circle cx="62" cy="40" r="7" fill="#9be7ff" stroke="#2b2b2b" stroke-width="3"/><circle cx="74" cy="40" r="5" fill="#ffafcc" stroke="#2b2b2b" stroke-width="3"/>`), text: 'Bubble the silly robots', keys: 'Space (auto on Easy & touch)' },
      { pic: S(`<rect x="12" y="20" width="56" height="44" rx="20" fill="#fff" stroke="#2b2b2b" stroke-width="4"/><circle cx="40" cy="42" r="15" fill="#ff5fa2" stroke="#2b2b2b" stroke-width="3"/><path d="M40 52 C30 46 30 38 35 36 C38 35 40 37 40 39 C40 37 42 35 45 36 C50 38 50 46 40 52 Z" fill="#fff"/><path d="M8 12 L14 16 M72 12 L66 16 M40 4 V12" stroke="#ffd166" stroke-width="4" stroke-linecap="round"/>`), text: 'Grab presents: new weapons!' },
      { pic: S(`<circle cx="40" cy="40" r="26" fill="#ff5fa2" stroke="#2b2b2b" stroke-width="4"/><circle cx="31" cy="31" r="7" fill="#fff"/><path d="M8 70 L20 58 M72 70 L60 58" stroke="#ffd166" stroke-width="5" stroke-linecap="round"/>`), text: 'Dodge the bubbles. Watch for the !' },
      { pic: S(`<ellipse cx="40" cy="38" rx="28" ry="30" fill="#ff8fab" stroke="#2b2b2b" stroke-width="4"/><rect x="22" y="28" width="36" height="24" rx="8" fill="#2e2a72" stroke="#2b2b2b" stroke-width="3"/><circle cx="32" cy="38" r="5" fill="#fff"/><circle cx="48" cy="38" r="5" fill="#fff"/>`), text: 'Mini boss, then big boss!' },
    ],
    levels,
    extraMenu,
    setup,
    update,
    draw: render,
    onFinish(g) { checkUnlocks(g); },
  });
})();
