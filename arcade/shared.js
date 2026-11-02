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
  // ------------------------------------------------------------------
  // Players (profiles): each kid gets their own avatar, name and saves.
  //
  // The list of players lives under 'kidsArcade.profiles'. Every save key
  // (arcade, coloring, maze) gets the player's id added to its name, so
  // kids never mix up stars, stickers, unlocks or favorites:
  //     kidsArcade.v1        <- player 1 (the saves from before players existed)
  //     kidsArcade.v1.p2     <- player 2
  // Sound volume is shared by everyone on the device ('kidsArcade.sound').
  // ------------------------------------------------------------------
  const PROFILES_KEY = 'kidsArcade.profiles';
  const SOUND_KEY = 'kidsArcade.sound';
  const BASE_KEYS = ['kidsArcade.v1', 'kidsColoring.v1', 'kidsMaze.v1'];   // every save the arcade makes
  // Avatar animals: simple original faces on a colored circle (100 x 100 box).
  const AV = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
  const avEyes = (y = 50, dx = 13) => `<circle cx="${50 - dx}" cy="${y}" r="6" fill="#2b2b2b"/><circle cx="${50 + dx}" cy="${y}" r="6" fill="#2b2b2b"/><circle cx="${52 - dx}" cy="${y - 2}" r="2" fill="#fff"/><circle cx="${52 + dx}" cy="${y - 2}" r="2" fill="#fff"/>`;
  const avSmile = (y = 64) => `<path d="M42 ${y} Q50 ${y + 7} 58 ${y}" fill="none" ${AV}/>`;
  const avCheeks = (y = 62) => `<ellipse cx="27" cy="${y}" rx="6" ry="4" fill="#ff8fab"/><ellipse cx="73" cy="${y}" rx="6" ry="4" fill="#ff8fab"/>`;
  const AVATARS = {
    cat:   `<path d="M22 40 L26 14 L44 28 Z M78 40 L74 14 L56 28 Z" fill="#ffb347" ${AV}/><circle cx="50" cy="54" r="30" fill="#ffb347" ${AV}/>${avEyes()}${avCheeks()}<path d="M46 58 L54 58 L50 62 Z" fill="#ef476f"/>${avSmile(65)}`,
    dog:   `<circle cx="50" cy="52" r="30" fill="#e0b984" ${AV}/><path d="M24 30 C10 34 12 62 22 64 C30 58 30 40 24 30 Z M76 30 C90 34 88 62 78 64 C70 58 70 40 76 30 Z" fill="#8d5524" ${AV}/>${avEyes(48)}<ellipse cx="50" cy="60" rx="7" ry="5" fill="#2b2b2b"/>${avSmile(67)}`,
    bunny: `<ellipse cx="38" cy="22" rx="8" ry="20" fill="#fff" ${AV}/><ellipse cx="62" cy="22" rx="8" ry="20" fill="#fff" ${AV}/><circle cx="50" cy="58" r="28" fill="#fff" ${AV}/>${avEyes(54)}${avCheeks(66)}<circle cx="50" cy="63" r="3" fill="#ef476f"/>${avSmile(68)}`,
    frog:  `<circle cx="32" cy="32" r="13" fill="#7bd389" ${AV}/><circle cx="68" cy="32" r="13" fill="#7bd389" ${AV}/><ellipse cx="50" cy="60" rx="34" ry="26" fill="#7bd389" ${AV}/><circle cx="32" cy="32" r="6" fill="#2b2b2b"/><circle cx="68" cy="32" r="6" fill="#2b2b2b"/><circle cx="34" cy="30" r="2" fill="#fff"/><circle cx="70" cy="30" r="2" fill="#fff"/>${avCheeks(64)}<path d="M34 64 Q50 78 66 64" fill="none" ${AV}/>`,
    chick: `<circle cx="50" cy="54" r="32" fill="#ffd166" ${AV}/><path d="M44 22 Q48 10 52 22 Q56 12 58 24" fill="none" ${AV}/>${avEyes(48)}${avCheeks(60)}<path d="M42 58 L58 58 L50 68 Z" fill="#ff8c42" ${AV}/>`,
    fox:   `<path d="M18 50 L22 14 L46 34 Z M82 50 L78 14 L54 34 Z" fill="#ff7b39" ${AV}/><path d="M18 46 C18 30 82 30 82 46 C82 70 62 86 50 86 C38 86 18 70 18 46 Z" fill="#ff7b39" ${AV}/><path d="M28 60 C36 62 44 70 50 86 C56 70 64 62 72 60 C66 78 34 78 28 60 Z" fill="#fff" ${AV}/>${avEyes(50)}<ellipse cx="50" cy="70" rx="5" ry="4" fill="#2b2b2b"/>`,
    mouse: `<circle cx="24" cy="30" r="17" fill="#c9c9d6" ${AV}/><circle cx="76" cy="30" r="17" fill="#c9c9d6" ${AV}/><circle cx="24" cy="30" r="8" fill="#ff8fab"/><circle cx="76" cy="30" r="8" fill="#ff8fab"/><circle cx="50" cy="56" r="28" fill="#c9c9d6" ${AV}/>${avEyes(52)}${avCheeks(64)}<circle cx="50" cy="62" r="4" fill="#ef476f"/>${avSmile(67)}`,
    owl:   `<path d="M22 30 L30 16 L40 26 M78 30 L70 16 L60 26" fill="none" ${AV}/><ellipse cx="50" cy="54" rx="32" ry="34" fill="#a47148" ${AV}/><circle cx="37" cy="46" r="13" fill="#fff" ${AV}/><circle cx="63" cy="46" r="13" fill="#fff" ${AV}/>${avEyes(46)}<path d="M45 58 L55 58 L50 68 Z" fill="#ffd166" ${AV}/><path d="M34 74 Q50 82 66 74" fill="none" stroke="#2b2b2b" stroke-width="3"/>`,
  };
  const AVATAR_COLORS = ['#ef476f', '#4cc9f0', '#06d6a0', '#ffd166', '#9b5de5', '#ff8c42'];
  const profiles = {
    _list: null,
    // all players: [{ id, name, pet, color }]
    list() {
      if (this._list) return this._list;
      let d = null;
      try { d = JSON.parse(localStorage.getItem(PROFILES_KEY)); } catch (e) { d = null; }
      if (!d || !Array.isArray(d.list) || !d.list.length) d = { active: 'p1', list: [{ id: 'p1', name: '', pet: 'cat', color: '#ef476f' }] };
      this._list = d.list; this._active = d.active;
      if (!d.list.some(p => p.id === d.active)) this._active = d.list[0].id;
      return this._list;
    },
    _write() { try { localStorage.setItem(PROFILES_KEY, JSON.stringify({ active: this._active, list: this._list })); } catch (e) { /* skip */ } },
    active() { const l = this.list(); return l.find(p => p.id === this._active) || l[0]; },
    // switch player: the next store.load() reads that player's saves
    use(id) {
      if (!this.list().some(p => p.id === id)) return;
      this._active = id; this._write();
      store.data = null;
    },
    add(fields) {
      const l = this.list();
      let n = 2; while (l.some(p => p.id === 'p' + n)) n++;     // p1 always exists first, so new ones are p2, p3...
      const p = Object.assign({ id: 'p' + n, name: '', pet: 'dog', color: '#4cc9f0' }, fields);
      l.push(p); this._write();
      return p;
    },
    update(id, fields) { const p = this.list().find(q => q.id === id); if (p) { Object.assign(p, fields); this._write(); } },
    // delete a player AND all their saves (never the last player)
    remove(id) {
      const l = this.list();
      if (l.length < 2) return false;
      for (const base of BASE_KEYS) { try { localStorage.removeItem(this.key(base, id)); } catch (e) { /* skip */ } }
      this._list = l.filter(p => p.id !== id);
      if (this._active === id) { this._active = this._list[0].id; store.data = null; }
      this._write();
      return true;
    },
    // the save name for this player: player 1 keeps the old names (so old progress stays theirs)
    key(base, id) { id = id || this.active().id; return id === 'p1' ? base : base + '.' + id; },
    // the avatar picture as an <svg>
    avatar(p, size) {
      p = p || this.active();
      return `<svg viewBox="0 0 100 100" ${size ? `width="${size}" height="${size}"` : ''} aria-hidden="true"><circle cx="50" cy="50" r="48" fill="${p.color}"/>${AVATARS[p.pet] || AVATARS.cat}</svg>`;
    },
    pets: Object.keys(AVATARS),
    colors: AVATAR_COLORS,
  };

  const store = {
    data: null,
    load() {
      if (this.data) return this.data;
      let d = null;
      try { d = JSON.parse(localStorage.getItem(profiles.key(SAVE_KEY))); } catch (e) { d = null; }
      this.data = Object.assign({ settings: {}, games: {}, favorites: [] }, d || {});
      // volumes are shared by every player on this device; difficulty belongs to each player
      let sound = null;
      try { sound = JSON.parse(localStorage.getItem(SOUND_KEY)); } catch (e) { sound = null; }
      this.data.settings = Object.assign(
        { difficulty: 'normal', sfx: 0.8, music: 0.4, muted: false }, this.data.settings, sound || {});
      return this.data;
    },
    save() {
      try {
        localStorage.setItem(profiles.key(SAVE_KEY), JSON.stringify(this.data));
        const s = this.data.settings;
        localStorage.setItem(SOUND_KEY, JSON.stringify({ sfx: s.sfx, music: s.music, muted: s.muted }));
      } catch (e) { /* private mode etc. */ }
    },
    settings() { return this.load().settings; },
    // Per-game record: { levels: {id: {score, stars, medal, time}}, best, unlocked: [], data: {} }
    game(id) {
      const g = this.load().games;
      g[id] = Object.assign({ levels: {}, best: 0, unlocked: [], data: {}, achievements: [] }, g[id] || {});
      return g[id];
    },
    // this player's favorite games (hub hearts)
    isFavorite(id) { return this.load().favorites.includes(id); },
    toggleFavorite(id) {
      const f = this.load().favorites, i = f.indexOf(id);
      if (i < 0) f.push(id); else f.splice(i, 1);
      this.save();
      return i < 0;
    },
  };

  // make text safe to put inside HTML (player names are typed in by people)
  function escapeHTML(t) { return String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

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
        // a gentle limiter at the very end so loud moments never crackle
        this.limiter = this.ctx.createDynamicsCompressor();
        this.limiter.threshold.value = -6; this.limiter.ratio.value = 12; this.limiter.attack.value = 0.003; this.limiter.release.value = 0.15;
        this.master.connect(this.limiter).connect(this.ctx.destination);
        // Reverb: makes everything sound like it's in a room instead of "dry".
        // We build the room echo ourselves: a short burst of noise that fades away.
        this.verb = this.ctx.createConvolver();
        this.verb.buffer = this.makeRoom(1.8, 2.6);
        this.sfxVerb = this.ctx.createGain(); this.sfxVerb.gain.value = 0.22;
        this.sfxVerb.connect(this.verb);
        this.verbOut = this.ctx.createGain(); this.verbOut.gain.value = 0.5;
        this.verb.connect(this.verbOut).connect(this.master);
        this.sfxGain.connect(this.sfxVerb);
        this.applyVolumes();
      } catch (e) { this.ctx = null; }
      return this.ctx;
    },
    applyVolumes() {
      if (!this.ctx) return;
      const s = store.settings();
      this.master.gain.value = s.muted ? 0 : 1;
      this.sfxGain.gain.value = s.sfx * 0.7;
      this.musicGain.gain.value = s.music * 0.7;
    },
    resume() { const c = this.ensure(); if (c && c.state === 'suspended') c.resume(); },
    // The "room" for the reverb: stereo noise that fades out over `secs` seconds.
    makeRoom(secs, decay) {
      const c = this.ctx, n = Math.floor(c.sampleRate * secs), b = c.createBuffer(2, n, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = b.getChannelData(ch);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
      }
      return b;
    },
    // Make a sound "node" go left or right (-1 .. 1). Old browsers without panners just skip it.
    pan(node, x) {
      if (!this.ctx.createStereoPanner) return node;
      const p = this.ctx.createStereoPanner(); p.pan.value = x; node.connect(p); return p;
    },

    // One note. freq in Hz, len in seconds; slide = end frequency.
    tone(freq, len = 0.15, opts = {}) {
      const c = this.ensure(); if (!c) return;
      const t = c.currentTime + (opts.delay || 0);
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = opts.type === 'saw' ? 'sawtooth' : (opts.type || 'square');
      o.frequency.setValueAtTime(freq, t);
      if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slide), t + len);
      if (opts.vib) {                       // wobbly pitch (cartoon boings, sad trombones)
        const lfo = c.createOscillator(), lg = c.createGain();
        lfo.frequency.value = opts.vibRate || 9; lg.gain.value = freq * opts.vib;
        lfo.connect(lg).connect(o.frequency); lfo.start(t); lfo.stop(t + len + 0.05);
      }
      const v = opts.vol == null ? 0.3 : opts.vol;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + (opts.attack || 0.006));
      g.gain.setValueAtTime(v, t + Math.max(opts.attack || 0.006, len * (opts.hold || 0.25)));
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      let out = o.connect(g);
      if (opts.filter) {                    // soften harsh waves
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = opts.filter; out = out.connect(f);
      }
      if (opts.pan) out = this.pan(out, opts.pan);
      out.connect(opts.music ? this.musicGain : this.sfxGain);
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
      f.frequency.setValueAtTime(opts.freq || 1200, t);
      if (opts.sweep) f.frequency.exponentialRampToValueAtTime(opts.sweep, t + len);   // whooshes go up or down
      if (opts.q) f.Q.value = opts.q;
      const g = c.createGain();
      g.gain.setValueAtTime(opts.vol == null ? 0.3 : opts.vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      src.connect(f).connect(g).connect(this.sfxGain);
      src.start(t);
    },
    // Ready-made sound effects. Games call Arcade.sfx('jump') etc.
    sfx(name) {
      // Each sound is a few layers played together: a main tone, a soft body
      // underneath, a bit of noise for texture, and a sparkle on top. They all
      // go through the room reverb a little, so they sound round instead of beepy.
      const T = (f, l, o) => this.tone(f, l, o);
      const N = (l, o) => this.noise(l, o);
      const arp = (notes, gap, o) => notes.forEach((f, i) => T(f, o.len || 0.14, Object.assign({}, o, { delay: (o.delay || 0) + i * gap })));
      switch (name) {
        case 'click':  T(880, 0.05, { type: 'triangle', vol: 0.2 }); T(1760, 0.03, { type: 'sine', vol: 0.08 }); break;
        case 'tick':   T(1600, 0.025, { type: 'triangle', vol: 0.1 }); break;
        case 'select': T(660, 0.06, { type: 'square', vol: 0.1, filter: 2400 }); T(990, 0.08, { type: 'square', vol: 0.1, filter: 2400, delay: 0.05 }); break;
        case 'back':   T(660, 0.06, { type: 'square', vol: 0.1, filter: 2000 }); T(440, 0.09, { type: 'square', vol: 0.1, filter: 2000, delay: 0.05 }); break;
        case 'jump':   T(320, 0.2, { slide: 820, type: 'square', vol: 0.13, filter: 3000 }); T(160, 0.16, { slide: 410, type: 'sine', vol: 0.18 }); break;
        case 'land':   T(140, 0.09, { slide: 60, type: 'sine', vol: 0.3 }); N(0.06, { freq: 600, vol: 0.12 }); break;
        case 'step':   N(0.03, { filter: 'bandpass', freq: 900, vol: 0.08 }); break;
        case 'spring': T(220, 0.38, { slide: 1300, type: 'triangle', vol: 0.28, vib: 0.06, vibRate: 22 }); T(440, 0.3, { slide: 2600, type: 'sine', vol: 0.08 }); break;
        case 'coin':   T(988, 0.07, { type: 'square', vol: 0.2, filter: 4500 }); T(1319, 0.28, { delay: 0.06, type: 'square', vol: 0.2, filter: 4500 });
                       T(2637, 0.2, { delay: 0.06, type: 'sine', vol: 0.06 }); break;
        case 'star':   arp([1047, 1319, 1568, 2093, 2637], 0.045, { type: 'triangle', vol: 0.2, len: 0.22 });
                       arp([2093, 2637, 3136], 0.06, { type: 'sine', vol: 0.05, len: 0.3, delay: 0.1, pan: 0.4 }); break;
        case 'pop':    T(420, 0.07, { slide: 1500, type: 'sine', vol: 0.35 }); N(0.04, { filter: 'highpass', freq: 3500, vol: 0.18 }); T(1800, 0.05, { type: 'sine', vol: 0.06, delay: 0.03 }); break;
        case 'hit':    T(220, 0.16, { slide: 80, type: 'square', vol: 0.16, filter: 1800 }); N(0.08, { freq: 1500, vol: 0.2 }); break;
        case 'hurt':   T(520, 0.12, { slide: 300, type: 'square', vol: 0.14, filter: 2200 }); T(390, 0.2, { slide: 200, type: 'square', vol: 0.14, filter: 2200, delay: 0.1 }); break;
        case 'bonk':   T(200, 0.22, { slide: 110, type: 'triangle', vol: 0.32, vib: 0.08, vibRate: 30 }); N(0.05, { freq: 900, vol: 0.15 }); break;
        case 'crash':  N(0.6, { freq: 1600, sweep: 300, vol: 0.4 }); T(150, 0.4, { slide: 45, type: 'sawtooth', vol: 0.14, filter: 800 }); T(90, 0.3, { slide: 40, type: 'sine', vol: 0.3 }); break;
        case 'shoot':  T(900, 0.1, { slide: 420, type: 'square', vol: 0.1, filter: 3500 }); N(0.05, { filter: 'highpass', freq: 4000, vol: 0.06 }); break;
        case 'zap':    T(1400, 0.14, { slide: 260, type: 'sawtooth', vol: 0.1, filter: 3000, vib: 0.05, vibRate: 40 }); break;
        case 'boost':  T(180, 0.45, { slide: 1000, type: 'sawtooth', vol: 0.12, filter: 2500 }); N(0.45, { filter: 'bandpass', freq: 600, sweep: 4000, vol: 0.15 }); break;
        case 'power':  arp([523, 659, 784, 1047, 1319, 1568], 0.04, { type: 'square', vol: 0.1, filter: 3500, len: 0.12 });
                       T(2093, 0.4, { delay: 0.24, type: 'triangle', vol: 0.12, vib: 0.01 }); break;
        case 'swish':  N(0.28, { filter: 'bandpass', freq: 1200, sweep: 5000, q: 1.5, vol: 0.28 }); break;
        case 'whoosh': N(0.3, { filter: 'bandpass', freq: 3500, sweep: 600, q: 1.2, vol: 0.22 }); break;
        case 'splash': N(0.55, { filter: 'bandpass', freq: 2200, sweep: 500, vol: 0.35 }); T(380, 0.22, { slide: 140, type: 'sine', vol: 0.15 });
                       for (let i = 0; i < 5; i++) T(900 + Math.random() * 1400, 0.06, { slide: 2600, type: 'sine', vol: 0.06, delay: 0.08 + i * 0.05, pan: Math.random() - 0.5 }); break;
        case 'beep':   T(880, 0.12, { type: 'square', vol: 0.12, filter: 3000 }); break;
        case 'go':     [784, 988, 1175].forEach(f => T(f, 0.45, { type: 'square', vol: 0.08, filter: 3200, hold: 0.6 })); T(392, 0.45, { type: 'triangle', vol: 0.2 }); break;
        case 'win': {  // a little fanfare with chords and a drum
          const ch = [[523, 659, 784], [587, 740, 880], [659, 831, 988], [784, 988, 1175, 1568]];
          ch.forEach((c3, i) => c3.forEach(f => T(f, i === 3 ? 0.9 : 0.16, { delay: i * 0.13, type: 'square', vol: 0.06, filter: 3500, hold: 0.7 })));
          [262, 294, 330, 392].forEach((f, i) => T(f, i === 3 ? 0.9 : 0.16, { delay: i * 0.13, type: 'triangle', vol: 0.18 }));
          N(0.5, { delay: 0.39, filter: 'highpass', freq: 5000, vol: 0.12 });
          break;
        }
        case 'aww':    T(392, 0.3, { slide: 370, type: 'sawtooth', vol: 0.2, filter: 1200, vib: 0.02 }); T(370, 0.3, { delay: 0.3, slide: 349, type: 'sawtooth', vol: 0.2, filter: 1200, vib: 0.02 });
                       T(349, 0.8, { delay: 0.6, slide: 262, type: 'sawtooth', vol: 0.2, filter: 1000, vib: 0.03, vibRate: 6 }); break;
        case 'unlock': arp([659, 784, 988, 1319, 1568], 0.07, { type: 'triangle', vol: 0.2, len: 0.25 });
                       for (let i = 0; i < 6; i++) T(2000 + i * 300, 0.2, { delay: 0.3 + i * 0.04, type: 'sine', vol: 0.04, pan: i % 2 ? 0.5 : -0.5 }); break;
        default: T(440, 0.1);
      }
    },

    // ---- Music: a little band made in the browser ----
    // A song is a short recipe (tempo, key, chords, drum style...). From it we
    // build a 16-bar tune (verse, verse, chorus, verse) with:
    //   drums (kick, snare, hi-hat, shaker, sleigh bells, claps, tom fills, a cymbal crash per part),
    //   a bass line, soft chord pads, a sparkly arpeggio,
    //   and a lead melody made from the chords (with a bit of echo).
    // The melody is "composed" by a seeded random walk over the chord notes,
    // so the same recipe always plays the same tune.
    songs: {
      // recipe fields: tempo, root (MIDI note of the key), scale, prog (chord per bar,
      // as scale steps 1-7 for the verse and the chorus), drums, bass, lead (wave),
      // pad (true/false), arp (true/false), swing (0-0.3), seed, bells, octave
      // lead / harmony: 'square' | 'saw' | 'triangle' | 'bell' (music box) | 'flute' | 'brass'
      // (harmony = the second voice that sings along in the chorus)
      happy:  { tempo: 124, root: 60, scale: 'major', prog: [[1, 5, 6, 4], [4, 5, 3, 6]], drums: 'disco', bass: 'octaves', lead: 'square', pad: true, arp: false, seed: 11 },
      race:   { tempo: 150, root: 57, scale: 'minor', prog: [[1, 6, 7, 5], [6, 7, 1, 1]], drums: 'rock', bass: 'eighths', lead: 'saw', pad: true, arp: true, seed: 23 },
      calm:   { tempo: 84, root: 65, scale: 'major', prog: [[1, 4, 6, 5], [4, 1, 2, 5]], drums: 'soft', bass: 'whole', lead: 'triangle', pad: true, arp: true, seed: 37 },
      space:  { tempo: 108, root: 52, scale: 'minor', prog: [[1, 6, 3, 7], [4, 6, 7, 1]], drums: 'halftime', bass: 'pulse', lead: 'saw', pad: true, arp: true, seed: 41 },
      jungle: { tempo: 132, root: 55, scale: 'mixolydian', prog: [[1, 7, 4, 1], [4, 5, 1, 7]], drums: 'latin', bass: 'bounce', lead: 'square', pad: false, arp: true, seed: 53 },
    },
    // instruments & scales
    SCALES: {
      major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10],
      mixolydian: [0, 2, 4, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], harmonic: [0, 2, 3, 5, 7, 8, 11],
      pentatonic: [0, 2, 4, 7, 9, 12, 14],
    },
    DRUMS: {     // 16 steps per bar: K = kick, S = snare, C = clap, H = closed hat, O = open hat, s = shaker, B = bells
      rock:     { K: 'x.......x.x.....', S: '....x.......x...', H: 'x.x.x.x.x.x.x.x.' },
      disco:    { K: 'x...x...x...x...', C: '....x.......x...', O: '..x...x...x...x.', H: 'x...x...x...x...' },
      halftime: { K: 'x.........x.....', S: '........x.......', H: 'x.x.x.x.x.x.x.x.' },
      latin:    { K: 'x..x..x.x..x..x.', C: '....x.......x...', s: 'xxxxxxxxxxxxxxxx' },
      soft:     { K: 'x.......x.......', s: '..x...x...x...x.' },
      march:    { K: 'x.......x.......', S: '....x.......x...', B: 'x.x.x.x.x.x.x.x.' },
      punk:     { K: 'x.x.x.x.x.x.x.x.', S: '....x.......x...', H: 'xxxxxxxxxxxxxxxx' },
      bubble:   { K: 'x...x...x...x...', C: '....x.......x..x', H: '.xxx.xxx.xxx.xxx' },
      surf:     { K: 'x.....x...x.....', S: '....x.......x...', H: 'x.xxx.xxx.xxx.xx' },
      tribal:   { K: 'x..x..x...x..x..', S: '......x.......x.', s: 'x.xxx.xxx.xxx.xx' },
      boombap:  { K: 'x......x..x.....', S: '....x.......x...', H: 'x.x.x.x.x.x.x.xx' },
      shuffle:  { K: 'x.....x.x.....x.', S: '....x.......x...', H: 'x..x.xx..x.xx..x', B: '..............x.' },
      sleigh:   { K: 'x.......x.......', S: '....x.......x...', B: 'xxxxxxxxxxxxxxxx' },
    },
    BASS: {      // which 16th steps play, and which chord note (0 = root, 1 = fifth, 2 = octave)
      eighths: ['x.x.x.x.x.x.x.x.', '0000000000000000'],
      octaves: ['x.x.x.x.x.x.x.x.', '0202020202020202'],
      whole:   ['x...............', '0000000000000000'],
      pulse:   ['xxxxxxxxxxxxxxxx', '0000000000000000'],
      bounce:  ['x..x..x.x..x..x.', '0010010200100102'],
      walk:    ['x...x...x...x...', '0000100020001000'],
      offbeat: ['..x...x...x...x.', '0000000000000000'],
    },

    musicTimer: null, bus: null, current: null,
    // Make (once) the music effects: echo + a squeezer so it never gets too loud.
    musicBus() {
      const c = this.ensure(); if (!c) return null;
      if (this.bus) return this.bus;
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -18; comp.ratio.value = 4;
      comp.connect(this.musicGain);
      const echo = c.createDelay(1); const fb = c.createGain(); const tone = c.createBiquadFilter(); const wet = c.createGain();
      tone.type = 'lowpass'; tone.frequency.value = 2400; fb.gain.value = 0.32; wet.gain.value = 0.35;
      echo.connect(tone).connect(fb).connect(echo); tone.connect(wet).connect(comp);
      const verb = c.createGain(); verb.gain.value = 0.6; verb.connect(this.verb);   // music shares the room reverb
      this.bus = { comp, echo, verb };
      return this.bus;
    },
    // One instrument note. kind decides the sound; send = how much echo.
    voice(kind, freq, t, len, vol, send = 0) {
      const c = this.ctx, bus = this.bus;
      const g = c.createGain();
      // where it sits left/right in the band (hats a bit right, shaker left, arpeggio bounces around)
      const PANS = { hat: 0.3, open: 0.35, shaker: -0.4, bells: 0.25, pad: 0, pluck: (Math.round(freq) % 3 - 1) * 0.45, clap: -0.1 };
      const out = PANS[kind] ? this.pan(g, PANS[kind]) : g;
      out.connect(bus.comp);
      if (send) { const s = c.createGain(); s.gain.value = send; g.connect(s).connect(bus.echo); }
      const REVERB = { pad: 0.5, pluck: 0.4, snare: 0.25, clap: 0.3, bells: 0.3, bell: 0.5, flute: 0.4 };
      const rv = REVERB[kind] != null ? REVERB[kind] : kind.startsWith('lead') ? 0.3 : 0;
      if (rv) { const s = c.createGain(); s.gain.value = rv; g.connect(s).connect(bus.verb); }
      const env = (a, d, s, r) => {        // attack, decay, sustain level, release
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(vol, t + a);
        g.gain.linearRampToValueAtTime(vol * s, t + a + d);
        g.gain.setValueAtTime(vol * s, t + Math.max(a + d, len));
        g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a + d, len) + r);
        return t + Math.max(a + d, len) + r + 0.05;
      };
      const osc = (type, f, det = 0) => { const o = c.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det; return o; };
      let end;
      if (kind === 'lead-bell') {           // music-box bell: a sine "rung" by another sine (FM)
        const car = osc('sine', freq), mod = osc('sine', freq * 3.5), mg = c.createGain();
        mg.gain.setValueAtTime(freq * 2.2, t); mg.gain.exponentialRampToValueAtTime(freq * 0.05, t + 0.5);
        mod.connect(mg).connect(car.frequency); car.connect(g);
        end = env(0.003, 0.3, 0.25, 0.5);
        [car, mod].forEach(o => { o.start(t); o.stop(end); });
      } else if (kind === 'lead-flute') {   // breathy flute: a sine with a little noise and vibrato
        const o1 = osc('sine', freq), o2 = osc('triangle', freq * 2), g2 = c.createGain(); g2.gain.value = 0.12;
        const vib = osc('sine', 5), vg = c.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(freq * 0.01, t + 0.3);
        vib.connect(vg); vg.connect(o1.frequency); vg.connect(o2.frequency);
        o1.connect(g); o2.connect(g2).connect(g);
        end = env(0.05, 0.1, 0.8, 0.15);
        [o1, o2, vib].forEach(o => { o.start(t); o.stop(end); });
      } else if (kind === 'lead-brass') {   // bright brass: sawtooths with a filter that opens on each note
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 2;
        f.frequency.setValueAtTime(500, t); f.frequency.linearRampToValueAtTime(3200, t + 0.06); f.frequency.exponentialRampToValueAtTime(1400, t + 0.4);
        const o1 = osc('sawtooth', freq, -8), o2 = osc('sawtooth', freq, 8);
        o1.connect(f); o2.connect(f); f.connect(g);
        end = env(0.03, 0.15, 0.75, 0.12);
        [o1, o2].forEach(o => { o.start(t); o.stop(end); });
      } else if (kind === 'lead-square' || kind === 'lead-saw' || kind === 'lead-triangle') {
        const type = kind === 'lead-saw' ? 'sawtooth' : kind.slice(5);
        // the filter starts bright and mellows a little on each note (like a real synth)
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 1.5;
        const top = type === 'triangle' ? 7000 : 3600;
        f.frequency.setValueAtTime(top, t); f.frequency.exponentialRampToValueAtTime(top * 0.55, t + 0.25);
        const o1 = osc(type, freq, -6), o2 = osc(type, freq, 7);
        const vib = osc('sine', 5.5), vg = c.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(len > 0.25 ? freq * 0.012 : 0, t + 0.25);
        vib.connect(vg); vg.connect(o1.frequency); vg.connect(o2.frequency);
        o1.connect(f); o2.connect(f); f.connect(g);
        end = env(0.012, 0.12, 0.7, 0.12);
        [o1, o2, vib].forEach(o => { o.start(t); o.stop(end); });
      } else if (kind === 'bass') {
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(260, t + 0.18);
        const o1 = osc('sawtooth', freq), o2 = osc('sine', freq / 2);
        const sub = c.createGain(); sub.gain.value = 0.8;
        o1.connect(f).connect(g); o2.connect(sub).connect(g);
        end = env(0.006, 0.08, 0.6, 0.06);
        [o1, o2].forEach(o => { o.start(t); o.stop(end); });
      } else if (kind === 'pad') {
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1100;
        const o1 = osc('sawtooth', freq, -9), o2 = osc('sawtooth', freq, 9);
        o1.connect(f); o2.connect(f); f.connect(g);
        end = env(0.25, 0.3, 0.8, 0.4);
        [o1, o2].forEach(o => { o.start(t); o.stop(end); });
      } else if (kind === 'pluck') {       // arpeggio / music box
        const o = osc('triangle', freq), o2 = osc('sine', freq * 2);
        const g2 = c.createGain(); g2.gain.value = 0.3;
        o.connect(g); o2.connect(g2).connect(g);
        end = env(0.003, 0.15, 0.15, 0.1);
        [o, o2].forEach(x => { x.start(t); x.stop(end); });
      } else if (kind === 'kick') {         // a thump that drops in pitch, plus a tiny click so it's heard on phones
        const o = osc('sine', 160);
        o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        o.connect(g);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
        const k = osc('triangle', 1200), kg = c.createGain();
        kg.gain.setValueAtTime(vol * 0.25, t); kg.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
        k.connect(kg).connect(bus.comp);
        o.start(t); o.stop(t + 0.34); k.start(t); k.stop(t + 0.02);
      } else if (kind === 'tom') {          // drum fill toms (freq = how high)
        const o = osc('sine', freq * 1.6);
        o.frequency.setValueAtTime(freq * 1.6, t); o.frequency.exponentialRampToValueAtTime(freq, t + 0.15);
        o.connect(g);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
        o.start(t); o.stop(t + 0.27);
      } else {                              // noise drums: snare, clap, hats, shaker, bells
        const n = this.noiseBuf || (this.noiseBuf = (() => {
          const b = c.createBuffer(1, c.sampleRate, c.sampleRate), d = b.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; })());
        const src = c.createBufferSource(); src.buffer = n;
        const f = c.createBiquadFilter();
        const set = {
          snare: ['bandpass', 1800, 0.16], clap: ['bandpass', 1300, 0.12], hat: ['highpass', 7500, 0.035],
          open: ['highpass', 7000, 0.16], shaker: ['highpass', 5500, 0.05], bells: ['bandpass', 6500, 0.09],
          crash: ['highpass', 4500, 1.4],
        }[kind] || ['highpass', 7000, 0.04];
        f.type = set[0]; f.frequency.value = set[1]; if (kind === 'bells') f.Q.value = 6;
        src.connect(f).connect(g);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + set[2]);
        src.start(t, Math.random() * 0.5); src.stop(t + set[2] + 0.02);
        if (kind === 'snare') {             // a little body under the snare
          const o = osc('triangle', 190); const og = c.createGain();
          og.gain.setValueAtTime(vol * 0.6, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
          o.connect(og).connect(bus.comp); o.start(t); o.stop(t + 0.1);
        }
        if (kind === 'bells') {             // jingle: two shiny high notes
          for (const fr of [2637, 3520]) { const o = osc('sine', fr); const og = c.createGain(); og.gain.setValueAtTime(vol * 0.25, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); o.connect(og).connect(bus.comp); o.start(t); o.stop(t + 0.14); }
        }
      }
    },
    // Turn a recipe into 16 bars of notes: [{step, kind, midi?, len (steps), vol, send}]
    compose(song) {
      if (song._events) return song._events;
      const R = math.seeded(song.seed || 1);
      const scale = this.SCALES[song.scale] || this.SCALES.major;
      const note = (deg, oct = 0) => {     // scale step (0-based, can go past 7) -> MIDI
        const o = Math.floor(deg / 7), i = ((deg % 7) + 7) % 7;
        return song.root + scale[i] + 12 * (o + oct);
      };
      const chordDeg = d => [d - 1, d + 1, d + 3];   // triad from scale step (1-based)
      const form = ['A', 'A', 'B', 'A'];
      const ev = [];
      const drums = this.DRUMS[song.drums] || this.DRUMS.rock;
      const bass = this.BASS[song.bass] || this.BASS.eighths;
      // The melody: make one 4-bar phrase for A and one for B, then reuse them.
      const phrases = {};
      const rhythms = ['x.x.x...x.x.x...', 'x...x.x.x...x...', 'x.xxx...x.x.x.x.', 'x..x..x.x...x...', 'x...x...x.x.x.x.', 'x.x...x.x.x.x...'];
      for (const sec of ['A', 'B']) {
        const prog = sec === 'A' ? song.prog[0] : song.prog[1] || song.prog[0];
        const notes = [];
        // The tune follows a shape: the verse (A) climbs up and comes back down;
        // the chorus (B) starts high and steps down. Strong beats land on chord
        // notes near that shape; the notes in between walk there step by step.
        const center = sec === 'A' ? 4 : 6;
        const shape = (t) => sec === 'A' ? Math.sin(Math.PI * t) * 4 : 4 * Math.cos(Math.PI * t * 0.6) - 1;
        const wobble = R() * 6.28;
        let pos = center, prev = null, repeats = 0;
        const motif = rhythms[Math.floor(R() * rhythms.length)];
        let motif2 = rhythms[Math.floor(R() * rhythms.length)];
        if (motif2 === motif) motif2 = rhythms[(rhythms.indexOf(motif) + 2) % rhythms.length];
        const all = [];
        for (let bar = 0; bar < 4; bar++) {
          const rhythm = bar === 3 ? 'x...x...x.......' : bar % 2 ? motif2 : motif;   // last bar: settle down
          for (let st = 0; st < 16; st++) if (rhythm[st] === 'x') {
            let len = 1; while (st + len < 16 && rhythm[st + len] !== 'x') len++;
            all.push({ bar, st, len });
          }
        }
        // where should we be (in scale steps) at each moment?
        const targetAt = (bar, st) => center + shape((bar * 16 + st) / 64) + Math.sin(wobble + bar * 1.7) * 0.8;
        // the chord note (in any octave) closest to a wanted height
        const nearestChord = (chord, want, avoid) => {
          let best = null, bd = 99;
          for (const cd of chord) for (const o of [-7, 0, 7, 14]) {
            const n = cd + o; const d = Math.abs(n - want) + (n === avoid ? 2.5 : 0);
            if (d < bd) { bd = d; best = n; }
          }
          return best;
        };
        all.forEach((nt, i) => {
          const chord = chordDeg(prog[nt.bar]);
          const strong = nt.st % 4 === 0 || nt.len >= 4;
          const avoid = repeats >= 1 ? prev : null;           // no more than two the same in a row
          if (nt.bar === 3 && nt.st === 8) {                  // phrase ending: the chord's root, held
            pos = nearestChord([chord[0]], targetAt(3, 8), null); nt.len = 8;
          } else if (strong) {
            pos = nearestChord(chord, targetAt(nt.bar, nt.st), avoid);
          } else {
            // walk one step toward where the next strong note wants to go
            const nx = all.slice(i + 1).find(n => n.st % 4 === 0) || nt;
            const goal = targetAt(nx.bar, nx.st);
            pos += goal > pos + 0.5 ? 1 : goal < pos - 0.5 ? -1 : (R() < 0.5 ? 1 : -1);
            if (pos === avoid) pos += goal > pos ? 1 : -1;
          }
          pos = Math.max(sec === 'A' ? 1 : 3, Math.min(sec === 'A' ? 10 : 12, pos));
          repeats = pos === prev ? repeats + 1 : 0;
          prev = pos;
          notes.push({ step: nt.bar * 16 + nt.st, deg: pos, len: nt.len });
        });
        phrases[sec] = notes;
      }
      // (songs in high keys play the melody one octave lower so it's not shrill)
      form.forEach((sec, si) => {
        const prog = sec === 'A' ? song.prog[0] : song.prog[1] || song.prog[0];
        const base = si * 64;
        const lift = song.root >= 64 ? 0 : 12;
        for (const n of phrases[sec]) {
          ev.push({ step: base + n.step, kind: 'lead-' + (song.lead || 'square'), midi: note(n.deg, song.octave || 0) + lift, len: n.len, vol: 0.12, send: 0.35 });
          // in the chorus a second voice sings along a little lower (a "harmony")
          if (sec === 'B') ev.push({ step: base + n.step, kind: 'lead-' + (song.harmony || song.lead || 'square'), midi: note(n.deg - 2, song.octave || 0) + lift, len: n.len, vol: 0.06, send: 0.2 });
        }
        // the last verse gets a sparkly bell copy of the tune one octave up
        if (si === form.length - 1) for (const n of phrases[sec]) ev.push({ step: base + n.step, kind: 'lead-bell', midi: note(n.deg, (song.octave || 0) + 1) + lift, len: n.len, vol: 0.05 });
        for (let bar = 0; bar < 4; bar++) {
          const d = prog[bar], s0 = base + bar * 16;
          const tri = chordDeg(d).map(x => note(x));
          // drums (a little drum fill in the last bar of each section)
          if (bar === 0) ev.push({ step: s0, kind: 'crash', vol: si === 0 ? 0.06 : 0.1 });     // a cymbal crash starts each part
          if (bar === 3) [12, 13, 14, 15].forEach((st, i) => ev.push({ step: s0 + st, kind: 'tom', midi: [57, 52, 48, 43][i], vol: 0.5 }));   // tom fill
          for (const k in drums) for (let st = 0; st < 16; st++) {
            let hit = drums[k][st] === 'x';
            if (bar === 3 && st >= 12 && (k === 'S' || k === 'K')) hit = false;     // (the toms play there)
            if (!hit) continue;
            const kind = { K: 'kick', S: 'snare', C: 'clap', H: 'hat', O: 'open', s: 'shaker', B: 'bells' }[k];
            const vol = { kick: 0.9, snare: 0.35, clap: 0.35, hat: 0.12, open: 0.1, shaker: 0.06, bells: 0.16 }[kind];
            ev.push({ step: s0 + st, kind, vol: vol * (st % 4 === 0 ? 1 : 0.8) });
          }
          if (song.bells) for (let st = 0; st < 16; st += 2) ev.push({ step: s0 + st, kind: 'bells', vol: 0.12 });
          // bass
          for (let st = 0; st < 16; st++) {
            if (bass[0][st] !== 'x') continue;
            const which = +bass[1][st];
            const m = note(d - 1, -2) + (which === 1 ? 7 : which === 2 ? 12 : 0);
            let len = 1; while (st + len < 16 && bass[0][st + len] !== 'x') len++;
            ev.push({ step: s0 + st, kind: 'bass', midi: m, len: Math.min(len, 4), vol: 0.22 });
          }
          // soft chord pad (whole bar)
          if (song.pad) for (const m of tri) ev.push({ step: s0, kind: 'pad', midi: m, len: 15, vol: 0.035 });
          // arpeggio: chord notes going up and down, every 16th (chorus only if "arp" is 'B')
          if (song.arp && (song.arp !== 'B' || sec === 'B')) {
            const up = [tri[0], tri[1], tri[2], tri[0] + 12, tri[2], tri[1]].map(m => m + 12);
            for (let st = 0; st < 16; st += 2) ev.push({ step: s0 + st, kind: 'pluck', midi: up[(st / 2) % up.length], len: 1, vol: 0.07, send: 0.25 });
          }
        }
      });
      song._events = ev.sort((a, b) => a.step - b.step);
      song._steps = form.length * 64;
      return ev;
    },
    play(name) {
      this.stop();
      const song = typeof name === 'object' ? name : this.songs[name];
      if (!song) return;
      const c = this.ensure(); if (!c) return;
      this.musicBus();
      const events = this.compose(song);
      const sixteenth = 60 / song.tempo / 4;
      this.bus.echo.delayTime.value = sixteenth * 3;      // echo in time with the beat
      const midi = n => 440 * Math.pow(2, (n - 69) / 12);
      let step = 0, idx = 0;
      let next = c.currentTime + 0.12;
      this.current = song;
      // schedule a little ahead of time so the music never stutters
      this.musicTimer = setInterval(() => {
        while (next < c.currentTime + 0.25) {
          const loopStep = step % song._steps;
          if (loopStep === 0) idx = 0;
          const swing = (loopStep % 2 === 1) ? (song.swing || 0) * sixteenth : 0;
          while (idx < events.length && events[idx].step === loopStep) {
            const e = events[idx++];
            this.voice(e.kind, e.midi ? midi(e.midi) : 0, next + swing, (e.len || 1) * sixteenth * 0.92, e.vol, e.send || 0);
          }
          step++; next += sixteenth;
        }
      }, 50);
    },
    stop() { clearInterval(this.musicTimer); this.musicTimer = null; this.current = null; },
    // play a song unless it's already playing (so moving between menus doesn't restart it)
    keepPlaying(name) {
      const song = typeof name === 'object' ? name : this.songs[name];
      if (song && this.current === song && this.musicTimer) return;
      this.play(name);
    },
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
    gift: S(`<rect x="8" y="20" width="32" height="22" rx="4" fill="#ef476f" stroke="#2b2b2b" stroke-width="4"/><rect x="6" y="14" width="36" height="9" rx="3" fill="#ff8fab" stroke="#2b2b2b" stroke-width="4"/><path d="M24 14 V42" stroke="#ffd166" stroke-width="5"/><path d="M24 14 C16 2 8 8 16 14 M24 14 C32 2 40 8 32 14" fill="none" stroke="#2b2b2b" stroke-width="3.5" stroke-linecap="round"/>`),
    map: S(`<path d="M6 12 L18 7 L30 12 L42 7 V36 L30 41 L18 36 L6 41 Z" fill="#bde0fe" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><path d="M18 7 V36 M30 12 V41" stroke="#2b2b2b" stroke-width="3"/><path d="M10 30 Q16 22 22 26 T36 18" fill="none" stroke="#ef476f" stroke-width="3" stroke-dasharray="3 3"/>`),
    help: S(`<circle cx="24" cy="24" r="19" fill="#4cc9f0" stroke="#2b2b2b" stroke-width="4"/><path d="M17.5 18.5 C17.5 10 30.5 10 30.5 18 C30.5 23 24 23.5 24 29" fill="none" stroke="#2b2b2b" stroke-width="4.5" stroke-linecap="round"/><circle cx="24" cy="36" r="3" fill="#2b2b2b"/>`),
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
  // A color mixed with white (k = 0..1), for soft backgrounds.
  function mixWhite(hex, k) {
    const n = parseInt(hex.replace('#', ''), 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
    const m = (c) => Math.round(c + (255 - c) * k).toString(16).padStart(2, '0');
    return '#' + m(r) + m(gg) + m(b);
  }

  function mixInk(hex, k) {   // darker version of a color (k = 0..1 toward black-ish ink)
    const n = parseInt(hex.replace('#', ''), 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
    const m = (c) => Math.round(c * (1 - k) + 30 * k).toString(16).padStart(2, '0');
    return '#' + m(r) + m(gg) + m(b);
  }

  // A game logo for the title screen, like a real game box:
  //  * a round badge with the game's picture inside, in front of a spinning starburst
  //  * the name in big chunky 3D letters (Lilita One font), slightly arched,
  //    with a color gradient, a thick outline and a shiny edge
  //  * an optional ribbon (tag) and twinkling sparkles
  //   Arcade.logo({ title: 'Treasure', title2: 'Trail', badge, colors: ['#ffe066', '#ff8c42'], tag: 'MINI' })
  // badge = SVG drawn in a 240x240 box (center 120,120) for the round badge
  // (older games pass `art` + `bg` instead: a 240x160 scene, zoomed to fit).
  // A two-word title is split onto two lines automatically.
  function logo(o) {
    const id = 'lg' + Math.random().toString(36).slice(2, 7);
    const [c1, c2] = o.colors || ['#ffe066', '#ff8c42'];
    let l1 = o.title, l2 = o.title2;
    if (!l2 && /\s/.test(l1)) { const w = l1.split(/\s+/); l1 = w[0]; l2 = w.slice(1).join(' '); }
    const deep = mixInk(c2, 0.55);                       // the 3D side of the letters
    const FONT = `'Lilita One', 'Arial Rounded MT Bold', 'Arial Black', sans-serif`;
    // one line of 3D text along a gentle arch
    let pathN = 0;
    const line = (text, y, bend) => {
      const size = Math.min(150, Math.round(1250 / Math.max(4, text.length)));
      const pid = id + 'p' + (pathN++);
      const tp = `<textPath href="#${pid}" startOffset="50%">${text}</textPath>`;
      let s = `<path id="${pid}" d="M20 ${y + bend} Q400 ${y - bend} 780 ${y + bend}" fill="none"/>`;
      const T = (attrs, dx = 0, dy = 0) => `<text text-anchor="middle" font-size="${size}" ${attrs} transform="translate(${dx} ${dy})">${tp}</text>`;
      s += T(`fill="#2b2b2b" stroke="#2b2b2b" stroke-width="26" stroke-linejoin="round"`, 0, 14);           // outline + shadow
      for (let k = 12; k > 0; k -= 2) s += T(`fill="${deep}" stroke="#2b2b2b" stroke-width="14" stroke-linejoin="round" paint-order="stroke fill"`, 0, k);   // 3D sides
      s += T(`fill="url(#${id}g)" stroke="#2b2b2b" stroke-width="12" stroke-linejoin="round" paint-order="stroke fill"`);   // face
      s += T(`fill="none" stroke="#ffffff" stroke-width="3" opacity="0.7"`, -2, -4);                       // shiny edge
      return s;
    };
    const tw = (x, y, k, sc = 1) => `<g transform="translate(${x} ${y}) scale(${sc})"><path class="lg-tw" style="animation-delay:${-k * 0.4}s" d="M0 -16 L4 -4 L16 0 L4 4 L0 16 L-4 4 L-16 0 L-4 -4 Z" fill="#fff" stroke="#2b2b2b" stroke-width="3"/></g>`;
    // the starburst behind the badge
    let burst = '';
    const N = 18, R1 = 205, R2 = 160;
    for (let i = 0; i < N * 2; i++) { const a = Math.PI * i / N, r = i % 2 ? R2 : R1; burst += (i ? 'L' : 'M') + (Math.cos(a) * r).toFixed(1) + ' ' + (Math.sin(a) * r).toFixed(1); }
    const H = 560, cy = 168;
    return `<svg viewBox="0 0 800 ${H}" role="img" aria-label="${o.title} ${o.title2 || ''}">
      <style>.lg-art{animation:lgBob 1.6s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:center}
      .lg-tw{animation:lgTw 1.1s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:center}
      .lg-spin{animation:lgSpin 24s linear infinite;transform-box:view-box;transform-origin:400px ${cy}px}
      .lg-title{animation:lgIn .7s cubic-bezier(.3,1.6,.5,1) both;transform-box:view-box;transform-origin:400px 420px}
      @keyframes lgBob{to{transform:translateY(-6px)}} @keyframes lgTw{from{transform:scale(.4)}to{transform:scale(1.15) rotate(25deg)}}
      @keyframes lgSpin{to{transform:rotate(360deg)}} @keyframes lgIn{from{transform:scale(.4) rotate(-6deg);opacity:0}}
      @media (prefers-reduced-motion: reduce){.lg-art,.lg-tw,.lg-spin,.lg-title{animation:none}}</style>
      <defs>
        <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mixWhite(c1, 0.55)}"/><stop offset="0.45" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
        <radialGradient id="${id}b" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${mixWhite(c1, 0.35)}"/><stop offset="1" stop-color="${c2}"/></radialGradient>
        <clipPath id="${id}c"><circle cx="400" cy="${cy}" r="118"/></clipPath>
      </defs>
      <g class="lg-spin"><path d="${burst}Z" transform="translate(400 ${cy})" fill="url(#${id}b)" stroke="#2b2b2b" stroke-width="6" stroke-linejoin="round" opacity="0.95"/></g>
      <g class="lg-art">
        <circle cx="400" cy="${cy + 8}" r="134" fill="#2b2b2b"/>
        <circle cx="400" cy="${cy}" r="134" fill="#ffffff" stroke="#2b2b2b" stroke-width="7"/>
        <g clip-path="url(#${id}c)"><rect x="270" y="${cy - 130}" width="260" height="260" fill="${o.bg || '#ffffff'}"/>
          ${o.badge ? `<g transform="translate(280 ${cy - 120})">${o.badge}</g>`       // a picture made for the round badge
                    : `<g transform="translate(${400 - 180} ${cy - 128}) scale(1.5)">${o.art}</g>`}</g>
        <circle cx="400" cy="${cy}" r="118" fill="none" stroke="#2b2b2b" stroke-width="6"/>
        <path d="M318 ${cy - 70} A105 105 0 0 1 400 ${cy - 108}" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity="0.6"/>
      </g>
      <g class="lg-title" font-family="${FONT}" letter-spacing="3">
        ${l2 ? line(l1, 368, 16) + line(l2, 498, 12) : line(l1, 440, 18)}
        ${o.tag ? `<g transform="translate(400 ${l2 ? 540 : 520})"><path d="M-150 -26 H150 L130 0 L150 26 H-150 L-130 0 Z" fill="#ef476f" stroke="#2b2b2b" stroke-width="6" stroke-linejoin="round"/><text y="12" font-size="34" text-anchor="middle" fill="#fff" stroke="#2b2b2b" stroke-width="7" paint-order="stroke fill">${o.tag}</text></g>` : ''}
      </g>
      ${tw(150, 120, 0, 1.2)}${tw(660, 80, 1, 1.4)}${tw(690, 250, 2)}${tw(110, 290, 3, 0.9)}
    </svg>`;
  }

  // A title screen that games outside the kit can use too (coloring book, maze):
  //   Arcade.titleScreen({ logo, background, music, onStart })
  // ------------------------------------------------------------------
  // Tap guard: right after the "Tap to start!" screen is tapped, ignore taps,
  // clicks and keys for half a second. Otherwise the same tap (or a second
  // excited one) lands on a menu button that just appeared under the finger.
  // ------------------------------------------------------------------
  let guardUntil = 0;
  function guardTaps(ms = 500) { guardUntil = performance.now() + ms; }
  for (const type of ['pointerdown', 'mousedown', 'touchstart', 'click', 'keydown']) {
    // "capture" = we see the event first, before any button does, and can swallow it
    addEventListener(type, (e) => {
      if (performance.now() < guardUntil) { e.stopImmediatePropagation(); if (e.cancelable && type !== 'touchstart') e.preventDefault(); }
    }, { capture: true, passive: false });
  }

  function titleScreen(o) {
    const el = h('div', { class: 'ar-titlescreen', style: `z-index:60;background:radial-gradient(circle at 50% 40%, ${mixWhite(o.background || '#4cc9f0', 0.45)} 0, ${o.background || '#4cc9f0'} 70%)` },
      `<div class="ar-logo">${o.logo}</div><div class="ar-tapstart">${icons.play}<span>${o.startText || 'Tap to start!'}</span></div>`);
    const go = (e) => {
      if (e.type === 'keydown' && (e.code === 'Escape' || e.metaKey || e.ctrlKey)) return;
      if (e.cancelable) e.preventDefault();
      removeEventListener('keydown', go);
      audio.resume(); audio.sfx('go');
      el.remove();
      guardTaps();
      if (o.onStart) o.onStart();
    };
    el.addEventListener('pointerdown', go);
    addEventListener('keydown', go);
    if (o.music) {
      audio.keepPlaying(o.music);
      const c = audio.ensure();
      if (c && c.state !== 'running') {
        const btn = h('button', { type: 'button', class: 'ar-titlemusic', 'aria-label': 'Music on' }, icons.music);
        btn.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); audio.resume(); audio.keepPlaying(o.music); btn.remove(); });
        el.appendChild(btn);
        c.onstatechange = () => { if (c.state === 'running') btn.remove(); };
      }
    }
    document.body.appendChild(el);
    return el;
  }

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
  //         (add flex: true, maxW: 1300 to let it stretch wider on wide screens; read g.W)
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
      // 'easy' | 'normal' | 'challenge' (games with `difficulty: false` are always 'normal')
      difficulty: config.difficulty === false ? 'normal' : settings.difficulty,
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
        toast('New: ' + label, icons.gift);
        return true;
      },
      isUnlocked(key) { return save.unlocked.includes(key); },
      // Trophies: one-time awards. If the game lists config.trophies, the trophy
      // room in the menu shows them (secret ones stay "???" until you earn them).
      achieve(key, label) {
        if (save.achievements.includes(key)) return;
        save.achievements.push(key); store.save();
        const tr = (config.trophies || []).find(t => t.id === key);
        toast((tr ? 'Trophy: ' + tr.name : label) + (tr && tr.secret ? ' (secret!)' : ''), icons.trophy);
      },
      hasTrophy: (key) => save.achievements.includes(key),
      finish: (result) => finish(result),
      play: (lv) => startLevel(lv),          // start a level right away (e.g. a custom one)
      panel: (el) => show(el),               // show a game's own menu panel
      hidePanel: () => hide(),
      pause: () => pause(),
      restart: () => restart(),
      menu: () => showLevels(),
      menuMusic: () => menuMusic(),          // start the menu song (e.g. in a game's own garage panel)
      help: () => show(howToPanel(() => showLevels(), 'Got it!')),   // the how-to-play pictures, then back to the menu
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
      // view.flex: the game can be drawn wider than view.w (up to view.maxW) so a
      // wide phone screen is filled edge to edge instead of showing bars on the sides
      if (config.view.flex) g.W = Math.round(Math.max(config.view.w, Math.min(config.view.maxW || config.view.w * 1.4, g.H * availW / availH)));
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
        let steps = 0;
        while (acc >= STEP) {
          steps++;
          g.time += STEP;
          config.update(g, STEP);
          g.particles.update(STEP);
          input.pointer.justDown = false;
          input.pointer.justUp = false;
          acc -= STEP;
          if (g.state !== 'play') { acc = 0; break; }
        }
        // forget taps the game didn't use — but only after the game has had a turn.
        // (On fast 120 Hz+ screens some frames run no game step at all; clearing then
        //  would swallow a jump press before the game ever saw it.)
        if (steps > 0) input.pressed.clear();
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
      // a game can make every panel the same size (config.panelClass adds its own CSS class)
      if (config.panelClass && panel.classList.contains('ar-panel')) panel.classList.add(...config.panelClass.split(' '));
      if (panel.classList.contains('ar-panel') && (!config.panelClass || panel.classList.contains('ar-results'))) panel.classList.add('ar-arcade');   // the dark arcade-cabinet look (results always get it)
      overlay.innerHTML = '';
      overlay.appendChild(panel);
      overlay.classList.add('show');
      document.body.classList.add('ar-menu-open');      // (hides the on-screen driving buttons)
      fitPanel();
    }
    // Make the open menu fit the screen: if it's taller or wider than the window
    // (phones held sideways!), shrink the whole panel evenly instead of cutting it off.
    // Games with their own panel sizing (config.panelClass, like RC) are left alone.
    function fitPanel() {
      const panel = overlay.firstElementChild;
      if (!panel || config.panelClass || !panel.classList.contains('ar-panel') || !overlay.classList.contains('show')) return;
      panel.style.zoom = 1;
      const pad = 20;
      const k = Math.min(1, (innerWidth - pad) / panel.offsetWidth, (innerHeight - pad) / panel.offsetHeight);
      panel.style.zoom = k < 0.98 ? k.toFixed(3) : 1;
    }
    addEventListener('resize', fitPanel);
    // menus that change inside (tabs, pickers) get re-fitted too
    new MutationObserver(() => requestAnimationFrame(fitPanel)).observe(overlay, { childList: true, subtree: true });
    function hide() { overlay.classList.remove('show'); overlay.innerHTML = ''; document.body.classList.remove('ar-menu-open'); }

    function howToPanel(then, label, noDiff) {
      const p = h('div', { class: 'ar-panel wide' });
      p.appendChild(h('h1', { class: 'ar-title' }, config.title));
      const steps = h('div', { class: 'ar-steps' });
      for (const s of config.howTo || []) {
        steps.appendChild(h('div', { class: 'ar-step' },
          `<div class="pic">${s.pic}</div><div>${s.text}</div>` + (s.keys ? `<div class="keys">${s.keys}</div>` : '')));
      }
      p.appendChild(steps);
      const btns = h('div', { class: 'ar-btns' });
      btns.appendChild(button(noDiff ? icons.left : icons.play, label || 'Play!', noDiff ? 'white' : 'big', then));
      p.appendChild(btns);
      return p;
    }

    // Level picker (only for games that have levels)
    function showLevels() {
      g.state = 'menu';
      if (config.menuMusic) menuMusic(); else stopPlay();
      // a game can draw its own main menu (with sub menus) instead of the level grid
      if (config.mainMenu) { config.mainMenu(g); return; }
      if (!config.levels) { startLevel(null); return; }
      // games with a logo get the video-game menu: one big START, everything else tucked away
      if (config.logo) { shellMenu(); return; }
      levelGrid();
    }
    // The old level picker (also the "Levels" page of the video-game menu).
    function levelGrid(onBack) {
      const p = h('div', { class: 'ar-panel wide' });
      p.appendChild(h('h1', { class: 'ar-title' }, config.levelsTitle || 'Pick a level'));
      const grid = h('div', { class: 'ar-grid' });
      let section = null;
      for (const lv of config.levels(g)) {
        // optional headings: give levels a `section` name to split the grid
        if (lv.section && lv.section !== section) {
          section = lv.section;
          grid.appendChild(h('h2', { class: 'ar-title', style: 'grid-column:1/-1;font-size:22px;margin:8px 0 0' }, section));
        }
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
      if (config.extraMenu && !onBack) p.appendChild(config.extraMenu(g));
      const btns = h('div', { class: 'ar-btns' });
      if (onBack) btns.appendChild(button(icons.left, 'Back', 'white', () => { audio.sfx('click'); onBack(); }));
      else btns.appendChild(button(icons.home, 'Arcade', 'white', () => { location.href = back.href; }));
      p.appendChild(btns);
      show(p);
    }

    // ---- the video-game menu: a big START that carries on where you left off ----
    function nextLevel(list) {
      const open = list.filter(l => !l.locked && !l.noStart);
      const todo = open.find(l => !(save.levels[l.id] || {}).done);
      if (todo) return { lv: todo, fresh: !open.some(l => (save.levels[l.id] || {}).done) };
      // everything finished: play the one with the fewest stars (go for gold!)
      let best = open[0], low = 9;
      for (const l of open) { const st = (save.levels[l.id] || {}).stars || 0; if (st < low) { low = st; best = l; } }
      return { lv: best, again: true };
    }
    // The title menu, like an old NES game: the logo with a short list under it.
    //   START / CONTINUE   - straight into the next level you haven't beaten
    //   LEVELS, UNLOCKS, TROPHIES, HELP - open their own page (Back comes here)
    //   ◀ NORMAL ▶         - tap (or Left/Right) to change the difficulty
    //   ARCADE             - back to the arcade
    // Pick with a tap, or with Up/Down + Enter/Space. Nothing pops up by itself.
    let menuKeys = null;
    function shellMenu() {
      g.state = 'title';
      if (menuKeys) removeEventListener('keydown', menuKeys);
      const list = config.levels(g);
      const nx = nextLevel(list);
      const el = h('div', { class: 'ar-titlescreen ar-nes', style: config.background ? `background:radial-gradient(circle at 50% 40%, ${mixWhite(config.background, 0.45)} 0, ${config.background} 70%)` : '' },
        `<div class="ar-logo">${config.logo}</div>`);
      const side = h('div', { class: 'ar-nesside' });
      const menu = h('div', { class: 'ar-nesmenu', role: 'menu' });
      const items = [];
      let sel = 0;
      const select = (i) => { sel = (i + items.length) % items.length; items.forEach((b, k) => b.classList.toggle('sel', k === sel)); };
      const leave = () => { if (menuKeys) { removeEventListener('keydown', menuKeys); menuKeys = null; } };
      const add = (label, fn, attr) => {
        const b = h('button', { type: 'button', class: 'ar-nesitem', role: 'menuitem' }, `<span class="cur"><svg viewBox="0 0 48 48"><path d="M10 6 L42 24 L10 42 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="6" stroke-linejoin="round"/></svg></span><span class="lbl">${label}</span>`);
        if (attr) b.setAttribute(attr, '1');
        b.addEventListener('click', () => { audio.resume(); select(items.indexOf(b)); fn(b); });
        b.addEventListener('pointerenter', () => select(items.indexOf(b)));
        menu.appendChild(b); items.push(b);
        return b;
      };
      const page = (fn) => () => { audio.sfx('click'); leave(); fn(); };
      const played = list.some(l => save.levels[l.id]);
      if (played) add('CONTINUE', () => { audio.sfx('go'); leave(); startLevel(nx.lv); }, 'data-start');
      add('NEW GAME', () => {
        if (!played) { audio.sfx('go'); leave(); startLevel(list[0]); return; }
        audio.sfx('click'); leave(); newGamePanel(list[0]);
      }, played ? 'data-new' : 'data-start');
      add((config.levelsWord || 'Levels').toUpperCase(), page(() => levelGrid(shellMenu)), 'data-levels');
      if (config.extraMenu) add('UNLOCKS', page(unlockPanel), 'data-unlocks');
      const trophies = config.trophies || [];
      if (trophies.length) add('TROPHIES', page(trophyPanel), 'data-trophies');
      if (config.howTo) add('HELP', page(() => show(howToPanel(() => shellMenu(), 'Got it!', true))), 'data-help');
      add('ARCADE', () => { leave(); location.href = back.href; });
      select(0);
      side.appendChild(menu);
      // progress: medals, stars, trophies (small, under the list)
      const sm = summary(config.id);
      const got = trophies.filter(t => save.achievements.includes(t.id)).length;
      const bits = [];
      if (sm.gold + sm.silver + sm.bronze) bits.push(icons.medal(sm.gold ? 'gold' : sm.silver ? 'silver' : 'bronze') + ' ' + (sm.gold + sm.silver + sm.bronze));
      if (sm.stars) bits.push(icons.star(true) + ' ' + sm.stars);
      if (trophies.length) bits.push(icons.trophy + ' ' + got + '/' + trophies.length);
      // progress + who is playing (the player only when there is more than one on this device), side by side
      const row = h('div', { class: 'ar-nesbits' });
      if (bits.length) row.appendChild(h('div', { class: 'ar-nesprog' }, bits.join('<span style="width:14px;display:inline-block"></span>')));
      if (profiles.list().length > 1) {
        const me = profiles.active();
        row.appendChild(h('div', { class: 'ar-player' }, profiles.avatar(me) + (me.name ? `<span>${escapeHTML(me.name)}</span>` : '')));
      }
      if (row.children.length) side.appendChild(row);
      el.appendChild(side);
      // keyboard / game-pad style controls
      menuKeys = (e) => {
        if (e.metaKey || e.ctrlKey) return;
        const c = e.code;
        if (c === 'ArrowUp' || c === 'KeyW') { select(sel - 1); audio.resume(); audio.sfx('click'); }
        else if (c === 'ArrowDown' || c === 'KeyS') { select(sel + 1); audio.resume(); audio.sfx('click'); }
        else if (c === 'Enter' || c === 'Space') items[sel].click();
        else return;
        e.preventDefault();
      };
      addEventListener('keydown', menuKeys);
      if (config.menuMusic) { menuMusic(); musicButton(el); }
      show(el);
    }
    // NEW GAME when you've already played: start again from level 1.
    // Level progress is wiped; trophies and unlocks are kept (kids worked hard for those!).
    function newGamePanel(first) {
      const p = h('div', { class: 'ar-panel' });
      p.appendChild(h('h1', { class: 'ar-title' }, 'New game?'));
      p.appendChild(h('p', { class: 'ar-sub' }, 'Start over from level 1. Your trophies and unlocks stay!'));
      const btns = h('div', { class: 'ar-btns' });
      btns.appendChild(button(icons.play, 'Yes!', 'big', () => {
        audio.sfx('go');
        for (const k of Object.keys(save.levels)) delete save.levels[k];
        store.save();
        startLevel(first);
      }));
      btns.appendChild(button(icons.left, 'Back', 'white', () => { audio.sfx('click'); shellMenu(); }));
      p.appendChild(btns);
      show(p);
    }
    // Browsers only allow sound after a tap, so if the music is blocked we show
    // a big speaker button: tapping it starts the music.
    function musicButton(el) {
      const c = audio.ensure();
      if (c && c.state !== 'running' && !settings.muted) {
        const btn = h('button', { type: 'button', class: 'ar-titlemusic', 'aria-label': 'Music on' }, icons.music);
        btn.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); audio.resume(); menuMusic(); btn.remove(); });
        el.appendChild(btn);
        c.onstatechange = () => { if (c.state === 'running') btn.remove(); };
      }
    }
    function unlockPanel() {
      const p = h('div', { class: 'ar-panel wide' });
      p.appendChild(h('h1', { class: 'ar-title' }, 'Unlocks'));
      p.appendChild(config.extraMenu(g));
      const btns = h('div', { class: 'ar-btns' });
      btns.appendChild(button(icons.left, 'Back', 'white', () => { audio.sfx('click'); shellMenu(); }));
      p.appendChild(btns);
      show(p);
    }
    function trophyPanel() {
      const trophies = config.trophies || [];
      const got = trophies.filter(t => save.achievements.includes(t.id)).length;
      const p = h('div', { class: 'ar-panel wide' });
      p.appendChild(h('h1', { class: 'ar-title' }, 'Trophies ' + got + '/' + trophies.length));
      const grid = h('div', { class: 'ar-grid ar-trophies' });
      for (const t of trophies) {
        const on = save.achievements.includes(t.id);
        const hidden = t.secret && !on;
        grid.appendChild(h('div', { class: 'ar-tile ar-trophy' + (on ? ' picked' : ' locked') },
          `<div class="pic">${hidden ? '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" fill="#cdb4db" stroke="#2b2b2b" stroke-width="4"/><text x="24" y="32" font-size="24" font-weight="900" text-anchor="middle" fill="#2b2b2b" font-family="sans-serif">?</text></svg>' : icons.trophy}</div>` +
          `<div>${hidden ? 'Secret!' : t.name}</div><div class="meta">${hidden ? 'Keep exploring…' : t.how || ''}</div>`));
      }
      p.appendChild(grid);
      const btns = h('div', { class: 'ar-btns' });
      btns.appendChild(button(icons.left, 'Back', 'white', () => { audio.sfx('click'); shellMenu(); }));
      p.appendChild(btns);
      show(p);
    }

    function titleScreen() {
      g.state = 'title';
      const el = h('div', { class: 'ar-titlescreen', style: config.background ? `background:radial-gradient(circle at 50% 40%, ${mixWhite(config.background, 0.45)} 0, ${config.background} 70%)` : '' },
        `<div class="ar-logo">${config.logo}</div><div class="ar-tapstart">${icons.play}<span>${config.startText || 'Tap to start!'}</span></div>`);
      const go = (e) => {
        if (e.type === 'keydown' && (e.code === 'Escape' || e.metaKey || e.ctrlKey)) return;
        if (e.cancelable) e.preventDefault();
        removeEventListener('keydown', go);
        el.removeEventListener('pointerdown', go);
        audio.resume();
        audio.sfx('go');
        guardTaps();          // half a second where nothing can be pressed by accident
        showLevels();
      };
      el.addEventListener('pointerdown', go);
      addEventListener('keydown', go);
      // Music right away. Browsers only allow sound after a tap/key, so if it's blocked
      // we show a big speaker button: tapping it starts the music and stays here.
      if (config.menuMusic) {
        menuMusic();
        const c = audio.ensure();
        if (c && c.state !== 'running' && !settings.muted) {
          const btn = h('button', { type: 'button', class: 'ar-titlemusic', 'aria-label': 'Music on' }, icons.music);
          btn.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); audio.resume(); menuMusic(); btn.remove(); });
          el.appendChild(btn);
          // (if the browser starts the sound by itself later, hide the button)
          c.onstatechange = () => { if (c.state === 'running') btn.remove(); };
        }
      }
      show(el);
    }

    let currentLevel = null;
    // Games get harder as you go: the first third of the levels play on Easy,
    // the middle third on Normal and the last third on Challenge. (A game can
    // decide for itself with config.levelDifficulty(level, g).)
    function autoDifficulty(lv) {
      if (config.difficulty === false || !lv) return 'normal';
      if (config.levelDifficulty) return config.levelDifficulty(lv, g);
      const list = config.levels ? config.levels(g).filter(l => !l.noStart) : [];
      const i = list.findIndex(l => l.id === lv.id);
      if (i < 0) return 'normal';
      const f = i / list.length;
      return f < 1 / 3 ? 'easy' : f < 2 / 3 ? 'normal' : 'challenge';
    }
    function startLevel(lv) {
      currentLevel = lv;
      g.difficulty = autoDifficulty(lv);
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
    function menuMusic() {
      if (config.menuMusic) audio.keepPlaying(typeof config.menuMusic === 'function' ? config.menuMusic(g) : config.menuMusic);
    }

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
      const btns = h('div', { class: 'ar-btns' });
      btns.appendChild(button(icons.play, 'Keep playing', 'big', resume));
      btns.appendChild(button(icons.again, 'Start over', 'yellow', restart));
      if (config.levels) btns.appendChild(button(icons.menu, config.levelsLabel || (config.logo ? 'Menu' : 'Levels'), 'blue', showLevels));
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
        // The results screen: a ribbon banner, big glowing stars, the score
        // counting up, and the game's facts as little chips.
        const p = h('div', { class: 'ar-panel ar-results ' + (result.win ? 'win' : 'lose') });
        p.appendChild(h('div', { class: 'ar-res-banner' }, `<span>${result.title || (result.win ? 'Hooray!' : 'Nice try!')}</span>`));
        if (result.medal) p.insertAdjacentHTML('beforeend', icons.medal(result.medal).replace('<svg', '<svg class="ar-medal"'));
        if (result.stars != null) {
          let s = '<div class="ar-bigstars">';
          for (let i = 0; i < 3; i++) s += icons.star(i < result.stars).replace('<svg', `<svg class="${i < result.stars ? 'on' : ''}" style="animation-delay:${0.25 + i * 0.25}s"`);
          p.insertAdjacentHTML('beforeend', s + '</div>');
          // a happy "ding" for each star as it lands
          for (let i = 0; i < result.stars; i++) setTimeout(() => audio.tone(660 + i * 220, 0.15, { type: 'triangle', vol: 0.25 }), 450 + i * 250);
        }
        if (result.score != null) {
          const sc = h('div', { class: 'ar-res-score' }, `<span class="lbl">SCORE</span><span class="num">0</span>` + (newBest ? '<span class="ar-res-best">NEW BEST!</span>' : ''));
          p.appendChild(sc);
          // count the score up like an arcade machine
          const num = sc.querySelector('.num'), to = result.score, t0 = performance.now();
          const tick = (now) => { const k = Math.min(1, (now - t0) / 900); num.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); };
          requestAnimationFrame(tick);
        } else if (newBest) p.appendChild(h('div', { class: 'ar-res-best solo' }, 'NEW BEST!'));
        if ((result.lines || []).length) {
          const chips = h('div', { class: 'ar-res-chips' });
          for (const line of result.lines) {
            if (line && typeof line === 'object') {          // { icon: '<svg…>', text: '22' }: a picture + a number
              chips.appendChild(h('span', { class: 'ar-chip ar-ichip' }, `${line.icon}<b>${line.text}</b>`));
              continue;
            }
            if (/^\s*<div/.test(line)) chips.insertAdjacentHTML('beforeend', line);      // a whole picture (like RC's podium)
            else chips.appendChild(h('span', { class: 'ar-chip' }, line));
          }
          p.appendChild(chips);
        }
        const btns = h('div', { class: 'ar-btns' });
        // a game can choose its own buttons: result.buttons = [{ icon, label, cls, onClick }]
        if (result.buttons) {
          for (const b of result.buttons) btns.appendChild(button(b.icon, b.label, b.cls, b.onClick));
          btns.appendChild(button(icons.home, 'Arcade', 'white', () => { location.href = back.href; }));
          p.appendChild(btns);
          show(p);
          if (config.onFinish) config.onFinish(g, result);
          return;
        }
        if (result.next && config.levels) btns.appendChild(button(icons.next, 'Next', 'big', () => {
          const all = config.levels(g);
          const i = all.findIndex(l => l.id === levelId);
          const nx = all[i + 1];
          if (nx && !nx.locked) startLevel(nx); else showLevels();
        }));
        btns.appendChild(button(icons.again, 'Again', result.next ? 'yellow' : 'big', restart));
        if (config.levels) btns.appendChild(button(icons.menu, config.levelsLabel || (config.logo ? 'Menu' : 'Levels'), 'blue', showLevels));
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
    // Games with a `logo` get a title screen instead: tap anywhere to start
    // (their how-to-play pictures then live behind a Help button, see g.help()).
    if (config.logo) titleScreen();
    else show(howToPanel(() => { audio.resume(); showLevels(); }));
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

  window.Arcade = { start, store, profiles, escapeHTML, audio, sfx: (n) => audio.sfx(n), Particles, draw, icons, math, toast, confetti, summary, starsHTML, h, logo, titleScreen, mixWhite };
})();
