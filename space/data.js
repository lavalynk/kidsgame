// =====================================================================
// Space Defender — DATA: the 10 sectors, their looks, bosses and songs.
// Change things here to tune the game (no game rules in this file).
// =====================================================================
window.SpaceData = (function () {
  // ---------------------------------------------------------------
  // Looks for each sector: sky colors, planets floating behind
  // ([color, kind, size]), enemy colors, and a special layer (deco).
  // ---------------------------------------------------------------
  const THEMES = {
    moon:    { sky: ['#14163d', '#2e2a72'], bg: '#14163d', planets: [['#c9d6df', 'moon', 70], ['#ffafcc', 'plain', 30]], deco: 'moonfloor', ground: '#9aa5b8', enemy: ['#8ecae6', '#ffd166', '#06d6a0'] },
    candy:   { sky: ['#3a1c5c', '#a23b8f'], bg: '#3a1c5c', planets: [['#ff8fab', 'swirl', 60], ['#ffd166', 'stripe', 36]], deco: 'clouds', cloud: 'rgba(255,175,204,0.16)', enemy: ['#ff8fab', '#9b5de5', '#06d6a0'] },
    rings:   { sky: ['#0b2545', '#13597a'], bg: '#0b2545', planets: [['#ffd166', 'ring', 80], ['#8ecae6', 'plain', 26]], enemy: ['#06d6a0', '#ff8c42', '#8ecae6'] },
    ice:     { sky: ['#0d2b45', '#3d7ea6'], bg: '#0d2b45', planets: [['#e0fbfc', 'moon', 64], ['#9bf6ff', 'plain', 28]], deco: 'snow', enemy: ['#9bf6ff', '#ffafcc', '#caffbf'] },
    jungle:  { sky: ['#0b3d2e', '#1f7a4d'], bg: '#0b3d2e', planets: [['#80ed99', 'swirl', 72], ['#ffd166', 'plain', 24]], deco: 'clouds', cloud: 'rgba(200,255,200,0.12)', enemy: ['#ffd166', '#ff8fab', '#4cc9f0'] },
    lava:    { sky: ['#3b0d0d', '#8c2f0e'], bg: '#3b0d0d', planets: [['#ff8c42', 'moon', 66], ['#ffd166', 'plain', 22]], deco: 'lava', enemy: ['#ffd166', '#9bf6ff', '#caffbf'] },
    crystal: { sky: ['#1f0d3d', '#5b2a86'], bg: '#1f0d3d', planets: [['#e0aaff', 'stripe', 58], ['#9bf6ff', 'plain', 26]], deco: 'crystals', enemy: ['#9bf6ff', '#ffafcc', '#ffd166'] },
    storm:   { sky: ['#1c1f3b', '#4a5a8a'], bg: '#1c1f3b', planets: [['#a3bffa', 'stripe', 84], ['#ffd166', 'plain', 22]], deco: 'storm', cloud: 'rgba(220,230,255,0.13)', enemy: ['#ffd166', '#ff8fab', '#06d6a0'] },
    neon:    { sky: ['#0a0a23', '#2d1b69'], bg: '#0a0a23', planets: [['#f72585', 'ring', 56], ['#4cc9f0', 'plain', 24]], deco: 'grid', enemy: ['#4cc9f0', '#f72585', '#b5e48c'] },
    void:    { sky: ['#05010f', '#24064a'], bg: '#05010f', planets: [['#7b2cbf', 'swirl', 60], ['#c77dff', 'plain', 20]], deco: 'nebula', enemy: ['#c77dff', '#9bf6ff', '#ffd166'] },
    lair:    { sky: ['#030008', '#1a0433'], bg: '#030008', planets: [['#8ecae6', 'plain', 40], ['#ffd166', 'ring', 34], ['#ff8fab', 'moon', 30]], deco: 'nebula', enemy: ['#c77dff', '#9bf6ff', '#ffd166'] },
  };

  // ---------------------------------------------------------------
  // The 10 sectors. Each one: waves, then a MINI BOSS, more waves,
  // then a BIG BOSS. About 1-2 minutes each.
  //   tier:   1-10, how tough (more enemies, faster, more bubbles)
  //   pool:   which enemy types fly in
  //   waves:  [before the mini boss, after it]
  //   weapons: how many of the 20 special weapons can drop here (new ones arrive
  //            as you go: sector 1 has the first 4, sector 10 has all 20)
  //   song:   which song plays (SONGS below)
  // ---------------------------------------------------------------
  const SECTORS = [
    { id: 's1',  name: 'Moon Base',        theme: 'moon',    tier: 1,  pool: ['bobber', 'squad', 'bobber'],                         waves: [3, 3], mini: 'bobKing',   boss: 'balloon',  weapons: 4,  song: 'space' },
    { id: 's2',  name: 'Candy Nebula',     theme: 'candy',   tier: 2,  pool: ['bobber', 'squad', 'diver', 'shooter'],               waves: [3, 4], mini: 'squadCap',  boss: 'cookie',   weapons: 6,  song: 'space' },
    { id: 's3',  name: 'Ring Planet',      theme: 'rings',   tier: 3,  pool: ['squad', 'diver', 'shooter', 'rock', 'bobber'],      waves: [4, 4], mini: 'diverAce',  boss: 'hula',     weapons: 8,  song: 'comet' },
    { id: 's4',  name: 'Comet Freeze',     theme: 'ice',     tier: 4,  pool: ['bobber', 'zigzag', 'rock', 'shooter', 'squad'],     waves: [4, 4], mini: 'rockGolem', boss: 'frosty',   weapons: 10, song: 'comet' },
    { id: 's5',  name: 'Jungle Planet',    theme: 'jungle',  tier: 5,  pool: ['zigzag', 'shooter', 'diver', 'splitter', 'squad'],  waves: [4, 4], mini: 'jellyQueen', boss: 'octo',    weapons: 12, song: 'lava' },
    { id: 's6',  name: 'Lava Moon',        theme: 'lava',    tier: 6,  pool: ['rock', 'zigzag', 'diver', 'splitter', 'shooter'],   waves: [4, 4], mini: 'zigZapper', boss: 'mole',     weapons: 14, song: 'lava' },
    { id: 's7',  name: 'Crystal Caves',    theme: 'crystal', tier: 7,  pool: ['splitter', 'orbiter', 'squad', 'zigzag', 'shooter'], waves: [4, 4], mini: 'splitMama', boss: 'prism',    weapons: 16, song: 'crystal' },
    { id: 's8',  name: 'Storm Giant',      theme: 'storm',   tier: 8,  pool: ['orbiter', 'diver', 'zigzag', 'rock', 'shooter'],    waves: [4, 4], mini: 'orbDuke',   boss: 'whale',    weapons: 18, song: 'crystal' },
    { id: 's9',  name: 'Neon City',        theme: 'neon',    tier: 9,  pool: ['squad', 'orbiter', 'splitter', 'zigzag', 'diver'],  waves: [4, 4], mini: 'megaCube',  boss: 'mechacat', weapons: 20, song: 'neon' },
    { id: 's10', name: 'Edge of the Void', theme: 'void',    tier: 10, pool: ['orbiter', 'splitter', 'rock', 'zigzag', 'shooter', 'diver'], waves: [4, 4], mini: 'voidComet', boss: 'guardian', weapons: 20, song: 'neon' },
  ];
  // the mega fight at the very end
  const FINAL = { id: 'chimera', name: "Chimera's Lair", theme: 'lair', tier: 10, final: true, weapons: 20, song: 'chimera' };
  const ENDLESS = { id: 'endless', name: 'Endless', theme: 'moon', endless: true, tier: 3, weapons: 20, song: 'space' };

  // ---------------------------------------------------------------
  // Mini bosses: a giant enemy wearing something fancy.
  //   base: which enemy it's a big version of; acc: what it wears
  // ---------------------------------------------------------------
  const MINIS = {
    bobKing:    { name: 'King Bobber',    base: 'bobber',   color: '#8ecae6', acc: 'crown',   scale: 2.6, r: 62, attacks: ['fan', 'minions', 'aim3'] },
    squadCap:   { name: 'Captain Cube',   base: 'squad',    color: '#ff8fab', acc: 'captain', scale: 2.6, r: 58, attacks: ['aim3', 'wall', 'minions'] },
    diverAce:   { name: 'Ace Saucer',     base: 'diver',    color: '#06d6a0', acc: 'shades',  scale: 2.6, r: 62, attacks: ['charge', 'fan', 'aim3'] },
    rockGolem:  { name: 'Snowcap Rocky',  base: 'rock',     color: '#bde0fe', acc: 'beanie',  scale: 2.0, r: 66, attacks: ['rain', 'ring', 'charge'] },
    jellyQueen: { name: 'Jelly Queen',    base: 'shooter',  color: '#c77dff', acc: 'tiara',   scale: 2.7, r: 64, attacks: ['burst', 'spiral', 'aim3'] },
    zigZapper:  { name: 'Zig-Zag Zapper', base: 'zigzag',   color: '#ffd166', acc: 'mohawk',  scale: 2.7, r: 60, attacks: ['charge', 'bounce', 'fan'] },
    splitMama:  { name: 'Mama Splitter',  base: 'splitter', color: '#4cc9f0', acc: 'bow',     scale: 2.4, r: 66, attacks: ['minions', 'burst', 'ring'] },
    orbDuke:    { name: 'Duke Orbit',     base: 'orbiter',  color: '#9bf6ff', acc: 'tophat',  scale: 2.5, r: 60, attacks: ['homing', 'spiral', 'wall'] },
    megaCube:   { name: 'Mega Cube',      base: 'squad',    color: '#ff8c42', acc: 'helmet',  scale: 2.9, r: 64, attacks: ['lasers', 'aim3', 'minions'] },
    voidComet:  { name: 'Shadow Comet',   base: 'rock',     color: '#7b6cd9', acc: 'horns',   scale: 2.1, r: 70, attacks: ['homing', 'rain', 'burst'] },
  };

  // ---------------------------------------------------------------
  // Big bosses (their pictures are in art.js, attacks in space.js)
  // ---------------------------------------------------------------
  const BIGS = {
    balloon:  { name: 'Bolto the Balloon Bot',   r: 82, attacks: ['fan', 'charge', 'minions'] },
    cookie:   { name: 'Captain Cookie Jar',      r: 84, attacks: ['aim3', 'beam', 'ring'] },
    hula:     { name: 'Hula-Hoop Robo',          r: 80, attacks: ['spiral', 'beam', 'ring', 'fan'] },
    frosty:   { name: 'Frosty the Snow Satellite', r: 80, attacks: ['rain', 'ring', 'beam', 'wall'] },
    octo:     { name: 'Professor Octo',          r: 84, attacks: ['homing', 'spiral', 'bounce', 'minions'] },
    mole:     { name: 'Magma Mole',              r: 84, attacks: ['charge', 'rain', 'fan', 'burst'] },
    prism:    { name: 'The Prism Queen',         r: 74, attacks: ['lasers', 'spiral', 'burst', 'ring'] },
    whale:    { name: 'Thunder Whale',           r: 90, attacks: ['rain', 'beam', 'wall', 'homing'] },
    mechacat: { name: 'Mecha Kitty',             r: 88, attacks: ['lasers', 'charge', 'bounce', 'fan'] },
    guardian: { name: 'The Twin-Moon Guardian',  r: 82, attacks: ['ring', 'spiral', 'lasers', 'homing', 'wall'] },
  };

  // ---------------------------------------------------------------
  // Songs (hand-written tunes; see the music notes in arcade/shared.js).
  // 'space' is the built-in Space Defender song.
  // ---------------------------------------------------------------
  const SONGS = {
    // Sectors 3-4: a bright, bouncy comet ride
    comet: { tempo: 124, root: 62, scale: 'dorian', prog: [[1, 4, 1, 7], [3, 4, 5, 1], [4, 7, 3, 5]], drums: 'rock', bass: 'eighths', lead: 'square', harmony: 'bell', pad: true, arp: true, seed: 1711,
      tune: { A: '5/2 5 8/4 5/2 3 1/4 | 4/2 4 6/4 8/2 6 4/4 | 5/2 5 8/4 10/2 8 5/4 | 4/4 2 7/8',
              B: '10/6 8/2 7/8 | 8/6 6/2 4/8 | 9/6 7/2 5/8 | 8/12 r/4',
              C: '8/4 6 4/8 | 7/4 9 11/8 | 10/8 7 | 9/4 7 5/8' } },
    // Sectors 5-6: jungle drums and brass, warm and adventurous
    lava: { tempo: 132, root: 52, scale: 'minor', prog: [[1, 6, 7, 1], [4, 5, 6, 5], [4, 7, 3, 5]], drums: 'tribal', bass: 'bounce', lead: 'brass', harmony: 'marimba', pad: true, arp: true, arpSound: 'marimba', seed: 1712,
      tune: { A: '1/2 1 5 1 8/4 7/2 5 | 6/2 6 8 6 3/4 1 | 2/2 2 7 2 9/4 7/2 4 | 5/4 3 1/8',
              B: '8/4 8/2 6 4/8 | 9/4 9/2 7 5/8 | 10/4 10/2 8 6/8 | 9/4 7 5/8',
              C: '6/8 8 | 7/8 9 | 10/8 7 | 9/4 7 5/8' } },
    // Sectors 7-8: sparkly crystals, a bell tune over "oooh" voices
    crystal: { tempo: 112, root: 59, scale: 'minor', prog: [[1, 6, 3, 7], [4, 6, 7, 1], [6, 7, 4, 5]], drums: 'halftime', bass: 'pulse', lead: 'bell', harmony: 'saw', pad: 'choir', arp: true, seed: 1713,
      tune: { A: '8/4 5 3 5 | 6/4 8 10/8 | 10/4 8 7 5 | 7/8 9',
              B: '8/6 6/2 4/8 | 8/6 6/2 3/8 | 9/6 7/2 4/8 | 8/16',
              C: '8/8 10 | 9/8 7 | 8/8 6 | 7/16' } },
    // Sectors 9-10: fast neon synths
    neon: { tempo: 140, root: 53, scale: 'minor', prog: [[1, 7, 6, 7], [4, 5, 1, 1], [6, 4, 7, 5]], drums: 'disco', bass: 'octaves', lead: 'saw', harmony: 'choir', pad: true, arp: true, seed: 1714,
      tune: { A: '8/2 8 5 8 10/4 8 | 7/2 7 4 7 9/4 7 | 6/2 6 3 6 8/4 6 | 7/4 9 11/8',
              B: '8/4 6/2 8 11/8 | 9/4 7/2 9 12/8 | 10/4 8/2 10 12/4 10 | 8/16',
              C: '10/8 8 | 8/8 6 | 9/8 7 | 9/4 7 5/8' } },
    // Every big boss: an urgent brass march
    boss: { tempo: 150, root: 57, scale: 'harmonic', prog: [[1, 6, 4, 5], [6, 7, 1, 5], [4, 5, 4, 5]], drums: 'rock', bass: 'eighths', lead: 'brass', harmony: 'saw', pad: true, arp: true, seed: 1715,
      tune: { A: '1/2 1 1 3 5/4 3 | 1/2 1 1 3 6/4 8 | 6/2 6 4 6 8/4 6 | 7/4 5 2/8',
              B: '8/6 10/2 8/4 6 | 9/6 11/2 9/4 7 | 10/4 8 12/8 | 9/4 7 5/8',
              C: '8/8 6 | 7/8 5 | 8/8 6 | 7/4 9 12/8' } },
    // THE CHIMERA: a huge, dark, epic battle song
    chimera: { tempo: 138, root: 50, scale: 'harmonic', prog: [[1, 1, 6, 5], [4, 5, 1, 6], [6, 7, 1, 5]], drums: 'punk', bass: 'pulse', lead: 'brass', harmony: 'choir', lead2: 'saw', pad: 'choir', arp: true, seed: 1716,
      tune: { A: '1/4 1/2 3 5/4 3 | 1/4 1/2 3 5/4 8 | 6/6 8/2 10/4 8 | 7/8 5',
              B: '8/6 6/2 4/8 | 9/6 7/2 5/8 | 10/6 8/2 5/8 | 8/4 10 13/8',
              C: '10/8 8 | 9/8 7 | 8/8 10 | 9/4 7 5/8' } },
  };

  return { THEMES, SECTORS, FINAL, ENDLESS, MINIS, BIGS, SONGS };
})();
