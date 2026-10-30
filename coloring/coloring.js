// Coloring game logic: pick a crayon, tap a part of the picture to fill it.

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

let currentColor = COLORS[0];
let animalIndex = 0;

// Remember each animal's colors while the game is open,
// so flipping back to an animal shows what the child already colored.
const savedColors = {}; // { animalId: [color, color, ...] }

// Undo history for the current animal: list of steps,
// each step is a list of { el, before } changes.
let history = [];

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

function rememberColors() {
  const animal = ANIMALS[animalIndex];
  savedColors[animal.id] = regions().map(r => r.style.fill || '');
}

function showAnimal(index) {
  rememberColors();
  // wrap around at either end
  animalIndex = (index + ANIMALS.length) % ANIMALS.length;
  const animal = ANIMALS[animalIndex];

  picture.innerHTML = animal.svg;
  picture.setAttribute('aria-label', animal.name);
  history = [];

  const colors = savedColors[animal.id];
  if (colors) regions().forEach((r, i) => { r.style.fill = colors[i] || ''; });
}

// ---------- Filling ----------
// pointerdown (not click) so it feels instant on touch screens
picture.addEventListener('pointerdown', (e) => {
  const target = e.target.closest('.region');
  if (!target) return;
  const before = target.style.fill;
  if (before === currentColor) return;
  target.style.fill = currentColor;
  history.push([{ el: target, before }]);
});

document.getElementById('undo').addEventListener('click', () => {
  const step = history.pop();
  if (!step) return;
  step.forEach(({ el, before }) => { el.style.fill = before; });
});

document.getElementById('clear').addEventListener('click', () => {
  const step = regions()
    .filter(r => r.style.fill)
    .map(r => ({ el: r, before: r.style.fill }));
  if (!step.length) return;
  step.forEach(({ el }) => { el.style.fill = ''; });
  history.push(step); // so "start over" can be undone too
});

document.getElementById('prev').addEventListener('click', () => showAnimal(animalIndex - 1));
document.getElementById('next').addEventListener('click', () => showAnimal(animalIndex + 1));

// Start with the first animal
picture.innerHTML = ANIMALS[0].svg;
picture.setAttribute('aria-label', ANIMALS[0].name);
