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
  const SERVER = 'wss://kids-arcade.lavalynk.workers.dev';   // Keith's switchboard (deployed Nov 5)
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

  // ---------------------------------------------------------------
  // A ready-made Friends lobby for kit games (Hoops uses it; RC has its own).
  //   Arcade.net.party.menu(g, { choices: [{ id, pic, name }], onStart(id), onBack() })
  // shows: Make a room / Join -> the room's 3 pictures, everyone's animal, and
  // (for whoever made the room) the choices: tap one and every phone starts it.
  //   party.tell(msg), party.on(type, fn), party.peers (seat -> {pet, color, name}), party.start(id)
  // ---------------------------------------------------------------
  const FRIENDS_PIC = `<svg viewBox="0 0 48 48"><circle cx="16" cy="16" r="8" fill="#ffd166" stroke="#2b2b2b" stroke-width="3.5"/><path d="M4 42 Q4 26 16 26 Q28 26 28 42 Z" fill="#ef476f" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/><circle cx="33" cy="18" r="7" fill="#ffd166" stroke="#2b2b2b" stroke-width="3.5"/><path d="M22 42 Q22 28 33 28 Q44 28 44 42 Z" fill="#4cc9f0" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/></svg>`;
  const party = {
    room: null, code: null, peers: {}, handlers: {}, opts: null, paint: null,
    on(t, fn) { (this.handlers[t] = this.handlers[t] || []).push(fn); },
    fire(t, m) { (this.handlers[t] || []).forEach(fn => fn(m)); },
    tell(msg) { if (this.room) this.room.send(msg); },
    host() { const r = this.room; return !!r && r.seat != null && r.seat === Math.min(...r.players); },
    me() { const p = Arcade.profiles.active(); return { t: 'me', pet: p.pet, color: p.color, name: (p.name || '').slice(0, 12) }; },
    open(g, code) {
      this.leave();
      this.code = code; this.peers = {};
      const r = this.room = join(code);
      r.on('hello', () => { r.send(this.me()); this.paint && this.paint(); });
      r.on('join', () => { r.send(this.me()); this.paint && this.paint(); });
      r.on('me', (m) => { this.peers[m.from] = m; this.paint && this.paint(); });
      r.on('leave', (m) => { delete this.peers[m.from]; this.paint && this.paint(); this.fire('leave', m); });
      r.on('full', () => { Arcade.sfx('aww'); this.leave(); this.menu(g, this.opts); });
      r.on('closed', () => { if (this.paint && g.state !== 'play') { Arcade.sfx('aww'); g.toast('No connection'); this.leave(); this.menu(g, this.opts); } });
      r.on('start', (m) => { if (g.state !== 'play') { Arcade.sfx('go'); this.paint = null; this.opts.onStart(m.pick); } });
      // anything else (scores, moves...) goes to the game
      for (const t of ['score', 'move', 'done']) r.on(t, (m) => this.fire(t, m));
    },
    leave() { if (this.room) this.room.close(); this.room = null; this.code = null; this.peers = {}; this.paint = null; },
    // the room maker (or "Again" on any phone) starts everyone on the same choice
    start(id) { this.tell({ t: 'start', pick: id }); this.paint = null; this.opts.onStart(id); },
    menu(g, opts) {
      this.opts = opts;
      if (this.room && this.room.open) return this.lobby(g);
      this.paint = null;
      const p = Arcade.h('div', { class: 'ar-panel wide ar-arcade' });
      p.appendChild(Arcade.h('h1', { class: 'ar-title' }, `<span style="display:inline-block;width:1.2em;vertical-align:middle">${FRIENDS_PIC}</span>`));
      const grid = Arcade.h('div', { class: 'ar-btns' });
      const make = Arcade.h('button', { type: 'button', class: 'ar-tile', 'data-host': '1', style: 'width:220px' },
        `<div class="pic">${codeHTML([0, 3, 6], 44)}</div><div>Make a room</div>`);
      make.addEventListener('click', () => { Arcade.sfx('click'); this.open(g, newCode()); this.lobby(g); });
      const jn = Arcade.h('button', { type: 'button', class: 'ar-tile', 'data-joinroom': '1', style: 'width:220px' },
        `<div class="pic" style="height:60px">${FRIENDS_PIC.replace('<svg', '<svg style="width:60px;height:60px"')}</div><div>Join</div>`);
      jn.addEventListener('click', () => {
        Arcade.sfx('click');
        const q = Arcade.h('div', { class: 'ar-panel wide ar-arcade' });
        q.appendChild(picker((code) => { this.open(g, code); this.lobby(g); }));
        q.appendChild(backBtn(() => this.menu(g, opts)));
        g.panel(q);
      });
      grid.append(make, jn);
      p.appendChild(grid);
      p.appendChild(backBtn(() => { this.leave(); opts.onBack(); }));
      g.panel(p);
    },
    lobby(g) {
      const opts = this.opts;
      const p = Arcade.h('div', { class: 'ar-panel wide ar-arcade' });
      p.appendChild(Arcade.h('div', {}, codeHTML(this.code, 64)));
      const who = Arcade.h('div', { class: 'net-players', 'data-players': '1' });
      const body = Arcade.h('div', { class: 'ar-btns' });
      p.append(who, body, backBtn(() => { this.leave(); this.menu(g, opts); }));
      this.paint = () => {
        who.innerHTML = [Arcade.profiles.active()].concat(Object.values(this.peers)).map(m => `<span class="av">${Arcade.profiles.avatar(m)}</span>`).join('');
        body.innerHTML = '';
        if (this.host()) {
          for (const c of opts.choices) {
            const b = Arcade.h('button', { type: 'button', class: 'ar-tile', 'data-pick': c.id }, `<div class="pic">${c.pic}</div><div>${c.name}</div>`);
            b.addEventListener('click', () => { Arcade.sfx('go'); this.start(c.id); });
            body.appendChild(b);
          }
        } else body.innerHTML = `<div style="width:90px;margin:10px auto;animation:ar-tap 1s ease-in-out infinite">${FRIENDS_PIC}</div>`;
      };
      this.paint();
      g.panel(p);
    },
  };
  function backBtn(fn) {
    const row = Arcade.h('div', { class: 'ar-btns' });
    const b = Arcade.h('button', { type: 'button', class: 'ar-btn white', 'data-back': '1' }, `${Arcade.icons.left}<span>Back</span>`);
    b.addEventListener('click', () => { Arcade.sfx('click'); fn(); });
    row.appendChild(b);
    return row;
  }

  Arcade.net = { ready: () => !!server(), newCode, codeHTML, picker, join, pic, PICS, party, FRIENDS_PIC };
})();
