# Changelog

Newest first. Written for humans.

## 2026-10-30 — 18 new pictures, veggies, and no more suns
- **Took the suns out** of every picture (cat, bird, watermelon, house, sailboat).
- **6 new animals:** lion, elephant, pig, owl, penguin, duck.
- **6 new fruit & veggies:** grapes, pineapple, lemon, carrot, corn, broccoli.
  Veggies live in the fruit tab.
- **6 new things:** bus, fire truck, rocket (with stars), helicopter, tractor, castle.
- Now 36 pictures: animals 12, fruit & veggies 13, things 11. Each run adds 18 more
  until every tab has 30.

## 2026-10-30 — Hand-drawn pictures, plus a "things that go" tab
- **All pictures are now drawn by Claude** in your style: cute cartoon, thick bold
  black outlines, white, big simple shapes. The converted Firefly pages (wobbly lines,
  cut-off butterfly) are no longer in the game.
- **Animals (6):** cat, fish, bird, plus new dog, bunny (with a carrot), and turtle.
- **Fruit (7):** apple, banana, strawberry, pear, cherries, orange, watermelon — each
  with a happy face.
- **New third tab — a little car — for things (5):** car, airplane, house, sailboat, train.
- Outlines are thicker everywhere so they look bold, like a real coloring book.
- Fewer pictures than before (18 vs. 44) for now; new ones get added each run.

## 2026-10-30 — Picture picker
- **New picker screen.** Tapping Coloring now opens a big grid of every picture,
  so kids can jump straight to the one they want instead of pressing the arrows
  40 times.
- **Two picture tabs** at the top: a cat face for Animals (24) and an apple for
  Fruit (20). No words needed.
- The little pictures show the colors the child has already added, so they can
  find the one they were working on.
- On a picture, the new four-squares button (top left) goes back to the grid.
  The phone's back button does the same. The arrows now flip through just that tab.
- Which tab a picture goes in is set in `art/groups.json` — anything not listed
  there counts as an animal.

## 2026-10-30 — Bear removed
- Took the bear out at Keith's request (picture moved to `art/removed/`).

## 2026-10-30 — The dragon is here
- **New:** dragon, unicorn, tiger, and a new fish (replaces the hand-drawn one).
- **Upgraded:** cat, dog, lion, bunny, horse, bear, and elephant now use Keith's
  cleaner single pictures instead of the versions from the photo sheet. They're
  sharper and have more parts to color.
- The converter now also ignores the edge or shadow of a sheet of paper.

## 2026-10-30 — 40 new pages from Keith's art
- **New art converter.** Drop coloring-page images (Firefly, Adobe Express...) into
  `art/` — or a whole grid of them into `art/sheets/` — and they become tappable
  pages. It finds every enclosed area, closes small breaks in the lines, cleans up
  card borders, and zooms in on the drawing.
- **20 animals:** bear, bunny, butterfly, cat (the new sleepy cat replaces the old one),
  dog, dolphin, duck, elephant, fox, giraffe, hippo, horse, lion, monkey, owl,
  penguin, snail, turtle, whale, zebra.
- **20 fruits** (repeats skipped): apple, avocado, banana, blueberries, cherries,
  coconut, fig, grapes, kiwi, lemon, mango, orange, papaya, peach, pear, pineapple,
  pomegranate, raspberry, strawberry, watermelon.
- `art/README.md` has the Firefly prompt that works best.

## 2026-10-30 — Art upgrade
- Redrew the cat, fish, and bird in a cuter style: bigger heads, shiny eyes, blush cheeks,
  and more parts to color (inner ears, belly, stripes, fins, wing).
- Every picture now has a little scene to color too: sky or water, sun, cloud, bubbles,
  grass, seaweed, a flower, a branch with leaves.
- The picture is always a square now, so the background fills edge to edge on phones.
- Added an art style guide to the dev playbook so all 50 animals match.

## 2026-10-30 — Day 1: foundation
- Set up the project: roadmap, changelog, and instructions for the daily dev runs.
- **Hub screen**: two big picture buttons — the paint palette opens the coloring game,
  the maze button shows a "coming soon" wiggle for now.
- **Coloring game**: tap any part of a picture to fill it with the chosen crayon.
  12 big crayon colors, undo, start-over, and a home button. Arrows switch animals.
- **First three animals**: cat, fish, and bird.
