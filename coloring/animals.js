// The coloring book's animals.
// Each animal is an SVG drawn on a 400 x 400 canvas.
// Any shape with class="region" can be tapped and filled with color.
// Shapes WITHOUT that class (eyes, mouths, whiskers) stay as they are.
// Shapes are drawn back-to-front, so put things that sit "behind" first.
//
// ART STYLE (keep every animal consistent — see CLAUDE.md):
// - Cute "big head, round body" proportions, smooth curves (C/Q paths), no sharp corners
// - Big dark eyes with white shine dots, blush cheeks (colorable), simple smile
// - 12–25 colorable regions: body parts, markings (belly, inner ears, spots), plus a scene
// - A full background rect (class="region bg") so kids can color the sky/water too
// - A simple scene: ground/sand/branch, sun/cloud/bubbles, a leaf or flower
//
// To add an animal: copy one of these blocks, give it a new id, and draw it.

window.ANIMALS = [
  {
    id: 'cat',
    name: 'Cat',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <circle class="region" cx="345" cy="62" r="30"/>
      <path class="line" d="M345 18 V8 M389 62 H399 M376 31 L383 24 M376 93 L383 100 M314 31 L307 24"/>
      <path class="region" d="M0 330 Q200 292 400 330 V400 H0 Z"/>
      <path class="line" d="M55 322 V282"/>
      <circle class="region" cx="55" cy="262" r="11"/>
      <circle class="region" cx="55" cy="290" r="11"/>
      <circle class="region" cx="41" cy="276" r="11"/>
      <circle class="region" cx="69" cy="276" r="11"/>
      <circle class="region" cx="55" cy="276" r="9"/>
      <path class="region" d="M268 332 C342 332 364 272 344 230 C336 214 316 220 321 238 C336 276 316 306 266 306 Z"/>
      <path class="region" d="M124 342 C118 268 150 232 200 232 C250 232 282 268 276 342 Z"/>
      <path class="region" d="M164 342 C164 296 180 274 200 274 C220 274 236 296 236 342 Z"/>
      <ellipse class="region" cx="158" cy="344" rx="32" ry="17"/>
      <ellipse class="region" cx="242" cy="344" rx="32" ry="17"/>
      <path class="region" d="M104 152 C100 110 104 74 114 58 C138 66 166 82 182 102 Z"/>
      <path class="region" d="M296 152 C300 110 296 74 286 58 C262 66 234 82 218 102 Z"/>
      <path class="region" d="M124 126 C122 104 124 88 129 80 C143 86 155 94 163 104 Z"/>
      <path class="region" d="M276 126 C278 104 276 88 271 80 C257 86 245 94 237 104 Z"/>
      <ellipse class="region" cx="200" cy="172" rx="106" ry="88"/>
      <path class="region" d="M178 86 C186 104 214 104 222 86 C214 84 186 84 178 86 Z"/>
      <ellipse class="region" cx="128" cy="204" rx="17" ry="10"/>
      <ellipse class="region" cx="272" cy="204" rx="17" ry="10"/>
      <ellipse cx="160" cy="170" rx="17" ry="21" class="ink"/>
      <ellipse cx="240" cy="170" rx="17" ry="21" class="ink"/>
      <circle cx="166" cy="162" r="6" class="shine"/>
      <circle cx="246" cy="162" r="6" class="shine"/>
      <circle cx="156" cy="179" r="3" class="shine"/>
      <circle cx="236" cy="179" r="3" class="shine"/>
      <path class="region" d="M188 196 Q200 188 212 196 Q200 212 188 196 Z"/>
      <path class="line" d="M200 206 Q192 220 181 213 M200 206 Q208 220 219 213"/>
      <path class="line" d="M96 184 L56 174 M96 198 L56 202 M304 184 L344 174 M304 198 L344 202"/>
    `
  },
  {
    id: 'fish',
    name: 'Fish',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M38 400 C18 344 58 322 40 262 C72 302 52 342 76 400 Z"/>
      <path class="region" d="M350 400 C334 352 370 332 356 292 C386 322 366 362 382 400 Z"/>
      <path class="region" d="M0 368 Q100 348 200 366 Q300 384 400 360 V400 H0 Z"/>
      <circle class="region" cx="88" cy="82" r="14"/>
      <circle class="region" cx="64" cy="46" r="9"/>
      <circle class="region" cx="106" cy="38" r="6"/>
      <path class="region" d="M290 195 C320 160 348 128 366 138 C356 174 356 216 366 252 C348 262 320 232 290 205 Z"/>
      <path class="region" d="M150 132 C170 80 240 80 266 136 Z"/>
      <path class="region" d="M188 266 C198 304 232 308 242 270 Z"/>
      <ellipse class="region" cx="200" cy="200" rx="122" ry="82"/>
      <clipPath id="fish-body"><ellipse cx="200" cy="200" rx="122" ry="82"/></clipPath>
      <path class="region" clip-path="url(#fish-body)" d="M214 110 C194 160 194 240 214 290 L246 290 C226 240 226 160 246 110 Z"/>
      <path class="region" clip-path="url(#fish-body)" d="M150 110 C135 160 135 240 150 290 L174 290 C159 240 159 160 174 110 Z"/>
      <ellipse cx="200" cy="200" rx="122" ry="82" class="outline"/>
      <path class="region" d="M232 206 C258 194 280 210 270 234 C252 238 236 228 232 206 Z"/>
      <ellipse class="region" cx="118" cy="228" rx="13" ry="8"/>
      <circle class="region" cx="124" cy="184" r="23"/>
      <circle cx="128" cy="187" r="13" class="ink"/>
      <circle cx="133" cy="181" r="5" class="shine"/>
      <path class="line" d="M84 214 Q94 226 106 214"/>
    `
  },
  {
    id: 'bird',
    name: 'Bird',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M58 102 C46 82 66 66 84 74 C92 52 128 52 136 76 C156 70 170 90 158 104 Z"/>
      <circle class="region" cx="352" cy="56" r="26"/>
      <path class="line" d="M352 18 V10 M390 56 H398 M379 29 L385 23 M325 29 L319 23 M379 83 L385 89"/>
      <path class="region" d="M0 346 C120 330 280 330 400 350 L400 376 C280 358 120 358 0 374 Z"/>
      <path class="region" d="M300 342 C310 300 350 300 362 320 C346 342 320 348 300 342 Z"/>
      <path class="region" d="M72 346 C62 310 26 306 14 326 C30 346 50 352 72 346 Z"/>
      <path class="line" d="M180 300 L177 334 M220 300 L223 334 M164 336 H190 M210 336 H236"/>
      <path class="region" d="M98 228 C62 198 32 202 26 214 C46 224 62 246 98 256 Z"/>
      <path class="region" d="M98 246 C62 246 36 266 40 278 C62 272 82 272 104 262 Z"/>
      <ellipse class="region" cx="190" cy="240" rx="100" ry="74"/>
      <path class="region" d="M244 106 C238 70 262 74 262 96 C268 64 294 72 282 104 Z"/>
      <circle class="region" cx="264" cy="160" r="62"/>
      <path class="region" d="M118 226 C150 184 226 194 242 240 C200 272 140 266 118 226 Z"/>
      <path class="line" d="M148 234 Q180 216 214 240"/>
      <path class="region" d="M318 148 C336 152 352 158 362 165 C352 172 336 178 318 182 Z"/>
      <path class="line" d="M318 165 H350"/>
      <ellipse class="region" cx="290" cy="184" rx="13" ry="8"/>
      <circle cx="282" cy="150" r="12" class="ink"/>
      <circle cx="286" cy="145" r="4" class="shine"/>
    `
  }
];
