// The coloring book's ANIMALS tab. (fruit.js and things.js hold the other two tabs.)
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
    id: 'cat', group: 'animals',
    name: 'Cat',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:236"></i>
      <i class="r" style="--cx:312;--cy:280;--w:56;--h:128;--rot:22deg"></i>
      <i class="r" style="--cx:200;--cy:290;--w:156;--h:112;--r:50% 50% 42% 42% / 70% 70% 30% 30%"></i>
      <i class="r" style="--cx:200;--cy:312;--w:72;--h:76;--r:50% 50% 40% 40% / 60% 60% 40% 40%"></i>
      <i class="r" style="--cx:158;--cy:344;--w:64;--h:34"></i>
      <i class="r" style="--cx:242;--cy:344;--w:64;--h:34"></i>
      <i class="r" style="--cx:128;--cy:104;--w:80;--h:80;--r:12% 46% 46% 46%;--rot:36deg"></i>
      <i class="r" style="--cx:272;--cy:104;--w:80;--h:80;--r:12% 46% 46% 46%;--rot:54deg"></i>
      <i class="r" style="--cx:130;--cy:108;--w:42;--h:42;--r:12% 46% 46% 46%;--rot:36deg"></i>
      <i class="r" style="--cx:270;--cy:108;--w:42;--h:42;--r:12% 46% 46% 46%;--rot:54deg"></i>
      <i class="r" style="--cx:200;--cy:172;--w:212;--h:176"></i>
      <i class="r" style="--cx:128;--cy:204;--w:34;--h:20"></i>
      <i class="r" style="--cx:272;--cy:204;--w:34;--h:20"></i>
      <i class="d" style="--cx:160;--cy:170;--w:34;--h:42"></i>
      <i class="d" style="--cx:240;--cy:170;--w:34;--h:42"></i>
      <i class="d w" style="--cx:166;--cy:162;--w:12;--h:12"></i>
      <i class="d w" style="--cx:246;--cy:162;--w:12;--h:12"></i>
      <i class="d w" style="--cx:156;--cy:179;--w:6;--h:6"></i>
      <i class="d w" style="--cx:236;--cy:179;--w:6;--h:6"></i>
      <i class="r" style="--cx:200;--cy:198;--w:28;--h:18;--r:50% 50% 50% 50% / 35% 35% 65% 65%"></i>
      <i class="ln" style="--cx:189;--cy:206;--w:24;--h:22"></i>
      <i class="ln" style="--cx:211;--cy:206;--w:24;--h:22"></i>
      <i class="d" style="--cx:76;--cy:179;--w:49;--h:8;--k:4;--rot:14deg"></i>
      <i class="d" style="--cx:76;--cy:200;--w:48;--h:8;--k:4;--rot:-6deg"></i>
      <i class="d" style="--cx:324;--cy:179;--w:49;--h:8;--k:4;--rot:-14deg"></i>
      <i class="d" style="--cx:324;--cy:200;--w:48;--h:8;--k:4;--rot:6deg"></i>
    `
  },
  {
    id: 'fish', group: 'animals',
    name: 'Fish',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:56;--cy:334;--w:32;--h:144;--r:50% 50% 10% 10% / 80% 80% 20% 20%;--rot:-6deg"></i>
      <i class="r" style="--cx:366;--cy:350;--w:30;--h:116;--r:50% 50% 10% 10% / 80% 80% 20% 20%;--rot:8deg"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:170"></i>
      <i class="r" style="--cx:88;--cy:82;--w:30;--h:30"></i>
      <i class="r" style="--cx:62;--cy:44;--w:22;--h:22"></i>
      <i class="r" style="--cx:108;--cy:36;--w:18;--h:18"></i>
      <i class="r" style="--cx:330;--cy:196;--w:82;--h:126;--r:12% 60% 60% 12% / 50% 50% 50% 50%"></i>
      <i class="r" style="--cx:208;--cy:124;--w:116;--h:80"></i>
      <i class="r" style="--cx:215;--cy:280;--w:54;--h:50"></i>
      <i class="r" style="--cx:200;--cy:200;--w:244;--h:164"></i>
      <i class="r" style="--cx:230;--cy:200;--w:34;--h:156"></i>
      <i class="r" style="--cx:162;--cy:200;--w:30;--h:150"></i>
      <i class="r" style="--cx:254;--cy:220;--w:46;--h:30;--rot:30deg"></i>
      <i class="r" style="--cx:118;--cy:228;--w:26;--h:16"></i>
      <i class="r" style="--cx:124;--cy:184;--w:46;--h:46"></i>
      <i class="d" style="--cx:128;--cy:187;--w:26;--h:26"></i>
      <i class="d w" style="--cx:133;--cy:181;--w:10;--h:10"></i>
      <i class="ln" style="--cx:95;--cy:212;--w:24;--h:20"></i>
    `
  },
  {
    id: 'bird', group: 'animals',
    name: 'Bird',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:100;--cy:80;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:190"></i>
      <i class="r" style="--cx:78;--cy:222;--w:96;--h:44;--rot:30deg"></i>
      <i class="r" style="--cx:160;--cy:336;--w:60;--h:26"></i>
      <i class="r" style="--cx:222;--cy:336;--w:60;--h:26"></i>
      <i class="r" style="--cx:184;--cy:248;--w:216;--h:164"></i>
      <i class="r" style="--cx:268;--cy:82;--w:30;--h:52;--rot:14deg"></i>
      <i class="r" style="--cx:270;--cy:158;--w:136;--h:136"></i>
      <i class="r" style="--cx:160;--cy:250;--w:112;--h:72;--rot:12deg"></i>
      <i class="r" style="--cx:350;--cy:164;--w:52;--h:34;--r:10% 60% 60% 10% / 50% 50% 50% 50%"></i>
      <i class="r" style="--cx:292;--cy:188;--w:28;--h:18"></i>
      <i class="d" style="--cx:290;--cy:150;--w:26;--h:28"></i>
      <i class="d w" style="--cx:295;--cy:144;--w:10;--h:10"></i>
    `
  },
  {
    id: 'dog', group: 'animals',
    name: 'Dog',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:190"></i>
      <i class="r" style="--cx:316;--cy:270;--w:46;--h:112;--rot:28deg"></i>
      <i class="r" style="--cx:200;--cy:288;--w:176;--h:140"></i>
      <i class="r" style="--cx:200;--cy:298;--w:96;--h:92"></i>
      <i class="r" style="--cx:160;--cy:350;--w:68;--h:36"></i>
      <i class="r" style="--cx:240;--cy:350;--w:68;--h:36"></i>
      <i class="r" style="--cx:200;--cy:165;--w:164;--h:164"></i>
      <i class="r" style="--cx:117;--cy:168;--w:54;--h:132;--r:50% 50% 50% 50% / 30% 30% 70% 70%;--rot:12deg"></i>
      <i class="r" style="--cx:283;--cy:168;--w:54;--h:132;--r:50% 50% 50% 50% / 30% 30% 70% 70%;--rot:-12deg"></i>
      <i class="r" style="--cx:200;--cy:200;--w:88;--h:64"></i>
      <i class="r" style="--cx:152;--cy:198;--w:28;--h:18"></i>
      <i class="r" style="--cx:248;--cy:198;--w:28;--h:18"></i>
      <i class="d" style="--cx:200;--cy:184;--w:34;--h:24"></i>
      <i class="d" style="--cx:200;--cy:201;--w:22;--h:8;--k:4;--rot:90deg"></i>
      <i class="ln" style="--cx:190;--cy:206;--w:22;--h:22"></i>
      <i class="ln" style="--cx:210;--cy:206;--w:22;--h:22"></i>
      <i class="d" style="--cx:170;--cy:150;--w:24;--h:24"></i>
      <i class="d w" style="--cx:174;--cy:145;--w:8;--h:8"></i>
      <i class="d" style="--cx:232;--cy:150;--w:24;--h:24"></i>
      <i class="d w" style="--cx:236;--cy:145;--w:8;--h:8"></i>
    `
  },
  {
    id: 'bunny', group: 'animals',
    name: 'Bunny',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:190"></i>
      <i class="r" style="--cx:166;--cy:82;--w:58;--h:128;--rot:-8deg"></i>
      <i class="r" style="--cx:167;--cy:86;--w:26;--h:84;--rot:-8deg"></i>
      <i class="r" style="--cx:234;--cy:82;--w:58;--h:128;--rot:8deg"></i>
      <i class="r" style="--cx:233;--cy:86;--w:26;--h:84;--rot:8deg"></i>
      <i class="r" style="--cx:282;--cy:318;--w:52;--h:52"></i>
      <i class="r" style="--cx:200;--cy:292;--w:168;--h:136"></i>
      <i class="r" style="--cx:200;--cy:302;--w:92;--h:84"></i>
      <i class="r" style="--cx:150;--cy:350;--w:76;--h:36"></i>
      <i class="r" style="--cx:250;--cy:350;--w:76;--h:36"></i>
      <i class="r" style="--cx:200;--cy:182;--w:148;--h:148"></i>
      <i class="r" style="--cx:152;--cy:206;--w:28;--h:18"></i>
      <i class="r" style="--cx:248;--cy:206;--w:28;--h:18"></i>
      <i class="d" style="--cx:172;--cy:172;--w:24;--h:24"></i>
      <i class="d w" style="--cx:176;--cy:167;--w:8;--h:8"></i>
      <i class="d" style="--cx:228;--cy:172;--w:24;--h:24"></i>
      <i class="d w" style="--cx:232;--cy:167;--w:8;--h:8"></i>
      <i class="d" style="--cx:200;--cy:198;--w:22;--h:15;--r:50% 50% 50% 50% / 35% 35% 65% 65%"></i>
      <i class="ln" style="--cx:192;--cy:208;--w:18;--h:18"></i>
      <i class="ln" style="--cx:208;--cy:208;--w:18;--h:18"></i>
      <i class="d" style="--cx:124;--cy:193;--w:37;--h:8;--k:4;--rot:12deg"></i>
      <i class="d" style="--cx:125;--cy:209;--w:35;--h:8;--k:4;--rot:-13deg"></i>
      <i class="d" style="--cx:276;--cy:193;--w:37;--h:8;--k:4;--rot:-12deg"></i>
      <i class="d" style="--cx:275;--cy:209;--w:35;--h:8;--k:4;--rot:13deg"></i>
    `
  },
  {
    id: 'turtle', group: 'animals',
    name: 'Turtle',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:220"></i>
      <i class="r" style="--cx:40;--cy:276;--w:52;--h:24;--rot:-22deg"></i>
      <i class="r" style="--cx:96;--cy:300;--w:60;--h:68"></i>
      <i class="r" style="--cx:248;--cy:300;--w:60;--h:68"></i>
      <i class="r" style="--cx:322;--cy:230;--w:100;--h:86"></i>
      <i class="d" style="--cx:332;--cy:218;--w:22;--h:22"></i>
      <i class="d w" style="--cx:335;--cy:214;--w:8;--h:8"></i>
      <i class="ln" style="--cx:344;--cy:242;--w:32;--h:20;--rot:-4deg"></i>
      <i class="r" style="--cx:358;--cy:234;--w:22;--h:16"></i>
      <i class="r" style="--cx:173;--cy:198;--w:254;--h:136;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:173;--cy:212;--w:120;--h:80"></i>
      <i class="r" style="--cx:90;--cy:222;--w:28;--h:62;--rot:18deg"></i>
      <i class="r" style="--cx:256;--cy:222;--w:28;--h:62;--rot:-18deg"></i>
      <i class="r" style="--cx:173;--cy:277;--w:268;--h:28;--k:14"></i>
    `
  },
  {
    id: 'lion', group: 'animals',
    name: 'Lion',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:190"></i>
      <i class="r" style="--cx:200;--cy:310;--w:156;--h:112"></i>
      <i class="r" style="--cx:158;--cy:356;--w:70;--h:34"></i>
      <i class="r" style="--cx:242;--cy:356;--w:70;--h:34"></i>
      <i class="r" style="--cx:200;--cy:170;--w:260;--h:260"></i>
      <i class="r" style="--cx:138;--cy:108;--w:50;--h:50"></i>
      <i class="r" style="--cx:262;--cy:108;--w:50;--h:50"></i>
      <i class="r" style="--cx:200;--cy:176;--w:176;--h:170"></i>
      <i class="r" style="--cx:142;--cy:200;--w:30;--h:18"></i>
      <i class="r" style="--cx:258;--cy:200;--w:30;--h:18"></i>
      <i class="r" style="--cx:200;--cy:208;--w:76;--h:50"></i>
      <i class="d" style="--cx:200;--cy:194;--w:30;--h:18;--r:50% 50% 50% 50% / 35% 35% 65% 65%"></i>
      <i class="d" style="--cx:168;--cy:160;--w:28;--h:30"></i>
      <i class="d w" style="--cx:173;--cy:154;--w:10;--h:10"></i>
      <i class="d" style="--cx:232;--cy:160;--w:28;--h:30"></i>
      <i class="d w" style="--cx:237;--cy:154;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:212;--w:30;--h:20"></i>
    `
  },
  {
    id: 'elephant', group: 'animals',
    name: 'Elephant',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:198"></i>
      <i class="r" style="--cx:200;--cy:296;--w:192;--h:124"></i>
      <i class="r" style="--cx:146;--cy:350;--w:72;--h:36"></i>
      <i class="r" style="--cx:254;--cy:350;--w:72;--h:36"></i>
      <i class="r" style="--cx:110;--cy:168;--w:148;--h:168"></i>
      <i class="r" style="--cx:116;--cy:172;--w:92;--h:112"></i>
      <i class="r" style="--cx:290;--cy:168;--w:148;--h:168"></i>
      <i class="r" style="--cx:284;--cy:172;--w:92;--h:112"></i>
      <i class="r" style="--cx:200;--cy:166;--w:164;--h:164"></i>
      <i class="r" style="--cx:148;--cy:198;--w:28;--h:18"></i>
      <i class="r" style="--cx:252;--cy:198;--w:28;--h:18"></i>
      <i class="r" style="--cx:200;--cy:250;--w:50;--h:118;--r:45% 45% 50% 50% / 30% 30% 70% 70%"></i>
      <i class="d" style="--cx:200;--cy:236;--w:26;--h:8;--k:4"></i>
      <i class="d" style="--cx:200;--cy:262;--w:26;--h:8;--k:4"></i>
      <i class="d" style="--cx:170;--cy:156;--w:24;--h:24"></i>
      <i class="d w" style="--cx:174;--cy:151;--w:8;--h:8"></i>
      <i class="d" style="--cx:230;--cy:156;--w:24;--h:24"></i>
      <i class="d w" style="--cx:234;--cy:151;--w:8;--h:8"></i>
    `
  },
  {
    id: 'pig', group: 'animals',
    name: 'Pig',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:358;--w:340;--h:60"></i>
      <i class="ln" style="--cx:300;--cy:278;--w:30;--h:30;--rot:-30deg"></i>
      <i class="r" style="--cx:200;--cy:292;--w:184;--h:132"></i>
      <i class="r" style="--cx:150;--cy:350;--w:60;--h:32"></i>
      <i class="r" style="--cx:250;--cy:350;--w:60;--h:32"></i>
      <i class="r" style="--cx:200;--cy:172;--w:172;--h:172"></i>
      <i class="r" style="--cx:136;--cy:100;--w:64;--h:64;--r:12% 46% 46% 46%;--rot:30deg"></i>
      <i class="r" style="--cx:264;--cy:100;--w:64;--h:64;--r:12% 46% 46% 46%;--rot:60deg"></i>
      <i class="r" style="--cx:138;--cy:200;--w:30;--h:20"></i>
      <i class="r" style="--cx:262;--cy:200;--w:30;--h:20"></i>
      <i class="r" style="--cx:200;--cy:196;--w:88;--h:60"></i>
      <i class="d" style="--cx:185;--cy:196;--w:14;--h:22"></i>
      <i class="d" style="--cx:215;--cy:196;--w:14;--h:22"></i>
      <i class="d" style="--cx:164;--cy:154;--w:24;--h:24"></i>
      <i class="d w" style="--cx:168;--cy:149;--w:8;--h:8"></i>
      <i class="d" style="--cx:236;--cy:154;--w:24;--h:24"></i>
      <i class="d w" style="--cx:240;--cy:149;--w:8;--h:8"></i>
      <i class="ln" style="--cx:200;--cy:236;--w:40;--h:24"></i>
    `
  },
  {
    id: 'owl', group: 'animals',
    name: 'Owl',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:354;--w:384;--h:28;--k:14"></i>
      <i class="r" style="--cx:128;--cy:102;--w:60;--h:60;--r:12% 46% 46% 46%;--rot:28deg"></i>
      <i class="r" style="--cx:272;--cy:102;--w:60;--h:60;--r:12% 46% 46% 46%;--rot:62deg"></i>
      <i class="r" style="--cx:200;--cy:211;--w:232;--h:278;--r:50% 50% 50% 50% / 58% 58% 42% 42%"></i>
      <i class="r" style="--cx:200;--cy:278;--w:144;--h:128"></i>
      <i class="ln" style="--cx:166;--cy:262;--w:32;--h:28"></i>
      <i class="ln" style="--cx:200;--cy:262;--w:32;--h:28"></i>
      <i class="ln" style="--cx:234;--cy:262;--w:32;--h:28"></i>
      <i class="ln" style="--cx:183;--cy:294;--w:32;--h:28"></i>
      <i class="ln" style="--cx:217;--cy:294;--w:32;--h:28"></i>
      <i class="r" style="--cx:92;--cy:268;--w:44;--h:120;--rot:14deg"></i>
      <i class="r" style="--cx:308;--cy:268;--w:44;--h:120;--rot:-14deg"></i>
      <i class="r" style="--cx:156;--cy:168;--w:92;--h:92"></i>
      <i class="r" style="--cx:244;--cy:168;--w:92;--h:92"></i>
      <i class="d" style="--cx:160;--cy:168;--w:40;--h:40"></i>
      <i class="d w" style="--cx:164;--cy:162;--w:12;--h:12"></i>
      <i class="d" style="--cx:240;--cy:168;--w:40;--h:40"></i>
      <i class="d w" style="--cx:244;--cy:162;--w:12;--h:12"></i>
      <i class="r" style="--cx:200;--cy:218;--w:30;--h:34;--r:50% 50% 50% 50% / 30% 30% 70% 70%"></i>
      <i class="r" style="--cx:168;--cy:350;--w:48;--h:24"></i>
      <i class="r" style="--cx:232;--cy:350;--w:48;--h:24"></i>
    `
  },
  {
    id: 'penguin', group: 'animals',
    name: 'Penguin',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:208"></i>
      <i class="r" style="--cx:164;--cy:350;--w:72;--h:30"></i>
      <i class="r" style="--cx:236;--cy:350;--w:72;--h:30"></i>
      <i class="r" style="--cx:88;--cy:244;--w:42;--h:124;--rot:18deg"></i>
      <i class="r" style="--cx:312;--cy:244;--w:42;--h:124;--rot:-18deg"></i>
      <i class="r" style="--cx:200;--cy:200;--w:216;--h:292;--r:50% 50% 50% 50% / 58% 58% 42% 42%"></i>
      <i class="r" style="--cx:200;--cy:216;--w:160;--h:220;--r:50% 50% 50% 50% / 50% 50% 50% 50%"></i>
      <i class="r" style="--cx:152;--cy:204;--w:28;--h:18"></i>
      <i class="r" style="--cx:248;--cy:204;--w:28;--h:18"></i>
      <i class="d" style="--cx:172;--cy:168;--w:24;--h:24"></i>
      <i class="d w" style="--cx:176;--cy:163;--w:8;--h:8"></i>
      <i class="d" style="--cx:228;--cy:168;--w:24;--h:24"></i>
      <i class="d w" style="--cx:232;--cy:163;--w:8;--h:8"></i>
      <i class="r" style="--cx:200;--cy:200;--w:42;--h:28;--r:50% 50% 50% 50% / 30% 30% 70% 70%"></i>
    `
  },
  {
    id: 'duck', group: 'animals',
    name: 'Duck',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:108;--cy:92;--w:108;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:66;--cy:240;--w:74;--h:36;--rot:38deg"></i>
      <i class="r" style="--cx:186;--cy:266;--w:236;--h:140"></i>
      <i class="r" style="--cx:182;--cy:254;--w:130;--h:62"></i>
      <i class="r" style="--cx:282;--cy:164;--w:120;--h:120"></i>
      <i class="r" style="--cx:358;--cy:178;--w:62;--h:36;--r:30% 60% 60% 30% / 50% 50% 50% 50%"></i>
      <i class="r" style="--cx:296;--cy:194;--w:28;--h:18"></i>
      <i class="d" style="--cx:296;--cy:150;--w:24;--h:24"></i>
      <i class="d w" style="--cx:300;--cy:145;--w:8;--h:8"></i>
      <i class="r" style="--cx:200;--cy:470;--w:800;--h:340"></i>
    `
  },
  {
    id: 'cow', group: 'animals',
    name: 'Cow',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:232"></i>
      <i class="ln" style="--cx:307;--cy:270;--w:71;--h:43;--rot:-58deg"></i>
      <i class="r" style="--cx:325;--cy:226;--w:28;--h:36"></i>
      <i class="r" style="--cx:200;--cy:288;--w:196;--h:128"></i>
      <i class="r" style="--cx:141;--cy:270;--w:46;--h:45"></i>
      <i class="r" style="--cx:261;--cy:297;--w:46;--h:38"></i>
      <i class="r" style="--cx:150;--cy:346;--w:68;--h:32"></i>
      <i class="r" style="--cx:250;--cy:346;--w:68;--h:32"></i>
      <i class="r" style="--cx:136;--cy:82;--w:28;--h:56;--rot:-34deg"></i>
      <i class="r" style="--cx:264;--cy:82;--w:28;--h:56;--rot:34deg"></i>
      <i class="r" style="--cx:104;--cy:134;--w:80;--h:38;--rot:20deg"></i>
      <i class="r" style="--cx:296;--cy:134;--w:80;--h:38;--rot:-20deg"></i>
      <i class="r" style="--cx:200;--cy:156;--w:176;--h:160"></i>
      <i class="r" style="--cx:239;--cy:103;--w:46;--h:29"></i>
      <i class="r" style="--cx:200;--cy:206;--w:124;--h:76"></i>
      <i class="d" style="--cx:180;--cy:200;--w:16;--h:22"></i>
      <i class="d" style="--cx:220;--cy:200;--w:16;--h:22"></i>
      <i class="ln" style="--cx:200;--cy:224;--w:36;--h:20"></i>
      <i class="r" style="--cx:200;--cy:264;--w:36;--h:36"></i>
      <i class="r" style="--cx:126;--cy:182;--w:30;--h:18"></i>
      <i class="r" style="--cx:274;--cy:182;--w:30;--h:18"></i>
      <i class="d" style="--cx:162;--cy:140;--w:26;--h:26"></i>
      <i class="d w" style="--cx:166;--cy:135;--w:10;--h:10"></i>
      <i class="d" style="--cx:238;--cy:140;--w:26;--h:26"></i>
      <i class="d w" style="--cx:242;--cy:135;--w:10;--h:10"></i>
    `
  },
  {
    id: 'frog', group: 'animals',
    name: 'Frog',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:294"></i>
      <i class="r" style="--cx:200;--cy:341;--w:340;--h:70"></i>
      <i class="r" style="--cx:104;--cy:296;--w:112;--h:80"></i>
      <i class="r" style="--cx:296;--cy:296;--w:112;--h:80"></i>
      <i class="r" style="--cx:70;--cy:336;--w:64;--h:26"></i>
      <i class="r" style="--cx:330;--cy:336;--w:64;--h:26"></i>
      <i class="r" style="--cx:200;--cy:262;--w:200;--h:148"></i>
      <i class="r" style="--cx:200;--cy:282;--w:124;--h:100"></i>
      <i class="r" style="--cx:152;--cy:334;--w:60;--h:28"></i>
      <i class="r" style="--cx:248;--cy:334;--w:60;--h:28"></i>
      <i class="r" style="--cx:136;--cy:112;--w:92;--h:92"></i>
      <i class="r" style="--cx:264;--cy:112;--w:92;--h:92"></i>
      <i class="r" style="--cx:200;--cy:172;--w:240;--h:140"></i>
      <i class="r" style="--cx:136;--cy:110;--w:60;--h:60"></i>
      <i class="r" style="--cx:264;--cy:110;--w:60;--h:60"></i>
      <i class="d" style="--cx:138;--cy:112;--w:34;--h:34"></i>
      <i class="d w" style="--cx:143;--cy:106;--w:12;--h:12"></i>
      <i class="d" style="--cx:262;--cy:112;--w:34;--h:34"></i>
      <i class="d w" style="--cx:267;--cy:106;--w:12;--h:12"></i>
      <i class="r" style="--cx:118;--cy:190;--w:34;--h:20"></i>
      <i class="r" style="--cx:282;--cy:190;--w:34;--h:20"></i>
      <i class="ln" style="--cx:200;--cy:196;--w:112;--h:48"></i>
    `
  },
  {
    id: 'monkey', group: 'animals',
    name: 'Monkey',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:222"></i>
      <i class="ln" style="--cx:275;--cy:286;--w:58;--h:90;--rot:-63deg"></i>
      <i class="r" style="--cx:200;--cy:292;--w:156;--h:124"></i>
      <i class="r" style="--cx:200;--cy:302;--w:92;--h:84"></i>
      <i class="r" style="--cx:154;--cy:350;--w:64;--h:30"></i>
      <i class="r" style="--cx:246;--cy:350;--w:64;--h:30"></i>
      <i class="r" style="--cx:98;--cy:164;--w:80;--h:80"></i>
      <i class="r" style="--cx:302;--cy:164;--w:80;--h:80"></i>
      <i class="r" style="--cx:98;--cy:164;--w:42;--h:42"></i>
      <i class="r" style="--cx:302;--cy:164;--w:42;--h:42"></i>
      <i class="r" style="--cx:200;--cy:160;--w:188;--h:188"></i>
      <i class="r" style="--cx:200;--cy:182;--w:164;--h:124;--r:50% 50% 50% 50% / 42% 42% 58% 58%"></i>
      <i class="ln up" style="--cx:203;--cy:62;--w:22;--h:34;--rot:-34deg"></i>
      <i class="d" style="--cx:172;--cy:160;--w:26;--h:26"></i>
      <i class="d w" style="--cx:176;--cy:155;--w:10;--h:10"></i>
      <i class="d" style="--cx:228;--cy:160;--w:26;--h:26"></i>
      <i class="d w" style="--cx:232;--cy:155;--w:10;--h:10"></i>
      <i class="d" style="--cx:191;--cy:194;--w:10;--h:10"></i>
      <i class="d" style="--cx:209;--cy:194;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:210;--w:60;--h:32"></i>
      <i class="r" style="--cx:144;--cy:200;--w:28;--h:18"></i>
      <i class="r" style="--cx:256;--cy:200;--w:28;--h:18"></i>
    `
  },
  {
    id: 'giraffe', group: 'animals',
    name: 'Giraffe',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:326;--cy:70;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:200;--cy:330;--w:104;--h:260;--k:40"></i>
      <i class="r" style="--cx:184;--cy:262;--w:42;--h:38"></i>
      <i class="r" style="--cx:216;--cy:318;--w:42;--h:38"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:130"></i>
      <i class="d" style="--cx:170;--cy:62;--w:8;--h:44;--k:4;--rot:-10deg"></i>
      <i class="d" style="--cx:230;--cy:62;--w:8;--h:44;--k:4;--rot:10deg"></i>
      <i class="r" style="--cx:164;--cy:38;--w:32;--h:32"></i>
      <i class="r" style="--cx:236;--cy:38;--w:32;--h:32"></i>
      <i class="r" style="--cx:106;--cy:118;--w:72;--h:36;--rot:-18deg"></i>
      <i class="r" style="--cx:294;--cy:118;--w:72;--h:36;--rot:18deg"></i>
      <i class="r" style="--cx:200;--cy:140;--w:170;--h:150"></i>
      <i class="r" style="--cx:200;--cy:184;--w:140;--h:86"></i>
      <i class="d" style="--cx:166;--cy:124;--w:28;--h:30"></i>
      <i class="d w" style="--cx:171;--cy:118;--w:10;--h:10"></i>
      <i class="d" style="--cx:234;--cy:124;--w:28;--h:30"></i>
      <i class="d w" style="--cx:239;--cy:118;--w:10;--h:10"></i>
      <i class="d" style="--cx:182;--cy:170;--w:12;--h:16"></i>
      <i class="d" style="--cx:218;--cy:170;--w:12;--h:16"></i>
      <i class="ln" style="--cx:200;--cy:192;--w:44;--h:26"></i>
    `
  },
  {
    id: 'snail', group: 'animals',
    name: 'Snail',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:218"></i>
      <i class="r" style="--cx:214;--cy:316;--w:316;--h:52;--k:26"></i>
      <i class="r" style="--cx:254;--cy:204;--w:208;--h:208"></i>
      <i class="r" style="--cx:246;--cy:212;--w:140;--h:140"></i>
      <i class="r" style="--cx:240;--cy:220;--w:72;--h:72"></i>
      <i class="r" style="--cx:110;--cy:276;--w:80;--h:104;--r:50% 50% 30% 30% / 60% 60% 40% 40%"></i>
      <i class="d" style="--cx:85;--cy:129;--w:73;--h:8;--k:4;--rot:-106deg"></i>
      <i class="d" style="--cx:138;--cy:127;--w:72;--h:8;--k:4;--rot:-76deg"></i>
      <i class="r" style="--cx:74;--cy:88;--w:28;--h:28"></i>
      <i class="r" style="--cx:148;--cy:86;--w:28;--h:28"></i>
      <i class="r" style="--cx:112;--cy:196;--w:108;--h:108"></i>
      <i class="d" style="--cx:94;--cy:188;--w:22;--h:22"></i>
      <i class="d w" style="--cx:97;--cy:184;--w:8;--h:8"></i>
      <i class="d" style="--cx:132;--cy:188;--w:22;--h:22"></i>
      <i class="d w" style="--cx:135;--cy:184;--w:8;--h:8"></i>
      <i class="r" style="--cx:80;--cy:214;--w:24;--h:16"></i>
      <i class="r" style="--cx:146;--cy:214;--w:24;--h:16"></i>
      <i class="ln" style="--cx:113;--cy:218;--w:26;--h:20"></i>
    `
  },
  {
    id: 'whale', group: 'animals',
    name: 'Whale',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:128;--cy:66;--w:36;--h:36;--r:0 50% 50% 50%;--rot:20deg"></i>
      <i class="r" style="--cx:176;--cy:60;--w:36;--h:36;--r:0 50% 50% 50%;--rot:70deg"></i>
      <i class="r" style="--cx:306;--cy:122;--w:84;--h:42;--rot:45deg"></i>
      <i class="r" style="--cx:356;--cy:122;--w:84;--h:42;--rot:-45deg"></i>
      <i class="r" style="--cx:298;--cy:212;--w:72;--h:150;--rot:30deg"></i>
      <i class="r" style="--cx:172;--cy:246;--w:284;--h:200;--r:50% 50% 50% 50% / 56% 56% 44% 44%"></i>
      <i class="d" style="--cx:108;--cy:232;--w:28;--h:30"></i>
      <i class="d w" style="--cx:113;--cy:226;--w:10;--h:10"></i>
      <i class="r" style="--cx:82;--cy:268;--w:32;--h:20"></i>
      <i class="ln" style="--cx:128;--cy:272;--w:44;--h:26"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:170"></i>
    `
  },
  {
    id: 'chick', group: 'animals',
    name: 'Chick',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:320;--cy:66;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:232"></i>
      <i class="r" style="--cx:184;--cy:122;--w:26;--h:58;--rot:-24deg"></i>
      <i class="r" style="--cx:214;--cy:118;--w:26;--h:58;--rot:20deg"></i>
      <i class="r" style="--cx:154;--cy:352;--w:70;--h:30"></i>
      <i class="r" style="--cx:246;--cy:352;--w:70;--h:30"></i>
      <i class="r" style="--cx:200;--cy:240;--w:236;--h:224;--r:50% 50% 50% 50% / 46% 46% 54% 54%"></i>
      <i class="r" style="--cx:84;--cy:262;--w:58;--h:96;--rot:24deg"></i>
      <i class="r" style="--cx:316;--cy:262;--w:58;--h:96;--rot:-24deg"></i>
      <i class="d" style="--cx:160;--cy:204;--w:28;--h:30"></i>
      <i class="d w" style="--cx:165;--cy:198;--w:10;--h:10"></i>
      <i class="d" style="--cx:240;--cy:204;--w:28;--h:30"></i>
      <i class="d w" style="--cx:245;--cy:198;--w:10;--h:10"></i>
      <i class="r" style="--cx:138;--cy:238;--w:32;--h:20"></i>
      <i class="r" style="--cx:262;--cy:238;--w:32;--h:20"></i>
      <i class="r" style="--cx:200;--cy:236;--w:50;--h:34;--r:50% 50% 50% 50% / 40% 40% 60% 60%"></i>
      <i class="ln" style="--cx:200;--cy:262;--w:40;--h:22"></i>
    `
  },
  {
    id: 'sheep', group: 'animals',
    name: 'Sheep',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:320;--cy:60;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:150"></i>
      <i class="r" style="--cx:170;--cy:356;--w:36;--h:64;--k:16"></i>
      <i class="r" style="--cx:230;--cy:356;--w:36;--h:64;--k:16"></i>
      <i class="r" style="--cx:268;--cy:290;--w:96;--h:96"></i>
      <i class="r" style="--cx:200;--cy:322;--w:96;--h:96"></i>
      <i class="r" style="--cx:132;--cy:290;--w:96;--h:96"></i>
      <i class="r" style="--cx:126;--cy:220;--w:96;--h:96"></i>
      <i class="r" style="--cx:274;--cy:220;--w:96;--h:96"></i>
      <i class="r" style="--cx:200;--cy:256;--w:176;--h:160"></i>
      <i class="r" style="--cx:118;--cy:158;--w:64;--h:32;--rot:24deg"></i>
      <i class="r" style="--cx:282;--cy:158;--w:64;--h:32;--rot:-24deg"></i>
      <i class="r" style="--cx:200;--cy:168;--w:150;--h:136"></i>
      <i class="d" style="--cx:172;--cy:166;--w:26;--h:28"></i>
      <i class="d w" style="--cx:177;--cy:160;--w:10;--h:10"></i>
      <i class="d" style="--cx:228;--cy:166;--w:26;--h:28"></i>
      <i class="d w" style="--cx:233;--cy:160;--w:10;--h:10"></i>
      <i class="r" style="--cx:146;--cy:196;--w:30;--h:18"></i>
      <i class="r" style="--cx:254;--cy:196;--w:30;--h:18"></i>
      <i class="ln" style="--cx:200;--cy:194;--w:36;--h:22"></i>
    `
  },
  {
    id: 'mouse', group: 'animals',
    name: 'Mouse',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:220"></i>
      <i class="ln" style="--cx:322;--cy:296;--w:110;--h:56;--rot:-8deg"></i>
      <i class="r" style="--cx:200;--cy:310;--w:180;--h:130"></i>
      <i class="r" style="--cx:200;--cy:322;--w:96;--h:84"></i>
      <i class="r" style="--cx:154;--cy:372;--w:64;--h:28"></i>
      <i class="r" style="--cx:246;--cy:372;--w:64;--h:28"></i>
      <i class="r" style="--cx:100;--cy:104;--w:120;--h:120"></i>
      <i class="r" style="--cx:300;--cy:104;--w:120;--h:120"></i>
      <i class="r" style="--cx:104;--cy:108;--w:70;--h:70"></i>
      <i class="r" style="--cx:296;--cy:108;--w:70;--h:70"></i>
      <i class="r" style="--cx:200;--cy:184;--w:224;--h:176"></i>
      <i class="d" style="--cx:160;--cy:170;--w:28;--h:32"></i>
      <i class="d w" style="--cx:165;--cy:163;--w:10;--h:10"></i>
      <i class="d" style="--cx:240;--cy:170;--w:28;--h:32"></i>
      <i class="d w" style="--cx:245;--cy:163;--w:10;--h:10"></i>
      <i class="r" style="--cx:126;--cy:210;--w:32;--h:20"></i>
      <i class="r" style="--cx:274;--cy:210;--w:32;--h:20"></i>
      <i class="r" style="--cx:200;--cy:206;--w:34;--h:26"></i>
      <i class="ln" style="--cx:200;--cy:224;--w:40;--h:20"></i>
      <i class="d" style="--cx:52;--cy:196;--w:52;--h:8;--k:4;--rot:10deg"></i>
      <i class="d" style="--cx:52;--cy:218;--w:52;--h:8;--k:4;--rot:-8deg"></i>
      <i class="d" style="--cx:348;--cy:196;--w:52;--h:8;--k:4;--rot:-10deg"></i>
      <i class="d" style="--cx:348;--cy:218;--w:52;--h:8;--k:4;--rot:8deg"></i>
    `
  },
  {
    id: 'octopus', group: 'animals',
    name: 'Octopus',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:150"></i>
      <i class="r" style="--cx:338;--cy:64;--w:42;--h:42"></i>
      <i class="r" style="--cx:60;--cy:90;--w:34;--h:34"></i>
      <i class="r" style="--cx:80;--cy:300;--w:66;--h:150;--rot:38deg"></i>
      <i class="r" style="--cx:320;--cy:300;--w:66;--h:150;--rot:-38deg"></i>
      <i class="r" style="--cx:156;--cy:318;--w:66;--h:140;--rot:10deg"></i>
      <i class="r" style="--cx:244;--cy:318;--w:66;--h:140;--rot:-10deg"></i>
      <i class="r" style="--cx:200;--cy:176;--w:270;--h:236;--r:50% 50% 46% 46% / 56% 56% 44% 44%"></i>
      <i class="d" style="--cx:160;--cy:180;--w:30;--h:32"></i>
      <i class="d w" style="--cx:165;--cy:174;--w:10;--h:10"></i>
      <i class="d" style="--cx:240;--cy:180;--w:30;--h:32"></i>
      <i class="d w" style="--cx:245;--cy:174;--w:10;--h:10"></i>
      <i class="r" style="--cx:122;--cy:218;--w:34;--h:20"></i>
      <i class="r" style="--cx:278;--cy:218;--w:34;--h:20"></i>
      <i class="ln" style="--cx:200;--cy:212;--w:50;--h:30"></i>
    `
  },
  {
    id: 'ladybug', group: 'animals',
    name: 'Ladybug',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:170"></i>
      <i class="d" style="--cx:172;--cy:66;--w:8;--h:60;--k:4;--rot:-30deg"></i>
      <i class="d" style="--cx:228;--cy:66;--w:8;--h:60;--k:4;--rot:30deg"></i>
      <i class="r" style="--cx:154;--cy:40;--w:34;--h:34"></i>
      <i class="r" style="--cx:246;--cy:40;--w:34;--h:34"></i>
      <i class="d" style="--cx:82;--cy:210;--w:50;--h:10;--k:5;--rot:-20deg"></i>
      <i class="d" style="--cx:72;--cy:262;--w:50;--h:10;--k:5"></i>
      <i class="d" style="--cx:88;--cy:316;--w:50;--h:10;--k:5;--rot:20deg"></i>
      <i class="d" style="--cx:318;--cy:210;--w:50;--h:10;--k:5;--rot:20deg"></i>
      <i class="d" style="--cx:328;--cy:262;--w:50;--h:10;--k:5"></i>
      <i class="d" style="--cx:312;--cy:316;--w:50;--h:10;--k:5;--rot:-20deg"></i>
      <i class="r" style="--cx:200;--cy:130;--w:180;--h:130"></i>
      <i class="r" style="--cx:142;--cy:262;--w:116;--h:224;--r:100% 0 0 100% / 50% 0 0 50%"></i>
      <i class="r" style="--cx:258;--cy:262;--w:116;--h:224;--r:0 100% 100% 0 / 0 50% 50% 0"></i>
      <i class="r" style="--cx:144;--cy:202;--w:44;--h:44"></i>
      <i class="r" style="--cx:116;--cy:268;--w:44;--h:44"></i>
      <i class="r" style="--cx:160;--cy:320;--w:44;--h:44"></i>
      <i class="r" style="--cx:256;--cy:202;--w:44;--h:44"></i>
      <i class="r" style="--cx:284;--cy:268;--w:44;--h:44"></i>
      <i class="r" style="--cx:240;--cy:320;--w:44;--h:44"></i>
      <i class="d" style="--cx:168;--cy:110;--w:24;--h:26"></i>
      <i class="d w" style="--cx:172;--cy:105;--w:8;--h:8"></i>
      <i class="d" style="--cx:232;--cy:110;--w:24;--h:26"></i>
      <i class="d w" style="--cx:236;--cy:105;--w:8;--h:8"></i>
      <i class="ln" style="--cx:200;--cy:124;--w:30;--h:16"></i>
    `
  },
  {
    id: 'crab', group: 'animals',
    name: 'Crab',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:200"></i>
      <i class="r" style="--cx:76;--cy:306;--w:28;--h:80;--k:14;--rot:60deg"></i>
      <i class="r" style="--cx:324;--cy:306;--w:28;--h:80;--k:14;--rot:-60deg"></i>
      <i class="r" style="--cx:104;--cy:204;--w:32;--h:100;--k:16;--rot:-24deg"></i>
      <i class="r" style="--cx:296;--cy:204;--w:32;--h:100;--k:16;--rot:24deg"></i>
      <i class="r" style="--cx:76;--cy:126;--w:100;--h:88;--rot:-20deg"></i>
      <i class="d" style="--cx:70;--cy:100;--w:8;--h:44;--k:4;--rot:-20deg"></i>
      <i class="r" style="--cx:324;--cy:126;--w:100;--h:88;--rot:20deg"></i>
      <i class="d" style="--cx:330;--cy:100;--w:8;--h:44;--k:4;--rot:20deg"></i>
      <i class="r" style="--cx:200;--cy:262;--w:256;--h:170;--r:50% 50% 50% 50% / 56% 56% 44% 44%"></i>
      <i class="r" style="--cx:164;--cy:168;--w:58;--h:58"></i>
      <i class="r" style="--cx:236;--cy:168;--w:58;--h:58"></i>
      <i class="d" style="--cx:166;--cy:170;--w:26;--h:28"></i>
      <i class="d w" style="--cx:171;--cy:164;--w:10;--h:10"></i>
      <i class="d" style="--cx:234;--cy:170;--w:26;--h:28"></i>
      <i class="d w" style="--cx:239;--cy:164;--w:10;--h:10"></i>
      <i class="r" style="--cx:130;--cy:276;--w:34;--h:20"></i>
      <i class="r" style="--cx:270;--cy:276;--w:34;--h:20"></i>
      <i class="ln" style="--cx:200;--cy:266;--w:64;--h:36"></i>
    `
  },

  {
    id: 'bee', group: 'animals',
    name: 'Bee',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:80;--cy:70;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:165;--cy:140;--w:100;--h:130;--rot:-25deg"></i>
      <i class="r" style="--cx:232;--cy:132;--w:100;--h:130;--rot:20deg"></i>
      <i class="r" style="--cx:66;--cy:262;--w:50;--h:50;--k:8;--rot:45deg"></i>
      <i class="r" style="--cx:180;--cy:255;--w:230;--h:170"></i>
      <i class="d" style="--cx:130;--cy:255;--w:36;--h:153"></i>
      <i class="d" style="--cx:190;--cy:255;--w:36;--h:169"></i>
      <i class="d" style="--cx:257;--cy:127;--w:70;--h:8;--k:4;--rot:69deg"></i>
      <i class="d" style="--cx:343;--cy:127;--w:70;--h:8;--k:4;--rot:-69deg"></i>
      <i class="r" style="--cx:245;--cy:95;--w:30;--h:30"></i>
      <i class="r" style="--cx:355;--cy:95;--w:30;--h:30"></i>
      <i class="r" style="--cx:300;--cy:225;--w:160;--h:150"></i>
      <i class="r" style="--cx:252;--cy:250;--w:30;--h:20"></i>
      <i class="r" style="--cx:348;--cy:250;--w:30;--h:20"></i>
      <i class="d" style="--cx:272;--cy:215;--w:26;--h:30"></i>
      <i class="d w" style="--cx:277;--cy:208;--w:9;--h:9"></i>
      <i class="d" style="--cx:328;--cy:215;--w:26;--h:30"></i>
      <i class="d w" style="--cx:333;--cy:208;--w:9;--h:9"></i>
      <i class="ln" style="--cx:300;--cy:248;--w:40;--h:24"></i>
    `
  },
  {
    id: 'butterfly', group: 'animals',
    name: 'Butterfly',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:138;--cy:282;--w:140;--h:120;--rot:-30deg"></i>
      <i class="r" style="--cx:262;--cy:282;--w:140;--h:120;--rot:30deg"></i>
      <i class="r" style="--cx:120;--cy:160;--w:180;--h:160;--rot:25deg"></i>
      <i class="r" style="--cx:280;--cy:160;--w:180;--h:160;--rot:-25deg"></i>
      <i class="r" style="--cx:110;--cy:150;--w:70;--h:60"></i>
      <i class="r" style="--cx:290;--cy:150;--w:70;--h:60"></i>
      <i class="r" style="--cx:128;--cy:294;--w:50;--h:44"></i>
      <i class="r" style="--cx:272;--cy:294;--w:50;--h:44"></i>
      <i class="r" style="--cx:200;--cy:262;--w:56;--h:190"></i>
      <i class="d" style="--cx:165;--cy:57;--w:62;--h:8;--k:4;--rot:61deg"></i>
      <i class="d" style="--cx:235;--cy:57;--w:62;--h:8;--k:4;--rot:-61deg"></i>
      <i class="r" style="--cx:150;--cy:30;--w:30;--h:30"></i>
      <i class="r" style="--cx:250;--cy:30;--w:30;--h:30"></i>
      <i class="r" style="--cx:200;--cy:135;--w:120;--h:110"></i>
      <i class="r" style="--cx:164;--cy:154;--w:26;--h:18"></i>
      <i class="r" style="--cx:236;--cy:154;--w:26;--h:18"></i>
      <i class="d" style="--cx:178;--cy:128;--w:22;--h:26"></i>
      <i class="d w" style="--cx:182;--cy:122;--w:8;--h:8"></i>
      <i class="d" style="--cx:222;--cy:128;--w:22;--h:26"></i>
      <i class="d w" style="--cx:226;--cy:122;--w:8;--h:8"></i>
      <i class="ln" style="--cx:200;--cy:150;--w:30;--h:18"></i>
    `
  },
  {
    id: 'fox', group: 'animals',
    name: 'Fox',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:200"></i>
      <i class="r" style="--cx:290;--cy:298;--w:110;--h:210;--rot:42deg"></i>
      <i class="r" style="--cx:342;--cy:234;--w:80;--h:84;--rot:42deg"></i>
      <i class="r" style="--cx:200;--cy:300;--w:170;--h:130"></i>
      <i class="r" style="--cx:200;--cy:314;--w:90;--h:84"></i>
      <i class="r" style="--cx:158;--cy:358;--w:64;--h:30"></i>
      <i class="r" style="--cx:242;--cy:358;--w:64;--h:30"></i>
      <i class="r" style="--cx:116;--cy:84;--w:92;--h:92;--r:12% 46% 46% 46%;--rot:36deg"></i>
      <i class="r" style="--cx:284;--cy:84;--w:92;--h:92;--r:12% 46% 46% 46%;--rot:54deg"></i>
      <i class="r" style="--cx:119;--cy:90;--w:48;--h:48;--r:12% 46% 46% 46%;--rot:36deg"></i>
      <i class="r" style="--cx:281;--cy:90;--w:48;--h:48;--r:12% 46% 46% 46%;--rot:54deg"></i>
      <i class="r" style="--cx:200;--cy:176;--w:164;--h:164;--k:36;--rot:45deg"></i>
      <i class="r" style="--cx:200;--cy:146;--w:256;--h:150;--r:50% 50% 50% 50% / 60% 60% 40% 40%"></i>
      <i class="r" style="--cx:110;--cy:170;--w:34;--h:20"></i>
      <i class="r" style="--cx:290;--cy:170;--w:34;--h:20"></i>
      <i class="d" style="--cx:200;--cy:226;--w:30;--h:22;--r:50% 50% 50% 50% / 35% 35% 65% 65%"></i>
      <i class="ln" style="--cx:200;--cy:240;--w:30;--h:18"></i>
      <i class="d" style="--cx:156;--cy:150;--w:28;--h:34"></i>
      <i class="d w" style="--cx:161;--cy:142;--w:9;--h:9"></i>
      <i class="d" style="--cx:244;--cy:150;--w:28;--h:34"></i>
      <i class="d w" style="--cx:249;--cy:142;--w:9;--h:9"></i>
    `
  },
  {
    id: 'hedgehog', group: 'animals',
    name: 'Hedgehog',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:180"></i>
      <i class="r" style="--cx:60;--cy:220;--w:54;--h:110;--r:50% 50% 50% 50% / 80% 80% 20% 20%;--rot:-52deg"></i>
      <i class="r" style="--cx:95;--cy:191;--w:54;--h:110;--r:50% 50% 50% 50% / 80% 80% 20% 20%;--rot:-30deg"></i>
      <i class="r" style="--cx:142;--cy:173;--w:54;--h:110;--r:50% 50% 50% 50% / 80% 80% 20% 20%;--rot:-11deg"></i>
      <i class="r" style="--cx:194;--cy:171;--w:54;--h:110;--r:50% 50% 50% 50% / 80% 80% 20% 20%;--rot:6deg"></i>
      <i class="r" style="--cx:243;--cy:184;--w:54;--h:110;--r:50% 50% 50% 50% / 80% 80% 20% 20%;--rot:25deg"></i>
      <i class="r" style="--cx:282;--cy:211;--w:54;--h:110;--r:50% 50% 50% 50% / 80% 80% 20% 20%;--rot:45deg"></i>
      <i class="r" style="--cx:175;--cy:275;--w:290;--h:230"></i>
      <i class="r" style="--cx:140;--cy:376;--w:70;--h:34"></i>
      <i class="r" style="--cx:236;--cy:376;--w:70;--h:34"></i>
      <i class="r" style="--cx:226;--cy:206;--w:48;--h:48"></i>
      <i class="r" style="--cx:328;--cy:282;--w:74;--h:74;--k:16;--rot:45deg"></i>
      <i class="r" style="--cx:268;--cy:282;--w:156;--h:150"></i>
      <i class="r" style="--cx:228;--cy:300;--w:30;--h:18"></i>
      <i class="r" style="--cx:312;--cy:300;--w:30;--h:18"></i>
      <i class="d" style="--cx:372;--cy:282;--w:28;--h:24"></i>
      <i class="d" style="--cx:244;--cy:262;--w:26;--h:32"></i>
      <i class="d w" style="--cx:251;--cy:255;--w:9;--h:9"></i>
      <i class="d" style="--cx:298;--cy:262;--w:26;--h:32"></i>
      <i class="d w" style="--cx:305;--cy:255;--w:9;--h:9"></i>
      <i class="ln" style="--cx:270;--cy:304;--w:34;--h:22"></i>
    `
  },
  {
    id: 'hippo', group: 'animals',
    name: 'Hippo',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:190"></i>
      <i class="r" style="--cx:200;--cy:318;--w:220;--h:136"></i>
      <i class="r" style="--cx:200;--cy:330;--w:120;--h:76"></i>
      <i class="r" style="--cx:145;--cy:376;--w:72;--h:34"></i>
      <i class="r" style="--cx:255;--cy:376;--w:72;--h:34"></i>
      <i class="r" style="--cx:118;--cy:82;--w:50;--h:46"></i>
      <i class="r" style="--cx:282;--cy:82;--w:50;--h:46"></i>
      <i class="r" style="--cx:200;--cy:145;--w:220;--h:160"></i>
      <i class="d" style="--cx:160;--cy:124;--w:28;--h:32"></i>
      <i class="d w" style="--cx:165;--cy:117;--w:10;--h:10"></i>
      <i class="d" style="--cx:240;--cy:124;--w:28;--h:32"></i>
      <i class="d w" style="--cx:245;--cy:117;--w:10;--h:10"></i>
      <i class="r" style="--cx:200;--cy:236;--w:280;--h:148"></i>
      <i class="d" style="--cx:165;--cy:202;--w:18;--h:26"></i>
      <i class="d" style="--cx:235;--cy:202;--w:18;--h:26"></i>
      <i class="r" style="--cx:106;--cy:248;--w:36;--h:22"></i>
      <i class="r" style="--cx:294;--cy:248;--w:36;--h:22"></i>
      <i class="ln" style="--cx:200;--cy:250;--w:96;--h:42"></i>
    `
  },
  {
    id: 'jellyfish', group: 'animals',
    name: 'Jellyfish',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:170"></i>
      <i class="r" style="--cx:110;--cy:310;--w:34;--h:110;--rot:10deg"></i>
      <i class="r" style="--cx:155;--cy:320;--w:34;--h:110;--rot:-6deg"></i>
      <i class="r" style="--cx:200;--cy:324;--w:34;--h:110;--rot:6deg"></i>
      <i class="r" style="--cx:245;--cy:320;--w:34;--h:110;--rot:-6deg"></i>
      <i class="r" style="--cx:290;--cy:310;--w:34;--h:110;--rot:-10deg"></i>
      <i class="r" style="--cx:200;--cy:170;--w:280;--h:220;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:200;--cy:276;--w:304;--h:52"></i>
      <i class="r" style="--cx:150;--cy:102;--w:44;--h:32"></i>
      <i class="r" style="--cx:248;--cy:96;--w:32;--h:26"></i>
      <i class="r" style="--cx:128;--cy:226;--w:34;--h:20"></i>
      <i class="r" style="--cx:272;--cy:226;--w:34;--h:20"></i>
      <i class="d" style="--cx:160;--cy:190;--w:28;--h:32"></i>
      <i class="d w" style="--cx:165;--cy:183;--w:10;--h:10"></i>
      <i class="d" style="--cx:240;--cy:190;--w:28;--h:32"></i>
      <i class="d w" style="--cx:245;--cy:183;--w:10;--h:10"></i>
      <i class="ln" style="--cx:200;--cy:222;--w:44;--h:26"></i>
    `
  },
  // Nov 22 (later): horse, dinosaur, seal, squirrel (open ideas from ROADMAP's animal list).
  {
    id: 'horse', group: 'animals',
    name: 'Horse',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:150"></i>
      <i class="r" style="--cx:154;--cy:336;--w:50;--h:86;--k:20"></i>
      <i class="r" style="--cx:246;--cy:336;--w:50;--h:86;--k:20"></i>
      <i class="r" style="--cx:200;--cy:280;--w:220;--h:110"></i>
      <i class="r" style="--cx:154;--cy:374;--w:66;--h:32;--r:50% 50% 30% 30% / 70% 70% 30% 30%"></i>
      <i class="r" style="--cx:246;--cy:374;--w:66;--h:32;--r:50% 50% 30% 30% / 70% 70% 30% 30%"></i>
      <i class="r" style="--cx:132;--cy:62;--w:50;--h:90;--r:50% 50% 50% 50% / 70% 70% 30% 30%;--rot:-22deg"></i>
      <i class="r" style="--cx:268;--cy:62;--w:50;--h:90;--r:50% 50% 50% 50% / 70% 70% 30% 30%;--rot:22deg"></i>
      <i class="r" style="--cx:200;--cy:142;--w:184;--h:190;--r:50% 50% 50% 50% / 55% 55% 45% 45%"></i>
      <i class="r" style="--cx:178;--cy:72;--w:92;--h:64;--r:100% 0 100% 0;--rot:-10deg"></i>
      <i class="r" style="--cx:226;--cy:70;--w:80;--h:58;--r:0 100% 0 100%;--rot:10deg"></i>
      <i class="r" style="--cx:200;--cy:232;--w:156;--h:104"></i>
      <i class="d" style="--cx:170;--cy:222;--w:16;--h:22"></i>
      <i class="d" style="--cx:230;--cy:222;--w:16;--h:22"></i>
      <i class="ln" style="--cx:200;--cy:244;--w:52;--h:26"></i>
      <i class="r" style="--cx:136;--cy:170;--w:30;--h:18"></i>
      <i class="r" style="--cx:264;--cy:170;--w:30;--h:18"></i>
      <i class="d" style="--cx:156;--cy:128;--w:28;--h:32"></i>
      <i class="d w" style="--cx:161;--cy:121;--w:10;--h:10"></i>
      <i class="d" style="--cx:244;--cy:128;--w:28;--h:32"></i>
      <i class="d w" style="--cx:249;--cy:121;--w:10;--h:10"></i>
    `
  },
  {
    id: 'dinosaur', group: 'animals',
    name: 'Dinosaur',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:150"></i>
      <i class="r" style="--cx:320;--cy:316;--w:140;--h:58;--rot:-28deg"></i>
      <i class="r" style="--cx:196;--cy:206;--w:60;--h:60;--k:14;--rot:45deg"></i>
      <i class="r" style="--cx:254;--cy:196;--w:60;--h:60;--k:14;--rot:45deg"></i>
      <i class="r" style="--cx:310;--cy:214;--w:60;--h:60;--k:14;--rot:45deg"></i>
      <i class="r" style="--cx:180;--cy:338;--w:58;--h:84;--k:24"></i>
      <i class="r" style="--cx:290;--cy:338;--w:58;--h:84;--k:24"></i>
      <i class="r" style="--cx:128;--cy:200;--w:76;--h:200;--k:38;--rot:18deg"></i>
      <i class="r" style="--cx:240;--cy:286;--w:240;--h:160"></i>
      <i class="r" style="--cx:226;--cy:314;--w:140;--h:76"></i>
      <i class="r" style="--cx:110;--cy:104;--w:160;--h:116"></i>
      <i class="r" style="--cx:132;--cy:134;--w:32;--h:20"></i>
      <i class="d" style="--cx:48;--cy:100;--w:12;--h:12"></i>
      <i class="ln" style="--cx:76;--cy:122;--w:50;--h:28"></i>
      <i class="d" style="--cx:112;--cy:92;--w:28;--h:32"></i>
      <i class="d w" style="--cx:117;--cy:85;--w:10;--h:10"></i>
    `
  },
  {
    id: 'seal', group: 'animals',
    name: 'Seal',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:150"></i>
      <i class="r" style="--cx:150;--cy:372;--w:84;--h:36;--rot:-12deg"></i>
      <i class="r" style="--cx:250;--cy:372;--w:84;--h:36;--rot:12deg"></i>
      <i class="r" style="--cx:104;--cy:286;--w:50;--h:104;--rot:34deg"></i>
      <i class="r" style="--cx:296;--cy:286;--w:50;--h:104;--rot:-34deg"></i>
      <i class="r" style="--cx:200;--cy:272;--w:200;--h:200"></i>
      <i class="r" style="--cx:200;--cy:296;--w:120;--h:130"></i>
      <i class="r" style="--cx:200;--cy:140;--w:190;--h:156"></i>
      <i class="r" style="--cx:178;--cy:178;--w:52;--h:42"></i>
      <i class="r" style="--cx:222;--cy:178;--w:52;--h:42"></i>
      <i class="d" style="--cx:200;--cy:158;--w:30;--h:20;--r:50% 50% 50% 50% / 35% 35% 65% 65%"></i>
      <i class="d" style="--cx:168;--cy:180;--w:7;--h:7"></i>
      <i class="d" style="--cx:182;--cy:188;--w:7;--h:7"></i>
      <i class="d" style="--cx:232;--cy:180;--w:7;--h:7"></i>
      <i class="d" style="--cx:218;--cy:188;--w:7;--h:7"></i>
      <i class="r" style="--cx:132;--cy:160;--w:30;--h:18"></i>
      <i class="r" style="--cx:268;--cy:160;--w:30;--h:18"></i>
      <i class="d" style="--cx:160;--cy:122;--w:28;--h:32"></i>
      <i class="d w" style="--cx:165;--cy:115;--w:10;--h:10"></i>
      <i class="d" style="--cx:240;--cy:122;--w:28;--h:32"></i>
      <i class="d w" style="--cx:245;--cy:115;--w:10;--h:10"></i>
    `
  },
  {
    id: 'squirrel', group: 'animals',
    name: 'Squirrel',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:150"></i>
      <i class="r" style="--cx:300;--cy:230;--w:140;--h:260;--rot:14deg"></i>
      <i class="r" style="--cx:322;--cy:96;--w:120;--h:110;--rot:14deg"></i>
      <i class="r" style="--cx:186;--cy:290;--w:160;--h:150"></i>
      <i class="r" style="--cx:186;--cy:304;--w:96;--h:100"></i>
      <i class="r" style="--cx:148;--cy:364;--w:66;--h:30"></i>
      <i class="r" style="--cx:224;--cy:364;--w:66;--h:30"></i>
      <i class="r" style="--cx:122;--cy:290;--w:40;--h:62;--rot:20deg"></i>
      <i class="r" style="--cx:250;--cy:290;--w:40;--h:62;--rot:-20deg"></i>
      <i class="r" style="--cx:116;--cy:82;--w:64;--h:64;--r:12% 46% 46% 46%;--rot:36deg"></i>
      <i class="r" style="--cx:256;--cy:82;--w:64;--h:64;--r:12% 46% 46% 46%;--rot:54deg"></i>
      <i class="r" style="--cx:186;--cy:160;--w:180;--h:156"></i>
      <i class="d" style="--cx:186;--cy:184;--w:24;--h:18;--r:50% 50% 50% 50% / 35% 35% 65% 65%"></i>
      <i class="ln" style="--cx:186;--cy:198;--w:34;--h:20"></i>
      <i class="r" style="--cx:122;--cy:186;--w:30;--h:18"></i>
      <i class="r" style="--cx:250;--cy:186;--w:30;--h:18"></i>
      <i class="d" style="--cx:148;--cy:148;--w:28;--h:32"></i>
      <i class="d w" style="--cx:153;--cy:141;--w:10;--h:10"></i>
      <i class="d" style="--cx:224;--cy:148;--w:28;--h:32"></i>
      <i class="d w" style="--cx:229;--cy:141;--w:10;--h:10"></i>
    `
  },
  {
    id: 'zebra', group: 'animals',
    name: 'Zebra',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:150"></i>
      <i class="r" style="--cx:158;--cy:336;--w:50;--h:86;--k:20"></i>
      <i class="r" style="--cx:242;--cy:336;--w:50;--h:86;--k:20"></i>
      <i class="d" style="--cx:158;--cy:334;--w:42;--h:11"></i>
      <i class="d" style="--cx:242;--cy:334;--w:42;--h:11"></i>
      <i class="r" style="--cx:200;--cy:282;--w:220;--h:112"></i>
      <i class="d" style="--cx:122;--cy:290;--w:13;--h:54;--rot:22deg;--k:6"></i>
      <i class="d" style="--cx:278;--cy:290;--w:13;--h:54;--rot:-22deg;--k:6"></i>
      <i class="d" style="--cx:154;--cy:312;--w:13;--h:40;--rot:10deg;--k:6"></i>
      <i class="d" style="--cx:246;--cy:312;--w:13;--h:40;--rot:-10deg;--k:6"></i>
      <i class="r" style="--cx:158;--cy:374;--w:66;--h:32;--r:50% 50% 30% 30% / 70% 70% 30% 30%"></i>
      <i class="r" style="--cx:242;--cy:374;--w:66;--h:32;--r:50% 50% 30% 30% / 70% 70% 30% 30%"></i>
      <i class="r" style="--cx:200;--cy:62;--w:62;--h:96;--k:30"></i>
      <i class="r" style="--cx:130;--cy:66;--w:50;--h:90;--r:50% 50% 50% 50% / 70% 70% 30% 30%;--rot:-24deg"></i>
      <i class="r" style="--cx:270;--cy:66;--w:50;--h:90;--r:50% 50% 50% 50% / 70% 70% 30% 30%;--rot:24deg"></i>
      <i class="r" style="--cx:200;--cy:146;--w:186;--h:188;--r:50% 50% 50% 50% / 55% 55% 45% 45%"></i>
      <i class="d" style="--cx:200;--cy:76;--w:14;--h:40;--k:7"></i>
      <i class="d" style="--cx:164;--cy:86;--w:13;--h:36;--rot:-32deg;--k:6"></i>
      <i class="d" style="--cx:236;--cy:86;--w:13;--h:36;--rot:32deg;--k:6"></i>
      <i class="d" style="--cx:120;--cy:138;--w:34;--h:12;--rot:14deg;--k:6"></i>
      <i class="d" style="--cx:280;--cy:138;--w:34;--h:12;--rot:-14deg;--k:6"></i>
      <i class="r" style="--cx:200;--cy:234;--w:152;--h:100"></i>
      <i class="d" style="--cx:172;--cy:222;--w:16;--h:22"></i>
      <i class="d" style="--cx:228;--cy:222;--w:16;--h:22"></i>
      <i class="ln" style="--cx:200;--cy:246;--w:52;--h:26"></i>
      <i class="r" style="--cx:136;--cy:176;--w:30;--h:18"></i>
      <i class="r" style="--cx:264;--cy:176;--w:30;--h:18"></i>
      <i class="d" style="--cx:158;--cy:136;--w:28;--h:32"></i>
      <i class="d w" style="--cx:163;--cy:129;--w:10;--h:10"></i>
      <i class="d" style="--cx:242;--cy:136;--w:28;--h:32"></i>
      <i class="d w" style="--cx:247;--cy:129;--w:10;--h:10"></i>
    `
  },
  {
    id: 'dolphin', group: 'animals',
    name: 'Dolphin',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:160"></i>
      <i class="r" style="--cx:356;--cy:266;--w:36;--h:76;--rot:18deg"></i>
      <i class="r" style="--cx:356;--cy:330;--w:36;--h:76;--rot:-48deg"></i>
      <i class="r" style="--cx:306;--cy:280;--w:110;--h:54;--rot:28deg"></i>
      <i class="r" style="--cx:196;--cy:166;--w:58;--h:92;--r:100% 0 100% 0;--rot:28deg"></i>
      <i class="r" style="--cx:150;--cy:306;--w:38;--h:76;--rot:40deg"></i>
      <i class="r" style="--cx:48;--cy:230;--w:84;--h:46;--rot:10deg"></i>
      <i class="r" style="--cx:180;--cy:242;--w:250;--h:140;--rot:10deg"></i>
      <i class="ln" style="--cx:90;--cy:236;--w:40;--h:20;--rot:10deg"></i>
      <i class="r" style="--cx:142;--cy:242;--w:30;--h:18;--rot:10deg"></i>
      <i class="d" style="--cx:112;--cy:206;--w:28;--h:32"></i>
      <i class="d w" style="--cx:117;--cy:199;--w:10;--h:10"></i>
    `
  },
  {
    id: 'parrot', group: 'animals',
    name: 'Parrot',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:168;--cy:338;--w:44;--h:116;--rot:18deg"></i>
      <i class="r" style="--cx:232;--cy:338;--w:44;--h:116;--rot:-18deg"></i>
      <i class="r" style="--cx:200;--cy:340;--w:44;--h:118"></i>
      <i class="r" style="--cx:200;--cy:262;--w:170;--h:176"></i>
      <i class="r" style="--cx:200;--cy:286;--w:96;--h:110"></i>
      <i class="r" style="--cx:118;--cy:268;--w:62;--h:136;--r:100% 0 100% 0;--rot:12deg"></i>
      <i class="r" style="--cx:282;--cy:268;--w:62;--h:136;--r:0 100% 0 100%;--rot:-12deg"></i>
      <i class="r" style="--cx:200;--cy:336;--w:380;--h:40;--k:20"></i>
      <i class="r" style="--cx:166;--cy:320;--w:40;--h:28"></i>
      <i class="r" style="--cx:234;--cy:320;--w:40;--h:28"></i>
      <i class="r" style="--cx:170;--cy:58;--w:34;--h:76;--rot:-24deg"></i>
      <i class="r" style="--cx:200;--cy:48;--w:34;--h:80"></i>
      <i class="r" style="--cx:230;--cy:58;--w:34;--h:76;--rot:24deg"></i>
      <i class="r" style="--cx:200;--cy:140;--w:176;--h:160"></i>
      <i class="r" style="--cx:200;--cy:196;--w:36;--h:28"></i>
      <i class="r" style="--cx:200;--cy:172;--w:56;--h:56;--r:40% 40% 50% 50% / 30% 30% 70% 70%"></i>
      <i class="r" style="--cx:136;--cy:168;--w:30;--h:18"></i>
      <i class="r" style="--cx:264;--cy:168;--w:30;--h:18"></i>
      <i class="d" style="--cx:162;--cy:128;--w:28;--h:32"></i>
      <i class="d w" style="--cx:167;--cy:121;--w:10;--h:10"></i>
      <i class="d" style="--cx:238;--cy:128;--w:28;--h:32"></i>
      <i class="d w" style="--cx:243;--cy:121;--w:10;--h:10"></i>
    `
  },
  {
    id: 'raccoon', group: 'animals',
    name: 'Raccoon',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:150"></i>
      <i class="r" style="--cx:326;--cy:176;--w:62;--h:56"></i>
      <i class="r" style="--cx:334;--cy:208;--w:72;--h:58;--rot:8deg"></i>
      <i class="r" style="--cx:336;--cy:242;--w:78;--h:60;--rot:4deg"></i>
      <i class="r" style="--cx:330;--cy:276;--w:80;--h:62;--rot:-8deg"></i>
      <i class="r" style="--cx:312;--cy:310;--w:82;--h:64;--rot:-20deg"></i>
      <i class="r" style="--cx:190;--cy:298;--w:170;--h:150"></i>
      <i class="r" style="--cx:190;--cy:312;--w:96;--h:100"></i>
      <i class="r" style="--cx:150;--cy:366;--w:66;--h:30"></i>
      <i class="r" style="--cx:230;--cy:366;--w:66;--h:30"></i>
      <i class="r" style="--cx:124;--cy:296;--w:40;--h:62;--rot:20deg"></i>
      <i class="r" style="--cx:256;--cy:296;--w:40;--h:62;--rot:-20deg"></i>
      <i class="r" style="--cx:112;--cy:84;--w:66;--h:66;--r:12% 46% 46% 46%;--rot:36deg"></i>
      <i class="r" style="--cx:268;--cy:84;--w:66;--h:66;--r:12% 46% 46% 46%;--rot:54deg"></i>
      <i class="r" style="--cx:190;--cy:160;--w:204;--h:164"></i>
      <i class="r" style="--cx:152;--cy:146;--w:78;--h:56;--rot:-10deg"></i>
      <i class="r" style="--cx:228;--cy:146;--w:78;--h:56;--rot:10deg"></i>
      <i class="r" style="--cx:190;--cy:200;--w:84;--h:56"></i>
      <i class="d" style="--cx:190;--cy:184;--w:26;--h:18;--r:50% 50% 50% 50% / 35% 35% 65% 65%"></i>
      <i class="ln" style="--cx:190;--cy:198;--w:34;--h:20"></i>
      <i class="r" style="--cx:118;--cy:196;--w:30;--h:18"></i>
      <i class="r" style="--cx:262;--cy:196;--w:30;--h:18"></i>
      <i class="d" style="--cx:156;--cy:146;--w:26;--h:30"></i>
      <i class="d w" style="--cx:161;--cy:139;--w:9;--h:9"></i>
      <i class="d" style="--cx:224;--cy:146;--w:26;--h:30"></i>
      <i class="d w" style="--cx:229;--cy:139;--w:9;--h:9"></i>
    `
  },
  {
    // Panda: sitting, facing front. The eye patches, ears, arms and feet are their own parts (color them black!).
    id: 'panda', group: 'animals',
    name: 'Panda',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:150"></i>
      <i class="r" style="--cx:146;--cy:366;--w:78;--h:44"></i>
      <i class="r" style="--cx:254;--cy:366;--w:78;--h:44"></i>
      <i class="r" style="--cx:200;--cy:300;--w:190;--h:160"></i>
      <i class="r" style="--cx:200;--cy:312;--w:104;--h:104"></i>
      <i class="r" style="--cx:118;--cy:296;--w:50;--h:96;--rot:24deg"></i>
      <i class="r" style="--cx:282;--cy:296;--w:50;--h:96;--rot:-24deg"></i>
      <i class="r" style="--cx:116;--cy:78;--w:72;--h:72"></i>
      <i class="r" style="--cx:284;--cy:78;--w:72;--h:72"></i>
      <i class="r" style="--cx:200;--cy:160;--w:228;--h:184"></i>
      <i class="r" style="--cx:152;--cy:150;--w:62;--h:80;--rot:35deg"></i>
      <i class="r" style="--cx:248;--cy:150;--w:62;--h:80;--rot:-35deg"></i>
      <i class="d" style="--cx:156;--cy:148;--w:26;--h:30"></i>
      <i class="d w" style="--cx:161;--cy:141;--w:9;--h:9"></i>
      <i class="d" style="--cx:244;--cy:148;--w:26;--h:30"></i>
      <i class="d w" style="--cx:249;--cy:141;--w:9;--h:9"></i>
      <i class="d" style="--cx:200;--cy:194;--w:32;--h:22;--r:50% 50% 50% 50% / 35% 35% 65% 65%"></i>
      <i class="ln" style="--cx:200;--cy:206;--w:38;--h:22"></i>
      <i class="r" style="--cx:126;--cy:206;--w:32;--h:20"></i>
      <i class="r" style="--cx:274;--cy:206;--w:32;--h:20"></i>
    `
  },
  {
    // Koala: big round fluffy ears and a big dark nose.
    id: 'koala', group: 'animals',
    name: 'Koala',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:150"></i>
      <i class="r" style="--cx:150;--cy:368;--w:72;--h:40"></i>
      <i class="r" style="--cx:250;--cy:368;--w:72;--h:40"></i>
      <i class="r" style="--cx:200;--cy:306;--w:176;--h:150"></i>
      <i class="r" style="--cx:200;--cy:318;--w:96;--h:100"></i>
      <i class="r" style="--cx:128;--cy:300;--w:46;--h:86;--rot:22deg"></i>
      <i class="r" style="--cx:272;--cy:300;--w:46;--h:86;--rot:-22deg"></i>
      <i class="r" style="--cx:94;--cy:100;--w:118;--h:118"></i>
      <i class="r" style="--cx:306;--cy:100;--w:118;--h:118"></i>
      <i class="r" style="--cx:84;--cy:96;--w:62;--h:62"></i>
      <i class="r" style="--cx:316;--cy:96;--w:62;--h:62"></i>
      <i class="r" style="--cx:200;--cy:172;--w:216;--h:184"></i>
      <i class="d" style="--cx:200;--cy:186;--w:54;--h:70;--r:45% 45% 50% 50% / 40% 40% 60% 60%"></i>
      <i class="d w" style="--cx:189;--cy:168;--w:10;--h:14"></i>
      <i class="ln" style="--cx:200;--cy:222;--w:34;--h:20"></i>
      <i class="d" style="--cx:146;--cy:158;--w:24;--h:28"></i>
      <i class="d w" style="--cx:151;--cy:151;--w:8;--h:8"></i>
      <i class="d" style="--cx:254;--cy:158;--w:24;--h:28"></i>
      <i class="d w" style="--cx:259;--cy:151;--w:8;--h:8"></i>
      <i class="r" style="--cx:132;--cy:204;--w:32;--h:20"></i>
      <i class="r" style="--cx:268;--cy:204;--w:32;--h:20"></i>
    `
  },
  {
    // Flamingo: standing in the water on its long legs, a curvy neck, a bent beak.
    id: 'flamingo', group: 'animals',
    name: 'Flamingo',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:204;--cy:330;--w:22;--h:150;--k:11"></i>
      <i class="r" style="--cx:250;--cy:330;--w:22;--h:150;--k:11"></i>
      <i class="r" style="--cx:200;--cy:460;--w:760;--h:170"></i>
      <i class="r" style="--cx:324;--cy:210;--w:90;--h:52;--r:100% 0 100% 0;--rot:-14deg"></i>
      <i class="r" style="--cx:146;--cy:154;--w:46;--h:136;--k:23;--rot:-8deg"></i>
      <i class="r" style="--cx:232;--cy:240;--w:222;--h:136;--rot:-8deg"></i>
      <i class="r" style="--cx:240;--cy:236;--w:126;--h:72;--r:100% 0 100% 0;--rot:-12deg"></i>
      <i class="r" style="--cx:94;--cy:110;--w:92;--h:42;--r:50% 40% 40% 50% / 60% 50% 50% 40%;--rot:-40deg"></i>
      <i class="d" style="--cx:66;--cy:134;--w:30;--h:34;--r:60% 30% 30% 60% / 50% 40% 60% 50%;--rot:-40deg"></i>
      <i class="r" style="--cx:140;--cy:78;--w:112;--h:98"></i>
      <i class="d" style="--cx:150;--cy:68;--w:24;--h:28"></i>
      <i class="d w" style="--cx:155;--cy:61;--w:9;--h:9"></i>
      <i class="r" style="--cx:166;--cy:100;--w:30;--h:18"></i>
    `
  },
  {
    // Deer: a young deer with little antlers, big leaf ears and a round nose.
    id: 'deer', group: 'animals',
    name: 'Deer',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:150"></i>
      <i class="r" style="--cx:166;--cy:350;--w:40;--h:80;--k:20"></i>
      <i class="r" style="--cx:234;--cy:350;--w:40;--h:80;--k:20"></i>
      <i class="r" style="--cx:200;--cy:296;--w:160;--h:130"></i>
      <i class="r" style="--cx:200;--cy:306;--w:84;--h:88"></i>
      <i class="r" style="--cx:142;--cy:60;--w:24;--h:96;--k:12;--rot:-16deg"></i>
      <i class="r" style="--cx:120;--cy:52;--w:24;--h:56;--k:12;--rot:-62deg"></i>
      <i class="r" style="--cx:258;--cy:60;--w:24;--h:96;--k:12;--rot:16deg"></i>
      <i class="r" style="--cx:280;--cy:52;--w:24;--h:56;--k:12;--rot:62deg"></i>
      <i class="r" style="--cx:88;--cy:146;--w:100;--h:54;--rot:-18deg"></i>
      <i class="r" style="--cx:312;--cy:146;--w:100;--h:54;--rot:18deg"></i>
      <i class="r" style="--cx:84;--cy:146;--w:58;--h:28;--rot:-18deg"></i>
      <i class="r" style="--cx:316;--cy:146;--w:58;--h:28;--rot:18deg"></i>
      <i class="r" style="--cx:200;--cy:168;--w:180;--h:176"></i>
      <i class="r" style="--cx:200;--cy:212;--w:92;--h:70"></i>
      <i class="d" style="--cx:200;--cy:196;--w:32;--h:22;--r:50% 50% 50% 50% / 35% 35% 65% 65%"></i>
      <i class="ln" style="--cx:200;--cy:210;--w:30;--h:18"></i>
      <i class="d" style="--cx:166;--cy:152;--w:26;--h:30"></i>
      <i class="d w" style="--cx:171;--cy:145;--w:9;--h:9"></i>
      <i class="d" style="--cx:234;--cy:152;--w:26;--h:30"></i>
      <i class="d w" style="--cx:239;--cy:145;--w:9;--h:9"></i>
      <i class="r" style="--cx:134;--cy:198;--w:28;--h:18"></i>
      <i class="r" style="--cx:266;--cy:198;--w:28;--h:18"></i>
    `
  },
  {
    // Kangaroo: sitting up, facing front, tall ears, a pouch on its tummy, big feet and its tail out to the right.
    id: 'kangaroo', group: 'animals',
    name: 'Kangaroo',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:150"></i>
      <i class="r" style="--cx:310;--cy:346;--w:170;--h:54;--rot:-24deg"></i>
      <i class="r" style="--cx:200;--cy:282;--w:196;--h:190"></i>
      <i class="r" style="--cx:200;--cy:318;--w:120;--h:84;--r:10% 10% 50% 50% / 16% 16% 84% 84%"></i>
      <i class="r" style="--cx:140;--cy:366;--w:108;--h:38"></i>
      <i class="r" style="--cx:260;--cy:366;--w:108;--h:38"></i>
      <i class="r" style="--cx:166;--cy:282;--w:44;--h:30;--rot:30deg"></i>
      <i class="r" style="--cx:234;--cy:282;--w:44;--h:30;--rot:-30deg"></i>
      <i class="r" style="--cx:146;--cy:78;--w:62;--h:128;--rot:-16deg"></i>
      <i class="r" style="--cx:254;--cy:78;--w:62;--h:128;--rot:16deg"></i>
      <i class="r" style="--cx:148;--cy:84;--w:30;--h:80;--rot:-16deg"></i>
      <i class="r" style="--cx:252;--cy:84;--w:30;--h:80;--rot:16deg"></i>
      <i class="r" style="--cx:200;--cy:160;--w:186;--h:150"></i>
      <i class="r" style="--cx:200;--cy:204;--w:104;--h:64"></i>
      <i class="d" style="--cx:200;--cy:188;--w:26;--h:18;--r:50% 50% 50% 50% / 35% 35% 65% 65%"></i>
      <i class="ln" style="--cx:200;--cy:202;--w:34;--h:18"></i>
      <i class="r" style="--cx:126;--cy:194;--w:30;--h:18"></i>
      <i class="r" style="--cx:274;--cy:194;--w:30;--h:18"></i>
      <i class="d" style="--cx:162;--cy:148;--w:26;--h:30"></i>
      <i class="d w" style="--cx:167;--cy:141;--w:9;--h:9"></i>
      <i class="d" style="--cx:238;--cy:148;--w:26;--h:30"></i>
      <i class="d w" style="--cx:243;--cy:141;--w:9;--h:9"></i>
    `
  },
  {
    // Tiger: sitting, facing front, round ears, a light muzzle, a few big stripes, the tail curls up on the right.
    id: 'tiger', group: 'animals',
    name: 'Tiger',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:150"></i>
      <i class="r" style="--cx:300;--cy:286;--w:64;--h:190;--rot:24deg"></i>
      <i class="r" style="--cx:334;--cy:206;--w:62;--h:66;--rot:24deg"></i>
      <i class="r" style="--cx:192;--cy:298;--w:172;--h:150"></i>
      <i class="r" style="--cx:192;--cy:308;--w:96;--h:112"></i>
      <i class="d" style="--cx:122;--cy:300;--w:40;--h:14;--rot:-20deg;--r:100% 0 100% 0"></i>
      <i class="d" style="--cx:262;--cy:300;--w:40;--h:14;--rot:20deg;--r:100% 0 100% 0"></i>
      <i class="r" style="--cx:150;--cy:366;--w:68;--h:30"></i>
      <i class="r" style="--cx:234;--cy:366;--w:68;--h:30"></i>
      <i class="r" style="--cx:110;--cy:96;--w:74;--h:70"></i>
      <i class="r" style="--cx:274;--cy:96;--w:74;--h:70"></i>
      <i class="r" style="--cx:114;--cy:102;--w:38;--h:34"></i>
      <i class="r" style="--cx:270;--cy:102;--w:38;--h:34"></i>
      <i class="r" style="--cx:192;--cy:168;--w:240;--h:180"></i>
      <i class="d" style="--cx:192;--cy:96;--w:18;--h:40;--r:50% 50% 50% 50% / 20% 20% 80% 80%"></i>
      <i class="d" style="--cx:160;--cy:100;--w:14;--h:30;--rot:-14deg;--r:50% 50% 50% 50% / 20% 20% 80% 80%"></i>
      <i class="d" style="--cx:224;--cy:100;--w:14;--h:30;--rot:14deg;--r:50% 50% 50% 50% / 20% 20% 80% 80%"></i>
      <i class="d" style="--cx:90;--cy:162;--w:40;--h:14;--rot:12deg;--r:100% 0 100% 0"></i>
      <i class="d" style="--cx:294;--cy:162;--w:40;--h:14;--rot:-12deg;--r:100% 0 100% 0"></i>
      <i class="d" style="--cx:92;--cy:190;--w:36;--h:12;--rot:-8deg;--r:100% 0 100% 0"></i>
      <i class="d" style="--cx:292;--cy:190;--w:36;--h:12;--rot:8deg;--r:100% 0 100% 0"></i>
      <i class="r" style="--cx:192;--cy:210;--w:124;--h:70"></i>
      <i class="d" style="--cx:192;--cy:190;--w:26;--h:18;--r:50% 50% 50% 50% / 35% 35% 65% 65%"></i>
      <i class="ln" style="--cx:192;--cy:204;--w:34;--h:20"></i>
      <i class="r" style="--cx:118;--cy:206;--w:30;--h:18"></i>
      <i class="r" style="--cx:266;--cy:206;--w:30;--h:18"></i>
      <i class="d" style="--cx:152;--cy:156;--w:26;--h:30"></i>
      <i class="d w" style="--cx:157;--cy:149;--w:9;--h:9"></i>
      <i class="d" style="--cx:232;--cy:156;--w:26;--h:30"></i>
      <i class="d w" style="--cx:237;--cy:149;--w:9;--h:9"></i>
    `
  },
  {
    // Hamster: one round chubby blob, puffy cheek pouches, tiny paws holding a seed.
    id: 'hamster', group: 'animals',
    name: 'Hamster',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:150"></i>
      <i class="r" style="--cx:158;--cy:364;--w:56;--h:30"></i>
      <i class="r" style="--cx:242;--cy:364;--w:56;--h:30"></i>
      <i class="r" style="--cx:200;--cy:280;--w:250;--h:190"></i>
      <i class="r" style="--cx:200;--cy:300;--w:150;--h:120"></i>
      <i class="r" style="--cx:134;--cy:100;--w:58;--h:56"></i>
      <i class="r" style="--cx:266;--cy:100;--w:58;--h:56"></i>
      <i class="r" style="--cx:136;--cy:104;--w:30;--h:28"></i>
      <i class="r" style="--cx:264;--cy:104;--w:30;--h:28"></i>
      <i class="r" style="--cx:112;--cy:196;--w:84;--h:84"></i>
      <i class="r" style="--cx:288;--cy:196;--w:84;--h:84"></i>
      <i class="r" style="--cx:200;--cy:172;--w:210;--h:164"></i>
      <i class="r" style="--cx:200;--cy:262;--w:40;--h:58;--rot:8deg;--r:50% 50% 50% 50% / 60% 60% 40% 40%"></i>
      <i class="r" style="--cx:172;--cy:274;--w:42;--h:30;--rot:20deg"></i>
      <i class="r" style="--cx:228;--cy:274;--w:42;--h:30;--rot:-20deg"></i>
      <i class="d" style="--cx:200;--cy:190;--w:22;--h:16;--r:50% 50% 50% 50% / 35% 35% 65% 65%"></i>
      <i class="ln" style="--cx:200;--cy:202;--w:30;--h:16"></i>
      <i class="r" style="--cx:130;--cy:200;--w:30;--h:18"></i>
      <i class="r" style="--cx:270;--cy:200;--w:30;--h:18"></i>
      <i class="d" style="--cx:160;--cy:160;--w:26;--h:30"></i>
      <i class="d w" style="--cx:165;--cy:153;--w:9;--h:9"></i>
      <i class="d" style="--cx:240;--cy:160;--w:26;--h:30"></i>
      <i class="d w" style="--cx:245;--cy:153;--w:9;--h:9"></i>
    `
  },
  {
    // Walrus: a big round body, two flippers, puffy whisker pads and two long tusks.
    id: 'walrus', group: 'animals',
    name: 'Walrus',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:150"></i>
      <i class="r" style="--cx:84;--cy:356;--w:96;--h:46;--rot:-18deg"></i>
      <i class="r" style="--cx:316;--cy:356;--w:96;--h:46;--rot:18deg"></i>
      <i class="r" style="--cx:200;--cy:290;--w:276;--h:190"></i>
      <i class="r" style="--cx:200;--cy:166;--w:200;--h:170"></i>
      <i class="r" style="--cx:176;--cy:258;--w:26;--h:84;--rot:6deg;--r:50% 50% 50% 50% / 20% 20% 80% 80%"></i>
      <i class="r" style="--cx:224;--cy:258;--w:26;--h:84;--rot:-6deg;--r:50% 50% 50% 50% / 20% 20% 80% 80%"></i>
      <i class="r" style="--cx:166;--cy:208;--w:86;--h:70"></i>
      <i class="r" style="--cx:234;--cy:208;--w:86;--h:70"></i>
      <i class="d" style="--cx:200;--cy:182;--w:30;--h:20;--r:50% 50% 50% 50% / 35% 35% 65% 65%"></i>
      <i class="d" style="--cx:148;--cy:206;--w:9;--h:9"></i>
      <i class="d" style="--cx:164;--cy:222;--w:9;--h:9"></i>
      <i class="d" style="--cx:178;--cy:204;--w:9;--h:9"></i>
      <i class="d" style="--cx:252;--cy:206;--w:9;--h:9"></i>
      <i class="d" style="--cx:236;--cy:222;--w:9;--h:9"></i>
      <i class="d" style="--cx:222;--cy:204;--w:9;--h:9"></i>
      <i class="r" style="--cx:114;--cy:180;--w:28;--h:18"></i>
      <i class="r" style="--cx:286;--cy:180;--w:28;--h:18"></i>
      <i class="d" style="--cx:160;--cy:140;--w:26;--h:30"></i>
      <i class="d w" style="--cx:165;--cy:133;--w:9;--h:9"></i>
      <i class="d" style="--cx:240;--cy:140;--w:26;--h:30"></i>
      <i class="d w" style="--cx:245;--cy:133;--w:9;--h:9"></i>
    `
  },
  {
    // Otter: sitting up, facing front, small round ears, a puffy muzzle, holding a shell; its tail lies out to the right.
    id: 'otter', group: 'animals',
    name: 'Otter',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:150"></i>
      <i class="r" style="--cx:306;--cy:352;--w:150;--h:44;--rot:-16deg"></i>
      <i class="r" style="--cx:156;--cy:366;--w:62;--h:30"></i>
      <i class="r" style="--cx:244;--cy:366;--w:62;--h:30"></i>
      <i class="r" style="--cx:200;--cy:284;--w:180;--h:176"></i>
      <i class="r" style="--cx:200;--cy:304;--w:112;--h:118"></i>
      <i class="r" style="--cx:126;--cy:102;--w:46;--h:46"></i>
      <i class="r" style="--cx:274;--cy:102;--w:46;--h:46"></i>
      <i class="r" style="--cx:200;--cy:168;--w:224;--h:168"></i>
      <i class="r" style="--cx:200;--cy:268;--w:64;--h:50;--r:50% 50% 22% 22% / 70% 70% 30% 30%"></i>
      <i class="r" style="--cx:168;--cy:276;--w:40;--h:28;--rot:20deg"></i>
      <i class="r" style="--cx:232;--cy:276;--w:40;--h:28;--rot:-20deg"></i>
      <i class="r" style="--cx:176;--cy:206;--w:64;--h:50"></i>
      <i class="r" style="--cx:224;--cy:206;--w:64;--h:50"></i>
      <i class="d" style="--cx:200;--cy:186;--w:34;--h:22;--r:50% 50% 50% 50% / 35% 35% 65% 65%"></i>
      <i class="r" style="--cx:120;--cy:194;--w:28;--h:18"></i>
      <i class="r" style="--cx:280;--cy:194;--w:28;--h:18"></i>
      <i class="d" style="--cx:160;--cy:146;--w:26;--h:30"></i>
      <i class="d w" style="--cx:165;--cy:139;--w:9;--h:9"></i>
      <i class="d" style="--cx:240;--cy:146;--w:26;--h:30"></i>
      <i class="d w" style="--cx:245;--cy:139;--w:9;--h:9"></i>
    `
  },
  {
    // Sloth: hanging from a branch with both arms, a light face with dark eye patches and a sleepy smile.
    id: 'sloth', group: 'animals',
    name: 'Sloth',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:162;--cy:350;--w:46;--h:76;--k:23;--rot:8deg"></i>
      <i class="r" style="--cx:238;--cy:350;--w:46;--h:76;--k:23;--rot:-8deg"></i>
      <i class="r" style="--cx:200;--cy:278;--w:176;--h:176"></i>
      <i class="r" style="--cx:200;--cy:296;--w:98;--h:108"></i>
      <i class="r" style="--cx:146;--cy:120;--w:46;--h:140;--k:23;--rot:16deg"></i>
      <i class="r" style="--cx:254;--cy:120;--w:46;--h:140;--k:23;--rot:-16deg"></i>
      <i class="r" style="--cx:200;--cy:62;--w:440;--h:42;--k:21"></i>
      <i class="r" style="--cx:166;--cy:62;--w:46;--h:40"></i>
      <i class="r" style="--cx:234;--cy:62;--w:46;--h:40"></i>
      <i class="r" style="--cx:200;--cy:186;--w:196;--h:162"></i>
      <i class="r" style="--cx:200;--cy:196;--w:152;--h:110"></i>
      <i class="r" style="--cx:160;--cy:188;--w:62;--h:36;--rot:-20deg"></i>
      <i class="r" style="--cx:240;--cy:188;--w:62;--h:36;--rot:20deg"></i>
      <i class="d" style="--cx:164;--cy:186;--w:22;--h:26"></i>
      <i class="d w" style="--cx:168;--cy:180;--w:8;--h:8"></i>
      <i class="d" style="--cx:236;--cy:186;--w:22;--h:26"></i>
      <i class="d w" style="--cx:240;--cy:180;--w:8;--h:8"></i>
      <i class="d" style="--cx:200;--cy:214;--w:28;--h:18;--r:50% 50% 50% 50% / 35% 35% 65% 65%"></i>
      <i class="ln" style="--cx:200;--cy:226;--w:40;--h:18"></i>
      <i class="r" style="--cx:144;--cy:222;--w:26;--h:16"></i>
      <i class="r" style="--cx:256;--cy:222;--w:26;--h:16"></i>
    `
  },
  {
    // Alpaca: standing, facing front, a long neck, a fluffy cloud of hair on top, tall ears and a round muzzle.
    id: 'alpaca', group: 'animals',
    name: 'Alpaca',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:150"></i>
      <i class="r" style="--cx:164;--cy:350;--w:42;--h:84;--k:21"></i>
      <i class="r" style="--cx:236;--cy:350;--w:42;--h:84;--k:21"></i>
      <i class="r" style="--cx:200;--cy:290;--w:230;--h:140;--r:50% 50% 44% 44% / 60% 60% 40% 40%"></i>
      <i class="r" style="--cx:200;--cy:210;--w:88;--h:150;--k:44"></i>
      <i class="r" style="--cx:146;--cy:72;--w:34;--h:78;--rot:-16deg"></i>
      <i class="r" style="--cx:254;--cy:72;--w:34;--h:78;--rot:16deg"></i>
      <i class="r" style="--cx:200;--cy:150;--w:156;--h:132"></i>
      <i class="r" style="--cx:200;--cy:92;--w:146;--h:68;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:200;--cy:174;--w:82;--h:50"></i>
      <i class="d" style="--cx:200;--cy:163;--w:24;--h:15;--r:50% 50% 50% 50% / 35% 35% 65% 65%"></i>
      <i class="ln" style="--cx:200;--cy:174;--w:28;--h:16"></i>
      <i class="d" style="--cx:170;--cy:140;--w:24;--h:28"></i>
      <i class="d w" style="--cx:174;--cy:133;--w:8;--h:8"></i>
      <i class="d" style="--cx:230;--cy:140;--w:24;--h:28"></i>
      <i class="d w" style="--cx:234;--cy:133;--w:8;--h:8"></i>
      <i class="r" style="--cx:144;--cy:170;--w:24;--h:16"></i>
      <i class="r" style="--cx:256;--cy:170;--w:24;--h:16"></i>
    `
  },
  {
    // Peacock: facing front, its big tail fanned out behind it with six feather "eyes", a little crest on its head.
    id: 'peacock', group: 'animals',
    name: 'Peacock',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:238;--w:384;--h:300"></i>
      <i class="r" style="--cx:53;--cy:207;--w:48;--h:66;--rot:-78deg"></i>
      <i class="d" style="--cx:53;--cy:207;--w:20;--h:26;--rot:-78deg"></i>
      <i class="r" style="--cx:85;--cy:156;--w:48;--h:66;--rot:-50deg"></i>
      <i class="d" style="--cx:85;--cy:156;--w:20;--h:26;--rot:-50deg"></i>
      <i class="r" style="--cx:141;--cy:123;--w:48;--h:66;--rot:-23deg"></i>
      <i class="d" style="--cx:141;--cy:123;--w:20;--h:26;--rot:-23deg"></i>
      <i class="r" style="--cx:259;--cy:123;--w:48;--h:66;--rot:23deg"></i>
      <i class="d" style="--cx:259;--cy:123;--w:20;--h:26;--rot:23deg"></i>
      <i class="r" style="--cx:315;--cy:156;--w:48;--h:66;--rot:50deg"></i>
      <i class="d" style="--cx:315;--cy:156;--w:20;--h:26;--rot:50deg"></i>
      <i class="r" style="--cx:347;--cy:207;--w:48;--h:66;--rot:78deg"></i>
      <i class="d" style="--cx:347;--cy:207;--w:20;--h:26;--rot:78deg"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:150"></i>
      <i class="d" style="--cx:182;--cy:108;--w:5;--h:40;--rot:-24deg"></i>
      <i class="d" style="--cx:200;--cy:104;--w:5;--h:40"></i>
      <i class="d" style="--cx:218;--cy:108;--w:5;--h:40;--rot:24deg"></i>
      <i class="r" style="--cx:172;--cy:86;--w:22;--h:22"></i>
      <i class="r" style="--cx:200;--cy:80;--w:22;--h:22"></i>
      <i class="r" style="--cx:228;--cy:86;--w:22;--h:22"></i>
      <i class="r" style="--cx:178;--cy:364;--w:46;--h:24"></i>
      <i class="r" style="--cx:222;--cy:364;--w:46;--h:24"></i>
      <i class="r" style="--cx:200;--cy:276;--w:120;--h:166;--r:50% 50% 50% 50% / 40% 40% 60% 60%"></i>
      <i class="r" style="--cx:200;--cy:166;--w:104;--h:96"></i>
      <i class="r" style="--cx:200;--cy:194;--w:30;--h:24;--r:50% 50% 50% 50% / 30% 30% 70% 70%"></i>
      <i class="d" style="--cx:180;--cy:160;--w:20;--h:24"></i>
      <i class="d w" style="--cx:184;--cy:154;--w:7;--h:7"></i>
      <i class="d" style="--cx:220;--cy:160;--w:20;--h:24"></i>
      <i class="d w" style="--cx:224;--cy:154;--w:7;--h:7"></i>
      <i class="r" style="--cx:164;--cy:188;--w:24;--h:16"></i>
      <i class="r" style="--cx:236;--cy:188;--w:24;--h:16"></i>
    `
  },
  {
    // Turkey: facing front, a fan of five big tail feathers behind its round body, a little beak and a wobbly wattle.
    id: 'turkey', group: 'animals',
    name: 'Turkey',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:150"></i>
      <i class="r" style="--cx:108;--cy:220;--w:74;--h:168;--rot:-72deg"></i>
      <i class="r" style="--cx:292;--cy:220;--w:74;--h:168;--rot:72deg"></i>
      <i class="r" style="--cx:135;--cy:161;--w:76;--h:180;--rot:-36deg"></i>
      <i class="r" style="--cx:265;--cy:161;--w:76;--h:180;--rot:36deg"></i>
      <i class="r" style="--cx:200;--cy:140;--w:76;--h:180"></i>
      <i class="r" style="--cx:174;--cy:356;--w:26;--h:48;--k:13"></i>
      <i class="r" style="--cx:226;--cy:356;--w:26;--h:48;--k:13"></i>
      <i class="r" style="--cx:166;--cy:380;--w:66;--h:30"></i>
      <i class="r" style="--cx:234;--cy:380;--w:66;--h:30"></i>
      <i class="r" style="--cx:200;--cy:264;--w:190;--h:180"></i>
      <i class="r" style="--cx:200;--cy:290;--w:116;--h:106"></i>
      <i class="r" style="--cx:200;--cy:160;--w:146;--h:136"></i>
      <i class="r" style="--cx:218;--cy:210;--w:26;--h:50"></i>
      <i class="r" style="--cx:200;--cy:184;--w:36;--h:36;--k:9;--rot:45deg"></i>
      <i class="d" style="--cx:172;--cy:144;--w:24;--h:28"></i>
      <i class="d w" style="--cx:177;--cy:137;--w:9;--h:9"></i>
      <i class="d" style="--cx:228;--cy:144;--w:24;--h:28"></i>
      <i class="d w" style="--cx:233;--cy:137;--w:9;--h:9"></i>
      <i class="r" style="--cx:150;--cy:182;--w:26;--h:16"></i>
      <i class="r" style="--cx:250;--cy:182;--w:26;--h:16"></i>
    `
  },
  {
    // Goat: facing front, two curved horns, floppy ears out to the sides, a long face with a muzzle and a little beard.
    id: 'goat', group: 'animals',
    name: 'Goat',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:150"></i>
      <i class="r" style="--cx:200;--cy:300;--w:230;--h:150"></i>
      <i class="r" style="--cx:160;--cy:344;--w:44;--h:70;--k:18"></i>
      <i class="r" style="--cx:240;--cy:344;--w:44;--h:70;--k:18"></i>
      <i class="r" style="--cx:160;--cy:378;--w:54;--h:30;--k:10"></i>
      <i class="r" style="--cx:240;--cy:378;--w:54;--h:30;--k:10"></i>
      <i class="r" style="--cx:162;--cy:80;--w:30;--h:96;--k:15;--rot:-18deg"></i>
      <i class="r" style="--cx:238;--cy:80;--w:30;--h:96;--k:15;--rot:18deg"></i>
      <i class="r" style="--cx:106;--cy:152;--w:86;--h:36;--rot:18deg"></i>
      <i class="r" style="--cx:294;--cy:152;--w:86;--h:36;--rot:-18deg"></i>
      <i class="r" style="--cx:200;--cy:286;--w:46;--h:64;--r:50% 50% 50% 50% / 30% 30% 70% 70%"></i>
      <i class="r" style="--cx:200;--cy:166;--w:170;--h:176"></i>
      <i class="r" style="--cx:200;--cy:228;--w:116;--h:76"></i>
      <i class="d" style="--cx:184;--cy:214;--w:12;--h:16"></i>
      <i class="d" style="--cx:216;--cy:214;--w:12;--h:16"></i>
      <i class="ln" style="--cx:200;--cy:234;--w:40;--h:22"></i>
      <i class="d" style="--cx:164;--cy:146;--w:26;--h:30"></i>
      <i class="d w" style="--cx:169;--cy:139;--w:9;--h:9"></i>
      <i class="d" style="--cx:236;--cy:146;--w:26;--h:30"></i>
      <i class="d w" style="--cx:241;--cy:139;--w:9;--h:9"></i>
      <i class="r" style="--cx:136;--cy:192;--w:26;--h:16"></i>
      <i class="r" style="--cx:264;--cy:192;--w:26;--h:16"></i>
    `
  },
  {
    // Beaver: sitting up, a big flat tail behind it, round ears, puffy cheeks and two big front teeth.
    id: 'beaver', group: 'animals',
    name: 'Beaver',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:150"></i>
      <i class="r" style="--cx:300;--cy:296;--w:110;--h:190;--rot:35deg"></i>
      <i class="r" style="--cx:200;--cy:292;--w:200;--h:190"></i>
      <i class="r" style="--cx:200;--cy:306;--w:124;--h:130"></i>
      <i class="r" style="--cx:148;--cy:378;--w:66;--h:30"></i>
      <i class="r" style="--cx:252;--cy:378;--w:66;--h:30"></i>
      <i class="r" style="--cx:126;--cy:292;--w:40;--h:68;--rot:24deg"></i>
      <i class="r" style="--cx:274;--cy:292;--w:40;--h:68;--rot:-24deg"></i>
      <i class="r" style="--cx:124;--cy:100;--w:46;--h:46"></i>
      <i class="r" style="--cx:276;--cy:100;--w:46;--h:46"></i>
      <i class="r" style="--cx:200;--cy:168;--w:230;--h:176"></i>
      <i class="r" style="--cx:200;--cy:254;--w:48;--h:42;--k:10"></i>
      <i class="d" style="--cx:200;--cy:262;--w:5;--h:24;--r:2px"></i>
      <i class="r" style="--cx:178;--cy:214;--w:62;--h:50"></i>
      <i class="r" style="--cx:222;--cy:214;--w:62;--h:50"></i>
      <i class="d" style="--cx:200;--cy:194;--w:36;--h:24;--r:50% 50% 50% 50% / 35% 35% 65% 65%"></i>
      <i class="d" style="--cx:160;--cy:146;--w:26;--h:30"></i>
      <i class="d w" style="--cx:165;--cy:139;--w:9;--h:9"></i>
      <i class="d" style="--cx:240;--cy:146;--w:26;--h:30"></i>
      <i class="d w" style="--cx:245;--cy:139;--w:9;--h:9"></i>
      <i class="r" style="--cx:122;--cy:200;--w:28;--h:18"></i>
      <i class="r" style="--cx:278;--cy:200;--w:28;--h:18"></i>
    `
  },
  {
    // Rhino: facing front, one big horn on its nose, a wide snout with a smile, little ears on top.
    id: 'rhino', group: 'animals',
    name: 'Rhino',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:150"></i>
      <i class="r" style="--cx:200;--cy:308;--w:270;--h:160"></i>
      <i class="r" style="--cx:148;--cy:350;--w:56;--h:70;--k:22"></i>
      <i class="r" style="--cx:252;--cy:350;--w:56;--h:70;--k:22"></i>
      <i class="r" style="--cx:120;--cy:94;--w:46;--h:72;--rot:-24deg"></i>
      <i class="r" style="--cx:280;--cy:94;--w:46;--h:72;--rot:24deg"></i>
      <i class="r" style="--cx:200;--cy:160;--w:214;--h:170"></i>
      <i class="r" style="--cx:200;--cy:176;--w:56;--h:104;--r:50% 50% 50% 50% / 100% 100% 0% 0%"></i>
      <i class="r" style="--cx:200;--cy:242;--w:172;--h:108"></i>
      <i class="d" style="--cx:174;--cy:236;--w:14;--h:18"></i>
      <i class="d" style="--cx:226;--cy:236;--w:14;--h:18"></i>
      <i class="ln" style="--cx:200;--cy:256;--w:46;--h:22"></i>
      <i class="d" style="--cx:148;--cy:138;--w:26;--h:30"></i>
      <i class="d w" style="--cx:153;--cy:131;--w:9;--h:9"></i>
      <i class="d" style="--cx:252;--cy:138;--w:26;--h:30"></i>
      <i class="d w" style="--cx:257;--cy:131;--w:9;--h:9"></i>
      <i class="r" style="--cx:124;--cy:186;--w:26;--h:16"></i>
      <i class="r" style="--cx:276;--cy:186;--w:26;--h:16"></i>
    `
    },
  {
    // Guinea pig: a round, chubby loaf facing front, droopy little ears, puffy cheeks and a color patch on its head and side.
    id: 'guineapig', group: 'animals',
    name: 'Guinea Pig',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:150"></i>
      <i class="r" style="--cx:146;--cy:364;--w:58;--h:30"></i>
      <i class="r" style="--cx:254;--cy:364;--w:58;--h:30"></i>
      <i class="r" style="--cx:200;--cy:285;--w:320;--h:170"></i>
      <i class="r" style="--cx:306;--cy:300;--w:76;--h:66"></i>
      <i class="r" style="--cx:98;--cy:128;--w:64;--h:46;--rot:-28deg"></i>
      <i class="r" style="--cx:302;--cy:128;--w:64;--h:46;--rot:28deg"></i>
      <i class="r" style="--cx:200;--cy:190;--w:236;--h:186"></i>
      <i class="r" style="--cx:252;--cy:128;--w:72;--h:48;--rot:-12deg"></i>
      <i class="r" style="--cx:180;--cy:234;--w:46;--h:34"></i>
      <i class="r" style="--cx:220;--cy:234;--w:46;--h:34"></i>
      <i class="d" style="--cx:200;--cy:218;--w:20;--h:14;--r:50% 50% 50% 50% / 35% 35% 65% 65%"></i>
      <i class="d" style="--cx:156;--cy:180;--w:26;--h:30"></i>
      <i class="d w" style="--cx:161;--cy:173;--w:9;--h:9"></i>
      <i class="d" style="--cx:244;--cy:180;--w:26;--h:30"></i>
      <i class="d w" style="--cx:249;--cy:173;--w:9;--h:9"></i>
      <i class="r" style="--cx:124;--cy:214;--w:28;--h:18"></i>
      <i class="r" style="--cx:276;--cy:214;--w:28;--h:18"></i>
    `
  },
  {
    // Skunk: sitting up facing front, a big bushy tail with a stripe curling up behind it, and a stripe on its forehead.
    id: 'skunk', group: 'animals',
    name: 'Skunk',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:150"></i>
      <i class="r" style="--cx:284;--cy:190;--w:156;--h:266;--rot:16deg"></i>
      <i class="r" style="--cx:290;--cy:180;--w:52;--h:196;--rot:16deg"></i>
      <i class="r" style="--cx:146;--cy:364;--w:56;--h:30"></i>
      <i class="r" style="--cx:226;--cy:364;--w:56;--h:30"></i>
      <i class="r" style="--cx:186;--cy:300;--w:200;--h:150"></i>
      <i class="r" style="--cx:186;--cy:318;--w:110;--h:90"></i>
      <i class="r" style="--cx:112;--cy:118;--w:50;--h:50"></i>
      <i class="r" style="--cx:260;--cy:118;--w:50;--h:50"></i>
      <i class="r" style="--cx:186;--cy:190;--w:206;--h:172"></i>
      <i class="r" style="--cx:186;--cy:146;--w:30;--h:72"></i>
      <i class="r" style="--cx:186;--cy:232;--w:84;--h:54"></i>
      <i class="d" style="--cx:186;--cy:218;--w:20;--h:14;--r:50% 50% 50% 50% / 35% 35% 65% 65%"></i>
      <i class="ln" style="--cx:186;--cy:232;--w:30;--h:16"></i>
      <i class="d" style="--cx:146;--cy:180;--w:26;--h:30"></i>
      <i class="d w" style="--cx:151;--cy:173;--w:9;--h:9"></i>
      <i class="d" style="--cx:226;--cy:180;--w:26;--h:30"></i>
      <i class="d w" style="--cx:231;--cy:173;--w:9;--h:9"></i>
      <i class="r" style="--cx:114;--cy:214;--w:28;--h:18"></i>
      <i class="r" style="--cx:258;--cy:214;--w:28;--h:18"></i>
    `
  },
  {
    // Camel: one big hump, long legs and a long neck up to a round, smiley head that looks at you.
    id: 'camel', group: 'animals',
    name: 'Camel',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:150"></i>
      <i class="r" style="--cx:372;--cy:252;--w:24;--h:74;--rot:-18deg"></i>
      <i class="r" style="--cx:150;--cy:320;--w:44;--h:128;--k:20"></i>
      <i class="r" style="--cx:206;--cy:320;--w:44;--h:128;--k:20"></i>
      <i class="r" style="--cx:274;--cy:320;--w:44;--h:128;--k:20"></i>
      <i class="r" style="--cx:330;--cy:320;--w:44;--h:128;--k:20"></i>
      <i class="r" style="--cx:246;--cy:168;--w:170;--h:140"></i>
      <i class="r" style="--cx:240;--cy:240;--w:270;--h:130"></i>
      <i class="r" style="--cx:118;--cy:196;--w:66;--h:160;--k:30;--rot:12deg"></i>
      <i class="r" style="--cx:48;--cy:62;--w:40;--h:46;--rot:-28deg"></i>
      <i class="r" style="--cx:172;--cy:62;--w:40;--h:46;--rot:28deg"></i>
      <i class="r" style="--cx:110;--cy:112;--w:156;--h:130"></i>
      <i class="r" style="--cx:110;--cy:150;--w:104;--h:62"></i>
      <i class="d" style="--cx:92;--cy:144;--w:12;--h:14"></i>
      <i class="d" style="--cx:128;--cy:144;--w:12;--h:14"></i>
      <i class="ln" style="--cx:110;--cy:158;--w:36;--h:16"></i>
      <i class="d" style="--cx:80;--cy:98;--w:26;--h:30"></i>
      <i class="d w" style="--cx:85;--cy:91;--w:9;--h:9"></i>
      <i class="d" style="--cx:140;--cy:98;--w:26;--h:30"></i>
      <i class="d w" style="--cx:145;--cy:91;--w:9;--h:9"></i>
      <i class="r" style="--cx:52;--cy:128;--w:26;--h:16"></i>
      <i class="r" style="--cx:168;--cy:128;--w:26;--h:16"></i>
    `
  },
  {
    // Starfish: one chunky star with rounded arms (one SVG path, like the banana), a dot on each arm and a happy face.
    id: 'starfish', group: 'animals',
    name: 'Starfish',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:460;--w:760;--h:150"></i>
      <i class="r p" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"><svg viewBox="0 0 400 400"><path d="M173 82 Q200 23 227 82 Q254 141 318 148 Q383 156 335 200 Q287 243 300 307 Q313 370 256 339 Q200 307 144 339 Q87 370 100 307 Q113 243 65 200 Q17 156 82 148 Q146 141 173 82 Z"/></svg></i>
      <i class="r" style="--cx:200;--cy:98;--w:30;--h:30"></i>
      <i class="r" style="--cx:308;--cy:180;--w:30;--h:30"></i>
      <i class="r" style="--cx:266;--cy:304;--w:30;--h:30"></i>
      <i class="r" style="--cx:134;--cy:304;--w:30;--h:30"></i>
      <i class="r" style="--cx:92;--cy:180;--w:30;--h:30"></i>
      <i class="d" style="--cx:176;--cy:200;--w:26;--h:30"></i>
      <i class="d w" style="--cx:181;--cy:193;--w:9;--h:9"></i>
      <i class="d" style="--cx:224;--cy:200;--w:26;--h:30"></i>
      <i class="d w" style="--cx:229;--cy:193;--w:9;--h:9"></i>
      <i class="ln" style="--cx:200;--cy:228;--w:44;--h:24"></i>
      <i class="r" style="--cx:154;--cy:234;--w:28;--h:18"></i>
      <i class="r" style="--cx:246;--cy:234;--w:28;--h:18"></i>
    `
  },
  {
    // Seahorse: side view facing left, a round head with a crown of bumps and a long snout, a belly patch,
    // a back fin and a curled tail (one SVG path for the body, a ring for the curl).
    id: 'seahorse', group: 'animals',
    name: 'Seahorse',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:470;--w:760;--h:150"></i>
      <i class="r" style="--cx:287;--cy:234;--w:74;--h:115;--r:100% 0 100% 0;--rot:30deg"></i>
      <i class="r p" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"><svg viewBox="0 0 400 400"><path d="M179 122 C106 170 103 269 161 310 C184 324 198 334 210 346 L260 334 C255 320 258 303 264 269 C274 223 274 177 260 131 Z"/></svg></i>
      <i class="r" style="--cx:161;--cy:232;--w:67;--h:133;--rot:8deg"></i>
      <i class="r" style="--cx:250;--cy:350;--w:84;--h:78"></i>
      <i class="r" style="--cx:250;--cy:350;--w:30;--h:28"></i>
      <i class="r" style="--cx:186;--cy:36;--w:39;--h:39"></i>
      <i class="r" style="--cx:222;--cy:24;--w:39;--h:39"></i>
      <i class="r" style="--cx:256;--cy:40;--w:39;--h:39"></i>
      <i class="r" style="--cx:126;--cy:108;--w:110;--h:51;--k:23;--rot:12deg"></i>
      <i class="r" style="--cx:216;--cy:96;--w:145;--h:133"></i>
      <i class="d" style="--cx:216;--cy:82;--w:32;--h:37"></i>
      <i class="d w" style="--cx:222;--cy:74;--w:12;--h:12"></i>
      <i class="r" style="--cx:230;--cy:128;--w:32;--h:21"></i>
      <i class="ln" style="--cx:166;--cy:122;--w:34;--h:16"></i>
    `
  },
  {
    // Puffin: standing facing front, a round body with a white belly, a big white face and a big striped beak, orange feet.
    id: 'puffin', group: 'animals',
    name: 'Puffin',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:460;--w:760;--h:150"></i>
      <i class="r" style="--cx:160;--cy:372;--w:74;--h:32"></i>
      <i class="r" style="--cx:240;--cy:372;--w:74;--h:32"></i>
      <i class="r" style="--cx:200;--cy:272;--w:224;--h:200"></i>
      <i class="r" style="--cx:200;--cy:292;--w:140;--h:150"></i>
      <i class="r" style="--cx:100;--cy:270;--w:58;--h:132;--rot:14deg"></i>
      <i class="r" style="--cx:300;--cy:270;--w:58;--h:132;--rot:-14deg"></i>
      <i class="r" style="--cx:200;--cy:148;--w:196;--h:172"></i>
      <i class="r" style="--cx:200;--cy:160;--w:150;--h:118"></i>
      <i class="d" style="--cx:162;--cy:140;--w:26;--h:30"></i>
      <i class="d w" style="--cx:167;--cy:133;--w:9;--h:9"></i>
      <i class="d" style="--cx:238;--cy:140;--w:26;--h:30"></i>
      <i class="d w" style="--cx:243;--cy:133;--w:9;--h:9"></i>
      <i class="r" style="--cx:200;--cy:204;--w:74;--h:74;--r:12% 46% 46% 46%;--rot:225deg"></i>
      <i class="r" style="--cx:200;--cy:178;--w:66;--h:26"></i>
      <i class="r" style="--cx:138;--cy:180;--w:28;--h:18"></i>
      <i class="r" style="--cx:262;--cy:180;--w:28;--h:18"></i>
    `
  },
  {
    // Moose: facing front, two big flat antlers with round bumps, floppy ears, a big soft nose and a smile.
    id: 'moose', group: 'animals',
    name: 'Moose',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:460;--w:760;--h:150"></i>
      <i class="r" style="--cx:200;--cy:360;--w:300;--h:150"></i>
      <i class="r" style="--cx:42;--cy:66;--w:42;--h:42"></i>
      <i class="r" style="--cx:82;--cy:48;--w:42;--h:42"></i>
      <i class="r" style="--cx:124;--cy:52;--w:42;--h:42"></i>
      <i class="r" style="--cx:92;--cy:92;--w:140;--h:76;--rot:-10deg"></i>
      <i class="r" style="--cx:358;--cy:66;--w:42;--h:42"></i>
      <i class="r" style="--cx:318;--cy:48;--w:42;--h:42"></i>
      <i class="r" style="--cx:276;--cy:52;--w:42;--h:42"></i>
      <i class="r" style="--cx:308;--cy:92;--w:140;--h:76;--rot:10deg"></i>
      <i class="r" style="--cx:112;--cy:156;--w:76;--h:38;--r:100% 0 100% 0;--rot:-10deg"></i>
      <i class="r" style="--cx:288;--cy:156;--w:76;--h:38;--r:0 100% 0 100%;--rot:10deg"></i>
      <i class="r" style="--cx:200;--cy:168;--w:164;--h:170"></i>
      <i class="r" style="--cx:200;--cy:250;--w:156;--h:112"></i>
      <i class="d" style="--cx:174;--cy:246;--w:16;--h:20"></i>
      <i class="d" style="--cx:226;--cy:246;--w:16;--h:20"></i>
      <i class="ln" style="--cx:200;--cy:272;--w:52;--h:22"></i>
      <i class="d" style="--cx:168;--cy:154;--w:26;--h:30"></i>
      <i class="d w" style="--cx:173;--cy:147;--w:9;--h:9"></i>
      <i class="d" style="--cx:232;--cy:154;--w:26;--h:30"></i>
      <i class="d w" style="--cx:237;--cy:147;--w:9;--h:9"></i>
      <i class="r" style="--cx:140;--cy:196;--w:28;--h:18"></i>
      <i class="r" style="--cx:260;--cy:196;--w:28;--h:18"></i>
    `
  },
  {
    // Bat: a friendly little bat flying toward you, wings spread wide (one SVG path each), big ears, a belly patch and a smile.
    id: 'bat', group: 'animals',
    name: 'Bat',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:350;--w:150;--h:56;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r p" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"><svg viewBox="0 0 400 400"><path d="M170 190 Q110 92 24 116 Q46 180 36 246 Q70 222 94 256 Q118 226 152 262 Z"/></svg></i>
      <i class="r p" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"><svg viewBox="0 0 400 400"><path d="M230 190 Q290 92 376 116 Q354 180 364 246 Q330 222 306 256 Q282 226 248 262 Z"/></svg></i>
      <i class="r" style="--cx:174;--cy:332;--w:34;--h:26"></i>
      <i class="r" style="--cx:226;--cy:332;--w:34;--h:26"></i>
      <i class="r" style="--cx:200;--cy:252;--w:140;--h:136"></i>
      <i class="r" style="--cx:200;--cy:268;--w:84;--h:84"></i>
      <i class="r" style="--cx:146;--cy:92;--w:66;--h:66;--r:12% 46% 46% 46%;--rot:30deg"></i>
      <i class="r" style="--cx:254;--cy:92;--w:66;--h:66;--r:12% 46% 46% 46%;--rot:60deg"></i>
      <i class="r" style="--cx:200;--cy:164;--w:172;--h:148"></i>
      <i class="d" style="--cx:166;--cy:154;--w:26;--h:30"></i>
      <i class="d w" style="--cx:171;--cy:147;--w:9;--h:9"></i>
      <i class="d" style="--cx:234;--cy:154;--w:26;--h:30"></i>
      <i class="d w" style="--cx:239;--cy:147;--w:9;--h:9"></i>
      <i class="ln" style="--cx:200;--cy:186;--w:40;--h:20"></i>
      <i class="r" style="--cx:142;--cy:190;--w:28;--h:18"></i>
      <i class="r" style="--cx:258;--cy:190;--w:28;--h:18"></i>
    `
  }
);
