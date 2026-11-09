// The coloring book's FRUIT tab (fruit and veggies). Same rules as animals.js:
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
    `
  },
  {
    id: 'grapes', group: 'fruit',
    name: 'Grapes',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <ellipse class="region" cx="200" cy="358" rx="120" ry="20"/>
      <path class="region" d="M193 112 C191 88 197 70 208 58 L222 66 C212 78 208 94 209 112 Z"/>
      <path class="region" d="M214 74 C238 34 300 40 308 60 C288 92 242 94 214 74 Z"/>
      <path class="line" d="M224 72 Q262 58 300 60"/>
      <circle class="region" cx="200" cy="288" r="44"/>
      <circle class="region" cx="158" cy="222" r="44"/>
      <circle class="region" cx="242" cy="222" r="44"/>
      <circle class="region" cx="116" cy="150" r="44"/>
      <circle class="region" cx="200" cy="150" r="44"/>
      <circle class="region" cx="284" cy="150" r="44"/>
      
      <circle cx="184" cy="146" r="10" class="ink"/><circle cx="188" cy="141" r="3" class="shine"/>
      <circle cx="216" cy="146" r="10" class="ink"/><circle cx="220" cy="141" r="3" class="shine"/>
      <path class="line" d="M188 166 Q200 178 212 166"/>
    `
  },
  {
    id: 'pineapple', group: 'fruit',
    name: 'Pineapple',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <ellipse class="region" cx="200" cy="362" rx="120" ry="20"/>
      <!-- spiky leaves on top -->
      <path class="region" d="M170 150 C140 110 110 92 86 96 C104 120 130 144 160 162 Z"/>
      <path class="region" d="M230 150 C260 110 290 92 314 96 C296 120 270 144 240 162 Z"/>
      <path class="region" d="M178 150 C160 104 160 64 176 40 C194 70 204 110 204 150 Z"/>
      <path class="region" d="M222 150 C240 104 240 64 224 40 C206 70 196 110 196 150 Z"/>
      <ellipse class="region" cx="200" cy="254" rx="104" ry="112"/>
      <!-- the bumpy skin: little v marks -->
      <path class="line" d="M132 186 l8 8 l8 -8 M252 186 l8 8 l8 -8 M192 166 l8 8 l8 -8
                            M112 246 l8 8 l8 -8 M272 246 l8 8 l8 -8
                            M136 316 l8 8 l8 -8 M248 316 l8 8 l8 -8 M192 336 l8 8 l8 -8"/>
      <ellipse class="region" cx="144" cy="270" rx="16" ry="10"/>
      <ellipse class="region" cx="256" cy="270" rx="16" ry="10"/>
      <circle cx="170" cy="236" r="13" class="ink"/><circle cx="174" cy="231" r="4" class="shine"/>
      <circle cx="230" cy="236" r="13" class="ink"/><circle cx="234" cy="231" r="4" class="shine"/>
      <path class="line" d="M180 272 Q200 294 220 272"/>
    `
  },
  {
    id: 'lemon', group: 'fruit',
    name: 'Lemon',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <ellipse class="region" cx="200" cy="350" rx="140" ry="20"/>
      <path class="region" d="M44 214 C34 204 42 190 58 194 C88 132 146 108 200 108 C254 108 312 132 342 194 C358 190 366 204 356 214 C366 224 358 238 342 234 C312 296 254 320 200 320 C146 320 88 296 58 234 C42 238 34 224 44 214 Z"/>
      <path class="region" d="M206 112 C220 72 276 64 292 80 C276 116 232 124 206 112 Z"/>
      <path class="line" d="M216 110 Q250 92 284 82"/>
      <path class="region" d="M96 180 C104 158 122 142 142 136 C136 158 122 176 104 192 Z"/>
      <ellipse class="region" cx="144" cy="230" rx="16" ry="10"/>
      <ellipse class="region" cx="256" cy="230" rx="16" ry="10"/>
      <circle cx="170" cy="196" r="13" class="ink"/><circle cx="174" cy="191" r="4" class="shine"/>
      <circle cx="230" cy="196" r="13" class="ink"/><circle cx="234" cy="191" r="4" class="shine"/>
      <path class="line" d="M180 232 Q200 254 220 232"/>
    `
  },
  {
    id: 'carrot', group: 'fruit',
    name: 'Carrot',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <ellipse class="region" cx="200" cy="364" rx="110" ry="18"/>
      <!-- leafy top -->
      <path class="region" d="M168 124 C142 78 146 34 166 30 C186 52 192 90 190 124 Z"/>
      <path class="region" d="M196 120 C192 66 210 26 234 28 C240 62 230 96 214 124 Z"/>
      <path class="region" d="M226 128 C244 88 276 68 296 76 C292 104 268 124 240 136 Z"/>
      <path class="region" d="M128 116 C172 98 252 104 278 132 C294 152 260 250 214 344 C204 364 184 362 180 344 C160 260 112 180 110 144 C110 130 116 122 128 116 Z"/>
      <path class="line" d="M150 252 H170 M232 262 H250 M184 312 H200"/>
      <ellipse class="region" cx="150" cy="194" rx="16" ry="10"/>
      <ellipse class="region" cx="242" cy="194" rx="16" ry="10"/>
      <circle cx="170" cy="160" r="12" class="ink"/><circle cx="174" cy="155" r="4" class="shine"/>
      <circle cx="222" cy="160" r="12" class="ink"/><circle cx="226" cy="155" r="4" class="shine"/>
      <path class="line" d="M176 196 Q196 218 216 196"/>
    `
  },
  {
    id: 'corn', group: 'fruit',
    name: 'Corn',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <ellipse class="region" cx="200" cy="366" rx="110" ry="18"/>
      <!-- the cob, with kernel lines at the top -->
      <path class="region" d="M200 46 C252 46 274 130 274 214 C274 300 244 346 200 346 C156 346 126 300 126 214 C126 130 148 46 200 46 Z"/>
      <path class="line" d="M174 60 C166 90 162 120 162 150 M226 60 C234 90 238 120 238 150 M200 50 V150
                            M146 100 Q200 116 254 100 M136 140 Q200 158 264 140"/>
      <!-- green husk leaves wrap the bottom -->
      <path class="region" d="M200 352 C126 346 82 290 84 196 C114 250 150 300 214 336 Z"/>
      <path class="region" d="M200 352 C274 346 318 290 316 196 C286 250 250 300 186 336 Z"/>
      <ellipse class="region" cx="150" cy="230" rx="16" ry="10"/>
      <ellipse class="region" cx="250" cy="230" rx="16" ry="10"/>
      <circle cx="172" cy="196" r="12" class="ink"/><circle cx="176" cy="191" r="4" class="shine"/>
      <circle cx="228" cy="196" r="12" class="ink"/><circle cx="232" cy="191" r="4" class="shine"/>
      <path class="line" d="M180 232 Q200 254 220 232"/>
    `
  },
  {
    id: 'broccoli', group: 'fruit',
    name: 'Broccoli',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <ellipse class="region" cx="200" cy="364" rx="110" ry="18"/>
      <!-- stalk -->
      <path class="region" d="M164 360 C172 316 174 276 166 230 L234 230 C226 276 228 316 236 360 Z"/>
      <path class="line" d="M200 300 L184 270 M200 300 L218 268"/>
      <!-- fluffy top -->
      <path class="region" d="M200 77 A38 38 0 0 1 257 98 A38 38 0 0 1 287 150 A38 38 0 0 1 276 209 A38 38 0 0 1 230 248 A38 38 0 0 1 170 248 A38 38 0 0 1 124 209 A38 38 0 0 1 113 150 A38 38 0 0 1 143 98 A38 38 0 0 1 200 77 Z"/>
      <path class="line" d="M140 130 Q152 118 164 128 M236 126 Q248 116 260 128 M176 96 Q188 88 198 96"/>
      <ellipse class="region" cx="150" cy="194" rx="16" ry="10"/>
      <ellipse class="region" cx="250" cy="194" rx="16" ry="10"/>
      <circle cx="172" cy="160" r="12" class="ink"/><circle cx="176" cy="155" r="4" class="shine"/>
      <circle cx="228" cy="160" r="12" class="ink"/><circle cx="232" cy="155" r="4" class="shine"/>
      <path class="line" d="M180 196 Q200 218 220 196"/>
    `
  },
  {
    id: 'peach', group: 'fruit',
    name: 'Peach',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <ellipse class="region" cx="200" cy="354" rx="130" ry="20"/>
      <path class="region" d="M194 114 C192 94 196 80 204 68 L218 76 C210 88 208 100 208 116 Z"/>
      <path class="region" d="M208 92 C230 52 286 50 302 66 C282 104 236 110 208 92 Z"/>
      <path class="region" d="M194 94 C172 66 124 66 110 80 C128 110 170 114 194 94 Z"/>
      <path class="region" d="M200 118 C140 96 66 130 66 222 C66 302 132 342 200 342 C268 342 334 302 334 222 C334 130 260 96 200 118 Z"/>
      <path class="line" d="M200 122 C190 140 186 156 186 174"/>
      <path class="region" d="M266 150 C290 160 304 182 306 206 C288 196 274 178 266 150 Z"/>
      <circle cx="160" cy="212" r="14" class="ink"/><circle cx="165" cy="207" r="4" class="shine"/>
      <circle cx="240" cy="212" r="14" class="ink"/><circle cx="245" cy="207" r="4" class="shine"/>
      <ellipse class="region" cx="138" cy="250" rx="17" ry="10"/>
      <ellipse class="region" cx="262" cy="250" rx="17" ry="10"/>
      <path class="line" d="M174 248 Q200 274 226 248"/>
    `
  },
  {
    id: 'kiwi', group: 'fruit',
    name: 'Kiwi',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <ellipse class="region" cx="200" cy="360" rx="140" ry="20"/>
      <!-- a kiwi cut in half: fuzzy skin, green with seeds, middle with a face -->
      <ellipse class="region" cx="200" cy="214" rx="168" ry="150"/>
      <ellipse class="region" cx="200" cy="214" rx="136" ry="120"/>
      <ellipse class="region" cx="200" cy="214" rx="80" ry="66"/>
      <ellipse cx="302" cy="214" rx="5" ry="10" class="ink" transform="rotate(90 302 214)"/><ellipse cx="294" cy="248" rx="5" ry="10" class="ink" transform="rotate(112 294 248)"/><ellipse cx="272" cy="276" rx="5" ry="10" class="ink" transform="rotate(135 272 276)"/><ellipse cx="239" cy="295" rx="5" ry="10" class="ink" transform="rotate(158 239 295)"/><ellipse cx="200" cy="302" rx="5" ry="10" class="ink" transform="rotate(180 200 302)"/><ellipse cx="161" cy="295" rx="5" ry="10" class="ink" transform="rotate(202 161 295)"/><ellipse cx="128" cy="276" rx="5" ry="10" class="ink" transform="rotate(225 128 276)"/><ellipse cx="106" cy="248" rx="5" ry="10" class="ink" transform="rotate(248 106 248)"/><ellipse cx="98" cy="214" rx="5" ry="10" class="ink" transform="rotate(270 98 214)"/><ellipse cx="106" cy="180" rx="5" ry="10" class="ink" transform="rotate(292 106 180)"/><ellipse cx="128" cy="152" rx="5" ry="10" class="ink" transform="rotate(315 128 152)"/><ellipse cx="161" cy="133" rx="5" ry="10" class="ink" transform="rotate(338 161 133)"/><ellipse cx="200" cy="126" rx="5" ry="10" class="ink" transform="rotate(360 200 126)"/><ellipse cx="239" cy="133" rx="5" ry="10" class="ink" transform="rotate(382 239 133)"/><ellipse cx="272" cy="152" rx="5" ry="10" class="ink" transform="rotate(405 272 152)"/><ellipse cx="294" cy="180" rx="5" ry="10" class="ink" transform="rotate(428 294 180)"/>
      <circle cx="176" cy="200" r="12" class="ink"/><circle cx="181" cy="195" r="4" class="shine"/>
      <circle cx="224" cy="200" r="12" class="ink"/><circle cx="229" cy="195" r="4" class="shine"/>
      <ellipse class="region" cx="160" cy="226" rx="17" ry="10"/>
      <ellipse class="region" cx="240" cy="226" rx="17" ry="10"/>
      <path class="line" d="M186 222 Q200 236 214 222"/>
    `
  },
  {
    id: 'avocado', group: 'fruit',
    name: 'Avocado',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <ellipse class="region" cx="200" cy="370" rx="130" ry="18"/>
      <rect class="region" x="190" y="30" width="20" height="34" rx="8"/>
      <path class="region" d="M200 52 C250 52 270 110 286 160 C306 220 330 260 322 300 C312 350 260 368 200 368 C140 368 88 350 78 300 C70 260 94 220 114 160 C130 110 150 52 200 52 Z"/>
      <path class="region" d="M200 86 C241 86 257 133 271 174 C287 224 307 256 300 289 C292 330 249 345 200 345 C151 345 108 330 100 289 C93 256 113 224 129 174 C143 133 159 86 200 86 Z"/>
      <!-- the big seed -->
      <circle class="region" cx="200" cy="280" r="52"/>
      <path class="region" d="M170 262 C176 246 190 238 204 238 C196 252 186 262 172 272 Z"/>
      <circle cx="178" cy="172" r="12" class="ink"/><circle cx="182" cy="167" r="4" class="shine"/>
      <circle cx="222" cy="172" r="12" class="ink"/><circle cx="226" cy="167" r="4" class="shine"/>
      <ellipse class="region" cx="152" cy="198" rx="15" ry="9"/>
      <ellipse class="region" cx="248" cy="198" rx="15" ry="9"/>
      <path class="line" d="M186 196 Q200 210 214 196"/>
    `
  },
  {
    id: 'mushroom', group: 'fruit',
    name: 'Mushroom',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M0 338 Q200 316 400 338 V400 H0 Z"/>
      <path class="region" d="M134 240 C128 290 122 330 134 350 H266 C278 330 272 290 266 240 Z"/>
      <path class="region" d="M44 236 C44 120 126 56 200 56 C274 56 356 120 356 236 C356 258 334 264 200 264 C66 264 44 258 44 236 Z"/>
      <circle class="region" cx="106" cy="196" r="22"/>
      <circle class="region" cx="158" cy="124" r="25"/>
      <circle class="region" cx="242" cy="124" r="25"/>
      <circle class="region" cx="294" cy="196" r="22"/>
      <circle class="region" cx="200" cy="200" r="30"/>
      <circle cx="176" cy="292" r="11" class="ink"/><circle cx="180" cy="287" r="4" class="shine"/>
      <circle cx="224" cy="292" r="11" class="ink"/><circle cx="228" cy="287" r="4" class="shine"/>
      <ellipse class="region" cx="156" cy="316" rx="13" ry="8"/>
      <ellipse class="region" cx="244" cy="316" rx="13" ry="8"/>
      <path class="line" d="M186 314 Q200 328 214 314"/>
    `
  },
  {
    id: 'tomato', group: 'fruit',
    name: 'Tomato',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <ellipse class="region" cx="200" cy="356" rx="140" ry="20"/>
      <rect class="region" x="191" y="66" width="18" height="44" rx="7"/>
      <path class="region" d="M200 112 C110 100 58 162 58 232 C58 310 128 348 200 348 C272 348 342 310 342 232 C342 162 290 100 200 112 Z"/>
      <!-- green star of leaves on top -->
      <path class="region" d="M200 94 L214 116 L264 112 L222 128 L240 152 L200 136 L160 152 L178 128 L136 112 L186 116 Z"/>
      <path class="region" d="M96 196 C102 170 120 154 138 150 C132 172 120 192 100 210 Z"/>
      <circle cx="160" cy="222" r="14" class="ink"/><circle cx="165" cy="217" r="4" class="shine"/>
      <circle cx="240" cy="222" r="14" class="ink"/><circle cx="245" cy="217" r="4" class="shine"/>
      <ellipse class="region" cx="136" cy="258" rx="17" ry="10"/>
      <ellipse class="region" cx="264" cy="258" rx="17" ry="10"/>
      <path class="line" d="M174 256 Q200 282 226 256"/>
    `
  },
  {
    id: 'pumpkin', group: 'fruit',
    name: 'Pumpkin',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M0 338 Q200 318 400 338 V400 H0 Z"/>
      <path class="line" d="M214 96 C244 70 270 92 256 108 C248 118 236 106 246 98"/>
      <path class="region" d="M184 136 C182 108 188 88 200 72 L220 82 C210 98 208 116 212 136 Z"/>
      <path class="region" d="M212 104 C232 70 286 66 300 84 C280 116 236 120 212 104 Z"/>
      <!-- five round lobes, back ones first -->
      <ellipse class="region" cx="96" cy="240" rx="70" ry="98"/>
      <ellipse class="region" cx="304" cy="240" rx="70" ry="98"/>
      <ellipse class="region" cx="142" cy="238" rx="72" ry="104"/>
      <ellipse class="region" cx="258" cy="238" rx="72" ry="104"/>
      <ellipse class="region" cx="200" cy="236" rx="82" ry="108"/>
      <circle cx="174" cy="222" r="13" class="ink"/><circle cx="179" cy="217" r="4" class="shine"/>
      <circle cx="226" cy="222" r="13" class="ink"/><circle cx="231" cy="217" r="4" class="shine"/>
      <ellipse class="region" cx="150" cy="256" rx="17" ry="10"/>
      <ellipse class="region" cx="250" cy="256" rx="17" ry="10"/>
      <path class="line" d="M182 254 Q200 272 218 254"/>
    `
  }
);
