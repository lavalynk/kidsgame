// =====================================================================
// Potion Quest - every drawing (heroes, baddies, jars, backgrounds, spells).
// The rules of the game are in quest.js; this file only paints.
//
// Everything is drawn with canvas paths in the house style: bright colors,
// thick dark outlines, round shapes, friendly faces. Nothing scary: the
// baddies are grumpy jelly blobs, snails and mushrooms that poof into sparkles.
//
// A character is drawn standing on its feet at (x, y); "face" is 1 (looking
// right) or -1 (left).
//
// Speed (Keith, Nov 13: "it seems laggy"): the backgrounds are painted ONCE
// into hidden pictures (see layers()) and then just copied onto the screen
// every frame, instead of being drawn shape by shape 60 times a second.
// =====================================================================
window.QuestArt = (function () {
  'use strict';
  const { draw } = Arcade;
  const INK = '#2b2b2b';
  const TAU = Math.PI * 2;

  function line(ctx, w = 4) { ctx.lineWidth = w; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
  function blob(ctx, fill, w = 4) { ctx.fillStyle = fill; ctx.fill(); line(ctx, w); }
  function paint(ctx, fill) { ctx.fillStyle = fill; ctx.fill(); }                 // a shape with no outline (shading, shine)
  function shadow(ctx, x, y, r, k = 1) { ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, y + 2, r * k, r * 0.28 * k, 0, 0, TAU); ctx.fill(); }
  // two shiny eyes; mood: 'happy' | 'grumpy' | 'dizzy' | 'oops'
  function eyes(ctx, x, y, gap, r, mood) {
    for (const s of [-1, 1]) {
      const ex = x + s * gap;
      if (mood === 'dizzy') { ctx.beginPath(); ctx.moveTo(ex - r, y - r); ctx.lineTo(ex + r, y + r); ctx.moveTo(ex + r, y - r); ctx.lineTo(ex - r, y + r); line(ctx, 3); continue; }
      draw.circle(ctx, ex, y, r, INK, 0); draw.circle(ctx, ex + r * 0.3, y - r * 0.35, r * 0.38, '#fff', 0); draw.circle(ctx, ex - r * 0.3, y + r * 0.35, r * 0.18, '#fff', 0);
      if (mood === 'grumpy') { ctx.beginPath(); ctx.moveTo(ex - s * r * 1.5, y - r * 2.1); ctx.lineTo(ex + s * r * 1.2, y - r * 1.2); line(ctx, 3.5); }
    }
  }
  function smile(ctx, x, y, w, mood) {
    ctx.beginPath();
    if (mood === 'grumpy') { ctx.moveTo(x - w, y + 3); ctx.quadraticCurveTo(x, y - w * 0.6, x + w, y + 3); }
    else if (mood === 'oops' || mood === 'dizzy') { ctx.ellipse(x, y + 1, w * 0.5, w * 0.6, 0, 0, TAU); }
    else { ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x, y + w * 0.9, x + w, y); }
    line(ctx, 3);
  }

  // ---------------------------------------------------------------
  // The three heroes. o = { face, walk (a number that grows while walking),
  //   bonk (0..1 while swinging, else -1), hurt (true = blinking), cheer, magic }
  // Each one is built from the feet up: cape, legs + boots, back arm, tunic
  // with its trimmings, head (hair, ears, face), hat, then the front arm
  // with the sword / staff / wand.
  // ---------------------------------------------------------------
  const HERO_LOOK = {
    knight: { body: '#4c8dff', dark: '#2f6fe0', trim: '#ffd166', skin: '#ffd6a5', legs: '#3a5a9c', boot: '#8d5524', hair: '#8d5524', sleeve: '#c9d6df' },
    ranger: { body: '#3fae5a', dark: '#2c8a44', trim: '#8d5524', skin: '#f2c9a0', legs: '#b08a5a', boot: '#6b4423', hair: '#e8742c', sleeve: '#3fae5a' },
    wizard: { body: '#9b5de5', dark: '#7b3fd1', trim: '#ffd166', skin: '#ffe0bd', legs: '#6a3fb0', boot: '#4a2c8a', hair: '#fff3d6', sleeve: '#9b5de5' },
  };
  function hero(ctx, kind, x, y, t, o = {}) {
    const L = HERO_LOOK[kind], face = o.face || 1;
    const step = Math.sin((o.walk || 0) * 11), bob = o.cheer ? Math.abs(Math.sin(t * 9)) * 14 : Math.abs(step) * 3;
    const sway = Math.sin(t * 3) * 2 + step * 3;
    shadow(ctx, x, y, 30);
    if (o.hurt && Math.floor(t * 14) % 2) return;                 // blinking after a bump
    ctx.save(); ctx.translate(x, y - bob); ctx.scale(face, 1);

    // ---- behind: cape / cloak / quiver ----
    if (kind === 'knight') {
      ctx.beginPath(); ctx.moveTo(-14, -62); ctx.quadraticCurveTo(-34 - sway, -40, -30 - sway * 1.5, -8); ctx.quadraticCurveTo(-18, -14, -8 - sway * 0.5, -6); ctx.lineTo(-4, -58); ctx.closePath(); blob(ctx, '#ef476f');
      ctx.beginPath(); ctx.moveTo(-18, -44); ctx.quadraticCurveTo(-22 - sway, -28, -20 - sway, -14); line(ctx, 2.5);
    } else if (kind === 'ranger') {
      ctx.save(); ctx.translate(-16, -46); ctx.rotate(-0.35);       // a quiver with three arrows
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-5 + i * 5, -22); ctx.lineTo(-5 + i * 5, -34); line(ctx, 2.5); ctx.beginPath(); ctx.ellipse(-5 + i * 5, -36, 3, 5, 0, 0, TAU); blob(ctx, ['#ef476f', '#fff', '#ffd166'][i], 2); }
      ctx.beginPath(); ctx.roundRect(-9, -24, 18, 34, 5); blob(ctx, '#a47148', 3.5);
      ctx.restore();
    } else {
      ctx.beginPath(); ctx.moveTo(-12, -60); ctx.quadraticCurveTo(-30 - sway, -30, -28 - sway, -4); ctx.lineTo(-10, -4); ctx.closePath(); blob(ctx, L.dark);   // the back of the robe
    }

    // ---- legs + boots (the wizard's robe hides them: just two boot tips) ----
    for (const s of [-1, 1]) {
      const lx = -13 + (s > 0 ? 14 : 0) + s * step * 5;
      if (kind !== 'wizard') { ctx.beginPath(); ctx.roundRect(lx, -22 + bob * 0.5, 12, 16, 4); blob(ctx, L.legs, 3.5); }
      ctx.beginPath(); ctx.roundRect(lx - 1, -9 + bob * 0.5, 17, 11, 5); blob(ctx, L.boot, 3.5);
      if (kind !== 'wizard') { ctx.beginPath(); ctx.moveTo(lx - 1, -9 + bob * 0.5); ctx.lineTo(lx + 14, -9 + bob * 0.5); ctx.strokeStyle = L.trim; ctx.lineWidth = 3; ctx.stroke(); }
    }
    // ---- back arm ----
    ctx.beginPath(); ctx.roundRect(-24, -58, 12, 24, 6); blob(ctx, L.sleeve, 3.5);
    if (kind === 'knight') {          // ...carrying a round shield
      draw.circle(ctx, -22, -38, 17, '#ef476f', 4); draw.circle(ctx, -22, -38, 11.5, '#fff', 2.5); draw.star(ctx, -22, -38, 7, '#ffd166', 2);
    } else draw.circle(ctx, -18, -33, 6.5, L.skin, 3.5);

    // ---- the tunic / robe ----
    ctx.beginPath();
    if (kind === 'wizard') { ctx.moveTo(-17, -62); ctx.lineTo(17, -62); ctx.lineTo(25, -3); ctx.quadraticCurveTo(0, 3, -25, -3); ctx.closePath(); }
    else ctx.roundRect(-18, -64, 36, 46, 12);
    blob(ctx, L.body);
    // a darker side (a little shading) and the trimmings
    if (kind === 'wizard') {
      ctx.beginPath(); ctx.moveTo(-17, -60); ctx.lineTo(-8, -60); ctx.lineTo(-13, -4); ctx.lineTo(-24, -4); ctx.closePath(); paint(ctx, 'rgba(0,0,0,0.13)');
      ctx.beginPath(); ctx.moveTo(-24, -10); ctx.quadraticCurveTo(0, -3, 24, -10); ctx.strokeStyle = L.trim; ctx.lineWidth = 5; ctx.stroke();        // gold hem
      for (const [sx, sy, r] of [[-8, -22, 4.5], [8, -30, 3.5], [3, -16, 3]]) draw.star(ctx, sx, sy, r, '#ffd166', 0);                              // stars on the robe
      ctx.beginPath(); ctx.moveTo(-13, -62); ctx.lineTo(0, -50); ctx.lineTo(13, -62); ctx.closePath(); blob(ctx, '#fff3d6', 3);                     // collar
    } else {
      ctx.beginPath(); ctx.roundRect(-16, -62, 9, 42, 6); paint(ctx, 'rgba(0,0,0,0.13)');
      if (kind === 'knight') {
        ctx.beginPath(); ctx.moveTo(-9, -60); ctx.lineTo(9, -60); ctx.lineTo(9, -44); ctx.quadraticCurveTo(0, -36, -9, -44); ctx.closePath(); blob(ctx, '#dfe7ee', 3);   // chest plate
        draw.star(ctx, 0, -50, 5, '#ffd166', 0);
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 17, -60, 8, 6, 0, 0, TAU); blob(ctx, '#c9d6df', 3); }                           // shoulder pads
      } else {
        ctx.beginPath(); ctx.moveTo(-15, -58); ctx.lineTo(15, -36); ctx.strokeStyle = L.trim; ctx.lineWidth = 5; ctx.stroke();                       // the quiver's strap
        ctx.beginPath(); ctx.moveTo(-18, -22); ctx.lineTo(-10, -14); ctx.lineTo(-2, -22); ctx.lineTo(6, -14); ctx.lineTo(14, -22); ctx.lineTo(18, -18); ctx.lineTo(18, -24); ctx.lineTo(-18, -24); ctx.closePath(); paint(ctx, L.dark);   // zig-zag hem
      }
    }
    ctx.beginPath(); ctx.rect(-17, -35, 34, 7); blob(ctx, L.trim, 2.5);                 // belt
    ctx.beginPath(); ctx.roundRect(-5, -37, 10, 11, 2); blob(ctx, kind === 'ranger' ? '#ffd166' : '#fff', 2.5);   // buckle
    if (kind === 'ranger') { ctx.beginPath(); ctx.moveTo(-18, -60); ctx.quadraticCurveTo(0, -48, 18, -60); ctx.quadraticCurveTo(0, -56, -18, -60); blob(ctx, '#ef476f', 3); }   // scarf

    // ---- head: ears, hair behind, face ----
    draw.circle(ctx, -20, -82, 6, L.skin, 3.5);
    if (kind === 'ranger') { ctx.beginPath(); ctx.moveTo(-18, -92); ctx.quadraticCurveTo(-40, -86, -34 - sway, -62); ctx.quadraticCurveTo(-26, -72, -16, -74); ctx.closePath(); blob(ctx, L.hair, 3.5); }     // a ponytail
    if (kind === 'wizard') for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 21, -74, 8, 12, s * 0.3, 0, TAU); blob(ctx, L.hair, 3); }                                                     // fluffy hair
    draw.circle(ctx, 0, -84, 24, L.skin, 4);
    ctx.beginPath(); ctx.arc(0, -84, 22, Math.PI * 1.05, Math.PI * 1.95); ctx.quadraticCurveTo(10, -94, 2, -96); ctx.quadraticCurveTo(-8, -92, -21, -91); ctx.closePath(); paint(ctx, L.hair);             // a fringe
    const mood = o.hurt ? 'oops' : 'happy';
    eyes(ctx, 6, -85, 8, 4.6, mood);
    if (!o.hurt) { ctx.beginPath(); ctx.moveTo(-6, -93); ctx.quadraticCurveTo(-2, -96, 2, -93); ctx.moveTo(10, -93); ctx.quadraticCurveTo(14, -96, 18, -93); line(ctx, 2.5); }                       // eyebrows
    if (o.cheer) { ctx.beginPath(); ctx.arc(7, -76, 6, 0, Math.PI); ctx.closePath(); blob(ctx, '#ef476f', 2.5); } else smile(ctx, 7, -75, 6, mood);
    draw.circle(ctx, -7, -77, 4.5, 'rgba(255,120,150,0.55)', 0); draw.circle(ctx, 20, -77, 4, 'rgba(255,120,150,0.55)', 0);

    // ---- hats ----
    if (kind === 'knight') {
      ctx.beginPath(); ctx.arc(0, -90, 25, Math.PI, 0); ctx.lineTo(25, -86); ctx.lineTo(-25, -86); ctx.closePath(); blob(ctx, '#c9d6df');
      ctx.beginPath(); ctx.arc(0, -90, 19, Math.PI * 1.15, Math.PI * 1.5); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();       // shine
      ctx.beginPath(); ctx.roundRect(-27, -92, 54, 8, 4); blob(ctx, '#9aa5b1', 3);                                                                              // the brim
      for (const rx of [-18, 0, 18]) draw.circle(ctx, rx, -88, 2, '#ffd166', 0);                                                                               // rivets
      ctx.beginPath(); ctx.moveTo(-2, -114); ctx.quadraticCurveTo(-24 - sway, -140, -34 - sway, -106); ctx.quadraticCurveTo(-18, -114, -2, -108); ctx.closePath(); blob(ctx, '#ef476f', 3.5);   // plume
      ctx.beginPath(); ctx.moveTo(-8, -114); ctx.quadraticCurveTo(-20 - sway, -126, -26 - sway, -112); line(ctx, 2);
    } else if (kind === 'ranger') {
      ctx.beginPath(); ctx.moveTo(-27, -84); ctx.quadraticCurveTo(-30, -116, 0, -114); ctx.quadraticCurveTo(26, -112, 27, -92); ctx.quadraticCurveTo(0, -106, -14, -88); ctx.closePath(); blob(ctx, '#2f8f46');
      ctx.beginPath(); ctx.moveTo(-22, -108); ctx.lineTo(-42, -122); ctx.lineTo(-28, -98); ctx.closePath(); blob(ctx, '#2f8f46', 3.5);                           // the pointy tip
      ctx.beginPath(); ctx.moveTo(-20, -92); ctx.quadraticCurveTo(0, -108, 26, -94); ctx.strokeStyle = '#8d5524'; ctx.lineWidth = 4; ctx.stroke();               // hat band
      ctx.beginPath(); ctx.moveTo(8, -104); ctx.quadraticCurveTo(22, -132, 30, -122); ctx.quadraticCurveTo(22, -112, 12, -102); ctx.closePath(); blob(ctx, '#ef476f', 3);    // a feather
    } else {
      const tip = Math.sin(t * 3) * 3;
      ctx.beginPath(); ctx.moveTo(-28, -98); ctx.quadraticCurveTo(0, -108, 28, -98); ctx.quadraticCurveTo(16, -130, 20 + tip, -150); ctx.quadraticCurveTo(-6, -138, -28, -98); ctx.closePath(); blob(ctx, '#7b3fd1');
      ctx.beginPath(); ctx.moveTo(-22, -104); ctx.quadraticCurveTo(0, -114, 22, -106); ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 6; ctx.stroke();               // gold band
      ctx.beginPath(); ctx.ellipse(0, -98, 35, 8, 0, 0, TAU); blob(ctx, '#9b5de5', 3.5);                                                                          // the brim
      draw.star(ctx, 4, -122, 7, '#ffd166', 2); draw.circle(ctx, -8, -112, 2.5, '#fff', 0); draw.circle(ctx, 14, -134, 2, '#fff', 0);
      draw.star(ctx, 20 + tip, -152, 6, '#fff', 2);                                                                                                               // a star on the tip
    }

    // ---- front arm + the thing in the hand. Swinging goes from "up behind" to "down in front" ----
    let a = -0.5 + Math.sin(t * 2.4) * 0.06;
    if (o.bonk >= 0) a = -2.1 + Math.min(1, o.bonk * 1.8) * 2.7;
    if (o.cheer || o.magic) a = -1.9;
    ctx.save(); ctx.translate(12, -54); ctx.rotate(a);
    ctx.beginPath(); ctx.roundRect(-8, -7, 18, 14, 7); blob(ctx, L.sleeve, 3.5);        // the sleeve
    if (kind === 'knight') {          // a sword
      ctx.beginPath(); ctx.moveTo(14, -6); ctx.lineTo(58, -6); ctx.lineTo(68, 0); ctx.lineTo(58, 6); ctx.lineTo(14, 6); ctx.closePath(); blob(ctx, '#eef3f7', 3.5);
      ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(60, 0); ctx.strokeStyle = '#b8c4cf'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.beginPath(); ctx.roundRect(9, -14, 8, 28, 3); blob(ctx, '#ffd166', 3.5);
      draw.circle(ctx, -4, 0, 4.5, '#ef476f', 2.5);
    } else if (kind === 'ranger') {   // a staff with leaves and a little glowing ball
      ctx.beginPath(); ctx.roundRect(-18, -4, 80, 8, 4); blob(ctx, '#a47148', 3.5);
      for (const gx of [20, 28]) { ctx.beginPath(); ctx.moveTo(gx, -4); ctx.lineTo(gx, 4); line(ctx, 2); }
      ctx.beginPath(); ctx.ellipse(62, -11, 12, 6, -0.7, 0, TAU); blob(ctx, '#6cc04a', 3);
      ctx.beginPath(); ctx.ellipse(64, 10, 10, 5, 0.7, 0, TAU); blob(ctx, '#8fe07a', 3);
      draw.circle(ctx, 70, 0, 6 + Math.sin(t * 6), '#ffd166', 3);
    } else {                          // a wand with a star
      ctx.beginPath(); ctx.roundRect(6, -3.5, 36, 7, 3); blob(ctx, '#8d5524', 3);
      ctx.beginPath(); ctx.roundRect(36, -4.5, 8, 9, 2); blob(ctx, '#ffd166', 2.5);
      draw.star(ctx, 52, 0, 13 + Math.sin(t * 8) * 1.5, '#ffd166', 3);
      draw.circle(ctx, 62 + Math.sin(t * 5) * 4, -14, 2.5, '#fff', 0); draw.circle(ctx, 66, 10 + Math.cos(t * 6) * 3, 2, '#fff', 0);
    }
    draw.circle(ctx, 6, 0, 7.5, kind === 'knight' ? '#8d5524' : L.skin, 3.5);    // the hand (the knight wears a glove)
    ctx.restore();
    ctx.restore();
  }
  // the swoosh in front of a bonk (k = 0..1)
  function swoosh(ctx, x, y, face, range, k, color) {
    ctx.save(); ctx.translate(x, y - 50); ctx.scale(face, 1); ctx.globalAlpha = 1 - k;
    ctx.beginPath(); ctx.arc(10, 0, range, -1.2 + k * 0.6, 0.9 + k * 0.2);
    ctx.strokeStyle = color; ctx.lineWidth = 14 * (1 - k * 0.5); ctx.lineCap = 'round'; ctx.stroke();
    ctx.restore();
  }

  // ---------------------------------------------------------------
  // The baddies. f = { type, x, y, z, face, t, state, flash, hp, r, spin }
  //   blob / mini / bigblob / king: jelly      hopper: a bouncy ball with ears
  //   roller: a bumpy ball                     shroom: a mushroom that lobs puffballs
  //   flutter: a round bird                    shell: a snail (hides in its shell)
  //   rocky: a walking boulder
  // ---------------------------------------------------------------
  const JELLY = { blob: ['#7bd389', '#55b56b'], mini: ['#5fd4e8', '#3aa9c4'], bigblob: ['#ffb347', '#e8912a'], king: ['#c77dff', '#a45ee0'] };
  function foe(ctx, f, t) {
    const dizzy = f.state === 'stun' || f.state === 'dizzy', wind = f.state === 'windup';
    const mood = dizzy ? 'dizzy' : 'grumpy';
    const R = f.r, z = f.z || 0;
    shadow(ctx, f.x, f.y, R * 1.05, 1 - Math.min(0.5, z / 300));
    ctx.save(); ctx.translate(f.x, f.y - z);
    const pop = f.flash > 0 ? 1.12 : 1;                                             // a bonked baddie puffs up for a moment
    const sq = wind ? 1 + Math.sin(f.t * 30) * 0.06 : 1 + Math.sin(t * 4 + f.x) * 0.04;      // jelly wobble / shaking before a bump
    ctx.scale(f.face * (2 - sq) * pop, sq * pop);
    const type = f.type;
    if (JELLY[type]) {
      const [c, dark] = JELLY[type], king = type === 'king';
      if (king) {          // a little royal cape behind
        ctx.beginPath(); ctx.moveTo(-R * 0.9, -R * 0.9); ctx.quadraticCurveTo(-R * 1.5, -R * 0.3, -R * 1.35, 0); ctx.lineTo(-R * 0.6, 0); ctx.closePath(); blob(ctx, '#ef476f');
      }
      ctx.beginPath(); ctx.moveTo(-R, 0); ctx.quadraticCurveTo(-R * 1.1, -R * 1.5, 0, -R * 1.55); ctx.quadraticCurveTo(R * 1.1, -R * 1.5, R, 0); ctx.quadraticCurveTo(0, R * 0.2, -R, 0); ctx.closePath(); blob(ctx, c, king ? 5 : 4);
      ctx.beginPath(); ctx.moveTo(-R * 0.92, -R * 0.1); ctx.quadraticCurveTo(0, R * 0.12, R * 0.92, -R * 0.1); ctx.quadraticCurveTo(0, -R * 0.38, -R * 0.92, -R * 0.1); paint(ctx, dark);     // darker underneath
      ctx.beginPath(); ctx.ellipse(-R * 0.42, -R * 1.1, R * 0.16, R * 0.26, 0.5, 0, TAU); paint(ctx, 'rgba(255,255,255,0.5)');                                                           // shine
      draw.circle(ctx, -R * 0.55, -R * 0.55, R * 0.07, 'rgba(255,255,255,0.45)', 0); draw.circle(ctx, R * 0.6, -R * 1.0, R * 0.06, 'rgba(255,255,255,0.45)', 0);                             // bubbles inside
      eyes(ctx, R * 0.15, -R * 0.8, R * 0.3, R * 0.12, mood); smile(ctx, R * 0.15, -R * 0.42, R * 0.2, mood);
      draw.circle(ctx, -R * 0.38, -R * 0.55, R * 0.1, 'rgba(255,120,150,0.5)', 0); draw.circle(ctx, R * 0.68, -R * 0.55, R * 0.1, 'rgba(255,120,150,0.5)', 0);
      if (type === 'bigblob') for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * R * 0.55, -R * 1.5, R * 0.16, R * 0.24, s * 0.5, 0, TAU); blob(ctx, c, 3.5); }                   // two little bumps on top
      if (type === 'mini') { ctx.beginPath(); ctx.moveTo(0, -R * 1.5); ctx.quadraticCurveTo(R * 0.3, -R * 2.1, R * 0.7, -R * 1.9); line(ctx, 3); draw.circle(ctx, R * 0.7, -R * 1.9, R * 0.2, '#ffd166', 2.5); }   // a wobbly feeler
      if (king) {
        ctx.beginPath(); ctx.moveTo(-R * 0.2, -R * 0.36); ctx.quadraticCurveTo(-R * 0.5, -R * 0.2, -R * 0.62, -R * 0.42); ctx.moveTo(R * 0.5, -R * 0.36); ctx.quadraticCurveTo(R * 0.8, -R * 0.2, R * 0.92, -R * 0.42); line(ctx, 4);   // a curly moustache
        ctx.beginPath(); ctx.moveTo(-R * 0.5, -R * 1.45); ctx.lineTo(-R * 0.55, -R * 2.0); ctx.lineTo(-R * 0.25, -R * 1.72); ctx.lineTo(0, -R * 2.1); ctx.lineTo(R * 0.25, -R * 1.72); ctx.lineTo(R * 0.55, -R * 2.0); ctx.lineTo(R * 0.5, -R * 1.45); ctx.closePath(); blob(ctx, '#ffc93c', 4);
        draw.circle(ctx, 0, -R * 1.62, R * 0.09, '#ef476f', 3); draw.circle(ctx, -R * 0.32, -R * 1.58, R * 0.06, '#4cc9f0', 2); draw.circle(ctx, R * 0.32, -R * 1.58, R * 0.06, '#4cc9f0', 2);
        for (const cx of [-R * 0.55, 0, R * 0.55]) draw.circle(ctx, cx, cx ? -R * 2.0 : -R * 2.1, R * 0.07, '#fff', 2);
      }
    } else if (type === 'hopper') {
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * R * 0.6, -2, R * 0.46, R * 0.2, 0, 0, TAU); blob(ctx, '#e07a1f', 3.5); ctx.beginPath(); ctx.moveTo(s * R * 0.6 + R * 0.2, -R * 0.14); ctx.lineTo(s * R * 0.6 + R * 0.2, R * 0.1); line(ctx, 2); }
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * R * 0.5 + R * 0.1, -R * 1.95, R * 0.24, R * 0.5, s * 0.25, 0, TAU); blob(ctx, '#ff9f43', 3.5); ctx.beginPath(); ctx.ellipse(s * R * 0.5 + R * 0.1, -R * 1.95, R * 0.1, R * 0.3, s * 0.25, 0, TAU); paint(ctx, '#ffd6a5'); }   // long ears
      draw.circle(ctx, 0, -R, R, '#ff9f43', 4);
      ctx.beginPath(); ctx.ellipse(R * 0.1, -R * 0.6, R * 0.6, R * 0.5, 0, 0, TAU); paint(ctx, '#ffd6a5');                                                 // tummy
      ctx.beginPath(); ctx.ellipse(-R * 0.45, -R * 1.5, R * 0.14, R * 0.22, 0.5, 0, TAU); paint(ctx, 'rgba(255,255,255,0.5)');
      eyes(ctx, R * 0.15, -R * 1.15, R * 0.34, R * 0.14, mood); smile(ctx, R * 0.15, -R * 0.68, R * 0.22, mood);
      draw.circle(ctx, R * 0.15, -R * 0.9, R * 0.08, '#e07a1f', 0);                                                                                       // a little nose
    } else if (type === 'roller') {
      ctx.save(); ctx.translate(0, -R); ctx.rotate(f.spin || 0);
      for (let i = 0; i < 8; i++) { const a = i * TAU / 8; draw.circle(ctx, Math.cos(a) * R * 0.92, Math.sin(a) * R * 0.92, R * 0.3, i % 2 ? '#5b6ee1' : '#8f6ee1', 3.5); }    // soft round bumps, not spikes
      draw.circle(ctx, 0, 0, R * 0.92, '#7f8cff', 4);
      ctx.beginPath(); ctx.arc(0, 0, R * 0.62, 0, TAU); ctx.strokeStyle = '#5b6ee1'; ctx.lineWidth = 4; ctx.stroke();
      ctx.restore();
      ctx.beginPath(); ctx.ellipse(-R * 0.4, -R * 1.45, R * 0.13, R * 0.2, 0.5, 0, TAU); paint(ctx, 'rgba(255,255,255,0.5)');
      eyes(ctx, R * 0.12, -R * 1.1, R * 0.3, R * 0.13, mood); smile(ctx, R * 0.12, -R * 0.7, R * 0.2, mood);
    } else if (type === 'shroom') {
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * R * 0.7, -R * 0.55, R * 0.2, R * 0.12, s * 0.5, 0, TAU); blob(ctx, '#fff3d6', 3); }    // tiny arms
      ctx.beginPath(); ctx.roundRect(-R * 0.55, -R * 1.1, R * 1.1, R * 1.1, R * 0.4); blob(ctx, '#fff3d6');
      ctx.beginPath(); ctx.roundRect(-R * 0.5, -R * 1.05, R * 0.28, R * 1.0, R * 0.14); paint(ctx, 'rgba(0,0,0,0.1)');
      eyes(ctx, R * 0.1, -R * 0.62, R * 0.26, R * 0.12, mood); smile(ctx, R * 0.1, -R * 0.3, R * 0.16, mood);
      draw.circle(ctx, -R * 0.3, -R * 0.42, R * 0.09, 'rgba(255,120,150,0.5)', 0); draw.circle(ctx, R * 0.48, -R * 0.42, R * 0.09, 'rgba(255,120,150,0.5)', 0);
      ctx.beginPath(); ctx.moveTo(-R * 1.15, -R * 1.0); ctx.quadraticCurveTo(-R * 1.1, -R * 2.3, 0, -R * 2.3); ctx.quadraticCurveTo(R * 1.1, -R * 2.3, R * 1.15, -R * 1.0); ctx.quadraticCurveTo(0, -R * 1.25, -R * 1.15, -R * 1.0); ctx.closePath(); blob(ctx, '#ef476f');
      ctx.beginPath(); ctx.moveTo(-R * 1.05, -R * 1.08); ctx.quadraticCurveTo(0, -R * 1.34, R * 1.05, -R * 1.08); ctx.quadraticCurveTo(0, -R * 1.6, -R * 1.05, -R * 1.08); paint(ctx, '#c9304f');        // shade under the cap
      draw.circle(ctx, -R * 0.5, -R * 1.75, R * 0.2, '#fff', 0); draw.circle(ctx, R * 0.35, -R * 1.95, R * 0.16, '#fff', 0); draw.circle(ctx, R * 0.62, -R * 1.5, R * 0.13, '#fff', 0); draw.circle(ctx, -R * 0.05, -R * 2.05, R * 0.1, '#fff', 0);
    } else if (type === 'flutter') {
      const flap = Math.sin(t * 22 + f.x) * 0.7;
      for (const s of [-1, 1]) {           // wings
        ctx.save(); ctx.translate(s * R * 0.7, -R * 1.1); ctx.rotate(s * (-0.3 + flap));
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s * R * 1.3, -R * 1.0, s * R * 1.5, 0); ctx.quadraticCurveTo(s * R * 1.1, R * 0.1, s * R * 0.9, R * 0.4); ctx.quadraticCurveTo(s * R * 0.5, R * 0.2, 0, R * 0.3); ctx.closePath(); blob(ctx, '#ff8fab', 3.5);
        ctx.restore();
      }
      draw.circle(ctx, 0, -R, R, '#ff5fa2', 4);
      ctx.beginPath(); ctx.ellipse(R * 0.1, -R * 0.65, R * 0.55, R * 0.45, 0, 0, TAU); paint(ctx, '#ffc2d6');
      ctx.beginPath(); ctx.moveTo(-R * 0.2, -R * 1.9); ctx.lineTo(0, -R * 2.4); ctx.lineTo(R * 0.25, -R * 1.9); ctx.closePath(); blob(ctx, '#ffd166', 3);     // a tuft
      eyes(ctx, R * 0.2, -R * 1.2, R * 0.32, R * 0.15, mood);
      ctx.beginPath(); ctx.moveTo(R * 0.7, -R * 1.0); ctx.lineTo(R * 1.35, -R * 0.85); ctx.lineTo(R * 0.7, -R * 0.65); ctx.closePath(); blob(ctx, '#ffd166', 3);   // beak
    } else if (type === 'shell') {
      const hide = f.state === 'hide';
      if (!hide) {          // the snail's body, head and eye stalks
        ctx.beginPath(); ctx.moveTo(-R * 1.1, 0); ctx.quadraticCurveTo(-R * 1.2, -R * 0.5, -R * 0.4, -R * 0.5); ctx.lineTo(R * 0.7, -R * 0.5); ctx.quadraticCurveTo(R * 1.5, -R * 0.6, R * 1.4, 0); ctx.closePath(); blob(ctx, '#ffe29a');
        for (const s of [0, 1]) { ctx.beginPath(); ctx.moveTo(R * (0.9 + s * 0.3), -R * 0.5); ctx.lineTo(R * (0.95 + s * 0.4), -R * 1.3); line(ctx, 4); draw.circle(ctx, R * (0.95 + s * 0.4), -R * 1.4, R * 0.2, '#fff', 3); draw.circle(ctx, R * (1.0 + s * 0.4), -R * 1.4, R * 0.09, INK, 0); }
        smile(ctx, R * 1.1, -R * 0.2, R * 0.14, mood);
      }
      draw.circle(ctx, -R * 0.15, -R * (hide ? 0.9 : 1.05), R, '#4cc9f0', 4);
      ctx.beginPath(); for (let a = 0; a < TAU * 1.8; a += 0.3) { const rr = R * 0.75 * (1 - a / (TAU * 2)); ctx.lineTo(-R * 0.15 + Math.cos(a) * rr, -R * (hide ? 0.9 : 1.05) + Math.sin(a) * rr); } ctx.strokeStyle = '#2a8fb0'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();   // the spiral
      ctx.beginPath(); ctx.ellipse(-R * 0.55, -R * 1.5, R * 0.14, R * 0.22, 0.6, 0, TAU); paint(ctx, 'rgba(255,255,255,0.55)');
    } else if (type === 'rocky') {
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.roundRect(s * R * 0.55 - R * 0.25, -R * 0.3, R * 0.5, R * 0.34, R * 0.12); blob(ctx, '#8d99ae', 3.5); }           // feet
      for (const s of [-1, 1]) { draw.circle(ctx, s * R * 1.05, -R * 0.9 + (wind ? -R * 0.5 : 0), R * 0.3, '#aab4c3', 3.5); }                                           // fists (up before a stomp)
      ctx.beginPath(); ctx.moveTo(-R, -R * 0.3); ctx.lineTo(-R * 0.9, -R * 1.4); ctx.lineTo(-R * 0.3, -R * 1.9); ctx.lineTo(R * 0.5, -R * 1.85); ctx.lineTo(R, -R * 1.2); ctx.lineTo(R * 0.9, -R * 0.3); ctx.closePath(); blob(ctx, '#aab4c3');
      ctx.beginPath(); ctx.moveTo(-R * 0.95, -R * 0.35); ctx.lineTo(-R * 0.88, -R * 1.35); ctx.lineTo(-R * 0.5, -R * 1.2); ctx.lineTo(-R * 0.55, -R * 0.35); ctx.closePath(); paint(ctx, 'rgba(0,0,0,0.12)');
      ctx.beginPath(); ctx.moveTo(-R * 0.9, -R * 1.4); ctx.lineTo(-R * 0.3, -R * 1.9); ctx.lineTo(R * 0.5, -R * 1.85); ctx.lineTo(R * 0.75, -R * 1.55); ctx.quadraticCurveTo(R * 0.2, -R * 1.4, -R * 0.2, -R * 1.6); ctx.quadraticCurveTo(-R * 0.6, -R * 1.3, -R * 0.9, -R * 1.4); ctx.closePath(); blob(ctx, '#6cc04a', 3);   // moss on top
      ctx.beginPath(); ctx.moveTo(R * 0.3, -R * 0.5); ctx.lineTo(R * 0.5, -R * 0.75); ctx.lineTo(R * 0.4, -R * 0.95); line(ctx, 2.5);                                    // a crack
      eyes(ctx, R * 0.1, -R * 1.1, R * 0.3, R * 0.12, mood); smile(ctx, R * 0.1, -R * 0.7, R * 0.2, mood);
    }
    ctx.restore();
    // "!" just before it bumps, little stars going round when it's dizzy
    const top = f.y - z - R * (type === 'shroom' || type === 'flutter' ? 2.5 : type === 'king' ? 2.3 : 2.1);
    if (wind) draw.text(ctx, '!', f.x, top - 8 - Math.abs(Math.sin(f.t * 12)) * 6, { size: 34, color: '#ffd166' });
    if (dizzy) for (let i = 0; i < 3; i++) { const a = t * 6 + i * TAU / 3; draw.star(ctx, f.x + Math.cos(a) * R * 0.7, top + 6 + Math.sin(a) * 6, 7, '#ffd166', 2); }
  }

  // ---------------------------------------------------------------
  // Things on the ground
  // ---------------------------------------------------------------
  function jar(ctx, x, y, t, wob) {
    shadow(ctx, x, y, 22);
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(wob * 30) * wob * 0.5);
    ctx.beginPath(); ctx.moveTo(-12, -44); ctx.lineTo(12, -44); ctx.quadraticCurveTo(30, -26, 22, -4); ctx.quadraticCurveTo(0, 4, -22, -4); ctx.quadraticCurveTo(-30, -26, -12, -44); ctx.closePath(); blob(ctx, '#e9a66b');
    ctx.beginPath(); ctx.roundRect(-15, -52, 30, 10, 4); blob(ctx, '#c97b3f', 3.5);
    ctx.beginPath(); ctx.moveTo(-20, -24); ctx.quadraticCurveTo(0, -16, 20, -24); line(ctx, 3);
    ctx.beginPath(); ctx.ellipse(-12, -30, 4, 8, 0.4, 0, TAU); paint(ctx, 'rgba(255,255,255,0.45)');
    ctx.restore();
    const k = (t * 1.2 + x * 0.01) % 1;                       // a twinkle: "there's something inside!"
    ctx.globalAlpha = 1 - k; draw.star(ctx, x + 16, y - 56 - k * 14, 6, '#fff', 0); ctx.globalAlpha = 1;
  }
  function potion(ctx, x, y, s = 1, empty = false) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(-5, -22); ctx.lineTo(5, -22); ctx.lineTo(5, -12); ctx.quadraticCurveTo(17, -6, 14, 6); ctx.quadraticCurveTo(0, 14, -14, 6); ctx.quadraticCurveTo(-17, -6, -5, -12); ctx.closePath();
    blob(ctx, empty ? 'rgba(255,255,255,0.35)' : '#4cc9f0', 3.5);
    if (!empty) { draw.circle(ctx, -4, 0, 3.5, 'rgba(255,255,255,0.8)', 0); }
    ctx.beginPath(); ctx.roundRect(-7, -27, 14, 7, 3); blob(ctx, empty ? 'rgba(255,255,255,0.35)' : '#c68b59', 3);
    ctx.restore();
  }
  function heart(ctx, x, y, s, full) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, 12); ctx.bezierCurveTo(-22, -4, -12, -20, 0, -8); ctx.bezierCurveTo(12, -20, 22, -4, 0, 12); ctx.closePath();
    blob(ctx, full ? '#ef476f' : 'rgba(255,255,255,0.35)', 3.5);
    if (full) draw.circle(ctx, -6, -6, 2.6, 'rgba(255,255,255,0.8)', 0);
    ctx.restore();
  }
  // a pickup lying on the ground (bobbing): potion / apple / coin
  function pickup(ctx, p, t) {
    const y = p.y - (p.z || 0) - 16 - Math.sin(t * 4 + p.x) * 4;
    shadow(ctx, p.x, p.y, 14);
    if (p.kind === 'potion') potion(ctx, p.x, y, 1.1);
    else if (p.kind === 'apple') {
      draw.circle(ctx, p.x, y, 14, '#ef476f', 3.5); draw.circle(ctx, p.x - 5, y - 5, 3, 'rgba(255,255,255,0.8)', 0);
      ctx.beginPath(); ctx.moveTo(p.x, y - 12); ctx.lineTo(p.x + 3, y - 21); line(ctx, 3.5);
      ctx.beginPath(); ctx.ellipse(p.x + 10, y - 20, 7, 4, -0.5, 0, TAU); blob(ctx, '#6cc04a', 3);
    } else draw.star(ctx, p.x, y, 13, '#ffd166', 3);
  }
  // the treasure at the end of a stage
  function chest(ctx, x, y, open, t) {
    shadow(ctx, x, y, 44);
    ctx.beginPath(); ctx.roundRect(x - 40, y - 44, 80, 46, 6); blob(ctx, '#b9783f');
    ctx.beginPath(); ctx.rect(x - 40, y - 26, 80, 7); paint(ctx, '#ffd166');
    ctx.save(); ctx.translate(x - 40, y - 44); ctx.rotate(open ? -0.9 : 0);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(0, -30, 40, -30); ctx.quadraticCurveTo(80, -30, 80, 0); ctx.closePath(); blob(ctx, '#d99a5b');
    ctx.restore();
    ctx.beginPath(); ctx.roundRect(x - 8, y - 50, 16, 18, 4); blob(ctx, '#ffd166', 3.5);
    if (open) for (let i = 0; i < 5; i++) { const a = t * 2 + i * 1.3; draw.star(ctx, x + Math.cos(a) * 34, y - 70 - Math.abs(Math.sin(a * 1.7)) * 40, 9, i % 2 ? '#ffd166' : '#fff', 2.5); }
    else { const k = (t * 1.5) % 1; ctx.globalAlpha = 1 - k; draw.star(ctx, x + 30, y - 70 - k * 16, 8, '#fff', 0); ctx.globalAlpha = 1; }
  }

  // ---------------------------------------------------------------
  // Backgrounds. theme: 'meadow' | 'woods' | 'castle'.
  // Each theme is painted once into four hidden pictures:
  //   sky (does not move), far (hills / towers, slides slowly), mid (trees /
  //   big mushrooms / bridge posts) and ground (slides at full speed).
  // far, mid and ground are strips that repeat, so they can scroll forever.
  // ---------------------------------------------------------------
  const THEMES = {
    meadow: { sky: ['#8fd3ff', '#d9f3ff'], far: '#9be38a', mid: '#6cc04a', ground: '#8fe07a', path: '#f2d9a0', edge: '#5fb04c' },
    woods:  { sky: ['#5fc7b5', '#c9f5e1'], far: '#57b889', mid: '#3d9a6b', ground: '#7fd08c', path: '#d9c79a', edge: '#3d9a6b' },
    castle: { sky: ['#ffb4a2', '#ffe5d0'], far: '#c9a7e8', mid: '#a586cf', ground: '#cfd6de', path: '#e6ebf0', edge: '#9aa5b1' },
  };
  const FAR_W = 480, MID_W = 640, GROUND_W = 480, Q = 2;      // strip widths; Q = painted at double size so it stays sharp
  const cache = {};
  function strip(w, h, paintIt) {
    const c = document.createElement('canvas'); c.width = w * Q; c.height = h * Q;
    const ctx = c.getContext('2d'); ctx.scale(Q, Q); paintIt(ctx);
    return c;
  }
  function layers(theme, W, H, top) {
    const key = theme + W + H + top;
    if (cache[key]) return cache[key];
    const T = THEMES[theme], L = {};
    L.sky = strip(W, top, (ctx) => { const g = ctx.createLinearGradient(0, 0, 0, top); g.addColorStop(0, T.sky[0]); g.addColorStop(1, T.sky[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, top); });
    L.far = strip(FAR_W, top, (ctx) => {
      if (theme === 'castle') {
        ctx.fillStyle = T.far; ctx.beginPath(); ctx.rect(60, top - 150, 70, 150); ctx.rect(130, top - 100, 120, 100); ctx.rect(250, top - 180, 60, 180); ctx.fill();
        for (const [tx, ty, w] of [[60, 150, 70], [250, 180, 60]]) { ctx.beginPath(); ctx.moveTo(tx - 8, top - ty); ctx.lineTo(tx + w / 2, top - ty - 50); ctx.lineTo(tx + w + 8, top - ty); ctx.closePath(); ctx.fillStyle = T.mid; ctx.fill(); }
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(84, top - 110, 18, 28); ctx.fillRect(270, top - 130, 18, 28); ctx.fillRect(180, top - 70, 16, 24);
      } else {
        ctx.fillStyle = T.far; ctx.beginPath(); ctx.moveTo(0, top); ctx.quadraticCurveTo(120, top - 150, 250, top); ctx.quadraticCurveTo(370, top - 100, 480, top); ctx.closePath(); ctx.fill();
      }
    });
    L.mid = strip(MID_W, top + 6, (ctx) => {
      for (let i = 0; i < 2; i++) {
        const x = i * 320;
        if (theme === 'meadow') {
          ctx.beginPath(); ctx.roundRect(x + 150, top - 70, 18, 74, 6); blob(ctx, '#a47148');
          draw.circle(ctx, x + 132, top - 84, 34, T.mid, 4); draw.circle(ctx, x + 186, top - 84, 34, T.mid, 4); draw.circle(ctx, x + 159, top - 112, 40, T.mid, 4);
          draw.circle(ctx, x + 159, top - 86, 30, T.mid, 0);
          if (i) { draw.circle(ctx, x + 140, top - 96, 6, '#ef476f', 2.5); draw.circle(ctx, x + 176, top - 110, 6, '#ef476f', 2.5); draw.circle(ctx, x + 166, top - 78, 6, '#ef476f', 2.5); }     // an apple tree
        } else if (theme === 'woods') {
          ctx.beginPath(); ctx.roundRect(x + 140, top - 96, 40, 100, 14); blob(ctx, '#fff3d6');
          ctx.beginPath(); ctx.moveTo(x + 70, top - 90); ctx.quadraticCurveTo(x + 80, top - 190, x + 160, top - 190); ctx.quadraticCurveTo(x + 240, top - 190, x + 250, top - 90); ctx.quadraticCurveTo(x + 160, top - 112, x + 70, top - 90); ctx.closePath(); blob(ctx, i ? '#ff9f43' : '#c77dff');
          draw.circle(ctx, x + 120, top - 140, 12, '#fff', 0); draw.circle(ctx, x + 190, top - 160, 9, '#fff', 0); draw.circle(ctx, x + 210, top - 122, 7, '#fff', 0);
        } else {
          for (const rx of [x, x - MID_W]) { ctx.beginPath(); ctx.moveTo(rx + 170, top - 30); ctx.quadraticCurveTo(rx + 315, top - 10, rx + 460, top - 30); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke(); }   // the rope (it carries on into the next strip)
          ctx.beginPath(); ctx.roundRect(x + 140, top - 60, 30, 64, 4); blob(ctx, T.edge);
          ctx.beginPath(); ctx.roundRect(x + 132, top - 72, 46, 16, 4); blob(ctx, T.path, 3.5);
        }
      }
    });
    L.ground = strip(GROUND_W, H - top, (ctx) => {
      const h = H - top;
      ctx.fillStyle = T.ground; ctx.fillRect(0, 0, GROUND_W, h);
      ctx.fillStyle = T.path; ctx.fillRect(0, 30, GROUND_W, h - 60);
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      for (let i = 0; i < 3; i++) {
        const x = i * 160;
        if (theme === 'castle') { ctx.fillRect(x, 30, 4, h - 60); ctx.fillRect(x + 80, 30 + (i % 2 ? 40 : 90), 80, 4); }
        else { ctx.beginPath(); ctx.ellipse(x + 40, 70 + i * 30, 26, 7, 0, 0, TAU); ctx.ellipse(x + 120, 110 - (i % 2) * 40, 18, 5, 0, 0, TAU); ctx.fill(); }
      }
      ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(GROUND_W, 2); ctx.stroke();
      ctx.strokeStyle = T.edge; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(GROUND_W, 30); ctx.moveTo(0, h - 30); ctx.lineTo(GROUND_W, h - 30); ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const x = i * 160, c = ['#ff8fab', '#fff', '#ffd166'][i];
        if (theme === 'castle') draw.circle(ctx, x + 60, 15, 6, T.edge, 3);
        else { for (let k = 0; k < 5; k++) draw.circle(ctx, x + 60 + Math.cos(k * 1.26) * 6, 15 + Math.sin(k * 1.26) * 6, 4.5, c, 2); draw.circle(ctx, x + 60, 15, 3.5, '#ffd166', 2); }
      }
    });
    return (cache[key] = L);
  }
  // copy a repeating strip across the screen, shifted by "shift"
  function tile(ctx, img, shift, w, y, h, W) {
    const start = -(((shift % w) + w) % w);
    for (let x = start; x < W; x += w) ctx.drawImage(img, Math.round(x), y, w, h);
  }
  function background(ctx, theme, cam, t, W, H, top) {
    const L = layers(theme, W, H, top);
    ctx.drawImage(L.sky, 0, 0, W, top);
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath();         // clouds (one shape, so it's quick)
    for (let i = 0; i < 5; i++) { const x = ((i * 310 - cam * 0.08 + t * 6) % (W + 300) + W + 300) % (W + 300) - 150, y = 50 + (i * 53) % 110; ctx.moveTo(x + 60, y); ctx.ellipse(x, y, 60, 18, 0, 0, TAU); ctx.moveTo(x + 64, y - 14); ctx.ellipse(x + 30, y - 14, 34, 18, 0, 0, TAU); ctx.moveTo(x - 2, y - 8); ctx.ellipse(x - 30, y - 8, 28, 14, 0, 0, TAU); }
    ctx.fill();
    tile(ctx, L.far, cam * 0.2, FAR_W, 0, top, W);
    tile(ctx, L.mid, cam * 0.55, MID_W, 0, top + 6, W);
    tile(ctx, L.ground, cam, GROUND_W, top, H - top, W);
  }

  // ---------------------------------------------------------------
  // The big magic spells, one per hero. k = 0..1 (how far through), level 1..3.
  //   knight: a shower of stars     ranger: a whirlwind of leaves     wizard: rainbow comets
  // ---------------------------------------------------------------
  function spell(ctx, kind, level, k, t, W, H) {
    const n = [0, 8, 16, 26][level], big = [0, 1, 1.35, 1.8][level];
    const col = { knight: '#ffd166', ranger: '#6cc04a', wizard: '#c77dff' }[kind];
    ctx.save();
    ctx.globalAlpha = Math.sin(Math.min(1, k * 1.2) * Math.PI) * 0.55;
    ctx.fillStyle = { knight: '#1d2a6b', ranger: '#0f4d3a', wizard: '#3b1d6b' }[kind]; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    for (let i = 0; i < n; i++) {
      const r1 = ((i * 7919) % 1000) / 1000, r2 = ((i * 104729) % 1000) / 1000, kk = (k * 1.5 + r2) % 1;
      if (kind === 'knight') {          // stars fall from the top
        const x = r1 * W * 1.2 - kk * 160, y = -40 + kk * (H + 80);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 6 * big; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 40, y - 100); ctx.lineTo(x, y); ctx.stroke();
        draw.star(ctx, x, y, (16 + r2 * 12) * big, i % 3 ? col : '#fff', 3);
      } else if (kind === 'ranger') {   // leaves spin round the screen
        const a = kk * TAU * 2 + r1 * TAU, rad = (60 + r2 * 300) * (0.4 + kk);
        const x = W / 2 + Math.cos(a) * rad * 1.5, y = H / 2 + Math.sin(a) * rad * 0.7;
        ctx.save(); ctx.translate(x, y); ctx.rotate(a * 2);
        ctx.beginPath(); ctx.ellipse(0, 0, 20 * big, 9 * big, 0, 0, TAU); blob(ctx, i % 3 ? col : '#b9fbc0', 3);
        ctx.restore();
      } else {                          // comets with rainbow tails fly across
        const y = 40 + r1 * (H - 80), x = -100 + kk * (W + 200), wave = Math.sin(kk * 9 + r2 * 6) * 26;
        ['#ef476f', '#ffd166', '#06d6a0', '#4cc9f0'].forEach((c, j) => { ctx.strokeStyle = c; ctx.lineWidth = 7 * big; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 110 * big, y + wave + (j - 1.5) * 7 * big); ctx.lineTo(x, y + wave + (j - 1.5) * 3 * big); ctx.stroke(); });
        draw.star(ctx, x, y + wave, 18 * big, '#fff', 3);
      }
    }
    ctx.restore();
  }

  // ---- pictures for buttons and menus (SVG text) ----
  const POTION_SVG = `<svg viewBox="0 0 48 48"><path d="M19 6 H29 V17 Q41 23 38 35 Q24 44 10 35 Q7 23 19 17 Z" fill="#4cc9f0" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><circle cx="19" cy="29" r="3.5" fill="#fff"/><path d="M33 8 L35 13 L40 14 L36 17 L37 22 L33 19 L29 22 L30 17 L26 14 L31 13 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="2" stroke-linejoin="round"/></svg>`;
  const BONK_SVG = `<svg viewBox="0 0 48 48"><path d="M24 3 L29 16 L42 10 L35 22 L46 28 L33 30 L34 44 L24 34 L14 44 L15 30 L2 28 L13 22 L6 10 L19 16 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/></svg>`;

  return { hero, swoosh, foe, jar, potion, heart, pickup, chest, background, spell, THEMES, POTION_SVG, BONK_SVG };
})();
