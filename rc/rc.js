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
    { id: 't4', name: 'Autumn Woods', theme: 'autumn', time: 'sunset', hw: 92, items: [0.25, 0.6, 0.85],
      pts: [[2458, 2950], [2791, 2952], [3168, 2955], [3617, 2922], [4204, 2847], [4747, 2601], [4819, 2177], [4361, 1798], [3834, 1587], [3560, 1411], [3406, 1185], [3196, 941], [2903, 649], [2458, 320], [1865, 208], [1411, 510], [1303, 1013], [1316, 1390], [1192, 1616], [993, 1837], [813, 2113], [603, 2481], [510, 2950], [831, 3309], [1487, 3321], [2078, 3096]],
      short: { from: [3298, 2949], via: [[3437, 2424], [3355, 1873]], to: [3496, 1333] } },   // a hidden dirt shortcut
    { id: 't5', name: 'Desert Dunes', theme: 'desert', time: 'dawn', hw: 90, items: [0.2, 0.5, 0.8],
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
    { id: 't9', name: 'Jungle Rally', theme: 'jungle', time: 'evening', hw: 84, items: [0.2, 0.45, 0.7, 0.9],
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
    // SECRET (Keith, Nov 15): beat Boo in the Ghost Race on 10 different days. It stays hidden
    // until then: no locked tile, no hint. It drives through everything (cars, oil, puddles,
    // honey, bubbles, crabs...) with a maxed engine + tires, but gift boxes go right through it too.
    { id: 'ghostcar', name: 'Ghost Car',    perk: 'phase',   does: 'Drives through everything!', need: null, secret: true, ok: g => (g.save.data.booWins || 0) >= 10 },
  ];
  // the computer racers' random special cars never include the secret one
  const RIVAL_STYLES = STYLES.filter(st => st.id !== 'classic' && !st.secret);
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
    spring: 'Pogo Spring', phase: 'Ghost', magnet: 'Magnet', popper: 'Party Popper', warp: 'Rainbow Warp',
    snowball: 'Giant Snowball', boomerang: 'Boomerang', blaster: 'Triple Bubble',
    mega: 'Mega Car', freeze: 'Freeze Flake', fireworks: 'Firework Party',
    pogopad: 'Pogo Pad', bubbletrap: 'Bubble Trap', glitter: 'Glitter Trail', grippy: 'Monster Wheels', balloon: 'Water Balloon',
    trio: 'Turbo Trio', lucky: 'Lucky Dip', bee: 'Busy Bee', whirl: 'Whirlwind',
    dragon: 'Bubble Dragon', swap: 'Swap-O', disco: 'Disco Ball' };

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
  let ghost = null, ghostRec = [], bestLapThisRun = 0, trialRecord = false, ghostAtStart = 0;
  let boo = null;   // Daily Ghost Race: Boo's whole race, worked out at the start (see makeBoo)   // Time Trial   // race mode, whose coins/upgrades, coin-bag coins this race
  let countdown, raceTime, laps, camX, camY, endTimer, finishOrder, autopilot, sawShortcut;
  let party = null;          // the finish-line party when you come in 1st-3rd (see partyTick)
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
    checkSpecials(g);   // (winning races unlocks the Mega Car)
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

  // ---------------------------------------------------------------
  // Daily Ghost Race (Nov 15): every day one track and Boo, a friendly ghost car.
  // Boo doesn't really drive: at the start we work out his whole race in one go
  // (along the middle of the road, as fast as each bend allows) and keep where he
  // is 30 times a second. Then he just plays it back. He's see-through: you can't
  // bump him, he can't bump you, and he never takes the secret shortcuts.
  // ---------------------------------------------------------------
  const BOO_LAPS = 2;
  const BOO_LANE = 0.3;          // at the start you're on the left, Boo on the right
  // which day it is (the same clock as the Daily Surprise, so tests can pretend a day)
  const todayStr = () => (Arcade.daily && Arcade.daily._day) ? Arcade.daily._day() : new Date().toISOString().slice(0, 10);
  function dayNum(str) { const [y, m, d] = str.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); }
  // Today's track: jumps 3 tracks each day (so never the same one two days running,
  // and every track comes round). Little kids get one of the first 6 (gentler) tracks,
  // jumping 5 each day (a jump of 3 would only ever visit 2 of the 6).
  function dailyTrack(g) {
    const little = g && g.little, n = little ? 6 : TRACKS.length, jump = little ? 5 : 3;
    return TRACKS[((dayNum(todayStr()) * jump) % n + n) % n];
  }
  // How fast Boo goes: big kids race a quick ghost, little kids a sleepy one.
  // (top = his top speed, corner = how fast he takes bends; 1 = as fast as the road allows)
  const BOO_PACE = { big: { top: 0.86, corner: 0.84, accel: 380 }, little: { top: 0.62, corner: 0.7, accel: 260 } };
  // Some tracks suit Boo's simple driving better than others, so for big kids his speed
  // is tuned per track: on every track the computer driver (a good driver) beats him
  // by about the same amount: he's ~20% slower than it (measured Nov 15, 3 races per track).
  // (Nov 19: every track got a moving obstacle and some got bumpers, which Boo floats through,
  //  so he's 4% slower everywhere: BOO_EASE)
  const BOO_TUNE = { t1: 0.99, t2: 1.04, t3: 0.98, t4: 0.945, t5: 1.06, t6: 0.85, t7: 0.95, t8: 1.02, t9: 0.9, t10: 0.93 }, BOO_EASE = 0.96;
  function makeBoo(g) {
    const base = BOO_PACE[g.little ? 'little' : 'big'];
    const k = g.little ? 1 : (BOO_TUNE[T.def.id] || 1) * BOO_EASE;
    const pace = { top: base.top * k, corner: base.corner * k, accel: base.accel };
    const start = T.L - 70, goal = (BOO_LAPS + 1) * T.L;  // the same "progress" numbers as your car
    // start in the right-hand lane, slide to the middle of the road
    return planRun(pace, start, goal, along => BOO_LANE * T.hw * Math.max(0, 1 - along / 450));
  }
  // Works out a whole pretend drive round the track in one go (Boo, and Pip in Follow the Leader):
  // from 'start' to 'goal' (progress numbers), as fast as 'pace' and each bend allow.
  // latAt(along) = how far left/right of the middle of the road to be. Returns
  // { f: [x, y, angle, progress] 30 times a second, t: the time it reaches the goal }.
  function planRun(pace, start, goal, latAt) {
    const P = T.main;
    const top = BASE.top * 1.3 * pace.top;              // (a maxed engine is 1.3x)
    const f = [];
    let p = start, v = 0, t = 0, fin = 0;
    const dt = 1 / 120;
    for (let k = 0; k < 120 * 60 * 6; k++) {             // (6 minutes is plenty)
      if (k % 4 === 0) {                                 // 30 times a second
        const pt = pointAt(P, p), lat = latAt(p - start);
        f.push([pt.x - pt.ty * lat, pt.y + pt.tx * lat, Math.atan2(pt.ty, pt.tx), Math.min(p, goal)]);
      }
      const want = Math.min(top, Math.min(vlimAt(P, p), vlimAt(P, p + 60)) * pace.corner);
      v = v < want ? Math.min(want, v + pace.accel * dt) : want;
      p += v * dt; t += dt;
      if (!fin && p >= goal) fin = t - (p - goal) / Math.max(v, 1);
      if (fin && t > fin + 4) break;                     // keep going a moment past the line
    }
    return { f, t: Math.round(fin * 100) / 100 };
  }
  // where Boo is at a time in the race (before "Go!" he waits on the line)
  function booAt(time) { return planAt(boo, time); }
  // where a planned drive (planRun) is at a time
  function planAt(plan, time) {
    if (!plan) return { x: 0, y: 0, a: 0, p: 0 };
    const i = Math.max(0, time) * 30, k = Math.min(plan.f.length - 2, Math.floor(i)), u = Math.min(1, i - k);
    const a = plan.f[k], b = plan.f[k + 1];
    return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, a: a[2] + math.angleDiff(a[2], b[2]) * u, p: a[3] + (b[3] - a[3]) * u };
  }

  function setup(g, level) {
    rememberCar(g);
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
      def = TRACKS.find(t => 'fr-' + t.id === level.id) || (sharedTrack && 'fr-' + sharedTrack.id === level.id ? sharedTrack : TRACKS[0]);
    } else if (level && level.id.startsWith('dg-')) {
      // Daily Ghost Race: just you (maxed car) and Boo the ghost car, 2 laps, sunny
      mode = 'daily';
      wallet = { coins: 0, up: Object.fromEntries(UPGRADES.map(u => [u.id, MAX_LVL])) };
      def = TRACKS.find(t => 'dg-' + t.id === level.id) || dailyTrack(g);
    } else if (level && /^myd?-\d$/.test(level.id) && builder().def(g, +level.id.slice(-1))) {
      // a track you built yourself (rc/builder.js): Race (3 rivals) or Drive (find the stars)
      mode = level.id.startsWith('myd') ? 'drive' : 'free';
      wallet = { coins: 0, up: Object.fromEntries(UPGRADES.map(u => [u.id, MAX_LVL])) };
      def = builder().def(g, +level.id.slice(-1));
    } else if (level && level.id.startsWith('hb-')) {
      // Heart Battle: 4 cars in a round arena, last one with hearts left wins
      mode = 'battle';
      wallet = { coins: 0, up: {} };
      def = ARENAS.find(a => a.id === level.id) || ARENAS[0];
    } else if (level && /^(cr|fl)-/.test(level.id)) {
      // Coin Rush (grab coins before the clock runs out) / Follow the Leader (stay close to Pip):
      // just you in a maxed car, sunny, no gift boxes (see "Coin Rush + Follow the Leader" above update())
      mode = level.id.startsWith('cr') ? 'rush' : 'follow';
      wallet = { coins: 0, up: Object.fromEntries(UPGRADES.map(u => [u.id, MAX_LVL])) };
      def = TRACKS.find(t => level.id.slice(3) === t.id) || TRACKS[0];
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
    if (def.custom) T.def = def;     // (a home-made track's shape is cached, but its things / laps / weather may have changed)
    bonusCoins = 0; coinStreak = 0; coinStreakT = 0;
    // weather: set per race in the Grand Prix, your pick in free play / time trial
    weather = mode === 'cup' ? CUP_WEATHER[TRACKS.indexOf(def)] || 'sun' : mode === 'daily' || mode === 'battle' || mode === 'rush' || mode === 'follow' ? 'sun' : (def.custom && def.weather) || (g.save.data.weather || 'sun');
    wind = weather === 'wind' ? { a: Math.random() * Math.PI * 2, t: Math.random() * 10 } : null;
    engine.stop(); engineTick = 0; lastPlace = mode === 'daily' ? 1 : 4;
    // music: quiet while we wait for the countdown (no hi-hats or sparkles)
    g.music.mood({ energy: 0.3 }); leadKey = { up: false, out: 0 };
    theme = T.theme;
    document.body.style.setProperty('--ar-bg', theme.outer);
    laps = mode === 'drive' || mode === 'rush' || mode === 'follow' ? 99 : mode === 'daily' ? BOO_LAPS : (T.def.custom && T.def.laps) || 3;      // Free Drive: drive round as long as you like (home-made tracks pick their laps)
    placeFx = null; friendCars = {}; sendT = 0;
    const ti = TRACKS.findIndex(t => t.id === T.def.id);
    countdown = g.demo ? 1.4 : 3.2; raceTime = 0; endTimer = -1;      // ("Show me": a short countdown)
    slowmo = 0; slowmoDone = false; zoom = 1; party = null;
    popups = []; bubbles = []; skids = []; finishOrder = []; bumpers = []; shots = []; traps = [];
    rush = null; lead = null;                    // (Coin Rush / Follow the Leader: set up below)
    fx = new Arcade.Particles();
    autopilot = false; sawShortcut = -1;
    g.beeped = 4;

    if (mode === 'battle') battleStart(g);       // Heart Battle: its own cars, boxes and bumpers
    else {
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
      const solo = mode === 'trial' || mode === 'drive' || mode === 'friends' || mode === 'daily' || mode === 'rush' || mode === 'follow';
      // (Friends: each phone starts in its own grid spot, by seat number)
      const mySlot = mode === 'friends' && room ? 3 - (room.seat % 4) : pSlot;
      if (solo && k !== mySlot) continue;     // Time Trial + Free Drive + Friends: only you (friends' cars come over the network)
      if (k === mySlot) {
        // (the Ghost Car always has a maxed engine and tires, whatever the garage says)
        const myUp = pickedStyle(g).perk === 'phase' ? { ...wallet, up: { ...wallet.up, engine: MAX_LVL, tires: MAX_LVL } } : wallet;
        player = makeCar(playerStats(myUp), mine.color, 'You', true, T.L - back, (mode === 'daily' ? -BOO_LANE : solo && mode !== 'friends' ? 0 : lat) * T.hw);
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
        if (pickedStyle(g).id !== 'classic') giveStyle(c, RIVAL_STYLES[Math.floor(Math.random() * RIVAL_STYLES.length)]);
        cars.push(c); r++;
      }
    }

    // ---- gift boxes (items), in rows across the road ----
    boxes = [];
    if (!['trial', 'drive', 'daily', 'rush', 'follow'].includes(mode)) for (const f of itemRows()) {
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
    const MOVER = THEME_MOVER[T.def.theme];
    if (MOVER) {
      const want = MOVER === 'steam' ? 3 : 2, busyM = itemRows().map(f => f * T.L).concat(hazards.map(h => h.s), pads.map(pd => pd.s));
      for (let k = 0; movers.length < want && k < 80; k++) {
        const sM = (0.12 + 0.78 * ((k * 0.381966) % 1)) * T.L;          // spots spread round the lap
        const loose = k >= 40 ? 0.65 : 1;                                // (a busy track: try again with less room)
        if (busyM.some(b => lapDist(b, sM, T.L) < 330 * loose) || movers.some(m => lapDist(m.s, sM, T.L) < 900 * loose) || nearCross(sM, 800)) continue;
        if (T.short && sM > T.sA - 300 && sM < T.sB + 300) continue;
        movers.push({ kind: MOVER, s: sM, ph: k * 1.7, side: k % 2 ? 1 : -1, x: 0, y: 0, r: 20, on: true, z: 0, spin: 0 });
      }
    }
    // ---- bouncy bumpers (Keith, Nov 19: "those bouncing circles" from Heart Battle) on some tracks ----
    const nB = TRACK_BUMPERS[T.def.id] || 0;
    if (nB) {
      const busyB = itemRows().map(f => f * T.L).concat(hazards.map(h => h.s), pads.map(pd => pd.s), movers.map(m => m.s));
      for (let k = 0; bumpers.length < nB && k < 120; k++) {
        const sB = (0.06 + 0.9 * ((k * 0.618034 + 0.13) % 1)) * T.L;
        const loose = k >= 60 ? 0.6 : 1;
        if (busyB.some(b => lapDist(b, sB, T.L) < 300 * loose) || bumpers.some(b => lapDist(b.s, sB, T.L) < 700 * loose) || nearCross(sB, 800)) continue;
        if (T.short && sB > T.sA - 300 && sB < T.sB + 300) continue;
        const lat = (bumpers.length % 2 ? 1 : -1) * 0.5 * T.hw, p = pointAt(T.main, sB);      // one side, then the other: there's always room to pass
        bumpers.push({ s: sB, lat, x: p.x - p.ty * lat, y: p.y + p.tx * lat, r: 34, hit: 0 });
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
    // ---- Daily Ghost Race: Boo drives the whole race (worked out right now) ----
    boo = mode === 'daily' ? makeBoo(g) : null;
    rushStart(g); followStart(g);                // (they do nothing in the other modes)
    if (T.def.custom && T.def.things) {          // a home-made track with its own things
      applyThings(T.def.things);
      if (['trial', 'drive', 'daily', 'rush', 'follow'].includes(mode)) boxes = [];
    }
    }   // (end of "not Heart Battle")

    for (const c of cars) locate(c, true);
    camX = player.x - W / 2; camY = player.y - H / 2;
    rankCars();

    // ---- peek hooks for automated tests ----
    window.__rcState = () => ({
      track: T.def.id, laps, L: T.L, hw: T.hw, countdown, raceTime, finished: player.finished, over: g.state === 'over',
      player: snap(player),
      racers: cars.map(snap),
      finishOrder: finishOrder.map(c => c.name),
      mode, cup: cupOf(g) ? JSON.parse(JSON.stringify(cupOf(g))) : null, coins: coins(wallet), bonusCoins,
      stars: driveStars.length, starsGot, boxes: boxes.length, draft: Math.round((player.draft || 0) * 100) / 100,
      movers: movers.map(m => m.kind), zoom, slowmo, weather, pads: pads.map(pd => ({ kind: pd.kind, s: Math.round(pd.s), x: Math.round(pd.x), y: Math.round(pd.y), a: pd.a })), trackCoins: trackCoins.length, ghost: ghost ? ghost.t : null,
      boo: boo ? { t: boo.t, p: Math.round(booAt(raceTime).p), place: player.position } : null, air: player.air || 0, style: player.style, decal: player.decal,
      battle: mode === 'battle' ? { ring: Math.round(ring.r), over: battleOver, left: cars.map(c => c.name), out: outCars.map(c => c.name),
        hearts: Object.fromEntries(cars.concat(outCars).map(c => [c.name, c.hearts])), heart: !!heartPick, bumpers: bumpers.length, boxes: boxes.length,
        order: battleOrder().map(c => c.name), perk: player.perk } : null,
      rush: rush ? { left: Math.round(rush.left * 10) / 10, got: rush.got, coins: rush.coins.length, clocks: rush.clocks, goal: rushGoal(g, T.def.id) } : null,
      drift: player.drift ? { on: player.drift.on, lv: player.drift.lv, t: Math.round(player.drift.t * 100) / 100, boosts: player.driftBoosts || 0 } : null,
      party: party ? { won: party.won, t: Math.round(party.t * 10) / 10, pops: party.pops } : null,
      follow: lead ? { got: lead.got, dropped: lead.dropped, notes: lead.notes.length, t: Math.round(lead.t * 10) / 10, end: lead.plan.t, rate: Math.round(lead.rate * 100) / 100, stars: followStars(g), pip: Math.round(pipAt().p) } : null,
    });
    // test-only: the living backgrounds (draw the whole view at a pretend scene time)
    window.__rcScene = { W, H, tracks: TRACKS.map(t => ({ id: t.id, theme: t.theme, time: t.time || null })), time: () => curTime(),
      tiles: () => Object.keys(tiles), draw: (ctx, t, noTime) => { sceneClock = t; timeOff = !!noTime; try { drawWorld(g, ctx); } finally { sceneClock = null; timeOff = false; } } };
    window.__rcRush = () => rush && rush.coins;                   // test-only: Coin Rush coins + clocks
    window.__rcFollow = { notes: () => lead && lead.notes, pip: () => lead && pipAt() };   // test-only
    // test-only: run the race faster than real time (pause the kit loop first)
    window.__rcStep = (sec) => { for (let i = 0; i < sec * 120 && g.state !== 'over'; i++) { update(g, 1 / 120); g.particles.update(1 / 120); } };
    // test-only: roll N gift boxes for a car in a given place and count what comes out
    window.__rcRoll = (pos, isPlayer, n, luck = 0) => { const out = {}; const c = { position: pos, isPlayer, stats: { luck }, noBook: true }; for (let i = 0; i < n; i++) { giveItem(c); out[c.item] = (out[c.item] || 0) + 1; } return out; };
    window.__rcGive = (item) => { player.item = item; };   // test-only
    // test-only: open N gift boxes for you (or a rival) for real, count what comes out
    window.__rcItems = { roll: (n, rival) => { const c = rival ? cars.find(o => !o.isPlayer) : player, out = {}; for (let i = 0; i < n; i++) { c.item = null; giveItem(c); out[c.item] = (out[c.item] || 0) + 1; } c.item = null; return out; } };
    window.__rcEngine = engine;                              // test-only
    window.__rcAuto = (on) => { autopilot = on !== false; };  // test-only autopilot for the player car
    // test-only: the playtest robot (a pretend child, see kidThink()); call after the race starts, then __rcStep()
    window.__rcKid = (on, seed, idle) => { Object.assign(kid, { on: !!on, idle: !!idle, seed: Math.max(1, (seed | 0) % 2147483646), t: 0, hold: 0, lat: 0, back: 0, stuck: 0, stats: { off: 0, slow: 0, backups: 0, away: 0, mixups: 0 } }); kid.keys.clear(); kid.taps.clear(); };
    window.__rcKidReport = kidReport;
    window.__rcCars = () => cars;                                 // test-only: raw car objects
    window.__rcBattle = { hurt: (name, n = 1) => { for (let i = 0; i < n; i++) { const c = cars.find(o => o.name === name); if (c) { c.ghost = 0; c.shield = 0; c.star = 0; c.phaseT = 0; hurt(g, c, null); } } },
      bubbles: () => bubbles.length, setTime: (t) => { raceTime = t; }, use: () => useItem(g, player),
      heart: () => heartPick && { x: heartPick.x, y: heartPick.y }, mid: [ARENA_C, ARENA_C] };   // test-only
    window.__rcExtras = { shots: () => shots.map(sh => ({ kind: sh.kind, x: Math.round(sh.x), y: Math.round(sh.y), hit: sh.hit.map(c => c.name) })),
      bumpers: () => bumpers.map(b => ({ x: Math.round(b.x), y: Math.round(b.y), r: b.r, s: Math.round(b.s || 0), lat: Math.round(b.lat || 0) })), use: () => useItem(g, player),
      traps: () => traps.filter(t => t.life > 0).map(t => ({ kind: t.kind, x: Math.round(t.x), y: Math.round(t.y) })) };   // test-only
    window.__rcCoins = () => trackCoins;                          // test-only: coins on the track
    window.__rcMovers = () => movers;                             // test-only
    window.__rcHaz = () => hazards;                               // test-only: oil, puddles, honey
    window.__rcBubbles = () => bubbles.map(b => ({ x: Math.round(b.x), y: Math.round(b.y), mine: !!(b.target && b.target.isPlayer) }));   // test-only
    window.__rcStars = () => driveStars;                          // test-only: Free Drive stars
    window.__rcFriendCars = () => Object.values(friendCars);   // test-only: the friends' cars as this phone sees them
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
      g.juice.pop('lap', 0.45);
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
    if (c.mega > 0) topMul *= 1.08;                      // Mega Car: a bit faster too
    if (c.frozen > 0 && !(c.grippy > 0)) { topMul *= 0.55; grip *= 0.45; }  // Freeze Flake: slow and slippery
    if (c.grippy > 0) {                                  // Monster Wheels: lots of grip, and grass can't slow you
      grip = st.grip * 1.8; drag = 0;
      if (c.surface === 'grass') topMul = Math.max(topMul, 0.95 * wx.top);
    }
    if (c.boost > 0) { topMul *= 1.4 + (st.nitro - 1) * 0.25 + (hasPerk(c, 'boost') ? 0.12 : 0); accMul = hasPerk(c, 'boost') ? 2.8 : 2.2; }   // nitro upgrade = stronger boost
    // slipstream: tucked in right behind another car = a little extra speed
    if (c.draft > 0) { topMul *= 1 + 0.1 * c.draft; accMul *= 1 + 0.5 * c.draft; }
    const top = st.top * topMul;

    let { gas, brake, steer } = inp;
    if (c.spin > 0) { gas = brake = false; steer = 0; }

    // turn first (you can't turn a parked car; reversing turns the other way)
    let fx = Math.cos(c.a), fy = Math.sin(c.a);
    let vF = c.vx * fx + c.vy * fy;
    const turn = steer * STEER * st.steer * math.clamp(vF / 120, -1, 1) * (vF > 0 ? 1 - 0.18 * Math.min(1, vF / st.top) : 1) *
      (c.drift && c.drift.on ? DRIFT.turn : 1);           // (drifting turns a bit tighter, so you still make the bend)
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

    if (c.drift && c.drift.on) grip *= DRIFT.grip;       // drifting: the back slides out (see driftTick)
    vR *= Math.exp(-grip * dt);                          // grip: sideways sliding fades away
    c.slip = vR;
    c.vx = fx * vF - fy * vR; c.vy = fy * vF + fx * vR;
    c.x += c.vx * dt; c.y += c.vy * dt;
    c.vF = vF;
    c.wheel += vF * dt;
  }

  // ---------------------------------------------------------------
  // Drifting (Nov 21, Keith's RC plan #3 "feel and look")
  // Hold a full turn while going fast and your car slides round the bend
  // with its tail out. Sparks fly from the back wheels: blue, then orange,
  // then pink the longer you hold it. Straighten up (or let go) = a little
  // boost, longer for pinker sparks. Only YOUR car drifts: the rivals'
  // speeds stay as they were tuned. (Little kids can drift a bit slower.)
  // ---------------------------------------------------------------
  const DRIFT = {
    wait: 0.25,                 // seconds of a full fast turn before the drift starts
    grip: 0.62, turn: 1.18,     // while drifting: less grip (the slide), a tighter turn
    lv: [0.5, 1.2, 2.0],        // seconds of drifting for blue / orange / pink sparks
    boost: [0.35, 0.6, 0.9],    // the boost you get for each color
    words: ['Zoom!', 'Super zoom!', 'Mega zoom!'],
    colors: [['#9bf6ff', '#4cc9f0', '#ffffff'], ['#ffd166', '#ff8c42', '#ffffff'], ['#ff8fab', '#f15bb5', '#c77dff']],
  };
  // Game feel (new plan point 3): a car squashes along the way it's going (a = + squash short + wide on a bump or
  // landing, a = - stretch long on a boost or jump). drawCar scales the car's own picture by c.sq (see makeJuice in shared.js).
  function squashCar(g, c, a) { c.sq = g.juice.squash(c).hit(a); }

  function driftTick(g, c, ctl, dt) {
    const d = c.drift || (c.drift = { on: false, wait: 0, t: 0, lv: 0, dir: 0, yaw: 0 });
    const sp = Math.hypot(c.vx, c.vy);
    // the Star Road (Nov 24, point 8): the worn trail comes out behind YOUR car while it drives
    // (driftTick only ever runs for your own car, in races and in Heart Battle)
    g.looks.trail(c.x - Math.cos(c.a) * 26, c.y - Math.sin(c.a) * 26, { to: fx, on: !c.finished && sp > 40 && !(c.air > 0) });
    const ground = c.surface !== 'grass' || c.grippy > 0;          // (no drifting on the grass)
    const stuck = c.spin > 0 || c.bubbled > 0 || c.frozen > 0 || c.air > 0 || c.finished;
    const can = ground && !stuck && ctl.gas && !ctl.brake && sp > c.stats.top * (g.little ? 0.5 : 0.6);
    // the car body turns a little further into the bend while drifting (it's only the picture)
    d.yaw += ((d.on ? d.dir * 0.28 : 0) - d.yaw) * Math.min(1, dt * 10);
    if (!d.on) {
      if (can && Math.abs(ctl.steer) > 0.8) {
        d.wait += dt;
        if (d.wait > DRIFT.wait) { d.on = true; d.t = 0; d.lv = 0; d.dir = Math.sign(ctl.steer); }
      } else d.wait = 0;
      return;
    }
    // still drifting: keep turning the same way (a gentler turn is OK)
    if (can && Math.abs(ctl.steer) > 0.3 && Math.sign(ctl.steer) === d.dir) {
      d.t += dt;
      const lv = DRIFT.lv.filter(x => d.t >= x).length;
      if (lv > d.lv) {                                  // the sparks change color: a rising "ting"
        d.lv = lv;
        g.tone(660 + lv * 220, 0.1, { type: 'triangle', vol: 0.12, slide: 990 + lv * 260 });
      }
      if (d.lv && Math.random() < dt * 36) {            // sparks from the back wheels
        const ca = Math.cos(c.a), sa = Math.sin(c.a), side = Math.random() < 0.5 ? 1 : -1;
        fx.burst(c.x - ca * 18 - sa * 12 * side, c.y - sa * 18 + ca * 12 * side,
          { count: 1, shape: 'star', angle: c.a + Math.PI + d.dir * 0.6, spread: 0.9, speed: 150, gravity: 0, size: 8 + d.lv * 2, life: 0.32, colors: DRIFT.colors[d.lv - 1] });
      }
      return;
    }
    // the drift is over: a boost for the sparks you built up (not if you spun out or got bubbled)
    if (d.lv && !stuck && ground) {
      c.boost = Math.max(c.boost, DRIFT.boost[d.lv - 1] * (c.stats.nitro || 1));
      c.driftBoosts = (c.driftBoosts || 0) + 1;
      squashCar(g, c, -0.15 - d.lv * 0.06);
      popup(DRIFT.words[d.lv - 1], c.x, c.y - 56, DRIFT.colors[d.lv - 1][1], 26 + d.lv * 4);
      g.tone(300, 0.25, { type: 'sawtooth', slide: 700 + d.lv * 150, vol: 0.1 });
      fx.burst(c.x - Math.cos(c.a) * 24, c.y - Math.sin(c.a) * 24, { count: 8 + d.lv * 4, shape: 'star', speed: 180, gravity: 0, size: 10, life: 0.45, colors: DRIFT.colors[d.lv - 1] });
    }
    d.on = false; d.wait = 0; d.t = 0; d.lv = 0;
  }
  // sparks right under the back wheels while drifting (drawn in the car's own frame, under the car)
  function drawDriftSparks(ctx, c, time) {
    const d = c.drift;
    if (!d || !d.on || !d.lv) return;
    const cols = DRIFT.colors[d.lv - 1];
    for (const wy of [-12, 12]) {
      for (let i = 0; i < 3; i++) {
        const f = (time * 20 + i * 1.7 + wy) % 3, len = 10 + d.lv * 4 + f * 3;
        ctx.fillStyle = cols[i % 2];
        ctx.beginPath();
        ctx.moveTo(-18, wy - 4); ctx.lineTo(-18 - len, wy + (i - 1) * 6 + Math.sin(time * 50 + i) * 2); ctx.lineTo(-18, wy + 4);
        ctx.closePath(); ctx.fill();
      }
    }
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
      if (vn > 0) { c.vx -= nx * vn * 1.3; c.vy -= ny * vn * 1.3; if (vn > 110 && c.bumpCool <= 0) { c.bumpCool = 0.3; if (c.isPlayer) { g.sfx('bonk'); c.wallBumps = (c.wallBumps || 0) + 1; } } }
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
        if (c.isPlayer) { g.sfx('bonk'); c.wallBumps = (c.wallBumps || 0) + 1; }    // (counted for the playtest robot)
        fx.burst(c.x + nx * 18, c.y + ny * 18, { count: 6, colors: [theme.edge, '#ffffff', '#ffd166'], speed: 120, gravity: 0, size: 8, life: 0.4 });
        if (c.isPlayer) { squashCar(g, c, Math.min(0.35, vn / 900)); g.juice.dust(c.x + nx * 18, c.y + ny * 18, { to: fx, count: 4, colors: theme.dust }); if (vn > 300) g.juice.stop(0.03); }
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

  // One thumb (Nov 23, new plan point 4, part 2): there's no gift button, so a gift you're holding
  // goes off by itself after a moment (THUMB_ITEM seconds), like the computer cars use theirs.
  const THUMB_ITEM = 1.4;
  // ---- "Show me" (Nov 24, plan point 6 part 3): what the demo's hands press (see config.showMe) ----
  // The right thumb holds Gas, taps the gift (the demo gets one at "Go!"), then holds Gas again; the left
  // thumb steers a little when the road bends (towards the middle of the road a little way ahead, like the
  // little-kid helper's aimAt). One thumb: the car goes by itself, the thumb only steers into the bends.
  let demoSteer = 0;
  function demoThink(g, hand, t) {
    const c = player;
    if (!c || c.finished || countdown > 0.4) { demoSteer = 0; return; }
    if (!g.oneThumb && !hand.busy('R')) {
      if (c.item && t > 3.3 && countdown <= 0) hand.key('Space', 0.2);
      else hand.key('ArrowUp', c.item ? Math.max(0.4, 3.3 - t) : 9, 'R');
    }
    const side = g.oneThumb ? 'R' : 'L', n = c.near;
    if (!n || countdown > 0 || t < demoSteer || hand.busy(side)) return;
    // which way is the middle of the road, a little way ahead? (where the car will be when the thumb gets there)
    const sp = Math.hypot(c.vx, c.vy), p = pointAt(T.main, n.s + 70 + sp * 0.75);
    const d = math.angleDiff(c.a, Math.atan2(p.y - c.y, p.x - c.x));
    if (Math.abs(d) < (g.oneThumb ? 0.3 : 0.14)) return;
    demoSteer = t + 0.25;
    hand.key(d > 0 ? 'ArrowRight' : 'ArrowLeft', math.clamp(Math.abs(d) * 0.7, 0.15, 0.5), side);
  }
  function thumbItem(g, c, dt) {
    if (!g.oneThumb || !c.item) { c.thumbT = 0; return false; }
    c.thumbT = (c.thumbT || 0) + dt;
    if (c.thumbT < THUMB_ITEM) return false;
    c.thumbT = 0;
    return true;
  }
  // ---------------------------------------------------------------
  // The playtest robot (Nov 23, new plan point 5): a pretend CHILD at the wheel.
  // tools/playtest.py turns it on with __rcKid(true, seed) and runs whole races in fast-forward.
  // It presses the same buttons a child has (left / right / gas / brake / item), but like a
  // child: it looks where the road goes and decides a moment late (every 0.2-0.4 s), keeps
  // holding a turn a bit too long (so it zigzags a little), aims for "the middle" a bit
  // loosely, hardly ever brakes for a bend, fires an item whenever it feels like it, and backs
  // up when it's stuck. Little kids play one thumb: the car drives itself and they press left /
  // right now and then, mostly when the car is clearly off, sometimes just for fun.
  // It counts how the race went (kid.stats): seconds off the road, seconds stuck, lifts back
  // onto the road, wall bumps. A model of a child, not a real child: it shows where to look.
  // ---------------------------------------------------------------
  const kid = { on: false, seed: 1, keys: new Set(), taps: new Set(), t: 0, hold: 0, lat: 0, back: 0, stuck: 0, stats: null };
  function kidRand() { kid.seed = (kid.seed * 16807) % 2147483647; return kid.seed / 2147483647; }
  // the pretend child's fingers, shaped like g.input (down = held, hit = a tap)
  const kidPad = {
    down: (...codes) => codes.some(k => kid.keys.has(k)),
    hit: (...codes) => { const k = codes.find(x => kid.taps.has(x)); if (k) { kid.taps.delete(k); return true; } return false; },
  };
  function kidThink(g, c, dt) {
    const st = kid.stats, little = g.little || g.oneThumb;
    const sp = Math.hypot(c.vx, c.vy);
    if (c.surface === 'grass') st.off += dt;
    if (sp < 40 && raceTime > 1.5 && c.spin <= 0 && c.bubbled <= 0) { st.slow += dt; kid.stuck += dt; } else kid.stuck = 0;
    if (kid.back > 0) { kid.back -= dt; if (kid.back <= 0) kid.keys.clear(); return; }
    // stuck against something for a while: back up and turn (big kids work this out; little kids wait for help)
    if (!little && kid.stuck > 1.4) {
      kid.stuck = 0; kid.back = 0.7; st.backups++;
      kid.keys = new Set(['ArrowDown', kidRand() < 0.5 ? 'ArrowLeft' : 'ArrowRight']);
      return;
    }
    // a turn button is held for as long as the child thinks it needs (a bit too long, or too short)
    if (kid.hold > 0 && (kid.hold -= dt) <= 0) { kid.keys.delete('ArrowLeft'); kid.keys.delete('ArrowRight'); }
    if ((kid.t -= dt) > 0 || kid.idle) return;     // (idle: hands off, just counting: how the car does by itself)
    kid.t = (little ? 0.3 : 0.2) + kidRand() * (little ? 0.25 : 0.15);      // the next look, a moment later
    if (kidRand() < 0.15) kid.lat = (kidRand() - 0.5) * 0.7;                 // "the middle" is a bit loose
    const look = 80 + sp * 0.45;
    const p = pointAt(T.main, c.s + look);
    const tx = p.x - p.ty * kid.lat * T.hw, ty = p.y + p.tx * kid.lat * T.hw;
    const diff = math.angleDiff(c.a, Math.atan2(ty - c.y, tx - c.x));
    const keys = new Set();
    let steer = 0, hold = 0;
    // looking away for a moment (the cat walked by): no steering for a second or so, the gas stays down
    if (kidRand() < (little ? 0.02 : 0.025)) { kid.t = 0.6 + kidRand() * 0.9; kid.keys = little ? new Set() : new Set(['ArrowUp']); st.away++; return; }
    // (how long to hold: the turn that's needed at full steering, times a wobbly "about that much")
    const need = Math.abs(diff) / (STEER * 0.8);
    if (little) {
      // one thumb: mostly let the car drive; press when it's clearly heading off, or now and then for fun
      if (Math.abs(diff) > 0.5 && kidRand() < 0.6) { steer = Math.sign(diff); hold = need * (0.7 + kidRand()); }
      else if (kidRand() < 0.05) { steer = kidRand() < 0.5 ? -1 : 1; hold = 0.15 + kidRand() * 0.3; }
    } else {
      // a turn when the road clearly bends, held about as long as it needs (often a bit too long: a zigzag)
      if (Math.abs(diff) > 0.12) { steer = Math.sign(diff); hold = need * (0.8 + kidRand() * 0.8); }
      keys.add('ArrowUp');
      // too fast into a bend: now and then a child lets go of gas, or even brakes
      if (sp > vlimAt(T.main, c.s + 60) * 1.2) {
        const r = kidRand();
        if (r < 0.25) keys.delete('ArrowUp');
        else if (r < 0.33) { keys.delete('ArrowUp'); keys.add('ArrowDown'); }
      }
      if (c.item && kidRand() < 0.3) kid.taps.add('Space');
    }
    // Seen from above, left and right swap round when the car drives DOWN the screen: children
    // often press the side the road goes on the SCREEN, which turns the car the wrong way.
    if (steer && Math.sin(c.a) > 0.5 && kidRand() < (little ? 0.35 : 0.2)) { steer = -steer; hold = Math.max(hold, 0.25); st.mixups++; }
    if (steer) { keys.add(steer > 0 ? 'ArrowRight' : 'ArrowLeft'); kid.hold = Math.max(0.06, hold); }
    kid.keys = keys;
  }
  // (the results: the player's place, time, and how it went)
  function kidReport() {
    const s = kid.stats || {};
    return { track: T.def.id, finished: !!player.finished, time: player.finished ? Math.round(player.finishTime * 10) / 10 : null,
      place: player.position, raceTime: Math.round(raceTime * 10) / 10, laps,
      winner: finishOrder.length ? Math.round(finishOrder[0].finishTime * 10) / 10 : null, second: finishOrder.length > 1 ? Math.round(finishOrder[1].finishTime * 10) / 10 : null,
      off: Math.round(s.off * 10) / 10, slow: Math.round(s.slow * 10) / 10, lifts: player.lifts || 0, bumps: player.wallBumps || 0, backups: s.backups, mixups: s.mixups };
  }

  function aiControl(g, c, dt, pilot) {
    const ai = c.ai;
    const vF = c.vF || 0;
    const sk = ai.skill;
    // --- choose a lane, dodge hazards ahead ---
    ai.laneT -= dt;
    if (ai.laneT <= 0) { ai.laneT = 2 + Math.random() * 3; ai.laneTarget = (Math.random() - 0.5) * 0.7; }
    let want = ai.laneTarget;
    for (const h of hazards.concat(bumpers)) {      // (bumpers too: same dodge)
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
      // (playtest, Nov 23: now that the little kids' car drives itself well, they won every race by miles, all
      //  alone at the end: rivals far behind now hurry a bit more, so there's someone to race with)
      else if ((g.little || g.oneThumb) && gap < -450) topWant *= 1.12;
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
    } else if (m.kind === 'ball' || m.kind === 'pumpkin') {                                                                  // rolls across the road
      lat = Math.sin(t * (m.kind === 'ball' ? 0.95 : 0.7) + m.ph) * 0.72 * T.hw; m.r = m.kind === 'ball' ? 23 : 25; m.on = true; m.spin = lat / 24;
    } else if (m.kind === 'tumbleweed') {                                                                                    // blows across, bouncing
      const k = ((t * 0.32 + m.ph) % 2 + 2) % 2; lat = (k < 1 ? k * 2 - 1 : 3 - k * 2) * 0.85 * T.hw;
      m.z = Math.abs(Math.sin(t * 5 + m.ph)) * 0.5; m.r = 22; m.on = m.z < 0.3; m.spin = t * 5;
    } else if (m.kind === 'rock' || m.kind === 'frog') {                                                                     // hops (the moon rock floats high)
      lat = Math.sin(t * 0.55 + m.ph) * 0.6 * T.hw; m.z = Math.abs(Math.sin(t * (m.kind === 'rock' ? 1.7 : 3.2) + m.ph)) * (m.kind === 'rock' ? 1 : 0.6);
      m.r = m.kind === 'rock' ? 25 : 22; m.on = m.z < 0.3; m.spin = 0;
    } else if (m.kind === 'puff') {                                                                                          // a little cloud drifting about
      lat = Math.sin(t * 0.5 + m.ph) * 0.7 * T.hw; m.r = 30; m.on = true;
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
        fx: (player.star > 0 ? 1 : 0) | (player.shield > 0 ? 2 : 0) | (player.bubbled > 0 ? 4 : 0) | (player.cloud > 0 ? 8 : 0) | (player.phaseT > 0 || hasPerk(player, 'phase') ? 16 : 0),
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
    // how fast it's going (from where it was 0.1 s ago), for gentle bumps
    f.vx = (msg.x - f.tx) / 0.1; f.vy = (msg.y - f.ty) / 0.1;
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
      if (!player.finished && player.progress > m.p && player.progress - m.p <= 700 && !(player.shield > 0) && !hasPerk(player, 'hover') && !hasPerk(player, 'phase')) {
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
    room.on('start', (m) => {
      if (g.state === 'play') return;
      // a friend's home-made track came along: unpack it (it gets the same id as on their phone)
      if (m.mt) { try { const d = builder().defFrom(builder().unpack(m.mt), 'f'); sharedTrack = Object.assign(d, { pack: m.mt }); } catch (e) { sharedTrack = null; } }
      Arcade.sfx('go'); weather = m.weather || 'sun'; g.save.data.weather = weather; g.play({ id: 'fr-' + (m.mt && sharedTrack ? sharedTrack.id : m.track) });
    });
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
    c.spin = 0; c.ghost = 1.2; c.hint = p.i; c.lifts = (c.lifts || 0) + 1;
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
  //   (Keith, Nov 19: "a couple cooler weapons")
  //         snowball  = Giant Snowball: rolls straight ahead, growing; bonks every car it meets  (common)
  //         boomerang = Boomerang: a rainbow boomerang loops out and comes back to you          (uncommon)
  //         blaster   = Triple Bubble: three bubbles at once, in a fan                          (uncommon)
  const RARITY = { boost: 'common', bubble: 'common', shield: 'common', spring: 'common', phase: 'common', snowball: 'common',
    cloud: 'uncommon', honey: 'uncommon', magnet: 'uncommon', popper: 'uncommon', boomerang: 'uncommon', blaster: 'uncommon',
    star: 'rare', coins: 'rare', warp: 'rare', mega: 'special', freeze: 'special', fireworks: 'special',
    // (Keith, Nov 19: "30 items total": 9 more + 3 more specials)
    pogopad: 'common', grippy: 'common', balloon: 'common', lucky: 'common',
    bubbletrap: 'uncommon', bee: 'uncommon', trio: 'uncommon', whirl: 'uncommon', glitter: 'rare',
    dragon: 'special', swap: 'special', disco: 'special' };
  const RARITY_COLOR = { common: '#fff7d6', uncommon: '#b9fbc0', rare: '#ffd166', special: '#ffafcc' };

  // ---- The Item Book + special items (Keith, Nov 19: "see all the different pick ups",
  // "special unlockable pickups") ----
  // Every item you've ever pulled out of a gift box is counted in data.itemsSeen ({item: n}).
  // The 3 SPECIAL items are locked at first; once unlocked they come out of YOUR gift boxes
  // now and then (6%), in races and in Heart Battle. The computer cars never get them.
  const BOOK_ITEMS = ['boost', 'bubble', 'shield', 'spring', 'phase', 'snowball', 'pogopad', 'grippy', 'balloon', 'lucky',
    'cloud', 'honey', 'magnet', 'popper', 'boomerang', 'blaster', 'bubbletrap', 'bee', 'trio', 'whirl',
    'star', 'coins', 'warp', 'glitter'];
  const ITEM_SAYS = {
    boost: 'Zoom! Super fast', bubble: 'Floats the car ahead', shield: 'Nothing can stop you', spring: 'A big bouncy jump',
    phase: 'Drive through cars', snowball: 'Rolls and bonks', cloud: 'Float over grass', honey: 'Sticky puddle',
    magnet: 'Pulls you along', popper: 'Confetti wobble', boomerang: 'Loops out and back', blaster: 'Three bubbles!',
    star: 'Fast and safe', coins: 'Bonus coins (cups)', warp: 'Zip ahead',
    mega: 'Your car gets HUGE', freeze: 'Everyone else slips', fireworks: 'Rockets for everyone',
    pogopad: 'Drop a bouncy pad', bubbletrap: 'Drop a bubble trap', glitter: 'Slippy sparkles', grippy: 'Grass? No problem',
    balloon: 'Throw a big splash', trio: 'Three boosts!', lucky: 'A surprise item', bee: 'Buzzes the leader',
    whirl: 'Spins down the road', dragon: 'Bubbles for everyone', swap: 'Swap with the car ahead', disco: 'Everyone dances!',
  };
  const seenOf = (g) => (g.save.data.itemsSeen = g.save.data.itemsSeen || {});
  const SPECIALS = [
    { id: 'mega', need: 'Win 5 races', ok: g => (feat(g).wins || 0) >= 5 },
    { id: 'freeze', need: 'Find 12 items', ok: g => BOOK_ITEMS.filter(k => seenOf(g)[k]).length >= 12 },
    { id: 'fireworks', need: 'Win a Heart Battle', ok: g => (g.save.data.battleWins || 0) >= 1 },
    { id: 'dragon', need: 'Beat Boo', ok: g => (g.save.data.booWins || 0) >= 1 },
    { id: 'swap', need: 'Race your own track', ok: g => !!feat(g).myRace },
    { id: 'disco', need: 'Finish a cup', ok: g => (g.save.data.cupsDone || 0) >= 1 },
  ];
  // Newly unlocked specials: a toast (and they're remembered, so it only shows once)
  function checkSpecials(g) {
    const d = g.save.data; d.specials = d.specials || [];
    for (const sp of SPECIALS) if (sp.ok(g) && !d.specials.includes(sp.id)) { d.specials.push(sp.id); g.toast('New item: ' + ITEM_NAMES[sp.id] + '!'); g.store(); }
  }
  // you just got an item: count it for the book
  function sawItem(c) {
    const g = gRef; if (!g || !c.isPlayer || !c.item || c.noBook) return;
    const seen = seenOf(g), first = !seen[c.item];
    seen[c.item] = (seen[c.item] || 0) + 1;
    g.store();
    if (first) { popup('New in the book!', c.x, c.y - 90, '#ffafcc', 26); checkSpecials(g); }
  }
  // maybe swap your gift for a special one (only ones you've unlocked)
  function maybeSpecial(c) {
    const g = gRef; if (!g || !c.isPlayer || c.noBook) return;
    const open = SPECIALS.filter(sp => sp.ok(g)).map(sp => sp.id).filter(id => mode !== 'friends' || id === 'mega');
    if (open.length && Math.random() < 0.06) c.item = open[Math.floor(Math.random() * open.length)];
  }
  const ITEM_ODDS = {        // percent; each row adds up to 100
    front:  { shield: 17, bubble: 15, boost: 8,  honey: 11, cloud: 5, spring: 6, phase: 7, magnet: 2, popper: 5, star: 3, coins: 3, warp: 3, snowball: 6, boomerang: 5, blaster: 4 },
    middle: { boost: 14, bubble: 13, shield: 10, cloud: 8,  honey: 6, spring: 8, phase: 7, magnet: 6, popper: 4, star: 3, coins: 3, warp: 3, snowball: 6, boomerang: 5, blaster: 4 },
    back:   { boost: 18, bubble: 11, shield: 8,  cloud: 9,  honey: 4, spring: 8, phase: 5, magnet: 9, popper: 4, star: 3, coins: 3, warp: 3, snowball: 6, boomerang: 5, blaster: 4 },
  };
  // the 9 newer items (Nov 19) take a quarter of every row: the older numbers are scaled to 75 (each row still adds up to 100)
  const NEW_ODDS = {
    front:  { pogopad: 4, grippy: 3, balloon: 4, lucky: 3, bubbletrap: 4, bee: 1, trio: 2, whirl: 2, glitter: 2 },
    middle: { pogopad: 3, grippy: 3, balloon: 4, lucky: 3, bubbletrap: 3, bee: 3, trio: 3, whirl: 2, glitter: 1 },
    back:   { pogopad: 2, grippy: 4, balloon: 3, lucky: 3, bubbletrap: 1, bee: 5, trio: 4, whirl: 2, glitter: 1 },
  };
  for (const row in ITEM_ODDS) { for (const k in ITEM_ODDS[row]) ITEM_ODDS[row][k] *= 0.75; Object.assign(ITEM_ODDS[row], NEW_ODDS[row]); }
  function rollItem(odds, skip) {
    let total = 0; for (const k in odds) if (k !== skip) total += odds[k];
    let r = Math.random() * total;
    for (const k in odds) { if (k === skip) continue; r -= odds[k]; if (r <= 0) return k; }
    return 'boost';
  }
  function giveItem(c) {
    if (mode === 'battle') {               // Heart Battle has its own gift box list (no coins, magnets, warps)
      c.item = rollItem(BATTLE_ODDS);
      if (c.fav && BATTLE_ODDS[c.fav] && Math.random() < 0.35) c.item = c.fav;
      maybeSpecial(c); sawItem(c);
      return;
    }
    const base = ITEM_ODDS[c.position === 1 ? 'front' : c.position >= 3 ? 'back' : 'middle'];
    // Lucky Charm: each level makes uncommon items 20% likelier and rare ones +1%
    const luck = ((c.stats && c.stats.luck) || 0) + (hasPerk(c, 'lucky') ? 3 : 0), odds = {};
    for (const k in base) odds[k] = base[k] * (RARITY[k] === 'uncommon' ? 1 + 0.2 * luck : 1) + (RARITY[k] === 'rare' ? luck : 0);
    // coin bags only exist for you in the Grand Prix (everyone else rolls without them)
    const noCoins = !c.isPlayer || mode === 'free' || mode === 'friends';
    c.item = rollItem(odds, noCoins ? 'coins' : null);
    if (c.fav && Math.random() < 0.5) c.item = c.fav;      // rivals love their favorite item
    // (Friends races: the newer items only work on this phone's cars, so they're plain bubbles there)
    if (mode === 'friends' && SHOT_ITEMS.includes(c.item)) c.item = 'bubble';
    maybeSpecial(c); sawItem(c);
  }

  function useItem(g, c) {
    const it = c.item; if (!it) return;
    c.item = null;
    // rivals: a little name tag pops up when they use something (if you can see them)
    if (!c.isPlayer && !quietItem && Math.abs(c.x - (camX + W / 2)) < W / zoom / 2 + 40 && Math.abs(c.y - (camY + H / 2)) < H / zoom / 2 + 40)
      popups.push({ text: c.name + ': ' + ITEM_NAMES[it] + '!', x: c.x, y: c.y - 46, t: 0, color: c.color, size: 22 });
    if (it === 'blaster') {                // Triple Bubble: three bubbles in a fan (the middle one chases)
      const a0 = c.a;
      quietItem = true;
      for (const off of [-0.3, 0.3, 0]) { c.a = a0 + off; c.item = 'bubble'; useItem(g, c); }
      quietItem = false; c.a = a0;
      if (c.isPlayer) { g.sfx('pop'); popup('Triple Bubble!', c.x, c.y - 50, '#9bf6ff'); }
      return;
    }
    if (it === 'snowball' || it === 'boomerang') { throwShot(g, c, it); return; }
    if (it === 'mega') {                   // Mega Car: your car grows HUGE for 5 seconds and pushes everyone aside
      c.mega = 5; c.shield = Math.max(c.shield, 5);
      if (c.isPlayer) { g.tone(160, 0.6, { type: 'sawtooth', slide: 80, vol: 0.18 }); g.sfx('power'); popup('MEGA CAR!', c.x, c.y - 80, '#ff8fab', 40); }
      fx.burst(c.x, c.y, { count: 30, shape: 'star', colors: ['#ffafcc', '#ffd166', '#ffffff'], speed: 260, gravity: 0, size: 14, life: 0.8 });
      return;
    }
    if (it === 'freeze') {                 // Freeze Flake: every other car goes slow and slippery for 3 seconds
      for (const o of cars) {
        if (o === c || o.finished || o.shield > 0 || o.star > 0 || hasPerk(o, 'phase')) continue;
        o.frozen = 3;
        fx.burst(o.x, o.y, { count: 14, shape: 'star', colors: ['#ffffff', '#bde0fe', '#9bf6ff'], speed: 160, gravity: 0, size: 11, life: 0.7 });
        if (o.isPlayer) popup('Brrr!', o.x, o.y - 50, '#bde0fe');
      }
      if (c.isPlayer) { [1568, 1319, 1175, 988].forEach((f, i) => g.tone(f, 0.18, { type: 'sine', vol: 0.12, delay: i * 0.07 })); popup('Freeze!', c.x, c.y - 70, '#bde0fe', 40); }
      return;
    }
    if (it === 'fireworks') {              // Firework Party: a little rocket chases each of the other cars (3 at most)
      const list = cars.filter(o => o !== c && !o.finished && (mode === 'battle' || o.progress >= c.progress - 200))
        .sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y)).slice(0, 3);
      list.forEach((o, i) => shots.push({ kind: 'firework', x: c.x, y: c.y, vx: Math.cos(c.a + (i - 1) * 0.5) * 500, vy: Math.sin(c.a + (i - 1) * 0.5) * 500, target: o, r: 16, life: 3, t: 0, owner: c, hit: [], h: c.h || 0, col: ['#ef476f', '#ffd166', '#06d6a0'][i] }));
      if (c.isPlayer) { Arcade.audio.noise(0.4, { filter: 'highpass', freq: 1200, vol: 0.3 }); popup('Firework Party!', c.x, c.y - 70, '#ffd166', 36); }
      return;
    }
    if (newItem(g, c, it)) return;          // the 12 items added for "30 items total" (below)
    if (mode === 'battle' && battleItem(g, c, it)) return;    // bubbles, honey + poppers work differently in the arena
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
        if (o.shield > 0 || hasPerk(o, 'hover') || hasPerk(o, 'phase')) continue;
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
      if (c.isPlayer && !quietItem) { g.sfx('pop'); popup('Bubble!', c.x, c.y - 50, '#9bf6ff'); }
      else if (target && target.isPlayer) g.sfx('pop');
    }
  }
  let quietItem = false;    // (Triple Bubble: no "Bubble!" popup for each of its 3 bubbles)

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
    else if (c.item === 'snowball' || c.item === 'blaster') use = cars.some(o => o !== c && !o.finished && o.progress > c.progress && o.progress - c.progress < 500) || ai.holdT > 7;
    else if (c.item === 'boomerang') use = cars.some(o => o !== c && !o.finished && Math.hypot(o.x - c.x, o.y - c.y) < 380) || ai.holdT > 7;
    else if (c.item === 'pogopad' || c.item === 'bubbletrap' || c.item === 'glitter') use = cars.some(o => o !== c && !o.finished && o.progress < c.progress && c.progress - o.progress < 350) || ai.holdT > 6;
    else if (c.item === 'grippy') use = c.near.dist > T.hw || ai.holdT > 5;
    else if (c.item === 'trio') use = c.near.dist < T.hw && vlimAt(T.main, c.s + 200) > c.stats.top * 0.9 || ai.holdT > 3;
    else if (c.item === 'balloon' || c.item === 'whirl') use = cars.some(o => o !== c && !o.finished && o.progress > c.progress && o.progress - c.progress < 500) || ai.holdT > 7;
    else if (c.item === 'lucky' || c.item === 'bee') use = ai.holdT > 1.5;
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
  // Giant Snowballs + Boomerangs (Keith, Nov 19: "a couple cooler weapons").
  // They work in races AND in Heart Battle. A hit = a wobble + slow down in a race
  // (a short spin for the snowball), or one heart in Heart Battle. A shield blocks it.
  // ---------------------------------------------------------------
  function throwShot(g, c, kind) {
    const ca = Math.cos(c.a), sa = Math.sin(c.a), sp = Math.max(0, c.vF || 0);
    if (kind === 'snowball') shots.push({ kind, x: c.x + ca * 34, y: c.y + sa * 34, vx: ca * (560 + sp), vy: sa * (560 + sp), r: 16, life: 2.6, t: 0, owner: c, hit: [], h: c.h || 0, hint: c.hint });
    else shots.push({ kind, x: c.x, y: c.y, x0: c.x, y0: c.y, a: c.a, side: Math.random() < 0.5 ? -1 : 1, r: 22, life: 1.7, t: 0, owner: c, hit: [], h: c.h || 0 });
    if (c.isPlayer) {
      if (kind === 'snowball') { Arcade.audio.noise(0.3, { freq: 300, vol: 0.3 }); popup('Giant Snowball!', c.x, c.y - 50, '#ffffff'); }
      else { g.tone(600, 0.4, { type: 'triangle', slide: 1200, vol: 0.14 }); popup('Boomerang!', c.x, c.y - 50, '#f15bb5'); }
    }
  }
  function updateShots(g, dt) {
    for (const sh of shots) {
      sh.t += dt; sh.life -= dt;
      if (sh.kind === 'snowball') {
        sh.r = Math.min(34, 16 + sh.t * 22);                     // it grows as it rolls
        sh.x += sh.vx * dt; sh.y += sh.vy * dt;
        // stops at the arena's flowers / a bumper / the soft wall of a race track
        if (mode === 'battle') { if (fromMid(sh.x, sh.y) > ring.r - 10) sh.life = 0; }
        else { const m = nearest(T.main, sh.x, sh.y, sh.hint, 20); sh.hint = m.i; if (m.dist > T.hw + BOUND - 10) sh.life = 0; }
        if (bumpers.some(b => Math.hypot(b.x - sh.x, b.y - sh.y) < b.r + sh.r)) sh.life = 0;
        if (sh.life <= 0) fx.burst(sh.x, sh.y, { count: 18, colors: ['#ffffff', '#dbeeff'], speed: 220, gravity: 0, size: 12, life: 0.6 });
      } else if (sh.kind === 'balloon') {
        // a water balloon: flies in an arc (sh.z = how high), then SPLASH where it lands
        sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.z = Math.sin(Math.PI * Math.min(1, sh.t / 0.85)) * 70;
        if (sh.life <= 0) {
          fx.burst(sh.x, sh.y, { count: 22, colors: ['#8ecae6', '#ffffff', '#4cc9f0'], speed: 260, gravity: 0, size: 12, life: 0.6 });
          traps.push({ kind: 'splash', x: sh.x, y: sh.y, r: 46, owner: sh.owner, ownerT: 0.5, life: 9, up: false, t: 0, cool: new Map() });
          for (const c of cars) if (c !== sh.owner && !c.finished && Math.hypot(c.x - sh.x, c.y - sh.y) < 80) shotHit(g, c, sh);
          if (sh.owner.isPlayer || Math.hypot(player.x - sh.x, player.y - sh.y) < 500) g.sfx('splash');
        }
        continue;
      } else if (sh.kind === 'bee') {
        // a busy bee: zig-zags after its car
        const tg = sh.target;
        if (tg && cars.includes(tg) && !tg.finished) {
          const want = Math.atan2(tg.y - sh.y, tg.x - sh.x), cur = Math.atan2(sh.vy, sh.vx);
          const na = cur + math.clamp(math.angleDiff(cur, want), -4 * dt, 4 * dt) + Math.sin(sh.t * 14) * 0.08, sp = Math.min(1100, 300 + sh.t * 500);
          sh.vx = Math.cos(na) * sp; sh.vy = Math.sin(na) * sp;
        } else sh.life = Math.min(sh.life, 0.3);
        sh.x += sh.vx * dt; sh.y += sh.vy * dt;
      } else if (sh.kind === 'whirl') {
        // a whirlwind: rolls along the road (in Heart Battle: straight ahead), wiggling side to side
        if (mode === 'battle') { sh.x += sh.vx * dt; sh.y += sh.vy * dt; if (fromMid(sh.x, sh.y) > ring.r) sh.life = 0; }
        else {
          sh.s += 620 * dt;
          const p = pointAt(T.main, sh.s), lat = sh.lat + Math.sin(sh.t * 5) * T.hw * 0.35;
          sh.x = p.x - p.ty * lat; sh.y = p.y + p.tx * lat; sh.h = heightAt(sh.s);
        }
        if (Math.random() < dt * 30) fx.burst(sh.x, sh.y, { count: 1, colors: theme.dust, speed: 90, gravity: 0, size: 9, life: 0.4 });
      } else if (sh.kind === 'dragon') {
        // the Bubble Dragon flies straight on and drops a bubble on each car, one after another
        sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.next -= dt;
        if (sh.next <= 0 && sh.todo.length) {
          sh.next = 0.3;
          const o = sh.todo.shift();
          if (cars.includes(o)) bubbles.push({ x: sh.x, y: sh.y, vx: (o.x - sh.x) * 1.5, vy: (o.y - sh.y) * 1.5, owner: sh.owner, target: o, life: 2.4, h: o.h || 0 });
        }
        continue;
      } else if (sh.kind === 'firework') {
        // a firework rocket: turns toward its car (a bit wobbly), then pops in colors
        if (sh.target && cars.includes(sh.target) && !sh.target.finished) {
          const want = Math.atan2(sh.target.y - sh.y, sh.target.x - sh.x), cur = Math.atan2(sh.vy, sh.vx);
          const na = cur + math.clamp(math.angleDiff(cur, want), -5 * dt, 5 * dt) + Math.sin(sh.t * 20) * 0.04, sp = Math.min(900, 500 + sh.t * 400);
          sh.vx = Math.cos(na) * sp; sh.vy = Math.sin(na) * sp;
        }
        sh.x += sh.vx * dt; sh.y += sh.vy * dt;
        if (Math.random() < dt * 40) fx.burst(sh.x, sh.y, { count: 1, colors: [sh.col, '#ffffff'], speed: 40, gravity: 0, size: 8, life: 0.4 });
        if (sh.life <= 0) fx.burst(sh.x, sh.y, { count: 16, shape: 'star', colors: [sh.col, '#ffffff', '#ffd166'], speed: 220, gravity: 0, size: 11, life: 0.6 });
      } else {
        // the boomerang: out in a big loop, then back to whoever threw it
        const u = Math.min(1, sh.t / 1.6), R = 430, ca = Math.cos(sh.a), sa = Math.sin(sh.a);
        const f = R * Math.sin(Math.PI * u), sd = sh.side * R * 0.45 * (1 - Math.cos(Math.PI * u));
        let x = sh.x0 + ca * f - sa * sd, y = sh.y0 + sa * f + ca * sd;
        const back = u * u * u, o = sh.owner;                      // (the last bit homes in on the thrower)
        if (cars.includes(o)) { x += (o.x - x) * back; y += (o.y - y) * back; }
        sh.x = x; sh.y = y;
      }
      if (sh.life <= 0) continue;
      for (const c of cars) {
        if (c === sh.owner || sh.hit.includes(c) || c.air > 0 || c.finished) continue;
        if (Math.abs((c.h || 0) - (sh.h || 0)) > 0.4 || Math.hypot(c.x - sh.x, c.y - sh.y) > sh.r + CAR_R) continue;
        if ((sh.kind === 'firework' || sh.kind === 'bee') && c !== sh.target) continue;   // (a rocket / bee only gets its own car)
        sh.hit.push(c);
        shotHit(g, c, sh);
        if (sh.kind === 'bee') { sh.life = 0; if (c.isPlayer || sh.owner.isPlayer) popup('Bzzz!', c.x, c.y - 60, '#ffd166'); }
        if (sh.kind === 'firework') { sh.life = 0; fx.burst(sh.x, sh.y, { count: 24, shape: 'star', colors: [sh.col, '#ffffff', '#ffd166', '#9b5de5'], speed: 260, gravity: 0, size: 12, life: 0.7 }); }
      }
    }
    shots = shots.filter(sh => sh.life > 0);
  }
  function shotHit(g, c, sh) {
    fx.burst(c.x, c.y, { count: 14, shape: 'star', colors: sh.kind === 'snowball' ? ['#ffffff', '#bde0fe'] : ['#ef476f', '#ffd166', '#06d6a0', '#4cc9f0'], speed: 200, gravity: 0, size: 11, life: 0.6 });
    if (mode === 'battle') { c.wob = 0.6; hurt(g, c, sh.owner); return; }
    if (hasPerk(c, 'phase') || c.phaseT > 0 || c.ghost > 0 || c.star > 0) return;
    if (c.shield > 0) { c.shield = 0; if (c.isPlayer || sh.owner.isPlayer) { g.sfx('pop'); popup('Blocked!', c.x, c.y - 50, '#4cc9f0'); } return; }
    c.vx *= 0.55; c.vy *= 0.55; c.wob = 0.8;
    squashCar(g, c, 0.28);
    if (c.isPlayer) { g.juice.stop(0.05); g.juice.flash('#ffffff', 0.15); } else if (sh.owner.isPlayer) g.juice.stop(0.03);
    if (sh.kind === 'snowball' && c.spin <= 0) { c.spin = 0.5; c.oilCool = 1.5; }
    if (c.isPlayer) { g.sfx('bonk'); popup(sh.kind === 'snowball' ? 'Brrr!' : 'Boing!', c.x, c.y - 50, '#ffffff'); }
    else if (sh.owner.isPlayer) { g.sfx('star'); popup('Got one!', c.x, c.y - 50, '#ffd166'); }
  }
  function drawShots(ctx, time) {
    for (const sh of shots) {
      ctx.save(); ctx.translate(sh.x, sh.y);
      if (sh.kind === 'balloon') {            // a water balloon in the air (its shadow on the ground)
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(0, 6, 12, 7, 0, 0, 7); ctx.fill();
        ctx.translate(0, -sh.z); ctx.rotate(Math.atan2(sh.vy, sh.vx) + Math.PI / 2);
        ctx.beginPath(); ctx.ellipse(0, 0, 14, 17, 0, 0, 7); ctx.fillStyle = '#4cc9f0'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
        D.circle(ctx, -5, -6, 4, '#ffffff', 0); D.circle(ctx, 0, 18, 3.5, '#4cc9f0', 2.5);
      } else if (sh.kind === 'bee') {         // a little striped bee with flappy wings
        ctx.rotate(Math.atan2(sh.vy, sh.vx));
        const flap = Math.sin(sh.t * 50) * 4;
        ctx.beginPath(); ctx.ellipse(-2, -10 - flap * 0.5, 8, 6 + flap, 0, 0, 7); ctx.ellipse(-2, 10 + flap * 0.5, 8, 6 + flap, 0, 0, 7); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, 0, 14, 10, 0, 0, 7); ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
        ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-4, -9); ctx.lineTo(-4, 9); ctx.moveTo(3, -9); ctx.lineTo(3, 9); ctx.stroke();
        D.circle(ctx, 9, -3, 2.2, INK, 0); D.circle(ctx, 9, 3, 2.2, INK, 0);
      } else if (sh.kind === 'whirl') {       // a spinning whirlwind (seen from above: swirly rings)
        ctx.rotate(sh.t * 14);
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 0, 10 + i * 8, i, i + 4.2); ctx.lineWidth = 5 - i; ctx.strokeStyle = i ? '#bde0fe' : '#ffffff'; ctx.stroke(); }
        ctx.beginPath(); ctx.arc(0, 0, 28, 0, 7); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(43,43,43,0.4)'; ctx.stroke();
      } else if (sh.kind === 'dragon') {      // a friendly green dragon flying over (big: it's up high)
        ctx.rotate(Math.atan2(sh.vy, sh.vx)); ctx.scale(1.4, 1.4);
        const flap = Math.sin(sh.t * 12) * 10;
        ctx.fillStyle = '#b9fbc0'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
        for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-6, 0); ctx.quadraticCurveTo(-4, sg * (30 + flap), 10, sg * (34 + flap)); ctx.quadraticCurveTo(6, sg * 14, 4, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        ctx.beginPath(); ctx.ellipse(0, 0, 24, 11, 0, 0, 7); ctx.fillStyle = '#06d6a0'; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-38, -6); ctx.lineTo(-34, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
        D.circle(ctx, 24, 0, 10, '#06d6a0', 3); D.circle(ctx, 27, -4, 3, '#ffffff', 0); D.circle(ctx, 28, -4, 1.6, INK, 0); D.circle(ctx, 27, 4, 3, '#ffffff', 0); D.circle(ctx, 28, 4, 1.6, INK, 0);
      } else if (sh.kind === 'firework') {           // a little rocket with a flame
        ctx.rotate(Math.atan2(sh.vy, sh.vx));
        ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(-14, -5); ctx.lineTo(-26 - Math.random() * 8, 0); ctx.lineTo(-14, 5); ctx.fill();
        D.box(ctx, -14, -7, 24, 14, 5, sh.col, 3);
        ctx.beginPath(); ctx.moveTo(10, -7); ctx.lineTo(20, 0); ctx.lineTo(10, 7); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      } else if (sh.kind === 'snowball') {
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(5, 8, sh.r, sh.r * 0.7, 0, 0, 7); ctx.fill();
        D.circle(ctx, 0, 0, sh.r, '#ffffff', 4);
        ctx.rotate(sh.t * 9); ctx.strokeStyle = '#bcd7f0'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, sh.r * 0.6, 0.3, 1.8); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, sh.r * 0.3, 3.4, 4.8); ctx.stroke();
      } else {
        ctx.rotate(sh.t * 16);
        boomerangShape(ctx, 1.2);
      }
      ctx.restore();
    }
  }
  // a rainbow boomerang (a fat V), drawn round (0, 0)
  function boomerangShape(ctx, k) {
    ctx.save(); ctx.scale(k, k);
    ctx.beginPath(); ctx.moveTo(-20, 12); ctx.quadraticCurveTo(-14, -12, 0, -16); ctx.quadraticCurveTo(14, -12, 20, 12);
    ctx.quadraticCurveTo(14, 14, 10, 8); ctx.quadraticCurveTo(6, -4, 0, -5); ctx.quadraticCurveTo(-6, -4, -10, 8); ctx.quadraticCurveTo(-14, 14, -20, 12); ctx.closePath();
    const gr = ctx.createLinearGradient(-20, 0, 20, 0);
    ['#ef476f', '#ffd166', '#06d6a0', '#4cc9f0', '#9b5de5'].forEach((col, i) => gr.addColorStop(i / 4, col));
    ctx.fillStyle = gr; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
  }

  // ---------------------------------------------------------------
  // The newer items (Keith, Nov 19: "30 items total"). Everything that lands on the ground
  // goes in `traps` (they work in races and in Heart Battle); things that fly are `shots`.
  // ---------------------------------------------------------------
  const behind = (c, d) => [c.x - Math.cos(c.a) * d, c.y - Math.sin(c.a) * d];
  // someone in front of `c` to aim at: race = the nearest car ahead, battle = the nearest car
  function aheadOf(c, maxD = 1400) {
    let best = null, bd = maxD;
    for (const o of cars) {
      if (o === c || o.finished) continue;
      if (mode !== 'battle' && o.progress < c.progress - 60) continue;
      const d = Math.hypot(o.x - c.x, o.y - c.y); if (d < bd) { bd = d; best = o; }
    }
    return best;
  }
  function newItem(g, c, it) {
    const say = (t, col) => { if (c.isPlayer) popup(t, c.x, c.y - 60, col, 32); };
    if (it === 'pogopad' || it === 'bubbletrap') {     // drop it right behind you
      const [x, y] = behind(c, 56);
      traps.push({ kind: it === 'pogopad' ? 'pogo' : 'btrap', x, y, r: 34, owner: c, ownerT: 1.2, life: 20, up: (c.h || 0) > 0.5, t: 0 });
      if (c.isPlayer) { g.sfx('pop'); say(ITEM_NAMES[it] + '!', it === 'pogopad' ? '#06d6a0' : '#9bf6ff'); }
      return true;
    }
    if (it === 'glitter') {                            // a trail of slippy sparkles behind you for 4 seconds
      c.glitter = 4; c.glitterT = 0;
      if (c.isPlayer) { g.sfx('star'); say('Glitter Trail!', '#f15bb5'); }
      return true;
    }
    if (it === 'grippy') {                             // big chunky wheels: grip + grass can't slow you, 6 seconds
      c.grippy = 6;
      if (c.isPlayer) { g.sfx('power'); say('Monster Wheels!', '#8ac926'); }
      return true;
    }
    if (it === 'trio') {                               // three boosts, one at a time
      c.boost = Math.max(c.boost, 0.75 * (c.stats.nitro || 1));
      c.trioLeft = (c.trioLeft || 3) - 1;
      if (c.trioLeft > 0) c.item = 'trio'; else c.trioLeft = 0;
      if (c.isPlayer) { g.sfx('boost'); say('Turbo ' + (3 - c.trioLeft) + '!', '#ff8c42'); }
      return true;
    }
    if (it === 'lucky') {                              // turns into a surprise item right away
      const pool = BOOK_ITEMS.filter(k => k !== 'lucky' && k !== 'coins' && (mode !== 'friends' || !SHOT_ITEMS.includes(k)) && (mode !== 'battle' || BATTLE_ODDS[k]));
      c.item = pool[Math.floor(Math.random() * pool.length)];
      if (c.isPlayer) { g.sfx('coin'); say('Lucky Dip: ' + ITEM_NAMES[c.item] + '!', '#ffd166'); sawItem(c); }
      useItem(g, c);
      return true;
    }
    if (it === 'balloon') {                            // a water balloon in a big arc, splash where it lands
      const sp = 480 + Math.max(0, c.vF || 0) * 0.8;
      shots.push({ kind: 'balloon', x: c.x, y: c.y, vx: Math.cos(c.a) * sp, vy: Math.sin(c.a) * sp, r: 14, life: 0.85, t: 0, owner: c, hit: [], h: c.h || 0 });
      if (c.isPlayer) { g.tone(500, 0.3, { type: 'sine', slide: 900, vol: 0.12 }); say('Water Balloon!', '#4cc9f0'); }
      return true;
    }
    if (it === 'bee') {                                // a busy bee buzzes off to the car in front (the leader / the most hearts)
      let target = null;
      if (mode === 'battle') target = cars.filter(o => o !== c).sort((a, b) => b.hearts - a.hearts)[0];
      else target = cars.filter(o => o !== c && !o.finished).sort((a, b) => a.position - b.position)[0];
      if (target) shots.push({ kind: 'bee', x: c.x, y: c.y, vx: Math.cos(c.a) * 300, vy: Math.sin(c.a) * 300, target, r: 18, life: 6, t: 0, owner: c, hit: [], h: c.h || 0 });
      if (c.isPlayer) { g.tone(220, 0.5, { type: 'sawtooth', vol: 0.06 }); say('Busy Bee!', '#ffd166'); }
      return true;
    }
    if (it === 'whirl') {                              // a little whirlwind spins away down the road
      const lat = c.near ? c.near.side * Math.min(c.near.dist, T.hw * 0.6) : 0;
      shots.push({ kind: 'whirl', x: c.x, y: c.y, s: c.s || 0, lat, a: c.a, vx: Math.cos(c.a) * 620, vy: Math.sin(c.a) * 620, r: 26, life: 2.6, t: 0, owner: c, hit: [], h: c.h || 0 });
      if (c.isPlayer) { Arcade.audio.noise(0.6, { filter: 'bandpass', freq: 700, vol: 0.25 }); say('Whirlwind!', '#bde0fe'); }
      return true;
    }
    if (it === 'dragon') {                             // SPECIAL: a friendly dragon flies over and drops a bubble on each car
      const list = cars.filter(o => o !== c && !o.finished && (mode === 'battle' || o.progress >= c.progress - 200)).slice(0, 4);
      shots.push({ kind: 'dragon', x: c.x, y: c.y, vx: Math.cos(c.a) * 700, vy: Math.sin(c.a) * 700, r: 0, life: 2.2, t: 0, owner: c, hit: [], h: 0, todo: list, next: 0.2 });
      if (c.isPlayer) { [392, 523, 659, 784].forEach((f, i) => g.tone(f, 0.2, { type: 'square', vol: 0.08, delay: i * 0.1 })); say('Bubble Dragon!', '#06d6a0'); }
      return true;
    }
    if (it === 'swap') {                               // SPECIAL: swap places with the car just in front of you
      const o = mode === 'battle' ? aheadOf(c, 3000) : cars.find(q => q.position === c.position - 1 && !q.finished);
      if (!o) { c.boost = Math.max(c.boost, 1); say('Zoom!', '#ff8c42'); return true; }   // (already in front: a boost instead)
      for (const p of [c, o]) fx.burst(p.x, p.y, { count: 24, shape: 'star', colors: ['#9b5de5', '#ffffff', '#f15bb5'], speed: 220, gravity: 0, size: 12, life: 0.7 });
      for (const k of ['x', 'y', 'a', 'vx', 'vy', 's', 'lap', 'cp', 'progress', 'hint', 'near', 'h', 'lapStart', 'onShort']) { const t = c[k]; c[k] = o[k]; o[k] = t; }
      c.ghost = Math.max(c.ghost, 0.6); o.ghost = Math.max(o.ghost, 0.6);
      if (c.isPlayer) { [880, 660, 880, 1100].forEach((f, i) => g.tone(f, 0.12, { type: 'triangle', vol: 0.15, delay: i * 0.06 })); say('Swap-O!', '#9b5de5'); }
      return true;
    }
    if (it === 'disco') {                              // SPECIAL: a disco ball: every other car dances in a circle
      c.disco = 2.5;
      for (const o of cars) {
        if (o === c || o.finished || o.shield > 0 || o.star > 0 || o.mega > 0 || hasPerk(o, 'phase')) continue;
        if (mode === 'battle') { o.wob = 1.2; o.vx *= 0.3; o.vy *= 0.3; }
        else { o.spin = Math.max(o.spin, 1.1); o.oilCool = 2.5; o.vx *= 0.6; o.vy *= 0.6; }
        if (o.isPlayer) popup('Dance!', o.x, o.y - 50, '#f15bb5');
      }
      if (c.isPlayer) { [523, 659, 784, 1047, 784, 659].forEach((f, i) => g.tone(f, 0.12, { type: 'square', vol: 0.08, delay: i * 0.1 })); say('Disco Ball!', '#ffd166'); }
      return true;
    }
    return false;
  }
  // Things on the ground: Pogo Pads bounce a car up (and slow it), Bubble Traps bubble it,
  // glitter makes it wobble, a splash slows it. Your own stuff leaves you alone for a moment.
  function updateTraps(g, dt) {
    // glitter: drop little sparkle patches behind cars with a Glitter Trail
    for (const c of cars) {
      c.grippy = Math.max(0, (c.grippy || 0) - dt); c.disco = Math.max(0, (c.disco || 0) - dt);
      if (c.glitter > 0) {
        c.glitter -= dt; c.glitterT -= dt;
        if (c.glitterT <= 0) { c.glitterT = 0.18; const [x, y] = behind(c, 40); traps.push({ kind: 'glitter', x, y, r: 26, owner: c, ownerT: 99, life: 6, up: (c.h || 0) > 0.5, t: 0, cool: new Map() }); }
      }
    }
    for (const tr of traps) {
      tr.t += dt; tr.life -= dt; tr.ownerT -= dt;
      for (const c of cars) {
        if (tr.life <= 0) break;
        if (c.finished || c.air > 0 || c.cloud > 0 || hasPerk(c, 'phase') || (tr.owner === c && tr.ownerT > 0)) continue;
        if (!!tr.up !== ((c.h || 0) > 0.5) || Math.hypot(c.x - tr.x, c.y - tr.y) > tr.r + CAR_R * 0.6) continue;
        if (tr.cool) { if ((tr.cool.get(c) || 0) > tr.t) continue; tr.cool.set(c, tr.t + 1.2); }
        const safe = c.shield > 0 || c.star > 0 || c.mega > 0;
        if (tr.kind === 'pogo') {
          tr.life = 0;
          c.air = c.airMax = 0.75; c.vx *= 0.6; c.vy *= 0.6;
          fx.burst(tr.x, tr.y, { count: 14, shape: 'star', colors: ['#06d6a0', '#ffffff'], speed: 200, gravity: 0, size: 11, life: 0.6 });
          if (c.isPlayer) { g.sfx('spring'); popup('Boing!', c.x, c.y - 60, '#06d6a0'); }
        } else if (tr.kind === 'btrap') {
          tr.life = 0;
          fx.burst(tr.x, tr.y, { count: 16, colors: ['#ffffff', '#9bf6ff', '#ffc8dd'], speed: 200, gravity: 0, size: 10, life: 0.6 });
          if (safe) { c.shield = 0; continue; }
          if (mode === 'battle') { if (hurt(g, c, tr.owner)) c.bubbled = 0.8; }
          else c.bubbled = c.isPlayer ? g.pick(0.7, 1.0, 1.2) : 1.2;
          if (c.isPlayer || tr.owner.isPlayer) { g.sfx('pop'); popup('Pop!', c.x, c.y - 50, '#9bf6ff'); }
        } else if (!safe && (tr.kind === 'glitter' || tr.kind === 'splash')) {
          c.wob = Math.max(c.wob || 0, tr.kind === 'glitter' ? 0.5 : 0.3); c.vx *= 0.8; c.vy *= 0.8;
          if (c.isPlayer) popup(tr.kind === 'glitter' ? 'Sparkly!' : 'Splash!', c.x, c.y - 50, tr.kind === 'glitter' ? '#f15bb5' : '#8ecae6');
        }
      }
    }
    traps = traps.filter(tr => tr.life > 0);
  }
  function drawTraps(ctx, time, vis) {
    for (const tr of traps) {
      if (!vis(tr.x, tr.y)) continue;
      ctx.save(); ctx.translate(tr.x, tr.y);
      const fade = Math.min(1, tr.life / 0.8);
      ctx.globalAlpha = fade;
      if (tr.kind === 'pogo') {            // a green bouncy pad with a spring in the middle
        D.circle(ctx, 0, 0, tr.r, '#06d6a0', 4); D.circle(ctx, 0, 0, tr.r * 0.62, '#b9fbc0', 3);
        ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); for (let k = 0; k <= 4; k++) ctx.lineTo(k % 2 ? 8 : -8, -10 + k * 5); ctx.stroke();
      } else if (tr.kind === 'btrap') {    // a wobbly bubble sitting on the road
        drawBubble(ctx, 0, -4 + Math.sin(time * 4) * 2, tr.r, time);
        ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(0, -4 + Math.sin(time * 4) * 2, tr.r + 1, 0, 7); ctx.stroke();
      } else if (tr.kind === 'glitter') {  // twinkly sparkles
        for (let i = 0; i < 4; i++) { const a = i * 1.6 + tr.x; D.star(ctx, Math.cos(a) * 14, Math.sin(a) * 12, 6 + 2 * Math.sin(time * 6 + i), ['#f15bb5', '#ffd166', '#9bf6ff', '#ffffff'][i], 1.5); }
      } else if (tr.kind === 'splash') {   // a puddle that dries up
        ctx.beginPath(); ctx.ellipse(0, 0, tr.r, tr.r * 0.75, 0, 0, 7); ctx.fillStyle = '#6fc3ec'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(-tr.r * 0.3, -tr.r * 0.25, tr.r * 0.3, tr.r * 0.1, -0.3, 0, 7); ctx.fill();
      }
      ctx.restore();
    }
  }

  // Bouncy bumpers on race tracks: bounce off them (the Ghost Car and jumping cars pass)
  function bounceBumpers(g, c) {
    if (c.air > 0 || c.cloud > 0 || (c.h || 0) > 0.4 || hasPerk(c, 'phase')) return;
    for (const b of bumpers) {
      const dx = c.x - b.x, dy = c.y - b.y, dd = Math.hypot(dx, dy), min = b.r + CAR_R;
      if (dd >= min || !dd) continue;
      const nx = dx / dd, ny = dy / dd;
      c.x = b.x + nx * min; c.y = b.y + ny * min;
      const vn = c.vx * nx + c.vy * ny;
      if (vn < 0) { c.vx -= nx * vn * 2.1; c.vy -= ny * vn * 2.1; }     // boing: bounces back a bit faster
      if (b.hit <= 0 && vn < -80) { b.hit = 0.3; if (c.isPlayer) { g.sfx('spring'); popup('Boing!', c.x, c.y - 50, '#ffd166'); } }
    }
  }
  function drawBumper(ctx, b) {
    const sq = b.hit > 0 ? 1 + 0.12 * Math.sin(b.hit * 40) : 1;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(b.x + 6, b.y + 9, b.r, b.r * 0.8, 0, 0, 7); ctx.fill();
    D.circle(ctx, b.x, b.y, b.r * sq, theme.curb, 5);
    D.circle(ctx, b.x, b.y, b.r * 0.66 * sq, '#ffffff', 4);
    D.star(ctx, b.x, b.y, b.r * 0.4 * sq, '#ffd166', 3);
  }

  // ---------------------------------------------------------------
  // Heart Battle (Keith, Nov 19): a battle-royale mode in a round arena.
  // Every car has hearts (4; a little kid gets 6). Bubbles, a bump from a
  // boosting car and Party Poppers knock a heart off. Out of hearts = the car
  // poofs into sparkles. The last car still driving wins. A ring of flowers
  // slowly closes in, so the cars meet and a round lasts about 2 minutes.
  // (Keith: hearts, NOT balloons, so it isn't like Mario Kart's battle.)
  //
  // The arena is a "track" too, so the drawing code just works: its centerline
  // is a small circle with a VERY wide road (hw), so the road is one big disc.
  // Nothing else from racing is used (no laps, checkpoints or road-following).
  // ---------------------------------------------------------------
  const ARENA_C = 1600, ARENA_R = 300, ARENA_HW = 780;          // center, centerline circle, road half width
  const ARENA_EDGE = ARENA_R + ARENA_HW;                        // the road ends here (then grass)
  const circlePts = (r, n = 12) => Array.from({ length: n }, (_, i) => [ARENA_C + r * Math.cos(i / n * Math.PI * 2), ARENA_C + r * Math.sin(i / n * Math.PI * 2)]);
  const ARENAS = [
    { id: 'hb-yard',  name: 'Garden Ring',   theme: 'yard',  song: 't1', fence: 'flower' },
    { id: 'hb-snow',  name: 'Snowball Bowl', theme: 'snow',  song: 't3', fence: 'snow' },
    { id: 'hb-candy', name: 'Candy Dome',    theme: 'candy', song: 't6', fence: 'gum' },
  ].map(a => Object.assign(a, { arena: true, hw: ARENA_HW, items: [], pts: circlePts(ARENA_R) }));
  // each world's moving obstacle (Nov 19: every world has one now: a beach ball, a pumpkin,
  // a tumbleweed, a moon rock, a frog, a cloud puff)
  const THEME_MOVER = { snow: 'snowball', beach: 'crab', candy: 'gumdrop', volcano: 'steam', yard: 'ball', autumn: 'pumpkin',
    desert: 'tumbleweed', moon: 'rock', jungle: 'frog', sky: 'puff' };
  let sharedTrack = null;   // Friends: the home-made track the room maker picked (a def from rc/builder.js)
  // A home-made track with its own things (rc/builder.js): they replace the gift boxes, pads,
  // oil, puddles, bumpers and critters the race would have placed by itself.
  function applyThings(list) {
    boxes = []; pads = []; bumpers = []; movers = [];
    hazards = hazards.filter(h => h.onShort);
    list.forEach((q, n) => {
      const s = ((q.f % 1) + 1) % 1 * T.L;
      if (lapDist(s, 0, T.L) < 220 || nearCross(s, 450)) return;         // (never on the start line or the bridge crossing)
      const p = pointAt(T.main, s), a = Math.atan2(p.ty, p.tx);
      const lat = math.clamp(q.lat || 0, -1, 1) * 0.6 * T.hw, x = p.x - p.ty * lat, y = p.y + p.tx * lat;
      if (q.k === 'gift') for (const l of [-0.5, 0, 0.5]) boxes.push({ x: p.x - p.ty * l * T.hw, y: p.y + p.tx * l * T.hw, t: 0, spin: Math.random() * 6 });
      else if (q.k === 'boost' || q.k === 'ramp') pads.push({ kind: q.k, s, x: p.x, y: p.y, a });
      else if (q.k === 'bumper') bumpers.push({ s, lat, x, y, r: 34, hit: 0 });
      else if (q.k === 'oil' || q.k === 'puddle') { const r = q.k === 'oil' ? 34 : 40; hazards.push({ kind: q.k, s, lat, x, y, r, r0: r, seed: n * 1.7 }); }
      else if (q.k === 'critter') { const kind = THEME_MOVER[T.def.theme] || 'ball'; movers.push({ kind, s, ph: n * 1.7, side: lat >= 0 ? 1 : -1, x, y, r: 20, on: true, z: 0, spin: 0 }); }
    });
  }
  // bouncy bumpers on these race tracks (how many)
  const TRACK_BUMPERS = { t2: 3, t4: 2, t6: 4, t7: 3, t10: 4 };
  const SHOT_ITEMS = ['snowball', 'boomerang', 'blaster', 'balloon', 'bee', 'whirl', 'bubbletrap', 'pogopad', 'glitter'];
  let shots = [];   // Giant Snowballs + Boomerangs flying about
  let traps = [];   // Pogo Pads, Bubble Traps, Glitter, Water Balloon splashes on the ground (Nov 19)
  const BATTLE = {
    hearts: 4, littleHearts: 6,      // hearts at the start (Keith: 4)
    ringStart: 15, ringEnd: 90,      // seconds: when the flowers start / stop moving in
    ringMin: 440,                    // how small the safe circle gets
    timeUp: 140,                     // still more than one car? Most hearts wins.
    heartEvery: 12,                  // a heart to pick up now and then
  };
  // gift boxes in Heart Battle: no coins, magnets or warps (they're about the race)
  const BATTLE_ODDS = { bubble: 24, boost: 18, shield: 15, honey: 7, spring: 7, popper: 8, star: 3, phase: 3, snowball: 9, boomerang: 8, blaster: 6,
    pogopad: 5, bubbletrap: 6, glitter: 2, grippy: 4, balloon: 7, trio: 5, lucky: 5, bee: 4, whirl: 5 };
  // car powers that make sense in an arena (others would make a car unbeatable,
  // e.g. the Ghost Car drives through everything): the rest is just the look
  const BATTLE_PERKS = ['launch', 'speed', 'tank', 'boost', 'grass'];
  let ring = null, bumpers = [], heartPick = null, heartT = 0, outCars = [], battleOver = false;

  // Arena ready: the 4 cars round the middle, facing in; bumpers, gift boxes.
  function battleStart(g) {
    const mine = pickedCar(g);
    const rivals = RIVALS.filter(r => r.color !== mine.color).slice(0, 3);
    cars = []; outCars = []; battleOver = false;
    // everyone the same car: your tires + turbo are good, rivals a touch slower
    // (little kids: rivals much gentler)
    const myStats = playerStats({ up: { tires: MAX_LVL, turbo: 3 } });
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 2 + k * Math.PI / 2, rr = 640;   // k = 0: you, at the bottom
      const x = ARENA_C + Math.cos(a) * rr, y = ARENA_C + Math.sin(a) * rr;
      let c;
      if (k === 0) {
        c = player = makeCar(myStats, mine.color, 'You', true, 0, 0);
        giveStyle(player, pickedStyle(g));
        player.decal = pickedDecal(g); player.fx = mine.fx || null; player.trail = [];
      } else {
        const rv = rivals[k - 1];
        const st = { ...BASE, top: BASE.top * (g.little ? 0.82 : 0.96), accel: BASE.accel * (g.little ? 0.85 : 1), grip: BASE.grip * 1.3 };
        c = makeCar(st, rv.color, rv.name, false, 0, 0);
        c.fav = rv.fav; c.ai.flavor = 0.9 + k * 0.08;
        if (pickedStyle(g).id !== 'classic') giveStyle(c, RIVAL_STYLES[Math.floor(Math.random() * RIVAL_STYLES.length)]);
      }
      if (!BATTLE_PERKS.includes(c.perk)) c.perk = null;   // (keep the look, not the power)
      c.x = x; c.y = y; c.a = a + Math.PI;
      c.hearts = c.maxHearts = c.isPlayer && g.little ? BATTLE.littleHearts : BATTLE.hearts;
      c.ai = Object.assign(c.ai || {}, { t: 0, tx: ARENA_C, ty: ARENA_C, stuckT: 0, backT: 0, holdT: 0 });   // (yours too: for the test autopilot)
      cars.push(c);
    }
    ring = { r: ARENA_EDGE + BOUND - 30, r0: ARENA_EDGE + BOUND - 30, warned: false };
    // 4 big bouncy bumpers (they also block bubbles: hide behind one!)
    bumpers = [0, 1, 2, 3].map(k => { const a = Math.PI / 4 + k * Math.PI / 2; return { x: ARENA_C + Math.cos(a) * 560, y: ARENA_C + Math.sin(a) * 560, r: 58, hit: 0 }; });
    // gift boxes: a small ring in the middle + a big ring further out
    boxes = [];
    for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5; boxes.push({ x: ARENA_C + Math.cos(a) * 230, y: ARENA_C + Math.sin(a) * 230, t: 0, spin: Math.random() * 6 }); }
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + Math.PI / 8; boxes.push({ x: ARENA_C + Math.cos(a) * 860, y: ARENA_C + Math.sin(a) * 860, t: 0, spin: Math.random() * 6 }); }
    heartPick = null; heartT = BATTLE.heartEvery;
    hazards = []; pads = []; movers = []; trackCoins = []; driveStars = []; starsGot = 0;
    ghost = null; ghostRec = []; boo = null; laps = 1;
  }

  // How far from the middle of the arena
  const fromMid = (x, y) => Math.hypot(x - ARENA_C, y - ARENA_C);

  // Lose a heart (unless something protects you). by = who did it (for the popup).
  function hurt(g, c, by) {
    if (!c.hearts || c.ghost > 0 || c.star > 0 || c.mega > 0 || c.phaseT > 0) return false;
    if (c.shield > 0) {                  // a shield takes the hit instead
      c.shield = 0;
      if (c.isPlayer || (by && by.isPlayer)) { g.sfx('pop'); popup('Blocked!', c.x, c.y - 50, '#4cc9f0'); }
      return false;
    }
    c.hearts--;
    c.ghost = 1.5;                       // blinks for a moment: nothing can hit it again yet
    fx.burst(c.x, c.y - 30, { count: 10, colors: ['#ef476f', '#ff8fab', '#ffffff'], speed: 160, gravity: 200, size: 11, life: 0.7 });
    squashCar(g, c, 0.3);
    if (c.isPlayer) { g.sfx('bonk'); g.tone(520, 0.25, { type: 'triangle', slide: 260, vol: 0.18 }); popup(c.hearts ? 'Ouch!' : 'Poof!', c.x, c.y - 60, '#ff8fab', 34); g.juice.stop(0.06); g.juice.flash('#ff8fab', 0.2); g.juice.pop('hearts', 0.4); }
    else if (by && by.isPlayer) { g.sfx('star'); popup('Got one!', c.x, c.y - 60, '#ffd166', 30); g.juice.stop(0.04); }
    if (c.hearts <= 0) knockOut(g, c);
    return true;
  }

  // Out of hearts: poof! The car turns into sparkles and leaves the arena.
  function knockOut(g, c) {
    fx.burst(c.x, c.y, { count: 40, shape: 'star', colors: ['#ffd166', '#ffffff', c.color, '#ff8fab'], speed: 300, gravity: 0, size: 15, life: 1.1 });
    g.juice.poof(c.x, c.y, { to: fx }); g.sfx('poof');
    cars = cars.filter(o => o !== c);
    outCars.push(c);                     // first one out = last place
    if (c.isPlayer) {
      engine.stop(); say('Nice try!');
      popup('Nice try!', c.x, c.y - 80, '#ffffff', 46);
      endTimer = 2.6;
    } else if (player.hearts > 0) g.sfx('coin');
    if (cars.length === 1 && !battleOver) {   // only one car left: the winner!
      battleOver = true;
      const w = cars[0];
      if (w.isPlayer) { g.sfx('win'); cheer(); say('You win!'); Arcade.confetti(90); popup('You win!', w.x, w.y - 80, '#ffd166', 50); engine.stop(); }
      endTimer = Math.max(endTimer, 2.6);
    }
  }

  // The computer drivers in the arena: grab a gift box, then go after the closest
  // car; fire bubbles when it's in front, boost into it, stay inside the flowers.
  function battleAI(g, c, dt) {
    const ai = c.ai, sp = Math.hypot(c.vx, c.vy);
    ai.t -= dt; ai.holdT = c.item ? ai.holdT + dt : 0;
    // pick something to go for (every half second)
    let prey = null, pd = Infinity;
    for (const o of cars) if (o !== c) { const d = Math.hypot(o.x - c.x, o.y - c.y); if (d < pd) { pd = d; prey = o; } }
    if (ai.t <= 0) {
      ai.t = 0.5;
      let tx = ARENA_C, ty = ARENA_C;
      const near = (list) => { let b = null, bd = Infinity; for (const o of list) { const d = Math.hypot(o.x - c.x, o.y - c.y); if (d < bd) { bd = d; b = o; } } return b; };
      const box = near(boxes.filter(b => b.t <= 0 && fromMid(b.x, b.y) < ring.r - 80));
      if (heartPick && c.hearts < c.maxHearts && Math.hypot(heartPick.x - c.x, heartPick.y - c.y) < 1000) { tx = heartPick.x; ty = heartPick.y; }
      else if (!c.item && box) { tx = box.x; ty = box.y; }
      else if (prey) { tx = prey.x + prey.vx * 0.4; ty = prey.y + prey.vy * 0.4; }      // aim where it's going
      ai.tx = tx; ai.ty = ty;
    }
    let tx = ai.tx, ty = ai.ty;
    // stay inside the flowers: near the edge, head back toward the middle
    if (fromMid(c.x, c.y) > ring.r - 150) { tx = ARENA_C; ty = ARENA_C; }
    // a bumper right in front? steer round it
    for (const b of bumpers) {
      const d = Math.hypot(b.x - c.x, b.y - c.y);
      if (d < b.r + 150 && Math.abs(math.angleDiff(c.a, Math.atan2(b.y - c.y, b.x - c.x))) < 0.6) {
        const side = math.angleDiff(c.a, Math.atan2(b.y - c.y, b.x - c.x)) > 0 ? -1 : 1;
        tx = c.x + Math.cos(c.a + side * 1.2) * 200; ty = c.y + Math.sin(c.a + side * 1.2) * 200;
      }
    }
    const want = Math.atan2(ty - c.y, tx - c.x), diff = math.angleDiff(c.a, want);
    let steer = math.clamp(diff * 2.2, -1, 1), gas = true, brake = false;
    if (Math.abs(diff) > 2.2 && sp > 160) { gas = false; brake = true; }      // a tight turn: slow down first
    // stuck against something? back up for a moment
    if (sp < 35 && !(countdown > 0)) ai.stuckT += dt; else ai.stuckT = 0;
    if (ai.stuckT > 1.2) { ai.stuckT = 0; ai.backT = 0.7; }
    if (ai.backT > 0) { ai.backT -= dt; gas = false; brake = true; steer = -steer; }
    // items
    if (c.item && ai.holdT > (g.little ? 1.6 : 0.6)) {
      const facing = prey && Math.abs(math.angleDiff(c.a, Math.atan2(prey.y - c.y, prey.x - c.x)));
      const danger = bubbles.some(b => b.owner !== c && Math.hypot(b.x - c.x, b.y - c.y) < 260);
      let use = false;
      if (c.item === 'bubble' || c.item === 'snowball' || c.item === 'blaster') use = prey && pd < 800 && facing < 0.35;
      else if (c.item === 'boomerang') use = prey && pd < 420;
      else if (c.item === 'balloon' || c.item === 'whirl') use = prey && pd < 500 && facing < 0.35;
      else if (c.item === 'pogopad' || c.item === 'bubbletrap' || c.item === 'glitter') use = cars.some(o => o !== c && Math.hypot(o.x - c.x, o.y - c.y) < 300 && Math.abs(math.angleDiff(c.a + Math.PI, Math.atan2(o.y - c.y, o.x - c.x))) < 0.8);
      else if (c.item === 'trio') use = prey && pd < 450 && facing < 0.3;
      else if (c.item === 'grippy' || c.item === 'lucky' || c.item === 'bee') use = ai.holdT > 1.2;
      else if (c.item === 'boost' || c.item === 'star') use = prey && pd < 450 && facing < 0.3;
      else if (c.item === 'popper') use = prey && pd < 230;
      else if (c.item === 'honey') use = cars.some(o => o !== c && Math.hypot(o.x - c.x, o.y - c.y) < 300 && Math.abs(math.angleDiff(c.a + Math.PI, Math.atan2(o.y - c.y, o.x - c.x))) < 0.8);
      else if (c.item === 'shield' || c.item === 'phase' || c.item === 'spring') use = danger || c.hearts < c.maxHearts && ai.holdT > 3;
      if (use || ai.holdT > 7) useItem(g, c);
    }
    return { gas, brake, steer };
  }

  // Bubbles in the arena: they float after their target; a pop = a lost heart.
  // A bumper or the flower ring pops them harmlessly.
  function battleBubbles(g, dt) {
    for (const b of bubbles) {
      b.life -= dt;
      if (b.target && cars.includes(b.target)) {
        const want = Math.atan2(b.target.y - b.y, b.target.x - b.x), sp = Math.hypot(b.vx, b.vy), cur = Math.atan2(b.vy, b.vx);
        const na = cur + math.clamp(math.angleDiff(cur, want), -3.2 * dt, 3.2 * dt);
        b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp;
      }
      b.x += b.vx * dt; b.y += b.vy * dt;
      const popHere = () => { b.life = 0; fx.burst(b.x, b.y, { count: 14, colors: ['#ffffff', '#9bf6ff', '#ffc8dd'], speed: 180, gravity: 0, size: 10, life: 0.5 }); };
      if (fromMid(b.x, b.y) > ring.r || bumpers.some(m => Math.hypot(m.x - b.x, m.y - b.y) < m.r + 12)) { popHere(); continue; }
      for (const c of cars) {
        if (c === b.owner || b.life <= 0 || c.air > 0) continue;
        if (Math.hypot(c.x - b.x, c.y - b.y) > 32) continue;
        popHere();
        if (c.isPlayer || b.owner.isPlayer) g.sfx('pop');
        if (hurt(g, c, b.owner)) c.bubbled = 0.8;
      }
    }
    bubbles = bubbles.filter(b => b.life > 0);
  }

  // Items that work differently in the arena (true = done here)
  function battleItem(g, c, it) {
    if (it === 'bubble') {             // aim at the closest car in front of us
      let target = null, bd = 1000;
      for (const o of cars) {
        if (o === c) continue;
        const d = Math.hypot(o.x - c.x, o.y - c.y);
        if (d < bd && Math.abs(math.angleDiff(c.a, Math.atan2(o.y - c.y, o.x - c.x))) < 1.1) { bd = d; target = o; }
      }
      const sp = 600 + Math.max(0, c.vF || 0);
      bubbles.push({ x: c.x + Math.cos(c.a) * 30, y: c.y + Math.sin(c.a) * 30, vx: Math.cos(c.a) * sp, vy: Math.sin(c.a) * sp, owner: c, target, life: 2.2, h: 0 });
      if (c.isPlayer && !quietItem) { g.sfx('pop'); popup('Bubble!', c.x, c.y - 50, '#9bf6ff'); }
      else if (target && target.isPlayer) g.sfx('pop');
      return true;
    }
    if (it === 'honey') {              // a sticky puddle right behind you
      hazards.push({ kind: 'honey', x: c.x - Math.cos(c.a) * 52, y: c.y - Math.sin(c.a) * 52, r: 44, seed: Math.random() * 10, life: 12, owner: c, ownerT: 1.2 });
      if (c.isPlayer) { g.sfx('splash'); popup('Honey!', c.x, c.y - 50, '#ffb703'); }
      return true;
    }
    if (it === 'popper') {             // confetti all round: every car close by loses a heart
      fx.burst(c.x, c.y, { count: 40, shape: 'square', speed: 320, gravity: 0, size: 10, life: 0.9 });
      for (const o of cars.slice()) if (o !== c && Math.hypot(o.x - c.x, o.y - c.y) < 240) { o.wob = 0.8; hurt(g, o, c); }
      if (c.isPlayer) { Arcade.audio.noise(0.25, { filter: 'highpass', freq: 1500, vol: 0.3 }); g.sfx('pop'); popup('Pop!', c.x, c.y - 50, '#f15bb5'); }
      return true;
    }
    return false;
  }

  // A bump between two cars: a car that is boosting (or a Super Star) knocks a
  // heart off the other one. Plain bumps are just bumps.
  function battleBump(g, a, b, speed) {
    if (speed < 120) return;
    const aHits = a.boost > 0 || a.star > 0 || a.mega > 0, bHits = b.boost > 0 || b.star > 0 || b.mega > 0;
    if (aHits && !bHits) hurt(g, b, a);
    else if (bHits && !aHits) hurt(g, a, b);
  }

  // Keep cars inside the ring of flowers, and bounce them off the bumpers.
  function arenaWalls(g, c) {
    const d = fromMid(c.x, c.y), lim = ring.r - CAR_R;
    if (d > lim) {
      const nx = (c.x - ARENA_C) / d, ny = (c.y - ARENA_C) / d;
      c.x -= nx * (d - lim); c.y -= ny * (d - lim);
      const vn = c.vx * nx + c.vy * ny;
      if (vn > 0) {
        c.vx -= nx * vn * 1.5; c.vy -= ny * vn * 1.5;
        if (vn > 110 && c.bumpCool <= 0) {
          c.bumpCool = 0.3;
          if (c.isPlayer) g.sfx('bonk');
          fx.burst(c.x + nx * 22, c.y + ny * 22, { count: 6, colors: ['#ffffff', '#ffd166', '#f15bb5'], speed: 120, gravity: 0, size: 9, life: 0.4 });
        }
      }
    }
    for (const b of bumpers) {
      const dx = c.x - b.x, dy = c.y - b.y, dd = Math.hypot(dx, dy), min = b.r + CAR_R;
      if (dd >= min || !dd) continue;
      const nx = dx / dd, ny = dy / dd;
      c.x = b.x + nx * min; c.y = b.y + ny * min;
      const vn = c.vx * nx + c.vy * ny;
      if (vn < 0) { c.vx -= nx * vn * 2.1; c.vy -= ny * vn * 2.1; }     // boing: bounces back a bit faster
      if (b.hit <= 0 && vn < -80) { b.hit = 0.3; if (c.isPlayer) g.sfx('spring'); }
    }
    c.surface = fromMid(c.x, c.y) > ARENA_EDGE ? 'grass' : 'road';
  }

  // One step of the battle (after "Go!")
  function battleTick(g, dt) {
    const inp = g.input;
    // the ring of flowers closes in slowly
    const k = math.clamp((raceTime - BATTLE.ringStart) / (BATTLE.ringEnd - BATTLE.ringStart), 0, 1);
    ring.r = ring.r0 + (BATTLE.ringMin - ring.r0) * k;
    if (k > 0 && !ring.warned) { ring.warned = true; popup('Squeeze!', player.x, player.y - 80, '#f15bb5', 40); g.sfx('unlock'); }
    // honey dries up
    for (const h of hazards) { h.life -= dt; h.ownerT -= dt; }
    hazards = hazards.filter(h => h.life > 0);
    // a heart to pick up now and then (when someone has lost one)
    if (!heartPick && cars.some(c => c.hearts < c.maxHearts) && (heartT -= dt) <= 0) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * Math.max(100, ring.r * 0.6);
      heartPick = { x: ARENA_C + Math.cos(a) * r, y: ARENA_C + Math.sin(a) * r, t: 0 };
      heartT = BATTLE.heartEvery;
    }
    if (heartPick) { heartPick.t += dt; if (fromMid(heartPick.x, heartPick.y) > ring.r - 60) heartPick = null; }

    for (const c of cars.slice()) {
      let ctl;
      if (c.isPlayer && !autopilot) {
        const left = inp.down('ArrowLeft', 'KeyA'), right = inp.down('ArrowRight', 'KeyD');
        const brake = inp.down('ArrowDown', 'KeyS');
        const gas = inp.down('ArrowUp', 'KeyW') || ((g.little || g.oneThumb) && !brake);   // (little kids + one thumb: it drives itself forward)
        const steer = (right ? 1 : 0) - (left ? 1 : 0);
        const sIn = c.steerIn || 0;
        const rate = (steer && Math.sign(steer) === Math.sign(sIn) && Math.abs(steer) > Math.abs(sIn)) || !sIn ? 7 : 14;
        c.steerIn = sIn + math.clamp(steer - sIn, -rate * dt, rate * dt);
        ctl = { gas, brake, steer: c.steerIn };
        driftTick(g, c, ctl, dt);
        if (inp.hit('Space', 'Enter', 'KeyX') || thumbItem(g, c, dt)) useItem(g, c);
      } else { if (c.drift) c.drift.on = false; ctl = battleAI(g, c, dt); }
      // timers
      c.boost = Math.max(0, c.boost - dt); c.shield = Math.max(0, c.shield - dt);
      c.bubbled = Math.max(0, c.bubbled - dt); c.ghost = Math.max(0, c.ghost - dt);
      c.star = Math.max(0, (c.star || 0) - dt); c.bumpCool = Math.max(0, c.bumpCool - dt);
      c.mega = Math.max(0, (c.mega || 0) - dt); c.frozen = Math.max(0, (c.frozen || 0) - dt);
      if (c.phaseT > 0) c.phaseT -= dt;
      if (c.wob > 0) c.wob -= dt;
      if (c.star > 0 && Math.random() < dt * 30) fx.burst(c.x, c.y, { count: 1, shape: 'star', speed: 80, gravity: 0, size: 12, life: 0.5 });
      drive(g, c, ctl, dt);
      if (c.air > 0 && (c.air -= dt) <= 0) { c.air = 0; fx.burst(c.x, c.y, { count: 12, colors: theme.dust, speed: 160, gravity: 0, size: 12, life: 0.5 }); squashCar(g, c, 0.38); }
      arenaWalls(g, c);
      // honey puddles: sticky!
      let inH = false;
      for (const h of hazards) {
        if (c.air > 0 || (h.owner === c && h.ownerT > 0) || Math.hypot(c.x - h.x, c.y - h.y) > h.r + 4) continue;
        inH = true;
        if (!c.inPuddle && c.shield <= 0) { c.vx *= 0.45; c.vy *= 0.45; if (c.isPlayer) { g.sfx('splash'); popup('Sticky!', c.x, c.y - 50, '#ffb703'); } }
      }
      c.inPuddle = inH;
      // gift boxes
      for (const b of boxes) {
        if (b.t > 0 || c.item || Math.hypot(c.x - b.x, c.y - b.y) > 34) continue;
        b.t = 4;
        fx.burst(b.x, b.y, { count: 12, shape: 'star', speed: 180, gravity: 0, size: 12, life: 0.6 });
        giveItem(c);
        if (c.isPlayer) g.sfx('coin');
      }
      // the heart
      if (heartPick && c.hearts < c.maxHearts && Math.hypot(c.x - heartPick.x, c.y - heartPick.y) < 40) {
        c.hearts++; heartPick = null;
        fx.burst(c.x, c.y - 30, { count: 16, colors: ['#ef476f', '#ff8fab', '#ffffff'], speed: 180, gravity: 0, size: 12, life: 0.7 });
        if (c.isPlayer) { [784, 988, 1319].forEach((f, i) => g.tone(f, 0.14, { type: 'triangle', vol: 0.16, delay: i * 0.07 })); popup('+1 heart!', c.x, c.y - 60, '#ff8fab', 34); }
      }
      // dust + boost flames
      const ca = Math.cos(c.a), sa = Math.sin(c.a);
      if (c.boost > 0 && Math.random() < dt * 40) fx.burst(c.x - ca * 26, c.y - sa * 26, { count: 1, angle: c.a + Math.PI, spread: 0.5, speed: 140, gravity: 0, size: 12, life: 0.35, colors: ['#ffd166', '#ff8c42', '#ef476f'] });
      if (Math.abs(c.slip || 0) > 110 && Math.hypot(c.vx, c.vy) > 140 && Math.random() < dt * 20) fx.burst(c.x - ca * 15, c.y - sa * 15, { count: 1, speed: 50, gravity: 0, size: 10, life: 0.4, colors: theme.dust });
    }
    collide(g);
    battleBubbles(g, dt);
    updateShots(g, dt);
    updateTraps(g, dt);
    for (const b of boxes) { b.t = fromMid(b.x, b.y) > ring.r - 60 ? Math.max(b.t, 0.5) : Math.max(0, b.t - dt); b.spin += dt; }   // (boxes outside the flowers wait)
    for (const b of bumpers) b.hit -= dt;
    // time's up: the car with the most hearts wins (a tie goes to you)
    if (raceTime > BATTLE.timeUp && !battleOver && cars.length > 1) {
      battleOver = true;
      const top = Math.max(...cars.map(c => c.hearts));
      if (player.hearts === top && cars.includes(player)) { g.sfx('win'); cheer(); say('You win!'); Arcade.confetti(90); }
      endTimer = 2.2;
    }
    // the camera: you, or (once you're out) whoever has the most hearts
    if (!cars.includes(player) && cars.length) {
      const lead = cars.slice().sort((a, b) => b.hearts - a.hearts)[0];
      camX += (lead.x - W / 2 - camX) * Math.min(1, dt * 2); camY += (lead.y - H / 2 - camY) * Math.min(1, dt * 2);
    } else follow(dt);
    // engine sound
    if (++engineTick % 4 === 0 && cars.includes(player) && !battleOver) {
      if (!engine.n) engine.start();
      const gas = g.input.down('ArrowUp', 'KeyW') || autopilot || g.little || g.oneThumb;
      engine.set(Math.hypot(player.vx, player.vy), gas, 0, player.boost > 0);
      g.music.mood({ energy: player.boost > 0 || player.star > 0 || ring.r < 700 ? 2 : 1 });
    }
    if (endTimer > 0 && (endTimer -= dt) <= 0) { engine.stop(); battleFinish(g); }
  }

  // The order at the end: cars still driving (most hearts first; a tie goes to you),
  // then everyone who poofed (the last one out is the highest).
  function battleOrder() {
    const still = cars.slice().sort((a, b) => (b.hearts - a.hearts) || (b.isPlayer - a.isPlayer));
    return still.concat(outCars.slice().reverse());
  }
  function battleFinish(g) {
    const order = battleOrder(), place = order.indexOf(player) + 1;
    const d = g.save.data;
    d.battles = (d.battles || 0) + 1;
    if (place === 1) {
      d.battleWins = (d.battleWins || 0) + 1;
      d.battleWon = Object.assign({}, d.battleWon, { [T.def.id]: true });
      // the first win in each arena: a house coin
      if (!(d.battleCoin || {})[T.def.id]) { d.battleCoin = Object.assign({}, d.battleCoin, { [T.def.id]: true }); const st = Arcade.store.load(); st.houseBonus = (st.houseBonus || 0) + 1; }
    }
    g.store();
    checkSpecials(g);   // (a Heart Battle win unlocks the Firework Party)
    // on each car's step: the hearts it had left (a sparkle = it poofed)
    const left = (c) => `<span class="rc-hb-badge">${c.hearts > 0 ? heartSVG(1) + c.hearts : '✨'}</span>`;
    g.finish({
      win: place === 1, medal: ['gold', 'silver', 'bronze'][place - 1] || null, stars: [3, 2, 1][place - 1] || 0,
      title: ['You won!', 'Super battle!', 'Well done!'][place - 1] || 'Nice try!', ...(CANVAS ? { rowsTop: true, starsRow: false, rows: raceRows(g, order, 0, 0, 0, heartBadge) } : { lines: [raceHTML(g, order, 0, 0, 0, left)] }), delay: 300,
      buttons: [
        { icon: icons.again, label: 'Again', cls: 'big', onClick: () => g.play({ id: T.def.id, name: T.def.name }) },
        { icon: icons.menu, label: 'Menu', cls: 'blue', onClick: () => battleMenu(g) },
      ],
    });
  }
  // a little row of hearts (for the results)
  const heartSVG = (n) => `<svg viewBox="0 0 ${n * 26} 24" style="height:22px;width:${n * 22}px">` +
    Array.from({ length: n }, (_, i) => `<path transform="translate(${i * 26} 0)" d="M12 22 C2 14 0 9 0 6 C0 2 3 0 6 0 C9 0 11 2 12 4 C13 2 15 0 18 0 C21 0 24 2 24 6 C24 9 22 14 12 22 Z" fill="#ef476f" stroke="#2b2b2b" stroke-width="2.5"/>`).join('') + '</svg>';

  // A heart shape on the canvas
  function drawHeart(ctx, x, y, s, fill, line = 3) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.2, y + s * 0.1, x - s * 1.1, y - s * 0.9, x - s * 0.5, y - s * 0.9);
    ctx.bezierCurveTo(x - s * 0.2, y - s * 0.9, x, y - s * 0.6, x, y - s * 0.4);
    ctx.bezierCurveTo(x, y - s * 0.6, x + s * 0.2, y - s * 0.9, x + s * 0.5, y - s * 0.9);
    ctx.bezierCurveTo(x + s * 1.1, y - s * 0.9, x + s * 1.2, y + s * 0.1, x, y + s * 0.9);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    if (line) { ctx.lineWidth = line; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke(); }
  }
  // the hearts floating over a car (empty ones are pale)
  function drawCarHearts(ctx, c, time) {
    const n = c.maxHearts, s = 8, gap = 19, x0 = c.x - (n - 1) * gap / 2, y = c.y - (c.isPlayer ? 64 : 48);
    for (let i = 0; i < n; i++) drawHeart(ctx, x0 + i * gap, y + (i < c.hearts ? Math.sin(time * 4 + i) * 1.5 : 0), s, i < c.hearts ? '#ef476f' : 'rgba(255,255,255,0.55)', 2.5);
  }
  // The arena's extras: the shade + flowers of the ring, bumpers, the heart to pick up
  function drawArena(ctx, time, vis) {
    // the floor: painted rings and a big heart in the middle (like a sports hall floor)
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 16;
    for (const r of [320, 620, 920]) { ctx.beginPath(); ctx.arc(ARENA_C, ARENA_C, r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.setLineDash([30, 40]); ctx.lineWidth = 8;
    for (const r of [470, 770]) { ctx.beginPath(); ctx.arc(ARENA_C, ARENA_C, r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.25; drawHeart(ctx, ARENA_C, ARENA_C + 10, 120, theme.curb, 0); ctx.globalAlpha = 1;
    ctx.restore();
    // outside the ring: a soft shade (you can't drive there any more)
    ctx.save();
    ctx.beginPath(); ctx.rect(ARENA_C - 3000, ARENA_C - 3000, 6000, 6000); ctx.arc(ARENA_C, ARENA_C, ring.r, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(40,20,60,0.22)'; ctx.fill('evenodd');
    ctx.restore();
    // the fence: flowers (or snowballs, or gumdrops) all the way round
    const n = Math.max(24, Math.round(ring.r * Math.PI * 2 / 62)), kind = T.def.fence;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, x = ARENA_C + Math.cos(a) * (ring.r + 16), y = ARENA_C + Math.sin(a) * (ring.r + 16);
      if (!vis(x, y, 40)) continue;
      if (kind === 'snow') { D.circle(ctx, x, y, 19, '#ffffff', 4); D.circle(ctx, x - 5, y - 5, 5, '#dbeeff', 0); }
      else if (kind === 'gum') { const col = ['#ef476f', '#06d6a0', '#ffd166', '#9b5de5'][i % 4]; ctx.beginPath(); ctx.arc(x, y + 6, 18, Math.PI, 0); ctx.lineTo(x + 18, y + 10); ctx.lineTo(x - 18, y + 10); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); D.circle(ctx, x - 6, y - 2, 3.5, '#ffffff', 0); }
      else {
        const col = ['#ffffff', '#ffd166', '#f15bb5', '#9b5de5'][i % 4];
        for (let p = 0; p < 5; p++) { const pa = a + p * 1.2566 + time * 0.3; D.circle(ctx, x + Math.cos(pa) * 10, y + Math.sin(pa) * 10, 9, col, 3); }
        D.circle(ctx, x, y, 7, '#ffb703', 3);
      }
    }
    // bumpers: big round bouncy things (they squash a little when hit)
    for (const b of bumpers) if (vis(b.x, b.y, 80)) drawBumper(ctx, b);
    // the heart to pick up: big, bobbing, with a soft glow
    if (heartPick && vis(heartPick.x, heartPick.y)) {
      const bob = Math.sin(time * 4) * 5, k = Math.min(1, heartPick.t * 3);
      ctx.fillStyle = 'rgba(255,143,171,0.35)'; ctx.beginPath(); ctx.arc(heartPick.x, heartPick.y, 36 + Math.sin(time * 6) * 4, 0, 7); ctx.fill();
      drawHeart(ctx, heartPick.x, heartPick.y - 4 + bob, 22 * k, '#ef476f', 4);
      D.circle(ctx, heartPick.x - 8, heartPick.y - 12 + bob, 4, '#ffffff', 0);
    }
  }
  // The battle HUD: your hearts (top left), the item slot (top middle),
  // a little round map with every car (top right), and arrows to cars off the screen.
  function drawBattleHUD(g, ctx) {
    const me = cars.includes(player);
    for (let i = 0; i < player.maxHearts; i++) drawHeart(ctx, 122 + i * 40, 40, 16 * g.juice.size('hearts'), i < player.hearts ? '#ef476f' : 'rgba(255,255,255,0.6)', 4);
    drawItemSlot(g, ctx);
    // the round map
    const mx = W - 92, my = 160, mr = 76, sc = mr / (ring.r0 + 40);
    D.circle(ctx, mx, my, mr + 6, 'rgba(255,255,255,0.75)', 4);
    D.circle(ctx, mx, my, ring.r * sc, theme.road, 3);
    for (const b of bumpers) D.circle(ctx, mx + (b.x - ARENA_C) * sc, my + (b.y - ARENA_C) * sc, 5, theme.curb, 2);
    if (heartPick) drawHeart(ctx, mx + (heartPick.x - ARENA_C) * sc, my + (heartPick.y - ARENA_C) * sc, 6, '#ef476f', 2);
    for (const c of cars.slice().sort((a, b) => a.isPlayer - b.isPlayer)) D.circle(ctx, mx + (c.x - ARENA_C) * sc, my + (c.y - ARENA_C) * sc, c.isPlayer ? 8 : 6, c.color, c.isPlayer ? 3 : 2);
    // who's still in: one car dot each, poofed ones are a sparkle
    const all = [player].concat(cars.filter(c => !c.isPlayer), outCars.filter(c => !c.isPlayer));
    all.forEach((c, i) => {
      const x = W - 160 + i * 44, y = 274;
      if (cars.includes(c)) { D.circle(ctx, x, y, c.isPlayer ? 17 : 14, c.color, 3); D.text(ctx, String(c.hearts), x, y + 1, { size: 17 }); }
      else { D.circle(ctx, x, y, 14, 'rgba(255,255,255,0.4)', 3); D.star(ctx, x, y, 9, '#ffd166', 2); }
    });
    // the closest rival off the screen? an arrow in its color points the way
    if (me && raceTime > 1) {
      let best = null, bd = Infinity;
      for (const c of cars) if (c !== player) { const d = Math.hypot(c.x - player.x, c.y - player.y); if (d < bd) { bd = d; best = c; } }
      if (best) edgeArrow(ctx, best.x, best.y, best.color, 'car', g.time);
      if (heartPick && player.hearts < player.maxHearts) edgeArrow(ctx, heartPick.x, heartPick.y, '#ff8fab', 'dot', g.time);
    }
    // the ring is moving in: little arrows pointing inward round the screen edge
    if (ring.r > BATTLE.ringMin && raceTime > BATTLE.ringStart && raceTime < BATTLE.ringStart + 3 && Math.floor(g.time * 4) % 2) D.text(ctx, '→ ←', W / 2, 110, { size: 40, color: '#f15bb5' });
  }

  // ---------------------------------------------------------------
  // Coin Rush + Follow the Leader (Nov 20, Keith's RC plan: "new ways to play")
  // Both are just you in a maxed car on a normal track, sunny, no gift boxes.
  //
  // COIN RUSH (mode 'rush', levels 'cr-<track>'): grab as many coins as you can
  // before the clock runs out. Wavy rows of coins all round the lap, a big coin
  // (5) now and then on the edge of the road, and clocks that add time. Picked-up
  // coins come back after a while. Medals for RUSH_GOAL[track] coins.
  //
  // FOLLOW THE LEADER (mode 'follow', levels 'fl-<track>'): Pip drives 2 laps,
  // weaving left and right, and leaves a trail of music notes. Stay close and
  // drive through the notes before they fade! Pip waits for you if you fall far
  // behind (gentle). Stars for how many notes you caught.
  // ---------------------------------------------------------------
  const RUSH = { time: 60, littleTime: 90, every: 330, clocks: [0.35, 0.85], clockAdd: 5, back: 9, clockBack: 40, reach: 34, littleReach: 50 };
  // coins for gold on each track (measured Nov 20: the test autopilot, a good driver that keeps to
  // the middle of the road, gets about 1.4x this). Silver = 60%, bronze = 30% of it.
  // Little kids get 90 seconds and grab coins from further away, so their goals are higher (a car that only drives itself still gets about silver).
  const RUSH_GOLD = { t1: 155, t2: 200, t3: 200, t4: 155, t5: 190, t6: 155, t7: 200, t8: 235, t9: 180, t10: 155 };
  const rushGoal = (g, id) => { const gold = (RUSH_GOLD[id] || 180) * (g.little ? 1.5 : 1); return [0.3, 0.6, 1].map(k => Math.round(gold * k / 5) * 5); };
  let rush = null;
  function rushStart(g) {
    rush = null;
    if (mode !== 'rush') return;
    trackCoins = []; driveStars = [];
    rush = { left: g.little ? RUSH.littleTime : RUSH.time, got: 0, coins: [], tick: 99, streak: 0, streakT: 0, clocks: 0 };
    const rows = Math.floor((T.L - 300) / RUSH.every);
    const clockRows = RUSH.clocks.map(f => Math.round(f * rows));         // 2 clocks a lap
    for (let k = 0; k < rows; k++) {
      const s0 = 300 + k * RUSH.every, ph = k * 1.7;
      if (nearCross(s0, 260)) continue;                                // (not where the road crosses itself)
      const up = heightAt(s0) > 0.5;
      const at = (s, lat) => { const p = pointAt(T.main, s % T.L); return { x: p.x - p.ty * lat, y: p.y + p.tx * lat }; };
      if (clockRows.includes(k)) {                                        // a clock: more time!
        rush.coins.push(Object.assign(at(s0, 0), { kind: 'clock', value: 0, t: 0, up, spin: k }));
      } else if (k % 4 === 1) {                                           // a big coin out near the edge
        rush.coins.push(Object.assign(at(s0, (k % 8 === 1 ? 1 : -1) * 0.6 * T.hw), { kind: 'big', value: 5, t: 0, up, spin: k }));
      } else for (let j = 0; j < 5; j++) {                                // a wavy row of 5 coins
        const lat = Math.sin(ph + j * 0.7) * 0.5 * T.hw;
        rush.coins.push(Object.assign(at(s0 + j * 40, lat), { kind: 'coin', value: 1, t: 0, up: heightAt((s0 + j * 40) % T.L) > 0.5, spin: j * 0.6 }));
      }
    }
  }
  // every frame: pick up coins, run the clock
  function rushTick(g, dt) {
    if (!rush) return;
    for (const cn of rush.coins) cn.t = Math.max(0, cn.t - dt);
    rush.streakT -= dt; if (rush.streakT <= 0) rush.streak = 0;
    const c = player;
    if (c.finished) return;
    const reach = g.little ? RUSH.littleReach : RUSH.reach;
    for (const cn of rush.coins) {
      if (cn.t > 0 || cn.up !== (c.h > 0.5) || Math.hypot(c.x - cn.x, c.y - cn.y) > reach + (cn.kind === 'coin' ? 0 : 12)) continue;
      if (cn.kind === 'clock') {
        cn.t = RUSH.clockBack; rush.left += RUSH.clockAdd; rush.clocks++;
        popup('+' + RUSH.clockAdd, cn.x, cn.y - 50, '#06d6a0', 40);
        g.tone(520, 0.12, { type: 'triangle', vol: 0.2, slide: 1040 }); g.sfx('star');
        fx.burst(cn.x, cn.y, { count: 14, colors: ['#06d6a0', '#fff'], speed: 200, gravity: 0, size: 10, life: 0.6 });
        continue;
      }
      cn.t = RUSH.back;
      rush.got += cn.value; rush.streak++; rush.streakT = 0.9;
      g.juice.pop('rush', cn.kind === 'big' ? 0.5 : 0.3);
      g.tone(880 * Math.pow(1.06, Math.min(12, rush.streak)), 0.09, { type: 'square', vol: 0.12 });
      fx.burst(cn.x, cn.y, { count: cn.kind === 'big' ? 16 : 6, colors: ['#ffc93c', '#fff'], speed: 140, gravity: 0, size: 8, life: 0.45 });
      if (cn.kind === 'big') { popup('+5', cn.x, cn.y - 50, '#ffc93c', 40); g.sfx('star'); }
      if (rush.streak === 5) popup('All 5!', c.x, c.y - 60, '#ffc93c', 32);
    }
    rush.left -= dt;
    // the last 5 seconds: a tick each second
    const sec = Math.ceil(rush.left);
    if (sec <= 5 && sec >= 1 && sec !== rush.tick) { rush.tick = sec; g.tone(sec === 1 ? 990 : 660, 0.08, { type: 'square', vol: 0.15 }); }
    if (rush.left <= 0) {                                                // time's up!
      rush.left = 0;
      c.finished = true; c.finishTime = Math.round(raceTime * 100) / 100;
      finishOrder.push(c);
      g.sfx('win'); say("Time's up!");
      if (rush.got >= rushGoal(g, T.def.id)[2]) { cheer(); Arcade.confetti(80); }
      engine.stop(); endTimer = 2.2;
    }
  }
  function drawRushCoins(ctx, time, vis) {
    if (!rush) return;
    for (const cn of rush.coins) if (cn.t <= 0 && vis(cn.x, cn.y)) {
      if (cn.kind === 'clock') {                    // a green stopwatch, bobbing
        const bob = Math.sin(time * 3 + cn.spin) * 4;
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(cn.x + 4, cn.y + 18, 18, 7, 0, 0, 7); ctx.fill();
        D.box(ctx, cn.x - 7, cn.y - 32 + bob, 14, 9, 3, '#ef476f', 3);
        D.circle(ctx, cn.x, cn.y - 4 + bob, 22, '#ffffff', 4);
        D.circle(ctx, cn.x, cn.y - 4 + bob, 16, '#b9fbc0', 0);
        ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.lineCap = 'round';
        const a = time * 3;
        ctx.beginPath(); ctx.moveTo(cn.x, cn.y - 4 + bob); ctx.lineTo(cn.x + Math.cos(a) * 12, cn.y - 4 + bob + Math.sin(a) * 12); ctx.stroke();
        continue;
      }
      const r = cn.kind === 'big' ? 20 : 11;
      const sq = Math.abs(Math.cos(time * 4 + cn.spin));          // spinning: gets thin and fat
      ctx.beginPath(); ctx.ellipse(cn.x, cn.y, r * Math.max(0.2, sq), r, 0, 0, 7);
      ctx.fillStyle = '#ffc93c'; ctx.fill(); ctx.lineWidth = cn.kind === 'big' ? 4 : 3; ctx.strokeStyle = INK; ctx.stroke();
      if (sq > 0.5) {
        if (cn.kind === 'big') D.star(ctx, cn.x, cn.y, 8 * sq, '#fff3b0', 2);
        else { ctx.beginPath(); ctx.ellipse(cn.x, cn.y, 5 * sq, 5.5, 0, 0, 7); ctx.lineWidth = 2; ctx.strokeStyle = '#e09f3e'; ctx.stroke(); }
      }
    }
  }
  // a little stopwatch (HUD + menus)
  function drawWatch(ctx, x, y, r, fill) {
    D.box(ctx, x - r * 0.3, y - r * 1.45, r * 0.6, r * 0.42, 3, '#ef476f', 3);
    D.circle(ctx, x, y, r, fill, 4);
    ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - r * 0.6); ctx.moveTo(x, y); ctx.lineTo(x + r * 0.45, y + r * 0.3); ctx.stroke();
  }
  function drawRushHUD(g, ctx) {
    const left = Math.ceil(rush.left), hurry = rush.left < 10 && !player.finished;
    // the clock (top left, right of the home button): flashes red in the last 10 seconds
    const flash = hurry && Math.floor(g.time * 4) % 2;
    D.box(ctx, 96, 12, 150, 64, 20, flash ? '#ef476f' : 'rgba(255,255,255,0.75)', 4);
    drawWatch(ctx, 130, 48, 18, hurry ? '#ffd6e0' : '#ffffff');
    D.text(ctx, String(left), 196, 46, { size: 36 });
    // your coins (middle)
    D.box(ctx, W / 2 - 92, 12, 184, 64, 20, 'rgba(255,255,255,0.75)', 4);
    D.circle(ctx, W / 2 - 52, 44, 20, '#ffc93c', 4);
    D.text(ctx, String(rush.got), W / 2 + 24, 46, { size: 36 * g.juice.size('rush') });
    // the 3 goals as little stars under it (lit up once reached)
    const goal = rushGoal(g, T.def.id);
    goal.forEach((n, i) => D.star(ctx, W / 2 - 30 + i * 30, 94, 12, rush.got >= n ? '#ffd166' : 'rgba(255,255,255,0.5)', 3));
    drawMinimap(ctx);
  }

  // ---- Follow the Leader ----
  const FOLLOW = {
    laps: 2,
    pace: { big: { top: 0.74, corner: 0.76, accel: 320 }, little: { top: 0.52, corner: 0.64, accel: 220 } },
    weave: 0.42, littleWeave: 0.3,   // how far Pip weaves left and right (x the half road width)
    drop: 0.4,            // a note every 0.4 s
    life: 4.5, littleLife: 7,     // how long a note stays before it fades away
    reach: 40, littleReach: 56,
    wait: [450, 900],     // Pip slows down when you're this far behind, and waits at the far end
    patience: 20,         // ...but only for 20 seconds in all (so a round always ends)
    stars: { big: [0.3, 0.6, 0.85], little: [0.15, 0.4, 0.65] },   // part of the notes for 1, 2, 3 stars
  };
  const PIP_COLOR = '#06d6a0';
  const NOTE_COLORS = ['#f15bb5', '#9b5de5', '#00bbf9', '#ff8c42', '#ef476f'];
  let lead = null;
  function followStart(g) {
    lead = null;
    if (mode !== 'follow') return;
    driveStars = []; trackCoins = [];
    const start = T.L + 60, goal = (FOLLOW.laps + 1) * T.L;
    // weave in gentle S-bends (but drive straight for the first bit, so you can catch up)
    const latAt = (along) => (g.little ? FOLLOW.littleWeave : FOLLOW.weave) * T.hw * Math.sin(along / 520) * Math.min(1, Math.max(0, (along - 300) / 400));
    lead = { plan: planRun(FOLLOW.pace[g.little ? 'little' : 'big'], start, goal, latAt), t: 0, notes: [], dropped: 0, got: 0, dropT: 0, done: false, rate: 1, said: 0, waited: 0 };
  }
  const pipAt = () => planAt(lead.plan, lead.t);
  function followTick(g, dt) {
    if (!lead) return;
    const c = player;
    for (const n of lead.notes) n.life -= dt;
    lead.notes = lead.notes.filter(n => n.life > 0 && !n.got);
    if (lead.done) return;
    // Pip slows down (and at last waits) when you're far behind
    const pip = pipAt(), gap = pip.p - c.progress;
    let want = math.clamp(1 - (gap - FOLLOW.wait[0]) / (FOLLOW.wait[1] - FOLLOW.wait[0]), 0, 1);
    if (want < 1) lead.waited += dt * (1 - want);
    if (lead.waited > FOLLOW.patience) want = 1;
    lead.rate += (want - lead.rate) * Math.min(1, dt * 3);
    lead.t += dt * lead.rate;
    if (want < 0.3 && raceTime - lead.said > 5) { lead.said = raceTime; popup('Over here!', pip.x, pip.y - 70, PIP_COLOR, 30); g.tone(780, 0.1, { type: 'triangle', vol: 0.15 }); g.tone(980, 0.12, { type: 'triangle', vol: 0.15, delay: 0.12 }); }
    // drop a note behind Pip (only while Pip is moving)
    lead.dropT += dt * lead.rate;
    if (lead.dropT >= FOLLOW.drop && pip.p < (FOLLOW.laps + 1) * T.L - 40) {
      lead.dropT = 0;
      const behind = planAt(lead.plan, lead.t - 0.15);
      const s = ((behind.p % T.L) + T.L) % T.L;
      lead.notes.push({ x: behind.x, y: behind.y, p: behind.p, up: heightAt(s) > 0.5, life: g.little ? FOLLOW.littleLife : FOLLOW.life, got: false, k: lead.dropped });
      lead.dropped++;
    }
    // catch notes
    const reach = g.little ? FOLLOW.littleReach : FOLLOW.reach;
    if (!c.finished) for (const n of lead.notes) {
      if (n.got || n.up !== (c.h > 0.5) || Math.hypot(c.x - n.x, c.y - n.y) > reach) continue;
      n.got = true; lead.got++;
      // each note plays the next step up a happy scale
      const step = [0, 2, 4, 5, 7, 9, 11, 12][lead.got % 8];
      g.tone(523 * Math.pow(2, step / 12), 0.14, { type: 'triangle', vol: 0.18 });
      fx.burst(n.x, n.y, { count: 6, colors: [NOTE_COLORS[n.k % 5], '#fff'], speed: 120, gravity: 0, size: 8, life: 0.45 });
    }
    // Pip crossed the finish line after the last lap: the end
    if (lead.t >= lead.plan.t) {
      lead.done = true;
      c.finished = true; c.finishTime = Math.round(raceTime * 100) / 100;
      finishOrder.push(c);
      const st = followStars(g);
      say(st >= 3 ? 'Super following!' : st >= 1 ? 'Well done!' : 'Nice try!');
      g.sfx(st >= 1 ? 'win' : 'click');
      if (st >= 3) { cheer(); Arcade.confetti(80); }
      engine.stop(); endTimer = 2.2;
    }
  }
  // test-only: a robot kid that follows Pip (steers through the next note, keeps a little way behind)
  function followPilot(c) {
    const pip = pipAt();
    const next = lead.notes.filter(n => !n.got && n.p > c.progress + 25).sort((a, b) => a.p - b.p)[0] || pip;
    const steer = math.clamp(math.angleDiff(c.a, Math.atan2(next.y - c.y, next.x - c.x)) * 2.5, -1, 1);
    const gap = pip.p - c.progress;
    return { gas: gap > 170, brake: gap < 90, steer };
  }
  const followPart = () => lead && lead.dropped ? lead.got / lead.dropped : 0;
  function followStars(g) { const need = FOLLOW.stars[g.little ? 'little' : 'big'], p = followPart(); return need.filter(n => p >= n).length; }
  // a music note: a round head, a stem and a little flag
  function drawNote(ctx, x, y, s, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(5, 4); ctx.lineTo(5, -22); ctx.quadraticCurveTo(14, -16, 15, -8); ctx.quadraticCurveTo(12, -14, 5, -15); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-1, 5, 8, 6, -0.4, 0, 7); ctx.fillStyle = color; ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function drawFollow(ctx, time, vis) {
    if (!lead) return;
    for (const n of lead.notes) if (vis(n.x, n.y)) {
      const fade = Math.min(1, n.life / 1.2);              // fades away at the end
      ctx.save(); ctx.globalAlpha = fade;
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(n.x + 3, n.y + 14, 13, 5, 0, 0, 7); ctx.fill();
      drawNote(ctx, n.x, n.y - 2 + Math.sin(time * 5 + n.k) * 3, 1.25, NOTE_COLORS[n.k % 5]);
      ctx.restore();
    }
    // Pip: a green car with a flag on a stick, and a dashed "stay close" ring
    const p = pipAt();
    if (!vis(p.x, p.y, 200)) return;
    const near = Math.hypot(player.x - p.x, player.y - p.y) < 200;
    ctx.save(); ctx.setLineDash([12, 12]); ctx.lineDashOffset = -time * 30; ctx.lineWidth = 5;
    ctx.strokeStyle = near ? 'rgba(255,209,102,0.9)' : 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.arc(p.x, p.y, 120, 0, 7); ctx.stroke(); ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(p.x + 4, p.y + 6, 28, 20, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); drawCarShape(ctx, PIP_COLOR, {}); ctx.restore();
    // the flag waves
    const fx0 = p.x, fy0 = p.y - 20, wave = Math.sin(time * 8) * 4;
    ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(fx0, fy0); ctx.lineTo(fx0, fy0 - 46); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fx0, fy0 - 46); ctx.quadraticCurveTo(fx0 + 16, fy0 - 44 + wave, fx0 + 30, fy0 - 38); ctx.lineTo(fx0, fy0 - 28); ctx.closePath();
    ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    if (!lead.done && lead.t < 2.5) D.text(ctx, 'Follow me!', p.x, p.y - 92, { size: 28, color: '#ffffff' });
  }
  function drawFollowHUD(g, ctx) {
    // notes caught (middle), with 3 stars under it that light up as you go
    D.box(ctx, W / 2 - 92, 12, 184, 64, 20, 'rgba(255,255,255,0.75)', 4);
    drawNote(ctx, W / 2 - 54, 50, 1.3, '#f15bb5');
    D.text(ctx, String(lead.got), W / 2 + 24, 46, { size: 36 });
    const need = FOLLOW.stars[g.little ? 'little' : 'big'], part = followPart();
    need.forEach((n, i) => D.star(ctx, W / 2 - 30 + i * 30, 94, 12, lead.dropped > 4 && part >= n ? '#ffd166' : 'rgba(255,255,255,0.5)', 3));
    // how far Pip still has to go: a flag + lap dots
    const p = pipAt(), lapNow = Math.min(FOLLOW.laps, Math.max(1, Math.floor(p.p / T.L)));
    drawFlag(ctx, 104, 18);
    D.text(ctx, lapNow + '/' + FOLLOW.laps, 146, 36, { size: 34, align: 'left' });
    drawMinimap(ctx);
    if (!player.finished) edgeArrow(ctx, p.x, p.y, PIP_COLOR, 'car', g.time);
  }
  // results for both
  function rushFinish(g) {
    const d = g.save.data, id = T.def.id, goal = rushGoal(g, id), n = rush.got;
    const stars = goal.filter(k => n >= k).length;
    const best = (d.rushBest || {})[id] || 0, record = n > best;
    if (record) d.rushBest = Object.assign({}, d.rushBest, { [id]: n });
    // the first gold on each track: a house coin
    let house = false;
    if (stars === 3 && !(d.rushGold || {})[id]) { d.rushGold = Object.assign({}, d.rushGold, { [id]: true }); const st = Arcade.store.load(); st.houseBonus = (st.houseBonus || 0) + 1; house = true; }
    g.store();
    if (house) g.toast('+1 house coin!', '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19" fill="#ffc93c" stroke="#2b2b2b" stroke-width="4"/></svg>');
    g.finish({
      win: stars > 0, medal: ['bronze', 'silver', 'gold'][stars - 1] || null, stars,
      title: stars === 3 ? 'Coin champ!' : stars ? (record && best ? 'New best!' : 'Well done!') : 'Nice try!', delay: 300,
      lines: [`<div class="rc-coins" style="font-size:46px">${coinSVG(46)} ${n}</div>`,
        best && !record ? `Best: <b>${best}</b>` : ''],
      buttons: [
        { icon: icons.again, label: 'Again', cls: 'big', onClick: () => g.play({ id: 'cr-' + id, name: T.def.name }) },
        { icon: icons.menu, label: 'Menu', cls: 'blue', onClick: () => playMenu(g, 'rush') },
      ],
    });
  }
  function followFinish(g) {
    const d = g.save.data, id = T.def.id, stars = followStars(g), part = followPart();
    const best = (d.followBest || {})[id] || 0, record = part > best;
    if (record) d.followBest = Object.assign({}, d.followBest, { [id]: Math.round(part * 100) / 100 });
    let house = false;
    if (stars === 3 && !(d.followGold || {})[id]) { d.followGold = Object.assign({}, d.followGold, { [id]: true }); const st = Arcade.store.load(); st.houseBonus = (st.houseBonus || 0) + 1; house = true; }
    g.store();
    if (house) g.toast('+1 house coin!', '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19" fill="#ffc93c" stroke="#2b2b2b" stroke-width="4"/></svg>');
    g.finish({
      win: stars > 0, medal: ['bronze', 'silver', 'gold'][stars - 1] || null, stars,
      title: stars === 3 ? 'Super following!' : stars ? 'Well done!' : 'Nice try!', delay: 300,
      lines: [`<div class="rc-coins" style="font-size:46px;color:#f15bb5">${NOTE_PIC.replace('<svg', '<svg style="width:50px;height:50px"')} ${lead.got} / ${lead.dropped}</div>`],
      buttons: [
        { icon: icons.again, label: 'Again', cls: 'big', onClick: () => g.play({ id: 'fl-' + id, name: T.def.name }) },
        { icon: icons.menu, label: 'Menu', cls: 'blue', onClick: () => playMenu(g, 'follow') },
      ],
    });
  }

  // ---------------------------------------------------------------
  // Update (dt = 1/120 s)
  // ---------------------------------------------------------------
  function update(g, dt) {
    gRef = g;
    // photo finish: everything runs in slow motion for a moment
    if (slowmo > 0) { slowmo -= dt; dt *= 0.3; }
    const inp = kid.on ? kidPad : g.input;     // (the playtest robot has its own pretend fingers)
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
        if (g.demo && !player.item) player.item = mode === 'battle' ? 'bubble' : 'boost';   // ("Show me": a gift to show off)
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
    if (mode === 'battle') { battleTick(g, dt); return; }    // Heart Battle has its own rules (see above)
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
        if (kid.on) kidThink(g, c, dt);          // (the playtest robot: a pretend child presses the buttons)
        const left = inp.down('ArrowLeft', 'KeyA'), right = inp.down('ArrowRight', 'KeyD');
        const brake = inp.down('ArrowDown', 'KeyS');
        // (little kids: the car drives itself forward, they only steer; brake still works)
        // (it eases off before sharp bends, like a grown-up holding the back of the seat)
        const help = g.little || g.oneThumb;        // (one thumb, Nov 23: the same help, and no gas / brake / item buttons)
        // (Playtest, Nov 23: the self-driving car ran wide on nearly every bend, even with hands off: it only
        //  looked at the next 90 units and the helper below only kept it POINTING along the road, so it drifted to
        //  the edge and only came back once it was on the grass. Now it eases off for the bends coming up and steers
        //  for the middle of the road a little way ahead, like the rival cars do.)
        const sp = Math.hypot(c.vx, c.vy);
        const easeOff = help && (!c.onShort && sp > Math.min(vlimAt(T.main, c.s + 40), vlimAt(T.main, c.s + 110), vlimAt(T.main, c.s + 180)) ||
          lead && !lead.done && pipAt().p - c.progress < 150);      // (Follow the Leader: stay behind Pip)
        const gas = inp.down('ArrowUp', 'KeyW') || (help && !brake && !easeOff);
        let steer = (right ? 1 : 0) - (left ? 1 : 0);
        const onS = c.onShort && c.nearShort, n = onS ? c.nearShort : c.near, PP = onS ? T.short : T.main, hwN = onS ? T.shw : T.hw;
        // where the middle of the road is, a little way ahead (further when going fast)
        const aimAt = (k) => { const p = pointAt(PP, n.s + 70 + sp * 0.4); return math.clamp(math.angleDiff(c.a, Math.atan2(p.y - c.y, p.x - c.x)) * k, -1, 1); };
        if (help && n) {
          // Little kids + one thumb: the car steers itself along the middle of the road.
          // A press still steers, except near the edge when it would take the car off the road (children
          // often press the wrong way when the car drives down the screen): then the helper wins.
          const auto = aimAt(2.4);
          if (!steer) steer = auto;
          else if (n.dist > hwN * 0.6 && Math.sign(steer) !== Math.sign(auto) && Math.abs(auto) > 0.15) steer = auto;
        } else if (!steer && c.surface === 'road') {
          // a gentle helping hand keeps the car pointing along the road (and, near the edge, back toward the middle)
          const d = math.angleDiff(c.a, Math.atan2(T.main.ty[c.near.i], T.main.tx[c.near.i]));
          if (Math.abs(d) < 1.2) steer = math.clamp(d * 0.5, -0.2, 0.2);
          if (n && n.dist > hwN * 0.65) steer = math.clamp(aimAt(1.2), -0.3, 0.3);
        }
        // Smooth steering: the wheel turns in quickly but not all at once, so a
        // short tap is a small nudge and holding the button is a full turn.
        // Letting go (or switching sides) straightens up twice as fast.
        const sIn = c.steerIn || 0;
        const rate = (steer && Math.sign(steer) === Math.sign(sIn) && Math.abs(steer) > Math.abs(sIn)) || !sIn ? 7 : 14;
        c.steerIn = sIn + math.clamp(steer - sIn, -rate * dt, rate * dt);
        ctl = { gas, brake, steer: c.steerIn };
        driftTick(g, c, ctl, dt);
        if (inp.hit('Space', 'Enter', 'KeyX') || thumbItem(g, c, dt)) useItem(g, c);
      } else {
        if (c.drift) c.drift.on = false;
        if (c.isPlayer && !c.ai) c.ai = { lane: 0, laneTarget: 0, laneT: 0, mode: 'main', decided: -1, stuck: 0, reverse: 0, stuckCount: 0, offRoad: 0, wobble: 0, wobbleT: 0, holdT: 0, skill: { top: 1, corner: 0.88 + 0.02 * upLevel(wallet, 'tires'), oops: 0, shortcut: 0.6 } };  // (test autopilot: better tires = faster corners)
        ctl = c.isPlayer && mode === 'follow' && lead && !c.finished ? followPilot(c) : aiControl(g, c, dt, c.isPlayer);
        if (c.isPlayer && c.finished) { ctl.gas = (c.vF || 0) < 150; ctl.brake = (c.vF || 0) > 220; }
        if (c.isPlayer && party && party.won && party.t > 0.5) { ctl.gas = (c.vF || 0) < 210; ctl.brake = false; ctl.steer = 1; }   // a happy donut!
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
      c.mega = Math.max(0, (c.mega || 0) - dt); c.frozen = Math.max(0, (c.frozen || 0) - dt);
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
          squashCar(g, c, 0.38);
          if (c.isPlayer) { Arcade.audio.noise(0.2, { freq: 400, vol: 0.35 }); g.sfx('thud'); g.juice.dust(c.x, c.y, { to: fx, count: 7, colors: theme.dust, size: 20 }); }
          if (hasPerk(c, 'jump')) { c.boost = Math.max(c.boost, 0.6); if (c.isPlayer) { popup('Quack!', c.x, c.y - 50, '#ffd166'); perkSound('quack'); } }
        }
      }
      locate(c);
      walls(g, c);
      bounceBumpers(g, c);
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
          if (!hasPerk(c, 'splash') && !hasPerk(c, 'phase') && c.shield <= 0) { c.vx *= 0.65; c.vy *= 0.65; }
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
          squashCar(g, c, -0.28);
        } else if (Math.hypot(c.vx, c.vy) > 200 && !(c.air > 0)) {
          c.air = c.airMax = hasPerk(c, 'jump') ? 0.95 : 0.6;
          squashCar(g, c, -0.25);
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
        g.juice.sparkle(cn.x, cn.y, { to: fx, count: 6, size: 8 });
        if (coinStreak === 6) { popup('All 6!', c.x, c.y - 60, '#ffc93c', 32); addFeat(g, f => { f.all6 = true; }); }
      }

      // ---- Free Drive stars ----
      if (c.isPlayer && mode === 'drive' && !c.finished) for (const st of driveStars) {
        if (st.got || st.up !== (c.h > 0.5) || Math.hypot(c.x - st.x, c.y - st.y) > 40) continue;
        st.got = true; starsGot++;
        g.tone(660 * Math.pow(1.06, starsGot), 0.14, { type: 'triangle', vol: 0.2, slide: 990 * Math.pow(1.06, starsGot) });
        g.sfx('star');
        g.juice.sparkle(st.x, st.y, { to: fx, count: 16, size: 13 }); g.juice.pop('stars', 0.45);
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
        if (c.cloud > 0 || c.air > 0 || hasPerk(c, 'phase')) break;   // floating on a cloud / flying / Ghost Car: sail right over
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
        if (!m.on || c.air > 0 || c.cloud > 0 || c.h > 0.5 || c.ghost > 0 || c.wobCool > 0 || hasPerk(c, 'phase')) continue;
        const d = Math.hypot(c.x - m.x, c.y - m.y);
        if (d > m.r + CAR_R) continue;
        c.wobCool = 1.2;
        if (c.shield > 0) continue;
        c.wob = 0.6;
        c.vx *= 0.8; c.vy *= 0.8;
        c.vx += (c.x - m.x) / (d || 1) * 120; c.vy += (c.y - m.y) / (d || 1) * 120;   // nudged aside
        squashCar(g, c, 0.25);
        if (c.isPlayer) { g.sfx('bonk'); popup({ snowball: 'Brrr!', crab: 'Pinch!', gumdrop: 'Boing!', steam: 'Puff!', ball: 'Boing!', pumpkin: 'Bonk!', tumbleweed: 'Whoosh!', rock: 'Bump!', frog: 'Ribbit!', puff: 'Poof!' }[m.kind], c.x, c.y - 50, '#ffffff'); }
      }

      // ---- gift boxes ----
      for (const b of boxes) {
        if (b.t > 0 || Math.hypot(c.x - b.x, c.y - b.y) > 32 || c.h > 0.5) continue;
        if (hasPerk(c, 'phase')) continue;               // Ghost Car: it drives right through gift boxes (no items!)
        b.t = 3;
        fx.burst(b.x, b.y, { count: 12, shape: 'star', speed: 180, gravity: 0, size: 12, life: 0.6 });
        if (!c.item) {
          giveItem(c);
          if (c.isPlayer && hasPerk(c, 'lucky')) perkSound('ding');
          if (c.isPlayer) {
            g.juice.sparkle(b.x, b.y, { to: fx, count: 6 }); g.juice.pop('item', 0.4); squashCar(g, c, -0.12);
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
        // lost out in the grass, driving round and round? (playtest, Nov 23: on Cloud Castle a pretend child spent
        // a whole minute of a race out on the clouds, never slow enough for the help above) -> lift it back too
        if (!autopilot && c.near.dist > T.hw + 60 && !c.onShort && !(c.air > 0)) c.lostT = (c.lostT || 0) + dt; else c.lostT = 0;
        if (c.lostT > (g.little || g.oneThumb ? 3 : 4)) { c.lostT = 0; respawn(g, c); }
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
      if (c.drift && c.drift.on) c.skidAmt = Math.max(c.skidAmt || 0, 0.5);   // (drifting: the tires squeal)
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
    if (mode === 'friends') bumpFriends(g);
    updateBubbles(g, dt);
    updateShots(g, dt);
    updateTraps(g, dt);
    for (const b of bumpers) b.hit -= dt;
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
    rushTick(g, dt); followTick(g, dt);           // Coin Rush clock + coins / Follow the Leader (only in those modes)
    rankCars();
    if (mode === 'friends') friendsTick(dt);
    if (boo && !boo.home && raceTime >= boo.t) {          // Boo crossed the finish line
      boo.home = true;
      if (!player.finished) { const b = booAt(raceTime); popup('Boo!', b.x, b.y - 70, '#e0e7ff', 34); g.tone(700, 0.5, { type: 'sine', slide: 350, vol: 0.12 }); }
    }
    follow(dt);

    // photo finish: you're nearly at the line on the last lap with someone right next to you
    if (!slowmoDone && player.lap === laps && !player.finished) {
      const toLine = T.L - player.s;
      const booClose = boo && raceTime < boo.t && Math.abs(booAt(raceTime).p - player.progress) < 110;
      if (toLine < 260 && (booClose || racers().some(o => o !== player && !o.finished && Math.abs(o.progress - player.progress) < 110))) {
        slowmoDone = true; slowmo = 1.6;            // 1.6 real seconds at 30% speed
        popup('Photo finish!', player.x, player.y - 80, '#ffd166', 40);
      }
    }
    // after you cross the line, let the others zoom in for a moment, then show results
    // engine sound follows your car (updated 30 times a second)
    if (++engineTick % 4 === 0) {
      if (!engine.n && !player.finished) engine.start();
      const gas = g.input.down('ArrowUp', 'KeyW') || autopilot || g.little || g.oneThumb;   // (little kids + one thumb drive by themselves)
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
    partyTick(g, dt);

    if (endTimer > 0) {
      endTimer -= dt;
      if (endTimer <= 0) { engine.stop(); finishRace(g); }
    }
  }

  // ---------------------------------------------------------------
  // The finish-line party (Nov 21, RC plan #3: "a bigger and happier win screen")
  // Come in 1st: fireworks pop all round your car, it spins happy donuts, the
  // camera comes in close, the rivals smile at you, and a big gold trophy
  // bounces in at the top. 2nd or 3rd: a few fireworks + a silver / bronze one.
  // (Races, cups, the Ghost Race and Friends races; not Time Trial / Drive.)
  // ---------------------------------------------------------------
  const PARTY_COLORS = [['#ffd166', '#ffffff', '#ff8c42'], ['#f15bb5', '#ffc8dd', '#ffffff'], ['#4cc9f0', '#9bf6ff', '#ffffff'], ['#06d6a0', '#b9fbc0', '#ffffff'], ['#9b5de5', '#e0aaff', '#ffd166']];
  function partyTick(g, dt) {
    if (!party) {
      if (!player.finished || endTimer <= 0 || !['free', 'cup', 'daily', 'friends'].includes(mode)) return;
      if (player.position > 3) { party = { t: 0, won: false, place: player.position, pops: 0, next: 99 }; return; }   // (4th: just "Nice try!")
      party = { t: 0, won: player.position === 1, place: player.position, pops: 0, next: 0.15 };
      if (party.won) {
        endTimer = Math.max(endTimer, 3.2);             // (a little longer, so the party can be seen)
        for (const o of cars) if (!o.isPlayer) { o.mood = { kind: 'happy', t: 3.5 }; o.moodCool = raceTime + 4; }   // everyone's happy for you
        g.music.stinger('lead');
      }
      return;
    }
    party.t += dt;
    if (party.place > 3) return;
    if ((party.next -= dt) <= 0 && party.pops < (party.won ? 9 : 3)) {
      // a firework somewhere around your car (inside the picture)
      const a = Math.random() * Math.PI * 2, r = 90 + Math.random() * 150;
      const x = player.x + Math.cos(a) * r * 1.5, y = player.y + Math.sin(a) * r * 0.8 - 40;
      fx.burst(x, y, { count: party.won ? 30 : 20, shape: 'star', speed: 260, gravity: 90, size: 13, life: 0.95, colors: PARTY_COLORS[party.pops % PARTY_COLORS.length] });
      fx.burst(x, y, { count: 10, speed: 120, gravity: 40, size: 8, life: 0.6, colors: ['#ffffff'] });
      g.tone(500 + Math.random() * 500, 0.18, { type: 'triangle', vol: 0.12, slide: 1400 + Math.random() * 400 });
      party.pops++;
      party.next = party.won ? 0.3 : 0.45;
    }
    if (party.won && party.t > 0.5 && Math.random() < dt * 24) {   // rainbow sparkles off the donut
      fx.burst(player.x, player.y, { count: 1, shape: 'star', angle: player.a + Math.PI, spread: 1.2, speed: 120, gravity: 0, size: 10, life: 0.5, colors: ['#ffd166', '#f15bb5', '#4cc9f0', '#06d6a0', '#9b5de5'] });
    }
  }
  // the picture part: a big trophy with your place, bouncing in, with twinkles round it
  function drawParty(ctx, time) {
    if (party.place > 3) return;
    const k = Math.min(1, party.t / 0.45), pop = k < 1 ? 1 - Math.pow(1 - k, 3) * Math.cos(k * 9) : 1;   // (a springy pop-in)
    // the trophy (gold / silver / bronze) with the place on it
    const col = ['#ffc93c', '#cfd8e3', '#e9965a'][party.place - 1];
    const s = 1.5 * pop * (1 + 0.05 * Math.sin(time * 6)), cx = W / 2, cy = 78 + Math.sin(time * 3) * 4;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.rotate(Math.sin(time * 4) * 0.06);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = INK;
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-22, -26); ctx.lineTo(-38, -26); ctx.quadraticCurveTo(-40, 2, -16, 4); ctx.moveTo(22, -26); ctx.lineTo(38, -26); ctx.quadraticCurveTo(40, 2, 16, 4); ctx.stroke();   // handles
    ctx.beginPath(); ctx.moveTo(-26, -36); ctx.lineTo(26, -36); ctx.lineTo(26, -6); ctx.arc(0, -6, 26, 0, Math.PI); ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();                         // the cup
    ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(0, 32); ctx.stroke();  // the stem
    D.box(ctx, -20, 30, 40, 14, 5, col, 4);                                                   // the foot
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-16, -28); ctx.quadraticCurveTo(-14, -6, -4, 2); ctx.stroke();   // shine
    D.text(ctx, String(party.place), 4, -6, { size: 26, color: '#fff' });
    ctx.restore();
    // twinkles round the trophy
    for (let i = 0; i < 4; i++) {
      const a = time * 1.6 + i * Math.PI / 2, r = 70 * pop;
      D.star(ctx, cx + Math.cos(a) * r * 1.3, cy + Math.sin(a) * r * 0.6, 9 + 3 * Math.sin(time * 8 + i), ['#ffffff', '#ffd166', '#f15bb5', '#4cc9f0'][i], 2.5);
    }
  }

  // Cars bump like round bumper cars: push apart, bounce a little.
  function collide(g) {
    for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) {
      const a = cars[i], b = cars[j];
      if (a.ghost > 0 || b.ghost > 0 || a.air > 0 || b.air > 0) continue;   // flying cars hop right over
      if (hasPerk(a, 'phase') || hasPerk(b, 'phase')) continue;               // the Ghost Car: no bumping at all
      if (Math.abs((a.h || 0) - (b.h || 0)) > 0.4) continue;                   // one on the bridge, one under it
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      const reach = CAR_R * ((a.mega > 0 ? 1.6 : 1) + (b.mega > 0 ? 1.6 : 1));   // (a Mega Car is bigger)
      if (d >= reach || d === 0) continue;
      const nx = dx / d, ny = dy / d;
      const ma = a.stats.mass * (a.shield > 0 ? 4 : 1) * (a.mega > 0 ? 3 : 1), mb = b.stats.mass * (b.shield > 0 ? 4 : 1) * (b.mega > 0 ? 3 : 1);
      const over = reach - d;
      a.x -= nx * over * mb / (ma + mb); a.y -= ny * over * mb / (ma + mb);
      b.x += nx * over * ma / (ma + mb); b.y += ny * over * ma / (ma + mb);
      const vrel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (vrel < 0) {
        const jimp = -(1 + 0.4) * vrel / (1 / ma + 1 / mb);
        a.vx -= nx * jimp / ma; a.vy -= ny * jimp / ma;
        b.vx += nx * jimp / mb; b.vy += ny * jimp / mb;
        if (mode === 'battle') battleBump(g, a, b, -vrel);     // a boosting car knocks a heart off
        else for (const [m, o] of [[a, b], [b, a]]) if (m.mega > 0 && !(o.mega > 0) && !(o.wob > 0)) { o.wob = 0.7; if (m.isPlayer) popup('Boing!', o.x, o.y - 50, '#ff8fab'); }
        if (-vrel > 70 && (a.isPlayer || b.isPlayer) && a.bumpCool <= 0 && b.bumpCool <= 0) {
          a.bumpCool = b.bumpCool = 0.25;
          g.sfx('bonk');
          squashCar(g, a, 0.22); squashCar(g, b, 0.22);
          if (-vrel > 220) g.juice.stop(0.04);
          Arcade.audio.noise(0.12, { freq: 500, vol: 0.25 });   // + a little "thud"
          fx.burst((a.x + b.x) / 2, (a.y + b.y) / 2, { count: 6, shape: 'star', speed: 120, gravity: 0, size: 10, life: 0.4 });
        }
      }
    }
  }

  // Friends' cars: a GENTLE bump (Keith, Nov 5). Each phone only moves its own
  // car: it slides half-way out of the overlap and gets a soft push apart.
  // The friend's phone does the same for their car, so both cars bounce a little.
  // (Ghosts, jumpers and cloud riders pass through. Shields and Super Stars
  // don't get pushed at all, and push the other car a bit harder.)
  function bumpFriends(g) {
    const a = player;
    if (a.finished || a.ghost > 0 || a.phaseT > 0 || a.air > 0 || a.cloud > 0 || hasPerk(a, 'phase')) return;
    for (const f of Object.values(friendCars)) {
      if (f.finished || f.phaseT || f.air > 0 || f.cloud) continue;
      if (Math.abs((a.h || 0) - (f.h || 0)) > 0.4) continue;
      const dx = f.x - a.x, dy = f.y - a.y, d = Math.hypot(dx, dy);
      if (d >= CAR_R * 2 || d === 0) continue;
      if (a.shield > 0 || a.star > 0) continue;              // nothing moves me while I'm protected
      const nx = dx / d, ny = dy / d, over = CAR_R * 2 - d;
      a.x -= nx * over * 0.5; a.y -= ny * over * 0.5;
      // (< 0 = coming together; capped so even a head-on crash is only a gentle bounce)
      const vrel = Math.max(-200, ((f.vx || 0) - a.vx) * nx + ((f.vy || 0) - a.vy) * ny);
      if (a.bumpCool > 0) continue;                           // one soft shove per bump
      a.bumpCool = 0.3;
      const push = (f.shield || f.star) ? 160 : 70;          // px/s
      if (vrel < 0) { a.vx += nx * vrel * 0.6; a.vy += ny * vrel * 0.6; }   // stop driving into them
      a.vx -= nx * push; a.vy -= ny * push;                  // and slide apart
      if (-vrel > 60) {
        g.sfx('bonk');
        fx.burst((a.x + f.x) / 2, (a.y + f.y) / 2, { count: 6, shape: 'star', speed: 120, gravity: 0, size: 10, life: 0.4 });
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
      if (bumpers.some(m => Math.hypot(m.x - b.x, m.y - b.y) < m.r + 12)) { b.life = 0; fx.burst(b.x, b.y, { count: 10, colors: ['#ffffff', '#9bf6ff'], speed: 160, gravity: 0, size: 9, life: 0.4 }); continue; }
      for (const c of racers()) {
        if (c === b.owner || c.finished || b.life <= 0 || hasPerk(c, 'phase')) continue;   // (bubbles float through the Ghost Car)
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
    // Daily Ghost Race: are you ahead of Boo? (1st or 2nd)
    if (mode === 'daily' && boo && player) {
      const behind = player.finished ? player.finishTime > boo.t : booAt(raceTime).p > player.progress + 1;
      player.position = behind ? 2 : 1;
    }
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
    if (party && party.won) zt = 1.2;                    // (a win: a close look at the party)
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
    if (mode === 'rush') { rushFinish(g); return; }       // (just you: no wins, places or coins)
    if (mode === 'follow') { followFinish(g); return; }
    // wins count toward the special paints
    if (T.def.custom && T.def.slot !== 'f') addFeat(g, f => { f.myRace = true; });   // (unlocks the Swap-O)
    if (mode !== 'trial' && mode !== 'daily' && place === 1 && !T.def.custom) addFeat(g, f => {
      f.wins = (f.wins || 0) + 1;
      f.won = Object.assign({}, f.won, { [id]: true });
      if (weather === 'snow') f.snowWin = true;
      if (weather === 'rain') f.rainWin = true;
    });

    if (mode === 'daily') { finishBoo(g); return; }
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
      const again = { icon: icons.again, label: 'Again', cls: 'big', onClick: () => { if (room) room.send(Object.assign({ t: 'start', track: id, weather }, T.def.pack ? { mt: T.def.pack } : {})); g.play({ id: 'fr-' + id }); } };
      g.finish({
        win: place <= 3, medal: ['gold', 'silver', 'bronze'][place - 1] || null, stars: [3, 2, 1][place - 1] || 0, time: player.finishTime,
        title, lines: [rows], delay: 300,
        buttons: [again, { icon: icons.menu, label: 'Friends', cls: 'blue', onClick: () => friendsMenu(g) }],
      });
      return;
    }
    // home-made tracks: a Build button goes straight back to the builder
    const buildBtn = T.def.custom ? [{ icon: builder().PICS.pencil, label: 'Build', cls: 'blue', onClick: () => builder().edit(g, T.def.slot) }] : null;
    if (mode === 'drive' && T.def.custom) {
      g.finish({ win: true, stars: 3, time: player.finishTime, title: 'All the stars!', delay: 300, extraButtons: buildBtn,
        lines: [`<div style="font-size:30px">${'<span style="color:#ffc93c">★</span>'.repeat(3)} ${driveStars.length}/${driveStars.length}</div>`, `Time: <b>${player.finishTime.toFixed(1)} s</b>`] });
      return;
    }
    if (mode === 'free' && T.def.custom) {
      g.finish({ win: place <= 3, medal: ['gold', 'silver', 'bronze'][place - 1] || null, stars: [3, 2, 1][place - 1] || 0,
        time: player.finishTime, title, ...(CANVAS ? { rowsTop: true, starsRow: false, rows: raceRows(g, order, 0) } : { lines: [raceHTML(g, order, 0)] }), delay: 300, extraButtons: buildBtn });
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
        time: player.finishTime, title, ...(CANVAS ? { rowsTop: true, starsRow: false, rows: raceRows(g, order, 0) } : { lines: [raceHTML(g, order, 0)] }), next: true, delay: 300,
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
        win: place <= 3, title, ...(CANVAS ? { rowsTop: true, starsRow: false, rows: raceRows(g, order, earned, cup.race, cupLen()) } : { lines: [raceHTML(g, order, earned, cup.race, cupLen())] }), delay: 300,
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
    checkSpecials(g);   // (finishing a cup unlocks the Disco Ball)
    // new car styles unlocked by this cup?
    STYLES.filter(st => st.ok(g)).slice(before).forEach(st => g.toast('New car: ' + st.name + '!'));
    g.finish({
      win: rank <= 3,
      title: rank === 1 ? cupName + ' Champion!' : rank <= 3 ? cupName + ': ' + ORD(rank) + ' place!' : cupName + ' done!',
      ...(CANVAS ? { rowsTop: true, rows: [{ t: 'pics', items: [cupPodiumSVG(g, cup, rank)], size: 400, kind: 'cup-podium', rank }] } : { lines: [podiumHTML(g, cup, rank)] }), delay: 300,
      buttons: [
        { icon: trophyIcon, label: 'New ' + cupName, cls: 'big', onClick: () => g.play({ id: cupKey + 'new' }) },
        { icon: icons.menu, label: 'Menu', cls: 'blue', onClick: () => g.menu() },
      ],
    });
  }
  // Daily Ghost Race over: did you beat Boo? The first win of each day counts for
  // the Ghost trophy on the shelf and gives 1 house coin. Racing again is just for fun.
  function finishBoo(g) {
    const d = g.save.data, day = todayStr(), id = T.def.id;
    const won = player.finishTime < boo.t;
    let coin = false;
    const hadGhostCar = STYLES.find(st => st.id === 'ghostcar').ok(g);
    if (won && d.booDay !== day) {
      d.booDay = day; d.booWins = (d.booWins || 0) + 1; coin = true;
      const st = Arcade.store.load(); st.houseBonus = (st.houseBonus || 0) + 1;
    }
    if (won) d.booBest = Object.assign({}, d.booBest, { [id]: Math.min((d.booBest || {})[id] || 999, player.finishTime) });
    g.store();
    checkSpecials(g);   // (beating Boo unlocks the Bubble Dragon)
    // the 10th day: the secret Ghost Car! (a big surprise, then it waits in My Car)
    const newGhostCar = !hadGhostCar && STYLES.find(st => st.id === 'ghostcar').ok(g);
    if (newGhostCar) {
      g.toast('Secret car: Ghost Car!', `<img src="${carImg('ghostcar', '#f4f1ff', 'none', 96)}" alt="" style="width:48px;height:48px">`);
      g.sfx('unlock'); Arcade.confetti(90);
    }
    if (coin) g.toast('+1 house coin!', '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19" fill="#ffc93c" stroke="#2b2b2b" stroke-width="4"/></svg>');
    const me = carImg(pickedStyle(g).id, pickedCar(g).color, pickedDecal(g));
    const row = (pic, t, first, i) => `<div class="rc-boo-row${first ? ' win' : ''}" style="--d:${0.2 + i * 0.25}s">` +
      `<span class="rc-boo-place">${first ? '1st' : '2nd'}</span>${pic}<b>${t.toFixed(1)} s</b>${first ? `<span class="rc-boo-star">${STAR_PIC}</span>` : ''}</div>`;
    const mine = row(`<img src="${me}" alt="">`, player.finishTime, won, won ? 0 : 1);
    const his = row(`<span class="rc-boo-pic">${BOO_PIC}</span>`, boo.t, !won, won ? 1 : 0);
    g.finish({
      win: won, stars: won ? 3 : 0, time: player.finishTime,
      title: won ? 'You beat Boo!' : 'Nice try!',
      ...(CANVAS ? { rowsTop: true, rows: [{ t: 'pics', items: [booSVG(g, won, player.finishTime, boo.t, d.booWins || 0, newGhostCar)], size: 340, kind: 'boo', won }] } : { lines: [`<div class="rc-boo-res">${won ? mine + his : his + mine}</div>` +
        `<div class="rc-boo-wins">${trophySVG('ghost', booLevel(d.booWins || 0))}<b>× ${d.booWins || 0}</b></div>` +
        (newGhostCar ? `<div class="rc-boo-new"><img src="${carImg('ghostcar', pickedCar(g).color, 'none')}" alt=""><b>NEW!</b></div>` : '')] }),
      delay: 300,
      buttons: [
        { icon: icons.again, label: 'Again', cls: 'big', onClick: () => g.play({ id: 'dg-' + id }) },
        { icon: icons.menu, label: 'Menu', cls: 'blue', onClick: () => g.menu() },
      ],
    });
  }

  // After a race: pictures, not words! The top 3 cars on a podium, your place
  // (if you're not in the top 3), the coins you won, and flags for the races
  // in the cup (done ones are checkered).
  // (badge(c) = optional extra bit on each car's step, e.g. Heart Battle's hearts left)
  function raceHTML(g, order, earned, raceNum, raceCount, badge) {
    const carOf = (c) => c.isPlayer ? carImg(pickedStyle(g).id, pickedCar(g).color, pickedDecal(g)) : carImg(c.style || 'classic', c.color, c.decal || 'none');
    const STEP = [{ h: 92, col: '#ffd166' }, { h: 68, col: '#dfe7ef' }, { h: 52, col: '#f4a261' }];
    const col = (i) => {
      const c = order[i]; if (!c) return '';
      return `<div class="rc-pod ${c.isPlayer ? 'me' : ''}" style="--d:${0.2 + (2 - i) * 0.2}s">
        ${c.isPlayer ? '<div class="rc-you">You!</div>' : ''}
        <img src="${carOf(c)}" alt="" class="${i === 0 ? 'rc-bob' : ''}">
        <div class="rc-step" style="height:${STEP[i].h}px;background:${STEP[i].col}"><b>${i + 1}</b>${badge ? badge(c) : ''}</div>
      </div>`;
    };
    let html = `<div class="rc-podium-wrap"><div class="rc-podium">${col(1)}${col(0)}${col(2)}</div>`;
    const me = order.findIndex(c => c.isPlayer);
    if (me >= 3) html += `<div class="rc-mine"><img src="${carOf(order[me])}" alt=""><b>${me + 1}</b>${badge ? badge(order[me]) : ''}</div>`;
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
    if (CANVAS) { garageScreen(g); return; }
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
  // ===================== Living backgrounds (Nov 22, new plan point 2, part 5) =====================
  // RC is seen from above, so "living" here means:
  //  * the ground outside the road has a texture (grass tufts, waves, snow drifts, sand ripples, cracks
  //    with lava glow, sprinkles, little clouds...) painted ONCE into a small tile that repeats (`groundTile()`);
  //    the sea and the sky tiles slide slowly, so the water and the clouds move
  //  * soft cloud shadows drift over everything (`drawCloudShadows()`, one blob picture painted once)
  //  * little visitors float about over the track (`FLOATERS` per place: butterflies, gulls, leaves, embers...)
  //  * some scenery moves by itself (lava pools bubble + smoke, swim rings bob, balloons bob, big flowers nod):
  //    see drawDecor(), it reads `scNow`
  //  * three tracks have a time of day (a track's `time`, `TIMES`): Autumn Woods = sunset, Desert Dunes = dawn,
  //    Jungle Rally = evening (fireflies come out)
  // Everything is worked out from the scene clock scT() (= 0 in Calm motion: it all stands still, floaters hide).
  const TILE = 320;                                // the ground tile is TILE x TILE world units
  const TIMES = {
    sunset:  { wash: ['rgba(255,150,70,0.22)', 'rgba(255,90,120,0.10)'], sun: 'rgba(255,214,140,0.38)' },
    dawn:    { wash: ['rgba(255,160,200,0.22)', 'rgba(255,226,170,0.08)'], sun: 'rgba(255,236,200,0.34)' },
    evening: { wash: ['rgba(50,30,130,0.42)', 'rgba(30,20,90,0.30)'], fireflies: true },
  };
  // little things in the air, per place (n = how many; kinds are drawn in drawFloater())
  const FLOATERS = {
    yard: [['butterfly', 3]], beach: [['gull', 3]], snow: [['flake', 22]], autumn: [['leaf', 12]],
    desert: [['bird', 3], ['dust', 6]], candy: [['bubble', 9]], moon: [['firefly', 10], ['shooting', 1]],
    volcano: [['ember', 16]], jungle: [['butterfly', 4]], sky: [['puff', 4], ['bird', 3]],
  };
  const calmNow = () => !!(Arcade.calm && Arcade.calm());
  let sceneClock = null;                           // (test-only: draw the scenery at a pretend time)
  let scNow = 0;                                   // the scene clock for this frame (drawDecor reads it)
  const scT = (g) => calmNow() ? 0 : sceneClock != null ? sceneClock : g.time;
  const themeId = () => (T && T.def && T.def.theme) || 'yard';
  let timeOff = false;                             // (test-only: draw without the time of day)
  const curTime = () => (!timeOff && T && T.def && !T.def.arena && TIMES[T.def.time]) ? T.def.time : null;
  // the same "random" numbers every time (so the tile looks the same each race)
  const seeded = (s) => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

  // ---- the ground tile: painted once per place ----
  const tiles = {};
  function groundTile(id) {
    if (tiles[id]) return tiles[id];
    const th = THEMES[id] || THEMES.yard, c = document.createElement('canvas'); c.width = c.height = TILE;
    const x = c.getContext('2d'), rnd = seeded(id.length * 977 + id.charCodeAt(0) * 31 + 7);
    x.lineCap = 'round'; x.lineJoin = 'round';
    // draw something at (px, py) and again across the edges, so the tile joins up with itself
    const wrap = (px, py, r, fn) => {
      for (const ox of [-TILE, 0, TILE]) for (const oy of [-TILE, 0, TILE]) {
        const qx = px + ox, qy = py + oy;
        if (qx > -r && qx < TILE + r && qy > -r && qy < TILE + r) fn(qx, qy);
      }
    };
    const tuft = (dark, light) => {                 // a grass tuft: 3 little blades
      const px = rnd() * TILE, py = rnd() * TILE, s = 0.8 + rnd() * 0.6;
      wrap(px, py, 14, (qx, qy) => {
        x.strokeStyle = dark; x.lineWidth = 2.5;
        x.beginPath(); for (const a of [-0.5, 0, 0.5]) { x.moveTo(qx, qy); x.lineTo(qx + Math.sin(a) * 10 * s, qy - Math.cos(a) * 10 * s); } x.stroke();
        x.strokeStyle = light; x.lineWidth = 1.5; x.beginPath(); x.moveTo(qx + 1, qy - 1); x.lineTo(qx + 2, qy - 8 * s); x.stroke();
      });
    };
    if (id === 'beach') {                           // the sea: wave crescents + twinkles
      for (let i = 0; i < 20; i++) {
        const px = rnd() * TILE, py = rnd() * TILE, r = 14 + rnd() * 12;
        wrap(px, py, r + 4, (qx, qy) => {
          x.strokeStyle = 'rgba(255,255,255,0.42)'; x.lineWidth = 3.5;
          x.beginPath(); x.arc(qx, qy, r, Math.PI * 1.15, Math.PI * 1.85); x.stroke();
          x.strokeStyle = 'rgba(20,90,140,0.18)'; x.lineWidth = 3;
          x.beginPath(); x.arc(qx, qy + 5, r, Math.PI * 1.2, Math.PI * 1.8); x.stroke();
        });
      }
      for (let i = 0; i < 10; i++) { const px = rnd() * TILE, py = rnd() * TILE; wrap(px, py, 4, (qx, qy) => D.circle(x, qx, qy, 2.2, 'rgba(255,255,255,0.7)', 0)); }
    } else if (id === 'snow') {                     // soft drifts + sparkles
      for (let i = 0; i < 14; i++) {
        const px = rnd() * TILE, py = rnd() * TILE, r = 18 + rnd() * 16;
        wrap(px, py, r + 4, (qx, qy) => {
          x.strokeStyle = 'rgba(90,130,190,0.22)'; x.lineWidth = 3; x.beginPath(); x.arc(qx, qy + 3, r, Math.PI * 0.15, Math.PI * 0.85); x.stroke();
          x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = 3; x.beginPath(); x.arc(qx, qy, r, Math.PI * 0.2, Math.PI * 0.8); x.stroke();
        });
      }
      for (let i = 0; i < 12; i++) {
        const px = rnd() * TILE, py = rnd() * TILE;
        wrap(px, py, 6, (qx, qy) => { x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(qx - 4, qy); x.lineTo(qx + 4, qy); x.moveTo(qx, qy - 4); x.lineTo(qx, qy + 4); x.stroke(); });
      }
    } else if (id === 'desert') {                   // wind ripples in the sand (waves that fit the tile exactly)
      for (let i = 0; i < 9; i++) {
        const y0 = (i + rnd() * 0.5) * TILE / 9, ph = rnd() * 6.28, amp = 4 + rnd() * 4;
        x.strokeStyle = i % 2 ? 'rgba(160,100,40,0.16)' : 'rgba(255,245,220,0.30)'; x.lineWidth = 3;
        x.beginPath();
        for (let px = -4; px <= TILE + 4; px += 8) x.lineTo(px, y0 + Math.sin(px / TILE * Math.PI * 4 + ph) * amp);
        x.stroke();
      }
    } else if (id === 'volcano') {                  // dark cracks with a warm glow
      for (let i = 0; i < 7; i++) {
        const px = rnd() * TILE, py = rnd() * TILE, pts = [[0, 0]];
        let a = rnd() * 6.28;
        for (let k = 0; k < 4; k++) { a += (rnd() - 0.5) * 1.4; const [lx, ly] = pts[pts.length - 1]; pts.push([lx + Math.cos(a) * 14, ly + Math.sin(a) * 14]); }
        wrap(px, py, 64, (qx, qy) => {
          for (const [col, lw] of [['rgba(255,120,0,0.30)', 7], ['rgba(40,20,20,0.55)', 2.5]]) {
            x.strokeStyle = col; x.lineWidth = lw; x.beginPath();
            for (const [ox, oy] of pts) x.lineTo(qx + ox, qy + oy);
            x.stroke();
          }
        });
      }
      for (let i = 0; i < 16; i++) { const px = rnd() * TILE, py = rnd() * TILE; wrap(px, py, 5, (qx, qy) => D.circle(x, qx, qy, 2 + rnd(), 'rgba(30,15,15,0.28)', 0)); }
    } else if (id === 'candy') {                    // sprinkles + sugar dots
      const cols = ['rgba(239,71,111,0.45)', 'rgba(6,214,160,0.45)', 'rgba(255,209,102,0.6)', 'rgba(17,138,178,0.4)', 'rgba(155,93,229,0.45)'];
      for (let i = 0; i < 26; i++) {
        const px = rnd() * TILE, py = rnd() * TILE, a = rnd() * 3.14, col = cols[i % cols.length];
        wrap(px, py, 10, (qx, qy) => { x.strokeStyle = col; x.lineWidth = 4; x.beginPath(); x.moveTo(qx - Math.cos(a) * 5, qy - Math.sin(a) * 5); x.lineTo(qx + Math.cos(a) * 5, qy + Math.sin(a) * 5); x.stroke(); });
      }
      for (let i = 0; i < 14; i++) { const px = rnd() * TILE, py = rnd() * TILE; wrap(px, py, 5, (qx, qy) => D.circle(x, qx, qy, 3, 'rgba(255,255,255,0.55)', 0)); }
    } else if (id === 'sky') {                      // little soft clouds far below (the tile slides = they drift)
      for (let i = 0; i < 6; i++) {
        const px = rnd() * TILE, py = rnd() * TILE, s = 0.7 + rnd() * 0.5;
        wrap(px, py, 40, (qx, qy) => { for (const [ox, oy, r] of [[-14, 3, 11], [0, -3, 14], [14, 3, 11]]) D.circle(x, qx + ox * s, qy + oy * s, r * s, 'rgba(255,255,255,0.45)', 0); });
      }
    } else {                                        // grass (yard, autumn, moon, jungle)
      const dark = id === 'moon' ? 'rgba(10,20,50,0.35)' : 'rgba(0,40,0,0.22)', light = id === 'moon' ? 'rgba(160,190,240,0.30)' : 'rgba(255,255,255,0.22)';
      for (let i = 0; i < 26; i++) tuft(dark, light);
      if (id === 'autumn') {                        // fallen leaves
        const cols = ['#e07a1f', '#ffb703', '#d6452b', '#f4a259'];
        for (let i = 0; i < 16; i++) {
          const px = rnd() * TILE, py = rnd() * TILE, a = rnd() * 6.28, col = cols[i % 4];
          wrap(px, py, 10, (qx, qy) => { x.save(); x.translate(qx, qy); x.rotate(a); x.globalAlpha = 0.75; x.beginPath(); x.ellipse(0, 0, 7, 3.5, 0, 0, 7); x.fillStyle = col; x.fill(); x.globalAlpha = 0.5; x.lineWidth = 1.2; x.strokeStyle = INK; x.stroke(); x.restore(); });
        }
      } else if (id === 'jungle') {                 // big dark fern leaves
        for (let i = 0; i < 7; i++) {
          const px = rnd() * TILE, py = rnd() * TILE, a = rnd() * 6.28;
          wrap(px, py, 22, (qx, qy) => { x.save(); x.translate(qx, qy); x.rotate(a); x.beginPath(); x.ellipse(0, 0, 18, 6, 0, 0, 7); x.fillStyle = 'rgba(0,50,20,0.25)'; x.fill(); x.strokeStyle = 'rgba(150,230,150,0.25)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(-16, 0); x.lineTo(16, 0); x.stroke(); x.restore(); });
        }
      } else if (id === 'moon') {                   // tiny glints
        for (let i = 0; i < 12; i++) { const px = rnd() * TILE, py = rnd() * TILE; wrap(px, py, 4, (qx, qy) => D.circle(x, qx, qy, 1.8, 'rgba(255,240,180,0.55)', 0)); }
      } else {                                      // yard: little clover dots
        for (let i = 0; i < 8; i++) { const px = rnd() * TILE, py = rnd() * TILE; wrap(px, py, 8, (qx, qy) => { for (let k = 0; k < 3; k++) D.circle(x, qx + Math.cos(k * 2.1) * 3.5, qy + Math.sin(k * 2.1) * 3.5, 3.2, 'rgba(40,110,40,0.35)', 0); }); }
      }
    }
    void th;
    tiles[id] = c; return c;
  }
  let patCache = null;                             // { ctx, id, pat }
  function drawGround(ctx, g, mx, my, vw, vh) {
    const id = themeId();
    if (!patCache || patCache.ctx !== ctx || patCache.id !== id) patCache = { ctx, id, pat: ctx.createPattern(groundTile(id), 'repeat') };
    const pat = patCache.pat, t = scT(g);
    // the sea and the sky slide slowly (the pattern moves, the tile is never repainted)
    const dx = id === 'beach' ? t * 9 : id === 'sky' ? t * 16 : 0, dy = id === 'beach' ? Math.sin(t * 0.6) * 10 : id === 'sky' ? t * 4 : 0;
    if (pat.setTransform) pat.setTransform(new DOMMatrix([1, 0, 0, 1, dx % TILE, dy % TILE]));
    ctx.fillStyle = pat;
    ctx.fillRect(mx - vw - 20, my - vh - 20, 2 * vw + 40, 2 * vh + 40);
  }

  // ---- cloud shadows: one soft blob picture, painted once, drawn a few times ----
  let blobC = null;
  function shadowBlob() {
    if (blobC) return blobC;
    blobC = document.createElement('canvas'); blobC.width = 256; blobC.height = 160;
    const x = blobC.getContext('2d');
    for (const [cx, cy, r] of [[80, 92, 56], [130, 70, 66], [182, 94, 54], [128, 108, 50]]) {
      const gr = x.createRadialGradient(cx, cy, r * 0.3, cx, cy, r);
      gr.addColorStop(0, 'rgba(20,30,70,0.9)'); gr.addColorStop(1, 'rgba(20,30,70,0)');
      x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
    }
    return blobC;
  }
  function drawCloudShadows(ctx, g, vis) {
    if (theme.night || themeId() === 'sky' || weather === 'rain' || weather === 'snow' || curTime() === 'evening') return;
    const t = scT(g), b = T.box, w = b.x1 - b.x0 + 2000, h = b.y1 - b.y0 + 2000, blob = shadowBlob();
    const wa = wind ? wind.a : 0.35, sp = wind ? 34 : 20;
    ctx.save(); ctx.globalAlpha = 0.15;
    for (let i = 0; i < 10; i++) {
      const s = 420 + (i % 3) * 140;
      const x = b.x0 - 1000 + ((((i * 1931) + Math.cos(wa) * t * sp) % w) + w) % w;
      const y = b.y0 - 1000 + ((((i * 1291) + Math.sin(wa) * t * sp) % h) + h) % h;
      if (vis(x, y, s * 1.1)) ctx.drawImage(blob, x - s, y - s * 0.62, 2 * s, 1.25 * s);
    }
    ctx.restore();
  }

  // ---- the time of day: a soft colored wash over the view + a glow where the sun is ----
  function drawTimeWash(ctx) {
    const tm = TIMES[curTime()];
    if (!tm) return;
    const gr = ctx.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, tm.wash[0]); gr.addColorStop(1, tm.wash[1]);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    if (tm.sun) {
      const sg = ctx.createRadialGradient(W, 0, 20, W, 0, W * 0.6);
      sg.addColorStop(0, tm.sun); sg.addColorStop(1, 'rgba(255,220,160,0)');
      ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
    }
  }

  // ---- little visitors in the air (screen space, sliding a bit faster than the ground: they're closer) ----
  function drawFloaters(ctx, g) {
    if (calmNow()) return;                          // Calm motion: nothing floats
    const t = scT(g), id = themeId();
    const list = (FLOATERS[id] || []).slice();
    if (curTime() === 'evening') list.push(['firefly', 12]);
    if (weather === 'snow') { const i = list.findIndex(f => f[0] === 'flake'); if (i >= 0) list.splice(i, 1); }
    const few = g.lite && g.lite() > 0;             // slow device: half as many
    const M = 80, PX = 1.15;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [kind, n0] of list) {
      const n = few ? Math.ceil(n0 / 2) : n0;
      for (let i = 0; i < n; i++) {
        const sd = i * 7.13 + kind.length * 3.7, rx = (Math.sin(sd * 12.9898) * 43758.5453) % 1, ry = (Math.sin(sd * 78.233) * 12543.21) % 1;
        const [vx, vy] = FLOAT_MOVE[kind] || [10, 0];
        const wob = Math.sin(t * 1.3 + i * 2.1) * 26;
        const sx = ((((Math.abs(rx) * (W + 2 * M) + vx * t + wob - camX * PX) % (W + 2 * M)) + W + 2 * M) % (W + 2 * M)) - M;
        const sy = ((((Math.abs(ry) * (H + 2 * M) + vy * t + Math.cos(t * 0.9 + i) * 14 - camY * PX) % (H + 2 * M)) + H + 2 * M) % (H + 2 * M)) - M;
        drawFloater(ctx, kind, sx, sy, t, i);
      }
    }
    ctx.restore();
  }
  // how each kind drifts (screen px a second, before the camera)
  const FLOAT_MOVE = { butterfly: [24, -8], gull: [46, 10], flake: [10, 34], leaf: [26, 30], bird: [60, -14], dust: [70, 6],
    bubble: [6, -26], firefly: [8, -6], shooting: [0, 0], ember: [8, -40], puff: [22, 5] };
  function drawFloater(ctx, kind, x, y, t, i) {
    if (kind === 'butterfly') {                      // two pairs of flapping wings
      const f = 0.35 + Math.abs(Math.sin(t * 11 + i * 1.7)) * 0.65, col = themeId() === 'jungle' ? ['#4cc9f0', '#ffd166'][i % 2] : ['#f15bb5', '#ffd166', '#9b5de5'][i % 3];
      ctx.save(); ctx.translate(x, y); ctx.rotate(0.4); ctx.scale(1.4, 1.4);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(10, 22, 9 * f, 5, 0, 0, 7); ctx.fill();   // its shadow
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.ellipse(s * 7 * f, -3, 7 * f, 6, 0, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(s * 5 * f, 5, 5 * f, 4.5, 0, 0, 7); ctx.fill(); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, 8); ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    } else if (kind === 'gull' || kind === 'bird') { // a bird seen from above + its shadow far below
      const f = Math.sin(t * (kind === 'gull' ? 3 : 7) + i) * 0.35, s = kind === 'gull' ? 1.3 : 0.9;
      const wing = (ox, oy, col, lw) => {
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
        ctx.moveTo(ox - 16 * s, oy - 4 * s + f * 10 * s); ctx.quadraticCurveTo(ox - 8 * s, oy - 9 * s, ox, oy);
        ctx.quadraticCurveTo(ox + 8 * s, oy - 9 * s, ox + 16 * s, oy - 4 * s + f * 10 * s); ctx.stroke();
      };
      wing(x + 34, y + 46, 'rgba(0,0,0,0.13)', 5);
      if (kind === 'gull') { wing(x, y, INK, 6.5); wing(x, y, '#ffffff', 3.5); } else wing(x, y, '#3b3355', 4);
    } else if (kind === 'flake') {
      ctx.beginPath(); ctx.arc(x, y, 3 + (i % 3) * 1.2, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(110,150,210,0.6)'; ctx.stroke();      // (a soft blue rim: shows on the snow too)
    } else if (kind === 'leaf') {                    // a falling leaf that spins as it goes
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2 + i); ctx.scale(1, 0.5 + Math.abs(Math.sin(t * 3 + i)) * 0.5);
      ctx.beginPath(); ctx.ellipse(0, 0, 9, 4.5, 0, 0, 7); ctx.fillStyle = ['#e07a1f', '#ffb703', '#d6452b'][i % 3]; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke(); ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.lineWidth = 1.2; ctx.stroke();
      ctx.restore();
    } else if (kind === 'dust') {                    // a little puff of sand blowing by
      ctx.fillStyle = 'rgba(255,240,210,0.35)';
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x - k * 9, y + Math.sin(t * 4 + k) * 2, 5 - k, 0, 7); ctx.fill(); }
    } else if (kind === 'bubble') {
      const r = 7 + (i % 3) * 3;
      ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.fillStyle = 'rgba(255,190,230,0.22)';
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
      D.circle(ctx, x - r * 0.35, y - r * 0.35, r * 0.22, '#ffffff', 0);
    } else if (kind === 'firefly') {                 // a glowing dot that pulses
      const a = 0.35 + 0.65 * Math.max(0, Math.sin(t * 2.4 + i * 1.9));
      const gr = ctx.createRadialGradient(x, y, 1, x, y, 16);
      gr.addColorStop(0, `rgba(240,255,150,${0.9 * a})`); gr.addColorStop(1, 'rgba(240,255,150,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 16, 0, 7); ctx.fill();
      D.circle(ctx, x, y, 3, `rgba(255,255,210,${a})`, 0);
    } else if (kind === 'shooting') {                // a shooting star now and then (every 9 s, for 1 s)
      const k = (t % 9);
      if (k > 1) return;
      const sx = W * 0.15 + (Math.floor(t / 9) * 271) % (W * 0.6), sy = H * 0.12 + k * 120;
      const ex = sx + k * 260;
      const gr = ctx.createLinearGradient(ex - 90, sy - 40, ex, sy);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, `rgba(255,250,210,${1 - k})`);
      ctx.strokeStyle = gr; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ex - 90, sy - 40); ctx.lineTo(ex, sy); ctx.stroke();
    } else if (kind === 'ember') {                   // a warm spark floating up
      const a = 0.4 + 0.5 * Math.abs(Math.sin(t * 3 + i));
      D.circle(ctx, x, y, 2.5 + (i % 2), `rgba(255,${140 + (i % 3) * 30},40,${a})`, 0);
    } else if (kind === 'puff') {                    // a see-through cloud drifting between you and the castle
      const s = 1.3 + (i % 2) * 0.5;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (const [ox, oy, r] of [[-26, 6, 22], [0, -6, 28], [26, 6, 22], [0, 10, 22]]) { ctx.beginPath(); ctx.arc(x + ox * s, y + oy * s, r * s, 0, 7); ctx.fill(); }
    }
  }

  function drawWorld(g, ctx) {
    ctx.fillStyle = theme.outer; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.translate(-Math.round(camX + W / 2), -Math.round(camY + H / 2));
    const vw = W / zoom / 2, vh = H / zoom / 2, mx = camX + W / 2, my = camY + H / 2;
    const vis = (x, y, m = 80) => Math.abs(x - mx) < vw + m && Math.abs(y - my) < vh + m;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    scNow = scT(g);
    drawGround(ctx, g, mx, my, vw, vh);           // the ground's texture (living backgrounds)

    // sea waves / far scenery that sits under the grass edge
    if (theme.kind === 'beach') {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 4;
      const wob = Math.sin(scNow * 1.5) * 6;
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
    if (!T.def.arena) { ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 6; ctx.setLineDash([40, 40]); ctx.stroke(T.mainPath); ctx.setLineDash([]); }

    // start / finish line: a checkered strip across the road (not in the Heart Battle arena)
    const p0 = pointAt(T.main, 0);
    if (!T.def.arena) {
    ctx.save();
    ctx.translate(p0.x, p0.y); ctx.rotate(Math.atan2(p0.ty, p0.tx));
    const cell = 13, rows = Math.ceil(2 * T.hw / cell);
    for (let r = 0; r < rows; r++) for (let k = 0; k < 2; k++) {
      ctx.fillStyle = (r + k) % 2 ? '#ffffff' : INK;
      ctx.fillRect(-cell + k * cell, -T.hw + r * (2 * T.hw / rows), cell, 2 * T.hw / rows + 0.5);
    }
    ctx.restore();
    }

    // skid marks
    ctx.strokeStyle = 'rgba(30,30,40,0.22)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath();
    for (const s of skids) { if (vis(s[0], s[1], 20)) { ctx.moveTo(s[0], s[1]); ctx.lineTo(s[2], s[3]); } }
    ctx.stroke();

    if (T.def.arena) drawArena(ctx, g.time, vis);      // Heart Battle: the flower ring, bumpers, the heart
    // boost pads (glowing arrows) and jump ramps
    for (const pd of pads) if (vis(pd.x, pd.y, 150)) drawPad(ctx, pd, g.time);
    // hazards
    for (const h of hazards) if (vis(h.x, h.y)) drawHazard(ctx, h, g.time);
    drawTraps(ctx, g.time, vis);
    for (const m of movers) if (vis(m.x, m.y, 120)) drawMover(ctx, m, g.time);
    if (!T.def.arena) for (const b of bumpers) if (vis(b.x, b.y, 80)) drawBumper(ctx, b);
    // coins on the track
    for (const cn of trackCoins) if (cn.t <= 0 && vis(cn.x, cn.y)) {
      const sq = Math.abs(Math.cos(g.time * 4 + cn.spin));          // spinning: gets thin and fat
      ctx.beginPath(); ctx.ellipse(cn.x, cn.y, 11 * Math.max(0.2, sq), 11, 0, 0, 7);
      ctx.fillStyle = '#ffc93c'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      if (sq > 0.5) { ctx.beginPath(); ctx.ellipse(cn.x, cn.y, 5 * sq, 5.5, 0, 0, 7); ctx.lineWidth = 2; ctx.strokeStyle = '#e09f3e'; ctx.stroke(); }
    }
    drawRushCoins(ctx, g.time, vis);              // Coin Rush
    drawFollow(ctx, g.time, vis);                 // Follow the Leader: Pip + the music notes
    // Time Trial ghost: a see-through car on your best lap
    if (ghost && ghost.f.length && player.lap >= 1 && !player.finished) {
      const fr = ghost.f[Math.min(ghost.f.length - 1, Math.floor((raceTime - player.lapStart) * 30))];
      if (fr && vis(fr[0], fr[1])) {
        ctx.save(); ctx.globalAlpha = 0.42; ctx.translate(fr[0], fr[1]); ctx.rotate(fr[2] / 100);
        drawCarShape(ctx, '#ffffff', { style: player.style });
        ctx.restore();
      }
    }
    // Daily Ghost Race: Boo, a see-through white car with a little ghost floating above it
    if (boo) {
      const b = booAt(raceTime);
      if (vis(b.x, b.y)) {
        ctx.save(); ctx.globalAlpha = 0.55; ctx.translate(b.x, b.y); ctx.rotate(b.a);
        drawCarShape(ctx, '#f4f1ff', {});
        ctx.restore();
        ctx.save(); ctx.globalAlpha = 0.9;
        drawItemIcon(ctx, 'phase', b.x, b.y - 46 + Math.sin(g.time * 4) * 5, 1.15);
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
    if (T.def.arena) for (const c of sorted) if (vis(c.x, c.y)) drawCarHearts(ctx, c, g.time);
    // figure-8 bridge: drawn over the road (and cars) below it, then the cars on top
    if (T.bridge) {
      drawBridge(ctx, g.time);
      for (const c of sorted) if (c.h > 0 && vis(c.x, c.y)) drawCar(ctx, c, g.time);
    }
    // bubbles, snowballs, boomerangs
    for (const b of bubbles) drawBubble(ctx, b.x, b.y, 16, g.time);
    drawShots(ctx, g.time);
    fx.draw(ctx);
    // popups float above things in the world
    drawCloudShadows(ctx, g, vis);                // soft cloud shadows drift over everything
    for (const p of popups) D.text(ctx, p.text, p.x, p.y, { size: p.size, color: p.color });
    ctx.restore();
    if (theme.night) drawNight(ctx);
    drawTimeWash(ctx);                            // sunset / dawn / evening tracks
    drawFloaters(ctx, g);                         // butterflies, gulls, leaves, embers...
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
    } else if (m.kind === 'ball') {                                              // a beach ball
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(5, 8, 23, 15, 0, 0, 7); ctx.fill();
      ctx.rotate(m.spin);
      ['#ef476f', '#ffffff', '#4cc9f0', '#ffffff', '#ffd166', '#ffffff'].forEach((col, i) => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 23, i * Math.PI / 3, (i + 1) * Math.PI / 3); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); });
      D.circle(ctx, 0, 0, 23, null, 4); D.circle(ctx, 0, 0, 6, '#ffffff', 3);
    } else if (m.kind === 'pumpkin') {                                           // a happy pumpkin
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(5, 8, 26, 16, 0, 0, 7); ctx.fill();
      for (const ox of [-11, 11]) { ctx.beginPath(); ctx.ellipse(ox, 0, 14, 21, 0, 0, 7); ctx.fillStyle = '#ff8c42'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke(); }
      ctx.beginPath(); ctx.ellipse(0, 0, 14, 22, 0, 0, 7); ctx.fillStyle = '#ffa45b'; ctx.fill(); ctx.stroke();
      D.box(ctx, -3, -29, 6, 10, 2, '#5aa65a', 3);
      for (const sg of [-1, 1]) D.circle(ctx, sg * 6, -4, 3, INK, 0);
      ctx.beginPath(); ctx.arc(0, 3, 7, 0.3, Math.PI - 0.3); ctx.lineWidth = 3; ctx.stroke();
    } else if (m.kind === 'tumbleweed') {                                        // a tumbleweed (a ball of twigs)
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(4, 8, 20 * (1 - m.z * 0.3), 12, 0, 0, 7); ctx.fill();
      ctx.translate(0, -m.z * 34); ctx.rotate(m.spin);
      D.circle(ctx, 0, 0, 22, '#d9a35b', 4);
      ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 3;
      for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(Math.cos(k * 1.3) * 6, Math.sin(k * 1.3) * 6, 12, k, k + 2.4); ctx.stroke(); }
    } else if (m.kind === 'rock' || m.kind === 'frog') {
      const lift = m.z * (m.kind === 'rock' ? 50 : 30);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(4, 8, 22 * (1 - m.z * 0.35), 13 * (1 - m.z * 0.35), 0, 0, 7); ctx.fill();
      ctx.translate(0, -lift);
      if (m.kind === 'rock') {                                                   // a bouncy moon rock with craters
        D.circle(ctx, 0, 0, 25, '#b8b5d6', 4);
        for (const [cx2, cy2, cr] of [[-8, -6, 6], [9, 4, 5], [-2, 11, 4]]) D.circle(ctx, cx2, cy2, cr, '#9590c0', 2.5);
        for (const sg of [-1, 1]) D.circle(ctx, sg * 7, -12, 2.5, INK, 0);
      } else {                                                                   // a little green frog (seen from above)
        ctx.rotate(m.a - Math.PI / 2);
        for (const sg of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sg * 15, 10, 7, 11, sg * 0.5, 0, 7); ctx.fillStyle = '#5cbf60'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); }
        ctx.beginPath(); ctx.ellipse(0, 2, 17, 15, 0, 0, 7); ctx.fillStyle = '#7bd389'; ctx.fill(); ctx.lineWidth = 3.5; ctx.stroke();
        for (const sg of [-1, 1]) { D.circle(ctx, sg * 8, -10, 6, '#ffffff', 3); D.circle(ctx, sg * 8, -10, 3, INK, 0); }
        ctx.beginPath(); ctx.arc(0, 2, 6, 0.3, Math.PI - 0.3); ctx.lineWidth = 2.5; ctx.stroke();
      }
    } else if (m.kind === 'puff') {                                              // a little cloud with a sleepy face
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(6, 16, 30, 12, 0, 0, 7); ctx.fill();
      for (const [ox, oy, r] of [[-16, 4, 15], [0, -6, 18], [16, 4, 15], [0, 8, 14]]) D.circle(ctx, ox, oy, r, '#ffffff', 4);
      for (const [ox, oy, r] of [[-16, 4, 12], [0, -6, 15], [16, 4, 12], [0, 8, 11]]) D.circle(ctx, ox, oy, r, '#ffffff', 0);
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5; for (const sg of [-1, 1]) { ctx.beginPath(); ctx.arc(sg * 7, -2, 3.5, 0.2, Math.PI - 0.2); ctx.stroke(); }
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
    const t = theme.kind, x = d.x, r = d.r;
    let y = d.y;
    ctx.lineWidth = 4; ctx.strokeStyle = INK;
    if (t === 'yard') {
      if (d.k < 0.7) {           // round bush (top view)
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.arc(x + 6, y + 8, 34 * r, 0, 7); ctx.fill();
        for (const [ox, oy, rr] of [[-14, 4, 22], [14, 6, 22], [0, -10, 24]]) D.circle(ctx, x + ox * r, y + oy * r, rr * r, theme.bush || '#3f8f3a', 4);
        D.circle(ctx, x - 6 * r, y - 14 * r, 7 * r, theme.bush2 || '#5cb85c', 0);
        if (d.k < 0.25) for (let i = 0; i < 3; i++) D.circle(ctx, x + (i - 1) * 12 * r, y + 4 * r, 5, '#ef476f', 2);
      } else if (d.k < 0.85) {   // stepping stone
        ctx.beginPath(); ctx.ellipse(x, y, 26 * r, 19 * r, d.a, 0, 7); ctx.fillStyle = '#c9c3b6'; ctx.fill(); ctx.stroke();
      } else {                   // big flower (nods a little in the breeze)
        const nod = Math.sin(scNow * 1.2 + d.x * 0.01) * 0.18;
        for (let i = 0; i < 6; i++) { const a = d.a + nod + i * 1.047; D.circle(ctx, x + Math.cos(a) * 16 * r, y + Math.sin(a) * 16 * r, 11 * r, '#ffafcc', 3); }
        D.circle(ctx, x, y, 11 * r, '#ffd166', 3);
      }
    } else if (t === 'beach') {
      if (d.k > 0.92) {          // swim ring floating in the sea (bobs and turns slowly)
        const by = Math.sin(scNow * 1.6 + d.x * 0.01) * 4, ba = d.a + Math.sin(scNow * 0.5 + d.y * 0.01) * 0.5;
        y += by;
        D.circle(ctx, x, y, 24 * r, '#ff6b6b', 4);
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x, y, 19 * r, ba + i * 1.57, ba + i * 1.57 + 0.6); ctx.strokeStyle = '#fff'; ctx.lineWidth = 9 * r; ctx.stroke(); }
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
        // bubbles that swell and pop, and puffs of smoke drifting away (living backgrounds)
        for (let k = 0; k < 2; k++) {
          const p = (scNow * 0.7 + k * 0.5 + d.a) % 1, bx = x + Math.cos(d.a * 3 + k * 2.5) * 12 * r, byy = y + Math.sin(d.a * 3 + k * 2.5) * 7 * r;
          if (p < 0.8) D.circle(ctx, bx, byy, 2 + p * 8 * r, '#ffb703', 2.5);
          const q = (scNow * 0.35 + k * 0.5 + d.a) % 1;
          ctx.fillStyle = `rgba(90,80,90,${0.32 * (1 - q)})`; ctx.beginPath(); ctx.arc(x + q * 46 * r + k * 10, y - q * 70 * r, (10 + q * 22) * r, 0, 7); ctx.fill();
        }
      } else {                           // big rock
        ctx.beginPath(); ctx.ellipse(x, y, 30 * r, 22 * r, d.a, 0, 7); ctx.fillStyle = theme.rock; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
        D.circle(ctx, x - 10 * r, y - 8 * r, 7 * r, 'rgba(255,255,255,0.3)', 0);
      }
    } else if (t === 'sky') {
      if (d.k < 0.75) {          // fluffy cloud
        for (const [ox, oy, rr] of [[-24, 6, 22], [0, -6, 28], [26, 6, 22], [0, 12, 22]]) D.circle(ctx, x + ox * r, y + oy * r, rr * r, '#ffffff', 4);
        for (const [ox, oy, rr] of [[-24, 6, 18], [0, -6, 24], [26, 6, 18], [0, 12, 18]]) D.circle(ctx, x + ox * r, y + oy * r, rr * r, '#ffffff', 0);
      } else {                   // a floating balloon (bobs gently)
        y += Math.sin(scNow * 1.5 + d.x * 0.01) * 5;
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
    } else if (style === 'ghostcar') { // Ghost Car (secret): a see-through ghost that floats, no wheels
      ctx.save(); ctx.globalAlpha *= 0.72;
      ctx.beginPath(); ctx.moveTo(-24, -15); ctx.lineTo(6, -15); ctx.arc(6, 0, 15, -Math.PI / 2, Math.PI / 2); ctx.lineTo(-24, 15);
      ctx.quadraticCurveTo(-31, 10, -24, 5); ctx.quadraticCurveTo(-31, 0, -24, -5); ctx.quadraticCurveTo(-31, -10, -24, -15); ctx.closePath();
      ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = L; ctx.strokeStyle = INK; ctx.stroke();
      area = [-21, -10, -5, 10];
      drawDecal(ctx, opts.decal, area, color);
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(10, -8, 5, 3, 0.5, 0, 7); ctx.fill();   // shine
      ctx.restore();
      eyes(8, 5.5, 4.8);
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(16, 0, 3, 0, 7); ctx.stroke();      // a little "ooo" mouth
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
  // (size = how many pixels across; My House's garage asks for a bigger one)
  function carImg(style, color, decal, size = 120) {
    const key = style + color + decal + size;
    if (carImgCache[key]) return carImgCache[key];
    const c = document.createElement('canvas'); c.width = c.height = size;
    const x = c.getContext('2d');
    x.scale(size / 120, size / 120);
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
    ctx.rotate(c.a + (c.drift ? c.drift.yaw : 0));   // (drifting: the tail swings out a little)
    if (c.isPlayer) ctx.scale(1.08, 1.08);
    if (c.sq && c.sq.a) ctx.scale(c.sq.sy, c.sq.sx);              // (game feel: squash short + wide / stretch long, see squashCar)
    if (c.mega > 0) { const k = Math.min(1, (5 - c.mega) * 4, c.mega * 3); ctx.scale(1 + 0.6 * k, 1 + 0.6 * k); }   // Mega Car: grows, then shrinks back
    if (c.h > 0) ctx.scale(1 + 0.16 * c.h, 1 + 0.16 * c.h);     // up on the bridge = closer to the camera
    if (c.wob > 0) ctx.rotate(Math.sin(time * 40) * 0.25 * (c.wob / 0.6));   // wobbling after a bump
    if (hop) ctx.scale(1 + hop * 0.35, 1 + hop * 0.35);
    let paint = c.color;
    if (c.fx === 'rainbow') paint = hueHex((time * 120) % 360);
    if (c.fx === 'neon' || c.fx === 'rainbow') { ctx.shadowColor = paint; ctx.shadowBlur = 16 + 6 * Math.sin(time * 6); }
    drawDriftSparks(ctx, c, time);
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
    if (c.grippy > 0) {        // Monster Wheels: chunky green tread marks round the car
      ctx.save(); ctx.rotate(c.a); ctx.fillStyle = '#2b2b2b';
      for (const [wx, wy] of [[-17, -19], [17, -19], [-17, 19], [17, 19]]) { D.box(ctx, wx - 10, wy - 7, 20, 14, 5, '#3a3a3a', 3); ctx.fillStyle = '#8ac926'; ctx.fillRect(wx - 6, wy - 2, 12, 4); }
      ctx.restore();
    }
    if (c.disco > 0) {         // Disco Ball: a sparkly ball spinning over your car + colored light spots
      const by = -70 + Math.sin(time * 4) * 3;
      for (let i = 0; i < 5; i++) { const a = time * 3 + i * 1.26; ctx.globalAlpha = 0.35; D.circle(ctx, Math.cos(a) * 90, Math.sin(a) * 60, 18, ['#ef476f', '#ffd166', '#06d6a0', '#4cc9f0', '#9b5de5'][i], 0); }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, by - 22); ctx.lineTo(0, by - 40); ctx.stroke();
      D.circle(ctx, 0, by, 18, '#dfe7ef', 3);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) if ((i + j + Math.floor(time * 6)) % 2) { ctx.fillStyle = '#ffffff'; ctx.fillRect(i * 9 - 3, by + j * 9 - 3, 6, 6); }
    }
    if (c.frozen > 0) {        // Freeze Flake: an icy ring + snowflakes
      ctx.fillStyle = 'rgba(189,224,254,0.45)'; ctx.beginPath(); ctx.arc(0, 0, 34, 0, 7); ctx.fill();
      for (let i = 0; i < 4; i++) { const a = time * 2 + i * Math.PI / 2; D.star(ctx, Math.cos(a) * 30, Math.sin(a) * 30, 6, '#ffffff', 1.5); }
    }
    if (c.shield > 0 && !(c.mega > 0) && (c.shield > 1.2 || Math.floor(time * 10) % 2)) {
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
    } else if (item === 'snowball') { // a big snowball with speed lines
      ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      for (const yy of [-8, 0, 8]) { ctx.beginPath(); ctx.moveTo(-22, yy); ctx.lineTo(-14, yy); ctx.stroke(); }
      D.circle(ctx, 4, 0, 16, '#ffffff', 3.5);
      ctx.strokeStyle = '#bcd7f0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(4, 0, 9, 0.3, 1.8); ctx.stroke();
    } else if (item === 'boomerang') {
      boomerangShape(ctx, 1);
    } else if (item === 'blaster') { // three bubbles together
      for (const [ox, oy] of [[-10, 6], [10, 6], [0, -9]]) { drawBubble(ctx, ox, oy, 10, performance.now() / 1000); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(ox, oy, 11, 0, 7); ctx.stroke(); }
    } else if (item === 'mega') {    // a big car with "grow" arrows
      D.box(ctx, -15, -10, 30, 20, 7, '#ff8fab', 3.5);
      D.box(ctx, -2, -8, 10, 16, 5, '#d6f1ff', 2.5);
      ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.beginPath(); ctx.moveTo(sx * 15, sy * 13); ctx.lineTo(sx * 21, sy * 19); ctx.moveTo(sx * 21, sy * 19); ctx.lineTo(sx * 21, sy * 13); ctx.moveTo(sx * 21, sy * 19); ctx.lineTo(sx * 15, sy * 19); ctx.stroke(); }
    } else if (item === 'freeze') {  // a big snowflake
      ctx.strokeStyle = INK; ctx.lineCap = 'round';
      for (const w of [8, 4]) { ctx.lineWidth = w; ctx.strokeStyle = w === 8 ? INK : '#9bf6ff'; for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * -19, Math.sin(a) * -19); ctx.lineTo(Math.cos(a) * 19, Math.sin(a) * 19); ctx.stroke(); } }
      D.circle(ctx, 0, 0, 6, '#ffffff', 3);
    } else if (item === 'fireworks') { // three little rockets
      [[-11, 4, '#ef476f', -0.5], [0, -3, '#ffd166', 0], [11, 4, '#06d6a0', 0.5]].forEach(([x, y, col, a]) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(a - Math.PI / 2);
        D.box(ctx, -9, -4, 16, 8, 3, col, 2.5);
        ctx.beginPath(); ctx.moveTo(7, -4); ctx.lineTo(13, 0); ctx.lineTo(7, 4); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
        ctx.restore();
      });
      D.star(ctx, 0, -16, 5, '#ffffff', 1.5);
    } else if (item === 'pogopad') {  // a green bouncy pad with a spring
      ctx.beginPath(); ctx.ellipse(0, 10, 19, 8, 0, 0, 7); ctx.fillStyle = '#06d6a0'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.lineWidth = 4; ctx.beginPath(); for (let k = 0; k <= 5; k++) ctx.lineTo(k % 2 ? 8 : -8, 8 - k * 4.5); ctx.stroke();
      D.box(ctx, -12, -20, 24, 7, 3, '#b9fbc0', 3);
    } else if (item === 'bubbletrap') { // a bubble sitting on a little stand
      D.box(ctx, -14, 12, 28, 7, 3, '#9b5de5', 3);
      drawBubble(ctx, 0, -2, 15, performance.now() / 1000); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(0, -2, 16, 0, 7); ctx.stroke();
    } else if (item === 'glitter') {  // a sparkly swirl of stars
      [[-10, 8, '#f15bb5', 8], [6, 4, '#ffd166', 9], [-2, -10, '#9bf6ff', 8], [13, -10, '#ffffff', 6]].forEach(([x, y, col, r]) => D.star(ctx, x, y, r, col, 2.5));
    } else if (item === 'grippy') {   // a big chunky wheel
      D.circle(ctx, 0, 0, 19, '#3a3a3a', 3.5);
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.fillStyle = '#8ac926'; ctx.save(); ctx.rotate(a); ctx.fillRect(13, -3, 6, 6); ctx.restore(); }
      D.circle(ctx, 0, 0, 8, '#dfe7ef', 3);
    } else if (item === 'balloon') {  // a water balloon
      ctx.beginPath(); ctx.ellipse(0, -2, 14, 17, 0, 0, 7); ctx.fillStyle = '#4cc9f0'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
      D.circle(ctx, -5, -8, 4, '#ffffff', 0); D.circle(ctx, 0, 17, 3.5, '#4cc9f0', 2.5);
    } else if (item === 'trio') {     // three little boost arrows
      for (const oy of [-11, 0, 11]) { ctx.beginPath(); ctx.moveTo(-10, oy - 6); ctx.lineTo(6, oy); ctx.lineTo(-10, oy + 6); ctx.closePath(); ctx.fillStyle = '#ff8c42'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke(); }
      ctx.font = '900 14px Arial Black, sans-serif'; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText('3', 14, 6);
    } else if (item === 'lucky') {    // a box with a question mark
      D.box(ctx, -16, -14, 32, 30, 7, '#ffd166', 3.5);
      ctx.font = '900 24px Arial Black, sans-serif'; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 0, 2);
    } else if (item === 'bee') {      // a friendly bee
      ctx.beginPath(); ctx.ellipse(-4, -12, 8, 6, -0.4, 0, 7); ctx.ellipse(6, -12, 8, 6, 0.4, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 2, 17, 12, 0, 0, 7); ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.lineWidth = 3.5; ctx.stroke();
      ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-5, -9); ctx.lineTo(-5, 13); ctx.moveTo(3, -9); ctx.lineTo(3, 13); ctx.stroke();
      D.circle(ctx, 11, 0, 2.5, INK, 0);
    } else if (item === 'whirl') {    // a little whirlwind
      ctx.strokeStyle = INK; ctx.lineCap = 'round';
      [[-16, 16, -12], [-12, 12, -3], [-8, 8, 6], [-4, 5, 14]].forEach(([a, b, y]) => { ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(a, y); ctx.lineTo(b, y); ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = '#bde0fe'; ctx.stroke(); });
    } else if (item === 'dragon') {   // a little green dragon face
      for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sg * 8, -12); ctx.lineTo(sg * 13, -22); ctx.lineTo(sg * 15, -10); ctx.closePath(); ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke(); }
      D.circle(ctx, 0, 0, 16, '#06d6a0', 3.5);
      ctx.beginPath(); ctx.ellipse(0, 8, 10, 6, 0, 0, 7); ctx.fillStyle = '#b9fbc0'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
      D.circle(ctx, -6, -4, 3, INK, 0); D.circle(ctx, 6, -4, 3, INK, 0);
      drawBubble(ctx, 18, -14, 6, performance.now() / 1000);
    } else if (item === 'swap') {     // two arrows going round each other
      ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.lineCap = 'round';
      for (const [col, a0] of [['#9b5de5', 0], ['#f15bb5', Math.PI]]) {
        ctx.beginPath(); ctx.arc(0, 0, 14, a0 + 0.3, a0 + 2.6); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.stroke();
        const ax = Math.cos(a0 + 2.6) * 14, ay = Math.sin(a0 + 2.6) * 14;
        ctx.save(); ctx.translate(ax, ay); ctx.rotate(a0 + 2.6 + Math.PI / 2);
        ctx.beginPath(); ctx.moveTo(-7, -6); ctx.lineTo(4, 0); ctx.lineTo(-7, 6); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
      }
    } else if (item === 'disco') {    // a disco ball
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, -15); ctx.stroke();
      D.circle(ctx, 0, 2, 16, '#dfe7ef', 3.5);
      ctx.save(); ctx.beginPath(); ctx.arc(0, 2, 15, 0, 7); ctx.clip();
      for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) if ((i + j) % 2) { ctx.fillStyle = ['#9bf6ff', '#ffd166', '#f15bb5'][(i + j + 6) % 3]; ctx.fillRect(i * 7 - 3, 2 + j * 7 - 3, 6, 6); }
      ctx.restore();
    } else if (item === 'coins') {  // a little bag of coins
      ctx.beginPath(); ctx.moveTo(-14, 16); ctx.quadraticCurveTo(-20, -4, -6, -8); ctx.lineTo(6, -8); ctx.quadraticCurveTo(20, -4, 14, 16); ctx.closePath();
      ctx.fillStyle = '#c68b59'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
      D.circle(ctx, 0, 4, 8, '#ffc93c', 3);
      D.box(ctx, -7, -14, 14, 7, 3, '#e9c46a', 3);
    }
    ctx.restore();
  }

  function drawHUD(g, ctx) {
    if (mode === 'battle') { drawBattleHUD(g, ctx); return; }
    if (mode === 'rush' && rush) { drawRushHUD(g, ctx); return; }
    if (mode === 'follow' && lead) { drawFollowHUD(g, ctx); return; }
    // Free Drive: no laps or places, just the time, your stars and a pointer to the closest star
    if (mode === 'drive') {
      D.text(ctx, raceTime.toFixed(1) + 's', 104, 40, { size: 24, align: 'left', color: '#fff' });
      D.box(ctx, W / 2 - 92, 12, 184, 64, 20, 'rgba(255,255,255,0.75)', 4);
      D.star(ctx, W / 2 - 50, 44, 22 * g.juice.size('stars'), '#ffd166', 4);
      D.text(ctx, starsGot + '/' + driveStars.length, W / 2 + 26, 46, { size: 36 * g.juice.size('stars') });
      drawMinimap(ctx);
      let best = null, bd = Infinity;
      for (const st of driveStars) if (!st.got) { const d = Math.hypot(st.x - player.x, st.y - player.y); if (d < bd) { bd = d; best = st; } }
      if (best && !player.finished) edgeArrow(ctx, best.x, best.y, '#ffd166', 'star', g.time);
      return;
    }
    // lap (with a checkered flag) — top left, right of the home button
    drawFlag(ctx, 104, 18);
    D.text(ctx, Math.max(1, Math.min(player.lap, laps)) + '/' + laps, 146, 36, { size: 34 * g.juice.size('lap'), align: 'left' });
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
    // Daily Ghost Race: a race bar (you and Boo moving toward the flag), your place,
    // and an arrow to Boo when he's ahead and off the screen
    if (mode === 'daily' && boo) {
      const b = booAt(raceTime), start = T.L - 70, goal = (laps + 1) * T.L;
      const bx = W / 2 - 170, by = 30, bw = 340;
      D.box(ctx, bx - 14, by - 22, bw + 64, 44, 22, 'rgba(255,255,255,0.75)', 4);
      ctx.fillStyle = '#c9d6e3'; ctx.fillRect(bx, by - 4, bw, 8);
      drawFlag(ctx, bx + bw + 8, by - 18);
      const at = (pr) => bx + bw * math.clamp((pr - start) / (goal - start), 0, 1);
      drawItemIcon(ctx, 'phase', at(b.p), by, 0.9);
      D.circle(ctx, at(player.finished ? goal : player.progress), by, 13, player.color, 4);
      const pos = player.position;
      if (countdown <= 0) D.text(ctx, pos === 1 ? '1st' : '2nd', W - 170, 50, { size: 40, color: pos === 1 ? '#ffc93c' : '#dfe7ef' });
      drawMinimap(ctx);
      if (pos === 2 && !player.finished && raceTime < boo.t) edgeArrow(ctx, b.x, b.y, '#f4f1ff', 'dot', g.time);
      return;
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

    drawItemSlot(g, ctx);
    drawMinimap(ctx);
    drawLadder(ctx);
    // the car just ahead of you is off the screen? A little arrow in its color shows where it is.
    const next = racers().find(o => o.position === pos - 1);
    if (next && !player.finished && raceTime > 2) edgeArrow(ctx, next.x, next.y, next.color, 'car', g.time);
    drawWrongWay(g, ctx);
  }
  // item slot — top middle
  function drawItemSlot(g, ctx) {
    const ix = W / 2, iy = 44;
    const ready = !!player.item;
    const pulse = (ready ? 1 + Math.sin(g.time * 8) * 0.05 : 1) * g.juice.size('item');   // (boings when you get an item)
    ctx.save(); ctx.translate(ix, iy); ctx.scale(pulse, pulse);
    // the slot's color shows the item's kind: cream = common, green = uncommon, gold = rare
    const kind = ready ? RARITY[player.item] : null;
    D.box(ctx, -34, -34, 68, 68, 16, ready ? RARITY_COLOR[kind] : 'rgba(255,255,255,0.6)', 4);
    if (kind === 'rare' || kind === 'special') {   // rare + special items sparkle
      for (let i = 0; i < 4; i++) { const a = g.time * 3 + i * Math.PI / 2; D.star(ctx, Math.cos(a) * 40, Math.sin(a) * 40, 6, '#fff', 1.5); }
    }
    ctx.restore();
    if (ready) drawItemIcon(ctx, player.item, ix, iy, 1.25 * g.juice.size('item'));
    else { ctx.globalAlpha = 0.35; drawBoxIcon(ctx, ix, iy); ctx.globalAlpha = 1; }
  }
  function drawWrongWay(g, ctx) {
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
    if (boo) { const b = booAt(raceTime); D.circle(ctx, mx + ox + b.x * sc, my + oy + b.y * sc, 7, '#f4f1ff', 2.5); }
    if (rush) for (const cn of rush.coins) if (cn.kind === 'clock' && cn.t <= 0) D.circle(ctx, mx + ox + cn.x * sc, my + oy + cn.y * sc, 5, '#06d6a0', 2);
    if (lead) { const p = pipAt(); D.circle(ctx, mx + ox + p.x * sc, my + oy + p.y * sc, 7, PIP_COLOR, 2.5); }
    // cars (you on top, bigger)
    for (const c of racers().slice().sort((a, b) => a.isPlayer - b.isPlayer)) {
      D.circle(ctx, mx + ox + c.x * sc, my + oy + c.y * sc, c.isPlayer ? 8 : 6, c.color, c.isPlayer ? 3 : 2);
    }
  }

  function render(g, ctx) {
    if (!T) { ctx.fillStyle = '#4f9d4a'; ctx.fillRect(0, 0, W, H); return; }
    drawWorld(g, ctx);
    drawHUD(g, ctx);
    if (party) drawParty(ctx, g.time);
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
    /* results: a bit smaller medal, stars and podium, so the buttons always fit (Keith's screenshot, Nov 19) */
    .ar-panel.rc-screen.ar-results > svg, .ar-panel.rc-screen.ar-results .ar-medal { width: 66px !important; height: 66px !important; }
    .ar-panel.rc-screen.ar-results .ar-bigstars { margin: 0; }
    .ar-panel.rc-screen.ar-results .ar-bigstars svg { width: 60px; height: 60px; }
    .ar-panel.rc-screen.ar-results .ar-bigstars svg:nth-child(2) { width: 72px; height: 72px; }
    .ar-panel.rc-screen.ar-results .rc-podium-wrap { zoom: 0.85; }
    .ar-panel.rc-screen:has(.rc-head) { justify-content: flex-start; }   /* our menus: title always at the top */
    .ar-panel.rc-screen > .rc-body, .ar-panel.rc-screen > .rc-modes { margin-top: auto; margin-bottom: auto; }
    .rc-head { display: flex; align-items: center; gap: 8px; }
    /* ---- a phone held upright (Nov 20): narrower panels, fewer tiles across, scroll if long ---- */
    html.rc-tall .ar-panel.rc-screen { width: 540px; height: var(--rc-h, 900px); overflow-y: auto; justify-content: flex-start; }
    html.rc-tall .ar-panel.rc-screen.rc-wide { width: 880px; height: 620px; overflow: hidden; zoom: var(--rc-zoomw, 1); }
    html.rc-tall .rc-mypic svg { width: 100% !important; height: auto !important; }
    html.rc-tall .rc-mypic { height: auto !important; }
    html.rc-tall .ar-panel.rc-screen > .rc-body, html.rc-tall .ar-panel.rc-screen > .rc-modes { margin-top: 12px; margin-bottom: 12px; }
    html.rc-tall .rc-modes.rc-modes5, html.rc-tall .rc-modes.rc-modes4, html.rc-tall .rc-modes.rc-modes3, html.rc-tall .rc-play5 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    html.rc-tall .rc-book { grid-template-columns: repeat(5, 1fr); }
    html.rc-tall .ar-panel.rc-screen .ar-btn { min-height: 76px; font-size: 22px; }
    html.rc-tall .ar-panel.rc-screen .ar-btns { flex-wrap: wrap; }
    html.rc-tall .rc-shelf-row { flex-wrap: wrap; row-gap: 8px; }
    html.rc-tall .rc-shelf-row.top { padding: 0; }
    html.rc-small .ar-panel.rc-screen .ar-btn { min-height: 112px; font-size: 28px; padding-left: 22px; padding-right: 22px; }
    html.rc-small .ar-panel.rc-screen .ar-btn svg { width: 44px; height: 44px; }
    html.rc-small .ar-panel.rc-screen .rc-modes .ar-tile .meta { display: none; }
    html.rc-small .ar-panel.rc-screen .rc-head .ar-btn { min-height: 92px; }
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
    .rc-modes.rc-modes3 { grid-template-columns: repeat(3, minmax(0, 1fr)); max-width: 820px; }
    .rc-modes.rc-modes4 { grid-template-columns: repeat(4, minmax(0, 1fr)); max-width: 860px; }
    .rc-modes.rc-modes5 { grid-template-columns: repeat(5, minmax(0, 1fr)); max-width: 870px; gap: 10px; }
    .rc-modes5 .ar-tile { padding-left: 4px; padding-right: 4px; }
    /* Coin Rush / Follow the Leader track picker */
    .rc-how { display: flex; align-items: center; justify-content: center; gap: 14px; }
    .rc-how svg { width: 64px; height: 64px; }
    .rc-how .rc-arrow { font-size: 34px; font-weight: 900; }
    .rc-play5 { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; width: 100%; }
    .rc-play5 .ar-tile { min-height: 0; padding: 6px 4px; }
    .rc-play5 .meta svg { width: 18px; height: 18px; vertical-align: -3px; }
    /* The Item Book */
    .rc-book-count { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 24px; margin-top: -6px; }
    .rc-book-count svg { width: 34px; height: 34px; }
    .rc-book { display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; width: 100%; }
    .rc-card { position: relative; background: var(--rc); border: 4px solid #2b2b2b; border-radius: 12px; padding: 3px 2px 4px; text-align: center;
      display: flex; flex-direction: column; align-items: center; color: #2b2b2b; min-height: 108px; box-sizing: border-box; }
    .rc-card.unknown { background: #e8e2d4; }
    .rc-card-pic { position: relative; width: 50px; height: 50px; }
    .rc-card-pic img { width: 50px; height: 50px; display: block; }
    .rc-card b { font-size: 13px; line-height: 1.05; }
    .rc-card small { font-size: 11px; line-height: 1.05; opacity: 0.85; }
    .rc-card .rc-n { position: absolute; top: 2px; right: 6px; font-size: 13px; font-weight: 900; }
    .rc-card .rc-q { position: absolute; inset: 0; display: grid; place-items: center; font-size: 34px; font-weight: 900; color: #2b2b2b; }
    .rc-card .rc-lock { position: absolute; right: -8px; bottom: -4px; width: 32px; height: 32px; }
    .rc-card .rc-lock svg { width: 32px; height: 32px; }
    .rc-card.locked { background: #f3d1dc; }
    /* Heart Battle */
    .rc-hb-how { display: flex; align-items: center; justify-content: center; gap: 12px; }
    .rc-hb-how svg { width: 64px; height: 64px; }
    .rc-hb-how .rc-hb-hearts svg { width: auto !important; height: 34px !important; }
.rc-hb-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 20px !important; font-weight: 900; line-height: 1; color: #2b2b2b; }
    .rc-hb-badge svg { width: 20px !important; height: 18px !important; }
    /* Daily Ghost Race */
    .rc-boo-tile { position: relative; display: inline-block; animation: rcFloat 1.6s ease-in-out infinite alternate; }
    .rc-boo-tile .rc-tick { position: absolute; right: -14px; bottom: -4px; width: 40px; height: 40px; animation: none; }
    .rc-boo-tile .rc-tick svg { width: 40px !important; height: 40px !important; }
    .rc-boo-res { display: flex; flex-direction: column; align-items: center; gap: 6px; margin-top: 4px; }
    .rc-boo-row { display: flex; align-items: center; gap: 14px; padding: 4px 18px; border-radius: 18px; background: rgba(255,255,255,0.12);
      animation: rcRise 0.5s cubic-bezier(.3,1.5,.5,1) both; animation-delay: var(--d); font-size: 24px; }
    .rc-boo-row.win { background: rgba(255,209,102,0.3); box-shadow: 0 0 0 4px #ffd166; }
    .rc-boo-row img, .rc-boo-pic svg { width: 56px; height: 56px; display: block; }
    .rc-boo-place { font-family: 'Lilita One', 'Arial Black', sans-serif; font-size: 34px; width: 64px; }
    .rc-boo-star svg { width: 40px; height: 40px; display: block; animation: rcTw 0.8s ease-in-out infinite alternate; }
    .rc-boo-wins { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 8px; font-size: 28px; }
    .rc-boo-wins svg { width: 48px; height: 60px; }
    .rc-boo-new { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 26px; color: #ffd166; }
    .rc-boo-new img { width: 84px; height: 84px; animation: rcFloat 0.9s ease-in-out infinite alternate; filter: drop-shadow(0 0 10px #fff); }
    @keyframes rcFloat { to { transform: translateY(-6px); } }
    /* Trophy shelf */
    .rc-shelf { width: 100%; max-width: 820px; align-self: center; position: relative; background: #fdf0d5; border: 5px solid #2b2b2b;
      border-radius: 22px; padding: 10px 22px 8px; box-sizing: border-box; color: #2b2b2b; margin-top: 4px; }
    .rc-shelf-count { position: absolute; left: 16px; top: 8px; display: flex; align-items: center; gap: 4px; font-size: 22px; }
    .rc-shelf-count svg { width: 34px; height: 34px; }
    .rc-shelf-row { display: flex; justify-content: space-around; align-items: flex-end; }
    .rc-shelf-row.top { padding: 0 60px; }
    .rc-plank { height: 12px; background: #b07445; border: 4px solid #2b2b2b; border-radius: 6px; margin: 0 -12px 8px; box-shadow: 0 6px 0 rgba(0,0,0,0.12); }
    .rc-tro { background: none; border: none; padding: 0; margin: 0; cursor: pointer; display: flex; flex-direction: column; align-items: center;
      font: inherit; color: inherit; min-width: 78px; position: relative; -webkit-tap-highlight-color: transparent; }
    .rc-tro svg.tro { width: 56px; height: 70px; display: block; }
    .rc-tro.big svg.tro { width: 80px; height: 100px; }
    .rc-tro.got svg.tro { filter: drop-shadow(0 0 6px rgba(255,209,102,0.8)); }
    .rc-tro-count { position: absolute; right: -6px; top: 4px; background: #fff; border: 3px solid #2b2b2b; border-radius: 999px; padding: 0 7px;
      font-family: 'Lilita One', 'Arial Black', sans-serif; font-size: 17px; }
    .rc-plaque { display: flex; align-items: center; gap: 2px; margin-top: 2px; }
    .rc-plaque .tp svg { width: 58px; height: 34px; display: block; }
    .rc-plaque .bd { width: 22px; height: 22px; opacity: 0.18; filter: grayscale(1); }
    .rc-plaque .bd.on { opacity: 1; filter: none; }
    .rc-plaque .bd svg { width: 22px; height: 22px; display: block; }
    .rc-plaque .tp, .rc-plaque .bd { display: block; }
    .rc-tro.hop { animation: rcHop 0.55s ease-out; }
    @keyframes rcHop { 30% { transform: translateY(-20px) rotate(-6deg); } 60% { transform: translateY(0) rotate(4deg); } }
    .rc-shelf-say { display: flex; align-items: center; justify-content: center; gap: 12px; min-height: 64px; font-size: 22px; }
    .rc-shelf-say .rc-say-pic svg { width: 70px; height: 52px; display: block; }
    .rc-shelf-say .rc-say-name b { color: #ef476f; }
    .rc-bigpic { height: 86px !important; }
    .rc-bigpic svg, .rc-bigpic img { height: 86px !important; width: 86px !important; }
    @keyframes rcGlow { from { filter: drop-shadow(0 0 2px #fff) brightness(1); } to { filter: drop-shadow(0 0 9px #fff) brightness(1.25); } }
    @keyframes rcHue { from { filter: hue-rotate(0deg) saturate(1.3); } to { filter: hue-rotate(360deg) saturate(1.3); } }
    @keyframes rcShine { from { filter: brightness(1); } to { filter: brightness(1.3) drop-shadow(0 0 5px #ffd166); } }`));
  // Shrink the menu panels to fit the screen (phones!), keeping their shape.
  function fitPanels() {
    // (36 = the overlay padding + a little gap; phones keep a 5% border all round)
    const f = document.documentElement.classList.contains('ar-phone') ? 0.9 : 1;
    // A phone held upright (Nov 20): the wide 880 x 620 menus would shrink to a third and the
    // buttons got tiny. Upright, the menus are 540 wide and as tall as the screen, with fewer
    // tiles across (see .rc-tall in the CSS), and a long menu scrolls.
    const tall = innerHeight > innerWidth * 1.15;
    document.documentElement.classList.toggle('rc-tall', tall);
    const kWide = Math.min(1, (innerWidth * f - 36) / 880, (innerHeight * f - 36) / 620);
    const k = tall ? Math.min(1, (innerWidth * f - 36) / 540) : kWide;
    document.documentElement.style.setProperty('--rc-zoom', k.toFixed(3));
    // small screens (phones sideways): everything is drawn at under 60%, so the buttons get extra big
    // and the little words under the tiles go (see .rc-small in the CSS)
    document.documentElement.classList.toggle('rc-small', k < 0.6);
    document.documentElement.style.setProperty('--rc-zoomw', kWide.toFixed(3));   // (the Track Builder stays wide: .rc-wide)
    if (tall) document.documentElement.style.setProperty('--rc-h', Math.floor((innerHeight * f - 36) / k) + 'px');
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

  // Boo, the friendly ghost car driver of the Daily Ghost Race (an original drawing)
  const BOO_PIC = `<svg viewBox="0 0 80 80"><path d="M16 70 V36 A24 24 0 0 1 64 36 V70 Q58 62 52 70 Q46 62 40 70 Q34 62 28 70 Q22 62 16 70 Z" fill="#f4f1ff" stroke="#2b2b2b" stroke-width="5" stroke-linejoin="round"/>` +
    `<ellipse cx="31" cy="38" rx="5" ry="7" fill="#2b2b2b"/><ellipse cx="49" cy="38" rx="5" ry="7" fill="#2b2b2b"/><circle cx="33" cy="35" r="2" fill="#fff"/><circle cx="51" cy="35" r="2" fill="#fff"/>` +
    `<circle cx="24" cy="49" r="4" fill="#ffadc6"/><circle cx="56" cy="49" r="4" fill="#ffadc6"/><path d="M34 50 Q40 56 46 50" fill="none" stroke="#2b2b2b" stroke-width="3.5" stroke-linecap="round"/></svg>`;

  // ---- Trophy shelf pictures ----
  // shape: 'cup' (Grand Prix), 'mini' (Mini Cup), 'track' (one per track), 'ghost', 'star'
  // medal: 'gold' | 'silver' | 'bronze', or null = not won yet (a dashed outline to aim for)
  const MEDAL_COL = { gold: ['#ffd166', '#e09f3e'], silver: ['#eef3f7', '#a9b4c2'], bronze: ['#eaa46c', '#b5703a'] };
  function trophySVG(shape, medal) {
    const [c1, c2] = MEDAL_COL[medal] || ['rgba(255,255,255,0.55)', '#b8c2cc'];
    const ln = medal ? 'stroke="#2b2b2b" stroke-width="4.5"' : 'stroke="#9aa7b5" stroke-width="4" stroke-dasharray="6 5"';
    const lj = ' stroke-linejoin="round" stroke-linecap="round"';
    const base = `<rect x="20" y="84" width="40" height="13" rx="3" fill="${medal ? '#8a5a3c' : 'rgba(255,255,255,0.4)'}" ${ln}/>` +
      `<path d="M34 64 H46 L48 84 H32 Z" fill="${c2}" ${ln}${lj}/>`;
    const shine = medal ? '<ellipse cx="0" cy="0" rx="4" ry="8" fill="#fff" opacity="0.75"/>' : '';
    let top = '';
    if (shape === 'cup' || shape === 'mini' || shape === 'track') {
      const w = shape === 'cup' ? 26 : shape === 'mini' ? 21 : 19, y0 = shape === 'cup' ? 10 : 18;
      top = `<path d="M${40 - w} ${y0 + 6} H${40 - w - 10} Q${40 - w - 10} ${y0 + 30} ${40 - w + 8} ${y0 + 36} M${40 + w} ${y0 + 6} H${40 + w + 10} Q${40 + w + 10} ${y0 + 30} ${40 + w - 8} ${y0 + 36}" fill="none" ${ln}${lj}/>` +
        `<path d="M${40 - w} ${y0} H${40 + w} V${y0 + 22} A${w} ${64 - y0 - 22} 0 0 1 ${40 - w} ${y0 + 22} Z" fill="${c1}" ${ln}${lj}/>` +
        (medal ? `<g transform="translate(${40 - w * 0.5} ${y0 + 16}) rotate(-12)">${shine}</g>` : '') +
        (shape === 'track' && medal ? [0, 1, 2, 3].map(k => `<rect x="${31 + k * 4.5}" y="${y0 + 8}" width="4.5" height="4.5" fill="${k % 2 ? '#fff' : '#2b2b2b'}"/><rect x="${31 + k * 4.5}" y="${y0 + 12.5}" width="4.5" height="4.5" fill="${k % 2 ? '#2b2b2b' : '#fff'}"/>`).join('') : '') +
        (shape === 'cup' && medal ? `<path d="M40 22 L43.5 30 L52 30.5 L45.5 36 L47.5 44 L40 39.5 L32.5 44 L34.5 36 L28 30.5 L36.5 30 Z" fill="#fff" stroke="#2b2b2b" stroke-width="2.5" stroke-linejoin="round"/>` : '');
    } else if (shape === 'ghost') {
      top = `<path d="M20 66 V34 A20 20 0 0 1 60 34 V66 Q55 59 50 66 Q45 59 40 66 Q35 59 30 66 Q25 59 20 66 Z" fill="${c1}" ${ln}${lj}/>` +
        (medal ? `<ellipse cx="32" cy="36" rx="4" ry="6" fill="#2b2b2b"/><ellipse cx="48" cy="36" rx="4" ry="6" fill="#2b2b2b"/><circle cx="33.5" cy="33.5" r="1.6" fill="#fff"/><circle cx="49.5" cy="33.5" r="1.6" fill="#fff"/>` +
          `<path d="M35 47 Q40 52 45 47" fill="none" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/><g transform="translate(27 24) rotate(-25)">${shine}</g>` : '');
    } else if (shape === 'star') {
      top = `<path d="M40 8 L48.5 28 L70 29.5 L53.5 43.5 L58.5 64.5 L40 53 L21.5 64.5 L26.5 43.5 L10 29.5 L31.5 28 Z" fill="${c1}" ${ln}${lj}/>` +
        (medal ? `<g transform="translate(33 30) rotate(-20)">${shine}</g>` : '');
    }
    return `<svg class="tro" viewBox="0 0 80 100">${base}${top}</svg>`;
  }
  // Ghost trophy: bronze after beating Boo once, silver after 5 days, gold after 10
  const booLevel = (n) => n >= 10 ? 'gold' : n >= 5 ? 'silver' : n >= 1 ? 'bronze' : null;
  // Free Drive trophy: all stars on 1 track = bronze, 5 tracks = silver, all 10 = gold
  const starLevel = (n) => n >= TRACKS.length ? 'gold' : n >= 5 ? 'silver' : n >= 1 ? 'bronze' : null;

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
    if (CANVAS) {
      // (canvas menus, Nov 21: the shared Friends screens from arcade/net.js)
      Arcade.net.friendsScreen({ id: 'rc-friends', title: '', onBack: () => { leaveRoom(); trackMenu(g, 'free'); },
        onMake: () => { openRoom(g, Arcade.net.newCode()); lobby(g); }, onJoin: () => joinScreen(g) });
      return;
    }
    const p = screen('Friends', () => { leaveRoom(); trackMenu(g, 'free'); });
    const grid = Arcade.h('div', { class: 'ar-grid rc-modes' });
    const MAKE = `<svg viewBox="0 0 120 70"><rect width="120" height="70" rx="8" fill="#ffd166"/>${[0, 1, 2].map(i => `<g transform="translate(${8 + i * 36} 18) scale(0.34)">${Arcade.net.pic([0, 3, 6][i], 100).replace(/<\/?svg[^>]*>/g, '')}</g>`).join('')}</svg>`;
    grid.appendChild(bigTile(MAKE, 'Make a room', 'friends tap your pictures', () => { openRoom(g, Arcade.net.newCode()); lobby(g); }, { 'data-host': '1' }));
    grid.appendChild(bigTile(`<svg viewBox="0 0 120 70"><rect width="120" height="70" rx="8" fill="#bde0fe"/><g transform="translate(36 2) scale(1.4)">${FRIENDS_PIC.replace(/<\/?svg[^>]*>/g, '')}</g></svg>`, 'Join', 'tap the 3 pictures', () => joinScreen(g), { 'data-joinroom': '1' }));
    p.appendChild(grid);
    g.panel(p);
  }
  function joinScreen(g) {
    const joined = (code) => {
      openRoom(g, code);
      room.on('full', () => { Arcade.sfx('aww'); g.toast('That room is full'); leaveRoom(); friendsMenu(g); });
      lobby(g);
    };
    if (CANVAS) { Arcade.net.joinScreen({ id: 'rc-join', onDone: joined, onBack: () => friendsMenu(g) }); return; }
    const p = screen('Join', () => friendsMenu(g));
    p.appendChild(Arcade.net.picker(joined));
    g.panel(p);
  }
  // The lobby: the room's pictures, everyone who's in, and (for whoever made the
  // room) the tracks: tap one and every phone starts that race together.
  // the tracks the room maker can pick: the 10 tracks + their own built ones (they travel packed small)
  function lobbyTracks(g) {
    const out = TRACKS.map(t => ({ id: 'fr-' + t.id, pic: trackPic(t), name: t.name, go: () => {
      Arcade.sfx('go'); weather = 'sun'; g.save.data.weather = 'sun'; room.send({ t: 'start', track: t.id, weather: 'sun' }); g.play({ id: 'fr-' + t.id });
    } }));
    builder().slots(g).forEach((mt, s) => {
      if (!mt || !mt.ok) return;
      const pk = builder().pack(mt), d = builder().defFrom(builder().unpack(pk), 'f');
      out.push({ id: 'fr-my' + s, pic: trackPic(d), name: '', mine: s, go: () => {
        Arcade.sfx('go'); sharedTrack = Object.assign(d, { pack: pk });
        weather = d.weather || 'sun'; g.save.data.weather = weather;
        room.send({ t: 'start', track: d.id, weather, mt: pk }); g.play({ id: 'fr-' + d.id });
      } });
    });
    return out;
  }
  function lobbyScreen(g) {
    const back = () => { lobbyPaint = null; leaveRoom(); friendsMenu(g); };
    let first = true;
    lobbyPaint = () => {
      if (!first && ArcadeMenus.screen() !== 'rc-lobby') return;     // (racing: don't pop the lobby up over the race)
      first = false;
      const host = room && room.seat === Math.min(...room.players);
      const rows = [Arcade.net.codeRow(roomCode, 76),
        Arcade.net.playersRow([Arcade.profiles.active()].concat(Object.values(peers).map(m => ({ pet: m.pet, color: m.color }))))];
      if (host) rows.push({ t: 'tiles', w: 140, h: 140, items: lobbyTracks(g).map(t => ({
        pic: t.pic, name: t.name, meta: t.mine != null ? [{ svg: builder().PICS.pencil }, { text: String(t.mine + 1) }] : [], attr: 'track-' + t.id, onTap: t.go })) });
      else rows.push({ t: 'pics', items: [FLAG_PIC], size: 100 });     // (waiting for the room maker to pick a track)
      ArcadeMenus.open({ id: 'rc-lobby', rows, footer: backFooter(back), onKey: (c) => { if (c === 'Escape') back(); } });
    };
    room.on('hello', () => lobbyPaint && lobbyPaint());
    room.on('join', () => lobbyPaint && lobbyPaint());
    lobbyPaint();
  }
  function lobby(g) {
    if (CANVAS) { lobbyScreen(g); return; }
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
        for (const t of lobbyTracks(g)) {
          const label = t.mine != null ? `${builder().PICS.pencil.replace('<svg', '<svg style="width:26px;height:26px;vertical-align:middle"')} ${t.mine + 1}` : t.name;
          const b = Arcade.h('button', { type: 'button', class: 'ar-tile', 'data-track': t.id }, `<div class="pic">${t.pic}</div><div>${label}</div>`);
          b.addEventListener('click', t.go);
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

  // My House's garage shows your RC car: keep a small picture of it in the save
  // (see house/house.js). Done whenever the menu opens or a race starts.
  function rememberCar(g) {
    let pic = null;
    try { pic = carImg(pickedStyle(g).id, pickedCar(g).color, pickedDecal(g), 240); } catch (e) { return; }
    if (g.save.data.garagePic !== pic) { g.save.data.garagePic = pic; g.store(); }
  }
  function mainMenu(g) {
    migrate(g);
    rememberCar(g);
    if (CANVAS) { mainScreen(g); return; }
    const p = screen('Mini RC Racers', null);
    const cup = cupOf(g), best = g.save.data.cupBest;
    const grid = Arcade.h('div', { class: 'ar-grid rc-modes rc-modes5' });
    grid.appendChild(bigTile(MENU_PICS.cup, 'Cups',
      'Mini Cup + Grand Prix',
      () => cupMenu(g), { 'data-menu': 'cup' }));   // (Mini Cup + Grand Prix)
    grid.appendChild(bigTile(MENU_PICS.free, 'Free Play', 'race or drive', () => trackMenu(g, 'free'), { 'data-menu': 'free' }));
    grid.appendChild(bigTile(MENU_PICS.trial, 'Time Trial', 'race your ghost', () => trackMenu(g, 'trial'), { 'data-menu': 'trial' }));
    grid.appendChild(bigTile(`<img src="${carImg(pickedStyle(g).id, pickedCar(g).color, pickedDecal(g))}" alt="" class="rc-fx-${pickedCar(g).fx || 'none'}">`,
      'My Car', 'colors + stickers', () => carMenu(g), { 'data-menu': 'car' }));
    // Daily Ghost Race: today's track (a tick once you've beaten Boo today)
    const beat = g.save.data.booDay === todayStr();
    grid.appendChild(bigTile(`<span class="rc-boo-tile${beat ? ' done' : ''}">${BOO_PIC}${beat ? `<span class="rc-tick">${STAR_PIC}</span>` : ''}</span>`,
      'Ghost Race', beat ? 'beaten today!' : 'today: ' + dailyTrack(g).name, () => playBoo(g), { 'data-menu': 'ghost' }));
    grid.appendChild(bigTile(builder().PICS.build, 'Build', 'make your own track', () => builder().menu(g), { 'data-menu': 'build' }));
    grid.appendChild(bigTile(HEART_PIC, 'Heart Battle', 'last car wins!', () => battleMenu(g), { 'data-menu': 'battle' }));
    grid.appendChild(bigTile(RUSH_PIC, 'Coin Rush', 'beat the clock', () => playMenu(g, 'rush'), { 'data-menu': 'rush' }));
    grid.appendChild(bigTile(FOLLOW_PIC, 'Follow', 'stay close to Pip', () => playMenu(g, 'follow'), { 'data-menu': 'follow' }));
    grid.appendChild(bigTile(trophySVG('cup', 'gold'), 'Trophies', shelfCount(g).got + ' / ' + shelfCount(g).all, () => shelfMenu(g), { 'data-menu': 'shelf' }));
    p.appendChild(grid);
    const row = arcadeBtn();
    const help = Arcade.h('button', { type: 'button', class: 'ar-btn blue', 'data-help': '1' }, `${icons.help}<span>Help</span>`);
    help.addEventListener('click', () => { Arcade.sfx('click'); g.help(); });
    row.insertBefore(help, row.firstChild);
    // the Item Book: every gift-box item, the ones you've found + the 3 specials to unlock
    const book = Arcade.h('button', { type: 'button', class: 'ar-btn yellow', 'data-items': '1' }, `${giftIcon}<span>Items</span>`);
    book.addEventListener('click', () => { Arcade.sfx('click'); itemBook(g); });
    row.insertBefore(book, row.firstChild);
    p.appendChild(row);
    g.panel(p);
  }

  // ---- Heart Battle: pick an arena ----
  // two little cars facing each other with a big heart between them
  const HEART_PIC = `<svg viewBox="0 0 80 80"><circle cx="40" cy="42" r="34" fill="#9bd770" stroke="#2b2b2b" stroke-width="4"/><circle cx="40" cy="42" r="26" fill="#727a8c"/>` +
    `<path d="M40 56 C26 46 24 40 24 34 C24 28 28 25 32 25 C36 25 39 28 40 31 C41 28 44 25 48 25 C52 25 56 28 56 34 C56 40 54 46 40 56 Z" fill="#ef476f" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/>` +
    `<circle cx="34" cy="32" r="3" fill="#fff"/></svg>`;
  function arenaPic(def) {
    const th = THEMES[def.theme];
    const fence = Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2; return `<circle cx="${(60 + Math.cos(a) * 30).toFixed(1)}" cy="${(35 + Math.sin(a) * 30).toFixed(1)}" r="4" fill="${def.fence === 'snow' ? '#fff' : ['#fff', '#ffd166', '#f15bb5', '#9b5de5'][i % 4]}" stroke="#2b2b2b" stroke-width="1.5"/>`; }).join('');
    return `<svg viewBox="22 -3 76 76"><rect x="22" y="-3" width="76" height="76" rx="12" fill="${th.outer}"/><circle cx="60" cy="35" r="30" fill="${th.band}" stroke="#2b2b2b" stroke-width="3"/>` +
      `<circle cx="60" cy="35" r="25" fill="${th.road}"/>${fence}` +
      [0, 1, 2, 3].map(k => { const a = Math.PI / 4 + k * Math.PI / 2; return `<circle cx="${(60 + Math.cos(a) * 14).toFixed(1)}" cy="${(35 + Math.sin(a) * 14).toFixed(1)}" r="4" fill="${th.curb}" stroke="#2b2b2b" stroke-width="1.5"/>`; }).join('') +
      `<path d="M60 43 C53 38 52 35 52 32 C52 29 54 28 56 28 C58 28 59.5 29.5 60 31 C60.5 29.5 62 28 64 28 C66 28 68 29 68 32 C68 35 67 38 60 43 Z" fill="#ef476f" stroke="#2b2b2b" stroke-width="2"/></svg>`;
  }
  function battleMenu(g) {
    if (CANVAS) { battleScreen(g); return; }
    const p = screen('Heart Battle', () => mainMenu(g));
    // how to play, in pictures: 4 hearts on each car, a bubble pops one, the last car wins
    p.appendChild(Arcade.h('div', { class: 'rc-hb-how' }, `<span>${HEART_PIC}</span><span class="rc-hb-hearts">${heartSVG(g.little ? BATTLE.littleHearts : BATTLE.hearts)}</span>`));
    const grid = Arcade.h('div', { class: 'ar-grid rc-modes rc-modes3' });
    const won = g.save.data.battleWon || {};
    for (const a of ARENAS) {
      grid.appendChild(bigTile(arenaPic(a), a.name, won[a.id] ? '★ won!' : '', () => g.play({ id: a.id, name: a.name }), { 'data-arena': a.id }));
    }
    p.appendChild(grid);
    g.panel(p);
  }

  // ---- The Item Book (Nov 19) ----
  // A card for every item: its picture, name and what it does, and how many times you've had it.
  // Not found yet = a dark shape with a "?". The 3 specials show a padlock + what unlocks them.
  const itemPics = {};
  function itemImg(item, dark) {
    const key = item + (dark ? '-d' : '');
    if (itemPics[key]) return itemPics[key];
    const cv = document.createElement('canvas'); cv.width = cv.height = 120;
    const c = cv.getContext('2d');
    if (dark) c.filter = 'brightness(0) opacity(0.35)';
    drawItemIcon(c, item, 60, 60, 2.2);
    return (itemPics[key] = cv.toDataURL());
  }
  const LOCK_SVG = `<svg viewBox="0 0 40 40"><path d="M12 18 V13 C12 5 28 5 28 13 V18" fill="none" stroke="#2b2b2b" stroke-width="5"/><rect x="8" y="17" width="24" height="18" rx="5" fill="#ffd166" stroke="#2b2b2b" stroke-width="4"/><circle cx="20" cy="26" r="3" fill="#2b2b2b"/></svg>`;
  function itemBook(g) {
    if (CANVAS) { itemScreen(g); return; }
    checkSpecials(g);
    const p = screen('Items', () => mainMenu(g));
    const seen = seenOf(g), found = BOOK_ITEMS.filter(k => seen[k]).length;
    p.appendChild(Arcade.h('div', { class: 'rc-book-count', 'data-found': found }, `${giftIcon}<b>${found} / ${BOOK_ITEMS.length}</b>`));
    const grid = Arcade.h('div', { class: 'rc-book' });
    const card = (item, has, locked, need) => {
      const k = RARITY[item];
      const el = Arcade.h('div', { class: 'rc-card' + (has ? '' : ' unknown') + (locked ? ' locked' : ''), 'data-item': item, style: `--rc:${RARITY_COLOR[k]}` },
        `<div class="rc-card-pic"><img src="${itemImg(item, !has && !(!locked && k === 'special'))}" alt="">${locked ? `<span class="rc-lock">${LOCK_SVG}</span>` : !has ? '<span class="rc-q">?</span>' : ''}</div>` +
        `<b>${has || !locked && k === 'special' ? ITEM_NAMES[item] : '?'}</b><small>${locked ? need : has || k === 'special' ? ITEM_SAYS[item] : ''}</small>` +
        (has ? `<span class="rc-n">×${seen[item]}</span>` : ''));
      grid.appendChild(el);
    };
    for (const it of BOOK_ITEMS) card(it, !!seen[it], false);
    for (const sp of SPECIALS) card(sp.id, !!seen[sp.id], !sp.ok(g), sp.need);
    p.appendChild(grid);
    g.panel(p);
  }

  // ---- Track Builder (rc/builder.js): made the first time it's needed ----
  let Builder = null;
  function builder() {
    return Builder || (Builder = window.RCBuilder({ THEMES, TRACKS, SONGS, spline, makePath, screen, trackPic, FLAG_PIC, STAR_PIC, WEATHER_ICONS, mainMenu }));
  }

  // ---- Coin Rush / Follow the Leader: pick a track ----
  // a gold coin with a little stopwatch: Coin Rush
  const RUSH_PIC = `<svg viewBox="0 0 80 80"><circle cx="34" cy="44" r="27" fill="#ffc93c" stroke="#2b2b2b" stroke-width="5"/><circle cx="34" cy="44" r="16" fill="none" stroke="#e09f3e" stroke-width="4"/>` +
    `<path d="M24 32 A16 16 0 0 1 34 28" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>` +
    `<rect x="55" y="8" width="10" height="7" rx="2" fill="#ef476f" stroke="#2b2b2b" stroke-width="3"/><circle cx="60" cy="28" r="14" fill="#fff" stroke="#2b2b2b" stroke-width="4"/>` +
    `<path d="M60 28 V19 M60 28 L66 32" stroke="#2b2b2b" stroke-width="3.5" stroke-linecap="round"/></svg>`;
  // a music note (Follow the Leader's notes)
  const NOTE_PIC = `<svg viewBox="0 0 48 48"><path d="M28 36 V8 Q40 12 40 24 Q36 16 28 16" fill="none" stroke="#2b2b2b" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<ellipse cx="20" cy="37" rx="10" ry="7.5" transform="rotate(-22 20 37)" fill="#f15bb5" stroke="#2b2b2b" stroke-width="4.5"/></svg>`;
  // Pip's green car with a flag, a trail of notes, and your car behind: Follow the Leader
  const FOLLOW_PIC = `<svg viewBox="0 0 80 80"><path d="M10 66 Q30 58 40 40 Q50 22 70 16" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="2 10" stroke-linecap="round"/>` +
    `<g transform="translate(58 22) rotate(-30)"><rect x="-13" y="-9" width="26" height="18" rx="7" fill="${PIP_COLOR}" stroke="#2b2b2b" stroke-width="4"/></g>` +
    `<path d="M58 18 V0 M58 1 L72 5 L58 10" fill="#ffd166" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>` +
    `<g transform="translate(20 62) rotate(-25)"><rect x="-13" y="-9" width="26" height="18" rx="7" fill="#ef476f" stroke="#2b2b2b" stroke-width="4"/></g>` +
    `<g transform="translate(26 22) scale(0.6)">${NOTE_PIC.replace(/<\/?svg[^>]*>/g, '')}</g>` +
    `<g transform="translate(46 44) scale(0.5)">${NOTE_PIC.replace(/<\/?svg[^>]*>/g, '').replace('#f15bb5', '#00bbf9')}</g></svg>`;
  const starRow = (n) => Array.from({ length: 3 }, (_, i) => STAR_PIC.replace('#ffd166', i < n ? '#ffd166' : 'rgba(255,255,255,0.45)')).join('');
  function playMenu(g, kind) {
    if (CANVAS) { playScreen(g, kind); return; }
    const rushK = kind === 'rush';
    const p = screen(rushK ? 'Coin Rush' : 'Follow the Leader', () => mainMenu(g));
    // how to play, in pictures: coins + clock = more stars / Pip's notes -> catch them
    p.appendChild(Arcade.h('div', { class: 'rc-how' }, rushK
      ? `${RUSH_PIC}<span class="rc-arrow">+</span>${coinSVG(56)}${coinSVG(56)}<span class="rc-arrow">=</span>${starRow(3)}`
      : `${FOLLOW_PIC}<span class="rc-arrow">→</span>${NOTE_PIC}${NOTE_PIC.replace('#f15bb5', '#00bbf9')}<span class="rc-arrow">=</span>${starRow(3)}`));
    const grid = Arcade.h('div', { class: 'rc-play5' });
    const d = g.save.data;
    for (const t of TRACKS) {
      let meta = '';
      if (rushK) { const b = (d.rushBest || {})[t.id]; if (b) meta = starRow(rushGoal(g, t.id).filter(n => b >= n).length) + ' ' + b; }
      else { const b = (d.followBest || {})[t.id]; if (b) meta = starRow(FOLLOW.stars[g.little ? 'little' : 'big'].filter(n => b >= n).length); }
      const id = (rushK ? 'cr-' : 'fl-') + t.id;
      const tile = Arcade.h('button', { type: 'button', class: 'ar-tile', 'data-track': id },
        `<div class="pic">${trackPic(t)}</div><div style="font-size:16px">${t.name}</div><div class="meta">${meta}</div>`);
      tile.addEventListener('click', () => { Arcade.sfx('click'); g.play({ id, name: t.name }); });
      grid.appendChild(tile);
    }
    p.appendChild(grid);
    g.panel(p);
  }

  // ---- Daily Ghost Race: straight onto today's track ----
  function playBoo(g) { const t = dailyTrack(g); g.play({ id: 'dg-' + t.id, name: t.name }); }

  // ---- Trophy shelf: everything you've won in RC, on 3 wooden shelves ----
  // Top shelf: Mini Cup, Grand Prix, Ghost (days you beat Boo), Free Drive stars.
  // Two shelves below: one trophy per track (gold = won a race there, silver / bronze =
  // best place in Free Play), with the track's picture and two little badges under it:
  // a stopwatch (you've set a Time Trial lap) and a star (found all its Free Drive stars).
  // Empty spots are dashed outlines: tap one and a Go button takes you to try for it.
  function shelfItems(g) {
    const d = g.save.data, f = feat(g), medalOf = (b) => ['gold', 'silver', 'bronze'][b - 1] || null;
    const starsN = TRACKS.filter(t => (d.driveBest || {})[t.id]).length;
    const big = [
      { key: 'mini', shape: 'mini', medal: medalOf(d.miniBest), name: CUPS.mini.name, go: () => cupMenu(g) },
      { key: 'cup', shape: 'cup', medal: medalOf(d.cupBest), name: CUPS.cup.name, go: () => cupMenu(g) },
      { key: 'boo', shape: 'ghost', medal: booLevel(d.booWins || 0), name: 'Ghost Race', count: '× ' + (d.booWins || 0), go: () => playBoo(g) },
      { key: 'stars', shape: 'star', medal: starLevel(starsN), name: 'Free Drive', count: starsN + '/' + TRACKS.length,
        go: () => { d.freeKind = 'drive'; g.store(); trackMenu(g, 'free'); } },
    ];
    const tracks = TRACKS.map(t => {
      const bp = (f.won || {})[t.id] ? 1 : bestPlace(g, t.id);
      return { key: t.id, shape: 'track', medal: medalOf(bp), place: bp, name: t.name, track: t,
        trial: !!(d.ghosts || {})[t.id], drive: !!(d.driveBest || {})[t.id],
        go: () => { d.freeKind = 'race'; g.store(); g.play(Object.assign({}, t)); } };
    });
    return { big, tracks };
  }
  function shelfCount(g) {
    const { big, tracks } = shelfItems(g), all = big.concat(tracks);
    return { got: all.filter(it => it.medal).length, all: all.length };
  }
  function shelfMenu(g) {
    if (CANVAS) { shelfScreen(g); return; }
    const p = screen('Trophies', () => mainMenu(g));
    const { big, tracks } = shelfItems(g), cnt = shelfCount(g);
    const wrap = Arcade.h('div', { class: 'rc-shelf' });
    wrap.appendChild(Arcade.h('div', { class: 'rc-shelf-count', 'data-count': cnt.got }, `${trophyIcon}<b>${cnt.got} / ${cnt.all}</b>`));
    const say = Arcade.h('div', { class: 'rc-shelf-say' });
    const MINI_WATCH = MENU_PICS.trial, MINI_STAR = STAR_PIC;
    const tile = (it) => {
      const b = Arcade.h('button', { type: 'button', class: 'rc-tro' + (it.medal ? ' got' : '') + (it.shape === 'track' ? '' : ' big'), 'data-tro': it.key, 'data-medal': it.medal || '' },
        trophySVG(it.shape, it.medal) +
        (it.count ? `<span class="rc-tro-count">${it.count}</span>` : '') +
        (it.track ? `<span class="rc-plaque"><span class="tp">${trackPic(it.track)}</span>` +
          `<span class="bd${it.trial ? ' on' : ''}">${MINI_WATCH}</span><span class="bd${it.drive ? ' on' : ''}">${MINI_STAR}</span></span>` : ''));
      b.addEventListener('click', () => {
        // a happy hop + sparkle sound for a trophy you've won; a little wiggle for an empty spot
        if (it.medal) { Arcade.sfx('star'); b.classList.remove('hop'); void b.offsetWidth; b.classList.add('hop'); }
        else { Arcade.sfx('click'); wiggle(b); }
        const what = it.shape === 'track' ? (it.place < 99 ? ORD(it.place) : '') : (it.count || '');
        say.innerHTML = `<span class="rc-say-pic">${it.track ? trackPic(it.track) : trophySVG(it.shape, it.medal || 'gold')}</span>` +
          `<span class="rc-say-name">${it.name}${what ? ` <b>${what}</b>` : ''}</span>`;
        const go = Arcade.h('button', { type: 'button', class: 'ar-btn yellow', 'data-go': it.key, style: 'min-height:58px' }, `${icons.play}<span>Go!</span>`);
        go.addEventListener('click', () => { Arcade.sfx('click'); it.go(); });
        say.appendChild(go);
      });
      return b;
    };
    const shelf = (list, cls) => {
      const row = Arcade.h('div', { class: 'rc-shelf-row ' + cls });
      list.forEach(it => row.appendChild(tile(it)));
      wrap.appendChild(row);
      wrap.appendChild(Arcade.h('div', { class: 'rc-plank' }));
    };
    shelf(big, 'top');
    shelf(tracks.slice(0, 5), 'trk');
    shelf(tracks.slice(5), 'trk');
    wrap.appendChild(say);
    p.appendChild(wrap);
    g.panel(p);
  }

  // ---- Grand Prix: keep going, or start a new one ----
  function cupMenu(g) {
    if (CANVAS) { cupScreen(g); return; }
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
    if (CANVAS) { trackScreen(g, kind); return; }
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
    if (CANVAS) { carScreen(g); return; }
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
          if (st.secret && !ok) continue;      // a secret car: not even a locked tile until you've won it
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
  // Canvas menus (Nov 21, Keith: "rewrite everything to utilize Phaser 3 + Rex UI")
  // Every RC menu below is a SCREEN drawn by arcade/canvasmenu.js (window.ArcadeMenus),
  // scaled to fit the phone / tablet / computer. Each old HTML menu above starts with
  // `if (CANVAS) { ...Screen(g); return; }`, so without Phaser the HTML menus still work.
  // The Track Builder (rc/builder.js) and the Friends rooms (the shared screens in arcade/net.js) followed later (Nov 21/22).
  // Tile `attr`s are named like the old HTML ones (data-menu="free" -> 'menu-free'),
  // so the tests can find them.
  // ---------------------------------------------------------------
  const CANVAS = !!window.ArcadeMenus;
  const backFooter = (fn) => ({ t: 'buttons', items: [{ icon: icons.left, label: 'Back', color: 'white', attr: 'back', onTap: () => { Arcade.sfx('click'); fn(); } }] });
  const myCarImg = (g, size) => carImg(pickedStyle(g).id, pickedCar(g).color, pickedDecal(g), size);
  // put one SVG picture inside another one at x, y (w x h)
  const nest = (svg, x, y, w, h) => svg.replace(/<svg\b([^>]*)>/, (m, a) =>
    '<svg' + a.replace(/\s(x|y|width|height|style|class)="[^"]*"/g, '') + ` x="${x}" y="${y}" width="${w}" height="${h}">`);
  // a painted picture (a car) inside an SVG
  const imgIn = (url, x, y, w, h) => `<image href="${url}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
  const GL = Arcade.svgGloss;      // glossy picture bits (podium steps, shiny rows, glow + rays): shared.js
  // words inside an SVG (the menus can't show HTML, so result pictures carry their own words)
  const svgText = (x, y, str, size, fill = '#2b2b2b', anchor = 'middle', stroke = '') =>
    `<text x="${x}" y="${y}" font-size="${size}" font-family="Arial Black, Arial, sans-serif" font-weight="900" text-anchor="${anchor}" fill="${fill}"` +
    (stroke ? ` stroke="${stroke}" stroke-width="${size / 6}" paint-order="stroke fill" stroke-linejoin="round"` : '') + `>${str}</text>`;
  // several pictures side by side as ONE picture (how-to rows: car + coins = stars)
  function strip(parts, hgt = 80) {
    let x = 0, inner = '';
    for (const p of parts) {
      if (typeof p === 'string' && !p.startsWith('<svg')) { const tw = 12 + p.length * 26; inner += svgText(x + tw / 2, hgt / 2 + 14, p, 40, '#fff', 'middle', '#2b2b2b'); x += tw; continue; }
      const [vw, vh] = (/viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(p) || [0, 48, 48]).slice(1).map(Number);
      const w = hgt * vw / vh;
      inner += nest(p, x, 0, w, hgt); x += w + 6;
    }
    return `<svg viewBox="0 0 ${Math.round(x)} ${hgt}">${inner}</svg>`;
  }
  // ...as a screen row, `hgt` board units tall (a pics row's size is its LONGER side, here the width)
  const stripRow = (parts, hgt) => { const svg = strip(parts, hgt); return { t: 'pics', items: [svg], size: +/viewBox="0 0 (\d+)/.exec(svg)[1] }; };
  const starOn = STAR_PIC, starOff = STAR_PIC.replace('#ffd166', '#e3e3e3');
  const starMeta = (n) => [0, 1, 2].map(i => ({ svg: i < n ? starOn : starOff }));
  const medalSvg = (n) => ['gold', 'silver', 'bronze'][n - 1] ? icons.medal(['gold', 'silver', 'bronze'][n - 1]) : null;

  // ---- the main menu: 10 big tiles, then Items / Help / Arcade ----
  function mainScreen(g) {
    const beat = g.save.data.booDay === todayStr();
    const sc = shelfCount(g);
    const t = (pic, name, key, onTap, meta, img) => ({ pic, img, name, meta: meta || [], attr: 'menu-' + key, onTap: () => { Arcade.sfx('click'); onTap(); } });
    const tiles = [
      t(MENU_PICS.cup, 'Cups', 'cup', () => cupMenu(g)),
      t(MENU_PICS.free, 'Free Play', 'free', () => trackMenu(g, 'free')),
      t(MENU_PICS.trial, 'Time Trial', 'trial', () => trackMenu(g, 'trial')),
      t(null, 'My Car', 'car', () => carMenu(g), null, myCarImg(g, 160)),
      t(BOO_PIC, 'Ghost Race', 'ghost', () => playBoo(g), beat ? [{ svg: starOn }] : [{ text: dailyTrack(g).name }]),   // (a star once you've beaten Boo today)
      t(builder().PICS.build, 'Build', 'build', () => builder().menu(g)),
      t(HEART_PIC, 'Heart Battle', 'battle', () => battleMenu(g)),
      t(RUSH_PIC, 'Coin Rush', 'rush', () => playMenu(g, 'rush')),
      t(FOLLOW_PIC, 'Follow', 'follow', () => playMenu(g, 'follow')),
      t(trophySVG('cup', 'gold'), 'Trophies', 'shelf', () => shelfMenu(g), [{ text: sc.got + ' / ' + sc.all }]),
    ];
    ArcadeMenus.open({ id: 'rc-main', title: 'Mini RC Racers', rows: [{ t: 'tiles', w: 128, h: 150, items: tiles }],
      footer: { t: 'buttons', items: [
        { icon: giftIcon, label: 'Items', color: 'yellow', attr: 'items', onTap: () => { Arcade.sfx('click'); itemBook(g); } },
        // the Star Road (Nov 24, point 8): stars unlock car trails; a red NEW star instead of the hat when one is new
        { icon: g.looks.fresh() ? Arcade.looks.NEW : Arcade.looks.ICON, label: 'Looks', color: 'pink', attr: 'looks', onTap: () => { Arcade.sfx('click'); g.looks.screen(() => mainMenu(g)); } },
        { icon: icons.help, label: 'Help', color: 'blue', attr: 'help', onTap: () => { Arcade.sfx('click'); g.help(); } },
        { icon: icons.home, label: 'Arcade', color: 'white', attr: 'arcade', onTap: () => { location.href = '../index.html'; } },
      ] } });
  }

  // ---- Cups: the Mini Cup and the Grand Prix (keep going, or start over) ----
  function cupScreen(g) {
    const tiles = [], again = [];
    for (const key of ['mini', 'cup']) {
      const cup = cupOf(g, key), on = cup && cup.active, n = cupLen(key);
      const best = g.save.data[key === 'mini' ? 'miniBest' : 'cupBest'];
      // under the cup: your best medal, then a flag + how many races are done
      tiles.push({ pic: key === 'mini' ? MENU_PICS.mini : MENU_PICS.cup, name: CUPS[key].name, attr: 'cup-' + key,
        meta: (best ? [{ svg: medalSvg(best) }] : []).concat([{ svg: flagSVG(!!on) }, { text: (on ? cup.race : 0) + ' / ' + n }]),
        onTap: () => { Arcade.sfx('click'); cupKey = key; g.play({ id: key }); } });
      if (on) again.push({ icon: icons.again, label: 'Start over', color: 'white', attr: 'cupnew-' + key, onTap: () => { Arcade.sfx('click'); cupKey = key; g.play({ id: key + 'new' }); } });
    }
    const rows = [{ t: 'tiles', w: 230, h: 220, items: tiles }];
    if (again.length) rows.push({ t: 'buttons', items: again });
    ArcadeMenus.open({ id: 'rc-cups', title: 'Cups', rows, footer: backFooter(() => mainMenu(g)), onKey: (c) => { if (c === 'Escape') mainMenu(g); } });
  }

  // ---- Free Play / Time Trial: race or drive, the weather, then the tracks ----
  function trackScreen(g, kind) {
    const d = g.save.data, drive = kind === 'free' && d.freeKind === 'drive';
    const redraw = () => { g.store(); trackScreen(g, kind); };
    // Free Play: Race (3 rivals, 3 laps), Drive (just you: find the stars), Friends (several phones)
    let top = { t: 'round', items: [] };
    if (kind === 'free') {
      const kinds = [['race', 'Race', FLAG_PIC], ['drive', 'Drive', STAR_PIC]];
      if (Arcade.net && Arcade.net.ready()) kinds.push(['friends', 'Friends', FRIENDS_PIC]);
      top.items = kinds.map(([k, label, icon]) => ({ icon, label, attr: 'kind-' + k, picked: k !== 'friends' && (k === 'drive') === drive,
        onTap: () => { Arcade.sfx('click'); if (k === 'friends') { friendsMenu(g); return; } d.freeKind = k; redraw(); } }));
    }
    // ...and the weather, in the same row of round buttons (it stays put while the tracks scroll)
    top.items.push(...Object.keys(WEATHER).map(k => ({ icon: WEATHER_ICONS[k], label: WEATHER[k].name, attr: 'weather-' + k,
      picked: (d.weather || 'sun') === k, onTap: () => { Arcade.sfx('click'); d.weather = k; redraw(); } })));
    const show = l => kind === 'trial' ? l._trial : drive ? l._drive : (!l._trial && !l._drive && !l.id.startsWith('cup'));
    const tiles = levels(g).filter(show).map(lv => ({ pic: lv.pic, name: lv.name, attr: 'track-' + lv.id,
      meta: ArcadeMenus.split(String(lv.meta || '').replace('⏱', MENU_PICS.trial).replace('★', STAR_PIC)),
      onTap: () => { Arcade.sfx('click'); g.play(lv); } }));
    ArcadeMenus.open({ id: 'rc-tracks-' + kind, tab: drive ? 'drive' : 'race', title: kind === 'trial' ? 'Time Trial' : 'Free Play', top,
      rows: [{ t: 'tiles', w: 140, h: 140, items: tiles }],
      footer: backFooter(() => mainMenu(g)), onKey: (c) => { if (c === 'Escape') mainMenu(g); } });
  }

  // ---- My Car: 3 tabs (Style / Paint / Stickers); the yellow tile is your car as it is now ----
  function carScreen(g) {
    const d = g.save.data, color = pickedCar(g).color;
    const redraw = () => { g.store(); carScreen(g); };
    const pick = (ok, fn, sound) => () => { if (!ok) { Arcade.sfx('bonk'); return; } Arcade.sfx(sound || 'click'); fn(); redraw(); };
    const TABS = [
      ['style', 'Style', `<svg viewBox="0 0 48 48"><rect x="8" y="14" width="32" height="22" rx="8" fill="#ef476f" stroke="#2b2b2b" stroke-width="4"/><circle cx="16" cy="38" r="5" fill="#333" stroke="#2b2b2b" stroke-width="3"/><circle cx="32" cy="38" r="5" fill="#333" stroke="#2b2b2b" stroke-width="3"/></svg>`],
      ['paint', 'Paint', `<svg viewBox="0 0 48 48"><path d="M24 6 C10 6 4 16 4 24 C4 34 12 42 22 42 C26 42 26 38 24 36 C22 33 24 30 28 30 H34 C40 30 44 26 44 20 C44 12 36 6 24 6 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="4"/><circle cx="14" cy="22" r="4" fill="#ef476f"/><circle cx="22" cy="14" r="4" fill="#06d6a0"/><circle cx="33" cy="16" r="4" fill="#118ab2"/></svg>`],
      ['decal', 'Stickers', `<svg viewBox="0 0 48 48"><path d="M24 4 L29 18 L44 18 L32 27 L36 42 L24 33 L12 42 L16 27 L4 18 L19 18 Z" fill="#f15bb5" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/></svg>`],
    ];
    const top = { t: 'round', items: TABS.map(([id, label, icon]) => ({ icon, label, attr: 'tab-' + id, picked: carTab === id,
      onTap: () => { if (carTab === id) return; Arcade.sfx('click'); carTab = id; carScreen(g); } })) };
    const items = [];
    let w = 130, h = 160;
    if (carTab === 'style') {
      for (const st of STYLES) {
        const ok = st.ok(g);
        if (st.secret && !ok) continue;      // a secret car: not even a locked tile until you've won it
        items.push({ img: carImg(st.id, color, pickedDecal(g)), name: st.name, meta: [{ text: ok ? st.does : st.need }], locked: !ok,
          picked: pickedStyle(g).id === st.id, attr: 'style-' + st.id, onTap: pick(ok, () => { d.style = st.id; }) });
      }
      h = 190;
    } else if (carTab === 'paint') {
      // the 6 free colors, then the special ones you win
      for (const c of PAINTS) {
        const ok = paintOk(g, c);
        items.push({ img: carImg(pickedStyle(g).id, c.color, pickedDecal(g)), name: c.fx ? c.name : '', meta: c.fx && !ok ? [{ text: c.need }] : [],
          locked: !ok, picked: c.id === pickedCar(g).id, attr: 'paint-' + c.id, onTap: pick(ok, () => { d.paint = c.id; }, c.fx ? 'unlock' : 'click') });
      }
      w = 120; h = 150;
    } else {
      for (const dc of DECALS) {
        const own = ownsDecal(g, dc.id);
        items.push({ img: carImg(pickedStyle(g).id, color, dc.id), name: dc.name, meta: own ? [] : [{ svg: coinSVG(14) }, { text: String(dc.price) }],
          locked: !own, picked: pickedDecal(g) === dc.id, attr: 'decal-' + dc.id, onTap: pick(own, () => { d.decal = dc.id; }) });
      }
      w = 120; h = 160;
    }
    ArcadeMenus.open({ id: 'rc-car', tab: carTab, title: 'My Car', top,
      // (Nov 23: your car as it is now, on a gold stand in a spotlight, above the choices)
      // (on a phone held upright the car is above the choices)
      rows: [{ t: 'cols', cols: [{ w: 210, rows: [{ t: 'pics', size: 120, items: [{ img: myCarImg(g, 300), stage: true }] }] },
        { w: 516, rows: [{ t: 'tiles', w, h, items }] }] }],
      footer: backFooter(() => mainMenu(g)), onKey: (c) => { if (c === 'Escape') mainMenu(g); } });
  }

  // ---- Heart Battle: pick an arena ----
  function battleScreen(g) {
    const won = g.save.data.battleWon || {};
    ArcadeMenus.open({ id: 'rc-battle', title: 'Heart Battle',
      rows: [
        stripRow([HEART_PIC, heartSVG(g.little ? BATTLE.littleHearts : BATTLE.hearts)], 70),
        { t: 'tiles', w: 200, h: 190, items: ARENAS.map(a => ({ pic: arenaPic(a), name: a.name, attr: 'arena-' + a.id, meta: won[a.id] ? [{ svg: starOn }] : [],
          onTap: () => { Arcade.sfx('click'); g.play({ id: a.id, name: a.name }); } })) },
      ],
      footer: backFooter(() => mainMenu(g)), onKey: (c) => { if (c === 'Escape') mainMenu(g); } });
  }

  // ---- Coin Rush / Follow the Leader: how to play in pictures, then the tracks ----
  function playScreen(g, kind) {
    const rushK = kind === 'rush', d = g.save.data;
    const how = rushK ? stripRow([RUSH_PIC, '+', coinSVG(56), coinSVG(56), '=', starOn, starOn, starOn], 64)
      : stripRow([FOLLOW_PIC, '+', NOTE_PIC, NOTE_PIC.replace('#f15bb5', '#00bbf9'), '=', starOn, starOn, starOn], 64);
    const tiles = TRACKS.map(t => {
      let meta = [];
      if (rushK) { const b = (d.rushBest || {})[t.id]; if (b) meta = starMeta(rushGoal(g, t.id).filter(n => b >= n).length).concat([{ text: String(b) }]); }
      else { const b = (d.followBest || {})[t.id]; if (b) meta = starMeta(FOLLOW.stars[g.little ? 'little' : 'big'].filter(n => b >= n).length); }
      const id = (rushK ? 'cr-' : 'fl-') + t.id;
      return { pic: trackPic(t), name: t.name, meta, attr: 'track-' + id, onTap: () => { Arcade.sfx('click'); g.play({ id, name: t.name }); } };
    });
    ArcadeMenus.open({ id: 'rc-play-' + kind, title: rushK ? 'Coin Rush' : 'Follow the Leader',
      rows: [how, { t: 'tiles', w: 140, h: 150, items: tiles }],
      footer: backFooter(() => mainMenu(g)), onKey: (c) => { if (c === 'Escape') mainMenu(g); } });
  }

  // ---- the Item Book: every gift-box item (found ones in color) + the 6 specials ----
  function itemScreen(g) {
    checkSpecials(g);
    const seen = seenOf(g), found = BOOK_ITEMS.filter(k => seen[k]).length;
    const card = (item, has, locked, need) => {
      const special = RARITY[item] === 'special';
      const known = has || (!locked && special);
      return { img: itemImg(item, !known), name: (known ? ITEM_NAMES[item] : '?') + (has ? '  ×' + seen[item] : ''), locked, attr: 'item-' + item, kind: RARITY[item], has,
        meta: locked ? [{ text: need }] : known ? [{ text: ITEM_SAYS[item] }] : [],
        onTap: () => { Arcade.sfx(known ? 'click' : 'bonk'); } };
    };
    const items = BOOK_ITEMS.map(it => card(it, !!seen[it], false)).concat([{ heading: 'Specials' }],
      SPECIALS.map(sp => card(sp.id, !!seen[sp.id], !sp.ok(g), sp.need)));
    ArcadeMenus.open({ id: 'rc-items', title: 'Items',
      rows: [{ t: 'chips', items: [{ svg: giftIcon, text: found + ' / ' + BOOK_ITEMS.length }], found }, { t: 'tiles', w: 140, h: 180, items }],
      footer: backFooter(() => mainMenu(g)), onKey: (c) => { if (c === 'Escape') mainMenu(g); } });
  }

  // ---- the Trophy shelf: tap a trophy (or an empty spot), then Go! tries for it ----
  let shelfSel = null;
  function shelfScreen(g, sel) {
    shelfSel = sel || null;
    const { big, tracks } = shelfItems(g), cnt = shelfCount(g);
    // a track's trophy stands on a little plaque: the track, a stopwatch (Time Trial lap set) and a star (all Free Drive stars)
    const plaque = (it) => `<svg viewBox="0 0 80 150">${nest(trophySVG(it.shape, it.medal), 0, 0, 80, 100)}` +
      `<rect x="2" y="102" width="76" height="46" rx="8" fill="#8a5a3c" stroke="#2b2b2b" stroke-width="3"/>${nest(trackPic(it.track), 6, 106, 44, 26)}` +
      `<g opacity="${it.trial ? 1 : 0.25}">${nest(MENU_PICS.trial, 52, 104, 22, 22)}</g><g opacity="${it.drive ? 1 : 0.25}">${nest(STAR_PIC, 52, 124, 22, 22)}</g></svg>`;
    const tap = (it) => () => {
      // a sparkle sound for a trophy you've won; a little bonk for an empty spot
      Arcade.sfx(it.medal ? 'star' : 'click');
      shelfScreen(g, it.key);
    };
    const tile = (it) => ({ pic: it.track ? plaque(it) : trophySVG(it.shape, it.medal), name: '', medal: it.medal || '',
      meta: it.count ? [{ text: it.count }] : it.track && it.place < 99 ? [{ text: ORD(it.place) }] : [],
      picked: it.key === shelfSel, attr: 'tro-' + it.key, trial: !!it.trial, drive: !!it.drive, onTap: tap(it) });
    const all = big.concat(tracks), chosen = all.find(it => it.key === shelfSel);
    const footer = backFooter(() => mainMenu(g));
    if (chosen) footer.items.unshift({ icon: icons.play, label: 'Go!', color: 'big', attr: 'go-' + chosen.key, onTap: () => { Arcade.sfx('click'); chosen.go(); } });
    ArcadeMenus.open({ id: 'rc-shelf', title: 'Trophies',
      rows: [{ t: 'chips', items: [{ svg: trophyIcon, text: cnt.got + ' / ' + cnt.all }], count: cnt.got },
        { t: 'tiles', w: 120, h: 150, items: big.map(tile) },
        { t: 'tiles', w: 100, h: 170, items: tracks.map(tile) }],
      footer, onKey: (c) => { if (c === 'Escape') mainMenu(g); } });
  }

  // ---- between Grand Prix races: the garage (upgrades, stickers, points), then the next race ----
  function garageScreen(g) {
    const cup = cupOf(g), next = cupTrack(cup);
    const redraw = () => { g.store(); garageScreen(g); };
    const TABS = [['up', 'Upgrades', wrenchIcon], ['decal', 'Stickers', `<svg viewBox="0 0 48 48"><path d="M24 4 L29 18 L44 18 L32 27 L36 42 L24 33 L12 42 L16 27 L4 18 L19 18 Z" fill="#f15bb5" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/></svg>`], ['pts', 'Points', trophyIcon]];
    const top = { t: 'round', items: TABS.map(([id, label, icon]) => ({ icon, label, attr: 'gtab-' + id, picked: garageTab === id,
      onTap: () => { if (garageTab === id) return; Arcade.sfx('click'); garageTab = id; garageScreen(g); } })) };
    const rows = [{ t: 'chips', items: [{ svg: coinSVG(30), text: String(coins(cup)) }], coins: coins(cup) }];
    if (garageTab === 'up') {
      // each upgrade: its picture, 5 dots for its level, and the price (MAX when it's full)
      rows.push({ t: 'tiles', w: 140, h: 170, items: UPGRADES.map(u => {
        const l = upLevel(cup, u.id), maxed = l >= MAX_LVL, price = PRICES[l];
        const dots = Array.from({ length: MAX_LVL }, (_, i) => `<rect x="${i * 18 + 2}" y="66" width="14" height="12" rx="3" fill="${i < l ? u.color : '#fff'}" stroke="#2b2b2b" stroke-width="2.5"/>`).join('');
        return { pic: `<svg viewBox="0 0 92 80">${nest(upIcon(u.id), 16, 0, 60, 60)}${dots}</svg>`, name: u.name, attr: 'up-' + u.id, locked: !maxed && coins(cup) < price,
          meta: maxed ? [{ text: 'MAX!' }] : [{ svg: coinSVG(14) }, { text: String(price) }],
          onTap: () => {
            if (maxed || coins(cup) < price) { Arcade.sfx('bonk'); return; }
            cup.coins = coins(cup) - price;
            cup.up = Object.assign({}, cup.up, { [u.id]: l + 1 });
            Arcade.sfx('unlock'); redraw();
          } };
      }) });
    } else if (garageTab === 'decal') {
      // stickers: paid with this cup's coins, yours forever; tap one you own to wear it
      rows.push({ t: 'tiles', w: 130, h: 160, items: DECALS.slice(1).map(dc => {
        const own = ownsDecal(g, dc.id);
        return { img: carImg(pickedStyle(g).id, pickedCar(g).color, dc.id), name: dc.name, attr: 'buy-' + dc.id, picked: pickedDecal(g) === dc.id,
          locked: !own && coins(cup) < dc.price, meta: own ? [] : [{ svg: coinSVG(14) }, { text: String(dc.price) }],
          onTap: () => {
            if (!own) {
              if (coins(cup) < dc.price) { Arcade.sfx('bonk'); return; }
              cup.coins = coins(cup) - dc.price;
              g.save.data.decals = (g.save.data.decals || []).concat(dc.id);
              Arcade.sfx('unlock');
            } else Arcade.sfx('click');
            g.save.data.decal = dc.id; redraw();
          } };
      }) });
    } else rows.push({ t: 'pics', items: [standingsSVG(cup)], size: 240 });
    // the next race: its track + a flag per race
    rows.push(stripRow([trackPic(next)].concat(Array.from({ length: cupLen() }, (_, i) => flagSVG(i < cup.race))), 60));
    ArcadeMenus.open({ id: 'rc-garage', tab: garageTab, title: 'Garage', top, rows,
      footer: { t: 'buttons', items: [
        { icon: icons.play, label: 'Next race', color: 'big', attr: 'next', onTap: () => { Arcade.sfx('click'); g.play({ id: cupKey }); } },
        { icon: icons.menu, label: 'Menu', color: 'blue', attr: 'menu', onTap: () => { Arcade.sfx('click'); g.menu(); } },
      ] } });
  }

  // ---- results as pictures (the menus can't show HTML) ----
  // The top 3 cars on a podium (+ you next to it if you weren't in the top 3).
  // badge(c) = how many hearts a car had left (Heart Battle).
  // (Nov 21, "a bigger and happier win screen": bigger cars + steps; when you're in the top 3 there's
  //  bunting along the top, confetti, sparkles round your car, and the winner wears a little gold crown.)
  function podiumSVG(g, order, badge) {
    const carOf = (c) => c.isPlayer ? myCarImg(g) : carImg(c.style || 'classic', c.color, c.decal || 'none');
    const me = order.findIndex(c => c.isPlayer), extra = me >= 3, happy = me >= 0 && me < 3;
    const FLOOR = 290, CAR = 100;
    const STEP = [{ h: 118, col: 'gold', x: 160 }, { h: 88, col: 'silver', x: 40 }, { h: 66, col: 'bronze', x: 280 }];
    const VW = extra ? 560 : 430;
    // (glossy, Nov 23: a glow + soft light rays behind the winner, a shadow on the floor under the podium)
    const wx = STEP[0].x + 60, wy = FLOOR - STEP[0].h - 50;
    let s = GL.defs() + `<g opacity="${happy ? 1 : 0.6}">` + GL.rays(wx, wy, 190, 14) + GL.glow(wx, wy, 120) + '</g>' + GL.floor(220, FLOOR + 2, 210);
    // confetti: the same pieces every time (a seeded shuffle), only when you made the top 3
    if (happy) {
      const rnd = math.seeded(7), cols = ['#ef476f', '#ffd166', '#06d6a0', '#4cc9f0', '#9b5de5', '#ff8c42'];
      for (let i = 0; i < 34; i++) {
        const x = 10 + rnd() * (VW - 20), y = 44 + rnd() * 150, c = cols[i % cols.length], r = Math.round(rnd() * 90);
        s += i % 3 ? `<rect x="${(x - 5).toFixed(1)}" y="${(y - 3).toFixed(1)}" width="10" height="6" rx="2" fill="${c}" transform="rotate(${r} ${x.toFixed(1)} ${y.toFixed(1)})"/>`
          : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${c}"/>`;
      }
      // bunting: two swoops of little flags along the top (leaving the middle free for the winner)
      const mid = STEP[0].x + 60;
      for (const [x0, x1] of [[0, mid - 70], [mid + 70, VW]]) {
        s += `<path d="M${x0} 4 Q${(x0 + x1) / 2} 56 ${x1} 4" fill="none" stroke="#2b2b2b" stroke-width="3"/>`;
        const n = Math.max(3, Math.round((x1 - x0) / 36));
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n, x = x0 + (x1 - x0) * t, y = 4 + 2 * t * (1 - t) * 52;
          s += `<path d="M${(x - 12).toFixed(1)} ${y.toFixed(1)} L${(x + 12).toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} ${(y + 26).toFixed(1)} Z" fill="${cols[(i + (x0 ? 3 : 0)) % cols.length]}" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/>`;
        }
      }
    }
    const sparkle = (x, y, r, c) => `<path transform="translate(${x} ${y})" d="M0 ${-r} L${r * 0.28} ${-r * 0.28} L${r} 0 L${r * 0.28} ${r * 0.28} L0 ${r} L${-r * 0.28} ${r * 0.28} L${-r} 0 L${-r * 0.28} ${-r * 0.28} Z" fill="${c}" stroke="#2b2b2b" stroke-width="2"/>`;
    const crown = (cx, y) => `<path d="M${cx - 24} ${y + 26} L${cx - 26} ${y + 2} L${cx - 12} ${y + 14} L${cx} ${y - 4} L${cx + 12} ${y + 14} L${cx + 26} ${y + 2} L${cx + 24} ${y + 26} Z" fill="#ffc93c" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/>` +
      `<circle cx="${cx}" cy="${y - 4}" r="4" fill="#ef476f" stroke="#2b2b2b" stroke-width="2"/><circle cx="${cx - 26}" cy="${y + 2}" r="3.5" fill="#4cc9f0" stroke="#2b2b2b" stroke-width="2"/><circle cx="${cx + 26}" cy="${y + 2}" r="3.5" fill="#06d6a0" stroke="#2b2b2b" stroke-width="2"/>`;
    const car = (c, x, place, h, col) => {
      let o = '';
      const w = 120, cx = x + w / 2;
      if (h && badge) h += 18;            // (Heart Battle: taller steps, room for the hearts under the number)
      if (h) o += GL.step(x, FLOOR - h, w, h, col, c.isPlayer) + svgText(cx, FLOOR - h + (badge ? 34 : 50), place, badge ? 30 : 40, '#fff', 'middle', '#2b2b2b');
      else o += GL.floor(cx, FLOOR + 2, 40) + `<circle cx="${cx}" cy="${FLOOR - 30}" r="28" fill="url(#gl-white)" stroke="#2b2b2b" stroke-width="5"/>` +
        `<ellipse cx="${cx}" cy="${FLOOR - 44}" rx="16" ry="7" fill="#fff" opacity="0.8"/>` + svgText(cx, FLOOR - 16, place, 30);
      const top = FLOOR - (h || 60) - CAR + 6;
      if (c.isPlayer && happy) for (const [dx, dy, r, cc] of [[-8, 18, 10, '#ffd166'], [w + 8, 30, 8, '#f15bb5'], [w - 2, -2, 7, '#4cc9f0']]) o += sparkle(x + dx, top + dy, r, cc);
      o += imgIn(carOf(c), cx - CAR / 2, top, CAR, CAR);
      let y = top + 4;
      if (place === 1) { o += crown(cx, y - 20); y -= 24; }
      if (c.isPlayer) o += `<rect x="${cx - 38}" y="${y - 38}" width="76" height="34" rx="17" fill="#ef476f" stroke="#2b2b2b" stroke-width="4"/>` +
        `<rect x="${cx - 28}" y="${y - 35}" width="56" height="10" rx="5" fill="#fff" opacity="0.45"/>` + svgText(cx, y - 14, 'You!', 22, '#fff');
      if (badge) o += badge(c, cx, h ? FLOOR - 14 : FLOOR + 22);
      return o;
    };
    for (let i = 0; i < 3; i++) if (order[i]) s += car(order[i], STEP[i].x, i + 1, STEP[i].h, STEP[i].col);
    if (extra) s += car(order[me], 430, me + 1, 0);
    const y0 = badge ? -24 : -6;
    return `<svg viewBox="0 ${y0} ${VW} ${FLOOR + 6 - y0 + (badge && extra ? 40 : 0)}">${s}</svg>`;
  }
  // Heart Battle: the hearts a car had left on its step (a sparkle = it poofed)
  const heartBadge = (c, x, y) => c.hearts > 0
    ? `<path transform="translate(${x - 26} ${y - 14}) scale(0.9)" d="M12 22 C2 14 0 9 0 6 C0 2 3 0 6 0 C9 0 11 2 12 4 C13 2 15 0 18 0 C21 0 24 2 24 6 C24 9 22 14 12 22 Z" fill="#ef476f" stroke="#2b2b2b" stroke-width="2.5"/>` + svgText(x + 14, y + 6, c.hearts, 20)
    : `<path transform="translate(${x} ${y - 4})" d="M0 -12 L3 -3 L12 0 L3 3 L0 12 L-3 3 L-12 0 L-3 -3 Z" fill="#fff" stroke="#2b2b2b" stroke-width="2"/>`;
  // a race's results: the podium, + the coins you won and one flag per cup race
  function raceRows(g, order, earned, raceNum, raceCount, badge) {
    const rows = [{ t: 'pics', items: [podiumSVG(g, order, badge)], size: 350, kind: 'podium', place: order.findIndex(c => c.isPlayer) + 1 }];
    // the coins you won + the cup's flags, in one row
    const bits = (earned ? [coinSVG(40), '+' + earned] : []).concat(Array.from({ length: raceCount || 0 }, (_, i) => flagSVG(i < raceNum)));
    if (bits.length) rows.push(Object.assign(stripRow(bits, 40), { earned }));
    return rows;
  }
  // The end of a cup: a trophy (gold / silver / bronze by your place) and the top 3 with their points.
  function cupPodiumSVG(g, cup, rank) {
    const table = standings(cup);
    const carOf = (name) => name === 'You' ? myCarImg(g) : carImg('classic', (cup.colors || {})[name] || '#ccc', 'none');
    const cupCol = ['#ffc93c', '#cfd8e3', '#e9965a'][rank - 1] || '#bbbbbb';
    // (glossy, Nov 23: the trophy glows with light rays behind it, shiny steps, a shadow under the podium)
    const STEP = [{ h: 104, col: 'gold', x: 250 }, { h: 78, col: 'silver', x: 140 }, { h: 60, col: 'bronze', x: 360 }];
    let s = GL.defs() + (rank <= 3 ? GL.rays(65, 128, 110, 12) : '') + GL.glow(65, 128, rank <= 3 ? 78 : 50) + GL.floor(65, 196, 52) +
      GL.trophy(cupCol, 65, 76, 1.2) + (rank <= 3 ? svgText(65, 76 + 40 * 1.2, rank, 24, '#fff', 'middle', '#2b2b2b') : '') +
      (rank === 1 ? GL.sparkle(22, 84, 9, '#ffd166') + GL.sparkle(112, 96, 7, '#fff') + GL.sparkle(104, 60, 6, '#4cc9f0') : '') +
      GL.floor(305, 252, 170);
    table.slice(0, 3).forEach((r, i) => {
      const st = STEP[i], top = 250 - st.h, me = r.name === 'You';
      s += GL.step(st.x, top, 100, st.h, st.col, me) +
        svgText(st.x + 50, top + 32, i + 1, 28, '#fff', 'middle', '#2b2b2b') + svgText(st.x + 50, top + Math.min(st.h - 10, 58), r.pts + ' pts', 16) +
        imgIn(carOf(r.name), st.x + 12, top - 96, 76, 76) + svgText(st.x + 50, top - 6, me ? 'You' : r.name, 17, me ? '#ffd166' : '#fff', 'middle', '#2b2b2b');
    });
    const mine = table.findIndex(r => r.name === 'You');
    if (mine >= 3) s += GL.pill(150, 262, 310, 30, 'me') + svgText(305, 284, ORD(mine + 1) + ': You, ' + table[mine].pts + ' pts', 20);
    return `<svg viewBox="0 40 470 ${mine >= 3 ? 262 : 218}">${s}</svg>`;
  }
  // the Grand Prix points table: place, the car's color, its name, its points (shiny rows, yours gold)
  function standingsSVG(cup) {
    const rows = standings(cup);
    return `<svg viewBox="0 0 304 ${rows.length * 40 + 10}">` + GL.defs() + rows.map((r, i) => {
      const y = i * 40 + 4, me = r.name === 'You';
      return GL.pill(2, y, 296, 34, me ? 'me' : 'white') +
        svgText(34, y + 24, ORD(i + 1), 18) + `<circle cx="78" cy="${y + 17}" r="10" fill="${(cup.colors || {})[r.name] || '#ccc'}" stroke="#2b2b2b" stroke-width="3"/>` +
        `<circle cx="75" cy="${y + 13}" r="3" fill="#fff" opacity="0.8"/>` +
        svgText(98, y + 24, me ? 'You' : r.name, 18, '#2b2b2b', 'start') + svgText(286, y + 24, r.pts, 18, '#2b2b2b', 'end');
    }).join('') + '</svg>';
  }
  // the Daily Ghost Race: you and Boo, 1st and 2nd, with your times; the ghost trophy + how many days you beat him
  function booSVG(g, won, mine, his, wins, newCar) {
    const line = (y, first, pic, t) => GL.pill(4, y, 300, 66, first ? 'gold' : 'white') +
      svgText(46, y + 44, first ? '1st' : '2nd', 24) + pic(96, y + 3) + svgText(214, y + 44, t.toFixed(1) + ' s', 26) +
      (first ? nest(STAR_PIC, 262, y + 13, 40, 40) : '');
    const me = (x, y) => imgIn(myCarImg(g), x, y, 60, 60), boo = (x, y) => nest(BOO_PIC, x, y, 60, 60);
    let s = GL.defs() + GL.glow(362, 44, 50) + GL.floor(362, 82, 36);
    s += won ? line(4, true, me, mine) + line(78, false, boo, his) : line(4, true, boo, his) + line(78, false, me, mine);
    s += nest(trophySVG('ghost', booLevel(wins)), 330, 0, 64, 80) + svgText(362, 112, '× ' + wins, 24, '#fff', 'middle', '#2b2b2b');
    if (newCar) s += GL.rays(455, 55, 70, 10) + GL.glow(455, 55, 55) + imgIn(carImg('ghostcar', pickedCar(g).color, 'none'), 410, 10, 90, 90) +
      svgText(455, 124, 'NEW!', 24, '#ffd166', 'middle', '#2b2b2b');
    return `<svg viewBox="0 0 ${newCar ? 504 : 404} 150">${s}</svg>`;
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
    canvasMenus: true,           // (Nov 21) menus drawn with Phaser + Rex UI (see "Canvas menus" above)
    readyJingle: false,          // RC has its own "3, 2, 1, Go!" countdown
    difficulty: false,           // no Easy/Normal/Challenge: tracks get harder instead
    view: { w: W, h: H },
    background: '#4f9d4a',
    music: () => SONGS[T.def.song || T.def.id],   // each track plays its own song (home-made tracks: their world's song)
    levelsTitle: 'Mini RC Racers',
    looks: { kinds: ['trail'] },   // (Nov 24, the Star Road: stars unlock car trails; the Looks button is in our own main menu)
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
      right: [{ id: 'Space', icon: giftIcon, label: 'Use item', color: '#ffb703' }, { id: 'ArrowDown', icon: icons.brake, label: 'Brake / reverse', color: '#ef476f' }, { id: 'ArrowUp', icon: icons.gas, label: 'Gas', color: '#06d6a0', main: true }],
    },
    // One thumb (Nov 23, plan point 4 part 2): the car drives itself, eases off before bends and steers
    // back to the middle of the road; the thumb only steers (Left + Right side by side on the right), and
    // a gift goes off by itself (thumbItem).
    oneThumb: {
      buttons: { right: [{ id: 'ArrowLeft', icon: icons.left, label: 'Steer left' }, { id: 'ArrowRight', icon: icons.right, label: 'Steer right' }] },
      howTo: [
        { pic: S(`<path d="M10 40 H56" stroke="#2b2b2b" stroke-width="8" stroke-linecap="round"/><path d="M44 24 L62 40 L44 56" fill="none" stroke="#06d6a0" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`), text: 'It goes by itself!' },
        { pic: S(`<path d="M18 26 L6 40 L18 54 M62 26 L74 40 L62 54" fill="none" stroke="#2b2b2b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>` + carSmall('#ef476f')), text: 'Steer' },
        { pic: S(`<g transform="translate(16 16)">${giftIcon.replace(/<\/?svg[^>]*>/g, '')}</g>`), text: 'Gifts go off by themselves' },
      ],
    },
    // "Show me" (Nov 24, plan point 6 part 3): two thumbs, like on a tablet (demoThink above)
    showMe: {
      secs: 8,
      keys: (g) => g.oneThumb ? ['ArrowLeft', 'ArrowRight'] : ['ArrowLeft', 'ArrowRight', 'Space', 'ArrowUp'],
      sides: { ArrowUp: 'R' },           // (on a computer the gas is the right hand's too, like the pad)
      think: (g, hand, t) => demoThink(g, hand, t),
    },
    levels,
    // title screen: the logo + "tap to start". (Nov 23, Keith: every logo in the same new style, drawn by Phaser; the old
    // road-scene LOGO above is kept for the HTML menus' fallback only.)
    logo: window.ArcadeMenus ? Arcade.logo({ badge: Arcade.badges.rc, title: 'Mini RC', title2: 'Racers', colors: ['#ffe066', '#ef476f'], bg: '#90be6d' }) : LOGO,
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
  window.__rcTodayName = () => dailyTrack(window.__game).name;   // test-only: the Ghost Race track today
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
