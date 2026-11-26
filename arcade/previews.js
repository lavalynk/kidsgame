// Tiny moving previews on the hub's game tiles (Nov 25, the new plan, point 10, part 3: the hub glow-up).
//
// Each game's hub icon is its badge (arcade/badges.js). For a preview, one or more PARTS of that badge are cut out
// (the ball, the car, the rocket...) and moved for a couple of seconds: the golf ball rolls into the hole, the
// basketball swishes through the net, the car drives off and comes back round, the rocket blasts off... At the end
// every part is back where it started, so the tile looks exactly like the icon again.
//
// Only ONE tile plays at a time, in turn (canvasmenu.js "Tile previews"), so the hub stays calm and clean
// (Keith, Nov 22: "way too much on it"). None in Calm motion, on a slow tablet (lite drawing), or while the
// hub is napping (nobody touched it for a while).
//
// A part: { cut: [from, to], wrap, pivot: [x, y], at(t) }
//   cut   = the badge text from `from` up to and including `to` (to: null = the first "/>" after it, '$' = the end).
//           Several cuts can be given as a list of pairs: they go into the same moving part.
//   wrap  = a transform the part sat inside in the badge (hoops: its whole picture is moved down 26).
//   pivot = the point (badge units, 240 x 240) the part turns and squashes around.
//   at(t) = where the part is at time t (0 -> 1): { x, y } = moved by (badge units), r = turned (radians),
//           s = size (or sx / sy to squash), a = see-through (0..1). Leave a thing out = as in the badge.
//           at() must give the badge's own spot at t = 0 and t = 1 (the test checks).
// Parts are drawn in the order listed, on top of what's left of the badge.
(function () {
  const PI = Math.PI, sin = Math.sin, cos = Math.cos;
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));                // 0 -> 1 between time a and b
  const smooth = (u) => u * u * (3 - 2 * u);
  const outBack = (u) => { const c = 1.7; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
  const bump = (u) => sin(PI * clamp(u));                              // 0 -> 1 -> 0
  const pop = (t, a, b) => { const u = seg(t, a, b); return u <= 0 || u >= 1 ? 1 : 0.4 + 0.6 * outBack(u); };   // pop back in
  // a hop that squashes on landing: y up, sx/sy squash near the ground
  const hop = (u, h) => { const y = -h * Math.abs(sin(PI * u)); const g = 1 - Math.abs(sin(PI * u)); const sq = 0.12 * g * g * g * (u > 0 && u < 1 ? 1 : 0); return { y, sx: 1 + sq, sy: 1 - sq }; };
  // walk along a list of points (badge units) at an even speed; returns the move from the first point
  function along(pts, u) {
    const len = []; let tot = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); len.push(d); tot += d; }
    let d = clamp(u) * tot;
    for (let i = 0; i < len.length; i++) {
      if (d <= len[i] || i === len.length - 1) { const f = len[i] ? Math.min(1, d / len[i]) : 0; return { x: pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f - pts[0][0], y: pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f - pts[0][1] }; }
      d -= len[i];
    }
    return { x: 0, y: 0 };
  }

  const P = {
    // the ball rolls across the grass and drops into the hole, the flag wiggles, the ball pops back on the tee
    golf: { dur: 2800, parts: [
      { cut: ['<path d="M104 176', null], at: (t) => ({ a: t < 0.4 ? 1 - seg(t, 0, 0.15) : seg(t, 0.85, 1) }) },
      { cut: ['<path d="M150 194 V62"', 'L150 104 Z" fill="#ef476f" stroke="#2b2b2b" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>'], pivot: [150, 194],
        at: (t) => { const u = seg(t, 0.5, 0.85); return { r: 0.1 * sin(u * 3 * PI) * (1 - u) }; } },
      { cut: ['<circle cx="72" cy="188"', '<circle cx="63" cy="179" r="6" fill="#dfe7ee"/>'], pivot: [72, 188],
        at: (t) => {
          if (t < 0.48) { const u = seg(t, 0, 0.48), e = 1 - (1 - u) * (1 - u); return { x: 76 * e, y: 6 * e, r: e * 4 * PI }; }
          if (t < 0.58) { const u = seg(t, 0.48, 0.58); return { x: 78, y: 6 + 6 * u, s: 1 - 0.7 * u, a: 1 - u, r: 4 * PI }; }
          if (t < 0.82) return { a: 0 };
          return { s: pop(t, 0.82, 1), a: seg(t, 0.82, 0.9) };
        } },
    ] },
    // the ball arcs in from the bottom left, drops through the hoop and pops back up top
    hoops: { dur: 2800, parts: [
      { cut: ['<g transform="rotate(-20 132 52)">', 'transform="rotate(-35 124 42)"/>'], wrap: 'translate(0 26)', pivot: [132, 78],
        at: (t) => {
          if (t < 0.08) return { a: 1 - seg(t, 0, 0.08) };
          if (t < 0.46) { const u = seg(t, 0.08, 0.46); return { x: -110 * (1 - u), y: 110 * (1 - u) - 70 * sin(PI * u), r: u * 2 * PI, a: seg(t, 0.08, 0.14) }; }
          if (t < 0.68) { const u = seg(t, 0.46, 0.68); return { x: -12 * u, y: 110 * u * u, r: 2 * PI + u * PI, a: 1 - seg(u, 0.55, 1) }; }
          if (t < 0.8) return { a: 0 };
          return { s: pop(t, 0.8, 1), a: seg(t, 0.8, 0.88) };
        } },
    ] },
    // the arrow flies in and lands with a wobble, the "thunk" lines flash
    archery: { dur: 2400, parts: [
      { cut: ['<path d="M120 112 L214 30" stroke="#2b2b2b" stroke-width="13"', 'M188 52 L186 32 L200 42 Z" fill="#ffafcc" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>'], pivot: [120, 112],
        at: (t) => {
          if (t < 0.08) return { a: 1 - seg(t, 0, 0.08) };
          if (t < 0.18) return { a: 0 };
          if (t < 0.36) { const d = 170 * (1 - seg(t, 0.18, 0.36)); return { x: 0.754 * d, y: -0.658 * d }; }
          const w = t - 0.36; return { r: 0.09 * sin(w * 42) * Math.exp(-w * 7) * (t < 1 ? 1 : 0) };
        } },
      { cut: ['<path d="M98 92 L86 80', null], at: (t) => ({ a: t < 0.06 ? 1 - seg(t, 0, 0.06) : t < 0.36 ? 0 : t < 0.5 ? 1 : 0.4 + 0.6 * seg(t, 0.8, 1), s: t < 0.36 ? 1 : 1 + 0.25 * bump(seg(t, 0.36, 0.56)) }), pivot: [120, 112] },
      { cut: ['<circle cx="120" cy="112" r="6"', null] },
    ] },
    // the rider hops the bike twice (a big jump and a little one), the speed lines flicker
    bike: { dur: 2600, parts: [
      { cut: ['<path d="M30 80 H80', null], at: (t) => ({ x: -10 * bump(t * 2 % 1) * (t < 1 ? 1 : 0), a: 1 - 0.5 * bump(t * 2 % 1) }) },
      { cut: ['<g transform="translate(-16 6) rotate(-18 140 120)">', '$'], pivot: [92, 168],
        at: (t) => {
          if (t < 0.55) { const u = seg(t, 0.05, 0.55), h = hop(u, 34); return { y: h.y, r: -0.16 * sin(PI * u), sx: h.sx, sy: h.sy }; }
          const u = seg(t, 0.6, 0.92), h = hop(u, 14); return { y: h.y, r: -0.06 * sin(PI * u), sx: h.sx, sy: h.sy };
        } },
    ] },
    // the car drives off along the road and comes back round from the other side
    rc: { dur: 2800, parts: [
      { cut: ['<g transform="translate(118 132) rotate(-8)">', '$'], pivot: [118, 132],
        at: (t) => {
          let x = 0;
          if (t < 0.45) { const u = seg(t, 0.05, 0.45); x = 200 * u * u; }
          else if (t < 0.55) return { a: 0 };
          else { const u = seg(t, 0.55, 1), e = 1 - Math.pow(1 - u, 3); x = -200 * (1 - e); }
          const y = 0.0015 * x * x, rd = Math.atan(0.003 * x);           // (the road bends down at both ends)
          return { x, y: y - 3 * Math.abs(sin(t * 12 * PI)), r: rd };
        } },
    ] },
    // the monkey swings on its vine
    jungle: { dur: 2600, parts: [
      { cut: ['<path d="M120 -10 Q112 30 120 60" fill="none" stroke="#2b2b2b"', '$'], pivot: [120, -10],
        at: (t) => ({ r: 0.16 * sin(2 * PI * 1.5 * t) * sin(PI * t) }) },
    ] },
    // the gems hop out of the treasure chest, the sparkles twinkle
    trail: { dur: 2400, parts: [
      { cut: ['<path d="M118 84 L132 98', 'L146 98 Z" fill="#ff5fa2" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>'], pivot: [136, 116],
        at: (t) => { const a = hop(seg(t, 0.05, 0.5), 34), b = hop(seg(t, 0.55, 0.85), 14); return { y: a.y + b.y, sx: a.sx * b.sx, sy: a.sy * b.sy, r: 0.25 * sin(2 * PI * seg(t, 0.05, 0.5)) }; } },
      { cut: ['<path d="M190 60 l5 12', null], pivot: [120, 70], at: (t) => ({ a: 0.35 + 0.65 * Math.abs(cos(3 * PI * t)) }) },
    ] },
    // the blob hops, the potion wobbles, the star spins
    quest: { dur: 2600, parts: [
      { cut: ['<path d="M150 196 Q144 130', '<path d="M176 184 Q185 176 194 184" fill="none" stroke="#2b2b2b" stroke-width="5" stroke-linecap="round"/>'], pivot: [184, 196],
        at: (t) => { const a = hop(seg(t, 0.1, 0.45), 18), b = hop(seg(t, 0.5, 0.85), 18); return { y: a.y + b.y, sx: a.sx * b.sx, sy: a.sy * b.sy }; } },
      { cut: ['<g transform="rotate(-10 84 130)">', '</g>'], pivot: [84, 172], at: (t) => ({ r: 0.16 * sin(2 * PI * 2 * t) * sin(PI * t) }) },
      { cut: ['<path d="M128 40', null], pivot: [128, 67], at: (t) => { const u = smooth(seg(t, 0.2, 0.8)); return { r: 2 * PI * u, s: 1 + 0.25 * bump(u) }; } },
    ] },
    // the rocket rumbles, blasts off up and away, and flies back in from the bottom
    space: { dur: 2800, parts: [
      { cut: ['<g transform="translate(-14 -6) rotate(35 130 110)">', '$'], pivot: [116, 104],
        at: (t) => {
          const dx = 0.574, dy = -0.819;
          if (t < 0.2) { const j = 2.2 * sin(t * 160); return { x: j, y: -j * 0.5 }; }
          if (t < 0.48) { const u = seg(t, 0.2, 0.48), d = 260 * u * u; return { x: dx * d, y: dy * d }; }
          if (t < 0.55) return { a: 0 };
          const u = seg(t, 0.55, 1), d = -260 * Math.pow(1 - u, 3); return { x: dx * d, y: dy * d };
        } },
    ] },
    // the fish wiggles and jumps a little higher out of the water, twice
    fishing: { dur: 2600, parts: [
      { cut: ['<g transform="rotate(-25 124 112)">', '</g>'], pivot: [124, 112],
        at: (t) => { const a = seg(t, 0.05, 0.5), b = seg(t, 0.55, 0.95); return { y: -24 * bump(a) - 14 * bump(b), r: 0.14 * sin(2 * PI * 3 * t) * sin(PI * t) }; } },
    ] },
    // the bubbles float, the little school monster hops
    abc: { dur: 2600, parts: [
      { cut: ['<circle cx="62" cy="70" r="34"', '</text>'], pivot: [62, 70], at: (t) => ({ y: -10 * sin(2 * PI * t), x: 4 * sin(4 * PI * t) }) },
      { cut: ['<circle cx="180" cy="58" r="30"', '</text>'], pivot: [180, 58], at: (t) => ({ y: 8 * sin(2 * PI * t), x: -4 * sin(2 * PI * t) }) },
      { cut: ['<circle cx="190" cy="140" r="22"', '</text>'], pivot: [190, 140], at: (t) => ({ y: -8 * sin(4 * PI * t) }) },
      { cut: ['<g transform="translate(108 150)">', '$'], pivot: [108, 214],
        at: (t) => { const a = hop(seg(t, 0.15, 0.5), 20), b = hop(seg(t, 0.55, 0.9), 20); return { y: a.y + b.y, sx: a.sx * b.sx, sy: a.sy * b.sy }; } },
    ] },
    // the paint dots pop one after another while the crayon scribbles
    coloring: { dur: 2600, parts: [
      ...[['80', '90'], ['124', '72'], ['170', '92'], ['70', '140'], ['108', '168']].map(([cx, cy], i) => ({
        cut: [`<circle cx="${cx}" cy="${cy}"`, null], pivot: [+cx, +cy], at: (t) => ({ s: 1 + 0.3 * bump(seg(t, 0.1 + i * 0.13, 0.3 + i * 0.13)) }) })),
      { cut: ['<g transform="rotate(35 168 150)">', '$'], pivot: [134, 200],
        at: (t) => ({ x: 14 * sin(2 * PI * 2 * t) * sin(PI * t), y: 6 * sin(2 * PI * 4 * t) * sin(PI * t), r: 0.08 * sin(2 * PI * 2 * t) * sin(PI * t) }) },
    ] },
    // the smiley walks the dotted path to the star, the star spins, the smiley pops back at the start
    maze: { dur: 3400, parts: [
      { cut: ['<path d="M172 168 l6 12', null], pivot: [172, 186], at: (t) => { const u = smooth(seg(t, 0.68, 0.84)); return { r: 2 * PI * u, s: 1 + 0.3 * bump(u) }; } },
      { cut: ['<circle cx="62" cy="62" r="16"', '<path d="M57 67 Q62 71 67 67" fill="none" stroke="#2b2b2b" stroke-width="2.5"/>'], pivot: [62, 62],
        at: (t) => {
          const route = [[62, 62], [120, 62], [175, 66], [172, 100], [120, 110], [72, 116], [66, 150], [120, 152], [170, 154], [170, 172]];
          if (t < 0.7) { const m = along(route, seg(t, 0, 0.7)); return { x: m.x, y: m.y - 3 * Math.abs(sin(t * 18 * PI)) }; }
          const end = along(route, 1);
          if (t < 0.88) return { x: end.x, y: end.y, a: 1 - seg(t, 0.8, 0.88) };
          return { s: pop(t, 0.88, 1), a: seg(t, 0.88, 0.94) };
        } },
    ] },
    // the notes bounce to a beat, the star twinkles
    piano: { dur: 2400, parts: [
      { cut: ['<path d="M80 92 V40 L146 28 V80"', 'transform="rotate(-20 134 80)"/>'], pivot: [107, 92],
        at: (t) => ({ y: -12 * Math.abs(sin(2 * PI * 2 * t)), r: 0.08 * sin(2 * PI * 2 * t) }) },
      { cut: ['<path d="M186 26 l5', null], pivot: [186, 42], at: (t) => { const u = smooth(seg(t, 0.3, 0.9)); return { r: 2 * PI * u, s: 1 + 0.3 * bump(u) }; } },
    ] },
    // the claw lifts its bunny up, swings it about and lowers it again; the sparkle twinkles
    claw: { dur: 2600, parts: [
      { cut: ['<path d="M120 -10 V72"', '<circle cx="120" cy="80" r="6" fill="#ef476f" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>'], pivot: [120, 0],
        at: (t) => { const u = seg(t, 0.05, 0.95); return { y: -26 * bump(u), r: 0.12 * sin(2 * PI * 2 * u) * bump(u) }; } },
      { cut: ['<path d="M198 92 l4', null], pivot: [198, 105], at: (t) => { const u = smooth(seg(t, 0.4, 0.95)); return { r: 2 * PI * u, s: 1 + 0.4 * bump(u) }; } },
    ] },
  };

  // the text of one cut out of a badge (null when it isn't there: the badge was changed, the test notices)
  function cutOut(badge, from, to) {
    const i = badge.indexOf(from);
    if (i < 0) return null;
    let j;
    if (to === '$') j = badge.length;
    else if (to == null) { const e = badge.indexOf('/>', i); j = e < 0 ? -1 : e + 2; }
    else { const e = badge.indexOf(to, i); j = e < 0 ? -1 : e + to.length; }
    return j < 0 ? null : [i, j];
  }
  const svg = (inner) => `<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

  // build(id) -> { dur, under, parts: [{ svg, pivot, at }] } or null: `under` = the badge with every part cut out,
  // each part's svg = only that part, both on the badge's own 240 x 240 grid (so they line up when drawn together)
  function build(id) {
    const spec = P[id], badge = window.Arcade && Arcade.badges && Arcade.badges[id];
    if (!spec || !badge) return null;
    const spans = [], parts = [];
    for (const p of spec.parts) {
      const pairs = Array.isArray(p.cut[0]) ? p.cut : [p.cut];
      let inner = '';
      for (const [from, to] of pairs) {
        const sp = cutOut(badge, from, to);
        if (!sp) return null;
        inner += badge.slice(sp[0], sp[1]); spans.push(sp);
      }
      parts.push({ svg: svg(p.wrap ? `<g transform="${p.wrap}">${inner}</g>` : inner), pivot: p.pivot || [120, 120], at: p.at || (() => ({})) });
    }
    // cut from the end backwards so the earlier places stay right
    spans.sort((a, b) => b[0] - a[0]);
    let under = badge;
    for (const [i, j] of spans) under = under.slice(0, i) + under.slice(j);
    return { id, dur: spec.dur, under: svg(under), parts };
  }
  // where a part is at time t, with every value filled in
  function pose(part, t) {
    const p = part.at(Math.max(0, Math.min(1, t))) || {};
    const s = p.s != null ? p.s : 1;
    return { x: p.x || 0, y: p.y || 0, r: p.r || 0, sx: (p.sx != null ? p.sx : 1) * s, sy: (p.sy != null ? p.sy : 1) * s, a: p.a != null ? Math.max(0, Math.min(1, p.a)) : 1 };
  }
  window.Arcade = window.Arcade || {};
  Arcade.previews = { SPECS: P, build, pose, games: () => Object.keys(P) };
})();
