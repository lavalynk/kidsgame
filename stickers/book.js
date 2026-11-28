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
  const canvasBook = !!(window.ArcadeMenus && window.Phaser);     // (Phaser draws the book: see "Canvas menus" below)
  if (!canvasBook) {
    // (Nov 24, point 9 "faster": Swiper is only needed here, in the fallback book without Phaser, so its file is
    //  loaded only now instead of on every visit. Until it's there (or if it never comes) the book is one long list.)
    if (!window.Swiper) {
      const sw = document.createElement('script');
      sw.src = '../arcade/swiper.min.js?v=' + ((document.querySelector('script[src*="book.js"]') || {}).src || '').split('?v=')[1];
      sw.onload = () => { book.classList.remove('noswipe'); start(); };
      document.head.appendChild(sw);
    }
    start();
    let resizeT = 0;
    addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(start, 150); });
  }
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

  // ---------- Canvas menus (Nov 21, Keith: "rewrite everything with Phaser 3 + Rex UI") ----------
  // With Phaser on the page the whole book is drawn by Phaser + Rex UI (arcade/canvasmenu.js), scaled
  // to fit the screen like every game's menus. The HTML book above is only the fallback without Phaser.
  //   screen 'stickers-book': at the top the sticker count + one dot per spread (the open one is yellow);
  //     each game page is a colored card: the game's round picture (attr 'game-<id>': tap = play it) and
  //     its 4 stickers (attr 'sticker-<id>'; new ones are yellow, ones you don't have show how to get them).
  //     Bottom: back arrow ('prev'), home ('home'), next arrow ('next'). A sideways swipe turns the page too.
  //   screen 'stickers-one': one sticker big; buttons 'close' and (not yet yours) 'play'.
  const CM = window.ArcadeMenus && window.Phaser ? window.ArcadeMenus : null;
  let spreadNo = 0, groups = [];
  if (CM) {
    document.body.classList.add('cm');
    CM.lockIcon = null;
    const DOT = (on) => `<circle r="${on ? 9 : 7}" fill="${on ? '#ffd166' : '#ffffff'}" stroke="#2b2b2b" stroke-width="3.5"${on ? '' : ' opacity="0.6"'}/>`;
    const dots = (n, at) => `<svg viewBox="0 0 ${n * 26} 24" xmlns="http://www.w3.org/2000/svg">${Array.from({ length: n }, (_, i) => `<g transform="translate(${13 + i * 26} 12)">${DOT(i === at)}</g>`).join('')}</svg>`;
    const SWISH = () => { Arcade.audio.resume(); Arcade.sfx('swish'); };
    const pageColor = (game) => game === 'arcade' ? '#ff8fc4' : game === 'surprise' ? '#ffcf70' : Arcade.mixWhite(ST.list.find(s => s.game === game).color, 0.25);
    const playable = (game) => !own(game) || game === 'surprise';
    const goPlay = (game) => { Arcade.sfx('click'); location.href = game === 'surprise' ? '../index.html' : `../${game}/index.html`; };
    // How many pages on one spread: wide screens 2 (one under the other), phones held upright 2 as well
    // (bigger stickers there); the Daily Surprise page (8 stickers) always has a spread of its own.
    function makeGroups() {
      groups = [];
      let cur = [];
      for (const game of pages) {
        if (game === 'surprise') { if (cur.length) groups.push(cur); groups.push([game]); cur = []; continue; }
        cur.push(game);
        if (cur.length === 2) { groups.push(cur); cur = []; }
      }
      if (cur.length) groups.push(cur);
    }
    makeGroups();
    // one game page: the game's picture + its stickers on a card of the game's color
    function pageRow(game) {
      const wide = innerWidth >= innerHeight;
      const col = pageColor(game);
      const stickers = ST.list.filter(s => s.game === game);
      const badgeTile = {
        pic: game === 'surprise' ? Arcade.daily.gift(false) : badge(game), fill: true, attr: 'game-' + game, label: nameOf(game),
        onTap: (o) => { if (playable(game)) goPlay(game); else { Arcade.sfx('pop'); CM.wiggle(o); } },
      };
      const tiles = stickers.map(s => {
        const have = ST.has(s.id);
        return { pic: ST.svg(s, !have), fill: have, attr: 'sticker-' + s.id, label: have ? s.name : '?', say: have ? s.name : 'A sticker to find', picked: fresh.includes(s.id),
          color: have ? null : Arcade.mixWhite(s.color, 0.05),        // (the dotted "?" is white: it needs a colored tile)
          meta: have ? [] : s.n ? [{ text: String(s.n) }] : [{ svg: ST.hintPic(s) }],
          onTap: () => zoomScreen(s) };
      });
      // sideways: one line (picture + 4 stickers); upright: the picture beside 2 x 2 big stickers
      if (wide) return { t: 'tiles', bg: col, items: [badgeTile].concat(tiles), w: 108, h: 108 };
      const sw = game === 'surprise' ? 98 : 112;
      return { t: 'cols', keep: true, bg: col, gap: 10, cols: [
        { w: 104, rows: [{ t: 'tiles', items: [badgeTile], w: 104, h: 104 }] },
        { w: sw * 2 + 12, rows: [{ t: 'tiles', items: tiles, w: sw, h: sw }] },
      ] };
    }
    function bookScreen() {
      spreadNo = Math.max(0, Math.min(groups.length - 1, spreadNo));
      const turn = (d) => {
        const n = spreadNo + d;
        if (n < 0 || n >= groups.length) return false;
        spreadNo = n; SWISH(); bookScreen(); return true;
      };
      const arrow = (d, attr, icon) => ({ icon, label: '', attr, minW: 110, color: 'white', dim: spreadNo + d < 0 || spreadNo + d >= groups.length,
        onTap: (o) => { if (!turn(d)) { Arcade.sfx('pop'); CM.wiggle(o); } } });
      CM.open({ id: 'stickers-book', tab: spreadNo,
        top: [
          { t: 'chips', items: [{ svg: BOOK }, { svg: ST.svg(ST.list[0], false), text: `${got} / ${total}` }] },
          { t: 'pics', items: [dots(groups.length, spreadNo)], size: groups.length * 26 },
        ],
        rows: groups[spreadNo].map(pageRow),
        footer: { t: 'buttons', items: [arrow(-1, 'prev', Arcade.icons.left),
          { icon: Arcade.icons.home, label: '', attr: 'home', color: 'big', minW: 110, onTap: () => { Arcade.sfx('click'); location.href = '../index.html'; } },
          LK ? { icon: LK.ICON, label: '', attr: 'looks', color: 'pink', minW: 110, onTap: () => { SWISH(); looksScreen(); } } : null,
          arrow(1, 'next', Arcade.icons.right)].filter(Boolean) },
        onSwipe: (d) => turn(d),
        onKey: (code) => { if (code === 'ArrowRight') turn(1); if (code === 'ArrowLeft') turn(-1); },
      });
    }
    // one sticker, big (yours: its name + confetti; not yet: how to get it + a Play button for that game)
    function zoomScreen(s) {
      Arcade.audio.resume();
      const have = ST.has(s.id);
      Arcade.sfx(have ? 'star' : 'pop');
      const wide = innerWidth >= innerHeight;
      const rows = [{ t: 'pics', items: [have ? ST.svg(s, false) : lockedBig(s)], size: wide ? 250 : 260 }];
      if (have) rows.push({ t: 'text', text: s.name, size: 34, big: true, color: '#ffd166' });
      else {
        // how to get it: the game's picture + the hint picture (big), and the number for "8 surprises" kinds
        rows.push({ t: 'pics', items: [own(s.game) ? null : onCard(badge(s.game), 0), onCard(ST.hintPic(s), 14)].filter(Boolean), size: 96 });
        if (s.n) rows.push({ t: 'text', text: String(s.n), size: 40, big: true, color: '#ffd166' });
      }
      const close = () => { Arcade.sfx('click'); bookScreen(); };
      const items = [{ icon: X, label: '', attr: 'close', color: 'white', minW: 120, onTap: close }];
      if (!have && !own(s.game)) items.push({ icon: Arcade.icons.play, label: '', attr: 'play', color: 'big', minW: 140, onTap: () => goPlay(s.game) });
      CM.open({ id: 'stickers-one', rows, footer: { t: 'buttons', items }, onKey: (code) => { if (code === 'Escape' || code === 'Enter' || code === 'Space') close(); } });
      if (have) Arcade.confetti(40);
    }
    // ---- My Looks (Nov 24, the Star Road, point 8 part 5) ----
    // Every game's looks (hats, colors, trails earned with stars) on one page each, like the stickers:
    // the game's picture (tap = play) + its looks; ones still to earn are pale with a "?".
    //   screen 'stickers-looks': chips (looks got / all), one card per game (tile lgame-<id>, tiles look-<game>-<id>),
    //     footer 'back' (the book) + 'home'.   screen 'stickers-look': one look big; 'close' (+ 'play' if not yet yours).
    const LK = Arcade.looks && Arcade.looks.GAMES ? Arcade.looks : null;
    const lookGames = LK ? ST.games.map(g => g.id).filter(id => LK.GAMES[id]) : [];
    // a look you don't have yet: its picture faded on a pale card + a big "?"
    const paleLook = (svg) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g opacity="0.22">` +
      svg.replace(/<svg\b[^>]*?(viewBox="[^"]*")[^>]*>/, '<svg x="0" y="0" width="100" height="100" $1>') + '</g>' +
      `<text x="50" y="68" font-size="54" font-weight="900" font-family="Arial Black, Arial, sans-serif" text-anchor="middle" fill="#fff" stroke="#2b2b2b" stroke-width="5" paint-order="stroke">?</text></svg>`;
    // a game's looks: its Star Road + (Nov 28) its winter presents (the ones you have, or all of them in winter)
    const road = (game) => LK.roadOf(game).concat(LK.giftsOf ? LK.giftsOf(game) : []);
    function lookCount() {
      let got = 0, all = 0;
      for (const id of lookGames) { const g = LK.gotIn(id); for (const r of road(id)) { all++; if (g.includes(r.id)) got++; } }
      return { got, all };
    }
    function looksScreen() {
      const wide = innerWidth >= innerHeight, n = lookCount();
      const rows = lookGames.map(game => {
        const got = LK.gotIn(game), col = pageColor(game);
        const items = [{ pic: badge(game), fill: true, attr: 'lgame-' + game, label: nameOf(game), onTap: () => goPlay(game) }];
        for (const r of road(game)) {
          const have = got.includes(r.id);
          items.push({ pic: have ? r.svg : paleLook(r.svg), attr: 'look-' + game + '-' + r.id, label: have ? r.name : '?',
            color: have ? null : Arcade.mixWhite(col, 0.5), onTap: () => lookScreen(game, r) });
        }
        return { t: 'tiles', bg: col, items, w: wide ? 84 : 80, h: wide ? 84 : 80 };
      });
      CM.open({ id: 'stickers-looks', title: 'Looks',
        top: [{ t: 'chips', items: [{ svg: LK.ICON, text: `${n.got} / ${n.all}` }] }],
        rows,
        footer: { t: 'buttons', items: [
          { icon: Arcade.icons.left, label: '', attr: 'back', color: 'white', minW: 110, onTap: () => { SWISH(); bookScreen(); } },
          { icon: Arcade.icons.home, label: '', attr: 'home', color: 'big', minW: 110, onTap: () => { Arcade.sfx('click'); location.href = '../index.html'; } }] },
        onKey: (code) => { if (code === 'Escape') { SWISH(); bookScreen(); } } });
    }
    // one look, big: yours = its name + confetti; not yet = the game's picture + a Play button
    function lookScreen(game, r) {
      Arcade.audio.resume();
      const have = LK.gotIn(game).includes(r.id), wide = innerWidth >= innerHeight;
      Arcade.sfx(have ? 'sparkle' : 'pop');
      const rows = [{ t: 'pics', items: [have ? r.svg : paleLook(r.svg)], size: wide ? 230 : 250, glow: have }];
      if (have) rows.push({ t: 'text', text: r.name, size: 34, big: true, color: '#ffd166' });
      rows.push({ t: 'pics', items: [onCard(badge(game), 0)], size: 96 });
      const close = () => { Arcade.sfx('click'); looksScreen(); };
      const items = [{ icon: X, label: '', attr: 'close', color: 'white', minW: 120, onTap: close }];
      if (!have) items.push({ icon: Arcade.icons.play, label: '', attr: 'play', color: 'big', minW: 140, onTap: () => goPlay(game) });
      CM.open({ id: 'stickers-look', rows, footer: { t: 'buttons', items }, onKey: (code) => { if (code === 'Escape' || code === 'Enter' || code === 'Space') close(); } });
      if (have) Arcade.confetti(30);
    }
    window.__bookLooks = () => ({ games: lookGames, count: lookCount(), open: () => looksScreen() });
    // a little picture on a white card (the dark hint pictures can't be seen on the dark menu)
    const onCard = (svg, pad) => `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="cc"><rect x="4" y="4" width="112" height="112" rx="24"/></clipPath></defs>` +
      `<rect x="4" y="4" width="112" height="112" rx="24" fill="#fff"/><g clip-path="url(#cc)">` +
      svg.replace(/<svg\b[^>]*?(viewBox="[^"]*")[^>]*>/, `<svg x="${4 + pad}" y="${4 + pad}" width="${112 - pad * 2}" height="${112 - pad * 2}" $1>`) +
      `</g><rect x="4" y="4" width="112" height="112" rx="24" fill="none" stroke="#2b2b2b" stroke-width="6"/></svg>`;
    // a sticker you don't have yet: the dotted "?" on its color
    const lockedBig = (s) => `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="112" height="112" rx="26" fill="${Arcade.mixWhite(s.color, 0.05)}" stroke="#2b2b2b" stroke-width="6"/>` +
      ST.svg(s, true).replace('<svg', '<svg x="10" y="10" width="100" height="100"') + '</svg>';
    bookScreen();
    let againT = 0;
    addEventListener('resize', () => { clearTimeout(againT); againT = setTimeout(() => { if (CM.screen() === 'stickers-book') bookScreen(); }, 200); });
    window.__bookShow = (id) => { const s = ST.list.find(x => x.id === id); const gi = groups.findIndex(g => g.includes(s.game)); if (gi >= 0) { spreadNo = gi; bookScreen(); } };
  }

  // test hook
  window.__bookState = () => CM
    ? { total, got, fresh: fresh.length, pages: pages.length, spreads: groups.length, spread: spreadNo, swipe: true, canvas: true, screen: CM.isOpen ? CM.screen() : '' }
    : { total, got, fresh: fresh.length, pages: pageEls.length, spreads: spreads.children.length, spread: swiper ? swiper.activeIndex : 0, swipe: !!swiper };
})();
