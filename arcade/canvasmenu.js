// =====================================================================
// Canvas menus: the arcade's menus drawn INSIDE a game picture with
// Phaser 3 + the Rex UI plugin (Keith, Nov 20: "rewrite everything to
// utilize Phaser 3 + Rex UI: menus drawn inside the game picture, scaled
// to fit; Rex UI adds buttons, grids and scrolling panels").
//
// How it works:
//  * The kit (arcade/shared.js) describes a menu as a SCREEN: a little list
//    of rows (a title, a grid of tiles, a row of buttons...). It hands that
//    to ArcadeMenus.open(screen) instead of building HTML.
//  * This file draws the screen with Rex UI "sizers" (boxes that line their
//    children up, wrap them and scroll them) on a Phaser canvas that covers the
//    page while a menu is open. Pictures are our SVG drawings, turned into
//    Phaser textures first (ArcadeMenus.pics()).
//  * Scaled to fit: everything is laid out on an 820 x 520 board (480 x 820 on a
//    phone held upright) and that board is scaled to the screen. The canvas has
//    as many pixels as the screen really has, so words and pictures stay sharp.
//  * Buttons never change size when pressed (only what's inside squishes), so a
//    tap near the edge of a button always counts.
//  * Games opt in one at a time with `canvasMenus: true` in Arcade.start (Jungle
//    Jump first, Nov 20); the others keep their HTML menus until they're moved.
//
// Screen rows ({ t: kind, ... }):
//   { t: 'text', text, size }                    words
//   { t: 'pics', items: [svg | { img }], size }  pictures in a row (a medal...; { img: dataURL } for a painted one)
//   { t: 'stars', n, max }                       big stars (results)
//   { t: 'chips', items: [{ svg, text }] }       little picture + number chips
//   { t: 'tiles', items: [{ pic, name, meta: [svg | text], locked, picked, onTap, attr, fill }], w, h }
//                                                (badge: svg = a little bouncing picture on the tile's corner)
//                                                (fill: true = a picture without a name fills the whole tile)
//   { t: 'round', items: [{ icon, label, onTap, attr, big }], size, gap }   the title menu's round picture buttons
//                                                (size = circle size in board units; label '' = no word under it)
//   { t: 'buttons', items: [{ icon, label, color, onTap, attr }] }  a row of big buttons
//   { t: 'slider', icon, value, onChange }       a volume slider
//   { t: 'live', canvas, w, attr, onTap(x, y) }  a MOVING picture (Fishing's aquarium, Nov 21): a canvas the game
//                                                keeps drawing on; it's copied to the screen every frame, w board
//                                                units wide; a tap hands back x, y in the canvas's own pixels.
//                                                Dragging on it: onDown(x, y, cssWidth) / onMove(x, y) / onUp().
//                                                canvas.dirty = false: nothing new to copy (set it true after drawing)
//   { t: 'cols', cols: [{ w, rows }], gap }      columns side by side (one under the other on an upright phone; keep: true = always side by side)
//   { t: 'heading', text }                       a section heading on a little shiny ribbon (Nov 23, part 2b)
// A `pics` item can be { svg | img, frame: true }: the picture in a gold-rimmed frame (the Parent corner's charts).
// Any row can have `bg: color`: it sits on a colored card (a Sticker Book page). Tile items can have `color`.
// (Nov 23, glossy part 2) a `pics` item { img | svg, stage: true } stands on a gold stand in a spotlight (the Bike Shop's
// bike, My Car); `live` rows sit in a gold-rimmed frame (frame: false = without); tile headings are little ribbons.
// (Nov 23, part 2b) results: `pics` rows with `glow: true` ('wide' = wider) sit on a golden glow with light rays (the medal,
// RC's podium, cup tables); the stars row too (each star bursts into twinkles); { t: 'plaque', label, value, best } = the score
// on a dark plaque with a gold rim (+ a pink NEW BEST! ribbon).
// Button items can have `dim: true` (half see-through: "not yet") and `minW`, and `hold: ms` (a grown-ups button:
// it only works when held down that long, filling up with green; ArcadeMenus.holding = how full, 0..1). ArcadeMenus.wiggle(obj) = a "no" wiggle.
// screen.noDrag = dragging doesn't scroll the screen (a drawing board on it).
// screen.onSwipe(dir) = a sideways swipe: dir 1 = next page, -1 = back (the Sticker Book turns its pages).
// screen.fit = when the screen is only a little too tall (it would scroll), its biggest picture row shrinks to make
//   it fit (Nov 23: the results: RC's podium + NEW BEST! scrolled by a few lines on a computer). See fitShrink().
// screen.scrollTo = an attr: the screen opens scrolled so that thing is in view (the maze map's current stone).
// Screen: { id, title, banner, logo, look: 'panel' | 'title', bg, rows, top: row, footer: row, onKey(code) }
//   (top = a row (or a list of rows) that stays put above the scrolling part, e.g. picture tabs; a round item with
//    `picked: true` is the open tab: yellow)
// The look (Nov 23, Keith: "make it look sharp", glossy arcade): shiny layered boxes (gloss()), shiny ball buttons
// (ballTex()), a gradient panel with a gold rim, titles on a pink sign, words in Fredoka, title screens with a glowing,
// moving background (backdrop()) and logos drawn piece by piece so they can move (drawLogo(), from Arcade.logo.spec).
// Tests: list() says what can be tapped, where, and whether it's `shown` (not scrolled out of sight).
// Opening a screen with the SAME id as the one on show (a shop after buying something) keeps
// where it was scrolled to and doesn't pop in again: it just changes.
// =====================================================================
(function () {
  'use strict';
  if (!window.Phaser || !window.rexuiplugin) return;      // (no Phaser: the kit keeps its HTML menus)
  const INK = 0x2b2b2b;
  const FONT = "'Lilita One', 'Arial Rounded MT Bold', 'Arial Black', sans-serif";
  const BODY_FONT = "'Fredoka', 'Trebuchet MS', 'Arial', sans-serif";   // (Nov 23: Fredoka, a round friendly font, in arcade/fonts)
  const COLORS = { big: 0x06d6a0, yellow: 0xffd166, blue: 0x8ecae6, pink: 0xffafcc, white: 0xffffff, green: 0x06d6a0 };
  const num = (c) => typeof c === 'number' ? c : parseInt(String(c || '#ffffff').replace('#', ''), 16);
  // Calm motion (Nov 22, see Arcade.calm in shared.js): screens just appear, nothing hops, floats or pulses,
  // presses still squish a little (so a finger can see it counted) but without the boing.
  const calm = () => !!(window.Arcade && Arcade.calm && Arcade.calm());

  let game = null, scene = null, holder = null, ready = false, pending = null;
  let current = null, root = [], hits = [], k = 1, dpr = 1, wide = true;
  let liveTicks = [];                  // (live rows: what runs every frame while their screen is open)
  const M = window.ArcadeMenus = { isOpen: false };

  // ---- start Phaser (a canvas that covers the page while a menu is open) ----
  function boot() {
    if (game) return;
    holder = document.createElement('div');
    holder.className = 'ar-cmenu';
    document.body.appendChild(holder);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    game = new Phaser.Game({
      type: Phaser.AUTO, parent: holder, transparent: true, banner: false,
      width: Math.round(innerWidth * dpr), height: Math.round(innerHeight * dpr),
      scale: { mode: Phaser.Scale.NONE },
      audio: { noAudio: true },
      input: { activePointers: 3 },
      render: { antialias: true, roundPixels: true },
      plugins: { scene: [{ key: 'rexUI', plugin: window.rexuiplugin, mapping: 'rexUI' }] },
      scene: {
        key: 'menus',
        create() {
          scene = this; ready = true;
          fit();
          watchFingers();
          if (pending) { const s = pending; pending = null; M.open(s); }
          else game.loop.sleep();                         // (asleep while no menu is open: no work for the phone)
        },
      },
    });
    addEventListener('resize', refit);
    // measure where the canvas is again at every touch, before Phaser reads the finger (Nov 22: on a phone's first
    // load the page can still move a little after Phaser measured it, and then fingers land in the wrong spot)
    const measure = () => { if (game && game.scale && game.scale.updateBounds) game.scale.updateBounds(); };
    for (const type of ['touchstart', 'mousedown']) holder.addEventListener(type, measure, { capture: true, passive: true });
  }
  // The screen changed size: fit + redraw the menu. (Keith, Nov 21: "RC menu isn't working" on an Android phone.
  // Android's browser bar slides in and out when a finger touches the screen, and every slide is a "resize". The menu
  // was redrawn in the middle of the tap, so the button under the finger was a new one when the finger lifted, and the
  // tap was lost. Now: no redraw while a finger is down (it waits for the finger to lift), and none when the size
  // hardly changed.)
  let fitT = 0, fingers = 0, laidOut = '';
  function refit() {
    if (!ready) return;
    clearTimeout(fitT);
    fitT = setTimeout(() => {
      if (fingers > 0) return;                            // (the pointerup below tries again)
      const size = innerWidth + 'x' + innerHeight;
      if (size === laidOut) return;
      fit();
      if (current) build(current);
    }, 120);
  }
  function watchFingers() {
    scene.input.on('pointerdown', () => { fingers++; });
    const up = () => { fingers = Math.max(0, fingers - 1); if (!fingers && innerWidth + 'x' + innerHeight !== laidOut) refit(); };
    scene.input.on('pointerup', up); scene.input.on('pointerupoutside', up);
    // (a finger that slides off the page is never "up": count again from what Phaser knows)
    scene.input.on('gameout', () => { fingers = scene.input.manager.pointers.filter(p => p.isDown).length; });
  }
  // the canvas = the whole window, in real screen pixels; the board (BOARD) fits inside
  function fit() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
    game.scale.resize(w, h);
    game.canvas.style.width = innerWidth + 'px'; game.canvas.style.height = innerHeight + 'px';
    // (Phaser must measure the canvas again now that its on-screen size is set, or a finger lands in the wrong spot:
    //  it would think the canvas is as big on the screen as it has pixels, and every tap hits half-way up and left)
    game.scale.refresh();
    wide = innerWidth >= innerHeight;
    laidOut = innerWidth + 'x' + innerHeight;
    const phone = document.documentElement.classList.contains('ar-phone');
    const room = phone ? 0.9 : 0.96;
    const bw = wide ? BOARD[0] : BOARD_UP[0], bh = wide ? BOARD[1] : boardUpH();
    k = Math.min(w * room / bw, h * room / bh);
  }
  const U = (n) => n * k;                                       // board units -> canvas pixels
  const BOARD = [820, 520];           // the board everything is laid out on (scaled to fit the screen)
  const BOARD_UP = [480, 820];        // ...on a phone held upright (narrower, so everything comes out bigger)
  // (Nov 22: a tall phone gets a taller board, up to 1040, so the menu uses the whole screen instead of leaving
  //  a big empty band above and below; everything stays the same size, there's just more room to scroll)
  const boardUpH = () => Math.max(BOARD_UP[1], Math.min(1040, Math.round(BOARD_UP[0] * innerHeight / Math.max(1, innerWidth))));

  // ---- SVG pictures -> textures (loaded before a screen is drawn) ----
  const texCache = {};
  function hash(s) { let x = 0; for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) | 0; return 'svg' + (x >>> 0).toString(36) + '_' + s.length; }
  function svgSize(svg) {
    const vb = /viewBox="\s*([-\d.]+)[\s,]+([-\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(svg);
    return vb ? [+vb[3], +vb[4]] : [48, 48];
  }
  // an SVG drawing as an <img>-ready data: URL, `w` x `h` pixels (SVG-as-image is strict: see below)
  function svgURL(svg, w, h) {
    let src = svg.replace(/<svg\b([^>]*)>/, (m, a) => {
      a = a.replace(/\s(width|height|style|class)="[^"]*"/g, '');
      return `<svg${a} width="${Math.round(w)}" height="${Math.round(h)}"${/xmlns=/.test(a) ? '' : ' xmlns="http://www.w3.org/2000/svg"'}>`;
    });
    // (an SVG picture must be strict XML: a tag may not have the same attribute twice. Inside a web
    //  page that's forgiven, and the first one counts, so keep the first one here too.)
    src = src.replace(/<([a-zA-Z]+)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>/g, (m, tag, attrs, close) => {
      const seen = new Set(), keep = [];
      attrs.replace(/\s+([\w:-]+)="([^"]*)"/g, (a, n, v) => { if (!seen.has(n)) { seen.add(n); keep.push(` ${n}="${v}"`); } return a; });
      return `<${tag}${keep.join('')}${close ? ' /' : ''}>`;
    });
    // (CSS animations inside a picture: a still copy is taken at their very first moment, when some parts
    //  are still invisible (the logo's title pops in). So the still copy gets no animations.)
    src = src.replace(/animation(-[a-z]+)?\s*:[^;}"]*;?/g, '');
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src);
  }
  // (My House, Nov 21: its room is drawn layer by layer on a canvas of its own, from these)
  M.svgURL = svgURL;
  // a picture as a texture, drawn at `px` pixels on its longer side
  function loadPic(svg, px) {
    const key = hash(svg + '@' + Math.round(px));
    if (texCache[key]) return texCache[key];
    texCache[key] = new Promise((res) => {
      const [vw, vh] = svgSize(svg), s = px / Math.max(vw, vh);
      const img = new Image();
      img.onload = () => { if (!scene.textures.exists(key)) scene.textures.addImage(key, img); res(key); };
      img.onerror = () => res(null);
      img.src = svgURL(svg, vw * s, vh * s);
    });
    return texCache[key];
  }
  function loadImg(url) {               // a ready-made picture (a data: URL, like Jungle Jump's heroes)
    const key = hash(url);
    if (texCache[key]) return texCache[key];
    texCache[key] = new Promise((res) => {
      const img = new Image();
      img.onload = () => { if (!scene.textures.exists(key)) scene.textures.addImage(key, img); res(key); };
      img.onerror = () => res(null);
      img.src = url;
    });
    return texCache[key];
  }
  // an HTML bit (the kit's old "meta" lines) -> its pictures + its words
  M.split = (html) => {
    const out = [];
    String(html || '').replace(/<svg[\s\S]*?<\/svg>|<img[^>]*src="([^"]+)"[^>]*>|[^<]+|<[^>]+>/g, (m, imgSrc) => {
      if (m.startsWith('<svg')) out.push({ svg: m });
      else if (imgSrc) out.push({ img: imgSrc });
      else if (!m.startsWith('<')) { const t = m.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim(); if (t) out.push({ text: t }); }
      return m;
    });
    return out;
  };

  // ---- open a screen ----
  M.open = (screen) => {
    boot();
    current = screen; M.isOpen = true;
    if (!game || !game.loop || !game.loop.running) fingers = 0;   // (the menu was asleep: no finger can still be counted as down)
    holder.classList.add('show');
    document.body.classList.add('ar-menu-open');
    if (!ready) { pending = screen; return; }
    game.loop.wake();
    build(screen);
  };
  let lastId = null, lastTab = null;
  M.close = () => {
    if (!M.isOpen) return;
    current = null; M.isOpen = false; lastId = null;
    clear();
    if (holder) holder.classList.remove('show');
    document.body.classList.remove('ar-menu-open');
    if (ready) game.loop.sleep();
  };
  let swipeOff = null;
  function clear() {
    if (swipeOff) { swipeOff(); swipeOff = null; }
    for (const f of liveTicks) scene.events.off('update', f);
    liveTicks = [];
    for (const o of root) o.destroy(); root = []; hits = []; if (scene) scene.tweens.killAll();
  }
  // a live row: the game's canvas becomes a texture that is refreshed every frame
  let liveNo = 0;
  function live(row, width) {
    const key = 'live' + (++liveNo);                            // (a new name each time: the old picture may still be fading out)
    const tex = scene.textures.addCanvas(key, row.canvas);
    const im = scene.add.image(0, 0, key);
    im.setScale(U(Math.min(row.w || width, width)) / row.canvas.width);
    im.setInteractive({ useHandCursor: true });
    // where a finger is, in the canvas's own pixels (also outside the picture while dragging)
    const at = (p) => { const b = im.getBounds(); return [(p.x - b.x) / b.width * row.canvas.width, (p.y - b.y) / b.height * row.canvas.height]; };
    // dragging (RC's Track Builder, Nov 21): onDown(x, y, cssWidth), then onMove(x, y) + onUp() wherever the finger goes
    const move = (p) => { if (im.active && row.onMove) row.onMove(...at(p)); };
    const up = () => {
      scene.input.off('pointermove', move); scene.input.off('pointerup', up); scene.input.off('pointerupoutside', up);
      if (row.onUp) row.onUp();
    };
    im.on('pointerdown', (p) => {
      if (!onCanvas(p)) return;
      if (row.onTap) row.onTap(...at(p));
      if (row.onDown) {
        row.onDown(...at(p), im.getBounds().width / dpr);
        scene.input.on('pointermove', move); scene.input.on('pointerup', up); scene.input.on('pointerupoutside', up);
      }
    });
    im.once('destroy', () => { scene.input.off('pointermove', move); scene.input.off('pointerup', up); scene.input.off('pointerupoutside', up); });
    // (a canvas with `dirty = false` hasn't changed: no need to copy it again; Fishing's aquarium never says, so it's copied every frame)
    const tick = () => { if (!im.active || row.canvas.dirty === false) return; tex.refresh(); if (row.canvas.dirty) row.canvas.dirty = false; };
    scene.events.on('update', tick);
    liveTicks.push(tick);
    im.once('destroy', () => { scene.events.off('update', tick); setTimeout(() => { if (scene.textures.exists(key)) scene.textures.remove(key); }, 0); });
    hits.push({ obj: im, it: { label: row.label || '', attr: row.attr || 'live' }, drags: !!row.onDown });
    return im;
  }

  // collect every picture a screen needs, load them all, then draw
  let buildNo = 0;
  async function build(screen, fitting) {
    const my = ++buildNo;
    if (!fitting) for (const r of fitRows(screen)) if (r._size0) r.size = r._size0;   // (start from the full size again: a resize)
    const jobs = [];
    const want = (svg, px) => { if (svg) jobs.push(loadPic(svg, px * k)); };
    // a logo made by Arcade.logo is drawn piece by piece (see "Logos" below): only its round badge is a picture
    const spec = screen.logo && logoSpec(screen.logo);
    if (spec) jobs.push(loadPic(spec.badge, Math.round(logoRoom(screen) * 300 / 800)));
    else if (screen.logo) want(screen.logo, 520);
    want(M.lockIcon, 34);                                        // (the padlock + the big results stars)
    for (const st of [M.starOn, M.starOff]) { want(st, 84); want(st, 68); }
    // (columns hold rows of their own)
    const flat = (rows) => rows.flatMap(r => r.t === 'cols' ? flat(r.cols.flatMap(c => c.rows)) : [r]);
    for (const row of flat(screen.rows.concat(screen.footer ? [screen.footer] : [], [].concat(screen.top || [])))) {
      for (const it of row.items || []) {
        if (it.icon) want(it.icon, it.big ? 80 : 44);
        if (it.pic) want(it.pic, it.logo ? 200 : 130);
        if (it.badge) want(it.badge, 50);
        if (it.img) jobs.push(loadImg(it.img));
        if (it.svg) want(it.svg, row.t === 'pics' ? row.size || 70 : 36);   // (a picture on a stage / in a frame is big)
        for (const m of it.meta || []) { if (m.svg) want(m.svg, 26); if (m.img) jobs.push(loadImg(m.img)); }
        if (row.t === 'pics' && typeof it === 'string') {
          const sp = logoSpec(it);                               // (the hub's small logo)
          if (sp) jobs.push(loadPic(sp.badge, Math.round(U(row.size || 70) * 300 / 800)));
          else want(it, row.size || 70);
        }
      }
      if (row.icon) want(row.icon, 44);
    }
    if (document.fonts && document.fonts.load) {
      jobs.push(document.fonts.load('40px "Lilita One"').catch(() => null));
      jobs.push(document.fonts.load('bold 20px "Fredoka"').catch(() => null));
    }
    await Promise.all(jobs);
    if (my !== buildNo || current !== screen) return;      // (another screen was opened meanwhile)
    // the same screen again (it changed): keep the scroll spot, no pop-in
    const same = !!(screen.id && lastId === screen.id && M.scroller && M.scroller.scene);
    const keepT = same && screen.tab === lastTab ? M.scroller.t : 0;   // (another tab: back to the top)
    clear();
    M.scroller = null;
    draw(screen, same && !fitting);
    lastId = screen.id; lastTab = screen.tab;
    if (same && M.scroller) M.scroller.t = keepT;
    // screen.fit: a little too tall? shrink the biggest picture and draw it again (this first try is never seen)
    if (screen.fit && !fitting && M.scroller && M.scroller.isOverflow && fitShrink(screen, -M.scroller.bottomChildOY / k)) {
      for (const o of root) o.setVisible(false);
      lastId = null;                                             // (so the 2nd draw pops in like a new screen)
      return build(screen, true);
    }
  }
  // the picture rows a screen.fit screen may shrink (big ones only: never the stars or a medal)
  function fitRows(screen) {
    return screen.fit ? screen.rows.filter(r => r.t === 'pics' && (r.size || 70) >= 150) : [];
  }
  // shrink the biggest picture row by `over` board units (+ a little room); no more than a third of it
  function fitShrink(screen, over) {
    const big = fitRows(screen).sort((a, b) => b.size - a.size)[0];
    if (!big) return false;
    const size0 = big._size0 || big.size, want = Math.floor(big.size - over - 12);
    if (want < size0 * 0.66) return false;                       // (much too tall: better to scroll than a tiny picture)
    big._size0 = size0; big.size = want;
    return true;
  }

  // ---- drawing helpers ----
  const keyOf = (svg, px) => hash(svg + '@' + Math.round(px * k));
  function text(str, size, opt = {}) {
    const t = scene.add.text(0, 0, str, {
      fontFamily: opt.body ? BODY_FONT : FONT, fontSize: Math.round(U(size)) + 'px', color: opt.color || '#ffffff',
      stroke: opt.stroke === false ? undefined : (opt.strokeColor || '#2b2b2b'), strokeThickness: opt.stroke === false ? 0 : Math.max(1, U(opt.strokeW || size / 6)),
      align: 'center', fontStyle: opt.body ? 'bold' : 'normal',
      wordWrap: opt.wrap ? { width: U(opt.wrap), useAdvancedWrap: true } : undefined,
    });
    t.setOrigin(0.5);
    return t;
  }
  function pic(svg, px, img) {
    const key = img ? hash(img) : keyOf(svg, px);
    if (!scene.textures.exists(key)) return scene.add.rectangle(0, 0, U(px), U(px), 0, 0);
    const im = scene.add.image(0, 0, key);
    if (img) { const s = U(px) / Math.max(im.width, im.height); im.setScale(s); }
    return im;
  }
  function box(w, h, fill, opt = {}) {
    // (a corner can't be rounder than half the box: Rex draws a huge shape otherwise; 'pill' = fully round ends)
    const rad = opt.r === 'pill' ? h / 2 : Math.min(opt.r != null ? opt.r : 20, w / 2, h / 2);
    const r = scene.rexUI.add.roundRectangle(0, 0, U(w), U(h), U(rad), fill, opt.alpha != null ? opt.alpha : 1);
    r.setStrokeStyle(U(opt.line != null ? opt.line : 5), opt.lineColor != null ? opt.lineColor : INK);
    return r;
  }
  // ---- the glossy arcade look (Nov 23, Keith: "make it look sharp") ----
  // Every box (tiles, buttons, the panel) is a few layers: a soft drop shadow under it, the colored box with its
  // black outline, a darker band along the bottom (so it looks round, like a real arcade button) and a white shine
  // across the top. Round buttons are little shiny balls painted once on a hidden canvas (ballTex).
  const mixC = (a, b, t) => { const c = (sh) => Math.round(((a >> sh) & 255) + ((((b >> sh) & 255) - ((a >> sh) & 255)) * t)); return (c(16) << 16) | (c(8) << 8) | c(0); };
  const lighter = (c, t) => mixC(c, 0xffffff, t), darker = (c, t) => mixC(c, 0x000000, t);
  const css = (c) => '#' + c.toString(16).padStart(6, '0');
  // the fancy effects (glow, shine) need WebGL; without it (very old phones) things just look a bit plainer
  // (and a slow device, the Parent corner's "lite" drawing, skips them too, like the floating sparkles)
  const slow = () => !!(window.Arcade && Arcade.parent && Arcade.parent.lite && Arcade.parent.lite());
  const fxOK = () => !!(game && game.renderer && game.renderer.type === Phaser.WEBGL) && !slow();
  // gloss(sizer, w, h, color, opt): give a Rex sizer the layered glossy background; returns [layers], base = [1]
  function gloss(sizer, w, h, color, opt = {}) {
    const rad = opt.r === 'pill' ? h / 2 : Math.min(opt.r != null ? opt.r : 20, w / 2, h / 2);
    const line = opt.line != null ? opt.line : 5, depth = opt.depth != null ? opt.depth : 5;
    const layers = [];
    // (Rex: addBackground(obj, padding) = the layer is the box made smaller by the padding; a negative bottom
    //  padding + the same positive top = the same size, moved down: that's the shadow)
    const sh = scene.rexUI.add.roundRectangle(0, 0, U(w), U(h), U(rad), INK, opt.shadow != null ? opt.shadow : 0.3);
    sizer.addBackground(sh, { top: U(depth), bottom: -U(depth), left: 0, right: 0 }); layers.push(sh);
    const base = box(w, h, color, { r: opt.r, line, lineColor: opt.lineColor });
    sizer.addBackground(base); layers.push(base);
    // (a layer's corners may never be rounder than half its own height, or Rex draws a giant shape)
    const in1 = line + 1, shadeH = h * 0.45 - in1, shineH = h * 0.36 - line - 3;
    if (shadeH > 8) {
      const shade = scene.rexUI.add.roundRectangle(0, 0, U(w), U(shadeH), U(Math.min(rad * 0.8, shadeH / 2 - 1)), 0x000000, 0.1);
      sizer.addBackground(shade, { top: U(h - in1 - shadeH), bottom: U(in1), left: U(in1), right: U(in1) }); layers.push(shade);
    }
    if (shineH > 6) {
      const side = Math.min(w * 0.3, rad * 0.45 + line + 6);
      const shine = scene.rexUI.add.roundRectangle(0, 0, U(w), U(shineH), U(Math.min(rad * 0.6, shineH / 2 - 1)), 0xffffff, opt.shine != null ? opt.shine : 0.45);
      sizer.addBackground(shine, { top: U(line + 3), bottom: U(h - line - 3 - shineH), left: U(side), right: U(side) }); layers.push(shine);
    }
    return layers;
  }
  // a shiny ball (a round button): painted once per color + size on a hidden canvas, then used as a picture
  function ballTex(color, d, ring) {
    const px = Math.max(8, Math.round(d)), key = 'ball' + color.toString(16) + '_' + px + '_' + Math.round(ring);
    if (scene.textures.exists(key)) return key;
    const cv = document.createElement('canvas'); cv.width = cv.height = px;
    const c = cv.getContext('2d'), r = px / 2;
    // the ball: light on top, its own color in the middle, darker round the edge
    const g = c.createRadialGradient(r, px * 0.32, px * 0.04, r, r * 1.05, r);
    g.addColorStop(0, css(lighter(color, 0.6))); g.addColorStop(0.55, css(color)); g.addColorStop(1, css(darker(color, 0.2)));
    c.fillStyle = g; c.beginPath(); c.arc(r, r, r - ring / 2, 0, Math.PI * 2); c.fill();
    // a soft light along the bottom inside edge (light bouncing back up)
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = ring * 0.7;
    c.beginPath(); c.arc(r, r, r - ring * 1.6, Math.PI * 0.2, Math.PI * 0.8); c.stroke();
    // the black outline
    c.strokeStyle = '#2b2b2b'; c.lineWidth = ring; c.beginPath(); c.arc(r, r, r - ring / 2, 0, Math.PI * 2); c.stroke();
    // the shine: a soft white oval near the top
    const sg = c.createLinearGradient(0, px * 0.12, 0, px * 0.42);
    sg.addColorStop(0, 'rgba(255,255,255,0.85)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = sg; c.beginPath(); c.ellipse(r, px * 0.27, px * 0.29, px * 0.15, 0, 0, Math.PI * 2); c.fill();
    scene.textures.addCanvas(key, cv);
    return key;
  }
  // ---- the special screens' look (Nov 23, Glossy menus part 2: shops, books + builders) ----
  // A section heading inside a list ("Upgrades", "Bait", "Sunny Pond"): a little shiny ribbon with a twinkle
  // on each side, instead of plain words floating on the purple.
  const HEAD_COLOR = 0x7b5cff;
  function headingSign(str, width) {
    sparkTex();
    const t = text(str, 22, { strokeW: 5, wrap: width - 110 });
    const tw = t.width / U(1), th = 40;                         // (how wide the words are, in board units)
    const s = scene.rexUI.add.sizer({ orientation: 'x', space: { left: U(26), right: U(26), top: U(4), bottom: U(6) } });
    gloss(s, tw + 52, th, HEAD_COLOR, { r: 'pill', line: 4, depth: 4, shine: 0.35 });
    s.add(t, { align: 'center' });
    scene.children.bringToTop(t);                               // (the words were made first, to measure them: put them on top)
    const row = scene.rexUI.add.sizer({ orientation: 'x', space: { item: U(8) } });
    const star = () => scene.add.image(0, 0, 'mn-spark').setDisplaySize(U(22), U(22)).setTint(0xffd166);
    row.add(star(), { align: 'center' }); row.add(s, { align: 'center' }); row.add(star(), { align: 'center' });
    return row;
  }
  // A colored card behind a row (row.bg: a Sticker Book page, the bike builder's two boxes): a soft shadow, the
  // color getting a little deeper towards the bottom, a black outline and a thin light line just inside it.
  // (A blend instead of gloss()'s shine bands: a card can be any height, and the blend stretches with it.)
  function cardBg(sizer, color) {
    sizer.addBackground(scene.rexUI.add.roundRectangle(0, 0, 40, 40, U(26), INK, 0.3), { top: U(6), bottom: -U(6), left: 0, right: 0 });
    sizer.addBackground(scene.rexUI.add.roundRectangleCanvas(0, 0, 40, 40, U(26), css(lighter(color, 0.22)), css(INK), U(5), css(darker(color, 0.1))));
    const rim = scene.rexUI.add.roundRectangle(0, 0, 40, 40, U(20), 0x000000, 0).setStrokeStyle(U(2.5), 0xffffff, 0.55);
    sizer.addBackground(rim, { top: U(7), bottom: U(7), left: U(7), right: U(7) });
  }
  // The stage (a shop's "this is yours" picture: the bike in the Bike Shop, your car in My Car): a soft spotlight
  // glow, a round gold stand under it and slow light rays. Painted once on a hidden canvas.
  function stageTex() {
    if (scene.textures.exists('mn-stage')) return;
    const cv = document.createElement('canvas'); cv.width = 320; cv.height = 220;
    const c = cv.getContext('2d');
    const g = c.createRadialGradient(160, 110, 6, 160, 110, 150);   // the spotlight
    g.addColorStop(0, 'rgba(255,248,214,0.75)'); g.addColorStop(0.5, 'rgba(255,230,150,0.28)'); g.addColorStop(1, 'rgba(255,230,150,0)');
    c.fillStyle = g; c.fillRect(0, 0, 320, 220);
    // the stand: a dark side, then a gold top with a shine
    c.lineWidth = 5; c.strokeStyle = '#2b2b2b';
    c.fillStyle = '#c9882a'; c.beginPath(); c.ellipse(160, 186, 118, 24, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillRect(42, 170, 236, 16);
    const top = c.createLinearGradient(0, 152, 0, 192);
    top.addColorStop(0, '#ffe08a'); top.addColorStop(1, '#f4b23e');
    c.fillStyle = top; c.beginPath(); c.ellipse(160, 172, 118, 24, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(140, 166, 66, 8, 0, 0, Math.PI * 2); c.fill();
    scene.textures.addCanvas('mn-stage', cv);
  }
  function stage(item, px) {
    stageTex(); sparkTex();
    const w = px * 1.6, h = px * 1.1;
    const o = scene.rexUI.add.overlapSizer({ width: U(w), height: U(h) });
    const rays = scene.add.image(0, 0, 'mn-rays').setDisplaySize(U(h * 1.5), U(h * 1.5)).setAlpha(0.55);
    const st = scene.add.image(0, 0, 'mn-stage').setDisplaySize(U(w), U(w * 220 / 320));
    const p = typeof item === 'string' ? pic(item, px) : pic(item.svg, px, item.img);
    o.add(rays, { expand: false, align: 'center', offsetY: -U(h * 0.08) });
    o.add(st, { expand: false, align: 'bottom' });
    o.add(p, { expand: false, align: 'center', offsetY: -U(h * 0.1) });
    if (!calm()) {
      scene.tweens.add({ targets: rays, angle: 360, duration: 40000, repeat: -1 });
      // (it breathes a little bigger and back: scale, not y, because scrolling moves things by their y)
      scene.tweens.add({ targets: p, scale: p.scale * 1.04, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 450 });
    }
    return o;
  }
  // A moving picture (the Track Builder's board, the aquarium, My House's room) sits in a frame: a soft shadow,
  // a dark edge and a gold rim, like a picture on the wall. FRAME = how much room the frame takes on each side.
  const FRAME = 7;
  function framed(im) {
    const s = scene.rexUI.add.sizer({ orientation: 'x', space: { left: U(FRAME), right: U(FRAME), top: U(FRAME), bottom: U(FRAME) } });
    s.addBackground(scene.rexUI.add.roundRectangle(0, 0, 40, 40, U(14), INK, 0.35), { top: U(6), bottom: -U(6), left: 0, right: 0 });
    s.addBackground(scene.rexUI.add.roundRectangle(0, 0, 40, 40, U(14), INK, 1).setStrokeStyle(U(3.5), 0xffd166, 1));
    s.add(im, { align: 'center' });
    scene.children.bringToTop(im);                              // (the picture was made first: put it on top of its frame)
    return s;
  }
  // ---- results (Nov 23, Glossy menus part 2b) ----
  // spotlit(w, h, make): something on a soft golden glow with light rays fanning out behind it (the stars and the
  // medal on the results, a game's big results picture: RC's podium, Turbo Bike's cup table). The glow + rays are ONE
  // picture painted to exactly the w x h box (an oval for a wide box), so they never make the row bigger.
  // make() builds the thing AFTER the glow, so it's drawn on top. The rays breathe slowly (not in Calm motion).
  function rayBoxTex(w, h, color) {
    const pw = Math.max(8, Math.round(U(w))), ph = Math.max(8, Math.round(U(h)));
    const key = 'mn-raybox' + pw + 'x' + ph + '_' + color.toString(16);
    if (scene.textures.exists(key)) return key;
    const cv = document.createElement('canvas'); cv.width = pw; cv.height = ph;
    const c = cv.getContext('2d'), r = pw / 2, n = 18;
    c.translate(pw / 2, ph / 2); c.scale(1, ph / pw);              // (a circle squashed into the box = an oval)
    const glow = c.createRadialGradient(0, 0, 0, 0, 0, r);
    glow.addColorStop(0, css(lighter(color, 0.5))); glow.addColorStop(0.35, 'rgba(255,224,138,0.45)'); glow.addColorStop(1, 'rgba(255,224,138,0)');
    c.fillStyle = glow; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    const rays = c.createRadialGradient(0, 0, 0, 0, 0, r);
    rays.addColorStop(0, 'rgba(255,255,255,0.4)'); rays.addColorStop(0.6, 'rgba(255,255,255,0.14)'); rays.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = rays;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = a0 + Math.PI / n * 0.9;
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r, a0, a1); c.closePath(); c.fill();
    }
    scene.textures.addCanvas(key, cv);
    return key;
  }
  function spotlit(w, h, make, color) {
    const o = scene.rexUI.add.overlapSizer({ width: U(w), height: U(h) });
    const bg = scene.add.image(0, 0, rayBoxTex(w, h, color || 0xffe08a)).setAlpha(0.85);
    o.add(bg, { expand: false, align: 'center' });
    o.add(make(), { expand: false, align: 'center' });
    if (!calm()) scene.tweens.add({ targets: bg, alpha: 0.5, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return o;
  }
  // a little burst of twinkles flying out of a star as it pops in (not in Calm motion)
  function burst(obj) {
    if (calm() || !scene) return;
    sparkTex();
    const b = obj.getBounds && obj.getBounds(); if (!b) return;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + Math.random() * 0.4, r = U(60 + Math.random() * 30);
      const s = scene.add.image(b.centerX, b.centerY, 'mn-spark').setDisplaySize(U(18), U(18)).setTint([0xffd166, 0xffffff, 0xff5fa2][i % 3]);
      scene.tweens.add({ targets: s, x: b.centerX + Math.cos(a) * r, y: b.centerY + Math.sin(a) * r, alpha: 0, angle: 180,
        duration: 650, ease: 'Cubic.easeOut', onComplete: () => s.destroy() });
    }
  }
  // the score on the results: a dark plaque with a gold rim ("SCORE" small, the number big), and a pink
  // "NEW BEST!" ribbon next to it that wiggles now and then
  function plaque(row, width) {
    const lab = text(row.label || 'SCORE', 20, { color: '#ffd166', strokeW: 4 });
    const val = text(String(row.value), 40, { strokeW: 7 });
    const tw = (lab.width + val.width) / U(1);
    const s = scene.rexUI.add.sizer({ orientation: 'x', space: { left: U(26), right: U(26), top: U(6), bottom: U(8), item: U(14) } });
    gloss(s, tw + 66, 66, 0x241a63, { r: 'pill', line: 5, lineColor: 0xffd166, shine: 0.18 });
    s.add(lab, { align: 'center' }); s.add(val, { align: 'center' });
    scene.children.bringToTop(lab); scene.children.bringToTop(val);   // (made first, to measure: on top of the plaque)
    const parts = [s];
    if (row.best) {
      const bt = text('NEW BEST!', 24, { strokeW: 5 });
      const b = scene.rexUI.add.sizer({ orientation: 'x', space: { left: U(20), right: U(20), top: U(4), bottom: U(6) } });
      gloss(b, bt.width / U(1) + 40, 46, 0xff5fa2, { r: 'pill', line: 4, depth: 4 });
      b.add(bt, { align: 'center' }); scene.children.bringToTop(bt);
      parts.push(b);
      if (!calm()) scene.tweens.add({ targets: bt, angle: { from: -5, to: 5 }, duration: 260, yoyo: true, repeat: -1, repeatDelay: 1600, ease: 'Sine.easeInOut', delay: 900 });
      popLater.push([bt, 900, true]);
    }
    return wrapRow(width, parts, 12);
  }
  // little pictures for the sparkles that float about (made once)
  function sparkTex() {
    if (scene.textures.exists('mn-spark')) return;
    const mk = (key, px, paint) => { const cv = document.createElement('canvas'); cv.width = cv.height = px; paint(cv.getContext('2d'), px); scene.textures.addCanvas(key, cv); };
    mk('mn-spark', 64, (c, p) => {              // a 4-point twinkle with a black outline
      const m = p / 2, a = p * 0.44, b = p * 0.11;
      c.beginPath(); c.moveTo(m, m - a); c.lineTo(m + b, m - b); c.lineTo(m + a, m); c.lineTo(m + b, m + b);
      c.lineTo(m, m + a); c.lineTo(m - b, m + b); c.lineTo(m - a, m); c.lineTo(m - b, m - b); c.closePath();
      c.fillStyle = '#fff'; c.fill(); c.lineJoin = 'round'; c.lineWidth = 4; c.strokeStyle = '#2b2b2b'; c.stroke();
    });
    mk('mn-dot', 64, (c, p) => {                // a soft round glow (a floating bubble of light)
      const g = c.createRadialGradient(p / 2, p / 2, 0, p / 2, p / 2, p / 2);
      g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.4, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, p, p);
    });
    mk('mn-rays', 512, (c, p) => {              // soft light rays (they turn slowly behind a logo)
      const m = p / 2, n = 16;
      const g = c.createRadialGradient(m, m, 0, m, m, m);
      g.addColorStop(0, 'rgba(255,255,255,0.32)'); g.addColorStop(0.6, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2, a1 = a0 + Math.PI / n * 0.9;
        c.beginPath(); c.moveTo(m, m); c.arc(m, m, m, a0, a1); c.closePath(); c.fill();
      }
    });
  }
  // the moving background of a title screen: the game's color as a soft glow, slow light rays and floating sparkles
  // (Calm motion: the same picture, standing still, without the sparkles)
  function backdrop(screen, W, H) {
    const c = num(screen.bg || '#4cc9f0');
    const key = 'bd' + c.toString(16);
    if (!scene.textures.exists(key)) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 128;
      const x = cv.getContext('2d'), g = x.createRadialGradient(64, 46, 4, 64, 64, 92);
      g.addColorStop(0, css(lighter(c, 0.5))); g.addColorStop(0.55, css(c)); g.addColorStop(1, css(darker(c, 0.28)));
      x.fillStyle = g; x.fillRect(0, 0, 128, 128);
      scene.textures.addCanvas(key, cv);
    }
    const out = [scene.add.image(W / 2, H / 2, key).setDisplaySize(W, H)];
    sparkTex();
    const rays = scene.add.image(W / 2, H / 2, 'mn-rays').setDisplaySize(Math.max(W, H) * 1.6, Math.max(W, H) * 1.6).setAlpha(0.8);
    out.push(rays);
    if (!calm()) scene.tweens.add({ targets: rays, angle: 360, duration: 90000, repeat: -1 });
    if (!calm() && !slow()) {
      const pc = scene.add.particles(0, 0, 'mn-dot', {
        x: { min: 0, max: W }, y: H + U(30), lifespan: 14000, frequency: 520, quantity: 1,
        speedY: { min: -U(28), max: -U(60) }, speedX: { min: -U(8), max: U(8) },
        scale: { min: U(0.25), max: U(0.9) }, alpha: { start: 0.75, end: 0 }, advance: 12000,
      });
      const sp = scene.add.particles(0, 0, 'mn-spark', {
        x: { min: 0, max: W }, y: { min: 0, max: H }, lifespan: 2200, frequency: 650, quantity: 1,
        scale: { onEmit: () => 0, onUpdate: (pt, key, t) => Math.sin(t * Math.PI) * U(0.45) }, rotate: { min: -40, max: 40 }, alpha: 0.95,
      });
      out.push(pc, sp);
    }
    return out;
  }

  // ---- Logos (Nov 23) ----
  // Arcade.logo() makes an SVG for the HTML menus and remembers its pieces (Arcade.logo.spec): the name, colors,
  // and a round badge picture. Here every piece is drawn on its own so it can move:
  //   * a starburst behind the badge that turns slowly        * the badge, which drops in and bobs
  //   * the name in chunky 3D letters along a gentle arch (painted letter by letter on a hidden canvas,
  //     with a color blend, a black outline, a darker 3D side and a shiny edge), which pops in and gets a
  //     shine sweeping across it now and then             * twinkles around it
  // Everything is measured in the old SVG's 800 x 560 frame, so it fills exactly the same spot.
  const logoSpec = (svg) => (window.Arcade && Arcade.logo && Arcade.logo.spec ? Arcade.logo.spec(svg) : null);
  // how wide a title screen's logo is, in canvas pixels (drawTitle uses this, and build() loads the badge that size)
  function logoRoom() {
    const bw = wide ? BOARD[0] : BOARD_UP[0], bh = wide ? BOARD[1] : boardUpH();
    return wide ? Math.min(U(bw * 0.5), U(bh * 0.85)) : Math.min(U(bw * 0.92), U(bh * 0.42));
  }
  const LFONT = (px) => `${px}px 'Lilita One', 'Arial Rounded MT Bold', 'Arial Black', sans-serif`;
  // the starburst, painted once per logo size
  function burstTex(spec, f) {
    const key = 'burst' + spec.c1 + spec.c2 + '_' + Math.round(f * 1000);
    if (scene.textures.exists(key)) return key;
    const R1 = 205, R2 = 160, N = 18, px = Math.ceil((R1 * 2 + 16) * f);
    const cv = document.createElement('canvas'); cv.width = cv.height = px;
    const c = cv.getContext('2d'); c.setTransform(f, 0, 0, f, px / 2, px / 2);
    c.beginPath();
    for (let i = 0; i < N * 2; i++) { const a = Math.PI * i / N, r = i % 2 ? R2 : R1; c[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
    c.closePath();
    const g = c.createRadialGradient(0, 0, 0, 0, 0, R1);
    g.addColorStop(0, spec.burstIn); g.addColorStop(1, spec.c2);
    c.globalAlpha = 0.95; c.fillStyle = g; c.fill();
    c.globalAlpha = 1; c.lineJoin = 'round'; c.lineWidth = 6; c.strokeStyle = '#2b2b2b'; c.stroke();
    scene.textures.addCanvas(key, cv);
    return key;
  }
  // the name (+ the ribbon "tag"), painted once per logo size: the frame from y 200 to 590
  const TOP = 200, BOT = 590;
  function titleTex(spec, f) {
    const key = 'ltitle' + hash(spec.l1 + '|' + spec.l2 + '|' + spec.tag + spec.c1 + spec.c2) + '_' + Math.round(f * 1000);
    if (scene.textures.exists(key)) return key;
    const cv = document.createElement('canvas'); cv.width = Math.ceil(800 * f); cv.height = Math.ceil((BOT - TOP) * f);
    const c = cv.getContext('2d'); c.setTransform(f, 0, 0, f, 0, -TOP * f);
    const lines = spec.l2 ? [[spec.l1, 368, 16], [spec.l2, 498, 12]] : [[spec.l1, 440, 18]];
    for (const [text, y, bend] of lines) paintLine(c, text, y, bend, spec);
    if (spec.tag) {                                              // a red ribbon with a word on it (Bubble School: ABC 123)
      c.save(); c.translate(400, spec.l2 ? 540 : 520);
      c.beginPath(); c.moveTo(-150, -26); c.lineTo(150, -26); c.lineTo(130, 0); c.lineTo(150, 26); c.lineTo(-150, 26); c.lineTo(-130, 0); c.closePath();
      c.fillStyle = '#ef476f'; c.fill(); c.lineJoin = 'round'; c.lineWidth = 6; c.strokeStyle = '#2b2b2b'; c.stroke();
      c.font = LFONT(34); c.textAlign = 'center'; c.lineWidth = 7; c.strokeText(spec.tag, 0, 12); c.fillStyle = '#fff'; c.fillText(spec.tag, 0, 12);
      c.restore();
    }
    scene.textures.addCanvas(key, cv);
    return key;
  }
  // one line of 3D letters along an arch (the same curve as the SVG logo: from x 20 to 780, middle `bend` higher)
  function paintLine(c, text, y, bend, spec) {
    const chars = [...text], size = Math.min(150, Math.round(1250 / Math.max(4, chars.length))), gap = 3;
    c.font = LFONT(size); c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.lineJoin = 'round';
    const ws = chars.map(ch => c.measureText(ch).width);
    let x = 400 - (ws.reduce((a, b) => a + b, 0) + gap * (chars.length - 1)) / 2;
    const L = chars.map((ch, i) => {
      const mid = x + ws[i] / 2, t = (mid - 20) / 760;          // (this curve's x goes straight along with t)
      const yy = (1 - t) * (1 - t) * (y + bend) + 2 * t * (1 - t) * (y - bend) + t * t * (y + bend);
      const slope = (2 * (1 - t) * (-2 * bend) + 2 * t * (2 * bend)) / 760;
      x += ws[i] + gap;
      return { ch, x: mid, y: yy, a: Math.atan(slope) };
    });
    // layer by layer over ALL the letters, so no letter's outline is painted over its neighbor's face
    const each = (fn) => { for (const l of L) { c.save(); c.translate(l.x, l.y); c.rotate(l.a); fn(l); c.restore(); } };
    each(l => { c.translate(0, 14); c.lineWidth = 26; c.strokeStyle = '#2b2b2b'; c.fillStyle = '#2b2b2b'; c.strokeText(l.ch, 0, 0); c.fillText(l.ch, 0, 0); });
    for (let k = 12; k > 0; k -= 2) each(l => { c.translate(0, k); c.lineWidth = 14; c.strokeStyle = '#2b2b2b'; c.strokeText(l.ch, 0, 0); c.fillStyle = spec.deep; c.fillText(l.ch, 0, 0); });
    const g = c.createLinearGradient(0, -size * 0.75, 0, 0);
    g.addColorStop(0, spec.light); g.addColorStop(0.45, spec.c1); g.addColorStop(1, spec.c2);
    each(l => { c.lineWidth = 12; c.strokeStyle = '#2b2b2b'; c.strokeText(l.ch, 0, 0); c.fillStyle = g; c.fillText(l.ch, 0, 0); });
    each(l => { c.translate(-2, -4); c.globalAlpha = 0.7; c.lineWidth = 3; c.strokeStyle = '#ffffff'; c.strokeText(l.ch, 0, 0); });
  }
  // the whole logo as moving pieces, centered on (cx, cy), `room` canvas pixels wide
  function drawLogo(spec, cx, cy, room, popIn) {
    const f = room / 800, P = (x, y) => [cx + (x - 400) * f, cy + (y - 280) * f];
    const out = [];
    const burst = scene.add.image(...P(400, 168), burstTex(spec, f));
    const badgeKey = keyOf(spec.badge, Math.round(room * 300 / 800) / k);
    const badge = scene.textures.exists(badgeKey) ? scene.add.image(...P(400, 168), badgeKey) : scene.add.circle(...P(400, 168), 134 * f, 0xffffff);
    badge.setDisplaySize(300 * f, 300 * f);
    const title = scene.add.image(...P(400, (TOP + BOT) / 2), titleTex(spec, f));
    const twinkles = [[150, 120, 1.2], [660, 80, 1.4], [690, 250, 1], [110, 290, 0.9]].map(([x, y, sc]) => {
      const t = scene.add.image(...P(x, y), 'mn-spark'); t.setScale(32 * sc * f / 64 * 1.3); t.base = t.scale; return t;
    });
    out.push(burst, badge, title, ...twinkles);
    // the shine that sweeps across the name, and a soft glow round the badge (WebGL only)
    if (fxOK() && !calm()) {
      if (title.preFX) title.preFX.addShine(0.45, 0.25, 4);
      if (badge.preFX) badge.preFX.addGlow(0xffffff, 3, 0, false, 0.1, 12);
    }
    if (calm()) return out;
    scene.tweens.add({ targets: burst, angle: 360, duration: 24000, repeat: -1 });
    const by = badge.y;
    scene.tweens.add({ targets: badge, y: by - 6 * f * 1.6, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: popIn ? 900 : 0 });
    twinkles.forEach((t, i) => scene.tweens.add({ targets: t, scale: t.base * 1.35, angle: 25, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 400 }));
    if (popIn) {                                                 // the pieces arrive one after the other
      const bs = burst.scale, ts = title.scale;
      burst.setScale(0); scene.tweens.add({ targets: burst, scale: bs, duration: 500, ease: 'Back.easeOut' });
      badge.y = by - 200 * f; badge.setAlpha(0);
      scene.tweens.add({ targets: badge, y: by, alpha: 1, duration: 650, delay: 120, ease: 'Bounce.easeOut' });
      title.setScale(ts * 0.4).setAlpha(0);
      scene.tweens.add({ targets: title, scale: ts, alpha: 1, duration: 650, delay: 320, ease: 'Back.easeOut', easeParams: [2.2] });
      for (const t of twinkles) { t.setScale(0); }
      twinkles.forEach((t, i) => scene.tweens.add({ targets: t, scale: t.base, duration: 300, delay: 700 + i * 120, ease: 'Back.easeOut' }));
    }
    return out;
  }
  // the logo as ONE still picture (it sits in a list that scrolls, like the hub's small logo), `px` wide
  function logoStill(spec, px) {
    const key = 'lstill' + hash(spec.badge.slice(0, 400) + spec.l1 + spec.l2) + '_' + Math.round(px);
    if (scene.textures.exists(key)) return key;
    const f = px / 800, cv = document.createElement('canvas'); cv.width = Math.ceil(px); cv.height = Math.ceil(px * 0.7);
    const c = cv.getContext('2d');
    const src = (k2) => scene.textures.exists(k2) ? scene.textures.get(k2).getSourceImage() : null;
    const b = src(burstTex(spec, f)); if (b) c.drawImage(b, 400 * f - b.width / 2, 168 * f - b.height / 2);
    const bd = src(keyOf(spec.badge, Math.round(px * 300 / 800) / k)); if (bd) c.drawImage(bd, 250 * f, 18 * f, 300 * f, 300 * f);
    const t = src(titleTex(spec, f)); if (t) c.drawImage(t, 0, TOP * f);
    scene.textures.addCanvas(key, cv);
    return key;
  }

  // Was this tap really on the menu? Phaser also hears taps on things lying on top of the canvas (the
  // Parent corner's "All done" wall, the hub's player editor, Nov 21): those must not press what's underneath.
  const onCanvas = (p) => !p || !p.event || !p.event.target || p.event.target === game.canvas;
  // make something tappable. The thing never changes size: its inside squishes (Nov 20).
  function tappable(obj, it, inside, bg) {
    const press = () => {
      if (bg && bg.setFillStyle && !it.dim) bg.setAlpha(0.85);
      scene.tweens.add({ targets: inside, scale: '*=0.9', duration: 70 });
    };
    const release = () => {
      if (bg && bg.setFillStyle && !it.dim) bg.setAlpha(1);
      for (const o of inside) { scene.tweens.killTweensOf(o); scene.tweens.add(calm() ? { targets: o, scale: o.baseScale || 1, duration: 90 } : { targets: o, scale: o.baseScale || 1, duration: 380, ease: 'Elastic.easeOut', easeParams: [1.1, 0.4] }); }
    };
    for (const o of inside) o.baseScale = o.scale;
    obj.setInteractive({ useHandCursor: true });
    let downAt = null;
    // it.hold = ms: a HOLD button (the Parent corner's door, Nov 21). A tap does nothing; the button fills up
    // with green while the finger stays down, and only when it's full does onTap run. Lifting early = start again.
    let holdTw = null;
    const startColor = bg && bg.fillColor != null ? bg.fillColor : 0xffffff;
    const mix = (a, b, t) => { const c = (s) => Math.round(((a >> s) & 255) + ((((b >> s) & 255) - ((a >> s) & 255)) * t)); return (c(16) << 16) | (c(8) << 8) | c(0); };
    const stopHold = () => { if (holdTw) { holdTw.stop(); holdTw = null; } if (bg && bg.setFillStyle && bg.active) bg.setFillStyle(startColor); M.holding = 0; };
    const startHold = () => {
      const prog = { v: 0 };
      holdTw = scene.tweens.add({ targets: prog, v: 1, duration: it.hold, ease: 'Linear',
        onUpdate: () => { M.holding = prog.v; if (bg && bg.setFillStyle && bg.active) bg.setFillStyle(mix(startColor, 0x06d6a0, prog.v)); },
        onComplete: () => { holdTw = null; downAt = null; stopHold(); release(); if (it.onTap) it.onTap(obj); } });
    };
    obj.on('pointerdown', (p) => { if (!onCanvas(p)) return; downAt = { x: p.x, y: p.y }; press(); if (it.hold) startHold(); });
    obj.on('pointerout', () => { if (downAt) { downAt = null; release(); } if (it.hold) stopHold(); });
    obj.on('pointerup', (p) => {
      if (it.hold) { stopHold(); if (downAt) { downAt = null; release(); } return; }   // (let go too soon: nothing happens)
      if (!downAt) return;
      if (!onCanvas(p)) { downAt = null; release(); return; }
      const moved = Math.hypot(p.x - downAt.x, p.y - downAt.y) > U(14);   // (a drag to scroll is not a tap)
      downAt = null; release();
      if (!moved && it.onTap) it.onTap(obj);
    });
    hits.push({ obj, it });
  }

  // a tile: picture, name, little pictures/words under it, a padlock when locked
  function tile(it, w, h) {
    if (it.logo) return logoTile(it, w, h);
    const s = scene.rexUI.add.sizer({ width: U(w), height: U(h), orientation: 'y', space: { top: U(8), bottom: U(8), left: U(6), right: U(6), item: U(4) } });
    // (it.color: a tile of its own color, like a sticker you don't have yet on its book page)
    const fillC = it.picked ? 0xffd166 : it.color != null ? num(it.color) : it.locked ? 0xe8e2d4 : 0xffffff;
    const bg = gloss(s, w, h, fillC, { r: 22, shine: it.locked ? 0.3 : 0.5 })[1];   // (Nov 23: shiny, with a shadow)
    const inside = [];
    // (a tile without a name, like a paint swatch or a goal picture: the picture gets the room)
    const tall = it.name ? 0.5 : it.fill ? 0.86 : 0.62;            // (it.fill: a picture that IS the tile, like the maze map's stones)
    const alone = !it.name && !(it.meta || []).length && !it.locked;     // (just a picture: it sits in the middle, Nov 21)
    if (alone) s.addSpace();
    if (it.pic || it.img) { const p = pic(it.pic, 130, it.img); const sc = Math.min(U(w - 20) / p.width, U(h * tall) / p.height); p.setScale(sc); if (it.locked) p.setAlpha(0.45); s.add(p, { align: 'center' }); inside.push(p); }
    if (alone) s.addSpace();
    if (it.name) { const nm = text(it.name, 18, { color: '#2b2b2b', stroke: false, body: true, wrap: w - 16 }); s.add(nm, { align: 'center' }); inside.push(nm); }
    if ((it.meta || []).length) {
      const row = scene.rexUI.add.sizer({ orientation: 'x', space: { item: U(3) } });
      for (const m of it.meta) {
        const o = m.svg || m.img ? pic(m.svg, 26, m.img) : text(m.text, 14, { color: '#2b2b2b', stroke: false, body: true, wrap: it.meta.length === 1 ? w - 16 : undefined });   // (a lone line of words wraps: RC's Item Book)
        row.add(o, { align: 'center' });
      }
      s.add(row, { align: 'center' }); inside.push(row);
    }
    if (it.locked && M.lockIcon) { const l = pic(M.lockIcon, 34); s.add(l, { align: 'center' }); }
    tappable(s, it, inside, bg);
    // it.badge = a picture sitting on the tile's top-right corner, bouncing (the hub's Daily Surprise present, Nov 21).
    // (pinned: it moves + scrolls with the tile but isn't laid out inside it)
    if (it.badge) {
      const bd = pic(it.badge, 50);
      const bx = U(w / 2 - 26), by = U(-h / 2 + 28);              // (inside the corner: the next tile can't cover it)
      bd.setPosition(bx, by);
      s.pin(bd);
      const hop = { v: 0 };
      if (!calm()) scene.tweens.add({ targets: hop, v: 1, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        onUpdate: () => { if (bd.active && s.setChildLocalPosition) s.setChildLocalPosition(bd, bx, by - U(7) * hop.v); } });
    }
    return s;
  }
  // A game's logo on the hub (Nov 23, Keith: "work on the logos, I don't think we need titles under them"):
  // no tile behind it, the picture IS the button (a shiny app icon, iconPic() in index.html), like a phone's home
  // screen; the stars / medals sit under it on a little white pill. Picked (a hearted game while picking hearts) =
  // a yellow glow behind the icon. it.badge (today's surprise present) bounces on its corner like on any tile.
  function logoTile(it, w, h) {
    const s = scene.rexUI.add.sizer({ width: U(w), height: U(h), orientation: 'y', space: { top: U(2), bottom: U(4), item: U(5) } });
    const bg = scene.add.rectangle(0, 0, 10, 10, 0xffffff, 0);           // (invisible: just something to hold the tile's size)
    s.addBackground(bg);
    const d = Math.min(w - 4, h - 44);                                    // the icon: as big as the room above the stars allows
    if (it.picked) {
      const glow = scene.add.image(0, 0, ballTex(0xffd166, U(d + 14), U(5)));
      s.addBackground(glow, { top: U(-5), bottom: U(h - d - 9), left: U((w - d - 14) / 2), right: U((w - d - 14) / 2) });
    }
    const p = pic(it.pic, 200);
    p.setScale(Math.min(U(d) / p.width, U(d) / p.height));
    s.add(p, { align: 'center' });
    const inside = [p];
    const meta = it.meta || [];
    if (meta.length) {
      const row = scene.rexUI.add.sizer({ orientation: 'x', space: { left: U(10), right: U(10), top: U(2), bottom: U(2), item: U(3) } });
      const bits = meta.map(m => m.svg ? pic(m.svg, 26) : text(m.text, 15, { color: '#2b2b2b', stroke: false, body: true }));
      for (const b of bits) row.add(b, { align: 'center' });
      gloss(row, 40, 32, 0xffffff, { r: 'pill', line: 3, depth: 3, shine: 0.35 });
      for (const b of bits) scene.children.bringToTop(b);              // (the pill was made after them: put them back on top)
      s.add(row, { align: 'center' });
      inside.push(row);
    } else s.addSpace();
    tappable(s, it, inside, null);
    if (it.badge) {
      const bd = pic(it.badge, 50);
      const bx = U(w / 2 - 24), by = U(-h / 2 + 22);
      bd.setPosition(bx, by);
      s.pin(bd);
      const hop = { v: 0 };
      if (!calm()) scene.tweens.add({ targets: hop, v: 1, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        onUpdate: () => { if (bd.active && s.setChildLocalPosition) s.setChildLocalPosition(bd, bx, by - U(7) * hop.v); } });
    }
    return s;
  }
  // a big button: a colored pill with a picture and a word
  function button(it, big) {
    const h = big ? 88 : 76;
    const s = scene.rexUI.add.sizer({ height: U(h), orientation: 'x', space: { left: U(18), right: U(22), item: U(8) } });
    const layers = gloss(s, it.minW || (big ? 200 : 130), h, COLORS[it.color] || COLORS.white, { r: 'pill', depth: 6 });
    const bg = layers[1];
    const inside = [];
    s.addSpace();                                                 // (picture + word sit in the middle: a short word like
    if (it.icon) { const p = pic(it.icon, 44); s.add(p, { align: 'center' }); inside.push(p); }   //  "Calm" was stuck at the left, Nov 22)
    if (it.label) { const t = text(it.label, big ? 30 : 24, { color: '#2b2b2b', stroke: false }); s.add(t, { align: 'center' }); inside.push(t); }
    s.addSpace();
    s.setMinWidth(U(it.minW || (big ? 200 : 130)));
    // (a button that says "not yet": RC's Race while the track has a problem, the Sticker Book's arrow on the last page.
    //  "Local" alpha: a plain setAlpha was undone when the menu faded in, Nov 21)
    if (it.dim) for (const o of inside.concat(layers)) { if (s.setChildLocalAlpha) s.setChildLocalAlpha(o, 0.45); else o.setAlpha(0.45); }
    tappable(s, it, inside, bg);
    return s;
  }
  // a round picture button (the title menu): a white circle with a picture, a word under it
  // (row.size = the circle's size in board units, for a row that must fit on one line: the hub's tabs + bar, Nov 22)
  function roundBtn(it, size) {
    const plain = it.big ? (wide ? 112 : 130) : (wide ? 78 : 92);  // (upright: bigger, for fingers)
    const d = size || plain;
    const s = scene.rexUI.add.sizer({ orientation: 'y', space: { item: U(4) } });
    // (a picked one, like the open tab of a list, is yellow with a thicker ring)
    // (Nov 23) a shiny ball with a soft shadow under it, instead of a flat circle
    const col = it.big ? 0x06d6a0 : it.picked ? 0xffd166 : 0xffffff;
    const shadow = scene.add.circle(0, 0, U(d / 2), INK, 0.3);       // (made first, so it's drawn underneath)
    const c = scene.add.image(0, 0, ballTex(col, U(d), U(it.big || it.picked ? 7 : 5)));
    const icon = pic(it.icon, it.big ? 80 : 44);
    if (!wide) icon.setScale(it.big ? 1.15 : 1.25);
    if (size) icon.setScale(icon.scale * size / plain);
    const ring = scene.rexUI.add.overlapSizer({ width: U(d), height: U(d) });
    const dn = U(d > 100 ? 6 : 4);                               // (pushed down a little, without making the button taller)
    ring.add(shadow, { expand: false, align: 'center', padding: { top: dn, bottom: -dn, left: 0, right: 0 } });
    ring.add(c, { expand: false, align: 'center' }); ring.add(icon, { expand: false, align: 'center' });
    s.add(ring, { align: 'center' });
    if (it.label) {                                              // (no word: just the circle, Nov 22)
      const lbl = text(it.label, (it.big ? 22 : 15) * (wide ? 1 : 1.2), { color: '#ffffff', strokeW: 4 });
      s.add(lbl, { align: 'center' });
    }
    tappable(s, it, [icon, c], null);
    if (it.big && !calm()) {
      scene.tweens.add({ targets: c, scale: c.scale * 1.06, duration: 550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      // the big Play button glows (WebGL only), the glow breathing with it
      if (fxOK() && c.preFX) {
        const glow = c.preFX.addGlow(0xfff3b0, 2, 0, false, 0.1, 14);
        scene.tweens.add({ targets: glow, outerStrength: 7, duration: 550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }
    return s;
  }
  function slider(row) {
    const s = scene.rexUI.add.sizer({ orientation: 'x', space: { item: U(12) } });
    s.add(pic(row.icon, 44), { align: 'center' });
    const sl = scene.rexUI.add.slider({
      width: U(260), height: U(30), orientation: 'x', value: row.value,
      track: box(260, 18, 0xffffff, { r: 9, line: 4 }),
      indicator: box(20, 18, 0x06d6a0, { r: 9, line: 0 }),     // (the filled part)
      thumb: scene.add.image(0, 0, ballTex(0xffd166, U(40), U(4))),
      input: 'drag', valuechangeCallback: (v) => row.onChange && row.onChange(v),
    });
    s.add(sl, { align: 'center' });
    hits.push({ obj: sl, it: { label: row.label || 'slider', attr: row.attr } });
    return s;
  }
  // a row of things that wraps onto more lines when it doesn't fit
  function wrapRow(width, children, gap) {
    const r = scene.rexUI.add.fixWidthSizer({ width: U(width), space: { item: U(gap), line: U(gap) }, align: 'center' });
    for (const c of children) r.add(c);
    return r;
  }

  // ---- draw a screen ----
  function draw(screen, same) {
    const W = game.scale.width, H = game.scale.height;
    const bw = wide ? BOARD[0] : BOARD_UP[0], bh = wide ? BOARD[1] : boardUpH();
    // the dim layer behind the menu (title screens: their own color all over)
    const dim = screen.look === 'title'
      ? scene.add.rectangle(W / 2, H / 2, W, H, num(screen.bg || '#4cc9f0'), 1)
      : scene.add.rectangle(W / 2, H / 2, W, H, 0x141628, 0.62);
    dim.setInteractive();                                      // (taps on the dim layer don't reach the game)
    if (screen.tapAnywhere) dim.on('pointerdown', (p) => { if (onCanvas(p)) screen.tapAnywhere(p); });   // (title screens: tap anywhere to start)
    root.push(dim);
    if (screen.look === 'title') root.push(...backdrop(screen, W, H));   // (Nov 23: a glowing, moving background)
    // screen.onSwipe(dir): a sideways swipe anywhere turns a page (dir 1 = next, -1 = back; the Sticker Book)
    if (screen.onSwipe) {
      let from = null;
      const down = (p) => { from = onCanvas(p) ? { x: p.x, y: p.y } : null; };
      const up = (p) => {
        if (!from) return;
        const dx = p.x - from.x, dy = p.y - from.y;
        from = null;
        if (Math.abs(dx) > U(70) && Math.abs(dx) > Math.abs(dy) * 1.5) screen.onSwipe(dx < 0 ? 1 : -1);
      };
      scene.input.on('pointerdown', down); scene.input.on('pointerup', up);
      swipeOff = () => { scene.input.off('pointerdown', down); scene.input.off('pointerup', up); };
    }
    if (screen.look === 'title') drawTitle(screen, W, H, bw, bh, same);
    else drawPanel(screen, W, H, bw, bh, same);
    // keys
    if (scene.input.keyboard) {
      scene.input.keyboard.removeAllListeners('keydown');
      scene.input.keyboard.on('keydown', (e) => { if (screen.onKey) screen.onKey(e.code); });
    }
  }

  // row.bg = a color: the row sits on a colored card (a page of the Sticker Book, Nov 21)
  function rowObject(row, width) {
    if (row.bg == null) return rowInner(row, width);
    const pad = 10;
    const card = scene.rexUI.add.sizer({ orientation: 'x', space: { left: U(pad), right: U(pad), top: U(pad), bottom: U(pad) } });
    cardBg(card, num(row.bg));                                   // (Nov 23: a shiny card, see cardBg())
    card.add(rowInner(row, width - pad * 2 - 6), { align: 'center' });
    return card;
  }
  function rowInner(row, width) {
    if (row.t === 'heading') return headingSign(row.text, width);     // (Nov 23, part 2b: a heading on its own, as a ribbon)
    if (row.t === 'text') return text(row.text, row.size || 22, { body: !row.big, color: row.color || '#ffffff', wrap: width, stroke: row.big ? undefined : false });
    if (row.t === 'pics' && row.glow) {
      // (Nov 23, part 2b: a results picture (the medal, RC's podium, a cup table) on a golden glow with light rays)
      // (how big the picture really is: `size` is its longer side; a small medal gets a wide glow round it)
      const sz = row.size || 70, it = row.items[0];
      const [vw, vh] = typeof it === 'string' ? svgSize(it) : [1, 1];
      const pw = sz * vw / Math.max(vw, vh), ph = sz * vh / Math.max(vw, vh);
      const gw = Math.min(width, sz < 150 ? sz * 3 : pw * (row.glow === 'wide' ? 1.5 : 1.2)), gh = sz < 150 ? sz * 1.5 : ph * 1.1;
      return spotlit(gw, gh, () => rowInner(Object.assign({}, row, { glow: false }), gw));
    }
    if (row.t === 'plaque') return plaque(row, width);
    if (row.t === 'pics') return wrapRow(width, row.items.map(it => {
      const sp = typeof it === 'string' && logoSpec(it);
      if (sp) return scene.add.image(0, 0, logoStill(sp, U(row.size || 70)));   // (the hub's logo, in the new style)
      if (it && it.stage) return stage(it, row.size || 70);          // (Nov 23: "this is yours", on a gold stand)
      if (typeof it === 'string') return pic(it, row.size || 70);
      const p = pic(it.svg, row.size || 70, it.img);
      return it.frame ? framed(p) : p;                               // (Nov 23, part 2b: a chart in a gold-rimmed frame)
    }), 10);
    if (row.t === 'stars') {
      // (Nov 23, part 2b: the stars stand in a golden glow with light rays; each one bursts into twinkles as it pops)
      return spotlit(Math.min(width, 380), 140, () => {
        const r = scene.rexUI.add.sizer({ orientation: 'x', space: { item: U(6) } });
        for (let i = 0; i < (row.max || 3); i++) {
          const st = pic(i < row.n ? M.starOn : M.starOff, i === 1 ? 84 : 68);
          r.add(st, { align: 'bottom' });
          if (i < row.n) popLater.push([st, 250 + i * 250, true]);   // (pops in once everything is in place)
        }
        return r;
      }, row.n ? 0xffe08a : 0xbde0fe);
    }
    if (row.t === 'chips') return wrapRow(width, row.items.map(c => {
      const s = scene.rexUI.add.sizer({ orientation: 'x', space: { left: U(10), right: U(14), top: U(4), bottom: U(4), item: U(6) } });
      gloss(s, 120, 44, 0xffffff, { r: 'pill', line: 4, depth: 4, shine: 0.0 });   // (Nov 23: with a shadow + bottom shade)
      if (c.svg) s.add(pic(c.svg, 36), { align: 'center' });
      if (c.text) s.add(text(c.text, 22, { color: '#2b2b2b', stroke: false }), { align: 'center' });
      return s;
    }), 8);
    if (row.t === 'tiles') {
      const tw = row.w || 136, th = row.h || 150;
      // (a heading gets a line of its own: the tiles after it start on a new line)
      const r = scene.rexUI.add.fixWidthSizer({ width: U(width), space: { item: U(12), line: U(12) }, align: 'center' });
      row.items.forEach((it, i) => {
        if (!it.heading) { r.add(tile(it, tw, th)); return; }
        if (i) r.addNewLine();
        r.add(headingSign(it.heading, width));                    // (Nov 23: on a little shiny ribbon)
        r.addNewLine();
      });
      return r;
    }
    if (row.t === 'buttons') return wrapRow(width, row.items.map(it => button(it, it.color === 'big')), 12);
    if (row.t === 'round') return wrapRow(width, row.items.map(it => roundBtn(it, row.size)), row.gap != null ? row.gap : 10);
    if (row.t === 'slider') return slider(row);
    if (row.t === 'live') return row.frame === false ? live(row, width) : framed(live(Object.assign({}, row, { w: row.w && row.w - FRAME * 2 }), width - FRAME * 2));   // (Nov 23: in a frame)
    if (row.t === 'cols') {
      // columns side by side (RC's Track Builder: the board on the left, the tools on the right);
      // on a phone held upright they go one under the other
      const side = wide || row.keep;
      const r = scene.rexUI.add.sizer({ orientation: side ? 'x' : 'y', space: { item: U(row.gap || 14) } });
      for (const c of row.cols) {
        const cw = side ? c.w : width;
        const col = scene.rexUI.add.sizer({ orientation: 'y', space: { item: U(10) } });
        for (const sub of c.rows) col.add(rowObject(sub, cw), { align: 'center' });
        r.add(col, { align: side ? 'top' : 'center' });
      }
      return r;
    }
    return text('', 10);
  }

  let popLater = [];
  function popNow() {
    if (calm()) { popLater = []; return; }       // (calm: everything is already at its size)
    for (const [o, delay, sparks] of popLater) {
      const sc = o.scale; o.setScale(0.01);
      scene.tweens.add({ targets: o, scale: sc, delay, duration: 420, ease: 'Back.easeOut', onComplete: sparks ? () => burst(o) : undefined });
    }
    popLater = [];
  }
  function drawPanel(screen, W, H, bw, bh, same) {
    const pw = U(bw), ph = U(bh), inner = bw - 60;
    const panel = scene.rexUI.add.sizer({ x: W / 2, y: H / 2, width: pw, height: ph, orientation: 'y',
      space: { left: U(24), right: U(24), top: U(18), bottom: U(20), item: U(12) } });
    // (Nov 23) the panel: a drop shadow, a purple that gets deeper towards the bottom, a gold rim, a thin light line
    // just inside the rim and a soft shine across the top
    panel.addBackground(scene.rexUI.add.roundRectangle(0, 0, pw, ph, U(34), 0x000000, 0.35), { top: U(10), bottom: -U(10), left: 0, right: 0 });
    const grad = scene.rexUI.add.roundRectangleCanvas(0, 0, pw, ph, U(34), 0x3c2c93, 0xffd166, U(8), 0x1d1450);
    panel.addBackground(grad);
    const rim = scene.rexUI.add.roundRectangle(0, 0, pw, ph, U(27), 0x000000, 0).setStrokeStyle(U(2.5), 0xffffff, 0.28);
    panel.addBackground(rim, { top: U(9), bottom: U(9), left: U(9), right: U(9) });
    const topShine = scene.rexUI.add.roundRectangle(0, 0, pw, U(60), U(24), 0xffffff, 0.07);
    panel.addBackground(topShine, { top: U(12), bottom: ph - U(72), left: U(30), right: U(30) });
    if (screen.banner) {
      // (Nov 23: a shiny sign like the titles, a bit squarer and bigger: "You did it!")
      const b = scene.rexUI.add.sizer({ orientation: 'x', space: { left: U(30), right: U(30), top: U(6), bottom: U(6) } });
      gloss(b, 240, 64, num(screen.bannerColor || '#ef476f'), { r: 16, line: 6, depth: 6 });
      b.add(text(screen.banner, 40, { strokeW: 7 }), { align: 'center' });
      panel.add(b, { align: 'center' });
    }
    if (screen.title) {
      // (Nov 23) the title sits on a shiny pink sign (Lilita One, white with a black outline)
      const sign = scene.rexUI.add.sizer({ orientation: 'x', space: { left: U(30), right: U(30), top: U(4), bottom: U(8) } });
      const th = 34 * 1.25 + 12;
      const layers = gloss(sign, 200, th, 0xff5fa2, { r: 'pill', depth: 5, line: 5 });
      const t = text(screen.title, 34, { color: '#ffffff', strokeW: 7 });   // (made after the sign: drawn on top of it)
      sign.add(t, { align: 'center' });
      panel.add(sign, { align: 'center' });
    }
    // a row that stays put above the part that scrolls (tabs: screen.top)
    // (several rows can stay put: screen.top = [row, row], the Sticker Book's count + page dots)
    for (const tr of [].concat(screen.top || [])) panel.add(rowObject(tr, inner), { align: 'center' });
    // the middle: everything but the bottom buttons, in a panel that scrolls when it's too long
    const body = scene.rexUI.add.sizer({ orientation: 'y', space: { item: U(12) } });
    const firstHit = hits.length;
    for (const row of screen.rows) body.add(rowObject(row, inner - 20), { align: 'center' });
    for (let i = firstHit; i < hits.length; i++) hits[i].inScroll = true;   // (for list(): these can scroll out of sight)
    const scroller = scene.rexUI.add.scrollablePanel({
      width: U(inner), scrollMode: 0,
      panel: { child: body, mask: { padding: 2 } },
      slider: { track: box(14, 10, 0xffffff, { r: 7, line: 3, alpha: 0.35 }), thumb: box(22, 60, 0xffd166, { r: 11, line: 3 }) },
      mouseWheelScroller: { focus: false, speed: 0.5 },
      scroller: false,                                           // (dragging with a finger: our own dragScroll() below, Nov 21)
      space: { panel: U(8) },
    });
    panel.add(scroller, { proportion: 1, align: 'center', expand: true });
    if (screen.footer) panel.add(rowObject(screen.footer, inner), { align: 'center' });
    panel.layout();
    if (!screen.noDrag) dragScroll(scroller);                    // (a screen with a drawing board: dragging draws, it doesn't scroll)
    // (no need for a scroll bar when everything fits)
    const sb = scroller.getElement('slider');
    if (sb) sb.setVisible(scroller.isOverflow);
    root.push(panel);
    M.scroller = scroller;
    if (same) { popLater = []; return; }
    // screen.scrollTo = an attr: open scrolled so that thing is in the middle (the maze map's "you are here" stone, Nov 21)
    if (screen.scrollTo && scroller.isOverflow) {
      const h = hits.find(x => x.it.attr === screen.scrollTo && x.inScroll);
      if (h) {
        // (only when it's out of sight at first: then whatever is at the top, like the maze's friends, stays in view)
        const top = body.getBounds().top, b = h.obj.getBounds();
        if (b.bottom - top > scroller.childVisibleHeight) {
          const want = -(b.centerY - top - scroller.childVisibleHeight / 2);
          scroller.childOY = Math.max(scroller.bottomChildOY, Math.min(0, want));
        }
      }
    }
    popNow();
    // pop in
    if (!calm()) {
      panel.setScale(0.9); panel.setAlpha(0);
      scene.tweens.add({ targets: panel, scale: 1, alpha: 1, duration: 240, ease: 'Back.easeOut' });
    }
    M.scroller = scroller;
  }

  // Drag a finger up / down to scroll (Keith, Nov 21: "can't swipe up on phone"). Rex UI's own drag-scroller
  // never saw the finger: the tiles sit on top of it and Phaser only tells the top-most thing about a touch.
  // A finger that goes down inside the scrolling part and moves up or down more than a little moves the list
  // (a tap that barely moves is still a tap: see `moved` in the buttons). Let go while moving fast = it glides on a bit.
  // (Nov 22, Keith: "the first screen still doesn't scroll, after going into a game and back it does", on an Android
  //  phone. So this no longer goes through Phaser's pointers at all: it listens to the page's own touch / mouse events
  //  on the menu canvas and works out where the finger is from where the canvas is on the screen RIGHT NOW. Phaser
  //  measures the canvas once and keeps that, and on a phone's first load the page can still be settling.)
  function dragScroll(sc) {
    let d = null, glide = null;
    const clampOY = (oy) => Math.max(sc.bottomChildOY, Math.min(sc.topChildOY, oy));
    // a touch / mouse event -> a spot on the canvas (in canvas pixels, like everything Phaser draws)
    const spot = (e) => {
      const t = e.touches ? (e.touches[0] || e.changedTouches[0]) : e;
      if (!t) return null;
      const r = game.canvas.getBoundingClientRect();
      return { x: (t.clientX - r.left) * game.canvas.width / (r.width || 1), y: (t.clientY - r.top) * game.canvas.height / (r.height || 1) };
    };
    const down = (e) => {
      if (e.touches && e.touches.length > 1) { d = null; return; }        // (two fingers: not a scroll)
      if (!sc.scene || !sc.isOverflow || e.target !== game.canvas) return;
      const p = spot(e); if (!p) return;
      if (!sc.getBounds().contains(p.x, p.y)) return;
      // (not on a picture you drag things in, like My House's room)
      if (hits.some(h => h.drags && h.obj.active && h.obj.getBounds().contains(p.x, p.y))) return;
      if (glide) { glide.stop(); glide = null; }
      d = { x: p.x, y: p.y, oy: sc.childOY, moving: false, last: p.y, t: performance.now(), v: 0 };
    };
    const move = (e) => {
      if (!d || !sc.scene) return;
      const p = spot(e); if (!p) return;
      const dx = p.x - d.x, dy = p.y - d.y;
      if (!d.moving) {
        if (Math.abs(dy) < U(14) || Math.abs(dy) < Math.abs(dx)) return;     // (a sideways drag: a slider or a page swipe)
        d.moving = true;
      }
      const now = performance.now();
      d.v = (p.y - d.last) / Math.max(1, now - d.t); d.last = p.y; d.t = now;
      sc.childOY = clampOY(d.oy + dy);
    };
    const up = () => {
      if (d && d.moving && sc.scene && Math.abs(d.v) > 0.3 && performance.now() - d.t < 100) {
        const o = { y: sc.childOY };
        glide = scene.tweens.add({ targets: o, y: clampOY(sc.childOY + d.v * 260), duration: 450, ease: 'Cubic.easeOut',
          onUpdate: () => { if (sc.scene) sc.childOY = o.y; }, onComplete: () => { glide = null; } });
      }
      d = null;
    };
    const mouseMove = (e) => { if (d && !(e.buttons & 1)) { d = null; return; } move(e); };
    const on = [['touchstart', down, holder], ['touchmove', move, window], ['touchend', up, window], ['touchcancel', up, window],
      ['mousedown', down, holder], ['mousemove', mouseMove, window], ['mouseup', up, window]];
    for (const [type, fn, el] of on) el.addEventListener(type, fn, { capture: true, passive: true });
    sc.once('destroy', () => { for (const [type, fn, el] of on) el.removeEventListener(type, fn, { capture: true }); });
  }

  function drawTitle(screen, W, H, bw, bh, same) {
    // logo on the left and menu on the right (wide), or logo above menu (upright)
    const s = scene.rexUI.add.sizer({ x: W / 2, y: H / 2, width: U(bw), height: U(bh), orientation: wide ? 'x' : 'y',
      space: { left: U(16), right: U(16), top: U(16), bottom: U(16), item: U(20) } });
    const spec = screen.logo && logoSpec(screen.logo);
    let spot = null;
    if (spec) {
      // (Nov 23) an empty box keeps the logo's place in the layout; the logo's moving pieces go on top of it afterwards
      const room = logoRoom();
      spot = scene.add.rectangle(0, 0, room, room * 0.7, 0, 0);
      s.add(spot, { proportion: 0, align: 'center' });
    } else if (screen.logo) {
      const lg = pic(screen.logo, 520);
      const room = logoRoom();
      lg.setScale(room / Math.max(lg.width, lg.height));
      s.add(lg, { proportion: 0, align: 'center' });
      if (!calm()) scene.tweens.add({ targets: lg, y: '-=' + U(6), duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    const col = scene.rexUI.add.sizer({ orientation: 'y', space: { item: U(12) } });
    const width = wide ? bw * 0.42 : bw * 0.9;
    for (const row of screen.rows) col.add(rowObject(row, width), { align: 'center' });
    s.add(col, { proportion: 1, align: 'center' });
    s.layout();
    if (spot) {
      // soft light rays right behind the logo, then the logo itself (it pops in when the screen is new)
      const rays = scene.add.image(spot.x, spot.y, 'mn-rays').setDisplaySize(spot.width * 1.5, spot.width * 1.5).setAlpha(0.9);
      if (!calm()) scene.tweens.add({ targets: rays, angle: -360, duration: 40000, repeat: -1 });
      root.push(rays, ...drawLogo(spec, spot.x, spot.y, spot.width, !same));
      scene.children.bringToTop(s);                           // (the buttons stay on top of the logo's sparkles)
    }
    root.push(s);
  }

  // ---- test hooks: what can be tapped, and tap it ----
  // list(): every tappable thing on the open screen with its label + where it is (CSS pixels)
  M.list = () => hits.filter(h => h.obj.active).map(h => {
    const b = h.obj.getBounds();
    // shown = its middle is on the screen (things in the scrolling part: inside the part you can see)
    let shown = b.centerY >= 0 && b.centerY <= game.scale.height;
    if (h.inScroll && M.scroller) { const v = M.scroller.getBounds(); shown = shown && b.centerY >= v.top && b.centerY <= v.bottom; }
    return { shown, label: h.it.label || h.it.name || '', attr: h.it.attr || '', locked: !!h.it.locked, picked: !!h.it.picked,
      pic: !!(h.it.pic || h.it.img), badge: !!h.it.badge, pics: (h.it.meta || []).filter(m => m.svg || m.img).length,
      x: b.x / dpr, y: b.y / dpr, w: b.width / dpr, h: b.height / dpr };
  });
  // texts(): every word on the screen (tests: the contrast check in tests/test_calm.py). stroke = the dark outline's
  // thickness in CSS px (words with a thick outline read on any color); x/y/w/h in CSS px; shown = in sight.
  M.texts = () => {
    if (!scene) return [];
    const v = M.scroller && M.scroller.active ? M.scroller.getBounds() : null;
    return scene.children.list.filter(o => o.type === 'Text' && o.active && o.visible && o.text && o.alpha > 0.5).map(o => {
      const b = o.getBounds();
      let shown = b.top >= 0 && b.bottom <= game.scale.height;
      if (v && o.mask) shown = shown && b.top >= v.top && b.bottom <= v.bottom;
      return { text: o.text, color: o.style.color, stroke: (o.style.strokeThickness || 0) / dpr, size: parseFloat(o.style.fontSize) / dpr,
        shown, x: b.x / dpr, y: b.y / dpr, w: b.width / dpr, h: b.height / dpr };
    });
  };
  M.screen = () => current ? current.id || '' : '';
  M.current = () => current;          // (tests: the open screen's description)
  // tap(what): the first thing whose label or attr matches (a string), or the n-th tile (a number)
  M.tap = (what) => {
    const h = typeof what === 'number' ? hits.filter(x => x.it.name != null)[what] : hits.find(x => x.it.attr === what || x.it.label === what || x.it.name === what);
    if (h && h.it.onTap) { h.it.onTap(h.obj); return true; }
    return false;
  };
  // a little "no" wiggle on something that was tapped (a button that can't do that yet)
  M.wiggle = (o) => {
    if (!o || !scene || !o.active) return;
    const kids = (o.getChildren ? o.getChildren() : [o]).filter(c => c.setAngle);
    const a = calm() ? 3 : 6;                       // (calm: a smaller, single wiggle)
    scene.tweens.add({ targets: kids, angle: { from: -a, to: a }, duration: 60, yoyo: true, repeat: calm() ? 0 : 2, onComplete: () => kids.forEach(c => c.active && c.setAngle(0)) });
  };
  M.boot = boot;
  M._game = () => game;            // (debugging)
})();
