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
      this.musicGain.gain.value = s.music * 0.7;
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

    // ---- Music: a little band made in the browser ----
    // A song is a short recipe (tempo, key, chords, drum style...). From it we
    // build a 16-bar tune (verse, verse, chorus, verse) with:
    //   drums (kick, snare, hi-hat, shaker, sleigh bells, claps),
    //   a bass line, soft chord pads, a sparkly arpeggio,
    //   and a lead melody made from the chords (with a bit of echo).
    // The melody is "composed" by a seeded random walk over the chord notes,
    // so the same recipe always plays the same tune.
    songs: {
      // recipe fields: tempo, root (MIDI note of the key), scale, prog (chord per bar,
      // as scale steps 1-7 for the verse and the chorus), drums, bass, lead (wave),
      // pad (true/false), arp (true/false), swing (0-0.3), seed, bells, octave
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
      this.bus = { comp, echo };
      return this.bus;
    },
    // One instrument note. kind decides the sound; send = how much echo.
    voice(kind, freq, t, len, vol, send = 0) {
      const c = this.ctx, bus = this.bus;
      const g = c.createGain();
      g.connect(bus.comp);
      if (send) { const s = c.createGain(); s.gain.value = send; g.connect(s).connect(bus.echo); }
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
      if (kind === 'lead-square' || kind === 'lead-saw' || kind === 'lead-triangle') {
        const type = kind.slice(5);
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = type === 'triangle' ? 6000 : 2600; f.Q.value = 1;
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
      } else if (kind === 'kick') {
        const o = osc('sine', 150);
        o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
        o.connect(g);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        o.start(t); o.stop(t + 0.32);
      } else {                              // noise drums: snare, clap, hats, shaker, bells
        const n = this.noiseBuf || (this.noiseBuf = (() => {
          const b = c.createBuffer(1, c.sampleRate, c.sampleRate), d = b.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; })());
        const src = c.createBufferSource(); src.buffer = n;
        const f = c.createBiquadFilter();
        const set = {
          snare: ['bandpass', 1800, 0.16], clap: ['bandpass', 1300, 0.12], hat: ['highpass', 7500, 0.035],
          open: ['highpass', 7000, 0.16], shaker: ['highpass', 5500, 0.05], bells: ['bandpass', 6500, 0.09],
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
        for (const n of phrases[sec]) ev.push({ step: base + n.step, kind: 'lead-' + (song.lead || 'square'), midi: note(n.deg, song.octave || 0) + (song.root >= 64 ? 0 : 12), len: n.len, vol: 0.12, send: 0.35 });
        for (let bar = 0; bar < 4; bar++) {
          const d = prog[bar], s0 = base + bar * 16;
          const tri = chordDeg(d).map(x => note(x));
          // drums (a little drum fill in the last bar of each section)
          for (const k in drums) for (let st = 0; st < 16; st++) {
            let hit = drums[k][st] === 'x';
            if (bar === 3 && k === 'S' && st >= 12) hit = true;
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
      // a game can make every panel the same size (config.panelClass adds its own CSS class)
      if (config.panelClass && panel.classList.contains('ar-panel')) panel.classList.add(...config.panelClass.split(' '));
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

    function howToPanel(then, label) {
      const p = h('div', { class: 'ar-panel wide' });
      p.appendChild(h('h1', { class: 'ar-title' }, config.title));
      const steps = h('div', { class: 'ar-steps' });
      for (const s of config.howTo || []) {
        steps.appendChild(h('div', { class: 'ar-step' },
          `<div class="pic">${s.pic}</div><div>${s.text}</div>` + (s.keys ? `<div class="keys">${s.keys}</div>` : '')));
      }
      p.appendChild(steps);
      if (config.difficulty !== false) p.appendChild(diffPicker());
      const btns = h('div', { class: 'ar-btns' });
      btns.appendChild(button(icons.play, label || 'Play!', 'big', then));
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
      if (config.extraMenu) p.appendChild(config.extraMenu(g));
      const btns = h('div', { class: 'ar-btns' });
      btns.appendChild(button(icons.home, 'Arcade', 'white', () => { location.href = back.href; }));
      p.appendChild(btns);
      show(p);
    }

    function titleScreen() {
      g.state = 'title';
      const el = h('div', { class: 'ar-titlescreen' },
        `<div class="ar-logo">${config.logo}</div><div class="ar-tapstart">${icons.play}<span>${config.startText || 'Tap to start!'}</span></div>`);
      const go = (e) => {
        if (e.type === 'keydown' && (e.code === 'Escape' || e.metaKey || e.ctrlKey)) return;
        if (e.cancelable) e.preventDefault();
        removeEventListener('keydown', go);
        el.removeEventListener('pointerdown', go);
        audio.resume();
        audio.sfx('go');
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
      if (config.difficulty !== false) {
        p.appendChild(h('p', { class: 'ar-sub', style: 'margin:12px 0 0' }, 'Difficulty (starts again)'));
        p.appendChild(diffPicker(() => { restart(); }));
      }
      const btns = h('div', { class: 'ar-btns' });
      btns.appendChild(button(icons.play, 'Keep playing', 'big', resume));
      btns.appendChild(button(icons.again, 'Start over', 'yellow', restart));
      if (config.levels) btns.appendChild(button(icons.menu, config.levelsLabel || 'Levels', 'blue', showLevels));
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
        if (config.levels) btns.appendChild(button(icons.menu, config.levelsLabel || 'Levels', 'blue', showLevels));
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

  window.Arcade = { start, store, audio, sfx: (n) => audio.sfx(n), Particles, draw, icons, math, toast, confetti, summary, starsHTML, h };
})();
