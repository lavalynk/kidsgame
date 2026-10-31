// =====================================================================
// Turbo Bike Challenge — side-scrolling motocross against the clock.
//
// How the physics works (the fun part):
//  * On the ground the bike follows the track's height. Every step we
//    check: "if the bike kept its upward speed, would it be above the
//    ground?" If yes, it has flown off the top of a ramp — it's airborne.
//  * In the air, gravity pulls it down and the rider can lean forward
//    (gas) or back (brake) to tilt the bike.
//  * On landing we compare the bike's tilt with the slope of the ground:
//    matching = smooth (or a "Perfect!" speed boost), a bit off = wobble
//    (slower), way off = a cartoon tumble.
//  * Turbo is faster but heats the engine. Too hot = stall for a moment.
//    Rolling over the yellow arrows cools the engine right down.
// =====================================================================
(function () {
  const { draw, icons, math } = Arcade;
  const D = draw;
  const W = 960, H = 540;
  const G = 1700;                      // gravity (px/s²)

  // ---- lanes: 0 = back, 3 = front. y of the ground line for each lane ----
  const LANE0 = 396, LANE_GAP = 32;
  const laneY = l => LANE0 + l * LANE_GAP;
  const TRACK_TOP = LANE0 - 22, TRACK_BOT = laneY(3) + 22;

  // ---------------------------------------------------------------
  // Track pieces. A track is a list of piece names; build() turns it
  // into "features" with positions. Kids use the same pieces in the editor.
  // ---------------------------------------------------------------
  const PIECES = {
    flat:   { name: 'Flat',        len: 260 },
    small:  { name: 'Small ramp',  len: 200, ramp: [[0, 0], [110, 46], [200, 0]] },
    big:    { name: 'Big ramp',    len: 330, ramp: [[0, 0], [190, 96], [330, 0]] },
    kicker: { name: 'Launch',      len: 380, ramp: [[0, 0], [140, 70], [141, 0]], after: 240 },
    table:  { name: 'Table top',   len: 470, ramp: [[0, 0], [140, 70], [330, 70], [470, 0]] },
    double: { name: 'Double',      len: 620, ramp: [[0, 0], [120, 64], [200, 0], [400, 0], [500, 64], [620, 0]] },
    bumps:  { name: 'Bumpy',       len: 400, ramp: [[0, 0], [50, 18], [100, 0], [150, 18], [200, 0], [250, 18], [300, 0], [350, 18], [400, 0]] },
    mud:    { name: 'Mud',         len: 280, mud: [1, 2] },
    mud2:   { name: 'Mud',         len: 280, mud: [0, 3] },
    arrows: { name: 'Cool arrows', len: 140, arrows: [0, 3] },
    arrows2:{ name: 'Cool arrows', len: 140, arrows: [1, 2] },
    logs:   { name: 'Logs',        len: 220, logs: [0, 2] },
    logs2:  { name: 'Logs',        len: 220, logs: [1, 3] },
  };

  const THEMES = {
    meadow:  { sky: ['#8fd3ff', '#d9f3ff'], hill: '#7cc576', hill2: '#5aa65a', dirt: '#c98b4f', dirt2: '#b77940', ramp: '#e0a465', face: '#a8683a', ground: '#6abf69', bg: '#8fd3ff' },
    desert:  { sky: ['#ffbe76', '#ffe8c2'], hill: '#e0a96d', hill2: '#c98d57', dirt: '#d9a05b', dirt2: '#c48a48', ramp: '#ebb877', face: '#b47a3e', ground: '#e8c27a', bg: '#ffbe76' },
    forest:  { sky: ['#a0e6c8', '#e6fff3'], hill: '#3f8f5a', hill2: '#2f7449', dirt: '#a8744a', dirt2: '#94633c', ramp: '#c48c5a', face: '#8a5a33', ground: '#4ea36a', bg: '#a0e6c8' },
    snow:    { sky: ['#b8d8ff', '#f0f7ff'], hill: '#ffffff', hill2: '#dce9f7', dirt: '#b9a48c', dirt2: '#a8927a', ramp: '#d8c6ae', face: '#9a8268', ground: '#f5f9ff', bg: '#b8d8ff' },
    volcano: { sky: ['#5b2a86', '#ff8f6b'], hill: '#4a3b4f', hill2: '#3a2c40', dirt: '#8a5a44', dirt2: '#76493a', ramp: '#a5705a', face: '#6b4334', ground: '#3d3340', bg: '#5b2a86' },
    night:   { sky: ['#1b2a5c', '#3f5aa8'], hill: '#2c3e70', hill2: '#22315c', dirt: '#8f6a4a', dirt2: '#7d5a3d', ramp: '#a8805c', face: '#6e4f35', ground: '#2f4f4f', bg: '#1b2a5c' },
  };

  // The built-in tracks get harder one by one. "par" is a great time (seconds).
  const TRACKS = [
    { id: 't1', name: 'Sunny Start',   theme: 'meadow', par: 9.7,
      pieces: ['flat', 'small', 'flat', 'arrows', 'small', 'mud', 'table', 'flat', 'small', 'flat'] },
    { id: 't2', name: 'Dusty Hills',   theme: 'desert', par: 10.6,
      pieces: ['flat', 'small', 'logs', 'big', 'arrows2', 'kicker', 'mud2', 'small', 'table', 'bumps', 'flat'] },
    { id: 't3', name: 'Forest Flyer',  theme: 'forest', par: 14.8,
      pieces: ['flat', 'table', 'logs2', 'double', 'arrows', 'mud', 'big', 'kicker', 'logs', 'bumps', 'small', 'flat'] },
    { id: 't4', name: 'Snowy Peaks',   theme: 'snow',   par: 15.2,
      pieces: ['flat', 'big', 'bumps', 'double', 'arrows2', 'kicker', 'logs', 'table', 'mud2', 'big', 'double', 'flat'] },
    { id: 't5', name: 'Volcano Run',   theme: 'volcano', par: 20.2,
      pieces: ['flat', 'kicker', 'double', 'logs2', 'big', 'arrows', 'bumps', 'table', 'kicker', 'mud', 'double', 'big', 'arrows2', 'kicker', 'flat'] },
  ];

  // Bikes: different colors and handling. Unlocked by playing well.
  const BIKES = [
    { id: 'red',   name: 'Red Rocket',   color: '#ef476f', top: 1.0,  heat: 1.0, land: 0,    lean: 1.0, need: null },
    { id: 'blue',  name: 'Blue Breeze',  color: '#118ab2', top: 0.97, heat: 0.7, land: 0,    lean: 1.0, need: 'Finish Dusty Hills' },
    { id: 'green', name: 'Green Gecko',  color: '#06d6a0', top: 0.98, heat: 1.0, land: 0.15, lean: 1.3, need: 'Win a gold medal' },
    { id: 'gold',  name: 'Golden Comet', color: '#ffc93c', top: 1.08, heat: 0.9, land: 0.05, lean: 1.1, need: 'Win 4 gold medals' },
  ];

  // Build features (with x positions) from a list of piece names.
  function build(pieces) {
    const feats = [];
    let x = 600; // run-up before the first piece
    for (const name of pieces) {
      const p = PIECES[name]; if (!p) continue;
      if (p.ramp) feats.push({ kind: 'ramp', x, pts: p.ramp.map(([dx, h]) => [x + dx, h]), end: x + p.len });
      if (p.mud) for (const l of p.mud) feats.push({ kind: 'mud', lane: l, x: x + 20, end: x + p.len - 20 });
      if (p.arrows) for (const l of p.arrows) feats.push({ kind: 'arrows', lane: l, x: x + 20, end: x + p.len - 20 });
      if (p.logs) for (const l of p.logs) feats.push({ kind: 'log', lane: l, x: x + 80, end: x + 140, h: 20 });
      x += p.len + (p.after || 0) + 140;
    }
    return { feats, finish: x + 200, length: x + 900 };
  }

  // Height of a polyline ramp at x (0 outside).
  function rampH(f, x) {
    if (x <= f.pts[0][0] || x >= f.pts[f.pts.length - 1][0]) return 0;
    for (let i = 1; i < f.pts.length; i++) {
      const [x1, h1] = f.pts[i - 1], [x2, h2] = f.pts[i];
      if (x <= x2) return h1 + (h2 - h1) * (x - x1) / (x2 - x1 || 1);
    }
    return 0;
  }
  // Ground height for a lane: full-width ramps + that lane's logs (a small round hump).
  function groundH(T, x, lane) {
    let h = 0;
    for (const f of T.feats) {
      if (x < f.x - 1 || x > f.end + 1) continue;
      if (f.kind === 'ramp') h = Math.max(h, rampH(f, x));
      else if (f.kind === 'log' && f.lane === lane) {
        const t = (x - f.x) / (f.end - f.x);
        if (t > 0 && t < 1) h = Math.max(h, Math.sin(t * Math.PI) * f.h);
      }
    }
    return h;
  }
  const slopeAt = (T, x, lane) => (groundH(T, x + 2, lane) - groundH(T, x - 2, lane)) / 4;
  const inFeat = (T, kind, x, lane) => T.feats.some(f => f.kind === kind && f.lane === lane && x >= f.x && x <= f.end);

  // ---------------------------------------------------------------
  // Game state
  // ---------------------------------------------------------------
  let T, theme, bike, bikeDef, ghost, ghostRun, countdown, raceTime, finished, popups, stats, camX;

  function pickedBike(g) {
    const id = g.save.data.bike || 'red';
    return BIKES.find(b => b.id === id && bikeUnlocked(g, b)) || BIKES[0];
  }
  function golds(g) { return Object.values(g.save.levels).filter(r => r.medal === 'gold').length; }
  function bikeUnlocked(g, b) {
    if (b.id === 'red') return true;
    return g.isUnlocked('bike-' + b.id);
  }
  function checkUnlocks(g) {
    const done = id => g.save.levels[id] && g.save.levels[id].done;
    if (done('t2')) g.unlock('bike-blue', 'Blue Breeze bike!');
    if (golds(g) >= 1) g.unlock('bike-green', 'Green Gecko bike!');
    if (golds(g) >= 4) g.unlock('bike-gold', 'Golden Comet bike!');
    if (done('t5')) g.unlock('theme-night', 'Night track colors for your own tracks!');
  }

  function setup(g, level) {
    const def = level || { id: 't1', ...TRACKS[0] };
    T = build(def.pieces);
    theme = THEMES[def.theme] || THEMES.meadow;
    document.body.style.setProperty('--ar-bg', theme.bg);
    bikeDef = pickedBike(g);
    bike = {
      x: 300, h: 0, vy: 0, v: 0, angle: 0, w: 0, lane: 1, laneF: 1,
      air: false, heat: 0, over: 0, crash: 0, crashSpin: 0, wheel: 0, lean: 0, airTime: 0,
    };
    countdown = 3.2;
    raceTime = 0;
    finished = false;
    popups = [];
    stats = { perfect: 0, crashes: 0, bigAir: 0 };
    camX = 0;
    ghostRun = [];
    const saved = (g.save.data.ghosts || {})[def.id];
    ghost = saved && saved.length ? saved : null;
    g.beeped = 4;
    // peek hook for automated tests
    window.__bikeState = () => ({ bike, raceTime, finished, stats, finishX: T.finish });
  }

  function popup(text, x, y, color = '#ffd166') { popups.push({ text, x, y, t: 0, color }); }

  // ---------------------------------------------------------------
  // Update (dt = 1/120 s)
  // ---------------------------------------------------------------
  function update(g, dt) {
    const inp = g.input;
    const b = bike;

    // floating texts
    for (const p of popups) { p.t += dt; p.y -= 40 * dt; }
    popups = popups.filter(p => p.t < 1.2);

    // 3, 2, 1, GO!
    if (countdown > 0) {
      countdown -= dt;
      const n = Math.ceil(countdown - 0.2);
      if (n !== g.beeped && n >= 1 && n <= 3) { g.beeped = n; g.sfx('beep'); }
      if (countdown <= 0) g.sfx('go');
      camX = 0;
      return;
    }
    if (!finished) raceTime += dt;

    // record a ghost frame 30 times a second
    if (!finished && Math.floor(raceTime * 30) > ghostRun.length - 1) {
      ghostRun.push([Math.round(b.x), Math.round(b.h), Math.round(b.angle * 100), Math.round(b.laneF * 100)]);
    }

    const tol = g.pick(0.8, 0.55, 0.38) + bikeDef.land;   // how far off a landing can be
    const assist = g.pick(3.2, 1.6, 0.5);                  // auto-tilt toward the flight path
    const heatRate = g.pick(0.16, 0.24, 0.32) * bikeDef.heat;
    const topGas = 400 * bikeDef.top, topTurbo = 590 * bikeDef.top;

    const gas = !finished && inp.down('ArrowRight', 'KeyD');
    const brake = !finished && inp.down('ArrowLeft', 'KeyA');
    const turbo = !finished && inp.down('Space', 'KeyX', 'KeyK');

    // ---- crashed: tumble, then pop back up after the ramp ----
    if (b.crash > 0) {
      b.crash -= dt;
      b.crashSpin += dt * 9;
      b.h = Math.max(0, b.h + b.vy * dt); b.vy -= G * dt;
      b.x += b.v * dt; b.v *= Math.pow(0.05, dt);
      if (b.crash <= 0) {
        // respawn on flat ground just past the obstacle
        for (const f of T.feats) if (f.kind === 'ramp' && b.x > f.x - 40 && b.x < f.end + 20) b.x = f.end + 30;
        b.h = 0; b.vy = 0; b.angle = 0; b.w = 0; b.air = false; b.v = 120; b.crashSpin = 0;
        g.sfx('spring');
      }
      follow(dt);
      return;
    }

    // ---- engine heat ----
    if (b.over > 0) {
      b.over -= dt;
      b.heat = Math.max(0.45, b.heat - dt * 0.2);
      if (Math.random() < dt * 25) g.particles.burst(b.x - camX - 10, laneY(b.laneF) - b.h - 30, { count: 1, colors: ['#ffffff', '#dddddd'], speed: 60, gravity: -120, size: 18, life: 0.8 });
    } else if (turbo) {
      b.heat += heatRate * dt;
      if (b.heat >= 1) {
        b.heat = 1; b.over = g.pick(1.8, 2.6, 3.4);
        g.sfx('crash'); popup('Too hot!', b.x - camX, laneY(b.laneF) - 90, '#ff6b6b');
      }
    } else {
      b.heat = Math.max(0, b.heat - dt * (gas ? 0.12 : 0.2));
    }
    const engineOn = b.over <= 0;

    if (!b.air) {
      // ---- lane changes (only where both lanes are the same height) ----
      const up = inp.hit('ArrowUp', 'KeyW'), dn = inp.hit('ArrowDown', 'KeyS');
      for (const [want, d] of [[up, -1], [dn, 1]]) {
        const nl = b.lane + d;
        if (want && nl >= 0 && nl <= 3 && Math.abs(groundH(T, b.x, nl) - groundH(T, b.x, b.lane)) < 2) { b.lane = nl; g.sfx('tick'); }
      }

      // ---- speed ----
      const muddy = inFeat(T, 'mud', b.x, b.lane);
      let top = engineOn ? (turbo ? topTurbo : gas ? topGas : 0) : 0;
      if (muddy) top *= 0.5;
      if ((gas || turbo) && engineOn && b.v < top) b.v += (turbo ? 430 : 300) * dt;
      else if (b.v > top) b.v -= (muddy ? 700 : gas || turbo ? 220 : 160) * dt;
      if (brake) b.v -= 650 * dt;
      // hills slow you going up and help going down
      const s = slopeAt(T, b.x, b.lane);
      b.v -= Math.sin(Math.atan(s)) * 520 * dt;
      b.v = math.clamp(b.v, 0, 760);

      // cooling arrows
      if (inFeat(T, 'arrows', b.x, b.lane) && b.heat > 0.05 && b.over <= 0) {
        b.heat = 0; g.sfx('coin'); popup('Cool!', b.x - camX, laneY(b.laneF) - 90, '#8ecae6');
      }

      // ---- follow the ground, or take off ----
      const vyGround = b.v * s;
      b.x += b.v * dt;
      const hNext = groundH(T, b.x, b.lane);
      const hFly = b.h + vyGround * dt - 0.5 * G * dt * dt;
      if (hFly > hNext + 0.6 && b.v > 60) {
        b.air = true; b.h = hFly; b.vy = vyGround - G * dt; b.w = 0; b.airTime = 0;
        g.sfx('whoosh');
      } else {
        b.h = hNext;
        const target = Math.atan(slopeAt(T, b.x, b.lane));
        b.angle += (target - b.angle) * Math.min(1, dt * 18);
      }
      // dust from the back wheel
      if ((gas || turbo) && b.v > 80 && Math.random() < dt * (muddy ? 50 : 20)) {
        g.particles.burst(b.x - camX - 24, laneY(b.laneF) - b.h - 4, { count: 1, angle: Math.PI + 0.4, spread: 0.6, speed: 90, gravity: 200, size: muddy ? 12 : 9, life: 0.5, colors: muddy ? ['#5b3a1e', '#6d4526'] : [theme.dirt2, '#e6c39a'] });
      }
    } else {
      // ---- flying ----
      b.airTime += dt;
      b.x += b.v * dt;
      b.vy -= G * dt;
      b.h += b.vy * dt;
      const lean = (gas || turbo ? 1 : 0) - (brake ? 1 : 0);  // + = lean forward (nose down)
      b.w += -lean * 9 * bikeDef.lean * dt;
      b.w *= Math.exp(-3 * dt);
      const path = Math.atan2(b.vy, Math.max(80, b.v));
      if (!lean) b.angle += (path - b.angle) * Math.min(1, assist * dt);
      b.angle += b.w * dt;
      b.angle = math.clamp(b.angle, -1.6, 1.6);

      const gh = groundH(T, b.x, b.lane);
      if (b.h <= gh) {
        // ---- landing! ----
        const gA = Math.atan(slopeAt(T, b.x, b.lane));
        const off = Math.abs(b.angle - gA);
        const sx = b.x - camX, sy = laneY(b.laneF) - gh;
        if (b.airTime > 0.9) { stats.bigAir++; popup('Big air!', sx, sy - 110, '#f15bb5'); }
        if (off > tol) {
          b.crash = g.pick(1.0, 1.5, 2.0); b.vy = 420; b.h = gh; stats.crashes++;
          g.sfx('crash');
          g.particles.burst(sx, sy, { count: 22, colors: [theme.dirt2, '#e6c39a', '#fff'], speed: 260, size: 12 });
          popup('Oops!', sx, sy - 100, '#ffafcc');
        } else {
          if (off > tol * 0.55) { b.v *= 0.6; g.sfx('bonk'); popup('Wobble!', sx, sy - 90, '#ffd166'); }
          else if (off < 0.16 && b.airTime > 0.35) {
            b.v = Math.min(760, b.v + 70); stats.perfect++; g.sfx('star');
            popup('Perfect!', sx, sy - 90, '#06d6a0');
            g.particles.burst(sx, sy - 20, { count: 14, shape: 'star', speed: 200, size: 14, gravity: 300 });
          } else { b.v *= 0.93; g.sfx('hit'); }
          g.particles.burst(sx, sy, { count: 10, angle: -Math.PI / 2, spread: 2.6, colors: [theme.dirt2, '#e6c39a'], speed: 150, size: 10 });
          b.air = false; b.h = gh; b.angle = gA; b.w = 0;
        }
      }
    }
    b.laneF += (b.lane - b.laneF) * Math.min(1, dt * 12);
    b.wheel += b.v * dt / 14;
    b.lean += (((b.air ? ((gas || turbo ? 1 : 0) - (brake ? 1 : 0)) : (turbo ? 0.6 : 0))) - b.lean) * Math.min(1, dt * 10);

    follow(dt);

    // ---- finish line ----
    if (!finished && b.x >= T.finish) {
      finished = true;
      const time = Math.round(raceTime * 100) / 100;
      const slack = g.pick(1.25, 1.0, 0.9);
      const par = (g.level && g.level.par) || estimatePar();
      const medal = time <= par * slack ? 'gold' : time <= par * 1.2 * slack ? 'silver' : time <= par * 1.45 * slack ? 'bronze' : null;
      const levelId = g.level ? g.level.id : 'custom';
      const rec = g.save.levels[levelId];
      if (!rec || rec.time == null || time < rec.time) {
        g.save.data.ghosts = g.save.data.ghosts || {};
        g.save.data.ghosts[levelId] = ghostRun;
      }
      g.particles.burst(W / 2, 120, { count: 40, shape: 'star', speed: 320, size: 16 });
      g.finish({
        win: true, time, medal, stars: medal ? { gold: 3, silver: 2, bronze: 1 }[medal] : 0,
        title: medal ? 'Finished!' : 'You made it!',
        lines: [
          'Time: ' + time.toFixed(2) + ' s',
          medal ? '' : 'Medal at ' + (par * 1.45 * slack).toFixed(1) + ' s — try turbo + cool arrows!',
          stats.perfect ? 'Perfect landings: ' + stats.perfect : '',
        ].filter(Boolean),
        next: true, delay: 1300,
      });
      setTimeout(() => checkUnlocks(g), 1500);
    }
    // keep rolling after the finish line
    if (finished) b.v = Math.max(0, b.v - 300 * dt);
  }

  function estimatePar() { return (T.finish - 300) / 440 + 2; }

  function follow(dt) {
    const target = math.clamp(bike.x - 300, 0, T.length - W);
    camX += (target - camX) * Math.min(1, dt * 10);
  }

  // ---------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------
  function drawBg(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, TRACK_TOP);
    sky.addColorStop(0, theme.sky[0]); sky.addColorStop(1, theme.sky[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    // far hills (slow), near hills (faster) — parallax
    for (const [speed, color, y0, amp, wl] of [[0.15, theme.hill2, 250, 60, 420], [0.3, theme.hill, 290, 40, 300]]) {
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 20) {
        const wx = x + camX * speed;
        ctx.lineTo(x, y0 - Math.abs(Math.sin(wx / wl)) * amp - Math.sin(wx / (wl * 0.37)) * amp * 0.25);
      }
      ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.stroke();
    }
    // grandstands with a cheering crowd
    const sp = 0.6, sw = 360;
    for (let i = Math.floor(camX * sp / sw) - 1; i < Math.floor((camX * sp + W) / sw) + 1; i++) {
      const x = i * sw - camX * sp;
      if (i % 3 === 2) continue; // gaps between stands
      D.box(ctx, x + 10, 300, sw - 40, 62, 8, '#fff', 4);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 15; c++) {
        const hue = ((i * 31 + r * 7 + c * 13) * 47) % 360;
        const bob = Math.sin(performance.now() / 180 + c + r * 2 + i) * (finished ? 4 : 1.5);
        ctx.fillStyle = `hsl(${hue} 75% 62%)`;
        ctx.beginPath(); ctx.arc(x + 28 + c * 20, 316 + r * 16 + bob, 6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#ef476f'; ctx.fillRect(x + 10, 292, sw - 40, 10);
      ctx.lineWidth = 4; ctx.strokeStyle = '#2b2b2b'; ctx.strokeRect(x + 10, 292, sw - 40, 10);
    }
    // fence
    ctx.fillStyle = '#fff'; ctx.fillRect(0, TRACK_TOP - 12, W, 8);
    for (let x = -((camX) % 40); x < W; x += 40) ctx.fillRect(x, TRACK_TOP - 20, 6, 20);
  }

  function drawTrack(ctx) {
    // ground below and the dirt track
    ctx.fillStyle = theme.ground; ctx.fillRect(0, TRACK_BOT, W, H - TRACK_BOT);
    ctx.fillStyle = theme.dirt; ctx.fillRect(0, TRACK_TOP, W, TRACK_BOT - TRACK_TOP);
    ctx.lineWidth = 4; ctx.strokeStyle = '#2b2b2b';
    ctx.beginPath(); ctx.moveTo(0, TRACK_TOP); ctx.lineTo(W, TRACK_TOP); ctx.moveTo(0, TRACK_BOT); ctx.lineTo(W, TRACK_BOT); ctx.stroke();
    // lane lines
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3; ctx.setLineDash([26, 22]);
    ctx.lineDashOffset = camX;
    for (let l = 0; l < 3; l++) { const y = laneY(l) + LANE_GAP / 2; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.setLineDash([]);

    // start & finish lines
    for (const [wx, big] of [[300, false], [T.finish, true]]) {
      const x = wx - camX;
      if (x < -60 || x > W + 60) continue;
      for (let r = 0; r < 12; r++) { ctx.fillStyle = r % 2 ? '#fff' : '#2b2b2b'; ctx.fillRect(x - 6 + (r % 2) * 6, TRACK_TOP + r * ((TRACK_BOT - TRACK_TOP) / 12), 6, (TRACK_BOT - TRACK_TOP) / 12); }
      if (big) {
        ctx.fillStyle = '#2b2b2b'; ctx.fillRect(x - 4, TRACK_TOP - 150, 8, 150);
        for (let c = 0; c < 8; c++) for (let r = 0; r < 3; r++) { ctx.fillStyle = (c + r) % 2 ? '#fff' : '#2b2b2b'; ctx.fillRect(x + c * 12, TRACK_TOP - 150 + r * 12, 12, 12); }
        ctx.lineWidth = 4; ctx.strokeStyle = '#2b2b2b'; ctx.strokeRect(x, TRACK_TOP - 150, 96, 36);
      }
    }

    // features
    for (const f of T.feats) {
      if (f.end < camX - 50 || f.x > camX + W + 50) continue;
      const x0 = f.x - camX, x1 = f.end - camX;
      if (f.kind === 'mud') {
        ctx.fillStyle = '#6d4526';
        D.rr(ctx, x0, laneY(f.lane) - 12, x1 - x0, 24, 12); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        for (let x = x0 + 20; x < x1 - 20; x += 50) { ctx.beginPath(); ctx.ellipse(x, laneY(f.lane) - 4, 10, 4, 0, 0, Math.PI * 2); ctx.fill(); }
      } else if (f.kind === 'arrows') {
        for (let x = x0 + 10; x < x1 - 20; x += 32) {
          const y = laneY(f.lane);
          ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x + 16, y); ctx.lineTo(x, y + 12); ctx.lineTo(x + 8, y);
          ctx.closePath(); ctx.fillStyle = '#8ecae6'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#2b2b2b'; ctx.stroke();
        }
      } else if (f.kind === 'log') {
        const y = laneY(f.lane);
        D.box(ctx, x0 + 4, y - f.h - 2, x1 - x0 - 8, f.h + 10, 12, '#8b5a2b', 4);
        ctx.strokeStyle = '#5e3a17'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x0 + 16, y - f.h / 2 + 3); ctx.lineTo(x1 - 16, y - f.h / 2 + 3); ctx.stroke();
      } else if (f.kind === 'ramp') {
        // Each straight piece of the ramp is a slanted panel from the back of the
        // track to the front: up-slopes light, down-slopes darker, tops in between.
        const top = TRACK_TOP + 2, bot = TRACK_BOT - 2;
        ctx.lineWidth = 4; ctx.strokeStyle = '#2b2b2b'; ctx.lineJoin = 'round';
        for (let i = 1; i < f.pts.length; i++) {
          const [ax, ah] = f.pts[i - 1], [bx, bh] = f.pts[i];
          if (ah === 0 && bh === 0) continue;
          const x1 = ax - camX, x2 = bx - camX;
          ctx.beginPath();
          ctx.moveTo(x1, top - ah); ctx.lineTo(x2, top - bh); ctx.lineTo(x2, bot - bh); ctx.lineTo(x1, bot - ah); ctx.closePath();
          ctx.fillStyle = bh > ah ? theme.ramp : bh < ah ? theme.face : shade(theme.ramp);
          ctx.fill(); ctx.stroke();
          // front face of this piece
          ctx.beginPath();
          ctx.moveTo(x1, bot - ah); ctx.lineTo(x2, bot - bh); ctx.lineTo(x2, bot); ctx.lineTo(x1, bot); ctx.closePath();
          ctx.fillStyle = '#7a4a2a'; ctx.fill(); ctx.stroke();
        }
      }
    }
  }

  // a slightly darker version of a #rrggbb color
  function shade(hex) {
    const n = parseInt(hex.slice(1), 16);
    const f = c => Math.round(c * 0.88);
    return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')';
  }

  // The bike + rider, drawn around the point between the wheels on the ground.
  function drawBike(ctx, x, y, angle, color, opts = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-angle + (opts.spin || 0));
    if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
    ctx.scale(1.25, 1.25);
    const L = 3.5;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // wheels with spinning spokes
    for (const wx of [-21, 21]) {
      D.circle(ctx, wx, -12, 12, '#3a3a3a', L);
      D.circle(ctx, wx, -12, 6, '#ddd', 2.5);
      ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 2;
      for (let k = 0; k < 3; k++) {
        const a = (opts.wheel || 0) + k * Math.PI / 3;
        ctx.beginPath(); ctx.moveTo(wx + Math.cos(a) * 6, -12 + Math.sin(a) * 6); ctx.lineTo(wx - Math.cos(a) * 6, -12 - Math.sin(a) * 6); ctx.stroke();
      }
    }
    // frame & body
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = L;
    ctx.beginPath(); ctx.moveTo(-21, -12); ctx.lineTo(-6, -24); ctx.lineTo(10, -24); ctx.lineTo(21, -12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, -24); ctx.lineTo(16, -36); ctx.stroke();
    D.rr(ctx, -16, -32, 30, 12, 6); ctx.fillStyle = color; ctx.fill(); ctx.stroke();
    D.rr(ctx, -20, -34, 16, 6, 3); ctx.fillStyle = '#2b2b2b'; ctx.fill(); // seat
    // rider (leans forward/back)
    const lean = opts.lean || 0;
    const hx = 4 + lean * 7, hy = -58 + Math.abs(lean) * 3;
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(-8, -32); ctx.lineTo(hx - 4, hy + 12); ctx.stroke();       // body
    ctx.strokeStyle = color; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-8, -32); ctx.lineTo(hx - 4, hy + 12); ctx.stroke();
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(hx - 3, hy + 14); ctx.lineTo(16, -37); ctx.stroke();         // arm
    ctx.beginPath(); ctx.moveTo(-8, -32); ctx.lineTo(2, -22); ctx.lineTo(0, -16); ctx.stroke(); // leg
    D.circle(ctx, hx, hy, 9, color, L);                                                       // helmet
    D.rr(ctx, hx + 1, hy - 4, 9, 6, 3); ctx.fillStyle = '#bde0fe'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); // visor
    ctx.restore();
  }

  function drawHUD(g, ctx) {
    // progress bar (left), timer (middle), heat meter (right)
    const px = 110, pw = 260, py = 26;
    D.box(ctx, px, py, pw, 14, 7, '#fff', 4);
    const prog = x => math.clamp((x - 300) / (T.finish - 300), 0, 1);
    if (ghost) {
      const gf = ghost[Math.min(ghost.length - 1, Math.floor(raceTime * 30))];
      if (gf) D.circle(ctx, px + pw * prog(gf[0]), py + 7, 8, 'rgba(255,255,255,0.8)', 3);
    }
    D.circle(ctx, px + pw * prog(bike.x), py + 7, 10, bikeDef.color, 3);
    D.star(ctx, px + pw + 14, py + 7, 12, '#ffd166', 3);

    D.text(ctx, raceTime.toFixed(1), W / 2, 36, { size: 38 });

    const hx = 600, hw = 220;
    const hot = bike.heat > 0.75 || bike.over > 0;
    const flash = bike.over > 0 && Math.floor(g.time * 8) % 2;
    D.meter(ctx, hx, 22, hw, 24, bike.heat, hot ? (flash ? '#fff' : '#ef476f') : bike.heat > 0.5 ? '#ff8c42' : '#ffd166');
    // little flame icon
    ctx.beginPath(); ctx.moveTo(hx - 22, 46); ctx.quadraticCurveTo(hx - 36, 30, hx - 22, 14); ctx.quadraticCurveTo(hx - 20, 28, hx - 12, 26);
    ctx.quadraticCurveTo(hx - 4, 38, hx - 22, 46); ctx.fillStyle = '#ff8c42'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#2b2b2b'; ctx.stroke();

    // speed dial-ish bar under the timer
    D.meter(ctx, W / 2 - 70, 62, 140, 10, bike.v / 700, '#06d6a0');
  }

  function render(g, ctx) {
    if (!T) { ctx.fillStyle = '#8fd3ff'; ctx.fillRect(0, 0, W, H); return; }
    drawBg(ctx);
    drawTrack(ctx);

    // ghost of your best run
    if (ghost && countdown <= 0) {
      const gf = ghost[Math.min(ghost.length - 1, Math.floor(raceTime * 30))];
      if (gf) drawBike(ctx, gf[0] - camX, laneY(gf[3] / 100) - gf[1], gf[2] / 100, '#ffffff', { alpha: 0.35 });
    }
    const b = bike;
    // shadow on the ground under a flying bike
    const gy = laneY(b.laneF) - groundH(T, b.x, b.lane);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(b.x - camX, gy, Math.max(10, 34 - (b.h - groundH(T, b.x, b.lane)) * 0.1), 6, 0, 0, Math.PI * 2); ctx.fill();

    drawBike(ctx, b.x - camX, laneY(b.laneF) - b.h, b.angle, bikeDef.color, { wheel: b.wheel, lean: b.lean, spin: b.crash > 0 ? b.crashSpin : 0 });
    if (b.crash > 0) { // dizzy stars
      for (let i = 0; i < 3; i++) {
        const a = g.time * 6 + i * 2.1;
        D.star(ctx, b.x - camX + Math.cos(a) * 26, laneY(b.laneF) - b.h - 80 + Math.sin(a) * 8, 9, '#ffd166', 2);
      }
    }

    for (const p of popups) D.text(ctx, p.text, p.x, p.y, { size: 30, color: p.color });
    drawHUD(g, ctx);

    if (countdown > 0) {
      const n = Math.ceil(countdown - 0.2);
      D.text(ctx, n >= 1 ? String(n) : 'GO!', W / 2, H / 2 - 60, { size: 110, color: n >= 1 ? '#ffd166' : '#06d6a0' });
    }
  }

  // ---------------------------------------------------------------
  // Menus: level tiles, bike picker, and the track builder
  // ---------------------------------------------------------------
  function trackPic(theme) {
    const t = THEMES[theme];
    return `<svg viewBox="0 0 120 70"><rect width="120" height="70" fill="${t.sky[0]}"/><path d="M0 46 L40 46 L60 26 L80 46 L120 46 V70 H0 Z" fill="${t.ramp}" stroke="#2b2b2b" stroke-width="3"/><rect y="56" width="120" height="14" fill="${t.dirt}"/></svg>`;
  }

  function levels(g) {
    const list = TRACKS.map((t, i) => {
      const prev = i === 0 || (g.save.levels[TRACKS[i - 1].id] || {}).done;
      const rec = g.save.levels[t.id] || {};
      return { ...t, pic: trackPic(t.theme), locked: !prev,
        meta: rec.time ? (rec.medal ? Arcade.icons.medal(rec.medal).replace('<svg', '<svg style="width:24px;height:24px;vertical-align:middle"') : '') + ' ' + rec.time.toFixed(1) + 's' : '' };
    });
    const custom = g.save.data.custom;
    if (custom && custom.pieces && custom.pieces.length) list.push({ id: 'custom', name: 'My Track', theme: custom.theme, pieces: custom.pieces, pic: trackPic(custom.theme), meta: '' });
    return list;
  }

  function extraMenu(g) {
    const wrap = Arcade.h('div');
    wrap.appendChild(Arcade.h('h2', { class: 'ar-title', style: 'font-size:24px;margin-top:16px' }, 'Pick your bike'));
    const row = Arcade.h('div', { class: 'ar-grid' });
    const current = pickedBike(g).id;
    for (const b of BIKES) {
      const ok = bikeUnlocked(g, b);
      const tile = Arcade.h('button', { type: 'button', class: 'ar-tile' + (ok ? '' : ' locked') + (b.id === current ? ' picked' : '') },
        `<div class="pic">${bikeIcon(b.color)}</div><div>${b.name}</div><div class="meta">${ok ? bikeStats(b) : b.need}</div>` + (ok ? '' : `<div class="lock">${icons.lock}</div>`));
      tile.addEventListener('click', () => {
        if (!ok) { Arcade.sfx('bonk'); return; }
        Arcade.sfx('click');
        g.save.data.bike = b.id; g.store();
        row.querySelectorAll('.ar-tile').forEach(t => t.classList.remove('picked'));
        tile.classList.add('picked');
      });
      row.appendChild(tile);
    }
    wrap.appendChild(row);
    const btns = Arcade.h('div', { class: 'ar-btns' });
    const build = Arcade.h('button', { class: 'ar-btn pink', type: 'button' }, `${toolIcon()}<span>Build a track</span>`);
    build.addEventListener('click', () => { Arcade.sfx('click'); openEditor(g); });
    btns.appendChild(build);
    wrap.appendChild(btns);
    return wrap;
  }
  function bikeStats(b) {
    const bits = [];
    if (b.heat < 1) bits.push('cooler');
    if (b.top > 1.01) bits.push('faster');
    if (b.land > 0.1) bits.push('easy landings');
    return bits.join(', ') || 'all-round';
  }
  function bikeIcon(color) {
    return `<svg viewBox="0 0 100 70"><circle cx="24" cy="50" r="14" fill="#3a3a3a" stroke="#2b2b2b" stroke-width="4"/><circle cx="76" cy="50" r="14" fill="#3a3a3a" stroke="#2b2b2b" stroke-width="4"/><path d="M24 50 L40 32 H62 L76 50" fill="none" stroke="#2b2b2b" stroke-width="5" stroke-linejoin="round"/><rect x="30" y="24" width="38" height="14" rx="7" fill="${color}" stroke="#2b2b2b" stroke-width="4"/><circle cx="52" cy="12" r="9" fill="${color}" stroke="#2b2b2b" stroke-width="4"/></svg>`;
  }
  function toolIcon() {
    return `<svg viewBox="0 0 48 48"><path d="M8 40 L24 24" stroke="#2b2b2b" stroke-width="7" stroke-linecap="round"/><path d="M22 14 A10 10 0 1 0 34 26 L28 26 L22 20 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/></svg>`;
  }

  // ---- Track builder: 8 slots, tap a slot to change its piece ----
  const BUILD_PIECES = ['flat', 'small', 'big', 'kicker', 'table', 'double', 'bumps', 'mud', 'arrows', 'logs'];
  function pieceIcon(name) {
    const p = PIECES[name];
    let inner = '';
    if (p.ramp) {
      const maxX = p.len;
      const pts = p.ramp.map(([x, h]) => `${8 + x / maxX * 84},${50 - h * 0.35}`).join(' ');
      inner = `<polygon points="8,50 ${pts} 92,50" fill="#e0a465" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/>`;
    }
    if (p.mud) inner = `<ellipse cx="50" cy="44" rx="38" ry="9" fill="#6d4526" stroke="#2b2b2b" stroke-width="3"/>`;
    if (p.arrows) inner = [20, 42, 64].map(x => `<path d="M${x} 36 L${x + 14} 44 L${x} 52 L${x + 6} 44 Z" fill="#8ecae6" stroke="#2b2b2b" stroke-width="2.5"/>`).join('');
    if (p.logs) inner = `<rect x="30" y="36" width="40" height="14" rx="7" fill="#8b5a2b" stroke="#2b2b2b" stroke-width="3"/>`;
    if (name === 'flat') inner = '';
    return `<svg viewBox="0 0 100 60"><rect x="0" y="50" width="100" height="10" fill="#c98b4f"/>${inner}</svg>`;
  }
  function openEditor(g) {
    const saved = g.save.data.custom || { pieces: ['small', 'flat', 'big', 'arrows', 'table', 'mud', 'kicker', 'flat'], theme: 'meadow' };
    const pieces = saved.pieces.slice(0, 8);
    while (pieces.length < 8) pieces.push('flat');
    let themeName = saved.theme || 'meadow';
    const p = Arcade.h('div', { class: 'ar-panel wide' });
    p.appendChild(Arcade.h('h1', { class: 'ar-title' }, 'Build a track'));
    p.appendChild(Arcade.h('p', { class: 'ar-sub' }, 'Tap a box to change it. Then race!'));
    const grid = Arcade.h('div', { class: 'ar-grid', style: 'grid-template-columns:repeat(auto-fill,minmax(110px,1fr))' });
    pieces.forEach((name, i) => {
      const tile = Arcade.h('button', { type: 'button', class: 'ar-tile', style: 'min-height:100px' });
      const paint = () => { tile.innerHTML = `<div class="pic">${pieceIcon(pieces[i])}</div><div style="font-size:14px">${PIECES[pieces[i]].name}</div>`; };
      paint();
      tile.addEventListener('click', () => {
        Arcade.sfx('pop');
        pieces[i] = BUILD_PIECES[(BUILD_PIECES.indexOf(pieces[i]) + 1) % BUILD_PIECES.length];
        paint();
      });
      grid.appendChild(tile);
    });
    p.appendChild(grid);
    // track colors (night unlocks after the last track)
    const themes = ['meadow', 'desert', 'forest', 'snow', 'volcano'].concat(g.isUnlocked('theme-night') ? ['night'] : []);
    const trow = Arcade.h('div', { class: 'ar-btns' });
    for (const t of themes) {
      const b = Arcade.h('button', { type: 'button', class: 'ar-tile' + (t === themeName ? ' picked' : ''), style: 'min-height:70px;width:100px;padding:4px' }, `<div class="pic" style="height:50px">${trackPic(t)}</div>`);
      b.addEventListener('click', () => { Arcade.sfx('click'); themeName = t; trow.querySelectorAll('.ar-tile').forEach(x => x.classList.toggle('picked', x === b)); });
      trow.appendChild(b);
    }
    p.appendChild(trow);
    const btns = Arcade.h('div', { class: 'ar-btns' });
    const race = Arcade.h('button', { type: 'button', class: 'ar-btn big' }, `${icons.play}<span>Race it!</span>`);
    race.addEventListener('click', () => {
      Arcade.sfx('click');
      g.save.data.custom = { pieces: pieces.slice(), theme: themeName };
      g.store();
      g.play({ id: 'custom', name: 'My Track', theme: themeName, pieces: pieces.filter(x => x) });
    });
    const back = Arcade.h('button', { type: 'button', class: 'ar-btn white' }, `${icons.menu}<span>Levels</span>`);
    back.addEventListener('click', () => { Arcade.sfx('click'); g.menu(); });
    btns.append(race, back);
    p.appendChild(btns);
    g.panel(p);
  }

  // ---------------------------------------------------------------
  // Start the game
  // ---------------------------------------------------------------
  const S = (inner) => `<svg viewBox="0 0 80 80">${inner}</svg>`;
  Arcade.start({
    id: 'bike',
    title: 'Turbo Bike Challenge',
    view: { w: W, h: H },
    background: '#8fd3ff',
    music: 'race',
    levelsTitle: 'Pick a track',
    howTo: [
      { pic: S(`<path d="M10 40 H60" stroke="#2b2b2b" stroke-width="8" stroke-linecap="round"/><path d="M48 24 L66 40 L48 56" fill="none" stroke="#06d6a0" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`), text: 'Go!', keys: 'Right arrow / green button' },
      { pic: S(`<path d="M8 50 L30 30 H70" fill="none" stroke="#ff8c42" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><rect x="18" y="58" width="44" height="12" rx="6" fill="#ef476f" stroke="#2b2b2b" stroke-width="3"/>`), text: 'Turbo! Watch the heat', keys: 'Space / orange button' },
      { pic: S(`<path d="M20 30 L40 12 L60 30 M20 50 L40 68 L60 50" fill="none" stroke="#2b2b2b" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`), text: 'Change lanes', keys: 'Up / Down' },
      { pic: S(`<path d="M10 66 L40 30 L70 66 Z" fill="#e0a465" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><path d="M26 20 Q40 6 56 18" fill="none" stroke="#118ab2" stroke-width="5" stroke-linecap="round"/><path d="M50 12 L57 19 L48 22" fill="none" stroke="#118ab2" stroke-width="5" stroke-linecap="round"/>`), text: 'In the air: tilt to land flat on the ramp', keys: 'Left / Right' },
      { pic: S([18, 38, 58].map(x => `<path d="M${x} 28 L${x + 16} 40 L${x} 52 L${x + 6} 40 Z" fill="#8ecae6" stroke="#2b2b2b" stroke-width="3"/>`).join('')), text: 'Blue arrows cool your engine' },
    ],
    buttons: {
      left: [{ id: 'ArrowUp', icon: icons.up, label: 'Lane up' }, { id: 'ArrowDown', icon: icons.down, label: 'Lane down' }],
      right: [{ id: 'ArrowLeft', icon: icons.brake, label: 'Brake / lean back' }, { id: 'Space', icon: icons.turbo, label: 'Turbo' }, { id: 'ArrowRight', icon: icons.gas, label: 'Gas / lean forward' }],
    },
    levels,
    extraMenu,
    setup,
    update,
    draw: render,
  });
})();
