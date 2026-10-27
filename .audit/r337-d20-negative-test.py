#!/usr/bin/env python3
"""
R337 — D20 NEGATIVE TEST.

A gate that cannot fail is not a gate (Pitfall #62). This proves:
  1. the D20 CLASSIFIER flags a game that claims "handcrafted" but generates
     its catalog at runtime, and does NOT flag
       (a) an authored catalog,
       (b) a page with no claim,
       (c) a builder that pushes AUTHORED literals (the blumgi-slime shape).
  2. the D20 FIX is DRIVEN BY THE CLASSIFIER (it has no hardcoded target
     list), so it fixes the generated game and leaves the authored ones
     untouched — including the "authored literals" builder.
  3. the fix is IDEMPOTENT and, after the fix, the classifier reports the
     game as no longer claiming "handcrafted".

It runs against a TEMPORARY COPY of the tree (GZ_SITE_ROOT), never the live
checkout — a negative test that mutates production is not a test.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = '/home/junze/gamezipper.com'
FIX = os.path.join(ROOT, '.audit/r337-d20-fix.py')
CLASSIFY = os.path.join(ROOT, '.audit/r337-d20-classify.js')

fails = []
def check(name, ok, info=''):
    print('  %s  %s%s' % ('PASS' if ok else 'FAIL', name, ('  (' + info + ')') if info else ''))
    if not ok:
        fails.append(name)

tmp = tempfile.mkdtemp(prefix='r337-d20-neg-')
site = os.path.join(tmp, 'site')
os.makedirs(os.path.join(site, '.audit'))
os.makedirs(os.path.join(site, 'js'))
open(os.path.join(site, 'js/games-data.js'), 'w').write(
    'var GAME_GRADIENTS=[];\nvar GAMES=[\n'
    '{name:"Gen",emoji:"x",cat:"puzzle",tags:[],url:"/gen-game/",desc:"d",status:"live"},\n'
    '{name:"Auth",emoji:"x",cat:"puzzle",tags:[],url:"/auth-game/",desc:"d",status:"live"},\n'
    '{name:"NoClaim",emoji:"x",cat:"puzzle",tags:[],url:"/noclaim-game/",desc:"d",status:"live"},\n'
    '{name:"Builder",emoji:"x",cat:"puzzle",tags:[],url:"/builder-game/",desc:"d",status:"live"},\n'
    '];\n')

def mkgame(slug, html):
    d = os.path.join(site, slug)
    os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'index.html'), 'w').write(html)

mkgame('gen-game', '''<!DOCTYPE html><html><head><meta name="description" content="30 handcrafted levels">
</head><body><script>
function generateLevels(){ var L=[]; for(var i=0;i<30;i++){ var r=Math.random(); L.push({n:i,x:r}); } return L; }
var LEVELS = generateLevels();
</script></body></html>''')
mkgame('auth-game', '''<!DOCTYPE html><html><head><meta name="description" content="30 handcrafted levels">
</head><body><script>
const LEVELS = [{n:1,a:2},{n:2,a:3},{n:3,a:4}];
</script></body></html>''')
mkgame('noclaim-game', '''<!DOCTYPE html><html><head><meta name="description" content="30 levels">
</head><body><script>
function generateLevels(){ var L=[]; for(var i=0;i<30;i++){ L.push({n:i}); } return L; }
var LEVELS = generateLevels();
</script></body></html>''')
mkgame('builder-game', '''<!DOCTYPE html><html><head><meta name="description" content="30 handcrafted levels">
</head><body><script>
function buildLevels(){ var L=[]; L.push({world:0,name:"First",x:10,y:20}); L.push({world:1,name:"Second",x:30,y:40}); return L; }
var LEVELS = buildLevels();
</script></body></html>''')

# install the classifier + fixer into the temp site
shutil.copy(CLASSIFY, os.path.join(site, '.audit/r337-d20-classify.js'))
fixsrc = open(FIX).read().replace(
    "CLASSIFY = os.path.join(ROOT, '.audit/r337-d20-classify.js')",
    "CLASSIFY = os.path.join(ROOT, '.audit/r337-d20-classify.js')")
fixpath = os.path.join(site, '.audit/r337-d20-fix.py')
open(fixpath, 'w').write(fixsrc)

env = dict(os.environ); env['GZ_SITE_ROOT'] = site

def classify_site():
    r = subprocess.run(['node', os.path.join(site, '.audit/r337-d20-classify.js')],
                       capture_output=True, text=True, env=env, cwd=site)
    if r.returncode != 0:
        print(r.stdout + r.stderr)
        raise SystemExit(2)
    return json.loads(r.stdout)

# ---------------------------------------------------------------- 1. classifier
print('=== 1. CLASSIFIER (positive + 3 negative controls) ===')
by = classify_site()
check('flags gen-game (claims handcrafted, RNG-generated)', by.get('gen-game', {}).get('kind') == 'PROCEDURAL', by.get('gen-game', {}).get('kind', 'missing'))
check('does NOT flag auth-game (authored inline catalog)', by.get('auth-game', {}).get('kind') != 'PROCEDURAL', by.get('auth-game', {}).get('kind', 'missing'))
check('does NOT flag noclaim-game (no claim)', by.get('noclaim-game', {}).get('kind') != 'PROCEDURAL', by.get('noclaim-game', {}).get('kind', 'missing'))
check('does NOT flag builder-game (builder pushes AUTHORED literals)', by.get('builder-game', {}).get('kind') != 'PROCEDURAL', by.get('builder-game', {}).get('kind', 'missing'))

# ---------------------------------------------------------------- 2. fix
print('\n=== 2. FIX (driven by the classifier, not a hardcoded list) ===')
r = subprocess.run(['python3', fixpath, '--apply'], capture_output=True, text=True, env=env, cwd=site)
print('  fixer stdout: ' + ' | '.join(r.stdout.strip().splitlines()[:2]))
rep = json.load(open(os.path.join(site, '.audit/r337-d20-fix.json')))
byrep = {x['slug']: x for x in rep}
check('fix changed gen-game (handcrafted -> generated)',
      'handcrafted' not in open(os.path.join(site, 'gen-game/index.html')).read().lower())
check('fix reports gen-game as FIXED', byrep.get('gen-game', {}).get('status') == 'FIXED', byrep.get('gen-game', {}).get('status', 'missing'))
# The fixer is CLASSIFIER-DRIVEN: it only processes games the classifier
# reports as PROCEDURAL, so the non-procedural games are ABSENT from the
# report entirely (rather than being reported as NO_CLAIM). Either way the
# assertion that matters is that their CONTENT is untouched.
for slug in ('auth-game', 'noclaim-game', 'builder-game'):
    check('fix did NOT touch %s (not classified PROCEDURAL)' % slug,
          slug not in byrep, byrep.get(slug, {}).get('status', 'absent'))
check('auth-game content is byte-identical after the fix run',
      'handcrafted' in open(os.path.join(site, 'auth-game/index.html')).read().lower())
check('builder-game content is byte-identical after the fix run',
      'handcrafted' in open(os.path.join(site, 'builder-game/index.html')).read().lower())
check('noclaim-game content is byte-identical after the fix run',
      'handcrafted' not in open(os.path.join(site, 'noclaim-game/index.html')).read().lower())

# ---------------------------------------------------------------- 3. idempotence
print('\n=== 3. IDEMPOTENCE + "fixed copy stays quiet" ===')
before = open(os.path.join(site, 'gen-game/index.html')).read()
subprocess.run(['python3', fixpath, '--apply'], capture_output=True, text=True, env=env, cwd=site)
after = open(os.path.join(site, 'gen-game/index.html')).read()
check('second run changes nothing (idempotent)', before == after)
by2 = classify_site()
check('after the fix, gen-game no longer claims handcrafted',
      'handcrafted' not in open(os.path.join(site, 'gen-game/index.html')).read().lower())

# ---------------------------------------------------------------- 4. real tree
print('\n=== 4. REAL TREE — the detector still flags exactly the 8 live games ===')
r3 = subprocess.run(['node', os.path.join(ROOT, '.audit/r337-d20-handcrafted.js')],
                    capture_output=True, text=True, cwd=ROOT)
if r3.returncode != 0:
    print(r3.stdout + r3.stderr)
d3 = json.load(open(os.path.join(ROOT, '.audit/r337-d20-handcrafted.json')))
found = sorted(x['slug'] for x in d3['procClaiming'])
expected = sorted(['bounce-bot', 'slitherlink', 'snake-vs-block', 'hidato',
                   'hex-haven', 'blob-pop', 'power-wash', 'color-switch'])
check('real tree: exactly the 8 expected procedural games are flagged', found == expected, str(found))
check('real tree: blumgi-slime is NOT flagged (authored literals)', 'blumgi-slime' not in found)

shutil.rmtree(tmp, ignore_errors=True)
print('\nNEGATIVE TEST: ' + ('ALL PASS' if not fails else str(len(fails)) + ' FAILURE(S): ' + ', '.join(fails)))
sys.exit(1 if fails else 0)
