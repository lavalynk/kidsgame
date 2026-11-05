// =====================================================================
// Kids Arcade multiplayer switchboard (Cloudflare Worker + Durable Objects)
//
// What it does: phones that typed the same 3-picture room code get put in
// the same "room". Whatever one phone sends ("my car is here", "start the
// race on track 3") is passed straight on to the other phones in that room.
//
// What it does NOT do (Keith's privacy rule): no accounts, no names, no
// logs, nothing saved. A room lives only in memory while phones are
// connected and is forgotten when the last one leaves.
//
//   GET /                  -> "Kids Arcade switchboard" (to check it's up)
//   GET /room/<code>       -> a WebSocket into that room (code = 3 picture numbers, e.g. 3-0-7)
//
// Messages are small JSON objects. The room adds { from: <seat> } to each one
// it passes on, and sends these itself:
//   { t: 'hello', seat, players: [seats] }   to you, when you join
//   { t: 'join', seat }  /  { t: 'leave', seat }   to everyone else
//   { t: 'full' }                             when 4 players are already in
// =====================================================================
import { DurableObject } from 'cloudflare:workers';

const MAX_PLAYERS = 4;
const MAX_MESSAGE = 1024;          // bytes: game messages are tiny
const CODE = /^[0-7]-[0-7]-[0-7]$/;   // 3 pictures out of 8

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/') return new Response('Kids Arcade switchboard', { headers: { 'content-type': 'text/plain' } });
    const m = url.pathname.match(/^\/room\/([^/]+)$/);
    if (!m || !CODE.test(m[1])) return new Response('Not found', { status: 404 });
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
    // the same code always reaches the same room keeper
    return env.ROOMS.getByName(m[1]).fetch(request);
  },
};

// One room = one Durable Object. It uses the WebSocket "hibernation" API, so a
// quiet room costs nothing; each player's seat number is pinned to their socket.
export class Room extends DurableObject {
  async fetch() {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const sockets = this.ctx.getWebSockets();
    if (sockets.length >= MAX_PLAYERS) {
      // room full: say so and close
      server.accept();
      server.send(JSON.stringify({ t: 'full' }));
      server.close(1000, 'full');
      return new Response(null, { status: 101, webSocket: client });
    }
    // the lowest free seat (0 = whoever made the room)
    const taken = sockets.map(ws => (ws.deserializeAttachment() || {}).seat);
    let seat = 0;
    while (taken.includes(seat)) seat++;
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ seat });
    server.send(JSON.stringify({ t: 'hello', seat, players: taken.concat(seat).sort() }));
    this.broadcast({ t: 'join', seat }, server);
    return new Response(null, { status: 101, webSocket: client });
  }

  // pass a message on to everyone else in the room
  async webSocketMessage(ws, message) {
    if (typeof message !== 'string' || message.length > MAX_MESSAGE) return;
    let msg;
    try { msg = JSON.parse(message); } catch (e) { return; }
    if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return;
    msg.from = (ws.deserializeAttachment() || {}).seat;
    this.broadcast(msg, ws);
  }

  async webSocketClose(ws) { this.left(ws); }
  async webSocketError(ws) { this.left(ws); }

  left(ws) {
    const seat = (ws.deserializeAttachment() || {}).seat;
    try { ws.close(1000, 'bye'); } catch (e) { /* already closed */ }
    this.broadcast({ t: 'leave', seat }, ws);
  }

  broadcast(msg, except) {
    const text = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === except) continue;
      try { ws.send(text); } catch (e) { /* that phone just left */ }
    }
  }
}
