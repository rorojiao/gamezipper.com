# Samurai Sudoku — Competitor Benchmark

## Rules (verified)
A Samurai Sudoku puzzle consists of **5 standard 9x9 Sudoku grids** arranged in a
quincunx (cross / X) pattern. The center grid is fully overlapped; the 4 corner
grids each share **one corner 3x3 box** with the center grid.

- Each individual grid follows standard Sudoku rules:
  - Every row contains digits 1-9 once
  - Every column contains digits 1-9 once
  - Every 3x3 box contains digits 1-9 once
- Shared cells (the 4 corner 3x3 boxes of the center grid = the matching corner
  3x3 boxes of the 4 outer grids) must satisfy BOTH grids they belong to.
- Total cells in the puzzle: 5×81 - 4×9 = 369 unique cells.
- Standard puzzle: ~140-180 givens across the 5 grids.

## Top competitors (ranked by SEO authority)

### 1. samurai-sudoku.com (primary keyword owner)
- Daily puzzles
- Difficulty: Easy / Medium / Hard
- Pure text/grid UI
- Print + solve online
- Has hint, check, reset, undo/redo
- Timer + best time tracking (per difficulty)

### 2. freesamuraisudoku.com
- 1001+ puzzles in each of Easy/Moderate/Hard
- Print-friendly PDFs
- No interactive solver

### 3. samuraisudoku.org
- 12+ overlapping variants:
  - Twodoku (2 grids)
  - Triple Doku (3 grids)
  - Clueless Sudoku 2 (10 grids!)
  - Butterfly, Cross, Sohei, W, Windmill, Flower
- Daily puzzle rotation
- Tracks median solve time + average step count

### 4. sudoku.4thewww.com
- 9x9 + 6x6 + Samurai + Killer Samurai
- Multi-grid puzzle variants
- Free PDF downloads

### 5. printable-sudoku-puzzles.com
- Printable Samurai puzzles
- Multiple difficulty levels

### 6. iOS/Android apps (Brightsky Games)
- 200+ levels in Full Version
- 5 difficulty levels
- Features: hint (memo fill), wrong-number highlight, same-number highlight,
  autosave, best-time per level, Game Center achievements

## Common systems (must implement)
1. **5-grid cross layout** with shared 3x3 corner boxes
2. **Number input** (tap cell → tap number, OR keyboard 1-9)
3. **Notes/candidates mode** (toggle to enter pencil marks)
4. **Hint system** (reveal one cell's correct value, limited count)
5. **Wrong-number highlight** (red indicator on conflicts)
6. **Same-number highlight** (highlight all instances of selected digit)
7. **Undo/redo** with full history
8. **Timer** (per-puzzle, with pause)
9. **Best-time tracking** per difficulty (localStorage)
10. **Difficulty levels** — at minimum Easy / Medium / Hard
11. **Autosave** of in-progress puzzles
12. **Reset / Restart / New puzzle** controls
13. **Check progress** (highlight mistakes)
14. **Solve / Reveal** (give up)
15. **Mobile responsive** (5 grids fit on screen via pan/zoom OR column-collapse)

## Visual style references
- Most sites use plain grid lines on white background
- Modern variants use dark mode with neon accents
- GZ style: dark gradient background, neon accent, rounded corners, glass UI

## Music style
- Samurai Sudoku is a long, contemplative puzzle (30-60 min sessions)
- Suggested BGM: ambient/electronic with Japanese aesthetic
  (e.g., soft koto + synth pad, slow tempo, low-key)
- SFX: number place, conflict (negative), row-complete (positive),
  grid-complete (celebration), full-solve (triumph)

## Difficulty curve targets (per-grid given counts)
| Tier        | Per-grid givens | Total givens | Target audience       |
|-------------|-----------------|--------------|-----------------------|
| Beginner    | 38-42           | 175-185      | Casual, first-timers  |
| Easy        | 32-36           | 150-165      | Regular solvers       |
| Medium      | 28-32           | 130-145      | Experienced           |
| Hard        | 24-28           | 110-125      | Advanced              |
| Expert      | 20-24           | 90-110       | Expert                |
| Master      | 17-20           | 75-90        | Master                |

Notes: shared cells (36 total) are always givens to keep per-grid uniqueness
tractable. Non-shared cells get dug to target givens.

## Number of levels
- 27 levels: 5 Beg + 5 Easy + 5 Medium + 5 Hard + 4 Expert + 3 Master
- Each level: 5 interlocking Sudoku grids
