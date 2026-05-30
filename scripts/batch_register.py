#!/usr/bin/env python3
"""
Batch QA check and registration for unregistered games.
Reads unregistered game dirs, runs QA, and registers passing games.
"""
import os
import re
import json
import subprocess

BASE = "/home/msdn/gamezipper.com"
GAMES_DATA = f"{BASE}/js/games-data.js"

# Game metadata mapping (slug -> {name, emoji, cat, tags, desc})
GAME_META = {
    "backgammon": {"name": "Backgammon", "emoji": "🎲", "cat": "board", "tags": ["board", "classic", "strategy", "two-player"], "desc": "Play Backgammon online free - classic board game with AI opponent. Roll dice, move checkers, and bear off to win!"},
    "bubble-shooter": {"name": "Bubble Shooter", "emoji": "🫧", "cat": "arcade", "tags": ["arcade", "shooter", "puzzle", "casual"], "desc": "Play Bubble Shooter online free - aim and pop colorful bubbles in this addictive arcade puzzle game. Thousands of levels!"},
    "akinator": {"name": "Akinator", "emoji": "🧞", "cat": "puzzle", "tags": ["puzzle", "trivia", "guessing", "brain"], "desc": "Play Akinator online free - the mind-reading genie guesses your character! Think of anyone and let the AI read your mind."},
    "contexto": {"name": "Contexto", "emoji": "📝", "cat": "puzzle", "tags": ["puzzle", "word", "logic", "brain"], "desc": "Play Contexto online free - guess the secret word by context similarity. AI-powered word guessing game with unlimited puzzles."},
    "battleship": {"name": "Battleship", "emoji": "🚢", "cat": "strategy", "tags": ["strategy", "classic", "board", "naval"], "desc": "Play Battleship online free - classic naval strategy game. Sink the enemy fleet before they sink yours!"},
    "abyss-chef": {"name": "Abyss Chef", "emoji": "🍳", "cat": "casual", "tags": ["casual", "cooking", "adventure", "simulation"], "desc": "Play Abyss Chef online free - cook dishes in the deep ocean! A unique underwater cooking adventure game."},
    "bridge-builder": {"name": "Bridge Builder", "emoji": "🌉", "cat": "puzzle", "tags": ["puzzle", "physics", "building", "engineering"], "desc": "Play Bridge Builder online free - engineer bridges that hold! Physics-based puzzle with realistic stress simulation."},
    "bounce-bot": {"name": "Bounce Bot", "emoji": "🤖", "cat": "arcade", "tags": ["arcade", "platformer", "action", "robot"], "desc": "Play Bounce Bot online free - guide the bouncing robot through tricky platformer levels! Fast-paced action game."},
    "connect-four": {"name": "Connect Four", "emoji": "🔴", "cat": "board", "tags": ["board", "classic", "strategy", "two-player"], "desc": "Play Connect Four online free - drop discs and connect 4 in a row! Classic strategy game vs AI or local 2-player."},
    "chinese-checkers": {"name": "Chinese Checkers", "emoji": "⭐", "cat": "board", "tags": ["board", "classic", "strategy", "marble"], "desc": "Play Chinese Checkers online free - move marbles across the star board! Classic strategy board game with AI."},
    "brain-out": {"name": "Brain Out", "emoji": "🧠", "cat": "puzzle", "tags": ["puzzle", "brain", "tricky", "riddle"], "desc": "Play Brain Out online free - tricky brain teasers that think outside the box! Can you solve all the riddles?"},
    "boxrob": {"name": "Boxrob", "emoji": "📦", "cat": "platformer", "tags": ["platformer", "puzzle", "robot", "action"], "desc": "Play Boxrob online free - control a robot to push boxes and solve puzzles! Platformer puzzle adventure."},
    "compound-word": {"name": "Compound Word", "emoji": "🔤", "cat": "puzzle", "tags": ["puzzle", "word", "logic", "vocabulary"], "desc": "Play Compound Word online free - combine words to form compounds! Word puzzle game with hundreds of levels."},
    "100-doors": {"name": "100 Doors", "emoji": "🚪", "cat": "puzzle", "tags": ["puzzle", "escape", "logic", "brain"], "desc": "Play 100 Doors online free - solve puzzles to escape through 100 doors! Brain-teasing escape room game."},
    "color-sort": {"name": "Color Sort", "emoji": "🌈", "cat": "puzzle", "tags": ["puzzle", "sorting", "casual", "relaxing"], "desc": "Play Color Sort online free - sort colored liquids into tubes! Relaxing yet challenging puzzle game."},
    "crazy-eights": {"name": "Crazy Eights", "emoji": "🃏", "cat": "card", "tags": ["card", "classic", "strategy", "family"], "desc": "Play Crazy Eights online free - classic shedding card game! Match cards by suit or rank vs AI opponents."},
    "circuit-logic": {"name": "Circuit Logic", "emoji": "⚡", "cat": "puzzle", "tags": ["puzzle", "logic", "electronics", "brain"], "desc": "Play Circuit Logic online free - rotate tiles to connect circuits! Logic puzzle with neon visuals and 65+ levels."},
    "blockudoku": {"name": "Blockudoku", "emoji": "🧩", "cat": "puzzle", "tags": ["puzzle", "block", "tetris", "strategy"], "desc": "Play Blockudoku online free - combine sudoku and block puzzle! Place blocks to fill rows and squares."},
    "blocky-blast": {"name": "Blocky Blast", "emoji": "💥", "cat": "puzzle", "tags": ["puzzle", "block", "casual", "explosive"], "desc": "Play Blocky Blast online free - blast colorful blocks in explosive combos! Addictive block puzzle game."},
    "blackjack": {"name": "Blackjack", "emoji": "🃏", "cat": "card", "tags": ["card", "casino", "classic", "strategy"], "desc": "Play Blackjack online free - classic 21 card game! Beat the dealer without going bust."},
    "checkers": {"name": "Checkers", "emoji": "⬛", "cat": "board", "tags": ["board", "classic", "strategy", "two-player"], "desc": "Play Checkers online free - classic draughts board game! Jump and capture opponent pieces to win."},
    "cloud-sheep": {"name": "Cloud Sheep", "emoji": "🐑", "cat": "puzzle", "tags": ["puzzle", "physics", "cute", "casual"], "desc": "Play Cloud Sheep online free - help fluffy sheep reach the clouds! Cute physics puzzle game."},
    "bolt-jam-3d": {"name": "Bolt Jam 3D", "emoji": "🔩", "cat": "puzzle", "tags": ["puzzle", "sorting", "3d", "unscrew"], "desc": "Play Bolt Jam 3D online free - unscrew and sort bolts in 3D! Satisfying screw puzzle game."},
    "chinese-chess": {"name": "Chinese Chess", "emoji": "♟️", "cat": "board", "tags": ["board", "classic", "strategy", "asian"], "desc": "Play Chinese Chess (Xiangqi) online free - ancient strategy board game! Command your army to checkmate."},
    "cribbage": {"name": "Cribbage", "emoji": "🃏", "cat": "card", "tags": ["card", "classic", "strategy", "scoring"], "desc": "Play Cribbage online free - classic card game with peg scoring! Count combinations and reach 121 points."},
    "cookie-clicker": {"name": "Cookie Clicker", "emoji": "🍪", "cat": "casual", "tags": ["casual", "idle", "clicker", "incremental"], "desc": "Play Cookie Clicker online free - bake millions of cookies! Addictive idle clicker game with upgrades."},
    "color-cars-parking": {"name": "Color Cars Parking", "emoji": "🚗", "cat": "puzzle", "tags": ["puzzle", "parking", "sorting", "cars"], "desc": "Play Color Cars Parking online free - sort cars by color into parking spots! Fun parking puzzle game."},
    "crossmath": {"name": "Crossmath", "emoji": "🔢", "cat": "puzzle", "tags": ["puzzle", "math", "logic", "brain"], "desc": "Play Crossmath online free - solve math crossword puzzles! Combine numbers and operators to fill the grid."},
    "color-by-number": {"name": "Color by Number", "emoji": "🎨", "cat": "casual", "tags": ["casual", "coloring", "art", "relaxing"], "desc": "Play Color by Number online free - paint beautiful pixel art by matching numbers! Relaxing coloring game."},
    "brick-breaker": {"name": "Brick Breaker", "emoji": "🧱", "cat": "arcade", "tags": ["arcade", "breaker", "classic", "retro"], "desc": "Play Brick Breaker online free - smash bricks with a bouncing ball! Classic retro arcade game."},
    "block-blast-bingo": {"name": "Block Blast Bingo", "emoji": "🎱", "cat": "puzzle", "tags": ["puzzle", "block", "bingo", "casual"], "desc": "Play Block Blast Bingo online free - combine block puzzle with bingo! Unique mashup puzzle game."},
    "cover-orange": {"name": "Cover Orange", "emoji": "🍊", "cat": "puzzle", "tags": ["puzzle", "physics", "protection", "casual"], "desc": "Play Cover Orange online free - protect the orange from acid rain! Physics-based puzzle with fun mechanics."},
    "arrow-escape": {"name": "Arrow Escape", "emoji": "🏹", "cat": "puzzle", "tags": ["puzzle", "arrows", "logic", "maze"], "desc": "Play Arrow Escape online free - guide arrows through mazes to escape! Directional puzzle adventure."},
    "bloxorz": {"name": "Bloxorz", "emoji": "🟦", "cat": "puzzle", "tags": ["puzzle", "logic", "block", "rolling"], "desc": "Play Bloxorz online free - roll the block to the hole! Classic 3D block rolling puzzle game."},
    "bejeweled": {"name": "Bejeweled", "emoji": "💎", "cat": "puzzle", "tags": ["puzzle", "match-3", "gems", "classic"], "desc": "Play Bejeweled online free - swap gems and match 3 or more! Classic match-3 puzzle game with sparkling gems."},
    "bubble-pop": {"name": "Bubble Pop", "emoji": "💫", "cat": "casual", "tags": ["casual", "bubble", "pop", "relaxing"], "desc": "Play Bubble Pop online free - pop colorful bubbles for satisfying combos! Simple and relaxing casual game."},
    "2048": {"name": "2048", "emoji": "🔢", "cat": "puzzle", "tags": ["puzzle", "numbers", "sliding", "strategy"], "desc": "Play 2048 online free - slide and merge numbers to reach 2048! Addictive number puzzle game."},
    "alien-whack": {"name": "Alien Whack", "emoji": "👽", "cat": "arcade", "tags": ["arcade", "whack", "reaction", "aliens"], "desc": "Play Alien Whack online free - whack aliens before they escape! Fast reaction arcade game."},
    "catch-turkey": {"name": "Catch Turkey", "emoji": "🦃", "cat": "casual", "tags": ["casual", "catch", "fun", "thanksgiving"], "desc": "Play Catch Turkey online free - catch the running turkey! Fun and fast casual game."},
    "ball-catch": {"name": "Ball Catch", "emoji": "⚾", "cat": "arcade", "tags": ["arcade", "catch", "reaction", "casual"], "desc": "Play Ball Catch online free - catch falling balls in the basket! Simple yet addictive arcade game."},
    "chess": {"name": "Chess", "emoji": "♚", "cat": "board", "tags": ["board", "classic", "strategy", "two-player"], "desc": "Play Chess online free - classic strategy board game! Checkmate the king to win."},
    "crossword": {"name": "Crossword", "emoji": "📝", "cat": "puzzle", "tags": ["puzzle", "word", "crossword", "vocabulary"], "desc": "Play Crossword online free - solve daily crossword puzzles! Classic word game with hundreds of clues."},
    "basketball-shoot": {"name": "Basketball Shoot", "emoji": "🏀", "cat": "sports", "tags": ["sports", "basketball", "shooting", "arcade"], "desc": "Play Basketball Shoot online free - shoot hoops and score baskets! Aim for the perfect swish."},
}

# Skip non-game directories
SKIP_DIRS = {'css', 'js', 'images', 'scripts', 'node_modules', '.git', 'assets', 'fonts', 'vendor', '__pycache__', 'tools', 'admin', 'contact', 'cookie-policy', 'blog', 'chocolate-bean-storm'}

def run_qa(slug):
    """Run QA checks on a game. Returns (pass, issues_list)."""
    path = f"{BASE}/{slug}/index.html"
    if not os.path.exists(path):
        return False, ["index.html missing"]
    
    with open(path, 'r', errors='ignore') as f:
        content = f.read()
    
    issues = []
    file_size = len(content)
    
    if file_size < 15000:
        issues.append(f"File too small: {file_size} bytes")
    
    if '</html>' not in content:
        issues.append("Missing </html> closing tag")
    
    if 'site-analytics.cap.1ktower.com' not in content:
        issues.append("Missing analytics")
    
    if 'touch-action' not in content:
        issues.append("Missing touch-action")
    
    if 'localStorage' not in content:
        issues.append("Missing localStorage")
    
    if 'application/ld+json' not in content:
        issues.append("Missing JSON-LD")
    
    if 'og:title' not in content:
        issues.append("Missing og:title")
    
    # Check for Chinese text (CJK characters)
    cjk = re.findall(r'[\u4e00-\u9fff]', content)
    if cjk:
        issues.append(f"Contains {len(cjk)} Chinese characters")
    
    # Check for forbidden text-stroke
    if 'text-stroke' in content:
        issues.append("Contains forbidden -webkit-text-stroke")
    
    return len(issues) == 0, issues

def register_game(slug, meta):
    """Register game in games-data.js using Python append method."""
    game_entry = '{name:"' + meta["name"] + '",emoji:"' + meta["emoji"] + '",cat:"' + meta["cat"] + '",tags:' + json.dumps(meta["tags"]) + ',url:"/' + slug + '/",desc:"' + meta["desc"] + '",isNew:true,status:"live"},'
    
    with open(GAMES_DATA, 'r') as f:
        content = f.read()
    
    # Check if already registered
    if f'"/{slug}/"' in content:
        return False, "Already registered"
    
    content = content.rstrip()
    if content.endswith(','):
        content = content[:-1]
    content += '\n' + game_entry + '\n'
    
    with open(GAMES_DATA, 'w') as f:
        f.write(content)
    
    return True, "Registered"

# Main execution
print("=" * 70)
print("BATCH QA + REGISTRATION FOR UNREGISTERED GAMES")
print("=" * 70)

# Get registered games
with open(GAMES_DATA, 'r') as f:
    gd = f.read()
registered = set(re.findall(r'url:"/([^/]+)/"', gd))

# Get all dirs with index.html
all_dirs = [d for d in os.listdir(BASE) if os.path.isdir(os.path.join(BASE, d))]
game_dirs = [d for d in all_dirs if d not in SKIP_DIRS and not d.startswith('.') and os.path.exists(os.path.join(BASE, d, 'index.html'))]

unregistered = [d for d in game_dirs if d not in registered]
unregistered.sort(key=lambda d: os.path.getsize(os.path.join(BASE, d, 'index.html')), reverse=True)

print(f"Registered games: {len(registered)}")
print(f"Game dirs with HTML: {len(game_dirs)}")
print(f"Unregistered: {len(unregistered)}")
print()

passed = []
failed = []
no_meta = []

for slug in unregistered:
    size = os.path.getsize(os.path.join(BASE, slug, 'index.html'))
    meta = GAME_META.get(slug)
    
    if not meta:
        no_meta.append(slug)
        continue
    
    qa_pass, issues = run_qa(slug)
    
    if qa_pass:
        ok, msg = register_game(slug, meta)
        if ok:
            passed.append(slug)
            print(f"✅ {slug:<35} ({size:>7} bytes) — Registered")
        else:
            print(f"⚠️  {slug:<35} ({size:>7} bytes) — {msg}")
    else:
        failed.append((slug, issues))
        issue_str = "; ".join(issues)
        print(f"❌ {slug:<35} ({size:>7} bytes) — {issue_str}")

print()
print(f"SUMMARY: {len(passed)} registered | {len(failed)} QA failed | {len(no_meta)} no metadata")
print()

if no_meta:
    print(f"Missing metadata for: {', '.join(no_meta)}")
