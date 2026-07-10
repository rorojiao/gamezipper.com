# Nagareru — Competitive Benchmark

## Puzzle Identity
- **Name**: Nagareru (流れ, "Flow")
- **Origin**: Nikoli puzzle type (nikoli.co.jp/en/puzzles/nagareru/)
- **Category**: Loop drawing / path placement

## Rules (Official, from nikoli.co.jp)

1. Draw a line to make a single continuous loop in a direction.
2. Lines pass through the centers of cells, horizontally, vertically, or turning. The loop cannot cross itself, branch off, or go through the same cell twice.
3. The line must go through the cells with an arrow (black), and when you go along the arrows of the loop, that becomes the direction of all of the loop.
4. The arrows in the black cells (arrows appear white) show that wind is blowing in the direction of the arrow till it reaches another black cell or the border. In cells where wind blows, the loop cannot advance against the wind.
5. When the line enters a cell where the wind blows from the side, it must move at least one cell in that direction. When the line is blown like this (bent by a side wind) it cannot progress to or enter cells to hit the borders or enter black cells.

## Core Mechanics
- **Loop construction**: Single continuous non-self-intersecting closed loop
- **Wind cells**: Black cells with arrows define wind direction along row/column
- **Forced direction**: When entering wind zone, line must follow wind for ≥1 cell
- **No-stop constraint**: When blown by side wind, line cannot enter a black cell or hit border

## Catalog Gap Analysis
- `nagareru`: 0 occurrences ✅
- `nagareru-coin`: 0 occurrences ✅ (different game)
- `nagareru puzzle`: 0 occurrences ✅
- `nagareru loop`: 0 occurrences ✅

## Competitive Landscape
- No English-language web implementation found
- nikoli.co.jp official rules page exists
- Reference: logic-puzzle.org / puzzles-mobile.com occasionally carry fan translations

## Level Design Approach
- **Solution-first generation**:
  1. Generate a base Hamiltonian loop on grid (DFS Warnsdorff)
  2. Select ~5-12% of cells as wind cells with valid directional winds
  3. Compute "wind flow bands" — cells affected by each wind direction
  4. Verify forced-direction constraints match a unique solution
  5. Greedy clue minimization while keeping unique solution
- **Difficulty tiers**: 5×5 (Beginner) → 9×9 (Expert)

## Game Systems
- Click cell to toggle path through cell center
- Click-drag to draw continuous path
- Right-click or eraser mode
- Violation highlighting (illegal moves in red)
- Wind arrow visualization
- Hint system (3 per level)
- 3-star ratings
- Level select grouped by tier
- Web Audio BGM + SFX
- localStorage save
- Keyboard support