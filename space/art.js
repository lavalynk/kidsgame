// =====================================================================
// Space Defender — ART. Everything here only DRAWS (no game rules):
//   * small enemies (8 kinds) and the friendly gift ship
//   * mini bosses (a big enemy wearing a hat, crown, shades...)
//   * the 10 big bosses
//   * CHIMERA, the Eater of Worlds (the final mega boss)
//   * little pictures (icons) for the 20 special weapons
// space.js calls these with the thing to draw; SpaceArt.tick(clock) keeps
// the animations moving. Everything faces LEFT (toward the player).
// =====================================================================
window.SpaceArt = (function () {
  const D = Arcade.draw, INK = D.INK;
  let clock = 0;
  function tick(t) { clock = t; }

  // ---------- little helpers ----------
  function heart(ctx, x, y, s, color, line = 2.5) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.4, y, x - s * 0.9, y - s * 1.0, x, y - s * 0.35);
    ctx.bezierCurveTo(x + s * 0.9, y - s * 1.0, x + s * 1.4, y, x, y + s * 0.9);
    ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    if (line) { ctx.lineWidth = line; ctx.strokeStyle = INK; ctx.stroke(); }
  }
  // Big shiny cartoon eye. look = direction the pupil points.
  function eye(ctx, x, y, r, lookX = -0.3, lookY = 0, blink = false) {
    if (blink) {
      ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(x, y, r * 0.7, 0.2, Math.PI - 0.2); ctx.stroke();
      return;
    }
    D.circle(ctx, x, y, r, '#fff', 3);
    D.circle(ctx, x + lookX * r * 0.4, y + lookY * r * 0.4, r * 0.55, INK, 0);
    D.circle(ctx, x + lookX * r * 0.4 - r * 0.2, y + lookY * r * 0.4 - r * 0.22, r * 0.2, '#fff', 0);
  }
  function smile(ctx, x, y, w) {
    ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y - w * 0.4, w, 0.35 * Math.PI, 0.65 * Math.PI); ctx.stroke();
  }
  function cheeks(ctx, x1, x2, y, r) {
    ctx.fillStyle = 'rgba(255,120,160,0.55)';
    ctx.beginPath(); ctx.ellipse(x1, y, r, r * 0.6, 0, 0, Math.PI * 2); ctx.ellipse(x2, y, r, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
  }
  function path(ctx, pts, close = true) {
    ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); if (close) ctx.closePath();
  }
  function fillStroke(ctx, fill, line = 4) { ctx.fillStyle = fill; ctx.fill(); if (line) { ctx.lineWidth = line; ctx.strokeStyle = INK; ctx.stroke(); } }

  // =================================================================
  // SMALL ENEMIES (all about 46 px across)
  // =================================================================
  function drawEnemy(ctx, e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    enemyBody(ctx, e, e.flash > 0);
    ctx.restore();
  }
  // (drawn around 0,0 so mini bosses can reuse it, scaled up)
  function enemyBody(ctx, e, flash) {
    const body = flash ? '#ffffff' : e.color;
    const t = e.t || 0;
    switch (e.type) {
      case 'bobber': {
        // round robot with a springy antenna and little propeller ears
        const wob = Math.sin(t * 8) * 3;
        ctx.lineWidth = 3; ctx.strokeStyle = INK;
        ctx.beginPath(); ctx.moveTo(0, -20); ctx.quadraticCurveTo(wob, -30, 0, -36); ctx.stroke();
        D.circle(ctx, 0, -38, 6, '#ffd166', 3);
        D.circle(ctx, 0, 0, 23, body, 4);
        D.box(ctx, -15, -11, 30, 20, 8, '#e9f5ff', 3);
        eye(ctx, -6, -1, 5.5, -0.5); eye(ctx, 7, -1, 5.5, -0.5);
        smile(ctx, 0, 14, 5);
        D.circle(ctx, -24, 2, 6, '#ff8c42', 3); D.circle(ctx, 24, 2, 6, '#ff8c42', 3);
        break;
      }
      case 'squad': {
        // boxy one-eyed robot with waving arms
        const arm = Math.sin(t * 6 + (e.dy || 0)) * 0.5;
        ctx.lineWidth = 4; ctx.strokeStyle = INK;
        ctx.beginPath(); ctx.moveTo(-20, 4); ctx.lineTo(-30, -6 + arm * 10); ctx.moveTo(20, 4); ctx.lineTo(30, -6 - arm * 10); ctx.stroke();
        D.box(ctx, -21, -20, 42, 40, 12, body, 4);
        eye(ctx, 0, -3, 10, -0.5);
        ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-7, 12); ctx.quadraticCurveTo(0, 17, 7, 12); ctx.stroke();
        D.circle(ctx, 0, -24, 4, '#ef476f', 3);
        break;
      }
      case 'diver': {
        // goofy alien in a little saucer, waving its eye stalks
        const s = Math.sin(t * 7) * 3;
        ctx.lineWidth = 3; ctx.strokeStyle = INK;
        ctx.beginPath(); ctx.moveTo(-6, -14); ctx.lineTo(-10 + s, -30); ctx.moveTo(6, -14); ctx.lineTo(10 - s, -30); ctx.stroke();
        eye(ctx, -10 + s, -32, 6, -0.4); eye(ctx, 10 - s, -32, 6, -0.4);
        D.circle(ctx, 0, -6, 13, flash ? '#fff' : '#b5e48c', 3);
        smile(ctx, 0, -3, 5);
        ctx.beginPath(); ctx.ellipse(0, 6, 28, 10, 0, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
        for (const lx of [-15, 0, 15]) D.circle(ctx, lx, 7, 3, '#ffd166', 2);
        break;
      }
      case 'rock': {
        // a lumpy sleepy space rock
        const r = e.r || 34;
        ctx.save(); ctx.rotate(Math.sin(e.rot || 0) * 0.3);
        ctx.beginPath();
        (e.bumps || [1, 0.9, 1, 1.05, 0.92, 1, 0.95, 1.05, 0.9]).forEach((k, i, a) => { const an = i / a.length * Math.PI * 2; ctx.lineTo(Math.cos(an) * r * k, Math.sin(an) * r * k); });
        ctx.closePath();
        ctx.fillStyle = flash ? '#fff' : (e.color || '#b08968'); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
        D.circle(ctx, 12, -12, 6, 'rgba(0,0,0,0.15)', 0); D.circle(ctx, -14, 12, 5, 'rgba(0,0,0,0.15)', 0);
        eye(ctx, -9, -2, 5, 0, 0, true); eye(ctx, 9, -2, 5, 0, 0, true);
        cheeks(ctx, -15, 15, 8, 5);
        ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 8, 4, 0, Math.PI); ctx.stroke();
        ctx.restore();
        // little health pips so kids see it's getting weaker
        if (e.max && e.hp < e.max && e.max <= 10) for (let i = 0; i < e.max; i++) D.circle(ctx, (i - (e.max - 1) / 2) * 10, -r - 10, 4, i < e.hp ? '#06d6a0' : '#fff', 2);
        break;
      }
      case 'shooter': {
        // jelly alien that puffs up its cheeks, then blows a bubble
        const puffAmt = e.puff || 0, puff = 1 + puffAmt * 0.25;
        ctx.lineWidth = 4; ctx.strokeStyle = INK;
        for (let i = 0; i < 4; i++) {
          const tx = -15 + i * 10, sw = Math.sin(t * 5 + i) * 4;
          ctx.beginPath(); ctx.moveTo(tx, 10); ctx.quadraticCurveTo(tx + sw, 22, tx - sw, 32); ctx.stroke();
        }
        ctx.save(); ctx.scale(puff, puff);
        ctx.beginPath(); ctx.arc(0, 2, 24, Math.PI, 0); ctx.lineTo(24, 12); ctx.quadraticCurveTo(0, 18, -24, 12); ctx.closePath();
        ctx.fillStyle = puffAmt > 0 && Math.floor(clock * 14) % 2 ? '#fff' : body; ctx.fill(); ctx.stroke();
        eye(ctx, -9, -4, 6, -0.6); eye(ctx, 7, -4, 6, -0.6);
        cheeks(ctx, -16, 12, 6, 4 + puffAmt * 3);
        ctx.restore();
        D.circle(ctx, -26, 4, 4 + puffAmt * 4, '#bde0fe', 2.5);
        break;
      }
      case 'zigzag': {
        // a buzzy little bee-bot that zig-zags
        const buzz = Math.sin(t * 40) * 0.5;
        ctx.save(); ctx.globalAlpha = 0.75;
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(4, -14 * s, 10, 16 + buzz * 4, 0.4 * s, 0, Math.PI * 2); fillStroke(ctx, '#e0fbfc', 3); }
        ctx.restore();
        ctx.beginPath(); ctx.ellipse(0, 0, 24, 17, 0, 0, Math.PI * 2); fillStroke(ctx, body, 4);
        ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 22, 15, 0, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = INK; for (const sx of [2, 14]) ctx.fillRect(sx, -18, 6, 36);
        ctx.restore();
        ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(32, -4); ctx.lineTo(32, 4); ctx.closePath(); fillStroke(ctx, '#ffd166', 2.5);
        eye(ctx, -12, -3, 6, -0.6); smile(ctx, -12, 9, 4);
        break;
      }
      case 'splitter': {
        // a wobbly double jelly: pop it and two little ones come out
        const sq = Math.sin(t * 4) * 0.06;
        ctx.save(); ctx.scale(1 + sq, 1 - sq);
        ctx.beginPath(); ctx.ellipse(-12, 0, 20, 24, 0, 0, Math.PI * 2); fillStroke(ctx, body, 4);
        ctx.beginPath(); ctx.ellipse(12, 0, 20, 24, 0, 0, Math.PI * 2); fillStroke(ctx, body, 4);
        ctx.beginPath(); ctx.ellipse(0, 2, 26, 20, 0, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill();
        ctx.restore();
        ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, 22); ctx.stroke(); ctx.setLineDash([]);
        eye(ctx, -14, -4, 6, -0.5); eye(ctx, 10, -4, 6, -0.5);
        smile(ctx, -14, 10, 4); smile(ctx, 10, 10, 4);
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(-22, -14, 4, 7, 0.5, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'orbiter': {
        // a planet-alien with a little moon circling it
        const a = t * 3;
        const mx = Math.cos(a) * 34, my = Math.sin(a) * 12;
        if (my < 0) D.circle(ctx, mx, my, 7, '#ffd166', 3);
        D.circle(ctx, 0, 0, 22, body, 4);
        ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.ellipse(0, 2, 32, 8, -0.2, 0, Math.PI); ctx.stroke();
        ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
        eye(ctx, -8, -6, 6, -0.5); eye(ctx, 7, -6, 6, -0.5);
        smile(ctx, 0, 8, 5);
        if (my >= 0) D.circle(ctx, mx, my, 7, '#ffd166', 3);
        break;
      }
      case 'gift': {
        // the friendly delivery saucer: it carries a present. Bubble it to get the present!
        const bob = Math.sin(t * 4) * 3;
        ctx.translate(0, bob);
        ctx.lineWidth = 3; ctx.strokeStyle = INK;
        ctx.beginPath(); ctx.moveTo(-10, 6); ctx.lineTo(-6, 22); ctx.moveTo(10, 6); ctx.lineTo(6, 22); ctx.stroke();
        D.box(ctx, -13, 20, 26, 22, 4, '#ef476f', 3);
        ctx.fillStyle = '#ffd166'; ctx.fillRect(-3, 20, 6, 22); ctx.fillRect(-13, 28, 26, 6);
        ctx.lineWidth = 3; ctx.strokeRect(-13, 20, 26, 22);
        ctx.beginPath(); ctx.ellipse(-6, 16, 6, 4, -0.5, 0, Math.PI * 2); ctx.ellipse(6, 16, 6, 4, 0.5, 0, Math.PI * 2); fillStroke(ctx, '#ffd166', 2.5);
        ctx.beginPath(); ctx.arc(0, -6, 15, Math.PI, 0); ctx.closePath(); fillStroke(ctx, '#bde0fe', 3);
        D.circle(ctx, 0, -9, 7, '#ffd6a5', 2); D.circle(ctx, -2.5, -10, 1.6, INK, 0); D.circle(ctx, 2.5, -10, 1.6, INK, 0);
        ctx.beginPath(); ctx.ellipse(0, 0, 32, 10, 0, 0, Math.PI * 2); fillStroke(ctx, flash ? '#fff' : '#06d6a0', 4);
        for (const lx of [-18, -6, 6, 18]) D.circle(ctx, lx, 1, 3, (Math.floor(clock * 6) + lx) % 2 ? '#ffd166' : '#fff', 2);
        break;
      }
    }
  }

  // =================================================================
  // MINI BOSSES: a giant version of an enemy wearing something fancy
  // =================================================================
  function drawMini(ctx, b, flash) {
    const m = b.def;
    ctx.save();
    const fake = { type: m.base, color: m.color, t: b.t, puff: b.mode === 'tele' ? Math.min(1, b.modeT) : 0, dy: 0, r: 34, rot: b.t * 0.6 };
    ctx.scale(m.scale, m.scale);
    enemyBody(ctx, fake, flash);
    // the accessory sits on top of the head
    const top = { bobber: -22, squad: -26, diver: -40, rock: -32, shooter: -22, zigzag: -18, splitter: -26, orbiter: -24 }[m.base] || -26;
    ctx.translate(0, top);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    switch (m.acc) {
      case 'crown':
        path(ctx, [[-14, 2], [-16, -12], [-8, -5], [0, -16], [8, -5], [16, -12], [14, 2]]); fillStroke(ctx, '#ffc93c', 2.5);
        D.circle(ctx, 0, -3, 2.5, '#ef476f', 1.5); break;
      case 'captain':
        ctx.beginPath(); ctx.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2); fillStroke(ctx, INK, 0);
        D.box(ctx, -12, -12, 24, 12, 5, '#fff', 2.5); ctx.fillStyle = '#118ab2'; ctx.fillRect(-12, -4, 24, 4);
        D.star(ctx, 0, -8, 3.5, '#ffd166', 1.2); break;
      case 'shades':
        ctx.translate(0, 16 - top - 16);
        break;
      case 'beanie':
        ctx.beginPath(); ctx.arc(0, 4, 17, Math.PI, 0); ctx.closePath(); fillStroke(ctx, '#ef476f', 2.5);
        ctx.fillStyle = '#fff'; ctx.fillRect(-17, 0, 34, 5); ctx.lineWidth = 2.5; ctx.strokeRect(-17, 0, 34, 5);
        D.circle(ctx, 0, -14, 5, '#fff', 2); break;
      case 'tiara':
        path(ctx, [[-12, 2], [-8, -6], [-4, -1], [0, -10], [4, -1], [8, -6], [12, 2]]); fillStroke(ctx, '#ffd6ff', 2);
        D.circle(ctx, 0, -9, 2.5, '#4cc9f0', 1.5); break;
      case 'mohawk':
        for (let i = 0; i < 5; i++) { path(ctx, [[-10 + i * 5, 2], [-8 + i * 5, -12 - (i % 2) * 4 + Math.sin(clock * 10 + i) * 2], [-5 + i * 5, 2]]); fillStroke(ctx, i % 2 ? '#ff8c42' : '#ef476f', 1.5); }
        break;
      case 'bow':
        ctx.beginPath(); ctx.ellipse(-8, -2, 8, 5, -0.4, 0, Math.PI * 2); ctx.ellipse(8, -2, 8, 5, 0.4, 0, Math.PI * 2); fillStroke(ctx, '#f15bb5', 2);
        D.circle(ctx, 0, -2, 3, '#ffd166', 1.5); break;
      case 'tophat':
        ctx.beginPath(); ctx.ellipse(0, 1, 15, 4, 0, 0, Math.PI * 2); fillStroke(ctx, INK, 0);
        D.box(ctx, -9, -18, 18, 19, 3, INK, 0); ctx.fillStyle = '#ef476f'; ctx.fillRect(-9, -6, 18, 4); break;
      case 'helmet':
        ctx.beginPath(); ctx.arc(0, 4, 18, Math.PI, 0); ctx.closePath(); fillStroke(ctx, '#8d99ae', 2.5);
        ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, -24); ctx.stroke();
        D.circle(ctx, 0, -26, 3.5, Math.floor(clock * 4) % 2 ? '#ef476f' : '#ffd166', 1.5); break;
      case 'horns':
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(8 * s, 4); ctx.quadraticCurveTo(20 * s, -2, 18 * s, -16); ctx.quadraticCurveTo(12 * s, -6, 2 * s, 2); ctx.closePath(); fillStroke(ctx, '#f1e3d3', 2); }
        break;
    }
    ctx.restore();
    if (m.acc === 'shades') {     // cool sunglasses over the eyes
      ctx.save(); ctx.scale(m.scale, m.scale);
      const ey = m.base === 'diver' ? -32 : -2;
      ctx.translate(0, ey);
      D.box(ctx, -18, -5, 15, 10, 4, INK, 0); D.box(ctx, 3, -5, 15, 10, 4, INK, 0);
      ctx.fillRect(-4, -2, 8, 2.5);
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(-15, -3, 4, 2); ctx.fillRect(6, -3, 4, 2);
      ctx.restore();
    }
  }

  // =================================================================
  // BIG BOSSES (drawn around 0,0, about 170-230 px tall)
  // =================================================================
  const BIG = {
    // ---- 1. Bolto the Balloon Bot ----
    balloon(ctx, b, flash, swell) {
      const sx = 1 + Math.sin(b.wob * 3) * 0.04, sy = 1 - Math.sin(b.wob * 3) * 0.04;
      ctx.lineWidth = 3; ctx.strokeStyle = INK;
      ctx.beginPath(); ctx.moveTo(0, 82); ctx.quadraticCurveTo(14, 100, 0, 118); ctx.stroke();
      D.box(ctx, -20, 116, 40, 22, 6, '#ffd166', 4);
      ctx.save(); ctx.scale(sx * swell, sy * swell);
      ctx.beginPath(); ctx.ellipse(0, 0, 80, 84, 0, 0, Math.PI * 2);
      ctx.fillStyle = flash ? '#fff' : '#ff8fab'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-8, 82); ctx.lineTo(8, 82); ctx.lineTo(0, 92); ctx.closePath(); ctx.fillStyle = '#ff8fab'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(-40, -44, 14, 22, 0.6, 0, Math.PI * 2); ctx.fill();
      D.box(ctx, -52, -30, 104, 70, 20, '#2e2a72', 5);
      const blink = Math.floor(b.t * 1.3) % 5 === 0 && (b.t * 1.3) % 1 < 0.15;
      eye(ctx, -22, -4, 14, -0.5, 0.1, blink); eye(ctx, 22, -4, 14, -0.5, 0.1, blink);
      ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 4;
      ctx.beginPath(); for (let i = 0; i <= 8; i++) ctx.lineTo(-20 + i * 5, 24 + Math.sin(b.t * 8 + i) * 3); ctx.stroke();
      cheeks(ctx, -38, 38, 18, 7);
      ctx.strokeStyle = INK; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-30, -76); ctx.lineTo(-40, -100); ctx.moveTo(30, -76); ctx.lineTo(40, -100); ctx.stroke();
      D.circle(ctx, -40, -102, 8, '#ffd166', 4); D.circle(ctx, 40, -102, 8, '#ffd166', 4);
      ctx.restore();
    },
    // ---- 2. Captain Cookie Jar ----
    cookie(ctx, b, flash, swell) {
      ctx.save(); ctx.scale(swell, swell);
      D.box(ctx, -48, -96, 96, 90, 26, 'rgba(189,224,254,0.85)', 5);
      D.box(ctx, -54, -110, 108, 22, 10, flash ? '#fff' : '#ef476f', 5);
      for (const [cx, cy] of [[-26, -30], [24, -26], [0, -22]]) {
        D.circle(ctx, cx, cy, 14, '#d4a373', 3);
        for (const [dx, dy] of [[-4, -3], [5, 2], [-1, 6]]) D.circle(ctx, cx + dx, cy + dy, 2.5, '#6f4518', 0);
      }
      D.circle(ctx, 0, -62, 22, flash ? '#fff' : '#b5e48c', 4);
      eye(ctx, -9, -66, 8, -0.5); eye(ctx, 10, -66, 8, -0.5);
      ctx.beginPath(); ctx.arc(0, -54, 7, 0, Math.PI); ctx.closePath(); ctx.fillStyle = INK; ctx.fill();
      ctx.beginPath(); ctx.ellipse(-2, -48, 4, 5, 0, 0, Math.PI * 2); ctx.fillStyle = '#ff8fab'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 6, 104, 30, 0, 0, Math.PI * 2);
      ctx.fillStyle = flash ? '#fff' : '#06d6a0'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 22, 60, 14, 0, 0, Math.PI); ctx.fillStyle = '#118ab2'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
      for (let i = 0; i < 7; i++) { const on = (Math.floor(clock * 6) + i) % 3 === 0; D.circle(ctx, -78 + i * 26, 8, 7, on ? '#ffd166' : '#f15bb5', 3); }
      ctx.restore();
    },
    // ---- 3. Hula-Hoop Robo ----
    hula(ctx, b, flash, swell) {
      ctx.save(); ctx.scale(swell, swell);
      const spin = b.t * 3;
      ctx.lineWidth = 14; ctx.strokeStyle = INK;
      ctx.beginPath(); ctx.ellipse(0, 10, 112, 26, Math.sin(spin) * 0.15, Math.PI, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 8; ctx.strokeStyle = '#ff8c42'; ctx.stroke();
      D.circle(ctx, 0, 0, 74, flash ? '#fff' : '#8ecae6', 5);
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(-34, -38, 12, 20, 0.6, 0, Math.PI * 2); ctx.fill();
      D.box(ctx, -50, -36, 100, 54, 24, '#0b2545', 5);
      eye(ctx, -20, -10, 13, -0.5); eye(ctx, 20, -10, 13, -0.5);
      cheeks(ctx, -44, 44, 30, 8);
      smile(ctx, 0, 42, 13);
      ctx.lineWidth = 4; ctx.strokeStyle = INK;
      ctx.beginPath(); ctx.moveTo(0, -74); ctx.lineTo(0, -96); ctx.stroke();
      D.star(ctx, 0, -100, 13, '#ffd166', 4);
      ctx.lineWidth = 14; ctx.strokeStyle = INK;
      ctx.beginPath(); ctx.ellipse(0, 10, 112, 26, Math.sin(spin) * 0.15, 0, Math.PI); ctx.stroke();
      ctx.lineWidth = 8; ctx.strokeStyle = '#ff8c42'; ctx.stroke();
      ctx.restore();
    },
    // ---- 4. Frosty the Snow Satellite: a snowball robot with solar-panel wings ----
    frosty(ctx, b, flash, swell) {
      ctx.save(); ctx.scale(swell, swell);
      const flap = Math.sin(b.t * 2) * 0.08;
      for (const s of [-1, 1]) {           // solar panels
        ctx.save(); ctx.rotate(flap * s);
        ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 60 * s); ctx.lineTo(0, 96 * s); ctx.stroke();
        D.box(ctx, -58, s > 0 ? 92 : -128, 116, 36, 6, '#118ab2', 4);
        ctx.strokeStyle = '#8ecae6'; ctx.lineWidth = 2;
        for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-58 + i * 29, s > 0 ? 92 : -128); ctx.lineTo(-58 + i * 29, s > 0 ? 128 : -92); ctx.stroke(); }
        ctx.restore();
      }
      D.circle(ctx, 0, 0, 78, flash ? '#fff' : '#f8fbff', 5);
      ctx.fillStyle = 'rgba(142,202,230,0.35)'; ctx.beginPath(); ctx.arc(14, 14, 64, -0.4, 1.9); ctx.fill();
      // knit hat
      ctx.beginPath(); ctx.moveTo(-58, -46); ctx.quadraticCurveTo(0, -128, 58, -46); ctx.closePath(); fillStroke(ctx, '#ef476f', 5);
      D.box(ctx, -64, -54, 128, 20, 9, '#fff', 4);
      D.circle(ctx, 4, -104, 12, '#fff', 4);
      // face
      eye(ctx, -26, -10, 13, -0.6); eye(ctx, 18, -10, 13, -0.6);
      path(ctx, [[-6, 6], [-42, 14], [-6, 18]]); fillStroke(ctx, '#ff8c42', 3);       // carrot nose
      cheeks(ctx, -44, 38, 18, 8);
      ctx.lineWidth = 3; ctx.strokeStyle = INK;
      for (let i = 0; i < 5; i++) D.circle(ctx, -20 + i * 10, 38 + Math.sin(i * 0.8) * 4, 3, INK, 0);   // coal smile
      // scarf
      D.box(ctx, -60, 54, 120, 16, 7, '#06d6a0', 4);
      D.box(ctx, 30, 58, 16, 40, 5, '#06d6a0', 4);
      ctx.restore();
    },
    // ---- 5. Professor Octo: an octopus in a glass dome with glasses ----
    octo(ctx, b, flash, swell) {
      ctx.save(); ctx.scale(swell, swell);
      const col = flash ? '#fff' : '#c77dff';
      for (let i = 0; i < 6; i++) {        // tentacles
        const x0 = -60 + i * 24, sw = Math.sin(b.t * 3 + i) * 18;
        ctx.lineCap = 'round';
        ctx.lineWidth = 22; ctx.strokeStyle = INK;
        ctx.beginPath(); ctx.moveTo(x0, 30); ctx.bezierCurveTo(x0 + sw, 80, x0 - sw, 100, x0 + sw * 0.6, 130); ctx.stroke();
        ctx.lineWidth = 15; ctx.strokeStyle = col; ctx.stroke();
        for (let k = 0; k < 3; k++) D.circle(ctx, x0 + sw * (0.2 + k * 0.1), 60 + k * 22, 3, '#ffd6ff', 0);
      }
      ctx.beginPath(); ctx.ellipse(0, -10, 84, 74, 0, 0, Math.PI * 2); fillStroke(ctx, col, 5);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-36, -50, 14, 24, 0.6, 0, Math.PI * 2); ctx.fill();
      // big round glasses
      for (const x of [-28, 22]) { D.circle(ctx, x, -14, 22, '#e0fbfc', 5); eye(ctx, x, -14, 11, -0.6); }
      ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(-6, -16); ctx.lineTo(0, -18); ctx.stroke();
      cheeks(ctx, -50, 46, 14, 8); smile(ctx, -2, 30, 12);
      // glass dome on top
      ctx.beginPath(); ctx.arc(0, -10, 100, Math.PI * 1.05, Math.PI * 1.95); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(189,224,254,0.9)'; ctx.stroke();
      ctx.restore();
    },
    // ---- 6. Magma Mole: a mole in a drill tank ----
    mole(ctx, b, flash, swell) {
      ctx.save(); ctx.scale(swell, swell);
      // treads
      D.box(ctx, -60, 40, 160, 44, 22, '#5c5c5c', 5);
      for (let i = 0; i < 6; i++) D.circle(ctx, -38 + i * 26, 62, 10, '#adb5bd', 3);
      // tank body
      D.box(ctx, -50, -50, 150, 96, 26, flash ? '#fff' : '#ff8c42', 5);
      ctx.fillStyle = '#ffd166'; ctx.fillRect(-44, 20, 138, 10);
      // drill (points left, spins)
      ctx.save(); ctx.translate(-50, -4);
      path(ctx, [[0, -38], [-92, 0], [0, 38]]); fillStroke(ctx, '#adb5bd', 5);
      ctx.save(); ctx.clip();
      ctx.strokeStyle = INK; ctx.lineWidth = 4;
      const off = (b.t * 60) % 24;
      for (let x = -100 + off; x < 10; x += 24) { ctx.beginPath(); ctx.moveTo(x, -40); ctx.lineTo(x + 18, 40); ctx.stroke(); }
      ctx.restore(); ctx.restore();
      // the mole in the hatch
      D.circle(ctx, 30, -62, 36, flash ? '#fff' : '#8d6e63', 5);
      ctx.beginPath(); ctx.ellipse(10, -54, 16, 12, 0, 0, Math.PI * 2); fillStroke(ctx, '#ffccd5', 3);   // snout
      D.circle(ctx, 0, -56, 6, '#ef476f', 2.5);
      // goggles
      D.box(ctx, 4, -88, 52, 22, 10, '#4cc9f0', 4);
      eye(ctx, 18, -77, 7, -0.6); eye(ctx, 42, -77, 7, -0.6);
      ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(18, -46, 6, 0.2, Math.PI - 0.2); ctx.stroke();
      ctx.restore();
    },
    // ---- 7. Prism Queen: a crystal butterfly ----
    prism(ctx, b, flash, swell) {
      ctx.save(); ctx.scale(swell, swell);
      const flap = 0.8 + Math.sin(b.t * 5) * 0.2;
      // four big crystal wings (they flap by getting narrower and wider)
      const wing = (cx, cy, rx, ry, rot, c1, c2) => {
        ctx.save(); ctx.scale(flap, 1); ctx.translate(cx, cy); ctx.rotate(rot);
        const gr = ctx.createLinearGradient(-rx, -ry, rx, ry); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
        ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); fillStroke(ctx, flash ? '#fff' : gr, 5);
        // crystal facets
        ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath(); ctx.moveTo(-rx * 0.8, 0); ctx.lineTo(rx * 0.8, 0); ctx.moveTo(0, -ry * 0.8); ctx.lineTo(0, ry * 0.8);
        ctx.moveTo(-rx * 0.5, -ry * 0.6); ctx.lineTo(rx * 0.5, ry * 0.6); ctx.stroke();
        D.circle(ctx, rx * 0.35, -ry * 0.3, Math.min(rx, ry) * 0.18, 'rgba(255,255,255,0.6)', 0);
        ctx.restore();
      };
      wing(70, -50, 78, 52, -0.6, '#9bf6ff', '#c77dff'); wing(-70, -50, 78, 52, 0.6, '#9bf6ff', '#c77dff');
      wing(56, 46, 54, 38, 0.5, '#ffafcc', '#9bf6ff'); wing(-56, 46, 54, 38, -0.5, '#ffafcc', '#9bf6ff');
      ctx.beginPath(); ctx.ellipse(0, 10, 22, 60, 0, 0, Math.PI * 2); fillStroke(ctx, flash ? '#fff' : '#7b2cbf', 5);
      D.circle(ctx, 0, -58, 30, flash ? '#fff' : '#e0aaff', 5);
      eye(ctx, -12, -60, 9, -0.6); eye(ctx, 10, -60, 9, -0.6);
      cheeks(ctx, -20, 18, -46, 5);
      path(ctx, [[-20, -84], [-14, -102], [-6, -90], [0, -108], [6, -90], [14, -102], [20, -84]]); fillStroke(ctx, '#9bf6ff', 3);
      ctx.lineWidth = 3; ctx.strokeStyle = INK;
      ctx.beginPath(); ctx.moveTo(-8, -86); ctx.quadraticCurveTo(-24, -120, -36, -118); ctx.moveTo(8, -86); ctx.quadraticCurveTo(24, -124, 36, -122); ctx.stroke();
      D.circle(ctx, -36, -118, 5, '#ffd166', 2); D.circle(ctx, 36, -122, 5, '#ffd166', 2);
      ctx.restore();
    },
    // ---- 8. Thunder Whale: a big whale made of storm clouds ----
    whale(ctx, b, flash, swell) {
      ctx.save(); ctx.scale(swell, swell);
      const col = flash ? '#fff' : '#5e81ac';
      // tail (right side)
      ctx.save(); ctx.translate(110, -10); ctx.rotate(Math.sin(b.t * 2) * 0.2);
      path(ctx, [[0, 0], [50, -40], [36, 0], [50, 40]]); fillStroke(ctx, col, 5);
      ctx.restore();
      ctx.beginPath(); ctx.ellipse(0, 0, 120, 74, 0, 0, Math.PI * 2); fillStroke(ctx, col, 5);
      ctx.beginPath(); ctx.ellipse(-10, 36, 96, 34, 0, 0, Math.PI); ctx.fillStyle = '#d8e2f0'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = INK; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-80 + i * 26, 44); ctx.lineTo(-76 + i * 26, 64); ctx.stroke(); }
      // cloud puffs on the back
      for (const [x, y, r] of [[-40, -70, 22], [-10, -80, 26], [24, -74, 22], [52, -62, 18]]) D.circle(ctx, x, y, r, '#eef2f7', 4);
      // lightning spout
      path(ctx, [[-4, -100], [-16, -128], [-4, -126], [-14, -152], [10, -118], [-2, -120], [8, -100]]); fillStroke(ctx, '#ffd166', 3);
      eye(ctx, -70, -10, 13, -0.6); cheeks(ctx, -86, -50, 12, 7);
      ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(-118, 10); ctx.quadraticCurveTo(-90, 26, -60, 16); ctx.stroke();
      // flipper
      ctx.save(); ctx.translate(-10, 50); ctx.rotate(0.5 + Math.sin(b.t * 3) * 0.2);
      ctx.beginPath(); ctx.ellipse(0, 20, 14, 30, 0, 0, Math.PI * 2); fillStroke(ctx, col, 4);
      ctx.restore();
      ctx.restore();
    },
    // ---- 9. Mecha Kitty: a giant robot cat head ----
    mechacat(ctx, b, flash, swell) {
      ctx.save(); ctx.scale(swell, swell);
      const col = flash ? '#fff' : '#ff5fa2';
      for (const s of [-1, 1]) { path(ctx, [[s * 30, -60], [s * 76, -120], [s * 82, -40]]); fillStroke(ctx, col, 5); path(ctx, [[s * 46, -62], [s * 72, -102], [s * 74, -56]]); fillStroke(ctx, '#ffd6ff', 3); }
      D.box(ctx, -92, -76, 184, 150, 52, col, 5);
      D.box(ctx, -70, -44, 140, 56, 22, '#1b1b3a', 5);
      // LED eyes (blink, look left)
      const blink = Math.floor(b.t * 1.1) % 4 === 0 && (b.t * 1.1) % 1 < 0.15;
      for (const x of [-34, 30]) {
        if (blink) { ctx.fillStyle = '#06d6a0'; ctx.fillRect(x - 16, -18, 32, 5); }
        else { D.box(ctx, x - 16, -32, 32, 32, 8, '#06d6a0', 0); D.box(ctx, x - 14, -24, 12, 16, 4, '#e0fbfc', 0); }
      }
      // whiskers
      ctx.lineWidth = 4; ctx.strokeStyle = '#ffd166';
      for (const s of [-1, 1]) for (const dy of [-6, 8]) { ctx.beginPath(); ctx.moveTo(s * 60, 30 + dy); ctx.lineTo(s * 116, 22 + dy * 2); ctx.stroke(); }
      path(ctx, [[-8, 22], [8, 22], [0, 32]]); fillStroke(ctx, '#ffd166', 3);
      // speaker mouth
      D.box(ctx, -26, 40, 52, 18, 8, '#1b1b3a', 4);
      ctx.fillStyle = '#06d6a0'; for (let i = 0; i < 5; i++) { const hh = 4 + Math.abs(Math.sin(b.t * 9 + i)) * 8; ctx.fillRect(-20 + i * 9, 49 - hh / 2, 5, hh); }
      for (const [x, y] of [[-80, -60], [80, -60], [-80, 60], [80, 60]]) D.circle(ctx, x, y, 5, '#adb5bd', 2.5);
      ctx.restore();
    },
    // ---- 10. Twin-Moon Guardian: a stone face with two moon helpers ----
    guardian(ctx, b, flash, swell) {
      ctx.save(); ctx.scale(swell, swell);
      // rune ring
      ctx.save(); ctx.rotate(b.t * 0.4);
      ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(0, 0, 112, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 6; ctx.strokeStyle = '#9b5de5'; ctx.stroke();
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; D.star(ctx, Math.cos(a) * 112, Math.sin(a) * 112, 9, '#ffd166', 2.5); }
      ctx.restore();
      D.circle(ctx, 0, 0, 82, flash ? '#fff' : '#b8b8d1', 5);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (const [x, y, r] of [[40, -40, 12], [-46, 34, 9], [30, 48, 7]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
      // stern (but friendly) face
      ctx.lineWidth = 6; ctx.strokeStyle = INK;
      ctx.beginPath(); ctx.moveTo(-50, -34); ctx.lineTo(-14, -26); ctx.moveTo(50, -34); ctx.lineTo(14, -26); ctx.stroke();
      const glow = 0.6 + Math.sin(b.t * 4) * 0.4;
      for (const x of [-32, 32]) { D.circle(ctx, x, -8, 14, '#2b2b2b', 0); D.circle(ctx, x - 3, -8, 8, `rgba(155,246,255,${glow})`, 0); }
      ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-26, 40); ctx.quadraticCurveTo(0, 30, 26, 40); ctx.stroke();
      // the two moons going round
      for (let i = 0; i < 2; i++) {
        const a = b.t * 1.4 + i * Math.PI;
        const mx = Math.cos(a) * 150, my = Math.sin(a) * 60;
        D.circle(ctx, mx, my, 26, i ? '#ffd166' : '#8ecae6', 4);
        eye(ctx, mx - 8, my - 3, 6, -0.6); eye(ctx, mx + 8, my - 3, 6, -0.6); smile(ctx, mx, my + 10, 5);
      }
      ctx.restore();
    },
  };
  // where the two Guardian moons are (they can be bubbled too, and bonk you)
  function guardianMoons(b) { return [0, 1].map(i => { const a = b.t * 1.4 + i * Math.PI; return { x: b.x + Math.cos(a) * 150, y: b.y + Math.sin(a) * 60, r: 26 }; }); }

  // =================================================================
  // CHIMERA, THE EATER OF WORLDS
  // A huge cosmic beast made of night sky: a lion head with a mane of
  // star-fire, a ram-horned goat head on its back, a serpent for a tail
  // and great bat wings. c = { x, y (lion head), t, jaw 0-1, part (which
  // head is awake: 'lion' | 'goat' | 'snake' | 'maw'), done: {lion, goat, snake},
  // flash, snake: {x, y} (serpent head), glow }
  // A head that has been beaten turns to calm starlight.
  // =================================================================
  const NIGHT = '#2a1650', NIGHT2 = '#3d1f73', STARFIRE = ['#ff3d6e', '#ff8c42', '#ffd166'];
  function speckles(ctx, n, w, h, seed) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < n; i++) {
      const x = ((Math.sin(seed + i * 12.9898) * 43758.5453) % 1 + 1) % 1, y = ((Math.sin(seed + i * 78.233) * 12345.678) % 1 + 1) % 1;
      const tw = 0.5 + 0.5 * Math.sin(clock * 3 + i);
      ctx.globalAlpha = 0.4 + 0.6 * tw;
      ctx.fillRect(-w / 2 + x * w, -h / 2 + y * h, 2.5, 2.5);
    }
    ctx.globalAlpha = 1;
  }
  // a glowing, angry eye with a slit pupil (or a calm closed one when beaten)
  function fierceEye(ctx, x, y, r, angle, calm, color = '#ffd166') {
    if (calm) { ctx.lineWidth = 4; ctx.strokeStyle = '#bde0fe'; ctx.beginPath(); ctx.arc(x, y - r * 0.2, r * 0.8, 0.3, Math.PI - 0.3); ctx.stroke(); return; }
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.shadowColor = color; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.moveTo(-r * 1.3, 0); ctx.quadraticCurveTo(0, -r * 1.1, r * 1.3, -r * 0.2); ctx.quadraticCurveTo(0, r * 0.9, -r * 1.3, 0); ctx.closePath();
    ctx.fillStyle = color; ctx.fill(); ctx.shadowBlur = 0; ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-r * 0.15, -r * 0.05, r * 0.22, r * 0.6, 0, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
    D.circle(ctx, r * 0.35, -r * 0.35, r * 0.18, '#fff', 0);
    ctx.restore();
  }
  // a great bat wing: an arm bone up to the "wrist", long finger bones fanning out,
  // and stretchy skin between them that curves in (scalloped) like a real bat's
  function wing(ctx, c, side, calm) {
    const flap = Math.sin(c.t * 2.4 + (side > 0 ? 0 : 0.7)) * 0.16;
    ctx.save();
    ctx.translate(side > 0 ? 160 : 110, side > 0 ? -70 : -40);
    ctx.rotate(flap - (side > 0 ? 0.05 : -0.2));
    const s = side > 0 ? 1.05 : 0.85;
    ctx.scale(s, s);
    const wrist = [30, -170];
    const tips = [[-40, -250], [90, -290], [210, -230], [280, -110]];
    const trail = [170, 10];
    const scallop = (px, py, x, y) => { const mx = (px + x) / 2, my = (py + y) / 2; ctx.quadraticCurveTo(mx + (wrist[0] - mx) * 0.4, my + (wrist[1] - my) * 0.4, x, y); };
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(wrist[0], wrist[1]); ctx.lineTo(tips[0][0], tips[0][1]);
    for (let i = 1; i < tips.length; i++) scallop(tips[i - 1][0], tips[i - 1][1], tips[i][0], tips[i][1]);
    scallop(tips[3][0], tips[3][1], trail[0], trail[1]);
    ctx.quadraticCurveTo(80, 10, 0, 30);
    ctx.closePath();
    const gr = ctx.createLinearGradient(30, -170, 200, 0);
    gr.addColorStop(0, calm ? '#4b3a7a' : '#3c0d6b'); gr.addColorStop(1, calm ? '#6e5fa8' : '#a3154f');
    ctx.fillStyle = gr; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    ctx.save(); ctx.clip(); ctx.translate(120, -140); speckles(ctx, 36, 420, 340, side * 7); ctx.restore();
    // bones
    ctx.lineCap = 'round';
    const bone = (x1, y1, x2, y2, wdt) => {
      ctx.lineWidth = wdt + 5; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.lineWidth = wdt; ctx.strokeStyle = calm ? '#b3a9e0' : '#c9a7ff'; ctx.stroke();
    };
    bone(0, 0, wrist[0], wrist[1], 9);
    for (const [x, y] of tips) bone(wrist[0], wrist[1], x, y, 4);
    // a hooked thumb claw at the wrist, little claws on the tips
    ctx.beginPath(); ctx.moveTo(wrist[0] - 6, wrist[1] - 4); ctx.quadraticCurveTo(wrist[0] - 30, wrist[1] - 20, wrist[0] - 22, wrist[1] + 8); ctx.lineTo(wrist[0] - 2, wrist[1] + 2); ctx.closePath(); fillStroke(ctx, '#f1e3d3', 3);
    for (const [x, y] of tips) { path(ctx, [[x - 5, y + 5], [x + 4, y - 14], [x + 9, y + 3]]); fillStroke(ctx, '#f1e3d3', 2.5); }
    ctx.restore();
  }
  function lionHead(ctx, c, calm, flash) {
    const jaw = c.jaw || 0;
    // mane of star-fire: three rings of flickering spikes
    const ring = (R, n, col, wob) => {
      ctx.beginPath();
      for (let i = 0; i <= n * 2; i++) {
        const a = (i / (n * 2)) * Math.PI * 2 + 0.1;
        const k = i % 2 ? 0.72 : 1 + wob * Math.sin(clock * 7 + i * 1.7);
        const x = Math.cos(a) * R * k * 1.05, y = Math.sin(a) * R * k;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); fillStroke(ctx, col, 5);
    };
    if (calm) { ring(150, 14, '#6e5fa8', 0); ring(118, 12, '#8f84c9', 0); }
    else { ring(155, 14, STARFIRE[0], 0.1); ring(125, 13, STARFIRE[1], 0.12); ring(98, 12, STARFIRE[2], 0.14); }
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 150, 0, Math.PI * 2); ctx.clip(); speckles(ctx, 26, 300, 300, 3); ctx.restore();
    // horns (it's a mythical beast!)
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s * 34, -62); ctx.quadraticCurveTo(s * 70, -120, s * 40, -150); ctx.quadraticCurveTo(s * 58, -110, s * 14, -70); ctx.closePath();
      fillStroke(ctx, calm ? '#c9c3e6' : '#f1e3d3', 4);
    }
    // face
    ctx.beginPath();
    ctx.moveTo(-70, -40); ctx.quadraticCurveTo(0, -95, 70, -40);
    ctx.quadraticCurveTo(86, 20, 46, 66 + jaw * 30);
    ctx.quadraticCurveTo(0, 90 + jaw * 40, -46, 66 + jaw * 30);
    ctx.quadraticCurveTo(-86, 20, -70, -40); ctx.closePath();
    fillStroke(ctx, flash ? '#fff' : calm ? '#8f84c9' : '#d9a066', 5);
    // dark stripes on the forehead
    ctx.lineWidth = 6; ctx.strokeStyle = calm ? '#6e5fa8' : '#a0522d';
    for (const x of [-14, 0, 14]) { ctx.beginPath(); ctx.moveTo(x, -66); ctx.lineTo(x * 0.6, -44); ctx.stroke(); }
    // mouth (opens wide: inside is a swirl of space - the "eater of worlds")
    const my = 42, mh = 14 + jaw * 48, mcy = my + mh * 0.5;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(0, mcy, 42 + jaw * 8, mh * 0.58, 0, 0, Math.PI * 2);
    const maw = ctx.createRadialGradient(0, mcy, 4, 0, mcy, 60);
    maw.addColorStop(0, calm ? '#9bf6ff' : '#ff5fa2'); maw.addColorStop(0.45, '#5a189a'); maw.addColorStop(1, '#10002b');
    ctx.fillStyle = maw; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.clip();
    if (jaw > 0.2) {   // swirling galaxy inside
      ctx.translate(0, mcy); ctx.rotate(clock * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 0, 10 + i * 12, i, i + 2.2); ctx.stroke(); }
    }
    ctx.restore();
    // fangs
    const fang = (x, y, h, down) => { path(ctx, [[x - 7, y], [x, y + (down ? h : -h)], [x + 7, y]]); fillStroke(ctx, '#fffbea', 3); };
    if (!calm) {
      fang(-26, my - 2, 26 + jaw * 6, true); fang(26, my - 2, 26 + jaw * 6, true);
      fang(-10, my, 12, true); fang(10, my, 12, true);
      const ly = mcy + mh * 0.55;
      fang(-22, ly, 12 + jaw * 6, false); fang(22, ly, 12 + jaw * 6, false);
    }
    // muzzle + nose
    ctx.beginPath(); ctx.ellipse(-19, 28, 22, 14, 0.2, 0, Math.PI * 2); ctx.ellipse(19, 28, 22, 14, -0.2, 0, Math.PI * 2); fillStroke(ctx, calm ? '#b3a9e0' : '#f2d0a4', 4);
    path(ctx, [[-16, 8], [16, 8], [0, 24]]); fillStroke(ctx, '#2b2b2b', 3);
    // angry brows + glowing eyes
    if (!calm) {
      ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-64, -34); ctx.lineTo(-14, -14); ctx.moveTo(64, -34); ctx.lineTo(14, -14); ctx.stroke();
    }
    fierceEye(ctx, -36, -6, 15, 0.25, calm); fierceEye(ctx, 36, -6, 15, -0.25 + Math.PI, calm);
    if (calm) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(clock * 4); D.star(ctx, 0, -110, 12, '#fff', 0); ctx.globalAlpha = 1; }
  }
  function goatHead(ctx, c, calm, flash) {
    ctx.save(); ctx.scale(1.3, 1.3);
    const face = calm ? '#8f84c9' : '#6b4f8a';
    // ears stick out sideways, under the horns
    for (const s of [-1, 1]) {
      ctx.save(); ctx.translate(s * 34, -12); ctx.rotate(s * 0.35);
      ctx.beginPath(); ctx.ellipse(s * 16, 0, 22, 9, 0, 0, Math.PI * 2); fillStroke(ctx, face, 4);
      ctx.beginPath(); ctx.ellipse(s * 18, 0, 13, 4, 0, 0, Math.PI * 2); ctx.fillStyle = calm ? '#b3a9e0' : '#ff8fab'; ctx.fill();
      ctx.restore();
    }
    // a long face: wide at the eyes, narrow at the nose
    ctx.beginPath();
    ctx.moveTo(-36, -36); ctx.quadraticCurveTo(0, -58, 36, -36);
    ctx.quadraticCurveTo(42, 0, 22, 44); ctx.quadraticCurveTo(0, 62, -22, 44);
    ctx.quadraticCurveTo(-42, 0, -36, -36); ctx.closePath();
    fillStroke(ctx, flash ? '#fff' : face, 5);
    ctx.save(); ctx.clip(); speckles(ctx, 14, 90, 120, 9);
    ctx.fillStyle = calm ? '#a59bd6' : '#4a3366'; ctx.beginPath(); ctx.ellipse(0, 44, 26, 18, 0, 0, Math.PI * 2); ctx.fill();   // darker nose end
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(-36, -36); ctx.quadraticCurveTo(0, -58, 36, -36); ctx.quadraticCurveTo(42, 0, 22, 44); ctx.quadraticCurveTo(0, 62, -22, 44); ctx.quadraticCurveTo(-42, 0, -36, -36); ctx.closePath();
    ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    // nostril slits + a little mouth line
    ctx.lineWidth = 3.5; ctx.strokeStyle = INK;
    ctx.beginPath(); ctx.moveTo(-10, 40); ctx.lineTo(-5, 46); ctx.moveTo(10, 40); ctx.lineTo(5, 46); ctx.moveTo(-8, 54); ctx.quadraticCurveTo(0, 50, 8, 54); ctx.stroke();
    path(ctx, [[-10, 56], [10, 56], [0, 86]]); fillStroke(ctx, calm ? '#c9c3e6' : '#e0d6f0', 4);   // pointy beard
    // big curling ram horns: a spiral from the forehead, up and out and round
    for (const s of [-1, 1]) {
      ctx.beginPath();
      for (let i = 0; i <= 26; i++) { const a = Math.PI + i * 0.24, r = 40 - i * 1.15; const x = s * (52 + Math.cos(a) * r), y = -38 + Math.sin(a) * r; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.lineWidth = 22; ctx.strokeStyle = INK; ctx.stroke();
      ctx.lineWidth = 15; ctx.strokeStyle = calm ? '#c9c3e6' : '#e9c46a'; ctx.stroke();
      ctx.lineWidth = 3; ctx.strokeStyle = calm ? '#a9a2d0' : '#b8860b'; ctx.setLineDash([3, 7]); ctx.stroke(); ctx.setLineDash([]);
    }
    if (!calm) { ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(-32, -20); ctx.lineTo(-7, -9); ctx.moveTo(32, -20); ctx.lineTo(7, -9); ctx.stroke(); }
    // goat eyes: glowing, with sideways (rectangle) pupils
    for (const s of [-1, 1]) {
      if (calm) { ctx.lineWidth = 4; ctx.strokeStyle = '#bde0fe'; ctx.beginPath(); ctx.arc(s * 18, 2, 8, 0.3, Math.PI - 0.3); ctx.stroke(); continue; }
      ctx.save(); ctx.shadowColor = '#80ffdb'; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.ellipse(s * 18, 2, 12, 9, 0, 0, Math.PI * 2); ctx.fillStyle = '#80ffdb'; ctx.fill(); ctx.restore();
      ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      D.box(ctx, s * 18 - 8, -1, 16, 5, 2, INK, 0);
    }
    ctx.restore();
  }
  // the serpent tail: from the back of the body, under it, round to the front
  function serpentTail(ctx, c, calm) {
    const hx = c.snake.x - c.x, hy = c.snake.y - c.y;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const tail = () => { ctx.beginPath(); ctx.moveTo(250, 90); ctx.bezierCurveTo(360, 200, 260, 300, 120, 270); ctx.bezierCurveTo(40, 255, hx + 110, hy + 30, hx + 30, hy); };
    tail(); ctx.lineWidth = 46; ctx.strokeStyle = INK; ctx.stroke();
    tail(); ctx.lineWidth = 36; ctx.strokeStyle = calm ? '#6e8fa8' : '#2a9d8f'; ctx.stroke();
    tail(); ctx.lineWidth = 12; ctx.strokeStyle = calm ? '#a8c5da' : '#90e0c0'; ctx.setLineDash([10, 14]); ctx.stroke(); ctx.setLineDash([]);
  }
  // the serpent's head: a pointy viper head facing left, with a flicking tongue
  function serpentHead(ctx, c, calm, flash) {
    const hx = c.snake.x - c.x, hy = c.snake.y - c.y;
    ctx.save(); ctx.translate(hx, hy);
    ctx.rotate(c.snakeAngle || 0);
    ctx.scale(1.25, 1.25);
    const open = c.snakeOpen || 0;
    if (!calm) {
      const fl = Math.sin(clock * 14) > 0 ? 1 : 0.4;
      ctx.lineWidth = 4; ctx.strokeStyle = '#ff3d6e';
      ctx.beginPath(); ctx.moveTo(-40, 4); ctx.lineTo(-40 - 26 * fl, 4); ctx.lineTo(-48 - 30 * fl, -4); ctx.moveTo(-40 - 26 * fl, 4); ctx.lineTo(-48 - 30 * fl, 12); ctx.stroke();
    }
    const shape = [[-44, -2 - open * 10], [-10, -30], [34, -24], [44, 0], [34, 22], [-10, 26], [-44, 8 + open * 10]];
    path(ctx, shape); fillStroke(ctx, flash ? '#fff' : calm ? '#6e8fa8' : '#2a9d8f', 5);
    ctx.save(); path(ctx, shape); ctx.clip(); ctx.fillStyle = calm ? '#a8c5da' : '#90e0c0'; ctx.fillRect(-50, 8, 100, 30); ctx.restore();
    path(ctx, shape); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    if (!calm) { path(ctx, [[-30, 6], [-26, 22], [-22, 8]]); fillStroke(ctx, '#fffbea', 2.5); path(ctx, [[-18, 8], [-14, 20], [-10, 9]]); fillStroke(ctx, '#fffbea', 2.5); }
    if (!calm) { ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(-26, -20); ctx.lineTo(0, -12); ctx.stroke(); }
    fierceEye(ctx, -8, -6, 9, 0.3, calm, '#f72585');
    ctx.restore();
  }
  function drawChimera(ctx, c) {
    const done = c.done || {};
    const flash = c.flash > 0;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // a dark glow around it
    const aura = ctx.createRadialGradient(80, 0, 40, 80, 0, 360);
    aura.addColorStop(0, 'rgba(155,93,229,0.35)'); aura.addColorStop(1, 'rgba(155,93,229,0)');
    ctx.fillStyle = aura; ctx.fillRect(-300, -380, 760, 760);
    wing(ctx, c, 1, c.beaten);
    // the serpent tail behind the body
    serpentTail(ctx, c, done.snake || c.beaten);
    // body: a great cosmic lion body behind the mane
    ctx.beginPath(); ctx.ellipse(150, 50, 180, 112, -0.1, 0, Math.PI * 2); fillStroke(ctx, c.beaten ? '#4b3a7a' : NIGHT, 6);
    ctx.save(); ctx.beginPath(); ctx.ellipse(150, 50, 180, 112, -0.1, 0, Math.PI * 2); ctx.clip(); ctx.translate(150, 50); speckles(ctx, 50, 380, 240, 1); ctx.restore();
    wing(ctx, c, -1, c.beaten);
    // the goat head on a long neck, rising from the back
    ctx.lineWidth = 40; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(150, -20); ctx.quadraticCurveTo(170, -80, 190, -130); ctx.stroke();
    ctx.lineWidth = 31; ctx.strokeStyle = c.beaten || done.goat ? '#5b4a8f' : NIGHT2; ctx.stroke();
    ctx.save(); ctx.translate(190, -150); ctx.rotate(-0.08 + Math.sin(c.t * 1.3) * 0.05);
    goatHead(ctx, c, done.goat || c.beaten, flash && c.part === 'goat');
    ctx.restore();
    // front legs with big claws reaching forward
    for (const [lx, ly, s] of [[30, 120, 1], [110, 135, 0.9]]) {
      ctx.save(); ctx.translate(lx, ly); ctx.scale(s, s);
      ctx.beginPath(); ctx.moveTo(-10, -40); ctx.quadraticCurveTo(-40, 30, -70, 40); ctx.lineTo(-40, 70); ctx.quadraticCurveTo(10, 40, 40, -30); ctx.closePath();
      fillStroke(ctx, c.beaten ? '#4b3a7a' : NIGHT2, 5);
      for (let i = 0; i < 3; i++) { path(ctx, [[-74 + i * 12, 46 + i * 6], [-92 + i * 10, 56 + i * 8], [-70 + i * 12, 60 + i * 6]]); fillStroke(ctx, '#fffbea', 3); }
      ctx.restore();
    }
    // the lion head in front
    ctx.save(); ctx.rotate(Math.sin(c.t * 1.1) * 0.04);
    lionHead(ctx, c, done.lion || c.beaten, flash && (c.part === 'lion' || c.part === 'maw'));
    ctx.restore();
    // and the serpent's head at the front
    serpentHead(ctx, c, done.snake || c.beaten, flash && c.part === 'snake');
    // the part you can hit glows
    if (!c.beaten && c.hit) {
      ctx.restore(); ctx.save();
      const pulse = 0.5 + 0.5 * Math.sin(clock * 6);
      ctx.lineWidth = 5; ctx.strokeStyle = `rgba(255,255,255,${0.35 + pulse * 0.4})`; ctx.setLineDash([12, 10]);
      ctx.beginPath(); ctx.arc(c.hit.x, c.hit.y, c.hit.r + 10 + pulse * 4, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
  }
  // At the very end the Chimera becomes a constellation in the sky.
  function drawConstellation(ctx, x, y, k) {
    const pts = [[0, -150], [-60, -40], [0, 60], [80, 20], [170, -120], [260, -110], [250, 80], [120, 240], [0, 190], [-90, 150]];
    const lines = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [3, 6], [6, 7], [7, 8], [8, 9], [2, 8]];
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = k;
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(189,224,254,0.7)';
    for (const [a, b] of lines) { ctx.beginPath(); ctx.moveTo(pts[a][0], pts[a][1]); ctx.lineTo(pts[b][0], pts[b][1]); ctx.stroke(); }
    pts.forEach(([px, py], i) => D.star(ctx, px, py, 7 + Math.sin(clock * 4 + i) * 2, '#fff6c7', 0));
    ctx.restore();
  }

  // =================================================================
  // WEAPON ICONS: a little picture of each special weapon in a circle
  // =================================================================
  function weaponIcon(ctx, w, x, y, r) {
    ctx.save(); ctx.translate(x, y);
    D.circle(ctx, 0, 0, r, w.color, 3);
    const k = r / 22; ctx.scale(k, k);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const bub = (bx, by, br, c = '#bdf3ff') => { D.circle(ctx, bx, by, br, c, 2.5); D.circle(ctx, bx - br * 0.35, by - br * 0.35, br * 0.28, '#fff', 0); };
    const L = (pts, wdt = 3, col = INK) => { ctx.lineWidth = wdt; ctx.strokeStyle = col; path(ctx, pts, false); ctx.stroke(); };
    switch (w.id) {
      case 'bubble': bub(0, 0, 9); break;
      case 'twin': bub(-2, -7, 6); bub(-2, 7, 6); break;
      case 'spread': bub(-8, 0, 5); bub(6, -9, 5); bub(6, 9, 5); break;
      case 'fan': for (let i = 0; i < 5; i++) { const a = -0.9 + i * 0.45; bub(Math.cos(a) * 11 - 3, Math.sin(a) * 11, 3.6); } break;
      case 'beam': ['#ef476f', '#ffd166', '#06d6a0', '#118ab2'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-14, -8 + i * 4, 28, 4); }); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.strokeRect(-14, -8, 28, 16); break;
      case 'homing': heart(ctx, -4, 0, 7, '#ff5fa2', 2); L([[4, -8], [12, -2], [6, 6]], 2.5, '#fff'); break;
      case 'bouncy': L([[-14, 10], [-6, -10], [2, 10], [10, -10]], 2.5, '#fff'); D.circle(ctx, 10, -10, 5, '#ff5fa2', 2); break;
      case 'laser': ctx.fillStyle = '#ff3d6e'; ctx.fillRect(-14, -3, 28, 6); ctx.fillStyle = '#fff'; ctx.fillRect(-14, -1, 28, 2); break;
      case 'orbit': D.circle(ctx, 0, 0, 5, '#fff', 2); for (let i = 0; i < 3; i++) { const a = i * 2.1 + clock * 2; D.star(ctx, Math.cos(a) * 12, Math.sin(a) * 12, 5, '#ffd166', 1.5); } break;
      case 'big': bub(0, 0, 13); break;
      case 'rapid': for (let i = 0; i < 4; i++) bub(-12 + i * 8, (i % 2) * 4 - 2, 3); break;
      case 'cross': L([[0, -13], [0, 13]], 4, '#fff'); L([[-13, 0], [13, 0]], 4, '#fff'); bub(0, 0, 4); break;
      case 'wave': ctx.lineWidth = 3.5; ctx.strokeStyle = '#fff'; ctx.beginPath(); for (let i = 0; i <= 20; i++) ctx.lineTo(-14 + i * 1.4, Math.sin(i * 0.6) * 8); ctx.stroke(); break;
      case 'boomerang': ctx.beginPath(); ctx.moveTo(-12, -10); ctx.quadraticCurveTo(10, -8, 12, 12); ctx.quadraticCurveTo(4, -2, -12, -2); ctx.closePath(); fillStroke(ctx, '#ff8c42', 2.5); break;
      case 'zap': path(ctx, [[2, -14], [-8, 2], [0, 2], [-4, 14], [9, -4], [1, -4]]); fillStroke(ctx, '#ffd166', 2.5); break;
      case 'rockets': ctx.save(); ctx.rotate(-0.6); D.box(ctx, -10, -5, 18, 10, 4, '#ef476f', 2.5); path(ctx, [[8, -5], [14, 0], [8, 5]]); fillStroke(ctx, '#fff', 2); path(ctx, [[-10, -3], [-16, 0], [-10, 3]]); fillStroke(ctx, '#ffd166', 1.5); ctx.restore(); break;
      case 'freeze': ctx.lineWidth = 3.5; ctx.strokeStyle = '#0077b6'; for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate(i * Math.PI / 3); ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.moveTo(7, -4); ctx.lineTo(10, 0); ctx.lineTo(7, 4); ctx.stroke(); ctx.restore(); } break;
      case 'ring': for (const rr of [5, 10, 15]) { ctx.lineWidth = 2.5; ctx.strokeStyle = rr === 10 ? '#fff' : '#9bf6ff'; ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.stroke(); } break;
      case 'petal': for (let i = 0; i < 5; i++) { ctx.save(); ctx.rotate(i * Math.PI * 2 / 5); ctx.beginPath(); ctx.ellipse(0, -8, 4, 8, 0, 0, Math.PI * 2); fillStroke(ctx, '#ffafcc', 1.5); ctx.restore(); } D.circle(ctx, 0, 0, 4, '#ffd166', 1.5); break;
      case 'drones': for (const dy of [-8, 8]) { D.circle(ctx, 0, dy, 6, '#adb5bd', 2); D.circle(ctx, -2, dy, 2, '#06d6a0', 0); } bub(12, 0, 3); break;
      case 'sonic': for (const rr of [6, 11, 16]) { ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(-10, 0, rr, -0.9, 0.9); ctx.stroke(); } break;
      default: bub(0, 0, 9);
    }
    ctx.restore();
  }
  // the same picture as an image (for the Weapon Book menu)
  const iconCache = {};
  function weaponIconURL(w, locked) {
    const key = w.id + (locked ? '-x' : '');
    if (iconCache[key]) return iconCache[key];
    const c = document.createElement('canvas'); c.width = c.height = 96;
    const x = c.getContext('2d');
    if (locked) { D.circle(x, 48, 48, 40, '#6c757d', 4); D.text(x, '?', 48, 52, { size: 44, color: '#fff' }); }
    else weaponIcon(x, w, 48, 48, 40);
    return (iconCache[key] = c.toDataURL());
  }

  return { tick, heart, eye, smile, cheeks, drawEnemy, enemyBody, drawMini, BIG, guardianMoons, drawChimera, drawConstellation, weaponIcon, weaponIconURL };
})();
