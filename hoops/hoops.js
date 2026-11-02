// =====================================================================
// Hoop Heroes — an arcade pop-a-shot basketball machine.
//
// How it works (the fun part):
//  * You look straight at the machine. Balls roll down the ramp to you;
//    PULL BACK on the screen and LET GO to shoot (or hold Space and let go,
//    with Left/Right to aim). Shoot as fast as you can before the buzzer!
//  * The ball really flies in 3D: x = left/right, h = height, z = how far
//    away. Gravity pulls h down. We then "project" it onto the screen:
//    things further away are drawn smaller and closer to the middle.
//  * A basket counts when the ball comes DOWN through the rim's circle.
//    Hitting the edge of the rim bounces it (it can rattle in!).
//  * 3 in a row and the net catches FIRE (it's a little bigger while it
//    burns). A miss puts the fire out.
//  * The last 10 seconds are the 3-POINT BONUS: the hoop slides back and
//    every basket is worth 3.
//  * Every round is against a rival on the machine next to you. Beat their
//    score to win and move up the tournament ladder!
// =====================================================================
(function () {
  const { draw, icons, math } = Arcade;
  const D = draw;
  const INK = D.INK;
  let W = 960;                // the width can grow on wide screens (view.flex), so it's read from g.W
  const H = 540;

  // ---- the 3D view ----
  const F = 700;              // camera "zoom"
  const CAM_D = 1.6;          // camera distance behind the shooter (m)
  const CAM_H = 1.5;          // camera height (m)
  const HORIZON = 380;        // screen y of eye level
  const RIM_H = 2.3;          // rim height (m)
  const HOOP_Z = 3.0;         // normal hoop distance (m)
  const BONUS_Z = 4.1;        // bonus round: the hoop slides back
  const BALL_R = 0.12;        // ball radius (m)
  const GRAV = 9.8;
  const START = { x: 0, h: 1.27, z: 0.2 };   // where a ball leaves your hands
  let OX = 0;                 // sideways shift, used to draw the machines next to yours
  const proj = (x, h, z) => { const s = F / (z + CAM_D); return { x: W / 2 + (x + OX) * s, y: HORIZON - (h - CAM_H) * s, s }; };

  // ---------------------------------------------------------------
  // The tournament ladder. Beat each rival to unlock the next one.
  //   time   = seconds on the clock (the last 10 are the 3-point bonus)
  //   rival  = their name, how many shots a second, how many go in (0..1)
  //   move   = the hoop slides: x = how far left/right (m), speed
  //   stars  = your points for 2 and 3 stars (1 star = beat the rival)
  // ---------------------------------------------------------------
  const LEVELS = [
    { id: 'r1', name: 'Ruby Rookie',   time: 30, rival: { name: 'Ruby',  color: '#ef476f', rate: 0.9, acc: 0.42 }, stars: [26, 36] },
    { id: 'r2', name: 'Dash the Dog',  time: 30, rival: { name: 'Dash',  color: '#ff8c42', rate: 1.0, acc: 0.5 }, stars: [30, 42] },
    { id: 'r3', name: 'Slidey Sid',    time: 40, rival: { name: 'Sid',   color: '#06d6a0', rate: 1.0, acc: 0.5 }, stars: [38, 52], move: { x: 0.35, speed: 0.6 } },
    { id: 'r4', name: 'Speedy Sam',    time: 40, rival: { name: 'Sam',   color: '#118ab2', rate: 1.3, acc: 0.52 }, stars: [46, 60] },
    { id: 'r5', name: 'Bounce Bella',  time: 45, rival: { name: 'Bella', color: '#9b5de5', rate: 1.25, acc: 0.56 }, stars: [52, 68], move: { x: 0.45, speed: 0.8 } },
    { id: 'r6', name: 'Tall Tia',      time: 45, rival: { name: 'Tia',   color: '#f15bb5', rate: 1.4, acc: 0.6 }, stars: [60, 76] },
    { id: 'r7', name: 'Wiggle Wes',    time: 50, rival: { name: 'Wes',   color: '#ffd166', rate: 1.4, acc: 0.6 }, stars: [64, 82], move: { x: 0.55, speed: 1.1 } },
    { id: 'r8', name: 'The Champ',     time: 60, rival: { name: 'Champ', color: '#2b2b2b', rate: 1.5, acc: 0.66 }, stars: [80, 100], move: { x: 0.4, speed: 0.9 } },
    { id: 'free', name: 'High Score',  time: 45, rival: null, stars: [40, 70, 100], free: true, noStart: true },
  ];

  // Ball designs you can unlock and pick in the menu.
  const BALLS = [
    { id: 'classic', name: 'Classic',    need: null },
    { id: 'beach',   name: 'Beach Ball', need: 'Beat 2 rivals',        ok: g => beaten(g) >= 2 },
    { id: 'melon',   name: 'Melon',      need: 'Beat 4 rivals',        ok: g => beaten(g) >= 4 },
    { id: 'star',    name: 'Star Ball',  need: '60 in High Score',     ok: g => ((g.save.levels.free || {}).score || 0) >= 60 },
    { id: 'rainbow', name: 'Rainbow',    need: 'Beat the Champ',       ok: g => !!(g.save.levels.r8 || {}).done },
    { id: 'gold',    name: 'Golden',     need: '3 stars on every rival', ok: g => LEVELS.filter(l => l.rival).every(l => ((g.save.levels[l.id] || {}).stars || 0) >= 3) },
  ];
  function beaten(g) { return LEVELS.filter(l => l.rival && (g.save.levels[l.id] || {}).done).length; }
  function ballUnlocked(g, b) { return !b.ok || g.isUnlocked('ball-' + b.id); }
  function pickedBall(g) { const b = BALLS.find(x => x.id === g.save.data.ball); return b && ballUnlocked(g, b) ? b.id : 'classic'; }
  function checkUnlocks(g) { for (const b of BALLS) if (b.ok && b.ok(g)) g.unlock('ball-' + b.id, b.name + ' ball!'); }

  // ---------------------------------------------------------------
  // Game state
  // ---------------------------------------------------------------
  let L, balls, score, rival, timeLeft, started, over, endWait, streak, onFire, made, shots, swishes,
    bestStreak, bonusMade, hoop, rimR, assist, popups, fx, aim, charge, drag, nextBall, ready, design,
    bigText, clock, net, buzzerBeater, crowd, neighbors;

  function setup(g, level) {
    L = level || LEVELS[0];
    rimR = g.pick(0.3, 0.24, 0.215);                 // Easy has a bigger hoop
    assist = g.pick(0.55, 0.25, 0.08);               // how much we gently help your aim
    balls = []; popups = []; fx = new Arcade.Particles();
    score = 0; streak = 0; onFire = false; made = 0; shots = 0; swishes = 0; bestStreak = 0; bonusMade = 0;
    timeLeft = L.time; started = false; over = false; endWait = 0; clock = 0; buzzerBeater = false;
    hoop = { x: 0, z: HOOP_Z };
    rival = L.rival ? { ...L.rival, score: 0, t: 0.8, mult: g.pick(0.7, 1, 1.2), seed: 7 } : null;
    aim = 0; charge = null; drag = null; nextBall = 0; ready = true; bigText = null; crowd = 0;
    net = { swish: 0, fire: 0 };
    // the two machines next to yours: a kid on the left, your rival on the right
    neighbors = [{ ox: -2.5, balls: [], net: { swish: 0 }, t: 1 }, { ox: 2.5, balls: [], net: { swish: 0 }, t: 0, rival: true }];
    design = pickedBall(g);
    gref = g; L._done = false;
    L._best = (g.save.levels[L.id] || {}).score || 0;

    // ---- test hooks ----
    window.__hoopsState = () => ({
      level: L.id, score, rival: rival ? rival.score : null, timeLeft, over, streak, onFire, made, shots, swishes,
      bonus: inBonus(), hoop: { ...hoop }, flying: balls.filter(b => b.state === 'fly').length, ready,
    });
    window.__hoopsShoot = (power, aimX) => shoot(g, power, aimX);   // test-only
    window.__hoopsPerfect = () => perfectPower();                  // test-only
  }

  const inBonus = () => started && !over && timeLeft <= 10 && L.time > 10;
  function rimPos() { return { x: hoop.x, h: RIM_H, z: hoop.z }; }

  // The launch speed that drops the ball right into the middle of the hoop
  // (worked out by trying lots of speeds: simple and good enough).
  function perfectPower() {
    let best = 0.5, bestErr = 1e9;
    for (let p = 0; p <= 1.2; p += 0.005) {
      const v = launch(p, 0);
      // when does the ball come back down to rim height?
      const a = -GRAV / 2, b = v.vh, c = START.h - RIM_H;
      const disc = b * b - 4 * a * c; if (disc < 0) continue;
      const t = (-b - Math.sqrt(disc)) / (2 * a);
      const z = START.z + v.vz * t;
      const err = Math.abs(z - hoop.z);
      if (err < bestErr) { bestErr = err; best = p; }
    }
    return best;
  }
  function launch(power, aimX) {
    const v = 5.0 + power * 3.6, ang = 1.0;          // speed (m/s) and a nice high arc (~57°)
    return { vx: aimX, vh: v * Math.sin(ang), vz: v * Math.cos(ang) };
  }

  // Shoot! power 0..1.2, aimX = sideways speed (m/s)
  function shoot(g, power, aimX) {
    if (!ready || over) return;
    if (!started) started = true;
    // a gentle helping hand (more on Easy)
    const pp = perfectPower();
    power = power + (pp - power) * assist;
    const wantX = (hoop.x - START.x) / 0.95;          // aim needed to reach the hoop's x
    aimX = aimX + (wantX - aimX) * assist;
    const v = launch(power, aimX);
    balls.push({ x: START.x, h: START.h, z: START.z, ...v, state: 'fly', rim: false, spin: 0, trail: [], fire: onFire, scored: false, bonus: inBonus() });
    shots++; ready = false; nextBall = 0.45;
    g.sfx('whoosh');
  }

  function update(g, dt) {
    W = g.W;
    const inp = g.input;
    clock += dt;
    fx.update(dt);
    for (const q of popups) { q.t += dt; q.y -= 40 * dt; }
    popups = popups.filter(q => q.t < 1.1).slice(-2);
    if (bigText) { bigText.t -= dt; if (bigText.t <= 0) bigText = null; }
    net.swish = Math.max(0, net.swish - dt * 3);
    crowd = Math.max(0, crowd - dt);

    // the clock starts with your first shot
    if (started && !over) {
      const before = timeLeft;
      timeLeft = Math.max(0, timeLeft - dt);
      if (before > 10 && timeLeft <= 10 && L.time > 10) { bigText = { text: '3-POINT BONUS!', t: 2, color: '#ffd166' }; g.sfx('unlock'); }
      if (Math.ceil(before) !== Math.ceil(timeLeft) && timeLeft <= 5 && timeLeft > 0) g.tone(880, 0.08, { type: 'square', vol: 0.15 });
      if (timeLeft <= 0) { over = true; endWait = 1.6; g.tone(160, 0.9, { type: 'sawtooth', vol: 0.25 }); bigText = { text: 'BUZZER!', t: 1.4, color: '#ef476f' }; }
    }
    // the hoop: slides back for the bonus round, and wiggles on some levels
    const wantZ = inBonus() || (over && timeLeft <= 0 && L.time > 10 && hoop.z > HOOP_Z + 0.5) ? BONUS_Z : HOOP_Z;
    hoop.z += (wantZ - hoop.z) * Math.min(1, dt * 3);
    hoop.x = L.move ? Math.sin(clock * L.move.speed) * L.move.x : 0;

    // the rival shoots too
    if (rival && started && !over) {
      rival.t -= dt;
      if (rival.t <= 0) {
        rival.t = 1 / (rival.rate * rival.mult) * (0.8 + Math.random() * 0.4);
        const made = Math.random() < rival.acc * Math.min(1.1, rival.mult);
        if (made) rival.score += inBonus() ? 3 : 2;
        neighborShot(neighbors[1], made);   // you can see their shot fly next door
      }
    }

    // the kid on the left just keeps shooting for fun
    const left = neighbors[0];
    left.t -= dt;
    if (left.t <= 0) { left.t = 0.9 + Math.random() * 0.8; neighborShot(left, Math.random() < 0.55); }
    for (const nb of neighbors) updateNeighbor(nb, dt);

    // a new ball rolls down to you
    if (!ready && !over) { nextBall -= dt; if (nextBall <= 0) ready = true; }

    // ---- controls ----
    // touch / mouse: pull back (drag down) and let go
    const pt = inp.pointer;
    if (pt.justDown && pt.y > H * 0.25) drag = { x: pt.x, y: pt.y };
    if (drag && !pt.down) {
      const dx = pt.x - drag.x, dy = pt.y - drag.y;
      if (dy > 25) shoot(g, math.clamp(dy / 170, 0, 1.2), math.clamp(-dx / 160, -1.4, 1.4));
      drag = null;
    }
    // keyboard: Left/Right aims, hold Space to wind up, let go to shoot
    if (inp.down('ArrowLeft', 'KeyA')) aim = Math.max(-1.2, aim - dt * 1.6);
    if (inp.down('ArrowRight', 'KeyD')) aim = Math.min(1.2, aim + dt * 1.6);
    if (inp.down('Space', 'ArrowUp')) {
      if (charge == null && ready) charge = 0;
      if (charge != null) charge += dt;
    } else if (charge != null) {
      const k = (charge % 1.6) / 0.8, p = k < 1 ? k : 2 - k;   // the power bar goes up and down
      shoot(g, p * 1.15, aim); charge = null;
    }

    // ---- the balls ----
    for (const b of balls) moveBall(g, b, dt);
    balls = balls.filter(b => b.state !== 'gone');

    if (over) { endWait -= dt; if (endWait <= 0 && !balls.some(b => b.state === 'fly')) finishRound(g); }
  }

  // ---- the machines next door (just for show: simple flights, no rim bounces) ----
  function neighborShot(nb, made) {
    const p = perfectPower() + (made ? 0 : (Math.random() < 0.5 ? -0.16 : 0.2));
    const v = launch(p, made ? 0 : (Math.random() - 0.5) * 0.4);
    nb.balls.push({ x: START.x, h: START.h, z: START.z, ...v, state: 'fly', made, spin: 0, trail: [] });
  }
  function updateNeighbor(nb, dt) {
    nb.net.swish = Math.max(0, nb.net.swish - dt * 3);
    for (const b of nb.balls) {
      b.spin += dt * 8;
      if (b.state === 'drop') { b.h -= dt * 2.5; if (b.h < RIM_H - 0.7) b.state = 'gone'; continue; }
      const prevH = b.h;
      b.vh -= GRAV * dt; b.x += b.vx * dt; b.h += b.vh * dt; b.z += b.vz * dt;
      if (b.made && prevH > RIM_H && b.h <= RIM_H && b.vh < 0) { b.state = 'drop'; b.x = 0; b.z = hoop.z; nb.net.swish = 1; }
      if (b.h < rampH(b.z) + BALL_R || b.z > hoop.z + 1) b.state = 'gone';
    }
    nb.balls = nb.balls.filter(b => b.state !== 'gone');
  }

  function moveBall(g, b, dt) {
    b.spin += dt * 8;
    if (b.state === 'roll') {                         // missed: rolling back down the ramp to you
      b.z -= dt * 2.2; b.h = rampH(b.z) + BALL_R; b.x *= 1 - dt;
      if (b.z < 0.6) b.state = 'gone';
      return;
    }
    if (b.state === 'drop') {                         // went in: falls through the net
      b.h -= dt * 2.5; b.z -= dt * 0.3;
      if (b.h < RIM_H - 0.7) b.state = 'roll';
      return;
    }
    // flying: a few small steps so nothing is skipped
    const N = 4, h = dt / N;
    for (let k = 0; k < N && b.state === 'fly'; k++) {
      const prevH = b.h;
      b.vh -= GRAV * h;
      b.x += b.vx * h; b.h += b.vh * h; b.z += b.vz * h;
      const r = rimPos();
      // the backboard (a wall just behind the rim)
      const bz = r.z + rimR + 0.12;
      if (b.z + BALL_R > bz && b.h > RIM_H - 0.15 && b.h < RIM_H + 0.95 && Math.abs(b.x - r.x) < 0.75) {
        b.z = bz - BALL_R; b.vz = -Math.abs(b.vz) * 0.45; b.vx *= 0.8; b.rim = true;
        g.tone(140, 0.08, { type: 'square', vol: 0.15 });
      }
      // coming down through rim height?
      if (prevH > RIM_H && b.h <= RIM_H && b.vh < 0) {
        const d = Math.hypot(b.x - r.x, b.z - r.z);
        const big = rimR * (b.fire ? 1.15 : 1);
        if (d < big - BALL_R * 0.4) { scoreBall(g, b, d < big - BALL_R * 1.4 && !b.rim); return; }
        if (d < big + BALL_R) {                       // clang! off the rim
          const nx = (b.x - r.x) / (d || 1), nz = (b.z - r.z) / (d || 1);
          const out = d > big ? 1 : -1;               // outside the rim: bounce out; inside: bounce in
          b.vx = nx * out * 0.9 + b.vx * 0.3; b.vz = nz * out * 0.9 + b.vz * 0.3; b.vh = Math.abs(b.vh) * 0.4 + 0.6;
          b.h = RIM_H + 0.01; b.rim = true;
          g.tone(520 + Math.random() * 120, 0.09, { type: 'triangle', vol: 0.25 });
        }
      }
      // too low, or way off to the side: a miss
      if (b.h < rampH(b.z) + BALL_R || Math.abs(b.x) > 1.4 || b.z > hoop.z + 1.2) { missBall(g, b); return; }
    }
    b.trail.push(proj(b.x, b.h, b.z)); if (b.trail.length > 10) b.trail.shift();
  }
  // the ramp: low near you, higher by the hoop
  const rampH = (z) => 0.5 + Math.max(0, z - 0.6) * 0.12;

  function scoreBall(g, b, swish) {
    b.state = 'drop'; b.scored = true;
    const pts = b.bonus || inBonus() ? 3 : 2;
    score += pts; made++; streak++; bestStreak = Math.max(bestStreak, streak);
    if (pts === 3) { bonusMade++; g.achieve('downtown'); }
    if (timeLeft <= 0) { buzzerBeater = true; g.achieve('buzzer'); bigText = { text: 'BUZZER BEATER!', t: 1.6, color: '#06d6a0' }; }
    if (swish) { swishes++; g.achieve('swish'); }
    net.swish = 1; crowd = 0.6;
    g.sfx(swish ? 'swish' : 'coin');
    const r = proj(hoop.x, RIM_H, hoop.z);
    popups.push({ text: '+' + pts + (swish ? ' Swish!' : ''), x: r.x, y: r.y - 60, t: 0, color: swish ? '#9bf6ff' : '#ffd166' });
    if (!onFire && streak >= 3) {                     // three in a row: the net is ON FIRE
      onFire = true; g.achieve('fire');
      bigText = { text: "YOU'RE ON FIRE!", t: 1.8, color: '#ff8c42' };
      Arcade.audio.noise(0.8, { filter: 'bandpass', freq: 700, vol: 0.35 });
      g.tone(220, 0.6, { type: 'sawtooth', slide: 660, vol: 0.12 });
    }
    if (streak >= 10) g.achieve('streak10');
    fx.burst(r.x, r.y + 20, { count: onFire ? 26 : 12, colors: onFire ? ['#ff8c42', '#ffd166', '#ef476f'] : ['#ffffff', '#ffd166'], speed: 200, size: 10, gravity: 300, life: 0.6 });
  }
  function missBall(g, b) {
    b.state = 'roll'; b.z = Math.min(b.z, hoop.z); b.h = rampH(b.z) + BALL_R;
    if (onFire) { popups.push({ text: 'Fire out!', x: W / 2, y: 220, t: 0, color: '#8ecae6' }); g.sfx('aww'); }
    streak = 0; onFire = false;
    g.tone(120, 0.12, { type: 'triangle', vol: 0.2 });
  }

  function finishRound(g) {
    if (L._done) return;
    L._done = true;
    over = true;
    const win = L.free ? score >= L.stars[0] : score > rival.score;
    const stars = L.free ? (score >= L.stars[2] ? 3 : score >= L.stars[1] ? 2 : score >= L.stars[0] ? 1 : 0)
      : !win ? 0 : score >= L.stars[1] ? 3 : score >= L.stars[0] ? 2 : 1;
    // trophies
    if (!L.free && win) g.achieve('win');
    if (L.id === 'r8' && win) g.achieve('champ');
    if (L.free && score >= 60) g.achieve('high60');
    if (shots >= 8 && made === shots) g.achieve('perfect');
    if (stars >= 3) g.achieve('three-stars');
    const lines = [
      L.free ? '' : rival.name + ': ' + rival.score + '   You: ' + score,
      'Baskets: ' + made + ' / ' + shots + (swishes ? '   Swishes: ' + swishes : ''),
      bestStreak >= 3 ? 'Best streak: ' + bestStreak + ' in a row' : '',
      bonusMade ? '3-pointers: ' + bonusMade : '',
    ].filter(Boolean);
    const tie = !L.free && score === rival.score;
    g.finish({
      win, score, stars,
      title: L.free ? (stars ? 'Great shooting!' : 'Nice try!') : win ? (L.id === 'r8' ? 'CHAMPION!' : 'You beat ' + rival.name + '!') : tie ? 'A tie! So close!' : 'Nice try!',
      lines, next: win && !L.free, delay: 600,
    });
    setTimeout(() => checkUnlocks(g), 900);
  }

  // ---------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------
  function render(g, ctx) {
    W = g.W;
    if (!L) { ctx.fillStyle = '#2a1e5c'; ctx.fillRect(0, 0, W, H); return; }
    const t = clock;
    drawHall(ctx, t);
    for (const nb of neighbors) drawNeighbor(ctx, t, nb);
    drawMachine(ctx, t);
    // balls behind the rim first, then the rim front, then balls in front
    const r = proj(hoop.x, RIM_H, hoop.z);
    const far = balls.filter(b => b.z > hoop.z - 0.05 && b.state !== 'roll').sort((a, b) => b.z - a.z);
    const near = balls.filter(b => !(b.z > hoop.z - 0.05 && b.state !== 'roll')).sort((a, b) => b.z - a.z);
    drawRim(ctx, r, t, 'back');
    for (const b of far) drawFlyingBall(ctx, b, t);
    drawRim(ctx, r, t, 'front');
    for (const b of near) drawFlyingBall(ctx, b, t);
    // the ball waiting in your hands + the aim guide
    drawCabinet(ctx);
    drawHandBall(ctx, t);
    fx.draw(ctx);
    for (const q of popups) D.text(ctx, q.text, q.x, q.y, { size: 30, color: q.color });
    drawScoreboard(ctx, t);
    if (bigText) {
      const k = Math.min(1, (bigText.t) * 2);
      D.text(ctx, bigText.text, W / 2, 250, { size: 54 * (0.8 + 0.2 * k), color: bigText.color });
    }
    if (!started && !over) D.text(ctx, 'Pull back and let go!', W / 2, 300, { size: 34, color: '#ffffff' });
  }

  // ---- little helpers for glowing neon ----
  function glow(ctx, color, blur) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
  function noGlow(ctx) { ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; }
  // a thick metal tube: a dark stroke with a thin shiny line on top
  function tube(ctx, pts, w = 11) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.strokeStyle = '#0d0a1f'; ctx.lineWidth = w; ctx.stroke();
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x - 1.5, p.y - 1.5) : ctx.moveTo(p.x - 1.5, p.y - 1.5));
    ctx.strokeStyle = '#6b7099'; ctx.lineWidth = w * 0.28; ctx.stroke();
  }
  function flame(ctx, x, y, s, c1, c2) {
    ctx.beginPath(); ctx.moveTo(x, y + s);
    ctx.bezierCurveTo(x - s * 0.9, y + s, x - s * 0.8, y - s * 0.1, x - s * 0.1, y - s);
    ctx.quadraticCurveTo(x + s * 0.1, y - s * 0.3, x + s * 0.4, y - s * 0.4);
    ctx.bezierCurveTo(x + s * 0.9, y, x + s * 0.8, y + s, x, y + s); ctx.closePath();
    ctx.fillStyle = c1; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y + s * 0.45, s * 0.35, s * 0.45, 0, 0, 7); ctx.fillStyle = c2; ctx.fill();
  }

  // Draw a machine next door: we borrow the same drawing code, shifted sideways
  // (OX), with that machine's own net and balls. Then dim it so yours stands out.
  function drawNeighbor(ctx, t, nb) {
    const keep = { hoop, onFire, net, design };
    OX = nb.ox; hoop = { x: 0, z: hoop.z }; onFire = false; net = nb.net; design = 'classic';
    drawMachine(ctx, t);
    const r = proj(0, RIM_H, hoop.z);
    const far = nb.balls.filter(b => b.z > hoop.z - 0.05).sort((a, b) => b.z - a.z);
    const near = nb.balls.filter(b => b.z <= hoop.z - 0.05).sort((a, b) => b.z - a.z);
    drawRim(ctx, r, t, 'back');
    for (const b of far) drawFlyingBall(ctx, b, t);
    drawRim(ctx, r, t, 'front');
    for (const b of near) drawFlyingBall(ctx, b, t);
    OX = 0; ({ hoop, onFire, net, design } = keep);
    // a dark veil over that side so the eye stays on your machine
    ctx.fillStyle = 'rgba(15,10,42,0.5)';
    if (nb.ox < 0) ctx.fillRect(0, 0, W / 2, H); else ctx.fillRect(W / 2, 0, W / 2, H);
  }

  function drawHall(ctx, t) {
    // the arcade hall: a dark room glowing with neon
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0f0a2a'); g.addColorStop(0.65, '#2a1660'); g.addColorStop(1, '#3b1f6e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // a string of party bulbs along the ceiling
    for (let k = 0; k < Math.ceil(W / 49); k++) {
      const x = 12 + k * 49, y = 18 + Math.sin(k * 1.3) * 3;
      const on = (Math.floor(t * 4) + k) % 3 !== 0 || crowd > 0;
      const c = ['#ff5fa2', '#4cc9f0', '#ffd166', '#06d6a0'][k % 4];
      if (on) glow(ctx, c, 14);
      D.circle(ctx, x, y, 6, on ? c : '#3d3466', 2); noGlow(ctx);
    }
    // two neon tubes along the back wall
    for (const [y, c, ph] of [[150, '#ff5fa2', 0], [172, '#4cc9f0', 1.7]]) {
      ctx.globalAlpha = 0.65 + 0.3 * Math.sin(t * 2 + ph);
      glow(ctx, c, 20); ctx.strokeStyle = c; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-10, y); ctx.lineTo(W + 10, y); ctx.stroke(); noGlow(ctx);
    }
    ctx.globalAlpha = 1;
    // a plain dark floor
    ctx.fillStyle = '#1a1038'; ctx.fillRect(0, 420, W, H - 420);
  }

  function quad(ctx, pts, fill, lw = 4) {
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke(); }
  }
  function drawMachine(ctx, t) {
    const zb = hoop.z + rimR + 0.12, zf = 0.55;
    const P = proj;
    // ---- the cage: built like a real pop-a-shot machine ----
    const cz = BONUS_Z + 0.45;                         // the back of the cage never moves
    const topH = (z) => 1.75 + 1.6 * Math.sqrt(math.clamp((z - zf) / (cz - zf), 0, 1));   // the arched top
    // back wall: dark padding with a spotlight glowing behind the hoop
    const bw = [P(-1, rampH(cz), cz), P(1, rampH(cz), cz), P(1, topH(cz), cz), P(-1, topH(cz), cz)];
    const wg = ctx.createLinearGradient(0, bw[2].y, 0, bw[0].y);
    wg.addColorStop(0, '#1b1440'); wg.addColorStop(1, '#30246b');
    quad(ctx, bw, wg, 0);
    const sp = P(hoop.x, RIM_H + 0.3, cz);
    const rg = ctx.createRadialGradient(sp.x, sp.y, 4, sp.x, sp.y, 150);
    rg.addColorStop(0, onFire ? 'rgba(255,140,66,0.55)' : 'rgba(155,246,255,0.35)'); rg.addColorStop(1, 'rgba(155,246,255,0)');
    ctx.fillStyle = rg; ctx.fillRect(sp.x - 160, sp.y - 160, 320, 320);
    // the wood ramp the balls roll down (lighter far away, warmer up close)
    const rp = [P(-1, rampH(zf), zf), P(1, rampH(zf), zf), P(1, rampH(cz), cz), P(-1, rampH(cz), cz)];
    const rgr = ctx.createLinearGradient(0, rp[2].y, 0, H);
    rgr.addColorStop(0, '#f6b26b'); rgr.addColorStop(1, '#d4702a');
    quad(ctx, rp, rgr, 4);
    ctx.strokeStyle = 'rgba(120,50,0,0.22)'; ctx.lineWidth = 2;
    for (let x = -0.85; x < 1; x += 0.17) { const a = P(x, rampH(zf), zf), b = P(x, rampH(cz), cz); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    // painted lines: two white lane stripes and a half circle, like a little court
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3;
    for (const x of [-0.82, 0.82]) { const a = P(x, rampH(zf), zf), b = P(x, rampH(cz), cz); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    ctx.beginPath();
    for (let k = 0; k <= 20; k++) { const a = Math.PI * k / 20, z = 2.2 - Math.sin(a) * 0.5, q = P(Math.cos(a) * 0.5, rampH(z), z); k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }
    ctx.stroke();
    // the wire mesh sides
    for (const sx of [-1, 1]) {
      const side = [P(sx, rampH(zf), zf), P(sx, topH(zf), zf), P(sx, topH(cz), cz), P(sx, rampH(cz), cz)];
      quad(ctx, side, 'rgba(150,170,255,0.07)', 0);
      ctx.strokeStyle = 'rgba(210,220,255,0.28)'; ctx.lineWidth = 1.3;
      for (let z = zf; z <= cz + 0.01; z += 0.15) { const a = P(sx, rampH(z), z), b = P(sx, topH(z), z); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      for (let hh = 0.65; hh < 3.4; hh += 0.15) {
        ctx.beginPath(); let on = false;
        for (let z = zf; z <= cz + 0.01; z += 0.1) {
          if (hh < rampH(z) || hh > topH(z)) { on = false; continue; }
          const q = P(sx, hh, z); on ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); on = true;
        }
        ctx.stroke();
      }
      // the frame: the arch, the bottom rail and three posts
      const arch = []; for (let z = zf; z <= cz + 0.01; z += 0.1) arch.push(P(sx, topH(z), z));
      tube(ctx, arch);
      for (const z of [zf, (zf + cz) / 2, cz]) tube(ctx, [P(sx, rampH(z), z), P(sx, topH(z), z)]);
      tube(ctx, [P(sx, rampH(zf), zf), P(sx, rampH(cz), cz)]);
    }
    tube(ctx, [P(-1, topH(cz), cz), P(1, topH(cz), cz)]);   // a bar across the top at the back

    // ---- the backboard: white, blue edge, a red square and blinking bulbs ----
    const bl = P(hoop.x - 0.75, RIM_H - 0.15, zb), br = P(hoop.x + 0.75, RIM_H + 0.95, zb);
    const bx = bl.x, by = br.y, bwid = br.x - bl.x, bh = bl.y - br.y;
    D.box(ctx, bx - 6, by - 6, bwid + 12, bh + 12, 16, '#1f4fbf', 4);
    D.box(ctx, bx, by, bwid, bh, 12, '#ffffff', 3);
    ctx.save(); D.rr(ctx, bx, by, bwid, bh, 12); ctx.clip();           // a shiny glass streak
    ctx.fillStyle = 'rgba(155,246,255,0.25)';
    ctx.beginPath(); ctx.moveTo(bx + bwid * 0.55, by); ctx.lineTo(bx + bwid * 0.75, by); ctx.lineTo(bx + bwid * 0.4, by + bh); ctx.lineTo(bx + bwid * 0.2, by + bh); ctx.fill();
    ctx.restore();
    const inner = P(hoop.x - 0.25, RIM_H + 0.05, zb), inner2 = P(hoop.x + 0.25, RIM_H + 0.45, zb);
    ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 5; ctx.strokeRect(inner.x, inner2.y, inner2.x - inner.x, inner.y - inner2.y);
    const lights = 10;
    for (let k = 0; k < lights; k++) {
      const lx = bx + 12 + k * ((bwid - 24) / (lights - 1));
      const on = onFire ? Math.sin(t * 20 + k) > 0 : net.swish > 0 ? true : (Math.floor(t * 3) + k) % 4 === 0;
      const c = onFire ? '#ff8c42' : '#ffd166';
      if (on) glow(ctx, c, 10);
      D.circle(ctx, lx, by + 10, 4.5, on ? c : '#d5d9e6', 1.5); noGlow(ctx);
    }
  }

  // the front of the machine (blue with white stripes, like a real arcade cabinet)
  function drawCabinet(ctx) {
    const top = 506;
    const cg = ctx.createLinearGradient(0, top, 0, H);
    cg.addColorStop(0, '#2d64e0'); cg.addColorStop(1, '#173c9e');
    ctx.fillStyle = cg; ctx.fillRect(0, top, W, H - top);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, top + 14, W, 3); ctx.fillRect(0, top + 22, W, 3);
    // a red swoosh and two basketball badges
    ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.moveTo(W / 2 + 80, H); ctx.lineTo(W / 2 + 140, top + 8); ctx.lineTo(W / 2 + 220, top + 8); ctx.lineTo(W / 2 + 160, H); ctx.fill();
    for (const x of [W / 2 - 390, W / 2 + 390]) {
      D.circle(ctx, x, top + 26, 20, '#ff8c42', 3);
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 20, top + 26); ctx.lineTo(x + 20, top + 26); ctx.moveTo(x, top + 6); ctx.lineTo(x, top + 46); ctx.stroke();
    }
    // a chrome edge along the top
    ctx.fillStyle = '#c9d3e8'; ctx.fillRect(0, top - 6, W, 8);
    ctx.fillStyle = INK; ctx.fillRect(0, top - 9, W, 3); ctx.fillRect(0, top + 2, W, 2);
  }

  function drawRim(ctx, r, t, part) {
    const s = r.s, rw = rimR * (onFire ? 1.15 : 1) * s, rh = rw * 0.28;
    if (part === 'back') {
      // the net (behind the ball)
      const sw = net.swish;
      ctx.strokeStyle = onFire ? '#ffb703' : '#ffffff'; ctx.lineWidth = 2.5;
      const len = rw * 1.1 * (1 + sw * 0.25);
      for (let k = 0; k <= 8; k++) {
        const a = Math.PI + (k / 8) * Math.PI;
        const x0 = r.x + Math.cos(a) * rw, y0 = r.y + Math.sin(a) * rh;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(r.x + Math.cos(a) * rw * 0.55, r.y + len); ctx.stroke();
      }
      ctx.beginPath(); ctx.ellipse(r.x, r.y, rw, rh, 0, Math.PI, 0); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
      ctx.lineWidth = 4; ctx.strokeStyle = '#ff6b35'; ctx.stroke();
      return;
    }
    // front net + rim
    const sw = net.swish, len = rw * 1.1 * (1 + sw * 0.25);
    ctx.strokeStyle = onFire ? '#ffd166' : '#ffffff'; ctx.lineWidth = 2.5;
    for (let k = 0; k <= 8; k++) {
      const a = (k / 8) * Math.PI;
      const x0 = r.x + Math.cos(a) * rw, y0 = r.y + Math.sin(a) * rh;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(r.x + Math.cos(a) * rw * 0.55, r.y + len); ctx.stroke();
    }
    for (let k = 1; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(r.x, r.y + len * k / 3, rw * (1 - 0.15 * k), rh * 0.8, 0, 0, Math.PI); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(r.x, r.y, rw, rh, 0, 0, Math.PI); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = '#ff6b35'; ctx.stroke();
    // ON FIRE: flames dancing around the rim and net
    if (onFire) {
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2, fx0 = r.x + Math.cos(a) * rw, fy0 = r.y + Math.sin(a) * rh;
        const hgt = (18 + Math.sin(t * 14 + k * 1.7) * 8) * s / 180;
        ctx.beginPath(); ctx.moveTo(fx0 - 7, fy0);
        ctx.quadraticCurveTo(fx0 + Math.sin(t * 9 + k) * 4, fy0 - hgt * 2.2, fx0 + 7, fy0);
        ctx.closePath(); ctx.fillStyle = k % 2 ? '#ffd166' : '#ff8c42'; ctx.fill();
      }
    }
  }

  function drawFlyingBall(ctx, b, t) {
    const p = proj(b.x, b.h, b.z), r = BALL_R * p.s;
    if (b.fire && b.state === 'fly') {                 // a fiery trail
      b.trail.forEach((q, i) => { ctx.globalAlpha = i / b.trail.length * 0.7; D.circle(ctx, q.x, q.y, r * (0.4 + 0.6 * i / b.trail.length), i % 2 ? '#ffd166' : '#ff8c42', 0); });
      ctx.globalAlpha = 1;
    }
    // shadow on the ramp
    const sh = proj(b.x, rampH(b.z), b.z);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(sh.x, sh.y, r * 0.9, r * 0.3, 0, 0, 7); ctx.fill();
    drawBall(ctx, p.x, p.y, r, design, b.spin);
  }

  function drawHandBall(ctx, t) {
    const p = proj(START.x, START.h, START.z), r = BALL_R * p.s;
    if (!ready || over) return;
    let dx = 0, dy = 0;
    const pt = Arcade && rgPointer();
    if (drag && pt && pt.down) { dx = math.clamp(pt.x - drag.x, -160, 160); dy = math.clamp(pt.y - drag.y, 0, 200); }
    // keyboard: power bar while winding up
    if (charge != null) {
      const k = (charge % 1.6) / 0.8, pw = k < 1 ? k : 2 - k;
      D.box(ctx, W / 2 + 260, 290, 34, 180, 10, '#ffffff', 4);
      ctx.fillStyle = pw > 0.55 && pw < 0.8 ? '#06d6a0' : '#ff8c42'; ctx.fillRect(W / 2 + 264, 466 - 172 * pw, 26, 172 * pw);
    }
    // aim guide: a dotted arc toward where you're aiming
    const aimX = drag && pt && pt.down ? -dx / 160 : aim;
    if ((drag && pt && pt.down && dy > 20) || charge != null) {
      ctx.setLineDash([6, 10]); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 4;
      ctx.beginPath(); const a = proj(0, 1.2, 0.5), b = proj(hoop.x + aimX * 0.4, RIM_H + 0.4, hoop.z * 0.7);
      ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo((a.x + b.x) / 2, b.y - 60, b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
    } else if (!drag && charge == null && Math.abs(aim) > 0.05) {
      const m = proj(hoop.x + aim * 0.5, RIM_H - 0.4, hoop.z); D.circle(ctx, m.x, m.y, 6, '#ffd166', 2);
    }
    const hx = p.x + dx * 0.3, hy = p.y + dy * 0.35;
    drawBall(ctx, hx, hy, r, design, 0);
  }
  let gref = null;
  const rgPointer = () => gref && gref.input.pointer;

  function drawScoreboard(ctx, t) {
    // the big lit-up marquee on top of the machine: score | time | rival
    const x = W / 2 - 230, y = 8, w = 460, h = 78;
    D.box(ctx, x - 8, y - 4, w + 16, h + 8, 18, '#ef476f', 4);
    D.box(ctx, x, y + 4, w, h - 8, 12, '#0b0820', 3);
    // chasing bulbs around the edge
    const n = 22;
    for (let k = 0; k < n; k++) {
      const on = (Math.floor(t * (onFire ? 14 : 5)) + k) % 3 === 0 || crowd > 0.3;
      const c = onFire ? '#ff8c42' : '#ffd166';
      const bx = x + 6 + k * (w - 12) / (n - 1);
      for (const by of [y, y + h]) { if (on) glow(ctx, c, 8); D.circle(ctx, bx, by, 3.2, on ? c : '#a33a55', 0); noGlow(ctx); }
    }
    const tm = Math.ceil(timeLeft);
    const led = (str, cx, color) => { glow(ctx, color, 16); D.text(ctx, str, cx, y + 38, { size: 44, color, stroke: false }); noGlow(ctx); };
    const lab = (str, cx, color = '#c9c3ff') => D.text(ctx, str, cx, y + 64, { size: 14, color, stroke: false });
    led(String(score), W / 2 - 150, '#ffd166'); lab('YOU', W / 2 - 150);
    const hurry = timeLeft <= 10 && started;
    led((tm < 10 ? '0' : '') + tm, W / 2, hurry ? '#ff4d6d' : '#9bf6ff'); lab(inBonus() ? '3 POINTS!' : 'TIME', W / 2, inBonus() ? '#ffd166' : '#c9c3ff');
    if (rival) { led(String(rival.score), W / 2 + 150, '#ff8fab'); lab(rival.name.toUpperCase(), W / 2 + 150); }
    else { led(String(Math.max(score, (L._best || 0))), W / 2 + 150, '#06d6a0'); lab('BEST', W / 2 + 150); }
    // streak flames on a little tab under the board: light all 3 and you're ON FIRE
    D.box(ctx, W / 2 - 50, y + h + 2, 100, 30, 10, '#0b0820', 3);
    for (let i = 0; i < 3; i++) {
      const lit = i < Math.min(3, streak) || onFire;
      const wob = onFire ? Math.sin(t * 12 + i) * 1.5 : 0;
      if (lit) glow(ctx, '#ff8c42', 10);
      flame(ctx, W / 2 - 26 + i * 26, y + h + 17 + wob, 10, lit ? '#ff8c42' : '#3d3466', lit ? '#ffd166' : '#3d3466');
      noGlow(ctx);
    }
  }
  function drawBall(ctx, x, y, r, kind, spin, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.save();
    ctx.clip();
    ctx.rotate(spin);
    const S = (c, w = 3) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke(); };
    if (kind === 'beach') {
      const cols = ['#ef476f', '#ffffff', '#118ab2', '#ffffff', '#ffd166', '#ffffff'];
      for (let i = 0; i < 6; i++) {
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r + 2, i * Math.PI / 3, (i + 1) * Math.PI / 3); ctx.closePath();
        ctx.fillStyle = cols[i]; ctx.fill();
      }
      D.circle(ctx, 0, 0, r * 0.22, '#ffffff', 2);
    } else if (kind === 'melon') {
      ctx.fillStyle = '#7bd389'; ctx.fillRect(-r, -r, r * 2, r * 2);
      for (const dx of [-0.6, 0, 0.6]) {
        ctx.beginPath(); ctx.moveTo(dx * r - 3, -r);
        ctx.quadraticCurveTo(dx * r + 6, -r * 0.5, dx * r - 2, 0); ctx.quadraticCurveTo(dx * r - 8, r * 0.5, dx * r + 2, r);
        S('#2e8b57', 5);
      }
    } else if (kind === 'star') {
      ctx.fillStyle = '#9b5de5'; ctx.fillRect(-r, -r, r * 2, r * 2);
      for (const [sx, sy, sr] of [[-7, -6, 7], [8, 7, 6], [7, -10, 4], [-8, 10, 4]]) D.star(ctx, sx * r / 20, sy * r / 20, sr * r / 20, '#ffd166', 1.5);
    } else if (kind === 'rainbow') {
      const cols = ['#ef476f', '#ff8c42', '#ffd166', '#06d6a0', '#118ab2', '#9b5de5'];
      for (let i = 0; i < 6; i++) { ctx.fillStyle = cols[i]; ctx.fillRect(-r, -r + i * r / 3, r * 2, r / 3 + 1); }
    } else if (kind === 'gold') {
      const gr = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
      gr.addColorStop(0, '#fff3b0'); gr.addColorStop(1, '#ffc93c');
      ctx.fillStyle = gr; ctx.fillRect(-r, -r, r * 2, r * 2);
      D.star(ctx, 0, 0, r * 0.5, '#fff7d6', 2);
    } else {
      // classic orange ball with seams
      ctx.fillStyle = '#ff8c42'; ctx.fillRect(-r, -r, r * 2, r * 2);
      ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); S(INK);
      ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(0, r); S(INK);
      ctx.beginPath(); ctx.arc(-r * 1.25, 0, r * 0.9, -1, 1); S(INK);
      ctx.beginPath(); ctx.arc(r * 1.25, 0, r * 0.9, Math.PI - 1, Math.PI + 1); S(INK);
    }
    ctx.restore();
    // shine (doesn't spin) + outline
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.ellipse(-r * 0.38, -r * 0.42, r * 0.26, r * 0.16, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
  }

  function ballIcon(kind) {
    // simple SVG versions of the ball designs for the picker
    const ring = '<circle cx="35" cy="35" r="28" fill="none" stroke="#2b2b2b" stroke-width="4"/>';
    let inner = '';
    if (kind === 'beach') {
      const cols = ['#ef476f', '#fff', '#118ab2', '#fff', '#ffd166', '#fff'];
      for (let i = 0; i < 6; i++) {
        const a0 = i * Math.PI / 3, a1 = (i + 1) * Math.PI / 3;
        inner += `<path d="M35 35 L${35 + 28 * Math.cos(a0)} ${35 + 28 * Math.sin(a0)} A28 28 0 0 1 ${35 + 28 * Math.cos(a1)} ${35 + 28 * Math.sin(a1)} Z" fill="${cols[i]}"/>`;
      }
    } else if (kind === 'melon') inner = '<circle cx="35" cy="35" r="28" fill="#7bd389"/><path d="M22 9 Q30 22 22 35 Q16 48 24 61 M35 7 Q43 22 35 35 Q29 48 37 63 M48 9 Q56 22 48 35 Q42 48 50 61" fill="none" stroke="#2e8b57" stroke-width="5"/>';
    else if (kind === 'star') inner = '<circle cx="35" cy="35" r="28" fill="#9b5de5"/><path d="M26 14 l4 8 8 1 -6 6 1.5 8 -7.5 -4 -7.5 4 1.5 -8 -6 -6 8 -1z M46 34 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1z" fill="#ffd166" stroke="#2b2b2b" stroke-width="1.5"/>';
    else if (kind === 'rainbow') {
      const cols = ['#ef476f', '#ff8c42', '#ffd166', '#06d6a0', '#118ab2', '#9b5de5'];
      inner = '<clipPath id="rb"><circle cx="35" cy="35" r="28"/></clipPath><g clip-path="url(#rb)">' + cols.map((c, i) => `<rect x="0" y="${7 + i * 9.4}" width="70" height="10" fill="${c}"/>`).join('') + '</g>';
    } else if (kind === 'gold') inner = '<circle cx="35" cy="35" r="28" fill="#ffc93c"/><path d="M7 35 H63 M35 7 V63 M14 15 Q26 35 14 55 M56 15 Q44 35 56 55" fill="none" stroke="#b8860b" stroke-width="3"/>';
    else inner = '<circle cx="35" cy="35" r="28" fill="#ff8c42"/><path d="M7 35 H63 M35 7 V63 M14 15 Q26 35 14 55 M56 15 Q44 35 56 55" fill="none" stroke="#2b2b2b" stroke-width="3"/>';
    return `<svg viewBox="0 0 70 70">${inner}<ellipse cx="25" cy="23" rx="7" ry="4.5" fill="#fff" opacity="0.55" transform="rotate(-35 25 23)"/>${ring}</svg>`;
  }

  // ---------------------------------------------------------------
  // Menus: the ladder of rivals, and the ball picker
  // ---------------------------------------------------------------
  function levelPic(lv) {
    // a little machine; the rival's face sits on the side
    let extra = '';
    if (lv.rival) extra = `<circle cx="26" cy="38" r="16" fill="${lv.rival.color}" stroke="#2b2b2b" stroke-width="3.5"/><circle cx="21" cy="35" r="2.6" fill="#fff"/><circle cx="31" cy="35" r="2.6" fill="#fff"/><path d="M20 44 Q26 49 32 44" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`;
    else extra = `<path d="M26 22 l4.5 9 10 1.5 -7 7 1.7 10 -9.2 -5 -9.2 5 1.7 -10 -7 -7 10 -1.5z" fill="#ffd166" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/>`;
    if (lv.move) extra += `<path d="M58 8 H96 M64 3 L58 8 L64 13 M90 3 L96 8 L90 13" fill="none" stroke="#ef476f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
    return `<svg viewBox="0 0 120 70"><rect width="120" height="70" rx="8" fill="#3a2a6e"/>` +
      `<rect x="62" y="16" width="44" height="30" rx="4" fill="#fff" stroke="#2b2b2b" stroke-width="3"/>` +
      `<path d="M74 44 L78 60 H90 L94 44" fill="#fff" stroke="#2b2b2b" stroke-width="2.5"/><ellipse cx="84" cy="44" rx="11" ry="3.5" fill="none" stroke="#2b2b2b" stroke-width="6"/><ellipse cx="84" cy="44" rx="11" ry="3.5" fill="none" stroke="#ff6b35" stroke-width="3"/>` +
      `<text x="84" y="34" font-size="13" font-weight="800" text-anchor="middle" font-family="Trebuchet MS, sans-serif" fill="#2b2b2b">${lv.time}s</text>` +
      extra + `</svg>`;
  }

  function levels(g) {
    const done = id => !!(g.save.levels[id] || {}).done;
    return LEVELS.map((lv, i) => {
      // each rival opens once you beat the one before; High Score is always open
      const locked = !!lv.rival && i > 0 && !done(LEVELS[i - 1].id);
      const rec = g.save.levels[lv.id] || {};
      return { ...lv, pic: levelPic(lv), locked,
        meta: Arcade.starsHTML(rec.stars || 0) + (rec.score ? ' <b>' + rec.score + '</b>' : '') };
    });
  }

  function extraMenu(g) {
    checkUnlocks(g);
    const wrap = Arcade.h('div');
    wrap.appendChild(Arcade.h('h2', { class: 'ar-title', style: 'font-size:24px;margin-top:16px' }, 'Pick your ball'));
    const row = Arcade.h('div', { class: 'ar-grid' });
    const current = pickedBall(g);
    for (const b of BALLS) {
      const ok = ballUnlocked(g, b);
      const tile = Arcade.h('button', { type: 'button', class: 'ar-tile' + (ok ? '' : ' locked') + (b.id === current ? ' picked' : '') },
        `<div class="pic">${ballIcon(b.id)}</div><div>${b.name}</div><div class="meta">${ok ? '' : b.need}</div>` + (ok ? '' : `<div class="lock">${icons.lock}</div>`));
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

  // ---------------------------------------------------------------
  // Start the game
  // ---------------------------------------------------------------
  const S = (inner) => `<svg viewBox="0 0 80 80">${inner}</svg>`;
  const BALL_SVG = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ff8c42" stroke="#2b2b2b" stroke-width="3.5"/><path d="M${x - r} ${y} H${x + r} M${x} ${y - r} V${y + r}" stroke="#2b2b2b" stroke-width="2.5"/>`;
  const LINK = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';   // outline style for the logo picture
  Arcade.start({
    id: 'hoops',
    trophies: [
      { id: 'win', name: 'Nothing but net', how: 'Beat a rival' },
      { id: 'swish', name: 'Swish!', how: 'Score without touching the rim' },
      { id: 'fire', name: "He's on fire!", how: '3 baskets in a row' },
      { id: 'downtown', name: 'From downtown', how: 'Score in the 3-point bonus' },
      { id: 'three-stars', name: 'Superstar', how: 'Get 3 stars in a game' },
      { id: 'high60', name: 'Point machine', how: '60 points in High Score' },
      { id: 'champ', name: 'Champion', how: 'Beat the Champ' },
      { id: 'streak10', name: 'Unstoppable', how: '10 baskets in a row', secret: true },
      { id: 'perfect', name: 'Every single one', how: 'Make every shot in a game (8 or more)', secret: true },
      { id: 'buzzer', name: 'Buzzer beater', how: 'Score after the buzzer goes off', secret: true },
    ],   // the trophy room (secret ones show '???' until earned)
    logo: Arcade.logo({ title: 'Hoop Heroes', colors: ['#ffd166', '#ef476f'], bg: '#ffb4a2', art: `<rect x="150" y="14" width="70" height="56" rx="6" fill="#fff" ${LINK}/><rect x="170" y="34" width="30" height="22" fill="none" ${LINK}/>
              <path d="M150 70 H200 L192 108 H158 Z" fill="#fff" ${LINK}/><path d="M150 70 H200" stroke="#ef476f" stroke-width="7"/>
              <g class="wobble"><circle cx="70" cy="90" r="28" fill="#ff8c42" ${LINK}/><path d="M42 90 H98 M70 62 V118 M50 70 Q70 90 50 110 M90 70 Q70 90 90 110" fill="none" ${LINK} stroke-width="3"/></g>` }),   // title screen
    menuMusic: { tempo: 112, root: 60, scale: 'major', prog: [[1, 6, 4, 5], [4, 5, 6, 5]], drums: 'disco', bass: 'octaves', lead: 'square', pad: true, arp: true, seed: 1302 },   // the title/menu song
    title: 'Hoop Heroes',
    view: { w: 960, h: H, flex: true, maxW: 1300 },
    background: '#2a1e5c',
    music: { tempo: 98, root: 53, scale: 'dorian', prog: [[1, 4, 1, 4], [6, 7, 1, 1]], drums: 'boombap', bass: 'bounce', lead: 'square', swing: 0.16, pad: true, arp: false, seed: 1301 },   // this game's own song
    levelsTitle: 'Pick a rival',
    howTo: [
      { pic: S(BALL_SVG(40, 26, 14) + `<path d="M40 44 V70 M32 62 L40 70 L48 62" stroke="#2b2b2b" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`), text: 'Pull back, let go!', keys: 'Drag down &middot; or arrows + hold Space' },
      { pic: S(`<path d="M40 74 C10 66 16 36 32 10 Q36 30 46 26 C56 40 66 62 40 74 Z" fill="#ff8c42" stroke="#2b2b2b" stroke-width="4"/><path d="M40 70 C28 64 30 50 38 40 Q42 52 48 48 C52 58 50 66 40 70 Z" fill="#ffd166"/>`), text: '3 in a row = ON FIRE!' },
      { pic: S(`<circle cx="40" cy="42" r="28" fill="#ffd166" stroke="#2b2b2b" stroke-width="4"/><text x="40" y="53" font-size="32" font-weight="800" text-anchor="middle" font-family="Trebuchet MS, sans-serif" fill="#2b2b2b">3</text>`), text: 'Last 10 seconds: 3 points!' },
      { pic: S(`<circle cx="40" cy="40" r="26" fill="#ef476f" stroke="#2b2b2b" stroke-width="4"/><circle cx="32" cy="36" r="4" fill="#fff"/><circle cx="48" cy="36" r="4" fill="#fff"/><path d="M30 50 Q40 58 50 50" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`), text: 'Beat your rival!' },
    ],
    levels,
    extraMenu,
    setup,
    update,
    draw: render,
  });
})();
