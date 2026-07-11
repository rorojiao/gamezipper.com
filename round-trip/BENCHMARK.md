# Round Trip — Competitive Benchmark

## Source
- **GMPuzzles** (gmpuzzles.com): Round Trip by Bryce Herdt (guest contributor, 20th opus)
  - URL: https://www.gmpuzzles.com/blog/2021/09/round-trip-by-bryce-herdt/
  - Difficulty: 3 stars (Grandmaster 2:45, Master 5:15, Expert 10:30)
  - Featured in "Loop Variety Collection" book by Ashish Kumar and Murat Can Tonta

## Rules (Canonical)
1. Draw a **single closed loop** in the grid.
2. The loop **may cross itself orthogonally** (perpendicular crossing allowed).
3. The loop **does NOT touch or retrace** itself otherwise (no diagonal touch, no parallel adjacency without a crossing).
4. **Row clues** (left/right of grid): numbers indicate the count of squares visited by the **nearest section** of the loop that travels **horizontally** in that row.
5. **Column clues** (top/bottom of grid): numbers indicate the count of squares visited by the **nearest section** of the loop that travels **vertically** in that column.

## Key Mechanic Distinction
- Unlike standard loop puzzles (Slitherlink, Masyu), **crossings ARE allowed**.
- The "nearest section" rule means: for each row, the clue counts the horizontal run of the loop section closest to the clue (left clue = first horizontal section encountered from left, right clue = first from right).
- A row/column can have the loop enter/exit multiple times (due to crossings).

## Competitor Analysis
| Feature | GMPuzzles | GameZipper (ours) |
|---------|-----------|-------------------|
| Platform | Web (Penpa-Edit) | Web (Canvas single-file) |
| Crossings | ✅ Yes | ✅ Yes |
| Clues | Row L/R + Col T/B | Row L/R + Col T/B |
| Levels | 1/example | 30 (5 tiers) |
| Difficulty | 3-star single | Beginner → Expert |
| Mobile | Limited | ✅ Touch optimized |
| Music/SFX | ❌ | ✅ Web Audio |
| Save | ❌ | ✅ localStorage |

## Generation Strategy
**Solution-first approach:**
1. Generate a valid closed loop that may cross itself orthogonally
   - Start with a Hamiltonian-like cycle on a subset of cells
   - Allow self-crossings by introducing intersection points
   - Alternative: use a "grid graph with crossings" model where each cell can be a straight, turn, or cross node
2. Derive row/column clues from the solution
   - For each row: find all horizontal runs, take the nearest to each side
   - For each column: find all vertical runs, take the nearest to each side
3. Verify uniqueness via constraint solver

## Level Structure (30 levels)
- **Tier 1 (Beginner)**: 5×5, 6 levels — simple loops, few crossings
- **Tier 2 (Easy)**: 6×6, 6 levels — moderate crossings
- **Tier 3 (Medium)**: 7×7, 6 levels — more complex paths
- **Tier 4 (Hard)**: 8×8, 6 levels — dense crossings
- **Tier 5 (Expert)**: 9×9, 6 levels — challenging deduction

## Verification
- 3-method: Python solver + Node.js independent + in-engine checkWin
- All 30 levels must have unique solutions
