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

  const book = document.getElementById('book'), spreads = document.getElementById('spreads');
  const pageEls = [];
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
    pageEls.push(page);
  }

  // ---- the book: a few pages per "spread", swipe or tap the arrows to turn the page (Swiper, Nov 20) ----
  // How many pages fit on one spread depends on the screen: 1 or 2 across, as many rows as fit.
  document.getElementById('prev').innerHTML = Arcade.icons.left;
  document.getElementById('next').innerHTML = Arcade.icons.right;
  let swiper = null;
  function layout() {
    const cols = innerWidth >= 1000 || (innerWidth >= 700 && innerWidth > innerHeight * 1.6) ? 2 : 1;   // (2 across on wide screens and phones sideways)
    // measure one page (the wide Daily Surprise page takes a whole row)
    spreads.innerHTML = '';
    const probe = document.createElement('div'); probe.className = 'swiper-slide spread'; probe.style.setProperty('--cols', cols);
    probe.appendChild(pageEls[0]); spreads.appendChild(probe);
    const pageH = pageEls[0].offsetHeight + 14, room = book.clientHeight - 16;
    const want = Math.max(1, Math.floor(room / pageH)) * cols;
    const groups = [];
    let cur = [], used = 0;
    for (const pg of pageEls) {
      const size = pg.classList.contains('wide') ? cols : 1;
      if (used + size > want && cur.length) { groups.push(cur); cur = []; used = 0; }
      cur.push(pg); used += size;
    }
    if (cur.length) groups.push(cur);
    spreads.innerHTML = '';
    for (const grp of groups) {
      const sl = document.createElement('div'); sl.className = 'swiper-slide spread'; sl.style.setProperty('--cols', cols);
      grp.forEach(pg => sl.appendChild(pg));
      spreads.appendChild(sl);
    }
  }
  const pageAt = (spread) => { const sl = spreads.children[spread]; return sl ? pageEls.indexOf(sl.firstElementChild) : 0; };
  const spreadOf = (pageIndex) => Math.max(0, [...spreads.children].findIndex(sl => sl.contains(pageEls[pageIndex])));
  function start() {
    const at = swiper ? pageAt(swiper.activeIndex) : 0;     // (keep the same page open when the screen turns)
    layout();
    if (!window.Swiper) { book.classList.add('noswipe'); return; }   // (no Swiper: one long list, like before)
    if (swiper) { swiper.update(); swiper.pagination.render(); swiper.pagination.update(); swiper.slideTo(spreadOf(at), 0); return; }
    swiper = new Swiper(book, {
      slidesPerView: 1, spaceBetween: 30, speed: 380, grabCursor: true, keyboard: { enabled: true }, resistanceRatio: 0.55,
      navigation: { prevEl: '#prev', nextEl: '#next' },
      pagination: { el: '#dots', clickable: true },
      on: { slideChange: () => Arcade.sfx('swish') },
    });
  }
  start();
  let resizeT = 0;
  addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(start, 150); });
  // test-only: open the spread with this sticker on it
  window.__bookShow = (id) => { const pi = pageEls.findIndex(pg => pg.querySelector(`[data-sticker="${id}"]`)); if (swiper && pi >= 0) swiper.slideTo(spreadOf(pi), 0); };

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
  window.__bookState = () => ({ total, got, fresh: fresh.length, pages: pageEls.length, spreads: spreads.children.length, spread: swiper ? swiper.activeIndex : 0, swipe: !!swiper });
})();
