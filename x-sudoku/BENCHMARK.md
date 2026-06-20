# BENCHMARK — X-Sudoku (Diagonal Sudoku)

## Game Identity
- **Slug**: `x-sudoku`
- **Display name**: X-Sudoku
- **Tagline**: Diagonals count too.
- **Core rule**: Standard Sudoku (rows/cols/boxes contain 1..N) PLUS both main diagonals (the "X") contain 1..N exactly once.

## Competitive Benchmark

### Reference titles
| Title | Source | Notes |
|-------|--------|-------|
| Sudoku.com — Diagonal / X-Sudoku mode | Playrix / Easybrain | Massive mobile presence; primary search competitor |
| Cracking the Cryptic (YouTube) | Simons / Mark | Popularizes X-Sudoku variants (Sandwich, Thermo, etc.) |
| Logic Masters Deutschland | logic-masters.de | Source of competitive X-Sudoku puzzles |
| Sudoku Wiki (Andrew Stuart) | sudokuwiki.com | X-Sudoku solver + strategy guide |
| Hodoku | hodoku.sourceforge.net | Free X-Sudoku generator/solver benchmark |

### Common systems across competitors (MUST implement)
1. **Grid rendering** with bold box outlines, subtle diagonal "X" overlay showing the constrained diagonals
2. **Number input** — tap cell, tap number from 1..N (or use keyboard for desktop)
3. **Notes / pencil marks** — toggle notes mode; small digits in cell corners
4. **Hints** — reveal one cell on demand (limited per puzzle)
5. **Undo / redo** with full move history
6. **Mistake highlighting** — wrong entries flagged in red; conflict highlighting in real-time
7. **Timer** — counts up; pause on blur
8. **Difficulty selection** — tier grid (Beginner → Master)
9. **Star ratings** — based on time + mistakes + hints used
10. **Progress persistence** — localStorage with version field; per-level completion + best time
11. **Tutorial** — first-time intro overlay explaining the diagonal rule
12. **Sound** — Web Audio API: tap, complete, error, victory
13. **Daily challenge** — deterministic per-day puzzle derived from a seeded generator
14. **Auto-check option** + clear-cell + reset-puzzle + restart

### Visual reference
- Dark gradient background (navy → indigo), neon accent for the X diagonals (cyan + magenta to clearly distinguish them)
- 4x4 grid: 2x2 boxes (Beginner)
- 6x6 grid: 2x3 boxes (Easy/Medium)
- 9x9 grid: 3x3 boxes (Hard/Expert/Master)
- Cells on the main diagonals get a subtle diagonal-tint background to telegraph the constraint visually

### Numerical design
- 4x4: 6 clues (Beginner)
- 6x6: 14 clues (Easy) / 11 clues (Medium)
- 9x9: 30 clues (Hard) / 26 clues (Expert) / 23 clues (Master)
- Total: 27 hand-verified unique puzzles (Python generator + Node.js cross-verifier)

### Score formula
- Base: 1000 / level
- Time bonus: max(0, 600 - elapsed_seconds) → up to +600
- Mistake penalty: -50 per mistake (capped at -300)
- Hint penalty: -100 per hint used
- Stars: ⭐⭐⭐ (≥1300) / ⭐⭐ (≥1000) / ⭐ (≥700) / 0 (below)

## Differentiation vs GZ's existing Sudoku variants
- GZ has: Classic Sudoku, Killer Sudoku, Color Sudoku, Thermo Sudoku
- X-Sudoku covers: the **diagonal constraint** dimension — uncovered by any existing GZ game
- Adds a teaching moment: many casual players don't know the diagonal variant exists → tutorial highlights the X
