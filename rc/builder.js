// =====================================================================
// Mini RC Racers — the Track Builder (Nov 16, point 8 "Deeper favorites").
//
// Kids make their own race tracks:
//  * DRAW: pull a loop with one finger. We even out the wobbly line into
//    10-18 "dots" (control points) and draw the same smooth road the real
//    tracks use (a Catmull-Rom spline, see spline() in rc.js).
//  * DRAG a dot to bend the road; tap the road to add a new dot there.
//  * The dice makes a surprise track; the arrow undoes the last change.
//  * Pick a world (the 10 track looks: backyard, beach, snow...).
//  * Race it (3 computer cars, 3 laps) or Drive it (find the stars).
//
// The road must not run into itself: if two parts of the road get too close,
// or a bend is too tight, a red ring pulses there and the Race button wiggles
// "no". ONE clean crossing is allowed: it becomes a bridge (like Candy Raceway).
//
// Nov 19 (Keith: "make the create a race track better"):
//  * THINGS: put your own gift boxes, boost pads, jump ramps, bumpers, oil, puddles and
//    a moving critter on the road (things: [{k, f, lat}], f = how far round the lap 0..1,
//    lat = left/right -1..1). A track with no `things` list gets them placed for it, like before.
//  * LOOK: laps (1-5), weather and road width (thin / normal / wide).
//  * Friends: the room maker can pick one of their own tracks; it travels to the other
//    phones packed small (pack / unpack) and everyone races it.
//
// 3 tracks per player, saved in the RC save as data.myTracks = [{pts, theme, bridge, L, things, laps, weather, hw}].
// rc.js hands us the bits we need (K) and calls:
//   menu(g)        the "My tracks" screen (3 slots)
//   edit(g, slot)  the builder itself
//   def(g, slot)   a track definition the race code can use (like one from TRACKS)
// =====================================================================
window.RCBuilder = function (K) {
  'use strict';
  const { THEMES, TRACKS, SONGS, spline, makePath, screen, trackPic, FLAG_PIC, STAR_PIC, WEATHER_ICONS } = K;
  const { icons } = Arcade;
  const INK = '#2b2b2b';

  const HW = 96;                 // road half-width (between Backyard Loop and Sunny Beach: roomy)
  const WIDTHS = [76, 96, 124];  // thin, normal, wide (Nov 19)
  const WEATHERS = ['sun', 'rain', 'snow', 'wind'];
  const MAX_THINGS = 16;
  // the things you can put on your track (k = kind)
  const THINGS = ['gift', 'boost', 'ramp', 'bumper', 'oil', 'puddle', 'critter'];
  const BW = 6000, BH = 3820;    // the building board, in track units (the picture shows all of it)
  const EDGE = 380;              // keep dots this far inside the board (room for the grass + walls)
  const MIN_L = 7000;            // a lap at least this long (smaller drawings get blown up)
  const MAX_DOTS = 24, SLOTS = 3;
  const WORLDS = Object.keys(THEMES);
  // each world plays the song of the real track that has that look
  const songOf = (theme) => (TRACKS.find(t => t.theme === theme) || TRACKS[0]).id;

  // ---------------------------------------------------------------
  // Checking a track: is it OK to race on?
  // Returns { ok, bad: [[x, y], ...] problem spots, bridge: true/false, L: lap length }
  // ---------------------------------------------------------------
  function check(pts, hw = HW) {
    const GAP = 2 * hw + 80;       // (a wider road needs more room between its parts)
    const P = makePath(spline(pts, true), true), n = P.pts.length, st = P.step, out = { ok: false, bad: [], bridge: false, L: P.L };
    const lap = (a, b) => { const d = Math.abs(a - b) % n; return Math.min(d, n - d); };   // how far apart along the road (in points)
    // 1. bends that are too tight (the road would fold over itself)
    for (let k = 0; k < n; k += 2) {
      const a = (k - 3 + n) % n, b = (k + 3) % n;
      let ang = Math.abs(Math.atan2(P.ty[b], P.tx[b]) - Math.atan2(P.ty[a], P.tx[a]));
      if (ang > Math.PI) ang = 2 * Math.PI - ang;
      if (6 * st / Math.max(ang, 0.001) < hw * 1.1) out.bad.push(P.pts[k].slice());
    }
    // 2. different parts of the road too close together. Group the close pairs into "spots".
    const spots = [];
    for (let i = 0; i < n; i += 2) for (let j = i + 2; j < n; j += 2) {
      if (lap(i, j) * st < GAP * 2.3) continue;            // (neighbors along the road don't count)
      const d = Math.hypot(P.pts[i][0] - P.pts[j][0], P.pts[i][1] - P.pts[j][1]);
      if (d >= GAP) continue;
      let sp = spots.find(q => lap(q.i, i) < 70 && lap(q.j, j) < 70);
      if (!sp) { sp = { i, j, d, cross: false, ang: 0 }; spots.push(sp); }
      if (d < sp.d) { sp.d = d; sp.i = i; sp.j = j; }
    }
    // does the road really cross itself at a spot (an X), and how steeply?
    for (const sp of spots) {
      if (sp.d > 2 * st + 2) continue;
      sp.cross = true;
      let ang = Math.abs(Math.atan2(P.ty[sp.i], P.tx[sp.i]) - Math.atan2(P.ty[sp.j], P.tx[sp.j])) % Math.PI;
      sp.ang = Math.min(ang, Math.PI - ang) * 180 / Math.PI;   // 90 = a perfect +, 0 = side by side
    }
    // ONE clean X (steep enough, away from the start line) = a bridge. Anything else = a problem.
    const far = (k) => Math.min(k, n - k) * st > 900;
    if (spots.length === 1 && spots[0].cross && spots[0].ang >= 40 && far(spots[0].i) && far(spots[0].j)) out.bridge = true;
    else for (const sp of spots) out.bad.push([(P.pts[sp.i][0] + P.pts[sp.j][0]) / 2, (P.pts[sp.i][1] + P.pts[sp.j][1]) / 2]);
    out.ok = out.bad.length === 0 && P.L >= MIN_L * 0.98;
    out.dense = P.pts;
    return out;
  }

  // ---------------------------------------------------------------
  // Shapes
  // ---------------------------------------------------------------
  const clampPt = ([x, y]) => [Math.round(Math.max(EDGE, Math.min(BW - EDGE, x))), Math.round(Math.max(EDGE, Math.min(BH - EDGE, y)))];
  const lapLen = (pts) => makePath(spline(pts, true), true).L;
  // too small? blow it up (around its middle) so the lap is long enough to race on
  function grow(pts) {
    const L = lapLen(pts);
    if (L >= MIN_L) return pts.map(clampPt);
    const k = MIN_L / L * 1.03;
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    let out = pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);
    // slide it back onto the board if it grew over an edge
    const x0 = Math.min(...out.map(p => p[0])), x1 = Math.max(...out.map(p => p[0]));
    const y0 = Math.min(...out.map(p => p[1])), y1 = Math.max(...out.map(p => p[1]));
    const dx = x0 < EDGE ? EDGE - x0 : x1 > BW - EDGE ? BW - EDGE - x1 : 0;
    const dy = y0 < EDGE ? EDGE - y0 : y1 > BH - EDGE ? BH - EDGE - y1 : 0;
    return out.map(([x, y]) => clampPt([x + dx, y + dy]));
  }
  // The start line goes on the straightest bit (and never on the bridge).
  // A loop through the same dots is the same road whichever dot comes first.
  function pickStart(pts) {
    const n = pts.length;
    const bend = (k) => {
      const a = pts[(k - 1 + n) % n], b = pts[k], c = pts[(k + 1) % n];
      let d = Math.abs(Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(b[1] - a[1], b[0] - a[0]));
      return d > Math.PI ? 2 * Math.PI - d : d;
    };
    const order = pts.map((_, k) => k).sort((a, b) => bend(a) - bend(b));
    const turn = (k) => pts.slice(k).concat(pts.slice(0, k));
    for (const k of order.slice(0, 8)) { const t = turn(k); if (check(t).ok) return t; }
    return turn(order[0]);
  }
  // a finger drawing -> evenly spaced dots
  function fromStroke(stroke) {
    const loop = stroke.concat([stroke[0]]);
    let len = 0; const acc = [0];
    for (let i = 1; i < loop.length; i++) { len += Math.hypot(loop[i][0] - loop[i - 1][0], loop[i][1] - loop[i - 1][1]); acc.push(len); }
    const N = Math.max(8, Math.min(16, Math.round(len / 900)));   // (dots about 900 apart: room to tap the road between them)
    const out = [];
    for (let k = 0, i = 0; k < N; k++) {
      const want = k * len / N;
      while (i < acc.length - 2 && acc[i + 1] < want) i++;
      const f = (want - acc[i]) / ((acc[i + 1] - acc[i]) || 1);
      out.push([loop[i][0] + (loop[i + 1][0] - loop[i][0]) * f, loop[i][1] + (loop[i + 1][1] - loop[i][1]) * f]);
    }
    return pickStart(grow(out));
  }
  // the first track in an empty slot: a friendly bean
  const STARTER = [[1500, 3000], [3000, 3100], [4500, 3000], [5250, 2300], [5000, 1200], [4100, 800], [3000, 1350], [1900, 800], [1000, 1200], [750, 2300]];
  // the dice: a surprise blob (sometimes a figure 8 with a bridge)
  function surprise(rnd = Math.random) {
    for (let tries = 0; tries < 40; tries++) {
      let pts;
      if (rnd() < 0.25) {
        const A = 2000 + rnd() * 500, B = 1000 + rnd() * 300, n = 14;
        pts = Array.from({ length: n }, (_, k) => { const t = k / n * Math.PI * 2 + 0.1; return [3000 + A * Math.sin(t), 1910 + B * Math.sin(2 * t)]; });
      } else {
        const n = 8 + Math.floor(rnd() * 5), A = 1900 + rnd() * 600, B = 1100 + rnd() * 300, ph = rnd() * 6.28;
        pts = Array.from({ length: n }, (_, k) => {
          const t = (k + (rnd() - 0.5) * 0.4) / n * Math.PI * 2 + ph, r = 0.68 + rnd() * 0.42;
          return [3000 + A * r * Math.cos(t), 1910 + B * r * Math.sin(t)];
        });
      }
      pts = pickStart(grow(pts));
      if (check(pts).ok) return pts;
    }
    return STARTER.map(p => p.slice());
  }

  // ---------------------------------------------------------------
  // Saves (each player has their own; the kit adds the player to the save key)
  // ---------------------------------------------------------------
  const slots = (g) => { const d = g.save.data; if (!Array.isArray(d.myTracks)) d.myTracks = []; return d.myTracks; };
  function store(g, slot, t) {
    const c = check(t.pts, t.hw || HW);
    const keep = { pts: t.pts.map(clampPt), theme: t.theme, bridge: c.bridge, L: Math.round(c.L), ok: c.ok };
    if (t.things) keep.things = t.things.slice(0, MAX_THINGS);
    if (t.laps) keep.laps = t.laps;
    if (t.weather) keep.weather = t.weather;
    if (t.hw) keep.hw = t.hw;
    slots(g)[slot] = keep;
    g.store();
  }
  // a track definition, just like the ones in TRACKS
  function def(g, slot) {
    const t = slots(g)[slot];
    return t ? defFrom(t, slot) : null;
  }
  // (also used for a friend's track that came over the network: slot 'f')
  function defFrom(t, slot) {
    // the id changes with the shape, world, width and things, so rc.js's track cache never hands back an old one
    let h = 7; for (const [x, y] of t.pts) h = (h * 31 + x * 7 + y) % 1000000007;
    h = (h * 31 + (t.hw || HW)) % 1000000007;
    const hw = t.hw || HW;
    return {
      id: (slot === 'f' ? 'mf' : 'my' + slot) + '-' + h.toString(36) + '-' + t.theme, name: slot === 'f' ? 'Friend\'s track' : 'My track ' + (slot + 1), theme: t.theme, hw,
      items: (t.L || 0) > 12000 ? [0.22, 0.48, 0.74] : [0.3, 0.68],
      bridge: t.bridge ? 'second' : undefined,
      pts: t.pts, custom: true, slot, song: songOf(t.theme),
      things: t.things || null, laps: t.laps || 3, weather: t.weather || null,
    };
  }
  // Friends: a track packed small for the switchboard (it only passes 1 KB messages)
  // and unpacked on the other phones. Things: [kind number, f x 1000, lat x 100].
  function pack(t) {
    return { p: t.pts.map(([x, y]) => [Math.round(x / 10), Math.round(y / 10)]), w: t.theme, b: t.bridge ? 1 : 0, L: t.L,
      h: t.hw || HW, n: t.laps || 3, x: t.weather || '', t: (t.things || []).map(q => [THINGS.indexOf(q.k), Math.round(q.f * 1000), Math.round(q.lat * 100)]), u: t.things ? 1 : 0 };
  }
  function unpack(m) {
    const t = { pts: m.p.map(([x, y]) => [x * 10, y * 10]), theme: THEMES[m.w] ? m.w : 'yard', bridge: !!m.b, L: m.L, hw: WIDTHS.includes(m.h) ? m.h : HW, laps: Math.max(1, Math.min(5, m.n | 0 || 3)), weather: WEATHERS.includes(m.x) ? m.x : null };
    if (m.u) t.things = (m.t || []).slice(0, MAX_THINGS).filter(q => THINGS[q[0]]).map(q => ({ k: THINGS[q[0]], f: q[1] / 1000, lat: q[2] / 100 }));
    return t;
  }

  // ---------------------------------------------------------------
  // Little pictures
  // ---------------------------------------------------------------
  const L4 = `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
  const PICS = {
    // the Build tile: a road loop with a big pencil drawing it
    build: `<svg viewBox="0 0 80 80"><ellipse cx="36" cy="44" rx="28" ry="20" fill="none" stroke="${INK}" stroke-width="15"/><ellipse cx="36" cy="44" rx="28" ry="20" fill="none" stroke="#8d93a8" stroke-width="8" stroke-dasharray="80 200" stroke-dashoffset="0"/>` +
      `<path d="M8 44 A28 20 0 0 1 36 24" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="5 5"/>` +
      `<g transform="translate(52 28) rotate(40)"><rect x="-7" y="-30" width="14" height="38" rx="2" fill="#ffd166" ${L4}/><path d="M-7 8 L0 22 L7 8 Z" fill="#f4d6b0" ${L4}/><path d="M-2.5 17 L0 22 L2.5 17 Z" fill="${INK}"/><rect x="-7" y="-36" width="14" height="8" rx="3" fill="#ef476f" ${L4}/></g></svg>`,
    pencil: `<svg viewBox="0 0 48 48"><g transform="translate(24 24) rotate(45)"><rect x="-6" y="-20" width="12" height="28" rx="2" fill="#ffd166" ${L4}/><path d="M-6 8 L0 19 L6 8 Z" fill="#f4d6b0" ${L4}/><rect x="-6" y="-25" width="12" height="7" rx="3" fill="#ef476f" ${L4}/></g></svg>`,
    dice: `<svg viewBox="0 0 48 48"><rect x="7" y="7" width="34" height="34" rx="9" fill="#fff" ${L4}/><circle cx="16" cy="16" r="3.5" fill="${INK}"/><circle cx="32" cy="16" r="3.5" fill="${INK}"/><circle cx="24" cy="24" r="3.5" fill="#ef476f"/><circle cx="16" cy="32" r="3.5" fill="${INK}"/><circle cx="32" cy="32" r="3.5" fill="${INK}"/></svg>`,
    undo: `<svg viewBox="0 0 48 48"><path d="M14 20 H30 A10 10 0 0 1 30 40 H18" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M20 10 L10 20 L20 30" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    plus: `<svg viewBox="0 0 120 70"><rect x="3" y="3" width="114" height="64" rx="10" fill="rgba(255,255,255,0.5)" stroke="#9aa7b5" stroke-width="4" stroke-dasharray="8 6"/><circle cx="60" cy="35" r="20" fill="#06d6a0" ${L4}/><path d="M60 25 V45 M50 35 H70" stroke="#fff" stroke-width="6" stroke-linecap="round"/></svg>`,
  };
  // the things you can put on the road (Nov 19), and the Things / Look tool buttons
  const THING_PICS = {
    gift: `<svg viewBox="0 0 48 48"><rect x="9" y="14" width="30" height="26" rx="6" fill="#9b5de5" ${L4}/><rect x="21" y="14" width="6" height="26" fill="#fff"/><rect x="9" y="24" width="30" height="6" fill="#fff"/><path d="M24 14 C16 4 9 10 17 14 M24 14 C32 4 39 10 31 14" fill="none" ${L4}/></svg>`,
    boost: `<svg viewBox="0 0 48 48"><rect x="6" y="10" width="36" height="28" rx="8" fill="#3a3a4a" ${L4}/><path d="M12 16 L22 24 L12 32 M24 16 L34 24 L24 32" fill="none" stroke="#ff8c42" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    ramp: `<svg viewBox="0 0 48 48"><path d="M5 38 L43 38 L43 14 Z" fill="#ffd166" ${L4}/><path d="M17 38 L23 32 M27 38 L33 27 M37 38 L41 22" stroke="#ef476f" stroke-width="4" stroke-linecap="round"/></svg>`,
    bumper: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" fill="#ef476f" ${L4}/><circle cx="24" cy="24" r="11" fill="#fff" ${L4}/><path d="M24 17 L26 22 L31 22 L27 25 L28.5 30 L24 27 L19.5 30 L21 25 L17 22 L22 22 Z" fill="#ffd166" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/></svg>`,
    oil: `<svg viewBox="0 0 48 48"><path d="M8 26 C6 14 20 10 26 13 C34 8 44 16 40 26 C44 36 30 40 24 36 C16 40 6 36 8 26 Z" fill="#2d2440" ${L4}/><path d="M16 24 Q24 18 32 24" fill="none" stroke="#f15bb5" stroke-width="3"/><path d="M18 29 Q24 25 30 29" fill="none" stroke="#4cc9f0" stroke-width="3"/></svg>`,
    puddle: `<svg viewBox="0 0 48 48"><path d="M8 26 C6 14 20 10 26 13 C34 8 44 16 40 26 C44 36 30 40 24 36 C16 40 6 36 8 26 Z" fill="#6fc3ec" ${L4}/><path d="M15 22 Q19 19 23 21" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`,
    critter: `<svg viewBox="0 0 48 48"><path d="M4 18 H12 M2 26 H10 M4 34 H12" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><circle cx="29" cy="26" r="15" fill="#fff" ${L4}/><path d="M29 11 A15 15 0 0 1 44 26 L29 26 Z" fill="#ef476f" stroke="${INK}" stroke-width="2.5"/><path d="M29 26 L14 26 A15 15 0 0 0 29 41 Z" fill="#4cc9f0" stroke="${INK}" stroke-width="2.5"/><circle cx="29" cy="26" r="4" fill="#ffd166" stroke="${INK}" stroke-width="2.5"/></svg>`,
    trash: `<svg viewBox="0 0 48 48"><path d="M12 16 H36 L33 42 H15 Z" fill="#dfe7ef" ${L4}/><path d="M9 14 H39 M19 14 V9 H29 V14 M20 22 V36 M28 22 V36" fill="none" ${L4}/></svg>`,
  };
  PICS.things = `<svg viewBox="0 0 48 48"><g transform="translate(-2 4) scale(0.6)">${THING_PICS.gift.replace(/<\/?svg[^>]*>/g, '')}</g><g transform="translate(20 20) scale(0.6)">${THING_PICS.bumper.replace(/<\/?svg[^>]*>/g, '')}</g><g transform="translate(14 -4) scale(0.55)">${THING_PICS.ramp.replace(/<\/?svg[^>]*>/g, '')}</g></svg>`;
  PICS.look = `<svg viewBox="0 0 48 48"><path d="M24 6 C12 6 4 14 4 24 C4 34 12 42 22 42 C26 42 26 38 24 36 C22 33 24 30 28 30 H34 C40 30 44 26 44 20 C44 12 35 6 24 6 Z" fill="#fff1d6" ${L4}/><circle cx="14" cy="22" r="4" fill="#ef476f"/><circle cx="20" cy="13" r="4" fill="#ffd166"/><circle cx="30" cy="12" r="4" fill="#06d6a0"/><circle cx="37" cy="20" r="4" fill="#4cc9f0"/></svg>`;
  const lapsPic = (n) => `<svg viewBox="0 0 48 48"><g transform="scale(0.7) translate(0 4)">${FLAG_PIC.replace(/<\/?svg[^>]*>/g, '')}</g><circle cx="35" cy="34" r="12" fill="#ffd166" ${L4}/><text x="35" y="40" text-anchor="middle" font-size="17" font-weight="900" font-family="Arial Black, sans-serif" fill="${INK}">${n}</text></svg>`;
  const widthPic = (k) => `<svg viewBox="0 0 48 48"><rect x="0" y="0" width="48" height="48" rx="8" fill="#9bd770"/><rect x="${24 - [6, 10, 15][k]}" y="-2" width="${[12, 20, 30][k]}" height="52" fill="#727a8c" stroke="${INK}" stroke-width="3"/><path d="M24 4 V44" stroke="#fff" stroke-width="2.5" stroke-dasharray="5 5"/></svg>`;
  // a world swatch: its grass, sand/snow band and road
  const worldPic = (id) => { const th = THEMES[id]; return `<svg viewBox="0 0 60 44"><rect width="60" height="44" rx="8" fill="${th.outer}"/>` +
    `<path d="M-4 30 Q30 4 64 30" fill="none" stroke="${th.band}" stroke-width="20"/><path d="M-4 30 Q30 4 64 30" fill="none" stroke="${INK}" stroke-width="12"/>` +
    `<path d="M-4 30 Q30 4 64 30" fill="none" stroke="${th.road}" stroke-width="8"/><path d="M-4 30 Q30 4 64 30" fill="none" stroke="${th.curb}" stroke-width="2" stroke-dasharray="4 4"/></svg>`; };

  const wiggle = (b) => b.animate([{ transform: 'rotate(-5deg)' }, { transform: 'rotate(5deg)' }, { transform: 'rotate(-3deg)' }, { transform: 'none' }], 360);

  // ---------------------------------------------------------------
  // "My tracks": 3 slots. Empty = a green +, made = its picture.
  // ---------------------------------------------------------------
  function menu(g) {
    const p = screen('My tracks', () => K.mainMenu(g));
    const grid = Arcade.h('div', { class: 'ar-grid rc-modes rc-modes3 rc-body' });
    for (let s = 0; s < SLOTS; s++) {
      const d = def(g, s);
      const b = Arcade.h('button', { type: 'button', class: 'ar-tile', 'data-slot': s },
        `<div class="pic rc-mypic">${d ? trackPic(d) : PICS.plus}</div><div style="font-size:22px">${d ? (s + 1) : ''}</div>`);
      b.addEventListener('click', () => { Arcade.sfx('click'); edit(g, s); });
      grid.appendChild(b);
    }
    p.appendChild(grid);
    g.panel(p);
  }

  // ---------------------------------------------------------------
  // The builder
  // ---------------------------------------------------------------
  const CW = 640, CH = Math.round(CW * BH / BW);   // the board picture (CSS px inside the 880 x 620 panel)
  function edit(g, slot) {
    if (!slots(g)[slot]) store(g, slot, { pts: STARTER.map(p => p.slice()), theme: WORLDS[slot % 3 === 0 ? 0 : slot % 3 === 1 ? 1 : 2] });
    const t = JSON.parse(JSON.stringify(slots(g)[slot]));
    const hw = () => t.hw || HW;
    let res = check(t.pts, hw());
    const history = [];                       // for Undo
    const snap = () => JSON.stringify({ pts: t.pts, theme: t.theme, things: t.things, laps: t.laps, weather: t.weather, hw: t.hw });
    const snapshot = () => { history.push(snap()); if (history.length > 30) history.shift(); };
    let drawMode = false, stroke = null, dragK = -1, live = null, flash = 0;
    let mode = 'road', piece = 'gift';        // mode: road (drag dots) / things (put things on) / look (laps, weather, width)

    const p = screen('Build', () => { stop(); menu(g); });
    p.classList.add('rc-wide');            // (the board needs the wide panel, also on a phone held upright)
    p.setAttribute('data-builder', slot);
    const body = Arcade.h('div', { class: 'rc-build' });
    const left = Arcade.h('div', { class: 'rc-build-left' });
    const cv = Arcade.h('canvas', { class: 'rc-board', width: CW * 2, height: CH * 2, 'data-board': '1' });
    cv.style.width = CW + 'px'; cv.style.height = CH + 'px';
    left.appendChild(cv);
    const worlds = Arcade.h('div', { class: 'rc-worlds' });   // (the row under the board: worlds, things or looks)
    left.appendChild(worlds);
    const tools = Arcade.h('div', { class: 'rc-tools' });
    const small = Arcade.h('div', { class: 'rc-tools2' });     // the small picture buttons, 2 across
    tools.appendChild(small);
    body.append(left, tools);
    p.appendChild(body);

    const btn = (attr, cls, pic, label, onClick, into = tools) => {
      const b = Arcade.h('button', { type: 'button', class: 'ar-btn ' + cls, [attr]: '1', 'aria-label': label }, into === small ? pic : `${pic}<span>${label}</span>`);
      b.addEventListener('click', () => onClick(b));
      into.appendChild(b);
      return b;
    };
    const setMode = (m) => { Arcade.sfx('click'); mode = mode === m ? 'road' : m; drawMode = false; paintTools(); paint(); };
    const bDraw = btn('data-draw', 'white', PICS.pencil, 'Draw', () => { Arcade.sfx('click'); drawMode = !drawMode; mode = 'road'; paintTools(); paint(); }, small);
    const bThings = btn('data-things', 'white', PICS.things, 'Things', () => setMode('things'), small);
    const bLook = btn('data-look', 'white', PICS.look, 'Look', () => setMode('look'), small);
    btn('data-dice', 'white', PICS.dice, 'New', () => { Arcade.sfx('pop'); snapshot(); t.pts = surprise(); changed(); }, small);
    const bUndo = btn('data-undo', 'white', PICS.undo, 'Undo', (b) => {
      if (!history.length) { Arcade.sfx('bonk'); wiggle(b); return; }
      Arcade.sfx('click'); Object.assign(t, { things: undefined, laps: undefined, weather: undefined, hw: undefined }, JSON.parse(history.pop())); changed(true);
    }, small);
    tools.appendChild(Arcade.h('div', { style: 'flex:1' }));
    const go = (b, id) => {
      if (!res.ok) { Arcade.sfx('bonk'); wiggle(b); flash = 1.2; return; }    // red rings show what to fix
      Arcade.sfx('go'); stop(); g.play({ id: id + '-' + slot, name: 'My track ' + (slot + 1) });
    };
    const bRace = btn('data-race', 'green big', FLAG_PIC, 'Race', (b) => go(b, 'my'));
    const bDrive = btn('data-drive', 'yellow', STAR_PIC, 'Drive', (b) => go(b, 'myd'));

    function paintTools() {
      bDraw.className = 'ar-btn ' + (drawMode ? 'yellow' : 'white');
      bThings.className = 'ar-btn ' + (mode === 'things' ? 'yellow' : 'white');
      bLook.className = 'ar-btn ' + (mode === 'look' ? 'yellow' : 'white');
      bUndo.style.opacity = history.length ? 1 : 0.5;
      for (const b of [bRace, bDrive]) b.classList.toggle('rc-nogo', !res.ok);
      worlds.innerHTML = '';
      const add = (attrs, pic, picked, onClick, cls = 'rc-world') => {
        const b = Arcade.h('button', Object.assign({ type: 'button', class: cls + (picked ? ' picked' : '') }, attrs), pic);
        b.addEventListener('click', () => onClick(b));
        worlds.appendChild(b);
        return b;
      };
      if (mode === 'things') {
        // the things to put on the road: pick one, then tap the road. Tap a thing on the road = take it away.
        for (const k of THINGS) add({ 'data-piece': k, 'aria-label': k }, THING_PICS[k], piece === k, () => { Arcade.sfx('click'); piece = k; paintTools(); }, 'rc-world rc-piece');
        add({ 'data-clear': '1', 'aria-label': 'clear' }, THING_PICS.trash, false, (b) => {
          if (!t.things || !t.things.length) { Arcade.sfx('bonk'); wiggle(b); return; }
          Arcade.sfx('whoosh'); snapshot(); t.things = []; changed(true);
        }, 'rc-world rc-piece');
      } else if (mode === 'look') {
        // laps (tap = one more, after 5 back to 1), the weather, and how wide the road is
        add({ 'data-laps': t.laps || 3, 'aria-label': 'laps' }, lapsPic(t.laps || 3), false, () => { Arcade.sfx('click'); snapshot(); t.laps = (t.laps || 3) % 5 + 1; changed(true); }, 'rc-world rc-piece');
        for (const w of WEATHERS) add({ 'data-sky': w, 'aria-label': w }, WEATHER_ICONS[w], (t.weather || 'sun') === w, () => { Arcade.sfx('click'); snapshot(); t.weather = w; changed(true); }, 'rc-world rc-piece');
        WIDTHS.forEach((wd, k) => add({ 'data-width': wd, 'aria-label': 'width' }, widthPic(k), hw() === wd, () => { if (hw() === wd) return; Arcade.sfx('click'); snapshot(); t.hw = wd; changed(); }, 'rc-world rc-piece'));
      } else {
        for (const w of WORLDS) add({ 'data-world': w }, worldPic(w), t.theme === w, () => { if (t.theme === w) return; Arcade.sfx('click'); snapshot(); t.theme = w; changed(true); });
      }
    }
    // after every change: check it, save it, paint it
    function changed(quiet) {
      res = check(t.pts, hw());
      t.bridge = res.bridge;
      store(g, slot, t);
      if (!quiet) Arcade.sfx(res.ok ? (res.bridge ? 'spring' : 'pop') : 'aww');
      paintTools(); paint();
    }

    // where a thing sits on the board: f = how far round the lap, lat = left / right
    function thingXY(q) {
      const P = res.dense, n = P.length, i = Math.round(q.f * n) % n, a = P[i], b = P[(i + 2) % n];
      const an = Math.atan2(b[1] - a[1], b[0] - a[0]), off = (q.k === 'gift' || q.k === 'boost' || q.k === 'ramp' ? 0 : q.lat) * hw() * 0.6;
      return [a[0] - Math.sin(an) * off, a[1] + Math.cos(an) * off, an];
    }
    // a thing drawn on the board (in track units; s = size)
    function drawThing(c, k, x, y, a, s) {
      c.save(); c.translate(x, y); c.scale(s, s);
      const blob = (fill) => { c.beginPath(); c.ellipse(0, 0, 110, 80, 0, 0, 7); c.fillStyle = fill; c.fill(); c.lineWidth = 22; c.strokeStyle = INK; c.stroke(); };
      if (k === 'gift') {                  // a row of 3 gift boxes across the road
        c.rotate(a);
        for (const d of [-1, 0, 1]) { const yy = d * hw() * 0.6; c.fillStyle = '#9b5de5'; c.fillRect(-45, yy - 45, 90, 90); c.lineWidth = 18; c.strokeStyle = INK; c.strokeRect(-45, yy - 45, 90, 90); c.fillStyle = '#fff'; c.fillRect(-10, yy - 45, 20, 90); c.fillRect(-45, yy - 10, 90, 20); }
      } else if (k === 'boost' || k === 'ramp') {
        c.rotate(a);
        c.fillStyle = k === 'boost' ? '#3a3a4a' : '#ffd166'; c.fillRect(-70, -hw() * 0.9, 140, hw() * 1.8);
        c.lineWidth = 20; c.strokeStyle = INK; c.strokeRect(-70, -hw() * 0.9, 140, hw() * 1.8);
        c.strokeStyle = k === 'boost' ? '#ff8c42' : '#ef476f'; c.lineWidth = 26; c.lineCap = 'round'; c.lineJoin = 'round';
        c.beginPath(); if (k === 'boost') { c.moveTo(-40, -50); c.lineTo(20, 0); c.lineTo(-40, 50); } else { c.moveTo(-40, 0); c.lineTo(40, 0); } c.stroke();
      } else if (k === 'bumper') {
        c.beginPath(); c.arc(0, 0, 100, 0, 7); c.fillStyle = '#ef476f'; c.fill(); c.lineWidth = 22; c.strokeStyle = INK; c.stroke();
        c.beginPath(); c.arc(0, 0, 55, 0, 7); c.fillStyle = '#fff'; c.fill(); c.stroke();
      } else if (k === 'oil') blob('#2d2440');
      else if (k === 'puddle') blob('#6fc3ec');
      else if (k === 'critter') {
        c.beginPath(); c.arc(0, 0, 90, 0, 7); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 22; c.strokeStyle = INK; c.stroke();
        c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 90, -1.57, 0); c.closePath(); c.fillStyle = '#ef476f'; c.fill();
        c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 90, 1.57, 3.14); c.closePath(); c.fillStyle = '#4cc9f0'; c.fill();
        c.beginPath(); c.arc(0, 0, 90, 0, 7); c.stroke();
      }
      c.restore();
    }
    // a track with no things list yet: the things the race would have put there by itself (so you can change them)
    function startThings() {
      if (t.things) return;
      t.things = [];
      for (const f of (res.L > 12000 ? [0.22, 0.48, 0.74] : [0.3, 0.68])) t.things.push({ k: 'gift', f, lat: 0 });
      t.things.push({ k: 'boost', f: 0.15, lat: 0 }, { k: 'ramp', f: 0.55, lat: 0 }, { k: 'puddle', f: 0.4, lat: 0.5 }, { k: 'oil', f: 0.85, lat: -0.5 });
    }

    // ---- drawing the board ----
    const ctx = cv.getContext('2d');
    const sc = (CW * 2) / BW;                   // track units -> canvas pixels
    function paint() {
      const th = THEMES[t.theme];
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = th.outer; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.setTransform(sc, 0, 0, sc, 0, 0);
      const dense = live || spline(t.pts, true);
      const road = new Path2D(); dense.forEach(([x, y], i) => i ? road.lineTo(x, y) : road.moveTo(x, y)); road.closePath();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.globalAlpha = drawMode ? 0.35 : 1;
      const HW = hw();                          // (this track's road width)
      ctx.strokeStyle = th.band; ctx.lineWidth = (HW + 110) * 2; ctx.stroke(road);
      ctx.strokeStyle = INK; ctx.lineWidth = HW * 2 + 50; ctx.stroke(road);
      ctx.strokeStyle = th.road; ctx.lineWidth = HW * 2; ctx.stroke(road);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 14; ctx.setLineDash([70, 70]); ctx.stroke(road); ctx.setLineDash([]);
      // which way the race goes: white arrows on the road
      const P = res.dense && !live ? res.dense : null;
      if (P) for (let k = 30; k < P.length - 20; k += 70) {
        const a = P[k], b = P[(k + 3) % P.length], an = Math.atan2(b[1] - a[1], b[0] - a[0]);
        ctx.save(); ctx.translate(a[0], a[1]); ctx.rotate(an);
        ctx.beginPath(); ctx.moveTo(-34, -46); ctx.lineTo(16, 0); ctx.lineTo(-34, 46);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 26; ctx.stroke(); ctx.restore();
      }
      // the start line: black + white squares across the road
      const a = dense[0], b = dense[1], an = Math.atan2(b[1] - a[1], b[0] - a[0]);
      ctx.save(); ctx.translate(a[0], a[1]); ctx.rotate(an);
      for (let r = 0; r < 2; r++) for (let k = -4; k < 4; k++) { ctx.fillStyle = (r + k) % 2 ? '#fff' : INK; ctx.fillRect(-48 + r * 48, k * HW / 4, 48, HW / 4); }
      ctx.restore();
      ctx.globalAlpha = 1;
      // the bridge: a little wooden bridge where the road crosses itself
      if (res.bridge && !live && !drawMode) {
        const n = res.dense.length; let best = { d: Infinity };
        for (let i = 0; i < n; i += 3) for (let j = i + 60; j < n; j += 3) {
          const d = Math.hypot(res.dense[i][0] - res.dense[j][0], res.dense[i][1] - res.dense[j][1]);
          if (d < best.d && Math.min(j - i, n - (j - i)) > 60) best = { d, j };
        }
        const seg = new Path2D();
        for (let k = -28; k <= 28; k++) { const q = res.dense[(best.j + k + n) % n]; k === -28 ? seg.moveTo(q[0], q[1]) : seg.lineTo(q[0], q[1]); }
        ctx.lineCap = 'butt';
        ctx.strokeStyle = INK; ctx.lineWidth = HW * 2 + 150; ctx.stroke(seg);
        ctx.strokeStyle = '#c98b4f'; ctx.lineWidth = HW * 2 + 100; ctx.stroke(seg);          // wooden rails
        ctx.strokeStyle = INK; ctx.lineWidth = HW * 2 + 30; ctx.stroke(seg);
        ctx.strokeStyle = th.road; ctx.lineWidth = HW * 2; ctx.stroke(seg); ctx.lineCap = 'round';
      }
      // your things on the road (in Things mode they're big and bright, otherwise a bit see-through)
      if (!live && !drawMode && t.things) {
        ctx.globalAlpha = mode === 'things' ? 1 : 0.8;
        for (const q of t.things) {
          const [x, y, a] = thingXY(q);
          drawThing(ctx, q.k, x, y, a, mode === 'things' ? 1.25 : 0.9);
        }
        ctx.globalAlpha = 1;
      }
      // the dots you can drag
      // (the first dot is the start: a black + white checkered dot)
      if (!drawMode && mode === 'road') t.pts.forEach(([x, y], k) => {
        const r = k ? 95 : 125;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = k === dragK ? '#ffd166' : '#ffffff'; ctx.fill();
        if (!k && dragK !== 0) {
          ctx.save(); ctx.clip(); ctx.fillStyle = INK;
          for (let i = -3; i < 3; i++) for (let j = -3; j < 3; j++) if ((i + j) % 2) ctx.fillRect(x + i * 50, y + j * 50, 50, 50);
          ctx.restore();
        }
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.lineWidth = 26; ctx.strokeStyle = INK; ctx.stroke();
      });
      // problems: pulsing red rings
      if (!live && !drawMode) {
        const pulse = 1 + 0.15 * Math.sin(performance.now() / 160) + flash * 0.4;
        for (const [x, y] of res.bad) {
          ctx.beginPath(); ctx.arc(x, y, 230 * pulse, 0, Math.PI * 2);
          ctx.lineWidth = 46; ctx.strokeStyle = '#ef233c'; ctx.stroke();
          ctx.lineWidth = 16; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        }
      }
      // the line your finger is drawing
      if (stroke && stroke.length > 1) {
        ctx.beginPath(); stroke.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        ctx.strokeStyle = INK; ctx.lineWidth = 120; ctx.stroke();
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 60; ctx.stroke();
        ctx.beginPath(); ctx.arc(stroke[0][0], stroke[0][1], 110, 0, Math.PI * 2); ctx.fillStyle = '#06d6a0'; ctx.fill(); ctx.lineWidth = 24; ctx.strokeStyle = INK; ctx.stroke();
      }
    }
    // keep the red rings pulsing while the builder is open
    let raf = 0, last = performance.now();
    const tick = (now) => {
      if (!cv.isConnected) { raf = 0; return; }
      flash = Math.max(0, flash - (now - last) / 1000); last = now;
      if (res.bad.length && !drawMode) paint();
      raf = requestAnimationFrame(tick);
    };
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

    // ---- fingers on the board ----
    const toWorld = (e) => {
      const r = cv.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width * BW, (e.clientY - r.top) / r.height * BH];
    };
    const near = (w, pt) => Math.hypot(w[0] - pt[0], w[1] - pt[1]);
    let before = null;
    cv.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch (_) { /* (old browsers) */ }
      const w = toWorld(e);
      if (drawMode) { stroke = [w]; return; }
      if (mode === 'look') return;
      if (mode === 'things') { tapThing(w); return; }
      // grab the nearest dot (a big grab area for little fingers)
      const px = BW / cv.getBoundingClientRect().width;     // track units per screen pixel (small on phones)
      let best = -1, bd = Math.max(330, 24 * px);
      t.pts.forEach((pt, k) => { const d = near(w, pt); if (d < bd) { bd = d; best = k; } });
      if (best < 0) {
        // tap on the road = a new dot there
        const dense = spline(t.pts, true);
        let bi = -1, bdd = Math.max(HW * 1.6, 18 * px);
        dense.forEach((pt, i) => { const d = near(w, pt); if (d < bdd) { bdd = d; bi = i; } });
        if (bi < 0 || t.pts.length >= MAX_DOTS) return;
        snapshot(); before = 'added';
        best = Math.floor(bi / 24) + 1;                // spline() puts 24 points between two dots
        t.pts.splice(best, 0, clampPt(w));
        Arcade.sfx('pop');
      } else { before = JSON.stringify({ pts: t.pts, theme: t.theme }); }
      dragK = best;
      live = spline(t.pts, true); paint();
    });
    cv.addEventListener('pointermove', (e) => {
      if (stroke) { const w = toWorld(e), q = stroke[stroke.length - 1]; if (near(w, q) > 40) { stroke.push(w); paint(); } return; }
      if (dragK < 0) return;
      t.pts[dragK] = clampPt(toWorld(e));
      live = spline(t.pts, true); paint();
    });
    const up = () => {
      if (stroke) {
        const s = stroke; stroke = null;
        let len = 0; for (let i = 1; i < s.length; i++) len += near(s[i], s[i - 1]);
        if (s.length < 6 || len < 1200) { Arcade.sfx('aww'); paint(); return; }   // just a dot or a dash: try again
        snapshot(); t.pts = fromStroke(s); drawMode = false; changed();
        return;
      }
      if (dragK < 0) return;
      if (before && before !== 'added') history.push(before);
      if (history.length > 30) history.shift();
      before = null; dragK = -1; live = null;
      changed();
    };
    // Things mode: tap a thing = take it away; tap the road = put the picked thing there
    function tapThing(w) {
      startThings();
      const px = BW / cv.getBoundingClientRect().width;
      const hit = t.things.findIndex(q => { const [x, y] = thingXY(q); return Math.hypot(w[0] - x, w[1] - y) < Math.max(170, 22 * px); });
      if (hit >= 0) { snapshot(); t.things.splice(hit, 1); Arcade.sfx('whoosh'); changed(true); return; }
      const P = res.dense, n = P.length;
      let bi = -1, bd = Math.max(hw() * 1.5, 18 * px);
      P.forEach((q, i) => { const d = near(w, q); if (d < bd) { bd = d; bi = i; } });
      if (bi < 0) { Arcade.sfx('bonk'); return; }                       // not on the road
      if (t.things.length >= MAX_THINGS) { Arcade.sfx('bonk'); wiggle(cv); return; }
      // which side of the road (for bumpers, oil, puddles, critters)
      const a = P[bi], b = P[(bi + 2) % n], an = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const side = (-(w[0] - a[0]) * Math.sin(an) + (w[1] - a[1]) * Math.cos(an)) / (hw() * 0.6);
      snapshot();
      t.things.push({ k: piece, f: Math.round(bi / n * 1000) / 1000, lat: Math.round(Math.max(-1, Math.min(1, side)) * 100) / 100 });
      Arcade.sfx('pop'); changed(true);
    }
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);

    paintTools(); paint();
    g.panel(p);
    raf = requestAnimationFrame(tick);
    // test-only peeks
    window.__rcBuild = { state: () => ({ slot, pts: t.pts.map(q => q.slice()), theme: t.theme, ok: res.ok, bad: res.bad.length, bridge: res.bridge, L: Math.round(res.L), draw: drawMode, undo: history.length,
        mode, piece, things: t.things ? t.things.map(q => Object.assign({}, q)) : null, laps: t.laps || 3, weather: t.weather || null, hw: hw() }),
      thingXY: (k) => thingXY(t.things[k]), roadAt: (f) => res.dense[Math.round(f * res.dense.length) % res.dense.length],
      board: () => ({ w: BW, h: BH }), mid: (k) => spline(t.pts, true)[k * 24 + 12] };
  }

  // the builder's look (inside the 880 x 620 RC panel)
  document.head.appendChild(Arcade.h('style', {}, `
    .rc-build { display: flex; gap: 12px; align-items: stretch; justify-content: center; margin-top: 6px; }
    .rc-build-left { display: flex; flex-direction: column; gap: 8px; }
    .rc-board { border: 5px solid ${INK}; border-radius: 18px; touch-action: none; display: block; cursor: crosshair; box-sizing: content-box; }
    .rc-tools { display: flex; flex-direction: column; gap: 8px; width: 150px; }
    .rc-tools2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .rc-tools2 .ar-btn { min-height: 70px; padding: 4px; justify-content: center; }
    .rc-tools2 .ar-btn svg { width: 46px; height: 46px; }
    .rc-world.rc-piece { background: #fff; }
    .rc-world.rc-piece svg { padding: 3px; box-sizing: border-box; }
    .rc-tools .ar-btn { margin: 0; width: 100%; min-width: 0; box-sizing: border-box; min-height: 70px; justify-content: flex-start; padding: 6px 10px; font-size: 20px; }
    .rc-tools .ar-btn svg { width: 40px; height: 40px; }
    .rc-tools .ar-btn.big { min-height: 96px; font-size: 24px; }
    .rc-tools .rc-nogo { filter: grayscale(0.85); opacity: 0.7; }
    .rc-worlds { display: flex; gap: 4px; justify-content: space-between; }
    .rc-world { width: 60px; height: 50px; padding: 0; border: 4px solid ${INK}; border-radius: 12px; background: none; cursor: pointer; overflow: hidden; }
    .rc-world svg { width: 100%; height: 100%; display: block; }
    .rc-world.picked { box-shadow: 0 0 0 4px #ffd166; transform: scale(1.08); }
    .rc-mypic { height: 140px !important; }
    .rc-mypic svg { width: 220px !important; height: 128px !important; }
  `));

  return { menu, edit, def, defFrom, pack, unpack, slots, check, surprise, fromStroke, PICS, SLOTS, THINGS };
};
