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
  // everything we know about one kid (the HTML cards and the canvas page both use it)
  function kidInfo(p) {
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
    return { d, days, perDay, week, todaySec, games, top, info, maxDay, lim: +d.limit[p.id] || 0 };
  }
  function kidCard(p, n) {
    const { d, days, perDay, week, todaySec, games, top, info, maxDay } = kidInfo(p);

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
    if (CANVAS) { pageScreen(); return; }
    main.innerHTML = '';
    main.appendChild(Arcade.h('section', { class: 'card private' }, `<p><b>Private by design.</b> Play time, stickers and settings are kept only in this browser on this device. The arcade has no accounts, no ads, and sends nothing about your children anywhere.</p>`));
    P.list().forEach((p, i) => main.appendChild(kidCard(p, i + 1)));
    main.appendChild(deviceCard());
    main.appendChild(helpCard());
  }

  // =====================================================================
  // The canvas page (Nov 21, Keith: "rewrite everything to utilize Phaser 3 + Rex UI").
  // With Phaser loaded the whole page is drawn on the canvas (the HTML above is only the fallback):
  //   'parent-door': the hold button (attr 'hold', 3 seconds) + home
  //   'parent':      picture tabs on top that stay put: one per kid (kid-<id>), this device (device), help (help);
  //                  under them the open tab:
  //     a kid:   their name, 4 chips (today, last 7 days, stickers, trophies), two charts (one SVG picture each:
  //              the last 7 days, what they played), the time limit (buttons limit-<min>, + more), music + its volume
  //     device:  all sound (mute), sound effects volume (sfx), drawing quality (gfx-auto / gfx-fast / gfx-sharp)
  //     help:    private by design, Report a problem (report), clear the play-time history (clear: tap twice)
  //   footer:    home
  // Reading is fine here: this page is for grown-ups.
  // =====================================================================
  const CANVAS = !!window.ArcadeMenus;
  let tab = null;                 // the open tab: a player id, 'device' or 'help'
  let sureClear = false;          // "tap again to clear it"
  const GEAR = `<svg viewBox="0 0 48 48"><path d="M24 4 L28 4 L29 10 L34 12 L39 8 L42 11 L38 16 L40 21 L46 22 L46 26 L40 27 L38 32 L42 37 L39 40 L34 36 L29 38 L28 44 L20 44 L19 38 L14 36 L9 40 L6 37 L10 32 L8 27 L2 26 L2 22 L8 21 L10 16 L6 11 L9 8 L14 12 L19 10 L20 4 Z" fill="#8ecae6" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/><circle cx="24" cy="24" r="7" fill="#fff" stroke="#2b2b2b" stroke-width="3.5"/></svg>`;
  const CLOCK = `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19" fill="#fff" stroke="#2b2b2b" stroke-width="4"/><path d="M24 12 V24 L32 29" fill="none" stroke="#ef476f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const WEEK = `<svg viewBox="0 0 48 48"><rect x="6" y="10" width="36" height="32" rx="5" fill="#fff" stroke="#2b2b2b" stroke-width="4"/><rect x="6" y="10" width="36" height="10" rx="4" fill="#9b5de5" stroke="#2b2b2b" stroke-width="4"/><path d="M14 6 V14 M34 6 V14" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/><circle cx="17" cy="30" r="3" fill="#2b2b2b"/><circle cx="31" cy="30" r="3" fill="#06d6a0"/></svg>`;
  const STICKER = `<svg viewBox="0 0 48 48"><path d="M24 4 L30 17 L44 18 L33 28 L37 43 L24 35 L11 43 L15 28 L4 18 L18 17 Z" fill="#ffafcc" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/></svg>`;
  const SHIELD = `<svg viewBox="0 0 48 48"><path d="M24 4 L40 10 V24 C40 34 32 41 24 44 C16 41 8 34 8 24 V10 Z" fill="#06d6a0" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><path d="M16 24 L22 30 L33 18" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const MAIL = `<svg viewBox="0 0 48 48"><rect x="5" y="11" width="38" height="27" rx="5" fill="#fff" stroke="#2b2b2b" stroke-width="4"/><path d="M7 14 L24 27 L41 14" fill="none" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/></svg>`;
  const BIN = `<svg viewBox="0 0 48 48"><path d="M10 14 H38 L35 43 H13 Z" fill="#ffd6d6" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><path d="M6 13 H42 M19 13 V7 H29 V13" fill="none" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const PLUS = `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19" fill="#06d6a0" stroke="#2b2b2b" stroke-width="4"/><path d="M24 14 V34 M14 24 H34" stroke="#fff" stroke-width="6" stroke-linecap="round"/></svg>`;
  const FONT_SVG = `font-family="Trebuchet MS, Arial, sans-serif" font-weight="bold"`;
  const CHART_W = 340;            // board units: both charts are this wide (side by side when the screen is wide)
  const limitName = (m) => !m ? 'No limit' : m === 60 ? '1 hour' : m === 90 ? '1½ hours' : m === 120 ? '2 hours' : m + ' min';

  // the last 7 days as bars (one SVG picture)
  function weekSVG(k) {
    const W = 360, H = 200, bw = 36, gap = (W - 20 - 7 * bw) / 6;
    let out = `<svg viewBox="0 0 ${W} ${H}"><rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="18" fill="#fff" stroke="#2b2b2b" stroke-width="4"/>`;
    k.days.forEach((day, i) => {
      const x = 10 + i * (bw + gap), hgt = Math.max(3, Math.round(k.perDay[i] / k.maxDay * 120)), y = 160 - hgt;
      out += `<rect x="${x.toFixed(1)}" y="${y}" width="${bw}" height="${hgt}" rx="6" fill="${i === 6 ? '#06d6a0' : '#9b5de5'}" stroke="#2b2b2b" stroke-width="2.5"/>`;
      if (k.perDay[i] >= 30) out += `<text x="${(x + bw / 2).toFixed(1)}" y="${y - 6}" text-anchor="middle" font-size="15" fill="#2b2b2b" ${FONT_SVG}>${mins(k.perDay[i])}</text>`;
      out += `<text x="${(x + bw / 2).toFixed(1)}" y="184" text-anchor="middle" font-size="15" fill="${i === 6 ? '#1b7f5a' : '#5d5d6b'}" ${FONT_SVG}>${i === 6 ? 'Today' : dayName(day)}</text>`;
    });
    return out + `</svg>`;
  }
  // which games, most played first: name, a bar, the minutes (one SVG picture)
  function gamesSVG(k) {
    const W = 360, rowH = 30, H = Math.max(1, k.games.length) * rowH + 24;
    let out = `<svg viewBox="0 0 ${W} ${H}"><rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="18" fill="#fff" stroke="#2b2b2b" stroke-width="4"/>`;
    if (!k.games.length) out += `<text x="${W / 2}" y="${H / 2 + 6}" text-anchor="middle" font-size="16" fill="#5d5d6b" ${FONT_SVG}>Nothing yet this week</text>`;
    k.games.forEach(([g, sec], i) => {
      const y = 12 + i * rowH, bar = Math.max(6, Math.round(sec / k.top * 120));
      const name = GAME_NAMES[g] || g;
      out += `<text x="16" y="${y + 20}" font-size="15" fill="#2b2b2b" ${FONT_SVG}>${esc(name.length > 17 ? name.slice(0, 16) + '…' : name)}</text>` +
        `<rect x="160" y="${y + 7}" width="${bar}" height="16" rx="8" fill="${GAME_COLORS[g] || '#c9c9d6'}" stroke="#2b2b2b" stroke-width="2.5"/>` +
        `<text x="${W - 16}" y="${y + 20}" text-anchor="end" font-size="15" fill="#2b2b2b" ${FONT_SVG}>${nice(sec)}</text>`;
    });
    return out + `</svg>`;
  }
  // a picture as wide as CHART_W (pics rows size a picture by its longer side)
  const chartSize = (svg) => { const m = /viewBox="0 0 (\d+) (\d+)"/.exec(svg); return Math.round(CHART_W * Math.max(+m[1], +m[2]) / +m[1]); };
  const heading = (text) => ({ t: 'text', text, size: 20, color: '#ffd166' });
  const tapDo = (fn) => () => { Arcade.sfx && Arcade.sfx('click'); fn(); };

  function kidRows(p, n) {
    const k = kidInfo(p), rows = [];
    rows.push({ t: 'text', text: p.name || 'Player ' + n, size: 34, big: true });
    rows.push({ t: 'text', text: P.little(p) ? 'Little kid (3-5): everything on Easy, extra help' : 'Big kid (6+)', size: 17, color: '#dcd6ff' });
    rows.push({ t: 'chips', items: [
      { svg: CLOCK, text: nice(k.todaySec) + ' today' }, { svg: WEEK, text: nice(k.week) + ' this week' },
      { svg: STICKER, text: k.info.stickers + ' / ' + Arcade.stickers.list.length }, { svg: Arcade.icons.trophy, text: String(k.info.trophies) }] });
    const wk = weekSVG(k), gm = gamesSVG(k);
    rows.push({ t: 'cols', gap: 20, cols: [
      { w: CHART_W + 10, rows: [heading('Screen time, last 7 days'), { t: 'pics', items: [wk], size: chartSize(wk) }] },
      { w: CHART_W + 10, rows: [heading('What they played'), { t: 'pics', items: [gm], size: chartSize(gm) }] }] });
    // the time limit
    rows.push(heading('Time limit per day'));
    rows.push({ t: 'buttons', items: LIMITS.map(m => ({ label: limitName(m), attr: 'limit-' + m, minW: 100, color: m === k.lim ? 'yellow' : 'white',
      onTap: tapDo(() => { const x = PA.load(); x.limit[p.id] = m; if (!m) delete x.extra[p.id]; PA.save(x); pageScreen(); }) })) });
    if (k.lim) {
      const left = Math.max(0, PA.allowed(p.id) * 60 - k.todaySec);
      rows.push({ t: 'text', text: (left > 0 ? nice(left) + ' left today' : 'Used up for today') + '. When it runs out, a sleepy moon says "All done for today!" (hold its button 3 seconds for ' + PA.MORE_MIN + ' more minutes).', size: 17 });
      rows.push({ t: 'buttons', items: [{ icon: PLUS, label: PA.MORE_MIN + ' more minutes today', attr: 'more', color: 'green', onTap: tapDo(() => { PA.giveMore(p.id); pageScreen(); }) }] });
    }
    // this kid's music
    const on = k.info.s.musicOn !== false;
    rows.push(heading('Music'));
    rows.push({ t: 'buttons', items: [{ icon: on ? Arcade.icons.music : Arcade.icons.musicOff, label: on ? 'Music: on' : 'Music: off', attr: 'music', color: on ? 'green' : 'white',
      onTap: tapDo(() => { asPlayer(p.id, () => { const s = Arcade.store.settings(); s.musicOn = s.musicOn === false; Arcade.store.save(); }); pageScreen(); }) }] });
    rows.push({ t: 'slider', icon: Arcade.icons.music, value: +k.info.s.music || 0, attr: 'musicvol', label: 'Music volume',
      onChange: (v) => asPlayer(p.id, () => { Arcade.store.settings().music = Math.round(v * 20) / 20; Arcade.store.save(); }) });
    return rows;
  }
  function deviceRows() {
    const s = Arcade.store.settings(), d = PA.load();
    return [
      { t: 'text', text: 'This device', size: 34, big: true },
      { t: 'buttons', items: [{ icon: s.muted ? Arcade.icons.mute : Arcade.icons.sound, label: s.muted ? 'All sound: off' : 'All sound: on', attr: 'mute', color: s.muted ? 'pink' : 'green',
        onTap: tapDo(() => { s.muted = !s.muted; Arcade.store.save(); pageScreen(); }) }] },
      heading('Sound effects'),
      { t: 'slider', icon: Arcade.icons.sound, value: +s.sfx || 0, attr: 'sfx', label: 'Sound effects volume', onChange: (v) => { s.sfx = Math.round(v * 20) / 20; Arcade.store.save(); } },
      heading('Drawing quality'),
      { t: 'buttons', items: [['auto', 'Automatic'], ['fast', 'Always fast'], ['sharp', 'Always sharp']].map(([v, label]) => ({ label, attr: 'gfx-' + v, color: d.gfx === v ? 'yellow' : 'white',
        onTap: tapDo(() => { const x = PA.load(); x.gfx = v; if (v === 'auto') x.slow = false; PA.save(x); pageScreen(); }) })) },
      { t: 'text', size: 17, text: 'Fast draws the action games a little less sharp so they run smoothly on older tablets and phones. Automatic switches by itself when a game runs slowly.' +
        (d.gfx === 'auto' && d.slow ? ' (Right now: fast, this device ran slowly.)' : '') },
    ];
  }
  function helpRows() {
    return [
      { t: 'text', text: 'Help', size: 34, big: true },
      { t: 'pics', items: [SHIELD], size: 64 },
      { t: 'text', size: 18, text: 'Private by design. Play time, stickers and settings are kept only in this browser on this device. The arcade has no accounts, no ads, and sends nothing about your children anywhere.' },
      { t: 'buttons', items: [
        { icon: MAIL, label: 'Report a problem', attr: 'report', color: 'yellow', onTap: tapDo(() => { location.href = reportLink(); }) },
        { icon: BIN, label: sureClear ? 'Tap again to clear it' : 'Clear the play-time history', attr: 'clear', color: 'pink',
          onTap: tapDo(() => {
            if (!sureClear) { sureClear = true; pageScreen(); return; }
            sureClear = false; const x = PA.load(); x.time = {}; x.extra = {}; PA.save(x); pageScreen();
          }) },
      ] },
      { t: 'text', size: 17, text: '"Report a problem" opens your email app with a message started for you. It lists the arcade version, screen size and browser, and nothing about your children. Nothing is sent unless you press Send. Clearing the history keeps stickers, trophies and time limits.' },
    ];
  }
  const homeRow = { t: 'buttons', items: [{ icon: Arcade.icons.home, label: '', attr: 'home', color: 'white', minW: 110, onTap: tapDo(() => { location.href = '../index.html'; }) }] };
  function pageScreen() {
    const kids = P.list();
    if (!kids.some(p => p.id === tab) && tab !== 'device' && tab !== 'help') tab = kids[0].id;
    if (tab !== 'help') sureClear = false;
    const tabs = kids.map((p, i) => ({ icon: P.avatar(p), label: p.name || 'Player ' + (i + 1), attr: 'kid-' + p.id, picked: tab === p.id }))
      .concat([{ icon: GEAR, label: 'Device', attr: 'device', picked: tab === 'device' }, { icon: Arcade.icons.help, label: 'Help', attr: 'help', picked: tab === 'help' }]);
    for (const t of tabs) { const id = t.attr.startsWith('kid-') ? t.attr.slice(4) : t.attr; t.onTap = tapDo(() => { tab = id; pageScreen(); }); }
    const n = kids.findIndex(p => p.id === tab);
    const rows = tab === 'device' ? deviceRows() : tab === 'help' ? helpRows() : kidRows(kids[n], n + 1);
    ArcadeMenus.open({ id: 'parent', tab, top: { t: 'round', items: tabs }, rows, footer: homeRow,
      onKey: (c) => { if (c === 'Escape') location.href = '../index.html'; } });
  }
  function doorScreen(onOpen) {
    ArcadeMenus.open({ id: 'parent-door', title: 'Grown-ups', rows: [
      { t: 'pics', items: [Arcade.icons.lock], size: 90 },
      { t: 'text', text: 'This page is for grown-ups.', size: 22 },
      { t: 'buttons', items: [{ icon: Arcade.icons.lock, label: 'Hold for 3 seconds', attr: 'hold', color: 'white', hold: 3000, minW: 320, onTap: onOpen }] },
    ], footer: homeRow });
  }
  if (CANVAS) document.body.classList.add('cm');

  // ---- the door ----
  let ok = false;
  try { ok = sessionStorage.getItem('kidsArcade.parentOK') === '1'; } catch (e) { ok = false; }
  const letIn = () => { try { sessionStorage.setItem('kidsArcade.parentOK', '1'); } catch (e) { /* skip */ } render(); };
  if (ok) render();
  else if (CANVAS) doorScreen(letIn);
  else {
    const door = Arcade.h('div', { class: 'door', 'data-door': '1' });
    const box = Arcade.h('div', {}, `<p>This page is for grown-ups.</p>`);
    box.appendChild(PA.holdButton('Grown-ups', () => { try { sessionStorage.setItem('kidsArcade.parentOK', '1'); } catch (e) { /* skip */ } render(); }));
    door.appendChild(box);
    main.appendChild(door);
  }
  window.__parentState = () => PA.load();      // for the automated test
  // (tests: what the canvas page shows for a kid, and the report email)
  window.__parentView = (id) => { const p = P.list().find(x => x.id === id); const k = kidInfo(p);
    return { tab, today: nice(k.todaySec), week: nice(k.week), stickers: k.info.stickers, trophies: k.info.trophies, games: k.games.map(g => g[0]), limit: k.lim,
      text: CANVAS && ArcadeMenus.current() ? JSON.stringify(ArcadeMenus.current().rows.map(r => r.text || (r.items || []).map(i => i.text || i.label || '').join(' '))) : '' }; };
  window.__parentReport = () => reportLink();
})();
