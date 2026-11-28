// =====================================================================
// Bop, the arcade's mascot (Nov 25, new plan point 10, part 1: "a friendly arcade mascot that waves hello
// and points to today's surprise").
//
// Bop is our own character: a round, sunny-yellow buddy with a pink star on an antenna and a light
// tummy. He's drawn in PIECES so the canvas menus can move them (see mascot() in
// arcade/canvasmenu.js): the body (with the face), the eyelids (shown for a blink), and two arms that turn
// at the shoulder: `armL` points LEFT (it waves), `armR` points RIGHT (it points at the speech bubble).
// All pieces share one grid: the body is 200 x 220; an arm is 80 x 40 with its shoulder at the end that
// sits behind the body.
//
// Arcade.mascot.bubble(svg) = a speech bubble (120 x 100, its tail on the left, toward Bop's hand) with a
// picture in it (the hub puts today's surprise present in it).
//
// Seasons (Nov 25, point 10, part 2: "seasonal hub looks"): Arcade.season() = 'winter' | 'spring' | 'summer' |
// 'autumn' from the device's date (Dec-Feb winter, Mar-May spring, Jun-Aug summer, Sep-Nov autumn). Tests can
// pretend: localStorage 'kidsArcade.testSeason' (a season name, or 'off'), or 'kidsArcade.testDay' (a date).
// Arcade.mascot.dress[season] = what Bop wears then: one more piece (200 x 220, the body's grid) drawn on top of
// his body: earmuffs + a striped scarf (winter), a flower crown (spring), sunglasses up on his head (summer),
// a cozy scarf + a leaf that landed on his head (autumn). The falling snow / leaves / petals / bubbles on the
// hub are painted in arcade/canvasmenu.js (seasonFx()).
// =====================================================================
(function () {
  'use strict';
  const INK = '#2b2b2b';
  const YELLOW = '#ffd166', LIGHT = '#fff1b8', DEEP = '#f4a52c';
  const svg = (w, h, body) => `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

  // the body + face (feet, antenna, round body with a shine, a lighter tummy, eyes, cheeks, smile)
  const body = svg(200, 220,
    `<defs><radialGradient id="bopg" cx="0.36" cy="0.3" r="0.75"><stop offset="0" stop-color="${LIGHT}"/>` +
    `<stop offset="0.55" stop-color="${YELLOW}"/><stop offset="1" stop-color="${DEEP}"/></radialGradient>` +
    `<radialGradient id="bopb" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#ff8fa3"/><stop offset="1" stop-color="#e63950"/></radialGradient></defs>` +
    // feet (behind the body)
    `<ellipse cx="72" cy="198" rx="27" ry="15" fill="#ff9f1c" stroke="${INK}" stroke-width="7"/>` +
    `<ellipse cx="128" cy="198" rx="27" ry="15" fill="#ff9f1c" stroke="${INK}" stroke-width="7"/>` +
    // antenna + its star
    `<path d="M100 46 Q96 30 104 18" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>` +
    `<path d="M104 2 L109 12 L120 13 L112 20 L114 31 L104 26 L94 31 L96 20 L88 13 L99 12 Z" fill="#ff5fa2" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` +
    // the body
    `<circle cx="100" cy="118" r="76" fill="url(#bopg)" stroke="${INK}" stroke-width="8"/>` +
    `<ellipse cx="70" cy="74" rx="20" ry="11" fill="#fff" opacity="0.7" transform="rotate(-30 70 74)"/>` +
    // a lighter tummy
    `<ellipse cx="100" cy="166" rx="34" ry="20" fill="#fff1b8" opacity="0.85"/>` +
    // eyes with shines
    `<ellipse cx="74" cy="106" rx="15" ry="19" fill="${INK}"/><ellipse cx="126" cy="106" rx="15" ry="19" fill="${INK}"/>` +
    `<circle cx="69" cy="98" r="6" fill="#fff"/><circle cx="121" cy="98" r="6" fill="#fff"/>` +
    `<circle cx="79" cy="114" r="2.5" fill="#fff"/><circle cx="131" cy="114" r="2.5" fill="#fff"/>` +
    // cheeks
    `<ellipse cx="52" cy="132" rx="13" ry="8" fill="#ff8fab"/><ellipse cx="148" cy="132" rx="13" ry="8" fill="#ff8fab"/>` +
    // an open smile with a tongue
    `<path d="M76 127 Q100 133 124 127 Q118 156 100 156 Q82 156 76 127 Z" fill="#c9184a" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>` +
    `<path d="M88 146 Q100 138 112 146 Q106 153 100 153 Q94 153 88 146 Z" fill="#ff8fab"/>`);

  // the eyelids (a blink): body-colored covers over the eyes with a happy closed-eye line
  const lids = svg(200, 220,
    `<ellipse cx="74" cy="106" rx="18" ry="22" fill="${YELLOW}"/><ellipse cx="126" cy="106" rx="18" ry="22" fill="${YELLOW}"/>` +
    `<path d="M60 108 Q74 118 88 108" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>` +
    `<path d="M112 108 Q126 118 140 108" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`);

  // an arm pointing RIGHT: shoulder at the left end, a round mitten hand at the right
  const arm = (flip) => svg(80, 40,
    `<g${flip ? ' transform="translate(80 0) scale(-1 1)"' : ''}>` +
    `<path d="M8 20 L52 20" stroke="${INK}" stroke-width="28" stroke-linecap="round"/>` +
    `<path d="M8 20 L52 20" stroke="${YELLOW}" stroke-width="15" stroke-linecap="round"/>` +
    `<circle cx="61" cy="20" r="15" fill="${YELLOW}" stroke="${INK}" stroke-width="6"/>` +
    `<ellipse cx="57" cy="14" rx="5" ry="3" fill="#fff" opacity="0.7"/></g>`);

  // a speech bubble with a picture in it (tail on the left, toward Bop's pointing hand)
  const bubble = (pic) => {
    const inner = String(pic || '').replace(/<svg\b[^>]*?(viewBox="[^"]*")[^>]*>/, '<svg x="34" y="12" width="74" height="74" $1>');
    return svg(120, 100,
      `<path d="M30 10 H108 Q116 10 116 18 V80 Q116 90 106 90 H40 Q30 90 30 80 V62 L6 66 L30 44 V18 Q30 10 38 10 Z" ` +
      `fill="#fff" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>` + inner);
  };

  // ---- what Bop wears each season (drawn over his body; the same 200 x 220 grid) ----
  // a scarf round his middle: the band is cut to the inside of his body outline, a tail hangs down on the right
  const scarf = (c1, c2) =>
    `<defs><clipPath id="bopsc${c1.slice(1)}"><circle cx="100" cy="118" r="72"/></clipPath></defs>` +
    `<path d="M136 172 L160 214 L138 222 L120 180 Z" fill="${c1}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>` +
    `<path d="M144 194 L128 201 M151 207 L134 214" stroke="${c2}" stroke-width="7"/>` +
    `<g clip-path="url(#bopsc${c1.slice(1)})"><path d="M10 146 Q100 206 190 146 L190 176 Q100 236 10 176 Z" fill="${c1}" stroke="${INK}" stroke-width="6"/>` +
    `<path d="M58 166 L52 192 M100 175 L100 204 M142 166 L148 192" stroke="${c2}" stroke-width="7"/></g>`;
  // a little five-petal flower
  const flower = (x, y, c) => [0, 72, 144, 216, 288].map(a => {
    const r = a * Math.PI / 180;
    return `<circle cx="${(x + Math.sin(r) * 8).toFixed(1)}" cy="${(y - Math.cos(r) * 8).toFixed(1)}" r="7" fill="${c}" stroke="${INK}" stroke-width="3"/>`;
  }).join('') + `<circle cx="${x}" cy="${y}" r="5.5" fill="#ffd166" stroke="${INK}" stroke-width="3"/>`;
  const dress = {
    winter: svg(200, 220,
      // earmuffs: a band over his head (the antenna pokes up behind it) and two fluffy pink muffs
      `<path d="M34 104 Q30 30 100 30 Q170 30 166 104" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>` +
      `<path d="M34 104 Q30 30 100 30 Q170 30 166 104" fill="none" stroke="#8ecae6" stroke-width="6" stroke-linecap="round"/>` +
      `<circle cx="30" cy="112" r="20" fill="#ff8fab" stroke="${INK}" stroke-width="6"/><circle cx="25" cy="105" r="6" fill="#fff" opacity="0.7"/>` +
      `<circle cx="170" cy="112" r="20" fill="#ff8fab" stroke="${INK}" stroke-width="6"/><circle cx="165" cy="105" r="6" fill="#fff" opacity="0.7"/>` +
      scarf('#e63950', '#ffffff')),
    spring: svg(200, 220,
      `<path d="M44 76 Q100 30 156 76" fill="none" stroke="#2a9d5c" stroke-width="7" stroke-linecap="round"/>` +
      flower(48, 74, '#ffafcc') + flower(74, 52, '#a0c4ff') + flower(126, 52, '#ffafcc') + flower(152, 74, '#caffbf')),
    summer: svg(200, 220,
      // sunglasses pushed up on his head
      `<path d="M50 62 L150 62" stroke="${INK}" stroke-width="6"/>` +
      `<rect x="54" y="50" width="40" height="26" rx="12" fill="#3a86ff" stroke="${INK}" stroke-width="6"/>` +
      `<rect x="106" y="50" width="40" height="26" rx="12" fill="#3a86ff" stroke="${INK}" stroke-width="6"/>` +
      `<path d="M62 58 L72 58 M114 58 L124 58" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.85"/>`),
    autumn: svg(200, 220,
      // a leaf that landed on his head
      `<g transform="rotate(-28 60 56)"><path d="M60 34 Q82 50 60 80 Q38 50 60 34 Z" fill="#f77f00" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` +
      `<path d="M60 42 L60 88" stroke="${INK}" stroke-width="4" stroke-linecap="round"/></g>` +
      scarf('#e76f51', '#ffd166')),
  };

  // (which season it is: Arcade.season() lives in arcade/shared.js since Nov 28, so every game page has it
  //  for the Winter Wonderland looks + places)

  window.Arcade = window.Arcade || {};
  Arcade.mascot = { name: 'Bop', body, lids, armL: arm(true), armR: arm(false), bubble, dress };
})();
