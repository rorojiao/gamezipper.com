# Outside Sudoku — Competitive Benchmark

## Game Overview
Outside Sudoku (also called Marginal Sudoku) is a Sudoku variant where digits
listed outside the grid indicate which numbers appear in the nearest cells of
that row or column. Standard Sudoku rules (rows, columns, boxes contain 1-N
exactly once) still apply.

## Rules
- Standard Sudoku: each row, column, and box contains 1-9 (or 1-6) exactly once.
- Outside clues: A digit listed to the LEFT of a row must appear in the first
  box-width cells (cols 1-3 for 9x9, cols 1-3 for 6x6) of that row.
- A digit listed to the RIGHT must appear in the last box-width cells.
- A digit listed ABOVE a column must appear in the first box-height cells.
- A digit listed BELOW must appear in the last box-height cells.
- A digit NOT listed on a side must NOT appear in that border zone.

## Competitors
1. **Cracking the Cryptic** (YouTube) — frequently features Outside Sudoku.
   Large audience, high engagement on variant Sudokus.
2. **SudokuWiki / sudopedia** — documents Outside Sudoku rules and solving
   techniques (hidden singles in border zones, cross-hatching with zone
   restrictions).
3. **Puzzle League / Logic Masters Germany** — competition puzzles with
   Outside constraints. Well-defined solving techniques.

## Key Systems to Implement
- [x] Standard Sudoku solving (rows, columns, boxes)
- [x] Outside clue rendering (4 sides of the grid)
- [x] Outside clue constraint enforcement (zone-restricted candidates)
- [x] Notes/pencil marks mode
- [x] Hint system (reveal a correct cell)
- [x] Undo
- [x] Error highlighting
- [x] Level progression (6 tiers, 27 levels)
- [x] Daily challenge
- [x] Tutorial overlay
- [x] Progress save (localStorage with version)
- [x] Timer + best time
- [x] Web Audio BGM + SFX

## Difficulty Curve
| Tier     | Grid | Givens Target | Outside Clues |
|----------|------|---------------|---------------|
| Beginner | 6x6  | 14-20         | All 4 sides   |
| Easy     | 6x6  | 8-12          | All 4 sides   |
| Medium   | 6x6  | 3-6           | All 4 sides   |
| Hard     | 9x9  | 22-30         | All 4 sides   |
| Expert   | 9x9  | 14-20         | All 4 sides   |
| Master   | 9x9  | 6-12          | All 4 sides   |

## Theme
Indigo/violet accent (#818cf8 / #6366f1) — distinct from:
- sky-blue anti-knight, gold anti-king, amber greater-than, rose girandola,
  teal jigsaw.
