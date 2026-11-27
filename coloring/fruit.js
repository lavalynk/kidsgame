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
  },
  {
    id: 'persimmon', group: 'fruit',
    name: 'Persimmon',
    // A squat, roundish-square persimmon with its big four-leaf cap on top, a button in the middle and a little stem.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:370;--w:320;--h:32"></i>
      <i class="r" style="--cx:200;--cy:240;--w:330;--h:230;--r:46% 46% 46% 46% / 40% 40% 60% 60%"></i>
      <i class="r" style="--cx:120;--cy:128;--w:140;--h:60;--r:0 100% 0 100%;--rot:-8deg"></i>
      <i class="r" style="--cx:280;--cy:128;--w:140;--h:60;--r:100% 0 100% 0;--rot:8deg"></i>
      <i class="r" style="--cx:152;--cy:156;--w:124;--h:56;--r:100% 0 100% 0;--rot:26deg"></i>
      <i class="r" style="--cx:248;--cy:156;--w:124;--h:56;--r:0 100% 0 100%;--rot:-26deg"></i>
      <i class="r" style="--cx:200;--cy:96;--w:24;--h:56;--k:10"></i>
      <i class="r" style="--cx:200;--cy:132;--w:66;--h:50"></i>
      <i class="r" style="--cx:138;--cy:270;--w:36;--h:22"></i>
      <i class="r" style="--cx:262;--cy:270;--w:36;--h:22"></i>
      <i class="d" style="--cx:168;--cy:232;--w:28;--h:32"></i>
      <i class="d w" style="--cx:173;--cy:225;--w:10;--h:10"></i>
      <i class="d" style="--cx:232;--cy:232;--w:28;--h:32"></i>
      <i class="d w" style="--cx:237;--cy:225;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:266;--w:44;--h:26"></i>
    `
  },
  {
    id: 'brussels', group: 'fruit',
    name: 'Brussels Sprout',
    // A round little sprout: a ball with a leaf hugging each side, a leaf flap on top and a stubby stem.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:370;--w:300;--h:32"></i>
      <i class="r" style="--cx:200;--cy:332;--w:70;--h:56;--k:16"></i>
      <i class="r" style="--cx:200;--cy:76;--w:120;--h:66;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:200;--cy:200;--w:280;--h:272"></i>
      <i class="r" style="--cx:124;--cy:216;--w:132;--h:132;--r:100% 0 100% 0;--rot:-38deg"></i>
      <i class="r" style="--cx:276;--cy:216;--w:132;--h:132;--r:0 100% 0 100%;--rot:38deg"></i>
      <i class="r" style="--cx:200;--cy:84;--w:84;--h:40;--r:0 0 50% 50% / 0 0 100% 100%"></i>
      <i class="r" style="--cx:154;--cy:234;--w:30;--h:20"></i>
      <i class="r" style="--cx:246;--cy:234;--w:30;--h:20"></i>
      <i class="d" style="--cx:174;--cy:196;--w:26;--h:30"></i>
      <i class="d w" style="--cx:179;--cy:189;--w:9;--h:9"></i>
      <i class="d" style="--cx:226;--cy:196;--w:26;--h:30"></i>
      <i class="d w" style="--cx:231;--cy:189;--w:9;--h:9"></i>
      <i class="ln" style="--cx:200;--cy:230;--w:40;--h:24"></i>
    `
  },
  {
    id: 'leek', group: 'fruit',
    name: 'Leek',
    // A tall leek: three big leaves fanning out at the top, a pale band, a long white stalk
    // with the face, and three stubby roots.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:378;--w:300;--h:26"></i>
      <i class="r" style="--cx:170;--cy:352;--w:22;--h:46;--k:10;--rot:26deg"></i>
      <i class="r" style="--cx:200;--cy:356;--w:22;--h:48;--k:10"></i>
      <i class="r" style="--cx:230;--cy:352;--w:22;--h:46;--k:10;--rot:-26deg"></i>
      <i class="r" style="--cx:132;--cy:118;--w:80;--h:184;--r:0 100% 0 100%;--rot:-24deg"></i>
      <i class="r" style="--cx:268;--cy:118;--w:80;--h:184;--r:100% 0 100% 0;--rot:24deg"></i>
      <i class="r" style="--cx:200;--cy:104;--w:84;--h:168;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:200;--cy:250;--w:124;--h:180;--k:44"></i>
      <i class="r" style="--cx:200;--cy:168;--w:124;--h:56;--k:22"></i>
      <i class="r" style="--cx:160;--cy:274;--w:28;--h:18"></i>
      <i class="r" style="--cx:240;--cy:274;--w:28;--h:18"></i>
      <i class="d" style="--cx:178;--cy:240;--w:26;--h:30"></i>
      <i class="d w" style="--cx:183;--cy:233;--w:9;--h:9"></i>
      <i class="d" style="--cx:222;--cy:240;--w:26;--h:30"></i>
      <i class="d w" style="--cx:227;--cy:233;--w:9;--h:9"></i>
      <i class="ln" style="--cx:200;--cy:270;--w:38;--h:22"></i>
    `
  },
  {
    id: 'cantaloupe', group: 'fruit',
    name: 'Cantaloupe',
    // A round melon with a stem and a leaf (the face is on it), and a slice of melon in front.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:370;--w:340;--h:32"></i>
      <i class="r" style="--cx:166;--cy:66;--w:22;--h:48;--k:9;--rot:10deg"></i>
      <i class="r" style="--cx:222;--cy:60;--w:96;--h:46;--r:100% 0 100% 0;--rot:-20deg"></i>
      <i class="r" style="--cx:166;--cy:210;--w:280;--h:270"></i>
      <i class="ln" style="--cx:114;--cy:210;--w:250;--h:70;--rot:90deg"></i>
      <i class="ln" style="--cx:218;--cy:210;--w:250;--h:70;--rot:-90deg"></i>
      <i class="r" style="--cx:290;--cy:300;--w:196;--h:110;--r:0 0 50% 50% / 0 0 100% 100%"></i>
      <i class="r" style="--cx:290;--cy:288;--w:156;--h:78;--r:0 0 50% 50% / 0 0 100% 100%"></i>
      <i class="d" style="--cx:262;--cy:264;--w:10;--h:16;--rot:-20deg"></i>
      <i class="d" style="--cx:290;--cy:270;--w:10;--h:16"></i>
      <i class="d" style="--cx:318;--cy:264;--w:10;--h:16;--rot:20deg"></i>
      <i class="r" style="--cx:110;--cy:200;--w:34;--h:20"></i>
      <i class="r" style="--cx:222;--cy:200;--w:34;--h:20"></i>
      <i class="d" style="--cx:140;--cy:162;--w:28;--h:32"></i>
      <i class="d w" style="--cx:145;--cy:155;--w:10;--h:10"></i>
      <i class="d" style="--cx:192;--cy:162;--w:28;--h:32"></i>
      <i class="d w" style="--cx:197;--cy:155;--w:10;--h:10"></i>
      <i class="ln" style="--cx:166;--cy:196;--w:44;--h:26"></i>
    `
  },
  {
    id: 'grapefruit', group: 'fruit',
    name: 'Grapefruit',
    // Cut in half: the round peel underneath (the face is on it) and the juicy top with its 6 wedges.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:364;--w:340;--h:32"></i>
      <i class="r" style="--cx:200;--cy:248;--w:336;--h:206;--r:0 0 50% 50% / 0 0 100% 100%"></i>
      <i class="r" style="--cx:200;--cy:145;--w:336;--h:202"></i>
      <i class="r" style="--cx:200;--cy:145;--w:292;--h:175"></i>
      <i class="r" style="--cx:269;--cy:169;--w:101;--h:39;--rot:-166deg"></i>
      <i class="r" style="--cx:200;--cy:193;--w:65;--h:60;--rot:90deg"></i>
      <i class="r" style="--cx:131;--cy:169;--w:101;--h:39;--rot:166deg"></i>
      <i class="r" style="--cx:131;--cy:121;--w:101;--h:39;--rot:-166deg"></i>
      <i class="r" style="--cx:200;--cy:97;--w:65;--h:60;--rot:90deg"></i>
      <i class="r" style="--cx:269;--cy:121;--w:101;--h:39;--rot:166deg"></i>
      <i class="r" style="--cx:200;--cy:145;--w:46;--h:28"></i>
      <i class="r" style="--cx:136;--cy:304;--w:34;--h:20"></i>
      <i class="r" style="--cx:264;--cy:304;--w:34;--h:20"></i>
      <i class="d" style="--cx:174;--cy:282;--w:28;--h:32"></i>
      <i class="d w" style="--cx:179;--cy:275;--w:10;--h:10"></i>
      <i class="d" style="--cx:226;--cy:282;--w:28;--h:32"></i>
      <i class="d w" style="--cx:231;--cy:275;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:312;--w:44;--h:26"></i>
    `
  },
  {
    id: 'lychee', group: 'fruit',
    name: 'Lychee',
    // A round bumpy lychee (its bumpy edge is one SVG path, class "r p") with a stem and two leaves.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:372;--w:320;--h:32"></i>
      <i class="r" style="--cx:200;--cy:58;--w:22;--h:50;--k:9"></i>
      <i class="r" style="--cx:146;--cy:56;--w:100;--h:44;--r:0 100% 0 100%;--rot:18deg"></i>
      <i class="r" style="--cx:254;--cy:56;--w:100;--h:44;--r:100% 0 100% 0;--rot:-18deg"></i>
      <i class="r p" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"><svg viewBox="0 0 400 400"><path d="M200 80 Q222 66 240 86 Q266 78 277 103 Q303 103 307 129 Q333 137 329 163 Q352 177 341 202 Q358 222 341 242 Q352 267 329 281 Q333 307 307 315 Q303 341 277 341 Q266 366 240 358 Q222 378 200 364 Q178 378 160 358 Q134 366 123 341 Q97 341 93 315 Q67 307 71 281 Q48 267 59 242 Q42 222 59 202 Q48 177 71 163 Q67 137 93 129 Q97 103 123 103 Q134 78 160 86 Q178 66 200 80 Z"/></svg></i>
      <i class="r" style="--cx:130;--cy:244;--w:34;--h:20"></i>
      <i class="r" style="--cx:270;--cy:244;--w:34;--h:20"></i>
      <i class="d" style="--cx:168;--cy:210;--w:28;--h:32"></i>
      <i class="d w" style="--cx:173;--cy:203;--w:10;--h:10"></i>
      <i class="d" style="--cx:232;--cy:210;--w:28;--h:32"></i>
      <i class="d w" style="--cx:237;--cy:203;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:248;--w:44;--h:26"></i>
    `
  },
  {
    id: 'bokchoy', group: 'fruit',
    name: 'Bok Choy',
    // Three big leaves fanning out on top of three white stalks; the face is on the front stalk.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:376;--w:340;--h:32"></i>
      <i class="r" style="--cx:112;--cy:140;--w:150;--h:200;--rot:-26deg"></i>
      <i class="r" style="--cx:288;--cy:140;--w:150;--h:200;--rot:26deg"></i>
      <i class="d" style="--cx:118;--cy:158;--w:8;--h:110;--k:4;--rot:-26deg"></i>
      <i class="d" style="--cx:282;--cy:158;--w:8;--h:110;--k:4;--rot:26deg"></i>
      <i class="r" style="--cx:200;--cy:118;--w:170;--h:200"></i>
      <i class="d" style="--cx:200;--cy:150;--w:8;--h:120;--k:4"></i>
      <i class="r" style="--cx:146;--cy:282;--w:92;--h:196;--k:38;--rot:-12deg"></i>
      <i class="r" style="--cx:254;--cy:282;--w:92;--h:196;--k:38;--rot:12deg"></i>
      <i class="r" style="--cx:200;--cy:288;--w:134;--h:196;--k:46"></i>
      <i class="r" style="--cx:158;--cy:298;--w:34;--h:20"></i>
      <i class="r" style="--cx:242;--cy:298;--w:34;--h:20"></i>
      <i class="d" style="--cx:176;--cy:266;--w:28;--h:32"></i>
      <i class="d w" style="--cx:181;--cy:259;--w:10;--h:10"></i>
      <i class="d" style="--cx:224;--cy:266;--w:28;--h:32"></i>
      <i class="d w" style="--cx:229;--cy:259;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:300;--w:44;--h:26"></i>
    `
  },
  {
    id: 'acorn', group: 'fruit',
    name: 'Acorn',
    // A smiley acorn: a round nut with a little point, a cap with a rim, a stem and one leaf.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:382;--w:300;--h:26"></i>
      <i class="r" style="--cx:214;--cy:74;--w:24;--h:52;--k:10;--rot:15deg"></i>
      <i class="r" style="--cx:266;--cy:82;--w:92;--h:44;--r:100% 0 100% 0;--rot:-20deg"></i>
      <i class="r" style="--cx:200;--cy:350;--w:36;--h:36;--k:8;--rot:45deg"></i>
      <i class="r" style="--cx:200;--cy:248;--w:236;--h:220;--r:50% 50% 50% 50% / 40% 40% 60% 60%"></i>
      <i class="r" style="--cx:200;--cy:150;--w:270;--h:124;--r:50% 50% 40% 40% / 70% 70% 30% 30%"></i>
      <i class="r" style="--cx:200;--cy:198;--w:280;--h:40;--k:20"></i>
      <i class="r" style="--cx:134;--cy:292;--w:34;--h:20"></i>
      <i class="r" style="--cx:266;--cy:292;--w:34;--h:20"></i>
      <i class="d" style="--cx:170;--cy:262;--w:28;--h:32"></i>
      <i class="d w" style="--cx:175;--cy:255;--w:10;--h:10"></i>
      <i class="d" style="--cx:230;--cy:262;--w:28;--h:32"></i>
      <i class="d w" style="--cx:235;--cy:255;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:298;--w:44;--h:26"></i>
    `
  },
  {
    id: 'passionfruit', group: 'fruit',
    name: 'Passion Fruit',
    // Cut in half, seen from the front: the rind, a white ring, the juicy middle and 8 seeds round the smiley face.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:374;--w:320;--h:32"></i>
      <i class="r" style="--cx:200;--cy:205;--w:320;--h:320"></i>
      <i class="r" style="--cx:200;--cy:205;--w:272;--h:272"></i>
      <i class="r" style="--cx:200;--cy:205;--w:234;--h:234"></i>
      <i class="r" style="--cx:292;--cy:205;--w:24;--h:30;--rot:90deg"></i>
      <i class="r" style="--cx:265;--cy:270;--w:24;--h:30;--rot:135deg"></i>
      <i class="r" style="--cx:200;--cy:297;--w:24;--h:30;--rot:180deg"></i>
      <i class="r" style="--cx:135;--cy:270;--w:24;--h:30;--rot:225deg"></i>
      <i class="r" style="--cx:108;--cy:205;--w:24;--h:30;--rot:270deg"></i>
      <i class="r" style="--cx:135;--cy:140;--w:24;--h:30;--rot:315deg"></i>
      <i class="r" style="--cx:200;--cy:113;--w:24;--h:30;--rot:360deg"></i>
      <i class="r" style="--cx:265;--cy:140;--w:24;--h:30;--rot:405deg"></i>
      <i class="r" style="--cx:152;--cy:240;--w:34;--h:20"></i>
      <i class="r" style="--cx:248;--cy:240;--w:34;--h:20"></i>
      <i class="d" style="--cx:170;--cy:198;--w:28;--h:32"></i>
      <i class="d w" style="--cx:175;--cy:191;--w:10;--h:10"></i>
      <i class="d" style="--cx:230;--cy:198;--w:28;--h:32"></i>
      <i class="d w" style="--cx:235;--cy:191;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:232;--w:44;--h:26"></i>
    `
  },
  {
    id: 'kohlrabi', group: 'fruit',
    name: 'Kohlrabi',
    // A round kohlrabi bulb with three leafy stalks growing out of the top and two little stubs on its sides.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:378;--w:320;--h:30"></i>
      <i class="r" style="--cx:136;--cy:128;--w:24;--h:120;--k:12;--rot:-34deg"></i>
      <i class="r" style="--cx:264;--cy:128;--w:24;--h:120;--k:12;--rot:34deg"></i>
      <i class="r" style="--cx:200;--cy:120;--w:24;--h:110;--k:12"></i>
      <i class="r" style="--cx:92;--cy:76;--w:84;--h:116;--rot:-34deg"></i>
      <i class="r" style="--cx:308;--cy:76;--w:84;--h:116;--rot:34deg"></i>
      <i class="r" style="--cx:200;--cy:62;--w:84;--h:104"></i>
      <i class="r" style="--cx:80;--cy:236;--w:70;--h:24;--k:12;--rot:-24deg"></i>
      <i class="r" style="--cx:320;--cy:236;--w:70;--h:24;--k:12;--rot:24deg"></i>
      <i class="r" style="--cx:200;--cy:266;--w:250;--h:220"></i>
      <i class="r" style="--cx:134;--cy:294;--w:34;--h:20"></i>
      <i class="r" style="--cx:266;--cy:294;--w:34;--h:20"></i>
      <i class="d" style="--cx:170;--cy:258;--w:28;--h:32"></i>
      <i class="d w" style="--cx:175;--cy:251;--w:10;--h:10"></i>
      <i class="d" style="--cx:230;--cy:258;--w:28;--h:32"></i>
      <i class="d w" style="--cx:235;--cy:251;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:298;--w:44;--h:26"></i>
    `
  },
  {
    id: 'butternut', group: 'fruit',
    name: 'Butternut Squash',
    // The squash's long neck and round bottom are one SVG path (class "r p", like the peanut), plus a stem and a leaf.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:374;--w:320;--h:32"></i>
      <i class="r" style="--cx:206;--cy:52;--w:30;--h:56;--k:10;--rot:10deg"></i>
      <i class="r" style="--cx:146;--cy:50;--w:84;--h:40;--r:0 100% 0 100%;--rot:20deg"></i>
      <i class="r p" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"><svg viewBox="0 0 400 400"><path d="M152 84 C152 62 248 62 248 84 C248 150 248 194 274 214 C318 238 340 270 336 304 C330 348 276 366 200 366 C124 366 70 348 64 304 C60 270 82 238 130 214 C152 194 152 150 152 84 Z"/></svg></i>
      <i class="r" style="--cx:134;--cy:296;--w:34;--h:20"></i>
      <i class="r" style="--cx:266;--cy:296;--w:34;--h:20"></i>
      <i class="d" style="--cx:170;--cy:264;--w:28;--h:32"></i>
      <i class="d w" style="--cx:175;--cy:257;--w:10;--h:10"></i>
      <i class="d" style="--cx:230;--cy:264;--w:28;--h:32"></i>
      <i class="d w" style="--cx:235;--cy:257;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:298;--w:44;--h:26"></i>
    `
  },
  {
    id: 'chestnut', group: 'fruit',
    name: 'Chestnut',
    // A shiny chestnut: a round body with a pointy top and a little tuft (one SVG path, class "r p"),
    // and the pale patch across its bottom (a second path that follows the same bottom curve).
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:372;--w:320;--h:32"></i>
      <i class="r" style="--cx:200;--cy:84;--w:24;--h:44;--k:12"></i>
      <i class="r p" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"><svg viewBox="0 0 400 400"><path d="M200 96 C236 128 334 166 340 256 C346 326 290 356 200 356 C110 356 54 326 60 256 C66 166 164 128 200 96 Z"/></svg></i>
      <i class="r p" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"><svg viewBox="0 0 400 400"><path d="M78 312 C104 340 150 356 200 356 C250 356 296 340 322 312 C280 290 120 290 78 312 Z"/></svg></i>
      <i class="r" style="--cx:134;--cy:244;--w:34;--h:20"></i>
      <i class="r" style="--cx:266;--cy:244;--w:34;--h:20"></i>
      <i class="d" style="--cx:170;--cy:210;--w:28;--h:32"></i>
      <i class="d w" style="--cx:175;--cy:203;--w:10;--h:10"></i>
      <i class="d" style="--cx:230;--cy:210;--w:28;--h:32"></i>
      <i class="d w" style="--cx:235;--cy:203;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:244;--w:44;--h:26"></i>
    `
  },
  {
    id: 'walnut', group: 'fruit',
    name: 'Walnut',
    // A walnut in its shell: a round bumpy shell (one SVG path, class "r p"), the ridge down its
    // middle above the face, two wrinkle lines and a leaf.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:372;--w:320;--h:32"></i>
      <i class="r" style="--cx:262;--cy:72;--w:92;--h:42;--r:100% 0 100% 0;--rot:-16deg"></i>
      <i class="r p" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"><svg viewBox="0 0 400 400"><path d="M200 82 Q237 60 262 96 Q305 92 311 134 Q351 149 338 189 Q368 220 338 251 Q351 291 311 306 Q305 348 262 344 Q237 380 200 358 Q163 380 138 344 Q95 348 89 306 Q49 291 62 251 Q32 220 62 189 Q49 149 89 134 Q95 92 138 96 Q163 60 200 82 Z"/></svg></i>
      <i class="r" style="--cx:200;--cy:136;--w:34;--h:120"></i>
      <i class="ln up" style="--cx:128;--cy:176;--w:56;--h:36;--rot:-40deg"></i>
      <i class="ln up" style="--cx:272;--cy:176;--w:56;--h:36;--rot:40deg"></i>
      <i class="r" style="--cx:134;--cy:270;--w:34;--h:20"></i>
      <i class="r" style="--cx:266;--cy:270;--w:34;--h:20"></i>
      <i class="d" style="--cx:170;--cy:232;--w:28;--h:32"></i>
      <i class="d w" style="--cx:175;--cy:225;--w:10;--h:10"></i>
      <i class="d" style="--cx:230;--cy:232;--w:28;--h:32"></i>
      <i class="d w" style="--cx:235;--cy:225;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:272;--w:44;--h:26"></i>
    `
  },
  {
    id: 'gooseberry', group: 'fruit',
    name: 'Gooseberry',
    // A striped gooseberry: three ovals inside each other make the stripes, with a stem and a leaf on top.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:372;--w:320;--h:32"></i>
      <i class="r" style="--cx:204;--cy:70;--w:20;--h:50;--k:10;--rot:6deg"></i>
      <i class="r" style="--cx:256;--cy:62;--w:90;--h:42;--r:100% 0 100% 0;--rot:-10deg"></i>
      <i class="r" style="--cx:200;--cy:216;--w:292;--h:288"></i>
      <i class="r" style="--cx:200;--cy:216;--w:214;--h:288"></i>
      <i class="r" style="--cx:200;--cy:216;--w:140;--h:288"></i>
      <i class="r" style="--cx:155;--cy:250;--w:28;--h:18"></i>
      <i class="r" style="--cx:245;--cy:250;--w:28;--h:18"></i>
      <i class="d" style="--cx:176;--cy:212;--w:26;--h:30"></i>
      <i class="d w" style="--cx:181;--cy:205;--w:9;--h:9"></i>
      <i class="d" style="--cx:224;--cy:212;--w:26;--h:30"></i>
      <i class="d w" style="--cx:229;--cy:205;--w:9;--h:9"></i>
      <i class="ln" style="--cx:200;--cy:248;--w:38;--h:24"></i>
    `
  },
  {
    id: 'pistachio', group: 'fruit',
    name: 'Pistachio',
    // An open pistachio: the shell (one SVG path with a V gap on top) and the round nut peeking out, with two skin patches.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:372;--w:320;--h:32"></i>
      <i class="r" style="--cx:200;--cy:158;--w:196;--h:150"></i>
      <i class="r" style="--cx:236;--cy:122;--w:64;--h:36;--r:100% 0 100% 0;--rot:-14deg"></i>
      <i class="r" style="--cx:160;--cy:118;--w:44;--h:28;--rot:20deg"></i>
      <i class="r p" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"><svg viewBox="0 0 400 400"><path d="M200 352 C110 352 64 300 64 242 C64 196 86 162 120 148 Q166 168 200 200 Q234 168 280 148 C312 152 336 192 336 242 C336 300 290 352 200 352 Z"/></svg></i>
      <i class="r" style="--cx:128;--cy:298;--w:34;--h:20"></i>
      <i class="r" style="--cx:272;--cy:298;--w:34;--h:20"></i>
      <i class="d" style="--cx:170;--cy:262;--w:28;--h:32"></i>
      <i class="d w" style="--cx:175;--cy:255;--w:10;--h:10"></i>
      <i class="d" style="--cx:230;--cy:262;--w:28;--h:32"></i>
      <i class="d w" style="--cx:235;--cy:255;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:300;--w:44;--h:26"></i>
    `
  },
  {
    id: 'quince', group: 'fruit',
    name: 'Quince',
    // A lumpy quince: one SVG path with round shoulders and a bumpy bottom, a stem and two leaves.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:372;--w:320;--h:32"></i>
      <i class="r" style="--cx:204;--cy:78;--w:22;--h:52;--k:11;--rot:8deg"></i>
      <i class="r" style="--cx:262;--cy:66;--w:100;--h:46;--r:100% 0 100% 0;--rot:-12deg"></i>
      <i class="r" style="--cx:146;--cy:70;--w:84;--h:40;--r:0 100% 0 100%;--rot:14deg"></i>
      <i class="r p" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"><svg viewBox="0 0 400 400"><path d="M200 98 C232 96 250 118 264 140 C322 152 348 210 340 268 C334 320 300 350 256 350 Q228 362 200 354 Q172 362 144 350 C100 350 66 320 60 268 C52 210 78 152 136 140 C150 118 168 100 200 98 Z"/></svg></i>
      <i class="r" style="--cx:130;--cy:288;--w:34;--h:20"></i>
      <i class="r" style="--cx:270;--cy:288;--w:34;--h:20"></i>
      <i class="d" style="--cx:170;--cy:248;--w:28;--h:32"></i>
      <i class="d w" style="--cx:175;--cy:241;--w:10;--h:10"></i>
      <i class="d" style="--cx:230;--cy:248;--w:28;--h:32"></i>
      <i class="d w" style="--cx:235;--cy:241;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:290;--w:44;--h:26"></i>
    `
  },
  {
    id: 'starfruit', group: 'fruit',
    name: 'Star Fruit',
    // A star fruit slice: a soft five-point star (one SVG path), the pale star inside it, five seeds and a face.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:372;--w:330;--h:36"></i>
      <i class="r p" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"><svg viewBox="0 0 400 400"><path d="M200 42 C208 42 218 48 225 56 C231 64 236 79 240 90 C243 102 243 116 245 124 C246 133 246 139 251 142 C255 145 261 143 270 142 C278 142 292 137 304 137 C315 136 331 137 341 140 C350 144 359 152 362 159 C364 167 361 179 356 187 C350 196 338 205 328 212 C318 219 305 223 297 227 C289 232 283 234 282 239 C280 243 284 249 288 257 C291 265 300 276 304 287 C308 298 312 313 312 324 C311 334 307 345 300 350 C293 354 282 355 272 353 C262 350 249 341 240 334 C230 326 222 315 215 309 C209 303 205 298 200 298 C195 298 191 303 185 309 C178 315 170 326 160 334 C151 341 138 350 128 353 C118 355 107 354 100 350 C93 345 89 334 88 324 C88 313 92 298 96 287 C100 276 109 265 112 257 C116 249 120 243 118 239 C117 234 111 232 103 227 C95 223 82 219 72 212 C62 205 50 196 44 187 C39 179 36 167 38 159 C41 152 50 144 59 140 C69 137 85 136 96 137 C108 137 122 142 130 142 C139 143 145 145 149 142 C154 139 154 133 155 124 C157 116 157 102 160 90 C164 79 169 64 175 56 C182 48 192 42 200 42 Z"/></svg></i>
      <i class="r p" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"><svg viewBox="0 0 400 400"><path d="M200 92 C206 92 213 96 218 100 C223 105 227 114 230 121 C233 128 234 136 236 142 C238 147 239 151 242 154 C246 156 250 156 256 156 C262 156 270 155 278 156 C285 156 295 157 301 161 C307 164 312 169 314 175 C316 181 315 188 312 194 C309 201 302 207 296 212 C290 217 283 221 278 224 C273 228 270 230 268 234 C267 238 269 242 270 248 C272 254 276 261 278 268 C279 276 281 285 280 292 C279 299 275 306 271 309 C266 313 258 314 251 313 C244 312 236 307 230 303 C223 300 217 293 212 290 C207 287 204 284 200 284 C196 284 193 287 188 290 C183 293 177 300 170 303 C164 307 156 312 149 313 C142 314 134 313 129 309 C125 306 121 299 120 292 C119 285 121 276 122 268 C124 261 128 254 130 248 C131 242 133 238 132 234 C130 230 127 228 122 224 C117 221 110 217 104 212 C98 207 91 201 88 194 C85 188 84 181 86 175 C88 169 93 164 99 161 C105 157 115 156 122 156 C130 155 138 156 144 156 C150 156 154 156 158 154 C161 151 162 147 164 142 C166 136 167 128 170 121 C173 114 177 105 182 100 C187 96 194 92 200 92 Z"/></svg></i>
      <i class="r" style="--cx:200;--cy:122;--w:22;--h:32;--rot:0deg"></i>
      <i class="r" style="--cx:286;--cy:184;--w:22;--h:32;--rot:72deg"></i>
      <i class="r" style="--cx:253;--cy:285;--w:22;--h:32;--rot:144deg"></i>
      <i class="r" style="--cx:147;--cy:285;--w:22;--h:32;--rot:216deg"></i>
      <i class="r" style="--cx:114;--cy:184;--w:22;--h:32;--rot:288deg"></i>
      <i class="r" style="--cx:158;--cy:236;--w:30;--h:20"></i>
      <i class="r" style="--cx:242;--cy:236;--w:30;--h:20"></i>
      <i class="d" style="--cx:174;--cy:204;--w:26;--h:30"></i>
      <i class="d w" style="--cx:179;--cy:197;--w:9;--h:9"></i>
      <i class="d" style="--cx:226;--cy:204;--w:26;--h:30"></i>
      <i class="d w" style="--cx:231;--cy:197;--w:9;--h:9"></i>
      <i class="ln" style="--cx:200;--cy:232;--w:40;--h:24"></i>
    `
  },
  {
    id: 'parsnip', group: 'fruit',
    name: 'Parsnip',
    // A parsnip: wide shoulders tapering to a thin tip (one SVG path), a crown and three leafy stalks.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:374;--w:300;--h:32"></i>
      <i class="r" style="--cx:150;--cy:80;--w:52;--h:110;--r:50% 50% 50% 50% / 64% 64% 36% 36%;--rot:-30deg"></i>
      <i class="r" style="--cx:250;--cy:80;--w:52;--h:110;--r:50% 50% 50% 50% / 64% 64% 36% 36%;--rot:30deg"></i>
      <i class="r" style="--cx:200;--cy:70;--w:58;--h:120;--r:50% 50% 50% 50% / 64% 64% 36% 36%"></i>
      <i class="r p" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"><svg viewBox="0 0 400 400"><path d="M200 126 C256 126 290 146 288 182 C286 236 244 304 214 348 Q206 360 202 372 Q194 362 190 350 C158 304 114 236 112 182 C110 146 144 126 200 126 Z"/></svg></i>
      <i class="r" style="--cx:200;--cy:134;--w:84;--h:28;--k:14"></i>
      <i class="d" style="--cx:176;--cy:290;--w:24;--h:7;--k:4"></i>
      <i class="d" style="--cx:224;--cy:268;--w:24;--h:7;--k:4"></i>
      <i class="d" style="--cx:204;--cy:318;--w:20;--h:7;--k:4"></i>
      <i class="r" style="--cx:146;--cy:220;--w:30;--h:20"></i>
      <i class="r" style="--cx:254;--cy:220;--w:30;--h:20"></i>
      <i class="d" style="--cx:170;--cy:196;--w:26;--h:30"></i>
      <i class="d w" style="--cx:175;--cy:189;--w:9;--h:9"></i>
      <i class="d" style="--cx:230;--cy:196;--w:26;--h:30"></i>
      <i class="d w" style="--cx:235;--cy:189;--w:9;--h:9"></i>
      <i class="ln" style="--cx:200;--cy:224;--w:44;--h:26"></i>
    `
  },
  {
    id: 'spinach', group: 'fruit',
    name: 'Spinach',
    // A bunch of spinach: three big pointy leaves (SVG paths) on three stalks tied with a band; the face is on the front leaf.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:168;--cy:310;--w:24;--h:130;--k:12;--rot:-18deg"></i>
      <i class="r" style="--cx:232;--cy:310;--w:24;--h:130;--k:12;--rot:18deg"></i>
      <i class="r" style="--cx:200;--cy:318;--w:26;--h:120;--k:13"></i>
      <i class="r p" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"><svg viewBox="0 0 400 400"><path d="M60 128 C124 126 182 148 209 200 C230 240 215 275 184 299 C151 321 113 325 81 293 C40 251 38 189 60 128 Z"/></svg></i>
      <i class="r p" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"><svg viewBox="0 0 400 400"><path d="M340 128 C362 189 360 251 319 293 C287 325 249 321 216 299 C185 275 170 240 191 200 C218 148 276 126 340 128 Z"/></svg></i>
      <i class="r p" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"><svg viewBox="0 0 400 400"><path d="M200 50 C262 92 302 152 292 220 C284 272 246 294 200 296 C154 294 116 272 108 220 C98 152 138 92 200 50 Z"/></svg></i>
      <i class="r" style="--cx:200;--cy:318;--w:96;--h:34;--k:14"></i>
      <i class="r" style="--cx:146;--cy:206;--w:30;--h:20"></i>
      <i class="r" style="--cx:254;--cy:206;--w:30;--h:20"></i>
      <i class="d" style="--cx:172;--cy:178;--w:26;--h:30"></i>
      <i class="d w" style="--cx:177;--cy:171;--w:9;--h:9"></i>
      <i class="d" style="--cx:228;--cy:178;--w:26;--h:30"></i>
      <i class="d w" style="--cx:233;--cy:171;--w:9;--h:9"></i>
      <i class="ln" style="--cx:200;--cy:212;--w:44;--h:26"></i>
    `
  },
  {
    id: 'bean', group: 'fruit',
    name: 'Bean',
    // A big bean with a sprout: the bean is one SVG path with a dip on top, a little stem and two leaves, on a soil mound.
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:378;--w:380;--h:76;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:200;--cy:146;--w:24;--h:96;--k:12"></i>
      <i class="r" style="--cx:150;--cy:104;--w:96;--h:48;--r:0 100% 0 100%;--rot:14deg"></i>
      <i class="r" style="--cx:250;--cy:104;--w:96;--h:48;--r:100% 0 100% 0;--rot:-14deg"></i>
      <i class="r p" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"><svg viewBox="0 0 400 400"><path d="M50 262 C48 196 120 180 200 190 C280 180 352 196 350 262 C348 330 300 350 262 340 Q200 322 138 340 C100 350 52 330 50 262 Z"/></svg></i>
      <i class="r" style="--cx:128;--cy:284;--w:34;--h:22"></i>
      <i class="r" style="--cx:272;--cy:284;--w:34;--h:22"></i>
      <i class="d" style="--cx:170;--cy:252;--w:28;--h:32"></i>
      <i class="d w" style="--cx:175;--cy:245;--w:9;--h:9"></i>
      <i class="d" style="--cx:230;--cy:252;--w:28;--h:32"></i>
      <i class="d w" style="--cx:235;--cy:245;--w:9;--h:9"></i>
      <i class="ln" style="--cx:200;--cy:288;--w:46;--h:26"></i>
    `
  }
);
