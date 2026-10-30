// The coloring book's THINGS tab: things that go (car, plane, boat, train)
// and places (house). Same rules as animals.js: 400 x 400 canvas,
// class="region" = tappable, drawn back-to-front.

window.PAGES = window.PAGES || [];
window.PAGES.push(
  {
    id: 'car', group: 'things',
    name: 'Car',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M0 318 H400 V400 H0 Z"/>
      <path class="line" d="M30 362 H80 M150 362 H200 M270 362 H320"/>
      <path class="region" d="M56 92 C56 72 80 66 92 76 C100 56 132 56 140 76 C156 70 170 84 162 98 Z"/>
      <!-- body with a rounded cabin on top -->
      <path class="region" d="M40 266 C40 238 60 222 92 220 L120 220 C136 170 164 140 206 140 L250 140 C284 140 306 168 320 220 L338 222 C362 226 368 248 364 272 C360 292 346 300 326 300 L70 300 C52 300 40 288 40 266 Z"/>
      <path class="region" d="M232 158 L252 158 C276 158 290 182 300 218 L232 218 Z"/>
      <path class="region" d="M136 218 C146 182 162 158 194 158 L214 158 L214 218 Z"/>
      <path class="line" d="M224 226 V292 M238 244 H256"/>
      <ellipse class="region" cx="350" cy="246" rx="10" ry="15"/>
      <path class="region" d="M40 256 H62 C66 256 66 278 62 278 H40 Z"/>
      <!-- wheels -->
      <circle class="region" cx="114" cy="300" r="42"/>
      <circle class="region" cx="114" cy="300" r="17"/>
      <circle class="region" cx="290" cy="300" r="42"/>
      <circle class="region" cx="290" cy="300" r="17"/>
    `
  },
  {
    id: 'airplane', group: 'things',
    name: 'Airplane',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M40 330 C40 306 66 298 80 310 C88 288 122 288 132 308 C150 302 166 316 158 334 Z"/>
      <path class="region" d="M250 78 C250 58 274 52 286 62 C294 42 326 42 334 62 C350 56 364 70 356 84 Z"/>
      <!-- far wing (behind the body) -->
      <path class="region" d="M184 176 L232 176 L178 110 C172 102 156 104 158 116 Z"/>
      <!-- tail fin -->
      <path class="region" d="M78 186 L54 104 C50 92 64 84 74 94 L146 178 Z"/>
      <!-- body, nose on the right -->
      <path class="region" d="M56 222 C56 186 96 174 136 174 L300 174 C350 174 374 204 374 220 C374 244 344 260 300 260 L106 260 C76 260 56 248 56 222 Z"/>
      <path class="region" d="M314 184 C336 186 352 198 358 212 L314 212 Z"/>
      <circle class="region" cx="166" cy="206" r="14"/>
      <circle class="region" cx="210" cy="206" r="14"/>
      <circle class="region" cx="254" cy="206" r="14"/>
      <path class="region" d="M58 228 H340 C334 246 316 256 300 258 L106 258 C78 258 62 246 58 228 Z"/>
      <!-- near wing (in front) -->
      <path class="region" d="M176 236 L242 236 L178 330 C170 342 146 340 150 324 Z"/>
    `
  },
  {
    id: 'house', group: 'things',
    name: 'House',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <circle class="region" cx="62" cy="68" r="30"/>
      <path class="line" d="M62 22 V12 M108 68 H118 M95 35 L102 28 M29 35 L22 28 M95 101 L102 108 M16 68 H6"/>
      <path class="region" d="M0 336 Q200 316 400 336 V400 H0 Z"/>
      <rect class="region" x="254" y="92" width="34" height="70"/>
      <rect class="region" x="88" y="190" width="224" height="150"/>
      <path class="region" d="M66 206 L200 82 L334 206 Z"/>
      <circle class="region" cx="200" cy="160" r="20"/>
      <path class="region" d="M174 340 V276 C174 248 226 248 226 276 V340 Z"/>
      <circle cx="214" cy="304" r="5" class="ink"/>
      <rect class="region" x="108" y="222" width="50" height="46" rx="4"/>
      <rect class="region" x="242" y="222" width="50" height="46" rx="4"/>
      <path class="line" d="M133 222 V268 M108 245 H158 M267 222 V268 M242 245 H292"/>
      <path class="region" d="M174 340 H226 L250 400 H150 Z"/>
      <!-- a bush by the door -->
      <path class="region" d="M300 344 C292 318 318 304 332 316 C340 296 372 300 372 322 C390 324 392 348 376 352 Z"/>
    `
  },
  {
    id: 'boat', group: 'things',
    name: 'Sailboat',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <circle class="region" cx="338" cy="62" r="28"/>
      <path class="line" d="M338 18 V8 M382 62 H392 M369 31 L376 24 M307 31 L300 24 M369 93 L376 100"/>
      <!-- sails and mast -->
      <path class="line" d="M200 274 V78"/>
      <path class="region" d="M200 76 L246 90 L200 104 Z"/>
      <path class="region" d="M212 106 C262 150 300 206 312 254 L212 254 Z"/>
      <path class="region" d="M188 118 C158 168 120 212 96 254 L188 254 Z"/>
      <!-- hull with round windows -->
      <path class="region" d="M64 270 L336 270 C326 312 294 334 260 334 L140 334 C106 334 74 312 64 270 Z"/>
      <circle class="region" cx="146" cy="300" r="13"/>
      <circle class="region" cx="200" cy="300" r="13"/>
      <circle class="region" cx="254" cy="300" r="13"/>
      <!-- water -->
      <path class="region" d="M0 324 Q33 308 66 324 T133 324 T200 324 T266 324 T333 324 T400 324 V400 H0 Z"/>
    `
  },
  {
    id: 'train', group: 'things',
    name: 'Train',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <!-- puffs of smoke -->
      <circle class="region" cx="128" cy="96" r="18"/>
      <circle class="region" cx="160" cy="66" r="24"/>
      <circle class="region" cx="206" cy="44" r="30"/>
      <path class="region" d="M0 352 H400 V400 H0 Z"/>
      <!-- chimney -->
      <path class="region" d="M98 204 L92 136 L134 136 L128 204 Z"/>
      <rect class="region" x="80" y="118" width="66" height="20" rx="8"/>
      <!-- boiler, front, cab and roof -->
      <rect class="region" x="64" y="196" width="180" height="96" rx="22"/>
      <rect class="region" x="226" y="146" width="116" height="146" rx="10"/>
      <rect class="region" x="214" y="124" width="140" height="28" rx="12"/>
      <rect class="region" x="252" y="170" width="64" height="54" rx="8"/>
      <circle class="region" cx="52" cy="232" r="16"/>
      <path class="region" d="M64 292 L30 334 L100 334 Z"/>
      <path class="region" d="M64 284 H342 V306 H64 Z"/>
      <!-- wheels -->
      <circle class="region" cx="296" cy="318" r="40"/>
      <circle class="region" cx="296" cy="318" r="14"/>
      <circle class="region" cx="122" cy="324" r="30"/>
      <circle class="region" cx="122" cy="324" r="10"/>
      <circle class="region" cx="194" cy="324" r="30"/>
      <circle class="region" cx="194" cy="324" r="10"/>
      <path class="line" d="M122 324 H296"/>
    `
  }
);
