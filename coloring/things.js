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
  }
);
