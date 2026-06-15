# BENCHMARK — Flood Fill (Color Spread Puzzle)

## Game Overview
Flood Fill is a classic territory-expansion puzzle game where the player changes the color of their starting region to spread across a grid, filling the entire board in minimum moves.

## Competitor Analysis

### 1. Flood-It! (LabPix Games / Google Gadget)
- **Platform**: Web widget, iOS, Android
- **Downloads**: Millions of plays (one of the original web puzzle games)
- **Grid sizes**: 12×12, 14×14, 18×18, 22×22 (difficulty levels)
- **Colors**: 6 colors per grid
- **Mechanic**: Start from top-left, click a color, territory spreads to adjacent same-color cells
- **Goal**: Fill the board within move limit (22-25 moves for standard grids)
- **Scoring**: Star ratings based on moves used vs. par
- **Features**: Difficulty levels, daily challenge, hints

### 2. Color Spread (Voodoo / Tap to Play)
- **Platform**: iOS, Android
- **Downloads**: 10M+ combined across clones
- **Grid sizes**: Progressive from 4×4 to 20×20
- **Colors**: 4-7 colors
- **Mechanic**: Same as Flood-It with modern visuals
- **Features**: Level progression (100+ levels), star ratings, time challenges, undo
- **Monetization**: Free with interstitial ads between levels, banner ads
- **Visual**: Bright gradient colors, smooth spread animations, particle effects

### 3. Mad Virus (Namco / Bandai)
- **Platform**: Flash/Web
- **Grid sizes**: 9×9, 13×13, 17×17
- **Colors**: 5 colors
- **Mechanic**: Player controls the virus spreading from center (not corner)
- **Goal**: Infect the entire grid within move limit
- **Scoring**: Based on remaining moves
- **Visual**: Classic web game, colorful grid

## Key Systems to Implement

### Core Mechanics
1. **Grid system**: N×N grid with random color assignment (seeded for reproducibility)
2. **Flood fill algorithm**: BFS/DFS from origin to find connected territory
3. **Color selection**: Click/tap a color to spread
4. **Move counter**: Track moves used
5. **Par/limit system**: Maximum moves per level
6. **Win condition**: All cells same color (single connected region)

### Game Modes (to match competitors)
1. **Classic**: 30 handcrafted levels with increasing grid size + color count
2. **Time Attack**: Solve as fast as possible (leaderboard via localStorage)
3. **Daily Challenge**: Seeded daily level (same for all players, changes daily)
4. **Zen/Endless**: Unlimited procedurally generated levels

### Scoring System
- **3-star rating**: Based on moves used vs. optimal
  - 3 stars: ≤ par - 2 moves
  - 2 stars: ≤ par moves
  - 1 star: ≤ par + 3 moves
- **Level unlock**: Complete level with ≥1 star to unlock next
- **Best moves**: Track personal best per level

### Progression
| Levels | Grid Size | Colors | Par Moves |
|--------|-----------|--------|-----------|
| 1-5    | 6×6       | 4      | 10-12     |
| 6-10   | 8×8       | 5      | 14-16     |
| 11-15  | 10×10     | 5      | 16-18     |
| 16-20  | 12×12     | 6      | 20-22     |
| 21-25  | 14×14     | 6      | 22-25     |
| 26-30  | 16×16     | 7      | 26-28     |

### Competitor Systems Checklist
- [x] Move counter + par limit
- [x] Color palette bar (clickable)
- [x] Star rating system
- [x] Level progression + unlock
- [x] Best score tracking (localStorage)
- [x] Undo (limited, per-level)
- [x] Hint system (suggest optimal color)
- [x] Sound effects (color select, spread, win, lose)
- [x] BGM (ambient/calm)
- [x] Particle effects on spread
- [x] Smooth spread animation (ripple from origin)
- [x] Daily challenge mode
- [x] Tutorial/first-play guide

### Visual Design
- Dark gradient background (GameZipper style)
- Grid cells with rounded corners and subtle glow
- Color palette: 7 vibrant gradient colors (neon on dark)
- Spread animation: ripple/wave effect from origin
- Particle burst when territory expands
- Screen shake + celebration on win
- Level transition slides

### Optimal Solver (for hints + par calculation)
- Greedy heuristic: choose the color that maximizes territory gain each step
- For exact par: BFS/DFS with memoization (limited grid sizes)
- Use greedy for runtime hints, pre-computed for level data
