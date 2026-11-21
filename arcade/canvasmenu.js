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
//   { t: 'tiles', items: [{ pic, name, meta: [svg | text], locked, picked, onTap, attr }], w, h }
//   { t: 'round', items: [{ icon, label, onTap, attr, big }] }   the title menu's round picture buttons
//   { t: 'buttons', items: [{ icon, label, color, onTap, attr }] }  a row of big buttons
//   { t: 'slider', icon, value, onChange }       a volume slider
//   { t: 'live', canvas, w, attr, onTap(x, y) }  a MOVING picture (Fishing's aquarium, Nov 21): a canvas the game
//                                                keeps drawing on; it's copied to the screen every frame, w board
//                                                units wide; a tap hands back x, y in the canvas's own pixels
// Screen: { id, title, banner, logo, look: 'panel' | 'title', bg, rows, footer: row, onKey(code) }
// Opening a screen with the SAME id as the one on show (a shop after buying something) keeps
// where it was scrolled to and doesn't pop in again: it just changes.
// =====================================================================
(function () {
  'use strict';
  if (!window.Phaser || !window.rexuiplugin) return;      // (no Phaser: the kit keeps its HTML menus)
  const INK = 0x2b2b2b;
  const FONT = "'Lilita One', 'Arial Rounded MT Bold', 'Arial Black', sans-serif";
  const BODY_FONT = "'Trebuchet MS', 'Arial', sans-serif";
  const COLORS = { big: 0x06d6a0, yellow: 0xffd166, blue: 0x8ecae6, pink: 0xffafcc, white: 0xffffff, green: 0x06d6a0 };
  const num = (c) => typeof c === 'number' ? c : parseInt(String(c || '#ffffff').replace('#', ''), 16);

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
          if (pending) { const s = pending; pending = null; M.open(s); }
          else game.loop.sleep();                         // (asleep while no menu is open: no work for the phone)
        },
      },
    });
    addEventListener('resize', () => { if (!ready) return; fit(); if (current) build(current); });
  }
  // the canvas = the whole window, in real screen pixels; the board (BOARD) fits inside
  function fit() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
    game.scale.resize(w, h);
    game.canvas.style.width = innerWidth + 'px'; game.canvas.style.height = innerHeight + 'px';
    wide = innerWidth >= innerHeight;
    const phone = document.documentElement.classList.contains('ar-phone');
    const room = phone ? 0.9 : 0.96;
    const bw = wide ? BOARD[0] : BOARD_UP[0], bh = wide ? BOARD[1] : BOARD_UP[1];
    k = Math.min(w * room / bw, h * room / bh);
  }
  const U = (n) => n * k;                                       // board units -> canvas pixels
  const BOARD = [820, 520];           // the board everything is laid out on (scaled to fit the screen)
  const BOARD_UP = [480, 820];        // ...on a phone held upright (narrower, so everything comes out bigger)

  // ---- SVG pictures -> textures (loaded before a screen is drawn) ----
  const texCache = {};
  function hash(s) { let x = 0; for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) | 0; return 'svg' + (x >>> 0).toString(36) + '_' + s.length; }
  function svgSize(svg) {
    const vb = /viewBox="\s*([-\d.]+)[\s,]+([-\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(svg);
    return vb ? [+vb[3], +vb[4]] : [48, 48];
  }
  // a picture as a texture, drawn at `px` pixels on its longer side
  function loadPic(svg, px) {
    const key = hash(svg + '@' + Math.round(px));
    if (texCache[key]) return texCache[key];
    texCache[key] = new Promise((res) => {
      const [vw, vh] = svgSize(svg), s = px / Math.max(vw, vh);
      let src = svg.replace(/<svg\b([^>]*)>/, (m, a) => {
        a = a.replace(/\s(width|height|style|class)="[^"]*"/g, '');
        return `<svg${a} width="${Math.round(vw * s)}" height="${Math.round(vh * s)}"${/xmlns=/.test(a) ? '' : ' xmlns="http://www.w3.org/2000/svg"'}>`;
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
      const img = new Image();
      img.onload = () => { if (!scene.textures.exists(key)) scene.textures.addImage(key, img); res(key); };
      img.onerror = () => res(null);
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src);
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
    holder.classList.add('show');
    document.body.classList.add('ar-menu-open');
    if (!ready) { pending = screen; return; }
    game.loop.wake();
    build(screen);
  };
  let lastId = null;
  M.close = () => {
    if (!M.isOpen) return;
    current = null; M.isOpen = false; lastId = null;
    clear();
    if (holder) holder.classList.remove('show');
    document.body.classList.remove('ar-menu-open');
    if (ready) game.loop.sleep();
  };
  function clear() {
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
    im.on('pointerdown', (p) => {
      if (!row.onTap) return;
      const b = im.getBounds();
      row.onTap((p.x - b.x) / b.width * row.canvas.width, (p.y - b.y) / b.height * row.canvas.height);
    });
    const tick = () => { if (im.active) tex.refresh(); };
    scene.events.on('update', tick);
    liveTicks.push(tick);
    im.once('destroy', () => { scene.events.off('update', tick); setTimeout(() => { if (scene.textures.exists(key)) scene.textures.remove(key); }, 0); });
    hits.push({ obj: im, it: { label: row.label || '', attr: row.attr || 'live' } });
    return im;
  }

  // collect every picture a screen needs, load them all, then draw
  let buildNo = 0;
  async function build(screen) {
    const my = ++buildNo;
    const jobs = [];
    const want = (svg, px) => { if (svg) jobs.push(loadPic(svg, px * k)); };
    if (screen.logo) want(screen.logo, 520);
    want(M.lockIcon, 34);                                        // (the padlock + the big results stars)
    for (const st of [M.starOn, M.starOff]) { want(st, 84); want(st, 68); }
    for (const row of screen.rows.concat(screen.footer ? [screen.footer] : [])) {
      for (const it of row.items || []) {
        if (it.icon) want(it.icon, it.big ? 80 : 44);
        if (it.pic) want(it.pic, 130);
        if (it.img) jobs.push(loadImg(it.img));
        if (it.svg) want(it.svg, 36);
        for (const m of it.meta || []) { if (m.svg) want(m.svg, 26); if (m.img) jobs.push(loadImg(m.img)); }
        if (row.t === 'pics' && typeof it === 'string') want(it, row.size || 70);
      }
      if (row.icon) want(row.icon, 44);
    }
    if (document.fonts && document.fonts.load) jobs.push(document.fonts.load('40px "Lilita One"').catch(() => null));
    await Promise.all(jobs);
    if (my !== buildNo || current !== screen) return;      // (another screen was opened meanwhile)
    // the same screen again (it changed): keep the scroll spot, no pop-in
    const same = !!(screen.id && lastId === screen.id && M.scroller && M.scroller.scene);
    const keepT = same ? M.scroller.t : 0;
    clear();
    M.scroller = null;
    draw(screen, same);
    lastId = screen.id;
    if (same && M.scroller) M.scroller.t = keepT;
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
  // make something tappable. The thing never changes size: its inside squishes (Nov 20).
  function tappable(obj, it, inside, bg) {
    const press = () => {
      if (bg && bg.setFillStyle) bg.setAlpha(0.85);
      scene.tweens.add({ targets: inside, scale: '*=0.9', duration: 70 });
    };
    const release = () => {
      if (bg && bg.setFillStyle) bg.setAlpha(1);
      for (const o of inside) { scene.tweens.killTweensOf(o); scene.tweens.add({ targets: o, scale: o.baseScale || 1, duration: 380, ease: 'Elastic.easeOut', easeParams: [1.1, 0.4] }); }
    };
    for (const o of inside) o.baseScale = o.scale;
    obj.setInteractive({ useHandCursor: true });
    let downAt = null;
    obj.on('pointerdown', (p) => { downAt = { x: p.x, y: p.y }; press(); });
    obj.on('pointerout', () => { if (downAt) { downAt = null; release(); } });
    obj.on('pointerup', (p) => {
      if (!downAt) return;
      const moved = Math.hypot(p.x - downAt.x, p.y - downAt.y) > U(14);   // (a drag to scroll is not a tap)
      downAt = null; release();
      if (!moved && it.onTap) it.onTap(obj);
    });
    hits.push({ obj, it });
  }

  // a tile: picture, name, little pictures/words under it, a padlock when locked
  function tile(it, w, h) {
    const s = scene.rexUI.add.sizer({ width: U(w), height: U(h), orientation: 'y', space: { top: U(8), bottom: U(8), left: U(6), right: U(6), item: U(4) } });
    const bg = box(w, h, it.picked ? 0xffd166 : it.locked ? 0xe8e2d4 : 0xffffff, { r: 22 });
    s.addBackground(bg);
    const inside = [];
    // (a tile without a name, like a paint swatch or a goal picture: the picture gets the room)
    const tall = it.name ? 0.5 : 0.62;
    if (it.pic || it.img) { const p = pic(it.pic, 130, it.img); const sc = Math.min(U(w - 20) / p.width, U(h * tall) / p.height); p.setScale(sc); if (it.locked) p.setAlpha(0.45); s.add(p, { align: 'center' }); inside.push(p); }
    if (it.name) { const nm = text(it.name, 18, { color: '#2b2b2b', stroke: false, body: true, wrap: w - 16 }); s.add(nm, { align: 'center' }); inside.push(nm); }
    if ((it.meta || []).length) {
      const row = scene.rexUI.add.sizer({ orientation: 'x', space: { item: U(3) } });
      for (const m of it.meta) {
        const o = m.svg || m.img ? pic(m.svg, 26, m.img) : text(m.text, 14, { color: '#2b2b2b', stroke: false, body: true });
        row.add(o, { align: 'center' });
      }
      s.add(row, { align: 'center' }); inside.push(row);
    }
    if (it.locked && M.lockIcon) { const l = pic(M.lockIcon, 34); s.add(l, { align: 'center' }); }
    tappable(s, it, inside, bg);
    return s;
  }
  // a big button: a colored pill with a picture and a word
  function button(it, big) {
    const h = big ? 88 : 76;
    const s = scene.rexUI.add.sizer({ height: U(h), orientation: 'x', space: { left: U(18), right: U(22), item: U(8) } });
    const bg = box(h, h, COLORS[it.color] || COLORS.white, { r: 'pill' });
    s.addBackground(bg);
    const inside = [];
    if (it.icon) { const p = pic(it.icon, 44); s.add(p, { align: 'center' }); inside.push(p); }
    if (it.label) { const t = text(it.label, big ? 30 : 24, { color: '#2b2b2b', stroke: false }); s.add(t, { align: 'center' }); inside.push(t); }
    s.setMinWidth(U(big ? 200 : 130));
    tappable(s, it, inside, bg);
    return s;
  }
  // a round picture button (the title menu): a white circle with a picture, a word under it
  function roundBtn(it) {
    const d = it.big ? (wide ? 112 : 130) : (wide ? 78 : 92);     // (upright: bigger, for fingers)
    const s = scene.rexUI.add.sizer({ orientation: 'y', space: { item: U(4) } });
    const c = scene.add.circle(0, 0, U(d / 2), it.big ? 0x06d6a0 : 0xffffff).setStrokeStyle(U(it.big ? 6 : 5), INK);
    const icon = pic(it.icon, it.big ? 80 : 44);
    if (!wide) icon.setScale(it.big ? 1.15 : 1.25);
    const ring = scene.rexUI.add.overlapSizer({ width: U(d), height: U(d) });
    ring.add(c, { expand: false, align: 'center' }); ring.add(icon, { expand: false, align: 'center' });
    s.add(ring, { align: 'center' });
    const lbl = text(it.label, (it.big ? 22 : 15) * (wide ? 1 : 1.2), { color: '#ffffff', strokeW: 4 });
    s.add(lbl, { align: 'center' });
    tappable(s, it, [icon, c], null);
    if (it.big) scene.tweens.add({ targets: c, scale: 1.06, duration: 550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return s;
  }
  function slider(row) {
    const s = scene.rexUI.add.sizer({ orientation: 'x', space: { item: U(12) } });
    s.add(pic(row.icon, 44), { align: 'center' });
    const sl = scene.rexUI.add.slider({
      width: U(260), height: U(30), orientation: 'x', value: row.value,
      track: box(260, 18, 0xffffff, { r: 9, line: 4 }),
      indicator: box(20, 18, 0x06d6a0, { r: 9, line: 0 }),
      thumb: scene.add.circle(0, 0, U(20), 0xffd166).setStrokeStyle(U(4), INK),
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
    const bw = wide ? BOARD[0] : BOARD_UP[0], bh = wide ? BOARD[1] : BOARD_UP[1];
    // the dim layer behind the menu (title screens: their own color all over)
    const dim = screen.look === 'title'
      ? scene.add.rectangle(W / 2, H / 2, W, H, num(screen.bg || '#4cc9f0'), 1)
      : scene.add.rectangle(W / 2, H / 2, W, H, 0x141628, 0.62);
    dim.setInteractive();                                      // (taps on the dim layer don't reach the game)
    if (screen.tapAnywhere) dim.on('pointerdown', screen.tapAnywhere);   // (title screens: tap anywhere to start)
    root.push(dim);
    if (screen.look === 'title') drawTitle(screen, W, H, bw, bh);
    else drawPanel(screen, W, H, bw, bh, same);
    // keys
    if (scene.input.keyboard) {
      scene.input.keyboard.removeAllListeners('keydown');
      scene.input.keyboard.on('keydown', (e) => { if (screen.onKey) screen.onKey(e.code); });
    }
  }

  function rowObject(row, width) {
    if (row.t === 'text') return text(row.text, row.size || 22, { body: !row.big, color: row.color || '#ffffff', wrap: width, stroke: row.big ? undefined : false });
    if (row.t === 'pics') return wrapRow(width, row.items.map(it => typeof it === 'string' ? pic(it, row.size || 70) : pic(null, row.size || 70, it.img)), 10);
    if (row.t === 'stars') {
      const r = scene.rexUI.add.sizer({ orientation: 'x', space: { item: U(6) } });
      for (let i = 0; i < (row.max || 3); i++) {
        const st = pic(i < row.n ? M.starOn : M.starOff, i === 1 ? 84 : 68);
        r.add(st, { align: 'bottom' });
        if (i < row.n) popLater.push([st, 250 + i * 250]);      // (pops in once everything is in place)
      }
      return r;
    }
    if (row.t === 'chips') return wrapRow(width, row.items.map(c => {
      const s = scene.rexUI.add.sizer({ orientation: 'x', space: { left: U(10), right: U(14), top: U(4), bottom: U(4), item: U(6) } });
      s.addBackground(box(40, 40, 0xffffff, { r: 'pill', line: 4, alpha: 0.95 }));
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
        r.add(text(it.heading, 22, { wrap: width }));
        r.addNewLine();
      });
      return r;
    }
    if (row.t === 'buttons') return wrapRow(width, row.items.map(it => button(it, it.color === 'big')), 12);
    if (row.t === 'round') return wrapRow(width, row.items.map(it => roundBtn(it)), 10);
    if (row.t === 'slider') return slider(row);
    if (row.t === 'live') return live(row, width);
    return text('', 10);
  }

  let popLater = [];
  function popNow() {
    for (const [o, delay] of popLater) { const sc = o.scale; o.setScale(0.01); scene.tweens.add({ targets: o, scale: sc, delay, duration: 420, ease: 'Back.easeOut' }); }
    popLater = [];
  }
  function drawPanel(screen, W, H, bw, bh, same) {
    const pw = U(bw), ph = U(bh), inner = bw - 60;
    const panel = scene.rexUI.add.sizer({ x: W / 2, y: H / 2, width: pw, height: ph, orientation: 'y',
      space: { left: U(24), right: U(24), top: U(18), bottom: U(20), item: U(12) } });
    panel.addBackground(box(bw, bh, 0x2a1e66, { r: 34, line: 8, lineColor: 0xffd166 }));
    if (screen.banner) {
      const b = scene.rexUI.add.label({ background: box(64, 64, num(screen.bannerColor || '#ef476f'), { r: 16, line: 6 }),
        text: text(screen.banner, 40, { strokeW: 7 }), space: { left: U(30), right: U(30), top: U(6), bottom: U(6) } });
      panel.add(b, { align: 'center' });
    }
    if (screen.title) panel.add(text(screen.title, 40, { color: '#ffd166', strokeW: 7 }), { align: 'center' });
    // the middle: everything but the bottom buttons, in a panel that scrolls when it's too long
    const body = scene.rexUI.add.sizer({ orientation: 'y', space: { item: U(12) } });
    for (const row of screen.rows) body.add(rowObject(row, inner - 20), { align: 'center' });
    const scroller = scene.rexUI.add.scrollablePanel({
      width: U(inner), scrollMode: 0,
      panel: { child: body, mask: { padding: 2 } },
      slider: { track: box(14, 10, 0xffffff, { r: 7, line: 3, alpha: 0.35 }), thumb: box(22, 60, 0xffd166, { r: 11, line: 3 }) },
      mouseWheelScroller: { focus: false, speed: 0.5 },
      space: { panel: U(8) },
    });
    panel.add(scroller, { proportion: 1, align: 'center', expand: true });
    if (screen.footer) panel.add(rowObject(screen.footer, inner), { align: 'center' });
    panel.layout();
    // (no need for a scroll bar when everything fits)
    const sb = scroller.getElement('slider');
    if (sb) sb.setVisible(scroller.isOverflow);
    root.push(panel);
    M.scroller = scroller;
    if (same) { popLater = []; return; }
    popNow();
    // pop in
    panel.setScale(0.9); panel.setAlpha(0);
    scene.tweens.add({ targets: panel, scale: 1, alpha: 1, duration: 240, ease: 'Back.easeOut' });
    M.scroller = scroller;
  }

  function drawTitle(screen, W, H, bw, bh) {
    // logo on the left and menu on the right (wide), or logo above menu (upright)
    const s = scene.rexUI.add.sizer({ x: W / 2, y: H / 2, width: U(bw), height: U(bh), orientation: wide ? 'x' : 'y',
      space: { left: U(16), right: U(16), top: U(16), bottom: U(16), item: U(20) } });
    if (screen.logo) {
      const lg = pic(screen.logo, 520);
      const room = wide ? Math.min(U(bw * 0.5), U(bh * 0.85)) : Math.min(U(bw * 0.92), U(bh * 0.42));
      lg.setScale(room / Math.max(lg.width, lg.height));
      s.add(lg, { proportion: 0, align: 'center' });
      scene.tweens.add({ targets: lg, y: '-=' + U(6), duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    const col = scene.rexUI.add.sizer({ orientation: 'y', space: { item: U(12) } });
    const width = wide ? bw * 0.42 : bw * 0.9;
    for (const row of screen.rows) col.add(rowObject(row, width), { align: 'center' });
    s.add(col, { proportion: 1, align: 'center' });
    s.layout();
    root.push(s);
  }

  // ---- test hooks: what can be tapped, and tap it ----
  // list(): every tappable thing on the open screen with its label + where it is (CSS pixels)
  M.list = () => hits.filter(h => h.obj.active).map(h => {
    const b = h.obj.getBounds();
    return { label: h.it.label || h.it.name || '', attr: h.it.attr || '', locked: !!h.it.locked, picked: !!h.it.picked,
      pic: !!(h.it.pic || h.it.img), pics: (h.it.meta || []).filter(m => m.svg || m.img).length,
      x: b.x / dpr, y: b.y / dpr, w: b.width / dpr, h: b.height / dpr };
  });
  M.screen = () => current ? current.id || '' : '';
  M.current = () => current;          // (tests: the open screen's description)
  // tap(what): the first thing whose label or attr matches (a string), or the n-th tile (a number)
  M.tap = (what) => {
    const h = typeof what === 'number' ? hits.filter(x => x.it.name != null)[what] : hits.find(x => x.it.attr === what || x.it.label === what || x.it.name === what);
    if (h && h.it.onTap) { h.it.onTap(h.obj); return true; }
    return false;
  };
  M.boot = boot;
  M._game = () => game;            // (debugging)
})();
