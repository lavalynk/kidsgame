// =====================================================================
// Mini RC Racers — top-down racing with little radio-controlled cars.
//
// How it works (the fun parts):
//  * A track is a loop of a few "control points". We draw a smooth curve
//    through them (a Catmull-Rom spline), then put a point every 16 px
//    along it. That list of points is the CENTERLINE. The road is
//    everything closer than "hw" (half width) to the centerline.
//  * Every car always knows its nearest centerline point. The distance
//    along the centerline to that point is "s" — how far round the lap it is.
//    Laps and race positions come from s (plus checkpoints, so cutting
//    across the grass doesn't count — but the dirt shortcuts DO count).
//  * Car physics: the car pushes along the way it points (gas), and its
//    sideways sliding fades away a bit at a time ("grip"). Less grip =
//    more drifting in fast turns.
//  * Computer cars look a little way ahead on the centerline, steer toward
//    that spot, and slow down before sharp bends (we work out a safe
//    speed for every point of the track once, when the track is built).
// =====================================================================
(function () {
  'use strict';
  const { draw, icons, math } = Arcade;
  const D = draw;
  const INK = D.INK;
  const W = 960, H = 540;
  const SPACING = 16;      // distance between centerline points (px)
  const BOUND = 110;       // grass past the road edge before the soft wall
  const SHORT_BOUND = 60;  // grass past a shortcut's edge
  const CAR_R = 20;        // cars bump each other as circles this big
  const STEER = 2.7;       // base steering speed (radians per second)

  // ---------------------------------------------------------------
  // Track looks. "outer" = beyond the wall, "band" = grass/sand/snow
  // next to the road (drivable but slow), "short" = the shortcut path.
  // ---------------------------------------------------------------
  // kind = which scenery gets drawn (yard bushes, beach sea, snow trees, desert cacti, candy)
  const THEMES = {
    yard:    { kind: 'yard',   outer: '#4f9d4a', band: '#9bd770', road: '#727a8c', curb: '#ef476f', short: '#c98b4f', edge: '#e9c46a', shortKind: 'dirt',   dust: ['#7fbf5a', '#b6e68f'] },
    beach:   { kind: 'beach',  outer: '#38b6e0', band: '#f8dea0', road: '#7d8496', curb: '#ff8c42', short: '#c08552', edge: '#ffffff', shortKind: 'planks', dust: ['#f1cf86', '#fff1c9'] },
    snow:    { kind: 'snow',   outer: '#a9cbe9', band: '#f7fbff', road: '#5a6781', curb: '#118ab2', short: '#c4ecff', edge: '#ffffff', shortKind: 'ice',    dust: ['#ffffff', '#dbeeff'] },
    autumn:  { kind: 'yard',   outer: '#b86b2a', band: '#e8b465', road: '#6f6a7a', curb: '#ffb703', short: '#9c6b3f', edge: '#fff3c4', shortKind: 'dirt',   dust: ['#d9a35b', '#f2cf8f'], bush: '#e07a1f', bush2: '#f4a259' },
    desert:  { kind: 'desert', outer: '#e3a857', band: '#f3d29a', road: '#7a7480', curb: '#ef476f', short: '#c98b4f', edge: '#fff1d0', shortKind: 'dirt',   dust: ['#e8c27a', '#fbe3b0'], plant: '#5aa65a', rock: '#c7865a' },
    candy:   { kind: 'candy',  outer: '#ffb3d9', band: '#fff0f7', road: '#8a6f9e', curb: '#06d6a0', short: '#f6d39a', edge: '#ffffff', shortKind: 'planks', dust: ['#ffd6ec', '#ffffff'] },
    moon:    { kind: 'yard',   outer: '#1f2f5a', band: '#3a5a8c', road: '#4b4f63', curb: '#ffd166', short: '#7d6ab8', edge: '#ffd166', shortKind: 'dirt',   dust: ['#6d8cc4', '#a9c1ea'], bush: '#2b4a7a', bush2: '#3f6aa8' },
    volcano: { kind: 'desert', outer: '#4a2c2a', band: '#8a5a44', road: '#5a5560', curb: '#ff7b00', short: '#a5705a', edge: '#ffb703', shortKind: 'dirt',   dust: ['#a5705a', '#c9906b'], rock: '#6b4f4a', lava: true },
  };

  // 8 tracks that get harder one by one: narrower roads, more bends, more puddles,
  // and faster computer racers (see rivalSkill).
  // pts = control points of the loop (the race goes in this order; point 0 is the start line).
  // items = where the rows of gift boxes are (fraction of the lap).
  // short = an allowed dirt shortcut: from / to snap onto the road, via = the bends in between.
  const TRACKS = [
    { id: 't1', name: 'Backyard Loop', theme: 'yard', hw: 104, items: [0.3, 0.66],
      pts: [[900, 1240], [1500, 1230], [1950, 1100], [2150, 800], [2050, 480], [1700, 370], [1350, 470], [1100, 620], [800, 470], [450, 470], [240, 720], [280, 1020], [520, 1200]] },
    { id: 't2', name: 'Sunny Beach', theme: 'beach', hw: 94, items: [0.2, 0.52, 0.78],
      pts: [[900, 1500], [1500, 1500], [2000, 1440], [2350, 1260], [2800, 1260], [3100, 1000], [3000, 650], [2650, 540], [2350, 700], [2100, 600], [1900, 350], [1450, 300], [1050, 450], [700, 350], [350, 500], [300, 900], [450, 1250], [650, 1450]],
      short: { from: [2330, 1270], via: [[2400, 1080], [2330, 880]], to: [2330, 690] } },
    { id: 't3', name: 'Snowy Park', theme: 'snow', hw: 88, items: [0.16, 0.47, 0.8],
      pts: [[1000, 1700], [1700, 1700], [2300, 1650], [2600, 1400], [2500, 1100], [2100, 1050], [1700, 1100], [1400, 950], [1500, 700], [1900, 650], [2400, 600], [2700, 400], [2500, 150], [1900, 120], [1300, 200], [900, 400], [800, 800], [550, 1000], [300, 1250], [400, 1550], [650, 1700]],
      short: { from: [1720, 1095], via: [[1760, 900]], to: [1880, 655] } },
    { id: 't4', name: 'Autumn Woods', theme: 'autumn', hw: 92, items: [0.25, 0.6, 0.85],
      pts: [[1500, 1800], [1703, 1801], [1933, 1803], [2207, 1783], [2565, 1737], [2896, 1587], [2940, 1328], [2661, 1097], [2339, 968], [2172, 861], [2078, 723], [1950, 574], [1771, 396], [1500, 195], [1138, 127], [861, 311], [795, 618], [803, 848], [727, 986], [606, 1121], [496, 1289], [368, 1514], [311, 1800], [507, 2019], [907, 2026], [1268, 1889]] },
    { id: 't5', name: 'Desert Dunes', theme: 'desert', hw: 90, items: [0.2, 0.5, 0.8],
      pts: [[1600, 1939], [1932, 2053], [2280, 2028], [2567, 1911], [2830, 1775], [3092, 1621], [3241, 1419], [3131, 1200], [2800, 1039], [2466, 956], [2284, 880], [2198, 761], [2064, 635], [1846, 567], [1600, 544], [1326, 495], [956, 417], [517, 404], [179, 535], [84, 772], [176, 1010], [289, 1200], [369, 1365], [511, 1507], [773, 1587], [1057, 1599], [1248, 1628], [1384, 1754]] },
    { id: 't6', name: 'Candy Raceway', theme: 'candy', hw: 88, items: [0.18, 0.45, 0.72],
      pts: [[1500, 2249], [1678, 2061], [1827, 1967], [2000, 1925], [2196, 1870], [2429, 1787], [2650, 1640], [2692, 1414], [2489, 1206], [2240, 1082], [2154, 957], [2176, 747], [2127, 515], [1965, 351], [1741, 268], [1500, 295], [1305, 465], [1191, 669], [1055, 743], [786, 715], [487, 768], [354, 962], [406, 1196], [528, 1393], [670, 1545], [814, 1660], [890, 1800], [905, 2044], [1004, 2312], [1244, 2395]] },
    { id: 't7', name: 'Moonlight Speedway', theme: 'moon', hw: 86, items: [0.22, 0.5, 0.78],
      pts: [[1700, 2220], [1901, 2027], [2022, 1857], [2176, 1804], [2486, 1844], [2928, 1845], [3304, 1701], [3406, 1438], [3207, 1178], [2870, 1008], [2578, 910], [2389, 823], [2251, 717], [2104, 602], [1928, 475], [1700, 320], [1387, 168], [1018, 121], [725, 267], [650, 573], [789, 895], [955, 1114], [950, 1239], [751, 1377], [521, 1595], [439, 1860], [554, 2094], [799, 2254], [1099, 2338], [1414, 2334]] },
    { id: 't8', name: 'Volcano Valley', theme: 'volcano', hw: 84, items: [0.15, 0.4, 0.65, 0.88],
      pts: [[1800, 2557], [2085, 2682], [2361, 2616], [2523, 2381], [2586, 2125], [2710, 1977], [3002, 1903], [3322, 1764], [3390, 1524], [3122, 1297], [2742, 1175], [2533, 1093], [2536, 933], [2574, 687], [2492, 461], [2283, 353], [2029, 372], [1800, 457], [1603, 514], [1373, 474], [1042, 372], [667, 356], [446, 541], [514, 862], [740, 1147], [837, 1325], [696, 1486], [515, 1707], [545, 1925], [809, 2029], [1124, 2023], [1341, 2023], [1465, 2127], [1593, 2332]] },
  ];

  // Every car has the SAME stats. top = top speed, accel, grip (higher = less
  // drift), steer = turning speed, mass = how hard it is to push around.
  // Your car gets better with upgrades bought in the garage.
  const BASE = { top: 430, accel: 420, grip: 7, steer: 1.0, mass: 1.0, nitro: 1 };

  // Paint colors for your car (just looks — all free).
  const PAINTS = [
    { id: 'red', color: '#ef476f' }, { id: 'green', color: '#06d6a0' }, { id: 'yellow', color: '#ffc93c' },
    { id: 'blue', color: '#118ab2' }, { id: 'purple', color: '#9b5de5' }, { id: 'orange', color: '#ff8c42' },
  ];

  // Garage upgrades: each has 5 levels. apply() changes the car's stats.
  const MAX_LVL = 5;
  const PRICES = [40, 80, 140, 220, 320];          // cost of level 1, 2, 3, 4, 5
  const UPGRADES = [
    { id: 'engine', name: 'Engine', info: 'higher top speed', color: '#ef476f', apply: (st, l) => { st.top *= 1 + 0.06 * l; } },
    { id: 'tires',  name: 'Tires',  info: 'grip + steering',  color: '#2b2b2b', apply: (st, l) => { st.grip *= 1 + 0.18 * l; st.steer *= 1 + 0.03 * l; } },
    { id: 'turbo',  name: 'Turbo',  info: 'faster speed-up',  color: '#06d6a0', apply: (st, l) => { st.accel *= 1 + 0.14 * l; } },
    { id: 'nitro',  name: 'Nitro',  info: 'bigger boosts',    color: '#ff8c42', apply: (st, l) => { st.nitro = 1 + 0.2 * l; } },
  ];
  // Coins for 1st, 2nd, 3rd, 4th. Later tracks pay more (x1, x1.25, x1.5 ...).
  // Tuned so that after 7 Grand Prix races (mostly 1st/2nd) you can buy most upgrades.
  const PAY = [250, 180, 130, 90];
  // Grand Prix points for 1st, 2nd, 3rd, 4th
  const POINTS = [10, 7, 5, 3];
  const payFor = (place, trackIndex) => Math.round(PAY[place - 1] * (1 + 0.25 * trackIndex));

  // How good the computer racers are on each track (1st track = gentle).
  function rivalSkill(i) {
    return { top: 0.8 + 0.035 * i, corner: 0.8 + 0.015 * i, oops: Math.max(0.05, 0.2 - 0.02 * i), shortcut: 0.3 + 0.07 * i };
  }

  // Computer racers (their colors are skipped if you pick the same one)
  const RIVALS = [
    { name: 'Grape', color: '#9b5de5' }, { name: 'Mango', color: '#ff8c42' },
    { name: 'Bubblegum', color: '#f15bb5' }, { name: 'Sky', color: '#4cc9f0' }, { name: 'Lime', color: '#8ac926' },
  ];

  // ---------------------------------------------------------------
  // Geometry: smooth curves, even spacing, nearest point
  // ---------------------------------------------------------------
  // Catmull-Rom spline: a smooth curve that passes through every control point.
  function spline(pts, closed, per = 24) {
    const n = pts.length, out = [];
    const get = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const [p0, p1, p2, p3] = [get(i - 1), get(i), get(i + 1), get(i + 2)];
      for (let k = 0; k < per; k++) {
        const t = k / per, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    if (!closed) out.push(pts[n - 1].slice());
    return out;
  }

  // Turn a wiggly list of points into a "path" with points exactly `step` apart,
  // plus the direction of the path at every point (tx, ty).
  function makePath(dense, closed) {
    const seg = [], n = dense.length;
    let L = 0;
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const a = dense[i], b = dense[(i + 1) % n];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      seg.push(len); L += len;
    }
    const N = Math.max(2, Math.round(L / SPACING));
    const step = L / N;
    const pts = [];
    let i = 0, acc = 0;
    for (let k = 0; k < (closed ? N : N + 1); k++) {
      const want = k * step;
      while (i < seg.length - 1 && acc + seg[i] < want) { acc += seg[i]; i++; }
      const a = dense[i], b = dense[(i + 1) % n];
      const f = math.clamp((want - acc) / (seg[i] || 1), 0, 1);
      pts.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
    }
    const P = { closed, pts, step, L, N, tx: [], ty: [] };
    const cnt = pts.length;
    for (let k = 0; k < cnt; k++) {
      const a = pts[closed ? (k - 1 + cnt) % cnt : Math.max(0, k - 1)];
      const b = pts[closed ? (k + 1) % cnt : Math.min(cnt - 1, k + 1)];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      P.tx.push((b[0] - a[0]) / d); P.ty.push((b[1] - a[1]) / d);
    }
    // Safe speed at every point: tight bends (small radius) = slower.
    // Then walk backwards so cars start braking BEFORE the bend.
    const v = [];
    for (let k = 0; k < cnt; k++) {
      const ia = closed ? (k - 3 + cnt) % cnt : Math.max(0, k - 3);
      const ib = closed ? (k + 3) % cnt : Math.min(cnt - 1, k + 3);
      const ang = Math.abs(math.angleDiff(Math.atan2(P.ty[ia], P.tx[ia]), Math.atan2(P.ty[ib], P.tx[ib])));
      const radius = (6 * step) / Math.max(ang, 0.001);
      v.push(Math.min(2000, STEER * 0.9 * radius));
    }
    for (let pass = 0; pass < 2; pass++) {
      for (let k = cnt - 2 + (closed ? 1 : 0); k >= 0; k--) {
        const nx = closed ? (k + 1) % cnt : k + 1;
        v[k] = Math.min(v[k], Math.sqrt(v[nx] * v[nx] + 2 * 550 * step));
      }
    }
    P.vlim = v;
    return P;
  }

  // Point (and direction) at distance s along a path.
  function pointAt(P, s) {
    if (P.closed) s = ((s % P.L) + P.L) % P.L; else s = math.clamp(s, 0, P.L);
    const cnt = P.pts.length;
    let i = Math.floor(s / P.step);
    let f = s / P.step - i;
    if (!P.closed && i >= cnt - 1) { i = cnt - 2; f = 1; }
    const j = P.closed ? (i + 1) % cnt : i + 1;
    i = i % cnt;
    const a = P.pts[i], b = P.pts[j];
    return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, tx: P.tx[i], ty: P.ty[i], i };
  }
  const vlimAt = (P, s) => P.vlim[pointAt(P, s).i];

  // Nearest point on a path to (x, y). hint < 0 = search everything,
  // otherwise only look near segment `hint` (fast, and keeps cars from
  // "jumping" to a different part of the track that happens to be close).
  function nearest(P, x, y, hint = -1, win = 30) {
    const cnt = P.pts.length, segs = P.closed ? cnt : cnt - 1;
    let best = null, bd = Infinity;
    const test = (i) => {
      const a = P.pts[i], b = P.pts[(i + 1) % cnt];
      const q = math.nearestOnSegment(x, y, a[0], a[1], b[0], b[1]);
      const d = (x - q.x) * (x - q.x) + (y - q.y) * (y - q.y);
      if (d < bd) { bd = d; best = { i, t: q.t, x: q.x, y: q.y }; }
    };
    if (hint < 0) for (let i = 0; i < segs; i++) test(i);
    else for (let k = -win; k <= win; k++) {
      let i = hint + k;
      if (P.closed) i = (i + segs) % segs; else if (i < 0 || i >= segs) continue;
      test(i);
    }
    const a = P.pts[best.i], b = P.pts[(best.i + 1) % cnt];
    const sx = b[0] - a[0], sy = b[1] - a[1];
    best.dist = Math.sqrt(bd);
    best.s = (best.i + best.t) * P.step;
    best.side = Math.sign(sx * (y - best.y) - sy * (x - best.x)) || 1;  // which side of the road
    return best;
  }

  // ---------------------------------------------------------------
  // Build a track once: centerline, shortcut, checkpoints, scenery
  // ---------------------------------------------------------------
  const built = {};
  function buildTrack(def) {
    if (built[def.id]) return built[def.id];
    const main = makePath(spline(def.pts, true), true);
    const T = { def, main, hw: def.hw, L: main.L, theme: THEMES[def.theme], short: null, shw: 54 };
    // shortcut: snap its ends onto the centerline
    if (def.short) {
      const a = nearest(main, def.short.from[0], def.short.from[1]);
      const b = nearest(main, def.short.to[0], def.short.to[1]);
      const pa = main.pts[a.i], pb = main.pts[b.i];
      T.short = makePath(spline([pa, ...def.short.via, pb], false, 30), false);
      T.sA = a.i * main.step; T.sB = b.i * main.step;
    }
    // checkpoints spread round the lap (none inside a shortcut's range, so
    // taking the shortcut can never "miss" one)
    const K = Math.max(5, Math.round(T.L / 600));
    T.cps = [];
    for (let k = 0; k < K; k++) {
      const s = (k + 0.5) * T.L / K;
      if (T.short && s > T.sA - 150 && s < T.sB + 150) continue;
      T.cps.push(s);
    }
    // the world box (everything we might ever draw)
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of main.pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const m = T.hw + BOUND + 260;
    T.box = { x0: x0 - m, y0: y0 - m, x1: x1 + m, y1: y1 + m };
    T.raw = { x0, y0, x1, y1 };
    // Path2D objects for fast drawing
    const toPath = (P) => { const p = new Path2D(); P.pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); if (P.closed) p.closePath(); return p; };
    T.mainPath = toPath(main);
    if (T.short) T.shortPath = toPath(T.short);
    // How far a spot is from any drivable surface (used for scenery)
    const far = (x, y) => {
      const dm = nearest(main, x, y).dist - T.hw - BOUND;
      const ds = T.short ? nearest(T.short, x, y).dist - T.shw - SHORT_BOUND : Infinity;
      return { dm, ds, d: Math.min(dm, ds) };
    };
    // soft-wall markers (hay bales / buoys / snowballs) along the outside edge
    T.edge = [];
    for (let k = 0; k < main.pts.length; k += 3) {
      for (const side of [-1, 1]) {
        const [px, py] = main.pts[k];
        const x = px - main.ty[k] * side * (T.hw + BOUND), y = py + main.tx[k] * side * (T.hw + BOUND);
        if (far(x, y).d > -4) T.edge.push([x, y]);
      }
    }
    if (T.short) for (let k = 2; k < T.short.pts.length - 2; k += 3) {
      for (const side of [-1, 1]) {
        const [px, py] = T.short.pts[k];
        const x = px - T.short.ty[k] * side * (T.shw + SHORT_BOUND), y = py + T.short.tx[k] * side * (T.shw + SHORT_BOUND);
        if (far(x, y).d > -4) T.edge.push([x, y]);
      }
    }
    // scenery: big things beyond the wall, little things on the grass
    const rnd = math.seeded(def.id.charCodeAt(1) * 977);
    T.decor = []; T.small = [];
    const area = (T.box.x1 - T.box.x0) * (T.box.y1 - T.box.y0);
    for (let k = 0; k < area / 9000; k++) {
      const x = T.box.x0 + rnd() * (T.box.x1 - T.box.x0), y = T.box.y0 + rnd() * (T.box.y1 - T.box.y0);
      const f = far(x, y);
      if (f.d > 46) T.decor.push({ x, y, r: 0.8 + rnd() * 0.5, k: rnd(), a: rnd() * 6.28 });
      else if (f.dm < -18 && f.dm > -(BOUND - 28) && f.ds > -SHORT_BOUND + 10 && rnd() < 0.5) T.small.push({ x, y, k: rnd(), a: rnd() * 6.28 });
    }
    // little picture of the track for the menu tile and the minimap
    T.pic = (wpx, hpx, pad) => {
      const sc = Math.min((wpx - pad * 2) / (x1 - x0), (hpx - pad * 2) / (y1 - y0));
      const ox = (wpx - (x1 - x0) * sc) / 2 - x0 * sc, oy = (hpx - (y1 - y0) * sc) / 2 - y0 * sc;
      return { sc, ox, oy };
    };
    built[def.id] = T;
    return T;
  }

  // ---------------------------------------------------------------
  // Game state
  // ---------------------------------------------------------------
  let T, theme, cars, player, hazards, boxes, bubbles, skids, popups, fx;
  let mode = 'free', wallet = null, bonusCoins = 0, raceNo = 1;   // race mode, whose coins/upgrades, coin-bag coins this race
  let countdown, raceTime, laps, camX, camY, endTimer, finishOrder, autopilot, sawShortcut;

  function pickedCar(g) {
    return PAINTS.find(c => c.id === g.save.data.paint) || PAINTS[0];
  }
  function bestPlace(g, id) { return ((g.save.data.place || {})[id]) || 99; }
  // A "wallet" holds coins + upgrade levels. Free play has one that you keep;
  // every Grand Prix starts a fresh one (stock car, no coins) in g.save.data.cup.
  const upLevel = (w, id) => ((w.up || {})[id]) || 0;
  const coins = (w) => w.coins || 0;
  // Your car's stats = the same base as everyone + your upgrades.
  function playerStats(w) {
    const st = { ...BASE };
    for (const u of UPGRADES) u.apply(st, upLevel(w, u.id));
    return st;
  }
  const cupOf = (g) => g.save.data.cup;
  function newCup(g) {
    g.save.data.cup = { active: true, race: 0, coins: 0, up: {}, points: {} };
    g.store();
  }

  function makeCar(stats, color, name, isPlayer, s, lat) {
    const p = pointAt(T.main, s);
    return {
      name, color, isPlayer, stats,
      x: p.x - p.ty * lat, y: p.y + p.tx * lat, a: Math.atan2(p.ty, p.tx), vx: 0, vy: 0,
      hint: p.i, s, lap: 0, cp: T.cps.length, progress: 0, position: 1,
      finished: false, finishTime: 0, lapStart: 0, lapTimes: [],
      item: null, boost: 0, shield: 0, spin: 0, bubbled: 0, ghost: 0, inPuddle: false,
      surface: 'road', onShort: false, wrongWay: 0, slowT: 0, bumpCool: 0,
      skidL: null, skidR: null, wheel: 0,
      // brain (AI only)
      ai: isPlayer ? null : { lane: lat / T.hw, laneTarget: lat / T.hw, laneT: 0, mode: 'main', decided: -1, stuck: 0, reverse: 0, stuckCount: 0, offRoad: 0, wobble: 0, wobbleT: 0, holdT: 0, skill: 1 },
    };
  }

  function setup(g, level) {
    // Grand Prix (tiles 'cup' / 'cupnew') or free play (a track tile)?
    let def;
    if (level && (level.id === 'cup' || level.id === 'cupnew')) {
      if (level.id === 'cupnew' || !cupOf(g) || !cupOf(g).active) newCup(g);
      mode = 'cup';
      wallet = cupOf(g);
      def = TRACKS[wallet.race];
      raceNo = wallet.race + 1;            // for the HUD ("Race 3/8")
    } else {
      mode = 'free';
      wallet = g.save.data;
      def = TRACKS.find(t => t.id === (level && level.id)) || TRACKS[0];
    }
    T = buildTrack(def);
    bonusCoins = 0;
    theme = T.theme;
    document.body.style.setProperty('--ar-bg', theme.outer);
    laps = 3;
    const ti = TRACKS.findIndex(t => t.id === T.def.id);
    countdown = 3.2; raceTime = 0; endTimer = -1;
    popups = []; bubbles = []; skids = []; finishOrder = [];
    fx = new Arcade.Particles();
    autopilot = false; sawShortcut = -1;
    g.beeped = 4;

    // ---- the four racers on the starting grid (2 x 2, just behind the line) ----
    const mine = pickedCar(g);
    const rivals = RIVALS.filter(r => r.color !== mine.color).slice(0, 3);
    const slots = [[70, -0.42], [70, 0.42], [160, -0.42], [160, 0.42]];
    const pSlot = 3;                     // you start at the back: pass them all!
    const skill = rivalSkill(ti);
    const flavor = [1.03, 1.0, 0.96];  // each rival is a little different
    cars = [];
    let r = 0;
    for (let k = 0; k < 4; k++) {
      const [back, lat] = slots[k];
      if (k === pSlot) {
        player = makeCar(playerStats(wallet), mine.color, 'You', true, T.L - back, lat * T.hw);
        cars.push(player);
      } else {
        const st = { ...BASE, top: BASE.top * skill.top * flavor[r], accel: BASE.accel * (0.9 + skill.top * 0.1) };
        const c = makeCar(st, rivals[r].color, rivals[r].name, false, T.L - back, lat * T.hw);
        c.ai.skill = skill; c.ai.flavor = flavor[r];
        cars.push(c); r++;
      }
    }

    // ---- gift boxes (items), in rows across the road ----
    boxes = [];
    for (const f of T.def.items) {
      for (const lat of [-0.5, 0, 0.5]) {
        const p = pointAt(T.main, f * T.L);
        boxes.push({ x: p.x - p.ty * lat * T.hw, y: p.y + p.tx * lat * T.hw, t: 0, spin: Math.random() * 6 });
      }
    }

    // ---- hazards: oil slicks and puddles (always with a clear lane beside them) ----
    hazards = [];
    const count = 2 + Math.round(ti * 0.7);   // more puddles + oil on later tracks
    const rnd = math.seeded(T.def.id.charCodeAt(1) * 31 + count);
    const busy = T.def.items.map(f => f * T.L);
    let tries = 0;
    while (hazards.length < count && tries++ < 400) {
      const s = 500 + rnd() * (T.L - 900);
      const near = (a, b, d) => Math.abs(a - b) < d;
      if (busy.some(b => near(s, b, 260)) || hazards.some(h => near(s, h.s, 380))) continue;
      if (T.short && (near(s, T.sA, 200) || near(s, T.sB, 200))) continue;
      const lat = (rnd() < 0.5 ? -1 : 1) * (0.3 + rnd() * 0.25) * T.hw;
      const p = pointAt(T.main, s);
      hazards.push({ kind: hazards.length % 2 ? 'puddle' : 'oil', s, lat, x: p.x - p.ty * lat, y: p.y + p.tx * lat, r: hazards.length % 2 ? 40 : 34, seed: rnd() * 10 });
    }
    // a puddle in the middle of the shortcut (it's still worth it!)
    if (T.short) {
      const p = pointAt(T.short, T.short.L * 0.5);
      hazards.push({ kind: 'puddle', s: -1, lat: 0, x: p.x, y: p.y, r: 36, seed: 3, onShort: true });
    }

    for (const c of cars) locate(c, true);
    camX = player.x - W / 2; camY = player.y - H / 2;
    rankCars();

    // ---- peek hooks for automated tests ----
    window.__rcState = () => ({
      track: T.def.id, laps, L: T.L, countdown, raceTime, finished: player.finished, over: g.state === 'over',
      player: snap(player),
      racers: cars.map(snap),
      finishOrder: finishOrder.map(c => c.name),
      mode, cup: cupOf(g) ? JSON.parse(JSON.stringify(cupOf(g))) : null, coins: coins(wallet), bonusCoins,
    });
    // test-only: run the race faster than real time (pause the kit loop first)
    window.__rcStep = (sec) => { for (let i = 0; i < sec * 120 && g.state !== 'over'; i++) { update(g, 1 / 120); g.particles.update(1 / 120); } };
    window.__rcGive = (item) => { player.item = item; player.itemCount = item === 'triple' ? 3 : 0; };   // test-only
    window.__rcAuto = (on) => { autopilot = on !== false; };  // test-only autopilot for the player car
    window.__rcCars = () => cars;                                 // test-only: raw car objects
  }
  const snap = c => ({ name: c.name, x: Math.round(c.x), y: Math.round(c.y), lap: c.lap, cp: c.cp, s: Math.round(c.s), progress: Math.round(c.progress), position: c.position, finished: c.finished, finishTime: c.finishTime, lapTimes: c.lapTimes.slice(), speed: Math.round(Math.hypot(c.vx, c.vy)), surface: c.surface, item: c.item, onShort: c.onShort });

  function popup(text, x, y, color = '#ffd166', size = 30) { popups.push({ text, x, y, t: 0, color, size }); }

  // ---------------------------------------------------------------
  // Where is this car on the track? (s, surface, laps, checkpoints)
  // ---------------------------------------------------------------
  function locate(c, first) {
    let m = nearest(T.main, c.x, c.y, first ? -1 : c.hint, 30);
    // far from the road we were on? maybe we're near a different part of the track now
    if (m.dist > T.hw + 60) { const gl = nearest(T.main, c.x, c.y); if (gl.dist < m.dist - 40) m = gl; }
    c.hint = m.i; c.near = m;
    let sc = null;
    if (T.short) { sc = nearest(T.short, c.x, c.y); c.nearShort = sc; }
    // which surface are we on?
    c.onShort = !!(sc && sc.dist < T.shw + 60 && m.dist > T.hw - 10 && sc.s > 4 && sc.s < T.short.L - 4);
    c.surface = m.dist < T.hw ? 'road' : (sc && sc.dist < T.shw) ? T.theme.shortKind : 'grass';
    // distance round the lap. On the shortcut, we map how far along it you
    // are onto the road it skips — so the shortcut counts, fairly.
    const prevS = c.s;
    c.s = c.onShort ? T.sA + (sc.s / T.short.L) * (T.sB - T.sA) : m.s;
    if (first) return;
    // checkpoints must be touched in order
    const cps = T.cps;
    if (c.cp < cps.length && c.s >= cps[c.cp] && c.s < cps[c.cp] + 400) c.cp++;
    // crossing the start line
    const ds = c.s - prevS;
    if (ds < -T.L / 2) {                 // forwards over the line
      if (c.cp === cps.length) { c.cp = 0; c.lap++; onLap(c); }
    } else if (ds > T.L / 2) {           // backwards over the line: undo
      if (c.cp === 0 && c.lap > 0) { c.lap--; c.cp = cps.length; }
    }
    // progress for the race order (a skipped checkpoint caps it)
    const capped = c.cp < cps.length ? Math.min(c.s, cps[c.cp] + 400) : c.s;
    c.progress = c.lap * T.L + capped;
  }

  let gRef = null;
  function onLap(c) {
    const g = gRef;
    if (c.lap >= 2) c.lapTimes.push(Math.round((raceTime - c.lapStart) * 100) / 100);
    c.lapStart = raceTime;
    if (c.lap > laps && !c.finished) {
      c.finished = true; c.finishTime = Math.round(raceTime * 100) / 100;
      finishOrder.push(c);
      if (c.isPlayer) {
        g.sfx('win');
        popup('Finish!', c.x, c.y - 60, '#06d6a0', 48);
        g.particles.burst(W / 2, 140, { count: 50, shape: 'star', speed: 340, size: 16 });
        endTimer = 2.2;
      }
      return;
    }
    if (c.isPlayer && c.lap >= 2) {
      if (c.lap === laps) { g.sfx('unlock'); popup('Last lap!', c.x, c.y - 60, '#f15bb5', 40); }
      else { g.sfx('star'); popup('Lap ' + c.lap + '!', c.x, c.y - 60, '#ffd166', 40); }
    }
  }

  // ---------------------------------------------------------------
  // Driving: the same physics for you and the computer cars
  // inp = { gas, brake, steer (-1..1) }
  // ---------------------------------------------------------------
  function drive(g, c, inp, dt) {
    const st = c.stats;
    let topMul = 1, accMul = 1, grip = st.grip, drag = 0;
    if (c.surface === 'grass') { topMul = g.pick(0.6, 0.5, 0.45); grip *= 0.75; drag = 1.2; }
    else if (c.surface === 'dirt') topMul = 0.88;
    else if (c.surface === 'planks') topMul = 0.92;
    else if (c.surface === 'ice') { topMul = 1.0; grip *= 0.3; }
    if (c.inPuddle) topMul *= 0.7;
    if (c.bubbled > 0) topMul *= 0.35;
    if (c.boost > 0) { topMul *= 1.4 + (st.nitro - 1) * 0.25; accMul = 2.2; }   // nitro upgrade = stronger boost
    const top = st.top * topMul;

    let { gas, brake, steer } = inp;
    if (c.spin > 0) { gas = brake = false; steer = 0; }

    // turn first (you can't turn a parked car; reversing turns the other way)
    let fx = Math.cos(c.a), fy = Math.sin(c.a);
    let vF = c.vx * fx + c.vy * fy;
    const turn = steer * STEER * st.steer * math.clamp(vF / 120, -1, 1) * (vF > 0 ? 1 - 0.18 * Math.min(1, vF / st.top) : 1);
    c.a += turn * dt;
    if (c.spin > 0) { c.a += 12 * dt; c.spin -= dt; }

    // split the velocity into "forwards" and "sideways" for the new heading
    fx = Math.cos(c.a); fy = Math.sin(c.a);
    vF = c.vx * fx + c.vy * fy;
    let vR = -c.vx * fy + c.vy * fx;

    if (gas) {
      if (vF < top) vF += st.accel * accMul * (1 - 0.55 * Math.max(0, vF) / Math.max(1, top)) * dt;
    }
    if (brake) {
      if (vF > 15) vF -= 750 * dt;
      else vF = Math.max(-st.top * 0.4, vF - 320 * dt);   // reverse
    }
    if (!gas && !brake) vF -= Math.sign(vF) * Math.min(Math.abs(vF), 140 * dt);  // coasting
    if (vF > top) vF -= (vF - top) * 2.4 * dt;          // too fast for this ground: ease down (never a dead stop)
    vF -= vF * drag * dt * 0.3;
    if (c.spin > 0) vF *= Math.exp(-1.2 * dt);

    vR *= Math.exp(-grip * dt);                          // grip: sideways sliding fades away
    c.slip = vR;
    c.vx = fx * vF - fy * vR; c.vy = fy * vF + fx * vR;
    c.x += c.vx * dt; c.y += c.vy * dt;
    c.vF = vF;
    c.wheel += vF * dt;
  }

  // Soft walls: past the grass there's a bumpy edge that nudges you back.
  function walls(g, c) {
    const m = c.near, sc = c.nearShort;
    const overM = m.dist - (T.hw + BOUND);
    const overS = sc ? sc.dist - (T.shw + SHORT_BOUND) : Infinity;
    if (overM <= 0 || overS <= 0) return;
    // push back toward whichever surface is closer
    const useS = overS < overM;
    const q = useS ? sc : m, over = useS ? overS : overM;
    const nx = (c.x - q.x) / (q.dist || 1), ny = (c.y - q.y) / (q.dist || 1);
    c.x -= nx * over; c.y -= ny * over;
    const vn = c.vx * nx + c.vy * ny;
    if (vn > 0) {
      c.vx -= nx * vn * 1.35; c.vy -= ny * vn * 1.35;
      c.vx *= 0.85; c.vy *= 0.85;
      if (vn > 110 && c.bumpCool <= 0) {
        c.bumpCool = 0.3;
        if (c.isPlayer) g.sfx('bonk');
        fx.burst(c.x + nx * 18, c.y + ny * 18, { count: 6, colors: [theme.edge, '#ffffff', '#ffd166'], speed: 120, gravity: 0, size: 8, life: 0.4 });
      }
    }
  }

  // ---------------------------------------------------------------
  // Computer drivers
  // ---------------------------------------------------------------
  // A point `d` px ahead of the car on the line it wants to follow.
  function aiTarget(c, d) {
    const ai = c.ai;
    const offset = ai.lane * T.hw;
    if (ai.mode === 'short' && T.short) {
      if (c.onShort) {
        const along = c.nearShort.s + d;
        if (along <= T.short.L) return pointAt(T.short, along);
        const p = pointAt(T.main, T.sB + (along - T.short.L)); return p;
      }
      const toEntry = T.sA - c.s;
      if (toEntry > -40 && toEntry < d) return pointAt(T.short, Math.max(0, d - Math.max(0, toEntry)));
    }
    const p = pointAt(T.main, c.s + d);
    const k = Math.min(1, d / 120);  // ease into our lane
    return { x: p.x - p.ty * offset * k, y: p.y + p.tx * offset * k, tx: p.tx, ty: p.ty };
  }

  function aiControl(g, c, dt, pilot) {
    const ai = c.ai;
    const vF = c.vF || 0;
    const sk = ai.skill;
    // --- choose a lane, dodge hazards ahead ---
    ai.laneT -= dt;
    if (ai.laneT <= 0) { ai.laneT = 2 + Math.random() * 3; ai.laneTarget = (Math.random() - 0.5) * 0.7; }
    let want = ai.laneTarget;
    for (const h of hazards) {
      if (h.onShort) continue;
      let ahead = h.s - c.s; if (ahead < -T.L / 2) ahead += T.L;
      if (ahead > 0 && ahead < 320 && Math.abs(h.lat - want * T.hw) < h.r + 34) {
        want = h.lat > 0 ? Math.max(-0.6, (h.lat - h.r - 50) / T.hw) : Math.min(0.6, (h.lat + h.r + 50) / T.hw);
        if (Math.abs(want) > 0.6) want = -Math.sign(h.lat) * 0.5;
      }
    }
    ai.lane += (want - ai.lane) * Math.min(1, dt * 1.5);

    // --- shortcut decision, once per lap as we get near it ---
    if (T.short) {
      const before = T.sA - c.s;
      if (ai.mode === 'main' && before > 200 && before < 600 && ai.decided !== c.lap) {
        ai.decided = c.lap;
        if (Math.random() < sk.shortcut) ai.mode = 'short';
      }
      if (ai.mode === 'short' && !c.onShort && (c.s > T.sA + 120 && c.s < T.sB + 400 || c.s > T.sB + 60)) {
        if (c.near.dist < T.hw) ai.mode = 'main';   // missed it or done with it
      }
    }

    // --- steering toward a point ahead ---
    const look = 60 + Math.abs(vF) * 0.42;
    const tp = aiTarget(c, look);
    const wantA = Math.atan2(tp.y - c.y, tp.x - c.x);
    const diff = math.angleDiff(c.a, wantA);
    // little mistakes: a wobble now and then
    ai.wobbleT -= dt;
    if (ai.wobbleT <= 0 && !pilot && Math.random() < sk.oops * dt) { ai.wobbleT = 0.3 + Math.random() * 0.4; ai.wobble = (Math.random() < 0.5 ? -1 : 1) * 0.8; }
    let steer = math.clamp(diff * 2.6, -1, 1) + (ai.wobbleT > 0 ? ai.wobble : 0);

    // --- speed: slow down for bends ahead ---
    const P = ai.mode === 'short' && c.onShort ? T.short : T.main;
    const sHere = P === T.short ? c.nearShort.s : c.s;
    let limit = Math.min(vlimAt(P, sHere), vlimAt(P, sHere + 50)) * sk.corner;
    let topWant = c.stats.top;
    // stay close together so the race is exciting (gentle)
    if (!pilot && !player.finished) {
      const gap = c.progress - player.progress;
      if (gap > 500) topWant *= g.pick(0.86, 0.92, 0.96);
      else if (gap < -700) topWant *= g.pick(1.05, 1.07, 1.06);
    }
    if (c.finished && !pilot) topWant *= 0.6;
    const target = Math.min(topWant, limit);
    let gas = vF < target, brake = vF > target + 45;
    if (Math.abs(diff) > 1.3 && vF > 160) { gas = false; brake = true; }

    // --- stuck? back up a bit; really stuck = pop back onto the road ---
    if (ai.reverse > 0) {
      ai.reverse -= dt;
      return { gas: false, brake: true, steer: -Math.sign(diff) || 1 };
    }
    const moving = Math.hypot(c.vx, c.vy);
    if (moving < 35 && c.spin <= 0 && c.bubbled <= 0) ai.stuck += dt; else ai.stuck = Math.max(0, ai.stuck - dt * 2);
    if (c.surface === 'grass' && c.near.dist > T.hw + 50) ai.offRoad += dt; else ai.offRoad = 0;
    if (ai.stuck > 1.2) { ai.stuck = 0; ai.reverse = 0.8; ai.stuckCount++; }
    if (ai.stuckCount >= 3 || ai.offRoad > 4) { respawn(g, c); ai.stuckCount = 0; ai.offRoad = 0; }
    return { gas, brake, steer: math.clamp(steer, -1, 1) };
  }

  // Lift a car gently back onto the road (with a sparkly "poof").
  function respawn(g, c) {
    fx.burst(c.x, c.y, { count: 14, shape: 'star', gravity: 0, speed: 160, size: 12, life: 0.6 });
    const p = pointAt(T.main, c.near.s);
    let lat = 0;
    for (const o of cars) if (o !== c && Math.hypot(o.x - p.x, o.y - p.y) < 60) lat = lat ? -lat : 0.4 * T.hw;
    c.x = p.x - p.ty * lat; c.y = p.y + p.tx * lat;
    c.a = Math.atan2(p.ty, p.tx); c.vx = p.tx * 60; c.vy = p.ty * 60;
    c.spin = 0; c.ghost = 1.2; c.hint = p.i;
    if (c.ai) { c.ai.mode = 'main'; c.ai.reverse = 0; c.ai.stuck = 0; }
    fx.burst(c.x, c.y, { count: 14, shape: 'star', gravity: 0, speed: 160, size: 12, life: 0.6 });
    if (c.isPlayer) g.sfx('spring');
  }

  // ---------------------------------------------------------------
  // Items
  // ---------------------------------------------------------------
  // What's in a gift box depends on your place: cars at the back get more speed.
  //   boost  = a burst of speed          triple = three boosts in a row
  //   star   = Super Star: fast + safe   shield = nothing can spin or bubble you
  //   bubble = floats the car ahead      honey  = drop a sticky puddle behind you
  //   coins  = a bag of bonus coins (only you get these)
  const ITEM_ODDS = {
    front:  { shield: 30, bubble: 22, honey: 26, boost: 12, coins: 10 },
    middle: { boost: 22, bubble: 20, shield: 14, honey: 16, triple: 12, coins: 10, star: 6 },
    back:   { boost: 24, triple: 22, star: 16, bubble: 16, shield: 10, coins: 12 },
  };
  function giveItem(c) {
    const odds = ITEM_ODDS[c.position === 1 ? 'front' : c.position >= 3 ? 'back' : 'middle'];
    let total = 0; for (const k in odds) total += odds[k];
    let r = Math.random() * total;
    for (const k in odds) { r -= odds[k]; if (r <= 0) { c.item = k; break; } }
    if (c.item === 'coins' && !c.isPlayer) c.item = 'boost';
    c.itemCount = c.item === 'triple' ? 3 : 0;
  }

  function useItem(g, c) {
    const it = c.item; if (!it) return;
    c.item = null;
    if (it === 'triple') {                 // one of three boosts
      c.itemCount = (c.itemCount || 1) - 1;
      if (c.itemCount > 0) c.item = 'triple';
      c.boost = 1.1 * (c.stats.nitro || 1);
      if (c.isPlayer) { g.sfx('boost'); popup('Boost!', c.x, c.y - 50, '#ff8c42'); }
    } else if (it === 'star') {            // Super Star: speedy and nothing can stop you
      c.star = 3.2; c.shield = Math.max(c.shield, 3.2); c.boost = Math.max(c.boost, 3.2 * (c.stats.nitro || 1) * 0.8);
      if (c.isPlayer) { g.sfx('star'); popup('Super Star!', c.x, c.y - 50, '#ffd166'); }
    } else if (it === 'honey') {           // drop a sticky honey puddle behind you
      const hx = c.x - Math.cos(c.a) * 52, hy = c.y - Math.sin(c.a) * 52;
      const s = (c.s - 52 + T.L) % T.L, p = pointAt(T.main, s);
      const lat = -(hx - p.x) * p.ty + (hy - p.y) * p.tx;
      hazards.push({ kind: 'honey', s, lat, x: hx, y: hy, r: 40, seed: Math.random() * 10, life: 14, owner: c, ownerT: 1.2 });
      if (c.isPlayer) { g.sfx('splash'); popup('Honey!', c.x, c.y - 50, '#ffb703'); }
    } else if (it === 'coins') {           // bonus coins, added at the finish
      const add = Math.round(30 * (1 + 0.25 * TRACKS.findIndex(t => t.id === T.def.id)));
      bonusCoins += add;
      if (c.isPlayer) { g.sfx('coin'); popup('+' + add + ' coins!', c.x, c.y - 50, '#ffc93c'); fx.burst(c.x, c.y, { count: 14, colors: ['#ffc93c', '#ffd166', '#fff'], speed: 200, gravity: 0, size: 10, life: 0.6 }); }
    } else if (it === 'boost') {
      c.boost = 1.3 * (c.stats.nitro || 1);                 // nitro upgrade = longer boost
      if (c.isPlayer) { g.sfx('boost'); popup('Boost!', c.x, c.y - 50, '#ff8c42'); }
    } else if (it === 'shield') {
      c.shield = 6;
      if (c.isPlayer) { g.sfx('power'); popup('Shield!', c.x, c.y - 50, '#4cc9f0'); }
    } else if (it === 'bubble') {
      // aim at the closest car ahead of us in the race
      let target = null, bd = 900;
      for (const o of cars) {
        if (o === c || o.finished) continue;
        if (o.progress <= c.progress) continue;
        const d = Math.hypot(o.x - c.x, o.y - c.y);
        if (d < bd) { bd = d; target = o; }
      }
      const sp = 640 + Math.max(0, c.vF || 0);
      bubbles.push({ x: c.x + Math.cos(c.a) * 30, y: c.y + Math.sin(c.a) * 30, vx: Math.cos(c.a) * sp, vy: Math.sin(c.a) * sp, owner: c, target, life: 2.4 });
      if (c.isPlayer) { g.sfx('pop'); popup('Bubble!', c.x, c.y - 50, '#9bf6ff'); }
      else if (target && target.isPlayer) g.sfx('pop');
    }
  }

  // When should the computer use its item?
  function aiItem(g, c, dt) {
    const ai = c.ai;
    if (!c.item) { ai.holdT = 0; return; }
    ai.holdT += dt;
    let use = false;
    if (c.item === 'triple') use = c.near.dist < T.hw || ai.holdT > 3;
    else if (c.item === 'star') use = c.near.dist < T.hw;
    else if (c.item === 'honey') use = cars.some(o => o !== c && !o.finished && o.progress < c.progress && c.progress - o.progress < 350) || ai.holdT > 6;
    else if (c.item === 'boost') use = c.near.dist < T.hw && vlimAt(T.main, c.s + 250) > c.stats.top * 0.95 && vlimAt(T.main, c.s + 100) > c.stats.top * 0.95 || ai.holdT > 5;
    else if (c.item === 'shield') use = hazards.some(h => { const d = h.s - c.s; return d > 0 && d < 260; }) || ai.holdT > 4;
    else if (c.item === 'bubble') use = cars.some(o => o !== c && !o.finished && o.progress > c.progress && o.progress - c.progress < 600) || ai.holdT > 7;
    if (use && ai.holdT > 0.6) useItem(g, c);
  }

  // ---------------------------------------------------------------
  // Update (dt = 1/120 s)
  // ---------------------------------------------------------------
  function update(g, dt) {
    gRef = g;
    const inp = g.input;
    for (const p of popups) { p.t += dt; p.y -= 30 * dt; }
    popups = popups.filter(p => p.t < 1.2);
    fx.update(dt);

    // 3, 2, 1, GO!
    if (countdown > 0) {
      countdown -= dt;
      const n = Math.ceil(countdown - 0.2);
      if (n !== g.beeped && n >= 1 && n <= 3) { g.beeped = n; g.sfx('beep'); }
      if (countdown <= 0) g.sfx('go');
      // little engine puffs while we wait
      if (Math.random() < dt * 8) { const c = cars[(Math.random() * 4) | 0]; fx.burst(c.x - Math.cos(c.a) * 26, c.y - Math.sin(c.a) * 26, { count: 1, colors: ['#ffffff', '#dddddd'], speed: 40, gravity: 0, size: 10, life: 0.5 }); }
      follow(dt);
      return;
    }
    raceTime += dt;
    // honey puddles dry up after a while
    for (const h of hazards) if (h.kind === 'honey') { h.life -= dt; h.ownerT -= dt; }
    hazards = hazards.filter(h => h.kind !== 'honey' || h.life > 0);

    for (const c of cars) {
      // ---- controls ----
      let ctl;
      if (c.isPlayer && !c.finished && !autopilot) {
        const left = inp.down('ArrowLeft', 'KeyA'), right = inp.down('ArrowRight', 'KeyD');
        const brake = inp.down('ArrowDown', 'KeyS');
        const gas = inp.down('ArrowUp', 'KeyW');
        let steer = (right ? 1 : 0) - (left ? 1 : 0);
        // a gentle helping hand keeps the car pointing along the road
        if (!steer && c.surface === 'road') {
          const d = math.angleDiff(c.a, Math.atan2(T.main.ty[c.near.i], T.main.tx[c.near.i]));
          if (Math.abs(d) < 1.2) steer = math.clamp(d * 0.5, -0.2, 0.2);
        }
        ctl = { gas, brake, steer };
        if (inp.hit('Space', 'Enter', 'KeyX')) useItem(g, c);
      } else {
        if (c.isPlayer && !c.ai) c.ai = { lane: 0, laneTarget: 0, laneT: 0, mode: 'main', decided: -1, stuck: 0, reverse: 0, stuckCount: 0, offRoad: 0, wobble: 0, wobbleT: 0, holdT: 0, skill: { top: 1, corner: 0.88 + 0.02 * upLevel(wallet, 'tires'), oops: 0, shortcut: 0.6 } };  // (test autopilot: better tires = faster corners)
        ctl = aiControl(g, c, dt, c.isPlayer);
        if (c.isPlayer && c.finished) { ctl.gas = (c.vF || 0) < 150; ctl.brake = (c.vF || 0) > 220; }
        if (c.isPlayer && !c.finished && c.item) useItem(g, c);
        else if (!c.isPlayer) aiItem(g, c, dt);
      }

      // ---- timers ----
      c.boost = Math.max(0, c.boost - dt);
      c.shield = Math.max(0, c.shield - dt);
      c.bubbled = Math.max(0, c.bubbled - dt);
      c.ghost = Math.max(0, c.ghost - dt);
      c.bumpCool = Math.max(0, c.bumpCool - dt);
      c.oilCool = Math.max(0, (c.oilCool || 0) - dt);
      c.star = Math.max(0, (c.star || 0) - dt);
      if (c.star > 0 && Math.random() < dt * 30) fx.burst(c.x, c.y, { count: 1, shape: 'star', speed: 80, gravity: 0, size: 12, life: 0.5 });

      drive(g, c, ctl, dt);
      locate(c);
      walls(g, c);

      // ---- hazards ----
      let puddle = false;
      for (const h of hazards) {
        if (Math.hypot(c.x - h.x, c.y - h.y) > h.r + 4) continue;
        if (h.owner === c && h.ownerT > 0) continue;      // you don't get stuck in your own honey right away
        if (h.kind === 'oil') {
          // (oilCool: after a spin you get a moment to drive off the slick,
          //  otherwise a car that stopped on the oil would spin forever)
          if (c.spin <= 0 && c.shield <= 0 && c.ghost <= 0 && !(c.oilCool > 0)) {
            c.spin = g.pick(0.55, 0.8, 0.9);
            c.oilCool = c.spin + 1.5;
            c.vx *= 0.75; c.vy *= 0.75;
            if (c.isPlayer) { g.sfx('swish'); popup('Whee!', c.x, c.y - 50, '#c77dff'); }
          }
        } else {
          puddle = true;
          if (!c.inPuddle) {
            const slow = h.kind === 'honey' ? 0.45 : 0.7;     // honey is extra sticky
            if (c.shield <= 0) { c.vx *= slow; c.vy *= slow; }
            if (c.isPlayer) { g.sfx('splash'); popup('Splash!', c.x, c.y - 50, '#8ecae6'); }
            fx.burst(c.x, c.y, { count: 14, colors: ['#8ecae6', '#ffffff', '#4cc9f0'], speed: 200, gravity: 0, size: 10, life: 0.6 });
          }
        }
      }
      c.inPuddle = puddle;

      // ---- gift boxes ----
      for (const b of boxes) {
        if (b.t > 0 || Math.hypot(c.x - b.x, c.y - b.y) > 32) continue;
        b.t = 3;
        fx.burst(b.x, b.y, { count: 12, shape: 'star', speed: 180, gravity: 0, size: 12, life: 0.6 });
        if (!c.item) { giveItem(c); if (c.isPlayer) g.sfx('coin'); }
      }

      // ---- shortcut cheer (first time each lap) ----
      if (c.isPlayer && c.onShort && sawShortcut !== c.lap) { sawShortcut = c.lap; popup('Shortcut!', c.x, c.y - 50, '#ffd166'); g.sfx('whoosh'); }

      // ---- wrong way? (driving backwards along the track for a while) ----
      if (c.isPlayer) {
        const along = c.vx * T.main.tx[c.near.i] + c.vy * T.main.ty[c.near.i];
        c.wrongWay = along < -60 && !c.onShort ? c.wrongWay + dt : Math.max(0, c.wrongWay - dt * 2);
        // stuck in the grass? help out after a bit
        const sp = Math.hypot(c.vx, c.vy);
        if (!autopilot && c.near.dist > T.hw + 20 && sp < 40 && !c.onShort) c.slowT += dt; else c.slowT = 0;
        if (c.slowT > g.pick(2.5, 3.5, 4.5)) { c.slowT = 0; respawn(g, c); }
      }

      // ---- safety net: a car that hasn't really moved for 3 seconds (wedged
      // against something, spun into a corner...) gets lifted back onto the road.
      if (!c.finished) {
        if (!c.watch) c.watch = { x: c.x, y: c.y, t: 0 };
        c.watch.t += dt;
        if (Math.hypot(c.x - c.watch.x, c.y - c.watch.y) > 40) { c.watch.x = c.x; c.watch.y = c.y; c.watch.t = 0; }
        else if (c.watch.t > 3) { respawn(g, c); c.watch.t = 0; }
      }

      // ---- skid marks and dust ----
      const sp = Math.hypot(c.vx, c.vy);
      const skidding = (Math.abs(c.slip) > 85 && sp > 120) || c.spin > 0 || (c.surface === 'ice' && sp > 150);
      const ca = Math.cos(c.a), sa = Math.sin(c.a);
      const rl = [c.x - ca * 15 + sa * 12, c.y - sa * 15 - ca * 12], rr = [c.x - ca * 15 - sa * 12, c.y - sa * 15 + ca * 12];
      if (skidding && c.surface === 'road' || skidding && c.surface === 'ice') {
        if (c.skidL) { skids.push([c.skidL[0], c.skidL[1], rl[0], rl[1]], [c.skidR[0], c.skidR[1], rr[0], rr[1]]); }
        c.skidL = rl; c.skidR = rr;
        if (skids.length > 900) skids.splice(0, skids.length - 900);
      } else { c.skidL = c.skidR = null; }
      if (c.surface !== 'road' && sp > 90 && Math.random() < dt * 22) {
        const col = c.surface === 'grass' ? theme.dust : c.surface === 'ice' ? ['#ffffff', '#c4ecff'] : ['#b77940', '#e6c39a'];
        fx.burst(rl[0], rl[1], { count: 1, angle: c.a + Math.PI, spread: 0.8, speed: 70, gravity: 0, size: 12, life: 0.5, colors: col });
      }
      if (c.boost > 0 && Math.random() < dt * 40) fx.burst(c.x - ca * 26, c.y - sa * 26, { count: 1, angle: c.a + Math.PI, spread: 0.5, speed: 140, gravity: 0, size: 12, life: 0.35, colors: ['#ffd166', '#ff8c42', '#ef476f'] });
      if (c.shield > 0 && Math.random() < dt * 6) fx.burst(c.x + (Math.random() - 0.5) * 50, c.y + (Math.random() - 0.5) * 50, { count: 1, shape: 'star', speed: 20, gravity: 0, size: 10, life: 0.5, colors: ['#ffffff', '#9bf6ff'] });
    }

    collide(g);
    updateBubbles(g, dt);
    for (const b of boxes) { b.t = Math.max(0, b.t - dt); b.spin += dt; }
    rankCars();
    follow(dt);

    // after you cross the line, let the others zoom in for a moment, then show results
    if (endTimer > 0) {
      endTimer -= dt;
      if (endTimer <= 0) finishRace(g);
    }
  }

  // Cars bump like round bumper cars: push apart, bounce a little.
  function collide(g) {
    for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) {
      const a = cars[i], b = cars[j];
      if (a.ghost > 0 || b.ghost > 0) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      if (d >= CAR_R * 2 || d === 0) continue;
      const nx = dx / d, ny = dy / d;
      const ma = a.stats.mass * (a.shield > 0 ? 4 : 1), mb = b.stats.mass * (b.shield > 0 ? 4 : 1);
      const over = CAR_R * 2 - d;
      a.x -= nx * over * mb / (ma + mb); a.y -= ny * over * mb / (ma + mb);
      b.x += nx * over * ma / (ma + mb); b.y += ny * over * ma / (ma + mb);
      const vrel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (vrel < 0) {
        const jimp = -(1 + 0.4) * vrel / (1 / ma + 1 / mb);
        a.vx -= nx * jimp / ma; a.vy -= ny * jimp / ma;
        b.vx += nx * jimp / mb; b.vy += ny * jimp / mb;
        if (-vrel > 70 && (a.isPlayer || b.isPlayer) && a.bumpCool <= 0 && b.bumpCool <= 0) {
          a.bumpCool = b.bumpCool = 0.25;
          g.sfx('bonk');
          fx.burst((a.x + b.x) / 2, (a.y + b.y) / 2, { count: 6, shape: 'star', speed: 120, gravity: 0, size: 10, life: 0.4 });
        }
      }
    }
  }

  // Soap bubbles float after a car ahead; a pop = that car floats slowly for a moment.
  function updateBubbles(g, dt) {
    for (const b of bubbles) {
      b.life -= dt;
      if (b.target && !b.target.finished) {
        const want = Math.atan2(b.target.y - b.y, b.target.x - b.x);
        const sp = Math.hypot(b.vx, b.vy);
        const cur = Math.atan2(b.vy, b.vx);
        const na = cur + math.clamp(math.angleDiff(cur, want), -4 * dt, 4 * dt);
        b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp;
      }
      b.x += b.vx * dt; b.y += b.vy * dt;
      for (const c of cars) {
        if (c === b.owner || c.finished || b.life <= 0) continue;
        if (Math.hypot(c.x - b.x, c.y - b.y) < 30) {
          b.life = 0;
          fx.burst(b.x, b.y, { count: 14, colors: ['#ffffff', '#9bf6ff', '#ffc8dd'], speed: 180, gravity: 0, size: 10, life: 0.5 });
          if (c.shield > 0) { c.shield = 0; }
          else c.bubbled = c.isPlayer ? g.pick(0.7, 1.0, 1.2) : 1.2;
          if (c.isPlayer || b.owner.isPlayer) { g.sfx('pop'); popup(c.shield > 0 ? 'Blocked!' : 'Pop!', c.x, c.y - 50, '#9bf6ff'); }
        }
      }
    }
    bubbles = bubbles.filter(b => b.life > 0);
  }

  // Race order: finished cars first (in the order they finished), then whoever is furthest round.
  function rankCars() {
    const order = cars.slice().sort((a, b) => {
      if (a.finished && b.finished) return finishOrder.indexOf(a) - finishOrder.indexOf(b);
      if (a.finished !== b.finished) return a.finished ? -1 : 1;
      return b.progress - a.progress;
    });
    order.forEach((c, i) => { c.position = i + 1; });
    return order;
  }

  function follow(dt) {
    const tx = player.x + player.vx * 0.35 - W / 2, ty = player.y + player.vy * 0.35 - H / 2;
    camX += (tx - camX) * Math.min(1, dt * 5);
    camY += (ty - camY) * Math.min(1, dt * 5);
    camX = math.clamp(camX, T.box.x0, T.box.x1 - W);
    camY = math.clamp(camY, T.box.y0, T.box.y1 - H);
  }

  const ORD = n => n + (['st', 'nd', 'rd'][n - 1] || 'th');

  function finishRace(g) {
    const order = rankCars();
    const place = player.position;
    const id = T.def.id, ti = TRACKS.findIndex(t => t.id === id);
    const dot = c => `<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:${c.color};border:3px solid #2b2b2b;vertical-align:-3px;margin:0 6px"></span>`;
    const lines = order.map((c, i) => `${ORD(i + 1)} ${dot(c)}${c.isPlayer ? '<b>You</b>' : c.name}${c.finished ? ' — ' + c.finishTime.toFixed(1) + ' s' : ''}`);
    // coins for your place (later tracks pay more) + any coin bags you used
    const earned = payFor(place, ti) + bonusCoins;
    wallet.coins = coins(wallet) + earned;
    lines.push(`<b style="font-size:24px">${coinSVG(28)} +${earned}</b> &nbsp;(you have ${coins(wallet)})`);
    const title = ['You won!', 'Super race!', 'Well done!'][place - 1] || 'Nice try!';

    if (mode === 'free') {
      g.save.data.place = g.save.data.place || {};
      if (!g.save.data.place[id] || place < g.save.data.place[id]) g.save.data.place[id] = place;
      g.store();
      g.finish({
        win: place <= 3, medal: ['gold', 'silver', 'bronze'][place - 1] || null, stars: [3, 2, 1][place - 1] || 0,
        time: player.finishTime, title, lines, next: true, delay: 300,
      });
      return;
    }

    // ---- Grand Prix: points for everyone, then the garage, then the next race ----
    const cup = wallet;
    order.forEach((c, i) => { cup.points[c.name] = (cup.points[c.name] || 0) + POINTS[i]; });
    cup.colors = Object.fromEntries(cars.map(c => [c.name, c.color]));
    cup.race++;
    if (cup.race < TRACKS.length) {
      g.store();
      lines.push(`Race ${cup.race} of ${TRACKS.length} done!`);
      g.finish({
        win: place <= 3, title, lines, delay: 300,
        buttons: [{ icon: wrenchIcon, label: 'Garage', cls: 'big', onClick: () => openCupGarage(g) }],
      });
      return;
    }
    // the last race: who won the whole cup?
    const table = standings(cup);
    const rank = table.findIndex(r => r.name === 'You') + 1;
    cup.active = false;
    const medal = ['gold', 'silver', 'bronze'][rank - 1] || null;
    if (medal) g.save.data.cupBest = Math.min(g.save.data.cupBest || 9, rank);
    g.store();
    g.finish({
      win: rank <= 3, medal, stars: [3, 2, 1][rank - 1] || 0,
      title: rank === 1 ? 'Grand Prix Champion!' : rank <= 3 ? 'Grand Prix: ' + ORD(rank) + ' place!' : 'Grand Prix done!',
      lines: [lines[order.indexOf(player)] ? 'Last race: ' + ORD(place) : '', standingsHTML(cup)], delay: 300,
      buttons: [
        { icon: trophyIcon, label: 'New Grand Prix', cls: 'big', onClick: () => g.play({ id: 'cupnew' }) },
        { icon: icons.menu, label: 'Levels', cls: 'blue', onClick: () => g.menu() },
      ],
    });
  }
  // Grand Prix points table, best first
  function standings(cup) {
    return Object.entries(cup.points).map(([name, pts]) => ({ name, pts })).sort((a, b) => b.pts - a.pts);
  }
  function standingsHTML(cup) {
    return '<div style="display:inline-block;text-align:left;margin-top:6px">' + standings(cup).map((r, i) =>
      `<div style="font-size:18px;margin:2px 0">${ORD(i + 1)} <span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${(cup.colors || {})[r.name] || '#ccc'};border:3px solid #2b2b2b;vertical-align:-2px;margin:0 6px"></span>${r.name === 'You' ? '<b>You</b>' : r.name} — <b>${r.pts}</b> pts</div>`).join('') + '</div>';
  }
  const wrenchIcon = `<svg viewBox="0 0 48 48"><path d="M10 38 L26 22" stroke="#2b2b2b" stroke-width="8" stroke-linecap="round"/><path d="M24 12 A11 11 0 1 0 36 24 L30 24 L24 18 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/></svg>`;
  const trophyIcon = `<svg viewBox="0 0 48 48"><path d="M14 6 H34 V18 A10 10 0 0 1 14 18 Z" fill="#ffc93c" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><path d="M14 10 H6 Q6 22 16 22 M34 10 H42 Q42 22 32 22" fill="none" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/><path d="M24 28 V36 M16 42 H32" stroke="#2b2b2b" stroke-width="5" stroke-linecap="round"/></svg>`;

  // Between Grand Prix races: standings + garage, then on to the next track.
  function openCupGarage(g) {
    const cup = cupOf(g);
    const p = Arcade.h('div', { class: 'ar-panel wide' });
    const next = TRACKS[cup.race];
    p.appendChild(Arcade.h('h1', { class: 'ar-title' }, 'Garage'));
    p.appendChild(Arcade.h('div', {}, standingsHTML(cup)));
    p.appendChild(buildGarage(g, cup));
    p.appendChild(Arcade.h('p', { class: 'ar-sub', style: 'margin:14px 0 0' }, `Next: race ${cup.race + 1} of ${TRACKS.length}`));
    p.appendChild(Arcade.h('div', { style: 'width:180px;margin:6px auto 0' }, trackPic(next).replace('<svg', '<svg style="width:180px;height:105px"')));
    p.appendChild(Arcade.h('div', { style: 'font-weight:800;font-size:20px' }, next.name));
    const btns = Arcade.h('div', { class: 'ar-btns' });
    const go = Arcade.h('button', { type: 'button', class: 'ar-btn big' }, `${icons.play}<span>Next race</span>`);
    go.addEventListener('click', () => { Arcade.sfx('click'); g.play({ id: 'cup' }); });
    const lv = Arcade.h('button', { type: 'button', class: 'ar-btn blue' }, `${icons.menu}<span>Levels</span>`);
    lv.addEventListener('click', () => { Arcade.sfx('click'); g.menu(); });
    btns.append(go, lv);
    p.appendChild(btns);
    g.panel(p);
  }

  const coinSVG = (sz) => `<svg viewBox="0 0 40 40" style="width:${sz}px;height:${sz}px;vertical-align:-6px"><circle cx="20" cy="20" r="16" fill="#ffc93c" stroke="#2b2b2b" stroke-width="4"/><circle cx="20" cy="20" r="9" fill="none" stroke="#e09f3e" stroke-width="3"/><path d="M14 13 A9 9 0 0 1 20 11" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`;

  // ---------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------
  function drawWorld(g, ctx) {
    ctx.fillStyle = theme.outer; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(-Math.round(camX), -Math.round(camY));
    const vis = (x, y, m = 80) => x > camX - m && x < camX + W + m && y > camY - m && y < camY + H + m;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    // sea waves / far scenery that sits under the grass edge
    if (theme.kind === 'beach') {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 4;
      const wob = Math.sin(g.time * 1.5) * 6;
      for (const d of T.decor) {
        if (d.k > 0.75 || !vis(d.x, d.y)) continue;
        ctx.beginPath(); ctx.arc(d.x + wob, d.y, 14 * d.r, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      }
    }

    // the grass band (drivable but slow) with a dark outline
    const band = (w, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2 * (T.hw + BOUND) + w; ctx.stroke(T.mainPath);
      if (T.short) { ctx.lineWidth = 2 * (T.shw + SHORT_BOUND) + w; ctx.stroke(T.shortPath); }
    };
    band(10, INK); band(0, theme.band);
    // soft-wall markers along the outline
    for (const [x, y] of T.edge) {
      if (!vis(x, y)) continue;
      D.circle(ctx, x, y, 11, theme.edge, 3);
    }
    // little things on the grass (flowers, shells, snow sparkles)
    for (const d of T.small) { if (vis(d.x, d.y)) drawSmall(ctx, d); }
    // big scenery beyond the wall
    for (const d of T.decor) { if (vis(d.x, d.y, 120)) drawDecor(ctx, d); }

    // curbs: outline, white, colored stripes
    ctx.strokeStyle = INK; ctx.lineWidth = 2 * T.hw + 30; ctx.stroke(T.mainPath);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2 * T.hw + 22; ctx.stroke(T.mainPath);
    ctx.setLineDash([34, 34]); ctx.lineCap = 'butt';
    ctx.strokeStyle = theme.curb; ctx.stroke(T.mainPath);
    ctx.setLineDash([]); ctx.lineCap = 'round';
    // shortcut surface (dirt, planks, or ice)
    if (T.short) {
      ctx.strokeStyle = INK; ctx.lineWidth = 2 * T.shw + 8; ctx.stroke(T.shortPath);
      ctx.strokeStyle = theme.short; ctx.lineWidth = 2 * T.shw; ctx.stroke(T.shortPath);
      if (theme.shortKind === 'planks') {
        ctx.setLineDash([4, 26]); ctx.lineCap = 'butt'; ctx.strokeStyle = 'rgba(80,45,20,0.45)'; ctx.lineWidth = 2 * T.shw - 6; ctx.stroke(T.shortPath);
        ctx.setLineDash([]); ctx.lineCap = 'round';
      } else if (theme.shortKind === 'ice') {
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 6; ctx.setLineDash([30, 50]); ctx.stroke(T.shortPath); ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = 'rgba(90,55,25,0.3)'; ctx.lineWidth = 2 * T.shw - 40; ctx.setLineDash([16, 18]); ctx.stroke(T.shortPath); ctx.setLineDash([]);
      }
    }
    // the road itself + dashed middle line
    ctx.strokeStyle = theme.road; ctx.lineWidth = 2 * T.hw; ctx.stroke(T.mainPath);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 6; ctx.setLineDash([40, 40]); ctx.stroke(T.mainPath); ctx.setLineDash([]);

    // start / finish line: a checkered strip across the road
    const p0 = pointAt(T.main, 0);
    ctx.save();
    ctx.translate(p0.x, p0.y); ctx.rotate(Math.atan2(p0.ty, p0.tx));
    const cell = 13, rows = Math.ceil(2 * T.hw / cell);
    for (let r = 0; r < rows; r++) for (let k = 0; k < 2; k++) {
      ctx.fillStyle = (r + k) % 2 ? '#ffffff' : INK;
      ctx.fillRect(-cell + k * cell, -T.hw + r * (2 * T.hw / rows), cell, 2 * T.hw / rows + 0.5);
    }
    ctx.restore();

    // skid marks
    ctx.strokeStyle = 'rgba(30,30,40,0.22)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath();
    for (const s of skids) { if (vis(s[0], s[1], 20)) { ctx.moveTo(s[0], s[1]); ctx.lineTo(s[2], s[3]); } }
    ctx.stroke();

    // hazards
    for (const h of hazards) if (vis(h.x, h.y)) drawHazard(ctx, h, g.time);
    // gift boxes
    for (const b of boxes) if (b.t <= 0 && vis(b.x, b.y)) drawBox(ctx, b, g.time);

    // cars (furthest-up first, so lower cars overlap them nicely)
    const sorted = cars.slice().sort((a, b) => a.y - b.y);
    for (const c of sorted) if (vis(c.x, c.y)) drawCar(ctx, c, g.time);
    // bubbles
    for (const b of bubbles) drawBubble(ctx, b.x, b.y, 16, g.time);
    fx.draw(ctx);
    // popups float above things in the world
    for (const p of popups) D.text(ctx, p.text, p.x, p.y, { size: p.size, color: p.color });
    ctx.restore();
  }

  function drawSmall(ctx, d) {
    const t = theme.kind;
    if (t === 'yard') {          // tiny flower
      const col = ['#ffffff', '#ffd166', '#f15bb5', '#9b5de5'][(d.k * 4) | 0];
      for (let i = 0; i < 5; i++) { const a = d.a + i * 1.2566; D.circle(ctx, d.x + Math.cos(a) * 6, d.y + Math.sin(a) * 6, 5, col, 0); }
      D.circle(ctx, d.x, d.y, 4, '#ffb703', 0);
    } else if (t === 'beach') {   // shell or starfish
      if (d.k < 0.5) { D.starPath(ctx, d.x, d.y, 11, 5); ctx.fillStyle = '#ff8c69'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(d.x, d.y, 9, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#ffc8dd'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke(); }
    } else if (t === 'desert') {  // pebble
      ctx.beginPath(); ctx.ellipse(d.x, d.y, 8 + d.k * 4, 6 + d.k * 3, d.a, 0, 7); ctx.fillStyle = theme.rock; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
    } else if (t === 'candy') {   // sprinkle
      ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.a);
      D.box(ctx, -8, -3, 16, 6, 3, ['#ef476f', '#06d6a0', '#ffd166', '#118ab2', '#9b5de5'][(d.k * 5) | 0], 1.5);
      ctx.restore();
    } else {                      // snowball
      D.circle(ctx, d.x, d.y, 7 + d.k * 4, '#ffffff', 2);
    }
  }

  function drawDecor(ctx, d) {
    const t = theme.kind, x = d.x, y = d.y, r = d.r;
    ctx.lineWidth = 4; ctx.strokeStyle = INK;
    if (t === 'yard') {
      if (d.k < 0.7) {           // round bush (top view)
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.arc(x + 6, y + 8, 34 * r, 0, 7); ctx.fill();
        for (const [ox, oy, rr] of [[-14, 4, 22], [14, 6, 22], [0, -10, 24]]) D.circle(ctx, x + ox * r, y + oy * r, rr * r, theme.bush || '#3f8f3a', 4);
        D.circle(ctx, x - 6 * r, y - 14 * r, 7 * r, theme.bush2 || '#5cb85c', 0);
        if (d.k < 0.25) for (let i = 0; i < 3; i++) D.circle(ctx, x + (i - 1) * 12 * r, y + 4 * r, 5, '#ef476f', 2);
      } else if (d.k < 0.85) {   // stepping stone
        ctx.beginPath(); ctx.ellipse(x, y, 26 * r, 19 * r, d.a, 0, 7); ctx.fillStyle = '#c9c3b6'; ctx.fill(); ctx.stroke();
      } else {                   // big flower
        for (let i = 0; i < 6; i++) { const a = d.a + i * 1.047; D.circle(ctx, x + Math.cos(a) * 16 * r, y + Math.sin(a) * 16 * r, 11 * r, '#ffafcc', 3); }
        D.circle(ctx, x, y, 11 * r, '#ffd166', 3);
      }
    } else if (t === 'beach') {
      if (d.k > 0.92) {          // swim ring floating in the sea
        D.circle(ctx, x, y, 24 * r, '#ff6b6b', 4);
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x, y, 19 * r, d.a + i * 1.57, d.a + i * 1.57 + 0.6); ctx.strokeStyle = '#fff'; ctx.lineWidth = 9 * r; ctx.stroke(); }
        D.circle(ctx, x, y, 12 * r, '#38b6e0', 4);
      } else if (d.k > 0.75) {   // rock with a little splash
        ctx.beginPath(); ctx.ellipse(x, y, 28 * r, 20 * r, d.a, 0, 7); ctx.fillStyle = '#a3a3a3'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
        D.circle(ctx, x - 8 * r, y - 6 * r, 6 * r, '#c9c9c9', 0);
      }
    } else if (t === 'desert') {
      if (theme.plant && d.k < 0.55) {   // round cactus (from above) with arms
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.arc(x + 6, y + 8, 28 * r, 0, 7); ctx.fill();
        D.circle(ctx, x - 22 * r, y - 4 * r, 10 * r, theme.plant, 4);
        D.circle(ctx, x + 20 * r, y + 6 * r, 10 * r, theme.plant, 4);
        D.circle(ctx, x, y, 20 * r, theme.plant, 4);
        for (let i = 0; i < 6; i++) D.circle(ctx, x + Math.cos(d.a + i) * 12 * r, y + Math.sin(d.a + i) * 12 * r, 2, '#ffffff', 0);
        if (d.k < 0.15) D.circle(ctx, x, y, 7 * r, '#f15bb5', 2);
      } else if (theme.lava && d.k > 0.7) { // bubbling lava pool
        ctx.beginPath(); ctx.ellipse(x, y, 34 * r, 24 * r, d.a, 0, 7); ctx.fillStyle = '#ff7b00'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x, y, 18 * r, 12 * r, d.a, 0, 7); ctx.fillStyle = '#ffd166'; ctx.fill();
      } else {                           // big rock
        ctx.beginPath(); ctx.ellipse(x, y, 30 * r, 22 * r, d.a, 0, 7); ctx.fillStyle = theme.rock; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
        D.circle(ctx, x - 10 * r, y - 8 * r, 7 * r, 'rgba(255,255,255,0.3)', 0);
      }
    } else if (t === 'candy') {
      if (d.k < 0.45) {          // lollipop (from above: a swirly circle)
        D.circle(ctx, x, y, 26 * r, ['#ef476f', '#9b5de5', '#06d6a0'][(d.k * 6.6) | 0] || '#ef476f', 4);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5 * r;
        ctx.beginPath(); for (let a = 0; a < 12; a += 0.3) { const rr = a * 1.9 * r; ctx.lineTo(x + Math.cos(a + d.a) * rr, y + Math.sin(a + d.a) * rr); } ctx.stroke();
      } else if (d.k < 0.8) {    // gumdrops
        for (const [ox, oy, c] of [[-14, 4, '#ffd166'], [14, 6, '#06d6a0'], [0, -12, '#f15bb5']]) D.circle(ctx, x + ox * r, y + oy * r, 14 * r, c, 4);
      } else {                   // donut
        D.circle(ctx, x, y, 26 * r, '#e9b872', 4);
        D.circle(ctx, x, y, 21 * r, '#ff8fc8', 0);
        D.circle(ctx, x, y, 8 * r, theme.outer, 4);
      }
    } else {
      if (d.k < 0.75) {          // pine tree from above
        ctx.fillStyle = 'rgba(0,0,0,0.13)'; ctx.beginPath(); ctx.arc(x + 7, y + 9, 36 * r, 0, 7); ctx.fill();
        D.starPath(ctx, x, y, 38 * r, 24 * r, 8); ctx.fillStyle = '#2d6a4f'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
        D.starPath(ctx, x, y, 24 * r, 14 * r, 8); ctx.fillStyle = '#40916c'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
        for (let i = 0; i < 4; i++) D.circle(ctx, x + Math.cos(d.a + i * 1.6) * 18 * r, y + Math.sin(d.a + i * 1.6) * 18 * r, 5 * r, '#ffffff', 0);
        D.circle(ctx, x, y, 6 * r, '#ffffff', 2);
      } else {                   // snowman from above (with a hat and carrot nose)
        D.circle(ctx, x, y + 4, 26 * r, '#ffffff', 4);
        D.circle(ctx, x, y - 4, 17 * r, '#ffffff', 4);
        D.circle(ctx, x, y - 6, 9 * r, '#2b2b2b', 3);
        ctx.beginPath(); ctx.moveTo(x + 12 * r, y - 2); ctx.lineTo(x + 26 * r, y + 2); ctx.lineTo(x + 12 * r, y + 6); ctx.closePath();
        ctx.fillStyle = '#ff8c42'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
      }
    }
  }

  function drawHazard(ctx, h, time) {
    ctx.save(); ctx.translate(h.x, h.y);
    // a blobby shape made of a few circles
    const blob = (r) => {
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const a = i / 24 * Math.PI * 2;
        const rr = r * (1 + 0.12 * Math.sin(a * 3 + h.seed) + 0.06 * Math.sin(a * 5 + h.seed * 2));
        i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.8) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.8);
      }
      ctx.closePath();
    };
    if (h.kind === 'oil') {
      blob(h.r); ctx.fillStyle = '#2d2440'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      // rainbow shine
      ctx.lineWidth = 4;
      ['#f15bb5', '#ffd166', '#4cc9f0'].forEach((col, i) => {
        ctx.strokeStyle = col; ctx.globalAlpha = 0.75;
        ctx.beginPath(); ctx.ellipse(-4, -3, h.r * (0.55 - i * 0.12), h.r * (0.32 - i * 0.07), 0.3, Math.PI * 1.1 + Math.sin(time * 2) * 0.2, Math.PI * 1.8); ctx.stroke();
      });
      ctx.globalAlpha = 1;
    } else if (h.kind === 'honey') {
      ctx.globalAlpha = Math.min(1, h.life / 1.5);   // fades away at the end
      blob(h.r); ctx.fillStyle = '#ffb703'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      blob(h.r * 0.55); ctx.fillStyle = '#ffd166'; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath(); ctx.ellipse(-h.r * 0.3, -h.r * 0.25, h.r * 0.25, h.r * 0.1, -0.3, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      blob(h.r); ctx.fillStyle = '#6fc3ec'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath(); ctx.ellipse(-h.r * 0.3, -h.r * 0.25, h.r * 0.3, h.r * 0.12, -0.3, 0, 7); ctx.fill();
      // ripple
      const k = (time * 0.8 + h.seed) % 1;
      ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - k)})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(h.r * 0.15, h.r * 0.1, h.r * 0.6 * k + 4, h.r * 0.4 * k + 3, 0, 0, 7); ctx.stroke();
    }
    ctx.restore();
  }

  // A gift box that gives an item.
  function drawBox(ctx, b, time) {
    const hue = (time * 90 + b.x * 0.3) % 360;
    const s = 1 + Math.sin(time * 5 + b.spin) * 0.08;
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.sin(b.spin * 1.5) * 0.25); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; D.rr(ctx, -14, -11, 34, 34, 8); ctx.fill();
    D.box(ctx, -17, -17, 34, 34, 8, `hsl(${hue} 85% 62%)`, 4);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-4, -17, 8, 34); ctx.fillRect(-17, -4, 34, 8);
    D.star(ctx, 0, 0, 9, '#ffd166', 2.5);
    ctx.restore();
  }

  function drawBubble(ctx, x, y, r, time) {
    ctx.save();
    ctx.fillStyle = 'rgba(190,240,255,0.35)';
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = `hsla(${(time * 200) % 360} 90% 70% / 0.8)`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r - 3, 0.2, 1.6); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.4, r * 0.22, r * 0.13, -0.6, 0, 7); ctx.fill();
    ctx.restore();
  }

  // A cute little RC car seen from above, pointing to the right before rotating.
  function drawCarShape(ctx, color, opts = {}) {
    const L = 3.5;
    ctx.lineJoin = 'round';
    // wheels
    ctx.fillStyle = '#333';
    for (const [wx, wy] of [[-14, -14], [-14, 14], [13, -14], [13, 14]]) {
      D.rr(ctx, wx - 8, wy - 5, 16, 10, 4); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
    }
    // body
    D.box(ctx, -24, -14, 48, 28, 11, color, L);
    // rear spoiler
    D.box(ctx, -27, -15, 7, 30, 3, shade(color, 0.8), 3);
    // windshield with two big shiny eyes
    D.box(ctx, -2, -11, 15, 22, 7, '#d6f1ff', 3);
    for (const ey of [-5.5, 5.5]) {
      D.circle(ctx, 6, ey, 4.6, '#ffffff', 2);
      D.circle(ctx, 7.6, ey, 2.6, INK, 0);
      D.circle(ctx, 8.3, ey - 1.1, 1, '#ffffff', 0);
    }
    // smiley bumper + rosy cheeks
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(14, 0, 6, -1.1, 1.1); ctx.stroke();
    ctx.fillStyle = 'rgba(255,120,150,0.75)';
    ctx.beginPath(); ctx.arc(17, -9, 2.6, 0, 7); ctx.arc(17, 9, 2.6, 0, 7); ctx.fill();
    // stripe on the back half + antenna
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; D.rr(ctx, -19, -3, 15, 6, 3); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-16, -10); ctx.lineTo(-24 - (opts.wag || 0), -22); ctx.stroke();
    D.circle(ctx, -24 - (opts.wag || 0), -22, 3, '#ffd166', 1.5);
  }

  function drawCar(ctx, c, time) {
    ctx.save();
    ctx.translate(c.x, c.y);
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(4, 6, 28, 20, 0, 0, 7); ctx.fill();
    if (c.ghost > 0 && Math.floor(time * 12) % 2) ctx.globalAlpha = 0.5;
    const float = c.bubbled > 0 ? Math.sin(time * 6) * 3 - 6 : 0;
    ctx.translate(0, float);
    ctx.save();
    ctx.rotate(c.a);
    if (c.isPlayer) ctx.scale(1.08, 1.08);
    drawCarShape(ctx, c.color, { wag: Math.sin(time * 9 + c.x * 0.01) * 3 * Math.min(1, Math.abs(c.vF || 0) / 200) });
    ctx.restore();
    if (c.bubbled > 0) drawBubble(ctx, 0, 0, 34, time);
    if (c.star > 0) {        // Super Star: a rainbow ring of little stars
      for (let i = 0; i < 6; i++) {
        const a = time * 5 + i * Math.PI / 3;
        D.star(ctx, Math.cos(a) * 34, Math.sin(a) * 34, 8, `hsl(${(i * 60 + time * 200) % 360} 90% 65%)`, 2);
      }
    }
    if (c.shield > 0 && (c.shield > 1.2 || Math.floor(time * 10) % 2)) {
      ctx.strokeStyle = `hsl(${(time * 160) % 360} 90% 65%)`; ctx.lineWidth = 4;
      ctx.fillStyle = 'rgba(155,246,255,0.22)';
      ctx.beginPath(); ctx.arc(0, 0, 36, 0, 7); ctx.fill(); ctx.stroke();
    }
    if (c.spin > 0) for (let i = 0; i < 3; i++) {   // dizzy stars
      const a = time * 7 + i * 2.1;
      D.star(ctx, Math.cos(a) * 26, -28 + Math.sin(a) * 7, 7, '#ffd166', 2);
    }
    ctx.globalAlpha = 1;
    // a little arrow over YOUR car so you can always find it
    if (c.isPlayer) {
      const bob = Math.sin(time * 5) * 3;
      ctx.beginPath(); ctx.moveTo(-10, -48 + bob); ctx.lineTo(10, -48 + bob); ctx.lineTo(0, -36 + bob); ctx.closePath();
      ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    }
    ctx.restore();
  }

  // a darker (k<1) version of a #rrggbb color
  function shade(hex, k = 0.85) {
    const n = parseInt(hex.slice(1), 16);
    const f = c => Math.round(c * k);
    return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')';
  }

  // ---- HUD: lap, time, place, item, minimap ----
  function drawItemIcon(ctx, item, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (item === 'boost') {        // orange double arrow
      for (const ox of [-10, 6]) {
        ctx.beginPath(); ctx.moveTo(ox - 8, -14); ctx.lineTo(ox + 8, 0); ctx.lineTo(ox - 8, 14); ctx.closePath();
        ctx.fillStyle = '#ff8c42'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
      }
    } else if (item === 'shield') { // shiny ring
      ctx.beginPath(); ctx.arc(0, 0, 17, 0, 7); ctx.fillStyle = 'rgba(155,246,255,0.6)'; ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = '#4cc9f0'; ctx.stroke();
      ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(0, 0, 20, 0, 7); ctx.stroke();
      D.star(ctx, 0, 0, 8, '#ffffff', 2);
    } else if (item === 'bubble') {
      drawBubble(ctx, 0, 0, 18, performance.now() / 1000);
      ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(0, 0, 19, 0, 7); ctx.stroke();
    } else if (item === 'triple') { // three little orange arrows + how many are left
      for (const ox of [-14, -1, 12]) {
        ctx.beginPath(); ctx.moveTo(ox - 6, -11); ctx.lineTo(ox + 6, 0); ctx.lineTo(ox - 6, 11); ctx.closePath();
        ctx.fillStyle = '#ff8c42'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
      }
      if (player && player.item === 'triple') D.text(ctx, 'x' + player.itemCount, 16, 18, { size: 16 });
    } else if (item === 'star') {   // rainbow star
      D.star(ctx, 0, 0, 20, `hsl(${(performance.now() / 5) % 360} 90% 65%)`, 3.5);
      D.circle(ctx, -4, -2, 2.5, INK, 0); D.circle(ctx, 4, -2, 2.5, INK, 0);
    } else if (item === 'honey') {  // honey pot
      D.box(ctx, -15, -10, 30, 26, 10, '#ffb703', 3.5);
      D.box(ctx, -12, -17, 24, 8, 3, '#c68b59', 3);
      ctx.beginPath(); ctx.moveTo(-6, -2); ctx.quadraticCurveTo(-6, 8, -2, 8); ctx.lineWidth = 3; ctx.strokeStyle = '#ffd166'; ctx.stroke();
    } else if (item === 'coins') {  // a little bag of coins
      ctx.beginPath(); ctx.moveTo(-14, 16); ctx.quadraticCurveTo(-20, -4, -6, -8); ctx.lineTo(6, -8); ctx.quadraticCurveTo(20, -4, 14, 16); ctx.closePath();
      ctx.fillStyle = '#c68b59'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
      D.circle(ctx, 0, 4, 8, '#ffc93c', 3);
      D.box(ctx, -7, -14, 14, 7, 3, '#e9c46a', 3);
    }
    ctx.restore();
  }

  function drawHUD(g, ctx) {
    // lap (with a checkered flag) — top left, right of the home button
    drawFlag(ctx, 104, 18);
    D.text(ctx, Math.max(1, Math.min(player.lap, laps)) + '/' + laps, 146, 36, { size: 34, align: 'left' });
    D.text(ctx, raceTime.toFixed(1) + 's', 104, 74, { size: 20, align: 'left', color: '#fff' });
    // Grand Prix: which race this is ("Race 3/8")
    if (mode === 'cup') D.text(ctx, 'Race ' + raceNo + '/' + TRACKS.length, 104, 102, { size: 20, align: 'left', color: '#ffd166' });

    // place — top right, left of the pause button
    const pos = player.position;
    const col = ['#ffc93c', '#dfe7ef', '#e09f5a', '#ffffff'][pos - 1];
    D.text(ctx, String(pos), 812, 42, { size: 60, color: col, align: 'right' });
    D.text(ctx, ['st', 'nd', 'rd', 'th'][pos - 1], 816, 52, { size: 26, color: col, align: 'left' });

    // item slot — top middle
    const ix = W / 2, iy = 44;
    const ready = !!player.item;
    const pulse = ready ? 1 + Math.sin(g.time * 8) * 0.05 : 1;
    ctx.save(); ctx.translate(ix, iy); ctx.scale(pulse, pulse);
    D.box(ctx, -34, -34, 68, 68, 16, ready ? '#fff7d6' : 'rgba(255,255,255,0.6)', 4);
    ctx.restore();
    if (ready) drawItemIcon(ctx, player.item, ix, iy, 1.25);
    else { ctx.globalAlpha = 0.35; drawBoxIcon(ctx, ix, iy); ctx.globalAlpha = 1; }

    drawMinimap(ctx);

    // wrong way: a big turn-around arrow
    if (player.wrongWay > 1 && !player.finished) {
      const a = 0.6 + Math.sin(g.time * 8) * 0.4;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(W / 2, 150);
      ctx.lineWidth = 16; ctx.strokeStyle = INK; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, 34, Math.PI * 0.1, Math.PI * 1.2); ctx.stroke();
      ctx.lineWidth = 9; ctx.strokeStyle = '#ffd166'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(26, 4); ctx.lineTo(44, 26); ctx.lineTo(50, -2); ctx.closePath();
      ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.restore();
    }
  }
  function drawBoxIcon(ctx, x, y) {
    D.box(ctx, x - 17, y - 17, 34, 34, 8, '#9b5de5', 4);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 4, y - 17, 8, 34); ctx.fillRect(x - 17, y - 4, 34, 8);
  }
  function drawFlag(ctx, x, y) {
    ctx.fillStyle = INK; ctx.fillRect(x, y, 5, 36);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) { ctx.fillStyle = (r + k) % 2 ? '#fff' : INK; ctx.fillRect(x + 5 + k * 7, y + r * 7, 7, 7); }
    ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeRect(x + 5, y, 28, 21);
  }

  function drawMinimap(ctx) {
    const mw = 168, mh = 128, mx = W - mw - 12, my = 92;
    D.box(ctx, mx, my, mw, mh, 16, 'rgba(255,255,255,0.75)', 4);
    const { sc, ox, oy } = T.pic(mw, mh, 14);
    ctx.save(); ctx.translate(mx + ox, my + oy); ctx.scale(sc, sc);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = 16 / sc; ctx.stroke(T.mainPath);
    if (T.short) { ctx.lineWidth = 10 / sc; ctx.stroke(T.shortPath); ctx.strokeStyle = theme.short; ctx.lineWidth = 5 / sc; ctx.stroke(T.shortPath); }
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 9 / sc; ctx.stroke(T.mainPath);
    const p0 = T.main.pts[0];
    ctx.fillStyle = INK; ctx.fillRect(p0[0] - 4 / sc, p0[1] - 9 / sc, 8 / sc, 18 / sc);
    ctx.restore();
    // cars (you on top, bigger)
    for (const c of cars.slice().sort((a, b) => a.isPlayer - b.isPlayer)) {
      D.circle(ctx, mx + ox + c.x * sc, my + oy + c.y * sc, c.isPlayer ? 8 : 6, c.color, c.isPlayer ? 3 : 2);
    }
  }

  function render(g, ctx) {
    if (!T) { ctx.fillStyle = '#4f9d4a'; ctx.fillRect(0, 0, W, H); return; }
    drawWorld(g, ctx);
    drawHUD(g, ctx);
    if (countdown > 0) {
      const n = Math.ceil(countdown - 0.2);
      // a cute traffic light
      const lx = W / 2 - 90, ly = H / 2 - 120;
      D.box(ctx, lx, ly, 180, 64, 30, '#3a3a4a', 5);
      for (let i = 0; i < 3; i++) {
        const on = n >= 1 ? 3 - n >= i : true;
        D.circle(ctx, lx + 34 + i * 56, ly + 32, 20, on ? (n >= 1 ? '#ef476f' : '#06d6a0') : '#666', 4);
      }
      D.text(ctx, n >= 1 ? String(n) : 'GO!', W / 2, H / 2 + 10, { size: 100, color: n >= 1 ? '#ffd166' : '#06d6a0' });
    } else if (raceTime < 0.8) {
      D.text(ctx, 'GO!', W / 2, H / 2 + 10, { size: 100 + raceTime * 40, color: '#06d6a0' });
    }
  }

  // ---------------------------------------------------------------
  // Menus: track tiles and the car picker
  // ---------------------------------------------------------------
  function trackPic(def) {
    const T2 = buildTrack(def), th = T2.theme;
    const { sc, ox, oy } = T2.pic(120, 70, 8);
    const pts = (P) => P.pts.filter((_, i) => i % 3 === 0).map(([x, y]) => (ox + x * sc).toFixed(1) + ',' + (oy + y * sc).toFixed(1)).join(' ');
    const short = T2.short ? `<polyline points="${pts(T2.short)}" fill="none" stroke="#2b2b2b" stroke-width="7" stroke-linecap="round"/><polyline points="${pts(T2.short)}" fill="none" stroke="${th.short}" stroke-width="3.5" stroke-linecap="round"/>` : '';
    return `<svg viewBox="0 0 120 70"><rect width="120" height="70" rx="8" fill="${th.outer}"/>` +
      `<polygon points="${pts(T2.main)}" fill="none" stroke="${th.band}" stroke-width="16" stroke-linejoin="round"/>${short}` +
      `<polygon points="${pts(T2.main)}" fill="none" stroke="#2b2b2b" stroke-width="9" stroke-linejoin="round"/>` +
      `<polygon points="${pts(T2.main)}" fill="none" stroke="${th.road}" stroke-width="5" stroke-linejoin="round"/></svg>`;
  }

  // The level picker: Grand Prix (all 8 in a row) and Free play (any track).
  function levels(g) {
    const cup = cupOf(g);
    const active = cup && cup.active;
    const best = g.save.data.cupBest;
    const cupPic = `<svg viewBox="0 0 120 70"><rect width="120" height="70" rx="8" fill="#ffd166"/><g transform="translate(36 6) scale(1.2)">${trophyIcon.replace(/<\/?svg[^>]*>/g, '')}</g></svg>`;
    const list = [{
      id: 'cup', section: 'Grand Prix', name: active ? `Keep going: race ${cup.race + 1} of 8` : 'Race all 8!', pic: cupPic,
      meta: best ? icons.medal(['gold', 'silver', 'bronze'][best - 1]).replace('<svg', '<svg style="width:24px;height:24px;vertical-align:middle"') + ' best' : 'start with a stock car',
    }];
    if (active) list.push({ id: 'cupnew', section: 'Grand Prix', name: 'Start over', pic: cupPic.replace('#ffd166', '#bde0fe'), meta: 'new cup' });
    TRACKS.forEach((t) => {
      const bp = bestPlace(g, t.id);
      const rec = g.save.levels[t.id] || {};
      const medal = ['gold', 'silver', 'bronze'][bp - 1];
      list.push({ ...t, section: 'Free play — any track', pic: trackPic(t), locked: false,
        meta: bp < 99 ? (medal ? icons.medal(medal).replace('<svg', '<svg style="width:24px;height:24px;vertical-align:middle"') : '') + ' ' + ORD(bp) + (rec.time ? ' · ' + rec.time.toFixed(1) + 's' : '') : '' });
    });
    return list;
  }

  function carIcon(color) {
    return `<svg viewBox="0 0 100 70"><g transform="translate(50 35) scale(1.55)">` +
      `<rect x="-22" y="-19" width="16" height="10" rx="4" fill="#333" stroke="#2b2b2b" stroke-width="2.5"/><rect x="-22" y="9" width="16" height="10" rx="4" fill="#333" stroke="#2b2b2b" stroke-width="2.5"/>` +
      `<rect x="5" y="-19" width="16" height="10" rx="4" fill="#333" stroke="#2b2b2b" stroke-width="2.5"/><rect x="5" y="9" width="16" height="10" rx="4" fill="#333" stroke="#2b2b2b" stroke-width="2.5"/>` +
      `<rect x="-24" y="-14" width="48" height="28" rx="11" fill="${color}" stroke="#2b2b2b" stroke-width="3.5"/>` +
      `<rect x="-2" y="-11" width="15" height="22" rx="7" fill="#d6f1ff" stroke="#2b2b2b" stroke-width="3"/>` +
      `<circle cx="6" cy="-5.5" r="4.6" fill="#fff" stroke="#2b2b2b" stroke-width="2"/><circle cx="7.6" cy="-5.5" r="2.6" fill="#2b2b2b"/>` +
      `<circle cx="6" cy="5.5" r="4.6" fill="#fff" stroke="#2b2b2b" stroke-width="2"/><circle cx="7.6" cy="5.5" r="2.6" fill="#2b2b2b"/>` +
      `<path d="M16 -5 A6 6 0 0 1 16 5" fill="none" stroke="#2b2b2b" stroke-width="2.5" stroke-linecap="round"/></g></svg>`;
  }

  // Little pictures for the four upgrades
  function upIcon(id) {
    const L = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
    if (id === 'engine') return `<svg viewBox="0 0 60 60"><rect x="10" y="20" width="36" height="26" rx="5" fill="#ef476f" ${L}/><rect x="16" y="12" width="10" height="8" fill="#8d99ae" ${L}/><rect x="30" y="12" width="10" height="8" fill="#8d99ae" ${L}/><path d="M46 28 H54 V38 H46" fill="#8d99ae" ${L}/><path d="M22 32 L28 26 L26 32 L32 32 L24 40 L26 34 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="2"/></svg>`;
    if (id === 'tires') return `<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="22" fill="#3a3a3a" ${L}/><circle cx="30" cy="30" r="10" fill="#d9d9d9" ${L}/><path d="M30 8 V14 M30 46 V52 M8 30 H14 M46 30 H52 M14 14 L18 18 M42 42 L46 46 M46 14 L42 18 M14 46 L18 42" stroke="#7a7a7a" stroke-width="4" stroke-linecap="round"/></svg>`;
    if (id === 'turbo') return `<svg viewBox="0 0 60 60"><circle cx="26" cy="32" r="18" fill="#06d6a0" ${L}/><path d="M26 32 L26 18 M26 32 L38 40 M26 32 L14 40" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/><circle cx="26" cy="32" r="4" fill="#2b2b2b"/><path d="M44 20 L56 14 M46 30 L58 30 M44 40 L56 46" stroke="#ff8c42" stroke-width="4" stroke-linecap="round"/></svg>`;
    return `<svg viewBox="0 0 60 60"><rect x="18" y="14" width="22" height="38" rx="9" fill="#ff8c42" ${L}/><rect x="24" y="6" width="10" height="8" rx="2" fill="#8d99ae" ${L}/><path d="M24 26 L34 26 M24 34 L34 34" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M44 24 Q52 30 44 38" fill="none" stroke="#ef476f" stroke-width="4" stroke-linecap="round"/></svg>`;
  }

  // A garage for one wallet (free play or the current Grand Prix): coins + 4 upgrades.
  function buildGarage(g, w) {
    const wrap = Arcade.h('div');
    const head = Arcade.h('h2', { class: 'ar-title', style: 'font-size:24px;margin-top:12px' });
    const paintHead = () => { head.innerHTML = `${coinSVG(30)} ${coins(w)}`; };
    paintHead();
    wrap.appendChild(head);
    const row = Arcade.h('div', { class: 'ar-grid' });
    for (const u of UPGRADES) {
      const tile = Arcade.h('button', { type: 'button', class: 'ar-tile', 'data-up': u.id });
      const paint = () => {
        const l = upLevel(w, u.id), maxed = l >= MAX_LVL, price = PRICES[l];
        const pips = Array.from({ length: MAX_LVL }, (_, i) => `<span style="display:inline-block;width:14px;height:14px;border-radius:4px;margin:0 2px;border:2.5px solid #2b2b2b;background:${i < l ? u.color : '#fff'}"></span>`).join('');
        tile.innerHTML = `<div class="pic">${upIcon(u.id)}</div><div>${u.name}</div><div class="meta">${u.info}</div><div style="margin:4px 0">${pips}</div>` +
          `<div style="font-size:18px">${maxed ? 'MAX!' : coinSVG(22) + ' ' + price}</div>`;
        tile.style.opacity = !maxed && coins(w) < price ? 0.6 : 1;
      };
      paint();
      tile.addEventListener('click', () => {
        const l = upLevel(w, u.id), price = PRICES[l];
        if (l >= MAX_LVL || coins(w) < price) {          // can't buy: wiggle
          Arcade.sfx('bonk');
          tile.animate([{ transform: 'rotate(-4deg)' }, { transform: 'rotate(4deg)' }, { transform: 'none' }], 300);
          return;
        }
        w.coins = coins(w) - price;
        w.up = Object.assign({}, w.up, { [u.id]: l + 1 });
        g.store();
        Arcade.sfx('unlock');
        tile.animate([{ transform: 'scale(1.12)' }, { transform: 'none' }], 300);
        paintHead();
        row.querySelectorAll('.ar-tile').forEach(t => t.__paint && t.__paint());
      });
      tile.__paint = paint;
      row.appendChild(tile);
    }
    wrap.appendChild(row);
    return wrap;
  }

  // Under the level picker: the free-play garage and paint colors.
  function extraMenu(g) {
    const wrap = Arcade.h('div');
    wrap.appendChild(Arcade.h('h2', { class: 'ar-title', style: 'font-size:22px;margin:16px 0 0' }, 'Free play garage'));
    wrap.appendChild(buildGarage(g, g.save.data));
    wrap.appendChild(Arcade.h('h2', { class: 'ar-title', style: 'font-size:22px;margin:14px 0 0' }, 'Paint'));

    // paint colors (all free)
    const prow = Arcade.h('div', { class: 'ar-btns' });
    const current = pickedCar(g).id;
    for (const c of PAINTS) {
      // (fixed-size picture, centered in the tile)
      const b = Arcade.h('button', { type: 'button', class: 'ar-tile' + (c.id === current ? ' picked' : ''), 'data-paint': c.id, style: 'min-height:0;width:100px;height:76px;padding:0;display:grid;place-items:center' },
        // the car faces up here, so it sits perfectly centered in its tile
        carIcon(c.color).replace('<svg viewBox="0 0 100 70">', '<svg viewBox="0 0 100 100" style="width:66px;height:66px;display:block">').replace('translate(50 35) scale(1.55)', 'translate(50 50) rotate(-90) scale(1.6)'));
      b.addEventListener('click', () => {
        Arcade.sfx('click');
        g.save.data.paint = c.id; g.store();
        prow.querySelectorAll('.ar-tile').forEach(x => x.classList.toggle('picked', x === b));
      });
      prow.appendChild(b);
    }
    wrap.appendChild(prow);
    return wrap;
  }

  // ---------------------------------------------------------------
  // Start the game
  // ---------------------------------------------------------------
  const S = (inner) => `<svg viewBox="0 0 80 80">${inner}</svg>`;
  const giftIcon = `<svg viewBox="0 0 48 48"><rect x="8" y="12" width="32" height="28" rx="6" fill="#9b5de5" stroke="#2b2b2b" stroke-width="4"/><rect x="21" y="12" width="6" height="28" fill="#fff"/><rect x="8" y="23" width="32" height="6" fill="#fff"/><path d="M24 12 C16 2 8 8 16 12 M24 12 C32 2 40 8 32 12" fill="none" stroke="#2b2b2b" stroke-width="3.5" stroke-linecap="round"/></svg>`;
  const carSmall = (c) => `<g transform="translate(40 40) scale(1.1)"><rect x="-24" y="-14" width="48" height="28" rx="11" fill="${c}" stroke="#2b2b2b" stroke-width="3.5"/><rect x="-2" y="-11" width="15" height="22" rx="7" fill="#d6f1ff" stroke="#2b2b2b" stroke-width="3"/><circle cx="7" cy="-5" r="3" fill="#2b2b2b"/><circle cx="7" cy="5" r="3" fill="#2b2b2b"/></g>`;
  Arcade.start({
    id: 'rc',
    title: 'Mini RC Racers',
    difficulty: false,           // no Easy/Normal/Challenge: tracks get harder instead
    view: { w: W, h: H },
    background: '#4f9d4a',
    music: 'race',
    levelsTitle: 'Mini RC Racers',
    howTo: [
      { pic: S(`<path d="M18 26 L6 40 L18 54 M62 26 L74 40 L62 54" fill="none" stroke="#2b2b2b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>` + carSmall('#ef476f')), text: 'Steer', keys: 'Left / Right' },
      { pic: S(`<path d="M10 40 H56" stroke="#2b2b2b" stroke-width="8" stroke-linecap="round"/><path d="M44 24 L62 40 L44 56" fill="none" stroke="#06d6a0" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`), text: 'Go!', keys: 'Up = go, Down = brake' },
      { pic: S(`<g transform="translate(16 16)">${giftIcon.replace(/<\/?svg[^>]*>/g, '')}</g>`), text: 'Grab a gift, then use it', keys: 'Space / gift button' },
      { pic: S(`<ellipse cx="28" cy="44" rx="20" ry="14" fill="#2d2440" stroke="#2b2b2b" stroke-width="4"/><path d="M18 40 Q28 32 38 40" fill="none" stroke="#f15bb5" stroke-width="3"/><ellipse cx="56" cy="30" rx="18" ry="12" fill="#6fc3ec" stroke="#2b2b2b" stroke-width="4"/>`), text: 'Oil spins you, puddles splash' },
      { pic: S(`<g transform="translate(6 10) scale(1.5)"><circle cx="20" cy="20" r="16" fill="#ffc93c" stroke="#2b2b2b" stroke-width="4"/><circle cx="20" cy="20" r="9" fill="none" stroke="#e09f3e" stroke-width="3"/></g>`), text: 'Win coins, upgrade in the garage' },
      { pic: S(`<rect x="22" y="10" width="6" height="60" fill="#2b2b2b"/>` + [0, 1, 2].map(r => [0, 1, 2, 3].map(k => `<rect x="${28 + k * 9}" y="${10 + r * 9}" width="9" height="9" fill="${(r + k) % 2 ? '#fff' : '#2b2b2b'}"/>`).join('')).join('') + `<rect x="28" y="10" width="36" height="27" fill="none" stroke="#2b2b2b" stroke-width="3"/>`), text: 'Race the laps. Be 1st!' },
    ],
    buttons: {
      left: [{ id: 'ArrowLeft', icon: icons.left, label: 'Steer left' }, { id: 'ArrowRight', icon: icons.right, label: 'Steer right' }],
      right: [{ id: 'Space', icon: giftIcon, label: 'Use item' }, { id: 'ArrowDown', icon: icons.brake, label: 'Brake / reverse' }, { id: 'ArrowUp', icon: icons.gas, label: 'Gas' }],
    },
    levels,
    extraMenu,
    setup,
    update,
    draw: render,
  });
  // test helper: check track shapes (how close different parts of each track get)
  window.__rcTrackCheck = () => TRACKS.map(def => {
    const T2 = buildTrack(def), P = T2.main, n = P.pts.length;
    let min = Infinity;
    for (let i = 0; i < n; i += 2) for (let j = i + 2; j < n; j += 2) {
      const along = Math.min(j - i, n - (j - i)) * P.step;
      if (along < 900) continue;
      min = Math.min(min, Math.hypot(P.pts[i][0] - P.pts[j][0], P.pts[i][1] - P.pts[j][1]));
    }
    return { id: def.id, L: Math.round(T2.L), minGap: Math.round(min), hw: T2.hw, cps: T2.cps.length, sA: T2.sA, sB: T2.sB, shortL: T2.short ? Math.round(T2.short.L) : 0, minV: Math.round(Math.min(...P.vlim)) };
  });
})();
