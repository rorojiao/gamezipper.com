# Evolomino — Competitive Benchmark

## Source
- **Nikoli official**: https://www.nikoli.co.jp/en/puzzles/evolomino/ (verified 2026-07-13)
- Released: 2024 (newest official Nikoli puzzle type)

## Rules (Nikoli official, English)
> Draw squares (□) in some of the white cells. A group of squares connected vertically and horizontally is called a "block" (including only one square). Each block must contain exactly one square placed on a pre-drawn arrow. Each arrow must pass through at least two blocks. The second and later blocks on the route of an arrow from start to end must progress by adding one square to the previous block without rotating or flipping.

## Mechanic Summary
- **Grid** with some pre-placed `arrows` (each arrow is a single cell marked with an arrow glyph pointing in one of 4 directions: up/down/left/right).
- **Solution**: place **rectangular 1×N blocks** of white squares on the grid.
- **Block** = group of orthogonally connected cells.
- **Constraint 1** — each block contains **exactly one** arrow cell.
- **Constraint 2** — each arrow is on a chain of **≥2 blocks** of increasing sizes (1, 2, 3, ..., k).
- **Constraint 3** — each subsequent block is **+1 cell larger** than the previous (no rotation, no flip = same direction).
- **Constraint 4** — blocks lie on the arrow's path (the chain of blocks emanates from the arrow cell along the arrow's direction; for arrows that turn, the blocks turn with the arrow).

## Visual Analysis (from Nikoli examples)
- Top arrow (5 cells, right-pointing): chain of 3 blocks — 1×1, 1×2, 1×3 (sizes 1, 2, 3).
- Middle arrow (2 cells, up-pointing): chain of 2 blocks — 1×1, 1×2 (sizes 1, 2).
- Bottom arrow (3 cells, right-pointing): chain of 2 blocks — 1×1, 1×2 (sizes 1, 2).
- All blocks stay as straight 1×N rectangles **aligned with the arrow's current direction** at the block's location.

## Generative Recipe (for our game)
1. **Place arrows** at random cells in the grid, each with a random direction (U/D/L/R).
2. **For each arrow, generate a chain** of 2 to k blocks (k ∈ {2,3,4,5}) of increasing sizes 1, 2, ..., k.
3. **The chain extends from the arrow cell along the arrow's direction** for `s_i` cells per block.
4. **Mark the arrow cell + the placed blocks** as the puzzle SOLUTION.
5. **To create the puzzle from the solution**:
   - Keep all arrow markers (they're given).
   - Hide all block cells (turn them into empty white cells).
   - The solver must deduce the block positions and sizes.
6. **For uniqueness**: use a backtracking solver that:
   - For each arrow, enumerates possible block sizes (1..N where N ≤ arrow-path-length).
   - For each combination, checks all constraints.
   - Verifies exactly 1 solution.

## Difficulty Tiers
- **Beginner** (5×5): 4 arrows, max chain = 2 blocks.
- **Easy** (6×6): 5 arrows, max chain = 3 blocks.
- **Medium** (7×7): 6 arrows, max chain = 3 blocks.
- **Hard** (8×8): 7 arrows, max chain = 4 blocks.
- **Expert** (9×9): 8 arrows, max chain = 5 blocks.

## Catalog Gap Verification
```
grep -i 'evolomino' games-data.js itemlist-schema.js index.html sitemap.xml → 0
grep -i 'evolomino' games/ → 0
```
✅ True zero-gap. New puzzle type — no collision with existing catalog (645+ games).

## Differentiation vs Existing Games
- **Akari** (light-up) — single-cell lights, different mechanic.
- **Yajilin** — loop with shaded cells, no block-size chain.
- **Tentaisho / Tentai Show** — region shape matching, not size-1.
- **Shikaku** — rectangles of variable size, no arrow progression.
- **Pentomino-family** — fixed 5-cell shapes, no direction.
- **Evolomino UNIQUE**: arrows + size-sequence chain = 1→2→3→...→k along arrow path.
