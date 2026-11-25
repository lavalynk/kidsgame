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
  const BASE_RIM = 2.3;       // rim height (m)
  let RIM_H = BASE_RIM;       // (it bobs up and down on the "Up and Down" challenge court, see COURTS)
  const HOOP_Z = 3.0;         // normal hoop distance (m)
  const BONUS_Z = 4.1;        // bonus round: the hoop slides back
  const BALL_R = 0.12;        // ball radius (m)
  const GRAV = 9.8;
  // where a ball leaves your hands (Keith, Nov 21: "the ball needs to be pushed up on the screen a little, it's hard
  // on a PC with such little space": it was at h 1.27, right on the bottom edge, so there was no room to pull back)
  const START = { x: 0, h: 1.47, z: 0.2 };
  const PULL = 150;           // a pull back of this many screen dots = power 1 (was 170)
  let OX = 0;                 // sideways shift, used to draw the machines next to yours
  const proj = (x, h, z) => { const s = F / (z + CAM_D); return { x: W / 2 + (x + OX) * s, y: HORIZON - (h - CAM_H) * s, s }; };

  // ---------------------------------------------------------------
  // The tournament ladder. Beat each rival to unlock the next one.
  //   time   = seconds on the clock (the last 10 are the 3-point bonus)
  //   rival  = their name, how many shots a second, how many go in (0..1)
  //            (Keith, Nov 21: "computer is scoring way too fast and making all the shots": rivals used to shoot
  //             0.9-1.5 times a second and score 50-140 points; now about one shot every 1.5-2 s, under half go in)
  //   move   = the hoop slides: x = how far left/right (m), speed
  //   stars  = your points for 2 and 3 stars (1 star = beat the rival)
  // ---------------------------------------------------------------
  //   diff   = which difficulty it plays on (Nov 24: written down per level, so adding the challenge courts
  //            never changes the old rivals' difficulty; it used to come from the place in the list)
  const LEVELS = [
    { id: 'r1', diff: 'easy', name: 'Ruby Rookie',   time: 30, rival: { name: 'Ruby',  color: '#ef476f', rate: 0.45, acc: 0.4 }, stars: [16, 24] },
    { id: 'r2', diff: 'easy', name: 'Dash the Dog',  time: 30, rival: { name: 'Dash',  color: '#ff8c42', rate: 0.5, acc: 0.42 }, stars: [18, 28] },
    { id: 'r3', diff: 'easy', name: 'Slidey Sid',    time: 40, rival: { name: 'Sid',   color: '#06d6a0', rate: 0.5, acc: 0.45 }, stars: [24, 34], move: { x: 0.35, speed: 0.6 } },
    { id: 'r4', diff: 'normal', sky: 'sunset', name: 'Speedy Sam',    time: 40, rival: { name: 'Sam',   color: '#118ab2', rate: 0.6, acc: 0.45 }, stars: [28, 40] },
    { id: 'r5', diff: 'normal', sky: 'sunset', name: 'Bounce Bella',  time: 45, rival: { name: 'Bella', color: '#9b5de5', rate: 0.6, acc: 0.48 }, stars: [32, 46], move: { x: 0.45, speed: 0.8 } },
    { id: 'r6', diff: 'normal', sky: 'evening', name: 'Tall Tia',      time: 45, rival: { name: 'Tia',   color: '#f15bb5', rate: 0.65, acc: 0.5 }, stars: [36, 52] },
    { id: 'r7', diff: 'challenge', sky: 'evening', name: 'Wiggle Wes',    time: 50, rival: { name: 'Wes',   color: '#ffd166', rate: 0.65, acc: 0.5 }, stars: [46, 62], move: { x: 0.55, speed: 0.9 } },
    { id: 'r8', diff: 'challenge', sky: 'night', show: 'finals', name: 'The Champ',     time: 60, rival: { name: 'Champ', color: '#2b2b2b', rate: 0.7, acc: 0.55 }, stars: [62, 84], move: { x: 0.4, speed: 0.9 } },
    { id: 'free', diff: 'normal', sky: 'night', show: 'disco', name: 'High Score',  time: 45, rival: null, stars: [40, 70, 100], free: true, noStart: true },
    // ---- the challenge courts (Nov 24, new plan point 7): no rival, a twist instead; your score earns the stars
    //  (stars = the points for 1, 2 and 3 stars; 1 star = done, and it opens the next court).
    //   court 'gold'   = every 3rd ball is a GOLDEN ball, worth 5
    //   court 'updown' = the hoop rides up and down (rise = how far, m; speed)
    //   court 'zoom'   = the hoop glides near and far (near / far = its distance, m); far away = 3 points
    //   (the star marks come from the playtest robot, Nov 24: tools/playtest.py hoops c1 c2 c3 c4; on Easy they're 20% lower)
    //   court 'hot'    = the net starts ON FIRE: every basket on fire is worth 3, and 2 in a row lights it again
    { id: 'c1', diff: 'easy', section: 'Challenges', court: 'gold', name: 'Golden Balls', time: 40, stars: [30, 50, 80] },
    { id: 'c2', diff: 'normal', section: 'Challenges', court: 'updown', sky: 'sunset', name: 'Up and Down', time: 40, rise: 0.32, speed: 0.75, stars: [22, 34, 46] },
    { id: 'c3', diff: 'normal', section: 'Challenges', court: 'zoom', sky: 'evening', name: 'Near and Far', time: 40, near: 2.55, far: 3.95, speed: 0.6, stars: [24, 38, 52] },
    { id: 'c4', diff: 'challenge', section: 'Challenges', court: 'hot', sky: 'night', show: 'disco', name: 'Hot Shots', time: 45, stars: [30, 48, 64] },
  ];
  const isCourt = (l) => !!(l && l.court);
  const solo = () => !!(L && (L.free || L.court));      // no rival: your score earns the stars

  // ---------------------------------------------------------------
  // Balls you can unlock. Each one is a basketball in its own colors, and
  // the special ones leave a trail when they fly (neon glow, ice sparkles...).
  //   fill / fill2 = main color and the lighter shine color
  //   seam = the line color, trail = what it leaves behind in the air
  // ---------------------------------------------------------------
  const BALLS = [
    { id: 'classic', name: 'Classic',   fill: '#ff8c42', fill2: '#ffb37a', seam: '#2b2b2b', trail: null,      need: null },
    { id: 'red',     name: 'Fire Red',  fill: '#e63946', fill2: '#ff7b84', seam: '#2b2b2b', trail: null,      need: 'Beat Ruby',  ok: g => beaten(g) >= 1 },
    { id: 'blue',    name: 'Ice Blue',  fill: '#4cc9f0', fill2: '#c8f3ff', seam: '#1d3557', trail: 'ice',     need: 'Beat Dash',  ok: g => beaten(g) >= 2 },
    { id: 'neon',    name: 'Neon Green', fill: '#7cff4f', fill2: '#d6ffc4', seam: '#145214', trail: 'neon',   need: 'Beat Sid',   ok: g => beaten(g) >= 3 },
    { id: 'pink',    name: 'Hot Pink',  fill: '#ff4fa3', fill2: '#ffb3d9', seam: '#5a0a33', trail: 'hearts',  need: 'Beat Sam',   ok: g => beaten(g) >= 4 },
    { id: 'retro',   name: 'Retro',     fill: '#e63946', fill2: '#ffffff', seam: '#2b2b2b', trail: null,      need: 'Beat Bella', ok: g => beaten(g) >= 5, stripes: ['#e63946', '#ffffff', '#1f4fbf'] },
    { id: 'galaxy',  name: 'Galaxy',    fill: '#3a1c71', fill2: '#7b4fd6', seam: '#c9b8ff', trail: 'stars',   need: 'Beat Tia',   ok: g => beaten(g) >= 6 },
    { id: 'lava',    name: 'Lava',      fill: '#2b2b2b', fill2: '#5a3a3a', seam: '#ff8c42', trail: 'embers',  need: 'Beat Wes',   ok: g => beaten(g) >= 7 },
    { id: 'gold',    name: 'Golden',    fill: '#ffc93c', fill2: '#fff3b0', seam: '#a8740a', trail: 'sparkle', need: 'Beat the Champ', ok: g => beaten(g) >= 8 },
    { id: 'rainbow', name: 'Rainbow',   fill: '#ff8c42', fill2: '#ffffff', seam: '#2b2b2b', trail: 'rainbow', need: '3 stars on every rival', ok: g => LEVELS.filter(l => l.rival).every(l => ((g.save.levels[l.id] || {}).stars || 0) >= 3),
      stripes: ['#ef476f', '#ff8c42', '#ffd166', '#06d6a0', '#118ab2', '#9b5de5'] },
    // (Nov 24) the challenge courts' prize: a shiny disco ball with a star trail
    { id: 'disco',   name: 'Disco',     fill: '#b9c3ff', fill2: '#ffffff', seam: '#5a4fcf', trail: 'stars', need: 'A star on every challenge court', ok: g => courtsStarred(g) },
  ];
  const TRAIL_NAME = { ice: 'Ice sparkle trail', neon: 'Neon glow trail', hearts: 'Heart trail', stars: 'Star trail', embers: 'Lava ember trail', sparkle: 'Gold sparkle trail', rainbow: 'Rainbow trail' };
  const ballDef = (id) => BALLS.find(b => b.id === id) || BALLS[0];
  const COURT_IDS = () => LEVELS.filter(isCourt).map(l => l.id);
  function courtsStarred(g) { return COURT_IDS().every(id => ((g.save.levels[id] || {}).stars || 0) >= 1); }
  function beaten(g) { return LEVELS.filter(l => l.rival && (g.save.levels[l.id] || {}).done).length; }
  function ballUnlocked(g, b) { return !b.ok || g.isUnlocked('ball-' + b.id); }
  function pickedBall(g) { const b = BALLS.find(x => x.id === g.save.data.ball); return b && ballUnlocked(g, b) ? b.id : 'classic'; }
  function checkUnlocks(g) { for (const b of BALLS) if (b.ok && b.ok(g)) g.unlock('ball-' + b.id, b.name + ' ball!'); }

  // ---------------------------------------------------------------
  // Game state
  // ---------------------------------------------------------------
  let goals = [];      // the star marks for High Score (see setup)
  let L, balls, score, rival, timeLeft, started, over, endWait, streak, onFire, made, shots, swishes,
    bestStreak, bonusMade, hoop, rimR, assist, popups, fx, aim, charge, drag, nextBall, ready, design,
    bigText, clock, net, buzzerBeater, crowd, neighbors;
  let countdown = 0;   // Friends games: "3, 2, 1, GO!" on every phone at once, then everyone's clock starts

  // ---------------------------------------------------------------
  // Friends (Keith's plan, point 3): head-to-head on several phones.
  // Everyone gets the same clock; your friend's score shows on the scoreboard
  // instead of the rival's, and you see their shots fly next door.
  // ---------------------------------------------------------------
  const party = () => Arcade.net && Arcade.net.party;
  const FR_TIMES = { s30: 30, s60: 60 };
  let friendScores = {}, sentScore = -1, sendT = 0;
  const clockPic = (n) => `<svg viewBox="0 0 120 70"><rect width="120" height="70" rx="8" fill="#3b2a7a"/><circle cx="60" cy="35" r="26" fill="#fff" stroke="#2b2b2b" stroke-width="4"/><path d="M60 35 V18 M60 35 L72 42" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/><text x="60" y="66" font-size="16" font-weight="900" text-anchor="middle" fill="#ffd166" font-family="sans-serif">${n}</text></svg>`;
  function friendsMenu(g) {
    if (!party()) return;
    friendsWire(g);
    party().menu(g, {
      choices: [{ id: 's30', name: '30', pic: clockPic('30') }, { id: 's60', name: '60', pic: clockPic('60') }],
      onStart: (id) => g.play({ id: 'fr-' + id, name: 'Friends', time: FR_TIMES[id] || 30, friends: true, pick: id, stars: [30, 50], rival: { name: 'Friend', color: '#4cc9f0' } }),
      onBack: () => g.menu(),
    });
  }
  let wired = false;
  function friendsWire(g) {
    if (wired) return; wired = true;
    // a friend's score arrived: show the best friend on the scoreboard, and their ball flies next door
    party().on('score', (m) => {
      const before = (friendScores[m.from] || {}).s || 0;
      friendScores[m.from] = { s: m.s, done: !!m.done };
      if (!L || !L.friends || !rival) return;
      if (m.s > before && neighbors) neighborShot(neighbors[1], true);
      let best = null;
      for (const k in friendScores) if (!best || friendScores[k].s > friendScores[best].s) best = k;
      const p = party().peers[best] || {};
      rival.score = friendScores[best].s; rival.color = p.color || '#4cc9f0';
      rival.name = (p.name || 'Friend').slice(0, 8);
    });
    party().on('leave', (m) => { delete friendScores[m.from]; });
  }

  function setup(g, level) {
    L = level || LEVELS[0];
    if (L.friends) { friendScores = {}; sentScore = -1; sendT = 0; }
    countdown = L.friends ? 3.2 : 0;
    // (Nov 23, playtest: pretend big kids never beat Wes or the Champ on Challenge (0 of 12, ~16-30% in);
    //  Challenge now helps a little more and the rivals don't get faster on it)
    // High Score's star marks: on Easy 20% lower (Nov 23, playtest: little kids scored 36-44 in the 45 s, the 1st star was 40)
    goals = solo() && g.difficulty === 'easy' ? L.stars.map(s => Math.round(s * 0.8)) : L.stars;   // (the challenge courts too)
    rimR = g.pick(0.3, 0.24, 0.225);                 // Easy has a bigger hoop
    assist = g.pick(0.55, 0.25, 0.16);               // how much we gently help your aim
    balls = []; popups = []; fx = new Arcade.Particles();
    goldMade = 0;
    score = 0; streak = 0; onFire = false; made = 0; shots = 0; swishes = 0; bestStreak = 0; bonusMade = 0;
    timeLeft = L.time; started = false; over = false; endWait = 0; clock = 0; buzzerBeater = false;
    hoop = { x: 0, z: HOOP_Z };
    RIM_H = rimAt(0); hoop.z = hoopZAt(0);           // (the challenge courts' moving hoop starts in the middle)
    rival = L.rival ? { ...L.rival, score: 0, t: 0.8, mult: g.pick(0.7, 1, 1), seed: 7 } : null;
    aim = 0; charge = null; drag = null; nextBall = 0; ready = true; bigText = null; crowd = 0;
    net = { swish: 0, fire: 0 };
    if (L.court === 'hot') onFire = true;           // Hot Shots: the net is on fire from the start
    // the two machines next to yours: a kid on the left, your rival on the right
    neighbors = [{ ox: -2.5, balls: [], net: { swish: 0 }, t: 1 }, { ox: 2.5, balls: [], net: { swish: 0 }, t: 0, rival: true }];
    design = pickedBall(g);
    gref = g; L._done = false;
    L._best = (g.save.levels[L.id] || {}).score || 0;

    // ---- test hooks ----
    window.__hoopsState = () => ({
      level: L.id, countdown, started, score, rival: rival ? rival.score : null, timeLeft, over, streak, onFire, made, shots, swishes,
      bonus: inBonus(), hoop: { ...hoop }, flying: balls.filter(b => b.state === 'fly').length, ready,
      hand: { y: proj(START.x, START.h, START.z).y, r: BALL_R * proj(START.x, START.h, START.z).s, pull: PULL },
      balls: balls.map(b => ({ state: b.state, x: +b.x.toFixed(3), h: +b.h.toFixed(3), z: +b.z.toFixed(3) })),
    });
    window.__hoopsShoot = (power, aimX) => shoot(g, power, aimX);   // test-only
    window.__hoopsPerfect = () => perfectPower();                  // test-only
    window.__hoopsCourt = () => ({ court: L.court || null, rim: RIM_H, z: hoop.z, three: threeNow(), goldNext: goldNow(), goals: goals.slice(), golden: goldMade, fire: onFire });   // test-only
    window.__hoopsRivals = () => LEVELS.filter(l => l.rival).map(l => ({ name: l.rival.name, rate: l.rival.rate, acc: l.rival.acc, time: l.time, stars: l.stars }));
    // the playtest robot (tools/playtest.py): a pretend child shoots (kidThink), fast-forward with __hoopsStep
    window.__hoopsKid = (on, seed) => { Object.assign(kid, { on: !!on, seed: Math.max(1, (seed | 0) % 2147483646), rseed: Math.max(1, ((seed | 0) * 3 + 11) % 2147483646), feel: null, off: null, lead: 0, wait: 0.6 }); kid.stats = { shots: 0 }; };
    window.__hoopsStep = (sec) => { for (let i = 0; i < sec * 120 && g.state === 'play' && !L._done; i++) update(g, 1 / 120); };
    window.__hoopsKidReport = () => {
      const win = solo() ? score >= goals[0] : score > rival.score;
      return { level: L.id, diff: g.difficulty, little: !!g.little, done: !!L._done, score, rival: rival ? rival.score : null, win,
        stars: solo() ? (score >= goals[2] ? 3 : score >= goals[1] ? 2 : score >= goals[0] ? 1 : 0) : !win ? 0 : score >= L.stars[1] ? 3 : score >= L.stars[0] ? 2 : 1,
        made, shots, swishes, bonusMade, bestStreak };
    };
    window.__hoopsAimNow = () => { const pp = perfectPower(); shoot(g, pp, (hoop.x - START.x) / flightTime(pp)); };   // test-only (aimed at the hoop as it is NOW)
    window.__hoopsAimAhead = () => { const A = aimFor(clock); shoot(g, A.pp, A.x); };   // test-only: a perfect shot at where a moving hoop WILL be
    window.__hoopsEnd = () => { started = true; timeLeft = Math.min(timeLeft, 0.05); };   // test-only: ring the buzzer
  }

  // test + preview hook: draw just the hall (windows, town, spotlights) of a level at a time t, w wide
  window.__hoopsScene = {
    W: 960, H,
    levels: LEVELS.map(l => ({ id: l.id, time: l.sky || 'day', show: l.show || null })),
    cached: () => [...halls.keys()],
    cages: () => [...cages.keys()],                     // (the machines' cages, painted once: Nov 24)
    level: (id) => LEVELS.find(l => l.id === id),       // the whole level (to start it with __game.play)
    draw(ctx, id, t = 0, w = 960) {
      const keep = { L, W };
      L = LEVELS.find(l => l.id === id) || LEVELS[0]; W = w;
      const tt = calmNow() ? 0 : t;
      drawHall(ctx, tt); drawShow(ctx, tt);
      ({ L, W } = keep);
    },
  };

  const inBonus = () => started && !over && timeLeft <= 10 && L.time > 10 && L.court !== 'zoom';
  // ---- the challenge courts' moving hoops (Nov 24) ----
  // rimAt(t) = the rim's height at time t (Up and Down), hoopZAt(t) = how far away it is (Near and Far).
  const rimAt = (t) => L && L.court === 'updown' ? BASE_RIM + Math.sin(t * L.speed) * L.rise : BASE_RIM;
  const hoopZAt = (t) => L && L.court === 'zoom' ? (L.near + L.far) / 2 - Math.cos(t * L.speed) * (L.far - L.near) / 2 : hoop.z;
  const ZOOM_3 = 3.4;                                 // Near and Far: further away than this = 3 points
  // is a basket worth 3 right now? (the bonus, or the Near and Far hoop out in the 3-point zone)
  const threeNow = () => inBonus() || (!!L && L.court === 'zoom' && !over && hoop.z >= ZOOM_3);
  // Golden Balls: every 3rd ball is golden (the one in your hands when shots is 2, 5, 8...)
  const goldNow = () => !!L && L.court === 'gold' && shots % 3 === 2;
  let goldMade = 0;
  // The pull + sideways speed that drops a ball into the hoop where it WILL be when the ball gets there
  // (a sliding, bobbing or gliding hoop): guess the flight time, look where the hoop is then, work out the
  // shot for that spot, and again a couple of times (each guess gets closer).
  function aimFor(t0) {
    let ft = 0.9, pp = 0.5;
    for (let k = 0; k < 3; k++) { const rh = rimAt(t0 + ft); pp = perfectPower(hoopZAt(t0 + ft), rh); ft = flightTime(pp, rh); }
    return { pp, ft, x: (hoopXAt(t0 + ft) - START.x) / ft };
  }
  function rimPos() { return { x: hoop.x, h: RIM_H, z: hoop.z }; }

  // The launch speed that drops the ball right into the middle of the hoop
  // (worked out by trying lots of speeds: simple and good enough).
  function perfectPower(z = hoop.z, rh = RIM_H) {
    let best = 0.5, bestErr = 1e9;
    for (let p = 0; p <= 1.2; p += 0.005) {
      const v = launch(p, 0);
      // when does the ball come back down to rim height?
      const a = -GRAV / 2, b = v.vh, c = START.h - rh;
      const disc = b * b - 4 * a * c; if (disc < 0) continue;
      const t = (-b - Math.sqrt(disc)) / (2 * a);
      const zz = START.z + v.vz * t;
      const err = Math.abs(zz - z);
      if (err < bestErr) { bestErr = err; best = p; }
    }
    return best;
  }
  // how long a shot with this power takes to come back down to rim height (s), and where a sliding hoop is at a time
  function flightTime(power, rh = RIM_H) {
    const v = launch(power, 0), a = -GRAV / 2, b = v.vh, c = START.h - rh;
    const disc = b * b - 4 * a * c;
    return disc < 0 ? 0.95 : (-b - Math.sqrt(disc)) / (2 * a);
  }
  const hoopXAt = (t) => L.move ? Math.sin(t * L.move.speed) * L.move.x : 0;
  function launch(power, aimX) {
    // speed (m/s) and a nice high arc (~57°). (Nov 21: 2.2 per power, was 3.6: a basket was a pull of only ~60 dots,
    //  so a tiny wobble of the mouse missed; now ~80 dots for a basket, ~135 for the far 3-point hoop)
    const v = 5.0 + power * 2.2, ang = 1.0;
    return { vx: aimX, vh: v * Math.sin(ang), vz: v * Math.cos(ang) };
  }

  // Shoot! power 0..1.2, aimX = sideways speed (m/s)
  function shoot(g, power, aimX) {
    if (!ready || over || countdown > 0) return;      // (no shooting before GO!)
    if (!started) started = true;
    // a gentle helping hand (more on Easy)
    // aim needed to reach the hoop: on a moving hoop, where the hoop WILL be when the ball gets there (Nov 23,
    // playtest: the help used to aim at where it was, so on Wiggle Wes's fast hoop almost every shot missed)
    const A = aimFor(clock);
    power = power + (A.pp - power) * assist;
    aimX = aimX + (A.x - aimX) * assist;
    const v = launch(power, aimX);
    balls.push({ x: START.x, h: START.h, z: START.z, ...v, state: 'fly', rim: false, spin: 0, trail: [], fire: onFire, scored: false, bonus: inBonus(), gold: goldNow() });
    shots++; ready = false; nextBall = 0.45;
    g.sfx('whoosh');
    g.juice.squash(balls[balls.length - 1]).hit(-0.3);       // (game feel: the ball stretches as it leaves your hands)
    const sp = proj(START.x, START.h, START.z);
    g.juice.dust(sp.x, sp.y + 30, { to: fx, colors: ['#ffffff', '#c9c3ff'], count: 4, size: 14 });
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

    // Friends: 3, 2, 1, GO! — the clock starts at GO for everyone (not at your first shot)
    if (countdown > 0) {
      const before = Math.ceil(countdown - 0.2);
      countdown -= dt;
      const n = Math.ceil(countdown - 0.2);
      if (n !== before && n >= 1) g.sfx('beep');
      if (countdown <= 0) { countdown = 0; started = true; g.sfx('go'); bigText = { text: 'GO!', t: 0.9, color: '#06d6a0' }; g.juice.pop('big', 0.5); }
    }
    // the clock starts with your first shot
    if (started && !over) {
      const before = timeLeft;
      timeLeft = Math.max(0, timeLeft - dt);
      if (before > 10 && timeLeft <= 10 && L.time > 10) { bigText = { text: '3-POINT BONUS!', t: 2, color: '#ffd166' }; g.sfx('unlock'); g.juice.pop('big', 0.5); }
      if (Math.ceil(before) !== Math.ceil(timeLeft) && timeLeft <= 5 && timeLeft > 0) g.tone(880, 0.08, { type: 'square', vol: 0.15 });
      if (timeLeft <= 0) { over = true; endWait = 1.6; g.tone(160, 0.9, { type: 'sawtooth', vol: 0.25 }); bigText = { text: 'BUZZER!', t: 1.4, color: '#ef476f' }; g.juice.pop('big', 0.5); }
    }
    // the hoop: slides back for the bonus round, and wiggles on some levels
    const wantZ = inBonus() || (over && timeLeft <= 0 && L.time > 10 && hoop.z > HOOP_Z + 0.5) ? BONUS_Z : HOOP_Z;
    hoop.z += (wantZ - hoop.z) * Math.min(1, dt * 3);
    hoop.x = hoopXAt(clock);
    if (L.court === 'zoom') hoop.z = hoopZAt(clock);    // (challenge courts: the hoop glides near + far, or rides up + down)
    RIM_H = rimAt(clock);

    // the rival shoots too
    // Friends: tell the others my score (4 times a second, when it changed)
    if (L.friends && party() && (sendT -= dt) <= 0) {
      sendT = 0.25;
      if (score !== sentScore) { sentScore = score; party().tell({ t: 'score', s: score }); }
    }
    if (rival && !L.friends && started && !over) {
      rival.t -= dt;
      if (rival.t <= 0) {
        const rnd = kid.on ? rivalRnd : Math.random;      // (the playtest robot's rounds use a dice that can be repeated)
        rival.t = 1 / (rival.rate * rival.mult) * (0.8 + rnd() * 0.4);
        const made = rnd() < rival.acc * Math.min(1.1, rival.mult);
        if (made) { rival.score += inBonus() ? 3 : 2; g.juice.pop('rival', 0.3); }
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

    if (kid.on) kidThink(g, dt);
    // ---- controls ----
    // touch / mouse: pull back (drag down) and let go
    const pt = inp.pointer;
    if (pt.justDown && pt.y > H * 0.25) drag = { x: pt.x, y: pt.y };
    if (drag && !pt.down) {
      const dx = pt.x - drag.x, dy = pt.y - drag.y;
      if (dy > 20) shoot(g, math.clamp(dy / PULL, 0, 1.2), math.clamp(-dx / 160, -1.4, 1.4));
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
    // (Nov 24, the Star Road) the trail picked in Looks follows each ball through the air
    balls.forEach((b, i) => { if (b.state === 'fly') { const p = proj(b.x, b.h, b.z); g.looks.trail(p.x, p.y, { to: fx, key: 'ball' + i, scale: Math.max(0.6, BALL_R * p.s / 22) }); } });
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
      if (b.state !== 'fly') { afterShot(b, dt, 0, null); continue; }   // (through the net / down to the ramp, like yours)
      const prevH = b.h;
      b.vh -= GRAV * dt; b.x += b.vx * dt; b.h += b.vh * dt; b.z += b.vz * dt;
      if (b.made && prevH > RIM_H && b.h <= RIM_H && b.vh < 0) { b.state = 'drop'; b.x = 0; b.z = hoop.z; nb.net.swish = 1; }
      cage(b);
      if (b.h < rampH(b.z) + BALL_R) b.state = 'bounce';
    }
    nb.balls = nb.balls.filter(b => b.state !== 'gone');
  }

  function moveBall(g, b, dt) {
    b.spin += dt * 8;
    if (b.state !== 'fly') { afterShot(b, dt, rimPos().x, g); return; }
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
        g.sfx('thud');                                // (game feel: a thump, the ball squashes, the board wobbles)
        g.juice.squash(b).hit(0.3);
        const bp = proj(b.x, b.h, bz); g.juice.dust(bp.x, bp.y, { to: fx, colors: ['#ffffff', '#e0dcff'], count: 4, size: 12 });
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
          g.sfx('clang');                             // (game feel: clang! sparks, the rim wobbles, a tiny pause)
          g.juice.squash(b).hit(0.28); g.juice.squash('rim').hit(0.18); g.juice.stop(0.035);
          const cp = proj(b.x, RIM_H, b.z);
          fx.burst(cp.x, cp.y, { count: 6, shape: 'star', colors: ['#ffd166', '#ff8c42', '#ffffff'], speed: 160, size: 7, gravity: 200, life: 0.35 });
        }
      }
      cage(b);
      // down on the ramp without going in: a miss
      if (b.h < rampH(b.z) + BALL_R) { missBall(g, b); return; }
    }
    b.trail.push(proj(b.x, b.h, b.z)); if (b.trail.length > 10) b.trail.shift();
  }
  // the ramp: low near you, higher by the hoop
  const rampH = (z) => 0.5 + Math.max(0, z - 0.6) * 0.12;
  const CAGE_X = 1, CAGE_Z = BONUS_Z + 0.45;           // the side nets (x = -1 / +1) and the back of the cage

  // The cage's side nets and back keep the ball in: it bounces off them (Keith, Nov 21: "the ball isn't
  // falling the right way": balls used to fly through the nets and jump back to the ramp).
  function cage(b) {
    const mx = CAGE_X - BALL_R;
    if (Math.abs(b.x) > mx) { b.x = Math.sign(b.x) * mx; b.vx = -b.vx * 0.4; }
    if (b.z > CAGE_Z - BALL_R) { b.z = CAGE_Z - BALL_R; b.vz = -Math.abs(b.vz) * 0.4; }
  }
  // After a shot (Nov 21 fix): the ball really falls.
  //   'drop'   = it went in: it slides down through the net (the net slows it), then drops out under it
  //   'bounce' = falling with gravity; it bounces on the ramp, smaller each time, until it's rolling
  //   'roll'   = rolling back down the ramp to you (the ramp slopes your way)
  // (Before, a basket stopped in mid-air under the net and then jumped down to the ramp, and a miss
  //  jumped straight onto the ramp from wherever it was.)
  function afterShot(b, dt, rimX, g) {
    if (b.state === 'drop') {
      const netBottom = RIM_H - 0.42;
      b.vh = Math.max(b.vh - GRAV * dt, -1.6);         // (the net holds it back: no faster than this)
      b.h += b.vh * dt;
      b.x += (rimX - b.x) * Math.min(1, dt * 8); b.z += (hoop.z - b.z) * Math.min(1, dt * 8);   // (the net squeezes it to the middle)
      if (b.h < netBottom) { b.state = 'bounce'; b.vx = 0; b.vz = -0.5; }   // out of the net: it drops, a little towards you
      return;
    }
    if (b.state === 'bounce') {
      b.vh -= GRAV * dt;
      b.x += b.vx * dt; b.z += b.vz * dt; b.h += b.vh * dt;
      cage(b);
      const ground = rampH(b.z) + BALL_R;
      if (b.h <= ground) {
        b.h = ground;
        if (b.vh < -1.3) {                             // a bounce (each one smaller); the ramp tips it towards you
          const hard = Math.min(1, -b.vh / 5);
          b.vh = -b.vh * 0.42; b.vx *= 0.6; b.vz = b.vz * 0.4 - 0.5;
          if (g) {                                     // (game feel: a plink, a squash and a little puff on each bounce)
            g.sfx('plink'); g.juice.squash(b).hit(0.12 + 0.25 * hard);
            const dp = proj(b.x, b.h - BALL_R, b.z);
            if (hard > 0.3) g.juice.dust(dp.x, dp.y, { to: fx, colors: ['#e0dcff', '#ffffff'], count: 3, size: 10 + 8 * hard, speed: 60 });
          }
        } else { b.state = 'roll'; b.vx *= 0.5; }
      }
      return;
    }
    if (b.state === 'roll') {                          // rolling back down the ramp to you
      b.z -= dt * 2.2; b.x += (b.vx || 0) * dt; b.x *= 1 - dt; b.h = rampH(b.z) + BALL_R;
      cage(b);
      if (b.z < 0.6) b.state = 'gone';
    }
  }

  function scoreBall(g, b, swish) {
    b.state = 'drop'; b.scored = true;
    // points: a golden ball = 5; the bonus, the far-away Near and Far hoop and a Hot Shots ball on fire = 3
    const pts = b.gold ? 5 : b.bonus || threeNow() || (L.court === 'hot' && b.fire) ? 3 : 2;
    if (b.gold) { goldMade++; g.achieve('golden'); }
    score += pts; made++; streak++; bestStreak = Math.max(bestStreak, streak);
    if (pts === 3) { bonusMade++; g.achieve('downtown'); }
    if (timeLeft <= 0) { buzzerBeater = true; g.achieve('buzzer'); bigText = { text: 'BUZZER BEATER!', t: 1.6, color: '#06d6a0' }; g.juice.pop('big', 0.5); g.juice.flash('#ffffff', 0.25); }
    if (swish) { swishes++; g.achieve('swish'); }
    net.swish = 1; crowd = 0.6;
    g.sfx(swish ? 'swish' : 'coin');
    const r = proj(hoop.x, RIM_H, hoop.z);
    // game feel: sparkles at the net, the score number boings, a swish gets a tiny pause + a golden flash
    g.juice.sparkle(r.x, r.y + 30, { to: fx, colors: swish ? ['#9bf6ff', '#ffffff', '#ffd166'] : ['#ffd166', '#fff3b0', '#ffffff'], count: swish ? 14 : 8 });
    g.juice.pop('score', pts === 3 ? 0.5 : 0.35); g.juice.squash('rim').hit(-0.12);
    if (swish) { g.juice.stop(0.06); g.juice.flash('#fff3b0', 0.15); setTimeout(() => g.sfx('sparkle'), 90); }
    if (pts === 3) g.juice.shake(4);
    popups.push({ text: '+' + pts + (swish ? ' Swish!' : ''), x: r.x, y: r.y - 60, t: 0, color: b.gold ? '#fff3b0' : swish ? '#9bf6ff' : '#ffd166' });
    if (b.gold) {                                     // a golden basket: a shower of gold
      g.juice.sparkle(r.x, r.y + 10, { to: fx, colors: ['#ffc93c', '#fff3b0', '#ffffff'], count: 20 });
      g.juice.flash('#ffd166', 0.2); g.sfx('unlock');
    }
    if (!onFire && streak >= (L.court === 'hot' ? 2 : 3)) {   // (Hot Shots: 2 in a row lights it again)                     // three in a row: the net is ON FIRE
      onFire = true; g.achieve('fire');
      g.music.mood({ energy: 2 }); g.music.stinger('streak');   // on fire = all-out music
      bigText = { text: "YOU'RE ON FIRE!", t: 1.8, color: '#ff8c42' };
      g.juice.flash('#ff8c42', 0.22); g.juice.shake(7); g.juice.pop('big', 0.5);
      Arcade.audio.noise(0.8, { filter: 'bandpass', freq: 700, vol: 0.35 });
      g.tone(220, 0.6, { type: 'sawtooth', slide: 660, vol: 0.12 });
    }
    if (streak >= 10) g.achieve('streak10');
    fx.burst(r.x, r.y + 20, { count: onFire ? 26 : 12, colors: onFire ? ['#ff8c42', '#ffd166', '#ef476f'] : ['#ffffff', '#ffd166'], speed: 200, size: 10, gravity: 300, life: 0.6 });
  }
  function missBall(g, b) {
    b.state = 'bounce'; b.h = rampH(b.z) + BALL_R;      // (it bounces on the ramp from where it landed: see afterShot)
    if (onFire) { popups.push({ text: 'Fire out!', x: W / 2, y: 220, t: 0, color: '#8ecae6' }); g.sfx('aww'); }
    if (onFire) g.music.mood({ energy: 1 });
    streak = 0; onFire = false;
    g.tone(120, 0.12, { type: 'triangle', vol: 0.2 });
  }

  function finishRound(g) {
    if (L._done) return;
    L._done = true;
    over = true;
    if (L.friends && party()) party().tell({ t: 'score', s: score, done: true });
    const win = solo() ? score >= goals[0] : score > rival.score;
    const stars = solo() ? (score >= goals[2] ? 3 : score >= goals[1] ? 2 : score >= goals[0] ? 1 : 0)
      : !win ? 0 : score >= L.stars[1] ? 3 : score >= L.stars[0] ? 2 : 1;
    // trophies
    if (!solo() && win) g.achieve('win');
    // a star on every challenge court (this one counts already): the Court star trophy (+ the Disco ball, checkUnlocks)
    if (isCourt(L) && stars >= 1 && COURT_IDS().every(id => id === L.id || ((g.save.levels[id] || {}).stars || 0) >= 1)) g.achieve('courts');
    if (L.id === 'r8' && win) g.achieve('champ');
    if (L.free && score >= 60) g.achieve('high60');
    if (shots >= 8 && made === shots) g.achieve('perfect');
    if (stars >= 3) g.achieve('three-stars');
    // results as pictures + numbers (little kids don't need to read)
    const IC = {
      face: (c) => `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="${c}" stroke="#2b2b2b" stroke-width="3.5"/><circle cx="14" cy="17" r="3" fill="#fff"/><circle cx="26" cy="17" r="3" fill="#fff"/><path d="M13 25 Q20 30 27 25" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`,
      ball: `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#ff8c42" stroke="#2b2b2b" stroke-width="3.5"/><path d="M4 20 H36 M20 4 V36 M9 9 Q18 20 9 31 M31 9 Q22 20 31 31" fill="none" stroke="#2b2b2b" stroke-width="2.5"/></svg>`,
      net: `<svg viewBox="0 0 40 40"><path d="M8 12 L13 34 H27 L32 12" fill="#fff" stroke="#2b2b2b" stroke-width="3"/><path d="M12 20 H28 M14 27 H26" stroke="#2b2b2b" stroke-width="2"/><ellipse cx="20" cy="12" rx="13" ry="4" fill="none" stroke="#ff6b35" stroke-width="4"/></svg>`,
      fire: `<svg viewBox="0 0 40 40"><path d="M20 37 C6 33 8 18 16 6 Q18 16 23 14 C29 21 33 32 20 37 Z" fill="#ff8c42" stroke="#2b2b2b" stroke-width="3"/><path d="M20 34 C14 31 15 25 19 20 Q21 26 24 24 C26 29 25 32 20 34 Z" fill="#ffd166"/></svg>`,
      gold: `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#ffc93c" stroke="#2b2b2b" stroke-width="3.5"/><path d="M4 20 H36 M20 4 V36" stroke="#a8740a" stroke-width="2.5"/><circle cx="14" cy="13" r="4" fill="#fff3b0"/></svg>`,
      three: `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#ffd166" stroke="#2b2b2b" stroke-width="3.5"/><text x="20" y="28" font-size="22" font-weight="900" text-anchor="middle" fill="#2b2b2b" font-family="sans-serif">3</text></svg>`,
    };
    const lines = [
      solo() ? null : { icon: IC.face(rival.color), text: String(rival.score) },
      goldMade ? { icon: IC.gold, text: String(goldMade) } : null,
      { icon: IC.net, text: made + ' / ' + shots },
      bestStreak >= 3 ? { icon: IC.fire, text: String(bestStreak) } : null,
      bonusMade ? { icon: IC.three, text: String(bonusMade) } : null,
    ].filter(Boolean);
    const tie = !solo() && score === rival.score;
    if (L.friends) {
      // everyone's score, biggest first, with their animal faces
      const me = Arcade.profiles.active();
      const all = [{ who: me, s: score, mine: true }].concat(Object.keys(friendScores).map(k => ({ who: Object.assign({ pet: 'cat', color: '#4cc9f0' }, party().peers[k] || {}), s: friendScores[k].s })))
        .sort((a, b) => b.s - a.s);
      const rows = all.map((r, i) => `<div style="display:flex;align-items:center;gap:10px;justify-content:center;margin:4px 0">` +
        `<span style="font-size:24px;width:40px">${i + 1}.</span><span style="width:52px;height:52px;display:inline-block;border-radius:50%;overflow:hidden;border:4px solid #2b2b2b;${r.mine ? 'box-shadow:0 0 0 4px #ffd166' : ''}">${Arcade.profiles.avatar(r.who)}</span>` +
        `<span style="font-size:26px;width:60px">${r.s}</span></div>`).join('');
      g.finish({
        win: win || tie, score, stars: win ? 3 : tie ? 2 : 1,
        title: win ? 'You won!' : tie ? 'A tie!' : 'Great game!', lines: [rows], delay: 600,
        buttons: [{ icon: Arcade.icons.again, label: 'Again', cls: 'big', onClick: () => party().start(L.pick) },
          { icon: Arcade.net.FRIENDS_PIC, label: 'Friends', cls: 'blue', onClick: () => friendsMenu(g) }],
      });
      return;
    }
    g.finish({
      win, score, stars,
      title: solo() ? (stars ? 'Great shooting!' : 'Nice try!') : win ? (L.id === 'r8' ? 'CHAMPION!' : 'You beat ' + rival.name + '!') : tie ? 'A tie! So close!' : 'Nice try!',
      lines, next: win && !L.free && LEVELS.indexOf(L) < LEVELS.length - 1, delay: 600,
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
    drawHall(ctx, scT());
    for (const nb of neighbors) drawNeighbor(ctx, t, nb);
    drawMachine(ctx, t);
    drawShow(ctx, scT());
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
    for (const q of popups) D.text(ctx, q.text, q.x, q.y, { size: 30 * (1 + 0.45 * Math.max(0, 1 - q.t * 5)), color: q.color });   // (pops in big, then settles)
    drawScoreboard(ctx, t);
    if (bigText) {
      const k = Math.min(1, (bigText.t) * 2);
      D.text(ctx, bigText.text, W / 2, 250, { size: 54 * (0.8 + 0.2 * k) * (gref ? gref.juice.size('big') : 1), color: bigText.color });
    }
    if (countdown > 0) {
      // big 3, 2, 1 in the middle (with a little bounce on each number)
      const n = Math.max(1, Math.ceil(countdown - 0.2)), f = (countdown - 0.2) % 1;
      D.text(ctx, String(n), W / 2, 300, { size: 130 * (0.85 + 0.25 * f), color: '#ffd166' });
    } else if (!started && !over) D.text(ctx, 'Pull back and let go!', W / 2, 300, { size: 34, color: '#ffffff' });
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
    // (from just under the windows down, so the windows stay bright)
    if (nb.ox < 0) ctx.fillRect(0, 140, W / 2, H - 140); else ctx.fillRect(W / 2, 140, W / 2, H - 140);
  }

  // ---------------------------------------------------------------
  // Living backgrounds (Nov 22, new plan point 2, part 4)
  // The arcade hall has two big windows high on the back wall (left and right of the scoreboard).
  // Climbing the ladder, the day goes by outside (TIMES, a level's `sky`): the first rivals play in the daytime
  // (clouds drift past), Sam + Bella at sunset, Tia + Wes in the evening (the first stars), and
  // the Champ + High Score at night (a moon, twinkling stars, a plane blinking by, lit-up windows).
  // The still parts (the wall, the window frames, the town, the carpet) are painted ONCE into two
  // hidden canvases (hallFor / paintHall: "back" = behind the sky bits, "front" = in front of them),
  // so older tablets stay smooth. Live and cheap on top: clouds / stars / moon glow, two spotlights
  // slowly sweeping the hall with dust twinkling in them; the Champ's final has golden spotlights +
  // falling confetti (show 'finals'), High Score has colored disco lights (show 'disco').
  // Calm motion (Parent corner): the scenery clock stands still and nothing floats.
  // ---------------------------------------------------------------
  const TIMES = {
    day:     { sky: ['#4fb3ff', '#c4ecff'], city: '#7d8fd0', lit: 0.1, cloud: '#ffffff' },
    sunset:  { sky: ['#ff8fab', '#ffd59e'], city: '#8f5f9f', lit: 0.35, cloud: '#ffe0ea', glow: 'rgba(255,214,150,0.9)' },
    evening: { sky: ['#4b3f9e', '#ea96c2'], city: '#45357f', lit: 0.65, cloud: '#c9b6ec', stars: 0.5 },
    night:   { sky: ['#0b0d2e', '#2d2b76'], city: '#1f1848', lit: 0.9, stars: 1, moon: true },
  };
  const scT = () => (Arcade.calm && Arcade.calm() ? 0 : clock);      // the scenery clock (stands still in Calm motion)
  const calmNow = () => !!(Arcade.calm && Arcade.calm());
  const timeOf = () => TIMES[(L && L.sky) || 'day'];   // (L.sky: L.time is the clock's seconds)
  const rnd1 = (i) => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };   // the same "random" every time
  let halls = new Map();       // painted halls by key (time | width | sharpness)

  // where the two windows go: in the middle of the wall left / right of the scoreboard (none if too narrow)
  function windowRects() {
    const side = W / 2 - 240, ww = Math.min(250, side - 70);
    if (ww < 90) return [];
    return [{ x: side / 2 - ww / 2, y: 30, w: ww, h: 104 }, { x: W - side / 2 - ww / 2, y: 30, w: ww, h: 104 }];
  }
  function hallFor(ctx) {
    const a = ctx.getTransform ? Math.abs(ctx.getTransform().a) : 1;
    const k = Math.max(0.5, Math.min(2, Math.round(a * 2) / 2));          // real pixels per game unit, in halves
    const key = ((L && L.sky) || 'day') + '|' + Math.round(W) + '|' + k;
    let h = halls.get(key);
    if (!h) {
      if (halls.size > 4) halls = new Map();
      h = paintHall(k); halls.set(key, h);
    }
    return h;
  }
  function paintHall(k) {
    const layer = (paint) => {
      const c = document.createElement('canvas'); c.width = Math.ceil(W * k); c.height = Math.ceil(H * k);
      const x = c.getContext('2d'); x.scale(k, k); x.lineJoin = 'round'; x.lineCap = 'round';
      paint(x); return c;
    };
    const tm = timeOf();
    const back = layer((ctx) => {
      // the arcade hall: a dark room glowing with neon
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0f0a2a'); g.addColorStop(0.65, '#2a1660'); g.addColorStop(1, '#3b1f6e');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // soft stripes on the wall paper
      ctx.fillStyle = 'rgba(255,255,255,0.025)';
      for (let x = 0; x < W; x += 56) ctx.fillRect(x, 0, 24, 420);
      // the sky in the windows (+ a warm glow low down at sunset, the moon at night)
      for (const r of windowRects()) {
        const sg = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
        sg.addColorStop(0, tm.sky[0]); sg.addColorStop(1, tm.sky[1]);
        ctx.fillStyle = sg; ctx.fillRect(r.x, r.y, r.w, r.h);
        if (tm.glow) {
          const gl = ctx.createRadialGradient(r.x + r.w / 2, r.y + r.h, 4, r.x + r.w / 2, r.y + r.h, r.w * 0.7);
          gl.addColorStop(0, tm.glow); gl.addColorStop(1, 'rgba(255,214,150,0)');
          ctx.fillStyle = gl; ctx.fillRect(r.x, r.y, r.w, r.h);
        }
      }
      const ws = windowRects();
      if (tm.moon && ws[1]) {
        const r = ws[1], mx = r.x + r.w * 0.72, my = r.y + 30;
        const gl = ctx.createRadialGradient(mx, my, 6, mx, my, 46);
        gl.addColorStop(0, 'rgba(255,250,210,0.55)'); gl.addColorStop(1, 'rgba(255,250,210,0)');
        ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
        ctx.fillStyle = gl; ctx.fillRect(mx - 50, my - 50, 100, 100);
        D.circle(ctx, mx, my, 15, '#fff6c9', 0);
        ctx.fillStyle = 'rgba(220,205,140,0.6)'; ctx.beginPath(); ctx.arc(mx - 5, my - 3, 3.5, 0, 7); ctx.arc(mx + 5, my + 5, 2.5, 0, 7); ctx.fill();
        ctx.restore();
      }
    });
    const front = layer((ctx) => {
      windowRects().forEach((r, wi) => {
        // a little town outside: rooftops with lit windows (more lights on as it gets dark)
        ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
        let x = r.x - 6, i = wi * 40;
        while (x < r.x + r.w) {
          const bw = 22 + rnd1(i) * 26, bh = 26 + rnd1(i + 7) * 46, top = r.y + r.h - bh;
          ctx.fillStyle = tm.city; ctx.fillRect(x, top, bw, bh + 2);
          if (rnd1(i + 3) < 0.3) { ctx.beginPath(); ctx.moveTo(x - 2, top); ctx.lineTo(x + bw / 2, top - 12); ctx.lineTo(x + bw + 2, top); ctx.fill(); }   // a pointy roof
          for (let wy = top + 7; wy < r.y + r.h - 8; wy += 11) for (let wx = x + 5; wx < x + bw - 6; wx += 9) {
            if (rnd1(i * 13 + wx * 0.7 + wy * 1.3) < tm.lit) { ctx.fillStyle = '#ffe08a'; ctx.fillRect(wx, wy, 4.5, 5.5); }
          }
          x += bw + 3; i++;
        }
        // a shine across the glass
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath(); ctx.moveTo(r.x + r.w * 0.15, r.y); ctx.lineTo(r.x + r.w * 0.32, r.y); ctx.lineTo(r.x + r.w * 0.12, r.y + r.h); ctx.lineTo(r.x - 5, r.y + r.h); ctx.fill();
        ctx.restore();
        // the window frame: 4 panes, a thick outline and a sill
        ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.strokeRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = '#6a55b8'; ctx.lineWidth = 5; ctx.strokeRect(r.x, r.y, r.w, r.h);
        for (const [ax, ay, bx, by] of [[r.x + r.w / 2, r.y, r.x + r.w / 2, r.y + r.h], [r.x, r.y + r.h * 0.45, r.x + r.w, r.y + r.h * 0.45]]) {
          ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
          ctx.strokeStyle = '#6a55b8'; ctx.lineWidth = 4; ctx.stroke();
        }
        D.box(ctx, r.x - 12, r.y + r.h + 2, r.w + 24, 10, 4, '#6a55b8', 3);
      });
      // a carpet with little arcade shapes (stars, circles, squiggles), like a real arcade
      ctx.fillStyle = '#1a1038'; ctx.fillRect(0, 420, W, H - 420);
      const cols = ['#ff5fa2', '#4cc9f0', '#ffd166', '#06d6a0'];
      for (let i = 0; i < W / 9; i++) {
        const x = rnd1(i + 300) * W, y = 428 + rnd1(i + 400) * (H - 436), c = cols[i % 4];
        ctx.globalAlpha = 0.45; ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 2.5;
        if (i % 3 === 0) { ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.stroke(); }
        else if (i % 3 === 1) { ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.quadraticCurveTo(x - 3, y - 6, x, y); ctx.quadraticCurveTo(x + 3, y + 6, x + 7, y); ctx.stroke(); }
        else ctx.fillRect(x - 2.5, y - 2.5, 5, 5);
      }
      ctx.globalAlpha = 1;
    });
    // the two neon tubes along the back wall, painted once WITH their glow (a glow = a blur, slow to paint every
    // frame on an older tablet: Nov 24, point 9 part 2); each frame they're just copied, pulsing with globalAlpha
    const tubes = [[150, '#ff5fa2'], [172, '#4cc9f0']].map(([y, c]) => {
      const cv = document.createElement('canvas'); cv.width = Math.ceil(W * k); cv.height = Math.ceil(60 * k);
      const x = cv.getContext('2d'); x.scale(k, k);
      glow(x, c, 20); x.strokeStyle = c; x.lineWidth = 5; x.lineCap = 'round';
      x.beginPath(); x.moveTo(-10, 30); x.lineTo(W + 10, 30); x.stroke();
      return { cv, y: y - 30 };
    });
    return { back, front, tubes };
  }
  // A soft glow round a light, as a little picture painted once per color + size (Nov 24, point 9 part 2): it
  // looks like the old shadowBlur glow but costs one quick copy instead of a blur every frame.
  const glowSprites = new Map();
  function glowDot(ctx, x, y, r, color, blur) {
    const key = color + '|' + r + '|' + blur;
    let sp = glowSprites.get(key);
    if (!sp) {
      const R = r + blur * 1.2, k = 2, cv = document.createElement('canvas');
      cv.width = cv.height = Math.ceil(R * 2 * k);
      const c = cv.getContext('2d'); c.scale(k, k);
      const gr = c.createRadialGradient(R, R, r * 0.5, R, R, R);
      gr.addColorStop(0, color); gr.addColorStop(0.35, color + 'aa'); gr.addColorStop(1, color + '00');
      c.fillStyle = gr; c.fillRect(0, 0, R * 2, R * 2);
      sp = { cv, R }; glowSprites.set(key, sp);
    }
    ctx.drawImage(sp.cv, x - sp.R, y - sp.R, sp.R * 2, sp.R * 2);
  }
  // the sky bits that move: clouds drift past, stars twinkle, a plane blinks by at night
  function drawWindowSky(ctx, t) {
    const tm = timeOf();
    windowRects().forEach((r, wi) => {
      ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
      if (tm.stars) for (let i = 0; i < 12; i++) {
        const sx = r.x + rnd1(i + wi * 20 + 500) * r.w, sy = r.y + 4 + rnd1(i + wi * 20 + 600) * r.h * 0.55;
        const tw = calmNow() ? 1 : 0.55 + 0.45 * Math.sin(t * 2 + i * 1.9);
        ctx.globalAlpha = tm.stars * tw; D.circle(ctx, sx, sy, i % 4 === 0 ? 2.2 : 1.4, '#ffffff', 0);
      }
      ctx.globalAlpha = 1;
      if (tm.cloud && !tm.moon) {
        ctx.fillStyle = tm.cloud; ctx.globalAlpha = tm.stars ? 0.45 : 0.9;
        for (let i = 0; i < 2; i++) {
          const span = r.w + 120, cx = r.x - 60 + ((rnd1(i + wi * 5 + 80) * span + t * (6 + i * 3)) % span), cy = r.y + 18 + i * 24;
          ctx.beginPath(); ctx.ellipse(cx, cy, 22, 9, 0, 0, 7); ctx.ellipse(cx - 12, cy + 2, 13, 7, 0, 0, 7); ctx.ellipse(cx + 10, cy - 4, 13, 9, 0, 0, 7); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      if (tm.moon && wi === 0 && !calmNow()) {          // a plane far away, its light blinking
        const px = r.x + ((t * 9) % (r.w + 40)) - 20, py = r.y + 26 + Math.sin(t * 0.3) * 3;
        ctx.fillStyle = '#5c5a9a'; ctx.fillRect(px - 6, py - 1, 12, 2.5);
        if (Math.sin(t * 6) > 0.4) D.circle(ctx, px + 6, py, 2, '#ff5f5f', 0);
      }
      ctx.restore();
    });
  }
  // the show over the hall: two spotlights sweeping slowly, dust twinkling in them;
  // golden spotlights + falling confetti at the Champ's final, colored disco lights in High Score
  function drawShow(ctx, t) {
    const calm = calmNow(), lite = gref && gref.lite && gref.lite();
    const show = L && L.show;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const col = show === 'finals' ? '255,214,102' : '200,220,255';
    for (const [sx, ph] of [[W * 0.16, 0], [W * 0.84, 2.1]]) {
      const a = Math.PI / 2 + Math.sin(t * 0.35 + ph) * 0.38, len = 640, spread = 0.13;
      const ex = sx + Math.cos(a) * len, ey = -10 + Math.sin(a) * len;
      const gr = ctx.createLinearGradient(sx, -10, ex, ey);
      gr.addColorStop(0, `rgba(${col},${show === 'finals' ? 0.16 : 0.1})`); gr.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.moveTo(sx - 8, -10); ctx.lineTo(sx + Math.cos(a - spread) * len, -10 + Math.sin(a - spread) * len);
      ctx.lineTo(sx + Math.cos(a + spread) * len, -10 + Math.sin(a + spread) * len); ctx.lineTo(sx + 8, -10); ctx.fill();
      // dust specks drifting in the beam
      if (!calm) for (let i = 0; i < (lite ? 3 : 7); i++) {
        const d = 120 + ((rnd1(i + ph * 10) * 400 + t * 10) % 400), off = (rnd1(i + 30 + ph) - 0.5) * 1.6 * spread;
        const dx = sx + Math.cos(a + off) * d, dy = -10 + Math.sin(a + off) * d + Math.sin(t + i) * 4;
        ctx.fillStyle = `rgba(${col},${0.35 + 0.3 * Math.sin(t * 3 + i)})`; ctx.beginPath(); ctx.arc(dx, dy, 1.8, 0, 7); ctx.fill();
      }
    }
    // disco: soft colored spots gliding over the room
    if (show === 'disco' && !calm) {
      const cs = ['255,95,162', '76,201,240', '255,209,102', '6,214,160'];
      for (let i = 0; i < (lite ? 4 : 8); i++) {
        const x = W / 2 + Math.sin(t * 0.5 + i * 1.7) * W * 0.46, y = 250 + Math.sin(t * 0.37 + i * 2.3) * 190;
        const gr = ctx.createRadialGradient(x, y, 2, x, y, 34);
        gr.addColorStop(0, `rgba(${cs[i % 4]},0.22)`); gr.addColorStop(1, `rgba(${cs[i % 4]},0)`);
        ctx.fillStyle = gr; ctx.fillRect(x - 34, y - 34, 68, 68);
      }
    }
    ctx.restore();
    // the final: golden confetti fluttering down
    if (show === 'finals' && !calm) {
      const cs = ['#ffd166', '#ff8fab', '#4cc9f0', '#ffffff', '#06d6a0'];
      for (let i = 0; i < (lite ? 10 : 22); i++) {
        const x = (rnd1(i + 900) * W + Math.sin(t * 0.8 + i) * 30 + W) % W, y = ((rnd1(i + 950) * (H + 40)) + t * (26 + (i % 5) * 6)) % (H + 40) - 20;
        ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2 + i); ctx.scale(1, Math.abs(Math.sin(t * 3 + i)) * 0.8 + 0.2);
        ctx.fillStyle = cs[i % 5]; ctx.fillRect(-4, -2.5, 8, 5); ctx.restore();
      }
    }
  }

  function drawHall(ctx, t) {
    // the arcade hall: the painted wall + windows, the moving sky in the windows, then the town, frames + carpet
    const hall = hallFor(ctx);
    ctx.drawImage(hall.back, 0, 0, W, H);
    drawWindowSky(ctx, t);
    // (the front layer is only the windows + the carpet: copy just those two bands, not the empty middle)
    const fk = hall.front.width / W;
    for (const [y0, y1] of [[18, 152], [418, H]]) ctx.drawImage(hall.front, 0, y0 * fk, hall.front.width, (y1 - y0) * fk, 0, y0, W, y1 - y0);
    // a string of party bulbs along the ceiling
    for (let k = 0; k < Math.ceil(W / 49); k++) {
      const x = 12 + k * 49, y = 18 + Math.sin(k * 1.3) * 3;
      const on = (Math.floor(t * 4) + k) % 3 !== 0 || crowd > 0;
      const c = ['#ff5fa2', '#4cc9f0', '#ffd166', '#06d6a0'][k % 4];
      if (on) glowDot(ctx, x, y, 6, c, 14);
      D.circle(ctx, x, y, 6, on ? c : '#3d3466', 2);
    }
    // two neon tubes along the back wall (painted once with their glow, in hallFor)
    hall.tubes.forEach((tb, i) => {
      ctx.globalAlpha = 0.65 + 0.3 * Math.sin(t * 2 + i * 1.7);
      ctx.drawImage(tb.cv, 0, tb.y, W, 60);
    });
    ctx.globalAlpha = 1;
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
    // the ramp + the wire mesh sides + the frame never move: painted once (cageFor), then copied (Nov 24, point 9 part 2)
    const cage = cageFor(ctx, zf, cz, topH);
    ctx.drawImage(cage.cv, cage.x, cage.y, cage.w, cage.h);
    // ---- the backboard ----
    drawBoard(ctx, t, zb);
  }
  // the cage of a machine (everything in it that stands still), painted into a hidden canvas the size of the cage
  const cages = new Map();
  function cageFor(ctx, zf, cz, topH) {
    const a = ctx.getTransform ? Math.abs(ctx.getTransform().a) : 1;
    const k = Math.max(0.5, Math.min(2, Math.round(a * 2) / 2));          // real pixels per game unit, in halves
    const key = OX + '|' + Math.round(W) + '|' + k;
    let c = cages.get(key);
    if (c) return c;
    if (cages.size > 6) cages.clear();
    // the cage's box on the screen (+ room for the thick tubes), cut to the screen
    const P = proj, pts = [];
    for (const sx of [-1, 1]) for (const z of [zf, cz]) pts.push(P(sx, rampH(z), z), P(sx, topH(z), z));
    const x0 = Math.max(-20, Math.floor(Math.min(...pts.map(p => p.x)) - 12)), x1 = Math.min(W + 20, Math.ceil(Math.max(...pts.map(p => p.x)) + 12));
    const y0 = Math.max(-20, Math.floor(Math.min(...pts.map(p => p.y)) - 12)), y1 = Math.min(H + 20, Math.ceil(Math.max(...pts.map(p => p.y)) + 12));
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil((x1 - x0) * k)); cv.height = Math.max(1, Math.ceil((y1 - y0) * k));
    const cx = cv.getContext('2d'); cx.scale(k, k); cx.translate(-x0, -y0);
    paintCage(cx, zf, cz, topH);
    c = { cv, x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    cages.set(key, c);
    return c;
  }
  function paintCage(ctx, zf, cz, topH) {
    const P = proj;
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
  }

  function drawBoard(ctx, t, zb) {
    const P = proj;
    // ---- the backboard: like a real arcade machine's printed board ----
    // a dark metal frame, a blue board with light rays and the HOOP HEROES logo,
    // a white shooter's square, a shiny glass streak and LED bulbs all around.
    const bl = P(hoop.x - 0.75, RIM_H - 0.15, zb), br = P(hoop.x + 0.75, RIM_H + 0.95, zb);
    const bx = bl.x, by = br.y, bwid = br.x - bl.x, bh = bl.y - br.y, bcx = bx + bwid / 2;
    const hot = onFire, bonus = threeNow();          // (3 points now: the bonus, or Near and Far's hoop far away)
    if (hot) glow(ctx, '#ff8c42', 30); else if (bonus) glow(ctx, '#ffd166', 24);
    D.box(ctx, bx - 8, by - 8, bwid + 16, bh + 16, 16, '#151026', 4);
    noGlow(ctx);
    const bgr = ctx.createLinearGradient(0, by, 0, by + bh);
    bgr.addColorStop(0, hot ? '#ff6b35' : '#3a7bff'); bgr.addColorStop(1, hot ? '#9a1f1f' : '#14348f');
    D.box(ctx, bx, by, bwid, bh, 10, bgr, 0);
    ctx.save(); D.rr(ctx, bx, by, bwid, bh, 10); ctx.clip();
    // light rays bursting from behind the logo (they slowly turn)
    const ly = by + bh * 0.22;
    ctx.fillStyle = 'rgba(255,255,255,0.09)';
    for (let k = 0; k < 12; k++) {
      const a0 = t * 0.3 + k * Math.PI / 6;
      ctx.beginPath(); ctx.moveTo(bcx, ly);
      ctx.lineTo(bcx + Math.cos(a0) * bwid, ly + Math.sin(a0) * bwid);
      ctx.lineTo(bcx + Math.cos(a0 + 0.22) * bwid, ly + Math.sin(a0 + 0.22) * bwid); ctx.fill();
    }
    // a big faint basketball printed on the board
    drawBall(ctx, bcx, by + bh * 0.62, bh * 0.42, 'classic', 0.4, 0.16);
    // glass shine
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.beginPath(); ctx.moveTo(bx + bwid * 0.62, by); ctx.lineTo(bx + bwid * 0.78, by); ctx.lineTo(bx + bwid * 0.42, by + bh); ctx.lineTo(bx + bwid * 0.26, by + bh); ctx.fill();
    ctx.restore();
    // a white inner border
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3; D.rr(ctx, bx + 7, by + 7, bwid - 14, bh - 14, 7); ctx.stroke();
    // the logo
    const fs = Math.max(10, Math.round(bh * 0.15));
    D.text(ctx, bonus ? '3 POINTS!' : 'HOOP HEROES', bcx, ly, { size: fs, color: bonus ? '#ffffff' : '#ffd166', lineWidth: Math.max(3, fs / 4) });
    // the shooter's square (aim for it!)
    const inner = P(hoop.x - 0.25, RIM_H + 0.05, zb), inner2 = P(hoop.x + 0.25, RIM_H + 0.45, zb);
    ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.strokeRect(inner.x, inner2.y, inner2.x - inner.x, inner.y - inner2.y);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4.5; ctx.strokeRect(inner.x, inner2.y, inner2.x - inner.x, inner.y - inner2.y);
    // LED bulbs on the frame: they chase around (fast when you're on fire)
    const spots = [];
    const nx = 9, ny = 5;
    for (let k = 0; k <= nx; k++) spots.push([bx - 4 + k * (bwid + 8) / nx, by - 4]);
    for (let k = 1; k <= ny; k++) spots.push([bx + bwid + 4, by - 4 + k * (bh + 8) / ny]);
    for (let k = nx - 1; k >= 0; k--) spots.push([bx - 4 + k * (bwid + 8) / nx, by + bh + 4]);
    for (let k = ny - 1; k >= 1; k--) spots.push([bx - 4, by - 4 + k * (bh + 8) / ny]);
    const speed = hot ? 16 : net.swish > 0 ? 12 : 4;
    spots.forEach(([lx, lyy], k) => {
      const on = (Math.floor(t * speed) + k) % 4 === 0 || (net.swish > 0.5 && k % 2 === 0);
      const c = hot ? '#ffd166' : bonus ? '#ff5fa2' : '#9bf6ff';
      const lr = Math.max(2.5, bh * 0.025);
      if (on) glowDot(ctx, lx, lyy, Math.round(lr), c, 10);
      D.circle(ctx, lx, lyy, lr, on ? c : '#3d3466', 0);
    });
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
    const wob = gref ? gref.juice.squash('rim') : { sx: 1, sy: 1 };     // (game feel: the rim wobbles when hit)
    const s = r.s, rw = rimR * (onFire ? 1.15 : 1) * s * wob.sx, rh = rw * 0.28 * wob.sy / wob.sx;
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
    const look = b.gold ? 'gold' : design;            // (Golden Balls: a golden ball looks golden, with gold sparkles)
    if (b.state === 'fly' && !b.fire) drawTrail(ctx, look, b.trail, r, clock);   // the special ball's trail
    if (b.fire && b.state === 'fly') {                 // a fiery trail
      b.trail.forEach((q, i) => { ctx.globalAlpha = i / b.trail.length * 0.7; D.circle(ctx, q.x, q.y, r * (0.4 + 0.6 * i / b.trail.length), i % 2 ? '#ffd166' : '#ff8c42', 0); });
      ctx.globalAlpha = 1;
    }
    // shadow on the ramp
    const sh = proj(b.x, rampH(b.z), b.z);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(sh.x, sh.y, r * 0.9, r * 0.3, 0, 0, 7); ctx.fill();
    // squash and stretch (game feel): squashes onto whatever it hit, stretches when it's thrown
    ctx.save(); if (gref) gref.juice.squash(b).apply(ctx, p.x, p.y + (b.state === 'bounce' || b.state === 'roll' ? r : 0));
    if (b.gold) { glow(ctx, '#ffd166', 18); D.circle(ctx, p.x, p.y, r, 'rgba(255,209,102,0.5)', 0); noGlow(ctx); }
    drawBall(ctx, p.x, p.y, r, look, b.spin);
    ctx.restore();
  }

  function drawHandBall(ctx, t) {
    const p = proj(START.x, START.h, START.z), r = BALL_R * p.s;
    if (!ready || over) return;
    let dx = 0, dy = 0;
    const pt = Arcade && rgPointer();
    if (drag && pt && pt.down) { dx = math.clamp(pt.x - drag.x, -160, 160); dy = math.clamp(pt.y - drag.y, 0, PULL * 1.2); }
    // keyboard: power bar while winding up
    if (charge != null) {
      const k = (charge % 1.6) / 0.8, pw = k < 1 ? k : 2 - k;
      D.box(ctx, W / 2 + 260, 290, 34, 180, 10, '#ffffff', 4);
      const good = perfectPower() / 1.15;               // (green = about the right power for a basket)
      ctx.fillStyle = Math.abs(pw - good) < 0.12 ? '#06d6a0' : '#ff8c42'; ctx.fillRect(W / 2 + 264, 466 - 172 * pw, 26, 172 * pw);
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
    // winding up squeezes the ball a little (more pull = more squeeze; Calm motion: less)
    const wind = Math.min(1, dy / PULL) * (Arcade.calm() ? 0.04 : 0.12);
    ctx.save(); ctx.translate(hx, hy); ctx.scale(1 + wind, 1 - wind); ctx.translate(-hx, -hy);
    if (goldNow()) {                                  // the golden ball in your hands: it glows and twinkles, worth 5
      const tw = calmNow() ? 0 : clock;
      glow(ctx, '#ffd166', 26); D.circle(ctx, hx, hy, r * 1.08, 'rgba(255,209,102,0.55)', 0); noGlow(ctx);
      for (let k = 0; k < 4; k++) {
        const a = tw * 1.6 + k * Math.PI / 2, rr = r * (1.45 + 0.12 * Math.sin(tw * 5 + k));
        D.star(ctx, hx + Math.cos(a) * rr, hy + Math.sin(a) * rr, r * 0.22, k % 2 ? '#fff3b0' : '#ffc93c', 0);
      }
    }
    drawBall(ctx, hx, hy, r, goldNow() ? 'gold' : design, 0);
    ctx.restore();
    if (goldNow()) D.text(ctx, '5', hx + r * 1.25, hy - r * 1.1, { size: Math.round(r * 0.9), color: '#ffd166' });
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
    const led2 = (str, cx, color, key) => {          // (a number that boings when it changes: g.juice.pop)
      const k = gref ? gref.juice.size(key) : 1;
      ctx.save(); ctx.translate(cx, y + 30); ctx.scale(k, k); ctx.translate(-cx, -(y + 30)); led(str, cx, color); ctx.restore();
    };
    led2(String(score), W / 2 - 150, '#ffd166', 'score'); lab('YOU', W / 2 - 150);
    const hurry = timeLeft <= 10 && started;
    led((tm < 10 ? '0' : '') + tm, W / 2, hurry ? '#ff4d6d' : '#9bf6ff'); lab(threeNow() ? '3 POINTS!' : 'TIME', W / 2, threeNow() ? '#ffd166' : '#c9c3ff');
    if (rival) { led2(String(rival.score), W / 2 + 150, '#ff8fab', 'rival'); lab(rival.name.toUpperCase(), W / 2 + 150); }
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
  // Draw a ball: colored body (with a soft shine), basketball seams that spin,
  // and a thick outline. Striped balls (Retro, Rainbow) get colored bands.
  function drawBall(ctx, x, y, r, kind, spin, alpha = 1) {
    const d = ballDef(kind);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
    if (d.trail === 'neon') { ctx.shadowColor = d.fill; ctx.shadowBlur = Math.min(r * 0.6, 12); }
    const gr = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
    gr.addColorStop(0, d.fill2); gr.addColorStop(0.55, d.fill); gr.addColorStop(1, d.fill);
    ctx.fillStyle = gr; ctx.fill(); ctx.shadowBlur = 0;
    ctx.save();
    ctx.clip();
    ctx.rotate(spin);
    if (d.stripes) {                                   // colored bands that spin with the ball
      const n = d.stripes.length, w = (r * 2) / n;
      d.stripes.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-r + i * w, -r, w + 1, r * 2); });
    }
    if (kind === 'galaxy') {                           // little twinkling stars
      for (const [sx, sy, sr] of [[-0.45, -0.3, 0.16], [0.4, 0.35, 0.13], [0.3, -0.5, 0.09], [-0.3, 0.5, 0.09], [0.05, 0.05, 0.07]]) D.star(ctx, sx * r, sy * r, sr * r, '#ffffff', 0);
    }
    if (kind === 'lava') {                             // glowing cracks
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = Math.max(1.5, r * 0.06);
      ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.2); ctx.lineTo(-r * 0.3, -r * 0.35); ctx.lineTo(-r * 0.1, r * 0.1); ctx.lineTo(r * 0.4, r * 0.25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r * 0.2, -r * 0.7); ctx.lineTo(r * 0.3, -r * 0.3); ctx.lineTo(r * 0.65, -r * 0.1); ctx.stroke();
    }
    // the basketball seams
    const lw = Math.max(1.5, r * 0.07);
    ctx.strokeStyle = d.seam; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke();
    ctx.beginPath(); ctx.arc(-r * 1.25, 0, r * 0.9, -1, 1); ctx.stroke();
    ctx.beginPath(); ctx.arc(r * 1.25, 0, r * 0.9, Math.PI - 1, Math.PI + 1); ctx.stroke();
    ctx.restore();
    // shine (doesn't spin) + outline
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.ellipse(-r * 0.38, -r * 0.42, r * 0.26, r * 0.16, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.lineWidth = Math.max(2, r * 0.09); ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
  }

  // The trail a special ball leaves behind in the air.
  // pts = the last few screen positions (oldest first), r = ball size
  function drawTrail(ctx, kind, pts, r, t) {
    const d = ballDef(kind);
    if (!d.trail || pts.length < 2) return;
    const n = pts.length;
    ctx.save();
    pts.forEach((q, i) => {
      const k = i / n;                                // 0 = oldest, 1 = newest
      ctx.globalAlpha = k * 0.8;
      const jx = Math.sin(t * 20 + i * 2.1) * r * 0.25, jy = Math.cos(t * 17 + i * 1.7) * r * 0.25;
      if (d.trail === 'neon') { ctx.shadowColor = d.fill; ctx.shadowBlur = 12; D.circle(ctx, q.x, q.y, r * (0.3 + 0.6 * k), d.fill, 0); ctx.shadowBlur = 0; }
      else if (d.trail === 'rainbow') { const cols = d.stripes; D.circle(ctx, q.x, q.y, r * (0.35 + 0.6 * k), cols[(i + Math.floor(t * 10)) % cols.length], 0); }
      else if (d.trail === 'ice') { if (i % 2) D.star(ctx, q.x + jx, q.y + jy, r * 0.35 * (0.5 + k), '#e0fbff', 0); else D.circle(ctx, q.x, q.y, r * 0.35 * k, '#9bf6ff', 0); }
      else if (d.trail === 'stars') { D.star(ctx, q.x + jx, q.y + jy, r * 0.4 * (0.4 + k), ['#ffffff', '#c9b8ff', '#ffd166'][i % 3], 0); }
      else if (d.trail === 'sparkle') { D.star(ctx, q.x + jx, q.y + jy, r * 0.35 * (0.4 + k), i % 2 ? '#fff3b0' : '#ffc93c', 0); }
      else if (d.trail === 'embers') { D.circle(ctx, q.x + jx, q.y + jy + (1 - k) * r * 0.6, r * 0.22 * (0.4 + k), i % 2 ? '#ff8c42' : '#ffd166', 0); }
      else if (d.trail === 'hearts') {
        const s = r * 0.32 * (0.4 + k), hx = q.x + jx, hy = q.y + jy;
        ctx.fillStyle = i % 2 ? '#ff4fa3' : '#ffb3d9';
        ctx.beginPath(); ctx.moveTo(hx, hy + s * 0.9);
        ctx.bezierCurveTo(hx - s * 1.4, hy - s * 0.2, hx - s * 0.6, hy - s * 1.2, hx, hy - s * 0.4);
        ctx.bezierCurveTo(hx + s * 0.6, hy - s * 1.2, hx + s * 1.4, hy - s * 0.2, hx, hy + s * 0.9); ctx.fill();
      }
    });
    ctx.restore();
  }

  // A picture of a ball for the menus (drawn on a little canvas, same art as in the game)
  function ballIcon(kind, size = 90) {
    const c = document.createElement('canvas');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = c.height = size * dpr; c.style.width = c.style.height = size + 'px';
    const cx = c.getContext('2d'); cx.scale(dpr, dpr);
    drawBall(cx, size / 2, size / 2, size * 0.32, kind, -0.3);
    return c;
  }

  // The ball picker for the canvas menus (Phaser + Rex UI, Nov 20): a big picture of your ball with its
  // name and trail, then one tile per ball (locked ones show what unlocks them). redraw() after a pick.
  const ballPics = {};
  const ballPic = (id) => ballPics[id] || (ballPics[id] = ballIcon(id, 120).toDataURL());
  function extraRows(g, redraw) {
    checkUnlocks(g);
    const current = pickedBall(g), cur = ballDef(current);
    return [
      { t: 'tiles', w: 360, h: 150, items: [{ img: ballPic(current), name: cur.name, meta: [{ text: cur.trail ? '✨ ' + TRAIL_NAME[cur.trail] : 'A classic look' }], picked: true, attr: 'ball-now' }] },
      { t: 'tiles', w: 120, h: 140, items: BALLS.map(b => {
        const ok = ballUnlocked(g, b);
        return { img: ballPic(b.id), name: ok ? b.name : '???', meta: ok ? [] : [{ text: b.need }], locked: !ok, picked: b.id === current, attr: 'ball-' + b.id,
          onTap: () => { if (!ok) { Arcade.sfx('bonk'); return; } Arcade.sfx('coin'); g.save.data.ball = b.id; g.store(); redraw(); } };
      }) },
    ];
  }

  // The ball rack: a big spinning preview of your ball (with its trail),
  // and a row of ball slots underneath. Locked balls are dark with a lock.
  function extraMenu(g) {
    checkUnlocks(g);
    const wrap = Arcade.h('div', { class: 'hh-rack' });
    const stage = Arcade.h('div', { class: 'hh-stage' });
    const pv = document.createElement('canvas');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    pv.width = 360 * dpr; pv.height = 140 * dpr; pv.className = 'hh-preview';
    const info = Arcade.h('div', { class: 'hh-info' });
    stage.append(pv, info);
    wrap.appendChild(stage);
    const row = Arcade.h('div', { class: 'hh-slots' });
    let current = pickedBall(g);
    const showInfo = (b, ok) => {
      info.innerHTML = `<div class="hh-name">${ok ? b.name : '???'}</div><div class="hh-power">${ok ? (b.trail ? '&#10024; ' + TRAIL_NAME[b.trail] : 'A classic look') : '&#128274; ' + b.need}</div>`;
    };
    for (const b of BALLS) {
      const ok = ballUnlocked(g, b);
      const slot = Arcade.h('button', { type: 'button', class: 'hh-slot' + (ok ? '' : ' locked') + (b.id === current ? ' picked' : ''), 'aria-label': b.name });
      slot.appendChild(ballIcon(b.id, 64));
      if (!ok) slot.insertAdjacentHTML('beforeend', `<div class="lock">${icons.lock}</div>`);
      slot.addEventListener('click', () => {
        showInfo(b, ok);
        if (!ok) { Arcade.sfx('bonk'); return; }
        Arcade.sfx('coin');
        current = b.id; g.save.data.ball = b.id; g.store();
        row.querySelectorAll('.hh-slot').forEach(t => t.classList.remove('picked'));
        slot.classList.add('picked');
      });
      row.appendChild(slot);
    }
    wrap.appendChild(row);
    showInfo(ballDef(current), true);
    // animate the preview: the ball loops in a little arc, trailing its effect
    const pc = pv.getContext('2d'); pc.scale(dpr, dpr);
    const trail = [];
    const t0 = performance.now();
    const loop = (now) => {
      if (!pv.isConnected && now - t0 > 500) return;      // the menu closed: stop
      requestAnimationFrame(loop);
      const t = (now - t0) / 1000, a = t * 2.2;
      const x = 180 + Math.cos(a) * 125, y = 70 + Math.sin(a * 2) * 24;
      trail.push({ x, y }); if (trail.length > 14) trail.shift();
      pc.clearRect(0, 0, 360, 140);
      drawTrail(pc, current, trail, 38, t);
      drawBall(pc, x, y, 38, current, t * 6);
    };
    requestAnimationFrame(loop);
    return wrap;
  }

  // ---------------------------------------------------------------
  // Menus: the ladder of rivals, and the ball picker
  // ---------------------------------------------------------------
  // the challenge courts' pictures: a hoop with the court's twist
  const COURT_ART = {
    gold: `<circle cx="30" cy="36" r="17" fill="#ffc93c" stroke="#2b2b2b" stroke-width="3.5"/><path d="M13 36 H47 M30 19 V53" stroke="#a8740a" stroke-width="2.5"/><circle cx="24" cy="29" r="4" fill="#fff3b0"/>` +
      `<path d="M12 12 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z M50 52 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5z" fill="#fff3b0"/>`,
    updown: `<path d="M30 8 V62 M22 16 L30 8 L38 16 M22 54 L30 62 L38 54" fill="none" stroke="#06d6a0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
    zoom: `<path d="M8 40 L26 32 M8 40 L26 48" stroke="#9bf6ff" stroke-width="5" stroke-linecap="round"/><circle cx="34" cy="40" r="5" fill="#9bf6ff"/><circle cx="46" cy="40" r="3.5" fill="#9bf6ff"/><circle cx="55" cy="40" r="2.5" fill="#9bf6ff"/>` +
      `<circle cx="26" cy="15" r="10" fill="#ffd166" stroke="#2b2b2b" stroke-width="3"/><text x="26" y="20" font-size="14" font-weight="900" text-anchor="middle" font-family="Trebuchet MS, sans-serif" fill="#2b2b2b">3</text>`,
    hot: `<path d="M30 62 C10 56 12 34 24 14 Q27 28 34 25 C43 36 50 54 30 62 Z" fill="#ff8c42" stroke="#2b2b2b" stroke-width="3.5"/><path d="M30 57 C22 53 23 44 28 37 Q31 45 35 42 C38 49 37 54 30 57 Z" fill="#ffd166"/>`,
  };
  function courtPic(lv) {
    const bg = { gold: '#5a3d8a', updown: '#7a3f73', zoom: '#2f3480', hot: '#1d1240' }[lv.court];
    return `<svg viewBox="0 0 120 70"><rect width="120" height="70" rx="8" fill="${bg}"/>` +
      `<rect x="62" y="12" width="44" height="30" rx="4" fill="#fff" stroke="#2b2b2b" stroke-width="3"/>` +
      `<path d="M74 40 L78 58 H90 L94 40" fill="${lv.court === 'hot' ? '#ffd166' : '#fff'}" stroke="#2b2b2b" stroke-width="2.5"/><ellipse cx="84" cy="40" rx="11" ry="3.5" fill="none" stroke="#2b2b2b" stroke-width="6"/><ellipse cx="84" cy="40" rx="11" ry="3.5" fill="none" stroke="#ff6b35" stroke-width="3"/>` +
      `<text x="84" y="31" font-size="13" font-weight="800" text-anchor="middle" font-family="Trebuchet MS, sans-serif" fill="#2b2b2b">${lv.time}s</text>` +
      COURT_ART[lv.court] + `</svg>`;
  }
  // the two tabs on the level picker: the rivals' ladder and the challenge courts
  const TAB_RIVALS = `<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="32" fill="#ef476f" stroke="#2b2b2b" stroke-width="4"/><circle cx="30" cy="35" r="5" fill="#fff"/><circle cx="50" cy="35" r="5" fill="#fff"/><path d="M27 50 Q40 60 53 50" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>`;
  const TAB_COURTS = `<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="32" fill="#ffc93c" stroke="#2b2b2b" stroke-width="4"/><path d="M40 14 l7 14 15 2 -11 10 3 15 -14 -7 -14 7 3 -15 -11 -10 15 -2z" fill="#fff" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/></svg>`;
  function levelPic(lv) {
    if (lv.court) return courtPic(lv);
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
      // a challenge court opens once the court before it has a star (the first one is always open)
      const prevCourt = lv.court && LEVELS[i - 1].court ? LEVELS[i - 1].id : null;
      const locked = lv.court ? !!prevCourt && !done(prevCourt) : !!lv.rival && i > 0 && !done(LEVELS[i - 1].id);
      const rec = g.save.levels[lv.id] || {};
      return { ...lv, section: lv.section || 'Rivals', pic: levelPic(lv), locked,
        meta: Arcade.starsHTML(rec.stars || 0) + (rec.score ? ' <b>' + rec.score + '</b>' : '') };
    });
  }


  // styles for the ball rack in the Unlocks menu
  document.head.appendChild(Arcade.h('style', {}, `
    .hh-rack { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .hh-stage { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; justify-content: center;
      background: rgba(0,0,0,0.25); border: 3px solid rgba(255,255,255,0.2); border-radius: 18px; padding: 6px 16px; }
    .hh-preview { width: 360px; height: 140px; }
    .hh-info { min-width: 190px; text-align: left; }
    .hh-name { font-size: 30px; font-weight: 900; color: #ffd166; text-shadow: 3px 3px 0 #2b2b2b, -2px -2px 0 #2b2b2b, 2px -2px 0 #2b2b2b, -2px 2px 0 #2b2b2b; }
    .hh-power { font-size: 17px; font-weight: 800; color: #e9e4ff; margin-top: 4px; }
    .hh-slots { display: grid; grid-template-columns: repeat(5, auto); justify-content: center; gap: 8px 12px; padding: 10px 12px;
      background: linear-gradient(#5b3a1e, #3e2614); border: 4px solid #2b2b2b; border-radius: 16px; box-shadow: inset 0 -6px 0 rgba(0,0,0,0.3); }
    .hh-slot { position: relative; width: 76px; height: 76px; border-radius: 50%; border: 4px solid transparent; background: rgba(0,0,0,0.3);
      display: grid; place-items: center; cursor: pointer; padding: 0; transition: transform 0.15s; }
    .hh-slot canvas { display: block; }
    .hh-slot:hover { transform: translateY(-3px); }
    .hh-slot.picked { border-color: #ffd166; box-shadow: 0 0 16px 4px rgba(255,209,102,0.7); animation: hhBounce 0.6s ease-in-out infinite alternate; }
    .hh-slot.locked canvas { filter: grayscale(0.3) brightness(0.45); }
    .hh-slot .lock { position: absolute; width: 30px; height: 30px; }
    @keyframes hhBounce { to { transform: translateY(-6px); } }
    @media (max-height: 520px) { .hh-preview { height: 98px; width: 252px; } .hh-slot { width: 60px; height: 60px; } .hh-slot canvas { width: 52px !important; height: 52px !important; } .hh-name { font-size: 24px; } }
  `));

  // ---------------------------------------------------------------
  // Start the game
  // ---------------------------------------------------------------
  const S = (inner) => `<svg viewBox="0 0 80 80">${inner}</svg>`;
  const BALL_SVG = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ff8c42" stroke="#2b2b2b" stroke-width="3.5"/><path d="M${x - r} ${y} H${x + r} M${x} ${y - r} V${y + r}" stroke="#2b2b2b" stroke-width="2.5"/>`;
  const LINK = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';   // outline style for the logo picture

  // ---------------------------------------------------------------
  // The playtest robot (Nov 23, new plan point 5): a pretend child
  // ---------------------------------------------------------------
  // tools/playtest.py turns it on with __hoopsKid(true, seed) and fast-forwards with __hoopsStep(sec).
  // How a child shoots (a model, not a real child: it shows where to look):
  //  * shoots when a ball is there, after a short moment (little kids take longer);
  //  * has a "feel" for how hard to pull: off at first, it gets closer after every shot (watching the ball),
  //    and when the hoop moves back for the 3-point bonus the old feel is suddenly too short again;
  //  * the hand wobbles (strength + a bit sideways; little kids more); on a sliding hoop the child aims at
  //    where the hoop is now (big kids slowly learn to aim a bit ahead of it).
  // The game's own aiming help (assist) works on these shots like on a real child's.
  const kid = { on: false, seed: 1, feel: null, lead: 0, wait: 0, stats: {} };
  function kr() { kid.seed = kid.seed * 16807 % 2147483647; return (kid.seed - 1) / 2147483646; }
  function rivalRnd() { kid.rseed = kid.rseed * 48271 % 2147483647; return (kid.rseed - 1) / 2147483646; }
  function kgauss() { return (kr() + kr() + kr() - 1.5) * 2; }
  function kidThink(g, dt) {
    if (!ready || over || countdown > 0) return;
    const little = !!g.little;
    kid.wait -= dt;
    if (kid.wait > 0) return;
    // where the hoop is NOW; big kids slowly learn to aim a bit ahead of a moving hoop (kid.lead), little kids don't
    const A = aimFor(clock), ppNow = perfectPower(), ft = flightTime(ppNow);
    const nowX = (hoop.x - START.x) / ft, aheadX = A.x;
    const wantX = nowX + (aheadX - nowX) * kid.lead;
    const pp = ppNow + (A.pp - ppNow) * kid.lead;
    if (kid.feel == null) kid.feel = pp + kgauss() * (little ? 0.22 : 0.16);
    // (a hoop that keeps changing height / distance: the child learns how far off it pulls, not one fixed pull,
    //  and judges the changing hoop a bit worse)
    const glide = L.court === 'zoom' || L.court === 'updown';
    if (glide && kid.off == null) kid.off = kid.feel - pp;
    const power = glide ? pp + kid.off + kgauss() * (little ? 0.13 : 0.08) : kid.feel + kgauss() * (little ? 0.1 : 0.06);
    const aimX = wantX + kgauss() * (little ? 0.35 : 0.22);
    if ((L.move || L.court === 'updown' || L.court === 'zoom') && !little) kid.lead += (0.7 - kid.lead) * 0.15;
    shoot(g, math.clamp(power, 0, 1.2), math.clamp(aimX, -1.4, 1.4));
    kid.stats.shots++;
    kid.feel += (pp - kid.feel) * (little ? 0.35 : 0.5);      // watching the ball: closer next time
    if (glide) kid.off *= little ? 0.65 : 0.5;
    kid.wait = (little ? 0.9 : 0.45) + kr() * (little ? 1.3 : 0.8);
  }

  // "Show me" (Nov 24, new plan point 6): the hand pulls the ball straight down and lets go, twice
  // (the right pull for a basket, aimed at where the hoop will be). See config.showMe in arcade/shared.js.
  let demoShots = 0;
  function demoThink(g, hand, t) {
    if (t < 0.1) demoShots = 0;
    if (t < 0.5 || demoShots >= 2 || hand.busy() || !ready || over || countdown > 0) return;
    const later = clock + HAND_WAIT;                      // (the hand needs a moment to get there and pull)
    const A = aimFor(later), pp = A.pp, aimX = A.x;
    const p = proj(START.x, START.h, START.z);
    hand.drag(p.x, p.y, p.x - aimX * 160, p.y + pp * PULL, 0.7, 0.25);
    demoShots++;
  }
  const HAND_WAIT = 0.35 + 0.7 + 0.25;

  Arcade.start({
    id: 'hoops',
    looks: { kinds: ['trail'] },   // (Nov 24, the Star Road: stars unlock ball trails; see arcade/README.md)
    showMe: { secs: 6, think: demoThink },
    friends: (g) => friendsMenu(g),   // head-to-head on several phones (arcade/net.js)
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
      { id: 'golden', name: 'Golden touch', how: 'Score a golden ball' },
      { id: 'courts', name: 'Court star', how: 'A star on every challenge court' },
    ],   // the trophy room (secret ones show '???' until earned)
    logo: Arcade.logo({
      badge: Arcade.badges.hoops,   // the round picture (arcade/badges.js)
      title: 'Hoop Heroes', colors: ['#ffd166', '#ef476f'], bg: '#ffb4a2', art: `<rect x="150" y="14" width="70" height="56" rx="6" fill="#fff" ${LINK}/><rect x="170" y="34" width="30" height="22" fill="none" ${LINK}/>
              <path d="M150 70 H200 L192 108 H158 Z" fill="#fff" ${LINK}/><path d="M150 70 H200" stroke="#ef476f" stroke-width="7"/>
              <g class="wobble"><circle cx="70" cy="90" r="28" fill="#ff8c42" ${LINK}/><path d="M42 90 H98 M70 62 V118 M50 70 Q70 90 50 110 M90 70 Q70 90 90 110" fill="none" ${LINK} stroke-width="3"/></g>` }),   // title screen
    menuMusic: { tempo: 112, root: 60, scale: 'major', prog: [[1, 6, 4, 5], [4, 5, 6, 5], [4, 1, 2, 5]], drums: 'disco', bass: 'octaves', lead: 'square', harmony: 'brass', pad: true, arp: true, seed: 1302,
        tune: { A: '3/2 3 5 3 1/4 3 | 1/2 1 3 1 -1/4 1 | 4/2 4 6 4 1/4 4 | 5/4 7 5/8',
                B: '8/4 6 8 10 | 9/4 7 9 12 | 10/4 8 6 8 | 7/8 5',
                C: '6/8 4 | 5/8 3 | 4/8 6 | 5/4 7 9/8' } },   // the title/menu song
    title: 'Hoop Heroes',
    view: { w: 960, h: H, flex: true, maxW: 1300 },
    background: '#2a1e5c',
    music: { tempo: 98, root: 53, scale: 'dorian', prog: [[1, 4, 1, 4], [6, 7, 1, 1], [3, 7, 4, 5]], drums: 'boombap', bass: 'bounce', lead: 'square', harmony: 'brass', swing: 0.16, pad: true, arp: false, seed: 1301,
        tune: { A: '5/3 5 3/2 1/4 3 | 6/3 6 4/2 8/8 | 5/3 5 7/2 8/4 7/2 5 | 6/4 4 r/8',
                B: '8/2 8 r 8 10/4 8 | 9/2 9 r 9 11/4 9 | 10/4 8 5 8 | 8/12 r/4',
                C: '5/6 3/2 7/8 | 7/6 4/2 9/8 | 8/6 6/2 4/8 | 5/4 7 9/8' } },   // this game's own song
    levelsTitle: 'Pick a rival',
    // two picture tabs on the picker: Rivals (the ladder + High Score) and Challenges (the courts, Nov 24)
    levelTabs: { Rivals: { icon: TAB_RIVALS, label: 'Rivals' }, Challenges: { icon: TAB_COURTS, label: 'Courts' } },
    // each level says its own difficulty (so adding levels never shifts the old ones); Friends games: Normal
    levelDifficulty: (lv) => (LEVELS.find(l => l.id === lv.id) || {}).diff || 'normal',
    howTo: [
      { pic: S(BALL_SVG(40, 26, 14) + `<path d="M40 44 V70 M32 62 L40 70 L48 62" stroke="#2b2b2b" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`), text: 'Pull back, let go!', keys: 'Drag down &middot; or arrows + hold Space' },
      { pic: S(`<path d="M40 74 C10 66 16 36 32 10 Q36 30 46 26 C56 40 66 62 40 74 Z" fill="#ff8c42" stroke="#2b2b2b" stroke-width="4"/><path d="M40 70 C28 64 30 50 38 40 Q42 52 48 48 C52 58 50 66 40 70 Z" fill="#ffd166"/>`), text: '3 in a row = ON FIRE!' },
      { pic: S(`<circle cx="40" cy="42" r="28" fill="#ffd166" stroke="#2b2b2b" stroke-width="4"/><text x="40" y="53" font-size="32" font-weight="800" text-anchor="middle" font-family="Trebuchet MS, sans-serif" fill="#2b2b2b">3</text>`), text: 'Last 10 seconds: 3 points!' },
      { pic: S(`<circle cx="40" cy="40" r="26" fill="#ef476f" stroke="#2b2b2b" stroke-width="4"/><circle cx="32" cy="36" r="4" fill="#fff"/><circle cx="48" cy="36" r="4" fill="#fff"/><path d="M30 50 Q40 58 50 50" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`), text: 'Beat your rival!' },
    ],
    levels,
    extraMenu,
    extraRows,
    canvasMenus: true,            // (Nov 20) the menus are drawn with Phaser + Rex UI (arcade/canvasmenu.js)
    setup,
    update,
    draw: render,
  });
})();
