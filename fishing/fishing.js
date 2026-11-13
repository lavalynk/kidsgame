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
//     little. These are fake-outs! Tapping now scares the fish away
//     (not on Easy; on Normal a fish forgives one early tap).
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
//
// More to do (Nov 13, Keith): every catch gives SHELLS; spend them in the
// Shell Shop on bait and things for your AQUARIUM; each place has 8 GOALS.
// Those live in fishing/aquarium.js (window.FishExtras, "X" below).
// =====================================================================
(function () {
  const { draw, icons, math } = Arcade;
  const D = draw;
  const X = window.FishExtras;          // shells, bait, shop, aquarium, goals (aquarium.js)
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
  const GOAL_BOX = { x: 556, y: 14, w: 190, h: 54 };   // relax mode: the goal picture (aquarium.js)
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
  let loc, locId, mode, rod, bait, phase;
  let fish, bobber, power, charge, gesture, card, popups, ripples, bubbles, flakes, sparkles, released;
  let tension, catchProgress, redTime, burst, hooked, reelTick, nib, biteT;
  let rodA, spawnT, goldenT, bonusT, timeLeft, score, caughtCount, stats, prevSpace, ended, lastCatch;
  let nextId = 1;
  let nowT = 0;          // g.time, for drawings that bob along (the rowboat)
  let overtime = 0;      // Friends: seconds spent reeling after the clock ran out
  let goalFlash = null;  // seconds since a goal was finished (the goal picture glows)
  let bot = false;       // test hook: the game plays itself (__fishingBot)

  // ---------------------------------------------------------------
  // Friends (Keith's plan, point 3): fishing together on several phones.
  // Everyone fishes the same place for the same 90 seconds (after a shared
  // 3, 2, 1, GO!). Each catch is told to the others; the RAREST fish wins
  // (more rarity stars first, then the bigger fish). Little chips at the top
  // show every friend's best fish so far.
  // ---------------------------------------------------------------
  const party = () => Arcade.net && Arcade.net.party;
  let friendsGame = false, countdown = 0, goT = 0;
  let friendBest = {};          // seat -> { sp: species id or null, cm, n: fish caught, done }
  let fWired = false;
  const peerOf = (seat) => Object.assign({ pet: 'cat', color: '#4cc9f0', name: '' }, (party() && party().peers[seat]) || {});
  // how good a catch is: rarity stars first, then size (same rule as "best fish" in the results)
  const fishValue = (spId, cm) => spId && SP[spId] ? RARITY[SP[spId].rarity].stars * 1000 + cm : -1;
  // each friend's animal face as a picture we can draw on the canvas (made once per look)
  const avatarPics = {};
  function avatarPic(who) {
    const key = who.pet + who.color;
    if (!avatarPics[key]) {
      let svg = Arcade.profiles.avatar(who);
      if (!/xmlns=/.test(svg)) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      avatarPics[key] = img;
    }
    return avatarPics[key];
  }
  function friendsMenu(g) {
    if (!party()) return;
    if (!fWired) {
      fWired = true;
      // a friend caught a fish (or their clock ran out): remember their best one
      party().on('score', (m) => {
        const before = friendBest[m.from];
        friendBest[m.from] = { sp: m.sp || null, cm: m.cm || 0, n: m.n || 0, done: !!m.done };
        if (!friendsGame || ended) return;
        // a rare (or better) catch gets a little shout-out in the friend's color
        if (m.sp && SP[m.sp] && (!before || before.sp !== m.sp || before.cm !== m.cm)) {
          const R = RARITY[SP[m.sp].rarity];
          if (R.stars >= 3) { popup((peerOf(m.from).name || 'Friend') + ': ' + R.label, W / 2, 150, peerOf(m.from).color, 30); g.sfx('coin'); }
        }
      });
      party().on('leave', (m) => { delete friendBest[m.from]; });
    }
    party().menu(g, {
      // the room maker picks the place (all three, so nobody is left out)
      choices: LOC_ORDER.map(id => ({ id, name: LOCS[id].name, pic: locPic(id, false) })),
      onStart: (id) => g.play({ id: 'fr-' + id, loc: LOCS[id] ? id : 'pond', mode: 'timed', friends: true, pick: id, name: 'Friends' }),
      onBack: () => g.menu(),
    });
  }
  // tell the others how I'm doing (my best fish + how many I caught)
  function tellFriends(done) {
    if (!friendsGame || !party()) return;
    party().tell({ t: 'score', sp: stats.best ? stats.best.sp.id : null, cm: stats.best ? stats.best.cm : 0, n: caughtCount, done: !!done });
  }

  function setup(g, level) {
    const lv = level || { id: 'pond-relax', loc: 'pond', mode: 'relax' };
    locId = lv.loc; loc = LOCS[locId]; mode = lv.mode;
    friendsGame = !!lv.friends;
    countdown = friendsGame ? 3.2 : 0; goT = 0;
    if (friendsGame) friendBest = {};
    rod = pickedRod(g);
    bait = X.bait(g);
    goalFlash = null;
    document.body.style.setProperty('--ar-bg', loc.bg);
    phase = 'idle';
    fish = []; popups = []; ripples = []; bubbles = []; sparkles = []; released = [];
    flakes = [];
    if (locId === 'ice') for (let i = 0; i < 40; i++) flakes.push({ x: Math.random() * W, y: Math.random() * WATER, s: math.rand(2, 5), v: math.rand(14, 30) });
    bobber = null; power = 0; charge = null; gesture = null; card = null;
    tension = 0.45; catchProgress = 0; redTime = 0; burst = 0; hooked = null; reelTick = 0; nib = null; biteT = 0;
    rodA = -1.0; spawnT = 0; bonusT = 0;
    goldenT = (mode === 'timed' ? math.rand(22, 45) : math.rand(40, 80)) / (bait.gold || 1);
    timeLeft = TIMED_SECONDS; overtime = 0; score = 0; caughtCount = 0; ended = false; lastCatch = null;
    stats = { catches: 0, early: 0, late: 0, snaps: 0, newKinds: 0, best: null, bonus: 0, shells: 0, goals: 0 };
    prevSpace = false;
    // start with some fish already swimming around
    for (let i = 0; i < 6; i++) spawnFish(g, math.rand(260, W - 40));
    checkUnlocks(g);

    // ---- test hooks (used by the automated tests) ----
    window.__fishingState = () => ({
      phase, mode, loc: locId, rod: rod.id, difficulty: g.difficulty, friends: friendsGame, countdown, ended,
      friendBest: JSON.parse(JSON.stringify(friendBest)), best: stats.best && { species: stats.best.sp.id, cm: stats.best.cm },
      bobber: bobber && { x: bobber.x, y: bobber.y, lureY: bobber.lureY, lureTarget: bobber.lureTarget, dip: bobber.dip },
      fish: fish.map(f => ({ id: f.id, species: f.sp.id, rarity: f.sp.rarity, x: f.x, y: f.y, state: f.state })),
      hooked: hooked && hooked.sp.id,
      tension, catchProgress, greenZone: greenZone(g), redTime,
      bursting: burst > 0, biteT, nibblesLeft: nib ? nib.left : 0,
      caught: caughtCount, score, timeLeft, bonusT, stats,
      book: JSON.parse(JSON.stringify(book(g))),
      card: card && { species: card.sp.id, cm: card.cm, isNew: card.isNew, shells: card.shells, goal: !!card.goal },
      unlocked: g.save.unlocked.slice(),
      shells: X.shells(g), bait: bait.id, goal: X.goal(g, locId) && { i: X.goal(g, locId).i, n: X.goal(g, locId).n, def: X.goal(g, locId).def },
    });
    // the game plays itself (cast, wait, tap on the bite, keep the needle in the green)
    window.__fishingBot = (on) => { bot = on !== false; };
    window.__fishingTest = {
      // put a golden fish right next to the lure (or in the water)
      spawnGolden: () => { const f = spawnFish(g, bobber ? bobber.x + 120 : 500, SP.golden); if (bobber) f.y = f.baseY = bobber.lureY; return f.id; },
      startBonus: () => startBonus(g),
      setTime: (t) => { timeLeft = t; },
      // land a fish of this kind right away (skips casting and reeling)
      catchNow: (id, cm) => { const f = makeFish(SP[id] || SP.golden, REEL_TO.x, REEL_TO.y, 1); if (cm) f.cm = cm; fish.push(f); phase = 'reeling'; landFish(g, f); },
      shells: (n) => { g.save.data.shells = n; g.store(); },
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
    const w = Math.min(0.62, g.pick(0.5, 0.4, 0.3) * (rod ? rod.zone : 1));
    return [0.5 - w / 2, 0.5 + w / 2];
  }
  const RED = 0.86;   // above this the line is in the red

  // (local = inside the bobbing boat's drawing, so without the bob)
  function rodTip(local) {
    let x = HANDS.x + Math.cos(rodA) * ROD_LEN, y = HANDS.y + Math.sin(rodA) * ROD_LEN + (local ? 0 : boatBob());
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
  // (The Shrimp Snack bait makes rare + legendary fish come more often.)
  function randomSpecies() {
    const list = SPECIES.filter(s => s.loc === locId);
    const more = (bait && bait.more) || {};
    const wt = s => RARITY[s.rarity].weight * (more[s.rarity] || 1);
    let total = 0;
    for (const s of list) total += wt(s);
    let r = Math.random() * total;
    for (const s of list) { r -= wt(s); if (r <= 0) return s; }
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
  // The music follows the fishing: quiet while you wait for a nibble, all-out while reeling.
  const PHASE_ENERGY = { waiting: 0.4, nibble: 0.4, bite: 1, reeling: 2 };
  let musicPhase = null;
  function update(g, dt) {
    nowT = g.time;
    if (phase !== musicPhase) { musicPhase = phase; g.music.mood({ energy: PHASE_ENERGY[phase] != null ? PHASE_ENERGY[phase] : 1 }); }
    const inp = g.input, ptr = inp.pointer;
    // --- read input once: a "press" and "release" from pointer or Space ---
    const spaceDown = inp.down('Space');
    const spaceHit = inp.hit('Space');
    const spacePressed = spaceHit || (spaceDown && !prevSpace);
    const spaceReleased = (!spaceDown && prevSpace) || (spaceHit && !spaceDown);
    prevSpace = spaceDown;
    const onDone = mode === 'relax' && ptr.justDown && inBox(ptr, DONE_BTN);
    const ptrPressed = ptr.justDown && !onDone;
    let pressed = ptrPressed || spacePressed;
    let holding = ptr.down || spaceDown;
    let botLetGo = false;
    if (bot) {
      // the test bot: press to cast, let go at about half power, tap on the bite,
      // reel while the needle is left of the middle of the green, tap the card away
      const [lo, hi] = greenZone(g);
      pressed = (phase === 'idle') || phase === 'bite' || (phase === 'caught' && card && card.t > 0.9);
      holding = phase === 'reeling' && tension < (lo + hi) / 2;
      botLetGo = phase === 'charging' && charge && charge.t > 0.25 && power > 0.45;
    }
    if (goalFlash != null) goalFlash += dt;

    // --- Friends: 3, 2, 1, GO! on every phone at once (no casting before GO) ---
    if (countdown > 0) {
      const before = Math.ceil(countdown - 0.2);
      countdown -= dt;
      const n = Math.ceil(countdown - 0.2);
      if (n !== before && n >= 1) g.sfx('beep');
      if (countdown <= 0) { countdown = 0; goT = 0.9; g.sfx('go'); }
      pressed = false; holding = false;
    }
    if (goT > 0) goT -= dt;

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
    if (mode === 'timed' && (phase !== 'caught' || friendsGame) && !ended && countdown <= 0) timeLeft = Math.max(0, timeLeft - dt);
    if (bonusT > 0) {
      bonusT -= dt;
      if (bonusT <= 0) { bonusT = 0; popup('Frenzy over!', W / 2, 150, '#ffd166', 34); }
      if (Math.random() < dt * 14) sparkles.push({ x: Math.random() * W, y: math.rand(WATER, FLOOR), t: 0, life: 0.8, c: '#ffe066' });
    }
    goldenT -= dt;
    if (goldenT <= 0) {
      goldenT = (mode === 'timed' ? math.rand(30, 55) : math.rand(50, 95)) / (bait.gold || 1);   // Glitter Bait: more often
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
        if (pressed) { phase = 'charging'; charge = { t: 0, src: bot ? 'bot' : ptrPressed ? 'ptr' : 'key' }; power = 0; g.sfx('click'); }
        break;

      case 'charging': {
        // the power meter swings up and down: 0 -> 1 -> 0 ...
        charge.t += dt;
        const period = g.pick(2.6, 1.9, 1.5);
        const ph = (charge.t / period) % 1;
        power = ph < 0.5 ? ph * 2 : 2 - ph * 2;
        if (g.difficulty === 'easy') power = Math.min(1, power * 1.08);   // easy: lingers at the top
        const let_go = charge.src === 'bot' ? botLetGo : charge.src === 'ptr' ? !ptr.down : !spaceDown;
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
          // (Nov 13, Keith: a little easier.) On Easy an early tap never scares the fish;
          // on Normal each fish forgives one early tap. It just says "Wait..."
          if (g.difficulty === 'easy' || (g.difficulty === 'normal' && !hooked.forgave)) {
            hooked.forgave = true;
            popup('Wait...', bobber.x, WATER - 50, '#ffd166');
            g.tone(520, 0.08, { type: 'sine', vol: 0.15 });
            break;
          }
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
    // Friends: a fish on the line gets 5 more seconds to come in, then everyone's results show together
    if (friendsGame && timeLeft <= 0 && !ended && (phase === 'nibble' || phase === 'bite' || phase === 'flying')) { hooked = null; nib = null; bobber = null; phase = 'idle'; endRound(g); }
    if (friendsGame && !ended && phase === 'reeling' && timeLeft <= 0) { overtime += dt; if (overtime > 5) { if (hooked) hooked.state = 'flee'; hooked = null; bobber = null; phase = 'idle'; endRound(g); } }
    if (friendsGame && !ended && phase === 'caught' && timeLeft <= 0 && card && card.t > 1.4) { releaseFish(g); endRound(g); }
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
    const keen = bait.keen || 1;   // Berry Bait: fish notice it from farther away and come sooner
    const noticeX = g.pick(260, 210, 180) * keen + (isBonus() ? 200 : 0);
    const noticeY = g.pick(120, 95, 75) * Math.min(1.3, keen) + (isBonus() ? 60 : 0);

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
            const chance = R.bold * g.pick(1.6, 1.3, 1.0) * keen * (bobber.jiggle > 0 ? 2 : 1) * (isBonus() ? 5 : 1);
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
    let n = g.pick(Math.random() < 0.5 ? 0 : 1, Math.floor(Math.random() * 3), 1 + Math.floor(Math.random() * 3));   // (Nov 13: fewer fake-outs)
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
    biteT = g.pick(2.0, 1.3, 0.85) * (rod.rainbow ? 1.15 : 1) + (isBonus() ? 0.3 : 0);
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
    const pull = R.pull * g.pick(0.4, 0.75, 1.0);

    // hold = reel (tension up), let go = slack (tension down)
    if (holding) tension += 0.8 * dt;
    else tension -= 1.4 * dt;
    if (burst > 0) tension += pull * 1.05 * dt;
    if (g.difficulty === 'easy') tension += (0.5 - tension) * 0.6 * dt;   // easy: gently helps you
    tension = math.clamp(tension, 0, g.difficulty === 'easy' ? 0.97 : 1);

    // reel ticks while holding
    if (holding) { reelTick -= dt; if (reelTick <= 0) { g.sfx('tick'); reelTick = 0.09; } }

    // fill the catch meter in the green
    const rate = rod.reel * g.pick(1.5, 1.2, 1.0) / (3.4 + R.stars * 0.8);
    if (tension >= lo && tension <= hi) catchProgress += rate * dt;
    else if (tension < lo) catchProgress -= 0.05 * dt;       // slack: the fish swims out a little
    catchProgress = math.clamp(catchProgress, 0, 1);

    // too much tension for too long = the line snaps (not on Easy)
    if (tension > RED) redTime += dt; else redTime = Math.max(0, redTime - dt * 0.6);
    const snapAfter = g.pick(Infinity, 2.6, 1.7);
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
    g.music.stinger('treasure');
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
    if (Arcade.daily) Arcade.daily.add('fishing', 'fish', 1);   // a "catch fish" daily surprise
    g.achieve('first');
    if ((g.save.data.total || 0) >= 50) g.achieve('fifty');
    if (kindsFound(g) >= SPECIES.length) g.achieve('book');
    if (f.sp.rarity === 'rare' || f.sp.rarity === 'legendary') g.achieve('rare');
    if (isNew) stats.newKinds++;
    if (!stats.best || R.stars * 1000 + f.cm > RARITY[stats.best.sp.rarity].stars * 1000 + stats.best.cm) stats.best = { sp: f.sp, cm: f.cm };
    // shells (the shop money): rarer = more, a new kind +3, Frenzy doubles
    const sh = (X.SHELLS[f.sp.rarity] + (isNew ? 3 : 0)) * (isBonus() ? 2 : 1);
    X.addShells(g, sh);
    stats.shells += sh;
    // goals (not in Friends rounds): did this catch finish the place's goal?
    const goalDone = !friendsGame && goalCheck(g, f.sp, f.cm);
    tellFriends(false);
    g.store();
    card = { sp: f.sp, cm: f.cm, scale: f.scale, isNew, bestSize: bestSize && !isNew, pts, shells: sh + (goalDone ? goalDone.reward : 0), goal: goalDone, t: 0, bonus: isBonus() };
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

  // Goals (aquarium.js): finishing one = shells + a big "Goal!" + the goal picture glows.
  function goalCheck(g, sp, cm) {
    const done = X.progress(g, locId, FishGame, sp, cm);
    if (!done) return null;
    stats.goals++;
    stats.shells += done.reward;
    goalFlash = 0;
    g.achieve('goal1', 'First goal!');
    if (!X.goal(g, locId)) g.achieve('goals-' + locId, 'All goals!');
    if (LOC_ORDER.every(l => !X.goal(g, l))) g.achieve('goalsall');
    // the catch card shows a GOAL! badge; the goal picture at the top glows; a cheer
    setTimeout(() => { if (ended) return; g.sfx('win'); g.music.stinger('streak'); }, 300);
    return done;
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
    if (friendsGame) { tellFriends(true); friendsResults(g, 0); return; }
    if (mode === 'timed') {
      const th = [55, 130, 230].map(v => Math.round(v * g.pick(0.5, 0.8, 1.05)));
      const stars = score >= th[2] ? 3 : score >= th[1] ? 2 : score >= th[0] ? 1 : 0;
      if (score >= 600) g.save.data.bigScore = true;
      g.finish({
        win: stars > 0, score, stars,
        title: stars === 3 ? 'Fish champion!' : stars > 0 ? 'Great fishing!' : 'Nice try!',
        lines: [`Fish caught: ${caughtCount}`, best, shellLine(), stars < 3 ? `Next star at ${th[stars]} points` : ''].filter(Boolean),
        next: stars > 0, delay: 1000,
      });
    } else {
      const stars = caughtCount >= 8 ? 3 : caughtCount >= 4 ? 2 : caughtCount >= 1 ? 1 : 0;
      g.finish({
        win: caughtCount > 0, score, stars,
        title: caughtCount ? 'Lovely fishing!' : 'See you soon!',
        lines: [`Fish caught: ${caughtCount}`, stats.newKinds ? `New kinds: ${stats.newKinds}` : '', best, shellLine(), stats.goals ? `Goals: ${stats.goals}` : '', `Fish Book: ${kindsFound(g)} / ${SPECIES.length}`].filter(Boolean),
        delay: 300,
      });
    }
  }

  // "+12 shells" with a shell picture (results screen)
  function shellLine() { return stats.shells ? `${X.shellSvg(28)} +${stats.shells}` : ''; }

  // Friends results: wait (up to 6 s) for everyone's last catch, then show the
  // list: everyone's best fish, rarest first, with their animal face.
  function friendsResults(g, waited) {
    const waiting = Object.values(friendBest).some(b => !b.done);
    if ((waiting && waited < 6) || g.state === 'paused') {
      setTimeout(() => { if ((g.state === 'play' || g.state === 'paused') && friendsGame) friendsResults(g, waited + 0.25); }, 250);
      return;
    }
    const mine = { who: Arcade.profiles.active(), sp: stats.best ? stats.best.sp.id : null, cm: stats.best ? stats.best.cm : 0, n: caughtCount, mine: true };
    const all = [mine].concat(Object.keys(friendBest).map(k => Object.assign({ who: peerOf(k) }, friendBest[k])))
      .sort((a, b) => (fishValue(b.sp, b.cm) - fishValue(a.sp, a.cm)) || (b.n - a.n));
    const top = all[0];
    const tie = all.length > 1 && fishValue(all[1].sp, all[1].cm) === fishValue(top.sp, top.cm) && all[1].n === top.n;
    const iWon = top.mine || (tie && fishValue(mine.sp, mine.cm) === fishValue(top.sp, top.cm) && mine.n === top.n);
    const starIcon = '<span style="color:#ffd166;-webkit-text-stroke:1.5px #2b2b2b">★</span>';
    const rows = all.map((r, i) => {
      const sp = r.sp && SP[r.sp];
      const fishPic = sp ? `<svg viewBox="0 0 60 60" style="width:56px;height:56px">${fishSvg(sp.body)}</svg>` : '<span style="display:inline-block;width:56px">–</span>';
      const stars = sp ? starIcon.repeat(RARITY[sp.rarity].stars) : '';
      return `<div style="display:flex;align-items:center;gap:8px;justify-content:center;margin:4px 0">` +
        `<span style="font-size:24px;width:36px">${i + 1}.</span>` +
        `<span style="width:52px;height:52px;display:inline-block;border-radius:50%;overflow:hidden;border:4px solid #2b2b2b;${r.mine ? 'box-shadow:0 0 0 4px #ffd166' : ''}">${Arcade.profiles.avatar(r.who)}</span>` +
        `${fishPic}<span style="font-size:22px;min-width:96px;text-align:left">${stars}</span>` +
        `<span style="font-size:20px;min-width:70px">${sp ? r.cm + ' cm' : ''}</span></div>`;
    }).join('');
    if (caughtCount) g.achieve('first');
    g.finish({
      win: true, score, stars: iWon ? 3 : caughtCount ? 2 : 1,
      title: iWon ? (tie ? 'A tie!' : 'Rarest fish!') : 'Great fishing!', lines: [rows], delay: 300,
      buttons: [{ icon: Arcade.icons.again, label: 'Again', cls: 'big', onClick: () => party().start(locId) },
        { icon: Arcade.net.FRIENDS_PIC, label: 'Friends', cls: 'blue', onClick: () => friendsMenu(g) }],
    });
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
    if (!sil) {
      // fin lines (a darker fin color), so the tail looks see-through and soft
      ctx.strokeStyle = shade(sp.fin, -0.28); ctx.lineWidth = Math.max(1.5, lw * 0.45);
      const reach = sp.tail === 'fork' ? 0.75 : 0.9;
      ctx.beginPath();
      for (const k of [-0.5, 0, 0.5]) { ctx.moveTo(0, k * th * 0.15); ctx.lineTo(-tl * reach, k * th * (sp.tail === 'fork' ? 0.9 : 0.7)); }
      ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = lw;
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
    if (!sil && !round) {
      ctx.strokeStyle = shade(sp.fin, -0.28); ctx.lineWidth = Math.max(1.5, lw * 0.45);
      ctx.beginPath();
      const top = tall ? -b * 1.55 : -b * 1.15;
      for (const k of [-0.25, 0, 0.2]) { ctx.moveTo(ra * k, -b * 0.8); ctx.lineTo(ra * (k - 0.12), top + Math.abs(k) * b * 0.5); }
      ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.fillStyle = col(sp.fin);
    }
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
      // a darker back (fish are darker on top), soft scales and a shiny stripe
      ctx.globalAlpha = 0.35; ctx.fillStyle = shade(sp.body, -0.35);
      ctx.beginPath(); ctx.ellipse(-ra * 0.05, -b * 1.05, ra * 1.15, b * 0.55, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      if (!sp.pattern && L > 50) {
        ctx.strokeStyle = 'rgba(43,43,43,0.16)'; ctx.lineWidth = Math.max(1.5, lw * 0.5);
        for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
          ctx.beginPath(); ctx.arc(-ra * (0.1 + c * 0.24) - (r % 2) * ra * 0.12, -b * 0.15 + r * b * 0.38, b * 0.17, -Math.PI / 2, Math.PI / 2); ctx.stroke();
        }
      }
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.ellipse(ra * 0.05, -b * 0.55, ra * 0.42, Math.max(1.5, b * 0.1), -0.06, 0, Math.PI * 2); ctx.fill();
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
  // Drawing: the scene (Nov 13: redrawn, Keith asked for better water + boat)
  //
  // The parts that never move (sky colors, hills, mountains, the water body,
  // the lake bottom with rocks and a sunken log / anchor) are painted ONCE per
  // place into hidden canvases (`layers()`), then just copied to the screen
  // every frame. Only moving things (clouds, waves, plants, light) are drawn live.
  // ---------------------------------------------------------------
  // a color a bit darker (k < 0) or lighter (k > 0)
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const mix = (c) => Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k);
    const r = mix(n >> 16), gg = mix((n >> 8) & 255), b = mix(n & 255);
    return '#' + ((1 << 24) | (r << 16) | (gg << 8) | b).toString(16).slice(1);
  }
  const layerCache = {};
  function layers() {
    if (!layerCache[locId]) {
      const make = (h, fn) => { const c = document.createElement('canvas'); c.width = W; c.height = h; fn(c.getContext('2d')); return c; };
      layerCache[locId] = { sky: make(WATER + 14, paintSky), under: make(H, paintUnder) };
    }
    return layerCache[locId];
  }

  // ---- painted once: the sky and the far shore ----
  function paintSky(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, WATER);
    sky.addColorStop(0, loc.sky[0]); sky.addColorStop(1, loc.sky[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, WATER + 14);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const soft = 'rgba(43,43,43,0.3)';
    if (locId === 'pond') {
      // far hills (pale), near hills, round trees, a little red barn far away
      ctx.lineWidth = 3; ctx.strokeStyle = soft;
      ctx.fillStyle = '#b5e3a8';
      ctx.beginPath(); ctx.moveTo(240, WATER); ctx.quadraticCurveTo(330, 120, 470, 150); ctx.quadraticCurveTo(620, 100, 740, 140); ctx.quadraticCurveTo(860, 110, 960, 130); ctx.lineTo(960, WATER); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8bd17c';
      ctx.beginPath(); ctx.moveTo(250, WATER); ctx.quadraticCurveTo(420, 120, 600, WATER - 10); ctx.quadraticCurveTo(760, 130, 960, WATER - 22); ctx.lineTo(960, WATER); ctx.closePath(); ctx.fill(); ctx.stroke();
      // the barn
      D.box(ctx, 650, WATER - 52, 40, 30, 3, '#ef476f', 3);
      ctx.beginPath(); ctx.moveTo(645, WATER - 50); ctx.lineTo(670, WATER - 70); ctx.lineTo(695, WATER - 50); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = INK; ctx.stroke();
      D.box(ctx, 663, WATER - 40, 14, 18, 2, '#fff', 2.5);
      // round trees (trunk + two-tone crown)
      for (const [x, s] of [[430, 1], [480, 0.8], [530, 1.1], [800, 0.9], [835, 0.7]]) {
        D.box(ctx, x - 5 * s, WATER - 48 * s, 10 * s, 40 * s, 3, '#8b5a2b', 3);
        D.circle(ctx, x, WATER - 64 * s, 24 * s, '#4caf50', 3);
        D.circle(ctx, x - 7 * s, WATER - 71 * s, 9 * s, '#6fcf6a', 0);
      }
    } else if (locId === 'pier') {
      // the sea all the way to the horizon, an island with a lighthouse
      ctx.fillStyle = '#7fd8f0'; ctx.fillRect(250, WATER - 24, W, 24);
      ctx.strokeStyle = soft; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(250, WATER - 24); ctx.lineTo(W, WATER - 24); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
      for (const [x, y, w] of [[300, 10, 40], [420, 16, 60], [600, 8, 50], [700, 18, 30]]) { ctx.beginPath(); ctx.moveTo(x, WATER - 24 + y); ctx.lineTo(x + w, WATER - 24 + y); ctx.stroke(); }
      ctx.strokeStyle = soft; ctx.lineWidth = 3;
      ctx.fillStyle = '#f7d488'; ctx.beginPath(); ctx.ellipse(850, WATER - 22, 95, 18, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8bd17c'; ctx.beginPath(); ctx.ellipse(880, WATER - 34, 40, 10, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
      // lighthouse: white with red stripes, a yellow light, a dark cap
      ctx.beginPath(); ctx.moveTo(834, WATER - 32); ctx.lineTo(842, WATER - 104); ctx.lineTo(862, WATER - 104); ctx.lineTo(870, WATER - 32); ctx.closePath();
      ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      ctx.save(); ctx.clip(); ctx.fillStyle = '#ef476f'; ctx.fillRect(830, WATER - 84, 44, 12); ctx.fillRect(830, WATER - 58, 44, 12); ctx.restore();
      ctx.beginPath(); ctx.moveTo(834, WATER - 32); ctx.lineTo(842, WATER - 104); ctx.lineTo(862, WATER - 104); ctx.lineTo(870, WATER - 32); ctx.closePath(); ctx.stroke();
      D.box(ctx, 840, WATER - 122, 24, 20, 4, '#ffd166', 3);
      ctx.beginPath(); ctx.moveTo(836, WATER - 122); ctx.lineTo(852, WATER - 136); ctx.lineTo(868, WATER - 122); ctx.closePath(); ctx.fillStyle = '#3a86ff'; ctx.fill(); ctx.stroke();
    } else {
      // northern lights ribbons, snowy mountains, pine trees
      for (const [y, c] of [[40, 'rgba(114,239,221,0.35)'], [66, 'rgba(199,125,255,0.25)']]) {
        ctx.strokeStyle = c; ctx.lineWidth = 18;
        ctx.beginPath(); ctx.moveTo(260, y + 20); ctx.bezierCurveTo(420, y - 30, 560, y + 40, 700, y); ctx.bezierCurveTo(800, y - 20, 880, y + 10, 960, y - 10); ctx.stroke();
      }
      ctx.lineWidth = 3; ctx.strokeStyle = soft;
      for (const [x, w, h, c] of [[520, 260, 100, '#b9cbe6'], [420, 220, 120, '#9fb7d9'], [640, 260, 150, '#9fb7d9'], [850, 240, 110, '#9fb7d9']]) {
        ctx.beginPath(); ctx.moveTo(x - w / 2, WATER); ctx.lineTo(x, WATER - h); ctx.lineTo(x + w / 2, WATER); ctx.closePath();
        ctx.fillStyle = c; ctx.fill(); ctx.stroke();
        // snow cap with a wavy edge
        ctx.beginPath(); ctx.moveTo(x - w * 0.14, WATER - h * 0.72); ctx.lineTo(x, WATER - h); ctx.lineTo(x + w * 0.14, WATER - h * 0.72);
        ctx.lineTo(x + w * 0.07, WATER - h * 0.66); ctx.lineTo(x, WATER - h * 0.74); ctx.lineTo(x - w * 0.07, WATER - h * 0.66); ctx.closePath();
        ctx.fillStyle = '#fff'; ctx.fill();
      }
      for (const [x, s] of [[330, 1], [365, 0.8], [700, 1.1], [735, 0.8], [905, 1], [940, 0.85]]) {
        D.box(ctx, x - 4 * s, WATER - 12 * s, 8 * s, 12 * s, 2, '#8b5a2b', 2);
        for (let k = 0; k < 3; k++) {
          const ty = WATER - 10 * s - k * 16 * s, tw = (20 - k * 5) * s;
          ctx.beginPath(); ctx.moveTo(x - tw, ty); ctx.lineTo(x, ty - 26 * s); ctx.lineTo(x + tw, ty); ctx.closePath();
          ctx.fillStyle = '#2d6a4f'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x - tw * 0.4, ty - 15 * s); ctx.lineTo(x, ty - 26 * s); ctx.lineTo(x + tw * 0.4, ty - 15 * s); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
        }
      }
    }
  }

  // ---- painted once: the water body and the bottom of the lake / sea ----
  function paintUnder(ctx) {
    // deep water gets darker; a soft lighter band near the top
    const grad = ctx.createLinearGradient(0, WATER, 0, FLOOR);
    grad.addColorStop(0, shade(loc.water[0], 0.18)); grad.addColorStop(0.18, loc.water[0]);
    grad.addColorStop(0.65, shade(loc.water[0], -0.15) ); grad.addColorStop(1, loc.water[1]);
    ctx.fillStyle = grad; ctx.fillRect(0, WATER - 10, W, H);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // a far-away slope at the back of the bottom (lighter, no outline)
    ctx.fillStyle = shade(loc.water[1], 0.22);
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, FLOOR - 26 + Math.sin(x * 0.013 + 1) * 12);
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    // the bottom: sand / mud / gravel, with a wavy top edge
    const fg = ctx.createLinearGradient(0, FLOOR - 8, 0, H);
    fg.addColorStop(0, loc.floor); fg.addColorStop(1, loc.floor2);
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, FLOOR + Math.sin(x * 0.02) * 6);
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    // pebbles
    for (let i = 0; i < 22; i++) {
      const x = 20 + i * 44 + (i % 3) * 9, y = FLOOR + 10 + (i % 2) * 7;
      ctx.beginPath(); ctx.ellipse(x, y, 7 + (i % 3) * 2, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = shade(loc.floor2, -0.12); ctx.fill();
    }
    // rocks with a shine
    const rock = (x, w, h, c) => {
      ctx.beginPath(); ctx.moveTo(x - w / 2, FLOOR + 6); ctx.quadraticCurveTo(x - w / 2, FLOOR - h, x, FLOOR - h);
      ctx.quadraticCurveTo(x + w / 2, FLOOR - h, x + w / 2, FLOOR + 6); ctx.closePath();
      ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x - w * 0.1, FLOOR - h * 0.35, h * 0.45, Math.PI * 1.15, Math.PI * 1.45); ctx.stroke();
    };
    if (locId === 'pond') {
      // a hollow log lying on the bottom, and two mossy rocks
      ctx.save(); ctx.translate(640, FLOOR - 6); ctx.rotate(-0.06);
      D.box(ctx, -80, -26, 150, 34, 16, '#a9744a', 4);
      ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 3;
      for (const y of [-14, -2]) { ctx.beginPath(); ctx.moveTo(-60, y); ctx.lineTo(40, y); ctx.stroke(); }
      ctx.beginPath(); ctx.ellipse(70, -9, 12, 17, 0, 0, Math.PI * 2); ctx.fillStyle = '#d9a66f'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(70, -9, 6, 10, 0, 0, Math.PI * 2); ctx.fillStyle = '#5c3b1e'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(-30, -25, 26, 7, 0, Math.PI, 0); ctx.fillStyle = '#6fbf73'; ctx.fill();
      ctx.restore();
      rock(380, 70, 36, '#a9b4a0'); rock(420, 40, 22, '#bcc6b2');
      rock(880, 80, 40, '#a9b4a0');
    } else if (locId === 'pier') {
      // coral, a big anchor, rocks and a smiling starfish
      for (const [x, c, s] of [[330, '#ff70a6', 1], [860, '#c77dff', 1.1], [905, '#ff9770', 0.8]]) {
        const br = () => { ctx.beginPath(); ctx.moveTo(x, FLOOR + 4); ctx.lineTo(x, FLOOR - 50 * s); ctx.moveTo(x, FLOOR - 24 * s); ctx.lineTo(x - 22 * s, FLOOR - 50 * s); ctx.lineTo(x - 26 * s, FLOOR - 64 * s); ctx.moveTo(x, FLOOR - 32 * s); ctx.lineTo(x + 20 * s, FLOOR - 64 * s); };
        ctx.strokeStyle = INK; ctx.lineWidth = 16 * s; br(); ctx.stroke();
        ctx.strokeStyle = c; ctx.lineWidth = 9 * s; br(); ctx.stroke();
        for (const [px, py] of [[0, -50], [-26, -64], [20, -64]]) D.circle(ctx, x + px * s, FLOOR + py * s, 4 * s, shade(c, 0.45), 0);
      }
      // the anchor (tipped over, half in the sand)
      ctx.save(); ctx.translate(620, FLOOR - 4); ctx.rotate(-0.35);
      ctx.strokeStyle = INK; ctx.lineWidth = 14;
      const anc = () => { ctx.beginPath(); ctx.moveTo(0, -70); ctx.lineTo(0, 0); ctx.moveTo(-22, -52); ctx.lineTo(22, -52); ctx.moveTo(-34, -18); ctx.quadraticCurveTo(0, 22, 34, -18); };
      anc(); ctx.stroke(); ctx.strokeStyle = '#8d99ae'; ctx.lineWidth = 7; anc(); ctx.stroke();
      D.circle(ctx, 0, -80, 11, null, 4); ctx.strokeStyle = '#8d99ae'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -80, 11, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      rock(430, 60, 30, '#c2b59b'); rock(740, 46, 24, '#d6c9ab');
      D.star(ctx, 500, FLOOR + 2, 18, '#ff8fab', 3);
      D.circle(ctx, 496, FLOOR, 2, INK, 0); D.circle(ctx, 504, FLOOR, 2, INK, 0);
      // a little clam shell
      ctx.beginPath(); ctx.moveTo(780, FLOOR + 8); ctx.quadraticCurveTo(780, FLOOR - 14, 794, FLOOR - 14); ctx.quadraticCurveTo(808, FLOOR - 14, 808, FLOOR + 8); ctx.closePath();
      ctx.fillStyle = '#ffb4a2'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    } else {
      // icy crystals and round frosty rocks
      rock(420, 76, 34, '#b8c9d9'); rock(460, 40, 20, '#cad8e6'); rock(820, 66, 30, '#b8c9d9');
      for (const [x, h, r] of [[620, 60, -0.15], [650, 44, 0.25], [596, 34, -0.45]]) {
        ctx.save(); ctx.translate(x, FLOOR + 4); ctx.rotate(r);
        ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-10, -h + 12); ctx.lineTo(0, -h); ctx.lineTo(10, -h + 12); ctx.lineTo(10, 0); ctx.closePath();
        ctx.fillStyle = '#d6f3ff'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(-4, -h + 16); ctx.stroke();
        ctx.restore();
      }
    }
  }

  // ---- drawn every frame ----
  function drawSky(g, ctx) {
    ctx.drawImage(layers().sky, 0, 0);
    const t = g.time;
    // clouds drift slowly (puffy, with a soft bottom shade)
    for (const [cx, cy, s] of [[300, 50, 1], [620, 80, 0.8], [880, 40, 0.7]]) {
      const x = ((cx + t * 8 * s) % (W + 200)) - 100;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(43,43,43,0.25)'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, cy, 22 * s, Math.PI * 0.5, Math.PI * 1.5);
      ctx.arc(x + 26 * s, cy - 14 * s, 26 * s, Math.PI, Math.PI * 2);
      ctx.arc(x + 56 * s, cy, 22 * s, Math.PI * 1.5, Math.PI * 0.5);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(160,190,220,0.25)';
      ctx.beginPath(); ctx.ellipse(x + 28 * s, cy + 12 * s, 40 * s, 7 * s, 0, 0, Math.PI * 2); ctx.fill();
    }
    // two little birds flapping far away (not on the ice)
    if (locId !== 'ice') {
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (const [bx0, by, ph] of [[0, 70, 0], [40, 84, 1.7]]) {
        const bx = ((bx0 + t * 22) % (W + 300)) + 200, fl = Math.sin(t * 7 + ph) * 5;
        ctx.beginPath(); ctx.moveTo(bx - 9, by - fl); ctx.quadraticCurveTo(bx - 4, by - 4, bx, by); ctx.quadraticCurveTo(bx + 4, by - 4, bx + 9, by - fl); ctx.stroke();
      }
    }
    if (locId === 'pond') {
      // reeds and cattails on the right
      for (let i = 0; i < 6; i++) {
        const x = 880 + i * 14, sw = Math.sin(t * 1.2 + i) * 4;
        ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, WATER + 4); ctx.quadraticCurveTo(x + sw * 0.5, WATER - 40, x + sw, WATER - 70 - (i % 3) * 12); ctx.stroke();
        ctx.strokeStyle = '#3f9d43'; ctx.lineWidth = 4; ctx.stroke();
        if (i % 2 === 0) D.box(ctx, x + sw - 5, WATER - 92 - (i % 3) * 12, 10, 24, 5, '#8b5a2b', 3);
      }
    } else if (locId === 'pier') {
      // a little sailboat bobbing by: red hull with a white stripe, two sails, a flag
      const bx = 560 + Math.sin(t * 0.1) * 60, by = WATER - 28 + Math.sin(t * 1.5) * 2, tilt = Math.sin(t * 1.5) * 0.04;
      ctx.save(); ctx.translate(bx, by); ctx.rotate(tilt);
      ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, -62); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(3, -58); ctx.quadraticCurveTo(26, -34, 30, -8); ctx.lineTo(3, -8); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-3, -50); ctx.lineTo(-3, -10); ctx.lineTo(-24, -10); ctx.closePath(); ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -62); ctx.lineTo(14 + Math.sin(t * 6) * 2, -58); ctx.lineTo(0, -54); ctx.closePath(); ctx.fillStyle = '#ef476f'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-34, -6); ctx.lineTo(36, -6); ctx.lineTo(26, 8); ctx.lineTo(-26, 8); ctx.closePath(); ctx.fillStyle = '#ef476f'; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(-30, -1, 62, 3);
      ctx.restore();
    } else {
      ctx.fillStyle = '#fff';
      for (const f of flakes) { ctx.beginPath(); ctx.arc(f.x, f.y, f.s, 0, Math.PI * 2); ctx.fill(); }
    }
  }

  function drawWater(g, ctx) {
    const t = g.time;
    // the water (painted once) shows below the wavy surface line
    ctx.save();
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, waveY(x, t));
    ctx.lineTo(W, H); ctx.closePath(); ctx.clip();
    ctx.drawImage(layers().under, 0, 0);

    // sunbeams swaying under the water
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 5; i++) {
      const x = 300 + i * 150 + Math.sin(t * 0.4 + i) * 30;
      ctx.beginPath(); ctx.moveTo(x, WATER); ctx.lineTo(x + 50, WATER); ctx.lineTo(x - 30, FLOOR); ctx.lineTo(x - 90, FLOOR); ctx.closePath(); ctx.fill();
    }
    // wobbly light lines just under the surface (like sun on a pool floor)
    ctx.globalAlpha = 0.28; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const x = ((i * 131 + t * 14) % (W + 60)) - 30, y = WATER + 24 + (i % 3) * 16;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 14, y - 6 + Math.sin(t * 2 + i) * 4, x + 28, y);
      ctx.quadraticCurveTo(x + 42, y + 6, x + 56, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    if (locId === 'pond' || locId === 'ice') {
      // waving water plants: a tall leaf with a middle line
      const cols = locId === 'pond' ? ['#43aa8b', '#90be6d'] : ['#6fb7a8', '#94d2bd'];
      for (const [x, h, c] of [[300, 90, 0], [330, 60, 1], [520, 110, 0], [760, 70, 1], [785, 100, 0], [930, 80, 1]]) {
        const sw = Math.sin(t * 1.3 + x) * 12;
        ctx.beginPath(); ctx.moveTo(x - 9, FLOOR + 4);
        ctx.quadraticCurveTo(x - 12 + sw * 0.5, FLOOR - h * 0.5, x + sw, FLOOR - h);
        ctx.quadraticCurveTo(x + 12 + sw * 0.5, FLOOR - h * 0.5, x + 9, FLOOR + 4);
        ctx.closePath(); ctx.fillStyle = cols[c]; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
        ctx.strokeStyle = shade(cols[c], -0.25); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, FLOOR); ctx.quadraticCurveTo(x + sw * 0.4, FLOOR - h * 0.5, x + sw * 0.9, FLOOR - h * 0.85); ctx.stroke();
      }
    } else {
      // swaying sea grass between the coral
      for (const [x, h] of [[380, 70], [700, 90], [720, 60]]) {
        const sw = Math.sin(t * 1.1 + x) * 14;
        ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, FLOOR + 2); ctx.quadraticCurveTo(x + sw * 0.3, FLOOR - h * 0.6, x + sw, FLOOR - h); ctx.stroke();
        ctx.strokeStyle = '#52b788'; ctx.lineWidth = 5; ctx.stroke();
      }
    }

    // bubbles (with a tiny shine)
    for (const b of bubbles) {
      const bx = b.x + Math.sin(b.w) * 4;
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.arc(bx, b.y, b.r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(bx - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.28, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Things ON the water surface (drawn after the fish so the surface line sits on top)
  function drawSurface(g, ctx) {
    const t = g.time;
    // a soft light band just under the surface, then the surface line
    ctx.beginPath();
    for (let x = 0; x <= W; x += 16) { const y = waveY(x, t); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.save(); ctx.translate(0, 6); ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.stroke(); ctx.restore();
    ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    // sparkly shimmer lines + little twinkles
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 10; i++) {
      const x = ((i * 113 + t * 18) % (W - 240)) + 240, y = WATER + 10 + (i % 3) * 9;
      const len = 14 + 8 * Math.sin(t * 2 + i);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
      const tw = Math.sin(t * 2.3 + i * 1.9);
      if (tw > 0.5) { const x = 300 + ((i * 197) % 620); D.star(ctx, x, waveY(x, t) - 2, 3 + (tw - 0.5) * 9, '#fff', 0); }
    }
    // ripples
    for (const r of ripples) {
      ctx.globalAlpha = Math.max(0, 1 - r.t / 1.4);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(r.x, WATER + 2, r.r, r.r * 0.25, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (locId === 'pond') {
      // lily pads with a pink flower
      for (const [x, s] of [[430, 1], [790, 0.8]]) {
        const y = waveY(x, t) + 2;
        ctx.beginPath(); ctx.ellipse(x, y, 34 * s, 9 * s, 0, 0.25, Math.PI * 2 - 0.05); ctx.lineTo(x, y); ctx.closePath();
        ctx.fillStyle = '#5cb85c'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
        ctx.strokeStyle = '#3e8e41'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 20 * s, y + 2); ctx.lineTo(x + 18 * s, y - 2); ctx.stroke();
      }
      const fy = waveY(442, t) - 5;
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; D.circle(ctx, 442 + Math.cos(a) * 6, fy + Math.sin(a) * 3, 5, '#ffafcc', 2); }
      D.circle(ctx, 442, fy, 3.5, '#ffd166', 2);
    } else if (locId === 'ice') {
      // floating ice chunks with a shine
      for (const [x, w] of [[460, 70], [700, 50], [900, 80]]) {
        const y = waveY(x, t);
        D.box(ctx, x - w / 2, y - 10, w, 20, 8, '#f0fbff', 3);
        ctx.strokeStyle = '#bde0fe'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - w / 2 + 8, y - 3); ctx.lineTo(x - w / 2 + 22, y - 3); ctx.stroke();
      }
    }
  }

  // The boat bobs on the pond (the angler and the rod bob with it).
  function boatBob() { return locId === 'pond' ? Math.sin(nowT * 1.5) * 2.2 : 0; }

  // Where the angler sits: a rowboat (pond), a wooden pier (ocean), an ice shelf (lake).
  // drawDock = the part BEHIND the angler, drawDockFront = the part in front.
  function drawDock(g, ctx) {
    if (locId === 'pond') {
      // inside of the rowboat (darker wood, seen just above the side), a bucket in the back
      ctx.beginPath(); ctx.moveTo(34, 152); ctx.quadraticCurveTo(150, 132, 276, 146); ctx.lineTo(276, 156); ctx.lineTo(34, 158); ctx.closePath();
      ctx.fillStyle = '#9c6634'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(56, 116); ctx.lineTo(96, 116); ctx.lineTo(90, 156); ctx.lineTo(62, 156); ctx.closePath();
      ctx.fillStyle = '#4cc9f0'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(76, 116, 20, 5, 0, 0, Math.PI * 2); ctx.fillStyle = '#bde0fe'; ctx.fill(); ctx.stroke();
      ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(76, 118, 20, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      // the oar resting across the boat, its blade in the water (behind the side)
      ctx.lineCap = 'round';
      ctx.strokeStyle = INK; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(150, 128); ctx.lineTo(18, 222); ctx.stroke();
      ctx.strokeStyle = '#d9a66f'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(150, 128); ctx.lineTo(18, 222); ctx.stroke();
      ctx.save(); ctx.translate(14, 226); ctx.rotate(-0.95);
      ctx.beginPath(); ctx.ellipse(0, 0, 22, 9, 0, 0, Math.PI * 2); ctx.fillStyle = '#d9a66f'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.restore();
      return;
    }
    if (locId === 'ice') {
      // a snowy ice shelf with icicles and a snowman buddy
      ctx.beginPath();
      ctx.moveTo(-10, DOCK_Y); ctx.lineTo(DOCK_X - 20, DOCK_Y);
      ctx.quadraticCurveTo(DOCK_X + 6, DOCK_Y, DOCK_X + 4, DOCK_Y + 26);
      ctx.lineTo(DOCK_X - 6, WATER + 70); ctx.lineTo(-10, WATER + 90); ctx.closePath();
      ctx.fillStyle = '#d9f1ff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      // cracks / layers in the ice
      ctx.strokeStyle = '#a9d6f5'; ctx.lineWidth = 3;
      for (const [x, y, w] of [[30, WATER + 20, 70], [120, WATER + 46, 60], [60, WATER + 66, 50]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y - 4); ctx.stroke(); }
      // the snowy top with lumps
      ctx.beginPath(); ctx.moveTo(-10, DOCK_Y + 2); ctx.lineTo(DOCK_X - 20, DOCK_Y + 2); ctx.quadraticCurveTo(DOCK_X + 4, DOCK_Y + 2, DOCK_X + 2, DOCK_Y + 18);
      ctx.lineTo(-10, DOCK_Y + 18); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill();
      for (const [x, r] of [[24, 12], [130, 9]]) { ctx.beginPath(); ctx.arc(x, DOCK_Y + 2, r, Math.PI, 0); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); }
      // icicles
      ctx.fillStyle = '#bde0fe';
      for (const x of [60, 110, 160, 200]) { ctx.beginPath(); ctx.moveTo(x - 7, DOCK_Y + 18); ctx.lineTo(x, DOCK_Y + 40 + (x % 3) * 4); ctx.lineTo(x + 7, DOCK_Y + 18); ctx.closePath(); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke(); }
      // a cute snowman buddy: scarf, stick arms, coal buttons
      ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(52, DOCK_Y - 26); ctx.lineTo(34, DOCK_Y - 40); ctx.moveTo(88, DOCK_Y - 26); ctx.lineTo(104, DOCK_Y - 42); ctx.stroke();
      D.circle(ctx, 70, DOCK_Y - 18, 20, '#fff', 3);
      D.circle(ctx, 70, DOCK_Y - 50, 14, '#fff', 3);
      D.circle(ctx, 70, DOCK_Y - 24, 2.5, INK, 0); D.circle(ctx, 70, DOCK_Y - 12, 2.5, INK, 0);
      D.circle(ctx, 65, DOCK_Y - 53, 2.5, INK, 0); D.circle(ctx, 75, DOCK_Y - 53, 2.5, INK, 0);
      ctx.beginPath(); ctx.moveTo(70, DOCK_Y - 48); ctx.lineTo(82, DOCK_Y - 46); ctx.lineTo(70, DOCK_Y - 44); ctx.closePath(); ctx.fillStyle = '#ff8c42'; ctx.fill();
      D.box(ctx, 56, DOCK_Y - 40, 28, 8, 4, '#06d6a0', 2.5);
      D.box(ctx, 74, DOCK_Y - 36, 8, 16, 3, '#06d6a0', 2.5);
      return;
    }
    // ---- the ocean pier ----
    const wood = '#b5835a', dark = '#8a5f3c', light = '#d4a373';
    // posts going down into the sea (green weed where the water starts, darker under water)
    for (const x of [30, 120, DOCK_X - 22]) {
      ctx.fillStyle = dark; ctx.fillRect(x, DOCK_Y + 10, 18, FLOOR - DOCK_Y);
      ctx.fillStyle = 'rgba(10,79,142,0.35)'; ctx.fillRect(x, WATER + 4, 18, FLOOR - WATER);
      ctx.fillStyle = '#52b788'; ctx.fillRect(x, WATER - 2, 18, 9);
      ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.strokeRect(x, DOCK_Y + 10, 18, FLOOR - DOCK_Y);
      D.circle(ctx, x + 5, WATER + 30, 3, '#fff', 2); D.circle(ctx, x + 12, WATER + 38, 2.5, '#fff', 2);   // barnacles
    }
    // railing with a life ring
    ctx.fillStyle = wood; ctx.lineWidth = 4; ctx.strokeStyle = INK;
    for (const x of [10, 110]) { ctx.fillRect(x, DOCK_Y - 50, 10, 50); ctx.strokeRect(x, DOCK_Y - 50, 10, 50); }
    D.box(ctx, 0, DOCK_Y - 56, 130, 10, 4, wood, 4);
    ctx.beginPath(); ctx.arc(64, DOCK_Y - 22, 20, 0, Math.PI * 2); ctx.arc(64, DOCK_Y - 22, 10, 0, Math.PI * 2, true);
    ctx.fillStyle = '#fff'; ctx.fill('evenodd'); ctx.stroke();
    ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 8;
    for (const a of [0.3, 1.9, 3.5, 5.1]) { ctx.beginPath(); ctx.arc(64, DOCK_Y - 22, 15, a, a + 0.6); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(64, DOCK_Y - 22, 10, 0, Math.PI * 2); ctx.stroke();
    // planks: a lighter top + the side
    D.box(ctx, -10, DOCK_Y - 4, DOCK_X + 10, 22, 5, wood, 4);
    ctx.fillStyle = light; ctx.fillRect(-6, DOCK_Y - 1, DOCK_X + 2, 5);
    ctx.strokeStyle = dark; ctx.lineWidth = 2;
    for (let x = 30; x < DOCK_X; x += 40) { ctx.beginPath(); ctx.moveTo(x, DOCK_Y + 5); ctx.lineTo(x, DOCK_Y + 15); ctx.stroke(); }
    // a bucket for the catch
    ctx.beginPath(); ctx.moveTo(142, DOCK_Y - 36); ctx.lineTo(176, DOCK_Y - 36); ctx.lineTo(171, DOCK_Y - 2); ctx.lineTo(147, DOCK_Y - 2); ctx.closePath();
    ctx.fillStyle = '#4cc9f0'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(159, DOCK_Y - 36, 17, 5, 0, 0, Math.PI * 2); ctx.fillStyle = '#bde0fe'; ctx.fill(); ctx.stroke();
  }

  // The rowboat's side, in front of the angler (pond only).
  function drawDockFront(g, ctx) {
    if (locId !== 'pond') return;
    const hull = () => {
      ctx.beginPath(); ctx.moveTo(26, 150); ctx.lineTo(272, 148);
      ctx.quadraticCurveTo(298, 146, 306, 128);
      ctx.quadraticCurveTo(296, 198, 236, 218);
      ctx.lineTo(74, 218); ctx.quadraticCurveTo(30, 210, 26, 150); ctx.closePath();
    };
    hull(); ctx.fillStyle = '#ef476f'; ctx.fill();
    ctx.save(); hull(); ctx.clip();
    // planks, a white stripe, a lighter top edge
    ctx.strokeStyle = shade('#ef476f', -0.25); ctx.lineWidth = 2.5;
    for (const y of [176, 198]) { ctx.beginPath(); ctx.moveTo(20, y); ctx.quadraticCurveTo(160, y + 6, 310, y - 14); ctx.stroke(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(20, 160); ctx.quadraticCurveTo(160, 168, 310, 146); ctx.lineTo(310, 156); ctx.quadraticCurveTo(160, 178, 20, 170); ctx.closePath(); ctx.fill();
    // a yellow star on the side
    D.star(ctx, 110, 190, 11, '#ffd166', 3);
    // the bottom is under water: tint it with the water color
    ctx.fillStyle = loc.water[0]; ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= 320; x += 16) ctx.lineTo(x, waveY(x, g.time) - boatBob());
    ctx.lineTo(320, H); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    hull(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    // the wooden rim on top
    ctx.beginPath(); ctx.moveTo(22, 150); ctx.lineTo(272, 148); ctx.quadraticCurveTo(298, 146, 308, 126);
    ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 12; ctx.stroke();
    ctx.strokeStyle = '#d9a66f'; ctx.lineWidth = 6; ctx.stroke();
    // the oar lock
    D.circle(ctx, 150, 146, 5, '#ffd166', 3);
  }

  // The angler: a cute kid sitting on the end of the dock (or in the rowboat).
  function drawAngler(g, ctx) {
    const t = g.time;
    const breathe = Math.sin(t * 2) * 1.2;
    const skin = '#ffd6a5', shirt = locId === 'ice' ? '#ef476f' : locId === 'pier' ? '#06d6a0' : '#ff8c42', pants = '#3a86ff';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // legs dangling over the edge (they swing a little); in the rowboat they're inside the boat
    for (const [dx, ph] of (locId === 'pond' ? [] : [[0, 0], [8, 1]])) {
      const kx = DOCK_X - 6 + dx, ky = DOCK_Y - 2;
      const fx = kx + 8 + Math.sin(t * 1.6 + ph) * 6, fy = DOCK_Y + 30;
      ctx.strokeStyle = INK; ctx.lineWidth = 15;
      ctx.beginPath(); ctx.moveTo(196, DOCK_Y - 8); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
      ctx.strokeStyle = pants; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(196, DOCK_Y - 8); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
      D.box(ctx, fx - 6, fy - 4, 18, 11, 5, locId === 'ice' ? '#8b5a2b' : '#ef476f', 3);
    }
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
    const tip = rodTip(true);
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
      // the lure: looks like the bait picked in the shop (worm, berry, shrimp, glitter star)
      X.drawLure(ctx, bait, lx, b.lureY, g.time);
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
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y); ctx.stroke();
      D.circle(ctx, x - 4, y - 4, 2.5, '#fff', 0);   // a shine
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
      if (friendsGame) drawFriendChips(g, ctx);
      else {
        // score
        D.box(ctx, 560, 14, 150, 50, 25, 'rgba(255,255,255,0.92)', 4);
        D.star(ctx, 588, 39, 15);
        D.text(ctx, String(score), 650, 40, { size: 30 });
      }
    } else {
      // this place's goal (a picture of what to catch, how far along, a shell for a prize)
      if (!friendsGame) X.drawGoalChip(ctx, g, locId, FishGame, GOAL_BOX, g.time, goalFlash);
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

  // Friends: one chip per player (me first): animal face + their best fish so far + rarity stars.
  // The leader's chip gets a big gold star.
  function drawFriendChips(g, ctx) {
    const list = [{ who: Arcade.profiles.active(), sp: stats.best ? stats.best.sp.id : null, cm: stats.best ? stats.best.cm : 0, mine: true }]
      .concat(Object.keys(friendBest).map(k => Object.assign({ who: peerOf(k) }, friendBest[k])));
    let lead = null;
    for (const r of list) if (r.sp && (!lead || fishValue(r.sp, r.cm) > fishValue(lead.sp, lead.cm))) lead = r;
    // they sit right of the clock (where the score is in a Frenzy); up to 4 players fit
    const n = Math.min(4, list.length), w = Math.min(128, (W - 8 - 560) / n - 6);
    let x = 560;
    for (const r of list.slice(0, 4)) {
      D.box(ctx, x, 14, w, 50, 25, r.mine ? '#fff3c4' : 'rgba(255,255,255,0.92)', 4);
      // the animal face (a small round picture)
      const img = avatarPic(r.who);
      ctx.save(); ctx.beginPath(); ctx.arc(x + 25, 39, 19, 0, Math.PI * 2); ctx.fillStyle = r.who.color || '#4cc9f0'; ctx.fill(); ctx.clip();
      if (img.complete && img.naturalWidth) ctx.drawImage(img, x + 6, 20, 38, 38);
      ctx.restore();
      D.circle(ctx, x + 25, 39, 19, null, 3);
      const sp = r.sp && SP[r.sp], fx = x + Math.min(76, w - 26);
      if (sp) {
        miniFish(ctx, fx, 34, 0.95, sp.body);
        const k = RARITY[sp.rarity].stars;
        for (let i = 0; i < k; i++) D.star(ctx, fx - (k - 1) * 7 + i * 14, 55, 6);
      } else D.text(ctx, '…', fx, 36, { size: 24, color: '#8a9bb0' });
      if (lead === r) D.star(ctx, x + w - 12, 20, 11, '#ffd166');   // the leader's gold star
      x += w + 6;
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

  // The catch screen (Nov 13: redrawn). A card with the fish wiggling in a
  // little window of water, a ruler showing how big it is (compared with the
  // biggest of its kind), its stars, points and shells, and NEW! / BIG! / GOAL!.
  function drawCard(g, ctx) {
    if (!card) return;
    const k = Math.min(1, card.t * 4);
    const pop = 0.6 + 0.4 * k + Math.sin(Math.min(1, card.t * 3) * Math.PI) * 0.06;
    ctx.fillStyle = `rgba(20,40,70,${0.4 * k})`; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2 + 8);
    ctx.scale(pop, pop);
    const R = RARITY[card.sp.rarity];
    // sunburst rays behind the card
    ctx.save(); ctx.rotate(g.time * 0.3);
    ctx.fillStyle = card.sp.rarity === 'common' ? 'rgba(255,240,170,0.3)' : 'rgba(255,240,170,0.45)';
    for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-40, -360); ctx.lineTo(40, -360); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    // the card + the colored top with the fish's name
    D.box(ctx, -300, -200, 600, 400, 30, '#fffaf0', 6);
    D.box(ctx, -300, -200, 600, 72, 30, R.color, 6);
    ctx.fillStyle = R.color; ctx.fillRect(-297, -158, 594, 28);
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(-300, -128); ctx.lineTo(300, -128); ctx.stroke();
    D.text(ctx, 'You caught a', 0, -178, { size: 22 });
    D.text(ctx, card.sp.name + '!', 0, -149, { size: 34, color: '#fff' });
    // the water window: the fish wiggles in it, bubbles go up
    const win = { x: -270, y: -116, w: 540, h: 180 };
    ctx.save();
    D.rr(ctx, win.x, win.y, win.w, win.h, 22); ctx.clip();
    const wg = ctx.createLinearGradient(0, win.y, 0, win.y + win.h);
    wg.addColorStop(0, shade(loc.water[0], 0.35)); wg.addColorStop(1, loc.water[0]);
    ctx.fillStyle = wg; ctx.fillRect(win.x, win.y, win.w, win.h);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i < 4; i++) { const x = win.x + 60 + i * 140 + Math.sin(g.time * 0.6 + i) * 14; ctx.beginPath(); ctx.moveTo(x, win.y); ctx.lineTo(x + 36, win.y); ctx.lineTo(x - 20, win.y + win.h); ctx.lineTo(x - 56, win.y + win.h); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = loc.floor;
    ctx.beginPath(); ctx.moveTo(win.x, win.y + win.h);
    for (let x = win.x; x <= win.x + win.w; x += 30) ctx.lineTo(x, win.y + win.h - 18 + Math.sin(x * 0.03) * 4);
    ctx.lineTo(win.x + win.w, win.y + win.h); ctx.closePath(); ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.5;
    for (let i = 0; i < 7; i++) {
      const by = win.y + win.h - ((g.time * (40 + i * 9) + i * 50) % win.h), bx = win.x + 40 + i * 76 + Math.sin(g.time * 2 + i) * 6;
      ctx.beginPath(); ctx.arc(bx, by, 4 + (i % 3) * 2, 0, Math.PI * 2); ctx.stroke();
    }
    const fit = Math.min(2.6, 330 / (card.sp.len * (card.sp.extra === 'nose' ? 1.6 : 1.3)), 150 / (card.sp.len * card.sp.hgt * (card.sp.shape === 'tall' ? 2.1 : 1.4)));
    const swim = Math.sin(g.time * 2) * 10;
    drawFish(ctx, card.sp, 10 + swim, win.y + win.h / 2 - 4 + Math.sin(g.time * 3) * 4, 1, fit, g.time, { lw: 5, happy: true });
    ctx.restore();
    D.rr(ctx, win.x, win.y, win.w, win.h, 22); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    // the ruler: 0 to the biggest of this kind; the yellow part = this fish
    const rx = -250, rw = 500, ry = 76, rh = 24;
    D.box(ctx, rx, ry, rw, rh, 8, '#fff', 4);
    const frac = Math.min(1, card.cm / card.sp.cm[1]);
    const grow = Math.min(1, card.t * 1.6);
    ctx.save(); D.rr(ctx, rx, ry, rw, rh, 8); ctx.clip();
    ctx.fillStyle = '#ffd166'; ctx.fillRect(rx, ry, rw * frac * grow, rh);
    ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); for (let i = 1; i < 20; i++) { const x = rx + rw * i / 20, l = i % 5 ? 7 : 13; ctx.moveTo(x, ry); ctx.lineTo(x, ry + l); } ctx.stroke();
    D.rr(ctx, rx, ry, rw, rh, 8); ctx.lineWidth = 4; ctx.stroke();
    // the size tag at the end of the yellow part
    const tx = rx + rw * frac * grow;
    D.box(ctx, Math.min(rx + rw - 96, Math.max(rx, tx - 48)), ry + rh + 4, 96, 34, 12, '#fff', 3);
    D.text(ctx, Math.round(card.cm * grow) + ' cm', Math.min(rx + rw - 48, Math.max(rx + 48, tx)), ry + rh + 21, { size: 22 });
    // bottom row: stars + rarity | points | shells
    rarityStars(ctx, R.stars, -190, 156, 13);
    D.text(ctx, R.label, -190, 182, { size: 18, color: R.color });
    D.text(ctx, '+' + card.pts + (card.bonus ? ' ×2' : ''), 30, 166, { size: 30, color: '#ffd166' });
    X.drawShell(ctx, 186, 164, 16);
    D.text(ctx, '+' + card.shells, 236, 166, { size: 28, color: '#ffb4a2' });
    // NEW! (first of its kind) / BIG! (its biggest so far)
    if (card.isNew || card.bestSize) {
      ctx.save(); ctx.translate(262, -140); ctx.rotate(0.25 + Math.sin(g.time * 5) * 0.05);
      D.starPath(ctx, 0, 0, 54, 40, 12); ctx.fillStyle = '#ef476f'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      D.text(ctx, card.isNew ? 'NEW!' : 'BIG!', 0, 2, { size: 24 });
      ctx.restore();
    }
    // GOAL! (this catch finished a goal): a bullseye badge with the shells it gave
    if (card.goal) {
      ctx.save(); ctx.translate(-262, -140); ctx.rotate(-0.2 + Math.sin(g.time * 4) * 0.06);
      D.circle(ctx, 0, 0, 46, '#fff', 4); D.circle(ctx, 0, 0, 36, '#ef476f', 0); D.circle(ctx, 0, 0, 24, '#fff', 0); D.circle(ctx, 0, 0, 12, '#ef476f', 0);
      D.box(ctx, -52, 26, 104, 34, 14, '#06d6a0', 4);
      D.text(ctx, 'GOAL!', 0, 43, { size: 22 });
      ctx.restore();
    }
    ctx.restore();
    // a pulsing tap hand under the card: tap to let it swim
    if (card.t > 0.8) {
      const s = 1 + 0.08 * Math.sin(g.time * 6);
      ctx.save(); ctx.translate(W / 2, H - 14); ctx.scale(s, s);
      D.box(ctx, -110, -20, 220, 36, 18, 'rgba(255,255,255,0.92)', 3);
      D.text(ctx, 'Tap: bye fishy!', 0, -2, { size: 20, color: '#118ab2' });
      ctx.restore();
    }
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
    // the dock / boat + the angler (on the pond they bob up and down with the boat)
    nowT = g.time;
    ctx.save(); ctx.translate(0, boatBob());
    drawDock(g, ctx);
    drawAngler(g, ctx);
    drawDockFront(g, ctx);
    ctx.restore();
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
    if (phase === 'idle' && caughtCount === 0 && !card && countdown <= 0) {
      const a = 0.6 + 0.4 * Math.sin(g.time * 4);
      ctx.globalAlpha = a;
      D.text(ctx, 'Hold, then let go to cast!', 600, 150, { size: 26 });
      ctx.globalAlpha = 1;
    }
    drawHUD(g, ctx);
    drawCard(g, ctx);
    // Friends: big 3, 2, 1, GO! in the middle
    if (countdown > 0) {
      const n = Math.max(1, Math.ceil(countdown - 0.2)), f = (countdown - 0.2) % 1;
      D.text(ctx, String(n), W / 2, 300, { size: 130 * (0.85 + 0.25 * f), color: '#ffd166' });
    } else if (goT > 0) D.text(ctx, 'GO!', W / 2, 300, { size: 90, color: '#06d6a0' });
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
      const goalPic = '<svg viewBox="0 0 30 30" style="width:20px;height:20px;vertical-align:middle"><circle cx="15" cy="15" r="12" fill="#ef476f" stroke="#2b2b2b" stroke-width="3"/><circle cx="15" cy="15" r="7" fill="#fff"/><circle cx="15" cy="15" r="3.5" fill="#ef476f"/></svg>';
      out.push({ id: id + '-relax', loc: id, mode: 'relax', name: L.name, pic: locPic(id, false), locked: !ok,
        meta: ok ? `${smallFish} ${got} / ${list.length} &nbsp;${goalPic} ${X.goalsDone(g, id)} / 8` : need });
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
    const p = Arcade.h('div', { class: 'ar-panel wide ar-scroll' });   // (a long page: it scrolls)
    p.appendChild(Arcade.h('h1', { class: 'ar-title' }, 'Fish Book'));
    p.appendChild(Arcade.h('p', { class: 'ar-sub' }, `${kindsFound(g)} / ${SPECIES.length} kinds found · ${g.save.data.total || 0} fish caught`));
    // the goals of every place (8 pictures each, done ones ticked)
    p.appendChild(Arcade.h('h2', { class: 'ar-title', style: 'font-size:22px;margin:10px 0 6px' }, 'Goals'));
    p.appendChild(X.goalsPanel(g, FishGame));
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

  // What aquarium.js needs from the game (the fish and how to draw them).
  const FishGame = window.FishGame = { SPECIES, SP, RARITY, LOCS, LOC_ORDER, drawFish, miniFish, fishSvg, book };

  // ---------------------------------------------------------------
  // Start the game
  // ---------------------------------------------------------------
  const S = (inner) => `<svg viewBox="0 0 80 80">${inner}</svg>`;
  const LINK = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';   // outline style for the logo picture
  Arcade.start({
    id: 'fishing',
    trophies: [
      { id: 'first', name: 'First catch', how: 'Catch a fish' },
      { id: 'rare', name: 'Lucky line', how: 'Catch a rare fish' },
      { id: 'golden', name: 'Golden fish', how: 'Catch a golden fish' },
      { id: 'fifty', name: 'Fish friend', how: 'Catch 50 fish in all' },
      { id: 'book', name: 'Fish Book complete', how: 'Find every kind of fish', secret: true },
      { id: 'goal1', name: 'Goal!', how: 'Finish a fishing goal' },
      { id: 'decor', name: 'Tank decorator', how: 'Buy something for your aquarium' },
      { id: 'goalsall', name: 'Goal champion', how: 'Finish all 24 goals', secret: true },
    ],   // the trophy room (secret ones show '???' until earned)
    logo: Arcade.logo({
      badge: Arcade.badges.fishing,   // the round picture (arcade/badges.js)
      title: 'Fishing Frenzy', colors: ['#9bf6ff', '#118ab2'], bg: '#4cc9f0', art: `<path d="M0 60 Q30 50 60 60 T120 60 T180 60 T240 60 V160 H0 Z" fill="#3a86ff" ${LINK}/>
              <path d="M30 0 Q80 10 120 70" fill="none" stroke="#2b2b2b" stroke-width="2"/><circle cx="120" cy="66" r="7" fill="#ef476f" ${LINK} stroke-width="3"/>
              <g class="wobble"><path d="M140 110 C160 90 190 92 200 110 C190 128 160 130 140 110 Z M140 110 L124 98 L126 122 Z" fill="#ffd166" ${LINK}/><circle cx="186" cy="106" r="3" fill="#2b2b2b"/></g>` }),   // title screen
    menuMusic: { tempo: 100, root: 62, scale: 'major', prog: [[1, 4, 5, 1], [6, 4, 5, 5], [4, 1, 2, 5]], drums: 'surf', bass: 'walk', lead: 'uke', harmony: 'whistle', swing: 0.12, pad: false, arp: false, seed: 1801,
        tune: { A: '8/2 8 7 8 5/4 3 | 6/2 6 5 6 8/4 6 | 7/2 7 5 7 9/4 7 | 8/12 r/4',
                B: '10/6 8/2 6/8 | 8/6 6/2 4/8 | 5/4 7 9 7 | 5/16',
                C: '4/4 6 8/8 | 3/4 5 8/8 | 4/4 6 9/8 | 7/16' } },   // the title/menu song
    title: 'Fishing Frenzy',
    view: { w: W, h: H },
    background: '#8fd3ff',
    music: { tempo: 88, root: 64, scale: 'major', prog: [[1, 4, 1, 5], [4, 4, 1, 5], [6, 4, 2, 5]], drums: 'soft', bass: 'walk', lead: 'whistle', harmony: 'uke', lead2: 'uke', swing: 0.14, pad: true, arp: true, arpSound: 'uke', seed: 1802,
        tune: { A: '5/4 3/2 2 1/4 3 | 6/6 5/2 1/8 | 3/4 5/2 6 5/4 3 | 2/12 r/4',
                B: '8/6 6/2 8/8 | 8/4 9/2 8 6/8 | 5/4 6/2 8 10/8 | 9/12 r/4',
                C: '6/8 8/4 10 | 8/8 6 | 6/4 4 2/8 | 2/4 5 7/8' } },   // this game's own song
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
    // round picture buttons on the title menu: Fish Book, Aquarium, Shop
    menuExtras: (g) => [
      { icon: bookIcon(), label: 'Book', attr: 'data-book', onClick: () => openBook(g) },
      { icon: X.tankIcon, label: 'Tank', attr: 'data-tank', onClick: () => X.openAquarium(g, FishGame) },
      { icon: X.shopIcon, label: 'Shop', attr: 'data-shopmenu', onClick: () => X.openShop(g, FishGame) },
    ],
    friends: (g) => friendsMenu(g),   // fish together on several phones: the rarest fish wins (arcade/net.js)
    setup,
    update,
    draw: render,
  });
})();
