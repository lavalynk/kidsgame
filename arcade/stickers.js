// =====================================================================
// The Sticker Book: an arcade-wide collection (Keith, Nov 5).
//
// Every game (14 of them) has 4 stickers, plus 4 "arcade" stickers for playing lots of
// games, and 8 "surprise" stickers (one per Daily Surprise finished).
// Stickers are earned just by playing: no buttons to press.
//   sticker 1 (round)   - play the game once
//   sticker 2 (square)  - win a level
//   sticker 3 (flower)  - get 3 stars on a level
//   sticker 4 (heart)   - 3 trophies, or win 5 levels
// (The coloring book counts pictures in your gallery instead.)
//
// Stickers are worked out from each player's saved progress, so nobody has
// to remember to "give" them. Once earned they stay forever (even after
// "New game"), saved in the player's arcade save as  stickers: { have, seen }.
//
// Loaded after shared.js on every page:
//   Arcade.stickers.check()    - look for new stickers, show a "New sticker!" toast
//   Arcade.stickers.list       - every sticker: { id, game, k, name, color, icon }
//   Arcade.stickers.svg(st, locked) - the picture of one sticker
//   Arcade.stickers.has(id), .count(), .unseen(), .markSeen()
// =====================================================================
(function () {
  'use strict';
  if (!window.Arcade) return;
  const I = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
  const eye = (x, y, r = 4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#2b2b2b"/><circle cx="${x + 1.3}" cy="${y - 1.3}" r="${r * 0.35}" fill="#fff"/>`;

  // The games (same ids as the hub) and their colors.
  const GAMES = [
    { id: 'bike', name: 'Turbo Bike', color: '#8ecae6' },
    { id: 'rc', name: 'Mini RC Racers', color: '#90be6d' },
    { id: 'hoops', name: 'Hoop Heroes', color: '#ffb4a2' },
    { id: 'archery', name: 'Bullseye Adventure', color: '#b8e0d2' },
    { id: 'jungle', name: 'Jungle Jump', color: '#a0e7a0' },
    { id: 'trail', name: 'Treasure Trail', color: '#7bd389' },
    { id: 'space', name: 'Space Defender', color: '#7b6fd6' },
    { id: 'abc', name: 'Bubble School', color: '#4cc9f0' },
    { id: 'coloring', name: 'Magic Coloring Book', color: '#ffd166' },
    { id: 'maze', name: 'Maze Explorer', color: '#8ecae6' },
    { id: 'fishing', name: 'Fishing Frenzy', color: '#4cc9f0' },
    { id: 'piano', name: 'Piano Star', color: '#c77dff' },
    { id: 'golf', name: 'Putt-Putt Park', color: '#8fe07a' },
    { id: 'quest', name: 'Potion Quest', color: '#b8a4ff' },
  ];

  // ---- the little pictures on the stickers (100 x 100 box, middle at 50,50) ----
  const ICONS = {
    bike: [
      // helmet
      `<path d="M18 62 C18 34 36 22 54 22 C74 22 86 38 86 58 L86 64 H18 Z" fill="#ef476f" ${I}/><path d="M50 30 C66 30 76 40 78 54 H50 Z" fill="#bde0fe" ${I}/><path d="M28 40 L40 30 M24 52 L38 40" stroke="#fff" stroke-width="5" stroke-linecap="round"/><rect x="14" y="62" width="76" height="10" rx="5" fill="#ffd166" ${I}/>`,
      // wheel
      `<circle cx="50" cy="50" r="32" fill="#2b2b2b"/><circle cx="50" cy="50" r="24" fill="#fff" ${I}/><path d="M50 26 V74 M26 50 H74 M33 33 L67 67 M67 33 L33 67" stroke="#8d99ae" stroke-width="3"/><circle cx="50" cy="50" r="7" fill="#ef476f" ${I}/>`,
      // a flame (bike heat)
      `<path d="M50 14 C62 30 78 38 76 60 C74 78 62 86 50 86 C36 86 24 76 24 60 C24 46 34 40 36 28 C42 36 44 42 50 42 C52 32 50 24 50 14 Z" fill="#ff8c42" ${I}/><path d="M50 50 C58 58 64 62 62 72 C60 80 54 82 50 82 C44 82 38 78 38 70 C38 62 46 60 50 50 Z" fill="#ffd166" ${I}/>`,
      // a gold cup
      `<path d="M30 20 H70 V42 A20 20 0 0 1 30 42 Z" fill="#ffc93c" ${I}/><path d="M30 26 H18 Q18 46 34 48 M70 26 H82 Q82 46 66 48" fill="none" ${I}/><rect x="44" y="60" width="12" height="12" fill="#ffc93c" ${I}/><rect x="32" y="72" width="36" height="10" rx="3" fill="#ef476f" ${I}/><path d="M50 28 L53 36 L61 36 L55 41 L57 49 L50 44 L43 49 L45 41 L39 36 L47 36 Z" fill="#fff"/>`,
    ],
    rc: [
      // a cute race car from above
      `<rect x="16" y="30" width="68" height="40" rx="16" fill="#ef476f" ${I}/><rect x="44" y="36" width="22" height="28" rx="8" fill="#d6f1ff" ${I}/>${eye(56, 44, 4)}${eye(56, 56, 4)}<rect x="20" y="22" width="16" height="10" rx="4" fill="#2b2b2b"/><rect x="62" y="22" width="16" height="10" rx="4" fill="#2b2b2b"/><rect x="20" y="68" width="16" height="10" rx="4" fill="#2b2b2b"/><rect x="62" y="68" width="16" height="10" rx="4" fill="#2b2b2b"/>`,
      // remote control
      `<rect x="24" y="30" width="52" height="50" rx="12" fill="#4cc9f0" ${I}/><path d="M64 30 V12" ${I}/><circle cx="64" cy="10" r="5" fill="#ef476f" ${I}/><circle cx="40" cy="54" r="9" fill="#ffd166" ${I}/><circle cx="62" cy="48" r="5" fill="#06d6a0" ${I}/><circle cx="62" cy="64" r="5" fill="#ef476f" ${I}/>`,
      // traffic light
      `<rect x="32" y="12" width="36" height="76" rx="14" fill="#3a3a4a" ${I}/><circle cx="50" cy="30" r="9" fill="#ef476f" ${I}/><circle cx="50" cy="50" r="9" fill="#ffd166" ${I}/><circle cx="50" cy="70" r="9" fill="#06d6a0" ${I}/>`,
      // checkered flag
      `<path d="M26 86 V14" ${I} stroke-width="6"/><path d="M28 16 H80 V54 H28 Z" fill="#fff" ${I}/><path d="M28 16 h13 v9.5 h-13 Z M54 16 h13 v9.5 h-13 Z M41 25.5 h13 v9.5 h-13 Z M67 25.5 h13 v9.5 h-13 Z M28 35 h13 v9.5 h-13 Z M54 35 h13 v9.5 h-13 Z M41 44.5 h13 v9.5 h-13 Z M67 44.5 h13 v9.5 h-13 Z" fill="#2b2b2b"/><path d="M28 16 H80 V54 H28 Z" fill="none" ${I}/>`,
    ],
    hoops: [
      // basketball
      `<circle cx="50" cy="50" r="32" fill="#ff8c42" ${I}/><path d="M18 50 H82 M50 18 V82 M28 27 Q46 50 28 73 M72 27 Q54 50 72 73" fill="none" ${I} stroke-width="3.5"/>`,
      // hoop + net
      `<rect x="22" y="12" width="56" height="36" rx="5" fill="#fff" ${I}/><rect x="40" y="24" width="20" height="16" fill="none" ${I} stroke-width="3"/><path d="M30 50 L36 84 H64 L70 50" fill="none" ${I} stroke-width="3"/><path d="M33 64 H67 M36 50 L48 84 M64 50 L52 84" fill="none" stroke="#2b2b2b" stroke-width="2.5"/><path d="M26 50 H74" stroke="#ef476f" stroke-width="8" stroke-linecap="round"/>`,
      // sneaker
      `<path d="M14 66 V40 Q14 32 22 32 H40 L48 46 L78 54 Q88 58 88 66 V70 H14 Z" fill="#06d6a0" ${I}/><path d="M14 70 H88 V76 Q88 80 84 80 H18 Q14 80 14 76 Z" fill="#fff" ${I}/><path d="M36 40 L44 38 M40 46 L48 44" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
      // ball on fire
      `<path d="M30 42 Q24 20 40 12 Q40 26 50 26 Q50 10 66 6 Q62 20 72 26 Q80 30 76 46 Z" fill="#ff8c42" ${I}/><circle cx="50" cy="58" r="26" fill="#ff8c42" ${I}/><path d="M24 58 H76 M50 32 V84 M33 40 Q46 58 33 76 M67 40 Q54 58 67 76" fill="none" ${I} stroke-width="3"/>`,
    ],
    archery: [
      // target
      `<circle cx="50" cy="50" r="34" fill="#ef476f" ${I}/><circle cx="50" cy="50" r="24" fill="#fff" ${I}/><circle cx="50" cy="50" r="14" fill="#ef476f" ${I}/><circle cx="50" cy="50" r="5" fill="#ffd166" ${I}/>`,
      // arrow
      `<path d="M18 82 L78 22" ${I} stroke-width="6"/><path d="M18 82 L78 22" stroke="#c68b59" stroke-width="2.5"/><path d="M84 16 L66 20 L80 34 Z" fill="#8d99ae" ${I}/><path d="M24 76 L12 74 L18 66 Z M24 76 L26 88 L34 82 Z" fill="#ff5fa2" ${I}/>`,
      // balloon
      `<ellipse cx="50" cy="40" rx="24" ry="28" fill="#9b5de5" ${I}/><path d="M46 68 L54 68 L50 74 Z" fill="#9b5de5" ${I}/><path d="M50 74 Q44 82 52 90" fill="none" ${I} stroke-width="2.5"/><ellipse cx="41" cy="30" rx="5" ry="8" fill="#fff" opacity="0.7"/>`,
      // a feathered hat
      `<path d="M14 66 Q50 54 86 66 Q50 76 14 66 Z" fill="#118ab2" ${I}/><path d="M28 62 Q30 30 50 28 Q70 30 72 62 Z" fill="#118ab2" ${I}/><path d="M60 34 Q80 10 88 20 Q78 26 66 40 Z" fill="#ffd166" ${I}/><path d="M30 56 Q50 50 70 56" fill="none" stroke="#ef476f" stroke-width="6"/>`,
    ],
    jungle: [
      // leaf
      `<path d="M16 84 C14 40 44 16 86 14 C86 56 62 84 16 84 Z" fill="#6cc04a" ${I}/><path d="M16 84 L72 28 M34 66 L34 48 M48 52 L50 36 M34 66 L52 66 M48 52 L64 52" fill="none" ${I} stroke-width="3"/>`,
      // banana
      `<path d="M22 30 Q20 74 60 80 Q80 82 84 72 Q60 72 46 58 Q32 44 32 26 Z" fill="#ffd166" ${I}/><path d="M22 30 L26 18 L34 24" fill="#8d5524" ${I}/>`,
      // lantern
      `<path d="M50 10 V20" ${I}/><rect x="38" y="18" width="24" height="8" rx="3" fill="#2b2b2b"/><path d="M30 28 H70 L66 76 H34 Z" fill="#ffd166" ${I}/><path d="M42 40 Q50 32 58 40 Q60 56 50 64 Q40 56 42 40 Z" fill="#ff8c42" ${I} stroke-width="3"/><rect x="34" y="76" width="32" height="8" rx="3" fill="#2b2b2b"/>`,
      // hot-air balloon (the goal)
      `<path d="M50 10 C76 10 86 30 80 48 C76 58 62 66 58 70 H42 C38 66 24 58 20 48 C14 30 24 10 50 10 Z" fill="#ef476f" ${I}/><path d="M42 10.5 Q34 40 42 70 M58 10.5 Q66 40 58 70" fill="none" stroke="#ffd166" stroke-width="6"/><path d="M50 10 C76 10 86 30 80 48 C76 58 62 66 58 70 H42 C38 66 24 58 20 48 C14 30 24 10 50 10 Z" fill="none" ${I}/><rect x="40" y="76" width="20" height="14" rx="3" fill="#c68b59" ${I}/>`,
    ],
    trail: [
      // treasure chest
      `<path d="M16 44 Q16 22 50 22 Q84 22 84 44 Z" fill="#c68b59" ${I}/><rect x="16" y="44" width="68" height="36" rx="4" fill="#b9783f" ${I}/><rect x="44" y="40" width="12" height="16" rx="3" fill="#ffd166" ${I}/><path d="M22 44 H78" stroke="#ffd166" stroke-width="5"/><circle cx="30" cy="20" r="4" fill="#fff"/><circle cx="72" cy="16" r="3" fill="#fff"/>`,
      // treasure map
      `<path d="M12 22 L36 14 L62 22 L88 14 V78 L62 86 L36 78 L12 86 Z" fill="#f4d58d" ${I}/><path d="M36 14 V78 M62 22 V86" stroke="#2b2b2b" stroke-width="2.5"/><path d="M20 70 Q34 56 46 62 Q58 70 66 52" fill="none" stroke="#ef476f" stroke-width="4" stroke-dasharray="5 6" stroke-linecap="round"/><path d="M66 38 L78 50 M78 38 L66 50" ${I} stroke-width="5" stroke="#ef476f"/>`,
      // compass
      `<circle cx="50" cy="50" r="34" fill="#ffd166" ${I}/><circle cx="50" cy="50" r="24" fill="#fff" ${I}/><path d="M50 28 L57 50 L50 72 L43 50 Z" fill="#ef476f" ${I} stroke-width="3"/><path d="M50 50 L57 50 L50 72 L43 50 Z" fill="#8d99ae" ${I} stroke-width="3"/>`,
      // a smiling hippo
      `<ellipse cx="50" cy="56" rx="34" ry="24" fill="#9a8fbf" ${I}/><circle cx="34" cy="30" r="8" fill="#9a8fbf" ${I}/><circle cx="66" cy="30" r="8" fill="#9a8fbf" ${I}/>${eye(38, 44)}${eye(62, 44)}<ellipse cx="50" cy="64" rx="22" ry="12" fill="#b9b0d9" ${I}/><circle cx="42" cy="62" r="2.5" fill="#2b2b2b"/><circle cx="58" cy="62" r="2.5" fill="#2b2b2b"/><path d="M42 70 Q50 76 58 70" fill="none" ${I} stroke-width="3"/>`,
    ],
    space: [
      // rocket
      `<path d="M50 10 C64 22 66 44 62 66 H38 C34 44 36 22 50 10 Z" fill="#fff" ${I}/><circle cx="50" cy="38" r="8" fill="#4cc9f0" ${I}/><path d="M38 52 L24 70 L38 66 Z M62 52 L76 70 L62 66 Z" fill="#ef476f" ${I}/><path d="M42 66 Q50 92 58 66 Z" fill="#ffd166" ${I}/>`,
      // ringed planet
      `<circle cx="50" cy="50" r="24" fill="#c77dff" ${I}/><ellipse cx="50" cy="52" rx="42" ry="10" fill="none" ${I} stroke-width="5"/><ellipse cx="50" cy="52" rx="42" ry="10" fill="none" stroke="#ffd166" stroke-width="2"/><circle cx="42" cy="40" r="4" fill="#fff" opacity="0.7"/>`,
      // friendly little ufo
      `<path d="M30 46 A20 20 0 0 1 70 46" fill="#bde0fe" ${I}/>${eye(44, 38, 3.5)}${eye(56, 38, 3.5)}<ellipse cx="50" cy="52" rx="38" ry="14" fill="#06d6a0" ${I}/><circle cx="30" cy="54" r="4" fill="#ffd166"/><circle cx="50" cy="58" r="4" fill="#ffd166"/><circle cx="70" cy="54" r="4" fill="#ffd166"/><path d="M36 70 L28 86 M64 70 L72 86" ${I} stroke="#ffd166" stroke-width="5"/>`,
      // shooting star
      `<path d="M14 82 L44 52 M22 88 L48 62 M10 70 L38 46" stroke="#ff8fab" stroke-width="5" stroke-linecap="round"/><path d="M62 14 L69 30 L86 32 L73 43 L77 60 L62 51 L47 60 L51 43 L38 32 L55 30 Z" fill="#ffd166" ${I}/>`,
    ],
    abc: [
      // A block
      `<rect x="20" y="20" width="60" height="60" rx="8" fill="#ef476f" ${I}/><text x="50" y="68" font-size="46" font-weight="900" text-anchor="middle" fill="#fff" stroke="#2b2b2b" stroke-width="3" paint-order="stroke" font-family="Arial Black, sans-serif">A</text>`,
      // number bubble
      `<circle cx="50" cy="50" r="32" fill="#bde0fe" ${I}/><text x="50" y="66" font-size="44" font-weight="900" text-anchor="middle" fill="#2b2b2b" font-family="Arial Black, sans-serif">3</text><ellipse cx="36" cy="32" rx="7" ry="4" fill="#fff" transform="rotate(-35 36 32)"/>`,
      // pencil
      `<path d="M22 78 L28 60 L70 18 L82 30 L40 72 Z" fill="#ffd166" ${I}/><path d="M22 78 L28 60 L40 72 Z" fill="#f5d3a6" ${I}/><path d="M22 78 L25 70 L30 75 Z" fill="#2b2b2b"/><path d="M64 24 L76 36" ${I}/><path d="M70 18 L82 30 L86 26 Q88 22 84 18 L82 16 Q78 12 74 14 Z" fill="#ff8fab" ${I}/>`,
      // a happy bubble octopus (the teacher)
      `<path d="M24 54 C24 26 76 26 76 54 L76 64 Q70 74 64 64 Q58 76 50 64 Q42 76 36 64 Q30 74 24 64 Z" fill="#c77dff" ${I}/>${eye(40, 48)}${eye(60, 48)}<path d="M44 58 Q50 63 56 58" fill="none" ${I} stroke-width="3"/><path d="M34 24 L50 16 L66 24 L50 30 Z" fill="#2b2b2b"/>`,
    ],
    coloring: [
      // crayon
      `<path d="M20 74 L60 34 L72 46 L32 86 Z" fill="#ef476f" ${I}/><path d="M60 34 L74 20 Q80 16 84 22 L86 24 Q90 28 84 34 L72 46 Z" fill="#ef476f" ${I}/><path d="M74 20 L80 14 L88 22 L84 34" fill="#f5d3a6" ${I}/><path d="M34 60 L46 72 M44 50 L56 62" stroke="#fff" stroke-width="4"/>`,
      // paint palette
      `<path d="M50 14 C80 14 92 34 88 50 C84 64 72 60 64 58 C56 56 52 62 56 70 C60 80 54 88 46 86 C24 84 12 68 12 50 C12 28 28 14 50 14 Z" fill="#fff" ${I}/><circle cx="34" cy="36" r="7" fill="#ef476f" ${I} stroke-width="3"/><circle cx="54" cy="28" r="7" fill="#06d6a0" ${I} stroke-width="3"/><circle cx="72" cy="38" r="7" fill="#4cc9f0" ${I} stroke-width="3"/><circle cx="28" cy="58" r="7" fill="#ffd166" ${I} stroke-width="3"/>`,
      // paintbrush
      `<path d="M78 14 L86 22 L54 58 L44 48 Z" fill="#c68b59" ${I}/><path d="M44 48 L54 58 L48 64 L38 54 Z" fill="#8d99ae" ${I}/><path d="M38 54 L48 64 Q44 82 18 86 Q22 62 38 54 Z" fill="#9b5de5" ${I}/>`,
      // rainbow
      `<path d="M10 74 A40 40 0 0 1 90 74" fill="none" stroke="#2b2b2b" stroke-width="34"/><path d="M14 74 A36 36 0 0 1 86 74" fill="none" stroke="#ef476f" stroke-width="8"/><path d="M22 74 A28 28 0 0 1 78 74" fill="none" stroke="#ffd166" stroke-width="8"/><path d="M30 74 A20 20 0 0 1 70 74" fill="none" stroke="#06d6a0" stroke-width="8"/><ellipse cx="18" cy="78" rx="14" ry="9" fill="#fff" ${I}/><ellipse cx="82" cy="78" rx="14" ry="9" fill="#fff" ${I}/>`,
    ],
    maze: [
      // key
      `<circle cx="30" cy="40" r="16" fill="#ffd166" ${I}/><circle cx="30" cy="40" r="6" fill="#fff" ${I} stroke-width="3"/><path d="M44 46 L82 64 L78 72 L72 69 L68 76 L62 73 L66 66 L42 54 Z" fill="#ffd166" ${I}/>`,
      // gem
      `<path d="M28 22 H72 L86 40 L50 84 L14 40 Z" fill="#4cc9f0" ${I}/><path d="M14 40 H86 M28 22 L40 40 L50 84 L60 40 L72 22 M40 40 L50 22 L60 40" fill="none" ${I} stroke-width="3"/><path d="M30 36 L36 28" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
      // flower
      `<g fill="#ff8fab" ${I}><circle cx="50" cy="28" r="14"/><circle cx="72" cy="44" r="14"/><circle cx="64" cy="70" r="14"/><circle cx="36" cy="70" r="14"/><circle cx="28" cy="44" r="14"/></g><circle cx="50" cy="52" r="12" fill="#ffd166" ${I}/>`,
      // a little bee
      `<ellipse cx="32" cy="36" rx="14" ry="10" fill="#fff" ${I} transform="rotate(-25 32 36)"/><ellipse cx="62" cy="32" rx="14" ry="10" fill="#fff" ${I} transform="rotate(25 62 32)"/><ellipse cx="50" cy="58" rx="30" ry="22" fill="#ffd166" ${I}/><path d="M40 38 Q36 58 40 78 M56 37 Q52 58 56 79" fill="none" stroke="#2b2b2b" stroke-width="7"/>${eye(68, 54)}<path d="M66 64 Q71 67 76 63" fill="none" ${I} stroke-width="3"/>`,
    ],
    fishing: [
      // fish
      `<path d="M24 50 C34 28 70 26 82 50 C70 74 34 72 24 50 Z" fill="#ffd166" ${I}/><path d="M24 50 L8 36 L10 64 Z" fill="#ff8c42" ${I}/>${eye(68, 46, 4.5)}<path d="M46 40 Q52 50 46 60" fill="none" ${I} stroke-width="3"/>`,
      // bobber
      `<path d="M50 6 V26" ${I}/><circle cx="50" cy="52" r="26" fill="#fff" ${I}/><path d="M24 52 A26 26 0 0 1 76 52 Z" fill="#ef476f" ${I}/><path d="M10 82 Q24 74 38 82 T66 82 T94 82" fill="none" stroke="#4cc9f0" stroke-width="5" stroke-linecap="round"/>`,
      // starfish
      `<path d="M50 12 Q56 32 60 38 Q80 36 88 40 Q72 52 70 60 Q78 76 76 86 Q60 74 50 72 Q40 74 24 86 Q22 76 30 60 Q28 52 12 40 Q20 36 40 38 Q44 32 50 12 Z" fill="#ff8c42" ${I}/>${eye(42, 50, 3.5)}${eye(58, 50, 3.5)}<path d="M44 60 Q50 64 56 60" fill="none" ${I} stroke-width="3"/>`,
      // shell
      `<path d="M50 18 C80 18 90 46 84 70 H16 C10 46 20 18 50 18 Z" fill="#ffb4a2" ${I}/><path d="M50 22 V70 M30 26 L38 70 M70 26 L62 70 M18 44 L28 70 M82 44 L72 70" fill="none" ${I} stroke-width="3"/><rect x="38" y="70" width="24" height="12" rx="4" fill="#ffb4a2" ${I}/>`,
    ],
    piano: [
      // music note
      `<path d="M40 74 V22 L78 14 V62" fill="none" ${I} stroke-width="6"/><ellipse cx="32" cy="74" rx="12" ry="9" fill="#9b5de5" ${I}/><ellipse cx="70" cy="64" rx="12" ry="9" fill="#ef476f" ${I}/><path d="M40 30 L78 22" ${I} stroke-width="8"/>`,
      // piano keys
      `<rect x="12" y="26" width="76" height="50" rx="6" fill="#fff" ${I}/><path d="M31 26 V76 M50 26 V76 M69 26 V76" ${I} stroke-width="3"/><rect x="25" y="26" width="11" height="28" rx="2" fill="#2b2b2b"/><rect x="44" y="26" width="11" height="28" rx="2" fill="#2b2b2b"/><rect x="63" y="26" width="11" height="28" rx="2" fill="#2b2b2b"/>`,
      // drum
      `<ellipse cx="50" cy="36" rx="32" ry="12" fill="#fff" ${I}/><path d="M18 36 V66 Q50 84 82 66 V36" fill="#ef476f" ${I}/><path d="M18 36 L34 74 M50 48 V78 M82 36 L66 74" fill="none" stroke="#ffd166" stroke-width="4"/><path d="M60 8 L44 30 M80 12 L56 32" ${I} stroke-width="5"/>`,
      // a singing bird
      `<circle cx="46" cy="54" r="26" fill="#4cc9f0" ${I}/><path d="M68 50 L84 46 L70 60 Z" fill="#ffd166" ${I}/>${eye(56, 46, 4)}<path d="M26 56 Q40 70 52 60" fill="none" ${I} stroke-width="3"/><path d="M78 20 V34 M78 20 L88 17" ${I} stroke-width="3"/><circle cx="74" cy="34" r="4" fill="#2b2b2b"/>`,
    ],
    golf: [
      // golf ball
      `<circle cx="50" cy="50" r="32" fill="#fff" ${I}/><g fill="#cfd8e3"><circle cx="40" cy="38" r="4"/><circle cx="56" cy="34" r="4"/><circle cx="34" cy="54" r="4"/><circle cx="50" cy="50" r="4"/><circle cx="66" cy="48" r="4"/><circle cx="44" cy="66" r="4"/><circle cx="60" cy="64" r="4"/></g>`,
      // flag in the cup
      `<ellipse cx="50" cy="78" rx="30" ry="10" fill="#6cc04a" ${I}/><ellipse cx="50" cy="78" rx="10" ry="4" fill="#2b2b2b"/><path d="M50 78 V16" ${I}/><path d="M50 16 L80 26 L50 38 Z" fill="#ef476f" ${I}/>`,
      // putter
      `<path d="M66 12 L40 74" ${I} stroke-width="7"/><path d="M40 70 H20 Q12 70 12 78 Q12 86 20 86 H44 Z" fill="#8d99ae" ${I}/><circle cx="70" cy="78" r="9" fill="#fff" ${I}/>`,
      // windmill
      `<path d="M36 88 L42 46 H58 L64 88 Z" fill="#ffd166" ${I}/><rect x="45" y="68" width="10" height="20" rx="4" fill="#8d5524" ${I} stroke-width="3"/><path d="M50 44 L22 16 M50 44 L78 16 M50 44 L22 72 M50 44 L78 72" ${I} stroke-width="11"/><path d="M50 44 L22 16 M50 44 L78 16 M50 44 L22 72 M50 44 L78 72" stroke="#ef476f" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="44" r="7" fill="#fff" ${I}/>`,
    ],
    quest: [
      // potion
      `<path d="M40 14 H60 V36 Q84 48 78 74 Q50 92 22 74 Q16 48 40 36 Z" fill="#4cc9f0" ${I}/><rect x="36" y="6" width="28" height="12" rx="4" fill="#c68b59" ${I}/><circle cx="38" cy="62" r="6" fill="#fff"/>`,
      // round shield with a star
      `<circle cx="50" cy="50" r="34" fill="#ef476f" ${I}/><circle cx="50" cy="50" r="24" fill="#fff" ${I} stroke-width="3"/><path d="M50 32 L55 44 L68 45 L58 54 L61 67 L50 60 L39 67 L42 54 L32 45 L45 44 Z" fill="#ffd166" ${I} stroke-width="3"/>`,
      // wizard hat
      `<path d="M22 72 Q50 62 78 72 L56 14 Z" fill="#7b3fd1" ${I}/><ellipse cx="50" cy="74" rx="38" ry="10" fill="#9b5de5" ${I}/><path d="M52 40 L55 48 L63 48 L57 53 L59 61 L52 56 L45 61 L47 53 L41 48 L49 48 Z" fill="#ffd166" ${I} stroke-width="2.5"/>`,
      // the blob king
      `<path d="M16 84 Q12 34 50 34 Q88 34 84 84 Q50 90 16 84 Z" fill="#c77dff" ${I}/><path d="M32 38 L30 14 L42 26 L50 10 L58 26 L70 14 L68 38 Z" fill="#ffc93c" ${I}/>${eye(40, 58, 5)}${eye(60, 58, 5)}<path d="M42 74 Q50 68 58 74" fill="none" ${I} stroke-width="3.5"/>`,
    ],
    arcade: [
      // joystick
      `<rect x="16" y="56" width="68" height="26" rx="10" fill="#ef476f" ${I}/><path d="M50 56 V30" ${I} stroke-width="8"/><circle cx="50" cy="26" r="13" fill="#ffd166" ${I}/><circle cx="28" cy="69" r="5" fill="#06d6a0" ${I} stroke-width="3"/><circle cx="72" cy="69" r="5" fill="#4cc9f0" ${I} stroke-width="3"/>`,
      // a crown
      `<path d="M14 74 L18 30 L36 52 L50 22 L64 52 L82 30 L86 74 Z" fill="#ffc93c" ${I}/><circle cx="50" cy="62" r="7" fill="#ef476f" ${I} stroke-width="3"/><circle cx="30" cy="64" r="4" fill="#06d6a0"/><circle cx="70" cy="64" r="4" fill="#4cc9f0"/>`,
      // a pile of trophies
      `<path d="M20 34 H44 V46 A12 12 0 0 1 20 46 Z" fill="#c9d6df" ${I}/><rect x="28" y="58" width="8" height="8" fill="#c9d6df" ${I}/><path d="M56 34 H80 V46 A12 12 0 0 1 56 46 Z" fill="#e09f5a" ${I}/><rect x="64" y="58" width="8" height="8" fill="#e09f5a" ${I}/><path d="M36 16 H64 V32 A14 14 0 0 1 36 32 Z" fill="#ffc93c" ${I}/><rect x="16" y="66" width="68" height="14" rx="4" fill="#8d5524" ${I}/>`,
      // a little house with a heart
      `<path d="M14 48 L50 16 L86 48" fill="none" ${I} stroke-width="6"/><path d="M22 44 V84 H78 V44 L50 20 Z" fill="#ffd166" ${I}/><path d="M50 72 C36 62 34 54 40 50 C44 47 48 49 50 53 C52 49 56 47 60 50 C66 54 64 62 50 72 Z" fill="#ef476f" ${I} stroke-width="3"/>`,
    ],
    // the Daily Surprise stickers (one for each surprise you finish: see arcade/daily.js)
    surprise: [
      // a present
      `<rect x="20" y="44" width="60" height="40" rx="5" fill="#ef476f" ${I}/><rect x="14" y="32" width="72" height="16" rx="5" fill="#ff8fab" ${I}/><path d="M50 32 V84" stroke="#ffd166" stroke-width="10"/><path d="M50 32 C36 8 20 18 34 32 M50 32 C64 8 80 18 66 32" fill="none" ${I}/>`,
      // a cupcake with a cherry
      `<path d="M26 54 L32 86 H68 L74 54 Z" fill="#4cc9f0" ${I}/><path d="M38 56 L41 86 M50 56 V86 M62 56 L59 86" stroke="#2b2b2b" stroke-width="3"/><path d="M20 56 C14 44 26 34 34 38 C36 24 64 24 66 38 C74 34 86 44 80 56 Z" fill="#fff0f6" ${I}/><circle cx="50" cy="24" r="8" fill="#ef476f" ${I}/><path d="M50 16 Q54 8 60 8" fill="none" ${I} stroke-width="3"/><circle cx="38" cy="46" r="3" fill="#ffd166"/><circle cx="58" cy="44" r="3" fill="#06d6a0"/><circle cx="68" cy="50" r="3" fill="#9b5de5"/>`,
      // a party hat
      `<path d="M50 10 L78 84 H22 Z" fill="#9b5de5" ${I}/><path d="M38 44 L62 44 M30 64 L70 64" stroke="#ffd166" stroke-width="8"/><path d="M50 10 L78 84 H22 Z" fill="none" ${I}/><circle cx="50" cy="10" r="8" fill="#ffd166" ${I}/><path d="M18 84 Q50 94 82 84" fill="none" ${I} stroke-width="6"/>`,
      // an ice-cream cone with a face
      `<path d="M30 48 L50 92 L70 48 Z" fill="#e9b872" ${I}/><path d="M36 58 L60 58 M40 68 L58 68" stroke="#2b2b2b" stroke-width="2.5"/><circle cx="50" cy="36" r="24" fill="#ff8fab" ${I}/>${eye(42, 34)}${eye(58, 34)}<path d="M44 44 Q50 49 56 44" fill="none" ${I} stroke-width="3"/><path d="M26 44 Q38 54 50 46 Q62 54 74 44" fill="#ff8fab" ${I} stroke-width="3"/>`,
      // a kite
      `<path d="M50 8 L80 40 L50 76 L20 40 Z" fill="#06d6a0" ${I}/><path d="M50 8 V76 M20 40 H80" stroke="#2b2b2b" stroke-width="3"/><path d="M50 8 L80 40 L50 40 Z M20 40 L50 76 L50 40 Z" fill="#ffd166" ${I} stroke-width="3"/><path d="M50 76 Q40 84 50 88 Q60 92 52 98" fill="none" ${I} stroke-width="3"/><path d="M44 84 L52 82 L50 90 Z" fill="#ef476f" ${I} stroke-width="2.5"/>`,
      // a swirly lollipop
      `<rect x="46" y="58" width="8" height="34" rx="4" fill="#fff" ${I}/><circle cx="50" cy="38" r="28" fill="#ffd166" ${I}/><path d="M50 38 a4 4 0 0 1 8 0 a8 8 0 0 1 -16 0 a12 12 0 0 1 24 0 a16 16 0 0 1 -32 0 a20 20 0 0 1 40 0" fill="none" stroke="#ef476f" stroke-width="5" stroke-linecap="round"/>`,
      // a magic wand with a star
      `<path d="M18 86 L56 46" ${I} stroke-width="10"/><path d="M18 86 L56 46" stroke="#9b5de5" stroke-width="4"/><path d="M64 10 L71 28 L90 30 L76 42 L80 61 L64 51 L48 61 L52 42 L38 30 L57 28 Z" fill="#ffd166" ${I}/><circle cx="30" cy="30" r="4" fill="#fff" ${I} stroke-width="2"/><circle cx="86" cy="76" r="4" fill="#fff" ${I} stroke-width="2"/>`,
      // a party popper with confetti
      `<path d="M14 88 L34 40 L62 68 Z" fill="#4cc9f0" ${I}/><path d="M22 70 L44 78 M28 56 L52 66" stroke="#ffd166" stroke-width="5"/><path d="M14 88 L34 40 L62 68 Z" fill="none" ${I}/><circle cx="58" cy="26" r="6" fill="#ef476f" ${I} stroke-width="3"/><circle cx="80" cy="44" r="6" fill="#06d6a0" ${I} stroke-width="3"/><path d="M72 14 L78 20 M86 24 L80 28 M50 10 L52 18" ${I} stroke="#9b5de5" stroke-width="5"/><path d="M62 42 L70 34" ${I} stroke="#ffd166" stroke-width="5"/>`,
    ],
  };
  const NAMES = {
    bike: ['Helmet', 'Wheel', 'Hot Flame', 'Gold Cup'], rc: ['Zoom Car', 'Remote', 'Traffic Light', 'Finish Flag'],
    hoops: ['Ball', 'Hoop', 'Sneaker', 'On Fire!'], archery: ['Target', 'Arrow', 'Balloon', 'Archer Hat'],
    jungle: ['Leaf', 'Banana', 'Lantern', 'Big Balloon'], trail: ['Treasure', 'Map', 'Compass', 'Happy Hippo'],
    space: ['Rocket', 'Planet', 'Space Friend', 'Shooting Star'], abc: ['A Block', 'Number 3', 'Pencil', 'Teacher'],
    coloring: ['Crayon', 'Palette', 'Paintbrush', 'Rainbow'], maze: ['Key', 'Gem', 'Flower', 'Busy Bee'],
    fishing: ['Fish', 'Bobber', 'Starfish', 'Shell'], piano: ['Music Note', 'Piano', 'Drum', 'Songbird'],
    golf: ['Golf Ball', 'Flag', 'Putter', 'Windmill'], quest: ['Potion', 'Shield', 'Wizard Hat', 'Blob King'],
    arcade: ['Joystick', 'Crown', 'Trophy Pile', 'My House'],
    surprise: ['Present', 'Cupcake', 'Party Hat', 'Ice Cream', 'Kite', 'Lollipop', 'Magic Wand', 'Party Popper'],
  };

  // ---- how each sticker is earned (rec = that game's save in Arcade.store) ----
  const levelsOf = (rec) => Object.values(rec.levels || {});
  const doneCount = (rec) => levelsOf(rec).filter(l => l.done).length;
  const RULES = [
    (rec) => levelsOf(rec).length > 0 || (rec.achievements || []).length > 0,        // played
    (rec) => doneCount(rec) > 0,                                                       // won a level
    (rec) => levelsOf(rec).some(l => (l.stars || 0) >= 3),                             // 3 stars
    (rec) => (rec.achievements || []).length >= 3 || doneCount(rec) >= 5,             // super player
  ];
  // the coloring book: pictures in the gallery (1, 3, 6, 12)
  const PICTURES = [1, 3, 6, 12];
  const HINTS = ['play', 'win', 'stars', 'super'];

  const list = [];
  for (const gm of GAMES) {
    for (let k = 0; k < 4; k++) {
      const pics = gm.id === 'coloring' ? PICTURES[k] : 0;
      list.push({
        id: gm.id + '-' + k, game: gm.id, k, name: NAMES[gm.id][k], color: gm.color, icon: ICONS[gm.id][k],
        hint: pics ? 'pics' : HINTS[k], pics,
        test: (d) => {
          const rec = (d.games || {})[gm.id] || {};
          return pics ? levelsOf(rec).length >= pics : RULES[k](rec);
        },
      });
    }
  }
  // arcade stickers: play 3 games, play every game, 10 trophies, buy something for your house
  const played = (d) => GAMES.filter(gm => RULES[0]((d.games || {})[gm.id] || {})).length;
  const trophies = (d) => Object.values(d.games || {}).reduce((n, r) => n + (r.achievements || []).length, 0);
  const ARCADE_RULES = [(d) => played(d) >= 3, (d) => played(d) >= GAMES.length, (d) => trophies(d) >= 10, (d) => ((d.house || {}).spent || 0) > 0];   // (the last one: bought something for your house)
  const ARCADE_HINTS = ['games3', 'gamesAll', 'trophies10', 'house'];
  ARCADE_RULES.forEach((test, k) => list.push({ id: 'arcade-' + k, game: 'arcade', k, name: NAMES.arcade[k], color: '#ff5fa2', icon: ICONS.arcade[k], hint: ARCADE_HINTS[k], test }));
  // Daily Surprise stickers: the 1st surprise you finish gives the Present, the 2nd the Cupcake...
  // (k = the sticker's shape: round, square, flower, heart, then round again)
  const SURPRISE_COLORS = ['#ffb703', '#ff8fab', '#c77dff', '#ffafcc', '#90e0ef', '#ffd166', '#b8c0ff', '#80ed99'];
  ICONS.surprise.forEach((icon, i) => list.push({ id: 'surprise-' + i, game: 'surprise', k: i % 4, n: i + 1, name: NAMES.surprise[i], color: SURPRISE_COLORS[i], icon, hint: 'surprise',
    test: (d) => ((d.daily || {}).total || 0) >= i + 1 }));

  // ---- sticker shapes: round, rounded square, flower (scalloped), heart ----
  function shapePath(k) {
    if (k === 0) return 'M50 4 A46 46 0 1 1 49.9 4 Z';
    if (k === 1) return 'M22 6 H78 Q94 6 94 22 V78 Q94 94 78 94 H22 Q6 94 6 78 V22 Q6 6 22 6 Z';
    if (k === 2) {     // a flower: 12 round bumps
      let d = '';
      // (control points on the outer ring, ends on the inner ring)
      for (let i = 0; i < 12; i++) {
        const a0 = -Math.PI / 2 + Math.PI * 2 * i / 12, a1 = a0 + Math.PI * 2 / 12, am = (a0 + a1) / 2;
        const p = (a, r) => (50 + Math.cos(a) * r).toFixed(1) + ' ' + (50 + Math.sin(a) * r).toFixed(1);
        if (!i) d += 'M' + p(a0, 40);
        d += ' Q' + p(am, 54) + ' ' + p(a1, 40);
      }
      return d + ' Z';
    }
    return 'M50 92 C14 66 2 44 10 26 C18 8 42 6 50 24 C58 6 82 8 90 26 C98 44 86 66 50 92 Z';   // heart
  }
  // little "how to get it" pictures for stickers you don't have yet
  const S = (x) => `<svg viewBox="0 0 48 48">${x}</svg>`;
  const STAR = (x, y, r, f = '#ffd166') => `<path d="${Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + Math.PI * i / 5, rr = i % 2 ? r * 0.45 : r; return (i ? 'L' : 'M') + (x + Math.cos(a) * rr).toFixed(1) + ' ' + (y + Math.sin(a) * rr).toFixed(1); }).join(' ')} Z" fill="${f}" stroke="#2b2b2b" stroke-width="2.5" stroke-linejoin="round"/>`;
  const HINT_PICS = {
    play: S(`<circle cx="24" cy="24" r="20" fill="#06d6a0" stroke="#2b2b2b" stroke-width="4"/><path d="M19 14 L33 24 L19 34 Z" fill="#2b2b2b"/>`),
    win: S(`<path d="M12 44 V6" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/><path d="M13 8 H40 V26 H13 Z" fill="#fff" stroke="#2b2b2b" stroke-width="3"/><path d="M13 8 h7 v6 h-7 Z M27 8 h7 v6 h-7 Z M20 14 h7 v6 h-7 Z M34 14 h6 v6 h-6 Z M13 20 h7 v6 h-7 Z M27 20 h7 v6 h-7 Z" fill="#2b2b2b"/>`),
    stars: S(STAR(10, 26, 9) + STAR(24, 18, 11) + STAR(38, 26, 9)),
    super: S(`<path d="M14 6 H34 V18 A10 10 0 0 1 14 18 Z" fill="#ffc93c" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/><rect x="20" y="28" width="8" height="8" fill="#ffc93c" stroke="#2b2b2b" stroke-width="3"/><rect x="12" y="36" width="24" height="8" rx="2" fill="#8d5524" stroke="#2b2b2b" stroke-width="3"/>` + STAR(40, 10, 7)),
    pics: S(`<rect x="6" y="8" width="36" height="32" rx="4" fill="#fff" stroke="#2b2b2b" stroke-width="3.5"/><circle cx="18" cy="20" r="5" fill="#ef476f"/><path d="M8 38 L20 26 L28 32 L34 26 L40 34 V38 Z" fill="#06d6a0" stroke="#2b2b2b" stroke-width="2.5" stroke-linejoin="round"/>`),
    games3: S(`<rect x="4" y="14" width="12" height="20" rx="3" fill="#ef476f" stroke="#2b2b2b" stroke-width="3"/><rect x="18" y="14" width="12" height="20" rx="3" fill="#ffd166" stroke="#2b2b2b" stroke-width="3"/><rect x="32" y="14" width="12" height="20" rx="3" fill="#4cc9f0" stroke="#2b2b2b" stroke-width="3"/>`),
    gamesAll: S([0, 1, 2, 3].map(r => [0, 1, 2].map(c => `<rect x="${6 + c * 13}" y="${3 + r * 11}" width="10" height="9" rx="2" fill="${['#ef476f', '#ffd166', '#06d6a0', '#4cc9f0'][(r + c) % 4]}" stroke="#2b2b2b" stroke-width="2"/>`).join('')).join('')),
    trophies10: S(`<path d="M8 8 H24 V18 A8 8 0 0 1 8 18 Z" fill="#ffc93c" stroke="#2b2b2b" stroke-width="3"/><rect x="10" y="30" width="12" height="6" rx="2" fill="#8d5524" stroke="#2b2b2b" stroke-width="2.5"/><path d="M16 26 V30" stroke="#2b2b2b" stroke-width="3"/><text x="36" y="30" font-size="17" font-weight="900" text-anchor="middle" fill="#2b2b2b" font-family="Arial Black, sans-serif">10</text>`),
    surprise: S(`<rect x="9" y="22" width="30" height="21" rx="3" fill="#ef476f" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/><path d="M24 22 V43" stroke="#ffd166" stroke-width="5"/><rect x="6" y="15" width="36" height="9" rx="3" fill="#ff8fab" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/><path d="M24 15 V24" stroke="#ffd166" stroke-width="5"/><path d="M24 15 C16 3 8 9 16 15 M24 15 C32 3 40 9 32 15" fill="none" stroke="#2b2b2b" stroke-width="3.5" stroke-linecap="round"/>`),
    house: S(`<path d="M6 22 L24 6 L42 22" fill="none" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 20 V42 H38 V20 L24 9 Z" fill="#ffd166" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/><rect x="20" y="28" width="8" height="14" fill="#ef476f" stroke="#2b2b2b" stroke-width="2.5"/>`),
  };

  // The picture of one sticker: a white die-cut edge, a colored middle, the
  // drawing, and a shine. Locked = a pale dotted outline with a "?".
  let uid = 0;
  function svg(st, locked, cls = '') {
    const d = shapePath(st.k);
    const heart = st.k === 3;
    if (locked) {
      return `<svg class="${cls}" viewBox="-4 -4 108 108" aria-hidden="true"><path d="${d}" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.75)" stroke-width="4" stroke-dasharray="8 7"/>` +
        `<text x="50" y="${heart ? 60 : 66}" font-size="44" font-weight="900" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="Arial Black, sans-serif">?</text></svg>`;
    }
    const id = 'stk' + (uid++);
    const mid = Arcade.mixWhite(st.color, 0.35);
    return `<svg class="${cls}" viewBox="-4 -4 108 108" aria-label="${st.name}"><defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs>` +
      `<path d="${d}" fill="#fff" stroke="#2b2b2b" stroke-width="4" transform="translate(2 4)" opacity="0.25"/>` +
      `<path d="${d}" fill="#fff" stroke="#2b2b2b" stroke-width="4"/>` +
      `<path d="${d}" fill="${mid}" transform="translate(50 50) scale(0.84) translate(-50 -50)"/>` +
      `<g transform="translate(50 ${heart ? 46 : 50}) scale(${heart ? 0.58 : 0.7}) translate(-50 -50)">${st.icon}</g>` +
      `<g clip-path="url(#${id})"><path d="M-10 30 L30 -10 L44 -10 L-10 44 Z" fill="#fff" opacity="0.35"/></g></svg>`;
  }

  // ---- this player's stickers ----
  const box = () => { const d = Arcade.store.load(); if (!d.stickers) d.stickers = {}; d.stickers.have = d.stickers.have || []; d.stickers.seen = d.stickers.seen || []; return d.stickers; };
  const has = (id) => box().have.includes(id);
  // Look for newly earned stickers. Returns the new ones (and shows a toast unless quiet).
  function check(quiet) {
    const d = Arcade.store.load(), b = box();
    const fresh = list.filter(st => !b.have.includes(st.id) && st.test(d));
    if (!fresh.length) return [];
    fresh.forEach(st => b.have.push(st.id));
    Arcade.store.save();
    if (!quiet) {
      // one toast at a time, a moment apart (so a trophy toast is seen first)
      fresh.forEach((st, i) => setTimeout(() => { Arcade.toast('New sticker!', svg(st, false, 'ar-stk')); Arcade.sfx('star'); }, 900 + i * 2800));
    }
    return fresh;
  }
  const unseen = () => box().have.filter(id => !box().seen.includes(id));
  function markSeen() { const b = box(); b.seen = b.have.slice(); Arcade.store.save(); }
  // trophies earned in every game together (the house's coins come from these)
  const trophyCount = () => trophies(Arcade.store.load());

  Arcade.stickers = { list, games: GAMES, svg, hintPic: (st) => HINT_PICS[st.hint], check, has, unseen, markSeen,
    count: () => box().have.filter(id => list.some(s => s.id === id)).length, trophyCount };
})();
