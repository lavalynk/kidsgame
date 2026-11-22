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
  const CANVAS = !!window.ArcadeMenus;   // (Nov 21) the menus are drawn with Phaser + Rex UI (arcade/canvasmenu.js)
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
    // ---- the "special things" of the new places (Keith's bike plan #5, Nov 17) ----
    splash: { name: 'Splash',      len: 300, splash: true },             // shallow water across the track: a big splash, a bit slower
    jelly:  { name: 'Jelly pad',   len: 280, jelly: [1, 2] },            // ride over it: BOING, high into the air
    jelly2: { name: 'Jelly pad',   len: 280, jelly: [0, 3] },
    loop:   { name: 'Loop',        len: 460, loop: true },               // a loop-de-loop: everyone makes it round
    lift:   { name: 'Moving ramp', len: 470, ramp: [[0, 0], [140, 84], [330, 84], [470, 0]], move: true },   // goes up and down
    // ---- the builder's boost pads (Keith's bike plan #8, Nov 21): ride over one = ZOOM, a burst of speed ----
    boost:  { name: 'Boost pad',   len: 220, boost: [1, 2] },
    boost2: { name: 'Boost pad',   len: 220, boost: [0, 3] },
  };

  const THEMES = {
    meadow:  { sky: ['#8fd3ff', '#d9f3ff'], hill: '#7cc576', hill2: '#5aa65a', dirt: '#c98b4f', dirt2: '#b77940', ramp: '#e0a465', face: '#a8683a', ground: '#6abf69', bg: '#8fd3ff' },
    desert:  { sky: ['#ffbe76', '#ffe8c2'], hill: '#e0a96d', hill2: '#c98d57', dirt: '#d9a05b', dirt2: '#c48a48', ramp: '#ebb877', face: '#b47a3e', ground: '#e8c27a', bg: '#ffbe76' },
    forest:  { sky: ['#a0e6c8', '#e6fff3'], hill: '#3f8f5a', hill2: '#2f7449', dirt: '#a8744a', dirt2: '#94633c', ramp: '#c48c5a', face: '#8a5a33', ground: '#4ea36a', bg: '#a0e6c8' },
    snow:    { sky: ['#b8d8ff', '#f0f7ff'], hill: '#ffffff', hill2: '#dce9f7', dirt: '#b9a48c', dirt2: '#a8927a', ramp: '#d8c6ae', face: '#9a8268', ground: '#f5f9ff', bg: '#b8d8ff' },
    volcano: { sky: ['#5b2a86', '#ff8f6b'], hill: '#4a3b4f', hill2: '#3a2c40', dirt: '#8a5a44', dirt2: '#76493a', ramp: '#a5705a', face: '#6b4334', ground: '#3d3340', bg: '#5b2a86' },
    night:   { sky: ['#1b2a5c', '#3f5aa8'], hill: '#2c3e70', hill2: '#22315c', dirt: '#8f6a4a', dirt2: '#7d5a3d', ramp: '#a8805c', face: '#6e4f35', ground: '#2f4f4f', bg: '#1b2a5c', dark: true },
    // the new places (Nov 17). deco = the pictures behind the grandstands, sea = the far hills are the sea
    beach:   { sky: ['#6fd0ff', '#d6f6ff'], hill: '#f6dd9c', hill2: '#e9c97c', dirt: '#e8c98a', dirt2: '#d4b170', ramp: '#f0d49a', face: '#c9a465', ground: '#f6dd9c', bg: '#6fd0ff', sea: true, deco: 'palm' },
    candy:   { sky: ['#ffb3de', '#fff0fa'], hill: '#ff9ecf', hill2: '#c9a7ff', dirt: '#b97a56', dirt2: '#a5694a', ramp: '#ffd6a5', face: '#e0a878', ground: '#ff9ecf', bg: '#ffb3de', deco: 'lolly' },
    jungle:  { sky: ['#7fe0b0', '#e2fff0'], hill: '#38a35b', hill2: '#25804a', dirt: '#9c6b43', dirt2: '#8a5c38', ramp: '#d9a55f', face: '#a8763e', ground: '#3b9a58', bg: '#7fe0b0', deco: 'tree' },
    clouds:  { sky: ['#a9c8ff', '#f3eaff'], hill: '#ffffff', hill2: '#e3e9ff', dirt: '#b9a7f0', dirt2: '#a693e3', ramp: '#ffe08a', face: '#e6bd52', ground: '#ffffff', bg: '#a9c8ff', deco: 'cloud' },
  };

  // The built-in tracks. "par" is a great time (seconds). "diff" = how hard it plays
  // (easy / normal / challenge; little kids always get easy). Never change an id (saves use them).
  const TRACKS = [
    { id: 't1', name: 'Sunny Start',   theme: 'meadow', par: 9.7, diff: 'easy',
      pieces: ['flat', 'small', 'flat', 'arrows', 'small', 'mud', 'table', 'flat', 'small', 'flat'] },
    { id: 't2', name: 'Dusty Hills',   theme: 'desert', par: 10.6, diff: 'easy',
      pieces: ['flat', 'small', 'logs', 'big', 'arrows2', 'kicker', 'mud2', 'small', 'table', 'bumps', 'flat'] },
    { id: 't3', name: 'Forest Flyer',  theme: 'forest', par: 14.8, diff: 'normal', time: 'evening',
      pieces: ['flat', 'table', 'logs2', 'double', 'arrows', 'mud', 'big', 'kicker', 'logs', 'bumps', 'small', 'flat'] },
    { id: 't4', name: 'Snowy Peaks',   theme: 'snow',   par: 15.2, diff: 'normal', time: 'dawn',
      pieces: ['flat', 'big', 'bumps', 'double', 'arrows2', 'kicker', 'logs', 'table', 'mud2', 'big', 'double', 'flat'] },
    { id: 't5', name: 'Volcano Run',   theme: 'volcano', par: 20.2, diff: 'challenge',
      pieces: ['flat', 'kicker', 'double', 'logs2', 'big', 'arrows', 'bumps', 'table', 'kicker', 'mud', 'double', 'big', 'arrows2', 'kicker', 'flat'] },
    // ---- 5 new places, each with one special thing (Keith's bike plan #5, Nov 17) ----
    { id: 't6', name: 'Splash Beach',  theme: 'beach',  par: 13.1, diff: 'normal', special: 'splash',
      pieces: ['flat', 'small', 'splash', 'big', 'splash', 'arrows', 'table', 'splash', 'kicker', 'splash', 'small', 'flat'] },
    { id: 't7', name: 'Candy Bounce',  theme: 'candy',  par: 10.4, diff: 'normal', special: 'jelly',
      pieces: ['flat', 'jelly', 'small', 'flat', 'jelly2', 'table', 'arrows2', 'jelly', 'bumps', 'jelly2', 'big', 'flat'] },
    { id: 't8', name: 'Night Lights',  theme: 'night',  par: 14.3, diff: 'normal', special: 'lights',
      pieces: ['flat', 'small', 'big', 'arrows', 'logs', 'table', 'kicker', 'mud2', 'double', 'arrows2', 'big', 'small', 'flat'] },
    { id: 't9', name: 'Jungle Loops',  theme: 'jungle', par: 17.0, diff: 'challenge', special: 'loop',
      pieces: ['flat', 'small', 'loop', 'big', 'arrows', 'logs2', 'loop', 'table', 'mud', 'kicker', 'loop', 'flat'] },
    { id: 't10', name: 'Cloud Castle', theme: 'clouds', par: 15.6, diff: 'challenge', special: 'lift',
      pieces: ['flat', 'small', 'flat', 'lift', 'arrows2', 'flat', 'lift', 'flat', 'jelly', 'lift', 'flat', 'kicker', 'loop', 'lift', 'flat'] },
  ];
  // own-track colors: the first 5 are always there, the others open when you finish their track
  const OPEN_THEMES = ['meadow', 'desert', 'forest', 'snow', 'volcano'];

  // Bikes: different colors and handling. Unlocked by playing well.
  const BIKES = [
    { id: 'red',   name: 'Red Rocket',   color: '#ef476f', top: 1.0,  heat: 1.0, land: 0,    lean: 1.0, need: null },
    { id: 'blue',  name: 'Blue Breeze',  color: '#118ab2', top: 0.97, heat: 0.7, land: 0,    lean: 1.0, need: 'Finish Dusty Hills' },
    { id: 'green', name: 'Green Gecko',  color: '#06d6a0', top: 0.98, heat: 1.0, land: 0.15, lean: 1.3, need: 'Win a gold medal' },
    { id: 'gold',  name: 'Golden Comet', color: '#ffc93c', top: 1.08, heat: 0.9, land: 0.05, lean: 1.1, need: 'Win 4 gold medals' },
  ];

  // ---------------------------------------------------------------
  // The Bike Shop (Keith's bike plan #7, Nov 19): spend the coins you grab on the
  // track. Saved in g.save.data:
  //   wallet  = coins you can spend (every track coin goes in; old saves start with all they ever got)
  //   up      = { engine: 0-3, cool: 0-3, tires: 0-3 }   upgrade levels
  //   look    = { paint: '' or a color, flames: bool, sticker: '' or a STICKERS id }
  //   owned   = ['paint:#ff70a6', 'flames', 'sticker:star', ...]   looks you've bought
  // Upgrades work on every bike (they're added on top of the bike's own stats).
  // ---------------------------------------------------------------
  const UPGRADES = [
    { id: 'engine', name: 'Engine', does: 'Faster', cost: [20, 40, 70] },       // top speed +3% a level
    { id: 'cool',   name: 'Cooler', does: 'Turbo longer', cost: [15, 30, 55] }, // heats up 12% slower a level
    { id: 'tires',  name: 'Tires',  does: 'Grip + mud', cost: [15, 30, 55] },    // easier landings, less slow in mud
  ];
  const PAINTS = ['#ff70a6', '#9b5de5', '#4cc9f0', '#ff8c42', '#2b2d42', '#ffffff', '#8ac926', '#f15bb5'];
  const PAINT_COST = 12, FLAMES_COST = 25, STICKER_COST = 10;
  const STICKERS = ['star', 'heart', 'bolt', 'smile'];
  function shopData(g) {
    const d = g.save.data;
    if (d.wallet == null) d.wallet = d.coinsAll || 0;          // old saves: every coin you ever got
    d.up = Object.assign({ engine: 0, cool: 0, tires: 0 }, d.up);
    d.look = Object.assign({ paint: '', flames: false, sticker: '' }, d.look);
    d.owned = d.owned || [];
    return d;
  }
  // the bike you ride = the picked bike + your upgrades + your looks
  function myBike(g) {
    const b = pickedBike(g), d = shopData(g), u = d.up;
    return { ...b,
      top: b.top * (1 + 0.03 * u.engine),
      heat: b.heat * (1 - 0.12 * u.cool),
      land: b.land + 0.06 * u.tires,
      lean: b.lean * (1 + 0.08 * u.tires),
      mud: 0.5 + 0.08 * u.tires,              // how fast you can go in mud (0.5 = half speed)
      color: d.look.paint || b.color, flames: d.look.flames, sticker: d.look.sticker };
  }

  // Build features (with x positions) from a list of piece names.
  function build(pieces) {
    const feats = [];
    let x = 600; // run-up before the first piece
    let moving = 0;
    for (const name of pieces) {
      const p = PIECES[name]; if (!p) continue;
      // (a moving ramp gets a "phase" so two of them don't go up and down together)
      if (p.ramp) feats.push({ kind: 'ramp', x, pts: p.ramp.map(([dx, h]) => [x + dx, h]), end: x + p.len, move: !!p.move, phase: (moving += p.move ? 1 : 0) * 2.1 });
      if (p.splash) feats.push({ kind: 'splash', x: x + 10, end: x + p.len - 10 });
      if (p.jelly) for (const l of p.jelly) feats.push({ kind: 'jelly', lane: l, x: x + 70, end: x + 180, squish: 0 });
      if (p.loop) feats.push({ kind: 'loop', x: x + 180, end: x + p.len, R: LOOP_R });
      if (p.mud) for (const l of p.mud) feats.push({ kind: 'mud', lane: l, x: x + 20, end: x + p.len - 20 });
      if (p.arrows) for (const l of p.arrows) feats.push({ kind: 'arrows', lane: l, x: x + 20, end: x + p.len - 20 });
      if (p.boost) for (const l of p.boost) feats.push({ kind: 'boost', lane: l, x: x + 50, end: x + 170 });
      if (p.logs) for (const l of p.logs) feats.push({ kind: 'log', lane: l, x: x + 80, end: x + 140, h: 20 });
      x += p.len + (p.after || 0) + 140;
    }
    // ---- coins (Keith's bike plan #2): arcs in the air over ramps, rows on the flat in other lanes ----
    // h = how high above the ground the coin floats (the bike's middle is ~30 above the ground)
    const coins = [];
    let k = 0;
    for (const f of feats) {
      if (f.kind !== 'ramp') continue;
      // follow the path a bike flies off this ramp's top at normal gas speed, and put coins on it
      const top = Math.max(...f.pts.map(p => p[1]));
      const ti = f.pts.findIndex(p => p[1] === top), tip = f.pts[ti], before = f.pts[Math.max(0, ti - 1)];
      const slope = (tip[1] - before[1]) / Math.max(1, tip[0] - before[0]);
      const lane = (k++) % 4, gold = top >= 90;     // big ramps get a gold star coin in the middle
      const v = 430, path = [];
      let fx = tip[0], fh = top, vy = v * slope;
      for (let t = 0; t < 2 && fh >= 0; t += 1 / 60) {
        fx += v / 60; vy -= G / 60; fh += vy / 60;
        const gh = rampH(f, fx, true);
        if (fh <= gh) break;
        path.push([fx, fh]);
      }
      if (path.length < 8) continue;                 // too small a hop for coins
      const n = Math.min(5, Math.floor(path.length / 6));
      for (let i = 0; i < n; i++) {
        const [cx, ch] = path[Math.floor((i + 0.5) * path.length / n)];
        coins.push({ x: cx, h: ch + 30, lane, star: gold && i === Math.floor(n / 2) });
      }
    }
    // rows of coins on the flat bits, in a different lane each time (a reason to change lanes!)
    for (let cx = 760, i = 0; cx < x - 200; cx += 480, i++) {
      const lane = (i * 3 + 1) % 4;
      if (feats.some(f => (f.kind === 'ramp' || f.kind === 'loop') && cx < f.end + 60 && cx + 160 > f.x - 140)) continue;   // not on a ramp or a loop
      for (let j = 0; j < 4; j++) coins.push({ x: cx + j * 44, h: 30, lane, star: false });
    }
    return { feats, coins, finish: x + 200, length: x + 900 };
  }

  // Height of a polyline ramp at x (0 outside). A moving ramp is scaled by how far up it is
  // right now (full = true: its highest, used for placing coins).
  function rampH(f, x, full) {
    if (x <= f.pts[0][0] || x >= f.pts[f.pts.length - 1][0]) return 0;
    const k = f.move && !full ? liftK(f) : 1;
    for (let i = 1; i < f.pts.length; i++) {
      const [x1, h1] = f.pts[i - 1], [x2, h2] = f.pts[i];
      if (x <= x2) return k * (h1 + (h2 - h1) * (x - x1) / (x2 - x1 || 1));
    }
    return 0;
  }
  // Moving ramps (Cloud Castle): slowly up and down between 25% and 100% of their height.
  // It runs on the race clock, so the ghost and every phone in a Friends race see the same ramp.
  let clock = 0;
  const liftK = (f) => 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(clock * 1.5 + f.phase));
  const LOOP_R = 110, LOOP_DRIFT = 40;   // loop size, and how far along it comes out (a loop is a little spiral)
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
  // the boost pad under you (each pad works once per rider: f !== b.boosted)
  const boostAt = (T, x, lane) => T.feats.find(f => f.kind === 'boost' && f.lane === lane && x >= f.x && x <= f.end);
  const inSplash = (T, x) => T.feats.some(f => f.kind === 'splash' && x >= f.x && x <= f.end);
  const jellyAt = (T, x, lane) => T.feats.find(f => f.kind === 'jelly' && f.lane === lane && x >= f.x && x <= f.end);
  // a loop whose start we just rolled over (from x0 to x1 this step)
  const loopAt = (T, x0, x1) => T.feats.find(f => f.kind === 'loop' && x0 < f.x && x1 >= f.x);

  // ---------------------------------------------------------------
  // Game state
  // ---------------------------------------------------------------
  let T, theme, bike, bikeDef, ghost, ghostRun, countdown, raceTime, finished, popups, stats, camX;
  let coinsGot = 0, shake = 0, wasTurbo = false, lines = [], ais = [];   // coins this race, camera shake, speed lines, computer riders

  // ---- tricks (Keith's bike plan #1): in the air, Up = Superman, Down = No-hands ----
  // Made gentler after Keith tried them (Nov 6):
  //  * while a trick is going the bike floats (less gravity), so there's time to finish it
  //  * pressing Up/Down on the way up a ramp saves the trick for take-off (no lane change)
  //  * tiny hops (bumps, logs) don't start tricks
  //  * the rider moves smoothly into the pose and back out (k goes 0 -> 1 -> 0)
  //  * landing before a trick is done just cancels it: no slow-down, no tumble
  const TRICK_TIME = 0.4;          // seconds to finish a trick
  const TRICK_FLOAT = 0.5;         // gravity while doing a trick (half = floaty)

  // ---- computer riders (Keith's bike plan #4): 3 cartoon riders on the other lanes ----
  const AI_RIDERS = [
    { name: 'Zip', color: '#9b5de5', skill: 0.95 },
    { name: 'Moxie', color: '#ff8c42', skill: 1.0 },
    { name: 'Bolt', color: '#06d6a0', skill: 0.9 },
  ];

  // ---------------------------------------------------------------
  // Championship cups (Keith's bike plan #6, Nov 18): several tracks in a row
  // against Zip, Moxie and Bolt. Every race gives points for your place; after the
  // last race the most points wins the cup. Like RC's Grand Prix, but simpler: no garage.
  //   mini = 3 short tracks (always open)
  //   big  = all 10 tracks (opens once you've finished the Mini Cup)
  // Each cup's progress is saved in g.save.data.cups[key] = { active, race, points: { You, Zip, Moxie, Bolt }, last }
  // so you can stop between races and carry on later. Best place ever: g.save.data.cupBest[key].
  // ---------------------------------------------------------------
  const CUPS = {
    mini: { name: 'Mini Cup', list: ['t1', 't2', 't7'], color: '#c9d6df', coins: 1 },
    big:  { name: 'Championship', list: ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10'], color: '#ffc93c', coins: 3 },
  };
  const CUP_POINTS = [10, 7, 5, 3];          // points for 1st, 2nd, 3rd, 4th in each race
  const cupOpen = (g, key) => key === 'mini' || ((g.save.data.cupsDone || {}).mini || 0) > 0;
  // the saved cup (only if it's still going)
  const cupNow = (g, key) => { const c = (g.save.data.cups || {})[key]; return c && c.active ? c : null; };
  // a fresh cup: everyone on 0 points
  function newCup(g, key) {
    const d = g.save.data;
    d.cups = d.cups || {};
    const points = { You: 0 };
    AI_RIDERS.forEach(r => { points[r.name] = 0; });
    return (d.cups[key] = { active: true, race: 0, points, last: null });
  }
  // The level for the NEXT race of a cup: the track itself + cup: key. Its id is the
  // cup's key, so the kit keeps the cup's best medal under levels.mini / levels.big.
  function cupRace(g, key) {
    const c = cupNow(g, key), i = c ? c.race : 0;
    const t = TRACKS.find(x => x.id === CUPS[key].list[i]);
    return { ...t, id: key, track: t.id, cup: key, raceNo: i, name: CUPS[key].name, pic: cupPic(key), noStart: true, section: 'Cups',
      locked: !cupOpen(g, key), meta: cupMeta(g, key) };
  }
  // the cups' little tile picture: a trophy with track flags under it
  function cupPic(key) {
    const col = CUPS[key].color, n = key === 'mini' ? 3 : 10;
    return `<svg viewBox="0 0 120 70"><rect width="120" height="70" fill="${key === 'mini' ? '#bde0fe' : '#ffd6a5'}"/>` + cupSVG(col, 60, 4, 0.5) +
      `<g>${Array.from({ length: n }, (_, k) => `<rect x="${60 - n * 5 + k * 10 + 2}" y="58" width="7" height="7" rx="1.5" fill="${k % 2 ? '#2b2b2b' : '#fff'}" stroke="#2b2b2b" stroke-width="1.5"/>`).join('')}</g></svg>`;
  }
  // a trophy cup drawn at (cx, top), size s (1 = 100 px tall)
  function cupSVG(col, cx, top, s) {
    return `<g transform="translate(${cx} ${top}) scale(${s})"><path d="M-22 6 H22 V34 A22 22 0 0 1 -22 34 Z" fill="${col}" stroke="#2b2b2b" stroke-width="6" stroke-linejoin="round"/>` +
      `<path d="M-22 14 H-36 Q-38 38 -18 42 M22 14 H36 Q38 38 18 42" fill="none" stroke="#2b2b2b" stroke-width="6" stroke-linecap="round"/>` +
      `<path d="M0 56 V72" stroke="#2b2b2b" stroke-width="8"/><rect x="-18" y="72" width="36" height="14" rx="4" fill="${col}" stroke="#2b2b2b" stroke-width="5"/>` +
      `<path d="M-12 14 Q-10 30 -2 36" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.7"/></g>`;
  }
  // under the tile: your best cup medal, or how far you are (flags)
  function cupMeta(g, key) {
    const c = cupNow(g, key), best = (g.save.data.cupBest || {})[key];
    const med = best && best <= 3 ? icons.medal(['gold', 'silver', 'bronze'][best - 1]).replace('<svg', '<svg style="width:24px;height:24px;vertical-align:middle"') : '';
    return med + (c && c.race ? ` ${c.race}/${CUPS[key].list.length}` : '');
  }
  // standings, most points first (on a tie, You go first: kind to kids)
  const cupTable = (c) => Object.entries(c.points).map(([name, pts]) => ({ name, pts }))
    .sort((a, b) => b.pts - a.pts || (a.name === 'You' ? -1 : b.name === 'You' ? 1 : 0));
  const riderColor = (g, name) => name === 'You' ? pickedBike(g).color : (AI_RIDERS.find(r => r.name === name) || {}).color || '#ccc';

  // ---------------------------------------------------------------
  // The Daily Ghost Race (Keith's bike plan #9, Nov 21): every day one track is picked from
  // the date, and you race Wisp, a friendly see-through ghost rider, on it. Just the two of
  // you (no Zip, Moxie or Bolt). Beat him = a ghost on today's spot in the week strip, and
  // the first win of the day gives 1 house coin. A new track (and a new Wisp) at midnight.
  //   * the track: big kids jump 3 tracks a day through all 10 (never the same two days running);
  //     little kids get one of the 7 gentler tracks (no Volcano, loops or Cloud Castle)
  //   * Wisp rides like the computer riders, but his whole ride is worked out before "GO!"
  //     (planWisp()): his speed is picked so he crosses the line at par x GHOST_PACE.
  //     Par is a great time, so big kids have to ride well (turbo, cool arrows, flat landings);
  //     little kids get a sleepy Wisp.
  // Saved in g.save.data: ghostDay (the last day you beat him), ghostWins (how many days),
  // ghostDays (the days you beat him, the newest 30, for the week strip).
  // Levels are 'dg-<track id>' so the kit keeps your best time per track.
  // ---------------------------------------------------------------
  const WISP = { name: 'Wisp', color: '#e9e1ff', lane: 2 };
  const GHOST_PACE = { big: 1.15, little: 1.6 };     // Wisp's time = the track's par x this
  const LITTLE_GHOST = ['t1', 't2', 't3', 't4', 't6', 't7', 't8'];
  let wisp = null;                                  // { f: [[x, h, angle] 30 a second], t: his finish time }
  // which day it is (the same clock as the Daily Surprise, so tests can pretend a day)
  const todayStr = () => (Arcade.daily && Arcade.daily._day) ? Arcade.daily._day() : new Date().toISOString().slice(0, 10);
  function dayNum(str) { const [y, m, d] = str.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); }
  // the day before / after a 'YYYY-MM-DD' day
  function dayAdd(str, n) { const d = new Date((dayNum(str) + n) * 864e5); return d.toISOString().slice(0, 10); }
  function ghostTrack(little) {
    const pool = little ? LITTLE_GHOST : TRACKS.map(t => t.id), n = pool.length;
    const id = pool[((dayNum(todayStr()) * 3) % n + n) % n];
    return TRACKS.find(t => t.id === id);
  }
  const beatToday = (g) => g.save.data.ghostDay === todayStr();
  // the level tile (and what the Ghost button plays)
  function ghostLevel(g) {
    const t = ghostTrack(Arcade.profiles.little()), wins = g.save.data.ghostWins || 0;
    return { ...t, id: 'dg-' + t.id, track: t.id, daily: true, name: 'Ghost Race', section: 'Ghost Race', noStart: true,
      pic: trackPic(t.theme, t.special).replace('</svg>', placed(WISP_PIC, 62, 2, 52, 52) + '</svg>'),
      meta: (beatToday(g) ? TICK : '') + WISP_PIC.replace('<svg', '<svg style="width:26px;height:26px;vertical-align:middle"') + ' × ' + wins };
  }
  function playGhost(g) { g.play(ghostLevel(g)); }
  // Work out Wisp's whole ride: try speeds until he finishes at the target time (a few quick pretend rides)
  function planWisp(g, def) {
    const target = (def.par || estimatePar()) * GHOST_PACE[g.little ? 'little' : 'big'];
    let lo = 0.3, hi = 1.8;
    for (let i = 0; i < 12; i++) { const k = (lo + hi) / 2; if (simRider(k).t > target) lo = k; else hi = k; }
    const run = simRider((lo + hi) / 2);
    run.target = Math.round(target * 100) / 100;
    return run;
  }
  // one pretend ride of a computer rider with this skill, start to finish (+3 seconds rolling on)
  function simRider(skill) {
    const keep = clock, a = { lane: WISP.lane, laneF: WISP.lane, x: 300, h: 0, vy: 0, v: 0, angle: 0, air: false, wheel: 0, done: 0, skill, sim: true };
    const f = [], dt = 1 / 120;
    let t = 0;
    for (let k = 0; k < 120 * 120; k++) {
      if (k % 4 === 0) f.push([Math.round(a.x * 10) / 10, Math.round(a.h * 10) / 10, Math.round(a.angle * 1000) / 1000]);
      t += dt; clock = t;                 // (moving ramps go up and down on the race clock)
      stepRider(a, dt, t, false);
      if (a.done && t > a.done + 3) break;
    }
    clock = keep;
    return { f, t: a.done || 99 };
  }
  // where Wisp is at a time in the race (before "GO!" he waits on the line)
  function wispAt(time) {
    const i = Math.max(0, time) * 30, k = Math.min(wisp.f.length - 2, Math.floor(i)), u = Math.min(1, i - k);
    const a = wisp.f[k], b = wisp.f[k + 1];
    return { x: a[0] + (b[0] - a[0]) * u, h: a[1] + (b[1] - a[1]) * u, angle: a[2] + (b[2] - a[2]) * u };
  }
  // Wisp's picture: a round friendly ghost with a wavy tail (tiles, results, the Ghost button)
  const WISP_PIC = `<svg viewBox="0 0 60 60"><path d="M12 52 V28 A18 18 0 0 1 48 28 V52 L42 46 L36 52 L30 46 L24 52 L18 46 Z" fill="${WISP.color}" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/>` +
    `<ellipse cx="23" cy="28" rx="4" ry="5.5" fill="#2b2b2b"/><ellipse cx="37" cy="28" rx="4" ry="5.5" fill="#2b2b2b"/><circle cx="24.5" cy="26" r="1.6" fill="#fff"/><circle cx="38.5" cy="26" r="1.6" fill="#fff"/>` +
    `<circle cx="17" cy="36" r="3.5" fill="#ffafcc"/><circle cx="43" cy="36" r="3.5" fill="#ffafcc"/><path d="M26 37 Q30 41 34 37" fill="none" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/></svg>`;
  // The results picture: you and Wisp (who was 1st), your best ghost wins, and this week:
  // 7 circles for the last 7 days, a little Wisp on every day you beat him (today has a yellow ring).
  function ghostResultSVG(g, won, mine, his) {
    const d = g.save.data, days = d.ghostDays || [], today = todayStr();
    const line = (y, first, pic, t) => `<rect x="4" y="${y}" width="300" height="66" rx="33" fill="${first ? '#ffd166' : '#fff'}" stroke="#2b2b2b" stroke-width="4"/>` +
      `<text x="46" y="${y + 44}" font-size="24" text-anchor="middle" ${T_FONT}>${first ? '1st' : '2nd'}</text>` + pic(92, y + 4) +
      `<text x="224" y="${y + 44}" font-size="26" text-anchor="middle" ${T_FONT}>${t.toFixed(1)} s</text>`;
    const me = (x, y) => placed(bikeIcon(bikeDef.color), x, y + 6, 66, 46), boo = (x, y) => placed(WISP_PIC, x + 6, y, 58, 58);
    let s = won ? line(4, true, me, mine) + line(78, false, boo, his) : line(4, true, boo, his) + line(78, false, me, mine);
    s += placed(WISP_PIC, 324, 6, 70, 70) + `<text x="359" y="112" font-size="26" text-anchor="middle" ${T_FONT.replace('fill="#2b2b2b"', 'fill="#fff" stroke="#2b2b2b" stroke-width="5" paint-order="stroke"')}>× ${d.ghostWins || 0}</text>`;
    for (let i = 0; i < 7; i++) {
      const day = dayAdd(today, i - 6), x = 34 + i * 56, y = 182, got = days.includes(day);
      s += `<circle cx="${x}" cy="${y}" r="24" fill="${got ? '#c8b6ff' : '#fff'}" stroke="${day === today ? '#ffd166' : '#2b2b2b'}" stroke-width="${day === today ? 8 : 4}"/>` +
        (day === today ? `<circle cx="${x}" cy="${y}" r="28" fill="none" stroke="#2b2b2b" stroke-width="3"/>` : '') +
        (got ? placed(WISP_PIC, x - 17, y - 18, 34, 34) : '');
    }
    return `<svg viewBox="0 0 404 218">${s}</svg>`;
  }
  // Finished the Ghost Race: did you beat Wisp?
  function ghostFinish(g, time) {
    const his = wisp.t, won = time <= his, d = g.save.data, day = todayStr();
    let coin = false;
    if (won) {
      if (d.ghostDay !== day) {               // the first win today: +1 house coin and a ghost in the week strip
        d.ghostDay = day; d.ghostWins = (d.ghostWins || 0) + 1; coin = true;
        d.ghostDays = (d.ghostDays || []).filter(x => x !== day).concat(day).slice(-30);
        const st = Arcade.store.load(); st.houseBonus = (st.houseBonus || 0) + 1;
      }
      g.achieve('ghost');
      // 7 days in a row?
      if ([0, 1, 2, 3, 4, 5, 6].every(i => (d.ghostDays || []).includes(dayAdd(day, -i)))) g.achieve('ghostweek');
    }
    g.achieve('finish');
    g.store();
    if (coin) setTimeout(() => g.toast('+1 house coin!', '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19" fill="#ffc93c" stroke="#2b2b2b" stroke-width="4"/></svg>'), 1800);
    g.particles.burst(W / 2, 120, { count: won ? 40 : 12, shape: 'star', speed: 320, size: 16 });
    const pic = ghostResultSVG(g, won, time, his);
    g.finish({
      win: won, time, stars: won ? 3 : 0, starsRow: false, delay: 1300,
      title: won ? 'You beat Wisp!' : 'Wisp wins! Nice try!',
      rowsTop: true, rows: [{ t: 'pics', items: [pic], size: 400, kind: 'ghost', won }],
      lines: CANVAS ? (coinsGot ? [{ icon: COIN_ICON, text: String(coinsGot) }] : []) : [`<div style="max-width:420px;margin:0 auto">${pic}</div>`],
      buttons: [
        { icon: icons.again, label: 'Again', cls: 'big', onClick: () => playGhost(g) },
        { icon: icons.menu, label: 'Menu', cls: 'blue', onClick: () => g.menu() },
      ],
    });
  }

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

  // ---------------------------------------------------------------
  // Friends: race on several phones (arcade/net.js). Everyone rides the same
  // track; friends show up as riders in their own color on the next lanes.
  // Each phone only moves its own bike, and tells the others where it is
  // 10 times a second.
  // ---------------------------------------------------------------
  const party = () => Arcade.net && Arcade.net.party;
  let riders = {}, sendT = 0, wired = false;
  function friendsMenu(g) {
    if (!party()) return;
    if (!wired) {
      wired = true;
      party().on('move', (m) => {
        if (!g.level || !g.level.friends) return;
        let r = riders[m.from];
        if (!r) r = riders[m.from] = { x: m.x, h: m.h, a: m.a, lane: m.l };
        r.tx = m.x; r.th = m.h; r.ta = m.a; r.tl = m.l; r.fin = m.fin || 0;
      });
      party().on('leave', (m) => { delete riders[m.from]; });
    }
    // (Keith's bike plan #8: the room maker's own track is a choice too. Its pieces travel in the
    //  start message itself, "my~<theme>~<letters>", so every phone builds the very same track)
    const custom = g.save.data.custom, mine = custom && custom.pieces && custom.pieces.length ? packTrack(custom) : null;
    const choices = TRACKS.map(t => ({ id: t.id, name: t.name, pic: trackPic(t.theme, t.special) }));
    if (mine) choices.push({ id: mine, name: 'My Track', pic: trackPic(custom.theme) });
    party().menu(g, {
      choices,
      onStart: (id) => {
        if (String(id).startsWith('my~')) { const c = unpackTrack(id); g.play({ id: 'fr-my', name: 'My Track', theme: c.theme, pieces: c.pieces, friends: true, pick: id }); return; }
        const t = TRACKS.find(x => x.id === id) || TRACKS[0]; g.play({ ...t, id: 'fr-' + t.id, friends: true, pick: t.id });
      },
      onBack: () => g.menu(),
    });
  }
  // a friend's look; if their color is the same as my bike's, they get another one so you can tell them apart
  const peerOf = (seat) => {
    const p = Object.assign({ pet: 'cat', color: '#4cc9f0', name: '' }, (party() && party().peers[seat]) || {});
    if (bikeDef && p.color === bikeDef.color) p.color = ['#4cc9f0', '#06d6a0', '#ffd166', '#9b5de5'][seat % 4];
    return p;
  };

  function setup(g, level) {
    const def = level || { id: 't1', ...TRACKS[0] };
    riders = {}; sendT = 0;
    coinsGot = 0; shake = 0; wasTurbo = false; lines = [];
    // (Friends: each phone starts in its own lane, by seat, so the bikes don't sit on top of each other)
    const myLane = def.friends && party() && party().room ? [1, 2, 0, 3][(party().room.seat || 0) % 4] : 1;
    T = build(def.pieces);
    theme = THEMES[def.theme] || THEMES.meadow;
    timeOfDay = TIMES[def.time] ? def.time : '';     // (a few tracks race at evening / dawn: living backgrounds)
    document.body.style.setProperty('--ar-bg', timeOfDay ? TIMES[timeOfDay].sky[1] : theme.bg);
    bikeDef = myBike(g);              // the picked bike + shop upgrades + looks
    bike = {
      x: 300, h: 0, vy: 0, v: 0, angle: 0, w: 0, lane: myLane, laneF: myLane,
      air: false, heat: 0, over: 0, crash: 0, crashSpin: 0, wheel: 0, lean: 0, airTime: 0,
    };
    // computer riders: in the lanes you're not in (not in Friends races)
    const lanes = [0, 1, 2, 3].filter(l => l !== myLane);
    ais = def.friends || def.daily ? [] : AI_RIDERS.map((r, i) => ({ ...r, lane: lanes[i], laneF: lanes[i], x: 300, h: 0, vy: 0, v: 0, angle: 0, air: false, wheel: 0, done: 0,
      skill: r.skill * g.pick(0.86, 0.95, 1.02) * (g.little ? 0.9 : 1) }));
    countdown = 3.2;
    raceTime = 0; clock = 0;
    finished = false;
    popups = [];
    stats = { perfect: 0, crashes: 0, bigAir: 0 };
    camX = 0;
    ghostRun = [];
    const saved = (g.save.data.ghosts || {})[def.id];
    ghost = saved && saved.length && !def.friends && !def.cup && !def.daily ? saved : null;
    wisp = def.daily ? planWisp(g, def) : null;      // the Daily Ghost Race: Wisp's whole ride, worked out now
    // a cup race: start the cup if it isn't going yet (the first race, or after the last cup ended)
    if (def.cup && !cupNow(g, def.cup)) newCup(g, def.cup);
    g.beeped = 4;
    // peek hook for automated tests
    window.__bikeState = () => ({ level: def.id, pieces: def.pieces, theme: def.theme, ride: { top: bikeDef.top, heat: bikeDef.heat, land: bikeDef.land, mud: bikeDef.mud, color: bikeDef.color, flames: !!bikeDef.flames, sticker: bikeDef.sticker }, wallet: shopData(g).wallet, cup: def.cup ? { key: def.cup, track: def.track, race: def.raceNo, state: (g.save.data.cups || {})[def.cup], best: (g.save.data.cupBest || {})[def.cup] || null } : null, diff: g.difficulty, par: def.par || null, dark: !!theme.dark && countdown <= 0 && bike.x > 1200,
      lift: !bike.air && T.feats.some(f => f.move && bike.x > f.pts[1][0] && bike.x < f.pts[2][0]), bike, raceTime, finished, stats, finishX: T.finish, countdown, coins: coinsGot, coinCount: T.coins.length, ais: ais.map(a => ({ x: Math.round(a.x), lane: a.lane, done: a.done })), wisp: wisp ? { t: wisp.t, target: wisp.target, x: Math.round(wispAt(raceTime).x) } : null, friends: Object.keys(riders).map(k => ({ x: Math.round(riders[k].x), fin: riders[k].fin })) });
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
    clock += dt;
    for (const f of T.feats) if (f.squish) f.squish = Math.max(0, f.squish - dt);   // jelly pads wobble back
    if (g.level && g.level.friends) {
      if ((sendT -= dt) <= 0 && party()) {
        sendT = 0.1;
        party().tell({ t: 'move', x: Math.round(b.x), h: Math.round(b.h), a: Math.round(b.angle * 100) / 100, l: Math.round(b.laneF * 100) / 100, fin: finished ? Math.round(raceTime * 100) / 100 : 0 });
      }
      for (const r of Object.values(riders)) {
        const k = Math.min(1, dt * 10);
        r.x += (r.tx - r.x) * k; r.h += (r.th - r.h) * k; r.a += (r.ta - r.a) * k; r.lane += (r.tl - r.lane) * k;
      }
    }

    // record a ghost frame 30 times a second
    if (!finished && Math.floor(raceTime * 30) > ghostRun.length - 1) {
      ghostRun.push([Math.round(b.x), Math.round(b.h), Math.round(b.angle * 100), Math.round(b.laneF * 100)]);
    }

    // (little kids: landings are extra forgiving and the engine heats up slower)
    const tol = g.pick(0.8, 0.55, 0.38) + bikeDef.land + (g.little ? 0.35 : 0);   // how far off a landing can be
    const assist = g.pick(3.2, 1.6, 0.5);                  // auto-tilt toward the flight path
    const heatRate = g.pick(0.16, 0.24, 0.32) * bikeDef.heat * (g.little ? 0.7 : 1);
    const topGas = 400 * bikeDef.top, topTurbo = 590 * bikeDef.top;

    const brake = !finished && inp.down('ArrowLeft', 'KeyA');
    // (little kids: the bike pedals by itself; they just steer, jump and use turbo)
    const gas = !finished && (inp.down('ArrowRight', 'KeyD') || (g.little && !brake));
    const turbo = !finished && inp.down('Space', 'KeyX', 'KeyK');
    // a "whoosh" when the turbo kicks in
    if (turbo && !wasTurbo && b.over <= 0 && b.crash <= 0) g.sfx('whoosh');
    wasTurbo = turbo;
    updateAIs(g, dt);
    collectCoins(g);
    // speed lines + a tiny camera shake when you're really flying along
    shake = Math.max(0, shake - dt * 3);
    if (b.v > 520 && !finished) { shake = Math.max(shake, 0.25 * (b.v - 520) / 240); if (Math.random() < dt * 30) lines.push({ x: W + 20, y: 90 + Math.random() * 260, len: 60 + Math.random() * 90, t: 0 }); }
    for (const l of lines) { l.x -= 1500 * dt; l.t += dt; }
    lines = lines.filter(l => l.x + l.len > -20);

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
        // back up with a little hop, a puff of dust, and "I'm OK!"
        b.hop = 0.35;
        g.particles.burst(b.x - camX, laneY(b.laneF) - 10, { count: 12, colors: ['#ffffff', '#e6c39a'], speed: 110, gravity: -40, size: 14, life: 0.6 });
        popup(pickOk(), b.x - camX, laneY(b.laneF) - 110, '#ffffff');
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
      if (g.little) b.heat = Math.min(b.heat, 0.92);      // little kids never overheat (Keith's bike plan #10)
      if (b.heat >= 1) {
        b.heat = 1; b.over = g.pick(1.8, 2.6, 3.4); stats.hot = (stats.hot || 0) + 1; if (stats.hot >= 3) g.achieve('hothead');
        g.sfx('crash'); popup('Too hot!', b.x - camX, laneY(b.laneF) - 90, '#ff6b6b');
      }
    } else {
      b.heat = Math.max(0, b.heat - dt * (gas ? 0.12 : 0.2));
    }
    const engineOn = b.over <= 0;
    // music follows the bike: turbo = all-out, overheated or crashed = calm until you're going again
    if (!finished) g.music.mood({ energy: !engineOn || b.crash > 0 ? 0.3 : turbo ? 2 : 1 });

    // ---- jelly pad (Candy Bounce): BOING, high into the air. The bike stays level and
    //      always lands fine, so it's pure fun (and a great moment for a trick) ----
    const jp = !b.air && !b.loop && b.v > 60 ? jellyAt(T, b.x, b.lane) : null;
    if (jp) {
      b.air = true; b.bounce = true; b.vy = g.little ? 720 : 820; b.w = 0; b.airTime = 0; b.queued = null;
      jp.squish = 0.35; stats.bounces = (stats.bounces || 0) + 1; g.achieve('boing');
      g.sfx('spring');
      popup('Boing!', b.x - camX, laneY(b.laneF) - 100, '#ff70a6');
      g.particles.burst(b.x - camX, laneY(b.laneF) - 6, { count: 14, colors: ['#ff70a6', '#ffd6e8', '#fff'], speed: 200, size: 10, life: 0.5 });
    }

    if (b.loop) {
      // ---- riding a loop-de-loop (Jungle Loops): the bike goes all the way round by itself ----
      if (rideLoop(b, dt)) {
        stats.loops = (stats.loops || 0) + 1; g.achieve('looper');
        const sx = b.x - camX, sy = laneY(b.laneF);
        popup('Loop!', sx, sy - 110, '#f15bb5'); g.sfx('star'); cheer(g);
        g.particles.burst(sx, sy - 40, { count: 22, shape: 'star', speed: 260, size: 13, gravity: 300 });
      }
    } else if (!b.air) {
      // ---- lane changes (only where both lanes are the same height) ----
      let up = inp.hit('ArrowUp', 'KeyW'), dn = inp.hit('ArrowDown', 'KeyS');
      // going up a ramp: Up/Down = "do a trick when I fly off" (instead of changing lanes)
      if ((up || dn) && slopeAt(T, b.x, b.lane) > 0.15) { b.queued = { kind: up ? 'superman' : 'nohands', t: 0.6 }; up = dn = false; }
      if (b.queued && (b.queued.t -= dt) <= 0) b.queued = null;
      for (const [want, d] of [[up, -1], [dn, 1]]) {
        const nl = b.lane + d;
        if (want && nl >= 0 && nl <= 3 && Math.abs(groundH(T, b.x, nl) - groundH(T, b.x, b.lane)) < 2) { b.lane = nl; g.sfx('tick'); }
      }

      // ---- speed ----
      const muddy = inFeat(T, 'mud', b.x, b.lane);
      const wet = inSplash(T, b.x);
      let top = engineOn ? (turbo ? topTurbo : gas ? topGas : 0) : 0;
      if (muddy) top *= bikeDef.mud;            // (better tires = less slow in mud)
      if (wet) top *= 0.8;                       // water: a little slower (jump over it to keep your speed!)
      // a boost pad: ZOOM! (for a moment the bike keeps going fast even without gas)
      const bp = boostAt(T, b.x, b.lane);
      if (bp && b.boosted !== bp) {
        b.boosted = bp; b.zoom = 0.9; b.v = Math.max(b.v, 700);
        stats.boosts = (stats.boosts || 0) + 1;
        g.sfx('boost'); popup('Zoom!', b.x - camX, laneY(b.laneF) - 100, '#ff8c42');
        g.particles.burst(b.x - camX - 20, laneY(b.laneF) - 10, { count: 16, angle: Math.PI, spread: 0.8, colors: ['#ff8c42', '#ffd166', '#ffffff'], speed: 320, gravity: 0, size: 10, life: 0.5 });
      }
      if (b.zoom > 0) { b.zoom -= dt; top = Math.max(top, 700); }
      // into the water: SPLASH (a big one when you land in it)
      if (wet && !b.wet) {
        g.sfx('splash');
        g.particles.burst(b.x - camX, laneY(b.laneF) - 6, { count: 18, angle: -Math.PI / 2, spread: 1.6, colors: ['#4cc9f0', '#bdeeff', '#ffffff'], speed: 260, gravity: 700, size: 10, life: 0.7 });
      }
      b.wet = wet;
      if (wet && b.v > 80 && Math.random() < dt * 40) {       // spray from both wheels
        g.particles.burst(b.x - camX + (Math.random() < 0.5 ? -26 : 26), laneY(b.laneF) - 4, { count: 2, angle: -Math.PI / 2 - 0.5, spread: 1.0, colors: ['#4cc9f0', '#ffffff'], speed: 170, gravity: 600, size: 8, life: 0.5 });
      }
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
      const x0 = b.x;
      b.x += b.v * dt;
      // rolled onto the start of a loop: round we go
      const lp = loopAt(T, x0, b.x);
      if (lp) { b.loop = { f: lp, th: 0, x: lp.x }; b.queued = null; b.x = lp.x; g.sfx('boost'); }
      const hNext = groundH(T, b.x, b.lane);
      const hFly = b.h + vyGround * dt - 0.5 * G * dt * dt;
      if (b.loop) { /* (starts going round next step) */ }
      else if (hFly > hNext + 0.6 && b.v > 60) {
        b.air = true; b.h = hFly; b.vy = vyGround - G * dt; b.w = 0; b.airTime = 0;
        g.sfx('whoosh');
        if (b.queued) { startTrick(g, b.queued.kind); b.queued = null; }
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
      // tricks: Up = Superman, Down = No hands (the lane buttons do tricks in the air)
      const tr = b.trick;
      if (tr) {
        tr.t += dt * (g.little ? 1.5 : 1);
        if (!tr.done && tr.t >= TRICK_TIME) { tr.done = true; b.tricksDone = (b.tricksDone || 0) + 1; g.tone(880, 0.12, { type: 'triangle', slide: 1320, vol: 0.14 }); }
        tr.k += ((tr.done && tr.t > TRICK_TIME + 0.12 ? 0 : 1) - tr.k) * Math.min(1, dt * 14);   // into the pose, hold, back out
      }
      const kind = inp.hit('ArrowUp', 'KeyW') ? 'superman' : inp.hit('ArrowDown', 'KeyS') ? 'nohands' : null;
      // (a new trick once the last one is done; never on a tiny hop over a bump)
      if (kind && (!tr || tr.done) && (b.h - groundH(T, b.x, b.lane) > 14 || b.vy > 80)) startTrick(g, kind);
      b.x += b.v * dt;
      b.vy -= G * dt * (b.trick && !b.trick.done ? TRICK_FLOAT : 1);    // floaty while doing a trick
      b.h += b.vy * dt;
      const lean = (gas || turbo ? 1 : 0) - (brake ? 1 : 0);  // + = lean forward (nose down)
      b.w += -lean * 9 * bikeDef.lean * dt;
      b.w *= Math.exp(-3 * dt);
      const path = Math.atan2(b.vy, Math.max(80, b.v));
      if (b.bounce) { b.w = 0; b.angle += (Math.sin(b.airTime * 7) * 0.12 - b.angle) * Math.min(1, dt * 8); }   // a jelly bounce: stays level, a little wiggle
      else if (!lean) b.angle += (path - b.angle) * Math.min(1, assist * dt);
      b.angle += b.w * dt;
      b.angle = math.clamp(b.angle, -1.6, 1.6);

      const gh = groundH(T, b.x, b.lane);
      if (b.h <= gh) {
        // ---- landing! ----
        const gA = Math.atan(slopeAt(T, b.x, b.lane));
        if (g.little || b.bounce) b.angle = gA;          // little kids (Keith's bike plan #10) and jelly bounces always land flat
        const bounced = b.bounce; b.bounce = false;
        if (inSplash(T, b.x)) { g.sfx('splash'); g.particles.burst(b.x - camX, laneY(b.laneF) - 4, { count: 26, angle: -Math.PI / 2, spread: 2.2, colors: ['#4cc9f0', '#bdeeff', '#ffffff'], speed: 320, gravity: 700, size: 11, life: 0.8 }); b.wet = true; }
        if (b.trick) b.angle = gA + (b.angle - gA) * 0.3;      // (coming out of a trick the bike straightens up for the landing)
        // (landing on or just after a moving ramp is extra forgiving: it's hard to know where the ground will be)
        const nearLift = T.feats.some(f => f.move && b.x > f.x - 20 && b.x < f.end + 220);
        const rawOff = Math.abs(b.angle - gA), off = Math.max(0, rawOff - (nearLift ? 0.3 : 0));
        // tricks: finished ones = bonus; one nearly finished counts too; anything less just stops
        let trickBonus = (b.tricksDone || 0), halfTrick = false;
        if (b.trick && !b.trick.done) { if (b.trick.t >= TRICK_TIME * 0.6) trickBonus++; else halfTrick = true; }
        const sx = b.x - camX, sy = laneY(b.laneF) - gh;
        if (b.airTime > 0.9) { stats.bigAir++; popup('Big air!', sx, sy - 110, '#f15bb5'); g.achieve('bigair'); }
        b.trickLanding = !!b.trick; b.trick = null; b.tricksDone = 0;
        if (off > tol && !b.trickLanding) {
          b.crash = g.pick(0.8, 1.1, 1.4); b.vy = 420; b.h = gh; stats.crashes++; b.trick = null; shake = 0.6;
          g.sfx('crash');
          g.particles.burst(sx, sy, { count: 22, colors: [theme.dirt2, '#e6c39a', '#fff'], speed: 260, size: 12 });
          popup('Oops!', sx, sy - 100, '#ffafcc');
        } else {
          if (halfTrick && !trickBonus) { g.sfx('hit'); popup('Almost!', sx, sy - 90, '#ffd166'); }
          else if (trickBonus) {
            // landed a trick (or several): speed boost, a cheer, and confetti
            b.v = Math.min(780, b.v + 60 + 50 * trickBonus); stats.tricks = (stats.tricks || 0) + trickBonus;
            popup(trickBonus > 1 ? trickBonus + ' tricks!' : 'Trick!', sx, sy - 100, '#f15bb5');
            g.sfx('star'); cheer(g);
            g.particles.burst(sx, sy - 30, { count: 20, shape: 'star', speed: 240, size: 13, gravity: 300 });
            if (stats.tricks >= 5) g.achieve('tricky');
          }
          else if (off > tol * 0.55) { b.v *= 0.6; g.sfx('bonk'); popup('Wobble!', sx, sy - 90, '#ffd166'); }
          else if (bounced) g.sfx('land');                  // (a jelly landing: no slow-down, no "Perfect")
          else if (rawOff < 0.16 && b.airTime > 0.35) {
            b.v = Math.min(760, b.v + 70); stats.perfect++; g.sfx('star'); g.achieve('perfect'); if (stats.perfect >= 5) g.achieve('smooth');
            popup('Perfect!', sx, sy - 90, '#06d6a0');
            g.particles.burst(sx, sy - 20, { count: 14, shape: 'star', speed: 200, size: 14, gravity: 300 });
          } else { b.v *= 0.93; g.sfx('hit'); }
          g.particles.burst(sx, sy, { count: 10, angle: -Math.PI / 2, spread: 2.6, colors: [theme.dirt2, '#e6c39a'], speed: 150, size: 10 });
          b.air = false; b.h = gh; b.angle = gA; b.w = 0;
        }
      }
    }
    b.laneF += (b.lane - b.laneF) * Math.min(1, dt * 12);
    if (b.hop > 0) b.hop = Math.max(0, b.hop - dt);
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
      if (g.level && g.level.friends) { friendsFinish(g, time); return; }
      if (g.level && g.level.cup) { cupFinish(g, time); return; }
      if (g.level && g.level.daily) { ghostFinish(g, time); return; }
      const rec = g.save.levels[levelId];
      if (!rec || rec.time == null || time < rec.time) {
        g.save.data.ghosts = g.save.data.ghosts || {};
        g.save.data.ghosts[levelId] = ghostRun;
      }
      g.particles.burst(W / 2, 120, { count: 40, shape: 'star', speed: 320, size: 16 });
      const place = myPlace();
      if (place === 1 && ais.length) g.achieve('winner');
      g.finish({
        win: true, time, medal, stars: medal ? { gold: 3, silver: 2, bronze: 1 }[medal] : 0,
        title: ais.length && place === 1 ? 'You won!' : medal ? 'Finished!' : 'You made it!',
        lines: [
          ais.length ? { icon: placeIcon(place), text: ['1st', '2nd', '3rd', '4th'][place - 1] } : '',
          coinsGot ? { icon: COIN_ICON, text: String(coinsGot) } : '',
          stats.tricks ? { icon: TRICK_ICON, text: String(stats.tricks) } : '',
          'Time: ' + time.toFixed(2) + ' s',
          medal ? '' : 'Medal at ' + (par * 1.45 * slack).toFixed(1) + ' s — try turbo + cool arrows!',
          stats.perfect ? 'Perfect landings: ' + stats.perfect : '',
        ].filter(Boolean),
        next: true, delay: 1300,
      });
      setTimeout(() => checkUnlocks(g), 1500);
      // trophies
      g.achieve('finish');
      if (medal === 'gold') g.achieve('gold');
      if (levelId === 'custom') g.achieve('builder');
      if (!stats.crashes && !stats.hot) g.achieve('clean');
      setTimeout(() => {
        if (TRACKS.every(t => (g.save.levels[t.id] || {}).medal === 'gold')) g.achieve('champ');
        if (TRACKS.every(t => (g.save.levels[t.id] || {}).done)) g.achieve('tour');
      }, 1600);
    }
    // keep rolling after the finish line
    if (finished) b.v = Math.max(0, b.v - 300 * dt);
  }

  const COIN_ICON = '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="#ffc93c" stroke="#2b2b2b" stroke-width="3.5"/><circle cx="20" cy="20" r="8" fill="none" stroke="#e09f3e" stroke-width="2.5"/></svg>';
  const TRICK_ICON = '<svg viewBox="0 0 40 40"><path d="M20 4 l4.7 9.6 10.6 1.5 -7.7 7.5 1.8 10.5 -9.4 -5 -9.4 5 1.8 -10.5 -7.7 -7.5 10.6 -1.5z" fill="#f15bb5" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/></svg>';
  const placeIcon = (n) => `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="${['#ffc93c', '#c9d6df', '#e09f5a', '#ffffff'][n - 1]}" stroke="#2b2b2b" stroke-width="3.5"/><text x="20" y="27" font-size="20" font-weight="900" text-anchor="middle" fill="#2b2b2b" font-family="sans-serif">${n}</text></svg>`;
  function startTrick(g, kind) {
    bike.trick = { kind, t: 0, k: 0, done: false };
    if (bike.vy < 60) bike.vy = Math.max(bike.vy, 60);       // a little lift as the trick starts
    g.tone(520, 0.1, { type: 'triangle', slide: 900, vol: 0.15 });
  }
  // One step round a loop-de-loop, for your bike and the computer riders (o = the rider).
  // th = how far round (0 .. 2 pi). The circle's middle is LOOP_R above the start, so:
  //   x = start + R sin(th) (+ a little drift, so it comes out further along), h = R - R cos(th),
  // and the bike leans with the loop (angle = th: nose up, upside down at the top, level again).
  // Everyone gets enough speed to make it round. Returns true when the loop is done.
  function rideLoop(o, dt) {
    const L = o.loop, R = L.f.R;
    o.v = Math.max(o.v, 440);
    L.th += o.v / R * dt;
    if (L.th >= Math.PI * 2) {
      o.loop = null;
      o.x = L.f.x + LOOP_DRIFT; o.h = 0; o.angle = 0; o.air = false; o.vy = 0;
      o.v = Math.min(780, o.v + 80);           // shoots out of the loop a bit faster
      return true;
    }
    o.x = L.f.x + R * Math.sin(L.th) + LOOP_DRIFT * L.th / (Math.PI * 2);
    o.h = R - R * Math.cos(L.th);
    o.angle = L.th;
    o.wheel += o.v * dt / 14;
    return false;
  }
  const pickOk = () => ['I\'m OK!', 'Boing!', 'Whoops!', 'Back up!'][Math.floor(Math.random() * 4)];
  // the crowd cheers (a happy rising "yay")
  function cheer(g) { [523, 659, 784].forEach((f, i) => g.tone(f, 0.12, { type: 'triangle', vol: 0.12, delay: i * 0.06 })); }

  // Coins: fly through them (right lane, right height). Every 25 coins you ever collect
  // = 1 coin for your house (see house/house.js).
  function collectCoins(g) {
    const b = bike, lane = Math.round(b.laneF), mid = b.h + 30;
    for (const c of T.coins) {
      if (c.got || c.lane !== lane || Math.abs(c.x - b.x) > 26 || Math.abs(c.h - mid) > 38) continue;
      c.got = true;
      const n = c.star ? 5 : 1;
      coinsGot += n;
      shopData(g).wallet += n;                                     // coins to spend in the Bike Shop
      if (Arcade.daily) Arcade.daily.add('bike', 'coins', n);     // a "collect coins" daily surprise
      g.tone(c.star ? 1320 : 990 + (coinsGot % 6) * 60, 0.08, { type: 'square', vol: 0.1 });
      if (c.star) { g.sfx('star'); popup('+5', c.x - camX, laneY(lane) - c.h - 30, '#ffd166'); }
      g.particles.burst(c.x - camX, laneY(lane) - c.h, { count: c.star ? 14 : 5, colors: ['#ffc93c', '#fff'], speed: 120, gravity: 0, size: 8, life: 0.4, shape: c.star ? 'star' : 'circle' });
      // lifetime coins -> house coins
      const d = g.save.data;
      d.coinsAll = (d.coinsAll || 0) + n;
      while (d.coinsAll >= 25 * ((d.houseCoinsGiven || 0) + 1)) {
        d.houseCoinsGiven = (d.houseCoinsGiven || 0) + 1;
        const st = Arcade.store.load(); st.houseBonus = (st.houseBonus || 0) + 1;
        g.toast('+1 house coin!', '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19" fill="#ffc93c" stroke="#2b2b2b" stroke-width="4"/></svg>');
      }
    }
  }

  // Computer riders: the same ground-following and take-off as your bike, but they
  // always land neatly. They speed up a little when you're far ahead and ease off
  // when you're far behind, so races stay close.
  function updateAIs(g, dt) {
    for (const a of ais) stepRider(a, dt, raceTime, true);
  }
  // One computer rider, one step (dt). time = the race clock (for a.done = their finish time).
  // rubber = slow down a bit when far ahead of you / speed up when far behind (the race riders do,
  // Wisp the daily ghost doesn't: his whole ride is worked out before the start, see planWisp()).
  function stepRider(a, dt, time, rubber) {
    if (a.done && a.x > T.finish + 400) return;
    let top = 470 * a.skill;
    if (rubber) { const gap = a.x - bike.x; if (gap > 300) top *= 0.85; else if (gap < -400) top *= 1.12; }
    if (a.x >= T.finish) { if (!a.done) a.done = Math.round(time * 100) / 100; top = 120; }
    if (inFeat(T, 'mud', a.x, a.lane)) top *= 0.55;
    if (inSplash(T, a.x)) top *= 0.8;
    const bp = !a.air ? boostAt(T, a.x, a.lane) : null;
    if (bp && a.boosted !== bp) { a.boosted = bp; a.v = Math.max(a.v, 660); }   // computer riders zoom on boost pads too
    if (a.loop) { rideLoop(a, dt); return; }
    const jp = !a.air && a.v > 60 ? jellyAt(T, a.x, a.lane) : null;
    if (jp) { a.air = true; a.bounce = true; a.vy = 800; if (!a.sim) jp.squish = 0.35; }
    if (!a.air) {
      const s = slopeAt(T, a.x, a.lane);
      a.v += (a.v < top ? 320 : -220) * dt;
      a.v -= Math.sin(Math.atan(s)) * 520 * dt;
      a.v = Math.max(0, Math.min(700, a.v));
      const x0 = a.x;
      a.x += a.v * dt;
      const lp = loopAt(T, x0, a.x);
      if (lp) { a.loop = { f: lp, th: 0 }; a.x = lp.x; a.h = 0; return; }
      const hNext = groundH(T, a.x, a.lane), hFly = a.h + a.v * s * dt - 0.5 * G * dt * dt;
      if (hFly > hNext + 0.6 && a.v > 60) { a.air = true; a.h = hFly; a.vy = a.v * s - G * dt; }
      else { a.h = hNext; a.angle += (Math.atan(slopeAt(T, a.x, a.lane)) - a.angle) * Math.min(1, dt * 18); }
    } else {
      a.x += a.v * dt; a.vy -= G * dt; a.h += a.vy * dt;
      a.angle += ((a.bounce ? 0 : Math.atan2(a.vy, Math.max(80, a.v))) - a.angle) * Math.min(1, dt * 4);
      const gh = groundH(T, a.x, a.lane);
      if (a.h <= gh) { a.air = false; a.bounce = false; a.h = gh; a.angle = Math.atan(slopeAt(T, a.x, a.lane)); }
    }
    a.wheel += a.v * dt / 14;
  }
  // your place right now (1 = in front)
  const myPlace = () => 1 + ais.filter(a => (a.done && (!finished || a.done < raceTime)) || (!a.done && a.x > bike.x)).length +
    (wisp && (finished ? wisp.t < raceTime : wispAt(raceTime).x > bike.x) ? 1 : 0);      // (the Ghost Race: Wisp)

  // Friends results: everyone's animal in finish order (still riding = "…")
  function friendsFinish(g, time) {
    if (party()) party().tell({ t: 'move', x: Math.round(bike.x), h: 0, a: 0, l: bike.lane, fin: time });
    g.achieve('finish');
    setTimeout(() => {
      const all = [{ who: Arcade.profiles.active(), t: time, mine: true }]
        .concat(Object.keys(riders).map(k => ({ who: Object.assign({ pet: 'cat', color: '#4cc9f0' }, party().peers[k] || {}), t: riders[k].fin || 0 })))
        .sort((a, b) => (a.t || 1e9) - (b.t || 1e9));
      const place = all.findIndex(r => r.mine) + 1;
      const rows = all.map((r, i) => `<div style="display:flex;align-items:center;gap:10px;justify-content:center;margin:4px 0">` +
        `<span style="font-size:24px;width:44px">${i + 1}.</span><span style="width:52px;height:52px;display:inline-block;border-radius:50%;overflow:hidden;border:4px solid #2b2b2b;${r.mine ? 'box-shadow:0 0 0 4px #ffd166' : ''}">${Arcade.profiles.avatar(r.who)}</span>` +
        `<span style="font-size:22px;width:80px">${r.t ? r.t.toFixed(1) + ' s' : '…'}</span></div>`).join('');
      g.finish({
        win: true, time, stars: [3, 2, 1][place - 1] || 1, medal: ['gold', 'silver', 'bronze'][place - 1] || null,
        title: place === 1 ? 'You won!' : 'Great race!', lines: [rows], delay: 300,
        buttons: [{ icon: Arcade.icons.again, label: 'Again', cls: 'big', onClick: () => party().start(g.level.pick) },
          { icon: Arcade.net.FRIENDS_PIC, label: 'Friends', cls: 'blue', onClick: () => friendsMenu(g) }],
      });
    }, 1300);
  }

  // ---------------------------------------------------------------
  // A cup race is over: points for everyone, then the next race (or the trophy).
  // ---------------------------------------------------------------
  function cupFinish(g, time) {
    const key = g.level.cup, cup = CUPS[key];
    const c = cupNow(g, key) || newCup(g, key);
    // finish order: me + the computer riders. A rider still riding gets a guess
    // (how long the rest of the track takes at their speed), so everyone has a place.
    const order = [{ name: 'You', t: time }].concat(ais.map(a => ({
      name: a.name, t: a.done || raceTime + Math.max(0, T.finish - a.x) / Math.max(300, a.v) }))).sort((a, b) => a.t - b.t);
    order.forEach((r, i) => { c.points[r.name] = (c.points[r.name] || 0) + CUP_POINTS[i]; });
    c.last = order.map(r => r.name);
    c.race++;
    const place = order.findIndex(r => r.name === 'You') + 1;
    g.achieve('finish');
    if (place === 1) g.achieve('winner');
    if (!stats.crashes && !stats.hot) g.achieve('clean');
    g.particles.burst(W / 2, 120, { count: 40, shape: 'star', speed: 320, size: 16 });

    // ---- more races to go: the points so far, then "Next race" ----
    if (c.race < cup.list.length) {
      g.store();
      g.finish({
        win: true, delay: 1300,
        title: place === 1 ? 'You won!' : ['', '', '2nd place!', '3rd place!', 'Great race!'][place] || 'Great race!',
        lines: CANVAS ? [] : [cupTableHTML(g, c, order)],
        rows: [cupTableRow(g, c, order)],          // (the canvas menus: the table as one picture)
        buttons: [
          { icon: icons.next, label: 'Next race', cls: 'big', onClick: () => g.play(cupRace(g, key)) },
          { icon: icons.menu, label: 'Menu', cls: 'blue', onClick: () => g.menu() },
        ],
      });
      return;
    }
    // ---- the last race: who won the cup? ----
    const table = cupTable(c), rank = table.findIndex(r => r.name === 'You') + 1;
    const d = g.save.data;
    c.active = false;
    d.cupsDone = Object.assign({}, d.cupsDone, { [key]: ((d.cupsDone || {})[key] || 0) + 1 });
    const firstOpen = key === 'mini' && d.cupsDone.mini === 1;          // the Championship opens now
    if (!d.cupBest || !d.cupBest[key] || rank < d.cupBest[key]) d.cupBest = Object.assign({}, d.cupBest, { [key]: rank });
    // the first time you WIN a cup: house coins (1 for the Mini Cup, 3 for the Championship)
    let coins = 0;
    if (rank === 1) {
      d.cupWins = Object.assign({}, d.cupWins, { [key]: ((d.cupWins || {})[key] || 0) + 1 });
      if (d.cupWins[key] === 1) { coins = cup.coins; const st = Arcade.store.load(); st.houseBonus = (st.houseBonus || 0) + coins; }
      g.achieve(key === 'mini' ? 'minicup' : 'bigcup');
    }
    g.store();
    setTimeout(() => {
      if (coins) g.toast('+' + coins + ' house coin' + (coins > 1 ? 's' : '') + '!', '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19" fill="#ffc93c" stroke="#2b2b2b" stroke-width="4"/></svg>');
      if (firstOpen) g.toast('Championship cup is open!', `<svg viewBox="0 0 100 100">${cupSVG('#ffc93c', 50, 6, 1)}</svg>`);
    }, 1800);
    g.finish({
      win: true, stars: [3, 2, 1][rank - 1] || 0, delay: 1300,      // (no medal: the trophy is the prize)
      title: rank === 1 ? cup.name + ' champion!' : rank <= 3 ? cup.name + ': ' + ['', '1st', '2nd', '3rd'][rank] + '!' : 'Cup done! Nice try!',
      lines: CANVAS ? [] : [cupPodiumHTML(g, c, rank)],
      rows: [cupPodiumRow(g, c, rank)],
      buttons: [
        { icon: icons.again, label: 'New cup', cls: 'big', onClick: () => g.play(cupRace(g, key)) },
        { icon: icons.menu, label: 'Menu', cls: 'blue', onClick: () => g.menu() },
      ],
    });
  }

  // the CSS for the cup pictures (added once)
  function cupCSS() {
    if (document.getElementById('bike-cup-css')) return;
    document.head.appendChild(Arcade.h('style', { id: 'bike-cup-css' }, `
      .bk-cup { display:flex; flex-direction:column; align-items:center; gap:4px; width:100%; }
      .bk-row { display:flex; align-items:center; gap:8px; background:#fff; border:4px solid #2b2b2b; border-radius:16px; padding:2px 10px;
                width:min(360px, 92%); box-sizing:border-box; color:#2b2b2b; animation: bkIn .4s both; animation-delay: var(--d); }
      .bk-row.me { background:#fff3b0; box-shadow:0 0 0 4px #ffd166; }
      .bk-row .n { font-size:22px; font-weight:900; width:26px; }
      .bk-row svg { width:54px; height:38px; flex:none; }
      .bk-row .nm { font-size:18px; font-weight:800; width:62px; text-align:left; }
      .bk-row .bar { flex:1; height:14px; border:3px solid #2b2b2b; border-radius:8px; background:#eee; overflow:hidden; }
      .bk-row .bar i { display:block; height:100%; }
      .bk-row .pts { font-size:22px; font-weight:900; width:36px; text-align:right; }
      .bk-row .add { font-size:15px; font-weight:800; color:#06a77d; width:34px; }
      .bk-flags { display:flex; flex-wrap:wrap; justify-content:center; gap:3px; margin-top:4px; }
      .bk-flags svg { width:26px; height:26px; }
      .bk-pod { display:flex; align-items:flex-end; justify-content:center; gap:8px; }
      .bk-pod > div { color:#fff; display:flex; flex-direction:column; align-items:center; width:96px; animation: bkIn .5s both; animation-delay: var(--d); }
      .bk-pod svg.bk { width:80px; height:56px; }
      .bk-step { color:#2b2b2b; width:100%; border:4px solid #2b2b2b; border-radius:10px 10px 0 0; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; }
      .bk-step b { font-size:28px; } .bk-step span { font-size:15px; font-weight:800; }
      .bk-pod .me .bk-step { box-shadow:0 0 0 4px #ffd166; }
      .bk-pod .nm { font-size:16px; font-weight:800; }
      .bk-trophy { width:120px; height:110px; animation: bkPop .7s both .1s; }
      @keyframes bkIn { from { opacity:0; transform: translateY(14px); } }
      @keyframes bkPop { 0% { transform: scale(0) rotate(-20deg); } 70% { transform: scale(1.15) rotate(5deg); } 100% { transform: none; } }
      html.ar-phone .bk-row { padding:0 6px; } html.ar-phone .bk-row svg { width:44px; height:30px; }
      html.ar-phone .bk-trophy { width:84px; height:78px; } html.ar-phone .bk-pod > div { width:80px; }
    `));
  }
  // a little flag: checkered = that race is done, the next one bounces a bit
  const flagSVG = (done) => `<svg viewBox="0 0 40 40"><path d="M8 4 V38" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/><path d="M10 6 H34 V24 H10 Z" fill="${done ? '#fff' : '#9aa5b1'}" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/>` +
    (done ? '<path d="M10 6 h6 v6 h-6z M22 6 h6 v6 h-6z M16 12 h6 v6 h-6z M28 12 h6 v6 h-6z M10 18 h6 v6 h-6z M22 18 h6 v6 h-6z" fill="#2b2b2b"/>' : '') + '</svg>';
  // Between races: everyone's points so far (a bar each, +points from this race) and the flags.
  function cupTableHTML(g, c, order) {
    cupCSS();
    const table = cupTable(c), top = Math.max(1, table[0].pts);
    const rows = table.map((r, i) => {
      const got = CUP_POINTS[order.findIndex(o => o.name === r.name)] || 0, col = riderColor(g, r.name);
      return `<div class="bk-row${r.name === 'You' ? ' me' : ''}" style="--d:${0.2 + i * 0.15}s"><span class="n">${i + 1}</span>${bikeIcon(col)}` +
        `<span class="nm">${r.name}</span><span class="bar"><i style="width:${Math.round(r.pts / top * 100)}%;background:${col}"></i></span>` +
        `<span class="pts">${r.pts}</span><span class="add">+${got}</span></div>`;
    }).join('');
    let flags = '';
    for (let i = 0; i < CUPS[g.level.cup].list.length; i++) flags += flagSVG(i < c.race);
    return `<div class="bk-cup">${rows}<div class="bk-flags">${flags}</div></div>`;
  }
  // The end of a cup: a trophy (gold / silver / bronze by your place) and the top 3 on a podium.
  function cupPodiumHTML(g, c, rank) {
    cupCSS();
    const table = cupTable(c);
    const STEP = [{ h: 92, col: '#ffd166' }, { h: 68, col: '#dfe7ef' }, { h: 52, col: '#f4a261' }];
    const col = (i) => {
      const r = table[i]; if (!r) return '';
      return `<div class="${r.name === 'You' ? 'me' : ''}" style="--d:${0.3 + (2 - i) * 0.25}s"><span class="nm">${r.name}</span>` +
        bikeIcon(riderColor(g, r.name)).replace('<svg', '<svg class="bk"') +
        `<div class="bk-step" style="height:${STEP[i].h}px;background:${STEP[i].col}"><b>${i + 1}</b><span>${r.pts}</span></div></div>`;
    };
    const tcol = ['#ffc93c', '#cfd8e3', '#e9965a'][rank - 1] || '#bbbbbb';
    const trophy = `<svg class="bk-trophy" viewBox="0 0 120 110">${cupSVG(tcol, 60, 8, 1.05)}` +
      `<text x="60" y="${8 + 38 * 1.05}" font-size="22" font-weight="900" text-anchor="middle" fill="#2b2b2b" font-family="sans-serif">${rank <= 3 ? rank : ''}</text></svg>`;
    const mine = rank > 3 ? `<div class="bk-row me" style="--d:1s"><span class="n">${rank}</span>${bikeIcon(riderColor(g, 'You'))}<span class="nm">You</span><span class="bar"><i style="width:${Math.round(table[rank - 1].pts / Math.max(1, table[0].pts) * 100)}%;background:${riderColor(g, 'You')}"></i></span><span class="pts">${table[rank - 1].pts}</span></div>` : '';
    return `<div class="bk-cup">${trophy}<div class="bk-pod">${col(1)}${col(0)}${col(2)}</div>${mine}</div>`;
  }

  // ---- the same two pictures for the canvas menus (Nov 21): one SVG each, drawn by Phaser ----
  // (a picture inside a picture: the little bike drawing gets a spot and a size)
  const placed = (svg, x, y, w, h) => svg.replace('<svg', `<svg x="${x}" y="${y}" width="${w}" height="${h}"`);
  const T_FONT = 'font-family="Arial Black, Arial, sans-serif" font-weight="900" fill="#2b2b2b"';
  // Between races: a row per rider (place, bike, name, a bar, points, +points), the flags under them.
  function cupTableRow(g, c, order) {
    const table = cupTable(c), top = Math.max(1, table[0].pts), n = CUPS[g.level.cup].list.length;
    const RH = 50, W2 = 440;
    let out = '';
    table.forEach((r, i) => {
      const y = 4 + i * RH, me = r.name === 'You', col = riderColor(g, r.name);
      const got = CUP_POINTS[order.findIndex(o => o.name === r.name)] || 0;
      out += `<rect x="6" y="${y}" width="${W2 - 12}" height="${RH - 8}" rx="14" fill="${me ? '#fff3b0' : '#fff'}" stroke="${me ? '#ffd166' : '#2b2b2b'}" stroke-width="${me ? 8 : 4}"/>` +
        (me ? `<rect x="6" y="${y}" width="${W2 - 12}" height="${RH - 8}" rx="14" fill="none" stroke="#2b2b2b" stroke-width="3"/>` : '') +
        `<text x="28" y="${y + 31}" font-size="24" text-anchor="middle" ${T_FONT}>${i + 1}</text>` +
        placed(bikeIcon(col), 44, y + 4, 50, 34) +
        `<text x="100" y="${y + 29}" font-size="19" ${T_FONT}>${r.name}</text>` +
        `<rect x="178" y="${y + 13}" width="140" height="16" rx="8" fill="#eee" stroke="#2b2b2b" stroke-width="3"/>` +
        (r.pts ? `<rect x="180" y="${y + 15}" width="${Math.max(12, Math.round(136 * r.pts / top))}" height="12" rx="6" fill="${col}"/>` : '') +
        `<text x="366" y="${y + 31}" font-size="24" text-anchor="end" ${T_FONT}>${r.pts}</text>` +
        `<text x="374" y="${y + 29}" font-size="17" ${T_FONT.replace('#2b2b2b', '#06a77d')}>+${got}</text>`;
    });
    // the flags: checkered = done (all 10 of the Championship fit in one line)
    const fy = 8 + table.length * RH, fw = Math.min(40, (W2 - 20) / n);
    for (let i = 0; i < n; i++) out += placed(flagSVG(i < c.race), W2 / 2 - n * fw / 2 + i * fw, fy, fw, fw);
    const svg = `<svg viewBox="0 0 ${W2} ${fy + fw + 4}">${out}</svg>`;
    return { t: 'pics', items: [svg], size: 440, kind: 'cup-table', riders: table.length, flags: n, done: c.race };
  }
  // The end of a cup: the trophy on the left, the podium of the top 3 on the right (+ your place if not on it).
  function cupPodiumRow(g, c, rank) {
    const table = cupTable(c);
    const STEP = [{ h: 92, col: '#ffd166' }, { h: 68, col: '#dfe7ef' }, { h: 52, col: '#f4a261' }];
    const tcol = ['#ffc93c', '#cfd8e3', '#e9965a'][rank - 1] || '#bbbbbb';
    let out = `<g>${cupSVG(tcol, 70, 70, 1.25)}` +
      (rank <= 3 ? `<text x="70" y="${70 + 40 * 1.25}" font-size="28" text-anchor="middle" ${T_FONT}>${rank}</text>` : '') + '</g>';
    const base = 200;          // (the podium's floor)
    [1, 0, 2].forEach((i, k) => {
      const r = table[i]; if (!r) return;
      const x = 160 + k * 96, me = r.name === 'You', st = STEP[i];
      out += `<rect x="${x}" y="${base - st.h}" width="90" height="${st.h}" rx="8" fill="${st.col}" stroke="${me ? '#ffd166' : '#2b2b2b'}" stroke-width="${me ? 8 : 4}"/>` +
        (me ? `<rect x="${x}" y="${base - st.h}" width="90" height="${st.h}" rx="8" fill="none" stroke="#2b2b2b" stroke-width="3"/>` : '') +
        `<text x="${x + 45}" y="${base - st.h + 30}" font-size="28" text-anchor="middle" ${T_FONT}>${i + 1}</text>` +
        `<text x="${x + 45}" y="${base - st.h + Math.min(50, st.h - 8)}" font-size="16" text-anchor="middle" ${T_FONT}>${r.pts}</text>` +
        placed(bikeIcon(riderColor(g, r.name)), x + 10, base - st.h - 50, 70, 49) +
        `<text x="${x + 45}" y="${base - st.h - 54}" font-size="17" text-anchor="middle" ${T_FONT.replace('fill="#2b2b2b"', 'fill="#fff" stroke="#2b2b2b" stroke-width="4" paint-order="stroke"')}>${r.name}</text>`;
    });
    let hgt = base + 6;
    if (rank > 3) {         // (you, under the podium, when you weren't on it)
      const r = table[rank - 1];
      out += `<rect x="150" y="${base + 8}" width="300" height="42" rx="14" fill="#fff3b0" stroke="#2b2b2b" stroke-width="4"/>` +
        `<text x="176" y="${base + 38}" font-size="22" text-anchor="middle" ${T_FONT}>${rank}</text>` +
        placed(bikeIcon(riderColor(g, 'You')), 196, base + 12, 48, 34) +
        `<text x="254" y="${base + 37}" font-size="19" ${T_FONT}>You</text><text x="436" y="${base + 38}" font-size="22" text-anchor="end" ${T_FONT}>${r.pts}</text>`;
      hgt += 50;
    }
    const svg = `<svg viewBox="0 28 460 ${hgt - 28}">${out}</svg>`;      // (the top 28 is empty)
    return { t: 'pics', items: [svg], size: 420, kind: 'cup-podium', trophy: rank, podium: Math.min(3, table.length) };
  }

  function estimatePar() { return (T.finish - 300) / 440 + 2; }

  function follow(dt) {
    // (in a loop the camera keeps sliding gently forward instead of swinging back and forth)
    const bx = bike.loop ? bike.loop.f.x + LOOP_DRIFT * bike.loop.th / (Math.PI * 2) : bike.x;
    const target = math.clamp(bx - 300, 0, T.length - W);
    camX += (target - camX) * Math.min(1, dt * 10);
  }

  // ---------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------
  // ---------------------------------------------------------------
  // Living backgrounds (new plan point 2, Nov 22)
  // The scenery behind the grandstands is three strips painted ONCE per place into
  // hidden canvases (like Fishing and Potion Quest), so a frame only copies pictures
  // and older tablets stay smooth. Each strip is LOOP wide and joins up with itself,
  // so it can repeat forever. Far strips slide slower than near ones ("parallax"):
  //   far  = mountains / mesas / volcanoes / islands, a bit hazy  (moves 6% of the camera)
  //   mid  = hills with trees, cacti, pines, houses...            (15%)
  //   near = the near hills with bushes, rocks, umbrellas...      (30%)
  // Drawn live in front of the sky (cheap): clouds that drift by themselves, and for each
  // place a few little things floating about (FLOATERS: leaves, snowflakes, embers,
  // bubbles, birds, fireflies) + smoke puffs from the volcanoes.
  // A few tracks have a time of day (`time` in TRACKS, see TIMES): a different sky and a warm
  // or pink tint that is painted into the strips (so it costs nothing per frame).
  // Calm motion (Arcade.calm): the clouds stand still and nothing floats or twinkles.
  // ---------------------------------------------------------------
  const LOOP = 1440;                 // one strip is this wide, then it repeats
  const SEAM = 24;                   // strips are painted a little wider so the copies overlap (no hairline gaps)
  const STRIPS = [
    { id: 'far',  top: 100, sp: 0.06, haze: 0.38 },
    { id: 'mid',  top: 150, sp: 0.15, haze: 0.12 },
    { id: 'near', top: 200, sp: 0.3,  haze: 0 },
  ];
  const TIMES = {
    evening: { sky: ['#ff8a6b', '#ffd79a'], tint: 'rgba(255,120,60,0.22)', cloud: '#ffe6d2', leaf: ['#ff9f43', '#ee5a24', '#ffd166'] },
    dawn:    { sky: ['#a99bff', '#ffd6e4'], tint: 'rgba(255,140,200,0.17)', cloud: '#fff0f6' },
  };
  const FLOATERS = { meadow: 'birds', desert: 'birds', beach: 'gulls', clouds: 'birds', forest: 'leaves', jungle: 'leaves',
    snow: 'snow', volcano: 'embers', night: 'flies', candy: 'bubbles' };
  const VOLCANOES = [[330, 150], [1060, 175]];     // [x, y of the crater] in the far strip (smoke comes out there)
  let scene = null;                  // the painted strips for the place being raced: { key, k, strips }
  let timeOfDay = '';                // '' (day), 'evening' or 'dawn'
  let sceneT = null;                 // (tests and the preview: pin the scenery clock)

  const TAU = Math.PI * 2;
  const themeName = () => Object.keys(THEMES).find(n => THEMES[n] === theme) || 'meadow';
  const skyOf = () => (TIMES[timeOfDay] || {}).sky || theme.sky;

  // A bumpy ridge that joins up with itself after LOOP. bumps = how many big humps.
  function ridge(x, base, amp, bumps, ph = 0) {
    const u = x / LOOP;
    return base - amp * (0.75 * Math.abs(Math.sin(Math.PI * bumps * u + ph)) + 0.25 * Math.sin(TAU * (bumps * 2 + 1) * u + ph * 3));
  }
  // Pointy mountains (a zig-zag with soft tips)
  function peaks(x, base, amp, n, ph = 0) {
    const f = ((x / LOOP) * n + ph) % 1, tri = 1 - Math.abs(f * 2 - 1);
    return base - amp * (tri * tri * (3 - 2 * tri)) * (0.8 + 0.2 * Math.sin(TAU * (((Math.floor((x / LOOP) * n + ph) % n) + n) % n) * 0.37));
  }
  // Flat-topped mesas (desert)
  function mesas(x, base, amp, n, ph = 0) {
    const s = Math.abs(Math.sin(Math.PI * n * x / LOOP + ph));
    return base - amp * Math.min(1, Math.max(0, s * 2 - 0.55));
  }
  // Fill under a line down to the track, with a soft outline on top.
  function fillUnder(ctx, fn, color, line = 'rgba(0,0,0,0.25)', lw = 4) {
    ctx.beginPath(); ctx.moveTo(-30, TRACK_TOP + 4);
    for (let x = -30; x <= LOOP + SEAM + 30; x += 8) ctx.lineTo(x, fn(x));
    ctx.lineTo(LOOP + SEAM + 30, TRACK_TOP + 4); ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    if (line) { ctx.lineWidth = lw; ctx.strokeStyle = line; ctx.stroke(); }
  }
  // Snow caps / icing: the same shape again in white, but only above capY.
  function caps(ctx, fn, capY, color = '#ffffff') {
    ctx.save(); ctx.beginPath(); ctx.rect(-40, 0, LOOP + SEAM + 80, capY); ctx.clip();
    fillUnder(ctx, fn, color, 'rgba(0,0,0,0.18)', 3);
    ctx.restore();
  }
  // Draw a thing at x on the strip, and again one LOOP over when it pokes over an edge.
  function wrap(x, fn, reach = 120) {
    fn(x);
    if (x < reach) fn(x + LOOP);
    if (x > LOOP + SEAM - reach) fn(x - LOOP);
  }
  const SOFT = 'rgba(0,0,0,0.28)';
  function roundTree(ctx, x, y, s, crown = '#4fae5a', light = '#6cc76f') {
    ctx.lineWidth = 3; ctx.strokeStyle = SOFT;
    ctx.fillStyle = '#9a6234'; ctx.fillRect(x - 5 * s, y - 34 * s, 10 * s, 36 * s); ctx.strokeRect(x - 5 * s, y - 34 * s, 10 * s, 36 * s);
    ctx.beginPath(); ctx.arc(x, y - 50 * s, 26 * s, 0, TAU); ctx.fillStyle = crown; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 9 * s, y - 58 * s, 8 * s, 0, TAU); ctx.fillStyle = light; ctx.fill();
  }
  function pineTree(ctx, x, y, s, green = '#2f8f5b', snow = false) {
    ctx.lineWidth = 3; ctx.strokeStyle = SOFT;
    ctx.fillStyle = '#8a5a33'; ctx.fillRect(x - 4 * s, y - 14 * s, 8 * s, 16 * s);
    for (let i = 0; i < 3; i++) {
      const w = (24 - i * 6) * s, b = y - (10 + i * 16) * s;
      ctx.beginPath(); ctx.moveTo(x - w, b); ctx.lineTo(x, b - 24 * s); ctx.lineTo(x + w, b); ctx.closePath();
      ctx.fillStyle = green; ctx.fill(); ctx.stroke();
      if (snow) { ctx.beginPath(); ctx.moveTo(x - w * 0.4, b - 14 * s); ctx.lineTo(x, b - 24 * s); ctx.lineTo(x + w * 0.4, b - 14 * s); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); }
    }
  }
  function bush(ctx, x, y, s, c = '#4caf50', c2 = '#6fcf6a') {
    ctx.lineWidth = 3; ctx.strokeStyle = SOFT;
    for (const [dx, dy, r] of [[-16, -8, 13], [16, -8, 13], [0, -16, 17]]) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, TAU); ctx.fillStyle = c; ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(x - 5 * s, y - 22 * s, 5 * s, 0, TAU); ctx.fillStyle = c2; ctx.fill();
  }
  function cactus(ctx, x, y, s) {
    ctx.lineWidth = 3; ctx.strokeStyle = SOFT; ctx.fillStyle = '#4caf6a';
    const arm = (ax, ay, w, h) => { D.rr(ctx, x + ax * s, y + ay * s, w * s, h * s, 6 * s); ctx.fill(); ctx.stroke(); };
    arm(-8, -60, 16, 62); arm(-24, -44, 10, 22); arm(-24, -30, 18, 9); arm(14, -50, 10, 26); arm(6, -30, 18, 9);
  }
  function house(ctx, x, y, s, wall, roof) {
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.fillStyle = wall; ctx.fillRect(x - 20 * s, y - 28 * s, 40 * s, 30 * s); ctx.strokeRect(x - 20 * s, y - 28 * s, 40 * s, 30 * s);
    ctx.beginPath(); ctx.moveTo(x - 26 * s, y - 26 * s); ctx.lineTo(x, y - 46 * s); ctx.lineTo(x + 26 * s, y - 26 * s); ctx.closePath();
    ctx.fillStyle = roof; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffe57a'; ctx.fillRect(x - 12 * s, y - 20 * s, 9 * s, 9 * s); ctx.fillRect(x + 4 * s, y - 20 * s, 9 * s, 9 * s);   // lit windows
  }

  // How each place's three strips are painted. y is in game units (the strip's own top is cut off).
  const PAINT = {
    meadow: {
      far: (c) => { fillUnder(c, x => ridge(x, 270, 120, 3, 0.4), '#a9d6ea'); caps(c, x => ridge(x, 270, 120, 3, 0.4), 172); },
      mid: (c) => { const f = x => ridge(x, 285, 60, 4, 1.1); fillUnder(c, f, theme.hill2);
        for (const [x, s] of [[110, 0.9], [160, 0.7], [420, 1], [700, 0.8], [760, 1.05], [1040, 0.9], [1290, 0.8]]) wrap(x, x => roundTree(c, x, f(x) + 10, s)); },
      near: (c) => { const f = x => ridge(x, 312, 32, 5, 2.0); fillUnder(c, f, theme.hill);
        for (const x of [60, 330, 610, 900, 1180]) wrap(x, x => bush(c, x, f(x) + 14, 0.9));
        for (let x = 30; x < LOOP; x += 47) { const y = f(x) + 10 + (x % 3) * 6; D.circle(c, x, y, 3.5, ['#ff70a6', '#ffd166', '#ffffff'][x % 3], 0); } },
    },
    desert: {
      far: (c) => fillUnder(c, x => mesas(x, 272, 105, 3, 0.5), '#f3b98c'),
      mid: (c) => { const f = x => ridge(x, 288, 46, 3, 2.2); fillUnder(c, f, theme.hill2);
        for (const [x, s] of [[150, 0.8], [520, 1], [930, 0.75], [1260, 0.9]]) wrap(x, x => cactus(c, x, f(x) + 8, s)); },
      near: (c) => { const f = x => ridge(x, 314, 28, 4, 0.3); fillUnder(c, f, theme.hill);
        for (const [x, s] of [[90, 1], [400, 0.7], [760, 1.1], [1100, 0.8]]) wrap(x, x => { c.beginPath(); c.ellipse(x, f(x) + 10, 26 * s, 15 * s, 0, Math.PI, 0); c.closePath();
          c.fillStyle = '#b98a62'; c.fill(); c.lineWidth = 3; c.strokeStyle = SOFT; c.stroke(); });
        for (const x of [250, 600, 1340]) wrap(x, x => cactus(c, x, f(x) + 12, 0.5)); },
    },
    forest: {
      far: (c) => { const f = x => ridge(x, 262, 80, 3, 0.9); fillUnder(c, f, '#7fb9a6');
        c.fillStyle = '#7fb9a6';      // a row of little pine tips along the top = a far-away forest
        for (let i = -1; i < 68; i++) { const x = i * LOOP / 64, y = f(x) + 4, j = (i + 64) % 64;      // (64 tips: they repeat exactly after LOOP)
          c.beginPath(); c.moveTo(x - 12, y + 6); c.lineTo(x, y - 18 - (j * 7 % 9)); c.lineTo(x + 12, y + 6); c.closePath(); c.fill(); } },
      mid: (c) => { const f = x => ridge(x, 286, 56, 4, 0.2); fillUnder(c, f, theme.hill2);
        for (let x = 40; x < LOOP; x += 95) wrap(x, x => pineTree(c, x, f(x) + 10, 0.9 + (x % 4) * 0.08)); },
      near: (c) => { const f = x => ridge(x, 314, 30, 5, 1.4); fillUnder(c, f, theme.hill);
        for (const x of [120, 470, 820, 1150]) wrap(x, x => bush(c, x, f(x) + 14, 0.9, '#3f9a5c', '#5bbd76'));
        for (const x of [300, 980]) wrap(x, x => { D.box(c, x - 4, f(x) - 2, 8, 12, 3, '#fff3e0', 2.5); D.circle(c, x, f(x) - 4, 10, '#ef476f', 2.5); D.circle(c, x - 3, f(x) - 7, 2.5, '#fff', 0); }); },   // a mushroom
    },
    snow: {
      far: (c) => { const f = x => peaks(x, 280, 150, 5, 0.3); fillUnder(c, f, '#bcd3ef'); caps(c, f, 190); },
      mid: (c) => { const f = x => ridge(x, 290, 52, 4, 0.8); fillUnder(c, f, theme.hill2);
        for (let x = 60; x < LOOP; x += 120) wrap(x, x => pineTree(c, x, f(x) + 10, 0.9 + (x % 3) * 0.1, '#2f8f5b', true)); },
      near: (c) => { const f = x => ridge(x, 316, 28, 5, 2.4); fillUnder(c, f, theme.hill, 'rgba(60,90,140,0.25)');
        for (const x of [200, 650, 1100]) wrap(x, x => pineTree(c, x, f(x) + 12, 0.7, '#2f8f5b', true)); },
    },
    volcano: {
      far: (c) => {
        fillUnder(c, x => ridge(x, 280, 40, 3, 0.6), '#5d3f6e');
        for (const [vx, vy] of VOLCANOES) wrap(vx, x => {
          c.beginPath(); c.moveTo(x - 190, TRACK_TOP); c.quadraticCurveTo(x - 60, vy + 40, x - 34, vy); c.lineTo(x + 34, vy); c.quadraticCurveTo(x + 60, vy + 40, x + 190, TRACK_TOP); c.closePath();
          c.fillStyle = '#6a4a7a'; c.fill(); c.lineWidth = 4; c.strokeStyle = SOFT; c.stroke();
          c.beginPath(); c.ellipse(x, vy, 34, 8, 0, 0, TAU); c.fillStyle = '#ff9f43'; c.fill();      // the glowing crater
          c.strokeStyle = '#ff7b3a'; c.lineWidth = 5;        // two lava streaks
          for (const d of [-1, 1]) { c.beginPath(); c.moveTo(x + d * 16, vy + 4); c.quadraticCurveTo(x + d * 30, vy + 30, x + d * 58, vy + 64); c.stroke(); }
        }, 220);
      },
      mid: (c) => { const f = x => ridge(x, 292, 48, 4, 1.7); fillUnder(c, f, theme.hill2);
        for (const [x, s] of [[200, 1], [560, 0.8], [880, 1.2], [1250, 0.9]]) wrap(x, x => { c.beginPath(); c.moveTo(x - 22 * s, f(x) + 8); c.lineTo(x - 6 * s, f(x) - 30 * s); c.lineTo(x + 10 * s, f(x) - 20 * s); c.lineTo(x + 22 * s, f(x) + 8); c.closePath();
          c.fillStyle = '#4e3c52'; c.fill(); c.lineWidth = 3; c.strokeStyle = SOFT; c.stroke(); }); },
      near: (c) => { const f = x => ridge(x, 318, 26, 4, 0.9); fillUnder(c, f, theme.hill);
        c.strokeStyle = '#ff8f4a'; c.lineWidth = 4;          // glowing cracks
        for (const x0 of [100, 520, 930, 1300]) wrap(x0, x => { c.beginPath(); c.moveTo(x, f(x) + 8); c.lineTo(x + 18, f(x) + 18); c.lineTo(x + 10, f(x) + 30); c.lineTo(x + 30, f(x) + 44); c.stroke(); }); },
    },
    night: {
      far: (c) => fillUnder(c, x => ridge(x, 268, 90, 3, 1.3), '#2a3b70', 'rgba(0,0,0,0.3)'),
      mid: (c) => { const f = x => ridge(x, 290, 44, 4, 0.5); fillUnder(c, f, theme.hill2, 'rgba(0,0,0,0.3)');
        for (const [x, w, r] of [[140, '#7b8fc7', '#c0587a'], [215, '#9aa9d6', '#5a6fb0'], [620, '#8a9fd0', '#c0587a'], [1010, '#7b8fc7', '#4f8f7a'], [1075, '#9aa9d6', '#c0587a']]) wrap(x, x => house(c, x, f(x) + 8, 0.9, w, r));
        for (const x of [400, 820, 1300]) wrap(x, x => roundTree(c, x, f(x) + 10, 0.8, '#2e5a4f', '#3e6f60')); },
      near: (c) => { const f = x => ridge(x, 316, 26, 5, 1.8); fillUnder(c, f, theme.hill, 'rgba(0,0,0,0.3)');
        for (const x of [250, 700, 1150]) wrap(x, x => bush(c, x, f(x) + 14, 0.85, '#2e5a4f', '#3e6f60')); },
    },
    beach: {
      // the far strip sits on the sea's horizon (y 230): islands, a lighthouse, a sailboat
      far: (c) => {
        for (const [x, w, h] of [[260, 130, 34], [900, 180, 46], [1300, 90, 22]]) wrap(x, x => {
          c.beginPath(); c.ellipse(x, 236, w, h, 0, Math.PI, 0); c.closePath(); c.fillStyle = '#f2d78f'; c.fill(); c.lineWidth = 3; c.strokeStyle = SOFT; c.stroke();
          c.beginPath(); c.ellipse(x - w * 0.2, 236 - h * 0.7, w * 0.45, h * 0.55, 0, Math.PI, 0); c.closePath(); c.fillStyle = '#7cc576'; c.fill(); c.stroke();
        }, 200);
        wrap(960, x => {      // the lighthouse: red + white stripes, a yellow light
          for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#ef476f'; c.fillRect(x - 12 + i * 1.5, 150 + i * 16, 24 - i * 3, 16); }
          c.lineWidth = 3; c.strokeStyle = SOFT; c.strokeRect(x - 12, 150, 24, 64);
          D.box(c, x - 10, 134, 20, 16, 4, '#ffe57a', 3); c.beginPath(); c.moveTo(x - 14, 136); c.lineTo(x, 122); c.lineTo(x + 14, 136); c.closePath(); c.fillStyle = '#ef476f'; c.fill(); c.stroke();
        }, 60);
        wrap(560, x => {      // a little sailboat
          c.beginPath(); c.moveTo(x - 26, 222); c.lineTo(x + 26, 222); c.lineTo(x + 18, 232); c.lineTo(x - 18, 232); c.closePath(); c.fillStyle = '#ef476f'; c.fill(); c.lineWidth = 3; c.strokeStyle = SOFT; c.stroke();
          c.beginPath(); c.moveTo(x, 220); c.lineTo(x, 176); c.lineTo(x + 22, 216); c.closePath(); c.fillStyle = '#fff'; c.fill(); c.stroke();
        }, 60);
      },
      near: (c) => { const f = x => ridge(x, 302, 22, 4, 0.7); fillUnder(c, f, theme.hill);
        for (const [x, col] of [[180, '#ef476f'], [640, '#118ab2'], [1080, '#ffd166']]) wrap(x, x => {     // beach umbrellas
          const y = f(x) + 6; c.lineWidth = 4; c.strokeStyle = '#8a5a33'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 6, y - 50); c.stroke();
          c.beginPath(); c.moveTo(x - 30, y - 42); c.quadraticCurveTo(x + 6, y - 82, x + 42, y - 52); c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = 3; c.strokeStyle = SOFT; c.stroke();
          c.beginPath(); c.moveTo(x + 6, y - 66); c.lineTo(x - 6, y - 46); c.lineTo(x + 18, y - 48); c.closePath(); c.fillStyle = '#fff'; c.fill();
        });
        for (let x = 50; x < LOOP; x += 160) wrap(x, x => D.circle(c, x, f(x) + 14, 4, '#ffffff', 0)); },
    },
    candy: {
      far: (c) => { const f = x => ridge(x, 272, 120, 3, 1.9); fillUnder(c, f, '#ffc7e6'); caps(c, f, 186, '#fff7fb'); },
      mid: (c) => { const f = x => ridge(x, 290, 50, 4, 0.4); fillUnder(c, f, theme.hill2);
        for (const [x, col] of [[130, '#70d6ff'], [380, '#ffd670'], [700, '#ff70a6'], [960, '#7ee081'], [1240, '#ffd670']]) wrap(x, x => {     // gumdrops
          const y = f(x) + 8; c.beginPath(); c.moveTo(x - 24, y); c.quadraticCurveTo(x - 24, y - 40, x, y - 40); c.quadraticCurveTo(x + 24, y - 40, x + 24, y); c.closePath();
          c.fillStyle = col; c.fill(); c.lineWidth = 3; c.strokeStyle = SOFT; c.stroke();
          for (const [dx, dy] of [[-8, -26], [7, -30], [12, -14], [-12, -12]]) D.circle(c, x + dx, y + dy, 2.5, '#fff', 0);
        }); },
      near: (c) => { const f = x => ridge(x, 316, 26, 5, 1.1); fillUnder(c, f, theme.hill);
        for (const x of [90, 520, 980, 1300]) wrap(x, x => {      // peppermints, half in the ground
          const y = f(x) + 16; D.circle(c, x, y, 18, '#ffffff', 3);
          c.fillStyle = '#ef476f'; for (let i = 0; i < 6; i += 2) { c.beginPath(); c.moveTo(x, y); c.arc(x, y, 15, i * Math.PI / 3, (i + 1) * Math.PI / 3); c.closePath(); c.fill(); }
        }); },
    },
    jungle: {
      far: (c) => fillUnder(c, x => ridge(x, 276, 150, 4, 0.2), '#6fc49a'),
      mid: (c) => { const f = x => ridge(x, 288, 54, 4, 1.6); fillUnder(c, f, theme.hill2);
        for (let x = 30; x < LOOP; x += 80) wrap(x, x => roundTree(c, x, f(x) + 12, 0.8 + (x % 5) * 0.06, '#2f9e57', '#4cbb6f')); },
      near: (c) => { const f = x => ridge(x, 316, 26, 5, 0.6); fillUnder(c, f, theme.hill);
        for (const x of [80, 380, 700, 1010, 1320]) wrap(x, x => {      // ferns: a fan of leaves
          const y = f(x) + 12;
          for (const a of [-2.6, -2.1, -1.57, -1.05, -0.55]) { c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.ellipse(22, 0, 24, 7, 0, 0, TAU);
            c.fillStyle = '#2e8b4a'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = SOFT; c.stroke(); c.restore(); }
        }); },
    },
    clouds: {
      // far: a castle on a cloud; mid + near: puffy cloud banks
      far: (c) => {
        wrap(720, x => {
          for (const [dx, r] of [[-120, 40], [-60, 54], [0, 62], [70, 50], [130, 38]]) D.circle(c, x + dx, 250, r, '#f2f0ff', 0);
          c.lineWidth = 3; c.strokeStyle = SOFT;
          for (const [dx, w, h] of [[-70, 34, 90], [70, 34, 90], [0, 60, 120]]) {
            c.fillStyle = '#e8ddff'; c.fillRect(x + dx - w / 2, 220 - h, w, h); c.strokeRect(x + dx - w / 2, 220 - h, w, h);
            c.beginPath(); c.moveTo(x + dx - w / 2 - 6, 220 - h); c.lineTo(x + dx, 220 - h - 40); c.lineTo(x + dx + w / 2 + 6, 220 - h); c.closePath(); c.fillStyle = '#ff9ecf'; c.fill(); c.stroke();
            c.fillStyle = '#ffe08a'; c.fillRect(x + dx - 6, 220 - h + 22, 12, 16);
          }
        }, 220);
      },
      mid: (c) => { fillUnder(c, x => 268 + 10 * Math.sin(TAU * 5 * x / LOOP), '#eef0ff', null);
        for (let x = 0; x < LOOP; x += 60) wrap(x, x => D.circle(c, x, 268, 34 + (x * 13 % 18), '#eef0ff', 0)); },
      near: (c) => { fillUnder(c, x => 314, '#ffffff', null);
        c.lineWidth = 3; c.strokeStyle = 'rgba(120,110,200,0.3)';
        for (let x = 0; x < LOOP; x += 70) wrap(x, x => { c.beginPath(); c.arc(x, 316, 30 + (x * 7 % 14), Math.PI, 0); c.fillStyle = '#ffffff'; c.fill(); c.stroke(); }); },
    },
  };

  // Paint the strips for the place being raced (once; again only if the screen's sharpness changes).
  function sceneFor(ctx) {
    const a = ctx.getTransform ? Math.abs(ctx.getTransform().a) : 1;
    const k = Math.max(0.5, Math.min(2, Math.round(a * 2) / 2));       // real pixels per game unit, in halves
    const key = themeName() + '|' + timeOfDay + '|' + k;
    if (!scene || scene.key !== key) scene = paintScene(key, k);
    return scene;
  }
  function paintScene(key, k) {
    const [name] = key.split('|'), tm = TIMES[timeOfDay];
    const strips = [];
    for (const s of STRIPS) {
      const paint = PAINT[name] && PAINT[name][s.id];
      if (!paint) continue;
      const c = document.createElement('canvas');
      c.width = Math.ceil((LOOP + SEAM) * k); c.height = Math.ceil((TRACK_TOP - s.top) * k);
      const x = c.getContext('2d');
      x.scale(k, k); x.translate(0, -s.top); x.lineJoin = 'round'; x.lineCap = 'round';
      paint(x);
      // far things take on a bit of the sky's color (haze), then the time-of-day tint, only where something is painted
      x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-atop';
      if (s.haze) { x.globalAlpha = s.haze; x.fillStyle = skyOf()[1]; x.fillRect(0, 0, c.width, c.height); x.globalAlpha = 1; }
      if (tm) { x.fillStyle = tm.tint; x.fillRect(0, 0, c.width, c.height); }
      strips.push({ id: s.id, c, top: s.top, sp: s.sp });
    }
    return { key, k, strips };
  }
  // Copy one strip onto the screen, repeated, slid by the camera.
  function drawStrip(ctx, s) {
    const h = TRACK_TOP - s.top, o = ((camX * s.sp) % LOOP + LOOP) % LOOP;
    for (let x = -o; x < W; x += LOOP) ctx.drawImage(s.c, x, s.top, LOOP + SEAM, h);
  }
  // Clouds drifting by (slowly by themselves, and a little with the camera)
  function drawClouds(ctx, t) {
    const name = themeName();
    if (name === 'night' || name === 'volcano' || name === 'clouds') return;
    const col = (TIMES[timeOfDay] || {}).cloud || (name === 'candy' ? '#fff0fa' : '#ffffff');
    const span = W + 340;
    for (const [x0, y, s, v] of [[80, 70, 1, 7], [430, 120, 0.75, 5], [760, 60, 0.9, 6], [1080, 140, 0.6, 4]]) {
      const x = ((x0 + t * v - camX * 0.04) % span + span) % span - 170;
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      // (puffs: every round bit gets a soft outline first, then all are filled, so only the outside edge shows)
      const puffs = [[-34, 8, 22], [-8, -10, 30], [26, -4, 26], [44, 10, 18], [6, 12, 22]];
      ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(43,43,43,0.2)';
      for (const [px, py, r] of puffs) { ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = col;
      for (const [px, py, r] of puffs) { ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
  }
  // Little things floating about: n of them, each worked out from the clock (nothing to keep track of).
  function drawFloaters(ctx, t, n) {
    const kind = FLOATERS[themeName()], md = (a, m) => ((a % m) + m) % m;
    if (kind === 'leaves' || kind === 'snow') {
      const cols = kind === 'snow' ? ['#ffffff'] : (TIMES[timeOfDay] || {}).leaf || ['#4caf50', '#7ed957', '#2f9e57'];
      for (let i = 0; i < n; i++) {
        const fall = kind === 'snow' ? 26 + (i % 4) * 7 : 34 + (i % 3) * 10;
        const x = md(i * 211 + t * (kind === 'snow' ? 10 : 22) - camX * (0.35 + (i % 3) * 0.1) + Math.sin(t * 1.3 + i) * 24, W + 60) - 30;
        const y = md(i * 97 + t * fall, TRACK_TOP + 30) - 20;
        if (kind === 'snow') { D.circle(ctx, x, y, 3 + (i % 3) * 1.5, '#ffffff', 0); continue; }
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 2 + i) * 0.9);
        ctx.beginPath(); ctx.ellipse(0, 0, 9, 4.5, 0, 0, TAU); ctx.fillStyle = cols[i % cols.length]; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.stroke(); ctx.restore();
      }
    } else if (kind === 'embers') {
      for (let i = 0; i < n; i++) {
        const x = md(i * 173 + Math.sin(t + i) * 20 - camX * 0.4, W + 40) - 20, y = TRACK_TOP - md(i * 61 + t * (24 + (i % 4) * 8), 300);
        ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(t * 3 + i));
        D.circle(ctx, x, y, 3 + (i % 2), i % 3 ? '#ffb347' : '#ffe57a', 0);
      }
      ctx.globalAlpha = 1;
    } else if (kind === 'flies') {
      for (let i = 0; i < n; i++) {
        const x = md(i * 137 + Math.sin(t * 0.7 + i) * 40 - camX * 0.35, W + 40) - 20, y = 190 + (i * 53) % 110 + Math.cos(t * 0.9 + i * 2) * 18;
        const a = 0.3 + 0.7 * Math.max(0, Math.sin(t * 2.2 + i * 1.7));
        ctx.globalAlpha = a * 0.35; D.circle(ctx, x, y, 9, '#fff3a8', 0);
        ctx.globalAlpha = a; D.circle(ctx, x, y, 3, '#fff7c2', 0);
      }
      ctx.globalAlpha = 1;
    } else if (kind === 'bubbles') {
      for (let i = 0; i < n; i++) {
        const x = md(i * 157 + Math.sin(t * 0.8 + i) * 26 - camX * 0.3, W + 60) - 30, y = TRACK_TOP + 10 - md(i * 71 + t * (18 + (i % 3) * 6), 360);
        const r = 7 + (i % 3) * 3;
        ctx.globalAlpha = 0.75; D.circle(ctx, x, y, r, ['#ffe0f2', '#e0f4ff', '#fff6d6'][i % 3], 2);
        ctx.globalAlpha = 1; D.circle(ctx, x - r * 0.35, y - r * 0.35, r * 0.25, '#ffffff', 0);
      }
    } else if (kind === 'birds' || kind === 'gulls') {
      ctx.lineWidth = 3.5; ctx.strokeStyle = kind === 'gulls' ? '#ffffff' : 'rgba(43,43,43,0.7)';
      for (let i = 0; i < Math.min(4, n); i++) {
        const x = md(i * 330 + t * (34 + i * 6) - camX * 0.1, W + 200) - 100, y = 70 + i * 28 + Math.sin(t * 1.5 + i) * 8;
        const f = Math.sin(t * 7 + i * 2) * 6;
        ctx.beginPath(); ctx.moveTo(x - 12, y - f); ctx.quadraticCurveTo(x - 6, y - 6 - f * 0.4, x, y); ctx.quadraticCurveTo(x + 6, y - 6 - f * 0.4, x + 12, y - f); ctx.stroke();
      }
    }
  }
  // Volcano smoke: soft puffs rising out of the far craters (they move with the far strip)
  function drawSmoke(ctx, t) {
    const o = camX * 0.06;
    for (const [vx, vy] of VOLCANOES) for (let rep = -1; rep <= 1; rep++) {
      const x0 = vx + rep * LOOP - (((o % LOOP) + LOOP) % LOOP);
      if (x0 < -150 || x0 > W + 150) continue;
      for (let i = 0; i < 4; i++) {
        const p = ((t * 0.18 + i / 4) % 1);
        ctx.globalAlpha = 0.45 * (1 - p);
        D.circle(ctx, x0 + p * 50 + Math.sin(t + i) * 6, vy - 10 - p * 90, 14 + p * 26, '#b9a8c4', 0);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawBg(ctx, g) {
    const calm = Arcade.calm();
    // the scenery clock: stands still in Calm motion
    const t = sceneT != null ? sceneT : calm ? 0 : performance.now() / 1000;
    const skyC = skyOf();
    const sky = ctx.createLinearGradient(0, 0, 0, TRACK_TOP);
    sky.addColorStop(0, skyC[0]); sky.addColorStop(1, skyC[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // night: twinkly stars and a moon
    if (theme.dark) {
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 263 - camX * 0.05) % W + W) % W, sy = 20 + (i * 97) % 200;
        ctx.globalAlpha = calm ? 0.8 : 0.5 + 0.5 * Math.abs(Math.sin(t * 1.7 + i));
        D.star(ctx, sx, sy, 3 + (i % 3), '#fff7c2', 0);
      }
      ctx.globalAlpha = 1;
      D.circle(ctx, 820, 90, 34, '#fff7c2', 4);
      D.circle(ctx, 834, 80, 29, skyC[0], 0);       // (a bite out of it = a crescent moon)
    }
    // big clouds drifting by (Cloud Castle), other places get smaller ones
    if (theme.deco === 'cloud') {
      for (let i = -1; i < 4; i++) {
        const cx = ((i * 340 + t * 6 - camX * 0.08) % 1360 + 1360) % 1360 - 200, cy = 70 + (i & 1) * 60;
        for (const [dx, dy, r] of [[0, 0, 30], [34, -12, 38], [72, 0, 30]]) D.circle(ctx, cx + dx, cy + dy, r, '#ffffff', 0);
      }
    }
    drawClouds(ctx, t);
    // the sea (Splash Beach): flat blue water with little white waves
    if (theme.sea) {
      ctx.fillStyle = '#2fb5e8'; ctx.fillRect(0, 230, W, H - 230);
      ctx.lineWidth = 4; ctx.strokeStyle = '#2b2b2b'; ctx.beginPath(); ctx.moveTo(0, 230); ctx.lineTo(W, 230); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3;
      for (let r = 0; r < 3; r++) for (let x = -((camX * (0.1 + r * 0.04) + t * (8 + r * 4)) % 120); x < W; x += 120) {
        const y = 248 + r * 20; ctx.beginPath(); ctx.arc(x + (r * 40) + 12, y, 10, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      }
    }
    // the painted scenery: far, middle and near strips (living backgrounds, see above)
    const sc = sceneFor(ctx);
    for (const st of sc.strips) {
      drawStrip(ctx, st);
      if (st.id === 'far' && theme === THEMES.volcano) drawSmoke(ctx, t);
    }
    // little things floating about (none in Calm motion; fewer on slow devices)
    if (!calm) drawFloaters(ctx, t, g && g.lite && g.lite() ? 7 : 14);

    // palm trees / lollipops / jungle trees behind the grandstands
    if (theme.deco && theme.deco !== 'cloud') {
      const dsp = 0.45, dw = 300;
      for (let i = Math.floor(camX * dsp / dw) - 1; i < Math.floor((camX * dsp + W) / dw) + 2; i++) drawDeco(ctx, i * dw - camX * dsp + (i % 2) * 70, i);
    }
    // grandstands with a cheering crowd
    const sp = 0.6, sw = 360;
    for (let i = Math.floor(camX * sp / sw) - 1; i < Math.floor((camX * sp + W) / sw) + 1; i++) {
      const x = i * sw - camX * sp;
      if (i % 3 === 2) continue; // gaps between stands
      D.box(ctx, x + 10, 300, sw - 40, 62, 8, '#fff', 4);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 15; c++) {
        const hue = ((i * 31 + r * 7 + c * 13) * 47) % 360;
        const bob = calm ? 0 : Math.sin(performance.now() / 180 + c + r * 2 + i) * (finished ? 4 : 1.5);
        ctx.fillStyle = `hsl(${hue} 75% 62%)`;
        ctx.beginPath(); ctx.arc(x + 28 + c * 20, 316 + r * 16 + bob, 6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#ef476f'; ctx.fillRect(x + 10, 292, sw - 40, 10);
      ctx.lineWidth = 4; ctx.strokeStyle = '#2b2b2b'; ctx.strokeRect(x + 10, 292, sw - 40, 10);
    }
    // fence
    ctx.fillStyle = '#fff'; ctx.fillRect(0, TRACK_TOP - 12, W, 8);
    for (let x = -((camX) % 40); x < W; x += 40) ctx.fillRect(x, TRACK_TOP - 20, 6, 20);
    // night: street lamps along the fence (their light is cut out of the dark in drawNight)
    if (theme.dark) for (let x = -((camX) % LAMP_GAP); x < W + LAMP_GAP; x += LAMP_GAP) {
      ctx.fillStyle = '#2b2b2b'; ctx.fillRect(x - 4, TRACK_TOP - 150, 8, 140);
      ctx.fillRect(x - 4, TRACK_TOP - 150, 34, 8);
      D.circle(ctx, x + 30, TRACK_TOP - 136, 12, '#fff3a8', 4);
    }
  }
  const LAMP_GAP = 420;

  // One background picture (i = which one, so they're not all the same).
  function drawDeco(ctx, x, i) {
    const k = ((i % 3) + 3) % 3;
    ctx.lineWidth = 4; ctx.strokeStyle = '#2b2b2b'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (theme.deco === 'palm') {
      // a bendy trunk and five big leaves
      ctx.beginPath(); ctx.moveTo(x, 310); ctx.quadraticCurveTo(x + 6, 240, x + 26, 196);
      ctx.lineWidth = 14; ctx.strokeStyle = '#2b2b2b'; ctx.stroke(); ctx.lineWidth = 8; ctx.strokeStyle = '#b5834f'; ctx.stroke();
      for (const a of [-2.7, -2.1, -1.5, -0.9, -0.3]) {
        ctx.save(); ctx.translate(x + 26, 196); ctx.rotate(a);
        ctx.beginPath(); ctx.ellipse(34, 0, 36, 11, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#3fbf6a'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#2b2b2b'; ctx.stroke(); ctx.restore();
      }
      D.circle(ctx, x + 22, 204, 7, '#8a5a33', 3); D.circle(ctx, x + 32, 206, 7, '#8a5a33', 3);
    } else if (theme.deco === 'lolly') {
      // giant lollipops with a swirl
      const h = 200 + k * 20, c = ['#ff70a6', '#70d6ff', '#ffd670'][k];
      ctx.fillStyle = '#fff'; ctx.fillRect(x - 5, h, 10, 310 - h); ctx.strokeRect(x - 5, h, 10, 310 - h);
      D.circle(ctx, x, h, 34, c, 4);
      ctx.beginPath(); for (let t = 0; t < 14; t += 0.2) { const r = t * 2.2; ctx.lineTo(x + Math.cos(t) * r, h + Math.sin(t) * r); }
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.stroke();
    } else if (theme.deco === 'tree') {
      // a big jungle tree: a trunk and three round leafy blobs, sometimes a hanging vine
      ctx.fillStyle = '#7a4f2c'; ctx.fillRect(x - 9, 230, 18, 80); ctx.strokeRect(x - 9, 230, 18, 80);
      for (const [dx, dy, r] of [[-30, 220, 32], [30, 220, 32], [0, 192, 40]]) D.circle(ctx, x + dx, dy, r, k === 1 ? '#2f9e57' : '#45b36a', 4);
      if (k !== 2) { ctx.beginPath(); ctx.moveTo(x + 40, 228); ctx.quadraticCurveTo(x + 48, 260, x + 40, 290); ctx.strokeStyle = '#2f7a43'; ctx.lineWidth = 4; ctx.stroke(); }
    }
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
      } else if (f.kind === 'boost') {
        // a boost pad: an orange strip with yellow chevrons that glow one after the other
        const y = laneY(f.lane), t = performance.now() / 120;
        D.box(ctx, x0, y - 14, x1 - x0, 28, 12, '#ff8c42', 4);
        for (let i = 0, x = x0 + 14; x < x1 - 26; x += 26, i++) {
          const lit = Math.floor(t) % 4 === i % 4;
          ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x + 12, y); ctx.lineTo(x, y + 9); ctx.lineTo(x + 6, y);
          ctx.closePath(); ctx.fillStyle = lit ? '#ffffff' : '#ffd166'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#2b2b2b'; ctx.stroke();
        }
      } else if (f.kind === 'splash') {
        // shallow water right across the track, with little waves and shiny bits
        const t = performance.now() / 300;
        ctx.fillStyle = '#4cc9f0'; D.rr(ctx, x0, TRACK_TOP + 4, x1 - x0, TRACK_BOT - TRACK_TOP - 8, 26); ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = '#2b2b2b'; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3;
        for (let l = 0; l < 4; l++) for (let x = x0 + 30 + (l % 2) * 30; x < x1 - 40; x += 70) {
          const y = laneY(l) - 4 + Math.sin(t + x * 0.05 + l) * 2;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 8, y - 6, x + 16, y); ctx.quadraticCurveTo(x + 24, y + 6, x + 32, y); ctx.stroke();
        }
      } else if (f.kind === 'jelly') {
        // a wobbly pink jelly pad: it squashes down when someone bounces off it
        const y = laneY(f.lane), sq = f.squish > 0 ? Math.sin(f.squish / 0.35 * Math.PI * 3) * 6 : 0;
        const hh = 16 - sq;
        D.box(ctx, x0, y - hh + 2, x1 - x0, hh + 8, 10, '#ff70a6', 4);
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; D.rr(ctx, x0 + 12, y - hh + 6, (x1 - x0) * 0.4, 5, 3); ctx.fill();
      } else if (f.kind === 'loop') {
        drawLoop(ctx, f);
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
        const k = f.move ? liftK(f) : 1;
        if (f.move) {
          // a moving ramp sits on two big springs, so you can see it go up and down
          for (const sx of [f.pts[1][0], f.pts[2][0]]) {
            const x = sx - camX, hgt = f.pts[1][1] * k;
            ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 9; ctx.beginPath();
            for (let j = 0; j <= 8; j++) ctx.lineTo(x + (j % 2 ? 10 : -10), bot - hgt * j / 8);
            ctx.stroke(); ctx.strokeStyle = '#ff8c42'; ctx.lineWidth = 4; ctx.stroke();
          }
          ctx.lineWidth = 4; ctx.strokeStyle = '#2b2b2b';
        }
        for (let i = 1; i < f.pts.length; i++) {
          const [ax, ah0] = f.pts[i - 1], [bx, bh0] = f.pts[i];
          const ah = ah0 * k, bh = bh0 * k;
          if (ah === 0 && bh === 0) continue;
          const x1 = ax - camX, x2 = bx - camX;
          ctx.beginPath();
          ctx.moveTo(x1, top - ah); ctx.lineTo(x2, top - bh); ctx.lineTo(x2, bot - bh); ctx.lineTo(x1, bot - ah); ctx.closePath();
          ctx.fillStyle = bh > ah ? theme.ramp : bh < ah ? theme.face : shade(theme.ramp);
          ctx.fill(); ctx.stroke();
          // front face of this piece (a moving ramp is a floating plank, so only its edge)
          ctx.beginPath();
          const fb = f.move ? Math.min(14, Math.max(ah, bh)) : 0;
          if (f.move) { ctx.moveTo(x1, bot - ah); ctx.lineTo(x2, bot - bh); ctx.lineTo(x2, bot - bh + fb); ctx.lineTo(x1, bot - ah + fb); }
          else { ctx.moveTo(x1, bot - ah); ctx.lineTo(x2, bot - bh); ctx.lineTo(x2, bot); ctx.lineTo(x1, bot); }
          ctx.closePath();
          ctx.fillStyle = f.move ? '#ff8c42' : '#7a4a2a'; ctx.fill(); ctx.stroke();
        }
      }
    }
  }

  // A loop-de-loop: a wide ring standing across the whole track (from the back lane to
  // the front lane), drawn as a band along the exact path the bikes ride (see rideLoop).
  function drawLoop(ctx, f) {
    const path = (dy, out) => {
      ctx.beginPath();
      for (let i = 0; i <= 64; i++) {
        const th = i / 64 * Math.PI * 2, R = f.R + out;
        ctx.lineTo(f.x - camX + R * Math.sin(th) + LOOP_DRIFT * th / (Math.PI * 2), dy - (f.R - R * Math.cos(th)));   // (out = a bit outside the wheels)
      }
    };
    // supports first, then the band: back edge -> front edge
    ctx.lineCap = 'round';
    const sx = f.x - camX + LOOP_DRIFT / 2;
    ctx.fillStyle = '#7a4a2a'; ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 4;
    for (const dx of [-f.R - 10, f.R + 10]) { ctx.fillRect(sx + dx - 6, laneY(0) - f.R - 10, 12, f.R + 10); ctx.strokeRect(sx + dx - 6, laneY(0) - f.R - 10, 12, f.R + 10); }
    const y0 = laneY(0) - 14, y1 = laneY(3) + 14;
    for (let y = y0; y <= y1; y += 5) { path(y, 8); ctx.strokeStyle = y < y0 + 6 || y > y1 - 6 ? '#2b2b2b' : theme.ramp; ctx.lineWidth = y < y0 + 6 || y > y1 - 6 ? 5 : 7; ctx.stroke(); }
    // stripes so you can see it's a road going round
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3; ctx.setLineDash([18, 20]);
    path((y0 + y1) / 2, 8); ctx.stroke(); ctx.setLineDash([]);
  }

  // Night Lights: the whole picture is covered with see-through dark blue, and holes are
  // cut into it (on a hidden canvas) where the street lamps and your headlight shine.
  // Coins and riders under a lamp light up. (Little kids get a lighter night.)
  let nightCv = null;
  function drawNight(ctx) {
    if (!nightCv) { nightCv = document.createElement('canvas'); nightCv.width = W / 2; nightCv.height = H / 2; }   // (half size: it's only soft light)
    const n = nightCv.getContext('2d');
    n.setTransform(0.5, 0, 0, 0.5, 0, 0);
    n.globalCompositeOperation = 'source-over';
    n.clearRect(0, 0, W, H);
    n.fillStyle = Arcade.profiles.little() ? 'rgba(8,14,46,0.42)' : 'rgba(8,14,46,0.58)';
    n.fillRect(0, 0, W, H);
    n.globalCompositeOperation = 'destination-out';
    const glow = (x, y, r) => {
      const gr = n.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      n.fillStyle = gr; n.beginPath(); n.arc(x, y, r, 0, Math.PI * 2); n.fill();
    };
    // street lamps: a pool of light on the track under each one, and the bulb itself
    for (let x = -((camX) % LAMP_GAP); x < W + LAMP_GAP; x += LAMP_GAP) {
      glow(x + 30, TRACK_TOP - 136, 40);
      n.save(); n.translate(x + 30, (TRACK_TOP + TRACK_BOT) / 2); n.scale(1.6, 0.75); glow(0, 0, 130); n.restore();
    }
    // your headlight: a soft cone in front of the bike, pointing where the bike points
    const b = bike, hx = b.x - camX, hy = laneY(b.laneF) - b.h - 30;
    n.save(); n.translate(hx, hy); n.rotate(-b.angle);
    const gr = n.createRadialGradient(0, 0, 10, 0, 0, 340);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    n.fillStyle = gr; n.beginPath(); n.moveTo(10, -8); n.lineTo(340, -110); n.lineTo(340, 110); n.lineTo(10, 26); n.closePath(); n.fill();
    n.restore();
    glow(hx, hy + 10, 70);                                         // (and a little light around you)
    for (const a of ais) glow(a.x - camX, laneY(a.laneF) - a.h - 30, 60);   // the other riders have lights too
    ctx.drawImage(nightCv, 0, 0, W, H);
    // the lamp bulbs and your headlight glow on top of the dark
    ctx.globalCompositeOperation = 'lighter';
    for (let x = -((camX) % LAMP_GAP); x < W + LAMP_GAP; x += LAMP_GAP) { ctx.fillStyle = 'rgba(255,240,150,0.25)'; ctx.beginPath(); ctx.arc(x + 30, TRACK_TOP - 136, 26, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
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
    if (opts.flames) {                         // Bike Shop: flames painted on the tank
      ctx.save(); D.rr(ctx, -16, -32, 30, 12, 6); ctx.clip();
      // flame tongues from the front of the tank, licking back (orange, then a smaller yellow one inside)
      for (const [col, k] of [['#ff8c42', 1], ['#ffd166', 0.62]]) {
        const X = (x) => 15 - (15 - x) * k, Y = (y) => -20 - (-20 - y) * (0.6 + 0.4 * k);
        ctx.beginPath(); ctx.moveTo(15, Y(-32));
        ctx.quadraticCurveTo(X(4), Y(-32), X(-4), Y(-30));      // tongue 1 (top, longest)
        ctx.quadraticCurveTo(X(4), Y(-28), X(7), Y(-27.5));
        ctx.quadraticCurveTo(X(0), Y(-27), X(-9), Y(-25));      // tongue 2
        ctx.quadraticCurveTo(X(1), Y(-24), X(4), Y(-23));
        ctx.quadraticCurveTo(X(-1), Y(-22), X(-6), Y(-20));     // tongue 3 (bottom)
        ctx.lineTo(15, -20); ctx.closePath();
        ctx.fillStyle = col; ctx.fill();
        if (k === 1) { ctx.lineWidth = 1.5; ctx.strokeStyle = '#2b2b2b'; ctx.stroke(); }
      }
      ctx.restore();
      D.rr(ctx, -16, -32, 30, 12, 6); ctx.lineWidth = L; ctx.strokeStyle = '#2b2b2b'; ctx.stroke();
    }
    D.rr(ctx, -20, -34, 16, 6, 3); ctx.fillStyle = '#2b2b2b'; ctx.fill(); // seat
    // The rider is drawn from a few points (hip, shoulder, head, hands, knee, foot).
    // A trick smoothly blends the normal riding pose into the trick pose (k = 0..1):
    //   Superman = flies out flat behind the bike, hands still on the bars
    //   No hands = sits up tall with both arms in the air
    const lean = opts.lean || 0;
    const ride = { hip: [-8, -32], sh: [lean * 7, -46 + Math.abs(lean) * 3], head: [4 + lean * 7, -58 + Math.abs(lean) * 3],
      hand: [16, -37], hand2: [16, -37], knee: [2, -22], foot: [0, -16] };
    const POSES = {
      superman: { hip: [-34, -46], sh: [2, -44], head: [14, -48], hand: [16, -37], hand2: [16, -37], knee: [-50, -48], foot: [-66, -50] },
      nohands:  { hip: [-8, -32], sh: [-4, -50], head: [-2, -64], hand: [-18, -80], hand2: [12, -80], knee: [2, -22], foot: [0, -16] },
    };
    const t = opts.trick, k = t ? t.k * t.k * (3 - 2 * t.k) : 0;          // (eased: starts and ends gently)
    const P = {};
    for (const key in ride) P[key] = t ? [ride[key][0] + (POSES[t.kind][key][0] - ride[key][0]) * k, ride[key][1] + (POSES[t.kind][key][1] - ride[key][1]) * k] : ride[key];
    const line = (pts, w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(...pts[0]); for (const q of pts.slice(1)) ctx.lineTo(...q); ctx.stroke(); };
    line([P.hip, P.sh], 7, '#2b2b2b'); line([P.hip, P.sh], 5, color);           // body
    line([P.sh, P.hand], 4, '#2b2b2b');                                          // arm
    if (k > 0.05) line([P.sh, P.hand2], 4, '#2b2b2b');                           // (the other arm, for No hands)
    line([P.hip, P.knee, P.foot], 4, '#2b2b2b');                                 // leg
    if (opts.ghost) {                          // Wisp (the Daily Ghost Race): a round ghost head with a happy face
      const [hx, hy] = P.head;
      D.circle(ctx, hx, hy - 2, 12, color, L);
      ctx.fillStyle = '#2b2b2b';
      ctx.beginPath(); ctx.ellipse(hx + 1, hy - 4, 2, 3, 0, 0, 7); ctx.ellipse(hx + 8, hy - 4, 2, 3, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffafcc'; ctx.beginPath(); ctx.arc(hx - 3, hy + 2, 2.2, 0, 7); ctx.fill();
      ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(hx + 4.5, hy + 1, 3, 0.2, Math.PI - 0.2); ctx.stroke();
    } else {
      D.circle(ctx, P.head[0], P.head[1], 9, color, L);                            // helmet
      D.rr(ctx, P.head[0] + 1, P.head[1] - 4, 9, 6, 3); ctx.fillStyle = '#bde0fe'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); // visor
    }
    if (opts.sticker) drawSticker(ctx, opts.sticker, P.head[0] - 4, P.head[1] - 1, 4.6);    // Bike Shop: helmet sticker
    ctx.restore();
  }

  // Wisp, the Daily Ghost Race's rider: a see-through bike with a ghost riding it, a few twinkles behind
  function drawWisp(g, ctx) {
    const w = wispAt(raceTime), x = w.x - camX, y = laneY(WISP.lane) - w.h;
    if (x < -80 || x > W + 80) return;
    for (let i = 1; i <= 3; i++) {
      const tx = x - 30 - i * 22, ty = y - 40 + Math.sin(g.time * 6 + i) * 8;
      ctx.globalAlpha = 0.5 - i * 0.12; D.star(ctx, tx, ty, 9 - i * 1.5, '#ffffff', 2); ctx.globalAlpha = 1;
    }
    drawBike(ctx, x, y, w.angle, WISP.color, { wheel: w.x / 14, alpha: 0.6, ghost: true });
    D.text(ctx, WISP.name, x, y - 96, { size: 18, color: '#ffffff' });
  }
  function drawAI(ctx, a) {
    const x = a.x - camX;
    if (x < -80 || x > W + 80) return;
    drawBike(ctx, x, laneY(a.laneF) - a.h, a.angle, a.color, { wheel: a.wheel, alpha: 0.7 });
    D.text(ctx, a.name, x, laneY(a.laneF) - a.h - 90, { size: 16, color: a.color });
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
    if (g.level && g.level.friends) for (const k in riders) D.circle(ctx, px + pw * prog(riders[k].x), py + 7, 8, peerOf(k).color, 3);
    for (const a of ais) D.circle(ctx, px + pw * prog(a.x), py + 7, 7, a.color, 2.5);
    if (wisp) D.circle(ctx, px + pw * prog(wispAt(raceTime).x), py + 7, 8, WISP.color, 3);
    // coins + your place, under the progress bar
    D.circle(ctx, px + 10, py + 44, 11, '#ffc93c', 3);
    D.text(ctx, String(coinsGot), px + 28, py + 46, { size: 24, align: 'left' });
    if (ais.length || wisp) D.text(ctx, ['1st', '2nd', '3rd', '4th'][myPlace() - 1], px + 120, py + 46, { size: 28, align: 'left', color: ['#ffc93c', '#dfe7ef', '#e09f5a', '#ffffff'][myPlace() - 1] });
    // in a cup: a little flag + "race 3 of 10"
    if (g.level && g.level.cup) {
      const fx = px + 200, fy = py + 30;
      ctx.lineWidth = 3; ctx.strokeStyle = '#2b2b2b';
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy + 30); ctx.stroke();
      D.box(ctx, fx + 2, fy, 20, 14, 2, '#fff', 3);
      ctx.fillStyle = '#2b2b2b'; ctx.fillRect(fx + 2, fy, 7, 7); ctx.fillRect(fx + 16, fy, 6, 7); ctx.fillRect(fx + 9, fy + 7, 7, 7);
      D.text(ctx, (g.level.raceNo + 1) + '/' + CUPS[g.level.cup].list.length, fx + 30, py + 46, { size: 24, align: 'left' });
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
    // a gentle camera shake at top speed (and after a tumble)
    ctx.save();
    const sk = shake * Arcade.shakeK();      // (calm motion: no shake, see Arcade.calm)
    if (sk > 0) ctx.translate((Math.random() - 0.5) * 8 * sk, (Math.random() - 0.5) * 6 * sk);
    drawBg(ctx, g);
    drawTrack(ctx);
    // coins: spin (they get thin and fat); the gold star coins on the big jumps
    for (const c of T.coins) {
      const cx = c.x - camX;
      if (c.got || cx < -30 || cx > W + 30) continue;
      const cy = laneY(c.lane) - c.h;
      if (c.star) { D.star(ctx, cx, cy, 17 + Math.sin(g.time * 5) * 2, '#ffd166', 3.5); continue; }
      const sq = Math.abs(Math.cos(g.time * 4 + c.x * 0.01));
      ctx.beginPath(); ctx.ellipse(cx, cy, 10 * Math.max(0.2, sq), 10, 0, 0, 7);
      ctx.fillStyle = '#ffc93c'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#2b2b2b'; ctx.stroke();
    }
    // computer riders (back lanes first so the front ones overlap them)
    // (all drawn behind your bike, a little see-through, so your own tricks are always easy to see)
    for (const a of ais.slice().sort((p, q) => p.lane - q.lane)) drawAI(ctx, a);
    if (wisp) drawWisp(g, ctx);

    // ghost of your best run
    if (ghost && countdown <= 0) {
      const gf = ghost[Math.min(ghost.length - 1, Math.floor(raceTime * 30))];
      if (gf) drawBike(ctx, gf[0] - camX, laneY(gf[3] / 100) - gf[1], gf[2] / 100, '#ffffff', { alpha: 0.35 });
    }
    // friends' riders (their own colors, a little see-through so yours stands out)
    if (g.level && g.level.friends) for (const k in riders) {
      const r = riders[k], p = peerOf(k);
      drawBike(ctx, r.x - camX, laneY(r.lane) - r.h, r.a, p.color, { alpha: 0.75 });
      if (p.name) D.text(ctx, p.name, r.x - camX, laneY(r.lane) - r.h - 92, { size: 18, color: p.color });
    }
    const b = bike;
    // shadow on the ground under a flying bike
    const gy = laneY(b.laneF) - groundH(T, b.x, b.lane);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(b.x - camX, gy, Math.max(10, 34 - (b.h - groundH(T, b.x, b.lane)) * 0.1), 6, 0, 0, Math.PI * 2); ctx.fill();

    const hop = b.hop > 0 ? Math.sin(Math.PI * b.hop / 0.35) * 22 : 0;
    drawBike(ctx, b.x - camX, laneY(b.laneF) - b.h - hop, b.angle, bikeDef.color, { flames: bikeDef.flames, sticker: bikeDef.sticker, wheel: b.wheel, lean: b.lean, spin: b.crash > 0 ? b.crashSpin : 0, trick: b.trick });
    // speed lines
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (const l of lines) { ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(l.x + l.len, l.y); ctx.stroke(); }
    ctx.restore();
    if (theme.dark) drawNight(ctx);
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
  // a track's picture tile: its sky, a ramp, and (new places) its special thing
  function trackPic(theme, special) {
    const t = THEMES[theme] || THEMES.meadow, O = 'stroke="#2b2b2b" stroke-width="3"';
    const sp = {
      splash: `<rect x="70" y="52" width="44" height="10" rx="5" fill="#4cc9f0" ${O}/><path d="M80 46 l-4 -8 M92 44 v-10 M104 46 l4 -8" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
      jelly: `<rect x="80" y="50" width="30" height="10" rx="4" fill="#ff70a6" ${O}/><path d="M95 44 V24 M88 31 L95 24 L102 31" fill="none" stroke="#ff70a6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
      lights: `<rect x="96" y="14" width="4" height="42" fill="#2b2b2b"/><circle cx="104" cy="16" r="6" fill="#fff3a8" ${O}/><circle cx="18" cy="14" r="8" fill="#fff7c2"/>`,
      loop: `<circle cx="95" cy="35" r="18" fill="none" stroke="#2b2b2b" stroke-width="9"/><circle cx="95" cy="35" r="18" fill="none" stroke="${t.ramp}" stroke-width="4"/>`,
      lift: `<path d="M100 54 v-8 l-6 -3 12 -6 -12 -6 6 -3 v-6" fill="none" stroke="#ff8c42" stroke-width="3"/><rect x="86" y="18" width="28" height="6" rx="3" fill="${t.ramp}" ${O}/>`,
    }[special] || '';
    const ramp = special ? 'M0 46 L20 46 L38 28 L56 46 L120 46 V70 H0 Z' : 'M0 46 L40 46 L60 26 L80 46 L120 46 V70 H0 Z';
    return `<svg viewBox="0 0 120 70"><rect width="120" height="70" fill="${t.sky[0]}"/><path d="${ramp}" fill="${t.ramp}" ${O}/><rect y="56" width="120" height="14" fill="${t.dirt}"/>${sp}</svg>`;
  }

  function levels(g) {
    const list = TRACKS.map((t, i) => {
      const prev = i === 0 || (g.save.levels[TRACKS[i - 1].id] || {}).done;
      const rec = g.save.levels[t.id] || {};
      return { ...t, pic: trackPic(t.theme, t.special), locked: !prev,
        meta: rec.time ? (rec.medal ? Arcade.icons.medal(rec.medal).replace('<svg', '<svg style="width:24px;height:24px;vertical-align:middle"') : '') + ' ' + rec.time.toFixed(1) + 's' : '' };
    });
    const custom = g.save.data.custom;
    if (custom && custom.pieces && custom.pieces.length) list.push({ id: 'custom', name: 'My Track', theme: custom.theme, pieces: custom.pieces, pic: trackPic(custom.theme), meta: '' });
    // the two cups (each tile IS the cup's next race, so tapping it carries on where you stopped)
    list.push(cupRace(g, 'mini'), cupRace(g, 'big'));
    // today's Ghost Race against Wisp (Keith's bike plan #9)
    list.push(ghostLevel(g));
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
  // ---------------------------------------------------------------
  // Bike Shop drawings + page
  // ---------------------------------------------------------------
  // A helmet sticker on the canvas: star / heart / bolt / smile, r = its size
  function drawSticker(ctx, id, x, y, r) {
    ctx.save(); ctx.translate(x, y);
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#2b2b2b'; ctx.lineJoin = 'round';
    ctx.beginPath();
    if (id === 'star') { D.starPath(ctx, 0, 0, r, r * 0.45, 5); ctx.fillStyle = '#ffd166'; }
    else if (id === 'heart') {
      ctx.moveTo(0, r * 0.9); ctx.bezierCurveTo(-r * 1.4, -r * 0.1, -r * 0.6, -r * 1.2, 0, -r * 0.35);
      ctx.bezierCurveTo(r * 0.6, -r * 1.2, r * 1.4, -r * 0.1, 0, r * 0.9); ctx.fillStyle = '#ff4d6d';
    } else if (id === 'bolt') {
      [[0.2, -1], [-0.6, 0.15], [-0.05, 0.15], [-0.25, 1], [0.6, -0.2], [0.05, -0.2]].forEach(([a, b], i) => i ? ctx.lineTo(a * r, b * r) : ctx.moveTo(a * r, b * r));
      ctx.closePath(); ctx.fillStyle = '#ffe066';
    } else { ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = '#8ac926'; }
    ctx.fill(); ctx.stroke();
    if (id === 'smile') {
      ctx.fillStyle = '#2b2b2b'; ctx.fillRect(-r * 0.45, -r * 0.4, r * 0.25, r * 0.3); ctx.fillRect(r * 0.2, -r * 0.4, r * 0.25, r * 0.3);
      ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0.3, Math.PI - 0.3); ctx.stroke();
    }
    ctx.restore();
  }
  // a little picture made on a canvas (for the shop tiles), returned as an image URL
  function canvasPic(w, h, paint) {
    const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2;
    const ctx = c.getContext('2d'); ctx.scale(2, 2); paint(ctx);
    return c.toDataURL();
  }
  // a bike picture with given looks
  const bikePic = (look, w = 150, h = 110, s = 1.1) => canvasPic(w, h, (ctx) => {
    ctx.translate(w / 2, h - 6); ctx.scale(s, s);
    drawBike(ctx, 0, 0, 0, look.color, { flames: look.flames, sticker: look.sticker });
  });
  const COIN = (n) => `<svg viewBox="0 0 40 40" style="width:22px;height:22px;vertical-align:-5px"><circle cx="20" cy="20" r="15" fill="#ffc93c" stroke="#2b2b2b" stroke-width="3.5"/><circle cx="20" cy="20" r="8" fill="none" stroke="#e09f3e" stroke-width="2.5"/></svg>${n != null ? ' ' + n : ''}`;
  const TICK = '<svg viewBox="0 0 24 24" style="width:24px;height:24px;vertical-align:middle"><path d="M4 13 L10 19 L20 6" fill="none" stroke="#06d6a0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const SHOP_ICON = `<svg viewBox="0 0 48 48"><path d="M8 18 H40 L37 40 H11 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><path d="M17 18 V13 A7 7 0 0 1 31 13 V18" fill="none" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="29" r="6" fill="#ffc93c" stroke="#2b2b2b" stroke-width="3"/></svg>`;
  // the 3 upgrade pictures
  const UP_ICON = {
    engine: `<svg viewBox="0 0 80 60"><rect x="14" y="16" width="44" height="32" rx="6" fill="#adb5bd" stroke="#2b2b2b" stroke-width="4"/><path d="M22 16 V8 M36 16 V8 M50 16 V8" stroke="#2b2b2b" stroke-width="5" stroke-linecap="round"/><path d="M58 26 H70 V38 H58" fill="#ef476f" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><path d="M26 40 L34 24 L38 32 L46 24" fill="none" stroke="#ef476f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    cool: `<svg viewBox="0 0 80 60"><rect x="16" y="8" width="48" height="44" rx="6" fill="#8ecae6" stroke="#2b2b2b" stroke-width="4"/>${[18, 26, 34, 42].map(y => `<path d="M24 ${y} H56" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/>`).join('')}<path d="M40 2 V58 M28 10 L52 50 M52 10 L28 50" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.8"/></svg>`,
    tires: `<svg viewBox="0 0 80 60"><circle cx="40" cy="30" r="25" fill="#3a3a3a" stroke="#2b2b2b" stroke-width="4"/><circle cx="40" cy="30" r="11" fill="#ddd" stroke="#2b2b2b" stroke-width="3"/>${Array.from({ length: 10 }, (_, k) => { const a = k * Math.PI / 5; return `<rect x="${40 + Math.cos(a) * 25 - 3}" y="${30 + Math.sin(a) * 25 - 3}" width="6" height="6" fill="#6c757d" transform="rotate(${k * 36} ${40 + Math.cos(a) * 25} ${30 + Math.sin(a) * 25})"/>`; }).join('')}</svg>`,
  };
  function shopCSS() {
    if (document.getElementById('bike-shop-css')) return;
    document.head.appendChild(Arcade.h('style', { id: 'bike-shop-css' }, `
      .bk-shop-head { display:flex; align-items:center; justify-content:center; gap:16px; flex-wrap:wrap; }
      .bk-wallet { display:inline-flex; align-items:center; gap:6px; background:#fff; color:#2b2b2b; border:4px solid #2b2b2b; border-radius:30px; padding:4px 16px; font-size:26px; font-weight:900; }
      .bk-wallet svg { width:30px !important; height:30px !important; }
      .bk-preview { height:124px; display:block; margin:0 auto; }
      .bk-pips { display:flex; gap:5px; justify-content:center; margin:4px 0; }
      .bk-pips i { width:16px; height:16px; border-radius:50%; border:3px solid #2b2b2b; background:#fff; }
      .bk-pips i.on { background:#06d6a0; }
      .bk-swatches { display:flex; flex-wrap:wrap; gap:18px 10px; justify-content:center; margin:6px 0; }
      .bk-swatch { width:72px; height:72px; border-radius:50%; border:5px solid #2b2b2b; cursor:pointer; position:relative; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:900; color:#2b2b2b; }
      .bk-swatch.picked { box-shadow:0 0 0 5px #ffd166; }
      .bk-swatch .cost { position:absolute; bottom:-10px; background:#fff; border:3px solid #2b2b2b; border-radius:12px; padding:0 5px; font-size:13px; white-space:nowrap; }
      .bk-swatch .cost svg { width:14px !important; height:14px !important; vertical-align:-2px !important; }
      .bk-shop h2.ar-title { font-size:22px; margin:12px 0 4px; }
      html.ar-phone .bk-swatch { width:66px; height:66px; }
    `));
  }
  // The shop page: your bike at the top, then Upgrades, Paint, Flames and Helmet stickers.
  // Tap something you don't have = buy it (if you have the coins); tap something you have = use it.
  function openShop(g) {
    if (CANVAS) { shopScreen(g); return; }
    shopCSS();
    const d = shopData(g);
    const p = Arcade.h('div', { class: 'ar-panel wide ar-scroll bk-shop' });
    const head = Arcade.h('div', { class: 'bk-shop-head' });
    head.appendChild(Arcade.h('h1', { class: 'ar-title' }, 'Bike Shop'));
    const wallet = Arcade.h('span', { class: 'bk-wallet', 'data-wallet': '1' });
    head.appendChild(wallet);
    p.appendChild(head);
    const preview = Arcade.h('img', { class: 'bk-preview', alt: '' });
    p.appendChild(preview);
    const paints = [];                       // every tile's "paint yourself again" function
    const refresh = () => {
      wallet.innerHTML = COIN() + `<b>${d.wallet}</b>`;
      const b = myBike(g);
      preview.src = bikePic(b, 200, 124, 1.15);
      paints.forEach(f => f());
      g.store();
    };
    // try to pay; a wobble + bonk when there aren't enough coins
    const pay = (cost, el) => {
      if (d.wallet < cost) {
        Arcade.sfx('bonk');
        el.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], 260);
        wallet.animate([{ transform: 'scale(1.25)' }, { transform: 'none' }], 300);
        return false;
      }
      d.wallet -= cost;
      Arcade.sfx('coin'); setTimeout(() => Arcade.sfx('unlock'), 150);
      g.achieve('shopper');
      return true;
    };
    const own = (key) => d.owned.includes(key);

    // ---- upgrades: 3 levels each ----
    p.appendChild(Arcade.h('h2', { class: 'ar-title' }, 'Upgrades'));
    const ug = Arcade.h('div', { class: 'ar-grid', style: 'grid-template-columns:repeat(3, minmax(0, 220px));justify-content:center' });   // (3 across, also on phones)
    for (const u of UPGRADES) {
      const tile = Arcade.h('button', { type: 'button', class: 'ar-tile', 'data-up': u.id });
      paints.push(() => {
        const lv = d.up[u.id], max = lv >= u.cost.length;
        tile.classList.toggle('picked', max);
        tile.innerHTML = `<div class="pic">${UP_ICON[u.id]}</div><div>${u.name}</div><div class="meta">${u.does}</div>` +
          `<div class="bk-pips">${u.cost.map((_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div>` +
          `<div class="meta">${max ? TICK : COIN(u.cost[lv])}</div>`;
      });
      tile.addEventListener('click', () => {
        const lv = d.up[u.id];
        if (lv >= u.cost.length) { Arcade.sfx('click'); return; }
        if (!pay(u.cost[lv], tile)) return;
        d.up[u.id]++;
        if (UPGRADES.every(x => d.up[x.id] >= x.cost.length)) g.achieve('maxed');
        refresh();
      });
      ug.appendChild(tile);
    }
    p.appendChild(ug);

    // ---- paint: the bike's own color is free, the others cost coins ----
    p.appendChild(Arcade.h('h2', { class: 'ar-title' }, 'Paint'));
    const sw = Arcade.h('div', { class: 'bk-swatches' });
    for (const col of [''].concat(PAINTS)) {
      const key = 'paint:' + col;
      const b = Arcade.h('button', { type: 'button', class: 'bk-swatch', 'data-paint': col || 'own', 'aria-label': 'Paint' });
      paints.push(() => {
        b.style.background = col || pickedBike(g).color;
        b.classList.toggle('picked', d.look.paint === col);
        b.innerHTML = col && !own(key) ? `<span class="cost">${COIN(PAINT_COST)}</span>` : '';
      });
      b.addEventListener('click', () => {
        if (col && !own(key)) { if (!pay(PAINT_COST, b)) return; d.owned.push(key); }
        else Arcade.sfx('click');
        d.look.paint = col;
        refresh();
      });
      sw.appendChild(b);
    }
    p.appendChild(sw);

    // ---- flames + helmet stickers ----
    p.appendChild(Arcade.h('h2', { class: 'ar-title' }, 'Flames + helmet stickers'));
    const lg = Arcade.h('div', { class: 'ar-grid', style: 'grid-template-columns:repeat(auto-fill,minmax(120px,1fr))' });
    const lookTile = (attr, pic, isOn, owned, cost, onTap) => {
      const tile = Arcade.h('button', { type: 'button', class: 'ar-tile' });
      tile.setAttribute(attr[0], attr[1]);
      paints.push(() => {
        tile.classList.toggle('picked', isOn());
        tile.innerHTML = `<div class="pic"><img alt="" src="${pic()}" style="height:64px"></div><div class="meta">${owned() ? (isOn() ? TICK : '&nbsp;') : COIN(cost)}</div>`;
      });
      tile.addEventListener('click', () => {
        if (!owned()) { if (!pay(cost, tile)) return; onTap(true); }
        else { Arcade.sfx('click'); onTap(false); }
        refresh();
      });
      lg.appendChild(tile);
    };
    // flames: buy once, then tap to switch them on / off
    lookTile(['data-flames', '1'], () => canvasPic(120, 80, (ctx) => { ctx.translate(60, 100); ctx.scale(1.3, 1.3); drawBike(ctx, 0, 0, 0, myBike(g).color, { flames: true }); }),   // (close up on the tank)
      () => d.look.flames, () => own('flames'), FLAMES_COST,
      (bought) => { if (bought) d.owned.push('flames'); d.look.flames = bought || !d.look.flames; });
    // stickers: buy each one; tap your sticker again to take it off
    for (const id of STICKERS) {
      lookTile(['data-sticker', id], () => canvasPic(80, 64, (ctx) => {
        D.circle(ctx, 40, 32, 26, myBike(g).color, 4);
        D.rr(ctx, 46, 20, 22, 14, 7); ctx.fillStyle = '#bde0fe'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
        drawSticker(ctx, id, 30, 38, 12);
      }), () => d.look.sticker === id, () => own('sticker:' + id), STICKER_COST,
      (bought) => { if (bought) d.owned.push('sticker:' + id); d.look.sticker = bought || d.look.sticker !== id ? id : ''; });
    }
    p.appendChild(lg);

    const btns = Arcade.h('div', { class: 'ar-btns' });
    const back = Arcade.h('button', { type: 'button', class: 'ar-btn big' }, `${icons.left}<span>Back</span>`);
    back.addEventListener('click', () => { Arcade.sfx('click'); g.menu(); });
    btns.appendChild(back);
    p.appendChild(btns);
    refresh();
    g.panel(p);
  }

  // ---- the Bike Shop as a canvas-menu screen (Nov 21: Phaser + Rex UI) ----
  // Same rules as the page above: tap something you don't have = buy it, tap something you have = use it.
  // Every tap draws the screen again (same id: it stays where it was scrolled to).
  const COIN_SVG = COIN_ICON;
  const TICK_SVG = '<svg viewBox="0 0 24 24"><path d="M4 13 L10 19 L20 6" fill="none" stroke="#06d6a0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const costMeta = (n) => [{ svg: COIN_SVG }, { text: String(n) }];
  // an upgrade picture with its 3 level dots under it (green = bought)
  const upPic = (id, lv, max) => `<svg viewBox="0 0 80 84">${UP_ICON[id].replace('<svg viewBox="0 0 80 60">', '').replace('</svg>', '')}` +
    Array.from({ length: max }, (_, i) => `<circle cx="${40 + (i - (max - 1) / 2) * 20}" cy="74" r="7" fill="${i < lv ? '#06d6a0' : '#fff'}" stroke="#2b2b2b" stroke-width="3"/>`).join('') + '</svg>';
  const swatchPic = (col) => `<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="25" fill="${col}" stroke="#2b2b2b" stroke-width="5"/><path d="M18 22 Q22 14 30 13" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.7"/></svg>`;
  // the coins you have: a white pill with a coin and the number
  const walletSVG = (n) => `<svg viewBox="0 0 150 60"><rect x="4" y="4" width="142" height="52" rx="26" fill="#fff" stroke="#2b2b2b" stroke-width="5"/>` +
    `<circle cx="34" cy="30" r="17" fill="#ffc93c" stroke="#2b2b2b" stroke-width="4"/><circle cx="34" cy="30" r="9" fill="none" stroke="#e09f3e" stroke-width="3"/>` +
    `<text x="98" y="41" font-size="30" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" fill="#2b2b2b">${n}</text></svg>`;
  function shopScreen(g) {
    const d = shopData(g);
    const own = (key) => d.owned.includes(key);
    const redraw = () => { g.store(); shopScreen(g); };
    // try to pay; a bonk when there aren't enough coins
    const pay = (cost) => {
      if (d.wallet < cost) { Arcade.sfx('bonk'); return false; }
      d.wallet -= cost;
      Arcade.sfx('coin'); setTimeout(() => Arcade.sfx('unlock'), 150);
      g.achieve('shopper');
      return true;
    };
    const items = [];
    // ---- upgrades: 3 levels each ----
    items.push({ heading: 'Upgrades' });
    for (const u of UPGRADES) {
      const lv = d.up[u.id], max = lv >= u.cost.length;
      items.push({ pic: upPic(u.id, lv, u.cost.length), name: u.name, meta: max ? [{ svg: TICK_SVG }] : costMeta(u.cost[lv]), picked: max, attr: 'up-' + u.id,
        onTap: () => {
          if (d.up[u.id] >= u.cost.length) { Arcade.sfx('click'); return; }
          if (!pay(u.cost[d.up[u.id]])) return;
          d.up[u.id]++;
          if (UPGRADES.every(x => d.up[x.id] >= x.cost.length)) g.achieve('maxed');
          redraw();
        } });
    }
    // ---- paint: the bike's own color is free, the others cost coins ----
    const ups = items.splice(0);
    items.push({ heading: 'Paint' });
    for (const col of [''].concat(PAINTS)) {
      const key = 'paint:' + col, mine = !col || own(key);
      items.push({ pic: swatchPic(col || pickedBike(g).color), name: '', meta: mine ? (d.look.paint === col ? [{ svg: TICK_SVG }] : []) : costMeta(PAINT_COST),
        picked: d.look.paint === col, attr: 'paint-' + (col || 'own'),
        onTap: () => {
          if (col && !own(key)) { if (!pay(PAINT_COST)) return; d.owned.push(key); }
          else Arcade.sfx('click');
          d.look.paint = col;
          redraw();
        } });
    }
    // ---- flames + helmet stickers ----
    const paints = items.splice(0);
    items.push({ heading: 'Flames + stickers' });
    const look = (attr, img, on, owned, cost, onTap) => items.push({ img, name: '', meta: owned ? (on ? [{ svg: TICK_SVG }] : []) : costMeta(cost), picked: on, attr,
      onTap: () => {
        if (!owned) { if (!pay(cost)) return; onTap(true); }
        else { Arcade.sfx('click'); onTap(false); }
        redraw();
      } });
    // flames: buy once, then tap to switch them on / off
    look('flames', canvasPic(120, 80, (ctx) => { ctx.translate(60, 100); ctx.scale(1.3, 1.3); drawBike(ctx, 0, 0, 0, myBike(g).color, { flames: true }); }),
      !!d.look.flames, own('flames'), FLAMES_COST,
      (bought) => { if (bought) d.owned.push('flames'); d.look.flames = bought || !d.look.flames; });
    // stickers: buy each one; tap your sticker again to take it off
    for (const id of STICKERS) {
      look('sticker-' + id, canvasPic(80, 64, (ctx) => {
        D.circle(ctx, 40, 32, 26, myBike(g).color, 4);
        D.rr(ctx, 46, 20, 22, 14, 7); ctx.fillStyle = '#bde0fe'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
        drawSticker(ctx, id, 30, 38, 12);
      }), d.look.sticker === id, own('sticker:' + id), STICKER_COST,
      (bought) => { if (bought) d.owned.push('sticker:' + id); d.look.sticker = bought || d.look.sticker !== id ? id : ''; });
    }
    ArcadeMenus.open({ id: 'shop', title: 'Bike Shop',
      rows: [
        // your bike as it is now + your coins, side by side
        { t: 'pics', items: [{ img: bikePic(myBike(g), 200, 124, 1.15) }, walletSVG(d.wallet)], size: 150, kind: 'wallet', wallet: d.wallet },
        { t: 'tiles', w: 130, h: 150, items: ups },
        { t: 'tiles', w: 96, h: 116, items: paints },
        { t: 'tiles', w: 110, h: 116, items },
      ],
      footer: { t: 'buttons', items: [{ icon: icons.left, label: 'Back', color: 'big', attr: 'back', onTap: () => { Arcade.sfx('click'); g.menu(); } }] },
      onKey: (c) => { if (c === 'Escape') g.menu(); } });
  }

  // ---- the levels page's extra rows (canvas menus): pick your bike + Build a track ----
  function extraRows(g, redraw) {
    const current = pickedBike(g).id;
    return [
      { t: 'tiles', w: 150, h: 160, items: [{ heading: 'Pick your bike' }].concat(BIKES.map(b => {
        const ok = bikeUnlocked(g, b);
        return { pic: bikeIcon(b.color), name: b.name, meta: [{ text: ok ? bikeStats(b) : b.need }], locked: !ok, picked: b.id === current, attr: 'bike-' + b.id,
          onTap: () => { if (!ok) { Arcade.sfx('bonk'); return; } Arcade.sfx('click'); g.save.data.bike = b.id; g.store(); redraw(); } };
      })) },
      { t: 'buttons', items: [{ icon: toolIcon(), label: 'Build a track', color: 'pink', attr: 'build', onTap: () => { Arcade.sfx('click'); openEditor(g); } }] },
    ];
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
  const BUILD_PIECES = ['flat', 'small', 'big', 'kicker', 'table', 'double', 'bumps', 'mud', 'arrows', 'logs', 'splash', 'jelly', 'loop', 'lift', 'boost'];
  const MIN_BOXES = 4, MAX_BOXES = 12;     // a home-made track has 4 to 12 boxes (Keith's bike plan #8, Nov 21)
  // little pictures for the builder's tool buttons
  const BICON = {
    add: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" fill="#06d6a0" stroke="#2b2b2b" stroke-width="4"/><path d="M24 14 V34 M14 24 H34" stroke="#2b2b2b" stroke-width="5" stroke-linecap="round"/></svg>`,
    remove: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" fill="#ff8fa3" stroke="#2b2b2b" stroke-width="4"/><path d="M14 24 H34" stroke="#2b2b2b" stroke-width="5" stroke-linecap="round"/></svg>`,
    dice: `<svg viewBox="0 0 48 48"><rect x="7" y="7" width="34" height="34" rx="9" fill="#fff" stroke="#2b2b2b" stroke-width="4"/><circle cx="16" cy="16" r="3.5" fill="#2b2b2b"/><circle cx="32" cy="16" r="3.5" fill="#2b2b2b"/><circle cx="24" cy="24" r="3.5" fill="#ef476f"/><circle cx="16" cy="32" r="3.5" fill="#2b2b2b"/><circle cx="32" cy="32" r="3.5" fill="#2b2b2b"/></svg>`,
  };
  // the dice: a surprise track (6-10 boxes, at most 2 loops and 2 moving ramps, starts flat)
  function diceTrack() {
    const out = ['flat'], n = 6 + Math.floor(Math.random() * 5);
    while (out.length < n) {
      const p = BUILD_PIECES[1 + Math.floor(Math.random() * (BUILD_PIECES.length - 1))];
      if ((p === 'loop' || p === 'lift') && out.filter(x => x === p).length >= 2) continue;
      if (p === out[out.length - 1]) continue;          // no two the same in a row
      out.push(p);
    }
    return out;
  }
  // a home-made track as a short text, so it fits in a Friends start message: "my~<theme>~<letters>"
  // (each piece is one letter: its place in PIECE_KEYS; never reorder this list, only add to the end)
  const PIECE_KEYS = Object.keys(PIECES);
  const packTrack = (c) => 'my~' + c.theme + '~' + c.pieces.filter(p => PIECES[p]).map(p => String.fromCharCode(97 + PIECE_KEYS.indexOf(p))).join('');
  function unpackTrack(code) {
    const [, th, letters] = String(code).split('~');
    const pieces = (letters || '').split('').map(ch => PIECE_KEYS[ch.charCodeAt(0) - 97]).filter(Boolean).slice(0, MAX_BOXES);
    return { theme: THEMES[th] ? th : 'meadow', pieces: pieces.length ? pieces : ['flat', 'small', 'flat'] };
  }
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
    if (p.splash) inner = `<rect x="8" y="40" width="84" height="14" rx="7" fill="#4cc9f0" stroke="#2b2b2b" stroke-width="3"/><path d="M30 34 l-6 -10 M50 32 v-12 M70 34 l6 -10" stroke="#4cc9f0" stroke-width="4" stroke-linecap="round"/>`;
    if (p.jelly) inner = `<rect x="28" y="38" width="44" height="14" rx="6" fill="#ff70a6" stroke="#2b2b2b" stroke-width="3"/><path d="M50 32 V10 M42 18 L50 10 L58 18" fill="none" stroke="#ff70a6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (p.loop) inner = `<circle cx="50" cy="29" r="21" fill="none" stroke="#2b2b2b" stroke-width="10"/><circle cx="50" cy="29" r="21" fill="none" stroke="#e0a465" stroke-width="5"/>`;
    if (p.move) inner += `<path d="M86 8 v14 M80 14 L86 8 L92 14 M80 22 L86 28 L92 22" fill="none" stroke="#ff8c42" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (name === 'flat') inner = '';
    return `<svg viewBox="0 0 100 60"><rect x="0" y="50" width="100" height="10" fill="#c98b4f"/>${inner}</svg>`;
  }
  // the places a home-made track can look like (night unlocks after Volcano Run; each new place after you finish its track)
  const editorThemes = (g) => OPEN_THEMES.concat(g.isUnlocked('theme-night') ? ['night'] : [],
    TRACKS.filter(t => !OPEN_THEMES.includes(t.theme) && t.theme !== 'night' && (g.save.levels[t.id] || {}).done).map(t => t.theme));
  // The track builder as a canvas-menu screen (Nov 21; bigger Nov 21 night, Keith's bike plan #8):
  //   the track's boxes (tap one = pick it, yellow), + / - / dice, then every piece (tap = put it in the
  //   picked box and move on to the next box), the places, and Race it!
  function editorScreen(g, st) {
    const again = () => editorScreen(g, st);
    const pieces = st.pieces;
    st.sel = Math.max(0, Math.min(st.sel, pieces.length - 1));
    const save = () => { g.save.data.custom = { pieces: pieces.slice(), theme: st.theme }; g.store(); };
    ArcadeMenus.open({ id: 'build', title: 'Build a track', top: { t: 'buttons', items: [
        { icon: BICON.add, label: '', color: 'white', attr: 'add', dim: pieces.length >= MAX_BOXES, onTap: () => {
          if (pieces.length >= MAX_BOXES) { Arcade.sfx('bonk'); return; }
          Arcade.sfx('pop'); pieces.splice(st.sel + 1, 0, 'flat'); st.sel++; save(); again(); } },
        { icon: BICON.remove, label: '', color: 'white', attr: 'remove', dim: pieces.length <= MIN_BOXES, onTap: () => {
          if (pieces.length <= MIN_BOXES) { Arcade.sfx('bonk'); return; }
          Arcade.sfx('click'); pieces.splice(st.sel, 1); save(); again(); } },
        { icon: BICON.dice, label: '', color: 'white', attr: 'dice', onTap: () => {
          Arcade.sfx('spring'); pieces.splice(0, pieces.length, ...diceTrack());
          const th = editorThemes(g); st.theme = th[Math.floor(Math.random() * th.length)]; st.sel = 0; save(); again(); } },
      ] },
      rows: [
        // (the track = a brown card, the pieces to put in = a blue card, so they don't look alike)
        // the track (a brown card) and the pieces to put in (a blue card) side by side (one under the other upright)
        { t: 'cols', gap: 12, cols: [
          { w: 390, rows: [{ t: 'tiles', bg: '#e8b27a', w: 82, h: 82, items: pieces.map((name, i) => ({ pic: pieceIcon(name), name: String(i + 1), attr: 'piece-' + i, picked: i === st.sel,
            onTap: () => { Arcade.sfx('click'); st.sel = i; again(); } })) }] },
          { w: 390, rows: [{ t: 'tiles', bg: '#8ecae6', w: 82, h: 82, items: BUILD_PIECES.map(name => ({ pic: pieceIcon(name), attr: 'put-' + name, label: PIECES[name].name,
            onTap: () => {
              Arcade.sfx('pop'); pieces[st.sel] = name;
              if (st.sel < pieces.length - 1) st.sel++;          // straight on to the next box
              save(); again();
            } })) }] },
        ] },
        { t: 'tiles', w: 110, h: 90, items: editorThemes(g).map(t => ({ pic: trackPic(t), name: '', picked: t === st.theme, attr: 'theme-' + t,
          onTap: () => { Arcade.sfx('click'); st.theme = t; save(); again(); } })) },
      ],
      footer: { t: 'buttons', items: [
        { icon: icons.play, label: 'Race it!', color: 'big', attr: 'race', onTap: () => {
          Arcade.sfx('click'); save();
          g.play({ id: 'custom', name: 'My Track', theme: st.theme, pieces: pieces.filter(x => x) });
        } },
        { icon: icons.menu, label: 'Levels', color: 'white', attr: 'levels', onTap: () => { Arcade.sfx('click'); g.menu(); } },
      ] },
      onKey: (c) => { if (c === 'Escape') g.menu(); } });
  }
  // test hooks: pack / unpack a home-made track, the dice, and set the saved track
  window.__bikeBuild = { pack: packTrack, unpack: unpackTrack, dice: diceTrack, pieces: BUILD_PIECES,
    set: (c) => { const g = window.__game; if (g) { g.save.data.custom = c; g.store(); } } };
  // test hooks for the Daily Ghost Race: today's track (big / little kids), a pretend ride, the results picture
  // living backgrounds (tests + tools/preview_bike_scenery.py): draw one place's background into a canvas.
  // (Only on a page that isn't racing: it changes the place and the camera.)
  window.__bikeScene = {
    places: Object.keys(THEMES), times: Object.keys(TIMES),
    draw(ctx, place, time, cam, t) {
      theme = THEMES[place]; timeOfDay = time || ''; camX = cam || 0; sceneT = t == null ? null : t;
      drawBg(ctx, null); sceneT = null;
    },
    info: () => scene && { key: scene.key, strips: scene.strips.map(s => s.id), px: scene.strips.reduce((n, s) => n + s.c.width * s.c.height, 0) },
    time: () => timeOfDay,
    canvases: () => scene ? scene.strips.map(s => s.c) : [],
    LOOP,
  };
  window.__bikeGhost = { track: (little) => ghostTrack(!!little).id, sim: (k) => simRider(k).t, play: () => playGhost(window.__game) };
  function openEditor(g) {
    const saved = g.save.data.custom || { pieces: ['small', 'flat', 'big', 'arrows', 'table', 'mud', 'kicker', 'flat'], theme: 'meadow' };
    const pieces = saved.pieces.filter(p => PIECES[p]).slice(0, CANVAS ? MAX_BOXES : 8);
    while (pieces.length < (CANVAS ? MIN_BOXES : 8)) pieces.push('flat');
    let themeName = saved.theme || 'meadow';
    if (CANVAS) { editorScreen(g, { pieces, theme: themeName, sel: 0 }); return; }
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
    // track colors (night unlocks after Volcano Run; each new place after you finish its track)
    const themes = editorThemes(g);
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
  const LINK = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';   // outline style for the logo picture
  Arcade.start({
    id: 'bike',
    friends: (g) => friendsMenu(g),   // race friends on other phones (arcade/net.js)
    menuExtras: (g) => [{ icon: SHOP_ICON, label: 'Shop', attr: 'data-shop', onClick: () => openShop(g) },   // the Bike Shop
      { icon: WISP_PIC, label: 'Ghost', attr: 'data-ghost', onClick: () => playGhost(g) }],                   // today's Ghost Race
    littleSpeed: 0.8,             // little kids: the whole race runs a bit slower
    trophies: [
      { id: 'finish', name: 'Finish line', how: 'Finish any race' },
      { id: 'perfect', name: 'Perfect!', how: 'Land a jump perfectly flat' },
      { id: 'bigair', name: 'Big air', how: 'Fly for a long time' },
      { id: 'gold', name: 'Gold rider', how: 'Win a gold medal' },
      { id: 'smooth', name: 'Smooth rider', how: '5 perfect landings in one race' },
      { id: 'builder', name: 'Track builder', how: 'Race a track you built' },
      { id: 'champ', name: 'Champion', how: 'Gold on every track' },
      { id: 'clean', name: 'Not a scratch', how: 'No tumbles and no overheating in a race', secret: true },
      { id: 'hothead', name: 'Hot hot hot!', how: 'Overheat 3 times in one race', secret: true },
      { id: 'tricky', name: 'Trick star', how: 'Land 5 tricks in one race' },
      { id: 'winner', name: 'First place', how: 'Beat Zip, Moxie and Bolt' },
      { id: 'boing', name: 'Boing!', how: 'Bounce off a jelly pad' },
      { id: 'looper', name: 'Loop-de-loop', how: 'Ride round a loop' },
      { id: 'tour', name: 'World tour', how: 'Finish all 10 tracks' },
      { id: 'minicup', name: 'Mini Cup winner', how: 'Win the Mini Cup' },
      { id: 'shopper', name: 'Bike shopper', how: 'Buy something in the Bike Shop' },
      { id: 'maxed', name: 'Super bike', how: 'Every upgrade to the top' },
      { id: 'bigcup', name: 'Champion of champions', how: 'Win the Championship cup (all 10 tracks)' },
      { id: 'ghost', name: 'Ghost chaser', how: 'Beat Wisp in the Daily Ghost Race' },
      { id: 'ghostweek', name: 'Ghost week', how: 'Beat Wisp 7 days in a row', secret: true },
    ],   // the trophy room (secret ones show '???' until earned)
    logo: Arcade.logo({
      badge: Arcade.badges.bike,   // the round picture (arcade/badges.js)
      title: 'Turbo Bike', colors: ['#ffe066', '#ff8c42'], bg: '#8ecae6', art: `<path d="M0 120 L60 120 L110 80 L130 80 L130 160 L0 160 Z" fill="#c68b59" ${LINK}/>
              <path d="M130 120 H240 V160 H130 Z" fill="#c68b59" ${LINK}/>
              <g class="wobble"><g transform="translate(150 50) rotate(-12)">
                <circle cx="0" cy="40" r="16" fill="#fff" ${LINK}/><circle cx="56" cy="40" r="16" fill="#fff" ${LINK}/>
                <path d="M0 40 L20 18 H44 L56 40 M20 18 L30 40 H44" fill="none" ${LINK}/>
                <path d="M14 18 H50 L44 6 H20 Z" fill="#ef476f" ${LINK}/>
                <circle cx="34" cy="-8" r="11" fill="#ffd166" ${LINK}/></g></g>` }),   // title screen
    menuMusic: { tempo: 132, root: 57, scale: 'mixolydian', prog: [[1, 7, 4, 1], [4, 5, 1, 5], [6, 7, 4, 4]], drums: 'rock', bass: 'octaves', lead: 'saw', harmony: 'brass', pad: true, arp: false, seed: 1202,
        tune: { A: '1/4 3/2 5/2 8/4 7/4 | 7/4 9/2 11/2 9/4 7/4 | 6/4 8/2 6/2 4/4 6/4 | 5/4 3/4 1/8',
                B: '8/6 6/2 8/4 10/4 | 9/6 7/2 9/4 12/4 | 10/4 8/4 12/4 10/4 | 9/12 r/4',
                C: '10/8 8/8 | 9/8 11/8 | 8/4 10/4 8/4 6/4 | 6/16' } },   // the title/menu song
    title: 'Turbo Bike Challenge',
    view: { w: W, h: H },
    background: '#8fd3ff',
    music: { tempo: 156, root: 52, scale: 'minor', prog: [[1, 7, 6, 7], [1, 7, 4, 5], [6, 7, 4, 5]], drums: 'punk', bass: 'eighths', lead: 'saw', harmony: 'brass', pad: false, arp: true, seed: 1201,
        tune: { A: '5/2 5 8/4 8/2 7 5/4 | 4/2 4 7/4 7/2 6 4/4 | 3/2 3 6/4 6/2 5 3/4 | 2/4 4 7/8',
                B: '8/4 8/2 10 8/4 5 | 9/4 9/2 11 9/4 7 | 8/4 8/2 6 4/4 6 | 7/6 5/2 7/8',
                C: '6/8 8 | 7/8 9 | 8/4 6 4/8 | 5/4 7 9/8' } },   // this game's own song
    levelsTitle: 'Pick a track',
    howTo: [
      { pic: S(`<path d="M10 40 H60" stroke="#2b2b2b" stroke-width="8" stroke-linecap="round"/><path d="M48 24 L66 40 L48 56" fill="none" stroke="#06d6a0" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`), text: 'Go!', keys: 'Right arrow / green button' },
      { pic: S(`<path d="M8 50 L30 30 H70" fill="none" stroke="#ff8c42" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><rect x="18" y="58" width="44" height="12" rx="6" fill="#ef476f" stroke="#2b2b2b" stroke-width="3"/>`), text: 'Turbo! Watch the heat', keys: 'Space / orange button' },
      { pic: S(`<path d="M20 30 L40 12 L60 30 M20 50 L40 68 L60 50" fill="none" stroke="#2b2b2b" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`), text: 'Change lanes', keys: 'Up / Down' },
      { pic: S(`<path d="M10 66 L40 30 L70 66 Z" fill="#e0a465" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><path d="M26 20 Q40 6 56 18" fill="none" stroke="#118ab2" stroke-width="5" stroke-linecap="round"/><path d="M50 12 L57 19 L48 22" fill="none" stroke="#118ab2" stroke-width="5" stroke-linecap="round"/>`), text: 'In the air: tilt to land flat on the ramp', keys: 'Left / Right' },
      { pic: S(`<path d="M10 64 L40 34 L70 64" fill="none" stroke="#2b2b2b" stroke-width="6" stroke-linecap="round"/><path d="M40 8 L46 22 L60 22 L49 31 L53 45 L40 37 L27 45 L31 31 L20 22 L34 22 Z" fill="#f15bb5" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/>`), text: 'In the air: Up or Down = a trick!', keys: 'Up / Down' },
      { pic: S(`<circle cx="22" cy="40" r="12" fill="#ffc93c" stroke="#2b2b2b" stroke-width="4"/><circle cx="46" cy="40" r="12" fill="#ffc93c" stroke="#2b2b2b" stroke-width="4"/><path d="M66 26 L69 34 L77 34 L71 39 L73 47 L66 42 L59 47 L61 39 L55 34 L63 34 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/>`), text: 'Grab coins (25 = a house coin)' },
      { pic: S([18, 38, 58].map(x => `<path d="M${x} 28 L${x + 16} 40 L${x} 52 L${x + 6} 40 Z" fill="#8ecae6" stroke="#2b2b2b" stroke-width="3"/>`).join('')), text: 'Blue arrows cool your engine' },
      { pic: S(`<rect x="8" y="28" width="64" height="24" rx="10" fill="#ff8c42" stroke="#2b2b2b" stroke-width="4"/>` + [18, 36, 54].map(x => `<path d="M${x} 32 L${x + 10} 40 L${x} 48 L${x + 5} 40 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="2.5"/>`).join('')), text: 'Orange pads: Zoom!' },
    ],
    buttons: {
      left: [{ id: 'ArrowUp', icon: icons.up, label: 'Lane up' }, { id: 'ArrowDown', icon: icons.down, label: 'Lane down' }],
      right: [{ id: 'ArrowLeft', icon: icons.brake, label: 'Brake / lean back' }, { id: 'Space', icon: icons.turbo, label: 'Turbo' }, { id: 'ArrowRight', icon: icons.gas, label: 'Gas / lean forward' }],
    },
    levels,
    levelDifficulty: (lv) => lv.diff || 'normal',   // each track says how hard it plays (own tracks: normal)
    extraMenu,
    extraRows,                    // (the same, for the canvas menus)
    canvasMenus: true,            // (Nov 21) the menus are drawn with Phaser + Rex UI (arcade/canvasmenu.js)
    setup,
    update,
    draw: render,
  });
})();
