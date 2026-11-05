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
  // staff position: how many lines/spaces up from middle C (C4 = 0, D4 = 1 ... G5 = 11)
  const stepOf = (name) => LETTERS.indexOf(name[0]) + 7 * (+name[name.length - 1] - 4);

  // The piano: 12 white keys from middle C (C4) up to G5, plus the black keys between.
  const KEY_W = 80, KEY_TOP = 344, KEY_H = H - KEY_TOP, BLACK_W = 50, BLACK_H = 122;
  const WHITES = [];
  for (let i = 0; i < 12; i++) { const L = LETTERS[i % 7]; WHITES.push({ name: L + (4 + Math.floor(i / 7)), letter: L, x: i * KEY_W, w: KEY_W, black: false }); }
  const BLACKS = [];
  WHITES.forEach((k, i) => {
    if (i < WHITES.length - 1 && 'CDFGA'.includes(k.letter)) {
      BLACKS.push({ name: k.letter + '#' + k.name[1], letter: k.letter + '#', x: (i + 1) * KEY_W - BLACK_W / 2, w: BLACK_W, black: true });
    }
  });
  const KEYS = WHITES.concat(BLACKS);
  KEYS.forEach(k => { k.midi = midiOf(k.name); k.down = 0; k.glow = 0; k.wiggle = 0; });
  const keyByName = (n) => KEYS.find(k => k.name === n);
  // which key is under a point? (black keys sit on top, so check them first)
  function keyAt(x, y) {
    if (y < KEY_TOP) return null;
    for (const k of BLACKS) if (x >= k.x && x <= k.x + k.w && y <= KEY_TOP + BLACK_H) return k;
    return WHITES.find(k => x >= k.x && x < k.x + k.w) || null;
  }

  // ---------------------------------------------------------------
  // The songs (all old songs that belong to everyone). Easiest first.
  // lyrics: one word-piece per note ('' = no word under that note).
  // ---------------------------------------------------------------
  const SONGS = [
    { id: 'buns', name: 'Hot Cross Buns', tempo: 100, time: '4/4',
      notes: 'E4q D4q C4h | E4q D4q C4h | C4e C4e C4e C4e D4e D4e D4e D4e | E4q D4q C4h',
      lyrics: 'Hot cross buns, Hot cross buns, One a pen- ny, two a pen- ny, Hot cross buns!' },
    { id: 'mary', name: 'Mary Had a Little Lamb', tempo: 110, time: '4/4',
      notes: 'E4q D4q C4q D4q | E4q E4q E4h | D4q D4q D4h | E4q G4q G4h | E4q D4q C4q D4q | E4q E4q E4q E4q | D4q D4q E4q D4q | C4w',
      lyrics: 'Ma- ry had a lit- tle lamb, lit- tle lamb, lit- tle lamb, Ma- ry had a lit- tle lamb, its fleece was white as snow.' },
    { id: 'twinkle', name: 'Twinkle Twinkle Little Star', tempo: 100, time: '4/4',
      notes: 'C4q C4q G4q G4q | A4q A4q G4h | F4q F4q E4q E4q | D4q D4q C4h | G4q G4q F4q F4q | E4q E4q D4h | G4q G4q F4q F4q | E4q E4q D4h | C4q C4q G4q G4q | A4q A4q G4h | F4q F4q E4q E4q | D4q D4q C4h',
      lyrics: 'Twin- kle twin- kle lit- tle star, how I won- der what you are. Up a- bove the world so high, like a dia- mond in the sky. Twin- kle twin- kle lit- tle star, how I won- der what you are.' },
    { id: 'london', name: 'London Bridge', tempo: 112, time: '4/4',
      notes: 'G4q. A4e G4q F4q | E4q F4q G4h | D4q E4q F4h | E4q F4q G4h | G4q. A4e G4q F4q | E4q F4q G4h | D4h G4h | E4q C4h.',
      lyrics: 'Lon- don bridge is fall- ing down, fall- ing down, fall- ing down. Lon- don bridge is fall- ing down, my fair la- dy!' },
    { id: 'jingle', name: 'Jingle Bells', tempo: 120, time: '4/4',
      notes: 'E4q E4q E4h | E4q E4q E4h | E4q G4q C4q. D4e | E4w | F4q F4q F4q. F4e | F4q E4q E4q E4e E4e | E4q D4q D4q E4q | D4h G4h | ' +
             'E4q E4q E4h | E4q E4q E4h | E4q G4q C4q. D4e | E4w | F4q F4q F4q. F4e | F4q E4q E4q E4e E4e | G4q G4q F4q D4q | C4w',
      lyrics: 'Jin- gle bells, jin- gle bells, jin- gle all the way! Oh what fun it is to ride in a one- horse o- pen sleigh, hey! ' +
              'Jin- gle bells, jin- gle bells, jin- gle all the way! Oh what fun it is to ride in a one- horse o- pen sleigh!' },
    { id: 'ode', name: 'Ode to Joy', tempo: 104, time: '4/4',
      notes: 'E4q E4q F4q G4q | G4q F4q E4q D4q | C4q C4q D4q E4q | E4q. D4e D4h | E4q E4q F4q G4q | G4q F4q E4q D4q | C4q C4q D4q E4q | D4q. C4e C4h',
      lyrics: '' },
    { id: 'row', name: 'Row Row Row Your Boat', tempo: 96, time: '6/8',
      notes: 'C4q. C4q. | C4q D4e E4q. | E4q D4e E4q F4e | G4h. | C5e C5e C5e G4e G4e G4e | E4e E4e E4e C4e C4e C4e | G4q F4e E4q D4e | C4h.',
      lyrics: 'Row, row, row your boat, gent- ly down the stream. Mer- ri- ly, mer- ri- ly, mer- ri- ly, mer- ri- ly, life is but a dream.' },
    { id: 'birthday', name: 'Happy Birthday', tempo: 96, time: '3/4',
      notes: 'G4e. G4s | A4q G4q C5q | B4h G4e. G4s | A4q G4q D5q | C5h G4e. G4s | G5q E5q C5q | B4q A4q F5e. F5s | E5q C5q D5q | C5h.',
      lyrics: 'Hap- py birth- day to you, hap- py birth- day to you, hap- py birth- day dear some- one, hap- py birth- day to you!' },
  ];
  const LEN = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25 };
  // Turn the song text into a list of notes: { name, beats, kind, dot, bar (a bar line before it), word }
  function parseSong(song, playerName) {
    const out = [];
    let bar = false;
    for (const tok of song.notes.split(/\s+/)) {
      if (!tok) continue;
      if (tok === '|') { bar = true; continue; }
      const m = /^([A-G]#?\d)([whqes])(\.?)$/.exec(tok);
      if (!m) throw new Error('bad note ' + tok + ' in ' + song.id);
      out.push({ name: m[1], kind: m[2], dot: !!m[3], beats: LEN[m[2]] * (m[3] ? 1.5 : 1), bar });
      bar = false;
    }
    const words = song.lyrics ? song.lyrics.split(/\s+/).filter(Boolean) : [];
    out.forEach((n, i) => { n.word = words[i] || ''; });
    // Happy Birthday: sing it to the player (their name goes on the two "dear ..." notes)
    if (song.id === 'birthday' && playerName) { const i = words.indexOf('some-'); if (i >= 0) { out[i].word = playerName; out[i + 1].word = ''; } }
    // where each note starts (in beats) for playing it back in rhythm
    let t = 0; for (const n of out) { n.at = t; t += n.beats; }
    return out;
  }

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
  let song, notes, idx, misses, score, streak, bestStreak, firstTry, scroll, popups, mode, playT, playI, free, freeNotes, doneT, glowAfter;
  // (before the first song starts, the menu sits over an empty piano)
  song = null; notes = []; idx = 0; misses = 0; score = 0; streak = 0; scroll = 0; popups = []; mode = 'play'; free = true; freeNotes = []; glowAfter = 0;
  const STAFF_X = 120, CURSOR_X = 300;                // notes scroll so the next one sits at CURSOR_X
  const LINE_GAP = 18, BOTTOM_LINE = 254;            // the staff: bottom line (E4) at y 254, lines 18 px apart
  const yOf = (step) => BOTTOM_LINE - (step - 2) * LINE_GAP / 2;
  const gapOf = (n) => 54 + 30 * Math.min(n.beats, 3) + (n.bar ? 22 : 0);   // space a note takes on the paper

  function setup(g, level) {
    free = !!level.free;
    const me = Arcade.profiles.active();
    song = free ? null : SONGS.find(s => s.id === level.id);
    notes = free ? [] : parseSong(song, me.name);
    // x position of every note on the paper
    let x = 0; for (const n of notes) { x += n.bar ? 22 : 0; n.x = x; x += gapOf(n) - (n.bar ? 22 : 0); }
    idx = 0; misses = 0; score = 0; streak = 0; bestStreak = 0; firstTry = 0; popups = [];
    scroll = notes.length ? notes[0].x - (CURSOR_X - STAFF_X) : 0;
    mode = 'play';                                  // 'play' | 'listen' (hear the song) | 'replay' (after finishing)
    freeNotes = []; doneT = 0;
    // when does the right key start to glow? (Easy: always; Normal: after 1 miss; Challenge: after 2)
    glowAfter = g.pick(0, 1, 2);
    KEYS.forEach(k => { k.down = 0; k.glow = 0; k.wiggle = 0; });
    window.__pianoState = () => ({ song: song ? song.id : 'free', idx, total: notes.length, next: notes[idx] ? notes[idx].name : null,
      score, streak, firstTry, mode, difficulty: g.difficulty, glowAfter, freeCount: (g.save.data.freeNotes || 0) });
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
    const want = notes[idx];
    if (k.name === want.name) {
      // right!
      const first = misses === 0;
      if (first) { firstTry++; streak++; bestStreak = Math.max(bestStreak, streak); } else streak = 0;
      const pts = first ? 100 + 10 * Math.min(streak - 1, 10) : 50;
      score += pts;
      want.done = true; want.firstTry = first;
      const nx = STAFF_X + want.x - scroll, ny = yOf(stepOf(want.name));
      g.particles.burst(nx, ny, { count: first ? 14 : 8, colors: [COLORS[want.name[0]], '#ffd166', '#fff'], speed: 220, size: 7, life: 0.7, shape: 'star' });
      popups.push({ text: '+' + pts, x: nx, y: ny - 40, t: 0, color: first ? '#ffd166' : '#fff' });
      if (streak > 0 && streak % 10 === 0) { popups.push({ text: streak + ' in a row!', x: W / 2, y: 330, t: 0, color: '#06d6a0', big: true }); g.sfx('star'); }
      misses = 0;
      idx++;
      if (idx >= notes.length) songDone(g);
    } else {
      // not that one: the key wiggles, the right key starts to glow (after enough tries)
      misses++; streak = 0;
      k.wiggle = 0.4;
      g.tone(150, 0.12, { type: 'sine', vol: 0.12, delay: 0.05 });   // a soft "boop"
    }
  }

  // Song finished: confetti, then the piano plays the whole song back in rhythm.
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
    doneT = 0.9;                                      // a little pause, then the replay starts
    startPlayback('replay');
  }
  function startPlayback(m) {
    mode = m; playT = m === 'replay' ? -1.0 : -0.3; playI = 0;
  }
  function stopListen() {
    mode = 'play'; playI = 0;
    KEYS.forEach(k => { k.down = 0; });
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
      next: true, delay: 600,
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
    } else if (P.justDown) {
      press(g, keyAt(P.x, P.y));
    }
    // computer keyboard: the letter keys C D E F G A B play that note.
    // (it picks the octave of the note you need next, so Happy Birthday's high notes work too)
    for (const L of LETTERS) {
      if (g.input.hit('Key' + L)) {
        const want = notes[idx];
        let name = L + '4';
        if (want && want.name[0] === L) name = want.name;
        else if (free && (g.input.down('ShiftLeft', 'ShiftRight')) && keyByName(L + '5')) name = L + '5';
        press(g, keyByName(name));
      }
    }

    // playing the song back (Listen, or the replay after finishing): in rhythm, keys light up
    if (mode === 'listen' || mode === 'replay') {
      playT += dt;
      const beat = 60 / song.tempo;
      while (playI < notes.length && playT >= notes[playI].at * beat) {
        const n = notes[playI], k = keyByName(n.name);
        pianoNote(k.midi, 0.28);
        k.down = Math.min(n.beats * beat, 0.4);
        playI++;
      }
      const end = notes.length ? (notes[notes.length - 1].at + notes[notes.length - 1].beats) * beat : 0;
      if (playI >= notes.length && playT > end + 0.3) {
        if (mode === 'listen') stopListen(); else { mode = 'over'; finishSong(g); }
      }
    }

    // keep the next note at the cursor (smooth scrolling)
    if (!free && notes.length) {
      const showI = mode === 'listen' || mode === 'replay' ? Math.max(0, playI - 1) : Math.min(idx, notes.length - 1);
      const target = notes[showI].x - (CURSOR_X - STAFF_X);
      scroll += (target - scroll) * Math.min(1, dt * 8);
    }
    // the glowing hint key
    for (const k of KEYS) k.glow = 0;
    if (!free && mode === 'play' && notes[idx] && misses >= glowAfter) keyByName(notes[idx].name).glow = 1;
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
    // five staff lines
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    for (let i = 0; i < 5; i++) { const y = BOTTOM_LINE - i * LINE_GAP; ctx.beginPath(); ctx.moveTo(px + 14, y); ctx.lineTo(px + pw - 14, y); ctx.stroke(); }
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
    const curI = free ? -1 : mode === 'listen' || mode === 'replay' ? playI - 1 : idx;
    for (let i = 0; i < list.length; i++) {
      const n = list[i];
      const x = STAFF_X + n.x - (free ? 0 : scroll);
      if (x < STAFF_X - 60 || x > W + 60) continue;
      if (n.bar) {
        ctx.strokeStyle = INK; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x - 22, BOTTOM_LINE); ctx.lineTo(x - 22, BOTTOM_LINE - 4 * LINE_GAP); ctx.stroke();
      }
      // colors: played notes and (on Easy) every note wear their color; Normal/Challenge upcoming notes are black
      const col = COLORS[n.name[0]];
      const colored = free || n.done || g.difficulty === 'easy' || i === curI;
      drawNote(ctx, n, x, colored ? col : INK, i === curI ? g.time : null);
      // the letter in a colored bubble under the staff, and the word under that
      if (showLetters) {
        D.circle(ctx, x, 292, 15, colored ? col : '#fff', 3);
        D.text(ctx, n.name[0], x, 293, { size: 20, color: colored && n.name[0] !== 'E' ? '#fff' : INK, stroke: false });
      }
      if (n.word) D.text(ctx, n.word, x, 318, { size: 17, color: INK, stroke: false });
    }
    ctx.restore();
    // the treble clef and time signature sit still at the left
    ctx.fillStyle = '#fffdf5'; ctx.fillRect(px + 6, py + 6, STAFF_X - px - 18, ph - 12);
    for (let i = 0; i < 5; i++) { const y = BOTTOM_LINE - i * LINE_GAP; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(px + 14, y); ctx.lineTo(STAFF_X - 12, y); ctx.stroke(); }
    drawClef(ctx, 50, BOTTOM_LINE);
    if (song) {
      const [a, b] = song.time.split('/');
      D.text(ctx, a, 88, BOTTOM_LINE - 3 * LINE_GAP, { size: 34, color: INK, stroke: false });
      D.text(ctx, b, 88, BOTTOM_LINE - 1 * LINE_GAP, { size: 34, color: INK, stroke: false });
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
  function drawNote(ctx, n, x, color, pulse) {
    const step = stepOf(n.name.replace('#', '')), y = yOf(step);
    if (pulse != null) {                               // the next note glows and bobs
      ctx.fillStyle = 'rgba(255, 209, 102, 0.6)';
      ctx.beginPath(); ctx.arc(x, y, 24 + Math.sin(pulse * 6) * 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    if (step <= 0) { ctx.beginPath(); ctx.moveTo(x - 20, yOf(0)); ctx.lineTo(x + 20, yOf(0)); ctx.stroke(); }    // middle C's little ledger line
    if (step >= 12) { ctx.beginPath(); ctx.moveTo(x - 20, yOf(12)); ctx.lineTo(x + 20, yOf(12)); ctx.stroke(); }
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
      const up = step < 6, sx = up ? x + 11 : x - 11, sy = up ? y - 60 : y + 60;
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
    if (n.dot) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + 20, y - (step % 2 === 0 ? 5 : 0), 3.8, 0, Math.PI * 2); ctx.fill(); }
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
      if (mode === 'replay') D.text(ctx, 'Your song!', W / 2, 330, { size: 30, color: '#ffd166' });
    } else {
      D.text(ctx, String(g.save.data.freeNotes || 0), W - 160, 42, { size: 30, color: '#fff' });
    }
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
  };
  function levels(g) {
    const list = SONGS.map(s => {
      const rec = g.save.levels[s.id] || {};
      return { id: s.id, name: s.name, pic: PICS[s.id], section: 'Songs', meta: rec.stars ? Arcade.starsHTML(rec.stars) : '' };
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
      { id: 'maestro', name: 'Piano star', how: '3 stars on every song', secret: true },
    ],
    logo: Arcade.logo({ badge: Arcade.badges.piano, title: 'Piano Star', colors: ['#ffd166', '#ff5fa2'], bg: '#5b43b0' }),
    // a gentle music-box tune for the menus (the songs themselves are played by you!)
    menuMusic: { tempo: 96, root: 60, scale: 'major', prog: [[1, 4, 5, 1], [6, 4, 1, 5], [4, 5, 6, 5]], drums: 'soft', bass: 'whole', lead: 'bell', harmony: 'flute', pad: true, arp: true, seed: 1701,
      tune: { A: '1/4 3 5 8 | 6/4 4 6/8 | 5/4 7 9/8 | 8/16',
              B: '8/4 6 3 6 | 6/4 4 1 6 | 8/4 5 3 5 | 7/8 5/8',
              C: '6/8 8 | 5/4 7 9/8 | 6/4 8 10/8 | 7/8 9/8' } },
    levelsTitle: 'Pick a song',
    // Songs get trickier down the list; little kids always get Easy (the kit does that)
    levelDifficulty: (lv) => { const i = SONGS.findIndex(s => s.id === lv.id); return i < 3 ? 'easy' : i < 6 ? 'normal' : 'challenge'; },
    howTo: [
      { pic: P(`<rect x="10" y="20" width="60" height="50" rx="6" fill="#fff" stroke="#2b2b2b" stroke-width="4"/><rect x="30" y="20" width="20" height="50" fill="#4cc9f0" stroke="#2b2b2b" stroke-width="4"/><path d="M40 4 L48 14 H32 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/>`), text: 'Tap the glowing key', keys: 'Or press C D E F G A B' },
      { pic: P(`<ellipse cx="26" cy="54" rx="11" ry="8" fill="#ef476f" stroke="#2b2b2b" stroke-width="3"/><path d="M36 54 V18" stroke="#2b2b2b" stroke-width="4"/><circle cx="56" cy="40" r="14" fill="#ef476f" stroke="#2b2b2b" stroke-width="4"/><text x="56" y="46" font-size="18" font-weight="900" text-anchor="middle" fill="#fff" font-family="sans-serif">C</text>`), text: 'Same color = same key' },
      { pic: P(`<circle cx="40" cy="40" r="28" fill="#fff" stroke="#2b2b2b" stroke-width="4"/><path d="M22 34 H30 L40 26 V54 L30 46 H22 Z" fill="#2b2b2b"/><path d="M46 32 Q52 40 46 48 M52 26 Q62 40 52 54" fill="none" stroke="#2b2b2b" stroke-width="3.5" stroke-linecap="round"/>`), text: 'Listen to the song first' },
      { pic: P(`<path d="M40 8 L49 30 L72 31 L54 46 L60 70 L40 56 L20 70 L26 46 L8 31 L31 30 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/>`), text: 'Right first time = more stars' },
    ],
    levels,
    setup,
    update,
    draw: render,
  });
})();
