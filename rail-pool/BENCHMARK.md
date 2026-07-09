# Rail Pool — Competitive Benchmark

## Game: Rail Pool
**Genre**: Nikoli-style loop-drawing logic puzzle
**Origin**: Created by Martin Ender (gmpuzzles.com, December 2022). Featured as a "new generation" puzzle at the 2022 World Puzzle Championship.

## Rules (Canonical)
1. **Grid** (5x6 to 8x8) divided into **polyomino regions** by black borders
2. **Draw a single non-intersecting loop** that passes through the centers of all cells (including clue cells)
3. **Clues in regions**: numbers indicate the lengths of straight-line segments that pass through all cells *contained by* the region
4. **Each number in a region must be represented by at least one line segment of that length** within that region
5. **"?" clue cells** represent a positive integer (1+); if a cell has multiple "?"s, all numbers/?"s in that clue must be distinct

## Tier Progression (R*C must be even for Hamiltonian cycle)
- Tier 1 (Beginner): 5x6 grid (30 cells), 6 levels
- Tier 2 (Easy):     6x6 grid (36 cells), 6 levels
- Tier 3 (Medium):   6x7 grid (42 cells), 6 levels
- Tier 4 (Hard):     7x8 grid (56 cells), 6 levels
- Tier 5 (Expert):   8x8 grid (64 cells), 6 levels
- Total: 30 levels

## Competitors

### 1. Grandmaster Puzzles (gmpuzzles.com)
- **Format**: PDF + Penpa-Edit online solver (default linex mode)
- **Features**: Themed puzzles (e.g. "Tetris" theme), competition-grade difficulty (2.5-5 stars)
- **Monetization**: Free blog + paid e-book store
- **Gap**: No standalone playable game; requires Penpa-Edit knowledge and mouse-drag

### 2. Nikoli Pencil Puzzles (nikoli.co.jp)
- **Format**: Print books + Nikoli.com subscription
- **Features**: Author-curated quality, regional traditions
- **Gap**: Rail Pool is by Martin Ender (modern Western author), not in Nikoli's classic catalog

### 3. Simon Tatham's Portable Puzzle Collection
- **Format**: Desktop/mobile app (C, GTK/Qt)
- **Features**: 40+ open-source puzzles, replay value
- **Gap**: No loop-drawing puzzle similar to Rail Pool; closest is "Towers" or "Loopy"

### 4. Puzzle-Sheets / mobile puzzle apps
- **Format**: Touch-friendly loops (e.g. "Loop the Loop", "Roll the Ball")
- **Gap**: Different rules (path-finding, no clues); Rail Pool's region-segment-length constraint is unique

## GameZipper Differentiation

**Why Rail Pool fits GameZipper's puzzle catalog**:
1. **True zero gap**: `rail-pool`, `railpool`, `rail pool puzzle` all 0 occurrences in catalog (grep verified 2026-07-09)
2. **Loop genre extension**: Complements existing single-file puzzles; uses draw-line input (proven UX)
3. **Solvable on small grids**: 5x6 to 8x8 works on mobile without scroll
4. **Clear visual feedback**: Canvas-rendered loop with region shading, segment-length indicators
5. **Unique mechanic**: Region-segment-length constraint is rare in browser puzzles

## Implementation Plan

### Data Model
```javascript
{
  size: [R, C],
  regions: [[r0c0, r0c1, ...], ...],     // region ID per cell (0 = unused)
  clues:   [{r, c, vals: [n]}, ...],      // list of clue cells with values
  solution_entry: [...], solution_exit: [...],  // loop direction at each cell
  tier: "Beginner",
  number: 1
}
```

### Generation Strategy
1. **Hamiltonian cycle**: DFS with Warnsdorff heuristic (requires R*C even)
2. **Region construction**: anchor on straight segments from the loop; BFS growth for remaining cells
3. **Clue placement**: each region with at least one full segment gets 1 clue showing that segment's length

### Solver (for verification)
- Walk solution path; check loop closes and visits all cells
- Split into straight segments by direction changes (with wrap-around handling)
- For each clue, verify at least one segment in the same region has matching length

## Reference
- Original puzzle: https://www.gmpuzzles.com/blog/2022/12/rail-pool-by-martin-ender/
- Author: Martin Ender (menderbinder on gmpuzzles)
- WPC 2022 featured puzzle