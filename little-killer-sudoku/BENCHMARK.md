# Little Killer Sudoku — Competitive Benchmark

## Game: Little Killer Sudoku (Game #396)

### Rules
- Standard Sudoku rules apply (1-9 in each row, column, and 3x3 box)
- Numbers outside the grid at the corners indicate the SUM of all digits along that diagonal
- Two diagonals are marked: main diagonal (\) and anti-diagonal (/)
- Unlike X-Sudoku, diagonals do NOT need unique digits — only their sum is constrained

### Why This Variant
- **High demand**: Featured regularly on Cracking the Cryptic (500K+ views per video)
- **SEO gap**: "little killer sudoku" has significant search volume, zero browser clones on GameZipper
- **Distinct from existing**: Killer Sudoku uses cage sums; Little Killer uses diagonal sums — different solving logic
- **Feasible generator**: Constructive (Latin-square + diagonal-sum computation + hole-digging with uniqueness check)

### Competitive Analysis
| Competitor | Platform | Levels | Features |
|-----------|----------|--------|----------|
| Cracking the Cryptic | YouTube/Web | N/A | Expert puzzles, video tutorials |
| Sudoku.com | Web/App | Daily | Hints, notes, mistakes tracking |
| Logic Masters Germany | Web | Community | Competition-grade puzzles |
| BrainBashers | Web | Daily | Difficulty ratings, timer |

### Our Implementation
- 27 levels across 6 tiers (Beginner → Master)
- 6x6 grids for Beginner/Easy/Medium (2x3 boxes)
- 9x9 grids for Hard/Expert/Master (3x3 boxes)
- Diagonal sum clues shown outside grid at top-left and top-right
- Full game: timer, notes mode, hints, undo, progress save, achievements
- Procedural art (icon + OG image)
- Web Audio BGM + SFX
- Tutorial overlay for first-time players

### Tier Structure (27 levels)
| Tier | Count | Grid | Givens | Diagonal Clues |
|------|-------|------|--------|----------------|
| Beginner | 4 | 6x6 | 16-18 | Both diagonals |
| Easy | 4 | 6x6 | 12-14 | Both diagonals |
| Medium | 5 | 6x6 | 8-10 | Both diagonals |
| Hard | 5 | 9x9 | 28-32 | Both diagonals |
| Expert | 5 | 9x9 | 22-26 | Both diagonals |
| Master | 4 | 9x9 | 17-20 | Both diagonals |
