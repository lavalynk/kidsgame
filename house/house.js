// =====================================================================
// My House (Keith, Nov 5; more rooms, moving things + visiting friends Nov 8).
//
// Coins: every trophy you win in any game drops 1 coin in your piggy bank
// (the trophy stays in the trophy room). Everyone starts with 3 coins, and some
// games give bonus coins (Turbo Bike: 1 for every 25 track coins, the Daily
// Surprise: 2 a day).
//   coins = 3 + trophies (all games) + bonus - coins spent
//
// Three rooms: the Bedroom, the Garden and the Garage (the garage shows the
// car you drive in Mini RC Racers: rc.js saves a picture of it as garagePic).
// Each room has spots (wall, floor, bed, tree, car stand...). Each spot has a
// few things to pick from. Tap a thing to try it in the room, tap it again
// (the green tick) to buy it. Things you own can be swapped back any time, free.
// Drag anything in the room (even your animal) to move it somewhere else.
//
// Friends: make a room / join with 3 pictures (arcade/net.js), then tap a
// friend's animal to visit their house. Your animal walks into their house on
// their phone too, and tapping an animal makes it hop on every phone.
//
// Saved per player in the arcade save:
//   house: { spent, owned: [ids], placed: { spot: id ('' = nothing) }, pos: { spot: [dx, dy] }, room }
// (spot ids are different in every room: bedroom 'bed', garden 'g-tree', garage 'c-door'...)
// Drawings are plain SVG in a 800 x 500 room (the floor starts at y = 330).
// =====================================================================
(function () {
  'use strict';
  const START_COINS = 3;
  const I = 'stroke="#2b2b2b" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"';
  const I3 = 'stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"';
  const FLOOR_Y = 330;
  // What the drawings need to know about the house's owner (you, or the friend
  // you're visiting): trophies for the shelf, the newest sticker for the frame,
  // the RC car picture and best cup for the garage. Set by drawRoom().
  let CTX = { trophies: 0, sticker: null, car: null, cup: null };

  // ---------------------------------------------------------------
  // THE BEDROOM. Each spot: { id, box (x, y, w, h: for its button), items }
  // Each item: { id, price, draw() -> svg in room coordinates }   (price 0 = you start with it)
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
      const st = CTX.sticker && Arcade.stickers && Arcade.stickers.list.find(s => s.id === CTX.sticker);   // (the owner's newest sticker)
      pic = `<rect x="574" y="84" width="102" height="82" fill="#fff8e6"/>` + (st ? `<g transform="translate(590 84) scale(0.8)">${Arcade.stickers.svg(st, false)}</g>` : star(625, 125, 28, '#ffd166', 3));
    }
    return `<rect x="562" y="72" width="126" height="106" rx="8" fill="${kind === 'sticker' ? '#ffd166' : '#c68b59'}" ${I}/>` + pic + `<rect x="574" y="84" width="102" height="82" fill="none" ${I3}/>`;
  };
  // the trophy shelf shows (up to 5 of) your real trophies
  const shelf = (c) => () => {
    const n = Math.min(5, CTX.trophies || 0);
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


  // ---------------------------------------------------------------
  // THE GARDEN (the grass starts at y = 330, like the bedroom floor)
  // ---------------------------------------------------------------
  // a fluffy cloud around (x, y), s = size
  const cloud = (x, y, s, c = '#fff') => `<path transform="translate(${x} ${y}) scale(${s})" d="M-60 20 C-82 20 -82 -8 -52 -8 C-52 -40 -6 -46 4 -20 C20 -40 60 -30 56 -2 C84 -2 84 20 60 20 Z" fill="${c}" ${I3}/>`;
  const sky = (kind) => () => {
    const H = FLOOR_Y + 10;
    if (kind === 'night') {
      let s = `<rect x="0" y="0" width="800" height="${H}" fill="#2a1e66"/>`;
      [[60, 60], [170, 120], [250, 40], [420, 90], [520, 30], [560, 150], [120, 220], [330, 200], [470, 240], [760, 200]].forEach(([x, y], i) => { s += star(x, y, i % 3 ? 7 : 11, '#ffd166', 2.5); });
      return s + `<path d="M690 36 A50 50 0 1 0 740 116 A40 40 0 1 1 690 36 Z" fill="#fff3b0" ${I3}/>`;     // a moon (never a sun)
    }
    if (kind === 'sunset') return `<rect x="0" y="0" width="800" height="${H}" fill="#ffc8dd"/><rect x="0" y="150" width="800" height="${H - 150}" fill="#ffd6a5"/><rect x="0" y="250" width="800" height="${H - 250}" fill="#ffb4a2"/>` + cloud(150, 80, 0.8, '#fff0f6') + cloud(600, 120, 1, '#fff0f6');
    if (kind === 'rainbow') return `<rect x="0" y="0" width="800" height="${H}" fill="#bde0fe"/>` +
      ['#ef476f', '#ff8c42', '#ffd166', '#06d6a0', '#4cc9f0', '#9b5de5'].map((c, i) => `<path d="M${130 + i * 22} ${H} A${270 - i * 22} ${250 - i * 22} 0 0 1 ${670 - i * 22} ${H}" fill="none" stroke="${c}" stroke-width="22"/>`).join('') +
      cloud(150, 300, 1.1) + cloud(650, 300, 1.1);
    return `<rect x="0" y="0" width="800" height="${H}" fill="#9fe0ff"/>` + cloud(140, 70, 0.9) + cloud(470, 120, 0.7) + cloud(700, 50, 0.8);   // a blue day
  };
  const ground = (c, kind) => () => {
    let s = `<rect x="0" y="${FLOOR_Y}" width="800" height="${500 - FLOOR_Y}" fill="${c}"/>`;
    for (let y = FLOOR_Y + 30; y < 500; y += 40) for (let x = (y / 40) % 2 ? 30 : 70; x < 800; x += 90) {
      if (kind === 'grass') s += `<path d="M${x - 8} ${y + 8} L${x - 4} ${y - 6} L${x} ${y + 8} L${x + 4} ${y - 8} L${x + 8} ${y + 8}" fill="none" stroke="#2fa35a" stroke-width="3" stroke-linejoin="round"/>`;
      if (kind === 'meadow') s += `<circle cx="${x}" cy="${y}" r="7" fill="${['#ff8fab', '#fff', '#ffd166'][(x + y) % 3]}" stroke="#2b2b2b" stroke-width="2"/><circle cx="${x}" cy="${y}" r="2.5" fill="#ff8c42"/>`;
      if (kind === 'sand') s += `<circle cx="${x}" cy="${y}" r="3" fill="#c68b59" opacity="0.5"/><circle cx="${x + 30}" cy="${y + 12}" r="2" fill="#c68b59" opacity="0.5"/>`;
      if (kind === 'snow') s += `<path d="M${x - 7} ${y} H${x + 7} M${x} ${y - 7} V${y + 7}" stroke="#9fe0ff" stroke-width="3" stroke-linecap="round"/>`;
    }
    return s + `<path d="M0 ${FLOOR_Y} H800" ${I3}/>`;
  };
  const fence = (kind) => () => {
    if (kind === 'hedge') {
      let d = 'M0 345 V285'; for (let x = 0; x < 800; x += 50) d += ` Q${x + 25} 250 ${x + 50} 285`;
      return `<path d="${d} V345 Z" fill="#2fa35a" ${I}/>` + [60, 210, 380, 560, 720].map(x => `<circle cx="${x}" cy="305" r="6" fill="#ff8fab" stroke="#2b2b2b" stroke-width="2"/>`).join('');
    }
    const c = kind === 'wood' ? '#c68b59' : '#fff';
    let s = `<rect x="-10" y="282" width="820" height="12" fill="${c}" ${I3}/><rect x="-10" y="316" width="820" height="12" fill="${c}" ${I3}/>`;
    for (let x = 0; x < 800; x += 50) s += `<path d="M${x + 10} 345 V272 L${x + 25} 256 L${x + 40} 272 V345 Z" fill="${c}" ${I3}/>`;
    return s;
  };
  const tree = (kind) => () => {
    if (kind === 'palm') {
      const leaf = (d) => `<path d="${d}" fill="#2fa35a" ${I}/>`;
      return `<path d="M700 365 Q712 260 676 150" fill="none" stroke="#2b2b2b" stroke-width="34" stroke-linecap="round"/><path d="M700 365 Q712 260 676 150" fill="none" stroke="#c68b59" stroke-width="24" stroke-linecap="round"/>` +
        [190, 230, 270, 310].map(y => `<path d="M${688 + (y - 150) / 12} ${y} h24" stroke="#2b2b2b" stroke-width="3" transform="translate(-14 0)"/>`).join('') +
        leaf('M676 150 Q620 92 568 132 Q626 120 676 150 Z') + leaf('M676 150 Q730 90 786 128 Q724 118 676 150 Z') + leaf('M676 150 Q636 152 600 210 Q650 168 676 150 Z') +
        leaf('M676 150 Q718 156 752 212 Q702 170 676 150 Z') + leaf('M676 150 Q660 92 690 56 Q684 104 676 150 Z') +
        `<circle cx="664" cy="162" r="12" fill="#8d5524" ${I3}/><circle cx="688" cy="166" r="12" fill="#8d5524" ${I3}/>`;
    }
    const crown = kind === 'blossom' ? '#ffafcc' : '#6cc04a';
    let s = `<path d="M660 365 L670 210 H700 L712 365 Z" fill="#a47148" ${I}/>` +
      `<path d="M596 196 C552 176 562 112 616 112 C614 60 690 34 718 78 C764 56 810 108 778 150 C808 192 766 236 724 218 C702 246 640 246 630 218 C598 228 574 208 596 196 Z" fill="${crown}" ${I}/>`;
    const dots = [[628, 150], [672, 98], [724, 120], [756, 176], [690, 190], [650, 200], [716, 160]];
    if (kind === 'blossom') dots.forEach(([x, y]) => { s += [0, 1, 2, 3, 4].map(k => { const a = k * 1.2566; return `<circle cx="${(x + Math.cos(a) * 7).toFixed(1)}" cy="${(y + Math.sin(a) * 7).toFixed(1)}" r="5" fill="#fff"/>`; }).join('') + `<circle cx="${x}" cy="${y}" r="3.5" fill="#ffd166"/>`; });
    else dots.forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="11" fill="#ef476f" ${I3}/><path d="M${x} ${y - 11} q3 -6 8 -6" fill="none" stroke="#2b2b2b" stroke-width="2.5"/>`; });   // apples
    return s;
  };
  const shed = (kind) => () => {
    if (kind === 'tent') return `<path d="M30 378 L135 172 L240 378 Z" fill="#ff8c42" ${I}/><path d="M90 290 L72 330 M180 290 L198 330" stroke="#fff" stroke-width="8" opacity="0.6"/><path d="M135 236 L98 378 H172 Z" fill="#3a3a4a" ${I}/>` +
      `<path d="M135 172 V138" ${I3}/><path d="M137 140 L166 150 L137 160 Z" fill="#06d6a0" ${I3}/>`;
    if (kind === 'doghouse') return `<path d="M52 378 V268 L135 196 L218 268 V378 Z" fill="#c68b59" ${I}/><path d="M38 272 L135 186 L232 272" fill="none" stroke="#ef476f" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/><path d="M38 272 L135 186 L232 272" fill="none" ${I3}/>` +
      `<path d="M104 378 V326 A31 31 0 0 1 166 326 V378 Z" fill="#3a3a4a" ${I}/><ellipse cx="200" cy="384" rx="22" ry="8" fill="#4cc9f0" ${I3}/><path d="M118 252 h34" stroke="#fff" stroke-width="10" stroke-linecap="round"/><path d="M118 252 h34" ${I3}/>`;
    // a playhouse with a door and a window
    return `<rect x="44" y="246" width="182" height="132" fill="#ffd166" ${I}/><path d="M28 254 L135 162 L242 254 Z" fill="#ef476f" ${I}/>` +
      `<path d="M112 378 V318 A23 23 0 0 1 158 318 V378 Z" fill="#4cc9f0" ${I}/><circle cx="150" cy="346" r="4" fill="#2b2b2b"/>` +
      `<rect x="60" y="270" width="38" height="38" rx="4" fill="#9fe0ff" ${I3}/><path d="M79 270 V308 M60 289 H98" ${I3}/><rect x="168" y="270" width="38" height="38" rx="4" fill="#9fe0ff" ${I3}/><path d="M187 270 V308 M168 289 H206" ${I3}/>` +
      `<rect x="56" y="308" width="46" height="12" rx="4" fill="#06d6a0" ${I3}/><circle cx="66" cy="302" r="6" fill="#ff8fab" stroke="#2b2b2b" stroke-width="2"/><circle cx="86" cy="302" r="6" fill="#fff" stroke="#2b2b2b" stroke-width="2"/>`;
  };
  // a thick colored pole with an outline
  const pole = (d, c, w = 12) => `<path d="${d}" fill="none" stroke="#2b2b2b" stroke-width="${w + 7}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const play = (kind) => () => {
    if (kind === 'slide') return pole('M272 392 L292 220 M312 392 L330 220', '#4cc9f0', 9) +
      [250, 285, 320, 355].map(y => { const k = (392 - y) / 172; return `<path d="M${(272 + k * 20).toFixed(1)} ${y} H${(312 + k * 18).toFixed(1)}" stroke="#2b2b2b" stroke-width="5"/>`; }).join('') +
      `<rect x="280" y="208" width="64" height="16" rx="5" fill="#ef476f" ${I3}/>` +
      `<path d="M336 210 Q388 226 424 336 Q436 370 462 376 V394 Q420 392 404 352 Q372 252 336 236 Z" fill="#ffd166" ${I}/>`;
    if (kind === 'trampoline') return [270, 318, 392, 440].map(x => pole(`M${x} 340 L${x + (x < 355 ? -6 : 6)} 392`, '#8d99ae', 8)).join('') +
      `<ellipse cx="355" cy="334" rx="98" ry="28" fill="#4cc9f0" ${I}/><ellipse cx="355" cy="332" rx="76" ry="19" fill="#3a3a4a" ${I3}/>`;
    // a swing
    return pole('M262 394 L300 194 L338 394', '#06d6a0', 10) + pole('M372 394 L410 194 L448 394', '#06d6a0', 10) +
      `<rect x="288" y="184" width="134" height="18" rx="6" fill="#ef476f" ${I3}/>` +
      `<path d="M334 202 V334 M376 202 V334" stroke="#2b2b2b" stroke-width="4" stroke-dasharray="7 4"/><rect x="320" y="330" width="70" height="16" rx="6" fill="#ffd166" ${I3}/>`;
  };
  const water = (kind) => () => {
    if (kind === 'sandbox') return `<path d="M50 418 H290 L304 476 H36 Z" fill="#c68b59" ${I}/><path d="M64 428 H276 L286 466 H54 Z" fill="#f4d58d" ${I3}/>` +
      `<path d="M200 430 L206 460 H236 L242 430 Z" fill="#ef476f" ${I3}/><path d="M206 430 Q221 412 236 430" fill="none" ${I3}/><path d="M100 452 L140 432" ${I} stroke-width="6"/><path d="M140 432 L156 420 L162 432 L148 442 Z" fill="#4cc9f0" ${I3}/>`;
    if (kind === 'fountain') return `<ellipse cx="170" cy="452" rx="120" ry="30" fill="#4cc9f0" ${I}/><rect x="158" y="380" width="24" height="70" rx="6" fill="#c9d6df" ${I3}/>` +
      `<path d="M120 384 H220 Q214 410 170 410 Q126 410 120 384 Z" fill="#c9d6df" ${I}/><path d="M170 380 Q140 340 120 384 M170 380 Q200 340 220 384 M170 380 V350" fill="none" stroke="#9fe0ff" stroke-width="6" stroke-linecap="round"/>` +
      `<path d="M110 452 Q130 444 150 452 M190 458 Q210 450 230 458" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`;
    // a pond with a duck and a lily pad
    return `<ellipse cx="170" cy="448" rx="132" ry="38" fill="#4cc9f0" ${I}/><path d="M80 452 Q100 444 120 452 M220 462 Q240 454 260 462" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M100 432 A18 9 0 1 1 118 436 L104 434 Z" fill="#6cc04a" ${I3}/>` +
      `<path d="M178 446 Q176 424 202 424 Q214 404 232 414 Q240 420 236 430 L250 432 L236 438 Q236 452 214 454 Q186 456 178 446 Z" fill="#ffd166" ${I3}/><circle cx="226" cy="420" r="3" fill="#2b2b2b"/>`;
  };
  const flowers = (kind) => () => {
    let s = `<ellipse cx="686" cy="464" rx="104" ry="20" fill="#8d5524" ${I}/>`;
    const xs = [610, 650, 690, 730, 766], cols = ['#ef476f', '#ff8fab', '#ffd166', '#9b5de5', '#ff8c42'];
    xs.forEach((x, i) => {
      const y = 418 - (i % 2) * 18;
      if (kind === 'mushrooms') {
        s += `<path d="M${x - 8} 462 V${y + 8} H${x + 8} V462 Z" fill="#fff8e6" ${I3}/><path d="M${x - 22} ${y + 10} Q${x - 22} ${y - 18} ${x} ${y - 18} Q${x + 22} ${y - 18} ${x + 22} ${y + 10} Z" fill="#ef476f" ${I3}/>` +
          `<circle cx="${x - 8}" cy="${y - 4}" r="4" fill="#fff"/><circle cx="${x + 9}" cy="${y - 2}" r="3" fill="#fff"/>`;
        return;
      }
      s += `<path d="M${x} 462 V${y}" stroke="#2fa35a" stroke-width="5"/><path d="M${x} 446 Q${x - 16} 440 ${x - 18} 428 Q${x - 4} 432 ${x} 444" fill="#6cc04a" ${I3} stroke-width="2.5"/>`;
      if (kind === 'daisies') s += [0, 1, 2, 3, 4, 5].map(k => { const a = k * 1.047; return `<ellipse cx="${(x + Math.cos(a) * 11).toFixed(1)}" cy="${(y + Math.sin(a) * 11).toFixed(1)}" rx="7" ry="5" transform="rotate(${k * 60} ${(x + Math.cos(a) * 11).toFixed(1)} ${(y + Math.sin(a) * 11).toFixed(1)})" fill="#fff" stroke="#2b2b2b" stroke-width="2"/>`; }).join('') + `<circle cx="${x}" cy="${y}" r="7" fill="#ffd166" stroke="#2b2b2b" stroke-width="2.5"/>`;
      else s += `<path d="M${x - 13} ${y} C${x - 15} ${y - 24} ${x - 4} ${y - 22} ${x} ${y - 13} C${x + 4} ${y - 22} ${x + 15} ${y - 24} ${x + 13} ${y} Q${x} ${y + 12} ${x - 13} ${y} Z" fill="${cols[i]}" ${I3}/>`;   // tulips
    });
    return s;
  };
  const eyes2 = (x, y, gap = 9) => `<circle cx="${x - gap}" cy="${y}" r="4" fill="#2b2b2b"/><circle cx="${x + gap}" cy="${y}" r="4" fill="#2b2b2b"/><circle cx="${x - gap + 1.5}" cy="${y - 1.5}" r="1.5" fill="#fff"/><circle cx="${x + gap + 1.5}" cy="${y - 1.5}" r="1.5" fill="#fff"/>`;
  const gpet = (kind) => () => {
    const shadow = `<ellipse cx="370" cy="474" rx="56" ry="9" fill="#000" opacity="0.15"/>`;
    if (kind === 'chick') return shadow + `<path d="M356 470 v-10 M382 470 v-10" ${I3} stroke="#ff8c42"/><circle cx="370" cy="438" r="30" fill="#ffd166" ${I}/><path d="M346 440 Q336 452 350 456" fill="#ffd166" ${I3}/>` +
      eyes2(370, 430, 10) + `<path d="M364 440 L376 440 L370 450 Z" fill="#ff8c42" ${I3} stroke-width="2.5"/><path d="M364 408 Q370 396 376 408" fill="none" ${I3}/>`;
    if (kind === 'tortoise') return shadow + `<path d="M330 470 v-10 M352 470 v-8 M392 470 v-8 M410 470 v-10" ${I} stroke="#6cc04a" stroke-width="12"/><path d="M330 470 v-10 M352 470 v-8 M392 470 v-8 M410 470 v-10" stroke="#6cc04a" stroke-width="7" stroke-linecap="round"/>` +
      `<circle cx="428" cy="440" r="16" fill="#6cc04a" ${I}/><circle cx="433" cy="436" r="3.5" fill="#2b2b2b"/><path d="M432 446 q5 3 9 -1" fill="none" stroke="#2b2b2b" stroke-width="2.5"/>` +
      `<path d="M318 462 Q318 412 368 410 Q418 412 418 462 Z" fill="#c68b59" ${I}/><path d="M346 462 L352 430 L384 430 L390 462 M352 430 L340 418 M384 430 L398 418" fill="none" ${I3}/>`;
    // a bunny
    return shadow + `<ellipse cx="386" cy="384" rx="9" ry="26" fill="#fff" ${I3} transform="rotate(-10 386 384)"/><ellipse cx="404" cy="384" rx="9" ry="26" fill="#fff" ${I3} transform="rotate(12 404 384)"/>` +
      `<ellipse cx="386" cy="386" rx="4" ry="16" fill="#ff8fab" transform="rotate(-10 386 386)"/><ellipse cx="404" cy="386" rx="4" ry="16" fill="#ff8fab" transform="rotate(12 404 386)"/>` +
      `<ellipse cx="362" cy="448" rx="38" ry="26" fill="#fff" ${I}/><circle cx="326" cy="440" r="9" fill="#fff" ${I3}/><circle cx="396" cy="426" r="22" fill="#fff" ${I}/>` + eyes2(396, 422, 8) + `<ellipse cx="396" cy="432" rx="4" ry="3" fill="#ff8fab"/>`;
  };
  const flyer = (kind) => () => {
    if (kind === 'balloon') return `<path d="M170 30 C214 30 230 62 220 92 C214 108 196 120 190 126 H150 C144 120 126 108 120 92 C110 62 126 30 170 30 Z" fill="#ef476f" ${I}/>` +
      `<path d="M158 31 Q144 80 156 126 M182 31 Q196 80 184 126" fill="none" stroke="#ffd166" stroke-width="8"/><path d="M170 30 C214 30 230 62 220 92 C214 108 196 120 190 126 H150 C144 120 126 108 120 92 C110 62 126 30 170 30 Z" fill="none" ${I}/>` +
      `<path d="M152 126 L156 144 M188 126 L184 144" ${I3}/><rect x="150" y="142" width="40" height="24" rx="4" fill="#c68b59" ${I}/>`;
    if (kind === 'butterflies') {
      const fly = (x, y, c, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 0 C-10 -26 -36 -22 -30 -2 C-36 14 -12 18 0 4 Z M0 0 C10 -26 36 -22 30 -2 C36 14 12 18 0 4 Z" fill="${c}" ${I3}/><path d="M0 -8 V10" ${I}/><path d="M0 -8 L-6 -18 M0 -8 L6 -18" ${I3} stroke-width="2.5"/></g>`;
      return fly(120, 70, '#c77dff', -12) + fly(230, 120, '#ffd166', 10);
    }
    // a kite with a bow tail
    return `<path d="M150 22 L196 70 L150 128 L104 70 Z" fill="#4cc9f0" ${I}/><path d="M150 22 V128 M104 70 H196" stroke="#2b2b2b" stroke-width="3"/><path d="M150 22 L196 70 H150 Z M104 70 L150 128 V70 Z" fill="#ff8fab" ${I3}/>` +
      `<path d="M150 128 Q170 146 160 162 Q150 178 176 190" fill="none" ${I3}/><path d="M156 150 l14 -6 l-2 14 Z M162 176 l14 -4 l-4 14 Z" fill="#ffd166" ${I3} stroke-width="2.5"/>`;
  };

  const GARDEN = [
    { id: 'g-sky', box: [0, 0, 800, 330], swatch: true, items: [
      { id: 'sky-day', price: 0, draw: sky('day') }, { id: 'sky-sunset', price: 1, draw: sky('sunset') },
      { id: 'sky-night', price: 2, draw: sky('night') }, { id: 'sky-rainbow', price: 3, draw: sky('rainbow') }] },
    { id: 'g-ground', box: [0, 330, 800, 170], swatch: true, items: [
      { id: 'ground-grass', price: 0, draw: ground('#7bd389', 'grass') }, { id: 'ground-meadow', price: 1, draw: ground('#7bd389', 'meadow') },
      { id: 'ground-sand', price: 1, draw: ground('#f4d58d', 'sand') }, { id: 'ground-snow', price: 2, draw: ground('#f8fbff', 'snow') }] },
    { id: 'g-fence', box: [0, 245, 800, 105], tb: [0, 220, 140, 140], items: [
      { id: 'fence-white', price: 1, draw: fence('white') }, { id: 'fence-wood', price: 1, draw: fence('wood') }, { id: 'fence-hedge', price: 2, draw: fence('hedge') }] },
    { id: 'g-tree', box: [560, 40, 230, 330], items: [
      { id: 'tree-apple', price: 2, draw: tree('apple') }, { id: 'tree-blossom', price: 2, draw: tree('blossom') }, { id: 'tree-palm', price: 2, draw: tree('palm') }] },
    { id: 'g-house', box: [24, 140, 222, 245], items: [
      { id: 'shed-playhouse', price: 3, draw: shed('playhouse') }, { id: 'shed-tent', price: 2, draw: shed('tent') }, { id: 'shed-doghouse', price: 2, draw: shed('doghouse') }] },
    { id: 'g-play', box: [252, 180, 214, 220], items: [
      { id: 'play-swing', price: 2, draw: play('swing') }, { id: 'play-slide', price: 2, draw: play('slide') }, { id: 'play-trampoline', price: 2, draw: play('trampoline') }] },
    { id: 'g-water', box: [32, 395, 280, 92], items: [
      { id: 'water-pond', price: 2, draw: water('pond') }, { id: 'water-fountain', price: 2, draw: water('fountain') }, { id: 'water-sandbox', price: 1, draw: water('sandbox') }] },
    { id: 'g-flowers', box: [578, 376, 216, 112], items: [
      { id: 'flowers-tulips', price: 1, draw: flowers('tulips') }, { id: 'flowers-daisies', price: 1, draw: flowers('daisies') }, { id: 'flowers-mushrooms', price: 2, draw: flowers('mushrooms') }] },
    { id: 'g-pet', box: [312, 360, 136, 120], items: [
      { id: 'gpet-bunny', price: 3, draw: gpet('bunny') }, { id: 'gpet-chick', price: 2, draw: gpet('chick') }, { id: 'gpet-tortoise', price: 3, draw: gpet('tortoise') }] },
    { id: 'g-flyer', box: [90, 18, 160, 160], items: [
      { id: 'flyer-kite', price: 1, draw: flyer('kite') }, { id: 'flyer-balloon', price: 2, draw: flyer('balloon') }, { id: 'flyer-butterflies', price: 1, draw: flyer('butterflies') }] },
  ];

  // ---------------------------------------------------------------
  // THE GARAGE (the floor starts at y = 330). The car on the stand is the car
  // you drive in Mini RC Racers (a picture rc.js saves); new players get a red one.
  // ---------------------------------------------------------------
  const gwall = (c, kind) => () => {
    let s = `<rect x="0" y="0" width="800" height="${FLOOR_Y}" fill="${c}"/>`;
    if (kind === 'blocks' || kind === 'bricks') {
      const bw = kind === 'bricks' ? 64 : 100, bh = kind === 'bricks' ? 30 : 50;
      for (let y = bh, r = 0; y < FLOOR_Y; y += bh, r++) {
        s += `<path d="M0 ${y} H800" stroke="#2b2b2b" stroke-width="2.5" opacity="0.25"/>`;
        for (let x = (r % 2) * bw / 2; x < 800; x += bw) s += `<path d="M${x} ${y} V${y + bh}" stroke="#2b2b2b" stroke-width="2.5" opacity="0.25"/>`;
      }
    }
    if (kind === 'race') for (let k = 0; k < 20; k++) s += `<rect x="${k * 40}" y="${k % 2 ? 170 : 150}" width="40" height="20" fill="#2b2b2b" opacity="0.8"/>`;
    if (kind === 'stripe') s += `<rect x="0" y="180" width="800" height="22" fill="#fff" opacity="0.7"/><rect x="0" y="210" width="800" height="8" fill="#fff" opacity="0.7"/>`;
    return s + `<rect x="0" y="${FLOOR_Y - 14}" width="800" height="14" fill="#8d99ae" ${I3}/>`;
  };
  const gfloor = (c, kind) => () => {
    let s = `<rect x="0" y="${FLOOR_Y}" width="800" height="${500 - FLOOR_Y}" fill="${c}"/>`;
    if (kind === 'concrete') for (let y = FLOOR_Y + 20; y < 500; y += 30) for (let x = (y % 60) + 10; x < 800; x += 70) s += `<circle cx="${x}" cy="${y}" r="2.5" fill="#2b2b2b" opacity="0.15"/>`;
    if (kind === 'check') for (let y = FLOOR_Y; y < 500; y += 40) for (let x = ((y - FLOOR_Y) / 40) % 2 ? 40 : 0; x < 800; x += 80) s += `<rect x="${x}" y="${y}" width="40" height="40" fill="#2b2b2b" opacity="0.85"/>`;
    if (kind === 'track') s += `<rect x="0" y="${FLOOR_Y + 70}" width="800" height="8" fill="#fff"/>` + [0, 1, 2, 3, 4, 5, 6, 7].map(k => `<rect x="${k * 110 + 20}" y="${FLOOR_Y + 120}" width="60" height="10" rx="5" fill="#ffd166"/>`).join('');
    return s;
  };
  const door = (c, open) => () => {
    let s = `<rect x="270" y="56" width="260" height="${FLOOR_Y - 56}" rx="6" fill="#8d99ae" ${I}/>`;
    if (open) {
      s += `<rect x="286" y="96" width="228" height="${FLOOR_Y - 96}" fill="#9fe0ff" ${I3}/>` + cloud(350, 140, 0.55) +
        `<rect x="286" y="250" width="228" height="${FLOOR_Y - 250}" fill="#7bd389" ${I3}/><path d="M360 ${FLOOR_Y} L390 250 H410 L440 ${FLOOR_Y} Z" fill="#8d99ae" ${I3}/><path d="M400 262 V276 M400 292 V312" stroke="#fff" stroke-width="5"/>` +
        `<rect x="282" y="70" width="236" height="30" rx="6" fill="${c}" ${I3}/>`;     // the door rolled up at the top
    } else {
      s += `<rect x="286" y="72" width="228" height="${FLOOR_Y - 72}" fill="${c}" ${I3}/>`;
      for (let y = 102; y < FLOOR_Y; y += 30) s += `<path d="M286 ${y} H514" stroke="#2b2b2b" stroke-width="3" opacity="0.5"/>`;
      s += `<rect x="380" y="${FLOOR_Y - 34}" width="40" height="12" rx="6" fill="#3a3a4a" ${I3}/>`;
    }
    return s;
  };
  const stand = (kind) => () => {
    if (kind === 'podium') return `<path d="M290 420 L312 392 H488 L510 420 Z" fill="#ffe08a" ${I}/><rect x="290" y="420" width="220" height="62" fill="#ffc93c" ${I}/>` + star(400, 451, 20, '#fff', 3);
    if (kind === 'turntable') return `<ellipse cx="400" cy="446" rx="170" ry="42" fill="#118ab2" ${I}/><ellipse cx="400" cy="440" rx="150" ry="32" fill="#4cc9f0" ${I3}/>` +
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => { const a = Math.PI * 2 * k / 10; return `<circle cx="${(400 + Math.cos(a) * 160).toFixed(1)}" cy="${(446 + Math.sin(a) * 37).toFixed(1)}" r="5" fill="${k % 2 ? '#ffd166' : '#fff'}" stroke="#2b2b2b" stroke-width="2"/>`; }).join('');
    return `<ellipse cx="400" cy="446" rx="160" ry="38" fill="#8d99ae" ${I}/><ellipse cx="400" cy="444" rx="120" ry="26" fill="#c9d6df" ${I3}/>`;     // a plain mat
  };
  // the car: the picture from Mini RC Racers (seen from above, so it's squashed a bit to stand on the floor)
  function car() {
    const pic = CTX.car;
    if (pic && /^data:image\//.test(pic)) return `<ellipse cx="400" cy="454" rx="140" ry="20" fill="#000" opacity="0.2"/><g transform="translate(400 430) scale(2.9 1.5) rotate(90)"><image href="${pic}" x="-60" y="-60" width="120" height="120"/></g>`;
    // (no RC picture yet: a little red car)
    return `<ellipse cx="400" cy="452" rx="110" ry="16" fill="#000" opacity="0.2"/><rect x="298" y="398" width="34" height="18" rx="6" fill="#2b2b2b"/><rect x="468" y="398" width="34" height="18" rx="6" fill="#2b2b2b"/>` +
      `<rect x="298" y="448" width="34" height="18" rx="6" fill="#2b2b2b"/><rect x="468" y="448" width="34" height="18" rx="6" fill="#2b2b2b"/>` +
      `<rect x="288" y="408" width="224" height="50" rx="22" fill="#ef476f" ${I}/><rect x="420" y="414" width="56" height="38" rx="12" fill="#d6f1ff" ${I3}/>` + eyes2(448, 433, 10);
  }
  const rack = (kind) => () => {
    if (kind === 'paint') return `<rect x="30" y="200" width="220" height="14" rx="4" fill="#c68b59" ${I3}/><rect x="30" y="120" width="220" height="14" rx="4" fill="#c68b59" ${I3}/>` +
      ['#ef476f', '#4cc9f0', '#ffd166', '#06d6a0'].map((c, i) => `<rect x="${44 + i * 50}" y="${i % 2 ? 150 : 146}" width="40" height="${i % 2 ? 50 : 54}" rx="5" fill="${c}" ${I3}/><path d="M${44 + i * 50} ${i % 2 ? 160 : 158} h40" stroke="#2b2b2b" stroke-width="3"/>`).join('') +
      `<rect x="50" y="88" width="56" height="32" rx="6" fill="#9b5de5" ${I3}/><rect x="130" y="80" width="40" height="40" rx="6" fill="#ff8c42" ${I3}/>`;
    if (kind === 'helmets') return `<rect x="30" y="200" width="220" height="14" rx="4" fill="#8d99ae" ${I3}/>` +
      ['#ef476f', '#ffd166', '#118ab2'].map((c, i) => { const x = 70 + i * 70; return `<path d="M${x - 30} 200 C${x - 30} 160 ${x - 14} 146 ${x} 146 C${x + 20} 146 ${x + 32} 164 ${x + 32} 192 V200 Z" fill="${c}" ${I3}/><path d="M${x} 158 C${x + 14} 158 ${x + 22} 168 ${x + 24} 182 H${x} Z" fill="#bde0fe" ${I3}/>`; }).join('');
    // a pegboard with tools
    let s = `<rect x="34" y="84" width="212" height="150" rx="8" fill="#e9c46a" ${I}/>`;
    for (let y = 100; y < 230; y += 22) for (let x = 50; x < 240; x += 22) s += `<circle cx="${x}" cy="${y}" r="2.5" fill="#2b2b2b" opacity="0.35"/>`;
    return s + `<path d="M70 110 L70 200" ${I} stroke-width="12"/><path d="M70 110 L70 200" stroke="#8d99ae" stroke-width="6" stroke-linecap="round"/><path d="M56 104 Q70 92 84 104 L78 116 H62 Z" fill="#8d99ae" ${I3}/>` +
      `<rect x="120" y="104" width="14" height="96" rx="5" fill="#c68b59" ${I3}/><rect x="100" y="98" width="54" height="22" rx="5" fill="#8d99ae" ${I3}/>` +
      `<rect x="190" y="104" width="16" height="50" rx="6" fill="#ef476f" ${I3}/><path d="M198 154 V206" ${I} stroke-width="7"/><path d="M198 154 V206" stroke="#c9d6df" stroke-width="3"/>`;
  };
  const pile = (kind) => () => {
    if (kind === 'toolbox') return `<rect x="34" y="400" width="140" height="70" rx="8" fill="#ef476f" ${I}/><path d="M34 424 H174" ${I3}/><path d="M80 400 V384 H128 V400" fill="none" ${I}/><rect x="94" y="416" width="20" height="14" rx="3" fill="#ffd166" ${I3}/>`;
    if (kind === 'cones') return [60, 140].map(x => `<path d="M${x - 30} 470 L${x - 8} 370 H${x + 8} L${x + 30} 470 Z" fill="#ff8c42" ${I}/><path d="M${x - 18} 416 H${x + 18} M${x - 13} 392 H${x + 13}" stroke="#fff" stroke-width="9"/><rect x="${x - 40}" y="464" width="80" height="12" rx="4" fill="#ff8c42" ${I3}/>`).join('');
    // a stack of tires
    return [440, 388, 336].map(y => `<rect x="36" y="${y}" width="130" height="46" rx="20" fill="#3a3a4a" ${I}/><rect x="70" y="${y + 14}" width="62" height="18" rx="9" fill="#8d99ae" ${I3}/>`).join('');
  };
  const poster = (kind) => () => {
    if (kind === 'cup') {
      // your best Grand Prix cup from Mini RC Racers (gold, silver, bronze) - or an empty white one
      const c = { 1: '#ffc93c', 2: '#c9d6df', 3: '#e09f5a' }[CTX.cup] || '#fff';
      return `<rect x="580" y="200" width="180" height="14" rx="4" fill="#c68b59" ${I3}/><path d="M640 92 H700 V130 A30 30 0 0 1 640 130 Z" fill="${c}" ${I}/>` +
        `<path d="M640 102 H620 Q620 136 646 140 M700 102 H720 Q720 136 694 140" fill="none" ${I3}/><rect x="662" y="160" width="16" height="18" fill="${c}" ${I3}/><rect x="642" y="176" width="56" height="24" rx="4" fill="#8d5524" ${I3}/>` + star(670, 118, 13, '#fff', 0, 0.9);
    }
    if (kind === 'race') return `<rect x="578" y="66" width="184" height="138" rx="6" fill="#fff8e6" ${I}/><path d="M590 180 Q670 120 750 180" fill="none" stroke="#8d99ae" stroke-width="16"/>` +
      `<rect x="626" y="114" width="70" height="32" rx="12" fill="#4cc9f0" ${I3}/><circle cx="640" cy="148" r="8" fill="#2b2b2b"/><circle cx="682" cy="148" r="8" fill="#2b2b2b"/>` + star(730, 96, 12, '#ffd166', 2.5) + star(604, 92, 9, '#ef476f', 2.5);
    // a checkered flag banner
    let s = `<path d="M580 66 V214" ${I} stroke-width="7"/><rect x="584" y="70" width="176" height="108" fill="#fff" ${I3}/>`;
    for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) if ((r + k) % 2) s += `<rect x="${584 + k * 29.3}" y="${70 + r * 27}" width="29.3" height="27" fill="#2b2b2b"/>`;
    return s + `<rect x="584" y="70" width="176" height="108" fill="none" ${I3}/>`;
  };
  const lights = (kind) => () => {
    if (kind === 'neon') return `<rect x="250" y="8" width="300" height="30" rx="15" fill="#ff2ec4" opacity="0.25"/><rect x="262" y="14" width="276" height="18" rx="9" fill="#ff8fe0" ${I3}/>`;
    if (kind === 'disco') return `<path d="M400 0 V14" ${I3}/><circle cx="400" cy="38" r="24" fill="#c9d6df" ${I}/><path d="M378 30 H422 M376 44 H424 M392 15 V61 M408 15 V61" stroke="#8d99ae" stroke-width="2.5"/>` +
      star(350, 30, 9, '#ffd166', 2.5) + star(452, 40, 9, '#4cc9f0', 2.5);
    return [330, 470].map(x => `<path d="M${x} 0 V16" ${I3}/><path d="M${x - 24} 38 L${x - 12} 14 H${x + 12} L${x + 24} 38 Z" fill="#06d6a0" ${I3}/><circle cx="${x}" cy="42" r="9" fill="#fff6c2" ${I3}/>`).join('');
  };
  const ride = (kind) => () => {
    if (kind === 'kart') return `<circle cx="634" cy="452" r="22" fill="#2b2b2b"/><circle cx="752" cy="452" r="22" fill="#2b2b2b"/><circle cx="634" cy="452" r="8" fill="#8d99ae"/><circle cx="752" cy="452" r="8" fill="#8d99ae"/>` +
      `<path d="M610 440 L622 408 H700 L716 384 H748 L776 440 Z" fill="#06d6a0" ${I}/><path d="M716 384 L704 360" ${I}/><ellipse cx="702" cy="358" rx="14" ry="6" fill="#2b2b2b"/><rect x="640" y="380" width="30" height="30" rx="8" fill="#ffd166" ${I3}/>`;
    if (kind === 'bike') return `<circle cx="642" cy="420" r="40" fill="none" stroke="#2b2b2b" stroke-width="10"/><circle cx="756" cy="420" r="40" fill="none" stroke="#2b2b2b" stroke-width="10"/><circle cx="642" cy="420" r="6" fill="#8d99ae"/><circle cx="756" cy="420" r="6" fill="#8d99ae"/>` +
      pole('M642 420 L676 360 H730 L756 420 M676 360 L700 420 H642 M730 360 L740 336', '#ef476f', 9) + `<path d="M664 352 H694" ${I} stroke-width="9"/><path d="M726 334 H758" ${I} stroke-width="7"/>`;
    // a scooter
    return `<circle cx="626" cy="456" r="16" fill="#2b2b2b"/><circle cx="738" cy="456" r="16" fill="#2b2b2b"/><rect x="612" y="432" width="128" height="14" rx="7" fill="#9b5de5" ${I3}/>` +
      pole('M736 440 L712 300', '#9b5de5', 9) + `<path d="M690 300 H736" ${I} stroke-width="9"/>`;
  };

  const GARAGE = [
    { id: 'c-wall', box: [0, 0, 800, 330], swatch: true, items: [
      { id: 'gwall-blocks', price: 0, draw: gwall('#c9d6df', 'blocks') }, { id: 'gwall-blue', price: 1, draw: gwall('#8ecae6', 'stripe') },
      { id: 'gwall-bricks', price: 2, draw: gwall('#e07a5f', 'bricks') }, { id: 'gwall-race', price: 2, draw: gwall('#ffd166', 'race') }] },
    { id: 'c-floor', box: [0, 330, 800, 170], swatch: true, items: [
      { id: 'gfloor-concrete', price: 0, draw: gfloor('#b8bec9', 'concrete') }, { id: 'gfloor-check', price: 1, draw: gfloor('#fff', 'check') },
      { id: 'gfloor-track', price: 2, draw: gfloor('#4a4e69', 'track') }] },
    { id: 'c-door', box: [265, 52, 270, 280], items: [
      { id: 'door-white', price: 0, draw: door('#f1f1f1') }, { id: 'door-red', price: 1, draw: door('#ef476f') }, { id: 'door-open', price: 2, draw: door('#f1f1f1', true) }] },
    { id: 'c-stand', box: [225, 380, 350, 110], tb: [225, 300, 350, 220], items: [
      { id: 'stand-mat', price: 0, draw: stand('mat') }, { id: 'stand-turntable', price: 2, draw: stand('turntable') }, { id: 'stand-podium', price: 3, draw: stand('podium') }] },
    { id: 'c-rack', box: [26, 74, 232, 168], items: [
      { id: 'rack-tools', price: 1, draw: rack('tools') }, { id: 'rack-paint', price: 1, draw: rack('paint') }, { id: 'rack-helmets', price: 2, draw: rack('helmets') }] },
    { id: 'c-pile', box: [22, 330, 166, 150], items: [
      { id: 'pile-tires', price: 1, draw: pile('tires') }, { id: 'pile-toolbox', price: 1, draw: pile('toolbox') }, { id: 'pile-cones', price: 1, draw: pile('cones') }] },
    { id: 'c-poster', box: [572, 60, 196, 160], items: [
      { id: 'poster-flag', price: 1, draw: poster('flag') }, { id: 'poster-race', price: 1, draw: poster('race') }, { id: 'poster-cup', price: 2, draw: poster('cup') }] },
    { id: 'c-lights', box: [248, 0, 304, 66], tb: [280, -50, 240, 240], items: [
      { id: 'lights-lamps', price: 1, draw: lights('lamps') }, { id: 'lights-neon', price: 2, draw: lights('neon') }, { id: 'lights-disco', price: 2, draw: lights('disco') }] },
    { id: 'c-ride', box: [592, 290, 196, 190], items: [
      { id: 'ride-scooter', price: 1, draw: ride('scooter') }, { id: 'ride-bike', price: 2, draw: ride('bike') }, { id: 'ride-kart', price: 3, draw: ride('kart') }] },
  ];

  // ---------------------------------------------------------------
  // The three rooms. layers = the order things are drawn in (back to front);
  // 'me' is where the animals stand, 'car' the garage car. me = where your
  // animal stands at first (x offset from the middle). defaults = what's
  // there before you buy anything.
  // ---------------------------------------------------------------
  const ROOM_PIC = {
    bedroom: `<svg viewBox="0 0 48 48"><rect x="4" y="22" width="40" height="14" rx="4" fill="#ef476f" stroke="#2b2b2b" stroke-width="3.5"/><rect x="4" y="12" width="7" height="30" rx="3" fill="#c68b59" stroke="#2b2b2b" stroke-width="3.5"/><ellipse cx="18" cy="21" rx="7" ry="4" fill="#fff" stroke="#2b2b2b" stroke-width="3"/><path d="M38 36 V42" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/></svg>`,
    garden: `<svg viewBox="0 0 48 48"><rect x="21" y="26" width="7" height="18" fill="#a47148" stroke="#2b2b2b" stroke-width="3.5"/><circle cx="24.5" cy="18" r="14" fill="#6cc04a" stroke="#2b2b2b" stroke-width="3.5"/><circle cx="19" cy="15" r="3.5" fill="#ef476f"/><circle cx="29" cy="21" r="3.5" fill="#ef476f"/><path d="M4 44 H44" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/></svg>`,
    garage: `<svg viewBox="0 0 48 48"><path d="M4 20 L24 6 L44 20 V44 H4 Z" fill="#c9d6df" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/><rect x="11" y="24" width="26" height="20" fill="#fff" stroke="#2b2b2b" stroke-width="3"/><rect x="14" y="32" width="20" height="9" rx="4" fill="#ef476f" stroke="#2b2b2b" stroke-width="2.5"/></svg>`,
  };
  const ROOMS = [
    { id: 'bedroom', spots: SPOTS, me: 0, defaults: { wall: 'wall-cream', floor: 'floor-wood' },
      layers: ['wall', 'garland', 'window', 'curtains', 'frame', 'shelf', 'floor', 'rug', 'me', 'bed', 'plant', 'lamp', 'toy', 'pet'] },
    { id: 'garden', spots: GARDEN, me: 90, defaults: { 'g-sky': 'sky-day', 'g-ground': 'ground-grass' },
      layers: ['g-sky', 'g-flyer', 'g-ground', 'g-fence', 'g-tree', 'g-house', 'g-play', 'g-water', 'g-flowers', 'me', 'g-pet'] },
    { id: 'garage', spots: GARAGE, me: 180, defaults: { 'c-wall': 'gwall-blocks', 'c-floor': 'gfloor-concrete', 'c-door': 'door-white', 'c-stand': 'stand-mat' },
      layers: ['c-wall', 'c-door', 'c-lights', 'c-rack', 'c-poster', 'c-floor', 'c-stand', 'car', 'c-pile', 'me', 'c-ride'] },
  ];
  const ALL_SPOTS = ROOMS.reduce((a, r) => a.concat(r.spots), []);
  const itemById = (id) => { for (const sp of ALL_SPOTS) for (const it of sp.items) if (it.id === id) return { spot: sp, item: it }; return null; };
  const spotById = (id) => ALL_SPOTS.find(s => s.id === id);
  const roomById = (id) => ROOMS.find(r => r.id === id) || ROOMS[0];
  // the bedroom window (on the wall, behind the curtains: not something you buy)
  const WINDOW = `<rect x="320" y="50" width="160" height="150" rx="10" fill="#9fe0ff" ${I}/><path d="M400 50 V200 M320 125 H480" ${I}/><ellipse cx="356" cy="84" rx="20" ry="9" fill="#fff"/><ellipse cx="444" cy="160" rx="22" ry="9" fill="#fff"/>`;

  // ---- this player's house ----
  function house() {
    const d = Arcade.store.load();
    if (!d.house) d.house = {};
    for (const [k, v] of [['spent', 0], ['owned', []], ['placed', {}], ['pos', {}]]) if (d.house[k] == null) d.house[k] = v;
    for (const sp of ALL_SPOTS) for (const it of sp.items) if (!it.price && !d.house.owned.includes(it.id)) d.house.owned.push(it.id);   // the free things
    // (a spot that was never touched gets its default; '' means "you took it away")
    for (const r of ROOMS) for (const sp in r.defaults) if (d.house.placed[sp] === undefined) d.house.placed[sp] = r.defaults[sp];
    return d.house;
  }
  // (+ bonus coins: Turbo Bike and the Daily Surprise give some)
  const coins = () => START_COINS + (Arcade.stickers ? Arcade.stickers.trophyCount() : 0) + (Arcade.store.load().houseBonus || 0) - house().spent;
  // what the drawings need to know about you (see CTX at the top)
  function myCtx() {
    const d = Arcade.store.load(), rc = ((d.games || {}).rc || {}).data || {};
    const st = Arcade.stickers ? Arcade.stickers.list.filter(s => Arcade.stickers.has(s.id)).pop() : null;
    return { trophies: Arcade.stickers ? Arcade.stickers.trophyCount() : 0, sticker: st ? st.id : null, car: rc.garagePic || null, cup: rc.cupBest || null };
  }

  // ---- pictures for the buttons ----
  const COIN = `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19" fill="#ffc93c" stroke="#2b2b2b" stroke-width="4"/><circle cx="24" cy="24" r="12" fill="none" stroke="#e09f3e" stroke-width="3"/><path d="M24 16 L26.5 21.5 L32 22 L28 26 L29 32 L24 29 L19 32 L20 26 L16 22 L21.5 21.5 Z" fill="#fff"/></svg>`;
  const TICK = `<svg viewBox="0 0 48 48"><path d="M8 26 L20 37 L40 12" fill="none" stroke="#2b2b2b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const NONE = `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="17" fill="#fff" stroke="#2b2b2b" stroke-width="4"/><path d="M12 36 L36 12" stroke="#ef476f" stroke-width="5" stroke-linecap="round"/></svg>`;
  // "put it back where it was": a curly arrow
  const BACK = `<svg viewBox="0 0 48 48"><path d="M14 18 H30 A10 10 0 0 1 30 38 H16" fill="none" stroke="#2b2b2b" stroke-width="6" stroke-linecap="round"/><path d="M20 9 L11 18 L20 27" fill="none" stroke="#2b2b2b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const X = `<svg viewBox="0 0 48 48"><path d="M12 12 L36 36 M36 12 L12 36" stroke="#2b2b2b" stroke-width="7" stroke-linecap="round"/></svg>`;
  const MYHOUSE = `<svg viewBox="0 0 48 48"><path d="M5 23 L24 6 L43 23" fill="none" stroke="#2b2b2b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 20 V42 H38 V20 L24 9 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><rect x="20" y="28" width="9" height="14" fill="#ef476f" stroke="#2b2b2b" stroke-width="3"/></svg>`;
  // a small picture of one thing: the room drawing, cropped around its spot
  function thumb(sp, it) {
    const [x, y, w, h] = sp.box;
    if (sp.swatch) {    // wall paint / floors / sky: a square sample
      const size = Math.min(w, h);
      const top = /floor|ground/.test(sp.id) ? 0 : 60;
      return `<svg viewBox="${x + 40} ${y + top} ${size * 0.8} ${size * 0.8}">${it.draw()}</svg>`;
    }
    if (sp.tb) return `<svg viewBox="${sp.tb.join(' ')}">${it.draw()}</svg>`;     // (a long thin thing: show a part of it)
    const pad = 8, s = Math.max(w, h) + pad * 2;
    return `<svg viewBox="${x + w / 2 - s / 2} ${y + h / 2 - s / 2} ${s} ${s}">${it.draw()}</svg>`;
  }

  // an animal standing in the room (face from the player list + a little body).
  // who = 'self' or a friend's seat number (so a hop can be found on every phone)
  function animal(p, x, who, dragKey) {
    const body = `<ellipse cx="400" cy="452" rx="58" ry="12" fill="#000" opacity="0.18"/>` +
      `<rect x="362" y="356" width="76" height="92" rx="34" fill="${p.color}" ${I}/><ellipse cx="400" cy="402" rx="22" ry="26" fill="#fff" opacity="0.5"/>` +
      `<ellipse cx="378" cy="448" rx="18" ry="10" fill="${p.color}" ${I}/><ellipse cx="422" cy="448" rx="18" ry="10" fill="${p.color}" ${I}/>` +
      `<g transform="translate(330 236) scale(1.4)">${Arcade.profiles.avatar(p).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>` +
      `<circle cx="400" cy="306" r="68" fill="none" ${I}/>`;
    return `<g transform="translate(${x[0]} ${x[1]})" ${dragKey ? `data-drag="${dragKey}"` : ''}><g class="me" data-who="${who}">${body}</g></g>`;
  }

  // ---------------------------------------------------------------
  // Drawing a room. view = { house, ctx, owner (player), ownerWho, guests: [{ p, who }] }
  // ---------------------------------------------------------------
  function roomSVG(room, view, trying, editable) {
    CTX = view.ctx;
    const placed = Object.assign({}, view.house.placed), pos = view.house.pos || {};
    if (trying) placed[itemById(trying).spot.id] = trying;
    const at = (key) => pos[key] || [0, 0];
    let s = '';
    for (const id of room.layers) {
      if (id === 'window') { s += WINDOW; continue; }
      if (id === 'car') { const p = at('car'); s += `<g transform="translate(${p[0]} ${p[1] + (placed['c-stand'] === 'stand-podium' ? -36 : 0)})" ${editable ? 'data-drag="car"' : ''}>${car()}</g>`; continue; }
      if (id === 'me') {
        const p = at('me:' + room.id);
        s += animal(view.owner, [room.me + p[0], p[1]], view.ownerWho, editable ? 'me:' + room.id : null);
        // visitors stand next to the owner (a step to the side each)
        view.guests.forEach((gst, i) => {
          let gx = room.me + p[0] + (i % 2 ? -1 : 1) * 150 * (Math.floor(i / 2) + 1);
          if (gx > 330) gx -= 150 * 2 * (Math.floor(i / 2) + 1);         // (keep everyone inside the room)
          if (gx < -330) gx += 150 * 2 * (Math.floor(i / 2) + 1);
          s += animal(gst.p, [Math.max(-330, Math.min(330, gx)), p[1] + 14], gst.who, null);
        });
        continue;
      }
      const it = placed[id] && itemById(placed[id]);
      if (!it) continue;
      const sp = it.spot, p = sp.swatch ? [0, 0] : at(id);
      s += `<g transform="translate(${p[0]} ${p[1]})" ${editable && !sp.swatch ? `data-drag="${id}"` : ''}><g class="${placed[id] === trying ? 'trying' : ''}" data-layer="${id}">${it.item.draw()}</g></g>`;
    }
    return `<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">${s}</svg>`;
  }

  // ---------------------------------------------------------------
  // The page
  // ---------------------------------------------------------------
  const roomEl = document.getElementById('room'), tabs = document.getElementById('tabs'), shop = document.getElementById('shop'), coinEl = document.getElementById('coins');
  const roomsEl = document.getElementById('rooms'), visitEl = document.getElementById('visit');
  let roomId = roomById(house().room).id;
  let spot = roomById(roomId).spots.find(s => !s.swatch).id;   // which spot's things are showing
  let trying = null;           // a thing being tried in the room (not bought yet)
  let visiting = null;         // the friend's seat number while visiting their house

  // who is in which house (see "Friends" below)
  function guestsOf(ownerSeat) {
    const g = [];
    if (visiting != null && visiting === ownerSeat) g.push({ p: Arcade.profiles.active(), who: 'self' });
    for (const s in peers) if (peers[s].visit === ownerSeat && peers[s].who && +s !== ownerSeat) g.push({ p: peers[s].who, who: s });
    return g;
  }
  function drawRoom() {
    const room = roomById(roomId);
    let view;
    if (visiting != null && peers[visiting]) {
      const f = peers[visiting];
      view = { house: { placed: f.placed || {}, pos: f.pos || {} }, ctx: f.ctx || {}, owner: f.who, ownerWho: visiting, guests: guestsOf(visiting) };
    } else view = { house: house(), ctx: myCtx(), owner: Arcade.profiles.active(), ownerWho: 'self', guests: net.room ? guestsOf(net.room.seat) : [] };
    roomEl.innerHTML = roomSVG(room, view, visiting == null ? trying : null, visiting == null);
    roomEl.appendChild(visitEl);          // (the "visiting" banner sits on top of the room)
    coinEl.innerHTML = COIN + `<span>${coins()}</span>`;
  }
  function drawRooms() {
    roomsEl.innerHTML = ROOMS.map(r => `<button type="button" class="rm${r.id === roomId ? ' on' : ''}" data-room="${r.id}" aria-label="${r.id}">${ROOM_PIC[r.id]}</button>`).join('');
  }
  function drawTabs() {
    const h = house();
    tabs.innerHTML = roomById(roomId).spots.map(sp => {
      const it = itemById(h.placed[sp.id] || '') || { item: sp.items[0] };
      return `<button type="button" class="tab${sp.id === spot ? ' on' : ''}" data-spot="${sp.id}" aria-label="${sp.id}">${thumb(sp, it.item)}</button>`;
    }).join('');
  }
  function drawShop() {
    const sp = spotById(spot), h = house();
    let html = '';
    // "nothing here" (not for the wall, floor or sky)
    if (!sp.swatch) html += `<button type="button" class="item${!h.placed[sp.id] && !trying ? ' on' : ''}" data-none="1" aria-label="Nothing">${NONE}</button>`;
    for (const it of sp.items) {
      const own = h.owned.includes(it.id), on = h.placed[sp.id] === it.id && !trying, tr = trying === it.id;
      const tag = own ? `<span class="tag own">${TICK}</span>` : `<span class="tag">${COIN}<b>${it.price}</b></span>`;
      html += `<button type="button" class="item${on ? ' on' : ''}${tr ? ' try' : ''}${!own && it.price > coins() ? ' poor' : ''}" data-item="${it.id}">${thumb(sp, it)}${tag}${tr ? `<span class="buy">${TICK}</span>` : ''}</button>`;
    }
    // moved somewhere? a button to put it back
    if (h.pos[sp.id] && h.placed[sp.id]) html += `<button type="button" class="item back" data-back="1" aria-label="Put it back">${BACK}</button>`;
    shop.innerHTML = html;
  }
  function redraw() {
    document.body.classList.toggle('visiting', visiting != null);
    drawRooms(); drawRoom();
    if (visiting == null) { drawTabs(); drawShop(); }
    drawVisit(); drawFriendsBtn();
    if (!ov.hidden && ovShowsRoom) showFriends();       // (friends came or went: update the Friends window)
  }
  function save() { Arcade.store.save(); net.sendHouse(); }

  roomsEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-room]'); if (!b) return;
    Arcade.audio.resume(); Arcade.sfx('swish');
    roomId = b.dataset.room; trying = null;
    spot = roomById(roomId).spots.find(s => !s.swatch).id;
    if (visiting == null) { house().room = roomId; Arcade.store.save(); }
    redraw();
  });
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('[data-spot]'); if (!b) return;
    Arcade.audio.resume(); Arcade.sfx('pop');
    spot = b.dataset.spot; trying = null; redraw();
  });
  shop.addEventListener('click', (e) => {
    const b = e.target.closest('.item'); if (!b) return;
    Arcade.audio.resume();
    const h = house();
    if (b.dataset.none) { h.placed[spot] = ''; trying = null; save(); Arcade.sfx('swish'); redraw(); return; }
    if (b.dataset.back) { delete h.pos[spot]; save(); Arcade.sfx('swish'); redraw(); return; }
    const id = b.dataset.item, it = itemById(id).item;
    if (h.owned.includes(id)) {                  // yours already: put it in the room
      h.placed[spot] = id; trying = null; save(); Arcade.sfx('click'); redraw(); return;
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
    save();
    Arcade.sfx('coin'); setTimeout(() => Arcade.sfx('star'), 150);
    Arcade.confetti(60);
    redraw();
    if (Arcade.stickers) Arcade.stickers.check();       // (the "My House" sticker!)
  });

  // ---------------------------------------------------------------
  // Moving things: press on a thing (or your animal, or the car) and drag it.
  // A short tap instead: the animal hops, a thing opens its spot in the shop.
  // The move is saved as pos[spot] = [dx, dy] (how far from where it started).
  // ---------------------------------------------------------------
  let drag = null;
  function svgPoint(e) {
    const svg = roomEl.querySelector('svg'), m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }
  // where a thing's middle is before moving (to keep it inside the room)
  function homeBox(key) {
    if (key.startsWith('me:')) return [400 + roomById(roomId).me, 360];
    if (key === 'car') return [400, 432];
    const [x, y, w, h] = spotById(key).box; return [x + w / 2, y + h / 2];
  }
  roomEl.addEventListener('pointerdown', (e) => {
    const hop = e.target.closest('[data-who]');
    const g = e.target.closest('[data-drag]');
    if (!g || visiting != null) { if (hop) hopAnimal(hop.dataset.who, true); return; }
    e.preventDefault();
    const key = g.dataset.drag, start = svgPoint(e), was = (house().pos[key] || [0, 0]).slice();
    drag = { key, g, start, was, now: was, moved: false, hop: hop && hop.dataset.who };
    roomEl.setPointerCapture(e.pointerId);
  });
  roomEl.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = svgPoint(e), dx = p.x - drag.start.x, dy = p.y - drag.start.y;
    if (!drag.moved && Math.hypot(dx, dy) < 10) return;
    if (!drag.moved) { drag.moved = true; drag.g.classList.add('lift'); Arcade.sfx('tick'); }
    // keep the middle of the thing inside the room
    const [cx, cy] = homeBox(drag.key);
    const nx = Math.max(30 - cx, Math.min(770 - cx, drag.was[0] + dx)), ny = Math.max(40 - cy, Math.min(470 - cy, drag.was[1] + dy));
    drag.now = [Math.round(nx), Math.round(ny)];
    const base = drag.key.startsWith('me:') ? roomById(roomId).me : 0, lift = drag.key === 'car' && house().placed['c-stand'] === 'stand-podium' ? -36 : 0;
    drag.g.setAttribute('transform', `translate(${base + drag.now[0]} ${drag.now[1] + lift})`);
  });
  function endDrag() {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.moved) {          // just a tap
      if (d.hop) hopAnimal(d.hop, true);
      else if (spotById(d.key)) { spot = d.key; trying = null; Arcade.sfx('pop'); redraw(); }
      return;
    }
    house().pos[d.key] = d.now;
    save(); Arcade.sfx('pop'); redraw();
  }
  roomEl.addEventListener('pointerup', endDrag);
  roomEl.addEventListener('pointercancel', endDrag);

  // an animal hops (and, with friends, hops on their phones too)
  function hopAnimal(who, tell) {
    Arcade.audio.resume(); Arcade.sfx('jump');
    const m = roomEl.querySelector(`[data-who="${who}"]`);
    if (m) { m.classList.remove('hop'); void m.getBoundingClientRect(); m.classList.add('hop'); }
    if (tell && net.room) net.room.send({ t: 'hop', who: who === 'self' ? net.room.seat : +who });
  }

  // ---------------------------------------------------------------
  // Friends: visit each other's houses (arcade/net.js).
  // The switchboard only passes small messages (1 KB), so a house is sent in pieces:
  //   { t: 'hm', who, ctx }                    - who I am + trophies / sticker / cup
  //   { t: 'hr', r: room, s: [[item, dx, dy], ...] } - one room: for each spot (in order) the
  //                                              item's number (-1 = nothing) and how far it moved
  //   { t: 'car', i, n, d }                    - the garage car picture, in n slices
  //   { t: 'visit', host: seat | null }        - I walked into this house (null = went home)
  //   { t: 'hop', who: seat }                  - this animal hopped
  // ---------------------------------------------------------------
  const peers = {};       // seat -> { who, ctx, placed, pos, visit, carParts }
  const net = {
    room: null, code: null,
    // send my whole house (or nothing, when not in a room)
    sendHouse(all) {
      const r = this.room; if (!r || !r.open) return;
      clearTimeout(this.t);
      this.t = setTimeout(() => {
        const h = house(), me = Arcade.profiles.active(), c = myCtx();
        r.send({ t: 'hm', who: { pet: me.pet, color: me.color, name: (me.name || '').slice(0, 12) }, ctx: { trophies: c.trophies, sticker: c.sticker, cup: c.cup } });
        for (const room of ROOMS) {
          const s = room.spots.map(sp => { const id = h.placed[sp.id], k = sp.items.findIndex(it => it.id === id), p = h.pos[sp.id] || [0, 0]; return [k, p[0], p[1]]; });
          const me2 = h.pos['me:' + room.id] || [0, 0]; s.push([0, me2[0], me2[1]]);
          if (room.id === 'garage') { const cp = h.pos.car || [0, 0]; s.push([0, cp[0], cp[1]]); }
          r.send({ t: 'hr', r: room.id, s });
        }
        r.send({ t: 'visit', host: visiting });
        if (all) this.sendCar();
      }, all ? 0 : 300);
    },
    // the car picture, made small (a little webp) and cut into slices
    sendCar() {
      const pic = myCtx().car, r = this.room;
      if (!pic || !r) return;
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas'); cv.width = cv.height = 140;
        cv.getContext('2d').drawImage(img, 0, 0, 140, 140);
        let small = cv.toDataURL('image/webp', 0.8);
        if (!/^data:image\/webp/.test(small)) small = cv.toDataURL();       // (no webp on this phone: png)
        const n = Math.ceil(small.length / 800);
        for (let i = 0; i < n; i++) r.send({ t: 'car', i, n, d: small.slice(i * 800, (i + 1) * 800) });
      };
      img.src = pic;
    },
    open(code) {
      this.leave();
      this.code = code;
      const r = this.room = Arcade.net.join(code);
      r.on('hello', () => { this.sendHouse(true); redraw(); });
      r.on('join', () => { this.sendHouse(true); });
      r.on('hm', (m) => { const p = peers[m.from] = peers[m.from] || {}; const isNew = !p.who; p.who = m.who; p.ctx = Object.assign({ car: (p.ctx || {}).car || null }, m.ctx); if (isNew) Arcade.sfx('pop'); redraw(); });
      r.on('hr', (m) => {
        const p = peers[m.from] = peers[m.from] || {}, room = ROOMS.find(x => x.id === m.r);
        if (!room || !Array.isArray(m.s)) return;
        p.placed = p.placed || {}; p.pos = p.pos || {};
        room.spots.forEach((sp, i) => { const v = m.s[i] || [-1, 0, 0]; p.placed[sp.id] = (sp.items[v[0]] || {}).id || ''; p.pos[sp.id] = [+v[1] || 0, +v[2] || 0]; });
        const me2 = m.s[room.spots.length] || [0, 0, 0]; p.pos['me:' + room.id] = [+me2[1] || 0, +me2[2] || 0];
        if (room.id === 'garage') { const cp = m.s[room.spots.length + 1] || [0, 0, 0]; p.pos.car = [+cp[1] || 0, +cp[2] || 0]; }
        if (visiting === m.from) drawRoom();
      });
      r.on('car', (m) => {
        const p = peers[m.from] = peers[m.from] || {};
        p.carParts = p.carParts || [];
        p.carParts[m.i] = String(m.d || '');
        if (p.carParts.filter(x => x != null).length === m.n) {
          const pic = p.carParts.join(''); p.carParts = [];
          p.ctx = Object.assign({}, p.ctx, { car: /^data:image\/(png|webp);base64,[A-Za-z0-9+/=]+$/.test(pic) ? pic : null });
          if (visiting === m.from) drawRoom();
        }
      });
      r.on('visit', (m) => {
        const p = peers[m.from] = peers[m.from] || {};
        const was = p.visit;
        p.visit = m.host == null ? null : +m.host;
        // a friend walked into MY house: say hi
        if (p.visit === r.seat && was !== r.seat && p.who) { Arcade.toast('', Arcade.profiles.avatar(p.who)); Arcade.sfx('star'); }
        redraw();
      });
      r.on('hop', (m) => { if (m.who === r.seat) hopAnimal('self', false); else hopAnimal(String(m.who), false); });
      r.on('leave', (m) => {
        delete peers[m.seat];
        if (visiting === m.seat) { visiting = null; Arcade.sfx('aww'); }
        redraw();
      });
      r.on('full', () => { Arcade.sfx('aww'); this.leave(); showFriends(); });
      r.on('closed', () => { Arcade.sfx('aww'); Arcade.toast('No connection', Arcade.net.FRIENDS_PIC); this.leave(); visiting = null; redraw(); });
    },
    leave() {
      if (this.room) this.room.close();
      this.room = null; this.code = null;
      for (const k in peers) delete peers[k];
    },
  };

  // ---- the Friends window ----
  const ov = document.getElementById('friends'), ovp = document.getElementById('fpanel'), fbtn = document.getElementById('fbtn');
  const friendSeats = () => Object.keys(peers).filter(s => peers[s].who).map(Number);
  function drawFriendsBtn() {
    if (!Arcade.net) { fbtn.hidden = true; return; }
    const n = net.room ? friendSeats().length : 0;
    fbtn.innerHTML = Arcade.net.FRIENDS_PIC + (net.room ? `<span class="bub">${n}</span>` : '');
    fbtn.classList.toggle('on', !!net.room);
  }
  let ovShowsRoom = false;
  function showFriends() {
    ov.hidden = false;
    ovShowsRoom = !!net.room;
    const close = `<button type="button" class="round" data-close="1" aria-label="Close">${X}</button>`;
    if (!net.room) {
      ovp.innerHTML = `<div class="fbig">${Arcade.net.FRIENDS_PIC}</div><div class="frow">` +
        `<button type="button" class="ftile" data-make="1" aria-label="Make a room">${Arcade.net.codeHTML([0, 3, 6], 44)}</button>` +
        `<button type="button" class="ftile" data-join="1" aria-label="Join">${Arcade.net.FRIENDS_PIC.replace('<svg', '<svg style="width:70px;height:70px"')}</button></div><div class="frow">${close}</div>`;
      return;
    }
    // in a room: the 3 pictures, me, and every friend (tap a friend = visit their house)
    const me = Arcade.profiles.active();
    const friends = friendSeats().map(s => `<button type="button" class="fav" data-visit="${s}" aria-label="Visit ${Arcade.escapeHTML(peers[s].who.name || 'friend')}">${Arcade.profiles.avatar(peers[s].who)}<span class="go">${MYHOUSE}</span></button>`).join('');
    ovp.innerHTML = Arcade.net.codeHTML(net.code, 64) +
      `<div class="frow"><span class="fav me">${Arcade.profiles.avatar(me)}</span>${friends || `<span class="wait">${Arcade.net.FRIENDS_PIC}</span>`}</div>` +
      `<div class="frow"><button type="button" class="round leave" data-leave="1" aria-label="Leave the room">${Arcade.icons.left}</button>${close}</div>`;
  }
  ovp.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    Arcade.audio.resume();
    if (b.dataset.close) { Arcade.sfx('click'); ov.hidden = true; return; }
    if (b.dataset.make) { Arcade.sfx('click'); net.open(Arcade.net.newCode()); showFriends(); return; }
    if (b.dataset.join) {
      Arcade.sfx('click'); ovShowsRoom = false;
      ovp.innerHTML = '';
      ovp.appendChild(Arcade.net.picker((code) => { net.open(code); showFriends(); }));
      ovp.insertAdjacentHTML('beforeend', `<div class="frow"><button type="button" class="round" data-close="1" aria-label="Close">${X}</button></div>`);
      return;
    }
    if (b.dataset.leave) { Arcade.sfx('click'); goHome(); net.leave(); redraw(); showFriends(); return; }
    if (b.dataset.visit != null) { visit(+b.dataset.visit); ov.hidden = true; }
  });
  ov.addEventListener('click', (e) => { if (e.target === ov) ov.hidden = true; });
  fbtn.addEventListener('click', () => { Arcade.audio.resume(); Arcade.sfx('click'); showFriends(); });

  function visit(seat) {
    if (!peers[seat] || !peers[seat].who) return;
    visiting = seat; trying = null;
    Arcade.sfx('coin'); setTimeout(() => Arcade.sfx('star'), 150);
    if (net.room) net.room.send({ t: 'visit', host: seat });
    redraw();
  }
  function goHome() {
    if (visiting == null) return;
    visiting = null;
    if (net.room) net.room.send({ t: 'visit', host: null });
    roomId = roomById(house().room).id;
    spot = roomById(roomId).spots.find(s => !s.swatch).id;
  }
  // visiting: the friend's face + a "back to my house" button over the room
  function drawVisit() {
    if (visiting == null || !peers[visiting]) { visitEl.hidden = true; return; }
    visitEl.hidden = false;
    visitEl.innerHTML = `<span class="fav">${Arcade.profiles.avatar(peers[visiting].who)}</span>` +
      `<button type="button" class="round" data-home="1" aria-label="Back to my house">${MYHOUSE}</button>`;
  }
  visitEl.addEventListener('click', (e) => { if (e.target.closest('[data-home]')) { Arcade.audio.resume(); Arcade.sfx('swish'); goHome(); redraw(); } });

  document.getElementById('home').innerHTML = Arcade.icons.home;
  // how to get coins: trophy -> coin (shown when you try to buy without enough coins)
  document.getElementById('how').innerHTML = Arcade.icons.trophy + `<svg viewBox="0 0 48 48"><path d="M8 24 H36 M28 14 L38 24 L28 34" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 24 H36 M28 14 L38 24 L28 34" fill="none" stroke="#2b2b2b" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>` + COIN;
  document.getElementById('how').addEventListener('click', (e) => e.currentTarget.classList.remove('show'));
  addEventListener('pagehide', () => net.leave());
  redraw();

  // test hooks
  window.__houseState = () => ({ coins: coins(), spent: house().spent, owned: house().owned.slice(), placed: Object.assign({}, house().placed), pos: JSON.parse(JSON.stringify(house().pos)),
    trying, spot, room: roomId, rooms: ROOMS.map(r => r.id), spots: roomById(roomId).spots.map(s => s.id), visiting, seat: net.room ? net.room.seat : null, code: net.code,
    friends: friendSeats().map(s => ({ seat: s, visit: peers[s].visit, placed: Object.keys(peers[s].placed || {}).length, car: !!(peers[s].ctx || {}).car })),
    guests: [...roomEl.querySelectorAll('[data-who]')].map(e => e.dataset.who) });
  window.__houseItems = () => ROOMS.map(r => ({ room: r.id, spots: r.spots.map(sp => ({ id: sp.id, items: sp.items.map(it => it.id) })) }));
})();
