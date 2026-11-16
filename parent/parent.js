// =====================================================================
// The Parent corner (Nov 16, plan points 9 + 10). A page for grown-ups:
//  * what each kid plays (minutes today, the last 7 days, which games)
//  * their stickers and trophies
//  * a time limit per day for each kid
//  * sound (for the device) and music (per kid)
//  * drawing quality (for older tablets)
//  * "Report a problem": opens an email, already filled in
//
// The door: on the hub you hold the Grown-ups button for 3 seconds
// (Arcade.parent.holdButton in arcade/parent.js). Opening this page any
// other way shows the same hold button first.
//
// Nothing here is sent anywhere. The numbers come from 'kidsArcade.parent'
// in this device's storage (see arcade/parent.js) and from each kid's saves.
// =====================================================================
(function () {
  'use strict';
  const P = Arcade.profiles, PA = Arcade.parent, esc = Arcade.escapeHTML;
  const main = document.getElementById('main');
  document.getElementById('home').innerHTML = Arcade.icons.home;

  // Where "Report a problem" emails go. Leave '' and the email opens with no address
  // filled in. (Keith: put your address between the quotes if you want it filled in.
  // It will be readable by anyone who looks at this file on GitHub.)
  const REPORT_EMAIL = '';

  const LIMITS = [0, 15, 30, 45, 60, 90, 120];       // minutes per day (0 = no limit)
  const GAME_NAMES = Object.assign({ hub: 'Picking a game', house: 'My House', stickers: 'Sticker Book' },
    Object.fromEntries(Arcade.stickers.games.map(g => [g.id, g.name])));
  const GAME_COLORS = Object.fromEntries(Arcade.stickers.games.map(g => [g.id, g.color]));
  const mins = (sec) => Math.round(sec / 60);
  const nice = (sec) => { const m = mins(sec); return m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60) + ' min' : m + ' min'; };

  // the last 7 days as '2026-11-16' strings, oldest first (ending today)
  function lastDays(n) {
    const [y, m, d] = PA.today().split('-').map(Number), out = [];
    for (let k = n - 1; k >= 0; k--) {
      const t = new Date(y, m - 1, d - k);
      out.push(t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'));
    }
    return out;
  }
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = (str) => { const [y, m, d] = str.split('-').map(Number); return DAY_NAMES[new Date(y, m - 1, d).getDay()]; };

  // Look into another player's saves: switch to them, run fn, switch back.
  function asPlayer(id, fn) {
    const was = P.active().id;
    P.use(id);
    try { return fn(); } finally { P.use(was); }
  }

  // ---- one card per kid ----
  function kidCard(p, n) {
    const d = PA.load(), days = lastDays(7), time = d.time[p.id] || {};
    const perDay = days.map(day => Object.values(time[day] || {}).reduce((s, v) => s + v, 0));
    const week = perDay.reduce((s, v) => s + v, 0), todaySec = perDay[6];
    // which games this week (the hub, house and sticker book count as screen time but aren't "games played")
    const perGame = {};
    for (const day of days) for (const [g, sec] of Object.entries(time[day] || {})) perGame[g] = (perGame[g] || 0) + sec;
    const games = Object.entries(perGame).filter(([g, sec]) => sec >= 30).sort((a, b) => b[1] - a[1]);
    const top = games.length ? games[0][1] : 1;
    const info = asPlayer(p.id, () => ({ stickers: Arcade.stickers.count(), trophies: Arcade.stickers.trophyCount(), s: Object.assign({}, Arcade.store.settings()) }));
    const maxDay = Math.max(60, ...perDay);

    const card = Arcade.h('section', { class: 'card', 'data-kid': p.id });
    card.innerHTML =
      `<h2><span class="av">${P.avatar(p)}</span><span>${esc(p.name || 'Player ' + n)}<br><small>${P.little(p) ? 'Little kid (3-5): everything on Easy, extra help' : 'Big kid (6+)'}</small></span></h2>` +
      `<div class="facts">` +
        `<div class="fact"><b data-today>${nice(todaySec)}</b><span>today</span></div>` +
        `<div class="fact"><b data-week>${nice(week)}</b><span>last 7 days</span></div>` +
        `<div class="fact"><b data-stickers>${info.stickers} / ${Arcade.stickers.list.length}</b><span>stickers</span></div>` +
        `<div class="fact"><b data-trophies>${info.trophies}</b><span>trophies</span></div>` +
      `</div>` +
      `<div class="cols"><div><h3>Screen time, last 7 days</h3><div class="week">` +
        days.map((day, i) => `<div class="d${i === 6 ? ' today' : ''}"><b>${perDay[i] >= 30 ? mins(perDay[i]) : ''}</b><i style="height:${Math.round(perDay[i] / maxDay * 80)}%"></i>${i === 6 ? 'Today' : dayName(day)}</div>`).join('') +
        `</div><p class="hint">Minutes with the arcade open and on screen.</p></div>` +
      `<div><h3>What they played</h3>` +
        (games.length ? `<div class="games">` + games.map(([g, sec]) =>
          `<div class="g" data-game="${esc(g)}" style="--c:${GAME_COLORS[g] || '#c9c9d6'}"><span>${esc(GAME_NAMES[g] || g)}</span><i style="width:${Math.max(4, Math.round(sec / top * 100))}%"></i><span>${nice(sec)}</span></div>`).join('') + `</div>`
          : `<p class="none">Nothing yet. Play time is counted from now on.</p>`) +
      `</div></div>`;

    // time limit + music
    const row = Arcade.h('div', { class: 'row' });
    const lim = +d.limit[p.id] || 0;
    const sel = Arcade.h('select', { 'data-limit': p.id, 'aria-label': 'Time limit per day' },
      LIMITS.map(m => `<option value="${m}"${m === lim ? ' selected' : ''}>${m ? (m >= 60 ? (m / 60) + (m === 60 ? ' hour' : ' hours') : m + ' minutes') + ' a day' : 'No limit'}</option>`).join(''));
    sel.addEventListener('change', () => { const x = PA.load(); x.limit[p.id] = +sel.value; if (!+sel.value) delete x.extra[p.id]; PA.save(x); render(); });
    const l1 = Arcade.h('label', {}, 'Time limit '); l1.appendChild(sel); row.appendChild(l1);
    if (lim) {
      const left = Math.max(0, PA.allowed(p.id) * 60 - todaySec);
      row.appendChild(Arcade.h('span', { 'data-left': p.id }, left > 0 ? `${nice(left)} left today` : 'Used up for today'));
      const more = Arcade.h('button', { type: 'button', class: 'btn', 'data-more': p.id }, `+ ${PA.MORE_MIN} minutes today`);
      more.addEventListener('click', () => { PA.giveMore(p.id); render(); });
      row.appendChild(more);
    }
    // this kid's music
    const mus = Arcade.h('button', { type: 'button', class: 'btn' + (info.s.musicOn !== false ? ' on' : ''), 'data-music': p.id }, info.s.musicOn !== false ? 'Music: on' : 'Music: off');
    mus.addEventListener('click', () => { asPlayer(p.id, () => { const s = Arcade.store.settings(); s.musicOn = s.musicOn === false; Arcade.store.save(); }); render(); });
    row.appendChild(mus);
    const vol = Arcade.h('input', { type: 'range', min: 0, max: 1, step: 0.05, 'data-musicvol': p.id, 'aria-label': 'Music volume' });
    vol.value = info.s.music;
    vol.addEventListener('change', () => asPlayer(p.id, () => { Arcade.store.settings().music = +vol.value; Arcade.store.save(); }));
    const l2 = Arcade.h('label', {}, 'Music volume '); l2.appendChild(vol); row.appendChild(l2);
    card.appendChild(row);
    if (lim) card.appendChild(Arcade.h('p', { class: 'hint' }, 'When the time is up, a sleepy moon says "All done for today!" and the games wait until tomorrow. You can hold the button on that screen for 3 seconds to give ' + PA.MORE_MIN + ' more minutes.'));
    return card;
  }

  // ---- sound + graphics for the whole device ----
  function deviceCard() {
    const card = Arcade.h('section', { class: 'card', 'data-device': '1' }, `<h2>This device</h2>`);
    const s = Arcade.store.settings();
    const row = Arcade.h('div', { class: 'row', style: 'border-top:0;margin-top:0;padding-top:0' });
    const mute = Arcade.h('button', { type: 'button', class: 'btn' + (s.muted ? ' warn' : ' on'), 'data-mute': '1' }, s.muted ? 'All sound: off' : 'All sound: on');
    mute.addEventListener('click', () => { s.muted = !s.muted; Arcade.store.save(); render(); });
    row.appendChild(mute);
    const vol = Arcade.h('input', { type: 'range', min: 0, max: 1, step: 0.05, 'data-sfx': '1', 'aria-label': 'Sound effects volume' });
    vol.value = s.sfx;
    vol.addEventListener('change', () => { s.sfx = +vol.value; Arcade.store.save(); });
    const l = Arcade.h('label', {}, 'Sound effects '); l.appendChild(vol); row.appendChild(l);
    card.appendChild(row);
    // drawing quality
    const d = PA.load();
    const row2 = Arcade.h('div', { class: 'row' });
    const sel = Arcade.h('select', { 'data-gfx': '1', 'aria-label': 'Drawing quality' },
      [['auto', 'Automatic' + (d.slow ? ' (now: fast, this device ran slowly)' : '')], ['fast', 'Always fast (older tablets)'], ['sharp', 'Always sharp']]
        .map(([v, t]) => `<option value="${v}"${d.gfx === v ? ' selected' : ''}>${t}</option>`).join(''));
    sel.addEventListener('change', () => { const x = PA.load(); x.gfx = sel.value; if (sel.value === 'auto') x.slow = false; PA.save(x); render(); });
    const l2 = Arcade.h('label', {}, 'Drawing quality '); l2.appendChild(sel); row2.appendChild(l2);
    card.appendChild(row2);
    card.appendChild(Arcade.h('p', { class: 'hint' }, 'Fast draws the action games a little less sharp so they run smoothly on older tablets and phones. Automatic switches by itself when a game runs slowly.'));
    return card;
  }

  // ---- help: report a problem, clear the play time ----
  function reportLink() {
    // only technical details, nothing about the kids
    const ver = (document.querySelector('script[src*="parent.js?v="]') || { src: '' }).src.split('?v=')[1] || 'unknown';
    const body = ['What happened?', '', '', 'Which game?', '', '', '---- (details that help find the problem) ----',
      'Arcade version: ' + ver, 'Screen: ' + screen.width + ' x ' + screen.height + ' (window ' + innerWidth + ' x ' + innerHeight + ')',
      'Opened as an app: ' + (document.documentElement.classList.contains('ar-app') ? 'yes' : 'no'),
      'Drawing quality: ' + PA.load().gfx + (PA.load().slow ? ' (ran slowly)' : ''), 'Browser: ' + navigator.userAgent].join('\n');
    return 'mailto:' + REPORT_EMAIL + '?subject=' + encodeURIComponent('Kids Arcade: a problem') + '&body=' + encodeURIComponent(body);
  }
  function helpCard() {
    const card = Arcade.h('section', { class: 'card', 'data-help': '1' }, `<h2>Help</h2>`);
    const row = Arcade.h('div', { class: 'row', style: 'border-top:0;margin-top:0;padding-top:0' });
    const mail = Arcade.h('a', { class: 'btn main', href: reportLink(), 'data-report': '1', style: 'display:inline-flex;align-items:center;text-decoration:none' }, 'Report a problem');
    row.appendChild(mail);
    const clear = Arcade.h('button', { type: 'button', class: 'btn warn', 'data-clear': '1' }, 'Clear the play-time history');
    clear.addEventListener('click', () => {
      if (clear.dataset.sure !== '1') { clear.dataset.sure = '1'; clear.textContent = 'Tap again to clear it'; return; }
      const x = PA.load(); x.time = {}; x.extra = {}; PA.save(x); render();
    });
    row.appendChild(clear);
    card.appendChild(row);
    card.appendChild(Arcade.h('p', { class: 'hint' }, '"Report a problem" opens your email app with a message started for you. It lists the arcade version, screen size and browser, and nothing about your children. Nothing is sent unless you press Send. Clearing the history keeps stickers, trophies and time limits.'));
    return card;
  }

  function render() {
    main.innerHTML = '';
    main.appendChild(Arcade.h('section', { class: 'card private' }, `<p><b>Private by design.</b> Play time, stickers and settings are kept only in this browser on this device. The arcade has no accounts, no ads, and sends nothing about your children anywhere.</p>`));
    P.list().forEach((p, i) => main.appendChild(kidCard(p, i + 1)));
    main.appendChild(deviceCard());
    main.appendChild(helpCard());
  }

  // ---- the door ----
  let ok = false;
  try { ok = sessionStorage.getItem('kidsArcade.parentOK') === '1'; } catch (e) { ok = false; }
  if (ok) render();
  else {
    const door = Arcade.h('div', { class: 'door', 'data-door': '1' });
    const box = Arcade.h('div', {}, `<p>This page is for grown-ups.</p>`);
    box.appendChild(PA.holdButton('Grown-ups', () => { try { sessionStorage.setItem('kidsArcade.parentOK', '1'); } catch (e) { /* skip */ } render(); }));
    door.appendChild(box);
    main.appendChild(door);
  }
  window.__parentState = () => PA.load();      // for the automated test
})();
