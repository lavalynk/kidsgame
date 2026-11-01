"""Add/refresh a ?v=... tag on every local .js/.css link in the game pages.

Browsers (and GitHub Pages) keep old copies of scripts for a while, so after a
change kids may still get the old game. A new ?v= makes every browser fetch the
new files. Run this before every commit:   python3 tools/bump_version.py
"""
import glob, re, time
v = time.strftime('%Y%m%d%H%M')
pages = ['index.html'] + glob.glob('*/index.html')
pat = re.compile(r'((?:src|href)="(?!https?:)[^"]+\.(?:js|css))(?:\?v=\d+)?"')
for p in pages:
    s = open(p).read()
    n = pat.sub(lambda m: f'{m.group(1)}?v={v}"', s)
    if n != s:
        open(p, 'w').write(n)
        print('bumped', p)
