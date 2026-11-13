// =====================================================================
// Potion Quest - every drawing (heroes, baddies, jars, backgrounds, spells).
// The rules of the game are in quest.js; this file only paints.
//
// Everything is drawn with canvas paths in the house style: bright colors,
// thick dark outlines, round shapes, friendly faces. Nothing scary: the
// baddies are grumpy jelly blobs and mushrooms that poof into sparkles.
//
// A character is drawn standing on its feet at (x, y); "face" is 1 (looking
// right) or -1 (left).
// =====================================================================
window.QuestArt = (function () {
  'use strict';
  const { draw } = Arcade;
  const INK = '#2b2b2b';
  const TAU = Math.PI * 2;

  function line(ctx, w = 4) { ctx.lineWidth = w; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
  function blob(ctx, fill, w = 4) { ctx.fillStyle = fill; ctx.fill(); line(ctx, w); }
  function shadow(ctx, x, y, r, k = 1) { ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, y + 2, r * k, r * 0.28 * k, 0, 0, TAU); ctx.fill(); }
  // two shiny eyes; mood: 'happy' | 'grumpy' | 'dizzy' | 'oops'
  function eyes(ctx, x, y, gap, r, mood) {
    for (const s of [-1, 1]) {
      const ex = x + s * gap;
      if (mood === 'dizzy') { ctx.beginPath(); ctx.moveTo(ex - r, y - r); ctx.lineTo(ex + r, y + r); ctx.moveTo(ex + r, y - r); ctx.lineTo(ex - r, y + r); line(ctx, 3); continue; }
      draw.circle(ctx, ex, y, r, INK, 0); draw.circle(ctx, ex + r * 0.3, y - r * 0.35, r * 0.38, '#fff', 0);
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
  // ---------------------------------------------------------------
  const HERO_LOOK = {
    knight: { body: '#4c8dff', trim: '#ffd166', skin: '#ffd6a5', legs: '#3a5a9c' },
    ranger: { body: '#3fae5a', trim: '#8d5524', skin: '#f2c9a0', legs: '#7a5230' },
    wizard: { body: '#9b5de5', trim: '#ffd166', skin: '#ffe0bd', legs: '#6a3fb0' },
  };
  function hero(ctx, kind, x, y, t, o = {}) {
    const L = HERO_LOOK[kind], face = o.face || 1;
    const step = Math.sin((o.walk || 0) * 11), bob = o.cheer ? Math.abs(Math.sin(t * 9)) * 14 : Math.abs(step) * 3;
    shadow(ctx, x, y, 30);
    if (o.hurt && Math.floor(t * 14) % 2) return;                 // blinking after a bump
    ctx.save(); ctx.translate(x, y - bob); ctx.scale(face, 1);
    // legs (the wizard's robe hides them)
    if (kind !== 'wizard') for (const s of [-1, 1]) { ctx.beginPath(); ctx.roundRect(-13 + (s > 0 ? 14 : 0) + s * step * 5, -20 + bob * 0.5, 12, 22, 5); blob(ctx, L.legs, 3.5); }
    // back arm (the knight's carries a round shield)
    if (kind === 'knight') { draw.circle(ctx, -18, -40, 15, '#ef476f', 4); draw.star(ctx, -18, -40, 7, '#ffd166', 0); }
    // body
    ctx.beginPath();
    if (kind === 'wizard') { ctx.moveTo(-17, -62); ctx.lineTo(17, -62); ctx.lineTo(24, -2); ctx.quadraticCurveTo(0, 4, -24, -2); ctx.closePath(); }
    else ctx.roundRect(-18, -64, 36, 46, 12);
    blob(ctx, L.body);
    ctx.fillStyle = L.trim; ctx.fillRect(-16, -34, 32, 6);         // belt
    if (kind === 'ranger') { ctx.beginPath(); ctx.moveTo(-18, -60); ctx.quadraticCurveTo(0, -48, 18, -60); line(ctx, 5); }   // scarf
    // head
    draw.circle(ctx, 0, -84, 24, L.skin, 4);
    const mood = o.hurt ? 'oops' : 'happy';
    eyes(ctx, 6, -86, 8, 4, mood); smile(ctx, 7, -75, 6, mood);
    draw.circle(ctx, -6, -77, 4, 'rgba(255,120,150,0.55)', 0); draw.circle(ctx, 20, -77, 4, 'rgba(255,120,150,0.55)', 0);
    // hat
    if (kind === 'knight') {
      ctx.beginPath(); ctx.arc(0, -90, 25, Math.PI, 0); ctx.lineTo(25, -84); ctx.lineTo(-25, -84); ctx.closePath(); blob(ctx, '#c9d6df');
      ctx.beginPath(); ctx.moveTo(-4, -114); ctx.quadraticCurveTo(-26, -134, -30, -106); ctx.quadraticCurveTo(-16, -112, -4, -108); ctx.closePath(); blob(ctx, '#ef476f', 3.5);
    } else if (kind === 'ranger') {
      ctx.beginPath(); ctx.moveTo(-27, -82); ctx.quadraticCurveTo(-30, -116, 0, -114); ctx.quadraticCurveTo(26, -112, 26, -90); ctx.quadraticCurveTo(0, -104, -14, -86); ctx.closePath(); blob(ctx, '#2f8f46');
      ctx.beginPath(); ctx.moveTo(-22, -108); ctx.lineTo(-40, -122); ctx.lineTo(-28, -98); ctx.closePath(); blob(ctx, '#2f8f46', 3.5);
    } else {
      ctx.beginPath(); ctx.moveTo(-30, -98); ctx.quadraticCurveTo(0, -108, 30, -98); ctx.lineTo(8, -148 + Math.sin(t * 3) * 2); ctx.closePath(); blob(ctx, '#7b3fd1');
      ctx.beginPath(); ctx.ellipse(0, -98, 34, 8, 0, 0, TAU); blob(ctx, '#9b5de5', 3.5);
      draw.star(ctx, 6, -118, 7, '#ffd166', 2);
    }
    // front arm + the thing in the hand. Swinging goes from "up behind" to "down in front".
    let a = -0.5 + Math.sin(t * 2.4) * 0.06;
    if (o.bonk >= 0) a = -2.1 + Math.min(1, o.bonk * 1.8) * 2.7;
    if (o.cheer || o.magic) a = -1.9;
    ctx.save(); ctx.translate(12, -54); ctx.rotate(a);
    if (kind === 'knight') {          // a wooden sword
      ctx.beginPath(); ctx.roundRect(8, -6, 50, 12, 5); blob(ctx, '#dfe7ee', 3.5);
      ctx.beginPath(); ctx.roundRect(4, -13, 8, 26, 3); blob(ctx, '#ffd166', 3.5);
    } else if (kind === 'ranger') {   // a staff with a leaf
      ctx.beginPath(); ctx.roundRect(-14, -4, 78, 8, 4); blob(ctx, '#a47148', 3.5);
      ctx.beginPath(); ctx.ellipse(66, -8, 11, 6, -0.6, 0, TAU); blob(ctx, '#6cc04a', 3);
    } else {                          // a wand with a star
      ctx.beginPath(); ctx.roundRect(4, -3.5, 36, 7, 3); blob(ctx, '#8d5524', 3);
      draw.star(ctx, 46, 0, 12 + Math.sin(t * 8) * 1.5, '#ffd166', 3);
    }
    draw.circle(ctx, 4, 0, 7.5, L.skin, 3.5);    // the hand
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
  // The baddies. f = { type, x, y, z, face, t, state, flash, hp }
  // ---------------------------------------------------------------
  function foe(ctx, f, t) {
    const dizzy = f.state === 'stun' || f.state === 'dizzy', wind = f.state === 'windup';
    const mood = dizzy ? 'dizzy' : 'grumpy';
    const R = f.r;
    shadow(ctx, f.x, f.y, R * 1.05, 1 - Math.min(0.5, (f.z || 0) / 300));
    ctx.save(); ctx.translate(f.x, f.y - (f.z || 0));
    if (f.flash > 0) ctx.filter = 'brightness(1.6)';
    const sq = wind ? 1 + Math.sin(f.t * 30) * 0.06 : 1 + Math.sin(t * 4 + f.x) * 0.04;      // jelly wobble / shaking before a bump
    ctx.scale(f.face * (2 - sq), sq);
    if (f.type === 'blob' || f.type === 'king') {
      const c = f.type === 'king' ? '#c77dff' : '#7bd389';
      ctx.beginPath(); ctx.moveTo(-R, 0); ctx.quadraticCurveTo(-R * 1.1, -R * 1.5, 0, -R * 1.55); ctx.quadraticCurveTo(R * 1.1, -R * 1.5, R, 0); ctx.quadraticCurveTo(0, R * 0.2, -R, 0); ctx.closePath(); blob(ctx, c, f.type === 'king' ? 5 : 4);
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(-R * 0.4, -R * 1.1, R * 0.16, R * 0.26, 0.5, 0, TAU); ctx.fill();
      eyes(ctx, R * 0.15, -R * 0.8, R * 0.3, R * 0.12, mood); smile(ctx, R * 0.15, -R * 0.42, R * 0.2, mood);
      if (f.type === 'king') {         // the crown
        ctx.beginPath(); ctx.moveTo(-R * 0.5, -R * 1.45); ctx.lineTo(-R * 0.55, -R * 2.0); ctx.lineTo(-R * 0.25, -R * 1.72); ctx.lineTo(0, -R * 2.1); ctx.lineTo(R * 0.25, -R * 1.72); ctx.lineTo(R * 0.55, -R * 2.0); ctx.lineTo(R * 0.5, -R * 1.45); ctx.closePath(); blob(ctx, '#ffc93c', 4);
        draw.circle(ctx, 0, -R * 1.62, R * 0.09, '#ef476f', 3);
      }
    } else if (f.type === 'hopper') {
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * R * 0.6, -2, R * 0.42, R * 0.2, 0, 0, TAU); blob(ctx, '#e07a1f', 3.5); }
      draw.circle(ctx, 0, -R, R, '#ff9f43', 4);
      for (const s of [-1, 1]) draw.circle(ctx, s * R * 0.5 + R * 0.1, -R * 1.85, R * 0.3, '#ff9f43', 3.5);     // round ears
      eyes(ctx, R * 0.15, -R * 1.1, R * 0.34, R * 0.14, mood); smile(ctx, R * 0.15, -R * 0.65, R * 0.22, mood);
    } else if (f.type === 'roller') {
      ctx.save(); ctx.translate(0, -R); ctx.rotate(f.spin || 0);
      for (let i = 0; i < 8; i++) { const a = i * TAU / 8; draw.circle(ctx, Math.cos(a) * R * 0.92, Math.sin(a) * R * 0.92, R * 0.3, '#5b6ee1', 3.5); }    // soft round bumps, not spikes
      draw.circle(ctx, 0, 0, R * 0.92, '#7f8cff', 4);
      ctx.restore();
      eyes(ctx, R * 0.12, -R * 1.1, R * 0.3, R * 0.13, mood); smile(ctx, R * 0.12, -R * 0.7, R * 0.2, mood);
    } else if (f.type === 'shroom') {
      ctx.beginPath(); ctx.roundRect(-R * 0.55, -R * 1.1, R * 1.1, R * 1.1, R * 0.4); blob(ctx, '#fff3d6');
      eyes(ctx, R * 0.1, -R * 0.62, R * 0.26, R * 0.12, mood); smile(ctx, R * 0.1, -R * 0.3, R * 0.16, mood);
      ctx.beginPath(); ctx.moveTo(-R * 1.15, -R * 1.0); ctx.quadraticCurveTo(-R * 1.1, -R * 2.3, 0, -R * 2.3); ctx.quadraticCurveTo(R * 1.1, -R * 2.3, R * 1.15, -R * 1.0); ctx.quadraticCurveTo(0, -R * 1.25, -R * 1.15, -R * 1.0); ctx.closePath(); blob(ctx, '#ef476f');
      draw.circle(ctx, -R * 0.5, -R * 1.7, R * 0.2, '#fff', 0); draw.circle(ctx, R * 0.35, -R * 1.9, R * 0.16, '#fff', 0); draw.circle(ctx, R * 0.6, -R * 1.45, R * 0.13, '#fff', 0);
    }
    ctx.restore();
    // "!" just before it bumps, little stars going round when it's dizzy
    const top = f.y - (f.z || 0) - R * (f.type === 'shroom' ? 2.5 : f.type === 'king' ? 2.3 : 2.1);
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
    ctx.save(); ctx.translate(x - 40, y - 44); ctx.rotate(open ? -0.9 : 0);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(0, -30, 40, -30); ctx.quadraticCurveTo(80, -30, 80, 0); ctx.closePath(); blob(ctx, '#d99a5b');
    ctx.restore();
    ctx.beginPath(); ctx.roundRect(x - 8, y - 50, 16, 18, 4); blob(ctx, '#ffd166', 3.5);
    if (open) for (let i = 0; i < 5; i++) { const a = t * 2 + i * 1.3; draw.star(ctx, x + Math.cos(a) * 34, y - 70 - Math.abs(Math.sin(a * 1.7)) * 40, 9, i % 2 ? '#ffd166' : '#fff', 2.5); }
    else { const k = (t * 1.5) % 1; ctx.globalAlpha = 1 - k; draw.star(ctx, x + 30, y - 70 - k * 16, 8, '#fff', 0); ctx.globalAlpha = 1; }
  }

  // ---------------------------------------------------------------
  // Backgrounds: sky, far things (they slide slowly), near things, the ground.
  // theme: 'meadow' | 'woods' | 'castle'.  cam = how far the stage has scrolled.
  // ---------------------------------------------------------------
  const THEMES = {
    meadow: { sky: ['#8fd3ff', '#d9f3ff'], far: '#9be38a', mid: '#6cc04a', ground: '#8fe07a', path: '#f2d9a0', edge: '#5fb04c' },
    woods:  { sky: ['#5fc7b5', '#c9f5e1'], far: '#57b889', mid: '#3d9a6b', ground: '#7fd08c', path: '#d9c79a', edge: '#3d9a6b' },
    castle: { sky: ['#ffb4a2', '#ffe5d0'], far: '#c9a7e8', mid: '#a586cf', ground: '#cfd6de', path: '#e6ebf0', edge: '#9aa5b1' },
  };
  function background(ctx, theme, cam, t, W, H, top) {
    const T = THEMES[theme];
    const sky = ctx.createLinearGradient(0, 0, 0, top); sky.addColorStop(0, T.sky[0]); sky.addColorStop(1, T.sky[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, top);
    // clouds
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 6; i++) { const x = ((i * 310 - cam * 0.08 + t * 6) % (W + 300) + W + 300) % (W + 300) - 150, y = 50 + (i * 53) % 110; ctx.beginPath(); ctx.ellipse(x, y, 60, 18, 0, 0, TAU); ctx.ellipse(x + 30, y - 14, 34, 18, 0, 0, TAU); ctx.ellipse(x - 30, y - 8, 28, 14, 0, 0, TAU); ctx.fill(); }
    // far hills (or castle towers)
    const fx = -(cam * 0.2) % 480;
    for (let x = fx - 480; x < W + 480; x += 480) {
      if (theme === 'castle') {
        ctx.fillStyle = T.far; ctx.strokeStyle = INK;
        ctx.beginPath(); ctx.rect(x + 60, top - 150, 70, 150); ctx.rect(x + 130, top - 100, 120, 100); ctx.rect(x + 250, top - 180, 60, 180); ctx.fill();
        for (const [tx, ty, w] of [[60, 150, 70], [250, 180, 60]]) { ctx.beginPath(); ctx.moveTo(x + tx - 8, top - ty); ctx.lineTo(x + tx + w / 2, top - ty - 50); ctx.lineTo(x + tx + w + 8, top - ty); ctx.closePath(); ctx.fillStyle = T.mid; ctx.fill(); }
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x + 84, top - 110, 18, 28); ctx.fillRect(x + 270, top - 130, 18, 28);
      } else {
        ctx.fillStyle = T.far; ctx.beginPath(); ctx.moveTo(x, top); ctx.quadraticCurveTo(x + 120, top - 150, x + 250, top); ctx.quadraticCurveTo(x + 370, top - 100, x + 480, top); ctx.closePath(); ctx.fill();
      }
    }
    // nearer: trees / big mushrooms / bridge posts
    const mx = -(cam * 0.55) % 320;
    for (let x = mx - 320, i = 0; x < W + 320; x += 320, i++) {
      if (theme === 'meadow') {
        ctx.beginPath(); ctx.roundRect(x + 150, top - 70, 18, 74, 6); blob(ctx, '#a47148');
        draw.circle(ctx, x + 132, top - 84, 34, T.mid, 4); draw.circle(ctx, x + 186, top - 84, 34, T.mid, 4); draw.circle(ctx, x + 159, top - 112, 40, T.mid, 4);
        draw.circle(ctx, x + 159, top - 86, 30, T.mid, 0);
      } else if (theme === 'woods') {
        ctx.beginPath(); ctx.roundRect(x + 140, top - 96, 40, 100, 14); blob(ctx, '#fff3d6');
        ctx.beginPath(); ctx.moveTo(x + 70, top - 90); ctx.quadraticCurveTo(x + 80, top - 190, x + 160, top - 190); ctx.quadraticCurveTo(x + 240, top - 190, x + 250, top - 90); ctx.quadraticCurveTo(x + 160, top - 112, x + 70, top - 90); ctx.closePath(); blob(ctx, i % 2 ? '#ff9f43' : '#c77dff');
        draw.circle(ctx, x + 120, top - 140, 12, '#fff', 0); draw.circle(ctx, x + 190, top - 160, 9, '#fff', 0); draw.circle(ctx, x + 210, top - 122, 7, '#fff', 0);
      } else {
        ctx.beginPath(); ctx.roundRect(x + 140, top - 60, 30, 64, 4); blob(ctx, T.edge);
        ctx.beginPath(); ctx.roundRect(x + 132, top - 72, 46, 16, 4); blob(ctx, T.path, 3.5);
        ctx.beginPath(); ctx.moveTo(x + 170, top - 30); ctx.quadraticCurveTo(x + 300, top - 10, x + 460, top - 30); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke();
      }
    }
    // the ground: grass (or stone) with a path the heroes walk along
    ctx.fillStyle = T.ground; ctx.fillRect(0, top, W, H - top);
    ctx.fillStyle = T.path; ctx.fillRect(0, top + 30, W, H - top - 60);
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    const gx = -(cam % 160);
    for (let x = gx - 160, i = Math.floor(cam / 160); x < W + 160; x += 160, i++) {
      if (theme === 'castle') { ctx.fillRect(x, top + 30, 4, H - top - 60); ctx.fillRect(x + 80, top + 30 + ((i % 2) ? 40 : 90), 80, 4); }
      else { ctx.beginPath(); ctx.ellipse(x + 40, top + 70 + (i % 3) * 30, 26, 7, 0, 0, TAU); ctx.ellipse(x + 120, top + 110 - (i % 2) * 40, 18, 5, 0, 0, TAU); ctx.fill(); }
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, top); ctx.lineTo(W, top); ctx.stroke();
    ctx.strokeStyle = T.edge; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, top + 30); ctx.lineTo(W, top + 30); ctx.moveTo(0, H - 30); ctx.lineTo(W, H - 30); ctx.stroke();
    // little flowers (or pebbles) in front, sliding at full speed
    for (let x = gx - 160, i = Math.floor(cam / 160); x < W + 160; x += 160, i++) {
      const c = ['#ff8fab', '#fff', '#ffd166', '#c77dff'][((i % 4) + 4) % 4];
      if (theme === 'castle') draw.circle(ctx, x + 60, top + 14, 6, T.edge, 3);
      else { for (let k = 0; k < 5; k++) draw.circle(ctx, x + 60 + Math.cos(k * 1.26) * 6, top + 14 + Math.sin(k * 1.26) * 6, 4.5, c, 2); draw.circle(ctx, x + 60, top + 14, 3.5, '#ffd166', 2); }
    }
  }

  // ---------------------------------------------------------------
  // The big magic spells, one per hero. k = 0..1 (how far through), level 1..3.
  //   knight: a shower of stars     ranger: a whirlwind of leaves     wizard: rainbow comets
  // ---------------------------------------------------------------
  function spell(ctx, kind, level, k, t, W, H) {
    const n = [0, 10, 22, 40][level], big = [0, 1, 1.35, 1.8][level];
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
