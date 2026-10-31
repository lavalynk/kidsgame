// =====================================================================
// Fishing Frenzy — a relaxing fishing game.
//
// How a catch works (the fun part):
//  1. CAST: press and hold (mouse, finger or Space). A power meter swings
//     up and down. Let go and the bobber flies in an arc — more power lands
//     it farther away, and the lure sinks deeper on a long cast.
//  2. WAIT: fish swim in lanes at different depths. A fish that swims near
//     the lure (at about the same depth) may notice it, turn and come over.
//  3. NIBBLE: the fish pecks at the lure a few times — the bobber bobs a
//     little. These are fake-outs! Tapping now scares the fish away.
//  4. BITE: the bobber dips under, a big "!" pops up. Tap quickly!
//     Wait too long and the fish swims off.
//  5. REEL: hold to reel (tension goes up), let go to give slack (tension
//     goes down). The fish pulls in bursts. Keep the needle in the green to
//     fill the catch meter. Stay in the red too long and the line snaps
//     (only on Normal/Challenge) — the fish just swims away, happy.
//  6. ADMIRE & RELEASE: the fish goes in your Fish Book, then back in the
//     water. "Splash! Bye fishy!"
//
// Catching a golden fish starts a short Frenzy bonus: lots of fish rush in,
// they bite right away, and every catch is worth double points.
// =====================================================================
(function () {
  const { draw, icons, math } = Arcade;
  const D = draw;
  const INK = D.INK;
  const W = 960, H = 540;

  // ---- the scene layout (view pixels) ----
  const WATER = 200;                  // y of the water surface
  const FLOOR = 518;                  // y of the bottom of the lake/sea
  const DEPTH_TOP = 236, DEPTH_BOT = 488;   // where fish (and the lure) can be
  const depthY = d => DEPTH_TOP + d * (DEPTH_BOT - DEPTH_TOP);
  const DOCK_X = 236;                 // right edge of the dock / snow bank
  const DOCK_Y = 170;                 // top of the dock
  const HANDS = { x: 222, y: 132 };   // where the angler holds the rod
  const ROD_LEN = 120;
  const CAST_MIN = 300;               // shortest cast lands here (x)
  const REEL_TO = { x: 300, y: WATER + 40 };  // a fish being reeled in ends up here
  const DONE_BTN = { x: 756, y: 14, w: 104, h: 58 };   // relax mode "Done" button
  const TIMED_SECONDS = 90;
  const BONUS_SECONDS = 20;

  // ---------------------------------------------------------------
  // Rarity tiers. bold = how keen they are on the lure, pull = how hard
  // they tug while being reeled in.
  // ---------------------------------------------------------------
  const RARITY = {
    common:    { stars: 1, points: 10,  weight: 52, bold: 1.25, pull: 0.55, label: 'Common',    color: '#8ecae6' },
    uncommon:  { stars: 2, points: 25,  weight: 30, bold: 1.0,  pull: 0.75, label: 'Uncommon',  color: '#06d6a0' },
    rare:      { stars: 3, points: 60,  weight: 13, bold: 0.8,  pull: 0.95, label: 'Rare!',     color: '#9b5de5' },
    legendary: { stars: 4, points: 150, weight: 4,  bold: 0.6,  pull: 1.1,  label: 'LEGENDARY!', color: '#f15bb5' },
    golden:    { stars: 4, points: 100, weight: 0,  bold: 1.8,  pull: 0.8,  label: 'GOLDEN!',   color: '#ffc93c' },
  };

  // ---------------------------------------------------------------
  // Fish species. swim = how they move:
  //   cruise (straight), wiggle (up-and-down wave), dart (quick bursts),
  //   drift (slow and floaty), school (little groups that follow a leader)
  // depth = [top, bottom] of their lane (0 = just under the surface, 1 = bottom)
  // len = body length in px for an average-sized fish; hgt = height / length
  // shape: fish | round (puffy) | long (eel) | tall (tall fins)
  // ---------------------------------------------------------------
  const SPECIES = [
    // ---- Sunny Pond ----
    { id: 'minnow',  loc: 'pond', name: 'Sunny Minnow',  rarity: 'common',    swim: 'school', depth: [0.0, 0.3],  speed: 70, cm: [5, 9],    len: 46, hgt: 0.45, shape: 'fish', tail: 'fork',  body: '#ffe066', belly: '#fff6c2', fin: '#ffb703' },
    { id: 'bluegill', loc: 'pond', name: 'Bluegill Buddy', rarity: 'common',  swim: 'cruise', depth: [0.2, 0.55], speed: 55, cm: [12, 22],  len: 64, hgt: 0.62, shape: 'fish', tail: 'round', body: '#4cc9f0', belly: '#ffb26b', fin: '#3a86ff' },
    { id: 'carp',    loc: 'pond', name: 'Bubble Carp',   rarity: 'uncommon',  swim: 'drift',  depth: [0.6, 0.95], speed: 32, cm: [30, 55],  len: 88, hgt: 0.55, shape: 'fish', tail: 'fan',   body: '#ff9f43', belly: '#ffe0b5', fin: '#ff6b35', pattern: 'scales', pat: '#ffc078' },
    { id: 'perch',   loc: 'pond', name: 'Stripy Perch',  rarity: 'uncommon',  swim: 'wiggle', depth: [0.35, 0.7], speed: 50, cm: [15, 30],  len: 66, hgt: 0.5,  shape: 'fish', tail: 'fork',  body: '#a7d948', belly: '#f4ffc9', fin: '#ff7b54', pattern: 'stripes', pat: '#4f8a10' },
    { id: 'trout',   loc: 'pond', name: 'Zippy Trout',   rarity: 'rare',      swim: 'dart',   depth: [0.45, 0.8], speed: 60, cm: [25, 45],  len: 80, hgt: 0.4,  shape: 'fish', tail: 'fork',  body: '#b8f2e6', belly: '#ffffff', fin: '#8ecae6', pattern: 'band', pat: '#ff70a6' },
    { id: 'catfish', loc: 'pond', name: 'Whisker King',  rarity: 'legendary', swim: 'drift',  depth: [0.75, 1.0], speed: 26, cm: [60, 110], len: 118, hgt: 0.42, shape: 'fish', tail: 'round', body: '#9d8df1', belly: '#e2dcff', fin: '#6c5ce7', extra: 'whiskers', crown: true },
    // ---- Ocean Pier ----
    { id: 'sardine', loc: 'pier', name: 'Sardine Sprite', rarity: 'common',   swim: 'school', depth: [0.0, 0.3],  speed: 80, cm: [10, 18],  len: 48, hgt: 0.36, shape: 'fish', tail: 'fork',  body: '#a9def9', belly: '#ffffff', fin: '#5aa9e6' },
    { id: 'clown',   loc: 'pier', name: 'Stripe Clown',  rarity: 'common',    swim: 'wiggle', depth: [0.25, 0.6], speed: 50, cm: [8, 14],   len: 56, hgt: 0.6,  shape: 'fish', tail: 'round', body: '#ff8c42', belly: '#ffb27a', fin: '#ff6b35', pattern: 'stripes', pat: '#ffffff' },
    { id: 'puffer',  loc: 'pier', name: 'Puffy Puffer',  rarity: 'uncommon',  swim: 'drift',  depth: [0.3, 0.7],  speed: 30, cm: [15, 30],  len: 62, hgt: 0.95, shape: 'round', tail: 'fan',  body: '#ffd166', belly: '#fff3c4', fin: '#f4a261', pattern: 'spots', pat: '#e9a23b' },
    { id: 'eel',     loc: 'pier', name: 'Sea Ribbon',    rarity: 'uncommon',  swim: 'wiggle', depth: [0.6, 0.95], speed: 45, cm: [50, 90],  len: 120, hgt: 0.2, shape: 'long', tail: 'round', body: '#7bd88f', belly: '#d5ffd9', fin: '#40a35a' },
    { id: 'tuna',    loc: 'pier', name: 'Zoomy Tuna',    rarity: 'rare',      swim: 'dart',   depth: [0.35, 0.75], speed: 70, cm: [60, 120], len: 96, hgt: 0.5, shape: 'fish', tail: 'fork',  body: '#3a86ff', belly: '#dbe9ff', fin: '#ffd166' },
    { id: 'marlin',  loc: 'pier', name: 'Rainbow Marlin', rarity: 'legendary', swim: 'cruise', depth: [0.7, 1.0], speed: 60, cm: [150, 260], len: 124, hgt: 0.36, shape: 'fish', tail: 'fork', body: '#5e60ce', belly: '#cdd7ff', fin: '#f15bb5', pattern: 'band', pat: '#4cc9f0', extra: 'nose' },
    // ---- Icy Lake ----
    { id: 'smelt',   loc: 'ice', name: 'Frosty Smelt',   rarity: 'common',    swim: 'school', depth: [0.0, 0.35], speed: 65, cm: [8, 15],   len: 46, hgt: 0.36, shape: 'fish', tail: 'fork',  body: '#cdeffd', belly: '#ffffff', fin: '#90e0ef' },
    { id: 'char',    loc: 'ice', name: 'Pink-Dot Char',  rarity: 'common',    swim: 'cruise', depth: [0.25, 0.6], speed: 50, cm: [20, 40],  len: 70, hgt: 0.45, shape: 'fish', tail: 'fork',  body: '#48cae4', belly: '#ffd6e0', fin: '#ff8fab', pattern: 'spots', pat: '#ffafcc' },
    { id: 'cod',     loc: 'ice', name: 'Chilly Cod',     rarity: 'uncommon',  swim: 'drift',  depth: [0.65, 1.0], speed: 30, cm: [40, 80],  len: 90, hgt: 0.48, shape: 'fish', tail: 'round', body: '#b5c99a', belly: '#f1f7e8', fin: '#87986a', pattern: 'spots', pat: '#8a9a6b', extra: 'whiskers' },
    { id: 'grayling', loc: 'ice', name: 'Mint Sailfin', rarity: 'uncommon',  swim: 'wiggle', depth: [0.3, 0.7],  speed: 50, cm: [25, 45],  len: 70, hgt: 0.62, shape: 'tall', tail: 'fork',  body: '#80ed99', belly: '#e9ffe9', fin: '#9b5de5' },
    { id: 'pike',    loc: 'ice', name: 'Polar Pike',     rarity: 'rare',      swim: 'dart',   depth: [0.45, 0.85], speed: 60, cm: [50, 100], len: 110, hgt: 0.3, shape: 'fish', tail: 'fork',  body: '#e0fbfc', belly: '#ffffff', fin: '#98c1d9', pattern: 'spots', pat: '#98c1d9' },
    { id: 'aurora',  loc: 'ice', name: 'Aurora Fish',    rarity: 'legendary', swim: 'drift',  depth: [0.7, 1.0],  speed: 30, cm: [70, 120], len: 112, hgt: 0.58, shape: 'tall', tail: 'fan',   body: '#72efdd', belly: '#ffd6ff', fin: '#c77dff', pattern: 'band', pat: '#ff99c8', crown: true },
    // ---- found everywhere, very rarely ----
    { id: 'golden',  loc: 'all', name: 'Golden Glimmer', rarity: 'golden',    swim: 'dart',   depth: [0.3, 0.7],  speed: 55, cm: [20, 35],  len: 72, hgt: 0.55, shape: 'fish', tail: 'fan',   body: '#ffd23f', belly: '#fff1a8', fin: '#ffb000', pattern: 'spots', pat: '#fff6c8' },
  ];
  const SP = {};
  for (const s of SPECIES) SP[s.id] = s;

  // ---------------------------------------------------------------
  // Places to fish. Each unlocks after finding a number of fish kinds.
  // ---------------------------------------------------------------
  const LOCS = {
    pond: { name: 'Sunny Pond', need: 0, hat: 'bucket', bg: '#8fd3ff',
            sky: ['#79c8ff', '#dff4ff'], water: ['#5fd0ee', '#1f78b4'], floor: '#c9a46b', floor2: '#a9844c' },
    pier: { name: 'Ocean Pier', need: 4, hat: 'cap', bg: '#7ed3f7',
            sky: ['#64c4f5', '#e6f8ff'], water: ['#2fc0e0', '#0a4f8e'], floor: '#f3d98e', floor2: '#dfbd67' },
    ice:  { name: 'Icy Lake', need: 9, hat: 'beanie', bg: '#bcd7f5',
            sky: ['#a9c9f0', '#f2f8ff'], water: ['#88d6ec', '#2b6c9c'], floor: '#9db4c8', floor2: '#7f97ad' },
  };
  const LOC_ORDER = ['pond', 'pier', 'ice'];

  // Rods: better rods = bigger green zone, longer casts, faster reeling.
  const RODS = [
    { id: 'twig',    name: 'Twig Rod',    color: '#c98b4f', zone: 1.0,  cast: 1.0,  reel: 1.0,  need: null },
    { id: 'bamboo',  name: 'Bamboo Rod',  color: '#8ac926', zone: 1.15, cast: 1.08, reel: 1.08, need: 'Catch 5 fish' },
    { id: 'super',   name: 'Super Rod',   color: '#118ab2', zone: 1.3,  cast: 1.15, reel: 1.16, need: 'Find 8 kinds of fish' },
    { id: 'rainbow', name: 'Rainbow Rod', color: '#f15bb5', zone: 1.45, cast: 1.22, reel: 1.25, need: 'Catch a golden or legendary fish', rainbow: true },
  ];

  // ---------------------------------------------------------------
  // Saved progress helpers (all in g.save.data)
  //   book:  { speciesId: { n: how many caught, best: biggest cm } }
  //   total: fish caught ever, rod: picked rod id
  // ---------------------------------------------------------------
  function book(g) { return (g.save.data.book = g.save.data.book || {}); }
  function kindsFound(g) { return Object.keys(book(g)).length; }
  function rodUnlocked(g, r) { return r.id === 'twig' || g.isUnlocked('rod-' + r.id); }
  function pickedRod(g) { return RODS.find(r => r.id === g.save.data.rod && rodUnlocked(g, r)) || RODS[0]; }

  // Check every unlock; spread the toasts out so each one can be read.
  function checkUnlocks(g) {
    const todo = [];
    const kinds = kindsFound(g);
    const bk = book(g);
    const fancy = Object.keys(bk).some(id => SP[id] && (SP[id].rarity === 'legendary' || SP[id].rarity === 'golden'));
    if (kinds >= LOCS.pier.need) todo.push(['loc-pier', 'Ocean Pier!']);
    if (kinds >= LOCS.ice.need) todo.push(['loc-ice', 'Icy Lake!']);
    if ((g.save.data.total || 0) >= 5) todo.push(['rod-bamboo', 'Bamboo Rod!']);
    if (kinds >= 8) todo.push(['rod-super', 'Super Rod!']);
    if (fancy) todo.push(['rod-rainbow', 'Rainbow Rod!']);
    let delay = 0;
    for (const [key, label] of todo) {
      if (g.isUnlocked(key)) continue;
      // save right away (so leaving the page doesn't lose it), toast a bit later
      setTimeout(() => g.unlock(key, label), delay);
      delay += 1700;
    }
  }
  const locUnlocked = (g, loc) => loc === 'pond' || g.isUnlocked('loc-' + loc);

  // ---------------------------------------------------------------
  // Game state (rebuilt by setup)
  // ---------------------------------------------------------------
  let loc, locId, mode, rod, phase;
  let fish, bobber, power, charge, gesture, card, popups, ripples, bubbles, flakes, sparkles, released;
  let tension, catchProgress, redTime, burst, hooked, reelTick, nib, biteT;
  let rodA, spawnT, goldenT, bonusT, timeLeft, score, caughtCount, stats, prevSpace, ended, lastCatch;
  let nextId = 1;

  function setup(g, level) {
    const lv = level || { id: 'pond-relax', loc: 'pond', mode: 'relax' };
    locId = lv.loc; loc = LOCS[locId]; mode = lv.mode;
    rod = pickedRod(g);
    document.body.style.setProperty('--ar-bg', loc.bg);
    phase = 'idle';
    fish = []; popups = []; ripples = []; bubbles = []; sparkles = []; released = [];
    flakes = [];
    if (locId === 'ice') for (let i = 0; i < 40; i++) flakes.push({ x: Math.random() * W, y: Math.random() * WATER, s: math.rand(2, 5), v: math.rand(14, 30) });
    bobber = null; power = 0; charge = null; gesture = null; card = null;
    tension = 0.45; catchProgress = 0; redTime = 0; burst = 0; hooked = null; reelTick = 0; nib = null; biteT = 0;
    rodA = -1.0; spawnT = 0; bonusT = 0;
    goldenT = mode === 'timed' ? math.rand(22, 45) : math.rand(40, 80);
    timeLeft = TIMED_SECONDS; score = 0; caughtCount = 0; ended = false; lastCatch = null;
    stats = { catches: 0, early: 0, late: 0, snaps: 0, newKinds: 0, best: null, bonus: 0 };
    prevSpace = false;
    // start with some fish already swimming around
    for (let i = 0; i < 6; i++) spawnFish(g, math.rand(260, W - 40));
    checkUnlocks(g);

    // ---- test hooks (used by the automated tests) ----
    window.__fishingState = () => ({
      phase, mode, loc: locId, rod: rod.id, difficulty: g.difficulty,
      bobber: bobber && { x: bobber.x, y: bobber.y, lureY: bobber.lureY, lureTarget: bobber.lureTarget, dip: bobber.dip },
      fish: fish.map(f => ({ id: f.id, species: f.sp.id, rarity: f.sp.rarity, x: f.x, y: f.y, state: f.state })),
      hooked: hooked && hooked.sp.id,
      tension, catchProgress, greenZone: greenZone(g), redTime,
      bursting: burst > 0, biteT, nibblesLeft: nib ? nib.left : 0,
      caught: caughtCount, score, timeLeft, bonusT, stats,
      book: JSON.parse(JSON.stringify(book(g))),
      card: card && { species: card.sp.id, cm: card.cm, isNew: card.isNew },
      unlocked: g.save.unlocked.slice(),
    });
    window.__fishingTest = {
      // put a golden fish right next to the lure (or in the water)
      spawnGolden: () => { const f = spawnFish(g, bobber ? bobber.x + 120 : 500, SP.golden); if (bobber) f.y = f.baseY = bobber.lureY; return f.id; },
      startBonus: () => startBonus(g),
      setTime: (t) => { timeLeft = t; },
    };
  }

  // ---------------------------------------------------------------
  // Little helpers
  // ---------------------------------------------------------------
  function popup(text, x, y, color = '#ffd166', size = 30) { popups.push({ text, x, y, t: 0, color, size }); }
  function ripple(x, big = 1) { ripples.push({ x, r: 6, t: 0, big }); }
  const isBonus = () => bonusT > 0;
  function waveY(x, t) { return WATER + Math.sin(x * 0.03 + t * 1.6) * 2.5 + Math.sin(x * 0.011 - t * 0.9) * 2; }

  // Green zone of the tension bar: [low, high]. Easy = big, Challenge = small.
  function greenZone(g) {
    const w = Math.min(0.62, g.pick(0.44, 0.32, 0.24) * (rod ? rod.zone : 1));
    return [0.5 - w / 2, 0.5 + w / 2];
  }
  const RED = 0.86;   // above this the line is in the red

  function rodTip() {
    let x = HANDS.x + Math.cos(rodA) * ROD_LEN, y = HANDS.y + Math.sin(rodA) * ROD_LEN;
    // the rod bends toward the fish while reeling
    if (phase === 'reeling' && hooked) {
      const k = 10 + tension * 26;
      const dx = hooked.x - x, dy = hooked.y - y, d = Math.hypot(dx, dy) || 1;
      x += dx / d * k; y += dy / d * k;
    }
    return { x, y };
  }

  // Where the bobber will land for a given power (shown while charging).
  function castTarget(p) { return Math.min(915, CAST_MIN + p * 560 * rod.cast); }
  // Longer casts sink the lure deeper.
  function castDepth(p) { return math.clamp(depthY(0.08 + p * 0.82), DEPTH_TOP, DEPTH_BOT); }

  // Pick a random species for this place (rarer = less often).
  function randomSpecies() {
    const list = SPECIES.filter(s => s.loc === locId);
    let total = 0;
    for (const s of list) total += RARITY[s.rarity].weight;
    let r = Math.random() * total;
    for (const s of list) { r -= RARITY[s.rarity].weight; if (r <= 0) return s; }
    return list[0];
  }

  function makeFish(sp, x, y, dir) {
    const cm = Math.round(math.lerp(sp.cm[0], sp.cm[1], Math.pow(Math.random(), 1.6)));
    const frac = (cm - sp.cm[0]) / (sp.cm[1] - sp.cm[0] || 1);
    return {
      id: nextId++, sp, x, y, baseY: y, dir, face: dir, cm, scale: 0.85 + frac * 0.35,
      speed: sp.speed * math.rand(0.85, 1.15), t: math.rand(0, 10), state: 'swim',
      shy: 0, timer: math.rand(0.5, 2), dart: 0, leader: null, off: null, peck: 0, thrash: 0,
    };
  }

  // Add a fish (or a little school) at x. Returns the (leader) fish.
  function spawnFish(g, x, forced) {
    const sp = forced || randomSpecies();
    let dir;
    if (x == null) { dir = Math.random() < 0.5 ? 1 : -1; x = dir > 0 ? -90 : W + 90; }
    else dir = Math.random() < 0.5 ? 1 : -1;
    const y = depthY(math.rand(sp.depth[0], sp.depth[1]));
    const f = makeFish(sp, x, y, dir);
    fish.push(f);
    if (sp.swim === 'school') {
      const n = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const m = makeFish(sp, x - dir * (36 + i * 30), y + math.rand(-24, 24), dir);
        m.leader = f; m.off = { x: 36 + i * 30 + math.rand(-6, 6), y: (i % 2 ? -1 : 1) * (14 + i * 6) };
        m.baseY = math.clamp(y + m.off.y, DEPTH_TOP, DEPTH_BOT);
        fish.push(m);
      }
    }
    return f;
  }

  function fishLen(f) { return f.sp.len * f.scale; }
  // The fish's mouth (front of its head)
  function mouth(f) { return { x: f.x + Math.sign(f.face || f.dir) * fishLen(f) * 0.5, y: f.y }; }
  // Where a fish's body must be so its mouth touches the lure
  function bodyAtLure(f) { const s = f.x < bobber.x ? 1 : -1; return { x: bobber.x - s * (fishLen(f) * 0.5 + 4), y: bobber.lureY, dir: s }; }

  // ---------------------------------------------------------------
  // Update (dt = 1/120 s)
  // ---------------------------------------------------------------
  function update(g, dt) {
    const inp = g.input, ptr = inp.pointer;
    // --- read input once: a "press" and "release" from pointer or Space ---
    const spaceDown = inp.down('Space');
    const spaceHit = inp.hit('Space');
    const spacePressed = spaceHit || (spaceDown && !prevSpace);
    const spaceReleased = (!spaceDown && prevSpace) || (spaceHit && !spaceDown);
    prevSpace = spaceDown;
    const onDone = mode === 'relax' && ptr.justDown && inBox(ptr, DONE_BTN);
    const ptrPressed = ptr.justDown && !onDone;
    const pressed = ptrPressed || spacePressed;
    const holding = ptr.down || spaceDown;

    // --- floating texts, ripples, bubbles, sparkles ---
    for (const p of popups) { p.t += dt; p.y -= 36 * dt; }
    popups = popups.filter(p => p.t < 1.5);
    for (const r of ripples) { r.t += dt; r.r += (40 + 30 * r.big) * dt; }
    ripples = ripples.filter(r => r.t < 1.4);
    if (Math.random() < dt * 2.5) bubbles.push({ x: math.rand(250, W - 20), y: FLOOR - 10, r: math.rand(3, 7), w: Math.random() * 6 });
    for (const b of bubbles) { b.y -= (30 + b.r * 6) * dt; b.w += dt * 3; }
    bubbles = bubbles.filter(b => b.y > WATER + 6);
    for (const s of sparkles) { s.t += dt; s.y -= 12 * dt; }
    sparkles = sparkles.filter(s => s.t < s.life);
    for (const f of flakes) { f.y += f.v * dt; f.x += Math.sin(g.time + f.s) * 10 * dt; if (f.y > WATER) { f.y = -5; f.x = Math.random() * W; } }

    // --- relax mode: the Done button ---
    if (onDone && phase !== 'reeling' && phase !== 'caught') { g.sfx('click'); endRound(g); return; }

    // --- timers: the round clock (paused while admiring a fish), bonus, golden fish ---
    if (mode === 'timed' && phase !== 'caught' && !ended) timeLeft = Math.max(0, timeLeft - dt);
    if (bonusT > 0) {
      bonusT -= dt;
      if (bonusT <= 0) { bonusT = 0; popup('Frenzy over!', W / 2, 150, '#ffd166', 34); }
      if (Math.random() < dt * 14) sparkles.push({ x: Math.random() * W, y: math.rand(WATER, FLOOR), t: 0, life: 0.8, c: '#ffe066' });
    }
    goldenT -= dt;
    if (goldenT <= 0) {
      goldenT = mode === 'timed' ? math.rand(30, 55) : math.rand(50, 95);
      if (!isBonus() && !fish.some(f => f.sp.rarity === 'golden')) spawnFish(g, null, SP.golden);
    }

    // --- keep enough fish in the water ---
    spawnT -= dt;
    const want = (mode === 'timed' ? 10 : 9) + (g.difficulty === 'easy' ? 2 : 0) + (isBonus() ? 8 : 0);
    if (spawnT <= 0 && fish.length < want) { spawnFish(g); spawnT = isBonus() ? 0.3 : math.rand(0.8, 2.2); }

    updateFish(g, dt);

    // --- rod angle follows what we are doing ---
    const rodTarget = phase === 'charging' ? -1.25 - power * 0.9
      : phase === 'flying' ? -0.45 : phase === 'reeling' ? -1.15 - (holding ? 0.12 : 0) + Math.sin(g.time * 30) * burst * 0.04
      : phase === 'idle' || phase === 'caught' ? -1.0 : -0.8;
    rodA += (rodTarget - rodA) * Math.min(1, dt * (phase === 'flying' ? 20 : 8));

    // --- bobber spring (bobs on nibbles, dips under on a bite) ---
    if (bobber) {
      const target = phase === 'bite' ? 22 : 0;
      bobber.dipV += ((target - bobber.dip) * 120 - bobber.dipV * 9) * dt;
      bobber.dip += bobber.dipV * dt;
      // the lure sinks (or rises) to the chosen depth
      if (phase !== 'flying' && phase !== 'reeling') {
        const d = bobber.lureTarget - bobber.lureY;
        bobber.lureY += math.clamp(d, -170 * dt, 140 * dt);
      }
      if (bobber.jiggle > 0) bobber.jiggle -= dt;
    }

    // --- the main game flow ---
    switch (phase) {
      case 'idle':
        if (mode === 'timed' && timeLeft <= 0) { endRound(g); break; }
        if (pressed) { phase = 'charging'; charge = { t: 0, src: ptrPressed ? 'ptr' : 'key' }; power = 0; g.sfx('click'); }
        break;

      case 'charging': {
        // the power meter swings up and down: 0 -> 1 -> 0 ...
        charge.t += dt;
        const period = g.pick(2.6, 1.9, 1.5);
        const ph = (charge.t / period) % 1;
        power = ph < 0.5 ? ph * 2 : 2 - ph * 2;
        if (g.difficulty === 'easy') power = Math.min(1, power * 1.08);   // easy: lingers at the top
        const let_go = charge.src === 'ptr' ? !ptr.down : !spaceDown;
        if (let_go) cast(g);
        break;
      }

      case 'flying': {
        const b = bobber;
        b.ft += dt;
        const k = Math.min(1, b.ft / b.dur);
        b.x = math.lerp(b.sx, b.tx, k);
        b.y = math.lerp(b.sy, WATER, k) - Math.sin(k * Math.PI) * b.arc;
        b.lureY = b.y + 8;
        if (k >= 1) {
          b.y = WATER; b.lureY = WATER + 6;
          phase = 'waiting';
          g.sfx('splash');
          ripple(b.x, 1.5);
          g.particles.burst(b.x, WATER, { count: 18, angle: -Math.PI / 2, spread: 1.6, speed: 230, size: 10, gravity: 700, colors: ['#ffffff', '#bde0fe', '#8ecae6'] });
        }
        break;
      }

      case 'waiting':
        if (mode === 'timed' && timeLeft <= 0) { endRound(g); break; }
        depthKeys(g, dt);
        waitingGestures(g, dt, { ptrPressed, spacePressed, spaceReleased, spaceDown });
        break;

      case 'nibble':
        depthKeys(g, dt);
        // Too early! The fish gets a little scared and swims off.
        if (pressed) {
          stats.early++;
          scare(hooked, 3.5);
          popup('Too early!', bobber.x, WATER - 50, '#ffafcc');
          g.sfx('bonk');
          hooked = null; nib = null; phase = 'waiting'; gesture = null;
          break;
        }
        break;

      case 'bite':
        biteT -= dt;
        if (pressed) {
          // Got it! Start reeling.
          phase = 'reeling';
          hooked.state = 'hooked';
          hooked.hookX = hooked.x; hooked.hookY = hooked.y;
          tension = 0.42; catchProgress = 0; redTime = 0; burst = 0; hooked.burstWait = math.rand(0.6, 1.4);
          g.sfx('power');
          popup('Hooked!', bobber.x, WATER - 60, '#06d6a0', 38);
          g.particles.burst(bobber.x, WATER, { count: 14, angle: -Math.PI / 2, spread: 1.4, speed: 200, size: 9, gravity: 600, colors: ['#ffffff', '#bde0fe'] });
        } else if (biteT <= 0) {
          // Too slow — the fish wanders off.
          stats.late++;
          scare(hooked, 2.5, true);
          popup('Too slow!', bobber.x, WATER - 50, '#ffafcc');
          g.tone(330, 0.25, { type: 'triangle', slide: 260, vol: 0.2 });
          hooked = null; nib = null; phase = 'waiting'; gesture = null;
        }
        break;

      case 'reeling':
        reel(g, dt, holding);
        break;

      case 'caught':
        card.t += dt;
        // tap to let the fish go (or it goes by itself after a while)
        if ((card.t > 0.8 && pressed) || card.t > (mode === 'timed' ? 2.4 : 12)) releaseFish(g);
        break;
    }

    // released fish fly back into the water
    for (const r of released) {
      r.t += dt; r.vy += 900 * dt; r.x += r.vx * dt; r.y += r.vy * dt; r.rot += dt * 6;
      if (!r.done && r.y > WATER && r.vy > 0) {
        r.done = true;
        g.sfx('splash'); ripple(r.x, 1.2);
        g.particles.burst(r.x, WATER, { count: 16, angle: -Math.PI / 2, spread: 1.6, speed: 220, size: 10, gravity: 700, colors: ['#ffffff', '#bde0fe', '#8ecae6'] });
        const f = makeFish(r.sp, r.x, WATER + 40, 1);
        f.cm = r.cm; f.scale = r.scale; f.state = 'flee'; f.timer = 1.2; f.shy = 8; f.speed *= 1.3; f.baseY = WATER + 60;
        fish.push(f);
      }
    }
    released = released.filter(r => !r.done);

    // timed round ends once nothing is happening
    if (mode === 'timed' && timeLeft <= 0 && !ended && phase === 'charging') { charge = null; phase = 'idle'; endRound(g); }
  }

  function inBox(p, b) { return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h; }

  // Throw the bobber! Farther with more power.
  function cast(g) {
    const tip = rodTip();
    const p = power;
    bobber = {
      sx: tip.x, sy: tip.y, tx: castTarget(p), ft: 0, dur: 0.55 + p * 0.45, arc: 90 + p * 150,
      x: tip.x, y: tip.y, lureY: tip.y, lureTarget: castDepth(p), dip: 0, dipV: 0, jiggle: 0,
    };
    phase = 'flying';
    charge = null;
    g.sfx('whoosh');
  }

  // Up / Down keys move the lure deeper or shallower.
  function depthKeys(g, dt) {
    const v = (g.input.down('ArrowDown', 'KeyS') ? 1 : 0) - (g.input.down('ArrowUp', 'KeyW') ? 1 : 0);
    if (v) bobber.lureTarget = math.clamp(bobber.lureTarget + v * 160 * dt, DEPTH_TOP - 10, DEPTH_BOT);
  }

  // While waiting: drag up/down = change depth, quick tap = jiggle the lure
  // (fish notice it more), hold still = reel the line back in to cast again.
  function waitingGestures(g, dt, k) {
    const ptr = g.input.pointer;
    if (k.ptrPressed) gesture = { src: 'ptr', t: 0, drag: false, y0: ptr.y, lure0: bobber.lureTarget };
    else if (k.spacePressed) gesture = { src: 'key', t: 0, drag: false };
    if (!gesture) return;
    gesture.t += dt;
    const down = gesture.src === 'ptr' ? ptr.down : k.spaceDown;
    if (gesture.src === 'ptr' && down) {
      const dy = ptr.y - gesture.y0;
      if (Math.abs(dy) > 14) gesture.drag = true;
      if (gesture.drag) bobber.lureTarget = math.clamp(gesture.lure0 + dy * 1.4, DEPTH_TOP - 10, DEPTH_BOT);
    }
    if (down && !gesture.drag && gesture.t > 0.8) {
      // reel back in
      gesture = null;
      if (hooked) { hooked.state = 'swim'; hooked.shy = 2; hooked = null; }
      bobber = null; phase = 'idle';
      g.sfx('whoosh');
      return;
    }
    if (!down) {
      if (!gesture.drag && gesture.t < 0.8) {
        // a little twitch of the lure: fish nearby get curious
        bobber.jiggle = 2;
        bobber.lureY -= 12; bobber.dipV += 40;
        ripple(bobber.x, 0.5);
        g.tone(620, 0.06, { type: 'sine', vol: 0.15 });
      }
      gesture = null;
    }
  }

  // A fish gets a fright (or just loses interest) and swims away.
  function scare(f, shy, calm) {
    if (!f) return;
    f.state = 'flee';
    f.dir = f.x < bobber.x ? -1 : 1;
    f.timer = calm ? 1.5 : 1.0;
    f.shy = shy + 2;
  }

  // ---------------------------------------------------------------
  // Fish behaviour
  // ---------------------------------------------------------------
  function updateFish(g, dt) {
    const lureOk = bobber && (phase === 'waiting') && bobber.lureY > WATER + 20;
    const noticeX = g.pick(240, 180, 160) + (isBonus() ? 200 : 0);
    const noticeY = g.pick(110, 80, 65) + (isBonus() ? 60 : 0);

    for (const f of fish) {
      f.t += dt;
      if (f.shy > 0) f.shy -= dt;
      f.face += (f.dir - f.face) * Math.min(1, dt * 7);   // smooth turning
      const R = RARITY[f.sp.rarity];

      if (f.state === 'swim') {
        swim(f, dt);
        // notice the lure?
        if (lureOk && !hooked && f.shy <= 0) {
          const m = mouth(f);
          if (Math.abs(m.x - bobber.x) < noticeX && Math.abs(f.y - bobber.lureY) < noticeY) {
            const chance = R.bold * g.pick(1.4, 1.0, 0.85) * (bobber.jiggle > 0 ? 2 : 1) * (isBonus() ? 5 : 1);
            if (Math.random() < chance * dt) { f.state = 'approach'; hooked = f; f.leader = null; }
          }
        }
        if (f.sp.rarity === 'legendary' || f.sp.rarity === 'golden') shimmer(f, dt);
      } else if (f.state === 'approach' || f.state === 'nibble' || f.state === 'bite') {
        if (!bobber) { f.state = 'swim'; continue; }
        const goal = bodyAtLure(f);
        f.dir = goal.dir;
        let gx = goal.x, gy = goal.y;
        if (f.state === 'nibble') {
          // peck: dart in to the lure, back off a little
          f.peck = Math.max(0, f.peck - dt * 4);
          gx -= goal.dir * (10 - f.peck * 10);
        }
        if (f.state === 'bite') gx += goal.dir * 2;
        const dx = gx - f.x, dy = gy - f.y, d = Math.hypot(dx, dy);
        const sp = f.state === 'approach' ? (isBonus() ? 160 : 80) : 160;
        if (d > 1) { const s = Math.min(d, sp * dt); f.x += dx / d * s; f.y += dy / d * s; }
        if (f.state === 'approach' && d < 6 && phase === 'waiting') startNibbles(g, f);
        if (f.state === 'nibble') nibbleTick(g, f, dt);
        if (f.sp.rarity === 'legendary' || f.sp.rarity === 'golden') shimmer(f, dt);
      } else if (f.state === 'hooked') {
        // moved by reel()
      } else if (f.state === 'flee') {
        f.timer -= dt;
        f.x += f.dir * f.speed * 3 * dt;
        f.y += (f.baseY - f.y) * dt;
        if (f.timer <= 0) f.state = 'swim';
      }
    }
    // fish that swam off the screen are gone (new ones come in)
    fish = fish.filter(f => f.state === 'hooked' || f === hooked || (f.x > -160 && f.x < W + 160));
  }

  function shimmer(f, dt) {
    if (Math.random() < dt * 8) sparkles.push({ x: f.x + math.rand(-1, 1) * fishLen(f) * 0.5, y: f.y + math.rand(-20, 20), t: 0, life: 0.7, c: f.sp.rarity === 'golden' ? '#ffe066' : '#ffffff' });
  }

  // Normal swimming, by swim style.
  function swim(f, dt) {
    const s = f.sp.swim;
    if (s === 'school' && f.leader && fish.includes(f.leader) && f.leader.state === 'swim') {
      // follow the leader, keeping a little gap
      const L = f.leader;
      const tx = L.x - L.dir * f.off.x, ty = L.y + f.off.y + Math.sin(f.t * 3) * 3;
      f.x += (tx - f.x) * Math.min(1, dt * 2.5);
      f.y += (ty - f.y) * Math.min(1, dt * 2.5);
      f.dir = L.dir;
      return;
    }
    f.leader = null;
    let v = f.speed;
    if (s === 'wiggle') { f.y = f.baseY + Math.sin(f.t * 2.2) * 18; }
    else if (s === 'dart') {
      f.timer -= dt;
      if (f.timer <= 0) { f.dart = 0.45; f.timer = math.rand(1.3, 2.8); }
      f.dart -= dt;
      v *= f.dart > 0 ? 3.2 : 0.35;
      f.y += (f.baseY - f.y) * dt;
    } else if (s === 'drift') {
      v *= 0.7;
      f.y = f.baseY + Math.sin(f.t * 0.8) * 12;
      if (Math.random() < dt * 0.06 && f.x > 260 && f.x < W - 60) f.dir = -f.dir;   // floaty turn-around
    } else if (s === 'school') {
      f.y = f.baseY + Math.sin(f.t * 3) * 6;
    } else {
      f.y += (f.baseY - f.y) * dt;
    }
    f.x += f.dir * v * dt;
  }

  // A fish reached the lure: a few nibbles (fake-outs), then the real bite.
  function startNibbles(g, f) {
    phase = 'nibble';
    f.state = 'nibble';
    let n = g.pick(Math.random() < 0.5 ? 0 : 1, 1 + Math.floor(Math.random() * 3), 1 + Math.floor(Math.random() * 4));
    if (isBonus()) n = 0;
    nib = { left: n, wait: math.rand(0.3, 0.7) };
  }
  function nibbleTick(g, f, dt) {
    nib.wait -= dt;
    if (nib.wait > 0) return;
    if (nib.left > 0) {
      nib.left--;
      nib.wait = math.rand(0.6, 1.2);
      f.peck = 1;
      bobber.dipV += 55;                     // a small bob
      ripple(bobber.x, 0.4);
      g.tone(760, 0.05, { type: 'sine', vol: 0.18 });
      return;
    }
    // BITE!
    phase = 'bite';
    f.state = 'bite';
    nib = null;
    biteT = g.pick(1.5, 0.85, 0.55) * (rod.rainbow ? 1.15 : 1) + (isBonus() ? 0.3 : 0);
    bobber.dipV += 220;
    ripple(bobber.x, 1.2);
    g.sfx('pop');
    g.tone(1046, 0.18, { type: 'square', vol: 0.15, delay: 0.05 });
    g.particles.burst(bobber.x, WATER, { count: 10, angle: -Math.PI / 2, spread: 1.4, speed: 160, size: 8, gravity: 600, colors: ['#ffffff', '#bde0fe'] });
  }

  // ---------------------------------------------------------------
  // Reeling: keep the tension needle in the green zone.
  // ---------------------------------------------------------------
  function reel(g, dt, holding) {
    const f = hooked;
    const R = RARITY[f.sp.rarity];
    const [lo, hi] = greenZone(g);

    // the fish pulls in bursts (rarer fish pull harder and more often)
    if (burst > 0) {
      burst -= dt;
      if (burst <= 0) f.burstWait = math.rand(1.0, 2.2) / (0.7 + R.pull * 0.4);
    } else {
      f.burstWait -= dt;
      if (f.burstWait <= 0) { burst = math.rand(0.5, 1.0); g.sfx('swish'); }
    }
    const pull = R.pull * g.pick(0.5, 1.0, 1.25);

    // hold = reel (tension up), let go = slack (tension down)
    if (holding) tension += 0.8 * dt;
    else tension -= 1.4 * dt;
    if (burst > 0) tension += pull * 1.05 * dt;
    if (g.difficulty === 'easy') tension += (0.5 - tension) * 0.6 * dt;   // easy: gently helps you
    tension = math.clamp(tension, 0, g.difficulty === 'easy' ? 0.97 : 1);

    // reel ticks while holding
    if (holding) { reelTick -= dt; if (reelTick <= 0) { g.sfx('tick'); reelTick = 0.09; } }

    // fill the catch meter in the green
    const rate = rod.reel * g.pick(1.35, 1.0, 0.85) / (3.4 + R.stars * 0.8);
    if (tension >= lo && tension <= hi) catchProgress += rate * dt;
    else if (tension < lo) catchProgress -= 0.05 * dt;       // slack: the fish swims out a little
    catchProgress = math.clamp(catchProgress, 0, 1);

    // too much tension for too long = the line snaps (not on Easy)
    if (tension > RED) redTime += dt; else redTime = Math.max(0, redTime - dt * 0.6);
    const snapAfter = g.pick(Infinity, 1.8, 1.15);
    if (redTime > snapAfter) {
      stats.snaps++;
      g.sfx('whoosh'); g.tone(300, 0.3, { type: 'triangle', slide: 200, vol: 0.2 });
      popup('Snap! It swam away', f.x, WATER - 40, '#ffafcc', 28);
      f.state = 'flee'; f.dir = 1; f.timer = 2; f.shy = 8; f.baseY = f.y;
      hooked = null; bobber = null; phase = 'idle';
      return;
    }

    // move the fish from where it bit toward the dock as the meter fills
    const k = catchProgress;
    const wob = burst > 0 ? Math.sin(g.time * 26) * 10 : Math.sin(g.time * 6) * 3;
    f.x = math.lerp(f.hookX, REEL_TO.x + 60, k) + wob;
    f.y = math.lerp(f.hookY, REEL_TO.y, k) + (burst > 0 ? Math.cos(g.time * 19) * 6 : 0);
    f.dir = 1;                      // swimming away from you, of course
    bobber.x = f.x - fishLen(f) * 0.5;   // the line goes to its mouth (it faces away, so mouth = right side)
    bobber.x = f.x + fishLen(f) * 0.5;
    bobber.lureY = f.y;
    if (burst > 0 && Math.random() < dt * 10) g.particles.burst(f.x, f.y - 10, { count: 1, colors: ['#ffffff', '#cdeffd'], speed: 50, gravity: -120, size: 8, life: 0.8 });

    if (catchProgress >= 1) landFish(g, f);
  }

  // Caught! Show the card, write it in the book, add points.
  function landFish(g, f) {
    phase = 'caught';
    fish = fish.filter(x => x !== f);
    hooked = null; bobber = null;
    const R = RARITY[f.sp.rarity];
    const bk = book(g);
    const isNew = !bk[f.sp.id];
    const rec = bk[f.sp.id] = bk[f.sp.id] || { n: 0, best: 0 };
    rec.n++;
    const bestSize = f.cm > rec.best;
    rec.best = Math.max(rec.best, f.cm);
    g.save.data.total = (g.save.data.total || 0) + 1;
    const avg = (f.sp.cm[0] + f.sp.cm[1]) / 2;
    const pts = Math.round(R.points * (0.8 + 0.4 * f.cm / avg) * (isBonus() ? 2 : 1));
    score += pts;
    caughtCount++;
    stats.catches++;
    if (isNew) stats.newKinds++;
    if (!stats.best || R.stars * 1000 + f.cm > RARITY[stats.best.sp.rarity].stars * 1000 + stats.best.cm) stats.best = { sp: f.sp, cm: f.cm };
    g.store();
    card = { sp: f.sp, cm: f.cm, scale: f.scale, isNew, bestSize: bestSize && !isNew, pts, t: 0, bonus: isBonus() };
    lastCatch = f.sp.id;
    g.sfx('star');
    if (isNew) setTimeout(() => g.sfx('coin'), 250);
    g.particles.burst(W / 2, 180, { count: 30, shape: 'star', speed: 320, size: 14, gravity: 300 });
    g.particles.burst(REEL_TO.x, WATER, { count: 18, angle: -Math.PI / 2, spread: 1.4, speed: 260, size: 10, gravity: 700, colors: ['#ffffff', '#bde0fe', '#8ecae6'] });
    if (f.sp.rarity === 'golden') {
      startBonus(g);
      if (isNew) g.achieve('golden', 'Golden fish!');
    }
    if (f.sp.rarity === 'legendary') g.achieve('legend-' + f.sp.id, 'Legendary catch!');
    checkUnlocks(g);
  }

  // Let the fish go: it jumps back into the water.
  function releaseFish(g) {
    released.push({ sp: card.sp, cm: card.cm, scale: card.scale, x: REEL_TO.x + 10, y: 150, vx: 230, vy: -340, rot: 0, t: 0 });
    popup('Splash! Bye fishy!', REEL_TO.x + 160, 110, '#bde0fe', 30);
    g.sfx('whoosh');
    card = null;
    phase = 'idle';
  }

  function startBonus(g) {
    bonusT = BONUS_SECONDS;
    stats.bonus++;
    g.sfx('win');
    popup('FISH FRENZY!', W / 2, 140, '#ffe066', 52);
    // lots of fish rush in from both sides
    for (let i = 0; i < 6; i++) spawnFish(g);
  }

  function endRound(g) {
    if (ended) return;
    ended = true;
    const best = stats.best ? `Best fish: ${stats.best.sp.name} (${stats.best.cm} cm)` : '';
    if (mode === 'timed') {
      const th = [55, 130, 230].map(v => Math.round(v * g.pick(0.55, 1, 1.3)));
      const stars = score >= th[2] ? 3 : score >= th[1] ? 2 : score >= th[0] ? 1 : 0;
      if (score >= 600) g.save.data.bigScore = true;
      g.finish({
        win: stars > 0, score, stars,
        title: stars === 3 ? 'Fish champion!' : stars > 0 ? 'Great fishing!' : 'Nice try!',
        lines: [`Fish caught: ${caughtCount}`, best, stars < 3 ? `Next star at ${th[stars]} points` : ''].filter(Boolean),
        next: stars > 0, delay: 1000,
      });
    } else {
      const stars = caughtCount >= 8 ? 3 : caughtCount >= 4 ? 2 : caughtCount >= 1 ? 1 : 0;
      g.finish({
        win: caughtCount > 0, score, stars,
        title: caughtCount ? 'Lovely fishing!' : 'See you soon!',
        lines: [`Fish caught: ${caughtCount}`, stats.newKinds ? `New kinds: ${stats.newKinds}` : '', best, `Fish Book: ${kindsFound(g)} / ${SPECIES.length}`].filter(Boolean),
        delay: 300,
      });
    }
  }

  // ---------------------------------------------------------------
  // Drawing: one cute fish. Drawn around its middle, facing right
  // (face = -1 flips it to face left). o.sil = dark "mystery" silhouette.
  // ---------------------------------------------------------------
  function drawFish(ctx, sp, x, y, face, scale, t, o = {}) {
    const L = sp.len * scale, a = L / 2, b = L * sp.hgt / 2;
    const sil = o.sil;
    const col = c => sil ? '#4a5d73' : c;
    const lw = o.lw || Math.max(2.5, Math.min(4, L / 22));
    const wig = o.wiggle == null ? 1 : o.wiggle;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(Math.abs(face) < 0.15 ? 0.15 * Math.sign(face || 1) : face, 1);
    if (o.rot) ctx.rotate(o.rot);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = lw;

    // glow behind special fish
    if (!sil && (sp.rarity === 'legendary' || sp.rarity === 'golden') && !o.noGlow) {
      const gl = ctx.createRadialGradient(0, 0, b * 0.5, 0, 0, a * 1.5);
      gl.addColorStop(0, sp.rarity === 'golden' ? 'rgba(255,230,100,0.55)' : `hsla(${(t * 80) % 360},100%,80%,0.5)`);
      gl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, a * 1.5, 0, Math.PI * 2); ctx.fill();
    }

    if (sp.shape === 'long') { drawEel(ctx, sp, a, b, t, wig, sil, lw); ctx.restore(); return; }

    const round = sp.shape === 'round';
    const ra = round ? a * 0.8 : a;   // body half-length

    // --- tail (wags) ---
    ctx.save();
    ctx.translate(-ra * 0.88, 0);
    ctx.rotate(Math.sin(t * 9) * 0.22 * wig);
    const tl = (round ? a * 0.5 : a * 0.55), th = (round ? b * 0.55 : b * 0.85);
    ctx.beginPath();
    if (sp.tail === 'fork') {
      ctx.moveTo(6, 0);
      ctx.quadraticCurveTo(-tl * 0.4, -th * 0.35, -tl, -th);
      ctx.quadraticCurveTo(-tl * 0.55, 0, -tl, th);
      ctx.quadraticCurveTo(-tl * 0.4, th * 0.35, 6, 0);
    } else if (sp.tail === 'fan') {
      ctx.moveTo(6, -th * 0.2);
      ctx.bezierCurveTo(-tl * 0.5, -th * 1.2, -tl * 1.25, -th * 0.9, -tl * 1.05, 0);
      ctx.bezierCurveTo(-tl * 1.25, th * 0.9, -tl * 0.5, th * 1.2, 6, th * 0.2);
    } else {
      ctx.moveTo(6, -th * 0.25);
      ctx.bezierCurveTo(-tl * 0.5, -th * 1.0, -tl * 1.1, -th * 0.6, -tl, 0);
      ctx.bezierCurveTo(-tl * 1.1, th * 0.6, -tl * 0.5, th * 1.0, 6, th * 0.25);
    }
    ctx.closePath();
    ctx.fillStyle = col(sp.fin); ctx.fill(); ctx.stroke();
    if (sp.tail === 'fan' && !sil) {
      ctx.lineWidth = lw * 0.6;
      ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(-tl * 0.85, -th * 0.45); ctx.moveTo(-2, 0); ctx.lineTo(-tl * 0.9, th * 0.45); ctx.stroke();
      ctx.lineWidth = lw;
    }
    ctx.restore();

    // --- long nose (marlin) behind the body ---
    if (sp.extra === 'nose') {
      ctx.beginPath(); ctx.moveTo(ra * 0.7, -b * 0.28); ctx.lineTo(ra * 1.55, -b * 0.02); ctx.lineTo(ra * 0.75, b * 0.12); ctx.closePath();
      ctx.fillStyle = col(sp.body); ctx.fill(); ctx.stroke();
    }

    // --- fins behind the body ---
    const tall = sp.shape === 'tall' || sp.extra === 'nose';
    ctx.fillStyle = col(sp.fin);
    ctx.beginPath();   // top fin
    if (tall) {
      ctx.moveTo(-ra * 0.5, -b * 0.7);
      ctx.quadraticCurveTo(-ra * 0.3, -b * 2.0, ra * 0.25, -b * 1.75);
      ctx.quadraticCurveTo(ra * 0.3, -b * 1.2, ra * 0.35, -b * 0.7);
    } else if (round) {
      ctx.moveTo(-ra * 0.3, -b * 0.75);
      ctx.quadraticCurveTo(-ra * 0.1, -b * 1.25, ra * 0.25, -b * 0.8);
    } else {
      ctx.moveTo(-ra * 0.45, -b * 0.75);
      ctx.quadraticCurveTo(-ra * 0.15, -b * 1.6, ra * 0.3, -b * 0.85);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath();   // bottom fin
    if (tall) {
      ctx.moveTo(-ra * 0.35, b * 0.75); ctx.quadraticCurveTo(-ra * 0.2, b * 1.7, ra * 0.15, b * 1.4); ctx.quadraticCurveTo(ra * 0.15, b * 1.0, ra * 0.2, b * 0.75);
    } else {
      ctx.moveTo(-ra * 0.35, b * 0.8); ctx.quadraticCurveTo(-ra * 0.3, b * 1.35, ra * 0.05, b * 0.85);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // --- puffer nubs ---
    if (round) {
      ctx.fillStyle = col(sp.belly);
      for (let i = 0; i < 12; i++) {
        const ang = i / 12 * Math.PI * 2 + 0.2;
        const cx = Math.cos(ang) * ra * 0.98, cy = Math.sin(ang) * b * 0.98;
        ctx.beginPath(); ctx.arc(cx, cy, Math.max(3, b * 0.11), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }

    // --- body ---
    ctx.beginPath(); ctx.ellipse(0, 0, ra, b, 0, 0, Math.PI * 2);
    ctx.fillStyle = col(sp.body); ctx.fill();
    if (!sil) {
      ctx.save();
      ctx.clip();
      // light belly
      ctx.fillStyle = sp.belly;
      ctx.beginPath(); ctx.ellipse(ra * 0.05, b * 0.62, ra * 1.0, b * 0.62, 0, 0, Math.PI * 2); ctx.fill();
      // patterns
      ctx.fillStyle = sp.pat; ctx.strokeStyle = sp.pat;
      if (sp.pattern === 'stripes') {
        for (const sx of [-0.45, 0.05]) {
          ctx.beginPath(); ctx.ellipse(ra * sx, 0, ra * 0.1, b * 1.1, 0, 0, Math.PI * 2); ctx.fill();
          ctx.lineWidth = lw * 0.6; ctx.strokeStyle = INK; ctx.stroke();
        }
      } else if (sp.pattern === 'spots') {
        const pts = [[-0.5, -0.3], [-0.15, -0.5], [-0.3, 0.1], [0.05, -0.15], [-0.65, 0.15], [0.2, -0.55]];
        for (const [px, py] of pts) { ctx.beginPath(); ctx.arc(ra * px, b * py, Math.max(2.5, b * 0.13), 0, Math.PI * 2); ctx.fill(); }
      } else if (sp.pattern === 'band') {
        ctx.beginPath(); ctx.ellipse(-ra * 0.05, b * 0.02, ra * 1.05, b * 0.18, 0, 0, Math.PI * 2); ctx.fill();
      } else if (sp.pattern === 'scales') {
        ctx.lineWidth = lw * 0.6; ctx.strokeStyle = sp.pat;
        for (let r = -1; r <= 1; r++) for (let c = -2; c <= 1; c++) {
          ctx.beginPath(); ctx.arc(ra * (c * 0.28 - 0.05) + (r % 2 ? ra * 0.14 : 0), b * r * 0.42, b * 0.2, -Math.PI / 2, Math.PI / 2); ctx.stroke();
        }
      }
      // gill line
      ctx.strokeStyle = 'rgba(43,43,43,0.55)'; ctx.lineWidth = lw * 0.7;
      ctx.beginPath(); ctx.arc(ra * 0.05, 0, b * 0.75, -0.9, 0.9); ctx.stroke();
      ctx.restore();
    }
    ctx.strokeStyle = INK; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.ellipse(0, 0, ra, b, 0, 0, Math.PI * 2); ctx.stroke();

    // side fin
    ctx.beginPath();
    ctx.moveTo(ra * 0.05, b * 0.15);
    ctx.quadraticCurveTo(-ra * 0.35, b * 0.25 + Math.sin(t * 7) * b * 0.12, -ra * 0.25, b * 0.5);
    ctx.quadraticCurveTo(-ra * 0.05, b * 0.45, ra * 0.05, b * 0.15);
    ctx.fillStyle = col(sp.fin); ctx.fill(); ctx.stroke();

    if (!sil) drawFace(ctx, sp, ra, b, lw, o);
    else {
      // just a "?" for fish not found yet
      ctx.fillStyle = '#fff';
      ctx.font = `800 ${Math.round(b * 1.1)}px "Comic Sans MS", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.save(); if (face < 0) ctx.scale(-1, 1); ctx.fillText('?', 0, b * 0.05); ctx.restore();
    }

    if (sp.crown && !sil) {
      // a tiny crown for the legendary kings and queens
      ctx.save();
      ctx.translate(ra * 0.35, -b * 0.92);
      ctx.rotate(0.15);
      const cw = Math.max(16, b * 0.6), ch = cw * 0.6;
      ctx.beginPath();
      ctx.moveTo(-cw / 2, 0); ctx.lineTo(-cw / 2, -ch); ctx.lineTo(-cw / 4, -ch * 0.5); ctx.lineTo(0, -ch * 1.1);
      ctx.lineTo(cw / 4, -ch * 0.5); ctx.lineTo(cw / 2, -ch); ctx.lineTo(cw / 2, 0); ctx.closePath();
      ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.lineWidth = lw * 0.8; ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  // Big shiny eye, blush and a smile (used by every fish).
  function drawFace(ctx, sp, ra, b, lw, o) {
    const er = Math.max(4.5, Math.min(b * 0.36, ra * 0.24));
    const ex = ra * 0.5, ey = -b * 0.18;
    ctx.lineWidth = Math.max(2, lw * 0.75);
    D.circle(ctx, ex, ey, er, '#fff', ctx.lineWidth);
    const look = o.happy ? 0 : er * 0.15;
    D.circle(ctx, ex + look, ey + er * 0.05, er * 0.62, INK, 0);
    D.circle(ctx, ex + look + er * 0.22, ey - er * 0.22, er * 0.24, '#fff', 0);
    D.circle(ctx, ex + look - er * 0.18, ey + er * 0.25, er * 0.11, '#fff', 0);
    // blush
    ctx.fillStyle = 'rgba(255,105,150,0.5)';
    ctx.beginPath(); ctx.ellipse(ex - er * 0.1, ey + er * 1.35, er * 0.55, er * 0.32, 0, 0, Math.PI * 2); ctx.fill();
    // smile
    ctx.strokeStyle = INK; ctx.lineWidth = Math.max(2, lw * 0.7);
    ctx.beginPath(); ctx.arc(ra * 0.8, b * 0.12, Math.max(3, b * 0.16), 0.2, Math.PI * 0.75); ctx.stroke();
    if (sp.extra === 'whiskers') {
      ctx.lineWidth = Math.max(2, lw * 0.7);
      ctx.beginPath();
      ctx.moveTo(ra * 0.9, b * 0.05); ctx.quadraticCurveTo(ra * 1.25, b * 0.1, ra * 1.25, b * 0.6);
      ctx.moveTo(ra * 0.85, b * 0.25); ctx.quadraticCurveTo(ra * 1.1, b * 0.5, ra * 1.0, b * 0.9);
      ctx.stroke();
    }
    ctx.lineWidth = lw;
  }

  // The long wiggly sea ribbon (eel-like) fish.
  function drawEel(ctx, sp, a, b, t, wig, sil, lw) {
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const u = i / 16;
      const x = -a + u * a * 1.9;
      pts.push([x, Math.sin(u * Math.PI * 2 - t * 5) * b * 0.9 * wig * (1 - u * 0.7)]);
    }
    const path = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts) ctx.lineTo(p[0], p[1]); };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // fin ribbon along the back
    path(); ctx.strokeStyle = INK; ctx.lineWidth = b * 2.9 + lw * 2; ctx.stroke();
    path(); ctx.strokeStyle = sil ? '#4a5d73' : sp.fin; ctx.lineWidth = b * 2.9; ctx.stroke();
    path(); ctx.strokeStyle = INK; ctx.lineWidth = b * 2 + lw * 2; ctx.stroke();
    path(); ctx.strokeStyle = sil ? '#4a5d73' : sp.body; ctx.lineWidth = b * 2; ctx.stroke();
    // head
    const hx = pts[16][0], hy = pts[16][1];
    ctx.beginPath(); ctx.ellipse(hx + b * 0.3, hy, b * 1.5, b * 1.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = sil ? '#4a5d73' : sp.body; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.stroke();
    if (!sil) {
      ctx.save(); ctx.translate(hx + b * 0.1, hy);
      drawFace(ctx, sp, b * 1.5, b * 1.25, lw, {});
      ctx.restore();
      // spots along the body
      ctx.fillStyle = sp.belly;
      for (let i = 3; i < 15; i += 3) { ctx.beginPath(); ctx.arc(pts[i][0], pts[i][1], b * 0.35, 0, Math.PI * 2); ctx.fill(); }
    } else {
      ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(b * 2)}px "Comic Sans MS", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 0, 0);
    }
  }

  // ---------------------------------------------------------------
  // Drawing: the scene
  // ---------------------------------------------------------------
  function drawSky(g, ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, WATER);
    sky.addColorStop(0, loc.sky[0]); sky.addColorStop(1, loc.sky[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, WATER + 10);
    const t = g.time;
    // clouds drift slowly
    for (const [cx, cy, s] of [[300, 50, 1], [620, 80, 0.8], [880, 40, 0.7]]) {
      const x = ((cx + t * 8 * s) % (W + 200)) - 100;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(43,43,43,0.25)'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, cy, 22 * s, Math.PI * 0.5, Math.PI * 1.5);
      ctx.arc(x + 26 * s, cy - 14 * s, 26 * s, Math.PI, Math.PI * 2);
      ctx.arc(x + 56 * s, cy, 22 * s, Math.PI * 1.5, Math.PI * 0.5);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    if (locId === 'pond') {
      // round green hills and a few trees on the far shore
      ctx.fillStyle = '#8bd17c'; ctx.strokeStyle = 'rgba(43,43,43,0.3)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(250, WATER);
      ctx.quadraticCurveTo(420, 110, 600, WATER - 10); ctx.quadraticCurveTo(760, 120, 960, WATER - 20); ctx.lineTo(960, WATER); ctx.closePath();
      ctx.fill(); ctx.stroke();
      for (const [x, s] of [[470, 1], [520, 0.8], [800, 0.9]]) {
        ctx.fillStyle = '#8b5a2b'; ctx.fillRect(x - 4 * s, WATER - 50 * s, 8 * s, 40 * s);
        D.circle(ctx, x, WATER - 62 * s, 22 * s, '#4caf50', 3);
      }
      // reeds and cattails on the right
      for (let i = 0; i < 6; i++) {
        const x = 880 + i * 14, sw = Math.sin(t * 1.2 + i) * 4;
        ctx.strokeStyle = '#2f7d32'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, WATER + 4); ctx.quadraticCurveTo(x + sw * 0.5, WATER - 40, x + sw, WATER - 70 - (i % 3) * 12); ctx.stroke();
        if (i % 2 === 0) D.box(ctx, x + sw - 5, WATER - 92 - (i % 3) * 12, 10, 24, 5, '#8b5a2b', 3);
      }
    } else if (locId === 'pier') {
      // the sea goes all the way to the horizon; a little lighthouse far away
      ctx.fillStyle = '#7fd8f0'; ctx.fillRect(250, WATER - 22, W, 22);
      ctx.strokeStyle = 'rgba(43,43,43,0.3)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(250, WATER - 22); ctx.lineTo(W, WATER - 22); ctx.stroke();
      ctx.fillStyle = '#f7d488'; ctx.beginPath(); ctx.ellipse(850, WATER - 22, 90, 16, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(838, WATER - 34); ctx.lineTo(844, WATER - 96); ctx.lineTo(860, WATER - 96); ctx.lineTo(866, WATER - 34); ctx.closePath();
      ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = '#ef476f'; ctx.fillRect(842, WATER - 70, 21, 12);
      D.box(ctx, 840, WATER - 112, 24, 18, 4, '#ffd166', 3);
      // a little sailboat bobbing by
      const bx = 560 + Math.sin(t * 0.1) * 60, by = WATER - 26 + Math.sin(t * 1.5) * 2;
      ctx.beginPath(); ctx.moveTo(bx - 26, by); ctx.lineTo(bx + 26, by); ctx.lineTo(bx + 18, by + 10); ctx.lineTo(bx - 18, by + 10); ctx.closePath();
      ctx.fillStyle = '#ef476f'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx, by - 2); ctx.lineTo(bx, by - 46); ctx.lineTo(bx + 22, by - 6); ctx.closePath();
      ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
    } else {
      // snowy mountains and pine trees
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(43,43,43,0.3)';
      for (const [x, w, h] of [[420, 220, 120], [620, 260, 150], [840, 240, 110]]) {
        ctx.beginPath(); ctx.moveTo(x - w / 2, WATER); ctx.lineTo(x, WATER - h); ctx.lineTo(x + w / 2, WATER); ctx.closePath();
        ctx.fillStyle = '#9fb7d9'; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - w * 0.12, WATER - h * 0.76); ctx.lineTo(x, WATER - h); ctx.lineTo(x + w * 0.12, WATER - h * 0.76);
        ctx.lineTo(x + w * 0.05, WATER - h * 0.7); ctx.lineTo(x - w * 0.04, WATER - h * 0.78); ctx.closePath();
        ctx.fillStyle = '#fff'; ctx.fill();
      }
      for (const x of [330, 370, 700, 900, 930]) {
        ctx.beginPath(); ctx.moveTo(x - 16, WATER - 4); ctx.lineTo(x, WATER - 56); ctx.lineTo(x + 16, WATER - 4); ctx.closePath();
        ctx.fillStyle = '#2d6a4f'; ctx.fill(); ctx.strokeStyle = INK; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - 6, WATER - 38); ctx.lineTo(x, WATER - 56); ctx.lineTo(x + 6, WATER - 38); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
      }
      ctx.fillStyle = '#fff';
      for (const f of flakes) { ctx.beginPath(); ctx.arc(f.x, f.y, f.s, 0, Math.PI * 2); ctx.fill(); }
    }
  }

  function drawWater(g, ctx) {
    const t = g.time;
    // the water body with a wavy top
    const grad = ctx.createLinearGradient(0, WATER, 0, FLOOR);
    grad.addColorStop(0, loc.water[0]); grad.addColorStop(1, loc.water[1]);
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, waveY(x, t));
    ctx.lineTo(W, H); ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    // sunbeams swaying under the water
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 5; i++) {
      const x = 300 + i * 150 + Math.sin(t * 0.4 + i) * 30;
      ctx.beginPath(); ctx.moveTo(x, WATER); ctx.lineTo(x + 50, WATER); ctx.lineTo(x - 30, FLOOR); ctx.lineTo(x - 90, FLOOR); ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    // the bottom: sand / mud / rocks, with plants or coral
    ctx.fillStyle = loc.floor;
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, FLOOR + Math.sin(x * 0.02) * 6);
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = loc.floor2;
    for (let x = 40; x < W; x += 90) { ctx.beginPath(); ctx.ellipse(x, FLOOR + 14, 12, 5, 0, 0, Math.PI * 2); ctx.fill(); }

    if (locId === 'pond' || locId === 'ice') {
      // waving water plants
      const cols = locId === 'pond' ? ['#43aa8b', '#90be6d'] : ['#6fb7a8', '#94d2bd'];
      for (const [x, h, c] of [[300, 90, 0], [330, 60, 1], [520, 110, 0], [700, 70, 1], [730, 100, 0], [900, 80, 1]]) {
        const sw = Math.sin(t * 1.3 + x) * 12;
        ctx.beginPath(); ctx.moveTo(x - 8, FLOOR + 4);
        ctx.quadraticCurveTo(x - 10 + sw * 0.5, FLOOR - h * 0.5, x + sw, FLOOR - h);
        ctx.quadraticCurveTo(x + 10 + sw * 0.5, FLOOR - h * 0.5, x + 8, FLOOR + 4);
        ctx.closePath(); ctx.fillStyle = cols[c]; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      }
    } else {
      // coral and a smiling starfish
      for (const [x, c] of [[330, '#ff70a6'], [610, '#ff9770'], [860, '#c77dff']]) {
        ctx.strokeStyle = INK; ctx.lineWidth = 16; ctx.lineCap = 'round';
        const br = () => { ctx.beginPath(); ctx.moveTo(x, FLOOR + 4); ctx.lineTo(x, FLOOR - 50); ctx.moveTo(x, FLOOR - 24); ctx.lineTo(x - 22, FLOOR - 50); ctx.moveTo(x, FLOOR - 32); ctx.lineTo(x + 20, FLOOR - 64); };
        br(); ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = 9; br(); ctx.stroke();
      }
      D.star(ctx, 470, FLOOR + 2, 18, '#ff8fab', 3);
      D.circle(ctx, 466, FLOOR, 2, INK, 0); D.circle(ctx, 474, FLOOR, 2, INK, 0);
    }

    // bubbles
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    for (const b of bubbles) { ctx.beginPath(); ctx.arc(b.x + Math.sin(b.w) * 4, b.y, b.r, 0, Math.PI * 2); ctx.stroke(); }
  }

  // Things ON the water surface (drawn after the fish so the surface line sits on top)
  function drawSurface(g, ctx) {
    const t = g.time;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 16) { const y = waveY(x, t); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    // sparkly shimmer lines
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 10; i++) {
      const x = ((i * 113 + t * 18) % (W - 240)) + 240, y = WATER + 10 + (i % 3) * 9;
      const len = 14 + 8 * Math.sin(t * 2 + i);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
    }
    // ripples
    for (const r of ripples) {
      ctx.globalAlpha = Math.max(0, 1 - r.t / 1.4);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(r.x, WATER + 2, r.r, r.r * 0.25, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (locId === 'pond') {
      // lily pads
      for (const [x, s] of [[420, 1], [780, 0.8]]) {
        const y = waveY(x, t) + 2;
        ctx.beginPath(); ctx.ellipse(x, y, 34 * s, 9 * s, 0, 0.25, Math.PI * 2 - 0.05); ctx.lineTo(x, y); ctx.closePath();
        ctx.fillStyle = '#5cb85c'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      }
      D.circle(ctx, 432, waveY(432, t) - 4, 7, '#ffafcc', 3);
    } else if (locId === 'ice') {
      // floating ice chunks
      for (const [x, w] of [[460, 70], [700, 50], [900, 80]]) {
        const y = waveY(x, t);
        D.box(ctx, x - w / 2, y - 10, w, 20, 8, '#f0fbff', 3);
      }
    }
  }

  function drawDock(g, ctx) {
    if (locId === 'ice') {
      // a snowy ice shelf with a little ice-hole sign
      ctx.beginPath();
      ctx.moveTo(-10, DOCK_Y); ctx.lineTo(DOCK_X - 20, DOCK_Y);
      ctx.quadraticCurveTo(DOCK_X + 6, DOCK_Y, DOCK_X + 4, DOCK_Y + 26);
      ctx.lineTo(DOCK_X - 6, WATER + 70); ctx.lineTo(-10, WATER + 90); ctx.closePath();
      ctx.fillStyle = '#d9f1ff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-10, DOCK_Y + 2); ctx.lineTo(DOCK_X - 20, DOCK_Y + 2); ctx.quadraticCurveTo(DOCK_X + 4, DOCK_Y + 2, DOCK_X + 2, DOCK_Y + 18);
      ctx.lineTo(-10, DOCK_Y + 18); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill();
      // icicles
      ctx.fillStyle = '#bde0fe';
      for (const x of [60, 110, 160]) { ctx.beginPath(); ctx.moveTo(x - 7, DOCK_Y + 18); ctx.lineTo(x, DOCK_Y + 40); ctx.lineTo(x + 7, DOCK_Y + 18); ctx.closePath(); ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); }
      // a cute snowman buddy
      D.circle(ctx, 70, DOCK_Y - 18, 20, '#fff', 3);
      D.circle(ctx, 70, DOCK_Y - 50, 14, '#fff', 3);
      D.circle(ctx, 65, DOCK_Y - 53, 2.5, INK, 0); D.circle(ctx, 75, DOCK_Y - 53, 2.5, INK, 0);
      ctx.beginPath(); ctx.moveTo(70, DOCK_Y - 48); ctx.lineTo(82, DOCK_Y - 46); ctx.lineTo(70, DOCK_Y - 44); ctx.closePath(); ctx.fillStyle = '#ff8c42'; ctx.fill();
      return;
    }
    const wood = locId === 'pier' ? '#b5835a' : '#c98b4f', dark = locId === 'pier' ? '#8a5f3c' : '#9c6634';
    // posts going down into the water
    for (const x of [30, 120, DOCK_X - 22]) {
      ctx.fillStyle = dark; ctx.fillRect(x, DOCK_Y + 10, 18, (locId === 'pier' ? FLOOR : WATER + 90) - DOCK_Y);
      ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.strokeRect(x, DOCK_Y + 10, 18, (locId === 'pier' ? FLOOR : WATER + 90) - DOCK_Y);
    }
    // planks
    D.box(ctx, -10, DOCK_Y, DOCK_X + 10, 18, 5, wood, 4);
    ctx.strokeStyle = dark; ctx.lineWidth = 2;
    for (let x = 30; x < DOCK_X; x += 40) { ctx.beginPath(); ctx.moveTo(x, DOCK_Y + 3); ctx.lineTo(x, DOCK_Y + 15); ctx.stroke(); }
    // a bucket for the catch
    ctx.beginPath(); ctx.moveTo(52, DOCK_Y - 36); ctx.lineTo(92, DOCK_Y - 36); ctx.lineTo(86, DOCK_Y); ctx.lineTo(58, DOCK_Y); ctx.closePath();
    ctx.fillStyle = '#4cc9f0'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(72, DOCK_Y - 36, 20, 5, 0, 0, Math.PI * 2); ctx.fillStyle = '#bde0fe'; ctx.fill(); ctx.stroke();
    if (locId === 'pier') {
      // railing
      ctx.fillStyle = wood; ctx.lineWidth = 4;
      for (const x of [10, 110]) { ctx.fillRect(x, DOCK_Y - 50, 10, 50); ctx.strokeRect(x, DOCK_Y - 50, 10, 50); }
      D.box(ctx, 0, DOCK_Y - 56, 130, 10, 4, wood, 4);
    }
  }

  // The angler: a cute kid sitting on the end of the dock.
  function drawAngler(g, ctx) {
    const t = g.time;
    const breathe = Math.sin(t * 2) * 1.2;
    const skin = '#ffd6a5', shirt = locId === 'ice' ? '#ef476f' : locId === 'pier' ? '#06d6a0' : '#ff8c42', pants = '#3a86ff';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // legs dangling over the edge (they swing a little)
    const swing = Math.sin(t * 1.6) * 6;
    for (const [dx, ph] of [[0, 0], [8, 1]]) {
      const kx = DOCK_X - 6 + dx, ky = DOCK_Y - 2;
      const fx = kx + 8 + Math.sin(t * 1.6 + ph) * 6, fy = DOCK_Y + 30;
      ctx.strokeStyle = INK; ctx.lineWidth = 15;
      ctx.beginPath(); ctx.moveTo(196, DOCK_Y - 8); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
      ctx.strokeStyle = pants; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(196, DOCK_Y - 8); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
      D.box(ctx, fx - 6, fy - 4, 18, 11, 5, locId === 'ice' ? '#8b5a2b' : '#ef476f', 3);
    }
    void swing;
    // body
    D.box(ctx, 172, 118 + breathe, 46, DOCK_Y - 116 - breathe, 16, shirt, 4);
    // head
    const hx = 196, hy = 92 + breathe;
    D.circle(ctx, hx, hy, 27, skin, 4);
    // eyes (looking at the bobber)
    for (const ex of [hx + 4, hx + 18]) {
      D.circle(ctx, ex, hy + 1, 5.5, INK, 0);
      D.circle(ctx, ex + 1.8, hy - 1.2, 2, '#fff', 0);
    }
    ctx.fillStyle = 'rgba(255,105,150,0.5)';
    ctx.beginPath(); ctx.ellipse(hx - 4, hy + 11, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(hx + 23, hy + 11, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    const happy = phase === 'caught' || phase === 'bite';
    ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath();
    if (happy) { ctx.arc(hx + 12, hy + 10, 6, 0, Math.PI); ctx.fillStyle = '#ef476f'; ctx.fill(); }
    else ctx.arc(hx + 12, hy + 9, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // hat
    ctx.lineWidth = 4;
    if (loc.hat === 'bucket') {
      ctx.beginPath(); ctx.ellipse(hx, hy - 16, 36, 9, -0.05, 0, Math.PI * 2); ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx - 22, hy - 17); ctx.quadraticCurveTo(hx - 20, hy - 46, hx, hy - 46); ctx.quadraticCurveTo(hx + 20, hy - 46, hx + 22, hy - 17); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ef476f'; ctx.fillRect(hx - 21, hy - 26, 42, 7);
    } else if (loc.hat === 'cap') {
      ctx.beginPath(); ctx.moveTo(hx - 26, hy - 10); ctx.quadraticCurveTo(hx - 24, hy - 42, hx, hy - 42); ctx.quadraticCurveTo(hx + 24, hy - 42, hx + 26, hy - 10); ctx.closePath();
      ctx.fillStyle = '#ef476f'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(hx + 32, hy - 12, 20, 6, 0.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      D.circle(ctx, hx, hy - 42, 4, '#fff', 3);
    } else {
      ctx.beginPath(); ctx.moveTo(hx - 27, hy - 6); ctx.quadraticCurveTo(hx - 26, hy - 44, hx, hy - 44); ctx.quadraticCurveTo(hx + 26, hy - 44, hx + 27, hy - 6); ctx.closePath();
      ctx.fillStyle = '#118ab2'; ctx.fill(); ctx.stroke();
      D.box(ctx, hx - 28, hy - 14, 56, 12, 6, '#8ecae6', 4);
      D.circle(ctx, hx, hy - 48, 9, '#fff', 4);
      // scarf
      D.box(ctx, 176, 114 + breathe, 40, 12, 6, '#ffd166', 4);
      D.box(ctx, 178, 120 + breathe, 12, 24, 5, '#ffd166', 4);
    }
    // the rod
    drawRod(g, ctx);
    // arm reaching to the rod, hand on top
    ctx.strokeStyle = INK; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(192, 128 + breathe); ctx.lineTo(HANDS.x, HANDS.y); ctx.stroke();
    ctx.strokeStyle = shirt; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(192, 128 + breathe); ctx.lineTo(HANDS.x - 4, HANDS.y); ctx.stroke();
    D.circle(ctx, HANDS.x, HANDS.y, 7, skin, 3);
  }

  function drawRod(g, ctx) {
    const tip = rodTip();
    const bx = HANDS.x - Math.cos(rodA) * 26, by = HANDS.y - Math.sin(rodA) * 26;
    const mx = (bx + tip.x) / 2, my = (by + tip.y) / 2;
    // bend: the middle of the rod sags toward the line a little
    const cx = mx + (HANDS.x + Math.cos(rodA) * ROD_LEN - tip.x) * -0.4, cy = my + (HANDS.y + Math.sin(rodA) * ROD_LEN - tip.y) * -0.4;
    let color = rod.color;
    if (rod.rainbow) { const gr = ctx.createLinearGradient(bx, by, tip.x, tip.y); ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#9b5de5'].forEach((c, i) => gr.addColorStop(i / 4, c)); color = gr; }
    ctx.lineCap = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(cx, cy, tip.x, tip.y); ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = 4.5;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(cx, cy, tip.x, tip.y); ctx.stroke();
    // reel (spins while reeling)
    const rx = HANDS.x - Math.cos(rodA) * 10 + 6, ry = HANDS.y - Math.sin(rodA) * 10 + 8;
    D.circle(ctx, rx, ry, 9, '#dfe7ef', 3);
    const spin = phase === 'reeling' && (g.input.pointer.down || g.input.down('Space')) ? g.time * 20 : 0;
    ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + Math.cos(spin) * 8, ry + Math.sin(spin) * 8); ctx.stroke();
  }

  // Fishing line, bobber and lure
  function drawLine(g, ctx) {
    if (!bobber) return;
    const tip = rodTip();
    const b = bobber;
    const by = (phase === 'flying' ? b.y : waveY(b.x, g.time)) + (phase === 'flying' ? 0 : b.dip);
    // sagging line from the rod tip to the bobber
    const sag = phase === 'flying' ? 10 : phase === 'reeling' ? 60 * (1 - tension) + 4 : 46;
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(tip.x, tip.y);
    ctx.quadraticCurveTo((tip.x + b.x) / 2, Math.max(tip.y, by) + sag - Math.abs(b.x - tip.x) * 0.05, b.x, by);
    ctx.stroke();
    if (phase === 'flying') { drawBobber(ctx, b.x, by, 0); return; }
    // the line under the water down to the lure
    const lx = b.x + (phase === 'reeling' ? 0 : Math.sin(g.time * 1.5) * 3);
    ctx.strokeStyle = 'rgba(43,43,43,0.7)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(b.x, by + 8); ctx.lineTo(lx, b.lureY - 6); ctx.stroke();
    if (phase !== 'reeling') {
      // the shiny lure with a little hook
      D.circle(ctx, lx, b.lureY, 7, '#ff70a6', 3);
      D.circle(ctx, lx - 2, b.lureY - 2, 2, '#fff', 0);
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(lx, b.lureY + 7); ctx.lineTo(lx, b.lureY + 13); ctx.arc(lx - 4, b.lureY + 13, 4, 0, Math.PI * 0.9); ctx.stroke();
    }
    drawBobber(ctx, b.x, by, b.dip);
    // depth guide while waiting (little arrows next to the lure)
    if (phase === 'waiting' && g.difficulty !== 'challenge') {
      ctx.globalAlpha = 0.5 + 0.2 * Math.sin(g.time * 3);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(lx + 18, b.lureY + s * 10); ctx.lineTo(lx + 26, b.lureY + s * 20); ctx.lineTo(lx + 10, b.lureY + s * 20); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  function drawBobber(ctx, x, y, dip) {
    // drawn twice: the part above the water is bright, the part below is see-through
    for (const under of [false, true]) {
      ctx.save();
      ctx.beginPath();
      if (under) { ctx.rect(x - 20, WATER, 40, 60); ctx.globalAlpha = 0.45; } else ctx.rect(x - 20, y - 60, 40, WATER - (y - 60));
      ctx.clip();
      ctx.strokeStyle = INK; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x, y - 20); ctx.stroke();
      D.circle(ctx, x, y - 21, 3, '#ffd166', 2);
      ctx.beginPath(); ctx.arc(x, y, 10, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#ef476f'; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------
  // Drawing: HUD, power meter, reeling bar, the caught card
  // ---------------------------------------------------------------
  function miniFish(ctx, x, y, s, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-20, -9); ctx.lineTo(-20, 9); ctx.closePath();
    ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(2, 0, 14, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    D.circle(ctx, 8, -2, 2.5, INK, 0);
    ctx.restore();
  }

  function drawHUD(g, ctx) {
    // fish count pill
    const cx = mode === 'timed' ? 330 : W / 2;
    D.box(ctx, cx - 62, 14, 124, 50, 25, 'rgba(255,255,255,0.92)', 4);
    miniFish(ctx, cx - 28, 39, 1.1, '#ffd166');
    D.text(ctx, '× ' + caughtCount, cx + 22, 40, { size: 30 });
    if (mode === 'timed') {
      // clock
      const low = timeLeft < 10;
      D.box(ctx, W / 2 - 58, 14, 116, 50, 25, low && Math.floor(g.time * 4) % 2 ? '#ffafcc' : 'rgba(255,255,255,0.92)', 4);
      D.circle(ctx, W / 2 - 30, 39, 14, '#fff', 3);
      ctx.strokeStyle = INK; ctx.lineWidth = 3;
      const a = -Math.PI / 2 + (1 - timeLeft / TIMED_SECONDS) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(W / 2 - 30, 39); ctx.lineTo(W / 2 - 30 + Math.cos(a) * 10, 39 + Math.sin(a) * 10); ctx.stroke();
      D.text(ctx, String(Math.ceil(timeLeft)), W / 2 + 18, 40, { size: 30, color: low ? '#ffd166' : '#fff' });
      // score
      D.box(ctx, 560, 14, 150, 50, 25, 'rgba(255,255,255,0.92)', 4);
      D.star(ctx, 588, 39, 15);
      D.text(ctx, String(score), 650, 40, { size: 30 });
    } else {
      // the Done button
      const b = DONE_BTN;
      D.box(ctx, b.x, b.y, b.w, b.h, 18, '#06d6a0', 4);
      ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(b.x + 16, b.y + 30); ctx.lineTo(b.x + 26, b.y + 40); ctx.lineTo(b.x + 42, b.y + 18); ctx.stroke();
      D.text(ctx, 'Done', b.x + 72, b.y + 30, { size: 22 });
    }
    if (isBonus()) {
      const hue = (g.time * 200) % 360;
      D.box(ctx, W / 2 - 150, 76, 300, 44, 22, `hsl(${hue} 90% 70%)`, 4);
      D.text(ctx, `FRENZY ×2  ${Math.ceil(bonusT)}`, W / 2, 99, { size: 26 });
    }
  }

  function drawPower(g, ctx) {
    if (phase !== 'charging') return;
    // meter next to the angler
    const x = 270, y = 92, w = 260, h = 30;
    D.box(ctx, x - 8, y - 8, w + 16, h + 16, 16, 'rgba(255,255,255,0.85)', 4);
    const grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, '#8ecae6'); grad.addColorStop(0.5, '#06d6a0'); grad.addColorStop(1, '#ffd166');
    D.meter(ctx, x, y, w, h, power, grad);
    // little arrows: shows "farther ->"
    for (let i = 0; i < 3; i++) {
      const ax = x + 40 + i * 80;
      ctx.fillStyle = 'rgba(43,43,43,0.25)';
      ctx.beginPath(); ctx.moveTo(ax, y + 6); ctx.lineTo(ax + 12, y + h / 2); ctx.lineTo(ax, y + h - 6); ctx.closePath(); ctx.fill();
    }
    // where it will land: a ghost bobber + arrow
    const tx = castTarget(power);
    ctx.globalAlpha = 0.6;
    drawBobber(ctx, tx, WATER, 0);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.ellipse(tx, WATER + 2, 22, 6, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawReelBar(g, ctx) {
    if (phase !== 'reeling') return;
    const [lo, hi] = greenZone(g);
    const x = 290, w = 380, y = 470, h = 34;
    const shake = burst > 0 ? Math.sin(g.time * 50) * 2 : 0;
    D.box(ctx, x - 70, 408, w + 140, 120, 20, 'rgba(255,255,255,0.85)', 4);
    // catch meter (top): the fish swims toward the bucket
    D.meter(ctx, x, 420, w, 22, catchProgress, '#ffd166');
    miniFish(ctx, x + 10 + catchProgress * (w - 20), 431, 0.9, hooked ? hooked.sp.body : '#ffd166');
    // bucket at the end
    ctx.beginPath(); ctx.moveTo(x + w + 16, 418); ctx.lineTo(x + w + 46, 418); ctx.lineTo(x + w + 42, 446); ctx.lineTo(x + w + 20, 446); ctx.closePath();
    ctx.fillStyle = '#4cc9f0'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    // tension bar (bottom): blue = slack, green = good, red = too tight
    ctx.save();
    ctx.translate(shake, 0);
    D.rr(ctx, x, y, w, h, h / 2);
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#bde0fe'; ctx.fillRect(x, y, w * lo, h);
    ctx.fillStyle = '#06d6a0'; ctx.fillRect(x + w * lo, y, w * (hi - lo), h);
    ctx.fillStyle = '#ffe8a3'; ctx.fillRect(x + w * hi, y, w * (RED - hi), h);
    ctx.fillStyle = redTime > 0 && Math.floor(g.time * 8) % 2 ? '#ff99ac' : '#ef476f'; ctx.fillRect(x + w * RED, y, w * (1 - RED), h);
    ctx.restore();
    D.rr(ctx, x, y, w, h, h / 2); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    // the needle
    const nx = x + w * tension;
    ctx.beginPath(); ctx.moveTo(nx, y + h + 4); ctx.lineTo(nx - 10, y - 10); ctx.lineTo(nx + 10, y - 10); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
    // hint: hand icons on the sides
    const low = tension < lo, high = tension > hi;
    if (low) D.text(ctx, 'Hold!', x - 36, y + h / 2, { size: 22, color: '#06d6a0' });
    if (high) D.text(ctx, 'Let go!', x + w + 38, y + h / 2, { size: 20, color: '#ff6b8b' });
  }

  function rarityStars(ctx, n, x, y, r) {
    for (let i = 0; i < n; i++) D.star(ctx, x + (i - (n - 1) / 2) * r * 2.4, y, r, '#ffd166', 3);
  }

  function drawCard(g, ctx) {
    if (!card) return;
    const k = Math.min(1, card.t * 4);
    const pop = 0.6 + 0.4 * k + Math.sin(Math.min(1, card.t * 3) * Math.PI) * 0.06;
    ctx.fillStyle = `rgba(20,40,70,${0.35 * k})`; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2 + 10);
    ctx.scale(pop, pop);
    const R = RARITY[card.sp.rarity];
    // sunburst rays behind the card
    ctx.save(); ctx.rotate(g.time * 0.3);
    ctx.fillStyle = 'rgba(255,240,170,0.35)';
    for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-40, -340); ctx.lineTo(40, -340); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    D.box(ctx, -280, -190, 560, 380, 30, '#fffaf0', 5);
    D.box(ctx, -280, -190, 560, 70, 30, R.color, 5);
    D.text(ctx, 'You caught a', 0, -168, { size: 24 });
    D.text(ctx, card.sp.name + '!', 0, -136, { size: 36, color: '#fff' });
    // the fish, big
    const fit = Math.min(2.6, 300 / (card.sp.len * (card.sp.extra === 'nose' ? 1.6 : 1.3)), 150 / (card.sp.len * card.sp.hgt * 1.4));
    drawFish(ctx, card.sp, 10, -10, 1, fit, g.time, { lw: 5, happy: true });
    rarityStars(ctx, R.stars, 0, 88, 16);
    D.text(ctx, R.label, -170, 88, { size: 22, color: R.color });
    D.text(ctx, card.cm + ' cm', 170, 88, { size: 26 });
    D.text(ctx, '+' + card.pts + (card.bonus ? ' (×2)' : ''), 0, 130, { size: 28, color: '#ffd166' });
    if (card.isNew || card.bestSize) {
      ctx.save(); ctx.translate(225, -110); ctx.rotate(0.25 + Math.sin(g.time * 5) * 0.05);
      D.starPath(ctx, 0, 0, 52, 38, 12); ctx.fillStyle = '#ef476f'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      D.text(ctx, card.isNew ? 'NEW!' : 'BIG!', 0, 2, { size: 24 });
      ctx.restore();
    }
    if (card.t > 0.8) {
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(g.time * 5);
      D.text(ctx, 'Tap to let it swim!', 0, 168, { size: 20, color: '#8ecae6' });
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function render(g, ctx) {
    if (!loc) { ctx.fillStyle = '#8fd3ff'; ctx.fillRect(0, 0, W, H); return; }
    drawSky(g, ctx);
    drawWater(g, ctx);
    // fish (behind the surface line)
    for (const f of fish) {
      const shake = f.state === 'bite' ? Math.sin(g.time * 40) * 2 : 0;
      drawFish(ctx, f.sp, f.x + shake, f.y, f.face, f.scale, f.t + (f.state === 'hooked' && burst > 0 ? g.time * 2 : 0), { wiggle: f.state === 'hooked' ? 2 : f.sp.swim === 'drift' ? 0.6 : 1 });
      // a little "?" when a fish gets curious, "!" on a bite
      if (f.state === 'approach') D.text(ctx, '?', f.x, f.y - fishLen(f) * f.sp.hgt * 0.5 - 20, { size: 24, color: '#ffd166' });
    }
    // sparkles around legendary / golden fish and in the frenzy
    for (const s of sparkles) {
      ctx.globalAlpha = 1 - s.t / s.life;
      D.star(ctx, s.x, s.y, 6 * (1 - s.t / s.life) + 2, s.c, 0);
      ctx.globalAlpha = 1;
    }
    drawSurface(g, ctx);
    drawDock(g, ctx);
    drawAngler(g, ctx);
    drawLine(g, ctx);
    // released fish leaping back in
    for (const r of released) drawFish(ctx, r.sp, r.x, r.y, 1, Math.min(r.scale, 90 / r.sp.len), g.time, { rot: Math.atan2(r.vy, r.vx), happy: true });
    // the big "!" on a bite
    if (phase === 'bite' && bobber) {
      const s = 1 + Math.sin(g.time * 20) * 0.1;
      D.box(ctx, bobber.x - 26, WATER - 104, 52, 62, 18, '#ffd166', 4);
      D.text(ctx, '!', bobber.x, WATER - 72, { size: 52 * s, color: '#ef476f' });
    }
    drawPower(g, ctx);
    drawReelBar(g, ctx);
    for (const p of popups) { ctx.globalAlpha = Math.min(1, (1.5 - p.t) * 3); D.text(ctx, p.text, p.x, p.y, { size: p.size, color: p.color }); ctx.globalAlpha = 1; }
    // first-time hint
    if (phase === 'idle' && caughtCount === 0 && !card) {
      const a = 0.6 + 0.4 * Math.sin(g.time * 4);
      ctx.globalAlpha = a;
      D.text(ctx, 'Hold, then let go to cast!', 600, 150, { size: 26 });
      ctx.globalAlpha = 1;
    }
    drawHUD(g, ctx);
    drawCard(g, ctx);
  }

  // ---------------------------------------------------------------
  // Menus: places (level tiles), the Fish Book, rods
  // ---------------------------------------------------------------
  function fishSvg(color) {
    return `<path d="M20 35 L8 25 L8 45 Z" fill="${color}" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/><ellipse cx="34" cy="35" rx="16" ry="11" fill="${color}" stroke="#2b2b2b" stroke-width="3"/><circle cx="41" cy="32" r="3" fill="#2b2b2b"/>`;
  }
  function locPic(id, timed) {
    const L = LOCS[id];
    let shore = '';
    if (id === 'pond') shore = `<rect x="0" y="26" width="34" height="6" fill="#c98b4f" stroke="#2b2b2b" stroke-width="2"/><ellipse cx="90" cy="31" rx="12" ry="3" fill="#5cb85c" stroke="#2b2b2b" stroke-width="2"/>`;
    if (id === 'pier') shore = `<rect x="0" y="22" width="40" height="6" fill="#b5835a" stroke="#2b2b2b" stroke-width="2"/><rect x="8" y="28" width="5" height="40" fill="#8a5f3c"/><rect x="28" y="28" width="5" height="40" fill="#8a5f3c"/>`;
    if (id === 'ice') shore = `<path d="M0 24 H36 Q44 24 42 36 L36 60 H0 Z" fill="#e8f7ff" stroke="#2b2b2b" stroke-width="2"/><path d="M64 10 L76 32 L52 32 Z M96 8 L110 32 L82 32 Z" fill="#fff" stroke="#9fb7d9" stroke-width="2"/>`;
    const clock = timed ? `<circle cx="100" cy="16" r="13" fill="#fff" stroke="#2b2b2b" stroke-width="3"/><path d="M100 8 V16 L106 19" stroke="#2b2b2b" stroke-width="3" fill="none" stroke-linecap="round"/>` : '';
    return `<svg viewBox="0 0 120 70"><rect width="120" height="32" fill="${L.sky[0]}"/><rect y="30" width="120" height="40" fill="${L.water[0]}"/><path d="M0 31 Q15 27 30 31 T60 31 T90 31 T120 31" fill="none" stroke="#2b2b2b" stroke-width="2.5"/>${shore}<g transform="translate(50 18) scale(0.8)">${fishSvg(timed ? '#ffd166' : '#ff8c42')}</g>${clock}</svg>`;
  }

  function levels(g) {
    const out = [];
    for (const id of LOC_ORDER) {
      const L = LOCS[id];
      const ok = locUnlocked(g, id);
      const list = SPECIES.filter(s => s.loc === id);
      const got = list.filter(s => book(g)[s.id]).length;
      const smallFish = `<svg viewBox="0 0 60 60" style="width:20px;height:20px;vertical-align:middle">${fishSvg('#ffd166')}</svg>`;
      const need = `Find ${L.need} kinds`;
      out.push({ id: id + '-relax', loc: id, mode: 'relax', name: L.name, pic: locPic(id, false), locked: !ok,
        meta: ok ? `${smallFish} ${got} / ${list.length}` : need });
      const rec = g.save.levels[id + '-timed'] || {};
      out.push({ id: id + '-timed', loc: id, mode: 'timed', name: L.name + ' Frenzy', pic: locPic(id, true), locked: !ok,
        meta: ok ? Arcade.starsHTML(rec.stars || 0) + (rec.score ? ' ' + rec.score : '') : need });
    }
    return out;
  }

  // A small picture of a fish (or its silhouette) for the book.
  function fishThumb(sp, found) {
    const c = document.createElement('canvas');
    c.width = 200; c.height = 120;
    const ctx = c.getContext('2d');
    const fit = Math.min(160 / (sp.len * (sp.extra === 'nose' ? 1.6 : 1.35)), 80 / (sp.len * sp.hgt * (sp.shape === 'tall' ? 2.4 : 1.5)));
    drawFish(ctx, sp, 104, 62, 1, fit, 0.6, { sil: !found, lw: 4, happy: true, noGlow: !found });
    return c.toDataURL();
  }

  function openBook(g) {
    const bk = book(g);
    const p = Arcade.h('div', { class: 'ar-panel wide' });
    p.appendChild(Arcade.h('h1', { class: 'ar-title' }, 'Fish Book'));
    p.appendChild(Arcade.h('p', { class: 'ar-sub' }, `${kindsFound(g)} / ${SPECIES.length} kinds found · ${g.save.data.total || 0} fish caught`));
    for (const id of LOC_ORDER.concat(['all'])) {
      p.appendChild(Arcade.h('h2', { class: 'ar-title', style: 'font-size:22px;margin:14px 0 6px' }, id === 'all' ? 'Very special' : LOCS[id].name));
      const grid = Arcade.h('div', { class: 'ar-grid book', style: 'grid-template-columns:repeat(auto-fill,minmax(130px,1fr))' });
      for (const sp of SPECIES.filter(s => s.loc === id)) {
        const rec = bk[sp.id];
        const R = RARITY[sp.rarity];
        const tile = Arcade.h('div', { class: 'ar-tile' + (rec ? '' : ' unknown'), 'data-species': sp.id, style: rec ? '' : 'background:#e9eef3' },
          `<div class="pic"><img alt="" src="${fishThumb(sp, !!rec)}" style="width:100%;height:70px;object-fit:contain"></div>` +
          `<div style="font-size:15px">${rec ? sp.name : '???'}</div>` +
          `<div class="meta">${Arcade.starsHTML(R.stars, R.stars).replace(/<svg/g, '<svg style="width:16px;height:16px"')}</div>` +
          `<div class="meta">${rec ? `×${rec.n} · best ${rec.best} cm` : '&nbsp;'}</div>`);
        grid.appendChild(tile);
      }
      p.appendChild(grid);
    }
    const btns = Arcade.h('div', { class: 'ar-btns' });
    const back = Arcade.h('button', { type: 'button', class: 'ar-btn big' }, `${icons.menu}<span>Back</span>`);
    back.addEventListener('click', () => { Arcade.sfx('click'); g.menu(); });
    btns.appendChild(back);
    p.appendChild(btns);
    g.panel(p);
  }

  function bookIcon() {
    return `<svg viewBox="0 0 48 48"><path d="M6 10 Q16 6 24 12 Q32 6 42 10 V40 Q32 36 24 42 Q16 36 6 40 Z" fill="#fff" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><path d="M24 12 V42" stroke="#2b2b2b" stroke-width="3"/><g transform="translate(5 14) scale(0.45)">${fishSvg('#ff8c42')}</g></svg>`;
  }
  function rodIcon(r) {
    const col = r.rainbow ? 'url(#rb)' : r.color;
    return `<svg viewBox="0 0 100 70"><defs><linearGradient id="rb"><stop offset="0" stop-color="#ef476f"/><stop offset="0.33" stop-color="#ffd166"/><stop offset="0.66" stop-color="#06d6a0"/><stop offset="1" stop-color="#9b5de5"/></linearGradient></defs>` +
      `<path d="M14 62 Q50 40 86 8" fill="none" stroke="#2b2b2b" stroke-width="10" stroke-linecap="round"/><path d="M14 62 Q50 40 86 8" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round"/>` +
      `<circle cx="28" cy="58" r="8" fill="#dfe7ef" stroke="#2b2b2b" stroke-width="3"/><path d="M86 8 Q92 30 90 44" fill="none" stroke="#2b2b2b" stroke-width="1.5"/><circle cx="90" cy="48" r="5" fill="#ef476f" stroke="#2b2b2b" stroke-width="2"/></svg>`;
  }
  function rodStats(r) {
    if (r.id === 'twig') return 'a good start';
    return 'bigger green, longer cast';
  }

  function extraMenu(g) {
    checkUnlocks(g);
    const wrap = Arcade.h('div');
    const btns = Arcade.h('div', { class: 'ar-btns' });
    const bb = Arcade.h('button', { class: 'ar-btn pink big book-btn', type: 'button' }, `${bookIcon()}<span>Fish Book</span>`);
    bb.addEventListener('click', () => { Arcade.sfx('click'); openBook(g); });
    btns.appendChild(bb);
    wrap.appendChild(btns);
    wrap.appendChild(Arcade.h('h2', { class: 'ar-title', style: 'font-size:24px;margin-top:16px' }, 'Pick your rod'));
    const row = Arcade.h('div', { class: 'ar-grid rods' });
    const current = pickedRod(g).id;
    for (const r of RODS) {
      const ok = rodUnlocked(g, r);
      const tile = Arcade.h('button', { type: 'button', 'data-rod': r.id, class: 'ar-tile' + (ok ? '' : ' locked') + (r.id === current ? ' picked' : '') },
        `<div class="pic">${rodIcon(r)}</div><div>${r.name}</div><div class="meta">${ok ? rodStats(r) : r.need}</div>` + (ok ? '' : `<div class="lock">${icons.lock}</div>`));
      tile.addEventListener('click', () => {
        if (!ok) { Arcade.sfx('bonk'); return; }
        Arcade.sfx('click');
        g.save.data.rod = r.id; g.store();
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
  Arcade.start({
    id: 'fishing',
    title: 'Fishing Frenzy',
    view: { w: W, h: H },
    background: '#8fd3ff',
    music: 'calm',
    levelsTitle: 'Where shall we fish?',
    howTo: [
      { pic: S(`<rect x="8" y="30" width="64" height="20" rx="10" fill="#fff" stroke="#2b2b2b" stroke-width="4"/><rect x="10" y="32" width="40" height="16" rx="8" fill="#06d6a0"/><path d="M40 70 V58 M34 62 L40 56 L46 62" stroke="#2b2b2b" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`), text: 'Hold, then let go to cast', keys: 'Hold Space / finger' },
      { pic: S(`<path d="M0 44 Q20 38 40 44 T80 44 V80 H0 Z" fill="#4cc9f0" stroke="#2b2b2b" stroke-width="3"/><path d="M28 40 A12 12 0 0 1 52 40 Z" fill="#ef476f" stroke="#2b2b2b" stroke-width="3"/><path d="M28 40 A12 12 0 0 0 52 40 Z" fill="#fff" stroke="#2b2b2b" stroke-width="3" opacity="0.6"/><text x="40" y="24" text-anchor="middle" font-size="26" font-weight="900" fill="#ef476f" stroke="#2b2b2b" stroke-width="1.5">!</text>`), text: 'Wait for the big dip and "!" — then tap!', keys: 'Little bobs are fake-outs' },
      { pic: S(`<rect x="6" y="34" width="68" height="16" rx="8" fill="#bde0fe" stroke="#2b2b2b" stroke-width="4"/><rect x="26" y="36" width="28" height="12" fill="#06d6a0"/><rect x="58" y="36" width="12" height="12" fill="#ef476f"/><path d="M40 56 L34 66 H46 Z" fill="#fff" stroke="#2b2b2b" stroke-width="3"/>`), text: 'Hold to reel, let go to rest. Stay in the green!' },
      { pic: S(`<path d="M10 14 Q26 8 40 18 Q54 8 70 14 V66 Q54 60 40 70 Q26 60 10 66 Z" fill="#fff" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><g transform="translate(10 18) scale(0.75)">${fishSvg('#ffd166')}</g>`), text: 'Fill your Fish Book, then let them swim!' },
      { pic: S(`<path d="M40 70 V40 M28 52 L40 40 L52 52" stroke="#2b2b2b" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M40 10 V30 M28 18 L40 30 L52 18" stroke="#2b2b2b" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>`), text: 'Drag or use Up/Down to fish deeper', keys: 'Deep fish are rarer' },
    ],
    buttons: {
      left: [{ id: 'ArrowUp', icon: icons.up, label: 'Lure up' }, { id: 'ArrowDown', icon: icons.down, label: 'Lure down' }],
      right: [{ id: 'Space', icon: icons.fire, label: 'Cast / Reel' }],
    },
    levels,
    extraMenu,
    setup,
    update,
    draw: render,
  });
})();
