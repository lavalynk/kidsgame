# Roadmap

The daily run works top-down through **Up next**. Keith can reorder, add, or cross
things off anytime — or leave notes below.

## Notes from Keith

_(Add requests here, e.g. "make the dragon bigger" — the next run handles these first.)_

## Up next

### Kids Arcade (Keith's 9-game brief, Oct 31)
- [x] Shared arcade kit (`arcade/`): game loop, input + touch buttons, difficulty, pause,
      how-to-play, level picker, results with stars/medals, sounds + music, saving
- [x] Hub with 9 game cards (3 x 3), progress shown on each card
- [x] Turbo Bike Challenge — 5 tracks, heat, lanes, landings, crashes, medals, ghost, 4 bikes, track builder
- [x] Mini RC Racers — 3 tracks, 3 computer racers, laps/positions, oil/puddles, shortcut, items, 4 cars
- [x] RC rework (Keith): 8 tracks, no difficulty setting, all cars equal, coins per race, garage upgrades (engine, tires, turbo, nitro)
- [x] Hoop Heroes — 30 s / 60 s modes + challenge levels, moving hoops, streaks, ball designs
- [x] Bullseye Adventure — 9 levels in 3 places + practice, wind, balloons, wheels, moving targets, hats
- [x] Jungle Jump — 4 worlds (forest, cave, snow, candy), checkpoints, treasure, 5 heroes
- [x] Space Defender — 3 sectors with bosses + endless mode, power-ups, combos, ships
- [x] Fishing Frenzy — 3 places, relax + frenzy modes, nibble/bite timing, reeling, fish book, rods
- [x] Coloring book upgrades: brush + sizes, eraser, redo, 2 crayon boxes + any color, 10 stickers, auto-save + gallery
- [x] Maze upgrades: Easy/Normal/Challenge sizes, 4 color themes, key + locked door, gems & stars, hint bulb, arrow keys, saved progress + medals
- [ ] Second level per Jungle world; more Space sectors
- [x] RC Grand Prix: all 8 tracks in a row, garage between races, points + trophy; free play on any track
- [x] RC items: triple boost, super star, honey, coin bag (plus boost, shield, bubble)
- [ ] RC ideas: coins to pick up on the track, a shortcut on some new tracks

### Coloring game
- [x] Hub screen with big picture buttons for each game
- [x] Coloring game: tap-to-fill with a big crayon palette, undo, clear, back to hub
- [x] Art converter: Firefly line art in `art/` becomes tappable coloring pages
- [x] 20 animals from Keith's first sheet + 20 fruits from his second sheet
- [x] Page picker screen: thumbnails of every page, grouped into Animals and Fruit tabs
      (picture tabs, no words) — there are 44 pages now, arrows alone are too slow
- [x] **Dragon** (plus unicorn and tiger) from Keith's Firefly art
- [ ] Sound effects: soft "pop" on fill, cheerful jingle when a picture is finished
- [ ] "Done!" celebration (confetti/stars) when every region is colored
- [ ] Save finished pictures to a gallery on the device
- [x] Switch to hand-drawn art in Keith's style (thick outlines, big simple shapes):
      6 animals, 7 fruits, 5 things that go, with a third picker tab (car)
- [ ] **Grow every tab to 30 pages — 18 new pages per run (6 + 6 + 6)** (Keith, Oct 30).
      No suns in pictures. Veggies go in the fruit tab.
      - Animals 12/30: cat, fish, bird, dog, bunny, turtle, lion, elephant, pig, owl, penguin, duck.
        Ideas (never the bear): cow, horse, sheep, frog, monkey, giraffe, zebra, fox,
        hedgehog, snail, butterfly, ladybug, bee, whale, octopus, crab, dinosaur
      - Fruit & veggies 13/30: apple, banana, strawberry, pear, cherries, orange, watermelon,
        grapes, pineapple, lemon, carrot, corn, broccoli.
        Ideas: peach, kiwi, avocado, mushroom, tomato, pumpkin, peas, potato, onion,
        eggplant, coconut, blueberries, mango, pepper, cucumber, lettuce, radish
      - Things 11/30: car, airplane, house, sailboat, train, bus, fire truck, rocket,
        helicopter, tractor, castle.
        Ideas: truck, police car, ambulance, bicycle, scooter, motorcycle, digger,
        submarine, hot-air balloon, ship, garbage truck, school, tent, lighthouse, barn, tow truck
- [ ] Brush/free-draw mode in addition to tap-to-fill
- [ ] Sparkle/pattern colors (rainbow, stripes, dots)

### Maze game
- [x] Maze game: drag a finger/animal from start to goal, wide paths, no walls-hurt
- [x] Shape changes after each completed maze (circle → heart → square → diamond → star)
- [x] Friendly character + reward at the end of each maze (bee → flower, bunny → carrot,
      mouse → cheese) with a star burst and a little jingle
- [x] Gentle difficulty steps (5x5 grid → 6x6 → 7x7, then stays at 7x7)
- [ ] More maze friends (puppy → bone, monkey → banana, fish → shell...)
- [ ] "Show me" hint: after a while with no progress, the path gently sparkles

### Polish
- [ ] Background music toggle (off by default) and mute button
- [ ] Add to Home Screen support (PWA / offline play)
- [x] Publish on GitHub Pages
- [ ] Accessibility pass (contrast, reduced motion)

## Done
See `CHANGELOG.md`.
