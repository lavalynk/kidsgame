// =====================================================================
// Space Defender — a friendly side-scrolling space shooter.
//
// How it works:
//  * Your ship lives on the left part of the screen. Space friends that
//    got a bit too silly (cartoon robots and goofy aliens) fly in from
//    the right. Your ship blows "bubble shots" at them. A bubbled enemy
//    floats away inside its bubble and pops into stars and hearts.
//  * Each sector (level) is a list of WAVES. A wave is a small list of
//    "groups" written as plain data below: what type, how many, when.
//    When a wave is cleared the next one starts. After the last wave a
//    BOSS shows up. Bubble the boss and the sector is done!
//  * Bosses do 2-3 different attacks. Every attack is shown first
//    (a flashing warning) so kids have time to move out of the way.
//  * Bubbling enemies quickly one after another builds a COMBO, which
//    multiplies points. Getting bonked resets it.
//  * Getting bonked never "destroys" the ship: it bonks, flashes and
//    loses one life. No lives left = "Nice try!".
//  * Enemies sometimes drop power-ups: shield, speed, triple shot,
//    rainbow beam, and +1 life.
// =====================================================================
(function () {
  const { draw, icons, math } = Arcade;
  const D = draw;
  const INK = D.INK;
  const W = 960, H = 540;
  const STEP = 1 / 120;

  // The ship may roam the left part of the screen only.
  const SHIP_MIN_X = 50, SHIP_MAX_X = 560, SHIP_MIN_Y = 56, SHIP_MAX_Y = H - 34;
  const SHIP_R = 16;                 // the ship's (kind, small) hit circle

  // ---------------------------------------------------------------
  // Looks for each sector: background colors and what floats behind.
  // ---------------------------------------------------------------
  const THEMES = {
    moon:  { sky: ['#14163d', '#2e2a72'], bg: '#14163d', planets: [['#c9d6df', 'moon', 70], ['#ffafcc', 'plain', 30]], ground: '#9aa5b8', enemy: ['#8ecae6', '#ffd166', '#06d6a0'] },
    candy: { sky: ['#3a1c5c', '#a23b8f'], bg: '#3a1c5c', planets: [['#ff8fab', 'swirl', 60], ['#ffd166', 'stripe', 36]], cloud: 'rgba(255,175,204,0.16)', enemy: ['#ff8fab', '#9b5de5', '#06d6a0'] },
    rings: { sky: ['#0b2545', '#13597a'], bg: '#0b2545', planets: [['#ffd166', 'ring', 80], ['#8ecae6', 'plain', 26]], enemy: ['#06d6a0', '#ff8c42', '#8ecae6'] },
  };

  // ---------------------------------------------------------------
  // Sectors (the levels). Each wave is a list of groups:
  //   at:  seconds after the wave starts
  //   type: bobber (wavy flier), squad (formation), diver (swooper),
  //         rock (slow, takes several hits), shooter (blows slow bubbles)
  //   n / gap: how many and how far apart (seconds)
  //   y: where they fly in ('rand' = anywhere)
  // ---------------------------------------------------------------
  const SECTORS = [
    { id: 's1', name: 'Moon Base', theme: 'moon', boss: 'balloon',
      waves: [
        [{ at: 0, type: 'bobber', n: 5, gap: 0.7, y: 170 }, { at: 4, type: 'bobber', n: 5, gap: 0.7, y: 370 }],
        [{ at: 0, type: 'squad', rows: 2, cols: 3 }, { at: 5, type: 'rock', n: 1, y: 270 }],
        [{ at: 0, type: 'diver', n: 4, gap: 1.1 }, { at: 3, type: 'shooter', n: 1 }, { at: 6, type: 'bobber', n: 4, gap: 0.6, y: 'rand' }],
        [{ at: 0, type: 'squad', rows: 2, cols: 4 }, { at: 3, type: 'shooter', n: 2, gap: 2.5 }, { at: 7, type: 'rock', n: 2, gap: 2 }],
      ] },
    { id: 's2', name: 'Candy Nebula', theme: 'candy', boss: 'cookie',
      waves: [
        [{ at: 0, type: 'bobber', n: 6, gap: 0.6, y: 'rand' }, { at: 3, type: 'diver', n: 3, gap: 1 }],
        [{ at: 0, type: 'squad', rows: 3, cols: 3 }, { at: 4, type: 'shooter', n: 2, gap: 2 }],
        [{ at: 0, type: 'rock', n: 3, gap: 2.5 }, { at: 1, type: 'bobber', n: 6, gap: 0.6, y: 200 }, { at: 5, type: 'diver', n: 4, gap: 0.9 }],
        [{ at: 0, type: 'squad', rows: 2, cols: 4 }, { at: 2, type: 'shooter', n: 2, gap: 3 }, { at: 6, type: 'bobber', n: 6, gap: 0.5, y: 380 }],
        [{ at: 0, type: 'diver', n: 6, gap: 0.8 }, { at: 3, type: 'rock', n: 2, gap: 2 }, { at: 5, type: 'shooter', n: 2, gap: 2 }],
      ] },
    { id: 's3', name: 'Ring Planet', theme: 'rings', boss: 'hula',
      waves: [
        [{ at: 0, type: 'squad', rows: 2, cols: 4 }, { at: 4, type: 'diver', n: 4, gap: 0.8 }],
        [{ at: 0, type: 'bobber', n: 8, gap: 0.5, y: 'rand' }, { at: 2, type: 'shooter', n: 2, gap: 2 }, { at: 6, type: 'rock', n: 2, gap: 2 }],
        [{ at: 0, type: 'squad', rows: 3, cols: 3 }, { at: 3, type: 'diver', n: 5, gap: 0.8 }],
        [{ at: 0, type: 'rock', n: 3, gap: 1.5 }, { at: 2, type: 'shooter', n: 3, gap: 2 }, { at: 6, type: 'bobber', n: 6, gap: 0.5, y: 150 }],
        [{ at: 0, type: 'squad', rows: 2, cols: 5 }, { at: 4, type: 'diver', n: 6, gap: 0.7 }, { at: 8, type: 'shooter', n: 2, gap: 2 }],
        [{ at: 0, type: 'bobber', n: 8, gap: 0.45, y: 'rand' }, { at: 3, type: 'rock', n: 3, gap: 2 }, { at: 5, type: 'squad', rows: 2, cols: 3 }],
      ] },
  ];
  const ENDLESS = { id: 'endless', name: 'Endless', theme: 'moon', endless: true };

  // Points for bubbling each enemy type (before the combo multiplier).
  const POINTS = { bobber: 100, squad: 100, diver: 150, shooter: 200, rock: 300, boss: 5000 };

  // Ships you can unlock with stars (just looks, they all fly the same).
  const SHIPS = [
    { id: 'zippy',   name: 'Zippy',    color: '#ef476f', accent: '#ffd166', shape: 'rocket', need: 0 },
    { id: 'bluebird', name: 'Bluebird', color: '#118ab2', accent: '#8ecae6', shape: 'jet',    need: 3 },
    { id: 'minty',   name: 'Minty',    color: '#06d6a0', accent: '#ffd166', shape: 'saucer', need: 5 },
    { id: 'sunny',   name: 'Sunny',    color: '#ffc93c', accent: '#ef476f', shape: 'rocket', need: 7 },
    { id: 'grape',   name: 'Grape',    color: '#9b5de5', accent: '#f15bb5', shape: 'jet',    need: 9 },
    { id: 'rainbow', name: 'Rainbow',  color: 'rainbow', accent: '#ffffff', shape: 'saucer', need: 11 },
  ];
  const RAINBOW = ['#ef476f', '#ff8c42', '#ffd166', '#06d6a0', '#118ab2', '#9b5de5'];

  // Power-ups: how long they last (seconds) and their colors.
  const POWERS = {
    shield:  { time: 15, color: '#8ecae6' },
    speed:   { time: 10, color: '#06d6a0' },
    triple:  { time: 10, color: '#ff8c42' },
    rainbow: { time: 5,  color: '#f15bb5' },
    life:    { time: 0,  color: '#ef476f' },
  };

  // ---------------------------------------------------------------
  // Game state (reset in setup)
  // ---------------------------------------------------------------
  let G = null;            // the kit's g object
  let sector, theme, ship, shipDesign;
  let shots, enemies, groups, ebullets, powerups, floaters, hearts, popups;
  let stars, planets;
  let lives, startLives, score, combo, comboT, bestCombo, hitsTaken, defeated, potential, sinceDrop;
  let waveIdx, waveT, spawnQueue, phase, phaseT, banner, boss, finished, clock, endlessLoop;
  let fireCD, beamOn;
  const test = { god: false };   // test-only: ignore hits

  // Difficulty knobs, read from g.pick in setup
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

  function setup(g, level) {
    G = g;
    sector = level || SECTORS[0];
    theme = THEMES[sector.theme] || THEMES.moon;
    document.body.style.setProperty('--ar-bg', theme.bg);
    shipDesign = pickedShip(g);

    K = {
      lives: g.pick(5, 3, 3),
      bulletSpeed: g.pick(115, 165, 215),     // enemy bubble speed (px/s)
      fireGap: g.pick(2.8, 1.9, 1.35),        // seconds between a shooter's shots
      count: g.pick(0.7, 1, 1.25),            // how many enemies in each group
      hp: g.pick(0, 0, 1),                    // extra health for enemies
      speed: g.pick(0.85, 1, 1.15),           // how fast enemies fly
      maxEnemies: g.pick(8, 12, 16),          // never more than this at once
      maxBullets: g.pick(6, 12, 18),          // ... or this many enemy bubbles
      bossHp: g.pick(45, 70, 95),
      drop: g.pick(0.16, 0.11, 0.08),         // chance an enemy drops a power-up
      rest: g.pick(2.0, 1.4, 1.0),            // boss pause between attacks
      bulletR: g.pick(11, 10, 9),
    };

    ship = { x: 150, y: H / 2, vx: 0, vy: 0, inv: 0, bonk: 0, shield: 0, speed: 0, triple: 0, rainbow: 0, tilt: 0,
             dragX: 0, dragY: 0, px: 0, py: 0 };
    shots = []; enemies = []; groups = []; ebullets = []; powerups = []; floaters = []; hearts = []; popups = [];
    lives = startLives = K.lives;
    score = 0; combo = 0; comboT = 0; bestCombo = 0; hitsTaken = 0; defeated = 0; potential = 0; sinceDrop = 0;
    waveIdx = -1; waveT = 0; spawnQueue = []; boss = null; finished = false; clock = 0; endlessLoop = 0;
    fireCD = 0; beamOn = false;
    phase = 'intro'; phaseT = 2.2;
    banner = { text: sector.name, sub: sector.endless ? 'How far can you go?' : 'Get ready!', t: 2.2 };
    makeBackground();
    g.sfx('go');

    // peek hooks for automated tests
    window.__spaceState = () => ({
      x: ship.x, y: ship.y, lives, score, combo, mult: mult(), wave: waveIdx + 1,
      waves: sector.endless ? null : sector.waves.length, phase,
      enemies: enemies.length, bossHp: boss ? Math.max(0, Math.ceil(boss.hp)) : null, bossMax: boss ? boss.max : null,
      bullets: ebullets.length, shots: shots.length, powerups: powerups.length,
      power: { shield: ship.shield, speed: ship.speed, triple: ship.triple, rainbow: ship.rainbow },
      hits: hitsTaken, defeated, bestCombo, finished, god: test.god,
    });
    window.__spaceTest = {
      god(on) { test.god = !!on; },
      // run the game faster than real time (only while playing)
      step(seconds) { let n = Math.round(seconds / STEP); while (n-- > 0 && G.state === 'play') { update(G, STEP); G.particles.update(STEP); } },
      // drop a power-up right in front of the ship
      give(kind) { powerups.push({ kind, x: ship.x + 60, y: ship.y, t: 0 }); },
      bulletsAt(x, y) { ebullets.push(makeBullet(x, y, -K.bulletSpeed, 0)); },
      // positions, so a test bot can aim and dodge
      peek() {
        return { enemies: enemies.map(e => [e.x, e.y]), bullets: ebullets.map(b => [b.x, b.y, b.vx, b.vy]),
                 boss: boss ? [boss.x, boss.y, boss.mode, boss.atk, boss.beamY, boss.chargeY] : null, powerups: powerups.map(p => [p.x, p.y]) };
      },
    };
  }

  // ---------------------------------------------------------------
  // Background: three layers of stars + slow planets (parallax)
  // ---------------------------------------------------------------
  function makeBackground() {
    stars = [];
    const layers = [[45, 20, 1.5], [30, 55, 2.5], [16, 120, 3.5]]; // count, speed, size
    for (const [n, sp, sz] of layers) for (let i = 0; i < n; i++) {
      stars.push({ x: Math.random() * W, y: Math.random() * H, sp, sz, tw: Math.random() * 6 });
    }
    planets = theme.planets.map(([color, kind, r], i) => ({ color, kind, r, x: 300 + i * 520 + Math.random() * 100, y: 120 + i * 230 + Math.random() * 40, sp: 6 + i * 8 }));
  }

  function setTheme(name) {
    theme = THEMES[name];
    document.body.style.setProperty('--ar-bg', theme.bg);
    makeBackground();
  }

  function mult() { return Math.min(5, 1 + Math.floor(combo / 4)); }

  function popup(text, x, y, color = '#ffd166', size = 26) { popups.push({ text, x, y, t: 0, color, size }); }

  // ---------------------------------------------------------------
  // Waves: turn the wave data into a timed list of spawns
  // ---------------------------------------------------------------
  function waveData(i) {
    if (!sector.endless) return sector.waves[i];
    // Endless: build a wave that grows a little each time
    const lvl = i + endlessLoop * 4;
    const pool = ['bobber', 'squad', 'diver', 'bobber'];
    if (lvl >= 1) pool.push('shooter');
    if (lvl >= 2) pool.push('rock');
    const list = [];
    const nGroups = 2 + Math.min(3, Math.floor(lvl / 2));
    for (let k = 0; k < nGroups; k++) {
      const type = pool[(Math.random() * pool.length) | 0];
      const at = k * 3;
      if (type === 'squad') list.push({ at, type, rows: 2 + (lvl > 5 ? 1 : 0), cols: 3 + Math.min(2, Math.floor(lvl / 3)) });
      else if (type === 'rock') list.push({ at, type, n: 1 + Math.min(2, Math.floor(lvl / 4)), gap: 2 });
      else if (type === 'shooter') list.push({ at, type, n: 1 + Math.min(2, Math.floor(lvl / 3)), gap: 2 });
      else list.push({ at, type, n: 4 + Math.min(4, lvl), gap: 0.6, y: 'rand' });
    }
    return list;
  }

  function startWave(i) {
    waveIdx = i;
    waveT = 0;
    spawnQueue = [];
    for (const grp of waveData(i)) {
      if (grp.type === 'squad') {
        const cols = Math.max(2, Math.round(grp.cols * K.count));
        spawnQueue.push({ t: grp.at, type: 'squad', rows: grp.rows, cols });
        continue;
      }
      const n = Math.max(1, Math.round((grp.n || 1) * K.count));
      const y0 = grp.y === 'rand' || grp.y == null ? null : grp.y;
      for (let k = 0; k < n; k++) {
        spawnQueue.push({ t: grp.at + k * (grp.gap || 1) / K.speed, type: grp.type, y: y0, k });
      }
    }
    spawnQueue.sort((a, b) => a.t - b.t);
    banner = { text: 'Wave ' + (i + 1), sub: '', t: 1.4 };
    G.sfx('beep');
  }

  function spawn(ev) {
    const sp = K.speed;
    const col = theme.enemy;
    const base = { t: 0, flash: 0, phase: Math.random() * 6 };
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
        e = { type: 'rock', x: W + 50, y: ev.y != null ? ev.y + (ev.k % 2 ? 90 : -40) : y, y0: 0, r: 34, hp: G.pick(4, 6, 8), vx: -55 * sp, rot: 0,
              bumps: Array.from({ length: 9 }, () => 0.85 + Math.random() * 0.25) };
        e.y = math.clamp(e.y, 90, H - 80); e.y0 = e.y; break;
      case 'shooter':
        e = { type: 'shooter', x: W + 40, y: math.clamp(y, 100, H - 90), y0: 0, r: 24, hp: G.pick(2, 3, 4), stopX: W - 110 - Math.random() * 160,
              stay: 7, fireT: 1.2, puff: 0, color: col[1] };
        e.y0 = e.y; break;
      default: return;
    }
    Object.assign(e, base, { max: e.hp });
    Object.assign(e, { t: 0 });
    addEnemy(e);
  }
  function addEnemy(e) { enemies.push(e); potential += POINTS[e.type] || 0; }

  // ---------------------------------------------------------------
  // Update (dt = 1/120 s)
  // ---------------------------------------------------------------
  function update(g, dt) {
    clock += dt;

    // background drifts left
    for (const s of stars) { s.x -= s.sp * dt; if (s.x < -4) { s.x = W + 4; s.y = Math.random() * H; } }
    for (const p of planets) { p.x -= p.sp * dt; if (p.x < -p.r * 3) { p.x = W + p.r * 3 + Math.random() * 300; p.y = 80 + Math.random() * (H - 160); } }

    if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
    for (const p of popups) { p.t += dt; p.y -= 40 * dt; }
    popups = popups.filter(p => p.t < 1.0);

    updateShip(g, dt);
    updateShots(g, dt);
    updateFlow(g, dt);
    updateEnemies(g, dt);
    if (boss) updateBoss(g, dt);
    updateBullets(g, dt);
    updatePowerups(g, dt);
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
      // if the ship hit an edge, re-anchor so dragging back works at once
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
    s.x = math.clamp(s.x, SHIP_MIN_X, SHIP_MAX_X);
    s.y = math.clamp(s.y, SHIP_MIN_Y, SHIP_MAX_Y);
    s.tilt += (math.clamp(s.vy / 900, -0.25, 0.25) - s.tilt) * Math.min(1, dt * 10);

    for (const k of ['shield', 'speed', 'triple', 'rainbow']) if (s[k] > 0) s[k] = Math.max(0, s[k] - dt);
    if (s.inv > 0) s.inv -= dt;
    if (s.bonk > 0) s.bonk -= dt;

    // ---- firing ----
    fireCD -= dt;
    const wantFire = !finished && phase !== 'intro' && (inp.down('Space', 'KeyJ', 'KeyX') || autoFire(g) || p.down);
    beamOn = wantFire && s.rainbow > 0;
    if (wantFire && !beamOn && fireCD <= 0) {
      fireCD = 0.14;
      const angles = s.triple > 0 ? [-0.2, 0, 0.2] : [0];
      for (const a of angles) shots.push({ x: s.x + 34, y: s.y, vx: Math.cos(a) * 720, vy: Math.sin(a) * 720, r: 9, hue: (clock * 300) % 360 });
      g.tone(980 + Math.random() * 120, 0.05, { type: 'sine', slide: 600, vol: 0.08 });
    }
    if (beamOn && Math.random() < dt * 30) g.tone(500 + Math.random() * 600, 0.05, { type: 'triangle', vol: 0.04 });
  }

  // ---- bubble shots + rainbow beam ----
  function updateShots(g, dt) {
    for (const b of shots) { b.x += b.vx * dt; b.y += b.vy * dt; }
    shots = shots.filter(b => {
      if (b.x > W + 20 || b.y < -20 || b.y > H + 20) return false;
      for (const e of enemies) {
        if (e.dead) continue;
        if (math.dist(b.x, b.y, e.x, e.y) < e.r + b.r) { hurtEnemy(g, e, 1); return false; }
      }
      if (boss && boss.hp > 0 && boss.mode !== 'enter' && hitsBoss(b.x, b.y, b.r)) { hurtBoss(g, 1); return false; }
      return true;
    });
    if (beamOn) {
      const dps = 14;
      for (const e of enemies) if (!e.dead && e.x > ship.x && Math.abs(e.y - ship.y) < e.r + 14) hurtEnemy(g, e, dps * dt);
      if (boss && boss.hp > 0 && boss.mode !== 'enter' && Math.abs(boss.y - ship.y) < boss.r) hurtBoss(g, dps * dt);
    }
  }

  function hurtEnemy(g, e, dmg) {
    e.hp -= dmg;
    e.flash = 0.08;
    if (e.hp <= 0 && !e.dead) {
      e.dead = true;
      defeated++;
      combo++; comboT = 2.2; bestCombo = Math.max(bestCombo, combo); if (combo >= 20) g.achieve('combo20');
      const pts = POINTS[e.type] * mult();
      score += pts;
      popup('+' + pts, e.x, e.y - 30, mult() > 1 ? '#ffd166' : '#ffffff', 22);
      if (combo > 0 && combo % 4 === 0 && mult() > 1) { popup('Combo x' + mult() + '!', e.x, e.y - 64, '#f15bb5', 28); g.sfx('coin'); }
      floaters.push({ e, t: 0 });
      g.sfx('pop');
      maybeDrop(e);
    } else if (dmg >= 1) {
      g.tone(e.type === 'rock' ? 220 : 520, 0.05, { type: 'triangle', vol: 0.12 });
    }
  }

  // A defeated enemy sometimes leaves a power-up. Rocks drop more often,
  // and if nothing dropped for a while, the next one always does.
  function maybeDrop(e) {
    sinceDrop++;
    const chance = e.type === 'rock' ? 0.45 : K.drop;
    if (Math.random() < chance || sinceDrop >= 14) {
      sinceDrop = 0;
      const lifeOk = lives < startLives + 2;
      const bag = ['shield', 'speed', 'triple', 'triple', 'rainbow', 'shield'].concat(lifeOk && Math.random() < 0.35 ? ['life'] : []);
      powerups.push({ kind: bag[(Math.random() * bag.length) | 0], x: e.x, y: e.y, t: 0 });
    }
  }

  // ---- what happens next: intro -> waves -> boss -> done ----
  function updateFlow(g, dt) {
    if (phase === 'intro') {
      phaseT -= dt;
      if (phaseT <= 0) { phase = 'waves'; startWave(0); }
      return;
    }
    if (phase === 'waves') {
      waveT += dt;
      // spawn whatever is due, but never more than the cap at once
      while (spawnQueue.length && spawnQueue[0].t <= waveT && enemies.length < K.maxEnemies) spawn(spawnQueue.shift());
      if (spawnQueue.length && enemies.length >= K.maxEnemies) for (const ev of spawnQueue) ev.t += dt; // wait
      if (!spawnQueue.length && enemies.length === 0) {
        phaseT = (phaseT || 0) + dt;
        if (phaseT > 1.0) {
          phaseT = 0;
          const nWaves = sector.endless ? 4 : sector.waves.length;
          if (waveIdx + 1 < nWaves) startWave(waveIdx + 1);
          else startBoss(g);
        }
      } else phaseT = 0;
      return;
    }
    if (phase === 'bossWarn') {
      phaseT -= dt;
      if (phaseT <= 0) { phase = 'boss'; }
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
      if (grp.x > grp.targetX && grp.t < 14) grp.x -= 160 * K.speed * dt;     // fly in
      else if (grp.t < 14) {
        grp.x -= 10 * dt;                                                   // creep closer
        grp.y += grp.dir * 70 * K.speed * dt;                               // sweep up and down
        if (grp.y < 130) grp.dir = 1;
        if (grp.y > H - 130) grp.dir = -1;
      } else grp.x -= 180 * K.speed * dt;                                   // time to leave
    }
    groups = groups.filter(grp => enemies.some(e => e.grp === grp));

    for (const e of enemies) {
      e.t += dt;
      if (e.flash > 0) e.flash -= dt;
      switch (e.type) {
        case 'bobber':
          e.x += e.vx * dt;
          e.y = e.y0 + Math.sin(e.t * 2.6 + e.phase) * e.amp;
          break;
        case 'squad':
          e.x = e.grp.x + e.dx + Math.sin(e.t * 3 + e.dy) * 4;
          e.y = e.grp.y + e.dy;
          break;
        case 'diver':
          // fly in along the edge, then swoop toward where the ship was
          e.x += e.vx * dt;
          if (!e.swoop && (e.x < W - 160 || e.t > 1.6)) { e.swoop = true; e.ty = s.y; g.sfx('whoosh'); }
          if (e.swoop) {
            e.vy += (math.clamp((e.ty - e.y) * 2.2, -230, 230) - e.vy) * Math.min(1, dt * 3);
            e.vx = Math.max(-270 * K.speed, e.vx - 120 * dt);
          }
          e.y += e.vy * dt;
          break;
        case 'rock':
          e.x += e.vx * dt;
          e.y = e.y0 + Math.sin(e.t * 0.9 + e.phase) * 18;
          e.rot += dt * 0.6;
          break;
        case 'shooter':
          e.y = e.y0 + Math.sin(e.t * 1.7 + e.phase) * 22;
          if (e.x > e.stopX && e.stay > 0) e.x -= 150 * K.speed * dt;
          else if (e.stay > 0) {
            e.stay -= dt;
            e.fireT -= dt;
            // puff up (the warning!), then blow a slow bubble at the ship
            e.puff = e.fireT < 0.55 ? 1 - e.fireT / 0.55 : 0;
            if (e.fireT <= 0) {
              e.fireT = K.fireGap;
              if (ebullets.length < K.maxBullets) {
                const a = Math.atan2(s.y - e.y, s.x - e.x);
                ebullets.push(makeBullet(e.x - 20, e.y, Math.cos(a) * K.bulletSpeed, Math.sin(a) * K.bulletSpeed));
                g.tone(300, 0.12, { type: 'sine', slide: 500, vol: 0.15 });
              }
            }
          } else { e.puff = 0; e.x -= 140 * dt; e.y0 -= 60 * dt; }
          break;
      }
      // bump into the ship?
      if (!e.dead && math.dist(e.x, e.y, s.x, s.y) < e.r + SHIP_R) {
        if (hitShip(g) && e.type !== 'rock') hurtEnemy(g, e, 99);
      }
    }
    // gone off the left side = they just fly home (no penalty)
    enemies = enemies.filter(e => !e.dead && e.x > -80 && e.y > -100 && e.y < H + 100);
  }

  function makeBullet(x, y, vx, vy, kind = 'bubble') {
    return { x, y, vx, vy, r: K.bulletR, kind, t: 0, color: ['#ff5fa2', '#ff8c42', '#ffd166'][(Math.random() * 3) | 0] };
  }

  function updateBullets(g, dt) {
    for (const b of ebullets) {
      b.t += dt;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (math.dist(b.x, b.y, ship.x, ship.y) < b.r + SHIP_R - 3 && hitShip(g)) b.gone = true;
    }
    ebullets = ebullets.filter(b => !b.gone && b.x > -30 && b.x < W + 40 && b.y > -30 && b.y < H + 30);
  }

  function updatePowerups(g, dt) {
    for (const p of powerups) {
      p.t += dt;
      p.x -= 60 * dt;
      p.y += Math.sin(p.t * 3) * 20 * dt;
      // gentle magnet so little kids can grab them
      const d = math.dist(p.x, p.y, ship.x, ship.y);
      if (d < 110) { p.x += (ship.x - p.x) * dt * 3; p.y += (ship.y - p.y) * dt * 3; }
      if (d < 40) { collect(g, p); p.got = true; }
    }
    powerups = powerups.filter(p => !p.got && p.x > -30);
  }

  function collect(g, p) {
    const s = ship;
    if (p.kind === 'life') { g.achieve('life'); lives++; popup('+1 life!', s.x, s.y - 50, '#ef476f', 30); g.sfx('star'); }
    else {
      s[p.kind] = POWERS[p.kind].time;
      if (p.kind === 'triple' || p.kind === 'rainbow') { if (p.kind === 'triple') s.rainbow = 0; else s.triple = 0; }
      popup({ shield: 'Shield!', speed: 'Zoom!', triple: 'Triple!', rainbow: 'Rainbow!' }[p.kind], s.x, s.y - 50, POWERS[p.kind].color, 30);
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
  // Bosses. Each has a look (draw function), a size, and a list of
  // attacks it takes turns doing. Every attack has:
  //   tele: seconds of warning before it happens
  //   dur:  how long the attack lasts
  //   start / tick: what it does
  // ---------------------------------------------------------------
  const BOSSES = {
    balloon: { name: 'Bolto the Balloon Bot', r: 82, attacks: ['fan', 'charge', 'minions'] },
    cookie:  { name: 'Captain Cookie Jar',    r: 84, attacks: ['aim3', 'beam', 'ring'] },
    hula:    { name: 'Hula-Hoop Robo',        r: 80, attacks: ['spiral', 'beam', 'ring', 'fan'] },
  };

  const ATTACKS = {
    // a fan of bubbles toward the ship
    fan: { tele: 0.9, dur: 0.2, start(b, g) {
      const n = g.pick(3, 5, 7);
      const a0 = Math.atan2(ship.y - b.y, ship.x - b.x);
      for (let i = 0; i < n; i++) bossShot(b.x - 60, b.y, a0 + (i - (n - 1) / 2) * 0.22, 1, 'star');
      g.sfx('zap');
    } },
    // three quick aimed puffs
    aim3: { tele: 0.8, dur: 1.0, start(b) { b.shotsLeft = 3; b.shotT = 0; },
      tick(b, g, dt) {
        b.shotT -= dt;
        if (b.shotsLeft > 0 && b.shotT <= 0) {
          b.shotT = 0.33; b.shotsLeft--;
          const a = Math.atan2(ship.y - b.y, ship.x - b.x);
          for (const da of g.pick([0], [-0.15, 0.15], [-0.2, 0, 0.2])) bossShot(b.x - 70, b.y + 10, a + da, 1.15, 'cookie');
          g.sfx('shoot');
        }
      } },
    // a ring of bubbles all around
    ring: { tele: 1.0, dur: 0.2, start(b, g) {
      const n = g.pick(8, 12, 16);
      const off = Math.random();
      for (let i = 0; i < n; i++) bossShot(b.x, b.y, off + i * Math.PI * 2 / n, 0.85, b.def === BOSSES.cookie ? 'cookie' : 'bubble');
      g.sfx('pop');
    } },
    // a slowly turning spiral of stars
    spiral: { tele: 0.9, dur: 2.2, start(b) { b.spinA = Math.PI; b.shotT = 0; },
      tick(b, g, dt) {
        b.shotT -= dt;
        if (b.shotT <= 0) { b.shotT = g.pick(0.3, 0.2, 0.14); b.spinA += 0.55; bossShot(b.x, b.y, b.spinA, 0.9, 'star'); bossShot(b.x, b.y, b.spinA + Math.PI, 0.9, 'star'); }
      } },
    // a candy beam straight across: shown as a blinking stripe first
    beam: { tele: 1.4, dur: 1.0, prep(b) { b.beamY = math.clamp(ship.y, 70, H - 70); },
      start(b, g) { g.sfx('zap'); },
      tick(b, g) { if (Math.abs(ship.y - b.beamY) < 26 + SHIP_R - 4) hitShip(g); } },
    // bounce across the screen at the ship's height, then come back
    charge: { tele: 1.1, dur: 2.4, prep(b) { b.chargeY = math.clamp(ship.y, 110, H - 110); },
      start(b, g) { b.chargeX = b.x; g.sfx('boost'); },
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
        const e = { type: 'bobber', x: b.x - 40, y0: math.clamp(b.y + (i - (n - 1) / 2) * 90, 80, H - 80), r: 23, hp: 1, vx: -130 * K.speed, amp: 40, color: theme.enemy[i % 3], t: 0, flash: 0, phase: i };
        e.y = e.y0; e.max = 1;
        addEnemy(e);
      }
      g.sfx('spring');
    } },
  };

  function bossShot(x, y, a, speedK, kind) {
    if (ebullets.length >= K.maxBullets * 2) return;   // bosses get a bigger (but still capped) budget
    const sp = K.bulletSpeed * speedK;
    ebullets.push(makeBullet(x, y, Math.cos(a) * sp, Math.sin(a) * sp, kind));
  }

  function startBoss(g) {
    let id = sector.boss;
    if (sector.endless) {
      id = ['balloon', 'cookie', 'hula'][endlessLoop % 3];
    }
    const def = BOSSES[id];
    const max = Math.round(K.bossHp * (sector.endless ? 1 + endlessLoop * 0.25 : [1, 1.2, 1.4][SECTORS.findIndex(x => x.id === sector.id)] || 1));
    boss = { id, def, x: W + 160, y: H / 2, home: W - 170, r: def.r, hp: max, max, t: 0, mode: 'enter', modeT: 0, atk: null, next: 0, flash: 0, wob: 0 };
    phase = 'bossWarn'; phaseT = 2.0;
    banner = { text: 'Boss!', sub: def.name, t: 2.4 };
    potential += POINTS.boss;
    g.sfx('power');
  }

  function hitsBoss(x, y, r) { return math.dist(x, y, boss.x, boss.y) < boss.r + r; }

  function hurtBoss(g, dmg) {
    boss.hp -= dmg;
    boss.flash = 0.06;
    if (dmg >= 1) g.tone(400 + Math.random() * 80, 0.04, { type: 'triangle', vol: 0.1 });
    if (boss.hp <= 0 && boss.mode !== 'defeated') {
      boss.hp = 0;
      boss.mode = 'defeated'; boss.modeT = 0;
      combo++; bestCombo = Math.max(bestCombo, combo);
      const pts = POINTS.boss * mult();
      score += pts;
      popup('+' + pts, boss.x, boss.y - 110, '#ffd166', 40);
      ebullets = [];
      for (const e of enemies) hurtEnemy(g, e, 99);   // everyone else gets bubbled too
      g.sfx('win');
      phase = 'clear'; phaseT = 2.4;
    }
  }

  function updateBoss(g, dt) {
    const b = boss;
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
    const idle = () => {
      b.x += (b.home + Math.sin(b.t * 0.6) * 25 - b.x) * Math.min(1, dt * 2);
      b.y += (H / 2 + Math.sin(b.t * 0.8) * 130 - b.y) * Math.min(1, dt * 1.5);
    };
    if (b.mode === 'rest') {
      idle();
      if (b.modeT > K.rest) {
        b.atk = b.def.attacks[b.next % b.def.attacks.length]; b.next++;
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
      if (b.modeT > A.dur) { b.mode = 'rest'; b.modeT = 0; }
    }
    // bumping into the boss counts as a bonk
    if (math.dist(b.x, b.y, ship.x, ship.y) < b.r * 0.85 + SHIP_R) hitShip(g);
  }

  // ---------------------------------------------------------------
  // Winning and losing
  // ---------------------------------------------------------------
  function winSector(g) {
    if (sector.endless) {
      // Endless: next loop, a bit harder, new colors
      endlessLoop++;
      boss = null;
      setTheme(['moon', 'candy', 'rings'][endlessLoop % 3]);
      phase = 'waves'; phaseT = 0;
      startWave(0);
      banner = { text: 'Loop ' + (endlessLoop + 1) + '!', sub: 'Faster friends!', t: 2 };
      K.speed *= 1.06; K.fireGap *= 0.94;
      return;
    }
    finished = true;
    g.achieve('clear');
    if (lives >= startLives) g.achieve('nohit');
    if (boss) g.achieve('boss');
    const goal = Math.round(potential * 0.9);
    const stars = 1 + (lives >= startLives - 1 ? 1 : 0) + (score >= goal ? 1 : 0);
    g.finish({
      win: true, score, stars,
      title: 'Sector clear!',
      lines: ['Lives left: ' + lives, 'Best combo: ' + bestCombo, score >= goal ? '' : 'Star score: ' + goal].filter(Boolean),
      next: true, delay: 600,
    });
  }

  function loseGame(g) {
    finished = true;
    ship.inv = 99;
    if (sector.endless && endlessLoop >= 2) g.achieve('loop3');
    const lines = sector.endless ? ['Loops: ' + (endlessLoop + 1), 'Best combo: ' + bestCombo] : ['You got to wave ' + Math.max(1, waveIdx + 1), 'Best combo: ' + bestCombo];
    const stars = sector.endless ? (score >= 60000 ? 3 : score >= 30000 ? 2 : score >= 10000 ? 1 : 0) : 0;
    g.finish({ win: false, score, stars, title: sector.endless ? 'Great flying!' : 'Nice try!', lines, delay: 1200 });
  }

  // ---------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------
  function heart(ctx, x, y, s, color, line = 2.5) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.4, y, x - s * 0.9, y - s * 1.0, x, y - s * 0.35);
    ctx.bezierCurveTo(x + s * 0.9, y - s * 1.0, x + s * 1.4, y, x, y + s * 0.9);
    ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    if (line) { ctx.lineWidth = line; ctx.strokeStyle = INK; ctx.stroke(); }
  }

  // Big shiny cartoon eye. look = direction the pupil points.
  function eye(ctx, x, y, r, lookX = -0.3, lookY = 0, blink = false) {
    if (blink) {
      ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(x, y, r * 0.7, 0.2, Math.PI - 0.2); ctx.stroke();
      return;
    }
    D.circle(ctx, x, y, r, '#fff', 3);
    D.circle(ctx, x + lookX * r * 0.4, y + lookY * r * 0.4, r * 0.55, INK, 0);
    D.circle(ctx, x + lookX * r * 0.4 - r * 0.2, y + lookY * r * 0.4 - r * 0.22, r * 0.2, '#fff', 0);
  }
  function smile(ctx, x, y, w) {
    ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y - w * 0.4, w, 0.35 * Math.PI, 0.65 * Math.PI); ctx.stroke();
  }
  function cheeks(ctx, x1, x2, y, r) {
    ctx.fillStyle = 'rgba(255,120,160,0.55)';
    ctx.beginPath(); ctx.ellipse(x1, y, r, r * 0.6, 0, 0, Math.PI * 2); ctx.ellipse(x2, y, r, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
  }

  function drawBackground(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, theme.sky[0]); sky.addColorStop(1, theme.sky[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    if (theme.cloud) {
      ctx.fillStyle = theme.cloud;
      for (let i = 0; i < 5; i++) {
        const x = ((i * 260 - clock * 10) % (W + 400) + W + 400) % (W + 400) - 200;
        ctx.beginPath(); ctx.ellipse(x, 120 + (i * 97) % 320, 160, 70, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    // planets (slowest layer)
    for (const p of planets) drawPlanet(ctx, p);
    // stars (twinkly)
    for (const s of stars) {
      ctx.globalAlpha = 0.55 + 0.45 * Math.sin(clock * 3 + s.tw);
      ctx.fillStyle = s.sz > 3 ? '#fff6c7' : '#ffffff';
      if (s.sz > 3) { D.starPath(ctx, s.x, s.y, s.sz * 1.4, s.sz * 0.6); ctx.fill(); }
      else ctx.fillRect(s.x, s.y, s.sz, s.sz);
    }
    ctx.globalAlpha = 1;
    // Moon Base: a bumpy moon floor with little domes far below
    if (theme === THEMES.moon) {
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
    }
  }

  function drawPlanet(ctx, p) {
    ctx.save();
    if (p.kind === 'ring') {
      // back half of the ring
      ctx.lineWidth = 12; ctx.strokeStyle = '#ff8c42';
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * 1.8, p.r * 0.45, -0.25, Math.PI, Math.PI * 2); ctx.stroke();
    }
    D.circle(ctx, p.x, p.y, p.r, p.color, 4);
    ctx.save();
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r - 2, 0, Math.PI * 2); ctx.clip();
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
    // engine flame
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
      // dome + pilot
      ctx.beginPath(); ctx.arc(2, 2, 20, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#bde0fe'; ctx.fill(); ctx.stroke();
      pilot(ctx, 4, -6);
      for (const lx of [-24, -8, 8, 24]) D.circle(ctx, lx, 10, 4, design.accent, 2.5);
    } else if (design.shape === 'jet') {
      // swept wings
      ctx.beginPath(); ctx.moveTo(-10, -6); ctx.lineTo(-26, -28); ctx.lineTo(-12, -28); ctx.lineTo(12, -6); ctx.closePath();
      ctx.moveTo(-10, 6); ctx.lineTo(-26, 28); ctx.lineTo(-12, 28); ctx.lineTo(12, 6); ctx.closePath();
      ctx.fillStyle = design.accent; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-32, -12); ctx.lineTo(16, -12); ctx.quadraticCurveTo(42, -4, 44, 0); ctx.quadraticCurveTo(42, 4, 16, 12); ctx.lineTo(-32, 12); ctx.closePath();
      ctx.fillStyle = fill; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(8, -2, 14, 10, 0, 0, Math.PI * 2); ctx.fillStyle = '#bde0fe'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
      pilot(ctx, 9, -2);
    } else {
      // rocket: fins, round body, pointy nose
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
  // a tiny happy pilot face inside the window
  function pilot(ctx, x, y) {
    D.circle(ctx, x, y, 7, '#ffd6a5', 2);
    D.circle(ctx, x - 2.5, y - 1.5, 1.6, INK, 0); D.circle(ctx, x + 2.5, y - 1.5, 1.6, INK, 0);
    ctx.lineWidth = 1.6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(x, y + 1, 2.6, 0.2, Math.PI - 0.2); ctx.stroke();
  }

  // ---- enemies ----
  function drawEnemy(ctx, e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const flash = e.flash > 0;
    const body = flash ? '#ffffff' : e.color;
    switch (e.type) {
      case 'bobber': {
        // round robot with a springy antenna and little propeller ears
        const wob = Math.sin(e.t * 8) * 3;
        ctx.lineWidth = 3; ctx.strokeStyle = INK;
        ctx.beginPath(); ctx.moveTo(0, -20); ctx.quadraticCurveTo(wob, -30, 0, -36); ctx.stroke();
        D.circle(ctx, 0, -38, 6, '#ffd166', 3);
        D.circle(ctx, 0, 0, 23, body, 4);
        D.box(ctx, -15, -11, 30, 20, 8, '#e9f5ff', 3);
        eye(ctx, -6, -1, 5.5, -0.5); eye(ctx, 7, -1, 5.5, -0.5);
        smile(ctx, 0, 14, 5);
        D.circle(ctx, -24, 2, 6, '#ff8c42', 3); D.circle(ctx, 24, 2, 6, '#ff8c42', 3);
        break;
      }
      case 'squad': {
        // boxy one-eyed robot with waving arms
        const arm = Math.sin(e.t * 6 + e.dy) * 0.5;
        ctx.lineWidth = 4; ctx.strokeStyle = INK;
        ctx.beginPath(); ctx.moveTo(-20, 4); ctx.lineTo(-30, -6 + arm * 10); ctx.moveTo(20, 4); ctx.lineTo(30, -6 - arm * 10); ctx.stroke();
        D.box(ctx, -21, -20, 42, 40, 12, body, 4);
        eye(ctx, 0, -3, 10, -0.5);
        ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-7, 12); ctx.quadraticCurveTo(0, 17, 7, 12); ctx.stroke();
        D.circle(ctx, 0, -24, 4, '#ef476f', 3);
        break;
      }
      case 'diver': {
        // goofy alien in a little saucer, waving its eye stalks
        const s = Math.sin(e.t * 7) * 3;
        ctx.lineWidth = 3; ctx.strokeStyle = INK;
        ctx.beginPath(); ctx.moveTo(-6, -14); ctx.lineTo(-10 + s, -30); ctx.moveTo(6, -14); ctx.lineTo(10 - s, -30); ctx.stroke();
        eye(ctx, -10 + s, -32, 6, -0.4); eye(ctx, 10 - s, -32, 6, -0.4);
        D.circle(ctx, 0, -6, 13, flash ? '#fff' : '#b5e48c', 3);
        smile(ctx, 0, -3, 5);
        ctx.beginPath(); ctx.ellipse(0, 6, 28, 10, 0, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
        for (const lx of [-15, 0, 15]) D.circle(ctx, lx, 7, 3, '#ffd166', 2);
        break;
      }
      case 'rock': {
        // a lumpy sleepy space rock
        ctx.rotate(Math.sin(e.rot) * 0.3);
        ctx.beginPath();
        e.bumps.forEach((k, i) => { const a = i / e.bumps.length * Math.PI * 2; ctx.lineTo(Math.cos(a) * e.r * k, Math.sin(a) * e.r * k); });
        ctx.closePath();
        ctx.fillStyle = flash ? '#fff' : '#b08968'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
        D.circle(ctx, 12, -12, 6, 'rgba(0,0,0,0.15)', 0); D.circle(ctx, -14, 12, 5, 'rgba(0,0,0,0.15)', 0);
        eye(ctx, -9, -2, 5, 0, 0, true); eye(ctx, 9, -2, 5, 0, 0, true);
        cheeks(ctx, -15, 15, 8, 5);
        ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 8, 4, 0, Math.PI); ctx.stroke();
        // little health pips so kids see it's getting weaker
        if (e.hp < e.max) for (let i = 0; i < e.max; i++) D.circle(ctx, (i - (e.max - 1) / 2) * 10, -e.r - 10, 4, i < e.hp ? '#06d6a0' : '#fff', 2);
        break;
      }
      case 'shooter': {
        // jelly alien that puffs up its cheeks, then blows a bubble
        const puff = 1 + e.puff * 0.25;
        ctx.lineWidth = 4; ctx.strokeStyle = INK;
        for (let i = 0; i < 4; i++) {
          const tx = -15 + i * 10, sw = Math.sin(e.t * 5 + i) * 4;
          ctx.beginPath(); ctx.moveTo(tx, 10); ctx.quadraticCurveTo(tx + sw, 22, tx - sw, 32); ctx.stroke();
        }
        ctx.save(); ctx.scale(puff, puff);
        ctx.beginPath(); ctx.arc(0, 2, 24, Math.PI, 0); ctx.lineTo(24, 12); ctx.quadraticCurveTo(0, 18, -24, 12); ctx.closePath();
        ctx.fillStyle = e.puff > 0 && Math.floor(clock * 14) % 2 ? '#fff' : body; ctx.fill(); ctx.stroke();
        eye(ctx, -9, -4, 6, -0.6); eye(ctx, 7, -4, 6, -0.6);
        cheeks(ctx, -16, 12, 6, 4 + e.puff * 3);
        ctx.restore();
        D.circle(ctx, -26, 4, 4 + e.puff * 4, '#bde0fe', 2.5);
        break;
      }
    }
    ctx.restore();
  }

  // ---- bosses ----
  function drawBoss(ctx, b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    // shake while warning about a charge
    if (b.mode === 'tele' && b.atk === 'charge') ctx.translate(Math.sin(clock * 60) * 4, 0);
    const flash = b.flash > 0;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const swell = b.mode === 'tele' && (b.atk === 'ring' || b.atk === 'fan' || b.atk === 'spiral') ? 1 + Math.sin(b.modeT * 20) * 0.03 + b.modeT * 0.05 : 1;
    if (b.id === 'balloon') {
      // a giant wobbly robot balloon
      const sx = 1 + Math.sin(b.wob * 3) * 0.04, sy = 1 - Math.sin(b.wob * 3) * 0.04;
      ctx.lineWidth = 3; ctx.strokeStyle = INK;
      ctx.beginPath(); ctx.moveTo(0, 82); ctx.quadraticCurveTo(14, 100, 0, 118); ctx.stroke();
      D.box(ctx, -20, 116, 40, 22, 6, '#ffd166', 4);
      ctx.save(); ctx.scale(sx * swell, sy * swell);
      ctx.beginPath(); ctx.ellipse(0, 0, 80, 84, 0, 0, Math.PI * 2);
      ctx.fillStyle = flash ? '#fff' : '#ff8fab'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-8, 82); ctx.lineTo(8, 82); ctx.lineTo(0, 92); ctx.closePath(); ctx.fillStyle = '#ff8fab'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(-40, -44, 14, 22, 0.6, 0, Math.PI * 2); ctx.fill();
      // robot face screen
      D.box(ctx, -52, -30, 104, 70, 20, '#2e2a72', 5);
      const blink = Math.floor(b.t * 1.3) % 5 === 0 && (b.t * 1.3) % 1 < 0.15;
      eye(ctx, -22, -4, 14, -0.5, 0.1, blink); eye(ctx, 22, -4, 14, -0.5, 0.1, blink);
      ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 4;
      ctx.beginPath(); for (let i = 0; i <= 8; i++) ctx.lineTo(-20 + i * 5, 24 + Math.sin(b.t * 8 + i) * 3); ctx.stroke();
      cheeks(ctx, -38, 38, 18, 7);
      // bolt antennas
      ctx.strokeStyle = INK; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-30, -76); ctx.lineTo(-40, -100); ctx.moveTo(30, -76); ctx.lineTo(40, -100); ctx.stroke();
      D.circle(ctx, -40, -102, 8, '#ffd166', 4); D.circle(ctx, 40, -102, 8, '#ffd166', 4);
      ctx.restore();
    } else if (b.id === 'cookie') {
      // a big silly UFO with a cookie-jar dome
      ctx.save(); ctx.scale(swell, swell);
      // jar dome
      D.box(ctx, -48, -96, 96, 90, 26, 'rgba(189,224,254,0.85)', 5);
      D.box(ctx, -54, -110, 108, 22, 10, flash ? '#fff' : '#ef476f', 5);
      // cookies inside
      for (const [cx, cy] of [[-26, -30], [24, -26], [0, -22]]) {
        D.circle(ctx, cx, cy, 14, '#d4a373', 3);
        for (const [dx, dy] of [[-4, -3], [5, 2], [-1, 6]]) D.circle(ctx, cx + dx, cy + dy, 2.5, '#6f4518', 0);
      }
      // silly alien peeking out with tongue
      D.circle(ctx, 0, -62, 22, flash ? '#fff' : '#b5e48c', 4);
      eye(ctx, -9, -66, 8, -0.5); eye(ctx, 10, -66, 8, -0.5);
      ctx.beginPath(); ctx.arc(0, -54, 7, 0, Math.PI); ctx.closePath(); ctx.fillStyle = INK; ctx.fill();
      ctx.beginPath(); ctx.ellipse(-2, -48, 4, 5, 0, 0, Math.PI * 2); ctx.fillStyle = '#ff8fab'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      // saucer
      ctx.beginPath(); ctx.ellipse(0, 6, 104, 30, 0, 0, Math.PI * 2);
      ctx.fillStyle = flash ? '#fff' : '#06d6a0'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 22, 60, 14, 0, 0, Math.PI); ctx.fillStyle = '#118ab2'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
      for (let i = 0; i < 7; i++) {
        const on = (Math.floor(clock * 6) + i) % 3 === 0;
        D.circle(ctx, -78 + i * 26, 8, 7, on ? '#ffd166' : '#f15bb5', 3);
      }
      ctx.restore();
    } else {
      // Hula-Hoop Robo: a round robot spinning a planet ring
      ctx.save(); ctx.scale(swell, swell);
      const spin = b.t * 3;
      ctx.lineWidth = 14; ctx.strokeStyle = INK;
      ctx.beginPath(); ctx.ellipse(0, 10, 112, 26, Math.sin(spin) * 0.15, Math.PI, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 8; ctx.strokeStyle = '#ff8c42'; ctx.stroke();
      D.circle(ctx, 0, 0, 74, flash ? '#fff' : '#8ecae6', 5);
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(-34, -38, 12, 20, 0.6, 0, Math.PI * 2); ctx.fill();
      // visor face
      D.box(ctx, -50, -36, 100, 54, 24, '#0b2545', 5);
      eye(ctx, -20, -10, 13, -0.5); eye(ctx, 20, -10, 13, -0.5);
      cheeks(ctx, -44, 44, 30, 8);
      smile(ctx, 0, 42, 13);
      ctx.lineWidth = 4; ctx.strokeStyle = INK;
      ctx.beginPath(); ctx.moveTo(0, -74); ctx.lineTo(0, -96); ctx.stroke();
      D.star(ctx, 0, -100, 13, '#ffd166', 4);
      // front half of the hoop
      ctx.lineWidth = 14; ctx.strokeStyle = INK;
      ctx.beginPath(); ctx.ellipse(0, 10, 112, 26, Math.sin(spin) * 0.15, 0, Math.PI); ctx.stroke();
      ctx.lineWidth = 8; ctx.strokeStyle = '#ff8c42'; ctx.stroke();
      ctx.restore();
    }
    // giant bubble when defeated
    if (b.mode === 'defeated' && !b.popped) {
      const k = Math.min(1, b.modeT * 2);
      ctx.globalAlpha = 0.5;
      D.circle(ctx, 0, 10, (b.r + 40) * k, 'rgba(189,224,254,0.4)', 5);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(-b.r * 0.6 * k, -b.r * 0.6 * k, 14, 24, 0.7, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // warnings drawn on top (not moved by the boss shake)
    if (b.mode === 'tele') {
      const blink = Math.floor(b.modeT * 8) % 2 === 0;
      if (blink) D.text(ctx, '!', b.x - b.r - 20, b.y - b.r, { size: 54, color: '#ffd166' });
      if (b.atk === 'beam') {
        ctx.fillStyle = blink ? 'rgba(255,209,102,0.35)' : 'rgba(255,209,102,0.15)';
        ctx.fillRect(0, b.beamY - 26, W, 52);
        ctx.setLineDash([18, 14]); ctx.lineWidth = 4; ctx.strokeStyle = '#ffd166';
        ctx.beginPath(); ctx.moveTo(0, b.beamY - 26); ctx.lineTo(W, b.beamY - 26); ctx.moveTo(0, b.beamY + 26); ctx.lineTo(W, b.beamY + 26); ctx.stroke();
        ctx.setLineDash([]);
      } else if (b.atk === 'charge') {
        ctx.setLineDash([20, 16]); ctx.lineWidth = 6; ctx.strokeStyle = blink ? '#ffd166' : 'rgba(255,209,102,0.5)';
        ctx.beginPath(); ctx.moveTo(b.x - b.r, b.chargeY); ctx.lineTo(120, b.chargeY); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(140, b.chargeY - 22); ctx.lineTo(110, b.chargeY); ctx.lineTo(140, b.chargeY + 22); ctx.stroke();
      }
    }
    if (b.mode === 'act' && b.atk === 'beam') {
      // a friendly candy-striped beam
      const y = b.beamY;
      ctx.save();
      ctx.beginPath(); ctx.rect(0, y - 24, b.x - 60, 48); ctx.clip();
      ctx.fillStyle = '#fff'; ctx.fillRect(0, y - 24, W, 48);
      ctx.fillStyle = '#f15bb5';
      for (let x = -60 + ((clock * 300) % 60); x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, y - 24); ctx.lineTo(x + 30, y - 24); ctx.lineTo(x + 10, y + 24); ctx.lineTo(x - 20, y + 24); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.strokeRect(-4, y - 24, b.x - 56, 48);
    }
  }

  function drawBullet(ctx, b) {
    // a soft glow first so they are easy to spot
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 6, 0, Math.PI * 2); ctx.fill();
    if (b.kind === 'star') {
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.t * 4);
      D.star(ctx, 0, 0, b.r + 3, '#ffd166', 3); ctx.restore();
    } else if (b.kind === 'cookie') {
      D.circle(ctx, b.x, b.y, b.r, '#d4a373', 3);
      D.circle(ctx, b.x - 3, b.y - 2, 2, '#6f4518', 0); D.circle(ctx, b.x + 3, b.y + 3, 2, '#6f4518', 0);
    } else {
      D.circle(ctx, b.x, b.y, b.r, b.color, 3);
      D.circle(ctx, b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.3, '#fff', 0);
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
    } else if (kind === 'triple') {
      for (const [dx, dy] of [[-6, 0], [6, -8], [6, 8]]) D.circle(ctx, dx, dy, 5, '#fff', 2.5);
    } else if (kind === 'rainbow') {
      ['#ef476f', '#ffd166', '#06d6a0', '#118ab2'].forEach((cc, i) => { ctx.lineWidth = 3; ctx.strokeStyle = cc; ctx.beginPath(); ctx.arc(0, 6, 13 - i * 3, Math.PI, 0); ctx.stroke(); });
    } else if (kind === 'life') {
      heart(ctx, 0, 1, 9, '#fff', 2.5);
    }
    ctx.restore();
  }

  function drawHUD(g, ctx) {
    // see-through when the ship flies under the score, so it never hides
    const under = ship.x < 380 && ship.y < 150;
    ctx.save();
    if (under) ctx.globalAlpha = 0.45;
    // lives as little ships (left, past the home button)
    const n = Math.min(lives, 7);
    for (let i = 0; i < n; i++) drawShip(ctx, 118 + i * 38, 30, shipDesign, { scale: 0.42, noFlame: true });
    if (lives > 7) D.text(ctx, '+' + (lives - 7), 118 + 7 * 38, 30, { size: 20 });
    D.text(ctx, String(score), 100, 70, { size: 32, align: 'left' });
    // combo badge + a bar showing how long it lasts
    if (combo >= 2) {
      const m = mult();
      D.text(ctx, 'Combo ' + combo + (m > 1 ? '  x' + m : ''), 100, 104, { size: 22, align: 'left', color: m > 1 ? '#ffd166' : '#fff' });
      D.meter(ctx, 100, 120, 110, 10, comboT / 2.2, '#f15bb5');
    }
    // power-up timers (top right, left of the pause button)
    let x = 840;
    for (const k of ['shield', 'speed', 'triple', 'rainbow']) {
      if (ship[k] <= 0) continue;
      const frac = ship[k] / POWERS[k].time;
      ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.arc(x, 36, 24, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = POWERS[k].color; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.arc(x, 36, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); ctx.stroke();
      powerIcon(ctx, k, x, 36, 17);
      x -= 62;
    }
    // boss health
    if (boss && phase !== 'bossWarn') {
      const bw = 300, bx = W / 2 - bw / 2;
      D.meter(ctx, bx, 18, bw, 22, boss.hp / boss.max, '#ef476f');
      D.text(ctx, boss.def.name, W / 2, 56, { size: 18 });
    } else if (phase === 'waves' && !sector.endless) {
      // wave dots: filled = done
      const nW = sector.waves.length;
      for (let i = 0; i < nW; i++) D.circle(ctx, W / 2 - (nW - 1) * 14 + i * 28, 28, 8, i < waveIdx ? '#06d6a0' : i === waveIdx ? '#ffd166' : 'rgba(255,255,255,0.3)', 3);
      D.star(ctx, W / 2 + (nW + 1) * 14, 28, 12, '#ef476f', 3);
    } else if (sector.endless && phase === 'waves') {
      D.text(ctx, 'Wave ' + (endlessLoop * 4 + waveIdx + 1), W / 2, 30, { size: 24 });
    }
    ctx.restore();
  }

  function render(g, ctx) {
    if (!sector) { ctx.fillStyle = THEMES.moon.sky[0]; ctx.fillRect(0, 0, W, H); return; }
    drawBackground(ctx);

    for (const p of powerups) {
      const bob = 1 + Math.sin(p.t * 6) * 0.06;
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(p.x, p.y, 28 * bob, 0, Math.PI * 2); ctx.fill();
      powerIcon(ctx, p.kind, p.x, p.y, 20 * bob);
    }
    if (boss) drawBoss(ctx, boss);
    for (const e of enemies) drawEnemy(ctx, e);
    // bubbled enemies floating away
    for (const f of floaters) {
      ctx.save();
      ctx.translate(f.e.x, f.e.y); ctx.scale(0.8, 0.8); ctx.translate(-f.e.x, -f.e.y);
      drawEnemy(ctx, f.e);
      ctx.restore();
      const r = f.e.r + 12 + f.t * 10;
      D.circle(ctx, f.e.x, f.e.y, r, 'rgba(189,224,254,0.35)', 3);
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(f.e.x - r * 0.45, f.e.y - r * 0.45, 4, 8, 0.7, 0, Math.PI * 2); ctx.fill();
    }
    // the player's shots
    for (const s of shots) {
      // light-blue bubbles (enemy bubbles are pink/orange/yellow and glow)
      D.circle(ctx, s.x, s.y, s.r, '#bdf3ff', 3);
      D.circle(ctx, s.x - 3, s.y - 3, 2.8, '#fff', 0);
    }
    if (beamOn) {
      const y = ship.y, x0 = ship.x + 34;
      ctx.save();
      const bw = 12 + Math.sin(clock * 30) * 2;
      RAINBOW.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x0, y - bw + i * (bw * 2 / RAINBOW.length), W - x0, bw * 2 / RAINBOW.length + 0.5); });
      ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeRect(x0, y - bw, W - x0 + 10, bw * 2);
      ctx.restore();
    }
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
    for (const h of hearts) { ctx.globalAlpha = 1 - h.t / h.life; heart(ctx, h.x, h.y, 9, h.c, 2); }
    ctx.globalAlpha = 1;
    for (const p of popups) { ctx.globalAlpha = Math.min(1, (1 - p.t) * 2); D.text(ctx, p.text, p.x, p.y, { size: p.size, color: p.color }); }
    ctx.globalAlpha = 1;

    drawHUD(g, ctx);

    if (banner) {
      const k = Math.min(1, banner.t * 3);
      ctx.globalAlpha = k;
      D.text(ctx, banner.text, W / 2, H / 2 - 40, { size: 64, color: banner.text === 'Boss!' ? '#ff8fab' : '#ffd166' });
      if (banner.sub) D.text(ctx, banner.sub, W / 2, H / 2 + 20, { size: 30 });
      ctx.globalAlpha = 1;
    }
  }

  // ---------------------------------------------------------------
  // Menus: sector tiles, ship picker, auto-fire switch
  // ---------------------------------------------------------------
  function sectorPic(themeName, endless) {
    const t = THEMES[themeName];
    const [c, kind] = t.planets[0];
    let extra = '';
    if (kind === 'ring') extra = `<ellipse cx="60" cy="35" rx="40" ry="9" fill="none" stroke="#ff8c42" stroke-width="5" transform="rotate(-14 60 35)"/>`;
    if (kind === 'swirl') extra = `<path d="M52 30 Q60 22 68 30 Q60 42 52 34" fill="none" stroke="#fff" stroke-width="4"/>`;
    if (kind === 'moon') extra = `<circle cx="54" cy="30" r="5" fill="rgba(0,0,0,0.15)"/><circle cx="67" cy="42" r="4" fill="rgba(0,0,0,0.15)"/>`;
    const inf = endless ? `<path d="M40 35 C40 25 55 25 60 35 C65 45 80 45 80 35 C80 25 65 25 60 35 C55 45 40 45 40 35 Z" fill="none" stroke="#ffd166" stroke-width="6"/>` :
      `<circle cx="60" cy="35" r="20" fill="${c}" stroke="#2b2b2b" stroke-width="3"/>${extra}`;
    return `<svg viewBox="0 0 120 70"><rect width="120" height="70" rx="8" fill="${t.sky[0]}"/><circle cx="15" cy="12" r="2" fill="#fff"/><circle cx="100" cy="18" r="2" fill="#fff"/><circle cx="90" cy="58" r="2" fill="#fff"/><circle cx="24" cy="56" r="2" fill="#fff"/>${inf}</svg>`;
  }

  function levels(g) {
    const list = SECTORS.map((s, i) => {
      const prev = i === 0 || (g.save.levels[SECTORS[i - 1].id] || {}).done;
      return { ...s, pic: sectorPic(s.theme), locked: !prev };
    });
    const rec = g.save.levels.endless || {};
    list.push({ ...ENDLESS, pic: sectorPic('candy', true), locked: !(g.save.levels.s1 || {}).done,
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

  function extraMenu(g) {
    const wrap = Arcade.h('div');
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
  const LINK = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';   // outline style for the logo picture
  Arcade.start({
    id: 'space',
    trophies: [
      { id: 'clear', name: 'Sector clear', how: 'Clear a sector' },
      { id: 'life', name: 'Extra life', how: 'Catch a +1 life' },
      { id: 'combo20', name: 'Combo king', how: 'A 20 combo' },
      { id: 'boss', name: 'Big friend', how: 'Bubble a big boss robot' },
      { id: 'nohit', name: 'Untouchable', how: 'Clear a sector without losing a life', secret: true },
      { id: 'loop3', name: 'Space marathon', how: 'Reach loop 3 in Endless', secret: true },
    ],   // the trophy room (secret ones show '???' until earned)
    logo: Arcade.logo({ title: 'Space Defender', colors: ['#9bf6ff', '#9b5de5'], bg: '#3d348b', art: `<circle cx="30" cy="30" r="3" fill="#fff"/><circle cx="200" cy="20" r="3" fill="#fff"/><circle cx="120" cy="50" r="2" fill="#fff"/><circle cx="220" cy="90" r="2" fill="#fff"/>
              <g class="wobble"><ellipse cx="170" cy="50" rx="32" ry="14" fill="#06d6a0" ${LINK}/><path d="M152 46 A18 18 0 0 1 188 46" fill="#bde0fe" ${LINK}/><circle cx="170" cy="40" r="5" fill="#2b2b2b"/></g>
              <path d="M70 140 L90 96 L110 140 Z" fill="#ffd166" ${LINK}/><rect x="84" y="112" width="12" height="10" rx="3" fill="#118ab2"/>
              <rect x="86" y="70" width="8" height="16" rx="4" fill="#f15bb5"/>` }),   // title screen
    menuMusic: { tempo: 118, root: 57, scale: 'minor', prog: [[1, 6, 3, 7], [6, 7, 1, 1]], drums: 'halftime', bass: 'pulse', lead: 'saw', pad: true, arp: true, seed: 1701 },   // the title/menu song
    title: 'Space Defender',
    view: { w: W, h: H },
    background: THEMES.moon.bg,
    music: 'space',
    levelsTitle: 'Pick a sector',
    howTo: [
      { pic: S(`${howShip}<path d="M64 14 V30 M56 22 H72" stroke="#ffd166" stroke-width="5" stroke-linecap="round"/><path d="M64 50 V66 M56 58 H72" stroke="#ffd166" stroke-width="5" stroke-linecap="round" opacity="0.6"/>`), text: 'Fly your ship', keys: 'Arrows / WASD or drag' },
      { pic: S(`${howShip.replace('translate(6 22)', 'translate(0 22)')}<circle cx="62" cy="40" r="7" fill="#9be7ff" stroke="#2b2b2b" stroke-width="3"/><circle cx="74" cy="40" r="5" fill="#ffafcc" stroke="#2b2b2b" stroke-width="3"/>`), text: 'Bubble the silly robots', keys: 'Space (auto on Easy & touch)' },
      { pic: S(`<circle cx="40" cy="40" r="26" fill="#ff5fa2" stroke="#2b2b2b" stroke-width="4"/><circle cx="31" cy="31" r="7" fill="#fff"/><path d="M8 70 L20 58 M72 70 L60 58" stroke="#ffd166" stroke-width="5" stroke-linecap="round"/>`), text: 'Dodge the pink bubbles' },
      { pic: S(`<circle cx="22" cy="40" r="15" fill="#8ecae6" stroke="#2b2b2b" stroke-width="3"/><circle cx="58" cy="40" r="15" fill="#ff8c42" stroke="#2b2b2b" stroke-width="3"/><circle cx="52" cy="40" r="4" fill="#fff" stroke="#2b2b2b" stroke-width="2"/><circle cx="62" cy="34" r="4" fill="#fff" stroke="#2b2b2b" stroke-width="2"/><circle cx="62" cy="46" r="4" fill="#fff" stroke="#2b2b2b" stroke-width="2"/><path d="M22 30 L29 34 Q28 45 22 50 Q16 45 15 34 Z" fill="#fff" stroke="#2b2b2b" stroke-width="2"/>`), text: 'Grab power-ups' },
      { pic: S(`<ellipse cx="40" cy="38" rx="28" ry="30" fill="#ff8fab" stroke="#2b2b2b" stroke-width="4"/><rect x="22" y="28" width="36" height="24" rx="8" fill="#2e2a72" stroke="#2b2b2b" stroke-width="3"/><circle cx="32" cy="38" r="5" fill="#fff"/><circle cx="48" cy="38" r="5" fill="#fff"/>`), text: 'Bubble the big boss!' },
    ],
    levels,
    extraMenu,
    setup,
    update,
    draw: render,
    onFinish(g) { checkUnlocks(g); },
  });
})();
