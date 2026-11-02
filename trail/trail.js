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
  let gRef, hatId = 'safari', pet = false, fell = 0;
  let backToStart = false, hurtFlash = 0;
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
    backToStart = false; hurtFlash = 0;
    got = 0; finished = false; time = 0; popups = []; fx = new Arcade.Particles();
    gRef = g; hatId = pickedHat(g).id; pet = !!g.save.data.pet && g.isUnlocked('pet-parrot'); fell = 0;
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
    hurtFlash = Math.max(0, hurtFlash - dt);
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
        if (backToStart) { backToStart = false; enterRoom(0, 60); }   // out of hearts on Easy: from the top!
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
        if ((atTop && down) || (atBottom && up)) { g.achieve('tunnel'); p.mode = 'ladder'; p.x = lx - PW / 2; p.vx = 0; p.vy = 0; }
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
    // down in the tunnel the music sounds soft and far away (it's up on the path!)
    if (inTunnel !== !!p.musicTunnel) { p.musicTunnel = inTunnel; g.music.mood({ muffle: inTunnel ? 0.65 : 0 }); }
    const cx = p.x + PW / 2;
    // the floor: jungle path (if there's ground here) or the tunnel floor
    p.onGround = false;
    if (!inTunnel && p.vy >= 0 && prevFeet <= GROUND + 1 && p.y + PH >= GROUND && groundAt(cx, time)) {
      if (p.vy > 300) g.sfx('land');                       // a soft thump when you land from a jump
      p.y = GROUND - PH; p.vy = 0; p.onGround = true;
      if (room.gaps.some(([a, b]) => cx > a && cx < b)) g.achieve('hippo');      // standing on a hippo!
    }
    if (inTunnel && p.y + PH >= TUNNEL) { if (p.vy > 300) g.sfx('land'); p.y = TUNNEL - PH; p.vy = 0; p.onGround = true; }
    if (inTunnel) p.x = math.clamp(p.x, 40, W - 40 - PW);    // the tunnel has walls at both ends

    // grab a vine while in the air
    for (const v of room.vines) {
      if (v.cool > 0) { v.cool -= dt; continue; }
      if (p.onGround) continue;
      const tip = vineTip(v, time);
      if (Math.hypot(cx - tip.x, p.y + 14 - tip.y) < diff.grab) { g.achieve('vine'); p.mode = 'vine'; p.vine = v; g.sfx('swish'); popup('Grab!', tip.x, tip.y - 30, '#06d6a0'); return; }
    }

    // fell into the water or the quicksand?
    if (!inTunnel && p.y + PH > GROUND + 40) {
      const inSand = room.sand && cx > room.sand.x0 && cx < room.sand.x1;
      lose(g, inSand ? 'sand' : 'water');
      return;
    }

    // bumps: logs, snakes and bats knock you back and cost a heart
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
    p.vx = away * 300; p.vy = -380; p.onGround = false; p.stun = 0.35; p.invuln = 1.2;
    g.sfx('bonk'); popup(word, p.x + PW / 2, p.y - 10, '#ffffff');
    if (loseHeart(g)) { p.dead = 0.9; p.splash = null; fx.burst(p.x + PW / 2, p.y + PH / 2, { count: 20, shape: 'star', colors: ['#ffd166', '#ffffff'], speed: 220, size: 11, gravity: 0, life: 0.7 }); }
  }

  // Lose one heart. Returns true when that was the last one.
  //  * Easy: endless tries, but running out of hearts sends you back to the
  //    first room of the adventure (treasures you found stay found).
  //  * Normal / Challenge: running out of hearts uses up a try; no tries left = "Nice try!"
  function loseHeart(g) {
    hearts--;
    g.sfx('hurt');
    hurtFlash = 0.5;
    if (hearts > 0) return false;
    if (tries !== Infinity) tries--;
    if (tries !== Infinity && tries < 0) {
      resume = { id: adv.id, room: roomI, time, got: [] };
      rooms.forEach((r, ri) => r.treasures.forEach((t, ti) => { if (t.got) resume.got.push([ri, ti]); }));
      finished = true;
      g.finish({ win: false, title: 'Nice try!', lines: ['Treasures: ' + got + ' / ' + total, 'Again starts in this room!'], next: false, delay: 900 });
      return true;
    }
    hearts = maxHearts;
    if (tries === Infinity) { backToStart = true; popup('Back to the start!', W / 2, 200, '#ff8fab'); }
    else popup('Out of hearts!', W / 2, 200, '#ff8fab');
    return true;
  }

  function lose(g, how) {
    fell++;
    p.dead = 0.9; p.splash = how;
    if (how === 'water') { g.sfx('splash'); fx.burst(p.x + PW / 2, GROUND + 50, { count: 22, colors: ['#8ecae6', '#ffffff', theme.water], speed: 260, size: 12, gravity: 500, life: 0.8 }); popup('Splash!', p.x + PW / 2, GROUND, '#8ecae6'); }
    else { g.tone(300, 0.6, { slide: 90, type: 'triangle', vol: 0.3 }); fx.burst(p.x + PW / 2, GROUND + 20, { count: 18, colors: ['#e9c46a', '#f4d58d', '#c9a06b'], speed: 160, size: 11, gravity: 300, life: 0.8 }); popup('Sinky sand!', p.x + PW / 2, GROUND - 20, '#ffd166'); }
    loseHeart(g);
  }

  function checkTreasure(g) {
    for (const t of room.treasures) {
      if (t.got || Math.abs(p.x + PW / 2 - t.x) > 38 || Math.abs(p.y + PH / 2 - t.y) > 50) continue;
      t.got = true; got++;
      g.save.data.treasures = (g.save.data.treasures || 0) + 1; g.store();
      g.sfx('coin'); g.sfx('star');
      fx.burst(t.x, t.y, { count: 24, shape: 'star', colors: ['#ffd166', '#fff3b0', '#ffffff'], speed: 220, size: 12, gravity: 120, life: 0.8 });
      popup('Treasure!', t.x, t.y - 40, '#ffd166');
      g.music.stinger('treasure');          // a twinkly jingle on top of the song
    }
  }

  function win(g) {
    finished = true;
    const frac = total ? got / total : 1;
    // trophies and unlocks
    g.achieve('camp');
    if (frac >= 1) g.achieve('all-treasure');
    if (!fell) g.achieve('dry');
    if (adv.id === 'river' && time < 50) g.achieve('speedy');
    if (adv.id === 'dusk') g.achieve('swamp');
    setTimeout(() => checkUnlocks(g), 1500);
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
    if (p.dead <= 0 && p.mode !== 'vine') {                // a soft shadow on the floor under the explorer
      const feet = p.y + PH, floor = feet <= GROUND + 6 ? GROUND : TUNNEL, cx = p.x + PW / 2, gap = floor - feet;
      if (gap >= -2 && gap < 220 && (floor === TUNNEL || groundAt(cx, t))) shadow(ctx, cx, floor + 1, 20 * (1 - gap / 300));
    }
    if (p.dead <= 0 && !(p.invuln > 0 && Math.floor(p.invuln * 10) % 2 === 0 && p.stun <= 0)) drawExplorer(ctx, p, t);
    if (p.dead > 0 && p.splash) drawSinking(ctx, t);
    fx.draw(ctx);
    drawForeground(ctx, t);
    for (const q of popups) D.text(ctx, q.text, q.x, q.y, { size: 26, color: q.color });
    drawHUD(ctx);
  }

  // ---------------------------------------------------------------
  // SNES-style art. The parts that never move (sky, far hills, trees,
  // the dirt and the path) are painted ONCE per room onto hidden canvases
  // ("caches"), then copied to the screen each frame. That keeps it fast
  // even with lots of detail. The far layers slide a little as you walk
  // ("parallax"), so the jungle looks deep.
  // ---------------------------------------------------------------
  let artKey = '', cvFar = null, cvMid = null, cvGround = null;
  const ART_SCALE = 2;                                   // caches are drawn at 2x so they stay sharp
  const PAR_FAR = 30, PAR_MID = 70;                      // how far the far / middle layers slide (px)
  function mkCanvas(w, h) {
    const c = document.createElement('canvas'); c.width = w * ART_SCALE; c.height = h * ART_SCALE;
    const x = c.getContext('2d'); x.scale(ART_SCALE, ART_SCALE); x.lineJoin = 'round'; x.lineCap = 'round';
    return [c, x];
  }
  // mix two colors: k = 0 gives a, 1 gives b
  function mix(a, b, k) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (s) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k);
    return '#' + ((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0');
  }
  const light = (c, k) => mix(c, '#ffffff', k), dark = (c, k) => mix(c, '#1e1410', k);
  // a tiny repeatable random number maker, so a room always looks the same
  function seeded(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  function buildArt() {
    const key = adv.id + ':' + roomI;
    if (key === artKey) return;
    artKey = key;
    const rnd = seeded(roomI * 977 + adv.id.length * 131 + 7);
    // ---- far layer: sky, soft glow, two rows of hazy hills ----
    const FW = W + PAR_FAR * 2;
    let x;
    [cvFar, x] = mkCanvas(FW, GROUND);
    const sky = x.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, theme.sky[0]); sky.addColorStop(0.7, theme.sky[1]); sky.addColorStop(1, light(theme.sky[1], 0.3));
    x.fillStyle = sky; x.fillRect(0, 0, FW, GROUND);
    const glow = x.createRadialGradient(FW * 0.7, 110, 10, FW * 0.7, 110, 320);
    glow.addColorStop(0, 'rgba(255,255,240,0.55)'); glow.addColorStop(1, 'rgba(255,255,240,0)');
    x.fillStyle = glow; x.fillRect(0, 0, FW, GROUND);
    const hazy = mix(theme.far, theme.sky[1], 0.6), hazy2 = mix(theme.far, theme.sky[1], 0.3);
    // farthest: rounded mountains
    x.fillStyle = hazy; x.beginPath(); x.moveTo(0, GROUND);
    for (let k = 0; k <= 6; k++) { const mx = k * FW / 6; x.quadraticCurveTo(mx - FW / 12, GROUND - 170 - rnd() * 70, mx, GROUND - 90 - rnd() * 30); }
    x.lineTo(FW, GROUND); x.fill();
    if (adv.theme === 'temple' || adv.theme === 'dusk') {     // a stepped temple far away
      const tx = 120 + rnd() * (FW - 300), c = mix(theme.far, theme.sky[1], 0.45);
      for (let s = 0; s < 4; s++) { x.fillStyle = s % 2 ? light(c, 0.08) : c; x.fillRect(tx + s * 18, GROUND - 120 - s * 26, 180 - s * 36, 30); }
      x.fillStyle = dark(c, 0.15); x.fillRect(tx + 78, GROUND - 210, 24, 18);
    }
    // nearer: a row of bushy treetops
    x.fillStyle = hazy2;
    for (let k = -1; k < 14; k++) { x.beginPath(); x.arc(k * 80 + rnd() * 30, GROUND - 40 - rnd() * 40, 46 + rnd() * 26, 0, 7); x.fill(); }
    x.fillRect(0, GROUND - 46, FW, 46);
    x.fillStyle = 'rgba(255,255,255,0.18)';                 // misty band at the bottom
    x.fillRect(0, GROUND - 40, FW, 40);

    // ---- middle layer: big tree trunks with roots, leafy clusters, hanging vines ----
    const MW = W + PAR_MID * 2;
    [cvMid, x] = mkCanvas(MW, GROUND + 4);
    const trunks = [];
    for (let k = 0; k < 6; k++) {
      const tx = 40 + k * 190 + rnd() * 60;
      if (room.vines.some(v => Math.abs(v.px + PAR_MID - tx) < 90)) continue;
      trunks.push(tx);
      const tw = 26 + rnd() * 12;
      const tg = x.createLinearGradient(tx - tw / 2, 0, tx + tw / 2, 0);
      tg.addColorStop(0, dark(theme.trunk, 0.35)); tg.addColorStop(0.55, theme.trunk); tg.addColorStop(1, light(theme.trunk, 0.2));
      x.fillStyle = tg; x.strokeStyle = INK; x.lineWidth = 4;
      x.beginPath(); x.moveTo(tx - tw / 2, 30); x.lineTo(tx - tw / 2, GROUND - 14);
      x.quadraticCurveTo(tx - tw / 2 - 6, GROUND, tx - tw / 2 - 20, GROUND + 2); x.lineTo(tx + tw / 2 + 20, GROUND + 2);
      x.quadraticCurveTo(tx + tw / 2 + 6, GROUND, tx + tw / 2, GROUND - 14); x.lineTo(tx + tw / 2, 30); x.closePath(); x.fill(); x.stroke();
      x.strokeStyle = dark(theme.trunk, 0.3); x.lineWidth = 2;   // bark lines
      for (let b = 0; b < 7; b++) { const by = 60 + rnd() * (GROUND - 90); x.beginPath(); x.moveTo(tx - tw * 0.3, by); x.quadraticCurveTo(tx, by + 8, tx + tw * 0.25, by + 2); x.stroke(); }
    }
    const cluster = (cx, cy, r, base) => {                 // a puffy leaf cluster: outline, base, light top, shine
      const parts = [[0, 0, r], [-r * 0.7, r * 0.15, r * 0.7], [r * 0.7, r * 0.2, r * 0.72], [-r * 0.3, -r * 0.45, r * 0.65], [r * 0.35, -r * 0.4, r * 0.6]];
      x.fillStyle = INK; for (const [dx, dy, rr] of parts) { x.beginPath(); x.arc(cx + dx, cy + dy, rr + 3.5, 0, 7); x.fill(); }
      x.fillStyle = dark(base, 0.15); for (const [dx, dy, rr] of parts) { x.beginPath(); x.arc(cx + dx, cy + dy, rr, 0, 7); x.fill(); }
      x.fillStyle = base; for (const [dx, dy, rr] of parts) { x.beginPath(); x.arc(cx + dx - rr * 0.12, cy + dy - rr * 0.15, rr * 0.82, 0, 7); x.fill(); }
      x.fillStyle = light(base, 0.3); for (const [dx, dy, rr] of parts.slice(3)) { x.beginPath(); x.arc(cx + dx - rr * 0.3, cy + dy - rr * 0.35, rr * 0.35, 0, 7); x.fill(); }
    };
    for (const tx of trunks) { cluster(tx - 30, 50, 34, theme.leaf2); cluster(tx + 26, 70, 30, theme.leaf); }
    // hanging vines (just decoration)
    for (let k = 0; k < 7; k++) {
      const vx = rnd() * MW, len = 60 + rnd() * 110;
      x.strokeStyle = INK; x.lineWidth = 5; x.beginPath(); x.moveTo(vx, 0); x.quadraticCurveTo(vx + 14, len / 2, vx - 4, len); x.stroke();
      x.strokeStyle = theme.leaf2; x.lineWidth = 2.5; x.stroke();
      for (let f = 0.3; f < 1; f += 0.25) { x.fillStyle = light(theme.leaf2, 0.15); x.beginPath(); x.ellipse(vx + 5 + (f % 0.5 > 0.2 ? 6 : -6), len * f, 6, 3.5, f * 3, 0, 7); x.fill(); }
    }
    // the canopy along the top
    for (let k = -1; k < 15; k++) cluster(k * 74 + rnd() * 20, 4 + rnd() * 12, 40 + rnd() * 16, k % 2 ? theme.leaf : theme.leaf2);

    // ---- ground: deep dirt with layers, rocks and roots; the tunnel; the path with grass ----
    [cvGround, x] = mkCanvas(W, H);
    const dg = x.createLinearGradient(0, GROUND, 0, H);
    dg.addColorStop(0, theme.deep); dg.addColorStop(1, dark(theme.deep, 0.3));
    x.fillStyle = dg; x.fillRect(0, GROUND, W, H - GROUND);
    for (let b = 0; b < 4; b++) {                          // wavy soil layers
      const by = GROUND + 70 + b * 38;
      x.fillStyle = b % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
      x.beginPath(); x.moveTo(0, by);
      for (let wx = 0; wx <= W; wx += 60) x.quadraticCurveTo(wx + 30, by + (rnd() - 0.5) * 16, wx + 60, by);
      x.lineTo(W, by + 18); x.lineTo(0, by + 18); x.fill();
    }
    if (room.ladder) {
      // the tunnel: shaded bricks, a cozy dark inside
      const ty = GROUND + 50, th = TUNNEL - ty;
      const tg = x.createLinearGradient(0, ty, 0, TUNNEL); tg.addColorStop(0, dark(theme.tunnel, 0.25)); tg.addColorStop(1, theme.tunnel);
      x.fillStyle = tg; x.fillRect(40, ty, W - 80, th);
      for (let y = ty + 10; y < TUNNEL - 4; y += 24) for (let bx = 40 + ((y / 24) % 2) * 32; bx < W - 40; bx += 64) {
        x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(bx + 2, y + 2, 60, 3);
        x.strokeStyle = 'rgba(0,0,0,0.3)'; x.lineWidth = 2; x.strokeRect(bx, y, 64, 24);
      }
      for (const wx of [0, W - 40]) {                     // the side walls
        const wg = x.createLinearGradient(wx, 0, wx + 40, 0); wg.addColorStop(0, dark(theme.brick, 0.2)); wg.addColorStop(1, light(theme.brick, 0.1));
        x.fillStyle = wg; x.fillRect(wx, ty, 40, th); x.strokeStyle = INK; x.lineWidth = 4; x.strokeRect(wx, ty, 40, th);
        x.strokeStyle = 'rgba(0,0,0,0.3)'; x.lineWidth = 2; for (let y = ty + 24; y < TUNNEL; y += 24) { x.beginPath(); x.moveTo(wx, y); x.lineTo(wx + 40, y); x.stroke(); }
      }
      // tunnel floor
      const fg = x.createLinearGradient(0, TUNNEL, 0, H); fg.addColorStop(0, light(theme.dirt, 0.1)); fg.addColorStop(1, theme.deep);
      x.fillStyle = fg; x.fillRect(0, TUNNEL, W, H - TUNNEL);
      x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(0, TUNNEL + 2, W, 3);
      x.strokeStyle = INK; x.lineWidth = 4; x.beginPath(); x.moveTo(0, TUNNEL); x.lineTo(W, TUNNEL); x.stroke();
      // the ladder, with wood grain
      const lx = room.ladder.x;
      for (const s of [-20, 20]) {
        x.strokeStyle = INK; x.lineWidth = 11; x.beginPath(); x.moveTo(lx + s, GROUND - 6); x.lineTo(lx + s, TUNNEL); x.stroke();
        x.strokeStyle = '#c68b59'; x.lineWidth = 6; x.stroke();
        x.strokeStyle = '#e0aa78'; x.lineWidth = 2; x.beginPath(); x.moveTo(lx + s - 1.5, GROUND); x.lineTo(lx + s - 1.5, TUNNEL - 4); x.stroke();
      }
      for (let y = GROUND + 14; y < TUNNEL; y += 26) {
        x.strokeStyle = INK; x.lineWidth = 9; x.beginPath(); x.moveTo(lx - 20, y); x.lineTo(lx + 20, y); x.stroke();
        x.strokeStyle = '#d29a66'; x.lineWidth = 5; x.stroke();
      }
    } else {
      // rocks and roots in the dirt
      for (let k = 0; k < 10; k++) {
        const rx = rnd() * W, ry = GROUND + 75 + rnd() * 120, rw = 12 + rnd() * 14;
        x.fillStyle = '#9a8f86'; x.strokeStyle = INK; x.lineWidth = 3;
        x.beginPath(); x.ellipse(rx, ry, rw, rw * 0.65, 0, 0, 7); x.fill(); x.stroke();
        x.fillStyle = '#c8bfb6'; x.beginPath(); x.ellipse(rx - rw * 0.3, ry - rw * 0.25, rw * 0.35, rw * 0.2, 0, 0, 7); x.fill();
      }
      for (let k = 0; k < 6; k++) {
        const rx = rnd() * W;
        x.strokeStyle = dark(theme.trunk, 0.3); x.lineWidth = 4;
        x.beginPath(); x.moveTo(rx, GROUND + 48); x.bezierCurveTo(rx + 20, GROUND + 80, rx - 20, GROUND + 100, rx + 10, GROUND + 130 + rnd() * 40); x.stroke();
      }
    }
    // the jungle path: dirt band with shading, grass with tufts on top
    let px = 0;
    const spans = [];
    for (const [a, b] of room.gaps.slice().sort((p, q) => p[0] - q[0])) { spans.push([px, a]); px = b; }
    spans.push([px, W]);
    for (const [a, b] of spans) {
      if (b - a < 2) continue;
      const pg = x.createLinearGradient(0, GROUND, 0, GROUND + 50);
      pg.addColorStop(0, light(theme.dirt, 0.1)); pg.addColorStop(1, dark(theme.dirt, 0.2));
      x.fillStyle = pg; x.fillRect(a, GROUND, b - a, 50);
      x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(a, GROUND + 34, b - a, 6);       // a darker soil stripe
      for (let k = 0; k < (b - a) / 40; k++) {             // pebbles
        const qx = a + 10 + rnd() * (b - a - 20), qy = GROUND + 20 + rnd() * 24;
        x.fillStyle = rnd() > 0.5 ? light(theme.dirt, 0.35) : dark(theme.dirt, 0.25);
        x.beginPath(); x.ellipse(qx, qy, 3 + rnd() * 4, 2.5, 0, 0, 7); x.fill();
      }
      // grass: base, darker underside drips, light top edge
      x.fillStyle = dark(theme.grass, 0.2); x.beginPath(); x.moveTo(a, GROUND);
      for (let gx = a; gx < b; gx += 16) x.quadraticCurveTo(gx + 8, GROUND + 22 + rnd() * 4, Math.min(b, gx + 16), GROUND + 14);
      x.lineTo(b, GROUND); x.fill();
      x.fillStyle = theme.grass; x.fillRect(a, GROUND, b - a, 13);
      x.fillStyle = light(theme.grass, 0.35); x.fillRect(a, GROUND, b - a, 4);
      x.strokeStyle = INK; x.lineWidth = 4; x.strokeRect(a, GROUND, b - a, 50);
      // grass tufts sticking up along the edge
      for (let gx = a + 8; gx < b - 8; gx += 26 + rnd() * 30) {
        if (room.sand && gx > room.sand.x0 - 10 && gx < room.sand.x1 + 10) continue;   // no grass on the quicksand
        if (room.ladder && Math.abs(gx - room.ladder.x) < 42) continue;                // or on the trapdoor
        x.fillStyle = theme.grass; x.strokeStyle = INK; x.lineWidth = 2.5;
        x.beginPath(); x.moveTo(gx - 7, GROUND + 1); x.lineTo(gx - 4, GROUND - 9); x.lineTo(gx - 1, GROUND - 2); x.lineTo(gx + 2, GROUND - 12); x.lineTo(gx + 4, GROUND - 2); x.lineTo(gx + 8, GROUND - 8); x.lineTo(gx + 9, GROUND + 1); x.closePath(); x.fill(); x.stroke();
        x.strokeStyle = light(theme.grass, 0.45); x.lineWidth = 1.5; x.beginPath(); x.moveTo(gx + 1.5, GROUND - 1); x.lineTo(gx + 2, GROUND - 8); x.stroke();
        if (rnd() > 0.75) D.circle(x, gx + 8, GROUND - 9, 3.5, ['#ffd166', '#ff8fab', '#ffffff'][Math.floor(rnd() * 3)], 1.5);   // a little flower
      }
    }
  }

  function drawBackground(ctx, t) {
    buildArt();
    const k = p ? Math.max(0, Math.min(1, (p.x + PW / 2) / W)) : 0.5;   // 0 at the left edge, 1 at the right
    ctx.drawImage(cvFar, -PAR_FAR * 2 * k, 0, W + PAR_FAR * 2, GROUND);
    // soft clouds drifting by
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let c = 0; c < 4; c++) {
      const cx = ((c * 290 + t * (8 + c * 3)) % (W + 240)) - 120, cy = 70 + (c % 2) * 50 + (roomI * 23 % 30);
      ctx.beginPath(); ctx.ellipse(cx, cy, 52, 15, 0, 0, 7); ctx.ellipse(cx - 22, cy - 9, 24, 15, 0, 0, 7); ctx.ellipse(cx + 18, cy - 12, 28, 17, 0, 0, 7); ctx.fill();
    }
    ctx.drawImage(cvMid, -PAR_MID * 2 * k, 0, W + PAR_MID * 2, GROUND + 4);
    // a strong branch for each vine (with bark shading)
    for (const v of room.vines) {
      const bg = ctx.createLinearGradient(0, v.py - 14, 0, v.py + 8);
      bg.addColorStop(0, light(theme.trunk, 0.25)); bg.addColorStop(1, dark(theme.trunk, 0.3));
      D.box(ctx, v.px - 160, v.py - 14, 320, 22, 10, bg, 4);
      ctx.strokeStyle = dark(theme.trunk, 0.35); ctx.lineWidth = 2;
      for (const bx of [-110, -40, 50, 120]) { ctx.beginPath(); ctx.moveTo(v.px + bx, v.py - 6); ctx.quadraticCurveTo(v.px + bx + 14, v.py - 2, v.px + bx + 26, v.py - 6); ctx.stroke(); }
      for (const bx of [-140, 130]) { ctx.save(); ctx.translate(v.px + bx, v.py - 14); ctx.fillStyle = theme.leaf2; ctx.beginPath(); ctx.ellipse(0, -6, 14, 7, -0.4, 0, 7); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
    }
  }

  function drawGround(ctx, t) {
    buildArt();
    ctx.drawImage(cvGround, 0, 0, W, H);
    if (room.ladder) {                                    // two little torches light up the tunnel
      for (const tx of [150, 690]) {                      // (kept away from the treasure spot)
        const ty = GROUND + 92;
        const gl = ctx.createRadialGradient(tx, ty, 4, tx, ty, 80); gl.addColorStop(0, 'rgba(255,200,100,0.45)'); gl.addColorStop(1, 'rgba(255,200,100,0)');
        ctx.fillStyle = gl; ctx.fillRect(tx - 80, ty - 80, 160, 160);
        D.box(ctx, tx - 5, ty, 10, 24, 3, '#8b5a2b', 3);
        const fl = Math.sin(t * 14 + tx) * 3;
        ctx.beginPath(); ctx.moveTo(tx - 9, ty + 2); ctx.quadraticCurveTo(tx + fl, ty - 30, tx + 9, ty + 2); ctx.closePath();
        ctx.fillStyle = '#ff8c42'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tx - 4, ty + 1); ctx.quadraticCurveTo(tx + fl * 0.5, ty - 16, tx + 4, ty + 1); ctx.fillStyle = '#ffd166'; ctx.fill();
      }
    }
    if (room.pond) drawPond(ctx, room.pond, t);
    if (room.sand) drawSand(ctx, room.sand, t);
    if (room.ladder) {                                    // the trapdoor in the path
      const lx = room.ladder.x;
      const tg = ctx.createLinearGradient(0, GROUND - 4, 0, GROUND + 10); tg.addColorStop(0, '#a8703a'); tg.addColorStop(1, '#6b4226');
      D.box(ctx, lx - 30, GROUND - 4, 60, 14, 4, tg, 4);
      ctx.fillStyle = INK; for (let k = -1; k <= 1; k++) ctx.fillRect(lx + k * 16 - 2, GROUND - 2, 4, 10);
      const bob = Math.sin(t * 4) * 4;                    // a down arrow hint
      ctx.beginPath(); ctx.moveTo(lx - 12, GROUND - 60 + bob); ctx.lineTo(lx + 12, GROUND - 60 + bob); ctx.lineTo(lx, GROUND - 44 + bob); ctx.closePath();
      ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    }
  }

  // soft dark oval under things standing on the ground
  function shadow(ctx, x, y, w) {
    ctx.fillStyle = 'rgba(30,20,10,0.25)'; ctx.beginPath(); ctx.ellipse(x, y, w, w * 0.22, 0, 0, 7); ctx.fill();
  }

  function drawPond(ctx, pd, t) {
    const { x0, x1 } = pd, top = GROUND + 26, bot = GROUND + 86;
    // the hole in the bank (dark mud walls)
    ctx.fillStyle = dark(theme.deep, 0.2); ctx.fillRect(x0, GROUND, x1 - x0, top - GROUND);
    const wg = ctx.createLinearGradient(0, top, 0, bot);
    wg.addColorStop(0, light(theme.water, 0.25)); wg.addColorStop(0.5, theme.water); wg.addColorStop(1, dark(theme.water, 0.3));
    ctx.fillStyle = wg; ctx.fillRect(x0, top, x1 - x0, bot - top);
    // light rays wobbling in the water
    ctx.save(); ctx.beginPath(); ctx.rect(x0, top, x1 - x0, bot - top); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let k = 0; k < 5; k++) { const rx = x0 + ((k * 90 + Math.sin(t + k) * 12) % (x1 - x0)); ctx.beginPath(); ctx.moveTo(rx, top); ctx.lineTo(rx + 22, top); ctx.lineTo(rx + 4, bot); ctx.lineTo(rx - 14, bot); ctx.fill(); }
    // ripples
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3;
    for (let k = 0; k < 7; k++) {
      const wx = x0 + 16 + ((k * 64 + t * 30) % (x1 - x0 - 36)), wy = top + 14 + (k % 3) * 13;
      ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 10, wy - 5, wx + 20, wy); ctx.stroke();
    }
    // sparkly shimmer line on the surface
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3; ctx.beginPath();
    for (let wx = x0; wx <= x1; wx += 10) { const wy = top + 3 + Math.sin(wx * 0.06 + t * 3) * 2; wx === x0 ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy); }
    ctx.stroke();
    for (let k = 0; k < 4; k++) { const sx = x0 + ((k * 113 + t * 40) % (x1 - x0)); D.star(ctx, sx, top + 6, 2 + Math.abs(Math.sin(t * 5 + k)) * 3, '#ffffff', 0); }
    ctx.restore();
    // shadow where the banks overhang
    for (const [ex, dir] of [[x0, 1], [x1, -1]]) {
      const sg = ctx.createLinearGradient(ex, 0, ex + dir * 26, 0); sg.addColorStop(0, 'rgba(0,0,0,0.3)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg; ctx.fillRect(Math.min(ex, ex + dir * 26), top, 26, bot - top);
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, GROUND + 14); ctx.lineTo(x0, bot); ctx.lineTo(x1, bot); ctx.lineTo(x1, GROUND + 14); ctx.stroke();
    for (const h of room.hippos) drawHippo(ctx, h, t);
  }

  // Hippos: only the top of the head pokes out. They blink, wiggle their ears,
  // puff from their nostrils, yawn now and then, and squish when you stand on them.
  function drawHippo(ctx, h, t) {
    const up = hippoUp(h, t);
    const y = GROUND + 6 + (1 - up) * 60;
    const body = '#9a8fbf', cx = h.cx;
    const standing = p && p.onGround && p.mode === 'walk' && Math.abs(p.x + PW / 2 - cx) < 44 && p.y + PH >= GROUND - 1 && room.gaps.some(([a, b]) => cx > a && cx < b);
    const k = (t + h.ph * 3) % 7, yawn = k > 5.2 && k < 6.4 ? Math.sin((k - 5.2) / 1.2 * Math.PI) : 0;
    const blink = ((t + h.ph) % 3.1) < 0.14 || yawn > 0.3;
    ctx.save();
    ctx.beginPath(); ctx.rect(cx - 80, 0, 160, GROUND + 30); ctx.clip();      // the part under water is hidden
    ctx.translate(cx, GROUND + 30);
    if (standing) ctx.scale(1.07, 0.88);                  // squish!
    ctx.translate(-cx, -(GROUND + 30));
    // ears (wiggle)
    for (const s of [-1, 1]) {
      const wig = Math.sin(t * 9 + h.ph + s) * (Math.sin(t * 0.7 + h.ph) > 0.6 ? 0.35 : 0.05);
      ctx.save(); ctx.translate(cx + s * 25, y - 18); ctx.rotate(s * 0.25 + wig);
      ctx.beginPath(); ctx.ellipse(0, -2, 6.5, 8.5, 0, 0, 7); ctx.fillStyle = body; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, -1, 3, 5, 0, 0, 7); ctx.fillStyle = '#ffb3c6'; ctx.fill();
      ctx.restore();
    }
    // head
    const hg = ctx.createLinearGradient(0, y - 26, 0, y + 12);
    hg.addColorStop(0, light(body, 0.28)); hg.addColorStop(0.6, body); hg.addColorStop(1, dark(body, 0.28));
    ctx.beginPath(); ctx.ellipse(cx, y + 6, 46, 27, 0, Math.PI, 0); ctx.closePath();
    ctx.fillStyle = hg; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(cx - 16, y - 13, 14, 5, -0.3, 0, 7); ctx.fill();   // shiny back
    ctx.fillStyle = dark(body, 0.15); for (const [sx, sy] of [[-30, -4], [22, -12], [32, -2]]) { ctx.beginPath(); ctx.arc(cx + sx, y + sy, 2.2, 0, 7); ctx.fill(); }   // freckles
    // eyes on little bumps
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.ellipse(cx + s * 13, y - 8, 9, 8, 0, Math.PI, 0); ctx.fillStyle = light(body, 0.15); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      if (blink) { ctx.beginPath(); ctx.arc(cx + s * 13, y - 8, 4.5, 0.2, Math.PI - 0.2); ctx.lineWidth = 2.5; ctx.stroke(); }
      else { D.circle(ctx, cx + s * 13, y - 8, 5.5, '#ffffff', 2.5); D.circle(ctx, cx + s * 13 + 1, y - 8, 3, INK, 0); D.circle(ctx, cx + s * 13 + 2, y - 9.5, 1.1, '#fff', 0); }
    }
    // a yawn: a big pink mouth with two round teeth
    if (yawn > 0.05) {
      ctx.beginPath(); ctx.ellipse(cx, y + 6, 18 * yawn + 4, 14 * yawn + 2, 0, Math.PI, 0); ctx.closePath();
      ctx.fillStyle = '#d9426b'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = "#ff8fab"; ctx.beginPath(); ctx.ellipse(cx, y + 6, 10 * yawn, 5 * yawn, 0, Math.PI, 0); ctx.fill();   // tongue
      for (const s of [-1, 1]) D.box(ctx, cx + s * 9 * yawn - 3, y - 2 * yawn + 3, 6, 7, 2, '#ffffff', 2);
    }
    // nostrils, with a little puff of air sometimes
    ctx.fillStyle = dark(body, 0.4); ctx.beginPath(); ctx.ellipse(cx - 6, y + 1 - yawn * 10, 2.6, 1.9, 0, 0, 7); ctx.ellipse(cx + 6, y + 1 - yawn * 10, 2.6, 1.9, 0, 0, 7); ctx.fill();
    const puff = (t * 0.6 + h.ph) % 2.4;
    if (puff < 0.6 && up > 0.9) for (const s of [-1, 1]) D.circle(ctx, cx + s * (7 + puff * 12), y - 4 - puff * 22, 3 + puff * 6, `rgba(255,255,255,${0.8 - puff})`, 0);
    ctx.fillStyle = 'rgba(255,120,150,0.6)'; ctx.beginPath(); ctx.arc(cx - 28, y + 3, 4.5, 0, 7); ctx.arc(cx + 28, y + 3, 4.5, 0, 7); ctx.fill();
    ctx.restore();
    // a ring of ripples where the hippo meets the water
    if (up > 0.05) { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(cx, GROUND + 30, (standing ? 56 : 50) + Math.sin(t * 4 + h.ph) * 3, 5, 0, 0, 7); ctx.stroke(); }
    if (up < 0.9 && up > 0.05) for (let k2 = 0; k2 < 3; k2++) { const q = (t * 2 + k2 * 0.33) % 1; D.circle(ctx, cx - 20 + k2 * 20, GROUND + 28 - q * 14, 2 + q * 3, 'rgba(255,255,255,0.9)', 2); }   // bubbles
  }

  function drawSand(ctx, sd, t) {
    const o = sd.open, c = (sd.x0 + sd.x1) / 2, hw = (sd.x1 - sd.x0) / 2;
    // the sand patch on the path (always visible so you know where it is)
    const sg = ctx.createLinearGradient(0, GROUND, 0, GROUND + 14); sg.addColorStop(0, '#f6d98a'); sg.addColorStop(1, '#d9ac55');
    ctx.fillStyle = sg; ctx.fillRect(sd.x0, GROUND, sd.x1 - sd.x0, 14);
    ctx.fillStyle = 'rgba(150,100,40,0.45)';
    for (let x = sd.x0 + 6; x < sd.x1; x += 13) { ctx.beginPath(); ctx.arc(x, GROUND + 4 + ((x * 7) % 8), 1.5, 0, 7); ctx.fill(); }
    ctx.strokeStyle = 'rgba(160,110,40,0.6)'; ctx.lineWidth = 2;
    for (let x = sd.x0 + 10; x < sd.x1; x += 24) { ctx.beginPath(); ctx.arc(x, GROUND + 6, 4, 0, Math.PI); ctx.stroke(); }
    if (o > 0.05) {                                       // open: a swirly sinking pit with bubbles
      const w = hw * o;
      const pg = ctx.createRadialGradient(c, GROUND + 4, 4, c, GROUND + 4, w);
      pg.addColorStop(0, '#8a6334'); pg.addColorStop(1, '#d7ae6e');
      ctx.beginPath(); ctx.ellipse(c, GROUND + 4, w, 16 + 10 * o, 0, 0, 7);
      ctx.fillStyle = pg; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.save(); ctx.translate(c, GROUND + 4); ctx.rotate(t * 3); ctx.strokeStyle = '#a07a4a'; ctx.lineWidth = 3;
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(0, 0, w * (0.3 + k * 0.22), 6 + k * 3, 0, 0, 4.5); ctx.stroke(); }
      ctx.restore();
      for (let k = 0; k < 3; k++) {
        const ph = (t * 1.3 + k * 0.33) % 1;
        D.circle(ctx, c - w * 0.5 + k * w * 0.5, GROUND + 4 - ph * 10, 2 + ph * 4, 'rgba(255,240,200,0.7)', 2);
      }
    }
  }

  function drawVine(ctx, v, t) {
    const tip = vineTip(v, t);
    ctx.lineCap = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(v.px, v.py); ctx.lineTo(tip.x, tip.y); ctx.stroke();
    ctx.strokeStyle = '#3f9e4a'; ctx.lineWidth = 6; ctx.stroke();
    ctx.strokeStyle = '#7bd389'; ctx.lineWidth = 2; ctx.setLineDash([8, 7]); ctx.stroke(); ctx.setLineDash([]);   // twisty look
    // leaves along it, on both sides
    for (let k = 1; k < 7; k++) {
      const f = k / 7, lx = v.px + (tip.x - v.px) * f, ly = v.py + (tip.y - v.py) * f, s = k % 2 ? 1 : -1;
      ctx.save(); ctx.translate(lx, ly); ctx.rotate(tip.a * -1 + s * 0.7);
      ctx.beginPath(); ctx.ellipse(s * 9, 0, 10, 5, 0, 0, 7); ctx.fillStyle = s > 0 ? '#6cc04a' : '#5cae44'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(s * 2, 0); ctx.lineTo(s * 15, 0); ctx.stroke();
      ctx.restore();
    }
    D.circle(ctx, tip.x, tip.y, 9, '#6cc04a', 3);         // the handle at the end
    D.circle(ctx, tip.x - 3, tip.y - 3, 3, '#b9fbc0', 0);
  }

  // A log rolling along the path: a side view with bark that rolls past and
  // rings on the end. (l.a counts how far it has rolled.)
  function drawLog(ctx, l) {
    const x = l.x, cy = GROUND - 20, hw = 32, r = 20;
    shadow(ctx, x, GROUND + 1, 34);
    const bob = Math.abs(Math.sin(l.a * 2)) * 1.5;
    ctx.save(); ctx.translate(0, -bob);
    // the round body (a capsule)
    const lg = ctx.createLinearGradient(0, cy - r, 0, cy + r); lg.addColorStop(0, '#c98d55'); lg.addColorStop(0.45, '#a8693a'); lg.addColorStop(1, '#6b4226');
    D.rr(ctx, x - hw, cy - r, hw * 2, r * 2, r); ctx.fillStyle = lg; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    // bark lines that scroll around as it rolls
    ctx.save(); D.rr(ctx, x - hw, cy - r, hw * 2, r * 2, r); ctx.clip();
    ctx.strokeStyle = 'rgba(60,35,15,0.55)'; ctx.lineWidth = 2.5;
    for (let k = 0; k < 4; k++) {
      const yy = cy - r + ((k * 11 - l.a * 14) % 44 + 44) % 44;
      ctx.beginPath(); ctx.moveTo(x - hw + 4, yy); ctx.quadraticCurveTo(x, yy + 3, x + hw - 22, yy - 1); ctx.stroke();
    }
    // a knot that rolls over the top
    const kn = ((-l.a * 14) % 60 + 60) % 60 - 20;
    if (kn > -18 && kn < 22) { ctx.beginPath(); ctx.ellipse(x + 2, cy + kn, 5, 3, 0, 0, 7); ctx.fillStyle = '#5a361c'; ctx.fill(); }
    ctx.fillStyle = 'rgba(255,230,180,0.35)'; ctx.fillRect(x - hw + 10, cy - r + 5, hw * 2 - 30, 4);    // highlight
    ctx.restore();
    // the cut end (it rolls toward you, on the left) with tree rings that spin
    ctx.save(); ctx.translate(x - hw + r * 0.55, cy);
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.6, r - 1, 0, 0, 7); ctx.fillStyle = '#e9c08a'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.rotate(l.a); ctx.strokeStyle = '#b07c48'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.4, r * 0.66, 0, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.2, r * 0.33, 0, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r * 0.7); ctx.stroke();       // a crack (shows it turning)
    ctx.restore();
    ctx.restore();
    // little dust puffs kicked up behind
    for (let k = 0; k < 2; k++) { const q = ((l.a * -0.4 + k * 0.5) % 1 + 1) % 1; D.circle(ctx, x + hw + q * 26, GROUND - 4 - q * 10, 3 + q * 5, `rgba(230,200,150,${0.6 * (1 - q)})`, 0); }
  }

  // A sleepy snake, coiled up on the path. It breathes, and now and then
  // lifts its head, opens its eyes and flicks its tongue.
  function drawSnake(ctx, s, t) {
    const x = s.x, y = GROUND;
    shadow(ctx, x, y + 1, 36);
    const body = '#7bd389', belly = '#e9f5c8';
    const breathe = 1 + Math.sin(t * 2 + x) * 0.03;
    const look = Math.max(0, Math.sin(t * 0.8 + x * 0.01) * 1.6 - 0.6);     // 0 = asleep, up to 1 = looking around
    const sway = Math.sin(t * 2.4 + x) * 3;
    const seg = (cx, cy, rx, ry) => {
      const g = ctx.createLinearGradient(0, cy - ry, 0, cy + ry); g.addColorStop(0, light(body, 0.3)); g.addColorStop(0.55, body); g.addColorStop(1, dark(body, 0.25));
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = 'rgba(40,110,60,0.45)';                                       // diamond scale pattern
      for (let k = -rx + 8; k < rx - 6; k += 11) { ctx.beginPath(); ctx.moveTo(cx + k, cy - ry * 0.55); ctx.lineTo(cx + k + 4, cy - ry * 0.15); ctx.lineTo(cx + k, cy + ry * 0.2); ctx.lineTo(cx + k - 4, cy - ry * 0.15); ctx.fill(); }
    };
    ctx.save(); ctx.translate(x, y); ctx.scale(breathe, breathe); ctx.translate(-x, -y);
    // the tail curling out in front
    ctx.beginPath(); ctx.moveTo(x + 26, y - 6); ctx.quadraticCurveTo(x + 46, y - 4, x + 44 + sway * 0.5, y - 16);
    ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 11; ctx.stroke(); ctx.strokeStyle = body; ctx.lineWidth = 6; ctx.stroke();
    seg(x, y - 10, 30, 11);
    ctx.fillStyle = belly; ctx.beginPath(); ctx.ellipse(x, y - 4, 22, 3.5, 0, 0, 7); ctx.fill();
    seg(x - 3, y - 22, 21, 9);
    // neck and head (rises when it wakes up)
    const hx = x - 18 + sway, hy = y - 36 - look * 16;
    ctx.beginPath(); ctx.moveTo(x - 10, y - 26); ctx.quadraticCurveTo(x - 20, y - 30, hx + 2, hy + 6);
    ctx.strokeStyle = INK; ctx.lineWidth = 14; ctx.stroke(); ctx.strokeStyle = body; ctx.lineWidth = 9; ctx.stroke();
    const hg = ctx.createRadialGradient(hx - 3, hy - 4, 2, hx, hy, 14); hg.addColorStop(0, light(body, 0.35)); hg.addColorStop(1, body);
    ctx.beginPath(); ctx.ellipse(hx - 2, hy, 14, 10, -0.1, 0, 7); ctx.fillStyle = hg; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(hx - 4, hy - 6, 5, 2.2, -0.2, 0, 7); ctx.fill();
    // eyes: sleepy arcs, or open and blinking when awake
    for (const ex of [hx - 8, hx + 2]) {
      if (look > 0.4 && ((t + x) % 2.3) > 0.15) { D.circle(ctx, ex, hy - 2, 3.6, '#ffffff', 2); D.circle(ctx, ex - 1, hy - 2, 2, INK, 0); D.circle(ctx, ex - 1.5, hy - 3, 0.8, '#fff', 0); }
      else { ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(ex, hy - 2, 3, 0.2, Math.PI - 0.2); ctx.stroke(); }
    }
    ctx.fillStyle = 'rgba(255,120,150,0.6)'; ctx.beginPath(); ctx.arc(hx - 12, hy + 4, 2.8, 0, 7); ctx.fill();
    ctx.restore();
    // tongue flick (only while awake)
    if (look > 0.4 && (t * 3 + x) % 1.4 < 0.35) {
      ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(hx - 15, hy + 3); ctx.lineTo(hx - 24, hy + 4); ctx.lineTo(hx - 28, hy + 1); ctx.moveTo(hx - 24, hy + 4); ctx.lineTo(hx - 28, hy + 7); ctx.stroke();
    }
    if (look < 0.3) D.text(ctx, 'z', x + 12, y - 50 - ((t * 20) % 20), { size: 18, color: '#ffffff' });   // still asleep: "z"
  }

  // A friendly bat in the tunnel: three wing frames (up, middle, down), little feet.
  function drawBat(ctx, b, t) {
    const frame = Math.floor(t * 12 + b.ph * 5) % 4;               // 0 up, 1 mid, 2 down, 3 mid
    const wingY = [-16, -2, 12, -2][frame], tipX = [34, 40, 34, 40][frame];
    const dir = Math.cos(t * 0.9 + b.ph) >= 0 ? 1 : -1;            // facing the way it flies
    ctx.save(); ctx.translate(b.x, b.y + (frame === 2 ? 2 : 0)); ctx.scale(dir, 1);
    for (const s of [-1, 1]) {
      ctx.save(); ctx.scale(s, 1);
      ctx.beginPath(); ctx.moveTo(8, -4);
      ctx.quadraticCurveTo(20, wingY - 6, tipX, wingY);
      ctx.quadraticCurveTo(tipX - 4, wingY + 8, tipX - 10, wingY + 10);      // scalloped bottom edge (wing "fingers")
      ctx.quadraticCurveTo(tipX - 14, wingY + 4, tipX - 20, wingY + 10);
      ctx.quadraticCurveTo(14, wingY + 6, 8, 6); ctx.closePath();
      const wg = ctx.createLinearGradient(0, wingY - 6, 0, wingY + 12); wg.addColorStop(0, '#9a8ee8'); wg.addColorStop(1, '#5e52b0');
      ctx.fillStyle = wg; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(tipX - 10, wingY + 8); ctx.moveTo(10, 0); ctx.lineTo(tipX - 20, wingY + 8); ctx.stroke();
      ctx.restore();
    }
    // ears, round body, a fuzzy tummy, big eyes, a little smile and feet
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 4, -10); ctx.lineTo(s * 9, -20); ctx.lineTo(s * 11, -7); ctx.closePath(); ctx.fillStyle = '#8676c8'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke(); }
    const bg = ctx.createRadialGradient(-4, -5, 2, 0, 0, 14); bg.addColorStop(0, '#c9bff2'); bg.addColorStop(1, '#7d6dc4');
    D.circle(ctx, 0, 0, 13, bg, 3.5);
    ctx.fillStyle = '#d9d0fa'; ctx.beginPath(); ctx.ellipse(0, 5, 7, 6, 0, 0, 7); ctx.fill();
    const bl = ((t + b.ph) % 2.7) < 0.12;
    for (const s of [-1, 1]) {
      if (bl) { ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s * 5 - 3, -3); ctx.lineTo(s * 5 + 3, -3); ctx.stroke(); }
      else { D.circle(ctx, s * 5, -3, 3.8, '#ffffff', 1.5); D.circle(ctx, s * 5 + 0.8, -3, 2, INK, 0); D.circle(ctx, s * 5 + 1.4, -3.8, 0.8, '#fff', 0); }
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 2, 3, 0.3, Math.PI - 0.3); ctx.stroke();
    ctx.fillStyle = 'rgba(255,140,170,0.6)'; ctx.beginPath(); ctx.arc(-8, 3, 2, 0, 7); ctx.arc(8, 3, 2, 0, 7); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-3, 12); ctx.lineTo(-4, 16); ctx.moveTo(3, 12); ctx.lineTo(4, 16); ctx.stroke();
    ctx.restore();
  }

  function drawTreasure(ctx, tr, t) {
    const bob = Math.sin(t * 3 + tr.x) * 5;
    ctx.save(); ctx.translate(tr.x, tr.y + bob);
    // turning light rays + a glow so it's easy to spot
    ctx.save(); ctx.rotate(t * 0.8); ctx.fillStyle = 'rgba(255,240,170,0.35)';
    for (let k = 0; k < 8; k++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-7, -52); ctx.lineTo(7, -52); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    const gl = ctx.createRadialGradient(0, 0, 4, 0, 0, 40); gl.addColorStop(0, 'rgba(255,240,170,0.9)'); gl.addColorStop(1, 'rgba(255,240,170,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, 40, 0, 7); ctx.fill();
    drawTreasureIcon(ctx, tr.kind);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(-7, -8, 5, 2.5, -0.6, 0, 7); ctx.fill();   // shine
    for (let k = 0; k < 3; k++) { const a = t * 2 + k * 2.1; D.star(ctx, Math.cos(a) * 26, Math.sin(a) * 22, 2 + Math.abs(Math.sin(t * 5 + k)) * 4, '#ffffff', 1.5); }
    ctx.restore();
  }
  function drawTreasureIcon(ctx, kind) {
    ctx.lineJoin = 'round';
    if (kind === 'gem') {
      ctx.beginPath(); ctx.moveTo(-18, -6); ctx.lineTo(-9, -18); ctx.lineTo(9, -18); ctx.lineTo(18, -6); ctx.lineTo(0, 20); ctx.closePath();
      ctx.fillStyle = '#ef476f'; ctx.fill();
      ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.moveTo(-9, -18); ctx.lineTo(0, -6); ctx.lineTo(9, -18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c9184a'; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(18, -6); ctx.lineTo(0, 20); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-18, -6); ctx.lineTo(-9, -18); ctx.lineTo(9, -18); ctx.lineTo(18, -6); ctx.lineTo(0, 20); ctx.closePath();
      ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-18, -6); ctx.lineTo(18, -6); ctx.lineWidth = 2.5; ctx.stroke();
    } else if (kind === 'crown') {
      ctx.beginPath(); ctx.moveTo(-20, 12); ctx.lineTo(-20, -10); ctx.lineTo(-10, 0); ctx.lineTo(0, -16); ctx.lineTo(10, 0); ctx.lineTo(20, -10); ctx.lineTo(20, 12); ctx.closePath();
      const cg = ctx.createLinearGradient(0, -16, 0, 12); cg.addColorStop(0, '#fff0a8'); cg.addColorStop(1, '#f2b705');
      ctx.fillStyle = cg; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      D.circle(ctx, 0, 4, 4, '#ef476f', 2); D.circle(ctx, -12, 6, 3, '#118ab2', 2); D.circle(ctx, 12, 6, 3, '#06d6a0', 2);
    } else if (kind === 'coins') {
      ctx.beginPath(); ctx.moveTo(-16, 18); ctx.quadraticCurveTo(-22, -4, -6, -10); ctx.lineTo(6, -10); ctx.quadraticCurveTo(22, -4, 16, 18); ctx.closePath();
      const bg = ctx.createLinearGradient(-16, 0, 16, 0); bg.addColorStop(0, '#9a6638'); bg.addColorStop(0.6, '#c68b59'); bg.addColorStop(1, '#d9a066');
      ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      D.circle(ctx, 0, 5, 8, '#ffc93c', 3); D.circle(ctx, -2, 3, 3, '#fff3b0', 0); D.box(ctx, -8, -17, 16, 8, 3, '#e9c46a', 3);
    } else if (kind === 'goldbar') {
      ctx.beginPath(); ctx.moveTo(-22, 12); ctx.lineTo(-14, -8); ctx.lineTo(14, -8); ctx.lineTo(22, 12); ctx.closePath();
      const gg = ctx.createLinearGradient(0, -8, 0, 12); gg.addColorStop(0, '#ffe066'); gg.addColorStop(1, '#e0a400');
      ctx.fillStyle = gg; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(-10, -4, 8, 4);
    } else {                                             // ring
      ctx.beginPath(); ctx.arc(0, 6, 13, 0, 7); ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = '#ffd166'; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 6, 13, 3.6, 4.6); ctx.lineWidth = 2; ctx.strokeStyle = '#fff3b0'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-7, -10); ctx.lineTo(0, -20); ctx.lineTo(7, -10); ctx.lineTo(0, -4); ctx.closePath();
      ctx.fillStyle = '#9bf6ff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    }
  }

  function drawCamp(ctx, c, t) {
    const x = c.x + 60;
    shadow(ctx, x, GROUND + 2, 100);
    // the tent: a sunny side and a shady side, with stripes
    ctx.beginPath(); ctx.moveTo(x - 90, GROUND); ctx.lineTo(x, GROUND - 130); ctx.lineTo(x + 90, GROUND); ctx.closePath();
    ctx.fillStyle = '#ef476f'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, GROUND - 130); ctx.lineTo(x + 90, GROUND); ctx.lineTo(x, GROUND); ctx.closePath(); ctx.fillStyle = '#c9184a'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 6;
    for (const f of [0.35, 0.65]) { ctx.beginPath(); ctx.moveTo(x - 90 * f, GROUND - 130 * (1 - f)); ctx.lineTo(x - 90 * f + 12, GROUND); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x - 90, GROUND); ctx.lineTo(x, GROUND - 130); ctx.lineTo(x + 90, GROUND); ctx.closePath();
    ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, GROUND - 130); ctx.lineTo(x - 22, GROUND); ctx.lineTo(x + 22, GROUND); ctx.closePath();
    ctx.fillStyle = '#5a2f18'; ctx.fill(); ctx.stroke();
    // a little flag on top and a campfire with a warm glow
    ctx.beginPath(); ctx.moveTo(x, GROUND - 130); ctx.lineTo(x, GROUND - 170); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, GROUND - 170); ctx.lineTo(x + 32, GROUND - 160 + Math.sin(t * 5) * 3); ctx.lineTo(x, GROUND - 150); ctx.closePath();
    ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    const fx0 = c.x - 70;
    const gl = ctx.createRadialGradient(fx0, GROUND - 20, 4, fx0, GROUND - 20, 90); gl.addColorStop(0, 'rgba(255,190,90,0.5)'); gl.addColorStop(1, 'rgba(255,190,90,0)');
    ctx.fillStyle = gl; ctx.fillRect(fx0 - 90, GROUND - 110, 180, 180);
    for (let k = 0; k < 5; k++) D.circle(ctx, fx0 - 28 + k * 14, GROUND - 3, 6, k % 2 ? '#9a8f86' : '#b8aea4', 2.5);   // stones around the fire
    D.box(ctx, fx0 - 26, GROUND - 12, 52, 10, 4, '#8b5a2b', 3);
    for (const [ox, h, col] of [[-10, 34, '#ff8c42'], [8, 28, '#ffd166'], [0, 44, '#ef476f']]) {
      const fl = Math.sin(t * 12 + ox) * 4;
      ctx.beginPath(); ctx.moveTo(fx0 + ox - 9, GROUND - 12); ctx.quadraticCurveTo(fx0 + ox + fl, GROUND - 12 - h, fx0 + ox + 9, GROUND - 12); ctx.closePath();
      ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
    }
    for (let k = 0; k < 3; k++) { const ph = (t * 0.8 + k / 3) % 1; D.circle(ctx, fx0 + Math.sin(ph * 6 + k) * 6, GROUND - 50 - ph * 40, 2.5, 'rgba(255,220,120,' + (1 - ph) + ')', 0); }   // sparks
  }

  // Big dark leaves in the bottom corners, in front of everything (makes it feel deep)
  function drawForeground(ctx, t) {
    const base = dark(theme.leaf, 0.35);
    const frond = (x, y, rot, len, sway) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot + Math.sin(t * 1.2 + x) * sway);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, -len * 0.28, len, 0); ctx.quadraticCurveTo(len * 0.5, len * 0.12, 0, 0);
      ctx.fillStyle = base; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.strokeStyle = light(base, 0.25); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(6, -1); ctx.quadraticCurveTo(len * 0.5, -len * 0.1, len - 8, -1); ctx.stroke();
      ctx.restore();
    };
    const k = room.ladder ? 0.6 : 1;                     // smaller in tunnel rooms (you walk down there)
    for (const [x, rot, len] of [[-10, -0.9, 110], [-14, -0.45, 125], [-10, -0.1, 100]]) frond(x, H + 6, rot, len * k, 0.05);
    for (const [x, rot, len] of [[W + 10, Math.PI + 0.9, 110], [W + 14, Math.PI + 0.45, 125], [W + 10, Math.PI + 0.1, 100]]) frond(x, H + 6, rot, len * k, 0.05);
  }

  // ---------------------------------------------------------------
  // Unlocks: hats for your explorer, and a parrot friend
  // ---------------------------------------------------------------
  const HATS = [
    { id: 'safari',  name: 'Safari hat',  need: null },
    { id: 'pirate',  name: 'Pirate hat',  need: 'Finish River Run',        ok: g => !!(g.save.levels.river || {}).done },
    { id: 'cowboy',  name: 'Cowboy hat',  need: 'Find 10 treasures',       ok: g => treasureCount(g) >= 10 },
    { id: 'flower',  name: 'Flower crown', need: 'Gold on Deep Jungle',    ok: g => (g.save.levels.deep || {}).medal === 'gold' },
    { id: 'crown',   name: 'Golden crown', need: 'Gold on every adventure', ok: g => ADVENTURES.every(a => (g.save.levels[a.id] || {}).medal === 'gold') },
  ];
  function treasureCount(g) { return g.save.data.treasures || 0; }     // every treasure you've ever picked up
  const hatOk = (g, h) => !h.ok || g.isUnlocked('hat-' + h.id);
  function pickedHat(g) { return HATS.find(h => h.id === g.save.data.hat && hatOk(g, h)) || HATS[0]; }
  function checkUnlocks(g) {
    for (const h of HATS) if (h.ok && h.ok(g)) g.unlock('hat-' + h.id, h.name + '!');
    if ((g.save.levels.temple || {}).medal === 'gold') g.unlock('pet-parrot', 'A parrot friend!');
  }
  function hatPic(id) {
    const c = document.createElement('canvas'); c.width = 120; c.height = 120;
    const x = c.getContext('2d'); x.translate(60, 112); x.scale(1.25, 1.25);
    const was = hatId; hatId = id;
    drawExplorer(x, { x: -PW / 2, y: -PH, w: PW, h: PH, vx: 0, vy: 0, onGround: true, face: 1, mode: 'walk', run: 0 }, 0, true);
    hatId = was;
    return c.toDataURL();
  }
  function extraMenu(g) {
    checkUnlocks(g);
    const wrap = Arcade.h('div');
    wrap.appendChild(Arcade.h('h2', { class: 'ar-title', style: 'font-size:24px' }, 'Hats'));
    const row = Arcade.h('div', { class: 'ar-btns' });
    const paint = () => {
      row.innerHTML = '';
      for (const h of HATS) {
        const ok = hatOk(g, h), on = pickedHat(g).id === h.id;
        const b = Arcade.h('button', { type: 'button', 'data-hat': h.id, class: 'ar-tile' + (on ? ' picked' : '') + (ok ? '' : ' locked'), style: 'min-height:0;width:130px;padding:6px' },
          `<img src="${hatPic(h.id)}" alt="" style="width:80px;height:80px;display:block;margin:0 auto"><div style="font-size:15px">${h.name}</div><div class="meta" style="font-size:12px">${ok ? '' : h.need}</div>` + (ok ? '' : `<div class="lock">${icons.lock}</div>`));
        b.addEventListener('click', () => { if (!ok) { Arcade.sfx('bonk'); return; } Arcade.sfx('click'); g.save.data.hat = h.id; g.store(); paint(); });
        row.appendChild(b);
      }
    };
    paint();
    wrap.appendChild(row);
    // the parrot friend
    const has = g.isUnlocked('pet-parrot');
    wrap.appendChild(Arcade.h('h2', { class: 'ar-title', style: 'font-size:24px;margin-top:14px' }, 'Friend'));
    const prow = Arcade.h('div', { class: 'ar-btns' });
    const pb = Arcade.h('button', { type: 'button', 'data-pet': '1', class: 'ar-tile' + (has ? (g.save.data.pet ? ' picked' : '') : ' locked'), style: 'min-height:0;width:160px;padding:6px' },
      `<div class="pic" style="height:60px"><img src="${parrotPic()}" alt="" style="height:60px"></div><div style="font-size:15px">Parrot ${has ? (g.save.data.pet ? '(on)' : '(off)') : ''}</div><div class="meta" style="font-size:12px">${has ? 'Tap to take it along' : 'Gold on Lost Temple'}</div>` + (has ? '' : `<div class="lock">${icons.lock}</div>`));
    pb.addEventListener('click', () => { if (!has) { Arcade.sfx('bonk'); return; } Arcade.sfx('click'); g.save.data.pet = !g.save.data.pet; g.store(); wrap.replaceWith(extraMenu(g)); });
    prow.appendChild(pb); wrap.appendChild(prow);
    return wrap;
  }
  // the parrot picture for the menu, drawn with the same code as in the game
  function parrotPic() {
    const c = document.createElement('canvas'); c.width = 120; c.height = 120;
    const x = c.getContext('2d'); x.translate(60, 66); x.scale(2.6, 2.6); drawParrot(x, 0, 0, 0, false);
    return c.toDataURL();
  }
  // ---------------------------------------------------------------
  // The explorer: a kid in a big safari hat with a backpack.
  // Drawn from simple parts (legs with knees, arms with elbows) so it can
  // really animate: a run cycle, jump and fall poses, hanging from a vine,
  // climbing, a squash when landing, breathing and blinking.
  // ---------------------------------------------------------------
  const SKIN = '#f2c9a0', SKIN_DK = '#d9a77c', SHIRT = '#f4d98a', SHIRT_DK = '#c9a24f', SHORTS = '#b08850', SHORTS_DK = '#8a6a3c';
  let landT = 0, wasGround = true;                         // for the little squash when you land (drawing only)

  // a limb with a joint: from (x,y), first part at angle a1, second at a2
  // (angles measured from straight down; positive points forward)
  function limb(ctx, x, y, a1, l1, a2, l2, col, w) {
    const kx = x + Math.sin(a1) * l1, ky = y + Math.cos(a1) * l1;
    const ex = kx + Math.sin(a2) * l2, ey = ky + Math.cos(a2) * l2;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(kx, ky); ctx.lineTo(ex, ey);
    ctx.strokeStyle = INK; ctx.lineWidth = w + 4.5; ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
    return { x: ex, y: ey, a: a2 };
  }
  function boot(ctx, f, back) {
    ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(-f.a * 0.6);
    ctx.beginPath(); ctx.moveTo(-5, -6); ctx.lineTo(4, -6); ctx.quadraticCurveTo(11, -5, 11, 2); ctx.lineTo(-6, 2); ctx.closePath();
    ctx.fillStyle = back ? '#4e2f1a' : '#6b4226'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = '#2b1a0e'; ctx.fillRect(-6, 0, 17, 3);                       // the sole
    if (!back) { ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(1, -4, 5, 2); }   // shine
    ctx.restore();
  }
  function hand(ctx, h, back) { D.circle(ctx, h.x, h.y, 4.2, back ? SKIN_DK : SKIN, 2.5); }

  function drawExplorer(ctx, pl, t, menu) {
    const x = pl.x + PW / 2, y = pl.y + PH;
    const mode = pl.mode || 'walk';
    const air = !pl.onGround && mode === 'walk', run = pl.onGround && Math.abs(pl.vx) > 20;
    const hurt = (pl.stun || 0) > 0;
    const ph = pl.run || 0;
    ctx.save();
    if (mode === 'vine' && pl.vine) {
      // hanging from the vine: hands on the handle, body swings with it
      const tip = vineTip(pl.vine, t);
      ctx.translate(tip.x, tip.y); ctx.rotate(-tip.a * 0.8); ctx.translate(0, 62);
    } else {
      ctx.translate(x, y);
      // squash on landing, a gentle breath when standing still
      if (!menu) {
        if (pl.onGround && !wasGround && mode === 'walk') landT = 0.16;
        wasGround = pl.onGround || mode !== 'walk';
      }
      const k = landT > 0 ? landT / 0.16 : 0;
      const breathe = !run && pl.onGround && !k ? Math.sin(t * 3) * 0.015 : 0;
      ctx.scale(1 + k * 0.16, 1 - k * 0.14 + breathe);
    }
    ctx.scale(pl.face || 1, 1);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    // ---- work out the pose ----
    let bob = 0, legs, arms, lean = 0;
    if (mode === 'vine') {
      const sw = pl.vine ? math.clamp(vineTip(pl.vine, t).vx / 500, -1, 1) * (pl.face || 1) : 0;
      legs = [[-0.5 - sw * 0.3, -0.1 - sw * 0.3], [-0.2 - sw * 0.3, 0.3 - sw * 0.2]];   // trailing behind, knees bent
      arms = [[Math.PI - 0.12, Math.PI - 0.05], [Math.PI + 0.12, Math.PI + 0.05]];      // both up on the handle
    } else if (mode === 'ladder') {
      const c = (pl.climbT || 0) * 9, s = Math.sin(c);
      legs = [[0.5 + s * 0.4, -0.3], [0.5 - s * 0.4, -0.3]];
      arms = [[Math.PI - 0.5 + s * 0.4, Math.PI - 0.1 + s * 0.3], [Math.PI - 0.5 - s * 0.4, Math.PI - 0.1 - s * 0.3]];
    } else if (hurt) {
      legs = [[0.4, 0.1], [-0.3, -0.5]];
      arms = [[2.4 + Math.sin(t * 30) * 0.3, 2.9], [-2.4 - Math.sin(t * 30) * 0.3, -2.9]];   // arms flailing
      lean = -0.12;
    } else if (air) {
      if (pl.vy < 0) {                                    // going up: one knee tucked, arms reaching
        legs = [[0.9, -0.2], [-0.25, 0.1]];
        arms = [[2.6, 2.9], [-0.9, -1.6]];
      } else {                                            // coming down: legs reach for the ground, arms out
        legs = [[0.35, 0.05], [-0.35, -0.1]];
        arms = [[2.1, 2.6], [-2.1, -2.6]];
      }
      lean = math.clamp(pl.vx / 2200, -0.12, 0.12) * (pl.face || 1);
    } else if (run) {
      const s = Math.sin(ph), c = Math.cos(ph);
      bob = -Math.abs(c) * 3;
      const leg = (q) => { const a = Math.sin(q) * 0.65; return [a, a - 0.15 - Math.max(0, Math.sin(q + 1.4)) * 0.9]; };
      legs = [leg(ph), leg(ph + Math.PI)];
      arms = [[-s * 0.8, -s * 0.8 + 0.9], [s * 0.8, s * 0.8 + 0.9]];   // arms swing opposite to the legs
      lean = 0.08;
    } else {
      legs = [[0.08, 0.04], [-0.08, -0.04]];
      arms = [[0.15, 0.35], [-0.12, 0.1]];
    }
    ctx.rotate(lean);
    const hipY = -22 + bob, shY = -41 + bob;

    // back leg, back arm (darker, behind the body)
    const fb = limb(ctx, -3, hipY, legs[1][0], 11, legs[1][1], 10, SHORTS_DK, 6.5); boot(ctx, fb, true);
    const hb = limb(ctx, -2, shY, arms[1][0], 10, arms[1][1], 10, SKIN_DK, 5.5); hand(ctx, hb, true);
    // backpack (bounces a little when running)
    const bp = run ? Math.sin(ph * 2) * 1.5 : 0;
    const pg = ctx.createLinearGradient(-24, 0, -8, 0); pg.addColorStop(0, '#0b6b8a'); pg.addColorStop(1, '#159fcf');
    D.box(ctx, -24, shY - 5 + bp, 15, 25, 6, pg, 3.5);
    D.box(ctx, -23, shY + 9 + bp, 11, 8, 3, '#0b5c77', 2.5);                       // pocket
    ctx.fillStyle = '#ffd166'; ctx.fillRect(-19, shY + 11 + bp, 3, 3);              // buckle
    // shorts
    D.box(ctx, -12, hipY - 7, 24, 12, 5, SHORTS, 3.5);
    ctx.fillStyle = SHORTS_DK; ctx.fillRect(-10, hipY + 1, 20, 3);
    // shirt with shading, a collar, a pocket and a belt
    const sg = ctx.createLinearGradient(-14, shY - 6, 14, shY + 20); sg.addColorStop(0, '#fff0b8'); sg.addColorStop(0.45, SHIRT); sg.addColorStop(1, SHIRT_DK);
    D.box(ctx, -13, shY - 5, 26, 25, 9, sg, 3.5);
    ctx.fillStyle = 'rgba(160,110,40,0.35)'; ctx.fillRect(-11, shY + 13, 22, 5);      // shady bottom of the shirt
    ctx.beginPath(); ctx.moveTo(-2, shY - 4); ctx.lineTo(4, shY + 3); ctx.lineTo(9, shY - 4); ctx.fillStyle = '#fff3c4'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();   // collar
    ctx.strokeStyle = '#a07a3a'; ctx.lineWidth = 2; ctx.strokeRect(5, shY + 3, 6, 6);  // pocket
    ctx.fillStyle = '#6b4226'; ctx.fillRect(-12, shY + 17, 24, 4); ctx.fillStyle = '#ffd166'; ctx.fillRect(2, shY + 17, 5, 4);   // belt + buckle
    // front leg
    const ff = limb(ctx, 4, hipY, legs[0][0], 11, legs[0][1], 10, SHORTS, 6.5); boot(ctx, ff, false);
    // head
    const hx = 3, hy = shY - 17;
    ctx.fillStyle = '#7a4a28'; ctx.beginPath(); ctx.arc(hx - 4, hy - 2, 13, Math.PI * 0.6, Math.PI * 1.5); ctx.fill();   // hair at the back
    const fg = ctx.createRadialGradient(hx + 4, hy - 4, 3, hx, hy, 15); fg.addColorStop(0, '#ffe2c4'); fg.addColorStop(1, SKIN);
    D.circle(ctx, hx, hy, 14, fg, 3.5);
    ctx.fillStyle = 'rgba(200,130,90,0.3)'; ctx.beginPath(); ctx.arc(hx, hy + 1, 12, 0.35, Math.PI - 0.35); ctx.fill();    // shade under the chin
    D.circle(ctx, hx - 9, hy + 1, 3.5, SKIN_DK, 2.5);                              // ear
    // hat brim shadow across the forehead (not for the flower crown)
    if (hatId !== 'flower') { ctx.save(); ctx.beginPath(); ctx.arc(hx, hy, 12.5, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = 'rgba(120,70,30,0.28)'; ctx.fillRect(hx - 15, hy - 15, 30, 7); ctx.restore(); }
    // eyes: big and shiny, they blink now and then
    const blink = !menu && ((t + (pl.x || 0) * 0.001) % 3.6) < 0.12;
    if (hurt) {                                           // dizzy swirl eyes
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx + 6, hy - 2, 3, 0, Math.PI * 1.6); ctx.stroke();
    } else if (blink) {
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(hx + 3, hy - 2); ctx.lineTo(hx + 10, hy - 2); ctx.stroke();
    } else {
      ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(hx + 6.5, hy - 2, 3, 4, 0, 0, 7); ctx.fill();
      D.circle(ctx, hx + 7.5, hy - 3.5, 1.4, '#fff', 0);
    }
    ctx.fillStyle = 'rgba(255,107,129,0.55)'; ctx.beginPath(); ctx.arc(hx + 9, hy + 5, 3.2, 0, 7); ctx.fill();   // rosy cheek
    ctx.strokeStyle = INK; ctx.lineWidth = 2.3;
    if (hurt || air && pl.vy > 300) { ctx.fillStyle = '#7a2a2a'; ctx.beginPath(); ctx.ellipse(hx + 7, hy + 6, 2.2, 3, 0, 0, 7); ctx.fill(); }   // "oh!" mouth
    else { ctx.beginPath(); ctx.arc(hx + 6, hy + 4, 3.6, 0.2, Math.PI - 0.5); ctx.stroke(); }
    ctx.save(); ctx.translate(hx - 2, hy + 58); drawHat(ctx, hatId, 3.5); ctx.restore();
    // front arm, in front of everything
    const hf = limb(ctx, 6, shY, arms[0][0], 10, arms[0][1], 10, SKIN, 5.5); hand(ctx, hf, false);
    // the parrot friend rides on top of the hat
    // (on a vine it flies along beside you instead)
    if (pet && !menu) { if (mode === 'vine') drawParrot(ctx, hx - 34, hy + 8 + Math.sin(t * 5) * 5, t, true); else drawParrot(ctx, hx - 6, hy - 27, t, air || hurt); }
    ctx.restore();
    if (!menu && landT > 0) landT = Math.max(0, landT - 1 / 60);
  }

  // Falling in: the explorer sinks with arms waving, then only the hat is left bobbing.
  function drawSinking(ctx, t) {
    const k = 1 - p.dead / 0.9, water = p.splash === 'water';
    const cx = p.x + PW / 2, surf = water ? GROUND + 26 : GROUND + 4;
    ctx.save();
    ctx.beginPath(); ctx.rect(cx - 60, 0, 120, surf); ctx.clip();
    const fake = { x: p.x, y: surf - PH + 6 + k * 95, vx: 0, vy: 0, onGround: false, face: p.face, mode: 'walk', stun: 1, run: 0 };
    if (k < 0.75) drawExplorer(ctx, fake, t, true);
    ctx.restore();
    // ripple rings spreading out (water) or a swirl (sand)
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const r = ((k * 1.4 + i * 0.33) % 1);
      ctx.strokeStyle = water ? `rgba(255,255,255,${0.9 * (1 - r)})` : `rgba(140,100,50,${0.8 * (1 - r)})`;
      ctx.beginPath(); ctx.ellipse(cx, surf, 14 + r * 60, 4 + r * 10, 0, 0, 7); ctx.stroke();
    }
    // a splash crown of droplets at the start
    if (water && k < 0.4) {
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI * (0.15 + 0.7 * i / 6), d = 10 + k * 120, h = Math.sin(k / 0.4 * Math.PI) * 50;
        D.circle(ctx, cx + Math.cos(a) * d, surf - Math.abs(Math.sin(a)) * h, 5 - k * 6, '#dff6ff', 2);
      }
    }
    // the hat floats (bobbing) once you're under
    if (k > 0.45) {
      ctx.save(); ctx.translate(cx - 2, surf + 64 + Math.sin(t * 6) * 2); ctx.rotate(Math.sin(t * 3) * 0.15);
      drawHat(ctx, hatId, 3.5); ctx.restore();
    }
  }

  // The explorer's hat (the one you picked in Unlocks). Drawn around (0,-70).
  function drawHat(ctx, id, L) {
    ctx.lineWidth = L; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
    const grad = (top, bot, y0, y1) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, top); g.addColorStop(1, bot); return g; };
    if (id === 'pirate') {
      ctx.beginPath(); ctx.moveTo(-20, -66); ctx.quadraticCurveTo(-14, -90, 2, -80); ctx.quadraticCurveTo(18, -90, 24, -66); ctx.quadraticCurveTo(2, -72, -20, -66); ctx.closePath();
      ctx.fillStyle = grad('#4a4a4a', '#1a1a1a', -88, -66); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-17, -68); ctx.quadraticCurveTo(2, -74, 21, -68); ctx.stroke();   // gold trim
      D.circle(ctx, 2, -77, 4.5, '#ffffff', 1.5); ctx.fillStyle = INK; ctx.fillRect(0, -78, 1.5, 1.5); ctx.fillRect(3, -78, 1.5, 1.5);   // tiny skull-ish smiley
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, -71); ctx.lineTo(8, -73); ctx.moveTo(-4, -73); ctx.lineTo(8, -71); ctx.stroke();
    } else if (id === 'cowboy') {
      ctx.beginPath(); ctx.moveTo(-25, -69); ctx.quadraticCurveTo(2, -59, 27, -69); ctx.quadraticCurveTo(25, -62, 2, -61); ctx.quadraticCurveTo(-23, -62, -25, -69); ctx.closePath();
      ctx.fillStyle = grad('#c08048', '#8a5428', -70, -60); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-11, -66); ctx.quadraticCurveTo(-12, -89, -2, -83); ctx.quadraticCurveTo(2, -79, 6, -83); ctx.quadraticCurveTo(16, -89, 15, -66); ctx.closePath();
      ctx.fillStyle = grad('#c88a52', '#94592c', -88, -66); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ef476f'; ctx.fillRect(-11, -71, 26, 4.5); ctx.fillStyle = '#ffd166'; ctx.fillRect(9, -71, 4, 4.5);
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(-5, -80, 2.5, 5, -0.2, 0, 7); ctx.fill();
    } else if (id === 'flower') {
      ctx.strokeStyle = '#3f9e4a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(2, -58, 15, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();   // the green band
      for (let k = 0; k < 5; k++) {
        const a = Math.PI * (1.12 + k * 0.19), fx = 2 + Math.cos(a) * 15, fy = -58 + Math.sin(a) * 15, col = ['#ef476f', '#ffd166', '#f15bb5', '#9bf6ff', '#06d6a0'][k];
        for (let q = 0; q < 5; q++) D.circle(ctx, fx + Math.cos(q * 1.257) * 3.6, fy + Math.sin(q * 1.257) * 3.6, 3, col, 1.6);
        D.circle(ctx, fx, fy, 2.2, '#fff3b0', 1.2);
      }
    } else if (id === 'crown') {
      ctx.beginPath(); ctx.moveTo(-13, -66); ctx.lineTo(-13, -84); ctx.lineTo(-5, -76); ctx.lineTo(2, -89); ctx.lineTo(9, -76); ctx.lineTo(17, -84); ctx.lineTo(17, -66); ctx.closePath();
      ctx.fillStyle = grad('#fff0a8', '#e0a400', -89, -66); ctx.fill(); ctx.stroke();
      for (const [cx2, cy2] of [[-13, -84], [2, -89], [17, -84]]) D.circle(ctx, cx2, cy2, 2.6, '#fff3b0', 1.5);
      D.circle(ctx, 2, -72, 3.2, '#ef476f', 1.5); D.circle(ctx, -7, -71, 2.2, '#118ab2', 1.2); D.circle(ctx, 11, -71, 2.2, '#06d6a0', 1.2);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(-10, -80, 2.5, 9);
    } else {                                   // the big safari hat
      ctx.beginPath(); ctx.ellipse(1, -67, 22, 5.5, 0, 0, 7); ctx.fillStyle = grad('#f2d488', '#c9a24f', -72, -62); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-11, -68); ctx.quadraticCurveTo(-10, -85, 2, -85); ctx.quadraticCurveTo(14, -85, 13, -68); ctx.closePath();
      ctx.fillStyle = grad('#f6dc90', '#d4ad58', -85, -68); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8b5a2b'; ctx.fillRect(-11, -73, 24, 4.5);
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(-4, -79, 2.5, 4.5, -0.3, 0, 7); ctx.fill();
      D.circle(ctx, 2, -85, 2.2, '#d4ad58', 1.8);                                   // the button on top
    }
  }

  // The parrot friend, perched on your hat. It flaps when you jump or swing.
  function drawParrot(ctx, x, y, t, busy) {
    const flutter = busy || (t % 4.2) < 0.5;
    const bobY = busy ? -6 + Math.sin(t * 10) * 3 : Math.sin(t * 2.5) * 1.2;
    ctx.save(); ctx.translate(x, y + bobY); ctx.scale(0.62, 0.62);
    // tail feathers
    for (const [a, c] of [[0.5, '#118ab2'], [0.75, '#ffd166'], [0.95, '#06d6a0']]) {
      ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(0, 20, 4.5, 15, 0, 0, 7); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
    }
    // feet gripping the hat
    if (!busy) { ctx.strokeStyle = '#8a6a3c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-3, 12); ctx.lineTo(-5, 18); ctx.moveTo(4, 12); ctx.lineTo(5, 18); ctx.stroke(); }
    // body
    const bg = ctx.createLinearGradient(0, -14, 0, 14); bg.addColorStop(0, '#ff6b8b'); bg.addColorStop(1, '#c9184a');
    ctx.beginPath(); ctx.ellipse(0, 2, 11, 14, -0.15, 0, 7); ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.ellipse(4, 6, 5, 7, -0.2, 0, 7); ctx.fill();          // yellow tummy
    // wing (flaps)
    const wa = flutter ? -0.6 + Math.sin(t * 28) * 0.9 : 0.2;
    ctx.save(); ctx.translate(-3, -2); ctx.rotate(wa);
    ctx.beginPath(); ctx.ellipse(-4, 6, 7, 13, 0.35, 0, 7); ctx.fillStyle = '#118ab2'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, 4); ctx.lineTo(-3, 14); ctx.moveTo(-1, 2); ctx.lineTo(0, 12); ctx.stroke();
    ctx.restore();
    // head with a white eye patch and a curvy beak
    D.circle(ctx, 4, -14, 9, '#ef476f', 3.5);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(7, -15, 4.5, 4, 0, 0, 7); ctx.fill();
    D.circle(ctx, 8, -15, 2.4, INK, 0); D.circle(ctx, 8.8, -15.8, 0.9, '#fff', 0);
    ctx.beginPath(); ctx.moveTo(11, -18); ctx.quadraticCurveTo(21, -16, 14, -7); ctx.quadraticCurveTo(12, -11, 11, -11); ctx.closePath();
    ctx.fillStyle = '#ffe066'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
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
    // a red flash around the edges when you lose a heart, and the hearts shake
    if (hurtFlash > 0) {
      const gr = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.9);
      gr.addColorStop(0, 'rgba(239,71,111,0)'); gr.addColorStop(1, `rgba(239,71,111,${hurtFlash * 0.9})`);
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    }
    const shake = hurtFlash > 0 ? Math.sin(hurtFlash * 60) * 4 : 0;
    for (let i = 0; i < maxHearts; i++) heart(ctx, 118 + i * 38 + shake, 36, 17, i < hearts);
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
  const LINK = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';   // outline style for the logo picture
  Arcade.start({
    id: 'trail',
    logo: Arcade.logo({
      badge: Arcade.badges.trail,   // the round picture (arcade/badges.js)
      title: 'Treasure Trail', colors: ['#ffe066', '#e9a23b'], bg: '#7bd389', art: `<rect x="0" y="110" width="90" height="50" fill="#b9783f" ${LINK}/><rect x="0" y="110" width="90" height="10" fill="#6cc04a"/>
              <rect x="90" y="124" width="70" height="36" fill="#3aa7e0"/><rect x="160" y="110" width="80" height="50" fill="#b9783f" ${LINK}/><rect x="160" y="110" width="80" height="10" fill="#6cc04a"/>
              <ellipse cx="125" cy="128" rx="24" ry="12" fill="#9a8fbf" ${LINK}/>
              <path d="M150 0 L112 70" ${LINK} stroke-width="8" fill="none"/><path d="M150 0 L112 70" stroke="#4caf50" stroke-width="4"/>
              <g class="wobble"><circle cx="110" cy="62" r="12" fill="#f2c9a0" ${LINK}/><path d="M94 56 Q110 38 126 56 Z" fill="#e9c46a" ${LINK}/></g>
              <path d="M196 96 L204 84 L212 96 L204 108 Z" fill="#ef476f" ${LINK}/>` }),   // title screen
    menuMusic: { tempo: 112, root: 57, scale: 'minor', prog: [[1, 6, 7, 1], [4, 5, 6, 5], [4, 7, 3, 5]], drums: 'tribal', bass: 'walk', lead: 'brass', harmony: 'flute', pad: true, arp: false, seed: 1601,
        tune: { A: '1/6 5/2 8/8 | 8/4 6/2 5 3/4 1 | 2/6 7/2 9/8 | 8/4 7/2 5 8/8',
                B: '8/6 6/2 4/8 | 9/6 7/2 5/8 | 10/6 8/2 6/8 | 9/4 7 5/8',
                C: '6/8 8 | 7/8 9 | 10/8 7 | 9/4 7 5/8' } },   // the title/menu song
    title: 'Treasure Trail',
    view: { w: W, h: H },
    background: '#3f9e4a',
    music: { tempo: 126, root: 62, scale: 'dorian', prog: [[1, 4, 1, 5], [6, 4, 1, 5], [3, 7, 4, 5]], drums: 'tribal', bass: 'bounce', lead: 'flute', harmony: 'brass', lead2: 'marimba', pad: true, arp: true, arpSound: 'marimba', seed: 3131,
        tune: { A: '1/4 3/2 4 5/4 3 | 4/4 6/2 7 8/4 6 | 5/4 3/2 4 5 8 5/4 | 7/6 5/2 2/8',
                B: '8/4 10 8 6 | 8/4 6 4/8 | 10/4 8/2 10 12/8 | 9/8 7',
                C: '10/8 7 | 9/8 7 | 8/4 6 4/8 | 5/16' } },
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
    extraMenu,
    trophies: [
      { id: 'camp', name: 'Camp out', how: 'Reach the camp' },
      { id: 'vine', name: 'Swing time', how: 'Grab a vine' },
      { id: 'hippo', name: 'Hippo hop', how: 'Stand on a hippo' },
      { id: 'tunnel', name: 'Down the ladder', how: 'Climb into a tunnel' },
      { id: 'all-treasure', name: 'Treasure chest', how: 'Find every treasure in an adventure' },
      { id: 'swamp', name: 'Swamp explorer', how: 'Finish Sunset Swamp' },
      { id: 'dry', name: 'Dry socks', how: 'Finish without falling in once', secret: true },
      { id: 'speedy', name: 'Speedy explorer', how: 'Finish River Run in under 50 seconds', secret: true },
    ],
    setup,
    update,
    draw: render,
  });
  window.__trailDebug = { ADVENTURES, PHYS, GROUND, TUNNEL, PW, PH };
})();
