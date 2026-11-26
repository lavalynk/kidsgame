// =====================================================================
// The Jukebox (Nov 21, late night): every song in the arcade in one place, a friend who
// dances to it, buttons that change how the song sounds, and drum pads to play
// along. The hub's bar has a jukebox button that opens this page.
//
// The songs come from jukebox/songs.js (tools/make_jukebox.py copies them out of
// the games), and they're played by the arcade's own band (Arcade.audio in
// arcade/shared.js): the same music you hear in the games.
//
// The page is one canvas screen, 'jukebox' (arcade/canvasmenu.js):
//   top:    the stage (a live picture, attr 'stage': your animal dancing, speakers, lights,
//           and bars that jump with the sound; tap it = a spin) + 4 drum pads:
//           'pad-boom' (drum), 'pad-clap', 'pad-ding' (a bell that always fits the song),
//           'pad-tada' (a little jingle)
//   rows:   the mix buttons (round, yellow = on): 'mix-slow' (turtle), 'mix-fast' (rabbit),
//           'mix-high' (squeaky), 'mix-party' (disco ball), 'mix-water' (underwater),
//           then a tile for every song: 'song-<game>-<n>' (the game's picture + the song's number;
//           yellow = playing)
//   footer: 'home', 'stop', 'dice' (a surprise song)
// Every sound here follows the beat: a pad tapped a little early waits for the next 16th note.
// Test hook: window.__jukebox() (what's playing, the mix, the beat, how many pads were hit).
// =====================================================================
(function () {
  'use strict';
  const A = Arcade.audio, P = Arcade.profiles, CM = window.ArcadeMenus;
  const SONGS = window.JUKEBOX_SONGS || [];
  // the game colors (the hub's), for the song tiles
  const COLORS = { arcade: '#b8a4ff', bike: '#8ecae6', rc: '#90be6d', hoops: '#ffb4a2', golf: '#8fe07a', archery: '#b8e0d2',
    jungle: '#a0e7a0', trail: '#7bd389', quest: '#b8a4ff', space: '#9fa8ff', abc: '#4cc9f0', fishing: '#4cc9f0', piano: '#c77dff', claw: '#ff8fab' };
  const INK = 'stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"';
  const svg = (inner) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

  // ---------- pictures for the buttons (no reading needed) ----------
  const PIC = {
    turtle: svg(`<ellipse cx="25" cy="38" rx="17" ry="4" fill="#2b2b2b" opacity="0.15"/><circle cx="40" cy="27" r="5.5" fill="#8fe07a" ${INK}/><circle cx="41.5" cy="25.5" r="1.4" fill="#2b2b2b"/>
      <path d="M12 34 V37 M20 34 V38 M30 34 V38" stroke="#2b2b2b" stroke-width="5" stroke-linecap="round"/><path d="M8 33 Q10 15 24 15 Q38 15 38 33 Z" fill="#06d6a0" ${INK}/><path d="M16 22 L23 27 L31 22 M23 27 V33" fill="none" stroke="#2b2b2b" stroke-width="2.5" stroke-linecap="round"/>`),
    rabbit: svg(`<path d="M18 22 Q12 4 17 4 Q22 4 23 20 Z M27 20 Q28 4 33 5 Q37 7 30 22 Z" fill="#fff" ${INK}/><circle cx="25" cy="30" r="12" fill="#fff" ${INK}/>
      <circle cx="21" cy="28" r="2" fill="#2b2b2b"/><circle cx="29" cy="28" r="2" fill="#2b2b2b"/><circle cx="25" cy="33" r="2" fill="#ff8fab"/><path d="M4 26 H9 M2 32 H9 M4 38 H10" stroke="#4cc9f0" stroke-width="3" stroke-linecap="round"/>`),
    high: svg(`<path d="M14 40 V14 L34 9 V34" fill="none" ${INK} stroke-width="4"/><circle cx="10" cy="40" r="5.5" fill="#ff5fa2" ${INK}/><circle cx="30" cy="35" r="5.5" fill="#ff5fa2" ${INK}/>
      <path d="M40 22 V6 M34 12 L40 5 L46 12" fill="none" stroke="#06d6a0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`),
    party: svg(`<path d="M24 2 V9" stroke="#2b2b2b" stroke-width="3"/><circle cx="24" cy="25" r="16" fill="#c9d6e3" ${INK}/>
      <path d="M9 21 H39 M9 30 H39 M17 11 Q13 25 17 39 M31 11 Q35 25 31 39 M24 9 V41" fill="none" stroke="#2b2b2b" stroke-width="1.8"/>
      <rect x="18" y="15" width="6" height="6" fill="#ff5fa2"/><rect x="26" y="25" width="6" height="5" fill="#4cc9f0"/><rect x="12" y="25" width="5" height="5" fill="#ffd166"/><rect x="25" y="32" width="6" height="5" fill="#06d6a0"/>`),
    water: svg(`<circle cx="18" cy="28" r="11" fill="#bde0fe" ${INK}/><circle cx="35" cy="15" r="7" fill="#bde0fe" ${INK}/><circle cx="36" cy="36" r="5" fill="#bde0fe" ${INK}/>
      <path d="M12 23 Q14 19 18 19" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`),
    boom: svg(`<ellipse cx="24" cy="15" rx="18" ry="7" fill="#fff" ${INK}/><path d="M6 15 V33 Q24 44 42 33 V15 Q24 26 6 15 Z" fill="#ef476f" ${INK}/>
      <path d="M10 20 L18 36 L26 22 L32 38 L40 20" fill="none" stroke="#ffd166" stroke-width="3" stroke-linejoin="round"/>`),
    clap: svg(`<path d="M13 40 Q4 30 10 16 L14 8 Q17 6 18 9 L17 17 L23 7 Q26 5 27 8 L22 22 Z" fill="#ffd6a5" ${INK}/><path d="M35 40 Q44 30 38 16 L34 8 Q31 6 30 9 L31 17 L25 7 Q22 5 21 8 L26 22 Z" fill="#ffc28a" ${INK}/>
      <path d="M24 2 V5 M16 3 L18 6 M32 3 L30 6" stroke="#ff5fa2" stroke-width="3" stroke-linecap="round"/>`),
    ding: svg(`<path d="M24 6 Q12 8 12 24 V32 L8 37 H40 L36 32 V24 Q36 8 24 6 Z" fill="#ffd166" ${INK}/><circle cx="24" cy="41" r="4" fill="#ffd166" ${INK}/><circle cx="24" cy="5" r="2.5" fill="#2b2b2b"/>
      <path d="M18 14 Q16 18 16 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`),
    tada: svg(`<path d="M6 42 L16 14 L34 32 Z" fill="#ff5fa2" ${INK}/><path d="M10 31 L22 37 M13 22 L28 30" stroke="#fff" stroke-width="3"/>
      <circle cx="30" cy="9" r="3" fill="#ffd166"/><circle cx="40" cy="18" r="3" fill="#4cc9f0"/><circle cx="38" cy="6" r="2.5" fill="#06d6a0"/><path d="M24 12 Q26 4 32 4 M36 24 Q42 22 44 28" fill="none" stroke="#9b5de5" stroke-width="3" stroke-linecap="round"/>`),
    stop: svg(`<rect x="10" y="10" width="28" height="28" rx="6" fill="#ef476f" ${INK}/>`),
    dice: svg(`<rect x="7" y="7" width="34" height="34" rx="8" fill="#fff" ${INK}/><circle cx="16" cy="16" r="3.5" fill="#2b2b2b"/><circle cx="24" cy="24" r="3.5" fill="#2b2b2b"/><circle cx="32" cy="32" r="3.5" fill="#2b2b2b"/>`),
  };
  // a song's tile: the game's round picture + the song's number in a bubble (games with more than one song)
  const count = {}; SONGS.forEach(s => { count[s.game] = (count[s.game] || 0) + 1; });
  function songPic(s) {
    const id = 'c' + s.game + s.n;
    const num = count[s.game] > 1 ? `<circle cx="80" cy="22" r="19" fill="#fff" stroke="#2b2b2b" stroke-width="5"/>` +
      `<text x="80" y="31" font-size="${s.n > 9 ? 22 : 26}" font-weight="900" font-family="Arial, sans-serif" text-anchor="middle" fill="#2b2b2b">${s.n}</text>` : '';
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="${id}"><circle cx="50" cy="52" r="42"/></clipPath></defs>` +
      `<g clip-path="url(#${id})"><svg x="8" y="10" width="84" height="84" viewBox="0 0 240 240">${Arcade.badges[s.game] || ''}</svg></g>` +
      `<circle cx="50" cy="52" r="42" fill="none" stroke="#2b2b2b" stroke-width="5"/>` +
      // a little music note at the bottom: it's a song
      `<path d="M30 92 V76 L42 73 V88" fill="none" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><circle cx="27" cy="92" r="5" fill="#ffd166" stroke="#2b2b2b" stroke-width="3"/><circle cx="39" cy="88" r="5" fill="#ffd166" stroke="#2b2b2b" stroke-width="3"/>` +
      num + `</svg>`;
  }

  // ---------- the music ----------
  let playing = null;               // the song entry that's playing (null = stopped)
  const mix = { slow: false, fast: false, high: false, party: false, water: false };
  let pads = 0;                     // pads hit (for the tests)
  // The Jukebox plays even when this player switched the background music off (they came here to
  // hear songs); "all sound off" on the device and the parent corner's time limit still win.
  const plainVolumes = A.applyVolumes.bind(A);
  A.applyVolumes = function () {
    plainVolumes();
    if (this.ctx && this.musicGain) this.musicGain.gain.value = Math.max(0.25, +Arcade.store.settings().music || 0) * 0.7;
  };
  function wake() { A.resume(); A.ensure(); A.applyVolumes(); A.musicBus(); listen(); }
  function applyMix() {
    A.setMood({ tempo: mix.slow ? 0.78 : mix.fast ? 1.25 : 1, key: mix.high ? 7 : 0, energy: mix.party ? 2 : 1, muffle: mix.water ? 0.85 : 0 });
  }
  function playSong(s) {
    wake();
    playing = s;
    applyMix();
    A.play(s.song, { quick: true, fade: 0.4 });
    dancer.jump = 1;
  }
  function stopSong() { playing = null; A.stop(0.5); }
  // the next 16th note from now (so a pad tapped a little early still lands on the beat)
  function onBeat() {
    const c = A.ctx, now = c.currentTime + 0.01, tr = A.track;
    if (!tr || tr.paused) return now;
    const six = sixteenth(tr);
    let t = tr.next - Math.floor((tr.next - now) / six) * six;
    if (t < now) t += six;
    return t;
  }
  const sixteenth = (tr) => 60 / (tr.song.tempo * (A.mood.tempo || 1)) / 4;
  function pad(kind) {
    wake();
    const c = A.ctx; if (!c) return;
    const t = onBeat(), dest = A.bus.comp, tr = A.track;
    pads++;
    if (kind === 'boom') { A.voice('kick', 0, t, 0.1, 0.95, 0, dest); A.voice('tom', A.midi(41), t, 0.1, 0.35, 0, dest); }
    else if (kind === 'clap') { A.voice('clap', 0, t, 0.1, 0.6, 0.2, dest); A.voice('clap', 0, t + 0.012, 0.1, 0.4, 0.2, dest); }
    else if (kind === 'ding') {
      // a bell note from the chord that's playing right now, so it always sounds right
      let notes = [72, 76, 79];
      if (tr && !tr.paused && tr.phase === 'body') {
        const bar = tr.song._bars[Math.floor(tr.step / 16) % tr.song._bars.length];
        if (bar && bar.tri) notes = bar.tri.map(m => m + tr.key + A.curShift(tr) + 12);
        while (notes[0] < 70) notes = notes.map(m => m + 12);
      }
      A.voice('lead-bell', A.midi(notes[pads % notes.length]), t, 0.5, 0.16, 0.3, dest);
    } else if (kind === 'tada') A.stinger('treasure');
    dancer.move = kind; dancer.moveT = performance.now();
    for (let i = 0; i < 3; i++) notesUp.push({ x: 0.5 + (Math.random() - 0.5) * 0.5, y: 0.75, vy: 0.25 + Math.random() * 0.2, vx: (Math.random() - 0.5) * 0.15, c: NOTE_COLORS[(pads + i) % 4], born: performance.now() });
    return t;
  }

  // the sound, measured for the jumping bars (an "analyser" listening to the music)
  let an = null, bins = null;
  function listen() {
    if (an || !A.ctx || !A.musicGain) return;
    try {
      an = A.ctx.createAnalyser(); an.fftSize = 64; an.smoothingTimeConstant = 0.7;
      A.musicGain.connect(an);
      bins = new Uint8Array(an.frequencyBinCount);
    } catch (e) { an = null; }
  }
  // where we are in the song: in beats (a beat = 4 sixteenths), smooth between the notes
  function beatNow() {
    const tr = A.track;
    if (!tr || tr.paused || !A.ctx || !playing) return null;
    const six = sixteenth(tr);
    return (tr.step - (tr.next - A.ctx.currentTime) / six) / 4;
  }

  // ---------- the stage (a live picture) ----------
  const SW = 520, SH = 170, PX = 2;                  // board units; drawn at 2 pixels a unit (sharp)
  const stage = document.createElement('canvas');
  stage.width = SW * PX; stage.height = SH * PX;
  const g = stage.getContext('2d');
  const NOTE_COLORS = ['#ffd166', '#ff5fa2', '#4cc9f0', '#06d6a0'];
  const notesUp = [];
  const dancer = { jump: 0, move: null, moveT: 0, spin: 0 };
  let me = null, meImg = null;
  function avatarImg() {
    const p = P.active();
    if (me === p.id && meImg) return meImg;
    me = p.id; meImg = new Image();
    meImg.src = CM ? CM.svgURL(P.avatar(p), 256, 256) : 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(P.avatar(p).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"'));
    return meImg;
  }
  let last = performance.now(), lastBeat = -1;
  function drawStage() {
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    const beat = beatNow(), on = beat != null;
    const ph = on ? beat % 1 : 0;                      // 0 = right on the beat
    const kick = on ? Math.pow(1 - ph, 3) : 0;         // a "thump" that fades after each beat
    if (on && Math.floor(beat) !== lastBeat) {          // a new beat: a note floats up now and then
      lastBeat = Math.floor(beat);
      if (lastBeat % 2 === 0) notesUp.push({ x: 0.15 + Math.random() * 0.7, y: 0.85, vy: 0.18, vx: 0, c: NOTE_COLORS[lastBeat % 4], born: now });
    }
    g.setTransform(PX, 0, 0, PX, 0, 0);
    // the room: dark purple, a wooden stage floor
    const sky = g.createLinearGradient(0, 0, 0, SH);
    sky.addColorStop(0, mix.water ? '#1b4f8a' : '#3b2a8a'); sky.addColorStop(1, mix.water ? '#2a8fc1' : '#5b43b0');
    g.fillStyle = sky; g.fillRect(0, 0, SW, SH);
    // spotlights that sweep with the beat (more and faster at a party)
    const lights = mix.party ? 5 : 3;
    for (let i = 0; i < lights; i++) {
      const a = on ? Math.sin(beat * Math.PI / (mix.party ? 1 : 2) + i * 2.1) * 0.5 : 0;
      const x0 = SW * (i + 0.5) / lights;
      g.save(); g.globalAlpha = on ? 0.18 + 0.12 * kick : 0.08;
      g.fillStyle = NOTE_COLORS[i % 4];
      g.beginPath(); g.moveTo(x0, -10);
      g.lineTo(x0 + Math.sin(a) * 160 - 42, SH - 30); g.lineTo(x0 + Math.sin(a) * 160 + 42, SH - 30); g.closePath(); g.fill();
      g.restore();
    }
    // the floor
    g.fillStyle = '#c68b59'; g.fillRect(0, SH - 34, SW, 34);
    g.strokeStyle = '#2b2b2b'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, SH - 34); g.lineTo(SW, SH - 34); g.stroke();
    g.strokeStyle = 'rgba(43,43,43,0.25)'; g.lineWidth = 2;
    for (let x = 30; x < SW; x += 60) { g.beginPath(); g.moveTo(x, SH - 34); g.lineTo(x - 10, SH); g.stroke(); }
    // the jumping bars (the sound itself), in front of the floor
    let level = 0;
    if (an && on) {
      an.getByteFrequencyData(bins);
      const n = 14, bw = 9, gap = 4;
      for (let i = 0; i < n; i++) {
        const v = bins[Math.min(bins.length - 1, 1 + i * 2)] / 255; level += v / n;
        const hgt = 4 + v * 40;
        for (const side of [0, 1]) {
          const x = side ? SW - 196 + i % 7 * (bw + gap) : 106 + i % 7 * (bw + gap);
          if ((i < 7) !== !side) continue;
          g.fillStyle = NOTE_COLORS[i % 4]; g.strokeStyle = '#2b2b2b'; g.lineWidth = 2.5;
          roundRect(x, SH - 8 - hgt, bw, hgt, 4); g.fill(); g.stroke();
        }
      }
    }
    // two speakers that thump on the beat
    for (const sx of [70, SW - 70]) speaker(sx, SH - 92, 1 + kick * 0.12);
    // the dancer: your animal, bouncing on every beat, leaning one way then the other
    const img = avatarImg();
    dancer.jump = Math.max(0, dancer.jump - dt * 2);
    const moveAge = (now - dancer.moveT) / 1000;
    let bounce = on ? Math.abs(Math.sin(beat * Math.PI)) * (mix.party ? 24 : 16) : 0;
    let lean = on ? Math.sin(beat * Math.PI / 2) * (mix.party ? 0.3 : 0.18) : 0;
    let sx = 1, sy = 1;
    if (on && ph < 0.15) { sx = 1.08; sy = 0.92; }                   // squash when it lands
    if (moveAge < 0.35) {                                             // a pad was hit: a little move
      const k = 1 - moveAge / 0.35;
      if (dancer.move === 'boom') { sx += 0.12 * k; sy -= 0.12 * k; }
      else if (dancer.move === 'clap') bounce += 20 * k;
      else if (dancer.move === 'ding') lean += 0.4 * k;
      else lean -= 0.4 * k;
    }
    dancer.spin = Math.max(0, dancer.spin - dt * 2.2);
    const spinA = dancer.spin > 0 ? (1 - dancer.spin) * Math.PI * 2 : 0;
    const R = 50, cx = SW / 2, cy = SH - 34 - R - bounce - dancer.jump * 20;
    // a shadow on the floor
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(cx, SH - 24, R * (0.9 - bounce / 120), 7, 0, 0, Math.PI * 2); g.fill();
    g.save(); g.translate(cx, cy + R); g.rotate(lean + spinA); g.scale(sx * (dancer.spin > 0 ? Math.cos(spinA) || 0.01 : 1), sy); g.translate(0, -R);
    // little feet tapping, then the animal (its round picture)
    g.fillStyle = '#2b2b2b';
    const step = on ? Math.floor(beat) % 2 : 0;
    g.beginPath(); g.ellipse(-20, R - 2 - (step ? 6 : 0), 12, 7, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(20, R - 2 - (step ? 0 : 6), 12, 7, 0, 0, Math.PI * 2); g.fill();
    if (img.complete && img.naturalWidth) g.drawImage(img, -R, -R, R * 2, R * 2);
    g.lineWidth = 5; g.strokeStyle = '#2b2b2b'; g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.stroke();
    g.restore();
    // asleep while nothing plays: "z z z"
    if (!on) {
      g.fillStyle = '#fff'; g.font = 'bold 22px Arial, sans-serif';
      const z = (now / 900) % 1;
      g.globalAlpha = 1 - z; g.fillText('z', cx + R + 8 + z * 10, cy - 10 - z * 24);
      g.globalAlpha = 1 - ((z + 0.5) % 1); g.fillText('z', cx + R + 22 + ((z + 0.5) % 1) * 10, cy - 24 - ((z + 0.5) % 1) * 24);
      g.globalAlpha = 1;
    }
    // music notes floating up
    for (let i = notesUp.length - 1; i >= 0; i--) {
      const n = notesUp[i], age = (now - n.born) / 1000;
      if (age > 1.6) { notesUp.splice(i, 1); continue; }
      n.y -= n.vy * dt; n.x += n.vx * dt;
      g.globalAlpha = Math.min(1, (1.6 - age) * 2);
      note(n.x * SW + Math.sin(age * 6) * 6, n.y * SH, n.c);
      g.globalAlpha = 1;
    }
    // under water: a few bubbles rising
    if (mix.water) {
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2;
      for (let i = 0; i < 8; i++) { const y = SH - ((now / 30 + i * 47) % SH); g.beginPath(); g.arc(40 + i * 62 + Math.sin(y / 15) * 5, y, 3 + i % 3, 0, Math.PI * 2); g.stroke(); }
    }
    stage.dirty = true;
    stageLevel = level;
  }
  let stageLevel = 0;
  function roundRect(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function speaker(x, y, k) {
    g.save(); g.translate(x, y + 29); g.scale(k, k); g.translate(0, -29);
    g.fillStyle = '#4a3f6b'; g.strokeStyle = '#2b2b2b'; g.lineWidth = 3.5;
    roundRect(-26, -24, 52, 82, 8); g.fill(); g.stroke();
    for (const [yy, r] of [[-6, 10], [32, 16]]) {
      g.fillStyle = '#2b2b2b'; g.beginPath(); g.arc(0, yy, r, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#8a7fb0'; g.beginPath(); g.arc(0, yy, r * 0.4, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }
  function note(x, y, c) {
    g.fillStyle = c; g.strokeStyle = '#2b2b2b'; g.lineWidth = 2;
    g.beginPath(); g.ellipse(x, y, 6, 4.5, -0.4, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x + 5, y - 2); g.lineTo(x + 5, y - 18); g.lineTo(x + 12, y - 13); g.stroke();
  }
  // keep the stage moving (requestAnimationFrame; also a slow timer, so it still works in a background tab test)
  function loop() { drawStage(); requestAnimationFrame(loop); }

  // ---------- the screen ----------
  const tap = (fn) => () => { A.resume(); fn(); };
  function screen() {
    const wide = innerWidth >= innerHeight;
    const padTiles = { t: 'tiles', w: wide ? 104 : 86, h: wide ? 74 : 70, items: [
      { pic: PIC.boom, name: '', fill: true, attr: 'pad-boom', label: 'Drum', color: '#ffd6e0', onTap: tap(() => pad('boom')) },
      { pic: PIC.clap, name: '', fill: true, attr: 'pad-clap', label: 'Clap', color: '#fff3c4', onTap: tap(() => pad('clap')) },
      { pic: PIC.ding, name: '', fill: true, attr: 'pad-ding', label: 'Bell', color: '#d8f8e1', onTap: tap(() => pad('ding')) },
      { pic: PIC.tada, name: '', fill: true, attr: 'pad-tada', label: 'Ta-da', color: '#e2dcff', onTap: tap(() => pad('tada')) },
    ] };
    const stageRow = (w) => ({ t: 'live', canvas: stage, w, attr: 'stage', label: 'Dancer',
      onTap: () => { A.resume(); dancer.spin = 1; Arcade.sfx('whoosh'); } });
    // the stage + pads: side by side when the screen is wide, the pads in one row under it when upright
    const top = wide
      ? { t: 'cols', keep: true, gap: 10, cols: [{ w: 520, rows: [stageRow(520)] }, { w: 230, rows: [padTiles] }] }
      : [stageRow(440), padTiles];
    const mixBtn = (key, pic, label, other) => ({ icon: pic, label: '', attr: 'mix-' + key, picked: mix[key],
      onTap: tap(() => {
        mix[key] = !mix[key]; if (other && mix[key]) mix[other] = false;
        applyMix(); Arcade.sfx(mix[key] ? 'pop' : 'click'); screen();
      }) });
    const mixes = [mixBtn('slow', PIC.turtle, 'Slow', 'fast'), mixBtn('fast', PIC.rabbit, 'Fast', 'slow'), mixBtn('high', PIC.high, 'High'),
      mixBtn('party', PIC.party, 'Party'), mixBtn('water', PIC.water, 'Under water')];
    const rows = [
      // (sideways: round buttons; upright 5 round ones don't fit on one line, so they're square tiles there)
      wide ? { t: 'round', items: mixes }
        : { t: 'tiles', w: 70, h: 70, items: mixes.map(m => ({ pic: m.icon, name: '', fill: true, attr: m.attr, label: m.attr, picked: m.picked, color: '#ffffff', onTap: m.onTap })) },
      { t: 'tiles', w: wide ? 92 : 96, h: wide ? 92 : 96, items: SONGS.map(s => ({
        pic: songPic(s), name: '', fill: true, attr: 'song-' + s.game + '-' + s.n, label: s.game + ' ' + s.n,
        picked: playing === s, color: Arcade.mixWhite(COLORS[s.game] || '#ffffff', 0.55),
        onTap: tap(() => { if (playing === s) return; playSong(s); screen(); }) })) },
    ];
    let footer = { t: 'buttons', items: [
      { icon: Arcade.icons.home, label: '', attr: 'home', color: 'white', minW: 100, onTap: tap(() => { Arcade.sfx('click'); stopSong(); setTimeout(() => { location.href = '../index.html'; }, 150); }) },
      { icon: PIC.stop, label: '', attr: 'stop', color: playing ? 'pink' : 'white', minW: 100, onTap: tap(() => { stopSong(); Arcade.sfx('click'); screen(); }) },
      { icon: PIC.dice, label: '', attr: 'dice', color: 'yellow', minW: 100, onTap: tap(() => {
        const others = SONGS.filter(s => s !== playing);
        playSong(others[Math.floor(Math.random() * others.length)]); Arcade.sfx('pop'); screen();
      }) },
    ] };
    // Sideways the screen is short: the mix buttons join home / stop / dice in the bar at the bottom (one row of
    // round buttons), so the songs get all the room in the middle.
    if (wide) {
      rows.shift();
      footer = { t: 'round', items: footer.items.map(b => ({ icon: b.icon, label: '', attr: b.attr, onTap: b.onTap })).concat(mixes) };
    }
    CM.open({ id: 'jukebox', tab: playing ? playing.game + playing.n : '-', top, rows, footer,
      onKey: (code) => {
        if (code === 'Escape') location.href = '../index.html';
        else if (code === 'Space') pad('boom');
      } });
  }

  // ---------- the plain HTML fallback (no Phaser): just the songs ----------
  function fallback() {
    const box = document.getElementById('fallback');
    const home = document.createElement('button');
    home.innerHTML = Arcade.icons.home; home.setAttribute('aria-label', 'Home'); home.style.background = '#fff';
    home.onclick = () => { location.href = '../index.html'; };
    box.appendChild(home);
    for (const s of SONGS) {
      const b = document.createElement('button');
      b.innerHTML = songPic(s); b.style.background = Arcade.mixWhite(COLORS[s.game] || '#fff', 0.55);
      b.setAttribute('aria-label', s.game + ' ' + s.n);
      b.onclick = () => playSong(s);
      box.appendChild(b);
    }
  }

  if (CM) { document.body.classList.add('cm'); screen(); }
  else fallback();
  loop();
  // when the phone is turned, the stage and pads move (side by side <-> one under the other)
  let wasWide = innerWidth >= innerHeight, againT = 0;
  addEventListener('resize', () => { clearTimeout(againT); againT = setTimeout(() => {
    const w = innerWidth >= innerHeight; if (CM && w !== wasWide) screen(); wasWide = w; }, 200); });

  // test hook
  window.__jukebox = () => ({
    songs: SONGS.length, playing: playing ? playing.game + '-' + playing.n : null,
    track: !!(A.track && playing && A.track.song === playing.song), beat: beatNow(), level: stageLevel,
    mix: Object.assign({}, mix), mood: Object.assign({}, A.mood), pads, screen: CM && CM.isOpen ? CM.screen() : '',
    musicVol: A.musicGain ? A.musicGain.gain.value : null, spin: dancer.spin,
  });
  window.__jukeboxPad = pad;       // (tests: hit a pad, get back when it plays)
})();
