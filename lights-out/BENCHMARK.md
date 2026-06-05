# Lights Out — Competitive Benchmark

## Reference Games Analyzed

### 1. Simon Tatham's Lights Out (portable puzzle collection)
- **URL**: https://www.chiark.greenend.org.uk/~sgtatham/puzzles/
- **Grid**: 5x5 (configurable 3x3 to 7x7)
- **Mechanic**: Tap a cell toggles itself + 4 orthogonal neighbors
- **Win condition**: All lights off
- **Features**:
  - Random solvable board generator
  - Solve mode (shows minimum-move solution)
  - 3 difficulty levels: Easy/Medium/Hard
  - Cross/toggle neighbor configurations
  - Daily puzzle seed

### 2. Lights Out (Wikipedia / Tiger Electronics 1995)
- **Grid**: 5x5
- **Mechanic**: Toggle self + 4 neighbors
- **Features**:
  - All 25 lights starting ON
  - Goal: turn all OFF
  - 3 difficulty modes (beginner/expert)

### 3. logicgamesonline.com/lightsout
- **Grid**: 5x5 standard
- **Mechanic**: Toggle + cross
- **Features**:
  - "Chase the lights" hint strategy
  - Step counter
  - Reset board
  - New puzzle button

## Core Systems to Implement (for S-grade)

### Game Systems
1. **Grid Board** — 5x5 cells (5x5 classic + 3x3/7x7 variants)
2. **Tap Mechanic** — Click a cell toggles self + 4 orthogonal neighbors
3. **Win Detection** — All lights off = level complete
4. **Move Counter** — Tracks number of taps
5. **Optimal Move Display** — Show minimum solution count for solved puzzles
6. **Hint System** — "Auto-solve" button shows next best move
7. **Undo** — Undo last move(s) with stack
8. **Reset Board** — Return to start of current puzzle
9. **New Puzzle** — Generate fresh random solvable board
10. **Pause/Resume** — Save and restore mid-puzzle state

### Level System (S-grade requirement: 20+ levels)
- **Levels 1-5**: 3x3 grid, Easy (5-7 moves optimal)
- **Levels 6-10**: 3x3 grid, Hard (8-12 moves)
- **Levels 11-15**: 5x5 grid, Easy (10-15 moves)
- **Levels 16-20**: 5x5 grid, Medium (16-22 moves)
- **Levels 21-25**: 5x5 grid, Hard (23-30 moves)
- **Levels 26-30**: 7x7 grid, Easy (20-30 moves)
- **Total**: 30 levels across 5 tiers

### Progression / Persistence
- localStorage save (versioned)
- Best moves per level (lower is better)
- 3-star rating: Optimal+2 / Optimal+5 / Completed
- Unlocked level progression

### Tutorial System
1. **Step 1**: "Tap a tile to toggle it. Watch what happens to neighbors!"
2. **Step 2**: "Turn all lights OFF to win the level."
3. **Step 3**: "Plan ahead — every tap changes 5 lights."
4. **Step 4**: "Use HINT to see the optimal next move, or UNDO if you change your mind."

### Visual Style
- Dark gradient background (GameZipper style)
- Glowing neon cells: ON = bright neon (yellow/cyan), OFF = dark
- Pulse animation on toggle
- Chain reaction glow when lights cascade
- Particle burst on level complete

### Audio (Web Audio API procedural)
- Click toggle: short "pop" with frequency shift based on cell state
- Win: ascending arpeggio (C-E-G-C)
- Star earn: bell chime
- Move counter tick
- Background: ambient electronic pad (low volume)

### Monetization-friendly Features
- Move hint costs "stars" (free 3 per day)
- 3 stars awarded per level: 3 = optimal, 2 = +5 moves, 1 = completed
- Daily challenge: shared daily seed for global leaderboard
- Color themes unlockable: Neon (default), Sunset, Ocean, Forest

### Quality of Life
- Touch support: large tap targets (60x60px min)
- Animation: 200ms smooth toggle transitions
- Sound toggle: top-right speaker icon
- Progress bar: levels completed / 30
- Level select screen: grid of 30 level cards

## Implementation Plan
- Pure single-file HTML5
- Canvas-based rendering (smooth 60fps)
- Web Audio API procedural sound
- No external dependencies except CDN fonts
- All assets as inline base64 or procedural

## Solvability Algorithm
Use Simon Tatham's "chase the lights" + linear algebra over GF(2):
1. Try all 2^N first-row press combinations (N=5 for 5x5, N=7 for 7x7, N=3 for 3x3)
2. For each, propagate down (chase) to see if all rows clear
3. Pick the combination that gives minimum total presses
4. Reject unsolvable boards (rare but possible for some first-row combos)

This guarantees all generated levels are solvable.
