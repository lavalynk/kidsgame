# Art drop folder

Put coloring-page images here and they become pages in the game.

## How to add art

- **One picture per image:** save it here as `art/<name>.png` (or .jpg / .webp).
  The file name becomes the page name: `red-dragon.png` → "Red Dragon".
- **A sheet with many pictures in a grid:** save it in `art/sheets/`. The next
  daily run cuts it up, names each picture, and skips repeats. You can also
  leave a note in ROADMAP.md saying what's on it.

Then the daily run (or anyone) runs:

```
python3 tools/split_sheet.py art/sheets/<sheet>.png <cols> <rows> name1 name2 ...   # sheets only
python3 tools/trace_art.py
```

**Tabs:** pages go in the Animals tab unless `art/groups.json` lists them under
another tab (right now just `fruit`). Add new fruit there. A brand-new kind of
page (vehicles, say) would also need a new tab button in `coloring/index.html`.

`trace_art.py` turns every image in `art/` into `coloring/traced.js`, with each
enclosed white area as its own tappable region.

## Getting good results (Firefly / Adobe Express prompt)

> simple coloring page for toddlers, cute cartoon **[animal]**, thick bold black
> outlines, plain white background, no shading, no gray, no color, large simple
> shapes, centered, one animal

What works best:
- **Thick, closed outlines.** Small gaps get closed automatically, but big
  openings (like an open-topped crown) can let color leak.
- **White background, no shading or gray fill.** Light color on the art is OK.
- **Big shapes.** Tiny details are too small for little fingers and get merged.
- **Original characters only.** No known cartoon characters.

Already in the game: bunny, butterfly, cat, dog, dolphin, dragon, duck,
elephant, fish, fox, giraffe, hippo, horse, lion, monkey, owl, penguin, snail,
tiger, turtle, unicorn, whale, zebra, apple, avocado, banana, blueberries,
cherries, coconut, fig, grapes, kiwi, lemon, mango, orange, papaya, peach, pear,
pineapple, pomegranate, raspberry, strawberry, watermelon. (Hand-drawn: bird.)

Swapping in a better version: save it with the same name and move the old file
to `art/replaced/` (kept for reference, not used in the game).

`art/removed/` holds pictures Keith didn't like — don't add them back. The bear
is currently out of the game (Keith removed it); only add a bear if he sends new art.
