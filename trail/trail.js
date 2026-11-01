// =====================================================================
// Treasure Trail — a jungle explorer adventure, one screen at a time.
//
// How it works:
//  * Each adventure is a row of ROOMS (one screen each). Run off the right
//    edge to go to the next room, off the left edge to go back.
//  * Every room has one thing to get past, picked from ROOM TYPES below:
//      vine      swing on a vine over a pond (jump to grab, jump to let go)
//      hippos    hop across the backs of hippos (they dip under now and then)
//      sand      quicksand that opens and closes (wait, or swing over)
//      logs      logs roll toward you: jump over them
//      snake     a sleepy snake on the path: jump over it
//      ladder    a trapdoor: climb down to a tunnel with treasure, then back up
//      treasure  a treasure lying on the path (easy!)
//      camp      the end: reach the tent!
//  * Falling in the water / quicksand costs a heart and puts you back at the
//    start of the room. Logs, snakes and bats only bump you back (no heart).
//  * Collect the treasures for medals. On Easy you can never lose.
//  * Rooms are drawn as a cut-away: the jungle path on top, a tunnel below.
// =====================================================================
(function () {
  const { draw, icons, math } = Arcade;
  const D = draw;
  const INK = D.INK;
  const W = 960, H = 540;
  const GROUND = 360;            // top of the jungle path
  const TUNNEL = 505;            // floor of the tunnel underneath
  const PW = 34, PH = 56;        // explorer hit box
  const PHYS = { run: 280, accel: 2000, airAccel: 1200, jumpV: 800, grav: 2300, maxFall: 950, climb: 190 };

  // ---------------------------------------------------------------
  // ADVENTURES: each is a list of room types (left to right).
  // Edit these to make new adventures!
  // ---------------------------------------------------------------
  const ADVENTURES = [
    { id: 'river',  name: 'River Run',      theme: 'river',
      rooms: ['start', 'snake', 'vine', 'treasure', 'logs', 'hippos', 'ladder', 'camp'] },
    { id: 'deep',   name: 'Deep Jungle',    theme: 'deep',
      rooms: ['start', 'logs', 'sand', 'ladder', 'vine', 'snake', 'hippos', 'treasure', 'sandvine', 'camp'] },
    { id: 'temple', name: 'Lost Temple',    theme: 'temple',
      rooms: ['start', 'vine', 'ladder', 'hippos', 'logs', 'sandvine', 'treasure', 'snake', 'hippos', 'ladder', 'vine', 'camp'] },
    { id: 'dusk',   name: 'Sunset Swamp',   theme: 'dusk',
      rooms: ['start', 'hippos', 'sandvine', 'ladder', 'logs', 'vine', 'sand', 'treasure', 'hippos', 'ladder', 'snake', 'vine', 'camp'] },
  ];

  const THEMES = {
    river:  { sky: ['#9ee6ff', '#e6fbff'], far: '#7cc47a', leaf: '#3f9e4a', leaf2: '#5cbf60', trunk: '#8b5a2b', grass: '#6cc04a', dirt: '#b9783f', deep: '#7a4a24', water: '#3aa7e0', tunnel: '#4a2f1a', brick: '#8a5a3a' },
    deep:   { sky: ['#6fcf97', '#c8f7d8'], far: '#2f8f55', leaf: '#1f6f3a', leaf2: '#2fa35a', trunk: '#6b4226', grass: '#4caf50', dirt: '#8d5a32', deep: '#5e3a1e', water: '#2a9d8f', tunnel: '#3a2414', brick: '#7a4a2a' },
    temple: { sky: ['#ffd8a8', '#fff3e0'], far: '#b5a17a', leaf: '#4f8a3a', leaf2: '#6fae4a', trunk: '#7a5236', grass: '#8bc34a', dirt: '#c9a06b', deep: '#9a7448', water: '#4cc9f0', tunnel: '#5a4630', brick: '#a68a64' },
    dusk:   { sky: ['#ff9eb5', '#ffd6a5'], far: '#7a5a8a', leaf: '#3b5f4a', leaf2: '#4f7a5a', trunk: '#5a3a2a', grass: '#6a9a50', dirt: '#8a5a44', deep: '#5a3a30', water: '#7b6fd6', tunnel: '#3a2430', brick: '#7a4a5a' },
  };
  const TREASURES = ['gem', 'crown', 'coins', 'goldbar', 'ring'];

  // ---------------------------------------------------------------
  // Building a room from its type
  // ---------------------------------------------------------------
  function buildRoom(type, index, diff) {
    const R = { type, gaps: [], vines: [], hippos: [], logs: [], snakes: [], bats: [], treasures: [], ladder: null, sand: null, pond: null, camp: null };
    const tr = (x, y) => R.treasures.push({ x, y, kind: TREASURES[index % TREASURES.length], got: false });
    if (type === 'vine' || type === 'sandvine') {
      const x0 = 300, x1 = 660;
      if (type === 'vine') { R.pond = { x0, x1 }; R.gaps.push([x0, x1]); }
      else { R.sand = { x0: 290, x1: 670, open: 0 }; }
      R.vines.push({ px: 480, py: 66, L: 214, A: diff.vineA, w: diff.vineW, ph: index * 1.3, cool: 0 });
      if (type === 'vine') tr(480, 262);                  // a treasure hangs over the pond: grab it while swinging!
    } else if (type === 'hippos') {
      // (spaced one running jump apart: bank -> hippo -> hippo -> bank)
      const x0 = 250, x1 = 690;
      R.pond = { x0, x1 }; R.gaps.push([x0, x1]);
      for (let k = 0; k < 2; k++) R.hippos.push({ cx: 420 + k * 180, ph: k * 1.9 + index, up: 1 });
    } else if (type === 'sand') {
      R.sand = { x0: 330, x1: 630, open: 0 };
    } else if (type === 'logs') {
      for (let k = 0; k < diff.logs; k++) R.logs.push({ x: 980 + k * 420, a: 0 });
    } else if (type === 'snake') {
      R.snakes.push({ x: 470 }); R.snakes.push({ x: 720 });
    } else if (type === 'ladder') {
      R.ladder = { x: 480 };
      tr(820, TUNNEL - 40);
      R.bats.push({ x: 300, y: 450, ph: index });
    } else if (type === 'treasure') {
      tr(600, GROUND - 40);
      R.snakes.push({ x: 380 });
    } else if (type === 'camp') {
      R.camp = { x: 720 };
    }
    return R;
  }

  // ---------------------------------------------------------------
  // Game state
  // ---------------------------------------------------------------
  let adv, theme, rooms, roomI, room, p, hearts, maxHearts, tries, got, total, finished, time, popups, fx, diff, entryX, resume = null;

  function newPlayer(x, y) {
    return { x, y, w: PW, h: PH, vx: 0, vy: 0, onGround: true, face: 1, mode: 'walk', vine: null, stun: 0, invuln: 0, dead: 0, run: 0, climbT: 0, splash: null };
  }

  function setup(g, level) {
    adv = level || ADVENTURES[0];
    theme = THEMES[adv.theme];
    diff = {
      vineA: g.pick(0.85, 0.85, 0.9), vineW: g.pick(1.4, 1.7, 2.0), grab: g.pick(60, 48, 42),   // the vine swings right over each bank
      logs: g.pick(1, 2, 3), logSpeed: g.pick(120, 170, 220),
      hippoDip: g.pick(false, true, true), hippoUp: g.pick(1, 2.6, 2.1),
      sandOpen: g.pick(1.2, 2, 2.4), sandCycle: g.pick(5, 4.5, 4),
    };
    rooms = adv.rooms.map((t, i) => buildRoom(t, i, diff));
    total = rooms.reduce((n, r) => n + r.treasures.length, 0);
    maxHearts = g.pick(5, 3, 3); hearts = maxHearts; tries = g.pick(Infinity, 3, 2);
    got = 0; finished = false; time = 0; popups = []; fx = new Arcade.Particles();
    roomI = 0; entryX = 60;
    if (resume && resume.id === adv.id) {
      roomI = resume.room; entryX = 60;
      resume.got.forEach(([ri, ti]) => { rooms[ri].treasures[ti].got = true; got++; });
      time = resume.time;
    }
    resume = null;
    room = rooms[roomI];
    p = newPlayer(entryX, GROUND - PH);

    // ---- hooks for automated tests ----
    window.__trailState = () => ({
      room: roomI, rooms: rooms.length, type: room.type, x: p.x, y: p.y, vx: p.vx, vy: p.vy, mode: p.mode, onGround: p.onGround,
      hearts, tries, got, total, finished, time, dead: p.dead > 0,
    });
    window.__trailTest = {
      room: () => room, player: () => p, rooms: () => rooms,
      goRoom(i) { enterRoom(i, 60); },
      vineTip: (v) => vineTip(v, time),
      hippoUp: (h) => hippoUp(h, time), sandOpen: () => sandOpen(room, time),
    };
  }

  function enterRoom(i, x) {
    roomI = i; room = rooms[i]; entryX = x;
    p.x = x; p.y = GROUND - PH; p.vx = Math.sign(p.vx) * Math.min(Math.abs(p.vx), PHYS.run); p.vy = 0;
    p.mode = 'walk'; p.vine = null; p.onGround = true;
  }

  // ---------------------------------------------------------------
  // Moving things: all pure functions of time, so they're easy to test
  // ---------------------------------------------------------------
  function vineAngle(v, t) { return v.A * Math.sin(t * v.w + v.ph); }
  function vineTip(v, t) {
    const a = vineAngle(v, t), da = v.A * v.w * Math.cos(t * v.w + v.ph);
    return { x: v.px + Math.sin(a) * v.L, y: v.py + Math.cos(a) * v.L, vx: Math.cos(a) * v.L * da, vy: -Math.sin(a) * v.L * da, a };
  }
  // hippos: up for a while, then a slow dip under the water (not on Easy)
  function hippoUp(h, t) {
    if (!diff.hippoDip) return 1;
    const cyc = diff.hippoUp + 1.6, k = ((t + h.ph) % cyc + cyc) % cyc;
    if (k < diff.hippoUp) return 1;                       // up: safe to stand on
    const d = k - diff.hippoUp;                           // 0 .. 1.6 : going down then coming back
    return d < 0.4 ? 1 - d / 0.4 : d > 1.2 ? (d - 1.2) / 0.4 : 0;
  }
  // quicksand: how wide open it is (0 = closed, safe ground)
  function sandOpen(r, t) {
    if (!r.sand) return 0;
    const k = (t % diff.sandCycle) / diff.sandCycle, openFrac = diff.sandOpen / diff.sandCycle;
    if (k > openFrac) return 0;
    const e = k / openFrac;                               // 0..1 while open
    return Math.min(1, Math.sin(e * Math.PI) * 1.6);
  }
  function sandSpan(r, t) {
    const o = sandOpen(r, t); if (o <= 0.05) return null;
    const c = (r.sand.x0 + r.sand.x1) / 2, hw = (r.sand.x1 - r.sand.x0) / 2 * o;
    return [c - hw, c + hw];
  }

  // Is there ground under x on the jungle path right now?
  function groundAt(x, t) {
    for (const [a, b] of room.gaps) if (x > a && x < b) {
      // standing on a hippo's back?
      for (const h of room.hippos) if (hippoUp(h, t) > 0.6 && Math.abs(x - h.cx) < 44) return true;
      return false;
    }
    const s = sandSpan(room, t);
    if (s && x > s[0] && x < s[1]) return false;
    return true;
  }

  // ---------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------
  function popup(text, x, y, color = '#ffd166') { popups.push({ text, x, y, t: 0, color }); }

  function update(g, dt) {
    const inp = g.input;
    if (!finished) time += dt;
    fx.update(dt);
    for (const q of popups) { q.t += dt; q.y -= 40 * dt; }
    popups = popups.filter(q => q.t < 1.1);
    // logs roll and wrap around; bats flap back and forth
    for (const l of room.logs) { l.x -= diff.logSpeed * dt; l.a -= diff.logSpeed * dt / 22; if (l.x < -60) l.x += 1100; }
    for (const b of room.bats) { b.x = 480 + Math.sin(time * 0.9 + b.ph) * 360; b.y = 450 + Math.sin(time * 3 + b.ph) * 14; }
    if (room.sand) room.sand.open = sandOpen(room, time);

    if (p.dead > 0) {                                   // splashed / sank: back to the start of the room
      p.dead -= dt;
      if (p.dead <= 0) {
        Object.assign(p, newPlayer(entryX, GROUND - PH)); p.invuln = 1.2; p.face = entryX < W / 2 ? 1 : -1;
        fx.burst(p.x + PW / 2, p.y + PH / 2, { count: 16, shape: 'star', speed: 200, size: 11, gravity: 0, life: 0.6 });
        g.sfx('pop');
      }
      return;
    }
    if (finished) { p.vx = 0; return; }

    const dir = (inp.down('ArrowRight', 'KeyD') ? 1 : 0) - (inp.down('ArrowLeft', 'KeyA') ? 1 : 0);
    const up = inp.down('ArrowUp', 'KeyW'), down = inp.down('ArrowDown', 'KeyS');
    // jump: Space (or Up, unless you're standing at a ladder)
    const nearLadder = room.ladder && Math.abs(p.x + PW / 2 - room.ladder.x) < 30;
    const upHit = inp.hit('ArrowUp', 'KeyW');
    const jump = inp.hit('Space') || (upHit && !nearLadder);
    if (p.invuln > 0) p.invuln -= dt;
    if (p.stun > 0) p.stun -= dt;

    // ---------- on a vine: swing! ----------
    if (p.mode === 'vine') {
      const tip = vineTip(p.vine, time);
      p.x = tip.x - PW / 2; p.y = tip.y - 14; p.face = tip.vx >= 0 ? 1 : -1;
      if (jump) {                                         // let go: fly off with the vine's speed
        p.mode = 'walk'; p.onGround = false;
        p.vx = math.clamp(tip.vx * 1.3 + dir * 80, -560, 560); p.vy = Math.min(tip.vy, 0) - 520;
        if (Math.abs(p.vx) < 440 && Math.abs(tip.vx) > 60) p.vx = Math.sign(tip.vx) * 440;   // a good swing always reaches the far bank
        p.vine.cool = 0.5; p.vine = null;
        g.sfx('whoosh');
      }
      checkTreasure(g);
      return;
    }
    // ---------- on a ladder: climb ----------
    if (room.ladder) {
      const lx = room.ladder.x, onLadderX = Math.abs(p.x + PW / 2 - lx) < 30;
      if (p.mode !== 'ladder' && onLadderX && p.onGround) {
        const atTop = p.y + PH <= GROUND + 2, atBottom = p.y + PH >= TUNNEL - 2;
        if ((atTop && down) || (atBottom && up)) { p.mode = 'ladder'; p.x = lx - PW / 2; p.vx = 0; p.vy = 0; }
      }
      if (p.mode === 'ladder') {
        p.climbT += dt;
        p.vy = (down ? 1 : 0) * PHYS.climb - (up ? 1 : 0) * PHYS.climb;
        p.y += p.vy * dt;
        if (p.y + PH <= GROUND && up) { p.y = GROUND - PH; p.mode = 'walk'; p.onGround = true; }
        if (p.y + PH >= TUNNEL) { p.y = TUNNEL - PH; if (down) { p.mode = 'walk'; p.onGround = true; } }
        if (dir && (p.y + PH >= TUNNEL - 1 || p.y + PH <= GROUND + 1)) { p.mode = 'walk'; p.onGround = true; }
        checkTreasure(g);
        return;
      }
    }

    // ---------- walking / jumping ----------
    const target = p.stun > 0 ? 0 : dir * PHYS.run;
    if (dir) p.face = dir;
    // in the air you keep your speed (so a swing or a running jump carries you across)
    const flying = !p.onGround && (dir === 0 || p.vx * dir > PHYS.run);    // (holding the same way never slows a big swing down)
    p.vx = approach(p.vx, target, (p.onGround ? PHYS.accel : flying ? 120 : PHYS.airAccel) * dt);
    // jump, with two kid-friendly helpers:
    //  * jump buffer: pressing jump a moment BEFORE landing still jumps when you land
    //  * coyote time: you can still jump a moment AFTER running off an edge
    if (jump) p.buffer = 0.15;
    if (p.onGround) p.coyote = 0.1;
    if (p.buffer > 0 && p.coyote > 0 && p.stun <= 0) { p.vy = -PHYS.jumpV; p.onGround = false; p.buffer = 0; p.coyote = 0; g.sfx('jump'); }
    p.buffer = (p.buffer || 0) - dt; p.coyote = (p.coyote || 0) - dt;
    p.vy = Math.min(PHYS.maxFall, p.vy + PHYS.grav * dt);
    p.x += p.vx * dt;
    const prevFeet = p.y + PH;
    p.y += p.vy * dt;
    p.run += Math.abs(p.vx) * dt / 18;
    const inTunnel = !!room.ladder && prevFeet > GROUND + 20;     // (only ladder rooms have a tunnel)
    const cx = p.x + PW / 2;
    // the floor: jungle path (if there's ground here) or the tunnel floor
    p.onGround = false;
    if (!inTunnel && p.vy >= 0 && prevFeet <= GROUND + 1 && p.y + PH >= GROUND && groundAt(cx, time)) { p.y = GROUND - PH; p.vy = 0; p.onGround = true; }
    if (inTunnel && p.y + PH >= TUNNEL) { p.y = TUNNEL - PH; p.vy = 0; p.onGround = true; }
    if (inTunnel) p.x = math.clamp(p.x, 40, W - 40 - PW);    // the tunnel has walls at both ends

    // grab a vine while in the air
    for (const v of room.vines) {
      if (v.cool > 0) { v.cool -= dt; continue; }
      if (p.onGround) continue;
      const tip = vineTip(v, time);
      if (Math.hypot(cx - tip.x, p.y + 14 - tip.y) < diff.grab) { p.mode = 'vine'; p.vine = v; g.sfx('swish'); popup('Grab!', tip.x, tip.y - 30, '#06d6a0'); return; }
    }

    // fell into the water or the quicksand?
    if (!inTunnel && p.y + PH > GROUND + 40) {
      const inSand = room.sand && cx > room.sand.x0 && cx < room.sand.x1;
      lose(g, inSand ? 'sand' : 'water');
      return;
    }

    // bumps: logs, snakes, bats push you back (no hearts lost)
    if (p.invuln <= 0) {
      for (const l of room.logs) if (Math.abs(cx - l.x) < 34 && p.y + PH > GROUND - 40 && !inTunnel) bump(g, 'Oof!', -1);
      for (const s of room.snakes) if (Math.abs(cx - s.x) < 30 && p.y + PH > GROUND - 34 && !inTunnel) bump(g, 'Hiss!', cx < s.x ? -1 : 1);
      for (const b of room.bats) if (inTunnel && Math.hypot(cx - b.x, p.y + 20 - b.y) < 40) bump(g, 'Squeak!', cx < b.x ? -1 : 1);
    }

    // edges of the screen: next / previous room
    if (!inTunnel) {
      if (p.x + PW / 2 > W && roomI < rooms.length - 1) { enterRoom(roomI + 1, 10); g.sfx('tick'); }
      else if (p.x + PW / 2 < 0 && roomI > 0) { enterRoom(roomI - 1, W - PW - 10); g.sfx('tick'); }
      p.x = math.clamp(p.x, -PW / 2, W - PW / 2);
    }
    checkTreasure(g);
    if (room.camp && cx > room.camp.x - 20 && p.onGround) win(g);
  }
  const approach = (v, t, s) => v < t ? Math.min(t, v + s) : Math.max(t, v - s);

  function bump(g, word, away) {
    p.vx = away * 300; p.vy = -380; p.onGround = false; p.stun = 0.35; p.invuln = 0.6;
    g.sfx('bonk'); popup(word, p.x + PW / 2, p.y - 10, '#ffffff');
  }

  function lose(g, how) {
    p.dead = 0.9; p.splash = how;
    if (how === 'water') { g.sfx('splash'); fx.burst(p.x + PW / 2, GROUND + 50, { count: 22, colors: ['#8ecae6', '#ffffff', theme.water], speed: 260, size: 12, gravity: 500, life: 0.8 }); popup('Splash!', p.x + PW / 2, GROUND, '#8ecae6'); }
    else { g.tone(300, 0.6, { slide: 90, type: 'triangle', vol: 0.3 }); fx.burst(p.x + PW / 2, GROUND + 20, { count: 18, colors: ['#e9c46a', '#f4d58d', '#c9a06b'], speed: 160, size: 11, gravity: 300, life: 0.8 }); popup('Sinky sand!', p.x + PW / 2, GROUND - 20, '#ffd166'); }
    if (g.difficulty === 'easy') return;                  // Easy: no hearts lost
    hearts--;
    if (hearts > 0) return;
    if (tries !== Infinity) tries--;
    if (tries < 0) {
      resume = { id: adv.id, room: roomI, time, got: [] };
      rooms.forEach((r, ri) => r.treasures.forEach((t, ti) => { if (t.got) resume.got.push([ri, ti]); }));
      finished = true;
      g.finish({ win: false, title: 'Nice try!', lines: ['Treasures: ' + got + ' / ' + total, 'Again starts in this room!'], next: false, delay: 900 });
      return;
    }
    hearts = maxHearts;
  }

  function checkTreasure(g) {
    for (const t of room.treasures) {
      if (t.got || Math.abs(p.x + PW / 2 - t.x) > 38 || Math.abs(p.y + PH / 2 - t.y) > 50) continue;
      t.got = true; got++;
      g.sfx('coin'); g.sfx('star');
      fx.burst(t.x, t.y, { count: 24, shape: 'star', colors: ['#ffd166', '#fff3b0', '#ffffff'], speed: 220, size: 12, gravity: 120, life: 0.8 });
      popup('Treasure!', t.x, t.y - 40, '#ffd166');
    }
  }

  function win(g) {
    finished = true;
    const frac = total ? got / total : 1;
    const medal = frac >= 1 ? 'gold' : frac >= 0.5 ? 'silver' : 'bronze';
    g.sfx('win');
    g.particles.burst(W / 2, 140, { count: 50, shape: 'star', speed: 360, size: 16 });
    g.finish({
      win: true, medal, stars: { gold: 3, silver: 2, bronze: 1 }[medal], time: Math.round(time * 10) / 10,
      score: got * 500 + Math.max(0, Math.round(300 - time)) * 5,
      title: frac >= 1 ? 'All the treasure!' : 'You made it to camp!',
      lines: ['Treasures: ' + got + ' / ' + total, 'Time: ' + time.toFixed(1) + ' s'], next: true, delay: 1200,
    });
  }

  // ---------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------
  function render(g, ctx) {
    if (!room) { ctx.fillStyle = '#9ee6ff'; ctx.fillRect(0, 0, W, H); return; }
    const t = time;
    drawBackground(ctx, t);
    drawGround(ctx, t);
    for (const s of room.snakes) drawSnake(ctx, s, t);
    for (const l of room.logs) drawLog(ctx, l);
    for (const b of room.bats) drawBat(ctx, b, t);
    for (const tr of room.treasures) if (!tr.got) drawTreasure(ctx, tr, t);
    if (room.camp) drawCamp(ctx, room.camp, t);
    for (const v of room.vines) drawVine(ctx, v, t);
    if (p.dead <= 0 && !(p.invuln > 0 && Math.floor(p.invuln * 10) % 2 === 0 && p.stun <= 0)) drawExplorer(ctx, p, t);
    fx.draw(ctx);
    for (const q of popups) D.text(ctx, q.text, q.x, q.y, { size: 26, color: q.color });
    drawHUD(ctx);
  }

  function drawBackground(ctx, t) {
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, theme.sky[0]); sky.addColorStop(1, theme.sky[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, GROUND);
    // far bushes
    ctx.fillStyle = theme.far;
    for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc(k * 120 + ((roomI * 37) % 60), GROUND - 10, 70 + (k * 13 + roomI * 7) % 30, Math.PI, 0); ctx.fill(); }
    // temple ruins in the background
    if (adv.theme === 'temple') {
      ctx.fillStyle = 'rgba(150,120,80,0.45)';
      for (let k = 0; k < 3; k++) { const x = 120 + k * 330 + (roomI * 53) % 80; ctx.fillRect(x, GROUND - 170, 40, 170); ctx.fillRect(x - 14, GROUND - 186, 68, 20); }
    }
    // tall tree trunks with leafy tops (the jungle canopy)
    for (let k = 0; k < 5; k++) {
      const x = 60 + k * 210 + ((roomI * 71 + k * 29) % 50);
      if (room.vines.some(v => Math.abs(v.px - x) < 60)) continue;
      ctx.fillStyle = theme.trunk; ctx.fillRect(x - 14, 40, 28, GROUND - 40);
      ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(x - 14, 40, 28, GROUND - 40);
    }
    // the canopy along the top
    for (let k = 0; k < 14; k++) {
      const x = k * 76 - 20, r = 56 + ((k * 7 + roomI) % 3) * 8;
      D.circle(ctx, x, 6, r, k % 2 ? theme.leaf : theme.leaf2, 4);
    }
    // a branch for each vine
    for (const v of room.vines) { D.box(ctx, v.px - 160, v.py - 14, 320, 22, 10, theme.trunk, 4); }
  }

  function drawGround(ctx, t) {
    // underground (dirt), then the tunnel cut-away in ladder rooms
    ctx.fillStyle = theme.deep; ctx.fillRect(0, GROUND, W, H - GROUND);
    if (room.ladder) {
      ctx.fillStyle = theme.tunnel; ctx.fillRect(40, GROUND + 50, W - 80, TUNNEL - GROUND - 50);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 3;
      for (let y = GROUND + 62; y < TUNNEL; y += 22) for (let x = 40 + ((y / 22) % 2) * 30; x < W - 40; x += 60) ctx.strokeRect(x, y, 60, 22);
      D.box(ctx, 0, GROUND + 50, 40, TUNNEL - GROUND - 50, 0, theme.brick, 4);
      D.box(ctx, W - 40, GROUND + 50, 40, TUNNEL - GROUND - 50, 0, theme.brick, 4);
      ctx.fillStyle = theme.dirt; ctx.fillRect(0, TUNNEL, W, H - TUNNEL);
      ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, TUNNEL); ctx.lineTo(W, TUNNEL); ctx.stroke();
      // the ladder
      const lx = room.ladder.x;
      ctx.strokeStyle = '#c68b59'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(lx - 20, GROUND - 6); ctx.lineTo(lx - 20, TUNNEL); ctx.moveTo(lx + 20, GROUND - 6); ctx.lineTo(lx + 20, TUNNEL); ctx.stroke();
      for (let y = GROUND + 14; y < TUNNEL; y += 26) { ctx.beginPath(); ctx.moveTo(lx - 20, y); ctx.lineTo(lx + 20, y); ctx.stroke(); }
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (let k = 0; k < 12; k++) { ctx.beginPath(); ctx.ellipse((k * 97 + roomI * 31) % W, GROUND + 80 + (k * 41) % 90, 16, 9, 0, 0, 7); ctx.fill(); }
    }
    // the jungle path: a dirt band with grass on top, broken by ponds
    const spans = [];
    let x = 0;
    const gaps = room.gaps.slice().sort((a, b) => a[0] - b[0]);
    for (const [a, b] of gaps) { spans.push([x, a]); x = b; }
    spans.push([x, W]);
    if (room.pond) drawPond(ctx, room.pond, t);
    for (const [a, b] of spans) {
      ctx.fillStyle = theme.dirt; ctx.fillRect(a, GROUND, b - a, 50);
      ctx.fillStyle = theme.grass; ctx.fillRect(a, GROUND, b - a, 12);
      ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(a, GROUND, b - a, 50);
    }
    if (room.sand) drawSand(ctx, room.sand, t);
    if (room.ladder) {                                    // the trapdoor in the path
      const lx = room.ladder.x;
      D.box(ctx, lx - 30, GROUND - 4, 60, 14, 4, '#8b5a2b', 4);
      ctx.fillStyle = INK; for (let k = -1; k <= 1; k++) ctx.fillRect(lx + k * 16 - 2, GROUND - 2, 4, 10);
      // a down arrow hint
      const bob = Math.sin(t * 4) * 4;
      ctx.beginPath(); ctx.moveTo(lx - 12, GROUND - 60 + bob); ctx.lineTo(lx + 12, GROUND - 60 + bob); ctx.lineTo(lx, GROUND - 44 + bob); ctx.closePath();
      ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    }
  }

  function drawPond(ctx, pd, t) {
    const { x0, x1 } = pd;
    ctx.fillStyle = theme.water; ctx.fillRect(x0, GROUND + 26, x1 - x0, 60);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3;
    for (let k = 0; k < 6; k++) {
      const wx = x0 + 20 + ((k * 70 + t * 30) % (x1 - x0 - 40)), wy = GROUND + 40 + (k % 3) * 14;
      ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 10, wy - 5, wx + 20, wy); ctx.stroke();
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, GROUND + 26); ctx.lineTo(x0, GROUND + 86); ctx.lineTo(x1, GROUND + 86); ctx.lineTo(x1, GROUND + 26); ctx.stroke();
    for (const h of room.hippos) drawHippo(ctx, h, t);
  }

  function drawHippo(ctx, h, t) {
    const up = hippoUp(h, t);
    const y = GROUND + 6 + (1 - up) * 60;
    ctx.save();
    ctx.beginPath(); ctx.rect(h.cx - 80, 0, 160, GROUND + 30); ctx.clip();      // underwater part hidden
    ctx.beginPath(); ctx.ellipse(h.cx, y + 6, 46, 26, 0, Math.PI, 0); ctx.closePath();
    ctx.fillStyle = '#9a8fbf'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    for (const s of [-1, 1]) { D.circle(ctx, h.cx + s * 26, y - 18, 7, '#9a8fbf', 3.5); D.circle(ctx, h.cx + s * 26, y - 18, 3, '#ffb3c6', 0); }
    for (const s of [-1, 1]) { D.circle(ctx, h.cx + s * 13, y - 6, 6, '#ffffff', 3); D.circle(ctx, h.cx + s * 13, y - 6, 3, INK, 0); }
    ctx.fillStyle = 'rgba(255,120,150,0.6)'; ctx.beginPath(); ctx.arc(h.cx - 28, y + 2, 4, 0, 7); ctx.arc(h.cx + 28, y + 2, 4, 0, 7); ctx.fill();
    ctx.restore();
    if (up < 0.9 && up > 0.05) for (let k = 0; k < 3; k++) D.circle(ctx, h.cx - 20 + k * 20, GROUND + 28 - Math.random() * 10, 4, '#ffffff', 2);  // bubbles
  }

  function drawSand(ctx, sd, t) {
    const o = sd.open, c = (sd.x0 + sd.x1) / 2, hw = (sd.x1 - sd.x0) / 2;
    // the sand patch on the path (always visible so you know where it is)
    ctx.fillStyle = '#e9c46a'; ctx.fillRect(sd.x0, GROUND, sd.x1 - sd.x0, 12);
    ctx.strokeStyle = 'rgba(160,110,40,0.6)'; ctx.lineWidth = 2;
    for (let x = sd.x0 + 10; x < sd.x1; x += 24) { ctx.beginPath(); ctx.arc(x, GROUND + 6, 4, 0, Math.PI); ctx.stroke(); }
    if (o > 0.05) {                                       // open: a swirly sinking pit
      const w = hw * o;
      ctx.beginPath(); ctx.ellipse(c, GROUND + 4, w, 16 + 10 * o, 0, 0, 7);
      ctx.fillStyle = '#c9a06b'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.save(); ctx.translate(c, GROUND + 4); ctx.rotate(t * 3); ctx.strokeStyle = '#a07a4a'; ctx.lineWidth = 3;
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(0, 0, w * (0.3 + k * 0.22), 6 + k * 3, 0, 0, 4.5); ctx.stroke(); }
      ctx.restore();
    }
  }

  function drawVine(ctx, v, t) {
    const tip = vineTip(v, t);
    ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(v.px, v.py); ctx.lineTo(tip.x, tip.y); ctx.stroke();
    ctx.strokeStyle = '#4caf50'; ctx.lineWidth = 5; ctx.stroke();
    // little leaves along it
    for (let k = 1; k < 5; k++) {
      const f = k / 5, lx = v.px + (tip.x - v.px) * f, ly = v.py + (tip.y - v.py) * f;
      ctx.beginPath(); ctx.ellipse(lx + 8, ly, 9, 5, 0.6, 0, 7); ctx.fillStyle = '#6cc04a'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
    }
    D.circle(ctx, tip.x, tip.y, 8, '#6cc04a', 3);         // the handle at the end
  }

  function drawLog(ctx, l) {
    ctx.save(); ctx.translate(l.x, GROUND - 22); ctx.rotate(l.a);
    D.circle(ctx, 0, 0, 22, '#a0673a', 4);
    ctx.strokeStyle = '#6b4226'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.stroke();
    ctx.restore();
  }

  function drawSnake(ctx, s, t) {
    const x = s.x, y = GROUND;
    ctx.fillStyle = '#7bd389'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(x, y - 10, 30, 11, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x - 4, y - 22, 20, 9, 0, 0, 7); ctx.fill(); ctx.stroke();
    const sway = Math.sin(t * 2 + x) * 4;
    ctx.beginPath(); ctx.ellipse(x - 18 + sway, y - 36, 12, 10, 0, 0, 7); ctx.fill(); ctx.stroke();
    // sleepy eyes and a little tongue
    ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x - 22 + sway, y - 38, 3, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 14 + sway, y - 38, 3, 0.2, Math.PI - 0.2); ctx.stroke();
    if (Math.sin(t * 3 + x) > 0.6) { ctx.strokeStyle = '#ef476f'; ctx.beginPath(); ctx.moveTo(x - 30 + sway, y - 34); ctx.lineTo(x - 38 + sway, y - 32); ctx.stroke(); }
    // stripes
    ctx.fillStyle = '#4caf68'; for (const k of [-14, 0, 14]) { ctx.beginPath(); ctx.ellipse(x + k, y - 10, 3, 8, 0, 0, 7); ctx.fill(); }
    // "z z" sleeping
    D.text(ctx, 'z', x + 10, y - 50 - (t * 20 % 20), { size: 18, color: '#ffffff' });
  }

  function drawBat(ctx, b, t) {
    const flap = Math.sin(t * 14) * 0.6;
    ctx.save(); ctx.translate(b.x, b.y);
    for (const s of [-1, 1]) {
      ctx.save(); ctx.scale(s, 1); ctx.rotate(flap);
      ctx.beginPath(); ctx.moveTo(8, 0); ctx.quadraticCurveTo(30, -18, 40, 4); ctx.quadraticCurveTo(30, 0, 24, 8); ctx.quadraticCurveTo(16, 2, 8, 6); ctx.closePath();
      ctx.fillStyle = '#7b6fd6'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
    }
    D.circle(ctx, 0, 0, 13, '#9b8bd4', 3.5);
    for (const s of [-1, 1]) { D.circle(ctx, s * 5, -3, 3.5, '#ffffff', 1.5); D.circle(ctx, s * 5, -3, 1.6, INK, 0); }
    ctx.restore();
  }

  function drawTreasure(ctx, tr, t) {
    const bob = Math.sin(t * 3 + tr.x) * 5;
    ctx.save(); ctx.translate(tr.x, tr.y + bob);
    // a glow so it's easy to spot
    const gl = ctx.createRadialGradient(0, 0, 4, 0, 0, 46); gl.addColorStop(0, 'rgba(255,240,170,0.8)'); gl.addColorStop(1, 'rgba(255,240,170,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, 46, 0, 7); ctx.fill();
    drawTreasureIcon(ctx, tr.kind);
    D.star(ctx, 16, -16, 4 + Math.abs(Math.sin(t * 5)) * 3, '#ffffff', 1.5);
    ctx.restore();
  }
  function drawTreasureIcon(ctx, kind) {
    ctx.lineJoin = 'round';
    if (kind === 'gem') {
      ctx.beginPath(); ctx.moveTo(-18, -6); ctx.lineTo(-9, -18); ctx.lineTo(9, -18); ctx.lineTo(18, -6); ctx.lineTo(0, 20); ctx.closePath();
      ctx.fillStyle = '#ef476f'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-18, -6); ctx.lineTo(18, -6); ctx.lineWidth = 2.5; ctx.stroke();
    } else if (kind === 'crown') {
      ctx.beginPath(); ctx.moveTo(-20, 12); ctx.lineTo(-20, -10); ctx.lineTo(-10, 0); ctx.lineTo(0, -16); ctx.lineTo(10, 0); ctx.lineTo(20, -10); ctx.lineTo(20, 12); ctx.closePath();
      ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      D.circle(ctx, 0, 4, 4, '#ef476f', 2); D.circle(ctx, -12, 6, 3, '#118ab2', 2); D.circle(ctx, 12, 6, 3, '#06d6a0', 2);
    } else if (kind === 'coins') {
      ctx.beginPath(); ctx.moveTo(-16, 18); ctx.quadraticCurveTo(-22, -4, -6, -10); ctx.lineTo(6, -10); ctx.quadraticCurveTo(22, -4, 16, 18); ctx.closePath();
      ctx.fillStyle = '#c68b59'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      D.circle(ctx, 0, 5, 8, '#ffc93c', 3); D.box(ctx, -8, -17, 16, 8, 3, '#e9c46a', 3);
    } else if (kind === 'goldbar') {
      ctx.beginPath(); ctx.moveTo(-22, 12); ctx.lineTo(-14, -8); ctx.lineTo(14, -8); ctx.lineTo(22, 12); ctx.closePath();
      ctx.fillStyle = '#ffc93c'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(-10, -4, 8, 4);
    } else {                                             // ring
      ctx.beginPath(); ctx.arc(0, 6, 13, 0, 7); ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = '#ffd166'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-7, -10); ctx.lineTo(0, -20); ctx.lineTo(7, -10); ctx.lineTo(0, -4); ctx.closePath();
      ctx.fillStyle = '#9bf6ff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    }
  }

  function drawCamp(ctx, c, t) {
    const x = c.x + 60;
    ctx.beginPath(); ctx.moveTo(x - 90, GROUND); ctx.lineTo(x, GROUND - 130); ctx.lineTo(x + 90, GROUND); ctx.closePath();
    ctx.fillStyle = '#ef476f'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, GROUND - 130); ctx.lineTo(x - 22, GROUND); ctx.lineTo(x + 22, GROUND); ctx.closePath();
    ctx.fillStyle = '#5a2f18'; ctx.fill(); ctx.stroke();
    // a little flag on top and a campfire
    ctx.beginPath(); ctx.moveTo(x, GROUND - 130); ctx.lineTo(x, GROUND - 170); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, GROUND - 170); ctx.lineTo(x + 32, GROUND - 160 + Math.sin(t * 5) * 3); ctx.lineTo(x, GROUND - 150); ctx.closePath();
    ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    const fx0 = c.x - 70;
    D.box(ctx, fx0 - 26, GROUND - 10, 52, 10, 4, '#8b5a2b', 3);
    for (const [ox, h, col] of [[-10, 34, '#ff8c42'], [8, 28, '#ffd166'], [0, 44, '#ef476f']]) {
      const fl = Math.sin(t * 12 + ox) * 4;
      ctx.beginPath(); ctx.moveTo(fx0 + ox - 9, GROUND - 10); ctx.quadraticCurveTo(fx0 + ox + fl, GROUND - 10 - h, fx0 + ox + 9, GROUND - 10); ctx.closePath();
      ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
    }
  }

  // The explorer: a kid in a big safari hat with a backpack.
  function drawExplorer(ctx, pl, t) {
    const x = pl.x + PW / 2, y = pl.y + PH;
    ctx.save(); ctx.translate(x, y); ctx.scale(pl.face, 1);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const air = !pl.onGround && pl.mode === 'walk', run = pl.onGround && Math.abs(pl.vx) > 20;
    const ph = pl.run, L = 3.5;
    const lg = run ? Math.sin(ph) * 9 : air ? 6 : 0;
    // legs + boots
    for (const [s, o] of [[-1, lg], [1, -lg]]) {
      ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(s * 6, -22); ctx.lineTo(s * 6 + o, -6); ctx.stroke();
      ctx.strokeStyle = '#c9a06b'; ctx.lineWidth = 5; ctx.stroke();
      D.box(ctx, s * 6 + o - 7, -9, 15, 9, 4, '#6b4226', 3);
    }
    // backpack
    D.box(ctx, -22, -46, 14, 24, 5, '#118ab2', L);
    // body (khaki shirt)
    D.box(ctx, -14, -46, 28, 28, 9, '#e9c46a', L);
    ctx.fillStyle = '#c9a06b'; ctx.fillRect(-2, -44, 4, 22);
    // arms: up when swinging/climbing
    const armUp = pl.mode === 'vine' || pl.mode === 'ladder' || air;
    for (const s of [-1, 1]) {
      ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(s * 12, -40);
      if (armUp) ctx.lineTo(s * 8, -64); else ctx.lineTo(s * 16 + (run ? Math.sin(ph + (s > 0 ? Math.PI : 0)) * 6 : 0), -24);
      ctx.stroke(); ctx.strokeStyle = '#f2c9a0'; ctx.lineWidth = 5; ctx.stroke();
    }
    // head
    D.circle(ctx, 2, -58, 14, '#f2c9a0', L);
    D.circle(ctx, 7, -60, 2.8, INK, 0); D.circle(ctx, 8, -61, 1, '#fff', 0);
    ctx.fillStyle = 'rgba(255,107,129,0.6)'; ctx.beginPath(); ctx.arc(10, -53, 3, 0, 7); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(6, -54, 4, 0.2, Math.PI - 0.4); ctx.stroke();
    // big safari hat
    ctx.beginPath(); ctx.ellipse(1, -67, 21, 5, 0, 0, 7); ctx.fillStyle = '#e9c46a'; ctx.fill(); ctx.lineWidth = L; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-11, -68); ctx.quadraticCurveTo(-10, -84, 2, -84); ctx.quadraticCurveTo(14, -84, 13, -68); ctx.closePath();
    ctx.fillStyle = '#e9c46a'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8b5a2b'; ctx.fillRect(-11, -72, 24, 4);
    ctx.restore();
  }

  function heart(ctx, x, y, s, full) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 16, s / 16);
    ctx.beginPath(); ctx.moveTo(0, 14); ctx.bezierCurveTo(-22, 0, -14, -18, 0, -6); ctx.bezierCurveTo(14, -18, 22, 0, 0, 14);
    ctx.fillStyle = full ? '#ef476f' : '#ffffff'; ctx.fill(); ctx.lineWidth = 3.5 * 16 / s; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
  }
  function drawHUD(ctx) {
    // left: hearts, and treasures found under them
    for (let i = 0; i < maxHearts; i++) heart(ctx, 118 + i * 38, 36, 17, i < hearts);
    ctx.save(); ctx.translate(122, 86); ctx.scale(0.8, 0.8); drawTreasureIcon(ctx, 'crown'); ctx.restore();
    D.text(ctx, got + '/' + total, 146, 88, { size: 28, align: 'left' });
    // right (left of the pause button): where you are, one dot per room; the time under it
    const n = rooms.length, step = 22, x0 = W - 104 - n * step;
    for (let i = 0; i < n; i++) {
      const cx = x0 + (i + 0.5) * step;
      D.circle(ctx, cx, 36, i === roomI ? 9 : 6, i === roomI ? '#ffd166' : i < roomI ? '#06d6a0' : '#ffffff', 3);
      if (rooms[i].treasures.some(tr => !tr.got)) D.star(ctx, cx, 20, 5, '#ffd166', 1.5);
    }
    D.text(ctx, time.toFixed(0) + 's', W - 104, 80, { size: 24, align: 'right' });
  }


  // ---------------------------------------------------------------
  // Menus
  // ---------------------------------------------------------------
  function advPic(a) {
    const th = THEMES[a.theme];
    return `<svg viewBox="0 0 120 70"><rect width="120" height="70" fill="${th.sky[0]}"/><circle cx="10" cy="0" r="22" fill="${th.leaf}"/><circle cx="50" cy="-4" r="20" fill="${th.leaf2}"/><circle cx="96" cy="0" r="24" fill="${th.leaf}"/>
      <path d="M60 8 L84 40" stroke="#2b2b2b" stroke-width="4"/><path d="M60 8 L84 40" stroke="#4caf50" stroke-width="2"/>
      <rect x="0" y="46" width="44" height="24" fill="${th.dirt}" stroke="#2b2b2b" stroke-width="3"/><rect x="0" y="46" width="44" height="5" fill="${th.grass}"/>
      <rect x="44" y="54" width="40" height="16" fill="${th.water}"/><rect x="84" y="46" width="36" height="24" fill="${th.dirt}" stroke="#2b2b2b" stroke-width="3"/><rect x="84" y="46" width="36" height="5" fill="${th.grass}"/>
      <path d="M96 40 L104 30 L112 40 L104 52 Z" fill="#ef476f" stroke="#2b2b2b" stroke-width="2.5"/></svg>`;
  }
  function levels(g) {
    return ADVENTURES.map((a, i) => {
      const prev = i === 0 || (g.save.levels[ADVENTURES[i - 1].id] || {}).done;
      return { ...a, pic: advPic(a), locked: !prev };
    });
  }

  // ---------------------------------------------------------------
  // Start the game
  // ---------------------------------------------------------------
  const S = (inner) => `<svg viewBox="0 0 80 80">${inner}</svg>`;
  const L = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
  Arcade.start({
    id: 'trail',
    title: 'Treasure Trail',
    view: { w: W, h: H },
    background: '#3f9e4a',
    music: { tempo: 126, root: 62, scale: 'dorian', prog: [[1, 4, 1, 5], [6, 4, 1, 5]], drums: 'tribal', bass: 'bounce', lead: 'square', pad: true, arp: true, seed: 3131 },
    levelsTitle: 'Pick an adventure',
    howTo: [
      { pic: S(`<path d="M14 40 H66" ${L} stroke-width="7"/><path d="M24 28 L12 40 L24 52 M56 28 L68 40 L56 52" fill="none" ${L} stroke-width="7"/>`), text: 'Run', keys: 'Left / Right' },
      { pic: S(`<path d="M40 4 L22 50" ${L} stroke-width="7"/><path d="M40 4 L22 50" stroke="#4caf50" stroke-width="4"/><circle cx="22" cy="52" r="7" fill="#6cc04a" ${L}/><rect x="0" y="66" width="80" height="14" fill="#3aa7e0"/>`), text: 'Jump to grab a vine, jump again to let go', keys: 'Space' },
      { pic: S(`<ellipse cx="40" cy="58" rx="30" ry="18" fill="#9a8fbf" ${L}/><circle cx="30" cy="50" r="5" fill="#fff" ${L} stroke-width="2"/><circle cx="50" cy="50" r="5" fill="#fff" ${L} stroke-width="2"/><rect x="0" y="62" width="80" height="18" fill="#3aa7e0"/>`), text: 'Hop on hippos (they dip sometimes!)' },
      { pic: S(`<rect x="28" y="10" width="24" height="64" fill="none" stroke="#c68b59" stroke-width="5"/><path d="M28 24 H52 M28 40 H52 M28 56 H52" stroke="#c68b59" stroke-width="5"/><path d="M40 0 L50 10 H30 Z" fill="#ffd166" ${L} stroke-width="3"/>`), text: 'Climb down for hidden treasure', keys: 'Up / Down' },
      { pic: S(`<path d="M22 50 L28 30 L52 30 L58 50 Z" fill="#ffc93c" ${L}/><path d="M18 64 L40 20 L62 64" fill="none"/><path d="M20 22 L30 12 L40 22 L50 12 L60 22 L60 34 L20 34 Z" fill="#ffd166" ${L}/>`), text: 'Find the treasures, then reach camp' },
    ],
    buttons: {
      left: [{ id: 'ArrowLeft', icon: icons.left, label: 'Left' }, { id: 'ArrowRight', icon: icons.right, label: 'Right' }],
      right: [{ id: 'ArrowDown', icon: icons.down, label: 'Down' }, { id: 'ArrowUp', icon: icons.up, label: 'Up' }, { id: 'Space', icon: icons.jump, label: 'Jump' }],
    },
    levels,
    setup,
    update,
    draw: render,
  });
  window.__trailDebug = { ADVENTURES, PHYS, GROUND, TUNNEL, PW, PH };
})();
