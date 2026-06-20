# BENCHMARK — Arrow Sudoku

## Game Identity
- **Slug**: `arrow-sudoku`
- **Display name**: Arrow Sudoku
- **Tagline**: Arrows sum to the circle.
- **Core rule**: Standard Sudoku (rows/cols/boxes contain 1..N) PLUS each arrow constraint: the digit in the circled cell equals the SUM of the digits along the rest of the arrow path.

## Competitive Benchmark

### Reference titles
| Title | Source | Notes |
|-------|--------|-------|
| Sudoku.com — Arrow Sudoku mode | Easybrain | Massive mobile presence; variant popularized in-app |
| Cracking the Cryptic (YouTube) | Mark / Simon | Arrow Sudoku is one of the most-watched variant categories |
| Logic Masters Deutschland | logic-masters.de | WSC source of competitive Arrow Sudoku puzzles |
| LMD Sudoku Wiki (Andrew Stuart) | sudokuwiki.com | Arrow solver + strategy guide |
| Hodoku | hodoku.sourceforge.net | Free Arrow Sudoku generator/solver benchmark |
| CTC Solver (crackingthecryptic.com) | Apps | Dedicated Arrow Sudoku mobile app — direct competitor |

### Common systems across competitors (MUST implement)
1. **Grid rendering** with bold box outlines, arrows drawn as lines with circled origin cells
2. **Number input** — tap cell, tap number from 1..N (or use keyboard for desktop)
3. **Notes / pencil marks** — toggle notes mode; small digits in cell corners
4. **Hints** — reveal one cell on demand (limited per puzzle)
5. **Undo / redo** with full move history
6. **Mistake highlighting** — wrong entries flagged; conflict highlighting in real-time
7. **Timer** — counts up; pause on blur
8. **Difficulty selection** — tier grid (Beginner → Master)
9. **Star ratings** — based on time + mistakes + hints used
10. **Progress persistence** — localStorage with version field; per-level completion + best time
11. **Tutorial** — first-time intro overlay explaining the arrow sum rule
12. **Sound** — Web Audio API: tap, complete, error, victory, arrow-place
13. **Daily challenge** — deterministic per-day puzzle derived from a seeded generator
14. **Auto-check option** + clear-cell + reset-puzzle + restart

### Visual reference
- Dark gradient background (navy → indigo), neon accent for arrows (amber/gold lines with cyan circle origins to clearly distinguish them)
- 4x4 grid: 2x2 boxes (Beginner) — short arrows (2 cells)
- 6x6 grid: 2x3 boxes (Easy/Medium) — short-to-medium arrows (2-3 cells)
- 9x9 grid: 3x3 boxes (Hard/Expert/Master) — varied arrows (2-4 cells)
- Circle origin cells get a subtle gold-tint background; arrow path cells get subtle amber tint

### Numerical design
- 4x4: arrows with sum ≤ 4 (Beginner) — simple 2-cell arrows
- 6x6: arrows with sum ≤ 6 (Easy) / ≤ 6 (Medium) — 2-3 cell arrows
- 9x9: arrows with sum ≤ 9 (Hard/Expert/Master) — 2-4 cell arrows, fewer givens
- Total: 27 puzzles (4 Beg + 4 Easy + 4 Med + 6 Hard + 5 Exp + 4 Master)
- All puzzles verified unique by independent Node.js solver

### Score formula
- Base: 1000 / level
- Time bonus: max(0, 600 - elapsed_seconds) → up to +600
- Mistake penalty: -50 per mistake (capped at -300)
- Hint penalty: -100 per hint used
- Stars: ⭐⭐⭐ (≥1300) / ⭐⭐ (≥1000) / ⭐ (≥700) / 0 (below)

## Differentiation vs GZ's existing Sudoku variants
- GZ has: Classic Sudoku, Killer Sudoku, Color Sudoku, Thermo Sudoku, X-Sudoku, Odd-Even Sudoku
- Arrow Sudoku covers: the **arrow sum constraint** dimension — uncovered by any existing GZ game
- Adds a teaching moment: the arrow sum rule is elegant and unlike any other variant on GZ → tutorial highlights the arrow visualization
