#!/usr/bin/env python3
"""Fix games-data.js: move orphaned arrow-puzzle entry INSIDE the GAMES array."""
GAME_ENTRY = '{name:"Arrow Puzzle",emoji:"🧭",cat:"puzzle",tags:["Puzzle","Arrow","Spin","Rotate","Logic","Brain","Grid","Lights Out","Casual","Free"],url:"/arrow-puzzle/",desc:"Play Arrow Puzzle free online! Tap a tile to spin it and its neighbors clockwise. Align every arrow UP to win across 30 brain-teasing levels. A neon logic puzzle. No download needed!",isNew:true,status:"live"},'

with open('js/games-data.js', 'r') as f:
    lines = f.readlines()

# 1. Remove any existing orphaned arrow-puzzle lines (outside array)
new_lines = []
for ln in lines:
    if 'url:"/arrow-puzzle/"' in ln and 'GAMES' not in ln:
        continue  # skip the orphan
    new_lines.append(ln)

# 2. Find the GAMES array closing '];' and insert entry before it
# The GAMES array is opened by 'const GAMES = [' and closed by '];' on its own line
out = []
inserted = False
in_games = False
for ln in new_lines:
    if 'const GAMES = [' in ln or 'GAMES = [' in ln:
        in_games = True
    if in_games and not inserted and ln.strip() == '];':
        # insert our entry before the closing ];
        out.append(GAME_ENTRY + '\n')
        inserted = True
        in_games = False
    out.append(ln)

if not inserted:
    print("ERROR: could not find GAMES closing ];")
else:
    with open('js/games-data.js', 'w') as f:
        f.writelines(out)
    print("OK: inserted arrow-puzzle entry before GAMES ];")

# verify
import subprocess
r = subprocess.run(['node', '-c', 'js/games-data.js'], capture_output=True, text=True)
print("syntax check:", "PASS" if r.returncode == 0 else "FAIL: " + r.stderr[:200])
with open('js/games-data.js') as f:
    c = f.read()
print("arrow-puzzle entries:", c.count('url:"/arrow-puzzle/"'))
print("cat: count:", c.count('cat:'))
