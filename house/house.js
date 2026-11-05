// =====================================================================
// My House (Keith, Nov 5): every player has a room to decorate.
//
// Coins: every trophy you win in any game drops 1 coin in your piggy bank
// (the trophy stays in the trophy room). Everyone starts with 3 coins.
//   coins = 3 + trophies (all games) - coins spent
//
// The room has spots (wall, floor, bed, rug, lamp...). Each spot has a few
// things to pick from. Tap a thing to try it in the room, tap it again (the
// green tick) to buy it. Things you own can be swapped back any time, free.
//
// Saved per player in the arcade save:  house: { spent, owned: [ids], placed: { spot: id } }
// Drawings are plain SVG in a 800 x 500 room (the floor starts at y = 330).
// =====================================================================
(function () {
  'use strict';
  const START_COINS = 3;
  const I = 'stroke="#2b2b2b" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"';
  const I3 = 'stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"';
  const FLOOR_Y = 330;

  // ---------------------------------------------------------------
  // The things you can buy. Each spot: { id, icon box for its button, items }
  // Each item: { id, price, draw() -> svg in room coordinates }
  // (price 0 = you start with it)
  // ---------------------------------------------------------------
  const wallPaint = (c, pattern) => () => {
    let s = `<rect x="0" y="0" width="800" height="${FLOOR_Y}" fill="${c}"/>`;
    if (pattern === 'stripes') for (let x = 0; x < 800; x += 60) s += `<rect x="${x}" y="0" width="26" height="${FLOOR_Y}" fill="#fff" opacity="0.35"/>`;
    if (pattern === 'dots') for (let y = 30; y < FLOOR_Y; y += 50) for (let x = (y / 50) % 2 ? 50 : 25; x < 800; x += 50) s += `<circle cx="${x}" cy="${y}" r="7" fill="#fff" opacity="0.55"/>`;
    if (pattern === 'stars') for (let y = 40; y < FLOOR_Y; y += 70) for (let x = (y / 70) % 2 ? 70 : 30; x < 800; x += 80) s += star(x, y, 10, '#fff', 0, 0.6);
    return s + `<rect x="0" y="${FLOOR_Y - 14}" width="800" height="14" fill="#fff" ${I3}/>`;   // the skirting board
  };
  const floorPaint = (c, kind) => () => {
    let s = `<rect x="0" y="${FLOOR_Y}" width="800" height="${500 - FLOOR_Y}" fill="${c}"/>`;
    if (kind === 'wood') for (let y = FLOOR_Y + 34; y < 500; y += 34) s += `<path d="M0 ${y} H800" stroke="#2b2b2b" stroke-width="2.5" opacity="0.35"/>` + [120, 340, 560, 730].map((x, i) => `<path d="M${x + (y / 34 % 2) * 90} ${y - 34} V${y}" stroke="#2b2b2b" stroke-width="2.5" opacity="0.35"/>`).join('');
    if (kind === 'check') for (let y = FLOOR_Y; y < 500; y += 40) for (let x = ((y - FLOOR_Y) / 40) % 2 ? 40 : 0; x < 800; x += 80) s += `<rect x="${x}" y="${y}" width="40" height="40" fill="#fff" opacity="0.6"/>`;
    if (kind === 'carpet') for (let y = FLOOR_Y + 12; y < 500; y += 24) for (let x = (y % 48 ? 10 : 30); x < 800; x += 40) s += `<circle cx="${x}" cy="${y}" r="3" fill="#2b2b2b" opacity="0.12"/>`;
    return s;
  };
  function star(x, y, r, fill, line = 3, op = 1) {
    let d = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + Math.PI * i / 5, rr = i % 2 ? r * 0.45 : r; d += (i ? 'L' : 'M') + (x + Math.cos(a) * rr).toFixed(1) + ' ' + (y + Math.sin(a) * rr).toFixed(1); }
    return `<path d="${d}Z" fill="${fill}" opacity="${op}" ${line ? `stroke="#2b2b2b" stroke-width="${line}" stroke-linejoin="round"` : ''}/>`;
  }
  const curtains = (c, starry) => () => {
    const side = (x0, dir) => `<path d="M${x0} 40 H${x0 + dir * 66} Q${x0 + dir * 40} 120 ${x0 + dir * 62} 214 H${x0} Z" fill="${c}" ${I}/>` +
      (starry ? star(x0 + dir * 28, 90, 9, '#ffd166', 2.5) + star(x0 + dir * 22, 160, 8, '#ffd166', 2.5) : `<path d="M${x0 + dir * 22} 44 Q${x0 + dir * 14} 130 ${x0 + dir * 22} 210" fill="none" stroke="#fff" stroke-width="5" opacity="0.5"/>`);
    return `<rect x="290" y="30" width="220" height="12" rx="6" fill="#8d5524" ${I3}/>` + side(296, 1) + side(504, -1);
  };
  const bed = (c) => () =>
    `<rect x="26" y="236" width="34" height="170" rx="12" fill="#c68b59" ${I}/><rect x="40" y="396" width="14" height="22" fill="#8d5524" ${I3}/><rect x="244" y="396" width="14" height="22" fill="#8d5524" ${I3}/>` +
    `<rect x="40" y="330" width="226" height="70" rx="16" fill="#fff" ${I}/><ellipse cx="96" cy="326" rx="40" ry="20" fill="#fff" ${I}/>` +
    `<path d="M120 314 H250 Q270 314 270 340 V398 H120 Z" fill="${c}" ${I}/><path d="M140 330 H250" stroke="#fff" stroke-width="6" opacity="0.6" stroke-linecap="round"/>` +
    star(190, 365, 12, '#fff', 0, 0.7);
  const rug = (kind) => () => {
    if (kind === 'round') return `<ellipse cx="400" cy="450" rx="170" ry="34" fill="#ef476f" ${I}/><ellipse cx="400" cy="450" rx="120" ry="22" fill="#ffd166" ${I3}/><ellipse cx="400" cy="450" rx="60" ry="10" fill="#ef476f" ${I3}/>`;
    if (kind === 'stripes') return `<rect x="240" y="418" width="320" height="64" rx="20" fill="#4cc9f0" ${I}/>` + [270, 330, 390, 450, 510].map(x => `<rect x="${x}" y="420" width="24" height="60" fill="#fff" opacity="0.7"/>`).join('') + `<rect x="240" y="418" width="320" height="64" rx="20" fill="none" ${I}/>`;
    return `<ellipse cx="400" cy="450" rx="170" ry="34" fill="#9b5de5" ${I}/><ellipse cx="400" cy="450" rx="135" ry="26" fill="#06d6a0" ${I3}/><ellipse cx="400" cy="450" rx="100" ry="18" fill="#ffd166" ${I3}/><ellipse cx="400" cy="450" rx="60" ry="10" fill="#ff5fa2" ${I3}/>`;   // rainbow
  };
  const lamp = (c) => () =>
    `<ellipse cx="736" cy="410" rx="34" ry="10" fill="#8d5524" ${I}/><rect x="731" y="200" width="10" height="210" fill="#8d99ae" ${I3}/>` +
    `<path d="M696 210 L708 140 H764 L776 210 Z" fill="${c}" ${I}/><path d="M712 160 H760" stroke="#fff" stroke-width="5" opacity="0.6" stroke-linecap="round"/>` +
    `<path d="M700 214 L680 300 H792 L772 214 Z" fill="#fff6c2" opacity="0.35"/>`;
  const plant = (kind) => () => {
    const pot = `<path d="M282 350 H348 L340 410 H290 Z" fill="#e07a5f" ${I}/><rect x="276" y="340" width="78" height="16" rx="6" fill="#e07a5f" ${I}/>`;
    if (kind === 'cactus') return `<rect x="298" y="240" width="34" height="104" rx="17" fill="#6cc04a" ${I}/><path d="M298 296 H284 Q276 296 276 286 V264 Q276 256 284 256 Q290 256 290 264 V280 H298" fill="#6cc04a" ${I}/><path d="M332 284 H344 Q352 284 352 274 V256 Q352 248 345 248 Q338 248 338 256 V270 H332" fill="#6cc04a" ${I}/>` + star(315, 236, 10, '#ff8fab', 3) + pot;
    if (kind === 'flower') return `<path d="M315 340 V270 M315 300 Q296 290 292 276 Q308 278 315 296 M315 316 Q334 306 340 292 Q322 294 315 312" fill="#6cc04a" ${I3}/>` +
      [[315, 250], [295, 262], [335, 262], [302, 240], [328, 240]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="12" fill="#ff8fab" ${I3}/>`).join('') + `<circle cx="315" cy="252" r="9" fill="#ffd166" ${I3}/>` + pot;
    return `<path d="M315 344 Q300 280 262 250 Q300 252 315 300 Q322 240 312 200 Q340 240 320 300 Q340 262 372 250 Q334 290 318 344 Z" fill="#2fa35a" ${I}/>` + pot;   // big leaves
  };
  const frame = (kind) => () => {
    let pic = '';
    if (kind === 'hills') pic = `<rect x="574" y="84" width="102" height="82" fill="#9fe0ff"/><path d="M574 166 L604 124 L626 146 L650 116 L676 150 V166 Z" fill="#6cc04a" ${I3}/><circle cx="600" cy="104" r="9" fill="#fff"/>`;
    else if (kind === 'heart') pic = `<rect x="574" y="84" width="102" height="82" fill="#ffd6ec"/><path d="M625 156 C596 136 590 120 598 108 C606 98 618 100 625 112 C632 100 644 98 652 108 C660 120 654 136 625 156 Z" fill="#ef476f" ${I3}/>`;
    else {   // your newest sticker!
      const st = Arcade.stickers && Arcade.stickers.list.filter(s => Arcade.stickers.has(s.id)).pop();
      pic = `<rect x="574" y="84" width="102" height="82" fill="#fff8e6"/>` + (st ? `<g transform="translate(590 84) scale(0.8)">${Arcade.stickers.svg(st, false)}</g>` : star(625, 125, 28, '#ffd166', 3));
    }
    return `<rect x="562" y="72" width="126" height="106" rx="8" fill="${kind === 'sticker' ? '#ffd166' : '#c68b59'}" ${I}/>` + pic + `<rect x="574" y="84" width="102" height="82" fill="none" ${I3}/>`;
  };
  // the trophy shelf shows (up to 5 of) your real trophies
  const shelf = (c) => () => {
    const n = Math.min(5, Arcade.stickers ? Arcade.stickers.trophyCount() : 0);
    let s = `<rect x="64" y="150" width="190" height="16" rx="5" fill="${c}" ${I}/><path d="M84 166 L96 186 M234 166 L222 186" ${I}/>`;
    for (let i = 0; i < n; i++) {
      const x = 86 + i * 36;
      s += `<path d="M${x} 112 H${x + 26} V124 A13 13 0 0 1 ${x} 124 Z" fill="#ffc93c" ${I3}/><rect x="${x + 9}" y="136" width="8" height="8" fill="#ffc93c" ${I3}/><rect x="${x + 3}" y="143" width="20" height="7" rx="2" fill="#8d5524" ${I3}/>`;
    }
    return s;
  };
  const garland = (kind) => () => {
    const pts = []; for (let i = 0; i <= 12; i++) { const x = 40 + i * 60; pts.push([x, 12 + Math.sin(Math.PI * i / 12) * 34]); }
    let s = `<path d="M${pts.map(p => p.join(' ')).join(' L')}" fill="none" stroke="#2b2b2b" stroke-width="3"/>`;
    const cols = ['#ef476f', '#ffd166', '#06d6a0', '#4cc9f0', '#9b5de5'];
    pts.slice(0, 12).forEach(([x, y], i) => {
      const [x2, y2] = pts[i + 1], mx = (x + x2) / 2, my = (y + y2) / 2;
      if (kind === 'flags') s += `<path d="M${x + 6} ${y + 1} L${x2 - 6} ${y2 - 1} L${mx} ${my + 34} Z" fill="${cols[i % 5]}" ${I3}/>`;
      else if (kind === 'lights') s += `<rect x="${mx - 5}" y="${my}" width="10" height="7" fill="#555" ${I3}/><ellipse cx="${mx}" cy="${my + 18}" rx="9" ry="13" fill="${cols[i % 5]}" ${I3}/><ellipse cx="${mx - 3}" cy="${my + 14}" rx="3" ry="4" fill="#fff" opacity="0.7"/>`;
      else s += `<path d="M${mx} ${my} V${my + 14}" stroke="#2b2b2b" stroke-width="2"/>` + star(mx, my + 26, 13, cols[i % 5], 3);
    });
    return s;
  };
  const pet = (kind) => () => {
    const cushion = (c) => `<ellipse cx="545" cy="420" rx="62" ry="22" fill="${c}" ${I}/><ellipse cx="545" cy="412" rx="46" ry="13" fill="#fff" opacity="0.4"/>`;
    const eyes = (x, y) => `<circle cx="${x - 9}" cy="${y}" r="4" fill="#2b2b2b"/><circle cx="${x + 9}" cy="${y}" r="4" fill="#2b2b2b"/><circle cx="${x - 7.5}" cy="${y - 1.5}" r="1.5" fill="#fff"/><circle cx="${x + 10.5}" cy="${y - 1.5}" r="1.5" fill="#fff"/>`;
    if (kind === 'fish') return `<rect x="500" y="404" width="90" height="16" rx="5" fill="#8d5524" ${I3}/><path d="M512 404 Q500 340 545 330 Q590 340 578 404 Z" fill="#bde9ff" opacity="0.8" ${I}/><path d="M514 360 H576" stroke="#4cc9f0" stroke-width="4"/>` +
      `<path d="M530 378 C536 366 556 366 562 378 C556 390 536 390 530 378 Z M530 378 L520 370 L520 386 Z" fill="#ff8c42" ${I3}/><circle cx="552" cy="376" r="2.5" fill="#2b2b2b"/>`;
    if (kind === 'kitty') return cushion('#ff8fab') + `<path d="M520 404 Q518 372 545 370 Q572 372 570 404 Z" fill="#ffb347" ${I}/><path d="M524 372 L528 352 L540 366 M566 372 L562 352 L550 366" fill="#ffb347" ${I3}/>` + eyes(545, 386) + `<path d="M570 400 Q592 396 590 380" fill="none" ${I}/>`;
    return cushion('#4cc9f0') + `<path d="M518 404 Q516 370 545 368 Q574 370 572 404 Z" fill="#e0b984" ${I}/><path d="M520 374 Q506 380 510 398 Q520 396 524 382 M570 374 Q584 380 580 398 Q570 396 566 382" fill="#8d5524" ${I3}/>` + eyes(545, 384) + `<ellipse cx="545" cy="394" rx="5" ry="4" fill="#2b2b2b"/>`;   // puppy
  };
  const toy = (kind) => () => {
    if (kind === 'ball') return `<circle cx="655" cy="430" r="30" fill="#ef476f" ${I}/><path d="M627 422 Q655 440 683 422" fill="none" stroke="#fff" stroke-width="8"/><path d="M627 422 Q655 440 683 422" fill="none" ${I3}/>`;
    if (kind === 'blocks') return `<rect x="616" y="414" width="36" height="36" rx="5" fill="#4cc9f0" ${I}/><rect x="654" y="414" width="36" height="36" rx="5" fill="#ffd166" ${I}/><rect x="634" y="376" width="36" height="36" rx="5" fill="#06d6a0" ${I}/>` +
      `<text x="634" y="441" font-size="22" font-weight="900" text-anchor="middle" fill="#2b2b2b" font-family="Arial Black, sans-serif">A</text><text x="672" y="441" font-size="22" font-weight="900" text-anchor="middle" fill="#2b2b2b" font-family="Arial Black, sans-serif">B</text>`;
    return `<rect x="626" y="390" width="58" height="52" rx="10" fill="#8d99ae" ${I}/><rect x="634" y="350" width="42" height="36" rx="8" fill="#c9d6df" ${I}/><circle cx="646" cy="366" r="5" fill="#06d6a0"/><circle cx="664" cy="366" r="5" fill="#06d6a0"/>` +
      `<path d="M655 350 V336" ${I3}/><circle cx="655" cy="333" r="5" fill="#ef476f" ${I3}/><rect x="640" y="404" width="30" height="16" rx="4" fill="#ffd166" ${I3}/><rect x="630" y="440" width="14" height="10" fill="#555" ${I3}/><rect x="666" y="440" width="14" height="10" fill="#555" ${I3}/>`;   // robot
  };

  const SPOTS = [
    { id: 'wall', box: [0, 0, 800, 330], swatch: true, items: [
      { id: 'wall-cream', price: 0, draw: wallPaint('#fff1d0') }, { id: 'wall-pink', price: 1, draw: wallPaint('#ffc8dd') },
      { id: 'wall-sky', price: 1, draw: wallPaint('#bde0fe') }, { id: 'wall-mint', price: 1, draw: wallPaint('#b9fbc0') },
      { id: 'wall-stripes', price: 2, draw: wallPaint('#ffd166', 'stripes') }, { id: 'wall-dots', price: 2, draw: wallPaint('#c77dff', 'dots') },
      { id: 'wall-stars', price: 3, draw: wallPaint('#3d348b', 'stars') }] },
    { id: 'floor', box: [0, 330, 800, 170], swatch: true, items: [
      { id: 'floor-wood', price: 0, draw: floorPaint('#d9a066', 'wood') }, { id: 'floor-check', price: 1, draw: floorPaint('#ef476f', 'check') },
      { id: 'floor-carpet', price: 1, draw: floorPaint('#8ecae6', 'carpet') }, { id: 'floor-grass', price: 2, draw: floorPaint('#7bd389', 'carpet') }] },
    { id: 'bed', box: [20, 230, 260, 200], items: [
      { id: 'bed-red', price: 2, draw: bed('#ef476f') }, { id: 'bed-blue', price: 2, draw: bed('#4cc9f0') }, { id: 'bed-purple', price: 3, draw: bed('#9b5de5') }] },
    { id: 'rug', box: [225, 410, 350, 80], items: [
      { id: 'rug-round', price: 1, draw: rug('round') }, { id: 'rug-stripes', price: 1, draw: rug('stripes') }, { id: 'rug-rainbow', price: 2, draw: rug('rainbow') }] },
    { id: 'curtains', box: [285, 25, 230, 195], items: [
      { id: 'curtains-pink', price: 1, draw: curtains('#ff8fab') }, { id: 'curtains-green', price: 1, draw: curtains('#06d6a0') }, { id: 'curtains-stars', price: 2, draw: curtains('#3d348b', true) }] },
    { id: 'lamp', box: [670, 130, 125, 290], items: [
      { id: 'lamp-yellow', price: 1, draw: lamp('#ffd166') }, { id: 'lamp-pink', price: 1, draw: lamp('#ff8fab') }, { id: 'lamp-green', price: 1, draw: lamp('#06d6a0') }] },
    { id: 'plant', box: [255, 195, 125, 220], items: [
      { id: 'plant-cactus', price: 1, draw: plant('cactus') }, { id: 'plant-flower', price: 1, draw: plant('flower') }, { id: 'plant-leaf', price: 2, draw: plant('leaf') }] },
    { id: 'frame', box: [555, 65, 140, 120], items: [
      { id: 'frame-hills', price: 1, draw: frame('hills') }, { id: 'frame-heart', price: 1, draw: frame('heart') }, { id: 'frame-sticker', price: 2, draw: frame('sticker') }] },
    { id: 'shelf', box: [55, 100, 210, 92], items: [
      { id: 'shelf-wood', price: 2, draw: shelf('#c68b59') }, { id: 'shelf-white', price: 2, draw: shelf('#ffffff') }] },
    { id: 'garland', box: [30, 0, 740, 80], items: [
      { id: 'garland-flags', price: 1, draw: garland('flags') }, { id: 'garland-lights', price: 2, draw: garland('lights') }, { id: 'garland-stars', price: 2, draw: garland('stars') }] },
    { id: 'pet', box: [478, 325, 134, 125], items: [
      { id: 'pet-fish', price: 2, draw: pet('fish') }, { id: 'pet-kitty', price: 3, draw: pet('kitty') }, { id: 'pet-puppy', price: 3, draw: pet('puppy') }] },
    { id: 'toy', box: [608, 325, 92, 130], items: [
      { id: 'toy-ball', price: 1, draw: toy('ball') }, { id: 'toy-blocks', price: 1, draw: toy('blocks') }, { id: 'toy-robot', price: 2, draw: toy('robot') }] },
  ];
  // the order things are drawn in the room (back to front)
  const LAYERS = ['wall', 'garland', 'curtains', 'frame', 'shelf', 'floor', 'rug', 'bed', 'plant', 'lamp', 'toy', 'pet'];
  const itemById = (id) => { for (const sp of SPOTS) for (const it of sp.items) if (it.id === id) return { spot: sp, item: it }; return null; };

  // ---- this player's house ----
  function house() {
    const d = Arcade.store.load();
    if (!d.house) d.house = {};
    for (const [k, v] of [['spent', 0], ['owned', []], ['placed', {}]]) if (d.house[k] == null) d.house[k] = v;
    for (const sp of SPOTS) for (const it of sp.items) if (!it.price && !d.house.owned.includes(it.id)) d.house.owned.push(it.id);   // the free things
    if (!d.house.placed.wall) d.house.placed.wall = 'wall-cream';
    if (!d.house.placed.floor) d.house.placed.floor = 'floor-wood';
    return d.house;
  }
  const coins = () => START_COINS + (Arcade.stickers ? Arcade.stickers.trophyCount() : 0) - house().spent;

  // ---- pictures for the buttons ----
  const COIN = `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19" fill="#ffc93c" stroke="#2b2b2b" stroke-width="4"/><circle cx="24" cy="24" r="12" fill="none" stroke="#e09f3e" stroke-width="3"/><path d="M24 16 L26.5 21.5 L32 22 L28 26 L29 32 L24 29 L19 32 L20 26 L16 22 L21.5 21.5 Z" fill="#fff"/></svg>`;
  const TICK = `<svg viewBox="0 0 48 48"><path d="M8 26 L20 37 L40 12" fill="none" stroke="#2b2b2b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const NONE = `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="17" fill="#fff" stroke="#2b2b2b" stroke-width="4"/><path d="M12 36 L36 12" stroke="#ef476f" stroke-width="5" stroke-linecap="round"/></svg>`;
  // a small picture of one thing: the room drawing, cropped around its spot
  function thumb(sp, it) {
    const [x, y, w, h] = sp.box;
    if (sp.swatch) {    // wall paint / floors: a square sample
      const size = Math.min(w, h);
      return `<svg viewBox="${x + 40} ${y + (sp.id === 'floor' ? 0 : 60)} ${size * 0.8} ${size * 0.8}">${it.draw()}</svg>`;
    }
    const pad = 8, s = Math.max(w, h) + pad * 2;
    return `<svg viewBox="${x + w / 2 - s / 2} ${y + h / 2 - s / 2} ${s} ${s}">${it.draw()}</svg>`;
  }

  // the player's animal standing in the room (face from the player list + a little body)
  function avatar() {
    const me = Arcade.profiles.active();
    return `<g id="me" class="me"><ellipse cx="400" cy="452" rx="58" ry="12" fill="#000" opacity="0.18"/>` +
      `<rect x="362" y="356" width="76" height="92" rx="34" fill="${me.color}" ${I}/><ellipse cx="400" cy="402" rx="22" ry="26" fill="#fff" opacity="0.5"/>` +
      `<ellipse cx="378" cy="448" rx="18" ry="10" fill="${me.color}" ${I}/><ellipse cx="422" cy="448" rx="18" ry="10" fill="${me.color}" ${I}/>` +
      `<g transform="translate(330 236) scale(1.4)">${Arcade.profiles.avatar(me).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>` +
      `<circle cx="400" cy="306" r="68" fill="none" ${I}/></g>`;
  }

  // ---------------------------------------------------------------
  // The page
  // ---------------------------------------------------------------
  const room = document.getElementById('room'), tabs = document.getElementById('tabs'), shop = document.getElementById('shop'), coinEl = document.getElementById('coins');
  let spot = 'bed';          // which spot's things are showing
  let trying = null;         // a thing being tried in the room (not bought yet)

  function drawRoom() {
    const h = house();
    const placed = Object.assign({}, h.placed);
    if (trying) placed[itemById(trying).spot.id] = trying;
    let s = '';
    for (const id of LAYERS) {
      // the window sits on the wall, behind the curtains
      if (id === 'curtains') s += `<rect x="320" y="50" width="160" height="150" rx="10" fill="#9fe0ff" ${I}/><path d="M400 50 V200 M320 125 H480" ${I}/><ellipse cx="356" cy="84" rx="20" ry="9" fill="#fff"/><ellipse cx="444" cy="160" rx="22" ry="9" fill="#fff"/>`;
      const it = placed[id] && itemById(placed[id]);
      if (it) s += `<g class="${placed[id] === trying ? 'trying' : ''}" data-layer="${id}">${it.item.draw()}</g>`;
      if (id === 'rug') s += avatar();       // you stand on the rug, in front of the bed
    }
    room.innerHTML = `<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">${s}</svg>`;
    room.querySelector('#me').addEventListener('click', () => { Arcade.audio.resume(); Arcade.sfx('jump'); const m = room.querySelector('#me'); m.classList.remove('hop'); void m.getBoundingClientRect(); m.classList.add('hop'); });
    coinEl.innerHTML = COIN + `<span>${coins()}</span>`;
  }

  function drawTabs() {
    tabs.innerHTML = SPOTS.map(sp => {
      const h = house(), it = itemById(h.placed[sp.id] || '') || { item: sp.items[0] };
      return `<button type="button" class="tab${sp.id === spot ? ' on' : ''}" data-spot="${sp.id}" aria-label="${sp.id}">${thumb(sp, it.item)}</button>`;
    }).join('');
  }

  function drawShop() {
    const sp = SPOTS.find(s => s.id === spot), h = house();
    let html = '';
    // "nothing here" (not for the wall and floor)
    if (!sp.swatch) html += `<button type="button" class="item${!h.placed[sp.id] && !trying ? ' on' : ''}" data-none="1" aria-label="Nothing">${NONE}</button>`;
    for (const it of sp.items) {
      const own = h.owned.includes(it.id), on = h.placed[sp.id] === it.id && !trying, tr = trying === it.id;
      const tag = own ? `<span class="tag own">${TICK}</span>` : `<span class="tag">${COIN}<b>${it.price}</b></span>`;
      html += `<button type="button" class="item${on ? ' on' : ''}${tr ? ' try' : ''}${!own && it.price > coins() ? ' poor' : ''}" data-item="${it.id}">${thumb(sp, it)}${tag}${tr ? `<span class="buy">${TICK}</span>` : ''}</button>`;
    }
    shop.innerHTML = html;
  }
  function redraw() { drawRoom(); drawTabs(); drawShop(); }

  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('[data-spot]'); if (!b) return;
    Arcade.audio.resume(); Arcade.sfx('pop');
    spot = b.dataset.spot; trying = null; redraw();
  });
  shop.addEventListener('click', (e) => {
    const b = e.target.closest('.item'); if (!b) return;
    Arcade.audio.resume();
    const h = house();
    if (b.dataset.none) { delete h.placed[spot]; trying = null; Arcade.store.save(); Arcade.sfx('swish'); redraw(); return; }
    const id = b.dataset.item, it = itemById(id).item;
    if (h.owned.includes(id)) {                  // yours already: put it in the room
      h.placed[spot] = id; trying = null; Arcade.store.save(); Arcade.sfx('click'); redraw(); return;
    }
    if (trying !== id) {                          // first tap: try it in the room
      trying = id; Arcade.sfx('pop'); redraw(); return;
    }
    // second tap: buy it (if you have enough coins)
    if (it.price > coins()) {
      Arcade.sfx('bonk');
      coinEl.classList.remove('shake'); void coinEl.offsetWidth; coinEl.classList.add('shake');
      const how = document.getElementById('how');
      how.classList.add('show'); clearTimeout(how.t); how.t = setTimeout(() => how.classList.remove('show'), 2500);
      return;
    }
    h.spent += it.price; h.owned.push(id); h.placed[spot] = id; trying = null;
    Arcade.store.save();
    Arcade.sfx('coin'); setTimeout(() => Arcade.sfx('star'), 150);
    Arcade.confetti(60);
    redraw();
    if (Arcade.stickers) Arcade.stickers.check();       // (the "My House" sticker!)
  });

  document.getElementById('home').innerHTML = Arcade.icons.home;
  // how to get coins: trophy -> coin (shown when you try to buy without enough coins)
  document.getElementById('how').innerHTML = Arcade.icons.trophy + `<svg viewBox="0 0 48 48"><path d="M8 24 H36 M28 14 L38 24 L28 34" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 24 H36 M28 14 L38 24 L28 34" fill="none" stroke="#2b2b2b" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>` + COIN;
  document.getElementById('how').addEventListener('click', (e) => e.currentTarget.classList.remove('show'));
  redraw();

  // test hooks
  window.__houseState = () => ({ coins: coins(), spent: house().spent, owned: house().owned.slice(), placed: Object.assign({}, house().placed), trying, spot, spots: SPOTS.map(s => s.id) });
})();
