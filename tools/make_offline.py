"""Write the offline file list + a new version into sw.js (run by bump_version.py).

Every file a game needs goes in the list: the pages, their scripts and styles,
the font and the app icons. Dev-only folders (art, tools, tests, server) are left out.
"""
import glob, os, re, sys, time
os.chdir(os.path.join(os.path.dirname(__file__), '..'))
SKIP = ('art/', 'tools/', 'tests/', 'server/', 'node_modules/')
files = ['./', 'index.html', 'manifest.webmanifest']
for pat in ['*/index.html', '*/*.js', '*/*.css', 'css/*.css', 'arcade/fonts/*', 'icons/*.png']:
    for f in sorted(glob.glob(pat)):
        f = f.replace(os.sep, '/')
        if f.startswith(SKIP) or f == 'coloring/traced.js' or f in files: continue
        files.append(f)
# the version = the ?v= that bump_version.py put on the script links (the service worker saves scripts under that name)
version = sys.argv[1] if len(sys.argv) > 1 else time.strftime('%Y%m%d%H%M')
block = "// ---- generated: start ----\nconst VERSION = '%s';\nconst FILES = [\n%s\n];\n// ---- generated: end ----" % (
    version, ',\n'.join("  '%s'" % f for f in files))
s = open('sw.js').read()
s = re.sub(r'// ---- generated: start ----.*?// ---- generated: end ----', lambda m: block, s, flags=re.S)
open('sw.js', 'w').write(s)
print('sw.js: %d files, version %s' % (len(files), version))
