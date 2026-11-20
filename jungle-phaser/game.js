// =====================================================================
// Jungle Jump, the PHASER version (a side-by-side demo, Nov 20).
//
// This is the first level of Jungle Jump (Leafy Forest) rebuilt with the
// Phaser 3 game framework, so you can compare it with the plain-JavaScript
// game in ../jungle/jungle.js. Same map, same moves, same idea; the difference
// is WHO does the work:
//
//   plain JS (jungle.js)                      Phaser (this file)
//   ------------------------------------      ------------------------------------
//   our own game loop (requestAnimationFrame)  Phaser runs the loop: we fill in
//                                               preload() / create() / update()
//   our own tile collision (move x, push out,  Arcade Physics: give things a "body",
//   move y, push out)                           then this.physics.add.collider(a, b)
//   we draw every frame by hand on a canvas     we make sprites once; Phaser draws them
//   our own camera math                         this.cameras.main.startFollow(hero)
//   our own tweens / timers                     this.tweens.add({...}), this.time.delayedCall
//   our own scaling for phones                  Phaser.Scale.FIT does it
//
// What Phaser does NOT give us: the game itself. The map, the feel of the
// jump (coyote time, jump buffer, short hops), the leaf glide and the roll are
// still our own code, just like in jungle.js.
//
// Not in this demo (the real game has them): music + sounds, the other 7
// levels, picking your animal, stars and stickers, saves, little-kid help.
// =====================================================================

const T = 48;               // tile size in px (the same as jungle.js)
const VIEW_W = 960, VIEW_H = 540;

// The Leafy Forest map, copied letter for letter from jungle.js.
// (.) air  (#) ground  (e) ground on Easy  (=) thin platform you can jump up through
// (B) cracked boulder: roll into it   (*) berry   (C) treasure chest   (K) lantern = checkpoint
// (^) thorns   (S) spring   (c) critter   (h>>>) platform sliding right   (v + |) lift going up
// (x) flower   (P) start   (G) the hot-air balloon = the goal
const MAP = [
  '..............................................................................................................',
  '.....................................*........................................................................',
  '....................................*..*.C....................................................................',
  '......................................=====............................................*......................',
  '..........................................................*.*.......*...*.....................................',
  '....................****..................................BBB.........c...........***..|......................',
  '....................====.............................***.........##########.......===..|......................',
  '.....***......................................h>>>..............###########............|.......*.*.*..........',
  '..P......x.###.....x.......c........S......K.......x..^........############.....K......v........c....x..G.....',
  '###############eee#############ee#############eeee#########################eee#############e##################',
  '###############eee#############ee#############eeee#########################eee#############e##################',
];

// How the hero moves (pixels and seconds), the same numbers as jungle.js
const PHYS = {
  walk: 300, run: 390, runAfter: 0.6,
  accel: 2200, decel: 2600, airAccel: 1700,
  jumpV: 760,
  gRise: 1800, gCut: 4200, gFall: 3000,   // gravity going up (jump held) / going up (let go) / coming down
  maxFall: 900, glideFall: 140,
  rollV: 620, rollTime: 0.38,
  springV: 1180,
  coyote: 0.1, buffer: 0.12,               // "coyote time" and "jump buffer" in seconds
};

// The forest's colors (from jungle.js)
const C = {
  sky1: 0x8fdcff, sky2: 0xe4fbff, far: 0xa6dc98, mid: 0x5fb85a, trunk: 0x9a6235,
  dirt: 0xb9783f, dirtDot: 0xa0632f, top: 0x6cc04a, topDark: 0x4f9e35,
  plank: 0xd79a5f, spike: 0xe0457b, critter: 0xef476f, ink: 0x2b2b2b,
};
const INK = C.ink;

const at = (col, row) => (MAP[row] || '')[col] || '.';
const isGround = (ch) => ch === '#' || ch === 'e';

// =====================================================================
// One Phaser "scene" = one screen of the game. Phaser calls create() once
// at the start, then update() every frame.
// =====================================================================
class ForestScene extends Phaser.Scene {
  constructor() { super('forest'); }

  // ---- 1. make every picture once (Phaser keeps them as "textures") ----
  makeTextures() {
    if (this.textures.exists('hero')) return;
    const g = this.add.graphics();
    const tex = (key, w, h, drawFn) => { g.clear(); drawFn(g); g.generateTexture(key, w, h); };

    // the hero: Momo the monkey, facing right (40 x 48)
    tex('hero', 40, 48, (g) => {
      g.lineStyle(4, INK);
      g.fillStyle(0xb5764a); g.fillCircle(8, 16, 7); g.strokeCircle(8, 16, 7);          // ear
      g.fillStyle(0xb5764a); g.fillRoundedRect(6, 26, 28, 20, 9); g.strokeRoundedRect(6, 26, 28, 20, 9);   // body
      g.fillStyle(0xb5764a); g.fillCircle(21, 18, 15); g.strokeCircle(21, 18, 15);      // head
      g.fillStyle(0xf5d3a6); g.fillEllipse(26, 22, 20, 15);                             // face
      g.fillStyle(INK); g.fillCircle(24, 15, 3); g.fillCircle(31, 15, 3);                 // eyes
      g.fillStyle(0xffffff); g.fillCircle(25, 14, 1.2); g.fillCircle(32, 14, 1.2);
      g.fillStyle(0xf7a8b8); g.fillCircle(19, 22, 2.5);                                  // cheek
      g.lineStyle(2.5, INK); g.beginPath(); g.arc(28, 22, 4, 0.2, Math.PI - 0.2); g.strokePath();   // smile
    });
    // the leaf for gliding (56 x 24)
    tex('leaf', 56, 26, (g) => {
      g.fillStyle(0x7bd389); g.lineStyle(4, INK);
      g.fillEllipse(28, 14, 50, 18); g.strokeEllipse(28, 14, 50, 18);
      g.lineStyle(2.5, 0x3f8f4a); g.lineBetween(8, 14, 48, 14);
    });
    // a berry (goodie)
    tex('berry', 30, 30, (g) => {
      g.lineStyle(4, INK); g.fillStyle(0x9b5de5); g.fillCircle(15, 17, 11); g.strokeCircle(15, 17, 11);
      g.fillStyle(0xffffff); g.fillCircle(11, 13, 3);
      g.fillStyle(0x6cc04a); g.fillEllipse(19, 5, 12, 6);
    });
    // treasure chest
    tex('chest', 44, 38, (g) => {
      g.lineStyle(4, INK); g.fillStyle(0xc68b59); g.fillRoundedRect(3, 10, 38, 26, 6); g.strokeRoundedRect(3, 10, 38, 26, 6);
      g.fillStyle(0xffd166); g.fillRect(3, 18, 38, 6); g.strokeRect(3, 18, 38, 6); g.fillRect(18, 16, 8, 12);
    });
    // lantern (off / lit)
    for (const lit of [false, true]) tex(lit ? 'lanternOn' : 'lantern', 30, 70, (g) => {
      g.fillStyle(0x6b4a2b); g.fillRect(13, 30, 5, 40);
      g.lineStyle(4, INK); g.fillStyle(lit ? 0xffd166 : 0xd8d2c4); g.fillRoundedRect(4, 6, 22, 28, 7); g.strokeRoundedRect(4, 6, 22, 28, 7);
      if (lit) { g.fillStyle(0xfff3b0); g.fillCircle(15, 20, 6); }
    });
    // thorns
    tex('spikes', 48, 24, (g) => {
      g.fillStyle(C.spike); g.lineStyle(3.5, INK);
      for (let i = 0; i < 3; i++) { g.fillTriangle(2 + i * 15, 24, 9.5 + i * 15, 2, 17 + i * 15, 24); g.strokeTriangle(2 + i * 15, 24, 9.5 + i * 15, 2, 17 + i * 15, 24); }
    });
    // spring
    tex('spring', 44, 30, (g) => {
      g.lineStyle(4, INK); g.fillStyle(0xef476f); g.fillRoundedRect(2, 2, 40, 10, 4); g.strokeRoundedRect(2, 2, 40, 10, 4);
      g.lineStyle(4, INK); g.beginPath(); g.moveTo(10, 12); g.lineTo(34, 18); g.lineTo(10, 23); g.lineTo(34, 29); g.strokePath();
    });
    // cracked boulder
    tex('boulder', 48, 48, (g) => {
      g.lineStyle(4, INK); g.fillStyle(0xa8a29e); g.fillRoundedRect(2, 2, 44, 44, 14); g.strokeRoundedRect(2, 2, 44, 44, 14);
      g.lineStyle(3, INK); g.beginPath(); g.moveTo(14, 8); g.lineTo(22, 22); g.lineTo(16, 30); g.lineTo(26, 40); g.strokePath();
    });
    // critter: a round red ladybug-ish bug with big eyes
    tex('critter', 46, 34, (g) => {
      g.lineStyle(4, INK); g.fillStyle(C.critter); g.fillEllipse(23, 20, 40, 26); g.strokeEllipse(23, 20, 40, 26);
      g.fillStyle(INK); g.fillCircle(14, 16, 3); g.fillCircle(30, 22, 3); g.fillCircle(22, 26, 2.5);
      g.fillStyle(0xffffff); g.fillCircle(34, 11, 6); g.lineStyle(3, INK); g.strokeCircle(34, 11, 6);
      g.fillStyle(INK); g.fillCircle(35, 11, 3);
    });
    // moving platform
    tex('platform', 120, 22, (g) => {
      g.lineStyle(4, INK); g.fillStyle(C.plank); g.fillRoundedRect(2, 2, 116, 18, 7); g.strokeRoundedRect(2, 2, 116, 18, 7);
      g.lineStyle(2.5, 0xa86f3c); g.lineBetween(40, 4, 40, 18); g.lineBetween(80, 4, 80, 18);
    });
    // flower decoration
    tex('flower', 40, 48, (g) => {
      g.fillStyle(0x4f9e35); g.fillRect(18, 22, 4, 26);
      g.lineStyle(3, INK); g.fillStyle(0xff8fab);
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; g.fillCircle(20 + Math.cos(a) * 9, 16 + Math.sin(a) * 9, 7); g.strokeCircle(20 + Math.cos(a) * 9, 16 + Math.sin(a) * 9, 7); }
      g.fillStyle(0xffd166); g.fillCircle(20, 16, 6); g.strokeCircle(20, 16, 6);
    });
    // the hot-air balloon (goal)
    tex('balloon', 110, 170, (g) => {
      g.lineStyle(5, INK);
      g.fillStyle(0xef476f); g.fillCircle(55, 52, 48); g.strokeCircle(55, 52, 48);
      g.fillStyle(0xffd166); g.fillEllipse(55, 52, 38, 94);
      g.lineStyle(3, INK); g.lineBetween(20, 86, 38, 132); g.lineBetween(90, 86, 72, 132);
      g.lineStyle(5, INK); g.fillStyle(0xc68b59); g.fillRoundedRect(34, 130, 42, 34, 6); g.strokeRoundedRect(34, 130, 42, 34, 6);
    });
    // a sparkle (for poofs and pickups)
    tex('spark', 16, 16, (g) => { g.fillStyle(0xffffff); g.fillCircle(8, 8, 7); });
    // a heart (for the HUD)
    tex('heart', 34, 30, (g) => {
      g.fillStyle(0xef476f); g.lineStyle(3.5, INK);
      g.fillCircle(10, 10, 8); g.fillCircle(24, 10, 8); g.fillTriangle(3, 13, 31, 13, 17, 28);
      g.beginPath(); g.arc(10, 10, 8, Math.PI * 0.8, Math.PI * 1.9); g.arc(24, 10, 8, Math.PI * 1.1, Math.PI * 0.2); g.lineTo(17, 28); g.closePath(); g.strokePath();
    });
    g.destroy();
  }

  // ---- 2. build the level from the text map ----
  create() {
    this.makeTextures();
    const cols = MAP[0].length, rows = MAP.length;
    const worldW = cols * T, worldH = rows * T;
    this.physics.world.setBounds(0, 0, worldW, worldH + 400);
    this.physics.world.setBoundsCollision(true, true, false, false);   // walls left/right, open at the bottom (pits)
    this.physics.world.gravity.y = PHYS.gFall;

    this.drawBackground(worldW);
    this.ground = this.physics.add.staticGroup();      // solid ground (invisible boxes, one per run of tiles)
    this.thin = this.physics.add.staticGroup();        // thin platforms you can jump up through
    this.boulders = this.physics.add.staticGroup();
    this.goodies = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.springs = this.physics.add.staticGroup();
    this.lanterns = this.physics.add.staticGroup();
    this.critters = this.physics.add.group();
    this.movers = this.physics.add.group({ allowGravity: false, immovable: true });
    this.drawGround();

    let start = { x: 100, y: 300 };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const ch = at(c, r), x = c * T + T / 2, y = r * T + T / 2;
      if (ch === 'P') start = { x, y };
      else if (ch === '*') this.goodies.create(x, y, 'berry');
      else if (ch === 'C') this.goodies.create(x, y + 4, 'chest').setData('chest', true);
      else if (ch === '^') this.spikes.create(x, y + 12, 'spikes').refreshBody().body.setSize(40, 16).setOffset(4, 8);
      else if (ch === 'S') this.springs.create(x, y + 9, 'spring');
      else if (ch === 'K') this.lanterns.create(x, y - 10, 'lantern');
      else if (ch === 'B') this.boulders.create(x, y, 'boulder');
      else if (ch === 'x') this.add.image(x, y, 'flower');
      else if (ch === 'G') { this.goal = this.physics.add.staticImage(x, y - 60, 'balloon'); }
      else if (ch === 'c') {
        const k = this.critters.create(x, y + 6, 'critter');
        k.setVelocityX(-70).setBounce(0).setData('dir', -1);
        this.tweens.add({ targets: k, scaleY: 0.9, duration: 220, yoyo: true, repeat: -1 });
      } else if (ch === 'h') {           // slides right over the '>' marks and back
        let n = 0; while (at(c + 1 + n, r) === '>') n++;
        this.addMover(x, y, x, x + n * T, 'x');
      } else if (ch === 'v') {           // rides up the '|' marks and back down
        let n = 0; while (at(c, r - 1 - n) === '|') n++;
        this.addMover(x, y, y - n * T, y, 'y');
      }
    }

    // ---- the hero ----
    this.start = start;
    this.hero = this.physics.add.sprite(start.x, start.y, 'hero');
    this.hero.body.setSize(30, 42).setOffset(5, 6);
    this.hero.setMaxVelocity(PHYS.rollV, PHYS.maxFall);
    this.leaf = this.add.image(0, 0, 'leaf').setVisible(false);
    this.hearts = 3; this.berries = 0; this.treasure = false;
    this.hurtT = 0; this.coyoteT = 0; this.bufferT = 0; this.rollT = 0; this.rollCoolT = 0;
    this.heldT = 0; this.won = false;

    // ---- who bumps into whom (this is where Phaser saves the most code) ----
    this.physics.add.collider(this.hero, this.ground);
    this.physics.add.collider(this.hero, this.thin);
    this.physics.add.collider(this.hero, this.movers);
    this.physics.add.collider(this.hero, this.boulders, (h, b) => { if (this.rollT > 0) this.smash(b); });
    this.physics.add.collider(this.critters, this.ground);
    this.physics.add.collider(this.critters, this.boulders);
    this.physics.add.overlap(this.hero, this.goodies, (h, item) => this.collect(item));
    this.physics.add.overlap(this.hero, this.spikes, () => this.hurt());
    this.physics.add.overlap(this.hero, this.springs, (h, s) => this.boing(s));
    this.physics.add.overlap(this.hero, this.lanterns, (h, l) => this.lightLantern(l));
    this.physics.add.overlap(this.hero, this.critters, (h, k) => this.meetCritter(k));
    this.physics.add.overlap(this.hero, this.goal, () => this.win());

    // ---- camera: follow the hero, a little ahead ----
    this.cameras.main.setBounds(0, 0, worldW, Math.max(worldH, VIEW_H));
    this.cameras.main.startFollow(this.hero, true, 0.12, 0.12, 0, 40);
    this.cameras.main.setBackgroundColor(C.sky1);

    // ---- controls: keyboard + big touch buttons ----
    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,UP,DOWN,SPACE,A,D,W,S,X,Z,SHIFT');
    this.touch = { left: false, right: false, jump: false, roll: false };
    this.makeTouchButtons();
    this.makeHUD();
  }

  addMover(x, y, lo, hi, axis) {
    const p = this.movers.create(x, y + 13, 'platform');
    p.setData({ lo, hi, axis });
    p.body.setFriction(1, 1);                         // you ride along with it
    if (axis === 'x') p.setVelocityX(90); else p.setVelocityY(-80);
  }

  // The sky + two layers of hills that scroll slower than the ground (parallax).
  drawBackground(worldW) {
    const sky = this.add.graphics().setScrollFactor(0);
    sky.fillGradientStyle(C.sky1, C.sky1, C.sky2, C.sky2, 1); sky.fillRect(0, 0, VIEW_W, VIEW_H);
    const hills = (color, factor, y, r, step) => {
      const gr = this.add.graphics().setScrollFactor(factor, 1);
      gr.fillStyle(color); gr.lineStyle(4, INK, 0.25);
      for (let x = -r; x < worldW * factor + VIEW_W + r; x += step) { gr.fillCircle(x, y, r); }
      gr.fillRect(-r, y, worldW * factor + VIEW_W + 2 * r, 600);
    };
    hills(C.far, 0.2, 420, 140, 230);
    hills(C.mid, 0.45, 470, 90, 150);
  }

  // The ground is drawn ONCE into one picture (fast), and the solid parts get
  // invisible physics boxes, one per run of ground tiles in a row (no seams).
  drawGround() {
    const g = this.add.graphics();
    for (let r = 0; r < MAP.length; r++) {
      let runStart = -1;
      for (let c = 0; c <= MAP[r].length; c++) {
        const ch = at(c, r);
        if (isGround(ch)) {
          if (runStart < 0) runStart = c;
          const x = c * T, y = r * T;
          g.fillStyle(C.dirt); g.fillRect(x, y, T, T);
          g.fillStyle(C.dirtDot); g.fillCircle(x + 12 + (c * 7) % 20, y + 16 + (r * 5) % 18, 4);
          if (!isGround(at(c, r - 1))) {                        // grass on top
            g.fillStyle(C.top); g.fillRect(x, y, T, 14);
            g.fillStyle(C.topDark); for (let k = 0; k < 3; k++) g.fillCircle(x + 8 + k * 16, y + 14, 7);
            g.lineStyle(4, INK); g.lineBetween(x, y, x + T, y);
          }
          if (!isGround(at(c - 1, r))) { g.lineStyle(4, INK); g.lineBetween(x, y, x, y + T); }
          if (!isGround(at(c + 1, r))) { g.lineStyle(4, INK); g.lineBetween(x + T, y, x + T, y + T); }
        } else if (runStart >= 0) {
          // one invisible box for the whole run of ground
          const box = this.add.zone(runStart * T + (c - runStart) * T / 2, r * T + T / 2, (c - runStart) * T, T);
          this.ground.add(box);
          runStart = -1;
        }
        if (ch === '=') {                                        // thin platform: solid only from above
          g.fillStyle(C.plank); g.fillRoundedRect(c * T, r * T, T, 16, 5);
          g.lineStyle(4, INK); g.strokeRoundedRect(c * T, r * T, T, 16, 5);
          const z = this.add.zone(c * T + T / 2, r * T + 8, T, 16);
          this.thin.add(z);
          z.body.checkCollision.down = false; z.body.checkCollision.left = false; z.body.checkCollision.right = false;
        }
      }
    }
  }

  makeHUD() {
    const hud = (o) => o.setScrollFactor(0).setDepth(10);
    this.heartIcons = [0, 1, 2].map(i => hud(this.add.image(100 + i * 40, 36, 'heart')));
    hud(this.add.image(VIEW_W / 2 - 40, 36, 'berry').setScale(1.2));
    this.berryText = hud(this.add.text(VIEW_W / 2 - 14, 36, '0', { fontFamily: 'Arial Black, sans-serif', fontSize: '34px', color: '#ffffff', stroke: '#2b2b2b', strokeThickness: 7 }).setOrigin(0, 0.5));
    // a home button (back to the arcade)
    const home = hud(this.add.circle(40, 36, 28, 0xffffff).setStrokeStyle(4, INK).setInteractive());
    hud(this.add.text(40, 36, '⌂', { fontSize: '34px', color: '#2b2b2b' }).setOrigin(0.5));
    home.on('pointerdown', () => { location.href = '../index.html'; });
  }

  // Big round on-screen buttons (only on touch screens): ◀ ▶ at the left, roll + JUMP at the right.
  makeTouchButtons() {
    if (!this.sys.game.device.input.touch) return;
    this.input.addPointer(3);                                     // up to 4 fingers at once
    const btn = (x, y, r, label, key, color) => {
      const c = this.add.circle(x, y, r, color, 0.75).setStrokeStyle(5, INK).setScrollFactor(0).setDepth(10).setInteractive();
      this.add.text(x, y, label, { fontFamily: 'Arial Black, sans-serif', fontSize: r * 0.8 + 'px', color: '#2b2b2b' }).setOrigin(0.5).setScrollFactor(0).setDepth(11);
      c.on('pointerdown', () => { this.touch[key] = true; });
      c.on('pointerup', () => { this.touch[key] = false; });
      c.on('pointerout', () => { this.touch[key] = false; });
    };
    btn(80, VIEW_H - 80, 52, '◀', 'left', 0xffffff);
    btn(200, VIEW_H - 80, 52, '▶', 'right', 0xffffff);
    btn(VIEW_W - 210, VIEW_H - 70, 42, '↻', 'roll', 0x9bf6ff);
    btn(VIEW_W - 85, VIEW_H - 85, 62, '▲', 'jump', 0xffd166);
  }

  // ---- 3. every frame: read the controls and move the hero ----
  update(time, deltaMs) {
    if (this.won) return;
    const dt = Math.min(deltaMs / 1000, 1 / 30);
    const h = this.hero, b = h.body, k = this.keys;
    const left = k.LEFT.isDown || k.A.isDown || this.touch.left;
    const right = k.RIGHT.isDown || k.D.isDown || this.touch.right;
    const jump = k.SPACE.isDown || k.UP.isDown || k.W.isDown || k.Z.isDown || this.touch.jump;
    const rollKey = k.X.isDown || this.touch.roll || ((k.DOWN.isDown || k.S.isDown) && (left || right));
    const onGround = b.blocked.down || b.touching.down;

    // timers
    this.hurtT -= dt; this.rollT -= dt; this.rollCoolT -= dt;
    this.coyoteT = onGround ? PHYS.coyote : this.coyoteT - dt;      // coyote time: a moment after leaving a ledge
    if (jump && !this.jumpWas) this.bufferT = PHYS.buffer; else this.bufferT -= dt;   // jump buffer
    this.jumpWas = jump;
    h.setAlpha(this.hurtT > 0 && Math.floor(time / 80) % 2 ? 0.4 : 1);

    // ---- roll ----
    if (rollKey && this.rollT <= 0 && this.rollCoolT <= 0 && onGround) {
      this.rollT = PHYS.rollTime; this.rollCoolT = PHYS.rollTime + 0.25;
      h.setVelocityX((h.flipX ? -1 : 1) * PHYS.rollV);
    }
    if (this.rollT > 0) {
      h.angle += (h.flipX ? -1 : 1) * 1100 * dt;                     // tumble!
    } else {
      h.angle = 0;
      // ---- walk / run: speed up and slow down smoothly ----
      const dir = (right ? 1 : 0) - (left ? 1 : 0);
      this.heldT = dir ? this.heldT + dt : 0;
      const top = this.heldT > PHYS.runAfter || k.SHIFT.isDown ? PHYS.run : PHYS.walk;
      let vx = b.velocity.x;
      if (dir) {
        const acc = onGround ? PHYS.accel * (Math.sign(vx) === -dir ? 1.6 : 1) : PHYS.airAccel;
        vx = Phaser.Math.Clamp(vx + dir * acc * dt, -top, top);
        h.setFlipX(dir < 0);
      } else if (onGround) {
        vx = Math.abs(vx) < PHYS.decel * dt ? 0 : vx - Math.sign(vx) * PHYS.decel * dt;
      }
      h.setVelocityX(vx);
    }

    // ---- jump (with coyote time + jump buffer) ----
    if (this.bufferT > 0 && this.coyoteT > 0) {
      h.setVelocityY(-PHYS.jumpV);
      this.bufferT = 0; this.coyoteT = 0;
      this.tweens.add({ targets: h, scaleX: 0.85, scaleY: 1.15, duration: 90, yoyo: true });
    }
    // ---- gravity: lighter while you hold jump going up (big jump), heavier if you let go (short hop) ----
    // (Phaser's world gravity is gFall; each body can add its own extra gravity on top)
    const rising = b.velocity.y < 0;
    b.setGravityY(rising ? (jump ? PHYS.gRise : PHYS.gCut) - PHYS.gFall : 0);
    // ---- leaf glide: hold jump while falling ----
    const gliding = !onGround && !rising && jump && this.rollT <= 0;
    if (gliding && b.velocity.y > PHYS.glideFall) h.setVelocityY(PHYS.glideFall);
    this.leaf.setVisible(gliding).setPosition(h.x, h.y - 34).setAngle(Math.sin(time / 120) * 8);

    // ---- critters walk back and forth (turn at walls and at the edge of a drop) ----
    this.critters.children.iterate(c => {
      if (!c || !c.active) return;
      let dir = c.getData('dir');
      const col = Math.floor((c.x + dir * 26) / T), row = Math.floor((c.y + 30) / T);
      if (c.body.blocked.left || c.body.blocked.right || !isGround(at(col, row))) dir = -dir;
      c.setData('dir', dir).setVelocityX(dir * 70).setFlipX(dir < 0);
    });
    // ---- moving platforms: turn round at the ends ----
    this.movers.children.iterate(p => {
      const { lo, hi, axis } = p.data.values, v = axis === 'x' ? 'x' : 'y', pos = p[v];
      const vel = p.body.velocity[v];
      if (pos <= lo && vel < 0) p.body.velocity[v] = -vel;
      if (pos >= hi && vel > 0) p.body.velocity[v] = -vel;
    });

    // fell in a pit: back to the last lantern
    if (h.y > MAP.length * T + 60) this.respawn(true);
  }

  // ---- things that happen ----
  collect(item) {
    item.disableBody(true, false);
    const n = item.getData('chest') ? 5 : 1;
    if (n > 1) this.treasure = true;
    this.berries += n; this.berryText.setText(String(this.berries));
    this.sparkle(item.x, item.y, 0xffd166);
    this.tweens.add({ targets: item, y: item.y - 40, alpha: 0, scale: 1.6, duration: 300, onComplete: () => item.destroy() });
  }
  boing(spring) {
    if (this.hero.body.velocity.y < 0) return;
    this.hero.setVelocityY(-PHYS.springV);
    this.tweens.add({ targets: spring, scaleY: 0.5, duration: 80, yoyo: true });
  }
  lightLantern(l) {
    if (l.getData('lit')) return;
    l.setData('lit', true).setTexture('lanternOn');
    this.start = { x: l.x, y: l.y - 10 };
    this.sparkle(l.x, l.y - 20, 0xffd166);
  }
  meetCritter(k) {
    const h = this.hero;
    if (this.rollT > 0) { this.poof(k); return; }                     // roll = boop!
    if (h.body.velocity.y > 0 && h.y < k.y - 10) {                   // landed on top: bounce
      h.setVelocityY(-620);
      this.tweens.add({ targets: k, scaleY: 0.6, duration: 90, yoyo: true });
      return;
    }
    this.hurt(k.x);
  }
  smash(b) { this.sparkle(b.x, b.y, 0xa8a29e); b.destroy(); this.cameras.main.shake(120, 0.006); }
  poof(k) { this.sparkle(k.x, k.y, 0xffffff); k.destroy(); }         // critters poof into sparkles
  sparkle(x, y, color) {
    const p = this.add.particles(x, y, 'spark', { speed: { min: 80, max: 220 }, scale: { start: 0.8, end: 0 }, lifespan: 450, tint: [color, 0xffffff], emitting: false });
    p.explode(14);
    this.time.delayedCall(600, () => p.destroy());
  }
  hurt(fromX) {
    if (this.hurtT > 0 || this.won) return;
    this.hurtT = 1.2;
    this.hearts--;
    this.heartIcons.forEach((ic, i) => ic.setAlpha(i < this.hearts ? 1 : 0.25));
    this.hero.setVelocity((this.hero.x < (fromX ?? this.hero.x + 1) ? -1 : 1) * 300, -420);   // a little knock back
    this.cameras.main.shake(150, 0.008);
    if (this.hearts <= 0) this.time.delayedCall(400, () => this.respawn(false));
  }
  // back to the last lantern (or the start). Gentle: hearts fill up again.
  respawn(pit) {
    this.hero.setPosition(this.start.x, this.start.y).setVelocity(0, 0);
    this.hearts = 3; this.hurtT = pit ? 1 : 1.5;
    this.heartIcons.forEach(ic => ic.setAlpha(1));
    this.cameras.main.flash(200, 255, 255, 255);
  }
  win() {
    if (this.won) return;
    this.won = true;
    this.hero.body.enable = false; this.leaf.setVisible(false);
    // the hero hops in and the balloon floats away
    this.tweens.add({ targets: this.hero, x: this.goal.x, y: this.goal.y + 50, duration: 400, onComplete: () => {
      this.tweens.add({ targets: [this.hero, this.goal], y: '-=500', duration: 2200, ease: 'Sine.easeIn' });
    } });
    this.time.delayedCall(1600, () => this.showWin());
  }
  showWin() {
    const cx = VIEW_W / 2, cy = VIEW_H / 2, ui = (o) => o.setScrollFactor(0).setDepth(20);
    ui(this.add.rectangle(cx, cy, 520, 330, 0x2a1e66, 0.95).setStrokeStyle(8, 0xffd166));
    ui(this.add.text(cx, cy - 110, 'You did it!', { fontFamily: 'Arial Black, sans-serif', fontSize: '50px', color: '#ffffff', stroke: '#ef476f', strokeThickness: 10 }).setOrigin(0.5));
    ui(this.add.image(cx - 50, cy - 20, 'berry').setScale(1.6));
    ui(this.add.text(cx - 20, cy - 20, String(this.berries) + (this.treasure ? '  + chest!' : ''), { fontFamily: 'Arial Black, sans-serif', fontSize: '38px', color: '#ffd166' }).setOrigin(0, 0.5));
    const again = ui(this.add.circle(cx, cy + 90, 48, 0x06d6a0).setStrokeStyle(6, INK).setInteractive());
    ui(this.add.text(cx, cy + 90, '↻', { fontSize: '50px', color: '#2b2b2b' }).setOrigin(0.5));
    again.on('pointerdown', () => this.scene.restart());
    this.input.keyboard.once('keydown-SPACE', () => this.scene.restart());
  }
}

// =====================================================================
// Start Phaser: one 960 x 540 game that scales to fit any screen.
// =====================================================================
window.__phaserGame = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: VIEW_W, height: VIEW_H,
  backgroundColor: '#8fdcff',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { y: PHYS.gFall }, debug: false } },
  input: { activePointers: 4 },
  scene: [ForestScene],
});
// test-only peek
window.__junglePhaser = () => {
  const s = window.__phaserGame.scene.getScene('forest');
  if (!s || !s.hero) return null;
  return { x: Math.round(s.hero.x), y: Math.round(s.hero.y), berries: s.berries, hearts: s.hearts, won: s.won, onGround: s.hero.body.blocked.down };
};
