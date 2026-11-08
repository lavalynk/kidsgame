// Coloring game logic.
//
// Two screens: the PICKER (a grid of little pictures with picture tabs:
// Animals, Fruit & veggies, Things, and My pictures = the gallery) and the
// COLORING screen.
//
// On the coloring screen there are four tools:
//   * Fill    - tap a part of the picture to fill it with the crayon color
//   * Brush   - draw freely on top (three sizes)
//   * Eraser  - rub out brush lines and stickers, or tap a part to make it white
//   * Stickers- tap to place a sticker (three sizes)
// Undo / redo work for every tool. Every picture is saved on this device as
// you color, and the heart-frame button saves a copy into "My pictures".
//
// The address bar remembers which picture is open (coloring/index.html#tiger),
// so the phone's back button goes from a picture back to the picker.

// ---------- Colors ----------
// Two preset boxes of crayons. The swap button switches between them;
// the "+" button lets you pick any color (kept in "custom").
const PALETTES = [
  ['#ef476f', '#ff8c42', '#ffd166', '#06d6a0', '#2a9d8f', '#118ab2',
   '#9b5de5', '#f15bb5', '#8d5524', '#7a7a7a', '#2b2b2b', '#ffffff'],
  ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff',
   '#bdb2ff', '#ffc6ff', '#e9c46a', '#f4a261', '#90be6d', '#fffffc'],
];

// Brush widths and sticker sizes for the three size buttons (in picture units; the picture is 400 x 400)
const BRUSH_SIZES = [8, 18, 34];
const STICKER_SIZES = [0.45, 0.75, 1.1];

// Stickers: little drawings in a 100 x 100 box (centered on where you tap).
const INKS = 'stroke="#2b2b2b" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"';
const STICKERS = {
  star:    `<path d="M50 6 L62 36 L94 38 L69 58 L77 90 L50 72 L23 90 L31 58 L6 38 L38 36 Z" fill="#ffd166" ${INKS}/>`,
  heart:   `<path d="M50 88 C10 62 6 34 26 22 C38 15 48 22 50 30 C52 22 62 15 74 22 C94 34 90 62 50 88 Z" fill="#ef476f" ${INKS}/><ellipse cx="32" cy="36" rx="7" ry="10" fill="#fff" opacity="0.7"/>`,
  flower:  `<g fill="#f15bb5" ${INKS}><circle cx="50" cy="24" r="17"/><circle cx="76" cy="44" r="17"/><circle cx="66" cy="74" r="17"/><circle cx="34" cy="74" r="17"/><circle cx="24" cy="44" r="17"/></g><circle cx="50" cy="52" r="16" fill="#ffd166" ${INKS}/>`,
  rainbow: `<path d="M8 80 A42 42 0 0 1 92 80" fill="none" stroke="#2b2b2b" stroke-width="30"/><path d="M8 80 A42 42 0 0 1 92 80" fill="none" stroke="#ef476f" stroke-width="22"/><path d="M8 80 A42 42 0 0 1 92 80" fill="none" stroke="#ffd166" stroke-width="12" transform="translate(9 9) scale(0.82)"/><path d="M8 80 A42 42 0 0 1 92 80" fill="none" stroke="#06d6a0" stroke-width="12" transform="translate(17 17) scale(0.66)"/><path d="M8 80 A42 42 0 0 1 92 80" fill="none" stroke="#118ab2" stroke-width="12" transform="translate(25 25) scale(0.5)"/>`,
  balloon: `<path d="M50 70 Q46 82 54 96" fill="none" stroke="#2b2b2b" stroke-width="3"/><ellipse cx="50" cy="38" rx="28" ry="34" fill="#9b5de5" ${INKS}/><path d="M44 72 L56 72 L50 66 Z" fill="#9b5de5" ${INKS}/><ellipse cx="40" cy="26" rx="6" ry="10" fill="#fff" opacity="0.7"/>`,
  smile:   `<circle cx="50" cy="50" r="40" fill="#ffd166" ${INKS}/><circle cx="36" cy="42" r="6" fill="#2b2b2b"/><circle cx="64" cy="42" r="6" fill="#2b2b2b"/><path d="M32 60 Q50 78 68 60" fill="none" ${INKS}/><ellipse cx="26" cy="58" rx="7" ry="4" fill="#f15bb5"/><ellipse cx="74" cy="58" rx="7" ry="4" fill="#f15bb5"/>`,
  crown:   `<path d="M12 78 L16 30 L34 52 L50 22 L66 52 L84 30 L88 78 Z" fill="#ffc93c" ${INKS}/><circle cx="50" cy="64" r="7" fill="#ef476f" stroke="#2b2b2b" stroke-width="3"/>`,
  sparkle: `<path d="M50 4 Q56 44 96 50 Q56 56 50 96 Q44 56 4 50 Q44 44 50 4 Z" fill="#9bf6ff" ${INKS}/>`,
  paw:     `<ellipse cx="50" cy="66" rx="24" ry="20" fill="#8d5524" ${INKS}/><g fill="#8d5524" ${INKS}><circle cx="22" cy="42" r="10"/><circle cx="40" cy="26" r="10"/><circle cx="60" cy="26" r="10"/><circle cx="78" cy="42" r="10"/></g>`,
  cloud:   `<path d="M20 70 C6 70 6 50 20 48 C20 30 42 26 50 38 C58 22 84 28 80 48 C96 48 96 70 80 70 Z" fill="#fff" ${INKS}/>`,
};

// ---------- Saving (on this device only) ----------
// each player has their own coloring saves (see Arcade.profiles in arcade/shared.js)
const SAVE_KEY = window.Arcade ? Arcade.profiles.key('kidsColoring.v1') : 'kidsColoring.v1';
let saved = { pages: {}, gallery: [], custom: [], palette: 0 };
try { saved = Object.assign(saved, JSON.parse(localStorage.getItem(SAVE_KEY)) || {}); } catch (e) { /* no saving available */ }
let saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(saved)); } catch (e) { /* full or private: just skip */ }
  }, 250);
}
// Tell the arcade home screen how many pictures are in the gallery (a star each).
function reportToArcade() {
  if (!window.Arcade) return;
  const rec = Arcade.store.game('coloring');
  rec.levels = {};
  saved.gallery.forEach(art => { rec.levels[art.id] = { stars: 1, done: true }; });
  Arcade.store.save();
  if (Arcade.stickers) Arcade.stickers.check();     // pictures earn stickers for the sticker book
}

// ---------- Elements ----------
const picture = document.getElementById('picture');
const palette = document.getElementById('palette');
const stickerTray = document.getElementById('stickers');
const grid = document.getElementById('grid');
const sizesBox = document.getElementById('sizes');
const toastEl = document.getElementById('toast');
const NS = 'http://www.w3.org/2000/svg';

let currentColor = PALETTES[0][0];
let tool = 'fill';
let sizeIdx = 1;
let currentSticker = 'star';
let pageIndex = 0;          // position in the current tab's list
let currentGroup = 'animals';
let cameFromPicker = false; // did we open this picture by tapping a thumbnail?
let shownId = null;         // id of the picture on the coloring screen
let galleryArt = null;      // when a gallery picture is open: which one

// Undo / redo: every change is a little object with undo() and redo().
let undoSteps = [], redoSteps = [];
function did(step) { undoSteps.push(step); redoSteps = []; remember(); }

// Which tab a page belongs to (hand-drawn pages say it themselves).
function groupOf(page) { return page.group || 'animals'; }
// Pages in a tab, in A-Z order (by id, so it never depends on words).
function pagesIn(group) {
  return PAGES.filter(p => groupOf(p) === group).sort((a, b) => a.id.localeCompare(b.id));
}

// ---------- Crayons ----------
function buildPalette() {
  palette.innerHTML = '';
  const colors = PALETTES[saved.palette || 0].concat(saved.custom || []);
  colors.forEach(color => {
    const btn = document.createElement('button');
    btn.className = 'crayon' + (color === currentColor ? ' selected' : '');
    btn.style.background = color;
    btn.setAttribute('aria-label', 'Color');
    btn.addEventListener('click', () => pickColor(color));
    palette.appendChild(btn);
  });
  // swap crayon box
  const swap = document.createElement('button');
  swap.className = 'crayon special';
  swap.setAttribute('aria-label', 'Other crayons');
  swap.innerHTML = `<svg viewBox="0 0 48 48"><circle cx="18" cy="20" r="11" fill="${PALETTES[1][5]}" stroke="#2b2b2b" stroke-width="3.5"/><circle cx="30" cy="30" r="11" fill="${PALETTES[0][0]}" stroke="#2b2b2b" stroke-width="3.5"/></svg>`;
  swap.addEventListener('click', () => { saved.palette = saved.palette ? 0 : 1; persist(); buildPalette(); });
  palette.appendChild(swap);
  // any color you like
  const plus = document.createElement('button');
  plus.className = 'crayon special';
  plus.setAttribute('aria-label', 'Pick any color');
  plus.innerHTML = `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="16" fill="none" stroke="url(#rb)" stroke-width="8"/><defs><linearGradient id="rb"><stop offset="0" stop-color="#ef476f"/><stop offset=".5" stop-color="#ffd166"/><stop offset="1" stop-color="#118ab2"/></linearGradient></defs><path d="M24 17 V31 M17 24 H31" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/></svg>`;
  plus.addEventListener('click', () => { const inp = document.getElementById('customColor'); inp.value = currentColor.length === 7 ? currentColor : '#ef476f'; inp.click(); });
  palette.appendChild(plus);
}
document.getElementById('customColor').addEventListener('change', (e) => {
  const c = e.target.value;
  saved.custom = (saved.custom || []).filter(x => x !== c);
  saved.custom.push(c);
  if (saved.custom.length > 6) saved.custom.shift();   // keep the last six
  persist();
  pickColor(c);
});
function pickColor(color) {
  currentColor = color;
  document.body.style.setProperty('--cur', color);
  if (tool === 'eraser' || tool === 'sticker') setTool('fill');
  buildPalette();
}

// ---------- Stickers tray ----------
function stickerSVG(k, extra = '') { return `<svg viewBox="0 0 100 100" ${extra}>${STICKERS[k]}</svg>`; }
Object.keys(STICKERS).forEach(k => {
  const b = document.createElement('button');
  b.className = 'sticker-btn' + (k === currentSticker ? ' selected' : '');
  b.setAttribute('aria-label', k + ' sticker');
  b.innerHTML = stickerSVG(k);
  b.addEventListener('click', () => {
    currentSticker = k;
    stickerTray.querySelectorAll('.sticker-btn').forEach(x => x.classList.toggle('selected', x === b));
  });
  stickerTray.appendChild(b);
});

// ---------- Tools ----------
function setTool(t) {
  tool = t;
  document.querySelectorAll('.tool').forEach(b => b.classList.toggle('selected', b.dataset.tool === t));
  sizesBox.hidden = t === 'fill';
  palette.hidden = t === 'sticker';
  stickerTray.hidden = t !== 'sticker';
}
document.querySelectorAll('.tool').forEach(b => b.addEventListener('click', () => setTool(b.dataset.tool)));
document.querySelectorAll('.size').forEach(b => b.addEventListener('click', () => {
  sizeIdx = +b.dataset.size;
  document.querySelectorAll('.size').forEach(x => x.classList.toggle('selected', x === b));
}));

// ---------- A picture's state: fills + brush lines + stickers ----------
// state = { fills: ['#ef476f', '', ...one per region], strokes: [{d, c, w}], stickers: [{k, x, y, s}] }
function regions(svgEl = picture) { return Array.from(svgEl.querySelectorAll('.region')); }
function layer(svgEl) {
  let g = svgEl.querySelector('g.art-layer');
  if (!g) { g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'art-layer'); svgEl.appendChild(g); }
  return g;
}
function makeStroke(s) {
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('class', 'stroke');
  p.setAttribute('d', s.d);
  p.setAttribute('stroke', s.c);
  p.setAttribute('stroke-width', s.w);
  p.__data = s;
  return p;
}
function makeSticker(st) {
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'sticker');
  g.setAttribute('transform', `translate(${st.x} ${st.y}) scale(${st.s}) translate(-50 -50)`);
  g.innerHTML = STICKERS[st.k] || '';
  g.__data = st;
  return g;
}
function readState(svgEl = picture) {
  const st = { fills: regions(svgEl).map(r => r.style.fill || ''), strokes: [], stickers: [] };
  layer(svgEl).childNodes.forEach(el => {
    if (el.classList.contains('stroke')) st.strokes.push(el.__data);
    else if (el.classList.contains('sticker')) st.stickers.push(el.__data);
  });
  // keep the drawing order of strokes and stickers
  st.order = Array.from(layer(svgEl).childNodes).map(el => el.classList.contains('stroke') ? 's' : 'k').join('');
  return st;
}
function applyState(svgEl, st) {
  if (!st) return;
  regions(svgEl).forEach((r, i) => { r.style.fill = (st.fills && st.fills[i]) || ''; });
  const lay = layer(svgEl);
  lay.innerHTML = '';
  let si = 0, ki = 0;
  const order = st.order || ('s'.repeat((st.strokes || []).length) + 'k'.repeat((st.stickers || []).length));
  for (const o of order) {
    if (o === 's' && st.strokes[si]) lay.appendChild(makeStroke(st.strokes[si++]));
    else if (o === 'k' && st.stickers[ki]) lay.appendChild(makeSticker(st.stickers[ki++]));
  }
}
// Save what's on screen (auto-save as you color).
function remember() {
  if (!shownId) return;
  const st = readState();
  if (galleryArt) { galleryArt.state = st; }
  else saved.pages[shownId] = st;
  persist();
}

// ---------- Showing a picture ----------
function showPage(index) {
  const pages = pagesIn(currentGroup);
  pageIndex = (index + pages.length) % pages.length;   // wrap around at either end
  const page = pages[pageIndex];
  galleryArt = null;
  load(page, saved.pages[page.id]);
  // keep the address bar in step (replace, so arrows don't fill up "back")
  history.replaceState(null, '', '#' + page.id);
}
function load(page, state) {
  shownId = page.id;
  picture.innerHTML = page.svg;
  picture.setAttribute('aria-label', page.name);
  layer(picture);
  applyState(picture, state);
  undoSteps = []; redoSteps = [];
}

// ---------- Touching the picture ----------
// Picture coordinates (0..400) of a pointer event.
function toPic(e) {
  const pt = picture.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  return pt.matrixTransform(picture.getScreenCTM().inverse());
}
// The colorable part under a finger (even if a brush line is on top of it).
function regionAt(e) {
  return document.elementsFromPoint(e.clientX, e.clientY).find(el => el.classList && el.classList.contains('region') && picture.contains(el));
}
// Brush lines / stickers under a finger.
function artAt(e) {
  const hits = document.elementsFromPoint(e.clientX, e.clientY);
  const out = new Set();
  for (const el of hits) {
    const st = el.closest && el.closest('.stroke, .sticker');
    if (st && picture.contains(st)) out.add(st);
  }
  return [...out];
}

let drawing = null;   // brush line being drawn
let erasing = null;   // things rubbed out during this eraser drag
picture.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  picture.setPointerCapture(e.pointerId);
  if (tool === 'fill') {
    const target = regionAt(e);
    if (!target) return;
    const before = target.style.fill, after = currentColor;
    if (before === after) return;
    target.style.fill = after;
    did({ undo: () => { target.style.fill = before; }, redo: () => { target.style.fill = after; } });
  } else if (tool === 'brush') {
    const p = toPic(e);
    drawing = { pts: [[p.x, p.y]], data: { d: '', c: currentColor, w: BRUSH_SIZES[sizeIdx] } };
    drawing.el = makeStroke(drawing.data);
    layer(picture).appendChild(drawing.el);
    updateStroke();
  } else if (tool === 'eraser') {
    erasing = { removed: [], fill: null };
    // tapping a part with the eraser makes it white again (if nothing drawn is on top)
    const art = artAt(e);
    if (!art.length) {
      const r = regionAt(e);
      if (r && r.style.fill) { erasing.fill = { el: r, before: r.style.fill }; r.style.fill = ''; }
    }
    rub(e);
  } else if (tool === 'sticker') {
    const p = toPic(e);
    const data = { k: currentSticker, x: Math.round(p.x), y: Math.round(p.y), s: STICKER_SIZES[sizeIdx] };
    const el = makeSticker(data);
    const lay = layer(picture);
    lay.appendChild(el);
    did({ undo: () => el.remove(), redo: () => lay.appendChild(el) });
  }
});
picture.addEventListener('pointermove', (e) => {
  if (drawing) {
    const p = toPic(e);
    const last = drawing.pts[drawing.pts.length - 1];
    if (Math.hypot(p.x - last[0], p.y - last[1]) > 2) { drawing.pts.push([p.x, p.y]); updateStroke(); }
  } else if (erasing) rub(e);
});
function endTouch() {
  if (drawing) {
    const el = drawing.el, lay = layer(picture);
    drawing = null;
    did({ undo: () => el.remove(), redo: () => lay.appendChild(el) });
  }
  if (erasing) {
    const { removed, fill } = erasing;
    erasing = null;
    if (removed.length || fill) {
      did({
        undo: () => { removed.forEach(({ el, parent, next }) => parent.insertBefore(el, next && next.parentNode === parent ? next : null)); if (fill) fill.el.style.fill = fill.before; },
        redo: () => { removed.forEach(({ el }) => el.remove()); if (fill) fill.el.style.fill = ''; },
      });
    }
  }
}
picture.addEventListener('pointerup', endTouch);
picture.addEventListener('pointercancel', endTouch);

// Rub out brush lines and stickers under the eraser.
function rub(e) {
  for (const el of artAt(e)) {
    erasing.removed.push({ el, parent: el.parentNode, next: el.nextSibling });
    el.remove();
  }
}
// Smooth line through the points (curves through the midpoints).
function updateStroke() {
  const pts = drawing.pts;
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  if (pts.length === 1) d += ' l0.1 0';
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  if (pts.length > 1) { const l = pts[pts.length - 1]; d += ` L${l[0].toFixed(1)} ${l[1].toFixed(1)}`; }
  drawing.data.d = d;
  drawing.el.setAttribute('d', d);
}

// ---------- Undo, redo, start over, save ----------
document.getElementById('undo').addEventListener('click', () => {
  const step = undoSteps.pop(); if (!step) return;
  step.undo(); redoSteps.push(step); remember();
});
document.getElementById('redo').addEventListener('click', () => {
  const step = redoSteps.pop(); if (!step) return;
  step.redo(); undoSteps.push(step); remember();
});
document.getElementById('clear').addEventListener('click', () => {
  const before = readState();
  if (!before.fills.some(Boolean) && !before.strokes.length && !before.stickers.length) return;
  const blank = { fills: [], strokes: [], stickers: [] };
  applyState(picture, blank);
  did({ undo: () => applyState(picture, before), redo: () => applyState(picture, blank) });  // "start over" can be undone too
});
document.getElementById('save').addEventListener('click', () => {
  const st = readState();
  if (galleryArt) {                       // already a gallery picture: it saves itself
    galleryArt.state = st; persist(); toast('Saved!'); return;
  }
  const art = { id: 'art' + Date.now().toString(36), page: shownId, state: st, t: Date.now() };
  saved.gallery.unshift(art);
  if (saved.gallery.length > 60) saved.gallery.pop();
  persist(); reportToArcade();
  if (window.Arcade && Arcade.daily) Arcade.daily.report('coloring', { win: true });   // "color a picture" surprise
  toast('In your gallery!');
});

function toast(text) {
  toastEl.innerHTML = `<svg viewBox="0 0 48 48" style="width:40px;height:40px;vertical-align:middle;margin-right:8px"><path d="M24 4 L29 17 L43 18 L32 27 L36 41 L24 33 L12 41 L16 27 L5 18 L19 17 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/></svg>${text}`;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 1300);
}

document.getElementById('prev').addEventListener('click', () => { if (!galleryArt) showPage(pageIndex - 1); });
document.getElementById('next').addEventListener('click', () => { if (!galleryArt) showPage(pageIndex + 1); });

// ---------- Picker ----------
// Draw one tab's thumbnails. Each one is a small copy of the page,
// showing whatever the child has colored so far.
function thumbSVG(page, state) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'page-svg');
  svg.setAttribute('viewBox', '0 0 400 400');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = page.svg;
  applyState(svg, state);
  return svg;
}
function showGrid(group) {
  currentGroup = group;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('selected', t.dataset.group === group));
  grid.innerHTML = '';
  if (group === 'gallery') { showGallery(); return; }
  pagesIn(group).forEach((page, i) => {
    const btn = document.createElement('button');
    btn.className = 'thumb';
    btn.setAttribute('aria-label', page.name);
    btn.appendChild(thumbSVG(page, saved.pages[page.id]));
    btn.addEventListener('click', () => {
      // push a history entry so the phone's back button returns to the picker
      history.pushState(null, '', '#' + page.id);
      cameFromPicker = true;
      openPage(i);
    });
    grid.appendChild(btn);
  });
  grid.scrollTop = 0;
}
function showGallery() {
  if (!saved.gallery.length) {
    grid.innerHTML = `<div class="empty-gallery"><svg viewBox="0 0 60 60"><rect x="6" y="10" width="48" height="40" rx="5" fill="#ffd166" stroke="#2b2b2b" stroke-width="3"/><rect x="13" y="17" width="34" height="26" rx="2" fill="#fff" stroke="#2b2b2b" stroke-width="3"/><path d="M30 39 C17 31 20 22 25.5 22 C28 22 30 24.5 30 24.5 C30 24.5 32 22 34.5 22 C40 22 43 31 30 39 Z" fill="#ef476f"/></svg>Tap the heart frame while coloring to save a picture here!</div>`;
    return;
  }
  saved.gallery.forEach(art => {
    const page = PAGES.find(p => p.id === art.page);
    if (!page) return;
    const wrap = document.createElement('div');
    wrap.className = 'thumb-wrap';
    const btn = document.createElement('button');
    btn.className = 'thumb';
    btn.setAttribute('aria-label', 'My ' + page.name);
    btn.appendChild(thumbSVG(page, art.state));
    btn.addEventListener('click', () => {
      history.pushState(null, '', '#art-' + art.id);
      cameFromPicker = true;
      openArt(art);
    });
    const del = document.createElement('button');
    del.className = 'del';
    del.setAttribute('aria-label', 'Remove');
    del.innerHTML = '<svg viewBox="0 0 48 48"><path d="M12 12 L36 36 M36 12 L12 36" stroke="#ef476f" stroke-width="7" stroke-linecap="round"/></svg>';
    del.addEventListener('click', () => {
      // tap twice to remove (so it doesn't happen by accident)
      if (!del.classList.contains('sure')) { del.classList.add('sure'); del.style.background = '#ffafcc'; setTimeout(() => { del.classList.remove('sure'); del.style.background = ''; }, 2000); return; }
      saved.gallery = saved.gallery.filter(a => a !== art);
      persist(); reportToArcade(); showGrid('gallery');
    });
    wrap.append(btn, del);
    grid.appendChild(wrap);
  });
}

function openPage(index) {
  document.body.classList.remove('picking');
  showPage(index);
}
function openArt(art) {
  document.body.classList.remove('picking');
  const page = PAGES.find(p => p.id === art.page);
  load(page, art.state);
  galleryArt = art;
}

function openPicker() {
  if (shownId) remember();
  shownId = null;
  galleryArt = null;
  document.body.classList.add('picking');
  showGrid(currentGroup); // redraw so the thumbnail shows the new colors
}

document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => showGrid(t.dataset.group)));

// "All pictures" button: go back (so the history stays tidy) if we came from
// the picker, otherwise just show it.
document.getElementById('pick').addEventListener('click', () => {
  if (cameFromPicker) history.back(); else { history.replaceState(null, '', location.pathname); openPicker(); }
});

// Address bar / back button decides which screen shows.
function route() {
  const id = location.hash.slice(1);
  const art = id.startsWith('art-') && saved.gallery.find(a => 'art-' + a.id === id);
  const page = PAGES.find(p => p.id === id);
  if (art) { currentGroup = 'gallery'; openArt(art); }
  else if (page) {
    currentGroup = groupOf(page);
    openPage(pagesIn(currentGroup).indexOf(page));
  } else {
    openPicker();
  }
}
window.addEventListener('popstate', () => { cameFromPicker = false; route(); });

// Start: crayons, tools, then the picture in the address (or the picker).
document.body.style.setProperty('--cur', currentColor);
buildPalette();
setTool('fill');
route();
