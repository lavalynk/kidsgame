"""Write jukebox/songs.js: every song in the arcade, for the Jukebox page.

The songs live inside each game's own .js file (a recipe like `music: { tempo: 150, ... }`),
and the Jukebox can't load all the games just to borrow their music. So this copies the
recipes into one small file. tools/bump_version.py runs it before every commit, so a new
or changed song shows up in the Jukebox by itself (tests/test_jukebox.py checks it's fresh).

Run:  python3 tools/make_jukebox.py
"""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# the games in hub order, and the files their songs are in (coloring + maze got one each, Nov 22)
GAMES = [
    ('arcade', ['arcade/shared.js']), ('bike', ['bike/bike.js']), ('rc', ['rc/rc.js']), ('hoops', ['hoops/hoops.js']),
    ('golf', ['golf/golf.js']), ('archery', ['archery/archery.js']), ('jungle', ['jungle/jungle.js']),
    ('trail', ['trail/trail.js']), ('quest', ['quest/quest.js']), ('space', ['space/space.js', 'space/data.js']),
    ('abc', ['abc/abc.js']),
    ('coloring', ['coloring/coloring.js']), ('maze', ['maze/maze.js']), ('fishing', ['fishing/fishing.js']), ('piano', ['piano/piano.js']),
]
# arcade/shared.js has a few spare songs no game uses: only the hub's own song goes in
ONLY = {'arcade/shared.js': {'arcade'}}


def recipes(path):
    """Every `name: { tempo: ... prog: ... }` in a file, in order: (name, text)."""
    src = open(os.path.join(ROOT, path)).read()
    out = []
    for m in re.finditer(r"(\w+)\s*[:=]\s*\{\s*tempo:", src):
        i = src.index('{', m.start()); depth = 0
        for j in range(i, len(src)):
            depth += src[j] == '{'; depth -= src[j] == '}'
            if depth == 0: break
        text = src[i:j + 1]
        if 'prog:' not in text: continue
        if path in ONLY and m.group(1) not in ONLY[path]: continue
        # one line per song: squash the spaces at the start of each line
        out.append((m.group(1), re.sub(r'\n\s*', ' ', text)))
    return out


def build():
    lines = []
    for game, files in GAMES:
        songs = [r for f in files for r in recipes(f)]
        # the title-screen song first (it's the one kids know best)
        songs.sort(key=lambda r: 0 if r[0] in ('menuMusic', 'MENU_SONG') else 1)
        for n, (name, text) in enumerate(songs, 1):
            lines.append(f"  {{ game: '{game}', n: {n}, from: '{name}', song: {text} }},")
    return ('// Every song in the arcade, for the Jukebox (jukebox/jukebox.js).\n'
            '// MADE BY tools/make_jukebox.py from the games\' own song recipes: don\'t edit it by hand,\n'
            '// change the song in its game and run the tool (bump_version.py runs it too).\n'
            'window.JUKEBOX_SONGS = [\n' + '\n'.join(lines) + '\n];\n')


if __name__ == '__main__':
    out = os.path.join(ROOT, 'jukebox', 'songs.js')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    text = build()
    old = open(out).read() if os.path.exists(out) else ''
    if text != old:
        open(out, 'w').write(text)
        print('wrote', out, text.count('game:'), 'songs')
