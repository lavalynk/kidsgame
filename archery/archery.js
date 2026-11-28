// =====================================================================
// Bullseye Adventure — a gentle archery game.
//
// How it works:
//  * Pip the archer stands on the left. Pull back (drag anywhere and let
//    go) to shoot: how far you pull = how strong, which way = the angle.
//    Keyboard: Up / Down to aim, hold Space to pull, let go to shoot.
//  * The arrow is a tiny physics object: gravity pulls it down every step,
//    wind pushes it sideways, and we turn the arrow to point the way it
//    is moving (atan2 of its speed).
//  * Each step we look at the little line the arrow TIP moved along and
//    ask "did that line touch anything?" (a target, a balloon, the ground).
//  * Round targets are seen from the side, so a hit is when the tip crosses
//    the target's middle line. How far from the centre it crosses decides
//    the ring: 10 / 8 / 6 / 4 / 2 points.
//  * Every thing's position is a function of the level clock (no hidden
//    state), so the aiming guide can "fast-forward" the same physics to
//    show where your arrow will go — even for moving targets.
// =====================================================================
(function () {
  const { draw, icons, math } = Arcade;
  const D = draw;
  const INK = D.INK;
  const W = 960, H = 540;
  const DEG = Math.PI / 180;

  // ---- physics numbers (view pixels and seconds) ----
  const GROUND = 470;          // flat ground height (hills can raise it)
  const GRAV = 520;            // gravity, px/s²
  const WIND_K = 30;           // sideways push per "wind line", px/s²
  const V_MIN = 260, V_MAX = 860;  // arrow speed at no pull / full pull
  const ARROW_LEN = 46;        // arrow length in px
  const MIN_A = -15 * DEG, MAX_A = 75 * DEG;
  const PULL_FULL = 180;       // drag this far (view px) for full power
  const STEP = 1 / 120;

  // ---- Pip the archer: feet at (AX, GROUND), drawn at scale AS ----
  const AX = 120, AS = 1.15;
  const SHOULDER = { x: 4, y: -56 };   // in Pip's own little coordinates

  // ---------------------------------------------------------------
  // Themes (three places to visit)
  // ---------------------------------------------------------------
  const THEMES = {
    meadow: { name: 'Sunny Meadow', sky: ['#7fd0ff', '#e2f6ff'], far: '#a6dc8a', near: '#7cc576', ground: '#6abf69', ground2: '#4f9e4f', bg: '#7fd0ff', music: { tempo: 116, root: 62, scale: 'major', prog: [[1, 4, 5, 1], [6, 4, 5, 5], [4, 1, 2, 5]], drums: 'march', bass: 'walk', lead: 'flute', harmony: 'triangle', pad: true, arp: true, bells: true, seed: 1401,
        tune: { A: '1/3 3/1 5/4 8/6 5/2 | 6/3 8/1 6/4 4/6 6/2 | 5/3 7/1 9/4 7/6 5/2 | 8/4 5 8/8',
                B: '10/6 8/2 6/8 | 8/6 6/2 4/8 | 9/4 7 5 7 | 9/8 12',
                C: '6/4 4 6 8 | 5/8 3 | 4/4 6 4 2 | 5/8 r/8' } } },
    beach:  { name: 'Sandy Beach',  sky: ['#62c4f2', '#fff1d0'], far: '#9fd7e8', near: '#3fb6d9', ground: '#f4d58d', ground2: '#ddb768', bg: '#62c4f2', music: { tempo: 124, root: 64, scale: 'mixolydian', prog: [[1, 4, 1, 5], [4, 4, 1, 5], [6, 7, 4, 5]], drums: 'surf', bass: 'walk', lead: 'steel', harmony: 'marimba', swing: 0.1, pad: false, arp: true, arpSound: 'uke', seed: 1402,
        tune: { A: '3/2 5 r 5 8/4 5 | 6/2 8 r 8 6/4 4 | 5/2 3 r 1 3/4 5 | 7/6 5/2 2/8',
                B: '8/4 8/2 6 8/4 10 | 11/6 10/2 8/8 | 10/4 8/2 10 12/8 | 9/6 7/2 5/8',
                C: '8/8 10 | 9/8 7 | 8/4 6 4/8 | 5/4 7 9/8' } } },
    snow:   { name: 'Snowy Hills',  sky: ['#a9cdf5', '#f0f7ff'], far: '#ffffff', near: '#dbe9f8', ground: '#f7fbff', ground2: '#c9dcf0', bg: '#a9cdf5', music: { tempo: 100, root: 65, scale: 'major', prog: [[1, 6, 4, 5], [4, 1, 2, 5], [6, 3, 4, 5]], drums: 'soft', bass: 'whole', lead: 'bell', harmony: 'flute', pad: 'choir', arp: true, bells: true, seed: 1403,
        tune: { A: '3/4 5 8/8 | 6/4 8 10/8 | 8/4 6 4 6 | 5/12 r/4',
                B: '8/6 10/2 8/8 | 8/4 10 12/8 | 11/6 10/2 9/8 | 9/4 7 5/8',
                C: '10/8 8 | 10/8 7 | 8/4 6 4/8 | 5/16' } } },
    // the 4th place (Nov 24, new plan point 7): orange woods, falling leaves, pumpkins, swinging targets
    autumn: { name: 'Autumn Woods', sky: ['#8fd3ff', '#fff0d6'], far: '#f6b26b', near: '#e9a35a', ground: '#b9c75a', ground2: '#94a23f', bg: '#8fd3ff', music: { tempo: 104, root: 62, scale: 'dorian', prog: [[1, 4, 1, 5], [6, 4, 1, 5], [4, 5, 3, 6]], drums: 'soft', bass: 'walk', lead: 'flute', harmony: 'marimba', pad: true, arp: true, arpSound: 'uke', swing: 0.12, seed: 1405,
        tune: { A: '5/4 3 1 3 | 4/6 5/2 6/8 | 3/4 5 8 7 | 5/12 r/4',
                B: '8/6 7/2 6/4 5 | 6/4 8 11/8 | 10/6 9/2 8/4 6 | 5/16',
                C: '11/4 10 8 6 | 7/8 5 | 5/4 6 7 9 | 8/8 r/8' } } },
  };

  // ---------------------------------------------------------------
  // Levels. Things:
  //   ring    — a round target on legs. r = size. leg = leg height.
  //             move: {ax:'x'|'y', amp, speed} slides it around.
  //             spin: turns it edge-on and back (only hits while facing you).
  //             cart: rides a little cart instead of standing on legs.
  //   balloon — pops into confetti (+5). rise: floats up and around again.
  //   star    — golden bonus star (+15).
  //   wheel   — a spinning prize wheel; the slice you hit decides the points.
  //   (ring) swing: {top, len, amp, speed} — hangs on two ropes from a wooden swing frame and
  //             swings to and fro like a pendulum (Autumn Woods). top = the bar's height, len = rope
  //             length to the target's middle, amp = how far it swings (radians).
  // diff: which difficulty a level plays on for big kids (so adding a place never changes the old levels).
  // stars: [1 star (= the goal to win), 2 stars, 3 stars] on Normal.
  // ---------------------------------------------------------------
  const LEVELS = [
    { id: 'l1', name: 'First Shot', theme: 'meadow', arrows: 6, wind: 0, stars: [8, 24, 40],
      things: [{ kind: 'ring', x: 520, r: 60 }] },
    { id: 'l2', name: 'Balloon Party', theme: 'meadow', arrows: 6, wind: 0, stars: [10, 28, 45],
      things: [{ kind: 'ring', x: 650, r: 55 }, { kind: 'balloon', x: 420, y: 250 }, { kind: 'balloon', x: 530, y: 185 },
        { kind: 'balloon', x: 770, y: 215 }, { kind: 'balloon', x: 865, y: 300 }] },
    { id: 'l3', name: 'Hilltop', theme: 'meadow', time: 'evening', arrows: 7, wind: 0, stars: [12, 32, 52], hills: [{ x: 780, w: 320, h: 80 }],
      things: [{ kind: 'ring', x: 780, r: 50 }, { kind: 'star', x: 570, y: 150 }, { kind: 'balloon', x: 440, y: 265 }, { kind: 'balloon', x: 660, y: 205 }] },

    { id: 'l4', name: 'Sea Breeze', theme: 'beach', arrows: 6, wind: 1, stars: [10, 26, 42],
      things: [{ kind: 'ring', x: 700, r: 52 }, { kind: 'balloon', x: 480, y: 235 }, { kind: 'balloon', x: 600, y: 170 }, { kind: 'balloon', x: 840, y: 250 }] },
    { id: 'l5', name: 'Up and Down', theme: 'beach', arrows: 7, wind: -1, stars: [10, 28, 45],
      things: [{ kind: 'ring', x: 720, r: 50, move: { ax: 'y', amp: 110, speed: 1.1 } }, { kind: 'balloon', x: 500, y: 220 }, { kind: 'balloon', x: 610, y: 150 }] },
    { id: 'l6', name: 'Prize Wheel', theme: 'beach', time: 'sunset', arrows: 7, wind: 2, stars: [12, 30, 50],
      things: [{ kind: 'wheel', x: 690, R: 80, leg: 40, spin: 1.1, segs: [2, 5, 2, 10, 2, 5] }, { kind: 'star', x: 480, y: 170 }] },

    { id: 'l7', name: 'Frosty Flip', theme: 'snow', arrows: 7, wind: -2, stars: [9, 26, 42],
      things: [{ kind: 'ring', x: 700, r: 55, spin: 1.2 }, { kind: 'balloon', x: 500, y: 230 }, { kind: 'balloon', x: 830, y: 200 }] },
    { id: 'l8', name: 'Snowy Slide', theme: 'snow', time: 'dawn', arrows: 7, wind: 2, stars: [12, 30, 48],
      things: [{ kind: 'ring', x: 650, r: 50, cart: true, move: { ax: 'x', amp: 130, speed: 0.8 } },
        { kind: 'balloon', x: 450, y: 330, rise: 40, ph: 0 }, { kind: 'balloon', x: 560, y: 330, rise: 40, ph: 1.6 }, { kind: 'balloon', x: 840, y: 330, rise: 40, ph: 3.1 }] },
    { id: 'l9', name: 'Big Blizzard', theme: 'snow', arrows: 8, wind: -3, stars: [13, 34, 56], hills: [{ x: 830, w: 260, h: 70 }],
      things: [{ kind: 'ring', x: 830, r: 46, move: { ax: 'y', amp: 45, speed: 1 } }, { kind: 'ring', x: 570, r: 46, spin: 1.3 },
        { kind: 'star', x: 700, y: 130 }, { kind: 'balloon', x: 420, y: 205 }] },

    // Autumn Woods (Nov 24): a gentle start, then targets that swing on ropes
    { id: 'l10', name: 'Leaf Fall', theme: 'autumn', diff: 'normal', arrows: 7, wind: 1, stars: [12, 34, 54],
      things: [{ kind: 'ring', x: 690, r: 54 }, { kind: 'balloon', x: 470, y: 230 }, { kind: 'balloon', x: 580, y: 330, rise: 35, ph: 0.5 },
        { kind: 'balloon', x: 850, y: 210 }] },
    { id: 'l11', name: 'Tree Swing', theme: 'autumn', diff: 'normal', arrows: 7, wind: -1, stars: [12, 34, 54],
      things: [{ kind: 'ring', x: 700, r: 54, swing: { top: 150, len: 175, amp: 0.3, speed: 1.2 } }, { kind: 'star', x: 500, y: 170 },
        { kind: 'balloon', x: 880, y: 250 }] },
    { id: 'l12', name: 'Golden Woods', theme: 'autumn', time: 'sunset', diff: 'challenge', arrows: 8, wind: 2, stars: [12, 32, 52],
      things: [{ kind: 'ring', x: 560, r: 46, spin: 1.1 }, { kind: 'ring', x: 800, r: 48, swing: { top: 140, len: 180, amp: 0.34, speed: 1.4 } },
        { kind: 'balloon', x: 440, y: 330, rise: 40, ph: 0 }, { kind: 'balloon', x: 680, y: 330, rise: 40, ph: 2.2 }, { kind: 'star', x: 680, y: 130 }] },
  ];
  // Winter Wonderland (Nov 28, 20-point plan #6): one snowy level that only shows in winter (Dec - Feb,
  // Arcade.winter()). It's not in LEVELS (so the level numbers and unlocks stay the same), and it's always open.
  //   snowman — a snowman standing in the snow: hit his top hat and it pops off (+10). (hat r = its size)
  const WINTER_LEVEL = { id: 'w1', name: 'Snowman Party', theme: 'snow', time: 'evening', diff: 'easy', winter: true, arrows: 8, wind: 0, stars: [12, 34, 56],
    things: [{ kind: 'ring', x: 690, r: 56 }, { kind: 'snowman', x: 470 }, { kind: 'snowman', x: 870 },
      { kind: 'balloon', x: 560, y: 190 }, { kind: 'balloon', x: 800, y: 160 }, { kind: 'star', x: 610, y: 120 }] };
  // the old places' difficulty (as they were before Autumn Woods came): first 3 Easy, then Normal, then Challenge
  ['l1', 'l2', 'l3'].forEach(id => { LEVELS.find(l => l.id === id).diff = 'easy'; });
  ['l4', 'l5', 'l6'].forEach(id => { LEVELS.find(l => l.id === id).diff = 'normal'; });
  ['l7', 'l8', 'l9'].forEach(id => { LEVELS.find(l => l.id === id).diff = 'challenge'; });
  // Practice: no arrow limit, no wind, balloons come back. Press "Done" to stop.
  const PRACTICE = { id: 'practice', name: 'Practice', theme: 'meadow', arrows: Infinity, wind: 0, practice: true, stars: [20, 50, 90],
    things: [{ kind: 'ring', x: 600, r: 60 }, { kind: 'balloon', x: 420, y: 240 }, { kind: 'balloon', x: 760, y: 200 }, { kind: 'balloon', x: 860, y: 300 }] };
  const PRACTICE_MAX = 20;     // practice ends by itself after this many arrows

  // ---------------------------------------------------------------
  // Friends (Keith's plan, point 3): archery taking turns on ONE target,
  // each friend on their own phone. Everyone plays the same place; turns go
  // round (seat order), FR_ARROWS arrows each, most points wins.
  // How the phones stay together: the shooter's phone sends its shot
  // ({t:'move', a: angle, p: power, c: level clock}); every other phone sets
  // its clock to c and fires the very same arrow. Things only move with the
  // clock (posOf), so the arrow flies the same way on every screen. Sizes and
  // wind don't change with difficulty here, so all phones see one target.
  // ---------------------------------------------------------------
  const FR_ARROWS = 5;
  const FR_LEVELS = [
    { id: 'fr-meadow', place: 'meadow', name: 'Sunny Meadow', theme: 'meadow', wind: 0, friends: true, stars: [1, 1, 1],
      things: [{ kind: 'ring', x: 640, r: 58 }, { kind: 'balloon', x: 430, y: 240 }, { kind: 'balloon', x: 540, y: 175 }, { kind: 'balloon', x: 820, y: 220 }] },
    { id: 'fr-beach', place: 'beach', name: 'Sandy Beach', theme: 'beach', wind: 1, friends: true, stars: [1, 1, 1],
      things: [{ kind: 'ring', x: 700, r: 52, move: { ax: 'y', amp: 80, speed: 0.8 } }, { kind: 'balloon', x: 480, y: 235 }, { kind: 'balloon', x: 590, y: 165 }, { kind: 'star', x: 830, y: 255 }] },
    { id: 'fr-snow', place: 'snow', name: 'Snowy Hills', theme: 'snow', wind: -1, friends: true, stars: [1, 1, 1],
      things: [{ kind: 'wheel', x: 690, R: 80, leg: 40, spin: 1.0, segs: [2, 5, 2, 10, 2, 5] }, { kind: 'balloon', x: 470, y: 220 }, { kind: 'balloon', x: 860, y: 260 }] },
    { id: 'fr-autumn', place: 'autumn', name: 'Autumn Woods', theme: 'autumn', wind: 0, friends: true, stars: [1, 1, 1],
      things: [{ kind: 'ring', x: 700, r: 54, swing: { top: 150, len: 175, amp: 0.28, speed: 1.0 } }, { kind: 'balloon', x: 470, y: 230 }, { kind: 'star', x: 560, y: 160 }] },
  ];

  const RING_PTS = [10, 8, 6, 4, 2];                // centre → outside
  const RING_COLORS = ['#ffd166', '#ff9f43', '#ef476f', '#5ec8f2', '#ffffff'];
  const BALLOON_COLORS = ['#ef476f', '#9b5de5', '#06d6a0', '#ff8c42', '#118ab2', '#f15bb5'];
  const SEG_COLORS = { 2: '#8ecae6', 5: '#06d6a0', 10: '#ffd166' };
  const BALLOON_PATS = ['heart', 'dots', 'star', 'stripes', 'dots', 'heart'];   // a picture on each balloon

  // ---- dress-up: hats and arrow trails, unlocked by total stars ----
  const HATS = [
    { id: 'cap', name: 'Leaf Cap', need: 0 },
    { id: 'flower', name: 'Flower Crown', need: 3 },
    { id: 'bunny', name: 'Bunny Ears', need: 8 },
    { id: 'wizard', name: 'Wizard Hat', need: 14 },
    { id: 'crown', name: 'Gold Crown', need: 22 },
  ];
  const TRAILS = [
    { id: 'plain', name: 'Cloud', need: 0 },
    { id: 'rainbow', name: 'Rainbow', need: 5 },
    { id: 'candy', name: 'Candy', need: 11 },
    { id: 'sparkle', name: 'Sparkle', need: 18 },
  ];

  // ---------------------------------------------------------------
  // Game state (rebuilt by setup)
  // ---------------------------------------------------------------
  let L = null;         // level definition being played
  let theme = THEMES.meadow;
  let clock = 0;        // level time in seconds (moves things)
  let things = [];      // targets, balloons, stars, wheels
  let arrows = [];      // every arrow shot (flying or stuck)
  let flying = null;    // the arrow in the air right now
  let phase = 'ready';  // 'ready' | 'aim' | 'fly' | 'wait' | 'end'
  let aim = { angle: 20 * DEG, power: 0 };
  let drag = null;      // {mode:'ptr'|'key', sx, sy} while pulling
  let arrowsLeft = 0, shots = 0, score = 0, waitT = 0;
  let wind = 0;         // wind strength for this level (+ = pushes right)
  let thresholds = [0, 0, 0];
  let stats = null, popups = [], pops = [], banner = 0, pendingShot = null, ended = false;
  let hatId = 'cap', trailId = 'plain';
  let lastPath = null;  // (Nov 23, playtest) the last arrow's flight, shown as faint dots on Normal / Challenge

  // Friends state (see FR_LEVELS above)
  const party = () => Arcade.net && Arcade.net.party;
  let friendsGame = false;
  let order = [];        // seats taking turns, in order
  let mySeat = 0;
  let frShots = {};      // seat -> arrows shot
  let frScores = {};     // seat -> points
  let frQueue = [];      // friends' shots waiting to be played on this phone
  let owner = null;      // seat of the arrow in the air (whose points they are)
  let turnT = 0;         // "Your turn!" pop timer
  let lastTurn = null;
  let fWired = false;
  const peerOf = (seat) => seat === mySeat ? Arcade.profiles.active()
    : Object.assign({ pet: 'cat', color: '#4cc9f0', name: '' }, (party() && party().peers[seat]) || {});
  // whose turn: the seat with the fewest arrows shot (ties: seat order). null = everyone is done.
  function shooterSeat() {
    let best = null;
    for (const s of order) if ((frShots[s] || 0) < FR_ARROWS && (best === null || (frShots[s] || 0) < (frShots[best] || 0))) best = s;
    return best;
  }
  // each seat's color (their avatar color; if two friends picked the same color, the later one gets another)
  const SPARE = ['#ef476f', '#118ab2', '#ffd166', '#06d6a0', '#9b5de5', '#ff8c42'];
  function seatColor(seat) {
    const used = [];
    for (const s of order) {
      let c = peerOf(s).color || SPARE[0];
      if (used.includes(c)) c = SPARE.find(x => !used.includes(x));
      if (s === seat) return c;
      used.push(c);
    }
    return peerOf(seat).color || SPARE[0];
  }
  const myTurn = () => !friendsGame || shooterSeat() === mySeat;
  // each player's animal face as a picture for the canvas (made once per look)
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
  function drawAvatar(ctx, who, x, y, r) {
    const img = avatarPic(who);
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = who.color || '#4cc9f0'; ctx.fill(); ctx.clip();
    if (img.complete && img.naturalWidth) ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
    ctx.restore();
    D.circle(ctx, x, y, r, null, 3.5);
  }
  function friendsMenu(g) {
    if (!party()) return;
    if (!fWired) {
      fWired = true;
      party().on('move', (m) => { if (friendsGame && typeof m.a === 'number') frQueue.push(m); });
      // the shooter's own count of their points (it settles any tiny difference)
      party().on('score', (m) => { if (friendsGame && typeof m.s === 'number') frScores[m.from] = m.s; });
      party().on('leave', (m) => { order = order.filter(s => s !== m.from); });
    }
    party().menu(g, {
      choices: FR_LEVELS.map(lv => ({ id: lv.place, name: lv.name, pic: levelPic(lv) })),
      onStart: (id) => g.play(Object.assign({}, FR_LEVELS.find(l => l.place === id) || FR_LEVELS[0])),
      onBack: () => g.menu(),
    });
  }

  const sizeMult = g => g.pick(1.3, 1, 0.82);     // targets get bigger on Easy
  const speedMult = g => g.pick(0.6, 1, 1.2);     // moving / spinning speed

  // Ground height at x (hills are smooth bumps).
  function groundAt(x) {
    let y = GROUND;
    for (const h of (L && L.hills) || []) {
      const d = Math.abs(x - h.x) / (h.w / 2);
      if (d < 1) y -= h.h * (Math.cos(d * Math.PI) + 1) / 2;
    }
    return y;
  }

  // ---------------------------------------------------------------
  // Setup
  // ---------------------------------------------------------------
  function setup(g, level) {
    L = level || LEVELS[0];
    theme = THEMES[L.theme];
    friendsGame = !!L.friends;
    frShots = {}; frScores = {}; frQueue = []; owner = null; turnT = 0; lastTurn = null;
    if (friendsGame) {
      const r = party() && party().room;
      mySeat = r && r.seat != null ? r.seat : 0;
      order = (r && r.players.length ? r.players.slice() : [mySeat]).sort((a, b) => a - b);
      for (const s of order) { frShots[s] = 0; frScores[s] = 0; }
    }
    document.body.style.setProperty('--ar-bg', L.time ? TIMES[L.time].sky[0] : theme.bg);
    hatId = ownedPick(g, HATS, g.save.data.hat);
    trailId = ownedPick(g, TRAILS, g.save.data.trail);
    clock = 0; arrows = []; flying = null; phase = 'ready'; drag = null; pendingShot = null; ended = false; lastPath = null;
    aim = { angle: 20 * DEG, power: 0 };
    shots = 0; score = 0; waitT = 0; popups = []; pops = []; hatsOff = []; banner = 2.2;
    arrowsLeft = L.practice ? Infinity : friendsGame ? FR_ARROWS : L.arrows + g.pick(2, 0, 0);   // Easy: 2 extra arrows
    wind = L.wind * (friendsGame ? 0.75 : g.pick(0.5, 1, 1.3));    // friends: the same wind on every phone
    thresholds = L.stars.map(s => Math.max(1, Math.round(s * (L.practice ? 1 : g.pick(0.6, 1, 1.15)))));
    stats = { bullseyes: 0, hits: 0, balloons: 0, bonus: 0 };

    // Build the things with sizes and speeds for this difficulty.
    const sz = friendsGame ? 1.15 : sizeMult(g), sp = friendsGame ? 0.8 : speedMult(g);   // friends: one size for all
    const bal = friendsGame ? 1.15 : g.pick(1.25, 1, 0.85);
    things = L.things.map((t, i) => {
      const o = Object.assign({ alive: true, ph: i * 1.3, respawn: 0 }, t);
      if (o.kind === 'ring') {
        o.r = Math.round(t.r * sz);
        o.leg = t.leg || 28;
        if (o.move) o.move = Object.assign({}, t.move, { speed: t.move.speed * sp });
        if (o.spin) o.spin = t.spin * sp;
        if (o.swing) o.swing = Object.assign({}, t.swing, { speed: t.swing.speed * sp });
      }
      if (o.kind === 'wheel') { o.R = Math.round(t.R * sz); o.spin = t.spin * sp; }
      if (o.kind === 'balloon') { o.r = Math.round(24 * bal); o.color = BALLOON_COLORS[i % BALLOON_COLORS.length]; o.pat = BALLOON_PATS[i % BALLOON_PATS.length]; }
      if (o.kind === 'star') o.r = Math.round(20 * (friendsGame ? 1.15 : g.pick(1.3, 1, 0.85)));
      if (o.kind === 'snowman') o.r = Math.round(22 * bal);           // (the hat: a bit bigger than a balloon on Easy)
      return o;
    });

    // peek hooks for automated tests
    window.__archeryState = () => ({
      level: L.id, phase, score, friends: friendsGame && { order: order.slice(), mySeat, shots: Object.assign({}, frShots), scores: Object.assign({}, frScores), turn: shooterSeat(), queue: frQueue.length }, arrowsLeft: L.practice ? -1 : arrowsLeft, shots, wind, thresholds, stats: Object.assign({}, stats),
      aim: { angle: aim.angle / DEG, power: aim.power },
      arrows: arrows.map(a => ({ state: a.state, x: Math.round(a.x), y: Math.round(a.y), on: a.on ? things.indexOf(a.on) : -1, points: a.points })),
      targets: things.map(t => { const p = posOf(t, clock); return { kind: t.kind, alive: t.alive, x: Math.round(p.x), y: Math.round(p.y), r: t.r || t.R, facing: p.face }; }),
    });
    // fire right away with an angle (degrees) and power (0..1)
    window.__archeryFire = (angleDeg, power) => { pendingShot = { angle: angleDeg * DEG, power }; };
    // predict what a shot would hit (if fired on the next step), no side effects
    window.__archerySim = (angleDeg, power) => simulate(angleDeg * DEG, power, clock + STEP, 6).events;
    // the playtest robot (tools/playtest.py): a pretend child shoots (kidThink), fast-forward with __archeryStep
    window.__archeryKid = (on, seed) => { Object.assign(kid, { on: !!on, seed: Math.max(1, (seed | 0) % 2147483646), plan: null, mem: {}, wait: 0, last: null,
      stats: { shots: 0, misses: 0, wanted: 0, gotWanted: 0, fling: 0, aimed: {}, got: {} } }); };
    window.__archeryLastPath = () => (lastPath && g.difficulty !== 'easy' ? lastPath.length : 0);   // test-only: the last shot's dots
    window.__archeryDebugBest = (ti, frozen) => bestShot(ti, clock + STEP, frozen);   // test-only
    window.__archeryStep = (sec) => { for (let i = 0; i < sec * 120 && g.state === 'play' && !ended; i++) { update(g, STEP); g.particles.update(STEP); } };
    window.__archeryKidReport = () => ({ level: L.id, diff: g.difficulty, little: !!g.little, score, thresholds: thresholds.slice(), stars: starsFor(score), won: starsFor(score) >= 1,
      ended, arrows: shots, stats: Object.assign({}, stats), kid: Object.assign({}, kid.stats) });
  }

  // pick the saved hat/trail if it is unlocked, else the first one
  function ownedPick(g, list, id) {
    const it = list.find(x => x.id === id);
    return it && owns(g, list === HATS ? 'hat' : 'trail', it) ? it.id : list[0].id;
  }
  function owns(g, kind, it) { return it.need === 0 || g.isUnlocked(kind + '-' + it.id); }

  // ---------------------------------------------------------------
  // Where is each thing at time t? (pure function of the clock)
  // returns {x, y, face (-1..1, for spinners), rot (for wheels)}
  // ---------------------------------------------------------------
  function posOf(t, time) {
    if (t.kind === 'ring') {
      let x = t.x;
      const base = t.cart ? groundAt(x) - 44 - t.r : groundAt(x) - t.leg - t.r;
      let y = base;
      if (t.swing) {      // a pendulum: hangs from the swing frame's bar, swings to and fro
        const a = t.swing.amp * Math.sin(time * t.swing.speed + t.ph);
        x = t.x + Math.sin(a) * t.swing.len; y = t.swing.top + Math.cos(a) * t.swing.len;
      } else if (t.move) {
        const s = Math.sin(time * t.move.speed + t.ph);
        if (t.move.ax === 'x') x = t.x + s * t.move.amp;
        else y = base - t.move.amp * (0.5 + 0.5 * s);
      }
      const face = t.spin ? Math.cos(time * t.spin + t.ph) : 1;
      return { x, y, face, rot: 0 };
    }
    if (t.kind === 'wheel') return { x: t.x, y: groundAt(t.x) - t.leg - t.R, face: 1, rot: time * t.spin };
    if (t.kind === 'balloon') {
      let y = t.y + Math.sin(time * 1.6 + t.ph) * 8;
      if (t.rise) {       // floats up, then starts again from the bottom
        const span = 260;
        y = t.y - ((time * t.rise + t.ph * 60) % span);
      }
      return { x: t.x + Math.sin(time * 0.9 + t.ph) * 5, y, face: 1, rot: 0 };
    }
    // a snowman: where his HAT is (he sways a tiny bit, so the hat does too)
    if (t.kind === 'snowman') return { x: t.x + Math.sin(time * 1.1 + t.ph) * 3, y: groundAt(t.x) - SNOWMAN_H - 7 - t.r * 0.67, face: 1, rot: Math.sin(time * 1.1 + t.ph) * 0.05 };
    // star
    return { x: t.x, y: t.y + Math.sin(time * 2 + t.ph) * 7, face: 1, rot: time * 1.5 };
  }

  // ---------------------------------------------------------------
  // Hit test: the arrow tip moved from (px,py) to (x,y) at time `time`.
  // Returns {pops: [things popped on the way], stop: first solid hit or null}
  // ---------------------------------------------------------------
  function probe(px, py, x, y, time) {
    const pops = [];
    let stop = null;
    const consider = (hit) => { if (!stop || hit.s < stop.s) stop = hit; };
    for (const t of things) {
      if (!t.alive) continue;
      const p = posOf(t, time);
      if (t.kind === 'balloon' || t.kind === 'star' || t.kind === 'snowman') {
        const n = math.nearestOnSegment(p.x, p.y, px, py, x, y);
        if (math.dist(n.x, n.y, p.x, p.y) < t.r + 4) pops.push({ thing: t, s: n.t });
      } else if (t.kind === 'ring') {
        // did the tip cross the target's middle line this step?
        if ((px - p.x) * (x - p.x) > 0 || px === x) continue;
        const s = (p.x - px) / (x - px);
        const yc = py + (y - py) * s;
        const dy = yc - p.y;
        if (Math.abs(dy) <= t.r) {
          if (Math.abs(p.face) < 0.35) continue;       // edge-on: whoosh, it slips past
          const ring = Math.min(4, Math.floor(Math.abs(dy) / t.r * 5));
          consider({ kind: 'ring', thing: t, s, x: p.x, y: yc, ly: dy, points: RING_PTS[ring], side: Math.sign(p.face) });
        } else if (dy > t.r && yc < groundAt(p.x) && !t.swing) {     // (a swinging target has no post under it)
          consider({ kind: 'post', thing: t, s, x: p.x, y: yc, ly: dy, points: 0, side: 1 });
        }
      } else if (t.kind === 'wheel') {
        const inNow = math.dist(x, y, p.x, p.y) < t.R;
        const inBefore = math.dist(px, py, p.x, p.y) < t.R;
        if (inNow && !inBefore) {
          // which slice? angle of the hit point, measured on the turning wheel
          const n = t.segs.length;
          let a = Math.atan2(y - p.y, x - p.x) - p.rot;
          a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          const seg = Math.floor(a / (Math.PI * 2 / n));
          consider({ kind: 'wheel', thing: t, s: 1, x, y, points: t.segs[seg], la: Math.atan2(y - p.y, x - p.x) - p.rot, lr: math.dist(x, y, p.x, p.y) });
        } else if (!inNow && x !== px && (px - p.x) * (x - p.x) <= 0) {
          const s = (p.x - px) / (x - px), yc = py + (y - py) * s;
          if (yc > p.y + t.R && yc < groundAt(p.x)) consider({ kind: 'post', thing: t, s, x: p.x, y: yc, ly: yc - p.y, points: 0, side: 1 });
        }
      }
    }
    // the ground
    const gy = groundAt(x);
    if (y >= gy) consider({ kind: 'ground', thing: null, s: 1, x, y: gy + 2, points: 0 });
    // only count balloons the arrow reached before it stopped
    return { pops: pops.filter(pp => !stop || pp.s <= stop.s), stop };
  }

  // Move an arrow one step: wind pushes sideways, gravity pulls down.
  function stepArrow(a, dt) {
    a.vx += wind * WIND_K * dt;
    a.vy += GRAV * dt;
    a.x += a.vx * dt;
    a.y += a.vy * dt;
  }

  // Where Pip's string hand / arrow tip is for an aim (world coordinates).
  function launchPoint(angle, power) {
    const dx = Math.cos(angle), dy = -Math.sin(angle);
    const hand = { x: SHOULDER.x + dx * 34, y: SHOULDER.y + dy * 34 };
    const nock = { x: hand.x - dx * (10 + power * 34), y: hand.y - dy * (10 + power * 34) };
    const nx = AX + nock.x * AS, ny = GROUND + nock.y * AS;
    return { x: nx + dx * ARROW_LEN, y: ny + dy * ARROW_LEN, nx, ny };
  }
  function makeArrow(angle, power) {
    const p = launchPoint(angle, power);
    const v = V_MIN + (V_MAX - V_MIN) * power;
    return { x: p.x, y: p.y, vx: Math.cos(angle) * v, vy: -Math.sin(angle) * v, ang: -angle, state: 'fly', trail: [], age: 0, on: null, points: 0 };
  }

  // Fast-forward a shot without changing anything (aiming guide + tests).
  // frozen = things stay where they are at t0 (how a child who can't see the whole path guesses: tools/playtest.py)
  function simulate(angle, power, t0, maxT, frozen) {
    const a = makeArrow(angle, power);
    const pts = [{ x: a.x, y: a.y }];
    const events = [];
    const popped = new Set();
    let t = t0;
    for (let i = 0; i < maxT * 120; i++) {
      const px = a.x, py = a.y;
      stepArrow(a, STEP);
      const r = probe(px, py, a.x, a.y, frozen ? t0 : t);
      for (const pp of r.pops) if (!popped.has(pp.thing)) { popped.add(pp.thing); events.push({ kind: pp.thing.kind, index: things.indexOf(pp.thing), points: pp.thing.kind === 'star' ? 15 : 5 }); }
      if (r.stop) { pts.push({ x: r.stop.x, y: r.stop.y }); events.push({ kind: r.stop.kind, index: things.indexOf(r.stop.thing), points: r.stop.points }); return { pts, events }; }
      if (i % 3 === 2) pts.push({ x: a.x, y: a.y });
      if (a.x > W + 80 || a.x < -80 || a.y > H + 40) { events.push({ kind: 'off', index: -1, points: 0 }); return { pts, events }; }
      t += STEP;
    }
    events.push({ kind: 'off', index: -1, points: 0 });
    return { pts, events };
  }

  function popup(text, x, y, color = '#ffd166', size = 30) {
    popups.push({ text, x: math.clamp(x, 80, W - 80), y: Math.max(110, y), t: 0, color, size });
  }

  // ---------------------------------------------------------------
  // Update (dt = 1/120 s)
  // ---------------------------------------------------------------
  function update(g, dt) {
    clock += dt;
    banner = Math.max(0, banner - dt);
    for (const p of popups) { p.t += dt; p.y -= 34 * dt; }
    popups = popups.filter(p => p.t < 1.3);
    for (const b of pops) b.t += dt;
    pops = pops.filter(b => b.t < 0.35);
    // practice balloons come back after a while
    if (L.practice) for (const t of things) if (!t.alive && clock > t.respawn) { t.alive = true; g.sfx('spring'); }
    turnT = Math.max(0, turnT - dt);
    if (friendsGame && lastTurn === null && phase === 'ready' && banner < 1.2) newTurn(g);

    // ---- Friends: a friend's shot arrived? Play it here exactly like on their phone ----
    if (friendsGame && phase === 'ready' && !myTurn()) {
      pendingShot = null;     // (test helper) not my turn: no shooting
      const cur = shooterSeat();
      const i = frQueue.findIndex(m => m.from === cur);
      if (i >= 0) {
        const m = frQueue.splice(i, 1)[0];
        clock = m.c;    // same moment as on the shooter's phone, so moving things are in the same place
        aim.angle = math.clamp(m.a, MIN_A, MAX_A); aim.power = math.clamp(m.p, 0, 1);
        shoot(g);
        return;
      }
    }

    const inp = g.input, ptr = inp.pointer;
    if (kid.on) kidThink(g, dt);

    // Practice "Done" button (on the canvas, bottom right)
    if (L.practice && ptr.justDown && inDone(ptr.x, ptr.y) && phase !== 'end') { endLevel(g); return; }
    if (L.practice && inp.hit('Enter') && phase !== 'end') { endLevel(g); return; }

    // ---- aiming ----
    if ((phase === 'ready' || phase === 'aim') && myTurn()) {
      if (inp.down('ArrowUp', 'KeyW')) aim.angle = Math.min(MAX_A, aim.angle + 45 * DEG * dt);
      if (inp.down('ArrowDown', 'KeyS')) aim.angle = Math.max(MIN_A, aim.angle - 45 * DEG * dt);
    }
    if (phase === 'ready' && myTurn()) {
      if (pendingShot) {                   // test helper
        aim.angle = math.clamp(pendingShot.angle, MIN_A, MAX_A); aim.power = math.clamp(pendingShot.power, 0, 1);
        pendingShot = null; shoot(g); return;
      }
      if (ptr.down && !(L.practice && inDone(ptr.x, ptr.y))) {
        drag = { mode: 'ptr', sx: ptr.x, sy: ptr.y }; phase = 'aim'; aim.power = 0;
      } else if (inp.down('Space')) {
        drag = { mode: 'key' }; phase = 'aim'; aim.power = 0;
      }
    }
    if (phase === 'aim') {
      if (drag.mode === 'ptr') {
        let dx = drag.sx - ptr.x, dy = drag.sy - ptr.y;   // pulling back points the bow forward
        const d = Math.hypot(dx, dy);
        if (dx < 0) { dx = -dx; dy = -dy; }            // dragged toward the targets? aim that way too
        if (d > 12) aim.angle = math.clamp(Math.atan2(-dy, dx), MIN_A, MAX_A);
        const before = aim.power;
        aim.power = math.clamp((d - 10) / (PULL_FULL - 10), 0, 1);
        creak(g, before, aim.power);
        if (!ptr.down) {
          drag = null;
          if (aim.power > 0.06) shoot(g); else { phase = 'ready'; aim.power = 0; }
        }
      } else {
        const before = aim.power;
        aim.power = Math.min(1, aim.power + dt * 0.8);
        creak(g, before, aim.power);
        if (!inp.down('Space')) { drag = null; if (aim.power > 0.06) shoot(g); else { phase = 'ready'; aim.power = 0; } }
      }
    }

    // ---- the flying arrow ----
    if (phase === 'fly' && flying) flyStep(g, flying, dt);

    if (phase === 'wait') {
      waitT -= dt;
      if (waitT <= 0) {
        const out = friendsGame ? shooterSeat() === null : L.practice ? shots >= PRACTICE_MAX : arrowsLeft <= 0;
        if (out) { phase = 'end'; waitT = friendsGame ? 1.4 : 0.9; }
        else {
          phase = 'ready'; aim.power = 0;
          if (friendsGame) {
            // every turn starts with all the balloons and stars back (the same on every phone)
            let back = false;
            for (const t of things) if (!t.alive) { t.alive = true; back = true; }
            if (back) g.sfx('spring');
            newTurn(g);
          }
        }
      }
    }
    if (phase === 'end' && !ended) {
      waitT -= dt;
      if (waitT <= 0) endLevel(g);
    }
  }

  // a soft "creak" every quarter of the pull, so you can hear the power
  function creak(g, before, after) {
    if (Math.floor(after * 4) > Math.floor(before * 4)) g.tone(300 + after * 500, 0.05, { type: 'triangle', vol: 0.12 });
  }

  function shoot(g) {
    flying = makeArrow(aim.angle, aim.power);
    lastPath = flying.path = [];     // remember this flight: it shows as faint dots until the next shot (Normal / Challenge)
    arrows.push(flying);
    phase = 'fly';
    if (friendsGame) {
      owner = shooterSeat();
      flying.owner = owner;
      frShots[owner] = (frShots[owner] || 0) + 1;
      if (owner === mySeat) {
        shots++; arrowsLeft--;
        party().tell({ t: 'move', a: aim.angle, p: aim.power, c: clock });   // the others fire the same arrow
      }
    } else {
      shots++;
      if (!L.practice) arrowsLeft--;
    }
    // string twang + whoosh
    g.tone(180 + aim.power * 140, 0.22, { type: 'triangle', slide: 90, vol: 0.32 });
    g.tone(520, 0.08, { type: 'square', slide: 260, vol: 0.08 });
    g.sfx('whoosh');
    aim.power = 0;
  }

  function flyStep(g, a, dt) {
    const px = a.x, py = a.y;
    stepArrow(a, dt);
    a.age += dt;
    a.ang = Math.atan2(a.vy, a.vx);           // point the arrow where it is going
    if (Math.floor(a.age * 60) % 2 === 0) { a.trail.push({ x: a.x, y: a.y }); if (a.trail.length > 28) a.trail.shift(); }
    if (a.path && a.age - (a.path.t || 0) > 0.05) { a.path.push({ x: a.x, y: a.y }); a.path.t = a.age; }   // (the "last shot" dots)
    if (trailId === 'sparkle' && Math.random() < dt * 30) g.particles.burst(a.x, a.y, { count: 1, shape: 'star', colors: ['#ffd166', '#fff3b0'], speed: 40, gravity: 60, size: 9, life: 0.5 });

    const r = probe(px, py, a.x, a.y, clock);
    for (const pp of r.pops) popThing(g, pp.thing);
    const s = r.stop;
    if (s) {
      a.state = 'stuck'; a.x = s.x; a.y = s.y; a.points = s.points;
      if (s.kind === 'ring' || s.kind === 'post') { a.on = s.thing; a.ly = s.ly; a.side = s.side; a.lang = a.ang; }
      else if (s.kind === 'wheel') { a.on = s.thing; a.la = s.la; a.lr = s.lr; a.lang = a.ang - posOf(s.thing, clock).rot; }
      landed(g, a, s);
      return;
    }
    if (a.x > W + 80 || a.x < -80 || a.y > H + 40 || a.age > 8) {
      a.state = 'gone';
      popup('Whoosh!', Math.min(a.x, W - 90), Math.min(a.y, H - 120), '#ffffff', 26);
      settle();
    }
  }

  function settle() {
    flying = null; phase = 'wait'; waitT = friendsGame ? 1.0 : 0.45;
    // friends: my arrow is done, tell everyone my points (they work them out too; this settles any difference)
    if (friendsGame && owner === mySeat && party()) party().tell({ t: 'score', s: frScores[mySeat] || 0 });
  }
  // Friends: a new turn starts. "Your turn!" on my phone, a little sound for everyone.
  function newTurn(g) {
    const cur = shooterSeat();
    if (cur === lastTurn) return;
    lastTurn = cur;
    if (cur === mySeat) { turnT = 1.6; g.sfx('unlock'); } else g.sfx('tick');
  }
  const mine = () => !friendsGame || owner === mySeat;

  function landed(g, a, s) {
    settle();
    if (s.kind === 'ground' || s.kind === 'post') {
      g.tone(120, 0.12, { type: 'triangle', slide: 70, vol: 0.3 });      // soft thud
      g.particles.burst(s.x, s.y, { count: 8, angle: -Math.PI / 2, spread: 2, speed: 120, size: 7, life: 0.5, colors: [theme.ground2, theme.ground] });
      // gentle "almost!" if it landed near a target
      const near = things.some(t => t.alive && t.kind !== 'balloon' && Math.abs(posOf(t, clock).x - s.x) < 90);
      if (s.kind === 'post' || near) popup('Almost!', s.x, s.y - 70, '#ffffff', 26);
      return;
    }
    // a target! thunk + points
    g.tone(150, 0.1, { type: 'square', slide: 80, vol: 0.28 });
    g.tone(90, 0.12, { type: 'triangle', vol: 0.3 });
    addScore(s.points);
    if (mine()) stats.hits++;
    if (s.points >= 10) {
      if (mine()) { stats.bullseyes++; if (stats.bullseyes >= 5) g.achieve('eagle'); }
      g.sfx('star');
      popup('Bullseye!', s.x, s.y - 80, '#ffd166', 46);
      g.particles.burst(s.x, s.y, { count: 30, shape: 'star', speed: 300, size: 16, gravity: 250 });
      if (mine()) g.achieve('bullseye', 'First bullseye!');
    } else {
      g.sfx('coin');
      popup('+' + s.points, s.x, s.y - 60, s.points >= 6 ? '#06d6a0' : '#8ecae6', 36);
      g.particles.burst(s.x, s.y, { count: 10, speed: 160, size: 8, life: 0.6 });
    }
  }

  function popThing(g, t) {
    if (!t.alive) return;
    t.alive = false;
    t.respawn = clock + 2.5;
    const p = posOf(t, clock);
    if (t.kind === 'snowman') {           // Winter Wonderland: his hat flies off in a puff of snow
      addScore(10); if (mine()) { stats.hats = (stats.hats || 0) + 1; g.achieve('snowman'); }
      g.sfx('poof');
      hatsOff.push({ x: p.x, y: p.y, vx: 120 + Math.random() * 80, vy: -320, a: 0, t: 0 });
      g.particles.burst(p.x, p.y, { count: 22, colors: ['#ffffff', '#e3f2fd', '#bde0fe'], speed: 220, size: 9, gravity: 260, life: 0.9 });
      popup('Hat off! +10', p.x, p.y - 40, '#4cc9f0');
    } else if (t.kind === 'balloon') {
      addScore(5); if (mine()) { stats.balloons++; if (stats.balloons >= 10) g.achieve('balloons'); }
      g.sfx('pop');
      pops.push({ x: p.x, y: p.y, color: t.color, t: 0 });
      g.particles.burst(p.x, p.y, { count: 26, shape: 'square', speed: 260, size: 12, gravity: 300, life: 1.1 });
      g.particles.burst(p.x, p.y, { count: 8, colors: [t.color], speed: 120, size: 10, life: 0.5 });
      popup('Pop! +5', p.x, p.y - 40, '#f15bb5');
    } else {
      addScore(15); if (mine()) { stats.bonus++; g.achieve('golden'); }
      g.sfx('power');
      g.particles.burst(p.x, p.y, { count: 30, shape: 'star', colors: ['#ffd166', '#fff3b0', '#ffc93c'], speed: 280, size: 16, gravity: 200 });
      popup('Golden star! +15', p.x, p.y - 40, '#ffd166', 32);
    }
  }

  function addScore(n) {
    if (friendsGame) {   // friends: points go to whoever shot this arrow
      frScores[owner] = (frScores[owner] || 0) + n;
      if (owner === mySeat) score += n;
      return;
    }
    const before = score;
    score += n;
    // little fanfare when passing a star mark
    for (let i = 0; i < 3; i++) if (before < thresholds[i] && score >= thresholds[i]) {
      Arcade.sfx('unlock');
      popup(['Goal!', 'Two stars!', 'Three stars!'][i], W / 2, 150, '#ffd166', 34);
    }
  }

  function starsFor(s) { return s >= thresholds[2] ? 3 : s >= thresholds[1] ? 2 : s >= thresholds[0] ? 1 : 0; }

  function endLevel(g) {
    if (ended) return;
    ended = true; phase = 'end';
    if (friendsGame) { friendsResults(g); return; }
    const stars = starsFor(score);
    const idx = LEVELS.findIndex(l => l.id === L.id);
    const lines = [];
    if (stats.bullseyes) lines.push('Bullseyes: ' + stats.bullseyes);
    if (stats.balloons) lines.push('Balloons popped: ' + stats.balloons);
    if (stats.bonus) lines.push('Golden stars: ' + stats.bonus);
    if (L.practice) {
      lines.unshift('Arrows shot: ' + shots);
      g.finish({ win: true, score, stars, title: 'Great practice!', lines, next: false, delay: 600 });
    } else {
      const win = stars >= 1;
      if (win) g.achieve('win');
      if (stars >= 3) g.achieve('three-stars');
      if (win && idx === LEVELS.length - 1) g.achieve('last');
      if (win && stats.bullseyes === 0 && stats.balloons === 0) g.achieve('sneaky');
      if (!win) lines.push('Get ' + thresholds[0] + ' points to win — you can do it!');
      g.finish({ win, score, stars, title: !win ? 'Nice try!' : stars === 3 ? 'Amazing!' : 'Hooray!', lines, next: win && idx < LEVELS.length - 1, delay: 700 });
      setTimeout(() => checkUnlocks(g), 1500);
    }
  }

  // Friends results: everyone's points, most first, with their animal face.
  function friendsResults(g) {
    const all = order.concat(Object.keys(frScores).map(Number).filter(s => !order.includes(s) && s === mySeat))
      .map(s => ({ seat: s, who: peerOf(s), pts: frScores[s] || 0, mine: s === mySeat }))
      .sort((a, b) => b.pts - a.pts);
    const top = all[0] ? all[0].pts : 0;
    const winners = all.filter(r => r.pts === top);
    const iWon = winners.some(r => r.mine);
    const rows = all.map((r, i) =>
      `<div style="display:flex;align-items:center;gap:10px;justify-content:center;margin:4px 0;width:100%">` +
      `<span style="font-size:24px;width:36px">${i + 1}.</span>` +
      `<span style="width:56px;height:56px;display:inline-block;border-radius:50%;overflow:hidden;border:4px solid #2b2b2b;${r.mine ? 'box-shadow:0 0 0 4px #ffd166' : ''}">${Arcade.profiles.avatar(r.who)}</span>` +
      `<span style="font-size:28px;min-width:70px;text-align:right">${r.pts}</span>` +
      `<span style="font-size:26px;width:34px;color:#ffd166;-webkit-text-stroke:1.5px #2b2b2b">${r.pts === top && top > 0 ? '★' : ''}</span></div>`).join('');
    if (iWon && all.length > 1) g.achieve('win');
    g.finish({
      win: true, score, stars: iWon ? 3 : score > 0 ? 2 : 1,
      title: iWon ? (winners.length > 1 ? 'A tie!' : 'You won!') : 'Great shooting!', lines: [rows], delay: 300,
      buttons: [{ icon: Arcade.icons.again, label: 'Again', cls: 'big', onClick: () => party().start(L.place) },
        { icon: Arcade.net.FRIENDS_PIC, label: 'Friends', cls: 'blue', onClick: () => friendsMenu(g) }],
    });
  }

  function totalStars(g) { return LEVELS.reduce((n, l) => n + ((g.save.levels[l.id] || {}).stars || 0), 0); }
  function checkUnlocks(g) {
    const n = totalStars(g);
    for (const h of HATS) if (h.need && n >= h.need) g.unlock('hat-' + h.id, h.name + ' hat!');
    for (const t of TRAILS) if (t.need && n >= t.need) g.unlock('trail-' + t.id, t.name + ' arrow trail!');
  }

  // Practice "Done" button area (view coordinates)
  const DONE = { x: 836, y: 440, w: 104, h: 84 };
  const inDone = (x, y) => x >= DONE.x && x <= DONE.x + DONE.w && y >= DONE.y && y <= DONE.y + DONE.h;

  // ---------------------------------------------------------------
  // Drawing: backgrounds
  // ---------------------------------------------------------------
  function cloud(ctx, x, y, s, color = '#ffffff') {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath();
    ctx.arc(-30, 6, 20, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(-8, -10, 24, Math.PI * 1.0, Math.PI * 1.9);
    ctx.arc(22, -4, 20, Math.PI * 1.2, Math.PI * 0.1 + Math.PI * 2);
    ctx.arc(34, 8, 16, Math.PI * 1.5, Math.PI * 0.5);
    ctx.closePath();
    ctx.fillStyle = color || '#ffffff'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(43,43,43,0.35)'; ctx.stroke();
    ctx.restore();
  }

  // ---------------------------------------------------------------
  // Living backgrounds (Nov 22, new plan point 2, part 3)
  // The still parts of each place are painted ONCE into 3 hidden canvases
  // (sceneFor / paintScene, like Turbo Bike and Potion Quest), so older tablets stay smooth:
  //   sky  = the sky colors          far  = mountains / the sea / far hills
  //   land = near hills, the ground, shells, a cabin...
  // Between and on top of them, cheap live bits gently "breathe":
  //   clouds drift, a windmill turns, a boat bobs, waves roll, gulls and birds fly by,
  //   chimney smoke puffs, trees and palms sway, flowers nod, butterflies / fireflies / sea sparkles.
  // A level can have a time of day (TIMES): Hilltop = evening, Prize Wheel = sunset, Snowy Slide = dawn.
  // Calm motion (Parent corner): the scenery clock stands still and nothing floats.
  // ---------------------------------------------------------------
  const TIMES = {
    evening: { sky: ['#8f86de', '#ffc79a'], tint: 'rgba(255,140,80,0.17)', cloud: '#ffe1dc', glow: 'rgba(255,190,120,0.55)' },
    sunset:  { sky: ['#f48fb1', '#ffd59e'], tint: 'rgba(255,110,120,0.15)', cloud: '#ffe0ea', glow: 'rgba(255,200,140,0.6)', sea: '#5aa8d6' },
    dawn:    { sky: ['#b9a8ef', '#ffd9e8'], tint: 'rgba(255,160,200,0.15)', cloud: '#fff0f6', glow: 'rgba(255,215,235,0.6)' },
  };
  const scT = () => (calmNow() ? 0 : clock);               // the scenery clock (stands still in Calm motion)
  const timeOf = () => (L && TIMES[L.time]) || null;
  const skyOf = () => (timeOf() ? timeOf().sky : theme.sky);
  const rnd = (i) => { const s = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return s - Math.floor(s); };   // the same "random" every time
  let scenes = new Map();      // painted scenes by key (place | time | hills | sharpness)

  function sceneFor(ctx) {
    const a = ctx.getTransform ? Math.abs(ctx.getTransform().a) : 1;
    const k = Math.max(0.5, Math.min(2, Math.round(a * 2) / 2));          // real pixels per game unit, in halves
    const key = L.theme + '|' + (L.time || 'day') + '|' + JSON.stringify(L.hills || []) + '|' + k;
    let s = scenes.get(key);
    if (!s) {
      if (scenes.size > 6) scenes = new Map();
      s = paintScene(k); s.key = key; scenes.set(key, s);
    }
    return s;
  }
  function paintScene(k) {
    const layer = (paint, tint) => {
      const c = document.createElement('canvas'); c.width = Math.ceil(W * k); c.height = Math.ceil(H * k);
      const x = c.getContext('2d'); x.scale(k, k); x.lineJoin = 'round'; x.lineCap = 'round';
      paint(x);
      // the time of day washes over everything painted (only where something is painted)
      if (tint && timeOf()) { x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = timeOf().tint; x.fillRect(0, 0, c.width, c.height); }
      return c;
    };
    return { sky: layer(paintSky), far: layer(paintFar, true), land: layer(paintLand, true) };
  }
  function paintSky(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, skyOf()[0]); sky.addColorStop(1, skyOf()[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // a soft warm glow low in the sky at evening / sunset / dawn (no sun disc)
    const tm = timeOf();
    if (tm) {
      const gl = ctx.createRadialGradient(W * 0.62, 380, 10, W * 0.62, 380, 420);
      gl.addColorStop(0, tm.glow); gl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    }
  }
  function paintFar(ctx) {
    if (theme === THEMES.meadow) {
      // far blue mountains with a little snow, then the rolling far hills and a windmill
      mountains(ctx, [[150, 380, 150], [420, 460, 190], [760, 420, 160], [1010, 300, 120]], 330, '#b7d7e8', '#ffffff');
      hills(ctx, 360, 70, 300, theme.far);
      // the windmill's tower (its sails turn: drawSails)
      ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(43,43,43,0.55)';
      ctx.beginPath(); ctx.moveTo(WMILL.x - 16, WMILL.y + 74); ctx.lineTo(WMILL.x - 9, WMILL.y); ctx.lineTo(WMILL.x + 9, WMILL.y); ctx.lineTo(WMILL.x + 16, WMILL.y + 74); ctx.closePath();
      ctx.fillStyle = '#fff4e0'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(WMILL.x - 13, WMILL.y + 2); ctx.lineTo(WMILL.x, WMILL.y - 14); ctx.lineTo(WMILL.x + 13, WMILL.y + 2); ctx.closePath();
      ctx.fillStyle = '#ef476f'; ctx.fill(); ctx.stroke();
      D.box(ctx, WMILL.x - 5, WMILL.y + 52, 10, 20, 4, '#a8683a', 2.5);
    } else if (theme === THEMES.beach) {
      // the sea (waves roll on top of it, drawWaves) with a far island + a little lighthouse
      const tm = timeOf();
      const sea = ctx.createLinearGradient(0, 360, 0, 480);
      sea.addColorStop(0, tm && tm.sea ? tm.sea : '#3fb6d9'); sea.addColorStop(1, '#2d9cc4');
      ctx.fillStyle = sea; ctx.fillRect(0, 360, W, 120);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0, 360, W, 10);
      ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 360); ctx.lineTo(W, 360); ctx.stroke();
      // a faraway island on the left with a striped lighthouse
      ctx.beginPath(); ctx.ellipse(250, 362, 60, 13, 0, Math.PI, 0); ctx.fillStyle = '#e9c97f'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(43,43,43,0.6)'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(240, 352); ctx.lineTo(244, 318); ctx.lineTo(256, 318); ctx.lineTo(260, 352); ctx.closePath();
      ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ef476f'; ctx.fillRect(242.5, 328, 15, 7); ctx.fillRect(241, 342, 18, 7);
      D.box(ctx, 242, 310, 16, 10, 3, '#ffd166', 2.5);
      ctx.beginPath(); ctx.moveTo(240, 310); ctx.lineTo(250, 301); ctx.lineTo(260, 310); ctx.closePath(); ctx.fillStyle = '#ef476f'; ctx.fill(); ctx.stroke();
      // the island on the right with its palm (as before)
      ctx.beginPath(); ctx.ellipse(880, 362, 70, 16, 0, Math.PI, 0); ctx.fillStyle = '#f4d58d'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      palm(ctx, 890, 360, 0.45, 0);
    } else if (theme === THEMES.autumn) {
      // far blue hills, then orange rolling hills dotted with round red / orange / gold trees, and a little red barn
      mountains(ctx, [[180, 420, 120], [560, 480, 150], [900, 380, 110]], 340, '#c3c8e8');
      hills(ctx, 360, 60, 260, theme.far, 0.6);
      for (let i = 0; i < 9; i++) {
        const x = 40 + i * 110 + rnd(i + 3) * 40;
        if (Math.abs(x - BARN.x) < 60) continue;
        const y = 362 - Math.abs(Math.sin(x / 260 + 0.6)) * 60 + 8;
        ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(43,43,43,0.45)';
        ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x, y - 12); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y - 22, 13 + rnd(i) * 5, 0, Math.PI * 2); ctx.fillStyle = AUTUMN_LEAVES[i % AUTUMN_LEAVES.length]; ctx.fill(); ctx.stroke();
      }
      barn(ctx, BARN.x, BARN.y);
    } else {
      // snowy mountains, the soft near snow hills, pines
      ctx.lineWidth = 4; ctx.strokeStyle = INK;
      mountains(ctx, [[120, 300, 200, '#dbe9f8'], [430, 360, 250, '#ffffff'], [760, 340, 210, '#dbe9f8'], [980, 260, 160, '#ffffff']], 420);
    }
  }
  function paintLand(ctx) {
    if (theme === THEMES.meadow) {
      hills(ctx, 400, 45, 220, theme.near, 1.7);
      // little grass tufts on the near hills
      for (let i = 0; i < 8; i++) tuft(ctx, 60 + i * 120 + rnd(i) * 40, 412 + rnd(i + 9) * 30, '#5aa95a');
    } else if (theme === THEMES.autumn) {
      hills(ctx, 405, 40, 230, theme.near, 2.2);
      for (let i = 0; i < 7; i++) tuft(ctx, 80 + i * 130 + rnd(i + 4) * 40, 418 + rnd(i + 11) * 26, '#c77a3a');
    } else if (theme === THEMES.snow) {
      hills(ctx, 410, 30, 260, '#eef5fd', 1.3);
      // a cozy cabin (its chimney smoke puffs live: drawSmoke)
      cabin(ctx, CABIN.x, CABIN.y);
    }
    // the ground (follows any hills)
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, groundAt(x));
    ctx.lineTo(W, H); ctx.closePath();
    ctx.fillStyle = theme.ground; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = theme.ground2; ctx.fillRect(0, GROUND + 38, W, H - GROUND - 38);
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, GROUND + 38); ctx.lineTo(W, GROUND + 38); ctx.stroke();
    // still ground decorations (flowers nod, so they are drawn live)
    if (theme === THEMES.beach) for (const x of [260, 470, 660]) shell(ctx, x, groundAt(x) + 16);
    if (theme === THEMES.beach) for (const x of [150, 560, 800]) starfish(ctx, x, groundAt(x) + 24);
    if (theme === THEMES.autumn) {
      // fallen leaves in the grass, and pumpkins
      for (let i = 0; i < 26; i++) { const x = rnd(i + 40) * W, y = groundAt(x) + 10 + rnd(i + 70) * 50; leaf(ctx, x, y, 6 + rnd(i) * 3, rnd(i + 5) * 6, AUTUMN_LEAVES[i % AUTUMN_LEAVES.length]); }
      for (const [x, s] of [[255, 1], [300, 0.7], [470, 0.85], [925, 1.1]]) pumpkin(ctx, x, groundAt(x) + 18, s);
    }
    if (theme === THEMES.snow) for (const x of [250, 460]) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x, groundAt(x) + 14, 20, 7, 0, 0, Math.PI * 2); ctx.fill(); }
  }
  const WMILL = { x: 600, y: 238 };   // windmill tower top (meadow, far hills)
  const CABIN = { x: 150, y: 408 };   // cabin bottom-middle (snow)
  const BARN = { x: 330, y: 330 };    // barn bottom-middle (autumn, far hills)
  const AUTUMN_LEAVES = ['#ef6c35', '#ffb703', '#d62828', '#f4a259', '#e9c46a'];

  function drawBackground(g, ctx) {
    const s = sceneFor(ctx), t = scT(), tm = timeOf(), lite = g && g.lite && g.lite();
    ctx.drawImage(s.sky, 0, 0, W, H);
    // slow clouds (follow the wind a little)
    for (const [x0, y, sc, v] of [[160, 120, 1.1, 6], [520, 90, 0.8, 4], [820, 150, 1.0, 5], [360, 190, 0.6, 3]]) {
      const x = ((x0 + t * (v + wind * 4)) % (W + 200) + W + 200) % (W + 200) - 100;
      cloud(ctx, x, y, sc, tm && tm.cloud);
    }
    if (theme === THEMES.beach) drawBoat(ctx, t);                     // far out on the sea, behind the far island
    D.layer(ctx, s.far, 0, 0, W, H);                 // (only the painted rows: Nov 24, point 9 part 2)
    ctx.lineJoin = 'round';
    if (theme === THEMES.meadow) { drawSails(ctx, t); drawBirds(ctx, t, '#4a4a6a'); }
    if (theme === THEMES.autumn) drawBirds(ctx, t + 9, '#4a4a6a');     // geese heading south
    if (theme === THEMES.beach) { drawWaves(ctx, t, lite); drawBirds(ctx, t, '#ffffff'); }
    D.layer(ctx, s.land, 0, 0, W, H);
    if (theme === THEMES.meadow) {
      for (const [x, y, sc, i] of [[300, 392, 1, 0], [905, 382, 1.2, 1], [690, 400, 0.8, 2]]) tree(ctx, x, y, sc, Math.sin(t * 0.9 + i * 1.7) * 0.03, tm);
      for (const [i, x] of [60, 250, 420, 610, 880].entries()) flower(ctx, x, groundAt(x) + 12, Math.sin(t * 1.6 + i) * 3);
    } else if (theme === THEMES.beach) {
      palm(ctx, 34, 470, 1, Math.sin(t * 0.8) * 0.035);
    } else if (theme === THEMES.autumn) {
      for (const [x, y, sc, i] of [[230, 396, 1.05, 0], [905, 384, 1.25, 1], [420, 404, 0.75, 2]]) autumnTree(ctx, x, y, sc, Math.sin(t * 0.9 + i * 1.7) * 0.03, i);
    } else {
      drawSmoke(ctx, t);
      for (const [x, y, sc] of [[300, 420, 1], [640, 414, 0.8], [915, 420, 1.1]]) pine(ctx, x, y, sc);
    }
  }

  // far mountains: [x, width, height (, color)] from a base line
  function mountains(ctx, list, base, color, cap) {
    for (const [x, w, h, c] of list) {
      ctx.beginPath(); ctx.moveTo(x - w / 2, base); ctx.quadraticCurveTo(x - w * 0.12, base - h * 0.9, x, base - h); ctx.quadraticCurveTo(x + w * 0.12, base - h * 0.9, x + w / 2, base);
      ctx.closePath(); ctx.fillStyle = c || color; ctx.fill();
      ctx.lineWidth = c ? 4 : 3.5; ctx.strokeStyle = c ? INK : 'rgba(43,43,43,0.3)'; ctx.stroke();
      if (cap) {   // a snowy cap
        ctx.save(); ctx.clip();
        ctx.beginPath(); ctx.moveTo(x - w * 0.3, base - h * 0.62);
        for (let i = 0; i <= 4; i++) ctx.lineTo(x - w * 0.3 + i * w * 0.15, base - h * (i % 2 ? 0.56 : 0.66));
        ctx.lineTo(x + w * 0.3, base - h - 10); ctx.lineTo(x - w * 0.3, base - h - 10); ctx.closePath();
        ctx.fillStyle = cap; ctx.fill(); ctx.restore();
      }
    }
  }
  function tuft(ctx, x, y, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const a of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + a * 6, y - 8, x + a * 12, y - 14); ctx.stroke(); }
  }
  function starfish(ctx, x, y) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 5 : 12; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.75); }
    ctx.closePath(); ctx.fillStyle = '#ff9f43'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
  }
  function cabin(ctx, x, y) {
    ctx.lineWidth = 3.5; ctx.strokeStyle = INK;
    D.box(ctx, x + 18, y - 76, 14, 30, 3, '#b5655a', 3);                  // chimney
    D.box(ctx, x - 40, y - 46, 80, 46, 6, '#c8814a', 3.5);                 // walls
    ctx.beginPath(); ctx.moveTo(x - 52, y - 42); ctx.lineTo(x, y - 82); ctx.lineTo(x + 52, y - 42); ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();                   // snowy roof
    D.box(ctx, x - 26, y - 34, 18, 16, 3, '#ffd166', 2.5);                 // a warm window
    D.box(ctx, x + 6, y - 30, 18, 30, 4, '#8a5a33', 2.5);                  // door
  }
  // the windmill's sails turn slowly
  function drawSails(ctx, t) {
    const a = t * 0.6;
    ctx.save(); ctx.translate(WMILL.x, WMILL.y + 8); ctx.rotate(a);
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath(); ctx.rect(3, -5, 40, 11); ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(43,43,43,0.6)'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(14, -5); ctx.lineTo(14, 6); ctx.moveTo(28, -5); ctx.lineTo(28, 6); ctx.stroke();
    }
    ctx.restore();
    D.circle(ctx, WMILL.x, WMILL.y + 8, 5, '#ffd166', 2.5);
  }
  // a little sailboat bobbing far out on the sea, slowly sailing across
  function drawBoat(ctx, t) {
    const x = ((t * 7 + 420) % (W + 160)) - 80, y = 362 + Math.sin(t * 1.4) * 1.5, tilt = Math.sin(t * 1.1) * 0.05;
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
    ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(43,43,43,0.75)';
    ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, -40); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, -38); ctx.lineTo(24, -8); ctx.lineTo(2, -8); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2, -32); ctx.lineTo(-16, -8); ctx.lineTo(-2, -8); ctx.closePath(); ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-22, -5); ctx.lineTo(26, -5); ctx.lineTo(18, 6); ctx.lineTo(-15, 6); ctx.closePath(); ctx.fillStyle = '#ef476f'; ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // little waves rolling on the sea + twinkles where the light catches it
  function drawWaves(ctx, t, lite) {
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const x = ((i * 130 + t * 12) % (W + 80)) - 40, y = 385 + (i % 3) * 22 + Math.sin(t * 1.3 + i) * 2;
      ctx.beginPath(); ctx.arc(x, y, 9, Math.PI * 1.1, Math.PI * 1.9); ctx.arc(x + 18, y, 9, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    }
    const gold = !!timeOf();
    for (let i = 0; i < (lite ? 6 : 12); i++) {
      const a = Math.max(0, Math.sin(t * 2 + i * 2.3));
      if (a < 0.2) continue;
      sparkle(ctx, 40 + rnd(i) * (W - 80), 372 + rnd(i + 30) * 95, 2 + a * 4, gold ? 'rgba(255,230,160,0.95)' : 'rgba(255,255,255,0.95)');
    }
  }
  // two or three birds (gulls at the beach) flapping across the sky now and then
  function drawBirds(ctx, t, color) {
    const span = W + 400, per = 26;                    // a flock crosses every 26 s
    const x0 = ((t * 55) % (per * 55)) - 200;
    if (x0 > span) return;
    ctx.strokeStyle = color === '#ffffff' ? 'rgba(43,43,43,0.7)' : color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < 3; i++) {
      const x = x0 - i * 34, y = 140 + i * 16 + Math.sin(t * 1.2 + i) * 6, f = Math.sin(t * 9 + i * 1.5) * 7;
      if (color === '#ffffff') {   // a white gull with a dark outline
        ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - 14, y - f); ctx.quadraticCurveTo(x - 6, y - 8, x, y); ctx.quadraticCurveTo(x + 6, y - 8, x + 14, y - f); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = 'rgba(43,43,43,0.7)';
      } else {
        ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(x - 11, y - f); ctx.quadraticCurveTo(x - 5, y - 6, x, y); ctx.quadraticCurveTo(x + 5, y - 6, x + 11, y - f); ctx.stroke();
      }
    }
  }
  // chimney smoke: soft puffs that rise, grow and fade (lean with the wind)
  function drawSmoke(ctx, t) {
    for (let i = 0; i < 5; i++) {
      const f = ((t * 0.35 + i / 5) % 1);
      const x = CABIN.x + 25 + f * (18 + wind * 10) + Math.sin(t + i) * 3, y = CABIN.y - 82 - f * 90, r = 6 + f * 12;
      ctx.globalAlpha = 0.75 * (1 - f);
      D.circle(ctx, x, y, r, '#c9d6e8', 0); D.circle(ctx, x - r * 0.25, y - r * 0.25, r * 0.6, '#e8eef7', 0);
    }
    ctx.globalAlpha = 1;
  }

  function hills(ctx, y0, amp, wl, color, off = 0) {
    ctx.beginPath(); ctx.moveTo(0, GROUND);
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, y0 - Math.abs(Math.sin(x / wl + off)) * amp);
    ctx.lineTo(W, GROUND); ctx.closePath();
    ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(43,43,43,0.3)'; ctx.stroke();
  }
  // a round tree; sway = a tiny lean (radians) from the trunk's foot; tm = time of day (warmer leaves)
  function tree(ctx, x, y, s, sway = 0, tm = null) {
    ctx.save(); ctx.translate(x, y + 6 * s); ctx.rotate(sway); ctx.translate(-x, -y - 6 * s);
    D.box(ctx, x - 7 * s, y - 40 * s, 14 * s, 46 * s, 5, '#a8683a', 3.5);
    D.circle(ctx, x, y - 62 * s, 32 * s, tm ? '#6fa856' : '#4fae5a', 3.5);
    D.circle(ctx, x - 12 * s, y - 70 * s, 7 * s, tm ? '#9cc46b' : '#6cc76f', 0);
    ctx.restore();
  }
  function pine(ctx, x, y, s) {
    D.box(ctx, x - 6 * s, y - 24 * s, 12 * s, 28 * s, 4, '#8a5a33', 3);
    for (let i = 0; i < 3; i++) {
      const w = (44 - i * 10) * s, top = y - (40 + i * 28) * s;
      ctx.beginPath(); ctx.moveTo(x - w, top + 34 * s); ctx.lineTo(x, top - 10 * s); ctx.lineTo(x + w, top + 34 * s); ctx.closePath();
      ctx.fillStyle = '#2f8f5b'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - w * 0.45, top + 6 * s); ctx.lineTo(x, top - 10 * s); ctx.lineTo(x + w * 0.45, top + 6 * s); ctx.closePath();
      ctx.fillStyle = '#ffffff'; ctx.fill();
    }
  }
  // a palm tree; sway bends the leaves a little (radians)
  function palm(ctx, x, y, s, sway = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineCap = 'round';
    const tx = 30 + sway * 120, ty = -170;     // the top of the trunk leans with the breeze
    ctx.strokeStyle = INK; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, -90, tx, ty); ctx.stroke();
    ctx.strokeStyle = '#c98b4f'; ctx.lineWidth = 11; ctx.stroke();
    for (const [i, a0] of [-2.8, -2.2, -1.5, -0.9, -0.3].entries()) {
      const a = a0 + sway * (1.5 + i * 0.4);
      ctx.beginPath(); ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(tx + Math.cos(a) * 50, ty + Math.sin(a) * 50 - 16, tx + Math.cos(a) * 80, ty + Math.sin(a) * 80 + 20);
      ctx.strokeStyle = INK; ctx.lineWidth = 16; ctx.stroke();
      ctx.strokeStyle = '#3fae5a'; ctx.lineWidth = 10; ctx.stroke();
    }
    D.circle(ctx, tx - 6, ty + 8, 8, '#8a5a33', 3); D.circle(ctx, tx + 8, ty + 10, 8, '#8a5a33', 3);
    ctx.restore();
  }
  // a little flower; nod = how far its head leans (px)
  function flower(ctx, x, y, nod = 0) {
    ctx.strokeStyle = '#3f8f3f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y + 10); ctx.quadraticCurveTo(x, y + 4, x + nod, y); ctx.stroke();
    x += nod;
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; D.circle(ctx, x + Math.cos(a) * 6, y + Math.sin(a) * 6, 5, '#ffffff', 2); }
    D.circle(ctx, x, y, 4, '#ffd166', 2);
  }
  function shell(ctx, x, y) {
    ctx.beginPath(); ctx.moveTo(x - 12, y + 6); ctx.quadraticCurveTo(x, y - 18, x + 12, y + 6); ctx.closePath();
    ctx.fillStyle = '#ffafcc'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  }

  // ---- Autumn Woods bits ----
  // a leaf: a pointy oval with a middle line; rot in radians
  function leaf(ctx, x, y, s, rot, color) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.moveTo(-s, 0); ctx.quadraticCurveTo(0, -s * 0.8, s, 0); ctx.quadraticCurveTo(0, s * 0.8, -s, 0); ctx.closePath();
    ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = 'rgba(43,43,43,0.7)'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s * 0.8, 0); ctx.lineTo(s * 0.7, 0); ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  }
  function pumpkin(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    D.box(ctx, -3, -34, 7, 12, 3, '#6a8f3a', 2.5);                       // stem
    for (const [dx, w] of [[-12, 15], [12, 15], [0, 15]]) {             // three lobes, the middle in front
      ctx.beginPath(); ctx.ellipse(dx, -12, w, 16, 0, 0, Math.PI * 2);
      ctx.fillStyle = ballFill(ctx, dx, -12, 16, '#f78c1e'); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    }
    ctx.restore();
  }
  function barn(ctx, x, y) {
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(43,43,43,0.6)';
    D.box(ctx, x + 30, y - 66, 22, 66, 10, '#c9d6df', 3);                 // silo
    ctx.beginPath(); ctx.arc(x + 41, y - 64, 11, Math.PI, 0); ctx.fillStyle = '#9aa9b5'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x - 30, y - 34); ctx.lineTo(x, y - 54); ctx.lineTo(x + 30, y - 34); ctx.lineTo(x + 30, y); ctx.closePath();
    ctx.fillStyle = '#d64545'; ctx.fill(); ctx.stroke();                     // the barn
    ctx.beginPath(); ctx.moveTo(x - 33, y - 33); ctx.lineTo(x, y - 56); ctx.lineTo(x + 33, y - 33); ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    D.box(ctx, x - 11, y - 24, 22, 24, 3, '#ffffff', 2.5);
    ctx.strokeStyle = '#d64545'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 9, y - 22); ctx.lineTo(x + 9, y - 2); ctx.moveTo(x + 9, y - 22); ctx.lineTo(x - 9, y - 2); ctx.stroke();
  }
  // a round autumn tree (red, orange or gold crown); sway = a tiny lean (radians)
  function autumnTree(ctx, x, y, s, sway, i) {
    const col = ['#ef6c35', '#ffb703', '#d62828'][i % 3];
    ctx.save(); ctx.translate(x, y + 6 * s); ctx.rotate(sway); ctx.translate(-x, -y - 6 * s);
    D.box(ctx, x - 8 * s, y - 44 * s, 16 * s, 50 * s, 5, '#8a5a33', 3.5);
    for (const [dx, dy, r] of [[-20, -62, 24], [20, -64, 24], [0, -84, 28]]) {
      ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
      ctx.fillStyle = ballFill(ctx, x + dx * s, y + dy * s, r * s, col, 0.35, 0.12); ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
    }
    D.circle(ctx, x - 6 * s, y - 92 * s, 6 * s, mix(col, '#ffffff', 0.45), 0);
    ctx.restore();
  }

  // Wind streaks + things floating about. Everything is worked out from the scenery clock
  // (no hidden state), so it stands still in Calm motion. Floaters hide in Calm motion; the
  // wind streaks stay (they tell you about the wind), just still.
  function drawAir(ctx, g) {
    const t = scT(), calm = calmNow(), lite = g && g.lite && g.lite();
    if (wind) {
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      const dir = Math.sign(wind), len = 30 + Math.abs(wind) * 14;
      for (let i = 0; i < 7; i++) {
        const span = W + 200;
        const x = ((i * 157 + t * dir * (120 + Math.abs(wind) * 60)) % span + span) % span - 100;
        const y = 120 + (i * 53) % 230;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + dir * len / 2, y - 6, x + dir * len, y); ctx.stroke();
      }
    }
    if (calm) return;
    const wrap = (v, n) => ((v % n) + n) % n;
    if (theme === THEMES.snow) {
      // snowflakes drift down and follow the wind
      ctx.fillStyle = '#ffffff';
      for (let i = 0, n = lite ? 18 : 36; i < n; i++) {
        const s = 2 + rnd(i) * 3, x = wrap(rnd(i + 50) * W + t * (wind * 40 + 8) + Math.sin(t + i) * 8, W + 20) - 10, y = wrap(rnd(i + 99) * H + t * (30 + s * 6), H);
        ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
      }
    } else if (theme === THEMES.autumn) {
      // leaves tumble down, rocking side to side, and follow the wind
      for (let i = 0, n = lite ? 9 : 18; i < n; i++) {
        const s = 6 + rnd(i) * 4, x = wrap(rnd(i + 50) * W + t * (wind * 35 + 10) + Math.sin(t * 1.4 + i) * 22, W + 30) - 15, y = wrap(rnd(i + 99) * H + t * (24 + s * 2), H + 20) - 10;
        leaf(ctx, x, y, s, Math.sin(t * 2 + i) * 1.1 + i, AUTUMN_LEAVES[i % AUTUMN_LEAVES.length]);
      }
      // sunset: a few fireflies come out
      if (timeOf()) for (let i = 0, n = lite ? 4 : 8; i < n; i++) {
        const a = Math.max(0, Math.sin(t * 1.7 + i * 2.1));
        if (a < 0.15) continue;
        const x = 40 + rnd(i + 7) * (W - 80) + Math.sin(t * 0.6 + i) * 20, y = 340 + rnd(i + 17) * 100 + Math.cos(t * 0.8 + i) * 10;
        ctx.globalAlpha = a; D.circle(ctx, x, y, 7, 'rgba(255,240,140,0.35)', 0); D.circle(ctx, x, y, 3, '#fff6a8', 0); ctx.globalAlpha = 1;
      }
    } else if (theme === THEMES.meadow) {
      // petals drift by
      ctx.fillStyle = '#ffd6e8';
      for (let i = 0, n = lite ? 5 : 10; i < n; i++) {
        const s = 2 + rnd(i) * 3, x = wrap(rnd(i + 50) * W + t * (wind * 40 + 14), W + 20) - 10, y = wrap(rnd(i + 99) * H * 0.7 + Math.sin(t + i * 6) * 12 + t * 4, H * 0.7);
        ctx.beginPath(); ctx.ellipse(x, y, s + 1, s * 0.6, i + t, 0, Math.PI * 2); ctx.fill();
      }
      // two butterflies flutter low over the grass
      for (let i = 0; i < 2; i++) {
        const x = wrap(200 + i * 430 + t * (18 + i * 6), W + 80) - 40, y = 410 + Math.sin(t * 1.3 + i * 2) * 22 + i * 18;
        butterfly(ctx, x, y, Math.abs(Math.sin(t * 10 + i)), i ? '#ffd166' : '#f78fb3');
      }
      // evening: fireflies blink among the trees
      if (timeOf()) for (let i = 0, n = lite ? 5 : 10; i < n; i++) {
        const a = Math.max(0, Math.sin(t * 1.7 + i * 2.1));
        if (a < 0.15) continue;
        const x = 40 + rnd(i + 7) * (W - 80) + Math.sin(t * 0.6 + i) * 20, y = 330 + rnd(i + 17) * 110 + Math.cos(t * 0.8 + i) * 10;
        ctx.globalAlpha = a; D.circle(ctx, x, y, 7, 'rgba(255,240,140,0.35)', 0); D.circle(ctx, x, y, 3, '#fff6a8', 0); ctx.globalAlpha = 1;
      }
    }
  }
  function butterfly(ctx, x, y, open, color) {
    const w = 3 + open * 6;
    ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.fillStyle = color;
    for (const sd of [-1, 1]) {
      ctx.beginPath(); ctx.ellipse(x + sd * w * 0.8, y - 3, w, 6, sd * 0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x + sd * w * 0.6, y + 4, w * 0.7, 4, -sd * 0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6); ctx.stroke();
  }

  // For tests/test_living_scenery.py + tools/preview_archery_scenery.py: draw any place at any moment
  window.__archeryScene = {
    W, H,
    levels: LEVELS.concat([PRACTICE]).concat(FR_LEVELS).map(l => ({ id: l.id, theme: l.theme, time: l.time || null })),
    draw(ctx, id, t, airToo = true) {
      const keep = [L, theme, clock, wind];
      L = LEVELS.concat([PRACTICE], FR_LEVELS).find(l => l.id === id) || LEVELS[0];
      theme = THEMES[L.theme]; clock = t; wind = L.wind;
      drawBackground(null, ctx); if (airToo) drawAir(ctx, null);
      [L, theme, clock, wind] = keep;
    },
    cached: () => [...scenes.keys()],
    level: (id) => LEVELS.concat([PRACTICE, WINTER_LEVEL], FR_LEVELS).find(l => l.id === id),   // for __game.play() in tests
  };

  // ---------------------------------------------------------------
  // Drawing: targets, balloons, stars, wheels
  // ---------------------------------------------------------------
  function drawThing(ctx, t) {
    const p = posOf(t, clock);
    if (t.kind === 'snowman') { drawSnowman(ctx, t, p); return; }
    if (t.kind === 'ring') drawRing(ctx, t, p);
    else if (t.kind === 'wheel') drawWheel(ctx, t, p);
    else if (!t.alive) return;
    else if (t.kind === 'balloon') drawBalloon(ctx, t, p);
    else drawStar(ctx, t, p);
  }

  // ---- little color helpers for the shading ----
  // mix('#ef476f', '#ffffff', 0.4) = 40% of the way to white
  function mix(a, b, k) {
    const h = (s) => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
    const A = h(a), B = h(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
  }
  // a soft ball shading: light up top-left, a bit darker at the bottom-right edge
  function ballFill(ctx, x, y, r, col, light = 0.45, dark = 0.15) {
    const gr = ctx.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.05, x, y, r * 1.25);
    gr.addColorStop(0, mix(col, '#ffffff', light)); gr.addColorStop(0.5, col); gr.addColorStop(1, mix(col, '#000000', dark));
    return gr;
  }
  const calmNow = () => Arcade.calm && Arcade.calm();
  // a wooden plank between two points (outline, wood, a light streak)
  function plank(ctx, x1, y1, x2, y2, w = 7) {
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = INK; ctx.lineWidth = w + 6; ctx.stroke();
    ctx.strokeStyle = '#b77940'; ctx.lineWidth = w; ctx.stroke();
    ctx.strokeStyle = '#d9a066'; ctx.lineWidth = 2; ctx.stroke();
  }

  // the wooden easel a target stands on: two legs, a crossbar and little feet
  function drawEasel(ctx, x, y, gy, r) {
    const fx = r * 0.58, bar = Math.max(y + r * 0.75, gy - 18);
    plank(ctx, x - 6, y, x - fx, gy - 2);
    plank(ctx, x + 6, y, x + fx, gy - 2);
    plank(ctx, x - fx * 0.82, bar, x + fx * 0.82, bar, 6);
    for (const s of [-1, 1]) D.box(ctx, x + s * fx - 9, gy - 6, 18, 9, 4, '#8a5a33', 3);
  }
  // a candy-striped pole that slides the target up and down, on a wooden base
  function drawPole(ctx, x, y, gy) {
    D.box(ctx, x - 7, y, 14, gy - y, 6, '#ffffff', 4);
    ctx.save(); D.rr(ctx, x - 5, y + 2, 10, gy - y - 4, 4); ctx.clip();
    ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 5;
    for (let sy = y - 20; sy < gy; sy += 16) { ctx.beginPath(); ctx.moveTo(x - 8, sy); ctx.lineTo(x + 8, sy + 10); ctx.stroke(); }
    ctx.restore();
    D.box(ctx, x - 26, gy - 16, 52, 18, 8, '#8a5a33', 4);
    D.box(ctx, x - 18, gy - 22, 36, 10, 5, '#b77940', 3);
    D.circle(ctx, x, gy - 7, 3, '#ffd166', 2);
  }
  // the little cart (wheels roll as it moves; a flag waves)
  function drawCart(ctx, x, gy) {
    // flag on the back corner
    const fx = x + 44, top = gy - 124, wv = calmNow() ? 0 : Math.sin(clock * 5) * 4;
    ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(fx, gy - 42); ctx.lineTo(fx, top); ctx.stroke();
    ctx.strokeStyle = '#c9d6df'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fx, top + 2); ctx.quadraticCurveTo(fx + 14, top + 4 + wv, fx + 28, top + 10 + wv * 0.5);
    ctx.quadraticCurveTo(fx + 14, top + 14 - wv * 0.5, fx, top + 20); ctx.closePath();
    ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke();
    D.circle(ctx, fx, top - 2, 4, '#ef476f', 2.5);
    // body: red with a gold band and rivets
    D.box(ctx, x - 48, gy - 46, 96, 32, 11, '#ef476f', 4);
    D.box(ctx, x - 44, gy - 34, 88, 8, 4, '#ffd166', 2.5);
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; D.rr(ctx, x - 40, gy - 42, 60, 5, 2.5); ctx.fill();
    // wheels with spokes that turn with the cart
    const turn = x / 12;
    for (const wx of [-28, 28]) {
      const cx = x + wx, cy = gy - 12;
      D.circle(ctx, cx, cy, 12, '#3a3a3a', 4);
      ctx.strokeStyle = '#c9d6df'; ctx.lineWidth = 2.5;
      for (let k = 0; k < 3; k++) {
        const a = turn + k * Math.PI / 3;
        ctx.beginPath(); ctx.moveTo(cx - Math.cos(a) * 8, cy - Math.sin(a) * 8); ctx.lineTo(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8); ctx.stroke();
      }
      D.circle(ctx, cx, cy, 4, '#ffd166', 2);
    }
  }

  // the wooden swing frame (two A-shaped legs + a top bar with a few autumn leaves) and the two ropes
  function drawSwing(ctx, t, p) {
    const sw = t.swing, half = Math.sin(sw.amp) * sw.len + t.r + 34, top = sw.top;
    for (const s of [-1, 1]) {
      const fx = t.x + s * half, gy = groundAt(fx);
      plank(ctx, fx, top, fx - 26, gy - 2, 8); plank(ctx, fx, top, fx + 26, gy - 2, 8);
      plank(ctx, fx - 13, (top + gy) / 2 + 20, fx + 13, (top + gy) / 2 + 20, 5);
      for (const k of [-1, 1]) D.box(ctx, fx + k * 26 - 9, gy - 6, 18, 9, 4, '#8a5a33', 3);
    }
    plank(ctx, t.x - half - 12, top, t.x + half + 12, top, 10);
    // a little leaf garland on the bar
    for (let i = 0; i < 7; i++) {
      const lx = t.x - half + (i + 0.5) * (half * 2 / 7);
      leaf(ctx, lx, top + 9, 9, (i % 2 ? 0.6 : -0.6), AUTUMN_LEAVES[i % AUTUMN_LEAVES.length]);
    }
    // the ropes from the bar to each side of the target's top
    const a = Math.atan2(p.x - t.x, p.y - top), ex = Math.cos(a) * t.r * 0.45, ey = -Math.sin(a) * t.r * 0.45;
    for (const s of [-1, 1]) {
      const bx = t.x + s * 14, rx = p.x + s * ex, ry = p.y - t.r + 6 + s * ey;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bx, top); ctx.lineTo(rx, ry);
      ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.stroke();
      ctx.strokeStyle = '#e9c98f'; ctx.lineWidth = 3.5; ctx.stroke();
    }
    D.circle(ctx, t.x - 14, top, 5, '#ffd166', 2.5); D.circle(ctx, t.x + 14, top, 5, '#ffd166', 2.5);
  }
  function drawRing(ctx, t, p) {
    const gy = groundAt(p.x);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // what holds it up: a cart, a sliding pole, or a wooden easel
    if (t.swing) drawSwing(ctx, t, p);
    else if (t.cart) drawCart(ctx, p.x, gy);
    else if (t.move && t.move.ax === 'y') drawPole(ctx, p.x, p.y, gy);
    else drawEasel(ctx, p.x, p.y, gy, t.r);
    // arrows on the far side are drawn first so the face covers them
    for (const a of arrows) if (a.on === t && a.state === 'stuck' && stuckFacing(a, p) < 0) drawStuck(ctx, a);
    // the face: an oval (we see it a little from the side). Spinners squash as they turn.
    const k = Math.abs(p.face);
    const rx = Math.max(5, t.r * 0.62 * k), ry = t.r;
    // the thick straw back, peeking out on one side, with straw stitches
    const ex = p.x + 8 * (t.spin ? Math.sin(clock * t.spin + t.ph) : 1);
    ctx.beginPath(); ctx.ellipse(ex, p.y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#e9b949'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.strokeStyle = '#b9862c'; ctx.lineWidth = 2;
    const side = ex >= p.x ? 1 : -1;
    for (let i = -3; i <= 3; i++) {
      const a = i * 0.36, cx = ex + side * Math.cos(a) * rx, cy = p.y + Math.sin(a) * ry;
      ctx.beginPath(); ctx.moveTo(cx - side * 6, cy); ctx.lineTo(cx - side * 1, cy); ctx.stroke();
    }
    // the rings, each softly shaded (lighter up top-left)
    for (let i = 4; i >= 0; i--) {
      const f = (i + 1) / 5;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, rx * f, ry * f, 0, 0, Math.PI * 2);
      const gr = ctx.createRadialGradient(p.x - rx * 0.3, p.y - ry * 0.4, 1, p.x, p.y, ry * 1.1);
      gr.addColorStop(0, mix(RING_COLORS[i], '#ffffff', 0.4)); gr.addColorStop(1, i === 4 ? '#e9eef3' : RING_COLORS[i]);
      ctx.fillStyle = gr; ctx.fill();
      ctx.lineWidth = i === 4 ? 4 : 2.5; ctx.strokeStyle = INK; ctx.stroke();
    }
    if (k > 0.5) {
      // a curved shine along the top-left edge + a twinkle on the bullseye
      ctx.beginPath(); ctx.ellipse(p.x, p.y, rx * 0.82, ry * 0.86, 0, Math.PI * 1.1, Math.PI * 1.38);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = Math.max(2, t.r * 0.07); ctx.stroke();
      const tw = calmNow() ? 1 : 0.75 + 0.25 * Math.sin(clock * 4 + t.ph);
      sparkle(ctx, p.x - rx * 0.06, p.y - ry * 0.07, ry * 0.1 * tw, '#ffffff');
    }
    for (const a of arrows) if (a.on === t && a.state === 'stuck' && stuckFacing(a, p) >= 0) drawStuck(ctx, a);
  }
  // +1 if the stuck arrow's side of the target faces us right now
  function stuckFacing(a, p) { return a.side * p.face; }
  // a 4-point twinkle
  function sparkle(ctx, x, y, s, col) {
    ctx.beginPath();
    ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s, y); ctx.quadraticCurveTo(x, y, x, y + s);
    ctx.quadraticCurveTo(x, y, x - s, y); ctx.quadraticCurveTo(x, y, x, y - s);
    ctx.fillStyle = col; ctx.fill();
  }

  function drawWheel(ctx, t, p) {
    const gy = groundAt(p.x);
    // stand: an A-frame with a crossbar
    plank(ctx, p.x - 4, p.y, p.x - t.R * 0.5, gy - 2, 8);
    plank(ctx, p.x + 4, p.y, p.x + t.R * 0.5, gy - 2, 8);
    plank(ctx, p.x - t.R * 0.38, gy - 22, p.x + t.R * 0.38, gy - 22, 6);
    // a red rim with light bulbs round it
    D.circle(ctx, p.x, p.y, t.R + 10, '#ef476f', 5);
    const n = t.segs.length, step = Math.PI * 2 / n;
    for (let i = 0; i < n; i++) {
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.arc(p.x, p.y, t.R, p.rot + i * step, p.rot + (i + 1) * step); ctx.closePath();
      const col = SEG_COLORS[t.segs[i]] || '#ffffff';
      ctx.fillStyle = i % 2 ? col : mix(col, '#ffffff', 0.18); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      const mid = p.rot + (i + 0.5) * step;
      const lx = p.x + Math.cos(mid) * t.R * 0.64, ly = p.y + Math.sin(mid) * t.R * 0.64;
      if (t.segs[i] >= 10) D.star(ctx, lx, ly, t.R * 0.2, '#fff3b0', 2.5);
      else D.text(ctx, String(t.segs[i]), lx, ly, { size: Math.round(t.R * 0.3), lineWidth: 4 });
    }
    // a soft shine over the whole face
    const sh = ctx.createRadialGradient(p.x - t.R * 0.4, p.y - t.R * 0.45, 2, p.x, p.y, t.R);
    sh.addColorStop(0, 'rgba(255,255,255,0.45)'); sh.addColorStop(0.6, 'rgba(255,255,255,0)');
    ctx.beginPath(); ctx.arc(p.x, p.y, t.R, 0, Math.PI * 2); ctx.fillStyle = sh; ctx.fill();
    D.circle(ctx, p.x, p.y, t.R, null, 5);
    // bulbs: every third one is lit, and the lit ones run round (still in Calm motion)
    const bulbs = 16, run = calmNow() ? 0 : Math.floor(clock * 7);
    for (let i = 0; i < bulbs; i++) {
      const a = i / bulbs * Math.PI * 2, on = (i + run) % 3 === 0;
      const bx = p.x + Math.cos(a) * (t.R + 5), by = p.y + Math.sin(a) * (t.R + 5);
      if (on) D.circle(ctx, bx, by, 6.5, '#ffe066', 0);
      D.circle(ctx, bx, by, 3.4, on ? '#ffffff' : '#ff9f1c', 1.5);
    }
    // hub: a gold button with a star
    ctx.beginPath(); ctx.arc(p.x, p.y, 13, 0, Math.PI * 2); ctx.fillStyle = ballFill(ctx, p.x, p.y, 13, '#ffd166'); ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    D.star(ctx, p.x, p.y, 7, '#fff3b0', 1.5);
    for (const a of arrows) if (a.on === t && a.state === 'stuck') drawStuck(ctx, a);
  }

  // The balloon outline: round on top, narrowing to the knot (r = its size)
  function balloonPath(ctx, r) {
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.1);
    ctx.bezierCurveTo(r * 0.62, -r * 1.1, r * 0.98, -r * 0.6, r * 0.9, -r * 0.08);
    ctx.bezierCurveTo(r * 0.83, r * 0.48, r * 0.32, r * 0.96, 0, r * 1.08);
    ctx.bezierCurveTo(-r * 0.32, r * 0.96, -r * 0.83, r * 0.48, -r * 0.9, -r * 0.08);
    ctx.bezierCurveTo(-r * 0.98, -r * 0.6, -r * 0.62, -r * 1.1, 0, -r * 1.1);
    ctx.closePath();
  }
  function heartPath(ctx, x, y, s) {
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.3, y, x - s * 0.7, y - s * 1.0, x, y - s * 0.35);
    ctx.bezierCurveTo(x + s * 0.7, y - s * 1.0, x + s * 1.3, y, x, y + s * 0.9);
    ctx.closePath();
  }
  // a picture on the balloon (clipped inside it): heart, dots, star, stripes or none
  function balloonPattern(ctx, r, pat) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    if (pat === 'heart') heartPath(ctx, r * 0.08, r * 0.05, r * 0.36), ctx.fill();
    else if (pat === 'star') { D.starPath(ctx, r * 0.06, r * 0.04, r * 0.4, r * 0.19); ctx.fill(); }
    else if (pat === 'dots') for (const [dx, dy] of [[0.35, -0.5], [-0.15, 0.05], [0.5, 0.25], [-0.6, 0.3], [0.1, 0.62], [-0.45, -0.45]]) {
      ctx.beginPath(); ctx.arc(dx * r, dy * r, r * 0.12, 0, Math.PI * 2); ctx.fill();
    }
    else if (pat === 'stripes') {
      ctx.lineWidth = r * 0.17;
      for (const sy of [-0.38, 0.28]) { ctx.beginPath(); ctx.moveTo(-r, sy * r - r * 0.12); ctx.quadraticCurveTo(0, sy * r + r * 0.14, r, sy * r - r * 0.12); ctx.stroke(); }
    }
  }

  function drawBalloon(ctx, t, p) {
    const r = t.r, still = calmNow();
    const tilt = still ? 0 : Math.sin(clock * 1.3 + t.ph) * 0.08;
    // a curly ribbon (outline first, then the balloon's color)
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const f = i / 16;
      pts.push([p.x + Math.sin(i * 0.9 + (still ? 0 : clock * 3) + t.ph) * (2 + f * 5) - tilt * r * (1 - f), p.y + r * 1.2 + i * 3.4]);
    }
    for (const [w, c] of [[4.5, INK], [2, mix(t.color, '#ffffff', 0.25)]]) {
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.lineWidth = w; ctx.strokeStyle = c; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    }
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(tilt);
    // knot
    ctx.beginPath(); ctx.moveTo(-r * 0.22, r * 1.24); ctx.quadraticCurveTo(0, r * 1.02, r * 0.22, r * 1.24); ctx.quadraticCurveTo(0, r * 1.16, -r * 0.22, r * 1.24); ctx.closePath();
    ctx.fillStyle = mix(t.color, '#000000', 0.12); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    // body, shaded like a shiny ball, with its picture
    balloonPath(ctx, r);
    ctx.fillStyle = ballFill(ctx, 0, 0, r, t.color, 0.5, 0.2); ctx.fill();
    ctx.save(); balloonPath(ctx, r); ctx.clip(); balloonPattern(ctx, r, t.pat); ctx.restore();
    balloonPath(ctx, r); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    // shine: a long soft streak + a little dot
    ctx.beginPath(); ctx.ellipse(-r * 0.42, -r * 0.48, r * 0.13, r * 0.3, 0.45, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
    D.circle(ctx, -r * 0.2, -r * 0.84, r * 0.07, 'rgba(255,255,255,0.85)', 0);
    ctx.restore();
  }

  // Winter Wonderland: a snowman (3 snowballs, coal eyes, a carrot nose, a red scarf, stick arms) and his
  // top hat (the target). Once the hat is hit he has no hat, and the hat tumbles away (hatsOff).
  const SNOWMAN_H = 112;
  let hatsOff = [];
  function topHat(ctx, x, y, r, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
    D.box(ctx, -r * 1.05, r * 0.35, r * 2.1, r * 0.32, r * 0.12, '#2b2d42', 3);
    D.box(ctx, -r * 0.7, -r * 0.75, r * 1.4, r * 1.15, r * 0.14, '#2b2d42', 3);
    ctx.fillStyle = '#ef476f'; ctx.fillRect(-r * 0.7 + 2, r * 0.05, r * 1.4 - 4, r * 0.24);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-r * 0.5, -r * 0.6, r * 0.18, r * 0.6);
    ctx.restore();
  }
  function drawSnowman(ctx, t, p) {
    const gy = groundAt(t.x), x = p.x, sway = p.rot;
    ctx.save(); ctx.translate(x, gy); ctx.rotate(sway); ctx.translate(-x, -gy);
    ctx.fillStyle = 'rgba(60,90,140,0.18)'; ctx.beginPath(); ctx.ellipse(x, gy + 2, 44, 9, 0, 0, Math.PI * 2); ctx.fill();
    // stick arms (behind the middle ball)
    ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 20, gy - 66); ctx.lineTo(x - 52, gy - 86); ctx.moveTo(x - 42, gy - 80); ctx.lineTo(x - 48, gy - 96);
    ctx.moveTo(x + 20, gy - 66); ctx.lineTo(x + 52, gy - 84); ctx.moveTo(x + 42, gy - 79); ctx.lineTo(x + 50, gy - 94); ctx.stroke();
    D.circle(ctx, x, gy - 30, 34, '#ffffff', 4);
    D.circle(ctx, x, gy - 70, 26, '#ffffff', 4);
    for (const by of [-76, -60, -36]) D.circle(ctx, x, gy + by, 3.5, INK, 0);          // coal buttons
    D.box(ctx, x - 21, gy - 97, 42, 11, 5, '#ef476f', 3);                               // the scarf (under the head)
    const hy = gy - SNOWMAN_H + 4;
    D.circle(ctx, x, hy, 20, '#ffffff', 4);
    D.circle(ctx, x - 7, hy - 3, 3.2, INK, 0); D.circle(ctx, x + 7, hy - 3, 3.2, INK, 0);
    D.circle(ctx, x - 6, hy - 4, 1.1, '#fff', 0); D.circle(ctx, x + 8, hy - 4, 1.1, '#fff', 0);
    ctx.beginPath(); ctx.moveTo(x, hy + 1); ctx.lineTo(x + 18, hy + 4); ctx.lineTo(x, hy + 7); ctx.closePath(); ctx.fillStyle = '#ff8c42'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, hy + 6, 8, 0.2 * Math.PI, 0.8 * Math.PI); ctx.lineWidth = 2.5; ctx.stroke();
    D.box(ctx, x + 7, gy - 92, 10, 22, 4, '#ef476f', 3);                                // (the scarf's end)
    ctx.restore();
    if (t.alive) topHat(ctx, p.x, p.y, t.r, p.rot);
  }
  // hats that were hit tumble away (and fade)
  function drawHatsOff(ctx, dt) {
    for (const h of hatsOff) { h.t += dt; h.vy += 700 * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.a += 6 * dt; }
    hatsOff = hatsOff.filter(h => h.t < 1.2);
    for (const h of hatsOff) { ctx.globalAlpha = Math.max(0, 1 - h.t / 1.2); topHat(ctx, h.x, h.y, 20, h.a); }
    ctx.globalAlpha = 1;
  }
  function drawStar(ctx, t, p) {
    const still = calmNow(), r = t.r;
    // soft glow
    const gl = ctx.createRadialGradient(p.x, p.y, r * 0.4, p.x, p.y, r * 2);
    gl.addColorStop(0, 'rgba(255,230,120,0.6)'); gl.addColorStop(1, 'rgba(255,230,120,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(p.x, p.y, r * 2 + (still ? 0 : Math.sin(clock * 5) * 3), 0, Math.PI * 2); ctx.fill();
    // two twinkles that circle round it
    for (let i = 0; i < 2; i++) {
      const a = (still ? 0.6 : clock * 1.4) + i * Math.PI;
      sparkle(ctx, p.x + Math.cos(a) * r * 1.7, p.y + Math.sin(a) * r * 1.5, r * (0.28 + 0.1 * Math.sin(clock * 6 + i * 2)), '#fffbe0');
    }
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(p.rot) * 0.3);
    // body: a chubby star, shaded gold
    D.starPath(ctx, 0, 0, r * 1.25, r * 0.66);
    ctx.fillStyle = ballFill(ctx, 0, 0, r * 1.1, '#ffc93c', 0.55, 0.12); ctx.fill();
    ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-r * 0.32, -r * 0.42, r * 0.09, r * 0.2, 0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
    // face: big eyes with shine dots (it blinks), rosy cheeks, a smile
    const blink = !still && (clock + t.ph) % 3.2 < 0.12;
    for (const ex of [-0.26, 0.26]) {
      if (blink) { ctx.beginPath(); ctx.moveTo(ex * r - r * 0.1, -r * 0.02); ctx.lineTo(ex * r + r * 0.1, -r * 0.02); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke(); continue; }
      ctx.beginPath(); ctx.ellipse(ex * r, -r * 0.04, r * 0.11, r * 0.15, 0, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
      D.circle(ctx, ex * r + r * 0.04, -r * 0.1, r * 0.045, '#ffffff', 0);
    }
    for (const cx of [-0.45, 0.45]) D.circle(ctx, cx * r, r * 0.17, r * 0.1, 'rgba(255,120,150,0.6)', 0);
    ctx.beginPath(); ctx.arc(0, r * 0.12, r * 0.17, 0.25, Math.PI - 0.25); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
  }

  // the quick "POP!" burst where a balloon was (lines flying out + a bright flash)
  // For tools/preview_archery.py: draw any target / balloon / star / wheel at a moment in time
  window.__archeryArt = {
    draw(ctx, t, time) { const c0 = clock; clock = time; drawThing(ctx, t); clock = c0; },
    pop(ctx, x, y, color, t) { const p0 = pops; pops = [{ x, y, color, t }]; drawPops(ctx); pops = p0; },
    RING_COLORS, BALLOON_COLORS, BALLOON_PATS, GROUND,
  };

  function drawPops(ctx) {
    for (const b of pops) {
      const f = b.t / 0.35;
      ctx.globalAlpha = Math.max(0, 1 - f);
      D.circle(ctx, b.x, b.y, 8 + f * 30, 'rgba(255,255,255,0.7)', 0);
      ctx.strokeStyle = b.color; ctx.lineWidth = 5; ctx.lineCap = 'round';
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2 + 0.2, r1 = 14 + f * 46, r2 = r1 + 12 - f * 6;
        ctx.beginPath(); ctx.moveTo(b.x + Math.cos(a) * r1, b.y + Math.sin(a) * r1); ctx.lineTo(b.x + Math.cos(a) * r2, b.y + Math.sin(a) * r2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  // ---------------------------------------------------------------
  // Drawing: arrows
  // ---------------------------------------------------------------
  // An arrow pointing along +x with its tip at (0,0). head=false = tip is buried.
  // color: friends games paint the feathers in the shooter's color (whose arrow is whose)
  function arrowShape(ctx, len, head = true, color = null) {
    ctx.lineJoin = 'round';
    // fletching (feathers)
    ctx.beginPath(); ctx.moveTo(-len + 2, 0); ctx.lineTo(-len - 4, -8); ctx.lineTo(-len + 12, -8); ctx.lineTo(-len + 16, 0); ctx.closePath();
    ctx.fillStyle = color || '#ef476f'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-len + 2, 0); ctx.lineTo(-len - 4, 8); ctx.lineTo(-len + 12, 8); ctx.lineTo(-len + 16, 0); ctx.closePath();
    ctx.fillStyle = color || '#ffd166'; ctx.fill(); ctx.stroke();
    // shaft
    D.rr(ctx, -len, -2.5, len - (head ? 8 : 2), 5, 2.5);
    ctx.fillStyle = '#d9a066'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
    if (head) {
      ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(-12, -7); ctx.lineTo(-9, 0); ctx.lineTo(-12, 7); ctx.closePath();
      ctx.fillStyle = '#d6e2ee'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
    }
  }

  function drawFlying(ctx, a) {
    // the trail
    const tr = a.trail;
    if (tr.length > 1) {
      ctx.lineCap = 'round';
      for (let i = 1; i < tr.length; i++) {
        const f = i / tr.length;
        let c = 'rgba(255,255,255,' + (f * 0.8).toFixed(2) + ')';
        if (trailId === 'rainbow') c = `hsla(${(i * 25 + clock * 300) % 360} 90% 60% / ${f})`;
        else if (trailId === 'candy') c = i % 4 < 2 ? `rgba(241,91,181,${f})` : `rgba(142,202,230,${f})`;
        else if (trailId === 'sparkle') c = `rgba(255,209,102,${f})`;
        ctx.strokeStyle = c; ctx.lineWidth = 2 + f * 6;
        ctx.beginPath(); ctx.moveTo(tr[i - 1].x, tr[i - 1].y); ctx.lineTo(tr[i].x, tr[i].y); ctx.stroke();
      }
    }
    ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.ang); arrowShape(ctx, ARROW_LEN, true, ownerColor(a)); ctx.restore();
  }

  // an arrow stuck in something (follows moving / spinning targets)
  const ownerColor = (a) => friendsGame && a.owner != null ? seatColor(a.owner) : null;
  function drawStuck(ctx, a) {
    let x = a.x, y = a.y, ang = a.ang, sx = 1;
    if (a.on) {
      const p = posOf(a.on, clock);
      if (a.on.kind === 'wheel') {
        x = p.x + Math.cos(a.la + p.rot) * a.lr; y = p.y + Math.sin(a.la + p.rot) * a.lr; ang = a.lang + p.rot;
      } else {
        x = p.x; y = p.y + a.ly;
        if (a.on.spin) sx = a.side * p.face;   // turns with the spinning target
      }
    }
    ctx.save(); ctx.translate(x, y); ctx.scale(sx, 1); ctx.rotate(ang);
    ctx.translate(6, 0);                       // tip is buried a little
    arrowShape(ctx, ARROW_LEN, false, ownerColor(a));
    ctx.restore();
  }

  // ---------------------------------------------------------------
  // Drawing: Pip the archer (original character), aiming the bow
  // ---------------------------------------------------------------
  function drawHead(ctx, hat) {
    const hx = 2, hy = -86;
    // hair (behind)
    ctx.beginPath(); ctx.arc(hx - 2, hy - 2, 25, Math.PI * 0.75, Math.PI * 2.05); ctx.closePath();
    ctx.fillStyle = '#8a4b2a'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    // face
    D.circle(ctx, hx, hy, 23, '#ffd6a5', 4);
    // fringe
    ctx.beginPath(); ctx.moveTo(hx - 22, hy - 4); ctx.quadraticCurveTo(hx - 14, hy - 26, hx + 8, hy - 22); ctx.quadraticCurveTo(hx + 2, hy - 14, hx - 8, hy - 12); ctx.quadraticCurveTo(hx - 16, hy - 10, hx - 22, hy - 4);
    ctx.fillStyle = '#8a4b2a'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    // eyes looking right, with shiny dots
    for (const ex of [hx + 4, hx + 15]) {
      ctx.beginPath(); ctx.ellipse(ex, hy - 2, 3.6, 5.2, 0, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
      D.circle(ctx, ex + 1.2, hy - 4, 1.5, '#ffffff', 0);
    }
    D.circle(ctx, hx + 18, hy + 8, 4.5, '#ff9fb6', 0);   // cheek
    D.circle(ctx, hx - 4, hy + 8, 4, '#ff9fb6', 0);
    ctx.beginPath(); ctx.arc(hx + 10, hy + 6, 5, 0.25, Math.PI - 0.4); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
    drawHat(ctx, hat, hx, hy);
  }

  function drawHat(ctx, hat, hx, hy) {
    ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = INK;
    if (hat === 'cap') {
      // pointy leaf-green cap with a red feather
      ctx.beginPath(); ctx.moveTo(hx - 26, hy - 10); ctx.quadraticCurveTo(hx - 22, hy - 38, hx + 2, hy - 30);
      ctx.quadraticCurveTo(hx + 18, hy - 26, hx + 24, hy - 12); ctx.quadraticCurveTo(hx, hy - 20, hx - 26, hy - 10); ctx.closePath();
      ctx.fillStyle = '#3fbf6f'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx - 22, hy - 24); ctx.quadraticCurveTo(hx - 44, hy - 44, hx - 40, hy - 52); ctx.quadraticCurveTo(hx - 24, hy - 46, hx - 18, hy - 28); ctx.closePath();
      ctx.fillStyle = '#ef476f'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    } else if (hat === 'flower') {
      const cols = ['#ef476f', '#ffd166', '#9b5de5', '#06d6a0', '#f15bb5'];
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * (1.05 + i * 0.2);
        const fx = hx + Math.cos(a) * 23, fy = hy + Math.sin(a) * 23;
        for (let k = 0; k < 5; k++) { const b = k / 5 * Math.PI * 2; D.circle(ctx, fx + Math.cos(b) * 4.5, fy + Math.sin(b) * 4.5, 4, cols[i], 2); }
        D.circle(ctx, fx, fy, 3, '#fff3b0', 1.5);
      }
    } else if (hat === 'bunny') {
      for (const [ex, tilt] of [[-8, -0.25], [10, 0.2]]) {
        ctx.save(); ctx.translate(hx + ex, hy - 22); ctx.rotate(tilt);
        ctx.beginPath(); ctx.ellipse(0, -18, 8, 20, 0, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, -18, 3.5, 13, 0, 0, Math.PI * 2); ctx.fillStyle = '#ffafcc'; ctx.fill();
        ctx.restore();
      }
      ctx.beginPath(); ctx.arc(hx, hy, 24, Math.PI * 1.15, Math.PI * 1.85); ctx.lineWidth = 9; ctx.stroke(); ctx.strokeStyle = '#f15bb5'; ctx.lineWidth = 5; ctx.stroke();
    } else if (hat === 'wizard') {
      ctx.beginPath(); ctx.moveTo(hx - 22, hy - 16); ctx.quadraticCurveTo(hx - 4, hy - 50, hx - 16, hy - 74); ctx.quadraticCurveTo(hx + 8, hy - 50, hx + 22, hy - 16); ctx.closePath();
      ctx.fillStyle = '#7b4ccf'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(hx, hy - 16, 32, 7, 0, 0, Math.PI * 2); ctx.fillStyle = '#9b5de5'; ctx.fill(); ctx.stroke();
      D.star(ctx, hx - 2, hy - 38, 7, '#ffd166', 2);
    } else if (hat === 'crown') {
      ctx.beginPath(); ctx.moveTo(hx - 20, hy - 14); ctx.lineTo(hx - 22, hy - 38); ctx.lineTo(hx - 10, hy - 26); ctx.lineTo(hx, hy - 42); ctx.lineTo(hx + 10, hy - 26);
      ctx.lineTo(hx + 22, hy - 38); ctx.lineTo(hx + 20, hy - 14); ctx.closePath();
      ctx.fillStyle = '#ffc93c'; ctx.fill(); ctx.stroke();
      D.circle(ctx, hx, hy - 20, 4, '#ef476f', 2); D.circle(ctx, hx - 12, hy - 19, 3, '#118ab2', 2); D.circle(ctx, hx + 12, hy - 19, 3, '#06d6a0', 2);
    }
  }

  function drawArcher(ctx, angle, power, showArrow, tunic = '#2fbf71', fletch = null) {
    ctx.save();
    ctx.translate(AX, GROUND); ctx.scale(AS, AS);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(0, 2, 30, 6, 0, 0, Math.PI * 2); ctx.fill();
    // quiver on the back with spare arrows
    ctx.save(); ctx.translate(-20, -60); ctx.rotate(-0.35);
    for (const [dx, c] of [[-5, '#ef476f'], [1, '#ffd166'], [7, '#06d6a0']]) {
      ctx.beginPath(); ctx.moveTo(dx, -8); ctx.lineTo(dx - 4, -22); ctx.lineTo(dx + 4, -22); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
    }
    D.box(ctx, -10, -10, 22, 40, 7, '#a8683a', 4);
    ctx.restore();
    // legs + boots
    D.box(ctx, -14, -26, 11, 22, 4, '#3d5a80', 3.5);
    D.box(ctx, 3, -26, 11, 22, 4, '#3d5a80', 3.5);
    D.box(ctx, -17, -8, 17, 10, 5, '#8a4b2a', 3.5);
    D.box(ctx, 1, -8, 17, 10, 5, '#8a4b2a', 3.5);
    // tunic
    ctx.beginPath(); ctx.moveTo(-16, -66); ctx.quadraticCurveTo(-24, -40, -22, -22); ctx.lineTo(22, -22); ctx.quadraticCurveTo(24, -40, 16, -66); ctx.quadraticCurveTo(0, -72, -16, -66); ctx.closePath();
    ctx.fillStyle = tunic; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    D.box(ctx, -21, -38, 42, 8, 3, '#8a4b2a', 3);
    D.box(ctx, -4, -39, 9, 10, 2, '#ffd166', 2.5);
    drawHead(ctx, hatId);

    // ---- the bow arm turns with the aim ----
    const dx = Math.cos(angle), dy = -Math.sin(angle);
    const nx = -dy, ny = dx;                           // across the bow
    const sh = SHOULDER;
    const hand = { x: sh.x + dx * 34, y: sh.y + dy * 34 };
    const pull = 10 + power * 34;
    const nock = { x: hand.x - dx * pull, y: hand.y - dy * pull };
    const tip1 = { x: hand.x + nx * 40 - dx * 10, y: hand.y + ny * 40 - dy * 10 };
    const tip2 = { x: hand.x - nx * 40 - dx * 10, y: hand.y - ny * 40 - dy * 10 };
    // front arm
    ctx.strokeStyle = INK; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(sh.x, sh.y); ctx.lineTo(hand.x, hand.y); ctx.stroke();
    ctx.strokeStyle = tunic; ctx.lineWidth = 6; ctx.stroke();
    // bow: a curve bulging toward the target
    ctx.beginPath(); ctx.moveTo(tip1.x, tip1.y); ctx.quadraticCurveTo(hand.x + dx * 26, hand.y + dy * 26, tip2.x, tip2.y);
    ctx.strokeStyle = INK; ctx.lineWidth = 10; ctx.stroke();
    ctx.strokeStyle = '#c1121f'; ctx.lineWidth = 5; ctx.stroke();
    // string
    ctx.beginPath(); ctx.moveTo(tip1.x, tip1.y); ctx.lineTo(nock.x, nock.y); ctx.lineTo(tip2.x, tip2.y);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.stroke();
    // the arrow waiting on the string
    if (showArrow) {
      ctx.save(); ctx.translate(nock.x + dx * ARROW_LEN / AS, nock.y + dy * ARROW_LEN / AS); ctx.rotate(Math.atan2(dy, dx)); ctx.scale(1 / AS, 1 / AS);
      arrowShape(ctx, ARROW_LEN, true, fletch); ctx.restore();
    }
    D.circle(ctx, hand.x, hand.y, 6, '#ffd6a5', 3);
    // back arm pulls the string
    ctx.strokeStyle = INK; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(sh.x - 4, sh.y + 2); ctx.lineTo(nock.x, nock.y); ctx.stroke();
    ctx.strokeStyle = tunic; ctx.lineWidth = 6; ctx.stroke();
    D.circle(ctx, nock.x, nock.y, 6, '#ffd6a5', 3);
    ctx.restore();
  }

  // ---------------------------------------------------------------
  // Drawing: aiming guide, HUD
  // ---------------------------------------------------------------
  // The last shot as faint little dots (Nov 23, playtest: on Normal / Challenge the guide is short or missing, and an
  // arrow that flew off the screen left no clue at all; now a child can see "a bit higher / a bit less" for the next one).
  function drawLastPath(g, ctx) {
    if (!lastPath || lastPath.length < 3 || g.difficulty === 'easy') return;
    ctx.save(); ctx.globalAlpha = 0.4; ctx.fillStyle = '#ffffff';
    for (let i = 0; i < lastPath.length; i += 2) { ctx.beginPath(); ctx.arc(lastPath[i].x, lastPath[i].y, 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  function drawGuide(g, ctx) {
    if (g.difficulty === 'challenge') return;
    const showT = g.pick(3.5, 0.32, 0);
    const pw = Math.max(aim.power, phase === 'ready' ? 0.5 : aim.power);  // before pulling: a hint at half power
    const sim = simulate(aim.angle, pw, clock, showT);
    const pts = sim.pts;
    for (let i = 1; i < pts.length; i += 2) {
      const f = 1 - i / pts.length * (g.difficulty === 'easy' ? 0.6 : 1);
      const r = (g.difficulty === 'easy' ? 5 : 4.5) * Math.max(0.5, f);
      ctx.globalAlpha = phase === 'ready' ? 0.45 : Math.max(0.25, f);
      D.circle(ctx, pts[i].x, pts[i].y, r, '#ffffff', 2.5);
    }
    ctx.globalAlpha = 1;
    // Easy: show a ring where it will land
    if (g.difficulty === 'easy' && phase === 'aim' && pts.length > 2) {
      const e = pts[pts.length - 1];
      ctx.beginPath(); ctx.arc(e.x, e.y, 12 + Math.sin(clock * 8) * 2, 0, Math.PI * 2);
      ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    }
  }

  function drawPull(g, ctx) {
    // a stretchy band from where you pressed to your finger
    if (!drag || drag.mode !== 'ptr') return;
    const p = g.input.pointer;
    ctx.setLineDash([8, 8]); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.moveTo(drag.sx, drag.sy); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.setLineDash([]);
    D.circle(ctx, drag.sx, drag.sy, 10, 'rgba(255,255,255,0.6)', 3);
    D.circle(ctx, p.x, p.y, 16, 'rgba(255,209,102,0.85)', 4);
  }

  function arrowIcon(ctx, x, y, on) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 2); ctx.globalAlpha = on ? 1 : 0.3; ctx.scale(0.7, 0.7);
    arrowShape(ctx, ARROW_LEN); ctx.restore();
  }

  function drawHUD(g, ctx) {
    // arrows left (leave the top-left corner free for the home button)
    if (L.practice) {
      arrowIcon(ctx, 112, 44, true);
      D.text(ctx, String(Math.max(0, PRACTICE_MAX - shots)), 150, 44, { size: 30, align: 'left' });
    } else {
      const total = L.arrows + g.pick(2, 0, 0);
      for (let i = 0; i < total; i++) arrowIcon(ctx, 110 + i * 22, 44, i < arrowsLeft);
    }
    // score + star bar (the first star is the goal)
    D.text(ctx, String(score), W / 2, 32, { size: 40 });
    const bx = W / 2 - 130, bw = 260, by = 64;
    D.meter(ctx, bx, by, bw, 18, score / thresholds[2], '#ffd166');
    for (let i = 0; i < 3; i++) {
      const sx = bx + bw * thresholds[i] / thresholds[2];
      D.star(ctx, Math.min(sx, bx + bw - 4), by + 9, i === 0 ? 15 : 13, score >= thresholds[i] ? '#ffd166' : '#f1ece0', 3);
    }
    // goal number under the first star
    D.text(ctx, String(thresholds[0]), bx + bw * thresholds[0] / thresholds[2], by + 36, { size: 16, lineWidth: 4 });
    drawWind(ctx, 760, 46);
    if (L.practice) {
      D.box(ctx, DONE.x, DONE.y, DONE.w, DONE.h, 22, '#06d6a0', 5);
      ctx.beginPath(); ctx.moveTo(DONE.x + 30, DONE.y + 34); ctx.lineTo(DONE.x + 46, DONE.y + 50); ctx.lineTo(DONE.x + 74, DONE.y + 20);
      ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.stroke();
      D.text(ctx, 'Done', DONE.x + DONE.w / 2, DONE.y + 68, { size: 18, lineWidth: 4 });
    }
  }

  // Friends HUD: a chip per player (animal face, points, arrows left).
  // The chip of whoever's turn it is is yellow and bounces; a big face floats over Pip.
  function drawFriendsHUD(g, ctx) {
    const cur = shooterSeat();
    const n = Math.max(1, order.length), w = Math.min(170, (W - 200) / n - 8);
    let x = W / 2 - (n * (w + 8) - 8) / 2;
    for (const s of order) {
      const who = peerOf(s), on = s === cur;
      const y = 12 + (on ? Math.abs(Math.sin(clock * 5)) * -4 : 0);
      D.box(ctx, x, y, w, 64, 22, on ? '#fff3c4' : 'rgba(255,255,255,0.88)', on ? 5 : 4);
      drawAvatar(ctx, who, x + 30, y + 32, 22);
      D.text(ctx, String(frScores[s] || 0), x + Math.min(w - 40, 90), y + 26, { size: 28 });
      // arrows left: little dots in the player's color
      const left = FR_ARROWS - (frShots[s] || 0);
      for (let i = 0; i < FR_ARROWS; i++) D.circle(ctx, x + 60 + i * Math.min(16, (w - 72) / FR_ARROWS), y + 50, 5, i < left ? seatColor(s) : 'rgba(43,43,43,0.15)', 2);
      x += w + 8;
    }
    drawWind(ctx, W - 86, 128);
    // whose turn: their face in a bubble over Pip
    if (cur !== null && (phase === 'ready' || phase === 'aim')) {
      const who = peerOf(cur), bob = Math.sin(clock * 3) * 4;
      D.circle(ctx, AX + 10, 230 + bob, 40, '#ffffff', 4);
      ctx.beginPath(); ctx.moveTo(AX + 2, 268 + bob); ctx.lineTo(AX + 14, 290 + bob); ctx.lineTo(AX + 22, 266 + bob); ctx.fillStyle = '#ffffff'; ctx.fill();
      drawAvatar(ctx, who, AX + 10, 230 + bob, 32);
      if (cur !== mySeat) {   // waiting: three little dots
        for (let i = 0; i < 3; i++) D.circle(ctx, AX + 66 + i * 16, 236 + bob, 5 + (Math.floor(clock * 3) % 3 === i ? 2 : 0), '#ffffff', 2.5);
      }
    }
    if (turnT > 0) {
      ctx.globalAlpha = Math.min(1, turnT * 2);
      D.text(ctx, 'Your turn!', W / 2, 200, { size: Math.round(54 * (1 + Math.max(0, turnT - 1.3))), color: '#ffd166' });
      ctx.globalAlpha = 1;
    }
  }

  // Wind sign: a flag that blows the way the wind goes, plus 0-4 wind lines.
  function drawWind(ctx, x, y) {
    D.box(ctx, x - 74, y - 28, 148, 58, 16, 'rgba(255,255,255,0.85)', 4);
    const dir = Math.sign(wind) || 0, n = Math.ceil(Math.abs(wind) - 0.01);
    const px = dir < 0 ? x + 58 : x - 58;   // the pole stands on the side the wind comes from
    // pole
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(px, y + 22); ctx.lineTo(px, y - 22); ctx.stroke();
    // flag
    ctx.beginPath();
    if (!dir) { ctx.moveTo(px, y - 20); ctx.quadraticCurveTo(px + 6, y - 6, px + 3, y + 8); ctx.lineTo(px + 12, y - 4); ctx.quadraticCurveTo(px + 14, y - 14, px, y - 20); }
    else {
      const wav = Math.sin(clock * 10) * 3, len = 18 + n * 4;
      ctx.moveTo(px, y - 20); ctx.quadraticCurveTo(px + dir * len / 2, y - 22 + wav, px + dir * len, y - 12);
      ctx.quadraticCurveTo(px + dir * len / 2, y - 6 - wav, px, y - 4);
    }
    ctx.closePath(); ctx.fillStyle = '#ef476f'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    if (!dir) { D.text(ctx, 'calm', x + 16, y, { size: 18, lineWidth: 4, color: '#8ecae6' }); return; }
    // wind lines: more lines = stronger wind
    ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const ly = y - 15 + i * 10 + (4 - n) * 5;
      const x0 = x - 2 * dir, x1 = x + 44 * dir;
      const off = ((clock * 40 + i * 9) % 10) * dir;
      ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(x0 + off, ly); ctx.lineTo(x1 + off - dir * 8, ly); ctx.stroke();
    }
    // arrow head showing direction
    ctx.beginPath(); ctx.moveTo(x + 52 * dir + (dir > 0 ? 6 : -6), y); ctx.lineTo(x + 40 * dir, y - 10); ctx.lineTo(x + 40 * dir, y + 10); ctx.closePath();
    ctx.fillStyle = '#118ab2'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  }

  function render(g, ctx) {
    if (!L) { L = LEVELS[0]; theme = THEMES.meadow; things = []; }
    drawBackground(g, ctx);
    for (const a of arrows) if (a.state === 'stuck' && !a.on) drawStuck(ctx, a);   // in the ground
    for (const t of things) drawThing(ctx, t);
    drawPops(ctx);
    drawHatsOff(ctx, g.state === 'play' ? 1 / 60 : 0);
    drawAir(ctx, g);
    const canShoot = (phase === 'ready' || phase === 'aim') && myTurn();
    if (canShoot && (g.state === 'play' || g.state === 'paused')) { drawLastPath(g, ctx); drawGuide(g, ctx); }
    if (friendsGame) {
      // Pip wears the color of whoever's turn it is
      const cur = shooterSeat(), who = flying ? owner : cur;
      const col = who === null ? '#2fbf71' : seatColor(who);
      drawArcher(ctx, aim.angle, phase === 'aim' ? aim.power : 0, (phase === 'ready' || phase === 'aim') && cur !== null, col, col);
    } else drawArcher(ctx, aim.angle, phase === 'aim' ? aim.power : 0, canShoot && (L.practice || arrowsLeft > 0));
    // power meter under Pip while pulling
    if (phase === 'aim') D.meter(ctx, AX - 60, GROUND + 46, 120, 16, aim.power, aim.power > 0.85 ? '#ef476f' : aim.power > 0.5 ? '#ff8c42' : '#06d6a0');
    if (flying) drawFlying(ctx, flying);
    drawPull(g, ctx);
    for (const p of popups) {
      ctx.globalAlpha = Math.min(1, (1.3 - p.t) * 3);
      const pop = 1 + Math.max(0, 0.25 - p.t) * 1.5;
      D.text(ctx, p.text, p.x, p.y, { size: Math.round(p.size * pop), color: p.color });
      ctx.globalAlpha = 1;
    }
    if (g.state !== 'menu') { if (friendsGame) drawFriendsHUD(g, ctx); else drawHUD(g, ctx); }
    // level name at the start
    if (banner > 0 && g.state === 'play') {
      ctx.globalAlpha = Math.min(1, banner * 2);
      const idx = LEVELS.indexOf(L);
      D.box(ctx, W / 2 - 200, 170, 400, 96, 24, 'rgba(255,255,255,0.92)', 5);
      D.text(ctx, L.practice ? 'Practice!' : friendsGame ? 'Take turns!' : (idx + 1) + '. ' + L.name, W / 2, 202, { size: 34, color: '#ffd166' });
      D.text(ctx, theme.name, W / 2, 242, { size: 20, color: '#8ecae6', lineWidth: 5 });
      ctx.globalAlpha = 1;
    }
  }

  // ---------------------------------------------------------------
  // Menus: level tiles, hats and trails
  // ---------------------------------------------------------------
  function levelPic(lv) {
    const t = THEMES[lv.theme];
    const bits = [];
    const target = (x, y, r) => [r, r * 0.8, r * 0.6, r * 0.4, r * 0.2].map((rr, i) => `<ellipse cx="${x}" cy="${y}" rx="${rr * 0.7}" ry="${rr}" fill="${RING_COLORS[4 - i]}" stroke="#2b2b2b" stroke-width="${i ? 1.5 : 3}"/>`).join('');
    const kinds = lv.things.map(x => x.kind);
    if (kinds.includes('wheel')) bits.push(`<circle cx="82" cy="34" r="20" fill="#06d6a0" stroke="#2b2b2b" stroke-width="3"/><path d="M82 14 V54 M62 34 H102" stroke="#2b2b2b" stroke-width="2.5"/><path d="M82 34 L96 20 A20 20 0 0 1 102 34 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="2"/>`);
    else if (lv.things.some(x => x.swing)) bits.push(`<path d="M58 8 H106 M64 8 L58 62 M100 8 L106 62 M78 8 L82 22 M86 8 L82 22" stroke="#2b2b2b" stroke-width="3.5" fill="none" stroke-linecap="round"/>` + target(82, 38, 17));
    else bits.push(`<path d="M76 52 L70 62 M88 52 L94 62" stroke="#2b2b2b" stroke-width="4"/>` + target(82, 36, 18));
    if (kinds.includes('balloon')) bits.push(`<path d="M36 33 Q33 38 37 42 Q40 46 36 50" fill="none" stroke="#2b2b2b" stroke-width="2"/><path d="M36 11 C42 11 46 16 45 21 C44 27 39 31 36 33 C33 31 28 27 27 21 C26 16 30 11 36 11 Z" fill="#ef476f" stroke="#2b2b2b" stroke-width="3"/><path d="M36 27 C31 23 33 19 36 22 C39 19 41 23 36 27 Z" fill="#fff" opacity="0.75"/><ellipse cx="31.5" cy="17" rx="1.6" ry="3.2" fill="#fff" opacity="0.85" transform="rotate(25 31.5 17)"/>`);
    if (kinds.includes('star')) bits.push(`<path d="M50 6 L53 13 L60 13 L55 18 L57 25 L50 21 L43 25 L45 18 L40 13 L47 13 Z" fill="#ffc93c" stroke="#2b2b2b" stroke-width="2" stroke-linejoin="round"/><circle cx="48" cy="16" r="1.1" fill="#2b2b2b"/><circle cx="52" cy="16" r="1.1" fill="#2b2b2b"/>`);
    if (lv.wind) bits.push(`<path d="M8 14 H28 M12 22 H26" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>`);
    if (lv.practice) bits.push(`<path d="M22 20 Q6 38 22 58" fill="none" stroke="#c1121f" stroke-width="5" stroke-linecap="round"/><path d="M22 20 L22 58" stroke="#fff" stroke-width="2"/>`);
    if (kinds.includes('snowman')) bits.push(`<circle cx="30" cy="52" r="9" fill="#fff" stroke="#2b2b2b" stroke-width="2.5"/><circle cx="30" cy="38" r="7" fill="#fff" stroke="#2b2b2b" stroke-width="2.5"/><rect x="23" y="22" width="14" height="10" rx="2" fill="#2b2d42"/><rect x="20" y="31" width="20" height="3" rx="1.5" fill="#2b2d42"/><path d="M30 38 L36 39 L30 40 Z" fill="#ff8c42"/>`);
    if (lv.theme === 'autumn') bits.unshift(`<circle cx="18" cy="44" r="11" fill="#ef6c35" stroke="#2b2b2b" stroke-width="2.5"/><circle cx="104" cy="48" r="8" fill="#ffb703" stroke="#2b2b2b" stroke-width="2.5"/>`);
    return `<svg viewBox="0 0 120 70"><rect width="120" height="70" fill="${t.sky[0]}"/><rect y="58" width="120" height="12" fill="${t.ground}" stroke="#2b2b2b" stroke-width="3"/>${bits.join('')}</svg>`;
  }

  function levels(g) {
    const list = [Object.assign({}, PRACTICE, { pic: levelPic(PRACTICE), meta: 'Free shots!' })];
    LEVELS.forEach((lv, i) => {
      const open = i === 0 || (g.save.levels[LEVELS[i - 1].id] || {}).done;
      list.push(Object.assign({}, lv, { name: (i + 1) + '. ' + lv.name, pic: levelPic(lv), locked: !open }));
    });
    // Winter Wonderland: Snowman Party, only in winter (always open; your stars are kept for next winter)
    if (Arcade.winter && Arcade.winter()) list.push(Object.assign({}, WINTER_LEVEL, { pic: levelPic(WINTER_LEVEL), noStart: true }));
    return list;
  }

  // Draw a hat or trail on a little canvas and turn it into a picture for the menu.
  function hatPic(id, tall) {        // (tall: a taller picture so the top of the hat fits, for the canvas menus)
    const c = document.createElement('canvas'); c.width = 120; c.height = tall ? 140 : 110;
    const x = c.getContext('2d');
    x.translate(60, tall ? 170 : 140); x.scale(1.15, 1.15);
    drawHead(x, id);
    return `<img alt="" src="${c.toDataURL()}" style="width:80px;height:74px">`;
  }
  function trailPic(id) {
    const c = document.createElement('canvas'); c.width = 140; c.height = 80;
    const x = c.getContext('2d');
    x.fillStyle = '#7fd0ff'; D.rr(x, 2, 2, 136, 76, 14); x.fill();
    const save = trailId; trailId = id;
    const fake = { x: 120, y: 30, ang: -0.25, trail: [] };
    for (let i = 0; i < 26; i++) fake.trail.push({ x: 10 + i * 4.3, y: 60 - Math.sin(i / 25 * 2.2) * 34 });
    const keep = clock; clock = 0;
    drawFlying(x, fake);
    if (id === 'sparkle') for (const [sx, sy] of [[40, 32], [70, 22], [24, 52]]) D.star(x, sx, sy, 6, '#ffd166', 1.5);
    clock = keep; trailId = save;
    return `<img alt="" src="${c.toDataURL()}" style="width:90px;height:52px">`;
  }

  // The dress-up picker for the canvas menus (Phaser + Rex UI, Nov 21): your stars, then a row of hats
  // and a row of arrow trails as tiles (locked ones show how many stars they need). redraw() after a pick.
  const srcOf = (html) => (html.match(/src="([^"]+)"/) || [])[1];
  const dressPics = {};
  const dressPic = (kind, id) => dressPics[kind + id] || (dressPics[kind + id] = srcOf(kind === 'hat' ? hatPic(id, true) : trailPic(id)));
  function extraRows(g, redraw) {
    const rows = [{ t: 'chips', items: [{ svg: icons.star(true), text: String(totalStars(g)) }] }];
    for (const [kind, list, w, h] of [['hat', HATS, 120, 150], ['trail', TRAILS, 140, 140]]) {
      const current = ownedPick(g, list, g.save.data[kind]);
      rows.push({ t: 'tiles', w, h, items: list.map(it => {
        const ok = owns(g, kind, it);
        return { img: dressPic(kind, it.id), name: it.name, meta: ok ? [] : [{ svg: icons.star(true) }, { text: String(it.need) }], locked: !ok, picked: it.id === current, attr: kind + '-' + it.id,
          onTap: () => { if (!ok) { Arcade.sfx('bonk'); return; } Arcade.sfx('click'); g.save.data[kind] = it.id; g.store(); redraw(); } };
      }) });
    }
    return rows;
  }

  function extraMenu(g) {
    const wrap = Arcade.h('div');
    const total = totalStars(g);
    wrap.appendChild(Arcade.h('h2', { class: 'ar-title', style: 'font-size:24px;margin-top:16px' }, 'Dress up Pip ' + icons.star(true).replace('<svg', '<svg style="width:26px;height:26px;vertical-align:-4px"') + ' ' + total));
    for (const [kind, list, pic] of [['hat', HATS, hatPic], ['trail', TRAILS, trailPic]]) {
      const row = Arcade.h('div', { class: 'ar-grid' });
      const current = ownedPick(g, list, g.save.data[kind]);
      for (const it of list) {
        const ok = owns(g, kind, it);
        const tile = Arcade.h('button', { type: 'button', class: 'ar-tile' + (ok ? '' : ' locked') + (it.id === current ? ' picked' : '') },
          `<div class="pic">${pic(it.id)}</div><div>${it.name}</div>` +
          `<div class="meta">${ok ? '' : icons.star(true).replace('<svg', '<svg style="width:20px;height:20px;vertical-align:-3px"') + ' ' + it.need}</div>` +
          (ok ? '' : `<div class="lock">${icons.lock}</div>`));
        tile.addEventListener('click', () => {
          if (!ok) { Arcade.sfx('bonk'); return; }
          Arcade.sfx('click');
          g.save.data[kind] = it.id; g.store();
          row.querySelectorAll('.ar-tile').forEach(t => t.classList.remove('picked'));
          tile.classList.add('picked');
        });
        row.appendChild(tile);
      }
      wrap.appendChild(row);
    }
    return wrap;
  }

  // ---------------------------------------------------------------
  // Start the game
  // ---------------------------------------------------------------
  const S = (inner) => `<svg viewBox="0 0 80 80">${inner}</svg>`;
  const LINK = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';   // outline style for the logo picture

  // ---------------------------------------------------------------
  // The playtest robot (Nov 23, new plan point 5): a pretend child
  // ---------------------------------------------------------------
  // tools/playtest.py turns it on with __archeryKid(true, seed) and fast-forwards with __archeryStep(sec).
  // How a child shoots (a model, not a real child: it shows where to look):
  //  * picks something to shoot at: mostly the big target, sometimes a balloon or star (little kids love balloons);
  //  * takes a moment to aim (things keep moving meanwhile);
  //  * Easy shows the whole flight + a landing ring, so the child sees a good pull; only the hand wobbles;
  //  * Normal shows only the start of the flight, Challenge nothing: the child guesses the pull, aims at where
  //    the target is NOW (doesn't lead a moving one) and gets closer shot by shot (the last shot's dots show how it went);
  //  * now and then a little kid just flings an arrow.
  const kid = { on: false, seed: 1, plan: null, mem: {}, wait: 0, last: null, stats: {} };
  function kr() { kid.seed = kid.seed * 16807 % 2147483647; return (kid.seed - 1) / 2147483646; }
  function kgauss() { return (kr() + kr() + kr() - 1.5) * 2; }      // about -3..3, mostly -1..1

  // the best pull for thing number ti (by trying lots of pulls). Returns {a (degrees), p} or null.
  function bestShot(ti, t0, frozen) {
    let best = null;
    const tryOne = (a, p) => {
      const ev = simulate(a * DEG, p, t0, 4, frozen).events;
      let v = 0;
      for (const e of ev) { v += e.points; if (e.index === ti) v += 100; }
      if (!best || v > best.v) best = { a, p, v };
    };
    for (let a = -5; a <= 70; a += 3) for (let p = 0.12; p <= 1.001; p += 0.04) tryOne(a, p);
    if (!best || best.v < 100) return best && best.v > 0 ? best : null;
    const c = best;       // look closer around the best one
    for (let a = c.a - 2; a <= c.a + 2; a += 1) for (let p = c.p - 0.03; p <= c.p + 0.031; p += 0.015) if (p > 0.08 && p <= 1) tryOne(a, p);
    return best;
  }

  function kidThink(g, dt) {
    if (phase !== 'ready' || !myTurn()) return;
    const little = !!g.little, D3 = g.difficulty;
    // the last arrow came down: did it score anything?
    if (kid.last) { if (score === kid.last.score) kid.stats.misses++; const t = things[kid.last.ti], la = arrows[arrows.length - 1]; if (t && ((kid.last.alive && !t.alive) || (la && la.on === t && la.points > 0))) { kid.stats.gotWanted++; (kid.stats.got[t.kind] = (kid.stats.got[t.kind] || 0) + 1); } kid.last = null; }
    if (!kid.plan) {
      // what to shoot at
      const alive = things.map((t, i) => ({ t, i })).filter(o => o.t.alive);
      const big = alive.filter(o => o.t.kind === 'ring' || o.t.kind === 'wheel');
      const small = alive.filter(o => o.t.kind === 'balloon' || o.t.kind === 'star' || o.t.kind === 'snowman');
      const pool = small.length && (kr() < (little ? 0.5 : 0.35) || !big.length) ? small : big;
      const o = pool[Math.floor(kr() * pool.length)];
      kid.plan = { ti: o ? o.i : -1, wait: (little ? 1.2 : 0.8) + kr() * (little ? 2.3 : 1.7) };
      return;
    }
    kid.plan.wait -= dt;
    if (kid.plan.wait > 0) return;
    const ti = kid.plan.ti;
    kid.plan = null;
    let a, p;
    if (ti < 0 || (little && kr() < 0.12)) {        // just fling one
      a = 10 + kr() * 40; p = 0.45 + kr() * 0.55; kid.stats.fling++;
    } else {
      const seeAll = D3 === 'easy';
      const shot = bestShot(ti, clock + STEP, !seeAll);
      if (!shot) { a = 20 + kr() * 20; p = 0.5 + kr() * 0.4; kid.stats.fling++; }
      else {
        // the child's feel for this target: off at first (unless Easy shows the landing spot), better each shot
        const m = kid.mem[ti] || (kid.mem[ti] = seeAll ? { a: 0, p: 0 } : { a: kgauss() * (D3 === 'challenge' ? 5 : 3), p: kgauss() * (D3 === 'challenge' ? 0.16 : 0.11) });
        const wob = seeAll ? (little ? [2.5, 0.045] : [1.5, 0.03]) : D3 === 'challenge' ? [2.5, 0.05] : [2, 0.04];
        a = shot.a + m.a + kgauss() * wob[0];
        p = shot.p + m.p + kgauss() * wob[1];
        // watching where it went: closer next time (the last shot's dots show the whole flight, also one that flew off the screen)
        m.a *= little ? 0.5 : 0.35; m.p *= little ? 0.5 : 0.35;
        kid.stats.wanted++; kid.stats.aimed[things[ti].kind] = (kid.stats.aimed[things[ti].kind] || 0) + 1;
      }
    }
    kid.last = { score, ti, alive: ti >= 0 && things[ti].alive };
    kid.stats.shots++;
    aim.angle = math.clamp(a * DEG, MIN_A, MAX_A); aim.power = math.clamp(p, 0.07, 1);
    shoot(g);
  }

  // "Show me" (Nov 24, new plan point 6): the hand puts a finger down in front of Pip, pulls back toward
  // him (the farther, the stronger) and lets go: a bullseye on the big target, then a balloon if there is one.
  let demoShots = 0;
  const DEMO_PULL = 0.35 + 0.8 + 0.3;          // (the hand glides there, pulls, holds: then the arrow flies)
  function demoThink(g, hand, t) {
    if (t < 0.1) demoShots = 0;
    if (t < 0.5 || demoShots >= 2 || hand.busy() || phase !== 'ready' || !myTurn()) return;
    const alive = things.map((th, i) => ({ th, i })).filter(o => o.th.alive);
    const want = alive.find(o => demoShots === 0 ? o.th.kind === 'ring' || o.th.kind === 'wheel' : o.th.kind === 'balloon') || alive[0];
    const s = want && bestShot(want.i, clock + DEMO_PULL);
    if (!s) return;
    const a = s.a * DEG, d = 10 + s.p * (PULL_FULL - 10), sx = 330, sy = 330;
    hand.drag(sx, sy, sx - Math.cos(a) * d, sy + Math.sin(a) * d, 0.8, 0.3);
    demoShots++;
  }

  Arcade.start({
    id: 'archery',
    showMe: { secs: 7.5, think: demoThink },
    trophies: [
      { id: 'win', name: 'On target', how: 'Win a level' },
      { id: 'bullseye', name: 'Bullseye!', how: 'Hit the very middle' },
      { id: 'golden', name: 'Golden star', how: 'Hit a golden star' },
      { id: 'snowman', name: 'Hat trick', how: "Knock a snowman's hat off (out in winter)" },
      { id: 'three-stars', name: 'Sharp shooter', how: 'Get 3 stars on a level' },
      { id: 'balloons', name: 'Balloon popper', how: 'Pop 10 balloons in one level' },
      { id: 'last', name: 'Adventure hero', how: 'Win the last level' },
      { id: 'eagle', name: 'Eagle eye', how: '5 bullseyes in one level', secret: true },
      { id: 'sneaky', name: 'Sneaky win', how: 'Win without a bullseye or a balloon', secret: true },
    ],   // the trophy room (secret ones show '???' until earned)
    logo: Arcade.logo({
      badge: Arcade.badges.archery,   // the round picture (arcade/badges.js)
      title: 'Bullseye', title2: 'Adventure', colors: ['#b9fbc0', '#06d6a0'], bg: '#b8e0d2', art: `<g class="wobble"><circle cx="170" cy="80" r="52" fill="#fff" ${LINK}/><circle cx="170" cy="80" r="38" fill="#ef476f" ${LINK}/><circle cx="170" cy="80" r="24" fill="#fff" ${LINK}/><circle cx="170" cy="80" r="10" fill="#ffd166" ${LINK}/></g>
              <path d="M30 86 L168 80" ${LINK} fill="none"/><path d="M168 80 L150 72 L152 88 Z" fill="#2b2b2b"/><path d="M30 86 L18 76 M30 86 L18 96" ${LINK} fill="none"/>
              <ellipse cx="60" cy="40" rx="16" ry="20" fill="#9b5de5" ${LINK}/><path d="M60 60 Q56 70 62 80" fill="none" ${LINK} stroke-width="2"/>` }),   // title screen
    menuMusic: { tempo: 108, root: 62, scale: 'dorian', prog: [[1, 7, 1, 5], [4, 5, 1, 1], [3, 7, 4, 5]], drums: 'march', bass: 'walk', lead: 'brass', harmony: 'flute', pad: true, arp: false, seed: 1404,
        tune: { A: '1/2 1 3 5 8/4 5 | 7/2 7 9 7 4/4 2 | 3/2 3 5 3 1/4 3 | 5/8 r/8',
                B: '8/4 8 6 4 | 7/4 7 9 7 | 8/2 10 12/4 10 8 | 8/16',
                C: '10/8 7 | 9/8 11 | 8/8 6 | 5/4 7 9/8' } },   // the title/menu song
    title: 'Bullseye Adventure',
    view: { w: W, h: H },
    background: '#7fd0ff',
    music: (g) => (g.level ? THEMES[g.level.theme].music : THEMES.meadow.music),   // each place has its own song
    levelsTitle: 'Pick a level',
    // each level says its own difficulty (Nov 24: so the 4th place didn't move the old levels around)
    levelDifficulty: (lv) => lv.practice ? 'easy' : lv.diff || 'normal',
    howTo: [
      { pic: S(`<path d="M30 14 Q10 40 30 66" fill="none" stroke="#c1121f" stroke-width="7" stroke-linecap="round"/><path d="M30 14 L14 40 L30 66" fill="none" stroke="#2b2b2b" stroke-width="3"/><circle cx="14" cy="40" r="7" fill="#ffd166" stroke="#2b2b2b" stroke-width="3"/><path d="M34 40 H70 M62 32 L72 40 L62 48" fill="none" stroke="#2b2b2b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`), text: 'Pull back, let go!', keys: 'Drag &amp; let go — or Up/Down + hold Space' },
      { pic: S([30, 24, 18, 12, 6].map((r, i) => `<circle cx="40" cy="40" r="${r}" fill="${RING_COLORS[4 - i]}" stroke="#2b2b2b" stroke-width="${i ? 2 : 4}"/>`).join('')), text: 'Middle = most points!' },
      { pic: S(`<ellipse cx="40" cy="32" rx="18" ry="22" fill="#ef476f" stroke="#2b2b2b" stroke-width="4"/><path d="M40 54 Q36 64 42 74" fill="none" stroke="#2b2b2b" stroke-width="3"/><path d="M60 14 L64 22 L72 22 L66 28 L68 36 L60 32 L52 36 L54 28 L48 22 L56 22 Z" fill="#ffc93c" stroke="#2b2b2b" stroke-width="2.5"/>`), text: 'Pop balloons, grab stars' },
      { pic: S(`<path d="M16 66 V14" stroke="#2b2b2b" stroke-width="5" stroke-linecap="round"/><path d="M16 14 Q34 12 46 22 Q34 30 16 30 Z" fill="#ef476f" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/><path d="M34 46 H66 M40 58 H70" stroke="#118ab2" stroke-width="5" stroke-linecap="round"/>`), text: 'Wind blows your arrow' },
    ],
    levels,
    extraMenu,
    extraRows,
    canvasMenus: true,            // (Nov 21) the menus are drawn with Phaser + Rex UI (arcade/canvasmenu.js)
    friends: (g) => friendsMenu(g),   // take turns on one target on several phones (arcade/net.js)
    setup,
    update,
    draw: render,
  });
})();
