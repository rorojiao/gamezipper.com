# Maze Paint — Competitive Benchmark

## Target Game: Maze Paint (Amaze! clone)
- Core: Swipe to move paint ball through grid maze. Ball slides until hitting wall. Paint every cell to complete level.

## Top Competitors

### 1. Amaze! (Crazy Labs) — 100M+ downloads
- **Levels**: 500+ levels across multiple packs
- **Core mechanic**: Swipe direction, ball slides to wall, paints cells
- **Systems**: Star rating (1-3), level select map, daily rewards, unlock packs
- **Difficulty curve**: Small grids → larger grids → dead-ends → multi-balls → color mixing
- **Art style**: Vibrant pastel colors, clean 3D ball, smooth paint trails
- **Monetization**: Interstitial between levels, rewarded hints, ad-removal IAP
- **Special levels**: Gravity wells, teleporters, one-way paths

### 2. Amaze GO! (Oakever Games) — #5 Google Play Top Free Puzzle, 4.7★
- **Levels**: 300+ levels
- **Core mechanic**: Same swipe-paint mechanic
- **Systems**: Level progression, star ratings, coin rewards
- **Difficulty**: Progressive grid sizes with increasingly tricky layouts

### 3. Maze Paint (Pokki/Poki equivalents)
- **Levels**: 50-100 browser levels
- **Core mechanic**: Same, optimized for mouse/touch
- **Systems**: Timer challenge mode, level select

## Systems to Implement
1. **Grid-based maze system** (5x5 to 12x12 progressive)
2. **Swipe movement** (ball slides until hitting wall)
3. **Cell painting** (trail effect as ball moves)
4. **Win condition** (all cells painted)
5. **Level progression** (30+ levels with increasing difficulty)
6. **Star rating** (based on moves efficiency — fewer moves = more stars)
7. **Score system** (points per cell, bonus for efficiency)
8. **Best score tracking** (localStorage)
9. **Level select** (grid of completed/current/locked levels)
10. **Tutorial** (first 3 levels guide the player)
11. **Progress saving** (localStorage with version)
12. **Sound effects** (Web Audio API — swipe, paint, complete, star)
13. **BGM** (procedural ambient via Web Audio API)
14. **Hint system** (show next optimal move)
15. **Visual feedback** (paint trail animation, particle burst on completion, star animation)
16. **Difficulty progression**: simple walls → dead ends → narrow paths → color gates → multiple sections

## Art Style
- Dark gradient background (GameZipper style: #0a0a1a → #1a1a3a)
- Vibrant paint colors (rainbow gradient balls)
- Neon glow on painted cells
- Clean rounded grid cells
- Smooth CSS transitions

## Music Style
- Ambient electronic, calm, satisfying (ASMR-like)
- Procedural via Web Audio API
