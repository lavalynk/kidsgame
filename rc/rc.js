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
    { id: 't6', name: 'Candy Raceway', theme: 'candy', hw: 88, items: [0.12, 0.25, 0.62, 0.75], bridge: 'second',   // a figure 8: the 2nd pass ramps up over a bridge
      pts: [[3337, 2200], [3582, 2111], [3752, 1861], [3839, 1500], [3839, 1100], [3752, 739], [3582, 489], [3337, 400], [3031, 489], [2678, 739], [2296, 1100], [1904, 1500], [1522, 1861], [1169, 2111], [863, 2200], [618, 2111], [448, 1861], [361, 1500], [361, 1100], [448, 739], [618, 489], [863, 400], [1169, 489], [1522, 739], [1904, 1100], [2296, 1500], [2678, 1861], [3031, 2111]] },
    { id: 't7', name: 'Moonlight Speedway', theme: 'moon', hw: 86, items: [0.22, 0.5, 0.78],
      pts: [[1700, 2220], [1901, 2027], [2022, 1857], [2176, 1804], [2486, 1844], [2928, 1845], [3304, 1701], [3406, 1438], [3207, 1178], [2870, 1008], [2578, 910], [2389, 823], [2251, 717], [2104, 602], [1928, 475], [1700, 320], [1387, 168], [1018, 121], [725, 267], [650, 573], [789, 895], [955, 1114], [950, 1239], [751, 1377], [521, 1595], [439, 1860], [554, 2094], [799, 2254], [1099, 2338], [1414, 2334]] },
    { id: 't8', name: 'Volcano Valley', theme: 'volcano', hw: 84, items: [0.15, 0.4, 0.65, 0.88],
      pts: [[1800, 2557], [2085, 2682], [2361, 2616], [2523, 2381], [2586, 2125], [2710, 1977], [3002, 1903], [3322, 1764], [3390, 1524], [3122, 1297], [2742, 1175], [2533, 1093], [2536, 933], [2574, 687], [2492, 461], [2283, 353], [2029, 372], [1800, 457], [1603, 514], [1373, 474], [1042, 372], [667, 356], [446, 541], [514, 862], [740, 1147], [837, 1325], [696, 1486], [515, 1707], [545, 1925], [809, 2029], [1124, 2023], [1341, 2023], [1465, 2127], [1593, 2332]] },
    { id: 't9', name: 'Jungle Rally', theme: 'jungle', hw: 84, items: [0.2, 0.45, 0.7, 0.9],
      pts: [[1700, 2564], [1974, 2354], [2116, 2093], [2192, 1901], [2364, 1843], [2725, 1838], [3151, 1749], [3400, 1532], [3365, 1270], [3141, 1053], [2874, 898], [2615, 790], [2361, 727], [2130, 685], [1926, 612], [1700, 493], [1412, 397], [1098, 398], [813, 496], [568, 645], [374, 833], [314, 1066], [455, 1303], [704, 1478], [858, 1603], [827, 1774], [735, 2044], [771, 2348], [997, 2570], [1343, 2645]] },
    { id: 't10', name: 'Cloud Castle', theme: 'sky', hw: 82, items: [0.1, 0.3, 0.5, 0.7, 0.88],   // big: winds over 3 castle towers
      pts: [[2400, 3000], [3000, 3020], [3600, 2960], [4150, 2750], [4500, 2350], [4550, 1850], [4400, 1400], [4150, 1100], [3950, 700], [3800, 380], [3550, 250], [3300, 380], [3200, 750], [3100, 1150], [2900, 1350], [2650, 1250], [2550, 900], [2450, 500], [2250, 300], [2000, 300], [1850, 550], [1800, 950], [1700, 1300], [1450, 1450], [1200, 1300], [1100, 950], [1000, 550], [800, 330], [550, 350], [380, 650], [350, 1100], [400, 1600], [600, 2000], [1000, 2150], [1350, 2050], [1650, 2150], [1750, 2500], [1950, 2850]] },
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
    { id: 'racer',   name: 'Speedster',     perk: 'speed',   does: 'Faster, but slidier',       need: 'Finish a Grand Prix',   ok: g => (g.save.data.cupsDone || 0) >= 1 },
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
    t1:  { tempo: 132, root: 60, scale: 'major',      prog: [[1, 5, 6, 4], [4, 5, 6, 5]], drums: 'disco',    bass: 'octaves', lead: 'square',   pad: true,  arp: 'B', seed: 101 },
    t2:  { tempo: 150, root: 65, scale: 'mixolydian', prog: [[1, 4, 1, 5], [4, 4, 1, 5]], drums: 'surf',     bass: 'walk',    lead: 'saw',      pad: false, arp: true, swing: 0.12, seed: 202 },
    t3:  { tempo: 128, root: 67, scale: 'major',      prog: [[1, 6, 4, 5], [4, 5, 3, 6]], drums: 'march',    bass: 'walk',    lead: 'triangle', pad: true,  arp: true, bells: true, seed: 303 },
    t4:  { tempo: 118, root: 62, scale: 'dorian',     prog: [[1, 4, 1, 7], [3, 4, 5, 1]], drums: 'soft',     bass: 'bounce',  lead: 'square',   pad: true,  arp: true, swing: 0.08, seed: 404 },
    t5:  { tempo: 128, root: 64, scale: 'harmonic',   prog: [[1, 6, 5, 1], [4, 5, 1, 5]], drums: 'tribal',   bass: 'bounce',  lead: 'saw',      pad: false, arp: true, seed: 505 },
    t6:  { tempo: 160, root: 69, scale: 'major',      prog: [[1, 4, 5, 4], [6, 4, 1, 5]], drums: 'bubble',   bass: 'octaves', lead: 'square',   pad: true,  arp: 'B', seed: 606 },
    t7:  { tempo: 112, root: 57, scale: 'minor',      prog: [[1, 7, 6, 7], [4, 5, 1, 1]], drums: 'halftime', bass: 'pulse',   lead: 'saw',      pad: true,  arp: true, seed: 707 },
    t8:  { tempo: 168, root: 62, scale: 'harmonic',   prog: [[1, 6, 4, 5], [6, 7, 1, 5]], drums: 'punk',     bass: 'eighths', lead: 'saw',      pad: false, arp: false, seed: 808 },
    t9:  { tempo: 136, root: 64, scale: 'dorian',     prog: [[1, 4, 1, 4], [7, 4, 1, 5]], drums: 'latin',    bass: 'bounce',  lead: 'square',   pad: false, arp: true, seed: 909 },
    t10: { tempo: 120, root: 63, scale: 'major',      prog: [[1, 3, 4, 5], [6, 4, 2, 5]], drums: 'halftime', bass: 'whole',   lead: 'triangle', pad: true,  arp: true, bells: true, seed: 1010 },
  };

  window.__songs = SONGS;   // test-only: lets tests play/record each track's song

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
  // distance between two spots on a lap (going either way round)
  const lapDist = (a, b, L) => { const d = Math.abs(a - b) % L; return Math.min(d, L - d); };
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
    const T = { def, main, hw: def.hw, L: main.L, theme: THEMES[def.theme], short: null, shw: 54 };
    // shortcut: snap its ends onto the centerline
    if (def.short) {
      const a = nearest(main, def.short.from[0], def.short.from[1]);
      const b = nearest(main, def.short.to[0], def.short.to[1]);
      const pa = main.pts[a.i], pb = main.pts[b.i];
      T.short = makePath(spline([pa, ...def.short.via, pb], false, 30), false);
      T.sA = a.i * main.step; T.sB = b.i * main.step;
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
    for (let s = 500; s < T.L - 400; s += 40) cand.push({ s, v: Math.min(vlimAt(P, s), vlimAt(P, s + 150), vlimAt(P, s - 100)) });
    cand.sort((a, b) => b.v - a.v);
    const busy = T.def.items.map(f => f * T.L).concat(hazards.map(h => h.s));
    const want = ti >= 1 ? ['boost', 'ramp', 'boost'] : ['boost', 'boost'];
    for (const kind of want) {
      const c = cand.find(c => !busy.some(b => Math.abs(b - c.s) < 320) && !nearCross(c.s, 750) && !out.some(o => Math.abs(o.s - c.s) < 1400) && !(T.short && c.s > T.sA - 200 && c.s < T.sB + 200));
      if (!c) continue;
      const p = pointAt(P, c.s);
      out.push({ kind, s: c.s, x: p.x, y: p.y, a: Math.atan2(p.ty, p.tx) });
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
    } else if (level && level.id.startsWith('tt-')) {
      // Time Trial: just you (maxed car), no gift boxes, beat your ghost
      mode = 'trial';
      wallet = { coins: 0, up: Object.fromEntries(UPGRADES.map(u => [u.id, MAX_LVL])) };
      def = TRACKS.find(t => 'tt-' + t.id === level.id) || TRACKS[0];
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
    // (free play: you have a maxed car, so the rivals drive like on the last track)
    const skill = rivalSkill(mode === 'free' ? TRACKS.length - 1 : ti);
    const flavor = [1.03, 1.0, 0.96];  // each rival is a little different
    cars = [];
    let r = 0;
    for (let k = 0; k < 4; k++) {
      const [back, lat] = slots[k];
      if (mode === 'trial' && k !== pSlot) continue;     // Time Trial: only you
      if (k === pSlot) {
        player = makeCar(playerStats(wallet), mine.color, 'You', true, T.L - back, (mode === 'trial' ? 0 : lat) * T.hw);
        player.style = pickedStyle(g).id;
        player.perk = pickedStyle(g).perk;          // this style's special thing
        if (player.perk === 'speed') { player.stats.top *= 1.06; player.stats.grip *= 0.88; }
        if (player.perk === 'tank') player.stats.mass *= 1.7;
        player.decal = pickedDecal(g);
        player.fx = mine.fx || null;                 // neon glow / gold sparkle / rainbow
        player.trail = [];
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
    if (mode !== 'trial') for (const f of T.def.items) {
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
    // ---- coins on the track (Grand Prix only): wavy rows that reward good steering ----
    trackCoins = [];
    if (mode === 'cup') {
      const value = Math.max(2, Math.round(2 * (1 + 0.25 * ti)));
      for (const f of [0.1, 0.34, 0.56, 0.8]) {
        const s0 = f * T.L, ph = f * 17;
        if (pads.some(pd => Math.abs(pd.s - s0) < 260) || nearCross(s0, 700)) continue;
        for (let k = 0; k < 6; k++) {
          const s = (s0 + k * 38) % T.L, lat = Math.sin(ph + k * 0.75) * 0.5 * T.hw, p = pointAt(T.main, s);
          trackCoins.push({ x: p.x - p.ty * lat, y: p.y + p.tx * lat, t: 0, value, spin: k * 0.6 });
        }
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
      weather, pads: pads.map(pd => ({ kind: pd.kind, s: Math.round(pd.s), x: Math.round(pd.x), y: Math.round(pd.y), a: pd.a })), trackCoins: trackCoins.length, ghost: ghost ? ghost.t : null, air: player.air || 0, style: player.style, decal: player.decal,
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
    window.__rcHaz = () => hazards;                               // test-only: oil, puddles, honey
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
    const wx = WEATHER[weather] || WEATHER.sun;
    const wGrip = hasPerk(c, 'weather') ? 1 : wx.grip;     // Ice Cream Van: never slippery
    let topMul = wx.top, accMul = 1, grip = st.grip * wGrip, drag = 0;
    if (c.surface === 'grass' && !(c.cloud > 0) && !(c.air > 0)) {
      if (hasPerk(c, 'grass')) topMul = 0.92;               // Monster Truck: big wheels roll right over grass
      else { topMul = g.pick(0.6, 0.5, 0.45); grip *= 0.75; drag = 1.2; }
    }
    else if (c.surface === 'dirt') topMul = 0.88;
    else if (c.surface === 'planks') topMul = 0.92;
    else if (c.surface === 'ice') { topMul = 1.0; grip *= 0.3; }
    if (c.inPuddle && !hasPerk(c, 'splash')) topMul *= 0.7;
    if (c.cloud > 0) topMul *= 1.12;          // Cloud Ride: a gentle lift, grass doesn't slow you
    if (c.bubbled > 0) topMul *= 0.35;
    if (c.boost > 0) { topMul *= 1.4 + (st.nitro - 1) * 0.25 + (hasPerk(c, 'boost') ? 0.12 : 0); accMul = hasPerk(c, 'boost') ? 2.8 : 2.2; }   // nitro upgrade = stronger boost
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
    let limit = Math.min(vlimAt(P, sHere), vlimAt(P, sHere + 50)) * sk.corner * (WEATHER[weather] || WEATHER.sun).corner;
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
  const RARITY = { boost: 'common', bubble: 'common', shield: 'common', cloud: 'uncommon', honey: 'uncommon', star: 'rare', coins: 'rare' };
  const RARITY_COLOR = { common: '#fff7d6', uncommon: '#b9fbc0', rare: '#ffd166' };
  const ITEM_ODDS = {        // percent; each row adds up to 100
    front:  { shield: 34, bubble: 26, boost: 10, honey: 18, cloud: 6,  star: 3, coins: 3 },
    middle: { boost: 28, bubble: 24, shield: 18, cloud: 12, honey: 12, star: 3, coins: 3 },
    back:   { boost: 36, bubble: 20, shield: 14, cloud: 18, honey: 6,  star: 3, coins: 3 },
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
    const noCoins = !c.isPlayer || mode === 'free';
    c.item = rollItem(odds, noCoins ? 'coins' : null);
  }

  function useItem(g, c) {
    const it = c.item; if (!it) return;
    c.item = null;
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
      if (c.isPlayer) { g.sfx('splash'); popup('Honey!', c.x, c.y - 50, '#ffb703'); }
    } else if (it === 'coins') {           // bonus coins, added at the finish
      const add = Math.round(30 * (1 + 0.25 * TRACKS.findIndex(t => t.id === T.def.id)));
      bonusCoins += add;
      if (c.isPlayer) { g.sfx('coin'); popup('+' + add + ' coins!', c.x, c.y - 50, '#ffc93c'); fx.burst(c.x, c.y, { count: 14, colors: ['#ffc93c', '#ffd166', '#fff'], speed: 200, gravity: 0, size: 10, life: 0.6 }); }
    } else if (it === 'boost') {
      c.boost = 1.3 * (c.stats.nitro || 1) * (hasPerk(c, 'boost') ? 1.35 : 1);   // nitro upgrade = longer boost
      if (c.isPlayer) { g.sfx('boost'); popup('Boost!', c.x, c.y - 50, '#ff8c42'); }
    } else if (it === 'shield') {
      c.shield = hasPerk(c, 'tank') ? 12 : 6;
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
      bubbles.push({ x: c.x + Math.cos(c.a) * 30, y: c.y + Math.sin(c.a) * 30, vx: Math.cos(c.a) * sp, vy: Math.sin(c.a) * sp, owner: c, target, life: 2.4, h: c.h || 0 });
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
      if (n !== g.beeped && n >= 1 && n <= 3) { g.beeped = n; g.sfx('beep'); say(['one', 'two', 'three'][n - 1]); }
      if (countdown <= 0) {
        g.sfx('go'); say('Go!');
        if (hasPerk(player, 'launch')) { player.boost = 0.9; popup('Rocket start!', player.x, player.y - 60, '#ff8c42', 32); }
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
      c.cloud = Math.max(0, (c.cloud || 0) - dt);
      if (c.star > 0 && Math.random() < dt * 30) fx.burst(c.x, c.y, { count: 1, shape: 'star', speed: 80, gravity: 0, size: 12, life: 0.5 });

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
          if (hasPerk(c, 'jump')) { c.boost = Math.max(c.boost, 0.6); if (c.isPlayer) popup('Quack!', c.x, c.y - 50, '#ffd166'); }
        }
      }
      locate(c);
      walls(g, c);
      // boost pads and ramps
      for (const pd of pads) {
        let ds = c.s - pd.s; if (ds < -T.L / 2) ds += T.L; if (ds > T.L / 2) ds -= T.L;
        if (Math.abs(ds) > 26 || c.near.dist > T.hw + 10 || c.onShort || c.h > 0.2) continue;
        if (c.padCool && c.padCool[pd.s] > raceTime) continue;
        (c.padCool = c.padCool || {})[pd.s] = raceTime + 1;
        if (pd.kind === 'boost') {
          c.boost = Math.max(c.boost, 0.7 * (c.stats.nitro || 1) * (hasPerk(c, 'boost') ? 1.35 : 1));
          if (c.isPlayer) addFeat(g, f => { f.pads = (f.pads || 0) + 1; });   // (for the Rocket)
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
        coinStreak++; coinStreakT = 0.9;
        g.tone(880 * Math.pow(1.06, Math.min(12, coinStreak)), 0.09, { type: 'square', vol: 0.12 });
        fx.burst(cn.x, cn.y, { count: 6, colors: ['#ffc93c', '#fff'], speed: 120, gravity: 0, size: 8, life: 0.4 });
        if (coinStreak === 6) { popup('All 6!', c.x, c.y - 60, '#ffc93c', 32); addFeat(g, f => { f.all6 = true; }); }
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
          if (hasPerk(c, 'oil')) { if (c.isPlayer && !(c.oilCool > 0)) { c.oilCool = 1; popup('Grip!', c.x, c.y - 50, '#06d6a0'); } }
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
            if (c.isPlayer) { g.sfx('splash'); popup('Splash!', c.x, c.y - 50, '#8ecae6'); }
            fx.burst(c.x, c.y, { count: 14, colors: ['#8ecae6', '#ffffff', '#4cc9f0'], speed: 200, gravity: 0, size: 10, life: 0.6 });
          }
        }
      }
      c.inPuddle = puddle;

      // ---- gift boxes ----
      for (const b of boxes) {
        if (b.t > 0 || Math.hypot(c.x - b.x, c.y - b.y) > 32 || c.h > 0.5) continue;
        b.t = 3;
        fx.burst(b.x, b.y, { count: 12, shape: 'star', speed: 180, gravity: 0, size: 12, life: 0.6 });
        if (!c.item) {
          giveItem(c);
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
    follow(dt);

    // after you cross the line, let the others zoom in for a moment, then show results
    // engine sound follows your car (updated 30 times a second)
    if (++engineTick % 4 === 0) {
      if (!engine.n && !player.finished) engine.start();
      const gas = g.input.down('ArrowUp', 'KeyW') || autopilot;
      engine.set(Math.hypot(player.vx, player.vy), gas && !player.finished, player.skidAmt || 0, player.boost > 0);
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
      for (const c of cars) {
        if (c === b.owner || c.finished || b.life <= 0) continue;
        if (Math.hypot(c.x - b.x, c.y - b.y) < 30 && Math.abs((c.h || 0) - (b.h || 0)) < 0.4) {
          b.life = 0;
          fx.burst(b.x, b.y, { count: 14, colors: ['#ffffff', '#9bf6ff', '#ffc8dd'], speed: 180, gravity: 0, size: 10, life: 0.5 });
          if (hasPerk(c, 'hover')) { /* UFO: the bubble just bounces off */ }
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
    // (Grand Prix only — free play has no coins)
    const earned = payFor(place, ti) + bonusCoins;
    if (mode === 'cup') {
      wallet.coins = coins(wallet) + earned;
      lines.push(`<b style="font-size:24px">${coinSVG(28)} +${earned}</b> &nbsp;(you have ${coins(wallet)})` + (bonusCoins ? `<br><span style="font-size:15px">${bonusCoins} of them picked up on the track</span>` : ''));
    }
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
    g.save.data.cupsDone = (g.save.data.cupsDone || 0) + 1;
    const before = STYLES.filter(st => st.ok(g)).length;
    const medal = ['gold', 'silver', 'bronze'][rank - 1] || null;
    if (medal) g.save.data.cupBest = Math.min(g.save.data.cupBest || 9, rank);
    g.store();
    // new car styles unlocked by this cup?
    STYLES.filter(st => st.ok(g)).slice(before).forEach(st => g.toast('New car: ' + st.name + '!'));
    g.finish({
      win: rank <= 3, medal, stars: [3, 2, 1][rank - 1] || 0,
      title: rank === 1 ? 'Grand Prix Champion!' : rank <= 3 ? 'Grand Prix: ' + ORD(rank) + ' place!' : 'Grand Prix done!',
      lines: [lines[order.indexOf(player)] ? 'Last race: ' + ORD(place) : '', standingsHTML(cup)], delay: 300,
      buttons: [
        { icon: trophyIcon, label: 'New Grand Prix', cls: 'big', onClick: () => g.play({ id: 'cupnew' }) },
        { icon: icons.menu, label: 'Menu', cls: 'blue', onClick: () => g.menu() },
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
  let garageTab = 'up';     // which garage tab was open last
  function openCupGarage(g) {
    g.menuMusic();                       // the garage plays the menu song
    const cup = cupOf(g);
    const next = TRACKS[cup.race];
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
      trackPic(next).replace('<svg', '<svg style="width:90px;height:52px"') + `<div>Race ${cup.race + 1} of ${TRACKS.length}<br>${next.name}</div>`));
    const go = Arcade.h('button', { type: 'button', class: 'ar-btn big' }, `${icons.play}<span>Next race</span>`);
    go.addEventListener('click', () => { Arcade.sfx('click'); g.play({ id: 'cup' }); });
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

    // boost pads (glowing arrows) and jump ramps
    for (const pd of pads) if (vis(pd.x, pd.y, 150)) drawPad(ctx, pd, g.time);
    // hazards
    for (const h of hazards) if (vis(h.x, h.y)) drawHazard(ctx, h, g.time);
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

    // light trail behind special paints (neon / rainbow)
    if (player.fx && player.fx !== 'gold' && player.trail.length > 2) drawTrail(ctx, player, g.time);

    // cars (furthest-up first, so lower cars overlap them nicely)
    const sorted = cars.slice().sort((a, b) => a.y - b.y);
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
    drawWeather(ctx, g.time);
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
    ctx.save(); ctx.translate(pd.x, pd.y); ctx.rotate(pd.a);
    const hw = T.hw - 6;
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

  function drawCar(ctx, c, time) {
    ctx.save();
    ctx.translate(c.x, c.y);
    // shadow
    const lift = c.h || 0;                       // up on the bridge: the shadow falls further away
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(4 + 12 * lift, 6 + 16 * lift, 28, 20, 0, 0, 7); ctx.fill();
    if (c.ghost > 0 && Math.floor(time * 12) % 2) ctx.globalAlpha = 0.5;
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
    if (hop) ctx.scale(1 + hop * 0.35, 1 + hop * 0.35);
    let paint = c.color;
    if (c.fx === 'rainbow') paint = hueHex((time * 120) % 360);
    if (c.fx === 'neon' || c.fx === 'rainbow') { ctx.shadowColor = paint; ctx.shadowBlur = 16 + 6 * Math.sin(time * 6); }
    drawCarShape(ctx, paint, { wag: Math.sin(time * 9 + c.x * 0.01) * 3 * Math.min(1, Math.abs(c.vF || 0) / 200), style: c.style, decal: c.decal });
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
    D.text(ctx, String(pos), 812, 42, { size: 60, color: col, align: 'right' });
    D.text(ctx, ['st', 'nd', 'rd', 'th'][pos - 1], 816, 52, { size: 26, color: col, align: 'left' });

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
    // order: Grand Prix, Free play, then Time Trial
    const rank = lv => lv.id.startsWith('cup') ? 0 : lv._trial ? 2 : 1;
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
    .ar-panel.rc-screen { width: min(880px, 100%); height: min(620px, calc(100vh - 32px)); height: min(620px, calc(100dvh - 32px));
      display: flex; flex-direction: column; justify-content: safe center; overflow-y: auto; }
    .ar-panel.rc-screen > * { flex-shrink: 0; }
    .ar-panel.rc-screen:has(.rc-head) { justify-content: flex-start; }   /* our menus: title always at the top */
    .ar-panel.rc-screen > .rc-body, .ar-panel.rc-screen > .rc-modes { margin-top: auto; margin-bottom: auto; }
    .rc-head { display: flex; align-items: center; gap: 8px; }
    .rc-head .ar-title { flex: 1; margin: 0; }
    .rc-head .ar-btn { min-width: 0; padding: 8px 14px; margin: 0; }
    .rc-modes { grid-template-columns: repeat(2, minmax(0, 1fr)); width: 100%; max-width: 620px; align-self: center; }
    .rc-bigpic { height: 86px !important; }
    .rc-bigpic svg, .rc-bigpic img { height: 86px !important; width: 86px !important; }
    @media (max-height: 520px) {
      .rc-bigpic { height: 50px !important; }
      .rc-bigpic svg, .rc-bigpic img { height: 50px !important; width: 50px !important; }
      .rc-modes { grid-template-columns: repeat(4, minmax(0, 1fr)); max-width: none; }
      .rc-modes .ar-tile { padding: 6px 4px; min-height: 0; }
      .rc-head .ar-title { font-size: 26px; }
    }
    @media (max-width: 480px) { .rc-head .ar-btn span { display: none; } .rc-head .ar-title { font-size: 26px; } }
    @keyframes rcGlow { from { filter: drop-shadow(0 0 2px #fff) brightness(1); } to { filter: drop-shadow(0 0 9px #fff) brightness(1.25); } }
    @keyframes rcHue { from { filter: hue-rotate(0deg) saturate(1.3); } to { filter: hue-rotate(360deg) saturate(1.3); } }
    @keyframes rcShine { from { filter: brightness(1); } to { filter: brightness(1.3) drop-shadow(0 0 5px #ffd166); } }`));
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
  const MENU_SONG = { tempo: 108, root: 65, scale: 'mixolydian', prog: [[1, 6, 4, 5], [2, 5, 1, 4]], drums: 'soft', bass: 'walk', lead: 'triangle', pad: true, arp: true, swing: 0.1, bells: true, seed: 4242 };
  let carTab = 'style';     // which My car tab was open last

  const MENU_PICS = {
    cup: trophyIcon,
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

  // ---- the main menu ----
  function mainMenu(g) {
    const p = screen('Mini RC Racers', null);
    const cup = cupOf(g), best = g.save.data.cupBest;
    const grid = Arcade.h('div', { class: 'ar-grid rc-modes' });
    grid.appendChild(bigTile(MENU_PICS.cup, 'Grand Prix',
      cup && cup.active ? `race ${cup.race + 1} of ${TRACKS.length}` : best ? icons.medal(['gold', 'silver', 'bronze'][best - 1]).replace('<svg', '<svg style="width:22px;height:22px;vertical-align:middle"') + ' best' : 'all ' + TRACKS.length + ' tracks',
      () => cupMenu(g), { 'data-menu': 'cup' }));
    grid.appendChild(bigTile(MENU_PICS.free, 'Free Play', 'any track', () => trackMenu(g, 'free'), { 'data-menu': 'free' }));
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
    const cup = cupOf(g);
    if (!cup || !cup.active) { g.play({ id: 'cupnew' }); return; }      // nothing to continue: just go!
    const p = screen('Grand Prix', () => mainMenu(g));
    p.appendChild(Arcade.h('div', {}, standingsHTML(cup)));
    const grid = Arcade.h('div', { class: 'ar-grid rc-modes' });
    const next = TRACKS[cup.race];
    grid.appendChild(bigTile(trackPic(next), 'Keep going', `race ${cup.race + 1}: ${next.name}`, () => g.play({ id: 'cup' }), { 'data-cup': 'go' }));
    grid.appendChild(bigTile(MENU_PICS.cup, 'Start over', 'new Grand Prix', () => g.play({ id: 'cupnew' }), { 'data-cup': 'new' }));
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
    const grid = Arcade.h('div', { class: 'ar-grid rc-body', style: 'width:100%' });
    for (const lv of levels(g).filter(l => kind === 'trial' ? l._trial : (!l._trial && !l.id.startsWith('cup')))) {
      const t = Arcade.h('button', { type: 'button', class: 'ar-tile', 'data-track': lv.id },
        `<div class="pic">${lv.pic}</div><div>${lv.name}</div><div class="meta">${lv.meta || ''}</div>`);
      t.addEventListener('click', () => { Arcade.sfx('click'); g.play(lv); });
      grid.appendChild(t);
    }
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
    title: 'Mini RC Racers',
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
