// Coloring game logic.
// Two screens: the PICKER (a grid of little pictures, with an Animals tab and a
// Fruit tab) and the COLORING screen (pick a crayon, tap a part to fill it).
// The address bar remembers which picture is open (coloring/index.html#tiger),
// so the phone's back button goes from a picture back to the picker.

// 12 big, easy-to-tell-apart crayon colors (plus white to "erase" one spot).
const COLORS = [
  '#ef476f', // pink-red
  '#ff8c42', // orange
  '#ffd166', // yellow
  '#06d6a0', // green
  '#2a9d8f', // teal
  '#118ab2', // blue
  '#9b5de5', // purple
  '#f15bb5', // pink
  '#8d5524', // brown
  '#7a7a7a', // gray
  '#2b2b2b', // black
  '#ffffff'  // white
];

const picture = document.getElementById('picture');
const palette = document.getElementById('palette');

const grid = document.getElementById('grid');

let currentColor = COLORS[0];
let animalIndex = 0;      // position in the current tab's list
let currentGroup = 'animals';
let cameFromPicker = false; // did we open this picture by tapping a thumbnail?

// Which tab a page belongs to. Traced pages get it from art/groups.json;
// hand-drawn ones (bird) are animals.
function groupOf(page) { return page.group || 'animals'; }

// Pages in a tab, in A-Z order (by id, so it never depends on words).
function pagesIn(group) {
  return PAGES.filter(p => groupOf(p) === group)
                .sort((a, b) => a.id.localeCompare(b.id));
}

// Remember each animal's colors while the game is open,
// so flipping back to an animal shows what the child already colored.
const savedColors = {}; // { animalId: [color, color, ...] }

// Undo history for the current animal: list of steps,
// each step is a list of { el, before } changes.
let undoSteps = [];

// ---------- Crayons ----------
COLORS.forEach((color, i) => {
  const btn = document.createElement('button');
  btn.className = 'crayon' + (i === 0 ? ' selected' : '');
  btn.style.background = color;
  btn.setAttribute('aria-label', 'Color ' + (i + 1));
  btn.addEventListener('click', () => {
    currentColor = color;
    document.querySelectorAll('.crayon').forEach(c => c.classList.remove('selected'));
    btn.classList.add('selected');
  });
  palette.appendChild(btn);
});

// ---------- Drawing an animal ----------
function regions() {
  return Array.from(picture.querySelectorAll('.region'));
}

let shownId = null; // id of the picture on the coloring screen (null = none yet)

function rememberColors() {
  if (!shownId) return;
  savedColors[shownId] = regions().map(r => r.style.fill || '');
}

// Put saved colors back onto a drawing (the big picture or a thumbnail).
function paintSaved(svgEl, id) {
  const colors = savedColors[id];
  if (!colors) return;
  svgEl.querySelectorAll('.region').forEach((r, i) => { r.style.fill = colors[i] || ''; });
}

function showAnimal(index) {
  rememberColors();
  const pages = pagesIn(currentGroup);
  // wrap around at either end of this tab
  animalIndex = (index + pages.length) % pages.length;
  const animal = pages[animalIndex];
  shownId = animal.id;
  // keep the address bar in step (replace, so arrows don't fill up "back")
  history.replaceState(null, '', '#' + animal.id);

  picture.innerHTML = animal.svg;
  picture.setAttribute('aria-label', animal.name);
  undoSteps = [];
  paintSaved(picture, animal.id);
}

// ---------- Filling ----------
// pointerdown (not click) so it feels instant on touch screens
picture.addEventListener('pointerdown', (e) => {
  const target = e.target.closest('.region');
  if (!target) return;
  const before = target.style.fill;
  if (before === currentColor) return;
  target.style.fill = currentColor;
  undoSteps.push([{ el: target, before }]);
});

document.getElementById('undo').addEventListener('click', () => {
  const step = undoSteps.pop();
  if (!step) return;
  step.forEach(({ el, before }) => { el.style.fill = before; });
});

document.getElementById('clear').addEventListener('click', () => {
  const step = regions()
    .filter(r => r.style.fill)
    .map(r => ({ el: r, before: r.style.fill }));
  if (!step.length) return;
  step.forEach(({ el }) => { el.style.fill = ''; });
  undoSteps.push(step); // so "start over" can be undone too
});

document.getElementById('prev').addEventListener('click', () => showAnimal(animalIndex - 1));
document.getElementById('next').addEventListener('click', () => showAnimal(animalIndex + 1));

// ---------- Picker ----------
// Draw one tab's thumbnails. Each one is a small copy of the page,
// showing whatever the child has colored so far.
function showGrid(group) {
  currentGroup = group;
  document.querySelectorAll('.tab').forEach(t =>
    t.classList.toggle('selected', t.dataset.group === group));
  grid.innerHTML = '';
  pagesIn(group).forEach((page, i) => {
    const btn = document.createElement('button');
    btn.className = 'thumb';
    btn.setAttribute('aria-label', page.name);
    btn.innerHTML = `<svg class="page-svg" viewBox="0 0 400 400" aria-hidden="true">${page.svg}</svg>`;
    paintSaved(btn.firstChild, page.id);
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

function openPage(index) {
  document.body.classList.remove('picking');
  showAnimal(index);
}

function openPicker() {
  rememberColors();
  document.body.classList.add('picking');
  showGrid(currentGroup); // redraw so the thumbnail shows the new colors
}

document.querySelectorAll('.tab').forEach(t =>
  t.addEventListener('click', () => showGrid(t.dataset.group)));

// "All pictures" button: go back (so the history stays tidy) if we came from
// the picker, otherwise just show it.
document.getElementById('pick').addEventListener('click', () => {
  if (cameFromPicker) history.back(); else { history.replaceState(null, '', location.pathname); openPicker(); }
});

// Address bar / back button decides which screen shows.
function route() {
  const id = location.hash.slice(1);
  const page = PAGES.find(p => p.id === id);
  if (page) {
    currentGroup = groupOf(page);
    openPage(pagesIn(currentGroup).indexOf(page));
  } else {
    openPicker();
  }
}
window.addEventListener('popstate', () => { cameFromPicker = false; route(); });

// Start: open the picture in the address, or the picker.
route();
