// =====================================================================
// The Daily Surprise (Keith's 10-point plan, point 4).
//
// Every day each player gets ONE small challenge, shown as a wrapped
// present on the hub: "win a race in Turbo Bike", "catch 6 fish",
// "play 3 different games"... Finishing it opens the present:
//   - 2 coins for My House, every time
//   - and one of the 8 Surprise stickers (the 1st surprise gives the 1st
//     sticker, the 2nd the 2nd ... see 'surprise' in arcade/stickers.js)
//
// The challenge is picked from the date, so it's the same all day and a
// new one comes at midnight. Little kids (age preset 'little') get gentle
// ones ("play Hoop Heroes", "catch 3 fish"); big kids get "win" and "3 stars".
//
// Games don't need to do anything special: the kit's finish() reports every
// round here. Only counting challenges need a line in the game:
//   Arcade.daily.add('bike', 'coins', n)     (Turbo Bike, when coins are picked up)
//   Arcade.daily.add('fishing', 'fish', 1)   (Fishing Frenzy, every catch)
// The maze and the coloring book call Arcade.daily.report() themselves.
//
// Saved in each player's arcade save as
//   daily: { day: '2026-11-08', key: 'win:bike', n: 0, games: [], done: false, total: 0 }
// (total = how many surprises this player has finished, ever).
//
// Loaded after stickers.js on every page:
//   Arcade.daily.today()           -> { ch, n, need, done, total }
//   Arcade.daily.report(game, res) -> a round of 'game' ended (res = { win, stars })
//   Arcade.daily.add(game, what, n)-> count coins / fish
//   Arcade.daily.pic(ch)           -> the picture of the goal (an <svg>)
//   Arcade.daily.words(ch)         -> the challenge in words (read aloud with say())
//   Arcade.daily.say(text)         -> read words aloud (if sound is on)
//   Arcade.daily.gift(open)        -> the present picture (closed or opened)
// =====================================================================
(function () {
  'use strict';
  if (!window.Arcade) return;
  const A = window.Arcade;
  const REWARD_COINS = 2;

  // the games, their names (for reading aloud) and what a "win" is called in each
  const NAME = {
    bike: 'Turbo Bike', rc: 'Mini RC Racers', hoops: 'Hoop Heroes', archery: 'Bullseye Adventure',
    jungle: 'Jungle Jump', trail: 'Treasure Trail', space: 'Space Defender', abc: 'Bubble School',
    coloring: 'the Coloring Book', maze: 'Maze Explorer', fishing: 'Fishing Frenzy', piano: 'Piano Star',
  };
  const WIN_WORD = { bike: 'Finish a race', rc: 'Finish a race in the top 3', hoops: 'Win a game', archery: 'Win a level',
    jungle: 'Finish a level', trail: 'Find the treasure', space: 'Clear a sector', abc: 'Win a round', maze: 'Finish a maze',
    fishing: 'Win a round', piano: 'Play a song to the end' };

  // ---- every challenge. kind: play / win / stars / count / games / color ----
  //   play  - finish any round of that game (win or not)
  //   win   - win a round        stars - get 3 stars on a round
  //   count - pick up n coins/fish today      games - play n different games today
  const ARCADE_GAMES = ['bike', 'rc', 'hoops', 'archery', 'jungle', 'trail', 'space', 'abc', 'fishing', 'piano'];
  const BIG = [].concat(
    ARCADE_GAMES.map(g => ({ kind: 'win', game: g })), [{ kind: 'win', game: 'maze' }],
    ['hoops', 'archery', 'abc', 'maze', 'piano', 'fishing', 'jungle', 'bike'].map(g => ({ kind: 'stars', game: g, need: 3 })),
    [{ kind: 'count', game: 'bike', what: 'coins', need: 30 }, { kind: 'count', game: 'fishing', what: 'fish', need: 6 },
      { kind: 'games', need: 3 }, { kind: 'color', game: 'coloring' }]);
  const LITTLE = [].concat(
    ARCADE_GAMES.map(g => ({ kind: 'play', game: g })), [{ kind: 'win', game: 'maze' }],
    [{ kind: 'count', game: 'bike', what: 'coins', need: 10 }, { kind: 'count', game: 'fishing', what: 'fish', need: 3 },
      { kind: 'games', need: 2 }, { kind: 'color', game: 'coloring' }]);
  const keyOf = (c) => [c.kind, c.game || '', c.what || '', c.need || ''].join(':');
  const ALL = BIG.concat(LITTLE);
  const byKey = (k) => ALL.find(c => keyOf(c) === k);

  // ---- which day is it? (the device's own clock, local time) ----
  function dayStr(d) {
    if (!d) {
      // (the automated tests can pretend it's another day: localStorage 'kidsArcade.testDay')
      let fake = null;
      try { fake = localStorage.getItem('kidsArcade.testDay'); } catch (e) { /* skip */ }
      if (fake) return fake;
    }
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  // a number from the date (the same date always gives the same number)
  function dayNumber(s) { const [y, m, d] = s.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); }
  // Pick the challenge for a day. The list is walked in a scrambled order
  // (jumping 7 places each day), so the same game doesn't come up two days in a row.
  function pickFor(day, little) {
    const list = little ? LITTLE : BIG;
    const i = (dayNumber(day) * 7) % list.length;
    return list[i];
  }

  // ---- this player's surprise for today ----
  function box() {
    const d = A.store.load();
    const today = dayStr();
    const b = d.daily = Object.assign({ day: '', key: '', n: 0, games: [], done: false, total: 0 }, d.daily || {});
    if (b.day !== today || !byKey(b.key)) {
      // a new day: a new challenge (the total of finished surprises stays)
      b.day = today; b.key = keyOf(pickFor(today, A.profiles.little())); b.n = 0; b.games = []; b.done = false;
      A.store.save();
    }
    return b;
  }
  function today() {
    const b = box(), ch = byKey(b.key);
    const need = ch.need || 1;
    return { ch, n: Math.min(b.n, need), need, done: b.done, total: b.total, day: b.day };
  }

  // ---- progress ----
  function bump(by) {
    const b = box();
    if (b.done) return;
    const ch = byKey(b.key);
    b.n += by;
    if (b.n >= (ch.need || 1)) complete(b);
    else A.store.save();
  }
  // a round of a game ended: result = { win, stars }
  function report(game, result) {
    result = result || {};
    const b = box();
    if (b.done) return;
    const ch = byKey(b.key);
    if (!b.games.includes(game)) {
      b.games.push(game);
      if (ch.kind === 'games') { b.n = b.games.length; if (b.n >= ch.need) return complete(b); }
    }
    if (ch.game !== game) { A.store.save(); return; }
    if (ch.kind === 'play') bump(1);
    else if (ch.kind === 'win' && result.win) bump(1);
    else if (ch.kind === 'stars' && (result.stars || 0) >= ch.need) bump(ch.need);
    else if (ch.kind === 'color') bump(1);
    else A.store.save();
  }
  // count coins / fish for a 'count' challenge
  function add(game, what, n) {
    const b = box();
    if (b.done) return;
    const ch = byKey(b.key);
    if (ch.kind === 'count' && ch.game === game && ch.what === what) bump(n || 1);
  }
  // Done! Open the present: 2 house coins + the next Surprise sticker.
  function complete(b) {
    b.done = true;
    b.total = (b.total || 0) + 1;
    const d = A.store.load();
    d.houseBonus = (d.houseBonus || 0) + REWARD_COINS;
    A.store.save();
    A.toast('Surprise! +' + REWARD_COINS, gift(true));
    A.sfx('unlock');
    say('You did it! Here is your surprise!');
    // the Surprise sticker: its own toast, a moment later so both are seen
    if (A.stickers) setTimeout(() => A.stickers.check(), 1800);
  }

  // ---- reading aloud (the words are only for the voice; the pictures do the talking) ----
  function words(ch) {
    const nm = NAME[ch.game] || '';
    if (ch.kind === 'play') return 'Play ' + nm + '!';
    if (ch.kind === 'win') return WIN_WORD[ch.game] + ' in ' + nm + '!';
    if (ch.kind === 'stars') return 'Get 3 stars in ' + nm + '!';
    if (ch.kind === 'count') return (ch.what === 'coins' ? 'Collect ' + ch.need + ' coins in ' : 'Catch ' + ch.need + ' fish in ') + nm + '!';
    if (ch.kind === 'games') return 'Play ' + ch.need + ' different games!';
    return 'Color a picture and put it in your gallery!';
  }
  function say(text) {
    try {
      const s = A.store.settings();
      if (s.muted || !window.speechSynthesis) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95; u.pitch = 1.15;
      speechSynthesis.speak(u);
    } catch (e) { /* no voice on this device: that's fine */ }
  }

  // ---- pictures ----
  const I = 'stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"';
  const STAR = (x, y, r) => `<path d="${Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + Math.PI * i / 5, rr = i % 2 ? r * 0.45 : r; return (i ? 'L' : 'M') + (x + Math.cos(a) * rr).toFixed(1) + ' ' + (y + Math.sin(a) * rr).toFixed(1); }).join(' ')} Z" fill="#ffd166" ${I} stroke-width="2.5"/>`;
  const S = (x) => `<svg viewBox="0 0 48 48" aria-hidden="true">${x}</svg>`;
  const GOAL = {
    play: S(`<circle cx="24" cy="24" r="20" fill="#06d6a0" ${I} stroke-width="4"/><path d="M19 14 L33 24 L19 34 Z" fill="#2b2b2b"/>`),
    win: S(`<path d="M12 44 V6" ${I} stroke-width="4"/><path d="M13 8 H40 V26 H13 Z" fill="#fff" ${I} stroke-width="3"/><path d="M13 8 h7 v6 h-7 Z M27 8 h7 v6 h-7 Z M20 14 h7 v6 h-7 Z M34 14 h6 v6 h-6 Z M13 20 h7 v6 h-7 Z M27 20 h7 v6 h-7 Z" fill="#2b2b2b"/>`),
    stars: S(STAR(10, 28, 9) + STAR(24, 18, 11) + STAR(38, 28, 9)),
    coins: S(`<circle cx="18" cy="28" r="13" fill="#ffc93c" ${I}/><circle cx="30" cy="20" r="13" fill="#ffc93c" ${I}/><path d="M30 13 V27" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity="0.8"/>`),
    fish: S(`<path d="M10 24 C16 12 36 11 42 24 C36 37 16 36 10 24 Z" fill="#ffd166" ${I}/><path d="M10 24 L3 16 L4 32 Z" fill="#ff8c42" ${I}/><circle cx="34" cy="22" r="2.6" fill="#2b2b2b"/>`),
    games: S(`<rect x="4" y="14" width="12" height="20" rx="3" fill="#ef476f" ${I} stroke-width="3"/><rect x="18" y="14" width="12" height="20" rx="3" fill="#ffd166" ${I} stroke-width="3"/><rect x="32" y="14" width="12" height="20" rx="3" fill="#4cc9f0" ${I} stroke-width="3"/>`),
    color: S(`<rect x="5" y="7" width="38" height="34" rx="4" fill="#fff" ${I}/><circle cx="17" cy="19" r="5" fill="#ef476f"/><path d="M7 39 L19 27 L27 33 L33 27 L41 35 V39 Z" fill="#06d6a0" ${I} stroke-width="2.5"/>`),
  };
  function pic(ch) { return ch.kind === 'count' ? GOAL[ch.what] : GOAL[ch.kind]; }
  // the present: closed (a bow on top) or opened (lid off, stars flying out)
  function gift(open) {
    const box = `<rect x="9" y="22" width="30" height="21" rx="3" fill="#ef476f" ${I}/><path d="M24 22 V43" stroke="#ffd166" stroke-width="5"/>`;
    if (!open) return S(box + `<rect x="6" y="15" width="36" height="9" rx="3" fill="#ff8fab" ${I}/><path d="M24 15 V24" stroke="#ffd166" stroke-width="5"/>` +
      `<path d="M24 15 C16 3 8 9 16 15 M24 15 C32 3 40 9 32 15" fill="none" ${I}/>`);
    return S(box + `<g transform="rotate(-24 10 14)"><rect x="4" y="10" width="34" height="8" rx="3" fill="#ff8fab" ${I}/></g>` +
      STAR(29, 10, 9).replace('stroke-width="2.5"', 'stroke-width="2"') + STAR(42, 20, 6).replace('stroke-width="2.5"', 'stroke-width="1.8"') +
      `<circle cx="17" cy="6" r="3" fill="#4cc9f0" stroke="#2b2b2b" stroke-width="1.5"/><circle cx="40" cy="6" r="2.5" fill="#06d6a0" stroke="#2b2b2b" stroke-width="1.5"/>`);
  }

  A.daily = { today, report, add, pic, words, say, gift, names: NAME, REWARD_COINS,
    // (for tests: every challenge, and the one a given day would pick)
    _all: ALL, _pick: pickFor, _key: keyOf, _day: dayStr };
})();
