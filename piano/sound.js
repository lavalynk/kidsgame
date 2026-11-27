// =====================================================================
// Piano Star's instruments (Nov 27, 20-point plan #4: "a real piano").
//
//   window.PianoSound.play(inst, midi, vol, when, dest)  plays one note
//
// The instruments:
//   'piano'    = a REAL grand piano: 13 recordings (Salamander Grand Piano, see piano/samples/README.md),
//                played by Tone.js's Sampler, which speeds a recording up or slows it down a little for
//                the keys in between (one recording every 3 keys, so never more than 1.5 keys away)
//   'musicbox' = a tinkly music box (Tone.js FM synth: a pure tone + a bell-like "ting" on top)
//   'xylo'     = a wooden xylophone (a short bright knock)
//   'toy'      = the old home-made piano (made from scratch with Web Audio, in piano.js)
//
// Tone.js (arcade/tone.min.js, MIT, arcade/LIBRARIES.md) and the piano notes (piano/notes.js, the mp3s
// as text) are big, so they are NOT in the page's <script> list: load() fetches them after the menu is up.
// Until they're there (or if they never come, e.g. a very old browser), play() says false and piano.js
// plays its old home-made piano instead, so a key always makes a sound.
//
// Tone.js runs on the arcade's OWN audio context (Arcade.audio.ctx) and plays into its sound-effects
// knob, so the volume slider, the mute button and the room echo work just like for every other sound.
// =====================================================================
(function () {
  'use strict';
  const INSTRUMENTS = [
    { id: 'piano', name: 'Piano' },
    { id: 'musicbox', name: 'Music box' },
    { id: 'xylo', name: 'Xylophone' },
    { id: 'toy', name: 'Toy piano' },
  ];
  // the same ?v= as this file, so the service worker finds the saved copies (works offline)
  const ver = ((document.querySelector('script[src*="sound.js"]') || {}).src || '').split('?v=')[1] || '';
  const S = {
    tone: false, notes: false, ready: false, failed: false, loading: null,
    played: 0, fallback: 0,                       // (for the tests: notes played by Tone / by the old piano)
  };
  let T = null;                                   // window.Tone, once it's loaded and on our audio context
  const voices = new Map();                       // destination node -> { piano, musicbox, xylo }
  const buffers = {};                             // note name -> decoded AudioBuffer

  function addScript(src) {
    return new Promise((ok, no) => {
      const s = document.createElement('script');
      s.src = src + (ver ? '?v=' + ver : '');
      s.onload = ok; s.onerror = no;
      document.head.appendChild(s);
    });
  }
  // base64 text -> the bytes of an mp3 file
  function bytes(b64) {
    const bin = atob(b64), a = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return a.buffer;
  }
  // (Safari's older decodeAudioData only takes callbacks, not a promise)
  const decode = (c, data) => new Promise((ok, no) => {
    const p = c.decodeAudioData(data, ok, no);
    if (p && p.then) p.then(ok, no);
  });

  // Fetch Tone.js + the piano notes and get everything ready. Safe to call many times.
  function load() {
    if (S.loading) return S.loading;
    S.loading = (async () => {
      try {
        const c = Arcade.audio.ensure();
        if (!c) throw new Error('no Web Audio');
        await Promise.all([
          window.Tone ? null : addScript('../arcade/tone.min.js').then(() => { S.tone = true; }),
          window.PIANO_NOTES ? null : addScript('notes.js').then(() => { S.notes = true; }),
        ]);
        S.tone = !!window.Tone; S.notes = !!window.PIANO_NOTES;
        // Tone.js makes its own audio context when it starts; swap in ours (and close its own)
        const old = Tone.getContext();
        Tone.setContext(new Tone.Context({ context: c, lookAhead: 0, latencyHint: 'interactive' }));
        try { if (old && old.rawContext !== c) old.dispose(); } catch (e) { /* (it was never started) */ }
        T = window.Tone;
        // decode the 13 recordings
        await Promise.all(Object.entries(window.PIANO_NOTES).map(async ([name, b64]) => {
          buffers[name] = await decode(c, bytes(b64));
        }));
        S.ready = true;
      } catch (e) {
        S.failed = String(e && e.message || e);
        console.warn('Piano Star: the real piano could not load, using the home-made one', e);
      }
      return S.ready;
    })();
    return S.loading;
  }

  // Build the instruments for one destination (Arcade.audio.sfxGain, or the results screen's "hear it" bus)
  function voicesFor(dest) {
    let v = voices.get(dest);
    if (v) return v;
    v = {};
    v.piano = new T.Sampler({ urls: Object.assign({}, buffers), release: 0.9, curve: 'exponential' });
    v.piano.volume.value = 6;
    // music box: a pure tone with a bright metal "ting" (a 7x partial) that fades quickly
    v.musicbox = new T.PolySynth(T.FMSynth, {
      harmonicity: 7, modulationIndex: 3.2,
      oscillator: { type: 'sine' }, modulation: { type: 'sine' },
      envelope: { attack: 0.002, decay: 1.6, sustain: 0, release: 1.2 },
      modulationEnvelope: { attack: 0.002, decay: 0.3, sustain: 0, release: 0.3 },
    });
    v.musicbox.volume.value = 1;
    // xylophone: a wooden bar's knock (a 3x partial, quick) and a short ring
    v.xylo = new T.PolySynth(T.FMSynth, {
      harmonicity: 3, modulationIndex: 2.4,
      oscillator: { type: 'sine' }, modulation: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.55, sustain: 0, release: 0.4 },
      modulationEnvelope: { attack: 0.001, decay: 0.07, sustain: 0, release: 0.05 },
    });
    v.xylo.volume.value = 1;
    for (const k of ['piano', 'musicbox', 'xylo']) v[k].connect(dest);
    voices.set(dest, v);
    return v;
  }

  // Play one note. midi 60 = middle C; vol about 0.3 (like the old piano); when = seconds from now.
  // Returns false when this instrument can't play yet (then piano.js plays the old piano).
  function play(inst, midi, vol = 0.32, when = 0, dest) {
    const c = Arcade.audio.ctx;
    if (!S.ready || !T || inst === 'toy' || !c) { if (inst !== 'toy') S.fallback++; return false; }
    dest = dest || Arcade.audio.sfxGain;
    if (!dest) return false;
    try {
      const v = voicesFor(dest), t = c.currentTime + when + 0.005;
      const vel = Math.max(0.15, Math.min(1, vol / 0.32));
      if (inst === 'piano') {
        // a tap rings for a while, like a real piano key that's let go slowly (low notes ring longer)
        const ring = Math.max(0.9, 2.4 - (midi - 48) * 0.04);
        v.piano.triggerAttackRelease(T.Frequency(midi, 'midi').toNote(), ring, t, vel);
      } else {
        // the music box + xylophone sound an octave higher (small, tinkly things), like the real toys
        v[inst].triggerAttackRelease(T.Frequency(midi + 12, 'midi').toFrequency(), 0.25, t, vel);
      }
      S.played++;
      return true;
    } catch (e) {
      S.fallback++;
      return false;
    }
  }
  // the "hear it" bus is done: throw its instruments away
  function drop(dest) {
    const v = voices.get(dest);
    if (!v) return;
    voices.delete(dest);
    for (const k of Object.keys(v)) { try { v[k].dispose(); } catch (e) { /* (already gone) */ } }
  }

  window.PianoSound = {
    INSTRUMENTS, load, play, drop,
    ready: () => S.ready,
    info: () => ({ tone: S.tone, notes: S.notes, ready: S.ready, failed: S.failed, played: S.played, fallback: S.fallback,
      voices: voices.size, samples: Object.keys(buffers) }),
  };
})();
