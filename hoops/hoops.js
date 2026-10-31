// =====================================================================
// Hoop Heroes — arcade basketball shooting.
//
// How it works (the fun part):
//  * The ball is a circle that flies with gravity. Each step we move it a
//    tiny bit, then check if it bumped into something:
//      - the floor (bounces lower each time and starts rolling)
//      - the backboard and the little bar that holds the rim (flat pieces)
//      - the two ENDS of the rim. Seen from the side, a rim is just two
//        dots (front and back). The ball bounces off those dots like a
//        marble off a peg, which is what makes rattles in and out happen.
//  * A basket counts only when the CENTER of the ball goes DOWN through
//    the hoop opening: last step it was above the rim, this step it is
//    below, and it crossed between the two rim dots. So a ball flying
//    past the side or up from underneath never counts.
//  * Drawing order makes the ball go "through" the hoop: back of the rim
//    and back of the net first, then the ball, then the front of the net
//    and front of the rim on top.
//  * Baskets in a row build a streak: x2, x3 points ("On fire!").
// =====================================================================
(function () {
  const { draw, icons, math } = Arcade;
  const D = draw;
  const INK = D.INK;
  const W = 960, H = 540;
  const FLOOR = 470;          // where balls bounce (y)
  const G = 980;              // gravity (px/s²)
  const BALL_R = 20;          // ball radius
  const TUBE = 5;             // thickness (radius) of the rim metal
  const NET_LEN = 64;         // how far the net hangs below the rim
  const THREE_X = 300;        // shooting from left of this line = 3 points
  const VMIN = 300, VMAX = 1100;   // launch speed for power 0 .. 1
  const MAX_DRAG = 200;       // pulling back this far (view px) = full power

  // ---------------------------------------------------------------
  // Levels. Two timed arcade modes + the Hoop Challenge.
  //   time   = seconds on the clock
  //   spots  = x positions the shooter stands at
  //   spotRule: 'make' = move to the next spot after each basket,
  //             'shot' = after every shot, 'fixed' = never move
  //   move   = hoop motion: x / y = how far it slides, speed = how fast
  //   stars  = points needed for 1, 2 and 3 stars (Normal; Easy is lower)
  //   gold   = every 4th ball is a golden ball worth double
  //   boardStar = a glowing star on the backboard: hit it for +3
  // ---------------------------------------------------------------
  const LEVELS = [
    { id: 'q30', name: 'Quick 30', kind: 'timed', time: 30, spots: [400, 340, 270], spotRule: 'make', stars: [6, 16, 28], hoop: [770, 232] },
    { id: 'q60', name: 'Big 60',   kind: 'timed', time: 60, spots: [400, 320, 240, 360], spotRule: 'make', stars: [14, 34, 56], gold: true, hoop: [770, 232] },
    { id: 'c1', name: 'Warm Up',    kind: 'chal', time: 40, spots: [430], spotRule: 'fixed', stars: [6, 14, 24], hoop: [760, 240] },
    { id: 'c2', name: 'Long Shots', kind: 'chal', time: 40, spots: [270, 220], spotRule: 'make', stars: [9, 21, 33], hoop: [770, 232] },
    { id: 'c3', name: 'Slide Hoop', kind: 'chal', time: 45, spots: [380], spotRule: 'fixed', stars: [6, 15, 26], hoop: [740, 236], move: { x: 70, y: 0, speed: 0.9 } },
    { id: 'c4', name: 'Elevator',   kind: 'chal', time: 45, spots: [380, 320], spotRule: 'make', stars: [6, 15, 26], hoop: [760, 246], move: { x: 0, y: 42, speed: 1.0 } },
    { id: 'c5', name: 'Star Board', kind: 'chal', time: 45, spots: [390, 310], spotRule: 'make', stars: [8, 19, 32], hoop: [740, 236], move: { x: 55, y: 0, speed: 0.8 }, gold: true, boardStar: true },
    { id: 'c6', name: 'Wild Hoop',  kind: 'chal', time: 50, spots: [410, 330, 260], spotRule: 'shot', stars: [8, 20, 34], hoop: [740, 244], move: { x: 60, y: 36, speed: 1.0 }, gold: true, boardStar: true },
  ];

  // Ball designs you can unlock and pick in the menu.
  const BALLS = [
    { id: 'classic', name: 'Classic',    stars: 0 },
    { id: 'beach',   name: 'Beach Ball', stars: 3 },
    { id: 'melon',   name: 'Melon',      stars: 6 },
    { id: 'star',    name: 'Star Ball',  score: 40 },
    { id: 'rainbow', name: 'Rainbow',    stars: 12 },
  ];

  // ---------------------------------------------------------------
  // Game state (reset by setup)
  // ---------------------------------------------------------------
  let L, hoop, balls, nextId, score, streak, mult, made, shots, swishes, bestStreak,
    timeLeft, started, timeUp, endWait, finished, clock, popups, spotIdx, heroX,
    heroJump, cheer, hype, nextBallIn, ready, aim, kAngle, kPower, charging, chargeT,
    net, boardStar, thr, starsShown, lastTick, fireFlash, design, sndCool, bigText, trace;

  const R = () => rimR;            // rim half-width (set by difficulty)
  let rimR = 47;

  function totalStars(g) { return Object.values(g.save.levels).reduce((s, r) => s + (r.stars || 0), 0); }
  function ballUnlocked(g, b) { return b.id === 'classic' || g.isUnlocked('ball-' + b.id); }
  function pickedBall(g) {
    const id = g.save.data.ball || 'classic';
    const b = BALLS.find(x => x.id === id);
    return b && ballUnlocked(g, b) ? b.id : 'classic';
  }
  function checkUnlocks(g) {
    const ts = totalStars(g), best = g.save.best || 0;
    for (const b of BALLS) {
      if (b.id === 'classic') continue;
      if ((b.stars != null && ts >= b.stars) || (b.score != null && best >= b.score)) g.unlock('ball-' + b.id, b.name + ' ball!');
    }
  }

  // Hoop position + all the useful edges, worked out from its center.
  function geo() {
    const x = hoop.x, y = hoop.y, r = rimR;
    const bx = x + r + 10;                    // backboard front face
    return { x, y, r, L: x - r, Rt: x + r, bx, top: y - 120, bot: y + 26, poleX: bx + 74 };
  }

  function setup(g, level) {
    L = level || LEVELS[0];
    rimR = g.pick(58, 47, 41);
    hoop = { x: L.hoop[0], y: L.hoop[1], vx: 0, vy: 0 };
    balls = []; nextId = 1;
    score = 0; streak = 0; mult = 1; made = 0; shots = 0; swishes = 0; bestStreak = 0;
    timeLeft = L.time; started = false; timeUp = false; endWait = 0; finished = false;
    clock = 0; popups = []; spotIdx = 0; heroX = L.spots[0]; heroJump = 0; cheer = 0; hype = 0;
    nextBallIn = 0; ready = true; aim = null; kAngle = 52; kPower = 0.55; charging = false; chargeT = 0;
    net = { sway: 0, swayV: 0, drop: 0, dropV: 0 };
    boardStar = L.boardStar ? { y: -70, on: true, wait: 0, slot: 0 } : null;
    const f = g.pick(0.55, 1, 1.3);
    thr = L.stars.map(s => Math.max(2, Math.round(s * f)));
    starsShown = 0; lastTick = 99; fireFlash = 0; sndCool = 0; bigText = null;
    design = pickedBall(g);
    trace = window.__hoopsTrace || null;
    moveHoop(0);

    // ---- test hooks ----
    window.__hoopsState = () => {
      const gm = geo();
      const fly = balls.filter(b => !b.resolved);
      const b = fly[fly.length - 1] || balls[balls.length - 1] || null;
      return {
        ball: b ? { id: b.id, x: b.x, y: b.y, vx: b.vx, vy: b.vy, scored: b.scored, rim: b.rimHits > 0 } : null,
        balls: balls.map(b => ({ id: b.id, x: b.x, y: b.y, vx: b.vx, vy: b.vy, scored: b.scored, resolved: b.resolved, rimHits: b.rimHits, board: b.boardHit, gold: b.gold })),
        ready: ready && !timeUp && Math.abs(heroX - L.spots[spotIdx]) < 4,
        rest: restPos(),
        score, streak, mult, made, shots, swishes, bestStreak,
        hoop: { x: gm.x, y: gm.y, rimL: gm.L, rimR: gm.Rt, board: gm.bx, r: gm.r },
        timeLeft, started, timeUp, finished, thresholds: thr.slice(), level: L.id,
        spotX: L.spots[spotIdx], three: L.spots[spotIdx] < THREE_X, design,
      };
    };
    // fire a shot: angle in degrees (0 = flat right, 90 = straight up), power 0..1
    window.__hoopsShoot = (angle, power) => tryShoot(g, angle, power);
    // run the game N steps right now (fast tests; pause the kit loop first)
    window.__hoopsStep = (n) => { for (let i = 0; i < n && !finished; i++) update(g, 1 / 120); };
  }

  function restPos() { return { x: heroX + 34, y: FLOOR - 150 + heroHop() }; }
  function heroHop() { return -Math.sin(Math.min(1, heroJump) * Math.PI) * 26; }

  // Hoop movement for the moving-hoop levels (a smooth back-and-forth).
  function moveHoop(dt) {
    const m = L.move;
    if (!m) { hoop.vx = hoop.vy = 0; return; }
    const sp = m.speed * gPick.speed;
    const nx = L.hoop[0] + m.x * Math.sin(clock * sp);
    const ny = L.hoop[1] + m.y * Math.sin(clock * sp * 1.3 + 1);
    hoop.vx = dt ? (nx - hoop.x) / dt : 0;
    hoop.vy = dt ? (ny - hoop.y) / dt : 0;
    hoop.x = nx; hoop.y = ny;
  }
  const gPick = { speed: 1 };   // filled in by setup via difficulty (see update)

  function popup(text, x, y, color = '#ffd166', size = 32) { popups.push({ text, x, y, t: 0, color, size }); }

  // ---------------------------------------------------------------
  // Shooting
  // ---------------------------------------------------------------
  function canShoot() { return ready && !timeUp && !finished && Math.abs(heroX - L.spots[spotIdx]) < 4; }

  function tryShoot(g, angleDeg, power) {
    if (!canShoot()) return false;
    const a = math.clamp(angleDeg, 5, 88) * Math.PI / 180;
    const v = VMIN + (VMAX - VMIN) * math.clamp(power, 0, 1);
    const p = restPos();
    shots++;
    const gold = !!L.gold && shots % 4 === 0;
    const b = {
      id: nextId++, x: p.x, y: p.y, vx: Math.cos(a) * v, vy: -Math.sin(a) * v,
      spin: 0, omega: -7, age: 0, gold, three: L.spots[spotIdx] < THREE_X,
      scored: false, resolved: false, dead: false, fromBelow: false, rimHits: 0, boardHit: false,
      fade: 1, trail: 0,
    };
    const gm = geo();
    b.rel = b.y - gm.y; b.relX = b.x - gm.x;
    balls.push(b);
    if (balls.length > 6) balls.splice(balls.findIndex(o => o.resolved), 1);
    ready = false; nextBallIn = 0.55; heroJump = 0.01;
    started = true;
    g.sfx('whoosh');
    if (L.spotRule === 'shot') spotIdx = (spotIdx + 1) % L.spots.length;
    return true;
  }

  // ---------------------------------------------------------------
  // Collisions
  // ---------------------------------------------------------------
  // Bounce ball b off a round thing at (px, py) of radius rad.
  // hv = how that thing is moving (moving hoops). Returns impact speed.
  function bounceOff(b, px, py, rad, e, fric, hv) {
    const dx = b.x - px, dy = b.y - py;
    const d = Math.hypot(dx, dy), min = BALL_R + rad;
    if (d >= min || d < 1e-6) return 0;
    const nx = dx / d, ny = dy / d;
    b.x = px + nx * min; b.y = py + ny * min;        // push out
    let rvx = b.vx - hv.vx, rvy = b.vy - hv.vy;       // speed relative to the object
    const vn = rvx * nx + rvy * ny;
    if (vn >= 0) return 0;                            // already moving away
    const tx = -ny, ty = nx;
    const vt = (rvx * tx + rvy * ty) * fric;
    rvx = nx * (-vn * e) + tx * vt;
    rvy = ny * (-vn * e) + ty * vt;
    b.vx = rvx + hv.vx; b.vy = rvy + hv.vy;
    b.omega = b.omega * 0.4 + (vt / BALL_R) * 0.6;    // rubbing makes it spin
    return -vn;
  }
  // Same, for a straight piece from (ax, ay) to (bx, by) with thickness rad.
  function bounceSeg(b, ax, ay, bx, by, rad, e, fric, hv) {
    const p = math.nearestOnSegment(b.x, b.y, ax, ay, bx, by);
    return bounceOff(b, p.x, p.y, rad, e, fric, hv);
  }

  // One small physics step for one ball.
  function stepBall(g, b, h) {
    const gm = geo();
    const easy = g.difficulty === 'easy';
    b.age += h;
    b.vy += G * h;

    // Easy helper: a gentle pull toward the middle of the hoop when the
    // ball is coming down just above it (like a soft magnet).
    if (easy && !b.scored && !b.dead && b.vy > 0) {
      const rx = b.x - gm.x, ry = b.y - gm.y;
      if (Math.abs(rx) < gm.r + 55 && ry > -170 && ry < -4) b.vx += math.clamp(-rx * 7, -420, 420) * h;
    }
    // Inside the net after a basket: the net slows the ball and keeps it in the middle.
    if (b.scored) {
      const rx = b.x - gm.x, ry = b.y - gm.y;
      if (ry > 0 && ry < NET_LEN + 14 && Math.abs(rx) < gm.r) {
        b.vx += (hoop.vx - b.vx) * Math.min(1, 6 * h) - rx * 18 * h;
        b.vy *= 1 - 2.4 * h;
      }
    }

    b.x += b.vx * h; b.y += b.vy * h;
    b.spin += b.omega * h;

    const hv = hoop;
    const rimE = g.pick(0.42, 0.55, 0.62);
    let hitRim = 0, hitBoard = 0;
    // rim ends: front (near the shooter) and back (near the backboard)
    hitRim = Math.max(hitRim, bounceOff(b, gm.L, gm.y, TUBE, rimE, 0.85, hv));
    hitRim = Math.max(hitRim, bounceOff(b, gm.Rt, gm.y, TUBE, rimE, 0.85, hv));
    // the little bar from the back of the rim to the board
    hitRim = Math.max(hitRim, bounceSeg(b, gm.Rt, gm.y, gm.bx, gm.y, 4, rimE, 0.85, hv));
    // backboard
    hitBoard = bounceSeg(b, gm.bx, gm.top, gm.bx, gm.bot, 4, 0.62, 0.9, hv);
    // the padded pole of the hoop stand (behind/below the board)
    hitBoard = Math.max(hitBoard, bounceSeg(b, gm.poleX, gm.y - 40, gm.poleX, FLOOR, 12, 0.5, 0.9, hv));
    // outside of the net is soft: a ball that misses low just plops off it
    if (!b.scored) {
      const rx = b.x - gm.x, ry = b.y - gm.y;
      const sOut = ry > 0 && ry < NET_LEN ? gm.r * (1 - 0.42 * ry / NET_LEN) : 0;
      if (sOut && Math.abs(rx) > sOut) {
        bounceSeg(b, gm.L, gm.y, gm.x - gm.r * 0.58, gm.y + NET_LEN, 2, 0.15, 0.7, hv);
        bounceSeg(b, gm.Rt, gm.y, gm.x + gm.r * 0.58, gm.y + NET_LEN, 2, 0.15, 0.7, hv);
      }
    }

    if (hitRim > 0) {
      b.rimHits++;
      if (hitRim > 60 && sndCool <= 0) { g.tone(820 + Math.random() * 120, 0.09, { type: 'triangle', vol: Math.min(0.35, hitRim / 1200) }); g.tone(1640, 0.05, { type: 'sine', vol: 0.08 }); sndCool = 0.06; }
    }
    if (hitBoard > 0) {
      b.boardHit = true;
      if (hitBoard > 60 && sndCool <= 0) { g.tone(150, 0.12, { slide: 90, type: 'triangle', vol: Math.min(0.4, hitBoard / 900) }); sndCool = 0.06; }
      // glowing star target on the backboard
      if (boardStar && boardStar.on && Math.abs(b.y - (gm.y + boardStar.y)) < 26 && b.x < gm.bx) {
        boardStar.on = false; boardStar.wait = 2.5;
        b.starHit = true;
        score += 3;
        g.sfx('star');
        popup('+3', gm.bx - 30, gm.y + boardStar.y - 30, '#ffd166', 36);
        g.particles.burst(gm.bx + 20, gm.y + boardStar.y, { count: 20, shape: 'star', speed: 240, size: 14, gravity: 200 });
      }
    }

    // floor
    if (b.y + BALL_R > FLOOR) {
      b.y = FLOOR - BALL_R;
      if (b.vy > 0) {
        const imp = b.vy;
        b.vy = imp > 70 ? -imp * 0.62 : 0;
        b.vx *= 0.86;
        b.omega = b.vx / BALL_R;
        if (imp > 120 && sndCool <= 0) { g.tone(95 + Math.random() * 20, 0.1, { slide: 60, type: 'sine', vol: Math.min(0.5, imp / 1200) }); sndCool = 0.05; }
      }
      if (b.vy === 0) { b.vx *= Math.pow(0.4, h); b.omega = b.vx / BALL_R; }   // rolling slows down
      if (!b.dead) { b.dead = true; if (!b.scored) miss(g, b); }
    }
    // side walls of the gym
    if (b.x < BALL_R) { b.x = BALL_R; b.vx = Math.abs(b.vx) * 0.6; }
    if (b.x > W - BALL_R) { b.x = W - BALL_R; b.vx = -Math.abs(b.vx) * 0.6; }

    // ---- did it go in? ----
    // Use positions RELATIVE to the hoop, so moving hoops work too.
    const rel = b.y - gm.y, relX = b.x - gm.x;
    if (!b.scored && !b.dead) {
      if (b.rel < 0 && rel >= 0) {            // crossed the rim line going DOWN
        const t = b.rel / (b.rel - rel);
        const cx = b.relX + (relX - b.relX) * t;   // where it crossed
        if (cx > -gm.r && cx < gm.r && !b.fromBelow) scoreBasket(g, b);
      } else if (b.rel > 0 && rel <= 0) {     // came UP through the hoop: doesn't count
        const t = b.rel / (b.rel - rel);
        const cx = b.relX + (relX - b.relX) * t;
        if (cx > -gm.r && cx < gm.r) b.fromBelow = true;
      }
    }
    b.rel = rel; b.relX = relX;
    if (trace) trace.push([b.id, +b.x.toFixed(2), +b.y.toFixed(2), +gm.x.toFixed(2), +gm.y.toFixed(2), gm.r, b.scored ? 1 : 0]);
  }

  // ---------------------------------------------------------------
  // Scoring
  // ---------------------------------------------------------------
  function scoreBasket(g, b) {
    const gm = geo();
    b.scored = true; b.resolved = true; b.resolvedAt = clock;
    made++; streak++; bestStreak = Math.max(bestStreak, streak);
    const need = g.pick(2, 3, 3);
    const newMult = Math.min(3, 1 + Math.floor(streak / need));
    const swish = b.rimHits === 0 && !b.boardHit;
    let pts = (b.three ? 3 : 2) + (swish ? 1 : 0);
    pts *= newMult * (b.gold ? 2 : 1);
    score += pts;
    if (swish) swishes++;

    // net reaction
    net.dropV += 220; net.swayV += (b.vx - hoop.vx) * 0.5;
    hype = Math.min(2, hype + 0.8);

    // words + sounds
    g.sfx(swish ? 'swish' : 'coin');
    if (swish) setTimeout(() => g.sfx('coin'), 80);
    const word = swish ? 'Swish!' : b.starHit ? 'Bank shot!' : b.rimHits > 1 ? 'Rattle in!' : b.three ? 'Long shot!' : ['Nice!', 'Yes!', 'Good one!'][made % 3];
    popup(word, gm.x, gm.y - 70, swish ? '#8ecae6' : '#ffd166', 34);
    popup('+' + pts, gm.x - 70, gm.y + 20, '#06d6a0', 40);
    if (b.gold) popup('Gold x2!', gm.x, gm.y - 110, '#ffc93c', 30);
    g.particles.burst(gm.x, gm.y + NET_LEN, { count: swish ? 24 : 14, angle: Math.PI / 2, spread: 2.2, speed: 200, size: 10, gravity: 300 });
    if (swish) g.achieve('swish', 'First swish!');
    if (b.three) g.achieve('three', 'Long shot hero!');

    if (newMult > mult) {
      mult = newMult;
      fireFlash = 1.6;
      bigText = { text: mult === 2 ? 'On fire! x2' : 'Super fire! x3', t: 0, color: mult === 2 ? '#ff8c42' : '#f15bb5' };
      g.sfx('power');
      g.achieve('fire', 'On fire!');
      for (let i = 0; i < 6; i++) g.particles.burst(160 + i * 130, 90, { count: 10, shape: i % 2 ? 'star' : 'square', speed: 260, size: 13, gravity: 420 });
    } else if (mult > 1) {
      g.particles.burst(gm.x, gm.y, { count: 12, shape: 'star', speed: 220, size: 12, colors: ['#ffd166', '#ff8c42', '#ef476f'] });
    }
    // new star reached?
    const st = starsFor(score);
    if (st > starsShown) { starsShown = st; setTimeout(() => g.sfx('star'), 200); popup('★', 600 + 240 * thr[st - 1] / thr[2], 90, '#ffd166', 46); }

    if (L.spotRule === 'make') spotIdx = (spotIdx + 1) % L.spots.length;
  }

  function miss(g, b) {
    if (b.resolved) return;
    b.resolved = true; b.resolvedAt = clock;
    if (streak > 0 || mult > 1) popup(b.rimHits ? 'So close!' : 'Keep going!', b.x, FLOOR - 70, '#ffffff', 26);
    else if (b.rimHits) popup('So close!', b.x, FLOOR - 70, '#ffffff', 26);
    streak = 0; mult = 1;
  }

  function starsFor(s) { return s >= thr[2] ? 3 : s >= thr[1] ? 2 : s >= thr[0] ? 1 : 0; }

  // ---------------------------------------------------------------
  // Update (dt = 1/120 s)
  // ---------------------------------------------------------------
  function update(g, dt) {
    if (finished) return;
    clock += dt;
    gPick.speed = g.pick(0.6, 1, 1.3);
    moveHoop(dt);
    sndCool -= dt;

    for (const p of popups) { p.t += dt; p.y -= 38 * dt; }
    popups = popups.filter(p => p.t < 1.3);
    if (bigText) { bigText.t += dt; if (bigText.t > 1.6) bigText = null; }
    fireFlash = Math.max(0, fireFlash - dt);
    hype = Math.max(0, hype - dt * 0.5);
    cheer += dt * (4 + hype * 6);
    if (heroJump > 0) { heroJump += dt * 2.6; if (heroJump >= 1) heroJump = 0; }

    // net is a springy thing
    net.swayV += (-90 * net.sway - 5 * net.swayV) * dt; net.sway += net.swayV * dt;
    net.dropV += (-140 * net.drop - 7 * net.dropV) * dt; net.drop += net.dropV * dt;

    // backboard star comes back somewhere new
    if (boardStar && !boardStar.on) {
      boardStar.wait -= dt;
      if (boardStar.wait <= 0) { boardStar.slot = (boardStar.slot + 1) % 3; boardStar.y = [-70, -95, -45][boardStar.slot]; boardStar.on = true; }
    }

    // ---- clock ----
    if (started && !timeUp) {
      timeLeft -= dt;
      const sec = Math.ceil(timeLeft);
      if (sec <= 5 && sec >= 1 && sec !== lastTick) { lastTick = sec; g.sfx('tick'); g.tone(660, 0.08, { type: 'square', vol: 0.1 }); }
      if (timeLeft <= 0) {
        timeLeft = 0; timeUp = true; aim = null; charging = false;
        // the buzzer!
        g.tone(196, 0.9, { type: 'sawtooth', vol: 0.22 }); g.tone(247, 0.9, { type: 'square', vol: 0.12 });
        bigText = { text: 'Time!', t: 0, color: '#ffd166', stay: true };
      }
    }
    if (timeUp) {
      // balls still in the air can still go in (buzzer beaters!)
      endWait += dt;
      const flying = balls.some(b => !b.resolved);
      if ((!flying && endWait > 1.2) || endWait > 4.5) endRound(g);
    }

    // ---- shooter walks to the spot ----
    const target = L.spots[spotIdx];
    heroX += (target - heroX) * Math.min(1, dt * 7);
    if (Math.abs(target - heroX) < 0.5) heroX = target;

    // ---- next ball ----
    if (!ready && !timeUp) { nextBallIn -= dt; if (nextBallIn <= 0) { ready = true; g.sfx('pop'); } }

    // ---- aiming: drag (mouse / touch) ----
    const pt = g.input.pointer;
    if (canShoot() && pt.justDown) aim = { sx: pt.x, sy: pt.y, x: pt.x, y: pt.y };
    if (aim) {
      aim.x = pt.x; aim.y = pt.y;
      if (!pt.down) {
        const s = dragShot(aim);
        aim = null;
        if (s.len >= 18) tryShoot(g, s.angle, s.power);
      }
    }

    // ---- aiming: keyboard ----
    const turn = (g.input.down('ArrowUp', 'ArrowLeft', 'KeyW', 'KeyA') ? 1 : 0) - (g.input.down('ArrowDown', 'ArrowRight', 'KeyS', 'KeyD') ? 1 : 0);
    kAngle = math.clamp(kAngle + turn * 40 * dt, 15, 85);
    if (canShoot() && !aim) {
      if (g.input.down('Space', 'Enter')) {
        if (!charging) { charging = true; chargeT = 0; }
        chargeT += dt;
        kPower = chargePower(chargeT);
      } else if (charging) {
        charging = false;
        tryShoot(g, kAngle, kPower);
      }
    } else if (!g.input.down('Space', 'Enter')) charging = false;

    // ---- balls ----
    for (const b of balls) {
      if (!b.resolved && !b.scored && b.age > 6) miss(g, b);
      stepBall(g, b, dt / 2);
      stepBall(g, b, dt / 2);
      if (mult > 1 && !b.resolved) {
        b.trail += dt;
        if (b.trail > 0.025) { b.trail = 0; g.particles.burst(b.x, b.y, { count: 1, colors: ['#ffd166', '#ff8c42', '#ef476f'], speed: 30, size: 14, gravity: -60, life: 0.45 }); }
      }
      if (b.resolved && clock - b.resolvedAt > 2.6) b.fade -= dt * 2.5;
    }
    balls = balls.filter(b => b.fade > 0);
  }

  // Power goes up then back down while Space is held, so you can stop it anywhere.
  function chargePower(t) { const p = (t / 1.2) % 2; return p < 1 ? p : 2 - p; }

  // Turn a drag (pull back) into an angle + power.
  function dragShot(a) {
    const dx = a.sx - a.x, dy = a.sy - a.y;         // pull back = shoot the other way
    const len = Math.hypot(dx, dy);
    let ang = Math.atan2(-dy, dx) * 180 / Math.PI;  // 0 = right, 90 = up
    if (ang < -90 || ang > 135) ang = 15;           // pulled the wrong way: keep it sensible
    return { angle: math.clamp(ang, 15, 85), power: math.clamp(len / MAX_DRAG, 0, 1), len };
  }

  function endRound(g) {
    if (finished) return;
    finished = true;
    const stars = starsFor(score);
    const rec = g.save.levels[L.id] || {};
    const best = Math.max(rec.score || 0, score);
    g.finish({
      win: stars >= 1, score, stars,
      title: stars >= 3 ? 'Superstar!' : stars >= 1 ? 'Great shooting!' : 'Nice try!',
      lines: [
        'Baskets: ' + made + ' / ' + shots,
        swishes ? 'Swishes: ' + swishes : '',
        bestStreak >= 2 ? 'Best streak: ' + bestStreak + ' in a row' : '',
        'Best: ' + best,
        stars < 3 ? 'Next star at ' + thr[stars] + ' points' : '',
      ].filter(Boolean),
      next: stars >= 1, delay: 1100,
    });
  }

  // ---------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------
  function drawGym(ctx) {
    // back wall
    const wall = ctx.createLinearGradient(0, 0, 0, 300);
    wall.addColorStop(0, '#7fc8f8'); wall.addColorStop(1, '#c9ecff');
    ctx.fillStyle = wall; ctx.fillRect(0, 0, W, H);
    // big painted stripe
    ctx.fillStyle = '#ffd166'; ctx.fillRect(0, 262, W, 16);
    ctx.fillStyle = '#ef476f'; ctx.fillRect(0, 278, W, 8);
    // windows
    for (const x of [140, 380, 620]) {
      D.box(ctx, x, 96, 120, 70, 14, '#e8f7ff', 4);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath(); ctx.moveTo(x + 16, 156); ctx.lineTo(x + 50, 106); ctx.lineTo(x + 66, 106); ctx.lineTo(x + 32, 156); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x + 60, 96); ctx.lineTo(x + 60, 166); ctx.stroke();
    }
    // pennant flags on a string
    ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 196); ctx.quadraticCurveTo(W / 2, 236, W, 196); ctx.stroke();
    const flagC = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#9b5de5', '#ff8c42'];
    for (let i = 0; i < 16; i++) {
      const x = 30 + i * 60, t = x / W, y = 196 + 4 * 40 * t * (1 - t) * 1;
      const wob = Math.sin(clock * 3 + i) * 2;
      ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + 14, y); ctx.lineTo(x + wob, y + 30); ctx.closePath();
      ctx.fillStyle = flagC[i % flagC.length]; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    }
    // bleachers + cheering crowd
    const jump = 1.5 + hype * 4;
    for (let r = 0; r < 4; r++) {
      const y = 300 + r * 36;
      for (let c = 0; c < 26; c++) {
        const x = 20 + c * 37 + (r % 2) * 18;
        const hue = ((c * 13 + r * 29) * 47) % 360;
        const bob = Math.max(0, Math.sin(cheer + c * 0.7 + r * 1.3)) * jump;
        ctx.fillStyle = `hsl(${hue} 70% 62%)`;
        D.rr(ctx, x - 12, y + 8 - bob, 24, 26, 10); ctx.fill();                 // body
        ctx.fillStyle = `hsl(${(hue + 40) % 360} 45% ${68 + (c % 3) * 6}%)`;
        ctx.beginPath(); ctx.arc(x, y - 2 - bob, 10, 0, Math.PI * 2); ctx.fill();   // head
        ctx.fillStyle = INK;
        ctx.beginPath(); ctx.arc(x - 3.5, y - 3 - bob, 1.8, 0, Math.PI * 2); ctx.arc(x + 3.5, y - 3 - bob, 1.8, 0, Math.PI * 2); ctx.fill();
        if (hype > 0.6 && (c + r) % 3 === 0) {          // arms up when they cheer
          ctx.strokeStyle = `hsl(${hue} 70% 52%)`; ctx.lineWidth = 4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x - 10, y + 12 - bob); ctx.lineTo(x - 15, y - 10 - bob); ctx.moveTo(x + 10, y + 12 - bob); ctx.lineTo(x + 15, y - 10 - bob); ctx.stroke();
        }
      }
      ctx.fillStyle = '#c98b4f'; ctx.fillRect(0, y + 28, W, 10);
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(-4, y + 28, W + 8, 10);
    }
    // wooden floor
    ctx.fillStyle = '#f0b86e'; ctx.fillRect(0, 440, W, H - 440);
    ctx.strokeStyle = '#d99c52'; ctx.lineWidth = 2;
    for (let y = 452; y < H; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let y = 444, k = 0; y < H; y += 16, k++) for (let x = (k % 2) * 70; x < W; x += 140) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 16); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 440); ctx.lineTo(W, 440); ctx.stroke();
    // court lines: sideline and the 3-point line
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(0, 506); ctx.lineTo(W, 506); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(THREE_X + 10, 442); ctx.lineTo(THREE_X - 10, 540); ctx.stroke();
    D.circle(ctx, THREE_X - 38, 520, 15, '#118ab2', 3);
    D.text(ctx, '3', THREE_X - 38, 521, { size: 20, lineWidth: 4 });
  }

  // Hoop stand, backboard and the BACK part of rim + net (behind the ball).
  function drawHoopBack(ctx) {
    const gm = geo();
    // stand: base on wheels, padded pole, arm to the board
    const px = gm.poleX;
    ctx.lineCap = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = 18;
    ctx.beginPath(); ctx.moveTo(px, FLOOR - 10); ctx.lineTo(px, gm.y - 44); ctx.lineTo(gm.bx + 30, gm.y - 44); ctx.stroke();
    ctx.strokeStyle = '#8d99ae'; ctx.lineWidth = 11; ctx.stroke();
    D.box(ctx, px - 14, gm.y + 40, 28, Math.max(10, FLOOR - 70 - gm.y - 40), 10, '#118ab2', 4);   // pad
    D.box(ctx, px - 56, FLOOR - 26, 112, 26, 10, '#118ab2', 4);                                   // base
    D.circle(ctx, px - 36, FLOOR + 2, 9, '#3a3a3a', 4); D.circle(ctx, px + 36, FLOOR + 2, 9, '#3a3a3a', 4);

    // backboard: a white panel seen a little from the side
    const bx = gm.bx, sk = 16, dw = 46;
    ctx.beginPath();
    ctx.moveTo(bx, gm.top); ctx.lineTo(bx + dw, gm.top - sk); ctx.lineTo(bx + dw, gm.bot - sk); ctx.lineTo(bx, gm.bot); ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
    // the orange square painted on the board
    const sy = gm.y - 52, sh = 46;
    ctx.beginPath();
    ctx.moveTo(bx + 10, sy - 3); ctx.lineTo(bx + 36, sy - 12); ctx.lineTo(bx + 36, sy + sh - 12); ctx.lineTo(bx + 10, sy + sh - 3); ctx.closePath();
    ctx.lineWidth = 5; ctx.strokeStyle = '#ff6b35'; ctx.stroke();
    // board edge (the side the ball hits)
    D.box(ctx, bx - 6, gm.top - 2, 8, gm.bot - gm.top + 4, 3, '#e6eef5', 3);

    // glowing star target
    if (boardStar && boardStar.on) {
      const y = gm.y + boardStar.y, pulse = 1 + Math.sin(clock * 6) * 0.08;
      ctx.save();
      ctx.globalAlpha = 0.45 + Math.sin(clock * 6) * 0.15;
      ctx.fillStyle = '#fff3b0';
      ctx.beginPath(); ctx.arc(bx + 20, y - 6, 26 * pulse, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      D.star(ctx, bx + 20, y - 6, 17 * pulse, '#ffd166', 3);
    }

    // bar from rim to board
    ctx.strokeStyle = INK; ctx.lineWidth = 11;
    ctx.beginPath(); ctx.moveTo(gm.Rt, gm.y); ctx.lineTo(bx, gm.y); ctx.stroke();
    ctx.strokeStyle = '#8d99ae'; ctx.lineWidth = 5; ctx.stroke();

    drawNet(ctx, gm, false);
    // back half of the rim
    rimArc(ctx, gm, Math.PI, Math.PI * 2);
  }

  // FRONT part of the net and rim (drawn over the ball).
  function drawHoopFront(ctx) {
    const gm = geo();
    drawNet(ctx, gm, true);
    rimArc(ctx, gm, 0, Math.PI);
  }

  function rimArc(ctx, gm, a0, a1) {
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(gm.x, gm.y, gm.r, 9, 0, a0, a1);
    ctx.strokeStyle = INK; ctx.lineWidth = 12; ctx.stroke();
    ctx.strokeStyle = '#ff6b35'; ctx.lineWidth = 6; ctx.stroke();
  }

  // The net: strings going down and around, like a little basket.
  // Each point is on a ring (an ellipse) that gets narrower further down.
  // Points with sin(angle) < 0 are on the far side (back), > 0 near side (front).
  function netPoint(gm, theta, s) {
    const len = NET_LEN + net.drop;
    let half = gm.r * (1 - 0.42 * s);
    const yy = gm.y + s * len;
    // bulge around a ball that is inside the net
    for (const b of balls) {
      const rx = b.x - gm.x, ry = b.y - gm.y;
      if (Math.abs(rx) < gm.r + 4 && ry > -BALL_R && ry < len + BALL_R) {
        const k = Math.exp(-Math.pow((yy - b.y) / (BALL_R * 1.15), 2));
        const need = Math.abs(rx) + BALL_R + 3;
        if (need > half) half = half + (need - half) * k;
      }
    }
    const sway = net.sway * s * s;
    return [gm.x + sway + Math.cos(theta) * half, yy + Math.sin(theta) * 9 * half / gm.r];
  }
  function drawNet(ctx, gm, front) {
    const N = 10, STEPS = 6, twist = Math.PI * 2 / N * 1.4;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const segs = [];
    for (let k = 0; k < N; k++) {
      for (const dir of [1, -1]) {
        const th0 = k * Math.PI * 2 / N + 0.15;
        for (let i = 0; i < STEPS; i++) {
          const s0 = i / STEPS, s1 = (i + 1) / STEPS;
          const ta = th0 + dir * twist * s0, tb = th0 + dir * twist * s1;
          const isFront = Math.sin((ta + tb) / 2) >= 0;
          if (isFront === front) segs.push([netPoint(gm, ta, s0), netPoint(gm, tb, s1)]);
        }
      }
    }
    // bottom ring
    for (let k = 0; k < 24; k++) {
      const ta = k * Math.PI / 12, tb = (k + 1) * Math.PI / 12;
      if ((Math.sin((ta + tb) / 2) >= 0) === front) segs.push([netPoint(gm, ta, 1), netPoint(gm, tb, 1)]);
    }
    const path = () => { ctx.beginPath(); for (const [a, b] of segs) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } };
    path();
    if (front) {
      ctx.strokeStyle = INK; ctx.lineWidth = 5.5; ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(43,43,43,0.55)'; ctx.lineWidth = 4; ctx.stroke();
      ctx.strokeStyle = '#d8e2ec'; ctx.lineWidth = 2; ctx.stroke();
    }
  }

  // A ball in one of the designs. spin = how far it has rolled (radians).
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

  // Our hero: a cute bunny in a basketball jersey. (x, floor) = feet.
  function drawHero(ctx, x, holding) {
    const y0 = FLOOR + heroHop();
    const fur = '#fff6ea', jersey = mult > 1 ? '#ff6b35' : '#118ab2';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(x, FLOOR + 2, 36, 7, 0, 0, Math.PI * 2); ctx.fill();
    // feet (sneakers)
    for (const fx of [-14, 14]) { ctx.beginPath(); ctx.ellipse(x + fx + 4, y0 - 8, 16, 9, 0, 0, Math.PI * 2); ctx.fillStyle = '#ef476f'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
    // body with jersey
    ctx.beginPath(); ctx.ellipse(x, y0 - 50, 28, 34, 0, 0, Math.PI * 2);
    ctx.fillStyle = jersey; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 12, y0 - 82); ctx.quadraticCurveTo(x, y0 - 68, x + 12, y0 - 82); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();
    D.text(ctx, '7', x + 2, y0 - 48, { size: 26, lineWidth: 5 });
    // ears (lean back), inner pink
    for (const [ex, ey, rot] of [[-20, -160, -0.38], [-3, -166, -0.12]]) {
      ctx.save(); ctx.translate(x + ex, y0 + ey); ctx.rotate(rot);
      ctx.beginPath(); ctx.ellipse(0, 0, 11, 28, 0, 0, Math.PI * 2); ctx.fillStyle = fur; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 3, 5, 18, 0, 0, Math.PI * 2); ctx.fillStyle = '#ffafcc'; ctx.fill();
      ctx.restore();
    }
    // head
    D.circle(ctx, x, y0 - 108, 31, fur, 4);
    // headband (glows when on fire)
    ctx.save(); ctx.beginPath(); ctx.arc(x, y0 - 108, 29, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = mult > 1 ? '#ffd166' : '#ef476f'; ctx.fillRect(x - 32, y0 - 133, 64, 11);
    ctx.restore();
    ctx.beginPath(); ctx.arc(x, y0 - 108, 31, 0, Math.PI * 2); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    // face looking at the hoop
    for (const ex of [4, 20]) { D.circle(ctx, x + ex, y0 - 110, 6, INK, 0); D.circle(ctx, x + ex + 2, y0 - 112, 2.2, '#fff', 0); }
    ctx.fillStyle = 'rgba(255,120,150,0.55)';
    ctx.beginPath(); ctx.ellipse(x - 6, y0 - 97, 6, 4, 0, 0, Math.PI * 2); ctx.ellipse(x + 26, y0 - 97, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 10, y0 - 102); ctx.lineTo(x + 16, y0 - 102); ctx.lineTo(x + 13, y0 - 98); ctx.closePath(); ctx.fillStyle = '#ff7aa2'; ctx.fill();
    ctx.beginPath(); ctx.arc(x + 13, y0 - 96, 6, 0.2, Math.PI - 0.2); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  }
  // Arms on top of the held ball (or up in the air after a shot).
  function drawArms(ctx, x, holding) {
    const y0 = FLOOR + heroHop();
    const p = restPos();
    const hands = holding ? [[p.x - 15, p.y + 10], [p.x + 8, p.y + 16]] : [[x + 20, y0 - 170], [x + 40, y0 - 160]];
    const shoulders = [[x - 18, y0 - 70], [x + 18, y0 - 72]];
    for (let i = 0; i < 2; i++) {
      const [sx, sy] = shoulders[i], [hx, hy] = hands[i];
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy);
      ctx.strokeStyle = INK; ctx.lineWidth = 15; ctx.stroke();
      ctx.strokeStyle = '#fff6ea'; ctx.lineWidth = 8; ctx.stroke();
      D.circle(ctx, hx, hy, 8, '#fff6ea', 3.5);
    }
  }

  // Dotted path showing where the ball will go (gravity only).
  function drawPreview(ctx, angle, power, color) {
    const len = window.__hoopsGame ? 0 : 0; // (placeholder so lint stays quiet)
    const a = angle * Math.PI / 180, v = VMIN + (VMAX - VMIN) * power;
    const p = restPos(), gm = geo();
    const tMax = previewTime();
    let vx = Math.cos(a) * v, vy = -Math.sin(a) * v, x = p.x, y = p.y;
    const dtp = 1 / 60;
    let n = 0;
    for (let t = 0; t < tMax; t += dtp, n++) {
      vy += G * dtp; x += vx * dtp; y += vy * dtp;
      if (y > FLOOR - BALL_R || x > gm.bx + 10) break;
      if (n % 3 === 2) {
        const k = 1 - t / (tMax + 0.3);
        D.circle(ctx, x, y, 3 + 4 * k, color, 2.5);
      }
    }
    return len;
  }
  function previewTime() { return gameRef ? gameRef.pick(1.8, 0.34, 0.12) : 0.34; }
  let gameRef = null;

  function drawAim(g, ctx) {
    if (!canShoot()) return;
    const p = restPos();
    if (aim) {
      const s = dragShot(aim);
      // stretchy band from the ball to your finger
      ctx.setLineDash([10, 10]); ctx.lineCap = 'round';
      ctx.strokeStyle = INK; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - (aim.sx - aim.x), p.y - (aim.sy - aim.y)); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
      ctx.setLineDash([]);
      powerRing(ctx, p, s.power);
      if (s.len >= 18) drawPreview(ctx, s.angle, s.power, '#ffffff');
    } else if (charging) {
      powerRing(ctx, p, kPower);
      drawPreview(ctx, kAngle, kPower, '#ffffff');
      aimArrow(ctx, p, kAngle, 0.4 + kPower * 0.6);
    } else if (g.input.down('ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD') || keyAimShown > 0) {
      aimArrow(ctx, p, kAngle, 0.6);
    }
  }
  let keyAimShown = 0;
  function aimArrow(ctx, p, angle, k) {
    const a = angle * Math.PI / 180, len = 50 + 60 * k;
    const ex = p.x + Math.cos(a) * len, ey = p.y - Math.sin(a) * len;
    ctx.lineCap = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(p.x + Math.cos(a) * 26, p.y - Math.sin(a) * 26); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 6; ctx.stroke();
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(-a);
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -12); ctx.lineTo(-8, 12); ctx.closePath();
    ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
  }
  function powerRing(ctx, p, power) {
    const col = power < 0.4 ? '#06d6a0' : power < 0.75 ? '#ffd166' : '#ff6b35';
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(p.x, p.y, BALL_R + 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.02, power));
    ctx.strokeStyle = INK; ctx.lineWidth = 11; ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.stroke();
  }

  // "Pull back and let go" hint with a little hand, before the first shot.
  function drawHint(ctx) {
    if (started || aim || charging) return;
    const p = restPos();
    const t = (clock % 2.2) / 2.2;
    const k = Math.min(1, t / 0.6);
    const hx = p.x - 20 - 70 * k, hy = p.y + 20 + 50 * k;
    ctx.setLineDash([8, 10]); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(hx, hy); ctx.stroke(); ctx.setLineDash([]);
    if (t > 0.65) {   // little arc showing the ball flying toward the hoop
      const gm = geo();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.setLineDash([4, 12]); ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(p.x + 20, p.y - 20); ctx.quadraticCurveTo((p.x + gm.x) / 2, gm.y - 200, gm.x - 10, gm.y - 30); ctx.stroke(); ctx.setLineDash([]);
    }
    // the hand
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.5);
    D.box(ctx, -12, -6, 24, 30, 10, '#fff', 4);
    D.box(ctx, -6, -30, 11, 30, 5, '#fff', 4);
    ctx.restore();
  }

  function drawHUD(g, ctx) {
    // score (left)
    D.box(ctx, 104, 12, 180, 58, 18, '#fff', 4);
    drawBall(ctx, 134, 41, 17, 'classic', 0.4);
    D.text(ctx, String(score), 214, 43, { size: 38, color: '#ffd166' });
    // streak: little dots fill up, then the x2 / x3 flame badge
    const need = g.pick(2, 3, 3);
    if (mult > 1) {
      const fl = 1 + Math.sin(clock * 12) * 0.06;
      flame(ctx, 316, 44, 30 * fl, mult === 2 ? '#ff8c42' : '#f15bb5');
      D.text(ctx, 'x' + mult, 316, 50, { size: 28 });
    } else {
      for (let i = 0; i < need; i++) D.circle(ctx, 304 + i * 20, 41, 7, i < streak % need ? '#ff8c42' : '#ffffff', 3);
    }
    // timer (middle)
    const warn = started && !timeUp && timeLeft <= 5;
    const pulse = warn ? 1 + 0.12 * Math.abs(Math.sin(clock * Math.PI)) : 1;
    D.box(ctx, W / 2 - 72, 10, 144, 60, 20, warn ? '#ffe0e6' : '#fff', 4);
    clockIcon(ctx, W / 2 - 40, 40, 16);
    D.text(ctx, String(Math.ceil(timeLeft)), W / 2 + 22, 42, { size: 40 * pulse, color: warn ? '#ef476f' : '#118ab2' });
    // star goal meter (right)
    const mx = 600, mw = 240;
    D.meter(ctx, mx, 30, mw, 22, score / thr[2], '#06d6a0');
    for (let i = 0; i < 3; i++) {
      const sx = mx + mw * thr[i] / thr[2];
      D.star(ctx, Math.min(mx + mw - 4, sx), 41, 15, score >= thr[i] ? '#ffd166' : '#e8e2d4', 3);
    }
    D.text(ctx, String(thr[0]), mx + mw * thr[0] / thr[2], 70, { size: 15, lineWidth: 4 });
  }
  function clockIcon(ctx, x, y, r) {
    D.circle(ctx, x, y, r, '#ffd166', 3.5);
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - r * 0.6); ctx.moveTo(x, y); ctx.lineTo(x + r * 0.45, y + r * 0.2); ctx.stroke();
  }
  function flame(ctx, x, y, s, col) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.1, y + s * 0.6, x - s * 0.7, y - s * 0.4, x - s * 0.2, y - s);
    ctx.quadraticCurveTo(x - s * 0.05, y - s * 0.4, x + s * 0.25, y - s * 0.55);
    ctx.bezierCurveTo(x + s * 0.5, y - s * 0.2, x + s * 1.1, y + s * 0.3, x, y + s * 0.9);
    ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  }

  function render(g, ctx) {
    gameRef = g;
    if (!L) { ctx.fillStyle = '#7fc8f8'; ctx.fillRect(0, 0, W, H); return; }
    drawGym(ctx);
    // warm glow around the edges while on fire
    if (mult > 1) {
      ctx.save();
      ctx.globalAlpha = 0.18 + 0.08 * Math.sin(clock * 5) + fireFlash * 0.15;
      const gr = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 620);
      gr.addColorStop(0, 'rgba(255,140,66,0)'); gr.addColorStop(1, mult === 2 ? '#ff8c42' : '#f15bb5');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    // ball shadows on the floor
    for (const b of balls) {
      const hgt = FLOOR - b.y;
      ctx.fillStyle = `rgba(0,0,0,${0.2 * b.fade * Math.max(0.2, 1 - hgt / 400)})`;
      ctx.beginPath(); ctx.ellipse(b.x, FLOOR + 2, Math.max(8, 20 - hgt * 0.03), 5, 0, 0, Math.PI * 2); ctx.fill();
    }
    drawHoopBack(ctx);

    const holding = canShoot() || (ready && !timeUp && !finished);
    drawHero(ctx, heroX, holding);
    if (holding) drawBall(ctx, restPos().x, restPos().y, BALL_R, nextIsGold() ? 'gold' : design, 0);
    drawArms(ctx, heroX, holding);

    for (const b of balls) drawBall(ctx, b.x, b.y, BALL_R, b.gold ? 'gold' : design, b.spin, Math.max(0, Math.min(1, b.fade)));
    drawHoopFront(ctx);

    drawAim(g, ctx);
    drawHint(ctx);

    for (const p of popups) {
      ctx.save(); ctx.globalAlpha = Math.min(1, (1.3 - p.t) * 3);
      D.text(ctx, p.text, p.x, p.y, { size: p.size * (p.t < 0.15 ? 0.6 + p.t / 0.15 * 0.4 : 1), color: p.color });
      ctx.restore();
    }
    drawHUD(g, ctx);
    if (bigText) {
      const k = Math.min(1, bigText.t / 0.2);
      const sz = (bigText.text === 'Time!' ? 110 : 64) * (0.5 + 0.5 * k);
      D.text(ctx, bigText.text, W / 2, H / 2 - 70, { size: sz, color: bigText.color });
    }
  }
  function nextIsGold() { return !!L.gold && (shots + 1) % 4 === 0; }

  // ---------------------------------------------------------------
  // Menus: level tiles and the ball picker
  // ---------------------------------------------------------------
  function levelPic(lv) {
    const timed = lv.kind === 'timed';
    let extra = '';
    if (timed) extra = `<circle cx="30" cy="34" r="20" fill="#ffd166" stroke="#2b2b2b" stroke-width="3.5"/><text x="30" y="41" font-size="19" font-weight="800" text-anchor="middle" font-family="Trebuchet MS, sans-serif" fill="#2b2b2b">${lv.time}</text>`;
    else {
      extra = `<circle cx="28" cy="44" r="12" fill="#ff8c42" stroke="#2b2b2b" stroke-width="3"/><path d="M18 44 H38 M28 32 V56" stroke="#2b2b2b" stroke-width="2"/>`;
      if (lv.move && lv.move.x) extra += `<path d="M52 10 H96 M58 4 L52 10 L58 16 M90 4 L96 10 L90 16" fill="none" stroke="#ef476f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
      if (lv.move && lv.move.y) extra += `<path d="M108 14 V60 M102 20 L108 14 L114 20 M102 54 L108 60 L114 54" fill="none" stroke="#ef476f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
      if (lv.boardStar) extra += `<path d="M93 26 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1z" fill="#ffd166" stroke="#2b2b2b" stroke-width="2"/>`;
      if (lv.spots[0] < THREE_X) extra += `<circle cx="28" cy="16" r="10" fill="#118ab2" stroke="#2b2b2b" stroke-width="3"/><text x="28" y="21" font-size="14" font-weight="800" text-anchor="middle" font-family="Trebuchet MS, sans-serif" fill="#fff">3</text>`;
    }
    return `<svg viewBox="0 0 120 70"><rect width="120" height="70" rx="8" fill="#9fd8fb"/><rect y="58" width="120" height="12" fill="#f0b86e"/>` +
      `<rect x="86" y="16" width="12" height="40" rx="3" fill="#fff" stroke="#2b2b2b" stroke-width="3"/>` +
      `<path d="M64 36 L70 54 H80 L86 36" fill="#fff" stroke="#2b2b2b" stroke-width="2.5"/><ellipse cx="75" cy="36" rx="12" ry="3.5" fill="none" stroke="#2b2b2b" stroke-width="6"/><ellipse cx="75" cy="36" rx="12" ry="3.5" fill="none" stroke="#ff6b35" stroke-width="3"/>` +
      extra + `</svg>`;
  }

  function levels(g) {
    const has = id => ((g.save.levels[id] || {}).stars || 0) >= 1;
    return LEVELS.map((lv, i) => {
      let locked = false;
      if (lv.id === 'q60') locked = !has('q30');
      else if (lv.kind === 'chal' && lv.id !== 'c1') locked = !has(LEVELS[i - 1].id);
      const rec = g.save.levels[lv.id] || {};
      return { ...lv, pic: levelPic(lv), locked,
        meta: Arcade.starsHTML(rec.stars || 0) + (rec.score ? ' <b>' + rec.score + '</b>' : '') };
    });
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
    } else inner = '<circle cx="35" cy="35" r="28" fill="#ff8c42"/><path d="M7 35 H63 M35 7 V63 M14 15 Q26 35 14 55 M56 15 Q44 35 56 55" fill="none" stroke="#2b2b2b" stroke-width="3"/>';
    return `<svg viewBox="0 0 70 70">${inner}<ellipse cx="25" cy="23" rx="7" ry="4.5" fill="#fff" opacity="0.55" transform="rotate(-35 25 23)"/>${ring}</svg>`;
  }

  function extraMenu(g) {
    checkUnlocks(g);
    const wrap = Arcade.h('div');
    wrap.appendChild(Arcade.h('h2', { class: 'ar-title', style: 'font-size:24px;margin-top:16px' }, 'Pick your ball'));
    const row = Arcade.h('div', { class: 'ar-grid' });
    const current = pickedBall(g);
    const starSvg = icons.star(true).replace('<svg', '<svg style="width:20px;height:20px;vertical-align:middle"');
    for (const b of BALLS) {
      const ok = ballUnlocked(g, b);
      const need = b.score != null ? b.score + ' pts' : b.stars + ' ' + starSvg;
      const tile = Arcade.h('button', { type: 'button', class: 'ar-tile' + (ok ? '' : ' locked') + (b.id === current ? ' picked' : '') },
        `<div class="pic">${ballIcon(b.id)}</div><div>${b.name}</div><div class="meta">${ok ? '' : need}</div>` + (ok ? '' : `<div class="lock">${icons.lock}</div>`));
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
  Arcade.start({
    id: 'hoops',
    title: 'Hoop Heroes',
    view: { w: W, h: H },
    background: '#7fc8f8',
    music: 'happy',
    levelsTitle: 'Pick a game',
    howTo: [
      { pic: S(BALL_SVG(52, 26, 14) + `<path d="M48 32 L20 60" stroke="#2b2b2b" stroke-width="4" stroke-dasharray="6 6" stroke-linecap="round"/><rect x="10" y="54" width="18" height="22" rx="8" fill="#fff" stroke="#2b2b2b" stroke-width="3.5" transform="rotate(-30 19 65)"/>`), text: 'Pull back, let go!', keys: 'Drag &middot; or arrows + hold Space' },
      { pic: S(`<path d="M18 30 L26 64 H54 L62 30" fill="#fff" stroke="#2b2b2b" stroke-width="3"/><ellipse cx="40" cy="30" rx="22" ry="6" fill="none" stroke="#2b2b2b" stroke-width="8"/><ellipse cx="40" cy="30" rx="22" ry="6" fill="none" stroke="#ff6b35" stroke-width="4"/>` + BALL_SVG(40, 14, 12)), text: 'In the hoop = points! Clean swish = bonus' },
      { pic: S(`<path d="M40 74 C10 66 16 36 32 10 Q36 30 46 26 C56 40 66 62 40 74 Z" fill="#ff8c42" stroke="#2b2b2b" stroke-width="4"/><text x="40" y="60" font-size="22" font-weight="800" text-anchor="middle" font-family="Trebuchet MS, sans-serif" fill="#fff" stroke="#2b2b2b" stroke-width="1">x2</text>`), text: 'Baskets in a row = x2, x3!' },
      { pic: S(`<circle cx="40" cy="42" r="28" fill="#ffd166" stroke="#2b2b2b" stroke-width="4"/><path d="M40 42 V24 M40 42 L52 48" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/>`), text: 'Score lots before time runs out' },
      { pic: S(`<circle cx="26" cy="46" r="18" fill="#ffc93c" stroke="#2b2b2b" stroke-width="3.5"/><path d="M58 14 l6 12 13 2 -9.5 9 2.5 13 -12 -6.5 -12 6.5 2.5 -13 -9.5 -9 13 -2z" fill="#ffd166" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/>`), text: 'Gold balls & stars = extra!' },
    ],
    levels,
    extraMenu,
    setup,
    update,
    draw: render,
    onFinish(g) { setTimeout(() => checkUnlocks(g), 600); },
  });
})();
