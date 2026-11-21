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
// They live in render.js (My House draws them too). Tap a sticker with a crayon
// to color it (Nov 12).
const STICKERS = ColorArt.STICKERS;

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
  // the magic box (saved.magic) or one of the two plain boxes + the colors picked with "+"
  const colors = saved.magic ? MAGIC_CRAYONS : PALETTES[saved.palette || 0].concat(saved.custom || []);
  colors.forEach(color => {
    const btn = document.createElement('button');
    btn.className = 'crayon' + (color === currentColor ? ' selected' : '') + (ColorArt.magicOf(color) ? ' magic' : '');
    btn.style.background = ColorArt.magicCSS(color, '22px') || color;
    btn.dataset.c = color;
    btn.setAttribute('aria-label', 'Color');
    btn.addEventListener('click', () => pickColor(color));
    palette.appendChild(btn);
  });
  // swap crayon box (from the magic box: back to the plain crayons)
  const swap = document.createElement('button');
  swap.className = 'crayon special';
  swap.id = 'swapBox';
  swap.setAttribute('aria-label', 'Other crayons');
  swap.innerHTML = `<svg viewBox="0 0 48 48"><circle cx="18" cy="20" r="11" fill="${PALETTES[1][5]}" stroke="#2b2b2b" stroke-width="3.5"/><circle cx="30" cy="30" r="11" fill="${PALETTES[0][0]}" stroke="#2b2b2b" stroke-width="3.5"/></svg>`;
  swap.addEventListener('click', () => { if (saved.magic) saved.magic = false; else saved.palette = saved.palette ? 0 : 1; persist(); beep(600); buildPalette(); });
  palette.appendChild(swap);
  // the magic wand: opens the box of magic crayons (yellow while it's open)
  const wand = document.createElement('button');
  wand.className = 'crayon special' + (saved.magic ? ' on' : '');
  wand.id = 'magicBox';
  wand.setAttribute('aria-label', 'Magic crayons');
  wand.innerHTML = WAND_ICON;
  wand.addEventListener('click', () => { saved.magic = !saved.magic; persist(); if (saved.magic) twinkle(); else beep(600); buildPalette(); });
  palette.appendChild(wand);
  // any color you like (not in the magic box)
  if (saved.magic) return;
  const plus = document.createElement('button');
  plus.className = 'crayon special';
  plus.setAttribute('aria-label', 'Pick any color');
  plus.innerHTML = `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="16" fill="none" stroke="url(#rb)" stroke-width="8"/><defs><linearGradient id="rb"><stop offset="0" stop-color="#ef476f"/><stop offset=".5" stop-color="#ffd166"/><stop offset="1" stop-color="#118ab2"/></linearGradient></defs><path d="M24 17 V31 M17 24 H31" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/></svg>`;
  plus.addEventListener('click', () => { const inp = document.getElementById('customColor'); inp.value = currentColor.length === 7 ? currentColor : '#ef476f'; inp.click(); });
  palette.appendChild(plus);
}
// ---------- Magic crayons (Nov 21) ----------
// A third crayon box behind the wand button: rainbow, sunset, ocean, dots, stripes, candy stripes,
// checks, zigzag, stars, hearts and glitter (drawings in render.js MAGIC). They fill a part with a
// pattern; brush lines and stickers get the crayon's main color.
const MAGIC_CRAYONS = Object.keys(ColorArt.MAGIC).map(k => '~' + k);
const WAND_ICON = `<svg viewBox="0 0 48 48"><path d="M12 38 L30 20" stroke="#2b2b2b" stroke-width="9" stroke-linecap="round"/><path d="M12 38 L30 20" stroke="#9b5de5" stroke-width="4" stroke-linecap="round"/>
  <path d="M33 5 L36 13 L44 15 L36 18 L33 26 L30 18 L22 15 L30 13 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="16" cy="13" r="3" fill="#f15bb5"/><circle cx="41" cy="33" r="3" fill="#06d6a0"/></svg>`;
// the patterns as SVG <defs> in the page, for the free-drawn parts (--fillp: url(#mg-...))
document.body.insertAdjacentHTML('beforeend', `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${ColorArt.magicDefs(MAGIC_CRAYONS)}</svg>`);

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
  document.body.style.setProperty('--cur', plainColor(color));
  if (tool === 'eraser' || tool === 'sticker') setTool('fill');
  buildPalette();
}

// ---------- Stickers tray ----------
function stickerSVG(k, extra = '') { return `<svg viewBox="0 0 100 100" ${extra}>${ColorArt.sticker(k)}</svg>`; }
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
// state = { v: 2, fills: ['#ef476f', '', ...one per region], strokes: [{d, c, w}], stickers: [{k, x, y, s}] }
// A page is a <div class="page"> full of HTML shapes (see pages.css); the colorable
// ones have class "r" and get their color from the CSS variable --fill.
// v: 2 = saved from the HTML pages (Nov 10). Older saves were made for the old SVG
// drawings, whose parts were in a different order, so their fills are skipped.
function regions(pageEl = picture) { return Array.from(pageEl.querySelectorAll(':scope > .r')); }
// A part's color is kept in data-f (a color like '#ef476f', or a magic crayon like '~dots-pink');
// --fill is what CSS paints: the color itself, or the magic crayon's CSS background (render.js).
// --fillp is only for the rare free-drawn part (class "r p", an SVG path): a pattern from the page's <defs>.
function getFill(r) { return r.dataset.f || r.style.getPropertyValue('--fill').trim(); }
function setFill(r, c) {
  const magic = ColorArt.magicCSS(c);
  if (c) { r.dataset.f = c; r.style.setProperty('--fill', magic || c); }
  else { delete r.dataset.f; r.style.removeProperty('--fill'); }
  if (magic) r.style.setProperty('--fillp', `url(#mg-${c.slice(1)})`); else r.style.removeProperty('--fillp');
}
// the plain color for brush lines and the size dots (a magic crayon's main color)
function plainColor(c) { return ColorArt.mainOf(c) || c; }
// Brush lines and stickers live on a see-through SVG laid over the shapes
// (same 400 x 400 grid), added the first time it's needed.
function layer(pageEl) {
  let svg = pageEl.querySelector(':scope > svg.art-layer');
  if (!svg) {
    svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'art-layer');
    svg.setAttribute('viewBox', '0 0 400 400');
    pageEl.appendChild(svg);
  }
  return svg;
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
  g.innerHTML = ColorArt.sticker(st.k, st.c);    // (c = the color a child gave it)
  g.__data = st;
  return g;
}
function readState(pageEl = picture) {
  const st = { v: 2, fills: regions(pageEl).map(getFill), strokes: [], stickers: [] };
  layer(pageEl).childNodes.forEach(el => {
    if (el.classList.contains('stroke')) st.strokes.push(el.__data);
    else if (el.classList.contains('sticker')) st.stickers.push(el.__data);
  });
  // keep the drawing order of strokes and stickers
  st.order = Array.from(layer(pageEl).childNodes).map(el => el.classList.contains('stroke') ? 's' : 'k').join('');
  return st;
}
function applyState(pageEl, st) {
  if (!st) return;
  const fills = st.v === 2 ? (st.fills || []) : [];
  regions(pageEl).forEach((r, i) => setFill(r, fills[i] || ''));
  const lay = layer(pageEl);
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
  doneEl.hidden = true;
  if (CM && CM.screen() === 'coloring-done') CM.close();
  picture.innerHTML = page.html;
  picture.setAttribute('aria-label', page.name);
  layer(picture);
  applyState(picture, state);
  undoSteps = []; redoSteps = [];
}

// ---------- Touching the picture ----------
// Picture coordinates (0..400) of a pointer event.
function toPic(e) {
  const svg = layer(picture);
  const pt = svg.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}
// The colorable part under a finger (even if a brush line is on top of it).
function regionAt(e) {
  // (el.closest: a tap on a free-drawn path, class "r p", counts as its <i>)
  const hit = document.elementsFromPoint(e.clientX, e.clientY).map(el => el.closest && el.closest('.r')).find(el => el && picture.contains(el));
  return hit || null;
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
    // a sticker under the finger? color the sticker (Nov 12: colorable stickers)
    const stk = artAt(e).find(el => el.classList.contains('sticker'));
    if (stk) {
      const before = stk.__data.c || '', after = currentColor;
      if (before === after) return;
      const paint = (c) => { stk.__data.c = c || undefined; stk.innerHTML = ColorArt.sticker(stk.__data.k, c); };
      paint(after);
      did({ undo: () => paint(before), redo: () => paint(after) });
      pop();
      return;
    }
    const target = regionAt(e);
    if (!target) return;
    const wasDone = allColored();
    const before = getFill(target), after = currentColor;
    if (before === after) return;
    setFill(target, after);
    did({ undo: () => setFill(target, before), redo: () => setFill(target, after) });
    if (!wasDone && allColored()) celebrate();      // the last part: "Done!"
    else if (ColorArt.magicOf(after)) twinkle();     // magic crayons twinkle
    else pop();                                      // plain ones go "pop"
  } else if (tool === 'brush') {
    const p = toPic(e);
    drawing = { pts: [[p.x, p.y]], data: { d: '', c: plainColor(currentColor), w: BRUSH_SIZES[sizeIdx] } };
    drawing.el = makeStroke(drawing.data);
    layer(picture).appendChild(drawing.el);
    updateStroke();
  } else if (tool === 'eraser') {
    erasing = { removed: [], fill: null };
    // tapping a part with the eraser makes it white again (if nothing drawn is on top)
    const art = artAt(e);
    if (!art.length) {
      const r = regionAt(e);
      if (r && getFill(r)) { erasing.fill = { el: r, before: getFill(r) }; setFill(r, ''); }
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
        undo: () => { removed.forEach(({ el, parent, next }) => parent.insertBefore(el, next && next.parentNode === parent ? next : null)); if (fill) setFill(fill.el, fill.before); },
        redo: () => { removed.forEach(({ el }) => el.remove()); if (fill) setFill(fill.el, ''); },
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

// ---------- "Done!" (Nov 12) ----------
// When the last part of a picture gets its color (the sky doesn't count, it can
// stay white), a big star pops up with confetti and a cheer. Two picture buttons:
// the heart frame hangs it on the wall (= saves it to My pictures, which My
// House shows in the Art Room), the tick just keeps coloring.
const doneEl = document.getElementById('done');
function allColored() {
  const parts = regions().filter(r => !r.classList.contains('bg'));
  return parts.length > 0 && parts.every(r => getFill(r));
}
function celebrate() {
  if (CM) doneScreen();                        // (drawn by Phaser: the finished picture + the big star)
  else {
    doneEl.hidden = false;
    doneEl.classList.remove('pop'); void doneEl.offsetWidth; doneEl.classList.add('pop');
  }
  if (window.Arcade) {
    Arcade.audio.resume(); Arcade.sfx('win'); Arcade.confetti(140);
    if (Arcade.daily) Arcade.daily.report('coloring', { win: true });   // "color a picture" surprise
  }
}
document.getElementById('doneHang').addEventListener('click', () => {
  doneEl.hidden = true;
  document.getElementById('save').click();     // the same as the heart-frame button
});
document.getElementById('doneOk').addEventListener('click', () => { doneEl.hidden = true; });

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
function thumbPage(page, state) {
  const div = document.createElement('div');
  div.className = 'page';
  div.setAttribute('aria-hidden', 'true');
  div.innerHTML = page.html;
  applyState(div, state);
  return div;
}
function showGrid(group) {
  currentGroup = group;
  if (CM) { pickScreen(); return; }           // (Phaser + Rex UI draw the picker: see "Canvas menus" below)
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('selected', t.dataset.group === group));
  grid.innerHTML = '';
  if (group === 'gallery') { showGallery(); return; }
  pagesIn(group).forEach((page, i) => {
    const btn = document.createElement('button');
    btn.className = 'thumb';
    btn.setAttribute('aria-label', page.name);
    btn.appendChild(thumbPage(page, saved.pages[page.id]));
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
    btn.appendChild(thumbPage(page, art.state));
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
  closeMenus();
  document.body.classList.remove('picking');
  showPage(index);
}
function openArt(art) {
  closeMenus();
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

// ---------- Canvas menus (Nov 21, Keith: "rewrite everything with Phaser 3 + Rex UI") ----------
// The picker and the "Done!" box are drawn by Phaser + Rex UI (arcade/canvasmenu.js), scaled to
// fit the screen like every game's menus. Without Phaser (an old browser) the HTML ones above still work.
//   screen 'coloring-pick': top row = the 4 picture tabs (tab-animals / tab-fruit / tab-things /
//     tab-gallery; the open one is yellow), then one tile per picture (page-<id>, or art-<n> in My pictures),
//     and the green home button ('home') at the bottom.
//     My pictures has a trash button (attr 'remove'): then a tap on a picture marks it (yellow, big red X)
//     and a second tap takes it off the wall.
//   screen 'coloring-done': the finished picture + the big star; buttons 'hang' (save it) and 'ok'.
const CM = window.ArcadeMenus && window.Phaser ? window.ArcadeMenus : null;
if (CM) document.body.classList.add('cm');
const iconOf = (sel) => { const el = document.querySelector(sel); return el ? el.outerHTML.replace(/ aria-hidden="true"/g, '') : ''; };
const ICONS = {
  home: iconOf('.picker-screen a.round-btn svg'),
  animals: iconOf('.tab[data-group=animals] svg'), fruit: iconOf('.tab[data-group=fruit] svg'),
  things: iconOf('.tab[data-group=things] svg'), gallery: iconOf('.tab[data-group=gallery] svg'),
  hang: iconOf('#doneHang svg'), ok: iconOf('#doneOk svg'), star: iconOf('#done svg.big'),
  trash: `<svg viewBox="0 0 48 48"><path d="M10 14 H38 M19 14 V9 H29 V14" fill="none" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M13 14 L15 41 H33 L35 14 Z" fill="#ffafcc" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/>
    <path d="M20 21 V34 M28 21 V34" stroke="#2b2b2b" stroke-width="3.5" stroke-linecap="round"/></svg>`,
};
// a page (with its colors) as one picture; `x` adds a red X in the corner (taking it off the wall)
function pagePic(page, state, x) {
  const cross = x ? `<circle cx="352" cy="48" r="${x === 2 ? 44 : 34}" fill="#fff" stroke="#2b2b2b" stroke-width="8"/>
    <path d="M${x === 2 ? '332 28 L372 68 M372 28 L332 68' : '337 33 L367 63 M367 33 L337 63'}" stroke="#ef476f" stroke-width="12" stroke-linecap="round"/>` : '';
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#fff"/>${ColorArt.pageSVG(page, state, 10)}${cross}</svg>`;
}
let removing = false, sureId = null, sureTimer = null;
function pickScreen() {
  const tabs = ['animals', 'fruit', 'things', 'gallery'];
  const top = { t: 'round', items: tabs.map(g => ({ icon: ICONS[g], label: '', attr: 'tab-' + g, picked: g === currentGroup,
    onTap: () => { removing = false; sureId = null; if (g !== currentGroup) beep(660); showGrid(g); } })) };
  // (the home button sits at the bottom: on a phone held upright 5 round buttons don't fit in one row)
  const home = { icon: ICONS.home, label: '', attr: 'home', color: 'big', minW: 110, onTap: () => { location.href = '../index.html'; } };
  let rows, footer = { t: 'buttons', items: [home] };
  if (currentGroup !== 'gallery') {
    const tiles = pagesIn(currentGroup).map((page, i) => ({
      pic: pagePic(page, saved.pages[page.id]), fill: true, attr: 'page-' + page.id, label: page.name,
      onTap: () => { history.pushState(null, '', '#' + page.id); cameFromPicker = true; openPage(i); },
    }));
    rows = [{ t: 'tiles', items: tiles, w: 120, h: 120 }];
  } else if (!saved.gallery.length) {
    removing = false;
    rows = [{ t: 'pics', items: [ICONS.gallery], size: 170 }];       // (nothing hung up yet: an empty frame)
  } else {
    const tiles = [];
    for (const art of saved.gallery) {
      const page = PAGES.find(p => p.id === art.page);
      if (!page) continue;
      const sure = removing && sureId === art.id;
      tiles.push({ pic: pagePic(page, art.state, removing ? (sure ? 2 : 1) : 0), fill: true, picked: sure, attr: 'art-' + art.id, label: page.name,
        onTap: () => {
          if (!removing) { history.pushState(null, '', '#art-' + art.id); cameFromPicker = true; openArt(art); return; }
          // taking one off the wall: tap twice (so it doesn't happen by accident)
          clearTimeout(sureTimer);
          if (sureId !== art.id) { sureId = art.id; beep(440); sureTimer = setTimeout(() => { sureId = null; if (CM.screen() === 'coloring-pick') pickScreen(); }, 2500); pickScreen(); return; }
          sureId = null; beep(220);
          saved.gallery = saved.gallery.filter(a => a !== art);
          persist(); reportToArcade(); pickScreen();
        } });
    }
    rows = [{ t: 'tiles', items: tiles, w: 120, h: 120 }];
    footer = { t: 'buttons', items: [home, { icon: ICONS.trash, label: '', attr: 'remove', color: removing ? 'yellow' : 'white', minW: 110,
      onTap: () => { removing = !removing; sureId = null; beep(removing ? 520 : 760); pickScreen(); } }] };
  }
  CM.open({ id: 'coloring-pick', tab: currentGroup, top, rows, footer,
    onKey: (code) => { if (code === 'Escape' && removing) { removing = false; pickScreen(); } } });
}
function doneScreen() {
  const page = PAGES.find(p => p.id === shownId);
  const pics = (page ? [pagePic(page, readState())] : []).concat([ICONS.star]);
  CM.open({ id: 'coloring-done', rows: [{ t: 'pics', items: pics, size: innerWidth >= innerHeight ? 310 : 190 }],    // (as big as fits: upright they sit side by side too)
    footer: { t: 'buttons', items: [
      { icon: ICONS.hang, label: '', attr: 'hang', color: 'pink', minW: 130, onTap: () => { CM.close(); document.getElementById('save').click(); } },
      { icon: ICONS.ok, label: '', attr: 'ok', color: 'white', minW: 130, onTap: () => CM.close() },
    ] },
    onKey: (code) => { if (code === 'Enter' || code === 'Escape' || code === 'Space') CM.close(); } });
}
function closeMenus() { if (CM && CM.isOpen) CM.close(); }
// a little "boop" for menu taps (the arcade's sound kit, when it's there)
function beep(f) { if (window.Arcade && Arcade.audio) try { Arcade.audio.resume(); Arcade.audio.tone(f, 0.08, { type: 'triangle', vol: 0.15 }); } catch (e) { /* no sound: fine */ } }
// Sounds while coloring (Nov 21): a soft "pop" when a part fills (a different note each time, from a
// happy 5-note scale, so coloring sounds a bit like a tune) and a little twinkle for magic crayons.
const POP_NOTES = [523, 587, 659, 784, 880, 1047];
let popAt = 0;
function pop() {
  if (!(window.Arcade && Arcade.audio)) return;
  try {
    Arcade.audio.resume();
    popAt = (popAt + 1 + Math.floor(Math.random() * 3)) % POP_NOTES.length;
    const f = POP_NOTES[popAt];
    Arcade.audio.tone(f * 0.6, 0.12, { type: 'sine', vol: 0.22, slide: f * 1.3 });   // the "bloop" (slides up)
  } catch (e) { /* no sound: fine */ }
}
function twinkle() {
  if (!(window.Arcade && Arcade.audio)) return;
  try {
    Arcade.audio.resume();
    [1047, 1319, 1568, 2093].forEach((f, i) => Arcade.audio.tone(f, 0.16, { type: 'triangle', vol: 0.13, delay: i * 0.06 }));
  } catch (e) { /* no sound: fine */ }
}
window.__coloringSounds = { pop, twinkle };
window.__coloringMenus = () => ({ screen: CM && CM.isOpen ? CM.screen() : '', group: currentGroup, removing, gallery: saved.gallery.length });

// Start: crayons, tools, then the picture in the address (or the picker).
document.body.style.setProperty('--cur', currentColor);
buildPalette();
setTool('fill');
route();
