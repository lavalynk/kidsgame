// =====================================================================
// Playing together on several phones (Keith, Nov 5).
//
// Phones meet in a "room" on the arcade's switchboard (the Cloudflare Worker
// in server/). A room code is 3 pictures, so kids who can't read can still
// type it: one phone shows the pictures, the others tap the same ones.
// Nothing about the players is stored anywhere; see server/src/index.js.
//
//   Arcade.net.ready()             - true once the switchboard address is set (below)
//   Arcade.net.newCode()           - 3 random picture numbers, e.g. [3, 0, 7]
//   Arcade.net.codeHTML(code)      - the 3 pictures, big
//   Arcade.net.picker(onDone)      - 8 picture buttons + 3 slots; calls onDone(code)
//   const room = Arcade.net.join(code)
//       room.on('hello' | 'join' | 'leave' | 'full' | 'open' | 'closed' | <your own type>, fn)
//       room.send({ t: 'car', x, y })   room.seat   room.close()
// =====================================================================
(function () {
  'use strict';
  if (!window.Arcade) return;

  // The switchboard's address. Keith deploys server/ with "npx wrangler deploy"
  // and the address it prints goes here (wss:// instead of https://).
  // (Tests can point at a local copy with localStorage 'kidsArcade.server'.)
  const SERVER = '';
  const server = () => { try { return localStorage.getItem('kidsArcade.server') || SERVER; } catch (e) { return SERVER; } };

  // ---- the 8 code pictures ----
  const I = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
  const PICS = [
    { name: 'cat', bg: '#ffd6a5', svg: `<path d="M18 44 L22 14 L40 30 Z M82 44 L78 14 L60 30 Z" fill="#ffb347" ${I}/><circle cx="50" cy="56" r="30" fill="#ffb347" ${I}/><circle cx="39" cy="52" r="5" fill="#2b2b2b"/><circle cx="61" cy="52" r="5" fill="#2b2b2b"/><path d="M44 64 Q50 70 56 64" fill="none" ${I}/>` },
    { name: 'rocket', bg: '#bde0fe', svg: `<path d="M50 10 C64 22 66 44 62 66 H38 C34 44 36 22 50 10 Z" fill="#fff" ${I}/><circle cx="50" cy="38" r="8" fill="#4cc9f0" ${I}/><path d="M38 52 L24 70 L38 66 Z M62 52 L76 70 L62 66 Z" fill="#ef476f" ${I}/><path d="M42 66 Q50 90 58 66 Z" fill="#ffd166" ${I}/>` },
    { name: 'banana', bg: '#fff3b0', svg: `<path d="M22 30 Q20 74 60 80 Q80 82 84 72 Q60 72 46 58 Q32 44 32 26 Z" fill="#ffd166" ${I}/><path d="M22 30 L26 18 L34 24" fill="#8d5524" ${I}/>` },
    { name: 'star', bg: '#e0c3fc', svg: `<path d="M50 12 L60 36 L86 38 L66 55 L72 82 L50 68 L28 82 L34 55 L14 38 L40 36 Z" fill="#ffd166" ${I}/>` },
    { name: 'fish', bg: '#a0e7e5', svg: `<path d="M26 50 C36 28 70 26 82 50 C70 74 36 72 26 50 Z" fill="#ff8c42" ${I}/><path d="M26 50 L10 36 L12 64 Z" fill="#ff8c42" ${I}/><circle cx="68" cy="46" r="5" fill="#2b2b2b"/>` },
    { name: 'flower', bg: '#c7f9cc', svg: `<g fill="#ff8fab" ${I}><circle cx="50" cy="28" r="14"/><circle cx="72" cy="44" r="14"/><circle cx="64" cy="70" r="14"/><circle cx="36" cy="70" r="14"/><circle cx="28" cy="44" r="14"/></g><circle cx="50" cy="52" r="12" fill="#ffd166" ${I}/>` },
    { name: 'car', bg: '#ffc8dd', svg: `<path d="M14 62 V50 Q14 44 22 42 L32 28 H62 L74 42 Q86 44 86 52 V62 Z" fill="#ef476f" ${I}/><path d="M36 32 H58 L66 42 H30 Z" fill="#d6f1ff" ${I}/><circle cx="30" cy="64" r="9" fill="#2b2b2b"/><circle cx="70" cy="64" r="9" fill="#2b2b2b"/>` },
    { name: 'heart', bg: '#ffd6e0', svg: `<path d="M50 84 C16 62 8 42 16 28 C24 14 42 14 50 30 C58 14 76 14 84 28 C92 42 84 62 50 84 Z" fill="#ef476f" ${I}/><ellipse cx="32" cy="34" rx="5" ry="8" fill="#fff" opacity="0.7"/>` },
  ];
  const pic = (n, size = 72) => `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-label="${PICS[n].name}"><circle cx="50" cy="50" r="47" fill="${PICS[n].bg}" stroke="#2b2b2b" stroke-width="4"/>${PICS[n].svg}</svg>`;
  const newCode = () => [0, 1, 2].map(() => Math.floor(Math.random() * PICS.length));
  const codeHTML = (code, size = 84) => `<div class="net-code">${code.map(n => pic(n, size)).join('')}</div>`;

  // The code typer: 3 empty slots on top, 8 big picture buttons below.
  // Tap a slot to take a picture back out. Calls onDone(code) after the 3rd picture.
  function picker(onDone) {
    const box = Arcade.h('div', { class: 'net-picker' });
    const slots = Arcade.h('div', { class: 'net-code net-slots' });
    const keys = Arcade.h('div', { class: 'net-keys' });
    const code = [];
    const paint = () => {
      slots.innerHTML = [0, 1, 2].map(i => code[i] != null ? `<button type="button" data-slot="${i}">${pic(code[i])}</button>` : `<span class="net-empty"></span>`).join('');
    };
    PICS.forEach((p, n) => {
      const b = Arcade.h('button', { type: 'button', 'data-pic': n, 'aria-label': p.name }, pic(n));
      b.addEventListener('click', () => {
        if (code.length >= 3) return;
        Arcade.sfx('pop'); code.push(n); paint();
        if (code.length === 3) setTimeout(() => onDone(code.slice()), 250);
      });
      keys.appendChild(b);
    });
    slots.addEventListener('click', (e) => { const s = e.target.closest('[data-slot]'); if (s) { Arcade.sfx('click'); code.splice(+s.dataset.slot); paint(); } });
    paint();
    box.append(slots, keys);
    return box;
  }

  // Join a room. Messages are JSON; handlers are called by message type ('t').
  function join(code) {
    const handlers = {};
    const room = {
      seat: null, players: [], open: false,
      on(t, fn) { (handlers[t] = handlers[t] || []).push(fn); return room; },
      send(msg) { if (room.open) try { ws.send(JSON.stringify(msg)); } catch (e) { /* closed */ } },
      close() { room.closing = true; try { ws.close(); } catch (e) { /* already */ } },
    };
    const fire = (t, msg) => (handlers[t] || []).forEach(fn => { try { fn(msg); } catch (e) { console.error(e); } });
    const ws = new WebSocket(server().replace(/\/$/, '') + '/room/' + code.join('-'));
    ws.onopen = () => { room.open = true; fire('open', {}); };
    ws.onmessage = (e) => {
      let msg; try { msg = JSON.parse(e.data); } catch (err) { return; }
      if (msg.t === 'hello') { room.seat = msg.seat; room.players = msg.players; }
      if (msg.t === 'join' && !room.players.includes(msg.seat)) room.players.push(msg.seat);
      if (msg.t === 'leave') room.players = room.players.filter(s => s !== msg.seat);
      fire(msg.t, msg);
    };
    ws.onclose = () => { room.open = false; if (!room.closing) fire('closed', {}); };
    return room;
  }

  // a little CSS for the pictures (kept here so every game gets it)
  const css = document.createElement('style');
  css.textContent = `
    .net-code { display: flex; justify-content: center; gap: 12px; margin: 8px 0; }
    .net-code svg { display: block; filter: drop-shadow(0 4px 0 rgba(0,0,0,0.25)); }
    .net-slots { min-height: 84px; }
    .net-slots button { padding: 0; border: 0; background: none; cursor: pointer; }
    .net-empty { width: 72px; height: 72px; border-radius: 50%; border: 4px dashed #2b2b2b; opacity: 0.35; }
    .net-keys { display: grid; grid-template-columns: repeat(4, auto); justify-content: center; gap: 10px; margin-top: 8px; }
    .net-keys button { padding: 0; border: 0; background: none; cursor: pointer; border-radius: 50%; transition: transform 0.12s; }
    .net-keys button:active { transform: scale(0.9); }
    .net-players { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; min-height: 80px; margin: 8px 0; }
    .net-players .av { width: 72px; height: 72px; border-radius: 50%; border: 4px solid #2b2b2b; overflow: hidden; animation: ar-pop 0.3s; }
    .net-players .av svg { width: 100%; height: 100%; display: block; }
  `;
  document.head.appendChild(css);

  Arcade.net = { ready: () => !!server(), newCode, codeHTML, picker, join, pic, PICS };
})();
