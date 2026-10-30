// Maze game.
// Each maze is cut out of a big friendly shape (circle, heart, star...).
// A little character sits at the start; the child drags it along the white
// paths to its treat at the other end. There are no walls to bump and nothing
// to lose: the character simply only moves where the path goes.
// Every finished maze gets a star burst + jingle, then the next maze is a
// different shape and a tiny bit bigger.

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

// Grid size per level: starts tiny, grows slowly, stops at 7 so paths stay finger-wide.
function gridSize(level) {
  return [5, 5, 6, 6, 7, 7][Math.min(level, 5)];
}

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
let level = 0;
let N, cell;          // grid size and size of one cell (in the 100-unit drawing)
let open;             // open[key] = list of neighbor keys you can walk to
let start, goal;      // cell keys like "3,4"
let trail;            // cells walked so far, start ... current
let heroEl, trailEl;
let friend;
let dragging = false;
let won = false;

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

// ---------- Drawing ----------
function el(tag, attrs, parent = svg) {
  const e = document.createElementNS(NS, tag);
  for (const a in attrs) e.setAttribute(a, attrs[a]);
  parent.appendChild(e);
  return e;
}

// A character or treat: an icon drawn in a 100 box, scaled to fit one cell.
function sprite(id, art, k) {
  const g = el('g', { id });
  const anim = el('g', { class: 'anim' }, g);
  const s = cell * 1.05;
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
  el('path', { d, class: 'path-out', 'stroke-width': cell * 0.78 });
  el('path', { d, class: 'path-in', 'stroke-width': cell * 0.62 });

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
    if (trail.length > 1 && trail[trail.length - 2] === c) trail.pop(); // going back
    else trail.push(c);
    blip(trail.length);
  }
  place(heroEl, s0(trail));
  drawTrail();
  if (s0(trail) === goal) win();
}
const s0 = t => t[t.length - 1];

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
  setTimeout(() => nextBtn.classList.add('show'), 1200);
}

const nextBtn = document.getElementById('next');
nextBtn.addEventListener('click', () => { level++; newMaze(); });
document.getElementById('shuffle').addEventListener('click', newMaze);

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
  N = gridSize(level);
  cell = 100 / N;
  makeMaze(SHAPES[level % SHAPES.length]);
  trail = [start];
  draw();
  drawTrail();
}

newMaze();
