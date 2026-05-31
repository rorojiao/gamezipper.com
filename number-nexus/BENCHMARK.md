# Number Nexus — Competitive Benchmark

## Game Overview
**Genre:** Number Link / Path Puzzle (Grid-based logic puzzle)
**Core Mechanic:** Connect numbers in sequential order (1→2→3→...) on a grid, moving only orthogonally (up/down/left/right). The path must visit every cell exactly once to complete the puzzle.

## Competitors

### 1. NumNexus (numnexuss.com)
- **Platform:** Browser (HTML5)
- **Rating:** N/A (newer game)
- **Key Features:**
  - Color-coded paths showing which numbers connect
  - Progressive difficulty (smaller grids → larger grids)
  - Audio cues for correct/incorrect connections
  - Clean, modern UI
- **Grid Sizes:** 4x4 to 8x8
- **Weakness:** Limited level count, minimal progression system

### 2. Number Nexus by Glaze Games
- **Platform:** HTML5 (portrait mode)
- **Rating:** 4.5 stars, 1,744 votes (as of Sep 2025)
- **Released:** September 2025
- **Key Features:**
  - Math-based variant (use +−×÷ following PEMDAS)
  - Easy → Expert difficulty modes
  - Daily Challenge (coming soon)
  - Power-ups system
- **Weakness:** Not a pure path-finding game; math-heavy may alienate casual players

### 3. Number Path (Math Playground)
- **Platform:** Educational browser game
- **Puzzles:** 50 levels
- **Mechanic:** "Begin with zero, follow the sequence, fill empty spaces"
- **Weakness:** Educational focus, no scoring/power-ups/progression

### 4. Flow Free (Related genre benchmark)
- **Platform:** iOS, Android, Browser
- **Downloads:** 100M+ (genre king)
- **Key Features:**
  - Connect matching colored dots, fill entire grid
  - 2,000+ levels across multiple board sizes
  - Daily puzzles, time trials
  - Hint system, undo, clean UI
- **Relevance:** Same fill-the-grid mechanic, but uses colors instead of numbers

### 5. Number Link / Arukone (Classic variant)
- **Platform:** Various (paper puzzles → digital)
- **Mechanic:** Connect pairs of same numbers on grid, paths cannot cross
- **Relevance:** Number-based path finding, but pairs not sequential

## Target Feature Set for GameZipper Number Nexus

### Core Gameplay
1. **Sequential path drawing**: Tap/drag from 1→2→3→...→N on a grid
2. **Orthogonal movement only**: Up, down, left, right (no diagonal)
3. **Full grid coverage**: Path must visit every cell exactly once
4. **Visual feedback**: Highlighted path with gradient coloring, number glow on connect

### Level System (30 levels, 5 chapters/tiers)
| Chapter | Levels | Grid Size | Features |
|---------|--------|-----------|----------|
| 1 - Beginner | 1-6 | 4x4, 5x5 | Simple paths, numbers placed on edges |
| 2 - Easy | 7-12 | 5x5, 6x6 | Internal numbers, basic turns |
| 3 - Medium | 13-18 | 6x6, 7x7 | Multiple valid routes, longer sequences |
| 4 - Hard | 19-24 | 7x7, 8x8 | Complex routing, dead-end traps |
| 5 - Expert | 25-30 | 8x8, 9x9 | Dense grids, require planning |

### Progression & Scoring
- **Stars (3 per level):** Based on time + moves efficiency
- **Score system:** Base score × speed multiplier, combo for consecutive levels
- **Best score per level** saved in localStorage
- **Progress save:** Current chapter, unlocked levels, total stars

### Power-ups
- **Hint**: Reveals next 3 moves (limited uses, earn more)
- **Undo**: Step back one move (unlimited, but reduces star rating)
- **Reset**: Restart current level (free)

### UI/UX
- **Tutorial**: First 2 levels have guided overlay ("Tap 1, then drag to 2...")
- **Level select**: Grid of level buttons with star ratings
- **Settings**: Sound toggle, music toggle, reset progress
- **Dark theme**: GameZipper standard dark gradient (#0a0a1a)
- **Mobile-first**: Touch controls, large tap targets (44px+)
- **Responsive**: Adapts canvas to screen size

### Audio
- **Web Audio API** procedural sounds
- BGM: Ambient puzzle atmosphere (soft pads, gentle piano)
- SFX: Number connect (ascending pitch), level complete (fanfare), error (buzz)

### SEO & Analytics
- Title: "Play Number Nexus Online Free - Number Path Puzzle | GameZipper"
- Tags: Puzzle, Number, Path, Logic, Brain, Grid, Connect, Casual
- Structured data: VideoGame + FAQPage + HowTo + BreadcrumbList

## Gap vs GameZipper Current Games
- **No Number Link/Path game** exists on GameZipper
- Closest: Flow Connect (color-based), Sudoku (number grid), Nonogram (number clues)
- Number Nexus fills a unique gap: sequential number path-finding with full grid coverage
- Appeals to both Sudoku players (logic) and Flow Free fans (path drawing)
