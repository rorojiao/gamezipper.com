# Tasukuea (タスクエア) — Benchmark

## Source
- **Cross-plus-a**: https://www.cross-plus-a.com/puzzles.htm#Tasukuea
- **Name origin**: "Tasquare" — from Japanese, literally "find squares"
- **Publisher**: Nikoli-style logic puzzle

## Rules (confirmed)
1. Cells with numbers or question marks (`?`) can NOT be blackened.
2. Black cells form **square areas** (k×k blocks). Different squares must NOT be orthogonally adjacent (they can touch diagonally).
3. A number in a circle indicates the **total number of black cells** in areas orthogonally neighbouring the numbered cell.
4. A cell with a question mark must have at least one adjacent black cell.
5. All white cells must be orthogonally connected.

## Mechanic Analysis
- **Shading puzzle** with square-block constraint
- Number clues count adjacent black cells (from any square)
- Squares can be 1x1, 2x2, 3x3, etc.
- White connectivity ensures no isolated regions
- Strong uniqueness: square shapes + no-orth-adjacency + white connectivity + number constraints

## Difficulty Tiers
| Tier | Grid | Squares | Numbers | ? cells |
|------|------|---------|---------|---------|
| Beginner | 5x5 | 1-2 | 2-3 | 0-1 |
| Easy | 6x6 | 2-3 | 3-4 | 1-2 |
| Medium | 7x7 | 2-3 | 3-5 | 1-2 |
| Hard | 8x8 | 3-4 | 4-6 | 2-3 |
| Expert | 9x9 | 3-4 | 5-7 | 2-3 |

## Generation Strategy
1. Place non-overlapping k×k squares (random sizes, non-adjacent)
2. All other cells = white
3. Compute number clues (count adjacent black cells)
4. Place numbers/?? at white cells adjacent to squares
5. Verify uniqueness via backtracking solver

## Verification Strategy
- **Python structural**: check square shapes, no-adjacency, white connectivity, clue counts
- **Node.js independent solver**: MRV backtracking with constraint propagation
- **In-engine checkSolution**: vm.runInContext with actual game code

## Competitive Advantage
- Zero-gap in GameZipper catalog
- Nikoli heritage = proven puzzle design
- Unique "square block" mechanic different from standard shading puzzles
- Good for mobile (tap-to-shade)
