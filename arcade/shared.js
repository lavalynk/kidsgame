// =====================================================================
// Arcade kit — shared by every game in the arcade.
//
// A game page loads ../css/style.css, ../arcade/shared.css and this file,
// then calls Arcade.start({...}) with its own setup / update / draw.
// The kit takes care of everything games have in common:
//
//   * a steady game loop (fixed 1/120 s steps, so physics is the same on
//     every device) that stops while a menu is open or the tab is hidden
//   * a letterboxed canvas: the game always draws in its own "view" size
//     (e.g. 960 x 540) and the kit scales it to fit any screen
//   * keyboard, mouse and touch input (+ big on-screen buttons on tablets)
//   * Easy / Normal / Challenge difficulty
//   * pause / resume / restart, back to the arcade
//   * how-to-play intro, level picker, results screen with stars & medals
//   * sound effects and chiptune music made in the browser (no files),
//     with volume sliders and mute
//   * saving progress, best scores, medals and unlocks on this device
//   * particles and a few drawing helpers
//
// See bike/bike.js for a complete example game.
// =====================================================================
(function () {
  'use strict';

  const STEP = 1 / 120;          // physics step in seconds

  // Phones (Keith, Nov 5): everything uses only 90% of the screen, leaving a
  // 5% border all round, so nothing hides under rounded corners, the notch or
  // the edge of a phone case. CSS reads the 'ar-phone' class (see shared.css).
  const isPhone = () => {
    try { return matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height, innerWidth, innerHeight) <= 600; }
    catch (e) { return false; }
  };
  const PHONE_FIT = 0.9;
  // Shrink a whole menu panel evenly. CSS 'zoom' does it best (the panel really gets smaller, so it
  // centers and scrolls right); a few older phone browsers don't know 'zoom', so they get a scaled
  // picture of the panel instead (transform), with a negative margin to give back the room it saved.
  // ---- Bouncy menus (Nov 20): GSAP (arcade/gsap.min.js, see arcade/LIBRARIES.md) makes menus pop in
  // with their tiles and buttons bouncing in one after another, and buttons squish when you press them.
  // Without GSAP (or when the device asks for less motion) menus simply appear, like before.
  // ---- Calm motion (Nov 22, accessibility pass): fewer things moving on the screen. ON when the device asks for
  // less motion (its own "reduce motion" setting) OR when a grown-up picks "Calm" in the Parent corner (This device ->
  // Motion; saved as `motion: 'calm'` in localStorage 'kidsArcade.parent', see arcade/parent.js). Calm means: menus
  // just appear (no bounces), no pulsing / floating / hopping pictures, no confetti, no screen shake in the games
  // (Arcade.shakeK() = 0), and CSS animations + transitions stop (html.ar-calm in css/style.css). The games themselves
  // still move, of course: only the extra wobble goes.
  let calmMemo = null, calmAt = -1e9;      // (asked every frame by games with a shake: look it up once a second)
  function calm() {
    const now = Date.now();
    if (calmMemo !== null && now - calmAt < 1000) return calmMemo;
    calmAt = now;
    try {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return (calmMemo = true);
      const d = JSON.parse(localStorage.getItem('kidsArcade.parent') || 'null');
      return (calmMemo = !!(d && d.motion === 'calm'));
    } catch (e) { return (calmMemo = false); }
  }
  // the Parent corner calls this after changing the setting: look again now, and set html.ar-calm to match
  calm.refresh = () => { calmMemo = null; document.documentElement.classList.toggle('ar-calm', calm()); };
  // how much screen shake a game should use: 1 = normal, 0 = calm (games multiply their shake by this)
  const shakeK = () => calm() ? 0 : 1;
  // Speed counters (Nov 24, point 9): how often the game picture (draws) and the Phaser menu (menuFrames) were
  // drawn. tests/test_speed.py reads them to check that a paused game or a still menu isn't busy for nothing.
  const perf = window.__arcadePerf = { frames: 0, draws: 0, menuFrames: 0 };   // (frames = the kit loop's turns)
  if (calm()) document.documentElement.classList.add('ar-calm');
  const GS = (() => { try { return window.gsap && !calm() ? window.gsap : null; } catch (e) { return null; } })();
  if (GS) document.documentElement.classList.add('ar-gsap');
  const POP_KIDS = '.ar-tile, .ar-nesitem, .ar-btns > .ar-btn, .ar-step, .card';
  function popIn(root) {
    if (!GS || !root || calm()) return;
    if (root.classList.contains('ar-panel') && !root.style.transform) {
      GS.fromTo(root, { scale: 0.9, y: 16, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.26, ease: 'back.out(1.7)', clearProps: 'transform,opacity' });
    }
    const kids = [...root.querySelectorAll(POP_KIDS)].slice(0, 40);
    if (kids.length) GS.fromTo(kids, { y: 10, scale: 0.94, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, duration: 0.24, ease: 'back.out(2.2)', delay: 0.03, stagger: Math.min(0.03, 0.18 / kids.length), clearProps: 'transform,opacity' });
  }
  // squish: press = the button sinks and its picture + words get a little smaller, let go = boing back.
  // (Nov 20, Keith: "the buttons don't seem to be responding too well". The first version shrank the whole
  //  button, so a tap near its edge ended OUTSIDE the shrunken button and didn't count. Now the button itself
  //  never changes size: only what's inside it squishes, plus a "pressed" look (.ar-pressed in shared.css).)
  const SQUISH = '.ar-tile, .ar-btn, .round-btn, .ar-nesitem .ic, .ar-corner, .ar-tapstart, .tab, .item, .slot, .rm, .card';
  if (GS) {
    addEventListener('pointerdown', (e) => {
      const b = e.target.closest && e.target.closest(SQUISH);
      if (!b || b.closest('.ar-pad')) return;
      const inside = [...b.children].filter(k => !k.classList.contains('lock'));
      b.classList.add('ar-pressed');
      if (inside.length) GS.to(inside, { scale: 0.88, duration: 0.08, ease: 'power2.out', overwrite: 'auto' });
      const up = () => { removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
        b.classList.remove('ar-pressed');
        if (inside.length) GS.to(inside, { scale: 1, duration: 0.45, ease: 'elastic.out(1.1, 0.4)', overwrite: 'auto', clearProps: 'transform' }); };
      addEventListener('pointerup', up); addEventListener('pointercancel', up);
    }, true);
  }

  const ZOOM_OK = (() => { try { return CSS.supports('zoom', '0.5'); } catch (e) { return false; } })();
  function setZoom(el, k) {
    if (ZOOM_OK) { el.style.zoom = k === 1 ? '' : (+k).toFixed(3); return; }
    el.style.transform = k === 1 ? '' : `scale(${(+k).toFixed(3)})`;
    el.style.transformOrigin = 'top center';
    el.style.marginBottom = k === 1 ? '' : `${-(1 - k) * el.offsetHeight}px`;
  }
  if (isPhone()) document.documentElement.classList.add('ar-phone');

  // Offline play: start the service worker (../sw.js, next to the arcade's index.html).
  // It saves every game on the device so they open with no internet. (Only works from
  // a web address like GitHub Pages, not when index.html is opened as a file.)
  const ROOT = new URL('..', document.currentScript ? document.currentScript.src : location.href);
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    addEventListener('load', () => navigator.serviceWorker.register(new URL('sw.js', ROOT).href, { scope: ROOT.href }).catch(() => { /* no offline, still fine */ }));
    // A new version arrived while this page was open (Keith, Nov 21: the hub still showed the old Daily Surprise row):
    // the new service worker takes over, and on the HUB we reload once at once so the new version shows. (Not inside a
    // game: that would stop a round; the next page opened is the new one anyway. Not on the very first visit: then
    // there was no old version.)
    // (Nov 23, Keith: "it opens this screen, then for some reason it reloads". Pages come from the internet first, so
    //  the hub on screen is usually ALREADY the new version: then there's nothing to reload. We only reload when the
    //  page on screen is older than the new service worker: its own ?v= (from this script's address) differs from
    //  the VERSION written in sw.js. Offline, the check can't run, and we don't reload.)
    const hadWorker = !!navigator.serviceWorker.controller;
    const myVersion = document.currentScript ? new URL(document.currentScript.src).searchParams.get('v') : '';
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadWorker || reloaded || !myVersion) return;
      const hub = new URL('.', location.href).href === ROOT.href;
      if (!hub) return;
      fetch(new URL('sw.js', ROOT).href, { cache: 'no-store' }).then(r => r.text()).then(txt => {
        const m = /const VERSION = '(\d+)'/.exec(txt);
        if (!m || m[1] === myVersion || reloaded) return;                 // already the newest: stay put
        if (window.ArcadeMenus && ArcadeMenus.screen && ArcadeMenus.isOpen && ArcadeMenus.screen() !== 'hub') return;
        reloaded = true; location.reload();
      }).catch(() => { /* offline: keep what's on screen */ });
    });
  }
  // Launched from the home screen? (Then there's no browser bar: games use the whole screen.)
  const standalone = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
  if (standalone) document.documentElement.classList.add('ar-app');
  // ...and as an app, ask the browser to never clear the saves (stickers, house, progress) to free up space
  if (standalone && navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  const SAVE_KEY = 'kidsArcade.v1';

  // ------------------------------------------------------------------
  // Saving (localStorage, wrapped so the game still works without it)
  // ------------------------------------------------------------------
  // ------------------------------------------------------------------
  // Players (profiles): each kid gets their own avatar, name and saves.
  //
  // The list of players lives under 'kidsArcade.profiles'. Every save key
  // (arcade, coloring, maze) gets the player's id added to its name, so
  // kids never mix up stars, stickers, unlocks or favorites:
  //     kidsArcade.v1        <- player 1 (the saves from before players existed)
  //     kidsArcade.v1.p2     <- player 2
  // Sound volume is shared by everyone on the device ('kidsArcade.sound').
  // ------------------------------------------------------------------
  const PROFILES_KEY = 'kidsArcade.profiles';
  const SOUND_KEY = 'kidsArcade.sound';
  const BASE_KEYS = ['kidsArcade.v1', 'kidsColoring.v1', 'kidsMaze.v1'];   // every save the arcade makes
  // Avatar animals: simple original faces on a colored circle (100 x 100 box).
  const AV = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
  const avEyes = (y = 50, dx = 13) => `<circle cx="${50 - dx}" cy="${y}" r="6" fill="#2b2b2b"/><circle cx="${50 + dx}" cy="${y}" r="6" fill="#2b2b2b"/><circle cx="${52 - dx}" cy="${y - 2}" r="2" fill="#fff"/><circle cx="${52 + dx}" cy="${y - 2}" r="2" fill="#fff"/>`;
  const avSmile = (y = 64) => `<path d="M42 ${y} Q50 ${y + 7} 58 ${y}" fill="none" ${AV}/>`;
  const avCheeks = (y = 62) => `<ellipse cx="27" cy="${y}" rx="6" ry="4" fill="#ff8fab"/><ellipse cx="73" cy="${y}" rx="6" ry="4" fill="#ff8fab"/>`;
  const AVATARS = {
    cat:   `<path d="M22 40 L26 14 L44 28 Z M78 40 L74 14 L56 28 Z" fill="#ffb347" ${AV}/><circle cx="50" cy="54" r="30" fill="#ffb347" ${AV}/>${avEyes()}${avCheeks()}<path d="M46 58 L54 58 L50 62 Z" fill="#ef476f"/>${avSmile(65)}`,
    dog:   `<circle cx="50" cy="52" r="30" fill="#e0b984" ${AV}/><path d="M24 30 C10 34 12 62 22 64 C30 58 30 40 24 30 Z M76 30 C90 34 88 62 78 64 C70 58 70 40 76 30 Z" fill="#8d5524" ${AV}/>${avEyes(48)}<ellipse cx="50" cy="60" rx="7" ry="5" fill="#2b2b2b"/>${avSmile(67)}`,
    bunny: `<ellipse cx="38" cy="22" rx="8" ry="20" fill="#fff" ${AV}/><ellipse cx="62" cy="22" rx="8" ry="20" fill="#fff" ${AV}/><circle cx="50" cy="58" r="28" fill="#fff" ${AV}/>${avEyes(54)}${avCheeks(66)}<circle cx="50" cy="63" r="3" fill="#ef476f"/>${avSmile(68)}`,
    frog:  `<circle cx="32" cy="32" r="13" fill="#7bd389" ${AV}/><circle cx="68" cy="32" r="13" fill="#7bd389" ${AV}/><ellipse cx="50" cy="60" rx="34" ry="26" fill="#7bd389" ${AV}/><circle cx="32" cy="32" r="6" fill="#2b2b2b"/><circle cx="68" cy="32" r="6" fill="#2b2b2b"/><circle cx="34" cy="30" r="2" fill="#fff"/><circle cx="70" cy="30" r="2" fill="#fff"/>${avCheeks(64)}<path d="M34 64 Q50 78 66 64" fill="none" ${AV}/>`,
    chick: `<circle cx="50" cy="54" r="32" fill="#ffd166" ${AV}/><path d="M44 22 Q48 10 52 22 Q56 12 58 24" fill="none" ${AV}/>${avEyes(48)}${avCheeks(60)}<path d="M42 58 L58 58 L50 68 Z" fill="#ff8c42" ${AV}/>`,
    fox:   `<path d="M18 50 L22 14 L46 34 Z M82 50 L78 14 L54 34 Z" fill="#ff7b39" ${AV}/><path d="M18 46 C18 30 82 30 82 46 C82 70 62 86 50 86 C38 86 18 70 18 46 Z" fill="#ff7b39" ${AV}/><path d="M28 60 C36 62 44 70 50 86 C56 70 64 62 72 60 C66 78 34 78 28 60 Z" fill="#fff" ${AV}/>${avEyes(50)}<ellipse cx="50" cy="70" rx="5" ry="4" fill="#2b2b2b"/>`,
    mouse: `<circle cx="24" cy="30" r="17" fill="#c9c9d6" ${AV}/><circle cx="76" cy="30" r="17" fill="#c9c9d6" ${AV}/><circle cx="24" cy="30" r="8" fill="#ff8fab"/><circle cx="76" cy="30" r="8" fill="#ff8fab"/><circle cx="50" cy="56" r="28" fill="#c9c9d6" ${AV}/>${avEyes(52)}${avCheeks(64)}<circle cx="50" cy="62" r="4" fill="#ef476f"/>${avSmile(67)}`,
    owl:   `<path d="M22 30 L30 16 L40 26 M78 30 L70 16 L60 26" fill="none" ${AV}/><ellipse cx="50" cy="54" rx="32" ry="34" fill="#a47148" ${AV}/><circle cx="37" cy="46" r="13" fill="#fff" ${AV}/><circle cx="63" cy="46" r="13" fill="#fff" ${AV}/>${avEyes(46)}<path d="M45 58 L55 58 L50 68 Z" fill="#ffd166" ${AV}/><path d="M34 74 Q50 82 66 74" fill="none" stroke="#2b2b2b" stroke-width="3"/>`,
  };
  const AVATAR_COLORS = ['#ef476f', '#4cc9f0', '#06d6a0', '#ffd166', '#9b5de5', '#ff8c42'];
  const profiles = {
    _list: null,
    // all players: [{ id, name, pet, color }]
    list() {
      if (this._list) return this._list;
      let d = null;
      try { d = JSON.parse(localStorage.getItem(PROFILES_KEY)); } catch (e) { d = null; }
      if (!d || !Array.isArray(d.list) || !d.list.length) d = { active: 'p1', list: [{ id: 'p1', name: '', pet: 'cat', color: '#ef476f' }] };
      this._list = d.list; this._active = d.active;
      if (!d.list.some(p => p.id === d.active)) this._active = d.list[0].id;
      return this._list;
    },
    _write() { try { localStorage.setItem(PROFILES_KEY, JSON.stringify({ active: this._active, list: this._list })); } catch (e) { /* skip */ } },
    active() { const l = this.list(); return l.find(p => p.id === this._active) || l[0]; },
    // switch player: the next store.load() reads that player's saves
    use(id) {
      if (!this.list().some(p => p.id === id)) return;
      this._active = id; this._write();
      store.data = null;
    },
    add(fields) {
      const l = this.list();
      let n = 2; while (l.some(p => p.id === 'p' + n)) n++;     // p1 always exists first, so new ones are p2, p3...
      const p = Object.assign({ id: 'p' + n, name: '', pet: 'dog', color: '#4cc9f0' }, fields);
      l.push(p); this._write();
      return p;
    },
    update(id, fields) { const p = this.list().find(q => q.id === id); if (p) { Object.assign(p, fields); this._write(); } },
    // Age preset: 'little' (about 3-5) or 'big' (about 6-10, the normal game).
    // Little kids get every game on Easy, racing/action games run a bit slower
    // (config.littleSpeed) and each game can add its own extra help (g.little).
    age(p) { p = p || this.active(); return p.age === 'little' ? 'little' : 'big'; },
    little(p) { return this.age(p) === 'little'; },
    // "One thumb" touch buttons (Nov 23, new plan point 4, part 2): fewer on-screen buttons and the
    // game helps more (see config.oneThumb in start()). `thumb` = true (one thumb) / false (all the
    // buttons) / not set = it follows the age: little kids get one thumb.
    oneThumb(p) { p = p || this.active(); return p.thumb != null ? !!p.thumb : this.little(p); },
    // delete a player AND all their saves (never the last player)
    remove(id) {
      const l = this.list();
      if (l.length < 2) return false;
      for (const base of BASE_KEYS) { try { localStorage.removeItem(this.key(base, id)); } catch (e) { /* skip */ } }
      this._list = l.filter(p => p.id !== id);
      if (this._active === id) { this._active = this._list[0].id; store.data = null; }
      this._write();
      return true;
    },
    // the save name for this player: player 1 keeps the old names (so old progress stays theirs)
    key(base, id) { id = id || this.active().id; return id === 'p1' ? base : base + '.' + id; },
    // the avatar picture as an <svg>
    avatar(p, size) {
      p = p || this.active();
      return `<svg viewBox="0 0 100 100" ${size ? `width="${size}" height="${size}"` : ''} aria-hidden="true"><circle cx="50" cy="50" r="48" fill="${p.color}"/>${AVATARS[p.pet] || AVATARS.cat}</svg>`;
    },
    pets: Object.keys(AVATARS),
    colors: AVATAR_COLORS,
  };

  const store = {
    data: null,
    load() {
      if (this.data) return this.data;
      let d = null;
      try { d = JSON.parse(localStorage.getItem(profiles.key(SAVE_KEY))); } catch (e) { d = null; }
      this.data = Object.assign({ settings: {}, games: {}, favorites: [], recent: [] }, d || {});
      // Sound effects volume and "all sound off" are shared by everyone on this device.
      // Music (on/off + volume) and difficulty belong to each player.
      let sound = null;
      try { sound = JSON.parse(localStorage.getItem(SOUND_KEY)); } catch (e) { sound = null; }
      sound = sound || {};
      const shared = {};
      if (sound.sfx != null) shared.sfx = sound.sfx;
      if (sound.muted != null) shared.muted = sound.muted;
      this.data.settings = Object.assign(
        { difficulty: 'normal', sfx: 0.8, music: sound.music != null ? sound.music : 0.4, musicOn: true, muted: false },
        this.data.settings, shared);
      return this.data;
    },
    save() {
      if (window.Arcade && window.Arcade.demoOn) return;   // (the "Show me" demo never saves; see start())
      try {
        localStorage.setItem(profiles.key(SAVE_KEY), JSON.stringify(this.data));
        const s = this.data.settings;
        localStorage.setItem(SOUND_KEY, JSON.stringify({ sfx: s.sfx, muted: s.muted }));
      } catch (e) { /* private mode etc. */ }
    },
    settings() { return this.load().settings; },
    // Per-game record: { levels: {id: {score, stars, medal, time}}, best, unlocked: [], data: {} }
    game(id) {
      const g = this.load().games;
      g[id] = Object.assign({ levels: {}, best: 0, unlocked: [], data: {}, achievements: [] }, g[id] || {});
      return g[id];
    },
    // this player's favorite games (hub hearts)
    isFavorite(id) { return this.load().favorites.includes(id); },
    toggleFavorite(id) {
      const f = this.load().favorites, i = f.indexOf(id);
      if (i < 0) f.push(id); else f.splice(i, 1);
      this.save();
      return i < 0;
    },
    // this player's recently played games, newest first (the hub's "play again" row)
    recent() { return this.load().recent.slice(); },
    markPlayed(id) {
      const r = this.load().recent.filter(x => x !== id);
      r.unshift(id);
      this.data.recent = r.slice(0, 4);    // only the last few matter
      this.save();
    },
  };

  // make text safe to put inside HTML (player names are typed in by people)
  function escapeHTML(t) { return String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  const MEDAL_RANK = { bronze: 1, silver: 2, gold: 3 };

  // ------------------------------------------------------------------
  // Sound: tiny synthesizer + music loops (Web Audio, made on the fly)
  // ------------------------------------------------------------------
  const audio = {
    ctx: null, master: null, sfxGain: null, musicGain: null,
    ensure() {
      if (this.ctx) return this.ctx;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.build(new AC());
      } catch (e) { this.ctx = null; }
      return this.ctx;
    },
    // build the mixing desk (volume knobs, reverb, limiter) on an audio context
    build(ctx) {
      {
        this.ctx = ctx;
        this.master = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain.connect(this.master);
        this.musicGain.connect(this.master);
        // a gentle limiter at the very end so loud moments never crackle
        this.limiter = this.ctx.createDynamicsCompressor();
        this.limiter.threshold.value = -6; this.limiter.ratio.value = 12; this.limiter.attack.value = 0.003; this.limiter.release.value = 0.15;
        this.master.connect(this.limiter).connect(this.ctx.destination);
        // Reverb: makes everything sound like it's in a room instead of "dry".
        // We build the room echo ourselves: a short burst of noise that fades away.
        this.verb = this.ctx.createConvolver();
        this.verb.buffer = this.makeRoom(1.8, 2.6);
        this.sfxVerb = this.ctx.createGain(); this.sfxVerb.gain.value = 0.22;
        this.sfxVerb.connect(this.verb);
        this.verbOut = this.ctx.createGain(); this.verbOut.gain.value = 0.5;
        this.verb.connect(this.verbOut).connect(this.master);
        this.sfxGain.connect(this.sfxVerb);
        this.applyVolumes();
      }
    },
    applyVolumes() {
      if (!this.ctx) return;
      const s = store.settings();
      this.master.gain.value = s.muted ? 0 : 1;
      this.sfxGain.gain.value = s.sfx * 0.7;
      this.musicGain.gain.value = s.musicOn === false ? 0 : s.music * 0.7;   // each player can switch music off
    },
    resume() { const c = this.ensure(); if (c && c.state === 'suspended') c.resume(); },
    // The "room" for the reverb: stereo noise that fades out over `secs` seconds.
    makeRoom(secs, decay) {
      const c = this.ctx, n = Math.floor(c.sampleRate * secs), b = c.createBuffer(2, n, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = b.getChannelData(ch);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
      }
      return b;
    },
    // Make a sound "node" go left or right (-1 .. 1). Old browsers without panners just skip it.
    pan(node, x) {
      if (!this.ctx.createStereoPanner) return node;
      const p = this.ctx.createStereoPanner(); p.pan.value = x; node.connect(p); return p;
    },

    // One note. freq in Hz, len in seconds; slide = end frequency.
    tone(freq, len = 0.15, opts = {}) {
      const c = this.ensure(); if (!c) return;
      const t = c.currentTime + (opts.delay || 0);
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = opts.type === 'saw' ? 'sawtooth' : (opts.type || 'square');
      o.frequency.setValueAtTime(freq, t);
      if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slide), t + len);
      if (opts.vib) {                       // wobbly pitch (cartoon boings, sad trombones)
        const lfo = c.createOscillator(), lg = c.createGain();
        lfo.frequency.value = opts.vibRate || 9; lg.gain.value = freq * opts.vib;
        lfo.connect(lg).connect(o.frequency); lfo.start(t); lfo.stop(t + len + 0.05);
      }
      const v = opts.vol == null ? 0.3 : opts.vol;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + (opts.attack || 0.006));
      g.gain.setValueAtTime(v, t + Math.max(opts.attack || 0.006, len * (opts.hold || 0.25)));
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      let out = o.connect(g);
      if (opts.filter) {                    // soften harsh waves
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = opts.filter; out = out.connect(f);
      }
      if (opts.pan) out = this.pan(out, opts.pan);
      out.connect(opts.music ? this.musicGain : this.sfxGain);
      o.start(t); o.stop(t + len + 0.02);
    },
    // Short burst of noise (crashes, splashes, whooshes).
    noise(len = 0.25, opts = {}) {
      const c = this.ensure(); if (!c) return;
      const t = c.currentTime + (opts.delay || 0);
      const n = Math.floor(c.sampleRate * len);
      const buf = c.createBuffer(1, n, c.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      src.buffer = buf;
      const f = c.createBiquadFilter();
      f.type = opts.filter || 'lowpass';
      f.frequency.setValueAtTime(opts.freq || 1200, t);
      if (opts.sweep) f.frequency.exponentialRampToValueAtTime(opts.sweep, t + len);   // whooshes go up or down
      if (opts.q) f.Q.value = opts.q;
      const g = c.createGain();
      g.gain.setValueAtTime(opts.vol == null ? 0.3 : opts.vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      src.connect(f).connect(g).connect(this.sfxGain);
      src.start(t);
    },
    // Ready-made sound effects. Games call Arcade.sfx('jump') etc.
    sfx(name) {
      // Each sound is a few layers played together: a main tone, a soft body
      // underneath, a bit of noise for texture, and a sparkle on top. They all
      // go through the room reverb a little, so they sound round instead of beepy.
      const T = (f, l, o) => this.tone(f, l, o);
      const N = (l, o) => this.noise(l, o);
      const arp = (notes, gap, o) => notes.forEach((f, i) => T(f, o.len || 0.14, Object.assign({}, o, { delay: (o.delay || 0) + i * gap })));
      switch (name) {
        case 'click':  T(880, 0.05, { type: 'triangle', vol: 0.2 }); T(1760, 0.03, { type: 'sine', vol: 0.08 }); break;
        case 'tick':   T(1600, 0.025, { type: 'triangle', vol: 0.1 }); break;
        case 'select': T(660, 0.06, { type: 'square', vol: 0.1, filter: 2400 }); T(990, 0.08, { type: 'square', vol: 0.1, filter: 2400, delay: 0.05 }); break;
        case 'back':   T(660, 0.06, { type: 'square', vol: 0.1, filter: 2000 }); T(440, 0.09, { type: 'square', vol: 0.1, filter: 2000, delay: 0.05 }); break;
        case 'jump':   T(320, 0.2, { slide: 820, type: 'square', vol: 0.13, filter: 3000 }); T(160, 0.16, { slide: 410, type: 'sine', vol: 0.18 }); break;
        case 'land':   T(140, 0.09, { slide: 60, type: 'sine', vol: 0.3 }); N(0.06, { freq: 600, vol: 0.12 }); break;
        case 'step':   N(0.03, { filter: 'bandpass', freq: 900, vol: 0.08 }); break;
        case 'spring': T(220, 0.38, { slide: 1300, type: 'triangle', vol: 0.28, vib: 0.06, vibRate: 22 }); T(440, 0.3, { slide: 2600, type: 'sine', vol: 0.08 }); break;
        case 'coin':   T(988, 0.07, { type: 'square', vol: 0.2, filter: 4500 }); T(1319, 0.28, { delay: 0.06, type: 'square', vol: 0.2, filter: 4500 });
                       T(2637, 0.2, { delay: 0.06, type: 'sine', vol: 0.06 }); break;
        case 'star':   arp([1047, 1319, 1568, 2093, 2637], 0.045, { type: 'triangle', vol: 0.2, len: 0.22 });
                       arp([2093, 2637, 3136], 0.06, { type: 'sine', vol: 0.05, len: 0.3, delay: 0.1, pan: 0.4 }); break;
        case 'pop':    T(420, 0.07, { slide: 1500, type: 'sine', vol: 0.35 }); N(0.04, { filter: 'highpass', freq: 3500, vol: 0.18 }); T(1800, 0.05, { type: 'sine', vol: 0.06, delay: 0.03 }); break;
        case 'hit':    T(220, 0.16, { slide: 80, type: 'square', vol: 0.16, filter: 1800 }); N(0.08, { freq: 1500, vol: 0.2 }); break;
        case 'hurt':   T(520, 0.12, { slide: 300, type: 'square', vol: 0.14, filter: 2200 }); T(390, 0.2, { slide: 200, type: 'square', vol: 0.14, filter: 2200, delay: 0.1 }); break;
        // game feel sounds (Nov 22, point 3)
        case 'sparkle': arp([1568, 2093, 2637], 0.035, { type: 'sine', vol: 0.12, len: 0.18, pan: 0.3 }); T(3136, 0.25, { delay: 0.1, type: 'sine', vol: 0.04 }); break;
        case 'poof':   N(0.22, { filter: 'bandpass', freq: 1400, sweep: 400, q: 0.8, vol: 0.22 }); T(600, 0.12, { slide: 1200, type: 'sine', vol: 0.12 }); T(1600, 0.08, { delay: 0.08, type: 'sine', vol: 0.06 }); break;
        case 'clang':  T(1240, 0.18, { type: 'triangle', vol: 0.16, vib: 0.01, vibRate: 40 }); T(1860, 0.12, { type: 'sine', vol: 0.08 }); N(0.03, { filter: 'highpass', freq: 3000, vol: 0.1 }); break;
        case 'thud':   T(90, 0.14, { slide: 45, type: 'sine', vol: 0.4 }); N(0.08, { freq: 400, vol: 0.14 }); break;
        case 'plink':  T(700 + Math.random() * 200, 0.07, { slide: 400, type: 'triangle', vol: 0.14 }); break;
        case 'bonk':   T(200, 0.22, { slide: 110, type: 'triangle', vol: 0.32, vib: 0.08, vibRate: 30 }); N(0.05, { freq: 900, vol: 0.15 }); break;
        case 'crash':  N(0.6, { freq: 1600, sweep: 300, vol: 0.4 }); T(150, 0.4, { slide: 45, type: 'sawtooth', vol: 0.14, filter: 800 }); T(90, 0.3, { slide: 40, type: 'sine', vol: 0.3 }); break;
        case 'shoot':  T(900, 0.1, { slide: 420, type: 'square', vol: 0.1, filter: 3500 }); N(0.05, { filter: 'highpass', freq: 4000, vol: 0.06 }); break;
        case 'zap':    T(1400, 0.14, { slide: 260, type: 'sawtooth', vol: 0.1, filter: 3000, vib: 0.05, vibRate: 40 }); break;
        case 'boost':  T(180, 0.45, { slide: 1000, type: 'sawtooth', vol: 0.12, filter: 2500 }); N(0.45, { filter: 'bandpass', freq: 600, sweep: 4000, vol: 0.15 }); break;
        case 'power':  arp([523, 659, 784, 1047, 1319, 1568], 0.04, { type: 'square', vol: 0.1, filter: 3500, len: 0.12 });
                       T(2093, 0.4, { delay: 0.24, type: 'triangle', vol: 0.12, vib: 0.01 }); break;
        case 'swish':  N(0.28, { filter: 'bandpass', freq: 1200, sweep: 5000, q: 1.5, vol: 0.28 }); break;
        case 'whoosh': N(0.3, { filter: 'bandpass', freq: 3500, sweep: 600, q: 1.2, vol: 0.22 }); break;
        case 'splash': N(0.55, { filter: 'bandpass', freq: 2200, sweep: 500, vol: 0.35 }); T(380, 0.22, { slide: 140, type: 'sine', vol: 0.15 });
                       for (let i = 0; i < 5; i++) T(900 + Math.random() * 1400, 0.06, { slide: 2600, type: 'sine', vol: 0.06, delay: 0.08 + i * 0.05, pan: Math.random() - 0.5 }); break;
        case 'beep':   T(880, 0.12, { type: 'square', vol: 0.12, filter: 3000 }); break;
        case 'go':     [784, 988, 1175].forEach(f => T(f, 0.45, { type: 'square', vol: 0.08, filter: 3200, hold: 0.6 })); T(392, 0.45, { type: 'triangle', vol: 0.2 }); break;
        case 'win': {  // a little fanfare with chords and a drum
          const ch = [[523, 659, 784], [587, 740, 880], [659, 831, 988], [784, 988, 1175, 1568]];
          ch.forEach((c3, i) => c3.forEach(f => T(f, i === 3 ? 0.9 : 0.16, { delay: i * 0.13, type: 'square', vol: 0.06, filter: 3500, hold: 0.7 })));
          [262, 294, 330, 392].forEach((f, i) => T(f, i === 3 ? 0.9 : 0.16, { delay: i * 0.13, type: 'triangle', vol: 0.18 }));
          N(0.5, { delay: 0.39, filter: 'highpass', freq: 5000, vol: 0.12 });
          break;
        }
        case 'aww':    T(392, 0.3, { slide: 370, type: 'sawtooth', vol: 0.2, filter: 1200, vib: 0.02 }); T(370, 0.3, { delay: 0.3, slide: 349, type: 'sawtooth', vol: 0.2, filter: 1200, vib: 0.02 });
                       T(349, 0.8, { delay: 0.6, slide: 262, type: 'sawtooth', vol: 0.2, filter: 1000, vib: 0.03, vibRate: 6 }); break;
        case 'unlock': arp([659, 784, 988, 1319, 1568], 0.07, { type: 'triangle', vol: 0.2, len: 0.25 });
                       for (let i = 0; i < 6; i++) T(2000 + i * 300, 0.2, { delay: 0.3 + i * 0.04, type: 'sine', vol: 0.04, pan: i % 2 ? 0.5 : -0.5 }); break;
        default: T(440, 0.1);
      }
    },

    // ---- Music: a little band made in the browser ----
    // A song is a short recipe (tempo, key, chords, drum style, instruments) plus a
    // hand-written tune. From it we build a whole song (intro, verses, choruses, a
    // bridge, a quiet breakdown and a last chorus in a higher key - see compose())
    // with drums, bass, chord pads, a sparkly arpeggio, the tune, a harmony voice and
    // a counter-melody. Games can steer it while you play (see setMood and stinger).
    songs: {
      // recipe fields:
      //   tempo, root (MIDI note of the key: 60 = middle C), scale ('major', 'minor', 'dorian'...)
      //   prog: chords per bar as scale steps 1-7: [verse, chorus, bridge] (4 bars each)
      //   tune: { A: verse, B: chorus, C: bridge } written as text (see parseTune). Without a
      //         tune, one is made up from the chords (seed picks which).
      //   drums, bass: a style name from DRUMS / BASS below
      //   lead: the tune's instrument; harmony: the second voice (chorus + bridge);
      //   lead2: the tune's instrument the second time round (default: harmony)
      //     instruments: 'square' 'saw' 'triangle' 'bell' (music box) 'flute' 'brass'
      //                  'steel' (steel drum) 'marimba' 'choir' ("oooh") 'uke' (ukulele) 'whistle' 'kazoo'
      //   pad: true | false | 'choir'  (soft chords underneath)
      //   arp: true | false | 'B' (chorus only); arpSound: 'marimba' | 'uke' | 'steel' (default: a soft pluck)
      //   swing (0-0.3), bells (sleigh bells), octave (move the tune up/down)
      happy:  { tempo: 124, root: 60, scale: 'major', prog: [[1, 5, 6, 4], [4, 5, 3, 6]], drums: 'disco', bass: 'octaves', lead: 'square', pad: true, arp: false, seed: 11 },
      race:   { tempo: 150, root: 57, scale: 'minor', prog: [[1, 6, 7, 5], [6, 7, 1, 1]], drums: 'rock', bass: 'eighths', lead: 'saw', pad: true, arp: true, seed: 23 },
      calm:   { tempo: 84, root: 65, scale: 'major', prog: [[1, 4, 6, 5], [4, 1, 2, 5]], drums: 'soft', bass: 'whole', lead: 'triangle', pad: true, arp: true, seed: 37 },
      // Space Defender: floaty "oooh" voices under a synth tune
      space:  { tempo: 108, root: 52, scale: 'minor', prog: [[1, 6, 3, 7], [4, 6, 7, 1], [4, 5, 6, 7]], drums: 'halftime', bass: 'pulse', lead: 'saw', harmony: 'choir', pad: 'choir', arp: true, seed: 41,
        tune: { A: '5/8 8/4 7/4 | 6/8 3/8 | 5/8 7/4 8/4 | 7/16',
                B: '8/6 6/2 4/8 | 8/6 10/2 6/8 | 9/6 7/2 11/8 | 8/16',
                C: '4/8 6/8 | 5/8 7/8 | 6/8 8/8 | 7/8 9/8' } },
      // The arcade hub (main screen): a bouncy, sunny marimba tune
      arcade: { tempo: 116, root: 62, scale: 'major', prog: [[1, 6, 4, 5], [4, 5, 3, 6], [6, 4, 2, 5]], drums: 'bubble', bass: 'bounce', lead: 'marimba', harmony: 'bell', pad: true, arp: 'B', arpSound: 'uke', seed: 61,
        tune: { A: '5/4 3/2 5/2 8/4 5/4 | 6/4 8/2 6/2 3/4 1/4 | 4/4 6/2 8/2 6/4 4/4 | 5/6 7/2 9/4 r/4',
                B: '8/4 8/2 8/2 11/4 10/4 | 9/4 9/2 9/2 12/4 9/4 | 10/4 7/2 10/2 12/4 10/4 | 8/8 6/4 r/4',
                C: '6/8 8/8 | 4/8 6/8 | 9/8 11/8 | 7/8 12/8' } },
      jungle: { tempo: 132, root: 55, scale: 'mixolydian', prog: [[1, 7, 4, 1], [4, 5, 1, 7]], drums: 'latin', bass: 'bounce', lead: 'square', pad: false, arp: true, seed: 53 },
    },
    // instruments & scales
    SCALES: {
      major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10],
      mixolydian: [0, 2, 4, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], harmonic: [0, 2, 3, 5, 7, 8, 11],
      pentatonic: [0, 2, 4, 7, 9, 12, 14],
    },
    DRUMS: {     // 16 steps per bar: K = kick, S = snare, C = clap, H = closed hat, O = open hat, s = shaker, B = bells
      rock:     { K: 'x.......x.x.....', S: '....x.......x...', H: 'x.x.x.x.x.x.x.x.' },
      disco:    { K: 'x...x...x...x...', C: '....x.......x...', O: '..x...x...x...x.', H: 'x...x...x...x...' },
      halftime: { K: 'x.........x.....', S: '........x.......', H: 'x.x.x.x.x.x.x.x.' },
      latin:    { K: 'x..x..x.x..x..x.', C: '....x.......x...', s: 'xxxxxxxxxxxxxxxx' },
      soft:     { K: 'x.......x.......', s: '..x...x...x...x.' },
      march:    { K: 'x.......x.......', S: '....x.......x...', B: 'x.x.x.x.x.x.x.x.' },
      punk:     { K: 'x.x.x.x.x.x.x.x.', S: '....x.......x...', H: 'xxxxxxxxxxxxxxxx' },
      bubble:   { K: 'x...x...x...x...', C: '....x.......x..x', H: '.xxx.xxx.xxx.xxx' },
      surf:     { K: 'x.....x...x.....', S: '....x.......x...', H: 'x.xxx.xxx.xxx.xx' },
      tribal:   { K: 'x..x..x...x..x..', S: '......x.......x.', s: 'x.xxx.xxx.xxx.xx' },
      boombap:  { K: 'x......x..x.....', S: '....x.......x...', H: 'x.x.x.x.x.x.x.xx' },
      shuffle:  { K: 'x.....x.x.....x.', S: '....x.......x...', H: 'x..x.xx..x.xx..x', B: '..............x.' },
      sleigh:   { K: 'x.......x.......', S: '....x.......x...', B: 'xxxxxxxxxxxxxxxx' },
    },
    BASS: {      // which 16th steps play, and which chord note (0 = root, 1 = fifth, 2 = octave)
      eighths: ['x.x.x.x.x.x.x.x.', '0000000000000000'],
      octaves: ['x.x.x.x.x.x.x.x.', '0202020202020202'],
      whole:   ['x...............', '0000000000000000'],
      pulse:   ['xxxxxxxxxxxxxxxx', '0000000000000000'],
      bounce:  ['x..x..x.x..x..x.', '0010010200100102'],
      walk:    ['x...x...x...x...', '0000100020001000'],
      offbeat: ['..x...x...x...x.', '0000000000000000'],
    },

    // ---- The music player ----
    // Every song plays on its own "track" (a volume knob of its own), so one song can
    // fade out while the next fades in. The mood (energy, tempo, key, muffle) lets a
    // game steer the music while you play: see setMood() and stinger() below.
    track: null, bus: null, current: null, musicTimer: null,
    mood: { energy: 1, tempo: 1, key: 0, muffle: 0 },
    // Make (once) the music effects: echo, a squeezer so it never gets too loud,
    // and a "muffle" filter (for caves and underwater) at the end.
    musicBus() {
      const c = this.ensure(); if (!c) return null;
      if (this.bus) return this.bus;
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -18; comp.ratio.value = 4;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 20000; lp.Q.value = 0.5;
      const duck = c.createGain();
      comp.connect(lp).connect(duck).connect(this.musicGain);
      const echo = c.createDelay(1); const fb = c.createGain(); const tone = c.createBiquadFilter(); const wet = c.createGain();
      tone.type = 'lowpass'; tone.frequency.value = 2400; fb.gain.value = 0.32; wet.gain.value = 0.35;
      echo.connect(tone).connect(fb).connect(echo); tone.connect(wet).connect(comp);
      const verb = c.createGain(); verb.gain.value = 0.6; verb.connect(this.verb);   // music shares the room reverb
      const sting = c.createGain(); sting.connect(comp);                            // stingers (little jingles) play here
      this.bus = { comp, echo, verb, lp, duck, sting };
      return this.bus;
    },

    // One instrument note. kind decides the sound; send = how much echo;
    // dest = where it goes (a song's track, or the stinger knob).
    voice(kind, freq, t, len, vol, send = 0, dest) {
      const c = this.ctx, bus = this.bus;
      dest = dest || bus.comp;
      const g = c.createGain();
      // where it sits left/right in the band (hats a bit right, shaker left, arpeggio bounces around)
      const PANS = { hat: 0.3, open: 0.35, shaker: -0.4, bells: 0.25, pad: 0, pluck: (Math.round(freq) % 3 - 1) * 0.45, clap: -0.1,
        'arp-marimba': (Math.round(freq) % 3 - 1) * 0.4, 'arp-uke': -0.25, 'arp-steel': 0.3 };
      const out = PANS[kind] ? this.pan(g, PANS[kind]) : g;
      out.connect(dest);
      if (send) { const s = c.createGain(); s.gain.value = send; g.connect(s).connect(bus.echo); }
      const REVERB = { pad: 0.5, 'pad-choir': 0.7, pluck: 0.4, snare: 0.25, clap: 0.3, bells: 0.3, 'lead-bell': 0.5, 'lead-flute': 0.4,
        'lead-choir': 0.6, 'lead-steel': 0.45, 'lead-marimba': 0.35, 'lead-whistle': 0.4 };
      const rv = REVERB[kind] != null ? REVERB[kind] : kind.startsWith('lead') || kind.startsWith('arp') ? 0.3 : 0;
      if (rv) { const s = c.createGain(); s.gain.value = rv; g.connect(s).connect(bus.verb); }
      const env = (a, d, s, r) => {        // attack, decay, sustain level, release
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(vol, t + a);
        g.gain.linearRampToValueAtTime(vol * s, t + a + d);
        g.gain.setValueAtTime(vol * s, t + Math.max(a + d, len));
        g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a + d, len) + r);
        return t + Math.max(a + d, len) + r + 0.05;
      };
      // a "struck" note (marimba, steel drum): loud at once, then rings away
      const ring = (secs) => {
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, t + secs);
        return t + secs + 0.05;
      };
      const osc = (type, f, det = 0) => { const o = c.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det; return o; };
      // arpeggio sounds use the same instruments as the leads
      if (kind.startsWith('arp-')) kind = 'lead-' + kind.slice(4);
      // struck and plucked instruments fade fast, so they play a bit louder to match the others
      vol *= { 'lead-marimba': 2.2, 'lead-steel': 1.7, 'lead-uke': 1.3 }[kind] || 1;
      let end;
      if (kind === 'lead-bell') {           // music-box bell: a sine "rung" by another sine (FM)
        const car = osc('sine', freq), mod = osc('sine', freq * 3.5), mg = c.createGain();
        mg.gain.setValueAtTime(freq * 2.2, t); mg.gain.exponentialRampToValueAtTime(freq * 0.05, t + 0.5);
        mod.connect(mg).connect(car.frequency); car.connect(g);
        end = env(0.003, 0.3, 0.25, 0.5);
        [car, mod].forEach(o => { o.start(t); o.stop(end); });
      } else if (kind === 'lead-flute') {   // breathy flute: a sine with a little noise and vibrato
        const o1 = osc('sine', freq), o2 = osc('triangle', freq * 2), g2 = c.createGain(); g2.gain.value = 0.12;
        const vib = osc('sine', 5), vg = c.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(freq * 0.01, t + 0.3);
        vib.connect(vg); vg.connect(o1.frequency); vg.connect(o2.frequency);
        o1.connect(g); o2.connect(g2).connect(g);
        end = env(0.05, 0.1, 0.8, 0.15);
        [o1, o2, vib].forEach(o => { o.start(t); o.stop(end); });
      } else if (kind === 'lead-brass') {   // bright brass: sawtooths with a filter that opens on each note
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 2;
        f.frequency.setValueAtTime(500, t); f.frequency.linearRampToValueAtTime(3200, t + 0.06); f.frequency.exponentialRampToValueAtTime(1400, t + 0.4);
        const o1 = osc('sawtooth', freq, -8), o2 = osc('sawtooth', freq, 8);
        o1.connect(f); o2.connect(f); f.connect(g);
        end = env(0.03, 0.15, 0.75, 0.12);
        [o1, o2].forEach(o => { o.start(t); o.stop(end); });
      } else if (kind === 'lead-steel') {   // steel drum: a bright "ping" with metal overtones that rings away
        const parts = [[1, 1], [2.02, 0.55], [3.01, 0.18], [4.07, 0.12]];
        const os = parts.map(([m, a]) => { const o = osc('sine', freq * m), pg = c.createGain(); pg.gain.value = a; o.connect(pg).connect(g); return o; });
        // a little pitch "plink" at the start, like the stick hitting the pan
        os[0].frequency.setValueAtTime(freq * 1.03, t); os[0].frequency.exponentialRampToValueAtTime(freq, t + 0.03);
        end = ring(Math.min(1.6, 0.5 + len * 1.5));
        os.forEach(o => { o.start(t); o.stop(end); });
      } else if (kind === 'lead-marimba') { // marimba: a warm wooden "tok" (a sine plus a fast high overtone)
        const o1 = osc('sine', freq), o2 = osc('sine', freq * 4), g2 = c.createGain(), o3 = osc('sine', freq * 9.8), g3 = c.createGain();
        g2.gain.setValueAtTime(0.35, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        g3.gain.setValueAtTime(0.12, t); g3.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
        o1.connect(g); o2.connect(g2).connect(g); o3.connect(g3).connect(g);
        end = ring(Math.min(0.9, 0.35 + len));
        [o1, o2, o3].forEach(o => { o.start(t); o.stop(end); });
      } else if (kind === 'lead-choir' || kind === 'pad-choir') {   // "oooh" voices: buzzy waves shaped by two mouth filters
        const pad = kind === 'pad-choir';
        const f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter(), lp = c.createBiquadFilter(), mix = c.createGain();
        f1.type = f2.type = 'bandpass'; f1.frequency.value = 330; f2.frequency.value = 880; f1.Q.value = 4; f2.Q.value = 6;
        lp.type = 'lowpass'; lp.frequency.value = 1800; mix.gain.value = 2.2;
        const vib = osc('sine', 4.8), vg = c.createGain(); vg.gain.value = freq * 0.008; vib.connect(vg);
        const os = [-14, 0, 13].map(det => { const o = osc('sawtooth', freq, det); vg.connect(o.frequency); o.connect(f1); o.connect(f2); return o; });
        f1.connect(mix); f2.connect(mix); mix.connect(lp).connect(g);
        end = pad ? env(0.45, 0.3, 0.85, 0.6) : env(0.12, 0.15, 0.85, 0.3);
        os.concat([vib]).forEach(o => { o.start(t); o.stop(end); });
      } else if (kind === 'lead-uke') {     // ukulele: a real "plucked string" (see pluckString below)
        const src = c.createBufferSource(); src.buffer = this.pluckString(freq);
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 3800;
        src.connect(f).connect(g);
        vol *= 2.2;                         // (a plucked string is quieter than a held note)
        g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(vol, t + Math.max(0.2, len)); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.2, len) + 0.25);
        end = t + Math.max(0.2, len) + 0.3;
        src.start(t); src.stop(end);
      } else if (kind === 'lead-whistle') { // whistling: a pure high tone that slides from the last note, with a wobble
        const o = osc('sine', freq * 2);
        const from = this._lastWhistle && Math.abs(this._lastWhistle / freq - 1) < 0.6 ? this._lastWhistle * 2 : freq * 2;
        o.frequency.setValueAtTime(from, t); o.frequency.exponentialRampToValueAtTime(freq * 2, t + 0.05);
        this._lastWhistle = freq;
        const vib = osc('sine', 6), vg = c.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(freq * 0.03, t + 0.35);
        vib.connect(vg).connect(o.frequency);
        o.connect(g);
        end = env(0.03, 0.08, 0.8, 0.08);
        [o, vib].forEach(x => { x.start(t); x.stop(end); });
      } else if (kind === 'lead-kazoo') {   // kazoo: a buzzy, nasal hum (silly!)
        const o = osc('sawtooth', freq), sh = c.createWaveShaper();
        const curve = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 3); }
        sh.curve = curve;
        const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 350;
        const nose = c.createBiquadFilter(); nose.type = 'peaking'; nose.frequency.value = 1300; nose.Q.value = 3; nose.gain.value = 12;
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
        const vib = osc('sine', 5.5), vg = c.createGain(); vg.gain.value = freq * 0.015; vib.connect(vg).connect(o.frequency);
        const trim = c.createGain(); trim.gain.value = 0.45;
        o.connect(sh).connect(hp).connect(nose).connect(lp).connect(trim).connect(g);
        end = env(0.02, 0.1, 0.8, 0.08);
        [o, vib].forEach(x => { x.start(t); x.stop(end); });
      } else if (kind === 'lead-square' || kind === 'lead-saw' || kind === 'lead-triangle') {
        const type = kind === 'lead-saw' ? 'sawtooth' : kind.slice(5);
        // the filter starts bright and mellows a little on each note (like a real synth)
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 1.5;
        const top = type === 'triangle' ? 7000 : 3600;
        f.frequency.setValueAtTime(top, t); f.frequency.exponentialRampToValueAtTime(top * 0.55, t + 0.25);
        const o1 = osc(type, freq, -6), o2 = osc(type, freq, 7);
        const vib = osc('sine', 5.5), vg = c.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(len > 0.25 ? freq * 0.012 : 0, t + 0.25);
        vib.connect(vg); vg.connect(o1.frequency); vg.connect(o2.frequency);
        o1.connect(f); o2.connect(f); f.connect(g);
        end = env(0.012, 0.12, 0.7, 0.12);
        [o1, o2, vib].forEach(o => { o.start(t); o.stop(end); });
      } else if (kind === 'bass') {
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(260, t + 0.18);
        const o1 = osc('sawtooth', freq), o2 = osc('sine', freq / 2);
        const sub = c.createGain(); sub.gain.value = 0.8;
        o1.connect(f).connect(g); o2.connect(sub).connect(g);
        end = env(0.006, 0.08, 0.6, 0.06);
        [o1, o2].forEach(o => { o.start(t); o.stop(end); });
      } else if (kind === 'pad') {
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1100;
        const o1 = osc('sawtooth', freq, -9), o2 = osc('sawtooth', freq, 9);
        o1.connect(f); o2.connect(f); f.connect(g);
        end = env(0.25, 0.3, 0.8, 0.4);
        [o1, o2].forEach(o => { o.start(t); o.stop(end); });
      } else if (kind === 'pluck' || kind === 'lead-pluck') {       // arpeggio / music box
        const o = osc('triangle', freq), o2 = osc('sine', freq * 2);
        const g2 = c.createGain(); g2.gain.value = 0.3;
        o.connect(g); o2.connect(g2).connect(g);
        end = env(0.003, 0.15, 0.15, 0.1);
        [o, o2].forEach(x => { x.start(t); x.stop(end); });
      } else if (kind === 'kick') {         // a thump that drops in pitch, plus a tiny click so it's heard on phones
        const o = osc('sine', 160);
        o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        o.connect(g);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
        const k = osc('triangle', 1200), kg = c.createGain();
        kg.gain.setValueAtTime(vol * 0.25, t); kg.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
        k.connect(kg).connect(dest);
        o.start(t); o.stop(t + 0.34); k.start(t); k.stop(t + 0.02);
      } else if (kind === 'tom') {          // drum fill toms (freq = how high)
        const o = osc('sine', freq * 1.6);
        o.frequency.setValueAtTime(freq * 1.6, t); o.frequency.exponentialRampToValueAtTime(freq, t + 0.15);
        o.connect(g);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
        o.start(t); o.stop(t + 0.27);
      } else {                              // noise drums: snare, clap, hats, shaker, bells
        const n = this.noiseBuf || (this.noiseBuf = (() => {
          const b = c.createBuffer(1, c.sampleRate, c.sampleRate), d = b.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; })());
        const src = c.createBufferSource(); src.buffer = n;
        const f = c.createBiquadFilter();
        const set = {
          snare: ['bandpass', 1800, 0.16], clap: ['bandpass', 1300, 0.12], hat: ['highpass', 7500, 0.035],
          open: ['highpass', 7000, 0.16], shaker: ['highpass', 5500, 0.05], bells: ['bandpass', 6500, 0.09],
          crash: ['highpass', 4500, 1.4],
        }[kind] || ['highpass', 7000, 0.04];
        f.type = set[0]; f.frequency.value = set[1]; if (kind === 'bells') f.Q.value = 6;
        src.connect(f).connect(g);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + set[2]);
        src.start(t, Math.random() * 0.5); src.stop(t + set[2] + 0.02);
        if (kind === 'snare') {             // a little body under the snare
          const o = osc('triangle', 190); const og = c.createGain();
          og.gain.setValueAtTime(vol * 0.6, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
          o.connect(og).connect(dest); o.start(t); o.stop(t + 0.1);
        }
        if (kind === 'bells') {             // jingle: two shiny high notes
          for (const fr of [2637, 3520]) { const o = osc('sine', fr); const og = c.createGain(); og.gain.setValueAtTime(vol * 0.25, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); o.connect(og).connect(dest); o.start(t); o.stop(t + 0.14); }
        }
      }
    },
    // A plucked string, made the old-school way ("Karplus-Strong"): start with a
    // burst of noise, then keep averaging it with itself one string-length later.
    // The noise quickly turns into a ringing note. Made once per pitch and kept.
    pluckString(freq) {
      this._strings = this._strings || {};
      const key = Math.round(freq);
      if (this._strings[key]) return this._strings[key];
      const c = this.ctx, sr = c.sampleRate, n = Math.floor(sr * 1.2), b = c.createBuffer(1, n, sr), d = b.getChannelData(0);
      const p = Math.max(2, Math.round(sr / freq));
      let last = 0;
      for (let i = 0; i < p; i++) { last = last * 0.5 + (Math.random() * 2 - 1) * 0.5; d[i] = last; }   // a soft "pluck"
      for (let i = p; i < n; i++) d[i] = 0.998 * 0.5 * (d[i - p] + d[i - p - 1 >= 0 ? i - p - 1 : i - p]);
      let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(d[i]));
      for (let i = 0; i < n; i++) d[i] *= 0.9 / (peak || 1);         // make every string equally loud
      return (this._strings[key] = b);
    },

    // ---- Writing tunes ----
    // A tune is written as text, one token per note:  "5/4" = scale step 5 for 4 sixteenths
    // (a quarter note). Steps go past 7 for higher notes (8 = the 1 an octave up) and
    // below 1 for lower ones (0 = the 7 below, -1 = the 6 below). "r/4" is a rest.
    // Leave off the "/len" to reuse the last length. "#" or "b" after the number
    // makes it a half step higher or lower. "|" marks a bar (4 bars = one phrase, 16 per bar).
    parseTune(text) {
      const notes = []; let step = 0, len = 4;
      for (const tok of text.split(/\s+/)) {
        if (!tok || tok === '|') continue;
        const m = /^(r|-?\d+)([#b]?)(?:\/(\d+))?$/.exec(tok);
        if (!m) throw new Error('Bad note "' + tok + '" in tune: ' + text);
        if (m[3]) len = +m[3];
        if (m[1] !== 'r') notes.push({ step, deg: +m[1] - 1, acc: m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0, len });
        step += len;
      }
      notes.total = step;
      return notes;
    },
    // A made-up phrase, for songs without a written tune. It follows a shape over the
    // chords (seeded random, so a recipe always gives the same tune).
    madeUpPhrase(sec, prog, R) {
      const chordDeg = d => [d - 1, d + 1, d + 3];
      const notes = [];
      const center = sec === 'A' ? 4 : sec === 'B' ? 6 : 5;
      const shape = (t) => sec === 'A' ? Math.sin(Math.PI * t) * 4 : sec === 'B' ? 4 * Math.cos(Math.PI * t * 0.6) - 1 : -2 * Math.sin(Math.PI * t);
      const wobble = R() * 6.28;
      let pos = center, prev = null, repeats = 0;
      const rhythms = ['x.x.x...x.x.x...', 'x...x.x.x...x...', 'x.xxx...x.x.x.x.', 'x..x..x.x...x...', 'x...x...x.x.x.x.', 'x.x...x.x.x.x...'];
      const motif = sec === 'C' ? 'x.......x.......' : rhythms[Math.floor(R() * rhythms.length)];
      let motif2 = sec === 'C' ? 'x...x...x.......' : rhythms[Math.floor(R() * rhythms.length)];
      if (motif2 === motif) motif2 = rhythms[(rhythms.indexOf(motif) + 2) % rhythms.length];
      const all = [];
      for (let bar = 0; bar < 4; bar++) {
        const rhythm = bar === 3 ? 'x...x...x.......' : bar % 2 ? motif2 : motif;
        for (let st = 0; st < 16; st++) if (rhythm[st] === 'x') {
          let len = 1; while (st + len < 16 && rhythm[st + len] !== 'x') len++;
          all.push({ bar, st, len });
        }
      }
      const targetAt = (bar, st) => center + shape((bar * 16 + st) / 64) + Math.sin(wobble + bar * 1.7) * 0.8;
      const nearestChord = (chord, want, avoid) => {
        let best = null, bd = 99;
        for (const cd of chord) for (const o of [-7, 0, 7, 14]) {
          const n = cd + o; const d = Math.abs(n - want) + (n === avoid ? 2.5 : 0);
          if (d < bd) { bd = d; best = n; }
        }
        return best;
      };
      all.forEach((nt, i) => {
        const chord = chordDeg(prog[nt.bar]);
        const strong = nt.st % 4 === 0 || nt.len >= 4;
        const avoid = repeats >= 1 ? prev : null;
        if (nt.bar === 3 && nt.st === 8) { pos = nearestChord([chord[0]], targetAt(3, 8), null); nt.len = 8; }
        else if (strong) pos = nearestChord(chord, targetAt(nt.bar, nt.st), avoid);
        else {
          const nx = all.slice(i + 1).find(n => n.st % 4 === 0) || nt;
          const goal = targetAt(nx.bar, nx.st);
          pos += goal > pos + 0.5 ? 1 : goal < pos - 0.5 ? -1 : (R() < 0.5 ? 1 : -1);
          if (pos === avoid) pos += goal > pos ? 1 : -1;
        }
        pos = Math.max(sec === 'B' ? 3 : 1, Math.min(sec === 'B' ? 12 : 10, pos));
        repeats = pos === prev ? repeats + 1 : 0;
        prev = pos;
        notes.push({ step: nt.bar * 16 + nt.st, deg: pos, acc: 0, len: nt.len });
      });
      return notes;
    },

    // ---- Arranging: turn a recipe into a whole song ----
    // The song is played like a real one:
    //   Intro (2 bars, only at the very start: drums, bass, chords - no tune yet)
    //   then this loops:  verse, verse, chorus, chorus, BRIDGE, chorus,
    //                     verse (new instrument), verse, chorus, BREAKDOWN, chorus, chorus (key change!)
    // That's 48 bars, about 1.5 - 2.5 minutes before it repeats, and each part sounds a
    // bit different (harmony voice, a counter-melody, bells on top, drums that change).
    // Returns the song with: _intro / _body (lists of notes, sorted by step),
    // _introSteps / _bodySteps, and _bars (the chord of every body bar, for extra arpeggios).
    PLAN: [
      { sec: 'A' }, { sec: 'A', counter: true }, { sec: 'B', harm: true }, { sec: 'B', harm: true, bell: true },
      { sec: 'C', bridge: true }, { sec: 'B', harm: true, bell: true },
      { sec: 'A', swap: true }, { sec: 'A', swap: true, counter: true }, { sec: 'B', harm: true },
      { sec: 'C', breakdown: true }, { sec: 'B', harm: true, bell: true, shift: 2 }, { sec: 'B', harm: true, bell: true, shift: 2, big: true },
    ],
    compose(song) {
      if (song._body) return song;
      const R = math.seeded(song.seed || 1);
      const scale = this.SCALES[song.scale] || this.SCALES.major;
      const note = (deg, oct = 0) => {     // scale step (0-based, can go past 7) -> MIDI
        const o = Math.floor(deg / 7), i = ((deg % 7) + 7) % 7;
        return song.root + scale[i] + 12 * (o + oct);
      };
      const chordDeg = d => [d - 1, d + 1, d + 3];   // triad from scale step (1-based)
      const progOf = { A: song.prog[0], B: song.prog[1] || song.prog[0], C: song.prog[2] || [4, 5, 6, 5] };
      // the tune: written by hand (song.tune) or made up from the chords
      const phrases = {};
      for (const sec of ['A', 'B', 'C']) {
        const written = song.tune && song.tune[sec];
        phrases[sec] = written ? this.parseTune(written) : this.madeUpPhrase(sec, progOf[sec], R);
      }
      const lift = song.root >= 64 ? 0 : 12;          // (songs in low keys play the tune an octave up)
      const oct = song.octave || 0;
      const lead = song.lead || 'square', harmony = song.harmony || lead;
      const lead2 = song.lead2 || harmony;           // the tune's instrument in the second time round
      const drums = this.DRUMS[song.drums] || this.DRUMS.rock;
      const bass = this.BASS[song.bass] || this.BASS.eighths;
      const arpSound = song.arpSound ? 'arp-' + song.arpSound : 'pluck';
      const padKind = song.pad === 'choir' ? 'pad-choir' : 'pad';
      const DRUM_KIND = { K: 'kick', S: 'snare', C: 'clap', H: 'hat', O: 'open', s: 'shaker', B: 'bells' };
      const DRUM_VOL = { kick: 0.9, snare: 0.35, clap: 0.35, hat: 0.12, open: 0.1, shaker: 0.06, bells: 0.16 };
      const LAYER = { kick: 'kick', snare: 'drums', clap: 'drums', tom: 'drums', crash: 'drums', hat: 'hats', open: 'hats', shaker: 'hats', bells: 'hats' };

      // one bar of backing (drums, bass, chords, arpeggio) into list `ev` at step s0
      const backing = (ev, s0, d, o) => {
        const tri = chordDeg(d).map(x => note(x));
        const sh = o.shift || 0;
        for (const k in drums) for (let st = 0; st < 16; st++) {
          let hit = drums[k][st] === 'x';
          if (o.fill && st >= 12 && (k === 'S' || k === 'K')) hit = false;           // (the toms play there)
          if (o.half) hit = (k === 'K' && st === 0) || ((k === 'S' || k === 'C') && st === 8) || ((k === 'H' || k === 's') && st % 4 === 0);
          if (o.quiet && (k === 'K' || k === 'S' || k === 'C')) hit = false;         // breakdown: no big drums
          if (o.intro && k !== 'K' && k !== 'H' && k !== 's') hit = false;
          if (o.intro && k === 'K' && st % 8) hit = false;
          if (!hit) continue;
          const kind = DRUM_KIND[k];
          ev.push({ step: s0 + st, kind, layer: LAYER[kind], vol: DRUM_VOL[kind] * (st % 4 === 0 ? 1 : 0.8) * (o.intro ? 0.7 : 1) });
        }
        if (o.fill) [12, 13, 14, 15].forEach((st, i) => ev.push({ step: s0 + st, kind: 'tom', layer: 'drums', midi: [57, 52, 48, 43][i], vol: 0.5 }));
        if (o.roll) for (let st = 0; st < 16; st++) ev.push({ step: s0 + st, kind: 'snare', layer: 'drums', vol: 0.08 + 0.3 * st / 15 });   // build-up
        if (o.big) for (const st of [2, 6, 10, 14]) ev.push({ step: s0 + st, kind: 'open', layer: 'hats', vol: 0.09 });
        if (song.bells && !o.quiet) for (let st = 0; st < 16; st += 2) ev.push({ step: s0 + st, kind: 'bells', layer: 'hats', vol: 0.12 });
        // bass (the breakdown and intro just hold long notes)
        const bpat = o.quiet || o.intro ? this.BASS.whole : bass;
        for (let st = 0; st < 16; st++) {
          if (bpat[0][st] !== 'x') continue;
          const which = +bpat[1][st];
          const m = note(d - 1, -2) + (which === 1 ? 7 : which === 2 ? 12 : 0);
          let len = 1; while (st + len < 16 && bpat[0][st + len] !== 'x') len++;
          ev.push({ step: s0 + st, kind: 'bass', layer: 'bass', midi: m + sh, len: Math.min(len, o.quiet || o.intro ? 15 : 4), vol: 0.22 });
        }
        // soft chord pad (whole bar); louder in the bridge and breakdown
        if (song.pad || o.quiet || o.half) for (const m of tri) ev.push({ step: s0, kind: padKind, layer: 'pad', midi: m + sh, len: 15, vol: (o.quiet || o.half ? 0.05 : 0.035) * (padKind === 'pad-choir' ? 1.3 : 1) });
        // arpeggio: chord notes going up and down, every 8th
        if (song.arp && (song.arp !== 'B' || o.sec === 'B') && !o.half) {
          const up = [tri[0], tri[1], tri[2], tri[0] + 12, tri[2], tri[1]].map(m => m + 12 + sh);
          for (let st = 0; st < 16; st += 2) ev.push({ step: s0 + st, kind: arpSound, layer: 'arp', midi: up[(st / 2) % up.length], len: 1, vol: arpSound === 'pluck' ? 0.07 : 0.06, send: 0.25 });
        }
        return tri.map(m => m + sh);
      };

      // ---- intro: 2 bars ----
      const intro = [];
      for (let bar = 0; bar < 2; bar++) backing(intro, bar * 16, progOf.A[bar], { intro: true, fill: bar === 1, sec: 'A' });
      intro.push({ step: 0, kind: 'crash', layer: 'drums', vol: 0.05 });

      // ---- the body ----
      const body = [], bars = [];
      this.PLAN.forEach((p, si) => {
        const base = si * 64, prog = progOf[p.sec], sh = p.shift || 0;
        const next = this.PLAN[(si + 1) % this.PLAN.length];
        // the tune
        const inst = p.breakdown ? 'bell' : p.bridge ? harmony : p.swap ? lead2 : lead;
        for (const n of phrases[p.sec]) {
          const m = note(n.deg, oct) + lift + n.acc + sh;
          body.push({ step: base + n.step, kind: 'lead-' + inst, layer: 'lead', midi: m, len: n.len, vol: inst === 'bell' ? 0.1 : 0.12, send: 0.35 });
          // chorus: a second voice sings along a little lower (a "harmony")
          if (p.harm) body.push({ step: base + n.step, kind: 'lead-' + harmony, layer: 'harm', midi: note(n.deg - 2, oct) + lift + n.acc + sh, len: n.len, vol: 0.055, send: 0.2 });
          // sparkly bells copy the tune one octave up
          if (p.bell) body.push({ step: base + n.step, kind: 'lead-bell', layer: 'harm', midi: m + 12, len: n.len, vol: 0.045 });
        }
        for (let bar = 0; bar < 4; bar++) {
          const s0 = base + bar * 16, d = prog[bar];
          if (bar === 0 && !p.breakdown) body.push({ step: s0, kind: 'crash', layer: 'drums', vol: p.big ? 0.13 : 0.1 });
          const last = bar === 3;
          const tri = backing(body, s0, d, {
            sec: p.sec, shift: sh, big: p.big,
            half: p.bridge && !last, roll: (p.bridge || p.breakdown) && last,
            quiet: p.breakdown && bar < 2,
            fill: last && !p.bridge && !p.breakdown && next.sec !== p.sec,
          });
          bars.push({ tri, shift: sh, arp: !!(song.arp && (song.arp !== 'B' || p.sec === 'B') && !(p.bridge && !last)) });
          // counter-melody: long, low notes under the verse (the chord's 3rd, then its 5th)
          if (p.counter) {
            body.push({ step: s0, kind: 'lead-' + harmony, layer: 'harm', midi: tri[1] + 12, len: 8, vol: 0.045, send: 0.2 });
            body.push({ step: s0 + 8, kind: 'lead-' + harmony, layer: 'harm', midi: tri[2] + 12, len: 8, vol: 0.045, send: 0.2 });
          }
        }
      });
      song._intro = intro.sort((a, b) => a.step - b.step); song._introSteps = 32;
      song._body = body.sort((a, b) => a.step - b.step); song._bodySteps = this.PLAN.length * 64;
      song._bars = bars;
      song._note = note;
      return song;
    },

    // ---- Playing ----
    midi(n) { return 440 * Math.pow(2, (n - 69) / 12); },
    // play(song, { ready: true }) plays a little "get ready" jingle first (drum roll + da-da-DAA!)
    // play(song, { quick: true }) skips the quiet 2-bar intro and fades in fast (the hub uses this)
    play(name, opts = {}) {
      const song = typeof name === 'object' ? name : this.songs[name];
      if (!song) { this.stop(0.4); return; }
      const c = this.ensure(); if (!c) return;
      this.musicBus();
      this.compose(song);
      const prev = this.track;
      if (prev) this.fadeOut(prev, opts.fade != null ? opts.fade : 0.6);
      const gain = c.createGain(); gain.connect(this.bus.comp);
      const tr = { song, gain, step: 0, idx: 0, phase: opts.quick ? 'body' : 'intro', key: this.mood.key, next: c.currentTime + 0.08, paused: false };
      const six = 60 / song.tempo / 4;
      if (opts.ready) {
        gain.gain.value = 1;
        this.readyJingle(song, tr.next, gain);
        tr.next += six * 16;                         // the song starts right after the jingle
      } else {
        // fade in (a little slower when nothing was playing, so it never "jumps" in)
        gain.gain.setValueAtTime(0.0001, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(1, c.currentTime + (opts.quick ? 0.15 : prev ? 0.6 : 0.9));
      }
      this.bus.echo.delayTime.value = six * 3;       // echo in time with the beat
      this.track = tr; this.current = song;
      this.startTimer(tr);
    },
    startTimer(tr) {
      clearInterval(tr.timer);
      // schedule a little ahead of time so the music never stutters
      tr.timer = setInterval(() => this.tick(tr), 50);
      this.musicTimer = tr.timer;
      this.tick(tr);
    },
    // Schedule the notes due in the next 0.2 seconds for this track.
    tick(tr) {
      const c = this.ctx;
      if (!c || tr.gain.context !== c) return;      // (a test recording is using the mixing desk right now)
      while (tr.next < c.currentTime + 0.2) this.stepOnce(tr);
    },
    // play everything on the current 16th note of a track, then move on one 16th
    stepOnce(tr) {
      const song = tr.song, mood = this.mood;
      {
        let list = tr.phase === 'intro' ? song._intro : song._body;
        const len = tr.phase === 'intro' ? song._introSteps : song._bodySteps;
        if (tr.step >= len) {                       // end of the intro (or of the song): go (back) to the top
          tr.phase = 'body'; tr.step = 0; tr.idx = 0; list = song._body;
        }
        const st = tr.step;
        if (st % 16 === 0) tr.key = Math.round(mood.key || 0);   // key changes wait for the next bar
        const six = 60 / (song.tempo * (mood.tempo || 1)) / 4;
        const swing = (st % 2 === 1) ? (song.swing || 0) * six : 0;
        const e0 = mood.energy == null ? 1 : mood.energy;
        const calm = e0 < 0.5, hype = e0 >= 1.5;
        const t = tr.next + swing;
        while (tr.idx < list.length && list[tr.idx].step === st) {
          const e = list[tr.idx++];
          // energy: calm music drops the hi-hats, arpeggio and harmony and plays the drums softer
          if (calm && (e.layer === 'hats' || e.layer === 'arp' || e.layer === 'harm')) continue;
          let vol = e.vol;
          if (calm && (e.layer === 'kick' || e.layer === 'drums')) vol *= 0.45;
          if (calm && e.layer === 'bass') vol *= 0.8;
          if (hype && e.layer === 'lead') vol *= 1.12;
          const m = e.midi != null ? e.midi + tr.key : null;
          this.voice(e.kind, m != null ? this.midi(m) : 0, t, (e.len || 1) * six * 0.92, vol, e.send || 0, tr.gain);
        }
        // energy high: extra 16th-note hi-hats, a kick on every beat, and the arpeggio always on
        if (hype && tr.phase === 'body') {
          if (st % 2 === 1) this.voice('hat', 0, t, six, 0.07, 0, tr.gain);
          if (st % 4 === 0) this.voice('kick', 0, t, six, 0.6, 0, tr.gain);
          const bar = song._bars[Math.floor(st / 16)];
          if (bar && !bar.arp && st % 2 === 0) {
            const tri = bar.tri, up = [tri[0], tri[1], tri[2], tri[0] + 12, tri[2], tri[1]];
            this.voice('pluck', this.midi(up[(st / 2) % 6] + 12 + tr.key), t, six, 0.05, 0.25, tr.gain);
          }
        }
        tr.step++; tr.next += six;
      }
    },
    // fade a track out and then let it go
    fadeOut(tr, secs = 0.6) {
      const c = this.ctx; if (!c || !tr) return;
      clearInterval(tr.timer);
      const now = c.currentTime;
      tr.gain.gain.cancelScheduledValues(now);
      tr.gain.gain.setValueAtTime(Math.max(0.0001, tr.gain.gain.value), now);
      tr.gain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.03, secs));
      setTimeout(() => { try { tr.gain.disconnect(); } catch (e) { /* already gone */ } }, (secs + 0.6) * 1000);
      if (this.track === tr) { this.track = null; this.current = null; this.musicTimer = null; }
    },
    stop(fade = 0.05) { if (this.track) this.fadeOut(this.track, fade); },
    // Pause: fade out quickly but remember where we were. Resume carries on from there.
    pauseMusic() {
      const tr = this.track; if (!tr || tr.paused) return;
      tr.paused = true; clearInterval(tr.timer);
      const now = this.ctx.currentTime;
      tr.gain.gain.cancelScheduledValues(now);
      tr.gain.gain.setValueAtTime(Math.max(0.0001, tr.gain.gain.value), now);
      tr.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    },
    resumeMusic(song) {
      const tr = this.track;
      if (!tr || !tr.paused || (song && tr.song !== song)) return false;
      tr.paused = false;
      const now = this.ctx.currentTime;
      tr.next = now + 0.3;
      tr.step = Math.floor(tr.step / 4) * 4;        // come back in on a beat
      const list = tr.phase === 'intro' ? tr.song._intro : tr.song._body;
      tr.idx = list.findIndex(e => e.step >= tr.step); if (tr.idx < 0) tr.idx = list.length;
      tr.gain.gain.cancelScheduledValues(now);
      tr.gain.gain.setValueAtTime(0.0001, now);
      tr.gain.gain.exponentialRampToValueAtTime(1, now + 0.6);
      this.startTimer(tr);
      return true;
    },
    // A proper ending when a level is over. Win: one last big chord in the song's key.
    // Not a win: the music just gently fades away.
    end(win) {
      const tr = this.track; if (!tr) return;
      if (!win || tr.paused) { this.fadeOut(tr, 1.0); return; }
      clearInterval(tr.timer);
      const song = tr.song, c = this.ctx, six = 60 / song.tempo / 4;
      const t = Math.max(c.currentTime + 0.03, tr.next);
      const k = tr.key + this.curShift(tr);
      const root = song._note(0) + k, tri = [0, 2, 4].map(d => song._note(d) + k);
      const lift = song.root >= 64 ? 0 : 12;
      tri.forEach(m => this.voice(song.pad === 'choir' ? 'pad-choir' : 'pad', this.midi(m), t, 0.8, 0.05, 0, tr.gain));
      this.voice('lead-' + (song.lead || 'square'), this.midi(root + lift + 12 * (song.octave || 0) + 12), t, 0.7, 0.12, 0.35, tr.gain);   // the tune's home note, up high
      this.voice('lead-bell', this.midi(root + 24 + lift), t, 0.5, 0.05, 0, tr.gain);
      this.voice('bass', this.midi(root - 24), t, 0.6, 0.22, 0, tr.gain);
      this.voice('kick', 0, t, six, 0.9, 0, tr.gain);
      this.voice('crash', 0, t, six, 0.12, 0, tr.gain);
      tr.gain.gain.setValueAtTime(1, t + 0.5);
      tr.gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      setTimeout(() => { try { tr.gain.disconnect(); } catch (e) { /* gone */ } }, (t - c.currentTime + 1.5) * 1000);
      this.track = null; this.current = null; this.musicTimer = null;
    },
    // which key-change shift the current part of the song is in (for stingers and the ending)
    curShift(tr) {
      if (tr.phase !== 'body') return 0;
      const bar = tr.song._bars[Math.floor(tr.step / 16) % tr.song._bars.length];
      return bar ? bar.shift : 0;
    },
    // play a song unless it's already playing (so moving between menus doesn't restart it)
    keepPlaying(name, opts) {
      const song = typeof name === 'object' ? name : this.songs[name];
      if (song && this.track && this.track.song === song && !this.track.paused) return;
      if (song && this.resumeMusic(song)) return;
      this.play(name, opts);
    },

    // For tests: play `secs` seconds of a song into a recording instead of the speakers
    // (much faster than real time). Returns the recorded sound (an AudioBuffer).
    // (fromStep: start that many 16ths into the song's loop instead of at the intro)
    async renderOffline(song, secs, mood, fromStep) {
      song = typeof song === 'object' ? song : this.songs[song];
      const keep = { ctx: this.ctx, bus: this.bus, master: this.master, sfxGain: this.sfxGain, musicGain: this.musicGain, limiter: this.limiter,
        verb: this.verb, sfxVerb: this.sfxVerb, verbOut: this.verbOut, noiseBuf: this.noiseBuf, strings: this._strings, track: this.track, mood: this.mood };
      const oc = new OfflineAudioContext(2, Math.ceil(44100 * secs), 44100);
      this.bus = null; this.noiseBuf = null; this._strings = null; this.track = null;
      this.mood = Object.assign({ energy: 1, tempo: 1, key: 0, muffle: 0 }, mood || {});
      this.build(oc);
      this.musicGain.gain.value = 0.7 * 0.4; this.master.gain.value = 1;
      this.musicBus();
      this.compose(song);
      if (mood && mood.muffle) { this.bus.lp.frequency.value = 20000 * Math.pow(650 / 20000, mood.muffle); this.bus.duck.gain.value = 1 - 0.35 * mood.muffle; }
      const gain = oc.createGain(); gain.connect(this.bus.comp);
      const tr = { song, gain, step: 0, idx: 0, phase: 'intro', key: 0, next: 0.05 };
      if (fromStep) { tr.phase = 'body'; tr.step = fromStep; tr.idx = song._body.findIndex(e => e.step >= fromStep); }
      while (tr.next < secs) this.stepOnce(tr);
      const buf = await oc.startRendering();
      Object.assign(this, keep); this._strings = keep.strings;
      return buf;
    },

    // ---- Steering the music during a game ----
    // setMood({ energy, tempo, key, muffle }), any of them:
    //   energy: 0 = calm (no hi-hats or sparkles, soft drums), 1 = normal, 2 = all-out
    //   tempo:  1 = normal speed, 1.08 = a bit faster (last lap!)
    //   key:    half steps up (changes on the next bar)
    //   muffle: 0..1 = sounds like it's behind a wall (caves, underwater) and a bit quieter
    setMood(m) {
      Object.assign(this.mood, m);
      if (m.muffle != null && this.bus) {
        const now = this.ctx.currentTime, k = Math.max(0, Math.min(1, m.muffle));
        this.bus.lp.frequency.cancelScheduledValues(now);
        this.bus.lp.frequency.setTargetAtTime(20000 * Math.pow(650 / 20000, k), now, 0.15);
        this.bus.duck.gain.setTargetAtTime(1 - 0.35 * k, now, 0.15);
      }
    },
    resetMood() { this.setMood({ energy: 1, tempo: 1, key: 0, muffle: 0 }); },
    // the notes of a little jingle, in scale steps (1 = the song's key note): [step (16ths), degree, length, instrument]
    STINGERS: {
      treasure: [[0, 1, 1, 'bell'], [1, 3, 1, 'bell'], [2, 5, 1, 'bell'], [3, 8, 1, 'bell'], [4, 10, 1, 'bell'], [5, 12, 4, 'bell'], [5, 8, 4, 'pluck']],
      streak:   [[0, 1, 1, 'pluck'], [1, 2, 1, 'pluck'], [2, 3, 1, 'pluck'], [3, 5, 1, 'pluck'], [4, 6, 1, 'pluck'], [5, 8, 3, 'bell']],
      lead:     [[0, 5, 2, 'brass'], [2, 8, 6, 'brass'], [2, 10, 6, 'brass'], [2, 0, 0, 'crash']],
      lastlap:  [[0, 5, 2, 'brass'], [2, 5, 2, 'brass'], [4, 5, 2, 'brass'], [6, 8, 6, 'brass'], [6, 10, 6, 'brass'], [0, 0, 0, 'roll'], [6, 0, 0, 'crash']],
      boss:     [[0, -6, 2, 'brass'], [2, -6, 2, 'brass'], [4, -6, 2, 'brass'], [6, -5, 8, 'brass'], [6, -8, 8, 'saw'], [0, 0, 0, 'toms'], [6, 0, 0, 'crash']],
      ready:    [[0, 0, 0, 'roll'], [8, 5, 2, 'brass'], [10, 5, 2, 'brass'], [12, 8, 4, 'brass'], [12, 10, 4, 'bell'], [12, 0, 0, 'crash']],
    },
    // Play a little jingle on top of the song, in its key and on its beat.
    // kinds: 'treasure', 'streak', 'lead', 'lastlap', 'boss', 'ready'
    stinger(kind) {
      const c = this.ensure(); if (!c) return;
      this.musicBus();
      const list = this.STINGERS[kind]; if (!list) return;
      const tr = this.track && !this.track.paused ? this.track : null;
      const song = tr ? tr.song : { tempo: 120, root: 60, scale: 'major' };
      const six = 60 / (song.tempo * (tr ? this.mood.tempo || 1 : 1)) / 4;
      // start on the next 8th note so it lands with the beat
      let t = c.currentTime + 0.03;
      if (tr) { t = Math.max(t, tr.next); if (tr.step % 2) t += six; }
      const key = tr ? tr.key + this.curShift(tr) : 0;
      const scale = this.SCALES[song.scale] || this.SCALES.major;
      const deg = (d) => { const z = d - 1, o = Math.floor(z / 7), i = ((z % 7) + 7) % 7; return song.root + scale[i] + 12 * o; };
      const lift = song.root >= 64 ? 0 : 12;
      this.playNotes(list, t, six, (d) => deg(d) + key + lift, this.bus.sting);
    },
    readyJingle(song, t, dest) {
      const scale = this.SCALES[song.scale] || this.SCALES.major;
      const lift = song.root >= 64 ? 0 : 12;
      const deg = (d) => { const z = d - 1, o = Math.floor(z / 7), i = ((z % 7) + 7) % 7; return song.root + scale[i] + 12 * o + lift; };
      this.playNotes(this.STINGERS.ready, t, 60 / song.tempo / 4, deg, dest);
    },
    playNotes(list, t, six, pitch, dest) {
      for (const [st, d, len, inst] of list) {
        const at = t + st * six;
        if (inst === 'crash') this.voice('crash', 0, at, six, 0.11, 0, dest);
        else if (inst === 'roll') for (let i = 0; i < 8; i++) this.voice('snare', 0, at + i * six, six, 0.07 + 0.04 * i, 0, dest);
        else if (inst === 'toms') [57, 52, 48, 43].forEach((m, i) => this.voice('tom', this.midi(m), at + i * six, six, 0.5, 0, dest));
        else this.voice(inst === 'pluck' ? 'pluck' : 'lead-' + inst, this.midi(pitch(d)), at, len * six * 0.92, inst === 'bell' ? 0.09 : inst === 'pluck' ? 0.08 : 0.11, 0.25, dest);
      }
    },
  };

  // ------------------------------------------------------------------
  // Particles (confetti, sparkles, dust, splashes)
  // ------------------------------------------------------------------
  const PARTY = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#9b5de5', '#f15bb5', '#ff8c42'];
  class Particles {
    constructor() { this.list = []; }
    burst(x, y, o = {}) {
      // ("lite" drawing for slow devices: fewer sparkles, see the loop in start())
      const n = Particles.lite ? Math.max(1, Math.round((o.count || 16) * 0.6)) : (o.count || 16);
      for (let i = 0; i < n; i++) {
        const a = o.angle != null ? o.angle + (Math.random() - 0.5) * (o.spread || 1) : Math.random() * Math.PI * 2;
        const sp = (o.speed || 220) * (0.4 + Math.random() * 0.8);
        const colors = o.colors || PARTY;
        this.list.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: (o.life || 0.9) * (0.6 + Math.random() * 0.6), age: 0,
          size: (o.size || 8) * (0.6 + Math.random() * 0.8),
          color: colors[(Math.random() * colors.length) | 0],
          g: o.gravity == null ? 500 : o.gravity,
          shape: o.shape || 'circle', spin: (Math.random() - 0.5) * 10, rot: Math.random() * 6,
          drag: o.drag || 0,                    // (puffs slow down quickly: drag 4 = soft, like dust)
        });
      }
    }
    update(dt) {
      for (const p of this.list) {
        p.age += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.spin * dt;
        p.vx *= 0.99;
        if (p.drag) { const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; }
      }
      this.list = this.list.filter(p => p.age < p.life);
    }
    draw(ctx) {
      for (const p of this.list) {
        const k = 1 - p.age / p.life;
        ctx.save();
        ctx.globalAlpha = Math.min(1, k * 1.5);
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        // 'puff' = a soft cloud of dust that GROWS as it fades (landings, bounces, poofs)
        if (p.shape === 'puff') { ctx.globalAlpha = Math.min(0.85, k * 1.2); ctx.beginPath(); ctx.arc(0, 0, p.size / 2 * (0.6 + 0.8 * (1 - k)), 0, Math.PI * 2); ctx.fill(); }
        // 'ring' = a thin circle that spreads out (a sparkle's shockwave)
        else if (p.shape === 'ring') { ctx.strokeStyle = p.color; ctx.lineWidth = Math.max(1.5, p.size * 0.12 * k); ctx.beginPath(); ctx.arc(0, 0, p.size * (0.3 + 1.2 * (1 - k)), 0, Math.PI * 2); ctx.stroke(); }
        else if (p.shape === 'star') { draw.starPath(ctx, 0, 0, p.size, p.size * 0.45); ctx.fill(); }
        // (Nov 24, the Star Road's trails) a heart that floats up without spinning, and a see-through bubble with a shine
        else if (p.shape === 'heart') {
          ctx.rotate(-p.rot + Math.sin(p.age * 6 + p.spin) * 0.25);
          const r = p.size / 2;
          ctx.beginPath(); ctx.moveTo(0, r * 0.9);
          ctx.bezierCurveTo(-r * 1.6, -r * 0.2, -r * 0.9, -r * 1.4, 0, -r * 0.6);
          ctx.bezierCurveTo(r * 0.9, -r * 1.4, r * 1.6, -r * 0.2, 0, r * 0.9);
          ctx.fill(); ctx.strokeStyle = 'rgba(43,43,43,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
        }
        else if (p.shape === 'bubble') {
          ctx.rotate(-p.rot);
          const r = p.size / 2 * (0.7 + 0.3 * (1 - k));
          ctx.globalAlpha *= 0.85;
          ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.globalAlpha *= 0.45; ctx.fill(); ctx.globalAlpha /= 0.45;
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.5, r * 0.18); ctx.stroke();
          ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.35, r * 0.22, 0, Math.PI * 2); ctx.fill();
        }
        else if (p.shape === 'square') ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2 * (0.4 + 0.6 * k), 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
    }
  }

  // ------------------------------------------------------------------
  // Game feel ("juice", Nov 22, new plan point 3): little touches that make every action feel good.
  // Every kit game gets g.juice (made fresh by makeJuice(g) below); other pages can use Arcade.juice too.
  //   g.juice.squash(key)          a springy squash-and-stretch for anything (key = a name or the object itself).
  //                                  s.hit(0.3) = squash flat (wide + short), s.hit(-0.3) = stretch tall + thin;
  //                                  it wobbles back to normal by itself. Draw with s.sx / s.sy, or
  //                                  s.apply(ctx, x, y) = scale around the point (x, y) (use the feet / bottom).
  //   g.juice.dust(x, y, o)        soft dust puffs (landing, bouncing, skidding). o: count, color(s), dir (-1 / 1 = sideways), to
  //   g.juice.sparkle(x, y, o)     a burst of stars + a spreading ring (picking things up, scoring). o: count, colors, size, to
  //   g.juice.poof(x, y, o)        a baddie poofs into a cloud with sparkles (never anything scary). o: count, colors, to
  //   g.juice.stop(sec)            a tiny pause on a big hit (0.03-0.1 s): the game freezes for a blink, then carries on
  //   g.juice.flash(color, amount) a quick see-through flash over the whole picture (amount 0..0.5)
  //   g.juice.shake(px)            the kit shakes the whole picture a little (fades out by itself)
  //   g.juice.pop(key, amount)     a "boing" for a number or a picture: g.juice.size(key) is then 1 + a bit, settling to 1
  // `to` = a game's own Particles (world-space ones that move with the camera); otherwise g.particles (the screen).
  // Calm motion (Arcade.calm()): squashes are much smaller, no flashes, no shaking, fewer bits flying about.
  // The tiny pause stays (nothing moves during it). Test hook: g.juice.info().
  // ------------------------------------------------------------------
  function makeJuice(g) {
    const springs = new Map();
    let stopT = 0, flashT = 0, flashA = 0, flashC = '#ffffff', shakeT = 0, shakeA = 0, counts = { squash: 0, dust: 0, sparkle: 0, poof: 0, stop: 0, flash: 0, shake: 0, pop: 0 };
    const few = (n) => calm() ? Math.max(1, Math.round(n * 0.6)) : n;
    const fx = (o) => (o && o.to) || g.particles;
    // a spring that pulls `a` (how squashed) back to 0 with a little wobble
    function spring() {
      return {
        a: 0, v: 0, sx: 1, sy: 1,
        hit(amount) { counts.squash++; this.a = Math.max(-0.6, Math.min(0.6, amount * (calm() ? 0.35 : 1))); this.v = 0; this.set(); return this; },
        set() { this.sx = 1 + this.a; this.sy = 1 - this.a * 0.9; },
        step(dt) { this.v += (-this.a * 320 - this.v * 16) * dt; this.a += this.v * dt; if (Math.abs(this.a) < 0.002 && Math.abs(this.v) < 0.05) { this.a = 0; this.v = 0; } this.set(); },
        apply(ctx, x, y) { ctx.translate(x, y); ctx.scale(this.sx, this.sy); ctx.translate(-x, -y); },
      };
    }
    const J = {
      squash(key) { let s = springs.get(key); if (!s) { s = spring(); springs.set(key, s); } return s; },
      dust(x, y, o = {}) {
        counts.dust++;
        const colors = o.colors || [o.color || '#f1e7d0', '#ffffff'];
        const n = few(o.count || 6), dir = o.dir || 0;
        fx(o).burst(x, y, { count: n, shape: 'puff', colors, size: o.size || 16, speed: o.speed || 90, life: o.life || 0.45,
          gravity: -30, drag: 5, angle: dir ? (dir > 0 ? 0 : Math.PI) - dir * 0.35 : -Math.PI / 2, spread: dir ? 1.2 : 3.2 });
      },
      sparkle(x, y, o = {}) {
        counts.sparkle++;
        const colors = o.colors || ['#ffd166', '#fff3b0', '#ffffff'];
        const P = fx(o);
        P.burst(x, y, { count: few(o.count || 10), shape: 'star', colors, speed: o.speed || 190, size: o.size || 11, gravity: 120, life: 0.55, drag: 1.5 });
        if (!calm()) P.burst(x, y, { count: 1, shape: 'ring', colors: [colors[0]], speed: 0, size: (o.size || 11) * 3, gravity: 0, life: 0.35 });
      },
      poof(x, y, o = {}) {
        counts.poof++;
        const P = fx(o);
        P.burst(x, y, { count: few(o.count || 10), shape: 'puff', colors: o.colors || ['#ffffff', '#f2f2ff', '#ffe5f1'], size: o.size || 26, speed: 130, life: 0.55, gravity: -40, drag: 4 });
        P.burst(x, y, { count: few(8), shape: 'star', colors: ['#ffd166', '#ffffff', '#9bf6ff'], speed: 220, size: 10, gravity: 150, life: 0.6 });
      },
      stop(sec) { counts.stop++; stopT = Math.max(stopT, Math.min(0.12, sec || 0.05)); },
      flash(color, amount) { counts.flash++; if (calm()) return; flashC = color || '#ffffff'; flashA = Math.min(0.5, amount == null ? 0.3 : amount); flashT = 1; },
      shake(px) { counts.shake++; if (calm()) return; shakeA = Math.max(shakeA * shakeT, Math.min(14, px || 6)); shakeT = 1; },
      pop(key, amount) { counts.pop++; J.squash('pop:' + key).hit(-(amount || 0.35)); },
      size(key) { const s = springs.get('pop:' + key); return s ? 1 - s.a : 1; },
      // (the kit calls these)
      frozen() { return stopT > 0; },
      step(dt) {
        if (stopT > 0) { stopT -= dt; return; }
        for (const s of springs.values()) s.step(dt);
        flashT = Math.max(0, flashT - dt * 6.5);
        shakeT = Math.max(0, shakeT - dt * 4);
      },
      offset() { if (!shakeT) return null; const a = shakeA * shakeT; return { x: (Math.random() - 0.5) * 2 * a, y: (Math.random() - 0.5) * 2 * a }; },
      drawFlash(ctx) {
        if (!flashT) return;
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = flashA * flashT; ctx.fillStyle = flashC; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
      },
      reset() { springs.clear(); stopT = 0; flashT = 0; shakeT = 0; },
      // (counts = how many times each helper was used; flashing / shaking = how much is left of the last one)
      info() { return Object.assign({}, counts, { springs: springs.size, stopped: stopT > 0, flashing: flashT, shaking: shakeT }); },
    };
    return J;
  }

  // ------------------------------------------------------------------
  // Drawing helpers
  // ------------------------------------------------------------------
  const INK = '#2b2b2b';
  const draw = {
    INK,
    rr(ctx, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    },
    // filled + outlined rounded box
    box(ctx, x, y, w, h, r, fill, line = 4) {
      this.rr(ctx, x, y, w, h, r);
      ctx.fillStyle = fill; ctx.fill();
      if (line) { ctx.lineWidth = line; ctx.strokeStyle = INK; ctx.stroke(); }
    },
    circle(ctx, x, y, r, fill, line = 4) {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (line) { ctx.lineWidth = line; ctx.strokeStyle = INK; ctx.stroke(); }
    },
    starPath(ctx, x, y, R, r, n = 5) {
      ctx.beginPath();
      for (let i = 0; i < n * 2; i++) {
        const a = -Math.PI / 2 + Math.PI * i / n;
        const rr = i % 2 ? r : R;
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.closePath();
    },
    star(ctx, x, y, R, fill = '#ffd166', line = 3) {
      this.starPath(ctx, x, y, R, R * 0.48);
      ctx.fillStyle = fill; ctx.fill();
      if (line) { ctx.lineWidth = line; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.stroke(); }
    },
    // Chunky outlined text (HUD numbers, "GO!")
    text(ctx, str, x, y, o = {}) {
      ctx.save();
      ctx.font = `800 ${o.size || 28}px "Comic Sans MS", "Chalkboard SE", "Trebuchet MS", sans-serif`;
      ctx.textAlign = o.align || 'center';
      ctx.textBaseline = o.base || 'middle';
      ctx.lineJoin = 'round';
      if (o.stroke !== false) { ctx.lineWidth = o.lineWidth || Math.max(4, (o.size || 28) / 5); ctx.strokeStyle = o.stroke || INK; ctx.strokeText(str, x, y); }
      ctx.fillStyle = o.color || '#fff';
      ctx.fillText(str, x, y);
      ctx.restore();
    },
    // A horizontal meter (heat, power, health)
    meter(ctx, x, y, w, h, frac, color, bg = '#fff') {
      this.box(ctx, x, y, w, h, h / 2, bg, 4);
      const f = Math.max(0, Math.min(1, frac));
      if (f > 0) { ctx.save(); this.rr(ctx, x, y, w, h, h / 2); ctx.clip(); ctx.fillStyle = color; ctx.fillRect(x, y, w * f, h); ctx.restore(); this.rr(ctx, x, y, w, h, h / 2); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
    },
  };

  // ------------------------------------------------------------------
  // Little SVG icons used by the menus (no text needed to understand them)
  // ------------------------------------------------------------------
  const S = (inner, vb = '0 0 48 48') => `<svg viewBox="${vb}" aria-hidden="true">${inner}</svg>`;
  const L = 'fill="none" stroke="#2b2b2b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"';
  const icons = {
    // touch buttons (Nov 23): a phone with ONE big button (one thumb) / with all its buttons
    thumbOne: S(`<rect x="3" y="10" width="42" height="28" rx="7" fill="#bde0fe" stroke="#2b2b2b" stroke-width="3.5"/><circle cx="33" cy="26" r="8.5" fill="#06d6a0" stroke="#2b2b2b" stroke-width="3"/><path d="M30 26 L33 23 L36 26" fill="none" stroke="#2b2b2b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`),
    thumbAll: S(`<rect x="3" y="10" width="42" height="28" rx="7" fill="#bde0fe" stroke="#2b2b2b" stroke-width="3.5"/><circle cx="11" cy="30" r="4.5" fill="#4cc9f0" stroke="#2b2b2b" stroke-width="2.5"/><circle cx="20" cy="30" r="4.5" fill="#4cc9f0" stroke="#2b2b2b" stroke-width="2.5"/><circle cx="29" cy="30" r="4.5" fill="#ef476f" stroke="#2b2b2b" stroke-width="2.5"/><circle cx="38" cy="29" r="5.5" fill="#06d6a0" stroke="#2b2b2b" stroke-width="2.5"/><circle cx="33" cy="19" r="4" fill="#ffb703" stroke="#2b2b2b" stroke-width="2.5"/>`),
    // age presets: a little kid (short, with a sprout on top) and a big kid (tall)
    little: S(`<path d="M24 22 C24 16 20 12 15 13 C15 18 19 22 24 22 C24 16 28 12 33 13 C33 18 29 22 24 22 Z" fill="#7bd389" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/><rect x="15" y="34" width="18" height="11" rx="6" fill="#4cc9f0" stroke="#2b2b2b" stroke-width="3.5"/><circle cx="24" cy="29" r="8" fill="#ffd6a5" stroke="#2b2b2b" stroke-width="3.5"/><circle cx="21" cy="28" r="1.6" fill="#2b2b2b"/><circle cx="27" cy="28" r="1.6" fill="#2b2b2b"/>`),
    big: S(`<rect x="14" y="20" width="20" height="25" rx="7" fill="#ef476f" stroke="#2b2b2b" stroke-width="3.5"/><path d="M14 26 L7 34 M34 26 L41 34" ${L}/><circle cx="24" cy="12" r="8" fill="#ffd6a5" stroke="#2b2b2b" stroke-width="3.5"/><circle cx="21" cy="11" r="1.6" fill="#2b2b2b"/><circle cx="27" cy="11" r="1.6" fill="#2b2b2b"/>`),
    home: S(`<path d="M6 24 L24 8 L42 24 M12 20 V40 H36 V20" ${L}/><rect x="20" y="28" width="8" height="12" fill="#ef476f"/>`),
    pause: S(`<rect x="12" y="10" width="8" height="28" rx="3" fill="#2b2b2b"/><rect x="28" y="10" width="8" height="28" rx="3" fill="#2b2b2b"/>`),
    play: S(`<path d="M16 9 L38 24 L16 39 Z" fill="#2b2b2b" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/>`),
    again: S(`<path d="M38 24 A14 14 0 1 1 30 11" ${L}/><path d="M24 6 L33 11 L26 19" ${L}/>`),
    next: S(`<path d="M14 8 L32 24 L14 40" ${L} stroke-width="7"/>`),
    gift: S(`<rect x="8" y="20" width="32" height="22" rx="4" fill="#ef476f" stroke="#2b2b2b" stroke-width="4"/><rect x="6" y="14" width="36" height="9" rx="3" fill="#ff8fab" stroke="#2b2b2b" stroke-width="4"/><path d="M24 14 V42" stroke="#ffd166" stroke-width="5"/><path d="M24 14 C16 2 8 8 16 14 M24 14 C32 2 40 8 32 14" fill="none" stroke="#2b2b2b" stroke-width="3.5" stroke-linecap="round"/>`),
    map: S(`<path d="M6 12 L18 7 L30 12 L42 7 V36 L30 41 L18 36 L6 41 Z" fill="#bde0fe" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><path d="M18 7 V36 M30 12 V41" stroke="#2b2b2b" stroke-width="3"/><path d="M10 30 Q16 22 22 26 T36 18" fill="none" stroke="#ef476f" stroke-width="3" stroke-dasharray="3 3"/>`),
    // "Show me" (Nov 24): a pointing hand on a yellow ball (the demo button) and an eye ("Watch!")
    showMe: S(`<circle cx="24" cy="24" r="20" fill="#ffd166" stroke="#2b2b2b" stroke-width="4"/><path d="M20 34 L20 15 C20 11 25.5 11 25.5 15 L25.5 24 C27 22 30.5 22.5 31 25 C32.5 23.5 36 24.5 36 27.5 L36 31 C36 37 33 41 27 41 L24.5 41 C21.5 41 19.5 39.5 17.5 37 L12.5 30.5 C11 28 14 25.5 16.5 27.5 Z" fill="#fff" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/>`),
    eye: S(`<path d="M3 24 C12 10 36 10 45 24 C36 38 12 38 3 24 Z" fill="#fff" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><circle cx="24" cy="24" r="9" fill="#4cc9f0" stroke="#2b2b2b" stroke-width="3"/><circle cx="24" cy="24" r="4" fill="#2b2b2b"/><circle cx="27" cy="21" r="2" fill="#fff"/>`),
    help: S(`<circle cx="24" cy="24" r="19" fill="#4cc9f0" stroke="#2b2b2b" stroke-width="4"/><path d="M17.5 18.5 C17.5 10 30.5 10 30.5 18 C30.5 23 24 23.5 24 29" fill="none" stroke="#2b2b2b" stroke-width="4.5" stroke-linecap="round"/><circle cx="24" cy="36" r="3" fill="#2b2b2b"/>`),
    menu: S(`<rect x="6" y="6" width="15" height="15" rx="4" fill="#ffd166" stroke="#2b2b2b" stroke-width="4"/><rect x="27" y="6" width="15" height="15" rx="4" fill="#06d6a0" stroke="#2b2b2b" stroke-width="4"/><rect x="6" y="27" width="15" height="15" rx="4" fill="#118ab2" stroke="#2b2b2b" stroke-width="4"/><rect x="27" y="27" width="15" height="15" rx="4" fill="#ef476f" stroke="#2b2b2b" stroke-width="4"/>`),
    sound: S(`<path d="M8 18 H16 L26 9 V39 L16 30 H8 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><path d="M32 16 Q38 24 32 32 M36 11 Q46 24 36 37" ${L} stroke-width="4"/>`),
    music: S(`<path d="M18 36 V12 L38 8 V32" ${L} stroke-width="4"/><circle cx="14" cy="36" r="6" fill="#9b5de5" stroke="#2b2b2b" stroke-width="4"/><circle cx="34" cy="32" r="6" fill="#9b5de5" stroke="#2b2b2b" stroke-width="4"/>`),
    musicOff: S(`<path d="M18 36 V12 L38 8 V32" fill="none" stroke="#999" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="14" cy="36" r="6" fill="#ccc" stroke="#2b2b2b" stroke-width="4"/><circle cx="34" cy="32" r="6" fill="#ccc" stroke="#2b2b2b" stroke-width="4"/><path d="M8 8 L42 42" stroke="#ef476f" stroke-width="5" stroke-linecap="round"/>`),
    mute: S(`<path d="M8 18 H16 L26 9 V39 L16 30 H8 Z" fill="#ccc" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><path d="M32 18 L42 30 M42 18 L32 30" ${L} stroke-width="4"/>`),
    lock: S(`<rect x="10" y="22" width="28" height="20" rx="5" fill="#ffd166" stroke="#2b2b2b" stroke-width="4"/><path d="M16 22 V15 A8 8 0 0 1 32 15 V22" ${L} stroke-width="4"/>`),
    star: (on = true) => S(`<path d="M24 4 L30 17 L44 18 L33 28 L37 43 L24 35 L11 43 L15 28 L4 18 L18 17 Z" fill="${on ? '#ffd166' : '#e8e2d4'}" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/>`),
    medal: (kind) => {
      const c = { gold: '#ffc93c', silver: '#c9d6df', bronze: '#e09f5a' }[kind] || '#eee';
      return S(`<path d="M16 4 L24 20 L32 4" fill="#ef476f" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/><path d="M22 4 L24 20 L26 4" fill="#118ab2"/><circle cx="24" cy="31" r="14" fill="${c}" stroke="#2b2b2b" stroke-width="3.5"/><path d="M24 23 L26.5 28.5 L32 29 L28 33 L29 38.5 L24 35.5 L19 38.5 L20 33 L16 29 L21.5 28.5 Z" fill="#fff" opacity="0.85"/>`);
    },
    trophy: S(`<path d="M14 6 H34 V18 A10 10 0 0 1 14 18 Z" fill="#ffc93c" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><path d="M14 10 H6 Q6 22 16 22 M34 10 H42 Q42 22 32 22" ${L} stroke-width="4"/><path d="M24 28 V36 M16 42 H32" ${L}/>`),
    rotate: S(`<rect x="14" y="6" width="20" height="36" rx="4" fill="#fff" stroke="#2b2b2b" stroke-width="4"/><circle cx="24" cy="36" r="2" fill="#2b2b2b"/>`),
    left: S(`<path d="M30 8 L14 24 L30 40" ${L} stroke-width="7"/>`),
    right: S(`<path d="M18 8 L34 24 L18 40" ${L} stroke-width="7"/>`),
    up: S(`<path d="M8 30 L24 14 L40 30" ${L} stroke-width="7"/>`),
    down: S(`<path d="M8 18 L24 34 L40 18" ${L} stroke-width="7"/>`),
    // generic "A"/"B" action buttons for the touch pad
    jump: S(`<path d="M24 6 L24 34 M12 18 L24 6 L36 18" ${L} stroke-width="6"/><ellipse cx="24" cy="42" rx="12" ry="3" fill="#2b2b2b"/>`),
    fire: S(`<circle cx="24" cy="24" r="14" fill="#ffd166" stroke="#2b2b2b" stroke-width="4"/><circle cx="24" cy="24" r="6" fill="#ef476f"/>`),
    gas: S(`<path d="M6 18 H26 V8 L44 24 L26 40 V30 H6 Z" fill="#06d6a0" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/>`),
    brake: S(`<rect x="10" y="12" width="28" height="24" rx="6" fill="#ef476f" stroke="#2b2b2b" stroke-width="4"/><path d="M18 24 H30" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`),
    turbo: S(`<path d="M4 12 L18 24 L4 36 Z M18 10 L34 24 L18 38 Z" fill="#ff8c42" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><path d="M36 10 L44 24 L36 38" fill="none" stroke="#ef476f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`),
  };

  // ------------------------------------------------------------------
  // DOM helpers
  // ------------------------------------------------------------------
  // A color mixed with white (k = 0..1), for soft backgrounds.
  function mixWhite(hex, k) {
    const n = parseInt(hex.replace('#', ''), 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
    const m = (c) => Math.round(c + (255 - c) * k).toString(16).padStart(2, '0');
    return '#' + m(r) + m(gg) + m(b);
  }

  function mixInk(hex, k) {   // darker version of a color (k = 0..1 toward black-ish ink)
    const n = parseInt(hex.replace('#', ''), 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
    const m = (c) => Math.round(c * (1 - k) + 30 * k).toString(16).padStart(2, '0');
    return '#' + m(r) + m(gg) + m(b);
  }

  // A game logo for the title screen, like a real game box:
  //  * a round badge with the game's picture inside, in front of a spinning starburst
  //  * the name in big chunky 3D letters (Lilita One font), slightly arched,
  //    with a color gradient, a thick outline and a shiny edge
  //  * an optional ribbon (tag) and twinkling sparkles
  //   Arcade.logo({ title: 'Treasure', title2: 'Trail', badge, colors: ['#ffe066', '#ff8c42'], tag: 'MINI' })
  // badge = SVG drawn in a 240x240 box (center 120,120) for the round badge
  // (older games pass `art` + `bg` instead: a 240x160 scene, zoomed to fit).
  // A two-word title is split onto two lines automatically.
  function logo(o) {
    const id = 'lg' + Math.random().toString(36).slice(2, 7);
    const [c1, c2] = o.colors || ['#ffe066', '#ff8c42'];
    let l1 = o.title, l2 = o.title2;
    if (!l2 && /\s/.test(l1)) { const w = l1.split(/\s+/); l1 = w[0]; l2 = w.slice(1).join(' '); }
    const deep = mixInk(c2, 0.55);                       // the 3D side of the letters
    const FONT = `'Lilita One', 'Arial Rounded MT Bold', 'Arial Black', sans-serif`;
    // one line of 3D text along a gentle arch
    let pathN = 0;
    const line = (text, y, bend) => {
      const size = Math.min(150, Math.round(1250 / Math.max(4, text.length)));
      const pid = id + 'p' + (pathN++);
      const tp = `<textPath href="#${pid}" startOffset="50%">${text}</textPath>`;
      let s = `<path id="${pid}" d="M20 ${y + bend} Q400 ${y - bend} 780 ${y + bend}" fill="none"/>`;
      const T = (attrs, dx = 0, dy = 0) => `<text text-anchor="middle" font-size="${size}" ${attrs} transform="translate(${dx} ${dy})">${tp}</text>`;
      s += T(`fill="#2b2b2b" stroke="#2b2b2b" stroke-width="26" stroke-linejoin="round"`, 0, 14);           // outline + shadow
      for (let k = 12; k > 0; k -= 2) s += T(`fill="${deep}" stroke="#2b2b2b" stroke-width="14" stroke-linejoin="round" paint-order="stroke fill"`, 0, k);   // 3D sides
      s += T(`fill="url(#${id}g)" stroke="#2b2b2b" stroke-width="12" stroke-linejoin="round" paint-order="stroke fill"`);   // face
      s += T(`fill="none" stroke="#ffffff" stroke-width="3" opacity="0.7"`, -2, -4);                       // shiny edge
      return s;
    };
    const tw = (x, y, k, sc = 1) => `<g transform="translate(${x} ${y}) scale(${sc})"><path class="lg-tw" style="animation-delay:${-k * 0.4}s" d="M0 -16 L4 -4 L16 0 L4 4 L0 16 L-4 4 L-16 0 L-4 -4 Z" fill="#fff" stroke="#2b2b2b" stroke-width="3"/></g>`;
    // the starburst behind the badge
    let burst = '';
    const N = 18, R1 = 205, R2 = 160;
    for (let i = 0; i < N * 2; i++) { const a = Math.PI * i / N, r = i % 2 ? R2 : R1; burst += (i ? 'L' : 'M') + (Math.cos(a) * r).toFixed(1) + ' ' + (Math.sin(a) * r).toFixed(1); }
    const H = 560, cy = 168;
    const svg = `<svg viewBox="0 0 800 ${H}" role="img" aria-label="${o.title} ${o.title2 || ''}">
      <style>.lg-art{animation:lgBob 1.6s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:center}
      .lg-tw{animation:lgTw 1.1s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:center}
      .lg-spin{animation:lgSpin 24s linear infinite;transform-box:view-box;transform-origin:400px ${cy}px}
      .lg-title{animation:lgIn .7s cubic-bezier(.3,1.6,.5,1) both;transform-box:view-box;transform-origin:400px 420px}
      @keyframes lgBob{to{transform:translateY(-6px)}} @keyframes lgTw{from{transform:scale(.4)}to{transform:scale(1.15) rotate(25deg)}}
      @keyframes lgSpin{to{transform:rotate(360deg)}} @keyframes lgIn{from{transform:scale(.4) rotate(-6deg);opacity:0}}
      @media (prefers-reduced-motion: reduce){.lg-art,.lg-tw,.lg-spin,.lg-title{animation:none}}</style>
      <defs>
        <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mixWhite(c1, 0.55)}"/><stop offset="0.45" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
        <radialGradient id="${id}b" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${mixWhite(c1, 0.35)}"/><stop offset="1" stop-color="${c2}"/></radialGradient>
        <clipPath id="${id}c"><circle cx="400" cy="${cy}" r="118"/></clipPath>
      </defs>
      <g class="lg-spin"><path d="${burst}Z" transform="translate(400 ${cy})" fill="url(#${id}b)" stroke="#2b2b2b" stroke-width="6" stroke-linejoin="round" opacity="0.95"/></g>
      <g class="lg-art">
        <circle cx="400" cy="${cy + 8}" r="134" fill="#2b2b2b"/>
        <circle cx="400" cy="${cy}" r="134" fill="#ffffff" stroke="#2b2b2b" stroke-width="7"/>
        <g clip-path="url(#${id}c)"><rect x="270" y="${cy - 130}" width="260" height="260" fill="${o.bg || '#ffffff'}"/>
          ${o.badge ? `<g transform="translate(280 ${cy - 120})">${o.badge}</g>`       // a picture made for the round badge
                    : `<g transform="translate(${400 - 180} ${cy - 128}) scale(1.5)">${o.art}</g>`}</g>
        <circle cx="400" cy="${cy}" r="118" fill="none" stroke="#2b2b2b" stroke-width="6"/>
        <path d="M318 ${cy - 70} A105 105 0 0 1 400 ${cy - 108}" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity="0.6"/>
      </g>
      <g class="lg-title" font-family="${FONT}" letter-spacing="3">
        ${l2 ? line(l1, 368, 16) + line(l2, 498, 12) : line(l1, 440, 18)}
        ${o.tag ? `<g transform="translate(400 ${l2 ? 540 : 520})"><path d="M-150 -26 H150 L130 0 L150 26 H-150 L-130 0 Z" fill="#ef476f" stroke="#2b2b2b" stroke-width="6" stroke-linejoin="round"/><text y="12" font-size="34" text-anchor="middle" fill="#fff" stroke="#2b2b2b" stroke-width="7" paint-order="stroke fill">${o.tag}</text></g>` : ''}
      </g>
      ${tw(150, 120, 0, 1.2)}${tw(660, 80, 1, 1.4)}${tw(690, 250, 2)}${tw(110, 290, 3, 0.9)}
    </svg>`;
    // (Nov 23) The canvas menus draw this logo again with Phaser, piece by piece, so each piece can move:
    // the starburst spins, the badge drops in and bobs, the name pops in and a shine sweeps across it.
    // They find the pieces from the SVG string with Arcade.logo.spec(svg). This SVG stays for the HTML menus.
    const badgeSVG = `<svg viewBox="0 0 300 300"><defs><clipPath id="${id}k"><circle cx="150" cy="150" r="118"/></clipPath></defs>
      <circle cx="150" cy="158" r="134" fill="#2b2b2b"/>
      <circle cx="150" cy="150" r="134" fill="#ffffff" stroke="#2b2b2b" stroke-width="7"/>
      <g clip-path="url(#${id}k)"><rect x="20" y="20" width="260" height="260" fill="${o.bg || '#ffffff'}"/>
        ${o.badge ? `<g transform="translate(30 30)">${o.badge}</g>` : `<g transform="translate(-30 22) scale(1.5)">${o.art}</g>`}</g>
      <circle cx="150" cy="150" r="118" fill="none" stroke="#2b2b2b" stroke-width="6"/>
      <path d="M68 80 A105 105 0 0 1 150 42" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity="0.6"/></svg>`;
    LOGO_SPECS.set(svg, { l1, l2, c1, c2, deep, light: mixWhite(c1, 0.55), burstIn: mixWhite(c1, 0.35), tag: o.tag || '', badge: badgeSVG });
    if (LOGO_SPECS.size > 40) LOGO_SPECS.delete(LOGO_SPECS.keys().next().value);   // (only the newest few are needed)
    return svg;
  }
  const LOGO_SPECS = new Map();
  logo.spec = (svg) => LOGO_SPECS.get(svg) || null;

  // A title screen that games outside the kit can use too (coloring book, maze):
  //   Arcade.titleScreen({ logo, background, music, onStart })
  // ------------------------------------------------------------------
  // Tap guard: right after the "Tap to start!" screen is tapped, ignore taps,
  // clicks and keys for half a second. Otherwise the same tap (or a second
  // excited one) lands on a menu button that just appeared under the finger.
  // ------------------------------------------------------------------
  let guardUntil = 0;
  function guardTaps(ms = 500) { guardUntil = performance.now() + ms; }
  for (const type of ['pointerdown', 'mousedown', 'touchstart', 'click', 'keydown']) {
    // "capture" = we see the event first, before any button does, and can swallow it
    addEventListener(type, (e) => {
      if (performance.now() < guardUntil) { e.stopImmediatePropagation(); if (e.cancelable && type !== 'touchstart') e.preventDefault(); }
    }, { capture: true, passive: false });
  }

  // the little hand that taps the big PLAY button on title screens ("tap here!")
  const TAP_HAND = `<svg class="ar-taphand" viewBox="0 0 48 48" aria-hidden="true"><path d="M18 26 V8 A4 4 0 0 1 26 8 V22 L36 24 A6 6 0 0 1 41 31 L39 40 A6 6 0 0 1 33 45 H22 A6 6 0 0 1 17 42 L9 31 A3.5 3.5 0 0 1 14 26 Z" fill="#fff" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/></svg>`;
  function titleScreen(o) {
    const el = h('div', { class: 'ar-titlescreen', style: `z-index:60;background:radial-gradient(circle at 50% 40%, ${mixWhite(o.background || '#4cc9f0', 0.45)} 0, ${o.background || '#4cc9f0'} 70%)` },
      `<div class="ar-logo">${o.logo}</div><div class="ar-tapstart" role="button" aria-label="Tap to start">${icons.play}${TAP_HAND}</div>`);
    const go = (e) => {
      if (e.type === 'keydown' && (e.code === 'Escape' || e.metaKey || e.ctrlKey)) return;
      if (e.cancelable) e.preventDefault();
      removeEventListener('keydown', go);
      audio.resume(); audio.sfx('go');
      el.remove();
      guardTaps();
      if (o.onStart) o.onStart();
    };
    el.addEventListener('pointerdown', go);
    addEventListener('keydown', go);
    if (o.music) {
      audio.keepPlaying(o.music);
      const c = audio.ensure();
      if (c && c.state !== 'running') {
        const btn = h('button', { type: 'button', class: 'ar-titlemusic', 'aria-label': 'Music on' }, icons.music);
        btn.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); audio.resume(); audio.keepPlaying(o.music); btn.remove(); });
        el.appendChild(btn);
        c.onstatechange = () => { if (c.state === 'running') btn.remove(); };
      }
    }
    document.body.appendChild(el);
    return el;
  }

  function h(tag, attrs = {}, html = '') {
    const e = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    if (html) e.innerHTML = html;
    return e;
  }
  function button(icon, label, cls, onClick) {
    return h('button', { class: 'ar-btn ' + (cls || ''), type: 'button', onclick: () => { audio.sfx('click'); onClick(); } },
      (icon || '') + (label ? `<span>${label}</span>` : ''));
  }
  function starsHTML(n, max = 3) {
    let s = '<span class="ar-stars">';
    for (let i = 0; i < max; i++) s += icons.star(i < n);
    return s + '</span>';
  }

  let toastTimer = null;
  function toast(html, icon = icons.trophy) {
    if (window.Arcade && window.Arcade.demoOn) return;   // (no news during the "Show me" demo)
    let t = document.querySelector('.ar-toast');
    if (!t) { t = h('div', { class: 'ar-toast' }); document.body.appendChild(t); }
    t.innerHTML = icon + '<span>' + html + '</span>';
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // Full-screen confetti for celebrations (its own little canvas + loop)
  function confetti(amount = 120) {
    if (calm()) return;
    const c = h('canvas', { class: 'ar-confetti' });
    document.body.appendChild(c);
    const ctx = c.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);
    const p = new Particles();
    for (let i = 0; i < amount; i++) {
      p.burst(Math.random() * innerWidth, -20, { count: 1, angle: Math.PI / 2, spread: 1.2, speed: 260, life: 3, size: 14, gravity: 300, shape: Math.random() < 0.5 ? 'square' : 'star' });
    }
    let last = performance.now();
    (function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      p.update(dt);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      p.draw(ctx);
      if (p.list.length) requestAnimationFrame(frame); else c.remove();
    })(last);
  }

  // ------------------------------------------------------------------
  // Arcade.start(config) — runs one game
  // ------------------------------------------------------------------
  // config = {
  //   id: 'bike', title: 'Turbo Bike Challenge',
  //   view: { w: 960, h: 540 },          // the game's drawing size
  //         (add flex: true, maxW: 1300 to let it stretch wider on wide screens; read g.W)
  //   background: '#87ceeb',             // page color around the game
  //   music: 'race',                     // song while playing (optional)
  //   howTo: [ { pic: '<svg>', text: 'Go!', keys: 'Right arrow' }, ... ],
  //   buttons: { left: [ {id:'ArrowUp', icon: Arcade.icons.up}, ...], right: [...] },
  //   levels: () => [ { id, name, pic, locked, meta } ],   // optional level picker
  //   setup(g, level),    // (re)build the game for a level  (called on start + restart)
  //   update(g, dt),      // move things; dt is always 1/120 s
  //   draw(g, ctx),       // paint everything in view coordinates
  //   onPause(g), onResume(g)  // optional
  // }
  function start(config) {
    const settings = store.settings();
    const save = store.game(config.id);
    store.markPlayed(config.id);           // shows up in "play again" on the hub
    // today's Daily Surprise is in this game? A little present pops up to say so (see arcade/daily.js)
    if (Arcade.daily) {
      const t = Arcade.daily.today();
      if (!t.done && t.ch.game === config.id) setTimeout(() => toast('Surprise!', Arcade.daily.gift(false)), 900);
    }
    document.body.classList.add('ar-game');
    if (config.background) document.body.style.setProperty('--ar-bg', config.background);
    const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    if (isTouch) document.body.classList.add('ar-touch');

    // ---- canvas menus (Nov 20): games with `canvasMenus: true` get their menus drawn with
    // Phaser + Rex UI (arcade/canvasmenu.js) instead of HTML panels. Each menu below builds a
    // "screen" for CM when it's on, and its old HTML panel otherwise.
    const CM = config.canvasMenus && window.ArcadeMenus ? window.ArcadeMenus : null;
    if (CM) { CM.starOn = icons.star(true); CM.starOff = icons.star(false); CM.lockIcon = icons.lock; }
    const starItems = (n) => [0, 1, 2].map(i => ({ svg: icons.star(i < n) }));
    const toArcade = () => { location.href = back.href; };

    // ---- page structure ----
    const stage = h('div', { class: 'ar-stage' });
    const canvas = h('canvas');
    stage.appendChild(canvas);
    document.body.appendChild(stage);
    const ctx = canvas.getContext('2d');
    if (CM) CM.boot();                       // (after the game's canvas, so the game's canvas stays the page's first one)

    const back = h('a', { class: 'round-btn ar-corner ar-back', href: config.home || '../index.html', 'aria-label': 'Back to arcade' }, icons.home);
    const pauseBtn = h('button', { class: 'round-btn ar-corner ar-pause', type: 'button', 'aria-label': 'Pause' }, icons.pause);
    document.body.append(back, pauseBtn);
    const rotateHint = h('div', { class: 'ar-rotate' }, icons.rotate + '<span>Turn me sideways!</span>');
    if (config.view.w > config.view.h) document.body.appendChild(rotateHint);
    // Phones held upright (Keith's plan, point 2): the wide games are tiny that way, so a big
    // picture asks to turn the phone, and the game waits. A small button underneath lets
    // grown-ups play upright anyway (for phones with the turning locked); remembered until
    // the browser tab is closed.
    let upright = false;
    try { upright = sessionStorage.getItem('ar-upright') === '1'; } catch (e) { /* no storage */ }
    const TURN_PIC = `<svg class="ar-turnpic" viewBox="0 0 120 120" aria-hidden="true"><g class="ar-turnphone"><rect x="38" y="14" width="44" height="92" rx="9" fill="#fff" stroke="#2b2b2b" stroke-width="6"/><rect x="46" y="26" width="28" height="64" rx="3" fill="#4cc9f0"/><circle cx="60" cy="98" r="3.5" fill="#2b2b2b"/></g><path d="M18 40 A46 46 0 0 1 40 12" fill="none" stroke="#ffd166" stroke-width="8" stroke-linecap="round"/><path d="M30 6 L44 10 L38 23" fill="none" stroke="#ffd166" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const UPRIGHT = `<svg viewBox="0 0 48 48"><rect x="14" y="4" width="20" height="40" rx="5" fill="#fff" stroke="#2b2b2b" stroke-width="4"/><path d="M20 17 L30 24 L20 31 Z" fill="#06d6a0" stroke="#2b2b2b" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
    const turnBox = h('div', { class: 'ar-turn', role: 'dialog', 'aria-label': 'Turn the phone sideways' }, TURN_PIC);
    const keepUpright = h('button', { type: 'button', class: 'ar-turnok', 'aria-label': 'Play upright' }, UPRIGHT);
    keepUpright.addEventListener('click', () => {
      audio.resume(); audio.sfx('click'); upright = true;
      try { sessionStorage.setItem('ar-upright', '1'); } catch (e) { /* no storage */ }
      resize();
    });
    turnBox.appendChild(keepUpright);
    if (config.view.w > config.view.h) document.body.appendChild(turnBox);
    let tallPhone = false;
    // the big "turn me" picture only covers the game while playing (menus work fine upright)
    const turnShowing = () => {
      const on = tallPhone && !upright && g.state === 'play';
      if (on !== document.body.classList.contains('ar-turnshow')) document.body.classList.toggle('ar-turnshow', on);
      return on;
    };

    const overlay = h('div', { class: 'ar-overlay' });
    document.body.appendChild(overlay);

    // ---- the game object handed to setup/update/draw ----
    const g = {
      W: config.view.w, H: config.view.h,
      ctx, canvas,
      // 'easy' | 'normal' | 'challenge' (games with `difficulty: false` are always 'normal')
      difficulty: profiles.little() ? 'easy' : config.difficulty === false ? 'normal' : settings.difficulty,
      // Little-kid preset for this player (see profiles.age): games add extra help when true
      little: profiles.little(),
      // how fast game time runs (1 = normal). Little kids get config.littleSpeed in
      // racing / action games, so everything moves a bit slower and there's more time to react.
      speed: 1,
      level: null,                              // the level object chosen in the picker
      time: 0,                                  // seconds of play since setup
      state: 'menu',                            // 'menu' | 'play' | 'paused' | 'over'
      particles: new Particles(),               // drawn on top of the game automatically
      juice: null,                              // game feel helpers (squash, dust, sparkle, tiny pause...): see makeJuice()
      save,                                     // this game's saved record (persisted by g.store())
      input: null,
      // pick a value by difficulty: g.pick(easy, normal, challenge)
      pick(e, n, c) { return { easy: e, normal: n, challenge: c }[this.difficulty]; },
      store() { store.save(); },
      sfx: (n) => audio.sfx(n),
      tone: (f, l, o) => audio.tone(f, l, o),
      toast,
      unlock(key, label) {
        if (demo) return false;               // (nothing the "Show me" demo does counts)
        if (save.unlocked.includes(key)) return false;
        save.unlocked.push(key); store.save();
        audio.sfx('unlock');
        toast('New: ' + label, icons.gift);
        return true;
      },
      isUnlocked(key) { return save.unlocked.includes(key); },
      // Trophies: one-time awards. If the game lists config.trophies, the trophy
      // room in the menu shows them (secret ones stay "???" until you earn them).
      achieve(key, label) {
        if (demo) return;
        if (save.achievements.includes(key)) return;
        save.achievements.push(key); store.save();
        const tr = (config.trophies || []).find(t => t.id === key);
        toast((tr ? 'Trophy: ' + tr.name : label) + (tr && tr.secret ? ' (secret!)' : ''), icons.trophy);
        if (Arcade.stickers) Arcade.stickers.check();      // a trophy can earn a sticker too (see arcade/stickers.js)
      },
      hasTrophy: (key) => save.achievements.includes(key),
      finish: (result) => finish(result),
      // steer the music while playing (see audio.setMood / audio.stinger):
      //   g.music.mood({ energy: 0..2, tempo: 1.08, key: 2, muffle: 0..1 })
      //   g.music.stinger('treasure' | 'streak' | 'lead' | 'lastlap' | 'boss')
      music: {
        mood: (m) => audio.setMood(m),
        stinger: (k) => { if (g.state === 'play') audio.stinger(k); },
        get: () => Object.assign({}, audio.mood),
      },
      play: (lv) => startLevel(lv),          // start a level right away (e.g. a custom one)
      showControls: () => showControls(currentLevel),   // the controls card (see showControls)
      panel: (el) => show(el),               // show a game's own menu panel
      hidePanel: () => hide(),
      pause: () => pause(),
      restart: () => restart(),
      menu: () => showLevels(),
      menuMusic: () => menuMusic(),          // start the menu song (e.g. in a game's own garage panel)
      help: () => showHowTo(() => showLevels(), 'Got it!'),   // the how-to-play pictures, then back to the menu
    };

    // ---- input ----
    const input = {
      keys: new Set(), pressed: new Set(),
      pointer: { x: 0, y: 0, down: false, startX: 0, startY: 0, justDown: false, justUp: false, id: null },
      down(...codes) { return codes.some(c => this.keys.has(c)); },
      // true once per key press
      hit(...codes) { const k = codes.find(c => this.pressed.has(c)); if (k) { this.pressed.delete(k); return true; } return false; },
    };
    g.input = input;
    const GAME_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space']);
    addEventListener('keydown', (e) => {
      // ("Show me" is playing: any key skips it, and isn't a game key)
      if (demo) { if (GAME_KEYS.has(e.code)) e.preventDefault(); if (!e.repeat && !e.metaKey && !e.ctrlKey && !e.altKey) demo.skip(); return; }
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (g.state === 'play') pause(); else if (g.state === 'paused') resume();
        return;
      }
      if (GAME_KEYS.has(e.code)) e.preventDefault();
      if (!input.keys.has(e.code)) input.pressed.add(e.code);
      input.keys.add(e.code);
      audio.resume();
    });
    addEventListener('keyup', (e) => { if (!demo) input.keys.delete(e.code); });
    addEventListener('blur', () => input.keys.clear());

    // pointer in view coordinates
    let scale = 1, offX = 0, offY = 0;
    function toView(e) {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
    }
    canvas.addEventListener('pointerdown', (e) => {
      audio.resume();
      if (input.pointer.id !== null && input.pointer.id !== e.pointerId) return;
      const p = toView(e);
      Object.assign(input.pointer, { x: p.x, y: p.y, startX: p.x, startY: p.y, down: true, justDown: true, id: e.pointerId });
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (input.pointer.id !== null && e.pointerId !== input.pointer.id) return;
      const p = toView(e); input.pointer.x = p.x; input.pointer.y = p.y;
    });
    const up = (e) => {
      if (e.pointerId !== input.pointer.id) return;
      const p = toView(e); input.pointer.x = p.x; input.pointer.y = p.y;
      input.pointer.down = false; input.pointer.justUp = true; input.pointer.id = null;
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);

    // On-screen touch buttons press "virtual keys", so games only check keys.
    // (Nov 23, new plan point 4: the touch pad.) Same rules in every game:
    //  - left pad = moving, right pad = doing; the game's main button (`main: true`, e.g. Jump or Gas)
    //    is the biggest and sits on the outside edge, where a thumb rests.
    //  - every button has its own color (`color`, or one picked from its key below): a pale tint
    //    when resting, and it LIGHTS UP (full color + a glow) while a finger is on it.
    //  - the whole pad listens, not each button: a thumb can roll from Left to Right (or Gas to Item)
    //    without lifting, a touch in the gap goes to the nearest button, and a thumb that slips a
    //    little off its button keeps holding it. Several fingers work at once (each is tracked).
    const PAD_COLORS = { ArrowLeft: '#4cc9f0', ArrowRight: '#4cc9f0', ArrowUp: '#4cc9f0', ArrowDown: '#4cc9f0',
      Space: '#06d6a0', KeyX: '#b388ff' };
    const pads = [];                    // { el, side, recs: [{ el, id, main }] }
    const padCount = new Map();         // key id -> how many fingers hold it
    const padHeld = new Map();          // pointer id -> the button it holds
    // a color as "r,g,b", so the CSS can make tints and glows of it
    const rgbOf = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(','); };
    function padPress(rec) {
      const n = padCount.get(rec.id) || 0;
      if (!n) {
        if (!input.keys.has(rec.id)) input.pressed.add(rec.id);
        input.keys.add(rec.id);
      }
      padCount.set(rec.id, n + 1);
      rec.el.classList.add('down');
    }
    function padRelease(rec) {
      const n = (padCount.get(rec.id) || 1) - 1;
      if (n <= 0) { padCount.delete(rec.id); input.keys.delete(rec.id); }
      else padCount.set(rec.id, n);
      // (the light stays on while another finger still holds the same button)
      if (![...padHeld.values()].some(r => r === rec)) rec.el.classList.remove('down');
    }
    function padHold(pid, rec) {
      const prev = padHeld.get(pid);
      if (prev === rec) return;
      if (rec) padHeld.set(pid, rec); else padHeld.delete(pid);
      if (prev) padRelease(prev);
      if (rec) { audio.resume(); padPress(rec); }
    }
    // which button is a finger on? The nearest one, if it's close enough. `reach` = how far
    // from a button's middle still counts, in button radiuses.
    function padAt(pad, x, y, reach) {
      let best = null, bestD = Infinity;
      for (const rec of pad.recs) {
        const r = rec.el.getBoundingClientRect();
        if (!r.width) continue;
        const rad = r.width / 2, d = Math.hypot(x - (r.left + rad), y - (r.top + r.height / 2)) / rad;
        if (d < bestD) { bestD = d; best = rec; }
      }
      return bestD <= reach ? best : null;
    }
    function padReset() { for (const pid of [...padHeld.keys()]) padHold(pid, null); }
    // "One thumb" mode (Nov 23, new plan point 4, part 2; profiles.oneThumb): a game can hand in a 2nd,
    // smaller set of buttons, config.oneThumb = { buttons: { left, right }, stack: ['right'], howTo: [...] },
    // and help more while g.oneThumb is true (drive by itself, aim for you...). Both sets are built; the
    // body class ar-thumb picks which one shows (`full` pads or `thumb` pads). `stack` = that side's
    // buttons go one above the other (Up over Down). howTo = the controls card's pictures for it.
    function makePads(buttons, kind, stack) {
      for (const side of ['left', 'right']) {
        const list = buttons[side] || [];
        if (!list.length) continue;
        const pad = { el: h('div', { class: 'ar-pad ' + side + ' ' + kind + (stack && stack.includes(side) ? ' stack' : '') }), side, kind, recs: [] };
        for (const b of list) {
          const el = h('button', { type: 'button', 'aria-label': b.label || b.id, 'data-key': b.id, class: b.main ? 'main' : '' }, b.icon);
          el.style.setProperty('--pc', rgbOf(b.color || PAD_COLORS[b.id] || '#ffd166'));
          pad.el.appendChild(el);
          pad.recs.push({ el, id: b.id, main: !!b.main });
        }
        const el = pad.el;
        el.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          const rec = padAt(pad, e.clientX, e.clientY, 1.6);
          if (!rec) return;
          try { el.setPointerCapture(e.pointerId); } catch (err) { /* (old browsers) */ }
          padHold(e.pointerId, rec);
        });
        el.addEventListener('pointermove', (e) => {
          const cur = padHeld.get(e.pointerId);
          if (!cur) return;
          const next = padAt(pad, e.clientX, e.clientY, 1.05);        // rolled onto another button?
          if (next && next !== cur) { padHold(e.pointerId, next); return; }
          if (!next && !padAt(pad, e.clientX, e.clientY, 2.3)) padHold(e.pointerId, null);   // wandered far away
        });
        const up = (e) => { if (padHeld.has(e.pointerId)) padHold(e.pointerId, null); };
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
        el.addEventListener('lostpointercapture', up);
        el.addEventListener('contextmenu', (e) => e.preventDefault());   // (a long press must not open a menu)
        document.body.appendChild(el);
        pads.push(pad);
      }
    }
    if (config.buttons) makePads(config.buttons, 'full');
    if (config.buttons && config.oneThumb) makePads(config.oneThumb.buttons, 'thumb', config.oneThumb.stack);
    g.oneThumb = false;
    // switch between all the buttons and one thumb (startLevel does it from the player's setting; tests too)
    g.setOneThumb = (on) => {
      g.oneThumb = !!(on && config.oneThumb);
      document.body.classList.toggle('ar-thumb', g.oneThumb);
      padReset();
    };
    // tests: where the buttons are, which are lit, which keys are held
    window.__pads = () => ({ keys: [...input.keys], thumb: g.oneThumb, pads: pads.map(p => ({ side: p.side, kind: p.kind, shown: getComputedStyle(p.el).display !== 'none', buttons: p.recs.map(r => {
      const b = r.el.getBoundingClientRect();
      return { id: r.id, main: r.main, down: r.el.classList.contains('down'), shown: !!r.el.offsetParent,
        x: b.left, y: b.top, w: b.width, h: b.height, color: r.el.style.getPropertyValue('--pc') };
    }) })) });

    // ---- sizing: letterbox the view into the window ----
    function resize() {
      redrawNow = true;                                  // (a resized canvas is blank: draw it again at once, even when paused)
      // how many real pixels we draw per screen dot: sharp screens get 2, "lite" (slow devices) 1 or less
      const dpr = lite === 2 ? 0.7 : Math.min(lite ? 1 : 2, window.devicePixelRatio || 1);
      const fit = isPhone() ? PHONE_FIT : 1;             // phones: 90% of the screen
      // (minus the room the notch / rounded corners / home bar take: the stage's padding, see shared.css)
      const st = getComputedStyle(stage), notchW = (parseFloat(st.paddingLeft) || 0) + (parseFloat(st.paddingRight) || 0), notchH = (parseFloat(st.paddingTop) || 0) + (parseFloat(st.paddingBottom) || 0);
      const availW = Math.min(innerWidth * fit, innerWidth - notchW) - 8, availH = Math.min(innerHeight * fit, innerHeight - notchH) - 8;
      // view.flex: the game can be drawn wider than view.w (up to view.maxW) so a
      // wide phone screen is filled edge to edge instead of showing bars on the sides
      if (config.view.flex) g.W = Math.round(Math.max(config.view.w, Math.min(config.view.maxW || config.view.w * 1.4, g.H * availW / availH)));
      scale = Math.min(availW / g.W, availH / g.H);
      const cssW = Math.floor(g.W * scale), cssH = Math.floor(g.H * scale);
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
      offX = (innerWidth - cssW) / 2; offY = (innerHeight - cssH) / 2;
      const tall = innerHeight > innerWidth * 1.1 && config.view.w > config.view.h && innerWidth < 900;
      document.body.classList.toggle('ar-tall', tall);
      tallPhone = tall && isPhone();
      drawFrame();
    }
    addEventListener('resize', resize);
    addEventListener('orientationchange', () => setTimeout(resize, 200));

    // ---- "lite" drawing for older tablets (Nov 16) ----
    // Drawing fewer pixels is by far the biggest speed-up for a canvas game. So while a
    // level is playing we keep an eye on how long the frames take. Slower than about
    // 33 frames a second for a while? Switch to lite: draw at half the sharpness (then
    // the browser stretches the picture) and make fewer sparkles. Still slow? One more
    // step down. The device remembers it's slow (Arcade.parent.markSlow), so next time
    // games start in lite right away. Grown-ups can force it on or off in the Parent corner.
    //   lite: 0 = sharp, 1 = fast, 2 = fastest
    const PA = window.Arcade && window.Arcade.parent;
    let lite = PA && PA.lite() ? 1 : 0;
    const autoLite = !PA || PA.load().gfx === 'auto';
    let slowAvg = 16, slowN = 0;
    Particles.lite = lite > 0;
    function watchSpeed(ms) {
      if (!autoLite || lite >= 2 || ms > 250) return;      // (a long gap = the tab was away, not a slow frame)
      slowAvg += (ms - slowAvg) * 0.04; slowN++;
      if (slowN > 150 && slowAvg > 30) {
        lite++; slowN = 0; slowAvg = 16;
        Particles.lite = true;
        if (PA) PA.markSlow();
        resize();
      }
    }
    g.juice = makeJuice(g);                                 // (game feel: see makeJuice above)

    // ---- The Star Road (Nov 24, new plan point 8): stars in this game unlock new looks ----
    // config.looks = { kinds: ['hat', 'trail'] (or 'color': a paint job, Turbo Bike + Mini RC Racers), max: (g) => most stars there are (optional) }
    // Saved in save.looks = { best, got: [ids], fresh: [ids not seen yet], hat, trail }.
    // `best` = the most stars this player ever had here, so "New game" (which wipes the levels)
    // never takes a look away.
    function lookSave() {
      if (!save.looks) save.looks = { best: 0, got: [], fresh: [], hat: null, trail: null };
      return save.looks;
    }
    function starsNow() {
      let n = 0;
      for (const k in save.levels) if (!/^fr-/.test(k)) n += save.levels[k].stars || 0;
      return n;
    }
    // the road: the looks this game has, in the order they unlock, each with the stars it needs
    // (spread out over at most three quarters of all the stars there are, so every player gets them all
    // without needing every last star; the first one comes after only a couple of stars)
    let roadCache = null;
    function starRoad() {
      if (!config.looks) return [];
      if (roadCache) return roadCache;
      const kinds = (config.looks.kinds || ['hat', 'trail']).filter(k => looks.KINDS[k]);
      const list = [];
      for (let i = 0; i < 4; i++) for (const k of kinds) list.push({ kind: k, ...looks.KINDS[k][i] });
      let max = config.looks.max ? config.looks.max(g) : 0;
      if (!max && config.levels) max = config.levels(g).filter(l => !/^fr-/.test(l.id || '') && !l.noStars).length * 3;
      max = Math.max(max, list.length * 2);
      // the first after 2 stars, then evenly up to three quarters of them, but never more than 8 apart
      const step = Math.min(8, (max * 0.75 - 2) / Math.max(1, list.length - 1));
      list.forEach((r, i) => { r.stars = i ? Math.max(list[i - 1].stars + 1, Math.round(2 + step * i)) : 2; });
      return (roadCache = list);
    }
    // count the stars, unlock what they reach; returns the NEW looks (fresh ones the player hasn't seen)
    function checkLooks() {
      if (!config.looks || (window.Arcade && window.Arcade.demoOn)) return [];
      const L = lookSave();
      L.best = Math.max(L.best || 0, starsNow());
      const fresh = starRoad().filter(r => L.best >= r.stars && !L.got.includes(r.id));
      for (const r of fresh) { L.got.push(r.id); L.fresh.push(r.id); }
      if (fresh.length) store.save();
      return fresh;
    }
    function nextLook() { const L = lookSave(); return starRoad().find(r => !L.got.includes(r.id)) || null; }
    function wear(kind, id) { const L = lookSave(); L[kind] = L[kind] === id ? null : id; store.save(); }
    // what the player has on (only looks they really have; a demo wears them too)
    const worn = (kind) => { const L = save.looks; const id = L && L[kind]; return id && L.got.includes(id) ? id : null; };
    const trailMem = {};
    let rainbowI = 0, trailCount = 0;
    g.looks = {
      get hat() { return config.looks ? worn('hat') : null; },
      get trailId() { return config.looks ? worn('trail') : null; },
      get colorId() { return config.looks ? worn('color') : null; },
      // (colors, Nov 24) the color to paint the bike / car with right now, or null = its own paint
      paint(t = g.time) { const id = this.colorId; return id ? looks.colorAt(id, t) : null; },
      // take a look off (e.g. picking a paint in a shop takes the Star Road color off, so the new paint shows)
      takeOff(kind) { const L = lookSave(); if (L[kind]) { L[kind] = null; store.save(); } },
      // call every step with where the trail comes out; it lets out a bit now and then while moving.
      // o: to (your own world-space Particles; default g.particles), key (several things with trails),
      //    on (false = don't add any now: standing still, hidden...), scale (bigger / smaller bits),
      //    angle + speed (the bits fly off that way), always (even when it isn't moving: a ship in scrolling space)
      trail(x, y, o = {}) {
        const id = this.trailId;
        if (!id || o.on === false) return;
        const tr = looks.TRAILS.find(t => t.id === id), key = o.key || 'me';
        const m = trailMem[key] || (trailMem[key] = { t: -1, x, y });
        if (g.time < m.t) m.t = -1;                         // (a new round: the clock started again)
        const every = tr.every * (calm() ? 1.6 : 1);
        if (g.time - m.t < every) return;
        if (!o.always && Math.hypot(x - m.x, y - m.y) < 2.5 * (o.scale || 1) && m.t >= 0) { m.t = g.time; return; }   // (not moving: nothing)
        m.t = g.time; m.x = x; m.y = y;
        const bit = Object.assign({}, tr.bit);
        if (o.scale) bit.size *= o.scale;
        // (o.angle + o.speed: the bits fly off that way, e.g. out of a spaceship's engine; o.always = even when not moving)
        if (o.angle != null) { bit.angle = o.angle; bit.spread = 0.5; bit.speed = o.speed || 120; bit.gravity = 0; }
        if (tr.rainbow) bit.colors = [looks.RAINBOW[rainbowI++ % looks.RAINBOW.length]];
        (o.to || g.particles).burst(x, y, bit);
        trailCount++;
      },
      // (Nov 24, part 4) a one-off puff of the worn trail's bits, for games where you TAP instead of move
      // (Bubble School: where the finger touches; Piano Star: out of the key you press).
      // o: to, scale, count (how many bits), angle + spread (the way they fly; default all round), speed
      splash(x, y, o = {}) {
        const id = this.trailId;
        if (!id) return;
        const tr = looks.TRAILS.find(t => t.id === id);
        const bit = Object.assign({}, tr.bit);
        bit.count = Math.max(1, Math.round((o.count || 6) * (calm() ? 0.5 : 1)));
        bit.size *= o.scale || 1;
        bit.speed = o.speed || 140;
        bit.life = Math.max(bit.life, 0.7);
        bit.drag = 2;
        if (o.angle != null) { bit.angle = o.angle; bit.spread = o.spread || 1.2; }
        if (tr.rainbow) bit.colors = looks.RAINBOW;
        (o.to || g.particles).burst(x, y, bit);
        trailCount += bit.count;
      },
      info: () => ({ trails: trailCount, hat: g.looks.hat, trail: g.looks.trailId, color: g.looks.colorId }),   // (for tests)
      road: () => starRoad(),
      check: () => checkLooks(),
      // (for games with their own main menu, like Mini RC Racers: open the Looks screen; back = where Back goes)
      screen: (back) => looksScreen(back),
      fresh: () => !!(config.looks && lookSave().fresh.length),
      next: () => nextLook(),
      stars: () => lookSave().best || 0,
    };
    checkLooks();            // (stars earned before the Star Road came along count right away: they show as NEW)

    // the Looks screen: the stars you have, the next look and every hat / trail (tap one to put it on / take it off)
    function looksScreen(back) {
      const L = lookSave(), road = starRoad(), nx = nextLook();
      const rows = [];
      const chips = [{ svg: icons.star(true), text: String(L.best || 0) }];
      if (nx) chips.push({ svg: nx.svg, text: (L.best || 0) + '/' + nx.stars });
      rows.push({ t: 'chips', items: chips });
      // one column per kind (hats | trails), side by side (one under the other on an upright phone, bigger there)
      const cols = [], upr = innerWidth < innerHeight;
      const kinds3 = (config.looks.kinds || []).length > 2;   // (3 kinds, Turbo Bike: two side by side, the third under them)
      for (const kind of (config.looks.kinds || ['hat', 'trail'])) {
        const mine = road.filter(r => r.kind === kind);
        if (!mine.length) continue;
        const items = mine.map(r => {
          const have = L.got.includes(r.id);
          // (pictures only; one still to earn shows how many stars it needs + a padlock)
          return { pic: r.svg, label: r.name, attr: 'look-' + r.id, picked: have && L[kind] === r.id, locked: !have,
            badge: have && L.fresh.includes(r.id) ? looks.NEW : null,
            meta: have ? [] : [{ svg: icons.star(true) }, { text: String(r.stars) }],
            onTap: () => {
              if (!have) { audio.sfx('bonk'); return; }
              audio.sfx(L[kind] === r.id ? 'click' : 'sparkle'); wear(kind, r.id); looksScreen(back);
            } };
        });
        cols.push({ w: 370, rows: [{ t: 'heading', text: looks.NAMES[kind] || kind }, { t: 'tiles', w: upr ? 86 : 80, h: upr ? 124 : kinds3 ? 100 : 118, items }] });
      }
      if (kinds3 && !upr) { rows.push({ t: 'cols', cols: cols.slice(0, 2), gap: 24 }); rows.push(...cols[2].rows); }
      else rows.push(cols.length > 1 ? { t: 'cols', cols, gap: 24 } : cols[0].rows[1]);
      showScreen({ id: 'looks', title: 'Looks', rows,
        footer: { t: 'buttons', items: [{ icon: icons.left, label: 'Back', color: 'white', attr: 'back', onTap: () => {
          audio.sfx('click'); L.fresh = []; store.save(); (back || shellMenu)();
        } }] },
        onKey: (c) => { if (c === 'Escape') { L.fresh = []; store.save(); (back || shellMenu)(); } } });
    }
    // the big "New!" moment after a round that reached a new look: then the results as usual
    function newLookScreen(fresh, then) {
      const L = lookSave(), first = fresh[fresh.length - 1];
      audio.sfx('unlock');
      [784, 988, 1175, 1568].forEach((f, i) => setTimeout(() => audio.tone(f, 0.18, { type: 'triangle', vol: 0.22 }), 250 + i * 130));
      setTimeout(() => confetti(160), 200);
      const done = () => { L.fresh = L.fresh.filter(id => !fresh.some(r => r.id === id)); store.save(); then(); };
      showScreen({ id: 'newlook', banner: 'New!', bannerColor: '#9d4edd', fit: true, rows: [
        { t: 'pics', items: [first.svg], size: fresh.length > 1 ? 170 : 220, glow: true },
        { t: 'text', text: first.name + '!', size: 34, big: true, color: '#ffd166' },
      ].concat(fresh.length > 1 ? [{ t: 'pics', items: fresh.slice(0, -1).slice(-4).map(r => r.svg), size: 70 }] : []), footer: { t: 'buttons', items: [
        { icon: first.svg, label: 'Wear it!', color: 'big', attr: 'wear', onTap: () => {
          audio.sfx('sparkle'); for (const r of fresh) L[r.kind] = r.id; done();
        } },
        { icon: icons.next, label: 'OK', color: 'white', attr: 'ok', onTap: () => { audio.sfx('click'); done(); } },
      ] }, onKey: (c) => { if (c === 'Enter' || c === 'Space' || c === 'Escape') done(); } });
    }
    g.lite = () => lite;                                    // (for tests and curious games)
    g.setLite = (n) => { lite = n; Particles.lite = n > 0; resize(); };

    // ---- the loop ----
    let acc = 0, last = performance.now(), raf = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      perf.frames++;
      if (g.state === 'play') watchSpeed(now - last);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (demo && demo.ending) {             // "Your turn!": the game stands still, then starts fresh
        acc = 0; demo.wait -= dt;
        if (demo.wait <= 0) stopDemo();
      } else if (g.state === 'play' && (turnShowing() || controlsCard)) { acc = 0; input.pressed.clear(); }   // waiting for the phone to turn / the controls card
      else if (g.state === 'play') {
        acc += dt * g.speed;              // (little kids: game time runs a bit slower)
        let steps = 0;
        while (acc >= STEP) {
          acc -= STEP;
          // a tiny pause on a big hit (g.juice.stop): the game stands still for a blink (taps wait for it)
          if (g.juice.frozen()) { g.juice.step(STEP); continue; }
          steps++;
          g.time += STEP;
          if (demo && !demo.ending) demoStep(STEP);   // ("Show me": the hand presses for the game)
          config.update(g, STEP);
          g.particles.update(STEP);
          g.juice.step(STEP);
          input.pointer.justDown = false;
          input.pointer.justUp = false;
          if (g.state !== 'play') { acc = 0; break; }
        }
        // forget taps the game didn't use — but only after the game has had a turn.
        // (On fast 120 Hz+ screens some frames run no game step at all; clearing then
        //  would swallow a jump press before the game ever saw it.)
        if (steps > 0) input.pressed.clear();
      } else if (g.state === 'over') {
        g.particles.update(dt); // let the last sparkles finish
      }
      // Less work, less battery (Nov 24, point 9): while the game is PAUSED nothing in it moves, so its picture is
      // drawn once a second (and at once after a resize or when the state changes); behind a menu ('menu' / 'over')
      // 30 times a second instead of every screen refresh (60, or 120 on fast tablets). Playing = every frame.
      const gap = demo ? 0 : g.state === 'paused' ? 1000 : (g.state === 'menu' || g.state === 'over') ? 30 : 0;
      if (!gap || redrawNow || drawnState !== g.state || now - lastDraw >= gap) {
        drawFrame(); perf.draws++;
        lastDraw = now; redrawNow = false; drawnState = g.state;
      }
      if (demo) demoDraw();
    }
    var lastDraw = 0, redrawNow = true, drawnState = '';   // (var: resize() sets redrawNow before this line has run)
    function drawFrame() {
      ctx.save();
      const sh = g.state === 'play' && g.juice.offset();   // (g.juice.shake: the whole picture jiggles a little)
      if (sh) ctx.translate(sh.x, sh.y);
      config.draw(g, ctx);
      g.particles.draw(ctx);
      ctx.restore();
      g.juice.drawFlash(ctx);
    }

    // ---- menus ----
    function show(panel) {
      closeControls();
      if (CM && CM.isOpen) CM.close();                  // (a game's own HTML panel replaces a canvas menu)
      // a game can make every panel the same size (config.panelClass adds its own CSS class)
      if (config.panelClass && panel.classList.contains('ar-panel')) panel.classList.add(...config.panelClass.split(' '));
      if (panel.classList.contains('ar-panel') && (!config.panelClass || panel.classList.contains('ar-results'))) panel.classList.add('ar-arcade');   // the dark arcade-cabinet look (results always get it)
      overlay.innerHTML = '';
      overlay.appendChild(panel);
      overlay.classList.add('show');
      document.body.classList.add('ar-menu-open');      // (hides the on-screen driving buttons)
      padReset();                                       // (and lets go of any held ones)
      fitPanel();
      popIn(panel);                                     // (bouncy entrance, if GSAP is here)
    }
    // Make the open menu fit the screen: if it's taller or wider than the window
    // (phones held sideways!), shrink the whole panel evenly instead of cutting it off.
    // Games with their own panel sizing (config.panelClass, like RC) are left alone.
    function fitPanel() {
      const panel = overlay.firstElementChild;
      if (!panel || config.panelClass || !panel.classList.contains('ar-panel') || !overlay.classList.contains('show')) return;
      setZoom(panel, 1);
      // room around the panel: the overlay's padding (5% on phones, more next to a notch) + a little gap
      const os = getComputedStyle(overlay);
      const pad = 8 + (parseFloat(os.paddingLeft) || 0) + (parseFloat(os.paddingRight) || 0);
      const padH = 8 + (parseFloat(os.paddingTop) || 0) + (parseFloat(os.paddingBottom) || 0);
      // very long lists (like Piano Star's 58 songs) scroll up and down instead of shrinking,
      // so the buttons stay big enough for little fingers
      // Also: a menu that would have to shrink a LOT to fit the height (a small phone, a long level list)
      // scrolls instead, so its tiles stay big enough to tap (Nov 20).
      const kw = (innerWidth - pad) / panel.offsetWidth, kh = (innerHeight - padH) / panel.offsetHeight;
      const scroll = panel.classList.contains('ar-scroll') || (kh < 0.72 && kh < kw);
      overlay.classList.toggle('ar-scrolling', scroll);
      const k = Math.min(1, kw, scroll ? 1 : kh);
      setZoom(panel, k < 0.98 ? k : 1);
    }
    addEventListener('resize', fitPanel);
    // menus that change inside (tabs, pickers) get re-fitted too
    new MutationObserver(() => requestAnimationFrame(fitPanel)).observe(overlay, { childList: true, subtree: true });
    function hide() { overlay.classList.remove('show'); overlay.innerHTML = ''; document.body.classList.remove('ar-menu-open'); if (CM) CM.close(); }
    // a canvas menu: the HTML overlay goes away, Phaser draws the screen
    function showScreen(screen) {
      closeControls();
      overlay.classList.remove('show'); overlay.innerHTML = '';
      CM.open(screen);
    }

    // the level "Show me" plays from a menu: the one you're on, else the next one to play
    function demoLevel() {
      if (currentLevel) return currentLevel;
      if (!config.levels) return null;
      const n = nextLevel(config.levels(g));
      return n ? n.lv : null;
    }
    function showHowTo(then, label, noDiff) {
      if (CM) {
        showScreen({ id: 'help', title: config.title, rows: [{ t: 'tiles', w: 170, h: 190,
          items: (config.howTo || []).map(s => ({ pic: s.pic, name: s.text, meta: s.keys ? [{ text: s.keys }] : [] })) }],
          footer: { t: 'buttons', items: [{ icon: noDiff ? icons.left : icons.play, label: label || 'Play!', color: noDiff ? 'white' : 'big', attr: 'ok', onTap: () => { audio.sfx('click'); then(); } }]
            .concat(config.showMe ? [{ icon: icons.showMe, label: 'Show me', color: 'yellow', attr: 'showme', onTap: () => { audio.resume(); audio.sfx('click'); startDemo(demoLevel()); } }] : []) },
          onKey: (c) => { if (c === 'Enter' || c === 'Space' || c === 'Escape') then(); } });
        return;
      }
      show(howToPanel(then, label, noDiff));
    }
    function howToPanel(then, label, noDiff) {
      const p = h('div', { class: 'ar-panel wide' });
      p.appendChild(h('h1', { class: 'ar-title' }, config.title));
      const steps = h('div', { class: 'ar-steps' });
      for (const s of config.howTo || []) {
        steps.appendChild(h('div', { class: 'ar-step' },
          `<div class="pic">${s.pic}</div><div>${s.text}</div>` + (s.keys ? `<div class="keys">${s.keys}</div>` : '')));
      }
      p.appendChild(steps);
      const btns = h('div', { class: 'ar-btns' });
      btns.appendChild(button(noDiff ? icons.left : icons.play, label || 'Play!', noDiff ? 'white' : 'big', then));
      if (config.showMe) btns.appendChild(button(icons.showMe, 'Show me', 'yellow', () => { audio.resume(); startDemo(demoLevel()); }));
      p.appendChild(btns);
      return p;
    }

    // Level picker (only for games that have levels)
    function showLevels() {
      g.state = 'menu';
      if (config.menuMusic) menuMusic(); else stopPlay();
      // a game can draw its own main menu (with sub menus) instead of the level grid
      if (config.mainMenu) { config.mainMenu(g); return; }
      if (!config.levels) { startLevel(null); return; }
      // games with a logo get the video-game menu: one big START, everything else tucked away
      if (config.logo) { shellMenu(); return; }
      levelGrid();
    }
    // The old level picker (also the "Levels" page of the video-game menu).
    let levelTab = null;                 // (the open tab of a level picker with tabs: config.levelTabs)
    function levelGrid(onBack) {
      const all = config.levels(g);
      if (CM) {
        const items = [];
        let section = null;
        // A long list with sections (Piano Star's 64 songs, Nov 21): picture TABS along the top, one section at a
        // time, instead of one very long list. config.levelTabs = { 'section name': { icon, label } }.
        const secs = [...new Set(all.filter(l => l.section).map(l => l.section))];
        const tabbed = !!config.levelTabs && secs.length > 1;
        if (tabbed && !secs.includes(levelTab)) {
          // (first time: the tab of the level played last, or the first tab)
          levelTab = (currentLevel && all.find(l => l.id === currentLevel.id) || {}).section || secs[0];
        }
        for (const lv of all) {
          if (tabbed) { if (lv.section !== levelTab) continue; }
          else if (lv.section && lv.section !== section) { section = lv.section; items.push({ heading: section }); }
          const rec = save.levels[lv.id] || {};
          const meta = lv.meta != null ? CM.split(lv.meta) : (rec.medal ? [{ svg: icons.medal(rec.medal) }] : []).concat(rec.stars != null ? starItems(rec.stars) : []);
          items.push({ pic: lv.pic, name: lv.name, meta, locked: lv.locked, attr: 'level-' + lv.id,
            onTap: () => { if (lv.locked) { audio.sfx('bonk'); return; } audio.sfx('click'); startLevel(lv); } });
        }
        const rows = [{ t: 'tiles', items }];
        // (a game's extra stuff under the levels, as screen rows: config.extraRows(g, redraw))
        if (config.extraRows && !onBack) rows.push(...config.extraRows(g, () => levelGrid(onBack)));
        const out = onBack ? { icon: icons.left, label: 'Back', color: 'white', attr: 'back', onTap: () => { audio.sfx('click'); onBack(); } }
          : { icon: icons.home, label: 'Arcade', color: 'white', attr: 'arcade', onTap: toArcade };
        const top = tabbed ? { t: 'round', items: secs.map((sec, i) => {
          const tb = config.levelTabs[sec] || {};
          return { icon: tb.icon || all.find(l => l.section === sec).pic, label: tb.label || sec, attr: 'tab-' + i, picked: sec === levelTab,
            onTap: () => { if (sec === levelTab) return; audio.sfx('click'); levelTab = sec; levelGrid(onBack); } };
        }) } : null;
        showScreen({ id: 'levels', title: config.levelsTitle || 'Pick a level', top, rows, footer: { t: 'buttons', items: [out] },
          tab: tabbed ? levelTab : null,
          onKey: (c) => { if (c === 'Escape' && onBack) onBack(); } });
        return;
      }
      const p = h('div', { class: 'ar-panel wide' + (all.length > 24 ? ' ar-scroll' : '') });   // (long lists scroll)
      p.appendChild(h('h1', { class: 'ar-title' }, config.levelsTitle || 'Pick a level'));
      const grid = h('div', { class: 'ar-grid' });
      let section = null;
      for (const lv of all) {
        // optional headings: give levels a `section` name to split the grid
        if (lv.section && lv.section !== section) {
          section = lv.section;
          grid.appendChild(h('h2', { class: 'ar-title', style: 'grid-column:1/-1;font-size:22px;margin:8px 0 0' }, section));
        }
        const rec = save.levels[lv.id] || {};
        const tile = h('button', { type: 'button', class: 'ar-tile' + (lv.locked ? ' locked' : '') },
          `<div class="pic">${lv.pic || ''}</div><div>${lv.name}</div>` +
          `<div class="meta">${lv.meta != null ? lv.meta : (rec.medal ? icons.medal(rec.medal).replace('<svg', '<svg style="width:26px;height:26px;vertical-align:middle"') : '') + (rec.stars != null ? starsHTML(rec.stars) : '')}</div>` +
          (lv.locked ? `<div class="lock">${icons.lock}</div>` : ''));
        tile.addEventListener('click', () => {
          if (lv.locked) { audio.sfx('bonk'); tile.animate([{ transform: 'rotate(-4deg)' }, { transform: 'rotate(4deg)' }, { transform: 'none' }], 300); return; }
          audio.sfx('click');
          startLevel(lv);
        });
        grid.appendChild(tile);
      }
      p.appendChild(grid);
      if (config.extraMenu && !onBack) p.appendChild(config.extraMenu(g));
      const btns = h('div', { class: 'ar-btns' });
      if (onBack) btns.appendChild(button(icons.left, 'Back', 'white', () => { audio.sfx('click'); onBack(); }));
      else btns.appendChild(button(icons.home, 'Arcade', 'white', () => { location.href = back.href; }));
      p.appendChild(btns);
      show(p);
    }

    // ---- the video-game menu: a big START that carries on where you left off ----
    function nextLevel(list) {
      const open = list.filter(l => !l.locked && !l.noStart);
      const todo = open.find(l => !(save.levels[l.id] || {}).done);
      if (todo) return { lv: todo, fresh: !open.some(l => (save.levels[l.id] || {}).done) };
      // everything finished: play the one with the fewest stars (go for gold!)
      let best = open[0], low = 9;
      for (const l of open) { const st = (save.levels[l.id] || {}).stars || 0; if (st < low) { low = st; best = l; } }
      return { lv: best, again: true };
    }
    // The title menu: the logo with PICTURE buttons under it (no reading needed, Keith Nov 5).
    //   big green PLAY      - straight into the next level you haven't beaten
    //   again arrow         - new game (start over from level 1), once you've played
    //   grid / gift / trophy / ? - levels, unlocks, trophies, help (Back comes here)
    //   house               - back to the arcade
    // Each picture has one short word under it. Pick with a tap, or with the
    // arrow keys + Enter/Space. Nothing pops up by itself.
    let menuKeys = null;
    function shellMenu() {
      g.state = 'title';
      if (menuKeys) removeEventListener('keydown', menuKeys);
      const list = config.levels(g);
      const nx = nextLevel(list);
      if (CM) {
        const played = list.some(l => save.levels[l.id]);
        const go = () => { audio.resume(); audio.sfx('go'); startLevel(played ? nx.lv : list[0]); };
        const pg = (fn) => () => { audio.resume(); audio.sfx('click'); fn(); };
        const small = [];
        if (played) small.push({ icon: icons.again, label: 'New', attr: 'new', onTap: pg(() => newGamePanel(list[0])) });
        small.push({ icon: icons.menu, label: config.levelsWord || 'Levels', attr: 'levels', onTap: pg(() => levelGrid(shellMenu)) });
        if (config.menuExtras) for (const x of config.menuExtras(g)) small.push({ icon: x.icon, label: x.label, attr: (x.attr || '').replace(/^data-/, ''), onTap: pg(x.onClick) });
        if (config.extraMenu || config.extraRows) small.push({ icon: icons.gift, label: 'Prizes', attr: 'unlocks', onTap: pg(unlockPanel) });
        if (config.looks) small.push({ icon: looks.ICON, label: 'Looks', attr: 'looks', badge: lookSave().fresh.length ? looks.NEW : null, onTap: pg(() => looksScreen(shellMenu)) });
        const trophies = config.trophies || [];
        if (trophies.length) small.push({ icon: icons.trophy, label: 'Trophies', attr: 'trophies', onTap: pg(trophyPanel) });
        if (config.friends && Arcade.net && Arcade.net.ready()) small.push({ icon: Arcade.net.FRIENDS_PIC, label: 'Friends', attr: 'friends', onTap: pg(() => config.friends(g)) });
        if (config.howTo) small.push({ icon: icons.help, label: 'Help', attr: 'help', onTap: pg(() => showHowTo(() => shellMenu(), 'Got it!', true)) });
        small.push({ icon: icons.home, label: 'Arcade', attr: 'arcade', onTap: toArcade });
        const sm = summary(config.id), got = trophies.filter(t => save.achievements.includes(t.id)).length;
        const chips = [];
        if (sm.gold + sm.silver + sm.bronze) chips.push({ svg: icons.medal(sm.gold ? 'gold' : sm.silver ? 'silver' : 'bronze'), text: String(sm.gold + sm.silver + sm.bronze) });
        if (sm.stars) chips.push({ svg: icons.star(true), text: String(sm.stars) });
        const nl = config.looks && nextLook();
        if (nl) chips.push({ svg: nl.svg, text: (lookSave().best || 0) + '/' + nl.stars });
        if (trophies.length) chips.push({ svg: icons.trophy, text: got + '/' + trophies.length });
        if (profiles.list().length > 1 || profiles.little()) chips.push({ svg: profiles.avatar(profiles.active()), text: profiles.active().name || '' });
        if (profiles.little()) chips.push({ svg: icons.little, text: '', little: true });     // (grown-ups can tell the gentle preset is on)
        const rows = [{ t: 'round', items: [{ icon: icons.play, label: 'Play', big: true, attr: 'start', onTap: go }] }, { t: 'round', items: small }];
        if (chips.length) rows.push({ t: 'chips', items: chips });
        if (config.menuMusic) menuMusic();
        showScreen({ id: 'title', look: 'title', bg: config.background, logo: config.logo, rows,
          onKey: (c) => { if (c === 'Enter' || c === 'Space') go(); } });
        return;
      }
      const el = h('div', { class: 'ar-titlescreen ar-nes', style: config.background ? `background:radial-gradient(circle at 50% 40%, ${mixWhite(config.background, 0.45)} 0, ${config.background} 70%)` : '' },
        `<div class="ar-logo">${config.logo}</div>`);
      const side = h('div', { class: 'ar-nesside' });
      const menu = h('div', { class: 'ar-nesmenu ar-picmenu', role: 'menu' });
      const items = [];
      let sel = 0;
      const select = (i) => { sel = (i + items.length) % items.length; items.forEach((b, k) => b.classList.toggle('sel', k === sel)); };
      const leave = () => { if (menuKeys) { removeEventListener('keydown', menuKeys); menuKeys = null; } };
      const add = (icon, label, fn, attr, big) => {
        const b = h('button', { type: 'button', class: 'ar-nesitem' + (big ? ' big' : ''), role: 'menuitem', 'aria-label': label },
          `<span class="ic">${icon}</span><span class="lbl">${label}</span>`);
        if (attr) b.setAttribute(attr, '1');
        b.addEventListener('click', () => { audio.resume(); select(items.indexOf(b)); fn(b); });
        b.addEventListener('pointerenter', () => select(items.indexOf(b)));
        menu.appendChild(b); items.push(b);
        return b;
      };
      const page = (fn) => () => { audio.sfx('click'); leave(); fn(); };
      const played = list.some(l => save.levels[l.id]);
      // the big PLAY button: keep going (or start, the very first time)
      add(icons.play, 'Play', () => { audio.sfx('go'); leave(); startLevel(played ? nx.lv : list[0]); }, 'data-start', true);
      const small = h('div', { class: 'ar-picsmall' });
      menu.appendChild(small);
      const addSmall = (...a) => { const b = add(...a); small.appendChild(b); return b; };
      if (played) addSmall(icons.again, 'New', () => { audio.sfx('click'); leave(); newGamePanel(list[0]); }, 'data-new');
      addSmall(icons.menu, config.levelsWord || 'Levels', page(() => levelGrid(shellMenu)), 'data-levels');
      // optional game-made picture buttons (e.g. Fishing: Fish Book, Aquarium, Shop):
      // config.menuExtras(g) returns [{ icon, label, attr, onClick }]
      if (config.menuExtras) for (const x of config.menuExtras(g)) addSmall(x.icon, x.label, page(x.onClick), x.attr);
      if (config.extraMenu) addSmall(icons.gift, 'Prizes', page(unlockPanel), 'data-unlocks');
      const trophies = config.trophies || [];
      if (trophies.length) addSmall(icons.trophy, 'Trophies', page(trophyPanel), 'data-trophies');
      // play with friends on other phones (games with config.friends, once the switchboard is set up)
      if (config.friends && Arcade.net && Arcade.net.ready()) addSmall(Arcade.net.FRIENDS_PIC, 'Friends', () => { audio.sfx('click'); leave(); config.friends(g); }, 'data-friends');
      if (config.howTo) addSmall(icons.help, 'Help', page(() => showHowTo(() => shellMenu(), 'Got it!', true)), 'data-help');
      addSmall(icons.home, 'Arcade', () => { leave(); location.href = back.href; }, 'data-arcade');
      // lots of small pictures (Fishing has 9): two rows instead of one long row off the screen
      if (small.children.length > 7) small.classList.add('ar-many');
      select(0);
      side.appendChild(menu);
      // progress: medals, stars, trophies (small, under the list)
      const sm = summary(config.id);
      const got = trophies.filter(t => save.achievements.includes(t.id)).length;
      const bits = [];
      if (sm.gold + sm.silver + sm.bronze) bits.push(icons.medal(sm.gold ? 'gold' : sm.silver ? 'silver' : 'bronze') + ' ' + (sm.gold + sm.silver + sm.bronze));
      if (sm.stars) bits.push(icons.star(true) + ' ' + sm.stars);
      if (trophies.length) bits.push(icons.trophy + ' ' + got + '/' + trophies.length);
      // progress + who is playing (the player only when there is more than one on this device), side by side
      const row = h('div', { class: 'ar-nesbits' });
      if (bits.length) row.appendChild(h('div', { class: 'ar-nesprog' }, bits.join('<span style="width:14px;display:inline-block"></span>')));
      if (profiles.list().length > 1 || profiles.little()) {
        const me = profiles.active();
        // (little kids also see a small "little" badge: grown-ups can tell the gentle preset is on)
        row.appendChild(h('div', { class: 'ar-player' }, profiles.avatar(me) + (me.name ? `<span>${escapeHTML(me.name)}</span>` : '') +
          (profiles.little() ? `<span class="ar-age" title="Little kid: gentle mode">${icons.little}</span>` : '')));
      }
      if (row.children.length) side.appendChild(row);
      el.appendChild(side);
      // keyboard / game-pad style controls
      menuKeys = (e) => {
        if (e.metaKey || e.ctrlKey) return;
        const c = e.code;
        if (c === 'ArrowUp' || c === 'KeyW' || c === 'ArrowLeft' || c === 'KeyA') { select(sel - 1); audio.resume(); audio.sfx('click'); }
        else if (c === 'ArrowDown' || c === 'KeyS' || c === 'ArrowRight' || c === 'KeyD') { select(sel + 1); audio.resume(); audio.sfx('click'); }
        else if (c === 'Enter' || c === 'Space') items[sel].click();
        else return;
        e.preventDefault();
      };
      addEventListener('keydown', menuKeys);
      if (config.menuMusic) { menuMusic(); musicButton(el); }
      show(el);
    }
    // NEW GAME when you've already played: start again from level 1.
    // Level progress is wiped; trophies and unlocks are kept (kids worked hard for those!).
    function newGamePanel(first) {
      const yes = () => { audio.sfx('go'); for (const k of Object.keys(save.levels)) delete save.levels[k]; store.save(); startLevel(first); };
      if (CM) {
        showScreen({ id: 'new', title: 'New game?', rows: [{ t: 'text', text: 'Start over from level 1. Your trophies and unlocks stay!', size: 24 }],
          footer: { t: 'buttons', items: [{ icon: icons.play, label: 'Yes!', color: 'big', attr: 'yes', onTap: yes },
            { icon: icons.left, label: 'Back', color: 'white', attr: 'back', onTap: () => { audio.sfx('click'); shellMenu(); } }] } });
        return;
      }
      const p = h('div', { class: 'ar-panel' });
      p.appendChild(h('h1', { class: 'ar-title' }, 'New game?'));
      p.appendChild(h('p', { class: 'ar-sub' }, 'Start over from level 1. Your trophies and unlocks stay!'));
      const btns = h('div', { class: 'ar-btns' });
      btns.appendChild(button(icons.play, 'Yes!', 'big', () => {
        audio.sfx('go');
        for (const k of Object.keys(save.levels)) delete save.levels[k];
        store.save();
        startLevel(first);
      }));
      btns.appendChild(button(icons.left, 'Back', 'white', () => { audio.sfx('click'); shellMenu(); }));
      p.appendChild(btns);
      show(p);
    }
    // Browsers only allow sound after a tap, so if the music is blocked we show
    // a big speaker button: tapping it starts the music.
    function musicButton(el) {
      const c = audio.ensure();
      if (c && c.state !== 'running' && !settings.muted) {
        const btn = h('button', { type: 'button', class: 'ar-titlemusic', 'aria-label': 'Music on' }, icons.music);
        btn.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); audio.resume(); menuMusic(); btn.remove(); });
        el.appendChild(btn);
        c.onstatechange = () => { if (c.state === 'running') btn.remove(); };
      }
    }
    function unlockPanel() {
      if (CM && config.extraRows) {
        showScreen({ id: 'unlocks', title: 'Unlocks', rows: config.extraRows(g, unlockPanel),
          footer: { t: 'buttons', items: [{ icon: icons.left, label: 'Back', color: 'white', attr: 'back', onTap: () => { audio.sfx('click'); shellMenu(); } }] } });
        return;
      }
      const p = h('div', { class: 'ar-panel wide' });
      p.appendChild(h('h1', { class: 'ar-title' }, 'Unlocks'));
      p.appendChild(config.extraMenu(g));
      const btns = h('div', { class: 'ar-btns' });
      btns.appendChild(button(icons.left, 'Back', 'white', () => { audio.sfx('click'); shellMenu(); }));
      p.appendChild(btns);
      show(p);
    }
    function trophyPanel() {
      const trophies = config.trophies || [];
      const got = trophies.filter(t => save.achievements.includes(t.id)).length;
      const SECRET = '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" fill="#cdb4db" stroke="#2b2b2b" stroke-width="4"/><text x="24" y="32" font-size="24" font-weight="900" text-anchor="middle" fill="#2b2b2b" font-family="sans-serif">?</text></svg>';
      if (CM) {
        showScreen({ id: 'trophies', title: 'Trophies ' + got + '/' + trophies.length, rows: [{ t: 'tiles', w: 170, h: 170, items: trophies.map(t => {
          const on = save.achievements.includes(t.id), hidden = t.secret && !on;
          return { pic: hidden ? SECRET : icons.trophy, name: hidden ? 'Secret!' : t.name, meta: [{ text: hidden ? 'Keep exploring…' : t.how || '' }], picked: on, locked: !on };
        }) }], footer: { t: 'buttons', items: [{ icon: icons.left, label: 'Back', color: 'white', attr: 'back', onTap: () => { audio.sfx('click'); shellMenu(); } }] } });
        return;
      }
      const p = h('div', { class: 'ar-panel wide' });
      p.appendChild(h('h1', { class: 'ar-title' }, 'Trophies ' + got + '/' + trophies.length));
      const grid = h('div', { class: 'ar-grid ar-trophies' });
      for (const t of trophies) {
        const on = save.achievements.includes(t.id);
        const hidden = t.secret && !on;
        grid.appendChild(h('div', { class: 'ar-tile ar-trophy' + (on ? ' picked' : ' locked') },
          `<div class="pic">${hidden ? '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" fill="#cdb4db" stroke="#2b2b2b" stroke-width="4"/><text x="24" y="32" font-size="24" font-weight="900" text-anchor="middle" fill="#2b2b2b" font-family="sans-serif">?</text></svg>' : icons.trophy}</div>` +
          `<div>${hidden ? 'Secret!' : t.name}</div><div class="meta">${hidden ? 'Keep exploring…' : t.how || ''}</div>`));
      }
      p.appendChild(grid);
      const btns = h('div', { class: 'ar-btns' });
      btns.appendChild(button(icons.left, 'Back', 'white', () => { audio.sfx('click'); shellMenu(); }));
      p.appendChild(btns);
      show(p);
    }

    function titleScreen() {
      g.state = 'title';
      if (CM) {
        let gone = false;
        const go = () => { if (gone) return; gone = true; audio.resume(); audio.sfx('go'); guardTaps(); showLevels(); };
        if (config.menuMusic) menuMusic();
        showScreen({ id: 'tap', look: 'title', bg: config.background, logo: config.logo, tapAnywhere: go,
          rows: [{ t: 'round', items: [{ icon: icons.play, label: '', big: true, attr: 'tapstart', onTap: go }] }],
          onKey: (c) => { if (c !== 'Escape') go(); } });
        return;
      }
      const el = h('div', { class: 'ar-titlescreen', style: config.background ? `background:radial-gradient(circle at 50% 40%, ${mixWhite(config.background, 0.45)} 0, ${config.background} 70%)` : '' },
        `<div class="ar-logo">${config.logo}</div><div class="ar-tapstart" role="button" aria-label="Tap to start">${icons.play}${TAP_HAND}</div>`);
      const go = (e) => {
        if (e.type === 'keydown' && (e.code === 'Escape' || e.metaKey || e.ctrlKey)) return;
        if (e.cancelable) e.preventDefault();
        removeEventListener('keydown', go);
        el.removeEventListener('pointerdown', go);
        audio.resume();
        audio.sfx('go');
        guardTaps();          // half a second where nothing can be pressed by accident
        showLevels();
      };
      el.addEventListener('pointerdown', go);
      addEventListener('keydown', go);
      // Music right away. Browsers only allow sound after a tap/key, so if it's blocked
      // we show a big speaker button: tapping it starts the music and stays here.
      if (config.menuMusic) {
        menuMusic();
        const c = audio.ensure();
        if (c && c.state !== 'running' && !settings.muted) {
          const btn = h('button', { type: 'button', class: 'ar-titlemusic', 'aria-label': 'Music on' }, icons.music);
          btn.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); audio.resume(); menuMusic(); btn.remove(); });
          el.appendChild(btn);
          // (if the browser starts the sound by itself later, hide the button)
          c.onstatechange = () => { if (c.state === 'running') btn.remove(); };
        }
      }
      show(el);
    }

    let currentLevel = null;
    // Games get harder as you go: the first third of the levels play on Easy,
    // the middle third on Normal and the last third on Challenge. (A game can
    // decide for itself with config.levelDifficulty(level, g).)
    function autoDifficulty(lv) {
      if (profiles.little()) return 'easy';          // little kids: always Easy
      if (config.difficulty === false || !lv) return 'normal';
      if (config.levelDifficulty) return config.levelDifficulty(lv, g);
      const list = config.levels ? config.levels(g).filter(l => !l.noStart) : [];
      const i = list.findIndex(l => l.id === lv.id);
      if (i < 0) return 'normal';
      const f = i / list.length;
      return f < 1 / 3 ? 'easy' : f < 2 / 3 ? 'normal' : 'challenge';
    }
    // ---- the controls card (Keith, Nov 20: "each game should have the controls pop up when you hit go") ----
    // Every time a round starts (not on "Start over"), the game's how-to pictures pop up over the
    // frozen game: which button / key does what. One tap (or any key) closes it and the game goes.
    // Friends races skip it (the other phones don't wait). Headless tests don't see it unless they
    // set localStorage 'kidsArcade.testControls' (tests/test_controls.py), so robots can play right away.
    let controlsCard = null;
    function showControls(lv) {
      closeControls();
      // the first pictures are the controls (move, jump...); the rest are tips that stay behind the Help button
      let steps = (config.howTo || []).slice(0, config.controlsSteps || 4);
      if (g.oneThumb && isTouch && config.oneThumb.howTo) steps = config.oneThumb.howTo;    // (one thumb: its own pictures)
      if (!steps.length || config.controlsCard === false) return;
      if (lv && /^fr-/.test(lv.id || '')) return;
      if (navigator.webdriver && !localStorage.getItem('kidsArcade.testControls')) return;
      const card = h('div', { class: 'ar-controls', role: 'button', 'aria-label': 'Go' });
      card.innerHTML = `<div class="ar-ctl-box"><div class="ar-steps">` +
        steps.map(st => `<div class="ar-step"><div class="pic">${st.pic}</div><div>${st.text}</div>` +
          (st.keys && !isTouch ? `<div class="keys">${st.keys}</div>` : '') + `</div>`).join('') +
        `</div><div class="ar-ctl-go">${icons.play}</div></div>`;
      const go = (e) => {
        if (e && e.type === 'keydown' && (e.code === 'Escape' || e.metaKey || e.ctrlKey)) return;
        if (e && e.cancelable && e.type !== 'keydown') e.preventDefault();
        audio.sfx('go'); closeControls();
      };
      card.addEventListener('pointerdown', go);
      addEventListener('keydown', go);
      card._go = go;
      document.body.appendChild(card);
      controlsCard = card;
      popIn(card.firstChild);
    }
    function closeControls() {
      if (!controlsCard) return;
      removeEventListener('keydown', controlsCard._go);
      controlsCard.remove(); controlsCard = null;
      last = performance.now(); acc = 0;
    }

    // ---- "Show me" how to play (Nov 24, new plan point 6) ----
    // The first time a player starts a game (and from the Show me button on the Help and Pause
    // screens), the REAL game plays itself for a few seconds while a see-through hand does the
    // moves: it presses the on-screen buttons (or little key pictures on a computer) and pulls /
    // taps on the game like a finger would. Then "Your turn!" and the round starts fresh.
    // Nothing the demo does counts: no saves, no stars, no Daily Surprise, no trophies.
    //
    // A game opts in with config.showMe = {
    //   secs: 7,                          // how long the demo plays (default 7)
    //   moves: [ move, ... ],             // played in order on the game clock (t = seconds since the demo started)
    //   think(g, hand, t),                // and/or: the game steers the hand itself every step (hand API below)
    //   level(g, lv),                     // optional: the level to show (default: the one about to start)
    // }
    //   moves can also be a function (g) => [...] (e.g. other moves for one thumb), and
    //   keys: [...] or (g) => [...] = the key pictures to show on a computer when a move's key is a function
    // a move:  { t: 0.5, key: 'Space', hold: 0.15 }                 press a key / on-screen button
    //          { t: 0.5, key: (g) => 'ArrowUp' or null, side: 'L' }   a key worked out right then (null = skip)
    //          { t: 1, drag: (g) => [x0, y0, x1, y1], dur: 0.7, hold: 0.2 }   finger down, slide, wait, let go
    //          { t: 1, tap: (g) => [x, y] }                          a quick tap (view coordinates)
    // The hand glides to the spot first (HAND_GO seconds), then presses at `t + HAND_GO`.
    // TWO hands (part 2): taps + drags are the right hand's; a key is pressed by the hand on its side of the
    // on-screen buttons (on a computer: arrows = left, the rest = right), so one hand can hold Right while
    // the other taps Jump. Each hand does its own things one after another.
    // hand API (for think): hand.key(id, secs, side?), hand.drag(x0, y0, x1, y1, dur, hold, side?), hand.tap(x, y, side?),
    //   hand.busy(side?) = still doing something ('L' / 'R' / either), hand.rest(x, y) = float there (view coords),
    //   hand.holding(id) = that key is down, hand.release(id) = let go of it now, hand.done() = end it now.
    // While it plays, g.demo is true (a game can skip things, e.g. a "New best!" toast).
    // Seen once per player per game: saved in localStorage profiles.key('kidsArcade.showme').
    // Headless tests don't get it by themselves unless localStorage 'kidsArcade.testShowMe' is set.
    const HAND_GO = 0.35;
    const HAND_SVG = `<svg viewBox="0 0 64 80" aria-hidden="true"><path d="M22 52 L22 10 C22 3 32 3 32 10 L32 32 C34 28 41 29 42 34 C44 30 51 32 51 37 C53 34 60 36 60 41 L60 52 C60 66 53 76 41 76 L34 76 C28 76 24 73 20 68 L7 52 C3 46 10 40 15 45 Z" fill="#fff" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round"/><path d="M32 33 L32 44 M42 35 L42 45 M51 38 L51 46" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round" opacity="0.5"/></svg>`;
    const KEY_PIC = { ArrowLeft: '&#9664;', ArrowRight: '&#9654;', ArrowUp: '&#9650;', ArrowDown: '&#9660;', Space: 'Space', KeyX: 'X', KeyZ: 'Z', Enter: 'Enter' };
    let demo = null;
    const SEEN_KEY = 'kidsArcade.showme';
    function seenDemo() { try { return (JSON.parse(localStorage.getItem(profiles.key(SEEN_KEY))) || []).includes(config.id); } catch (e) { return false; } }
    function markSeen() {
      try {
        const k = profiles.key(SEEN_KEY), l = JSON.parse(localStorage.getItem(k)) || [];
        if (!l.includes(config.id)) { l.push(config.id); localStorage.setItem(k, JSON.stringify(l)); }
      } catch (e) { /* no storage */ }
    }
    // put a saved snapshot back INTO the same objects (games keep references to bits of their save)
    function restoreInto(t, s) {
      if (Array.isArray(t) && Array.isArray(s)) {
        t.length = s.length;
        s.forEach((v, i) => { if (v && typeof v === 'object' && t[i] && typeof t[i] === 'object') restoreInto(t[i], v); else t[i] = v; });
        return;
      }
      for (const k of Object.keys(t)) if (!(k in s)) delete t[k];
      for (const k of Object.keys(s)) {
        const v = s[k];
        if (v && typeof v === 'object' && t[k] && typeof t[k] === 'object' && Array.isArray(v) === Array.isArray(t[k])) restoreInto(t[k], v);
        else t[k] = v;
      }
    }
    // should this round start with the demo? (first time for this player, never in Friends rooms)
    function wantDemo(lv) {
      if (!config.showMe || seenDemo()) return false;
      if (lv && /^fr-/.test(lv.id || '')) return false;
      if (navigator.webdriver && !localStorage.getItem('kidsArcade.testShowMe')) return false;
      return true;
    }
    function startDemo(lv) {
      const sm = config.showMe;
      if (sm.level) lv = sm.level(g, lv) || lv;
      stopDemo(true);
      markSeen();
      const snap = JSON.stringify(store.load());
      g.demo = true;                         // (already during setup: a game can shorten its countdown)
      Arcade.demoOn = true;
      startLevel(lv, true);                  // (a fresh round, no controls card)
      closeControls();
      const el = h('div', { class: 'ar-demo', role: 'button', 'aria-label': 'Skip' });
      // two hands (Nov 24, part 2): the right one (taps, pulls, the right-hand buttons) and the left one
      // (a mirror picture: the left-hand buttons), so "hold Right + tap Jump" can be shown at once
      el.innerHTML = `<div class="ar-demo-tag">${icons.eye}</div>` +
        `<div class="ar-demo-ring"></div><div class="ar-demo-ring"></div>` +
        `<div class="ar-hand"><div>${HAND_SVG}</div></div><div class="ar-hand left"><div>${HAND_SVG}</div></div>` +
        `<div class="ar-demo-turn"><div>${icons.showMe}</div><b>Your turn!</b></div>`;
      // on a computer (or when the game has no on-screen button for it): little key pictures to press,
      // the left hand's on the left, the right hand's on the right (like the on-screen buttons)
      const moves = typeof sm.moves === 'function' ? sm.moves(g) : (sm.moves || []);
      const keys = [...new Set(moves.filter(m => typeof m.key === 'string').map(m => m.key).concat(typeof sm.keys === 'function' ? sm.keys(g) : (sm.keys || [])))];
      const caps = h('div', { class: 'ar-demo-keys' });
      const capSide = { L: h('div', { class: 'ar-demo-keyset' }), R: h('div', { class: 'ar-demo-keyset' }) };
      for (const k of keys) capSide[keySide(k)].appendChild(h('span', { class: 'ar-keycap' + (k === 'Space' ? ' wide' : ''), 'data-key': k }, KEY_PIC[k] || k.replace(/^Key/, '')));
      caps.appendChild(capSide.L); caps.appendChild(capSide.R);
      el.appendChild(caps);
      const skip = (e) => { if (e && e.cancelable) e.preventDefault(); if (demo && !demo.ending) endDemo(0.7); };
      el.addEventListener('pointerdown', skip);
      document.body.appendChild(el);
      document.body.classList.add('ar-demoing');
      const rings = el.querySelectorAll('.ar-demo-ring'), hands = el.querySelectorAll('.ar-hand');
      const mk = (i, side) => ({ side, el: hands[i], ring: rings[i], acts: [], pos: null, from: null, pressing: false });
      demo = { lv, el, caps, snap, R: mk(0, 'R'), L: mk(1, 'L'),
        t: 0, secs: sm.secs || 7, moves: moves.slice().sort((a, b) => a.t - b.t), next: 0, ending: 0, wait: 0, skip };
      demo.hands = [demo.R, demo.L];
      g.demo = true;
      Arcade.demoOn = true;
      audio.sfx('pop');
    }
    // which hand presses a key? The side of the on-screen buttons it's on (one-thumb buttons when those
    // show), else arrows = left hand, the rest (Space, X...) = right hand
    function keySide(id) {
      const kind = g.oneThumb ? 'thumb' : 'full';
      for (const p of pads) if (p.kind === kind && p.recs.some(r => r.id === id)) return p.side === 'left' ? 'L' : 'R';
      // (a game can say which hand a key belongs to on a computer: RC's gas is the right thumb's, like on the pad)
      const own = config.showMe && config.showMe.sides && config.showMe.sides[id];
      if (own) return own;
      return /^Arrow/.test(id) ? 'L' : 'R';
    }
    // where is a key's button on the screen? (the on-screen pad when it shows, else the key picture)
    function keySpot(id) {
      for (const p of pads) for (const r of p.recs) {
        if (r.id !== id || !r.el.offsetParent) continue;
        const b = r.el.getBoundingClientRect();
        if (b.width) return { x: b.left + b.width / 2, y: b.top + b.height / 2, el: r.el };
      }
      const cap = demo.caps.querySelector(`[data-key="${id}"]`);
      if (!cap) return null;
      demo.caps.classList.add('show');
      const b = cap.getBoundingClientRect();
      return { x: b.left + b.width / 2, y: b.top + b.height / 2, el: cap };
    }
    function viewToScreen(x, y) {
      const r = canvas.getBoundingClientRect();
      return { x: r.left + x * scale, y: r.top + y * scale };
    }
    const val = (v) => typeof v === 'function' ? v(g) : v;
    // the hands' actions: each glides there first, then does its thing. Taps + drags are the right
    // hand's; a key goes to the hand on its side (or a.side = 'L' / 'R'). Each hand does one thing at a time.
    function demoAct(a) {
      a.age = 0;
      if (typeof a.key === 'function' && !(a.key = a.key(g))) return;   // (a key worked out right then, or none)
      if (a.key) { a.spot = keySpot(a.key); a.end = HAND_GO + (a.hold || 0.15); }
      else if (a.drag) { a.p = val(a.drag); a.end = HAND_GO + (a.dur || 0.6) + (a.hold || 0.15); }
      else if (a.tap) { a.p = val(a.tap); a.end = HAND_GO + 0.14; }
      else if (a.rest) { a.p = a.rest; a.end = HAND_GO; }
      if (!a.p && !a.spot) return;            // (the game said "nothing to do right now")
      const hd = demo[a.side || (a.key ? keySide(a.key) : 'R')];
      if (!hd.acts.length) hd.from = hd.pos ? Object.assign({}, hd.pos) : null;
      // (already resting on that button: press it right away, no glide)
      if (a.key && !hd.acts.length && hd.pos && Math.hypot(hd.pos.x - a.spot.x, hd.pos.y - a.spot.y) < 3) a.age = HAND_GO;
      hd.acts.push(a);
    }
    const handOf = (side) => side ? [demo[side]] : demo.hands;
    const hand = {
      key: (id, secs, side) => demoAct({ key: id, hold: secs, side }),
      drag: (x0, y0, x1, y1, dur, hold, side) => demoAct({ drag: [x0, y0, x1, y1], dur, hold, side }),   // (side 'L': the left hand drags, e.g. walking in Potion Quest)
      tap: (x, y, side) => demoAct({ tap: [x, y], side }),     // (side 'L': the left hand taps, e.g. Piano Star's left-hand notes)
      rest: (x, y, side) => demoAct({ rest: [x, y], side }),
      busy: (side) => !!demo && handOf(side).some(hd => hd.acts.length > 0),
      done: () => { if (demo && !demo.ending) endDemo(1.3); },     // the game says: that's enough, "Your turn!"
      holding: (id) => !!demo && demo.hands.some(hd => hd.acts.some(a => a.key === id && a.down)),
      // let go of a key early (e.g. stop holding Right once the hero is over the gap)
      release: (id) => { if (demo) for (const hd of demo.hands) for (const a of hd.acts) if (a.key === id) a.end = Math.min(a.end, Math.max(a.age, HAND_GO + 0.05)); },
    };
    // one game step of the demo (runs just before the game's own update)
    function demoStep(dt) {
      const d = demo;
      d.t += dt;
      while (d.next < d.moves.length && d.moves[d.next].t <= d.t) demoAct(Object.assign({}, d.moves[d.next++]));
      if (config.showMe.think) config.showMe.think(g, hand, d.t);
      for (const hd of d.hands) handStep(hd, dt);
      if (d.t >= d.secs && !d.hands.some(hd => hd.acts.length)) endDemo(1.3);
    }
    function handStep(hd, dt) {
      const a = hd.acts[0];
      if (!a) return;
      a.age += dt;
      const k = Math.min(1, a.age / HAND_GO), ease = k * k * (3 - 2 * k);
      // the spot the hand is going to, in screen pixels (view points are mapped every step: the stage can move)
      let to, pressing = a.age >= HAND_GO;
      if (a.key) to = { x: a.spot.x, y: a.spot.y };
      else if (a.drag) {
        const [x0, y0, x1, y1] = a.p, m = Math.min(1, Math.max(0, (a.age - HAND_GO) / (a.dur || 0.6)));
        const mm = m * m * (3 - 2 * m);
        to = viewToScreen(x0 + (x1 - x0) * mm, y0 + (y1 - y0) * mm);
        if (pressing) {
          const p = input.pointer, vx = x0 + (x1 - x0) * mm, vy = y0 + (y1 - y0) * mm;
          if (!a.down) { a.down = true; Object.assign(p, { x: x0, y: y0, startX: x0, startY: y0, down: true, justDown: true, id: 'demo' }); }
          else { p.x = vx; p.y = vy; }
        }
      } else to = viewToScreen(a.p[0], a.p[1]);
      if (a.tap && pressing && !a.down) { a.down = true; Object.assign(input.pointer, { x: a.p[0], y: a.p[1], startX: a.p[0], startY: a.p[1], down: true, justDown: true, id: 'demo' }); }
      if (a.key && pressing && !a.down) {
        a.down = true;
        if (!input.keys.has(a.key)) input.pressed.add(a.key);
        input.keys.add(a.key);
        a.spot.el.classList.add('down');
      }
      hd.pos = (!hd.from || a.age >= HAND_GO || a.drag && a.down) ? to
        : { x: hd.from.x + (to.x - hd.from.x) * ease, y: hd.from.y + (to.y - hd.from.y) * ease };
      hd.pressing = pressing && !a.rest;
      if (a.age >= a.end) {                 // done: let go
        if (a.key) {
          // (still held by the other hand? keep it down)
          if (!demo.hands.some(o => o !== hd && o.acts[0] && o.acts[0].key === a.key && o.acts[0].down)) { input.keys.delete(a.key); a.spot.el.classList.remove('down'); }
        }
        if ((a.drag || a.tap) && a.down) Object.assign(input.pointer, { down: false, justUp: true, id: null });
        hd.acts.shift();
        hd.pressing = false;
        if (hd.acts[0]) hd.from = Object.assign({}, hd.pos);
      }
    }
    // the hands + rings follow the demo every frame
    function demoDraw() {
      for (const hd of demo.hands) {
        if (!hd.pos) { hd.el.style.opacity = '0'; continue; }
        hd.el.style.opacity = demo.ending ? '0' : '';
        // (the finger tip is 27, 4 inside the 64 x 80 hand picture (37, 4 in the mirrored left hand);
        //  it squashes a little while pressing)
        hd.el.style.transform = `translate(${hd.pos.x - (hd.side === 'L' ? 37 : 27)}px, ${hd.pos.y - 4}px) scale(${hd.pressing ? 0.88 : 1})`;
        hd.ring.style.transform = `translate(${hd.pos.x}px, ${hd.pos.y}px)`;
        hd.ring.classList.toggle('on', !!hd.pressing && !demo.ending);
      }
    }
    // "Your turn!": the game stands still a moment, then the round starts again fresh
    function endDemo(wait) {
      const d = demo;
      if (!d || d.ending) return;
      d.ending = true;
      d.wait = wait;
      for (const hd of d.hands) {
        for (const a of hd.acts) if (a.key && a.down) { input.keys.delete(a.key); a.spot.el.classList.remove('down'); }
        hd.acts = [];
      }
      input.pointer.down = false; input.pointer.id = null;
      d.el.classList.add('done');
      audio.sfx('go');
      popIn(d.el.querySelector('.ar-demo-turn'));
    }
    function stopDemo(quiet) {
      const d = demo;
      if (!d) return;
      demo = null;
      g.demo = false;
      Arcade.demoOn = false;
      d.el.remove();
      document.body.classList.remove('ar-demoing');
      for (const p of pads) for (const r of p.recs) r.el.classList.remove('down');
      input.keys.clear(); input.pressed.clear();
      Object.assign(input.pointer, { down: false, justDown: false, justUp: false, id: null });
      restoreInto(store.load(), JSON.parse(d.snap));    // nothing the demo did counts
      if (!quiet) startLevel(d.lv, true);
    }
    // (tests) what the demo is doing
    window.__showMe = () => ({ on: !!demo, t: demo ? demo.t : 0, ending: demo ? !!demo.ending : false,
      hand: demo && demo.R.pos ? { x: demo.R.pos.x, y: demo.R.pos.y, pressing: !!demo.R.pressing } : null,
      left: demo && demo.L.pos ? { x: demo.L.pos.x, y: demo.L.pos.y, pressing: !!demo.L.pressing } : null,
      seen: seenDemo(), has: !!config.showMe, pointer: Object.assign({}, input.pointer), keys: [...input.keys] });
    g.showMe = (lv) => { if (config.showMe) startDemo(lv || currentLevel); };

    function startLevel(lv, again) {
      // the first time a player starts this game: "Show me" plays first
      if (!demo && !again && wantDemo(lv)) { startDemo(lv); return; }
      if (demo && !again) stopDemo(true);    // (a menu started a level while the demo was on)
      currentLevel = lv;
      g.difficulty = autoDifficulty(lv);
      g.little = profiles.little();
      g.setOneThumb(profiles.oneThumb());   // (one-thumb touch buttons + more help)
      g.speed = g.little ? (config.littleSpeed || 1) : 1;
      g.level = lv;
      g.time = 0;
      g.particles = new Particles();
      g.juice.reset();
      input.keys.clear(); input.pressed.clear();
      audio.resetMood();                    // music back to normal (setup may change it)
      config.setup(g, lv);
      hide();
      g.state = 'play';
      last = performance.now(); acc = 0;
      // (a game can say "not yet" with config.controlsCard(g) = false and call g.showControls() itself later,
      //  e.g. Potion Quest after "Pick your hero")
      if (again || (typeof config.controlsCard === 'function' && !config.controlsCard(g))) closeControls(); else showControls(lv);
      // the level's song: the menu song fades out, a short "get ready" jingle plays
      // (unless the game has its own countdown), then the song starts on the beat
      if (config.music) audio.play(songFor(config.music), { ready: config.readyJingle !== false });
      else audio.stop(0.6);
    }
    const songFor = (m) => typeof m === 'function' ? m(g) : m;
    function stopPlay() { audio.stop(0.6); }
    function menuMusic() {
      if (config.menuMusic) { audio.resetMood(); audio.keepPlaying(songFor(config.menuMusic)); }
    }

    function restart() { startLevel(currentLevel, true); }

    function pause() {
      if (g.state !== 'play') return;
      g.state = 'paused';
      audio.pauseMusic();                   // fades out, and carries on from the same spot later
      if (config.onPause) config.onPause(g);
      if (CM) { pauseScreen(); return; }
      const p = h('div', { class: 'ar-panel' });
      p.appendChild(h('h1', { class: 'ar-title' }, 'Paused'));
      const slider = (icon, keyName) => {
        const row = h('div', { class: 'ar-setting' }, icon);
        const r = h('input', { type: 'range', min: 0, max: 1, step: 0.05, 'aria-label': keyName });
        r.value = settings[keyName];
        r.addEventListener('input', () => { settings[keyName] = +r.value; audio.applyVolumes(); store.save(); });
        r.addEventListener('change', () => audio.sfx('click'));
        row.appendChild(r);
        return row;
      };
      p.appendChild(slider(icons.sound, 'sfx'));
      p.appendChild(slider(icons.music, 'music'));
      const muteBtn = button(settings.muted ? icons.mute : icons.sound, settings.muted ? 'Sound off' : 'Sound on', 'white', () => {
        settings.muted = !settings.muted; store.save(); audio.applyVolumes();
        muteBtn.innerHTML = (settings.muted ? icons.mute : icons.sound) + `<span>${settings.muted ? 'Sound off' : 'Sound on'}</span>`;
      });
      // music on/off for this player (kept with their saves)
      const musicLabel = () => (settings.musicOn === false ? icons.musicOff : icons.music) + `<span>${settings.musicOn === false ? 'Music off' : 'Music on'}</span>`;
      const musicBtn = button(settings.musicOn === false ? icons.musicOff : icons.music, settings.musicOn === false ? 'Music off' : 'Music on', 'white', () => {
        settings.musicOn = settings.musicOn === false; store.save(); audio.applyVolumes();
        musicBtn.innerHTML = musicLabel();
      });
      const mrow = h('div', { class: 'ar-btns' }); mrow.appendChild(muteBtn); mrow.appendChild(musicBtn); p.appendChild(mrow);
      const btns = h('div', { class: 'ar-btns' });
      btns.appendChild(button(icons.play, 'Keep playing', 'big', resume));
      btns.appendChild(button(icons.again, 'Start over', 'yellow', restart));
      if (config.levels) btns.appendChild(button(icons.menu, config.levelsLabel || (config.logo ? 'Menu' : 'Levels'), 'blue', showLevels));
      btns.appendChild(button(icons.home, 'Arcade', 'white', () => { location.href = back.href; }));
      p.appendChild(btns);
      show(p);
    }
    // the pause menu as a canvas screen (redrawn when a sound switch is flipped)
    function pauseScreen() {
      const vol = (keyName) => (v) => { settings[keyName] = v; audio.applyVolumes(); store.save(); };
      const btns = [{ icon: icons.play, label: 'Keep playing', color: 'big', attr: 'resume', onTap: resume },
        { icon: icons.again, label: 'Start over', color: 'yellow', attr: 'restart', onTap: restart }];
      if (config.showMe) btns.push({ icon: icons.showMe, label: 'Show me', color: 'yellow', attr: 'showme', onTap: () => startDemo(currentLevel) });
      if (config.levels) btns.push({ icon: icons.menu, label: config.levelsLabel || (config.logo ? 'Menu' : 'Levels'), color: 'blue', attr: 'menu', onTap: showLevels });
      btns.push({ icon: icons.home, label: 'Arcade', color: 'white', attr: 'arcade', onTap: toArcade });
      showScreen({ id: 'pause', title: 'Paused', rows: [
        { t: 'slider', icon: icons.sound, value: settings.sfx, onChange: vol('sfx'), label: 'sfx' },
        { t: 'slider', icon: icons.music, value: settings.music, onChange: vol('music'), label: 'music' },
        { t: 'buttons', items: [
          { icon: settings.muted ? icons.mute : icons.sound, label: settings.muted ? 'Sound off' : 'Sound on', color: 'white', attr: 'mute', onTap: () => { settings.muted = !settings.muted; store.save(); audio.applyVolumes(); pauseScreen(); } },
          { icon: settings.musicOn === false ? icons.musicOff : icons.music, label: settings.musicOn === false ? 'Music off' : 'Music on', color: 'white', attr: 'musicon', onTap: () => { settings.musicOn = settings.musicOn === false; store.save(); audio.applyVolumes(); pauseScreen(); } },
        ] },
      ], footer: { t: 'buttons', items: btns } });      // (Esc / P are the kit's own pause keys)
    }
    function resume() {
      if (g.state !== 'paused') return;
      hide();
      g.state = 'play';
      last = performance.now(); acc = 0;
      input.keys.clear();
      if (config.onResume) config.onResume(g);
      if (config.music && !audio.resumeMusic(songFor(config.music))) audio.play(songFor(config.music));
    }
    pauseBtn.addEventListener('click', () => { audio.sfx('click'); g.state === 'play' ? pause() : resume(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

    // ---- results ----
    // result = { win: bool, score, stars (0-3), medal ('gold'|'silver'|'bronze'|null),
    //            time (seconds, for "lower is better" records), lines: ['...'],
    //            title, next: bool (offer next level) }
    function finish(result) {
      if (demo) { endDemo(1.3); return; }   // ("Show me" finished a round: it doesn't count, "Your turn!")
      if (g.state === 'over') return;
      g.state = 'over';
      audio.end(!!result.win);              // a last big chord (win) or a gentle fade
      const levelId = currentLevel ? currentLevel.id : 'main';
      const rec = save.levels[levelId] = save.levels[levelId] || {};
      let newBest = false;
      if (result.score != null && (rec.score == null || result.score > rec.score)) { rec.score = result.score; newBest = !result.time && result.score > 0; }
      if (result.time != null && result.win && (rec.time == null || result.time < rec.time)) { rec.time = result.time; newBest = true; }
      if (result.stars != null && (rec.stars == null || result.stars > rec.stars)) rec.stars = result.stars;
      if (result.medal && (!rec.medal || MEDAL_RANK[result.medal] > MEDAL_RANK[rec.medal])) rec.medal = result.medal;
      if (result.win) rec.done = true;
      if (result.score != null) save.best = Math.max(save.best || 0, result.score);
      store.save();
      if (Arcade.stickers) Arcade.stickers.check();        // new stickers for the sticker book?
      if (Arcade.daily) Arcade.daily.report(config.id, result);   // today's surprise (see arcade/daily.js)
      const freshLooks = checkLooks();                      // (the Star Road: did these stars reach a new look?)

      setTimeout(() => {
        audio.sfx(result.win ? 'win' : 'aww');
        if (result.win) confetti();
        // (headless tests that don't ask for it with localStorage 'kidsArcade.testLooks' go straight to the results, like
        //  the controls card: so the older tests that win rounds still find their results screen)
        const bigNew = freshLooks.length && !(navigator.webdriver && !localStorage.getItem('kidsArcade.testLooks'));
        if (freshLooks.length && !bigNew) toast('New: ' + freshLooks[freshLooks.length - 1].name, looks.ICON);
        if (CM && bigNew) {                                   // a new look: the big "New!" first, then the results
          newLookScreen(freshLooks, () => resultScreen(result, newBest, levelId));
          if (config.onFinish) config.onFinish(g, result);
          return;
        }
        if (CM) { resultScreen(result, newBest, levelId); if (config.onFinish) config.onFinish(g, result); return; }
        if (bigNew) toast('New: ' + freshLooks[freshLooks.length - 1].name, looks.ICON);
        // The results screen: a ribbon banner, big glowing stars, the score
        // counting up, and the game's facts as little chips.
        const p = h('div', { class: 'ar-panel ar-results ' + (result.win ? 'win' : 'lose') });
        p.appendChild(h('div', { class: 'ar-res-banner' }, `<span>${result.title || (result.win ? 'Hooray!' : 'Nice try!')}</span>`));
        if (result.medal) p.insertAdjacentHTML('beforeend', icons.medal(result.medal).replace('<svg', '<svg class="ar-medal"'));
        if (result.stars != null) {
          let s = '<div class="ar-bigstars">';
          for (let i = 0; i < 3; i++) s += icons.star(i < result.stars).replace('<svg', `<svg class="${i < result.stars ? 'on' : ''}" style="animation-delay:${0.25 + i * 0.25}s"`);
          p.insertAdjacentHTML('beforeend', s + '</div>');
          // a happy "ding" for each star as it lands
          for (let i = 0; i < result.stars; i++) setTimeout(() => audio.tone(660 + i * 220, 0.15, { type: 'triangle', vol: 0.25 }), 450 + i * 250);
        }
        if (result.score != null) {
          const sc = h('div', { class: 'ar-res-score' }, `<span class="lbl">SCORE</span><span class="num">0</span>` + (newBest ? '<span class="ar-res-best">NEW BEST!</span>' : ''));
          p.appendChild(sc);
          // count the score up like an arcade machine
          const num = sc.querySelector('.num'), to = result.score, t0 = performance.now();
          const tick = (now) => { const k = Math.min(1, (now - t0) / 900); num.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); };
          requestAnimationFrame(tick);
        } else if (newBest) p.appendChild(h('div', { class: 'ar-res-best solo' }, 'NEW BEST!'));
        if ((result.lines || []).length) {
          const chips = h('div', { class: 'ar-res-chips' });
          for (const line of result.lines) {
            if (line && typeof line === 'object') {          // { icon: '<svg…>', text: '22' }: a picture + a number
              chips.appendChild(h('span', { class: 'ar-chip ar-ichip' }, `${line.icon}<b>${line.text}</b>`));
              continue;
            }
            if (/^\s*<div/.test(line)) chips.insertAdjacentHTML('beforeend', line);      // a whole picture (like RC's podium)
            else chips.appendChild(h('span', { class: 'ar-chip' }, line));
          }
          p.appendChild(chips);
        }
        const btns = h('div', { class: 'ar-btns' });
        // a game can choose its own buttons: result.buttons = [{ icon, label, cls, onClick }]
        if (result.buttons) {
          for (const b of result.buttons) btns.appendChild(button(b.icon, b.label, b.cls, b.onClick));
          btns.appendChild(button(icons.home, 'Arcade', 'white', () => { location.href = back.href; }));
          p.appendChild(btns);
          show(p);
          if (config.onFinish) config.onFinish(g, result);
          return;
        }
        // extra buttons in front of the usual ones: result.extraButtons = [{ icon, label, cls, onClick }]
        // (e.g. Piano Star's "hear my song" button)
        for (const b of result.extraButtons || []) btns.appendChild(button(b.icon, b.label, b.cls, b.onClick));
        if (result.next && config.levels) btns.appendChild(button(icons.next, 'Next', 'big', () => {
          const all = config.levels(g);
          const i = all.findIndex(l => l.id === levelId);
          const nx = all[i + 1];
          if (nx && !nx.locked) startLevel(nx); else showLevels();
        }));
        btns.appendChild(button(icons.again, 'Again', result.next ? 'yellow' : 'big', restart));
        if (config.levels) btns.appendChild(button(icons.menu, config.levelsLabel || (config.logo ? 'Menu' : 'Levels'), 'blue', showLevels));
        btns.appendChild(button(icons.home, 'Arcade', 'white', () => { location.href = back.href; }));
        p.appendChild(btns);
        show(p);
        if (config.onFinish) config.onFinish(g, result);
      }, result.delay != null ? result.delay : 900);
    }

    // the results as a canvas screen
    function resultScreen(result, newBest, levelId) {
      const rows = [];
      // (result.rowsTop: the game's own rows come first and stand in for the medal: RC's podium, Nov 21)
      // (Nov 23, glossy part 2b: big result pictures and the medal stand on a golden glow with light rays: glow)
      const shine = (r) => r.t === 'pics' && r.glow == null && (r.size || 70) >= 200 ? Object.assign({}, r, { glow: true }) : r;
      if (result.rows && result.rowsTop) rows.push(...result.rows.map(shine));
      else if (result.medal) rows.push({ t: 'pics', items: [icons.medal(result.medal)], size: 80, glow: true });
      // (result.starsRow === false: the stars still count, but the game's own picture says it all: RC's podium)
      if (result.stars != null && result.starsRow !== false) {
        rows.push({ t: 'stars', n: result.stars });
        for (let i = 0; i < result.stars; i++) setTimeout(() => audio.tone(660 + i * 220, 0.15, { type: 'triangle', vol: 0.25 }), 450 + i * 250);
      }
      // (Nov 23: the score on a dark plaque with a gold rim, a pink NEW BEST! ribbon next to it)
      if (result.score != null) rows.push({ t: 'plaque', label: 'SCORE', value: result.score, best: !!newBest });
      else if (newBest) rows.push({ t: 'text', text: 'NEW BEST!', size: 32, big: true, color: '#ffd166' });
      // a game's own screen rows (Turbo Bike's cup table + podium): result.rows
      if (result.rows && !result.rowsTop) rows.push(...result.rows.map(shine));
      const chips = [];
      for (const line of result.lines || []) {
        if (!line) continue;
        if (typeof line === 'object') { chips.push({ svg: line.icon, text: line.text }); continue; }
        // (a line made of several rows, like a Friends game's list of players: one chip per row)
        const rowsHtml = /^\s*<div/.test(line) && line.match(/<div[^>]*>(?:(?!<div)[\s\S])*?<\/div>/g);
        for (const part of rowsHtml && rowsHtml.length > 1 ? rowsHtml : [line]) {
          const bits = CM.split(part), svg = bits.find(x => x.svg), words = bits.filter(x => x.text).map(x => x.text).join(' ');
          chips.push({ svg: svg && svg.svg, text: words });
        }
      }
      // (the Star Road: how many stars you have, and the next look they're heading for)
      const nl = config.looks && nextLook();
      if (nl) chips.push({ svg: nl.svg, text: (lookSave().best || 0) + '/' + nl.stars });
      // (Nov 24: a big picture on top (RC's podium) + NEW BEST! + chips was a little too tall since the Star Road chip
      //  came along, so the results scrolled on a computer: then NEW BEST! and the chips share one line)
      const bestAt = rows.findIndex(r => r.t === 'text' && r.text === 'NEW BEST!');
      if (result.rowsTop && bestAt >= 0 && chips.length && chips.length <= 2) {
        rows[bestAt] = { t: 'cols', gap: 20, cols: [{ w: 250, rows: [rows[bestAt]] }, { w: 330, rows: [{ t: 'chips', items: chips }] }] };
      } else if (chips.length) rows.push({ t: 'chips', items: chips });
      const btns = [];
      const add = (b) => btns.push({ icon: b.icon, label: b.label, color: (b.cls || 'white').split(' ')[0], attr: (b.label || '').toLowerCase(), onTap: () => { audio.sfx('click'); b.onClick(); } });
      if (result.buttons) result.buttons.forEach(add);
      else {
        (result.extraButtons || []).forEach(add);
        if (result.next && config.levels) add({ icon: icons.next, label: 'Next', cls: 'big', onClick: () => {
          const all = config.levels(g), i = all.findIndex(l => l.id === levelId), nx = all[i + 1];
          if (nx && !nx.locked) startLevel(nx); else showLevels();
        } });
        add({ icon: icons.again, label: 'Again', cls: result.next ? 'yellow' : 'big', onClick: restart });
        if (config.levels) add({ icon: icons.menu, label: config.levelsLabel || (config.logo ? 'Menu' : 'Levels'), cls: 'blue', onClick: showLevels });
      }
      btns.push({ icon: icons.home, label: 'Arcade', color: 'white', attr: 'arcade', onTap: toArcade });
      showScreen({ id: 'results', banner: result.title || (result.win ? 'Hooray!' : 'Nice try!'), bannerColor: result.win ? '#ef476f' : '#8ecae6', rows,
        footer: { t: 'buttons', items: btns }, result: { win: !!result.win, stars: result.stars },
        fit: true });                                            // (Nov 23: a big podium shrinks a little rather than scroll)
    }

    // ---- go! ----
    resize();
    raf = requestAnimationFrame(frame);
    addEventListener('pagehide', () => { cancelAnimationFrame(raf); audio.stop(); });
    // test/debug hook
    window.__game = g;

    // Intro first, then the level picker (or straight into the game).
    // Games with a `logo` get a title screen instead: tap anywhere to start
    // (their how-to-play pictures then live behind a Help button, see g.help()).
    if (config.logo) titleScreen();
    else showHowTo(() => { audio.resume(); showLevels(); });
    return g;
  }

  // ------------------------------------------------------------------
  // Small math helpers games keep needing
  // ------------------------------------------------------------------
  const math = {
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    rand: (a, b) => a + Math.random() * (b - a),
    dist: (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay),
    // seeded random (same level layout every time)
    seeded(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); },
    // closest point on segment AB to P -> {x, y, t}
    nearestOnSegment(px, py, ax, ay, bx, by) {
      const dx = bx - ax, dy = by - ay;
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
      return { x: ax + dx * t, y: ay + dy * t, t };
    },
    angleDiff(a, b) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; },
  };

  // Summary for the hub cards: { stars, gold, silver, bronze, best }
  function summary(id) {
    const g = store.load().games[id];
    const out = { stars: 0, gold: 0, silver: 0, bronze: 0, best: 0, played: !!g };
    if (!g) return out;
    for (const k in g.levels) {
      const r = g.levels[k];
      out.stars += r.stars || 0;
      if (r.medal) out[r.medal]++;
    }
    out.best = g.best || 0;
    return out;
  }

  // ---- Soft music for the calm pages (coloring book + maze; Nov 22) ----
  // These pages aren't kit games, so they have a music button of their own: OFF until a child
  // (or a grown-up) taps it, and then remembered in that page's own save. Tapping the button is
  // asking for music, so it plays even if this player switched the arcade music off on the hub;
  // "all sound off" (muted) and the Parent corner's "All done" wall still make it quiet.
  //   const music = pageMusic(btn, SONG, () => saved.music, (on) => { saved.music = on; persist(); });
  //   music.on() -> true/false;  music.mood({ muffle: 0.5 });  music.stinger('treasure')
  function pageMusic(btn, song, isOn, setOn) {
    const plain = audio.applyVolumes.bind(audio);
    audio.applyVolumes = function () {
      plain();
      if (this.ctx && this.musicGain && isOn()) this.musicGain.gain.value = Math.max(0.25, +store.settings().music || 0) * 0.7;
    };
    // the picture: two music notes, colored when on, gray with a red line when off
    const icon = (on = isOn()) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M18 34 V12 L38 7 V29" fill="none" stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
        <ellipse cx="13" cy="35" rx="7" ry="5.5" fill="${on ? '#ffd166' : '#d9d9d9'}" stroke="#2b2b2b" stroke-width="3.5"/>
        <ellipse cx="33" cy="30" rx="7" ry="5.5" fill="${on ? '#ef476f' : '#d9d9d9'}" stroke="#2b2b2b" stroke-width="3.5"/>
        ${on ? '' : '<path d="M8 8 L40 40" stroke="#ef476f" stroke-width="5" stroke-linecap="round"/>'}</svg>`;
    const show = () => {
      if (!btn) return;
      btn.classList.toggle('music-on', isOn());
      btn.setAttribute('aria-pressed', isOn() ? 'true' : 'false');
      btn.innerHTML = icon();
    };
    const start = () => { audio.resume(); audio.ensure(); audio.applyVolumes(); audio.keepPlaying(song, { quick: true }); audio.setMood(Object.assign({}, audio.mood)); };
    // on <-> off (the page's button, or a canvas-menu button that calls music.toggle())
    const toggle = () => {
      setOn(!isOn()); show();
      if (isOn()) { start(); }
      else { audio.stop(0.6); audio.sfx('click'); }
    };
    if (btn) btn.addEventListener('click', toggle);
    // a saved "on" can only start after the first touch (browsers keep pages quiet until then)
    const first = () => { if (isOn()) start(); window.removeEventListener('pointerdown', first, true); };
    window.addEventListener('pointerdown', first, true);
    // another tab / the phone's home screen: pause, and carry on when we're back
    document.addEventListener('visibilitychange', () => {
      if (!isOn() || !audio.ctx) return;
      if (document.hidden) audio.pauseMusic(); else if (!audio.resumeMusic(song)) start();
    });
    show();
    return {
      toggle, icon, isOn,
      on: () => isOn() && !!audio.track && audio.track.song === song && !audio.track.paused,
      mood: (m) => audio.setMood(m),
      stinger: (name) => { if (isOn() && audio.track) audio.stinger(name); },
    };
  }

  // ---------------------------------------------------------------
  // Glossy result pictures (Nov 23, Keith's glossy menus, part 2c)
  // The results screens show podiums, points tables and race cards as ONE SVG picture each
  // (canvas menus can't show HTML). These little helpers give them the same shiny look as the
  // menus: color blends, a soft shadow under each thing, a white shine on top, a glow + light
  // rays behind the winner. Every helper returns SVG text to paste into a picture; put
  // `svgGloss.defs()` once at the start of the picture (it holds the color blends).
  //   step(x, y, w, h, kind, me)  a podium step ('gold' / 'silver' / 'bronze' / 'white')
  //   pill(x, y, w, h, kind)      a rounded row ('white' / 'me' / 'gold' / 'lilac')
  //   bar(x, y, w, h, col)        a shiny progress bar (the part that's filled)
  //   rays(cx, cy, r) + glow(cx, cy, r) + floor(cx, cy, rx)   behind / under the winner
  //   trophy(col, cx, top, s)     a shiny cup (1 = 100 units tall)
  //   sparkle(x, y, r, col)       a 4-point twinkle
  // (Words stay Arial Black: an SVG drawn as a picture can't use the page's Fredoka font.)
  // ---------------------------------------------------------------
  const svgGloss = (() => {
    const INK = '#2b2b2b';
    // top -> bottom color blends: light, main, dark
    const BLENDS = {
      gold: ['#fff3b0', '#ffd166', '#e9a23b'], silver: ['#ffffff', '#dfe7ef', '#a9b8c8'],
      bronze: ['#ffd9b5', '#f4a261', '#cc7434'], white: ['#ffffff', '#ffffff', '#e4e9f5'],
      me: ['#fffbe0', '#ffe48a', '#ffc93c'], lilac: ['#f6f0ff', '#e2d6ff', '#c8b6ff'],
    };
    const defs = () => '<defs>' + Object.entries(BLENDS).map(([k, c]) =>
      `<linearGradient id="gl-${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset="0.5" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient>`).join('') +
      '<radialGradient id="gl-glow"><stop offset="0" stop-color="#fff6c2" stop-opacity="0.95"/><stop offset="0.55" stop-color="#ffd166" stop-opacity="0.35"/><stop offset="1" stop-color="#ffd166" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="gl-floor"><stop offset="0" stop-color="#000" stop-opacity="0.28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="gl-shine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.75"/><stop offset="1" stop-color="#fff" stop-opacity="0.05"/></linearGradient>' +
      '</defs>';
    const fill = (kind) => BLENDS[kind] ? `url(#gl-${kind})` : kind;     // (or any plain color)
    const f = (n) => Math.round(n * 10) / 10;
    // a podium step: shadow, blend, shine across the top, a darker right side, thick outline (+ a gold ring = you)
    function step(x, y, w, h, kind, me) {
      return `<rect x="${f(x + 5)}" y="${f(y + 6)}" width="${w}" height="${h}" rx="12" fill="#000" opacity="0.18"/>` +
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill(kind)}"/>` +
        `<rect x="${f(x + w - 16)}" y="${f(y + 6)}" width="12" height="${f(h - 12)}" rx="6" fill="#000" opacity="0.08"/>` +
        `<rect x="${f(x + 8)}" y="${f(y + 6)}" width="${f(w - 16)}" height="${f(Math.min(22, h * 0.3))}" rx="8" fill="url(#gl-shine)"/>` +
        (me ? `<rect x="${f(x - 4)}" y="${f(y - 4)}" width="${w + 8}" height="${h + 8}" rx="15" fill="none" stroke="#ffd166" stroke-width="8"/>` : '') +
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="none" stroke="${INK}" stroke-width="${me ? 4 : 5}"/>`;
    }
    // a rounded row (points tables, race cards)
    function pill(x, y, w, h, kind = 'white') {
      const r = h / 2;
      return `<rect x="${f(x + 3)}" y="${f(y + 4)}" width="${w}" height="${h}" rx="${r}" fill="#000" opacity="0.16"/>` +
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill(kind)}"/>` +
        `<rect x="${f(x + r * 0.6)}" y="${f(y + 4)}" width="${f(w - r * 1.2)}" height="${f(h * 0.36)}" rx="${f(h * 0.18)}" fill="url(#gl-shine)"/>` +
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="${INK}" stroke-width="${kind === 'me' || kind === 'gold' ? 5 : 4}"/>`;
    }
    // the filled part of a bar: its color, a dark lower half, a white shine stripe
    function bar(x, y, w, h, col) {
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${col}"/>` +
        `<rect x="${x}" y="${f(y + h / 2)}" width="${w}" height="${f(h / 2)}" rx="${f(h / 4)}" fill="#000" opacity="0.14"/>` +
        (w > 14 ? `<rect x="${f(x + 4)}" y="${f(y + 2)}" width="${f(w - 8)}" height="${f(h * 0.28)}" rx="${f(h * 0.14)}" fill="#fff" opacity="0.6"/>` : '');
    }
    // soft light rays (wedges) fanning out from a spot, fading away towards their ends
    // (so they never stop in a hard line at the picture's edge)
    let rayN = 0;
    function rays(cx, cy, r, n = 12) {
      const id = 'gl-ray' + (rayN++);
      let s = `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}">` +
        '<stop offset="0" stop-color="#fff6c2" stop-opacity="0.75"/><stop offset="0.6" stop-color="#fff6c2" stop-opacity="0.3"/><stop offset="1" stop-color="#fff6c2" stop-opacity="0"/></radialGradient>';
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2, a1 = a0 + Math.PI / n;
        s += `<path d="M${cx} ${cy} L${f(cx + Math.cos(a0) * r)} ${f(cy + Math.sin(a0) * r)} L${f(cx + Math.cos(a1) * r)} ${f(cy + Math.sin(a1) * r)} Z"/>`;
      }
      return `<g fill="url(#${id})">${s}</g>`;
    }
    const glow = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#gl-glow)"/>`;
    const floor = (cx, cy, rx) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${f(rx * 0.16)}" fill="url(#gl-floor)"/>`;
    const sparkle = (x, y, r, col = '#fff') => `<path transform="translate(${f(x)} ${f(y)})" d="M0 ${-r} L${f(r * 0.28)} ${f(-r * 0.28)} L${r} 0 L${f(r * 0.28)} ${f(r * 0.28)} L0 ${r} L${f(-r * 0.28)} ${f(r * 0.28)} L${-r} 0 L${f(-r * 0.28)} ${f(-r * 0.28)} Z" fill="${col}" stroke="${INK}" stroke-width="2"/>`;
    // a shiny trophy cup at (cx, top), size s: the bowl, handles, stem, a stand, a dark side + a white shine
    function trophy(col, cx, top, s) {
      return `<g transform="translate(${cx} ${top}) scale(${s})">` +
        `<path d="M-22 14 H-36 Q-38 38 -18 42 M22 14 H36 Q38 38 18 42" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>` +
        `<path d="M-22 6 H22 V34 A22 22 0 0 1 -22 34 Z" fill="${col}"/>` +
        `<path d="M8 6 H22 V34 A22 22 0 0 1 4 55.6 Q14 40 8 6 Z" fill="#000" opacity="0.14"/>` +
        `<path d="M-22 6 H22 V34 A22 22 0 0 1 -22 34 Z" fill="none" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>` +
        `<path d="M0 56 V72" stroke="${INK}" stroke-width="8"/>` +
        `<rect x="-24" y="72" width="48" height="16" rx="5" fill="${col}" stroke="${INK}" stroke-width="5"/>` +
        `<rect x="-18" y="75" width="36" height="4" rx="2" fill="#fff" opacity="0.6"/>` +
        `<path d="M-13 13 Q-12 30 -3 38" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.8"/>` +
        `<circle cx="13" cy="14" r="2.6" fill="#fff"/></g>`;
    }
    return { defs, step, pill, bar, rays, glow, floor, sparkle, trophy, fill, BLENDS };
  })();

  // ------------------------------------------------------------------
  // The Star Road (Nov 24, new plan point 8: "something to work towards in every game")
  // Every star a player earns in a game counts towards new LOOKS for that game: a hat to wear
  // and a trail that follows you (sparkles, hearts, bubbles, a rainbow). A new look every few
  // stars, a big "New!" celebration when one unlocks, and a Looks screen to put them on.
  // The pictures and the trail bits are here (shared by every game); a game says which kinds it
  // can show (config.looks = { kinds: ['hat', 'trail'] }) and draws them where they belong:
  //   Arcade.looks.drawHat(ctx, g.looks.hat, x, y, w, tilt)   x, y = the TOP of the head, w = head width
  //   g.looks.trail(x, y, { to: myParticles, key: 'hero', on: moving })   every step, where the trail starts
  // See "The Star Road" in arcade/README.md.
  // ------------------------------------------------------------------
  const looks = (function () {
    const INK = '#2b2b2b';
    const SV = (inner) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
    const O = `stroke="${INK}" stroke-width="5" stroke-linejoin="round"`;
    // a five-petal flower at (x, y), petal size r
    const flower = (x, y, r, col) => {
      let s = '';
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * Math.PI * 2 - Math.PI / 2;
        s += `<circle cx="${(x + Math.cos(a) * r).toFixed(1)}" cy="${(y + Math.sin(a) * r).toFixed(1)}" r="${(r * 0.78).toFixed(1)}" fill="${col}" stroke="${INK}" stroke-width="3.5"/>`;
      }
      return s + `<circle cx="${x}" cy="${y}" r="${(r * 0.62).toFixed(1)}" fill="#ffd166" stroke="${INK}" stroke-width="3.5"/>`;
    };
    const star = (x, y, r, col) => {
      let d = '';
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
        d += (i ? 'L' : 'M') + (x + Math.cos(a) * rr).toFixed(1) + ' ' + (y + Math.sin(a) * rr).toFixed(1);
      }
      return `<path d="${d}Z" fill="${col}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    };
    // Hats: drawn in a 100 x 100 box, the middle of the hat's bottom edge at (50, 88), about 70 wide
    // (so it fits a head 70 wide). Order = the order they unlock in.
    const HATS = [
      { id: 'party', name: 'Party hat', svg: SV(
        `<path d="M25 84 L50 14 L75 84 Z" fill="#ff70a6" ${O}/>` +
        `<path d="M50 14 L75 84 L62 84 Z" fill="#000" opacity="0.12"/>` +
        `<circle cx="45" cy="60" r="5" fill="#ffd166"/><circle cx="56" cy="44" r="4" fill="#8ecae6"/><circle cx="58" cy="70" r="4.5" fill="#caffbf"/><circle cx="47" cy="32" r="3.2" fill="#fff"/>` +
        `<path d="M41 40 L46 26" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.75"/>` +
        `<rect x="18" y="76" width="64" height="13" rx="6.5" fill="#4cc9f0" ${O}/>` +
        `<circle cx="50" cy="13" r="10" fill="#ffd166" ${O}/><circle cx="47" cy="10" r="3" fill="#fff"/>`) },
      { id: 'flowers', name: 'Flower crown', svg: SV(
        `<path d="M12 86 Q50 66 88 86" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round"/>` +
        `<path d="M12 86 Q50 66 88 86" fill="none" stroke="#7bd389" stroke-width="6" stroke-linecap="round"/>` +
        `<path d="M30 76 Q24 70 20 72 Q24 80 30 76 Z M70 76 Q76 70 80 72 Q76 80 70 76 Z" fill="#7bd389" stroke="${INK}" stroke-width="3"/>` +
        flower(24, 72, 9, '#8ecae6') + flower(76, 72, 9, '#ffafcc') + flower(50, 60, 12, '#ff70a6') +
        `<circle cx="47" cy="57" r="2.6" fill="#fff"/>`) },
      { id: 'crown', name: 'Crown', svg: SV(
        `<path d="M18 86 L15 38 L34 58 L50 26 L66 58 L85 38 L82 86 Z" fill="#ffd166" ${O}/>` +
        `<path d="M66 58 L85 38 L82 86 L70 86 Z" fill="#000" opacity="0.1"/>` +
        `<path d="M27 52 L28 72" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.7"/>` +
        `<rect x="14" y="72" width="72" height="16" rx="6" fill="#f4a261" ${O}/>` +
        `<circle cx="32" cy="80" r="4.5" fill="#4cc9f0" stroke="${INK}" stroke-width="3"/><circle cx="50" cy="80" r="5.5" fill="#ef476f" stroke="${INK}" stroke-width="3"/><circle cx="68" cy="80" r="4.5" fill="#06d6a0" stroke="${INK}" stroke-width="3"/>` +
        `<circle cx="15" cy="37" r="5.5" fill="#fff" stroke="${INK}" stroke-width="3.5"/><circle cx="50" cy="25" r="6" fill="#fff" stroke="${INK}" stroke-width="3.5"/><circle cx="85" cy="37" r="5.5" fill="#fff" stroke="${INK}" stroke-width="3.5"/>`) },
      { id: 'wizard', name: 'Star hat', svg: SV(
        `<path d="M24 82 Q42 52 46 30 Q50 14 66 8 Q58 24 60 40 Q64 62 76 82 Z" fill="#7b2cbf" ${O}/>` +
        `<path d="M60 40 Q64 62 76 82 L64 82 Q58 60 56 42 Z" fill="#000" opacity="0.15"/>` +
        star(48, 56, 8, '#ffd166') + star(57, 30, 5, '#fff3b0') + star(36, 74, 4.5, '#ffd166') +
        `<ellipse cx="50" cy="84" rx="42" ry="9" fill="#9d4edd" ${O}/>` +
        `<circle cx="66" cy="8" r="5.5" fill="#ffd166" stroke="${INK}" stroke-width="3.5"/>`) },
    ];
    // Trails: what floats out behind you. `bit` = how one piece flies (Particles.burst options).
    const RAINBOW = ['#ef476f', '#f78c6b', '#ffd166', '#06d6a0', '#4cc9f0', '#9d4edd'];
    const trailPic = (bits) => SV(`<path d="M12 78 Q40 70 52 50 Q62 30 88 22" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 12" opacity="0.8"/>` + bits);
    const heart = (x, y, s, col) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 6 C-12 -2 -9 -12 -2 -10 Q0 -9.5 0 -7 Q0 -9.5 2 -10 C9 -12 12 -2 0 6 Z" fill="${col}" stroke="${INK}" stroke-width="${(3 / s).toFixed(2)}" stroke-linejoin="round"/>`;
    const bubble = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#bde0fe" fill-opacity="0.55" stroke="${INK}" stroke-width="3"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.25}" fill="#fff"/>`;
    const TRAILS = [
      { id: 'sparkles', name: 'Sparkle trail', every: 0.07, bit: { shape: 'star', colors: ['#ffd166', '#fff3b0', '#ffffff'], size: 11, speed: 40, life: 0.6, gravity: 0, count: 2 },
        svg: trailPic(star(20, 76, 7, '#fff3b0') + star(42, 62, 10, '#ffd166') + star(66, 36, 13, '#ffd166') + star(86, 22, 7, '#fff')) },
      { id: 'hearts', name: 'Heart trail', every: 0.08, bit: { shape: 'heart', colors: ['#ff70a6', '#ff99c8', '#ef476f'], size: 13, speed: 30, life: 0.8, gravity: -50, count: 1 },
        svg: trailPic(heart(20, 76, 0.9, '#ff99c8') + heart(44, 58, 1.3, '#ff70a6') + heart(70, 34, 1.7, '#ef476f')) },
      { id: 'bubbles', name: 'Bubble trail', every: 0.08, bit: { shape: 'bubble', colors: ['#bde0fe', '#a2d2ff', '#caffbf'], size: 15, speed: 25, life: 1, gravity: -80, count: 1 },
        svg: trailPic(bubble(20, 76, 6) + bubble(42, 60, 9) + bubble(68, 36, 13) + bubble(88, 18, 5)) },
      { id: 'rainbow', name: 'Rainbow trail', every: 0.03, rainbow: true, bit: { shape: 'circle', size: 16, speed: 8, life: 0.7, gravity: 0, drag: 3, count: 1 },
        svg: SV(RAINBOW.map((c, i) => `<path d="M10 ${80 + (i - 2.5) * 6} Q44 ${72 + (i - 2.5) * 6} 56 ${50 + (i - 2.5) * 5} Q66 ${30 + (i - 2.5) * 5} 92 ${24 + (i - 2.5) * 6}" fill="none" stroke="${c}" stroke-width="6.5"/>`).join('') +
          `<circle cx="92" cy="24" r="9" fill="#fff" stroke="${INK}" stroke-width="3.5"/>`) },
    ];
    // Colors (Nov 24, part 3): a paint job for a bike or a car that slowly shifts between its colors.
    // A game asks Arcade.looks.colorAt(id, time) for the color to paint with right now.
    const paintDrop = (id, cols, extra = '') => SV(
      `<defs><linearGradient id="lk-${id}" x1="0" y1="0" x2="1" y2="1">${cols.map((c, i) => `<stop offset="${(i / (cols.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join('')}</linearGradient></defs>` +
      `<path d="M50 8 Q72 38 80 56 Q88 80 66 90 Q50 96 34 90 Q12 80 20 56 Q28 38 50 8 Z" fill="url(#lk-${id})" ${O}/>` +
      `<path d="M36 52 Q32 64 36 76" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity="0.8"/>` +
      `<circle cx="40" cy="44" r="4" fill="#fff" opacity="0.9"/>` + extra);
    const COLORS = [
      { id: 'bubblegum', name: 'Bubblegum', colors: ['#ff8fc7', '#c77dff'], svg: paintDrop('bubblegum', ['#ff8fc7', '#c77dff']) },
      { id: 'ocean', name: 'Ocean', colors: ['#4cc9f0', '#06d6a0'], svg: paintDrop('ocean', ['#4cc9f0', '#06d6a0']) },
      { id: 'sunset', name: 'Sunset', colors: ['#ffd166', '#ff8c42', '#ef476f'], svg: paintDrop('sunset', ['#ffd166', '#ff8c42', '#ef476f']) },
      { id: 'galaxy', name: 'Galaxy', colors: ['#7b2cbf', '#4361ee', '#3a0ca3'], twinkle: true,
        svg: paintDrop('galaxy', ['#7b2cbf', '#4361ee', '#3a0ca3'], star(60, 68, 8, '#fff3b0') + '<circle cx="44" cy="80" r="3" fill="#fff"/><circle cx="66" cy="46" r="2.6" fill="#fff"/><circle cx="52" cy="58" r="2" fill="#fff"/>') },
    ];
    // the color to paint with at time t (seconds): it glides from one of the look's colors to the next and back round
    const hexRGB = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    function colorAt(id, t = 0) {
      const c = COLORS.find(x => x.id === id);
      if (!c) return null;
      const n = c.colors.length, k = ((t / 1.6) % n + n) % n, i = Math.floor(k);
      const f = (1 - Math.cos((k - i) * Math.PI)) / 2;        // (eases in and out, so it rests a moment on each color)
      const a = hexRGB(c.colors[i]), b = hexRGB(c.colors[(i + 1) % n]);
      return '#' + a.map((v, j) => Math.round(v + (b[j] - v) * f).toString(16).padStart(2, '0')).join('');
    }
    const KINDS = { hat: HATS, trail: TRAILS, color: COLORS };
    const NAMES = { hat: 'Hats', trail: 'Trails', color: 'Colors' };   // (the Looks screen's headings)
    const find = (id) => HATS.find(x => x.id === id) || TRAILS.find(x => x.id === id) || COLORS.find(x => x.id === id) || null;
    // the hats as pictures for the canvas (made once, drawn when ready)
    const imgs = {};
    function hatImg(id) {
      if (imgs[id]) return imgs[id];
      const h = HATS.find(x => x.id === id);
      if (!h) return null;
      const im = new Image();
      im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(h.svg.replace('<svg ', '<svg width="200" height="200" '));
      return (imgs[id] = im);
    }
    HATS.forEach(h => hatImg(h.id));        // (start loading them all right away, so they're ready for the first round)
    // draw a hat: (x, y) = the top middle of the head, w = how wide the head is, tilt = turn it (radians)
    function drawHat(ctx, id, x, y, w, tilt = 0) {
      const im = id && hatImg(id);
      if (!im || !im.complete || !im.naturalWidth) return;
      const s = w / 70;                     // (the hat is 70 of its 100 box wide)
      ctx.save();
      ctx.translate(x, y); ctx.rotate(tilt);
      ctx.drawImage(im, -50 * s, -88 * s, 100 * s, 100 * s);
      ctx.restore();
    }
    // a "NEW" star badge (the Looks button and new tiles)
    const NEW = `<svg viewBox="0 0 48 48">${star(24, 24, 22, '#ef476f').replace('stroke-width="3"', 'stroke-width="3.5"')}<text x="24" y="29" font-size="11" font-weight="900" text-anchor="middle" fill="#fff" font-family="Arial Black, sans-serif">NEW</text></svg>`;
    // the Looks button's picture: the party hat + a sparkle
    const ICON = `<svg viewBox="0 0 48 48">${HATS[0].svg.replace('<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">', '<g transform="translate(4 2) scale(0.4)">').replace('</svg>', '</g>')}${star(38, 12, 7, '#ffd166')}</svg>`;
    // ---- Looks outside the games (Nov 24, point 8 part 5: My House + the Sticker Book) ----
    // Which games have which kinds of looks (the same as each game's config.looks.kinds; tests/test_looks_book.py
    // checks they match). Archery isn't here: it has its own older hats + arrow trails.
    const GAMES = {
      bike: ['hat', 'color', 'trail'], rc: ['color', 'trail'], hoops: ['trail'], jungle: ['hat', 'trail'], trail: ['trail'],
      space: ['trail'], abc: ['trail'], fishing: ['hat', 'trail'], piano: ['trail'], golf: ['trail'], quest: ['hat', 'trail'],
    };
    // a game's looks in the order they unlock (the same order as starRoad() in start())
    const roadOf = (game) => { const out = []; for (let i = 0; i < 4; i++) for (const k of GAMES[game] || []) out.push({ kind: k, game, ...KINDS[k][i] }); return out; };
    // the look ids this player has earned in a game (worked out by the game itself, when it was last played)
    function gotIn(game) {
      const s = (store.load().games || {})[game];
      return s && s.looks && Array.isArray(s.looks.got) ? s.looks.got.filter(id => find(id)) : [];
    }
    // every hat / trail / color this player has earned in ANY game (each once, in the catalog's order)
    function owned(kind) {
      const all = new Set();
      for (const g in GAMES) for (const id of gotIn(g)) all.add(id);
      return (KINDS[kind] || []).filter(x => all.has(x.id));
    }
    // a one-off puff of a trail's bits into your own Particles (My House: when your animal hops)
    function puff(parts, id, x, y, o = {}) {
      const tr = TRAILS.find(t => t.id === id);
      if (!tr || !parts) return 0;
      const bit = Object.assign({}, tr.bit);
      bit.count = Math.max(1, Math.round((o.count || 6) * (calm() ? 0.5 : 1)));
      bit.size *= o.scale || 1;
      bit.speed = o.speed || 140;
      bit.life = Math.max(bit.life, 0.8);
      bit.drag = 2;
      if (o.angle != null) { bit.angle = o.angle; bit.spread = o.spread || 1.2; }
      if (tr.rainbow) bit.colors = RAINBOW;
      parts.burst(x, y, bit);
      return bit.count;
    }
    return { HATS, TRAILS, COLORS, KINDS, NAMES, RAINBOW, find, drawHat, hatImg, colorAt, NEW, ICON, GAMES, roadOf, gotIn, owned, puff };
  })();

  window.Arcade = { start, setZoom, popIn, guardTaps, store, profiles, escapeHTML, audio, sfx: (n) => audio.sfx(n), Particles, draw, icons, math, toast, confetti, summary, starsHTML, h, logo, titleScreen, mixWhite, pageMusic, calm, shakeK, juice: makeJuice, svgGloss, looks, perf };
})();
