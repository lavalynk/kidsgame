// =====================================================================
// Putt-Putt Park (Keith, Nov 13): a simple mini golf game.
//
// You look down on one hole from above. Pull back anywhere on the screen
// (like a slingshot) and let go to putt; the further you pull, the harder
// the putt. Keyboard: left / right to aim, hold Space for power.
// Get the ball in the cup in as few putts as you can.
//
// It is gentle: there is no losing. Water just pops the ball back where it
// was, little kids get a bigger cup that pulls the ball in, and after 8
// putts on a hole the cup starts pulling from far away.
//
// A hole is a list in HOLES (further down): its greens (shapes of grass with
// walls around them), where the tee and the cup are, and the fun stuff:
// blocks, bumpers, sand, water, slopes, a windmill, a sliding block, pipes.
// Everything is on a 960 x 540 grid.
//
// The ball's movement is ONE function, step(): the game calls it 3 times
// every 1/120 s. The dotted aiming line and the test bot call the very same
// function on a pretend ball (sim()), so what they show is what happens.
// =====================================================================
(function () {
  'use strict';
  const { draw, math, icons } = Arcade;
  const INK = '#2b2b2b';
  const W = 960, H = 540;
  const BR = 10;                 // the ball's radius
  const SUB = 3;                 // little steps per 1/120 s (so a fast ball can't jump through a wall)
  const DT = 1 / 120;
  const MIN_SPEED = 200, MAX_SPEED = 1100;    // a tiny putt ... a full-power putt (grid units a second)
  const PIPE_STEPS = 42;         // how long the ball is inside a pipe (in 1/120 s steps)

  // ---------------------------------------------------------------
  // The holes
  //   greens:  shapes of grass, each a list of corners [x, y]. Their edges are walls.
  //   blocks:  wooden shapes on the grass (walls too)
  //   bumpers: [x, y, radius]  - round, bouncy
  //   sand / water: [x, y, rx, ry]  - ovals. Sand slows the ball, water pops it back.
  //   slopes:  [x, y, w, h, pushX, pushY] - a hill that pushes the ball
  //   spinner: { x, y, len, blades, speed } - the windmill's turning bars
  //   slider:  { x, y, w, h, dx, dy, speed } - a block sliding to and fro (dx, dy = how far)
  //   pipes:   { a: [x, y], b: [x, y], dir: [x, y] } - in at a, out at b flying towards dir
  // ---------------------------------------------------------------
  const box = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const HOLES = [
    { id: 'h1', name: 'Easy Street', par: 2, tee: [230, 305], cup: [730, 305],
      greens: [box(150, 230, 660, 150)] },
    { id: 'h2', name: 'The Corner', par: 3, tee: [180, 195], cup: [780, 405],
      greens: [[[110, 120], [470, 120], [560, 210], [560, 330], [850, 330], [850, 480], [410, 480], [410, 270], [110, 270]]] },
    { id: 'h3', name: 'Bumper Garden', par: 3, tee: [210, 300], cup: [760, 300],
      greens: [box(130, 160, 700, 280)],
      bumpers: [[480, 300, 32], [370, 215, 24], [370, 385, 24], [600, 215, 24], [600, 385, 24]] },
    { id: 'h4', name: 'Sandy Beach', par: 3, tee: [210, 300], cup: [760, 300],
      greens: [box(130, 170, 700, 260)],
      sand: [[480, 300, 130, 82]] },
    { id: 'h5', name: 'Duck Pond', par: 3, tee: [200, 300], cup: [770, 300],
      greens: [box(120, 140, 720, 320)],
      water: [[480, 300, 150, 88]] },
    { id: 'h6', name: 'Windmill', par: 3, tee: [200, 305], cup: [770, 305],
      greens: [box(120, 215, 720, 180)],
      spinner: { x: 480, y: 305, len: 72, blades: 2, speed: 1.5 } },
    { id: 'h7', name: 'Slippy Hill', par: 3, tee: [210, 380], cup: [760, 215],
      greens: [box(130, 150, 700, 300)],
      slopes: [[390, 150, 180, 300, 0, 330]] },
    { id: 'h8', name: 'Pipe Dream', par: 3, tee: [170, 385], cup: [790, 300],
      greens: [box(110, 300, 330, 170), box(540, 110, 310, 250)],
      pipes: [{ a: [390, 385], b: [590, 160], dir: [1, 0] }],
      bumpers: [[765, 168, 26]] },
    { id: 'h9', name: 'Grand Finale', par: 4, tee: [180, 180], cup: [180, 410],
      greens: [[[110, 110], [760, 110], [850, 200], [850, 390], [760, 480], [110, 480], [110, 340], [700, 340], [700, 250], [110, 250]]],
      slider: { x: 450, y: 180, w: 30, h: 56, dx: 0, dy: 40, speed: 1.6 },
      sand: [[470, 446, 90, 30]] },
  ];
  // Get each hole ready: fill in the empty lists and turn every shape into wall pieces.
  for (const h of HOLES) {
    for (const k of ['blocks', 'bumpers', 'sand', 'water', 'slopes', 'pipes']) h[k] = h[k] || [];
    h.segs = [];
    for (const poly of h.greens.concat(h.blocks)) poly.forEach((p, i) => { const q = poly[(i + 1) % poly.length]; h.segs.push([p[0], p[1], q[0], q[1]]); });
  }
  const COURSE = { id: 'course', name: 'All 9 holes', course: true };

  // Ball colors you can pick (more unlock as you win stars)
  const BALLS = [
    { id: 'white', color: '#ffffff', stars: 0 }, { id: 'yellow', color: '#ffd166', stars: 3 }, { id: 'pink', color: '#ff8fab', stars: 9 },
    { id: 'blue', color: '#4cc9f0', stars: 15 }, { id: 'green', color: '#b9fbc0', stars: 21 }, { id: 'rainbow', color: 'rainbow', stars: 27 },
  ];
  const totalStars = (g) => HOLES.reduce((n, h) => n + ((g.save.levels[h.id] || {}).stars || 0), 0);
  const pickedBall = (g) => BALLS.find(b => b.id === g.save.data.ball && totalStars(g) >= b.stars) || BALLS[0];

  // ---------------------------------------------------------------
  // Physics
  // ---------------------------------------------------------------
  const inOval = (x, y, o) => { const dx = (x - o[0]) / o[2], dy = (y - o[1]) / o[3]; return dx * dx + dy * dy < 1; };
  function inPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  const onGreen = (h, x, y) => h.greens.some(p => inPoly(x, y, p)) && !h.blocks.some(p => inPoly(x, y, p));

  // Bounce the ball off the wall piece (ax, ay)-(bx, by). pad = how thick the wall is,
  // (svx, svy) = how fast the wall itself moves (the windmill, the sliding block).
  function hitSeg(b, ax, ay, bx, by, pad, bounce, svx, svy) {
    const dx = bx - ax, dy = by - ay;
    let t = ((b.x - ax) * dx + (b.y - ay) * dy) / (dx * dx + dy * dy || 1);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const px = ax + dx * t, py = ay + dy * t;
    let nx = b.x - px, ny = b.y - py, d = Math.hypot(nx, ny);
    if (d >= BR + pad) return false;
    if (d < 0.001) { nx = -dy; ny = dx; d = Math.hypot(nx, ny) || 1; }
    nx /= d; ny /= d;
    b.x = px + nx * (BR + pad); b.y = py + ny * (BR + pad);      // push the ball out of the wall
    if (typeof svx === 'function') [svx, svy] = svx(px, py);
    const rvx = b.vx - (svx || 0), rvy = b.vy - (svy || 0), vn = rvx * nx + rvy * ny;
    if (vn < 0) {                                                 // moving into it: bounce
      b.vx -= (1 + bounce) * vn * nx; b.vy -= (1 + bounce) * vn * ny;
      b.bounced = Math.max(b.bounced || 0, -vn);
    }
    return true;
  }
  // where the moving things are at time t
  const sliderPos = (s, t) => { const k = Math.sin(t * s.speed); return [s.x + s.dx * k, s.y + s.dy * k, Math.cos(t * s.speed) * s.speed]; };
  const bladeAngle = (sp, t, k) => t * sp.speed + k * Math.PI * 2 / sp.blades;

  // ONE little step of the ball b on hole h at time t. o = { cupR, magnet, magnetR }.
  // Returns '' (still rolling), 'cup', 'water' or 'pipe' (then b.pipe says which one).
  function step(b, h, t, dt, o) {
    let slow = 150, drag = 0.55;            // grass: a steady slow-down + a bit more when fast
    b.pushed = false; b.sand = false;
    for (const s of h.sand) if (inOval(b.x, b.y, s)) { slow = 1000; drag = 3.5; b.sand = true; }
    for (const s of h.slopes) if (b.x > s[0] && b.x < s[0] + s[2] && b.y > s[1] && b.y < s[1] + s[3]) { b.vx += s[4] * dt; b.vy += s[5] * dt; b.pushed = true; }
    // the cup pulls a slow ball in when it's close (much more for little kids)
    const cdx = h.cup[0] - b.x, cdy = h.cup[1] - b.y, cd = Math.hypot(cdx, cdy);
    if (cd < o.magnetR && cd > 0.5) { b.vx += cdx / cd * o.magnet * dt; b.vy += cdy / cd * o.magnet * dt; if (o.magnet > slow) b.pushed = true; }
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > 0) { const k = Math.max(0, sp - slow * dt) * Math.exp(-drag * dt) / sp; b.vx *= k; b.vy *= k; }
    b.x += b.vx * dt; b.y += b.vy * dt;
    // walls
    for (const s of h.segs) hitSeg(b, s[0], s[1], s[2], s[3], 0, 0.78);
    if (h.spinner) {
      const m = h.spinner;
      for (let k = 0; k < m.blades; k++) {
        const a = bladeAngle(m, t, k);
        hitSeg(b, m.x, m.y, m.x + Math.cos(a) * m.len, m.y + Math.sin(a) * m.len, 6, 0.7, (px, py) => [-m.speed * (py - m.y), m.speed * (px - m.x)]);
      }
    }
    if (h.slider) {
      const m = h.slider, [x, y, k] = sliderPos(m, t), w = m.w / 2, hh = m.h / 2, vx = m.dx * k, vy = m.dy * k;
      hitSeg(b, x - w, y - hh, x + w, y - hh, 0, 0.7, vx, vy); hitSeg(b, x + w, y - hh, x + w, y + hh, 0, 0.7, vx, vy);
      hitSeg(b, x + w, y + hh, x - w, y + hh, 0, 0.7, vx, vy); hitSeg(b, x - w, y + hh, x - w, y - hh, 0, 0.7, vx, vy);
    }
    // bumpers: always bounce the ball away briskly
    h.bumpers.forEach((m, i) => {
      let nx = b.x - m[0], ny = b.y - m[1]; const d = Math.hypot(nx, ny) || 1;
      if (d >= m[2] + BR) return;
      nx /= d; ny /= d;
      b.x = m[0] + nx * (m[2] + BR); b.y = m[1] + ny * (m[2] + BR);
      const vn = b.vx * nx + b.vy * ny;
      if (vn < 0) { b.vx -= 2 * vn * nx; b.vy -= 2 * vn * ny; }
      const out = b.vx * nx + b.vy * ny;
      if (out < 300) { b.vx += (300 - out) * nx; b.vy += (300 - out) * ny; }
      b.bumped = i;
    });
    if (Math.hypot(h.cup[0] - b.x, h.cup[1] - b.y) < o.cupR - 3 && Math.hypot(b.vx, b.vy) < 540) return 'cup';   // (too fast: it skips over)
    for (const s of h.water) if (inOval(b.x, b.y, s)) return 'water';
    for (const p of h.pipes) if (Math.hypot(p.a[0] - b.x, p.a[1] - b.y) < 15) { b.pipe = p; return 'pipe'; }
    return '';
  }
  // the ball flies out of a pipe
  function outOfPipe(b) {
    const p = b.pipe, sp = Math.max(280, Math.min(520, Math.hypot(b.vx, b.vy)));
    b.x = p.b[0] + p.dir[0] * 20; b.y = p.b[1] + p.dir[1] * 20; b.vx = p.dir[0] * sp; b.vy = p.dir[1] * sp; b.pipe = null;
  }
  // A pretend putt: where does the ball end up? (for the dotted line and the test bot)
  // Returns { x, y, end: 'stop' | 'cup' | 'water' | 'out' | 'time', path: [[x, y], ...] }
  function sim(h, from, t, angle, power, o, maxSteps, wantPath) {
    const sp = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * power;
    const b = { x: from.x, y: from.y, vx: Math.cos(angle) * sp, vy: Math.sin(angle) * sp };
    const path = [];
    let still = { x: b.x, y: b.y, n: 0 };
    for (let n = 0; n < maxSteps; n++) {
      for (let i = 0; i < SUB; i++) {
        const ev = step(b, h, t, DT / SUB, o);
        if (ev === 'cup' || ev === 'water') return { x: b.x, y: b.y, end: ev, path };
        if (ev === 'pipe') { if (wantPath) return { x: b.x, y: b.y, end: 'pipe', path }; t += PIPE_STEPS * DT; outOfPipe(b); }
      }
      t += DT;
      if (wantPath && n % 4 === 3) path.push([b.x, b.y]);
      if (stopped(b, still)) return { x: b.x, y: b.y, end: onGreen(h, b.x, b.y) ? 'stop' : 'out', path };
    }
    return { x: b.x, y: b.y, end: 'time', path };
  }
  // Has the ball come to rest? (slow and nothing pushing it - or it hasn't really moved for a moment)
  function stopped(b, still) {
    if (Math.hypot(b.vx, b.vy) < 8 && !b.pushed) return true;
    if (++still.n >= 36) {
      const moved = Math.hypot(b.x - still.x, b.y - still.y);
      still.x = b.x; still.y = b.y; still.n = 0;
      if (moved < 2) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------
  // One round
  // ---------------------------------------------------------------
  let G = null;        // the kit's game object
  let S = null;        // this round: { hole, idx, ball, strokes, ... }

  function cupOptions() {
    // easy / little: a bigger cup that pulls the ball in. After 8 putts it pulls from far away.
    const g = G, help = S.strokes >= 12 ? 2 : S.strokes >= 8 ? 1 : 0;
    const cupR = g.little ? 22 : g.pick(19, 16, 14);
    return { cupR, magnet: (g.little ? 520 : g.pick(380, 260, 200)) + help * 200, magnetR: (g.little ? 70 : g.pick(50, 30, 24)) + help * 110 };
  }
  function loadHole(idx) {
    const h = HOLES[idx];
    S.idx = idx; S.hole = h;
    S.ball = { x: h.tee[0], y: h.tee[1], vx: 0, vy: 0 };
    S.last = { x: h.tee[0], y: h.tee[1] };
    S.strokes = 0; S.moving = false; S.state = 'aim'; S.stateT = 0;
    S.aim = null; S.keyAim = Math.atan2(h.cup[1] - h.tee[1], h.cup[0] - h.tee[0]); S.keyPower = 0; S.keys = false;
    S.walls = 0; S.bumps = 0; S.trail = []; S.squish = {}; S.msg = null; S.intro = 1.4;
    S.deco = makeDeco(h, idx);
    // the box round the greens (+ a border), for zooming the picture in render()
    const xs = [].concat(...h.greens.map(p => p.map(q => q[0]))), ys = [].concat(...h.greens.map(p => p.map(q => q[1])));
    const x0 = Math.min(...xs) - 44, x1 = Math.max(...xs) + 44, y0 = Math.min(...ys) - 44, y1 = Math.max(...ys) + 44;
    S.box = { w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  }
  function setup(g, level) {
    G = g;
    S = { t: 0, card: [], course: !!level.course, done: false };
    loadHole(level.course ? 0 : HOLES.findIndex(h => h.id === level.id));
    window.__golfState = () => ({
      hole: S.hole.id, idx: S.idx, strokes: S.strokes, par: S.hole.par, state: S.state, moving: S.moving, done: S.done, course: S.course, card: S.card.slice(),
      ball: { x: Math.round(S.ball.x), y: Math.round(S.ball.y) }, cup: S.hole.cup, cupR: cupOptions().cupR, magnetR: cupOptions().magnetR, holes: HOLES.length,
    });
    // test helpers: putt (angle in radians, power 0..1); let the test bot pick a good putt
    window.__golfShoot = (angle, power) => (S.state === 'aim' ? (shoot(angle, power), true) : false);
    window.__golfBot = () => { if (S.state !== 'aim') return null; const s = botShot(); shoot(s.angle, s.power); return s; };
    window.__golfSim = (angle, power) => { const r = sim(S.hole, S.ball, S.t, angle, power, cupOptions(), 1500, false); return { x: r.x, y: r.y, end: r.end }; };
  }

  function say(text, color) { S.msg = { text, color: color || '#fff', t: 0 }; }
  function shoot(angle, power) {
    const sp = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * math.clamp(power, 0, 1);
    S.last = { x: S.ball.x, y: S.ball.y };
    S.ball.vx = Math.cos(angle) * sp; S.ball.vy = Math.sin(angle) * sp;
    S.strokes++; S.moving = true; S.state = 'roll'; S.walls = 0; S.bumps = 0; S.fromSand = false;
    S.still = { x: S.ball.x, y: S.ball.y, n: 0 };
    S.aim = null; S.keyPower = 0; S.intro = 0;
    G.sfx('hit'); G.tone(300 + power * 500, 0.08, { type: 'triangle', vol: 0.2 });
    G.particles.burst(S.ball.x, S.ball.y, { count: 6, colors: ['#fff', '#b9fbc0'], speed: 120, size: 5, life: 0.35, gravity: 0 });
  }
  // pop the ball back where the putt started (water, or it somehow left the grass)
  function backToLast() { S.ball.x = S.last.x; S.ball.y = S.last.y; S.ball.vx = S.ball.vy = 0; S.moving = false; S.state = 'aim'; S.trail = []; }

  function holed() {
    const g = G, h = S.hole, n = S.strokes, par = h.par;
    S.state = 'in'; S.stateT = 0; S.moving = false;
    g.sfx('coin'); setTimeout(() => g.sfx('star'), 180);
    g.music.stinger('treasure');
    g.particles.burst(h.cup[0], h.cup[1], { count: 26, shape: 'star', speed: 320, size: 11, life: 1, gravity: 300 });
    say(n === 1 ? 'Hole in one!' : n < par ? 'Amazing!' : n === par ? 'Great putt!' : 'In the hole!', n <= par ? '#ffd166' : '#fff');
    g.achieve('first');
    if (n === 1) g.achieve('ace');
    if (n < par) g.achieve('birdie');
    if (S.walls >= 2) g.achieve('bank');
    if (h.spinner) g.achieve('windmill');
    if (n === 1 && h.id === 'h9') g.achieve('trick');
    S.card.push(n);
  }
  const starsFor = (n, par) => (n <= par + (G.little ? 1 : 0) ? 3 : n <= par + 2 + (G.little ? 1 : 0) ? 2 : 1);
  // the ball has dropped: results (or, on the whole course, the next hole)
  function afterHole() {
    const g = G, h = S.hole, n = S.strokes;
    if (S.course) {
      // remember each hole's best as you go round
      const rec = g.save.levels[h.id] = g.save.levels[h.id] || {};
      rec.done = true; rec.stars = Math.max(rec.stars || 0, starsFor(n, h.par));
      noteBest(h.id, n);
      if (S.idx + 1 < HOLES.length) { loadHole(S.idx + 1); g.sfx('swish'); return; }
      const total = S.card.reduce((a, b) => a + b, 0), par = HOLES.reduce((a, x) => a + x.par, 0);
      const stars = total <= par + (g.little ? 6 : 0) ? 3 : total <= par + 6 + (g.little ? 6 : 0) ? 2 : 1;
      S.done = true;
      noteBest('course', total);
      g.achieve('course'); checkAll(g);
      g.finish({ win: true, stars, score: Math.max(100, 5000 - total * 100), title: total <= par ? 'Champion!' : 'What a round!',
        lines: [ballChip(total) + ' putts', 'Par ' + par, S.card.join(' &middot; ')], delay: 500 });
      return;
    }
    S.done = true;
    noteBest(h.id, n);
    const stars = starsFor(n, h.par);
    g.finish({ win: true, stars, score: Math.max(100, 1000 - (n - 1) * 120),
      title: n === 1 ? 'Hole in one!' : n < h.par ? 'Amazing!' : n === h.par ? 'Great putt!' : 'In the hole!',
      lines: [ballChip(n) + (n === 1 ? ' putt' : ' putts'), 'Par ' + h.par], next: S.idx + 1 < HOLES.length, delay: 500 });
    setTimeout(() => checkAll(g), 900);
  }
  const ballChip = (n) => `<svg viewBox="0 0 24 24" style="width:22px;height:22px;vertical-align:-4px"><circle cx="12" cy="12" r="9" fill="#fff" stroke="#2b2b2b" stroke-width="3"/></svg> ${n}`;
  function noteBest(id, n) {
    const best = G.save.data.best = G.save.data.best || {};
    if (!best[id] || n < best[id]) { best[id] = n; G.store(); }
  }
  function checkAll(g) {
    if (HOLES.every(h => (g.save.levels[h.id] || {}).done)) g.achieve('all');
    if (HOLES.every(h => (g.save.levels[h.id] || {}).stars >= 3)) g.achieve('stars');
  }

  // ---------------------------------------------------------------
  // Every 1/120 s
  // ---------------------------------------------------------------
  function update(g, dt) {
    S.t += dt; S.stateT += dt;
    if (S.intro > 0) S.intro -= dt;
    if (S.msg) { S.msg.t += dt; if (S.msg.t > 1.6) S.msg = null; }
    for (const k in S.squish) { S.squish[k] -= dt * 4; if (S.squish[k] <= 0) delete S.squish[k]; }
    const h = S.hole, b = S.ball, o = cupOptions();

    if (S.state === 'aim') aiming(g, dt);
    else if (S.state === 'roll') {
      for (let i = 0; i < SUB; i++) {
        b.bounced = 0; b.bumped = -1;
        const wasSand = b.sand;
        const ev = step(b, h, S.t, dt / SUB, o);
        if (b.bounced > 60) { S.walls++; if (b.bounced > 120) g.tone(500 + Math.min(400, b.bounced), 0.05, { type: 'triangle', vol: Math.min(0.3, b.bounced / 2000 + 0.08) }); }
        if (b.bumped >= 0) { S.squish['b' + b.bumped] = 1; S.bumps++; g.sfx('spring'); if (S.bumps >= 3) g.achieve('boing'); }
        if (b.sand && !wasSand) { g.sfx('swish'); g.particles.burst(b.x, b.y, { count: 8, colors: ['#f4d58d', '#e9c46a'], speed: 140, size: 5, life: 0.4, gravity: 200 }); }
        if (ev === 'cup') { holed(); return; }
        if (ev === 'water') {
          S.state = 'splash'; S.stateT = 0; S.splash = { x: b.x, y: b.y };
          g.sfx('splash'); say('Splash!', '#bdefff'); g.achieve('splash');
          g.particles.burst(b.x, b.y, { count: 18, colors: ['#bdefff', '#4cc9f0', '#fff'], speed: 260, size: 7, life: 0.6, angle: -Math.PI / 2, spread: 1.6 });
          return;
        }
        if (ev === 'pipe') { S.state = 'pipe'; S.stateT = 0; S.pipeN = 0; g.sfx('whoosh'); g.achieve('pipe'); return; }
      }
      if (Math.hypot(b.vx, b.vy) > 120) { S.trail.push({ x: b.x, y: b.y, a: 1 }); if (S.trail.length > 14) S.trail.shift(); }
      if (stopped(b, S.still)) {
        b.vx = b.vy = 0; S.moving = false; S.state = 'aim';
        if (!onGreen(h, b.x, b.y)) { say('Boing!'); g.sfx('spring'); backToLast(); }
        else if (b.sand) g.achieve('beach');
      }
    } else if (S.state === 'pipe') {
      if (++S.pipeN >= PIPE_STEPS) {
        outOfPipe(b); S.state = 'roll'; S.still = { x: b.x, y: b.y, n: 0 };
        g.sfx('pop'); g.particles.burst(b.x, b.y, { count: 10, colors: ['#c77dff', '#fff'], speed: 200, size: 6, life: 0.4, gravity: 0 });
      }
    } else if (S.state === 'splash') {
      if (S.stateT > 0.9) { backToLast(); g.sfx('pop'); }
    } else if (S.state === 'in') {
      if (S.stateT > 1.5 && !S.done) afterHole();
    }
    for (const p of S.trail) p.a -= dt * 3;
  }

  // Aiming: pull back with a finger / the mouse, or use the keys.
  function aiming(g, dt) {
    const p = g.input.pointer, b = S.ball;
    if (p.justDown) { S.aim = { sx: p.x, sy: p.y, angle: 0, power: 0 }; S.keys = false; }
    if (S.aim && p.down) {
      const dx = p.x - S.aim.sx, dy = p.y - S.aim.sy, d = Math.hypot(dx, dy);
      S.aim.power = math.clamp((d - 14) / 190, 0, 1);
      if (d > 14) S.aim.angle = Math.atan2(-dy, -dx);          // the ball goes the opposite way to the pull
    }
    if (S.aim && p.justUp) {
      if (S.aim.power > 0.02) shoot(S.aim.angle, S.aim.power);
      else S.aim = null;
      return;
    }
    if (S.aim && !p.down) S.aim = null;
    // keyboard: left / right turn the arrow, hold Space to fill the power bar (it goes up and down)
    const turn = (g.input.down('ArrowRight', 'KeyD') ? 1 : 0) - (g.input.down('ArrowLeft', 'KeyA') ? 1 : 0);
    if (turn) { S.keyAim += turn * dt * 1.7; S.keys = true; }
    if (g.input.down('Space', 'Enter')) { S.keys = true; S.charging = true; S.keyT = (S.keyT || 0) + dt; S.keyPower = 1 - Math.abs(((S.keyT * 0.9) % 2) - 1); }
    else if (S.charging) { S.charging = false; S.keyT = 0; if (S.keyPower > 0.03) shoot(S.keyAim, S.keyPower); }
  }

  // ---------------------------------------------------------------
  // The test bot: tries lots of pretend putts and picks the best one.
  // "Best" = in the cup, or else ending up nearest the cup BY THE PATH the ball
  // has to roll (a flood fill over the grass, through the pipes).
  // ---------------------------------------------------------------
  const CELL = 12;
  function pathMap(h) {
    if (h.map) return h.map;
    const cols = Math.ceil(W / CELL), rows = Math.ceil(H / CELL), d = new Float32Array(cols * rows).fill(1e9);
    const ok = (c, r) => c >= 0 && r >= 0 && c < cols && r < rows && onGreen(h, c * CELL + CELL / 2, r * CELL + CELL / 2) && !h.water.some(w => inOval(c * CELL + CELL / 2, r * CELL + CELL / 2, w));
    const cell = (x, y) => [Math.floor(x / CELL), Math.floor(y / CELL)];
    const q = [cell(h.cup[0], h.cup[1])]; d[q[0][1] * cols + q[0][0]] = 0;
    while (q.length) {
      const [c, r] = q.shift(), v = d[r * cols + c];
      const next = [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]];
      for (const p of h.pipes) { const o = cell(p.b[0] + p.dir[0] * 20, p.b[1] + p.dir[1] * 20); if (o[0] === c && o[1] === r) next.push(cell(p.a[0], p.a[1])); }
      for (const [c2, r2] of next) if (ok(c2, r2) && d[r2 * cols + c2] > v + 1) { d[r2 * cols + c2] = v + 1; q.push([c2, r2]); }
    }
    return (h.map = { d, cols });
  }
  function botShot() {
    const h = S.hole, o = cupOptions(), m = pathMap(h);
    let best = null;
    for (let a = 0; a < 360; a += 2) for (let p = 0.1; p <= 1.001; p += 0.075) {
      const angle = a * Math.PI / 180, r = sim(h, S.ball, S.t, angle, p, o, 1500, false);
      let score;
      if (r.end === 'cup') score = -1000 + p;                 // in! (the gentlest one that goes in)
      else if (r.end === 'water' || r.end === 'out' || r.end === 'time') score = 1e6;
      else score = m.d[Math.floor(r.y / CELL) * m.cols + Math.floor(r.x / CELL)] * CELL + Math.hypot(r.x - h.cup[0], r.y - h.cup[1]) * 0.05;
      if (!best || score < best.score) best = { angle, power: p, score };
    }
    return best;
  }

  // ---------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------
  // flowers and bushes around the hole (the same ones every time for a hole)
  function makeDeco(h, idx) {
    const rnd = math.seeded(700 + idx * 31), list = [];
    const far = (x, y, m) => ![[0, 0], [m, 0], [-m, 0], [0, m], [0, -m], [m, m], [-m, -m], [m, -m], [-m, m]].some(([dx, dy]) => h.greens.some(p => inPoly(x + dx, y + dy, p)));
    for (let i = 0; i < 600 && list.length < 34; i++) {
      const x = -120 + rnd() * (W + 240), y = -60 + rnd() * (H + 120);
      const bush = rnd() < 0.3;
      if (!far(x, y, bush ? 52 : 34) || list.some(d => Math.hypot(d.x - x, d.y - y) < 60)) continue;
      list.push({ x, y, bush, c: ['#ff8fab', '#ffd166', '#fff', '#c77dff', '#ff8c42'][Math.floor(rnd() * 5)], s: 0.8 + rnd() * 0.5 });
    }
    return list.sort((a, b) => a.y - b.y);
  }
  function polyPath(ctx, poly) { ctx.beginPath(); poly.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); }
  function oval(ctx, o, grow = 0) { ctx.beginPath(); ctx.ellipse(o[0], o[1], o[2] + grow, o[3] + grow, 0, 0, Math.PI * 2); }

  function render(g, ctx) {
    if (!S) return;
    const h = S.hole, b = S.ball, t = S.t, o = cupOptions();
    // the park around the hole
    ctx.fillStyle = '#4aa957'; ctx.fillRect(0, 0, g.W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let x = -H; x < g.W; x += 120) { ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + H, 0); ctx.lineTo(x + H + 60, 0); ctx.lineTo(x + 60, H); ctx.fill(); }
    ctx.save();
    // zoom in so the hole fills the screen under the score (small holes look bigger: good on phones)
    const bb = S.box, k = Math.min((g.W - 50) / bb.w, (H - 96) / bb.h, 1.7);
    ctx.translate(g.W / 2 - k * bb.cx, 86 + (H - 92) / 2 - k * bb.cy); ctx.scale(k, k);
    for (const d of S.deco) drawDeco(ctx, d, t);

    // the greens: a wooden wall round the outside, then the grass
    ctx.lineJoin = 'round';
    for (const poly of h.greens) { polyPath(ctx, poly); ctx.lineWidth = 30; ctx.strokeStyle = INK; ctx.stroke(); }
    for (const poly of h.greens) { polyPath(ctx, poly); ctx.lineWidth = 21; ctx.strokeStyle = '#e0a465'; ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = '#f2c38b'; ctx.stroke(); }
    for (const poly of h.greens) {
      polyPath(ctx, poly); ctx.fillStyle = '#8fe07a'; ctx.fill();
      ctx.save(); ctx.clip();                  // mown stripes
      ctx.fillStyle = 'rgba(255,255,255,0.13)';
      for (let x = 0; x < W; x += 80) ctx.fillRect(x, 0, 40, H);
      ctx.restore();
      polyPath(ctx, poly); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    }
    // slopes: arrows that slide the way the hill pushes
    for (const s of h.slopes) {
      ctx.save(); ctx.beginPath(); ctx.rect(s[0], s[1], s[2], s[3]); ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(s[0], s[1], s[2], s[3]);
      const a = Math.atan2(s[5], s[4]), off = (t * 60) % 60;
      ctx.translate(s[0] + s[2] / 2, s[1] + s[3] / 2); ctx.rotate(a);
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      for (let x = -240 + off; x < 240; x += 60) for (let y = -120; y <= 120; y += 60) { ctx.beginPath(); ctx.moveTo(x - 10, y - 14); ctx.lineTo(x + 6, y); ctx.lineTo(x - 10, y + 14); ctx.stroke(); }
      ctx.restore();
    }
    for (const s of h.sand) {
      oval(ctx, s); ctx.fillStyle = '#f4d58d'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#c9a34e'; ctx.stroke();
      const rnd = math.seeded(s[0] + s[1]); ctx.fillStyle = '#d9b560';
      for (let i = 0; i < 26; i++) { const a = rnd() * 7, r = Math.sqrt(rnd()) * 0.85; ctx.beginPath(); ctx.arc(s[0] + Math.cos(a) * r * s[2], s[1] + Math.sin(a) * r * s[3], 2.5, 0, 7); ctx.fill(); }
    }
    for (const s of h.water) {
      oval(ctx, s); ctx.fillStyle = '#4cc9f0'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) { const x = s[0] - s[2] * 0.5 + i * s[2] * 0.33 + Math.sin(t * 1.3 + i) * 6, y = s[1] - s[3] * 0.4 + (i % 2) * s[3] * 0.6 + (i > 1 ? 14 : 0); ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.quadraticCurveTo(x - 8, y - 7, x, y); ctx.quadraticCurveTo(x + 8, y + 7, x + 16, y); ctx.stroke(); }
      drawDuck(ctx, s[0] + Math.sin(t * 0.5) * s[2] * 0.3, s[1] + Math.cos(t * 0.5) * s[3] * 0.25, Math.cos(t * 0.5) > 0 ? 1 : -1);
    }
    for (const poly of h.blocks) { polyPath(ctx, poly); ctx.fillStyle = '#e0a465'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
    // the tee: a little mat
    draw.box(ctx, h.tee[0] - 20, h.tee[1] - 14, 40, 28, 6, '#57b8ff', 3);
    // pipes
    for (const p of h.pipes) {
      draw.circle(ctx, p.a[0], p.a[1], 21, '#c77dff', 4); draw.circle(ctx, p.a[0], p.a[1], 13, '#3a2a55', 3);
      ctx.save(); ctx.translate(p.b[0], p.b[1]); ctx.rotate(Math.atan2(p.dir[1], p.dir[0]));
      draw.box(ctx, -22, -17, 34, 34, 6, '#c77dff', 4); draw.box(ctx, 6, -21, 12, 42, 5, '#e0aaff', 4);
      ctx.restore();
    }
    // the cup + (later, on top of the ball) its flag
    draw.circle(ctx, h.cup[0], h.cup[1], o.cupR + 3, '#6fbf5e', 0);
    draw.circle(ctx, h.cup[0], h.cup[1], o.cupR, '#2b2b2b', 0);
    ctx.fillStyle = '#4a4a4a'; ctx.beginPath(); ctx.ellipse(h.cup[0], h.cup[1] + o.cupR * 0.35, o.cupR * 0.7, o.cupR * 0.45, 0, 0, 7); ctx.fill();
    if (o.magnetR > 100) { ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 4; ctx.setLineDash([10, 12]); ctx.beginPath(); ctx.arc(h.cup[0], h.cup[1], o.magnetR * (0.9 + 0.1 * Math.sin(t * 4)), 0, 7); ctx.stroke(); ctx.setLineDash([]); }

    // bumpers
    h.bumpers.forEach((m, i) => {
      const q = 1 + (S.squish['b' + i] || 0) * 0.16;
      draw.circle(ctx, m[0], m[1] + 4, m[2] * q, 'rgba(0,0,0,0.2)', 0);
      draw.circle(ctx, m[0], m[1], m[2] * q, '#ef476f', 4); draw.circle(ctx, m[0], m[1], m[2] * 0.62 * q, '#fff', 3); draw.circle(ctx, m[0], m[1], m[2] * 0.28 * q, '#ffd166', 3);
    });
    // the sliding block
    if (h.slider) {
      const m = h.slider, [x, y] = sliderPos(m, t);
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(m.x - m.dx, m.y - m.dy); ctx.lineTo(m.x + m.dx, m.y + m.dy); ctx.stroke();
      draw.box(ctx, x - m.w / 2, y - m.h / 2, m.w, m.h, 7, '#ff8c42', 4);
      ctx.fillStyle = '#ffd166'; ctx.fillRect(x - m.w / 2 + 5, y - 6, m.w - 10, 12);
    }
    // the windmill's bars
    if (h.spinner) {
      const m = h.spinner;
      for (let k = 0; k < m.blades; k++) {
        const a = bladeAngle(m, t, k), x = m.x + Math.cos(a) * m.len, y = m.y + Math.sin(a) * m.len;
        ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(x, y); ctx.stroke();
        ctx.strokeStyle = k % 2 ? '#fff' : '#ef476f'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(x, y); ctx.stroke();
      }
      draw.circle(ctx, m.x, m.y, 15, '#ffd166', 4);
    }

    // the ball's trail, then the ball
    for (const p of S.trail) if (p.a > 0) { ctx.globalAlpha = p.a * 0.35; draw.circle(ctx, p.x, p.y, BR * 0.7, '#fff', 0); }
    ctx.globalAlpha = 1;
    if (S.state === 'aim' && !S.done) drawAim(g, ctx, o);
    if (S.state !== 'pipe' && S.state !== 'splash') {
      let r = BR, x = b.x, y = b.y;
      if (S.state === 'in') { const k = Math.min(1, S.stateT / 0.25); r = BR * (1 - k * 0.55); x = math.lerp(b.x, h.cup[0], k); y = math.lerp(b.y, h.cup[1], k); if (S.stateT > 0.6) r = 0; }
      if (r > 0) drawBall(ctx, x, y, r, pickedBall(g).color, t);
    }
    // the flag (it lifts out of the way when the ball is near)
    const near = Math.hypot(b.x - h.cup[0], b.y - h.cup[1]) < 90 || S.state === 'in';
    S.flagUp = math.lerp(S.flagUp || 0, near ? 1 : 0, 0.08);
    ctx.save(); ctx.translate(h.cup[0], h.cup[1] - S.flagUp * 26); ctx.globalAlpha = 1 - S.flagUp * 0.45;
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -58); ctx.stroke();
    const wv = Math.sin(t * 5) * 4;
    ctx.beginPath(); ctx.moveTo(0, -58); ctx.quadraticCurveTo(18, -56 + wv, 38, -46); ctx.quadraticCurveTo(18, -40 - wv, 0, -34); ctx.closePath();
    ctx.fillStyle = '#ef476f'; ctx.fill(); ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
    ctx.restore();

    // ---- the score, top middle: which hole, how many putts, par ----
    const cx = g.W / 2;
    draw.box(ctx, cx - 170, 12, 340, 54, 27, 'rgba(255,255,255,0.92)', 4);
    // (flag + hole number)
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - 146, 54); ctx.lineTo(cx - 146, 24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 146, 24); ctx.lineTo(cx - 124, 31); ctx.lineTo(cx - 146, 38); ctx.closePath(); ctx.fillStyle = '#ef476f'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    draw.text(ctx, String(S.idx + 1), cx - 104, 41, { size: 32, color: '#ffd166' });
    draw.circle(ctx, cx - 44, 39, 13, '#fff', 3.5);
    draw.text(ctx, String(S.strokes), cx - 6, 41, { size: 34 });
    draw.text(ctx, 'Par ' + h.par, cx + 96, 41, { size: 24, color: '#4cc9f0' });

    // the hole's number, big, when it starts
    if (S.intro > 0 && S.strokes === 0) {
      ctx.globalAlpha = Math.min(1, S.intro * 2);
      draw.text(ctx, 'Hole ' + (S.idx + 1), cx, 118, { size: 54, color: '#ffd166' });
      ctx.globalAlpha = 1;
    }
    if (S.msg) {
      const k = Math.min(1, S.msg.t * 6), fade = Math.min(1, (1.6 - S.msg.t) * 3);
      ctx.globalAlpha = Math.max(0, fade);
      draw.text(ctx, S.msg.text, cx, H / 2 - 100 - S.msg.t * 14, { size: 30 + 34 * k, color: S.msg.color });
      ctx.globalAlpha = 1;
    }
  }

  function drawBall(ctx, x, y, r, color, t) {
    draw.circle(ctx, x + 2, y + 4, r, 'rgba(0,0,0,0.22)', 0);
    if (color === 'rainbow') { const gr = ctx.createLinearGradient(x - r, y - r, x + r, y + r); ['#ef476f', '#ffd166', '#06d6a0', '#4cc9f0', '#c77dff'].forEach((c, i) => gr.addColorStop(i / 4, c)); color = gr; }
    draw.circle(ctx, x, y, r, color, 3);
    draw.circle(ctx, x - r * 0.3, y - r * 0.35, r * 0.28, 'rgba(255,255,255,0.9)', 0);
  }
  function drawDuck(ctx, x, y, dir) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
    ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.ellipse(0, 0, 17, 12, 0, 0, 7); ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(20, -6); ctx.lineTo(29, -3); ctx.lineTo(20, 0); ctx.closePath(); ctx.fillStyle = '#ff8c42'; ctx.fill(); ctx.stroke();
    draw.circle(ctx, 12, -7, 9, '#ffd166', 3); draw.circle(ctx, 14, -9, 2, INK, 0);
    ctx.restore();
  }
  function drawDeco(ctx, d, t) {
    ctx.save(); ctx.translate(d.x, d.y); ctx.scale(d.s, d.s);
    if (d.bush) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(0, 16, 30, 8, 0, 0, 7); ctx.fill();
      for (const [x, y, r] of [[-16, 4, 14], [16, 4, 14], [0, -6, 19]]) draw.circle(ctx, x, y, r, '#2f8f46', 3.5);
      draw.circle(ctx, 0, -2, 15, '#2f8f46', 0);
      draw.circle(ctx, -6, -10, 3.5, d.c, 0); draw.circle(ctx, 9, 0, 3.5, d.c, 0);
    } else {
      ctx.rotate(Math.sin(t * 1.5 + d.x) * 0.08);
      for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; draw.circle(ctx, Math.cos(a) * 7, Math.sin(a) * 7, 5.5, d.c, 2.5); }
      draw.circle(ctx, 0, 0, 4.5, '#ffd166', 2.5);
    }
    ctx.restore();
  }

  // The aiming picture: a dotted line showing the way, an arrow, and the "rubber band" you pull.
  function drawAim(g, ctx, o) {
    const b = S.ball, a = S.aim;
    let angle, power, show = false;
    if (a && a.power > 0) { angle = a.angle; power = a.power; show = true; }
    else if (S.keys) { angle = S.keyAim; power = S.charging ? S.keyPower : 0.45; show = true; }
    if (!show) {
      // a hint while nothing is happening: a soft ring pulsing round the ball
      const k = (S.t * 1.2) % 1;
      ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(b.x, b.y, BR + 4 + k * 22, 0, 7); ctx.stroke();
      if (S.strokes === 0 && S.intro <= 0) drawHand(ctx, b, S.hole);
      return;
    }
    const col = power < 0.45 ? '#06d6a0' : power < 0.8 ? '#ffd166' : '#ef476f';
    // the dotted line (longer on Easy and for little kids)
    const steps = Math.round(120 * (g.little ? 1.5 : g.pick(1.2, 0.6, 0.3)));
    const path = sim(S.hole, b, S.t, angle, power, o, steps, true).path;
    path.forEach((p, i) => { ctx.globalAlpha = 0.9 * (1 - i / (path.length + 2)); draw.circle(ctx, p[0], p[1], 4.5, '#fff', 0); });
    ctx.globalAlpha = 1;
    // the pull-back band (behind the ball) and the arrow (in front)
    const len = 34 + power * 84, cx = Math.cos(angle), sy = Math.sin(angle);
    ctx.lineCap = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - cx * power * 70, b.y - sy * power * 70); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.stroke();
    const ax = b.x + cx * len, ay = b.y + sy * len;
    ctx.strokeStyle = INK; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(b.x + cx * 16, b.y + sy * 16); ctx.lineTo(ax, ay); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = 8; ctx.stroke();
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(angle);
    ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-8, -15); ctx.lineTo(-8, 15); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
  }
  // a little hand showing "pull back" before the first putt of a hole
  function drawHand(ctx, b, h) {
    const a = Math.atan2(h.cup[1] - b.y, h.cup[0] - b.x), k = (S.t * 0.7) % 1, pull = Math.min(1, k * 1.6) * 70;
    const x = b.x - Math.cos(a) * (26 + pull), y = b.y - Math.sin(a) * (26 + pull);
    ctx.globalAlpha = k > 0.85 ? (1 - k) / 0.15 : 0.9;
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 5; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(x, y); ctx.stroke(); ctx.setLineDash([]);
    draw.circle(ctx, x, y, 13, '#ffd6a5', 3.5); draw.circle(ctx, x, y, 5, '#fff', 0);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------
  // Menus
  // ---------------------------------------------------------------
  // a tiny picture of a hole for its button
  function holePic(h) {
    const pts = (p) => p.map(q => q.join(',')).join(' ');
    let s = `<rect width="960" height="540" rx="50" fill="#4aa957"/>`;
    for (const p of h.greens) s += `<polygon points="${pts(p)}" fill="#8fe07a" stroke="#2b2b2b" stroke-width="40" stroke-linejoin="round"/>`;
    for (const p of h.greens) s += `<polygon points="${pts(p)}" fill="#8fe07a" stroke="#e0a465" stroke-width="22" stroke-linejoin="round"/>`;
    for (const o of h.sand) s += `<ellipse cx="${o[0]}" cy="${o[1]}" rx="${o[2]}" ry="${o[3]}" fill="#f4d58d" stroke="#c9a34e" stroke-width="8"/>`;
    for (const o of h.water) s += `<ellipse cx="${o[0]}" cy="${o[1]}" rx="${o[2]}" ry="${o[3]}" fill="#4cc9f0" stroke="#2b2b2b" stroke-width="10"/>`;
    for (const o of h.slopes) s += `<rect x="${o[0]}" y="${o[1]}" width="${o[2]}" height="${o[3]}" fill="#fff" opacity="0.35"/><path d="M${o[0] + o[2] / 2 - 40} ${o[1] + o[3] / 2 - 30} l40 50 l40 -50" fill="none" stroke="#fff" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>`;
    for (const o of h.bumpers) s += `<circle cx="${o[0]}" cy="${o[1]}" r="${o[2]}" fill="#ef476f" stroke="#2b2b2b" stroke-width="10"/><circle cx="${o[0]}" cy="${o[1]}" r="${o[2] * 0.5}" fill="#fff"/>`;
    for (const o of h.pipes) s += `<circle cx="${o.a[0]}" cy="${o.a[1]}" r="30" fill="#c77dff" stroke="#2b2b2b" stroke-width="10"/><circle cx="${o.b[0]}" cy="${o.b[1]}" r="30" fill="#c77dff" stroke="#2b2b2b" stroke-width="10"/>`;
    if (h.spinner) s += `<path d="M${h.spinner.x - 50} ${h.spinner.y - 50} l100 100 M${h.spinner.x + 50} ${h.spinner.y - 50} l-100 100" stroke="#2b2b2b" stroke-width="34" stroke-linecap="round"/><path d="M${h.spinner.x - 50} ${h.spinner.y - 50} l100 100 M${h.spinner.x + 50} ${h.spinner.y - 50} l-100 100" stroke="#ef476f" stroke-width="18" stroke-linecap="round"/>`;
    if (h.slider) s += `<rect x="${h.slider.x - 22}" y="${h.slider.y - 40}" width="44" height="80" rx="10" fill="#ff8c42" stroke="#2b2b2b" stroke-width="10"/>`;
    s += `<circle cx="${h.tee[0]}" cy="${h.tee[1]}" r="24" fill="#fff" stroke="#2b2b2b" stroke-width="10"/>`;
    s += `<circle cx="${h.cup[0]}" cy="${h.cup[1]}" r="26" fill="#2b2b2b"/><path d="M${h.cup[0]} ${h.cup[1]} v-120" stroke="#2b2b2b" stroke-width="12" stroke-linecap="round"/><path d="M${h.cup[0]} ${h.cup[1] - 120} l76 26 l-76 26 Z" fill="#ef476f" stroke="#2b2b2b" stroke-width="9" stroke-linejoin="round"/>`;
    return `<svg viewBox="0 0 960 540">${s}</svg>`;
  }
  const COURSE_PIC = `<svg viewBox="0 0 96 54"><rect width="96" height="54" rx="8" fill="#4aa957"/><path d="M20 46 V10" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/><path d="M20 10 L46 18 L20 26 Z" fill="#ef476f" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M62 8 H84 V22 A11 11 0 0 1 62 22 Z" fill="#ffc93c" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/><rect x="69" y="32" width="8" height="8" fill="#ffc93c" stroke="#2b2b2b" stroke-width="3"/><rect x="63" y="40" width="20" height="7" rx="2" fill="#8d5524" stroke="#2b2b2b" stroke-width="3"/></svg>`;
  function levels(g) {
    const best = g.save.data.best || {};
    const list = HOLES.map((h, i) => {
      const prev = i === 0 || (g.save.levels[HOLES[i - 1].id] || {}).done;
      return { id: h.id, name: (i + 1) + '. ' + h.name, pic: holePic(h), locked: !prev, meta: best[h.id] ? ballChip(best[h.id]) + ' &middot; Par ' + h.par : 'Par ' + h.par };
    });
    const all = HOLES.every(h => (g.save.levels[h.id] || {}).done);
    list.push({ ...COURSE, pic: COURSE_PIC, locked: !all, meta: best.course ? ballChip(best.course) : 'Par ' + HOLES.reduce((a, h) => a + h.par, 0) });
    return list;
  }
  // pick your ball's color (more colors as you win stars)
  function extraMenu(g) {
    const wrap = Arcade.h('div');
    wrap.appendChild(Arcade.h('h2', { class: 'ar-title', style: 'font-size:24px;margin-top:16px' }, 'Pick your ball'));
    const row = Arcade.h('div', { class: 'ar-grid' });
    const stars = totalStars(g), current = pickedBall(g).id;
    for (const b of BALLS) {
      const ok = stars >= b.stars;
      const fill = b.color === 'rainbow' ? 'url(#golfRb)' : b.color;
      const pic = `<svg viewBox="0 0 80 80"><defs><linearGradient id="golfRb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ef476f"/><stop offset=".25" stop-color="#ffd166"/><stop offset=".5" stop-color="#06d6a0"/><stop offset=".75" stop-color="#4cc9f0"/><stop offset="1" stop-color="#c77dff"/></linearGradient></defs>` +
        `<circle cx="40" cy="40" r="26" fill="${fill}" stroke="#2b2b2b" stroke-width="5"/><circle cx="31" cy="30" r="7" fill="#fff" opacity="0.9"/></svg>`;
      const tile = Arcade.h('button', { type: 'button', class: 'ar-tile' + (ok ? '' : ' locked') + (b.id === current ? ' picked' : ''), 'aria-label': b.id + ' ball' },
        `<div class="pic">${pic}</div><div class="meta">${ok ? '' : icons.star(true).replace('<svg', '<svg style="width:22px;height:22px;vertical-align:-4px"') + ' ' + b.stars}</div>` + (ok ? '' : `<div class="lock">${icons.lock}</div>`));
      tile.addEventListener('click', () => {
        if (!ok) { Arcade.sfx('bonk'); return; }
        Arcade.sfx('click');
        g.save.data.ball = b.id; g.store();
        row.querySelectorAll('.ar-tile').forEach(t => t.classList.remove('picked'));
        tile.classList.add('picked');
      });
      row.appendChild(tile);
    }
    wrap.appendChild(row);
    return wrap;
  }

  const Sv = (inner) => `<svg viewBox="0 0 80 80">${inner}</svg>`;
  const LINK = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
  Arcade.start({
    id: 'golf',
    title: 'Putt-Putt Park',
    trophies: [
      { id: 'first', name: 'In the hole!', how: 'Finish a hole' },
      { id: 'ace', name: 'Hole in one', how: 'Get the ball in with one putt' },
      { id: 'birdie', name: 'Under par', how: 'Finish a hole in fewer putts than par' },
      { id: 'bank', name: 'Bank shot', how: 'Score after bouncing off two walls' },
      { id: 'pipe', name: 'Down the pipe', how: 'Send the ball through a pipe' },
      { id: 'windmill', name: 'Past the windmill', how: 'Finish the Windmill hole' },
      { id: 'all', name: 'All nine', how: 'Finish every hole' },
      { id: 'course', name: 'Round of golf', how: 'Play all 9 holes in a row' },
      { id: 'stars', name: 'Putting star', how: '3 stars on every hole' },
      { id: 'boing', name: 'Boing boing boing', how: 'Hit 3 bumpers with one putt', secret: true },
      { id: 'splash', name: 'Splash!', how: 'Putt into the pond', secret: true },
      { id: 'beach', name: 'Beach day', how: 'Stop in the sand', secret: true },
      { id: 'trick', name: 'Trick shot', how: 'Hole in one on the last hole', secret: true },
    ],
    logo: Arcade.logo({
      badge: Arcade.badges.golf,
      title: 'Putt-Putt', title2: 'Park', colors: ['#ffffff', '#ffd166'], bg: '#8fe07a',
      art: `<ellipse cx="170" cy="120" rx="60" ry="22" fill="#6fbf5e" ${LINK}/><ellipse cx="170" cy="120" rx="16" ry="7" fill="#2b2b2b"/>
            <path d="M170 120 V40" ${LINK}/><path d="M170 40 L210 52 L170 66 Z" fill="#ef476f" ${LINK}/>
            <g class="wobble"><circle cx="70" cy="104" r="20" fill="#fff" ${LINK}/><circle cx="63" cy="97" r="5" fill="#dfe7ee"/></g>` }),
    view: { w: W, h: H, flex: true, maxW: 1200 },
    background: '#2f8f46',
    music: { tempo: 104, root: 60, scale: 'major', prog: [[1, 4, 5, 1], [6, 4, 1, 5], [4, 5, 3, 6]], drums: 'boombap', bass: 'bounce', lead: 'whistle', harmony: 'uke', swing: 0.14, pad: false, arp: true, arpSound: 'uke', seed: 1701,
      tune: { A: '5/4 3/2 5/2 8/4 5/4 | 6/4 4/2 6/2 8/4 6/4 | 7/4 5/2 7/2 9/4 7/4 | 8/4 5/4 3/8',
              B: '6/2 8/2 10/4 8/4 6/4 | 4/2 6/2 8/4 6/4 4/4 | 3/2 5/2 8/4 5/4 3/4 | 5/4 7/4 9/8',
              C: '4/8 6/8 | 5/8 7/8 | 5/4 3/4 5/8 | 6/4 8/4 10/8' } },
    menuMusic: { tempo: 92, root: 60, scale: 'major', prog: [[1, 5, 6, 4], [4, 5, 1, 1], [2, 5, 1, 6]], drums: 'soft', bass: 'bounce', lead: 'flute', harmony: 'uke', pad: true, arp: true, arpSound: 'marimba', seed: 1702,
      tune: { A: '3/4 5/4 8/8 | 7/4 5/4 2/8 | 6/4 8/4 10/8 | 8/4 6/4 4/8',
              B: '4/4 6/4 8/8 | 5/4 7/4 9/8 | 8/4 5/4 3/8 | 3/4 5/4 8/8',
              C: '2/8 4/8 | 5/8 7/8 | 3/8 5/8 | 6/8 8/8' } },
    levelsTitle: 'Pick a hole',
    // the cup gets a little smaller as you go: holes 1-3 Easy, 4-6 Normal, 7-9 Challenge (the whole course: Normal)
    levelDifficulty: (lv) => { const i = HOLES.findIndex(h => h.id === lv.id); return i < 0 ? 'normal' : i < 3 ? 'easy' : i < 6 ? 'normal' : 'challenge'; },
    howTo: [
      { pic: Sv(`<circle cx="52" cy="28" r="12" fill="#fff" ${LINK}/><path d="M44 38 L24 62" stroke="#2b2b2b" stroke-width="4" stroke-dasharray="5 6" stroke-linecap="round"/><circle cx="22" cy="64" r="10" fill="#ffd6a5" ${LINK}/>`), text: 'Pull back, let go!', keys: 'Drag &middot; or arrows + hold Space' },
      { pic: Sv(`<ellipse cx="40" cy="62" rx="20" ry="8" fill="#2b2b2b"/><path d="M40 62 V16" ${LINK}/><path d="M40 16 L64 24 L40 34 Z" fill="#ef476f" ${LINK}/>`), text: 'Get it in the cup' },
      { pic: Sv(`<circle cx="40" cy="40" r="26" fill="#ef476f" ${LINK}/><circle cx="40" cy="40" r="15" fill="#fff" ${LINK}/><circle cx="40" cy="40" r="6" fill="#ffd166" ${LINK}/>`), text: 'Bumpers go boing!' },
      { pic: Sv(`<ellipse cx="40" cy="44" rx="32" ry="22" fill="#4cc9f0" ${LINK}/><path d="M22 40 q6 -6 12 0 q6 6 12 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="52" cy="50" r="7" fill="#fff" ${LINK}/>`), text: 'Splash? Just try again' },
    ],
    levels,
    extraMenu,
    setup,
    update,
    draw: render,
  });
})();
