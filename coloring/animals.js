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
//   plus at most a simple ground line or a cloud. NO SUNS (Keith doesn't like them).
//
// To add a page: copy one of these blocks, give it a new id, and draw it.

window.PAGES = window.PAGES || [];
window.PAGES.push(
  {
    id: 'cat', group: 'animals',
    name: 'Cat',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
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
  },
  {
    id: 'lion', group: 'animals',
    name: 'Lion',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M0 352 Q200 330 400 352 V400 H0 Z"/>
      <!-- tail with a fluffy tip -->
      <path class="line" d="M276 316 C330 320 346 286 336 248"/>
      <circle class="region" cx="334" cy="236" r="20"/>
      <ellipse class="region" cx="200" cy="292" rx="84" ry="64"/>
      <ellipse class="region" cx="200" cy="302" rx="44" ry="40"/>
      <ellipse class="region" cx="152" cy="350" rx="34" ry="18"/>
      <ellipse class="region" cx="248" cy="350" rx="34" ry="18"/>
      <!-- big round mane, ears, head -->
      <path class="region" d="M308 165 A28 28 0 0 1 297 212 A28 28 0 0 1 267 249 A28 28 0 0 1 224 270 A28 28 0 0 1 176 270 A28 28 0 0 1 133 249 A28 28 0 0 1 103 212 A28 28 0 0 1 92 165 A28 28 0 0 1 103 118 A28 28 0 0 1 133 81 A28 28 0 0 1 176 60 A28 28 0 0 1 224 60 A28 28 0 0 1 267 81 A28 28 0 0 1 297 118 A28 28 0 0 1 308 165 Z"/>
      <circle class="region" cx="146" cy="112" r="22"/>
      <circle class="region" cx="254" cy="112" r="22"/>
      <circle class="region" cx="200" cy="168" r="72"/>
      <ellipse class="region" cx="152" cy="190" rx="14" ry="9"/>
      <ellipse class="region" cx="248" cy="190" rx="14" ry="9"/>
      <ellipse class="region" cx="182" cy="200" rx="22" ry="17"/>
      <ellipse class="region" cx="218" cy="200" rx="22" ry="17"/>
      <path d="M186 180 Q200 174 214 180 Q200 196 186 180 Z" class="ink"/>
      <circle cx="174" cy="152" r="12" class="ink"/><circle cx="178" cy="147" r="4" class="shine"/>
      <circle cx="226" cy="152" r="12" class="ink"/><circle cx="230" cy="147" r="4" class="shine"/>
      <path class="line" d="M188 222 Q200 230 212 222"/>
    `
  },
  {
    id: 'elephant', group: 'animals',
    name: 'Elephant',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M0 352 Q200 330 400 352 V400 H0 Z"/>
      <ellipse class="region" cx="200" cy="296" rx="96" ry="62"/>
      <ellipse class="region" cx="146" cy="350" rx="36" ry="18"/>
      <ellipse class="region" cx="254" cy="350" rx="36" ry="18"/>
      <!-- giant ears, with inner ears -->
      <ellipse class="region" cx="110" cy="168" rx="74" ry="84"/>
      <ellipse class="region" cx="116" cy="172" rx="46" ry="56"/>
      <ellipse class="region" cx="290" cy="168" rx="74" ry="84"/>
      <ellipse class="region" cx="284" cy="172" rx="46" ry="56"/>
      <circle class="region" cx="200" cy="166" r="82"/>
      <ellipse class="region" cx="148" cy="196" rx="14" ry="9"/>
      <ellipse class="region" cx="252" cy="196" rx="14" ry="9"/>
      <!-- curly trunk -->
      <path class="region" d="M178 200 C176 250 178 290 200 302 C222 312 246 300 246 280 C246 262 226 258 220 272 C216 282 206 282 204 270 C202 252 222 236 222 200 Z"/>
      <path class="line" d="M184 236 H198 M186 262 H200"/>
      <circle cx="170" cy="156" r="12" class="ink"/><circle cx="174" cy="151" r="4" class="shine"/>
      <circle cx="230" cy="156" r="12" class="ink"/><circle cx="234" cy="151" r="4" class="shine"/>
    `
  },
  {
    id: 'pig', group: 'animals',
    name: 'Pig',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <ellipse class="region" cx="200" cy="358" rx="170" ry="30"/>
      <path class="line" d="M286 282 C306 266 318 284 304 294 C292 302 290 280 312 270"/>
      <ellipse class="region" cx="200" cy="292" rx="92" ry="66"/>
      <ellipse class="region" cx="150" cy="350" rx="30" ry="16"/>
      <ellipse class="region" cx="250" cy="350" rx="30" ry="16"/>
      <circle class="region" cx="200" cy="172" r="86"/>
      <!-- floppy ears fold forward over the head -->
      <path class="region" d="M124 128 C106 100 102 70 114 60 C136 60 166 84 180 108 C164 126 140 136 124 128 Z"/>
      <path class="region" d="M276 128 C294 100 298 70 286 60 C264 60 234 84 220 108 C236 126 260 136 276 128 Z"/>
      <ellipse class="region" cx="138" cy="200" rx="15" ry="10"/>
      <ellipse class="region" cx="262" cy="200" rx="15" ry="10"/>
      <ellipse class="region" cx="200" cy="196" rx="44" ry="30"/>
      <ellipse cx="185" cy="196" rx="7" ry="11" class="ink"/>
      <ellipse cx="215" cy="196" rx="7" ry="11" class="ink"/>
      <circle cx="164" cy="154" r="12" class="ink"/><circle cx="168" cy="149" r="4" class="shine"/>
      <circle cx="236" cy="154" r="12" class="ink"/><circle cx="240" cy="149" r="4" class="shine"/>
      <path class="line" d="M180 238 Q200 252 220 238"/>
    `
  },
  {
    id: 'owl', group: 'animals',
    name: 'Owl',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <!-- branch -->
      <path class="region" d="M20 340 H380 C394 340 394 368 380 368 H20 C6 368 6 340 20 340 Z"/>
      <!-- ear tufts behind the body -->
      <path class="region" d="M116 128 L96 58 C120 62 148 76 168 96 Z"/>
      <path class="region" d="M284 128 L304 58 C280 62 252 76 232 96 Z"/>
      <path class="region" d="M200 72 C290 72 316 162 316 236 C316 312 268 350 200 350 C132 350 84 312 84 236 C84 162 110 72 200 72 Z"/>
      <ellipse class="region" cx="200" cy="278" rx="72" ry="64"/>
      <path class="line" d="M150 264 Q165 278 180 264 Q195 278 210 264 Q225 278 240 264 Q250 274 252 268 M166 298 Q181 312 196 298 Q211 312 226 298"/>
      <!-- wings -->
      <path class="region" d="M88 210 C56 248 62 310 112 328 C114 286 108 244 88 210 Z"/>
      <path class="region" d="M312 210 C344 248 338 310 288 328 C286 286 292 244 312 210 Z"/>
      <!-- big eyes -->
      <circle class="region" cx="156" cy="168" r="46"/>
      <circle class="region" cx="244" cy="168" r="46"/>
      <circle cx="160" cy="168" r="20" class="ink"/><circle cx="164" cy="163" r="6" class="shine"/>
      <circle cx="240" cy="168" r="20" class="ink"/><circle cx="244" cy="163" r="6" class="shine"/>
      <path class="region" d="M186 204 H214 L200 232 Z"/>
      <ellipse class="region" cx="168" cy="350" rx="24" ry="12"/>
      <ellipse class="region" cx="232" cy="350" rx="24" ry="12"/>
    `
  },
  {
    id: 'penguin', group: 'animals',
    name: 'Penguin',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M0 346 Q200 326 400 346 V400 H0 Z"/>
      <ellipse class="region" cx="164" cy="350" rx="36" ry="15"/>
      <ellipse class="region" cx="236" cy="350" rx="36" ry="15"/>
      <!-- flippers behind the body -->
      <path class="region" d="M102 180 C60 218 54 272 70 300 C94 286 108 246 110 196 Z"/>
      <path class="region" d="M298 180 C340 218 346 272 330 300 C306 286 292 246 290 196 Z"/>
      <path class="region" d="M200 54 C282 54 308 148 308 236 C308 314 266 346 200 346 C134 346 92 314 92 236 C92 148 118 54 200 54 Z"/>
      <!-- white face and tummy -->
      <path class="region" d="M200 118 C176 98 128 112 132 168 C112 220 124 318 200 326 C276 318 288 220 268 168 C272 112 224 98 200 118 Z"/>
      <ellipse class="region" cx="152" cy="204" rx="14" ry="9"/>
      <ellipse class="region" cx="248" cy="204" rx="14" ry="9"/>
      <circle cx="172" cy="168" r="12" class="ink"/><circle cx="176" cy="163" r="4" class="shine"/>
      <circle cx="228" cy="168" r="12" class="ink"/><circle cx="232" cy="163" r="4" class="shine"/>
      <path class="region" d="M180 194 Q200 182 220 194 Q200 222 180 194 Z"/>
    `
  },
  {
    id: 'duck', group: 'animals',
    name: 'Duck',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M54 108 C54 88 78 82 90 92 C98 72 130 72 138 92 C154 86 168 100 160 114 Z"/>
      <!-- tail, body, wing, head, bill -->
      <path class="region" d="M86 238 L40 204 C34 236 46 268 90 280 Z"/>
      <ellipse class="region" cx="186" cy="266" rx="118" ry="70"/>
      <path class="region" d="M118 256 C138 214 214 212 246 250 C214 294 150 294 118 256 Z"/>
      <circle class="region" cx="282" cy="164" r="60"/>
      <path class="region" d="M330 168 C356 156 384 162 386 176 C388 192 362 198 330 192 Z"/>
      <ellipse class="region" cx="296" cy="192" rx="14" ry="9"/>
      <circle cx="296" cy="150" r="12" class="ink"/><circle cx="300" cy="145" r="4" class="shine"/>
      <!-- water -->
      <path class="region" d="M0 310 Q33 294 66 310 T133 310 T200 310 T266 310 T333 310 T400 310 V400 H0 Z"/>
    `
  },
  {
    id: 'cow', group: 'animals',
    name: 'Cow',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M0 336 Q200 312 400 336 V400 H0 Z"/>
      <!-- tail with a fluffy tip -->
      <path class="line" d="M288 300 C326 292 334 262 326 240"/>
      <ellipse class="region" cx="325" cy="226" rx="14" ry="18"/>
      <!-- body with two spots, feet -->
      <ellipse class="region" cx="200" cy="288" rx="98" ry="64"/>
      <path class="region" d="M118 268 C126 240 164 242 164 270 C164 300 126 302 118 268 Z"/>
      <path class="region" d="M238 302 C240 274 278 270 284 294 C288 318 252 326 238 302 Z"/>
      <ellipse class="region" cx="150" cy="346" rx="34" ry="16"/>
      <ellipse class="region" cx="250" cy="346" rx="34" ry="16"/>
      <!-- horns and ears behind the head -->
      <path class="region" d="M140 104 C120 92 110 70 118 52 C132 68 148 76 164 82 Z"/>
      <path class="region" d="M260 104 C280 92 290 70 282 52 C268 68 252 76 236 82 Z"/>
      <ellipse class="region" cx="104" cy="134" rx="40" ry="19" transform="rotate(20 104 134)"/>
      <ellipse class="region" cx="296" cy="134" rx="40" ry="19" transform="rotate(-20 296 134)"/>
      <ellipse class="region" cx="200" cy="156" rx="88" ry="80"/>
      <path class="region" d="M216 90 C240 84 262 96 262 114 C246 124 222 114 216 90 Z"/>
      <!-- big muzzle -->
      <ellipse class="region" cx="200" cy="206" rx="62" ry="38"/>
      <ellipse cx="180" cy="200" rx="8" ry="11" class="ink"/>
      <ellipse cx="220" cy="200" rx="8" ry="11" class="ink"/>
      <path class="line" d="M182 224 Q200 236 218 224"/>
      <circle class="region" cx="200" cy="264" r="18"/>
      <ellipse class="region" cx="126" cy="182" rx="15" ry="9"/>
      <ellipse class="region" cx="274" cy="182" rx="15" ry="9"/>
      <circle cx="162" cy="140" r="13" class="ink"/><circle cx="166" cy="135" r="5" class="shine"/>
      <circle cx="238" cy="140" r="13" class="ink"/><circle cx="242" cy="135" r="5" class="shine"/>
    `
  },
  {
    id: 'frog', group: 'animals',
    name: 'Frog',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <!-- pond and a lily pad -->
      <path class="region" d="M0 300 Q50 286 100 300 T200 300 T300 300 T400 300 V400 H0 Z"/>
      <path class="region" d="M200 336 L262 306 C330 312 370 324 370 342 C370 362 296 376 200 376 C104 376 30 362 30 342 C30 322 100 306 200 306 Z"/>
      <!-- back legs, body, tummy -->
      <ellipse class="region" cx="104" cy="296" rx="56" ry="40"/>
      <ellipse class="region" cx="296" cy="296" rx="56" ry="40"/>
      <ellipse class="region" cx="70" cy="336" rx="32" ry="13"/>
      <ellipse class="region" cx="330" cy="336" rx="32" ry="13"/>
      <ellipse class="region" cx="200" cy="262" rx="100" ry="74"/>
      <ellipse class="region" cx="200" cy="282" rx="62" ry="50"/>
      <ellipse class="region" cx="152" cy="334" rx="30" ry="14"/>
      <ellipse class="region" cx="248" cy="334" rx="30" ry="14"/>
      <!-- eye bumps, wide head, eyes on top -->
      <circle class="region" cx="136" cy="112" r="46"/>
      <circle class="region" cx="264" cy="112" r="46"/>
      <ellipse class="region" cx="200" cy="172" rx="120" ry="70"/>
      <circle class="region" cx="136" cy="110" r="30"/>
      <circle class="region" cx="264" cy="110" r="30"/>
      <circle cx="138" cy="112" r="17" class="ink"/><circle cx="143" cy="106" r="6" class="shine"/>
      <circle cx="262" cy="112" r="17" class="ink"/><circle cx="267" cy="106" r="6" class="shine"/>
      <ellipse class="region" cx="118" cy="190" rx="17" ry="10"/>
      <ellipse class="region" cx="282" cy="190" rx="17" ry="10"/>
      <path class="line" d="M144 196 Q200 236 256 196"/>
    `
  },
  {
    id: 'monkey', group: 'animals',
    name: 'Monkey',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M0 340 Q200 318 400 340 V400 H0 Z"/>
      <!-- curly tail behind the body -->
      <path class="line" d="M262 312 C316 316 336 276 320 250 C306 228 278 240 288 260"/>
      <ellipse class="region" cx="200" cy="292" rx="78" ry="62"/>
      <ellipse class="region" cx="200" cy="302" rx="46" ry="42"/>
      <ellipse class="region" cx="154" cy="350" rx="32" ry="15"/>
      <ellipse class="region" cx="246" cy="350" rx="32" ry="15"/>
      <!-- round ears -->
      <circle class="region" cx="98" cy="164" r="40"/>
      <circle class="region" cx="302" cy="164" r="40"/>
      <circle class="region" cx="98" cy="164" r="21"/>
      <circle class="region" cx="302" cy="164" r="21"/>
      <circle class="region" cx="200" cy="160" r="94"/>
      <!-- light face shape: two round bumps on top -->
      <path class="region" d="M200 132 C226 96 282 108 280 164 C278 218 242 242 200 242 C158 242 122 218 120 164 C118 108 174 96 200 132 Z"/>
      <path class="line" d="M194 68 C184 52 204 42 212 56"/>
      <circle cx="172" cy="160" r="13" class="ink"/><circle cx="176" cy="155" r="5" class="shine"/>
      <circle cx="228" cy="160" r="13" class="ink"/><circle cx="232" cy="155" r="5" class="shine"/>
      <circle cx="191" cy="194" r="5" class="ink"/><circle cx="209" cy="194" r="5" class="ink"/>
      <path class="line" d="M170 210 Q200 234 230 210"/>
      <ellipse class="region" cx="144" cy="200" rx="14" ry="9"/>
      <ellipse class="region" cx="256" cy="200" rx="14" ry="9"/>
    `
  },
  {
    id: 'giraffe', group: 'animals',
    name: 'Giraffe',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M300 70 C300 52 324 46 336 58 C344 42 372 44 376 64 C392 64 394 86 378 88 H306 C294 88 290 74 300 70 Z"/>
      <path class="region" d="M0 340 Q200 320 400 340 V400 H0 Z"/>
      <!-- legs and hooves -->
      <rect class="region" x="148" y="270" width="28" height="74" rx="10"/>
      <rect class="region" x="188" y="270" width="28" height="74" rx="10"/>
      <rect class="region" x="256" y="270" width="28" height="74" rx="10"/>
      <rect class="region" x="296" y="270" width="28" height="74" rx="10"/>
      <rect class="region" x="144" y="334" width="36" height="20" rx="8"/>
      <rect class="region" x="184" y="334" width="36" height="20" rx="8"/>
      <rect class="region" x="252" y="334" width="36" height="20" rx="8"/>
      <rect class="region" x="292" y="334" width="36" height="20" rx="8"/>
      <!-- tail -->
      <path class="line" d="M326 248 C346 260 352 280 348 298"/>
      <ellipse class="region" cx="348" cy="306" rx="11" ry="15"/>
      <!-- long neck (behind the body) with a spot -->
      <path class="region" d="M122 126 L138 262 H200 L176 126 Z"/>
      <circle class="region" cx="154" cy="194" r="14"/>
      <!-- body with spots -->
      <ellipse class="region" cx="236" cy="256" rx="104" ry="52"/>
      <circle class="region" cx="262" cy="246" r="20"/>
      <circle class="region" cx="308" cy="262" r="15"/>
      <circle class="region" cx="214" cy="276" r="16"/>
      <!-- horns, ears, head, muzzle -->
      <path class="line" d="M130 66 V40 M170 66 V40"/>
      <circle class="region" cx="130" cy="36" r="11"/>
      <circle class="region" cx="170" cy="36" r="11"/>
      <ellipse class="region" cx="92" cy="86" rx="28" ry="13" transform="rotate(-20 92 86)"/>
      <ellipse class="region" cx="208" cy="86" rx="28" ry="13" transform="rotate(20 208 86)"/>
      <ellipse class="region" cx="150" cy="100" rx="58" ry="48"/>
      <ellipse class="region" cx="150" cy="140" rx="44" ry="28"/>
      <circle cx="136" cy="136" r="5" class="ink"/><circle cx="164" cy="136" r="5" class="ink"/>
      <path class="line" d="M136 152 Q150 160 164 152"/>
      <circle cx="128" cy="92" r="11" class="ink"/><circle cx="131" cy="88" r="4" class="shine"/>
      <circle cx="172" cy="92" r="11" class="ink"/><circle cx="175" cy="88" r="4" class="shine"/>
      <ellipse class="region" cx="113" cy="116" rx="11" ry="7"/>
      <ellipse class="region" cx="187" cy="116" rx="11" ry="7"/>
    `
  },
  {
    id: 'snail', group: 'animals',
    name: 'Snail',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M0 340 Q200 322 400 340 V400 H0 Z"/>
      <!-- long foot -->
      <path class="region" d="M56 318 C56 296 90 290 120 290 H334 C358 290 372 304 372 320 C372 336 352 342 330 342 H80 C62 342 56 334 56 318 Z"/>
      <!-- shell: three rings -->
      <circle class="region" cx="254" cy="204" r="104"/>
      <circle class="region" cx="246" cy="212" r="70"/>
      <circle class="region" cx="240" cy="220" r="36"/>
      <!-- neck and head -->
      <path class="region" d="M72 320 C62 270 74 230 104 222 C134 216 156 250 150 320 Z"/>
      <path class="line" d="M94 160 L76 98 M130 158 L146 96"/>
      <circle class="region" cx="74" cy="88" r="14"/>
      <circle class="region" cx="148" cy="86" r="14"/>
      <circle class="region" cx="112" cy="196" r="54"/>
      <circle cx="94" cy="188" r="11" class="ink"/><circle cx="97" cy="184" r="4" class="shine"/>
      <circle cx="132" cy="188" r="11" class="ink"/><circle cx="135" cy="184" r="4" class="shine"/>
      <ellipse class="region" cx="80" cy="214" rx="11" ry="7"/>
      <ellipse class="region" cx="146" cy="214" rx="11" ry="7"/>
      <path class="line" d="M100 218 Q113 230 126 218"/>
    `
  },
  {
    id: 'whale', group: 'animals',
    name: 'Whale',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <!-- water spout: two curls and three drops -->
      <path class="line" d="M178 106 C176 82 160 72 144 74 M178 106 C180 82 196 72 212 74"/>
      <circle class="region" cx="132" cy="64" r="14"/>
      <circle class="region" cx="178" cy="46" r="16"/>
      <circle class="region" cx="224" cy="64" r="14"/>
      <!-- tail up in the air -->
      <path class="region" d="M296 206 C316 190 326 168 326 146 L350 150 C350 180 340 210 318 232 Z"/>
      <ellipse class="region" cx="304" cy="128" rx="38" ry="17" transform="rotate(-30 304 128)"/>
      <ellipse class="region" cx="352" cy="138" rx="36" ry="17" transform="rotate(30 352 138)"/>
      <!-- body, tummy, flipper -->
      <path class="region" d="M40 236 C40 150 120 108 200 108 C282 108 326 168 330 220 C334 272 294 304 214 304 H104 C64 304 40 282 40 236 Z"/>
      <path class="region" d="M54 268 C110 290 200 292 296 276 C278 298 250 304 214 304 H104 C80 304 62 292 54 268 Z"/>
      <ellipse class="region" cx="210" cy="262" rx="36" ry="17" transform="rotate(25 210 262)"/>
      <circle cx="124" cy="200" r="14" class="ink"/><circle cx="128" cy="194" r="5" class="shine"/>
      <ellipse class="region" cx="100" cy="234" rx="16" ry="10"/>
      <path class="line" d="M62 238 Q78 256 98 252"/>
      <!-- waves in front -->
      <path class="region" d="M0 322 Q50 306 100 322 T200 322 T300 322 T400 322 V400 H0 Z"/>
    `
  }
);
