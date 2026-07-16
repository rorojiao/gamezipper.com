# Doppelblock — Competitive Benchmark

## Conceptis Puzzle (conceptispuzzles.com)
- Conceptis offers Doppelblock under its "Tapa-Like" logic puzzle lineup.
- Default sizes: 6×6, 8×8, 10×10.
- Provides both daily online puzzles and printable PDFs.
- Family of puzzles shares "two black cells per row/column" structural constraint.
- Visual: black cells shown as solid black squares, digits shown in black/white on light/dark cells.
- Clue numbering: small numbers outside the grid indicate row/column sums.
- **No mouse-click interactivity** on the website — puzzles are print-first.

## Cross-Plus-A (cross-plus-a.com/puzzles.htm#Doppelblock)
- Documents rules verbatim:
  > "Doppelblock ('Double Block') consists of a square grid. The goal is to blacken two cells in each row and each column. The remaining white cells must be filled with the digits from 1 to N-2, where N is the size of the puzzle's side. Each number appears once in every row and column. Numbers outside the grid show the sums of the numbers between two black cells in corresponding row or column."
- Visual: cell-based grid with digits in white cells and black-cell masking for the two-per-row/column blocked cells.
- Difficulty tiers implicit by grid size (N=5 → N=10 typical).

## Wikipedia / Sources
- Listed under "Latin square variants" (although strictly it's a Latin-rectangle with two-black-per-line constraint).
- Considered cousin of "Kakuro" (sum clues) and "Hitori" (shading) but distinct in all three constraint layers.

## Comparison vs GameZipper Existing Catalog
| Existing Game | Constraint Layers | Doppelblock Differentiation |
|---------------|-------------------|----------------------------|
| Sudoku | number placement + 3×3 box | no shading, no sum clues |
| Hitori | shading + no-adjacent | no numbers, no sum clues |
| Kakuro | sum clues + Latin | no shading, no between-blacks sum |
| Suguru | region + number | no shading, no sum clues |
| Skyscrapers | outside clues | no shading, no per-row digits |
| **Doppelblock** | **shading + digits + sum** | **ALL THREE combined** |

## Feature Targets for GameZipper Doppelblock

| Feature | Implementation |
|---------|----------------|
| Grid sizes | 5×5, 6×6, 7×7, 8×8, 10×10 (5 tiers) |
| Number of levels | 30 total (6 per tier) |
| Black cell input | Click cell to toggle black/white |
| Digit input | Click cell to enter digit 1-(N-2) |
| Hint system | 3 hints/level, reveals correct fill |
| Check button | Validates current state vs solution |
| Restart | Resets to level start |
| 3-star rating | time + hint based |
| Timer | Counts up; freezes on win |
| Web Audio BGM | Cmaj7→Dm7→Am7→G ambient chord progression |
| SFX | click/black/digit/hint/win/error |
| localStorage save | level progress, stars, settings, timer |
| Visual style | Clean canvas: white cells with digits, black cells solid dark, gold clue numbers outside grid, violation highlight (red), hint glow (gold) |

## Generation Strategy

For each level:
1. Pick grid size N (5/6/7/8/10).
2. Randomly pick 2 black-cell positions per row such that each column also has exactly 2 blacks (Latin-rectangle-style sample using two permutation matrices: place column-permutation-1 blacks in random subset, column-permutation-2 in disjoint subset, so each column gets exactly 2).
3. With black cells fixed, generate digit constraints:
   - The white cells in each row must contain a permutation of [1, N-2].
   - For each row/col with a clue (50% probability), the clue = sum of digits strictly between the two blacks (i.e., the white cells between them).
4. Run a backtracking solver that places digits first (Latin-rectangle), then compute remaining clues from solution.
5. Verify uniqueness: solver must find exactly 1 solution.
6. Drop clues that don't constrain further (clue must reduce solution space).
7. Output level with N×N grid (0 = unknown/white, -1 = black, >0 = filled digit), plus outside clues array.

## Verification Strategy

**3-method verification** (per pipeline principle #11):
1. **Python structural** (`verify_python.py`): re-implement solver independently, count solutions.
2. **Node.js independent** (`verify_independent.js`): rewrite solver in pure JS, count solutions.
3. **In-engine** (`verify_engine.js`): load actual `index.html` LEVELS via `vm.runInContext`, extract `checkSolution`, run on each level.

All three must return exactly 1 solution per level → 30/30 UNIQUE.