// The coloring book's ANIMALS tab. (fruit.js and things.js hold the other two tabs.)
// Every page is an SVG drawn on a 400 x 400 canvas.
// Any shape with class="region" can be tapped and filled with color.
// Shapes WITHOUT that class (eyes, mouths, whiskers) stay as they are.
// Shapes are drawn back-to-front, so put things that sit "behind" first.
//
// ART STYLE (Keith's rules - keep every page consistent, see CLAUDE.md):
// "simple coloring page for toddlers, cute cartoon, thick bold black outlines,
//  plain white background, no shading, no gray, no color, large simple shapes"
// - The subject is BIG and fills most of the page; smooth curves (C/Q paths)
// - Big dark eyes with white shine dots, blush cheeks (colorable), simple smile
// - 10-25 colorable regions, none smaller than a fingertip (~20px across)
// - A full background rect (class="region bg") so kids can color the sky too,
//   plus at most a simple ground line, sun or cloud
//
// To add a page: copy one of these blocks, give it a new id, and draw it.

window.PAGES = window.PAGES || [];
window.PAGES.push(
  {
    id: 'cat', group: 'animals',
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
    id: 'fish', group: 'animals',
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
    id: 'bird', group: 'animals',
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
  },
  {
    id: 'dog', group: 'animals',
    name: 'Dog',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M0 352 Q200 330 400 352 V400 H0 Z"/>
      <!-- wagging tail (behind the body) -->
      <path class="region" d="M270 300 C318 296 336 252 326 222 C346 232 356 280 338 306 C324 326 292 328 270 318 Z"/>
      <ellipse class="region" cx="200" cy="288" rx="88" ry="70"/>
      <ellipse class="region" cx="200" cy="298" rx="48" ry="46"/>
      <ellipse class="region" cx="160" cy="350" rx="34" ry="18"/>
      <ellipse class="region" cx="240" cy="350" rx="34" ry="18"/>
      <!-- head -->
      <circle class="region" cx="200" cy="165" r="82"/>
      <ellipse class="region" cx="232" cy="146" rx="30" ry="26"/>
      <!-- floppy ears -->
      <path class="region" d="M138 104 C96 102 78 170 94 218 C106 242 136 230 142 196 C146 166 152 128 138 104 Z"/>
      <path class="region" d="M262 104 C304 102 322 170 306 218 C294 242 264 230 258 196 C254 166 248 128 262 104 Z"/>
      <ellipse class="region" cx="200" cy="200" rx="44" ry="32"/>
      <ellipse class="region" cx="152" cy="196" rx="14" ry="9"/>
      <ellipse class="region" cx="248" cy="196" rx="14" ry="9"/>
      <path class="region" d="M190 214 C188 244 212 244 210 214 Z"/>
      <ellipse cx="200" cy="184" rx="17" ry="12" class="ink"/>
      <path class="line" d="M200 194 V208 M180 210 Q190 220 200 208 Q210 220 220 210"/>
      <circle cx="170" cy="150" r="12" class="ink"/><circle cx="174" cy="145" r="4" class="shine"/>
      <circle cx="232" cy="150" r="12" class="ink"/><circle cx="236" cy="145" r="4" class="shine"/>
      <!-- collar -->
      <path class="region" d="M140 254 Q200 284 260 254 L262 272 Q200 304 138 272 Z"/>
    `
  },
  {
    id: 'bunny', group: 'animals',
    name: 'Bunny',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M0 352 Q200 330 400 352 V400 H0 Z"/>
      <!-- long ears, with inner ears -->
      <path class="region" d="M162 140 C132 80 136 22 164 20 C192 18 200 80 190 140 Z"/>
      <path class="region" d="M166 120 C150 80 152 44 165 42 C178 40 182 80 178 120 Z"/>
      <path class="region" d="M210 140 C200 80 208 18 236 20 C264 22 268 80 238 140 Z"/>
      <path class="region" d="M222 120 C218 80 222 40 235 42 C248 44 250 80 234 120 Z"/>
      <!-- fluffy tail behind the body -->
      <circle class="region" cx="282" cy="318" r="26"/>
      <ellipse class="region" cx="200" cy="292" rx="84" ry="68"/>
      <ellipse class="region" cx="200" cy="302" rx="46" ry="42"/>
      <ellipse class="region" cx="150" cy="350" rx="38" ry="18"/>
      <ellipse class="region" cx="250" cy="350" rx="38" ry="18"/>
      <!-- head -->
      <circle class="region" cx="200" cy="182" r="74"/>
      <ellipse class="region" cx="152" cy="204" rx="14" ry="9"/>
      <ellipse class="region" cx="248" cy="204" rx="14" ry="9"/>
      <circle cx="172" cy="172" r="12" class="ink"/><circle cx="176" cy="167" r="4" class="shine"/>
      <circle cx="228" cy="172" r="12" class="ink"/><circle cx="232" cy="167" r="4" class="shine"/>
      <path d="M190 196 Q200 190 210 196 Q200 208 190 196 Z" class="ink"/>
      <path class="line" d="M200 204 V212 M186 216 Q193 224 200 212 Q207 224 214 216"/>
      <path class="line" d="M140 196 L112 190 M140 206 L114 212 M260 196 L288 190 M260 206 L286 212"/>
      <!-- a carrot to munch on -->
      <path class="region" d="M318 360 C326 320 336 290 350 268 C362 262 372 270 368 284 C360 310 344 336 318 360 Z"/>
      <path class="region" d="M352 270 C344 244 350 232 360 234 C362 248 362 258 360 266 Z"/>
      <path class="region" d="M360 268 C372 246 384 244 390 252 C380 262 372 268 364 274 Z"/>
    `
  },
  {
    id: 'turtle', group: 'animals',
    name: 'Turtle',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M0 336 Q200 314 400 336 V400 H0 Z"/>
      <g transform="translate(-22 0)">
      <!-- tail, legs and head peek out from under the shell -->
      <path class="region" d="M74 262 C50 268 36 280 40 290 C56 292 72 286 86 280 Z"/>
      <ellipse class="region" cx="118" cy="300" rx="30" ry="34"/>
      <ellipse class="region" cx="270" cy="300" rx="30" ry="34"/>
      <path class="region" d="M296 250 C300 220 310 196 340 190 C374 184 394 206 390 236 C386 262 362 272 336 268 C318 266 304 262 296 250 Z"/>
      <circle cx="354" cy="218" r="11" class="ink"/><circle cx="357" cy="214" r="4" class="shine"/>
      <path class="line" d="M342 246 Q358 256 374 244"/>
      <ellipse class="region" cx="376" cy="234" rx="9" ry="7"/>
      <!-- shell: dome, a big middle patch, two side patches, and the rim -->
      <path class="region" d="M70 264 C70 126 320 126 320 264 Z"/>
      <path class="region" d="M160 172 L230 172 L256 216 L230 254 L160 254 L134 216 Z"/>
      <path class="region" d="M96 250 C96 222 104 200 118 188 C126 204 126 236 112 252 Z"/>
      <path class="region" d="M294 250 C294 222 286 200 272 188 C264 204 264 236 278 252 Z"/>
      <path class="region" d="M58 264 H332 C344 264 344 290 332 290 H58 C46 290 46 264 58 264 Z"/>
      </g>
    `
  }
);
