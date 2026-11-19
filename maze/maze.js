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
  // Nov 19: three more shapes
  { name: 'house',   color: '#ffb4a2', d: 'M50 3 L97 44 C98 45 98 46 98 48 V92 C98 95 96 97 93 97 H7 C4 97 2 95 2 92 V48 C2 46 2 45 3 44 Z' },
  { name: 'apple',   color: '#ff8fa3', d: 'M50 22 C62 10 96 10 98 44 C100 74 80 99 62 97 C56 96 54 93 50 93 C46 93 44 96 38 97 C20 99 0 74 2 44 C4 10 38 10 50 22 Z' },
  { name: 'cloud',   color: '#a9def9', d: 'M16 86 C2 84 -1 64 10 56 C2 40 16 22 32 28 C36 8 62 2 72 18 C88 12 102 28 94 44 C104 54 100 76 86 80 C84 94 66 100 56 90 C44 100 22 98 16 86 Z' },
  { name: 'star',    color: '#ffd166', d: starPath(50, 55, 54, 31) },
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
// each player has their own maze saves (see Arcade.profiles in arcade/shared.js)
const SAVE_KEY = window.Arcade ? Arcade.profiles.key('kidsMaze.v1') : 'kidsMaze.v1';
// level = the maze you're on, top = the furthest maze reached (for the map),
// buddy = the friend you picked ('mix' = take turns)
let saved = { level: 0, diff: 'easy', stars: {}, done: 0, top: 0, buddy: 'mix' };
try { saved = Object.assign(saved, JSON.parse(localStorage.getItem(SAVE_KEY)) || {}); } catch (e) { /* no saving */ }
saved.top = Math.max(saved.top || 0, saved.level || 0);   // (older saves had no `top`)
// little kids (3-5, see the player's age in arcade/shared.js): no dark caves, quicker sparkle help
const LITTLE = !!(window.Arcade && Arcade.profiles.little());
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
    if (Arcade.stickers) Arcade.stickers.check();   // mazes earn stickers for the sticker book
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
  // Nov 19: a cave. On Normal + Challenge it's dark: only where your friend's
  // lantern has been is lit up (gems hide in the dark). Easy + little kids: lit.
  { name: 'cave',   page: '#3d3350', path: '#fff4d6', dark: true },
];
const themeFor = lv => THEMES[Math.floor(lv / 2) % THEMES.length];
const isDark = lv => !!themeFor(lv).dark && saved.diff !== 'easy' && !LITTLE;

// ---------- Characters and their treats (drawn in a 100 x 100 box) ----------
// `need` = mazes to finish before that friend can be picked (the first 3 are
// always there). New friends join as you play (Nov 19).
const FRIENDS = [
  { id: 'bee', need: 0, // bee -> flower
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
  { id: 'bunny', need: 0, // bunny -> carrot
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
  { id: 'mouse', need: 0, // mouse -> cheese
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
  { id: 'puppy', need: 3, // puppy -> bone
    hero: `
      <ellipse cx="22" cy="48" rx="13" ry="25" fill="#a26b3f" stroke="${INK}" stroke-width="6" transform="rotate(22 22 48)"/>
      <ellipse cx="78" cy="48" rx="13" ry="25" fill="#a26b3f" stroke="${INK}" stroke-width="6" transform="rotate(-22 78 48)"/>
      <circle cx="50" cy="56" r="32" fill="#f3d7a8" stroke="${INK}" stroke-width="6"/>
      <ellipse cx="63" cy="48" rx="11" ry="10" fill="#c98b55"/>
      <circle cx="38" cy="50" r="6" fill="${INK}"/><circle cx="62" cy="50" r="6" fill="${INK}"/>
      <ellipse cx="50" cy="64" rx="8" ry="6" fill="${INK}"/>
      <path d="M40 72 Q50 80 60 72" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="54" cy="80" rx="5" ry="6" fill="#ff8fab" stroke="${INK}" stroke-width="3"/>`,
    goal: `
      <g transform="rotate(-30 50 50)">
        <g fill="${INK}"><circle cx="24" cy="40" r="15"/><circle cx="24" cy="60" r="15"/><circle cx="76" cy="40" r="15"/><circle cx="76" cy="60" r="15"/><rect x="22" y="36" width="56" height="28" rx="6"/></g>
        <g fill="#fffaf0"><circle cx="24" cy="40" r="10"/><circle cx="24" cy="60" r="10"/><circle cx="76" cy="40" r="10"/><circle cx="76" cy="60" r="10"/><rect x="24" y="41" width="52" height="18"/></g>
      </g>`,
    trail: '#c98b55',
  },
  { id: 'monkey', need: 6, // monkey -> banana
    hero: `
      <circle cx="18" cy="52" r="14" fill="#a0673c" stroke="${INK}" stroke-width="6"/>
      <circle cx="82" cy="52" r="14" fill="#a0673c" stroke="${INK}" stroke-width="6"/>
      <circle cx="18" cy="52" r="6" fill="#ffc8a2"/><circle cx="82" cy="52" r="6" fill="#ffc8a2"/>
      <circle cx="50" cy="52" r="34" fill="#a0673c" stroke="${INK}" stroke-width="6"/>
      <path d="M50 44 C44 32 24 34 26 52 C26 60 30 64 32 66 C30 84 70 84 68 66 C70 64 74 60 74 52 C76 34 56 32 50 44 Z" fill="#ffc8a2" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="40" cy="50" r="5.5" fill="${INK}"/><circle cx="60" cy="50" r="5.5" fill="${INK}"/>
      <circle cx="46" cy="63" r="2.5" fill="${INK}"/><circle cx="54" cy="63" r="2.5" fill="${INK}"/>
      <path d="M40 70 Q50 78 60 70" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
    goal: `
      <path d="M70 10 L80 6 L84 16 L76 20 Z" fill="#8d6e4a" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M76 18 C92 50 74 88 34 92 C20 93 10 88 12 82 C14 78 22 80 30 78 C58 72 70 48 66 22 C66 16 72 14 76 18 Z"
            fill="#ffe066" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M68 34 C70 54 58 70 38 76" fill="none" stroke="#e0b100" stroke-width="5" stroke-linecap="round"/>`,
    trail: '#ffe066',
  },
  { id: 'fish', need: 9, // fish -> shell
    hero: `
      <path d="M30 50 L6 28 C2 40 2 60 6 72 Z" fill="#ff9f1c" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M42 32 C46 12 68 10 76 30 Z" fill="#ff9f1c" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <ellipse cx="56" cy="52" rx="38" ry="28" fill="#ffbf69" stroke="${INK}" stroke-width="6"/>
      <path d="M44 28 C38 40 38 64 44 76" fill="none" stroke="${INK}" stroke-width="4"/>
      <circle cx="72" cy="46" r="6" fill="${INK}"/><circle cx="74" cy="44" r="2" fill="#fff"/>
      <path d="M72 62 Q80 66 86 60" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
    goal: `
      <path d="M50 90 L14 50 C10 22 90 22 86 50 Z" fill="#ffafcc" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M50 88 L28 34 M50 88 L50 28 M50 88 L72 34" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
      <path d="M36 84 H64 L60 94 H40 Z" fill="#ffafcc" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`,
    trail: '#4cc9f0',
  },
  { id: 'kitten', need: 12, // kitten -> ball of yarn
    hero: `
      <path d="M16 46 L18 10 L46 30 Z" fill="#ffa94d" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M84 46 L82 10 L54 30 Z" fill="#ffa94d" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <circle cx="50" cy="58" r="34" fill="#ffa94d" stroke="${INK}" stroke-width="6"/>
      <path d="M50 26 V36 M40 28 L42 36 M60 28 L58 36" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="38" cy="54" r="6" fill="${INK}"/><circle cx="62" cy="54" r="6" fill="${INK}"/>
      <path d="M45 64 H55 L50 70 Z" fill="#f15bb5" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M50 70 Q44 78 40 74 M50 70 Q56 78 60 74" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M32 66 L12 62 M32 72 L14 78 M68 66 L88 62 M68 72 L86 78" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    goal: `
      <path d="M78 74 C88 84 92 90 96 84" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
      <circle cx="48" cy="52" r="38" fill="#9b5de5" stroke="${INK}" stroke-width="6"/>
      <path d="M22 36 C40 40 56 58 62 82 M36 22 C52 30 70 46 78 64 M16 58 C30 60 40 70 44 86" fill="none" stroke="#e0c3fc" stroke-width="5" stroke-linecap="round"/>`,
    trail: '#9b5de5',
  },
];

// Friends you can pick so far (more join as you finish mazes)
const unlocked = () => FRIENDS.filter(f => (saved.done || 0) >= f.need);
// The friend for a maze: the one you picked, or everyone taking turns
function friendFor(lv) {
  const list = unlocked();
  return list.find(f => f.id === saved.buddy) || list[lv % list.length];
}

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
let fogHoles = null;  // dark caves: the lit-up spots go in here (an SVG mask)
let lit;              // cells already lit by the lantern
let idleTimer = null; // "show me" sparkle after a while with no moves

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
  friend = friendFor(level);
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
  const theme = themeFor(level);
  document.body.style.background = theme.page;
  document.body.classList.toggle('dark', theme.name === 'space' || theme.name === 'cave');
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

  // Dark cave: a dark layer over the maze with see-through holes where the
  // lantern has been. The key and the treat glow through it; gems don't.
  fogHoles = null;
  if (isDark(level)) {
    const defs = el('defs', {});
    const grad = el('radialGradient', { id: 'lamp' }, defs);
    el('stop', { offset: '0.45', 'stop-color': '#000', 'stop-opacity': 1 }, grad);
    el('stop', { offset: '1', 'stop-color': '#000', 'stop-opacity': 0 }, grad);
    const mask = el('mask', { id: 'fog', maskUnits: 'userSpaceOnUse', x: -10, y: -10, width: 120, height: 120 }, defs);
    el('rect', { x: -10, y: -10, width: 120, height: 120, fill: '#fff' }, mask);
    fogHoles = el('g', {}, mask);
    el('path', { class: 'fog', d: shape.d, mask: 'url(#fog)' });   // only over the shape, not the page
    if (keyEl) svg.appendChild(keyEl);   // the key stays on top of the dark
  }

  trailEl = el('polyline', { class: 'trail', stroke: friend.trail, 'stroke-width': cell * 0.26 });
  sprite('goal', friend.goal, goal).classList.add(fogHoles ? 'glow' : 'x');
  heroEl = sprite('hero', friend.hero, start);
  heroEl.classList.add('wiggle-me'); // a little "pick me up" bounce until the first move
  lit = new Set();
  light(start);
}

// Light up a spot (and a bit around it) in a dark cave.
function light(k) {
  if (!fogHoles || lit.has(k)) return;
  lit.add(k);
  const [x, y] = center(k);
  el('circle', { cx: x, cy: y, r: cell * 1.35, fill: 'url(#lamp)' }, fogHoles);
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
    light(c);
  }
  resetIdle();
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
// (`steps` = only show the next few steps: the gentle "stuck?" sparkle)
function showHint(steps) {
  if (won) return;
  const here = s0(trail);
  const target = door && !hasKey ? keyCell : goal;
  let r = route(here, target);
  if (!r || !r.length) return;
  if (steps > 0) r = r.slice(0, steps);
  if (hintEl) hintEl.remove();
  hintEl = el('polyline', { class: 'hint', points: [here, ...r].map(k => center(k).join(',')).join(' '), 'stroke-width': cell * 0.14 });
  svg.insertBefore(hintEl, trailEl.nextSibling);
  const mine = hintEl;
  setTimeout(() => { if (mine.isConnected) mine.remove(); }, 3500);
}

// Stuck? After a while with no moves the next few steps sparkle by themselves
// and the light bulb wiggles (sooner for little kids). It just helps; nothing is lost.
const IDLE_MS = LITTLE ? 9000 : 15000;
function resetIdle() {
  clearTimeout(idleTimer);
  hintBtn.classList.remove('nudge');
  if (won) return;
  idleTimer = setTimeout(() => {
    if (won || mapEl.classList.contains('show')) return;
    showHint(3);
    hintBtn.classList.add('nudge');
    resetIdle.again = setTimeout(resetIdle, 3600);   // and again later if still stuck
  }, IDLE_MS);
}

// ---------- Winning ----------
function win() {
  won = true;
  dragging = false;
  clearTimeout(idleTimer); hintBtn.classList.remove('nudge');
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
  const friendsBefore = unlocked().length;
  saved.done++;
  saved.top = Math.max(saved.top, level + 1);   // the next maze is open on the map
  const after = medalFor(saved.done);
  const newFriend = unlocked().length > friendsBefore ? unlocked().slice(-1)[0] : null;
  persist();
  if (window.Arcade && Arcade.daily) Arcade.daily.report('maze', { win: true, stars });   // today's surprise
  winStars.innerHTML = [0, 1, 2].map(i => `<svg viewBox="0 0 48 48" class="${i < stars ? 'on' : ''}" style="animation-delay:${0.05 + i * 0.15}s"><path d="M24 4 L30 17 L44 18 L33 28 L37 43 L24 35 L11 43 L15 28 L4 18 L18 17 Z" fill="${i < stars ? '#ffd166' : '#e8e2d4'}" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/></svg>`).join('')
    + (after && after !== before ? medalSVG(after) : '')
    // a new friend wants to come exploring: shown next to the stars
    + (newFriend ? `<svg viewBox="-10 -10 120 120" class="on newfriend" style="animation-delay:1.2s"><circle cx="50" cy="50" r="56" fill="#fff" stroke="#2b2b2b" stroke-width="5"/>${newFriend.hero}</svg>` : '');
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
const hintBtn = document.getElementById('hint');
hintBtn.addEventListener('click', () => { showHint(); resetIdle(); });

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
  if (mapEl.classList.contains('show')) openMap();
});
showDiff();

// Arrow keys move one step at a time.
addEventListener('keydown', (e) => {
  const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  if (e.key === 'Enter' && won) { nextBtn.click(); return; }
  if (e.key === 'Escape' && mapEl.classList.contains('show')) { closeMap(); return; }
  if (!dirs[e.key] || won || mapEl.classList.contains('show')) return;
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
  resetIdle();
}

// ---------- The map (Nov 19) ----------
// A picture page: pick your friend, Easy/Normal/Challenge, and every maze so far
// as a stepping stone (its shape + stars). Tap a stone to play that maze again.
const mapEl = document.getElementById('map');
const mapBtn = document.getElementById('mapBtn');
const LOCK = `<path d="M30 46 V34 C30 20 70 20 70 34 V46" fill="none" stroke="#2b2b2b" stroke-width="9"/><rect x="22" y="44" width="56" height="42" rx="9" fill="#ffd166" stroke="#2b2b2b" stroke-width="6"/><circle cx="50" cy="62" r="6" fill="#2b2b2b"/>`;
const DICE = `<rect x="14" y="14" width="72" height="72" rx="16" fill="#fff" stroke="#2b2b2b" stroke-width="6"/><g fill="#2b2b2b"><circle cx="32" cy="32" r="7"/><circle cx="68" cy="32" r="7"/><circle cx="50" cy="50" r="7"/><circle cx="32" cy="68" r="7"/><circle cx="68" cy="68" r="7"/></g>`;
function starRow(n) {
  return [0, 1, 2].map(i => `<path transform="translate(${i * 34} 0)" d="M15 1 L19 10 L29 11 L21 18 L24 28 L15 23 L6 28 L9 18 L1 11 L11 10 Z" fill="${i < n ? '#ffd166' : '#e8e2d4'}" stroke="#2b2b2b" stroke-width="2.5" stroke-linejoin="round"/>`).join('');
}
function openMap() {
  clearTimeout(idleTimer);
  const buddies = document.getElementById('buddies');
  // friends: 'mix' (dice) + every friend; locked ones are a dark shape with a padlock
  buddies.innerHTML = '';
  const pick = (id) => { saved.buddy = id; persist(); tone(880, 0, 0.12); openMap(); };
  const mix = document.createElement('button');
  mix.className = 'pick' + (saved.buddy === 'mix' || !unlocked().some(f => f.id === saved.buddy) ? ' on' : '');
  mix.setAttribute('aria-label', 'mix'); mix.dataset.buddy = 'mix';
  mix.innerHTML = `<svg viewBox="0 0 100 100">${DICE}</svg>`;
  mix.onclick = () => pick('mix');
  buddies.appendChild(mix);
  for (const f of FRIENDS) {
    const b = document.createElement('button');
    const ok = (saved.done || 0) >= f.need;
    b.className = 'pick' + (ok ? '' : ' locked') + (ok && saved.buddy === f.id ? ' on' : '');
    b.setAttribute('aria-label', f.id); b.dataset.buddy = f.id;
    b.innerHTML = `<svg viewBox="-4 -4 108 108"><g class="art">${f.hero}</g>${ok ? '' : `<g transform="translate(46 46) scale(0.5)">${LOCK}</g>`}</svg>`;
    b.onclick = () => { if (ok) pick(f.id); else b.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-8deg)' }, { transform: 'rotate(8deg)' }, { transform: 'rotate(0)' }], { duration: 300 }); };
    buddies.appendChild(b);
  }
  // stepping stones: every maze reached so far
  const stones = document.getElementById('stones');
  stones.innerHTML = '';
  for (let i = 0; i <= saved.top; i++) {
    const sh = SHAPES[i % SHAPES.length], th = themeFor(i);
    const b = document.createElement('button');
    b.className = 'stone' + (i === level ? ' here' : '');
    b.dataset.level = i;
    b.style.background = th.page;
    b.setAttribute('aria-label', 'maze ' + (i + 1));
    b.innerHTML = `<svg viewBox="-4 -4 108 108" class="sh"><path d="${sh.d}" fill="${sh.color}" stroke="#2b2b2b" stroke-width="6" stroke-linejoin="round"/>`
      + (themeFor(i).dark ? `<path d="M72 14 Q80 2 88 14" fill="none" stroke="#2b2b2b" stroke-width="4"/><rect x="69" y="13" width="22" height="28" rx="6" fill="#ffd166" stroke="#2b2b2b" stroke-width="4"/>` : '') + `</svg>`   // (a lantern = a dark cave)
      + `<svg viewBox="0 0 98 30" class="st">${starRow(saved.stars[i] || 0)}</svg>`;
    b.onclick = () => { level = i; saved.level = i; persist(); closeMap(); newMaze(); };
    stones.appendChild(b);
  }
  mapEl.classList.add('show');
  const here = stones.querySelector('.here');
  if (here && here.scrollIntoView) here.scrollIntoView({ block: 'center' });
}
function closeMap() { mapEl.classList.remove('show'); if (!won) resetIdle(); }
mapBtn.addEventListener('click', openMap);
// back to the maze; a new friend picked = a fresh maze with them in it
document.getElementById('mapClose').addEventListener('click', () => {
  closeMap();
  if (friendFor(level).id !== friend.id) newMaze();
});

// ---------- Test hooks (tests/test_maze.py) ----------
window.__mazeState = () => ({
  level, top: saved.top, N, cells: Object.keys(open).length, start, goal, here: s0(trail), won,
  door: door ? [door.a, door.b] : null, keyCell, hasKey, gems: gems.map(g => ({ k: g.k, got: g.got })),
  friend: friend.id, buddy: saved.buddy, unlocked: unlocked().map(f => f.id), shape: SHAPES[level % SHAPES.length].name,
  theme: themeFor(level).name, dark: !!fogHoles, lit: lit ? lit.size : 0, done: saved.done, stars: saved.stars,
  hint: !!(hintEl && hintEl.isConnected), diff: saved.diff, little: LITTLE, map: mapEl.classList.contains('show'),
});
// route(a, b) = the cells from a to b along the paths; step(k) = walk one cell (like a finger)
window.__mazeTest = { route: (a, b) => route(a, b), step: k => step(k), open: () => open, idle: () => IDLE_MS };

newMaze();
