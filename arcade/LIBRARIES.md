# Outside libraries in the arcade

The arcade is plain HTML/CSS/JavaScript with no build step. These library files are copied
into the repo (so everything works offline) and loaded with a normal `<script>` tag.
Keith picked each one (Nov 20).

| File | Library | What it does here | License |
|---|---|---|---|
| `arcade/phaser.min.js` | Phaser 3.80.1 (Nov 24: the `phaser-arcade-physics.min.js` build = without the unused Matter physics) | Jungle Jump's world engine (physics bodies, collisions) + the canvas menus (`arcade/canvasmenu.js`) | MIT, see `arcade/PHASER-LICENSE.md` |
| `arcade/rexui.min.js` | Rex UI plugin (phaser3-rex-plugins 1.80.8; Nov 24: our own small build with only the 7 parts the menus use, 268 KB instead of 824 KB: `tools/make_rexui.py` + `tools/rexui/entry.mjs`) | Buttons, wrapping grids, scrolling panels and sliders for the canvas menus | MIT, see `arcade/REXUI-LICENSE` |
| `arcade/gsap.min.js` | GSAP 3.12.5 | Menus pop in and tiles bounce in one by one; buttons squish when pressed (`popIn()` and the squish in `arcade/shared.js`). Every page loads it before `shared.js`; without it menus just appear. | GSAP "no charge" standard license (free, incl. commercial): https://gsap.com/standard-license |
| `arcade/swiper.min.js` + `swiper.min.css` | Swiper 11.1.4 | The Sticker Book's fallback book (without Phaser) turns its pages with a swipe or the big arrows (`stickers/book.js` loads the file itself only then, Nov 24) | MIT, see `arcade/SWIPER-LICENSE` |
| `arcade/matter.min.js` | Matter.js 0.20.0 (Nov 27, 20-point plan #3, from npm `matter-js`, 82 KB) | Claw Catch's real physics: the plush toys roll, tumble and lean on each other, the claw's finger tips push toys aside, a grabbed toy hangs on a spring. Loaded ONLY by `claw/index.html` (`tests/test_speed.py` checks) | MIT, see `arcade/MATTER-LICENSE` |
| `arcade/fonts/LilitaOne.woff2` | Lilita One font | Chunky letters for logos and menu titles | SIL Open Font License, see `arcade/fonts/LilitaOne-OFL.txt` |
| `arcade/fonts/Fredoka-600.woff2` | Fredoka font (Nov 23, from npm `@fontsource/fredoka`) | Round, friendly words on tiles, buttons and menus (it looks the same on every phone, unlike the phone's own fonts) | SIL Open Font License, see `arcade/fonts/Fredoka-OFL.txt` |

Updating one: download the new version from npm (`npm pack gsap@x.y.z`), copy the same file over (Phaser + Rex UI:
change the versions at the top of `tools/make_rexui.py` and run it),
run `python3 tools/bump_version.py`, and run the tests.

**The glossy menu look (Nov 23)** uses parts of these that were already here rather than another library: Phaser's
particles (the floating sparkles and light bubbles), Phaser's WebGL effects `preFX.addShine` (the shine that sweeps across a
logo's name) and `preFX.addGlow` (the big Play button's glow), and Rex UI's `roundRectangleCanvas` (the panel's color
blend). See "The glossy arcade look" and "Logos" in `arcade/canvasmenu.js`.
