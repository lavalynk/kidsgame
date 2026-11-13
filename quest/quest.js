// =====================================================================
// Potion Quest (Keith, Nov 13): a side-scrolling adventure in the spirit of
// the old walk-along arcade games - with our own heroes and friendly rules.
//
// Pick one of three heroes, walk to the right and bonk the grumpy blobs:
// a few bonks and a baddie goes dizzy and POOFS into sparkles. Baddies come
// in groups ("waves"); the screen stays put until a wave is gone, then GO!
// Break jars to find blue potions. The magic button uses ALL your potions
// for one big spell that fills the screen: more potions = a bigger spell.
//
//   Rowan the Knight  - strong wide swing, a bit slow, one more heart
//   Fern the Ranger   - fast feet and very quick little bonks
//   Pim the Wizard    - zaps from far away, and Pim's spells are stronger
//
// Your hero and your potions carry on into the next place when you press Next.
//
// Gentle: a bump costs one heart and you blink for a moment (nothing can bump
// you then). Out of hearts = "Nice try!" and you start again at the SAME wave.
// Little kids bonk by themselves when a baddie is close, and get more hearts.
//
// Controls: touch / click where you want to walk (hold to keep walking), the
// star button bonks, the potion button is magic. Keys: arrows, Space, X.
//
// The drawings are all in art.js. A stage is a list in STAGES below.
// =====================================================================
(function () {
  'use strict';
  const { draw, math, icons } = Arcade;
  const Art = QuestArt;
  const W = 960, H = 540;
  const TOP = 330;                       // where the ground starts
  const Y0 = 378, Y1 = 500;              // feet can be between these (near the back ... near the front)
  const MAX_POTIONS = 6;
  const KING_RING = 120;                 // how far the Blob King's landing reaches
  const ROCKY_RING = 105;                // ...and a boulder's stomp

  // ---- the heroes ----
  //   speed: walking speed.  dmg / range / deep / cool: the bonk (how hard, how far, how wide, how often)
  //   bolt: the bonk is a flying spark instead.  magic: extra oomph for spells.  hearts: extra hearts
  const HEROES = [
    { id: 'knight', name: 'Rowan', speed: 235, dmg: 2, range: 96, deep: 42, cool: 0.4, hearts: 1, magic: 0, color: '#ffd166', stats: [1, 3, 2] },
    { id: 'ranger', name: 'Fern', speed: 310, dmg: 1, range: 80, deep: 30, cool: 0.22, hearts: 0, magic: 0, color: '#b9fbc0', stats: [3, 2, 2] },
    { id: 'wizard', name: 'Pim', speed: 250, dmg: 1, range: 380, deep: 28, cool: 0.34, hearts: 0, magic: 3, bolt: true, color: '#e0aaff', stats: [2, 1, 3] },
  ];
  // ---- the baddies ----  hp = bonks to poof, r = size, pts = points
  const FOES = {
    blob:    { hp: 3, r: 28, speed: 80, pts: 20 },      // walks up, shakes, then bumps
    mini:    { hp: 1, r: 17, speed: 135, pts: 10 },     // a tiny quick blob: one bonk
    bigblob: { hp: 5, r: 42, speed: 60, pts: 40 },      // a big slow blob: poofs into two minis
    hopper:  { hp: 3, r: 24, speed: 0, pts: 30 },       // hops after you
    roller:  { hp: 4, r: 28, speed: 100, pts: 40 },     // lines up, then rolls across (step out of the way!) and gets dizzy
    shroom:  { hp: 3, r: 24, speed: 55, pts: 40 },      // stays back and lobs puffballs (watch the ring on the ground)
    flutter: { hp: 2, r: 20, speed: 150, pts: 30 },     // a bird: hovers, then swoops down at you
    shell:   { hp: 4, r: 26, speed: 55, pts: 40 },      // a snail: after each bonk it hides in its shell for a moment (bonks go "clink")
    rocky:   { hp: 7, r: 36, speed: 42, pts: 60 },      // a walking boulder: slow, tough, stomps (keep out of the ring)
    king:    { hp: 34, r: 62, speed: 0, pts: 500 },     // the boss: big hops with a ring of dust, and he calls blobs
  };
  // ---- the stages ----  waves: at = where the screen stops, foes = who comes: [type, seconds later, 'L' = from the left]
  //                        jars: [where, what's inside]
  const STAGES = [
    { id: 's1', name: 'Sunny Meadow', theme: 'meadow', len: 4200,
      waves: [
        { at: 760, foes: [['blob', 0], ['blob', 1], ['mini', 2], ['mini', 2.4, 'L']] },
        { at: 1440, foes: [['hopper', 0], ['blob', 0.8], ['mini', 2, 'L'], ['mini', 2.5], ['mini', 3, 'L']] },
        { at: 2120, foes: [['bigblob', 0], ['hopper', 1], ['hopper', 2.5, 'L'], ['blob', 3.5]] },
        { at: 2800, foes: [['flutter', 0], ['flutter', 1, 'L'], ['blob', 1.5], ['blob', 3], ['mini', 4], ['mini', 4.4, 'L']] },
        { at: 3480, foes: [['bigblob', 0], ['hopper', 0.8, 'L'], ['flutter', 2], ['blob', 3], ['hopper', 4], ['blob', 5, 'L']] },
      ],
      jars: [[380, 'potion'], [1100, 'apple'], [1160, 'potion'], [1780, 'potion'], [2460, 'apple'], [2520, 'potion'], [3140, 'potion'], [3200, 'apple'], [3860, 'coin']] },
    { id: 's2', name: 'Mushroom Woods', theme: 'woods', len: 4900,
      waves: [
        { at: 760, foes: [['shroom', 0], ['shell', 0.5], ['blob', 1.5, 'L'], ['mini', 2.5], ['mini', 3]] },
        { at: 1440, foes: [['roller', 0], ['flutter', 1], ['flutter', 1.5, 'L'], ['blob', 2.5], ['hopper', 3.5]] },
        { at: 2120, foes: [['shroom', 0], ['shroom', 0.5, 'L'], ['shell', 1.5], ['shell', 2.5, 'L'], ['hopper', 3.5], ['hopper', 4.5]] },
        { at: 2800, foes: [['roller', 0], ['roller', 2.5, 'L'], ['bigblob', 1], ['mini', 3], ['mini', 3.4, 'L'], ['mini', 3.8], ['mini', 4.2, 'L']] },
        { at: 3480, foes: [['rocky', 0], ['shroom', 1], ['flutter', 2, 'L'], ['flutter', 2.5], ['blob', 3.5], ['blob', 4.5, 'L']] },
        { at: 4160, foes: [['rocky', 0], ['roller', 1.5, 'L'], ['shell', 2.5], ['hopper', 3.5], ['hopper', 4.2, 'L'], ['mini', 5], ['mini', 5.4], ['mini', 5.8, 'L']] },
      ],
      jars: [[380, 'potion'], [1100, 'potion'], [1160, 'apple'], [1780, 'potion'], [2460, 'apple'], [2520, 'potion'], [3140, 'potion'], [3200, 'apple'], [3820, 'potion'], [3880, 'apple'], [4560, 'coin']] },
    { id: 's3', name: 'Castle Bridge', theme: 'castle', len: 4600,
      waves: [
        { at: 760, foes: [['roller', 0], ['hopper', 1], ['hopper', 2, 'L'], ['flutter', 2.5], ['flutter', 3, 'L'], ['blob', 4]] },
        { at: 1440, foes: [['shroom', 0], ['shroom', 0.5, 'L'], ['shell', 1.5], ['shell', 2.5, 'L'], ['rocky', 3.5]] },
        { at: 2120, foes: [['bigblob', 0], ['bigblob', 1, 'L'], ['mini', 2], ['mini', 2.4, 'L'], ['mini', 2.8], ['mini', 3.2, 'L'], ['flutter', 4], ['flutter', 4.5, 'L']] },
        { at: 2800, foes: [['rocky', 0], ['rocky', 1.5, 'L'], ['roller', 3], ['shroom', 4], ['hopper', 5], ['hopper', 5.8, 'L']] },
        { at: 3700, boss: true, foes: [['king', 0.5]] },
      ],
      jars: [[380, 'potion'], [1100, 'potion'], [1160, 'apple'], [1780, 'potion'], [1840, 'apple'], [2460, 'potion'], [2520, 'apple'], [3140, 'potion'], [3200, 'potion'], [3260, 'apple']] },
  ];

  let G = null, S = null;
  let resume = null;        // after "Nice try!": { level, wave, hero, potions } = start again at that wave
  let carry = null;         // after a win: { next, hero, potions } = the next stage keeps your hero and your potions (Keith, Nov 13)

  const pickedHero = (g) => HEROES.find(h => h.id === g.save.data.hero) || HEROES[0];
  const maxHearts = (g, h) => (g.little ? 5 : g.pick(4, 3, 3)) + h.hearts;     // (Keith, Nov 13: fewer hearts)

  // ---------------------------------------------------------------
  // Starting a stage
  // ---------------------------------------------------------------
  function setup(g, level) {
    G = g;
    const st = STAGES.find(s => s.id === level.id) || STAGES[0];
    const back = resume && resume.level === st.id ? resume : null;
    const on = !back && !level.fresh && carry && carry.next === st.id ? carry : null;      // carrying on from the stage before
    resume = null; carry = null;
    S = {
      t: 0, st, phase: back || on ? 'play' : 'pick', pick: Math.max(0, HEROES.indexOf(pickedHero(g))),
      cam: 0, wave: back ? back.wave : 0, locked: false, spawns: [], foes: [], bolts: [], puffs: [], rings: [], drops: [], poofs: [], texts: [],
      jars: st.jars.map(([x, kind], i) => ({ x, y: Y0 + 18 + (i % 3) * 38, kind, wob: 0 })),
      go: 0, score: 0, poofed: 0, bumps: 0, spell: null, won: false, lost: false, chest: false, endT: 0, bot: false, fast: 1, maxSpell: 0,
    };
    S.hero = makeHero(back || on ? HEROES.find(h => h.id === (back || on).hero) : pickedHero(g));
    if (back && back.wave > 0) {                       // start just before the wave you got to
      S.hero.x = st.waves[back.wave].at - 420; S.cam = Math.max(0, S.hero.x - W * 0.4);
      S.jars = S.jars.filter(j => j.x > S.hero.x - 100);
    }
    S.potions = back ? Math.max(back.potions, back.wave > 0 ? 2 : 0) : on ? on.potions : 0;
    window.__questState = () => ({
      stage: S.st.id, phase: S.phase, hero: S.hero.def.id, hearts: S.hero.hearts, maxHearts: S.hero.max, potions: S.potions, wave: S.wave, waves: S.st.waves.length, locked: S.locked,
      foes: S.foes.filter(f => f.state !== 'poof').length, poofed: S.poofed, x: Math.round(S.hero.x), y: Math.round(S.hero.y), score: S.score, won: S.won, lost: S.lost, spell: S.maxSpell, bumps: S.bumps,
      boss: (S.foes.find(f => f.type === 'king') || {}).hp || 0,
    });
    // test helpers: pick hero number i, let a bot play, play n times faster, jump to wave n, give potions
    window.__questPick = (i) => choose(i);
    window.__questBot = (on, fast) => { S.bot = on; S.fast = fast || 1; };
    window.__questWave = (n) => { S.wave = n; S.locked = false; S.foes = []; S.spawns = []; S.hero.x = S.st.waves[n].at - 420; S.cam = Math.max(0, S.hero.x - W * 0.4); };
    window.__questGive = (n) => { S.potions = Math.min(MAX_POTIONS, n); };
  }
  function makeHero(def) {
    const max = maxHearts(G, def);
    return { def, x: 140, y: 440, face: 1, walk: 0, bonk: -1, cool: 0, hurt: 0, hearts: max, max, target: null, hitDone: false };
  }
  function choose(i) {
    if (S.phase !== 'pick') return;
    S.pick = i; G.save.data.hero = HEROES[i].id; G.store();
    S.hero = makeHero(HEROES[i]); S.phase = 'play';
    G.sfx('power'); say('Go!', S.hero.x + 60, S.hero.y - 150, '#ffd166', 46);
  }

  // ---------------------------------------------------------------
  // Little helpers
  // ---------------------------------------------------------------
  const sx = (x) => x - S.cam;                             // world -> screen
  function say(text, x, y, color, size) { x = math.clamp(x, S.cam + 190, S.cam + W - 190); S.texts.push({ text, x, y, color: color || '#fff', size: size || 30, t: 0 }); }
  function sparkle(x, y, o) { G.particles.burst(sx(x), y, o); }
  function poofAt(x, y, big) {
    S.poofs.push({ x, y, t: 0, big });
    sparkle(x, y, { count: big ? 50 : 16, shape: 'star', speed: big ? 420 : 260, size: big ? 13 : 9, life: big ? 1.3 : 0.8, gravity: 200 });
  }
  function drop(kind, x, y) { S.drops.push({ kind, x, y: math.clamp(y, Y0, Y1), z: 30, vz: 220, t: 0 }); }

  // ---------------------------------------------------------------
  // The hero
  // ---------------------------------------------------------------
  // What the player wants this moment: { mx, my (-1..1), bonk, magic }
  function controls(g) {
    if (S.bot) return botControls();
    const h = S.hero, inp = g.input, p = inp.pointer;
    let mx = (inp.down('ArrowRight', 'KeyD') ? 1 : 0) - (inp.down('ArrowLeft', 'KeyA') ? 1 : 0);
    let my = (inp.down('ArrowDown', 'KeyS') ? 1 : 0) - (inp.down('ArrowUp', 'KeyW') ? 1 : 0);
    if (mx || my) h.target = null;
    // touch / click: walk to that spot (hold = keep following the finger)
    if (p.down || p.justDown) h.target = { x: p.x + S.cam, y: math.clamp(p.y, Y0, Y1) };
    if (h.target && !mx && !my) {
      const dx = h.target.x - h.x, dy = h.target.y - h.y, d = Math.hypot(dx, dy);
      if (d < 8) h.target = null; else { mx = dx / d; my = dy / d; }
    }
    return { mx, my, bonk: inp.hit('Space', 'KeyZ', 'Enter'), magic: inp.hit('KeyX', 'KeyM') };
  }
  const alive = () => S.foes.filter(f => f.state !== 'poof' && f.state !== 'enterwait');
  // can the hero's bonk reach this baddie right now (if the hero turned to face it)?
  function inReach(h, f) {
    return Math.abs(f.y - h.y) < h.def.deep + f.r * 0.35 && Math.abs(f.x - h.x) < h.def.range + f.r && f.x > S.cam - 20 && f.x < S.cam + W + 20;
  }
  function startBonk(h) {
    // turn to face the nearest baddie (or jar) in reach, so a bonk is never wasted
    const near = alive().filter(f => inReach(h, f)).sort((a, b) => Math.abs(a.x - h.x) - Math.abs(b.x - h.x))[0];
    if (near) h.face = near.x >= h.x ? 1 : -1;
    else { const j = S.jars.find(q => Math.abs(q.y - h.y) < 46 && Math.abs(q.x - h.x) < 100); if (j) h.face = j.x >= h.x ? 1 : -1; }
    h.bonk = 0; h.hitDone = false; h.cool = h.def.cool; h.target = null;
    G.sfx(h.def.bolt ? 'zap' : 'swish');
  }
  function hitFoe(f, dmg, fromX, magic) {
    if (f.state === 'poof') return;
    if (f.type === 'shell' && f.state === 'hide' && !magic) {          // hiding in its shell: clink! (magic still works)
      G.tone(1400, 0.06, { type: 'triangle', vol: 0.2 }); f.flash = 0.08; say('clink!', f.x, f.y - 80, '#bdefff', 22); return;
    }
    f.hp -= dmg; f.flash = 0.12;
    const heavy = f.type === 'king' || f.type === 'rocky';
    f.x += (f.x >= fromX ? 1 : -1) * (heavy ? 6 : 34);
    if (f.type === 'shell') { f.state = 'hide'; f.t = 0; }                // the snail pops into its shell
    else if (!heavy && f.state !== 'dizzy' && f.state !== 'roll') { f.state = 'stun'; f.t = 0; f.z = f.type === 'flutter' ? 60 : 0; f.vz = 0; }     // a bonk stops whatever it was doing
    G.sfx('hit'); sparkle(f.x, f.y - f.r, { count: 5, shape: 'star', speed: 180, size: 7, life: 0.4, gravity: 300, colors: ['#fff', '#ffd166'] });
    if (f.hp <= 0) poofFoe(f);
  }
  function poofFoe(f) {
    const def = FOES[f.type];
    f.state = 'poof'; f.t = 0;
    S.poofed++; S.score += def.pts;
    G.save.data.poofs = (G.save.data.poofs || 0) + 1;
    G.sfx('pop'); poofAt(f.x, f.y - f.r, f.type === 'king');
    say('+' + def.pts, f.x, f.y - f.r * 2 - 20, '#ffd166', 26);
    if (f.type === 'king') { G.sfx('win'); G.achieve('king'); for (let i = 0; i < 6; i++) drop('coin', f.x + (i - 2.5) * 46, f.y + (i % 2) * 30); }
    else if (f.type === 'bigblob') { for (const s of [-1, 1]) { const m = spawn('mini', false); m.x = f.x + s * 34; m.y = math.clamp(f.y + s * 14, Y0, Y1); m.state = 'stun'; m.t = 0.1; } }     // pop! two little ones
    else if (Math.random() < (S.potions < 2 ? 0.34 : 0.18)) drop('potion', f.x, f.y);
    else if (Math.random() < 0.3) drop('coin', f.x, f.y);
    if (G.save.data.poofs >= 100) G.achieve('hundred');
  }
  function bonkHits(h) {
    const d = h.def;
    if (d.bolt) { S.bolts.push({ x: h.x + h.face * 44, y: h.y, vx: h.face * 560, left: d.range, dmg: d.dmg }); return; }
    let n = 0;
    for (const f of alive()) {
      const dx = (f.x - h.x) * h.face;
      if (Math.abs(f.y - h.y) < d.deep + f.r * 0.35 && dx > -24 && dx < d.range + f.r) { hitFoe(f, d.dmg, h.x); n++; }
    }
    for (const j of S.jars.slice()) { const dx = (j.x - h.x) * h.face; if (Math.abs(j.y - h.y) < 46 && dx > -24 && dx < d.range + 20) breakJar(j); }
    if (n >= 3) G.achieve('three');
  }
  function breakJar(j) {
    S.jars.splice(S.jars.indexOf(j), 1);
    G.sfx('crash'); sparkle(j.x, j.y - 24, { count: 10, colors: ['#e9a66b', '#c97b3f'], speed: 220, size: 8, life: 0.5 });
    drop(j.kind, j.x, j.y); if (j.kind === 'coin') { drop('coin', j.x - 30, j.y + 14); drop('coin', j.x + 30, j.y - 14); }
  }
  function hurtHero(fromX) {
    const h = S.hero;
    if (h.hurt > 0 || S.spell || S.won || S.lost) return;
    h.hearts--; h.hurt = 1.5; S.bumps++; h.bonk = -1; h.target = null;
    h.x += (h.x >= fromX ? 1 : -1) * 46;
    G.sfx('bonk'); say('Oof!', h.x, h.y - 150, '#ffafcc', 30);
    if (h.hearts <= 0) {
      S.lost = true; S.endT = 0;
      resume = { level: S.st.id, wave: S.wave, hero: h.def.id, potions: S.wavePotions || 0 };      // "Again" starts at this wave
    }
  }
  // the big spell: uses every potion
  function castMagic() {
    const h = S.hero;
    if (!S.potions || S.spell) { if (!S.potions) G.sfx('bonk'); return; }
    const level = Math.min(3, Math.ceil(S.potions / 2));
    S.spell = { level, t: 0, hit: false, kind: h.def.id };
    S.maxSpell = Math.max(S.maxSpell, level);
    S.potions = 0;
    G.sfx('power'); G.music.stinger('treasure');
    say(['', 'Magic!', 'Big magic!', 'MEGA MAGIC!'][level], h.x, h.y - 170, '#fff', 30 + level * 8);
    if (level === 3) G.achieve('mega');
  }

  function updateHero(g, dt) {
    const h = S.hero, c = controls(g);
    if (h.hurt > 0) h.hurt -= dt;
    if (h.cool > 0) h.cool -= dt;
    if (c.magic) castMagic();
    // little kids (and Easy, a bit): bonk by itself when a baddie is in reach
    let wantBonk = c.bonk;
    if (g.little && h.cool <= 0 && alive().some(f => inReach(h, f))) wantBonk = true;
    if (wantBonk && h.cool <= 0 && h.bonk < 0) startBonk(h);
    if (h.bonk >= 0) {
      h.bonk += dt / 0.22;
      if (!h.hitDone && h.bonk > 0.15) { h.hitDone = true; bonkHits(h); }
      if (h.bonk >= 1) h.bonk = -1;
    }
    const slow = h.bonk >= 0 ? 0.65 : 1, m = Math.hypot(c.mx, c.my);
    if (m > 0.05 && h.hurt < 1.2) {
      const k = h.def.speed * slow / Math.max(1, m);
      h.x += c.mx * k * dt; h.y += c.my * k * 0.75 * dt;
      if (Math.abs(c.mx) > 0.2 && h.bonk < 0) h.face = c.mx > 0 ? 1 : -1;
      h.walk += dt;
    }
    h.y = math.clamp(h.y, Y0, Y1);
    h.x = math.clamp(h.x, S.cam + 40, Math.min(S.st.len - 40, S.cam + W - 40));
    // pick things up by walking over them
    for (const d of S.drops.slice()) {
      if (d.t < 0.3 || Math.hypot(d.x - h.x, (d.y - h.y) * 1.4) > 52) continue;
      if (d.kind === 'potion') { if (S.potions >= MAX_POTIONS) continue; S.potions++; g.sfx('coin'); say('+1', d.x, d.y - 70, '#4cc9f0', 26); if (S.potions === MAX_POTIONS) g.achieve('six'); }
      else if (d.kind === 'apple') { if (h.hearts >= h.max) continue; h.hearts++; g.sfx('star'); }
      else { S.score += 10; g.sfx('coin'); }
      S.drops.splice(S.drops.indexOf(d), 1);
      sparkle(d.x, d.y - 30, { count: 6, shape: 'star', speed: 160, size: 7, life: 0.4, gravity: 0 });
    }
  }

  // ---------------------------------------------------------------
  // The test bot (also a simple example of "how to play"): go to the nearest
  // baddie, stand beside it, bonk. Use magic when there are potions and a crowd.
  // ---------------------------------------------------------------
  function botControls() {
    const h = S.hero, foes = alive();
    let goal = null, bonk = false, magic = false;
    const near = foes.slice().sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))[0];
    if (near) {
      const side = h.x <= near.x ? -1 : 1, stand = h.def.bolt ? 200 : h.def.range * 0.6 + near.r * 0.5;
      goal = { x: near.x + side * stand, y: near.y };
      if (inReach(h, near)) bonk = true;
      if (near.type === 'rocky' && near.state === 'windup' && !h.def.bolt) { goal = { x: near.x + side * 190, y: near.y }; bonk = false; }      // step back from the stomp
      if (near.type === 'king' && near.state !== 'dizzy' && near.state !== 'call') {       // keep clear while he hops about
        const lx = near.state === 'hop' ? near.landX : near.x, away = lx > S.cam + W / 2 ? -1 : 1;
        if (Math.abs(h.x - lx) < 330) goal = { x: math.clamp(lx + away * 400, S.cam + 50, S.cam + W - 50), y: h.y < 440 ? Y1 : Y0 };
        if (h.def.bolt && Math.abs(h.y - near.y) < 40) goal.y = near.y;
      }
      if (S.potions >= 4 && (foes.length >= 3 || near.type === 'king')) magic = true;
    } else {
      const d = S.drops.find(q => (q.kind !== 'apple' || h.hearts < h.max) && (q.kind !== 'potion' || S.potions < MAX_POTIONS) && Math.abs(q.x - h.x) < 500);
      const j = S.jars.find(q => q.x > S.cam && q.x < S.cam + W);
      if (d) goal = { x: d.x, y: d.y };
      else if (j) { goal = { x: j.x - 50, y: j.y }; if (Math.abs(j.x - 50 - h.x) < 30 && Math.abs(j.y - h.y) < 30) { h.face = 1; bonk = true; } }
      else goal = { x: h.x + 200, y: 440 };
    }
    let mx = goal.x - h.x, my = goal.y - h.y; const d = Math.hypot(mx, my);
    if (d < 6) { mx = my = 0; } else { mx /= d; my /= d; }
    return { mx, my, bonk, magic };
  }

  // ---------------------------------------------------------------
  // The baddies
  // ---------------------------------------------------------------
  function spawn(type, left) {
    const def = FOES[type], hard = G.little ? 0.7 : G.pick(0.8, 1, 1.2);
    const f = { type, r: def.r, hp: Math.max(1, Math.round(def.hp * (type === 'king' ? hard : 1))), x: left ? S.cam - 70 : S.cam + W + 70, y: Y0 + 10 + Math.random() * (Y1 - Y0 - 20),
      z: 0, vz: 0, face: left ? 1 : -1, state: 'chase', t: 0, rest: 0.6 + Math.random() * 0.6, flash: 0, spin: 0, calls: 0 };
    if (type === 'king') { f.y = 440; f.max = f.hp; }
    if (type === 'flutter') f.z = 90;
    S.foes.push(f);
    return f;
  }
  const attackers = () => S.foes.filter(f => f.state === 'windup' || f.state === 'lunge' || f.state === 'roll' || f.state === 'swoop').length;
  const touching = (f, h, extra = 0) => Math.abs(f.x - h.x) < f.r + 24 + extra && Math.abs(f.y - h.y) < 26 + extra * 0.5;

  function updateFoe(g, f, dt) {
    const h = S.hero, def = FOES[f.type], sp = (g.little ? 0.75 : g.pick(0.85, 1, 1.15));
    const maxAtk = g.little ? 1 : g.pick(1, 2, 3);
    f.t += dt; if (f.flash > 0) f.flash -= dt; if (f.rest > 0) f.rest -= dt;
    if (f.state === 'poof') return;
    if (f.state === 'stun') { if (f.t > 0.45) { f.state = 'chase'; f.rest = 0.5; } return; }
    if (f.state === 'dizzy') { if (f.t > (f.type === 'king' ? 2.4 : 1.6)) { f.state = 'chase'; f.rest = 0.6; } return; }
    const dx = h.x - f.x, dy = h.y - f.y;
    if (f.state === 'hide') { if (f.t > 1.1) { f.state = 'chase'; f.rest = 0.4; } return; }
    if (f.state !== 'roll' && f.state !== 'lunge' && f.state !== 'hop' && f.state !== 'swoop') f.face = dx >= 0 ? 1 : -1;
    const walkTo = (tx, ty, speed) => { const ex = tx - f.x, ey = ty - f.y, d = Math.hypot(ex, ey); if (d > 4) { f.x += ex / d * speed * dt; f.y += ey / d * speed * 0.7 * dt; } return d; };

    if (f.type === 'blob' || f.type === 'mini' || f.type === 'bigblob' || f.type === 'shell') {      // walk up, shake, bump
      if (f.state === 'chase') {
        let tx = h.x - f.face * (f.r + 34);                      // stand beside the hero...
        if (tx > S.cam + W - 30 || tx < S.cam + 30) tx = h.x + f.face * (f.r + 34);     // (...on the other side if that's off the screen)
        const d = walkTo(tx, h.y, def.speed * sp);
        if (d < 26 && f.rest <= 0 && attackers() < maxAtk) { f.state = 'windup'; f.t = 0; }
      } else if (f.state === 'windup') { if (f.t > (g.little ? 1.0 : g.pick(0.8, 0.6, 0.45)) * (f.type === 'bigblob' ? 1.3 : 1)) { f.state = 'lunge'; f.t = 0; f.dir = f.face; g.sfx('swish'); } }
      else if (f.state === 'lunge') {
        f.x += f.dir * 380 * dt;
        if (touching(f, h)) hurtHero(f.x);
        if (f.t > 0.26) { f.state = 'chase'; f.rest = 1.2; }
      }
    } else if (f.type === 'flutter') {
      // a bird: flies to a spot up in the air beside the hero, shakes, then swoops down through where the hero is
      if (f.state === 'chase') {
        f.z += (90 + Math.sin(f.t * 5) * 10 - f.z) * 4 * dt;
        const side = f.x < h.x ? -1 : 1;
        const d = walkTo(math.clamp(h.x + side * 210, S.cam + 40, S.cam + W - 40), h.y, def.speed * sp);
        if (d < 40 && f.rest <= 0 && attackers() < maxAtk) { f.state = 'windup'; f.t = 0; }
      } else if (f.state === 'windup') {
        if (f.t > (g.little ? 1.0 : g.pick(0.85, 0.65, 0.5))) { f.state = 'swoop'; f.t = 0; f.dir = f.face; f.vy = (h.y - f.y) / 0.5; g.sfx('whoosh'); }
      } else if (f.state === 'swoop') {
        f.x += f.dir * 430 * sp * dt; if (f.t < 0.5) f.y += f.vy * dt;
        f.z = 90 * Math.abs(1 - f.t / 0.5);                            // down to the ground and up again
        if (f.z < 40 && touching(f, h)) hurtHero(f.x);
        if (f.t > 1.0) { f.state = 'chase'; f.rest = g.little ? 2.6 : g.pick(2.2, 1.6, 1.2); }
      }
    } else if (f.type === 'rocky') {
      // a boulder: plods up close, lifts its fists, STOMP (a ring of dust: stand outside it)
      if (f.state === 'chase') {
        const d = walkTo(h.x - f.face * 70, h.y, def.speed * sp);
        if (d < 40 && f.rest <= 0) { f.state = 'windup'; f.t = 0; }
      } else if (f.state === 'windup') {
        if (f.t > (g.little ? 1.5 : g.pick(1.3, 1.0, 0.8))) {
          S.rings.push({ x: f.x, y: f.y, t: 0, max: ROCKY_RING }); S.shake = 0.2; g.sfx('land');
          if (Math.hypot(h.x - f.x, (h.y - f.y) * 1.6) < ROCKY_RING - 12) hurtHero(f.x);
          f.state = 'chase'; f.rest = g.little ? 3 : g.pick(2.6, 2.0, 1.6);
        }
      }
    } else if (f.type === 'hopper' || f.type === 'king') {
      const king = f.type === 'king';
      if (f.state === 'chase') {
        if (king && f.hp < f.max * (0.7 - f.calls * 0.35) && f.calls < 2) { f.calls++; f.state = 'call'; f.t = 0; g.sfx('whoosh'); say('!', f.x, f.y - 190, '#ffd166', 44); return; }
        if (f.rest <= 0 && (king || attackers() < maxAtk + 1)) { f.state = 'windup'; f.t = 0; }
        else if (!king) walkTo(h.x - f.face * 150, h.y, 40 * sp);
      } else if (f.state === 'call') { if (f.t > 0.8) { spawn('mini', false); spawn('mini', true); spawn('blob', f.calls > 1); f.state = 'chase'; f.rest = 1; } }
      else if (f.state === 'windup') {
        if (f.t > (king ? 1.0 : 0.45)) {         // jump towards where the hero is now
          const far = Math.min(king ? 230 : 190, Math.hypot(dx, dy)), a = Math.atan2(dy, dx);
          f.state = 'hop'; f.t = 0; f.hopT = king ? 0.75 : 0.55; f.vx = Math.cos(a) * far / f.hopT; f.vy = Math.sin(a) * far / f.hopT;
          f.vz = king ? 620 : 520; f.z = 1; g.sfx('jump');
          if (king) { f.landX = f.x + f.vx * f.hopT; f.landY = math.clamp(f.y + f.vy * f.hopT, Y0, Y1); }     // (a ring on the ground shows where he'll land)
        }
      } else if (f.state === 'hop') {
        f.x += f.vx * dt; f.y = math.clamp(f.y + f.vy * dt, Y0, Y1); f.z += f.vz * dt; f.vz -= (2 * (king ? 620 : 520) / f.hopT) * dt;
        if (f.z <= 0) {
          f.z = 0; g.sfx('land');
          if (king) { S.rings.push({ x: f.x, y: f.y, t: 0, max: KING_RING }); S.shake = 0.3; if (Math.hypot(h.x - f.x, (h.y - f.y) * 1.6) < KING_RING - 14) hurtHero(f.x); f.hops = (f.hops || 0) + 1; }
          else if (touching(f, h, 6)) hurtHero(f.x);
          if (king && f.hops >= 3) { f.hops = 0; f.state = 'dizzy'; f.t = 0; }        // puffed out: bonk him now!
          else { f.state = 'chase'; f.rest = king ? 0.5 : (g.little ? 1.6 : g.pick(1.4, 1.0, 0.7)); }
        }
      }
    } else if (f.type === 'roller') {
      if (f.state === 'chase') {
        const side = f.x < h.x ? -1 : 1;
        const d = walkTo(math.clamp(h.x + side * 300, S.cam + 50, S.cam + W - 50), h.y, def.speed * sp);
        if ((d < 30 || Math.abs(dy) < 14) && f.rest <= 0 && attackers() < maxAtk) { f.state = 'windup'; f.t = 0; }
      } else if (f.state === 'windup') { f.spin += dt * 14; if (f.t > (g.little ? 1.3 : g.pick(1.1, 0.85, 0.65))) { f.state = 'roll'; f.t = 0; f.dir = f.face; g.sfx('whoosh'); } }
      else if (f.state === 'roll') {
        f.x += f.dir * 500 * sp * dt; f.spin += f.dir * dt * 18;
        if (touching(f, h)) hurtHero(f.x);
        if (f.t > 1.1 || f.x < S.cam + 30 || f.x > S.cam + W - 30) { f.state = 'dizzy'; f.t = 0; f.x = math.clamp(f.x, S.cam + 40, S.cam + W - 40); }
      }
    } else if (f.type === 'shroom') {
      if (f.state === 'chase') {
        const side = f.x < h.x ? -1 : 1;
        walkTo(math.clamp(h.x + side * 300, S.cam + 60, S.cam + W - 60), f.y + (dy > 0 ? 10 : -10) * (Math.abs(dy) > 60 ? 1 : 0), def.speed * sp);
        if (f.rest <= 0 && f.x > S.cam + 30 && f.x < S.cam + W - 30) { f.state = 'windup'; f.t = 0; }
      } else if (f.state === 'windup') {
        if (f.t > 0.5) {                   // lob a puffball at where the hero is standing
          const T = g.little ? 1.5 : g.pick(1.3, 1.05, 0.85);
          S.puffs.push({ x0: f.x, y0: f.y, x: f.x, y: f.y, tx: h.x, ty: h.y, t: 0, T });
          g.sfx('shoot'); f.state = 'chase'; f.rest = g.little ? 3.6 : g.pick(3.2, 2.5, 2);
        }
      }
    }
    f.y = math.clamp(f.y, Y0, Y1);
  }

  // ---------------------------------------------------------------
  // Every 1/120 s
  // ---------------------------------------------------------------
  function update(g, dt) { for (let i = 0; i < (S.fast || 1); i++) tick(g, dt); }
  function tick(g, dt) {
    S.t += dt;
    for (const q of S.texts) q.t += dt; S.texts = S.texts.filter(q => q.t < 1.1);
    for (const q of S.poofs) q.t += dt; S.poofs = S.poofs.filter(q => q.t < 0.5);
    for (const q of S.rings) q.t += dt; S.rings = S.rings.filter(q => q.t < 0.5);
    if (S.shake > 0) S.shake -= dt;
    if (S.phase === 'pick') { pickScreen(g); return; }
    if (S.won || S.lost) { S.endT += dt; if (S.endT > (S.won ? 2.2 : 1.2)) finish(g); if (S.won) return; }
    const st = S.st, h = S.hero;

    // a spell in the air: everything else waits, then every baddie on screen gets hit
    if (S.spell) {
      const sp = S.spell; sp.t += dt;
      if (!sp.hit && sp.t > 0.9) {
        sp.hit = true; S.shake = 0.3;
        const dmg = [0, 3, 6, 12][sp.level] + h.def.magic;
        let n = 0;
        for (const f of alive()) { hitFoe(f, dmg, f.x - f.face, true); n++; }      // (even one that is just walking in)
        S.puffs = [];
        for (const j of S.jars.slice()) if (j.x > S.cam && j.x < S.cam + W) breakJar(j);
        if (n >= 4) g.achieve('sweep');
      }
      if (sp.t > 1.6) S.spell = null;
      return;
    }
    if (!S.lost) updateHero(g, dt);

    // the camera follows the hero until it reaches the next wave's stopping place
    const wave = st.waves[S.wave];
    const camMax = wave ? wave.at - W / 2 : st.len - W;
    if (!S.locked) S.cam = math.clamp(math.lerp(S.cam, h.x - W * 0.4, 0.08), Math.max(0, S.cam - 2), camMax);
    if (wave && !S.locked && S.cam >= camMax - 2) {
      S.locked = true; S.cam = camMax; S.go = 0; S.wavePotions = S.potions;
      S.spawns = wave.foes.map(([type, at, side]) => ({ type, at: S.t + at, left: side === 'L' }));
      if (wave.boss) { g.music.stinger('boss'); g.music.mood({ energy: 2, tempo: 1.06 }); say('The Blob King!', S.cam + W / 2, 170, '#ffd166', 46); }
    }
    for (const s of S.spawns.slice()) if (S.t >= s.at) { spawn(s.type, s.left); S.spawns.splice(S.spawns.indexOf(s), 1); }
    for (const f of S.foes) updateFoe(g, f, dt);
    // baddies don't stand on top of each other
    for (let i = 0; i < S.foes.length; i++) for (let j = i + 1; j < S.foes.length; j++) {
      const a = S.foes[i], b = S.foes[j]; if (a.state === 'poof' || b.state === 'poof' || a.z > 0 || b.z > 0) continue;
      const dx = b.x - a.x, dy = (b.y - a.y) * 2, d = Math.hypot(dx, dy) || 1, min = a.r + b.r;
      if (d < min) { const k = (min - d) / d * 0.5 * dt * 6; a.x -= dx * k; b.x += dx * k; a.y -= dy * k * 0.5; b.y += dy * k * 0.5; }
    }
    S.foes = S.foes.filter(f => !(f.state === 'poof' && f.t > 0.4));
    if (S.locked && !S.spawns.length && !S.foes.length) {          // wave cleared!
      S.locked = false; S.wave++; S.go = 3;
      g.sfx('star'); if (wave.boss) g.music.mood({ energy: 1, tempo: 1 });
    }
    if (S.go > 0) S.go -= dt;

    // the wizard's sparks
    for (const b of S.bolts) {
      const stepX = b.vx * dt; b.x += stepX; b.left -= Math.abs(stepX);
      const f = alive().find(q => Math.abs(q.x - b.x) < q.r + 10 && Math.abs(q.y - b.y) < S.hero.def.deep + q.r * 0.35);
      const j = S.jars.find(q => Math.abs(q.x - b.x) < 24 && Math.abs(q.y - b.y) < 46);
      if (f) { hitFoe(f, b.dmg, b.x - b.vx); b.left = 0; } else if (j) { breakJar(j); b.left = 0; }
    }
    S.bolts = S.bolts.filter(b => b.left > 0);
    // puffballs in the air (the ring on the ground shows where one will land)
    for (const p of S.puffs) {
      p.t += dt; const k = Math.min(1, p.t / p.T);
      p.x = math.lerp(p.x0, p.tx, k); p.y = math.lerp(p.y0, p.ty, k); p.z = Math.sin(k * Math.PI) * 170 + 30 * (1 - k);
      if (k >= 1) { p.done = true; g.sfx('pop'); sparkle(p.tx, p.ty - 10, { count: 8, colors: ['#fff3d6', '#ffd6a5'], speed: 160, size: 7, life: 0.4, gravity: 100 }); if (Math.hypot(h.x - p.tx, (h.y - p.ty) * 1.5) < 42) hurtHero(p.tx - 1); }
    }
    S.puffs = S.puffs.filter(p => !p.done);
    for (const d of S.drops) { d.t += dt; if (d.z > 0 || d.vz > 0) { d.z += d.vz * dt; d.vz -= 900 * dt; if (d.z < 0) { d.z = 0; d.vz = 0; } } }
    for (const j of S.jars) if (j.wob > 0) j.wob -= dt;

    // the treasure chest at the end
    if (!wave && !S.won && !S.lost && h.x > st.len - 190) {
      S.won = true; S.chest = true; S.endT = 0; h.target = null;
      g.sfx('unlock'); g.music.stinger('treasure'); sparkle(st.len - 110, 400, { count: 40, shape: 'star', speed: 380, size: 12, life: 1.2 });
      say('Treasure!', st.len - 110, 300, '#ffd166', 44);
    }
  }
  function finish(g) {
    if (S.done) return; S.done = true;
    const h = S.hero;
    if (S.lost) {
      g.finish({ win: false, score: S.score, title: 'Nice try!', lines: [S.poofed + ' poofs', 'You keep your place!'], delay: 200 });
      return;
    }
    const left = h.hearts / h.max, stars = left >= 0.66 ? 3 : left >= 0.33 ? 2 : 1;
    S.score += h.hearts * 50;
    const nextSt = STAGES[STAGES.indexOf(S.st) + 1];
    if (nextSt) carry = { next: nextSt.id, hero: h.def.id, potions: S.potions };      // "Next" keeps your hero and your potions
    g.achieve('first');
    const won = g.save.data.won = g.save.data.won || {};
    won[h.def.id] = true; g.store();
    if (HEROES.every(q => won[q.id])) g.achieve('team');
    if (S.bumps === 0) g.achieve('nobump');
    g.finish({ win: true, stars, score: S.score, title: S.st.id === 's3' ? 'You saved the castle!' : 'You did it!',
      lines: [S.poofed + ' poofs', h.hearts + ' hearts left'], next: STAGES.indexOf(S.st) + 1 < STAGES.length, delay: 300 });
  }

  // ---------------------------------------------------------------
  // "Pick your hero": three big cards. Tap one (or left / right + Space).
  // ---------------------------------------------------------------
  const CARD = { w: 250, h: 330, y: 150, xs: [70, 355, 640] };
  function pickScreen(g) {
    const p = g.input.pointer;
    if (g.input.hit('ArrowRight', 'KeyD')) { S.pick = (S.pick + 1) % 3; g.sfx('click'); }
    if (g.input.hit('ArrowLeft', 'KeyA')) { S.pick = (S.pick + 2) % 3; g.sfx('click'); }
    if (g.input.hit('Space', 'Enter')) { choose(S.pick); return; }
    if (p.justUp) CARD.xs.forEach((x, i) => { if (p.x > x && p.x < x + CARD.w && p.y > CARD.y && p.y < CARD.y + CARD.h) choose(i); });
  }
  function drawPick(g, ctx) {
    Art.background(ctx, S.st.theme, 0, S.t, W, H, TOP);
    ctx.fillStyle = 'rgba(30,20,70,0.55)'; ctx.fillRect(0, 0, W, H);
    draw.text(ctx, 'Pick your hero', W / 2, 96, { size: 44, color: '#ffd166' });
    HEROES.forEach((hd, i) => {
      const x = CARD.xs[i], on = i === S.pick, lift = on ? Math.sin(S.t * 5) * 4 - 6 : 0;
      draw.box(ctx, x, CARD.y + lift, CARD.w, CARD.h, 28, on ? '#fff8e6' : 'rgba(255,255,255,0.82)', on ? 7 : 4);
      if (on) { ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 6; draw.rr(ctx, x - 7, CARD.y + lift - 7, CARD.w + 14, CARD.h + 14, 34); ctx.stroke(); }
      ctx.save(); ctx.translate(x + CARD.w / 2, CARD.y + lift + 205); ctx.scale(1.25, 1.25);
      Art.hero(ctx, hd.id, 0, 0, S.t + i, { face: 1, walk: on ? S.t : 0, bonk: on ? ((S.t * 1.2) % 1.6 < 0.4 ? ((S.t * 1.2) % 1.6) / 0.4 : -1) : -1 });
      ctx.restore();
      // three little rows of dots: fast feet, strong bonk, strong magic
      const icons3 = ['feet', 'bonk', 'magic'];
      hd.stats.forEach((n, r) => {
        const yy = CARD.y + lift + 236 + r * 30, x0 = x + 54;
        if (icons3[r] === 'feet') { ctx.beginPath(); ctx.ellipse(x0, yy, 13, 8, 0, 0, 7); ctx.fillStyle = '#c68b59'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = draw.INK; ctx.stroke(); }
        else if (icons3[r] === 'bonk') draw.star(ctx, x0, yy, 12, '#ffd166', 3);
        else Art.potion(ctx, x0, yy + 6, 0.62);
        for (let k = 0; k < 3; k++) draw.circle(ctx, x0 + 48 + k * 34, yy, 10, k < n ? hd.color : 'rgba(0,0,0,0.12)', 3);
      });
    });
  }

  // ---------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------
  function render(g, ctx) {
    if (!S) return;
    if (S.phase === 'pick') { drawPick(g, ctx); return; }
    const st = S.st, h = S.hero, t = S.t;
    ctx.save();
    if (S.shake > 0) ctx.translate(Math.sin(t * 90) * 5 * S.shake * 3, Math.cos(t * 70) * 4 * S.shake * 3);
    Art.background(ctx, st.theme, S.cam, t, W, H, TOP);
    ctx.save(); ctx.translate(-S.cam, 0);
    // where a tap is walking to
    if (h.target) { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(h.target.x, h.target.y, 16 + Math.sin(t * 8) * 3, 7, 0, 0, 7); ctx.stroke(); }
    // rings: the king's dust ring, and where a puffball will land
    for (const r of S.rings) { const k = r.t / 0.5; ctx.strokeStyle = `rgba(255,255,255,${1 - k})`; ctx.lineWidth = 10 * (1 - k) + 2; ctx.beginPath(); ctx.ellipse(r.x, r.y, r.max * k, r.max * k * 0.4, 0, 0, 7); ctx.stroke(); }
    for (const f of S.foes) if (f.type === 'rocky' && f.state === 'windup') { ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 4; ctx.setLineDash([10, 7]); ctx.beginPath(); ctx.ellipse(f.x, f.y, ROCKY_RING, ROCKY_RING * 0.4, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
    for (const f of S.foes) if (f.type === 'king' && f.state === 'hop') { ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 5; ctx.setLineDash([12, 8]); ctx.beginPath(); ctx.ellipse(f.landX, f.landY, KING_RING, KING_RING * 0.4, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
    for (const p of S.puffs) { const k = p.t / p.T; ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 4; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.ellipse(p.tx, p.ty, 40 - k * 12, 15 - k * 4, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
    // everything standing on the ground, back to front
    const things = [];
    for (const j of S.jars) things.push({ y: j.y, d: () => Art.jar(ctx, j.x, j.y, t, j.wob) });
    for (const d of S.drops) things.push({ y: d.y, d: () => Art.pickup(ctx, d, t) });
    for (const f of S.foes) if (f.state !== 'poof') things.push({ y: f.y, d: () => Art.foe(ctx, f, t) });
    things.push({ y: 440, d: () => Art.chest(ctx, st.len - 110, 440, S.chest, t) });
    things.push({ y: h.y, d: () => {
      if (h.bonk >= 0 && !h.def.bolt) Art.swoosh(ctx, h.x, h.y, h.face, h.def.range, h.bonk, h.def.color);
      Art.hero(ctx, h.def.id, h.x, h.y, t, { face: h.face, walk: h.walk, bonk: h.bonk, hurt: h.hurt > 0, cheer: S.won, magic: !!S.spell });
      if (S.lost) draw.text(ctx, 'z z z', h.x + 30, h.y - 130 - Math.sin(t * 3) * 6, { size: 24, color: '#bde0fe' });
    } });
    things.sort((a, b) => a.y - b.y).forEach(q => q.d());
    for (const b of S.bolts) { draw.star(ctx, b.x, b.y - 52, 13, '#ffd166', 3); draw.circle(ctx, b.x - Math.sign(b.vx) * 18, b.y - 52, 6, '#e0aaff', 0); draw.circle(ctx, b.x - Math.sign(b.vx) * 32, b.y - 52, 4, '#e0aaff', 0); }
    for (const p of S.puffs) { draw.circle(ctx, p.x, p.y - p.z, 13, '#fff3d6', 3.5); draw.circle(ctx, p.x - 4, p.y - p.z - 4, 3, '#ef476f', 0); }
    for (const p of S.poofs) { const k = p.t / 0.5, r = (p.big ? 90 : 40) * (0.4 + k); ctx.globalAlpha = 1 - k; for (let i = 0; i < 5; i++) { const a = i * 1.26 + 0.4; draw.circle(ctx, p.x + Math.cos(a) * r * 0.6, p.y + Math.sin(a) * r * 0.5, r * 0.45, '#fff', 0); } ctx.globalAlpha = 1; }
    for (const q of S.texts) { ctx.globalAlpha = Math.min(1, (1.1 - q.t) * 3); draw.text(ctx, q.text, q.x, q.y - q.t * 34, { size: q.size * Math.min(1, 0.5 + q.t * 5), color: q.color }); ctx.globalAlpha = 1; }
    ctx.restore();
    if (S.spell) Art.spell(ctx, S.spell.kind, S.spell.level, S.spell.t / 1.6, t, W, H);
    ctx.restore();

    // ---- on top: hearts, potions, score, the boss's bar, GO! ----
    for (let i = 0; i < h.max; i++) Art.heart(ctx, 118 + i * 34, 32, 1, i < h.hearts);
    for (let i = 0; i < MAX_POTIONS; i++) Art.potion(ctx, 118 + i * 30, 86, 0.8, i >= S.potions);
    if (S.potions > 0) { const lv = Math.min(3, Math.ceil(S.potions / 2)); for (let i = 0; i < lv; i++) draw.star(ctx, 118 + MAX_POTIONS * 30 + 14 + i * 24, 76, 10 + Math.sin(t * 6 + i) * 1.5, '#ffd166', 2.5); }
    draw.text(ctx, String(S.score), W - 110, 36, { size: 32, color: '#ffd166', align: 'right' });
    const king = S.foes.find(f => f.type === 'king');
    if (king && king.state !== 'poof') draw.meter(ctx, W / 2 - 170, 96, 340, 22, king.hp / king.max, '#c77dff');
    // which wave: a row of dots (the crown = the boss)
    st.waves.forEach((w, i) => { const x = W / 2 - (st.waves.length - 1) * 15 + i * 30; if (w.boss) draw.star(ctx, x, 30, 11, i < S.wave ? '#06d6a0' : '#ffc93c', 3); else draw.circle(ctx, x, 30, 8, i < S.wave ? '#06d6a0' : i === S.wave && S.locked ? '#ffd166' : '#fff', 3); });
    if (S.go > 0 && !S.locked && !S.won && Math.floor(t * 3) % 2 === 0) {
      draw.text(ctx, 'GO!', W - 150, 200, { size: 44, color: '#06d6a0' });
      ctx.beginPath(); ctx.moveTo(W - 60, 200); ctx.lineTo(W - 96, 174); ctx.lineTo(W - 96, 226); ctx.closePath(); ctx.fillStyle = '#06d6a0'; ctx.fill(); ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeStyle = draw.INK; ctx.stroke();
    }
  }

  // ---------------------------------------------------------------
  // Menus
  // ---------------------------------------------------------------
  function stagePic(st) {
    const T = Art.THEMES[st.theme];
    const foe = st.id === 's3' ? `<path d="M52 44 Q50 20 68 20 Q86 20 84 44 Z" fill="#c77dff" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/><path d="M58 22 L57 12 L63 17 L68 10 L73 17 L79 12 L78 22 Z" fill="#ffc93c" stroke="#2b2b2b" stroke-width="2.5" stroke-linejoin="round"/>`
      : st.id === 's2' ? `<rect x="60" y="32" width="14" height="14" rx="5" fill="#fff3d6" stroke="#2b2b2b" stroke-width="3"/><path d="M52 34 Q54 14 67 14 Q80 14 82 34 Q67 28 52 34 Z" fill="#ef476f" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/>`
      : `<path d="M54 46 Q52 26 67 26 Q82 26 80 46 Z" fill="#7bd389" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/>`;
    return `<svg viewBox="0 0 96 54"><rect width="96" height="54" rx="8" fill="${T.sky[0]}"/><path d="M0 34 Q24 14 48 34 Q72 20 96 34 V54 H0 Z" fill="${T.far}"/><rect y="40" width="96" height="14" fill="${T.path}"/><path d="M0 40 H96" stroke="#2b2b2b" stroke-width="2.5"/>` +
      `<circle cx="24" cy="26" r="9" fill="#ffd6a5" stroke="#2b2b2b" stroke-width="3"/><rect x="17" y="34" width="14" height="13" rx="5" fill="#4c8dff" stroke="#2b2b2b" stroke-width="3"/>${foe}</svg>`;
  }
  function levels(g) {
    return STAGES.map((st, i) => ({ id: st.id, name: st.name, pic: stagePic(st), locked: i > 0 && !(g.save.levels[STAGES[i - 1].id] || {}).done }));
  }

  const Sv = (inner) => `<svg viewBox="0 0 80 80">${inner}</svg>`;
  const LINK = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
  Arcade.start({
    id: 'quest',
    title: 'Potion Quest',
    littleSpeed: 0.85,
    trophies: [
      { id: 'first', name: 'Brave hero', how: 'Finish a stage' },
      { id: 'six', name: 'Potion pockets', how: 'Carry 6 potions' },
      { id: 'mega', name: 'Mega magic', how: 'Cast the biggest spell' },
      { id: 'sweep', name: 'Clean sweep', how: 'Hit 4 baddies with one spell' },
      { id: 'king', name: 'Bye bye, Blob King', how: 'Poof the Blob King' },
      { id: 'team', name: 'Dream team', how: 'Win a stage with every hero' },
      { id: 'hundred', name: 'Poof! Poof! Poof!', how: 'Poof 100 baddies' },
      { id: 'nobump', name: 'Not a scratch', how: 'Finish a stage without a bump', secret: true },
      { id: 'three', name: 'Three at once', how: 'Bonk 3 baddies with one swing', secret: true },
    ],
    logo: Arcade.logo({
      badge: Arcade.badges.quest,
      title: 'Potion', title2: 'Quest', colors: ['#bdefff', '#c77dff'], bg: '#7b5fd6',
      art: `<path d="M150 70 Q146 30 180 30 Q214 30 210 70 Z" fill="#7bd389" ${LINK}/><circle cx="170" cy="52" r="4" fill="#2b2b2b"/><circle cx="190" cy="52" r="4" fill="#2b2b2b"/>
            <g class="wobble"><path d="M62 40 H78 V60 Q100 72 94 98 Q70 114 46 98 Q40 72 62 60 Z" fill="#4cc9f0" ${LINK}/><rect x="58" y="30" width="24" height="12" rx="4" fill="#c68b59" ${LINK}/><circle cx="60" cy="84" r="6" fill="#fff"/></g>` }),
    view: { w: W, h: H },
    background: '#3b2a7a',
    music: { tempo: 126, root: 57, scale: 'dorian', prog: [[1, 7, 4, 1], [4, 1, 7, 5], [6, 7, 4, 5]], drums: 'march', bass: 'octaves', lead: 'brass', harmony: 'flute', pad: true, arp: true, seed: 1801,
      tune: { A: '1/4 3/2 5/2 8/4 7/4 | 7/4 5/2 4/2 2/8 | 4/4 6/2 8/2 6/4 4/4 | 5/4 3/4 1/8',
              B: '8/4 8/2 10/2 8/4 5/4 | 5/4 5/2 8/2 5/4 3/4 | 7/4 9/4 11/4 9/4 | 9/8 7/8',
              C: '6/8 8/8 | 7/8 9/8 | 6/4 8/4 6/4 4/4 | 5/8 9/8' } },
    menuMusic: { tempo: 96, root: 57, scale: 'dorian', prog: [[1, 4, 7, 1], [4, 7, 1, 5], [6, 4, 7, 5]], drums: 'soft', bass: 'whole', lead: 'flute', harmony: 'bell', pad: 'choir', arp: true, arpSound: 'marimba', seed: 1802,
      tune: { A: '5/8 8/8 | 6/8 4/8 | 7/8 9/8 | 8/8 5/8',
              B: '4/4 6/4 8/8 | 7/4 9/4 11/8 | 8/4 5/4 3/8 | 5/8 9/8',
              C: '6/8 8/8 | 4/8 6/8 | 7/8 4/8 | 5/8 7/8' } },
    levelsTitle: 'Pick a place',
    // gentle: the Meadow is Easy, the Woods and the Castle are Normal (little kids always get Easy)
    levelDifficulty: (lv) => (lv.id === 's1' ? 'easy' : 'normal'),
    howTo: [
      { pic: Sv(`<circle cx="40" cy="30" r="14" fill="#ffd6a5" ${LINK}/><rect x="28" y="42" width="24" height="24" rx="8" fill="#4c8dff" ${LINK}/><path d="M58 54 H74 M66 46 L74 54 L66 62" fill="none" stroke="#06d6a0" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`), text: 'Touch where to walk', keys: 'or the arrow keys' },
      { pic: Sv(`<path d="M40 8 L47 28 L68 20 L56 38 L74 48 L53 51 L55 72 L40 57 L25 72 L27 51 L6 48 L24 38 L12 20 L33 28 Z" fill="#ffd166" ${LINK}/>`), text: 'Bonk the grumpy blobs!', keys: 'Star button / Space' },
      { pic: Sv(`<path d="M32 12 H48 V28 Q68 38 62 60 Q40 74 18 60 Q12 38 32 28 Z" fill="#4cc9f0" ${LINK}/><circle cx="30" cy="50" r="5" fill="#fff"/>`), text: 'Potions = big magic!', keys: 'Potion button / X' },
      { pic: Sv(`<path d="M40 66 C6 42 18 14 40 30 C62 14 74 42 40 66 Z" fill="#ef476f" ${LINK}/>`), text: 'Apples give hearts back' },
    ],
    buttons: {
      right: [{ id: 'KeyX', icon: Art.POTION_SVG, label: 'Magic' }, { id: 'Space', icon: Art.BONK_SVG, label: 'Bonk' }],
    },
    levels,
    setup,
    update,
    draw: render,
  });
})();
