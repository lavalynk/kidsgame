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

  window.Arcade = window.Arcade || {};
  Arcade.mascot = { name: 'Bop', body, lids, armL: arm(true), armR: arm(false), bubble };
})();
