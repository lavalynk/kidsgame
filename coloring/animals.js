// The coloring book's animals.
// Each animal is an SVG drawn on a 400 x 400 canvas.
// Any shape with class="region" can be tapped and filled with color.
// Shapes WITHOUT that class (eyes, mouths, whiskers) stay as they are.
// Shapes are drawn back-to-front, so put things that sit "behind" first.
//
// To add an animal: copy one of these blocks, give it a new id, and draw it.

window.ANIMALS = [
  {
    id: 'cat',
    name: 'Cat',
    svg: `
      <path class="region" d="M285 300 Q375 285 352 200 Q346 178 328 190 Q345 262 282 272 Z"/>
      <ellipse class="region" cx="200" cy="290" rx="95" ry="80"/>
      <ellipse class="region" cx="160" cy="362" rx="32" ry="18"/>
      <ellipse class="region" cx="240" cy="362" rx="32" ry="18"/>
      <polygon class="region" points="118,132 132,48 188,104"/>
      <polygon class="region" points="282,132 268,48 212,104"/>
      <circle class="region" cx="200" cy="162" r="85"/>
      <circle cx="168" cy="150" r="14" class="ink"/>
      <circle cx="232" cy="150" r="14" class="ink"/>
      <circle cx="173" cy="145" r="4" class="shine"/>
      <circle cx="237" cy="145" r="4" class="shine"/>
      <polygon class="region" points="188,180 212,180 200,194"/>
      <path class="line" d="M200 194 Q190 210 176 202 M200 194 Q210 210 224 202"/>
      <path class="line" d="M150 185 L95 175 M150 195 L95 200 M250 185 L305 175 M250 195 L305 200"/>
    `
  },
  {
    id: 'fish',
    name: 'Fish',
    svg: `
      <circle class="region" cx="70" cy="95" r="14"/>
      <circle class="region" cx="45" cy="55" r="9"/>
      <polygon class="region" points="300,200 382,128 382,272"/>
      <path class="region" d="M140 130 Q195 45 270 130 Z"/>
      <path class="region" d="M165 270 Q200 335 240 270 Z"/>
      <ellipse class="region" cx="200" cy="200" rx="130" ry="85"/>
      <clipPath id="fish-body"><ellipse cx="200" cy="200" rx="130" ry="85"/></clipPath>
      <path class="region" clip-path="url(#fish-body)" d="M225 120 Q205 200 225 280 L262 268 Q244 200 262 132 Z"/>
      <path class="region" clip-path="url(#fish-body)" d="M160 117 Q140 200 160 283 L185 285 Q166 200 185 115 Z"/>
      <ellipse cx="200" cy="200" rx="130" ry="85" class="outline"/>
      <circle class="region" cx="118" cy="180" r="20"/>
      <circle cx="113" cy="180" r="9" class="ink"/>
      <path class="line" d="M78 218 Q92 228 106 214"/>
    `
  },
  {
    id: 'bird',
    name: 'Bird',
    svg: `
      <rect class="region" x="20" y="366" width="360" height="24" rx="12"/>
      <path class="line" d="M170 320 L164 370 M222 320 L228 370"/>
      <polygon class="region" points="102,248 26,214 38,296"/>
      <ellipse class="region" cx="190" cy="250" rx="110" ry="80"/>
      <path class="region" d="M140 232 Q205 172 268 242 Q205 300 140 232 Z"/>
      <path class="region" d="M258 108 Q256 62 284 90 Q302 54 308 106 Z"/>
      <circle class="region" cx="282" cy="160" r="60"/>
      <polygon class="region" points="336,148 388,166 336,184"/>
      <circle cx="298" cy="148" r="10" class="ink"/>
      <circle cx="301" cy="145" r="3" class="shine"/>
    `
  }
];
