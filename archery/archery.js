// =====================================================================
// Bullseye Adventure — a gentle archery game.
//
// How it works:
//  * Pip the archer stands on the left. Pull back (drag anywhere and let
//    go) to shoot: how far you pull = how strong, which way = the angle.
//    Keyboard: Up / Down to aim, hold Space to pull, let go to shoot.
//  * The arrow is a tiny physics object: gravity pulls it down every step,
//    wind pushes it sideways, and we turn the arrow to point the way it
//    is moving (atan2 of its speed).
//  * Each step we look at the little line the arrow TIP moved along and
//    ask "did that line touch anything?" (a target, a balloon, the ground).
//  * Round targets are seen from the side, so a hit is when the tip crosses
//    the target's middle line. How far from the centre it crosses decides
//    the ring: 10 / 8 / 6 / 4 / 2 points.
//  * Every thing's position is a function of the level clock (no hidden
//    state), so the aiming guide can "fast-forward" the same physics to
//    show where your arrow will go — even for moving targets.
// =====================================================================
(function () {
  const { draw, icons, math } = Arcade;
  const D = draw;
  const INK = D.INK;
  const W = 960, H = 540;
  const DEG = Math.PI / 180;

  // ---- physics numbers (view pixels and seconds) ----
  const GROUND = 470;          // flat ground height (hills can raise it)
  const GRAV = 520;            // gravity, px/s²
  const WIND_K = 30;           // sideways push per "wind line", px/s²
  const V_MIN = 260, V_MAX = 860;  // arrow speed at no pull / full pull
  const ARROW_LEN = 46;        // arrow length in px
  const MIN_A = -15 * DEG, MAX_A = 75 * DEG;
  const PULL_FULL = 180;       // drag this far (view px) for full power
  const STEP = 1 / 120;

  // ---- Pip the archer: feet at (AX, GROUND), drawn at scale AS ----
  const AX = 120, AS = 1.15;
  const SHOULDER = { x: 4, y: -56 };   // in Pip's own little coordinates

  // ---------------------------------------------------------------
  // Themes (three places to visit)
  // ---------------------------------------------------------------
  const THEMES = {
    meadow: { name: 'Sunny Meadow', sky: ['#7fd0ff', '#e2f6ff'], far: '#a6dc8a', near: '#7cc576', ground: '#6abf69', ground2: '#4f9e4f', bg: '#7fd0ff', music: { tempo: 116, root: 62, scale: 'major', prog: [[1, 4, 5, 1], [6, 4, 5, 5], [4, 1, 2, 5]], drums: 'march', bass: 'walk', lead: 'flute', harmony: 'triangle', pad: true, arp: true, bells: true, seed: 1401,
        tune: { A: '1/3 3/1 5/4 8/6 5/2 | 6/3 8/1 6/4 4/6 6/2 | 5/3 7/1 9/4 7/6 5/2 | 8/4 5 8/8',
                B: '10/6 8/2 6/8 | 8/6 6/2 4/8 | 9/4 7 5 7 | 9/8 12',
                C: '6/4 4 6 8 | 5/8 3 | 4/4 6 4 2 | 5/8 r/8' } } },
    beach:  { name: 'Sandy Beach',  sky: ['#62c4f2', '#fff1d0'], far: '#9fd7e8', near: '#3fb6d9', ground: '#f4d58d', ground2: '#ddb768', bg: '#62c4f2', music: { tempo: 124, root: 64, scale: 'mixolydian', prog: [[1, 4, 1, 5], [4, 4, 1, 5], [6, 7, 4, 5]], drums: 'surf', bass: 'walk', lead: 'steel', harmony: 'marimba', swing: 0.1, pad: false, arp: true, arpSound: 'uke', seed: 1402,
        tune: { A: '3/2 5 r 5 8/4 5 | 6/2 8 r 8 6/4 4 | 5/2 3 r 1 3/4 5 | 7/6 5/2 2/8',
                B: '8/4 8/2 6 8/4 10 | 11/6 10/2 8/8 | 10/4 8/2 10 12/8 | 9/6 7/2 5/8',
                C: '8/8 10 | 9/8 7 | 8/4 6 4/8 | 5/4 7 9/8' } } },
    snow:   { name: 'Snowy Hills',  sky: ['#a9cdf5', '#f0f7ff'], far: '#ffffff', near: '#dbe9f8', ground: '#f7fbff', ground2: '#c9dcf0', bg: '#a9cdf5', music: { tempo: 100, root: 65, scale: 'major', prog: [[1, 6, 4, 5], [4, 1, 2, 5], [6, 3, 4, 5]], drums: 'soft', bass: 'whole', lead: 'bell', harmony: 'flute', pad: 'choir', arp: true, bells: true, seed: 1403,
        tune: { A: '3/4 5 8/8 | 6/4 8 10/8 | 8/4 6 4 6 | 5/12 r/4',
                B: '8/6 10/2 8/8 | 8/4 10 12/8 | 11/6 10/2 9/8 | 9/4 7 5/8',
                C: '10/8 8 | 10/8 7 | 8/4 6 4/8 | 5/16' } } },
  };

  // ---------------------------------------------------------------
  // Levels. Things:
  //   ring    — a round target on legs. r = size. leg = leg height.
  //             move: {ax:'x'|'y', amp, speed} slides it around.
  //             spin: turns it edge-on and back (only hits while facing you).
  //             cart: rides a little cart instead of standing on legs.
  //   balloon — pops into confetti (+5). rise: floats up and around again.
  //   star    — golden bonus star (+15).
  //   wheel   — a spinning prize wheel; the slice you hit decides the points.
  // stars: [1 star (= the goal to win), 2 stars, 3 stars] on Normal.
  // ---------------------------------------------------------------
  const LEVELS = [
    { id: 'l1', name: 'First Shot', theme: 'meadow', arrows: 6, wind: 0, stars: [8, 24, 40],
      things: [{ kind: 'ring', x: 520, r: 60 }] },
    { id: 'l2', name: 'Balloon Party', theme: 'meadow', arrows: 6, wind: 0, stars: [10, 28, 45],
      things: [{ kind: 'ring', x: 650, r: 55 }, { kind: 'balloon', x: 420, y: 250 }, { kind: 'balloon', x: 530, y: 185 },
        { kind: 'balloon', x: 770, y: 215 }, { kind: 'balloon', x: 865, y: 300 }] },
    { id: 'l3', name: 'Hilltop', theme: 'meadow', arrows: 7, wind: 0, stars: [12, 32, 52], hills: [{ x: 780, w: 320, h: 80 }],
      things: [{ kind: 'ring', x: 780, r: 50 }, { kind: 'star', x: 570, y: 150 }, { kind: 'balloon', x: 440, y: 265 }, { kind: 'balloon', x: 660, y: 205 }] },

    { id: 'l4', name: 'Sea Breeze', theme: 'beach', arrows: 6, wind: 1, stars: [10, 26, 42],
      things: [{ kind: 'ring', x: 700, r: 52 }, { kind: 'balloon', x: 480, y: 235 }, { kind: 'balloon', x: 600, y: 170 }, { kind: 'balloon', x: 840, y: 250 }] },
    { id: 'l5', name: 'Up and Down', theme: 'beach', arrows: 7, wind: -1, stars: [10, 28, 45],
      things: [{ kind: 'ring', x: 720, r: 50, move: { ax: 'y', amp: 110, speed: 1.1 } }, { kind: 'balloon', x: 500, y: 220 }, { kind: 'balloon', x: 610, y: 150 }] },
    { id: 'l6', name: 'Prize Wheel', theme: 'beach', arrows: 7, wind: 2, stars: [12, 30, 50],
      things: [{ kind: 'wheel', x: 690, R: 80, leg: 40, spin: 1.1, segs: [2, 5, 2, 10, 2, 5] }, { kind: 'star', x: 480, y: 170 }] },

    { id: 'l7', name: 'Frosty Flip', theme: 'snow', arrows: 7, wind: -2, stars: [10, 26, 42],
      things: [{ kind: 'ring', x: 700, r: 55, spin: 1.5 }, { kind: 'balloon', x: 500, y: 230 }, { kind: 'balloon', x: 830, y: 200 }] },
    { id: 'l8', name: 'Snowy Slide', theme: 'snow', arrows: 7, wind: 2, stars: [12, 30, 48],
      things: [{ kind: 'ring', x: 650, r: 50, cart: true, move: { ax: 'x', amp: 130, speed: 0.8 } },
        { kind: 'balloon', x: 450, y: 330, rise: 40, ph: 0 }, { kind: 'balloon', x: 560, y: 330, rise: 40, ph: 1.6 }, { kind: 'balloon', x: 840, y: 330, rise: 40, ph: 3.1 }] },
    { id: 'l9', name: 'Big Blizzard', theme: 'snow', arrows: 8, wind: -3, stars: [15, 38, 60], hills: [{ x: 830, w: 260, h: 70 }],
      things: [{ kind: 'ring', x: 830, r: 42, move: { ax: 'y', amp: 60, speed: 1 } }, { kind: 'ring', x: 570, r: 42, spin: 1.3 },
        { kind: 'star', x: 700, y: 130 }, { kind: 'balloon', x: 420, y: 205 }] },
  ];
  // Practice: no arrow limit, no wind, balloons come back. Press "Done" to stop.
  const PRACTICE = { id: 'practice', name: 'Practice', theme: 'meadow', arrows: Infinity, wind: 0, practice: true, stars: [20, 50, 90],
    things: [{ kind: 'ring', x: 600, r: 60 }, { kind: 'balloon', x: 420, y: 240 }, { kind: 'balloon', x: 760, y: 200 }, { kind: 'balloon', x: 860, y: 300 }] };
  const PRACTICE_MAX = 20;     // practice ends by itself after this many arrows

  // ---------------------------------------------------------------
  // Friends (Keith's plan, point 3): archery taking turns on ONE target,
  // each friend on their own phone. Everyone plays the same place; turns go
  // round (seat order), FR_ARROWS arrows each, most points wins.
  // How the phones stay together: the shooter's phone sends its shot
  // ({t:'move', a: angle, p: power, c: level clock}); every other phone sets
  // its clock to c and fires the very same arrow. Things only move with the
  // clock (posOf), so the arrow flies the same way on every screen. Sizes and
  // wind don't change with difficulty here, so all phones see one target.
  // ---------------------------------------------------------------
  const FR_ARROWS = 5;
  const FR_LEVELS = [
    { id: 'fr-meadow', place: 'meadow', name: 'Sunny Meadow', theme: 'meadow', wind: 0, friends: true, stars: [1, 1, 1],
      things: [{ kind: 'ring', x: 640, r: 58 }, { kind: 'balloon', x: 430, y: 240 }, { kind: 'balloon', x: 540, y: 175 }, { kind: 'balloon', x: 820, y: 220 }] },
    { id: 'fr-beach', place: 'beach', name: 'Sandy Beach', theme: 'beach', wind: 1, friends: true, stars: [1, 1, 1],
      things: [{ kind: 'ring', x: 700, r: 52, move: { ax: 'y', amp: 80, speed: 0.8 } }, { kind: 'balloon', x: 480, y: 235 }, { kind: 'balloon', x: 590, y: 165 }, { kind: 'star', x: 830, y: 255 }] },
    { id: 'fr-snow', place: 'snow', name: 'Snowy Hills', theme: 'snow', wind: -1, friends: true, stars: [1, 1, 1],
      things: [{ kind: 'wheel', x: 690, R: 80, leg: 40, spin: 1.0, segs: [2, 5, 2, 10, 2, 5] }, { kind: 'balloon', x: 470, y: 220 }, { kind: 'balloon', x: 860, y: 260 }] },
  ];

  const RING_PTS = [10, 8, 6, 4, 2];                // centre → outside
  const RING_COLORS = ['#ffd166', '#ff9f43', '#ef476f', '#5ec8f2', '#ffffff'];
  const BALLOON_COLORS = ['#ef476f', '#9b5de5', '#06d6a0', '#ff8c42', '#118ab2', '#f15bb5'];
  const SEG_COLORS = { 2: '#8ecae6', 5: '#06d6a0', 10: '#ffd166' };

  // ---- dress-up: hats and arrow trails, unlocked by total stars ----
  const HATS = [
    { id: 'cap', name: 'Leaf Cap', need: 0 },
    { id: 'flower', name: 'Flower Crown', need: 3 },
    { id: 'bunny', name: 'Bunny Ears', need: 8 },
    { id: 'wizard', name: 'Wizard Hat', need: 14 },
    { id: 'crown', name: 'Gold Crown', need: 22 },
  ];
  const TRAILS = [
    { id: 'plain', name: 'Cloud', need: 0 },
    { id: 'rainbow', name: 'Rainbow', need: 5 },
    { id: 'candy', name: 'Candy', need: 11 },
    { id: 'sparkle', name: 'Sparkle', need: 18 },
  ];

  // ---------------------------------------------------------------
  // Game state (rebuilt by setup)
  // ---------------------------------------------------------------
  let L = null;         // level definition being played
  let theme = THEMES.meadow;
  let clock = 0;        // level time in seconds (moves things)
  let things = [];      // targets, balloons, stars, wheels
  let arrows = [];      // every arrow shot (flying or stuck)
  let flying = null;    // the arrow in the air right now
  let phase = 'ready';  // 'ready' | 'aim' | 'fly' | 'wait' | 'end'
  let aim = { angle: 20 * DEG, power: 0 };
  let drag = null;      // {mode:'ptr'|'key', sx, sy} while pulling
  let arrowsLeft = 0, shots = 0, score = 0, waitT = 0;
  let wind = 0;         // wind strength for this level (+ = pushes right)
  let thresholds = [0, 0, 0];
  let stats = null, popups = [], motes = [], banner = 0, pendingShot = null, ended = false;
  let hatId = 'cap', trailId = 'plain';

  // Friends state (see FR_LEVELS above)
  const party = () => Arcade.net && Arcade.net.party;
  let friendsGame = false;
  let order = [];        // seats taking turns, in order
  let mySeat = 0;
  let frShots = {};      // seat -> arrows shot
  let frScores = {};     // seat -> points
  let frQueue = [];      // friends' shots waiting to be played on this phone
  let owner = null;      // seat of the arrow in the air (whose points they are)
  let turnT = 0;         // "Your turn!" pop timer
  let lastTurn = null;
  let fWired = false;
  const peerOf = (seat) => seat === mySeat ? Arcade.profiles.active()
    : Object.assign({ pet: 'cat', color: '#4cc9f0', name: '' }, (party() && party().peers[seat]) || {});
  // whose turn: the seat with the fewest arrows shot (ties: seat order). null = everyone is done.
  function shooterSeat() {
    let best = null;
    for (const s of order) if ((frShots[s] || 0) < FR_ARROWS && (best === null || (frShots[s] || 0) < (frShots[best] || 0))) best = s;
    return best;
  }
  // each seat's color (their avatar color; if two friends picked the same color, the later one gets another)
  const SPARE = ['#ef476f', '#118ab2', '#ffd166', '#06d6a0', '#9b5de5', '#ff8c42'];
  function seatColor(seat) {
    const used = [];
    for (const s of order) {
      let c = peerOf(s).color || SPARE[0];
      if (used.includes(c)) c = SPARE.find(x => !used.includes(x));
      if (s === seat) return c;
      used.push(c);
    }
    return peerOf(seat).color || SPARE[0];
  }
  const myTurn = () => !friendsGame || shooterSeat() === mySeat;
  // each player's animal face as a picture for the canvas (made once per look)
  const avatarPics = {};
  function avatarPic(who) {
    const key = who.pet + who.color;
    if (!avatarPics[key]) {
      let svg = Arcade.profiles.avatar(who);
      if (!/xmlns=/.test(svg)) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      avatarPics[key] = img;
    }
    return avatarPics[key];
  }
  function drawAvatar(ctx, who, x, y, r) {
    const img = avatarPic(who);
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = who.color || '#4cc9f0'; ctx.fill(); ctx.clip();
    if (img.complete && img.naturalWidth) ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
    ctx.restore();
    D.circle(ctx, x, y, r, null, 3.5);
  }
  function friendsMenu(g) {
    if (!party()) return;
    if (!fWired) {
      fWired = true;
      party().on('move', (m) => { if (friendsGame && typeof m.a === 'number') frQueue.push(m); });
      // the shooter's own count of their points (it settles any tiny difference)
      party().on('score', (m) => { if (friendsGame && typeof m.s === 'number') frScores[m.from] = m.s; });
      party().on('leave', (m) => { order = order.filter(s => s !== m.from); });
    }
    party().menu(g, {
      choices: FR_LEVELS.map(lv => ({ id: lv.place, name: lv.name, pic: levelPic(lv) })),
      onStart: (id) => g.play(Object.assign({}, FR_LEVELS.find(l => l.place === id) || FR_LEVELS[0])),
      onBack: () => g.menu(),
    });
  }

  const sizeMult = g => g.pick(1.3, 1, 0.82);     // targets get bigger on Easy
  const speedMult = g => g.pick(0.6, 1, 1.2);     // moving / spinning speed

  // Ground height at x (hills are smooth bumps).
  function groundAt(x) {
    let y = GROUND;
    for (const h of (L && L.hills) || []) {
      const d = Math.abs(x - h.x) / (h.w / 2);
      if (d < 1) y -= h.h * (Math.cos(d * Math.PI) + 1) / 2;
    }
    return y;
  }

  // ---------------------------------------------------------------
  // Setup
  // ---------------------------------------------------------------
  function setup(g, level) {
    L = level || LEVELS[0];
    theme = THEMES[L.theme];
    friendsGame = !!L.friends;
    frShots = {}; frScores = {}; frQueue = []; owner = null; turnT = 0; lastTurn = null;
    if (friendsGame) {
      const r = party() && party().room;
      mySeat = r && r.seat != null ? r.seat : 0;
      order = (r && r.players.length ? r.players.slice() : [mySeat]).sort((a, b) => a - b);
      for (const s of order) { frShots[s] = 0; frScores[s] = 0; }
    }
    document.body.style.setProperty('--ar-bg', theme.bg);
    hatId = ownedPick(g, HATS, g.save.data.hat);
    trailId = ownedPick(g, TRAILS, g.save.data.trail);
    clock = 0; arrows = []; flying = null; phase = 'ready'; drag = null; pendingShot = null; ended = false;
    aim = { angle: 20 * DEG, power: 0 };
    shots = 0; score = 0; waitT = 0; popups = []; banner = 2.2;
    arrowsLeft = L.practice ? Infinity : friendsGame ? FR_ARROWS : L.arrows + g.pick(2, 0, 0);   // Easy: 2 extra arrows
    wind = L.wind * (friendsGame ? 0.75 : g.pick(0.5, 1, 1.3));    // friends: the same wind on every phone
    thresholds = L.stars.map(s => Math.max(1, Math.round(s * (L.practice ? 1 : g.pick(0.6, 1, 1.15)))));
    stats = { bullseyes: 0, hits: 0, balloons: 0, bonus: 0 };

    // Build the things with sizes and speeds for this difficulty.
    const sz = friendsGame ? 1.15 : sizeMult(g), sp = friendsGame ? 0.8 : speedMult(g);   // friends: one size for all
    const bal = friendsGame ? 1.15 : g.pick(1.25, 1, 0.85);
    things = L.things.map((t, i) => {
      const o = Object.assign({ alive: true, ph: i * 1.3, respawn: 0 }, t);
      if (o.kind === 'ring') {
        o.r = Math.round(t.r * sz);
        o.leg = t.leg || 28;
        if (o.move) o.move = Object.assign({}, t.move, { speed: t.move.speed * sp });
        if (o.spin) o.spin = t.spin * sp;
      }
      if (o.kind === 'wheel') { o.R = Math.round(t.R * sz); o.spin = t.spin * sp; }
      if (o.kind === 'balloon') { o.r = Math.round(24 * bal); o.color = BALLOON_COLORS[i % BALLOON_COLORS.length]; }
      if (o.kind === 'star') o.r = Math.round(20 * (friendsGame ? 1.15 : g.pick(1.3, 1, 0.85)));
      return o;
    });

    // floating snowflakes / petals / sand sparkles (just for looks)
    motes = [];
    for (let i = 0; i < 36; i++) motes.push({ x: Math.random() * W, y: Math.random() * H, s: 2 + Math.random() * 3, p: Math.random() * 6 });

    // peek hooks for automated tests
    window.__archeryState = () => ({
      level: L.id, phase, score, friends: friendsGame && { order: order.slice(), mySeat, shots: Object.assign({}, frShots), scores: Object.assign({}, frScores), turn: shooterSeat(), queue: frQueue.length }, arrowsLeft: L.practice ? -1 : arrowsLeft, shots, wind, thresholds, stats: Object.assign({}, stats),
      aim: { angle: aim.angle / DEG, power: aim.power },
      arrows: arrows.map(a => ({ state: a.state, x: Math.round(a.x), y: Math.round(a.y), on: a.on ? things.indexOf(a.on) : -1, points: a.points })),
      targets: things.map(t => { const p = posOf(t, clock); return { kind: t.kind, alive: t.alive, x: Math.round(p.x), y: Math.round(p.y), r: t.r || t.R, facing: p.face }; }),
    });
    // fire right away with an angle (degrees) and power (0..1)
    window.__archeryFire = (angleDeg, power) => { pendingShot = { angle: angleDeg * DEG, power }; };
    // predict what a shot would hit (if fired on the next step), no side effects
    window.__archerySim = (angleDeg, power) => simulate(angleDeg * DEG, power, clock + STEP, 6).events;
  }

  // pick the saved hat/trail if it is unlocked, else the first one
  function ownedPick(g, list, id) {
    const it = list.find(x => x.id === id);
    return it && owns(g, list === HATS ? 'hat' : 'trail', it) ? it.id : list[0].id;
  }
  function owns(g, kind, it) { return it.need === 0 || g.isUnlocked(kind + '-' + it.id); }

  // ---------------------------------------------------------------
  // Where is each thing at time t? (pure function of the clock)
  // returns {x, y, face (-1..1, for spinners), rot (for wheels)}
  // ---------------------------------------------------------------
  function posOf(t, time) {
    if (t.kind === 'ring') {
      let x = t.x;
      const base = t.cart ? groundAt(x) - 44 - t.r : groundAt(x) - t.leg - t.r;
      let y = base;
      if (t.move) {
        const s = Math.sin(time * t.move.speed + t.ph);
        if (t.move.ax === 'x') x = t.x + s * t.move.amp;
        else y = base - t.move.amp * (0.5 + 0.5 * s);
      }
      const face = t.spin ? Math.cos(time * t.spin + t.ph) : 1;
      return { x, y, face, rot: 0 };
    }
    if (t.kind === 'wheel') return { x: t.x, y: groundAt(t.x) - t.leg - t.R, face: 1, rot: time * t.spin };
    if (t.kind === 'balloon') {
      let y = t.y + Math.sin(time * 1.6 + t.ph) * 8;
      if (t.rise) {       // floats up, then starts again from the bottom
        const span = 260;
        y = t.y - ((time * t.rise + t.ph * 60) % span);
      }
      return { x: t.x + Math.sin(time * 0.9 + t.ph) * 5, y, face: 1, rot: 0 };
    }
    // star
    return { x: t.x, y: t.y + Math.sin(time * 2 + t.ph) * 7, face: 1, rot: time * 1.5 };
  }

  // ---------------------------------------------------------------
  // Hit test: the arrow tip moved from (px,py) to (x,y) at time `time`.
  // Returns {pops: [things popped on the way], stop: first solid hit or null}
  // ---------------------------------------------------------------
  function probe(px, py, x, y, time) {
    const pops = [];
    let stop = null;
    const consider = (hit) => { if (!stop || hit.s < stop.s) stop = hit; };
    for (const t of things) {
      if (!t.alive) continue;
      const p = posOf(t, time);
      if (t.kind === 'balloon' || t.kind === 'star') {
        const n = math.nearestOnSegment(p.x, p.y, px, py, x, y);
        if (math.dist(n.x, n.y, p.x, p.y) < t.r + 4) pops.push({ thing: t, s: n.t });
      } else if (t.kind === 'ring') {
        // did the tip cross the target's middle line this step?
        if ((px - p.x) * (x - p.x) > 0 || px === x) continue;
        const s = (p.x - px) / (x - px);
        const yc = py + (y - py) * s;
        const dy = yc - p.y;
        if (Math.abs(dy) <= t.r) {
          if (Math.abs(p.face) < 0.35) continue;       // edge-on: whoosh, it slips past
          const ring = Math.min(4, Math.floor(Math.abs(dy) / t.r * 5));
          consider({ kind: 'ring', thing: t, s, x: p.x, y: yc, ly: dy, points: RING_PTS[ring], side: Math.sign(p.face) });
        } else if (dy > t.r && yc < groundAt(p.x)) {
          consider({ kind: 'post', thing: t, s, x: p.x, y: yc, ly: dy, points: 0, side: 1 });
        }
      } else if (t.kind === 'wheel') {
        const inNow = math.dist(x, y, p.x, p.y) < t.R;
        const inBefore = math.dist(px, py, p.x, p.y) < t.R;
        if (inNow && !inBefore) {
          // which slice? angle of the hit point, measured on the turning wheel
          const n = t.segs.length;
          let a = Math.atan2(y - p.y, x - p.x) - p.rot;
          a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          const seg = Math.floor(a / (Math.PI * 2 / n));
          consider({ kind: 'wheel', thing: t, s: 1, x, y, points: t.segs[seg], la: Math.atan2(y - p.y, x - p.x) - p.rot, lr: math.dist(x, y, p.x, p.y) });
        } else if (!inNow && x !== px && (px - p.x) * (x - p.x) <= 0) {
          const s = (p.x - px) / (x - px), yc = py + (y - py) * s;
          if (yc > p.y + t.R && yc < groundAt(p.x)) consider({ kind: 'post', thing: t, s, x: p.x, y: yc, ly: yc - p.y, points: 0, side: 1 });
        }
      }
    }
    // the ground
    const gy = groundAt(x);
    if (y >= gy) consider({ kind: 'ground', thing: null, s: 1, x, y: gy + 2, points: 0 });
    // only count balloons the arrow reached before it stopped
    return { pops: pops.filter(pp => !stop || pp.s <= stop.s), stop };
  }

  // Move an arrow one step: wind pushes sideways, gravity pulls down.
  function stepArrow(a, dt) {
    a.vx += wind * WIND_K * dt;
    a.vy += GRAV * dt;
    a.x += a.vx * dt;
    a.y += a.vy * dt;
  }

  // Where Pip's string hand / arrow tip is for an aim (world coordinates).
  function launchPoint(angle, power) {
    const dx = Math.cos(angle), dy = -Math.sin(angle);
    const hand = { x: SHOULDER.x + dx * 34, y: SHOULDER.y + dy * 34 };
    const nock = { x: hand.x - dx * (10 + power * 34), y: hand.y - dy * (10 + power * 34) };
    const nx = AX + nock.x * AS, ny = GROUND + nock.y * AS;
    return { x: nx + dx * ARROW_LEN, y: ny + dy * ARROW_LEN, nx, ny };
  }
  function makeArrow(angle, power) {
    const p = launchPoint(angle, power);
    const v = V_MIN + (V_MAX - V_MIN) * power;
    return { x: p.x, y: p.y, vx: Math.cos(angle) * v, vy: -Math.sin(angle) * v, ang: -angle, state: 'fly', trail: [], age: 0, on: null, points: 0 };
  }

  // Fast-forward a shot without changing anything (aiming guide + tests).
  function simulate(angle, power, t0, maxT) {
    const a = makeArrow(angle, power);
    const pts = [{ x: a.x, y: a.y }];
    const events = [];
    const popped = new Set();
    let t = t0;
    for (let i = 0; i < maxT * 120; i++) {
      const px = a.x, py = a.y;
      stepArrow(a, STEP);
      const r = probe(px, py, a.x, a.y, t);
      for (const pp of r.pops) if (!popped.has(pp.thing)) { popped.add(pp.thing); events.push({ kind: pp.thing.kind, index: things.indexOf(pp.thing), points: pp.thing.kind === 'star' ? 15 : 5 }); }
      if (r.stop) { pts.push({ x: r.stop.x, y: r.stop.y }); events.push({ kind: r.stop.kind, index: things.indexOf(r.stop.thing), points: r.stop.points }); return { pts, events }; }
      if (i % 3 === 2) pts.push({ x: a.x, y: a.y });
      if (a.x > W + 80 || a.x < -80 || a.y > H + 40) { events.push({ kind: 'off', index: -1, points: 0 }); return { pts, events }; }
      t += STEP;
    }
    events.push({ kind: 'off', index: -1, points: 0 });
    return { pts, events };
  }

  function popup(text, x, y, color = '#ffd166', size = 30) {
    popups.push({ text, x: math.clamp(x, 80, W - 80), y: Math.max(110, y), t: 0, color, size });
  }

  // ---------------------------------------------------------------
  // Update (dt = 1/120 s)
  // ---------------------------------------------------------------
  function update(g, dt) {
    clock += dt;
    banner = Math.max(0, banner - dt);
    for (const p of popups) { p.t += dt; p.y -= 34 * dt; }
    popups = popups.filter(p => p.t < 1.3);
    for (const m of motes) {   // drifting snow / petals follow the wind
      m.x += (wind * 40 + (theme === THEMES.snow ? 8 : 14)) * dt;
      m.y += (theme === THEMES.snow ? 30 + m.s * 6 : 6 + Math.sin(clock + m.p) * 10) * dt;
      if (m.x > W + 10) m.x -= W + 20; if (m.x < -10) m.x += W + 20;
      if (m.y > H) m.y -= H;
    }
    // practice balloons come back after a while
    if (L.practice) for (const t of things) if (!t.alive && clock > t.respawn) { t.alive = true; g.sfx('spring'); }
    turnT = Math.max(0, turnT - dt);
    if (friendsGame && lastTurn === null && phase === 'ready' && banner < 1.2) newTurn(g);

    // ---- Friends: a friend's shot arrived? Play it here exactly like on their phone ----
    if (friendsGame && phase === 'ready' && !myTurn()) {
      pendingShot = null;     // (test helper) not my turn: no shooting
      const cur = shooterSeat();
      const i = frQueue.findIndex(m => m.from === cur);
      if (i >= 0) {
        const m = frQueue.splice(i, 1)[0];
        clock = m.c;    // same moment as on the shooter's phone, so moving things are in the same place
        aim.angle = math.clamp(m.a, MIN_A, MAX_A); aim.power = math.clamp(m.p, 0, 1);
        shoot(g);
        return;
      }
    }

    const inp = g.input, ptr = inp.pointer;

    // Practice "Done" button (on the canvas, bottom right)
    if (L.practice && ptr.justDown && inDone(ptr.x, ptr.y) && phase !== 'end') { endLevel(g); return; }
    if (L.practice && inp.hit('Enter') && phase !== 'end') { endLevel(g); return; }

    // ---- aiming ----
    if ((phase === 'ready' || phase === 'aim') && myTurn()) {
      if (inp.down('ArrowUp', 'KeyW')) aim.angle = Math.min(MAX_A, aim.angle + 45 * DEG * dt);
      if (inp.down('ArrowDown', 'KeyS')) aim.angle = Math.max(MIN_A, aim.angle - 45 * DEG * dt);
    }
    if (phase === 'ready' && myTurn()) {
      if (pendingShot) {                   // test helper
        aim.angle = math.clamp(pendingShot.angle, MIN_A, MAX_A); aim.power = math.clamp(pendingShot.power, 0, 1);
        pendingShot = null; shoot(g); return;
      }
      if (ptr.down && !(L.practice && inDone(ptr.x, ptr.y))) {
        drag = { mode: 'ptr', sx: ptr.x, sy: ptr.y }; phase = 'aim'; aim.power = 0;
      } else if (inp.down('Space')) {
        drag = { mode: 'key' }; phase = 'aim'; aim.power = 0;
      }
    }
    if (phase === 'aim') {
      if (drag.mode === 'ptr') {
        let dx = drag.sx - ptr.x, dy = drag.sy - ptr.y;   // pulling back points the bow forward
        const d = Math.hypot(dx, dy);
        if (dx < 0) { dx = -dx; dy = -dy; }            // dragged toward the targets? aim that way too
        if (d > 12) aim.angle = math.clamp(Math.atan2(-dy, dx), MIN_A, MAX_A);
        const before = aim.power;
        aim.power = math.clamp((d - 10) / (PULL_FULL - 10), 0, 1);
        creak(g, before, aim.power);
        if (!ptr.down) {
          drag = null;
          if (aim.power > 0.06) shoot(g); else { phase = 'ready'; aim.power = 0; }
        }
      } else {
        const before = aim.power;
        aim.power = Math.min(1, aim.power + dt * 0.8);
        creak(g, before, aim.power);
        if (!inp.down('Space')) { drag = null; if (aim.power > 0.06) shoot(g); else { phase = 'ready'; aim.power = 0; } }
      }
    }

    // ---- the flying arrow ----
    if (phase === 'fly' && flying) flyStep(g, flying, dt);

    if (phase === 'wait') {
      waitT -= dt;
      if (waitT <= 0) {
        const out = friendsGame ? shooterSeat() === null : L.practice ? shots >= PRACTICE_MAX : arrowsLeft <= 0;
        if (out) { phase = 'end'; waitT = friendsGame ? 1.4 : 0.9; }
        else {
          phase = 'ready'; aim.power = 0;
          if (friendsGame) {
            // every turn starts with all the balloons and stars back (the same on every phone)
            let back = false;
            for (const t of things) if (!t.alive) { t.alive = true; back = true; }
            if (back) g.sfx('spring');
            newTurn(g);
          }
        }
      }
    }
    if (phase === 'end' && !ended) {
      waitT -= dt;
      if (waitT <= 0) endLevel(g);
    }
  }

  // a soft "creak" every quarter of the pull, so you can hear the power
  function creak(g, before, after) {
    if (Math.floor(after * 4) > Math.floor(before * 4)) g.tone(300 + after * 500, 0.05, { type: 'triangle', vol: 0.12 });
  }

  function shoot(g) {
    flying = makeArrow(aim.angle, aim.power);
    arrows.push(flying);
    phase = 'fly';
    if (friendsGame) {
      owner = shooterSeat();
      flying.owner = owner;
      frShots[owner] = (frShots[owner] || 0) + 1;
      if (owner === mySeat) {
        shots++; arrowsLeft--;
        party().tell({ t: 'move', a: aim.angle, p: aim.power, c: clock });   // the others fire the same arrow
      }
    } else {
      shots++;
      if (!L.practice) arrowsLeft--;
    }
    // string twang + whoosh
    g.tone(180 + aim.power * 140, 0.22, { type: 'triangle', slide: 90, vol: 0.32 });
    g.tone(520, 0.08, { type: 'square', slide: 260, vol: 0.08 });
    g.sfx('whoosh');
    aim.power = 0;
  }

  function flyStep(g, a, dt) {
    const px = a.x, py = a.y;
    stepArrow(a, dt);
    a.age += dt;
    a.ang = Math.atan2(a.vy, a.vx);           // point the arrow where it is going
    if (Math.floor(a.age * 60) % 2 === 0) { a.trail.push({ x: a.x, y: a.y }); if (a.trail.length > 28) a.trail.shift(); }
    if (trailId === 'sparkle' && Math.random() < dt * 30) g.particles.burst(a.x, a.y, { count: 1, shape: 'star', colors: ['#ffd166', '#fff3b0'], speed: 40, gravity: 60, size: 9, life: 0.5 });

    const r = probe(px, py, a.x, a.y, clock);
    for (const pp of r.pops) popThing(g, pp.thing);
    const s = r.stop;
    if (s) {
      a.state = 'stuck'; a.x = s.x; a.y = s.y; a.points = s.points;
      if (s.kind === 'ring' || s.kind === 'post') { a.on = s.thing; a.ly = s.ly; a.side = s.side; a.lang = a.ang; }
      else if (s.kind === 'wheel') { a.on = s.thing; a.la = s.la; a.lr = s.lr; a.lang = a.ang - posOf(s.thing, clock).rot; }
      landed(g, a, s);
      return;
    }
    if (a.x > W + 80 || a.x < -80 || a.y > H + 40 || a.age > 8) {
      a.state = 'gone';
      popup('Whoosh!', Math.min(a.x, W - 90), Math.min(a.y, H - 120), '#ffffff', 26);
      settle();
    }
  }

  function settle() {
    flying = null; phase = 'wait'; waitT = friendsGame ? 1.0 : 0.45;
    // friends: my arrow is done, tell everyone my points (they work them out too; this settles any difference)
    if (friendsGame && owner === mySeat && party()) party().tell({ t: 'score', s: frScores[mySeat] || 0 });
  }
  // Friends: a new turn starts. "Your turn!" on my phone, a little sound for everyone.
  function newTurn(g) {
    const cur = shooterSeat();
    if (cur === lastTurn) return;
    lastTurn = cur;
    if (cur === mySeat) { turnT = 1.6; g.sfx('unlock'); } else g.sfx('tick');
  }
  const mine = () => !friendsGame || owner === mySeat;

  function landed(g, a, s) {
    settle();
    if (s.kind === 'ground' || s.kind === 'post') {
      g.tone(120, 0.12, { type: 'triangle', slide: 70, vol: 0.3 });      // soft thud
      g.particles.burst(s.x, s.y, { count: 8, angle: -Math.PI / 2, spread: 2, speed: 120, size: 7, life: 0.5, colors: [theme.ground2, theme.ground] });
      // gentle "almost!" if it landed near a target
      const near = things.some(t => t.alive && t.kind !== 'balloon' && Math.abs(posOf(t, clock).x - s.x) < 90);
      if (s.kind === 'post' || near) popup('Almost!', s.x, s.y - 70, '#ffffff', 26);
      return;
    }
    // a target! thunk + points
    g.tone(150, 0.1, { type: 'square', slide: 80, vol: 0.28 });
    g.tone(90, 0.12, { type: 'triangle', vol: 0.3 });
    addScore(s.points);
    if (mine()) stats.hits++;
    if (s.points >= 10) {
      if (mine()) { stats.bullseyes++; if (stats.bullseyes >= 5) g.achieve('eagle'); }
      g.sfx('star');
      popup('Bullseye!', s.x, s.y - 80, '#ffd166', 46);
      g.particles.burst(s.x, s.y, { count: 30, shape: 'star', speed: 300, size: 16, gravity: 250 });
      if (mine()) g.achieve('bullseye', 'First bullseye!');
    } else {
      g.sfx('coin');
      popup('+' + s.points, s.x, s.y - 60, s.points >= 6 ? '#06d6a0' : '#8ecae6', 36);
      g.particles.burst(s.x, s.y, { count: 10, speed: 160, size: 8, life: 0.6 });
    }
  }

  function popThing(g, t) {
    if (!t.alive) return;
    t.alive = false;
    t.respawn = clock + 2.5;
    const p = posOf(t, clock);
    if (t.kind === 'balloon') {
      addScore(5); if (mine()) { stats.balloons++; if (stats.balloons >= 10) g.achieve('balloons'); }
      g.sfx('pop');
      g.particles.burst(p.x, p.y, { count: 26, shape: 'square', speed: 260, size: 12, gravity: 300, life: 1.1 });
      g.particles.burst(p.x, p.y, { count: 8, colors: [t.color], speed: 120, size: 10, life: 0.5 });
      popup('Pop! +5', p.x, p.y - 40, '#f15bb5');
    } else {
      addScore(15); if (mine()) { stats.bonus++; g.achieve('golden'); }
      g.sfx('power');
      g.particles.burst(p.x, p.y, { count: 30, shape: 'star', colors: ['#ffd166', '#fff3b0', '#ffc93c'], speed: 280, size: 16, gravity: 200 });
      popup('Golden star! +15', p.x, p.y - 40, '#ffd166', 32);
    }
  }

  function addScore(n) {
    if (friendsGame) {   // friends: points go to whoever shot this arrow
      frScores[owner] = (frScores[owner] || 0) + n;
      if (owner === mySeat) score += n;
      return;
    }
    const before = score;
    score += n;
    // little fanfare when passing a star mark
    for (let i = 0; i < 3; i++) if (before < thresholds[i] && score >= thresholds[i]) {
      Arcade.sfx('unlock');
      popup(['Goal!', 'Two stars!', 'Three stars!'][i], W / 2, 150, '#ffd166', 34);
    }
  }

  function starsFor(s) { return s >= thresholds[2] ? 3 : s >= thresholds[1] ? 2 : s >= thresholds[0] ? 1 : 0; }

  function endLevel(g) {
    if (ended) return;
    ended = true; phase = 'end';
    if (friendsGame) { friendsResults(g); return; }
    const stars = starsFor(score);
    const idx = LEVELS.findIndex(l => l.id === L.id);
    const lines = [];
    if (stats.bullseyes) lines.push('Bullseyes: ' + stats.bullseyes);
    if (stats.balloons) lines.push('Balloons popped: ' + stats.balloons);
    if (stats.bonus) lines.push('Golden stars: ' + stats.bonus);
    if (L.practice) {
      lines.unshift('Arrows shot: ' + shots);
      g.finish({ win: true, score, stars, title: 'Great practice!', lines, next: false, delay: 600 });
    } else {
      const win = stars >= 1;
      if (win) g.achieve('win');
      if (stars >= 3) g.achieve('three-stars');
      if (win && idx === LEVELS.length - 1) g.achieve('last');
      if (win && stats.bullseyes === 0 && stats.balloons === 0) g.achieve('sneaky');
      if (!win) lines.push('Get ' + thresholds[0] + ' points to win — you can do it!');
      g.finish({ win, score, stars, title: !win ? 'Nice try!' : stars === 3 ? 'Amazing!' : 'Hooray!', lines, next: win && idx < LEVELS.length - 1, delay: 700 });
      setTimeout(() => checkUnlocks(g), 1500);
    }
  }

  // Friends results: everyone's points, most first, with their animal face.
  function friendsResults(g) {
    const all = order.concat(Object.keys(frScores).map(Number).filter(s => !order.includes(s) && s === mySeat))
      .map(s => ({ seat: s, who: peerOf(s), pts: frScores[s] || 0, mine: s === mySeat }))
      .sort((a, b) => b.pts - a.pts);
    const top = all[0] ? all[0].pts : 0;
    const winners = all.filter(r => r.pts === top);
    const iWon = winners.some(r => r.mine);
    const rows = all.map((r, i) =>
      `<div style="display:flex;align-items:center;gap:10px;justify-content:center;margin:4px 0;width:100%">` +
      `<span style="font-size:24px;width:36px">${i + 1}.</span>` +
      `<span style="width:56px;height:56px;display:inline-block;border-radius:50%;overflow:hidden;border:4px solid #2b2b2b;${r.mine ? 'box-shadow:0 0 0 4px #ffd166' : ''}">${Arcade.profiles.avatar(r.who)}</span>` +
      `<span style="font-size:28px;min-width:70px;text-align:right">${r.pts}</span>` +
      `<span style="font-size:26px;width:34px;color:#ffd166;-webkit-text-stroke:1.5px #2b2b2b">${r.pts === top && top > 0 ? '★' : ''}</span></div>`).join('');
    if (iWon && all.length > 1) g.achieve('win');
    g.finish({
      win: true, score, stars: iWon ? 3 : score > 0 ? 2 : 1,
      title: iWon ? (winners.length > 1 ? 'A tie!' : 'You won!') : 'Great shooting!', lines: [rows], delay: 300,
      buttons: [{ icon: Arcade.icons.again, label: 'Again', cls: 'big', onClick: () => party().start(L.place) },
        { icon: Arcade.net.FRIENDS_PIC, label: 'Friends', cls: 'blue', onClick: () => friendsMenu(g) }],
    });
  }

  function totalStars(g) { return LEVELS.reduce((n, l) => n + ((g.save.levels[l.id] || {}).stars || 0), 0); }
  function checkUnlocks(g) {
    const n = totalStars(g);
    for (const h of HATS) if (h.need && n >= h.need) g.unlock('hat-' + h.id, h.name + ' hat!');
    for (const t of TRAILS) if (t.need && n >= t.need) g.unlock('trail-' + t.id, t.name + ' arrow trail!');
  }

  // Practice "Done" button area (view coordinates)
  const DONE = { x: 836, y: 440, w: 104, h: 84 };
  const inDone = (x, y) => x >= DONE.x && x <= DONE.x + DONE.w && y >= DONE.y && y <= DONE.y + DONE.h;

  // ---------------------------------------------------------------
  // Drawing: backgrounds
  // ---------------------------------------------------------------
  function cloud(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath();
    ctx.arc(-30, 6, 20, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(-8, -10, 24, Math.PI * 1.0, Math.PI * 1.9);
    ctx.arc(22, -4, 20, Math.PI * 1.2, Math.PI * 0.1 + Math.PI * 2);
    ctx.arc(34, 8, 16, Math.PI * 1.5, Math.PI * 0.5);
    ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(43,43,43,0.35)'; ctx.stroke();
    ctx.restore();
  }

  function drawBackground(g, ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, theme.sky[0]); sky.addColorStop(1, theme.sky[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    const t = clock;
    // slow clouds
    for (const [x0, y, s, v] of [[160, 120, 1.1, 6], [520, 90, 0.8, 4], [820, 150, 1.0, 5], [360, 190, 0.6, 3]]) {
      const x = ((x0 + t * (v + wind * 4)) % (W + 200) + W + 200) % (W + 200) - 100;
      cloud(ctx, x, y, s);
    }
    ctx.lineJoin = 'round';
    if (theme === THEMES.meadow) {
      hills(ctx, 360, 70, 300, theme.far);
      hills(ctx, 400, 45, 220, theme.near, 1.7);
      // round trees
      for (const [x, y, s] of [[300, 392, 1], [905, 382, 1.2], [690, 400, 0.8]]) tree(ctx, x, y, s);
    } else if (theme === THEMES.beach) {
      // the sea with little waves
      ctx.fillStyle = '#3fb6d9'; ctx.fillRect(0, 360, W, 120);
      ctx.fillStyle = '#7fd6ef'; ctx.fillRect(0, 360, W, 10);
      ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 360); ctx.lineTo(W, 360); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3;
      for (let i = 0; i < 9; i++) {
        const x = ((i * 130 + t * 12) % (W + 80)) - 40, y = 385 + (i % 3) * 22;
        ctx.beginPath(); ctx.arc(x, y, 9, Math.PI * 1.1, Math.PI * 1.9); ctx.arc(x + 18, y, 9, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      }
      // little island far away
      ctx.beginPath(); ctx.ellipse(880, 362, 70, 16, 0, Math.PI, 0); ctx.fillStyle = '#f4d58d'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      palm(ctx, 34, 470, 1);
      palm(ctx, 890, 360, 0.45);
    } else {
      // snowy mountains
      ctx.lineWidth = 4; ctx.strokeStyle = INK;
      for (const [x, w, h, c] of [[120, 300, 200, '#dbe9f8'], [430, 360, 250, '#ffffff'], [760, 340, 210, '#dbe9f8'], [980, 260, 160, '#ffffff']]) {
        ctx.beginPath(); ctx.moveTo(x - w / 2, 420); ctx.quadraticCurveTo(x - w * 0.12, 420 - h * 0.9, x, 420 - h); ctx.quadraticCurveTo(x + w * 0.12, 420 - h * 0.9, x + w / 2, 420);
        ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ctx.stroke();
      }
      hills(ctx, 410, 30, 260, '#eef5fd', 1.3);
      for (const [x, y, s] of [[300, 420, 1], [640, 414, 0.8], [915, 420, 1.1]]) pine(ctx, x, y, s);
    }
    // the ground (follows any hills)
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, groundAt(x));
    ctx.lineTo(W, H); ctx.closePath();
    ctx.fillStyle = theme.ground; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = theme.ground2; ctx.fillRect(0, GROUND + 38, W, H - GROUND - 38);
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, GROUND + 38); ctx.lineTo(W, GROUND + 38); ctx.stroke();
    // ground decorations
    if (theme === THEMES.meadow) for (const x of [60, 250, 420, 610, 880]) flower(ctx, x, groundAt(x) + 12);
    if (theme === THEMES.beach) for (const x of [260, 470, 660]) shell(ctx, x, groundAt(x) + 16);
    if (theme === THEMES.snow) for (const x of [250, 460]) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x, groundAt(x) + 14, 20, 7, 0, 0, Math.PI * 2); ctx.fill(); }
  }

  function hills(ctx, y0, amp, wl, color, off = 0) {
    ctx.beginPath(); ctx.moveTo(0, GROUND);
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, y0 - Math.abs(Math.sin(x / wl + off)) * amp);
    ctx.lineTo(W, GROUND); ctx.closePath();
    ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(43,43,43,0.3)'; ctx.stroke();
  }
  function tree(ctx, x, y, s) {
    D.box(ctx, x - 7 * s, y - 40 * s, 14 * s, 46 * s, 5, '#a8683a', 3.5);
    D.circle(ctx, x, y - 62 * s, 32 * s, '#4fae5a', 3.5);
    D.circle(ctx, x - 12 * s, y - 70 * s, 7 * s, '#6cc76f', 0);
  }
  function pine(ctx, x, y, s) {
    D.box(ctx, x - 6 * s, y - 24 * s, 12 * s, 28 * s, 4, '#8a5a33', 3);
    for (let i = 0; i < 3; i++) {
      const w = (44 - i * 10) * s, top = y - (40 + i * 28) * s;
      ctx.beginPath(); ctx.moveTo(x - w, top + 34 * s); ctx.lineTo(x, top - 10 * s); ctx.lineTo(x + w, top + 34 * s); ctx.closePath();
      ctx.fillStyle = '#2f8f5b'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - w * 0.45, top + 6 * s); ctx.lineTo(x, top - 10 * s); ctx.lineTo(x + w * 0.45, top + 6 * s); ctx.closePath();
      ctx.fillStyle = '#ffffff'; ctx.fill();
    }
  }
  function palm(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineCap = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, -90, 30, -170); ctx.stroke();
    ctx.strokeStyle = '#c98b4f'; ctx.lineWidth = 11; ctx.stroke();
    for (const a of [-2.8, -2.2, -1.5, -0.9, -0.3]) {
      ctx.beginPath(); ctx.moveTo(30, -170);
      ctx.quadraticCurveTo(30 + Math.cos(a) * 50, -170 + Math.sin(a) * 50 - 16, 30 + Math.cos(a) * 80, -170 + Math.sin(a) * 80 + 20);
      ctx.strokeStyle = INK; ctx.lineWidth = 16; ctx.stroke();
      ctx.strokeStyle = '#3fae5a'; ctx.lineWidth = 10; ctx.stroke();
    }
    D.circle(ctx, 24, -162, 8, '#8a5a33', 3); D.circle(ctx, 38, -160, 8, '#8a5a33', 3);
    ctx.restore();
  }
  function flower(ctx, x, y) {
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; D.circle(ctx, x + Math.cos(a) * 6, y + Math.sin(a) * 6, 5, '#ffffff', 2); }
    D.circle(ctx, x, y, 4, '#ffd166', 2);
  }
  function shell(ctx, x, y) {
    ctx.beginPath(); ctx.moveTo(x - 12, y + 6); ctx.quadraticCurveTo(x, y - 18, x + 12, y + 6); ctx.closePath();
    ctx.fillStyle = '#ffafcc'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  }

  // wind streaks + snowflakes / petals
  function drawAir(ctx) {
    if (wind) {
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      const dir = Math.sign(wind), len = 30 + Math.abs(wind) * 14;
      for (let i = 0; i < 7; i++) {
        const span = W + 200;
        const x = ((i * 157 + clock * dir * (120 + Math.abs(wind) * 60)) % span + span) % span - 100;
        const y = 120 + (i * 53) % 230;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + dir * len / 2, y - 6, x + dir * len, y); ctx.stroke();
      }
    }
    if (theme === THEMES.snow) {
      ctx.fillStyle = '#ffffff';
      for (const m of motes) { ctx.beginPath(); ctx.arc(m.x, m.y, m.s, 0, Math.PI * 2); ctx.fill(); }
    } else if (theme === THEMES.meadow) {
      for (const m of motes.slice(0, 10)) { ctx.fillStyle = '#ffd6e8'; ctx.beginPath(); ctx.ellipse(m.x, m.y * 0.7, m.s + 1, m.s * 0.6, m.p + clock, 0, Math.PI * 2); ctx.fill(); }
    }
  }

  // ---------------------------------------------------------------
  // Drawing: targets, balloons, stars, wheels
  // ---------------------------------------------------------------
  function drawThing(ctx, t) {
    const p = posOf(t, clock);
    if (t.kind === 'ring') drawRing(ctx, t, p);
    else if (t.kind === 'wheel') drawWheel(ctx, t, p);
    else if (!t.alive) return;
    else if (t.kind === 'balloon') drawBalloon(ctx, t, p);
    else drawStar(ctx, t, p);
  }

  function drawRing(ctx, t, p) {
    const gy = groundAt(p.x);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // what holds it up: a cart, a sliding pole, or wooden legs
    if (t.cart) {
      D.box(ctx, p.x - 46, gy - 44, 92, 30, 10, '#ef476f', 4);
      for (const wx of [-28, 28]) { D.circle(ctx, p.x + wx, gy - 12, 11, '#3a3a3a', 4); D.circle(ctx, p.x + wx, gy - 12, 4, '#ddd', 0); }
    } else if (t.move && t.move.ax === 'y') {
      D.box(ctx, p.x - 7, p.y, 14, gy - p.y, 6, '#c9d6df', 4);
      D.box(ctx, p.x - 22, gy - 14, 44, 16, 6, '#8a5a33', 4);
    } else {
      ctx.strokeStyle = INK; ctx.lineWidth = 12;
      ctx.beginPath(); ctx.moveTo(p.x - 6, p.y); ctx.lineTo(p.x - t.r * 0.55, gy + 2); ctx.moveTo(p.x + 6, p.y); ctx.lineTo(p.x + t.r * 0.55, gy + 2); ctx.stroke();
      ctx.strokeStyle = '#b77940'; ctx.lineWidth = 6; ctx.stroke();
    }
    // arrows on the far side are drawn first so the face covers them
    for (const a of arrows) if (a.on === t && a.state === 'stuck' && stuckFacing(a, p) < 0) drawStuck(ctx, a);
    // the face: an oval (we see it a little from the side). Spinners squash as they turn.
    const k = Math.abs(p.face);
    const rx = Math.max(5, t.r * 0.62 * k), ry = t.r;
    // thick edge so it looks like a solid board
    ctx.beginPath(); ctx.ellipse(p.x + 7 * (t.spin ? Math.sin(clock * t.spin + t.ph) : 1), p.y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#b77940'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    for (let i = 4; i >= 0; i--) {
      const f = (i + 1) / 5;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, rx * f, ry * f, 0, 0, Math.PI * 2);
      ctx.fillStyle = RING_COLORS[i]; ctx.fill();
      ctx.lineWidth = i === 4 ? 4 : 2; ctx.strokeStyle = INK; ctx.stroke();
    }
    if (k > 0.5) {  // a shine
      ctx.beginPath(); ctx.ellipse(p.x - rx * 0.45, p.y - ry * 0.5, rx * 0.12, ry * 0.12, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
    }
    for (const a of arrows) if (a.on === t && a.state === 'stuck' && stuckFacing(a, p) >= 0) drawStuck(ctx, a);
  }
  // +1 if the stuck arrow's side of the target faces us right now
  function stuckFacing(a, p) { return a.side * p.face; }

  function drawWheel(ctx, t, p) {
    const gy = groundAt(p.x);
    D.box(ctx, p.x - 9, p.y, 18, gy - p.y + 2, 6, '#b77940', 4);
    const n = t.segs.length, step = Math.PI * 2 / n;
    for (let i = 0; i < n; i++) {
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.arc(p.x, p.y, t.R, p.rot + i * step, p.rot + (i + 1) * step); ctx.closePath();
      ctx.fillStyle = SEG_COLORS[t.segs[i]] || '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      const mid = p.rot + (i + 0.5) * step;
      const lx = p.x + Math.cos(mid) * t.R * 0.62, ly = p.y + Math.sin(mid) * t.R * 0.62;
      if (t.segs[i] >= 10) D.star(ctx, lx, ly, t.R * 0.2, '#fff3b0', 2.5);
      else D.text(ctx, String(t.segs[i]), lx, ly, { size: Math.round(t.R * 0.3), lineWidth: 4 });
    }
    D.circle(ctx, p.x, p.y, t.R, null, 5);
    D.circle(ctx, p.x, p.y, 10, '#ffd166', 4);
    for (const a of arrows) if (a.on === t && a.state === 'stuck') drawStuck(ctx, a);
  }

  function drawBalloon(ctx, t, p) {
    // wiggly string
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(p.x, p.y + t.r * 1.2);
    for (let i = 1; i <= 4; i++) ctx.lineTo(p.x + Math.sin(clock * 3 + i + t.ph) * 4, p.y + t.r * 1.2 + i * 12);
    ctx.stroke();
    ctx.beginPath(); ctx.ellipse(p.x, p.y, t.r * 0.86, t.r * 1.1, 0, 0, Math.PI * 2);
    ctx.fillStyle = t.color; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p.x - 6, p.y + t.r * 1.22); ctx.lineTo(p.x, p.y + t.r * 1.08); ctx.lineTo(p.x + 6, p.y + t.r * 1.22); ctx.closePath();
    ctx.fillStyle = t.color; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(p.x - t.r * 0.35, p.y - t.r * 0.45, t.r * 0.16, t.r * 0.26, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();
  }

  function drawStar(ctx, t, p) {
    // glow
    ctx.fillStyle = 'rgba(255,230,120,0.35)';
    ctx.beginPath(); ctx.arc(p.x, p.y, t.r * 1.7 + Math.sin(clock * 5) * 3, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(p.rot) * 0.3);
    D.star(ctx, 0, 0, t.r * 1.2, '#ffc93c', 4);
    // a happy little face
    D.circle(ctx, -t.r * 0.25, -t.r * 0.05, t.r * 0.11, INK, 0);
    D.circle(ctx, t.r * 0.25, -t.r * 0.05, t.r * 0.11, INK, 0);
    ctx.beginPath(); ctx.arc(0, t.r * 0.12, t.r * 0.2, 0.2, Math.PI - 0.2); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
  }

  // ---------------------------------------------------------------
  // Drawing: arrows
  // ---------------------------------------------------------------
  // An arrow pointing along +x with its tip at (0,0). head=false = tip is buried.
  // color: friends games paint the feathers in the shooter's color (whose arrow is whose)
  function arrowShape(ctx, len, head = true, color = null) {
    ctx.lineJoin = 'round';
    // fletching (feathers)
    ctx.beginPath(); ctx.moveTo(-len + 2, 0); ctx.lineTo(-len - 4, -8); ctx.lineTo(-len + 12, -8); ctx.lineTo(-len + 16, 0); ctx.closePath();
    ctx.fillStyle = color || '#ef476f'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-len + 2, 0); ctx.lineTo(-len - 4, 8); ctx.lineTo(-len + 12, 8); ctx.lineTo(-len + 16, 0); ctx.closePath();
    ctx.fillStyle = color || '#ffd166'; ctx.fill(); ctx.stroke();
    // shaft
    D.rr(ctx, -len, -2.5, len - (head ? 8 : 2), 5, 2.5);
    ctx.fillStyle = '#d9a066'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
    if (head) {
      ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(-12, -7); ctx.lineTo(-9, 0); ctx.lineTo(-12, 7); ctx.closePath();
      ctx.fillStyle = '#d6e2ee'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
    }
  }

  function drawFlying(ctx, a) {
    // the trail
    const tr = a.trail;
    if (tr.length > 1) {
      ctx.lineCap = 'round';
      for (let i = 1; i < tr.length; i++) {
        const f = i / tr.length;
        let c = 'rgba(255,255,255,' + (f * 0.8).toFixed(2) + ')';
        if (trailId === 'rainbow') c = `hsla(${(i * 25 + clock * 300) % 360} 90% 60% / ${f})`;
        else if (trailId === 'candy') c = i % 4 < 2 ? `rgba(241,91,181,${f})` : `rgba(142,202,230,${f})`;
        else if (trailId === 'sparkle') c = `rgba(255,209,102,${f})`;
        ctx.strokeStyle = c; ctx.lineWidth = 2 + f * 6;
        ctx.beginPath(); ctx.moveTo(tr[i - 1].x, tr[i - 1].y); ctx.lineTo(tr[i].x, tr[i].y); ctx.stroke();
      }
    }
    ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.ang); arrowShape(ctx, ARROW_LEN, true, ownerColor(a)); ctx.restore();
  }

  // an arrow stuck in something (follows moving / spinning targets)
  const ownerColor = (a) => friendsGame && a.owner != null ? seatColor(a.owner) : null;
  function drawStuck(ctx, a) {
    let x = a.x, y = a.y, ang = a.ang, sx = 1;
    if (a.on) {
      const p = posOf(a.on, clock);
      if (a.on.kind === 'wheel') {
        x = p.x + Math.cos(a.la + p.rot) * a.lr; y = p.y + Math.sin(a.la + p.rot) * a.lr; ang = a.lang + p.rot;
      } else {
        x = p.x; y = p.y + a.ly;
        if (a.on.spin) sx = a.side * p.face;   // turns with the spinning target
      }
    }
    ctx.save(); ctx.translate(x, y); ctx.scale(sx, 1); ctx.rotate(ang);
    ctx.translate(6, 0);                       // tip is buried a little
    arrowShape(ctx, ARROW_LEN, false, ownerColor(a));
    ctx.restore();
  }

  // ---------------------------------------------------------------
  // Drawing: Pip the archer (original character), aiming the bow
  // ---------------------------------------------------------------
  function drawHead(ctx, hat) {
    const hx = 2, hy = -86;
    // hair (behind)
    ctx.beginPath(); ctx.arc(hx - 2, hy - 2, 25, Math.PI * 0.75, Math.PI * 2.05); ctx.closePath();
    ctx.fillStyle = '#8a4b2a'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    // face
    D.circle(ctx, hx, hy, 23, '#ffd6a5', 4);
    // fringe
    ctx.beginPath(); ctx.moveTo(hx - 22, hy - 4); ctx.quadraticCurveTo(hx - 14, hy - 26, hx + 8, hy - 22); ctx.quadraticCurveTo(hx + 2, hy - 14, hx - 8, hy - 12); ctx.quadraticCurveTo(hx - 16, hy - 10, hx - 22, hy - 4);
    ctx.fillStyle = '#8a4b2a'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    // eyes looking right, with shiny dots
    for (const ex of [hx + 4, hx + 15]) {
      ctx.beginPath(); ctx.ellipse(ex, hy - 2, 3.6, 5.2, 0, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
      D.circle(ctx, ex + 1.2, hy - 4, 1.5, '#ffffff', 0);
    }
    D.circle(ctx, hx + 18, hy + 8, 4.5, '#ff9fb6', 0);   // cheek
    D.circle(ctx, hx - 4, hy + 8, 4, '#ff9fb6', 0);
    ctx.beginPath(); ctx.arc(hx + 10, hy + 6, 5, 0.25, Math.PI - 0.4); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
    drawHat(ctx, hat, hx, hy);
  }

  function drawHat(ctx, hat, hx, hy) {
    ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = INK;
    if (hat === 'cap') {
      // pointy leaf-green cap with a red feather
      ctx.beginPath(); ctx.moveTo(hx - 26, hy - 10); ctx.quadraticCurveTo(hx - 22, hy - 38, hx + 2, hy - 30);
      ctx.quadraticCurveTo(hx + 18, hy - 26, hx + 24, hy - 12); ctx.quadraticCurveTo(hx, hy - 20, hx - 26, hy - 10); ctx.closePath();
      ctx.fillStyle = '#3fbf6f'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx - 22, hy - 24); ctx.quadraticCurveTo(hx - 44, hy - 44, hx - 40, hy - 52); ctx.quadraticCurveTo(hx - 24, hy - 46, hx - 18, hy - 28); ctx.closePath();
      ctx.fillStyle = '#ef476f'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    } else if (hat === 'flower') {
      const cols = ['#ef476f', '#ffd166', '#9b5de5', '#06d6a0', '#f15bb5'];
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * (1.05 + i * 0.2);
        const fx = hx + Math.cos(a) * 23, fy = hy + Math.sin(a) * 23;
        for (let k = 0; k < 5; k++) { const b = k / 5 * Math.PI * 2; D.circle(ctx, fx + Math.cos(b) * 4.5, fy + Math.sin(b) * 4.5, 4, cols[i], 2); }
        D.circle(ctx, fx, fy, 3, '#fff3b0', 1.5);
      }
    } else if (hat === 'bunny') {
      for (const [ex, tilt] of [[-8, -0.25], [10, 0.2]]) {
        ctx.save(); ctx.translate(hx + ex, hy - 22); ctx.rotate(tilt);
        ctx.beginPath(); ctx.ellipse(0, -18, 8, 20, 0, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, -18, 3.5, 13, 0, 0, Math.PI * 2); ctx.fillStyle = '#ffafcc'; ctx.fill();
        ctx.restore();
      }
      ctx.beginPath(); ctx.arc(hx, hy, 24, Math.PI * 1.15, Math.PI * 1.85); ctx.lineWidth = 9; ctx.stroke(); ctx.strokeStyle = '#f15bb5'; ctx.lineWidth = 5; ctx.stroke();
    } else if (hat === 'wizard') {
      ctx.beginPath(); ctx.moveTo(hx - 22, hy - 16); ctx.quadraticCurveTo(hx - 4, hy - 50, hx - 16, hy - 74); ctx.quadraticCurveTo(hx + 8, hy - 50, hx + 22, hy - 16); ctx.closePath();
      ctx.fillStyle = '#7b4ccf'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(hx, hy - 16, 32, 7, 0, 0, Math.PI * 2); ctx.fillStyle = '#9b5de5'; ctx.fill(); ctx.stroke();
      D.star(ctx, hx - 2, hy - 38, 7, '#ffd166', 2);
    } else if (hat === 'crown') {
      ctx.beginPath(); ctx.moveTo(hx - 20, hy - 14); ctx.lineTo(hx - 22, hy - 38); ctx.lineTo(hx - 10, hy - 26); ctx.lineTo(hx, hy - 42); ctx.lineTo(hx + 10, hy - 26);
      ctx.lineTo(hx + 22, hy - 38); ctx.lineTo(hx + 20, hy - 14); ctx.closePath();
      ctx.fillStyle = '#ffc93c'; ctx.fill(); ctx.stroke();
      D.circle(ctx, hx, hy - 20, 4, '#ef476f', 2); D.circle(ctx, hx - 12, hy - 19, 3, '#118ab2', 2); D.circle(ctx, hx + 12, hy - 19, 3, '#06d6a0', 2);
    }
  }

  function drawArcher(ctx, angle, power, showArrow, tunic = '#2fbf71', fletch = null) {
    ctx.save();
    ctx.translate(AX, GROUND); ctx.scale(AS, AS);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(0, 2, 30, 6, 0, 0, Math.PI * 2); ctx.fill();
    // quiver on the back with spare arrows
    ctx.save(); ctx.translate(-20, -60); ctx.rotate(-0.35);
    for (const [dx, c] of [[-5, '#ef476f'], [1, '#ffd166'], [7, '#06d6a0']]) {
      ctx.beginPath(); ctx.moveTo(dx, -8); ctx.lineTo(dx - 4, -22); ctx.lineTo(dx + 4, -22); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
    }
    D.box(ctx, -10, -10, 22, 40, 7, '#a8683a', 4);
    ctx.restore();
    // legs + boots
    D.box(ctx, -14, -26, 11, 22, 4, '#3d5a80', 3.5);
    D.box(ctx, 3, -26, 11, 22, 4, '#3d5a80', 3.5);
    D.box(ctx, -17, -8, 17, 10, 5, '#8a4b2a', 3.5);
    D.box(ctx, 1, -8, 17, 10, 5, '#8a4b2a', 3.5);
    // tunic
    ctx.beginPath(); ctx.moveTo(-16, -66); ctx.quadraticCurveTo(-24, -40, -22, -22); ctx.lineTo(22, -22); ctx.quadraticCurveTo(24, -40, 16, -66); ctx.quadraticCurveTo(0, -72, -16, -66); ctx.closePath();
    ctx.fillStyle = tunic; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    D.box(ctx, -21, -38, 42, 8, 3, '#8a4b2a', 3);
    D.box(ctx, -4, -39, 9, 10, 2, '#ffd166', 2.5);
    drawHead(ctx, hatId);

    // ---- the bow arm turns with the aim ----
    const dx = Math.cos(angle), dy = -Math.sin(angle);
    const nx = -dy, ny = dx;                           // across the bow
    const sh = SHOULDER;
    const hand = { x: sh.x + dx * 34, y: sh.y + dy * 34 };
    const pull = 10 + power * 34;
    const nock = { x: hand.x - dx * pull, y: hand.y - dy * pull };
    const tip1 = { x: hand.x + nx * 40 - dx * 10, y: hand.y + ny * 40 - dy * 10 };
    const tip2 = { x: hand.x - nx * 40 - dx * 10, y: hand.y - ny * 40 - dy * 10 };
    // front arm
    ctx.strokeStyle = INK; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(sh.x, sh.y); ctx.lineTo(hand.x, hand.y); ctx.stroke();
    ctx.strokeStyle = tunic; ctx.lineWidth = 6; ctx.stroke();
    // bow: a curve bulging toward the target
    ctx.beginPath(); ctx.moveTo(tip1.x, tip1.y); ctx.quadraticCurveTo(hand.x + dx * 26, hand.y + dy * 26, tip2.x, tip2.y);
    ctx.strokeStyle = INK; ctx.lineWidth = 10; ctx.stroke();
    ctx.strokeStyle = '#c1121f'; ctx.lineWidth = 5; ctx.stroke();
    // string
    ctx.beginPath(); ctx.moveTo(tip1.x, tip1.y); ctx.lineTo(nock.x, nock.y); ctx.lineTo(tip2.x, tip2.y);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.stroke();
    // the arrow waiting on the string
    if (showArrow) {
      ctx.save(); ctx.translate(nock.x + dx * ARROW_LEN / AS, nock.y + dy * ARROW_LEN / AS); ctx.rotate(Math.atan2(dy, dx)); ctx.scale(1 / AS, 1 / AS);
      arrowShape(ctx, ARROW_LEN, true, fletch); ctx.restore();
    }
    D.circle(ctx, hand.x, hand.y, 6, '#ffd6a5', 3);
    // back arm pulls the string
    ctx.strokeStyle = INK; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(sh.x - 4, sh.y + 2); ctx.lineTo(nock.x, nock.y); ctx.stroke();
    ctx.strokeStyle = tunic; ctx.lineWidth = 6; ctx.stroke();
    D.circle(ctx, nock.x, nock.y, 6, '#ffd6a5', 3);
    ctx.restore();
  }

  // ---------------------------------------------------------------
  // Drawing: aiming guide, HUD
  // ---------------------------------------------------------------
  function drawGuide(g, ctx) {
    if (g.difficulty === 'challenge') return;
    const showT = g.pick(3.5, 0.32, 0);
    const pw = Math.max(aim.power, phase === 'ready' ? 0.5 : aim.power);  // before pulling: a hint at half power
    const sim = simulate(aim.angle, pw, clock, showT);
    const pts = sim.pts;
    for (let i = 1; i < pts.length; i += 2) {
      const f = 1 - i / pts.length * (g.difficulty === 'easy' ? 0.6 : 1);
      const r = (g.difficulty === 'easy' ? 5 : 4.5) * Math.max(0.5, f);
      ctx.globalAlpha = phase === 'ready' ? 0.45 : Math.max(0.25, f);
      D.circle(ctx, pts[i].x, pts[i].y, r, '#ffffff', 2.5);
    }
    ctx.globalAlpha = 1;
    // Easy: show a ring where it will land
    if (g.difficulty === 'easy' && phase === 'aim' && pts.length > 2) {
      const e = pts[pts.length - 1];
      ctx.beginPath(); ctx.arc(e.x, e.y, 12 + Math.sin(clock * 8) * 2, 0, Math.PI * 2);
      ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    }
  }

  function drawPull(g, ctx) {
    // a stretchy band from where you pressed to your finger
    if (!drag || drag.mode !== 'ptr') return;
    const p = g.input.pointer;
    ctx.setLineDash([8, 8]); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.moveTo(drag.sx, drag.sy); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.setLineDash([]);
    D.circle(ctx, drag.sx, drag.sy, 10, 'rgba(255,255,255,0.6)', 3);
    D.circle(ctx, p.x, p.y, 16, 'rgba(255,209,102,0.85)', 4);
  }

  function arrowIcon(ctx, x, y, on) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 2); ctx.globalAlpha = on ? 1 : 0.3; ctx.scale(0.7, 0.7);
    arrowShape(ctx, ARROW_LEN); ctx.restore();
  }

  function drawHUD(g, ctx) {
    // arrows left (leave the top-left corner free for the home button)
    if (L.practice) {
      arrowIcon(ctx, 112, 44, true);
      D.text(ctx, String(Math.max(0, PRACTICE_MAX - shots)), 150, 44, { size: 30, align: 'left' });
    } else {
      const total = L.arrows + g.pick(2, 0, 0);
      for (let i = 0; i < total; i++) arrowIcon(ctx, 110 + i * 22, 44, i < arrowsLeft);
    }
    // score + star bar (the first star is the goal)
    D.text(ctx, String(score), W / 2, 32, { size: 40 });
    const bx = W / 2 - 130, bw = 260, by = 64;
    D.meter(ctx, bx, by, bw, 18, score / thresholds[2], '#ffd166');
    for (let i = 0; i < 3; i++) {
      const sx = bx + bw * thresholds[i] / thresholds[2];
      D.star(ctx, Math.min(sx, bx + bw - 4), by + 9, i === 0 ? 15 : 13, score >= thresholds[i] ? '#ffd166' : '#f1ece0', 3);
    }
    // goal number under the first star
    D.text(ctx, String(thresholds[0]), bx + bw * thresholds[0] / thresholds[2], by + 36, { size: 16, lineWidth: 4 });
    drawWind(ctx, 760, 46);
    if (L.practice) {
      D.box(ctx, DONE.x, DONE.y, DONE.w, DONE.h, 22, '#06d6a0', 5);
      ctx.beginPath(); ctx.moveTo(DONE.x + 30, DONE.y + 34); ctx.lineTo(DONE.x + 46, DONE.y + 50); ctx.lineTo(DONE.x + 74, DONE.y + 20);
      ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.stroke();
      D.text(ctx, 'Done', DONE.x + DONE.w / 2, DONE.y + 68, { size: 18, lineWidth: 4 });
    }
  }

  // Friends HUD: a chip per player (animal face, points, arrows left).
  // The chip of whoever's turn it is is yellow and bounces; a big face floats over Pip.
  function drawFriendsHUD(g, ctx) {
    const cur = shooterSeat();
    const n = Math.max(1, order.length), w = Math.min(170, (W - 200) / n - 8);
    let x = W / 2 - (n * (w + 8) - 8) / 2;
    for (const s of order) {
      const who = peerOf(s), on = s === cur;
      const y = 12 + (on ? Math.abs(Math.sin(clock * 5)) * -4 : 0);
      D.box(ctx, x, y, w, 64, 22, on ? '#fff3c4' : 'rgba(255,255,255,0.88)', on ? 5 : 4);
      drawAvatar(ctx, who, x + 30, y + 32, 22);
      D.text(ctx, String(frScores[s] || 0), x + Math.min(w - 40, 90), y + 26, { size: 28 });
      // arrows left: little dots in the player's color
      const left = FR_ARROWS - (frShots[s] || 0);
      for (let i = 0; i < FR_ARROWS; i++) D.circle(ctx, x + 60 + i * Math.min(16, (w - 72) / FR_ARROWS), y + 50, 5, i < left ? seatColor(s) : 'rgba(43,43,43,0.15)', 2);
      x += w + 8;
    }
    drawWind(ctx, W - 86, 128);
    // whose turn: their face in a bubble over Pip
    if (cur !== null && (phase === 'ready' || phase === 'aim')) {
      const who = peerOf(cur), bob = Math.sin(clock * 3) * 4;
      D.circle(ctx, AX + 10, 230 + bob, 40, '#ffffff', 4);
      ctx.beginPath(); ctx.moveTo(AX + 2, 268 + bob); ctx.lineTo(AX + 14, 290 + bob); ctx.lineTo(AX + 22, 266 + bob); ctx.fillStyle = '#ffffff'; ctx.fill();
      drawAvatar(ctx, who, AX + 10, 230 + bob, 32);
      if (cur !== mySeat) {   // waiting: three little dots
        for (let i = 0; i < 3; i++) D.circle(ctx, AX + 66 + i * 16, 236 + bob, 5 + (Math.floor(clock * 3) % 3 === i ? 2 : 0), '#ffffff', 2.5);
      }
    }
    if (turnT > 0) {
      ctx.globalAlpha = Math.min(1, turnT * 2);
      D.text(ctx, 'Your turn!', W / 2, 200, { size: Math.round(54 * (1 + Math.max(0, turnT - 1.3))), color: '#ffd166' });
      ctx.globalAlpha = 1;
    }
  }

  // Wind sign: a flag that blows the way the wind goes, plus 0-4 wind lines.
  function drawWind(ctx, x, y) {
    D.box(ctx, x - 74, y - 28, 148, 58, 16, 'rgba(255,255,255,0.85)', 4);
    const dir = Math.sign(wind) || 0, n = Math.ceil(Math.abs(wind) - 0.01);
    const px = dir < 0 ? x + 58 : x - 58;   // the pole stands on the side the wind comes from
    // pole
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(px, y + 22); ctx.lineTo(px, y - 22); ctx.stroke();
    // flag
    ctx.beginPath();
    if (!dir) { ctx.moveTo(px, y - 20); ctx.quadraticCurveTo(px + 6, y - 6, px + 3, y + 8); ctx.lineTo(px + 12, y - 4); ctx.quadraticCurveTo(px + 14, y - 14, px, y - 20); }
    else {
      const wav = Math.sin(clock * 10) * 3, len = 18 + n * 4;
      ctx.moveTo(px, y - 20); ctx.quadraticCurveTo(px + dir * len / 2, y - 22 + wav, px + dir * len, y - 12);
      ctx.quadraticCurveTo(px + dir * len / 2, y - 6 - wav, px, y - 4);
    }
    ctx.closePath(); ctx.fillStyle = '#ef476f'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    if (!dir) { D.text(ctx, 'calm', x + 16, y, { size: 18, lineWidth: 4, color: '#8ecae6' }); return; }
    // wind lines: more lines = stronger wind
    ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const ly = y - 15 + i * 10 + (4 - n) * 5;
      const x0 = x - 2 * dir, x1 = x + 44 * dir;
      const off = ((clock * 40 + i * 9) % 10) * dir;
      ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(x0 + off, ly); ctx.lineTo(x1 + off - dir * 8, ly); ctx.stroke();
    }
    // arrow head showing direction
    ctx.beginPath(); ctx.moveTo(x + 52 * dir + (dir > 0 ? 6 : -6), y); ctx.lineTo(x + 40 * dir, y - 10); ctx.lineTo(x + 40 * dir, y + 10); ctx.closePath();
    ctx.fillStyle = '#118ab2'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  }

  function render(g, ctx) {
    if (!L) { L = LEVELS[0]; theme = THEMES.meadow; things = []; }
    drawBackground(g, ctx);
    for (const a of arrows) if (a.state === 'stuck' && !a.on) drawStuck(ctx, a);   // in the ground
    for (const t of things) drawThing(ctx, t);
    drawAir(ctx);
    const canShoot = (phase === 'ready' || phase === 'aim') && myTurn();
    if (canShoot && (g.state === 'play' || g.state === 'paused')) drawGuide(g, ctx);
    if (friendsGame) {
      // Pip wears the color of whoever's turn it is
      const cur = shooterSeat(), who = flying ? owner : cur;
      const col = who === null ? '#2fbf71' : seatColor(who);
      drawArcher(ctx, aim.angle, phase === 'aim' ? aim.power : 0, (phase === 'ready' || phase === 'aim') && cur !== null, col, col);
    } else drawArcher(ctx, aim.angle, phase === 'aim' ? aim.power : 0, canShoot && (L.practice || arrowsLeft > 0));
    // power meter under Pip while pulling
    if (phase === 'aim') D.meter(ctx, AX - 60, GROUND + 46, 120, 16, aim.power, aim.power > 0.85 ? '#ef476f' : aim.power > 0.5 ? '#ff8c42' : '#06d6a0');
    if (flying) drawFlying(ctx, flying);
    drawPull(g, ctx);
    for (const p of popups) {
      ctx.globalAlpha = Math.min(1, (1.3 - p.t) * 3);
      const pop = 1 + Math.max(0, 0.25 - p.t) * 1.5;
      D.text(ctx, p.text, p.x, p.y, { size: Math.round(p.size * pop), color: p.color });
      ctx.globalAlpha = 1;
    }
    if (g.state !== 'menu') { if (friendsGame) drawFriendsHUD(g, ctx); else drawHUD(g, ctx); }
    // level name at the start
    if (banner > 0 && g.state === 'play') {
      ctx.globalAlpha = Math.min(1, banner * 2);
      const idx = LEVELS.indexOf(L);
      D.box(ctx, W / 2 - 200, 170, 400, 96, 24, 'rgba(255,255,255,0.92)', 5);
      D.text(ctx, L.practice ? 'Practice!' : friendsGame ? 'Take turns!' : (idx + 1) + '. ' + L.name, W / 2, 202, { size: 34, color: '#ffd166' });
      D.text(ctx, theme.name, W / 2, 242, { size: 20, color: '#8ecae6', lineWidth: 5 });
      ctx.globalAlpha = 1;
    }
  }

  // ---------------------------------------------------------------
  // Menus: level tiles, hats and trails
  // ---------------------------------------------------------------
  function levelPic(lv) {
    const t = THEMES[lv.theme];
    const bits = [];
    const target = (x, y, r) => [r, r * 0.8, r * 0.6, r * 0.4, r * 0.2].map((rr, i) => `<ellipse cx="${x}" cy="${y}" rx="${rr * 0.7}" ry="${rr}" fill="${RING_COLORS[4 - i]}" stroke="#2b2b2b" stroke-width="${i ? 1.5 : 3}"/>`).join('');
    const kinds = lv.things.map(x => x.kind);
    if (kinds.includes('wheel')) bits.push(`<circle cx="82" cy="34" r="20" fill="#06d6a0" stroke="#2b2b2b" stroke-width="3"/><path d="M82 14 V54 M62 34 H102" stroke="#2b2b2b" stroke-width="2.5"/><path d="M82 34 L96 20 A20 20 0 0 1 102 34 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="2"/>`);
    else bits.push(`<path d="M76 52 L70 62 M88 52 L94 62" stroke="#2b2b2b" stroke-width="4"/>` + target(82, 36, 18));
    if (kinds.includes('balloon')) bits.push(`<line x1="36" y1="32" x2="38" y2="48" stroke="#2b2b2b" stroke-width="2"/><ellipse cx="36" cy="22" rx="9" ry="11" fill="#ef476f" stroke="#2b2b2b" stroke-width="3"/>`);
    if (kinds.includes('star')) bits.push(`<path d="M50 6 L53 13 L60 13 L55 18 L57 25 L50 21 L43 25 L45 18 L40 13 L47 13 Z" fill="#ffc93c" stroke="#2b2b2b" stroke-width="2"/>`);
    if (lv.wind) bits.push(`<path d="M8 14 H28 M12 22 H26" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>`);
    if (lv.practice) bits.push(`<path d="M22 20 Q6 38 22 58" fill="none" stroke="#c1121f" stroke-width="5" stroke-linecap="round"/><path d="M22 20 L22 58" stroke="#fff" stroke-width="2"/>`);
    return `<svg viewBox="0 0 120 70"><rect width="120" height="70" fill="${t.sky[0]}"/><rect y="58" width="120" height="12" fill="${t.ground}" stroke="#2b2b2b" stroke-width="3"/>${bits.join('')}</svg>`;
  }

  function levels(g) {
    const list = [Object.assign({}, PRACTICE, { pic: levelPic(PRACTICE), meta: 'Free shots!' })];
    LEVELS.forEach((lv, i) => {
      const open = i === 0 || (g.save.levels[LEVELS[i - 1].id] || {}).done;
      list.push(Object.assign({}, lv, { name: (i + 1) + '. ' + lv.name, pic: levelPic(lv), locked: !open }));
    });
    return list;
  }

  // Draw a hat or trail on a little canvas and turn it into a picture for the menu.
  function hatPic(id) {
    const c = document.createElement('canvas'); c.width = 120; c.height = 110;
    const x = c.getContext('2d');
    x.translate(60, 140); x.scale(1.15, 1.15);
    drawHead(x, id);
    return `<img alt="" src="${c.toDataURL()}" style="width:80px;height:74px">`;
  }
  function trailPic(id) {
    const c = document.createElement('canvas'); c.width = 140; c.height = 80;
    const x = c.getContext('2d');
    x.fillStyle = '#7fd0ff'; D.rr(x, 2, 2, 136, 76, 14); x.fill();
    const save = trailId; trailId = id;
    const fake = { x: 120, y: 30, ang: -0.25, trail: [] };
    for (let i = 0; i < 26; i++) fake.trail.push({ x: 10 + i * 4.3, y: 60 - Math.sin(i / 25 * 2.2) * 34 });
    const keep = clock; clock = 0;
    drawFlying(x, fake);
    if (id === 'sparkle') for (const [sx, sy] of [[40, 32], [70, 22], [24, 52]]) D.star(x, sx, sy, 6, '#ffd166', 1.5);
    clock = keep; trailId = save;
    return `<img alt="" src="${c.toDataURL()}" style="width:90px;height:52px">`;
  }

  function extraMenu(g) {
    const wrap = Arcade.h('div');
    const total = totalStars(g);
    wrap.appendChild(Arcade.h('h2', { class: 'ar-title', style: 'font-size:24px;margin-top:16px' }, 'Dress up Pip ' + icons.star(true).replace('<svg', '<svg style="width:26px;height:26px;vertical-align:-4px"') + ' ' + total));
    for (const [kind, list, pic] of [['hat', HATS, hatPic], ['trail', TRAILS, trailPic]]) {
      const row = Arcade.h('div', { class: 'ar-grid' });
      const current = ownedPick(g, list, g.save.data[kind]);
      for (const it of list) {
        const ok = owns(g, kind, it);
        const tile = Arcade.h('button', { type: 'button', class: 'ar-tile' + (ok ? '' : ' locked') + (it.id === current ? ' picked' : '') },
          `<div class="pic">${pic(it.id)}</div><div>${it.name}</div>` +
          `<div class="meta">${ok ? '' : icons.star(true).replace('<svg', '<svg style="width:20px;height:20px;vertical-align:-3px"') + ' ' + it.need}</div>` +
          (ok ? '' : `<div class="lock">${icons.lock}</div>`));
        tile.addEventListener('click', () => {
          if (!ok) { Arcade.sfx('bonk'); return; }
          Arcade.sfx('click');
          g.save.data[kind] = it.id; g.store();
          row.querySelectorAll('.ar-tile').forEach(t => t.classList.remove('picked'));
          tile.classList.add('picked');
        });
        row.appendChild(tile);
      }
      wrap.appendChild(row);
    }
    return wrap;
  }

  // ---------------------------------------------------------------
  // Start the game
  // ---------------------------------------------------------------
  const S = (inner) => `<svg viewBox="0 0 80 80">${inner}</svg>`;
  const LINK = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';   // outline style for the logo picture
  Arcade.start({
    id: 'archery',
    trophies: [
      { id: 'win', name: 'On target', how: 'Win a level' },
      { id: 'bullseye', name: 'Bullseye!', how: 'Hit the very middle' },
      { id: 'golden', name: 'Golden star', how: 'Hit a golden star' },
      { id: 'three-stars', name: 'Sharp shooter', how: 'Get 3 stars on a level' },
      { id: 'balloons', name: 'Balloon popper', how: 'Pop 10 balloons in one level' },
      { id: 'last', name: 'Adventure hero', how: 'Win the last level' },
      { id: 'eagle', name: 'Eagle eye', how: '5 bullseyes in one level', secret: true },
      { id: 'sneaky', name: 'Sneaky win', how: 'Win without a bullseye or a balloon', secret: true },
    ],   // the trophy room (secret ones show '???' until earned)
    logo: Arcade.logo({
      badge: Arcade.badges.archery,   // the round picture (arcade/badges.js)
      title: 'Bullseye', title2: 'Adventure', colors: ['#b9fbc0', '#06d6a0'], bg: '#b8e0d2', art: `<g class="wobble"><circle cx="170" cy="80" r="52" fill="#fff" ${LINK}/><circle cx="170" cy="80" r="38" fill="#ef476f" ${LINK}/><circle cx="170" cy="80" r="24" fill="#fff" ${LINK}/><circle cx="170" cy="80" r="10" fill="#ffd166" ${LINK}/></g>
              <path d="M30 86 L168 80" ${LINK} fill="none"/><path d="M168 80 L150 72 L152 88 Z" fill="#2b2b2b"/><path d="M30 86 L18 76 M30 86 L18 96" ${LINK} fill="none"/>
              <ellipse cx="60" cy="40" rx="16" ry="20" fill="#9b5de5" ${LINK}/><path d="M60 60 Q56 70 62 80" fill="none" ${LINK} stroke-width="2"/>` }),   // title screen
    menuMusic: { tempo: 108, root: 62, scale: 'dorian', prog: [[1, 7, 1, 5], [4, 5, 1, 1], [3, 7, 4, 5]], drums: 'march', bass: 'walk', lead: 'brass', harmony: 'flute', pad: true, arp: false, seed: 1404,
        tune: { A: '1/2 1 3 5 8/4 5 | 7/2 7 9 7 4/4 2 | 3/2 3 5 3 1/4 3 | 5/8 r/8',
                B: '8/4 8 6 4 | 7/4 7 9 7 | 8/2 10 12/4 10 8 | 8/16',
                C: '10/8 7 | 9/8 11 | 8/8 6 | 5/4 7 9/8' } },   // the title/menu song
    title: 'Bullseye Adventure',
    view: { w: W, h: H },
    background: '#7fd0ff',
    music: (g) => (g.level ? THEMES[g.level.theme].music : THEMES.meadow.music),   // each place has its own song
    levelsTitle: 'Pick a level',
    howTo: [
      { pic: S(`<path d="M30 14 Q10 40 30 66" fill="none" stroke="#c1121f" stroke-width="7" stroke-linecap="round"/><path d="M30 14 L14 40 L30 66" fill="none" stroke="#2b2b2b" stroke-width="3"/><circle cx="14" cy="40" r="7" fill="#ffd166" stroke="#2b2b2b" stroke-width="3"/><path d="M34 40 H70 M62 32 L72 40 L62 48" fill="none" stroke="#2b2b2b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`), text: 'Pull back, let go!', keys: 'Drag &amp; let go — or Up/Down + hold Space' },
      { pic: S([30, 24, 18, 12, 6].map((r, i) => `<circle cx="40" cy="40" r="${r}" fill="${RING_COLORS[4 - i]}" stroke="#2b2b2b" stroke-width="${i ? 2 : 4}"/>`).join('')), text: 'Middle = most points!' },
      { pic: S(`<ellipse cx="40" cy="32" rx="18" ry="22" fill="#ef476f" stroke="#2b2b2b" stroke-width="4"/><path d="M40 54 Q36 64 42 74" fill="none" stroke="#2b2b2b" stroke-width="3"/><path d="M60 14 L64 22 L72 22 L66 28 L68 36 L60 32 L52 36 L54 28 L48 22 L56 22 Z" fill="#ffc93c" stroke="#2b2b2b" stroke-width="2.5"/>`), text: 'Pop balloons, grab stars' },
      { pic: S(`<path d="M16 66 V14" stroke="#2b2b2b" stroke-width="5" stroke-linecap="round"/><path d="M16 14 Q34 12 46 22 Q34 30 16 30 Z" fill="#ef476f" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/><path d="M34 46 H66 M40 58 H70" stroke="#118ab2" stroke-width="5" stroke-linecap="round"/>`), text: 'Wind blows your arrow' },
    ],
    levels,
    extraMenu,
    friends: (g) => friendsMenu(g),   // take turns on one target on several phones (arcade/net.js)
    setup,
    update,
    draw: render,
  });
})();
