// =====================================================================
// Claw Catch prizes (Keith, Nov 26: "Create a claw game").
//
// Every plush toy you can grab in the claw machines, as plain SVG pictures.
// The game draws them in the machine, the Prize Shelf shows them, and
// My House (house/house.js) lets you put the ones you won in your bedroom.
//
// Each picture is a 100 x 100 box. The toy's round body sits at 50,56 with a
// radius of 34 (ears, horns and tails can poke out of it). The game treats
// every toy as a ball of that size (see claw.js).
//
//   window.ClawPrizes = {
//     MACHINES: [{ id, name, color, glass, prizes: [ids] }],
//     LIST: [{ id, name, machine, rare, svg }],
//     byId(id), svg(id, gray)   (gray = a dark shape, for the ones not won yet)
//     won(save) = { id: how many }  (save = Arcade.store.load(): this player's arcade save)
//   }
// =====================================================================
(function () {
  'use strict';
  const L = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
  const L3 = 'stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
  const L2 = 'stroke="#2b2b2b" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"';   // (never write a 2nd stroke-width: SVG pictures must be strict XML)

  // ---- shared bits: a cute face, a round body ----
  function eyes(y, gap = 9, r = 4.4) {
    return [50 - gap, 50 + gap].map(x => `<circle cx="${x}" cy="${y}" r="${r}" fill="#2b2b2b"/><circle cx="${x + 1.5}" cy="${y - 1.6}" r="${r * 0.38}" fill="#fff"/>`).join('');
  }
  function face(y = 54, o = {}) {
    const cheeks = o.noCheeks ? '' : `<ellipse cx="${50 - (o.cheekGap || 17)}" cy="${y + 9}" rx="5.5" ry="3.4" fill="#ff8fab" opacity="0.85"/><ellipse cx="${50 + (o.cheekGap || 17)}" cy="${y + 9}" rx="5.5" ry="3.4" fill="#ff8fab" opacity="0.85"/>`;
    const mouth = o.mouth != null ? o.mouth : `<path d="M45 ${y + 8} Q50 ${y + 12.5} 55 ${y + 8}" fill="none" ${L3}/>`;
    return eyes(y, o.gap, o.r) + cheeks + mouth;
  }
  const body = (c, r = 34) => `<circle cx="50" cy="56" r="${r}" fill="${c}" ${L}/>`;
  const shine = `<ellipse cx="37" cy="38" rx="9" ry="5.5" fill="#fff" opacity="0.45" transform="rotate(-30 37 38)"/>`;
  const star = (x, y, r, fill, line = true) => {
    let d = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + Math.PI * i / 5, rr = i % 2 ? r * 0.48 : r; d += (i ? 'L' : 'M') + (x + Math.cos(a) * rr).toFixed(1) + ' ' + (y + Math.sin(a) * rr).toFixed(1); }
    return `<path d="${d}Z" fill="${fill}" ${line ? L : ''}/>`;
  };
  const sparkles = `<path d="M84 16 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5z" fill="#fff" ${L2}/><path d="M14 82 l2 4.5 4.5 2 -4.5 2 -2 4.5 -2 -4.5 -4.5 -2 4.5 -2z" fill="#fff" ${L2}/>`;

  // ---- every toy: [id, name, machine, rare, picture] ----
  const TOYS = [
    // --- the Toy Box machine ---
    ['bunny', 'Bunny', 'toys', false,
      `<ellipse cx="38" cy="22" rx="9" ry="22" fill="#f7f1ff" ${L} transform="rotate(-10 38 22)"/><ellipse cx="38" cy="24" rx="4" ry="14" fill="#ffc8dd" transform="rotate(-10 38 24)"/>
       <ellipse cx="62" cy="22" rx="9" ry="22" fill="#f7f1ff" ${L} transform="rotate(10 62 22)"/><ellipse cx="62" cy="24" rx="4" ry="14" fill="#ffc8dd" transform="rotate(10 62 24)"/>
       ${body('#f7f1ff')}${shine}${face(56)}<ellipse cx="50" cy="61" rx="3" ry="2.2" fill="#ff8fab"/>`],
    ['kitty', 'Kitty', 'toys', false,
      `<path d="M22 42 L24 12 L46 28 Z" fill="#ffb347" ${L}/><path d="M78 42 L76 12 L54 28 Z" fill="#ffb347" ${L}/><path d="M27 30 L28 19 L37 26 Z M73 30 L72 19 L63 26 Z" fill="#ffc8dd"/>
       ${body('#ffb347')}<path d="M40 26 L42 34 M50 24 V33 M60 26 L58 34" stroke="#d9822b" stroke-width="4" stroke-linecap="round"/>${shine}${face(56)}
       <path d="M18 60 H30 M18 66 L30 64 M82 60 H70 M82 66 L70 64" stroke="#2b2b2b" stroke-width="2.5" stroke-linecap="round"/>`],
    ['puppy', 'Puppy', 'toys', false,
      `${body('#e0b984')}<path d="M22 34 Q8 40 12 66 Q24 66 28 48 Z" fill="#8d5524" ${L}/><path d="M78 34 Q92 40 88 66 Q76 66 72 48 Z" fill="#8d5524" ${L}/>
       <ellipse cx="62" cy="44" rx="9" ry="8" fill="#c68b59"/>${shine}${face(54, { mouth: `<path d="M44 64 Q50 70 56 64" fill="none" ${L3}/>` })}<ellipse cx="50" cy="61" rx="5" ry="3.8" fill="#2b2b2b"/>`],
    ['duck', 'Duckling', 'toys', false,
      `<path d="M50 24 Q46 12 54 10 Q52 16 58 18" fill="#ffd166" ${L3}/>${body('#ffd166')}${shine}${face(50, { mouth: '' })}
       <ellipse cx="50" cy="64" rx="12" ry="6.5" fill="#ff8c42" ${L3}/><path d="M40 64 H60" stroke="#2b2b2b" stroke-width="2"/>
       <path d="M16 62 Q10 74 24 74 M84 62 Q90 74 76 74" fill="none" ${L3}/>`],
    ['frog', 'Froggy', 'toys', false,
      `<circle cx="34" cy="30" r="13" fill="#7bd389" ${L}/><circle cx="66" cy="30" r="13" fill="#7bd389" ${L}/>${body('#7bd389')}
       <circle cx="34" cy="30" r="9" fill="#fff"/><circle cx="66" cy="30" r="9" fill="#fff"/>${eyes(31, 16, 5)}
       <path d="M30 60 Q50 76 70 60" fill="#ff8fab" ${L3}/><ellipse cx="24" cy="54" rx="5" ry="3.2" fill="#ff8fab" opacity="0.85"/><ellipse cx="76" cy="54" rx="5" ry="3.2" fill="#ff8fab" opacity="0.85"/>
       <ellipse cx="38" cy="78" rx="6" ry="4" fill="#5aa86b" opacity="0.6"/><ellipse cx="62" cy="78" rx="6" ry="4" fill="#5aa86b" opacity="0.6"/>`],
    ['unicorn', 'Golden Unicorn', 'toys', true,
      `<path d="M44 28 L51 5 L58 28 Z" fill="#ffd166" ${L}/><path d="M47 20 L55 16 M46 24 L57 21" stroke="#e0a800" stroke-width="2.5" stroke-linecap="round"/>
       <path d="M26 36 L24 18 L40 28 Z M74 36 L76 18 L60 28 Z" fill="#fff6d6" ${L3}/>${body('#fff6d6')}
       <path d="M60 24 Q84 26 84 50 Q78 42 72 44 Q78 34 62 32 Z" fill="#ff8fab" ${L3}/><path d="M66 30 Q84 40 86 62 Q78 54 74 56 Q78 44 64 40 Z" fill="#c77dff" ${L3}/>
       ${shine}${face(58)}${sparkles}`],
    // --- the Ocean machine ---
    ['fish', 'Fishy', 'sea', false,
      `<path d="M74 56 L96 38 Q90 56 96 74 Z" fill="#ff8c42" ${L}/>${body('#ffb347')}<path d="M44 22 Q56 8 66 26" fill="#ff8c42" ${L3}/>
       <path d="M60 34 Q68 56 60 78" fill="none" stroke="#ff8c42" stroke-width="5" stroke-linecap="round"/>${shine}${face(54)}`],
    ['octopus', 'Octopus', 'sea', false,
      `${[16, 32, 50, 68, 84].map((x, i) => `<path d="M${x - 7} 66 Q${x - 9} 86 ${x} 92 Q${x + 9} 86 ${x + 7} 66 Z" fill="#c77dff" ${L3}/>`).join('')}
       <path d="M14 66 Q12 20 50 20 Q88 20 86 66 Q50 76 14 66 Z" fill="#c77dff" ${L}/>
       <circle cx="34" cy="36" r="4" fill="#e9c6ff"/><circle cx="66" cy="34" r="3" fill="#e9c6ff"/>${shine}${face(52)}`],
    ['whale', 'Whale', 'sea', false,
      `<path d="M50 22 Q44 8 36 10 M50 22 Q50 6 50 4 M50 22 Q56 8 64 10" fill="none" stroke="#4cc9f0" stroke-width="5" stroke-linecap="round"/>
       <path d="M12 46 Q2 34 8 26 Q16 32 20 40 Z M88 46 Q98 34 92 26 Q84 32 80 40 Z" fill="#118ab2" ${L3}/>
       ${body('#4cc9f0')}<path d="M24 70 Q50 92 76 70 Q50 80 24 70 Z" fill="#dff6ff" ${L3}/>${shine}${face(52)}`],
    ['crab', 'Crabby', 'sea', false,
      `<path d="M22 42 Q6 32 10 16 L18 22 L16 12 Q30 16 28 36 Z" fill="#ef476f" ${L3}/><path d="M78 42 Q94 32 90 16 L82 22 L84 12 Q70 16 72 36 Z" fill="#ef476f" ${L3}/>
       <path d="M40 30 V14 M60 30 V14" ${L3}/><circle cx="40" cy="13" r="6" fill="#fff" ${L3}/><circle cx="60" cy="13" r="6" fill="#fff" ${L3}/><circle cx="41" cy="13" r="2.8" fill="#2b2b2b"/><circle cx="61" cy="13" r="2.8" fill="#2b2b2b"/>
       <path d="M18 76 L8 86 M24 82 L18 92 M82 76 L92 86 M76 82 L82 92" ${L3}/>
       <ellipse cx="50" cy="60" rx="36" ry="28" fill="#ef476f" ${L}/>${shine}${face(56, { gap: 10 })}`],
    ['seal', 'Seal Pup', 'sea', false,
      `${body('#c9d6df')}<path d="M18 70 Q2 76 6 88 Q20 86 26 76 Z M82 70 Q98 76 94 88 Q80 86 74 76 Z" fill="#9aa5b1" ${L3}/>${shine}
       ${face(52, { mouth: '' })}<ellipse cx="50" cy="62" rx="10" ry="7" fill="#fff" ${L3}/><ellipse cx="50" cy="59" rx="3.8" ry="2.6" fill="#2b2b2b"/>
       <path d="M34 62 H24 M34 66 L25 69 M66 62 H76 M66 66 L75 69" stroke="#2b2b2b" stroke-width="2.2" stroke-linecap="round"/>`],
    ['starfish', 'Golden Starfish', 'sea', true,
      `${star(50, 54, 46, '#ffd166')}${star(50, 54, 30, '#ffe59a', false)}<circle cx="36" cy="32" r="3" fill="#fff" opacity="0.8"/>${face(54, { cheekGap: 14, gap: 8 })}${sparkles}`],
    // --- the Candy machine ---
    ['cupcake', 'Cupcake', 'sweets', false,
      `<path d="M20 52 L28 88 H72 L80 52 Z" fill="#4cc9f0" ${L}/><path d="M36 56 L40 86 M50 56 V86 M64 56 L60 86" stroke="#2b2b2b" stroke-width="2.5" opacity="0.5"/>
       <path d="M14 54 Q12 36 30 34 Q32 18 50 20 Q68 18 70 34 Q88 36 86 54 Q50 64 14 54 Z" fill="#ffc8dd" ${L}/>
       <circle cx="50" cy="14" r="7" fill="#ef476f" ${L3}/><path d="M50 7 Q54 0 60 2" fill="none" ${L3}/>
       <g fill="#fff"><rect x="28" y="40" width="7" height="3" rx="1.5" transform="rotate(30 31 41)"/><rect x="64" y="38" width="7" height="3" rx="1.5" transform="rotate(-30 67 39)"/><rect x="46" y="30" width="7" height="3" rx="1.5"/></g>
       ${face(68, { cheekGap: 15, gap: 8 })}`],
    ['donut', 'Donut', 'sweets', false,
      `${body('#e0a96d')}<path d="M18 52 Q14 22 50 22 Q86 22 82 52 Q78 62 70 56 Q62 64 54 58 Q46 66 38 58 Q28 64 18 52 Z" fill="#ff8fab" ${L3}/>
       <ellipse cx="50" cy="40" rx="10" ry="7" fill="#e0a96d" ${L3}/>
       <g><rect x="28" y="36" width="7" height="3" rx="1.5" fill="#ffd166" transform="rotate(30 31 37)"/><rect x="66" y="34" width="7" height="3" rx="1.5" fill="#4cc9f0" transform="rotate(-30 69 35)"/><rect x="36" y="27" width="7" height="3" rx="1.5" fill="#7bd389"/><rect x="58" y="26" width="7" height="3" rx="1.5" fill="#fff"/></g>
       ${face(66, { cheekGap: 18 })}`],
    ['icecream', 'Ice Cream', 'sweets', false,
      `<path d="M30 58 L50 98 L70 58 Z" fill="#f4c27a" ${L}/><path d="M38 66 L58 78 M44 80 L62 70 M36 60 L64 60" stroke="#c68b59" stroke-width="2.5"/>
       <path d="M18 56 Q12 40 24 34 Q22 14 46 14 Q66 10 74 26 Q90 30 84 50 Q86 62 70 62 Q50 70 30 62 Q18 64 18 56 Z" fill="#b9fbc0" ${L}/>
       <path d="M30 22 Q36 18 42 20" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.8"/>${face(42)}`],
    ['cookie', 'Cookie', 'sweets', false,
      `${body('#d9a066')}<path d="M80 40 Q72 42 74 50 Q82 50 84 46" fill="#fff8e6" ${L3}/>
       <g fill="#6b3f1f"><circle cx="30" cy="40" r="4"/><circle cx="62" cy="30" r="4"/><circle cx="72" cy="66" r="4"/><circle cx="32" cy="74" r="4"/><circle cx="54" cy="80" r="3.4"/></g>${shine}${face(54)}`],
    ['gumdrop', 'Gumdrop', 'sweets', false,
      `<path d="M16 86 Q12 42 30 26 Q50 10 70 26 Q88 42 84 86 Z" fill="#06d6a0" ${L}/>
       <g fill="#fff" opacity="0.85"><circle cx="30" cy="44" r="2.5"/><circle cx="66" cy="38" r="2.5"/><circle cx="74" cy="66" r="2.5"/><circle cx="26" cy="72" r="2.5"/><circle cx="50" cy="28" r="2.5"/><circle cx="60" cy="80" r="2.5"/></g>${shine}${face(58)}`],
    ['lollipop', 'Rainbow Lollipop', 'sweets', true,
      `<rect x="45" y="70" width="10" height="30" rx="4" fill="#fff" ${L3}/>
       <circle cx="50" cy="48" r="38" fill="#ef476f" ${L}/><circle cx="50" cy="48" r="30" fill="#ff8c42"/><circle cx="50" cy="48" r="23" fill="#ffd166"/><circle cx="50" cy="48" r="16" fill="#7bd389"/><circle cx="50" cy="48" r="9" fill="#4cc9f0"/>
       <circle cx="50" cy="48" r="38" fill="none" ${L}/>${face(46, { cheekGap: 20 })}${sparkles}`],
    // --- the Space machine ---
    ['alien', 'Alien', 'space', false,
      `<path d="M38 26 L30 6 M62 26 L70 6" ${L}/><circle cx="30" cy="6" r="5" fill="#ffd166" ${L3}/><circle cx="70" cy="6" r="5" fill="#ffd166" ${L3}/>
       ${body('#9be564')}${shine}${face(54, { r: 6, gap: 11 })}`],
    ['planet', 'Planet', 'space', false,
      `<path d="M6 62 Q50 40 94 50" fill="none" stroke="#2b2b2b" stroke-width="13" stroke-linecap="round"/><path d="M6 62 Q50 40 94 50" fill="none" stroke="#ffd166" stroke-width="6" stroke-linecap="round"/>
       ${body('#ff8c42')}<path d="M18 40 Q50 32 82 40 M16 70 Q50 64 84 70" fill="none" stroke="#d9672b" stroke-width="4" stroke-linecap="round"/>
       <path d="M10 64 Q50 78 90 54" fill="none" stroke="#2b2b2b" stroke-width="13" stroke-linecap="round"/><path d="M10 64 Q50 78 90 54" fill="none" stroke="#ffd166" stroke-width="6" stroke-linecap="round"/>
       ${shine}${face(50)}`],
    ['moon', 'Sleepy Moon', 'space', false,
      `${body('#fff1b8')}<circle cx="70" cy="38" r="6" fill="#ebdc9a"/><circle cx="30" cy="74" r="5" fill="#ebdc9a"/><circle cx="72" cy="72" r="4" fill="#ebdc9a"/>${shine}
       <path d="M36 54 Q41 58 46 54 M54 54 Q59 58 64 54" fill="none" ${L3}/><ellipse cx="33" cy="64" rx="5.5" ry="3.4" fill="#ff8fab" opacity="0.85"/><ellipse cx="67" cy="64" rx="5.5" ry="3.4" fill="#ff8fab" opacity="0.85"/>
       <path d="M45 66 Q50 70 55 66" fill="none" ${L3}/><path d="M78 18 h6 l-6 6 h6 M88 8 h4 l-4 4 h4" fill="none" stroke="#2b2b2b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`],
    ['ufo', 'Flying Saucer', 'space', false,
      `<path d="M26 50 Q26 20 50 20 Q74 20 74 50 Z" fill="#bde0fe" ${L}/>${face(40, { cheekGap: 13, gap: 8, r: 3.8 })}
       <ellipse cx="50" cy="62" rx="44" ry="18" fill="#9b5de5" ${L}/><ellipse cx="50" cy="56" rx="26" ry="6" fill="#c77dff"/>
       ${[22, 40, 60, 78].map(x => `<circle cx="${x}" cy="68" r="4" fill="#ffd166" ${L2}/>`).join('')}<path d="M36 80 L30 92 M64 80 L70 92" ${L3}/>`],
    ['robot', 'Robot', 'space', false,
      `<path d="M50 22 V8" ${L}/><circle cx="50" cy="7" r="5" fill="#ef476f" ${L3}/><rect x="6" y="44" width="10" height="20" rx="4" fill="#8d99ae" ${L3}/><rect x="84" y="44" width="10" height="20" rx="4" fill="#8d99ae" ${L3}/>
       <rect x="14" y="22" width="72" height="66" rx="20" fill="#c9d6df" ${L}/><rect x="24" y="34" width="52" height="34" rx="12" fill="#2b2b2b"/>
       <circle cx="40" cy="48" r="5" fill="#06d6a0"/><circle cx="60" cy="48" r="5" fill="#06d6a0"/><path d="M42 58 Q50 63 58 58" fill="none" stroke="#06d6a0" stroke-width="3" stroke-linecap="round"/>
       <ellipse cx="26" cy="76" rx="5" ry="3.2" fill="#ff8fab"/><ellipse cx="74" cy="76" rx="5" ry="3.2" fill="#ff8fab"/><circle cx="50" cy="78" r="4" fill="#ffd166" ${L2}/>`],
    ['comet', 'Golden Comet', 'space', true,
      `<path d="M40 40 Q20 30 2 34 Q18 44 30 52 Q12 58 4 72 Q26 66 42 64 Z" fill="#c77dff" ${L3}/><path d="M38 46 Q22 42 12 46 Q24 52 34 56 Z" fill="#4cc9f0"/>
       ${star(58, 52, 40, '#ffd166')}${star(58, 52, 26, '#ffe59a', false)}<g transform="translate(8 0)">${face(52, { cheekGap: 13, gap: 8 })}</g>${sparkles}`],
  ];

  const MACHINES = [
    { id: 'toys', name: 'Toy Box', color: '#ff8fab', dark: '#d94f7c', glass: '#fff0f6' },
    { id: 'sea', name: 'Ocean', color: '#4cc9f0', dark: '#1d8fbf', glass: '#e6f8ff' },
    { id: 'sweets', name: 'Candy Shop', color: '#c77dff', dark: '#8f4fd1', glass: '#f6edff' },
    { id: 'space', name: 'Star Station', color: '#3d348b', dark: '#241d5e', glass: '#1f1a4d' },
  ];
  const wrap = (inner) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  const LIST = TOYS.map(([id, name, machine, rare, art]) => ({ id, name, machine, rare, art, svg: wrap(art) }));
  for (const m of MACHINES) m.prizes = LIST.filter(p => p.machine === m.id).map(p => p.id);
  const byId = (id) => LIST.find(p => p.id === id) || null;
  // a not-yet-won toy: the same shape, dark gray all over (no face)
  function svg(id, gray) {
    const p = byId(id);
    if (!p) return '';
    if (!gray) return p.svg;
    return wrap(`<g opacity="0.55">${p.art.replace(/fill="(?!none)[^"]*"/g, 'fill="#8d99ae"').replace(/stroke="(?!#2b2b2b)[^"]*"/g, 'stroke="#8d99ae"')}</g>`);
  }
  // how many of each toy this player has won (from their arcade save)
  function won(save) {
    const g = save && save.games && save.games.claw;
    return (g && g.data && g.data.got) || {};
  }
  window.ClawPrizes = { MACHINES, LIST, byId, svg, won };
})();
