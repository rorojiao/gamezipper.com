import re

# Step 1: Add to games-data.js (inside GAMES array)
game_entry = '{name:"Euchre",emoji:"♠️",cat:"card",tags:["euchre","trick-taking","cards","trump","partnership"],url:"/euchre/",desc:"Play Euchre online free - classic 4-player trick-taking card game with trump, going alone, and partnership strategy",isNew:true,status:"live"},'

with open('js/games-data.js', 'r') as f:
    content = f.read()

# Find GAMES array boundaries
games_start = content.find('const GAMES = [')
if games_start == -1:
    games_start = content.find('var GAMES = [')

depth = 0
end_pos = None
for i, ch in enumerate(content[games_start:]):
    if ch == '[':
        depth += 1
    elif ch == ']':
        depth -= 1
    if depth == 0:
        end_pos = games_start + i
        break

# Find last entry before ]
last_entry = content.rfind('},', games_start, end_pos)
if last_entry == -1:
    last_entry = content.rfind('}', games_start, end_pos)
    content = content[:last_entry+1] + ',\n  ' + game_entry + '\n' + content[last_entry+1:]
else:
    content = content[:last_entry+2] + '\n  ' + game_entry + '\n' + content[last_entry+2:]

with open('js/games-data.js', 'w') as f:
    f.write(content)

print("✅ Added to games-data.js")

# Verify
import subprocess
result = subprocess.run(['node', '-c', 'js/games-data.js'], capture_output=True, text=True)
if result.returncode == 0:
    print("✅ Syntax check passed")
else:
    print(f"❌ Syntax error: {result.stderr}")

# Verify euchre is there exactly once
count = content.count('/euchre/')
print(f"✅ euchre entries: {count}")
