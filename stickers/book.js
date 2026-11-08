// The Sticker Book page: every sticker in the arcade, one colored page per game.
// Stickers you have are bright; the ones you don't have yet are dotted "?"
// shapes with a little picture that shows how to get them. Tap any sticker
// to see it big (and, if you don't have it yet, a Play button for that game).
// The stickers themselves are in arcade/stickers.js.
(function () {
  'use strict';
  const ST = Arcade.stickers;
  ST.check(true);                         // (catch up on anything earned before the book existed)
  const fresh = ST.unseen();              // new since last time: these wiggle
  ST.markSeen();

  // a closed book with a star on it
  const BOOK = `<svg viewBox="0 0 48 48"><path d="M8 6 H36 Q42 6 42 12 V42 H14 Q8 42 8 36 Z" fill="#ef476f" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><path d="M14 42 Q8 42 8 36 Q8 32 14 32 H42" fill="#fff" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><path d="M25 10 L28 17 L35 17 L29.5 21.5 L31.5 28 L25 24 L18.5 28 L20.5 21.5 L15 17 L22 17 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
  const X = `<svg viewBox="0 0 48 48"><path d="M12 12 L36 36 M36 12 L12 36" stroke="#2b2b2b" stroke-width="7" stroke-linecap="round"/></svg>`;
  document.getElementById('home').innerHTML = Arcade.icons.home;
  document.getElementById('title').innerHTML = BOOK + '<span>Stickers</span>';
  const total = ST.list.length, got = ST.count();
  document.getElementById('count').innerHTML = ST.svg(ST.list[0], false) + `<span>${got} / ${total}</span>`;
  document.getElementById('meter').style.width = (100 * got / total) + '%';

  // the game's round picture (the hub's badge) for each page
  const badge = (game) => `<svg viewBox="0 0 240 240">${(Arcade.badges || {})[game] || ''}</svg>`;
  const nameOf = (game) => game === 'arcade' ? 'Kids Arcade' : game === 'surprise' ? 'Daily Surprise' : ST.games.find(g => g.id === game).name;
  const pages = ST.games.map(g => g.id).concat(['arcade', 'surprise']);
  // the Daily Surprise page has a present instead of a game picture (its 8 stickers come one per surprise)
  const GIFT = Arcade.daily ? Arcade.daily.gift(false).replace('<svg', '<svg style="padding:10%;box-sizing:border-box;background:#fff3b0"') : '';
  const own = (game) => game === 'arcade' || game === 'surprise';

  const book = document.getElementById('book');
  for (const game of pages) {
    const stickers = ST.list.filter(s => s.game === game);
    const page = document.createElement('section');
    page.className = 'page';
    page.style.setProperty('--c', game === 'arcade' ? '#ff8fc4' : game === 'surprise' ? '#ffcf70' : Arcade.mixWhite(stickers[0].color, 0.25));
    if (game === 'surprise') page.classList.add('wide');
    const gm = game === 'surprise' ? `<a class="gm" href="../index.html" aria-label="Daily Surprise">${GIFT}</a>`
      : game === 'arcade' ? `<span class="gm">${badge('arcade')}</span>` : `<a class="gm" href="../${game}/index.html" aria-label="Play ${nameOf(game)}">${badge(game)}</a>`;
    page.innerHTML = gm + `<div class="slots">${stickers.map(s => {
      const have = ST.has(s.id);
      return `<button type="button" class="slot${have ? '' : ' locked'}${fresh.includes(s.id) ? ' new' : ''}" data-sticker="${s.id}" aria-label="${have ? s.name : 'Not yet'}">` +
        ST.svg(s, !have) + (have ? '' : `<span class="hint">${s.n ? `<b>${s.n}</b>` : ST.hintPic(s)}</span>`) + '</button>';
    }).join('')}</div>`;
    book.appendChild(page);
  }

  // ---- tap a sticker: see it big ----
  const zoom = document.getElementById('zoom'), card = document.getElementById('card');
  book.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sticker]');
    if (!b) return;
    Arcade.audio.resume();
    const s = ST.list.find(x => x.id === b.dataset.sticker), have = ST.has(s.id);
    Arcade.sfx(have ? 'star' : 'pop');
    card.style.setProperty('--c', Arcade.mixWhite(s.color, 0.25));
    const play = !own(s.game) && !have
      ? `<a class="round go" href="../${s.game}/index.html" aria-label="Play ${nameOf(s.game)}">${Arcade.icons.play}</a>` : '';
    card.innerHTML = (have ? ST.svg(s, false, 'big') : `<div class="big locked">${ST.svg(s, true)}</div>`) +
      `<h2>${have ? s.name : '?'}</h2>` +
      (have ? '' : `<div class="how">${!own(s.game) ? `<span class="gm">${badge(s.game)}</span>` : ''}${ST.hintPic(s)}${s.n ? `<b class="num">${s.n}</b>` : ''}</div>`) +
      `<div class="row"><button type="button" class="round" id="close" aria-label="Close">${X}</button>${play}</div>`;
    zoom.hidden = false;
    if (have) Arcade.confetti(40);
  });
  zoom.addEventListener('click', (e) => { if (e.target === zoom || e.target.closest('#close')) { Arcade.sfx('click'); zoom.hidden = true; } });

  // test hook
  window.__bookState = () => ({ total, got, fresh: fresh.length, pages: book.children.length });
})();
