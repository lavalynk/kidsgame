// Coloring pictures as plain SVG (Nov 12).
//
// The coloring book draws its pages with HTML shapes (see pages.css). My House
// needs the same pictures, small, inside its room drawing (the picture wall in
// the Art Room), and a room is one big SVG. So this file turns a page + what a
// child colored on it into SVG shapes on the same 400 x 400 grid:
//   ColorArt.pageSVG(page, state)  -> '<rect .../><path .../>...'  (put it in <svg viewBox="0 0 400 400">)
//
// It also holds the STICKERS (the coloring book and the house both draw them).
// Stickers can be colored (Nov 12): "$C" in a sticker's drawing is its main
// color. A placed sticker remembers its color as c (no c = its own color).
//
// Loaded by coloring/index.html and house/index.html, after the page files.
(function () {
  'use strict';
  const INK = '#2b2b2b';
  const INKS = 'stroke="#2b2b2b" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"';

  // ---------- Stickers: little drawings in a 100 x 100 box ----------
  const STICKERS = {
    star:    `<path d="M50 6 L62 36 L94 38 L69 58 L77 90 L50 72 L23 90 L31 58 L6 38 L38 36 Z" fill="$C" ${INKS}/>`,
    heart:   `<path d="M50 88 C10 62 6 34 26 22 C38 15 48 22 50 30 C52 22 62 15 74 22 C94 34 90 62 50 88 Z" fill="$C" ${INKS}/><ellipse cx="32" cy="36" rx="7" ry="10" fill="#fff" opacity="0.7"/>`,
    flower:  `<g fill="$C" ${INKS}><circle cx="50" cy="24" r="17"/><circle cx="76" cy="44" r="17"/><circle cx="66" cy="74" r="17"/><circle cx="34" cy="74" r="17"/><circle cx="24" cy="44" r="17"/></g><circle cx="50" cy="52" r="16" fill="#ffd166" ${INKS}/>`,
    rainbow: `<path d="M8 80 A42 42 0 0 1 92 80" fill="none" stroke="#2b2b2b" stroke-width="30"/><path d="M8 80 A42 42 0 0 1 92 80" fill="none" stroke="$C" stroke-width="22"/><path d="M8 80 A42 42 0 0 1 92 80" fill="none" stroke="#ffd166" stroke-width="12" transform="translate(9 9) scale(0.82)"/><path d="M8 80 A42 42 0 0 1 92 80" fill="none" stroke="#06d6a0" stroke-width="12" transform="translate(17 17) scale(0.66)"/><path d="M8 80 A42 42 0 0 1 92 80" fill="none" stroke="#118ab2" stroke-width="12" transform="translate(25 25) scale(0.5)"/>`,
    balloon: `<path d="M50 70 Q46 82 54 96" fill="none" stroke="#2b2b2b" stroke-width="3"/><ellipse cx="50" cy="38" rx="28" ry="34" fill="$C" ${INKS}/><path d="M44 72 L56 72 L50 66 Z" fill="$C" ${INKS}/><ellipse cx="40" cy="26" rx="6" ry="10" fill="#fff" opacity="0.7"/>`,
    smile:   `<circle cx="50" cy="50" r="40" fill="$C" ${INKS}/><circle cx="36" cy="42" r="6" fill="#2b2b2b"/><circle cx="64" cy="42" r="6" fill="#2b2b2b"/><path d="M32 60 Q50 78 68 60" fill="none" ${INKS}/><ellipse cx="26" cy="58" rx="7" ry="4" fill="#f15bb5"/><ellipse cx="74" cy="58" rx="7" ry="4" fill="#f15bb5"/>`,
    crown:   `<path d="M12 78 L16 30 L34 52 L50 22 L66 52 L84 30 L88 78 Z" fill="$C" ${INKS}/><circle cx="50" cy="64" r="7" fill="#ef476f" stroke="#2b2b2b" stroke-width="3"/>`,
    sparkle: `<path d="M50 4 Q56 44 96 50 Q56 56 50 96 Q44 56 4 50 Q44 44 50 4 Z" fill="$C" ${INKS}/>`,
    paw:     `<ellipse cx="50" cy="66" rx="24" ry="20" fill="$C" ${INKS}/><g fill="$C" ${INKS}><circle cx="22" cy="42" r="10"/><circle cx="40" cy="26" r="10"/><circle cx="60" cy="26" r="10"/><circle cx="78" cy="42" r="10"/></g>`,
    cloud:   `<path d="M20 70 C6 70 6 50 20 48 C20 30 42 26 50 38 C58 22 84 28 80 48 C96 48 96 70 80 70 Z" fill="$C" ${INKS}/>`,
  };
  // each sticker's own color (used until a child colors it)
  const STICKER_COLORS = { star: '#ffd166', heart: '#ef476f', flower: '#f15bb5', rainbow: '#ef476f', balloon: '#9b5de5',
    smile: '#ffd166', crown: '#ffc93c', sparkle: '#9bf6ff', paw: '#8d5524', cloud: '#ffffff' };
  // only real colors go into the drawing (saves are read back from the device)
  const safeColor = (c) => /^#[0-9a-fA-F]{3,8}$/.test(c || '') ? c : null;
  function sticker(k, c) {
    return (STICKERS[k] || '').split('$C').join(safeColor(c) || STICKER_COLORS[k] || '#fff');
  }

  // ---------- A rounded box as an SVG path (like CSS border-radius) ----------
  // r = the --r text, e.g. "50% 50% 0 0 / 100% 100% 0 0"; w, h = the box size.
  function corners(r, w, h) {
    const side = (txt, size) => {
      let v = txt.trim().split(/\s+/).map(x => x.endsWith('%') ? parseFloat(x) / 100 * size : parseFloat(x) || 0);
      if (v.length === 1) v = [v[0], v[0], v[0], v[0]];
      else if (v.length === 2) v = [v[0], v[1], v[0], v[1]];
      else if (v.length === 3) v = [v[0], v[1], v[2], v[1]];
      return v;                                   // top-left, top-right, bottom-right, bottom-left
    };
    const [hx, vy] = r.split('/');
    const rx = side(hx, w), ry = side(vy != null ? vy : hx, h);
    // corners that are too big for the box shrink together (the CSS rule)
    const f = Math.min(1, w / (rx[0] + rx[1] || 1), w / (rx[3] + rx[2] || 1), h / (ry[0] + ry[3] || 1), h / (ry[1] + ry[2] || 1));
    return rx.map((x, i) => [x * f, ry[i] * f]);
  }
  function boxPath(x0, y0, w, h, r) {
    const [tl, tr, br, bl] = corners(r, w, h), x1 = x0 + w, y1 = y0 + h;
    const n = (v) => +v.toFixed(1);
    const arc = (c, x, y) => c[0] && c[1] ? `A${n(c[0])} ${n(c[1])} 0 0 1 ${n(x)} ${n(y)}` : `L${n(x)} ${n(y)}`;
    return `M${n(x0 + tl[0])} ${n(y0)} H${n(x1 - tr[0])} ${arc(tr, x1, y0 + tr[1])} V${n(y1 - br[1])} ${arc(br, x1 - br[0], y1)}` +
           ` H${n(x0 + bl[0])} ${arc(bl, x0, y1 - bl[1])} V${n(y0 + tl[1])} ${arc(tl, x0 + tl[0], y0)} Z`;
  }

  // ---------- A whole page ----------
  // state = what coloring.js saves: { v: 2, fills: [...], strokes: [...], stickers: [...] }
  function pageSVG(page, state, line = 10) {
    const st = state || {};
    const fills = st.v === 2 ? (st.fills || []) : [];
    const t = document.createElement('template');
    t.innerHTML = page.html;
    let out = '', ri = 0;
    for (const el of t.content.children) {
      const v = (k, d) => { const x = el.style.getPropertyValue(k).trim(); return x === '' ? d : x; };
      const cx = +v('--cx', 200), cy = +v('--cy', 200), w = +v('--w', 0), h = +v('--h', 0);
      const x0 = cx - w / 2, y0 = cy - h / 2;
      const k = v('--k', null), r = k != null ? `${k} ${k} ${k} ${k}` : v('--r', '50%');
      const rot = parseFloat(v('--rot', '0')) || 0;
      const tf = rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : '';
      const cls = el.classList;
      if (cls.contains('r')) {
        const fill = safeColor(fills[ri++]) || '#fff';
        if (cls.contains('p')) {                       // a free-drawn shape: copy its path
          const p = el.querySelector('path');
          if (p) out += `<path d="${p.getAttribute('d')}" fill="${fill}" stroke="${INK}" stroke-width="${line}" stroke-linejoin="round"/>`;
        } else if (cls.contains('bg')) {
          out += `<path d="${boxPath(x0, y0, w, h, r)}" fill="${fill}"${tf}/>`;
        } else if (cls.contains('flat')) {             // a road: only the top edge
          out += `<g${tf}><path d="${boxPath(x0, y0, w, h, r)}" fill="${fill}"/><path d="M${x0} ${y0 + line / 2} H${x0 + w}" stroke="${INK}" stroke-width="${line}"/></g>`;
        } else {
          out += `<path d="${boxPath(x0, y0, w, h, r)}" fill="${fill}" stroke="${INK}" stroke-width="${line}" stroke-linejoin="round"${tf}/>`;
        }
      } else if (cls.contains('d')) {
        out += `<path d="${boxPath(x0, y0, w, h, r)}" fill="${cls.contains('w') ? '#fff' : INK}"${tf}/>`;
      } else if (cls.contains('ln')) {                 // a smile: half of an ellipse
        const a = w / 2 - 4, b = h / 2 - 4;
        out += `<path d="M${cx - a} ${cy} A${a} ${b} 0 0 ${cls.contains('up') ? 1 : 0} ${cx + a} ${cy}" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"${tf}/>`;
      }
    }
    // brush lines and stickers on top, in the order they were added
    const strokes = st.strokes || [], stickers = st.stickers || [];
    const order = st.order || ('s'.repeat(strokes.length) + 'k'.repeat(stickers.length));
    let si = 0, ki = 0;
    for (const o of order) {
      const s = o === 's' ? strokes[si++] : null, kk = o === 'k' ? stickers[ki++] : null;
      if (s && /^[MLQl0-9 .\-]+$/.test(s.d || '')) out += `<path d="${s.d}" fill="none" stroke="${safeColor(s.c) || INK}" stroke-width="${+s.w || 8}" stroke-linecap="round" stroke-linejoin="round"/>`;
      if (kk && STICKERS[kk.k]) out += `<g transform="translate(${+kk.x || 0} ${+kk.y || 0}) scale(${+kk.s || 1}) translate(-50 -50)">${sticker(kk.k, kk.c)}</g>`;
    }
    return out;
  }

  window.ColorArt = { STICKERS, STICKER_COLORS, sticker, pageSVG, boxPath };
})();
