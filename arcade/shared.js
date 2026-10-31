// =====================================================================
// Arcade kit — shared by every game in the arcade.
//
// A game page loads ../css/style.css, ../arcade/shared.css and this file,
// then calls Arcade.start({...}) with its own setup / update / draw.
// The kit takes care of everything games have in common:
//
//   * a steady game loop (fixed 1/120 s steps, so physics is the same on
//     every device) that stops while a menu is open or the tab is hidden
//   * a letterboxed canvas: the game always draws in its own "view" size
//     (e.g. 960 x 540) and the kit scales it to fit any screen
//   * keyboard, mouse and touch input (+ big on-screen buttons on tablets)
//   * Easy / Normal / Challenge difficulty
//   * pause / resume / restart, back to the arcade
//   * how-to-play intro, level picker, results screen with stars & medals
//   * sound effects and chiptune music made in the browser (no files),
//     with volume sliders and mute
//   * saving progress, best scores, medals and unlocks on this device
//   * particles and a few drawing helpers
//
// See bike/bike.js for a complete example game.
// =====================================================================
(function () {
  'use strict';

  const STEP = 1 / 120;          // physics step in seconds
  const SAVE_KEY = 'kidsArcade.v1';

  // ------------------------------------------------------------------
  // Saving (localStorage, wrapped so the game still works without it)
  // ------------------------------------------------------------------
  const store = {
    data: null,
    load() {
      if (this.data) return this.data;
      let d = null;
      try { d = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { d = null; }
      this.data = Object.assign({ settings: {}, games: {} }, d || {});
      this.data.settings = Object.assign(
        { difficulty: 'normal', sfx: 0.8, music: 0.4, muted: false }, this.data.settings);
      return this.data;
    },
    save() {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) { /* private mode etc. */ }
    },
    settings() { return this.load().settings; },
    // Per-game record: { levels: {id: {score, stars, medal, time}}, best, unlocked: [], data: {} }
    game(id) {
      const g = this.load().games;
      g[id] = Object.assign({ levels: {}, best: 0, unlocked: [], data: {}, achievements: [] }, g[id] || {});
      return g[id];
    },
  };

  const MEDAL_RANK = { bronze: 1, silver: 2, gold: 3 };

  // ------------------------------------------------------------------
  // Sound: tiny synthesizer + music loops (Web Audio, made on the fly)
  // ------------------------------------------------------------------
  const audio = {
    ctx: null, master: null, sfxGain: null, musicGain: null,
    ensure() {
      if (this.ctx) return this.ctx;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain.connect(this.master);
        this.musicGain.connect(this.master);
        this.master.connect(this.ctx.destination);
        this.applyVolumes();
      } catch (e) { this.ctx = null; }
      return this.ctx;
    },
    applyVolumes() {
      if (!this.ctx) return;
      const s = store.settings();
      this.master.gain.value = s.muted ? 0 : 1;
      this.sfxGain.gain.value = s.sfx * 0.5;
      this.musicGain.gain.value = s.music * 0.25;
    },
    resume() { const c = this.ensure(); if (c && c.state === 'suspended') c.resume(); },

    // One note. freq in Hz, len in seconds; slide = end frequency.
    tone(freq, len = 0.15, opts = {}) {
      const c = this.ensure(); if (!c) return;
      const t = c.currentTime + (opts.delay || 0);
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = opts.type || 'square';
      o.frequency.setValueAtTime(freq, t);
      if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slide), t + len);
      const v = opts.vol == null ? 0.3 : opts.vol;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g).connect(opts.music ? this.musicGain : this.sfxGain);
      o.start(t); o.stop(t + len + 0.02);
    },
    // Short burst of noise (crashes, splashes, whooshes).
    noise(len = 0.25, opts = {}) {
      const c = this.ensure(); if (!c) return;
      const t = c.currentTime + (opts.delay || 0);
      const n = Math.floor(c.sampleRate * len);
      const buf = c.createBuffer(1, n, c.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      src.buffer = buf;
      const f = c.createBiquadFilter();
      f.type = opts.filter || 'lowpass';
      f.frequency.value = opts.freq || 1200;
      const g = c.createGain();
      g.gain.setValueAtTime(opts.vol == null ? 0.3 : opts.vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      src.connect(f).connect(g).connect(this.sfxGain);
      src.start(t);
    },
    // Ready-made sound effects. Games call Arcade.sfx('jump') etc.
    sfx(name) {
      const T = (f, l, o) => this.tone(f, l, o);
      switch (name) {
        case 'click':  T(660, 0.06, { type: 'triangle', vol: 0.25 }); break;
        case 'jump':   T(300, 0.18, { slide: 700, type: 'square', vol: 0.18 }); break;
        case 'spring': T(250, 0.3, { slide: 1100, type: 'triangle', vol: 0.3 }); break;
        case 'coin':   T(988, 0.08, { vol: 0.18 }); T(1319, 0.2, { delay: 0.07, vol: 0.18 }); break;
        case 'star':   [784, 988, 1175, 1568].forEach((f, i) => T(f, 0.12, { delay: i * 0.05, type: 'triangle', vol: 0.25 })); break;
        case 'pop':    T(500, 0.08, { slide: 1200, type: 'sine', vol: 0.35 }); this.noise(0.06, { freq: 3000, vol: 0.15 }); break;
        case 'hit':    T(200, 0.15, { slide: 90, type: 'square', vol: 0.2 }); break;
        case 'bonk':   T(180, 0.12, { slide: 120, type: 'triangle', vol: 0.35 }); break;
        case 'crash':  this.noise(0.45, { freq: 900, vol: 0.4 }); T(160, 0.35, { slide: 50, type: 'sawtooth', vol: 0.15 }); break;
        case 'shoot':  T(880, 0.09, { slide: 440, type: 'square', vol: 0.12 }); break;
        case 'zap':    T(1200, 0.12, { slide: 300, type: 'sawtooth', vol: 0.12 }); break;
        case 'boost':  T(200, 0.4, { slide: 900, type: 'sawtooth', vol: 0.15 }); break;
        case 'power':  [523, 659, 784, 1047, 1319].forEach((f, i) => T(f, 0.1, { delay: i * 0.04, type: 'square', vol: 0.14 })); break;
        case 'swish':  this.noise(0.3, { filter: 'bandpass', freq: 2500, vol: 0.25 }); break;
        case 'splash': this.noise(0.5, { filter: 'bandpass', freq: 1400, vol: 0.35 }); T(400, 0.2, { slide: 150, type: 'sine', vol: 0.15 }); break;
        case 'whoosh': this.noise(0.25, { filter: 'highpass', freq: 1800, vol: 0.18 }); break;
        case 'tick':   T(1500, 0.03, { type: 'square', vol: 0.08 }); break;
        case 'beep':   T(880, 0.12, { type: 'square', vol: 0.15 }); break;
        case 'go':     T(1320, 0.35, { type: 'square', vol: 0.18 }); break;
        case 'win':    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => T(f, 0.18, { delay: i * 0.12, type: 'square', vol: 0.16 })); break;
        case 'aww':    T(392, 0.25, { slide: 330, type: 'triangle', vol: 0.25 }); T(330, 0.4, { delay: 0.25, slide: 262, type: 'triangle', vol: 0.25 }); break;
        case 'unlock': [659, 784, 988, 1319].forEach((f, i) => T(f, 0.16, { delay: i * 0.09, type: 'triangle', vol: 0.25 })); break;
        default: T(440, 0.1);
      }
    },

    // ---- Music: simple looping chiptune songs ----
    songs: {
      // [tempo (beats/min), bass notes, lead notes]; one note per eighth; 0 = rest
      happy: [132, [48, 0, 55, 0, 52, 0, 55, 0, 53, 0, 57, 0, 55, 0, 52, 0],
                   [72, 76, 79, 76, 77, 0, 74, 0, 72, 76, 79, 84, 79, 0, 0, 0]],
      race:  [160, [45, 45, 52, 45, 47, 47, 54, 47, 48, 48, 55, 48, 50, 50, 57, 50],
                   [69, 0, 72, 74, 76, 0, 74, 72, 71, 0, 74, 76, 79, 76, 74, 0]],
      calm:  [84,  [48, 0, 0, 0, 53, 0, 0, 0, 50, 0, 0, 0, 55, 0, 0, 0],
                   [76, 0, 79, 0, 81, 0, 79, 0, 77, 0, 76, 0, 74, 0, 0, 0]],
      space: [120, [40, 0, 40, 47, 43, 0, 43, 50, 45, 0, 45, 52, 43, 0, 47, 0],
                   [64, 67, 71, 74, 72, 0, 71, 67, 69, 72, 76, 0, 74, 71, 67, 0]],
      jungle:[140, [43, 0, 50, 43, 45, 0, 52, 45, 48, 0, 55, 48, 50, 0, 47, 0],
                   [67, 71, 74, 0, 72, 69, 0, 72, 76, 0, 74, 72, 71, 67, 69, 71]],
    },
    musicTimer: null,
    play(name) {
      this.stop();
      const song = this.songs[name]; if (!song) return;
      const c = this.ensure(); if (!c) return;
      const [tempo, bass, lead] = song;
      const eighth = 60 / tempo / 2;
      let step = 0;
      let next = c.currentTime + 0.1;
      const midi = n => 440 * Math.pow(2, (n - 69) / 12);
      // schedule a little ahead of time so the music never stutters
      this.musicTimer = setInterval(() => {
        while (next < c.currentTime + 0.3) {
          const i = step % bass.length;
          const d = next - c.currentTime;
          if (bass[i]) this.tone(midi(bass[i]), eighth * 1.6, { type: 'triangle', vol: 0.5, delay: d, music: true });
          if (lead[i]) this.tone(midi(lead[i]), eighth * 0.9, { type: 'square', vol: 0.22, delay: d, music: true });
          step++; next += eighth;
        }
      }, 60);
    },
    stop() { clearInterval(this.musicTimer); this.musicTimer = null; },
  };

  // ------------------------------------------------------------------
  // Particles (confetti, sparkles, dust, splashes)
  // ------------------------------------------------------------------
  const PARTY = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#9b5de5', '#f15bb5', '#ff8c42'];
  class Particles {
    constructor() { this.list = []; }
    burst(x, y, o = {}) {
      const n = o.count || 16;
      for (let i = 0; i < n; i++) {
        const a = o.angle != null ? o.angle + (Math.random() - 0.5) * (o.spread || 1) : Math.random() * Math.PI * 2;
        const sp = (o.speed || 220) * (0.4 + Math.random() * 0.8);
        const colors = o.colors || PARTY;
        this.list.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: (o.life || 0.9) * (0.6 + Math.random() * 0.6), age: 0,
          size: (o.size || 8) * (0.6 + Math.random() * 0.8),
          color: colors[(Math.random() * colors.length) | 0],
          g: o.gravity == null ? 500 : o.gravity,
          shape: o.shape || 'circle', spin: (Math.random() - 0.5) * 10, rot: Math.random() * 6,
        });
      }
    }
    update(dt) {
      for (const p of this.list) {
        p.age += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.spin * dt;
        p.vx *= 0.99;
      }
      this.list = this.list.filter(p => p.age < p.life);
    }
    draw(ctx) {
      for (const p of this.list) {
        const k = 1 - p.age / p.life;
        ctx.save();
        ctx.globalAlpha = Math.min(1, k * 1.5);
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === 'star') { draw.starPath(ctx, 0, 0, p.size, p.size * 0.45); ctx.fill(); }
        else if (p.shape === 'square') ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2 * (0.4 + 0.6 * k), 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
    }
  }

  // ------------------------------------------------------------------
  // Drawing helpers
  // ------------------------------------------------------------------
  const INK = '#2b2b2b';
  const draw = {
    INK,
    rr(ctx, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    },
    // filled + outlined rounded box
    box(ctx, x, y, w, h, r, fill, line = 4) {
      this.rr(ctx, x, y, w, h, r);
      ctx.fillStyle = fill; ctx.fill();
      if (line) { ctx.lineWidth = line; ctx.strokeStyle = INK; ctx.stroke(); }
    },
    circle(ctx, x, y, r, fill, line = 4) {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (line) { ctx.lineWidth = line; ctx.strokeStyle = INK; ctx.stroke(); }
    },
    starPath(ctx, x, y, R, r, n = 5) {
      ctx.beginPath();
      for (let i = 0; i < n * 2; i++) {
        const a = -Math.PI / 2 + Math.PI * i / n;
        const rr = i % 2 ? r : R;
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.closePath();
    },
    star(ctx, x, y, R, fill = '#ffd166', line = 3) {
      this.starPath(ctx, x, y, R, R * 0.48);
      ctx.fillStyle = fill; ctx.fill();
      if (line) { ctx.lineWidth = line; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.stroke(); }
    },
    // Chunky outlined text (HUD numbers, "GO!")
    text(ctx, str, x, y, o = {}) {
      ctx.save();
      ctx.font = `800 ${o.size || 28}px "Comic Sans MS", "Chalkboard SE", "Trebuchet MS", sans-serif`;
      ctx.textAlign = o.align || 'center';
      ctx.textBaseline = o.base || 'middle';
      ctx.lineJoin = 'round';
      if (o.stroke !== false) { ctx.lineWidth = o.lineWidth || Math.max(4, (o.size || 28) / 5); ctx.strokeStyle = o.stroke || INK; ctx.strokeText(str, x, y); }
      ctx.fillStyle = o.color || '#fff';
      ctx.fillText(str, x, y);
      ctx.restore();
    },
    // A horizontal meter (heat, power, health)
    meter(ctx, x, y, w, h, frac, color, bg = '#fff') {
      this.box(ctx, x, y, w, h, h / 2, bg, 4);
      const f = Math.max(0, Math.min(1, frac));
      if (f > 0) { ctx.save(); this.rr(ctx, x, y, w, h, h / 2); ctx.clip(); ctx.fillStyle = color; ctx.fillRect(x, y, w * f, h); ctx.restore(); this.rr(ctx, x, y, w, h, h / 2); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
    },
  };

  // ------------------------------------------------------------------
  // Little SVG icons used by the menus (no text needed to understand them)
  // ------------------------------------------------------------------
  const S = (inner, vb = '0 0 48 48') => `<svg viewBox="${vb}" aria-hidden="true">${inner}</svg>`;
  const L = 'fill="none" stroke="#2b2b2b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"';
  const icons = {
    home: S(`<path d="M6 24 L24 8 L42 24 M12 20 V40 H36 V20" ${L}/><rect x="20" y="28" width="8" height="12" fill="#ef476f"/>`),
    pause: S(`<rect x="12" y="10" width="8" height="28" rx="3" fill="#2b2b2b"/><rect x="28" y="10" width="8" height="28" rx="3" fill="#2b2b2b"/>`),
    play: S(`<path d="M16 9 L38 24 L16 39 Z" fill="#2b2b2b" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/>`),
    again: S(`<path d="M38 24 A14 14 0 1 1 30 11" ${L}/><path d="M24 6 L33 11 L26 19" ${L}/>`),
    next: S(`<path d="M14 8 L32 24 L14 40" ${L} stroke-width="7"/>`),
    menu: S(`<rect x="6" y="6" width="15" height="15" rx="4" fill="#ffd166" stroke="#2b2b2b" stroke-width="4"/><rect x="27" y="6" width="15" height="15" rx="4" fill="#06d6a0" stroke="#2b2b2b" stroke-width="4"/><rect x="6" y="27" width="15" height="15" rx="4" fill="#118ab2" stroke="#2b2b2b" stroke-width="4"/><rect x="27" y="27" width="15" height="15" rx="4" fill="#ef476f" stroke="#2b2b2b" stroke-width="4"/>`),
    sound: S(`<path d="M8 18 H16 L26 9 V39 L16 30 H8 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><path d="M32 16 Q38 24 32 32 M36 11 Q46 24 36 37" ${L} stroke-width="4"/>`),
    music: S(`<path d="M18 36 V12 L38 8 V32" ${L} stroke-width="4"/><circle cx="14" cy="36" r="6" fill="#9b5de5" stroke="#2b2b2b" stroke-width="4"/><circle cx="34" cy="32" r="6" fill="#9b5de5" stroke="#2b2b2b" stroke-width="4"/>`),
    mute: S(`<path d="M8 18 H16 L26 9 V39 L16 30 H8 Z" fill="#ccc" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><path d="M32 18 L42 30 M42 18 L32 30" ${L} stroke-width="4"/>`),
    lock: S(`<rect x="10" y="22" width="28" height="20" rx="5" fill="#ffd166" stroke="#2b2b2b" stroke-width="4"/><path d="M16 22 V15 A8 8 0 0 1 32 15 V22" ${L} stroke-width="4"/>`),
    star: (on = true) => S(`<path d="M24 4 L30 17 L44 18 L33 28 L37 43 L24 35 L11 43 L15 28 L4 18 L18 17 Z" fill="${on ? '#ffd166' : '#e8e2d4'}" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/>`),
    medal: (kind) => {
      const c = { gold: '#ffc93c', silver: '#c9d6df', bronze: '#e09f5a' }[kind] || '#eee';
      return S(`<path d="M16 4 L24 20 L32 4" fill="#ef476f" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/><path d="M22 4 L24 20 L26 4" fill="#118ab2"/><circle cx="24" cy="31" r="14" fill="${c}" stroke="#2b2b2b" stroke-width="3.5"/><path d="M24 23 L26.5 28.5 L32 29 L28 33 L29 38.5 L24 35.5 L19 38.5 L20 33 L16 29 L21.5 28.5 Z" fill="#fff" opacity="0.85"/>`);
    },
    trophy: S(`<path d="M14 6 H34 V18 A10 10 0 0 1 14 18 Z" fill="#ffc93c" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><path d="M14 10 H6 Q6 22 16 22 M34 10 H42 Q42 22 32 22" ${L} stroke-width="4"/><path d="M24 28 V36 M16 42 H32" ${L}/>`),
    rotate: S(`<rect x="14" y="6" width="20" height="36" rx="4" fill="#fff" stroke="#2b2b2b" stroke-width="4"/><circle cx="24" cy="36" r="2" fill="#2b2b2b"/>`),
    left: S(`<path d="M30 8 L14 24 L30 40" ${L} stroke-width="7"/>`),
    right: S(`<path d="M18 8 L34 24 L18 40" ${L} stroke-width="7"/>`),
    up: S(`<path d="M8 30 L24 14 L40 30" ${L} stroke-width="7"/>`),
    down: S(`<path d="M8 18 L24 34 L40 18" ${L} stroke-width="7"/>`),
    // generic "A"/"B" action buttons for the touch pad
    jump: S(`<path d="M24 6 L24 34 M12 18 L24 6 L36 18" ${L} stroke-width="6"/><ellipse cx="24" cy="42" rx="12" ry="3" fill="#2b2b2b"/>`),
    fire: S(`<circle cx="24" cy="24" r="14" fill="#ffd166" stroke="#2b2b2b" stroke-width="4"/><circle cx="24" cy="24" r="6" fill="#ef476f"/>`),
    gas: S(`<path d="M6 18 H26 V8 L44 24 L26 40 V30 H6 Z" fill="#06d6a0" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/>`),
    brake: S(`<rect x="10" y="12" width="28" height="24" rx="6" fill="#ef476f" stroke="#2b2b2b" stroke-width="4"/><path d="M18 24 H30" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`),
    turbo: S(`<path d="M4 12 L18 24 L4 36 Z M18 10 L34 24 L18 38 Z" fill="#ff8c42" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><path d="M36 10 L44 24 L36 38" fill="none" stroke="#ef476f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`),
  };

  // ------------------------------------------------------------------
  // DOM helpers
  // ------------------------------------------------------------------
  function h(tag, attrs = {}, html = '') {
    const e = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    if (html) e.innerHTML = html;
    return e;
  }
  function button(icon, label, cls, onClick) {
    return h('button', { class: 'ar-btn ' + (cls || ''), type: 'button', onclick: () => { audio.sfx('click'); onClick(); } },
      (icon || '') + (label ? `<span>${label}</span>` : ''));
  }
  function starsHTML(n, max = 3) {
    let s = '<span class="ar-stars">';
    for (let i = 0; i < max; i++) s += icons.star(i < n);
    return s + '</span>';
  }

  let toastTimer = null;
  function toast(html, icon = icons.trophy) {
    let t = document.querySelector('.ar-toast');
    if (!t) { t = h('div', { class: 'ar-toast' }); document.body.appendChild(t); }
    t.innerHTML = icon + '<span>' + html + '</span>';
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // Full-screen confetti for celebrations (its own little canvas + loop)
  function confetti(amount = 120) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = h('canvas', { class: 'ar-confetti' });
    document.body.appendChild(c);
    const ctx = c.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);
    const p = new Particles();
    for (let i = 0; i < amount; i++) {
      p.burst(Math.random() * innerWidth, -20, { count: 1, angle: Math.PI / 2, spread: 1.2, speed: 260, life: 3, size: 14, gravity: 300, shape: Math.random() < 0.5 ? 'square' : 'star' });
    }
    let last = performance.now();
    (function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      p.update(dt);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      p.draw(ctx);
      if (p.list.length) requestAnimationFrame(frame); else c.remove();
    })(last);
  }

  // ------------------------------------------------------------------
  // Arcade.start(config) — runs one game
  // ------------------------------------------------------------------
  // config = {
  //   id: 'bike', title: 'Turbo Bike Challenge',
  //   view: { w: 960, h: 540 },          // the game's drawing size
  //   background: '#87ceeb',             // page color around the game
  //   music: 'race',                     // song while playing (optional)
  //   howTo: [ { pic: '<svg>', text: 'Go!', keys: 'Right arrow' }, ... ],
  //   buttons: { left: [ {id:'ArrowUp', icon: Arcade.icons.up}, ...], right: [...] },
  //   levels: () => [ { id, name, pic, locked, meta } ],   // optional level picker
  //   setup(g, level),    // (re)build the game for a level  (called on start + restart)
  //   update(g, dt),      // move things; dt is always 1/120 s
  //   draw(g, ctx),       // paint everything in view coordinates
  //   onPause(g), onResume(g)  // optional
  // }
  function start(config) {
    const settings = store.settings();
    const save = store.game(config.id);
    document.body.classList.add('ar-game');
    if (config.background) document.body.style.setProperty('--ar-bg', config.background);
    const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    if (isTouch) document.body.classList.add('ar-touch');

    // ---- page structure ----
    const stage = h('div', { class: 'ar-stage' });
    const canvas = h('canvas');
    stage.appendChild(canvas);
    document.body.appendChild(stage);
    const ctx = canvas.getContext('2d');

    const back = h('a', { class: 'round-btn ar-corner ar-back', href: config.home || '../index.html', 'aria-label': 'Back to arcade' }, icons.home);
    const pauseBtn = h('button', { class: 'round-btn ar-corner ar-pause', type: 'button', 'aria-label': 'Pause' }, icons.pause);
    document.body.append(back, pauseBtn);
    const rotateHint = h('div', { class: 'ar-rotate' }, icons.rotate + '<span>Turn me sideways!</span>');
    if (config.view.w > config.view.h) document.body.appendChild(rotateHint);

    const overlay = h('div', { class: 'ar-overlay' });
    document.body.appendChild(overlay);

    // ---- the game object handed to setup/update/draw ----
    const g = {
      W: config.view.w, H: config.view.h,
      ctx, canvas,
      difficulty: settings.difficulty,          // 'easy' | 'normal' | 'challenge'
      level: null,                              // the level object chosen in the picker
      time: 0,                                  // seconds of play since setup
      state: 'menu',                            // 'menu' | 'play' | 'paused' | 'over'
      particles: new Particles(),               // drawn on top of the game automatically
      save,                                     // this game's saved record (persisted by g.store())
      input: null,
      // pick a value by difficulty: g.pick(easy, normal, challenge)
      pick(e, n, c) { return { easy: e, normal: n, challenge: c }[this.difficulty]; },
      store() { store.save(); },
      sfx: (n) => audio.sfx(n),
      tone: (f, l, o) => audio.tone(f, l, o),
      toast,
      unlock(key, label) {
        if (save.unlocked.includes(key)) return false;
        save.unlocked.push(key); store.save();
        audio.sfx('unlock');
        toast('New: ' + label, icons.lock);
        return true;
      },
      isUnlocked(key) { return save.unlocked.includes(key); },
      achieve(key, label) {
        if (save.achievements.includes(key)) return;
        save.achievements.push(key); store.save();
        toast(label);
      },
      finish: (result) => finish(result),
      play: (lv) => startLevel(lv),          // start a level right away (e.g. a custom one)
      panel: (el) => show(el),               // show a game's own menu panel
      hidePanel: () => hide(),
      pause: () => pause(),
      restart: () => restart(),
      menu: () => showLevels(),
    };

    // ---- input ----
    const input = {
      keys: new Set(), pressed: new Set(),
      pointer: { x: 0, y: 0, down: false, startX: 0, startY: 0, justDown: false, justUp: false, id: null },
      down(...codes) { return codes.some(c => this.keys.has(c)); },
      // true once per key press
      hit(...codes) { const k = codes.find(c => this.pressed.has(c)); if (k) { this.pressed.delete(k); return true; } return false; },
    };
    g.input = input;
    const GAME_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space']);
    addEventListener('keydown', (e) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (g.state === 'play') pause(); else if (g.state === 'paused') resume();
        return;
      }
      if (GAME_KEYS.has(e.code)) e.preventDefault();
      if (!input.keys.has(e.code)) input.pressed.add(e.code);
      input.keys.add(e.code);
      audio.resume();
    });
    addEventListener('keyup', (e) => input.keys.delete(e.code));
    addEventListener('blur', () => input.keys.clear());

    // pointer in view coordinates
    let scale = 1, offX = 0, offY = 0;
    function toView(e) {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
    }
    canvas.addEventListener('pointerdown', (e) => {
      audio.resume();
      if (input.pointer.id !== null && input.pointer.id !== e.pointerId) return;
      const p = toView(e);
      Object.assign(input.pointer, { x: p.x, y: p.y, startX: p.x, startY: p.y, down: true, justDown: true, id: e.pointerId });
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (input.pointer.id !== null && e.pointerId !== input.pointer.id) return;
      const p = toView(e); input.pointer.x = p.x; input.pointer.y = p.y;
    });
    const up = (e) => {
      if (e.pointerId !== input.pointer.id) return;
      const p = toView(e); input.pointer.x = p.x; input.pointer.y = p.y;
      input.pointer.down = false; input.pointer.justUp = true; input.pointer.id = null;
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);

    // On-screen touch buttons press "virtual keys", so games only check keys.
    if (config.buttons) {
      for (const side of ['left', 'right']) {
        const pad = h('div', { class: 'ar-pad ' + side });
        for (const b of config.buttons[side] || []) {
          const el = h('button', { type: 'button', 'aria-label': b.label || b.id }, b.icon);
          const press = (e) => { e.preventDefault(); audio.resume(); el.classList.add('down'); if (!input.keys.has(b.id)) input.pressed.add(b.id); input.keys.add(b.id); };
          const release = (e) => { e.preventDefault(); el.classList.remove('down'); input.keys.delete(b.id); };
          el.addEventListener('pointerdown', press);
          el.addEventListener('pointerup', release);
          el.addEventListener('pointercancel', release);
          el.addEventListener('pointerleave', release);
          pad.appendChild(el);
        }
        document.body.appendChild(pad);
      }
    }

    // ---- sizing: letterbox the view into the window ----
    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const availW = innerWidth - 8, availH = innerHeight - 8;
      scale = Math.min(availW / g.W, availH / g.H);
      const cssW = Math.floor(g.W * scale), cssH = Math.floor(g.H * scale);
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
      offX = (innerWidth - cssW) / 2; offY = (innerHeight - cssH) / 2;
      const tall = innerHeight > innerWidth * 1.1 && config.view.w > config.view.h && innerWidth < 900;
      document.body.classList.toggle('ar-tall', tall);
      drawFrame();
    }
    addEventListener('resize', resize);
    addEventListener('orientationchange', () => setTimeout(resize, 200));

    // ---- the loop ----
    let acc = 0, last = performance.now(), raf = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (g.state === 'play') {
        acc += dt;
        while (acc >= STEP) {
          g.time += STEP;
          config.update(g, STEP);
          g.particles.update(STEP);
          input.pointer.justDown = false;
          input.pointer.justUp = false;
          acc -= STEP;
          if (g.state !== 'play') { acc = 0; break; }
        }
        input.pressed.clear();
      } else if (g.state === 'over') {
        g.particles.update(dt); // let the last sparkles finish
      }
      drawFrame();
    }
    function drawFrame() {
      ctx.save();
      config.draw(g, ctx);
      g.particles.draw(ctx);
      ctx.restore();
    }

    // ---- menus ----
    function show(panel) {
      overlay.innerHTML = '';
      overlay.appendChild(panel);
      overlay.classList.add('show');
    }
    function hide() { overlay.classList.remove('show'); overlay.innerHTML = ''; }

    function diffPicker(onChange) {
      const wrap = h('div', { class: 'ar-diff' });
      const opts = [['easy', 'Easy', '●'], ['normal', 'Normal', '●●'], ['challenge', 'Challenge', '●●●']];
      for (const [k, label, dots] of opts) {
        const b = h('button', { type: 'button', class: k === g.difficulty ? 'on' : '' }, `<span class="dots">${dots}</span>${label}`);
        b.addEventListener('click', () => {
          audio.sfx('click');
          g.difficulty = settings.difficulty = k; store.save();
          wrap.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
          if (onChange) onChange(k);
        });
        wrap.appendChild(b);
      }
      return wrap;
    }

    function howToPanel(then) {
      const p = h('div', { class: 'ar-panel wide' });
      p.appendChild(h('h1', { class: 'ar-title' }, config.title));
      const steps = h('div', { class: 'ar-steps' });
      for (const s of config.howTo || []) {
        steps.appendChild(h('div', { class: 'ar-step' },
          `<div class="pic">${s.pic}</div><div>${s.text}</div>` + (s.keys ? `<div class="keys">${s.keys}</div>` : '')));
      }
      p.appendChild(steps);
      p.appendChild(diffPicker());
      const btns = h('div', { class: 'ar-btns' });
      btns.appendChild(button(icons.play, 'Play!', 'big', then));
      p.appendChild(btns);
      return p;
    }

    // Level picker (only for games that have levels)
    function showLevels() {
      stopPlay();
      g.state = 'menu';
      if (!config.levels) { startLevel(null); return; }
      const p = h('div', { class: 'ar-panel wide' });
      p.appendChild(h('h1', { class: 'ar-title' }, config.levelsTitle || 'Pick a level'));
      const grid = h('div', { class: 'ar-grid' });
      for (const lv of config.levels(g)) {
        const rec = save.levels[lv.id] || {};
        const tile = h('button', { type: 'button', class: 'ar-tile' + (lv.locked ? ' locked' : '') },
          `<div class="pic">${lv.pic || ''}</div><div>${lv.name}</div>` +
          `<div class="meta">${lv.meta != null ? lv.meta : (rec.medal ? icons.medal(rec.medal).replace('<svg', '<svg style="width:26px;height:26px;vertical-align:middle"') : '') + (rec.stars != null ? starsHTML(rec.stars) : '')}</div>` +
          (lv.locked ? `<div class="lock">${icons.lock}</div>` : ''));
        tile.addEventListener('click', () => {
          if (lv.locked) { audio.sfx('bonk'); tile.animate([{ transform: 'rotate(-4deg)' }, { transform: 'rotate(4deg)' }, { transform: 'none' }], 300); return; }
          audio.sfx('click');
          startLevel(lv);
        });
        grid.appendChild(tile);
      }
      p.appendChild(grid);
      if (config.extraMenu) p.appendChild(config.extraMenu(g));
      const btns = h('div', { class: 'ar-btns' });
      btns.appendChild(button(icons.home, 'Arcade', 'white', () => { location.href = back.href; }));
      p.appendChild(btns);
      show(p);
    }

    let currentLevel = null;
    function startLevel(lv) {
      currentLevel = lv;
      g.level = lv;
      g.time = 0;
      g.particles = new Particles();
      input.keys.clear(); input.pressed.clear();
      config.setup(g, lv);
      hide();
      g.state = 'play';
      last = performance.now(); acc = 0;
      if (config.music) audio.play(typeof config.music === 'function' ? config.music(g) : config.music);
    }
    function stopPlay() { audio.stop(); }

    function restart() { startLevel(currentLevel); }

    function pause() {
      if (g.state !== 'play') return;
      g.state = 'paused';
      audio.stop();
      if (config.onPause) config.onPause(g);
      const p = h('div', { class: 'ar-panel' });
      p.appendChild(h('h1', { class: 'ar-title' }, 'Paused'));
      const slider = (icon, keyName) => {
        const row = h('div', { class: 'ar-setting' }, icon);
        const r = h('input', { type: 'range', min: 0, max: 1, step: 0.05, 'aria-label': keyName });
        r.value = settings[keyName];
        r.addEventListener('input', () => { settings[keyName] = +r.value; audio.applyVolumes(); store.save(); });
        r.addEventListener('change', () => audio.sfx('click'));
        row.appendChild(r);
        return row;
      };
      p.appendChild(slider(icons.sound, 'sfx'));
      p.appendChild(slider(icons.music, 'music'));
      const muteBtn = button(settings.muted ? icons.mute : icons.sound, settings.muted ? 'Sound off' : 'Sound on', 'white', () => {
        settings.muted = !settings.muted; store.save(); audio.applyVolumes();
        muteBtn.innerHTML = (settings.muted ? icons.mute : icons.sound) + `<span>${settings.muted ? 'Sound off' : 'Sound on'}</span>`;
      });
      const mrow = h('div', { class: 'ar-btns' }); mrow.appendChild(muteBtn); p.appendChild(mrow);
      p.appendChild(h('p', { class: 'ar-sub', style: 'margin:12px 0 0' }, 'Difficulty (starts again)'));
      p.appendChild(diffPicker(() => { restart(); }));
      const btns = h('div', { class: 'ar-btns' });
      btns.appendChild(button(icons.play, 'Keep playing', 'big', resume));
      btns.appendChild(button(icons.again, 'Start over', 'yellow', restart));
      if (config.levels) btns.appendChild(button(icons.menu, 'Levels', 'blue', showLevels));
      btns.appendChild(button(icons.home, 'Arcade', 'white', () => { location.href = back.href; }));
      p.appendChild(btns);
      show(p);
    }
    function resume() {
      if (g.state !== 'paused') return;
      hide();
      g.state = 'play';
      last = performance.now(); acc = 0;
      input.keys.clear();
      if (config.onResume) config.onResume(g);
      if (config.music) audio.play(typeof config.music === 'function' ? config.music(g) : config.music);
    }
    pauseBtn.addEventListener('click', () => { audio.sfx('click'); g.state === 'play' ? pause() : resume(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

    // ---- results ----
    // result = { win: bool, score, stars (0-3), medal ('gold'|'silver'|'bronze'|null),
    //            time (seconds, for "lower is better" records), lines: ['...'],
    //            title, next: bool (offer next level) }
    function finish(result) {
      if (g.state === 'over') return;
      g.state = 'over';
      audio.stop();
      const levelId = currentLevel ? currentLevel.id : 'main';
      const rec = save.levels[levelId] = save.levels[levelId] || {};
      let newBest = false;
      if (result.score != null && (rec.score == null || result.score > rec.score)) { rec.score = result.score; newBest = !result.time && result.score > 0; }
      if (result.time != null && result.win && (rec.time == null || result.time < rec.time)) { rec.time = result.time; newBest = true; }
      if (result.stars != null && (rec.stars == null || result.stars > rec.stars)) rec.stars = result.stars;
      if (result.medal && (!rec.medal || MEDAL_RANK[result.medal] > MEDAL_RANK[rec.medal])) rec.medal = result.medal;
      if (result.win) rec.done = true;
      if (result.score != null) save.best = Math.max(save.best || 0, result.score);
      store.save();

      setTimeout(() => {
        audio.sfx(result.win ? 'win' : 'aww');
        if (result.win) confetti();
        const p = h('div', { class: 'ar-panel' });
        p.appendChild(h('h1', { class: 'ar-title' }, result.title || (result.win ? 'Hooray!' : 'Nice try!')));
        if (result.medal) p.insertAdjacentHTML('beforeend', icons.medal(result.medal).replace('<svg', '<svg class="ar-medal"'));
        if (result.stars != null) {
          let s = '<div class="ar-bigstars">';
          for (let i = 0; i < 3; i++) s += icons.star(i < result.stars).replace('<svg', `<svg class="${i < result.stars ? 'on' : ''}" style="animation-delay:${0.15 + i * 0.2}s"`);
          p.insertAdjacentHTML('beforeend', s + '</div>');
        }
        if (result.score != null) p.appendChild(h('div', { class: 'ar-score' }, 'Score: ' + result.score));
        for (const line of result.lines || []) p.appendChild(h('div', { class: 'ar-line' }, line));
        if (newBest) p.appendChild(h('div', { class: 'ar-line ar-new' }, 'New best!'));
        const btns = h('div', { class: 'ar-btns' });
        if (result.next && config.levels) btns.appendChild(button(icons.next, 'Next', 'big', () => {
          const all = config.levels(g);
          const i = all.findIndex(l => l.id === levelId);
          const nx = all[i + 1];
          if (nx && !nx.locked) startLevel(nx); else showLevels();
        }));
        btns.appendChild(button(icons.again, 'Again', result.next ? 'yellow' : 'big', restart));
        if (config.levels) btns.appendChild(button(icons.menu, 'Levels', 'blue', showLevels));
        btns.appendChild(button(icons.home, 'Arcade', 'white', () => { location.href = back.href; }));
        p.appendChild(btns);
        show(p);
        if (config.onFinish) config.onFinish(g, result);
      }, result.delay != null ? result.delay : 900);
    }

    // ---- go! ----
    resize();
    raf = requestAnimationFrame(frame);
    addEventListener('pagehide', () => { cancelAnimationFrame(raf); audio.stop(); });
    // test/debug hook
    window.__game = g;

    // Intro first, then the level picker (or straight into the game).
    show(howToPanel(() => { audio.resume(); showLevels(); }));
    return g;
  }

  // ------------------------------------------------------------------
  // Small math helpers games keep needing
  // ------------------------------------------------------------------
  const math = {
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    rand: (a, b) => a + Math.random() * (b - a),
    dist: (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay),
    // seeded random (same level layout every time)
    seeded(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); },
    // closest point on segment AB to P -> {x, y, t}
    nearestOnSegment(px, py, ax, ay, bx, by) {
      const dx = bx - ax, dy = by - ay;
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
      return { x: ax + dx * t, y: ay + dy * t, t };
    },
    angleDiff(a, b) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; },
  };

  // Summary for the hub cards: { stars, gold, silver, bronze, best }
  function summary(id) {
    const g = store.load().games[id];
    const out = { stars: 0, gold: 0, silver: 0, bronze: 0, best: 0, played: !!g };
    if (!g) return out;
    for (const k in g.levels) {
      const r = g.levels[k];
      out.stars += r.stars || 0;
      if (r.medal) out[r.medal]++;
    }
    out.best = g.best || 0;
    return out;
  }

  window.Arcade = { start, store, audio, sfx: (n) => audio.sfx(n), Particles, draw, icons, math, toast, confetti, summary, starsHTML, h };
})();
