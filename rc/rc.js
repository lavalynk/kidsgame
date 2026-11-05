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
    moon:    { night: true, kind: 'yard',   outer: '#1f2f5a', band: '#3a5a8c', road: '#4b4f63', curb: '#ffd166', short: '#7d6ab8', edge: '#ffd166', shortKind: 'dirt',   dust: ['#6d8cc4', '#a9c1ea'], bush: '#2b4a7a', bush2: '#3f6aa8' },
    jungle:  { kind: 'yard',   outer: '#16632f', band: '#5cbf60', road: '#6e6a62', curb: '#ffd166', short: '#8b5a2b', edge: '#c68b59', shortKind: 'dirt',   dust: ['#4a9e4f', '#8fd18f'], bush: '#1b7a3a', bush2: '#2fa35a' },
    sky:     { kind: 'sky',    outer: '#8ecae6', band: '#ffffff', road: '#7d7fae', curb: '#f15bb5', short: '#ffd166', edge: '#ffd166', shortKind: 'planks', dust: ['#ffffff', '#e8f6ff'] },
    volcano: { kind: 'desert', outer: '#4a2c2a', band: '#8a5a44', road: '#5a5560', curb: '#ff7b00', short: '#a5705a', edge: '#ffb703', shortKind: 'dirt',   dust: ['#a5705a', '#c9906b'], rock: '#6b4f4a', lava: true },
  };

  // 10 tracks that get harder one by one: narrower roads, more bends, more puddles,
  // and faster computer racers (see rivalSkill).
  // pts = control points of the loop (the race goes in this order; point 0 is the start line).
  // items = where the rows of gift boxes are (fraction of the lap).
  // short = an allowed dirt shortcut: from / to snap onto the road, via = the bends in between.
  const TRACKS = [
    { id: 't1', name: 'Backyard Loop', theme: 'yard', hw: 104, items: [0.3, 0.66],
      pts: [[2069, 2851], [3448, 2828], [4483, 2529], [4943, 1839], [4713, 1104], [3908, 851], [3104, 1081], [2529, 1425], [1839, 1081], [1035, 1081], [552, 1655], [644, 2345], [1195, 2759]],
      short: { from: [3678, 2793], via: [[4138, 2299], [4046, 1609]], to: [3403, 966] } },   // a hidden shortcut
    { id: 't2', name: 'Sunny Beach', theme: 'beach', hw: 94, items: [0.2, 0.52, 0.78],
      pts: [[1687, 2813], [2813, 2813], [3751, 2701], [4407, 2362], [5251, 2362], [5814, 1875], [5626, 1219], [4970, 1012], [4407, 1312], [3939, 1126], [3563, 656], [2720, 563], [1969, 844], [1312, 656], [656, 938], [563, 1687], [844, 2344], [1219, 2720]],
      short: { from: [4369, 2381], via: [[4500, 2025], [4369, 1651]], to: [4369, 1294] } },
    { id: 't3', name: 'Snowy Park', theme: 'snow', hw: 88, items: [0.16, 0.47, 0.8],
      pts: [[1375, 2338], [2338, 2338], [3163, 2268], [3575, 1925], [3438, 1513], [2888, 1443], [2338, 1513], [1925, 1307], [2062, 963], [2612, 893], [3300, 825], [3713, 550], [3438, 207], [2612, 165], [1788, 275], [1238, 550], [1100, 1100], [757, 1375], [413, 1718], [550, 2132], [893, 2338]],
      short: { from: [1100, 1100], via: [[1010, 1500], [1000, 1960]], to: [1300, 2338] } },   // straight down the snowy field
    { id: 't4', name: 'Autumn Woods', theme: 'autumn', hw: 92, items: [0.25, 0.6, 0.85],
      pts: [[2458, 2950], [2791, 2952], [3168, 2955], [3617, 2922], [4204, 2847], [4747, 2601], [4819, 2177], [4361, 1798], [3834, 1587], [3560, 1411], [3406, 1185], [3196, 941], [2903, 649], [2458, 320], [1865, 208], [1411, 510], [1303, 1013], [1316, 1390], [1192, 1616], [993, 1837], [813, 2113], [603, 2481], [510, 2950], [831, 3309], [1487, 3321], [2078, 3096]],
      short: { from: [3298, 2949], via: [[3437, 2424], [3355, 1873]], to: [3496, 1333] } },   // a hidden dirt shortcut
    { id: 't5', name: 'Desert Dunes', theme: 'desert', hw: 90, items: [0.2, 0.5, 0.8],
      pts: [[2550, 3091], [3079, 3273], [3634, 3233], [4092, 3046], [4511, 2829], [4928, 2584], [5166, 2262], [4991, 1913], [4463, 1657], [3930, 1524], [3641, 1402], [3504, 1213], [3290, 1012], [2943, 904], [2550, 867], [2113, 789], [1524, 664], [824, 644], [285, 853], [134, 1231], [280, 1609], [461, 1913], [588, 2176], [814, 2402], [1232, 2530], [1685, 2549], [1989, 2595], [2206, 2796]],
      short: { from: [3685, 3220], via: [[3947, 2836], [3993, 1878]], to: [3771, 1471] } },   // a hidden shortcut
    { id: 't6', name: 'Candy Raceway', theme: 'candy', hw: 88, items: [0.12, 0.25, 0.62, 0.75], bridge: 'second',   // a figure 8: the 2nd pass ramps up over a bridge
      pts: [[3337, 2200], [3582, 2111], [3752, 1861], [3839, 1500], [3839, 1100], [3752, 739], [3582, 489], [3337, 400], [3031, 489], [2678, 739], [2296, 1100], [1904, 1500], [1522, 1861], [1169, 2111], [863, 2200], [618, 2111], [448, 1861], [361, 1500], [361, 1100], [448, 739], [618, 489], [863, 400], [1169, 489], [1522, 739], [1904, 1100], [2296, 1500], [2678, 1861], [3031, 2111]],
    },   // (no shortcut here: Keith, Nov 5)
    { id: 't7', name: 'Moonlight Speedway', theme: 'moon', hw: 86, items: [0.22, 0.5, 0.78],
      pts: [[2301, 3005], [2573, 2745], [2737, 2514], [2946, 2443], [3366, 2496], [3964, 2497], [4473, 2303], [4611, 1947], [4341, 1595], [3886, 1365], [3490, 1232], [3234, 1114], [3048, 971], [2848, 815], [2611, 643], [2301, 433], [1878, 228], [1378, 164], [981, 362], [880, 776], [1068, 1212], [1293, 1509], [1286, 1678], [1017, 1864], [705, 2159], [594, 2518], [750, 2835], [1081, 3051], [1488, 3165], [1914, 3160]],
      short: { from: [2838, 2456], via: [[3089, 2130], [3199, 1392]], to: [3073, 991] } },   // a hidden shortcut
    { id: 't8', name: 'Volcano Valley', theme: 'volcano', hw: 84, items: [0.15, 0.4, 0.65, 0.88],
      pts: [[2205, 3133], [2555, 3286], [2893, 3205], [3091, 2917], [3169, 2604], [3320, 2422], [3678, 2332], [4070, 2161], [4153, 1867], [3825, 1589], [3359, 1440], [3103, 1340], [3107, 1143], [3153, 841], [3053, 565], [2797, 433], [2486, 456], [2205, 560], [1964, 630], [1682, 581], [1276, 456], [818, 436], [546, 663], [630, 1056], [907, 1405], [1026, 1623], [852, 1820], [631, 2092], [668, 2359], [991, 2486], [1377, 2479], [1643, 2479], [1795, 2606], [1952, 2857]],
      short: { from: [3345, 2411], via: [[3400, 2088], [3291, 1767]], to: [3346, 1434] } },   // a hidden dirt shortcut
    { id: 't9', name: 'Jungle Rally', theme: 'jungle', hw: 84, items: [0.2, 0.45, 0.7, 0.9],
      pts: [[2208, 3331], [2564, 3058], [2749, 2719], [2847, 2469], [3071, 2394], [3540, 2388], [4093, 2272], [4417, 1990], [4371, 1650], [4080, 1368], [3733, 1167], [3397, 1026], [3067, 944], [2767, 890], [2502, 795], [2208, 640], [1834, 516], [1426, 517], [1056, 644], [738, 838], [486, 1082], [408, 1385], [591, 1693], [914, 1920], [1115, 2082], [1074, 2304], [955, 2655], [1002, 3050], [1295, 3338], [1745, 3436]],
      short: { from: [3216, 2391], via: [[3357, 1960], [3323, 1496]], to: [3466, 1051] } },   // a hidden dirt shortcut
    { id: 't10', name: 'Cloud Castle', theme: 'sky', hw: 82, items: [0.1, 0.3, 0.5, 0.7, 0.88],   // big: winds over 3 castle towers
      pts: [[1944, 2430], [2430, 2446], [2916, 2398], [3362, 2228], [3645, 1904], [3686, 1498], [3564, 1134], [3362, 891], [3200, 567], [3078, 308], [2876, 202], [2673, 308], [2592, 608], [2511, 932], [2349, 1094], [2146, 1013], [2066, 729], [1985, 405], [1823, 243], [1620, 243], [1498, 446], [1458, 770], [1377, 1053], [1174, 1174], [972, 1053], [891, 770], [810, 446], [648, 267], [446, 284], [308, 526], [284, 891], [324, 1296], [486, 1620], [810, 1742], [1094, 1660], [1336, 1742], [1418, 2025], [1580, 2308]],
      short: { from: [1590, 268], via: [[1340, 367], [961, 378]], to: [701, 301] } },   // a hidden shortcut
  ];

  // Every car has the SAME stats. top = top speed, accel, grip (higher = less
  // drift), steer = turning speed, mass = how hard it is to push around.
  // Your car gets better with upgrades bought in the garage.
  const BASE = { top: 430, accel: 420, grip: 7, steer: 1.0, mass: 1.0, nitro: 1, luck: 0 };

  // Paint colors for your car (just looks). The first 6 are free; the special ones
  // are won by doing something cool (see feats below) and have an effect:
  //   neon = glows and leaves a light trail, gold = sparkles, rainbow = changes color.
  const feat = (g) => g.save.data.feats || {};
  const PAINTS = [
    { id: 'red', color: '#ef476f' }, { id: 'green', color: '#06d6a0' }, { id: 'yellow', color: '#ffc93c' },
    { id: 'blue', color: '#118ab2' }, { id: 'purple', color: '#9b5de5' }, { id: 'orange', color: '#ff8c42' },
    { id: 'neongreen', color: '#39ff14', fx: 'neon', name: 'Neon Green', need: 'Beat your ghost in Time Trial', ok: g => feat(g).ghostBeat },
    { id: 'neonpink',  color: '#ff2ec4', fx: 'neon', name: 'Neon Pink',  need: 'Grab all 6 coins in a row',     ok: g => feat(g).all6 },
    { id: 'neonblue',  color: '#00e5ff', fx: 'neon', name: 'Neon Blue',  need: 'Win a race in the snow',        ok: g => feat(g).snowWin },
    { id: 'gold',      color: '#f2b705', fx: 'gold', name: 'Gold',       need: 'Win 10 races',                  ok: g => (feat(g).wins || 0) >= 10 },
    { id: 'rainbow',   color: '#ff5fa2', fx: 'rainbow', name: 'Rainbow', need: 'Win on every track',            ok: g => TRACKS.every(t => (feat(g).won || {})[t.id]) },
  ];
  const paintOk = (g, p) => !p.ok || !!p.ok(g);

  // Car styles. Each one has a SPECIAL thing it's good at (its "perk") — small
  // helps, so any car can still win. Unlocked with Grand Prix trophies and feats.
  // (The computer racers always drive plain Zoomers.)
  const STYLES = [
    { id: 'classic', name: 'Zoomer',        perk: 'launch',  does: 'Rocket start at Go!',       need: null,                    ok: () => true },
    { id: 'racer',   name: 'Speedster',     perk: 'speed',   does: 'Faster, but slidier',       need: 'Finish a cup',   ok: g => (g.save.data.cupsDone || 0) >= 1 },
    { id: 'monster', name: 'Monster Truck', perk: 'grass',   does: 'Grass won\'t slow you',     need: 'Bronze trophy',         ok: g => (g.save.data.cupBest || 9) <= 3 },
    { id: 'bus',     name: 'Bubble Bus',    perk: 'tank',    does: 'Big and heavy, long shields', need: 'Silver trophy',       ok: g => (g.save.data.cupBest || 9) <= 2 },
    { id: 'hotdog',  name: 'Hot Dog',       perk: 'lucky',   does: 'Better gift boxes',         need: 'Win the Grand Prix',    ok: g => (g.save.data.cupBest || 9) <= 1 },
    { id: 'buggy',   name: 'Beach Buggy',   perk: 'splash',  does: 'Puddles + honey can\'t stop you', need: 'Win on Sunny Beach', ok: g => !!(feat(g).won || {}).t2 },
    { id: 'duck',    name: 'Rubber Duck',   perk: 'jump',    does: 'Huge jumps + landing boost', need: 'Win a race in the rain', ok: g => !!feat(g).rainWin },
    { id: 'icecream',name: 'Ice Cream Van', perk: 'weather', does: 'Rain + snow aren\'t slippery', need: 'Win 3 races',        ok: g => (feat(g).wins || 0) >= 3 },
    { id: 'tractor', name: 'Tractor',       perk: 'oil',     does: 'Oil can\'t spin you',       need: 'Drive 30 laps',         ok: g => (feat(g).laps || 0) >= 30 },
    { id: 'rocket',  name: 'Rocket',        perk: 'boost',   does: 'Stronger boosts',           need: 'Hit 25 boost pads',     ok: g => (feat(g).pads || 0) >= 25 },
    { id: 'cupcake', name: 'Cupcake',       perk: 'coins',   does: 'Track coins count double',  need: 'Win on Candy Raceway',  ok: g => !!(feat(g).won || {}).t6 },
    { id: 'ufo',     name: 'UFO',           perk: 'hover',   does: 'No wind, bubbles bounce off', need: 'Win on Moonlight Speedway', ok: g => !!(feat(g).won || {}).t7 },
  ];
  const hasPerk = (c, perk) => !!(c && c.perk === perk);
  // Stickers for your car. Bought with Grand Prix coins in the garage; once bought they're yours.
  const DECALS = [
    { id: 'none',      name: 'No sticker', price: 0 },
    { id: 'stripes',   name: 'Stripes',    price: 100 },
    { id: 'dots',      name: 'Polka dots', price: 120 },
    { id: 'number',    name: 'Number 1',   price: 120 },
    { id: 'stars',     name: 'Stars',      price: 150 },
    { id: 'hearts',    name: 'Hearts',     price: 150 },
    { id: 'flames',    name: 'Flames',     price: 180 },
    { id: 'lightning', name: 'Lightning',  price: 180 },
    { id: 'checkers',  name: 'Checkered',  price: 200 },
    { id: 'rainbow',   name: 'Rainbow',    price: 220 },
    { id: 'galaxy',    name: 'Galaxy',     price: 250 },
  ];
  // Weather. grip/top change how cars drive; the Grand Prix has set weather per race.
  const WEATHER = {
    sun:  { name: 'Sunny', grip: 1,    top: 1,    corner: 1 },
    rain: { name: 'Rain',  grip: 0.8,  top: 1,    corner: 0.96 },   // puddles grow, a bit slippery
    snow: { name: 'Snow',  grip: 0.55, top: 0.95, corner: 0.9 },    // slippery!
    wind: { name: 'Windy', grip: 1,    top: 1,    corner: 1 },      // gusts push you sideways
  };
  const CUP_WEATHER = ['sun', 'sun', 'snow', 'rain', 'wind', 'sun', 'rain', 'sun', 'rain', 'wind'];

  // Garage upgrades: each has 5 levels. apply() changes the car's stats.
  const MAX_LVL = 5;
  const PRICES = [40, 80, 140, 220, 320];          // cost of level 1, 2, 3, 4, 5
  const UPGRADES = [
    { id: 'engine', name: 'Engine', info: 'higher top speed', color: '#ef476f', apply: (st, l) => { st.top *= 1 + 0.06 * l; } },
    { id: 'tires',  name: 'Tires',  info: 'grip + steering',  color: '#2b2b2b', apply: (st, l) => { st.grip *= 1 + 0.18 * l; st.steer *= 1 + 0.03 * l; } },
    { id: 'turbo',  name: 'Turbo',  info: 'faster speed-up',  color: '#06d6a0', apply: (st, l) => { st.accel *= 1 + 0.14 * l; } },
    { id: 'nitro',  name: 'Nitro',  info: 'bigger boosts',    color: '#ff8c42', apply: (st, l) => { st.nitro = 1 + 0.2 * l; } },
    { id: 'luck',   name: 'Lucky Charm', info: 'better gift boxes', color: '#06d6a0', apply: (st, l) => { st.luck = l; } },
  ];
  // Coins for 1st, 2nd, 3rd, 4th. Later tracks pay more (x1, x1.25, x1.5 ...).
  // Tuned so that after 7 Grand Prix races (mostly 1st/2nd) you can buy most upgrades.
  const PAY = [300, 215, 155, 110];
  // Grand Prix points for 1st, 2nd, 3rd, 4th
  const POINTS = [10, 7, 5, 3];
  const payFor = (place, trackIndex) => Math.round(PAY[place - 1] * (1 + 0.25 * trackIndex));

  // How good the computer racers are on each track (1st track = gentle).
  function rivalSkill(i) {
    return { top: 0.8 + 0.035 * i, corner: 0.8 + 0.015 * i, oops: Math.max(0.05, 0.2 - 0.02 * i), shortcut: 0.3 + 0.07 * i };
  }

  // Every track has its own song (see the music recipes in arcade/shared.js:
  // tempo, key, chords for verse + chorus, drum style, bass style, lead sound...).
  const SONGS = {
    t1:  { tempo: 132, root: 60, scale: 'major',      prog: [[1, 5, 6, 4], [4, 5, 6, 5], [2, 3, 4, 5]], drums: 'disco',    bass: 'octaves', lead: 'square', harmony: 'brass', pad: true,  arp: 'B', seed: 101,
        tune: { A: '5/2 5 5 3 5/4 8 | 7/2 7 7 5 7/4 9 | 6/2 6 6 3 6/4 8 | 4/2 4 4 6 8/8',
                B: '8/6 6/2 8/4 10 | 9/6 7/2 9/4 12 | 10/6 8/2 10/4 12 | 9/16',
                C: '6/4 4 2/8 | 7/4 5 3/8 | 8/4 6 4/8 | 9/4 7 5/8' } },
    t2:  { tempo: 150, root: 65, scale: 'mixolydian', prog: [[1, 4, 1, 5], [4, 4, 1, 5], [6, 7, 4, 5]], drums: 'surf',     bass: 'walk',    lead: 'steel', harmony: 'marimba', pad: false, arp: true, arpSound: 'marimba', swing: 0.12, seed: 202,
        tune: { A: '8/3 8 7/2 8/4 5 | 6/3 6 4/2 6/4 8 | 5/3 5 3/2 5/4 8 | 7/6 9/2 7/8',
                B: '6/4 r/2 6 8 6 4/4 | 8/4 r/2 8 8 10 8/4 | 8/4 r/2 8 10 12 10/4 | 9/12 r/4',
                C: '6/6 8/2 10/8 | 7/6 9/2 11/8 | 8/6 6/2 4/8 | 5/4 7 9/8' } },
    t3:  { tempo: 128, root: 67, scale: 'major',      prog: [[1, 6, 4, 5], [4, 5, 3, 6], [2, 5, 3, 6]], drums: 'march',    bass: 'walk',    lead: 'bell', harmony: 'flute', pad: 'choir',  arp: true, bells: true, seed: 303,
        tune: { A: '1/2 3 5 7 8/4 5 | 6/2 8 10 8 6/4 3 | 4/2 6 8 10 8/4 6 | 5/8 7',
                B: '8/4 10/2 8 6/8 | 9/4 11/2 9 7/8 | 10/4 12/2 10 7/8 | 8/16',
                C: '9/8 6 | 7/8 5 | 5/8 3 | 6/16' } },
    t4:  { tempo: 118, root: 62, scale: 'dorian',     prog: [[1, 4, 1, 7], [3, 4, 5, 1], [4, 7, 4, 5]], drums: 'soft',     bass: 'bounce',  lead: 'marimba', harmony: 'flute', pad: true,  arp: true, arpSound: 'uke', swing: 0.08, seed: 404,
        tune: { A: '5/4 4/2 3 1/4 3 | 6/4 5/2 4 1/8 | 5/4 4/2 3 5/4 8 | 7/6 4/2 2/8',
                B: '7/6 5/2 3/8 | 8/6 6/2 4/8 | 9/6 7/2 5/8 | 8/16',
                C: '8/4 6 4/8 | 7/4 9 11/8 | 8/4 6 8/8 | 9/16' } },
    t5:  { tempo: 128, root: 64, scale: 'harmonic',   prog: [[1, 6, 5, 1], [4, 5, 1, 5], [6, 5, 4, 5]], drums: 'tribal',   bass: 'bounce',  lead: 'saw', harmony: 'flute', pad: false, arp: true, seed: 505,
        tune: { A: '1/2 2 3 2 1/4 5 | 6/2 7 8 7 6/4 3 | 5/2 6 7 6 5/4 2 | 1/12 r/4',
                B: '8/6 6/2 4/8 | 7/6 5/2 2/8 | 8/4 10 12 10 | 9/4 7 5/8',
                C: '8/8 6 | 7/8 5 | 6/8 4 | 5/4 7 9/8' } },
    t6:  { tempo: 160, root: 69, scale: 'major',      prog: [[1, 4, 5, 4], [6, 4, 1, 5], [4, 5, 6, 5]], drums: 'bubble',   bass: 'octaves', lead: 'square', harmony: 'bell', lead2: 'kazoo', pad: true,  arp: 'B', seed: 606,
        tune: { A: '8/2 8 5 5 3 5 8/4 | 8/2 8 6 6 4 6 8/4 | 9/2 9 7 7 5 7 9/4 | 8/4 6 4/8',
                B: '10/4 8 6 8 | 8/4 6 4 6 | 8/4 10 12 10 | 9/8 r',
                C: '6/8 8 | 7/8 9 | 8/8 10 | 9/16' } },
    t7:  { tempo: 112, root: 57, scale: 'minor',      prog: [[1, 7, 6, 7], [4, 5, 1, 1], [6, 7, 4, 5]], drums: 'halftime', bass: 'pulse',   lead: 'saw', harmony: 'choir', pad: 'choir',  arp: true, seed: 707,
        tune: { A: '8/6 7/2 5/8 | 4/6 2/2 7/8 | 6/6 8/2 10/8 | 9/16',
                B: '8/4 6 4 6 | 7/4 5 9/8 | 10/6 8/2 5/8 | 8/16',
                C: '10/8 8 | 9/8 7 | 8/8 6 | 7/16' } },
    t8:  { tempo: 168, root: 62, scale: 'harmonic',   prog: [[1, 6, 4, 5], [6, 7, 1, 5], [4, 5, 4, 5]], drums: 'punk',     bass: 'eighths', lead: 'saw', harmony: 'brass', pad: false, arp: false, seed: 808,
        tune: { A: '1/2 1 5 1 5 3 1/4 | 1/2 1 6 1 6 8 6/4 | 1/2 1 4 1 4 6 4/4 | 7/4 5 2 0',
                B: '8/6 10/2 8/8 | 9/6 11/2 9/8 | 10/4 8 12/8 | 9/4 7 5/8',
                C: '8/4 6 4/8 | 7/4 5 2/8 | 8/4 6 4/8 | 7/4 9 12/8' } },
    t9:  { tempo: 136, root: 64, scale: 'dorian',     prog: [[1, 4, 1, 4], [7, 4, 1, 5], [3, 7, 4, 5]], drums: 'latin',    bass: 'bounce',  lead: 'marimba', harmony: 'flute', pad: false, arp: true, arpSound: 'steel', seed: 909,
        tune: { A: '8/2 5 8 5 3 5 8/4 | 8/2 6 8 6 4 6 8/4 | 10/2 8 5 8 3 5 8/4 | 6/4 8 4/8',
                B: '9/4 11 9 7 | 8/4 6 4/8 | 8/4 10 12/8 | 9/8 7',
                C: '10/8 7 | 9/8 11 | 8/8 6 | 5/4 7 9/8' } },
    t10: { tempo: 120, root: 63, scale: 'major',      prog: [[1, 3, 4, 5], [6, 4, 2, 5], [2, 3, 4, 5]], drums: 'halftime', bass: 'whole',   lead: 'bell', harmony: 'choir', lead2: 'triangle', pad: 'choir',  arp: true, bells: true, seed: 1010,
        tune: { A: '5/6 7/2 8/4 5 | 7/6 5/2 3/8 | 6/6 8/2 4/8 | 5/4 7 9/8',
                B: '10/6 8/2 6/8 | 8/6 6/2 4/8 | 9/6 6/2 4/8 | 7/4 9 12/8',
                C: '4/8 6 | 5/8 7 | 6/8 8 | 7/4 9 5/8' } },
  };

  window.__songs = SONGS;   // test-only: lets tests play/record each track's song

  // Computer racers (their colors are skipped if you pick the same one)
  // Each rival has a personality: a favorite item (they get it more often), and
  // Bubblegum drives extra safely (fewer wobbles, careful in bends).
  const RIVALS = [
    { name: 'Grape', color: '#9b5de5', fav: 'bubble' }, { name: 'Mango', color: '#ff8c42', fav: 'boost' },
    { name: 'Bubblegum', color: '#f15bb5', fav: 'shield', safe: true }, { name: 'Sky', color: '#4cc9f0', fav: 'cloud' },
    { name: 'Lime', color: '#8ac926', fav: 'honey' },
  ];
  const ITEM_NAMES = { boost: 'Boost', bubble: 'Bubble', shield: 'Shield', cloud: 'Cloud', honey: 'Honey', star: 'Super Star', coins: 'Coins',
    spring: 'Pogo Spring', phase: 'Ghost', magnet: 'Magnet', popper: 'Party Popper', warp: 'Rainbow Warp' };

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
  // distance between two spots on a lap (going either way round)
  const lapDist = (a, b, L) => { const d = Math.abs(a - b) % L; return Math.min(d, L - d); };
  // Where the rows of gift boxes go (as a fraction of the lap): the track's own list,
  // plus extra rows in any long gap so there's a row at least every ~2700 px.
  function itemRows() {
    const f = T.def.items.slice().sort((a, b) => a - b), out = [];
    for (let i = 0; i < f.length; i++) {
      out.push(f[i]);
      const nx = i + 1 < f.length ? f[i + 1] : f[0] + 1, gap = (nx - f[i]) * T.L;
      const extra = Math.floor(gap / 2700);
      for (let k = 1; k <= extra; k++) {
        const g2 = (f[i] + (nx - f[i]) * k / (extra + 1)) % 1;
        if (!nearCross(g2 * T.L, 700) && !(T.short && g2 * T.L > T.sA - 200 && g2 * T.L < T.sB + 200)) out.push(g2);
      }
    }
    return out;
  }
  // How high up the bridge you are at distance s (0 = on the ground, 1 = on top).
  function heightAt(s) {
    const B = T.bridge; if (!B) return 0;
    const d = lapDist(s, B.s, T.L);
    if (d <= B.flat) return 1;
    if (d >= B.flat + B.ramp) return 0;
    const k = 1 - (d - B.flat) / B.ramp;
    return k * k * (3 - 2 * k);                     // smooth ramp
  }
  // is s close to where a figure-8 crosses itself? (keep items/oil/pads away from there)
  const nearCross = (s, d) => !!(T.cross && T.cross.some(x => lapDist(s, x, T.L) < d));

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
    const T = { def, main, hw: def.hw, L: main.L, theme: THEMES[def.theme], short: null, shw: 66 };
    // shortcut: snap its ends onto the centerline
    if (def.short) {
      const a = nearest(main, def.short.from[0], def.short.from[1]);
      const b = nearest(main, def.short.to[0], def.short.to[1]);
      const pa = main.pts[a.i], pb = main.pts[b.i];
      T.short = makePath(spline([pa, ...def.short.via, pb], false, 30), false);
      T.sA = a.i * main.step; T.sB = b.i * main.step;
      // a little arrow sign on the grass just before the way in, so kids can find it
      const pr = pointAt(main, T.sA - 140), q = T.short.pts[Math.min(6, T.short.pts.length - 1)];
      const side = Math.sign(pr.tx * (q[1] - pr.y) - pr.ty * (q[0] - pr.x)) || 1;
      T.sign = { x: pr.x - pr.ty * side * (T.hw + 55), y: pr.y + pr.tx * side * (T.hw + 55), a: Math.atan2(q[1] - pa[1], q[0] - pa[0]) };
    }
    // Figure-8 tracks: find where the road crosses itself, and lift one of the
    // two passes up onto a bridge (ramp up, flat over the other road, ramp down).
    if (def.bridge) {
      const P = main, cnt = P.pts.length;
      let best = { d: Infinity };
      for (let i = 0; i < cnt; i++) for (let j = i + 1; j < cnt; j++) {
        if (Math.min(j - i, cnt - (j - i)) * P.step < 1500) continue;      // must be far apart along the road
        const d = Math.hypot(P.pts[i][0] - P.pts[j][0], P.pts[i][1] - P.pts[j][1]);
        if (d < best.d) best = { d, i, j };
      }
      T.cross = [best.i * P.step, best.j * P.step];                       // both passes through the crossing
      const bs = def.bridge === 'second' ? T.cross[1] : T.cross[0];
      T.bridge = { s: bs, flat: T.hw + 150, ramp: 320 };
      // Path2D pieces for drawing the bridge on top of the road below it
      const piece = (s0, s1) => { const p = new Path2D(); for (let q = s0; q <= s1; q += 12) { const pt = pointAt(P, q); q === s0 ? p.moveTo(pt.x, pt.y) : p.lineTo(pt.x, pt.y); } return p; };
      const B = T.bridge, e = B.flat + B.ramp;
      T.bridgePath = piece(bs - e, bs + e);
      T.bridgeFlat = piece(bs - B.flat, bs + B.flat);
      T.rampPaths = [piece(bs - e, bs - B.flat), piece(bs + B.flat, bs + e)];
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
  let mode = 'free', wallet = null, bonusCoins = 0, raceNo = 1;
  let weather = 'sun', wind = null, trackCoins = [], pads = [], coinStreak = 0, coinStreakT = 0;
  let ghost = null, ghostRec = [], bestLapThisRun = 0, trialRecord = false, ghostAtStart = 0;   // Time Trial   // race mode, whose coins/upgrades, coin-bag coins this race
  let countdown, raceTime, laps, camX, camY, endTimer, finishOrder, autopilot, sawShortcut;
  let zoom = 1, slowmo = 0, slowmoDone = false, movers = [], cupKey = 'cup';   // camera zoom, photo-finish slow motion, moving obstacles, which cup
  // Free Drive (no race): stars to find all round the track
  let driveStars = [], starsGot = 0;
  const DRIVE_STARS = 12;
  let placeFx = null;   // the bouncy arrow next to your place when it changes
  // Friends (several phones, see arcade/net.js): the room we're in, who's in it
  // (seat -> { pet, color, name, car }), and the friends' cars in this race.
  let room = null, roomCode = null, peers = {}, friendCars = {}, sendT = 0, lobbyPaint = null;

  function pickedCar(g) {
    const p = PAINTS.find(c => c.id === g.save.data.paint);
    return p && paintOk(g, p) ? p : PAINTS[0];
  }
  // Record something cool you did (change(f) edits the feats), save it,
  // and pop up a message for every special paint it unlocked.
  function addFeat(g, change) {
    const before = PAINTS.filter(p => paintOk(g, p)).map(p => p.id), beforeS = STYLES.filter(st => st.ok(g)).map(st => st.id);
    g.save.data.feats = g.save.data.feats || {};
    change(g.save.data.feats);
    g.store();
    PAINTS.filter(p => paintOk(g, p) && !before.includes(p.id)).forEach(p => g.toast('New paint: ' + p.name + '!'));
    STYLES.filter(st => st.ok(g) && !beforeS.includes(st.id)).forEach(st => g.toast('New car: ' + st.name + '!'));
  }
  // a hue (0-360) as a #rrggbb color, for the rainbow paint
  function hueHex(h) {
    const f = (n) => { const k = (n + h / 30) % 12; const v = 0.62 - 0.38 * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return Math.round(v * 255).toString(16).padStart(2, '0'); };
    return '#' + f(0) + f(8) + f(4);
  }
  function pickedStyle(g) {
    const st = STYLES.find(s => s.id === g.save.data.style);
    return st && st.ok(g) ? st : STYLES[0];
  }
  const ownsDecal = (g, id) => id === 'none' || (g.save.data.decals || []).includes(id);
  function pickedDecal(g) { const d = g.save.data.decal || 'none'; return ownsDecal(g, d) ? d : 'none'; }

  // Boost pads (free speed) and a jump ramp (from track 2 on), on straight road,
  // away from the start line and the gift boxes.
  function placePads(ti) {
    const P = T.main, out = [];
    const cand = [];
    for (let s = 500; s < T.L - 400; s += 40) cand.push({ s, v: Math.min(vlimAt(P, s), vlimAt(P, s + 150), vlimAt(P, s - 220)) });
    cand.sort((a, b) => b.v - a.v);
    const busy = itemRows().map(f => f * T.L).concat(hazards.map(h => h.s));
    const free = (s, gap) => (gap = Math.min(gap, T.L / 8), true) && !busy.some(b => lapDist(b, s, T.L) < 320) && !nearCross(s, 750) && !out.some(o => lapDist(o.s, s, T.L) < gap) &&
      !(T.short && s > T.sA - 250 && s < T.sB + 250);
    const add = (kind, s, extra = {}) => { const p = pointAt(P, s); out.push(Object.assign({ kind, s, x: p.x, y: p.y, a: Math.atan2(p.ty, p.tx) }, extra)); };
    // a creek across the road with a jump ramp just before it (from track 2 on)
    if (ti >= 1) {
      const c = cand.find(c => free(c.s, 900) && free(c.s - 170, 900) && !nearCross(c.s, 1100));
      if (c) { add('creek', c.s, { len: 110 }); add('ramp', c.s - 170); }
    }
    // more boost pads and jump ramps on later tracks
    const want = ['boost', 'ramp', 'boost'].concat(ti >= 3 ? ['ramp', 'strip'] : []).concat(ti >= 6 ? ['boost', 'ramp'] : []).concat(T.L > 11000 ? ['boost', 'ramp'] : []);
    for (const kind of want) {
      const c = cand.find(c => free(c.s, 900));
      if (!c) continue;
      if (kind === 'strip') add('strip', c.s, { len: 380, lat: (Math.round(c.s) % 2 ? 1 : -1) * 0.5 * T.hw });   // a long boost lane on one side
      else add(kind, c.s);
    }
    return out;
  }


  // A friendly voice for "3, 2, 1, Go!" (uses the device's built-in voice, if it has one)
  function say(text) {
    try {
      const set = Arcade.store.settings();
      if (set.muted || !window.speechSynthesis) return;
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.15; u.pitch = 1.5; u.volume = Math.min(1, set.sfx + 0.2);
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) { /* no voice: the beeps still play */ }
  }
  // A crowd cheering at the finish line: a swell of noise + some happy "woo!" whistles
  // A little sound for each car style's special power (only for your car).
  function perkSound(kind) {
    const A = Arcade.audio, T2 = (f, l, o) => A.tone(f, l, o);
    if (kind === 'quack') { T2(620, 0.12, { type: 'square', slide: 380, vol: 0.2 }); T2(580, 0.14, { type: 'square', slide: 340, vol: 0.2, delay: 0.15 }); }
    else if (kind === 'rocket') { A.noise(0.6, { filter: 'bandpass', freq: 900, vol: 0.35 }); T2(200, 0.5, { type: 'sawtooth', slide: 900, vol: 0.08 }); }
    else if (kind === 'warble') { for (let i = 0; i < 6; i++) T2(i % 2 ? 900 : 650, 0.09, { type: 'sine', vol: 0.15, delay: i * 0.07 }); }
    else if (kind === 'vroom') { T2(90, 0.45, { type: 'sawtooth', slide: 320, vol: 0.12 }); A.noise(0.3, { freq: 600, vol: 0.15 }); }
    else if (kind === 'chug') { for (let i = 0; i < 4; i++) T2(70, 0.08, { type: 'square', vol: 0.18, delay: i * 0.11 }); }
    else if (kind === 'splish') { A.noise(0.2, { filter: 'highpass', freq: 2500, vol: 0.2 }); T2(1200, 0.12, { type: 'sine', slide: 2200, vol: 0.12, delay: 0.05 }); }
    else if (kind === 'bong') { T2(220, 0.5, { type: 'triangle', vol: 0.25 }); T2(165, 0.6, { type: 'triangle', vol: 0.2, delay: 0.2 }); }
    else if (kind === 'ding') { [1047, 1319, 1568].forEach((f, i) => T2(f, 0.18, { type: 'sine', vol: 0.15, delay: i * 0.06 })); }
    else if (kind === 'jingle') { [784, 988, 1175, 988, 1319].forEach((f, i) => T2(f, 0.16, { type: 'triangle', vol: 0.13, delay: i * 0.13 })); }   // ice cream van tune
    else if (kind === 'sparkle') { T2(1760, 0.1, { type: 'sine', vol: 0.1, delay: 0.04 }); T2(2349, 0.1, { type: 'sine', vol: 0.08, delay: 0.09 }); }
    else if (kind === 'rumble') { A.noise(0.5, { freq: 180, vol: 0.35 }); T2(55, 0.45, { type: 'sawtooth', vol: 0.12 }); }
  }

  function cheer() {
    const A = Arcade.audio, c = A.ensure(); if (!c) return;
    A.noise(1.8, { filter: 'bandpass', freq: 1100, vol: 0.32 });
    A.noise(1.2, { filter: 'bandpass', freq: 2400, vol: 0.12, delay: 0.15 });
    for (let i = 0; i < 6; i++) A.tone(700 + Math.random() * 500, 0.35, { type: 'sine', vol: 0.06, slide: 1400 + Math.random() * 600, delay: 0.1 + Math.random() * 0.9 });
  }

  function bestPlace(g, id) { return ((g.save.data.place || {})[id]) || 99; }
  // A "wallet" holds coins + upgrade levels. Free play uses a maxed-out one (no coins);
  // every Grand Prix starts a fresh one (stock car, no coins) in g.save.data.cup.
  const upLevel = (w, id) => ((w.up || {})[id]) || 0;
  const coins = (w) => w.coins || 0;
  // Your car's stats = the same base as everyone + your upgrades.
  function playerStats(w) {
    const st = { ...BASE };
    for (const u of UPGRADES) u.apply(st, upLevel(w, u.id));
    return st;
  }
  // Two cups: the Grand Prix (all tracks) and the Mini Cup (the first 3 tracks, ~5 minutes).
  // Each keeps its own saved wallet: g.save.data.cup and g.save.data.mini.
  const CUPS = { cup: { name: 'Grand Prix', n: () => TRACKS.length }, mini: { name: 'Mini Cup', n: () => 3 } };
  const cupOf = (g, key = cupKey) => g.save.data[key];
  const cupLen = (key = cupKey) => CUPS[key].n();
  // how 'late' this race counts for prize coins: the track number, but in the
  // Mini Cup (random tracks) it's the race number, so prizes stay fair
  const payIdx = () => mode === 'cup' && cupKey === 'mini' ? wallet.race : TRACKS.findIndex(t => t.id === T.def.id);
  // which track a cup race is on (the Mini Cup picks 3 random tracks in a random order)
  const cupTrack = (cup) => TRACKS[cup.list ? cup.list[cup.race] : cup.race];
  function newCup(g, key = cupKey) {
    const idx = TRACKS.map((t, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }   // shuffle
    g.save.data[key] = { active: true, race: 0, coins: 0, up: {}, points: {} };
    if (key === 'mini') g.save.data[key].list = idx.slice(0, 3);
    g.store();
  }

  // Put a car style on a car: the look, its special power, and the two powers
  // that change the car's numbers (Speedster faster/slidier, Bubble Bus heavier).
  function giveStyle(c, st) {
    c.style = st.id; c.perk = st.perk;
    if (st.perk === 'speed') { c.stats.top *= 1.06; c.stats.grip *= 0.88; }
    if (st.perk === 'tank') c.stats.mass *= 1.7;
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
    if (level && /^(cup|mini)(new)?$/.test(level.id)) {
      cupKey = level.id.startsWith('mini') ? 'mini' : 'cup';
      if (level.id.endsWith('new') || !cupOf(g) || !cupOf(g).active) newCup(g);
      mode = 'cup';
      wallet = cupOf(g);
      def = cupTrack(wallet);
      raceNo = wallet.race + 1;            // for the HUD ("Race 3/10")
    } else if (level && level.id.startsWith('tt-')) {
      // Time Trial: just you (maxed car), no gift boxes, beat your ghost
      mode = 'trial';
      wallet = { coins: 0, up: Object.fromEntries(UPGRADES.map(u => [u.id, MAX_LVL])) };
      def = TRACKS.find(t => 'tt-' + t.id === level.id) || TRACKS[0];
    } else if (level && level.id.startsWith('fr-')) {
      // Friends: everyone in the room races the same track on their own phone
      mode = 'friends';
      wallet = { coins: 0, up: Object.fromEntries(UPGRADES.map(u => [u.id, MAX_LVL])) };
      def = TRACKS.find(t => 'fr-' + t.id === level.id) || TRACKS[0];
    } else if (level && level.id.startsWith('fd-')) {
      // Free Drive: just you, no laps and no rivals. Find all the stars!
      mode = 'drive';
      wallet = { coins: 0, up: Object.fromEntries(UPGRADES.map(u => [u.id, MAX_LVL])) };
      def = TRACKS.find(t => 'fd-' + t.id === level.id) || TRACKS[0];
    } else {
      mode = 'free';
      // free play: every upgrade maxed out, no coins, no garage
      wallet = { coins: 0, up: Object.fromEntries(UPGRADES.map(u => [u.id, MAX_LVL])) };
      def = TRACKS.find(t => t.id === (level && level.id)) || TRACKS[0];
    }
    T = buildTrack(def);
    bonusCoins = 0; coinStreak = 0; coinStreakT = 0;
    // weather: set per race in the Grand Prix, your pick in free play / time trial
    weather = mode === 'cup' ? CUP_WEATHER[TRACKS.indexOf(def)] || 'sun' : (g.save.data.weather || 'sun');
    wind = weather === 'wind' ? { a: Math.random() * Math.PI * 2, t: Math.random() * 10 } : null;
    engine.stop(); engineTick = 0; lastPlace = 4;
    // music: quiet while we wait for the countdown (no hi-hats or sparkles)
    g.music.mood({ energy: 0.3 }); leadKey = { up: false, out: 0 };
    theme = T.theme;
    document.body.style.setProperty('--ar-bg', theme.outer);
    laps = mode === 'drive' ? 99 : 3;      // Free Drive: drive round as long as you like
    placeFx = null; friendCars = {}; sendT = 0;
    const ti = TRACKS.findIndex(t => t.id === T.def.id);
    countdown = 3.2; raceTime = 0; endTimer = -1;
    slowmo = 0; slowmoDone = false; zoom = 1;
    popups = []; bubbles = []; skids = []; finishOrder = [];
    fx = new Arcade.Particles();
    autopilot = false; sawShortcut = -1;
    g.beeped = 4;

    // ---- the four racers on the starting grid (2 x 2, just behind the line) ----
    const mine = pickedCar(g);
    const rivals = RIVALS.filter(r => r.color !== mine.color).slice(0, 3);
    const slots = [[70, -0.42], [70, 0.42], [160, -0.42], [160, 0.42]];
    const pSlot = 3;                     // you start at the back: pass them all!
    // (free play: you have a maxed car, so the rivals drive like on the last track)
    // (Mini Cup: rivals get a little better each race, whatever track it is)
    const skill = rivalSkill(mode === 'free' ? TRACKS.length - 1 : mode === 'cup' && cupKey === 'mini' ? wallet.race * 1.5 : ti);
    const flavor = [1.03, 1.0, 0.96];  // each rival is a little different
    cars = [];
    let r = 0;
    for (let k = 0; k < 4; k++) {
      const [back, lat] = slots[k];
      const solo = mode === 'trial' || mode === 'drive' || mode === 'friends';
      // (Friends: each phone starts in its own grid spot, by seat number)
      const mySlot = mode === 'friends' && room ? 3 - (room.seat % 4) : pSlot;
      if (solo && k !== mySlot) continue;     // Time Trial + Free Drive + Friends: only you (friends' cars come over the network)
      if (k === mySlot) {
        player = makeCar(playerStats(wallet), mine.color, 'You', true, T.L - back, (solo && mode !== 'friends' ? 0 : lat) * T.hw);
        giveStyle(player, pickedStyle(g));            // your style + its special power
        player.decal = pickedDecal(g);
        player.fx = mine.fx || null;                 // neon glow / gold sparkle / rainbow
        player.trail = [];
        cars.push(player);
      } else {
        // (little kids: rivals drive 5% slower)
        const st = { ...BASE, top: BASE.top * skill.top * flavor[r] * (g.little ? 0.95 : 1), accel: BASE.accel * (0.9 + skill.top * 0.1) };
        const c = makeCar(st, rivals[r].color, rivals[r].name, false, T.L - back, lat * T.hw);
        c.ai.skill = rivals[r].safe ? { ...skill, oops: skill.oops * 0.3, corner: skill.corner * 0.97 } : skill;
        c.ai.flavor = flavor[r];
        c.fav = rivals[r].fav;               // favorite item
        // fair's fair: if you drive a special car, every rival gets a random special car too
        if (pickedStyle(g).id !== 'classic') giveStyle(c, STYLES[1 + Math.floor(Math.random() * (STYLES.length - 1))]);
        cars.push(c); r++;
      }
    }

    // ---- gift boxes (items), in rows across the road ----
    boxes = [];
    if (mode !== 'trial' && mode !== 'drive') for (const f of itemRows()) {
      for (const lat of [-0.5, 0, 0.5]) {
        const p = pointAt(T.main, f * T.L);
        boxes.push({ x: p.x - p.ty * lat * T.hw, y: p.y + p.tx * lat * T.hw, t: 0, spin: Math.random() * 6 });
      }
    }

    // ---- hazards: oil slicks and puddles (always with a clear lane beside them) ----
    hazards = [];
    const count = 2 + Math.round(ti * 0.7) + Math.floor(T.L / 6000);   // more puddles + oil on later (and longer) tracks
    const rnd = math.seeded(T.def.id.charCodeAt(1) * 31 + count);
    const busy = itemRows().map(f => f * T.L);
    let tries = 0;
    while (hazards.length < count && tries++ < 400) {
      const s = 500 + rnd() * (T.L - 900);
      const near = (a, b, d) => Math.abs(a - b) < d;
      if (busy.some(b => near(s, b, 260)) || hazards.some(h => near(s, h.s, 380))) continue;
      if (T.short && (near(s, T.sA, 200) || near(s, T.sB, 200))) continue;
      if (nearCross(s, 700)) continue;
      const lat = (rnd() < 0.5 ? -1 : 1) * (0.3 + rnd() * 0.25) * T.hw;
      const p = pointAt(T.main, s);
      hazards.push({ kind: hazards.length % 2 ? 'puddle' : 'oil', s, lat, x: p.x - p.ty * lat, y: p.y + p.tx * lat, r: hazards.length % 2 ? 40 : 34, seed: rnd() * 10 });
    }
    // rain: a couple of extra puddles, and every puddle slowly grows during the race
    if (weather === 'rain') {
      for (let k = 0; k < 2; k++) {
        const s = ((0.3 + k * 0.4) * T.L + 200) % T.L, lat = (k ? 1 : -1) * 0.35 * T.hw, p = pointAt(T.main, s);
        if (!hazards.some(h => Math.abs(h.s - s) < 300) && !nearCross(s, 700)) hazards.push({ kind: 'puddle', s, lat, x: p.x - p.ty * lat, y: p.y + p.tx * lat, r: 36, seed: k * 4 + 1 });
      }
    }
    for (const h of hazards) h.r0 = h.r;
    // a puddle in the middle of the shortcut (it's still worth it!)
    if (T.short) {
      const p = pointAt(T.short, T.short.L * 0.5);
      hazards.push({ kind: 'puddle', s: -1, lat: 0, x: p.x, y: p.y, r: 36, seed: 3, onShort: true });
    }

    // ---- boost pads + jump ramps on the straightest bits of road ----
    pads = placePads(ti);
    // ---- moving obstacles (gentle: they just make you wobble) ----
    movers = [];
    const MOVER = { snow: 'snowball', beach: 'crab', candy: 'gumdrop', volcano: 'steam' }[T.def.theme];
    if (MOVER) {
      const want = MOVER === 'steam' ? 3 : 2, busyM = itemRows().map(f => f * T.L).concat(hazards.map(h => h.s), pads.map(pd => pd.s));
      for (let k = 0; movers.length < want && k < 40; k++) {
        const sM = (0.12 + 0.78 * ((k * 0.381966) % 1)) * T.L;          // spots spread round the lap
        if (busyM.some(b => lapDist(b, sM, T.L) < 330) || movers.some(m => lapDist(m.s, sM, T.L) < 900) || nearCross(sM, 800)) continue;
        if (T.short && sM > T.sA - 300 && sM < T.sB + 300) continue;
        movers.push({ kind: MOVER, s: sM, ph: k * 1.7, side: k % 2 ? 1 : -1, x: 0, y: 0, r: 20, on: true, z: 0, spin: 0 });
      }
    }
    // ---- coins on the track (Grand Prix only): wavy rows that reward good steering ----
    trackCoins = [];
    if (mode === 'cup') {
      const value = Math.max(2, Math.round(2 * (1 + 0.25 * payIdx())));
      for (const f of [0.1, 0.34, 0.56, 0.8]) {
        const s0 = f * T.L, ph = f * 17;
        if (pads.some(pd => Math.abs(pd.s - s0) < 260) || nearCross(s0, 700)) continue;
        for (let k = 0; k < 6; k++) {
          const s = (s0 + k * 38) % T.L, lat = Math.sin(ph + k * 0.75) * 0.5 * T.hw, p = pointAt(T.main, s);
          trackCoins.push({ x: p.x - p.ty * lat, y: p.y + p.tx * lat, t: 0, value, spin: k * 0.6 });
        }
      }
    }
    // ---- Free Drive: big stars spread all round the lap (one on the shortcut) ----
    driveStars = []; starsGot = 0;
    if (mode === 'drive') {
      for (let k = 0; k < DRIVE_STARS; k++) {
        let s = ((k + 0.6) / DRIVE_STARS) * T.L;
        let lat = [0, 0.45, -0.45, 0.2, -0.2, 0.55][k % 6] * T.hw;
        // keep clear of oil and puddles
        for (const h of hazards) if (!h.onShort && Math.hypot(pointAt(T.main, s).x - h.x, pointAt(T.main, s).y - h.y) < h.r + T.hw) lat = -Math.sign(h.lat || 1) * 0.5 * T.hw;
        const p = pointAt(T.main, s);
        driveStars.push({ x: p.x - p.ty * lat, y: p.y + p.tx * lat, up: heightAt(s) > 0.5, got: false, spin: k });
      }
      if (T.short) {   // swap one star onto the shortcut (a little reward for finding it)
        const p = pointAt(T.short, T.short.L * 0.28), mid = (T.sA + T.sB) / 2;
        const k = driveStars.reduce((b, st, i) => Math.abs(((i + 0.6) / DRIVE_STARS) * T.L - mid) < Math.abs(((b + 0.6) / DRIVE_STARS) * T.L - mid) ? i : b, 0);
        driveStars[k] = { x: p.x, y: p.y, up: false, got: false, spin: k, short: true };
      }
    }
    // ---- Time Trial ghost: your best lap on this track ----
    ghost = mode === 'trial' ? ((g.save.data.ghosts || {})[T.def.id] || null) : null;
    ghostRec = []; bestLapThisRun = 0; trialRecord = false;
    ghostAtStart = ghost ? ghost.t : 0;             // to tell if you beat an older ghost

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
      stars: driveStars.length, starsGot, boxes: boxes.length, draft: Math.round((player.draft || 0) * 100) / 100,
      movers: movers.map(m => m.kind), zoom, slowmo, weather, pads: pads.map(pd => ({ kind: pd.kind, s: Math.round(pd.s), x: Math.round(pd.x), y: Math.round(pd.y), a: pd.a })), trackCoins: trackCoins.length, ghost: ghost ? ghost.t : null, air: player.air || 0, style: player.style, decal: player.decal,
    });
    // test-only: run the race faster than real time (pause the kit loop first)
    window.__rcStep = (sec) => { for (let i = 0; i < sec * 120 && g.state !== 'over'; i++) { update(g, 1 / 120); g.particles.update(1 / 120); } };
    // test-only: roll N gift boxes for a car in a given place and count what comes out
    window.__rcRoll = (pos, isPlayer, n, luck = 0) => { const out = {}; const c = { position: pos, isPlayer, stats: { luck } }; for (let i = 0; i < n; i++) { giveItem(c); out[c.item] = (out[c.item] || 0) + 1; } return out; };
    window.__rcGive = (item) => { player.item = item; };   // test-only
    window.__rcEngine = engine;                              // test-only
    window.__rcAuto = (on) => { autopilot = on !== false; };  // test-only autopilot for the player car
    window.__rcCars = () => cars;                                 // test-only: raw car objects
    window.__rcCoins = () => trackCoins;                          // test-only: coins on the track
    window.__rcMovers = () => movers;                             // test-only
    window.__rcHaz = () => hazards;                               // test-only: oil, puddles, honey
    window.__rcBubbles = () => bubbles.map(b => ({ x: Math.round(b.x), y: Math.round(b.y), mine: !!(b.target && b.target.isPlayer) }));   // test-only
    window.__rcStars = () => driveStars;                          // test-only: Free Drive stars
    window.__rcFriends = () => ({ seat: room && room.seat, code: roomCode, peers: Object.keys(peers).length, cars: Object.values(friendCars).map(f => ({ x: Math.round(f.x), y: Math.round(f.y), p: f.progress, fin: f.finished })) });   // test-only
  }
  const snap = c => ({ name: c.name, x: Math.round(c.x), y: Math.round(c.y), lap: c.lap, cp: c.cp, s: Math.round(c.s), progress: Math.round(c.progress), position: c.position, finished: c.finished, finishTime: c.finishTime, lapTimes: c.lapTimes.slice(), speed: Math.round(Math.hypot(c.vx, c.vy)), surface: c.surface, item: c.item, onShort: c.onShort });

  function popup(text, x, y, color = '#ffd166', size = 30) { popups.push({ text, x, y, t: 0, color, size }); }

  // ---------------------------------------------------------------
  // Where is this car on the track? (s, surface, laps, checkpoints)
  // ---------------------------------------------------------------
  function locate(c, first) {
    let m = nearest(T.main, c.x, c.y, first ? -1 : c.hint, 30);
    // far from the road we were on? maybe we're near a different part of the track now
    if (m.dist > T.hw + 60) {
      const gl = nearest(T.main, c.x, c.y);
      // (never jump onto the other road at a figure-8 crossing — that's the bridge!)
      if (gl.dist < m.dist - 40 && !(T.cross && nearCross(gl.s, T.bridge.flat + T.bridge.ramp + 200))) m = gl;
    }
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
    // up on the bridge? (figure-8 tracks)
    const hPrev = c.h || 0;
    c.h = heightAt(c.s);
    if (c.isPlayer && !first && hPrev === 0 && c.h > 0 && gRef) gRef.sfx('whoosh');
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
    if (c.isPlayer && c.lap >= 2) addFeat(g, f => { f.laps = (f.laps || 0) + 1; });   // (for the Tractor)
    // Time Trial: was that your best lap ever? Then it becomes the new ghost.
    if (mode === 'trial' && c.isPlayer && c.lap >= 2) {
      const lt = c.lapTimes[c.lapTimes.length - 1];
      if (!bestLapThisRun || lt < bestLapThisRun) bestLapThisRun = lt;
      if (!ghost || lt < ghost.t) {
        ghost = { t: lt, f: ghostRec.slice() };
        g.save.data.ghosts = g.save.data.ghosts || {};
        g.save.data.ghosts[T.def.id] = ghost;
        g.store();
        trialRecord = true;
        if (ghostAtStart && lt < ghostAtStart) addFeat(g, f => { f.ghostBeat = true; });
        g.sfx('star'); popup('New best lap!', c.x, c.y - 80, '#06d6a0', 38);
      }
    }
    ghostRec = [];
    c.lapStart = raceTime;
    if (c.lap > laps && !c.finished) {
      c.finished = true; c.finishTime = Math.round(raceTime * 100) / 100;
      finishOrder.push(c);
      if (c.isPlayer) {
        g.sfx('win');
        cheer();
        say(mode === 'trial' ? 'Finish!' : finishOrder.length === 1 ? 'You win!' : 'Finish!');
        if (c.isPlayer) engine.stop();
        popup('Finish!', c.x, c.y - 60, '#06d6a0', 48);
        g.particles.burst(W / 2, 140, { count: 50, shape: 'star', speed: 340, size: 16 });
        endTimer = 2.2;
      }
      return;
    }
    if (c.isPlayer && c.lap >= 2 && mode !== 'drive') {
      if (c.lap === laps) {
        g.sfx('unlock'); popup('Last lap!', c.x, c.y - 60, '#f15bb5', 40);
        g.music.stinger('lastlap'); g.music.mood({ tempo: 1.07 });   // last lap: the music speeds up a little
      }
      else { g.sfx('star'); popup('Lap ' + c.lap + '!', c.x, c.y - 60, '#ffd166', 40); }
    }
  }

  // ---------------------------------------------------------------
  // Driving: the same physics for you and the computer cars
  // inp = { gas, brake, steer (-1..1) }
  // ---------------------------------------------------------------
  function drive(g, c, inp, dt) {
    const st = c.stats;
    const wx = WEATHER[weather] || WEATHER.sun;
    const wGrip = hasPerk(c, 'weather') ? 1 : wx.grip;     // Ice Cream Van: never slippery
    let topMul = wx.top, accMul = 1, grip = st.grip * wGrip, drag = 0;
    if (c.surface === 'grass' && !(c.cloud > 0) && !(c.air > 0)) {
      if (hasPerk(c, 'grass')) topMul = 0.92;               // Monster Truck: big wheels roll right over grass
      else { topMul = g.pick(0.6, 0.5, 0.45); grip *= 0.75; drag = 1.2; }
    }
    else if (c.surface === 'dirt') topMul = 0.88;
    else if (c.surface === 'planks') topMul = 0.92;
    else if (c.surface === 'ice') { topMul = 1.0; grip *= 0.6; }      // ice: slidey, but you can still steer
    if (c.inPuddle && !hasPerk(c, 'splash')) topMul *= 0.7;
    if (c.cloud > 0) topMul *= 1.12;          // Cloud Ride: a gentle lift, grass doesn't slow you
    if (c.bubbled > 0) topMul *= 0.35;
    if (c.boost > 0) { topMul *= 1.4 + (st.nitro - 1) * 0.25 + (hasPerk(c, 'boost') ? 0.12 : 0); accMul = hasPerk(c, 'boost') ? 2.8 : 2.2; }   // nitro upgrade = stronger boost
    // slipstream: tucked in right behind another car = a little extra speed
    if (c.draft > 0) { topMul *= 1 + 0.1 * c.draft; accMul *= 1 + 0.5 * c.draft; }
    const top = st.top * topMul;

    let { gas, brake, steer } = inp;
    if (c.spin > 0) { gas = brake = false; steer = 0; }

    // turn first (you can't turn a parked car; reversing turns the other way)
    let fx = Math.cos(c.a), fy = Math.sin(c.a);
    let vF = c.vx * fx + c.vy * fy;
    const turn = steer * STEER * st.steer * math.clamp(vF / 120, -1, 1) * (vF > 0 ? 1 - 0.18 * Math.min(1, vF / st.top) : 1);
    c.a += turn * dt;
    if (c.spin > 0) {
      // Whee! Spin round... and for the last moment, swing back so you always
      // end up facing the right way down the road.
      c.spin -= dt;
      const P = c.onShort && c.nearShort ? T.short : T.main, i = c.onShort && c.nearShort ? c.nearShort.i : c.near.i;
      const roadA = Math.atan2(P.ty[i], P.tx[i]);
      if (c.spin > 0.3) c.a += 12 * dt;
      else c.a += math.angleDiff(c.a, roadA) * Math.min(1, dt * 14);
      if (c.spin <= 0) {                 // done: point down the road, keep (most of) the speed
        c.a = roadA;
        const sp = Math.hypot(c.vx, c.vy) * 0.8;
        c.vx = Math.cos(roadA) * sp; c.vy = Math.sin(roadA) * sp;
      }
    }

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
    // bridge rails: up on the bridge you can't fall off the side
    if (c.h > 0.2 && m.dist > T.hw - 10) {
      const over = m.dist - (T.hw - 10);
      const nx = (c.x - m.x) / (m.dist || 1), ny = (c.y - m.y) / (m.dist || 1);
      c.x -= nx * over; c.y -= ny * over;
      const vn = c.vx * nx + c.vy * ny;
      if (vn > 0) { c.vx -= nx * vn * 1.3; c.vy -= ny * vn * 1.3; if (vn > 110 && c.bumpCool <= 0) { c.bumpCool = 0.3; if (c.isPlayer) g.sfx('bonk'); } }
      return;
    }
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
      if (toEntry > 0 && toEntry < d) return pointAt(T.short, d - toEntry);
      // just past the way in (the path starts out running beside the road): follow the path
      if (toEntry <= 0 && toEntry > -500 && c.nearShort && c.nearShort.dist < T.shw + 120) return pointAt(T.short, c.nearShort.s + d);
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
      // missed it (drove on past, away from the shortcut) or done with it: back to the road
      const offShort = !c.nearShort || c.nearShort.dist > T.shw + 120;
      if (ai.mode === 'short' && !c.onShort && c.near.dist < T.hw && (c.s > T.sA + 120 && c.s < T.sB && offShort || c.s > T.sB + 60 && c.s < T.sB + 600)) ai.mode = 'main';
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
    let limit = Math.min(vlimAt(P, sHere), vlimAt(P, sHere + 50)) * sk.corner * (WEATHER[weather] || WEATHER.sun).corner;
    let topWant = c.stats.top;
    // stay close together so the race is exciting (gentle)
    if (!pilot && !player.finished) {
      const gap = c.progress - player.progress;
      if (gap > 500) topWant *= g.pick(0.86, 0.92, 0.96);
      if (g.little && gap > 350) topWant *= 0.88;       // little kids: rivals wait up
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
  // Where each moving obstacle is right now (t = race time).
  function moveMover(m, t) {
    let lat = 0;
    if (m.kind === 'snowball') { lat = Math.sin(t * 0.8 + m.ph) * 0.75 * T.hw; m.r = 24; m.on = true; m.spin = lat / 24; }      // rolls across the road
    else if (m.kind === 'crab') { lat = Math.sin(t * 1.5 + m.ph) * 0.7 * T.hw; m.r = 25; m.on = true; m.spin = t; }            // scuttles side to side
    else if (m.kind === 'gumdrop') {                                                                                         // bounces up and down
      lat = Math.sin(t * 0.5 + m.ph) * 0.5 * T.hw; m.z = Math.abs(Math.sin(t * 2.4 + m.ph)); m.r = 27; m.on = m.z < 0.35;
    } else if (m.kind === 'steam') {                                                                                         // a vent that puffs now and then
      lat = m.side * 0.35 * T.hw; const ph = (t + m.ph) % 4.5; m.puff = ph < 1.3 ? ph / 1.3 : 0; m.warn = ph > 3.9; m.r = 38; m.on = ph > 0.1 && ph < 1.2;
    }
    const p = pointAt(T.main, m.s);
    m.x = p.x - p.ty * lat; m.y = p.y + p.tx * lat; m.a = Math.atan2(p.ty, p.tx);
  }

  // ---------------------------------------------------------------
  // Friends: racing on several phones
  // ---------------------------------------------------------------
  // Every car in the race: the ones on this phone plus the friends' cars.
  const racers = () => mode === 'friends' ? cars.concat(Object.values(friendCars)) : cars;
  // what this phone looks like to the others (avatar + car)
  function meMsg(g) {
    const me = Arcade.profiles.active();
    return { t: 'me', pet: me.pet, color: me.color, name: (me.name || '').slice(0, 12), car: { color: pickedCar(g).color, style: pickedStyle(g).id, decal: pickedDecal(g), fx: pickedCar(g).fx || null } };
  }
  // 10 times a second: tell the others where my car is; glide their cars toward
  // where they said they were; work out my place among everyone.
  function friendsTick(dt) {
    if (room && (sendT -= dt) <= 0) {
      sendT = 0.1;
      room.send({ t: 'car', x: Math.round(player.x), y: Math.round(player.y), a: Math.round(player.a * 100) / 100, h: player.h > 0.5 ? 1 : 0,
        lap: player.lap, p: Math.round(player.progress), fin: player.finished ? player.finishTime : 0,
        // looks: 1 star, 2 shield, 4 in a bubble, 8 on a cloud, 16 ghost; and how high it's jumping
        fx: (player.star > 0 ? 1 : 0) | (player.shield > 0 ? 2 : 0) | (player.bubbled > 0 ? 4 : 0) | (player.cloud > 0 ? 8 : 0) | (player.phaseT > 0 ? 16 : 0),
        air: player.air > 0 ? Math.round(100 * (1 - player.air / player.airMax)) / 100 : 0 });
    }
    for (const f of Object.values(friendCars)) {
      const k = Math.min(1, dt * 10);
      f.x += (f.tx - f.x) * k; f.y += (f.ty - f.y) * k;
      f.a += math.angleDiff(f.a, f.ta) * k;
    }
    // my place: 1 + everyone ahead of me (finished sooner, or further round the track)
    const ahead = (o) => o.finished && player.finished ? o.finishTime < player.finishTime : o.finished !== player.finished ? o.finished : o.progress > player.progress;
    player.position = 1 + Object.values(friendCars).filter(ahead).length;
    // friends' places too (for the race-order strip)
    const all = racers().slice().sort((a, b) => (a.finished && b.finished) ? a.finishTime - b.finishTime : a.finished !== b.finished ? (a.finished ? -1 : 1) : b.progress - a.progress);
    all.forEach((c, i) => { if (!c.isPlayer) c.position = i + 1; });
  }
  // a friend's car message arrived
  function friendCar(msg) {
    if (mode !== 'friends' || !T) return;
    const p = peers[msg.from] || {};
    let f = friendCars[msg.from];
    if (!f) {
      // (same paint as mine? give it another color so you can tell the cars apart)
      let color = (p.car && p.car.color) || '#4cc9f0';
      if (color === player.color) color = ['#4cc9f0', '#06d6a0', '#ffd166', '#9b5de5'][msg.from % 4] === color ? '#ff8c42' : ['#4cc9f0', '#06d6a0', '#ffd166', '#9b5de5'][msg.from % 4];
      f = friendCars[msg.from] = { seat: msg.from, name: p.name || '', color, style: p.car && p.car.style, decal: p.car && p.car.decal, fx: p.car && p.car.fx,
        x: msg.x, y: msg.y, a: msg.a, tx: msg.x, ty: msg.y, ta: msg.a, h: 0, vF: 200, position: 2, progress: 0, lap: 0, finished: false, finishTime: 0, friend: true };
    }
    f.tx = msg.x; f.ty = msg.y; f.ta = msg.a; f.h = msg.h; f.lap = msg.lap; f.progress = msg.p;
    const b = msg.fx || 0;
    f.star = b & 1 ? 1 : 0; f.shield = b & 2 ? 2 : 0; f.bubbled = b & 4 ? 1 : 0; f.cloud = b & 8 ? 1 : 0; f.phaseT = b & 16 ? 1 : 0;
    f.air = msg.air ? 1 - msg.air : 0; f.airMax = 1;      // (drawCar works out the hop from air / airMax)
    if (msg.fin && !f.finished) { f.finished = true; f.finishTime = msg.fin; }
  }
  // send something to the friends (only in a friends race)
  function tell(msg) { if (mode === 'friends' && room) room.send(msg); }
  // A friend used an item that reaches other cars. Each phone only changes its OWN car.
  function friendItem(g, m) {
    if (mode !== 'friends' || !T || g.state !== 'play') return;
    const f = friendCars[m.from], who = f && f.name ? f.name + ': ' : '';
    if (m.t === 'honey') {
      hazards.push({ kind: 'honey', s: m.s, lat: m.lat, x: m.x, y: m.y, r: 40, seed: Math.random() * 10, life: 14, owner: f || null, ownerT: 0, up: !!m.up });
      if (f) popup(who + 'Honey!', f.x, f.y - 46, f.color, 22);
    } else if (m.t === 'bubble') {
      bubbles.push({ x: m.x, y: m.y, vx: m.vx, vy: m.vy, owner: f || {}, target: m.to === room.seat ? player : friendCars[m.to] || null, life: 2.4, h: m.h || 0 });
      if (f) popup(who + 'Bubble!', f.x, f.y - 46, f.color, 22);
      if (m.to === room.seat) g.sfx('pop');
    } else if (m.t === 'popper') {
      if (f) { popup(who + 'Pop!', f.x, f.y - 46, f.color, 22); }
      // confetti over every car ahead of the popper (and my car wobbles if it's one of them)
      for (const o of racers()) if (o !== f && !o.finished && o.progress > m.p && o.progress - m.p <= 700) fx.burst(o.x, o.y - 10, { count: 24, shape: 'square', speed: 220, gravity: 0, size: 9, life: 0.8 });
      if (!player.finished && player.progress > m.p && player.progress - m.p <= 700 && !(player.shield > 0) && !hasPerk(player, 'hover')) {
        player.wob = 0.8; player.vx *= 0.8; player.vy *= 0.8; popup('Confetti!', player.x, player.y - 50, '#f15bb5');
      }
    }
  }
  // Open a room (host) or join one with a code; keeps going across races.
  function openRoom(g, code) {
    if (room) room.close();
    peers = {}; roomCode = code;
    room = Arcade.net.join(code);
    room.on('hello', () => room.send(meMsg(g)));
    room.on('join', () => room.send(meMsg(g)));             // tell the newcomer who we are
    room.on('me', (m) => { peers[m.from] = m; if (lobbyPaint) lobbyPaint(); });
    room.on('leave', (m) => { delete peers[m.from]; delete friendCars[m.from]; if (lobbyPaint) lobbyPaint(); });
    room.on('car', friendCar);
    for (const t of ['honey', 'bubble', 'popper']) room.on(t, (m) => friendItem(g, m));
    // couldn't connect, or the connection dropped while waiting in the room: back to the Friends screen
    room.on('closed', () => { if (lobbyPaint && g.state !== 'play') { Arcade.sfx('aww'); g.toast('No connection'); leaveRoom(); friendsMenu(g); } });
    room.on('start', (m) => { if (g.state !== 'play') { Arcade.sfx('go'); weather = m.weather || 'sun'; g.save.data.weather = weather; g.play({ id: 'fr-' + m.track }); } });
    return room;
  }
  function leaveRoom() { if (room) room.close(); room = null; roomCode = null; peers = {}; friendCars = {}; }
  window.__rcRoom = () => room ? { seat: room.seat, players: room.players.slice(), open: room.open, code: roomCode, peers: Object.keys(peers).length } : null;   // test-only

  // Slipstream: tuck in right behind another car and the air gets easier to push
  // (wind lines around your car). Stay there a moment, then pull out to pass:
  // a little "slingshot" boost. Works the same for you and the computer cars.
  function slipstream(g, c, dt) {
    let behind = false;
    const sp = Math.hypot(c.vx, c.vy);
    if (sp > 150 && !c.finished && !(c.air > 0) && !(c.cloud > 0)) {
      const fx0 = Math.cos(c.a), fy0 = Math.sin(c.a);
      for (const o of cars) {
        if (o === c || o.finished || (o.h > 0.5) !== (c.h > 0.5)) continue;
        const dx = o.x - c.x, dy = o.y - c.y;
        const along = dx * fx0 + dy * fy0, side = Math.abs(-dx * fy0 + dy * fx0);
        if (along > 45 && along < 200 && side < 30 && Math.hypot(o.vx, o.vy) > 120) { behind = true; break; }
      }
    }
    if (behind) {
      c.draft = Math.min(1, (c.draft || 0) + dt * 1.4);
      if (c.draft >= 0.95) c.draftFull = true;
      if (c.isPlayer && c.draft > 0.6 && !(c.draftSaid > raceTime)) { c.draftSaid = raceTime + 6; popup('Slipstream!', c.x, c.y - 56, '#bde0fe', 30); g.sfx('whoosh'); }
    } else {
      // pulled out after a full slipstream: slingshot past!
      if (c.draftFull && sp > 150) {
        c.boost = Math.max(c.boost, 0.45);
        if (c.isPlayer) { popup('Slingshot!', c.x, c.y - 56, '#ff8c42', 32); g.sfx('boost'); }
      }
      c.draftFull = false;
      c.draft = Math.max(0, (c.draft || 0) - dt * 2.5);
    }
  }

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
  // What's in a gift box? Items come in three kinds:
  //   COMMON   (about 70%): boost  = a burst of speed
  //                         bubble = floats the car ahead
  //                         shield = nothing can spin or bubble you
  //   UNCOMMON (about 24%): cloud  = Cloud Ride: float over grass, oil and puddles
  //                         honey  = drop a sticky puddle behind you
  //   RARE     (3% each)  : star   = Super Star: fast + safe for 3 seconds
  //                         coins  = a bag of bonus coins (Grand Prix only)
  // Your place changes the common/uncommon odds a little: cars at the back get
  // more speed, the leader gets more shields and honey. Rare odds never change.
  //   (new) spring = Pogo Spring: a big jump over anything     (common)
  //         phase  = Ghost: drive right through cars and oil  (common)
  //         magnet = Magnet: pulls you toward the car ahead    (uncommon)
  //         popper = Party Popper: confetti makes cars ahead wobble (uncommon)
  //         warp   = Rainbow Warp: zip forward along the road  (rare)
  const RARITY = { boost: 'common', bubble: 'common', shield: 'common', spring: 'common', phase: 'common',
    cloud: 'uncommon', honey: 'uncommon', magnet: 'uncommon', popper: 'uncommon', star: 'rare', coins: 'rare', warp: 'rare' };
  const RARITY_COLOR = { common: '#fff7d6', uncommon: '#b9fbc0', rare: '#ffd166' };
  const ITEM_ODDS = {        // percent; each row adds up to 100
    front:  { shield: 23, bubble: 18, boost: 8,  honey: 14, cloud: 5,  spring: 8, phase: 8, magnet: 2,  popper: 5, star: 3, coins: 3, warp: 3 },
    middle: { boost: 17, bubble: 18, shield: 12, cloud: 9,  honey: 8,  spring: 9, phase: 8, magnet: 6,  popper: 4, star: 3, coins: 3, warp: 3 },
    back:   { boost: 23, bubble: 14, shield: 9,  cloud: 12, honey: 4,  spring: 9, phase: 6, magnet: 10, popper: 4, star: 3, coins: 3, warp: 3 },
  };
  function rollItem(odds, skip) {
    let total = 0; for (const k in odds) if (k !== skip) total += odds[k];
    let r = Math.random() * total;
    for (const k in odds) { if (k === skip) continue; r -= odds[k]; if (r <= 0) return k; }
    return 'boost';
  }
  function giveItem(c) {
    const base = ITEM_ODDS[c.position === 1 ? 'front' : c.position >= 3 ? 'back' : 'middle'];
    // Lucky Charm: each level makes uncommon items 20% likelier and rare ones +1%
    const luck = ((c.stats && c.stats.luck) || 0) + (hasPerk(c, 'lucky') ? 3 : 0), odds = {};
    for (const k in base) odds[k] = base[k] * (RARITY[k] === 'uncommon' ? 1 + 0.2 * luck : 1) + (RARITY[k] === 'rare' ? luck : 0);
    // coin bags only exist for you in the Grand Prix (everyone else rolls without them)
    const noCoins = !c.isPlayer || mode === 'free' || mode === 'friends';
    c.item = rollItem(odds, noCoins ? 'coins' : null);
    if (c.fav && Math.random() < 0.5) c.item = c.fav;      // rivals love their favorite item
  }

  function useItem(g, c) {
    const it = c.item; if (!it) return;
    c.item = null;
    // rivals: a little name tag pops up when they use something (if you can see them)
    if (!c.isPlayer && Math.abs(c.x - (camX + W / 2)) < W / zoom / 2 + 40 && Math.abs(c.y - (camY + H / 2)) < H / zoom / 2 + 40)
      popups.push({ text: c.name + ': ' + ITEM_NAMES[it] + '!', x: c.x, y: c.y - 46, t: 0, color: c.color, size: 22 });
    if (it === 'cloud') {                  // Cloud Ride: float on a fluffy cloud for a while
      c.cloud = 3.5;
      if (c.isPlayer) { g.sfx('spring'); popup('Cloud Ride!', c.x, c.y - 50, '#bde0fe'); }
    } else if (it === 'star') {            // Super Star: speedy and nothing can stop you
      c.star = 3.2; c.shield = Math.max(c.shield, 3.2); c.boost = Math.max(c.boost, 3.2 * (c.stats.nitro || 1) * 0.8);
      if (c.isPlayer) { g.sfx('star'); popup('Super Star!', c.x, c.y - 50, '#ffd166'); }
    } else if (it === 'honey') {           // drop a sticky honey puddle behind you
      const hx = c.x - Math.cos(c.a) * 52, hy = c.y - Math.sin(c.a) * 52;
      const s = (c.s - 52 + T.L) % T.L, p = pointAt(T.main, s);
      const lat = -(hx - p.x) * p.ty + (hy - p.y) * p.tx;
      hazards.push({ kind: 'honey', s, lat, x: hx, y: hy, r: 40, seed: Math.random() * 10, life: 14, owner: c, ownerT: 1.2, up: c.h > 0.5 });
      if (c.isPlayer) tell({ t: 'honey', x: Math.round(hx), y: Math.round(hy), s: Math.round(s), lat: Math.round(lat), up: c.h > 0.5 ? 1 : 0 });
      if (c.isPlayer) { g.sfx('splash'); popup('Honey!', c.x, c.y - 50, '#ffb703'); }
    } else if (it === 'coins') {           // bonus coins, added at the finish
      const add = Math.round(30 * (1 + 0.25 * payIdx()));
      bonusCoins += add;
      if (c.isPlayer) { g.sfx('coin'); popup('+' + add + ' coins!', c.x, c.y - 50, '#ffc93c'); fx.burst(c.x, c.y, { count: 14, colors: ['#ffc93c', '#ffd166', '#fff'], speed: 200, gravity: 0, size: 10, life: 0.6 }); }
    } else if (it === 'boost') {
      c.boost = 1.3 * (c.stats.nitro || 1) * (hasPerk(c, 'boost') ? 1.35 : 1);   // nitro upgrade = longer boost
      if (c.isPlayer && hasPerk(c, 'boost')) perkSound('rocket');
      if (c.isPlayer) { g.sfx('boost'); popup('Boost!', c.x, c.y - 50, '#ff8c42'); }
    } else if (it === 'spring') {          // Pogo Spring: boing! a big jump over everything
      c.air = c.airMax = 0.9; c.boost = Math.max(c.boost, 0.4);
      if (c.isPlayer) { g.sfx('spring'); popup('Boing!', c.x, c.y - 50, '#06d6a0'); }
    } else if (it === 'phase') {           // Ghost: see-through, cars and oil can't touch you
      c.ghost = 3; c.phaseT = 3;
      if (c.isPlayer) { g.tone(500, 0.5, { type: 'sine', slide: 900, vol: 0.12 }); popup('Ghost!', c.x, c.y - 50, '#e0e7ff'); }
    } else if (it === 'magnet') {          // Magnet: pulled along toward the car in front
      c.magnet = 3.5;
      if (c.isPlayer) { g.sfx('power'); popup('Magnet!', c.x, c.y - 50, '#ef476f'); }
    } else if (it === 'popper') {          // Party Popper: confetti over the cars ahead, they wobble
      for (const o of cars) {
        if (o === c || o.finished || o.progress <= c.progress || o.progress - c.progress > 700) continue;
        fx.burst(o.x, o.y - 10, { count: 24, shape: 'square', speed: 220, gravity: 0, size: 9, life: 0.8 });
        if (o.shield > 0 || hasPerk(o, 'hover')) continue;
        o.wob = 0.8; o.vx *= 0.8; o.vy *= 0.8;
        if (o.isPlayer) popup('Confetti!', o.x, o.y - 50, '#f15bb5');
      }
      if (c.isPlayer) { Arcade.audio.noise(0.25, { filter: 'highpass', freq: 1500, vol: 0.3 }); g.sfx('pop'); popup('Pop!', c.x, c.y - 50, '#f15bb5'); }
      if (c.isPlayer && mode === 'friends') {
        for (const f of Object.values(friendCars)) if (!f.finished && f.progress > c.progress && f.progress - c.progress <= 700) fx.burst(f.x, f.y - 10, { count: 24, shape: 'square', speed: 220, gravity: 0, size: 9, life: 0.8 });
        tell({ t: 'popper', p: Math.round(c.progress) });
      }
    } else if (it === 'warp') {            // Rainbow Warp: zip ahead along the road
      const p = pointAt(T.main, c.s + 320);
      fx.burst(c.x, c.y, { count: 20, shape: 'star', speed: 180, gravity: 0, size: 12, life: 0.6 });
      c.x = p.x; c.y = p.y; c.a = Math.atan2(p.ty, p.tx);
      const sp = Math.max(200, Math.hypot(c.vx, c.vy)); c.vx = p.tx * sp; c.vy = p.ty * sp;
      c.hint = p.i; c.ghost = Math.max(c.ghost, 0.8);
      fx.burst(c.x, c.y, { count: 20, shape: 'star', speed: 180, gravity: 0, size: 12, life: 0.6 });
      if (c.isPlayer) { [523, 659, 784, 1047].forEach((f, i) => g.tone(f, 0.12, { type: 'triangle', vol: 0.15, delay: i * 0.05 })); popup('Warp!', c.x, c.y - 50, '#9b5de5'); }
    } else if (it === 'shield') {
      c.shield = hasPerk(c, 'tank') ? 12 : 6;
      if (c.isPlayer && hasPerk(c, 'tank')) perkSound('bong');
      if (c.isPlayer) { g.sfx('power'); popup('Shield!', c.x, c.y - 50, '#4cc9f0'); }
    } else if (it === 'bubble') {
      // aim at the closest car ahead of us in the race
      let target = null, bd = 900;
      for (const o of racers()) {
        if (o === c || o.finished) continue;
        if (o.progress <= c.progress) continue;
        const d = Math.hypot(o.x - c.x, o.y - c.y);
        if (d < bd) { bd = d; target = o; }
      }
      const sp = 640 + Math.max(0, c.vF || 0);
      bubbles.push({ x: c.x + Math.cos(c.a) * 30, y: c.y + Math.sin(c.a) * 30, vx: Math.cos(c.a) * sp, vy: Math.sin(c.a) * sp, owner: c, target, life: 2.4, h: c.h || 0 });
      if (c.isPlayer) { const b = bubbles[bubbles.length - 1]; tell({ t: 'bubble', x: Math.round(b.x), y: Math.round(b.y), vx: Math.round(b.vx), vy: Math.round(b.vy), h: b.h, to: target && target.friend ? +target.seat : null }); }
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
    if (c.item === 'cloud') use = c.near.dist < T.hw || ai.holdT > 2;
    else if (c.item === 'star') use = c.near.dist < T.hw;
    else if (c.item === 'honey') use = cars.some(o => o !== c && !o.finished && o.progress < c.progress && c.progress - o.progress < 350) || ai.holdT > 6;
    else if (c.item === 'boost') use = c.near.dist < T.hw && vlimAt(T.main, c.s + 250) > c.stats.top * 0.95 && vlimAt(T.main, c.s + 100) > c.stats.top * 0.95 || ai.holdT > 5;
    else if (c.item === 'shield') use = hazards.some(h => { const d = h.s - c.s; return d > 0 && d < 260; }) || ai.holdT > 4;
    else if (c.item === 'bubble') use = cars.some(o => o !== c && !o.finished && o.progress > c.progress && o.progress - c.progress < 600) || ai.holdT > 7;
    else if (c.item === 'spring') use = hazards.some(h => { const d = h.s - c.s; return d > 40 && d < 220; }) || ai.holdT > 4;
    else if (c.item === 'phase') use = cars.some(o => o !== c && Math.hypot(o.x - c.x, o.y - c.y) < 90) || ai.holdT > 5;
    else if (c.item === 'magnet' || c.item === 'popper') use = cars.some(o => o !== c && !o.finished && o.progress > c.progress && o.progress - c.progress < 600) || ai.holdT > 6;
    else if (c.item === 'warp') use = c.near.dist < T.hw;
    if (use && ai.holdT > 0.6) useItem(g, c);
  }

  // ---------------------------------------------------------------
  // Engine sound: made live by the browser. Two buzzy notes through a soft
  // filter, with a fast wobble for the "brrrm" rumble. The pitch follows your
  // speed, it gets louder and brighter on the gas, and howls during a boost.
  // A hissy noise layer squeals when your tires skid.
  // (It goes through the arcade's sound volume, so the slider + mute work.)
  // ---------------------------------------------------------------
  const engine = {
    n: null,
    start() {
      const A = Arcade.audio, c = A.ensure();
      if (!c || this.n) return;
      const out = c.createGain(); out.gain.value = 0; out.connect(A.sfxGain);
      const filt = c.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 600; filt.Q.value = 3; filt.connect(out);
      const o1 = c.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 60;
      const o2 = c.createOscillator(); o2.type = 'square'; o2.frequency.value = 30;
      const g2 = c.createGain(); g2.gain.value = 0.6;
      o1.connect(filt); o2.connect(g2).connect(filt);
      const wob = c.createOscillator(); wob.frequency.value = 22;           // the rumble
      const wobAmt = c.createGain(); wobAmt.gain.value = 0.03; wob.connect(wobAmt).connect(out.gain);
      // tire squeal: looping noise through a narrow high filter
      const buf = c.createBuffer(1, c.sampleRate, c.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
      const noise = c.createBufferSource(); noise.buffer = buf; noise.loop = true;
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 4;
      const skid = c.createGain(); skid.gain.value = 0;
      noise.connect(bp).connect(skid).connect(A.sfxGain);
      [o1, o2, wob, noise].forEach(o => o.start());
      this.n = { c, out, filt, o1, o2, wob, skid, all: [o1, o2, wob, noise] };
    },
    // speed in px/s, gas true/false, skid 0..1, boost true/false
    set(speed, gas, skid, boost) {
      const n = this.n; if (!n) return;
      const t = n.c.currentTime;
      const pitch = 48 + speed * 0.19 + (boost ? 35 : 0);
      n.o1.frequency.setTargetAtTime(pitch, t, 0.06);
      n.o2.frequency.setTargetAtTime(pitch * 0.502, t, 0.06);
      n.wob.frequency.setTargetAtTime(14 + speed * 0.06, t, 0.1);
      n.filt.frequency.setTargetAtTime(380 + speed * 1.6 + (gas ? 450 : 0) + (boost ? 600 : 0), t, 0.08);
      n.out.gain.setTargetAtTime(0.07 + (gas ? 0.05 : 0) + Math.min(0.04, speed / 12000), t, 0.08);
      n.skid.gain.setTargetAtTime(skid * 0.18, t, 0.04);
    },
    stop() {
      const n = this.n; if (!n) return;
      this.n = null;
      const t = n.c.currentTime;
      n.out.gain.setTargetAtTime(0, t, 0.08); n.skid.gain.setTargetAtTime(0, t, 0.05);
      setTimeout(() => n.all.forEach(o => { try { o.stop(); } catch (e) { /* already stopped */ } }), 400);
    },
  };
  let engineTick = 0, lastPlace = 4;
  let leadKey = { up: false, out: 0 };   // music goes up a key while you're in the lead

  // ---------------------------------------------------------------
  // Update (dt = 1/120 s)
  // ---------------------------------------------------------------
  function update(g, dt) {
    gRef = g;
    // photo finish: everything runs in slow motion for a moment
    if (slowmo > 0) { slowmo -= dt; dt *= 0.3; }
    const inp = g.input;
    for (const p of popups) { p.t += dt; p.y -= 30 * dt; }
    popups = popups.filter(p => p.t < 1.2);
    fx.update(dt);

    // 3, 2, 1, GO!
    if (countdown > 0) {
      countdown -= dt;
      const n = Math.ceil(countdown - 0.2);
      if (n !== g.beeped && n >= 1 && n <= 3) { g.beeped = n; g.sfx('beep'); say(['one', 'two', 'three'][n - 1]); }
      if (countdown <= 0) {
        g.sfx('go'); say('Go!');
        g.music.mood({ energy: 1 });        // the whole band comes in at "Go!"
        for (const o of cars) if (!o.isPlayer && hasPerk(o, 'launch')) o.boost = 0.9;      // rival Zoomers rocket-start too
        if (hasPerk(player, 'launch')) { player.boost = 0.9; popup('Rocket start!', player.x, player.y - 60, '#ff8c42', 32); perkSound('vroom'); }
        else if (hasPerk(player, 'speed')) perkSound('vroom');
        else if (hasPerk(player, 'weather')) perkSound('jingle');
        else if (hasPerk(player, 'hover')) perkSound('warble');
      }
      // engine idles (and revs a little on each beep) while we wait
      if (!engine.n) engine.start();
      if (++engineTick % 4 === 0) engine.set(Math.max(0, 140 - (countdown % 1) * 140), true, 0, false);
      // little engine puffs while we wait
      if (Math.random() < dt * 8) { const c = cars[(Math.random() * cars.length) | 0]; fx.burst(c.x - Math.cos(c.a) * 26, c.y - Math.sin(c.a) * 26, { count: 1, colors: ['#ffffff', '#dddddd'], speed: 40, gravity: 0, size: 10, life: 0.5 }); }
      follow(dt);
      return;
    }
    raceTime += dt;
    // honey puddles dry up after a while
    for (const h of hazards) if (h.kind === 'honey') { h.life -= dt; h.ownerT -= dt; }
    hazards = hazards.filter(h => h.kind !== 'honey' || h.life > 0);
    // rain makes the puddles grow (up to 1.6x by the end of a race)
    if (weather === 'rain') for (const h of hazards) if (h.kind === 'puddle') h.r = h.r0 * (1 + Math.min(0.6, raceTime / 100));
    // wind: gusts come and go
    if (wind) { wind.t += dt; wind.f = 75 * (0.35 + 0.65 * Math.max(0, Math.sin(wind.t * 0.7))); }
    coinStreakT -= dt; if (coinStreakT <= 0) coinStreak = 0;

    for (const c of cars) {
      // ---- controls ----
      let ctl;
      if (c.isPlayer && !c.finished && !autopilot) {
        const left = inp.down('ArrowLeft', 'KeyA'), right = inp.down('ArrowRight', 'KeyD');
        const brake = inp.down('ArrowDown', 'KeyS');
        // (little kids: the car drives itself forward, they only steer; brake still works)
        // (it eases off before sharp bends, like a grown-up holding the back of the seat)
        const easeOff = g.little && !c.onShort && Math.hypot(c.vx, c.vy) > vlimAt(T.main, c.s + 90) * 1.08;
        const gas = inp.down('ArrowUp', 'KeyW') || (g.little && !brake && !easeOff);
        let steer = (right ? 1 : 0) - (left ? 1 : 0);
        // a gentle helping hand keeps the car pointing along the road
        if (!steer && c.surface === 'road') {
          const d = math.angleDiff(c.a, Math.atan2(T.main.ty[c.near.i], T.main.tx[c.near.i]));
          if (Math.abs(d) < 1.2) steer = g.little ? math.clamp(d * 1.4, -0.6, 0.6) : math.clamp(d * 0.5, -0.2, 0.2);
        }
        // Little kids: a much stronger helping hand. Off the road (or drifting
        // toward the edge) the car steers itself back to the middle of the road.
        // (on a shortcut it follows the shortcut instead)
        const onS = c.onShort && c.nearShort, n = onS ? c.nearShort : c.near, PP = onS ? T.short : T.main;
        if (g.little && !steer && n && n.dist > (onS ? T.shw : T.hw) * 0.35) {
          // aim at a spot on the middle of the road a little way ahead
          const ax = n.x + PP.tx[n.i] * 120, ay = n.y + PP.ty[n.i] * 120;
          steer = math.clamp(math.angleDiff(c.a, Math.atan2(ay - c.y, ax - c.x)) * 2.2, -1, 1);
        }
        // Smooth steering: the wheel turns in quickly but not all at once, so a
        // short tap is a small nudge and holding the button is a full turn.
        // Letting go (or switching sides) straightens up twice as fast.
        const sIn = c.steerIn || 0;
        const rate = (steer && Math.sign(steer) === Math.sign(sIn) && Math.abs(steer) > Math.abs(sIn)) || !sIn ? 7 : 14;
        c.steerIn = sIn + math.clamp(steer - sIn, -rate * dt, rate * dt);
        ctl = { gas, brake, steer: c.steerIn };
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
      if (c.phaseT > 0) c.phaseT -= dt;
      // Magnet: pulled toward the closest car ahead in the race
      c.magTarget = null;
      if (c.magnet > 0) {
        c.magnet -= dt;
        let best = null, bd = 900;
        for (const o of racers()) if (o !== c && !o.finished && o.progress > c.progress) { const d = Math.hypot(o.x - c.x, o.y - c.y); if (d < bd) { bd = d; best = o; } }
        if (best && bd > 50) { c.vx += (best.x - c.x) / bd * 320 * dt; c.vy += (best.y - c.y) / bd * 320 * dt; c.magTarget = best; }
      }
      c.bumpCool = Math.max(0, c.bumpCool - dt);
      c.oilCool = Math.max(0, (c.oilCool || 0) - dt);
      c.star = Math.max(0, (c.star || 0) - dt);
      c.cloud = Math.max(0, (c.cloud || 0) - dt);
      if (c.star > 0 && Math.random() < dt * 30) fx.burst(c.x, c.y, { count: 1, shape: 'star', speed: 80, gravity: 0, size: 12, life: 0.5 });

      slipstream(g, c, dt);
      drive(g, c, ctl, dt);
      // wind pushes everyone sideways a little (clouds catch more wind!)
      if (wind && !c.finished && !hasPerk(c, 'hover')) { const k = wind.f * (c.cloud > 0 ? 1.8 : 1) * dt; c.vx += Math.cos(wind.a) * k; c.vy += Math.sin(wind.a) * k; }
      // flying off a ramp: a short hop, then a bumpy landing
      if (c.air > 0) {
        c.air -= dt;
        if (c.air <= 0) {
          c.air = 0;
          fx.burst(c.x, c.y, { count: 12, colors: theme.dust, speed: 160, gravity: 0, size: 12, life: 0.5 });
          if (c.isPlayer) { Arcade.audio.noise(0.2, { freq: 400, vol: 0.35 }); g.sfx('bonk'); }
          if (hasPerk(c, 'jump')) { c.boost = Math.max(c.boost, 0.6); if (c.isPlayer) { popup('Quack!', c.x, c.y - 50, '#ffd166'); perkSound('quack'); } }
        }
      }
      locate(c);
      walls(g, c);
      // boost pads and ramps
      for (const pd of pads) {
        let ds = c.s - pd.s; if (ds < -T.L / 2) ds += T.L; if (ds > T.L / 2) ds -= T.L;
        if (c.near.dist > T.hw + 10 || c.onShort || c.h > 0.2) continue;
        if (pd.kind === 'strip') {                       // boost lane: zoom while you stay on it
          const lat = c.near.side * c.near.dist;
          if (ds > 0 && ds < pd.len && Math.abs(lat - pd.lat) < 0.32 * T.hw) {
            c.boost = Math.max(c.boost, 0.25);
            if (c.isPlayer && !(c.stripT > raceTime)) { g.sfx('boost'); c.stripT = raceTime + 1.5; }
          }
          continue;
        }
        if (pd.kind === 'creek') {                       // a creek across the road: jump it, or splash through
          if (Math.abs(ds) > pd.len / 2 || c.air > 0 || c.cloud > 0) continue;
          if (c.padCool && c.padCool[pd.s] > raceTime) continue;
          (c.padCool = c.padCool || {})[pd.s] = raceTime + 1;
          if (!hasPerk(c, 'splash') && c.shield <= 0) { c.vx *= 0.65; c.vy *= 0.65; }
          fx.burst(c.x, c.y, { count: 16, colors: (CREEK[T.def.theme] || CREEK.yard).fx, speed: 220, gravity: 0, size: 10, life: 0.6 });
          if (c.isPlayer) { g.sfx('splash'); popup((CREEK[T.def.theme] || CREEK.yard).word, c.x, c.y - 50, '#8ecae6'); }
          continue;
        }
        if (Math.abs(ds) > 26) continue;
        if (c.padCool && c.padCool[pd.s] > raceTime) continue;
        (c.padCool = c.padCool || {})[pd.s] = raceTime + 1;
        if (pd.kind === 'boost') {
          c.boost = Math.max(c.boost, 0.7 * (c.stats.nitro || 1) * (hasPerk(c, 'boost') ? 1.35 : 1));
          if (c.isPlayer) addFeat(g, f => { f.pads = (f.pads || 0) + 1; });   // (for the Rocket)
          if (c.isPlayer && hasPerk(c, 'boost')) perkSound('rocket');
          if (c.isPlayer) { g.sfx('boost'); popup('Zoom!', c.x, c.y - 50, '#ff8c42'); }
        } else if (Math.hypot(c.vx, c.vy) > 200 && !(c.air > 0)) {
          c.air = c.airMax = hasPerk(c, 'jump') ? 0.95 : 0.6;
          if (c.isPlayer) { g.sfx('spring'); popup('Jump!', c.x, c.y - 60, '#ffd166', 36); }
        }
      }
      // coins on the track (only you collect them)
      if (c.isPlayer && !(c.h > 0.5)) for (const cn of trackCoins) {
        if (cn.t > 0 || Math.hypot(c.x - cn.x, c.y - cn.y) > 28) continue;
        cn.t = 6;                                      // comes back for the next lap
        bonusCoins += cn.value * (hasPerk(c, 'coins') ? 2 : 1);
        if (hasPerk(c, 'coins')) perkSound('sparkle');
        coinStreak++; coinStreakT = 0.9;
        g.tone(880 * Math.pow(1.06, Math.min(12, coinStreak)), 0.09, { type: 'square', vol: 0.12 });
        fx.burst(cn.x, cn.y, { count: 6, colors: ['#ffc93c', '#fff'], speed: 120, gravity: 0, size: 8, life: 0.4 });
        if (coinStreak === 6) { popup('All 6!', c.x, c.y - 60, '#ffc93c', 32); addFeat(g, f => { f.all6 = true; }); }
      }

      // ---- Free Drive stars ----
      if (c.isPlayer && mode === 'drive' && !c.finished) for (const st of driveStars) {
        if (st.got || st.up !== (c.h > 0.5) || Math.hypot(c.x - st.x, c.y - st.y) > 40) continue;
        st.got = true; starsGot++;
        g.tone(660 * Math.pow(1.06, starsGot), 0.14, { type: 'triangle', vol: 0.2, slide: 990 * Math.pow(1.06, starsGot) });
        g.sfx('star');
        fx.burst(st.x, st.y, { count: 18, shape: 'star', colors: ['#ffd166', '#fff', '#ffc93c'], speed: 220, gravity: 0, size: 13, life: 0.7 });
        popup(starsGot + '/' + driveStars.length, st.x, st.y - 50, '#ffd166', 36);
        if (starsGot === driveStars.length) {         // got them all: the end!
          c.finished = true; c.finishTime = Math.round(raceTime * 100) / 100;
          finishOrder.push(c);
          g.sfx('win'); cheer(); say('All the stars!');
          Arcade.confetti(80);
          engine.stop(); endTimer = 2.2;
        }
      }

      // ---- hazards ----
      let puddle = false;
      for (const h of hazards) {
        if (c.cloud > 0 || c.air > 0) break;               // floating on a cloud / flying: sail right over
        if (Math.hypot(c.x - h.x, c.y - h.y) > h.r + 4) continue;
        if (!!h.up !== (c.h > 0.5)) continue;             // on the bridge vs. under it
        if (h.owner === c && h.ownerT > 0) continue;      // you don't get stuck in your own honey right away
        if (h.kind === 'oil') {
          // (oilCool: after a spin you get a moment to drive off the slick,
          //  otherwise a car that stopped on the oil would spin forever)
          if (hasPerk(c, 'oil')) { if (c.isPlayer && !(c.oilCool > 0)) { c.oilCool = 1; popup('Grip!', c.x, c.y - 50, '#06d6a0'); perkSound('chug'); } }
          else if (c.spin <= 0 && c.shield <= 0 && c.ghost <= 0 && !(c.oilCool > 0)) {
            c.spin = g.pick(0.55, 0.8, 0.9);
            c.oilCool = c.spin + 1.5;
            c.vx *= 0.75; c.vy *= 0.75;
            if (c.isPlayer) { g.sfx('swish'); popup('Whee!', c.x, c.y - 50, '#c77dff'); }
          }
        } else {
          puddle = true;
          if (!c.inPuddle) {
            const slow = h.kind === 'honey' ? 0.45 : 0.7;     // honey is extra sticky
            if (c.shield <= 0 && !hasPerk(c, 'splash')) { c.vx *= slow; c.vy *= slow; }
            if (c.isPlayer) { g.sfx('splash'); popup('Splash!', c.x, c.y - 50, '#8ecae6'); if (hasPerk(c, 'splash')) perkSound('splish'); }
            fx.burst(c.x, c.y, { count: 14, colors: ['#8ecae6', '#ffffff', '#4cc9f0'], speed: 200, gravity: 0, size: 10, life: 0.6 });
          }
        }
      }
      c.inPuddle = puddle;

      // Monster Truck: a big rumble when the wheels roll onto the grass
      if (c.isPlayer && hasPerk(c, 'grass')) {
        if (c.surface === 'grass' && c.lastSurf !== 'grass' && !(c.rumbleCool > raceTime)) { perkSound('rumble'); c.rumbleCool = raceTime + 2; }
        c.lastSurf = c.surface;
      }
      // ---- moving obstacles: a gentle wobble, never a crash ----
      if (c.wob > 0) c.wob -= dt;
      if (c.wobCool > 0) c.wobCool -= dt;
      for (const m of movers) {
        if (!m.on || c.air > 0 || c.cloud > 0 || c.h > 0.5 || c.ghost > 0 || c.wobCool > 0) continue;
        const d = Math.hypot(c.x - m.x, c.y - m.y);
        if (d > m.r + CAR_R) continue;
        c.wobCool = 1.2;
        if (c.shield > 0) continue;
        c.wob = 0.6;
        c.vx *= 0.8; c.vy *= 0.8;
        c.vx += (c.x - m.x) / (d || 1) * 120; c.vy += (c.y - m.y) / (d || 1) * 120;   // nudged aside
        if (c.isPlayer) { g.sfx('bonk'); popup({ snowball: 'Brrr!', crab: 'Pinch!', gumdrop: 'Boing!', steam: 'Puff!' }[m.kind], c.x, c.y - 50, '#ffffff'); }
      }

      // ---- gift boxes ----
      for (const b of boxes) {
        if (b.t > 0 || Math.hypot(c.x - b.x, c.y - b.y) > 32 || c.h > 0.5) continue;
        b.t = 3;
        fx.burst(b.x, b.y, { count: 12, shape: 'star', speed: 180, gravity: 0, size: 12, life: 0.6 });
        if (!c.item) {
          giveItem(c);
          if (c.isPlayer && hasPerk(c, 'lucky')) perkSound('ding');
          if (c.isPlayer) {
            if (RARITY[c.item] === 'rare') { g.sfx('star'); popup('Rare!', c.x, c.y - 70, '#ffd166', 36); fx.burst(c.x, c.y, { count: 20, shape: 'star', colors: ['#ffd166', '#fff', '#ffc93c'], speed: 220, gravity: 0, size: 14, life: 0.7 }); }
            else g.sfx('coin');
          }
        }
      }

      // ---- shortcut cheer (first time each lap) ----
      if (c.isPlayer && c.onShort && sawShortcut !== c.lap) { sawShortcut = c.lap; popup('Shortcut!', c.x, c.y - 50, '#ffd166'); g.sfx('whoosh'); }

      // ---- wrong way? (driving backwards along the track for a while) ----
      if (c.isPlayer) {
        const along = c.vx * T.main.tx[c.near.i] + c.vy * T.main.ty[c.near.i];
        c.wrongWay = along < -60 && !c.onShort && mode !== 'drive' ? c.wrongWay + dt : Math.max(0, c.wrongWay - dt * 2);
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
      if (c.isPlayer) c.skidAmt = skidding && c.surface !== 'grass' && !(c.cloud > 0) ? Math.min(1, Math.abs(c.slip) / 220 + (c.spin > 0 ? 0.6 : 0)) : 0;
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
    for (const m of movers) moveMover(m, raceTime);
    for (const cn of trackCoins) cn.t = Math.max(0, cn.t - dt);
    // Time Trial: remember where you are 30 times a second (for the ghost)
    if (mode === 'trial' && !player.finished && player.lap >= 1) {
      const fi = Math.floor((raceTime - player.lapStart) * 30);
      if (fi >= ghostRec.length) ghostRec.push([Math.round(player.x), Math.round(player.y), Math.round(player.a * 100)]);
    }
    // special paints: remember where you've been for the light trail
    if (player.fx) {
      const last = player.trail[player.trail.length - 1];
      if (!last || Math.hypot(player.x - last.x, player.y - last.y) > 9) player.trail.push({ x: player.x, y: player.y, a: player.a });
      if (player.trail.length > 28) player.trail.shift();
      if (player.fx === 'gold' && Math.random() < dt * 12) fx.burst(player.x + (Math.random() - 0.5) * 40, player.y + (Math.random() - 0.5) * 30, { count: 1, colors: ['#fff6c2', '#ffd166'], shape: 'star', speed: 20, gravity: 0, size: 9, life: 0.5 });
    }
    rankCars();
    if (mode === 'friends') friendsTick(dt);
    follow(dt);

    // photo finish: you're nearly at the line on the last lap with someone right next to you
    if (!slowmoDone && player.lap === laps && !player.finished) {
      const toLine = T.L - player.s;
      if (toLine < 260 && racers().some(o => o !== player && !o.finished && Math.abs(o.progress - player.progress) < 110)) {
        slowmoDone = true; slowmo = 1.6;            // 1.6 real seconds at 30% speed
        popup('Photo finish!', player.x, player.y - 80, '#ffd166', 40);
      }
    }
    // after you cross the line, let the others zoom in for a moment, then show results
    // engine sound follows your car (updated 30 times a second)
    if (++engineTick % 4 === 0) {
      if (!engine.n && !player.finished) engine.start();
      const gas = g.input.down('ArrowUp', 'KeyW') || autopilot;
      engine.set(Math.hypot(player.vx, player.vy), gas && !player.finished, player.skidAmt || 0, player.boost > 0);
      // music follows the race: boosting or a super star = all-out music
      if (!player.finished) g.music.mood({ energy: player.boost > 0 || player.star > 0 ? 2 : 1 });
    }
    // Taking the lead: a little brass "ta-daa!" and the music goes up a key.
    // It only goes back down after you've been out of first place for 4 seconds
    // (so it doesn't flip back and forth when cars swap places).
    if (mode !== 'trial' && mode !== 'drive' && !player.finished && raceTime > 1) {
      if (player.position === 1) {
        leadKey.out = 0;
        if (!leadKey.up) { leadKey.up = true; g.music.stinger('lead'); g.music.mood({ key: 2 }); }
      } else if (leadKey.up && (leadKey.out += dt) > 4) { leadKey.up = false; g.music.mood({ key: 0 }); }
    }
    // a happy little "bling" each time you pass someone
    if (player.position < lastPlace && raceTime > 1) {
      g.tone(660 + (4 - player.position) * 220, 0.12, { type: 'triangle', vol: 0.18, slide: 1320 });
      // passing someone on the LAST lap: confetti!
      if (player.lap === laps && !player.finished) {
        popup('Passed!', player.x, player.y - 70, '#f15bb5', 36);
        fx.burst(player.x, player.y, { count: 30, shape: 'square', speed: 280, gravity: 300, size: 12, life: 1.1 });
        Arcade.confetti(50);
      }
    }
    // your place changed: a bouncy arrow next to the number (up = green, down = a soft blue)
    if (player.position !== lastPlace && raceTime > 1 && !player.finished) placeFx = { t: 1.4, up: player.position < lastPlace };
    if (placeFx && (placeFx.t -= dt) <= 0) placeFx = null;
    // rivals react when they pass you (big smile) or you pass them (surprised "oh!")
    for (const o of cars) {
      if (o.isPlayer) continue;
      const ahead = o.position < player.position;
      if (o.wasAhead !== undefined && ahead !== o.wasAhead && raceTime > 1 && !player.finished && !(o.moodCool > raceTime))
        { o.mood = { kind: ahead ? 'happy' : 'oh', t: 1.6 }; o.moodCool = raceTime + 2.5; }
      o.wasAhead = ahead;
      if (o.mood && (o.mood.t -= dt) <= 0) o.mood = null;
    }
    lastPlace = player.position;

    if (endTimer > 0) {
      endTimer -= dt;
      if (endTimer <= 0) { engine.stop(); finishRace(g); }
    }
  }

  // Cars bump like round bumper cars: push apart, bounce a little.
  function collide(g) {
    for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) {
      const a = cars[i], b = cars[j];
      if (a.ghost > 0 || b.ghost > 0 || a.air > 0 || b.air > 0) continue;   // flying cars hop right over
      if (Math.abs((a.h || 0) - (b.h || 0)) > 0.4) continue;                   // one on the bridge, one under it
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
          Arcade.audio.noise(0.12, { freq: 500, vol: 0.25 });   // + a little "thud"
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
      for (const c of racers()) {
        if (c === b.owner || c.finished || b.life <= 0) continue;
        if (Math.hypot(c.x - b.x, c.y - b.y) < 30 && Math.abs((c.h || 0) - (b.h || 0)) < 0.4) {
          b.life = 0;
          if (c.friend) { fx.burst(b.x, b.y, { count: 14, colors: ['#ffffff', '#9bf6ff', '#ffc8dd'], speed: 180, gravity: 0, size: 10, life: 0.5 }); continue; }   // (their phone floats their car)
          fx.burst(b.x, b.y, { count: 14, colors: ['#ffffff', '#9bf6ff', '#ffc8dd'], speed: 180, gravity: 0, size: 10, life: 0.5 });
          if (hasPerk(c, 'hover')) { if (c.isPlayer) perkSound('warble'); }   // UFO: the bubble just bounces off
          else if (c.shield > 0) { c.shield = 0; }
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

  // The camera follows you (looking a little ahead). It zooms out a bit when you go
  // fast, zooms in on the bridge, and zooms in more for a photo finish.
  // (camX/camY = the view's top-left corner at normal zoom; the view's middle is camX + W/2.)
  function follow(dt) {
    const sp = Math.hypot(player.vx, player.vy);
    let zt = 1 - 0.14 * math.clamp((sp - 260) / 280, 0, 1);
    if (player.h > 0.3) zt = 1.1;
    if (slowmo > 0) zt = 1.2;
    zoom += (zt - zoom) * Math.min(1, dt * (slowmo > 0 ? 6 : 1.6));
    const tx = player.x + player.vx * 0.35 - W / 2, ty = player.y + player.vy * 0.35 - H / 2;
    camX += (tx - camX) * Math.min(1, dt * 5);
    camY += (ty - camY) * Math.min(1, dt * 5);
    const hw = W / zoom / 2, hh = H / zoom / 2;           // half the visible world
    camX = math.clamp(camX + W / 2, T.box.x0 + hw, T.box.x1 - hw) - W / 2;
    camY = math.clamp(camY + H / 2, T.box.y0 + hh, T.box.y1 - hh) - H / 2;
  }
  // world point -> screen point (with zoom)
  const toScreen = (x, y) => [(x - camX - W / 2) * zoom + W / 2, (y - camY - H / 2) * zoom + H / 2];

  const ORD = n => n + (['st', 'nd', 'rd'][n - 1] || 'th');

  function finishRace(g) {
    const order = rankCars();
    if (mode === 'friends') friendsTick(0);     // (my place among the friends, not just the cars on this phone)
    const place = player.position;
    const id = T.def.id, ti = TRACKS.findIndex(t => t.id === id);
    // coins for your place (later tracks pay more) + any coin bags you used
    // (Grand Prix only — free play has no coins)
    const earned = payFor(place, payIdx()) + bonusCoins;
    if (mode === 'cup') wallet.coins = coins(wallet) + earned;
    const title = ['You won!', 'Super race!', 'Well done!'][place - 1] || 'Nice try!';
    // wins count toward the special paints
    if (mode !== 'trial' && place === 1) addFeat(g, f => {
      f.wins = (f.wins || 0) + 1;
      f.won = Object.assign({}, f.won, { [id]: true });
      if (weather === 'snow') f.snowWin = true;
      if (weather === 'rain') f.rainWin = true;
    });

    if (mode === 'trial') {
      const best = (g.save.data.ghosts || {})[id];
      g.finish({
        win: true, time: player.finishTime, title: trialRecord ? 'New record!' : 'Time Trial done!',
        lines: player.lapTimes.map((t, i) => `Lap ${i + 1}: <b>${t.toFixed(2)} s</b>${t === bestLapThisRun ? ' ⭐' : ''}`)
          .concat([best ? `Best lap ever: <b>${best.t.toFixed(2)} s</b>` : '']),
        delay: 300,
      });
      return;
    }
    if (mode === 'friends') {
      // everyone in the room, in race order: big avatar faces, 1st first
      const me = Arcade.profiles.active();
      const all = racers().map(c => ({ c, av: c.isPlayer ? Arcade.profiles.avatar(me) : Arcade.profiles.avatar(Object.assign({ pet: 'cat', color: c.color }, peers[Object.keys(friendCars).find(k => friendCars[k] === c)] || {})) }))
        .sort((a, b) => a.c.position - b.c.position);
      const rows = all.map(({ c, av }, i) => `<div style="display:flex;align-items:center;gap:10px;justify-content:center;margin:4px 0;${c.isPlayer ? 'font-weight:900' : ''}">` +
        `<span style="font-size:28px;width:44px">${ORD(i + 1)}</span><span style="width:56px;height:56px;display:inline-block;border-radius:50%;overflow:hidden;border:4px solid #2b2b2b;${c.isPlayer ? 'box-shadow:0 0 0 4px #ffd166' : ''}">${av}</span>` +
        `<span style="width:80px">${c.finished ? c.finishTime.toFixed(1) + ' s' : '…'}</span></div>`).join('');
      const again = { icon: icons.again, label: 'Again', cls: 'big', onClick: () => { if (room) room.send({ t: 'start', track: id, weather }); g.play({ id: 'fr-' + id }); } };
      g.finish({
        win: place <= 3, medal: ['gold', 'silver', 'bronze'][place - 1] || null, stars: [3, 2, 1][place - 1] || 0, time: player.finishTime,
        title, lines: [rows], delay: 300,
        buttons: [again, { icon: icons.menu, label: 'Friends', cls: 'blue', onClick: () => friendsMenu(g) }],
      });
      return;
    }
    if (mode === 'drive') {
      const best = (g.save.data.driveBest || {})[id];
      const record = !best || player.finishTime < best;
      if (record) { g.save.data.driveBest = Object.assign({}, g.save.data.driveBest, { [id]: player.finishTime }); g.store(); }
      g.finish({
        win: true, stars: 3, time: player.finishTime, title: record && best ? 'New record!' : 'All the stars!',
        lines: [`<div style="font-size:30px">${'<span style="color:#ffc93c">★</span>'.repeat(3)} ${driveStars.length}/${driveStars.length}</div>`,
          `Time: <b>${player.finishTime.toFixed(1)} s</b>`, best && !record ? `Best: <b>${best.toFixed(1)} s</b>` : ''],
        delay: 300,
      });
      return;
    }
    if (mode === 'free') {
      g.save.data.place = g.save.data.place || {};
      if (!g.save.data.place[id] || place < g.save.data.place[id]) g.save.data.place[id] = place;
      g.store();
      g.finish({
        win: place <= 3, medal: ['gold', 'silver', 'bronze'][place - 1] || null, stars: [3, 2, 1][place - 1] || 0,
        time: player.finishTime, title, lines: [raceHTML(g, order, 0)], next: true, delay: 300,
      });
      return;
    }

    // ---- Grand Prix: points for everyone, then the garage, then the next race ----
    const cup = wallet;
    order.forEach((c, i) => { cup.points[c.name] = (cup.points[c.name] || 0) + POINTS[i]; });
    cup.colors = Object.fromEntries(cars.map(c => [c.name, c.color]));
    cup.race++;
    if (cup.race < cupLen()) {
      g.store();
      g.finish({
        win: place <= 3, title, lines: [raceHTML(g, order, earned, cup.race, cupLen())], delay: 300,
        buttons: [{ icon: wrenchIcon, label: 'Garage', cls: 'big', onClick: () => openCupGarage(g) }],
      });
      return;
    }
    // the last race: who won the whole cup?
    const table = standings(cup);
    const rank = table.findIndex(r => r.name === 'You') + 1;
    cup.active = false;
    g.save.data.cupsDone = (g.save.data.cupsDone || 0) + 1;     // any cup counts for the Speedster
    const before = STYLES.filter(st => st.ok(g)).length;
    const medal = ['gold', 'silver', 'bronze'][rank - 1] || null;
    const bestKey = cupKey === 'mini' ? 'miniBest' : 'cupBest';  // trophies for cars come from the Grand Prix
    if (medal) g.save.data[bestKey] = Math.min(g.save.data[bestKey] || 9, rank);
    const cupName = CUPS[cupKey].name;
    g.store();
    // new car styles unlocked by this cup?
    STYLES.filter(st => st.ok(g)).slice(before).forEach(st => g.toast('New car: ' + st.name + '!'));
    g.finish({
      win: rank <= 3,
      title: rank === 1 ? cupName + ' Champion!' : rank <= 3 ? cupName + ': ' + ORD(rank) + ' place!' : cupName + ' done!',
      lines: [podiumHTML(g, cup, rank)], delay: 300,
      buttons: [
        { icon: trophyIcon, label: 'New ' + cupName, cls: 'big', onClick: () => g.play({ id: cupKey + 'new' }) },
        { icon: icons.menu, label: 'Menu', cls: 'blue', onClick: () => g.menu() },
      ],
    });
  }
  // After a race: pictures, not words! The top 3 cars on a podium, your place
  // (if you're not in the top 3), the coins you won, and flags for the races
  // in the cup (done ones are checkered).
  function raceHTML(g, order, earned, raceNum, raceCount) {
    const carOf = (c) => c.isPlayer ? carImg(pickedStyle(g).id, pickedCar(g).color, pickedDecal(g)) : carImg(c.style || 'classic', c.color, c.decal || 'none');
    const STEP = [{ h: 92, col: '#ffd166' }, { h: 68, col: '#dfe7ef' }, { h: 52, col: '#f4a261' }];
    const col = (i) => {
      const c = order[i]; if (!c) return '';
      return `<div class="rc-pod ${c.isPlayer ? 'me' : ''}" style="--d:${0.2 + (2 - i) * 0.2}s">
        ${c.isPlayer ? '<div class="rc-you">You!</div>' : ''}
        <img src="${carOf(c)}" alt="" class="${i === 0 ? 'rc-bob' : ''}">
        <div class="rc-step" style="height:${STEP[i].h}px;background:${STEP[i].col}"><b>${i + 1}</b></div>
      </div>`;
    };
    let html = `<div class="rc-podium-wrap"><div class="rc-podium">${col(1)}${col(0)}${col(2)}</div>`;
    const me = order.findIndex(c => c.isPlayer);
    if (me >= 3) html += `<div class="rc-mine"><img src="${carOf(order[me])}" alt=""><b>${me + 1}</b></div>`;
    const bits = [];
    if (earned) bits.push(`<span class="rc-coins">${coinSVG(40)}<b>+${earned}</b></span>`);
    if (raceCount) {
      let flags = '';
      for (let i = 0; i < raceCount; i++) flags += flagSVG(i < raceNum);
      bits.push(`<span class="rc-flags">${flags}</span>`);
    }
    if (bits.length) html += `<div class="rc-resrow">${bits.join('')}</div>`;
    return html + '</div>';
  }
  // a little flag: checkered = that race is done
  const flagSVG = (done) => `<svg viewBox="0 0 40 40" style="width:40px;height:40px"><path d="M8 4 V38" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/><path d="M10 6 H34 V24 H10 Z" fill="${done ? '#fff' : '#9aa5b1'}" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/>` +
    (done ? '<path d="M10 6 h6 v6 h-6z M22 6 h6 v6 h-6z M16 12 h6 v6 h-6z M28 12 h6 v6 h-6z M10 18 h6 v6 h-6z M22 18 h6 v6 h-6z" fill="#2b2b2b"/>' : '') + '</svg>';

  // The end of a cup: a shiny trophy and the top 3 cars standing on a podium.
  function podiumHTML(g, cup, rank) {
    const table = standings(cup);
    const carOf = (name) => name === 'You'
      ? carImg(pickedStyle(g).id, pickedCar(g).color, pickedDecal(g))
      : carImg('classic', (cup.colors || {})[name] || '#ccc', 'none');
    const STEP = [{ h: 104, col: '#ffd166' }, { h: 78, col: '#dfe7ef' }, { h: 60, col: '#f4a261' }];   // 1st, 2nd, 3rd
    const col = (i) => {
      const r = table[i]; if (!r) return '';
      const me = r.name === 'You';
      return `<div class="rc-pod ${me ? 'me' : ''}" style="--d:${0.25 + (2 - i) * 0.25}s">
        ${me ? '<div class="rc-you">You!</div>' : ''}
        <img src="${carOf(r.name)}" alt="" class="${i === 0 ? 'rc-bob' : ''}">
        <div class="rc-pname">${me ? 'You' : r.name}</div>
        <div class="rc-step" style="height:${STEP[i].h}px;background:${STEP[i].col}"><b>${i + 1}</b><span>${r.pts} pts</span></div>
      </div>`;
    };
    const cupCol = ['#ffc93c', '#cfd8e3', '#e9965a'][rank - 1] || '#bbbbbb';
    const trophy = `<svg viewBox="0 0 120 110" class="rc-trophy">
      <g class="rc-rays">${Array.from({ length: 12 }, (_, k) => `<path d="M60 55 L${60 + Math.cos(k * 0.5236 - 0.13) * 70} ${55 + Math.sin(k * 0.5236 - 0.13) * 70} L${60 + Math.cos(k * 0.5236 + 0.13) * 70} ${55 + Math.sin(k * 0.5236 + 0.13) * 70} Z" fill="${cupCol}" opacity="0.28"/>`).join('')}</g>
      <path d="M38 14 H82 V42 A22 22 0 0 1 38 42 Z" fill="${cupCol}" stroke="#2b2b2b" stroke-width="6" stroke-linejoin="round"/>
      <path d="M38 22 H24 Q22 46 42 50 M82 22 H96 Q98 46 78 50" fill="none" stroke="#2b2b2b" stroke-width="6" stroke-linecap="round"/>
      <path d="M60 64 V80" stroke="#2b2b2b" stroke-width="8"/><rect x="42" y="80" width="36" height="14" rx="4" fill="${cupCol}" stroke="#2b2b2b" stroke-width="5"/>
      <path d="M48 22 Q50 38 58 44" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
      <text x="60" y="40" font-size="20" font-weight="900" text-anchor="middle" fill="#2b2b2b" font-family="sans-serif">${rank <= 3 ? rank : ''}</text>
      <path class="rc-tw" d="M100 12 l4 -10 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 Z" fill="#fff" stroke="#2b2b2b" stroke-width="2.5"/>
      <path class="rc-tw" style="animation-delay:-0.6s" d="M14 70 l3 -8 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 Z" fill="#fff" stroke="#2b2b2b" stroke-width="2.5"/>
    </svg>`;
    const rest = table.slice(3).map((r, i) => `${ORD(i + 4)} ${r.name === 'You' ? '<b>You</b>' : r.name} — ${r.pts} pts`).join(' · ');
    return `<div class="rc-podium-wrap">${trophy}<div class="rc-podium">${col(1)}${col(0)}${col(2)}</div>${rest ? `<div class="rc-rest">${rest}</div>` : ''}</div>`;
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
  let garageTab = 'up';     // which garage tab was open last
  function openCupGarage(g) {
    g.menuMusic();                       // the garage plays the menu song
    const cup = cupOf(g);
    const next = cupTrack(cup);
    const p = screen('Garage', null);
    // your coins, always on show
    const purse = Arcade.h('div', { style: 'font-size:26px;font-weight:800;margin:2px 0 4px' });
    const paintPurse = () => { purse.innerHTML = `${coinSVG(30)} ${coins(cup)}`; };
    paintPurse();
    p.appendChild(purse);
    // three tabs: upgrades, stickers, the points table
    const garage = buildGarage(g, cup);
    garage.firstChild.style.display = 'none';          // (the purse above shows the coins)
    const shop = stickerShop(g, cup, () => { garage.__refresh(); paintPurse(); });
    shop.firstChild.style.display = 'none';
    garage.onBuy = () => { shop.__refresh(); paintPurse(); };
    const points = Arcade.h('div', {}, standingsHTML(cup));
    const pages = { up: garage, decal: shop, pts: points };
    const tabs = Arcade.h('div', { class: 'ar-btns', style: 'margin-top:0' });
    const body = Arcade.h('div', { class: 'rc-body' });
    const TABS = [['up', 'Upgrades', wrenchIcon], ['decal', 'Stickers', `<svg viewBox="0 0 48 48"><path d="M24 4 L29 18 L44 18 L32 27 L36 42 L24 33 L12 42 L16 27 L4 18 L19 18 Z" fill="#f15bb5" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/></svg>`], ['pts', 'Points', trophyIcon]];
    const show = () => {
      tabs.innerHTML = '';
      for (const [id, name, icon] of TABS) {
        const b = Arcade.h('button', { type: 'button', 'data-gtab': id, class: 'ar-btn ' + (garageTab === id ? 'yellow' : 'white') }, `${icon}<span>${name}</span>`);
        b.addEventListener('click', () => { Arcade.sfx('click'); garageTab = id; show(); });
        tabs.appendChild(b);
      }
      body.innerHTML = ''; body.appendChild(pages[garageTab]);
    };
    show();
    p.append(tabs, body);
    // bottom bar: the next track + go
    const btns = Arcade.h('div', { class: 'ar-btns', style: 'align-items:center' });
    btns.appendChild(Arcade.h('div', { style: 'display:flex;align-items:center;gap:8px;font-weight:800;font-size:17px;text-align:left' },
      trackPic(next).replace('<svg', '<svg style="width:90px;height:52px"') + `<div>Race ${cup.race + 1} of ${cupLen()}<br>${next.name}</div>`));
    const go = Arcade.h('button', { type: 'button', class: 'ar-btn big' }, `${icons.play}<span>Next race</span>`);
    go.addEventListener('click', () => { Arcade.sfx('click'); g.play({ id: cupKey }); });
    const lv = Arcade.h('button', { type: 'button', class: 'ar-btn blue' }, `${icons.menu}<span>Menu</span>`);
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
    ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.translate(-Math.round(camX + W / 2), -Math.round(camY + H / 2));
    const vw = W / zoom / 2, vh = H / zoom / 2, mx = camX + W / 2, my = camY + H / 2;
    const vis = (x, y, m = 80) => Math.abs(x - mx) < vw + m && Math.abs(y - my) < vh + m;
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
    // the shortcut sign: an arrow pointing the way in
    if (T.sign && vis(T.sign.x, T.sign.y)) drawSign(ctx, T.sign, g.time);
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

    // boost pads (glowing arrows) and jump ramps
    for (const pd of pads) if (vis(pd.x, pd.y, 150)) drawPad(ctx, pd, g.time);
    // hazards
    for (const h of hazards) if (vis(h.x, h.y)) drawHazard(ctx, h, g.time);
    for (const m of movers) if (vis(m.x, m.y, 120)) drawMover(ctx, m, g.time);
    // coins on the track
    for (const cn of trackCoins) if (cn.t <= 0 && vis(cn.x, cn.y)) {
      const sq = Math.abs(Math.cos(g.time * 4 + cn.spin));          // spinning: gets thin and fat
      ctx.beginPath(); ctx.ellipse(cn.x, cn.y, 11 * Math.max(0.2, sq), 11, 0, 0, 7);
      ctx.fillStyle = '#ffc93c'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      if (sq > 0.5) { ctx.beginPath(); ctx.ellipse(cn.x, cn.y, 5 * sq, 5.5, 0, 0, 7); ctx.lineWidth = 2; ctx.strokeStyle = '#e09f3e'; ctx.stroke(); }
    }
    // Time Trial ghost: a see-through car on your best lap
    if (ghost && ghost.f.length && player.lap >= 1 && !player.finished) {
      const fr = ghost.f[Math.min(ghost.f.length - 1, Math.floor((raceTime - player.lapStart) * 30))];
      if (fr && vis(fr[0], fr[1])) {
        ctx.save(); ctx.globalAlpha = 0.42; ctx.translate(fr[0], fr[1]); ctx.rotate(fr[2] / 100);
        drawCarShape(ctx, '#ffffff', { style: player.style });
        ctx.restore();
      }
    }
    // gift boxes
    for (const b of boxes) if (b.t <= 0 && vis(b.x, b.y)) drawBox(ctx, b, g.time);
    // Free Drive stars: big, bobbing and twinkling
    for (const st of driveStars) if (!st.got && vis(st.x, st.y)) {
      const bob = Math.sin(g.time * 3 + st.spin) * 4;
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(st.x + 4, st.y + 16, 18, 7, 0, 0, 7); ctx.fill();
      D.star(ctx, st.x, st.y - 6 + bob, 24 + Math.sin(g.time * 5 + st.spin) * 2, '#ffd166', 4);
      D.circle(ctx, st.x - 7, st.y - 12 + bob, 3.5, '#ffffff', 0);
    }

    // Magnet: a dotted pull line to the car it's pulling toward
    for (const c of cars) if (c.magTarget) {
      ctx.save(); ctx.setLineDash([6, 10]); ctx.lineDashOffset = -g.time * 60; ctx.lineWidth = 5; ctx.strokeStyle = '#ef476f';
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.magTarget.x, c.magTarget.y); ctx.stroke(); ctx.restore();
    }
    // light trail behind special paints (neon / rainbow)
    if (player.fx && player.fx !== 'gold' && player.trail.length > 2) drawTrail(ctx, player, g.time);

    // cars (furthest-up first, so lower cars overlap them nicely)
    const sorted = racers().map(c => c.friend ? Object.assign({}, FRIEND_CAR, c) : c).sort((a, b) => a.y - b.y);
    for (const c of sorted) if (!(c.h > 0) && vis(c.x, c.y)) drawCar(ctx, c, g.time);
    // figure-8 bridge: drawn over the road (and cars) below it, then the cars on top
    if (T.bridge) {
      drawBridge(ctx, g.time);
      for (const c of sorted) if (c.h > 0 && vis(c.x, c.y)) drawCar(ctx, c, g.time);
    }
    // bubbles
    for (const b of bubbles) drawBubble(ctx, b.x, b.y, 16, g.time);
    fx.draw(ctx);
    // popups float above things in the world
    for (const p of popups) D.text(ctx, p.text, p.x, p.y, { size: p.size, color: p.color });
    ctx.restore();
    if (theme.night) drawNight(ctx);
    drawWeather(ctx, g.time);
  }

  // Creeks across the road look different on every track.
  const CREEK = {
    yard:    { fill: '#6fc3ec', line: '#ffffff', fx: ['#8ecae6', '#ffffff'], word: 'Splash!' },
    beach:   { fill: '#38b6e0', line: '#ffffff', fx: ['#8ecae6', '#ffffff'], word: 'Splash!' },
    snow:    { fill: '#cfe8ff', line: '#ffffff', fx: ['#ffffff', '#cfe8ff'], word: 'Slush!' },
    autumn:  { fill: '#5fa8d3', line: '#ffb703', fx: ['#8ecae6', '#ffb703'], word: 'Splash!' },
    desert:  { fill: '#d9a35b', line: '#b5793a', fx: ['#e8c27a', '#fbe3b0'], word: 'Quicksand!' },
    candy:   { fill: '#8d5524', line: '#c68b59', fx: ['#8d5524', '#ffb3d9'], word: 'Chocolate!' },
    moon:    { fill: '#3b3366', line: '#9b8bd4', fx: ['#9b8bd4', '#ffffff'], word: 'Moon dust!' },
    volcano: { fill: '#ff7b00', line: '#ffd166', fx: ['#ff7b00', '#ffd166'], word: 'Hot hot!' },
    jungle:  { fill: '#2a9d8f', line: '#b9fbc0', fx: ['#8ecae6', '#b9fbc0'], word: 'Splash!' },
    sky:     { fill: '#bde0fe', line: '#ffffff', fx: ['#ffffff', '#bde0fe'], word: 'Whoops!' },
  };

  // An arrow sign on a post that wiggles a little: "secret path this way!"
  function drawSign(ctx, sg, time) {
    ctx.save(); ctx.translate(sg.x, sg.y);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(6, 8, 26, 12, 0, 0, 7); ctx.fill();
    D.circle(ctx, 0, 0, 7, '#8b5a2b', 3);                                         // the post (seen from above)
    ctx.rotate(sg.a + Math.sin(time * 3) * 0.12);
    ctx.beginPath(); ctx.moveTo(-26, -13); ctx.lineTo(14, -13); ctx.lineTo(34, 0); ctx.lineTo(14, 13); ctx.lineTo(-26, 13); ctx.closePath();
    ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(16, 0); ctx.moveTo(8, -7); ctx.lineTo(16, 0); ctx.lineTo(8, 7);
    ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();
    ctx.restore();
  }

  // Moving obstacles: a rolling snowball, a crab, a bouncy gumdrop, a steam vent.
  function drawMover(ctx, m, time) {
    ctx.save(); ctx.translate(m.x, m.y);
    if (m.kind === 'snowball') {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(5, 8, 24, 16, 0, 0, 7); ctx.fill();
      D.circle(ctx, 0, 0, 24, '#ffffff', 4);
      ctx.rotate(m.spin); ctx.strokeStyle = '#bcd7f0'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 14, 0.3, 1.6); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 8, 3.4, 4.6); ctx.stroke();
    } else if (m.kind === 'crab') {
      ctx.rotate(m.a + Math.PI / 2); ctx.scale(1.4, 1.4);
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (const sg of [-1, 1]) for (let k = 0; k < 3; k++) {           // wiggly legs
        const wig = Math.sin(time * 18 + k) * 3;
        ctx.beginPath(); ctx.moveTo(sg * 12, -4 + k * 5); ctx.lineTo(sg * 22, -2 + k * 6 + wig); ctx.stroke();
      }
      for (const sg of [-1, 1]) { D.circle(ctx, sg * 18, -14, 7, '#ff6b4a', 3); ctx.beginPath(); ctx.moveTo(sg * 18, -21); ctx.lineTo(sg * 18, -14); ctx.stroke(); }   // claws
      ctx.beginPath(); ctx.ellipse(0, 0, 16, 12, 0, 0, 7); ctx.fillStyle = '#ff6b4a'; ctx.fill(); ctx.lineWidth = 3.5; ctx.stroke();
      for (const sg of [-1, 1]) { D.circle(ctx, sg * 5, -12, 4, '#ffffff', 2); D.circle(ctx, sg * 5, -12, 2, INK, 0); }
      ctx.beginPath(); ctx.arc(0, -2, 5, 0.3, 2.8); ctx.lineWidth = 2.5; ctx.stroke();
    } else if (m.kind === 'gumdrop') {
      const sc = 1 + m.z * 0.35, col = ['#ef476f', '#06d6a0', '#ffd166', '#9b5de5'][Math.floor(m.ph) % 4];
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(4, 6, 22 * (1 - m.z * 0.4), 14 * (1 - m.z * 0.4), 0, 0, 7); ctx.fill();
      ctx.translate(0, -m.z * 46); ctx.scale(sc * 1.3, sc * 1.3);
      ctx.beginPath(); ctx.moveTo(-22, 12); ctx.quadraticCurveTo(-22, -22, 0, -22); ctx.quadraticCurveTo(22, -22, 22, 12); ctx.closePath();
      ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      for (const [dx, dy] of [[-10, -8], [6, -12], [10, 2], [-4, 4]]) D.circle(ctx, dx, dy, 2, '#ffffff', 0);
      for (const sg of [-1, 1]) { D.circle(ctx, sg * 6, -2, 3.5, '#ffffff', 1.5); D.circle(ctx, sg * 6 + 1, -2, 1.8, INK, 0); }
    } else if (m.kind === 'steam') {
      D.circle(ctx, 0, 0, 20, '#3a2a28', 4);                                     // the vent
      ctx.strokeStyle = '#ff7b00'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-12, -5); ctx.lineTo(12, -5); ctx.moveTo(-12, 5); ctx.lineTo(12, 5); ctx.stroke();
      if (m.warn) for (let k = 0; k < 3; k++) D.circle(ctx, Math.sin(time * 9 + k) * 6, -8 - k * 6, 4, 'rgba(255,255,255,0.7)', 0);   // wisps: here it comes!
      if (m.puff > 0) {
        const k = m.puff;
        for (let i = 0; i < 6; i++) {
          const a = i * 1.05 + time, r = 14 + k * 26;
          ctx.globalAlpha = 0.85 * (1 - k * 0.6);
          D.circle(ctx, Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6 - k * 14, 14 + k * 12, '#ffffff', 3);
        }
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }

  // Moonlight Speedway: darker, with glowing headlights cut out of the dark.
  let nightC = null;
  function drawNight(ctx) {
    if (!nightC) { nightC = document.createElement('canvas'); nightC.width = W; nightC.height = H; }
    const n = nightC.getContext('2d');
    n.globalCompositeOperation = 'source-over';
    n.clearRect(0, 0, W, H);
    n.fillStyle = 'rgba(8,12,40,0.58)'; n.fillRect(0, 0, W, H);
    n.globalCompositeOperation = 'destination-out';
    for (const c of cars) {
      const [sx, sy] = toScreen(c.x, c.y);
      if (sx < -300 || sx > W + 300 || sy < -300 || sy > H + 300) continue;
      // a soft glow around the car
      let gr = n.createRadialGradient(sx, sy, 10, sx, sy, 80 * zoom);
      gr.addColorStop(0, 'rgba(0,0,0,0.8)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      n.fillStyle = gr; n.beginPath(); n.arc(sx, sy, 80 * zoom, 0, 7); n.fill();
      // the headlight beam: a cone out of the front
      const len = 260 * zoom, ax = Math.cos(c.a), ay = Math.sin(c.a);
      const fx0 = sx + ax * 24 * zoom, fy0 = sy + ay * 24 * zoom;
      gr = n.createRadialGradient(fx0, fy0, 6, fx0, fy0, len);
      gr.addColorStop(0, 'rgba(0,0,0,0.95)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      n.fillStyle = gr; n.beginPath(); n.moveTo(fx0, fy0);
      n.arc(fx0, fy0, len, c.a - 0.42, c.a + 0.42); n.closePath(); n.fill();
    }
    ctx.drawImage(nightC, 0, 0);
  }

  // The bridge on a figure-8 track: a shadow on the road below, side rails,
  // the road on top, and striped ramps at both ends.
  function drawBridge(ctx, time) {
    ctx.save(); ctx.lineJoin = 'round';
    ctx.lineCap = 'butt';
    ctx.strokeStyle = 'rgba(40,20,60,0.32)'; ctx.lineWidth = 2 * T.hw + 40;          // shadow on the road below
    ctx.save(); ctx.translate(26, 34); ctx.stroke(T.bridgeFlat); ctx.restore();
    // candy-cane posts holding the bridge up, on both sides of the road below
    const B = T.bridge;
    for (const d of [-B.flat + 30, B.flat - 30]) {
      const p = pointAt(T.main, B.s + d);
      for (const side of [-1, 1]) {
        const x = p.x - p.ty * side * (T.hw + 14) + 18, y = p.y + p.tx * side * (T.hw + 14) + 26;
        D.circle(ctx, x, y, 15, '#ffffff', 4);
        D.circle(ctx, x, y, 7, theme.curb, 0);
      }
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 2 * T.hw + 34; ctx.stroke(T.bridgePath);   // outline
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2 * T.hw + 24; ctx.stroke(T.bridgePath);
    ctx.setLineDash([22, 22]); ctx.strokeStyle = theme.curb; ctx.stroke(T.bridgePath); ctx.setLineDash([]);   // candy-stripe rails
    ctx.strokeStyle = theme.road; ctx.lineWidth = 2 * T.hw; ctx.stroke(T.bridgePath);
    // ramps: stripes across the road that scroll toward the top
    ctx.strokeStyle = 'rgba(255,255,255,0.32)'; ctx.lineWidth = 2 * T.hw - 8;
    ctx.setLineDash([14, 22]); ctx.lineDashOffset = -time * 40;
    for (const r of T.rampPaths) ctx.stroke(r);
    ctx.setLineDash([]); ctx.lineDashOffset = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 6; ctx.setLineDash([40, 40]); ctx.stroke(T.bridgeFlat); ctx.setLineDash([]);
    ctx.restore();
  }

  // A boost pad (three glowing arrows) or a little wooden jump ramp, across the road.
  function drawPad(ctx, pd, time) {
    if (pd.kind === 'strip') {           // boost lane: a row of glowing chevrons along one side
      ctx.save();
      for (let d = 0; d < pd.len; d += 38) {
        const p = pointAt(T.main, pd.s + d), x = p.x - p.ty * pd.lat, y = p.y + p.tx * pd.lat;
        const on = Math.floor(time * 8 - d / 38) % 3 === 0;
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(p.ty, p.tx));
        ctx.beginPath(); ctx.moveTo(-10, -0.3 * T.hw); ctx.lineTo(10, 0); ctx.lineTo(-10, 0.3 * T.hw); ctx.lineTo(-2, 0); ctx.closePath();
        ctx.fillStyle = on ? '#ff6b35' : '#ffd166'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
      return;
    }
    ctx.save(); ctx.translate(pd.x, pd.y); ctx.rotate(pd.a);
    const hw = T.hw - 6;
    if (pd.kind === 'creek') {           // a creek across the whole road, with rocks on the banks
      const st = CREEK[T.def.theme] || CREEK.yard, w = pd.len, H2 = T.hw + 26;
      ctx.beginPath(); ctx.moveTo(-w / 2, -H2);
      for (let k = 0; k <= 8; k++) ctx.lineTo(-w / 2 + Math.sin(k * 1.7) * 6, -H2 + k * H2 / 4);
      ctx.lineTo(w / 2, H2);
      for (let k = 8; k >= 0; k--) ctx.lineTo(w / 2 + Math.sin(k * 1.3 + 1) * 6, -H2 + k * H2 / 4);
      ctx.closePath(); ctx.fillStyle = st.fill; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.strokeStyle = st.line; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let k = -2; k <= 2; k++) {                // little waves drifting along
        const yy = k * H2 / 2.6 + ((time * 30) % 40) - 20;
        ctx.beginPath(); ctx.moveTo(-w / 4, yy); ctx.quadraticCurveTo(0, yy - 6, w / 4, yy); ctx.stroke();
      }
      ctx.restore();
      return;
    }
    if (pd.kind === 'boost') {
      D.box(ctx, -30, -hw, 60, hw * 2, 10, '#ffe08a', 3);
      for (let k = 0; k < 3; k++) {
        const glow = 0.55 + 0.45 * Math.sin(time * 10 - k * 1.2);
        ctx.fillStyle = glow > 0.75 ? "#ff6b35" : "#ffa45c"; ctx.strokeStyle = INK; ctx.lineWidth = 3;
        for (const y of [-hw * 0.55, 0, hw * 0.55]) {
          ctx.beginPath(); ctx.moveTo(-22 + k * 16, y - 12); ctx.lineTo(-10 + k * 16, y); ctx.lineTo(-22 + k * 16, y + 12); ctx.lineTo(-16 + k * 16, y); ctx.closePath();
          ctx.fill(); ctx.stroke();
        }
      }
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-20, -hw + 6, 52, hw * 2);
      D.box(ctx, -24, -hw, 48, hw * 2, 6, '#d39b5f', 4);                // wooden ramp
      ctx.strokeStyle = 'rgba(90,55,25,0.5)'; ctx.lineWidth = 3;
      for (let x = -16; x < 24; x += 10) { ctx.beginPath(); ctx.moveTo(x, -hw + 4); ctx.lineTo(x, hw - 4); ctx.stroke(); }
      for (let y = -hw; y < hw; y += 20) {                                // yellow and black edge
        ctx.fillStyle = (Math.round((y + hw) / 20) % 2) ? '#ffd166' : INK; ctx.fillRect(18, y, 6, Math.min(20, hw - y));
      }
    }
    ctx.restore();
  }

  // Rain streaks, snowflakes or wind lines over the whole view (screen space).
  function drawWeather(ctx, time) {
    if (weather === 'rain') {
      ctx.fillStyle = 'rgba(40,60,110,0.12)'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(220,235,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i < 90; i++) {
        const x = ((i * 97 + time * 120 - camX * 0.3) % (W + 60) + W + 60) % (W + 60) - 30;
        const y = ((i * 53 + time * 900 - camY * 0.3) % (H + 40) + H + 40) % (H + 40) - 20;
        ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 18);
      }
      ctx.stroke();
    } else if (weather === 'snow') {
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 70; i++) {
        const x = ((i * 131 + Math.sin(time + i) * 30 - camX * 0.5) % (W + 40) + W + 40) % (W + 40) - 20;
        const y = ((i * 71 + time * 70 - camY * 0.5) % (H + 40) + H + 40) % (H + 40) - 20;
        ctx.beginPath(); ctx.arc(x, y, 2 + (i % 3), 0, 7); ctx.fill();
      }
    } else if (weather === 'wind' && wind) {
      ctx.strokeStyle = `rgba(255,255,255,${0.25 + wind.f / 200})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
      const dx = Math.cos(wind.a), dy = Math.sin(wind.a);
      ctx.beginPath();
      for (let i = 0; i < 26; i++) {
        const sp = 300 + wind.f * 3;
        const x = ((i * 157 + dx * time * sp - camX * 0.6) % (W + 120) + W + 120) % (W + 120) - 60;
        const y = ((i * 89 + dy * time * sp - camY * 0.6) % (H + 120) + H + 120) % (H + 120) - 60;
        ctx.moveTo(x, y); ctx.quadraticCurveTo(x + dx * 20 - dy * 6, y + dy * 20 + dx * 6, x + dx * 44, y + dy * 44);
      }
      ctx.stroke();
    }
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
    } else if (t === 'sky') {     // a tiny twinkly star
      D.star(ctx, d.x, d.y, 6 + d.k * 4, '#fff7c2', 2);
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
    } else if (t === 'sky') {
      if (d.k < 0.75) {          // fluffy cloud
        for (const [ox, oy, rr] of [[-24, 6, 22], [0, -6, 28], [26, 6, 22], [0, 12, 22]]) D.circle(ctx, x + ox * r, y + oy * r, rr * r, '#ffffff', 4);
        for (const [ox, oy, rr] of [[-24, 6, 18], [0, -6, 24], [26, 6, 18], [0, 12, 18]]) D.circle(ctx, x + ox * r, y + oy * r, rr * r, '#ffffff', 0);
      } else {                   // a floating balloon
        ctx.beginPath(); ctx.moveTo(x, y + 18 * r); ctx.quadraticCurveTo(x - 6, y + 30 * r, x + 2, y + 40 * r); ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x, y, 16 * r, 20 * r, 0, 0, 7); ctx.fillStyle = ['#ef476f', '#ffd166', '#9b5de5', '#06d6a0'][(d.a * 3 | 0) % 4]; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
        D.circle(ctx, x - 5 * r, y - 7 * r, 4 * r, 'rgba(255,255,255,0.7)', 0);
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
  // opts.style = which car body, opts.decal = which sticker (both just looks).
  function drawCarShape(ctx, color, opts = {}) {
    const L = 3.5, style = opts.style || 'classic';
    ctx.lineJoin = 'round';
    const wheel = (wx, wy, w = 16, h = 10) => { ctx.fillStyle = '#333'; D.rr(ctx, wx - w / 2, wy - h / 2, w, h, 4); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke(); };
    const eyes = (ex, sp = 5.5, r = 4.6) => {
      for (const ey of [-sp, sp]) {
        D.circle(ctx, ex, ey, r, '#ffffff', 2);
        D.circle(ctx, ex + r * 0.35, ey, r * 0.56, INK, 0);
        D.circle(ctx, ex + r * 0.5, ey - r * 0.25, r * 0.22, '#ffffff', 0);
      }
    };
    const smile = (sx, r = 6) => { ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(sx, 0, r, -1.1, 1.1); ctx.stroke(); };
    const antenna = (x0) => {
      ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0, -10); ctx.lineTo(x0 - 8 - (opts.wag || 0), -22); ctx.stroke();
      D.circle(ctx, x0 - 8 - (opts.wag || 0), -22, 3, '#ffd166', 1.5);
    };
    let area;   // where the sticker goes: [x0, y0, x1, y1]
    if (style === 'racer') {          // Speedster: long and low, with a big wing
      for (const [wx, wy] of [[-16, -17], [-16, 17], [16, -16], [16, 16]]) wheel(wx, wy, 14, 9);
      ctx.beginPath(); ctx.moveTo(-22, -11); ctx.quadraticCurveTo(10, -12, 30, -4); ctx.lineTo(30, 4); ctx.quadraticCurveTo(10, 12, -22, 11); ctx.closePath();
      ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = L; ctx.strokeStyle = INK; ctx.stroke();
      area = [-20, -8, 4, 8];
      drawDecal(ctx, opts.decal, area, color);
      D.box(ctx, -30, -20, 8, 40, 3, shade(color, 0.75), 3);          // rear wing
      D.box(ctx, 26, -13, 5, 26, 2, shade(color, 0.75), 2.5);         // front wing
      D.box(ctx, 0, -8, 14, 16, 8, '#d6f1ff', 3);
      eyes(7, 3.8, 3.6); smile(20, 4);
    } else if (style === 'monster') {  // Monster Truck: huge bouncy wheels
      for (const [wx, wy] of [[-14, -16], [-14, 16], [14, -16], [14, 16]]) {
        D.circle(ctx, wx, wy, 11, '#2f2f2f', 3);
        ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
        for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(wx + k * 4, wy - 9); ctx.lineTo(wx + k * 4, wy + 9); ctx.stroke(); }
      }
      D.box(ctx, -22, -12, 44, 24, 8, color, L);
      area = [-19, -9, -2, 9];
      drawDecal(ctx, opts.decal, area, color);
      D.box(ctx, -4, -10, 16, 20, 6, '#d6f1ff', 3);
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, -13); ctx.lineTo(-8, 13); ctx.stroke();   // roll bar
      eyes(5); smile(16, 5);
    } else if (style === 'bus') {      // Bubble Bus: long with lots of windows
      for (const [wx, wy] of [[-20, -15], [-20, 15], [18, -15], [18, 15]]) wheel(wx, wy, 13, 8);
      D.box(ctx, -32, -14, 62, 28, 9, color, L);
      area = [-28, -10, 10, 10];
      drawDecal(ctx, opts.decal, area, color);
      for (let k = 0; k < 4; k++) { D.box(ctx, -26 + k * 10, -12, 7, 5, 2, '#d6f1ff', 2); D.box(ctx, -26 + k * 10, 7, 7, 5, 2, '#d6f1ff', 2); }
      D.box(ctx, 14, -11, 12, 22, 6, '#d6f1ff', 3);
      eyes(19, 5, 4); smile(26, 4);
    } else if (style === 'hotdog') {   // Hot Dog: a sausage (your color) in a bun
      for (const [wx, wy] of [[-16, -15], [-16, 15], [16, -15], [16, 15]]) wheel(wx, wy, 12, 8);
      ctx.beginPath(); ctx.ellipse(0, 0, 30, 15, 0, 0, 7); ctx.fillStyle = '#e9b872'; ctx.fill(); ctx.lineWidth = L; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 0, 32, 8, 0, 0, 7); ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
      area = [-24, -5, 6, 5];
      drawDecal(ctx, opts.decal, area, color);
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3; ctx.beginPath();          // mustard zig-zag
      for (let k = 0; k <= 8; k++) ctx.lineTo(-22 + k * 4.5, k % 2 ? -3 : 3);
      ctx.stroke();
      eyes(20, 3.4, 3.2); smile(28, 3);
    } else if (style === 'buggy') {    // Beach Buggy: open top, big back wheels, a roll cage
      wheel(-15, -17, 20, 12); wheel(-15, 17, 20, 12); wheel(16, -14, 13, 8); wheel(16, 14, 13, 8);
      ctx.beginPath(); ctx.moveTo(-24, -12); ctx.lineTo(10, -12); ctx.quadraticCurveTo(28, -10, 28, 0); ctx.quadraticCurveTo(28, 10, 10, 12); ctx.lineTo(-24, 12); ctx.quadraticCurveTo(-28, 0, -24, -12); ctx.closePath();
      ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = L; ctx.strokeStyle = INK; ctx.stroke();
      area = [-23, -9, -12, 9];
      drawDecal(ctx, opts.decal, area, color);
      D.box(ctx, -10, -8, 14, 16, 6, shade(color, 0.7), 2.5);                         // the seat
      ctx.strokeStyle = INK; ctx.lineWidth = 3.2; ctx.strokeRect(-12, -11, 18, 22);  // roll cage
      ctx.beginPath(); ctx.moveTo(-12, -11); ctx.lineTo(6, 11); ctx.stroke();
      D.box(ctx, 8, -9, 10, 18, 5, '#d6f1ff', 2.5);                                  // windscreen
      eyes(13, 4.2, 3.6); smile(22, 4);
    } else if (style === 'duck') {     // Rubber Duck: a bath duck on wheels (in your color)
      for (const [wx, wy] of [[-12, -14], [-12, 14], [12, -14], [12, 14]]) wheel(wx, wy, 11, 7);
      ctx.beginPath(); ctx.moveTo(-32, 0); ctx.quadraticCurveTo(-26, -16, -4, -15); ctx.quadraticCurveTo(14, -14, 16, 0); ctx.quadraticCurveTo(14, 14, -4, 15); ctx.quadraticCurveTo(-26, 16, -32, 0); ctx.closePath();
      ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = L; ctx.strokeStyle = INK; ctx.stroke();
      area = [-24, -9, -6, 9];
      drawDecal(ctx, opts.decal, area, color);
      for (const sg of [-1, 1]) { ctx.beginPath(); ctx.ellipse(-10, sg * 9, 9, 4, sg * 0.25, 0, 7); ctx.fillStyle = shade(color, 0.82); ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke(); }   // wings
      D.circle(ctx, 14, 0, 11, color, 3);                                                // head
      ctx.beginPath(); ctx.ellipse(27, 0, 7, 5, 0, 0, 7); ctx.fillStyle = '#ff8c42'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();   // beak
      eyes(16, 4.6, 3.6);
    } else if (style === 'tractor') {  // Tractor: giant back wheels, little front ones, a chimney
      for (const sg of [-1, 1]) {
        D.box(ctx, -26, sg * 17 - 7, 24, 14, 4, '#333', 3);
        ctx.strokeStyle = '#666'; ctx.lineWidth = 2.5;
        for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(-23 + k * 5, sg * 17 - 5); ctx.lineTo(-23 + k * 5, sg * 17 + 5); ctx.stroke(); }
      }
      wheel(18, -11, 11, 6); wheel(18, 11, 11, 6);
      D.box(ctx, -2, -8, 30, 16, 6, color, L);                                         // the hood
      D.box(ctx, -26, -12, 26, 24, 6, color, L);                                       // the cab
      area = [-23, -9, -10, 9];
      drawDecal(ctx, opts.decal, area, color);
      D.box(ctx, -9, -10, 9, 20, 3, '#d6f1ff', 2.5);                                    // cab window
      D.circle(ctx, 10, -4, 4, '#555', 2.5);                                            // chimney
      for (let k = 0; k < 3; k++) { ctx.fillStyle = INK; ctx.fillRect(14 + k * 4, 3, 2, 4); }  // grille
      eyes(22, 4, 3.4);
    } else if (style === 'icecream') { // Ice Cream Van: a big ice cream on the roof
      for (const [wx, wy] of [[-18, -15], [-18, 15], [17, -15], [17, 15]]) wheel(wx, wy, 13, 8);
      D.box(ctx, -30, -14, 60, 28, 8, color, L);
      area = [-27, -11, -14, 11];
      drawDecal(ctx, opts.decal, area, color);
      D.box(ctx, 15, -11, 11, 22, 5, '#d6f1ff', 3);                                     // windshield
      for (const [ox, oy, col] of [[-8, -5, '#ffc8dd'], [-8, 5, '#b9fbc0'], [1, 0, '#fff1c9']]) D.circle(ctx, ox, oy, 7.5, col, 2.5);   // three scoops
      D.circle(ctx, 3, -1, 3, '#ef476f', 1.5);                                           // cherry
      eyes(19, 4.5, 3.6); smile(27, 4);
    } else if (style === 'rocket') {   // Rocket: pointy nose, fins, and a little flame
      const fl = 8 + Math.sin((opts.wag || 0) * 3) * 2;
      ctx.beginPath(); ctx.moveTo(-26, -6); ctx.lineTo(-26 - fl - 8, 0); ctx.lineTo(-26, 6); ctx.closePath(); ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-26, -3); ctx.lineTo(-30 - fl * 0.5, 0); ctx.lineTo(-26, 3); ctx.closePath(); ctx.fillStyle = '#ff8c42'; ctx.fill();
      for (const sg of [-1, 1]) {
        wheel(10, sg * 13, 11, 6);
        ctx.beginPath(); ctx.moveTo(-14, sg * 9); ctx.lineTo(-26, sg * 20); ctx.lineTo(-28, sg * 8); ctx.closePath();
        ctx.fillStyle = shade(color, 0.75); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(-26, -10); ctx.lineTo(14, -10); ctx.quadraticCurveTo(32, -8, 38, 0); ctx.quadraticCurveTo(32, 8, 14, 10); ctx.lineTo(-26, 10); ctx.closePath();
      ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = L; ctx.strokeStyle = INK; ctx.stroke();
      area = [-24, -7, -6, 7];
      drawDecal(ctx, opts.decal, area, color);
      D.circle(ctx, 10, 0, 8.5, '#d6f1ff', 3);                                           // round window
      eyes(11, 3.4, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(30, -2, 2, 0, 7); ctx.fill();
    } else if (style === 'cupcake') {  // Cupcake: a frilly wrapper and a big swirl of frosting
      for (const [wx, wy] of [[-14, -15], [-14, 15], [14, -15], [14, 15]]) wheel(wx, wy, 12, 8);
      D.box(ctx, -26, -13, 30, 26, 6, color, L);                                        // wrapper
      area = [-24, -10, -12, 10];
      drawDecal(ctx, opts.decal, area, color);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-26 + k * 7 + 3, -12); ctx.lineTo(-26 + k * 7 + 3, 12); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(6, 0, 16, 0, 7); ctx.fillStyle = '#fff0f7'; ctx.fill(); ctx.lineWidth = L; ctx.strokeStyle = INK; ctx.stroke();   // frosting
      ctx.beginPath(); ctx.arc(6, 0, 9, 0.5, 5.6); ctx.strokeStyle = '#ffb3d9'; ctx.lineWidth = 3; ctx.stroke();
      for (const [sx, sy, col] of [[-2, -10, '#06d6a0'], [14, 9, '#118ab2'], [16, -9, '#ffd166'], [-3, 9, '#9b5de5']]) { ctx.fillStyle = col; ctx.fillRect(sx - 2, sy - 1, 4, 2.5); }
      D.circle(ctx, -2, 0, 4, '#ef476f', 2);                                            // cherry on top
      eyes(12, 4.4, 3.6); smile(19, 3.5);
    } else if (style === 'ufo') {      // UFO: a round flying saucer with a glass dome
      ctx.beginPath(); ctx.arc(0, 0, 25, 0, 7); ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = L; ctx.strokeStyle = INK; ctx.stroke();
      area = [-22, -7, -12, 7];
      drawDecal(ctx, opts.decal, area, color);
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + (opts.wag || 0) * 0.08; D.circle(ctx, Math.cos(a) * 19, Math.sin(a) * 19, 3, k % 2 ? '#ffd166' : '#9bf6ff', 1.5); }
      D.circle(ctx, 3, 0, 12, '#d6f1ff', 3);
      eyes(6, 4.6, 3.8);
    } else {                           // Zoomer: the classic little RC car
      for (const [wx, wy] of [[-14, -14], [-14, 14], [13, -14], [13, 14]]) wheel(wx, wy);
      D.box(ctx, -24, -14, 48, 28, 11, color, L);
      area = [-21, -10, -3, 10];
      drawDecal(ctx, opts.decal, area, color);
      D.box(ctx, -27, -15, 7, 30, 3, shade(color, 0.8), 3);           // rear spoiler
      D.box(ctx, -2, -11, 15, 22, 7, '#d6f1ff', 3);                   // windshield with two big shiny eyes
      eyes(6);
      smile(14);
      ctx.fillStyle = 'rgba(255,120,150,0.75)';                       // rosy cheeks
      ctx.beginPath(); ctx.arc(17, -9, 2.6, 0, 7); ctx.arc(17, 9, 2.6, 0, 7); ctx.fill();
      if (!opts.decal || opts.decal === 'none') { ctx.fillStyle = 'rgba(255,255,255,0.55)'; D.rr(ctx, -19, -3, 15, 6, 3); ctx.fill(); }
    }
    if (!['duck', 'ufo', 'rocket', 'cupcake'].includes(style)) antenna(style === 'bus' || style === 'icecream' ? -22 : style === 'racer' ? -14 : -16);
  }

  // Stickers, drawn inside the box [x0, y0, x1, y1] on the car's body.
  function drawDecal(ctx, decal, [x0, y0, x1, y1], color) {
    if (!decal || decal === 'none') return;
    const cx = (x0 + x1) / 2, w = x1 - x0, h = y1 - y0;
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (decal === 'stripes') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x0, -h * 0.28, w, h * 0.18); ctx.fillRect(x0, h * 0.1, w, h * 0.18);
    } else if (decal === 'dots') {
      for (const [dx, dy] of [[0.15, 0.25], [0.5, 0.7], [0.85, 0.3], [0.35, 0.05], [0.7, 0.95]]) D.circle(ctx, x0 + dx * w, y0 + dy * h, 2.6, '#ffffff', 0);
    } else if (decal === 'number') {
      D.circle(ctx, cx, 0, Math.min(w, h) * 0.42, '#ffffff', 2);
      D.text(ctx, '1', cx, 0.5, { size: Math.min(w, h) * 0.55, color: INK, stroke: false });
    } else if (decal === 'stars') {
      D.star(ctx, cx - w * 0.25, -h * 0.2, 4, '#ffd166', 1.2); D.star(ctx, cx + w * 0.2, h * 0.22, 4, '#ffd166', 1.2); D.star(ctx, cx + w * 0.3, -h * 0.25, 3, '#ffffff', 1);
    } else if (decal === 'hearts') {
      for (const [hx, hy, r] of [[cx - w * 0.2, -h * 0.15, 3.2], [cx + w * 0.25, h * 0.2, 2.6]]) {
        ctx.beginPath(); ctx.moveTo(hx, hy + r); ctx.bezierCurveTo(hx - r * 2, hy - r * 0.2, hx - r * 0.8, hy - r * 1.8, hx, hy - r * 0.6);
        ctx.bezierCurveTo(hx + r * 0.8, hy - r * 1.8, hx + r * 2, hy - r * 0.2, hx, hy + r); ctx.fillStyle = '#f15bb5'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = INK; ctx.stroke();
      }
    } else if (decal === 'flames') {   // flames licking back along both sides
      for (const sgn of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(x1, sgn * h * 0.12);
        ctx.quadraticCurveTo(cx, sgn * h * 0.55, x0 + w * 0.15, sgn * h * 0.3);
        ctx.quadraticCurveTo(cx - w * 0.05, sgn * h * 0.32, x0, sgn * h * 0.48);
        ctx.quadraticCurveTo(cx + w * 0.1, sgn * h * 0.62, x1, sgn * h * 0.42);
        ctx.closePath(); ctx.fillStyle = '#ff8c42'; ctx.fill(); ctx.lineWidth = 1.3; ctx.strokeStyle = INK; ctx.stroke();
      }
    } else if (decal === 'checkers') {   // a checkered racing flag pattern
      const n = 4, cw = w / n, ch = h / 3;
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
      for (let r = 0; r < 3; r++) for (let k = 0; k < n; k++) { ctx.fillStyle = (r + k) % 2 ? '#ffffff' : INK; ctx.fillRect(x0 + k * cw, y0 + r * ch, cw + 0.3, ch + 0.3); }
      ctx.restore();
      ctx.lineWidth = 1.2; ctx.strokeStyle = INK; ctx.strokeRect(x0, y0, w, h);
    } else if (decal === 'rainbow') {    // rainbow stripes down the car
      const cols = ['#ef476f', '#ff8c42', '#ffd166', '#06d6a0', '#118ab2', '#9b5de5'], bh = h / cols.length;
      cols.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x0, y0 + i * bh, w, bh + 0.3); });
      ctx.lineWidth = 1.2; ctx.strokeStyle = INK; ctx.strokeRect(x0, y0, w, h);
    } else if (decal === 'galaxy') {     // deep space: a dark patch with stars and a ringed planet
      ctx.fillStyle = '#241b4f'; D.rr(ctx, x0, y0, w, h, Math.min(w, h) * 0.3); ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = 'rgba(155,93,229,0.55)'; ctx.beginPath(); ctx.ellipse(cx - w * 0.1, h * 0.1, w * 0.3, h * 0.22, 0.5, 0, 7); ctx.fill();
      for (const [dx, dy] of [[0.15, 0.2], [0.8, 0.15], [0.3, 0.8], [0.88, 0.75], [0.55, 0.45]]) D.circle(ctx, x0 + dx * w, y0 + dy * h, 1.1, '#ffffff', 0);
      const px = x0 + w * 0.68, py = y0 + h * 0.62, pr = Math.min(w, h) * 0.17;
      D.circle(ctx, px, py, pr, '#ffd166', 1);
      ctx.beginPath(); ctx.ellipse(px, py, pr * 1.8, pr * 0.55, -0.4, 0, 7); ctx.lineWidth = 1.2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    } else if (decal === 'lightning') {
      ctx.beginPath(); ctx.moveTo(x1, -h * 0.15); ctx.lineTo(cx, h * 0.12); ctx.lineTo(cx + w * 0.05, -h * 0.05); ctx.lineTo(x0, h * 0.18); ctx.lineTo(cx - w * 0.05, -h * 0.12); ctx.lineTo(cx, h * 0.02); ctx.closePath();
      ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.lineWidth = 1.3; ctx.strokeStyle = INK; ctx.stroke();
    }
    ctx.restore();
  }

  // A picture of a car (any style / color / sticker) for the menus,
  // drawn with the SAME code as in the race, facing up.
  const carImgCache = {};
  function carImg(style, color, decal) {
    const key = style + color + decal;
    if (carImgCache[key]) return carImgCache[key];
    const c = document.createElement('canvas'); c.width = c.height = 120;
    const x = c.getContext('2d');
    const k = { rocket: 1.45, bus: 1.7, icecream: 1.7, hotdog: 1.7, duck: 1.7 }[style] || 1.8;   // long cars a bit smaller so they fit
    x.translate(60, style === 'rocket' ? 58 : 62); x.rotate(-Math.PI / 2); x.scale(k, k);
    drawCarShape(x, color, { style, decal });
    return (carImgCache[key] = c.toDataURL());
  }

  // A fading ribbon of light behind the car (neon paints, rainbow).
  function drawTrail(ctx, c, time) {
    const tr = c.trail;
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 1; i < tr.length; i++) {
      const k = i / tr.length;                       // 0 = oldest, 1 = newest
      const p0 = tr[i - 1], p1 = tr[i];
      if (Math.hypot(p1.x - p0.x, p1.y - p0.y) > 60) continue;   // skip jumps (respawn)
      ctx.strokeStyle = c.fx === 'rainbow' ? hueHex((i * 14 + time * 120) % 360) : c.color;
      ctx.globalAlpha = 0.55 * k;
      ctx.lineWidth = 6 + 12 * k;
      const bx = -Math.cos(p0.a) * 22, by = -Math.sin(p0.a) * 22;   // from the back of the car
      const cx = -Math.cos(p1.a) * 22, cy = -Math.sin(p1.a) * 22;
      ctx.beginPath(); ctx.moveTo(p0.x + bx, p0.y + by); ctx.lineTo(p1.x + cx, p1.y + cy); ctx.stroke();
    }
    ctx.restore();
  }

  // the parts drawCar needs, for a friend's car (it only knows where it is)
  const FRIEND_CAR = { phaseT: 0, ghost: 0, cloud: 0, air: 0, bubbled: 0, wob: 0, star: 0, shield: 0, spin: 0, isPlayer: false, mood: null };
  function drawCar(ctx, c, time) {
    ctx.save();
    ctx.translate(c.x, c.y);
    // shadow
    const lift = c.h || 0;                       // up on the bridge: the shadow falls further away
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(4 + 12 * lift, 6 + 16 * lift, 28, 20, 0, 0, 7); ctx.fill();
    if (c.phaseT > 0) ctx.globalAlpha = 0.45;                       // Ghost item: see-through
    else if (c.ghost > 0 && Math.floor(time * 12) % 2) ctx.globalAlpha = 0.5;
    // Cloud Ride: a fluffy cloud under the car (it puffs away at the end)
    if (c.cloud > 0) {
      const k = Math.min(1, c.cloud / 0.4);
      ctx.save(); ctx.globalAlpha = k; ctx.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
      for (const [ox, oy, r] of [[-22, 6, 18], [0, 12, 20], [22, 6, 18], [-10, -10, 18], [12, -10, 18]]) D.circle(ctx, ox, oy, r, '#ffffff', 4);
      for (const [ox, oy, r] of [[-22, 6, 15], [0, 12, 17], [22, 6, 15], [-10, -10, 15], [12, -10, 15]]) D.circle(ctx, ox, oy, r, '#ffffff', 0);
      ctx.restore();
    }
    // jumping off a ramp: the car rises up and gets bigger, then comes down
    const hop = c.air > 0 ? Math.sin(Math.PI * (1 - c.air / c.airMax)) : 0;
    const float = (c.bubbled > 0 ? Math.sin(time * 6) * 3 - 6 : c.cloud > 0 ? -10 + Math.sin(time * 4) * 3 : 0) - hop * 26;
    ctx.translate(0, float);
    ctx.save();
    ctx.rotate(c.a);
    if (c.isPlayer) ctx.scale(1.08, 1.08);
    if (c.h > 0) ctx.scale(1 + 0.16 * c.h, 1 + 0.16 * c.h);     // up on the bridge = closer to the camera
    if (c.wob > 0) ctx.rotate(Math.sin(time * 40) * 0.25 * (c.wob / 0.6));   // wobbling after a bump
    if (hop) ctx.scale(1 + hop * 0.35, 1 + hop * 0.35);
    let paint = c.color;
    if (c.fx === 'rainbow') paint = hueHex((time * 120) % 360);
    if (c.fx === 'neon' || c.fx === 'rainbow') { ctx.shadowColor = paint; ctx.shadowBlur = 16 + 6 * Math.sin(time * 6); }
    drawCarShape(ctx, paint, { wag: Math.sin(time * 9 + c.x * 0.01) * 3 * Math.min(1, Math.abs(c.vF || 0) / 200), style: c.style, decal: c.decal });
    // slipstream: white wind lines streaming past the car
    if (c.draft > 0.15) {
      ctx.save(); ctx.globalAlpha = Math.min(1, c.draft) * 0.8; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const k = (time * 3 + i * 0.25) % 1, side = i % 2 ? 1 : -1, y0 = side * (24 + (i >> 1) * 8);
        ctx.beginPath(); ctx.moveTo(30 - k * 70, y0); ctx.lineTo(10 - k * 70, y0); ctx.stroke();
      }
      ctx.restore();
    }
    if (theme.night)  // night: headlights and tail lights
      { D.circle(ctx, 27, -8, 4, '#fff6c2', 1.5); D.circle(ctx, 27, 8, 4, '#fff6c2', 1.5); D.circle(ctx, -27, -9, 3, '#ff4d6d', 1.5); D.circle(ctx, -27, 9, 3, '#ff4d6d', 1.5); }
    ctx.shadowBlur = 0;
    if (c.fx === 'gold') {                       // a shine that sweeps across the gold car
      const k = (time * 0.8) % 1.6 - 0.3;
      if (k > 0 && k < 1) D.star(ctx, -24 + 48 * k, -6 + 12 * k, 6 * Math.sin(Math.PI * k) + 2, '#ffffff', 0);
    }
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
    // rivals' faces: a speech bubble with a big smile (they passed you) or a surprised "oh!"
    if (c.mood) {
      const k = Math.min(1, (1.6 - Math.min(1.6, c.mood.t)) * 6, c.mood.t * 4);   // pop in, pop out
      ctx.save(); ctx.translate(26, -50); ctx.scale(k, k);
      ctx.beginPath(); ctx.moveTo(-10, 14); ctx.lineTo(-18, 26); ctx.lineTo(0, 16); ctx.closePath();
      ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      D.circle(ctx, 0, 0, 20, '#ffffff', 3);
      ctx.fillStyle = INK;
      if (c.mood.kind === 'happy') {
        ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-7, -2, 4, Math.PI, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(7, -2, 4, Math.PI, 0); ctx.stroke();   // ^ ^ eyes
        ctx.beginPath(); ctx.arc(0, 3, 9, 0.15, Math.PI - 0.15); ctx.fillStyle = '#ef476f'; ctx.fill(); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(-7, -5, 3.5, 0, 7); ctx.arc(7, -5, 3.5, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, 8, 5, 6.5, 0, 0, 7); ctx.fill();
      }
      ctx.restore();
    }
    // before the start: each rival's name, in its color
    if ((countdown > 0 || c.friend) && !c.isPlayer && c.name) D.text(ctx, c.name, 0, -44, { size: 17, color: c.color });
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
    } else if (item === 'cloud') {  // a fluffy cloud
      for (const [ox, oy, r] of [[-11, 4, 10], [0, -4, 12], [11, 4, 10], [0, 6, 10]]) D.circle(ctx, ox, oy, r, '#ffffff', 3.5);
      for (const [ox, oy, r] of [[-11, 4, 7.5], [0, -4, 9.5], [11, 4, 7.5], [0, 6, 8]]) D.circle(ctx, ox, oy, r, '#ffffff', 0);
      ctx.fillStyle = '#bde0fe'; ctx.beginPath(); ctx.ellipse(0, 9, 14, 3, 0, 0, 7); ctx.fill();
    } else if (item === 'star') {   // rainbow star
      D.star(ctx, 0, 0, 20, `hsl(${(performance.now() / 5) % 360} 90% 65%)`, 3.5);
      D.circle(ctx, -4, -2, 2.5, INK, 0); D.circle(ctx, 4, -2, 2.5, INK, 0);
    } else if (item === 'honey') {  // honey pot
      D.box(ctx, -15, -10, 30, 26, 10, '#ffb703', 3.5);
      D.box(ctx, -12, -17, 24, 8, 3, '#c68b59', 3);
      ctx.beginPath(); ctx.moveTo(-6, -2); ctx.quadraticCurveTo(-6, 8, -2, 8); ctx.lineWidth = 3; ctx.strokeStyle = '#ffd166'; ctx.stroke();
    } else if (item === 'spring') { // a bouncy spring
      ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath();
      for (let k = 0; k <= 6; k++) ctx.lineTo(k % 2 ? 10 : -10, 14 - k * 4.5);
      ctx.stroke(); ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 3.5; ctx.stroke();
      D.box(ctx, -14, 14, 28, 6, 3, '#ef476f', 3); D.box(ctx, -14, -18, 28, 6, 3, '#ef476f', 3);
    } else if (item === 'phase') {  // a friendly little ghost
      ctx.beginPath(); ctx.moveTo(-15, 16); ctx.lineTo(-15, -2); ctx.arc(0, -2, 15, Math.PI, 0); ctx.lineTo(15, 16);
      for (let k = 0; k < 3; k++) ctx.quadraticCurveTo(10 - k * 10, 10, 5 - k * 10, 16);
      ctx.closePath(); ctx.fillStyle = '#f4f1ff'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
      D.circle(ctx, -5, -3, 3, INK, 0); D.circle(ctx, 5, -3, 3, INK, 0);
      ctx.fillStyle = 'rgba(255,120,150,0.7)'; ctx.beginPath(); ctx.arc(-9, 3, 2.5, 0, 7); ctx.arc(9, 3, 2.5, 0, 7); ctx.fill();
    } else if (item === 'magnet') { // horseshoe magnet
      ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.arc(0, -2, 12, Math.PI, 0); ctx.lineWidth = 15; ctx.strokeStyle = INK; ctx.stroke();
      ctx.lineWidth = 9; ctx.strokeStyle = '#ef476f'; ctx.stroke();
      for (const sg of [-1, 1]) { D.box(ctx, sg * 12 - 6, -3, 12, 12, 2, '#ef476f', 3); D.box(ctx, sg * 12 - 6, 8, 12, 8, 2, '#dfe7ef', 3); }
    } else if (item === 'popper') { // party popper with confetti
      ctx.beginPath(); ctx.moveTo(-14, 16); ctx.lineTo(-2, -6); ctx.lineTo(8, 4); ctx.closePath();
      ctx.fillStyle = '#9b5de5'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
      for (const [cx2, cy2, col] of [[6, -12, '#ffd166'], [14, -4, '#06d6a0'], [12, -16, '#ef476f'], [-2, -16, '#4cc9f0']]) { ctx.fillStyle = col; ctx.fillRect(cx2 - 3, cy2 - 3, 6, 6); }
    } else if (item === 'warp') {   // a rainbow swirl
      const cols = ['#ef476f', '#ffd166', '#06d6a0', '#4cc9f0', '#9b5de5'];
      cols.forEach((col, k) => { ctx.beginPath(); ctx.arc(0, 0, 18 - k * 3.4, 0, 7); ctx.fillStyle = col; ctx.fill(); });
      ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(0, 0, 18, 0, 7); ctx.stroke();
      D.star(ctx, 0, 0, 6, '#ffffff', 1.5);
    } else if (item === 'coins') {  // a little bag of coins
      ctx.beginPath(); ctx.moveTo(-14, 16); ctx.quadraticCurveTo(-20, -4, -6, -8); ctx.lineTo(6, -8); ctx.quadraticCurveTo(20, -4, 14, 16); ctx.closePath();
      ctx.fillStyle = '#c68b59'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
      D.circle(ctx, 0, 4, 8, '#ffc93c', 3);
      D.box(ctx, -7, -14, 14, 7, 3, '#e9c46a', 3);
    }
    ctx.restore();
  }

  function drawHUD(g, ctx) {
    // Free Drive: no laps or places, just the time, your stars and a pointer to the closest star
    if (mode === 'drive') {
      D.text(ctx, raceTime.toFixed(1) + 's', 104, 40, { size: 24, align: 'left', color: '#fff' });
      D.box(ctx, W / 2 - 92, 12, 184, 64, 20, 'rgba(255,255,255,0.75)', 4);
      D.star(ctx, W / 2 - 50, 44, 22, '#ffd166', 4);
      D.text(ctx, starsGot + '/' + driveStars.length, W / 2 + 26, 46, { size: 36 });
      drawMinimap(ctx);
      let best = null, bd = Infinity;
      for (const st of driveStars) if (!st.got) { const d = Math.hypot(st.x - player.x, st.y - player.y); if (d < bd) { bd = d; best = st; } }
      if (best && !player.finished) edgeArrow(ctx, best.x, best.y, '#ffd166', 'star', g.time);
      return;
    }
    // lap (with a checkered flag) — top left, right of the home button
    drawFlag(ctx, 104, 18);
    D.text(ctx, Math.max(1, Math.min(player.lap, laps)) + '/' + laps, 146, 36, { size: 34, align: 'left' });
    D.text(ctx, raceTime.toFixed(1) + 's', 104, 74, { size: 20, align: 'left', color: '#fff' });
    // Grand Prix: which race this is ("Race 3/8")
    if (mode === 'cup') D.text(ctx, 'Race ' + raceNo + '/' + cupLen(), 104, 102, { size: 20, align: 'left', color: '#ffd166' });

    // wind: an arrow showing where the wind blows (and how hard)
    if (wind) {
      ctx.save(); ctx.translate(250, 42); ctx.rotate(wind.a);
      const k = 0.6 + wind.f / 120;
      ctx.beginPath(); ctx.moveTo(-18 * k, -7); ctx.lineTo(10 * k, -7); ctx.lineTo(10 * k, -15); ctx.lineTo(26 * k, 0); ctx.lineTo(10 * k, 15); ctx.lineTo(10 * k, 7); ctx.lineTo(-18 * k, 7); ctx.closePath();
      ctx.fillStyle = '#bde0fe'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      ctx.restore();
    }
    // Time Trial: this lap's time + your best lap (and no places or items)
    if (mode === 'trial') {
      const lapT = player.lap >= 1 && !player.finished ? raceTime - player.lapStart : 0;
      D.text(ctx, lapT.toFixed(2), W / 2, 40, { size: 40 });
      D.text(ctx, ghost ? 'Best ' + ghost.t.toFixed(2) : 'Set a time!', W / 2, 78, { size: 22, color: '#ffd166' });
      drawMinimap(ctx);
      return;
    }

    // place — top right, left of the pause button
    const pos = player.position;
    const col = ['#ffc93c', '#dfe7ef', '#e09f5a', '#ffffff'][pos - 1];
    // (when your place changes the number bounces, with an arrow beside it)
    const bounce = placeFx ? 1 + 0.35 * Math.sin(Math.PI * Math.min(1, (1.4 - placeFx.t) * 2.5)) * (placeFx.up ? 1 : 0.4) : 1;
    ctx.save(); ctx.translate(790, 30); ctx.scale(bounce, bounce); ctx.translate(-790, -30);
    D.text(ctx, String(pos), 812, 42, { size: 60, color: col, align: 'right' });
    D.text(ctx, ['st', 'nd', 'rd', 'th'][pos - 1], 816, 52, { size: 26, color: col, align: 'left' });
    ctx.restore();
    if (placeFx) {
      const up = placeFx.up, a = Math.min(1, placeFx.t * 3), dy = (up ? -1 : 1) * (1.4 - placeFx.t) * 14;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(738, 40 + dy); if (!up) ctx.rotate(Math.PI);
      ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(17, 2); ctx.lineTo(7, 2); ctx.lineTo(7, 18); ctx.lineTo(-7, 18); ctx.lineTo(-7, 2); ctx.lineTo(-17, 2); ctx.closePath();
      ctx.fillStyle = up ? '#06d6a0' : '#8ecae6'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.restore();
    }

    // item slot — top middle
    const ix = W / 2, iy = 44;
    const ready = !!player.item;
    const pulse = ready ? 1 + Math.sin(g.time * 8) * 0.05 : 1;
    ctx.save(); ctx.translate(ix, iy); ctx.scale(pulse, pulse);
    // the slot's color shows the item's kind: cream = common, green = uncommon, gold = rare
    const kind = ready ? RARITY[player.item] : null;
    D.box(ctx, -34, -34, 68, 68, 16, ready ? RARITY_COLOR[kind] : 'rgba(255,255,255,0.6)', 4);
    if (kind === 'rare') {   // rare items sparkle
      for (let i = 0; i < 4; i++) { const a = g.time * 3 + i * Math.PI / 2; D.star(ctx, Math.cos(a) * 40, Math.sin(a) * 40, 6, '#fff', 1.5); }
    }
    ctx.restore();
    if (ready) drawItemIcon(ctx, player.item, ix, iy, 1.25);
    else { ctx.globalAlpha = 0.35; drawBoxIcon(ctx, ix, iy); ctx.globalAlpha = 1; }

    drawMinimap(ctx);
    drawLadder(ctx);
    // the car just ahead of you is off the screen? A little arrow in its color shows where it is.
    const next = racers().find(o => o.position === pos - 1);
    if (next && !player.finished && raceTime > 2) edgeArrow(ctx, next.x, next.y, next.color, 'car', g.time);

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
  // The race order under the map: one dot per car, 1st on the left. Yours is big
  // with a white ring, so you can see who is just in front of you.
  function drawLadder(ctx) {
    if (racers().length < 2) return;
    const mw = 168, mx = W - mw - 12, my = 228;
    D.box(ctx, mx, my, mw, 50, 16, 'rgba(255,255,255,0.75)', 4);
    const order = racers().slice().sort((a, b) => a.position - b.position);
    order.forEach((c, i) => {
      const x = mx + 24 + i * (mw - 48) / (order.length - 1), y = my + 25;
      if (c.isPlayer) D.circle(ctx, x, y, 19, '#ffffff', 4);
      D.circle(ctx, x, y, c.isPlayer ? 14 : 12, c.color, 3);
      D.text(ctx, String(i + 1), x, y + 1, { size: c.isPlayer ? 18 : 15, color: '#fff' });
    });
  }

  // When something you want (the car ahead, the next star) is off the screen,
  // a bobbing arrow at the edge of the screen points the way.
  function edgeArrow(ctx, wx, wy, color, kind, time) {
    const [sx, sy] = toScreen(wx, wy);
    if (sx > 30 && sx < W - 30 && sy > 30 && sy < H - 30) return;      // you can already see it
    const cx = W / 2, cy = H / 2, a = Math.atan2(sy - cy, sx - cx);
    // slide out from the middle until we reach the edge zone (keeping clear of the corner buttons)
    const k = Math.min((W / 2 - 70) / Math.abs(Math.cos(a) || 1e-6), (H / 2 - 70) / Math.abs(Math.sin(a) || 1e-6));
    const bob = Math.sin(time * 7) * 5;
    const x = cx + Math.cos(a) * (k + bob), y = math.clamp(cy + Math.sin(a) * (k + bob), 100, H - 70);
    ctx.save(); ctx.translate(x, y);
    ctx.save(); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(42, 0); ctx.lineTo(22, -15); ctx.lineTo(22, 15); ctx.closePath();
    ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
    D.circle(ctx, 0, 0, 22, 'rgba(255,255,255,0.9)', 4);
    if (kind === 'star') D.star(ctx, 0, 0, 15, '#ffd166', 3);
    else D.circle(ctx, 0, 0, 13, color, 3);
    ctx.restore();
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
    if (T.short) { ctx.lineWidth = 11 / sc; ctx.stroke(T.shortPath); ctx.strokeStyle = theme.short; ctx.lineWidth = 6 / sc; ctx.stroke(T.shortPath); }
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 9 / sc; ctx.stroke(T.mainPath);
    const p0 = T.main.pts[0];
    ctx.fillStyle = INK; ctx.fillRect(p0[0] - 4 / sc, p0[1] - 9 / sc, 8 / sc, 18 / sc);
    ctx.restore();
    // Free Drive: stars still to find
    for (const st of driveStars) if (!st.got) D.star(ctx, mx + ox + st.x * sc, my + oy + st.y * sc, 6, '#ffd166', 2);
    // cars (you on top, bigger)
    for (const c of racers().slice().sort((a, b) => a.isPlayer - b.isPlayer)) {
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

  // The level picker: Grand Prix (all tracks in a row) and Free play (any track).
  function levels(g) {
    const cup = cupOf(g);
    const active = cup && cup.active;
    const best = g.save.data.cupBest;
    const cupPic = `<svg viewBox="0 0 120 70"><rect width="120" height="70" rx="8" fill="#ffd166"/><g transform="translate(36 6) scale(1.2)">${trophyIcon.replace(/<\/?svg[^>]*>/g, '')}</g></svg>`;
    const list = [{
      id: 'cup', section: 'Grand Prix', name: active ? `Keep going: race ${cup.race + 1} of ${TRACKS.length}` : `Race all ${TRACKS.length}!`, pic: cupPic,
      meta: best ? icons.medal(['gold', 'silver', 'bronze'][best - 1]).replace('<svg', '<svg style="width:24px;height:24px;vertical-align:middle"') + ' best' : 'start with a stock car',
    }];
    if (active) list.push({ id: 'cupnew', section: 'Grand Prix', name: 'Start over', pic: cupPic.replace('#ffd166', '#bde0fe'), meta: 'new cup' });
    TRACKS.forEach((t) => {
      const gh = (g.save.data.ghosts || {})[t.id];
      list.push({ id: 'tt-' + t.id, name: t.name, section: 'Time Trial — race your ghost', pic: trackPic(t), locked: false,
        meta: gh ? '⏱ ' + gh.t.toFixed(2) + ' s' : 'no time yet', _trial: true });
    });
    TRACKS.forEach((t) => {
      const bp = bestPlace(g, t.id);
      const rec = g.save.levels[t.id] || {};
      const medal = ['gold', 'silver', 'bronze'][bp - 1];
      list.push({ ...t, section: 'Free play — any track, maxed-out car', pic: trackPic(t), locked: false,
        meta: bp < 99 ? (medal ? icons.medal(medal).replace('<svg', '<svg style="width:24px;height:24px;vertical-align:middle"') : '') + ' ' + ORD(bp) + (rec.time ? ' · ' + rec.time.toFixed(1) + 's' : '') : '' });
    });
    // Free Drive: no race, just you and 12 stars to find
    TRACKS.forEach((t) => {
      const best = (g.save.data.driveBest || {})[t.id];
      list.push({ id: 'fd-' + t.id, name: t.name, section: 'Free Drive — find the stars', pic: trackPic(t), locked: false,
        meta: best ? '★ ' + best.toFixed(1) + ' s' : '', _drive: true });
    });
    // order: Grand Prix, Free play, Time Trial, then Free Drive
    const rank = lv => lv.id.startsWith('cup') ? 0 : lv._trial ? 2 : lv._drive ? 3 : 1;
    return list.sort((a, b) => rank(a) - rank(b));
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
    if (id === 'luck') return `<svg viewBox="0 0 60 60"><path d="M30 32 Q34 46 40 54" fill="none" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/><g fill="#06d6a0" ${L}><circle cx="22" cy="22" r="10"/><circle cx="38" cy="22" r="10"/><circle cx="22" cy="38" r="10"/><circle cx="38" cy="38" r="10"/></g><circle cx="30" cy="30" r="5" fill="#ffd166" stroke="#2b2b2b" stroke-width="3"/></svg>`;
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
        wrap.__refresh();
        if (wrap.onBuy) wrap.onBuy();                    // e.g. the sticker shop greys out what you can't afford now
      });
      tile.__paint = paint;
      row.appendChild(tile);
    }
    wrap.appendChild(row);
    // repaint the coin count and every tile (also used after buying a sticker)
    wrap.__refresh = () => { paintHead(); row.querySelectorAll('.ar-tile').forEach(t => t.__paint && t.__paint()); };
    return wrap;
  }

  const imgTile = (src, extra = '', cls = '') => `<img src="${src}" alt="" class="${cls}" style="width:76px;height:76px;display:block;margin:0 auto">${extra}`;
  // menu previews of the special paints: neon glows, rainbow cycles its colors
  document.head.appendChild(Arcade.h('style', {}, `
    .rc-fx-neon { filter: drop-shadow(0 0 6px currentColor) brightness(1.1); animation: rcGlow 1.2s ease-in-out infinite alternate; }
    .rc-fx-rainbow { animation: rcHue 2s linear infinite; }
    .rc-fx-gold { animation: rcShine 1.4s ease-in-out infinite alternate; }
    .ar-tile.locked img { animation: none; }
    /* every RC menu is the same size; if something doesn't fit it scrolls inside */
    /* Every RC panel is drawn at one size (880 x 620) and then shrunk as a whole to fit
       the screen (--rc-zoom, worked out in fitPanels below), so on a phone everything
       just gets smaller instead of scrolling or changing shape. */
    .ar-panel.rc-screen { width: 880px; height: 620px; max-width: none; zoom: var(--rc-zoom, 1);
      display: flex; flex-direction: column; justify-content: safe center; overflow: hidden; }
    .ar-panel.rc-screen .ar-title { font-size: 38px; }
    .ar-panel.rc-screen .ar-setting input[type=range] { width: 260px; }
    .ar-panel.rc-screen > * { flex-shrink: 0; }
    .ar-panel.rc-screen:has(.rc-head) { justify-content: flex-start; }   /* our menus: title always at the top */
    .ar-panel.rc-screen > .rc-body, .ar-panel.rc-screen > .rc-modes { margin-top: auto; margin-bottom: auto; }
    .rc-head { display: flex; align-items: center; gap: 8px; }
    /* cup podium */
    .rc-podium-wrap { display: flex; flex-direction: column; align-items: center; }
    .rc-trophy { width: 120px; height: 110px; overflow: visible; animation: rcPop 0.6s cubic-bezier(.3,1.6,.5,1) both; }
    .rc-rays { transform-origin: 60px 55px; animation: rcSpin 8s linear infinite; }
    .rc-tw { transform-box: fill-box; transform-origin: center; animation: rcTw 1s ease-in-out infinite alternate; }
    .rc-podium { display: flex; align-items: flex-end; justify-content: center; gap: 6px; margin-top: 4px; }
    .rc-pod { width: 120px; display: flex; flex-direction: column; align-items: center; animation: rcRise 0.5s cubic-bezier(.3,1.5,.5,1) both; animation-delay: var(--d); }
    .rc-pod img { width: 70px; height: 70px; }
    .rc-pod .rc-pname { font-weight: 800; font-size: 17px; }
    .rc-pod.me .rc-pname { color: #ef476f; }
    .rc-step { width: 100%; border: 5px solid #2b2b2b; border-radius: 12px 12px 0 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 4px; box-sizing: border-box; }
    .rc-step b { font-size: 30px; line-height: 1; }
    .rc-step span { font-size: 14px; font-weight: 800; }
    .rc-you { background: #ef476f; color: #fff; font-weight: 900; font-size: 15px; padding: 2px 10px; border-radius: 999px; border: 3px solid #2b2b2b; animation: rcBounce 0.6s ease-in-out infinite alternate; }
    .rc-bob { animation: rcBounce 0.45s ease-in-out infinite alternate; }
    .rc-rest { margin-top: 8px; font-size: 16px; opacity: 0.8; }
    .rc-step { color: #2b2b2b; }
    .rc-step b { font-family: 'Lilita One', 'Arial Black', sans-serif; font-weight: 400; font-size: 34px; }
    .rc-podium-wrap .rc-pod img { width: 88px; height: 88px; }
    .rc-mine { display: flex; align-items: center; gap: 8px; margin-top: 6px; font-size: 30px; }
    .rc-mine img { width: 60px; height: 60px; }
    .rc-resrow { display: flex; align-items: center; justify-content: center; gap: 22px; margin-top: 10px; flex-wrap: wrap; }
    .rc-coins { display: inline-flex; align-items: center; gap: 6px; font-size: 34px; color: #ffd166; animation: rcPop 0.6s 0.8s cubic-bezier(.3,1.6,.5,1) both;
      text-shadow: 3px 3px 0 #2b2b2b, -2px -2px 0 #2b2b2b, 2px -2px 0 #2b2b2b, -2px 2px 0 #2b2b2b; font-family: 'Lilita One', 'Arial Black', sans-serif; }
    .rc-flags { display: inline-flex; gap: 2px; }
    @keyframes rcSpin { to { transform: rotate(360deg); } }
    @keyframes rcPop { from { transform: scale(0.2) rotate(-20deg); } }
    @keyframes rcRise { from { transform: translateY(80px); opacity: 0; } }
    @keyframes rcBounce { to { transform: translateY(-7px); } }
    @keyframes rcTw { from { transform: scale(0.6); } to { transform: scale(1.2) rotate(15deg); } }
    .rc-head .ar-title { flex: 1; margin: 0; }
    .rc-head .ar-btn { min-width: 0; padding: 8px 14px; margin: 0; }
    .rc-modes { grid-template-columns: repeat(2, minmax(0, 1fr)); width: 100%; max-width: 620px; align-self: center; }
    .rc-bigpic { height: 86px !important; }
    .rc-bigpic svg, .rc-bigpic img { height: 86px !important; width: 86px !important; }
    @keyframes rcGlow { from { filter: drop-shadow(0 0 2px #fff) brightness(1); } to { filter: drop-shadow(0 0 9px #fff) brightness(1.25); } }
    @keyframes rcHue { from { filter: hue-rotate(0deg) saturate(1.3); } to { filter: hue-rotate(360deg) saturate(1.3); } }
    @keyframes rcShine { from { filter: brightness(1); } to { filter: brightness(1.3) drop-shadow(0 0 5px #ffd166); } }`));
  // Shrink the menu panels to fit the screen (phones!), keeping their shape.
  function fitPanels() {
    // (36 = the overlay padding + a little gap; phones keep a 5% border all round)
    const f = document.documentElement.classList.contains('ar-phone') ? 0.9 : 1;
    const k = Math.min(1, (innerWidth * f - 36) / 880, (innerHeight * f - 36) / 620);
    document.documentElement.style.setProperty('--rc-zoom', k.toFixed(3));
  }
  fitPanels();
  addEventListener('resize', fitPanels);
  addEventListener('orientationchange', () => setTimeout(fitPanels, 200));

  const WEATHER_ICONS = {
    sun:  '<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="13" fill="#ffd166" stroke="#2b2b2b" stroke-width="3.5"/><path d="M30 6 V12 M30 48 V54 M6 30 H12 M48 30 H54 M13 13 L17 17 M43 43 L47 47 M47 13 L43 17 M13 47 L17 43" stroke="#2b2b2b" stroke-width="3.5" stroke-linecap="round"/></svg>',
    rain: '<svg viewBox="0 0 60 60"><path d="M14 34 C6 34 6 22 15 22 C16 12 30 10 34 18 C42 12 52 20 48 28 C56 30 54 40 46 40 H16 Z" fill="#dfe7ef" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/><path d="M20 46 L17 54 M32 46 L29 54 M44 46 L41 54" stroke="#4cc9f0" stroke-width="4" stroke-linecap="round"/></svg>',
    snow: '<svg viewBox="0 0 60 60"><path d="M30 6 V54 M9 18 L51 42 M9 42 L51 18" stroke="#4cc9f0" stroke-width="5" stroke-linecap="round"/><circle cx="30" cy="30" r="6" fill="#fff" stroke="#2b2b2b" stroke-width="3"/></svg>',
    wind: '<svg viewBox="0 0 60 60"><path d="M6 22 H38 A8 8 0 1 0 30 14 M6 34 H46 A8 8 0 1 1 38 42 M6 46 H24" fill="none" stroke="#2b2b2b" stroke-width="4.5" stroke-linecap="round"/></svg>',
  };

  // ---------------------------------------------------------------
  // Menus: a main menu with 4 big buttons, and a small screen for each
  // (Grand Prix, Free play, Time Trial, My car). Less scrolling for little fingers.
  // ---------------------------------------------------------------
  const MENU_SONG = { tempo: 158, root: 64, scale: 'major', prog: [[1, 5, 6, 4], [4, 5, 3, 6], [2, 3, 4, 5]], drums: 'disco', bass: 'octaves', lead: 'square', harmony: 'brass', pad: true, arp: true, bells: true, seed: 7777,
        tune: { A: '3/2 5 8 5 3 5 8/4 | 2/2 5 7 5 2 5 7/4 | 1/2 3 6 3 1 3 6/4 | 4/2 6 8 6 4/8',
                B: '8/4 8/2 6 8/4 11 | 9/4 9/2 7 9/4 12 | 10/4 10/2 7 10/4 12 | 8/16',
                C: '6/4 4 2/8 | 5/4 3 7/8 | 8/4 6 4/8 | 9/4 7 5/8' } };   // super upbeat!
  let carTab = 'style';     // which My car tab was open last

  // little pictures for the Race / Drive buttons in Free Play
  const FLAG_PIC = `<svg viewBox="0 0 48 48"><rect x="10" y="6" width="4" height="38" rx="2" fill="#2b2b2b"/>` +
    [0, 1, 2].map(r => [0, 1, 2, 3].map(k => `<rect x="${14 + k * 7}" y="${8 + r * 7}" width="7" height="7" fill="${(r + k) % 2 ? '#fff' : '#2b2b2b'}"/>`).join('')).join('') +
    `<rect x="14" y="8" width="28" height="21" fill="none" stroke="#2b2b2b" stroke-width="3"/></svg>`;
  const STAR_PIC = `<svg viewBox="0 0 48 48"><path d="M24 4 L29.5 17.5 L44 18.5 L33 28 L36.5 42 L24 34.5 L11.5 42 L15 28 L4 18.5 L18.5 17.5 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/></svg>`;
  // two kids side by side: playing with friends
  const FRIENDS_PIC = `<svg viewBox="0 0 48 48"><circle cx="16" cy="16" r="8" fill="#ffd166" stroke="#2b2b2b" stroke-width="3.5"/><path d="M4 42 Q4 26 16 26 Q28 26 28 42 Z" fill="#ef476f" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/><circle cx="33" cy="18" r="7" fill="#ffd166" stroke="#2b2b2b" stroke-width="3.5"/><path d="M22 42 Q22 28 33 28 Q44 28 44 42 Z" fill="#4cc9f0" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/></svg>`;
  const MENU_PICS = {
    cup: trophyIcon,
    mini: `<svg viewBox="0 0 48 48"><g transform="translate(7 9) scale(0.72)"><path d="M14 6 H34 V18 A10 10 0 0 1 14 18 Z" fill="#9bf6ff" stroke="#2b2b2b" stroke-width="5" stroke-linejoin="round"/><path d="M14 10 H6 Q6 22 16 22 M34 10 H42 Q42 22 32 22" fill="none" stroke="#2b2b2b" stroke-width="5" stroke-linecap="round"/><path d="M24 28 V36 M16 42 H32" stroke="#2b2b2b" stroke-width="6" stroke-linecap="round"/></g></svg>`,
    free: `<svg viewBox="0 0 80 80"><path d="M20 70 V10" stroke="#2b2b2b" stroke-width="6" stroke-linecap="round"/>` +
      [0, 1, 2].map(r => [0, 1, 2, 3].map(k => `<rect x="${22 + k * 11}" y="${10 + r * 10}" width="11" height="10" fill="${(r + k) % 2 ? '#fff' : '#2b2b2b'}"/>`).join('')).join('') +
      `<rect x="22" y="10" width="44" height="30" fill="none" stroke="#2b2b2b" stroke-width="4"/></svg>`,
    trial: `<svg viewBox="0 0 80 80"><circle cx="40" cy="44" r="28" fill="#fff" stroke="#2b2b2b" stroke-width="5"/><rect x="33" y="6" width="14" height="9" rx="3" fill="#ef476f" stroke="#2b2b2b" stroke-width="4"/><path d="M40 44 L40 26 M40 44 L52 52" stroke="#2b2b2b" stroke-width="5" stroke-linecap="round"/><circle cx="40" cy="44" r="4" fill="#ef476f"/></svg>`,
  };

  // a panel with a Back button and a title
  function screen(title, onBack) {
    const p = Arcade.h('div', { class: 'ar-panel wide rc-screen' });
    // [Back]  Title  [empty space as wide as Back], so the title stays centered
    const head = Arcade.h('div', { class: 'rc-head' });
    const back = Arcade.h('button', { type: 'button', class: 'ar-btn white', 'data-back': '1' }, `${icons.left}<span>Back</span>`);
    if (onBack) back.addEventListener('click', () => { Arcade.sfx('click'); onBack(); });
    else back.style.visibility = 'hidden';
    head.appendChild(back);
    head.appendChild(Arcade.h('h1', { class: 'ar-title' }, title));
    const spacer = back.cloneNode(true); spacer.style.visibility = 'hidden'; spacer.removeAttribute('data-back');
    head.appendChild(spacer);
    p.appendChild(head);
    return p;
  }
  const arcadeBtn = () => {
    const row = Arcade.h('div', { class: 'ar-btns' });
    const b = Arcade.h('button', { type: 'button', class: 'ar-btn white' }, `${icons.home}<span>Arcade</span>`);
    b.addEventListener('click', () => { location.href = '../index.html'; });
    row.appendChild(b);
    return row;
  };
  // one big tile button
  function bigTile(pic, name, meta, onClick, attrs = {}) {
    const t = Arcade.h('button', Object.assign({ type: 'button', class: 'ar-tile' }, attrs),
      `<div class="pic rc-bigpic">${pic}</div><div style="font-size:22px">${name}</div><div class="meta">${meta || ''}</div>`);
    t.addEventListener('click', () => { Arcade.sfx('click'); onClick(); });
    return t;
  }
  const wiggle = (b) => b.animate([{ transform: 'rotate(-4deg)' }, { transform: 'rotate(4deg)' }, { transform: 'none' }], 300);

  // The tracks got bigger (Nov 1): old Time Trial ghosts and best times were for the
  // old shapes, so clear them once.
  function migrate(g) {
    if ((g.save.data.trackVer || 1) >= 2) return;
    g.save.data.ghosts = {};
    for (const t of TRACKS) { const r = g.save.levels[t.id]; if (r) delete r.time; }
    g.save.data.trackVer = 2;
    g.store();
  }

  // ---- the main menu ----
  // ---- Friends: make a room (show the 3 pictures) or join one (tap the 3 pictures) ----
  function friendsMenu(g) {
    lobbyPaint = null;
    if (room && room.open) { lobby(g); return; }
    const p = screen('Friends', () => { leaveRoom(); trackMenu(g, 'free'); });
    const grid = Arcade.h('div', { class: 'ar-grid rc-modes' });
    const MAKE = `<svg viewBox="0 0 120 70"><rect width="120" height="70" rx="8" fill="#ffd166"/>${[0, 1, 2].map(i => `<g transform="translate(${8 + i * 36} 18) scale(0.34)">${Arcade.net.pic([0, 3, 6][i], 100).replace(/<\/?svg[^>]*>/g, '')}</g>`).join('')}</svg>`;
    grid.appendChild(bigTile(MAKE, 'Make a room', 'friends tap your pictures', () => { openRoom(g, Arcade.net.newCode()); lobby(g); }, { 'data-host': '1' }));
    grid.appendChild(bigTile(`<svg viewBox="0 0 120 70"><rect width="120" height="70" rx="8" fill="#bde0fe"/><g transform="translate(36 2) scale(1.4)">${FRIENDS_PIC.replace(/<\/?svg[^>]*>/g, '')}</g></svg>`, 'Join', 'tap the 3 pictures', () => joinScreen(g), { 'data-joinroom': '1' }));
    p.appendChild(grid);
    g.panel(p);
  }
  function joinScreen(g) {
    const p = screen('Join', () => friendsMenu(g));
    p.appendChild(Arcade.net.picker((code) => {
      openRoom(g, code);
      room.on('full', () => { Arcade.sfx('aww'); g.toast('That room is full'); leaveRoom(); friendsMenu(g); });
      lobby(g);
    }));
    g.panel(p);
  }
  // The lobby: the room's pictures, everyone who's in, and (for whoever made the
  // room) the tracks: tap one and every phone starts that race together.
  function lobby(g) {
    const p = screen('Friends', () => { lobbyPaint = null; leaveRoom(); friendsMenu(g); });
    p.appendChild(Arcade.h('div', {}, Arcade.net.codeHTML(roomCode, 70)));
    const who = Arcade.h('div', { class: 'net-players', 'data-players': '1' });
    p.appendChild(who);
    const body = Arcade.h('div', { class: 'rc-body', style: 'width:100%' });
    p.appendChild(body);
    lobbyPaint = () => {
      const me = Arcade.profiles.active();
      who.innerHTML = [`<span class="av">${Arcade.profiles.avatar(me)}</span>`].concat(Object.values(peers).map(m => `<span class="av">${Arcade.profiles.avatar({ pet: m.pet, color: m.color })}</span>`)).join('');
      const host = room && room.seat === Math.min(...room.players);
      body.innerHTML = '';
      if (host) {
        const grid = Arcade.h('div', { class: 'ar-grid', style: 'width:100%' });
        for (const t of TRACKS) {
          const b = Arcade.h('button', { type: 'button', class: 'ar-tile', 'data-track': 'fr-' + t.id }, `<div class="pic">${trackPic(t)}</div><div>${t.name}</div>`);
          b.addEventListener('click', () => { Arcade.sfx('go'); weather = 'sun'; g.save.data.weather = 'sun'; room.send({ t: 'start', track: t.id, weather: 'sun' }); g.play({ id: 'fr-' + t.id }); });
          grid.appendChild(b);
        }
        body.appendChild(grid);
      } else {
        // waiting for the room maker to pick a track: a bouncing flag
        body.innerHTML = `<div style="text-align:center"><div style="width:110px;margin:10px auto;animation:ar-tap 1s ease-in-out infinite">${FLAG_PIC}</div></div>`;
      }
    };
    room.on('hello', () => lobbyPaint && lobbyPaint());
    room.on('join', () => lobbyPaint && lobbyPaint());
    lobbyPaint();
    g.panel(p);
  }

  function mainMenu(g) {
    migrate(g);
    const p = screen('Mini RC Racers', null);
    const cup = cupOf(g), best = g.save.data.cupBest;
    const grid = Arcade.h('div', { class: 'ar-grid rc-modes' });
    grid.appendChild(bigTile(MENU_PICS.cup, 'Cups',
      'Mini Cup + Grand Prix',
      () => cupMenu(g), { 'data-menu': 'cup' }));   // (Mini Cup + Grand Prix)
    grid.appendChild(bigTile(MENU_PICS.free, 'Free Play', 'race or drive', () => trackMenu(g, 'free'), { 'data-menu': 'free' }));
    grid.appendChild(bigTile(MENU_PICS.trial, 'Time Trial', 'race your ghost', () => trackMenu(g, 'trial'), { 'data-menu': 'trial' }));
    grid.appendChild(bigTile(`<img src="${carImg(pickedStyle(g).id, pickedCar(g).color, pickedDecal(g))}" alt="" class="rc-fx-${pickedCar(g).fx || 'none'}">`,
      'My Car', 'colors + stickers', () => carMenu(g), { 'data-menu': 'car' }));
    p.appendChild(grid);
    const row = arcadeBtn();
    const help = Arcade.h('button', { type: 'button', class: 'ar-btn blue', 'data-help': '1' }, `${icons.help}<span>Help</span>`);
    help.addEventListener('click', () => { Arcade.sfx('click'); g.help(); });
    row.insertBefore(help, row.firstChild);
    p.appendChild(row);
    g.panel(p);
  }

  // ---- Grand Prix: keep going, or start a new one ----
  function cupMenu(g) {
    const p = screen('Cups', () => mainMenu(g));
    const grid = Arcade.h('div', { class: 'ar-grid rc-modes' });
    for (const key of ['mini', 'cup']) {
      const cup = cupOf(g, key), on = cup && cup.active, n = cupLen(key);
      const best = g.save.data[key === 'mini' ? 'miniBest' : 'cupBest'];
      const medal = best ? icons.medal(['gold', 'silver', 'bronze'][best - 1]).replace('<svg', '<svg style="width:22px;height:22px;vertical-align:middle"') + ' ' : '';
      const col = Arcade.h('div', { style: 'display:flex;flex-direction:column;gap:8px' });
      col.appendChild(bigTile(key === 'mini' ? MENU_PICS.mini : MENU_PICS.cup, CUPS[key].name,
        medal + (on ? `keep going: race ${cup.race + 1} of ${n}` : `${n} races`), () => { cupKey = key; g.play({ id: key }); }, { 'data-cup': key }));
      if (on) {
        const again = Arcade.h('button', { type: 'button', class: 'ar-btn white', 'data-cupnew': key, style: 'min-height:56px;font-size:18px' }, `${icons.again}<span>Start over</span>`);
        again.addEventListener('click', () => { Arcade.sfx('click'); cupKey = key; g.play({ id: key + 'new' }); });
        col.appendChild(again);
      }
      grid.appendChild(col);
    }
    p.appendChild(grid);
    g.panel(p);
  }


  // ---- Free play / Time Trial: weather + track picker ----
  function trackMenu(g, kind) {
    const p = screen(kind === 'trial' ? 'Time Trial' : 'Free Play', () => mainMenu(g));
    const wrow = Arcade.h('div', { class: 'ar-btns', style: 'margin-top:4px' });
    const paintWeather = () => {
      wrow.innerHTML = '';
      for (const k in WEATHER) {
        const on = (g.save.data.weather || 'sun') === k;
        const b = Arcade.h('button', { type: 'button', 'data-weather': k, class: 'ar-tile' + (on ? ' picked' : ''), style: 'min-height:0;width:84px;padding:4px' },
          `<div class="pic" style="height:42px">${WEATHER_ICONS[k].replace('<svg', '<svg style="width:42px;height:42px"')}</div><div style="font-size:13px">${WEATHER[k].name}</div>`);
        b.addEventListener('click', () => { Arcade.sfx('click'); g.save.data.weather = k; g.store(); paintWeather(); });
        wrow.appendChild(b);
      }
    };
    paintWeather();
    p.appendChild(wrow);
    // Free Play has two ways to play: Race (3 rivals, 3 laps) or Drive (just you: find the stars)
    const krow = Arcade.h('div', { class: 'ar-btns', style: 'margin-top:4px' });
    if (kind === 'free') p.appendChild(krow);
    const grid = Arcade.h('div', { class: 'ar-grid rc-body', style: 'width:100%' });
    const paintTracks = () => {
      const drive = kind === 'free' && g.save.data.freeKind === 'drive';
      krow.innerHTML = '';
      const kinds = [['race', 'Race', FLAG_PIC], ['drive', 'Drive', STAR_PIC]];
      if (Arcade.net && Arcade.net.ready()) kinds.push(['friends', 'Friends', FRIENDS_PIC]);
      for (const [k, name, pic] of kinds) {
        const b = Arcade.h('button', { type: 'button', 'data-kind': k, class: 'ar-btn ' + ((k === 'drive') === drive ? 'yellow' : 'white'), style: 'min-height:56px' }, `${pic}<span>${name}</span>`);
        b.addEventListener('click', () => { Arcade.sfx('click'); if (k === 'friends') { friendsMenu(g); return; } g.save.data.freeKind = k; g.store(); paintTracks(); });
        krow.appendChild(b);
      }
      grid.innerHTML = '';
      const show = l => kind === 'trial' ? l._trial : drive ? l._drive : (!l._trial && !l._drive && !l.id.startsWith('cup'));
      for (const lv of levels(g).filter(show)) {
        const t = Arcade.h('button', { type: 'button', class: 'ar-tile', 'data-track': lv.id },
          `<div class="pic">${lv.pic}</div><div>${lv.name}</div><div class="meta">${lv.meta || ''}</div>`);
        t.addEventListener('click', () => { Arcade.sfx('click'); g.play(lv); });
        grid.appendChild(t);
      }
    };
    paintTracks();
    p.appendChild(grid);
    g.panel(p);
  }

  // ---- My car: a big preview and 3 tabs (Style / Paint / Stickers) ----
  function carMenu(g) {
    const p = screen('My Car', () => mainMenu(g));
    const top = Arcade.h('div', { style: 'display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap' });
    const preview = Arcade.h('div');
    const tabs = Arcade.h('div', { class: 'ar-btns', style: 'margin-top:0' });
    top.append(preview, tabs);
    const body = Arcade.h('div', { class: 'ar-btns rc-body', style: 'align-content:flex-start' });
    const color = () => pickedCar(g).color;
    const TABS = [
      ['style', 'Style', `<svg viewBox="0 0 48 48"><rect x="8" y="14" width="32" height="22" rx="8" fill="#ef476f" stroke="#2b2b2b" stroke-width="4"/><circle cx="16" cy="38" r="5" fill="#333" stroke="#2b2b2b" stroke-width="3"/><circle cx="32" cy="38" r="5" fill="#333" stroke="#2b2b2b" stroke-width="3"/></svg>`],
      ['paint', 'Paint', `<svg viewBox="0 0 48 48"><path d="M24 6 C10 6 4 16 4 24 C4 34 12 42 22 42 C26 42 26 38 24 36 C22 33 24 30 28 30 H34 C40 30 44 26 44 20 C44 12 36 6 24 6 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="4"/><circle cx="14" cy="22" r="4" fill="#ef476f"/><circle cx="22" cy="14" r="4" fill="#06d6a0"/><circle cx="33" cy="16" r="4" fill="#118ab2"/></svg>`],
      ['decal', 'Stickers', `<svg viewBox="0 0 48 48"><path d="M24 4 L29 18 L44 18 L32 27 L36 42 L24 33 L12 42 L16 27 L4 18 L19 18 Z" fill="#f15bb5" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/></svg>`],
    ];
    const draw = () => {
      preview.innerHTML = `<img src="${carImg(pickedStyle(g).id, color(), pickedDecal(g))}" alt="" class="rc-fx-${pickedCar(g).fx || 'none'}" style="width:96px;height:96px;display:block">`;
      tabs.innerHTML = '';
      for (const [id, name, icon] of TABS) {
        const b = Arcade.h('button', { type: 'button', 'data-tab': id, class: 'ar-btn ' + (carTab === id ? 'yellow' : 'white') }, `${icon}<span>${name}</span>`);
        b.addEventListener('click', () => { Arcade.sfx('click'); carTab = id; draw(); });
        tabs.appendChild(b);
      }
      body.innerHTML = '';
      const tile = (attrs, html, ok, onPick) => {
        const b = Arcade.h('button', Object.assign({ type: 'button' }, attrs), html + (ok ? '' : `<div class="lock">${icons.lock}</div>`));
        b.addEventListener('click', () => { if (!ok) { Arcade.sfx('bonk'); wiggle(b); return; } onPick(); g.store(); draw(); });
        body.appendChild(b);
      };
      const label = (name, hint) => `<div style="font-size:14px">${name}</div>` + (hint ? `<div class="meta" style="font-size:12px">${hint}</div>` : '');
      if (carTab === 'style') {
        for (const st of STYLES) {
          const ok = st.ok(g), on = pickedStyle(g).id === st.id;
          tile({ 'data-style': st.id, class: 'ar-tile' + (on ? ' picked' : '') + (ok ? '' : ' locked'), style: 'min-height:0;width:118px;padding:6px 4px' },
            imgTile(carImg(st.id, color(), pickedDecal(g)), label(st.name, `<span style="color:#118ab2">${st.does}</span>` + (ok ? '' : '<br>🔒 ' + st.need))), ok, () => { Arcade.sfx('click'); g.save.data.style = st.id; });
        }
      } else if (carTab === 'paint') {
        // the 6 free colors, then the special ones you win
        for (const c of PAINTS) {
          const ok = paintOk(g, c), on = c.id === pickedCar(g).id;
          tile({ 'data-paint': c.id, class: 'ar-tile' + (on ? ' picked' : '') + (ok ? '' : ' locked'), style: c.fx ? 'min-height:0;width:118px;padding:6px 4px' : 'min-height:0;width:96px;padding:4px' },
            imgTile(carImg(pickedStyle(g).id, c.color, pickedDecal(g)), c.fx ? label(c.name, ok ? '' : c.need) : '', 'rc-fx-' + (c.fx || 'none')),
            ok, () => { Arcade.sfx(c.fx ? 'unlock' : 'click'); g.save.data.paint = c.id; });
        }
      } else {
        for (const d of DECALS) {
          const own = ownsDecal(g, d.id), on = pickedDecal(g) === d.id;
          tile({ 'data-decal': d.id, class: 'ar-tile' + (on ? ' picked' : '') + (own ? '' : ' locked'), style: 'min-height:0;width:104px;padding:4px' },
            imgTile(carImg(pickedStyle(g).id, color(), d.id), label(d.name, own ? '' : `${coinSVG(14)} ${d.price} in the Grand Prix garage`)), own, () => { Arcade.sfx('click'); g.save.data.decal = d.id; });
        }
      }
    };
    draw();
    p.appendChild(top); p.appendChild(body);
    g.panel(p);
  }

  // The sticker shop inside the Grand Prix garage (paid with this cup's coins; you keep them forever).
  function stickerShop(g, w, onBuy) {
    const box = Arcade.h('div');
    box.appendChild(Arcade.h('h2', { class: 'ar-title', style: 'font-size:22px;margin:14px 0 0' }, 'Sticker shop'));
    const row = Arcade.h('div', { class: 'ar-btns' });
    const paint = () => {
      row.innerHTML = '';
      for (const d of DECALS.slice(1)) {
        const own = ownsDecal(g, d.id);
        const b = Arcade.h('button', { type: 'button', 'data-buy': d.id, class: 'ar-tile' + (pickedDecal(g) === d.id ? ' picked' : ''), style: 'min-height:0;width:104px;padding:4px;opacity:' + (own || coins(w) >= d.price ? 1 : 0.6) },
          imgTile(carImg(pickedStyle(g).id, pickedCar(g).color, d.id), `<div style="font-size:13px">${d.name}</div><div style="font-size:14px">${own ? 'Yours!' : coinSVG(16) + ' ' + d.price}</div>`));
        b.addEventListener('click', () => {
          if (own) { Arcade.sfx('click'); g.save.data.decal = d.id; g.store(); paint(); return; }   // tap to wear it
          if (coins(w) < d.price) { Arcade.sfx('bonk'); b.animate([{ transform: 'rotate(-4deg)' }, { transform: 'rotate(4deg)' }, { transform: 'none' }], 300); return; }
          w.coins = coins(w) - d.price;
          g.save.data.decals = (g.save.data.decals || []).concat(d.id);
          g.save.data.decal = d.id;
          g.store(); Arcade.sfx('unlock'); paint(); onBuy();
        });
        row.appendChild(b);
      }
    };
    paint();
    box.appendChild(row);
    box.__refresh = paint;
    return box;
  }

  // ---------------------------------------------------------------
  // Start the game
  // ---------------------------------------------------------------
  // The title-screen logo (all drawn here as SVG: a road, the name, and a cute car zooming by).
  const checker = (x, y, cols, rows, sz) => Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) =>
    `<rect x="${x + c * sz}" y="${y + r * sz}" width="${sz}" height="${sz}" fill="${(r + c) % 2 ? '#fff' : '#2b2b2b'}"/>`).join('')).join('');
  const LOGO = `<svg viewBox="0 0 800 440" role="img" aria-label="Mini RC Racers">
  <style>
    .lg-car { animation: lgBob 0.3s ease-in-out infinite alternate; }
    .lg-wheel { animation: lgSpin 0.45s linear infinite; transform-box: fill-box; transform-origin: center; }
    .lg-puff { animation: lgPuff 0.9s ease-out infinite; transform-box: fill-box; transform-origin: center; }
    .lg-flag { animation: lgWave 0.8s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: left center; }
    .lg-tw { animation: lgTw 1.2s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: center; }
    @keyframes lgBob { to { transform: translateY(-6px); } }
    @keyframes lgSpin { to { transform: rotate(360deg); } }
    @keyframes lgPuff { from { opacity: 1; transform: scale(0.6); } to { opacity: 0; transform: scale(1.4) translateX(-30px); } }
    @keyframes lgWave { from { transform: skewY(-4deg); } to { transform: skewY(5deg) scaleX(0.94); } }
    @keyframes lgTw { from { transform: scale(0.7) rotate(-10deg); } to { transform: scale(1.15) rotate(10deg); } }
    @media (prefers-reduced-motion: reduce) { .lg-car, .lg-wheel, .lg-puff, .lg-flag, .lg-tw { animation: none; } }
  </style>
  <defs>
    <linearGradient id="lgTxt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe066"/><stop offset="1" stop-color="#ff8c42"/></linearGradient>
  </defs>
  <!-- the race track swooping under everything -->
  <path d="M -40 420 Q 400 230 840 420" fill="none" stroke="#2b2b2b" stroke-width="124"/>
  <path d="M -40 420 Q 400 230 840 420" fill="none" stroke="#ffffff" stroke-width="110"/>
  <path d="M -40 420 Q 400 230 840 420" fill="none" stroke="#ef476f" stroke-width="110" stroke-dasharray="36 36"/>
  <path d="M -40 420 Q 400 230 840 420" fill="none" stroke="#727a8c" stroke-width="88"/>
  <path d="M -40 420 Q 400 230 840 420" fill="none" stroke="#ffffff" stroke-width="7" stroke-dasharray="34 30" opacity="0.8"/>
  <!-- checkered flags -->
  <g transform="translate(36 22)"><path d="M6 4 V150" stroke="#2b2b2b" stroke-width="9" stroke-linecap="round"/>
    <g class="lg-flag"><rect x="10" y="6" width="96" height="64" fill="#fff" stroke="#2b2b2b" stroke-width="7" rx="4"/>${checker(10, 6, 6, 4, 16)}<rect x="10" y="6" width="96" height="64" fill="none" stroke="#2b2b2b" stroke-width="7" rx="4"/></g></g>
  <g transform="translate(764 22) scale(-1 1)"><path d="M6 4 V150" stroke="#2b2b2b" stroke-width="9" stroke-linecap="round"/>
    <g class="lg-flag"><rect x="10" y="6" width="96" height="64" fill="#fff" stroke="#2b2b2b" stroke-width="7" rx="4"/>${checker(10, 6, 6, 4, 16)}<rect x="10" y="6" width="96" height="64" fill="none" stroke="#2b2b2b" stroke-width="7" rx="4"/></g></g>
  <!-- sparkles -->
  <g class="lg-tw"><path d="M178 150 l7 -18 l7 18 l18 7 l-18 7 l-7 18 l-7 -18 l-18 -7 Z" fill="#fff" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/></g>
  <g class="lg-tw" style="animation-delay:-0.6s"><path d="M640 168 l6 -15 l6 15 l15 6 l-15 6 l-6 15 l-6 -15 l-15 -6 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/></g>
  <!-- the name -->
  <g font-family="'Arial Black', 'Comic Sans MS', 'Trebuchet MS', sans-serif" font-weight="900" text-anchor="middle" stroke-linejoin="round" paint-order="stroke fill">
    <text x="400" y="104" font-size="70" fill="#06d6a0" stroke="#2b2b2b" stroke-width="14" transform="rotate(-4 400 80)" letter-spacing="6">MINI</text>
    <g transform="translate(400 222) skewX(-8)">
      <text x="6" y="10" font-size="122" fill="#2b2b2b" stroke="#2b2b2b" stroke-width="18" letter-spacing="2">RC RACERS</text>
      <text x="0" y="0" font-size="122" fill="url(#lgTxt)" stroke="#2b2b2b" stroke-width="16" letter-spacing="2">RC RACERS</text>
      <text x="0" y="0" font-size="122" fill="none" stroke="#fff" stroke-width="3" opacity="0.55" letter-spacing="2" transform="translate(-3 -4)">RC RACERS</text>
    </g>
  </g>
  <!-- the car, zooming right -->
  <g transform="translate(470 352)">
    <g fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity="0.9">
      <path d="M-200 -70 H-150"/><path d="M-235 -40 H-160"/><path d="M-205 -10 H-150"/>
    </g>
    <circle class="lg-puff" cx="-128" cy="-28" r="16" fill="#fff" stroke="#2b2b2b" stroke-width="5"/>
    <circle class="lg-puff" cx="-150" cy="-46" r="12" fill="#fff" stroke="#2b2b2b" stroke-width="5" style="animation-delay:-0.45s"/>
    <ellipse cx="0" cy="8" rx="112" ry="13" fill="rgba(0,0,0,0.28)"/>
    <g class="lg-car">
      <path d="M-62 -78 L-84 -132" stroke="#2b2b2b" stroke-width="5" stroke-linecap="round"/>
      <circle cx="-84" cy="-134" r="9" fill="#ffd166" stroke="#2b2b2b" stroke-width="4"/>
      <path d="M-112 -92 H-74 M-104 -92 V-62" stroke="#2b2b2b" stroke-width="9" stroke-linecap="round"/>
      <rect x="-122" y="-104" width="52" height="16" rx="6" fill="#ef476f" stroke="#2b2b2b" stroke-width="6"/>
      <path d="M-106 -26 Q-112 -70 -72 -74 L-22 -78 Q8 -126 58 -116 Q86 -108 96 -76 Q120 -70 118 -38 Q116 -18 98 -16 L-92 -16 Q-108 -16 -106 -26 Z" fill="#ef476f" stroke="#2b2b2b" stroke-width="7" stroke-linejoin="round"/>
      <path d="M-96 -52 Q-10 -60 106 -52" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity="0.85"/>
      <path d="M-8 -80 Q14 -114 54 -108 Q76 -102 84 -80 Z" fill="#d6f1ff" stroke="#2b2b2b" stroke-width="6" stroke-linejoin="round"/>
      <circle cx="30" cy="-91" r="10" fill="#fff" stroke="#2b2b2b" stroke-width="3.5"/><circle cx="34" cy="-91" r="5.5" fill="#2b2b2b"/><circle cx="36" cy="-94" r="2" fill="#fff"/>
      <circle cx="56" cy="-91" r="10" fill="#fff" stroke="#2b2b2b" stroke-width="3.5"/><circle cx="60" cy="-91" r="5.5" fill="#2b2b2b"/><circle cx="62" cy="-94" r="2" fill="#fff"/>
      <circle cx="-46" cy="-46" r="20" fill="#fff" stroke="#2b2b2b" stroke-width="5"/>
      <text x="-46" y="-34" font-family="'Arial Black', sans-serif" font-weight="900" font-size="30" text-anchor="middle" fill="#2b2b2b">1</text>
      <path d="M96 -40 Q106 -30 116 -40" fill="none" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/>
      <circle cx="108" cy="-56" r="6" fill="#ffd166" stroke="#2b2b2b" stroke-width="3"/>
    </g>
    <g class="lg-wheel"><circle cx="-60" cy="-14" r="30" fill="#333" stroke="#2b2b2b" stroke-width="6"/><circle cx="-60" cy="-14" r="13" fill="#ddd" stroke="#2b2b2b" stroke-width="4"/><path d="M-60 -27 V-1 M-73 -14 H-47" stroke="#2b2b2b" stroke-width="4"/></g>
    <g class="lg-wheel"><circle cx="66" cy="-14" r="30" fill="#333" stroke="#2b2b2b" stroke-width="6"/><circle cx="66" cy="-14" r="13" fill="#ddd" stroke="#2b2b2b" stroke-width="4"/><path d="M66 -27 V-1 M53 -14 H79" stroke="#2b2b2b" stroke-width="4"/></g>
  </g>
</svg>`;
  const S = (inner) => `<svg viewBox="0 0 80 80">${inner}</svg>`;
  const giftIcon = `<svg viewBox="0 0 48 48"><rect x="8" y="12" width="32" height="28" rx="6" fill="#9b5de5" stroke="#2b2b2b" stroke-width="4"/><rect x="21" y="12" width="6" height="28" fill="#fff"/><rect x="8" y="23" width="32" height="6" fill="#fff"/><path d="M24 12 C16 2 8 8 16 12 M24 12 C32 2 40 8 32 12" fill="none" stroke="#2b2b2b" stroke-width="3.5" stroke-linecap="round"/></svg>`;
  const carSmall = (c) => `<g transform="translate(40 40) scale(1.1)"><rect x="-24" y="-14" width="48" height="28" rx="11" fill="${c}" stroke="#2b2b2b" stroke-width="3.5"/><rect x="-2" y="-11" width="15" height="22" rx="7" fill="#d6f1ff" stroke="#2b2b2b" stroke-width="3"/><circle cx="7" cy="-5" r="3" fill="#2b2b2b"/><circle cx="7" cy="5" r="3" fill="#2b2b2b"/></g>`;
  Arcade.start({
    id: 'rc',
    littleSpeed: 0.85,            // little kids: the race runs a bit slower
    title: 'Mini RC Racers',
    readyJingle: false,          // RC has its own "3, 2, 1, Go!" countdown
    difficulty: false,           // no Easy/Normal/Challenge: tracks get harder instead
    view: { w: W, h: H },
    background: '#4f9d4a',
    music: () => SONGS[T.def.id],   // each track plays its own song
    levelsTitle: 'Mini RC Racers',
    howTo: [
      { pic: S(`<path d="M18 26 L6 40 L18 54 M62 26 L74 40 L62 54" fill="none" stroke="#2b2b2b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>` + carSmall('#ef476f')), text: 'Steer', keys: 'Left / Right' },
      { pic: S(`<path d="M10 40 H56" stroke="#2b2b2b" stroke-width="8" stroke-linecap="round"/><path d="M44 24 L62 40 L44 56" fill="none" stroke="#06d6a0" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`), text: 'Go!', keys: 'Up = go, Down = brake' },
      { pic: S(`<g transform="translate(16 16)">${giftIcon.replace(/<\/?svg[^>]*>/g, '')}</g>`), text: 'Grab a gift, then use it', keys: 'Space / gift button' },
      { pic: S(`<ellipse cx="28" cy="44" rx="20" ry="14" fill="#2d2440" stroke="#2b2b2b" stroke-width="4"/><path d="M18 40 Q28 32 38 40" fill="none" stroke="#f15bb5" stroke-width="3"/><ellipse cx="56" cy="30" rx="18" ry="12" fill="#6fc3ec" stroke="#2b2b2b" stroke-width="4"/>`), text: 'Oil spins you, puddles splash' },
      { pic: S(`<g transform="translate(6 10) scale(1.5)"><circle cx="20" cy="20" r="16" fill="#ffc93c" stroke="#2b2b2b" stroke-width="4"/><circle cx="20" cy="20" r="9" fill="none" stroke="#e09f3e" stroke-width="3"/></g>`), text: 'Win coins, upgrade in the garage' },
      { pic: S(`<g transform="translate(-14 0)">${carSmall('#118ab2')}</g><g transform="translate(20 0)">${carSmall('#ef476f')}</g><path d="M4 22 H20 M2 58 H18 M8 40 H16" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M4 22 H20 M2 58 H18" stroke="#2b2b2b" stroke-width="1"/>`), text: 'Stay right behind a car, then zoom past!' },
      { pic: S(`<rect x="22" y="10" width="6" height="60" fill="#2b2b2b"/>` + [0, 1, 2].map(r => [0, 1, 2, 3].map(k => `<rect x="${28 + k * 9}" y="${10 + r * 9}" width="9" height="9" fill="${(r + k) % 2 ? '#fff' : '#2b2b2b'}"/>`).join('')).join('') + `<rect x="28" y="10" width="36" height="27" fill="none" stroke="#2b2b2b" stroke-width="3"/>`), text: 'Race the laps. Be 1st!' },
    ],
    buttons: {
      left: [{ id: 'ArrowLeft', icon: icons.left, label: 'Steer left' }, { id: 'ArrowRight', icon: icons.right, label: 'Steer right' }],
      right: [{ id: 'Space', icon: giftIcon, label: 'Use item' }, { id: 'ArrowDown', icon: icons.brake, label: 'Brake / reverse' }, { id: 'ArrowUp', icon: icons.gas, label: 'Gas' }],
    },
    levels,
    logo: LOGO,                  // title screen: the logo + "tap to start"
    mainMenu,                    // our own menu with sub menus (see "Menus" above)
    menuMusic: MENU_SONG,        // a laid-back garage tune in all the menus
    levelsLabel: 'Menu',
    panelClass: 'rc-screen',     // every menu/pause/results panel is the same size
    setup,
    update,
    draw: render,
    onPause: () => engine.stop(),     // (it starts again by itself when you keep playing)
  });
  // test helper: check track shapes (how close different parts of each track get)
  window.__rcCarImg = carImg;   // test-only: pictures of each car style
  window.__rcTrackPts = (id) => { const t = buildTrack(TRACKS.find(d => d.id === id)); return { pts: t.main.pts, step: t.main.step, hw: t.hw, short: t.short ? t.short.pts : null, edge: t.edge }; };   // test-only
  window.__rcTrackCheck = () => TRACKS.map(def => {
    const T2 = buildTrack(def), P = T2.main, n = P.pts.length;
    let min = Infinity;
    for (let i = 0; i < n; i += 2) for (let j = i + 2; j < n; j += 2) {
      const along = Math.min(j - i, n - (j - i)) * P.step;
      if (along < 900) continue;
      if (T2.cross && [i, j].some(k => T2.cross.some(x => Math.min(Math.abs(k * P.step - x), T2.L - Math.abs(k * P.step - x)) < 700))) continue;   // the bridge crossing is fine
      min = Math.min(min, Math.hypot(P.pts[i][0] - P.pts[j][0], P.pts[i][1] - P.pts[j][1]));
    }
    return { id: def.id, L: Math.round(T2.L), minGap: Math.round(min), hw: T2.hw, cps: T2.cps.length, sA: T2.sA, sB: T2.sB, shortL: T2.short ? Math.round(T2.short.L) : 0, minV: Math.round(Math.min(...P.vlim)) };
  });
})();
