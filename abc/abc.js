// =====================================================================
// Bubble School — pop the right bubble! Counting, letters and simple math.
//
// How it works:
//  * Ollie the octopus asks a question at the top (and SAYS it out loud,
//    so kids who can't read yet can play). Tap the question to hear it again.
//  * Answer bubbles float up from the sea floor. Tap the right one: POP!
//    A wrong one just wobbles ("Try again!") - there is no losing.
//  * 10 questions per level. Stars for getting them right the first time.
//  * Levels mix counting, letters, adding and taking away, and they get
//    harder as you go (more bubbles, faster, bigger numbers).
//  * Beat levels to unlock sea friends who swim around in the background.
//  * Sometimes a golden starfish bubble floats by: tap it for bonus points!
// =====================================================================
(function () {
  const { draw, icons, math } = Arcade;
  const D = draw;
  const INK = D.INK;
  const W = 960, H = 540;
  const Q_PER_LEVEL = 10;

  // ---------------------------------------------------------------
  // Pictures for "what letter does it start with?" and "spell it".
  // Each one is drawn with canvas paths in drawThing() below.
  // ---------------------------------------------------------------
  const WORDS = [
    { word: 'APPLE', thing: 'apple' }, { word: 'BALL', thing: 'ball' }, { word: 'CAT', thing: 'cat' },
    { word: 'DOG', thing: 'dog' }, { word: 'EGG', thing: 'egg' }, { word: 'FISH', thing: 'fish' },
    { word: 'HAT', thing: 'hat' }, { word: 'KITE', thing: 'kite' }, { word: 'MOON', thing: 'moon' },
    { word: 'PIG', thing: 'pig' }, { word: 'STAR', thing: 'star' }, { word: 'TREE', thing: 'tree' },
    { word: 'BUS', thing: 'bus' }, { word: 'CAKE', thing: 'cake' },
  ];
  const SHORT = WORDS.filter(w => w.word.length === 3);   // CAT DOG EGG HAT PIG BUS: for "which letter is missing?"

  // ---------------------------------------------------------------
  // The levels. kind = what sort of question; the rest are its settings.
  //   count  : how many fish? (max = biggest number)
  //   find   : find this letter (from = the letters used)
  //   add/sub: picture sums up to max
  //   first  : what letter does this picture start with?
  //   lower  : little letter -> find the big letter
  //   missing: C _ T  which letter is missing?
  //   mix    : a bit of everything (the last level)
  // ---------------------------------------------------------------
  const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LEVELS = [
    { id: 'l1',  name: 'Count to 5',      kind: 'count', max: 5,  choices: 3, color: '#4cc9f0' },
    { id: 'l2',  name: 'Letters A to E',  kind: 'find',  from: 'ABCDE', choices: 3, color: '#ff8fab' },
    { id: 'l3',  name: 'Count to 10',     kind: 'count', max: 10, choices: 4, color: '#06d6a0' },
    { id: 'l4',  name: 'Letters A to M',  kind: 'find',  from: 'ABCDEFGHIJKLM', choices: 4, color: '#ffd166' },
    { id: 'l5',  name: 'Adding to 5',     kind: 'add',   max: 5,  choices: 3, color: '#ff8c42' },
    { id: 'l6',  name: 'All the letters', kind: 'find',  from: ABC, choices: 4, color: '#9b5de5' },
    { id: 'l7',  name: 'First letters',   kind: 'first', choices: 3, color: '#f15bb5' },
    { id: 'l8',  name: 'Taking away',     kind: 'sub',   max: 5,  choices: 3, color: '#118ab2' },
    { id: 'l9',  name: 'Adding to 10',    kind: 'add',   max: 10, choices: 4, color: '#ef476f' },
    { id: 'l10', name: 'Big and little',  kind: 'lower', choices: 4, color: '#7bd389' },
    { id: 'l11', name: 'Take away to 10', kind: 'sub',   max: 10, choices: 4, color: '#3a86ff' },
    { id: 'l12', name: 'Spell it!',       kind: 'missing', choices: 4, color: '#ffb703' },
    { id: 'l13', name: 'Brain buster',    kind: 'mix',   choices: 5, color: '#e63946' },
  ];

  // Sea friends you unlock (they swim around behind the bubbles)
  const FRIENDS = [
    { id: 'crab',      name: 'Crab',      after: 'l2' },
    { id: 'turtle',    name: 'Turtle',    after: 'l4' },
    { id: 'seahorse',  name: 'Seahorse',  after: 'l6' },
    { id: 'jelly',     name: 'Jellyfish', after: 'l8' },
    { id: 'whale',     name: 'Whale',     after: 'l10' },
    { id: 'starfish',  name: 'Starfish',  after: 'l12' },
    { id: 'narwhal',   name: 'Narwhal',   after: 'l13' },
  ];
  const friendOpen = (g, f) => g.isUnlocked('friend-' + f.id);
  function checkUnlocks(g) {
    for (const f of FRIENDS) if ((g.save.levels[f.after] || {}).done) g.unlock('friend-' + f.id, f.name + ' joined you!');
  }

  // ---------------------------------------------------------------
  // Talking: the browser's built-in voice reads the questions out loud.
  // ---------------------------------------------------------------
  let voiceOn = true;
  function say(text) {
    if (!voiceOn || !window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9; u.pitch = 1.2;
      speechSynthesis.speak(u);
    } catch (e) { /* no voice on this device: that's fine */ }
  }

  // ---------------------------------------------------------------
  // Making questions
  // ---------------------------------------------------------------
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  // n different wrong answers near the right one
  function numberChoices(answer, n, lo, hi) {
    const set = new Set([answer]);
    let tries = 0;
    while (set.size < n && tries++ < 200) {
      const v = answer + rnd(-3, 3);
      if (v >= lo && v <= hi) set.add(v);
    }
    for (let v = lo; set.size < n && v <= hi + 5; v++) set.add(v);
    return shuffle([...set]).map(String);
  }
  function letterChoices(answer, n, from = ABC) {
    const set = new Set([answer]);
    while (set.size < n) set.add(pickOne(from.split('')));
    return shuffle([...set]);
  }
  const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

  function makeQuestion(kind, lv, n, last) {
    let q;
    for (let tries = 0; tries < 10; tries++) {
      q = makeOne(kind, lv, n);
      if (!last || q.key !== last.key) break;   // never the same question twice in a row
    }
    return q;
  }
  function makeOne(kind, lv, n) {
    if (kind === 'mix') kind = pickOne(['count', 'find', 'add', 'sub', 'first', 'lower', 'missing']);
    const max = lv.max || 10;
    if (kind === 'count') {
      const a = rnd(1, max);
      return { kind, key: 'c' + a, answer: String(a), count: a, choices: numberChoices(a, n, 1, max),
        speak: 'How many fish?', show: 'count' };
    }
    if (kind === 'find') {
      const from = lv.from || ABC, a = pickOne(from.split(''));
      return { kind, key: 'f' + a, answer: a, choices: letterChoices(a, n, from), speak: 'Find the letter ' + a + '.', show: 'letter', big: a };
    }
    if (kind === 'add') {
      const a = rnd(1, max - 1), b = rnd(1, max - a);
      return { kind, key: 'a' + a + b, answer: String(a + b), a, b, op: '+', choices: numberChoices(a + b, n, 1, max),
        speak: 'What is ' + NUM_WORDS[a] + ' plus ' + NUM_WORDS[b] + '?', show: 'sum' };
    }
    if (kind === 'sub') {
      const a = rnd(2, max), b = rnd(1, a - 1);
      return { kind, key: 's' + a + b, answer: String(a - b), a, b, op: '-', choices: numberChoices(a - b, n, 0, max),
        speak: 'What is ' + NUM_WORDS[a] + ' take away ' + NUM_WORDS[b] + '?', show: 'sum' };
    }
    if (kind === 'first') {
      const w = pickOne(WORDS), a = w.word[0];
      return { kind, key: 'w' + w.word, answer: a, thing: w.thing, choices: letterChoices(a, n),
        speak: w.word.toLowerCase() + '. What letter does ' + w.word.toLowerCase() + ' start with?', show: 'thing' };
    }
    if (kind === 'lower') {
      const a = pickOne(ABC.split(''));
      return { kind, key: 'l' + a, answer: a, choices: letterChoices(a, n), speak: 'Find the big letter for little ' + a.toLowerCase() + '.', show: 'letter', big: a.toLowerCase() };
    }
    // missing letter: C _ T
    const w = pickOne(SHORT), gap = rnd(0, 2), a = w.word[gap];
    const shown = w.word.split('').map((c, i) => (i === gap ? '_' : c)).join(' ');
    return { kind: 'missing', key: 'm' + w.word + gap, answer: a, thing: w.thing, shown, choices: letterChoices(a, n),
      speak: w.word.toLowerCase() + '. Which letter is missing?', show: 'missing' };
  }

  // ---------------------------------------------------------------
  // Game state
  // ---------------------------------------------------------------
  let L, q, qNum, bubbles, golden, firstTry, misses, streak, bestStreak, score, wait, popups, fx, clock,
    ollie, speed, nGolden, fastCount, qTime, fishSeeds, friends, done, gref;

  function setup(g, level) {
    gref = g;
    L = level || LEVELS[0];
    voiceOn = g.save.data.voice !== false;
    speed = g.pick(32, 46, 62);                       // how fast bubbles rise (px/s), faster in later levels
    qNum = 0; misses = 0; streak = 0; bestStreak = 0; score = 0; wait = 0; popups = []; clock = 0;
    fx = new Arcade.Particles(); golden = null; nGolden = 0; fastCount = 0; done = false;
    ollie = { mood: 'idle', t: 0, taps: 0 };
    // the sea friends you've unlocked swim around in the background
    friends = FRIENDS.filter(f => friendOpen(g, f)).map((f, i) => ({ ...f, x: Math.random() * W, y: 150 + i * 42 % 260, dir: i % 2 ? -1 : 1, sp: 18 + Math.random() * 16, ph: Math.random() * 6 }));
    q = null;
    nextQuestion(g);

    window.__abcState = () => ({ level: L.id, q: qNum, answer: q && q.answer, kind: q && q.kind, choices: q && q.choices, score, misses, done,
      bubbles: bubbles.map(b => ({ text: b.text, x: Math.round(b.x), y: Math.round(b.y), popped: b.popped })) });
    window.__abcTap = (text) => { const b = bubbles.find(b => b.text === text && !b.popped); if (b) tapBubble(g, b); return !!b; };   // test-only
  }

  function nextQuestion(g) {
    q = makeQuestion(L.kind, L, L.choices + (g.difficulty === 'challenge' ? 1 : 0), q);
    qNum++;
    firstTry = true; qTime = 0;
    // one bubble per choice, spread across the screen, starting at different heights
    const n = q.choices.length, lane = (W - 200) / n;
    const order = shuffle(q.choices.map((c, i) => i));
    bubbles = q.choices.map((text, i) => ({
      text, x: 140 + lane * (order[i] + 0.5) + rnd(-20, 20), y: 260 + ((i * 97) % 220) + Math.random() * 30,   // start on screen, at different heights
      r: 52, wob: Math.random() * 6, shake: 0, popped: false, sp: speed * (0.85 + Math.random() * 0.3),
    }));
    // fish positions for counting questions (so they don't jump around)
    fishSeeds = [];
    if (q.show === 'count') {
      const cols = Math.min(5, q.count);
      for (let i = 0; i < q.count; i++) fishSeeds.push({ col: i % cols, row: Math.floor(i / cols), c: ['#ffd166', '#ff8c42', '#ff8fab', '#06d6a0'][i % 4] });
    }
    setTimeout(() => { if (g.state === 'play') say(q.speak); }, 250);
  }

  function tapBubble(g, b) {
    if (wait > 0 || b.popped || done) return;
    if (b.text === q.answer) {
      b.popped = true;
      const fast = qTime < 3;
      if (fast) fastCount++;
      if (fastCount >= 10) g.achieve('speedy');
      if (firstTry) { streak++; bestStreak = Math.max(bestStreak, streak); score += 100 + Math.min(5, streak) * 10; }
      else score += 40;
      if (streak >= 10) g.achieve('streak10');
      g.sfx('pop'); setTimeout(() => g.sfx('star'), 80);
      fx.burst(b.x, b.y, { count: 30, colors: ['#ffffff', '#9bf6ff', '#ffd166', L.color], speed: 260, size: 9, gravity: 60, life: 0.8, shape: 'star' });
      popups.push({ text: pickOne(['Great!', 'Yes!', 'Super!', 'Wow!', 'You got it!']), x: b.x, y: b.y - 60, t: 0, color: '#ffd166' });
      ollie.mood = 'happy'; ollie.t = 1.2;
      say(pickOne(['Great!', 'Yes!', 'Super!', 'Well done!', 'You got it!']));
      wait = 1.1;
    } else {
      // a wrong bubble just wobbles: try again!
      b.shake = 0.5; firstTry = false; misses++; streak = 0;
      g.sfx('bonk');
      popups.push({ text: 'Try again!', x: b.x, y: b.y - 60, t: 0, color: '#9bf6ff' });
      ollie.mood = 'think'; ollie.t = 1;
    }
  }

  function finishLevel(g) {
    done = true;
    const stars = misses <= 1 ? 3 : misses <= 4 ? 2 : 1;
    g.achieve('first');
    if (misses === 0) g.achieve('perfect');
    if (L.id === 'l6') g.achieve('letters');
    if (L.id === 'l11') g.achieve('math');
    if (L.id === 'l13') g.achieve('all');
    g.finish({
      win: true, score, stars,
      title: stars === 3 ? 'Super smart!' : stars === 2 ? 'Great job!' : 'You did it!',
      // pictures + numbers: a green tick for right first time, a flame for the streak, a golden star
      lines: [
        { icon: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#06d6a0" stroke="#2b2b2b" stroke-width="3.5"/><path d="M12 20 L18 26 L29 14" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>', text: Math.max(0, Q_PER_LEVEL - misses) + ' / ' + Q_PER_LEVEL },
        bestStreak >= 3 ? { icon: '<svg viewBox="0 0 40 40"><path d="M20 37 C6 33 8 18 16 6 Q18 16 23 14 C29 21 33 32 20 37 Z" fill="#ff8c42" stroke="#2b2b2b" stroke-width="3"/><path d="M20 34 C14 31 15 25 19 20 Q21 26 24 24 C26 29 25 32 20 34 Z" fill="#ffd166"/></svg>', text: String(bestStreak) } : null,
        nGolden ? { icon: '<svg viewBox="0 0 40 40"><path d="M20 4 l4.7 9.6 10.6 1.5 -7.7 7.5 1.8 10.5 -9.4 -5 -9.4 5 1.8 -10.5 -7.7 -7.5 10.6 -1.5z" fill="#ffd166" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/></svg>', text: String(nGolden) } : null,
      ].filter(Boolean),
      next: true, delay: 500,
    });
    say(stars === 3 ? 'Super smart!' : 'Great job!');
    setTimeout(() => checkUnlocks(g), 900);
  }

  function update(g, dt) {
    clock += dt; qTime += dt;
    fx.update(dt);
    for (const p of popups) { p.t += dt; p.y -= 40 * dt; }
    popups = popups.filter(p => p.t < 1);
    if (ollie.t > 0) { ollie.t -= dt; if (ollie.t <= 0) ollie.mood = 'idle'; }
    for (const f of friends) { f.x += f.dir * f.sp * dt; if (f.x < -80) f.dir = 1; if (f.x > W + 80) f.dir = -1; }

    // bubbles float up; when one leaves the top it comes back from the bottom
    for (const b of bubbles) {
      if (b.popped) continue;
      b.y -= b.sp * dt; b.wob += dt * 2; b.shake = Math.max(0, b.shake - dt);
      if (b.y < 200 - b.r) b.y = H + b.r + 10;    // floated away at the top: comes back from the bottom
    }
    // a golden starfish bubble now and then (bonus!)
    if (!golden && !done && Math.random() < dt / 9) golden = { x: rnd(160, W - 160), y: H + 50, wob: 0 };
    if (golden) { golden.y -= 70 * dt; golden.wob += dt * 3; if (golden.y < 120) golden = null; }

    // taps
    const pt = g.input.pointer;
    if (pt.justDown) {
      if (golden && Math.hypot(pt.x - golden.x, pt.y - golden.y) < 46) {
        score += 50; nGolden++; g.sfx('coin');
        g.save.data.golden = (g.save.data.golden || 0) + 1; g.store();
        if (g.save.data.golden >= 5) g.achieve('golden');
        fx.burst(golden.x, golden.y, { count: 24, colors: ['#ffd166', '#fff3b0'], speed: 240, size: 9, shape: 'star', life: 0.7 });
        popups.push({ text: '+50', x: golden.x, y: golden.y - 40, t: 0, color: '#ffd166' });
        golden = null;
      } else if (pt.y < 140 && Math.abs(pt.x - W / 2) < 300) {
        say(q.speak);                                   // tap the question to hear it again
      } else if (Math.hypot(pt.x - 80, pt.y - 470) < 60) {
        // tapping Ollie makes him giggle (5 times = secret trophy)
        ollie.taps++; ollie.mood = 'happy'; ollie.t = 0.8; g.tone(700, 0.08, { type: 'triangle', slide: 1000, vol: 0.2 });
        if (ollie.taps >= 5) g.achieve('tickle');
      } else {
        let best = null, bd = 1e9;
        for (const b of bubbles) {
          if (b.popped) continue;
          const d = Math.hypot(pt.x - b.x, pt.y - b.y);
          if (d < b.r + 14 && d < bd) { best = b; bd = d; }
        }
        if (best) tapBubble(g, best);
      }
    }
    // keyboard: type the answer (letters or digits)
    for (const b of bubbles) {
      if (b.popped || b.text.length !== 1) continue;
      const code = /[A-Z]/.test(b.text) ? 'Key' + b.text : 'Digit' + b.text;
      if (g.input.hit(code)) { tapBubble(g, b); break; }
    }

    if (wait > 0) {
      wait -= dt;
      if (wait <= 0) { if (qNum >= Q_PER_LEVEL) finishLevel(g); else nextQuestion(g); }
    }
  }

  // ---------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------
  function render(g, ctx) {
    const t = clock || 0;
    // the sea
    const sea = ctx.createLinearGradient(0, 0, 0, H);
    sea.addColorStop(0, '#6fd3ff'); sea.addColorStop(0.5, '#2a9df4'); sea.addColorStop(1, '#1b5fbf');
    ctx.fillStyle = sea; ctx.fillRect(0, 0, W, H);
    // light rays from the surface
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let k = 0; k < 5; k++) {
      const x = 120 + k * 190 + Math.sin(t * 0.4 + k) * 30;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 70, 0); ctx.lineTo(x + 170, H); ctx.lineTo(x + 60, H); ctx.fill();
    }
    if (!L) return;
    for (const f of friends) drawFriend(ctx, f.id, f.x, f.y + Math.sin(t + f.ph) * 10, f.dir, t, 0.85);
    // sand and seaweed
    ctx.fillStyle = '#f4d58d'; ctx.beginPath(); ctx.moveTo(0, H - 46);
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, H - 46 + Math.sin(x * 0.02) * 6);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    for (const [x, h, c] of [[200, 110, '#2a9d8f'], [240, 80, '#52b788'], [700, 120, '#2a9d8f'], [740, 90, '#52b788'], [900, 100, '#2a9d8f']]) {
      ctx.beginPath(); ctx.moveTo(x, H - 40);
      for (let k = 1; k <= 6; k++) ctx.lineTo(x + Math.sin(t * 1.5 + k + x) * 10, H - 40 - h * k / 6);
      ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 16; ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = 9; ctx.stroke();
    }
    // golden starfish bubble
    if (golden) {
      const gx = golden.x + Math.sin(golden.wob) * 12;
      drawBubble(ctx, gx, golden.y, 40, 'rgba(255,230,140,0.35)');
      D.star(ctx, gx, golden.y, 24, '#ffd166', 3);
    }
    // the answer bubbles
    for (const b of bubbles) {
      if (b.popped) continue;
      const sx = Math.sin(b.shake * 40) * 10 * (b.shake > 0 ? 1 : 0);
      const x = b.x + Math.sin(b.wob) * 10 + sx;
      drawBubble(ctx, x, b.y, b.r, 'rgba(255,255,255,0.18)');
      D.text(ctx, b.text, x, b.y + 3, { size: b.text.length > 1 ? 46 : 54, color: '#ffffff', lineWidth: 9 });
    }
    drawOllie(ctx, 80, 470, t);
    fx.draw(ctx);
    drawQuestion(ctx, t);
    // progress: 10 pearls under the question
    for (let i = 0; i < Q_PER_LEVEL; i++) {
      const x = W / 2 - 135 + i * 30, on = i < qNum - (wait > 0 ? 0 : 1);
      D.circle(ctx, x, 152, 10, on ? '#ffffff' : 'rgba(255,255,255,0.25)', 3);
      if (on) D.circle(ctx, x - 3, 149, 3, '#bde0fe', 0);
    }
    D.text(ctx, String(score), W - 140, 40, { size: 34, color: '#ffd166' });
    for (const p of popups) { ctx.globalAlpha = 1 - p.t; D.text(ctx, p.text, p.x, p.y, { size: 34, color: p.color }); ctx.globalAlpha = 1; }
  }

  function drawBubble(ctx, x, y, r, fill) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(43,43,43,0.5)'; ctx.beginPath(); ctx.arc(x, y, r + 3, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.ellipse(x - r * 0.4, y - r * 0.45, r * 0.22, r * 0.12, -0.7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.5, y + r * 0.45, r * 0.07, 0, Math.PI * 2); ctx.fill();
  }

  // The question card at the top
  function drawQuestion(ctx, t) {
    if (!q) return;
    const x = W / 2 - 260, y = 10, w = 520, h = 126;
    D.box(ctx, x, y + 5, w, h, 24, 'rgba(0,0,0,0.25)', 0);
    D.box(ctx, x, y, w, h, 24, '#ffffff', 5);
    // speaker icon: tap to hear it again
    ctx.save(); ctx.translate(x + w - 44, y + 32); ctx.fillStyle = voiceOn ? L.color : '#ccc'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(-6, -6); ctx.lineTo(4, -14); ctx.lineTo(4, 14); ctx.lineTo(-6, 6); ctx.lineTo(-14, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(6, 0, 10, -0.8, 0.8); ctx.stroke(); ctx.restore();
    const cx = W / 2, cy = y + h / 2 + 2;
    if (q.show === 'count') {
      // fish to count, in neat rows
      const rows = Math.ceil(q.count / 5), cols = Math.min(5, q.count), gap = 62;
      fishSeeds.forEach((f) => {
        const fx0 = cx - (cols - 1) * gap / 2 + f.col * gap, fy = cy - (rows - 1) * 26 + f.row * 52;
        drawFish(ctx, fx0, fy + Math.sin(t * 3 + f.col) * 2, 0.75, f.c);
      });
      D.text(ctx, '?', x + 40, cy, { size: 48, color: L.color });
    } else if (q.show === 'letter') {
      D.text(ctx, q.big, cx, cy + 4, { size: 92, color: L.color, lineWidth: 12 });
      if (q.kind === 'lower') D.text(ctx, '→ ?', cx + 110, cy, { size: 44, color: '#2b2b2b', stroke: false });
    } else if (q.show === 'sum') {
      // the sum in numbers, with dots underneath to count on
      D.text(ctx, q.a + ' ' + (q.op === '+' ? '+' : '−') + ' ' + q.b + ' = ?', cx, cy - 16, { size: 56, color: L.color, lineWidth: 10 });
      const dots = q.op === '+' ? q.a + q.b : q.a, total = dots, dw = Math.min(28, 440 / total);
      for (let i = 0; i < total; i++) {
        const dx = cx - (total - 1) * dw / 2 + i * dw, gone = q.op === '-' && i >= q.a - q.b;
        const col = q.op === '+' ? (i < q.a ? '#ff8c42' : '#06d6a0') : '#ff8c42';
        D.circle(ctx, dx, cy + 38, dw * 0.36, gone ? '#eeeeee' : col, 2.5);
        if (gone) { ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(dx - 7, cy + 31); ctx.lineTo(dx + 7, cy + 45); ctx.stroke(); }
      }
    } else if (q.show === 'thing') {
      drawThing(ctx, q.thing, cx - 70, cy, 46, t);
      D.text(ctx, '= ?', cx + 60, cy, { size: 54, color: L.color, lineWidth: 10 });
    } else if (q.show === 'missing') {
      drawThing(ctx, q.thing, x + 80, cy, 40, t);
      D.text(ctx, q.shown, cx + 50, cy + 4, { size: 66, color: L.color, lineWidth: 10 });
    }
  }

  // Ollie the octopus (the teacher)
  function drawOllie(ctx, x, y, t) {
    const bob = Math.sin(t * 2) * 4 + (ollie.mood === 'happy' ? -Math.abs(Math.sin(t * 12)) * 10 : 0);
    ctx.save(); ctx.translate(x, y + bob);
    // legs
    ctx.lineCap = 'round';
    for (let k = 0; k < 5; k++) {
      const lx = -36 + k * 18;
      ctx.beginPath(); ctx.moveTo(lx, 10); ctx.quadraticCurveTo(lx + Math.sin(t * 3 + k) * 14, 40, lx + Math.sin(t * 3 + k + 1) * 10, 58);
      ctx.strokeStyle = INK; ctx.lineWidth = 18; ctx.stroke(); ctx.strokeStyle = '#c77dff'; ctx.lineWidth = 11; ctx.stroke();
    }
    // head
    ctx.beginPath(); ctx.ellipse(0, -8, 46, 42, 0, 0, Math.PI * 2); ctx.fillStyle = '#c77dff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    // graduation cap (he's a teacher!)
    ctx.fillStyle = '#2b2b2b'; ctx.beginPath(); ctx.moveTo(-34, -48); ctx.lineTo(0, -62); ctx.lineTo(34, -48); ctx.lineTo(0, -36); ctx.closePath(); ctx.fill();
    ctx.fillRect(-18, -46, 36, 12);
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(28, -40); ctx.lineTo(28, -26); ctx.stroke();
    D.circle(ctx, 28, -24, 4, '#ffd166', 0);
    // face
    if (ollie.mood === 'happy') {
      ctx.strokeStyle = INK; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(-15, -8, 7, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(15, -8, 7, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    } else {
      D.circle(ctx, -15, -10, 8, INK, 0); D.circle(ctx, 15, -10, 8, INK, 0);
      D.circle(ctx, -12, -13, 3, '#fff', 0); D.circle(ctx, 18, -13, 3, '#fff', 0);
    }
    D.circle(ctx, -28, 6, 6, '#ff8fab', 0); D.circle(ctx, 28, 6, 6, '#ff8fab', 0);
    ctx.beginPath();
    if (ollie.mood === 'think') { ctx.arc(0, 14, 5, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill(); }
    else { ctx.arc(0, 6, 12, 0.2, Math.PI - 0.2); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
    ctx.restore();
  }

  function drawFish(ctx, x, y, s, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(-42, -14); ctx.lineTo(-42, 14); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, 30, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    D.circle(ctx, 14, -5, 5, INK, 0); D.circle(ctx, 15.5, -6.5, 1.8, '#fff', 0);
    ctx.restore();
  }

  // Simple pictures for the word questions
  function drawThing(ctx, thing, x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 40, s / 40);
    ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const fillStroke = (c) => { ctx.fillStyle = c; ctx.fill(); ctx.stroke(); };
    const eyes = (ex, ey, gap) => { D.circle(ctx, ex - gap, ey, 4, INK, 0); D.circle(ctx, ex + gap, ey, 4, INK, 0); };
    if (thing === 'apple') {
      ctx.beginPath(); ctx.moveTo(0, -24); ctx.bezierCurveTo(30, -40, 46, 0, 22, 30); ctx.quadraticCurveTo(0, 40, -22, 30); ctx.bezierCurveTo(-46, 0, -30, -40, 0, -24); fillStroke('#ef476f');
      ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(4, -38); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(14, -36, 10, 5, -0.5, 0, 7); fillStroke('#52b788');
    } else if (thing === 'ball') {
      ctx.beginPath(); ctx.arc(0, 0, 34, 0, 7); fillStroke('#4cc9f0');
      ctx.beginPath(); ctx.arc(0, 0, 34, -0.6, 0.6); ctx.lineTo(0, 0); ctx.closePath(); fillStroke('#ffd166');
      ctx.beginPath(); ctx.arc(0, 0, 34, 2.5, 3.7); ctx.lineTo(0, 0); ctx.closePath(); fillStroke('#ef476f');
    } else if (thing === 'cat') {
      ctx.beginPath(); ctx.moveTo(-30, -14); ctx.lineTo(-26, -40); ctx.lineTo(-8, -26); ctx.lineTo(8, -26); ctx.lineTo(26, -40); ctx.lineTo(30, -14); ctx.quadraticCurveTo(36, 30, 0, 30); ctx.quadraticCurveTo(-36, 30, -30, -14); fillStroke('#ffb703');
      eyes(0, -6, 12); ctx.beginPath(); ctx.moveTo(-4, 6); ctx.lineTo(4, 6); ctx.lineTo(0, 11); ctx.closePath(); ctx.fillStyle = '#ff8fab'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-14, 10); ctx.lineTo(-40, 6); ctx.moveTo(14, 10); ctx.lineTo(40, 6); ctx.stroke();
    } else if (thing === 'dog') {
      ctx.beginPath(); ctx.ellipse(-30, -6, 12, 22, 0.3, 0, 7); fillStroke('#8b5a2b');
      ctx.beginPath(); ctx.ellipse(30, -6, 12, 22, -0.3, 0, 7); fillStroke('#8b5a2b');
      ctx.beginPath(); ctx.arc(0, 0, 30, 0, 7); fillStroke('#d4a373');
      eyes(0, -8, 11); ctx.beginPath(); ctx.ellipse(0, 8, 8, 6, 0, 0, 7); ctx.fillStyle = INK; ctx.fill();
      ctx.beginPath(); ctx.arc(0, 14, 8, 0.3, Math.PI - 0.3); ctx.stroke();
    } else if (thing === 'egg') {
      ctx.beginPath(); ctx.ellipse(0, 4, 28, 36, 0, 0, 7); fillStroke('#fff7e6');
      ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(-14, -8); ctx.lineTo(-4, 2); ctx.lineTo(8, -8); ctx.lineTo(18, 2); ctx.lineTo(27, -4); ctx.stroke();
    } else if (thing === 'fish') {
      drawFish(ctx, 4, 0, 1.2, '#ff8c42');
    } else if (thing === 'hat') {
      ctx.beginPath(); ctx.ellipse(0, 20, 44, 10, 0, 0, 7); fillStroke('#9b5de5');
      ctx.beginPath(); ctx.moveTo(-24, 20); ctx.lineTo(-20, -28); ctx.quadraticCurveTo(0, -36, 20, -28); ctx.lineTo(24, 20); ctx.closePath(); fillStroke('#9b5de5');
      ctx.fillStyle = '#ffd166'; ctx.fillRect(-23, 4, 46, 9); ctx.strokeRect(-23, 4, 46, 9);
    } else if (thing === 'kite') {
      ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(26, -6); ctx.lineTo(0, 26); ctx.lineTo(-26, -6); ctx.closePath(); fillStroke('#ef476f');
      ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(0, 26); ctx.moveTo(-26, -6); ctx.lineTo(26, -6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 26); ctx.quadraticCurveTo(10, 34, 0, 42); ctx.stroke();
    } else if (thing === 'moon') {
      ctx.beginPath(); ctx.arc(0, 0, 34, 0.9, Math.PI * 2 - 0.9, false); ctx.quadraticCurveTo(-6, 0, 21, 27); fillStroke('#ffe066');
    } else if (thing === 'pig') {
      ctx.beginPath(); ctx.moveTo(-24, -20); ctx.lineTo(-30, -38); ctx.lineTo(-10, -28); ctx.closePath(); fillStroke('#ffafcc');
      ctx.beginPath(); ctx.moveTo(24, -20); ctx.lineTo(30, -38); ctx.lineTo(10, -28); ctx.closePath(); fillStroke('#ffafcc');
      ctx.beginPath(); ctx.arc(0, 0, 32, 0, 7); fillStroke('#ffafcc');
      eyes(0, -10, 12); ctx.beginPath(); ctx.ellipse(0, 8, 14, 10, 0, 0, 7); fillStroke('#ff8fab');
      D.circle(ctx, -5, 8, 3, INK, 0); D.circle(ctx, 5, 8, 3, INK, 0);
    } else if (thing === 'star') {
      D.star(ctx, 0, 0, 38, '#ffd166', 4);
    } else if (thing === 'tree') {
      ctx.fillStyle = '#8b5a2b'; ctx.fillRect(-8, 6, 16, 32); ctx.strokeRect(-8, 6, 16, 32);
      ctx.beginPath(); ctx.arc(0, -10, 26, 0, 7); fillStroke('#52b788');
      ctx.beginPath(); ctx.arc(-18, 0, 16, 0, 7); fillStroke('#52b788'); ctx.beginPath(); ctx.arc(18, 0, 16, 0, 7); fillStroke('#52b788');
    } else if (thing === 'bus') {
      D.box(ctx, -44, -26, 88, 46, 10, '#ffd166', 4);
      for (const wx of [-34, -10, 14]) { ctx.fillStyle = '#bde0fe'; ctx.fillRect(wx, -18, 18, 16); ctx.strokeRect(wx, -18, 18, 16); }
      D.circle(ctx, -24, 22, 9, '#555', 4); D.circle(ctx, 24, 22, 9, '#555', 4);
    } else if (thing === 'cake') {
      D.box(ctx, -32, -8, 64, 38, 6, '#ffafcc', 4);
      ctx.beginPath(); ctx.moveTo(-32, 2); ctx.quadraticCurveTo(-24, 10, -16, 2); ctx.quadraticCurveTo(-8, 10, 0, 2); ctx.quadraticCurveTo(8, 10, 16, 2); ctx.quadraticCurveTo(24, 10, 32, 2); ctx.stroke();
      ctx.fillStyle = '#4cc9f0'; ctx.fillRect(-3, -28, 6, 20); ctx.strokeRect(-3, -28, 6, 20);
      ctx.beginPath(); ctx.ellipse(0, -34, 5, 8, 0, 0, 7); ctx.fillStyle = '#ff8c42'; ctx.fill();
    }
    ctx.restore();
  }

  // Sea friends (unlockables)
  function drawFriend(ctx, id, x, y, dir, t, alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(dir, 1);
    ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const fs = (c) => { ctx.fillStyle = c; ctx.fill(); ctx.stroke(); };
    const eye = (ex, ey) => { D.circle(ctx, ex, ey, 4.5, INK, 0); D.circle(ctx, ex + 1.5, ey - 1.5, 1.6, '#fff', 0); };
    if (id === 'crab') {
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 22, 0); ctx.lineTo(s * 34, -16); ctx.stroke(); ctx.beginPath(); ctx.arc(s * 36, -22, 8, 0, 7); fs('#ef476f'); }
      ctx.beginPath(); ctx.ellipse(0, 4, 26, 16, 0, 0, 7); fs('#ef476f'); eye(-8, 0); eye(8, 0);
    } else if (id === 'turtle') {
      ctx.beginPath(); ctx.arc(30, 0, 10, 0, 7); fs('#95d5b2'); eye(33, -3);
      ctx.beginPath(); ctx.ellipse(-16, 14, 8, 5, 0.5, 0, 7); fs('#95d5b2'); ctx.beginPath(); ctx.ellipse(16, 14, 8, 5, -0.5, 0, 7); fs('#95d5b2');
      ctx.beginPath(); ctx.ellipse(0, 0, 28, 18, 0, Math.PI, 0); ctx.lineTo(28, 6); ctx.lineTo(-28, 6); ctx.closePath(); fs('#52b788');
    } else if (id === 'seahorse') {
      ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(18, -28, 14, -14); ctx.quadraticCurveTo(22, 4, 6, 18); ctx.quadraticCurveTo(-4, 30, 8, 34); ctx.quadraticCurveTo(-14, 34, -6, 16); ctx.quadraticCurveTo(-14, 0, -4, -16); ctx.quadraticCurveTo(-12, -24, 0, -30); fs('#ffb703');
      eye(4, -22);
    } else if (id === 'jelly') {
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-15 + k * 10, 4); ctx.quadraticCurveTo(-15 + k * 10 + Math.sin(t * 4 + k) * 6, 22, -15 + k * 10, 36); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, 4, 22, Math.PI, 0); ctx.closePath(); fs('#ffafcc'); eye(-7, -4); eye(7, -4);
    } else if (id === 'whale') {
      ctx.beginPath(); ctx.moveTo(-40, -4); ctx.lineTo(-56, -18); ctx.lineTo(-54, 10); ctx.closePath(); fs('#4361ee');
      ctx.beginPath(); ctx.ellipse(0, 0, 44, 26, 0, 0, 7); fs('#4361ee');
      ctx.beginPath(); ctx.ellipse(4, 12, 34, 12, 0, 0, Math.PI); fs('#bde0fe'); eye(26, -6);
    } else if (id === 'starfish') {
      ctx.rotate(Math.sin(t) * 0.3); D.star(ctx, 0, 0, 26, '#ff8c42', 4); eye(-5, -2); eye(5, -2);
    } else if (id === 'narwhal') {
      ctx.beginPath(); ctx.moveTo(34, -8); ctx.lineTo(70, -20); ctx.lineTo(36, 0); ctx.closePath(); fs('#fff3b0');
      ctx.beginPath(); ctx.moveTo(-36, 0); ctx.lineTo(-50, -12); ctx.lineTo(-50, 12); ctx.closePath(); fs('#a9def9');
      ctx.beginPath(); ctx.ellipse(0, 0, 38, 20, 0, 0, 7); fs('#a9def9'); eye(22, -4);
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------
  // Menus
  // ---------------------------------------------------------------
  function levelPic(lv) {
    const big = { count: '123', find: 'ABC', add: '1+1', sub: '3−1', first: 'A…', lower: 'aA', missing: 'C_T', mix: '?!' }[lv.kind];
    return `<svg viewBox="0 0 120 70"><rect width="120" height="70" rx="10" fill="${lv.color}"/>
      <circle cx="94" cy="50" r="12" fill="rgba(255,255,255,0.4)" stroke="#fff" stroke-width="3"/><circle cx="20" cy="18" r="8" fill="rgba(255,255,255,0.4)" stroke="#fff" stroke-width="3"/>
      <text x="60" y="47" font-size="30" font-weight="900" text-anchor="middle" font-family="'Lilita One', 'Arial Black', sans-serif" fill="#fff" stroke="#2b2b2b" stroke-width="6" paint-order="stroke fill">${big}</text></svg>`;
  }
  function levels(g) {
    return LEVELS.map((lv, i) => {
      const rec = g.save.levels[lv.id] || {};
      return { ...lv, pic: levelPic(lv), locked: i > 0 && !(g.save.levels[LEVELS[i - 1].id] || {}).done,
        meta: Arcade.starsHTML(rec.stars || 0) };
    });
  }

  // Unlocks: your sea friends, plus a switch for the talking voice
  function extraMenu(g) {
    checkUnlocks(g);
    const wrap = Arcade.h('div');
    wrap.appendChild(Arcade.h('h2', { class: 'ar-title', style: 'font-size:24px;margin-top:6px' }, 'Sea friends'));
    const row = Arcade.h('div', { class: 'ar-grid' });
    for (const f of FRIENDS) {
      const ok = friendOpen(g, f);
      const c = document.createElement('canvas'); c.width = 180; c.height = 120; c.style.width = '90px'; c.style.height = '60px';
      const cx = c.getContext('2d'); cx.scale(1.5, 1.5); drawFriend(cx, f.id, 60, 40, 1, 0, 1);
      if (!ok) c.style.filter = 'brightness(0) opacity(0.4)';
      const lvName = (LEVELS.find(l => l.id === f.after) || {}).name;
      const tile = Arcade.h('div', { class: 'ar-tile' + (ok ? '' : ' locked') }, `<div class="pic"></div><div>${ok ? f.name : '???'}</div><div class="meta">${ok ? '' : 'Beat ' + lvName}</div>`);
      tile.querySelector('.pic').appendChild(c);
      row.appendChild(tile);
    }
    wrap.appendChild(row);
    const btns = Arcade.h('div', { class: 'ar-btns' });
    const vb = Arcade.h('button', { type: 'button', class: 'ar-btn white' }, (g.save.data.voice !== false ? icons.sound : icons.mute) + `<span>${g.save.data.voice !== false ? 'Voice on' : 'Voice off'}</span>`);
    vb.addEventListener('click', () => {
      g.save.data.voice = g.save.data.voice === false; g.store(); Arcade.sfx('click');
      vb.innerHTML = (g.save.data.voice !== false ? icons.sound : icons.mute) + `<span>${g.save.data.voice !== false ? 'Voice on' : 'Voice off'}</span>`;
    });
    btns.appendChild(vb);
    wrap.appendChild(btns);
    return wrap;
  }

  // ---------------------------------------------------------------
  // Start the game
  // ---------------------------------------------------------------
  const S = (inner) => `<svg viewBox="0 0 80 80">${inner}</svg>`;
  const BUB = (x, y, r, txt) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#bde0fe" stroke="#2b2b2b" stroke-width="3.5"/><text x="${x}" y="${y + r * 0.4}" font-size="${r * 1.1}" font-weight="900" text-anchor="middle" fill="#2b2b2b" font-family="sans-serif">${txt}</text>`;
  const L6 = 'stroke="#2b2b2b" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"';
  const L4 = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
  Arcade.start({
    id: 'abc',
    title: 'Bubble School',
    view: { w: W, h: H },
    background: '#1b5fbf',
    logo: Arcade.logo({
      title: 'Bubble School',
      colors: ['#bde0fe', '#4cc9f0'],
      tag: 'ABC 123',
      badge: Arcade.badges.abc,   // the round picture (arcade/badges.js)
    }),
    menuMusic: { tempo: 116, root: 62, scale: 'major', prog: [[1, 4, 5, 1], [6, 4, 2, 5]], drums: 'disco', bass: 'bounce', lead: 'triangle', pad: true, arp: true, seed: 2101 },
    music: { tempo: 92, root: 65, scale: 'major', prog: [[1, 6, 4, 5], [4, 5, 1, 1]], drums: 'soft', bass: 'whole', lead: 'triangle', pad: true, arp: true, seed: 2102 },
    trophies: [
      { id: 'first', name: 'First day of school', how: 'Finish a level' },
      { id: 'perfect', name: 'Top of the class', how: 'A level with no mistakes' },
      { id: 'streak10', name: 'Brain on fire', how: '10 right in a row' },
      { id: 'letters', name: 'Letter champ', how: 'Finish All the letters' },
      { id: 'math', name: 'Number whiz', how: 'Finish Take away to 10' },
      { id: 'golden', name: 'Star catcher', how: 'Pop 5 golden starfish' },
      { id: 'all', name: 'Bubble graduate', how: 'Finish the Brain buster' },
      { id: 'speedy', name: 'Quick thinker', how: 'Answer 10 questions super fast in one level', secret: true },
      { id: 'tickle', name: 'Tickle tickle', how: 'Tap Ollie the octopus 5 times', secret: true },
    ],
    levelsTitle: 'Pick a lesson',
    howTo: [
      { pic: S(`<path d="M10 14 H70 V40 H10 Z" fill="#fff" ${L4}/><text x="40" y="34" font-size="20" font-weight="900" text-anchor="middle" font-family="sans-serif" fill="#ef476f">2+1</text>` + BUB(40, 62, 13, '3')), text: 'Listen and look at the question' },
      { pic: S(BUB(28, 44, 16, 'B') + BUB(56, 30, 14, 'D') + `<path d="M52 56 l6 -10 l6 10 z" fill="#fff" ${L4}/>`), text: 'Pop the right bubble!' },
      { pic: S(`<path d="M18 30 h12 l14 -12 v44 l-14 -12 h-12 z" fill="#4cc9f0" ${L4}/><path d="M52 28 q8 12 0 24 M60 20 q14 20 0 40" fill="none" ${L4}/>`), text: 'Tap the question to hear it again' },
      { pic: S(`<circle cx="40" cy="40" r="22" fill="#fff3b0" stroke="#fff" stroke-width="4"/><path d="M40 24 l5 10 11 2 -8 8 2 11 -10 -5 -10 5 2 -11 -8 -8 11 -2z" fill="#ffd166" ${L4}/>`), text: 'Golden stars = bonus!' },
    ],
    levels,
    extraMenu,
    setup,
    update,
    draw: render,
    onPause() { if (window.speechSynthesis) speechSynthesis.cancel(); },
  });
})();
