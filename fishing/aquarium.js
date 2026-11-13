// =====================================================================
// Fishing Frenzy: "more to do" (Keith, Nov 13)
//
//   SHELLS   every fish you catch gives shells (rarer fish = more shells).
//   SHOP     spend shells on BAIT (each one changes which fish come) and on
//            things for your AQUARIUM (plants, a castle, a snail...).
//   AQUARIUM every kind of fish you have found swims in your own tank.
//            Tap a fish to say hi, tap the water to drop some food.
//   GOALS    each place has 8 goals, one at a time ("catch a Stripy Perch",
//            "a Bubble Carp of 45 cm"). The goal shows as a little picture at
//            the top while you fish; finishing one gives shells.
//
// This file is loaded BEFORE fishing.js. It only keeps lists and drawings;
// the game hands it what it needs (the fish list, drawFish...) as `F`
// (window.FishGame, set up in fishing.js).
// Everything is saved in the fishing save (g.save.data):
//   shells, bait (picked id), baits [bought ids], decor [bought ids],
//   goals { pond: { i: which goal, n: count for "catch N fish" goals } }
// =====================================================================
(function () {
  const INK = '#2b2b2b';
  const D = () => Arcade.draw;

  // Shells for one catch, by rarity (a new kind of fish gives 3 more; Frenzy doubles).
  const SHELLS = { common: 1, uncommon: 2, rare: 4, legendary: 8, golden: 6 };

  // ---- the shop: bait (pick one) ----
  // more: which fish come more often (rarity -> times as often)
  // keen: fish notice the lure from farther away and bite sooner
  // gold: golden fish swim by this many times as often
  const BAITS = [
    { id: 'worm',    name: 'Wiggly Worm',  cost: 0,  color: '#ff8fab', what: 'A good start' },
    { id: 'berry',   name: 'Berry Bait',   cost: 12, color: '#9b5de5', what: 'Fish come quicker', keen: 1.5 },
    { id: 'shrimp',  name: 'Shrimp Snack', cost: 25, color: '#ff8c42', what: 'More rare fish', more: { rare: 2, legendary: 2.2 } },
    { id: 'glitter', name: 'Glitter Bait', cost: 40, color: '#ffd166', what: 'Golden fish!', gold: 2.2 },
  ];
  // ---- the shop: things for the aquarium (bought once, they just appear) ----
  const DECOR = [
    { id: 'plants',  name: 'Sea Plants',    cost: 5 },
    { id: 'star',    name: 'Starfish',      cost: 6 },
    { id: 'bubbler', name: 'Bubble Stone',  cost: 8 },
    { id: 'coral',   name: 'Coral',         cost: 10 },
    { id: 'snail',   name: 'Snail Friend',  cost: 12 },
    { id: 'rainbow', name: 'Rainbow Stones', cost: 14 },
    { id: 'chest',   name: 'Treasure Chest', cost: 18 },
    { id: 'castle',  name: 'Castle',        cost: 25 },
  ];

  // ---- goals: 8 per place, done in order ----
  //   n: catch this many fish here      sp: catch this kind of fish
  //   big: this kind, at least cm long   rarity: any fish this rare (here)
  //   kinds: find this many kinds here (Fish Book)
  const GOALS = {
    pond: [{ n: 3 }, { sp: 'bluegill' }, { kinds: 3 }, { sp: 'perch' }, { big: 'carp', cm: 42 }, { rarity: 'rare' }, { n: 12 }, { sp: 'catfish' }],
    pier: [{ n: 3 }, { sp: 'clown' }, { sp: 'puffer' }, { kinds: 4 }, { big: 'eel', cm: 70 }, { rarity: 'rare' }, { n: 12 }, { sp: 'marlin' }],
    ice:  [{ n: 3 }, { sp: 'char' }, { sp: 'grayling' }, { kinds: 4 }, { big: 'cod', cm: 60 }, { rarity: 'rare' }, { n: 12 }, { sp: 'aurora' }],
  };
  const REWARD = [5, 5, 8, 8, 10, 12, 15, 20];   // shells for goal 1, 2, 3...

  const data = (g) => g.save.data;
  const shells = (g) => data(g).shells || 0;
  function addShells(g, n) { data(g).shells = shells(g) + n; }
  const owned = (g, list) => (data(g)[list] = data(g)[list] || []);
  const hasBait = (g, b) => b.cost === 0 || owned(g, 'baits').includes(b.id);
  function bait(g) { return BAITS.find(b => b.id === data(g).bait && hasBait(g, b)) || BAITS[0]; }
  const hasDecor = (g, id) => owned(g, 'decor').includes(id);

  // The goal a place is on now: { def, i, n, reward } (null = all 8 done)
  function goal(g, loc) {
    const list = GOALS[loc];
    if (!list) return null;
    const st = (data(g).goals = data(g).goals || {})[loc] = data(g).goals[loc] || { i: 0, n: 0 };
    if (st.i >= list.length) return null;
    return { def: list[st.i], i: st.i, n: st.n, reward: REWARD[st.i], st };
  }
  const goalsDone = (g, loc) => Math.min(GOALS[loc].length, ((data(g).goals || {})[loc] || { i: 0 }).i);

  // After a catch (sp, cm) at a place, or with sp = null just to check "kinds".
  // Returns the goal that was just finished (or null). The game gives the shells + shows it.
  function progress(g, loc, F, sp, cm) {
    const gl = goal(g, loc);
    if (!gl) return null;
    const d = gl.def;
    let done = false;
    if (d.n && sp) { gl.st.n++; done = gl.st.n >= d.n; }
    else if (d.sp) done = sp && sp.id === d.sp;
    else if (d.big) done = sp && sp.id === d.big && cm >= d.cm;
    else if (d.rarity) done = sp && sp.loc === loc && sp.rarity === d.rarity;
    else if (d.kinds) done = F.SPECIES.filter(s => s.loc === loc && F.book(g)[s.id]).length >= d.kinds;
    if (!done) return null;
    gl.st.i++; gl.st.n = 0;
    addShells(g, gl.reward);
    return gl;
  }

  // ---------------------------------------------------------------
  // Little drawings (canvas)
  // ---------------------------------------------------------------
  // a scallop shell (the money)
  function drawShell(ctx, x, y, r) {
    ctx.save(); ctx.translate(x, y);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, r * 0.75); ctx.lineTo(-r, -r * 0.05);
    ctx.quadraticCurveTo(-r * 0.9, -r * 1.0, 0, -r * 1.0);
    ctx.quadraticCurveTo(r * 0.9, -r * 1.0, r, -r * 0.05);
    ctx.lineTo(r * 0.3, r * 0.75); ctx.closePath();
    ctx.fillStyle = '#ffb4a2'; ctx.fill(); ctx.lineWidth = Math.max(2, r * 0.22); ctx.strokeStyle = INK; ctx.stroke();
    ctx.lineWidth = Math.max(1.5, r * 0.14);
    ctx.beginPath();
    for (const a of [-0.55, -0.2, 0.2, 0.55]) { ctx.moveTo(0, r * 0.6); ctx.lineTo(Math.sin(a) * r * 0.95, -Math.cos(a) * r * 0.85); }
    ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, r * 0.82, r * 0.42, r * 0.22, 0, 0, Math.PI * 2); ctx.fillStyle = '#ff8fab'; ctx.fill(); ctx.lineWidth = Math.max(2, r * 0.2); ctx.stroke();
    ctx.restore();
  }

  // The lure at the end of the line, in the bait's look.
  function drawLure(ctx, b, x, y, t) {
    ctx.save(); ctx.translate(x, y);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = INK;
    // the little hook under it
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, 14); ctx.arc(-4, 14, 4, 0, Math.PI * 0.9); ctx.stroke();
    if (b.id === 'worm') {
      const w = Math.sin(t * 6) * 3;
      ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-9, -2 + w); ctx.quadraticCurveTo(-3, -9 - w, 2, -2); ctx.quadraticCurveTo(7, 5 + w, 11, -2); ctx.stroke();
      ctx.strokeStyle = b.color; ctx.lineWidth = 5; ctx.stroke();
    } else if (b.id === 'berry') {
      Arcade.draw.circle(ctx, 0, 0, 8, b.color, 3);
      Arcade.draw.circle(ctx, -3, -3, 2.2, '#fff', 0);
      ctx.beginPath(); ctx.ellipse(4, -9, 5, 2.5, -0.5, 0, Math.PI * 2); ctx.fillStyle = '#06d6a0'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
    } else if (b.id === 'shrimp') {
      ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, 0, 6, -Math.PI * 0.2, Math.PI * 1.25); ctx.stroke();
      ctx.strokeStyle = b.color; ctx.lineWidth = 6; ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(5, -4); ctx.quadraticCurveTo(12, -12, 16, -8); ctx.stroke();
      Arcade.draw.circle(ctx, 4, -4, 1.6, INK, 0);
    } else {
      Arcade.draw.star(ctx, 0, 0, 10, b.color, 3);
      if (Math.sin(t * 8) > 0.3) Arcade.draw.star(ctx, 9, -10, 3.5, '#fff', 0);
    }
    ctx.restore();
  }

  // Things in the aquarium. (x, y) = bottom middle, s = size.
  function drawDecor(ctx, id, x, y, s, t) {
    const dr = Arcade.draw;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
    if (id === 'plants') {
      for (const [dx, h, c, ph] of [[-22, 110, '#43aa8b', 0], [0, 140, '#90be6d', 1], [22, 95, '#2a9d8f', 2]]) {
        const sw = Math.sin(t * 1.3 + ph) * 10;
        ctx.beginPath(); ctx.moveTo(dx - 9, 0);
        ctx.quadraticCurveTo(dx - 14 + sw * 0.5, -h * 0.5, dx + sw, -h);
        ctx.quadraticCurveTo(dx + 14 + sw * 0.5, -h * 0.5, dx + 9, 0);
        ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ctx.stroke();
        ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(dx, -4); ctx.quadraticCurveTo(dx + sw * 0.4, -h * 0.5, dx + sw * 0.9, -h * 0.9); ctx.stroke(); ctx.lineWidth = 4;
      }
    } else if (id === 'star') {
      dr.star(ctx, 0, -18, 24, '#ff8c42', 4);
      dr.circle(ctx, -6, -21, 3, INK, 0); dr.circle(ctx, 6, -21, 3, INK, 0);
      ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -16, 5, 0.3, Math.PI - 0.3); ctx.stroke();
    } else if (id === 'bubbler') {
      ctx.beginPath(); ctx.ellipse(0, -12, 26, 14, 0, 0, Math.PI * 2); ctx.fillStyle = '#9db4c8'; ctx.fill(); ctx.stroke();
      dr.circle(ctx, -8, -16, 3, '#cfe0ee', 0); dr.circle(ctx, 8, -10, 2.5, '#cfe0ee', 0);
    } else if (id === 'coral') {
      for (const [c, w, a] of [[INK, 18, 0], ['#ff70a6', 10, 1]]) {
        ctx.strokeStyle = c; ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(0, -70); ctx.moveTo(0, -30); ctx.lineTo(-30, -62); ctx.lineTo(-34, -86);
        ctx.moveTo(0, -42); ctx.lineTo(28, -76); ctx.moveTo(-30, -62); ctx.lineTo(-48, -70); ctx.moveTo(14, -58); ctx.lineTo(30, -50);
        ctx.stroke();
        void a;
      }
      for (const [cx, cy] of [[0, -70], [-34, -86], [28, -76], [-48, -70], [30, -50]]) dr.circle(ctx, cx, cy, 6, '#ffafcc', 0);
    } else if (id === 'snail') {
      ctx.beginPath(); ctx.moveTo(-26, 0); ctx.quadraticCurveTo(-28, -14, -12, -14); ctx.lineTo(26, -14); ctx.quadraticCurveTo(34, -14, 32, 0); ctx.closePath();
      ctx.fillStyle = '#ffd6a5'; ctx.fill(); ctx.stroke();
      dr.circle(ctx, 2, -30, 22, '#c77dff', 4);
      ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(2, -30, 13, 0, Math.PI * 1.6); ctx.arc(4, -28, 6, Math.PI * 1.6, Math.PI * 3.2); ctx.stroke();
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(26, -14); ctx.lineTo(30, -30); ctx.moveTo(30, -14); ctx.lineTo(38, -28); ctx.stroke();
      dr.circle(ctx, 30, -32, 4, '#fff', 2.5); dr.circle(ctx, 38, -30, 4, '#fff', 2.5);
      dr.circle(ctx, 31, -32, 2, INK, 0); dr.circle(ctx, 39, -30, 2, INK, 0);
      ctx.beginPath(); ctx.arc(30, -8, 4, 0.2, Math.PI - 0.2); ctx.stroke();
    } else if (id === 'rainbow') {
      const cols = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#9b5de5', '#ff8c42'];
      for (let i = 0; i < 9; i++) {
        const cx = (i % 3 - 1) * 22 + (i > 5 ? 11 : 0), cy = -8 - Math.floor(i / 3) * 14;
        ctx.beginPath(); ctx.ellipse(cx, cy, 13, 9, 0, 0, Math.PI * 2); ctx.fillStyle = cols[i % cols.length]; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
      }
    } else if (id === 'chest') {
      // a treasure chest, the lid opens and closes (a bubble pops out)
      const open = Math.max(0, Math.sin(t * 0.9)) * 0.5;
      dr.box(ctx, -40, -44, 80, 44, 8, '#c98b4f', 4);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(-6, -44, 12, 44); ctx.strokeRect(-6, -44, 12, 44);
      ctx.save(); ctx.translate(-40, -44); ctx.rotate(-open);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -10); ctx.quadraticCurveTo(40, -36, 80, -10); ctx.lineTo(80, 0); ctx.closePath();
      ctx.fillStyle = '#b5835a'; ctx.fill(); ctx.stroke();
      ctx.restore();
      if (open > 0.15) { dr.circle(ctx, 0, -50, 9, '#ffd166', 3); dr.star(ctx, 0, -50, 5, '#fff', 0); }
      dr.circle(ctx, 0, -24, 5, '#2b2b2b', 0);
    } else if (id === 'castle') {
      ctx.fillStyle = '#d4c1ec';
      const tower = (x0, w, h) => {
        ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0, -h);
        for (let k = 0; k < 3; k++) { const cx = x0 + k * w / 3; ctx.lineTo(cx, -h - 10); ctx.lineTo(cx + w / 6, -h - 10); ctx.lineTo(cx + w / 6, -h); ctx.lineTo(cx + w / 3, -h); }
        ctx.lineTo(x0 + w, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      };
      tower(-60, 36, 100); tower(24, 36, 100);
      ctx.fillStyle = '#e8dcf7'; tower(-30, 60, 70);
      ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-14, -26); ctx.arc(0, -26, 14, Math.PI, 0); ctx.lineTo(14, 0); ctx.closePath(); ctx.fillStyle = '#4a4e69'; ctx.fill(); ctx.stroke();
      for (const wx of [-42, 42]) { dr.box(ctx, wx - 6, -78, 12, 18, 6, '#4a4e69', 3); }
      ctx.beginPath(); ctx.moveTo(42, -110); ctx.lineTo(42, -136); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(42, -136); ctx.lineTo(62 + Math.sin(t * 3) * 3, -130); ctx.lineTo(42, -124); ctx.closePath(); ctx.fillStyle = '#ef476f'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    }
    ctx.restore();
  }

  // A small picture (data URL) of a canvas drawing, for the shop tiles.
  function pic(fn, w = 120, h = 90) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    fn(c.getContext('2d')); return c.toDataURL();
  }

  // ---------------------------------------------------------------
  // The goal chip (top of the screen while fishing): a picture of the goal,
  // how far along, and the shells it gives.
  // ---------------------------------------------------------------
  function drawGoalTarget(ctx, F, d, x, y, t) {
    const dr = Arcade.draw;
    if (d.sp || d.big) {
      const sp = F.SP[d.sp || d.big];
      const s = Math.min(50 / (sp.len * (sp.extra === 'nose' ? 1.5 : 1.25)), 30 / (sp.len * sp.hgt * (sp.shape === 'tall' ? 2.2 : 1.3)));
      F.drawFish(ctx, sp, x, y + (d.big ? -4 : 0), 1, s, t, { lw: 2.5, happy: true, noGlow: true });
      if (d.big) {
        // a little ruler under the fish = "a big one"
        dr.box(ctx, x - 24, y + 11, 48, 9, 3, '#ffd166', 2.5);
        ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath();
        for (let k = -18; k <= 18; k += 6) { ctx.moveTo(x + k, y + 11); ctx.lineTo(x + k, y + 15); }
        ctx.stroke();
      }
    } else if (d.rarity) {
      for (let i = 0; i < 3; i++) dr.star(ctx, x - 16 + i * 16, y + (i === 1 ? -6 : 2), 9, '#ffd166', 2.5);
    } else if (d.kinds) {
      // the Fish Book
      ctx.save(); ctx.translate(x, y);
      ctx.beginPath(); ctx.moveTo(-22, -14); ctx.quadraticCurveTo(-10, -18, 0, -12); ctx.quadraticCurveTo(10, -18, 22, -14);
      ctx.lineTo(22, 16); ctx.quadraticCurveTo(10, 12, 0, 18); ctx.quadraticCurveTo(-10, 12, -22, 16); ctx.closePath();
      ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 18); ctx.stroke();
      F.miniFish(ctx, -9, 2, 0.45, '#ff8c42'); F.miniFish(ctx, 13, 2, 0.45, '#4cc9f0');
      ctx.restore();
    } else {
      F.miniFish(ctx, x, y, 1.0, '#ffd166');
    }
  }
  // what to write next to the picture ("2/3", "3/4", "42+")
  function goalCount(g, loc, F, gl) {
    const d = gl.def;
    if (d.n) return gl.n + '/' + d.n;
    if (d.kinds) return F.SPECIES.filter(s => s.loc === loc && F.book(g)[s.id]).length + '/' + d.kinds;
    if (d.big) return d.cm + '+';
    return '';
  }
  // box: {x, y, w, h}; flash = seconds since a goal was finished (glows)
  function drawGoalChip(ctx, g, loc, F, box, t, flash) {
    const dr = Arcade.draw;
    const gl = goal(g, loc);
    const glow = flash != null && flash < 1.6;
    dr.box(ctx, box.x, box.y, box.w, box.h, 22, glow ? `hsl(${(t * 300) % 360} 90% 82%)` : 'rgba(255,255,255,0.92)', 4);
    // a target (bullseye) = "goal"
    const tx = box.x + 22, ty = box.y + box.h / 2;
    dr.circle(ctx, tx, ty, 13, '#ef476f', 3); dr.circle(ctx, tx, ty, 8, '#fff', 0); dr.circle(ctx, tx, ty, 4, '#ef476f', 0);
    if (!gl) {
      // all 8 done: a gold crown
      ctx.save(); ctx.translate(box.x + box.w / 2 + 10, ty + 8);
      ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-22, -22); ctx.lineTo(-11, -10); ctx.lineTo(0, -26); ctx.lineTo(11, -10); ctx.lineTo(22, -22); ctx.lineTo(22, 0); ctx.closePath();
      ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      ctx.restore();
      dr.text(ctx, '8/8', box.x + box.w - 30, ty, { size: 20 });
      return;
    }
    drawGoalTarget(ctx, F, gl.def, box.x + 72, ty, t);
    const cnt = goalCount(g, loc, F, gl);
    if (cnt) dr.text(ctx, cnt, box.x + 124, ty, { size: 20 });
    // the reward: a shell
    drawShell(ctx, box.x + box.w - 20, ty - 2, 10);
  }

  // ---------------------------------------------------------------
  // Panels: buttons + small helpers
  // ---------------------------------------------------------------
  const btn = (icon, label, cls, onClick, attr) => {
    const b = Arcade.h('button', { type: 'button', class: 'ar-btn ' + (cls || '') }, `${icon}<span>${label}</span>`);
    if (attr) b.setAttribute(attr, '1');
    b.addEventListener('click', onClick);
    return b;
  };
  const shellSvg = (size = 30) => `<svg viewBox="0 0 40 40" style="width:${size}px;height:${size}px;vertical-align:middle"><path d="M15 33 L5 20 Q6 6 20 6 Q34 6 35 20 L25 33 Z" fill="#ffb4a2" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/><path d="M20 30 L20 8 M20 30 L12 10 M20 30 L28 10 M20 30 L7 17 M20 30 L33 17" stroke="#2b2b2b" stroke-width="2"/><ellipse cx="20" cy="33" rx="7" ry="4" fill="#ff8fab" stroke="#2b2b2b" stroke-width="3"/></svg>`;
  const shellBadge = (g) => Arcade.h('div', { class: 'fish-shells', 'data-shells': '1' }, `${shellSvg(34)}<b>${shells(g)}</b>`);
  // round picture icons for the title menu
  const tankIcon = `<svg viewBox="0 0 48 48"><rect x="5" y="9" width="38" height="30" rx="6" fill="#8ecae6" stroke="#2b2b2b" stroke-width="4"/><path d="M7 31 Q16 27 24 31 T41 31 V37 H7 Z" fill="#f3d98e"/><path d="M16 22 C19 17 26 17 28 22 C26 27 19 27 16 22 Z M16 22 L11 18 L11 26 Z" fill="#ff8c42" stroke="#2b2b2b" stroke-width="2.5" stroke-linejoin="round"/><circle cx="24" cy="21" r="1.6" fill="#2b2b2b"/><circle cx="34" cy="16" r="2.5" fill="none" stroke="#fff" stroke-width="2"/><rect x="9" y="39" width="30" height="5" rx="2" fill="#c98b4f" stroke="#2b2b2b" stroke-width="3"/></svg>`;
  const shopIcon = `<svg viewBox="0 0 48 48"><path d="M8 18 L12 8 H36 L40 18 Z" fill="#ef476f" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><path d="M14 8 L13 18 M24 8 V18 M34 8 L35 18" stroke="#fff" stroke-width="3"/><rect x="10" y="18" width="28" height="22" rx="3" fill="#fff" stroke="#2b2b2b" stroke-width="4"/><g transform="translate(14 21) scale(0.5)"><path d="M15 33 L5 20 Q6 6 20 6 Q34 6 35 20 L25 33 Z" fill="#ffb4a2" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/></g></svg>`;
  const feedIcon = `<svg viewBox="0 0 48 48"><rect x="12" y="14" width="24" height="28" rx="5" fill="#ffd166" stroke="#2b2b2b" stroke-width="4"/><rect x="14" y="6" width="20" height="9" rx="3" fill="#ef476f" stroke="#2b2b2b" stroke-width="4"/><circle cx="20" cy="26" r="2.5" fill="#ff8c42"/><circle cx="28" cy="31" r="2.5" fill="#9b5de5"/><circle cx="21" cy="35" r="2.5" fill="#06d6a0"/></svg>`;

  // ---------------------------------------------------------------
  // The AQUARIUM: every kind you've found swims here.
  // ---------------------------------------------------------------
  const TW = 900, TH = 500;           // tank drawing size
  const GLASS = { x: 24, y: 30, w: 852, h: 400 };
  const SAND = GLASS.y + GLASS.h - 46;
  // where each thing sits in the tank (bottom middle) and how big
  const SPOT = { plants: [84, 1.4], bubbler: [176, 1.2], chest: [280, 1.3], rainbow: [400, 1.2], star: [490, 1.15], coral: [590, 1.4], castle: [750, 1.45], snail: [0, 0.9] };

  function openAquarium(g, F) {
    const p = Arcade.h('div', { class: 'ar-panel wide fish-tank-panel' });
    const found = F.SPECIES.filter(s => F.book(g)[s.id]);
    const head = Arcade.h('div', { class: 'fish-head' });
    head.appendChild(Arcade.h('h1', { class: 'ar-title' }, 'My Aquarium'));
    head.appendChild(Arcade.h('div', { class: 'fish-shells' }, `<svg viewBox="0 0 60 60" style="width:34px;height:34px;vertical-align:middle">${F.fishSvg('#ff8c42')}</svg><b>${found.length} / ${F.SPECIES.length}</b>`));
    p.appendChild(head);
    const cv = Arcade.h('canvas', { class: 'fish-tank', width: TW, height: TH, 'data-tank': '1' });
    p.appendChild(cv);
    const ctx = cv.getContext('2d');

    // the fish in the tank: one of each kind found
    const swimmers = found.map((sp, i) => {
      const fit = Math.min(1.25, 130 / sp.len);
      return { sp, x: 100 + ((i * 197) % 700), y: GLASS.y + 60 + ((i * 83) % 250), dir: i % 2 ? 1 : -1, face: i % 2 ? 1 : -1,
        scale: fit, t: i, vx: 0, flip: 0, label: 0, goal: null, speed: 40 + (sp.speed % 40) };
    });
    const food = [], hearts = [], bubbles = [];
    let snailX = GLASS.x + 60, last = performance.now();

    function dropFood(x) {
      for (let k = 0; k < 4; k++) food.push({ x: x + (k - 1.5) * 14 + Math.random() * 8, y: GLASS.y + 14 + Math.random() * 10, c: ['#ff8c42', '#9b5de5', '#06d6a0', '#ef476f'][k] });
      Arcade.sfx('pop');
    }
    // tap a fish = it does a happy flip and says its name; tap the water = food
    cv.addEventListener('pointerdown', (e) => {
      const r = cv.getBoundingClientRect();
      const x = (e.clientX - r.left) * TW / r.width, y = (e.clientY - r.top) * TH / r.height;
      let hit = null, best = 1e9;
      for (const f of swimmers) {
        const d = Math.hypot(f.x - x, (f.y - y) * 1.6);
        if (d < f.sp.len * f.scale * 0.6 && d < best) { best = d; hit = f; }
      }
      if (hit) { hit.flip = 1; hit.label = 2.6; Arcade.sfx('coin'); hearts.push({ x: hit.x, y: hit.y - 30, t: 0 }); }
      else if (x > GLASS.x && x < GLASS.x + GLASS.w && y > GLASS.y && y < SAND) dropFood(x);
    });

    function update(dt) {
      for (const f of swimmers) {
        f.t += dt;
        // go after the closest bit of food
        let goal = null, gd = 1e9;
        for (const fd of food) { const d = Math.hypot(fd.x - f.x, fd.y - f.y); if (d < gd && d < 420) { gd = d; goal = fd; } }
        if (goal) {
          const dx = goal.x - f.x, dy = goal.y - f.y, d = Math.hypot(dx, dy) || 1;
          f.x += dx / d * 120 * dt; f.y += dy / d * 120 * dt; f.dir = dx > 0 ? 1 : -1;
          if (d < f.sp.len * f.scale * 0.5) { food.splice(food.indexOf(goal), 1); hearts.push({ x: f.x, y: f.y - 20, t: 0 }); Arcade.sfx('tick'); }
        } else {
          f.x += f.dir * f.speed * dt;
          f.y += Math.sin(f.t * 0.9) * 12 * dt;
          const half = f.sp.len * f.scale * 0.5 + 10;
          if (f.x < GLASS.x + half) f.dir = 1;
          if (f.x > GLASS.x + GLASS.w - half) f.dir = -1;
        }
        f.y = Math.max(GLASS.y + 40, Math.min(SAND - 30, f.y));
        f.face += (f.dir - f.face) * Math.min(1, dt * 6);
        if (f.flip > 0) f.flip = Math.max(0, f.flip - dt * 1.6);
        if (f.label > 0) f.label -= dt;
      }
      for (const fd of food) fd.y = Math.min(SAND - 6, fd.y + 30 * dt);
      for (const h of hearts) { h.t += dt; h.y -= 30 * dt; }
      while (hearts.length && hearts[0].t > 1.2) hearts.shift();
      if (hasDecor(g, 'bubbler') && Math.random() < dt * 6) bubbles.push({ x: SPOT.bubbler[0] + (Math.random() - 0.5) * 10, y: SAND - 18, r: 3 + Math.random() * 5 });
      if (Math.random() < dt * 1.5) bubbles.push({ x: GLASS.x + 40 + Math.random() * (GLASS.w - 80), y: SAND - 4, r: 2 + Math.random() * 3 });
      for (const b of bubbles) { b.y -= (40 + b.r * 8) * dt; b.x += Math.sin(b.y * 0.05) * 0.4; }
      while (bubbles.length && bubbles[0].y < GLASS.y + 12) bubbles.shift();
      snailX += 9 * dt; if (snailX > GLASS.x + GLASS.w - 60) snailX = GLASS.x + 60;
    }

    function draw(t) {
      const dr = Arcade.draw;
      ctx.clearRect(0, 0, TW, TH);
      // the stand under the tank
      dr.box(ctx, 50, GLASS.y + GLASS.h - 6, TW - 100, 64, 12, '#c98b4f', 5);
      ctx.fillStyle = '#9c6634'; for (const x of [90, TW - 130]) ctx.fillRect(x, GLASS.y + GLASS.h + 20, 40, 8);
      // water
      ctx.save();
      dr.rr(ctx, GLASS.x, GLASS.y, GLASS.w, GLASS.h, 22); ctx.clip();
      const wg = ctx.createLinearGradient(0, GLASS.y, 0, SAND);
      wg.addColorStop(0, '#9be7ff'); wg.addColorStop(0.5, '#4cc9f0'); wg.addColorStop(1, '#2a7fbf');
      ctx.fillStyle = wg; ctx.fillRect(GLASS.x, GLASS.y, GLASS.w, GLASS.h);
      // light rays
      ctx.globalAlpha = 0.13; ctx.fillStyle = '#fff';
      for (let i = 0; i < 5; i++) {
        const x = GLASS.x + 80 + i * 170 + Math.sin(t * 0.4 + i) * 20;
        ctx.beginPath(); ctx.moveTo(x, GLASS.y); ctx.lineTo(x + 46, GLASS.y); ctx.lineTo(x - 20, SAND); ctx.lineTo(x - 80, SAND); ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // sand (or rainbow stones)
      ctx.beginPath(); ctx.moveTo(GLASS.x, GLASS.y + GLASS.h);
      for (let x = GLASS.x; x <= GLASS.x + GLASS.w; x += 30) ctx.lineTo(x, SAND + Math.sin(x * 0.02) * 6);
      ctx.lineTo(GLASS.x + GLASS.w, GLASS.y + GLASS.h); ctx.closePath();
      ctx.fillStyle = '#f3d98e'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      const pebbles = hasDecor(g, 'rainbow') ? ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#9b5de5', '#ff8c42'] : ['#dfbd67'];
      for (let i = 0; i < 26; i++) {
        const x = GLASS.x + 20 + i * 32, y = SAND + 16 + (i % 3) * 8;
        ctx.beginPath(); ctx.ellipse(x, y, 8, 5, 0, 0, Math.PI * 2); ctx.fillStyle = pebbles[i % pebbles.length]; ctx.fill();
        if (pebbles.length > 1) { ctx.lineWidth = 2; ctx.stroke(); }
      }
      // the things bought in the shop (back to front)
      for (const id of ['castle', 'plants', 'coral', 'chest', 'rainbow', 'bubbler', 'star']) {
        if (!hasDecor(g, id)) continue;
        if (id === 'rainbow') continue;   // the pebbles above
        drawDecor(ctx, id, SPOT[id][0], SAND + 10, SPOT[id][1], t);
      }
      if (hasDecor(g, 'rainbow')) drawDecor(ctx, 'rainbow', SPOT.rainbow[0], SAND + 14, SPOT.rainbow[1], t);
      // the fish
      for (const f of swimmers) {
        const rot = f.flip > 0 ? (1 - f.flip) * Math.PI * 2 : 0;
        F.drawFish(ctx, f.sp, f.x, f.y - Math.sin(f.flip * Math.PI) * 30, f.face, f.scale, f.t, { lw: 3.5, rot, happy: true });
      }
      // food bits
      for (const fd of food) dr.circle(ctx, fd.x, fd.y, 4.5, fd.c, 2);
      // bubbles
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2;
      for (const b of bubbles) { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke(); }
      // the snail slowly crawls along the front glass
      if (hasDecor(g, 'snail')) drawDecor(ctx, 'snail', snailX, SAND + 26, SPOT.snail[1], t);
      // little hearts
      for (const h of hearts) { ctx.globalAlpha = Math.max(0, 1 - h.t / 1.2); heart(ctx, h.x, h.y, 9); ctx.globalAlpha = 1; }
      // names (when tapped)
      for (const f of swimmers) {
        if (f.label <= 0) continue;
        ctx.globalAlpha = Math.min(1, f.label * 2);
        const R = F.RARITY[f.sp.rarity], y = Math.max(GLASS.y + 30, f.y - f.sp.len * f.scale * f.sp.hgt * 0.5 - 40);   // (never above the glass)
        ctx.font = '800 22px "Comic Sans MS", "Chalkboard SE", sans-serif';
        const w = Math.max(ctx.measureText(f.sp.name).width + 30, R.stars * 22 + 20);
        const x = Math.max(GLASS.x + w / 2 + 6, Math.min(GLASS.x + GLASS.w - w / 2 - 6, f.x));
        dr.box(ctx, x - w / 2, y - 22, w, 58, 16, '#fff', 3);
        dr.text(ctx, f.sp.name, x, y - 4, { size: 20 });
        for (let i = 0; i < R.stars; i++) dr.star(ctx, x - (R.stars - 1) * 11 + i * 22, y + 22, 8, '#ffd166', 2);
        ctx.globalAlpha = 1;
      }
      // nothing here yet: a big friendly picture (rod -> tank)
      if (!swimmers.length) {
        ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 3);
        F.drawFish(ctx, F.SP.bluegill, TW / 2, 190, 1, 1.6, t, { sil: true, lw: 4 });
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      // the glass: frame, lid and a shine
      dr.rr(ctx, GLASS.x, GLASS.y, GLASS.w, GLASS.h, 22); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
      dr.box(ctx, GLASS.x - 10, GLASS.y - 18, GLASS.w + 20, 22, 8, '#118ab2', 5);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 10; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(GLASS.x + 30, GLASS.y + 40); ctx.lineTo(GLASS.x + 30, GLASS.y + 120); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(GLASS.x + 30, GLASS.y + 145); ctx.lineTo(GLASS.x + 30, GLASS.y + 165); ctx.stroke();
    }

    function frame(now) {
      if (!cv.isConnected) return;            // the panel was closed: stop
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      update(dt); draw(now / 1000);
      requestAnimationFrame(frame);
    }
    draw(0);
    requestAnimationFrame((n) => { last = n; frame(n); });

    // test hook: the fish in the tank + tap one
    window.__fishTank = () => ({ fish: swimmers.map(f => ({ id: f.sp.id, x: f.x, y: f.y, label: f.label > 0 })), food: food.length, decor: owned(g, 'decor').slice() });

    const btns = Arcade.h('div', { class: 'ar-btns' });
    btns.appendChild(btn(feedIcon, 'Feed', 'big', () => { dropFood(GLASS.x + 120 + Math.random() * (GLASS.w - 240)); }, 'data-feed'));
    btns.appendChild(btn(shopIcon, 'Shop', 'pink', () => { Arcade.sfx('click'); openShop(g, F); }, 'data-shop'));
    btns.appendChild(btn(Arcade.icons.left, 'Back', 'white', () => { Arcade.sfx('click'); g.menu(); }));
    p.appendChild(btns);
    g.panel(p);
  }
  function heart(ctx, x, y, r) {
    ctx.beginPath(); ctx.moveTo(x, y + r * 0.9);
    ctx.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.7, y - r * 1.4, x, y - r * 0.5);
    ctx.bezierCurveTo(x + r * 0.7, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r * 0.9);
    ctx.fillStyle = '#ff70a6'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
  }

  // ---------------------------------------------------------------
  // The SHOP: bait + things for the tank. Pay with shells.
  // ---------------------------------------------------------------
  function openShop(g, F) {
    const p = Arcade.h('div', { class: 'ar-panel wide' });
    const head = Arcade.h('div', { class: 'fish-head' });
    head.appendChild(Arcade.h('h1', { class: 'ar-title' }, 'Shell Shop'));
    const badge = shellBadge(g);
    head.appendChild(badge);
    p.appendChild(head);
    const refresh = () => { badge.querySelector('b').textContent = shells(g); };
    const price = (n) => `${shellSvg(20)} ${n}`;
    const tick = '<svg viewBox="0 0 24 24" style="width:22px;height:22px;vertical-align:middle"><path d="M4 13 L10 19 L20 6" fill="none" stroke="#06d6a0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    function shake(el) { Arcade.sfx('bonk'); el.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], 260); badge.animate([{ transform: 'scale(1.2)' }, { transform: 'none' }], 300); }
    function buy(item, list) {
      if (shells(g) < item.cost) return false;
      data(g).shells -= item.cost;
      owned(g, list).push(item.id);
      Arcade.sfx('coin'); setTimeout(() => Arcade.sfx('unlock'), 150);
      if (list === 'decor') { g.achieve('decor', 'Tank decorator!'); }
      g.store(); refresh();
      return true;
    }

    // ---- bait ----
    p.appendChild(Arcade.h('h2', { class: 'ar-title', style: 'font-size:22px;margin:10px 0 6px' }, 'Bait'));
    const bg = Arcade.h('div', { class: 'ar-grid', style: 'grid-template-columns:repeat(auto-fill,minmax(150px,1fr))' });
    const baitTiles = [];
    for (const b of BAITS) {
      const im = pic(ctx => { ctx.fillStyle = '#bde0fe'; ctx.beginPath(); ctx.arc(60, 45, 38, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(60, 0); ctx.lineTo(60, 38); ctx.stroke(); ctx.save(); ctx.translate(60, 46); ctx.scale(2.1, 2.1); drawLure(ctx, b, 0, 0, 0.3); ctx.restore(); });
      const tile = Arcade.h('button', { type: 'button', class: 'ar-tile', 'data-bait': b.id });
      const paint = () => {
        const own = hasBait(g, b), on = bait(g).id === b.id;
        tile.classList.toggle('picked', on);
        tile.innerHTML = `<div class="pic"><img alt="" src="${im}" style="height:70px"></div><div>${b.name}</div><div class="meta">${b.what}</div><div class="meta">${own ? (on ? tick : '&nbsp;') : price(b.cost)}</div>`;
      };
      paint(); baitTiles.push(paint);
      tile.addEventListener('click', () => {
        if (!hasBait(g, b) && !buy(b, 'baits')) { shake(tile); return; }
        Arcade.sfx('click');
        data(g).bait = b.id; g.store();
        baitTiles.forEach(f => f());
      });
      bg.appendChild(tile);
    }
    p.appendChild(bg);

    // ---- things for the aquarium ----
    p.appendChild(Arcade.h('h2', { class: 'ar-title', style: 'font-size:22px;margin:14px 0 6px' }, 'For my aquarium'));
    const dg = Arcade.h('div', { class: 'ar-grid', style: 'grid-template-columns:repeat(auto-fill,minmax(130px,1fr))' });
    for (const d of DECOR) {
      const im = pic(ctx => { ctx.fillStyle = '#bde0fe'; Arcade.draw.rr(ctx, 4, 4, 112, 82, 14); ctx.fill(); ctx.fillStyle = '#f3d98e'; ctx.fillRect(4, 70, 112, 16);
        const s = { castle: 0.52, coral: 0.75, plants: 0.5, chest: 0.85, snail: 1.1, rainbow: 0.9, star: 1.3, bubbler: 1.3 }[d.id];
        drawDecor(ctx, d.id, d.id === 'snail' ? 52 : 60, 80, s, 0.6); });
      const tile = Arcade.h('button', { type: 'button', class: 'ar-tile', 'data-decor': d.id });
      const paint = () => {
        const own = hasDecor(g, d.id);
        tile.classList.toggle('picked', own);
        tile.innerHTML = `<div class="pic"><img alt="" src="${im}" style="height:70px"></div><div>${d.name}</div><div class="meta">${own ? tick : price(d.cost)}</div>`;
      };
      paint();
      tile.addEventListener('click', () => {
        if (hasDecor(g, d.id)) { Arcade.sfx('click'); return; }
        if (!buy(d, 'decor')) { shake(tile); return; }
        paint();
        tile.animate([{ transform: 'scale(1.15) rotate(-4deg)' }, { transform: 'none' }], 400);
      });
      dg.appendChild(tile);
    }
    p.appendChild(dg);

    const btns = Arcade.h('div', { class: 'ar-btns' });
    btns.appendChild(btn(tankIcon, 'Aquarium', 'big', () => { Arcade.sfx('click'); openAquarium(g, F); }, 'data-tank-btn'));
    btns.appendChild(btn(Arcade.icons.left, 'Back', 'white', () => { Arcade.sfx('click'); g.menu(); }));
    p.appendChild(btns);
    g.panel(p);
  }

  // The goals for the Fish Book page: one row per place, 8 pictures, done ones ticked.
  function goalsPanel(g, F) {
    const wrap = Arcade.h('div');
    for (const loc of F.LOC_ORDER) {
      const row = Arcade.h('div', { class: 'fish-goals', 'data-goals': loc });
      row.appendChild(Arcade.h('div', { class: 'fish-goals-name' }, F.LOCS[loc].name));
      const done = goalsDone(g, loc);
      GOALS[loc].forEach((d, i) => {
        const im = pic(ctx => { drawGoalTarget(ctx, F, d, 40, 32, 0.4); if (d.n || d.kinds || d.big) Arcade.draw.text(ctx, d.n ? '×' + d.n : d.kinds ? '' + d.kinds : d.cm + '+', 64, 54, { size: 16 }); }, 80, 64);
        row.appendChild(Arcade.h('div', { class: 'fish-goal' + (i < done ? ' done' : i === done ? ' now' : '') },
          `<img alt="" src="${im}">` + (i < done ? '<span class="ok">✓</span>' : '')));
      });
      wrap.appendChild(row);
    }
    return wrap;
  }

  window.FishExtras = {
    SHELLS, BAITS, DECOR, GOALS, REWARD,
    shells, addShells, bait, hasDecor, goal, goalsDone, progress,
    drawShell, drawLure, drawDecor, drawGoalChip, drawGoalTarget,
    openAquarium, openShop, goalsPanel, shellSvg, tankIcon, shopIcon,
  };
})();
