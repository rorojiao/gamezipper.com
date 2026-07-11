# Mid-Loop — Competitive Benchmark

## Source
- **Nikoli Mid-Loop (ミッドループ)** — https://www.nikoli.co.jp/en/puzzles/mid_loop/
- First published: Nikoli Puzzle Communication magazine, available in pocket books (PuzzleBox)
- Author: Nikoli (Japanese puzzle publisher)

## Rules (verified)
1. Draw a single, continuous, closed loop along the grid lines.
2. The loop may not branch or intersect itself.
3. The loop must pass through every black circle (dot) on the grid.
4. Each circle must sit at the midpoint of a straight segment — meaning the
   loop extends in a straight line (horizontal or vertical) the SAME number of
   cells on both sides of the circle before turning (or being symmetric about
   the circle).
5. Circles are located at cell centers, but the loop runs along grid edges —
   so actually the circle is between two cells along the edge. **Clarification**:
   In Nikoli's official variant, the dots are on grid vertices (intersections).
   The loop passes through the dot vertex. The two loop edges leaving the dot
   extend in opposite directions along the same line, and they must be of equal
   length before turning. The simplest and most common interpretation:
   **The dot sits at the midpoint of a 2-cell straight segment** — i.e., the
   loop goes straight through the dot, and on each side of the dot the next
   edge is in the same direction (forming a 2-edge straight segment where the
   dot is in the middle).

## Core mechanic summary
- **Loop drawing**: single closed non-self-intersecting loop on grid lines
- **Constraints**:
  - Pass through every dot
  - At each dot: the loop must pass straight through (no turn at the dot)
  - At each dot: equal straight-length on both sides before any turn

## Difficulty tiers (planned)
| Tier | Grid size | Dots | Notes |
|------|-----------|------|-------|
| Beginner | 4×4 | 3-4 | Small, easy deductions |
| Easy | 5×5 | 4-6 | |
| Medium | 6×6 | 6-8 | |
| Hard | 7×7 | 8-11 | |
| Expert | 8×8 | 10-14 | Requires deep lookahead |

## Competitor analysis
- **Nikoli Mid-Loop**: The original. Paper/pencil. No digital hints.
- **Puzzle Team / puzzle-loop apps**: Basic loop drawing, no midpoint constraint.
- **Slitherlink/Masyu (competitors)**: Similar loop drawing but different clue types.
- **Gap**: No Mid-Loop implementation exists on GameZipper. Mid-Loop's unique
  midpoint constraint makes it distinct from all existing loop puzzles
  (Slitherlink=numbers, Masyu=white/black circles, Yajilin/Loop=cells).

## Key generation strategy
**Solution-first generation**:
1. Generate a random Hamiltonian-style loop on the grid (DFS + Warnsdorff on
   grid-vertex graph).
2. For each vertex on the loop, check if it qualifies as a valid "midpoint":
   the loop passes straight through it AND the straight segment is at least
   2 edges long on each side.
3. Select a subset of qualifying midpoints as clues (dots).
4. Verify uniqueness via constraint solver.

## Verification method
- **Python BFS solver**: validates uniqueness of all 30 levels
- **Node.js independent verifier**: re-implements solver in JS
- **In-engine Node.js**: loads index.html, runs checkWin on each level
