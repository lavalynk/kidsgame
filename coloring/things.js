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
  },
  {
    id: 'bus', group: 'things',
    name: 'Bus',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M0 318 H400 V400 H0 Z"/>
      <path class="line" d="M30 362 H80 M150 362 H200 M270 362 H320"/>
      <path class="region" d="M40 80 C40 60 64 54 76 64 C84 44 116 44 124 64 C140 58 154 72 146 86 Z"/>
      <!-- long body, front on the right -->
      <rect class="region" x="30" y="120" width="344" height="180" rx="28"/>
      <rect class="region" x="30" y="232" width="250" height="24"/>
      <rect class="region" x="54" y="144" width="56" height="62" rx="8"/>
      <rect class="region" x="126" y="144" width="56" height="62" rx="8"/>
      <rect class="region" x="198" y="144" width="56" height="62" rx="8"/>
      <rect class="region" x="290" y="144" width="62" height="134" rx="8"/>
      <path class="line" d="M321 144 V278"/>
      <ellipse class="region" cx="362" cy="270" rx="10" ry="14"/>
      <circle class="region" cx="100" cy="300" r="40"/>
      <circle class="region" cx="100" cy="300" r="16"/>
      <circle class="region" cx="300" cy="300" r="40"/>
      <circle class="region" cx="300" cy="300" r="16"/>
    `
  },
  {
    id: 'firetruck', group: 'things',
    name: 'Fire Truck',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M0 318 H400 V400 H0 Z"/>
      <path class="line" d="M30 362 H80 M150 362 H200 M270 362 H320"/>
      <!-- ladder on the roof -->
      <rect class="region" x="40" y="150" width="216" height="26" rx="8"/>
      <path class="line" d="M80 150 V176 M120 150 V176 M160 150 V176 M200 150 V176 M240 150 V176"/>
      <!-- back box and cab -->
      <rect class="region" x="30" y="180" width="236" height="120" rx="12"/>
      <path class="region" d="M298 150 V130 H326 V150 Z"/>
      <path class="region" d="M260 150 H322 C346 150 362 186 370 226 V300 H260 Z"/>
      <path class="region" d="M280 168 H322 C336 170 346 192 350 216 H280 Z"/>
      <path class="line" d="M276 240 H296"/>
      <circle class="region" cx="100" cy="222" r="30"/>
      <circle class="region" cx="100" cy="222" r="12"/>
      <rect class="region" x="160" y="206" width="76" height="64" rx="8"/>
      <rect class="region" x="356" y="248" width="20" height="28" rx="6"/>
      <circle class="region" cx="86" cy="300" r="38"/>
      <circle class="region" cx="86" cy="300" r="15"/>
      <circle class="region" cx="196" cy="300" r="38"/>
      <circle class="region" cx="196" cy="300" r="15"/>
      <circle class="region" cx="316" cy="300" r="38"/>
      <circle class="region" cx="316" cy="300" r="15"/>
    `
  },
  {
    id: 'rocket', group: 'things',
    name: 'Rocket',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M62 34 L71 54 L92 56 L76 71 L81 92 L62 81 L43 92 L48 71 L32 56 L53 54 Z"/>
      <path class="region" d="M338 34 L347 54 L368 56 L352 71 L357 92 L338 81 L319 92 L324 71 L308 56 L329 54 Z"/>
      <path class="region" d="M50 160 L57 176 L75 178 L61 190 L65 207 L50 198 L35 207 L39 190 L25 178 L43 176 Z"/>
      <path class="region" d="M350 160 L357 176 L375 178 L361 190 L365 207 L350 198 L335 207 L339 190 L325 178 L343 176 Z"/>
      
      <!-- flame -->
      <path class="region" d="M150 296 H250 C252 336 232 368 200 392 C168 368 148 336 150 296 Z"/>
      <path class="region" d="M174 296 H226 C228 320 218 342 200 360 C182 342 172 320 174 296 Z"/>
      <!-- fins -->
      <path class="region" d="M134 224 C94 246 80 290 84 332 L136 300 Z"/>
      <path class="region" d="M266 224 C306 246 320 290 316 332 L264 300 Z"/>
      <!-- body, nose cone, window -->
      <path class="region" d="M200 30 C254 72 272 146 272 226 V304 H128 V226 C128 146 146 72 200 30 Z"/>
      <path class="region" d="M200 30 C228 52 246 82 256 114 H144 C154 82 172 52 200 30 Z"/>
      <circle class="region" cx="200" cy="184" r="40"/>
      <circle class="region" cx="200" cy="184" r="24"/>
      <rect class="region" x="128" y="264" width="144" height="26"/>
    `
  },
  {
    id: 'helicopter', group: 'things',
    name: 'Helicopter',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M0 340 Q200 320 400 340 V400 H0 Z"/>
      <path class="region" d="M250 52 C250 32 274 26 286 36 C294 16 326 16 334 36 C350 30 364 44 356 58 Z"/>
      <!-- tail and tail rotor -->
      <path class="region" d="M140 196 L46 176 L46 210 L140 240 Z"/>
      <circle class="region" cx="46" cy="190" r="26"/>
      <path class="line" d="M46 166 V214 M22 190 H70"/>
      <!-- top rotor -->
      <rect class="region" x="204" y="98" width="22" height="32" rx="4"/>
      <rect class="region" x="56" y="84" width="318" height="20" rx="10"/>
      <!-- body and big window -->
      <path class="region" d="M118 214 C118 152 164 124 220 124 C290 124 330 168 330 218 C330 266 290 290 228 290 H176 C138 290 118 262 118 214 Z"/>
      <path class="region" d="M232 140 C282 142 306 176 310 212 H232 Z"/>
      <rect class="region" x="150" y="230" width="100" height="22" rx="8"/>
      <!-- landing skids -->
      <path class="line" d="M176 290 V320 M270 290 V320"/>
      <rect class="region" x="120" y="316" width="210" height="18" rx="9"/>
    `
  },
  {
    id: 'tractor', group: 'things',
    name: 'Tractor',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M0 340 Q200 320 400 340 V400 H0 Z"/>
      <!-- exhaust pipe, hood, cab -->
      <rect class="region" x="300" y="146" width="18" height="66" rx="6"/>
      <rect class="region" x="190" y="202" width="164" height="76" rx="16"/>
      <path class="line" d="M232 220 V262 M256 220 V262 M280 220 V262"/>
      <rect class="region" x="88" y="126" width="116" height="152" rx="10"/>
      <rect class="region" x="74" y="108" width="144" height="26" rx="12"/>
      <rect class="region" x="110" y="146" width="72" height="62" rx="8"/>
      <!-- big back wheel, small front wheel -->
      <circle class="region" cx="128" cy="284" r="78"/>
      <circle class="region" cx="128" cy="284" r="30"/>
      <circle class="region" cx="310" cy="306" r="44"/>
      <circle class="region" cx="310" cy="306" r="16"/>
    `
  },
  {
    id: 'castle', group: 'things',
    name: 'Castle',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M0 340 Q200 320 400 340 V400 H0 Z"/>
      <!-- flags -->
      <path class="line" d="M82 70 V30 M318 70 V30"/>
      <path class="region" d="M82 28 L118 40 L82 52 Z"/>
      <path class="region" d="M318 28 L354 40 L318 52 Z"/>
      <!-- middle wall with bumpy top -->
      <path class="region" d="M110 340 V196 H134 V172 H162 V196 H186 V172 H214 V196 H238 V172 H266 V196 H290 V340 Z"/>
      <!-- towers and pointy roofs -->
      <rect class="region" x="40" y="152" width="84" height="188"/>
      <rect class="region" x="276" y="152" width="84" height="188"/>
      <path class="region" d="M28 160 L82 64 L136 160 Z"/>
      <path class="region" d="M264 160 L318 64 L372 160 Z"/>
      <path class="region" d="M66 206 C66 186 98 186 98 206 V240 H66 Z"/>
      <path class="region" d="M302 206 C302 186 334 186 334 206 V240 H302 Z"/>
      <!-- door -->
      <path class="region" d="M164 340 V280 C164 236 236 236 236 280 V340 Z"/>
      <path class="line" d="M200 250 V340"/>
    `
  },
  {
    id: 'balloon', group: 'things',
    name: 'Hot-air balloon',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M20 296 C20 278 42 272 54 282 C62 264 92 264 98 284 C114 282 120 304 104 308 H30 C18 308 14 300 20 296 Z"/>
      <path class="region" d="M296 236 C296 218 318 212 330 222 C338 204 368 204 374 224 C390 222 396 244 380 248 H306 C294 248 290 240 296 236 Z"/>
      <!-- balloon with stripes -->
      <path class="region" d="M200 30 C290 30 342 92 342 166 C342 236 262 266 234 300 H166 C138 266 58 236 58 166 C58 92 110 30 200 30 Z"/>
      <path class="region" d="M200 30 C138 54 112 112 114 166 C116 226 156 266 166 300 H234 C244 266 284 226 286 166 C288 112 262 54 200 30 Z"/>
      <path class="region" d="M200 30 C170 60 160 112 160 166 C160 226 172 266 176 300 H224 C228 266 240 226 240 166 C240 112 230 60 200 30 Z"/>
      <path class="region" d="M166 300 H234 L228 320 H172 Z"/>
      <!-- ropes and basket -->
      <path class="line" d="M174 318 L160 336 M226 318 L240 336"/>
      <rect class="region" x="152" y="340" width="96" height="48" rx="8"/>
      <rect class="region" x="142" y="328" width="116" height="20" rx="9"/>
    `
  },
  {
    id: 'submarine', group: 'things',
    name: 'Submarine',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M0 340 Q100 322 200 340 T400 340 V400 H0 Z"/>
      <path class="region" d="M22 344 C8 306 40 288 24 250 C50 266 60 304 48 344 Z"/>
      <!-- bubbles -->
      <circle class="region" cx="44" cy="150" r="14"/>
      <circle class="region" cx="70" cy="104" r="18"/>
      <circle class="region" cx="44" cy="58" r="14"/>
      <!-- periscope, tower -->
      <path class="line" d="M230 116 V72 H258"/>
      <rect class="region" x="254" y="60" width="28" height="24" rx="7"/>
      <rect class="region" x="148" y="110" width="104" height="74" rx="16"/>
      <!-- propeller behind the back -->
      <ellipse class="region" cx="362" cy="210" rx="13" ry="30"/>
      <ellipse class="region" cx="362" cy="264" rx="13" ry="30"/>
      <circle class="region" cx="350" cy="237" r="13"/>
      <!-- body and round windows -->
      <rect class="region" x="44" y="170" width="300" height="134" rx="67"/>
      <path class="region" d="M47.4 258 H340.6 A67 67 0 0 1 330 278 H58 A67 67 0 0 1 47.4 258 Z"/>
      <circle class="region" cx="122" cy="224" r="26"/>
      <circle class="region" cx="200" cy="224" r="26"/>
      <circle class="region" cx="278" cy="224" r="26"/>
      <circle class="region" cx="122" cy="224" r="13"/>
      <circle class="region" cx="200" cy="224" r="13"/>
      <circle class="region" cx="278" cy="224" r="13"/>
    `
  },
  {
    id: 'digger', group: 'things',
    name: 'Digger',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M0 340 Q200 324 400 340 V400 H0 Z"/>
      <!-- pile of dirt -->
      <path class="region" d="M300 346 C300 316 330 300 356 300 C380 300 396 318 400 330 V346 Z"/>
      <!-- exhaust pipe, cab, body -->
      <rect class="region" x="206" y="168" width="16" height="50" rx="6"/>
      <rect class="region" x="70" y="116" width="112" height="110" rx="14"/>
      <rect class="region" x="88" y="134" width="76" height="62" rx="8"/>
      <rect class="region" x="56" y="210" width="210" height="84" rx="14"/>
      <!-- arm and bucket -->
      <path class="region" d="M226 246 L292 108 L326 124 L260 262 Z"/>
      <path class="region" d="M292 108 L326 124 L366 214 L334 228 Z"/>
      <path class="region" d="M320 222 L390 204 L388 268 C362 282 326 270 318 246 Z"/>
      <circle class="region" cx="309" cy="116" r="14"/>
      <!-- tracks with wheels -->
      <rect class="region" x="40" y="286" width="250" height="60" rx="30"/>
      <circle class="region" cx="74" cy="316" r="18"/>
      <circle class="region" cx="134" cy="316" r="18"/>
      <circle class="region" cx="194" cy="316" r="18"/>
      <circle class="region" cx="254" cy="316" r="18"/>
    `
  },
  {
    id: 'lighthouse', group: 'things',
    name: 'Lighthouse',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="line" d="M48 96 Q62 82 76 96 Q90 82 104 96 M300 200 Q312 188 324 200 Q336 188 348 200"/>
      <!-- light beams -->
      <path class="region" d="M232 90 L372 50 L372 140 Z"/>
      <path class="region" d="M168 90 L28 50 L28 140 Z"/>
      <!-- tower with two stripes -->
      <path class="region" d="M150 330 L170 140 H230 L250 330 Z"/>
      <path class="region" d="M165.8 180 H234.2 L238.4 220 H161.6 Z"/>
      <path class="region" d="M157.4 260 H242.6 L246.8 300 H153.2 Z"/>
      <circle class="region" cx="200" cy="240" r="13"/>
      <path class="region" d="M182 334 V302 C182 280 218 280 218 302 V334 Z"/>
      <!-- balcony, lamp room, roof -->
      <rect class="region" x="148" y="124" width="104" height="22" rx="7"/>
      <rect class="region" x="166" y="72" width="68" height="56" rx="6"/>
      <rect class="region" x="180" y="84" width="40" height="34" rx="5"/>
      <path class="region" d="M154 78 L200 34 L246 78 Z"/>
      <circle class="region" cx="200" cy="28" r="11"/>
      <!-- rocks and sea -->
      <path class="region" d="M96 346 C96 312 136 304 158 320 C178 300 228 300 244 320 C266 304 306 314 306 346 Z"/>
      <path class="region" d="M0 344 Q50 328 100 344 T200 344 T300 344 T400 344 V400 H0 Z"/>
    `
  },
  {
    id: 'tent', group: 'things',
    name: 'Tent',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M262 92 C262 72 288 66 300 78 C308 58 342 58 348 80 C366 78 372 102 354 106 H272 C258 106 254 96 262 92 Z"/>
      <path class="region" d="M0 330 Q200 314 400 330 V400 H0 Z"/>
      <!-- flag on top -->
      <path class="line" d="M165 96 V48"/>
      <path class="region" d="M165 46 L210 60 L165 74 Z"/>
      <!-- tent with open door flaps -->
      <path class="region" d="M30 334 L165 92 L296 334 Z"/>
      <path class="region" d="M165 136 C155 202 141 272 133 334 H197 C189 272 175 202 165 136 Z"/>
      <path class="region" d="M165 132 L84 334 H133 C141 272 155 202 165 132 Z"/>
      <path class="region" d="M165 132 L246 334 H197 C189 272 175 202 165 132 Z"/>
      <!-- campfire -->
      <rect class="region" x="316" y="344" width="72" height="18" rx="9" transform="rotate(-12 352 353)"/>
      <rect class="region" x="316" y="344" width="72" height="18" rx="9" transform="rotate(12 352 353)"/>
      <path class="region" d="M352 346 C317 336 321 296 341 274 C345 294 355 296 359 282 C379 302 387 336 352 346 Z"/>
      <path class="region" d="M352 344 C337 338 337 318 347 306 C351 318 363 320 363 330 C365 338 359 344 352 344 Z"/>
    `
  },
  {
    id: 'dumptruck', group: 'things',
    name: 'Dump truck',
    svg: `
      <rect class="region bg" x="0" y="0" width="400" height="400"/>
      <path class="region" d="M0 340 Q200 326 400 340 V400 H0 Z"/>
      <!-- sand pile in the back -->
      <path class="region" d="M56 150 C70 100 130 92 150 116 C170 86 226 98 232 150 Z"/>
      <path class="region" d="M32 146 H250 L234 266 H52 Z"/>
      <!-- cab with a window -->
      <path class="region" d="M256 158 H318 C340 158 350 180 360 206 L376 226 V280 H256 Z"/>
      <path class="region" d="M272 176 H314 C326 176 334 190 340 212 H272 Z"/>
      <circle class="region" cx="364" cy="244" r="11"/>
      <rect class="region" x="28" y="258" width="358" height="32" rx="10"/>
      <!-- wheels -->
      <circle class="region" cx="94" cy="300" r="40"/>
      <circle class="region" cx="182" cy="300" r="40"/>
      <circle class="region" cx="314" cy="300" r="40"/>
      <circle class="region" cx="94" cy="300" r="16"/>
      <circle class="region" cx="182" cy="300" r="16"/>
      <circle class="region" cx="314" cy="300" r="16"/>
    `
  }
);
