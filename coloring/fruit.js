// The coloring book's FRUIT tab (fruit and veggies; every fruit gets a happy face).
// Every page is plain HTML: a list of <i> shapes on a 400 x 400 grid, back to front.
// coloring/pages.css explains the shapes (--cx --cy = center, --w --h = size,
// --r or --k = rounding, --rot = tilt; class r = colorable, d = dark detail,
// d w = white shine dot, ln = a curved line, ln up = curved the other way).
//
// ART STYLE (Keith's rules, see CLAUDE.md): simple, cute, thick black outlines,
// big simple shapes filling the page, a sky to color (class "r bg"), at most a
// ground strip or a cloud, NO SUNS. Faces: big dark eyes with white shine dots,
// colorable cheeks, a simple smile. 7-25 colorable shapes, none tiny.
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
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:340;--w:300;--h:40"></i>
      <i class="r" style="--cx:356;--cy:128;--w:22;--h:46;--k:10;--rot:30deg"></i>
      <i class="r" style="--cx:44;--cy:142;--w:30;--h:24;--rot:-20deg"></i>
      <i class="r" style="--cx:200;--cy:200;--w:320;--h:140;--r:46% 46% 50% 50% / 22% 22% 78% 78%"></i>
      <i class="r" style="--cx:150;--cy:222;--w:30;--h:18"></i>
      <i class="r" style="--cx:250;--cy:222;--w:30;--h:18"></i>
      <i class="d" style="--cx:176;--cy:198;--w:24;--h:24"></i>
      <i class="d w" style="--cx:180;--cy:193;--w:8;--h:8"></i>
      <i class="d" style="--cx:224;--cy:198;--w:24;--h:24"></i>
      <i class="d w" style="--cx:228;--cy:193;--w:8;--h:8"></i>
      <i class="ln" style="--cx:200;--cy:218;--w:32;--h:24"></i>
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
  }
);
