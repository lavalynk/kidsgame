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
if (!Array.isArray(saved.made)) saved.made = [null, null, null];   // My mazes (the Maze Maker, Nov 22)
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
const isDark = lv => !made && !!themeFor(lv).dark && saved.diff !== 'easy' && !LITTLE;

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
    call: [220, 247, 220, 247],
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
    call: [880, 1047, 880],
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
    call: [1568, 1760, 1568],
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
    call: [587, 440],
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
    call: [659, 880, 659, 880],
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
    call: [1047, 1319, 1568],
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
    call: [880, 698],
  },
  // Nov 21, last run: three more friends (Keith's "more friends" idea): penguin, frog, owl
  { id: 'penguin', need: 15, // penguin -> ice cream
    hero: `
      <ellipse cx="34" cy="92" rx="13" ry="7" fill="#ff9f1c" stroke="${INK}" stroke-width="5"/>
      <ellipse cx="66" cy="92" rx="13" ry="7" fill="#ff9f1c" stroke="${INK}" stroke-width="5"/>
      <ellipse cx="14" cy="62" rx="9" ry="20" fill="#3d5a80" stroke="${INK}" stroke-width="6" transform="rotate(20 14 62)"/>
      <ellipse cx="86" cy="62" rx="9" ry="20" fill="#3d5a80" stroke="${INK}" stroke-width="6" transform="rotate(-20 86 62)"/>
      <ellipse cx="50" cy="54" rx="36" ry="38" fill="#3d5a80" stroke="${INK}" stroke-width="6"/>
      <path d="M50 34 C40 20 18 30 22 54 C24 74 36 86 50 86 C64 86 76 74 78 54 C82 30 60 20 50 34 Z" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="39" cy="48" r="6" fill="${INK}"/><circle cx="61" cy="48" r="6" fill="${INK}"/>
      <circle cx="41" cy="46" r="2" fill="#fff"/><circle cx="63" cy="46" r="2" fill="#fff"/>
      <ellipse cx="29" cy="62" rx="6" ry="4" fill="#ffafcc"/><ellipse cx="71" cy="62" rx="6" ry="4" fill="#ffafcc"/>
      <path d="M42 57 Q50 54 58 57 L50 67 Z" fill="#ff9f1c" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`,
    goal: `
      <path d="M30 50 L50 96 L70 50 Z" fill="#e9b872" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M38 58 L58 78 M48 52 L64 66 M62 56 L44 84 M52 52 L38 68" stroke="#b07d3a" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="40" cy="42" r="17" fill="#a8e6cf" stroke="${INK}" stroke-width="6"/>
      <circle cx="60" cy="42" r="17" fill="#ffafcc" stroke="${INK}" stroke-width="6"/>
      <circle cx="50" cy="26" r="16" fill="#fff3b0" stroke="${INK}" stroke-width="6"/>
      <circle cx="50" cy="8" r="7" fill="#ef476f" stroke="${INK}" stroke-width="4"/>`,
    trail: '#90e0ef',
    call: [523, 587, 659, 587],
  },
  { id: 'frog', need: 18, // frog -> lily pad with a flower
    hero: `
      <circle cx="28" cy="28" r="18" fill="#7bd389" stroke="${INK}" stroke-width="6"/>
      <circle cx="72" cy="28" r="18" fill="#7bd389" stroke="${INK}" stroke-width="6"/>
      <ellipse cx="50" cy="62" rx="44" ry="32" fill="#7bd389" stroke="${INK}" stroke-width="6"/>
      <path d="M14 34 C16 20 40 18 42 34 Z M58 34 C60 18 84 20 86 34 Z" fill="#7bd389"/>
      <circle cx="28" cy="28" r="10" fill="#fff"/><circle cx="72" cy="28" r="10" fill="#fff"/>
      <circle cx="29" cy="29" r="6" fill="${INK}"/><circle cx="71" cy="29" r="6" fill="${INK}"/>
      <circle cx="31" cy="27" r="2" fill="#fff"/><circle cx="73" cy="27" r="2" fill="#fff"/>
      <circle cx="44" cy="52" r="2.5" fill="${INK}"/><circle cx="56" cy="52" r="2.5" fill="${INK}"/>
      <ellipse cx="20" cy="66" rx="8" ry="5" fill="#ffafcc"/><ellipse cx="80" cy="66" rx="8" ry="5" fill="#ffafcc"/>
      <path d="M28 64 Q50 86 72 64" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`,
    goal: `
      <path d="M50 56 L88 40 C98 56 92 86 50 90 C10 88 4 60 14 46 C24 34 40 34 50 56 Z" fill="#52b788" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M50 56 L30 72 M50 56 L60 80 M50 56 L78 62" stroke="#2d6a4f" stroke-width="3.5" stroke-linecap="round"/>
      <g fill="#ffafcc" stroke="${INK}" stroke-width="5" stroke-linejoin="round">
        <ellipse cx="34" cy="30" rx="9" ry="18" transform="rotate(-35 34 30)"/>
        <ellipse cx="66" cy="30" rx="9" ry="18" transform="rotate(35 66 30)"/>
        <ellipse cx="50" cy="22" rx="10" ry="20"/>
      </g>
      <circle cx="50" cy="40" r="8" fill="#ffd166" stroke="${INK}" stroke-width="4"/>`,
    trail: '#06d6a0',
    call: [196, 262, 196, 262],
  },
  { id: 'owl', need: 21, // owl -> the moon
    hero: `
      <path d="M18 30 L22 4 L40 20 Z M82 30 L78 4 L60 20 Z" fill="#b08968" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <ellipse cx="50" cy="56" rx="38" ry="40" fill="#b08968" stroke="${INK}" stroke-width="6"/>
      <ellipse cx="50" cy="74" rx="22" ry="18" fill="#ede0d4"/>
      <path d="M40 70 Q44 75 48 70 M52 70 Q56 75 60 70 M46 80 Q50 85 54 80" fill="none" stroke="#9c6644" stroke-width="3" stroke-linecap="round"/>
      <circle cx="35" cy="44" r="16" fill="#ede0d4" stroke="${INK}" stroke-width="5"/>
      <circle cx="65" cy="44" r="16" fill="#ede0d4" stroke="${INK}" stroke-width="5"/>
      <circle cx="35" cy="44" r="7.5" fill="${INK}"/><circle cx="65" cy="44" r="7.5" fill="${INK}"/>
      <circle cx="37.5" cy="41.5" r="2.5" fill="#fff"/><circle cx="67.5" cy="41.5" r="2.5" fill="#fff"/>
      <ellipse cx="20" cy="60" rx="6" ry="4" fill="#ffafcc"/><ellipse cx="80" cy="60" rx="6" ry="4" fill="#ffafcc"/>
      <path d="M44 56 L56 56 L50 66 Z" fill="#ff9f1c" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`,
    goal: `
      <path d="M45.8 12.2 A40 40 0 1 0 87.5 65.8 A34 34 0 0 1 45.8 12.2 Z" fill="#ffe066" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M78 8 L81 15 L88 16 L83 21 L84 28 L78 24 L72 28 L73 21 L68 16 L75 15 Z" fill="#ffd166" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`,
    trail: '#ffe066',
    call: [440, 349, 440, 349],
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
let doorEl, keyEl, hintEl, goalEl;
let fogHoles = null;  // dark caves: the lit-up spots go in here (an SVG mask)
let lit;              // cells already lit by the lantern
let idleTimer = null; // "show me" sparkle after a while with no moves
let bridges = [];      // [{ k, x, y, vert, over: [a, b], under: [c, d] }] (Nov 22)
let overTrailEl;      // the bit of trail that goes over a bridge (drawn on top of the bridge)
let hopsLeft = 0;     // the cheeky treat (Nov 22): how many more times it hops away
let made = null;      // playing a maze you made yourself (the Maze Maker, Nov 22): { slot, t }, else null
let making = false;   // the Maze Maker is open (digging, not playing)

const key = (x, y) => x + ',' + y;
const unkey = k => k.split(',').map(Number);
const center = k => { const [x, y] = unkey(k); return [(x + 0.5) * cell, (y + 0.5) * cell]; };

// ---------- Making a maze ----------
// 1. Find the grid cells that fit inside the shape (with a little margin).
// 2. Keep only the biggest connected group of them.
// 3. Carve a maze with a "random walk that backs up when stuck"
//    (every cell gets reached, and there's exactly one way between any two cells).
// 4. Start and goal = the two cells that are farthest apart along the paths.
function makeMaze(shape, tries = 0) {
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

  // Bridges (Nov 22): a few cells become a little bridge with a tunnel under it.
  // One path goes OVER the bridge (left-right or up-down) and another goes UNDER
  // it (the other way). The bridge cell is taken out of the carving; instead its
  // two sides are joined by a "long" passage (one over, one under). The walk
  // below always takes a long passage the first time it gets there, so both
  // are always carved and every bridge gets used.
  bridges = [];
  const want = bridgeCount();
  const spots = shuffle(best.filter(k => neighbors(k).length === 4));
  for (const k of spots) {
    if (bridges.length >= want) break;
    const [x, y] = unkey(k);
    // keep bridges apart (no bridge next to or right beside another one)
    if (bridges.some(b => Math.abs(b.x - x) + Math.abs(b.y - y) < 3)) continue;
    const vert = Math.random() < 0.5;    // true = the bridge goes up-down
    const across = [key(x - 1, y), key(x + 1, y)], down = [key(x, y - 1), key(x, y + 1)];
    bridges.push({ k, x, y, vert, over: vert ? down : across, under: vert ? across : down });
  }
  const bridgeAt = new Set(bridges.map(b => b.k));
  const long = {};   // cell -> [{ to, via }]: the far side of a bridge, and the bridge spot used
  bridges.forEach(b => {
    [[b.over, b.k], [b.under, b.k + ',u']].forEach(([[a, c], via]) => {
      (long[a] = long[a] || []).push({ to: c, via });
      (long[c] = long[c] || []).push({ to: a, via });
    });
  });

  // carve the maze
  open = {};
  cells.forEach(k => { open[k] = []; });
  bridges.forEach(b => { open[b.k] = []; open[b.k + ',u'] = []; });   // "x,y" = over, "x,y,u" = under
  const walkable = best.filter(k => !bridgeAt.has(k));
  const first = walkable[Math.floor(Math.random() * walkable.length)];
  const visited = new Set([first]);
  const stack = [first];
  const join = (a, b) => { open[a].push(b); open[b].push(a); };
  while (stack.length) {
    const here = stack[stack.length - 1];
    // a bridge to the other side? always cross it (the far side is never visited yet)
    const jump = (long[here] || []).find(j => !visited.has(j.to));
    if (jump) {
      join(here, jump.via); join(jump.via, jump.to);
      visited.add(jump.to); stack.push(jump.to);
      continue;
    }
    const choices = neighbors(here).filter(n => cells.has(n) && !bridgeAt.has(n) && !visited.has(n));
    if (!choices.length) { stack.pop(); continue; }
    const next = choices[Math.floor(Math.random() * choices.length)];
    join(here, next);
    visited.add(next); stack.push(next);
  }

  // A bridge next to a little square loop of paths looks like a crossroads with a
  // hole in it, not a bridge: make a new maze instead (a few tries, it's quick).
  if (tries < 30 && bridges.some(b => [[-1, -1], [1, -1], [-1, 1], [1, 1]].some(([dx, dy]) => {
    const d = key(b.x + dx, b.y + dy), h = key(b.x + dx, b.y), v = key(b.x, b.y + dy);
    return open[d] && open[d].includes(h) && open[d].includes(v);
  }))) return makeMaze(shape, tries + 1);

  start = farthestFrom(first);
  goal = farthestFrom(start);
}

// Walk the paths outward from one cell; return the cell farthest away.
// How many bridges a maze gets: none in the first 3 mazes, then 1 (Easy),
// 1-2 (Normal) or 2 (Challenge). Little kids: 1 (it's fun, never hard).
function bridgeCount() {
  if (level < 3) return 0;
  if (LITTLE || saved.diff === 'easy') return 1;
  if (saved.diff === 'challenge') return 2;
  return level >= 6 ? 2 : 1;
}
const isUnder = k => k.endsWith(',u');
const isBridge = k => bridges.some(b => b.k === k || b.k + ',u' === k);
const cellOf = k => isUnder(k) ? k.slice(0, -2) : k;   // the grid cell a spot is in

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
    let i = Math.floor(path.length * 0.6);
    // never on a bridge or in a tunnel: step along until both sides are plain path
    const plain = j => j >= 1 && j + 1 < path.length && !isBridge(path[j]) && !isBridge(path[j + 1]);
    if (!plain(i)) {
      const near = path.map((_, j) => j).sort((a, b) => Math.abs(a - i) - Math.abs(b - i)).find(plain);
      if (near !== undefined) i = near;
    }
    door = { a: path[i], b: path[i + 1] };
    // The key goes somewhere you can reach BEFORE the door — on a side path if
    // there is one (so you have to go and fetch it), otherwise on the way.
    const onPath = new Set(path);
    const side = [...reachable(start)].filter(k => !onPath.has(k) && !isBridge(k));
    const deadEnds = side.filter(k => open[k].length === 1);
    keyCell = (deadEnds.length ? shuffle(deadEnds)[0] : side.length ? shuffle(side)[0] : path[Math.max(1, i - 2)]);
  }
  // Gems: dead ends first (fun to explore), never on the start, treat or key.
  const want = { easy: 2, normal: 3, challenge: 3 }[saved.diff] || 2;
  const spots = Object.keys(open).filter(k => k !== start && k !== goal && k !== keyCell && !isBridge(k));
  const ends = shuffle(spots.filter(k => open[k].length === 1));
  const rest = shuffle(spots.filter(k => open[k].length !== 1));
  gems = ends.concat(rest).slice(0, want).map(k => ({ k, got: false, el: null }));
}

// ---------- The cheeky treat (Nov 22) ----------
// Some mazes have a treat that wants to play tag: when your friend gets close
// (2 steps), it giggles and hops a few steps away along the paths, then waits.
// It only hops a few times (1 for little kids and on Easy, 2 on Normal, 3 on
// Challenge), never onto the start, a bridge, the key or somewhere locked, so
// you always catch it in the end. From the 5th maze, every 3rd maze.
const isChase = lv => lv >= 4 && lv % 3 === 1;
function chaseHops() {
  if (!isChase(level)) return 0;
  if (LITTLE || saved.diff === 'easy') return 1;
  return saved.diff === 'challenge' ? 3 : 2;
}
// How many steps from `from` to every spot you can walk to right now (the locked door stops you).
function stepsFrom(from) {
  const dist = { [from]: 0 }, queue = [from];
  for (let i = 0; i < queue.length; i++) {
    for (const n of open[queue[i]]) {
      if (dist[n] === undefined && !blocked(queue[i], n)) { dist[n] = dist[queue[i]] + 1; queue.push(n); }
    }
  }
  return dist;
}
// Called after every step: is your friend close? Then the treat hops away.
function maybeHop() {
  if (won || hopsLeft <= 0) return;
  const here = s0(trail);
  const dist = stepsFrom(here);
  if (dist[goal] === undefined || dist[goal] > 2) return;
  // where to: 3-5 steps away from your friend, not back along your trail, dead ends first
  const onTrail = new Set(trail);
  const ok = k => !isBridge(k) && k !== start && k !== goal && (hasKey || k !== keyCell) && !onTrail.has(k);
  let spots = Object.keys(dist).filter(k => dist[k] >= 3 && dist[k] <= 5 && ok(k));
  if (!spots.length) {   // (nothing there: the closest spots that are at least 3 steps away)
    const far = Object.keys(dist).filter(k => dist[k] >= 3 && ok(k));
    const near = Math.min(...far.map(k => dist[k]));
    spots = far.filter(k => dist[k] <= near + 1);
  }
  if (!spots.length) { hopsLeft = 0; return; }
  const ends = shuffle(spots.filter(k => open[k].length === 1));
  const to = ends.length ? ends[0] : shuffle(spots)[0];
  hopsLeft--;
  // a little white puff where it was, a giggle, and off it goes
  const [x, y] = center(goal);
  el('circle', { cx: x, cy: y, r: cell * 0.3, class: 'puff', 'stroke-width': cell * 0.04 });
  giggle();
  goal = to;
  place(goalEl, goal);
  goalEl.classList.remove('hopping'); void goalEl.getBoundingClientRect(); goalEl.classList.add('hopping');
  // last hop: once it has landed it stops wiggling and waits for you
  if (hopsLeft <= 0) { const g = goalEl; setTimeout(() => { if (g === goalEl) g.classList.remove('cheeky'); }, 650); }
  if (hintEl) { hintEl.remove(); hintEl = null; }
  light(goal);   // in a dark cave you can see where it went
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

// the shape and colors of the maze being played (your own maze: a big rounded square in the colors you picked)
const curShape = () => made ? MINE_SHAPE : SHAPES[level % SHAPES.length];
const curTheme = () => made ? THEMES[made.t] : themeFor(level);
function draw() {
  const shape = curShape();
  friend = friendFor(level);
  svg.innerHTML = '';
  el('path', { d: shape.d, class: 'shape', fill: made ? MINE_COLORS[made.t] : shape.color });

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
  const theme = curTheme();
  document.body.style.background = theme.page;
  document.body.classList.toggle('dark', theme.name === 'space' || theme.name === 'cave');
  el('path', { d, class: 'path-out', 'stroke-width': cell * 0.78 });
  el('path', { d, class: 'path-in', 'stroke-width': cell * 0.62, style: 'stroke:' + theme.path });

  // the trail goes under the bridges (so a walk through a tunnel hides under the bridge);
  // the bit of trail ON a bridge is drawn again on top of it (overTrailEl)
  trailEl = el('polyline', { class: 'trail', stroke: friend.trail, 'stroke-width': cell * 0.26 });
  bridges.forEach(drawBridge);
  overTrailEl = el('path', { class: 'trail', stroke: friend.trail, 'stroke-width': cell * 0.26 });

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

  goalEl = sprite('goal', friend.goal, goal);
  goalEl.classList.add(fogHoles ? 'glow' : 'x');
  if (hopsLeft > 0) goalEl.classList.add('cheeky');   // wiggles: "catch me!"
  heroEl = sprite('hero', friend.hero, start);
  heroEl.classList.add('wiggle-me'); // a little "pick me up" bounce until the first move
  lit = new Set();
  light(start);
}

// A little wooden bridge (Nov 22). Drawn as if the bridge goes left-right, then
// turned when it goes up-down. The path that crosses the other way runs under
// it: you see the dark tunnel mouths on both sides of the bridge.
function drawBridge(b) {
  const [x, y] = center(b.k), c = cell;
  const g = el('g', { class: 'bridge', transform: `translate(${x} ${y}) rotate(${b.vert ? 90 : 0})` });
  // tunnel mouths: dark half-circles where the under path goes in
  [-1, 1].forEach(s => el('path', {
    d: `M${-c * 0.31} ${s * c * 0.36} A${c * 0.31} ${c * 0.17} 0 0 ${s > 0 ? 0 : 1} ${c * 0.31} ${s * c * 0.36} Z`,
    fill: '#3b2f25', 'fill-opacity': 0.8 }, g));
  // the deck: wooden planks, a bit wider than the path
  el('rect', { x: -c * 0.52, y: -c * 0.36, width: c * 1.04, height: c * 0.72, fill: '#e9b872' }, g);
  [-0.3, -0.1, 0.1, 0.3].forEach(px => el('line', { x1: c * px, y1: -c * 0.34, x2: c * px, y2: c * 0.34,
    stroke: '#b9803f', 'stroke-width': c * 0.05, 'stroke-linecap': 'round' }, g));
  // railings along both sides, with round posts at the ends
  [-1, 1].forEach(s => {
    el('line', { x1: -c * 0.52, y1: s * c * 0.36, x2: c * 0.52, y2: s * c * 0.36, stroke: INK, 'stroke-width': c * 0.09 }, g);
    [-1, 1].forEach(e => el('circle', { cx: e * c * 0.4, cy: s * c * 0.36, r: c * 0.08, fill: '#c68b59', stroke: INK, 'stroke-width': c * 0.04 }, g));
  });
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
  // the steps onto / off a bridge, again on top of the bridge
  let d = '';
  for (let i = 1; i < trail.length; i++) {
    const a = trail[i - 1], b = trail[i];
    if (bridgeOver(a) || bridgeOver(b)) d += `M${center(a).join(' ')} L${center(b).join(' ')} `;
  }
  overTrailEl.setAttribute('d', d);
  // in a tunnel your friend is under the bridge: a bit see-through
  heroEl.classList.toggle('under', isUnder(s0(trail)));
}
const bridgeOver = k => bridges.some(b => b.k === k);

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
// A finger on a bridge cell means "over" or "under", whichever one you can walk to from `from`.
function resolve(from, k) {
  if (!open[from].includes(k) && open[k + ',u'] && open[from].includes(k + ',u')) return k + ',u';
  return k;
}

let lastPoint = null;

svg.addEventListener('pointerdown', (e) => {
  if (making) { makerDown(e); return; }   // (the Maze Maker digs instead)
  if (won) return;
  const p = pointAt(e);
  const k = cellAtPoint(p);
  const here = s0(trail);
  // Start dragging when the finger lands on (or right next to) the character.
  if (k && (k === cellOf(here) || open[here].includes(resolve(here, k)))) {
    dragging = true;
    lastPoint = p;
    svg.setPointerCapture(e.pointerId);
    step(k);
  }
});

svg.addEventListener('pointermove', (e) => {
  if (making) { makerMove(e); return; }
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

const stopDrag = () => { dragging = false; if (mkDrag) makerUp(); };
svg.addEventListener('pointerup', stopDrag);
svg.addEventListener('pointercancel', stopDrag);

// Move toward cell k if the paths allow it: straight to a neighbor, or around
// a corner when the finger cuts across it diagonally. Never through a wall.
function step(k) {
  const here = s0(trail);
  if (k === here || k === cellOf(here)) return;   // (in a tunnel the finger is on the bridge cell)
  k = resolve(here, k);
  let steps = null;
  if (open[here].includes(k)) {
    steps = [k];
  } else {
    const [x1, y1] = unkey(here), [x2, y2] = unkey(k);
    if (Math.abs(x1 - x2) === 1 && Math.abs(y1 - y2) === 1) {
      const corner = open[here].find(c => open[c].includes(resolve(c, k)));
      if (corner) steps = [corner, resolve(corner, k)];
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
  else maybeHop();
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
  svg.insertBefore(hintEl, goalEl);   // above the paths, bridges and the dark
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
    if (won || mapOpen() || mineOpen() || making) return;
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
  friendCall(friend, 0.65);   // and your friend cheers in its own voice
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
  // your own maze: the stars are just for fun (nothing is saved, no new friends); the arrow goes back to digging
  if (made) {
    winStars.innerHTML = [0, 1, 2].map(i => `<svg viewBox="0 0 48 48" class="${i < stars ? 'on' : ''}" style="animation-delay:${0.05 + i * 0.15}s"><path d="M24 4 L30 17 L44 18 L33 28 L37 43 L24 35 L11 43 L15 28 L4 18 L18 17 Z" fill="${i < stars ? '#ffd166' : '#e8e2d4'}" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/></svg>`).join('');
    setTimeout(() => { nextBtn.classList.add('show'); winStars.classList.add('show'); }, 600);
    return;
  }
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
nextBtn.addEventListener('click', () => { if (made) { openMaker(made.slot); return; } level++; saved.level = level; persist(); newMaze(); });
document.getElementById('shuffle').addEventListener('click', newMaze);
const hintBtn = document.getElementById('hint');
hintBtn.addEventListener('click', () => { showHint(); resetIdle(); });

// Dots button (on the map): Easy (1 dot) -> Normal (2) -> Challenge (3). Changes how big mazes get.
const DIFFS = ['easy', 'normal', 'challenge'];
function diffIcon() {
  const n = DIFFS.indexOf(saved.diff) + 1;
  return '<svg viewBox="0 0 48 48">' +
    [0, 1, 2].map(i => `<circle cx="${12 + i * 12}" cy="24" r="5" fill="${i < n ? '#ef476f' : '#e8e2d4'}" stroke="#2b2b2b" stroke-width="2.5"/>`).join('') + '</svg>';
}
function nextDiff() {
  saved.diff = DIFFS[(DIFFS.indexOf(saved.diff) + 1) % 3];
  persist(); newMaze();
  if (mapOpen()) openMap();
}

// Arrow keys move one step at a time.
addEventListener('keydown', (e) => {
  const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  if (making) { if (e.key === 'Escape') makerBack(); return; }   // (the Maze Maker: fingers only)
  if (e.key === 'Enter' && won && !mapOpen() && !mineOpen()) { nextBtn.click(); return; }
  if (mapOpen() || mineOpen()) return;   // (the map has its own keys: Escape = back)
  if (!dirs[e.key] || won) return;
  e.preventDefault();
  const [x, y] = unkey(s0(trail));
  const k = resolve(s0(trail), key(x + dirs[e.key][0], y + dirs[e.key][1]));
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
// ---------- Music (Nov 22: off until the note button is tapped) ----------
// A tiptoe-and-explore tune on a ukulele with a whistle on top. It's a song recipe like every
// game's (see the comment above `songs:` in arcade/shared.js); the Jukebox borrows it too.
const MAZE_SONG = { tempo: 104, root: 55, scale: 'major', prog: [[1, 6, 2, 5], [4, 5, 3, 6], [6, 4, 1, 5]], drums: 'shuffle', bass: 'walk', lead: 'uke', harmony: 'whistle', swing: 0.12, pad: true, arp: 'B', arpSound: 'marimba', seed: 2201,
  tune: { A: '1/2 3/2 5/4 3/4 5/2 r/2 | 6/2 8/2 10/4 8/4 6/2 r/2 | 4/2 6/2 9/4 6/4 4/2 r/2 | 5/4 7/4 2/4 r/4',
          B: '8/4 6/2 8/2 11/4 8/4 | 9/4 7/2 9/2 12/4 9/4 | 10/4 8/2 10/2 12/4 10/4 | 8/8 6/4 r/4',
          C: '3/8 6/8 | 4/8 6/8 | 5/8 3/8 | 2/4 5/4 7/8' } };
const music = window.Arcade && Arcade.pageMusic
  ? Arcade.pageMusic(document.getElementById('musicBtn'), MAZE_SONG, () => !!saved.music, (on) => { saved.music = on; persist(); })
  : null;
if (!music) document.getElementById('musicBtn').remove();
window.__pageMusic = () => ({ saved: !!saved.music, playing: music ? music.on() : false });
// in a dark cave the music sounds far away and a bit slower; outside it's bright again
function musicMood() { if (music) music.mood({ muffle: fogHoles ? 0.5 : 0, tempo: fogHoles ? 0.92 : 1 }); }

// the cheeky treat's "tee-hee!" (three quick high notes going up)
function giggle() { [1047, 1319, 1175, 1568].forEach((f, i) => tone(f, i * 0.07, 0.08, 0.06)); }
function jingle() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.35)); }
// each friend's own happy call (Nov 21, last run): a bee buzzes low, a mouse squeaks high, a frog goes "rib-bit"...
function friendCall(f, when = 0) { (f.call || []).forEach((n, i) => tone(n, when + i * 0.11, 0.14, 0.07)); }

// ---------- Start ----------
function newMaze() {
  made = null; document.body.classList.remove('playmine');
  won = false;
  dragging = false;
  nextBtn.classList.remove('show');
  winStars.classList.remove('show');
  if (hintEl) { hintEl.remove(); hintEl = null; }
  N = gridSize(level);
  cell = 100 / N;
  makeMaze(SHAPES[level % SHAPES.length]);
  placeExtras();
  hopsLeft = chaseHops();
  trail = [start];
  draw();
  drawTrail();
  resetIdle();
  musicMood();
}

// ---------- The map (Nov 19; drawn with Phaser + Rex UI since Nov 21) ----------
// A picture page: pick your friend, Easy/Normal/Challenge, and every maze so far
// as a stepping stone (its shape + stars). Tap a stone to play that maze again.
// It's a canvas menu "screen" (arcade/canvasmenu.js, like every game's menus):
//   tiles `buddy-mix` / `buddy-<friend>` (the dice = take turns), tiles `level-<i>`
//   (the stones; the maze you're on is yellow), buttons `back` and `diff` at the bottom.
const CM = window.ArcadeMenus || null;
const mapBtn = document.getElementById('mapBtn');
const LOCK = `<path d="M30 46 V34 C30 20 70 20 70 34 V46" fill="none" stroke="#2b2b2b" stroke-width="9"/><rect x="22" y="44" width="56" height="42" rx="9" fill="#ffd166" stroke="#2b2b2b" stroke-width="6"/><circle cx="50" cy="62" r="6" fill="#2b2b2b"/>`;
const DICE = `<rect x="14" y="14" width="72" height="72" rx="16" fill="#fff" stroke="#2b2b2b" stroke-width="6"/><g fill="#2b2b2b"><circle cx="32" cy="32" r="7"/><circle cx="68" cy="32" r="7"/><circle cx="50" cy="50" r="7"/><circle cx="32" cy="68" r="7"/><circle cx="68" cy="68" r="7"/></g>`;
const BACK = `<svg viewBox="0 0 48 48"><path d="M30 8 L14 24 L30 40" fill="none" stroke="#2b2b2b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
if (CM) CM.lockIcon = `<svg viewBox="0 0 100 100">${LOCK}</svg>`;   // (the padlock on locked tiles)
function starRow(n) {
  return [0, 1, 2].map(i => `<path transform="translate(${i * 34} 0)" d="M15 1 L19 10 L29 11 L21 18 L24 28 L15 23 L6 28 L9 18 L1 11 L11 10 Z" fill="${i < n ? '#ffd166' : '#e8e2d4'}" stroke="#2b2b2b" stroke-width="2.5" stroke-linejoin="round"/>`).join('');
}
// a friend's picture; a locked one is just a dark shape (a surprise!)
function buddyPic(f, ok) {
  return `<svg viewBox="-4 -4 108 108">${ok ? f.hero
    : `<filter id="dark"><feColorMatrix type="matrix" values="0 0 0 0 0.6  0 0 0 0 0.57  0 0 0 0 0.52  0 0 0 1 0"/></filter><g filter="url(#dark)">${f.hero}</g>`}</svg>`;
}
// a stepping stone: the maze's shape on its theme color, a lantern for a dark cave, its stars underneath
function stonePic(i) {
  const sh = SHAPES[i % SHAPES.length], th = themeFor(i);
  return `<svg viewBox="-10 -10 120 156"><rect x="-6" y="-6" width="112" height="112" rx="22" fill="${th.page}" stroke="#2b2b2b" stroke-width="5"/>`
    + `<g transform="translate(14 14) scale(0.72)"><path d="${sh.d}" fill="${sh.color}" stroke="#2b2b2b" stroke-width="7" stroke-linejoin="round"/></g>`
    + (th.dark ? `<path d="M72 10 Q80 -2 88 10" fill="none" stroke="#2b2b2b" stroke-width="4"/><rect x="69" y="9" width="22" height="28" rx="6" fill="#ffd166" stroke="#2b2b2b" stroke-width="4"/>` : '')
    + `<g transform="translate(1 112)">${starRow(saved.stars[i] || 0)}</g></svg>`;
}
const mapOpen = () => !!(CM && CM.isOpen && CM.screen() === 'maze-map');
function openMap() {
  if (!CM) return;
  clearTimeout(idleTimer);
  const pick = (id) => { saved.buddy = id; persist(); const f = FRIENDS.find(x => x.id === id); if (f) friendCall(f); else tone(880, 0, 0.12); openMap(); };
  const mixOn = saved.buddy === 'mix' || !unlocked().some(f => f.id === saved.buddy);
  const buddies = [{ pic: `<svg viewBox="0 0 100 100">${DICE}</svg>`, fill: true, attr: 'buddy-mix', picked: mixOn, onTap: () => pick('mix') }];
  for (const f of FRIENDS) {
    const ok = (saved.done || 0) >= f.need;
    buddies.push({ pic: buddyPic(f, ok), fill: ok, attr: 'buddy-' + f.id, locked: !ok, picked: ok && !mixOn && saved.buddy === f.id,
      onTap: (o) => { if (ok) pick(f.id); else { CM.wiggle(o); tone(220, 0, 0.12, 0.05); } } });   // (locked: a "not yet" wobble)
  }
  const stones = [];
  for (let i = 0; i <= saved.top; i++) {
    stones.push({ pic: stonePic(i), attr: 'level-' + i, picked: i === level, fill: true,
      onTap: () => { level = i; saved.level = i; persist(); closeMap(); newMaze(); } });
  }
  CM.open({
    id: 'maze-map',
    rows: [
      { t: 'tiles', items: buddies, w: 104, h: 104 },
      { t: 'tiles', items: stones, w: 108, h: 138 },
    ],
    footer: { t: 'buttons', items: [
      { icon: BACK, label: '', color: 'big', attr: 'back', minW: 110, onTap: backFromMap },
      { icon: diffIcon(), label: '', attr: 'diff', minW: 110, onTap: nextDiff },
      { icon: PENCIL_BTN, label: '', attr: 'make', minW: 110, onTap: openMine },   // My mazes (the Maze Maker)
    ] },
    scrollTo: 'level-' + level,                       // (opens at the maze you're on)
    onKey: (code) => { if (code === 'Escape') backFromMap(); },
  });
}
// My mazes (the Maze Maker, Nov 22): the pencil on the map opens 3 big tiles, a picture of each
// maze you made; an empty one has a big plus. Tap one to make (or change) that maze.
const PENCIL_BTN = `<svg viewBox="0 0 48 48"><path d="M10 38 L13 28 L32 9 L39 16 L20 35 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/><path d="M28 13 L35 20" stroke="#2b2b2b" stroke-width="3.5"/><path d="M10 38 L13 28 L20 35 Z" fill="#f4c99b" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/></svg>`;
const mineOpen = () => !!(CM && CM.isOpen && CM.screen() === 'maze-mine');
function openMine() {
  if (!CM) return;
  clearTimeout(idleTimer);
  tone(660, 0, 0.1, 0.05);
  const mine = [0, 1, 2].map(i => ({ pic: mineThumb(saved.made[i]), fill: true, attr: 'made-' + i,
    onTap: () => { CM.close(); openMaker(i); } }));
  CM.open({
    id: 'maze-mine',
    rows: [{ t: 'tiles', items: mine, w: 200, h: 200 }],
    footer: { t: 'buttons', items: [{ icon: BACK, label: '', color: 'big', attr: 'back', minW: 110, onTap: openMap }] },
    onKey: (code) => { if (code === 'Escape') openMap(); },
  });
}
function closeMap() { if (mapOpen()) CM.close(); if (!won) resetIdle(); }
mapBtn.addEventListener('click', openMap);
// back to the maze; a new friend picked = a fresh maze with them in it
function backFromMap() {
  closeMap();
  if (friendFor(level).id !== friend.id) newMaze();
}


// ---------- The Maze Maker (Nov 22) ----------
// Make your own maze! The map has 3 "My mazes" tiles. Tapping one opens the maker:
// a grid of little dots. Drag your finger from dot to dot to DIG a path (the
// shovel), or rub paths away again (the eraser). Then put your friend and its
// treat where you like (tap the button, then a dot) and hide some gems.
// The green play button lights up as soon as the friend can reach the treat.
// Other buttons: back (to the map), undo, the dice (a surprise maze to change),
// the paint pot (the colors) and the bin (start again).
// A made maze is saved in saved.made[slot] = { n, p: ['x,y|x,y', ...], s, g, gems, t }
// (n = grid size, p = the passages dug, s = start, g = the treat, t = the colors).
// Playing it doesn't count for stars, friends or medals: it's just for fun.
const MINE_SHAPE = { name: 'mine', d: 'M8 -2 H92 C98 -2 102 2 102 8 V92 C102 98 98 102 92 102 H8 C2 102 -2 98 -2 92 V8 C-2 2 2 -2 8 -2 Z' };
const MINE_COLORS = ['#b9fbc0', '#8ecae6', '#cdb4db', '#ffafcc'];   // the board's color for each of the first 4 THEMES
const MAX_GEMS = 6;
let mk = null;        // the maze being made: { slot, n, links: Set('a|b'), s, g, gems: [], t }
let mkDrag = null;    // the dot under the digging finger
let mkUndo = [];      // snapshots for the undo button
let tool = 'dig';     // dig / erase / friend / treat / gem
const mkSize = () => LITTLE ? 5 : saved.diff === 'challenge' ? 7 : 6;   // little kids: big dots
const link = (a, b) => a < b ? a + '|' + b : b + '|' + a;

function mkEmpty(slot) {
  const n = mkSize();
  return { slot, n, links: new Set(), s: key(0, 0), g: key(n - 1, n - 1), gems: [], t: 0 };
}
function mkLoad(slot) {
  const d = saved.made[slot];
  if (!d || !d.n) return mkEmpty(slot);
  return { slot, n: d.n, links: new Set(d.p || []), s: d.s, g: d.g, gems: (d.gems || []).slice(), t: d.t || 0 };
}
const mkData = m => ({ n: m.n, p: [...m.links], s: m.s, g: m.g, gems: m.gems.slice(), t: m.t });
function mkSave() {
  saved.made[mk.slot] = mkData(mk);
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(saved)); } catch (e) { /* skip */ }
}
// the passages as the game's `open` lists (only dots that have a path)
function mkOpen(m) {
  const o = {};
  for (const l of m.links) {
    const [a, b] = l.split('|');
    (o[a] = o[a] || []).push(b); (o[b] = o[b] || []).push(a);
  }
  return o;
}
// can the friend walk to its treat?
function mkCanPlay(m = mk) {
  if (m.s === m.g) return false;
  const o = mkOpen(m), seen = new Set([m.s]), queue = [m.s];
  for (let i = 0; i < queue.length; i++) {
    if (queue[i] === m.g) return true;
    for (const n of o[queue[i]] || []) if (!seen.has(n)) { seen.add(n); queue.push(n); }
  }
  return false;
}

// Open the maker on slot 0-2
function openMaker(slot) {
  if (mapOpen() || mineOpen()) CM.close();
  clearTimeout(idleTimer); clearTimeout(resetIdle.again);
  if (hintEl) { hintEl.remove(); hintEl = null; }
  making = true; won = false; dragging = false; mkDrag = null; mkUndo = []; tool = 'dig';
  nextBtn.classList.remove('show'); winStars.classList.remove('show');
  document.body.classList.remove('playmine');
  document.body.classList.add('making');
  mk = mkLoad(slot);
  friend = friendFor(level);
  makerBar();
  drawMaker();
}
function makerBack() {
  making = false; mk = null;
  document.body.classList.remove('making');
  newMaze();
  openMine();
}

// The board: the rounded square, a dot for every spot, the dug paths, the gems, your friend and its treat
function drawMaker() {
  N = mk.n; cell = 100 / N;
  const th = THEMES[mk.t];
  svg.innerHTML = '';
  document.body.style.background = th.page;
  document.body.classList.toggle('dark', th.name === 'space');
  el('path', { d: MINE_SHAPE.d, class: 'shape', fill: MINE_COLORS[mk.t] });
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const [cx, cy] = center(key(x, y));
    el('circle', { cx, cy, r: cell * 0.13, class: 'spot', 'stroke-width': cell * 0.03 });
  }
  let d = '';
  for (const l of mk.links) {
    const [a, b] = l.split('|');
    d += `M${center(a).join(' ')} L${center(b).join(' ')} `;
  }
  if (d) {
    el('path', { d, class: 'path-out', 'stroke-width': cell * 0.78 });
    el('path', { d, class: 'path-in', 'stroke-width': cell * 0.62, style: 'stroke:' + th.path });
  }
  mk.gems.forEach((k, i) => sprite('gem' + i, GEM_ART, k, 0.6));
  goalEl = sprite('goal', friend.goal, mk.g);
  heroEl = sprite('hero', friend.hero, mk.s);
  if (tool === 'friend') heroEl.classList.add('wiggle-me');   // "where shall I go?"
  if (tool === 'treat') goalEl.classList.add('cheeky');
  const ok = mkCanPlay();
  const play = document.getElementById('mk-play');
  if (play) { play.classList.toggle('dim', !ok); play.classList.toggle('ready', ok); }
}

// The buttons (two rows: the tools, then the rest)
const MK_ICONS = {
  dig: `<path d="M36 6 L44 14" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M40 10 L22 28" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M40 10 L22 28" stroke="#c68b59" stroke-width="3.5" stroke-linecap="round"/><path d="M19 19 L29 29 L17 43 C13 47 4 45 3 45 C3 44 1 35 5 31 Z" fill="#c9d6df" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`,
  erase: `<path d="M8 30 L26 12 L40 26 L26 40 H16 Z" fill="#ffafcc" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M16 22 L30 36" stroke="${INK}" stroke-width="3.5"/><path d="M16 22 L8 30 L16 40 H26 L30 36 Z" fill="#fff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`,
  gem: `<g transform="translate(2 2) scale(0.44)">${GEM_ART}</g>`,
  back: `<path d="M30 8 L14 24 L30 40" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
  undo: `<path d="M16 18 H30 C38 18 42 24 42 30 C42 36 38 40 30 40 H18" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M20 8 L10 18 L20 28" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
  dice: `<g transform="scale(0.48)">${DICE}</g>`,
  clear: `<path d="M10 14 H38 M19 14 V9 H29 V14" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 14 L15 42 H33 L35 14 Z" fill="#c9d6df" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M20 21 V35 M28 21 V35" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  play: `<path d="M16 9 L39 24 L16 39 Z" fill="#fff" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>`,
};
const paintIcon = t => `<path d="M24 5 C12 5 5 13 5 23 C5 33 13 42 22 42 C27 42 27 37 25 34 C23 31 26 28 30 29 C38 31 43 27 43 21 C43 12 35 5 24 5 Z" fill="#fff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`
  + MINE_COLORS.map((c, i) => `<circle cx="${[15, 23, 33, 14][i]}" cy="${[16, 12, 15, 28][i]}" r="${i === t ? 5.5 : 4}" fill="${c}" stroke="${INK}" stroke-width="${i === t ? 3 : 2}"/>`).join('');
const pic100 = art => `<svg viewBox="-4 -4 108 108" aria-hidden="true">${art}</svg>`;
function makerBar() {
  const btn = (id, label, art, onTap) => {
    const b = document.createElement('button');
    b.className = 'round-btn'; b.id = 'mk-' + id; b.setAttribute('aria-label', label);
    b.innerHTML = art.startsWith('<svg') ? art : `<svg viewBox="0 0 48 48" aria-hidden="true">${art}</svg>`;
    b.addEventListener('click', onTap);
    return b;
  };
  const pickTool = t => () => { tool = t; tone(660, 0, 0.08, 0.05); makerBar(); drawMaker(); };
  const tools = document.getElementById('mkTools'), acts = document.getElementById('mkActions');
  tools.innerHTML = acts.innerHTML = '';
  [btn('dig', 'Dig a path', MK_ICONS.dig, pickTool('dig')),
   btn('erase', 'Rub out a path', MK_ICONS.erase, pickTool('erase')),
   btn('friend', 'Where your friend starts', pic100(friend.hero), pickTool('friend')),
   btn('treat', 'Where the treat goes', pic100(friend.goal), pickTool('treat')),
   btn('gem', 'Hide a gem', MK_ICONS.gem, pickTool('gem')),
  ].forEach(b => { b.classList.toggle('on', b.id === 'mk-' + tool); tools.appendChild(b); });
  [btn('back', 'Back to the map', MK_ICONS.back, makerBack),
   btn('undo', 'Undo', MK_ICONS.undo, makerUndo),
   btn('dice', 'A surprise maze', MK_ICONS.dice, makerDice),
   btn('paint', 'Colors', paintIcon(mk.t), makerPaint),
   btn('clear', 'Start again', MK_ICONS.clear, makerClear),
   btn('play', 'Play my maze', MK_ICONS.play, playMine),
  ].forEach(b => acts.appendChild(b));
  if (mkUndo.length === 0) acts.querySelector('#mk-undo').classList.add('dim');
}

// remember how it was (for undo), then change something
function mkSnap() {
  mkUndo.push(JSON.stringify(mkData(mk)));
  if (mkUndo.length > 40) mkUndo.shift();
  const u = document.getElementById('mk-undo'); if (u) u.classList.remove('dim');
}
function mkChanged() { mkSave(); drawMaker(); }
function makerUndo() {
  if (!mkUndo.length) { wiggleBtn('mk-undo'); return; }
  const d = JSON.parse(mkUndo.pop());
  mk = { slot: mk.slot, n: d.n, links: new Set(d.p), s: d.s, g: d.g, gems: d.gems, t: d.t };
  tone(520, 0, 0.08, 0.05); tone(392, 0.07, 0.1, 0.05);
  mkChanged(); makerBar();
}
function makerClear() {
  mkSnap();
  const t = mk.t;
  mk = mkEmpty(mk.slot); mk.t = t;
  [392, 330, 262].forEach((f, i) => tone(f, i * 0.07, 0.1, 0.05));
  mkChanged();
}
function makerPaint() {
  mkSnap();
  mk.t = (mk.t + 1) % MINE_COLORS.length;
  tone(784, 0, 0.1, 0.05);
  mkChanged(); makerBar();
}
// The dice: a whole new maze to play or change (every dot is used; friend and treat far apart; 2 gems in dead ends)
function makerDice() {
  mkSnap();
  const n = mk.n, all = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) all.push(key(x, y));
  const inGrid = k => { const [x, y] = unkey(k); return x >= 0 && y >= 0 && x < n && y < n; };
  const links = new Set(), seen = new Set([all[0]]), stack = [all[0]];
  while (stack.length) {
    const [x, y] = unkey(stack[stack.length - 1]);
    const next = shuffle([key(x + 1, y), key(x - 1, y), key(x, y + 1), key(x, y - 1)]).find(k => inGrid(k) && !seen.has(k));
    if (!next) { stack.pop(); continue; }
    links.add(link(key(x, y), next)); seen.add(next); stack.push(next);
  }
  mk.links = links;
  const save = open; open = mkOpen(mk);           // (farthestFrom walks `open`)
  mk.s = farthestFrom(all[0]); mk.g = farthestFrom(mk.s);
  mk.gems = shuffle(all.filter(k => k !== mk.s && k !== mk.g && open[k].length === 1)).slice(0, 2);
  open = save;
  [523, 659, 587, 784].forEach((f, i) => tone(f, i * 0.06, 0.1, 0.05));
  mkChanged();
}
function wiggleBtn(id) {
  const b = document.getElementById(id); if (!b) return;
  b.classList.remove('mk-wiggle'); void b.offsetWidth; b.classList.add('mk-wiggle');
  tone(220, 0, 0.12, 0.05);
}

// Fingers on the board
function mkCellAt(p) {
  const x = Math.floor(p.x / cell), y = Math.floor(p.y / cell);
  return x >= 0 && y >= 0 && x < N && y < N ? key(x, y) : null;
}
function makerDown(e) {
  const p = pointAt(e), k = mkCellAt(p);
  if (!k) return;
  if (tool === 'dig' || tool === 'erase') {
    mkSnap();
    mkDrag = k; lastPoint = p;
    try { svg.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
    return;
  }
  mkSnap();
  if (tool === 'friend' || tool === 'treat') {
    const other = tool === 'friend' ? mk.g : mk.s;
    if (k === other) { mkUndo.pop(); wiggleBtn('mk-' + tool); return; }
    mk[tool === 'friend' ? 's' : 'g'] = k;
    mk.gems = mk.gems.filter(g => g !== k);
    if (tool === 'friend') friendCall(friend); else [784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.15, 0.06));
    tool = 'dig'; makerBar();                 // (back to digging by itself)
  } else if (tool === 'gem') {
    if (k === mk.s || k === mk.g) { mkUndo.pop(); wiggleBtn('mk-gem'); return; }
    if (mk.gems.includes(k)) { mk.gems = mk.gems.filter(g => g !== k); tone(600, 0, 0.1, 0.05); }
    else if (mk.gems.length < MAX_GEMS) { mk.gems.push(k); tone(1175, 0, 0.12, 0.08); tone(1568, 0.08, 0.2, 0.08); }
    else { mkUndo.pop(); wiggleBtn('mk-gem'); return; }
  }
  mkChanged();
}
// dig (or rub out) between two neighbor dots
function mkDig(a, b) {
  const l = link(a, b);
  if (tool === 'dig' && !mk.links.has(l)) { mk.links.add(l); tone(300 + Math.random() * 80, 0, 0.06, 0.05); return true; }
  if (tool === 'erase' && mk.links.has(l)) { mk.links.delete(l); tone(200, 0, 0.06, 0.05); return true; }
  return false;
}
function makerMove(e) {
  if (!mkDrag) return;
  const p = pointAt(e);
  const dist = Math.hypot(p.x - lastPoint.x, p.y - lastPoint.y);
  const steps = Math.max(1, Math.ceil(dist / (cell / 4)));
  let changed = false;
  for (let i = 1; i <= steps; i++) {
    const k = mkCellAt({ x: lastPoint.x + (p.x - lastPoint.x) * i / steps, y: lastPoint.y + (p.y - lastPoint.y) * i / steps });
    if (!k || k === mkDrag) continue;
    const [x1, y1] = unkey(mkDrag), [x2, y2] = unkey(k);
    const dx = Math.abs(x1 - x2), dy = Math.abs(y1 - y2);
    if (dx + dy === 1) changed = mkDig(mkDrag, k) || changed;
    else if (dx === 1 && dy === 1) {           // cut across a corner: dig round it
      const c = key(x2, y1);
      changed = mkDig(mkDrag, c) || changed; changed = mkDig(c, k) || changed;
    } else { mkDrag = k; continue; }           // (a big jump: start again from here)
    mkDrag = k;
  }
  lastPoint = p;
  if (changed) mkChanged();
}

// finger up: a drag that didn't dig anything doesn't need an undo step
function makerUp() {
  mkDrag = null;
  if (mkUndo.length && mkUndo[mkUndo.length - 1] === JSON.stringify(mkData(mk))) {
    mkUndo.pop();
    const u = document.getElementById('mk-undo'); if (u && !mkUndo.length) u.classList.add('dim');
  }
}

// Play it! (the green button lights up once the friend can reach the treat)
function playMine() {
  if (!mkCanPlay()) {
    wiggleBtn('mk-play');
    // show where the friend and the treat are
    [heroEl, goalEl].forEach(g => { g.classList.remove('wiggle-me'); void g.getBoundingClientRect(); g.classList.add('wiggle-me'); });
    return;
  }
  making = false;
  document.body.classList.remove('making');
  document.body.classList.add('playmine');
  made = { slot: mk.slot, t: mk.t };
  won = false; dragging = false;
  nextBtn.classList.remove('show'); winStars.classList.remove('show');
  N = mk.n; cell = 100 / N;
  open = mkOpen(mk);
  bridges = []; door = null; keyCell = null; hasKey = false; hopsLeft = 0;
  start = mk.s; goal = mk.g;
  gems = mk.gems.filter(k => open[k]).map(k => ({ k, got: false, el: null }));
  trail = [start];
  draw(); drawTrail(); resetIdle(); musicMood();
  jingle();
}
document.getElementById('editBtn').addEventListener('click', () => openMaker(made ? made.slot : 0));

// The picture on a "My mazes" tile: the maze, your friend and its treat; empty = a big plus and a pencil
function mineThumb(d) {
  const PENCIL = `<g transform="translate(66 66) scale(0.7)"><circle cx="24" cy="24" r="26" fill="#fff" stroke="${INK}" stroke-width="4"/><path d="M10 38 L13 28 L32 9 L39 16 L20 35 Z" fill="#ffd166" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/></g>`;
  if (!d || !d.n || !(d.p || []).length) {
    return `<svg viewBox="-6 -6 112 112"><rect x="-2" y="-2" width="104" height="104" rx="18" fill="#fff" stroke="${INK}" stroke-width="5" stroke-dasharray="10 8"/>`
      + `<path d="M50 24 V76 M24 50 H76" stroke="${INK}" stroke-width="22" stroke-linecap="round"/>`
      + `<path d="M50 24 V76 M24 50 H76" stroke="#06d6a0" stroke-width="12" stroke-linecap="round"/>`
      + '</svg>';
  }
  const c = 100 / d.n, mid = k => k.split(',').map(v => (+v + 0.5) * c);
  const path = (d.p || []).map(l => { const [a, b] = l.split('|'); return `M${mid(a).join(' ')} L${mid(b).join(' ')}`; }).join(' ');
  const th = THEMES[d.t || 0];
  const f = friendFor(level);
  const icon = (art, k, s) => { const [x, y] = mid(k); return `<g transform="translate(${x - s / 2} ${y - s / 2}) scale(${s / 100})">${art}</g>`; };
  return `<svg viewBox="-6 -6 112 112"><path d="${MINE_SHAPE.d}" fill="${MINE_COLORS[d.t || 0]}" stroke="${INK}" stroke-width="4"/>`
    + `<path d="${path}" fill="none" stroke="${INK}" stroke-width="${c * 0.78}" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="${path}" fill="none" stroke="${th.path}" stroke-width="${c * 0.62}" stroke-linecap="round" stroke-linejoin="round"/>`
    + icon(f.goal, d.g, c * 1.1) + icon(f.hero, d.s, c * 1.1) + PENCIL + '</svg>';
}

// ---------- Test hooks (tests/test_maze.py) ----------
window.__mazeState = () => ({
  level, top: saved.top, N, cells: Object.keys(open).length, start, goal, here: s0(trail), won,
  door: door ? [door.a, door.b] : null, keyCell, hasKey, gems: gems.map(g => ({ k: g.k, got: g.got })),
  friend: friend.id, buddy: saved.buddy, unlocked: unlocked().map(f => f.id), shape: curShape().name,
  theme: curTheme().name, mine: made ? made.slot : null, making, dark: !!fogHoles, lit: lit ? lit.size : 0, done: saved.done, stars: saved.stars,
  hint: !!(hintEl && hintEl.isConnected), diff: saved.diff, little: LITTLE, map: mapOpen(),
  bridges: bridges.map(b => ({ k: b.k, vert: b.vert, over: b.over, under: b.under })), under: isUnder(s0(trail)),
  chase: isChase(level), hopsLeft,
});
// route(a, b) = the cells from a to b along the paths; step(k) = walk one cell (like a finger)
window.__mazeTest = { route: (a, b) => route(a, b), step: k => step(k), open: () => open, idle: () => IDLE_MS };
// the Maze Maker: what's being made, and where a dot is on the screen (for real finger drags)
window.__mazeMaker = {
  state: () => mk ? Object.assign(mkData(mk), { slot: mk.slot, tool, canPlay: mkCanPlay(), undo: mkUndo.length, making }) : null,
  spot: (k) => { const [x, y] = center(k); const m = svg.getScreenCTM(); return [m.a * x + m.e, m.d * y + m.f]; },
  saved: () => saved.made,
};

newMaze();
