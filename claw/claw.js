// =====================================================================
// Claw Catch: a claw machine full of plush toys (Keith, Nov 26: "Create a claw game").
//
// Slide the claw over a toy, press the big red button, and the claw drops,
// closes, lifts the toy and carries it to the prize chute by itself. Every toy
// you win goes on your Prize Shelf (the title menu's shelf button) and can sit
// in your bedroom in My House. The toys are pictures in claw/prizes.js.
//
// Fair for kids (Keith picked "kid-fair"): no hidden tricks. How well the claw
// holds only depends on how close to the MIDDLE of a toy it comes down:
//   Easy (and little kids): anywhere on a toy holds.
//   Normal / Challenge: right in the middle holds; a bit off = the toy wiggles
//   but stays; near the edge = the toy slips back into the pile ("Oops!").
// And after a couple of misses in a row the claw turns golden: the LUCKY CLAW
// holds anything it touches. You never lose anything; the worst is "Nice try!".
//
// 4 machines (the levels): Toy Box, Ocean, Candy Shop, Star Station. Each has
// 5 toys + 1 rare golden one. Winning a prize in one machine opens the next.
//
// Saved (g.save.data): got = { toyId: how many won }, total = all prizes won.
// Test hooks: window.__clawState(), window.__clawTest (see the end of the file).
// =====================================================================
(function () {
  'use strict';
  const { clamp } = Arcade.math;
  const D = Arcade.draw, INK = '#2b2b2b';
  const P = window.ClawPrizes;
  const W = 960, H = 540;

  // ---- the machine (view coordinates) ----
  const GX0 = 150, GX1 = 810;          // the glass, inside
  const RAIL_Y = 66;                   // the rail the claw hangs from
  const FLOOR = 450;                   // the bottom of the toy pile
  const CH0 = 150, CH1 = 266, CH_TOP = 300;   // the prize chute (left) and the top of its little wall
  const WALL = 272;                    // the chute's wall: toys stay right of it
  const CHUTE_X = (CH0 + CH1) / 2;     // where the claw lets go of a prize
  const HOME = 540;                    // where the claw waits
  const CL_MIN = CHUTE_X, CL_MAX = GX1 - 34;
  const ARM = 82;                      // from the claw's head down to its finger tips
  const BTN = { x: 712, y: 494, r: 30 };   // the big red button (drawn on the machine)

  // ---- how the claw holds (see the top). firm = holds tight, wobble = wiggles but holds, past that it slips ----
  const HOLD = { easy: { firm: 0.98, wobble: 0.98 }, normal: { firm: 0.55, wobble: 0.8 }, challenge: { firm: 0.42, wobble: 0.62 } };
  const TRIES = { easy: 8, normal: 7, challenge: 6 };
  const AIM_TIME = { easy: 0, normal: 12, challenge: 8 };      // seconds to aim before the claw drops by itself (0 = no clock)
  const STARS = { easy: [1, 3, 5], normal: [1, 3, 4], challenge: [1, 2, 4] };   // prizes for 1, 2, 3 stars
  const LUCKY_AFTER = { easy: 2, normal: 2, challenge: 3 };    // misses in a row before the lucky claw

  // ---- toy pictures: each SVG becomes an Image once (drawn big enough to stay sharp) ----
  const imgs = {};
  function toyImg(id) {
    if (imgs[id]) return imgs[id];
    const im = new Image();
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(P.svg(id).replace('<svg ', '<svg width="256" height="256" '));
    return (imgs[id] = im);
  }
  // a toy's body circle (r 34 in its 100 x 100 picture) is the toy's ball: the picture is this many radii wide
  const PIC = 100 / 34;

  let G = null, S = null;
  const machineOf = (lv) => P.MACHINES.find(m => m.id === (lv && lv.id)) || P.MACHINES[0];
  const rnd = () => S.rand();
  const holdFor = (g) => HOLD[g.little ? 'easy' : g.difficulty] || HOLD.normal;

  // ---------------------------------------------------------------
  // The toy pile, on REAL physics (20-point plan #3, Nov 27): Matter.js
  // (arcade/matter.min.js, MIT, loaded only on this page). Every toy is a
  // round Matter body that falls, rolls, tumbles off the others and squishes
  // a little when it lands (the squish is only drawn: plush!). The claw's two
  // outside finger tips are bodies too: they nudge the toys next to the one
  // they grab and close until they touch it. A grabbed toy hangs from the claw
  // on a Matter "constraint" (a spring): a firm grab = a stiff spring, a wobbly
  // grab = a soft one that swings, a slip = the spring lets go.
  // Still kid-fair: HOW WELL it holds is decided only by how near the middle
  // the claw came down (the HOLD table), never by the physics.
  // ---------------------------------------------------------------
  const M = window.Matter;
  // who bumps into whom (Matter's collision categories)
  const C_WALL = 1, C_TOY = 2, C_FREE = 4, C_FINGER = 8;
  //   pile  = a normal toy in the pile (the fingers push it)
  //   free  = the toy the claw is coming down on, a toy that just slipped out of the fingers, or a toy in the chute
  //           (the fingers go through it, so they never knock the toy they're grabbing away)
  //   held  = hangs from the claw: bumps other toys, but floats over the walls (so it can reach the chute)
  const KINDS = {
    pile: { category: C_TOY, mask: C_WALL | C_TOY | C_FREE | C_FINGER },
    free: { category: C_FREE, mask: C_WALL | C_TOY | C_FREE },
    held: { category: C_FREE, mask: C_TOY | C_FREE },
  };
  const BODY = 0.88;            // a toy's body is a bit smaller than its picture (plush toys sink into each other a little)
  function setKind(t, kind) {
    t.kind = kind;
    const f = t.body.collisionFilter; f.category = KINDS[kind].category; f.mask = KINDS[kind].mask; f.group = 0;
  }
  function newWorld() {
    const engine = M.Engine.create({ gravity: { x: 0, y: 1.8 }, positionIterations: 8, velocityIterations: 6 });
    const wall = (x, y, w, h) => M.Bodies.rectangle(x + w / 2, y + h / 2, w, h, { isStatic: true, friction: 0.3, collisionFilter: { category: C_WALL, mask: C_TOY | C_FREE } });
    M.Composite.add(engine.world, [
      wall(CH0 - 60, FLOOR, GX1 - CH0 + 120, 60),          // the floor (pile + chute)
      wall(GX1 - 5, RAIL_Y - 300, 60, FLOOR - RAIL_Y + 360),    // the right side of the glass (a toy's picture is a bit bigger than its body)
      wall(CH1 - 4, RAIL_Y - 300, WALL + 5 - (CH1 - 4), FLOOR - RAIL_Y + 300),   // the wall between the chute and the pile
      wall(CH0 - 60, RAIL_Y - 300, 60, FLOOR - RAIL_Y + 360),   // the left side of the chute
    ]);
    // the claw's two outside finger tips (moved by the game, they push toys out of their way)
    const tip = () => M.Bodies.circle(HOME, RAIL_Y, 9, { isStatic: true, collisionFilter: { category: C_FINGER, mask: C_TOY } });
    const tips = [tip(), tip()];
    M.Composite.add(engine.world, tips);
    return { engine, tips, spring: null };
  }
  function newToy(id, x, y) {
    const rare = P.byId(id).rare, r = rare ? 36 : 37 + rnd() * 6;
    const body = M.Bodies.circle(x, y, r * BODY, { restitution: 0.12, friction: 0.4, frictionStatic: 0.7, frictionAir: 0.025, density: 0.0012, slop: 0.3 });
    M.Body.setAngle(body, (rnd() - 0.5) * 0.5);
    const t = { id, x, y, r, rot: body.angle, held: false, chute: false, t: 0, body, kind: 'pile', sq: 0, sqv: 0, vy0: 0, vx0: 0 };
    setKind(t, 'pile');
    M.Composite.add(S.w.engine.world, body);
    return t;
  }
  function removeToy(t) {
    M.Composite.remove(S.w.engine.world, t.body);
    S.toys.splice(S.toys.indexOf(t), 1);
  }
  function fillPile(m) {
    const commons = m.prizes.filter(id => !P.byId(id).rare), rare = m.prizes.find(id => P.byId(id).rare);
    const ids = [];
    for (let i = 0; i < 12; i++) ids.push(commons[i % commons.length]);
    ids.push(rare);
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    // drop them in rows, then let them settle (no squish for this part: nobody sees it)
    ids.forEach((id, i) => S.toys.push(newToy(id, WALL + 50 + (i % 6) * 84 + rnd() * 16, FLOOR - 40 - Math.floor(i / 6) * 80)));
    for (let i = 0; i < 900; i++) physics(1 / 120);
    for (const t of S.toys) { M.Body.setVelocity(t.body, { x: 0, y: 0 }); M.Body.setAngularVelocity(t.body, 0); t.sq = 0; t.sqv = 0; }
    S.squishes = 0;
  }
  // where the claw's finger tips are (view px) for how open each side is
  const tipAt = (side) => {
    const o = side < 0 ? S.oL : S.oR, sw = Math.sin(S.sway) * 4;
    return { x: S.cx + sw + side * (8 + 44 * o) * Math.cos(S.sway * 0.4), y: tipY() + side * (8 + 44 * o) * Math.sin(S.sway * 0.4) };
  };
  function physics(dt) {
    const w = S.w;
    // the finger tips follow the claw (setPosition with "true" = Matter knows they moved, so a push is a real push)
    [-1, 1].forEach((side, i) => M.Body.setPosition(w.tips[i], tipAt(side), true));
    // a held toy's spring hangs from between the fingers
    if (w.spring && S.held) {
      const h = S.held, wig = h.wobble ? Math.sin(S.glow * 22) * 5 : 0;
      w.spring.pointA = { x: S.cx + h.dx + wig + Math.sin(S.sway) * 10, y: tipY() - h.toy.r * 0.15 };
      // a firm grab pulls the toy snug into the middle as it lifts; a wobbly one stays where it was grabbed
      if (!h.wobble) h.dx *= 0.97;
      const b = h.toy.body;
      if (!h.wobble) { M.Body.setAngle(b, b.angle * 0.9); M.Body.setAngularVelocity(b, 0); }
      else M.Body.setAngularVelocity(b, b.angularVelocity * 0.9 + Math.sin(S.glow * 18) * 0.004);
    }
    M.Engine.update(w.engine, dt * 1000);
    for (const t of S.toys) {
      const b = t.body;
      t.x = b.position.x; t.y = b.position.y; t.rot = b.angle;
      if (!t.held) {
        // plush toys like to sit up: a gentle pull back to upright (they still tumble when knocked)
        // (stronger the further over it leans; a toy on its side always rolls back up)
        const a = Math.atan2(Math.sin(b.angle), Math.cos(b.angle));
        M.Body.setAngularVelocity(b, b.angularVelocity * 0.985 - Math.sin(a) * 0.0035 - a * 0.0008);
      }
      // the squish: a sudden stop (landing, a bump) squashes the toy; then it springs back (a little boing)
      const v = M.Body.getVelocity(b);
      const stop = Math.max(t.vy0 - v.y, Math.abs(t.vx0 - v.x) * 0.6);
      if (stop > 1.2 && !t.held) { t.sqv += Math.min(4, stop * 0.9); S.squishes++; }
      t.vx0 = v.x; t.vy0 = v.y;
      t.sqv += (-170 * t.sq - 9 * t.sqv) * dt;
      t.sq = clamp(t.sq + t.sqv * dt, -0.22, 0.25);
      // a toy that slipped out of the fingers turns back into a normal pile toy once it's away from them
      if (t.kind === 'free' && !t.chute && t !== S.target) {
        const far = w.tips.every(tp => Math.hypot(tp.position.x - t.x, tp.position.y - t.y) > t.r * BODY + 14);
        if (far) setKind(t, 'pile');
      }
    }
  }
  // the toy the claw is coming down on: the fingers go through it, and it stays put until the claw has it
  // (so the toys the fingers nudge on the way down never push it out from under the claw)
  function aimAt(t) {
    if (S.target === t) return;
    const old = S.target;
    if (old && !old.held && !old.chute) {
      if (old.body.isStatic) M.Body.setStatic(old.body, false);
      setKind(old, 'free');            // (it turns back into a pile toy once the fingers are away)
    }
    S.target = t;
    if (t) { setKind(t, 'free'); M.Body.setStatic(t.body, true); }
  }

  // ---------------------------------------------------------------
  // Setting up a round (one machine)
  // ---------------------------------------------------------------
  function setup(g, level) {
    G = g;
    const m = machineOf(level);
    S = {
      m, rand: Arcade.math.seeded(g.demo ? 7 : (Date.now() % 100000) + 1),
      toys: [], cx: HOME, drop: 0, open: 1, phase: 'aim', pt: 0, aimT: 0,
      tries: TRIES[g.difficulty] || 7, used: 0, won: [], misses: 0, streak: 0, best: 0,
      held: null, plan: null, lucky: false, show: null, refill: 0, sway: 0, moving: false,
      idle: 0, auto: 1, oops: 0, glow: 0, btnDown: 0, lastHit: null,
      oL: 1, oR: 1, shutL: 0, shutR: 0, target: null, squishes: 0, w: newWorld(),
    };
    fillPile(m);
    g.music.mood({ energy: 1 });
  }
  const headY = () => RAIL_Y + 30 + S.drop;
  const tipY = () => headY() + ARM;

  // the toy under the claw right now (the highest one the fingers would touch) and how far off its middle
  function under(x) {
    let best = null;
    for (const t of S.toys) {
      if (t.held || t.chute) continue;
      const off = Math.abs(t.x - x) / t.r;
      if (off >= 1) continue;
      const top = t.y - t.r * Math.sqrt(1 - off * off);
      if (!best || top < best.top) best = { t, off, top };
    }
    return best;
  }

  function dropClaw(g) {
    if (S.phase !== 'aim') return;
    S.phase = 'down'; S.pt = 0; S.used++;
    const u = under(S.cx); aimAt(u && u.t);
    S.aimed = u && { t: u.t, off: u.off };     // (what the child aimed at, see 'down')
    g.sfx('click'); g.tone(330, 0.12, { type: 'square', vol: 0.15 }); g.tone(262, 0.18, { type: 'square', vol: 0.15, delay: 0.1 });
    S.btnDown = 0.25;
    g.juice.squash('claw').hit(-0.2);
  }

  // ---------------------------------------------------------------
  // Every step (1/120 s)
  // ---------------------------------------------------------------
  function update(g, dt) {
    S.pt += dt;
    S.glow += dt;
    S.btnDown = Math.max(0, S.btnDown - dt);
    S.oops = Math.max(0, S.oops - dt);
    S.luckyNew = Math.max(0, (S.luckyNew || 0) - dt);
    physics(dt);
    if (S.show) { S.show.t += dt; if (S.show.t > 1.8) S.show = null; }
    if (S.refill > 0) { S.refill -= dt; if (S.refill <= 0) refill(); }
    S.sway *= 0.97;

    const ph = S.phase;
    if (ph === 'aim') aim(g, dt);
    else if (ph === 'down') {
      S.drop += 280 * dt;
      const u = under(S.cx);
      aimAt(u && u.t);
      const floorHit = tipY() >= FLOOR - 8;
      if ((u && tipY() >= u.top + u.t.r * 0.8) || floorHit) {
        S.phase = 'close'; S.pt = 0;
        // how near the middle it came down: where the child aimed when they pressed the button (kid-fair: a toy
        // nudged on the way down doesn't count against them); only a different toy that rolled in is measured now
        S.plan = u ? { t: u.t, off: S.aimed && S.aimed.t === u.t ? S.aimed.off : u.off } : null;
        // each finger closes until it touches the toy (off the middle = one side closes more than the other)
        if (u) { S.shutL = fingerShut(u.t, -1); S.shutR = fingerShut(u.t, 1); } else { S.shutL = S.shutR = 0; }
        g.sfx('thud');
      }
    } else if (ph === 'close') {
      const o = 1 - S.pt / 0.35;
      S.oL = Math.max(S.shutL, o); S.oR = Math.max(S.shutR, o); S.open = Math.max(S.oL, S.oR);
      if (S.pt >= 0.4) grab(g);
    } else if (ph === 'up') {
      S.drop = Math.max(0, S.drop - 210 * dt);
      if (S.held) {
        holdToy();
        if (S.held.slipAt != null && S.drop <= S.held.slipAt) slip(g);
      }
      if (S.drop <= 0) { S.phase = S.held ? 'carry' : 'home'; S.pt = 0; if (!S.held) missed(g); }
    } else if (ph === 'carry') {
      const d = CHUTE_X - S.cx;
      S.cx += Math.sign(d) * Math.min(Math.abs(d), 300 * dt);
      S.sway = Math.sin(S.pt * 9) * (S.held && S.held.wobble ? 0.22 : 0.06);
      holdToy();
      if (Math.abs(d) < 1) { S.phase = 'release'; S.pt = 0; }
    } else if (ph === 'release') {
      S.open = Math.min(1, S.pt / 0.3); S.oL = Math.max(S.oL, S.open); S.oR = Math.max(S.oR, S.open);
      if (S.held && S.pt > 0.12) {
        const t = S.held.toy;
        letGo();
        // (into the chute: never on top of its wall)
        const pr = t.r * BODY;
        M.Body.setPosition(t.body, { x: clamp(t.body.position.x, CH0 + pr + 2, CH1 - 6 - pr), y: t.body.position.y });
        M.Body.setVelocity(t.body, { x: 0, y: 1 });
        t.chute = true; setKind(t, 'free');
        g.sfx('whoosh');
      }
      if (S.pt > 0.5) { S.phase = 'home'; S.pt = 0; }
    } else if (ph === 'home') {
      S.open = Math.min(1, S.open + dt * 3); S.oL = Math.max(S.oL, S.open); S.oR = Math.max(S.oR, S.open);
      const d = HOME - S.cx;
      S.cx += Math.sign(d) * Math.min(Math.abs(d), 380 * dt);
      if (Math.abs(d) < 1 && !S.show && !S.toys.some(t => t.chute)) nextTry(g);
    }
    // toys that reached the bottom of the chute: a prize!
    for (const t of S.toys.slice()) if (t.chute && t.y >= FLOOR - t.r * BODY - 4) { t.t += dt; if (t.t > 0.15) prize(g, t); }
    // the Star Road trail follows the claw while it moves
    const moving = ph === 'aim' ? S.moving : ph !== 'close';
    g.looks.trail(S.cx, headY() + 24, { on: moving });
  }

  // aiming: arrows / the touch buttons, a finger on the glass, or (one thumb) the claw glides by itself
  function aim(g, dt) {
    const inp = g.input, p = inp.pointer;
    let dir = (inp.down('ArrowRight', 'KeyD') ? 1 : 0) - (inp.down('ArrowLeft', 'KeyA') ? 1 : 0);
    let target = null;
    // the big red button drawn on the machine (mouse or finger)
    if (p.justDown && Math.hypot(p.x - BTN.x, p.y - BTN.y) < BTN.r + 18) { dropClaw(g); return; }
    // a finger (or mouse) held on the glass: the claw glides over to it
    if (p.down && p.y < FLOOR + 10 && p.x > GX0 - 20 && p.x < GX1 + 20 && Math.hypot(p.startX - BTN.x, p.startY - BTN.y) > BTN.r + 18) target = clamp(p.x, WALL + 10, CL_MAX);
    if (inp.hit('Space', 'ArrowDown', 'Enter', 'KeyS')) { dropClaw(g); return; }
    const speed = g.little ? 220 : 270;
    S.moving = false;
    if (dir) { S.cx += dir * speed * dt; S.moving = true; S.idle = 0; }
    else if (target != null) { const d = target - S.cx; S.cx += Math.sign(d) * Math.min(Math.abs(d), speed * 1.3 * dt); S.moving = Math.abs(d) > 1; S.idle = 0; }
    else if (g.oneThumb) {
      // one thumb: the claw glides back and forth by itself; just press the button
      S.cx += S.auto * (g.little ? 110 : 150) * dt; S.moving = true;
      if (S.cx > CL_MAX - 4) S.auto = -1;
      if (S.cx < WALL + 40) S.auto = 1;
      // (and slows down a little over the middle of a toy, so a tap lands on it)
      const u = under(S.cx);
      if (u && u.off < 0.3) S.cx -= S.auto * (g.little ? 60 : 70) * dt;
    } else {
      S.idle += dt;
      // little kids / Easy: when the claw stands still, it eases onto the middle of the toy under it
      if ((g.little || g.difficulty === 'easy') && S.idle > 0.25) {
        const u = under(S.cx);
        if (u && u.off > 0.05) S.cx += (u.t.x - S.cx) * Math.min(1, dt * 5);
      }
    }
    S.cx = clamp(S.cx, WALL + 10, CL_MAX);
    // the aiming clock (Normal / Challenge, big kids only): out of time = the claw drops by itself
    const lim = g.little || g.oneThumb ? 0 : AIM_TIME[g.difficulty] || 0;
    S.aimT += dt;
    if (lim && S.aimT >= lim) dropClaw(g);
  }

  // the fingers have closed: did they get it?
  function grab(g) {
    S.phase = 'up'; S.pt = 0;
    const u = S.plan;
    S.plan = null;
    if (!u) { g.sfx('bonk'); aimAt(null); return; }
    const hold = S.lucky ? { firm: 9, wobble: 9 } : holdFor(g);   // (the lucky claw holds whatever it touched)
    const t = u.t, off = u.off;          // (measured when the claw touched it, see 'down')
    const h = { toy: t, off, wobble: off > hold.firm, slipAt: null, lucky: S.lucky, dx: clamp(t.x - S.cx, -t.r, t.r) };
    if (off > hold.wobble) h.slipAt = S.drop * (0.35 + 0.3 * rnd());   // it lifts a bit, then slips
    if (t.body.isStatic) M.Body.setStatic(t.body, false);
    t.held = true; setKind(t, 'held');
    // the spring it hangs from: stiff for a good grab, soft (it swings) for a wobbly one
    S.w.spring = M.Constraint.create({ pointA: { x: S.cx + h.dx, y: tipY() - t.r * 0.15 }, bodyB: t.body, pointB: { x: 0, y: 0 },
      length: 0, stiffness: h.wobble ? 0.07 : 0.5, damping: h.wobble ? 0.02 : 0.2 });
    M.Composite.add(S.w.engine.world, S.w.spring);
    t.sqv -= 3.5;                         // squeezed by the fingers (a sideways squish)
    S.held = h;
    g.sfx(h.wobble ? 'plink' : 'pop');
    g.juice.squash('claw').hit(0.25);
    g.juice.sparkle(S.cx, tipY(), { colors: ['#fff', '#ffd166'] });
  }
  // how far open a finger may close on a toy: it stops where it touches the toy's side
  function fingerShut(t, side) {
    return clamp((side * (t.x - S.cx) + t.r * BODY * 0.85 - 8) / 44, 0, 1);
  }
  // while a toy hangs from the claw, the two outside fingers stay round it (they follow it when it swings)
  function holdToy() {
    const t = S.held.toy, k = 0.3;
    S.oL += (fingerShut(t, -1) - S.oL) * k; S.oR += (fingerShut(t, 1) - S.oR) * k;
  }
  // the spring lets go of the held toy (into the chute, or a slip)
  function letGo() {
    const t = S.held.toy;
    if (S.w.spring) { M.Composite.remove(S.w.engine.world, S.w.spring); S.w.spring = null; }
    t.held = false; S.held = null; S.target = null;
    setKind(t, 'free');                   // (the fingers are round it: they mustn't shove it; it turns back into a pile toy once clear)
  }
  function slip(g) {
    const t = S.held.toy;
    letGo();
    M.Body.setVelocity(t.body, { x: (rnd() - 0.5) * 1.5, y: -0.6 });
    M.Body.setAngularVelocity(t.body, (rnd() - 0.5) * 0.12);
    S.oops = 1.2;
    g.sfx('aww');
    g.juice.squash('claw').hit(-0.15);
    g.achieve('slip');
  }
  function missed(g) {
    S.misses++; S.streak = 0;
    if (S.misses >= (LUCKY_AFTER[g.difficulty] || 2) && !S.lucky) { S.lucky = true; S.luckyNew = 1.6; g.sfx('power'); }
  }

  // a prize came out of the chute!
  function prize(g, t) {
    removeToy(t);
    const got = g.save.data.got = g.save.data.got || {};
    const isNew = !got[t.id];
    got[t.id] = (got[t.id] || 0) + 1;
    g.save.data.total = (g.save.data.total || 0) + 1;
    g.store();
    const rare = P.byId(t.id).rare;
    if (S.lucky) g.achieve('lucky');
    S.won.push(t.id); S.misses = 0; S.lucky = false; S.streak++;
    S.best = Math.max(S.best, S.streak);
    S.show = { id: t.id, t: 0, isNew, rare };
    g.sfx(rare ? 'win' : 'star'); if (isNew) setTimeout(() => g.sfx('sparkle'), 180);
    g.music.stinger(rare ? 'treasure' : 'streak');
    g.particles.burst(CHUTE_X, FLOOR + 30, { count: rare ? 50 : 28, colors: rare ? ['#ffd166', '#fff', '#ffe59a'] : ['#ef476f', '#ffd166', '#06d6a0', '#4cc9f0', '#fff'], shape: 'star', speed: 320, angle: -Math.PI / 2, spread: 1.4 });
    g.juice.pop('won');
    // trophies
    g.achieve('first');
    if (rare) g.achieve('rare');
    if (S.streak >= 3) g.achieve('streak');
    if (S.m.prizes.every(id => got[id])) g.achieve('set');
    if (P.LIST.every(p => got[p.id])) g.achieve('every');
    if (P.MACHINES.every(mm => mm.prizes.some(id => got[id]))) g.achieve('machines');
    S.refill = 1.0;
  }
  // a new toy drops in from the top so the pile never runs out
  function refill() {
    const rareIn = S.toys.some(t => P.byId(t.id).rare);
    const commons = S.m.prizes.filter(id => !P.byId(id).rare), rare = S.m.prizes.find(id => P.byId(id).rare);
    const id = !rareIn && rnd() < 0.2 ? rare : commons[Math.floor(rnd() * commons.length)];
    let x = WALL + 60 + rnd() * (GX1 - WALL - 120);
    if (Math.abs(x - S.cx) < 110) x = x < (WALL + GX1) / 2 ? x + 140 : x - 140;
    S.toys.push(newToy(id, x, RAIL_Y + 90));
    G.sfx('swish');
  }
  function nextTry(g) {
    if (S.used >= S.tries) { finishRound(g); return; }
    S.phase = 'aim'; S.pt = 0; S.aimT = 0; S.idle = 0;
  }
  function finishRound(g) {
    if (S.phase === 'over') return;
    S.phase = 'over';
    const n = S.won.length, need = STARS[g.little ? 'easy' : g.difficulty] || STARS.normal;
    const stars = n >= need[2] ? 3 : n >= need[1] ? 2 : n >= need[0] ? 1 : 0;
    if (n > 0 && n === S.used) g.achieve('perfect');
    const rares = S.won.filter(id => P.byId(id).rare).length;
    const pics = S.won.slice(0, 8).map(id => P.svg(id));
    g.finish({
      win: n > 0, stars, score: n * 100 + rares * 200,
      title: n === 0 ? 'Nice try!' : n >= need[2] ? 'Prize champion!' : 'You won prizes!',
      lines: n ? [] : ['Try the middle of a toy!'],
      rows: pics.length ? [{ t: 'pics', items: pics, size: pics.length > 5 ? 64 : 84 }] : [],
      next: n > 0, delay: 400,
    });
  }

  // ---------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------
  function render(g, ctx) {
    if (!S) setup(g, null);          // (behind the first menus: a machine to look at)
    const m = S.m;
    // the room around the machine
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, m.dark); bg.addColorStop(1, '#2a1e66');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // little lights on the wall
    for (let i = 0; i < 9; i++) {
      const on = (Math.floor(S.glow * 3) + i) % 3 === 0;
      ctx.fillStyle = on ? '#ffd166' : 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.arc(30 + i * 8 + (i > 4 ? 860 : 0), 140 + (i % 5) * 70, 6, 0, Math.PI * 2); ctx.fill();
    }
    // the cabinet
    D.box(ctx, GX0 - 34, 8, GX1 - GX0 + 68, H - 8 + 20, 26, m.color, 6);
    // the marquee (top sign): the machine's name between two plush pictures
    D.box(ctx, GX0 - 10, 14, GX1 - GX0 + 20, 44, 14, '#fff', 5);
    D.text(ctx, m.name, (GX0 + GX1) / 2, 37, { size: 26, color: m.color });
    const a = toyImg(m.prizes[0]), b = toyImg(m.prizes[m.prizes.length - 1]);
    if (a.complete) ctx.drawImage(a, GX0 + 6, 16, 40, 40);
    if (b.complete) ctx.drawImage(b, GX1 - 46, 16, 40, 40);
    // the glass box, inside
    ctx.fillStyle = m.glass; ctx.fillRect(GX0, RAIL_Y - 6, GX1 - GX0, FLOOR - RAIL_Y + 6);
    // the back wall's soft dots
    ctx.fillStyle = m.id === 'space' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.05)';
    for (let y = RAIL_Y + 30; y < FLOOR - 20; y += 46) for (let x = GX0 + 30 + ((y / 46) % 2) * 23; x < GX1; x += 46) { ctx.beginPath(); ctx.arc(x, y, m.id === 'space' ? 2 : 6, 0, Math.PI * 2); ctx.fill(); }
    // the floor of the pile
    ctx.fillStyle = '#e9d8ff'; ctx.fillRect(WALL, FLOOR - 6, GX1 - WALL, 6);
    // the aiming help: a dotted line straight down from the claw, and the toy under it lights up
    if (S.phase === 'aim') {
      const u = under(S.cx);
      ctx.save(); ctx.setLineDash([6, 10]); ctx.lineWidth = 4; ctx.strokeStyle = S.lucky ? 'rgba(255,190,0,0.8)' : 'rgba(43,43,43,0.28)';
      ctx.beginPath(); ctx.moveTo(S.cx, tipY() + 6); ctx.lineTo(S.cx, u ? u.top : FLOOR); ctx.stroke(); ctx.restore();
      if (u && g.difficulty !== 'challenge') {
        const good = u.off < holdFor(g).firm || S.lucky;
        ctx.fillStyle = good ? 'rgba(6,214,160,0.35)' : 'rgba(255,209,102,0.35)';
        ctx.beginPath(); ctx.arc(u.t.x, u.t.y, u.t.r * 1.15, 0, Math.PI * 2); ctx.fill();
      }
    }
    // the toys (the pile, then the chute)
    for (const t of S.toys) if (!t.held) drawToy(ctx, t);
    // the chute: a see-through box with a little wall
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(CH0, CH_TOP, CH1 - CH0, FLOOR - CH_TOP);
    D.box(ctx, WALL - 8, CH_TOP, 12, FLOOR - CH_TOP + 4, 4, m.dark, 4);
    // the claw (and the toy it holds)
    drawClaw(ctx);
    // the glass shine on top
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.moveTo(GX0 + 40, RAIL_Y); ctx.lineTo(GX0 + 110, RAIL_Y); ctx.lineTo(GX0 + 20, FLOOR); ctx.lineTo(GX0, FLOOR); ctx.lineTo(GX0, RAIL_Y + 60); ctx.fill();
    ctx.beginPath(); ctx.moveTo(GX1 - 120, RAIL_Y); ctx.lineTo(GX1 - 96, RAIL_Y); ctx.lineTo(GX1 - 190, FLOOR); ctx.lineTo(GX1 - 214, FLOOR); ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.strokeRect(GX0, RAIL_Y - 6, GX1 - GX0, FLOOR - RAIL_Y + 6);
    // the bottom: the prize door (left) and the controls (right)
    D.box(ctx, CH0 + 6, FLOOR + 10, CH1 - CH0 - 12, 50, 12, '#2b2b2b', 4);
    D.star(ctx, CHUTE_X, FLOOR + 35, 15, '#ffd166', 3);
    D.box(ctx, 560, FLOOR + 10, 230, 58, 16, m.dark, 4);
    // the joystick leans the way the claw moves
    const lean = S.phase === 'aim' && S.moving ? (g.input.down('ArrowLeft', 'KeyA') || (g.oneThumb ? S.auto < 0 : false) ? -1 : 1) * 0.4 : 0;
    ctx.save(); ctx.translate(612, FLOOR + 50); ctx.rotate(lean);
    ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -34); ctx.stroke();
    ctx.lineWidth = 5; ctx.strokeStyle = '#c9d6df'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -34); ctx.stroke();
    D.circle(ctx, 0, -38, 13, '#ef476f', 4); ctx.restore();
    D.box(ctx, 590, FLOOR + 46, 44, 12, 6, '#2b2b2b', 0);
    // the big red button (pushed in when pressed; pulses while you can press it)
    const push = S.btnDown > 0 ? 6 : 0, pulse = S.phase === 'aim' ? 1 + Math.sin(S.glow * 5) * 0.05 : 1;
    D.circle(ctx, BTN.x, BTN.y + 6, BTN.r, '#9b1d3a', 4);
    D.circle(ctx, BTN.x, BTN.y + push, BTN.r * pulse, S.phase === 'aim' ? '#ef476f' : '#c9a0ab', 4);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(BTN.x - 9, BTN.y - 10 + push, 9, 5, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(BTN.x - 10, BTN.y - 4 + push); ctx.lineTo(BTN.x + 10, BTN.y - 4 + push); ctx.lineTo(BTN.x, BTN.y + 9 + push); ctx.fill();
    // HUD: coins left (big top middle, under the sign) and the prizes won
    drawHud(g, ctx);
    if (S.oops > 0) D.text(ctx, 'Oops!', S.cx, RAIL_Y + 150 - (1.2 - S.oops) * 30, { size: 40, color: '#ffd166' });
    if (S.luckyNew > 0) { D.text(ctx, 'Lucky claw!', W / 2, 200, { size: 46, color: '#ffd166' }); }
    if (S.show) drawShow(ctx);
  }
  function drawToy(ctx, t) {
    const im = toyImg(t.id), s = t.r * PIC, foot = t.r * BODY;
    // the squish (plush!): squashed from its bottom, wider + lower when it lands, narrower + taller when squeezed
    ctx.save(); ctx.translate(t.x, t.y + foot); ctx.scale(1 + t.sq, 1 - t.sq); ctx.translate(0, -foot + t.r * 0.08); ctx.rotate(t.rot);
    if (P.byId(t.id).rare) {   // a soft golden glow round the rare toy
      ctx.fillStyle = `rgba(255,209,102,${0.35 + 0.15 * Math.sin(S.glow * 4)})`;
      ctx.beginPath(); ctx.arc(0, 0, t.r * 1.3, 0, Math.PI * 2); ctx.fill();
    }
    if (im.complete && im.naturalWidth) ctx.drawImage(im, -s / 2, -s * 0.56, s, s);
    else D.circle(ctx, 0, 0, t.r, '#ffc8dd', 4);
    ctx.restore();
  }
  function drawClaw(ctx) {
    const x = S.cx, hy = headY(), sq = G.juice.squash('claw');
    const gold = S.lucky;
    // the rail and the carriage
    ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(GX0, RAIL_Y); ctx.lineTo(GX1, RAIL_Y); ctx.stroke();
    ctx.lineWidth = 5; ctx.strokeStyle = '#c9d6df'; ctx.beginPath(); ctx.moveTo(GX0, RAIL_Y); ctx.lineTo(GX1, RAIL_Y); ctx.stroke();
    D.box(ctx, x - 30, RAIL_Y - 12, 60, 24, 8, '#8d99ae', 4);
    // the cable
    ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(x, RAIL_Y + 10); ctx.lineTo(x + Math.sin(S.sway) * 4, hy); ctx.stroke();
    ctx.save();
    ctx.translate(x, hy); ctx.rotate(S.sway * 0.4);
    ctx.scale(sq.sx || 1, sq.sy || 1);
    // the toy it holds sits between the fingers (drawn behind them)
    if (S.held) { ctx.restore(); drawToy(ctx, S.held.toy); ctx.save(); ctx.translate(x, hy); ctx.rotate(S.sway * 0.4); ctx.scale(sq.sx || 1, sq.sy || 1); }
    if (gold) { ctx.fillStyle = `rgba(255,209,102,${0.45 + 0.2 * Math.sin(S.glow * 6)})`; ctx.beginPath(); ctx.arc(0, 30, 58, 0, Math.PI * 2); ctx.fill(); }
    const metal = gold ? '#ffd166' : '#c9d6df';
    // three fingers: each bends out more the more the claw is open
    for (const side of [-1, 0, 1]) {
      const o = side < 0 ? S.oL : side > 0 ? S.oR : Math.min(S.oL, S.oR);   // (each side closes until it touches the toy)
      // shoulder (by the head) -> knee (out to the side) -> tip (hooks in under the toy)
      const kx = side * (16 + 34 * o), ky = 34, tx = side * (8 + 44 * o), ty = ARM;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const path = () => { ctx.beginPath(); ctx.moveTo(side * 9, 14); ctx.lineTo(kx, ky); ctx.lineTo(tx, ty); ctx.lineTo(tx - side * 12, ty + 2); };
      if (side === 0) { if (S.held) continue; ctx.globalAlpha = 0.6; }
      path(); ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.stroke();
      path(); ctx.lineWidth = 5; ctx.strokeStyle = metal; ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // the head
    D.box(ctx, -24, -4, 48, 26, 10, gold ? '#ffb703' : '#ffd166', 4);
    D.circle(ctx, 0, 9, 6, '#ef476f', 3);
    ctx.restore();
  }
  function drawHud(g, ctx) {
    // the coins (tries) left: on the front of the machine, between the prize door and the controls
    const left = S.tries - S.used, n = S.tries, gap = 30, x0 = 412 - (n - 1) * gap / 2, cy = FLOOR + 40;
    D.box(ctx, x0 - 24, cy - 20, (n - 1) * gap + 48, 40, 14, 'rgba(0,0,0,0.18)', 0);
    for (let i = 0; i < n; i++) {
      const on = i < left;
      D.circle(ctx, x0 + i * gap, cy, 11, on ? '#ffd166' : 'rgba(255,255,255,0.4)', 3);
      if (on) { ctx.fillStyle = '#e09f00'; ctx.fillRect(x0 + i * gap - 2, cy - 6, 4, 12); }
    }
    // prizes won this round: little plush pictures in a row over the chute
    const k = G.juice.size('won');
    S.won.slice(-4).forEach((id, i) => { const im = toyImg(id); if (im.complete) ctx.drawImage(im, CH0 + 4 + i * 26, CH_TOP - 52 - (i === Math.min(3, S.won.length - 1) ? (k - 1) * 30 : 0), 40, 40); });
    if (S.won.length) D.text(ctx, '' + S.won.length, CH1 - 14, CH_TOP - 20, { size: 26 * k });
    // the aiming clock (a ring that empties)
    const lim = g.little || g.oneThumb ? 0 : AIM_TIME[g.difficulty] || 0;
    if (lim && S.phase === 'aim') {
      const f = 1 - S.aimT / lim;
      ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(BTN.x + 58, BTN.y, 15, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 5; ctx.strokeStyle = f < 0.3 ? '#ef476f' : '#06d6a0';
      ctx.beginPath(); ctx.arc(BTN.x + 58, BTN.y, 15, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f); ctx.stroke();
    }
  }
  // the prize you just won, big in the middle with a glow
  function drawShow(ctx) {
    const sh = S.show, u = Math.min(1, sh.t / 0.35), out = sh.t > 1.5 ? 1 - (sh.t - 1.5) / 0.3 : 1;
    const s = (0.4 + 0.6 * (1 + 1.6 * Math.pow(u - 1, 3) + 0.6 * Math.pow(u - 1, 2))) * 170 * Math.max(0, out);
    if (s <= 1) return;
    const cx = W / 2 + 40, cy = 250;
    ctx.save();
    ctx.globalAlpha = Math.max(0, out);
    const gl = ctx.createRadialGradient(cx, cy, 10, cx, cy, s);
    gl.addColorStop(0, sh.rare ? 'rgba(255,209,102,0.95)' : 'rgba(255,255,255,0.95)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, cy, s, 0, Math.PI * 2); ctx.fill();
    ctx.translate(cx, cy); ctx.rotate(Math.sin(sh.t * 6) * 0.08);
    const im = toyImg(sh.id);
    if (im.complete) ctx.drawImage(im, -s * 0.6, -s * 0.6, s * 1.2, s * 1.2);
    ctx.restore();
    ctx.globalAlpha = Math.max(0, out);
    if (sh.isNew) D.text(ctx, 'New!', cx, cy - s * 0.62, { size: 38, color: '#ffd166' });
    D.text(ctx, P.byId(sh.id).name, cx, cy + s * 0.66, { size: 30, color: '#fff' });
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------
  // Menus: the machines (levels), the Prize Shelf
  // ---------------------------------------------------------------
  const got = (g) => g.save.data.got || {};
  const CI = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
  function machinePic(m, toyId) {
    const toy = P.byId(toyId).art;
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="4" width="80" height="92" rx="12" fill="${m.color}" ${CI}/>` +
      `<rect x="18" y="20" width="64" height="52" rx="4" fill="${m.glass}" ${CI}/><path d="M50 20 V34" ${CI}/><path d="M42 34 L38 42 M58 34 L62 42 M44 32 H56" ${CI}/>` +
      `<g transform="translate(30 42) scale(0.4)">${toy}</g><rect x="22" y="78" width="22" height="12" rx="4" fill="#2b2b2b"/><circle cx="68" cy="84" r="7" fill="#ef476f" ${CI} stroke-width="3"/></svg>`;
  }
  const shelfIcon = () => `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="46" width="64" height="10" rx="4" fill="#c68b59" ${CI}/><path d="M16 56 V70 M64 56 V70" ${CI}/>` +
    `<g transform="translate(6 10) scale(0.38)">${P.byId('bunny').art}</g><g transform="translate(36 12) scale(0.36)">${P.byId('frog').art}</g></svg>`;
  function levels(g) {
    const have = got(g);
    return P.MACHINES.map((m, i) => {
      const prev = i === 0 || (g.save.levels[P.MACHINES[i - 1].id] || {}).done;
      const n = m.prizes.filter(id => have[id]).length;
      return { id: m.id, name: m.name, pic: machinePic(m, m.prizes[i === 0 ? 0 : 1]), locked: !prev, meta: `${n} / ${m.prizes.length}` };
    });
  }
  // the Prize Shelf: every toy of every machine; won ones in color with how many, the others a gray shape + "?"
  function shelfScreen(g) {
    const have = got(g), tiles = [];
    for (const m of P.MACHINES) {
      tiles.push({ heading: m.name });
      for (const id of m.prizes) {
        const p = P.byId(id), n = have[id] || 0;
        tiles.push({ pic: P.svg(id, !n), name: n ? p.name : '?', meta: n ? ['×' + n] : [], attr: 'prize-' + id, label: p.name, locked: false,
          color: p.rare && n ? '#fff3c4' : undefined,
          onTap: () => { Arcade.sfx(n ? 'pop' : 'bonk'); } });
      }
    }
    const found = P.LIST.filter(p => have[p.id]).length;
    ArcadeMenus.open({ id: 'shelf', title: 'Prize Shelf',
      rows: [
        { t: 'chips', items: [{ svg: shelfIcon(), text: `${found} / ${P.LIST.length}` }] },
        { t: 'tiles', w: 120, h: 140, items: tiles },
      ],
      footer: { t: 'buttons', items: [{ icon: Arcade.icons.left, label: 'Back', color: 'big', attr: 'back', onTap: () => { Arcade.sfx('click'); g.menu(); } }] },
      onKey: (c) => { if (c === 'Escape') g.menu(); } });
  }
  function openShelf(g) {
    if (window.ArcadeMenus) { shelfScreen(g); return; }
    // (no Phaser: a plain HTML page)
    const p = Arcade.h('div', { class: 'ar-panel wide ar-scroll' });
    p.appendChild(Arcade.h('h1', { class: 'ar-title' }, 'Prize Shelf'));
    const grid = Arcade.h('div', { class: 'ar-grid' });
    for (const pr of P.LIST) grid.appendChild(Arcade.h('div', { class: 'ar-tile' }, `<div class="pic">${P.svg(pr.id, !got(g)[pr.id])}</div><div>${got(g)[pr.id] ? pr.name : '?'}</div>`));
    p.appendChild(grid);
    p.appendChild(Arcade.h('button', { class: 'ar-btn big', onclick: () => g.menu() }, 'Back'));
    g.panel(p);
  }

  // ---------------------------------------------------------------
  // "Show me": the hand slides the claw over the middle of a toy and presses the button
  // ---------------------------------------------------------------
  function bestToy() {
    let best = null;
    for (const t of S.toys) {
      if (t.held || t.chute || t.x < WALL + 30) continue;
      const u = under(t.x);
      if (!u || u.t !== t) continue;                 // (something lies on top of it)
      const score = t.y - Math.abs(t.x - HOME) * 0.4;
      if (!best || score < best.score) best = { t, score };
    }
    return best && best.t;
  }
  function demoThink(g, hand, t) {
    if (hand.busy() || S.phase !== 'aim' || t < 0.6) return;
    const tg = bestToy();
    if (!tg) return;
    if (Math.abs(tg.x - S.cx) > 6) hand.drag(S.cx, RAIL_Y + 120, tg.x, RAIL_Y + 120, 0.9, 0.35);
    else hand.tap(BTN.x, BTN.y);
  }

  const Sv = (inner) => `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  const clawPic = (open) => `<path d="M40 4 V24" ${CI}/><rect x="28" y="22" width="24" height="12" rx="5" fill="#ffd166" ${CI}/>` +
    (open ? `<path d="M32 34 L20 48 L26 60 M48 34 L60 48 L54 60" fill="none" ${CI}/>` : `<path d="M32 34 L28 48 L36 60 M48 34 L52 48 L44 60" fill="none" ${CI}/>`);

  Arcade.start({
    id: 'claw',
    title: 'Claw Catch',
    looks: { kinds: ['trail'] },          // (the Star Road: stars unlock trails behind the claw)
    trophies: [
      { id: 'first', name: 'First prize!', how: 'Win a prize' },
      { id: 'rare', name: 'Golden catch', how: 'Win a golden prize' },
      { id: 'streak', name: 'Three in a row', how: 'Win 3 prizes in a row' },
      { id: 'set', name: 'Full set', how: 'Win every prize in one machine' },
      { id: 'machines', name: 'Every machine', how: 'Win a prize in all 4 machines' },
      { id: 'every', name: 'Prize collector', how: 'Win all 24 prizes' },
      { id: 'perfect', name: 'Every coin a prize', how: 'Win a prize with every coin in a round', secret: true },
      { id: 'lucky', name: 'Lucky claw', how: 'Win a prize with the golden lucky claw', secret: true },
      { id: 'slip', name: 'Oopsie!', how: 'A toy slipped out of the claw', secret: true },
    ],
    logo: Arcade.logo({
      badge: Arcade.badges.claw,
      title: 'Claw', title2: 'Catch', colors: ['#ffffff', '#ffd166'], bg: '#ff8fab',
      art: `<rect x="60" y="10" width="120" height="140" rx="16" fill="#ff8fab" ${CI}/><rect x="74" y="26" width="92" height="84" fill="#fff0f6" ${CI}/>` }),
    view: { w: W, h: H },
    background: '#2a1e66',
    littleSpeed: 1,
    music: { tempo: 112, root: 62, scale: 'major', prog: [[1, 6, 4, 5], [4, 5, 3, 6], [2, 5, 1, 1]], drums: 'boombap', bass: 'bounce', lead: 'bell', harmony: 'marimba', swing: 0.1, pad: false, arp: true, arpSound: 'marimba', seed: 2611,
      tune: { A: '5/4 6/2 5/2 3/4 1/4 | 6/4 5/2 6/2 8/8 | 4/4 5/2 6/2 8/4 6/4 | 7/4 5/4 5/8',
              B: '8/4 7/2 6/2 4/4 6/4 | 5/2 6/2 7/4 9/8 | 3/4 5/4 7/4 5/4 | 6/4 8/4 6/8',
              C: '2/4 4/4 6/8 | 5/4 7/4 9/8 | 8/4 6/4 5/4 3/4 | 1/8 3/8' } },
    menuMusic: { tempo: 96, root: 62, scale: 'major', prog: [[1, 4, 5, 1], [6, 4, 5, 5], [4, 1, 5, 1]], drums: 'soft', bass: 'bounce', lead: 'flute', harmony: 'uke', pad: true, arp: true, arpSound: 'marimba', seed: 2612,
      tune: { A: '3/4 5/4 8/8 | 6/4 8/4 6/8 | 5/4 7/4 9/8 | 8/4 5/4 3/8',
              B: '6/4 8/4 6/8 | 4/4 6/4 8/8 | 7/4 5/4 7/8 | 5/16',
              C: '6/8 4/8 | 5/8 8/8 | 7/8 5/8 | 5/16' } },
    levelsTitle: 'Pick a machine',
    // the Toy Box is Easy, the Ocean + Candy Shop Normal, Star Station a Challenge (little kids: always Easy)
    levelDifficulty: (lv) => ({ toys: 'easy', sea: 'normal', sweets: 'normal', space: 'challenge' })[lv.id] || 'normal',
    showMe: { secs: 8, think: demoThink },
    howTo: [
      { pic: Sv(clawPic(true) + `<path d="M8 70 H28 M52 70 H72 M8 70 l8 -6 M8 70 l8 6 M72 70 l-8 -6 M72 70 l-8 6" fill="none" ${CI}/>`), text: 'Slide the claw', keys: 'Arrows · or drag a finger' },
      { pic: Sv(`<circle cx="40" cy="44" r="26" fill="#9b1d3a" ${CI}/><circle cx="40" cy="38" r="26" fill="#ef476f" ${CI}/><path d="M30 34 H50 L40 48 Z" fill="#fff"/>`), text: 'Press the button', keys: 'Space' },
      { pic: Sv(clawPic(false) + `<g transform="translate(22 42) scale(0.36)">${P.byId('bunny').art}</g>`), text: 'Grab it in the middle!' },
      { pic: Sv(`<rect x="10" y="50" width="60" height="10" rx="4" fill="#c68b59" ${CI}/><g transform="translate(4 14) scale(0.38)">${P.byId('duck').art}</g><g transform="translate(38 14) scale(0.38)">${P.byId('kitty').art}</g>`), text: 'Win prizes!' },
    ],
    buttons: {
      left: [{ id: 'ArrowLeft', icon: Arcade.icons.left, label: 'Left' }, { id: 'ArrowRight', icon: Arcade.icons.right, label: 'Right' }],
      right: [{ id: 'Space', icon: Arcade.icons.down, label: 'Drop', main: true, color: '#ef476f' }],
    },
    oneThumb: {
      buttons: { right: [{ id: 'Space', icon: Arcade.icons.down, label: 'Drop', main: true, color: '#ef476f' }] },
      stack: ['right'],
      howTo: [
        { pic: Sv(clawPic(true) + `<path d="M8 70 H72" fill="none" ${CI} stroke-dasharray="6 8"/>`), text: 'The claw slides by itself' },
        { pic: Sv(`<circle cx="40" cy="44" r="26" fill="#9b1d3a" ${CI}/><circle cx="40" cy="38" r="26" fill="#ef476f" ${CI}/><path d="M30 34 H50 L40 48 Z" fill="#fff"/>`), text: 'Press over a toy!' },
      ],
    },
    levels,
    menuExtras: (g) => [{ icon: shelfIcon(), label: 'Prizes', attr: 'data-shelf', onClick: () => openShelf(g) }],
    canvasMenus: true,
    setup,
    update,
    draw: render,
  });

  // ---- test hooks ----
  window.__clawState = () => S && ({
    phase: S.phase, cx: S.cx, drop: S.drop, tries: S.tries, used: S.used, won: S.won.slice(), lucky: S.lucky, misses: S.misses,
    toys: S.toys.map(t => ({ id: t.id, x: Math.round(t.x), y: Math.round(t.y), r: t.r, held: t.held, chute: t.chute })),
    held: S.held && { id: S.held.toy.id, off: S.held.off, wobble: S.held.wobble, slips: S.held.slipAt != null },
    machine: S.m.id, show: S.show && S.show.id, oops: S.oops > 0,
    // the physics (Matter.js): bodies in the world, how open each finger is, a held toy's spring, squishes so far
    engine: 'matter', bodies: M.Composite.allBodies(S.w.engine.world).length, fingers: [S.oL, S.oR],
    spring: S.w.spring && { stiffness: S.w.spring.stiffness }, squishes: S.squishes,
    tips: S.w.tips.map(b => ({ x: Math.round(b.position.x), y: Math.round(b.position.y) })),
  });
  window.__clawTest = {
    // move the claw over x (view px) at once
    moveTo(x) { S.cx = clamp(x, WALL + 10, CL_MAX); },
    drop() { dropClaw(G); },
    best() { const t = bestToy(); return t && { x: t.x, id: t.id }; },
    under(x) { const u = under(x == null ? S.cx : x); return u && { id: u.t.id, off: u.off }; },
    btn: () => ({ x: BTN.x, y: BTN.y }),
    // a toy's spin / squish (tests)
    // how fast the fastest pile toy still moves (px per 1/60 s): about 0 = the pile has settled
    moving: () => Math.max(0, ...S.toys.filter(t => !t.held && !t.chute).map(t => t.body.speed * 2)),
    toy: (i) => { const t = S.toys[i]; return t && { x: t.x, y: t.y, rot: t.rot, sq: t.sq, kind: t.kind }; },
    shelf: () => G && openShelf(G),
  };
})();
