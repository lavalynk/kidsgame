// =====================================================================
// The grown-ups' helper (Nov 16, plan point 9 "Parent corner").
// Loaded on every page, after shared.js / stickers.js / daily.js.
//
// It does three small jobs:
//  1. PLAY TIME: while a page is open and showing, it counts the seconds
//     for the player who's playing, per game and per day (kept for 14 days).
//  2. TIME LIMIT: a grown-up can set minutes per day for each player (in the
//     Parent corner, parent/index.html). When today's time is used up, a
//     friendly "All done for today!" screen covers the game. A grown-up can
//     hold a button for 3 seconds to give 15 more minutes.
//  2b. BEDTIME (Nov 22): a grown-up can also pick a bedtime for each player
//     (e.g. 7:30 pm). From then until 6 in the morning a "Time for bed!" screen
//     covers the games. Holding its button for 3 seconds gives 15 more minutes
//     (for tonight only).
//  3. HOLD BUTTONS: Arcade.parent.holdButton() makes a button that only works
//     when it's held down for 3 seconds (a ring fills up while you hold).
//     Little kids tap; they rarely hold. That's the "lock" on the Parent corner.
//
// Everything is kept in this device's localStorage under 'kidsArcade.parent'.
// NOTHING is sent anywhere.
//
//   { limit: { p1: 30 },                         minutes per day (0 / missing = no limit)
//     bed:   { p1: 1170 },                       bedtime in minutes after midnight (1170 = 7:30 pm; missing = no bedtime)
//     late:  { p1: { night: '2026-11-22', min: 15 } },  "15 more minutes" after bedtime, for one night
//     extra: { p1: { day: '2026-11-16', min: 15 } },   "15 more minutes" given today
//     time:  { p1: { '2026-11-16': { rc: 310, hub: 40 } } },   seconds per game per day
//     gfx: 'auto' | 'fast' | 'sharp',            drawing quality (see the kit's "lite" mode in shared.js)
//     slow: true,                                the kit noticed this device is slow (gfx 'auto' then starts fast)
//     motion: 'auto' | 'calm' }                  Calm motion (Nov 22): no bouncing menus, confetti or screen shake
//                                                (see Arcade.calm in shared.js; 'auto' = calm only if the device asks)
// =====================================================================
(function () {
  'use strict';
  if (!window.Arcade) return;
  const KEY = 'kidsArcade.parent';
  const TICK = 5;            // count every 5 seconds
  const KEEP_DAYS = 14;      // how many days of play time we remember
  const MORE_MIN = 15;       // "a bit longer": minutes a grown-up can add
  const HOLD_MS = 3000;
  const WAKE = 6 * 60;       // bedtime lasts until 6:00 in the morning

  // Which page is this? Pages in a folder load '../arcade/parent.js'; the hub loads 'arcade/parent.js'.
  const src = (document.currentScript && document.currentScript.getAttribute('src')) || '';
  const inFolder = src.startsWith('../');
  const parts = location.pathname.split('/').filter(s => s && !/\.html?$/.test(s));
  const WHERE = inFolder ? (parts[parts.length - 1] || 'hub') : 'hub';
  const ROOT = inFolder ? '../' : '';
  const COUNTED = WHERE !== 'parent';          // time in the Parent corner isn't play time

  // ---- reading + writing ----
  function load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) { d = null; }
    d = Object.assign({ limit: {}, extra: {}, bed: {}, late: {}, time: {}, gfx: 'auto', slow: false, motion: 'auto' }, d || {});
    return d;
  }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* private mode etc. */ } }
  // today as '2026-11-16' (the same clock as the Daily Surprise, so tests can pretend a day)
  function today() {
    if (Arcade.daily && Arcade.daily._day) return Arcade.daily._day();
    const n = new Date();
    return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0');
  }
  const me = () => Arcade.profiles.active().id;
  // the time of day in minutes after midnight (tests pretend a time with localStorage 'kidsArcade.testTime' = '19:45')
  function nowMin() {
    let t = null;
    try { t = localStorage.getItem('kidsArcade.testTime'); } catch (e) { t = null; }
    if (t && /^\d\d?:\d\d$/.test(t)) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  }
  // which night it is: after midnight (before 6 am) it's still last evening's night
  function night() {
    const day = today();
    if (nowMin() >= WAKE) return day;
    const [y, m, d] = day.split('-').map(Number), t = new Date(y, m - 1, d - 1);
    return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
  }

  // ---- play time ----
  function add(seconds, game = WHERE, player = me()) {
    const d = load(), day = today();
    const mine = d.time[player] = d.time[player] || {};
    const t = mine[day] = mine[day] || {};
    t[game] = (t[game] || 0) + seconds;
    // forget old days
    const days = Object.keys(mine).sort();
    while (days.length > KEEP_DAYS) delete mine[days.shift()];
    save(d);
  }
  // seconds played on a day (all games together)
  function total(player = me(), day = today(), d = load()) {
    const t = (d.time[player] || {})[day] || {};
    return Object.values(t).reduce((s, v) => s + v, 0);
  }
  // minutes allowed today (0 = no limit), counting any "15 more minutes"
  function allowed(player = me(), d = load()) {
    const lim = +d.limit[player] || 0;
    if (!lim) return 0;
    const ex = d.extra[player];
    return lim + (ex && ex.day === today() ? ex.min : 0);
  }
  function isOver(player = me()) {
    const d = load(), a = allowed(player, d);
    return a > 0 && total(player, today(), d) >= a * 60;
  }
  function giveMore(player = me(), min = MORE_MIN) {
    const d = load(), day = today(), ex = d.extra[player];
    d.extra[player] = { day, min: (ex && ex.day === day ? ex.min : 0) + min };
    save(d);
  }

  // ---- bedtime ----
  // tonight's bedtime in minutes after midnight, counting any "15 more minutes" (0 = no bedtime)
  function bedtime(player = me(), d = load()) {
    const bed = +d.bed[player] || 0;
    if (!bed) return 0;
    const late = d.late[player];
    return bed + (late && late.night === night() ? late.min : 0);
  }
  function isBedtime(player = me()) {
    const bed = bedtime(player);
    if (!bed) return false;
    const t = nowMin();
    const n = t < WAKE ? t + 24 * 60 : t;       // after midnight counts as "later tonight"
    return n >= bed;
  }
  function stayUp(player = me(), min = MORE_MIN) {
    const d = load(), n = night(), late = d.late[player];
    d.late[player] = { night: n, min: (late && late.night === n ? late.min : 0) + min };
    // past bedtime already: the 15 minutes start NOW, not at bedtime
    const bed = +d.bed[player] || 0, t = nowMin(), now = t < WAKE ? t + 24 * 60 : t;
    if (bed && now > bed + d.late[player].min - min) d.late[player].min = now - bed + min;
    save(d);
  }
  // a time as words: 1170 -> '7:30 pm'
  function clock(min) {
    const h = Math.floor(min / 60) % 24, m = min % 60;
    return ((h + 11) % 12 + 1) + ':' + String(m).padStart(2, '0') + (h < 12 ? ' am' : ' pm');
  }

  // ---- a button you have to HOLD (3 seconds) ----
  // The ring round the picture fills while you hold; letting go early empties it.
  const LOCK = `<svg viewBox="0 0 48 48"><path d="M15 22 V15 A9 9 0 0 1 33 15 V22" fill="none" stroke="#2b2b2b" stroke-width="5" stroke-linecap="round"/><rect x="9" y="21" width="30" height="22" rx="6" fill="#ffd166" stroke="#2b2b2b" stroke-width="4"/><circle cx="24" cy="31" r="3.5" fill="#2b2b2b"/><path d="M24 31 V37" stroke="#2b2b2b" stroke-width="3.5" stroke-linecap="round"/></svg>`;
  function holdButton(label, onDone, ms = HOLD_MS) {
    const b = Arcade.h('button', { type: 'button', class: 'pa-hold', 'data-hold': '1', 'aria-label': label + ' (hold for 3 seconds)' },
      `<span class="pa-ring"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="#fff" stroke="#c9c9d6" stroke-width="6"/><circle class="pa-fill" cx="30" cy="30" r="26" fill="none" stroke="#06d6a0" stroke-width="6" stroke-linecap="round" stroke-dasharray="163.4" stroke-dashoffset="163.4" transform="rotate(-90 30 30)"/></svg><span class="pa-lock">${LOCK}</span></span>` +
      `<span class="pa-text"><b>${label}</b><small>hold for 3 seconds</small></span>`);
    const fill = b.querySelector('.pa-fill');
    let t0 = 0, raf = 0;
    const set = (k) => { fill.setAttribute('stroke-dashoffset', (163.4 * (1 - k)).toFixed(1)); };
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; t0 = 0; set(0); b.classList.remove('holding'); };
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      set(k);
      if (k >= 1) { stop(); onDone(); return; }
      raf = requestAnimationFrame(step);
    };
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try { b.setPointerCapture(e.pointerId); } catch (_) { /* old browsers */ }
      t0 = performance.now(); b.classList.add('holding');
      if (!raf) raf = requestAnimationFrame(step);
    });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, stop);
    b.addEventListener('contextmenu', (e) => e.preventDefault());     // (a long press must not open a menu)
    // keyboard: hold Enter or Space
    b.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !t0) { e.preventDefault(); t0 = performance.now(); raf = requestAnimationFrame(step); } });
    b.addEventListener('keyup', stop);
    return b;
  }
  // open the Parent corner (only after the 3-second hold; the page checks this note)
  function open() {
    try { sessionStorage.setItem('kidsArcade.parentOK', '1'); } catch (e) { /* skip */ }
    location.href = ROOT + 'parent/index.html';
  }

  // ---- "All done for today!" ----
  const MOON = `<svg viewBox="0 0 200 160"><circle cx="100" cy="84" r="58" fill="#ffe08a" stroke="#2b2b2b" stroke-width="7"/>` +
    `<path d="M72 78 Q82 88 92 78 M108 78 Q118 88 128 78" fill="none" stroke="#2b2b2b" stroke-width="6" stroke-linecap="round"/>` +
    `<ellipse cx="66" cy="98" rx="10" ry="6" fill="#ff8fab"/><ellipse cx="134" cy="98" rx="10" ry="6" fill="#ff8fab"/>` +
    `<path d="M88 104 Q100 114 112 104" fill="none" stroke="#2b2b2b" stroke-width="6" stroke-linecap="round"/>` +
    `<path d="M58 44 Q100 -6 142 44 Q100 30 58 44 Z" fill="#9b5de5" stroke="#2b2b2b" stroke-width="7" stroke-linejoin="round"/><circle cx="150" cy="38" r="10" fill="#fff" stroke="#2b2b2b" stroke-width="6"/>` +
    `<g fill="#fff" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"><path d="M22 30 L26 40 L37 41 L28 48 L31 59 L22 53 L13 59 L16 48 L7 41 L18 40 Z"/><path d="M176 96 L179 104 L188 105 L181 111 L183 120 L176 115 L169 120 L171 111 L164 105 L173 104 Z"/></g>` +
    `<text x="160" y="76" font-family="Arial Black, sans-serif" font-size="22" fill="#fff" stroke="#2b2b2b" stroke-width="1.5">z</text><text x="174" y="62" font-family="Arial Black, sans-serif" font-size="16" fill="#fff" stroke="#2b2b2b" stroke-width="1.2">z</text></svg>`;
  // bedtime's picture: a sleepy star tucked under a blanket
  const SLEEPY = `<svg viewBox="0 0 200 160"><path d="M100 14 L118 52 L160 56 L128 84 L138 126 L100 104 L62 126 L72 84 L40 56 L82 52 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="7" stroke-linejoin="round"/>` +
    `<path d="M80 74 Q88 81 96 74 M104 74 Q112 81 120 74" fill="none" stroke="#2b2b2b" stroke-width="5" stroke-linecap="round"/>` +
    `<ellipse cx="76" cy="88" rx="7" ry="4.5" fill="#ff8fab"/><ellipse cx="124" cy="88" rx="7" ry="4.5" fill="#ff8fab"/>` +
    `<path d="M24 112 Q100 92 176 112 L176 146 Q100 156 24 146 Z" fill="#8ecae6" stroke="#2b2b2b" stroke-width="7" stroke-linejoin="round"/>` +
    `<path d="M24 118 Q100 100 176 118" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>` +
    `<text x="150" y="40" font-family="Arial Black, sans-serif" font-size="24" fill="#fff" stroke="#2b2b2b" stroke-width="1.5">z</text><text x="168" y="22" font-family="Arial Black, sans-serif" font-size="17" fill="#fff" stroke="#2b2b2b" stroke-width="1.2">z</text></svg>`;
  let wall = null, wallKind = '';
  // while the wall is up, keys don't reach the game underneath
  const eatKeys = (e) => { if (wall && !wall.contains(e.target)) { e.stopPropagation(); e.preventDefault(); } };
  function showWall(kind = 'time') {
    if (wall && wallKind === kind) return;
    if (wall) hideWall();
    wallKind = kind;
    const bed = kind === 'bed';
    if (window.__game && window.__game.pause) { try { window.__game.pause(); } catch (e) { /* skip */ } }   // kit games: pause
    try { if (Arcade.audio.master) Arcade.audio.master.gain.value = 0; } catch (e) { /* skip */ }           // and hush
    wall = Arcade.h('div', bed ? { class: 'pa-wall pa-night', 'data-bedtime': '1', role: 'dialog', 'aria-label': 'Time for bed' }
      : { class: 'pa-wall', 'data-timeup': '1', role: 'dialog', 'aria-label': 'All done for today' });
    const box = Arcade.h('div', { class: 'pa-wallbox' }, bed
      ? `<div class="pa-moon">${SLEEPY}</div><h1>Time for bed!</h1><p>Good night! See you in the morning.</p>`
      : `<div class="pa-moon">${MOON}</div><h1>All done for today!</h1><p>See you tomorrow!</p>`);
    if (WHERE !== 'hub') {
      const home = Arcade.h('a', { class: 'pa-home', href: ROOT + 'index.html', 'aria-label': 'Arcade' }, Arcade.icons.home);
      box.appendChild(home);
    }
    box.appendChild(holdButton('Grown-ups: ' + MORE_MIN + ' more minutes', () => { if (bed) stayUp(); else giveMore(); hideWall(); checkLimit(); }));
    wall.appendChild(box);
    document.body.appendChild(wall);
    addEventListener('keydown', eatKeys, true);
  }
  function hideWall() {
    if (!wall) return;
    wall.remove(); wall = null; wallKind = '';
    removeEventListener('keydown', eatKeys, true);
    try { Arcade.audio.applyVolumes(); } catch (e) { /* skip */ }
  }
  // bedtime first (it's the one that lasts till morning), then the daily minutes
  function checkLimit() { if (!COUNTED) return; if (isBedtime()) showWall('bed'); else if (isOver()) showWall('time'); else hideWall(); }

  // ---- the clock: every 5 seconds the page is showing ----
  function tick() {
    if (!COUNTED || document.hidden) return;
    if (wall) { if (wallKind === 'time' && isBedtime()) showWall('bed'); return; }   // (time's up turning into bedtime)
    add(TICK);
    checkLimit();
  }
  setInterval(tick, TICK * 1000);
  // (the body isn't there yet while the scripts in <head>/<body> run)
  if (document.body) checkLimit(); else addEventListener('DOMContentLoaded', checkLimit);
  addEventListener('pageshow', checkLimit);

  // ---- looks ----
  document.head.appendChild(Arcade.h('style', {}, `
    .pa-hold { display: inline-flex; align-items: center; gap: 10px; padding: 6px 18px 6px 6px; min-height: 72px; border-radius: 999px;
      border: 4px solid #2b2b2b; background: #fff; color: #2b2b2b; font: inherit; cursor: pointer; touch-action: none; user-select: none;
      -webkit-user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; box-shadow: 0 5px 0 rgba(0,0,0,0.3); }
    .pa-hold.holding { transform: translateY(3px); box-shadow: 0 2px 0 rgba(0,0,0,0.3); }
    .pa-ring { position: relative; width: 60px; height: 60px; flex: none; display: block; }
    .pa-ring > svg { width: 60px; height: 60px; display: block; }
    .pa-lock { position: absolute; inset: 13px; display: block; }
    .pa-lock svg { width: 100%; height: 100%; display: block; }
    .pa-text { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.15; text-align: left; }
    .pa-text b { font-size: 18px; }
    .pa-text small { font-size: 14px; opacity: 0.7; font-weight: 700; }
    .pa-wall { position: fixed; inset: 0; z-index: 99999; display: grid; place-items: center; padding: 16px; box-sizing: border-box;
      background: radial-gradient(circle at 50% 30%, #4b3aa8 0, #241a5c 70%); color: #fff; overflow: auto; }
    .pa-night { background: radial-gradient(circle at 50% 30%, #23407a 0, #0f1d3d 70%); }
    .pa-wallbox { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; max-width: 520px; }
    .pa-moon { width: min(46vw, 34vh, 260px); animation: paFloat 2.4s ease-in-out infinite alternate; }
    .pa-moon svg { width: 100%; display: block; }
    .pa-wallbox h1 { margin: 0; font-family: 'Lilita One', 'Arial Black', sans-serif; font-weight: 400; font-size: clamp(28px, 6vw, 52px); color: #ffd166;
      text-shadow: 3px 3px 0 #2b2b2b, -2px -2px 0 #2b2b2b, 2px -2px 0 #2b2b2b, -2px 2px 0 #2b2b2b; }
    .pa-wallbox p { margin: 0 0 6px; font-size: clamp(18px, 3.4vw, 26px); font-weight: 800; }
    .pa-home { width: 76px; height: 76px; border-radius: 50%; border: 5px solid #2b2b2b; background: #fff; display: grid; place-items: center; box-shadow: 0 6px 0 rgba(0,0,0,0.35); }
    .pa-home svg { width: 46px; height: 46px; }
    @keyframes paFloat { to { transform: translateY(-10px) rotate(3deg); } }
    @media (prefers-reduced-motion: reduce) { .pa-moon { animation: none; } }
    @media (max-height: 430px) { .pa-wallbox { flex-direction: row; flex-wrap: wrap; justify-content: center; } .pa-wallbox h1, .pa-wallbox p { width: 100%; } .pa-moon { width: 110px; order: -1; } }
  `));

  Arcade.parent = {
    where: WHERE, load, save, today, add, total, allowed, isOver, giveMore, holdButton, open, checkLimit,
    bedtime, isBedtime, stayUp, clock, nowMin, night, WAKE,
    // drawing quality for the kit: true = draw fewer pixels (old tablets)
    lite() { const d = load(); return d.gfx === 'fast' || (d.gfx !== 'sharp' && !!d.slow); },
    // the kit calls this when it measures slow frames
    markSlow() { const d = load(); if (!d.slow) { d.slow = true; save(d); } },
    // Calm motion: 'auto' (calm only when the device asks for less motion) or 'calm' (always)
    setMotion(v) { const d = load(); d.motion = v === 'calm' ? 'calm' : 'auto'; save(d); if (Arcade.calm && Arcade.calm.refresh) Arcade.calm.refresh(); },
    deviceCalm() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } },
    _tick: tick, MORE_MIN, KEEP_DAYS,
  };
})();
