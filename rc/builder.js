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
// 3 tracks per player, saved in the RC save as data.myTracks = [{pts, theme, bridge, L}].
// rc.js hands us the bits we need (K) and calls:
//   menu(g)        the "My tracks" screen (3 slots)
//   edit(g, slot)  the builder itself
//   def(g, slot)   a track definition the race code can use (like one from TRACKS)
// =====================================================================
window.RCBuilder = function (K) {
  'use strict';
  const { THEMES, TRACKS, SONGS, spline, makePath, screen, trackPic, FLAG_PIC, STAR_PIC } = K;
  const { icons } = Arcade;
  const INK = '#2b2b2b';

  const HW = 96;                 // road half-width (between Backyard Loop and Sunny Beach: roomy)
  const BW = 6000, BH = 3820;    // the building board, in track units (the picture shows all of it)
  const EDGE = 380;              // keep dots this far inside the board (room for the grass + walls)
  const MIN_L = 7000;            // a lap at least this long (smaller drawings get blown up)
  const GAP = 2 * HW + 80;       // two different parts of the road: centers at least this far apart
  const MAX_DOTS = 24, SLOTS = 3;
  const WORLDS = Object.keys(THEMES);
  // each world plays the song of the real track that has that look
  const songOf = (theme) => (TRACKS.find(t => t.theme === theme) || TRACKS[0]).id;

  // ---------------------------------------------------------------
  // Checking a track: is it OK to race on?
  // Returns { ok, bad: [[x, y], ...] problem spots, bridge: true/false, L: lap length }
  // ---------------------------------------------------------------
  function check(pts) {
    const P = makePath(spline(pts, true), true), n = P.pts.length, st = P.step, out = { ok: false, bad: [], bridge: false, L: P.L };
    const lap = (a, b) => { const d = Math.abs(a - b) % n; return Math.min(d, n - d); };   // how far apart along the road (in points)
    // 1. bends that are too tight (the road would fold over itself)
    for (let k = 0; k < n; k += 2) {
      const a = (k - 3 + n) % n, b = (k + 3) % n;
      let ang = Math.abs(Math.atan2(P.ty[b], P.tx[b]) - Math.atan2(P.ty[a], P.tx[a]));
      if (ang > Math.PI) ang = 2 * Math.PI - ang;
      if (6 * st / Math.max(ang, 0.001) < HW * 1.1) out.bad.push(P.pts[k].slice());
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
    const c = check(t.pts);
    slots(g)[slot] = { pts: t.pts.map(clampPt), theme: t.theme, bridge: c.bridge, L: Math.round(c.L), ok: c.ok };
    g.store();
  }
  // a track definition, just like the ones in TRACKS
  function def(g, slot) {
    const t = slots(g)[slot];
    if (!t) return null;
    // the id changes with the shape + world, so rc.js's track cache never hands back an old shape
    let h = 7; for (const [x, y] of t.pts) h = (h * 31 + x * 7 + y) % 1000000007;
    return {
      id: 'my' + slot + '-' + h.toString(36) + '-' + t.theme, name: 'My track ' + (slot + 1), theme: t.theme, hw: HW,
      items: (t.L || 0) > 12000 ? [0.22, 0.48, 0.74] : [0.3, 0.68],
      bridge: t.bridge ? 'second' : undefined,
      pts: t.pts, custom: true, slot, song: songOf(t.theme),
    };
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
    let res = check(t.pts);
    const history = [];                       // for Undo
    const snapshot = () => { history.push(JSON.stringify({ pts: t.pts, theme: t.theme })); if (history.length > 30) history.shift(); };
    let drawMode = false, stroke = null, dragK = -1, live = null, flash = 0;

    const p = screen('Build', () => { stop(); menu(g); });
    p.setAttribute('data-builder', slot);
    const body = Arcade.h('div', { class: 'rc-build' });
    const left = Arcade.h('div', { class: 'rc-build-left' });
    const cv = Arcade.h('canvas', { class: 'rc-board', width: CW * 2, height: CH * 2, 'data-board': '1' });
    cv.style.width = CW + 'px'; cv.style.height = CH + 'px';
    left.appendChild(cv);
    const worlds = Arcade.h('div', { class: 'rc-worlds' });
    left.appendChild(worlds);
    const tools = Arcade.h('div', { class: 'rc-tools' });
    body.append(left, tools);
    p.appendChild(body);

    const btn = (attr, cls, pic, label, onClick) => {
      const b = Arcade.h('button', { type: 'button', class: 'ar-btn ' + cls, [attr]: '1' }, `${pic}<span>${label}</span>`);
      b.addEventListener('click', () => onClick(b));
      tools.appendChild(b);
      return b;
    };
    const bDraw = btn('data-draw', 'white', PICS.pencil, 'Draw', () => { Arcade.sfx('click'); drawMode = !drawMode; paintTools(); paint(); });
    btn('data-dice', 'white', PICS.dice, 'New', () => { Arcade.sfx('pop'); snapshot(); t.pts = surprise(); changed(); });
    const bUndo = btn('data-undo', 'white', PICS.undo, 'Undo', (b) => {
      if (!history.length) { Arcade.sfx('bonk'); wiggle(b); return; }
      Arcade.sfx('click'); Object.assign(t, JSON.parse(history.pop())); changed(true);
    });
    tools.appendChild(Arcade.h('div', { style: 'flex:1' }));
    const go = (b, id) => {
      if (!res.ok) { Arcade.sfx('bonk'); wiggle(b); flash = 1.2; return; }    // red rings show what to fix
      Arcade.sfx('go'); stop(); g.play({ id: id + '-' + slot, name: 'My track ' + (slot + 1) });
    };
    const bRace = btn('data-race', 'green big', FLAG_PIC, 'Race', (b) => go(b, 'my'));
    const bDrive = btn('data-drive', 'yellow', STAR_PIC, 'Drive', (b) => go(b, 'myd'));

    function paintTools() {
      bDraw.className = 'ar-btn ' + (drawMode ? 'yellow' : 'white');
      bUndo.style.opacity = history.length ? 1 : 0.5;
      for (const b of [bRace, bDrive]) b.classList.toggle('rc-nogo', !res.ok);
      worlds.innerHTML = '';
      for (const w of WORLDS) {
        const b = Arcade.h('button', { type: 'button', class: 'rc-world' + (t.theme === w ? ' picked' : ''), 'data-world': w }, worldPic(w));
        b.addEventListener('click', () => { if (t.theme === w) return; Arcade.sfx('click'); snapshot(); t.theme = w; changed(true); });
        worlds.appendChild(b);
      }
    }
    // after every change: check it, save it, paint it
    function changed(quiet) {
      res = check(t.pts);
      t.bridge = res.bridge;
      store(g, slot, t);
      if (!quiet) Arcade.sfx(res.ok ? (res.bridge ? 'spring' : 'pop') : 'aww');
      paintTools(); paint();
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
      // the dots you can drag
      // (the first dot is the start: a black + white checkered dot)
      if (!drawMode) t.pts.forEach(([x, y], k) => {
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
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);

    paintTools(); paint();
    g.panel(p);
    raf = requestAnimationFrame(tick);
    // test-only peeks
    window.__rcBuild = { state: () => ({ slot, pts: t.pts.map(q => q.slice()), theme: t.theme, ok: res.ok, bad: res.bad.length, bridge: res.bridge, L: Math.round(res.L), draw: drawMode, undo: history.length }),
      board: () => ({ w: BW, h: BH }), mid: (k) => spline(t.pts, true)[k * 24 + 12] };
  }

  // the builder's look (inside the 880 x 620 RC panel)
  document.head.appendChild(Arcade.h('style', {}, `
    .rc-build { display: flex; gap: 12px; align-items: stretch; justify-content: center; margin-top: 6px; }
    .rc-build-left { display: flex; flex-direction: column; gap: 8px; }
    .rc-board { border: 5px solid ${INK}; border-radius: 18px; touch-action: none; display: block; cursor: crosshair; box-sizing: content-box; }
    .rc-tools { display: flex; flex-direction: column; gap: 8px; width: 150px; }
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

  return { menu, edit, def, check, surprise, fromStroke, PICS, SLOTS };
};
