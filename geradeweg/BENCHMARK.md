# Geradeweg — Competitive Benchmark

## Puzzle Type
Geradeweg (German: "straight path") — Nikoli-style single loop puzzle.

## Rules (from GMPuzzles / Prasanna Seshadri)
Draw a single, non-intersecting loop that passes through all cells with circles.
The loop may either go straight through or turn at each circle.

- If the loop goes **straight through** a circle, the number indicates the length of
  the straight segment passing through that cell.
- If the loop **turns** at a circle, the number indicates the length of both loop
  segments extending from that circle (in each direction from the turn).

## Authoritative Sources
- GMPuzzles: https://www.gmpuzzles.com/blog/2022/12/geradeweg-by-prasanna-seshadri/
- Solver: https://github.com/kevinychen/nikoli-puzzle-solver/blob/main/src/solvers/geradeweg.ts
- pzpr.js engine: variety registered (pid: geradeweg)
- Book: "Loop Variety Collection 2" by Nikoli

## Catalog Gap
- grep "geradeweg" js/games-data.js = 0 (verified)
- No browser clone exists on GameZipper

## Difficulty Tiers (30 levels)
1. Beginner (5x5) — 6 levels
2. Easy (6x6) — 6 levels
3. Medium (7x7) — 6 levels
4. Hard (8x8) — 6 levels
5. Expert (9x9) — 6 levels

## Core Mechanic
- Grid-based loop drawing on cell edges
- Clues: circled numbers in cells the loop must pass through
- The number constrains the length of straight segments at/through that cell
- Player draws loop segments by clicking/dragging between adjacent cells

## Interaction Design
- Click edge between two cells to toggle line segment
- Drag to draw continuous paths
- Long-press or right-click to erase
- Check button validates solution
- Hint system (3 per level)
- 3-star rating based on time/mistakes

## Monetization
- Monetag MultiTag (banner, native, interstitial)
- Inter-level ad display
