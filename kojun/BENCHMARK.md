# Kojun — Competitive Benchmark

## Game Identity

**Kojun** (コージュン) is a Nikoli-style logic puzzle. The name combines "ko" (高, high) and "jun" (順, order), referencing the vertical ordering rule that makes this puzzle unique among number-placement puzzles.

## Canonical Rules (janko.at / Nikoli)

1. **Grid**: rectangular grid divided into connected regions. Each region has size N.
2. **Fill**: place numbers 1..N in each cell of a region of size N — each number used exactly once.
3. **Adjacency constraint**: numbers in orthogonally adjacent cells (even across regions) must be different.
4. **Vertical ordering constraint**: if two cells in the SAME region are vertically adjacent, the upper cell's number must be greater than the lower cell's number.

## Constraint Profile

- **Local**: all constraints are between neighboring cells → efficient backtracking solver.
- **Regional**: the 1..N-per-region constraint limits candidate sets dramatically (like Sudoku).
- **Vertical ordering**: adds a directional constraint that prunes candidates early.
- **Uniqueness**: verified by solver (limit=2 solutions) after clue removal.

## Difficulty Curve

30 levels across 5 tiers:
- **Beginner** (1-5): 4×5 to 5×6 grids, 5-7 regions, ~50% clues
- **Easy** (6-10): 5×6 to 6×7 grids, 7-10 regions, ~38-42% clues
- **Medium** (11-15): 6×7 to 7×7 grids, 10-12 regions, ~30-36% clues
- **Hard** (16-20): 7×8 to 8×8 grids, 13-15 regions, ~26-30% clues
- **Expert** (21-30): 8×8 grids, 16-20 regions, ~16-24% clues

## Competitor Analysis

- **Sudoku**: similar constraint structure but no region-size variation or vertical ordering
- **Sukoro**: neighbor-count constraint only, no regions
- **Kojun unique advantage**: combines region-based filling with directional ordering, creating a distinct solving experience

## SEO Keywords

kojun, kojun puzzle, kojun nikoli, コージュン, region number puzzle, number placement puzzle, logic puzzle, free puzzle game, browser puzzle, mobile puzzle game
