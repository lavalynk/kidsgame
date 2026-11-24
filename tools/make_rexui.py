"""Make the SMALL Rex UI file (arcade/rexui.min.js) and copy the smaller Phaser file (Nov 24, point 9 "faster").

Why: every page loads Phaser + Rex UI for its menus. The full Rex UI is 844 KB (about 90 kinds of menu parts),
but the arcade only uses 7 of them (round rectangles, sizers, a scrolling panel and a slider). This builds a Rex UI
with only those 7: about 270 KB, so every page has much less to read before its first menu shows.
Phaser: `phaser-arcade-physics.min.js` is the same Phaser 3.80.1 without the "Matter" physics nobody here uses.

Run (needs Node + npm and the internet; only when updating the libraries):   python3 tools/make_rexui.py
It installs phaser3-rex-plugins + esbuild into a temporary folder, bundles tools/rexui/entry.mjs and copies the
results into arcade/. If a menu ever needs another Rex UI part, add its Factory import to tools/rexui/entry.mjs
(the list in phaser3-rex-plugins/templates/ui/ui-plugin.js) and run this again.
"""
import pathlib, shutil, subprocess, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
REX, PHASER, ESBUILD = '1.80.8', '3.80.1', '0.24.0'

with tempfile.TemporaryDirectory() as tmp:
    tmp = pathlib.Path(tmp)
    subprocess.run(['npm', 'init', '-y'], cwd=tmp, check=True, capture_output=True)
    subprocess.run(['npm', 'install', f'phaser3-rex-plugins@{REX}', f'phaser@{PHASER}', f'esbuild@{ESBUILD}'],
                   cwd=tmp, check=True)
    shutil.copy(ROOT / 'tools' / 'rexui' / 'entry.mjs', tmp / 'entry.mjs')
    subprocess.run(['npx', 'esbuild', 'entry.mjs', '--bundle', '--minify', '--format=iife', '--target=es2017',
                    '--legal-comments=none', '--outfile=rexui.min.js'], cwd=tmp, check=True)
    shutil.copy(tmp / 'rexui.min.js', ROOT / 'arcade' / 'rexui.min.js')
    shutil.copy(tmp / 'node_modules' / 'phaser' / 'dist' / 'phaser-arcade-physics.min.js', ROOT / 'arcade' / 'phaser.min.js')
    for f in ['rexui.min.js', 'phaser.min.js']:
        print(f, (ROOT / 'arcade' / f).stat().st_size // 1024, 'KB')
print('Done. Now run python3 tools/bump_version.py and the tests.')
