# Outside libraries in the arcade

The arcade is plain HTML/CSS/JavaScript with no build step. These library files are copied
into the repo (so everything works offline) and loaded with a normal `<script>` tag.
Keith picked each one (Nov 20).

| File | Library | What it does here | License |
|---|---|---|---|
| `jungle/phaser.min.js` | Phaser 3.80.1 | Jungle Jump's world engine (physics bodies, collisions) | MIT, see `jungle/PHASER-LICENSE.md` |
| `arcade/gsap.min.js` | GSAP 3.12.5 | Menus pop in and tiles bounce in one by one; buttons squish when pressed (`popIn()` and the squish in `arcade/shared.js`). Every page loads it before `shared.js`; without it menus just appear. | GSAP "no charge" standard license (free, incl. commercial): https://gsap.com/standard-license |
| `arcade/swiper.min.js` + `swiper.min.css` | Swiper 11.1.4 | The Sticker Book turns its pages with a swipe or the big arrows (`stickers/book.js`) | MIT, see `arcade/SWIPER-LICENSE` |

Updating one: download the new version from npm (`npm pack gsap@x.y.z`), copy the same file over,
run `python3 tools/bump_version.py`, and run the tests.
