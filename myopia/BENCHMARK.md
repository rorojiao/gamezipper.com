# Myopia — Competitive Benchmark

## Puzzle Identity

**Myopia** is a Grandmaster Puzzles (GMPuzzles) loop puzzle by Ashish Kumar and
other GMPuzzles contributors. Draw a single loop following arrow clues that point
toward the nearest loop segment.

## Sources (Rules Verified)

- **gmpuzzles.com/blog/categories/myopia/** — official category page, rules confirmed.
  - "Draw a single, non-intersecting loop that only consists of horizontal and vertical
    segments between the dots. The arrow clues indicate all the directions (up, down,
    left, and right) where the nearest loop segments are located when looking from
    that square."

## Rules (Canonical — from GMPuzzles)

1. Draw a **single non-intersecting loop** using only **horizontal and vertical** segments.
2. The loop connects **grid dots** (vertices), not cell centres.
3. **Arrow clues** in cells point in ALL directions (up/down/left/right) where the **nearest loop segment** is located, when looking from that cell.
4. If an arrow points up, the nearest loop segment above the clue cell is closer than any segment below/left/right. Multiple arrows = multiple directions have nearest segments.

## Interpretation for Generation

- The loop runs along grid **edges** (between adjacent dots).
- A clue cell at (r,c) looks in 4 directions. For each direction, it finds the nearest edge that is part of the loop. The arrows point to the direction(s) of the nearest such edge(s).
- Specifically: among the 4 directions, arrows point to the direction(s) whose nearest-loop-edge-distance is minimal (tied directions all get arrows).

## Core Mechanic Summary

- Genre: **Loop drawing** (Slitherlink family)
- Constraint: Arrow clues = nearest-segment visibility
- Deduction: Distance-based — arrows constrain where the loop runs relative to each clue.

## GameZipper Differentiation

- **30 levels** across 5 tiers (5×5 → 9×9 dot grids)
- Canvas with dot-grid rendering + loop edge drawing
- **Click between dots** to draw/erase loop segments
- Web Audio ambient BGM + SFX
- Hint system, 3-star ratings, level select, settings

## Level Generation Strategy

**Solution-first generation:**
1. Generate a random valid single loop (non-intersecting, H/V only) on the dot grid.
2. For each cell, compute the 4-direction nearest-loop-edge distances.
3. Derive arrows: point in direction(s) of minimum distance.
4. Place arrows on a subset of cells (enough for uniqueness, not all).
5. Verify uniqueness via solver.

## Verification (3-method)

1. Python loop validator + arrow consistency check
2. Node.js independent verifier
3. In-engine checkWin
