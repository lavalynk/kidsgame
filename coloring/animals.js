// The coloring book's ANIMALS tab. (fruit.js and things.js hold the other two tabs.)
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
    id: 'cat', group: 'animals',
    name: 'Cat',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:236"></i>
      <i class="d" style="--cx:55;--cy:302;--w:48;--h:8;--k:4;--rot:90deg"></i>
      <i class="r" style="--cx:55;--cy:258;--w:26;--h:26"></i>
      <i class="r" style="--cx:55;--cy:294;--w:26;--h:26"></i>
      <i class="r" style="--cx:37;--cy:276;--w:26;--h:26"></i>
      <i class="r" style="--cx:73;--cy:276;--w:26;--h:26"></i>
      <i class="r" style="--cx:55;--cy:276;--w:22;--h:22"></i>
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
      <i class="r" style="--cx:108;--cy:86;--w:104;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:190"></i>
      <i class="r" style="--cx:332;--cy:322;--w:62;--h:42;--r:100% 0 100% 0"></i>
      <i class="r" style="--cx:44;--cy:326;--w:62;--h:40;--r:0 100% 0 100%"></i>
      <i class="d" style="--cx:179;--cy:317;--w:42;--h:8;--k:4;--rot:95deg"></i>
      <i class="d" style="--cx:222;--cy:317;--w:42;--h:8;--k:4;--rot:85deg"></i>
      <i class="d" style="--cx:177;--cy:336;--w:34;--h:8;--k:4"></i>
      <i class="d" style="--cx:223;--cy:336;--w:34;--h:8;--k:4"></i>
      <i class="r" style="--cx:66;--cy:224;--w:82;--h:32;--rot:28deg"></i>
      <i class="r" style="--cx:72;--cy:262;--w:74;--h:30;--rot:-14deg"></i>
      <i class="r" style="--cx:190;--cy:240;--w:200;--h:148"></i>
      <i class="r" style="--cx:252;--cy:96;--w:26;--h:44;--rot:-16deg"></i>
      <i class="r" style="--cx:276;--cy:96;--w:26;--h:44;--rot:16deg"></i>
      <i class="r" style="--cx:264;--cy:160;--w:124;--h:124"></i>
      <i class="r" style="--cx:178;--cy:232;--w:128;--h:74;--r:50% 50% 50% 50% / 60% 60% 40% 40%;--rot:8deg"></i>
      <i class="ln up" style="--cx:181;--cy:240;--w:66;--h:26;--rot:5deg"></i>
      <i class="r" style="--cx:338;--cy:165;--w:54;--h:36;--r:10% 60% 60% 10% / 50% 50% 50% 50%"></i>
      <i class="d" style="--cx:336;--cy:165;--w:40;--h:8;--k:4"></i>
      <i class="r" style="--cx:290;--cy:186;--w:26;--h:16"></i>
      <i class="d" style="--cx:282;--cy:150;--w:24;--h:24"></i>
      <i class="d w" style="--cx:286;--cy:145;--w:8;--h:8"></i>
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
      <i class="r" style="--cx:200;--cy:272;--w:132;--h:26;--k:13"></i>
      <i class="r" style="--cx:200;--cy:165;--w:164;--h:164"></i>
      <i class="r" style="--cx:232;--cy:146;--w:60;--h:52"></i>
      <i class="r" style="--cx:117;--cy:168;--w:54;--h:132;--r:50% 50% 50% 50% / 30% 30% 70% 70%;--rot:12deg"></i>
      <i class="r" style="--cx:283;--cy:168;--w:54;--h:132;--r:50% 50% 50% 50% / 30% 30% 70% 70%;--rot:-12deg"></i>
      <i class="r" style="--cx:200;--cy:200;--w:88;--h:64"></i>
      <i class="r" style="--cx:152;--cy:198;--w:28;--h:18"></i>
      <i class="r" style="--cx:248;--cy:198;--w:28;--h:18"></i>
      <i class="r" style="--cx:200;--cy:230;--w:26;--h:34;--r:20% 20% 50% 50%"></i>
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
      <i class="r" style="--cx:364;--cy:250;--w:22;--h:40;--rot:-14deg"></i>
      <i class="r" style="--cx:380;--cy:258;--w:22;--h:40;--rot:40deg"></i>
      <i class="r" style="--cx:346;--cy:312;--w:34;--h:104;--r:50% 50% 50% 50% / 25% 25% 75% 75%;--rot:28deg"></i>
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
      <i class="r" style="--cx:173;--cy:277;--w:290;--h:28;--k:14"></i>
    `
  },
  {
    id: 'lion', group: 'animals',
    name: 'Lion',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:198"></i>
      <i class="ln" style="--cx:306;--cy:282;--w:91;--h:65;--rot:-49deg"></i>
      <i class="r" style="--cx:334;--cy:236;--w:42;--h:42"></i>
      <i class="r" style="--cx:200;--cy:292;--w:168;--h:128"></i>
      <i class="r" style="--cx:200;--cy:302;--w:88;--h:80"></i>
      <i class="r" style="--cx:152;--cy:350;--w:68;--h:36"></i>
      <i class="r" style="--cx:248;--cy:350;--w:68;--h:36"></i>
      <i class="r" style="--cx:299;--cy:197;--w:58;--h:58"></i>
      <i class="r" style="--cx:261;--cy:249;--w:58;--h:58"></i>
      <i class="r" style="--cx:200;--cy:269;--w:58;--h:58"></i>
      <i class="r" style="--cx:139;--cy:249;--w:58;--h:58"></i>
      <i class="r" style="--cx:101;--cy:197;--w:58;--h:58"></i>
      <i class="r" style="--cx:101;--cy:133;--w:58;--h:58"></i>
      <i class="r" style="--cx:139;--cy:81;--w:58;--h:58"></i>
      <i class="r" style="--cx:200;--cy:61;--w:58;--h:58"></i>
      <i class="r" style="--cx:261;--cy:81;--w:58;--h:58"></i>
      <i class="r" style="--cx:299;--cy:133;--w:58;--h:58"></i>
      <i class="r" style="--cx:200;--cy:165;--w:216;--h:216"></i>
      <i class="r" style="--cx:146;--cy:112;--w:44;--h:44"></i>
      <i class="r" style="--cx:254;--cy:112;--w:44;--h:44"></i>
      <i class="r" style="--cx:200;--cy:168;--w:144;--h:144"></i>
      <i class="r" style="--cx:152;--cy:192;--w:28;--h:18"></i>
      <i class="r" style="--cx:248;--cy:192;--w:28;--h:18"></i>
      <i class="r" style="--cx:182;--cy:202;--w:44;--h:34"></i>
      <i class="r" style="--cx:218;--cy:202;--w:44;--h:34"></i>
      <i class="d" style="--cx:200;--cy:184;--w:30;--h:18;--r:50% 50% 50% 50% / 35% 35% 65% 65%"></i>
      <i class="d" style="--cx:174;--cy:150;--w:24;--h:24"></i>
      <i class="d w" style="--cx:178;--cy:145;--w:8;--h:8"></i>
      <i class="d" style="--cx:226;--cy:150;--w:24;--h:24"></i>
      <i class="d w" style="--cx:230;--cy:145;--w:8;--h:8"></i>
      <i class="ln" style="--cx:200;--cy:220;--w:28;--h:18"></i>
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
      <i class="r" style="--cx:340;--cy:68;--w:96;--h:48;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:220"></i>
      <i class="r" style="--cx:162;--cy:307;--w:28;--h:74;--k:10"></i>
      <i class="r" style="--cx:202;--cy:307;--w:28;--h:74;--k:10"></i>
      <i class="r" style="--cx:270;--cy:307;--w:28;--h:74;--k:10"></i>
      <i class="r" style="--cx:310;--cy:307;--w:28;--h:74;--k:10"></i>
      <i class="r" style="--cx:162;--cy:344;--w:36;--h:20;--k:8"></i>
      <i class="r" style="--cx:202;--cy:344;--w:36;--h:20;--k:8"></i>
      <i class="r" style="--cx:270;--cy:344;--w:36;--h:20;--k:8"></i>
      <i class="r" style="--cx:310;--cy:344;--w:36;--h:20;--k:8"></i>
      <i class="ln up" style="--cx:337;--cy:273;--w:55;--h:26;--rot:66deg"></i>
      <i class="r" style="--cx:348;--cy:306;--w:22;--h:30"></i>
      <i class="r" style="--cx:158;--cy:196;--w:58;--h:142;--k:22;--rot:-8deg"></i>
      <i class="r" style="--cx:154;--cy:194;--w:28;--h:28"></i>
      <i class="r" style="--cx:236;--cy:256;--w:208;--h:104"></i>
      <i class="r" style="--cx:262;--cy:246;--w:40;--h:40"></i>
      <i class="r" style="--cx:308;--cy:262;--w:30;--h:30"></i>
      <i class="r" style="--cx:214;--cy:276;--w:32;--h:32"></i>
      <i class="d" style="--cx:130;--cy:53;--w:34;--h:8;--k:4;--rot:-90deg"></i>
      <i class="d" style="--cx:170;--cy:53;--w:34;--h:8;--k:4;--rot:-90deg"></i>
      <i class="r" style="--cx:130;--cy:36;--w:22;--h:22"></i>
      <i class="r" style="--cx:170;--cy:36;--w:22;--h:22"></i>
      <i class="r" style="--cx:92;--cy:86;--w:56;--h:26;--rot:-20deg"></i>
      <i class="r" style="--cx:208;--cy:86;--w:56;--h:26;--rot:20deg"></i>
      <i class="r" style="--cx:150;--cy:100;--w:116;--h:96"></i>
      <i class="r" style="--cx:150;--cy:140;--w:88;--h:56"></i>
      <i class="d" style="--cx:136;--cy:136;--w:10;--h:10"></i>
      <i class="d" style="--cx:164;--cy:136;--w:10;--h:10"></i>
      <i class="ln" style="--cx:150;--cy:152;--w:28;--h:16"></i>
      <i class="d" style="--cx:128;--cy:92;--w:22;--h:22"></i>
      <i class="d w" style="--cx:131;--cy:88;--w:8;--h:8"></i>
      <i class="d" style="--cx:172;--cy:92;--w:22;--h:22"></i>
      <i class="d w" style="--cx:175;--cy:88;--w:8;--h:8"></i>
      <i class="r" style="--cx:113;--cy:116;--w:24;--h:16"></i>
      <i class="r" style="--cx:187;--cy:116;--w:24;--h:16"></i>
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
      <i class="ln up" style="--cx:161;--cy:90;--w:47;--h:29;--rot:43deg"></i>
      <i class="ln up" style="--cx:195;--cy:90;--w:47;--h:29;--rot:-43deg"></i>
      <i class="r" style="--cx:132;--cy:64;--w:28;--h:28"></i>
      <i class="r" style="--cx:178;--cy:46;--w:32;--h:32"></i>
      <i class="r" style="--cx:224;--cy:64;--w:28;--h:28"></i>
      <i class="r" style="--cx:326;--cy:188;--w:34;--h:92;--rot:16deg"></i>
      <i class="r" style="--cx:304;--cy:128;--w:76;--h:34;--rot:-30deg"></i>
      <i class="r" style="--cx:352;--cy:138;--w:72;--h:34;--rot:30deg"></i>
      <i class="r" style="--cx:185;--cy:206;--w:290;--h:196"></i>
      <i class="r" style="--cx:180;--cy:280;--w:228;--h:44"></i>
      <i class="r" style="--cx:210;--cy:262;--w:72;--h:34;--rot:25deg"></i>
      <i class="d" style="--cx:124;--cy:200;--w:28;--h:28"></i>
      <i class="d w" style="--cx:128;--cy:194;--w:10;--h:10"></i>
      <i class="r" style="--cx:100;--cy:234;--w:32;--h:20"></i>
      <i class="ln" style="--cx:80;--cy:245;--w:39;--h:19;--rot:21deg"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:252"></i>
    `
  }
);
