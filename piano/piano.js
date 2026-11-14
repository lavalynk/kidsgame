// =====================================================================
// Piano Star — read the sheet music and play songs note by note.
//
// How it works:
//  * Each song is written as text, like real sheet music in a tiny code:
//      'E4q D4q C4h | ...'   = note name + octave + length, "|" = bar line
//    Lengths: w (whole, 4 beats)  h (half, 2)  q (quarter, 1)  e (eighth, ½)
//    s (sixteenth, ¼). A "." after it makes it dotted (1½ times as long).
//  * The notes are drawn on a staff (five lines, treble clef) and scroll
//    along. The next note to play glows; tap that key on the piano.
//  * Every note has a color (C red, D orange, E yellow, F green, G sky blue,
//    A blue, B purple), and the piano keys wear the same colors, so even kids
//    who can't read letters can follow along.
//  * No timer: you play at your own speed. Right first time = more points and
//    a streak bonus. A wrong key just plays its own note (it's a piano!) and
//    the right key starts to glow so you can find it.
//  * Finish the song and the piano plays it back to you in rhythm.
//  * Easy: the right key always glows. Normal: it glows after one miss.
//    Challenge: the note letters under the staff are hidden and the key glows
//    after two misses. Little kids (age preset) always get Easy.
//  * Two hands (Nov 14): some songs also have a left-hand part (`left` in
//    songs.js). They show two staves (treble on top, bass below) and a wider
//    piano (C3 to B4). Notes that start together form one "step": tap both
//    keys, in any order, and the song moves on.
//  * Free Play can record your own tune (red button) into one of 3 slots
//    (colored discs) and play it back (green button). Saved per player.
// =====================================================================
(function () {
  const { draw, icons, math } = Arcade;
  const D = draw;
  const W = 960, H = 540;
  const INK = '#2b2b2b';

  // ---------------------------------------------------------------
  // Notes, colors and the keyboard
  // ---------------------------------------------------------------
  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const COLORS = { C: '#ef476f', D: '#ff8c42', E: '#ffd166', F: '#06d6a0', G: '#4cc9f0', A: '#3a86ff', B: '#9b5de5' };
  // midi number of a note name like 'C4' or 'F#4' (C4 = middle C = 60)
  const midiOf = (name) => {
    const m = /^([A-G])(#?)(\d)$/.exec(name);
    return 12 * (+m[3] + 1) + SEMI[m[1]] + (m[2] ? 1 : 0);
  };
  // staff position counted in lines + spaces from a low C: C0 = 0, D0 = 1 ... C4 = 28
  const dnOf = (name) => LETTERS.indexOf(name[0]) + 7 * (+name[name.length - 1]);
  // The staff's bottom line: E4 in the treble clef, G2 in the bass clef
  const BOTTOM_DN = { treble: dnOf('E4'), bass: dnOf('G2') };

  // The piano: 12 white keys plus the black keys between them.
  // Treble songs use middle C (C4) up to G5; bass clef songs use the low piano, C3 up to G4.
  // Two-hands songs need two octaves (C3 to B4), so the piano gets 14 narrower white keys.
  const KEY_TOP = 344, KEY_H = H - KEY_TOP, BLACK_H = 122;
  let WHITES = [], BLACKS = [], KEYS = [], baseOct = 4;
  function buildKeys(base, count = 12) {
    baseOct = base;
    WHITES = []; BLACKS = [];
    const KEY_W = W / count, BLACK_W = KEY_W * 0.62;   // 12 keys: 80 wide; 14 keys: about 69
    for (let i = 0; i < count; i++) { const L = LETTERS[i % 7]; WHITES.push({ name: L + (base + Math.floor(i / 7)), letter: L, x: i * KEY_W, w: KEY_W, black: false }); }
    WHITES.forEach((k, i) => {
      if (i < WHITES.length - 1 && 'CDFGA'.includes(k.letter)) {
        BLACKS.push({ name: k.letter + '#' + k.name[1], letter: k.letter + '#', x: (i + 1) * KEY_W - BLACK_W / 2, w: BLACK_W, black: true });
      }
    });
    KEYS = WHITES.concat(BLACKS);
    KEYS.forEach(k => { k.midi = midiOf(k.name); k.down = 0; k.glow = 0; k.wiggle = 0; });
  }
  buildKeys(4);
  const keyByName = (n) => KEYS.find(k => k.name === n);
  // which key is under a point? (black keys sit on top, so check them first)
  function keyAt(x, y) {
    if (y < KEY_TOP) return null;
    for (const k of BLACKS) if (x >= k.x && x <= k.x + k.w && y <= KEY_TOP + BLACK_H) return k;
    return WHITES.find(k => x >= k.x && x < k.x + k.w) || null;
  }

  // ---------------------------------------------------------------
  // The songs live in songs.js (window.PianoSongs): 58 old songs that belong to everyone.
  // ---------------------------------------------------------------
  const SONGS = window.PianoSongs;
  const LEN = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25 };
  // Turn one line of song text into a list of notes: { name, beats, kind, dot, bar (a bar line before it), at }
  function parseLine(text, id) {
    const out = [];
    let bar = false;
    for (const tok of text.split(/\s+/)) {
      if (!tok) continue;
      if (tok === '|') { bar = true; continue; }
      const m = /^([A-G]#?\d)([whqes])(\.?)$/.exec(tok);
      if (!m) throw new Error('bad note ' + tok + ' in ' + id);
      out.push({ name: m[1], kind: m[2], dot: !!m[3], beats: LEN[m[2]] * (m[3] ? 1.5 : 1), bar });
      bar = false;
    }
    // where each note starts (in beats) for playing it back in rhythm
    let t = 0; for (const n of out) { n.at = t; t += n.beats; }
    return out;
  }
  // The whole song: a list of notes with their words. One-hand songs: one note per step.
  // Two-hands songs: each step = everything that starts at the same moment ({ parts: [right, left] }).
  function parseSong(song, playerName) {
    const out = parseLine(song.notes, song.id);
    const words = song.lyrics ? song.lyrics.split(/\s+/).filter(Boolean) : [];
    out.forEach((n, i) => { n.word = words[i] && words[i] !== '_' ? words[i] : ''; n.hand = 'R'; });   // '_' = no word here
    // Happy Birthday: sing it to the player (their name goes on the two "dear ..." notes)
    if (song.id === 'birthday' && playerName) { const i = words.indexOf('some-'); if (i >= 0) { out[i].word = playerName; out[i + 1].word = ''; } }
    if (!song.left) return out;
    const left = parseLine(song.left, song.id);
    left.forEach(n => { n.hand = 'L'; n.word = ''; });
    // group the right and left notes by when they start
    const byTime = new Map();
    for (const n of out.concat(left)) {
      const key = Math.round(n.at * 1000);
      if (!byTime.has(key)) byTime.set(key, { at: n.at, parts: [], bar: false, word: '' });
      const st = byTime.get(key);
      st.parts.push(n); st.bar = st.bar || n.bar; if (n.word) st.word = n.word;
    }
    const steps = [...byTime.values()].sort((a, b) => a.at - b.at);
    steps.forEach((st, i) => {
      // how long until the next step (for spacing on the paper); the last step lasts as long as its longest note
      st.beats = i < steps.length - 1 ? steps[i + 1].at - st.at : Math.max(...st.parts.map(p => p.beats));
      st.name = st.parts[0].name;            // (for the test hook: the first key of the step)
    });
    return steps;
  }
  // the notes to play in one step (a one-hand note is its own single part)
  const partsOf = (n) => n.parts || [n];

  // ---------------------------------------------------------------
  // A piano sound, made from scratch with Web Audio:
  // a bright "hammer" at the start that quickly mellows, then a long fade.
  // ---------------------------------------------------------------
  function pianoNote(midi, vol = 0.32, when = 0) {
    const A = Arcade.audio, c = A.ensure();
    if (!c || !A.sfxGain) return;
    const t = c.currentTime + when, f = 440 * Math.pow(2, (midi - 69) / 12);
    const decay = 1.9 - (midi - 60) * 0.03;            // high notes fade faster, like a real piano
    const out = c.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    out.gain.exponentialRampToValueAtTime(vol * 0.35, t + 0.35);
    out.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(5200, t); lp.frequency.exponentialRampToValueAtTime(1400, t + 0.4);
    lp.connect(out).connect(A.sfxGain);
    // three "strings": the note, its octave and a quiet twelfth on top
    [[1, 'triangle', 1], [2, 'sine', 0.35], [3, 'sine', 0.12]].forEach(([mul, type, v]) => {
      const o = c.createOscillator(), og = c.createGain();
      o.type = type; o.frequency.value = f * mul; o.detune.value = mul === 1 ? 0 : 3;
      og.gain.value = v;
      o.connect(og).connect(lp);
      o.start(t); o.stop(t + decay + 0.05);
    });
  }

  // ---------------------------------------------------------------
  // Game state
  // ---------------------------------------------------------------
  let song, notes, idx, misses, score, streak, bestStreak, firstTry, scroll, popups, mode, playT, playI, free, freeNotes, doneT, glowAfter, clef = 'treble';
  let twoHands = false;                               // a two-hands song (two staves, wider piano)
  let rec = null, tune = null, slot = 0;              // Free Play: recording, playing back a tune, which of the 3 slots
  // (before the first song starts, the menu sits over an empty piano)
  song = null; notes = []; idx = 0; misses = 0; score = 0; streak = 0; scroll = 0; popups = []; mode = 'play'; free = true; freeNotes = []; glowAfter = 0;
  const STAFF_X = 120, CURSOR_X = 300;                // notes scroll so the next one sits at CURSOR_X
  const LINE_GAP = 18, BOTTOM_LINE = 254;            // the staff: bottom line at y 254, lines 18 px apart
  // A staff = which note sits on its bottom line (dn) + where that line is on the screen (line).
  // One-hand songs have one staff; two-hands songs have the treble staff on top and the bass staff below
  // (middle C sits on a little line exactly between them).
  const STAFF_ONE = () => ({ dn: BOTTOM_DN[clef], line: BOTTOM_LINE });
  const STAFF_R = { dn: BOTTOM_DN.treble, line: 172, clef: 'treble' };
  const STAFF_L = { dn: BOTTOM_DN.bass, line: 280, clef: 'bass' };
  const staffOf = (n) => !twoHands ? STAFF_ONE() : n.hand === 'L' ? STAFF_L : STAFF_R;
  const staves = () => twoHands ? [STAFF_R, STAFF_L] : [Object.assign(STAFF_ONE(), { clef })];
  // how far up from the bottom line a note sits (0 = on the bottom line, 1 = the space above, 8 = top line)
  const posOf = (name, st = STAFF_ONE()) => dnOf(name.replace('#', '')) - st.dn;
  const yOf = (pos, st = STAFF_ONE()) => st.line - pos * LINE_GAP / 2;
  const gapOf = (n) => 54 + 30 * Math.min(n.beats, 3) + (n.bar ? 22 : 0);   // space a note takes on the paper

  function setup(g, level) {
    free = !!level.free;
    const me = Arcade.profiles.active();
    song = free ? null : SONGS.find(s => s.id === level.id);
    notes = free ? [] : parseSong(song, me.name);
    // bass clef songs show the bass clef and use the low piano (C3 to G4)
    clef = song && song.clef === 'bass' ? 'bass' : 'treble';
    twoHands = !!(song && song.left);
    // two hands: C3 up to B4 (14 white keys); bass clef: C3 to G4; treble: C4 to G5
    buildKeys(clef === 'bass' || twoHands ? 3 : 4, twoHands ? 14 : 12);
    // x position of every note on the paper
    let x = 0; for (const n of notes) { x += n.bar ? 22 : 0; n.x = x; x += gapOf(n) - (n.bar ? 22 : 0); }
    idx = 0; misses = 0; score = 0; streak = 0; bestStreak = 0; firstTry = 0; popups = [];
    scroll = notes.length ? notes[0].x - (CURSOR_X - STAFF_X) : 0;
    mode = 'play';                                  // 'play' | 'listen' (hear the song) | 'done' (confetti, then results)
    freeNotes = []; doneT = 0; rec = null; tune = null;
    if (!g.save.data.tunes) g.save.data.tunes = [[], [], []];   // the 3 recorded tunes: lists of [key, seconds]
    // when does the right key start to glow? (Easy: always; Normal: after 1 miss; Challenge: after 2)
    glowAfter = g.pick(0, 1, 2);
    KEYS.forEach(k => { k.down = 0; k.glow = 0; k.wiggle = 0; });
    window.__pianoState = () => {
      const left = notes[idx] ? partsOf(notes[idx]).filter(p => !p.hit).map(p => p.name) : [];
      return { song: song ? song.id : 'free', idx, total: notes.length, next: left[0] || null, nextAll: left,
        score, streak, firstTry, mode, difficulty: g.difficulty, glowAfter, freeCount: (g.save.data.freeNotes || 0),
        clef, twoHands, keys: [WHITES[0].name, WHITES[WHITES.length - 1].name], keyW: WHITES[0].w,
        recording: !!rec, recCount: rec ? rec.list.length : 0, playing: !!tune, slot, tunes: g.save.data.tunes.map(t => t.length) };
    };
    // test-only: press a key by name (the same as tapping it)
    window.__pianoPress = (name) => press(g, keyByName(name));
  }

  // ---------------------------------------------------------------
  // Pressing a key
  // ---------------------------------------------------------------
  function press(g, k) {
    if (!k) return;
    pianoNote(k.midi);
    k.down = 0.18;
    if (free) {
      if (rec) {
        // recording: write down the key and when it was played (the clock starts at the first note)
        if (rec.t0 == null) rec.t0 = g.time;
        rec.list.push([k.name, Math.round((g.time - rec.t0) * 100) / 100]);
        if (rec.list.length >= REC_MAX_NOTES) stopRecording(g);
      }
      freeNotes.push({ name: k.name, t: g.time });
      if (freeNotes.length > 40) freeNotes.shift();
      g.save.data.freeNotes = (g.save.data.freeNotes || 0) + 1;
      if (g.save.data.freeNotes >= 50) g.achieve('composer', 'Little composer!');
      if (g.save.data.freeNotes % 10 === 0) g.store();
      const kx = k.x + k.w / 2;
      g.particles.burst(kx, KEY_TOP - 6, { count: 6, colors: [COLORS[k.letter[0]], '#fff'], speed: 160, size: 6, life: 0.6, shape: 'star', angle: -Math.PI / 2, spread: 1 });
      return;
    }
    if (mode === 'listen') { stopListen(); return; }  // a tap stops the "listen" demo
    if (mode !== 'play' || idx >= notes.length) return;
    const want = notes[idx], parts = partsOf(want);
    const part = parts.find(p => p.name === k.name && !p.hit);
    if (part) {
      part.hit = true;
      if (parts.some(p => !p.hit)) {
        // two hands: one of the keys is done, a little sparkle, now the other one
        const st = staffOf(part);
        g.particles.burst(STAFF_X + want.x - scroll, yOf(posOf(part.name, st), st), { count: 6, colors: [COLORS[part.name[0]], '#fff'], speed: 140, size: 6, life: 0.5, shape: 'star' });
        return;
      }
      // right!
      const first = misses === 0;
      if (first) { firstTry++; streak++; bestStreak = Math.max(bestStreak, streak); } else streak = 0;
      const pts = first ? 100 + 10 * Math.min(streak - 1, 10) : 50;
      score += pts;
      want.done = true; want.firstTry = first;
      const nx = STAFF_X + want.x - scroll, ny = yOf(posOf(part.name, staffOf(part)), staffOf(part));
      g.particles.burst(nx, ny, { count: first ? 14 : 8, colors: [COLORS[want.name[0]], '#ffd166', '#fff'], speed: 220, size: 7, life: 0.7, shape: 'star' });
      popups.push({ text: '+' + pts, x: nx, y: ny - 40, t: 0, color: first ? '#ffd166' : '#fff' });
      if (streak > 0 && streak % 10 === 0) { popups.push({ text: streak + ' in a row!', x: W / 2, y: 330, t: 0, color: '#06d6a0', big: true }); g.sfx('star'); }
      misses = 0;
      idx++;
      if (idx >= notes.length) songDone(g);
    } else if (parts.some(p => p.name === k.name)) {
      // (that key of a two-hands step was already pressed: no harm done)
    } else {
      // not that one: the key wiggles, the right key starts to glow (after enough tries)
      misses++; streak = 0;
      k.wiggle = 0.4;
      g.tone(150, 0.12, { type: 'sine', vol: 0.12, delay: 0.05 });   // a soft "boop"
    }
  }

  // Song finished: confetti, then the results (with a button to hear the whole song).
  function songDone(g) {
    g.sfx('win');
    Arcade.confetti(90);
    g.achieve('first', 'First song!');
    if (firstTry === notes.length) g.achieve('perfect', 'Perfect song!');
    if (bestStreak >= 20) g.achieve('streak', '20 in a row!');
    // played every song?
    const doneIds = new Set(SONGS.filter(s => (g.save.levels[s.id] || {}).done).map(s => s.id)); doneIds.add(song.id);
    if (doneIds.size === SONGS.length) g.achieve('allsongs', 'Every song!');
    if (song.id === 'birthday') g.achieve('party', 'Party time!');
    if (twoHands) g.achieve('twohands', 'Two hands!');
    mode = 'done'; doneT = 1.2;                       // a moment for the confetti, then the results
  }
  function startPlayback(m) {
    mode = m; playT = -0.3; playI = 0;
  }
  // Play the whole song in rhythm, straight to the speakers (used by the results screen's
  // "hear it" button, where the game itself is paused). Tap again to stop it.
  let hearing = null;
  function hearSong(s) {
    const c = Arcade.audio.ensure(); if (!c) return;
    Arcade.audio.resume();
    if (hearing) { hearing.disconnect(); hearing = null; return; }      // second tap: stop
    const bus = c.createGain(); bus.connect(Arcade.audio.sfxGain);
    const real = Arcade.audio.sfxGain;
    Arcade.audio.sfxGain = bus;                      // (pianoNote plays into sfxGain, so route it through our own knob)
    const beat = 60 / s.tempo, list = parseSong(s, Arcade.profiles.active().name);
    for (const n of list) for (const p of partsOf(n)) pianoNote(midiOf(p.name), p.hand === 'L' ? 0.22 : 0.3, 0.15 + n.at * beat);
    Arcade.audio.sfxGain = real;
    hearing = bus;
    const end = list.length ? (list[list.length - 1].at + list[list.length - 1].beats) * beat + 2.5 : 0;
    setTimeout(() => { if (hearing === bus) { bus.disconnect(); hearing = null; } }, end * 1000);
  }
  const EAR = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 18 H14 L24 9 V39 L14 30 H6 Z" fill="#2b2b2b" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/><path d="M30 17 Q35 24 30 31 M35 12 Q44 24 35 36" fill="none" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/></svg>';
  function stopListen() {
    mode = 'play'; playI = 0;
    KEYS.forEach(k => { k.down = 0; });
  }
  // ---------------------------------------------------------------
  // Free Play: record your own tune and play it back.
  // A tune is a list of [key name, seconds after the first note], e.g. [['C4', 0], ['E4', 0.42]].
  // ---------------------------------------------------------------
  const REC_MAX_NOTES = 200, REC_MAX_TIME = 60;      // a tune can be up to 200 notes or 60 seconds
  function startRecording(g) {
    tune = null;
    rec = { list: [], t0: null };                    // the clock starts when the first key is played
    g.sfx('click');
  }
  function stopRecording(g) {
    const r = rec; rec = null;
    if (!r || !r.list.length) return;                // nothing played: keep the old tune in that slot
    g.save.data.tunes[slot] = r.list;
    g.store();
    g.sfx('star');
    popups.push({ text: '♪ ♫ ♪', x: SLOTS[slot].x, y: 110, t: 0, color: '#ffd166', big: true });
    if (r.list.length >= 5) g.achieve('recorder', 'My own tune!');
  }
  function playTune(g) {
    if (rec) stopRecording(g);
    const list = g.save.data.tunes[slot];
    if (!list || !list.length) return;
    tune = { list, i: 0, t: -0.2 };
  }
  // the buttons along the top in Free Play
  const REC = { x: 150, y: 44, r: 34 }, PLAY = { x: 236, y: 44, r: 34 };
  const SLOTS = [0, 1, 2].map(i => ({ x: 640 + i * 76, y: 44, r: 30, color: ['#ef476f', '#06d6a0', '#3a86ff'][i] }));
  const near = (P, b) => Math.hypot(P.x - b.x, P.y - b.y) < b.r + 8;
  // a tap on one of those buttons? (true = it was a button, not a piano key)
  function freeButtons(g, P) {
    if (near(P, REC)) { if (rec) stopRecording(g); else startRecording(g); return true; }
    if (near(P, PLAY)) { if (tune) tune = null; else playTune(g); return true; }
    const i = SLOTS.findIndex(b => near(P, b));
    if (i >= 0) {
      if (rec) stopRecording(g);                     // (finish the recording in the old slot first)
      slot = i; tune = null; g.sfx('click');
      if (g.save.data.tunes[i].length) playTune(g);  // a slot with a tune in it plays it straight away
      return true;
    }
    return false;
  }

  function finishSong(g) {
    const acc = firstTry / notes.length;
    const stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
    const medal = ['bronze', 'silver', 'gold'][stars - 1];
    if (stars === 3 && SONGS.every(s => s.id === song.id || ((g.save.levels[s.id] || {}).stars || 0) >= 3)) g.achieve('maestro', 'Piano star!');
    g.finish({
      win: true, score, stars, medal,
      title: stars === 3 ? 'Beautiful!' : stars === 2 ? 'Lovely playing!' : 'You played it!',
      lines: [`${firstTry} / ${notes.length} right first time`, bestStreak >= 3 ? `Best streak: ${bestStreak}` : ''].filter(Boolean),
      next: true, delay: 300,
      // a button to hear the whole song played on the piano (tap again to stop)
      extraButtons: [{ icon: EAR, label: 'Hear it', cls: 'pink', onClick: () => hearSong(song) }],
    });
  }

  // ---------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------
  function update(g, dt) {
    for (const k of KEYS) { k.down = Math.max(0, k.down - dt); k.wiggle = Math.max(0, k.wiggle - dt); }
    for (const p of popups) p.t += dt;
    popups = popups.filter(p => p.t < 1.1);

    // the Listen button (top, next to the home button)
    const P = g.input.pointer;
    if (P.justDown && !free && Math.hypot(P.x - LISTEN.x, P.y - LISTEN.y) < LISTEN.r + 8) {
      if (mode === 'listen') stopListen(); else if (mode === 'play') { g.sfx('click'); startPlayback('listen'); }
    } else if (P.justDown && free && freeButtons(g, P)) {
      // (a Free Play button: record, play or a tune slot)
    } else if (P.justDown) {
      press(g, keyAt(P.x, P.y));
    }
    // computer keyboard: the letter keys C D E F G A B play that note.
    // (it picks the octave of the note you need next, so Happy Birthday's high notes work too)
    for (const L of LETTERS) {
      if (g.input.hit('Key' + L)) {
        // (two hands: pick whichever key of the step has this letter and isn't pressed yet)
        const want = notes[idx] ? partsOf(notes[idx]).find(p => !p.hit && p.name[0] === L) : null;
        let name = L + baseOct;
        if (want) name = want.name;
        else if (free && (g.input.down('ShiftLeft', 'ShiftRight')) && keyByName(L + (baseOct + 1))) name = L + (baseOct + 1);
        press(g, keyByName(name));
      }
    }

    // song finished: wait for the confetti, then show the results
    if (mode === 'done') { doneT -= dt; if (doneT <= 0) { mode = 'over'; finishSong(g); } }
    // Listen: the piano plays the song in rhythm and the keys light up
    if (mode === 'listen') {
      playT += dt;
      const beat = 60 / song.tempo;
      while (playI < notes.length && playT >= notes[playI].at * beat) {
        const n = notes[playI];
        for (const p of partsOf(n)) {
          const k = keyByName(p.name);
          pianoNote(k.midi, p.hand === 'L' ? 0.2 : 0.28);
          k.down = Math.min(p.beats * beat, 0.4);
        }
        playI++;
      }
      const end = notes.length ? (notes[notes.length - 1].at + notes[notes.length - 1].beats) * beat : 0;
      if (playI >= notes.length && playT > end + 0.3) {
        stopListen();
      }
    }

    // Free Play: recording stops by itself after a minute
    if (rec && rec.t0 != null && g.time - rec.t0 > REC_MAX_TIME) stopRecording(g);
    // Free Play: playing back a recorded tune (the keys go down and the notes are written on the staff)
    if (tune) {
      tune.t += dt;
      while (tune.i < tune.list.length && tune.t >= tune.list[tune.i][1]) {
        const k = keyByName(tune.list[tune.i][0]);
        if (k) {
          pianoNote(k.midi, 0.28); k.down = 0.25;
          freeNotes.push({ name: k.name, t: g.time }); if (freeNotes.length > 40) freeNotes.shift();
          g.particles.burst(k.x + k.w / 2, KEY_TOP - 6, { count: 5, colors: [COLORS[k.letter[0]], '#fff'], speed: 140, size: 6, life: 0.5, shape: 'star', angle: -Math.PI / 2, spread: 1 });
        }
        tune.i++;
      }
      if (tune.i >= tune.list.length && tune.t > tune.list[tune.list.length - 1][1] + 1) tune = null;
    }
    // keep the next note at the cursor (smooth scrolling)
    if (!free && notes.length) {
      const showI = mode === 'listen' ? Math.max(0, playI - 1) : Math.min(idx, notes.length - 1);
      const target = notes[showI].x - (CURSOR_X - STAFF_X);
      scroll += (target - scroll) * Math.min(1, dt * 8);
    }
    // the glowing hint key
    for (const k of KEYS) k.glow = 0;
    if (!free && mode === 'play' && notes[idx] && misses >= glowAfter) for (const p of partsOf(notes[idx])) if (!p.hit) keyByName(p.name).glow = 1;
  }

  // ---------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------
  const LISTEN = { x: 150, y: 44, r: 34 };
  function render(g, ctx) {
    // background: soft music-room purple
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#5b43b0'); bg.addColorStop(1, '#2e2270');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    drawPaper(g, ctx);
    drawKeys(g, ctx);
    drawHud(g, ctx);
    for (const p of popups) {
      const a = 1 - p.t / 1.1;
      ctx.globalAlpha = Math.max(0, a);
      D.text(ctx, p.text, p.x, p.y - p.t * 40, { size: p.big ? 40 : 28, color: p.color });
      ctx.globalAlpha = 1;
    }
  }

  // the sheet music: a white paper card with the staff, clef, notes, letters and words
  function drawPaper(g, ctx) {
    const px = 16, py = 84, pw = W - 32, ph = 248;
    D.box(ctx, px, py, pw, ph, 22, '#fffdf5', 5);
    ctx.save();
    D.rr(ctx, px + 3, py + 3, pw - 6, ph - 6, 20); ctx.clip();
    // five staff lines (two sets of five for two hands)
    const SV = staves();
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    for (const st of SV) for (let i = 0; i < 5; i++) { const y = st.line - i * LINE_GAP; ctx.beginPath(); ctx.moveTo(px + 14, y); ctx.lineTo(px + pw - 14, y); ctx.stroke(); }
    const barTop = SV[0].line - 4 * LINE_GAP, barBottom = SV[SV.length - 1].line;   // bar lines go through every staff
    const bubbleY = twoHands ? 302 : 292, wordY = twoHands ? 323 : 318;
    // the cursor: a soft yellow column where the next note sits
    if (!free) {
      ctx.fillStyle = 'rgba(255, 209, 102, 0.35)';
      D.rr(ctx, CURSOR_X - 34, py + 12, 68, ph - 24, 18); ctx.fill();
    }
    // notes (clipped to the right of the clef)
    ctx.save();
    ctx.beginPath(); ctx.rect(STAFF_X - 4, py, pw, ph); ctx.clip();
    const showLetters = g.difficulty !== 'challenge' || free;
    const list = free ? freeLayout() : notes;
    const curI = free ? -1 : mode === 'listen' ? playI - 1 : idx;
    for (let i = 0; i < list.length; i++) {
      const n = list[i];
      const x = STAFF_X + n.x - (free ? 0 : scroll);
      if (x < STAFF_X - 60 || x > W + 60) continue;
      if (n.bar) {
        ctx.strokeStyle = INK; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x - 22, barBottom); ctx.lineTo(x - 22, barTop); ctx.stroke();
      }
      // colors: played notes and (on Easy) every note wear their color; Normal/Challenge upcoming notes are black
      const colored = free || n.done || g.difficulty === 'easy' || i === curI;
      const parts = partsOf(n);
      // (two hands: the left hand's letter bubble goes on the left, the right hand's on the right)
      const sorted = parts.length > 1 ? parts.slice().sort((a, b) => (a.hand === 'L' ? -1 : 1) - (b.hand === 'L' ? -1 : 1)) : parts;
      sorted.forEach((p, j) => {
        const col = COLORS[p.name[0]], on = colored || p.hit;
        drawNote(ctx, p, x, on ? col : INK, i === curI && !p.hit ? g.time : null, staffOf(p));
        // the letter in a colored bubble under the staff
        if (showLetters) {
          const bx = x + (sorted.length > 1 ? (j ? 16 : -16) : 0), r = sorted.length > 1 ? 13 : 15;
          D.circle(ctx, bx, bubbleY, r, on ? col : '#fff', 3);
          D.text(ctx, p.name[0], bx, bubbleY + 1, { size: r + 5, color: on && p.name[0] !== 'E' ? '#fff' : INK, stroke: false });
        }
      });
      // and the word under that
      if (n.word) D.text(ctx, n.word, x, wordY, { size: twoHands ? 15 : 17, color: INK, stroke: false });
    }
    ctx.restore();
    // the treble clef and time signature sit still at the left
    ctx.fillStyle = '#fffdf5'; ctx.fillRect(px + 6, py + 6, STAFF_X - px - 18, ph - 12);
    for (const st of SV) {
      for (let i = 0; i < 5; i++) { const y = st.line - i * LINE_GAP; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(px + 14, y); ctx.lineTo(STAFF_X - 12, y); ctx.stroke(); }
      if (st.clef === 'bass') drawBassClef(ctx, 44, st.line);
      else if (twoHands) {
        // (on two staves the treble clef is drawn a little smaller so its top curl fits on the paper)
        const gy = st.line - LINE_GAP;
        ctx.save(); ctx.translate(50, gy); ctx.scale(0.74, 0.74); ctx.translate(-50, -gy); drawClef(ctx, 50, st.line); ctx.restore();
      } else drawClef(ctx, 50, st.line);
      if (song) {
        const [a, b] = song.time.split('/');
        D.text(ctx, a, 94, st.line - 3 * LINE_GAP, { size: 34, color: INK, stroke: false });
        D.text(ctx, b, 94, st.line - 1 * LINE_GAP, { size: 34, color: INK, stroke: false });
      }
    }
    if (twoHands) {
      // the line at the start that joins the two staves (they're played together)
      ctx.strokeStyle = INK; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(px + 14, barTop); ctx.lineTo(px + 14, barBottom); ctx.stroke();
    }
    ctx.restore();
  }
  // Free play: the last notes you played, written down left to right
  function freeLayout() {
    const out = [], show = freeNotes.slice(-12);
    show.forEach((f, i) => out.push({ name: f.name, kind: 'q', dot: false, x: 40 + i * 66, done: true, bar: false, word: '' }));
    return out;
  }
  // One note: head (filled or hollow), stem, flags, dot, ledger line, sharp sign
  function drawNote(ctx, n, x, color, pulse, st = STAFF_ONE()) {
    const yOf = (p) => st.line - p * LINE_GAP / 2;      // (y on this note's own staff)
    const pos = posOf(n.name, st), y = yOf(pos);
    if (pulse != null) {                               // the next note glows and bobs
      ctx.fillStyle = 'rgba(255, 209, 102, 0.6)';
      ctx.beginPath(); ctx.arc(x, y, 24 + Math.sin(pulse * 6) * 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    // little ledger lines for notes below or above the five lines (like middle C)
    for (let l = -2; l >= pos; l -= 2) { ctx.beginPath(); ctx.moveTo(x - 20, yOf(l)); ctx.lineTo(x + 20, yOf(l)); ctx.stroke(); }
    for (let l = 10; l <= pos; l += 2) { ctx.beginPath(); ctx.moveTo(x - 20, yOf(l)); ctx.lineTo(x + 20, yOf(l)); ctx.stroke(); }
    const hollow = n.kind === 'h' || n.kind === 'w';
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.35);
    ctx.beginPath(); ctx.ellipse(0, 0, 12.5, 9, 0, 0, Math.PI * 2);
    if (hollow) {
      ctx.fillStyle = color === INK ? '#fffdf5' : color; ctx.fill();
      ctx.lineWidth = 4; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 0, 6, 3.4, 0, 0, Math.PI * 2); ctx.fillStyle = '#fffdf5'; ctx.fill();
    } else { ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); }
    ctx.restore();
    if (n.name.includes('#')) D.text(ctx, '#', x - 26, y, { size: 24, color: INK, stroke: false });
    if (n.kind !== 'w') {
      // stems go up on the low notes (right side) and down from the middle line up (left side)
      const stem = twoHands ? 50 : 60;                 // (a bit shorter when two staves share the paper)
      const up = pos < 4, sx = up ? x + 11 : x - 11, sy = up ? y - stem : y + stem;
      ctx.strokeStyle = INK; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sx, y + (up ? -2 : 2)); ctx.lineTo(sx, sy); ctx.stroke();
      const flags = n.kind === 'e' ? 1 : n.kind === 's' ? 2 : 0;
      for (let f = 0; f < flags; f++) {
        const fy = sy + (up ? f * 12 : -f * 12), d = up ? 1 : -1;
        ctx.beginPath(); ctx.moveTo(sx, fy);
        ctx.bezierCurveTo(sx + 4, fy + 14 * d, sx + 20, fy + 18 * d, sx + 12, fy + 34 * d);
        ctx.lineWidth = 3.5; ctx.stroke();
      }
    }
    if (n.dot) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + 20, y - (pos % 2 === 0 ? 5 : 0), 3.8, 0, Math.PI * 2); ctx.fill(); }
  }
  // A bass (F) clef: a curl that starts with a dot on the F line, plus two dots
  // either side of the F line (the fourth line up)
  function drawBassClef(ctx, x, bottom) {
    const f = bottom - 3 * LINE_GAP;           // the F line
    ctx.save();
    ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x - 8, f, 7, 0, Math.PI * 2); ctx.fill();          // the big dot
    ctx.beginPath();
    ctx.moveTo(x - 14, f - 2);
    ctx.bezierCurveTo(x - 12, f - 24, x + 26, f - 26, x + 24, f + 4);           // over the top
    ctx.bezierCurveTo(x + 22, f + 30, x + 2, f + 50, x - 16, f + 60);           // and sweeping down
    ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 32, f - LINE_GAP / 2, 4.5, 0, Math.PI * 2); ctx.fill();   // the two little dots
    ctx.beginPath(); ctx.arc(x + 32, f + LINE_GAP / 2, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // A treble (G) clef drawn with curves; its curl wraps around the G line
  function drawClef(ctx, x, bottom) {
    const g = bottom - LINE_GAP;               // the G line (second line up)
    ctx.save();
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 6, g + 6);                                                     // start in the middle of the curl
    ctx.bezierCurveTo(x - 4, g + 8, x - 6, g - 10, x + 6, g - 14);               // curl round the G line
    ctx.bezierCurveTo(x + 22, g - 18, x + 26, g + 20, x + 4, g + 22);             // round the bottom
    ctx.bezierCurveTo(x - 20, g + 22, x - 22, g - 10, x - 2, g - 34);             // big swoop up the left
    ctx.bezierCurveTo(x + 14, g - 52, x + 18, g - 80, x + 8, g - 88);             // up to the top loop
    ctx.bezierCurveTo(x - 2, g - 92, x - 8, g - 70, x + 2, g - 50);              // the top loop comes back
    ctx.lineTo(x + 12, g + 46);                                                   // the long line down
    ctx.bezierCurveTo(x + 14, g + 62, x - 6, g + 64, x - 6, g + 52);             // the hook at the bottom
    ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x - 3, g + 50, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // The piano keyboard
  function drawKeys(g, ctx) {
    ctx.fillStyle = INK; ctx.fillRect(0, KEY_TOP - 8, W, 8);
    for (const k of WHITES) drawKey(g, ctx, k);
    for (const k of BLACKS) drawKey(g, ctx, k);
  }
  function drawKey(g, ctx, k) {
    const press = k.down > 0 ? 6 : 0;
    const wig = k.wiggle > 0 ? Math.sin(k.wiggle * 50) * 4 * (k.wiggle / 0.4) : 0;
    const x = k.x + 2 + wig, y = KEY_TOP + press, w = k.w - 4, h = (k.black ? BLACK_H : KEY_H - 4) - press;
    const col = COLORS[k.letter[0]];
    // glow behind the hint key (a soft pulsing halo + a bouncing arrow)
    if (k.glow) {
      const pulse = 0.5 + 0.5 * Math.sin(g.time * 7);
      ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 30 + 20 * pulse;
      ctx.fillStyle = col; D.rr(ctx, x - 2, y - 2, w + 4, h + 4, 12); ctx.fill(); ctx.restore();
    }
    ctx.fillStyle = k.black ? (k.down > 0 ? '#555' : '#2b2b2b') : k.down > 0 ? mix(col, 0.55) : k.glow ? mix(col, 0.7) : '#fff';
    D.rr(ctx, x, y - 8, w, h + 8, 12); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke();
    if (!k.black) {
      // the colored tab with the letter at the bottom of each white key
      D.circle(ctx, x + w / 2, y + h - 40, 25, col, 4);
      D.text(ctx, k.letter, x + w / 2, y + h - 39, { size: 28, color: k.letter === 'E' ? INK : '#fff', stroke: false });
    } else {
      // a small colored stripe so black keys also feel friendly
      ctx.fillStyle = col; D.rr(ctx, x + 10, y + h - 22, w - 20, 10, 5); ctx.fill();
    }
    if (k.glow) {
      // a bouncing gold ring around the letter (or a gold dot on a black key) says "this one!"
      const r = 32 + Math.sin(g.time * 8) * 4;
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.arc(x + w / 2, k.black ? y + h - 50 : y + h - 40, k.black ? 14 : r, 0, Math.PI * 2); ctx.stroke();
    }
  }
  // mix a color with white (0 = color, 1 = white)
  function mix(hex, f) {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
    const m = (v) => Math.round(v + (255 - v) * f);
    return `rgb(${m(r)},${m(gg)},${m(b)})`;
  }
  function drawHud(g, ctx) {
    // the song name at the top
    D.text(ctx, free ? 'Free Play' : song.name, W / 2, 30, { size: song && song.name.length > 20 ? 28 : 32, color: '#ffd166' });
    if (!free) {
      // progress: a bar of how much of the song is played
      D.meter(ctx, W / 2 - 160, 54, 320, 18, notes.length ? idx / notes.length : 0, '#06d6a0');
      D.text(ctx, String(score), W - 160, 42, { size: 30, color: '#fff' });
      // the Listen button (an ear-ish speaker with sound waves)
      const on = mode === 'listen';
      D.circle(ctx, LISTEN.x, LISTEN.y, LISTEN.r, on ? '#ffd166' : '#fff', 4);
      ctx.save(); ctx.translate(LISTEN.x - 4, LISTEN.y);
      ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(-16, -7); ctx.lineTo(-7, -7); ctx.lineTo(4, -16); ctx.lineTo(4, 16); ctx.lineTo(-7, 7); ctx.lineTo(-16, 7); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      for (const r of [10, 18]) { ctx.beginPath(); ctx.arc(6, 0, r, -0.8, 0.8); ctx.stroke(); }
      ctx.restore();
    } else {
      drawFreeButtons(g, ctx);
    }
  }
  // Free Play's buttons: record (red), play (green) and the 3 tune slots (colored discs, like little records)
  function drawFreeButtons(g, ctx) {
    const tunes = g.save.data.tunes || [[], [], []];      // (before Free Play has ever started there are none)
    const pulse = 0.5 + 0.5 * Math.sin(g.time * 6);
    // record: a red dot; while recording the button turns red with a white "stop" square, and a ring shows the time left
    D.circle(ctx, REC.x, REC.y, REC.r + (rec ? pulse * 3 : 0), rec ? '#ef476f' : '#fff', 4);
    if (rec) {
      ctx.fillStyle = '#fff'; D.rr(ctx, REC.x - 12, REC.y - 12, 24, 24, 5); ctx.fill();
      const used = rec.t0 == null ? 0 : Math.max((g.time - rec.t0) / REC_MAX_TIME, rec.list.length / REC_MAX_NOTES);
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(REC.x, REC.y, REC.r + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - Math.min(1, used))); ctx.stroke();
    } else {
      D.circle(ctx, REC.x, REC.y, 15, '#ef476f', 3);
    }
    // play: a green triangle (a stop square while a tune plays); faded when the slot has no tune yet
    const has = tunes[slot] && tunes[slot].length;
    ctx.globalAlpha = has || tune ? 1 : 0.45;
    D.circle(ctx, PLAY.x, PLAY.y, PLAY.r, tune ? '#06d6a0' : '#fff', 4);
    ctx.fillStyle = tune ? '#fff' : '#06d6a0'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    if (tune) { D.rr(ctx, PLAY.x - 12, PLAY.y - 12, 24, 24, 5); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(PLAY.x - 9, PLAY.y - 15); ctx.lineTo(PLAY.x + 15, PLAY.y); ctx.lineTo(PLAY.x - 9, PLAY.y + 15); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // the 3 slots: the picked one has a gold ring; a slot with a tune in it shows a music note
    SLOTS.forEach((b, i) => {
      if (i === slot) { ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 7, 0, Math.PI * 2); ctx.stroke(); }
      const full = tunes[i] && tunes[i].length;
      D.circle(ctx, b.x, b.y, b.r, full ? b.color : '#fff', 4);
      D.circle(ctx, b.x, b.y, 9, full ? '#fff' : b.color, 3);                      // the record's middle
      if (full) {
        ctx.save(); ctx.translate(b.x + 13, b.y - 14);
        ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.fillStyle = INK;
        ctx.beginPath(); ctx.moveTo(4, 8); ctx.lineTo(4, -10); ctx.lineTo(11, -6); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, 9, 5, 4, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    });
  }

  // ---------------------------------------------------------------
  // Levels: every song (all open, it's a calm game) + Free Play
  // ---------------------------------------------------------------
  const S = (inner) => `<svg viewBox="0 0 80 80">${inner}</svg>`;
  const L4 = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
  const PICS = {
    buns: S(`<ellipse cx="40" cy="46" rx="28" ry="20" fill="#e0a465" ${L4}/><path d="M24 40 L56 52 M56 40 L24 52" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`),
    mary: S(`<circle cx="40" cy="44" r="22" fill="#fff" ${L4}/><circle cx="26" cy="32" r="10" fill="#fff" ${L4}/><circle cx="54" cy="32" r="10" fill="#fff" ${L4}/><ellipse cx="40" cy="48" rx="12" ry="11" fill="#ffd6a5" ${L4}/><circle cx="35" cy="46" r="2.5" fill="#2b2b2b"/><circle cx="45" cy="46" r="2.5" fill="#2b2b2b"/>`),
    twinkle: S(`<path d="M40 8 L49 30 L72 31 L54 46 L60 70 L40 56 L20 70 L26 46 L8 31 L31 30 Z" fill="#ffd166" ${L4}/><circle cx="34" cy="40" r="3" fill="#2b2b2b"/><circle cx="46" cy="40" r="3" fill="#2b2b2b"/><path d="M35 49 Q40 53 45 49" fill="none" ${L4} stroke-width="3"/>`),
    london: S(`<path d="M6 40 Q40 18 74 40" fill="none" ${L4} stroke-width="6"/><path d="M6 40 H74 V50 H6 Z" fill="#c68b59" ${L4}/><path d="M18 50 V66 M40 50 V66 M62 50 V66" ${L4} stroke-width="6"/><rect x="0" y="62" width="80" height="18" fill="#4cc9f0"/>`),
    jingle: S(`<path d="M22 54 Q22 26 40 24 Q58 26 58 54 Z" fill="#ffd166" ${L4}/><rect x="16" y="52" width="48" height="8" rx="4" fill="#ffd166" ${L4}/><circle cx="40" cy="64" r="6" fill="#ef476f" ${L4}/><path d="M34 22 Q40 10 46 22" fill="none" stroke="#06d6a0" stroke-width="6" stroke-linecap="round"/>`),
    ode: S(`<path d="M28 58 V18 L60 12 V50" fill="none" ${L4} stroke-width="5"/><ellipse cx="22" cy="58" rx="9" ry="7" fill="#9b5de5" ${L4}/><ellipse cx="54" cy="50" rx="9" ry="7" fill="#9b5de5" ${L4}/>`),
    row: S(`<rect x="0" y="52" width="80" height="28" fill="#4cc9f0"/><path d="M12 46 H68 L58 60 H22 Z" fill="#ef476f" ${L4}/><path d="M40 46 V14 L60 40 Z" fill="#fff" ${L4}/><path d="M6 66 Q14 60 22 66 Q30 72 38 66" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`),
    birthday: S(`<rect x="14" y="40" width="52" height="28" rx="6" fill="#ffafcc" ${L4}/><path d="M14 50 Q22 56 30 50 Q38 56 46 50 Q54 56 66 50" fill="none" stroke="#fff" stroke-width="5"/><rect x="36" y="20" width="8" height="20" rx="3" fill="#4cc9f0" ${L4}/><path d="M40 6 Q48 14 40 18 Q32 14 40 6 Z" fill="#ffd166" ${L4} stroke-width="3"/>`),
    free: S(`<rect x="6" y="20" width="68" height="44" rx="6" fill="#fff" ${L4}/><path d="M23 20 V64 M40 20 V64 M57 20 V64" ${L4} stroke-width="3"/><rect x="18" y="20" width="10" height="24" rx="2" fill="#2b2b2b"/><rect x="35" y="20" width="10" height="24" rx="2" fill="#2b2b2b"/><rect x="52" y="20" width="10" height="24" rx="2" fill="#2b2b2b"/>`),
    rain: S(`<path d="M18 38 Q14 22 30 22 Q34 10 48 14 Q62 12 62 26 Q74 28 68 40 Z" fill="#bde0fe" ${L4}/>${[22, 40, 58].map(x => `<path d="M${x} 50 Q${x - 5} 60 ${x} 64 Q${x + 5} 60 ${x} 50 Z" fill="#4cc9f0" ${L4} stroke-width="3"/>`).join('')}`),
    duck: S(`<ellipse cx="38" cy="52" rx="26" ry="16" fill="#ffd166" ${L4}/><circle cx="54" cy="30" r="13" fill="#ffd166" ${L4}/><path d="M64 30 L76 33 L64 37 Z" fill="#ff8c42" ${L4} stroke-width="3"/><circle cx="56" cy="27" r="3" fill="#2b2b2b"/><path d="M24 50 Q34 42 44 50" fill="none" ${L4} stroke-width="3"/>`),
    frog: S(`<ellipse cx="40" cy="50" rx="30" ry="20" fill="#7bd389" ${L4}/><circle cx="26" cy="28" r="11" fill="#7bd389" ${L4}/><circle cx="54" cy="28" r="11" fill="#7bd389" ${L4}/><circle cx="26" cy="28" r="5" fill="#2b2b2b"/><circle cx="54" cy="28" r="5" fill="#2b2b2b"/><path d="M26 52 Q40 62 54 52" fill="none" ${L4} stroke-width="3"/>`),
    abc: S(`<rect x="6" y="30" width="22" height="22" rx="4" fill="#ef476f" ${L4} stroke-width="3"/><rect x="29" y="18" width="22" height="22" rx="4" fill="#ffd166" ${L4} stroke-width="3"/><rect x="52" y="34" width="22" height="22" rx="4" fill="#4cc9f0" ${L4} stroke-width="3"/>` +
      `<text x="17" y="47" font-size="16" font-weight="900" text-anchor="middle" fill="#fff" font-family="sans-serif">A</text><text x="40" y="35" font-size="16" font-weight="900" text-anchor="middle" fill="#2b2b2b" font-family="sans-serif">B</text><text x="63" y="51" font-size="16" font-weight="900" text-anchor="middle" fill="#fff" font-family="sans-serif">C</text>`),
    clock: S(`<rect x="22" y="8" width="36" height="66" rx="6" fill="#c68b59" ${L4}/><circle cx="40" cy="30" r="14" fill="#fff" ${L4} stroke-width="3"/><path d="M40 30 V21 M40 30 L47 33" ${L4} stroke-width="3"/><circle cx="40" cy="56" r="7" fill="#ffd166" ${L4} stroke-width="3"/>`),
    spider: S(`<path d="M40 4 V30" stroke="#2b2b2b" stroke-width="2"/><path d="M28 34 L10 26 M28 42 L8 44 M28 50 L12 62 M52 34 L70 26 M52 42 L72 44 M52 50 L68 62" ${L4} stroke-width="3"/><circle cx="40" cy="44" r="16" fill="#9b5de5" ${L4}/><circle cx="34" cy="42" r="3" fill="#fff"/><circle cx="46" cy="42" r="3" fill="#fff"/><path d="M35 50 Q40 54 45 50" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`),
    bell: S(`<path d="M22 54 Q22 26 40 24 Q58 26 58 54 Z" fill="#ffd166" ${L4}/><rect x="16" y="52" width="48" height="8" rx="4" fill="#ffd166" ${L4}/><circle cx="40" cy="64" r="6" fill="#ef476f" ${L4}/><path d="M34 22 Q40 10 46 22" fill="none" stroke="#ef476f" stroke-width="6" stroke-linecap="round"/>`),
    tree: S(`<path d="M40 6 L64 40 H52 L70 62 H10 L28 40 H16 Z" fill="#06d6a0" ${L4}/><rect x="34" y="62" width="12" height="12" fill="#c68b59" ${L4} stroke-width="3"/><circle cx="32" cy="48" r="4" fill="#ef476f"/><circle cx="48" cy="34" r="4" fill="#ffd166"/><circle cx="52" cy="54" r="4" fill="#4cc9f0"/>`),
    flower: S(`${[0, 72, 144, 216, 288].map(a => `<circle cx="${40 + Math.cos(a * Math.PI / 180) * 16}" cy="${36 + Math.sin(a * Math.PI / 180) * 16}" r="11" fill="#ffafcc" ${L4} stroke-width="3"/>`).join('')}<circle cx="40" cy="36" r="9" fill="#ffd166" ${L4} stroke-width="3"/><path d="M40 52 V76" stroke="#06d6a0" stroke-width="5"/>`),
    heart: S(`<path d="M40 70 C10 48 8 26 22 18 C32 12 40 22 40 28 C40 22 48 12 58 18 C72 26 70 48 40 70 Z" fill="#ef476f" ${L4}/>`),
    mouse: S(`<circle cx="22" cy="28" r="12" fill="#c9c9d6" ${L4}/><circle cx="58" cy="28" r="12" fill="#c9c9d6" ${L4}/><circle cx="40" cy="46" r="22" fill="#c9c9d6" ${L4}/><rect x="24" y="36" width="32" height="10" rx="5" fill="#2b2b2b"/><circle cx="40" cy="56" r="4" fill="#ef476f"/>`),
    blocks: S(`<rect x="8" y="44" width="20" height="20" fill="#ef476f" ${L4} stroke-width="3"/><rect x="28" y="44" width="20" height="20" fill="#ef476f" ${L4} stroke-width="3"/><rect x="28" y="24" width="20" height="20" fill="#4cc9f0" ${L4} stroke-width="3"/><rect x="48" y="44" width="20" height="20" fill="#ffd166" ${L4} stroke-width="3"/><rect x="48" y="24" width="20" height="20" fill="#ffd166" ${L4} stroke-width="3"/><rect x="48" y="4" width="20" height="20" fill="#ffd166" ${L4} stroke-width="3"/>`),
    wave: S(`<path d="M2 40 Q12 26 22 40 T42 40 T62 40 T82 40 V78 H2 Z" fill="#3a86ff" ${L4}/><path d="M8 58 Q16 50 24 58 T40 58" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`),
    // two hands (a left one and a right one), for the two-hands songs
    hands: S(`<g ${L4}><path d="M10 70 V40 Q10 34 15 34 Q20 34 20 40 V28 Q20 22 25 22 Q30 22 30 28 V40 L34 36 Q38 33 40 38 L36 52 Q34 70 26 70 Z" fill="#4cc9f0"/>` +
      `<path d="M70 70 V40 Q70 34 65 34 Q60 34 60 40 V28 Q60 22 55 22 Q50 22 50 28 V40 L46 36 Q42 33 40 38 L44 52 Q46 70 54 70 Z" fill="#ff8fab"/></g>`),
    moon: S(`<path d="M50 10 A30 30 0 1 0 70 52 A24 24 0 1 1 50 10 Z" fill="#ffd166" ${L4}/><circle cx="18" cy="18" r="3" fill="#ffd166"/><circle cx="66" cy="20" r="3" fill="#ffd166"/>`),
  };
  // a music note in a song's own color (for songs without their own picture)
  const NOTE_COLORS = ['#ef476f', '#ff8c42', '#06d6a0', '#4cc9f0', '#3a86ff', '#9b5de5', '#ff5fa2'];
  const notePic = (i) => S(`<path d="M30 60 V16 L62 10 V52" fill="none" ${L4} stroke-width="5"/><ellipse cx="22" cy="60" rx="10" ry="8" fill="${NOTE_COLORS[i % 7]}" ${L4}/><ellipse cx="54" cy="52" rx="10" ry="8" fill="${NOTE_COLORS[i % 7]}" ${L4}/>`);
  // bass clef songs: a bass clef on a colored circle
  const bassPic = (i) => S(`<circle cx="40" cy="40" r="34" fill="${NOTE_COLORS[i % 7]}" ${L4}/><circle cx="28" cy="32" r="6" fill="#2b2b2b"/><path d="M24 30 C26 14 54 14 52 34 C50 52 36 62 24 66" fill="none" stroke="#2b2b2b" stroke-width="6" stroke-linecap="round"/><circle cx="62" cy="28" r="4" fill="#2b2b2b"/><circle cx="62" cy="42" r="4" fill="#2b2b2b"/>`);
  const SECTIONS = { easy: 'Easy songs', normal: 'Medium songs', challenge: 'Tricky songs' };
  function levels(g) {
    const list = SONGS.map((s, i) => {
      const rec = g.save.levels[s.id] || {};
      const pic = s.clef === 'bass' ? bassPic(i) : PICS[s.pic] || notePic(i);
      const section = s.left ? 'Two hands' : s.clef === 'bass' ? 'Bass clef songs (low notes)' : SECTIONS[s.d];
      return { id: s.id, name: s.name, pic, section, meta: rec.stars ? Arcade.starsHTML(rec.stars) : '' };
    });
    list.push({ id: 'free', name: 'Free Play', pic: PICS.free, free: true, noStart: true, section: 'Make your own music',
      meta: '' });
    return list;
  }

  const P = (inner) => S(inner);
  Arcade.start({
    id: 'piano',
    title: 'Piano Star',
    view: { w: W, h: H },
    background: '#5b43b0',
    trophies: [
      { id: 'first', name: 'First song', how: 'Play a whole song' },
      { id: 'perfect', name: 'Perfect!', how: 'Every note right the first time' },
      { id: 'streak', name: 'On a roll', how: '20 notes in a row' },
      { id: 'party', name: 'Party time!', how: 'Play Happy Birthday' },
      { id: 'allsongs', name: 'Songbook', how: 'Play every song' },
      { id: 'composer', name: 'Little composer', how: 'Play 50 notes in Free Play' },
      { id: 'twohands', name: 'Two hands!', how: 'Play a two-hands song' },
      { id: 'recorder', name: 'My own tune', how: 'Record a tune in Free Play' },
      { id: 'maestro', name: 'Piano star', how: '3 stars on every song', secret: true },
    ],
    logo: Arcade.logo({ badge: Arcade.badges.piano, title: 'Piano Star', colors: ['#ffd166', '#ff5fa2'], bg: '#5b43b0' }),
    // a gentle music-box tune for the menus (the songs themselves are played by you!)
    menuMusic: { tempo: 96, root: 60, scale: 'major', prog: [[1, 4, 5, 1], [6, 4, 1, 5], [4, 5, 6, 5]], drums: 'soft', bass: 'whole', lead: 'bell', harmony: 'flute', pad: true, arp: true, seed: 1701,
      tune: { A: '1/4 3 5 8 | 6/4 4 6/8 | 5/4 7 9/8 | 8/16',
              B: '8/4 6 3 6 | 6/4 4 1 6 | 8/4 5 3 5 | 7/8 5/8',
              C: '6/8 8 | 5/4 7 9/8 | 6/4 8 10/8 | 7/8 9/8' } },
    levelsTitle: 'Pick a song',
    // Each song says how much help it gives (d in songs.js); little kids always get Easy (the kit does that)
    levelDifficulty: (lv) => { const s = SONGS.find(q => q.id === lv.id); return s ? s.d : 'easy'; },
    howTo: [
      { pic: P(`<rect x="10" y="20" width="60" height="50" rx="6" fill="#fff" stroke="#2b2b2b" stroke-width="4"/><rect x="30" y="20" width="20" height="50" fill="#4cc9f0" stroke="#2b2b2b" stroke-width="4"/><path d="M40 4 L48 14 H32 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/>`), text: 'Tap the glowing key', keys: 'Or press C D E F G A B' },
      { pic: P(`<ellipse cx="26" cy="54" rx="11" ry="8" fill="#ef476f" stroke="#2b2b2b" stroke-width="3"/><path d="M36 54 V18" stroke="#2b2b2b" stroke-width="4"/><circle cx="56" cy="40" r="14" fill="#ef476f" stroke="#2b2b2b" stroke-width="4"/><text x="56" y="46" font-size="18" font-weight="900" text-anchor="middle" fill="#fff" font-family="sans-serif">C</text>`), text: 'Same color = same key' },
      { pic: P(`<circle cx="40" cy="40" r="28" fill="#fff" stroke="#2b2b2b" stroke-width="4"/><path d="M22 34 H30 L40 26 V54 L30 46 H22 Z" fill="#2b2b2b"/><path d="M46 32 Q52 40 46 48 M52 26 Q62 40 52 54" fill="none" stroke="#2b2b2b" stroke-width="3.5" stroke-linecap="round"/>`), text: 'Listen to the song first' },
      { pic: P(`<path d="M40 8 L49 30 L72 31 L54 46 L60 70 L40 56 L20 70 L26 46 L8 31 L31 30 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/>`), text: 'Right first time = more stars' },
      { pic: PICS.hands, text: 'Two hands: tap both keys' },
      { pic: P(`<circle cx="26" cy="40" r="20" fill="#fff" stroke="#2b2b2b" stroke-width="4"/><circle cx="26" cy="40" r="9" fill="#ef476f" stroke="#2b2b2b" stroke-width="3"/><circle cx="60" cy="40" r="16" fill="#06d6a0" stroke="#2b2b2b" stroke-width="4"/><circle cx="60" cy="40" r="5" fill="#fff" stroke="#2b2b2b" stroke-width="2.5"/>`), text: 'Free Play: record your tune' },
    ],
    levels,
    setup,
    update,
    draw: render,
  });
})();
