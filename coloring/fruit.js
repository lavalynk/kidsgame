// The coloring book's FRUIT tab (fruit and veggies; every fruit gets a happy face).
// Every page is plain HTML: a list of <i> shapes on a 400 x 400 grid, back to front.
// coloring/pages.css explains the shapes (--cx --cy = center, --w --h = size,
// --r or --k = rounding, --rot = tilt; class r = colorable, d = dark detail,
// d w = white shine dot, ln = a curved line, ln up = curved the other way).
//
// ART STYLE (Keith's rules, see CLAUDE.md): simple, cute, thick black outlines,
// big simple shapes filling the page, a sky to color (class "r bg"), at most a
// ground strip or a cloud, NO SUNS. Faces: big dark eyes with white shine dots,
// colorable cheeks, a simple smile. 7-18 colorable shapes (22 at most), none tiny. One subject, no extras.
//
// To add a page: copy a block, give it a new id, and place the shapes.

window.PAGES = window.PAGES || [];
window.PAGES.push(
  {
    id: 'apple', group: 'fruit',
    name: 'Apple',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:350;--w:260;--h:44"></i>
      <i class="r" style="--cx:206;--cy:92;--w:22;--h:72;--k:11;--rot:12deg"></i>
      <i class="r" style="--cx:200;--cy:224;--w:268;--h:240;--r:50% 50% 40% 40% / 44% 44% 56% 56%"></i>
      <i class="ln up" style="--cx:200;--cy:134;--w:56;--h:34"></i>
      <i class="r" style="--cx:258;--cy:68;--w:86;--h:50;--r:100% 0 100% 0"></i>
      <i class="d" style="--cx:261;--cy:64;--w:81;--h:8;--k:4;--rot:-16deg"></i>
      <i class="r" style="--cx:128;--cy:166;--w:30;--h:56;--rot:30deg"></i>
      <i class="r" style="--cx:140;--cy:250;--w:36;--h:22"></i>
      <i class="r" style="--cx:260;--cy:250;--w:36;--h:22"></i>
      <i class="d" style="--cx:166;--cy:214;--w:28;--h:28"></i>
      <i class="d w" style="--cx:171;--cy:208;--w:10;--h:10"></i>
      <i class="d" style="--cx:234;--cy:214;--w:28;--h:28"></i>
      <i class="d w" style="--cx:239;--cy:208;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:254;--w:48;--h:32"></i>
    `
  },
  {
    id: 'banana', group: 'fruit',
    name: 'Banana',
    // The banana's curve is one SVG path (class "r p", see pages.css): rounded boxes can't bend like a banana.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:356;--w:300;--h:42"></i>
      <i class="r" style="--cx:340;--cy:76;--w:28;--h:62;--k:10;--rot:22deg"></i>
      <i class="r p" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"><svg viewBox="0 0 400 400"><path d="M40 222 C90 382 330 322 348 112 C346 98 334 92 320 98 C270 212 110 252 40 222 Z"/></svg></i>
      <i class="d" style="--cx:46;--cy:224;--w:22;--h:16;--rot:20deg"></i>
      <i class="r" style="--cx:104;--cy:276;--w:24;--h:52;--rot:-56deg"></i>
      <i class="r" style="--cx:180;--cy:262;--w:32;--h:20"></i>
      <i class="r" style="--cx:290;--cy:232;--w:32;--h:20"></i>
      <i class="d" style="--cx:210;--cy:232;--w:26;--h:30"></i>
      <i class="d w" style="--cx:215;--cy:225;--w:9;--h:9"></i>
      <i class="d" style="--cx:258;--cy:218;--w:26;--h:30"></i>
      <i class="d w" style="--cx:263;--cy:211;--w:9;--h:9"></i>
      <i class="ln" style="--cx:240;--cy:252;--w:40;--h:24;--rot:-16deg"></i>
    `
  },
  {
    id: 'strawberry', group: 'fruit',
    name: 'Strawberry',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:360;--w:220;--h:40"></i>
      <i class="r" style="--cx:200;--cy:236;--w:264;--h:244;--r:50% 50% 50% 50% / 36% 36% 64% 64%"></i>
      <i class="r" style="--cx:206;--cy:86;--w:22;--h:56;--k:11;--rot:10deg"></i>
      <i class="r" style="--cx:160;--cy:124;--w:88;--h:36;--r:0 100% 0 100%;--rot:-10deg"></i>
      <i class="r" style="--cx:240;--cy:124;--w:88;--h:36;--r:100% 0 100% 0;--rot:10deg"></i>
      <i class="r" style="--cx:200;--cy:122;--w:48;--h:40"></i>
      <i class="d" style="--cx:128;--cy:186;--w:10;--h:16"></i>
      <i class="d" style="--cx:272;--cy:186;--w:10;--h:16"></i>
      <i class="d" style="--cx:110;--cy:236;--w:10;--h:16"></i>
      <i class="d" style="--cx:290;--cy:236;--w:10;--h:16"></i>
      <i class="d" style="--cx:150;--cy:300;--w:10;--h:16"></i>
      <i class="d" style="--cx:250;--cy:300;--w:10;--h:16"></i>
      <i class="d" style="--cx:200;--cy:322;--w:10;--h:16"></i>
      <i class="d" style="--cx:200;--cy:168;--w:10;--h:16"></i>
      <i class="r" style="--cx:146;--cy:250;--w:34;--h:20"></i>
      <i class="r" style="--cx:254;--cy:250;--w:34;--h:20"></i>
      <i class="d" style="--cx:170;--cy:214;--w:26;--h:26"></i>
      <i class="d w" style="--cx:175;--cy:208;--w:10;--h:10"></i>
      <i class="d" style="--cx:230;--cy:214;--w:26;--h:26"></i>
      <i class="d w" style="--cx:235;--cy:208;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:252;--w:40;--h:30"></i>
    `
  },
  {
    id: 'pear', group: 'fruit',
    name: 'Pear',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:360;--w:240;--h:40"></i>
      <i class="r" style="--cx:204;--cy:74;--w:22;--h:56;--k:11;--rot:8deg"></i>
      <i class="r" style="--cx:200;--cy:226;--w:240;--h:272;--r:50% 50% 50% 50% / 66% 66% 34% 34%"></i>
      <i class="r" style="--cx:254;--cy:62;--w:80;--h:40;--r:100% 0 100% 0"></i>
      <i class="r" style="--cx:144;--cy:296;--w:34;--h:20"></i>
      <i class="r" style="--cx:256;--cy:296;--w:34;--h:20"></i>
      <i class="d" style="--cx:170;--cy:262;--w:26;--h:26"></i>
      <i class="d w" style="--cx:175;--cy:256;--w:10;--h:10"></i>
      <i class="d" style="--cx:230;--cy:262;--w:26;--h:26"></i>
      <i class="d w" style="--cx:235;--cy:256;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:298;--w:40;--h:30"></i>
    `
  },
  {
    id: 'cherries', group: 'fruit',
    name: 'Cherries',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:360;--w:300;--h:40"></i>
      <i class="ln up" style="--cx:177;--cy:148;--w:165;--h:33;--rot:-63deg"></i>
      <i class="ln up" style="--cx:238;--cy:153;--w:165;--h:22;--rot:73deg"></i>
      <i class="r" style="--cx:262;--cy:68;--w:92;--h:46;--r:100% 0 100% 0"></i>
      <i class="d" style="--cx:263;--cy:67;--w:87;--h:8;--k:4;--rot:-10deg"></i>
      <i class="r" style="--cx:136;--cy:284;--w:140;--h:140"></i>
      <i class="r" style="--cx:268;--cy:292;--w:132;--h:132"></i>
      <i class="r" style="--cx:107;--cy:249;--w:24;--h:40;--rot:30deg"></i>
      <i class="r" style="--cx:241;--cy:257;--w:24;--h:40;--rot:30deg"></i>
      <i class="d" style="--cx:118;--cy:284;--w:20;--h:20"></i>
      <i class="d w" style="--cx:121;--cy:280;--w:7;--h:7"></i>
      <i class="d" style="--cx:156;--cy:284;--w:20;--h:20"></i>
      <i class="d w" style="--cx:159;--cy:280;--w:7;--h:7"></i>
      <i class="ln" style="--cx:137;--cy:310;--w:26;--h:20"></i>
      <i class="d" style="--cx:252;--cy:294;--w:20;--h:20"></i>
      <i class="d w" style="--cx:255;--cy:290;--w:7;--h:7"></i>
      <i class="d" style="--cx:288;--cy:294;--w:20;--h:20"></i>
      <i class="d w" style="--cx:291;--cy:290;--w:7;--h:7"></i>
      <i class="ln" style="--cx:270;--cy:318;--w:24;--h:20"></i>
    `
  },
  {
    id: 'orange', group: 'fruit',
    name: 'Orange',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:360;--w:260;--h:40"></i>
      <i class="r" style="--cx:200;--cy:216;--w:272;--h:272"></i>
      <i class="r" style="--cx:250;--cy:68;--w:86;--h:44;--r:100% 0 100% 0"></i>
      <i class="d" style="--cx:251;--cy:69;--w:81;--h:8;--k:4;--rot:-17deg"></i>
      <i class="r" style="--cx:198;--cy:86;--w:24;--h:24"></i>
      <i class="r" style="--cx:126;--cy:150;--w:32;--h:62;--rot:30deg"></i>
      <i class="d" style="--cx:290;--cy:170;--w:8;--h:8"></i>
      <i class="d" style="--cx:306;--cy:200;--w:8;--h:8"></i>
      <i class="d" style="--cx:286;--cy:300;--w:8;--h:8"></i>
      <i class="d" style="--cx:110;--cy:290;--w:8;--h:8"></i>
      <i class="d" style="--cx:130;--cy:320;--w:8;--h:8"></i>
      <i class="d" style="--cx:270;--cy:324;--w:8;--h:8"></i>
      <i class="r" style="--cx:142;--cy:254;--w:36;--h:22"></i>
      <i class="r" style="--cx:258;--cy:254;--w:36;--h:22"></i>
      <i class="d" style="--cx:168;--cy:216;--w:28;--h:28"></i>
      <i class="d w" style="--cx:173;--cy:210;--w:10;--h:10"></i>
      <i class="d" style="--cx:232;--cy:216;--w:28;--h:28"></i>
      <i class="d w" style="--cx:237;--cy:210;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:256;--w:48;--h:32"></i>
    `
  },
  {
    id: 'watermelon', group: 'fruit',
    name: 'Watermelon',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:330;--w:300;--h:44"></i>
      <i class="r" style="--cx:200;--cy:230;--w:320;--h:180;--r:0 0 50% 50% / 0 0 100% 100%"></i>
      <i class="r" style="--cx:200;--cy:218;--w:272;--h:156;--r:0 0 50% 50% / 0 0 100% 100%"></i>
      <i class="r" style="--cx:200;--cy:208;--w:232;--h:136;--r:0 0 50% 50% / 0 0 100% 100%"></i>
      <i class="d" style="--cx:118;--cy:178;--w:12;--h:18"></i>
      <i class="d" style="--cx:282;--cy:178;--w:12;--h:18"></i>
      <i class="d" style="--cx:150;--cy:240;--w:12;--h:18"></i>
      <i class="d" style="--cx:250;--cy:240;--w:12;--h:18"></i>
      <i class="d" style="--cx:200;--cy:254;--w:12;--h:18"></i>
      <i class="r" style="--cx:146;--cy:206;--w:32;--h:20"></i>
      <i class="r" style="--cx:254;--cy:206;--w:32;--h:20"></i>
      <i class="d" style="--cx:172;--cy:176;--w:24;--h:24"></i>
      <i class="d w" style="--cx:176;--cy:171;--w:8;--h:8"></i>
      <i class="d" style="--cx:228;--cy:176;--w:24;--h:24"></i>
      <i class="d w" style="--cx:232;--cy:171;--w:8;--h:8"></i>
      <i class="ln" style="--cx:200;--cy:208;--w:36;--h:28"></i>
    `
  },
  {
    id: 'grapes', group: 'fruit',
    name: 'Grapes',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:358;--w:240;--h:40"></i>
      <i class="r" style="--cx:206;--cy:86;--w:22;--h:56;--k:11;--rot:8deg"></i>
      <i class="r" style="--cx:260;--cy:66;--w:90;--h:44;--r:100% 0 100% 0"></i>
      <i class="d" style="--cx:262;--cy:66;--w:85;--h:8;--k:4;--rot:-9deg"></i>
      <i class="r" style="--cx:200;--cy:288;--w:88;--h:88"></i>
      <i class="r" style="--cx:158;--cy:222;--w:88;--h:88"></i>
      <i class="r" style="--cx:242;--cy:222;--w:88;--h:88"></i>
      <i class="r" style="--cx:116;--cy:150;--w:88;--h:88"></i>
      <i class="r" style="--cx:200;--cy:150;--w:88;--h:88"></i>
      <i class="r" style="--cx:284;--cy:150;--w:88;--h:88"></i>
      <i class="d" style="--cx:184;--cy:146;--w:20;--h:20"></i>
      <i class="d w" style="--cx:188;--cy:141;--w:6;--h:6"></i>
      <i class="d" style="--cx:216;--cy:146;--w:20;--h:20"></i>
      <i class="d w" style="--cx:220;--cy:141;--w:6;--h:6"></i>
      <i class="ln" style="--cx:200;--cy:166;--w:24;--h:20"></i>
    `
  },
  {
    id: 'pineapple', group: 'fruit',
    name: 'Pineapple',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:362;--w:240;--h:40"></i>
      <i class="r" style="--cx:150;--cy:118;--w:34;--h:100;--rot:-42deg"></i>
      <i class="r" style="--cx:250;--cy:118;--w:34;--h:100;--rot:42deg"></i>
      <i class="r" style="--cx:182;--cy:96;--w:36;--h:112;--rot:-12deg"></i>
      <i class="r" style="--cx:218;--cy:96;--w:36;--h:112;--rot:12deg"></i>
      <i class="r" style="--cx:200;--cy:254;--w:208;--h:224"></i>
      <i class="ln" style="--cx:140;--cy:186;--w:16;--h:24"></i>
      <i class="ln" style="--cx:260;--cy:186;--w:16;--h:24"></i>
      <i class="ln" style="--cx:200;--cy:166;--w:16;--h:24"></i>
      <i class="ln" style="--cx:120;--cy:246;--w:16;--h:24"></i>
      <i class="ln" style="--cx:280;--cy:246;--w:16;--h:24"></i>
      <i class="ln" style="--cx:144;--cy:316;--w:16;--h:24"></i>
      <i class="ln" style="--cx:256;--cy:316;--w:16;--h:24"></i>
      <i class="ln" style="--cx:200;--cy:336;--w:16;--h:24"></i>
      <i class="r" style="--cx:144;--cy:270;--w:32;--h:20"></i>
      <i class="r" style="--cx:256;--cy:270;--w:32;--h:20"></i>
      <i class="d" style="--cx:170;--cy:236;--w:26;--h:26"></i>
      <i class="d w" style="--cx:174;--cy:231;--w:8;--h:8"></i>
      <i class="d" style="--cx:230;--cy:236;--w:26;--h:26"></i>
      <i class="d w" style="--cx:234;--cy:231;--w:8;--h:8"></i>
      <i class="ln" style="--cx:200;--cy:272;--w:40;--h:30"></i>
    `
  },
  {
    id: 'lemon', group: 'fruit',
    name: 'Lemon',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:350;--w:280;--h:40"></i>
      <i class="r" style="--cx:46;--cy:214;--w:44;--h:34"></i>
      <i class="r" style="--cx:354;--cy:214;--w:44;--h:34"></i>
      <i class="r" style="--cx:200;--cy:214;--w:300;--h:212"></i>
      <i class="r" style="--cx:250;--cy:92;--w:84;--h:44;--r:100% 0 100% 0"></i>
      <i class="r" style="--cx:120;--cy:166;--w:30;--h:56;--rot:40deg"></i>
      <i class="r" style="--cx:144;--cy:230;--w:32;--h:20"></i>
      <i class="r" style="--cx:256;--cy:230;--w:32;--h:20"></i>
      <i class="d" style="--cx:170;--cy:196;--w:26;--h:26"></i>
      <i class="d w" style="--cx:174;--cy:191;--w:8;--h:8"></i>
      <i class="d" style="--cx:230;--cy:196;--w:26;--h:26"></i>
      <i class="d w" style="--cx:234;--cy:191;--w:8;--h:8"></i>
      <i class="ln" style="--cx:200;--cy:232;--w:40;--h:30"></i>
    `
  },
  {
    id: 'carrot', group: 'fruit',
    name: 'Carrot',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:364;--w:220;--h:36"></i>
      <i class="r" style="--cx:172;--cy:80;--w:38;--h:96;--rot:-18deg"></i>
      <i class="r" style="--cx:214;--cy:78;--w:38;--h:98;--rot:8deg"></i>
      <i class="r" style="--cx:256;--cy:104;--w:36;--h:84;--rot:48deg"></i>
      <i class="r" style="--cx:200;--cy:232;--w:176;--h:256;--r:50% 50% 50% 50% / 18% 18% 82% 82%"></i>
      <i class="d" style="--cx:160;--cy:252;--w:28;--h:8;--k:4;--rot:0deg"></i>
      <i class="d" style="--cx:241;--cy:262;--w:26;--h:8;--k:4;--rot:0deg"></i>
      <i class="d" style="--cx:192;--cy:312;--w:24;--h:8;--k:4;--rot:0deg"></i>
      <i class="r" style="--cx:150;--cy:194;--w:32;--h:20"></i>
      <i class="r" style="--cx:242;--cy:194;--w:32;--h:20"></i>
      <i class="d" style="--cx:170;--cy:160;--w:24;--h:24"></i>
      <i class="d w" style="--cx:174;--cy:155;--w:8;--h:8"></i>
      <i class="d" style="--cx:222;--cy:160;--w:24;--h:24"></i>
      <i class="d w" style="--cx:226;--cy:155;--w:8;--h:8"></i>
      <i class="ln" style="--cx:196;--cy:196;--w:40;--h:30"></i>
    `
  },
  {
    id: 'corn', group: 'fruit',
    name: 'Corn',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:366;--w:220;--h:36"></i>
      <i class="r" style="--cx:200;--cy:196;--w:148;--h:300;--r:50% 50% 50% 50% / 36% 36% 64% 64%"></i>
      <i class="d" style="--cx:168;--cy:105;--w:99;--h:8;--k:4;--rot:98deg"></i>
      <i class="d" style="--cx:232;--cy:105;--w:99;--h:8;--k:4;--rot:82deg"></i>
      <i class="d" style="--cx:200;--cy:100;--w:108;--h:8;--k:4;--rot:90deg"></i>
      <i class="ln" style="--cx:200;--cy:100;--w:108;--h:24"></i>
      <i class="ln" style="--cx:200;--cy:140;--w:128;--h:26"></i>
      <i class="r" style="--cx:146;--cy:270;--w:120;--h:170;--r:0 100% 0 100%"></i>
      <i class="r" style="--cx:254;--cy:270;--w:120;--h:170;--r:100% 0 100% 0"></i>
      <i class="r" style="--cx:150;--cy:230;--w:32;--h:20"></i>
      <i class="r" style="--cx:250;--cy:230;--w:32;--h:20"></i>
      <i class="d" style="--cx:172;--cy:196;--w:24;--h:24"></i>
      <i class="d w" style="--cx:176;--cy:191;--w:8;--h:8"></i>
      <i class="d" style="--cx:228;--cy:196;--w:24;--h:24"></i>
      <i class="d w" style="--cx:232;--cy:191;--w:8;--h:8"></i>
      <i class="ln" style="--cx:200;--cy:232;--w:40;--h:30"></i>
    `
  },
  {
    id: 'broccoli', group: 'fruit',
    name: 'Broccoli',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:364;--w:220;--h:36"></i>
      <i class="r" style="--cx:200;--cy:296;--w:74;--h:130;--r:30% 30% 40% 40% / 20% 20% 30% 30%"></i>
      <i class="d" style="--cx:192;--cy:285;--w:42;--h:8;--k:4;--rot:-118deg"></i>
      <i class="d" style="--cx:209;--cy:284;--w:45;--h:8;--k:4;--rot:-61deg"></i>
      <i class="r" style="--cx:114;--cy:149;--w:82;--h:82"></i>
      <i class="r" style="--cx:147;--cy:105;--w:82;--h:82"></i>
      <i class="r" style="--cx:200;--cy:88;--w:82;--h:82"></i>
      <i class="r" style="--cx:253;--cy:105;--w:82;--h:82"></i>
      <i class="r" style="--cx:286;--cy:149;--w:82;--h:82"></i>
      <i class="r" style="--cx:200;--cy:184;--w:212;--h:156"></i>
      <i class="r" style="--cx:150;--cy:194;--w:32;--h:20"></i>
      <i class="r" style="--cx:250;--cy:194;--w:32;--h:20"></i>
      <i class="d" style="--cx:172;--cy:160;--w:24;--h:24"></i>
      <i class="d w" style="--cx:176;--cy:155;--w:8;--h:8"></i>
      <i class="d" style="--cx:228;--cy:160;--w:24;--h:24"></i>
      <i class="d w" style="--cx:232;--cy:155;--w:8;--h:8"></i>
      <i class="ln" style="--cx:200;--cy:196;--w:40;--h:30"></i>
    `
  },
  {
    id: 'peach', group: 'fruit',
    name: 'Peach',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:354;--w:260;--h:40"></i>
      <i class="r" style="--cx:204;--cy:92;--w:20;--h:50;--k:10;--rot:10deg"></i>
      <i class="r" style="--cx:254;--cy:78;--w:94;--h:46;--r:100% 0 100% 0"></i>
      <i class="r" style="--cx:152;--cy:88;--w:84;--h:40;--r:0 100% 0 100%"></i>
      <i class="r" style="--cx:200;--cy:228;--w:268;--h:232;--r:50% 50% 50% 50% / 46% 46% 54% 54%"></i>
      <i class="d" style="--cx:193;--cy:148;--w:62;--h:8;--k:4;--rot:105deg"></i>
      <i class="r" style="--cx:284;--cy:176;--w:28;--h:56;--rot:-30deg"></i>
      <i class="d" style="--cx:160;--cy:212;--w:28;--h:28"></i>
      <i class="d w" style="--cx:165;--cy:207;--w:8;--h:8"></i>
      <i class="d" style="--cx:240;--cy:212;--w:28;--h:28"></i>
      <i class="d w" style="--cx:245;--cy:207;--w:8;--h:8"></i>
      <i class="r" style="--cx:138;--cy:250;--w:34;--h:20"></i>
      <i class="r" style="--cx:262;--cy:250;--w:34;--h:20"></i>
      <i class="ln" style="--cx:200;--cy:248;--w:52;--h:34"></i>
    `
  },
  {
    id: 'kiwi', group: 'fruit',
    name: 'Kiwi',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:360;--w:280;--h:40"></i>
      <i class="r" style="--cx:200;--cy:214;--w:336;--h:300"></i>
      <i class="r" style="--cx:200;--cy:214;--w:272;--h:240"></i>
      <i class="r" style="--cx:200;--cy:214;--w:160;--h:132"></i>
      <i class="d" style="--cx:302;--cy:214;--w:10;--h:20;--rot:90deg"></i>
      <i class="d" style="--cx:294;--cy:248;--w:10;--h:20;--rot:112deg"></i>
      <i class="d" style="--cx:272;--cy:276;--w:10;--h:20;--rot:135deg"></i>
      <i class="d" style="--cx:239;--cy:295;--w:10;--h:20;--rot:158deg"></i>
      <i class="d" style="--cx:200;--cy:302;--w:10;--h:20;--rot:180deg"></i>
      <i class="d" style="--cx:161;--cy:295;--w:10;--h:20;--rot:-158deg"></i>
      <i class="d" style="--cx:128;--cy:276;--w:10;--h:20;--rot:-135deg"></i>
      <i class="d" style="--cx:106;--cy:248;--w:10;--h:20;--rot:-112deg"></i>
      <i class="d" style="--cx:98;--cy:214;--w:10;--h:20;--rot:-90deg"></i>
      <i class="d" style="--cx:106;--cy:180;--w:10;--h:20;--rot:-68deg"></i>
      <i class="d" style="--cx:128;--cy:152;--w:10;--h:20;--rot:-45deg"></i>
      <i class="d" style="--cx:161;--cy:133;--w:10;--h:20;--rot:-22deg"></i>
      <i class="d" style="--cx:200;--cy:126;--w:10;--h:20"></i>
      <i class="d" style="--cx:239;--cy:133;--w:10;--h:20;--rot:22deg"></i>
      <i class="d" style="--cx:272;--cy:152;--w:10;--h:20;--rot:45deg"></i>
      <i class="d" style="--cx:294;--cy:180;--w:10;--h:20;--rot:68deg"></i>
      <i class="d" style="--cx:176;--cy:200;--w:24;--h:24"></i>
      <i class="d w" style="--cx:181;--cy:195;--w:8;--h:8"></i>
      <i class="d" style="--cx:224;--cy:200;--w:24;--h:24"></i>
      <i class="d w" style="--cx:229;--cy:195;--w:8;--h:8"></i>
      <i class="r" style="--cx:160;--cy:226;--w:34;--h:20"></i>
      <i class="r" style="--cx:240;--cy:226;--w:34;--h:20"></i>
      <i class="ln" style="--cx:200;--cy:222;--w:28;--h:22"></i>
    `
  },
  {
    id: 'avocado', group: 'fruit',
    name: 'Avocado',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:370;--w:260;--h:36"></i>
      <i class="r" style="--cx:200;--cy:47;--w:20;--h:34;--k:8"></i>
      <i class="r" style="--cx:200;--cy:210;--w:248;--h:316;--r:50% 50% 50% 50% / 62% 62% 38% 38%"></i>
      <i class="r" style="--cx:200;--cy:216;--w:204;--h:260;--r:50% 50% 50% 50% / 62% 62% 38% 38%"></i>
      <i class="r" style="--cx:200;--cy:280;--w:104;--h:104"></i>
      <i class="r" style="--cx:180;--cy:258;--w:22;--h:40;--rot:40deg"></i>
      <i class="d" style="--cx:178;--cy:172;--w:24;--h:24"></i>
      <i class="d w" style="--cx:182;--cy:167;--w:8;--h:8"></i>
      <i class="d" style="--cx:222;--cy:172;--w:24;--h:24"></i>
      <i class="d w" style="--cx:226;--cy:167;--w:8;--h:8"></i>
      <i class="r" style="--cx:152;--cy:198;--w:30;--h:18"></i>
      <i class="r" style="--cx:248;--cy:198;--w:30;--h:18"></i>
      <i class="ln" style="--cx:200;--cy:196;--w:28;--h:22"></i>
    `
  },
  {
    id: 'mushroom', group: 'fruit',
    name: 'Mushroom',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:226"></i>
      <i class="r" style="--cx:200;--cy:296;--w:140;--h:112;--r:30% 30% 20% 20% / 20% 20% 20% 20%"></i>
      <i class="r" style="--cx:200;--cy:160;--w:312;--h:208;--r:50% 50% 14% 14% / 92% 92% 8% 8%"></i>
      <i class="r" style="--cx:106;--cy:196;--w:44;--h:44"></i>
      <i class="r" style="--cx:158;--cy:124;--w:50;--h:50"></i>
      <i class="r" style="--cx:242;--cy:124;--w:50;--h:50"></i>
      <i class="r" style="--cx:294;--cy:196;--w:44;--h:44"></i>
      <i class="r" style="--cx:200;--cy:200;--w:60;--h:60"></i>
      <i class="d" style="--cx:176;--cy:292;--w:22;--h:22"></i>
      <i class="d w" style="--cx:180;--cy:287;--w:8;--h:8"></i>
      <i class="d" style="--cx:224;--cy:292;--w:22;--h:22"></i>
      <i class="d w" style="--cx:228;--cy:287;--w:8;--h:8"></i>
      <i class="r" style="--cx:156;--cy:316;--w:26;--h:16"></i>
      <i class="r" style="--cx:244;--cy:316;--w:26;--h:16"></i>
      <i class="ln" style="--cx:200;--cy:314;--w:28;--h:22"></i>
    `
  },
  {
    id: 'tomato', group: 'fruit',
    name: 'Tomato',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:356;--w:280;--h:40"></i>
      <i class="r" style="--cx:200;--cy:88;--w:18;--h:44;--k:7"></i>
      <i class="r" style="--cx:200;--cy:230;--w:284;--h:238;--r:50% 50% 50% 50% / 46% 46% 54% 54%"></i>
      <i class="r" style="--cx:166;--cy:124;--w:72;--h:28;--rot:16deg"></i>
      <i class="r" style="--cx:234;--cy:124;--w:72;--h:28;--rot:-16deg"></i>
      <i class="r" style="--cx:200;--cy:114;--w:34;--h:50"></i>
      <i class="r" style="--cx:118;--cy:182;--w:28;--h:56;--rot:30deg"></i>
      <i class="d" style="--cx:160;--cy:222;--w:28;--h:28"></i>
      <i class="d w" style="--cx:165;--cy:217;--w:8;--h:8"></i>
      <i class="d" style="--cx:240;--cy:222;--w:28;--h:28"></i>
      <i class="d w" style="--cx:245;--cy:217;--w:8;--h:8"></i>
      <i class="r" style="--cx:136;--cy:258;--w:34;--h:20"></i>
      <i class="r" style="--cx:264;--cy:258;--w:34;--h:20"></i>
      <i class="ln" style="--cx:200;--cy:256;--w:52;--h:34"></i>
    `
  },
  {
    id: 'pumpkin', group: 'fruit',
    name: 'Pumpkin',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:224"></i>
      <i class="ln up" style="--cx:230;--cy:97;--w:32;--h:35;--rot:4deg"></i>
      <i class="r" style="--cx:202;--cy:106;--w:28;--h:66;--k:10;--rot:8deg"></i>
      <i class="r" style="--cx:256;--cy:92;--w:86;--h:44;--r:100% 0 100% 0"></i>
      <i class="r" style="--cx:96;--cy:240;--w:140;--h:196"></i>
      <i class="r" style="--cx:304;--cy:240;--w:140;--h:196"></i>
      <i class="r" style="--cx:142;--cy:238;--w:144;--h:208"></i>
      <i class="r" style="--cx:258;--cy:238;--w:144;--h:208"></i>
      <i class="r" style="--cx:200;--cy:236;--w:164;--h:216"></i>
      <i class="d" style="--cx:174;--cy:222;--w:26;--h:26"></i>
      <i class="d w" style="--cx:179;--cy:217;--w:8;--h:8"></i>
      <i class="d" style="--cx:226;--cy:222;--w:26;--h:26"></i>
      <i class="d w" style="--cx:231;--cy:217;--w:8;--h:8"></i>
      <i class="r" style="--cx:150;--cy:256;--w:34;--h:20"></i>
      <i class="r" style="--cx:250;--cy:256;--w:34;--h:20"></i>
      <i class="ln" style="--cx:200;--cy:254;--w:36;--h:26"></i>
    `
  },
  {
    id: 'pepper', group: 'fruit',
    name: 'Bell pepper',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:360;--w:280;--h:40"></i>
      <i class="r" style="--cx:210;--cy:84;--w:26;--h:62;--k:11;--rot:14deg"></i>
      <i class="r" style="--cx:128;--cy:236;--w:136;--h:226;--rot:8deg"></i>
      <i class="r" style="--cx:272;--cy:236;--w:136;--h:226;--rot:-8deg"></i>
      <i class="r" style="--cx:200;--cy:240;--w:164;--h:236"></i>
      <i class="r" style="--cx:200;--cy:132;--w:140;--h:46"></i>
      <i class="r" style="--cx:108;--cy:206;--w:24;--h:60;--rot:12deg"></i>
      <i class="d" style="--cx:172;--cy:232;--w:26;--h:28"></i>
      <i class="d w" style="--cx:177;--cy:226;--w:9;--h:9"></i>
      <i class="d" style="--cx:228;--cy:232;--w:26;--h:28"></i>
      <i class="d w" style="--cx:233;--cy:226;--w:9;--h:9"></i>
      <i class="r" style="--cx:150;--cy:264;--w:28;--h:18"></i>
      <i class="r" style="--cx:250;--cy:264;--w:28;--h:18"></i>
      <i class="ln" style="--cx:200;--cy:260;--w:40;--h:26"></i>
    `
  },
  {
    id: 'eggplant', group: 'fruit',
    name: 'Eggplant',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:366;--w:270;--h:38"></i>
      <i class="r" style="--cx:200;--cy:66;--w:28;--h:64;--k:12;--rot:10deg"></i>
      <i class="r" style="--cx:200;--cy:232;--w:216;--h:270;--r:50% 50% 50% 50% / 62% 62% 38% 38%"></i>
      <i class="r" style="--cx:200;--cy:112;--w:132;--h:60;--r:50% 50% 50% 50% / 40% 40% 60% 60%"></i>
      <i class="r" style="--cx:128;--cy:214;--w:26;--h:60;--rot:16deg"></i>
      <i class="d" style="--cx:170;--cy:246;--w:28;--h:30"></i>
      <i class="d w" style="--cx:175;--cy:240;--w:10;--h:10"></i>
      <i class="d" style="--cx:230;--cy:246;--w:28;--h:30"></i>
      <i class="d w" style="--cx:235;--cy:240;--w:10;--h:10"></i>
      <i class="r" style="--cx:142;--cy:280;--w:32;--h:20"></i>
      <i class="r" style="--cx:258;--cy:280;--w:32;--h:20"></i>
      <i class="ln" style="--cx:200;--cy:276;--w:46;--h:28"></i>
    `
  },
  {
    id: 'radish', group: 'fruit',
    name: 'Radish',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:150"></i>
      <i class="r" style="--cx:136;--cy:96;--w:74;--h:140;--rot:-30deg"></i>
      <i class="r" style="--cx:264;--cy:96;--w:74;--h:140;--rot:30deg"></i>
      <i class="r" style="--cx:200;--cy:76;--w:78;--h:144"></i>
      <i class="r" style="--cx:200;--cy:346;--w:28;--h:76;--r:50% 50% 50% 50% / 30% 30% 70% 70%"></i>
      <i class="r" style="--cx:200;--cy:236;--w:236;--h:216;--r:50% 50% 50% 50% / 46% 46% 54% 54%"></i>
      <i class="r" style="--cx:200;--cy:140;--w:56;--h:30"></i>
      <i class="r" style="--cx:120;--cy:206;--w:26;--h:56;--rot:28deg"></i>
      <i class="d" style="--cx:162;--cy:228;--w:28;--h:30"></i>
      <i class="d w" style="--cx:167;--cy:222;--w:10;--h:10"></i>
      <i class="d" style="--cx:238;--cy:228;--w:28;--h:30"></i>
      <i class="d w" style="--cx:243;--cy:222;--w:10;--h:10"></i>
      <i class="r" style="--cx:134;--cy:262;--w:32;--h:20"></i>
      <i class="r" style="--cx:266;--cy:262;--w:32;--h:20"></i>
      <i class="ln" style="--cx:200;--cy:258;--w:46;--h:28"></i>
    `
  },
  {
    id: 'peas', group: 'fruit',
    name: 'Peas',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:330;--w:320;--h:40"></i>
      <i class="r" style="--cx:338;--cy:132;--w:80;--h:42;--r:100% 0 100% 0;--rot:-30deg"></i>
      <i class="r" style="--cx:200;--cy:212;--w:372;--h:150;--rot:-8deg"></i>
      <i class="r" style="--cx:106;--cy:224;--w:98;--h:98"></i>
      <i class="r" style="--cx:200;--cy:210;--w:102;--h:102"></i>
      <i class="r" style="--cx:294;--cy:198;--w:98;--h:98"></i>
      <i class="d" style="--cx:186;--cy:202;--w:18;--h:22"></i>
      <i class="d" style="--cx:214;--cy:202;--w:18;--h:22"></i>
      <i class="d w" style="--cx:189;--cy:197;--w:7;--h:7"></i>
      <i class="d w" style="--cx:217;--cy:197;--w:7;--h:7"></i>
      <i class="ln" style="--cx:200;--cy:216;--w:26;--h:16"></i>
    `
  },
  {
    id: 'mango', group: 'fruit',
    name: 'Mango',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:356;--w:290;--h:40"></i>
      <i class="r" style="--cx:180;--cy:84;--w:22;--h:50;--k:10;--rot:-14deg"></i>
      <i class="r" style="--cx:250;--cy:72;--w:110;--h:50;--r:100% 0 100% 0;--rot:-10deg"></i>
      <i class="r" style="--cx:204;--cy:226;--w:300;--h:240;--r:58% 42% 48% 52% / 50% 46% 54% 50%;--rot:-18deg"></i>
      <i class="r" style="--cx:110;--cy:198;--w:26;--h:62;--rot:20deg"></i>
      <i class="d" style="--cx:168;--cy:226;--w:28;--h:30"></i>
      <i class="d w" style="--cx:173;--cy:220;--w:10;--h:10"></i>
      <i class="d" style="--cx:244;--cy:226;--w:28;--h:30"></i>
      <i class="d w" style="--cx:249;--cy:220;--w:10;--h:10"></i>
      <i class="r" style="--cx:142;--cy:260;--w:32;--h:20"></i>
      <i class="r" style="--cx:270;--cy:260;--w:32;--h:20"></i>
      <i class="ln" style="--cx:206;--cy:256;--w:46;--h:28"></i>
    `
  },
  {
    id: 'onion', group: 'fruit',
    name: 'Onion',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:362;--w:280;--h:38"></i>
      <i class="r" style="--cx:172;--cy:84;--w:34;--h:110;--r:50% 50% 50% 50% / 70% 70% 30% 30%;--rot:-22deg"></i>
      <i class="r" style="--cx:228;--cy:84;--w:34;--h:110;--r:50% 50% 50% 50% / 70% 70% 30% 30%;--rot:22deg"></i>
      <i class="r" style="--cx:200;--cy:70;--w:36;--h:124;--r:50% 50% 50% 50% / 70% 70% 30% 30%"></i>
      <i class="d" style="--cx:186;--cy:346;--w:8;--h:26;--k:4;--rot:20deg"></i>
      <i class="d" style="--cx:200;--cy:350;--w:8;--h:28;--k:4"></i>
      <i class="d" style="--cx:214;--cy:346;--w:8;--h:26;--k:4;--rot:-20deg"></i>
      <i class="r" style="--cx:200;--cy:236;--w:264;--h:230;--r:50% 50% 50% 50% / 62% 62% 38% 38%"></i>
      <i class="r" style="--cx:200;--cy:132;--w:60;--h:44;--r:30% 30% 50% 50% / 30% 30% 70% 70%"></i>
      <i class="ln" style="--cx:118;--cy:240;--w:160;--h:44;--rot:90deg"></i>
      <i class="ln" style="--cx:282;--cy:240;--w:160;--h:44;--rot:-90deg"></i>
      <i class="d" style="--cx:166;--cy:232;--w:28;--h:30"></i>
      <i class="d w" style="--cx:171;--cy:226;--w:10;--h:10"></i>
      <i class="d" style="--cx:234;--cy:232;--w:28;--h:30"></i>
      <i class="d w" style="--cx:239;--cy:226;--w:10;--h:10"></i>
      <i class="r" style="--cx:142;--cy:268;--w:30;--h:20"></i>
      <i class="r" style="--cx:258;--cy:268;--w:30;--h:20"></i>
      <i class="ln" style="--cx:200;--cy:264;--w:44;--h:26"></i>
    `
  },

  {
    id: 'potato', group: 'fruit',
    name: 'Potato',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:338;--w:300;--h:46"></i>
      <i class="r" style="--cx:200;--cy:222;--w:320;--h:220;--r:52% 48% 46% 54% / 50% 56% 44% 50%;--rot:-10deg"></i>
      <i class="r" style="--cx:104;--cy:180;--w:26;--h:52;--rot:20deg"></i>
      <i class="r" style="--cx:282;--cy:150;--w:38;--h:26;--rot:-10deg"></i>
      <i class="r" style="--cx:142;--cy:260;--w:36;--h:22"></i>
      <i class="r" style="--cx:272;--cy:244;--w:36;--h:22"></i>
      <i class="d" style="--cx:168;--cy:222;--w:28;--h:32"></i>
      <i class="d w" style="--cx:173;--cy:215;--w:10;--h:10"></i>
      <i class="d" style="--cx:232;--cy:212;--w:28;--h:32"></i>
      <i class="d w" style="--cx:237;--cy:205;--w:10;--h:10"></i>
      <i class="ln" style="--cx:202;--cy:250;--w:44;--h:28;--rot:-8deg"></i>
    `
  },
  {
    id: 'coconut', group: 'fruit',
    name: 'Coconut',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:362;--w:300;--h:42"></i>
      <i class="r" style="--cx:200;--cy:250;--w:320;--h:200;--r:0 0 50% 50% / 0 0 100% 100%"></i>
      <i class="r" style="--cx:200;--cy:150;--w:320;--h:96"></i>
      <i class="r" style="--cx:200;--cy:152;--w:240;--h:54"></i>
      <i class="d" style="--cx:96;--cy:226;--w:26;--h:8;--k:4;--rot:30deg"></i>
      <i class="d" style="--cx:304;--cy:226;--w:26;--h:8;--k:4;--rot:-30deg"></i>
      <i class="d" style="--cx:150;--cy:322;--w:26;--h:8;--k:4;--rot:-20deg"></i>
      <i class="d" style="--cx:250;--cy:322;--w:26;--h:8;--k:4;--rot:20deg"></i>
      <i class="r" style="--cx:118;--cy:274;--w:36;--h:22"></i>
      <i class="r" style="--cx:282;--cy:274;--w:36;--h:22"></i>
      <i class="d" style="--cx:160;--cy:238;--w:28;--h:32"></i>
      <i class="d w" style="--cx:165;--cy:231;--w:10;--h:10"></i>
      <i class="d" style="--cx:240;--cy:238;--w:28;--h:32"></i>
      <i class="d w" style="--cx:245;--cy:231;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:272;--w:48;--h:30"></i>
    `
  },
  {
    id: 'cucumber', group: 'fruit',
    name: 'Cucumber',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:350;--w:320;--h:42"></i>
      <i class="r" style="--cx:332;--cy:88;--w:40;--h:58;--k:14;--rot:-30deg"></i>
      <i class="r" style="--cx:200;--cy:208;--w:360;--h:160;--r:50%;--rot:-34deg"></i>
      <i class="r" style="--cx:118;--cy:262;--w:24;--h:80;--rot:56deg"></i>
      <i class="d" style="--cx:262;--cy:118;--w:12;--h:12"></i>
      <i class="d" style="--cx:302;--cy:160;--w:12;--h:12"></i>
      <i class="d" style="--cx:186;--cy:270;--w:12;--h:12"></i>
      <i class="d" style="--cx:150;--cy:300;--w:12;--h:12"></i>
      <i class="r" style="--cx:158;--cy:220;--w:32;--h:20"></i>
      <i class="r" style="--cx:258;--cy:206;--w:32;--h:20"></i>
      <i class="d" style="--cx:180;--cy:184;--w:26;--h:30"></i>
      <i class="d w" style="--cx:185;--cy:177;--w:9;--h:9"></i>
      <i class="d" style="--cx:232;--cy:170;--w:26;--h:30"></i>
      <i class="d w" style="--cx:237;--cy:163;--w:9;--h:9"></i>
      <i class="ln" style="--cx:210;--cy:206;--w:36;--h:22"></i>
    `
  },
  {
    id: 'blueberries', group: 'fruit',
    name: 'Blueberries',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:356;--w:320;--h:42"></i>
      <i class="r" style="--cx:206;--cy:78;--w:110;--h:58;--r:100% 0 100% 0;--rot:-20deg"></i>
      <i class="r" style="--cx:100;--cy:150;--w:156;--h:150"></i>
      <i class="r" style="--cx:300;--cy:150;--w:156;--h:150"></i>
      <i class="r" style="--cx:100;--cy:86;--w:40;--h:30"></i>
      <i class="r" style="--cx:300;--cy:86;--w:40;--h:30"></i>
      <i class="r" style="--cx:200;--cy:262;--w:204;--h:190"></i>
      <i class="r" style="--cx:200;--cy:176;--w:50;--h:36"></i>
      <i class="d" style="--cx:78;--cy:134;--w:18;--h:22"></i>
      <i class="d w" style="--cx:81;--cy:129;--w:7;--h:7"></i>
      <i class="d" style="--cx:120;--cy:134;--w:18;--h:22"></i>
      <i class="d w" style="--cx:123;--cy:129;--w:7;--h:7"></i>
      <i class="ln" style="--cx:99;--cy:152;--w:26;--h:16"></i>
      <i class="d" style="--cx:280;--cy:134;--w:18;--h:22"></i>
      <i class="d w" style="--cx:283;--cy:129;--w:7;--h:7"></i>
      <i class="d" style="--cx:322;--cy:134;--w:18;--h:22"></i>
      <i class="d w" style="--cx:325;--cy:129;--w:7;--h:7"></i>
      <i class="ln" style="--cx:301;--cy:152;--w:26;--h:16"></i>
      <i class="r" style="--cx:136;--cy:288;--w:34;--h:20"></i>
      <i class="r" style="--cx:264;--cy:288;--w:34;--h:20"></i>
      <i class="d" style="--cx:166;--cy:252;--w:28;--h:32"></i>
      <i class="d w" style="--cx:171;--cy:245;--w:10;--h:10"></i>
      <i class="d" style="--cx:234;--cy:252;--w:28;--h:32"></i>
      <i class="d w" style="--cx:239;--cy:245;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:286;--w:44;--h:28"></i>
    `
  },
  {
    id: 'pomegranate', group: 'fruit',
    name: 'Pomegranate',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:352;--w:300;--h:44"></i>
      <i class="r" style="--cx:152;--cy:86;--w:56;--h:56;--k:10;--rot:30deg"></i>
      <i class="r" style="--cx:248;--cy:86;--w:56;--h:56;--k:10;--rot:60deg"></i>
      <i class="r" style="--cx:200;--cy:68;--w:58;--h:58;--k:10;--rot:45deg"></i>
      <i class="r" style="--cx:200;--cy:108;--w:124;--h:58;--k:18"></i>
      <i class="r" style="--cx:200;--cy:240;--w:290;--h:236;--r:50% 50% 48% 48% / 46% 46% 54% 54%"></i>
      <i class="r" style="--cx:118;--cy:196;--w:30;--h:60;--rot:24deg"></i>
      <i class="r" style="--cx:136;--cy:274;--w:36;--h:22"></i>
      <i class="r" style="--cx:264;--cy:274;--w:36;--h:22"></i>
      <i class="d" style="--cx:166;--cy:234;--w:28;--h:32"></i>
      <i class="d w" style="--cx:171;--cy:227;--w:10;--h:10"></i>
      <i class="d" style="--cx:234;--cy:234;--w:28;--h:32"></i>
      <i class="d w" style="--cx:239;--cy:227;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:270;--w:46;--h:28"></i>
    `
  },
  {
    id: 'plum', group: 'fruit',
    name: 'Plum',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:354;--w:270;--h:42"></i>
      <i class="r" style="--cx:204;--cy:84;--w:22;--h:66;--k:11;--rot:10deg"></i>
      <i class="r" style="--cx:256;--cy:68;--w:86;--h:48;--r:100% 0 100% 0"></i>
      <i class="d" style="--cx:259;--cy:64;--w:80;--h:8;--k:4;--rot:-16deg"></i>
      <i class="r" style="--cx:200;--cy:226;--w:256;--h:258;--r:50% 50% 48% 48% / 44% 44% 56% 56%"></i>
      <i class="ln up" style="--cx:200;--cy:116;--w:50;--h:30"></i>
      <i class="ln" style="--cx:270;--cy:218;--w:180;--h:40;--rot:-88deg"></i>
      <i class="r" style="--cx:124;--cy:174;--w:30;--h:60;--rot:26deg"></i>
      <i class="r" style="--cx:130;--cy:266;--w:36;--h:22"></i>
      <i class="r" style="--cx:258;--cy:266;--w:36;--h:22"></i>
      <i class="d" style="--cx:160;--cy:226;--w:28;--h:32"></i>
      <i class="d w" style="--cx:165;--cy:219;--w:10;--h:10"></i>
      <i class="d" style="--cx:228;--cy:226;--w:28;--h:32"></i>
      <i class="d w" style="--cx:233;--cy:219;--w:10;--h:10"></i>
      <i class="ln" style="--cx:194;--cy:262;--w:46;--h:28"></i>
    `
  },
  {
    id: 'beet', group: 'fruit',
    name: 'Beet',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:206;--cy:350;--w:34;--h:76;--r:50% 50% 50% 50% / 30% 30% 70% 70%;--rot:-14deg"></i>
      <i class="r" style="--cx:138;--cy:100;--w:76;--h:122;--r:50% 50% 50% 50% / 62% 62% 38% 38%;--rot:-30deg"></i>
      <i class="r" style="--cx:262;--cy:100;--w:76;--h:122;--r:50% 50% 50% 50% / 62% 62% 38% 38%;--rot:30deg"></i>
      <i class="r" style="--cx:200;--cy:84;--w:80;--h:128;--r:50% 50% 50% 50% / 62% 62% 38% 38%"></i>
      <i class="d" style="--cx:142;--cy:106;--w:7;--h:90;--k:3;--rot:-30deg"></i>
      <i class="d" style="--cx:258;--cy:106;--w:7;--h:90;--k:3;--rot:30deg"></i>
      <i class="d" style="--cx:200;--cy:92;--w:7;--h:96;--k:3"></i>
      <i class="r" style="--cx:200;--cy:236;--w:262;--h:226"></i>
      <i class="r" style="--cx:118;--cy:200;--w:30;--h:58;--rot:24deg"></i>
      <i class="r" style="--cx:136;--cy:272;--w:36;--h:22"></i>
      <i class="r" style="--cx:264;--cy:272;--w:36;--h:22"></i>
      <i class="d" style="--cx:166;--cy:232;--w:28;--h:32"></i>
      <i class="d w" style="--cx:171;--cy:225;--w:10;--h:10"></i>
      <i class="d" style="--cx:234;--cy:232;--w:28;--h:32"></i>
      <i class="d w" style="--cx:239;--cy:225;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:268;--w:46;--h:28"></i>
    `
  },
  {
    id: 'lettuce', group: 'fruit',
    name: 'Lettuce',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:360;--w:300;--h:40"></i>
      <i class="r" style="--cx:118;--cy:236;--w:146;--h:220;--r:60% 40% 50% 50% / 60% 50% 50% 40%;--rot:-24deg"></i>
      <i class="r" style="--cx:282;--cy:236;--w:146;--h:220;--r:40% 60% 50% 50% / 50% 60% 40% 50%;--rot:24deg"></i>
      <i class="r" style="--cx:200;--cy:210;--w:224;--h:232"></i>
      <i class="ln up" style="--cx:200;--cy:110;--w:80;--h:30"></i>
      <i class="r" style="--cx:146;--cy:306;--w:180;--h:112;--r:50% 50% 50% 50% / 64% 64% 36% 36%;--rot:16deg"></i>
      <i class="d" style="--cx:146;--cy:312;--w:96;--h:7;--k:3;--rot:16deg"></i>
      <i class="r" style="--cx:254;--cy:306;--w:180;--h:112;--r:50% 50% 50% 50% / 64% 64% 36% 36%;--rot:-16deg"></i>
      <i class="d" style="--cx:254;--cy:312;--w:96;--h:7;--k:3;--rot:-16deg"></i>
      <i class="r" style="--cx:134;--cy:140;--w:24;--h:44;--rot:32deg"></i>
      <i class="r" style="--cx:138;--cy:216;--w:36;--h:22"></i>
      <i class="r" style="--cx:262;--cy:216;--w:36;--h:22"></i>
      <i class="d" style="--cx:168;--cy:176;--w:28;--h:32"></i>
      <i class="d w" style="--cx:173;--cy:169;--w:10;--h:10"></i>
      <i class="d" style="--cx:232;--cy:176;--w:28;--h:32"></i>
      <i class="d w" style="--cx:237;--cy:169;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:212;--w:46;--h:28"></i>
    `
  },
  {
    id: 'garlic', group: 'fruit',
    name: 'Garlic',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:368;--w:290;--h:36"></i>
      <i class="r" style="--cx:200;--cy:110;--w:48;--h:110;--r:50% 50% 50% 50% / 86% 86% 14% 14%"></i>
      <i class="d" style="--cx:182;--cy:356;--w:8;--h:28;--k:4;--rot:24deg"></i>
      <i class="d" style="--cx:200;--cy:360;--w:8;--h:30;--k:4"></i>
      <i class="d" style="--cx:218;--cy:356;--w:8;--h:28;--k:4;--rot:-24deg"></i>
      <i class="r" style="--cx:128;--cy:250;--w:138;--h:190;--r:50% 50% 50% 50% / 62% 62% 38% 38%;--rot:-16deg"></i>
      <i class="r" style="--cx:272;--cy:250;--w:138;--h:190;--r:50% 50% 50% 50% / 62% 62% 38% 38%;--rot:16deg"></i>
      <i class="r" style="--cx:200;--cy:240;--w:164;--h:224;--r:50% 50% 50% 50% / 62% 62% 38% 38%"></i>
      <i class="r" style="--cx:98;--cy:230;--w:24;--h:50;--rot:10deg"></i>
      <i class="r" style="--cx:156;--cy:282;--w:32;--h:22"></i>
      <i class="r" style="--cx:244;--cy:282;--w:32;--h:22"></i>
      <i class="d" style="--cx:170;--cy:242;--w:28;--h:32"></i>
      <i class="d w" style="--cx:175;--cy:235;--w:10;--h:10"></i>
      <i class="d" style="--cx:230;--cy:242;--w:28;--h:32"></i>
      <i class="d w" style="--cx:235;--cy:235;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:278;--w:46;--h:28"></i>
    `
  },
  {
    id: 'fig', group: 'fruit',
    name: 'Fig',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:360;--w:280;--h:40"></i>
      <i class="r" style="--cx:200;--cy:90;--w:28;--h:60;--k:12"></i>
      <i class="r" style="--cx:258;--cy:84;--w:96;--h:52;--r:100% 0 100% 0;--rot:-14deg"></i>
      <i class="d" style="--cx:260;--cy:84;--w:84;--h:7;--k:3;--rot:-30deg"></i>
      <i class="r" style="--cx:200;--cy:236;--w:270;--h:268;--r:50% 50% 46% 46% / 72% 72% 28% 28%"></i>
      <i class="r" style="--cx:122;--cy:214;--w:30;--h:62;--rot:24deg"></i>
      <i class="r" style="--cx:128;--cy:286;--w:36;--h:22"></i>
      <i class="r" style="--cx:272;--cy:286;--w:36;--h:22"></i>
      <i class="d" style="--cx:166;--cy:250;--w:28;--h:32"></i>
      <i class="d w" style="--cx:171;--cy:243;--w:10;--h:10"></i>
      <i class="d" style="--cx:234;--cy:250;--w:28;--h:32"></i>
      <i class="d w" style="--cx:239;--cy:243;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:286;--w:46;--h:28"></i>
    `
  },
  {
    id: 'cauliflower', group: 'fruit',
    name: 'Cauliflower',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:362;--w:310;--h:38"></i>
      <i class="r" style="--cx:110;--cy:305;--w:177;--h:80;--r:0 100% 0 100%;--rot:10deg"></i>
      <i class="d" style="--cx:110;--cy:305;--w:160;--h:7;--k:3;--rot:34deg"></i>
      <i class="r" style="--cx:290;--cy:305;--w:177;--h:80;--r:100% 0 100% 0;--rot:-10deg"></i>
      <i class="d" style="--cx:290;--cy:305;--w:160;--h:7;--k:3;--rot:-34deg"></i>
      <i class="r" style="--cx:104;--cy:150;--w:96;--h:96"></i>
      <i class="r" style="--cx:164;--cy:106;--w:104;--h:104"></i>
      <i class="r" style="--cx:236;--cy:106;--w:104;--h:104"></i>
      <i class="r" style="--cx:296;--cy:150;--w:96;--h:96"></i>
      <i class="r" style="--cx:200;--cy:206;--w:284;--h:196"></i>
      <i class="r" style="--cx:126;--cy:226;--w:34;--h:22"></i>
      <i class="r" style="--cx:274;--cy:226;--w:34;--h:22"></i>
      <i class="d" style="--cx:166;--cy:194;--w:28;--h:32"></i>
      <i class="d w" style="--cx:171;--cy:187;--w:10;--h:10"></i>
      <i class="d" style="--cx:234;--cy:194;--w:28;--h:32"></i>
      <i class="d w" style="--cx:239;--cy:187;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:228;--w:46;--h:28"></i>
    `
  },
  {
    id: 'celery', group: 'fruit',
    name: 'Celery',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:364;--w:270;--h:36"></i>
      <i class="r" style="--cx:118;--cy:92;--w:116;--h:84;--r:50% 50% 30% 30% / 80% 80% 20% 20%;--rot:-16deg"></i>
      <i class="r" style="--cx:282;--cy:92;--w:116;--h:84;--r:50% 50% 30% 30% / 80% 80% 20% 20%;--rot:16deg"></i>
      <i class="r" style="--cx:200;--cy:64;--w:128;--h:90;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:136;--cy:232;--w:76;--h:270;--k:36;--rot:-11deg"></i>
      <i class="d" style="--cx:126;--cy:262;--w:7;--h:150;--k:3;--rot:-11deg"></i>
      <i class="r" style="--cx:264;--cy:232;--w:76;--h:270;--k:36;--rot:11deg"></i>
      <i class="d" style="--cx:274;--cy:262;--w:7;--h:150;--k:3;--rot:11deg"></i>
      <i class="r" style="--cx:200;--cy:236;--w:138;--h:270;--k:60"></i>
      <i class="r" style="--cx:162;--cy:236;--w:28;--h:20"></i>
      <i class="r" style="--cx:238;--cy:236;--w:28;--h:20"></i>
      <i class="d" style="--cx:176;--cy:200;--w:26;--h:30"></i>
      <i class="d w" style="--cx:181;--cy:193;--w:9;--h:9"></i>
      <i class="d" style="--cx:224;--cy:200;--w:26;--h:30"></i>
      <i class="d w" style="--cx:229;--cy:193;--w:9;--h:9"></i>
      <i class="ln" style="--cx:200;--cy:234;--w:40;--h:26"></i>
    `
  },
  {
    id: 'turnip', group: 'fruit',
    name: 'Turnip',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:364;--w:290;--h:36"></i>
      <i class="r" style="--cx:214;--cy:350;--w:24;--h:70;--k:12;--rot:-24deg"></i>
      <i class="r" style="--cx:144;--cy:96;--w:74;--h:132;--r:100% 0 100% 0;--rot:-12deg"></i>
      <i class="r" style="--cx:256;--cy:96;--w:74;--h:132;--r:0 100% 0 100%;--rot:12deg"></i>
      <i class="r" style="--cx:200;--cy:78;--w:80;--h:140;--r:50% 50% 50% 50% / 80% 80% 20% 20%"></i>
      <i class="d" style="--cx:200;--cy:90;--w:7;--h:100;--k:3"></i>
      <i class="r" style="--cx:200;--cy:232;--w:278;--h:236;--r:50% 50% 50% 50% / 34% 34% 66% 66%"></i>
      <i class="r" style="--cx:118;--cy:196;--w:30;--h:58;--rot:24deg"></i>
      <i class="r" style="--cx:134;--cy:262;--w:36;--h:22"></i>
      <i class="r" style="--cx:266;--cy:262;--w:36;--h:22"></i>
      <i class="d" style="--cx:166;--cy:226;--w:28;--h:32"></i>
      <i class="d w" style="--cx:171;--cy:219;--w:10;--h:10"></i>
      <i class="d" style="--cx:234;--cy:226;--w:28;--h:32"></i>
      <i class="d w" style="--cx:239;--cy:219;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:262;--w:46;--h:28"></i>
    `
  },
  {
    id: 'lime', group: 'fruit',
    name: 'Lime',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:364;--w:300;--h:36"></i>
      <i class="r" style="--cx:46;--cy:226;--w:44;--h:34"></i>
      <i class="r" style="--cx:354;--cy:226;--w:44;--h:34"></i>
      <i class="r" style="--cx:212;--cy:108;--w:26;--h:44;--k:11;--rot:10deg"></i>
      <i class="r" style="--cx:262;--cy:84;--w:104;--h:54;--r:100% 0 100% 0;--rot:-16deg"></i>
      <i class="d" style="--cx:264;--cy:84;--w:90;--h:7;--k:3;--rot:-32deg"></i>
      <i class="r" style="--cx:200;--cy:226;--w:300;--h:240"></i>
      <i class="r" style="--cx:110;--cy:196;--w:30;--h:64;--rot:20deg"></i>
      <i class="r" style="--cx:124;--cy:270;--w:36;--h:22"></i>
      <i class="r" style="--cx:276;--cy:270;--w:36;--h:22"></i>
      <i class="d" style="--cx:166;--cy:232;--w:28;--h:32"></i>
      <i class="d w" style="--cx:171;--cy:225;--w:10;--h:10"></i>
      <i class="d" style="--cx:234;--cy:232;--w:28;--h:32"></i>
      <i class="d w" style="--cx:239;--cy:225;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:268;--w:46;--h:28"></i>
    `
  },
  {
    id: 'apricot', group: 'fruit',
    name: 'Apricot',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:364;--w:300;--h:36"></i>
      <i class="r" style="--cx:196;--cy:84;--w:26;--h:56;--k:11;--rot:-10deg"></i>
      <i class="r" style="--cx:140;--cy:86;--w:100;--h:52;--r:0 100% 0 100%;--rot:16deg"></i>
      <i class="d" style="--cx:138;--cy:86;--w:86;--h:7;--k:3;--rot:32deg"></i>
      <i class="r" style="--cx:200;--cy:228;--w:290;--h:262;--r:50% 50% 48% 48% / 54% 54% 46% 46%"></i>
      <i class="ln" style="--cx:252;--cy:156;--w:110;--h:30;--rot:-70deg"></i>
      <i class="r" style="--cx:118;--cy:196;--w:30;--h:62;--rot:20deg"></i>
      <i class="r" style="--cx:128;--cy:272;--w:36;--h:22"></i>
      <i class="r" style="--cx:262;--cy:272;--w:36;--h:22"></i>
      <i class="d" style="--cx:166;--cy:236;--w:28;--h:32"></i>
      <i class="d w" style="--cx:171;--cy:229;--w:10;--h:10"></i>
      <i class="d" style="--cx:234;--cy:236;--w:28;--h:32"></i>
      <i class="d w" style="--cx:239;--cy:229;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:272;--w:46;--h:28"></i>
    `
  },
  {
    id: 'zucchini', group: 'fruit',
    name: 'Zucchini',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:364;--w:300;--h:36"></i>
      <i class="r" style="--cx:368;--cy:166;--w:44;--h:38;--k:12;--rot:-20deg"></i>
      <i class="r" style="--cx:68;--cy:257;--w:76;--h:42;--rot:235deg"></i>
      <i class="r" style="--cx:63;--cy:284;--w:76;--h:42;--rot:145deg"></i>
      <i class="r" style="--cx:57;--cy:270;--w:76;--h:42;--rot:190deg"></i>
      <i class="r" style="--cx:220;--cy:222;--w:300;--h:150;--rot:-20deg"></i>
      <i class="r" style="--cx:140;--cy:244;--w:36;--h:22;--rot:-20deg"></i>
      <i class="r" style="--cx:300;--cy:186;--w:36;--h:22;--rot:-20deg"></i>
      <i class="d" style="--cx:192;--cy:214;--w:26;--h:30"></i>
      <i class="d w" style="--cx:197;--cy:207;--w:9;--h:9"></i>
      <i class="d" style="--cx:248;--cy:194;--w:26;--h:30"></i>
      <i class="d w" style="--cx:253;--cy:187;--w:9;--h:9"></i>
      <i class="ln" style="--cx:226;--cy:236;--w:44;--h:26;--rot:-20deg"></i>
    `
  },
  {
    id: 'cabbage', group: 'fruit',
    name: 'Cabbage',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:364;--w:300;--h:36"></i>
      <i class="r" style="--cx:116;--cy:256;--w:150;--h:190;--rot:-24deg"></i>
      <i class="d" style="--cx:96;--cy:284;--w:7;--h:84;--k:3;--rot:-24deg"></i>
      <i class="r" style="--cx:284;--cy:256;--w:150;--h:190;--rot:24deg"></i>
      <i class="d" style="--cx:304;--cy:284;--w:7;--h:84;--k:3;--rot:24deg"></i>
      <i class="r" style="--cx:200;--cy:226;--w:250;--h:250"></i>
      <i class="ln up" style="--cx:200;--cy:172;--w:170;--h:80"></i>
      <i class="r" style="--cx:128;--cy:282;--w:36;--h:22"></i>
      <i class="r" style="--cx:272;--cy:282;--w:36;--h:22"></i>
      <i class="d" style="--cx:166;--cy:244;--w:28;--h:32"></i>
      <i class="d w" style="--cx:171;--cy:237;--w:10;--h:10"></i>
      <i class="d" style="--cx:234;--cy:244;--w:28;--h:32"></i>
      <i class="d w" style="--cx:239;--cy:237;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:280;--w:46;--h:28"></i>
    `
  },
  {
    id: 'sweetpotato', group: 'fruit',
    name: 'Sweet Potato',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:364;--w:300;--h:36"></i>
      <i class="r" style="--cx:54;--cy:258;--w:66;--h:22;--rot:14deg"></i>
      <i class="r" style="--cx:348;--cy:196;--w:66;--h:22;--rot:-34deg"></i>
      <i class="r" style="--cx:198;--cy:128;--w:18;--h:46;--k:8"></i>
      <i class="r" style="--cx:158;--cy:104;--w:84;--h:42;--r:0 100% 0 100%;--rot:18deg"></i>
      <i class="r" style="--cx:240;--cy:100;--w:84;--h:42;--r:100% 0 100% 0;--rot:-18deg"></i>
      <i class="r" style="--cx:200;--cy:232;--w:296;--h:176;--rot:-10deg"></i>
      <i class="r" style="--cx:126;--cy:262;--w:36;--h:22;--rot:-10deg"></i>
      <i class="r" style="--cx:278;--cy:236;--w:36;--h:22;--rot:-10deg"></i>
      <i class="d" style="--cx:170;--cy:226;--w:28;--h:32"></i>
      <i class="d w" style="--cx:175;--cy:219;--w:10;--h:10"></i>
      <i class="d" style="--cx:234;--cy:214;--w:28;--h:32"></i>
      <i class="d w" style="--cx:239;--cy:207;--w:10;--h:10"></i>
      <i class="ln" style="--cx:205;--cy:254;--w:46;--h:28;--rot:-10deg"></i>
    `
  },
  {
    id: 'raspberry', group: 'fruit',
    name: 'Raspberry',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:370;--w:300;--h:32"></i>
      <i class="r" style="--cx:124;--cy:124;--w:66;--h:66"></i>
      <i class="r" style="--cx:276;--cy:124;--w:66;--h:66"></i>
      <i class="r" style="--cx:88;--cy:180;--w:66;--h:66"></i>
      <i class="r" style="--cx:312;--cy:180;--w:66;--h:66"></i>
      <i class="r" style="--cx:80;--cy:248;--w:66;--h:66"></i>
      <i class="r" style="--cx:320;--cy:248;--w:66;--h:66"></i>
      <i class="r" style="--cx:108;--cy:310;--w:66;--h:66"></i>
      <i class="r" style="--cx:292;--cy:310;--w:66;--h:66"></i>
      <i class="r" style="--cx:162;--cy:338;--w:66;--h:66"></i>
      <i class="r" style="--cx:238;--cy:338;--w:66;--h:66"></i>
      <i class="r" style="--cx:200;--cy:62;--w:24;--h:50;--k:10"></i>
      <i class="r" style="--cx:200;--cy:220;--w:240;--h:252;--r:50% 50% 50% 50% / 46% 46% 54% 54%"></i>
      <i class="r" style="--cx:156;--cy:98;--w:100;--h:44;--r:0 100% 0 100%;--rot:8deg"></i>
      <i class="r" style="--cx:244;--cy:98;--w:100;--h:44;--r:100% 0 100% 0;--rot:-8deg"></i>
      <i class="r" style="--cx:200;--cy:94;--w:60;--h:44"></i>
      <i class="r" style="--cx:132;--cy:262;--w:36;--h:22"></i>
      <i class="r" style="--cx:268;--cy:262;--w:36;--h:22"></i>
      <i class="d" style="--cx:166;--cy:224;--w:28;--h:32"></i>
      <i class="d w" style="--cx:171;--cy:217;--w:10;--h:10"></i>
      <i class="d" style="--cx:234;--cy:224;--w:28;--h:32"></i>
      <i class="d w" style="--cx:239;--cy:217;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:260;--w:46;--h:28"></i>
    `
  },
  {
    id: 'chili', group: 'fruit',
    name: 'Chili Pepper',
    // The chili's bend is one SVG path (class "r p", like the banana): ellipses can't curve like this.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:364;--w:300;--h:36"></i>
      <i class="r" style="--cx:62;--cy:66;--w:22;--h:66;--k:10;--rot:-36deg"></i>
      <i class="r p" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"><svg viewBox="0 0 400 400"><path d="M78 150 C70 104 120 82 170 100 C262 132 320 222 344 318 C348 336 330 342 322 330 C278 262 200 244 128 236 C92 232 82 196 78 150 Z"/></svg></i>
      <i class="r" style="--cx:102;--cy:112;--w:116;--h:72;--r:50% 50% 40% 40% / 64% 64% 36% 36%;--rot:-34deg"></i>
      <i class="r" style="--cx:136;--cy:200;--w:36;--h:22;--rot:20deg"></i>
      <i class="r" style="--cx:244;--cy:206;--w:36;--h:22;--rot:30deg"></i>
      <i class="d" style="--cx:160;--cy:160;--w:26;--h:30"></i>
      <i class="d w" style="--cx:165;--cy:153;--w:9;--h:9"></i>
      <i class="d" style="--cx:210;--cy:170;--w:26;--h:30"></i>
      <i class="d w" style="--cx:215;--cy:163;--w:9;--h:9"></i>
      <i class="ln" style="--cx:184;--cy:196;--w:40;--h:24;--rot:20deg"></i>
    `
  },
  {
    id: 'peanut', group: 'fruit',
    name: 'Peanut',
    // The peanut's pinched middle is one SVG path (class "r p", like the banana).
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:366;--w:300;--h:36"></i>
      <i class="r p" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"><svg viewBox="0 0 400 400"><path d="M191 173 C220 145 235 138 266 128 C309 114 355 138 369 181 C383 224 359 270 317 284 C285 294 269 297 230 291 C198 325 191 335 163 345 C115 360 64 332 49 285 C33 237 58 185 106 170 C135 160 147 165 191 173 Z"/></svg></i>
      <i class="r" style="--cx:268;--cy:170;--w:36;--h:26;--rot:-18deg"></i>
      <i class="r" style="--cx:318;--cy:206;--w:36;--h:26;--rot:-18deg"></i>
      <i class="r" style="--cx:272;--cy:244;--w:36;--h:26;--rot:-18deg"></i>
      <i class="r" style="--cx:98;--cy:307;--w:34;--h:22;--rot:-18deg"></i>
      <i class="r" style="--cx:195;--cy:275;--w:34;--h:22;--rot:-18deg"></i>
      <i class="d" style="--cx:107;--cy:257;--w:28;--h:32"></i>
      <i class="d w" style="--cx:110;--cy:249;--w:10;--h:10"></i>
      <i class="d" style="--cx:159;--cy:241;--w:28;--h:32"></i>
      <i class="d w" style="--cx:161;--cy:233;--w:10;--h:10"></i>
      <i class="ln" style="--cx:145;--cy:285;--w:46;--h:28;--rot:-18deg"></i>
    `
  },
  {
    id: 'papaya', group: 'fruit',
    name: 'Papaya',
    // Cut in half so it doesn't look like a mango: skin, orange inside, and the seed hollow.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:370;--w:300;--h:32"></i>
      <i class="r" style="--cx:200;--cy:44;--w:26;--h:40;--k:10"></i>
      <i class="r" style="--cx:200;--cy:206;--w:272;--h:322;--r:50% 50% 50% 50% / 42% 42% 58% 58%"></i>
      <i class="r" style="--cx:200;--cy:210;--w:220;--h:276;--r:50% 50% 50% 50% / 42% 42% 58% 58%"></i>
      <i class="r" style="--cx:200;--cy:272;--w:112;--h:120;--r:50% 50% 50% 50% / 44% 44% 56% 56%"></i>
      <i class="d" style="--cx:178;--cy:252;--w:18;--h:20"></i>
      <i class="d" style="--cx:222;--cy:252;--w:18;--h:20"></i>
      <i class="d" style="--cx:200;--cy:270;--w:18;--h:20"></i>
      <i class="d" style="--cx:174;--cy:290;--w:18;--h:20"></i>
      <i class="d" style="--cx:226;--cy:290;--w:18;--h:20"></i>
      <i class="d" style="--cx:200;--cy:308;--w:18;--h:20"></i>
      <i class="r" style="--cx:136;--cy:190;--w:36;--h:22"></i>
      <i class="r" style="--cx:264;--cy:190;--w:36;--h:22"></i>
      <i class="d" style="--cx:168;--cy:156;--w:28;--h:32"></i>
      <i class="d w" style="--cx:173;--cy:149;--w:10;--h:10"></i>
      <i class="d" style="--cx:232;--cy:156;--w:28;--h:32"></i>
      <i class="d w" style="--cx:237;--cy:149;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:186;--w:44;--h:24"></i>
    `
  },
  {
    id: 'olive', group: 'fruit',
    name: 'Olive',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:366;--w:300;--h:36"></i>
      <i class="r" style="--cx:206;--cy:78;--w:24;--h:60;--k:10;--rot:8deg"></i>
      <i class="r" style="--cx:144;--cy:74;--w:110;--h:50;--r:0 100% 0 100%;--rot:16deg"></i>
      <i class="d" style="--cx:142;--cy:74;--w:94;--h:6;--k:3;--rot:32deg"></i>
      <i class="r" style="--cx:268;--cy:70;--w:110;--h:50;--r:100% 0 100% 0;--rot:-16deg"></i>
      <i class="d" style="--cx:270;--cy:70;--w:94;--h:6;--k:3;--rot:-32deg"></i>
      <i class="r" style="--cx:204;--cy:220;--w:236;--h:272"></i>
      <i class="r" style="--cx:150;--cy:152;--w:32;--h:62;--rot:24deg"></i>
      <i class="r" style="--cx:142;--cy:256;--w:36;--h:22"></i>
      <i class="r" style="--cx:266;--cy:256;--w:36;--h:22"></i>
      <i class="d" style="--cx:172;--cy:220;--w:28;--h:32"></i>
      <i class="d w" style="--cx:177;--cy:213;--w:10;--h:10"></i>
      <i class="d" style="--cx:236;--cy:220;--w:28;--h:32"></i>
      <i class="d w" style="--cx:241;--cy:213;--w:10;--h:10"></i>
      <i class="ln" style="--cx:204;--cy:256;--w:46;--h:28"></i>
    `
  },
  {
    id: 'artichoke', group: 'fruit',
    name: 'Artichoke',
    // Pointy leaves (rounded diamonds, the point up) peek out behind an egg-shaped body; the stem sits under it.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:370;--w:300;--h:32"></i>
      <i class="r" style="--cx:200;--cy:330;--w:48;--h:70;--k:16"></i>
      <i class="r" style="--cx:200;--cy:92;--w:96;--h:96;--r:12% 50% 50% 50%;--rot:45deg"></i>
      <i class="r" style="--cx:136;--cy:118;--w:96;--h:96;--r:12% 50% 50% 50%;--rot:25deg"></i>
      <i class="r" style="--cx:264;--cy:118;--w:96;--h:96;--r:12% 50% 50% 50%;--rot:65deg"></i>
      <i class="r" style="--cx:96;--cy:190;--w:96;--h:96;--r:12% 50% 50% 50%;--rot:8deg"></i>
      <i class="r" style="--cx:304;--cy:190;--w:96;--h:96;--r:12% 50% 50% 50%;--rot:82deg"></i>
      <i class="r" style="--cx:200;--cy:218;--w:236;--h:236;--r:50% 50% 50% 50% / 44% 44% 56% 56%"></i>
      <i class="ln up" style="--cx:200;--cy:142;--w:120;--h:50"></i>
      <i class="r" style="--cx:136;--cy:248;--w:36;--h:22"></i>
      <i class="r" style="--cx:264;--cy:248;--w:36;--h:22"></i>
      <i class="d" style="--cx:168;--cy:214;--w:28;--h:32"></i>
      <i class="d w" style="--cx:173;--cy:207;--w:10;--h:10"></i>
      <i class="d" style="--cx:232;--cy:214;--w:28;--h:32"></i>
      <i class="d w" style="--cx:237;--cy:207;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:248;--w:44;--h:24"></i>
    `
  },
  {
    id: 'dragonfruit', group: 'fruit',
    name: 'Dragon Fruit',
    // Leafy tips (lens leaves) poke out round a big oval body, a tuft on top.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:370;--w:300;--h:32"></i>
      <i class="r" style="--cx:166;--cy:84;--w:104;--h:60;--r:0 100% 0 100%;--rot:56deg"></i>
      <i class="r" style="--cx:234;--cy:84;--w:104;--h:60;--r:100% 0 100% 0;--rot:-56deg"></i>
      <i class="r" style="--cx:200;--cy:76;--w:56;--h:104;--r:50% 50% 50% 50% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:84;--cy:160;--w:112;--h:62;--r:0 100% 0 100%;--rot:24deg"></i>
      <i class="r" style="--cx:316;--cy:160;--w:112;--h:62;--r:100% 0 100% 0;--rot:-24deg"></i>
      <i class="r" style="--cx:70;--cy:262;--w:112;--h:62;--r:0 100% 0 100%;--rot:4deg"></i>
      <i class="r" style="--cx:330;--cy:262;--w:112;--h:62;--r:100% 0 100% 0;--rot:-4deg"></i>
      <i class="r" style="--cx:200;--cy:226;--w:250;--h:270"></i>
      <i class="r" style="--cx:146;--cy:318;--w:92;--h:50;--r:0 100% 0 100%;--rot:34deg"></i>
      <i class="r" style="--cx:254;--cy:318;--w:92;--h:50;--r:100% 0 100% 0;--rot:-34deg"></i>
      <i class="r" style="--cx:136;--cy:248;--w:36;--h:22"></i>
      <i class="r" style="--cx:264;--cy:248;--w:36;--h:22"></i>
      <i class="d" style="--cx:168;--cy:212;--w:28;--h:32"></i>
      <i class="d w" style="--cx:173;--cy:205;--w:10;--h:10"></i>
      <i class="d" style="--cx:232;--cy:212;--w:28;--h:32"></i>
      <i class="d w" style="--cx:237;--cy:205;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:248;--w:46;--h:26"></i>
    `
  },
  {
    id: 'blackberry', group: 'fruit',
    name: 'Blackberry',
    // An egg-shaped berry covered in round little bumps (each one colorable), a leafy cap and one big leaf.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:370;--w:300;--h:32"></i>
      <i class="r" style="--cx:200;--cy:56;--w:24;--h:56;--k:10"></i>
      <i class="r" style="--cx:290;--cy:72;--w:130;--h:62;--r:100% 0 100% 0;--rot:-24deg"></i>
      <i class="r" style="--cx:200;--cy:226;--w:236;--h:262;--r:50% 50% 50% 50% / 46% 46% 54% 54%"></i>
      <i class="r" style="--cx:154;--cy:150;--w:48;--h:48"></i>
      <i class="r" style="--cx:246;--cy:150;--w:48;--h:48"></i>
      <i class="r" style="--cx:118;--cy:206;--w:48;--h:48"></i>
      <i class="r" style="--cx:282;--cy:206;--w:48;--h:48"></i>
      <i class="r" style="--cx:150;--cy:310;--w:48;--h:48"></i>
      <i class="r" style="--cx:200;--cy:322;--w:48;--h:48"></i>
      <i class="r" style="--cx:250;--cy:310;--w:48;--h:48"></i>
      <i class="r" style="--cx:162;--cy:104;--w:84;--h:40;--r:0 100% 0 100%;--rot:14deg"></i>
      <i class="r" style="--cx:238;--cy:104;--w:84;--h:40;--r:100% 0 100% 0;--rot:-14deg"></i>
      <i class="r" style="--cx:200;--cy:100;--w:50;--h:38"></i>
      <i class="r" style="--cx:136;--cy:262;--w:36;--h:22"></i>
      <i class="r" style="--cx:264;--cy:262;--w:36;--h:22"></i>
      <i class="d" style="--cx:168;--cy:222;--w:28;--h:32"></i>
      <i class="d w" style="--cx:173;--cy:215;--w:10;--h:10"></i>
      <i class="d" style="--cx:232;--cy:222;--w:28;--h:32"></i>
      <i class="d w" style="--cx:237;--cy:215;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:258;--w:44;--h:26"></i>
    `
  },
  {
    id: 'cranberries', group: 'fruit',
    name: 'Cranberries',
    // A bowl full of cranberries: one big smiley berry in the middle, four little ones round it.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:374;--w:340;--h:30"></i>
      <i class="r" style="--cx:242;--cy:50;--w:76;--h:40;--r:100% 0 100% 0;--rot:-24deg"></i>
      <i class="r" style="--cx:204;--cy:62;--w:18;--h:40;--k:8;--rot:12deg"></i>
      <i class="r" style="--cx:92;--cy:196;--w:96;--h:96"></i>
      <i class="r" style="--cx:308;--cy:196;--w:96;--h:96"></i>
      <i class="r" style="--cx:118;--cy:126;--w:92;--h:92"></i>
      <i class="r" style="--cx:282;--cy:126;--w:92;--h:92"></i>
      <i class="r" style="--cx:200;--cy:150;--w:176;--h:170"></i>
      <i class="r" style="--cx:200;--cy:352;--w:130;--h:32;--k:12"></i>
      <i class="r" style="--cx:200;--cy:270;--w:316;--h:156;--r:0 0 50% 50% / 0 0 100% 100%"></i>
      <i class="r" style="--cx:200;--cy:212;--w:352;--h:44;--k:22"></i>
      <i class="r" style="--cx:142;--cy:168;--w:32;--h:20"></i>
      <i class="r" style="--cx:258;--cy:168;--w:32;--h:20"></i>
      <i class="d" style="--cx:172;--cy:130;--w:26;--h:30"></i>
      <i class="d w" style="--cx:177;--cy:123;--w:9;--h:9"></i>
      <i class="d" style="--cx:228;--cy:130;--w:26;--h:30"></i>
      <i class="d w" style="--cx:233;--cy:123;--w:9;--h:9"></i>
      <i class="ln" style="--cx:200;--cy:162;--w:40;--h:24"></i>
    `
  },
  {
    id: 'kumquat', group: 'fruit',
    name: 'Kumquat',
    // Two little oval citrus fruits hanging from a twig with two leaves; the big one has the face.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:370;--w:300;--h:32"></i>
      <i class="r" style="--cx:176;--cy:100;--w:20;--h:64;--k:8"></i>
      <i class="r" style="--cx:302;--cy:100;--w:20;--h:80;--k:8"></i>
      <i class="r" style="--cx:200;--cy:76;--w:300;--h:26;--k:13;--rot:-6deg"></i>
      <i class="r" style="--cx:96;--cy:110;--w:120;--h:56;--r:0 100% 0 100%;--rot:-28deg"></i>
      <i class="r" style="--cx:330;--cy:44;--w:110;--h:50;--r:100% 0 100% 0;--rot:-16deg"></i>
      <i class="r" style="--cx:302;--cy:214;--w:118;--h:150"></i>
      <i class="r" style="--cx:176;--cy:236;--w:212;--h:246"></i>
      <i class="r" style="--cx:176;--cy:120;--w:46;--h:28"></i>
      <i class="r" style="--cx:302;--cy:142;--w:36;--h:22"></i>
      <i class="r" style="--cx:112;--cy:270;--w:36;--h:22"></i>
      <i class="r" style="--cx:240;--cy:270;--w:36;--h:22"></i>
      <i class="d" style="--cx:144;--cy:232;--w:28;--h:32"></i>
      <i class="d w" style="--cx:149;--cy:225;--w:10;--h:10"></i>
      <i class="d" style="--cx:208;--cy:232;--w:28;--h:32"></i>
      <i class="d w" style="--cx:213;--cy:225;--w:10;--h:10"></i>
      <i class="ln" style="--cx:176;--cy:266;--w:44;--h:26"></i>
    `
  },
  {
    id: 'asparagus', group: 'fruit',
    name: 'Asparagus',
    // Three spears tied with a band; the middle one has the face. Each tip is a teardrop pointing up.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:370;--w:320;--h:32"></i>
      <i class="r" style="--cx:128;--cy:224;--w:72;--h:280;--k:30;--rot:-14deg"></i>
      <i class="r" style="--cx:272;--cy:224;--w:72;--h:280;--k:30;--rot:14deg"></i>
      <i class="r" style="--cx:98;--cy:96;--w:76;--h:76;--r:12% 50% 50% 50%;--rot:31deg"></i>
      <i class="r" style="--cx:302;--cy:96;--w:76;--h:76;--r:12% 50% 50% 50%;--rot:59deg"></i>
      <i class="r" style="--cx:112;--cy:170;--w:40;--h:22;--r:100% 0 100% 0;--rot:-50deg"></i>
      <i class="r" style="--cx:288;--cy:170;--w:40;--h:22;--r:0 100% 0 100%;--rot:50deg"></i>
      <i class="r" style="--cx:200;--cy:218;--w:104;--h:290;--k:40"></i>
      <i class="r" style="--cx:200;--cy:76;--w:96;--h:96;--r:12% 50% 50% 50%;--rot:45deg"></i>
      <i class="r" style="--cx:200;--cy:288;--w:270;--h:50;--k:18"></i>
      <i class="r" style="--cx:166;--cy:208;--w:28;--h:20"></i>
      <i class="r" style="--cx:234;--cy:208;--w:28;--h:20"></i>
      <i class="d" style="--cx:180;--cy:172;--w:24;--h:30"></i>
      <i class="d w" style="--cx:184;--cy:165;--w:9;--h:9"></i>
      <i class="d" style="--cx:220;--cy:172;--w:24;--h:30"></i>
      <i class="d w" style="--cx:224;--cy:165;--w:9;--h:9"></i>
      <i class="ln" style="--cx:200;--cy:206;--w:36;--h:22"></i>
    `
  }
);
