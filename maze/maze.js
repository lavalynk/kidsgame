// Maze game.
// Each maze is cut out of a big friendly shape (circle, heart, star...).
// A little character sits at the start; the child drags it along the white
// paths to its treat at the other end. There are no walls to bump and nothing
// to lose: the character simply only moves where the path goes.
// Every finished maze gets a star burst + jingle, then the next maze is a
// different shape and a tiny bit bigger.
//
// Extras:
//  * Easy / Normal / Challenge (the dots button) = how big the mazes get
//  * themes: garden, sea, space, candy colors as you go
//  * from the 3rd maze: a KEY somewhere opens a locked DOOR on the way
//  * shiny GEMS to collect: all of them = 3 stars
//  * the light bulb shows the way for a few seconds (no penalty)
//  * arrow keys work too
//  * progress, stars and medals are saved on this device

const svg = document.getElementById('maze');
const NS = 'http://www.w3.org/2000/svg';
const INK = '#2b2b2b';

// ---------- Shapes (drawn in a 100 x 100 box) ----------
const SHAPES = [
  { name: 'circle',  color: '#8ecae6', d: 'M50 2 A48 48 0 1 1 49.9 2 Z' },
  { name: 'heart',   color: '#ffafcc', d: 'M50 94 C18 72 2 54 2 30 C2 14 14 4 28 4 C38 4 46 10 50 18 C54 10 62 4 72 4 C86 4 98 14 98 30 C98 54 82 72 50 94 Z' },
  { name: 'square',  color: '#b9fbc0', d: 'M12 4 H88 C94 4 96 6 96 12 V88 C96 94 94 96 88 96 H12 C6 96 4 94 4 88 V12 C4 6 6 4 12 4 Z' },
  { name: 'diamond', color: '#cdb4db', d: 'M50 1 L99 50 L50 99 L1 50 Z' },
  { name: 'star',    color: '#ffd166', d: starPath(50, 55, 54, 31) }, // last: needs a bigger grid
];

function starPath(cx, cy, R, r) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / 5;
    const rr = i % 2 ? r : R;
    d += (i ? ' L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1);
  }
  return d + ' Z';
}

// ---------- Saving (this device only) ----------
const SAVE_KEY = 'kidsMaze.v1';
let saved = { level: 0, diff: 'easy', stars: {}, done: 0 };
try { saved = Object.assign(saved, JSON.parse(localStorage.getItem(SAVE_KEY)) || {}); } catch (e) { /* no saving */ }
function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(saved)); } catch (e) { /* skip */ }
  // tell the arcade home screen (stars + medals)
  if (window.Arcade) {
    const rec = Arcade.store.game('maze');
    rec.levels = {};
    for (const k in saved.stars) rec.levels['m' + k] = { stars: saved.stars[k], done: true };
    const m = medalFor(saved.done);
    if (m) rec.levels.medal = { medal: m };
    Arcade.store.save();
  }
}
// Medals for mazes finished in total
function medalFor(n) { return n >= 20 ? 'gold' : n >= 10 ? 'silver' : n >= 5 ? 'bronze' : null; }

// Grid size per level and difficulty: starts small, grows slowly, then stays
// put so the paths stay finger-wide.
const SIZES = {
  easy:      [5, 5, 5, 6, 6, 6],
  normal:    [5, 6, 6, 7, 7, 7],
  challenge: [7, 7, 8, 8, 9, 9],
};
function gridSize(level) {
  const list = SIZES[saved.diff] || SIZES.easy;
  return list[Math.min(level, list.length - 1)];
}

// Color themes (page + path), changing every two mazes.
const THEMES = [
  { name: 'garden', page: '#eaf6df', path: '#ffffff' },
  { name: 'sea',    page: '#d6f1fb', path: '#f2fbff' },
  { name: 'space',  page: '#2b2d4a', path: '#fff8e1' },
  { name: 'candy',  page: '#ffe3ee', path: '#fffafc' },
];

// ---------- Characters and their treats (drawn in a 100 x 100 box) ----------
const FRIENDS = [
  { // bee -> flower
    hero: `
      <ellipse cx="34" cy="26" rx="16" ry="20" fill="#bde0fe" stroke="${INK}" stroke-width="6"/>
      <ellipse cx="66" cy="26" rx="16" ry="20" fill="#bde0fe" stroke="${INK}" stroke-width="6"/>
      <ellipse cx="50" cy="60" rx="38" ry="30" fill="#ffd166" stroke="${INK}" stroke-width="6"/>
      <path d="M40 32 Q34 60 40 88 M60 32 Q66 60 60 88" fill="none" stroke="${INK}" stroke-width="9"/>
      <circle cx="28" cy="56" r="6" fill="${INK}"/><circle cx="72" cy="56" r="6" fill="${INK}"/>
      <path d="M42 72 Q50 78 58 72" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
    goal: `
      <g fill="#f15bb5" stroke="${INK}" stroke-width="6">
        <circle cx="50" cy="22" r="18"/><circle cx="78" cy="42" r="18"/><circle cx="67" cy="76" r="18"/>
        <circle cx="33" cy="76" r="18"/><circle cx="22" cy="42" r="18"/>
      </g>
      <circle cx="50" cy="50" r="18" fill="#ffd166" stroke="${INK}" stroke-width="6"/>`,
    trail: '#ffd166',
  },
  { // bunny -> carrot
    hero: `
      <ellipse cx="34" cy="26" rx="11" ry="24" fill="#fff" stroke="${INK}" stroke-width="6"/>
      <ellipse cx="66" cy="26" rx="11" ry="24" fill="#fff" stroke="${INK}" stroke-width="6"/>
      <circle cx="50" cy="62" r="34" fill="#fff" stroke="${INK}" stroke-width="6"/>
      <circle cx="38" cy="56" r="6" fill="${INK}"/><circle cx="62" cy="56" r="6" fill="${INK}"/>
      <ellipse cx="28" cy="72" rx="7" ry="4" fill="#ffafcc"/><ellipse cx="72" cy="72" rx="7" ry="4" fill="#ffafcc"/>
      <path d="M45 68 Q50 64 55 68 Q50 74 45 68 Z" fill="#f15bb5"/>
      <path d="M42 78 Q50 84 58 78" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
    goal: `
      <path d="M40 30 C30 10 34 2 42 4 C48 12 50 22 48 30 Z M52 30 C56 12 66 6 72 12 C68 22 62 28 56 32 Z"
            fill="#06d6a0" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M26 34 C40 26 66 28 72 36 C76 44 62 74 52 94 C48 100 42 98 42 92 C38 70 22 50 22 42 C22 38 23 36 26 34 Z"
            fill="#ff8c42" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`,
    trail: '#ff8c42',
  },
  { // mouse -> cheese
    hero: `
      <circle cx="24" cy="32" r="18" fill="#cfcfcf" stroke="${INK}" stroke-width="6"/>
      <circle cx="76" cy="32" r="18" fill="#cfcfcf" stroke="${INK}" stroke-width="6"/>
      <circle cx="24" cy="32" r="8" fill="#ffafcc"/><circle cx="76" cy="32" r="8" fill="#ffafcc"/>
      <circle cx="50" cy="60" r="32" fill="#e5e5e5" stroke="${INK}" stroke-width="6"/>
      <circle cx="38" cy="54" r="6" fill="${INK}"/><circle cx="62" cy="54" r="6" fill="${INK}"/>
      <circle cx="50" cy="68" r="6" fill="#f15bb5"/>
      <path d="M40 68 L18 64 M40 74 L20 80 M60 68 L82 64 M60 74 L80 80" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    goal: `
      <path d="M6 72 L86 30 C92 30 94 34 94 40 V80 C94 84 92 86 88 86 H12 C8 86 6 84 6 80 Z"
            fill="#ffd166" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <circle cx="62" cy="60" r="8" fill="#f4a261"/><circle cx="34" cy="74" r="6" fill="#f4a261"/>
      <circle cx="80" cy="74" r="5" fill="#f4a261"/>`,
    trail: '#ffd166',
  },
];

// ---------- Game state ----------
let level = saved.level || 0;
let N, cell;          // grid size and size of one cell (in the 100-unit drawing)
let open;             // open[key] = list of neighbor keys you can walk to
let start, goal;      // cell keys like "3,4"
let trail;            // cells walked so far, start ... current
let heroEl, trailEl;
let friend;
let dragging = false;
let won = false;
let door = null;      // { a, b } - the locked passage between two cells (or null)
let keyCell = null;   // where the key is
let hasKey = false;
let gems = [];        // [{ k, got, el }]
let doorEl, keyEl, hintEl;

const key = (x, y) => x + ',' + y;
const unkey = k => k.split(',').map(Number);
const center = k => { const [x, y] = unkey(k); return [(x + 0.5) * cell, (y + 0.5) * cell]; };

// ---------- Making a maze ----------
// 1. Find the grid cells that fit inside the shape (with a little margin).
// 2. Keep only the biggest connected group of them.
// 3. Carve a maze with a "random walk that backs up when stuck"
//    (every cell gets reached, and there's exactly one way between any two cells).
// 4. Start and goal = the two cells that are farthest apart along the paths.
function makeMaze(shape) {
  const ctx = document.createElement('canvas').getContext('2d');
  const path = new Path2D(shape.d);
  const inside = new Set();
  const m = cell * 0.3; // margin: the whole path must fit inside the shape
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const cx = (x + 0.5) * cell, cy = (y + 0.5) * cell;
      const pts = [[cx, cy], [cx - m, cy], [cx + m, cy], [cx, cy - m], [cx, cy + m]];
      if (pts.every(([px, py]) => ctx.isPointInPath(path, px, py))) inside.add(key(x, y));
    }
  }

  const neighbors = k => {
    const [x, y] = unkey(k);
    return [key(x + 1, y), key(x - 1, y), key(x, y + 1), key(x, y - 1)].filter(n => inside.has(n));
  };

  // biggest connected group
  let best = [];
  const seen = new Set();
  for (const k of inside) {
    if (seen.has(k)) continue;
    const group = [k]; seen.add(k);
    for (let i = 0; i < group.length; i++) {
      for (const n of neighbors(group[i])) if (!seen.has(n)) { seen.add(n); group.push(n); }
    }
    if (group.length > best.length) best = group;
  }
  const cells = new Set(best);

  // carve the maze
  open = {};
  cells.forEach(k => { open[k] = []; });
  const first = best[Math.floor(Math.random() * best.length)];
  const visited = new Set([first]);
  const stack = [first];
  while (stack.length) {
    const here = stack[stack.length - 1];
    const choices = neighbors(here).filter(n => cells.has(n) && !visited.has(n));
    if (!choices.length) { stack.pop(); continue; }
    const next = choices[Math.floor(Math.random() * choices.length)];
    open[here].push(next); open[next].push(here);
    visited.add(next); stack.push(next);
  }

  start = farthestFrom(first);
  goal = farthestFrom(start);
}

// Walk the paths outward from one cell; return the cell farthest away.
function farthestFrom(from) {
  const dist = { [from]: 0 };
  const queue = [from];
  let far = from;
  for (let i = 0; i < queue.length; i++) {
    for (const n of open[queue[i]]) {
      if (dist[n] === undefined) {
        dist[n] = dist[queue[i]] + 1; queue.push(n);
        if (dist[n] > dist[far]) far = n;
      }
    }
  }
  return far;
}

// The one way along the paths from a to b (list of cells after a).
// (Not used by the game itself; handy for testing and a future "show me" hint.)
function route(a, b, maxSteps = Infinity) {
  const prev = { [a]: null };
  const queue = [a];
  for (let i = 0; i < queue.length; i++) {
    if (queue[i] === b) break;
    for (const n of open[queue[i]]) if (!(n in prev)) { prev[n] = queue[i]; queue.push(n); }
  }
  if (!(b in prev)) return null;
  const steps = [];
  for (let k = b; k !== a; k = prev[k]) steps.unshift(k);
  return steps.length <= maxSteps ? steps : null;
}

// ---------- Key, door and gems ----------
// Cells you can reach from `from` without going through the locked door.
function reachable(from) {
  const seen = new Set([from]), queue = [from];
  for (let i = 0; i < queue.length; i++) {
    for (const n of open[queue[i]]) if (!seen.has(n) && !isDoor(queue[i], n)) { seen.add(n); queue.push(n); }
  }
  return seen;
}
const isDoor = (a, b) => !!door && ((a === door.a && b === door.b) || (a === door.b && b === door.a));
const blocked = (a, b) => isDoor(a, b) && !hasKey;
function shuffle(list) { for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; } return list; }

function placeExtras() {
  door = null; keyCell = null; hasKey = false; gems = [];
  const path = [start, ...route(start, goal)];
  // A locked door on the way to the treat (from the 3rd maze; the 5th on Easy).
  const firstDoor = saved.diff === 'easy' ? 4 : 2;
  if (level >= firstDoor && path.length >= 6) {
    const i = Math.floor(path.length * 0.6);
    door = { a: path[i], b: path[i + 1] };
    // The key goes somewhere you can reach BEFORE the door — on a side path if
    // there is one (so you have to go and fetch it), otherwise on the way.
    const onPath = new Set(path);
    const side = [...reachable(start)].filter(k => !onPath.has(k));
    const deadEnds = side.filter(k => open[k].length === 1);
    keyCell = (deadEnds.length ? shuffle(deadEnds)[0] : side.length ? shuffle(side)[0] : path[Math.max(1, i - 2)]);
  }
  // Gems: dead ends first (fun to explore), never on the start, treat or key.
  const want = { easy: 2, normal: 3, challenge: 3 }[saved.diff] || 2;
  const spots = Object.keys(open).filter(k => k !== start && k !== goal && k !== keyCell);
  const ends = shuffle(spots.filter(k => open[k].length === 1));
  const rest = shuffle(spots.filter(k => open[k].length !== 1));
  gems = ends.concat(rest).slice(0, want).map(k => ({ k, got: false, el: null }));
}

const KEY_ART = `<circle cx="32" cy="50" r="20" fill="#ffc93c" stroke="${INK}" stroke-width="7"/><circle cx="32" cy="50" r="7" fill="#fff" stroke="${INK}" stroke-width="5"/><path d="M50 50 H90 M78 50 V66 M88 50 V62" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round"/><path d="M50 50 H90 M78 50 V66 M88 50 V62" fill="none" stroke="#ffc93c" stroke-width="7" stroke-linecap="round"/>`;
const GEM_ART = `<path d="M28 20 H72 L90 42 L50 88 L10 42 Z" fill="#4cc9f0" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/><path d="M10 42 H90 M36 20 L50 42 L64 20 M50 42 L50 88" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M30 30 L40 30" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`;

// ---------- Drawing ----------
function el(tag, attrs, parent = svg) {
  const e = document.createElementNS(NS, tag);
  for (const a in attrs) e.setAttribute(a, attrs[a]);
  parent.appendChild(e);
  return e;
}

// A character or treat: an icon drawn in a 100 box, scaled to fit one cell.
function sprite(id, art, k, size = 1.05) {
  const g = el('g', { id });
  const anim = el('g', { class: 'anim' }, g);
  const s = cell * size;
  const inner = el('g', { transform: `translate(${-s / 2} ${-s / 2}) scale(${s / 100})` }, anim);
  inner.innerHTML = art;
  place(g, k);
  return g;
}

function place(g, k) {
  const [x, y] = center(k);
  g.style.transform = `translate(${x}px, ${y}px)`;
}

function draw() {
  const shape = SHAPES[level % SHAPES.length];
  friend = FRIENDS[level % FRIENDS.length];
  svg.innerHTML = '';
  el('path', { d: shape.d, class: 'shape', fill: shape.color });

  // Each open passage is a line between two cell centers. Drawn twice:
  // thick dark first (the outline), then a bit thinner white (the path).
  let d = '';
  for (const k in open) {
    const [x1, y1] = center(k);
    d += `M${x1} ${y1} L${x1 + 0.01} ${y1} `; // single-cell dot, in case
    for (const n of open[k]) if (k < n) {
      const [x2, y2] = center(n);
      d += `M${x1} ${y1} L${x2} ${y2} `;
    }
  }
  const theme = THEMES[Math.floor(level / 2) % THEMES.length];
  document.body.style.background = theme.page;
  document.body.classList.toggle('dark', theme.name === 'space');
  el('path', { d, class: 'path-out', 'stroke-width': cell * 0.78 });
  el('path', { d, class: 'path-in', 'stroke-width': cell * 0.62, style: 'stroke:' + theme.path });

  // locked door: a gold gate across the passage, with a keyhole
  doorEl = keyEl = null;
  if (door) {
    const [ax, ay] = center(door.a), [bx, by] = center(door.b);
    const mx = (ax + bx) / 2, my = (ay + by) / 2, rot = Math.atan2(by - ay, bx - ax) * 180 / Math.PI;
    doorEl = el('g', { class: 'door', transform: `translate(${mx} ${my}) rotate(${rot})` });
    el('rect', { x: -cell * 0.13, y: -cell * 0.42, width: cell * 0.26, height: cell * 0.84, rx: cell * 0.08, fill: '#c68b59', stroke: INK, 'stroke-width': 1.2 }, doorEl);
    el('circle', { cx: 0, cy: -cell * 0.06, r: cell * 0.07, fill: '#ffc93c', stroke: INK, 'stroke-width': 0.6 }, doorEl);
    el('rect', { x: -cell * 0.025, y: -cell * 0.04, width: cell * 0.05, height: cell * 0.14, fill: INK }, doorEl);
    keyEl = sprite('key', KEY_ART, keyCell, 0.7);
    keyEl.classList.add('bob');
  }
  gems.forEach((gm, i) => { gm.el = sprite('gem' + i, GEM_ART, gm.k, 0.6); gm.el.classList.add('bob'); });

  trailEl = el('polyline', { class: 'trail', stroke: friend.trail, 'stroke-width': cell * 0.26 });
  sprite('goal', friend.goal, goal);
  heroEl = sprite('hero', friend.hero, start);
  heroEl.classList.add('wiggle-me'); // a little "pick me up" bounce until the first move
}

function drawTrail() {
  trailEl.setAttribute('points', trail.map(k => center(k).join(',')).join(' '));
}

// ---------- Dragging ----------
// Where is the finger, in maze units?
function pointAt(evt) {
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX; pt.y = evt.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}
// Which path cell is at a point? (null = not on the paths)
function cellAtPoint(p) {
  const k = key(Math.floor(p.x / cell), Math.floor(p.y / cell));
  return open[k] ? k : null;
}

let lastPoint = null;

svg.addEventListener('pointerdown', (e) => {
  if (won) return;
  const p = pointAt(e);
  const k = cellAtPoint(p);
  const here = s0(trail);
  // Start dragging when the finger lands on (or right next to) the character.
  if (k && (k === here || open[here].includes(k))) {
    dragging = true;
    lastPoint = p;
    svg.setPointerCapture(e.pointerId);
    step(k);
  }
});

svg.addEventListener('pointermove', (e) => {
  if (!dragging || won) return;
  // Fingers can move fast, so check the in-between spots too (every 1/4 cell)
  // and let the character follow one neighbor at a time.
  const p = pointAt(e);
  const dist = Math.hypot(p.x - lastPoint.x, p.y - lastPoint.y);
  const n = Math.max(1, Math.ceil(dist / (cell / 4)));
  for (let i = 1; i <= n && !won; i++) {
    const k = cellAtPoint({ x: lastPoint.x + (p.x - lastPoint.x) * i / n,
                            y: lastPoint.y + (p.y - lastPoint.y) * i / n });
    if (k) step(k);
  }
  lastPoint = p;
});

const stopDrag = () => { dragging = false; };
svg.addEventListener('pointerup', stopDrag);
svg.addEventListener('pointercancel', stopDrag);

// Move toward cell k if the paths allow it: straight to a neighbor, or around
// a corner when the finger cuts across it diagonally. Never through a wall.
function step(k) {
  const here = s0(trail);
  if (k === here) return;
  let steps = null;
  if (open[here].includes(k)) {
    steps = [k];
  } else {
    const [x1, y1] = unkey(here), [x2, y2] = unkey(k);
    if (Math.abs(x1 - x2) === 1 && Math.abs(y1 - y2) === 1) {
      const corner = open[here].find(c => open[c].includes(k));
      if (corner) steps = [corner, k];
    }
  }
  if (!steps) return;
  heroEl.classList.remove('wiggle-me');
  for (const c of steps) {
    if (blocked(s0(trail), c)) { knock(); break; }   // locked! find the key first
    if (trail.length > 1 && trail[trail.length - 2] === c) trail.pop(); // going back
    else trail.push(c);
    blip(trail.length);
    pickUp(c);
  }
  place(heroEl, s0(trail));
  drawTrail();
  if (s0(trail) === goal) win();
}
const s0 = t => t[t.length - 1];

// Bump into the locked door: it wiggles and goes "knock knock".
function knock() {
  if (!doorEl || doorEl.__busy) return;
  doorEl.__busy = true;
  tone(180, 0, 0.12, 0.12); tone(160, 0.14, 0.12, 0.12);
  doorEl.animate([{ opacity: 1 }, { opacity: 0.5 }, { opacity: 1 }], { duration: 400 });
  if (keyEl) keyEl.animate([{ opacity: 1 }, { opacity: 0.3 }, { opacity: 1 }, { opacity: 0.3 }, { opacity: 1 }], { duration: 900 });
  setTimeout(() => { doorEl.__busy = false; }, 400);
  dragging = false;
}
// Walking onto the key or a gem picks it up.
function pickUp(c) {
  if (c === keyCell && !hasKey) {
    hasKey = true;
    if (keyEl) keyEl.remove();
    [784, 988, 1319].forEach((f, i) => tone(f, i * 0.08, 0.2, 0.1));
    if (doorEl) { doorEl.style.transition = 'opacity 0.6s'; doorEl.style.opacity = '0.25'; }  // the door unlocks
  }
  for (const gm of gems) {
    if (gm.k === c && !gm.got) {
      gm.got = true;
      gm.el.remove();
      tone(1175, 0, 0.12, 0.1); tone(1568, 0.08, 0.2, 0.1);
      const [x, y] = center(c);
      for (let i = 0; i < 6; i++) {
        const a = Math.PI * 2 * i / 6;
        const sp = el('path', { d: starPath(x, y, 2.5, 1.2), class: 'burst', fill: '#4cc9f0', stroke: INK, 'stroke-width': 0.4 });
        sp.style.setProperty('--dx', (Math.cos(a) * 9).toFixed(1) + 'px');
        sp.style.setProperty('--dy', (Math.sin(a) * 9).toFixed(1) + 'px');
      }
    }
  }
}

// Light bulb: show the way (to the key first, if the door is still locked).
function showHint() {
  if (won) return;
  const here = s0(trail);
  const target = door && !hasKey ? keyCell : goal;
  const r = route(here, target);
  if (!r || !r.length) return;
  if (hintEl) hintEl.remove();
  hintEl = el('polyline', { class: 'hint', points: [here, ...r].map(k => center(k).join(',')).join(' '), 'stroke-width': cell * 0.14 });
  svg.insertBefore(hintEl, trailEl.nextSibling);
  const mine = hintEl;
  setTimeout(() => { if (mine.isConnected) mine.remove(); }, 3500);
}

// ---------- Winning ----------
function win() {
  won = true;
  dragging = false;
  heroEl.classList.add('happy');
  jingle();
  // a burst of colorful stars from the treat
  const [gx, gy] = center(goal);
  const colors = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#9b5de5', '#f15bb5'];
  for (let i = 0; i < 14; i++) {
    const a = (Math.PI * 2 * i) / 14;
    const dist = 18 + Math.random() * 22;
    const star = el('path', {
      d: starPath(gx, gy, 4, 2), class: 'burst',
      fill: colors[i % colors.length], stroke: INK, 'stroke-width': 0.6,
    });
    star.style.setProperty('--dx', (Math.cos(a) * dist).toFixed(1) + 'px');
    star.style.setProperty('--dy', (Math.sin(a) * dist).toFixed(1) + 'px');
  }
  // stars: 1 for the treat, more for the gems you found
  const got = gems.filter(gm => gm.got).length;
  const stars = 1 + (gems.length && got === gems.length ? 2 : got > 0 ? 1 : 0);
  saved.stars[level] = Math.max(saved.stars[level] || 0, stars);
  const before = medalFor(saved.done);
  saved.done++;
  const after = medalFor(saved.done);
  persist();
  winStars.innerHTML = [0, 1, 2].map(i => `<svg viewBox="0 0 48 48" class="${i < stars ? 'on' : ''}" style="animation-delay:${0.05 + i * 0.15}s"><path d="M24 4 L30 17 L44 18 L33 28 L37 43 L24 35 L11 43 L15 28 L4 18 L18 17 Z" fill="${i < stars ? '#ffd166' : '#e8e2d4'}" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/></svg>`).join('')
    + (after && after !== before ? medalSVG(after) : '');
  setTimeout(() => { nextBtn.classList.add("show"); winStars.classList.add("show"); }, 600);
}
function medalSVG(kind) {
  const c = { gold: '#ffc93c', silver: '#c9d6df', bronze: '#e09f5a' }[kind];
  return `<svg viewBox="0 0 48 48" class="on medal" style="animation-delay:1s"><path d="M16 4 L24 20 L32 4" fill="#ef476f" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/><circle cx="24" cy="31" r="14" fill="${c}" stroke="#2b2b2b" stroke-width="3.5"/><path d="M24 23 L26.5 28.5 L32 29 L28 33 L29 38.5 L24 35.5 L19 38.5 L20 33 L16 29 L21.5 28.5 Z" fill="#fff" opacity="0.85"/></svg>`;
}
const winStars = document.getElementById('winStars');

const nextBtn = document.getElementById('next');
nextBtn.addEventListener('click', () => { level++; saved.level = level; persist(); newMaze(); });
document.getElementById('shuffle').addEventListener('click', newMaze);
document.getElementById('hint').addEventListener('click', showHint);

// Dots button: Easy (1 dot) -> Normal (2) -> Challenge (3). Changes how big mazes get.
const diffBtn = document.getElementById('diff');
const DIFFS = ['easy', 'normal', 'challenge'];
function showDiff() {
  const n = DIFFS.indexOf(saved.diff) + 1;
  diffBtn.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true">' +
    [0, 1, 2].map(i => `<circle cx="${12 + i * 12}" cy="24" r="5" fill="${i < n ? '#ef476f' : '#e8e2d4'}" stroke="#2b2b2b" stroke-width="2.5"/>`).join('') + '</svg>';
  diffBtn.setAttribute('aria-label', saved.diff);
}
diffBtn.addEventListener('click', () => {
  saved.diff = DIFFS[(DIFFS.indexOf(saved.diff) + 1) % 3];
  persist(); showDiff(); newMaze();
});
showDiff();

// Arrow keys move one step at a time.
addEventListener('keydown', (e) => {
  const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  if (e.key === 'Enter' && won) { nextBtn.click(); return; }
  if (!dirs[e.key] || won) return;
  e.preventDefault();
  const [x, y] = unkey(s0(trail));
  const k = key(x + dirs[e.key][0], y + dirs[e.key][1]);
  if (open[s0(trail)].includes(k)) step(k);
});

// ---------- Gentle sounds (made by the browser, no sound files) ----------
let audio;
function tone(freq, when, length, volume = 0.08) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const t = audio.currentTime + when;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(gain).connect(audio.destination);
    osc.start(t); osc.stop(t + length);
  } catch (e) { /* no sound available - that's fine */ }
}
// a soft tick that climbs in pitch as the trail gets longer
function blip(n) { tone(440 + (n % 12) * 30, 0, 0.08, 0.04); }
// happy "ta-da": C E G C
function jingle() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.35)); }

// ---------- Start ----------
function newMaze() {
  won = false;
  dragging = false;
  nextBtn.classList.remove('show');
  winStars.classList.remove('show');
  if (hintEl) { hintEl.remove(); hintEl = null; }
  N = gridSize(level);
  cell = 100 / N;
  makeMaze(SHAPES[level % SHAPES.length]);
  placeExtras();
  trail = [start];
  draw();
  drawTrail();
}

newMaze();
