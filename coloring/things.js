// The coloring book's THINGS tab (things that go, houses and places; no faces).
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
    id: 'car', group: 'things',
    name: 'Car',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:110;--cy:80;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r flat" style="--cx:200;--cy:372;--w:420;--h:72;--r:0"></i>
      <i class="d" style="--cx:55;--cy:368;--w:58;--h:8;--k:4"></i>
      <i class="d" style="--cx:175;--cy:368;--w:58;--h:8;--k:4"></i>
      <i class="d" style="--cx:295;--cy:368;--w:58;--h:8;--k:4"></i>
      <i class="r" style="--cx:196;--cy:178;--w:204;--h:124;--r:48% 52% 6% 6% / 72% 72% 8% 8%"></i>
      <i class="r" style="--cx:152;--cy:182;--w:72;--h:62;--r:70% 14% 6% 6% / 80% 20% 8% 8%"></i>
      <i class="r" style="--cx:238;--cy:182;--w:70;--h:62;--r:14% 70% 6% 6% / 20% 80% 8% 8%"></i>
      <i class="r" style="--cx:200;--cy:258;--w:344;--h:108;--r:24% 28% 18% 18% / 42% 48% 30% 30%"></i>
      <i class="r" style="--cx:352;--cy:242;--w:28;--h:28"></i>
      <i class="r" style="--cx:46;--cy:240;--w:22;--h:32;--r:40%"></i>
      <i class="d" style="--cx:196;--cy:258;--w:8;--h:62;--k:4"></i>
      <i class="d" style="--cx:224;--cy:234;--w:26;--h:8;--k:4"></i>
      <i class="r" style="--cx:112;--cy:310;--w:88;--h:88"></i>
      <i class="r" style="--cx:112;--cy:310;--w:36;--h:36"></i>
      <i class="r" style="--cx:290;--cy:310;--w:88;--h:88"></i>
      <i class="r" style="--cx:290;--cy:310;--w:36;--h:36"></i>
    `
  },
  {
    id: 'airplane', group: 'things',
    name: 'Airplane',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:310;--cy:76;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:84;--cy:336;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:186;--cy:146;--w:60;--h:110;--rot:-24deg"></i>
      <i class="r" style="--cx:66;--cy:170;--w:52;--h:92;--k:18;--rot:-22deg"></i>
      <i class="r" style="--cx:200;--cy:206;--w:320;--h:104;--r:35% 65% 65% 35% / 50% 50% 50% 50%"></i>
      <i class="r" style="--cx:142;--cy:192;--w:34;--h:34"></i>
      <i class="r" style="--cx:194;--cy:192;--w:34;--h:34"></i>
      <i class="r" style="--cx:246;--cy:192;--w:34;--h:34"></i>
      <i class="r" style="--cx:316;--cy:196;--w:44;--h:34;--r:20% 80% 30% 20% / 50% 80% 20% 50%"></i>
      <i class="r" style="--cx:176;--cy:288;--w:72;--h:156;--rot:24deg"></i>
    `
  },
  {
    id: 'house', group: 'things',
    name: 'House',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:228"></i>
      <i class="r" style="--cx:271;--cy:120;--w:36;--h:70;--k:4"></i>
      <i class="r" style="--cx:200;--cy:196;--w:162;--h:162;--k:12;--rot:45deg"></i>
      <i class="r" style="--cx:200;--cy:265;--w:224;--h:150;--k:4"></i>
      <i class="r" style="--cx:200;--cy:150;--w:40;--h:40"></i>
      <i class="r" style="--cx:200;--cy:298;--w:54;--h:86;--r:50% 50% 0 0 / 40% 40% 0 0"></i>
      <i class="d" style="--cx:214;--cy:304;--w:10;--h:10"></i>
      <i class="r" style="--cx:133;--cy:245;--w:50;--h:46;--k:4"></i>
      <i class="r" style="--cx:267;--cy:245;--w:50;--h:46;--k:4"></i>
      <i class="d" style="--cx:133;--cy:245;--w:46;--h:8;--k:4;--rot:90deg"></i>
      <i class="d" style="--cx:133;--cy:245;--w:50;--h:8;--k:4"></i>
      <i class="d" style="--cx:267;--cy:245;--w:46;--h:8;--k:4;--rot:90deg"></i>
      <i class="d" style="--cx:267;--cy:245;--w:50;--h:8;--k:4"></i>
      <i class="r" style="--cx:346;--cy:322;--w:92;--h:56;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:56;--cy:326;--w:76;--h:48;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
    `
  },
  {
    id: 'boat', group: 'things',
    name: 'Sailboat',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:300;--cy:70;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="d" style="--cx:200;--cy:176;--w:204;--h:8;--k:4;--rot:-90deg"></i>
      <i class="r" style="--cx:226;--cy:88;--w:46;--h:30;--r:0 60% 60% 0 / 0 50% 50% 0"></i>
      <i class="r" style="--cx:262;--cy:182;--w:100;--h:150;--r:0 100% 0 0 / 0 100% 0 0"></i>
      <i class="r" style="--cx:144;--cy:188;--w:96;--h:138;--r:100% 0 0 0 / 100% 0 0 0"></i>
      <i class="r" style="--cx:200;--cy:290;--w:290;--h:76;--r:0 0 50% 50% / 0 0 100% 100%"></i>
      <i class="r" style="--cx:146;--cy:286;--w:26;--h:26"></i>
      <i class="r" style="--cx:200;--cy:286;--w:26;--h:26"></i>
      <i class="r" style="--cx:254;--cy:286;--w:26;--h:26"></i>
      <i class="r" style="--cx:200;--cy:450;--w:800;--h:280"></i>
    `
  },
  {
    id: 'train', group: 'things',
    name: 'Train',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:118;--cy:92;--w:46;--h:46"></i>
      <i class="r" style="--cx:160;--cy:50;--w:62;--h:62"></i>
      <i class="r flat" style="--cx:200;--cy:376;--w:420;--h:64;--r:0"></i>
      <i class="r" style="--cx:100;--cy:176;--w:44;--h:76;--k:6"></i>
      <i class="r" style="--cx:100;--cy:140;--w:68;--h:24;--k:10"></i>
      <i class="r" style="--cx:286;--cy:214;--w:120;--h:170;--k:12"></i>
      <i class="r" style="--cx:150;--cy:250;--w:200;--h:100;--k:34"></i>
      <i class="r" style="--cx:286;--cy:126;--w:150;--h:28;--k:12"></i>
      <i class="r" style="--cx:286;--cy:190;--w:64;--h:60;--k:10"></i>
      <i class="r" style="--cx:96;--cy:314;--w:84;--h:84"></i>
      <i class="r" style="--cx:190;--cy:314;--w:84;--h:84"></i>
      <i class="r" style="--cx:296;--cy:304;--w:104;--h:104"></i>
      <i class="r" style="--cx:96;--cy:314;--w:30;--h:30"></i>
      <i class="r" style="--cx:190;--cy:314;--w:30;--h:30"></i>
      <i class="r" style="--cx:296;--cy:304;--w:36;--h:36"></i>
    `
  },
  {
    id: 'bus', group: 'things',
    name: 'Bus',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r flat" style="--cx:200;--cy:372;--w:420;--h:72;--r:0"></i>
      <i class="d" style="--cx:55;--cy:362;--w:58;--h:8;--k:4;--rot:0deg"></i>
      <i class="d" style="--cx:175;--cy:362;--w:58;--h:8;--k:4;--rot:0deg"></i>
      <i class="d" style="--cx:295;--cy:362;--w:58;--h:8;--k:4;--rot:0deg"></i>
      <i class="r" style="--cx:94;--cy:68;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:202;--cy:210;--w:344;--h:180;--k:28"></i>
      <i class="r" style="--cx:155;--cy:244;--w:250;--h:24;--k:0"></i>
      <i class="r" style="--cx:82;--cy:175;--w:56;--h:62;--k:8"></i>
      <i class="r" style="--cx:154;--cy:175;--w:56;--h:62;--k:8"></i>
      <i class="r" style="--cx:226;--cy:175;--w:56;--h:62;--k:8"></i>
      <i class="r" style="--cx:321;--cy:211;--w:62;--h:134;--k:8"></i>
      <i class="d" style="--cx:321;--cy:211;--w:142;--h:8;--k:4;--rot:90deg"></i>
      <i class="r" style="--cx:362;--cy:270;--w:20;--h:28"></i>
      <i class="r" style="--cx:100;--cy:300;--w:80;--h:80"></i>
      <i class="r" style="--cx:100;--cy:300;--w:32;--h:32"></i>
      <i class="r" style="--cx:300;--cy:300;--w:80;--h:80"></i>
      <i class="r" style="--cx:300;--cy:300;--w:32;--h:32"></i>
    `
  },
  {
    id: 'firetruck', group: 'things',
    name: 'Fire Truck',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r flat" style="--cx:200;--cy:372;--w:420;--h:72;--r:0"></i>
      <i class="d" style="--cx:55;--cy:362;--w:58;--h:8;--k:4;--rot:0deg"></i>
      <i class="d" style="--cx:175;--cy:362;--w:58;--h:8;--k:4;--rot:0deg"></i>
      <i class="d" style="--cx:295;--cy:362;--w:58;--h:8;--k:4;--rot:0deg"></i>
      <i class="r" style="--cx:148;--cy:163;--w:216;--h:26;--k:8"></i>
      <i class="d" style="--cx:80;--cy:163;--w:34;--h:8;--k:4;--rot:90deg"></i>
      <i class="d" style="--cx:120;--cy:163;--w:34;--h:8;--k:4;--rot:90deg"></i>
      <i class="d" style="--cx:160;--cy:163;--w:34;--h:8;--k:4;--rot:90deg"></i>
      <i class="d" style="--cx:200;--cy:163;--w:34;--h:8;--k:4;--rot:90deg"></i>
      <i class="d" style="--cx:240;--cy:163;--w:34;--h:8;--k:4;--rot:90deg"></i>
      <i class="r" style="--cx:148;--cy:240;--w:236;--h:120;--k:12"></i>
      <i class="r" style="--cx:312;--cy:142;--w:34;--h:24;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:315;--cy:226;--w:110;--h:150;--r:12% 44% 8% 8% / 10% 30% 8% 8%"></i>
      <i class="r" style="--cx:315;--cy:192;--w:70;--h:48;--r:8% 50% 6% 6% / 10% 60% 6% 6%"></i>
      <i class="d" style="--cx:286;--cy:240;--w:28;--h:8;--k:4;--rot:0deg"></i>
      <i class="r" style="--cx:100;--cy:222;--w:60;--h:60"></i>
      <i class="r" style="--cx:100;--cy:222;--w:24;--h:24"></i>
      <i class="r" style="--cx:198;--cy:238;--w:76;--h:64;--k:8"></i>
      <i class="r" style="--cx:366;--cy:262;--w:20;--h:28;--k:6"></i>
      <i class="r" style="--cx:86;--cy:300;--w:76;--h:76"></i>
      <i class="r" style="--cx:86;--cy:300;--w:30;--h:30"></i>
      <i class="r" style="--cx:196;--cy:300;--w:76;--h:76"></i>
      <i class="r" style="--cx:196;--cy:300;--w:30;--h:30"></i>
      <i class="r" style="--cx:316;--cy:300;--w:76;--h:76"></i>
      <i class="r" style="--cx:316;--cy:300;--w:30;--h:30"></i>
    `
  },
  {
    id: 'rocket', group: 'things',
    name: 'Rocket',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:62;--cy:63;--w:40;--h:40;--k:6;--rot:45deg"></i>
      <i class="r" style="--cx:338;--cy:63;--w:40;--h:40;--k:6;--rot:45deg"></i>
      <i class="r" style="--cx:52;--cy:184;--w:32;--h:32;--k:5;--rot:45deg"></i>
      <i class="r" style="--cx:348;--cy:184;--w:32;--h:32;--k:5;--rot:45deg"></i>
      <i class="r" style="--cx:200;--cy:340;--w:96;--h:100;--r:50% 50% 50% 50% / 30% 30% 70% 70%"></i>
      <i class="r" style="--cx:200;--cy:328;--w:50;--h:62;--r:50% 50% 50% 50% / 30% 30% 70% 70%"></i>
      <i class="r" style="--cx:118;--cy:276;--w:60;--h:108;--r:100% 0 30% 30% / 100% 0 20% 20%"></i>
      <i class="r" style="--cx:282;--cy:276;--w:60;--h:108;--r:0 100% 30% 30% / 0 100% 20% 20%"></i>
      <i class="r" style="--cx:200;--cy:176;--w:144;--h:296;--r:50% 50% 24% 24% / 62% 62% 8% 8%"></i>
      <i class="r" style="--cx:200;--cy:184;--w:80;--h:80"></i>
      <i class="r" style="--cx:200;--cy:184;--w:48;--h:48"></i>
      <i class="r" style="--cx:200;--cy:288;--w:144;--h:30;--k:4"></i>
    `
  },
  {
    id: 'helicopter', group: 'things',
    name: 'Helicopter',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:220"></i>
      <i class="r" style="--cx:304;--cy:42;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:100;--cy:206;--w:124;--h:44;--r:50% 20% 20% 50% / 50% 30% 30% 50%;--rot:-8deg"></i>
      <i class="r" style="--cx:46;--cy:190;--w:52;--h:52"></i>
      <i class="d" style="--cx:46;--cy:190;--w:56;--h:8;--k:4;--rot:90deg"></i>
      <i class="d" style="--cx:46;--cy:190;--w:56;--h:8;--k:4;--rot:0deg"></i>
      <i class="r" style="--cx:215;--cy:114;--w:22;--h:32;--k:4"></i>
      <i class="r" style="--cx:215;--cy:94;--w:318;--h:20;--k:10"></i>
      <i class="r" style="--cx:224;--cy:207;--w:212;--h:166;--r:50% 50% 46% 46% / 55% 55% 45% 45%"></i>
      <i class="r" style="--cx:272;--cy:178;--w:76;--h:70;--r:10% 80% 10% 10% / 10% 80% 10% 10%"></i>
      <i class="r" style="--cx:200;--cy:241;--w:100;--h:22;--k:8"></i>
      <i class="d" style="--cx:176;--cy:305;--w:38;--h:8;--k:4;--rot:90deg"></i>
      <i class="d" style="--cx:270;--cy:305;--w:38;--h:8;--k:4;--rot:90deg"></i>
      <i class="r" style="--cx:225;--cy:325;--w:210;--h:18;--k:9"></i>
    `
  },
  {
    id: 'tractor', group: 'things',
    name: 'Tractor',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:220"></i>
      <i class="r" style="--cx:309;--cy:179;--w:18;--h:66;--k:6"></i>
      <i class="r" style="--cx:272;--cy:240;--w:164;--h:76;--k:16"></i>
      <i class="d" style="--cx:232;--cy:241;--w:50;--h:8;--k:4;--rot:90deg"></i>
      <i class="d" style="--cx:256;--cy:241;--w:50;--h:8;--k:4;--rot:90deg"></i>
      <i class="d" style="--cx:280;--cy:241;--w:50;--h:8;--k:4;--rot:90deg"></i>
      <i class="r" style="--cx:146;--cy:202;--w:116;--h:152;--k:10"></i>
      <i class="r" style="--cx:146;--cy:121;--w:144;--h:26;--k:12"></i>
      <i class="r" style="--cx:146;--cy:177;--w:72;--h:62;--k:8"></i>
      <i class="r" style="--cx:128;--cy:284;--w:156;--h:156"></i>
      <i class="r" style="--cx:128;--cy:284;--w:60;--h:60"></i>
      <i class="r" style="--cx:310;--cy:306;--w:88;--h:88"></i>
      <i class="r" style="--cx:310;--cy:306;--w:32;--h:32"></i>
    `
  },
  {
    id: 'castle', group: 'things',
    name: 'Castle',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:220"></i>
      <i class="d" style="--cx:82;--cy:50;--w:48;--h:8;--k:4;--rot:-90deg"></i>
      <i class="d" style="--cx:318;--cy:50;--w:48;--h:8;--k:4;--rot:-90deg"></i>
      <i class="r" style="--cx:102;--cy:38;--w:40;--h:28;--r:0 60% 60% 0 / 0 50% 50% 0"></i>
      <i class="r" style="--cx:338;--cy:38;--w:40;--h:28;--r:0 60% 60% 0 / 0 50% 50% 0"></i>
      <i class="r" style="--cx:148;--cy:196;--w:30;--h:32;--k:3"></i>
      <i class="r" style="--cx:200;--cy:196;--w:30;--h:32;--k:3"></i>
      <i class="r" style="--cx:252;--cy:196;--w:30;--h:32;--k:3"></i>
      <i class="r" style="--cx:200;--cy:274;--w:180;--h:136;--k:2"></i>
      <i class="r" style="--cx:82;--cy:246;--w:84;--h:188;--k:0"></i>
      <i class="r" style="--cx:318;--cy:246;--w:84;--h:188;--k:0"></i>
      <i class="r" style="--cx:82;--cy:118;--w:116;--h:84;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:318;--cy:118;--w:116;--h:84;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:82;--cy:218;--w:32;--h:50;--r:50% 50% 0 0 / 40% 40% 0 0"></i>
      <i class="r" style="--cx:318;--cy:218;--w:32;--h:50;--r:50% 50% 0 0 / 40% 40% 0 0"></i>
      <i class="r" style="--cx:200;--cy:296;--w:72;--h:92;--r:50% 50% 0 0 / 40% 40% 0 0"></i>
      <i class="d" style="--cx:200;--cy:295;--w:98;--h:8;--k:4;--rot:90deg"></i>
    `
  },
  {
    id: 'balloon', group: 'things',
    name: 'Hot-air balloon',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:62;--cy:292;--w:100;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:342;--cy:232;--w:100;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:200;--cy:160;--w:282;--h:262;--r:50% 50% 50% 50% / 42% 42% 58% 58%"></i>
      <i class="r" style="--cx:200;--cy:160;--w:172;--h:262;--r:50% 50% 50% 50% / 42% 42% 58% 58%"></i>
      <i class="r" style="--cx:200;--cy:160;--w:70;--h:262;--r:50% 50% 50% 50% / 42% 42% 58% 58%"></i>
      <i class="r" style="--cx:200;--cy:296;--w:66;--h:28;--r:8px"></i>
      <i class="d" style="--cx:176;--cy:318;--w:7;--h:34;--r:4px;--rot:22deg"></i>
      <i class="d" style="--cx:224;--cy:318;--w:7;--h:34;--r:4px;--rot:-22deg"></i>
      <i class="r" style="--cx:200;--cy:364;--w:98;--h:52;--r:6px 6px 16px 16px"></i>
      <i class="r" style="--cx:200;--cy:338;--w:122;--h:24;--r:12px"></i>
    `
  },
  {
    id: 'submarine', group: 'things',
    name: 'Submarine',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:218"></i>
      <i class="r" style="--cx:44;--cy:150;--w:28;--h:28"></i>
      <i class="r" style="--cx:70;--cy:104;--w:36;--h:36"></i>
      <i class="r" style="--cx:200;--cy:147;--w:104;--h:74;--k:16"></i>
      <i class="r" style="--cx:362;--cy:210;--w:26;--h:60"></i>
      <i class="r" style="--cx:362;--cy:264;--w:26;--h:60"></i>
      <i class="r" style="--cx:350;--cy:237;--w:26;--h:26"></i>
      <i class="r" style="--cx:194;--cy:237;--w:300;--h:134;--k:67"></i>
      <i class="r" style="--cx:122;--cy:224;--w:52;--h:52"></i>
      <i class="r" style="--cx:200;--cy:224;--w:52;--h:52"></i>
      <i class="r" style="--cx:278;--cy:224;--w:52;--h:52"></i>
    `
  },
  {
    id: 'digger', group: 'things',
    name: 'Digger',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:216"></i>
      <i class="r" style="--cx:348;--cy:322;--w:100;--h:50;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:214;--cy:193;--w:16;--h:50;--k:6"></i>
      <i class="r" style="--cx:126;--cy:171;--w:112;--h:110;--k:14"></i>
      <i class="r" style="--cx:126;--cy:165;--w:76;--h:62;--k:8"></i>
      <i class="r" style="--cx:161;--cy:252;--w:210;--h:84;--k:14"></i>
      <i class="r" style="--cx:262;--cy:180;--w:36;--h:160;--k:16;--rot:26deg"></i>
      <i class="r" style="--cx:330;--cy:170;--w:32;--h:124;--k:14;--rot:-21deg"></i>
      <i class="r" style="--cx:356;--cy:240;--w:72;--h:62;--r:0 0 60% 60% / 0 0 80% 80%;--rot:-12deg"></i>
      <i class="r" style="--cx:309;--cy:116;--w:28;--h:28"></i>
      <i class="r" style="--cx:165;--cy:316;--w:250;--h:60;--k:30"></i>
      <i class="r" style="--cx:74;--cy:316;--w:36;--h:36"></i>
      <i class="r" style="--cx:134;--cy:316;--w:36;--h:36"></i>
      <i class="r" style="--cx:194;--cy:316;--w:36;--h:36"></i>
      <i class="r" style="--cx:254;--cy:316;--w:36;--h:36"></i>
    `
  },
  {
    id: 'lighthouse', group: 'things',
    name: 'Lighthouse',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:80;--cy:90;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:200;--cy:236;--w:96;--h:194;--k:8"></i>
      <i class="r" style="--cx:200;--cy:200;--w:96;--h:40;--k:4"></i>
      <i class="r" style="--cx:200;--cy:280;--w:96;--h:40;--k:4"></i>
      <i class="r" style="--cx:200;--cy:240;--w:26;--h:26"></i>
      <i class="r" style="--cx:200;--cy:312;--w:38;--h:50;--r:50% 50% 0 0 / 40% 40% 0 0"></i>
      <i class="r" style="--cx:200;--cy:135;--w:104;--h:22;--k:7"></i>
      <i class="r" style="--cx:200;--cy:100;--w:68;--h:56;--k:6"></i>
      <i class="r" style="--cx:200;--cy:101;--w:40;--h:34;--k:5"></i>
      <i class="r" style="--cx:200;--cy:58;--w:86;--h:46;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:200;--cy:28;--w:22;--h:22"></i>
      <i class="r" style="--cx:201;--cy:326;--w:216;--h:46;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:208"></i>
    `
  },
  {
    id: 'tent', group: 'things',
    name: 'Tent',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:311;--cy:86;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:236"></i>
      <i class="d" style="--cx:166;--cy:110;--w:60;--h:8;--k:4;--rot:-90deg"></i>
      <i class="r" style="--cx:190;--cy:92;--w:44;--h:30;--r:0 60% 60% 0 / 0 50% 50% 0"></i>
      <i class="r" style="--cx:166;--cy:236;--w:290;--h:200;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:166;--cy:236;--w:180;--h:200;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:166;--cy:282;--w:90;--h:108;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="d" style="--cx:166;--cy:286;--w:8;--h:100;--k:4"></i>
    `
  },
  {
    id: 'dumptruck', group: 'things',
    name: 'Dump truck',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:214"></i>
      <i class="r" style="--cx:144;--cy:124;--w:176;--h:56;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:141;--cy:206;--w:218;--h:120;--r:4% 4% 16% 16% / 6% 6% 20% 20%"></i>
      <i class="r" style="--cx:316;--cy:219;--w:120;--h:122;--r:10% 44% 6% 6% / 10% 40% 6% 6%"></i>
      <i class="r" style="--cx:304;--cy:194;--w:66;--h:36;--r:6% 60% 6% 6% / 10% 80% 6% 6%"></i>
      <i class="r" style="--cx:364;--cy:244;--w:22;--h:22"></i>
      <i class="r" style="--cx:207;--cy:274;--w:358;--h:32;--k:10"></i>
      <i class="r" style="--cx:94;--cy:300;--w:80;--h:80"></i>
      <i class="r" style="--cx:182;--cy:300;--w:80;--h:80"></i>
      <i class="r" style="--cx:314;--cy:300;--w:80;--h:80"></i>
      <i class="r" style="--cx:94;--cy:300;--w:32;--h:32"></i>
      <i class="r" style="--cx:182;--cy:300;--w:32;--h:32"></i>
      <i class="r" style="--cx:314;--cy:300;--w:32;--h:32"></i>
    `
  },
  {
    id: 'bicycle', group: 'things',
    name: 'Bicycle',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:90;--cy:74;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r flat" style="--cx:200;--cy:384;--w:420;--h:52;--r:0"></i>
      <i class="r" style="--cx:96;--cy:282;--w:156;--h:156"></i>
      <i class="r" style="--cx:96;--cy:282;--w:106;--h:106"></i>
      <i class="r" style="--cx:304;--cy:282;--w:156;--h:156"></i>
      <i class="r" style="--cx:304;--cy:282;--w:106;--h:106"></i>
      <i class="r" style="--cx:166;--cy:200;--w:24;--h:76;--k:12"></i>
      <i class="r" style="--cx:292;--cy:224;--w:26;--h:124;--k:13;--rot:-12deg"></i>
      <i class="r" style="--cx:188;--cy:232;--w:236;--h:28;--k:14;--rot:-29deg"></i>
      <i class="r" style="--cx:160;--cy:162;--w:86;--h:32;--r:40% 60% 50% 50%"></i>
      <i class="r" style="--cx:282;--cy:158;--w:84;--h:28;--k:14;--rot:-8deg"></i>
      <i class="r" style="--cx:96;--cy:282;--w:36;--h:36"></i>
      <i class="r" style="--cx:304;--cy:282;--w:36;--h:36"></i>
    `
  },
  {
    id: 'kite', group: 'things',
    name: 'Kite',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:326;--cy:300;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:74;--cy:330;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="d" style="--cx:200;--cy:340;--w:8;--h:100;--k:4"></i>
      <i class="r" style="--cx:200;--cy:322;--w:62;--h:26;--rot:-14deg"></i>
      <i class="r" style="--cx:200;--cy:366;--w:62;--h:26;--rot:14deg"></i>
      <i class="r" style="--cx:200;--cy:102;--w:92;--h:92;--k:8;--rot:45deg"></i>
      <i class="r" style="--cx:137;--cy:165;--w:92;--h:92;--k:8;--rot:45deg"></i>
      <i class="r" style="--cx:263;--cy:165;--w:92;--h:92;--k:8;--rot:45deg"></i>
      <i class="r" style="--cx:200;--cy:228;--w:92;--h:92;--k:8;--rot:45deg"></i>
    `
  },
  {
    id: 'umbrella', group: 'things',
    name: 'Umbrella',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:150"></i>
      <i class="r" style="--cx:200;--cy:310;--w:22;--h:130;--k:11"></i>
      <i class="r" style="--cx:200;--cy:362;--w:42;--h:52;--k:16"></i>
      <i class="r" style="--cx:200;--cy:66;--w:28;--h:28"></i>
      <i class="r" style="--cx:200;--cy:170;--w:340;--h:180;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:200;--cy:170;--w:210;--h:180;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:200;--cy:170;--w:76;--h:180;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:50;--cy:310;--w:34;--h:34;--r:0 50% 50% 50%;--rot:45deg"></i>
      <i class="r" style="--cx:110;--cy:350;--w:34;--h:34;--r:0 50% 50% 50%;--rot:45deg"></i>
      <i class="r" style="--cx:300;--cy:300;--w:34;--h:34;--r:0 50% 50% 50%;--rot:45deg"></i>
      <i class="r" style="--cx:356;--cy:346;--w:34;--h:34;--r:0 50% 50% 50%;--rot:45deg"></i>
      <i class="r" style="--cx:50;--cy:56;--w:34;--h:34;--r:0 50% 50% 50%;--rot:45deg"></i>
      <i class="r" style="--cx:350;--cy:56;--w:34;--h:34;--r:0 50% 50% 50%;--rot:45deg"></i>
    `
  },
  {
    id: 'icecream', group: 'things',
    name: 'Ice cream',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:326;--cy:330;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:200;--cy:256;--w:164;--h:164;--r:50% 50% 12% 50%;--rot:45deg"></i>
      <i class="r" style="--cx:134;--cy:222;--w:72;--h:72"></i>
      <i class="r" style="--cx:200;--cy:234;--w:72;--h:72"></i>
      <i class="r" style="--cx:266;--cy:222;--w:72;--h:72"></i>
      <i class="r" style="--cx:200;--cy:150;--w:236;--h:196"></i>
      <i class="ln up" style="--cx:208;--cy:38;--w:36;--h:36;--rot:28deg"></i>
      <i class="r" style="--cx:200;--cy:60;--w:52;--h:52"></i>
      <i class="d" style="--cx:150;--cy:124;--w:24;--h:8;--k:4;--rot:30deg"></i>
      <i class="d" style="--cx:250;--cy:124;--w:24;--h:8;--k:4;--rot:-30deg"></i>
      <i class="d" style="--cx:170;--cy:180;--w:24;--h:8;--k:4;--rot:-20deg"></i>
      <i class="d" style="--cx:232;--cy:176;--w:24;--h:8;--k:4;--rot:20deg"></i>
      <i class="d" style="--cx:200;--cy:120;--w:24;--h:8;--k:4;--rot:80deg"></i>
    `
  },
  {
    id: 'cupcake', group: 'things',
    name: 'Cupcake',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:370;--w:320;--h:40"></i>
      <i class="r" style="--cx:118;--cy:298;--w:46;--h:128;--k:10;--rot:-8deg"></i>
      <i class="r" style="--cx:282;--cy:298;--w:46;--h:128;--k:10;--rot:8deg"></i>
      <i class="r" style="--cx:159;--cy:302;--w:46;--h:128;--k:10;--rot:-4deg"></i>
      <i class="r" style="--cx:241;--cy:302;--w:46;--h:128;--k:10;--rot:4deg"></i>
      <i class="r" style="--cx:200;--cy:304;--w:46;--h:128;--k:10"></i>
      <i class="r" style="--cx:200;--cy:234;--w:290;--h:96"></i>
      <i class="r" style="--cx:200;--cy:178;--w:226;--h:88"></i>
      <i class="r" style="--cx:200;--cy:128;--w:154;--h:76"></i>
      <i class="r" style="--cx:200;--cy:92;--w:76;--h:56;--r:50% 50% 50% 50% / 70% 70% 30% 30%"></i>
      <i class="ln up" style="--cx:214;--cy:34;--w:36;--h:36;--rot:24deg"></i>
      <i class="r" style="--cx:200;--cy:58;--w:48;--h:48"></i>
      <i class="d" style="--cx:130;--cy:228;--w:22;--h:8;--k:4;--rot:30deg"></i>
      <i class="d" style="--cx:270;--cy:228;--w:22;--h:8;--k:4;--rot:-30deg"></i>
      <i class="d" style="--cx:200;--cy:244;--w:22;--h:8;--k:4;--rot:-10deg"></i>
      <i class="d" style="--cx:156;--cy:178;--w:22;--h:8;--k:4;--rot:-40deg"></i>
      <i class="d" style="--cx:244;--cy:178;--w:22;--h:8;--k:4;--rot:40deg"></i>
    `
  },
  {
    id: 'windmill', group: 'things',
    name: 'Windmill',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:332;--cy:322;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:200;--cy:440;--w:760;--h:160"></i>
      <i class="r" style="--cx:200;--cy:276;--w:176;--h:220;--r:30% 30% 5% 5% / 14% 14% 3% 3%"></i>
      <i class="r" style="--cx:200;--cy:336;--w:60;--h:86;--r:50% 50% 0 0 / 40% 40% 0 0"></i>
      <i class="r" style="--cx:200;--cy:252;--w:46;--h:46"></i>
      <i class="r" style="--cx:200;--cy:160;--w:200;--h:104;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:256;--cy:94;--w:50;--h:140;--k:12;--rot:45deg"></i>
      <i class="r" style="--cx:144;--cy:94;--w:50;--h:140;--k:12;--rot:-45deg"></i>
      <i class="r" style="--cx:144;--cy:206;--w:50;--h:140;--k:12;--rot:45deg"></i>
      <i class="r" style="--cx:256;--cy:206;--w:50;--h:140;--k:12;--rot:-45deg"></i>
      <i class="r" style="--cx:200;--cy:150;--w:50;--h:50"></i>
    `
  },

  {
    id: 'policecar', group: 'things',
    name: 'Police Car',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r flat" style="--cx:200;--cy:372;--w:420;--h:72;--r:0"></i>
      <i class="d" style="--cx:55;--cy:368;--w:58;--h:8;--k:4"></i>
      <i class="d" style="--cx:175;--cy:368;--w:58;--h:8;--k:4"></i>
      <i class="d" style="--cx:295;--cy:368;--w:58;--h:8;--k:4"></i>
      <i class="r" style="--cx:174;--cy:96;--w:44;--h:40;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:218;--cy:96;--w:44;--h:40;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:196;--cy:118;--w:108;--h:28;--k:10"></i>
      <i class="r" style="--cx:196;--cy:190;--w:204;--h:124;--r:48% 52% 6% 6% / 72% 72% 8% 8%"></i>
      <i class="r" style="--cx:152;--cy:192;--w:72;--h:62;--r:70% 14% 6% 6% / 80% 20% 8% 8%"></i>
      <i class="r" style="--cx:238;--cy:192;--w:70;--h:62;--r:14% 70% 6% 6% / 20% 80% 8% 8%"></i>
      <i class="r" style="--cx:200;--cy:262;--w:344;--h:100;--r:24% 28% 18% 18% / 42% 48% 30% 30%"></i>
      <i class="r" style="--cx:154;--cy:258;--w:46;--h:46"></i>
      <i class="d" style="--cx:200;--cy:262;--w:8;--h:56;--k:4"></i>
      <i class="r" style="--cx:352;--cy:246;--w:28;--h:28"></i>
      <i class="r" style="--cx:46;--cy:244;--w:22;--h:32;--r:40%"></i>
      <i class="r" style="--cx:112;--cy:312;--w:88;--h:88"></i>
      <i class="r" style="--cx:112;--cy:312;--w:36;--h:36"></i>
      <i class="r" style="--cx:290;--cy:312;--w:88;--h:88"></i>
      <i class="r" style="--cx:290;--cy:312;--w:36;--h:36"></i>
    `
  },
  {
    id: 'scooter', group: 'things',
    name: 'Scooter',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:90;--cy:84;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r flat" style="--cx:200;--cy:390;--w:420;--h:44;--r:0"></i>
      <i class="r" style="--cx:86;--cy:318;--w:84;--h:84"></i>
      <i class="r" style="--cx:86;--cy:318;--w:30;--h:30"></i>
      <i class="r" style="--cx:80;--cy:284;--w:104;--h:40;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:312;--cy:318;--w:84;--h:84"></i>
      <i class="r" style="--cx:296;--cy:206;--w:30;--h:236;--k:15;--rot:-7deg"></i>
      <i class="r" style="--cx:194;--cy:296;--w:250;--h:34;--k:17"></i>
      <i class="r" style="--cx:312;--cy:318;--w:30;--h:30"></i>
      <i class="r" style="--cx:282;--cy:94;--w:140;--h:28;--k:14"></i>
      <i class="r" style="--cx:216;--cy:94;--w:52;--h:36;--k:16"></i>
      <i class="r" style="--cx:348;--cy:94;--w:52;--h:36;--k:16"></i>
    `
  },
  {
    id: 'ship', group: 'things',
    name: 'Ship',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:82;--cy:70;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:248;--cy:116;--w:56;--h:100;--k:8;--rot:8deg"></i>
      <i class="r" style="--cx:250;--cy:96;--w:58;--h:28;--k:6;--rot:8deg"></i>
      <i class="r" style="--cx:180;--cy:196;--w:240;--h:84;--k:14"></i>
      <i class="r" style="--cx:128;--cy:194;--w:44;--h:40;--k:10"></i>
      <i class="r" style="--cx:186;--cy:194;--w:44;--h:40;--k:10"></i>
      <i class="r" style="--cx:244;--cy:194;--w:44;--h:40;--k:10"></i>
      <i class="r" style="--cx:200;--cy:282;--w:356;--h:120;--r:4% 4% 34% 34% / 8% 8% 92% 92%"></i>
      <i class="r" style="--cx:110;--cy:268;--w:42;--h:42"></i>
      <i class="r" style="--cx:200;--cy:268;--w:42;--h:42"></i>
      <i class="r" style="--cx:290;--cy:268;--w:42;--h:42"></i>
      <i class="r" style="--cx:200;--cy:416;--w:760;--h:230"></i>
    `
  },
  {
    id: 'barn', group: 'things',
    name: 'Barn',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:190"></i>
      <i class="r" style="--cx:200;--cy:180;--w:190;--h:190;--k:14;--rot:45deg"></i>
      <i class="r" style="--cx:200;--cy:278;--w:250;--h:166;--k:6"></i>
      <i class="r" style="--cx:200;--cy:150;--w:56;--h:56;--k:8"></i>
      <i class="r" style="--cx:200;--cy:306;--w:116;--h:112;--k:6"></i>
      <i class="d" style="--cx:200;--cy:306;--w:136;--h:8;--k:4;--rot:44deg"></i>
      <i class="d" style="--cx:200;--cy:306;--w:136;--h:8;--k:4;--rot:-44deg"></i>
      <i class="r" style="--cx:111;--cy:250;--w:42;--h:42;--k:6"></i>
      <i class="r" style="--cx:289;--cy:250;--w:42;--h:42;--k:6"></i>
      <i class="r" style="--cx:330;--cy:80;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
    `
  },
  {
    id: 'garbagetruck', group: 'things',
    name: 'Garbage Truck',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r flat" style="--cx:200;--cy:372;--w:420;--h:72;--r:0"></i>
      <i class="d" style="--cx:55;--cy:362;--w:58;--h:8;--k:4"></i>
      <i class="d" style="--cx:175;--cy:362;--w:58;--h:8;--k:4"></i>
      <i class="d" style="--cx:295;--cy:362;--w:58;--h:8;--k:4"></i>
      <i class="r" style="--cx:90;--cy:70;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:148;--cy:222;--w:240;--h:160;--r:30% 30% 6% 6% / 40% 40% 8% 8%"></i>
      <i class="r" style="--cx:148;--cy:240;--w:240;--h:34;--k:0"></i>
      <i class="r" style="--cx:315;--cy:240;--w:100;--h:124;--r:12% 44% 8% 8% / 10% 30% 8% 8%"></i>
      <i class="r" style="--cx:318;--cy:212;--w:64;--h:46;--r:8% 50% 6% 6% / 10% 60% 6% 6%"></i>
      <i class="r" style="--cx:362;--cy:270;--w:20;--h:28;--k:6"></i>
      <i class="r" style="--cx:86;--cy:300;--w:76;--h:76"></i>
      <i class="r" style="--cx:86;--cy:300;--w:30;--h:30"></i>
      <i class="r" style="--cx:196;--cy:300;--w:76;--h:76"></i>
      <i class="r" style="--cx:196;--cy:300;--w:30;--h:30"></i>
      <i class="r" style="--cx:316;--cy:300;--w:76;--h:76"></i>
      <i class="r" style="--cx:316;--cy:300;--w:30;--h:30"></i>
    `
  },
  {
    id: 'present', group: 'things',
    name: 'Present',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:370;--w:340;--h:44"></i>
      <i class="r" style="--cx:150;--cy:110;--w:104;--h:70;--rot:24deg"></i>
      <i class="r" style="--cx:250;--cy:110;--w:104;--h:70;--rot:-24deg"></i>
      <i class="r" style="--cx:200;--cy:268;--w:264;--h:180;--k:10"></i>
      <i class="r" style="--cx:120;--cy:234;--w:36;--h:36"></i>
      <i class="r" style="--cx:280;--cy:234;--w:36;--h:36"></i>
      <i class="r" style="--cx:136;--cy:310;--w:36;--h:36"></i>
      <i class="r" style="--cx:264;--cy:310;--w:36;--h:36"></i>
      <i class="r" style="--cx:200;--cy:268;--w:50;--h:180;--k:0"></i>
      <i class="r" style="--cx:200;--cy:170;--w:300;--h:58;--k:12"></i>
      <i class="r" style="--cx:200;--cy:170;--w:50;--h:58;--k:0"></i>
      <i class="r" style="--cx:200;--cy:132;--w:50;--h:44;--k:14"></i>
    `
  },
  {
    id: 'rainbow', group: 'things',
    name: 'Rainbow',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:210;--w:368;--h:184;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:200;--cy:222;--w:320;--h:160;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:200;--cy:234;--w:272;--h:136;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:200;--cy:246;--w:224;--h:112;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:200;--cy:258;--w:176;--h:88;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:200;--cy:270;--w:128;--h:64;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:200;--cy:436;--w:760;--h:290"></i>
      <i class="r" style="--cx:66;--cy:296;--w:130;--h:76;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:334;--cy:296;--w:130;--h:76;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
    `
  },
  {
    id: 'ambulance', group: 'things',
    name: 'Ambulance',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r flat" style="--cx:200;--cy:372;--w:420;--h:72;--r:0"></i>
      <i class="d" style="--cx:55;--cy:368;--w:58;--h:8;--k:4"></i>
      <i class="d" style="--cx:175;--cy:368;--w:58;--h:8;--k:4"></i>
      <i class="d" style="--cx:295;--cy:368;--w:58;--h:8;--k:4"></i>
      <i class="r" style="--cx:150;--cy:96;--w:60;--h:44;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:150;--cy:200;--w:224;--h:180;--k:18"></i>
      <i class="r" style="--cx:300;--cy:225;--w:124;--h:124;--r:10% 50% 10% 10% / 10% 40% 10% 10%"></i>
      <i class="r" style="--cx:318;--cy:204;--w:62;--h:46;--r:10% 60% 10% 10% / 10% 70% 10% 10%"></i>
      <i class="r" style="--cx:146;--cy:192;--w:104;--h:104"></i>
      <i class="d" style="--cx:146;--cy:192;--w:60;--h:20;--k:4"></i>
      <i class="d" style="--cx:146;--cy:192;--w:20;--h:60;--k:4"></i>
      <i class="r" style="--cx:348;--cy:252;--w:22;--h:22"></i>
      <i class="r" style="--cx:205;--cy:284;--w:340;--h:28;--k:10"></i>
      <i class="r" style="--cx:106;--cy:304;--w:84;--h:84"></i>
      <i class="r" style="--cx:106;--cy:304;--w:34;--h:34"></i>
      <i class="r" style="--cx:296;--cy:304;--w:84;--h:84"></i>
      <i class="r" style="--cx:296;--cy:304;--w:34;--h:34"></i>
    `
  },
  {
    id: 'mixer', group: 'things',
    name: 'Cement mixer',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r flat" style="--cx:200;--cy:378;--w:420;--h:60;--r:0"></i>
      <i class="r" style="--cx:146;--cy:186;--w:236;--h:146;--rot:-14deg"></i>
      <i class="r" style="--cx:104;--cy:198;--w:42;--h:126;--rot:-14deg"></i>
      <i class="r" style="--cx:176;--cy:180;--w:42;--h:136;--rot:-14deg"></i>
      <i class="r" style="--cx:312;--cy:205;--w:110;--h:132;--r:12% 44% 6% 6% / 10% 40% 6% 6%"></i>
      <i class="r" style="--cx:322;--cy:182;--w:60;--h:44;--r:6% 60% 6% 6% / 10% 80% 6% 6%"></i>
      <i class="r" style="--cx:356;--cy:246;--w:20;--h:20"></i>
      <i class="r" style="--cx:200;--cy:276;--w:350;--h:30;--k:10"></i>
      <i class="r" style="--cx:80;--cy:306;--w:80;--h:80"></i>
      <i class="r" style="--cx:174;--cy:306;--w:80;--h:80"></i>
      <i class="r" style="--cx:312;--cy:306;--w:80;--h:80"></i>
      <i class="r" style="--cx:80;--cy:306;--w:32;--h:32"></i>
      <i class="r" style="--cx:174;--cy:306;--w:32;--h:32"></i>
      <i class="r" style="--cx:312;--cy:306;--w:32;--h:32"></i>
    `
  },
  {
    id: 'motorcycle', group: 'things',
    name: 'Motorcycle',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:90;--cy:74;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r flat" style="--cx:200;--cy:384;--w:420;--h:52;--r:0"></i>
      <i class="r" style="--cx:276;--cy:226;--w:24;--h:150;--k:12;--rot:-24deg"></i>
      <i class="r" style="--cx:200;--cy:264;--w:84;--h:60;--k:14"></i>
      <i class="r" style="--cx:205;--cy:214;--w:156;--h:74;--r:50% 50% 30% 30% / 70% 70% 30% 30%"></i>
      <i class="r" style="--cx:158;--cy:190;--w:116;--h:34;--k:16"></i>
      <i class="r" style="--cx:248;--cy:154;--w:70;--h:24;--k:12;--rot:-10deg"></i>
      <i class="r" style="--cx:290;--cy:206;--w:46;--h:46"></i>
      <i class="r" style="--cx:98;--cy:290;--w:140;--h:140"></i>
      <i class="r" style="--cx:98;--cy:290;--w:66;--h:66"></i>
      <i class="r" style="--cx:304;--cy:290;--w:140;--h:140"></i>
      <i class="r" style="--cx:304;--cy:290;--w:66;--h:66"></i>
    `
  },
  {
    id: 'treehouse', group: 'things',
    name: 'Treehouse',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:270;--w:74;--h:200;--k:12"></i>
      <i class="r" style="--cx:200;--cy:124;--w:376;--h:224"></i>
      <i class="r" style="--cx:200;--cy:450;--w:760;--h:220"></i>
      <i class="r" style="--cx:200;--cy:156;--w:132;--h:132;--k:14;--rot:45deg"></i>
      <i class="r" style="--cx:200;--cy:206;--w:164;--h:104;--k:8"></i>
      <i class="r" style="--cx:166;--cy:226;--w:42;--h:60;--r:50% 50% 8% 8% / 40% 40% 8% 8%"></i>
      <i class="r" style="--cx:240;--cy:206;--w:46;--h:46;--k:8"></i>
      <i class="r" style="--cx:200;--cy:262;--w:226;--h:24;--k:8"></i>
    `
  },
  {
    id: 'towtruck', group: 'things',
    name: 'Tow Truck',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:320;--cy:70;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r flat" style="--cx:200;--cy:376;--w:420;--h:64;--r:0"></i>
      <i class="d" style="--cx:70;--cy:368;--w:58;--h:8;--k:4"></i>
      <i class="d" style="--cx:200;--cy:368;--w:58;--h:8;--k:4"></i>
      <i class="d" style="--cx:330;--cy:368;--w:58;--h:8;--k:4"></i>
      <i class="d" style="--cx:66;--cy:170;--w:8;--h:76;--k:4"></i>
      <i class="ln" style="--cx:66;--cy:200;--w:38;--h:34"></i>
      <i class="r" style="--cx:122;--cy:168;--w:150;--h:26;--k:13;--rot:40deg"></i>
      <i class="r" style="--cx:290;--cy:146;--w:42;--h:30;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:136;--cy:238;--w:170;--h:56;--k:8"></i>
      <i class="r" style="--cx:172;--cy:212;--w:36;--h:36"></i>
      <i class="r" style="--cx:292;--cy:212;--w:130;--h:126;--r:12% 40% 6% 6% / 10% 40% 6% 6%"></i>
      <i class="r" style="--cx:302;--cy:190;--w:72;--h:52;--r:10% 40% 10% 10% / 10% 40% 10% 10%"></i>
      <i class="r" style="--cx:200;--cy:270;--w:356;--h:40;--k:14"></i>
      <i class="r" style="--cx:362;--cy:238;--w:22;--h:28;--r:40%"></i>
      <i class="r" style="--cx:100;--cy:306;--w:88;--h:88"></i>
      <i class="r" style="--cx:100;--cy:306;--w:34;--h:34"></i>
      <i class="r" style="--cx:300;--cy:306;--w:88;--h:88"></i>
      <i class="r" style="--cx:300;--cy:306;--w:34;--h:34"></i>
    `
  },
  {
    id: 'school', group: 'things',
    name: 'School',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:80;--cy:70;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r flat" style="--cx:200;--cy:372;--w:420;--h:84;--r:0"></i>
      <i class="r" style="--cx:200;--cy:60;--w:60;--h:60;--k:8;--rot:45deg"></i>
      <i class="r" style="--cx:200;--cy:178;--w:150;--h:150;--k:12;--rot:45deg"></i>
      <i class="r" style="--cx:200;--cy:100;--w:64;--h:60;--k:6"></i>
      <i class="r" style="--cx:200;--cy:104;--w:32;--h:32;--r:50% 50% 20% 20% / 70% 70% 20% 20%"></i>
      <i class="r" style="--cx:200;--cy:254;--w:304;--h:164;--k:8"></i>
      <i class="r" style="--cx:200;--cy:160;--w:54;--h:54"></i>
      <i class="d" style="--cx:200;--cy:150;--w:6;--h:22;--k:3"></i>
      <i class="d" style="--cx:208;--cy:160;--w:18;--h:6;--k:3"></i>
      <i class="r" style="--cx:200;--cy:290;--w:66;--h:92;--r:50% 50% 6% 6% / 36% 36% 6% 6%"></i>
      <i class="r" style="--cx:106;--cy:222;--w:60;--h:48;--k:6"></i>
      <i class="r" style="--cx:294;--cy:222;--w:60;--h:48;--k:6"></i>
      <i class="r" style="--cx:106;--cy:290;--w:60;--h:48;--k:6"></i>
      <i class="r" style="--cx:294;--cy:290;--w:60;--h:48;--k:6"></i>
    `
  },
  {
    id: 'racecar', group: 'things',
    name: 'Race Car',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:300;--cy:84;--w:120;--h:54;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r flat" style="--cx:200;--cy:374;--w:420;--h:68;--r:0"></i>
      <i class="d" style="--cx:70;--cy:368;--w:58;--h:8;--k:4"></i>
      <i class="d" style="--cx:200;--cy:368;--w:58;--h:8;--k:4"></i>
      <i class="d" style="--cx:330;--cy:368;--w:58;--h:8;--k:4"></i>
      <i class="r" style="--cx:62;--cy:214;--w:22;--h:50;--k:6"></i>
      <i class="r" style="--cx:60;--cy:186;--w:90;--h:26;--k:10"></i>
      <i class="r" style="--cx:182;--cy:204;--w:76;--h:72"></i>
      <i class="r" style="--cx:200;--cy:196;--w:44;--h:28;--k:12"></i>
      <i class="r" style="--cx:200;--cy:256;--w:350;--h:76;--r:30% 50% 20% 20% / 50% 70% 30% 30%"></i>
      <i class="r" style="--cx:240;--cy:256;--w:50;--h:50"></i>
      <i class="r" style="--cx:100;--cy:302;--w:100;--h:100"></i>
      <i class="r" style="--cx:100;--cy:302;--w:38;--h:38"></i>
      <i class="r" style="--cx:306;--cy:306;--w:90;--h:90"></i>
      <i class="r" style="--cx:306;--cy:306;--w:34;--h:34"></i>
    `
  },
  {
    id: 'snowman', group: 'things',
    name: 'Snowman',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:200;--cy:450;--w:660;--h:220"></i>
      <i class="r" style="--cx:94;--cy:226;--w:124;--h:20;--k:10;--rot:28deg"></i>
      <i class="r" style="--cx:306;--cy:226;--w:124;--h:20;--k:10;--rot:-28deg"></i>
      <i class="r" style="--cx:42;--cy:196;--w:42;--h:42"></i>
      <i class="r" style="--cx:358;--cy:196;--w:42;--h:42"></i>
      <i class="r" style="--cx:200;--cy:320;--w:210;--h:142"></i>
      <i class="r" style="--cx:200;--cy:240;--w:160;--h:122"></i>
      <i class="r" style="--cx:244;--cy:224;--w:36;--h:70;--k:12;--rot:-8deg"></i>
      <i class="r" style="--cx:200;--cy:122;--w:134;--h:120"></i>
      <i class="d" style="--cx:176;--cy:106;--w:18;--h:22"></i>
      <i class="d w" style="--cx:179;--cy:101;--w:7;--h:7"></i>
      <i class="d" style="--cx:224;--cy:106;--w:18;--h:22"></i>
      <i class="d w" style="--cx:227;--cy:101;--w:7;--h:7"></i>
      <i class="r" style="--cx:158;--cy:136;--w:26;--h:20"></i>
      <i class="r" style="--cx:244;--cy:136;--w:26;--h:20"></i>
      <i class="r" style="--cx:208;--cy:128;--w:42;--h:22;--r:50% 20% 20% 50% / 50% 50% 50% 50%"></i>
      <i class="ln" style="--cx:200;--cy:146;--w:42;--h:20"></i>
      <i class="r" style="--cx:200;--cy:184;--w:150;--h:30;--k:15"></i>
      <i class="d" style="--cx:200;--cy:228;--w:16;--h:16"></i>
      <i class="d" style="--cx:200;--cy:266;--w:16;--h:16"></i>
      <i class="d" style="--cx:200;--cy:320;--w:16;--h:16"></i>
      <i class="r" style="--cx:200;--cy:36;--w:86;--h:56;--k:10"></i>
      <i class="r" style="--cx:200;--cy:52;--w:86;--h:20;--r:0"></i>
      <i class="r" style="--cx:200;--cy:66;--w:148;--h:22;--k:11"></i>
    `
  },
  {
    id: 'crane', group: 'things',
    name: 'Crane',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:314;--cy:70;--w:120;--h:54;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r flat" style="--cx:200;--cy:376;--w:420;--h:64;--r:0"></i>
      <i class="d" style="--cx:70;--cy:368;--w:58;--h:8;--k:4"></i>
      <i class="d" style="--cx:200;--cy:368;--w:58;--h:8;--k:4"></i>
      <i class="d" style="--cx:330;--cy:368;--w:58;--h:8;--k:4"></i>
      <i class="d" style="--cx:64;--cy:84;--w:8;--h:76;--k:4"></i>
      <i class="r" style="--cx:64;--cy:100;--w:40;--h:30;--k:8"></i>
      <i class="r" style="--cx:64;--cy:146;--w:78;--h:58;--k:8"></i>
      <i class="d" style="--cx:64;--cy:146;--w:58;--h:7;--k:3"></i>
      <i class="r" style="--cx:163;--cy:123;--w:272;--h:32;--k:14;--rot:38deg"></i>
      <i class="r" style="--cx:342;--cy:212;--w:44;--h:56;--k:10"></i>
      <i class="r" style="--cx:272;--cy:208;--w:120;--h:76;--k:12"></i>
      <i class="r" style="--cx:296;--cy:198;--w:46;--h:38;--k:8"></i>
      <i class="r" style="--cx:240;--cy:206;--w:32;--h:32"></i>
      <i class="r" style="--cx:96;--cy:226;--w:104;--h:70;--r:40% 12% 6% 6% / 50% 14% 6% 6%"></i>
      <i class="r" style="--cx:88;--cy:216;--w:52;--h:34;--r:40% 10% 8% 8% / 50% 10% 8% 8%"></i>
      <i class="r" style="--cx:200;--cy:270;--w:356;--h:40;--k:14"></i>
      <i class="r" style="--cx:92;--cy:308;--w:80;--h:80"></i>
      <i class="r" style="--cx:92;--cy:308;--w:30;--h:30"></i>
      <i class="r" style="--cx:200;--cy:308;--w:80;--h:80"></i>
      <i class="r" style="--cx:200;--cy:308;--w:30;--h:30"></i>
      <i class="r" style="--cx:308;--cy:308;--w:80;--h:80"></i>
      <i class="r" style="--cx:308;--cy:308;--w:30;--h:30"></i>
    `
  },
  {
    id: 'firestation', group: 'things',
    name: 'Fire Station',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:300;--cy:72;--w:120;--h:54;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r flat" style="--cx:200;--cy:378;--w:420;--h:60;--r:0"></i>
      <i class="r" style="--cx:96;--cy:84;--w:64;--h:64;--k:8;--rot:45deg"></i>
      <i class="r" style="--cx:96;--cy:160;--w:84;--h:140;--k:6"></i>
      <i class="r" style="--cx:96;--cy:136;--w:40;--h:40;--r:50% 50% 10% 10% / 60% 60% 10% 10%"></i>
      <i class="r" style="--cx:200;--cy:266;--w:300;--h:164;--k:8"></i>
      <i class="r" style="--cx:200;--cy:186;--w:324;--h:28;--k:10"></i>
      <i class="r" style="--cx:232;--cy:228;--w:46;--h:46"></i>
      <i class="r" style="--cx:232;--cy:302;--w:150;--h:96;--r:40% 40% 4% 4% / 34% 34% 4% 4%"></i>
      <i class="d" style="--cx:232;--cy:300;--w:132;--h:7;--k:3"></i>
      <i class="d" style="--cx:232;--cy:324;--w:140;--h:7;--k:3"></i>
      <i class="r" style="--cx:100;--cy:306;--w:50;--h:86;--r:50% 50% 6% 6% / 30% 30% 6% 6%"></i>
      <i class="r" style="--cx:100;--cy:232;--w:46;--h:40;--k:6"></i>
    `
  },
  {
    id: 'teapot', group: 'things',
    name: 'Teapot',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r flat" style="--cx:200;--cy:384;--w:420;--h:64;--r:0"></i>
      <i class="r" style="--cx:308;--cy:238;--w:96;--h:116"></i>
      <i class="r" style="--cx:316;--cy:238;--w:44;--h:62"></i>
      <i class="r" style="--cx:78;--cy:222;--w:120;--h:40;--k:18;--rot:36deg"></i>
      <i class="r" style="--cx:194;--cy:342;--w:156;--h:30;--k:12"></i>
      <i class="r" style="--cx:194;--cy:244;--w:236;--h:196"></i>
      <i class="r" style="--cx:194;--cy:146;--w:122;--h:56;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:194;--cy:166;--w:160;--h:24;--k:12"></i>
      <i class="r" style="--cx:194;--cy:112;--w:38;--h:38"></i>
      <i class="d" style="--cx:164;--cy:234;--w:22;--h:28"></i>
      <i class="d w" style="--cx:168;--cy:227;--w:8;--h:8"></i>
      <i class="d" style="--cx:224;--cy:234;--w:22;--h:28"></i>
      <i class="d w" style="--cx:228;--cy:227;--w:8;--h:8"></i>
      <i class="r" style="--cx:136;--cy:264;--w:30;--h:22"></i>
      <i class="r" style="--cx:252;--cy:264;--w:30;--h:22"></i>
      <i class="ln" style="--cx:194;--cy:258;--w:50;--h:30"></i>
    `
  },
  {
    id: 'robot', group: 'things',
    name: 'Robot',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r flat" style="--cx:200;--cy:390;--w:420;--h:52;--r:0"></i>
      <i class="d" style="--cx:200;--cy:62;--w:8;--h:34;--k:4"></i>
      <i class="r" style="--cx:200;--cy:44;--w:32;--h:32"></i>
      <i class="r" style="--cx:200;--cy:192;--w:54;--h:24;--k:6"></i>
      <i class="r" style="--cx:98;--cy:262;--w:34;--h:100;--k:17;--rot:20deg"></i>
      <i class="r" style="--cx:302;--cy:262;--w:34;--h:100;--k:17;--rot:-20deg"></i>
      <i class="r" style="--cx:80;--cy:314;--w:46;--h:46"></i>
      <i class="r" style="--cx:320;--cy:314;--w:46;--h:46"></i>
      <i class="r" style="--cx:162;--cy:340;--w:42;--h:44;--k:8"></i>
      <i class="r" style="--cx:238;--cy:340;--w:42;--h:44;--k:8"></i>
      <i class="r" style="--cx:156;--cy:368;--w:70;--h:28;--r:50% 50% 10% 10% / 100% 100% 10% 10%"></i>
      <i class="r" style="--cx:244;--cy:368;--w:70;--h:28;--r:50% 50% 10% 10% / 100% 100% 10% 10%"></i>
      <i class="r" style="--cx:200;--cy:262;--w:184;--h:134;--k:20"></i>
      <i class="r" style="--cx:200;--cy:258;--w:96;--h:66;--k:12"></i>
      <i class="r" style="--cx:200;--cy:258;--w:32;--h:32"></i>
      <i class="r" style="--cx:116;--cy:128;--w:26;--h:46;--k:8"></i>
      <i class="r" style="--cx:284;--cy:128;--w:26;--h:46;--k:8"></i>
      <i class="r" style="--cx:200;--cy:128;--w:156;--h:112;--k:22"></i>
      <i class="d" style="--cx:170;--cy:118;--w:26;--h:30"></i>
      <i class="d w" style="--cx:175;--cy:110;--w:9;--h:9"></i>
      <i class="d" style="--cx:230;--cy:118;--w:26;--h:30"></i>
      <i class="d w" style="--cx:235;--cy:110;--w:9;--h:9"></i>
      <i class="r" style="--cx:146;--cy:148;--w:26;--h:20"></i>
      <i class="r" style="--cx:254;--cy:148;--w:26;--h:20"></i>
      <i class="ln" style="--cx:200;--cy:142;--w:46;--h:26"></i>
    `
  },
  {
    id: 'drum', group: 'things',
    name: 'Drum',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r flat" style="--cx:200;--cy:384;--w:420;--h:64;--r:0"></i>
      <i class="r" style="--cx:160;--cy:134;--w:24;--h:140;--k:12;--rot:-26deg"></i>
      <i class="r" style="--cx:240;--cy:134;--w:24;--h:140;--k:12;--rot:26deg"></i>
      <i class="r" style="--cx:130;--cy:72;--w:40;--h:40"></i>
      <i class="r" style="--cx:270;--cy:72;--w:40;--h:40"></i>
      <i class="r" style="--cx:200;--cy:276;--w:250;--h:156;--r:0 0 50% 50% / 0 0 24% 24%"></i>
      <i class="r" style="--cx:200;--cy:198;--w:250;--h:74"></i>
      <i class="r" style="--cx:136;--cy:262;--w:42;--h:42;--k:6;--rot:45deg"></i>
      <i class="r" style="--cx:200;--cy:262;--w:42;--h:42;--k:6;--rot:45deg"></i>
      <i class="r" style="--cx:264;--cy:262;--w:42;--h:42;--k:6;--rot:45deg"></i>
    `
  },
  {
    id: 'mailbox', group: 'things',
    name: 'Mailbox',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:320;--cy:58;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r flat" style="--cx:200;--cy:380;--w:420;--h:72;--r:0"></i>
      <i class="r" style="--cx:190;--cy:300;--w:52;--h:150;--k:6"></i>
      <i class="r" style="--cx:190;--cy:178;--w:270;--h:130;--r:16% 16% 5% 5% / 52% 52% 5% 5%"></i>
      <i class="r" style="--cx:308;--cy:178;--w:34;--h:130;--r:50% 50% 12% 12% / 30% 30% 5% 5%"></i>
      <i class="r" style="--cx:110;--cy:146;--w:28;--h:124;--k:14"></i>
      <i class="r" style="--cx:150;--cy:106;--w:88;--h:58;--k:12"></i>
      <i class="r" style="--cx:110;--cy:202;--w:40;--h:40"></i>
      <i class="r" style="--cx:200;--cy:250;--w:300;--h:28;--k:10"></i>
    `
  },
  {
    id: 'pickup', group: 'things',
    name: 'Pickup Truck',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:90;--cy:70;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r flat" style="--cx:200;--cy:376;--w:420;--h:64;--r:0"></i>
      <i class="r" style="--cx:126;--cy:216;--w:180;--h:56;--k:8"></i>
      <i class="r" style="--cx:278;--cy:198;--w:132;--h:124;--r:12% 40% 6% 6% / 10% 40% 6% 6%"></i>
      <i class="r" style="--cx:288;--cy:180;--w:80;--h:56;--r:10% 40% 10% 10% / 10% 40% 10% 10%"></i>
      <i class="r" style="--cx:200;--cy:264;--w:356;--h:60;--k:14"></i>
      <i class="d" style="--cx:250;--cy:250;--w:26;--h:8;--k:4"></i>
      <i class="r" style="--cx:364;--cy:250;--w:22;--h:28;--r:40%"></i>
      <i class="r" style="--cx:34;--cy:250;--w:20;--h:28;--k:6"></i>
      <i class="r" style="--cx:106;--cy:304;--w:88;--h:88"></i>
      <i class="r" style="--cx:106;--cy:304;--w:34;--h:34"></i>
      <i class="r" style="--cx:298;--cy:304;--w:88;--h:88"></i>
      <i class="r" style="--cx:298;--cy:304;--w:34;--h:34"></i>
    `
  },
  {
    id: 'blocks', group: 'things',
    name: 'Toy Blocks',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:320;--cy:62;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r flat" style="--cx:200;--cy:382;--w:420;--h:68;--r:0"></i>
      <i class="r" style="--cx:128;--cy:282;--w:134;--h:134;--k:16"></i>
      <i class="r" style="--cx:128;--cy:282;--w:72;--h:72"></i>
      <i class="r" style="--cx:272;--cy:282;--w:134;--h:134;--k:16"></i>
      <i class="r" style="--cx:272;--cy:282;--w:60;--h:60;--k:8;--rot:45deg"></i>
      <i class="r" style="--cx:200;--cy:150;--w:134;--h:134;--k:16;--rot:6deg"></i>
      <i class="r" style="--cx:200;--cy:150;--w:68;--h:68;--k:12;--rot:6deg"></i>
    `
  }
  ,
  {
    id: 'wagon', group: 'things',
    name: 'Wagon',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:96;--cy:76;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r flat" style="--cx:200;--cy:382;--w:420;--h:64;--r:0"></i>
      <i class="r" style="--cx:322;--cy:198;--w:26;--h:136;--k:13;--rot:38deg"></i>
      <i class="r" style="--cx:360;--cy:146;--w:60;--h:32;--k:15;--rot:38deg"></i>
      <i class="r" style="--cx:176;--cy:252;--w:260;--h:100;--r:6% 6% 22% 22% / 10% 10% 40% 40%"></i>
      <i class="r" style="--cx:176;--cy:256;--w:196;--h:30;--k:14"></i>
      <i class="r" style="--cx:176;--cy:206;--w:290;--h:28;--k:12"></i>
      <i class="r" style="--cx:104;--cy:314;--w:84;--h:84"></i>
      <i class="r" style="--cx:104;--cy:314;--w:32;--h:32"></i>
      <i class="r" style="--cx:250;--cy:314;--w:84;--h:84"></i>
      <i class="r" style="--cx:250;--cy:314;--w:32;--h:32"></i>
    `
  },
  {
    id: 'skateboard', group: 'things',
    name: 'Skateboard',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:96;--cy:64;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:331;--cy:223;--w:50;--h:40;--k:14;--rot:-24deg"></i>
      <i class="r" style="--cx:270;--cy:88;--w:50;--h:40;--k:14;--rot:-24deg"></i>
      <i class="r" style="--cx:130;--cy:312;--w:50;--h:40;--k:14;--rot:-24deg"></i>
      <i class="r" style="--cx:69;--cy:177;--w:50;--h:40;--k:14;--rot:-24deg"></i>
      <i class="r" style="--cx:200;--cy:200;--w:340;--h:136;--k:68;--rot:-24deg"></i>
      <i class="r" style="--cx:200;--cy:200;--w:150;--h:48;--k:24;--rot:-24deg"></i>
      <i class="r" style="--cx:312;--cy:150;--w:42;--h:42"></i>
      <i class="r" style="--cx:88;--cy:250;--w:42;--h:42"></i>
    `
  },
  {
    id: 'guitar', group: 'things',
    name: 'Guitar',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:320;--cy:70;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:160;--cy:36;--w:30;--h:30"></i>
      <i class="r" style="--cx:160;--cy:70;--w:30;--h:30"></i>
      <i class="r" style="--cx:240;--cy:36;--w:30;--h:30"></i>
      <i class="r" style="--cx:240;--cy:70;--w:30;--h:30"></i>
      <i class="r" style="--cx:200;--cy:54;--w:70;--h:76;--k:16"></i>
      <i class="r" style="--cx:200;--cy:146;--w:36;--h:150;--k:8"></i>
      <i class="r" style="--cx:200;--cy:212;--w:146;--h:132"></i>
      <i class="r" style="--cx:200;--cy:298;--w:206;--h:160"></i>
      <i class="r" style="--cx:200;--cy:250;--w:62;--h:62"></i>
      <i class="r" style="--cx:200;--cy:330;--w:84;--h:24;--k:8"></i>
      <i class="d" style="--cx:192;--cy:210;--w:4;--h:240;--k:2"></i>
      <i class="d" style="--cx:200;--cy:210;--w:4;--h:240;--k:2"></i>
      <i class="d" style="--cx:208;--cy:210;--w:4;--h:240;--k:2"></i>
    `
  },
  {
    id: 'alarmclock', group: 'things',
    name: 'Alarm Clock',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:74;--cy:94;--w:28;--h:28"></i>
      <i class="r" style="--cx:326;--cy:94;--w:28;--h:28"></i>
      <i class="r" style="--cx:100;--cy:120;--w:104;--h:58;--r:50% 50% 0 0 / 100% 100% 0 0;--rot:-45deg"></i>
      <i class="r" style="--cx:300;--cy:120;--w:104;--h:58;--r:50% 50% 0 0 / 100% 100% 0 0;--rot:45deg"></i>
      <i class="r" style="--cx:118;--cy:336;--w:40;--h:50;--k:14;--rot:30deg"></i>
      <i class="r" style="--cx:282;--cy:336;--w:40;--h:50;--k:14;--rot:-30deg"></i>
      <i class="r flat" style="--cx:200;--cy:386;--w:420;--h:64;--r:0"></i>
      <i class="r" style="--cx:200;--cy:220;--w:250;--h:250"></i>
      <i class="r" style="--cx:200;--cy:220;--w:196;--h:196"></i>
      <i class="d" style="--cx:200;--cy:136;--w:14;--h:14"></i>
      <i class="d" style="--cx:284;--cy:220;--w:14;--h:14"></i>
      <i class="d" style="--cx:200;--cy:304;--w:14;--h:14"></i>
      <i class="d" style="--cx:116;--cy:220;--w:14;--h:14"></i>
      <i class="d" style="--cx:200;--cy:186;--w:10;--h:72;--k:5"></i>
      <i class="d" style="--cx:230;--cy:220;--w:64;--h:10;--k:5"></i>
      <i class="d" style="--cx:200;--cy:220;--w:22;--h:22"></i>
    `
    },
  {
    // Tricycle, side view: one big front wheel with a pedal, a little back wheel under a step.
    id: 'tricycle', group: 'things',
    name: 'Tricycle',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:300;--cy:62;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r flat" style="--cx:200;--cy:382;--w:420;--h:64;--r:0"></i>
      <i class="r" style="--cx:186;--cy:218;--w:190;--h:28;--k:14;--rot:-30deg"></i>
      <i class="r" style="--cx:150;--cy:200;--w:26;--h:76;--k:10"></i>
      <i class="r" style="--cx:150;--cy:160;--w:104;--h:36;--k:18"></i>
      <i class="r" style="--cx:100;--cy:262;--w:120;--h:30;--k:12"></i>
      <i class="r" style="--cx:100;--cy:310;--w:96;--h:96"></i>
      <i class="r" style="--cx:100;--cy:310;--w:34;--h:34"></i>
      <i class="r" style="--cx:270;--cy:208;--w:28;--h:162;--k:12;--rot:-8deg"></i>
      <i class="r" style="--cx:240;--cy:130;--w:96;--h:26;--k:13"></i>
      <i class="r" style="--cx:192;--cy:130;--w:44;--h:36;--k:18"></i>
      <i class="r" style="--cx:282;--cy:282;--w:150;--h:150"></i>
      <i class="r" style="--cx:282;--cy:282;--w:44;--h:44"></i>
      <i class="r" style="--cx:312;--cy:316;--w:48;--h:22;--k:10"></i>
    `
  },
  {
    // Sandcastle: three towers with domed tops, a wall with a door, a little flag.
    id: 'sandcastle', group: 'things',
    name: 'Sandcastle',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:330;--cy:60;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r flat" style="--cx:200;--cy:378;--w:420;--h:76;--r:0"></i>
      <i class="d" style="--cx:200;--cy:74;--w:8;--h:56;--k:4"></i>
      <i class="r" style="--cx:224;--cy:60;--w:44;--h:30;--k:6"></i>
      <i class="r" style="--cx:92;--cy:148;--w:100;--h:52;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:308;--cy:148;--w:100;--h:52;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:200;--cy:110;--w:130;--h:62;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:92;--cy:226;--w:82;--h:150;--k:8"></i>
      <i class="r" style="--cx:308;--cy:226;--w:82;--h:150;--k:8"></i>
      <i class="r" style="--cx:200;--cy:206;--w:112;--h:190;--k:8"></i>
      <i class="r" style="--cx:200;--cy:312;--w:320;--h:100;--k:12"></i>
      <i class="r" style="--cx:200;--cy:326;--w:64;--h:72;--r:50% 50% 0 0 / 60% 60% 0 0"></i>
      <i class="r" style="--cx:92;--cy:204;--w:32;--h:40;--r:50% 50% 0 0 / 60% 60% 0 0"></i>
      <i class="r" style="--cx:308;--cy:204;--w:32;--h:40;--r:50% 50% 0 0 / 60% 60% 0 0"></i>
      <i class="r" style="--cx:200;--cy:180;--w:40;--h:48;--r:50% 50% 0 0 / 60% 60% 0 0"></i>
    `
  },
  {
    // Table lamp: the shade is one SVG path (class "r p": a rounded trapezoid), a round base with a rim, a round base with a dot, a pull bead.
    id: 'lamp', group: 'things',
    name: 'Lamp',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r flat" style="--cx:200;--cy:388;--w:420;--h:44;--r:0"></i>
      <i class="r" style="--cx:200;--cy:252;--w:32;--h:70;--k:10"></i>
      <i class="d" style="--cx:292;--cy:244;--w:6;--h:52;--k:3"></i>
      <i class="r" style="--cx:292;--cy:272;--w:26;--h:26"></i>
      <i class="r p" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"><svg viewBox="0 0 400 400"><path d="M140 62 Q200 52 260 62 Q272 64 276 76 L316 196 Q200 212 84 196 L124 76 Q128 64 140 62 Z"/></svg></i>
      <i class="r" style="--cx:200;--cy:214;--w:262;--h:32;--k:16"></i>
      <i class="r" style="--cx:146;--cy:160;--w:38;--h:38"></i>
      <i class="r" style="--cx:200;--cy:110;--w:38;--h:38"></i>
      <i class="r" style="--cx:254;--cy:160;--w:38;--h:38"></i>
      <i class="r" style="--cx:200;--cy:362;--w:200;--h:30;--k:15"></i>
      <i class="r" style="--cx:200;--cy:306;--w:150;--h:100"></i>
      <i class="r" style="--cx:200;--cy:306;--w:48;--h:48"></i>
    `
  },
  {
    // Rocking horse, side view: the curved rocker is one SVG path (class "r p"), the rest are rounded shapes.
    id: 'rockinghorse', group: 'things',
    name: 'Rocking horse',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:96;--cy:62;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r flat" style="--cx:200;--cy:390;--w:420;--h:44;--r:0"></i>
      <i class="r" style="--cx:90;--cy:214;--w:38;--h:92;--r:100% 0 100% 0;--rot:-40deg"></i>
      <i class="r" style="--cx:132;--cy:288;--w:30;--h:100;--k:12;--rot:-8deg"></i>
      <i class="r" style="--cx:268;--cy:288;--w:30;--h:100;--k:12;--rot:8deg"></i>
      <i class="r p" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"><svg viewBox="0 0 400 400"><path d="M40 296 Q200 386 360 296 Q372 312 356 326 Q200 414 44 326 Q28 312 40 296 Z"/></svg></i>
      <i class="r" style="--cx:200;--cy:226;--w:212;--h:92"></i>
      <i class="r" style="--cx:232;--cy:186;--w:44;--h:44"></i>
      <i class="r" style="--cx:244;--cy:154;--w:44;--h:44"></i>
      <i class="r" style="--cx:256;--cy:122;--w:44;--h:44"></i>
      <i class="r" style="--cx:274;--cy:166;--w:60;--h:116;--k:26;--rot:24deg"></i>
      <i class="r" style="--cx:190;--cy:186;--w:96;--h:38;--r:50% 50% 20% 20% / 100% 100% 30% 30%"></i>
      <i class="r" style="--cx:284;--cy:66;--w:38;--h:54;--r:100% 0 100% 0;--rot:-10deg"></i>
      <i class="r" style="--cx:350;--cy:128;--w:66;--h:56;--k:24;--rot:15deg"></i>
      <i class="r" style="--cx:304;--cy:108;--w:112;--h:78;--rot:15deg"></i>
      <i class="d" style="--cx:300;--cy:100;--w:16;--h:16"></i>
      <i class="d w" style="--cx:303;--cy:97;--w:6;--h:6"></i>
      <i class="d" style="--cx:368;--cy:132;--w:10;--h:10"></i>
    `
  },
  {
    // Watering can with a face: a round-cornered can, a long spout with a round sprinkler head, a handle ring at the back.
    id: 'wateringcan', group: 'things',
    name: 'Watering can',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r flat" style="--cx:200;--cy:384;--w:420;--h:64;--r:0"></i>
      <i class="r" style="--cx:62;--cy:254;--w:104;--h:144"></i>
      <i class="r" style="--cx:52;--cy:254;--w:46;--h:80"></i>
      <i class="r" style="--cx:310;--cy:186;--w:184;--h:38;--k:15;--rot:-65deg"></i>
      <i class="r" style="--cx:352;--cy:94;--w:46;--h:78;--rot:-65deg"></i>
      <i class="r" style="--cx:170;--cy:258;--w:232;--h:190;--k:38"></i>
      <i class="r" style="--cx:140;--cy:166;--w:132;--h:34"></i>
      <i class="d" style="--cx:138;--cy:250;--w:24;--h:30"></i>
      <i class="d w" style="--cx:142;--cy:242;--w:9;--h:9"></i>
      <i class="d" style="--cx:202;--cy:250;--w:24;--h:30"></i>
      <i class="d w" style="--cx:206;--cy:242;--w:9;--h:9"></i>
      <i class="r" style="--cx:104;--cy:286;--w:32;--h:22"></i>
      <i class="r" style="--cx:236;--cy:286;--w:32;--h:22"></i>
      <i class="ln" style="--cx:170;--cy:276;--w:54;--h:32"></i>
    `
  },
  {
    // Piggy bank, side view: a big round body, 4 short legs, a snout, two pointy ears, a coin over the slot.
    id: 'piggybank', group: 'things',
    name: 'Piggy bank',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r flat" style="--cx:200;--cy:384;--w:420;--h:64;--r:0"></i>
      <i class="r" style="--cx:180;--cy:74;--w:60;--h:60"></i>
      <i class="r" style="--cx:32;--cy:204;--w:36;--h:36"></i>
      <i class="r" style="--cx:100;--cy:328;--w:46;--h:52;--k:15"></i>
      <i class="r" style="--cx:156;--cy:332;--w:46;--h:52;--k:15"></i>
      <i class="r" style="--cx:226;--cy:332;--w:46;--h:52;--k:15"></i>
      <i class="r" style="--cx:282;--cy:328;--w:46;--h:52;--k:15"></i>
      <i class="r" style="--cx:228;--cy:120;--w:52;--h:78;--rot:12deg"></i>
      <i class="r" style="--cx:282;--cy:130;--w:56;--h:84;--rot:30deg"></i>
      <i class="r" style="--cx:190;--cy:226;--w:310;--h:214"></i>
      <i class="d" style="--cx:176;--cy:134;--w:64;--h:12;--k:6"></i>
      <i class="r" style="--cx:350;--cy:234;--w:72;--h:90"></i>
      <i class="d" style="--cx:339;--cy:234;--w:13;--h:22"></i>
      <i class="d" style="--cx:362;--cy:234;--w:13;--h:22"></i>
      <i class="d" style="--cx:278;--cy:192;--w:24;--h:30"></i>
      <i class="d w" style="--cx:282;--cy:184;--w:9;--h:9"></i>
      <i class="r" style="--cx:258;--cy:238;--w:32;--h:22"></i>
      <i class="ln" style="--cx:294;--cy:252;--w:36;--h:22"></i>
    `
  },
  {
    // Rubber duck floating on the water: a round body, a little tail, a big round head, a two-part beak, a wing.
    id: 'rubberduck', group: 'things',
    name: 'Rubber duck',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:48;--cy:214;--w:56;--h:92;--r:100% 0 100% 0;--rot:-6deg"></i>
      <i class="r" style="--cx:180;--cy:276;--w:320;--h:184"></i>
      <i class="r" style="--cx:156;--cy:264;--w:140;--h:80;--rot:-8deg"></i>
      <i class="r" style="--cx:336;--cy:174;--w:74;--h:32;--k:14"></i>
      <i class="r" style="--cx:254;--cy:140;--w:170;--h:170"></i>
      <i class="r" style="--cx:342;--cy:152;--w:92;--h:44;--k:22"></i>
      <i class="d" style="--cx:268;--cy:116;--w:24;--h:30"></i>
      <i class="d w" style="--cx:272;--cy:108;--w:9;--h:9"></i>
      <i class="r" style="--cx:250;--cy:172;--w:34;--h:22"></i>
      <i class="r flat" style="--cx:200;--cy:364;--w:420;--h:96;--r:0"></i>
    `
  },
  {
    // Backpack, front view: a handle loop on top, a flap with a buckle, a front pocket and two side pockets.
    id: 'backpack', group: 'things',
    name: 'Backpack',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r flat" style="--cx:200;--cy:390;--w:420;--h:44;--r:0"></i>
      <i class="r" style="--cx:200;--cy:90;--w:100;--h:64;--k:28"></i>
      <i class="r" style="--cx:200;--cy:98;--w:52;--h:30;--k:14"></i>
      <i class="r" style="--cx:84;--cy:282;--w:44;--h:104;--k:18"></i>
      <i class="r" style="--cx:316;--cy:282;--w:44;--h:104;--k:18"></i>
      <i class="r" style="--cx:200;--cy:232;--w:232;--h:272;--k:60"></i>
      <i class="r" style="--cx:200;--cy:156;--w:232;--h:120;--r:26% 26% 10% 10% / 50% 50% 20% 20%"></i>
      <i class="r" style="--cx:200;--cy:214;--w:40;--h:44;--k:8"></i>
      <i class="r" style="--cx:200;--cy:302;--w:156;--h:96;--k:28"></i>
      <i class="d" style="--cx:200;--cy:274;--w:110;--h:8;--k:4"></i>
      <i class="r" style="--cx:244;--cy:290;--w:20;--h:30;--k:8"></i>
    `
  },
  {
    id: 'cake', group: 'things',
    name: 'Birthday cake',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r flat" style="--cx:200;--cy:390;--w:420;--h:44;--r:0"></i>
      <i class="r" style="--cx:200;--cy:352;--w:340;--h:44"></i>
      <i class="r" style="--cx:200;--cy:290;--w:300;--h:120;--k:24"></i>
      <i class="r" style="--cx:200;--cy:238;--w:316;--h:36;--k:18"></i>
      <i class="r" style="--cx:150;--cy:110;--w:28;--h:72;--k:9"></i>
      <i class="r" style="--cx:200;--cy:106;--w:28;--h:72;--k:9"></i>
      <i class="r" style="--cx:250;--cy:110;--w:28;--h:72;--k:9"></i>
      <i class="r" style="--cx:150;--cy:54;--w:30;--h:42;--r:50% 50% 50% 50% / 64% 64% 36% 36%"></i>
      <i class="r" style="--cx:200;--cy:54;--w:30;--h:42;--r:50% 50% 50% 50% / 64% 64% 36% 36%"></i>
      <i class="r" style="--cx:250;--cy:54;--w:30;--h:42;--r:50% 50% 50% 50% / 64% 64% 36% 36%"></i>
      <i class="r" style="--cx:200;--cy:196;--w:220;--h:100;--k:22"></i>
      <i class="r" style="--cx:200;--cy:154;--w:236;--h:44;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:120;--cy:302;--w:40;--h:40"></i>
      <i class="r" style="--cx:200;--cy:302;--w:40;--h:40"></i>
      <i class="r" style="--cx:280;--cy:302;--w:40;--h:40"></i>
    `
  },
  {
    id: 'mug', group: 'things',
    name: 'Cocoa mug',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r flat" style="--cx:200;--cy:390;--w:420;--h:44;--r:0"></i>
      <i class="r" style="--cx:190;--cy:352;--w:330;--h:48"></i>
      <i class="r" style="--cx:296;--cy:236;--w:124;--h:136"></i>
      <i class="r" style="--cx:300;--cy:236;--w:60;--h:72"></i>
      <i class="r" style="--cx:180;--cy:240;--w:220;--h:220;--k:30"></i>
      <i class="r" style="--cx:180;--cy:264;--w:220;--h:50;--r:0"></i>
      <i class="r" style="--cx:180;--cy:142;--w:196;--h:40"></i>
      <i class="r" style="--cx:150;--cy:128;--w:44;--h:36;--k:10;--rot:-10deg"></i>
      <i class="r" style="--cx:208;--cy:122;--w:44;--h:36;--k:10;--rot:12deg"></i>
    `
  },
  {
    id: 'top', group: 'things',
    name: 'Spinning top',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r flat" style="--cx:200;--cy:390;--w:420;--h:44;--r:0"></i>
      <i class="r" style="--cx:200;--cy:296;--w:104;--h:104;--k:22;--rot:45deg"></i>
      <i class="r" style="--cx:200;--cy:96;--w:30;--h:84;--k:12"></i>
      <i class="r" style="--cx:200;--cy:56;--w:48;--h:48"></i>
      <i class="r" style="--cx:200;--cy:222;--w:310;--h:184"></i>
      <i class="r" style="--cx:200;--cy:222;--w:310;--h:60"></i>
      <i class="r" style="--cx:200;--cy:142;--w:124;--h:44;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r" style="--cx:128;--cy:170;--w:42;--h:42"></i>
      <i class="r" style="--cx:272;--cy:170;--w:42;--h:42"></i>
      <i class="r" style="--cx:128;--cy:274;--w:42;--h:42"></i>
      <i class="r" style="--cx:272;--cy:274;--w:42;--h:42"></i>
    `
  },
  {
    id: 'wheelbarrow', group: 'things',
    name: 'Wheelbarrow',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r flat" style="--cx:200;--cy:390;--w:420;--h:44;--r:0"></i>
      <i class="r" style="--cx:272;--cy:236;--w:196;--h:26;--k:12;--rot:-18deg"></i>
      <i class="r" style="--cx:282;--cy:326;--w:26;--h:90;--k:10;--rot:-6deg"></i>
      <i class="r" style="--cx:196;--cy:298;--w:210;--h:24;--k:12;--rot:-4deg"></i>
      <i class="r" style="--cx:186;--cy:232;--w:260;--h:124;--r:10% 10% 40% 40% / 20% 20% 80% 80%"></i>
      <i class="r" style="--cx:186;--cy:172;--w:284;--h:30;--k:15"></i>
      <i class="r" style="--cx:110;--cy:322;--w:104;--h:104"></i>
      <i class="r" style="--cx:110;--cy:322;--w:42;--h:42"></i>
      <i class="r" style="--cx:354;--cy:210;--w:54;--h:32;--k:15;--rot:-18deg"></i>
    `
  },
  {
    // Beach ball: one big ball on the sand, three curved bands from pole to pole and a round cap on top.
    id: 'beachball', group: 'things',
    name: 'Beach ball',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r flat" style="--cx:200;--cy:390;--w:420;--h:44;--r:0"></i>
      <i class="r" style="--cx:200;--cy:216;--w:300;--h:300"></i>
      <i class="r" style="--cx:200;--cy:216;--w:220;--h:300"></i>
      <i class="r" style="--cx:200;--cy:216;--w:136;--h:300"></i>
      <i class="r" style="--cx:200;--cy:216;--w:56;--h:300"></i>
      <i class="r" style="--cx:200;--cy:78;--w:64;--h:44"></i>
    `
  },
  {
    // Xylophone: six bars from long to short on two slanted rails, a nail dot at each end, a mallet in front.
    id: 'xylophone', group: 'things',
    name: 'Xylophone',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r flat" style="--cx:200;--cy:390;--w:420;--h:44;--r:0"></i>
      <i class="r" style="--cx:200;--cy:128;--w:300;--h:26;--k:13;--rot:14.6deg"></i>
      <i class="r" style="--cx:200;--cy:270;--w:300;--h:26;--k:13;--rot:-14.6deg"></i>
      <i class="r" style="--cx:85;--cy:200;--w:40;--h:230;--k:14"></i>
      <i class="r" style="--cx:131;--cy:200;--w:40;--h:206;--k:14"></i>
      <i class="r" style="--cx:177;--cy:200;--w:40;--h:182;--k:14"></i>
      <i class="r" style="--cx:223;--cy:200;--w:40;--h:158;--k:14"></i>
      <i class="r" style="--cx:269;--cy:200;--w:40;--h:134;--k:14"></i>
      <i class="r" style="--cx:315;--cy:200;--w:40;--h:110;--k:14"></i>
      <i class="d" style="--cx:85;--cy:99;--w:12;--h:12"></i>
      <i class="d" style="--cx:131;--cy:111;--w:12;--h:12"></i>
      <i class="d" style="--cx:177;--cy:123;--w:12;--h:12"></i>
      <i class="d" style="--cx:223;--cy:135;--w:12;--h:12"></i>
      <i class="d" style="--cx:269;--cy:147;--w:12;--h:12"></i>
      <i class="d" style="--cx:315;--cy:159;--w:12;--h:12"></i>
      <i class="d" style="--cx:85;--cy:300;--w:12;--h:12"></i>
      <i class="d" style="--cx:131;--cy:288;--w:12;--h:12"></i>
      <i class="d" style="--cx:177;--cy:276;--w:12;--h:12"></i>
      <i class="d" style="--cx:223;--cy:264;--w:12;--h:12"></i>
      <i class="d" style="--cx:269;--cy:252;--w:12;--h:12"></i>
      <i class="d" style="--cx:315;--cy:240;--w:12;--h:12"></i>
      <i class="r" style="--cx:186;--cy:344;--w:210;--h:24;--k:12"></i>
      <i class="r" style="--cx:314;--cy:344;--w:62;--h:62"></i>
    `
  },
  {
    // Sand pail: a bucket full of sand with a round handle, a stripe round its middle and a spade stuck in the sand.
    id: 'pail', group: 'things',
    name: 'Sand pail',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r flat" style="--cx:200;--cy:390;--w:420;--h:44;--r:0"></i>
      <i class="r" style="--cx:200;--cy:100;--w:254;--h:140;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:200;--cy:110;--w:218;--h:120;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:262;--cy:96;--w:24;--h:130;--k:10;--rot:18deg"></i>
      <i class="r" style="--cx:283;--cy:38;--w:60;--h:30;--k:14;--rot:18deg"></i>
      <i class="r" style="--cx:200;--cy:146;--w:206;--h:64;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:200;--cy:262;--w:226;--h:214;--r:6% 6% 30% 30% / 6% 6% 26% 26%"></i>
      <i class="r" style="--cx:200;--cy:262;--w:226;--h:56;--r:0"></i>
      <i class="r" style="--cx:200;--cy:170;--w:254;--h:38;--k:19"></i>
    `
  },
  {
    // Pencil: one big pencil lying slanted: eraser, metal band, the long body with a stripe, the wooden tip and the lead.
    id: 'pencil', group: 'things',
    name: 'Pencil',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r flat" style="--cx:200;--cy:390;--w:420;--h:44;--r:0"></i>
      <i class="r" style="--cx:313;--cy:147;--w:78;--h:78;--k:10;--rot:20deg"></i>
      <i class="r" style="--cx:341;--cy:134;--w:34;--h:34;--k:6;--rot:20deg"></i>
      <i class="r" style="--cx:65;--cy:263;--w:64;--h:110;--r:46% 10% 10% 46% / 50% 14% 14% 50%;--rot:-25deg"></i>
      <i class="r" style="--cx:200;--cy:200;--w:250;--h:110;--k:8;--rot:-25deg"></i>
      <i class="r" style="--cx:200;--cy:200;--w:250;--h:36;--r:0;--rot:-25deg"></i>
      <i class="r" style="--cx:82;--cy:255;--w:38;--h:122;--k:8;--rot:-25deg"></i>
    `
  },
  {
    id: 'crayon', group: 'things',
    name: 'Crayon',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:320;--cy:70;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r flat" style="--cx:200;--cy:382;--w:420;--h:56;--r:0"></i>
      <i class="r" style="--cx:200;--cy:90;--w:106;--h:104;--r:44% 44% 6% 6% / 92% 92% 6% 6%"></i>
      <i class="r" style="--cx:200;--cy:236;--w:140;--h:248;--k:12"></i>
      <i class="r" style="--cx:200;--cy:250;--w:160;--h:184;--k:8"></i>
      <i class="r" style="--cx:200;--cy:178;--w:160;--h:30;--k:4"></i>
      <i class="r" style="--cx:200;--cy:322;--w:160;--h:30;--k:4"></i>
      <i class="r" style="--cx:200;--cy:250;--w:104;--h:72"></i>
    `
  },
  {
    id: 'trafficlight', group: 'things',
    name: 'Traffic Light',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:80;--cy:66;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r flat" style="--cx:200;--cy:384;--w:420;--h:52;--r:0"></i>
      <i class="r" style="--cx:200;--cy:320;--w:40;--h:90;--k:6"></i>
      <i class="r" style="--cx:200;--cy:366;--w:110;--h:30;--k:10"></i>
      <i class="r" style="--cx:200;--cy:40;--w:70;--h:30;--k:8"></i>
      <i class="r" style="--cx:200;--cy:168;--w:150;--h:250;--k:30"></i>
      <i class="r" style="--cx:200;--cy:94;--w:66;--h:66"></i>
      <i class="r" style="--cx:200;--cy:168;--w:66;--h:66"></i>
      <i class="r" style="--cx:200;--cy:242;--w:66;--h:66"></i>
    `
  },
  {
    id: 'hydrant', group: 'things',
    name: 'Fire Hydrant',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:320;--cy:62;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r flat" style="--cx:200;--cy:384;--w:420;--h:52;--r:0"></i>
      <i class="r" style="--cx:96;--cy:248;--w:24;--h:66;--k:8"></i>
      <i class="r" style="--cx:304;--cy:248;--w:24;--h:66;--k:8"></i>
      <i class="r" style="--cx:122;--cy:248;--w:52;--h:50;--k:8"></i>
      <i class="r" style="--cx:278;--cy:248;--w:52;--h:50;--k:8"></i>
      <i class="r" style="--cx:200;--cy:350;--w:196;--h:34;--k:10"></i>
      <i class="r" style="--cx:200;--cy:98;--w:42;--h:36;--k:8"></i>
      <i class="r" style="--cx:200;--cy:145;--w:150;--h:76;--r:50% 50% 0 0 / 100% 100% 0 0"></i>
      <i class="r" style="--cx:200;--cy:250;--w:130;--h:190;--k:16"></i>
      <i class="r" style="--cx:200;--cy:170;--w:166;--h:30;--k:10"></i>
      <i class="r" style="--cx:200;--cy:262;--w:66;--h:66"></i>
      <i class="r" style="--cx:200;--cy:262;--w:28;--h:28"></i>
    `
  },
  {
    id: 'toaster', group: 'things',
    name: 'Toaster',
    html: `
      <i class="r bg" style="--cx:200;--cy:200;--w:400;--h:400;--r:0"></i>
      <i class="r" style="--cx:80;--cy:62;--w:110;--h:50;--r:50% 50% 30% 30% / 80% 80% 20% 20%"></i>
      <i class="r flat" style="--cx:200;--cy:384;--w:420;--h:52;--r:0"></i>
      <i class="r" style="--cx:120;--cy:350;--w:46;--h:30;--k:8"></i>
      <i class="r" style="--cx:280;--cy:350;--w:46;--h:30;--k:8"></i>
      <i class="r" style="--cx:155;--cy:150;--w:92;--h:104;--r:46% 46% 12% 12% / 40% 40% 12% 12%"></i>
      <i class="r" style="--cx:245;--cy:150;--w:92;--h:104;--r:46% 46% 12% 12% / 40% 40% 12% 12%"></i>
      <i class="r" style="--cx:155;--cy:148;--w:62;--h:66;--r:46% 46% 12% 12% / 40% 40% 12% 12%"></i>
      <i class="r" style="--cx:245;--cy:148;--w:62;--h:66;--r:46% 46% 12% 12% / 40% 40% 12% 12%"></i>
      <i class="r" style="--cx:344;--cy:226;--w:36;--h:26;--k:8"></i>
      <i class="r" style="--cx:200;--cy:256;--w:270;--h:182;--r:30% 30% 12% 12% / 40% 40% 12% 12%"></i>
      <i class="r" style="--cx:200;--cy:302;--w:270;--h:32;--r:0"></i>
      <i class="r" style="--cx:136;--cy:244;--w:50;--h:50"></i>
    `
  }
);
