# Japanese Sums — Competitive Benchmark

## Source
- **Author**: Thomas Snyder (Dr. Sudoku), GMPuzzles
- **URL**: https://www.gmpuzzles.com/blog/category/numberplacement/japanese-sums/
- **Posts**: 30 puzzles in the Japanese Sums category
- **Category**: Number Placement
- **First appeared**: 2014, GMPuzzles blog launch

## Official Rules (verbatim from gmpuzzles.com)
Place the numbers in the indicated range (1-N) in some of the cells so that no number is repeated in any row or column. Numbers on the outside of the grid indicate the sums of adjacent number groups in that row or column, in order. Each sum is separated by at least one unused cell. A ? can represent any sum of 1 or larger.

## Mechanic Analysis
- **Type**: Number placement + constraint deduction
- **Grid**: N×N grid (range 1-N, some cells filled, some empty)
- **Clues**: Outside the grid, row clues (left) and column clues (top)
- **Clue format**: Comma-separated list of sums, e.g. "3,7" means first group sums to 3, second to 7
- **Constraint**: No repeated numbers in any row or column
- **Uniqueness**: Must have exactly one solution

## Difficulty Progression
- Beginner: 4×4, numbers 1-3 (few groups, easy deduction)
- Easy: 5×5, numbers 1-4
- Medium: 6×6, numbers 1-5
- Hard: 7×7, numbers 1-6
- Expert: 8×8, numbers 1-7

## Similar games in catalog
- Kakuro (cross-sum) — different mechanic (clues are cell-adjacent, not outside grid)
- Fill-Pix — nonogram-style, not number placement
- No direct Japanese Sums clone exists in catalog (0 occurrences verified)

## Implementation Plan
- Solution-first generation: fill grid with valid solution → compute clue sums → verify uniqueness via solver
- Solver: constraint propagation + backtracking with pruning (sum matching, no-repeat, group count match)
- UI: click to cycle empty→1→2→...→N→empty, row/column clue display
