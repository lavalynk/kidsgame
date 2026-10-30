// The coloring book's FRUIT tab. Same rules as animals.js:
// 400 x 400 canvas, class="region" = tappable, drawn back-to-front.
// Every fruit gets a happy face (eyes with shine dots, smile, blush cheeks).

window.PAGES = window.PAGES || [];
window.PAGES.push(
  {
    id: 'apple', group: 'fruit',
    name: 'Apple',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <ellipse class="region" cx="200" cy="350" rx="130" ry="22"/>
      <path class="region" d="M193 126 C190 96 196 72 210 54 L226 64 C212 80 208 100 209 126 Z"/>
      <path class="region" d="M200 124 C148 84 66 100 66 200 C66 292 130 352 200 336 C270 352 334 292 334 200 C334 100 252 84 200 124 Z"/>
      <path class="region" d="M216 78 C232 36 294 36 306 52 C286 90 242 96 216 78 Z"/>
      <path class="line" d="M226 74 Q262 60 296 54"/>
      <path class="region" d="M104 168 C110 144 128 130 146 128 C140 148 128 168 110 186 Z"/>
      <ellipse class="region" cx="140" cy="250" rx="18" ry="11"/>
      <ellipse class="region" cx="260" cy="250" rx="18" ry="11"/>
      <circle cx="166" cy="214" r="14" class="ink"/><circle cx="171" cy="208" r="5" class="shine"/>
      <circle cx="234" cy="214" r="14" class="ink"/><circle cx="239" cy="208" r="5" class="shine"/>
      <path class="line" d="M176 254 Q200 278 224 254"/>
    `
  },
  {
    id: 'banana', group: 'fruit',
    name: 'Banana',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <ellipse class="region" cx="200" cy="356" rx="150" ry="20"/>
      <!-- stem end, then the big curved banana, then its dark tip -->
      <path class="region" d="M306 150 L318 96 C320 84 340 84 340 96 L334 150 Z"/>
      <path class="region" d="M62 150 C50 280 140 336 210 332 C290 326 346 250 336 140 C322 134 308 136 304 146 C300 218 262 250 200 250 C140 250 102 214 88 150 C84 140 66 138 62 150 Z"/>
      <ellipse class="region" cx="74" cy="148" rx="14" ry="11"/>
      <ellipse class="region" cx="152" cy="296" rx="15" ry="9"/>
      <ellipse class="region" cx="250" cy="296" rx="15" ry="9"/>
      <circle cx="176" cy="282" r="12" class="ink"/><circle cx="180" cy="277" r="4" class="shine"/>
      <circle cx="226" cy="282" r="12" class="ink"/><circle cx="230" cy="277" r="4" class="shine"/>
      <path class="line" d="M186 304 Q202 320 218 304"/>
    `
  },
  {
    id: 'strawberry', group: 'fruit',
    name: 'Strawberry',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <ellipse class="region" cx="200" cy="360" rx="110" ry="20"/>
      <path class="region" d="M200 118 C286 106 346 150 326 226 C308 294 244 352 200 356 C156 352 92 294 74 226 C54 150 114 106 200 118 Z"/>
      <!-- leafy top and stem -->
      <path class="region" d="M193 112 C192 88 198 70 210 58 L224 66 C212 80 208 94 209 112 Z"/>
      <path class="region" d="M124 132 C134 100 172 96 200 112 C228 96 266 100 276 132 C252 150 226 142 200 146 C174 142 148 150 124 132 Z"/>
      <!-- seeds -->
      <g class="ink">
        <ellipse cx="128" cy="186" rx="5" ry="8"/><ellipse cx="272" cy="186" rx="5" ry="8"/>
        <ellipse cx="110" cy="236" rx="5" ry="8"/><ellipse cx="290" cy="236" rx="5" ry="8"/>
        <ellipse cx="150" cy="300" rx="5" ry="8"/><ellipse cx="250" cy="300" rx="5" ry="8"/>
        <ellipse cx="200" cy="322" rx="5" ry="8"/><ellipse cx="200" cy="168" rx="5" ry="8"/>
      </g>
      <ellipse class="region" cx="146" cy="250" rx="17" ry="10"/>
      <ellipse class="region" cx="254" cy="250" rx="17" ry="10"/>
      <circle cx="170" cy="214" r="13" class="ink"/><circle cx="175" cy="208" r="5" class="shine"/>
      <circle cx="230" cy="214" r="13" class="ink"/><circle cx="235" cy="208" r="5" class="shine"/>
      <path class="line" d="M180 252 Q200 274 220 252"/>
    `
  },
  {
    id: 'pear', group: 'fruit',
    name: 'Pear',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <ellipse class="region" cx="200" cy="360" rx="120" ry="20"/>
      <path class="region" d="M193 96 C191 74 196 58 206 46 L220 54 C212 66 208 80 209 96 Z"/>
      <path class="region" d="M200 88 C236 88 246 128 250 158 C256 192 322 222 318 290 C314 348 254 360 200 358 C146 360 86 348 82 290 C78 222 144 192 150 158 C154 128 164 88 200 88 Z"/>
      <path class="region" d="M214 70 C232 38 284 40 292 56 C272 82 236 86 214 70 Z"/>
      <path class="line" d="M224 68 Q256 56 284 56"/>
      <ellipse class="region" cx="144" cy="296" rx="17" ry="10"/>
      <ellipse class="region" cx="256" cy="296" rx="17" ry="10"/>
      <circle cx="170" cy="262" r="13" class="ink"/><circle cx="175" cy="256" r="5" class="shine"/>
      <circle cx="230" cy="262" r="13" class="ink"/><circle cx="235" cy="256" r="5" class="shine"/>
      <path class="line" d="M180 298 Q200 320 220 298"/>
    `
  },
  {
    id: 'cherries', group: 'fruit',
    name: 'Cherries',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <ellipse class="region" cx="200" cy="360" rx="150" ry="20"/>
      <!-- stems meet at the top under a leaf -->
      <path class="line" d="M140 222 C150 160 180 110 214 74 M262 232 C254 170 236 120 214 74"/>
      <path class="region" d="M214 76 C234 40 296 40 312 60 C290 96 240 100 214 76 Z"/>
      <path class="line" d="M224 74 Q264 60 302 60"/>
      <circle class="region" cx="136" cy="284" r="70"/>
      <circle class="region" cx="268" cy="292" r="66"/>
      <path class="region" d="M92 262 C96 244 108 232 122 228 C120 244 112 258 100 270 Z"/>
      <path class="region" d="M226 270 C230 252 242 240 256 236 C254 252 246 266 234 278 Z"/>
      <circle cx="118" cy="284" r="10" class="ink"/><circle cx="121" cy="280" r="3.5" class="shine"/>
      <circle cx="156" cy="284" r="10" class="ink"/><circle cx="159" cy="280" r="3.5" class="shine"/>
      <path class="line" d="M124 310 Q137 322 150 310"/>
      <circle cx="252" cy="294" r="10" class="ink"/><circle cx="255" cy="290" r="3.5" class="shine"/>
      <circle cx="288" cy="294" r="10" class="ink"/><circle cx="291" cy="290" r="3.5" class="shine"/>
      <path class="line" d="M258 318 Q270 330 282 318"/>
    `
  },
  {
    id: 'orange', group: 'fruit',
    name: 'Orange',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <ellipse class="region" cx="200" cy="360" rx="130" ry="20"/>
      <circle class="region" cx="200" cy="216" r="136"/>
      <path class="region" d="M206 82 C222 44 280 40 294 56 C276 94 232 100 206 82 Z"/>
      <path class="line" d="M216 80 Q250 64 286 58"/>
      <circle class="region" cx="198" cy="86" r="12"/>
      <path class="region" d="M100 166 C108 136 130 116 154 110 C146 134 130 156 110 176 Z"/>
      <g class="ink">
        <circle cx="290" cy="170" r="4"/><circle cx="306" cy="200" r="4"/><circle cx="286" cy="300" r="4"/>
        <circle cx="110" cy="290" r="4"/><circle cx="130" cy="320" r="4"/><circle cx="270" cy="324" r="4"/>
      </g>
      <ellipse class="region" cx="142" cy="254" rx="18" ry="11"/>
      <ellipse class="region" cx="258" cy="254" rx="18" ry="11"/>
      <circle cx="168" cy="216" r="14" class="ink"/><circle cx="173" cy="210" r="5" class="shine"/>
      <circle cx="232" cy="216" r="14" class="ink"/><circle cx="237" cy="210" r="5" class="shine"/>
      <path class="line" d="M176 256 Q200 280 224 256"/>
    `
  },
  {
    id: 'watermelon', group: 'fruit',
    name: 'Watermelon',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <ellipse class="region" cx="200" cy="330" rx="150" ry="22"/>
      <!-- a big slice: green rind, white band, red middle -->
      <path class="region" d="M40 140 H360 C360 240 290 320 200 320 C110 320 40 240 40 140 Z"/>
      <path class="region" d="M64 140 H336 C336 226 276 296 200 296 C124 296 64 226 64 140 Z"/>
      <path class="region" d="M84 140 H316 C316 214 264 276 200 276 C136 276 84 214 84 140 Z"/>
      <g class="ink">
        <path d="M122 172 q6 -12 12 0 q-6 12 -12 0 Z"/><path d="M266 172 q6 -12 12 0 q-6 12 -12 0 Z"/>
        <path d="M150 240 q6 -12 12 0 q-6 12 -12 0 Z"/><path d="M238 240 q6 -12 12 0 q-6 12 -12 0 Z"/>
        <path d="M194 256 q6 -12 12 0 q-6 12 -12 0 Z"/>
      </g>
      <ellipse class="region" cx="146" cy="206" rx="16" ry="10"/>
      <ellipse class="region" cx="254" cy="206" rx="16" ry="10"/>
      <circle cx="172" cy="176" r="12" class="ink"/><circle cx="176" cy="171" r="4" class="shine"/>
      <circle cx="228" cy="176" r="12" class="ink"/><circle cx="232" cy="171" r="4" class="shine"/>
      <path class="line" d="M182 208 Q200 228 218 208"/>
      <!-- a little sun -->
      <circle class="region" cx="340" cy="56" r="28"/>
      <path class="line" d="M340 12 V4 M384 56 H394 M371 25 L378 18 M309 25 L302 18 M371 87 L378 94"/>
    `
  }
);
