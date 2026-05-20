# Maze Runner — Competitive Benchmark

## Competitors

### 1. Coolmath Games "Maze" (200+ levels)
- **Levels**: 200+ hand-crafted mazes across 3 modes
- **Modes**: Time Attack (main), Exploration, Ultimate Time Attack
- **Mechanics**: Arrow key movement, timer-based scoring, speedrun culture
- **Difficulty**: Progressive — small grids → large complex mazes
- **Scoring**: Best time per level, speedrun.com leaderboards

### 2. aMaze (50 levels, 3D)
- **Levels**: 50 procedurally-generated raycasted 3D mazes
- **Mechanics**: First-person, find cheese, escape
- **Difficulty**: Increasing maze complexity
- **Innovation**: First-person 3D perspective in browser

### 3. PlayMazeGame
- **Mechanics**: Fog of war, keys & locked doors, sequences
- **Features**: Mobile-optimized, progressive difficulty
- **Innovation**: Fog of war reveals nearby area only

### 4. Amaze! (Paint mechanic)
- **Mechanics**: Swipe to paint/fill grid, complete coverage
- **Difficulty**: Progressive grid sizes
- **Different**: Grid-filling, not path-finding

## Required Systems for GZ Maze Runner

| System | Details |
|--------|---------|
| **Level System** | 30+ procedurally generated mazes, 5 difficulty tiers (Easy 8x8 → Expert 20x20) |
| **Fog of War** | Player sees limited radius, expands on exploration |
| **Keys & Doors** | Color-coded keys unlock matching doors |
| **Collectibles** | Stars/gems scattered in maze for bonus points |
| **Timer** | Per-level timer, best times saved, star rating (1-3 stars based on time) |
| **Scoring** | Base time bonus + collectible bonus + moves efficiency bonus |
| **Minimap** | Toggle minimap showing explored areas |
| **Progress Save** | localStorage with version field, auto-save on level complete |
| **Tutorial** | First level is guided tutorial with arrows/hints |
| **Hints** | Show solution path (limited uses, earn more) |
| **Power-ups** | Speed boost, x-ray (reveal full maze), extra time |
| **Daily Maze** | Procedurally generated daily maze challenge |
| **Stats** | Total time, levels completed, stars earned, best times |
| **Sound** | Web Audio BGM + SFX (footsteps, key pickup, door unlock, star collect, level complete) |
| **Controls** | Keyboard (WASD/arrows) + touch swipe + on-screen d-pad |
| **Visual Style** | Neon dark theme, smooth player movement, particle trails |

## Target Spec
- Slug: `maze-runner`
- 30+ levels (6 per tier × 5 tiers)
- Maze sizes: 8x8, 10x10, 12x12, 15x15, 20x20
- Maze generation: Recursive backtracking with dead-end filling
- Min ~45KB single HTML file
