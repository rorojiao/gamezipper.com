# Kropki — Competitive Benchmark

## Game Type
Kropki (Russian: "dots", also called Dots Sudoku / Kropki Sudoku)
A pure-logic Latin-square puzzle where adjacency dots encode the
relationship between neighbouring cell values.

## Rules
- Fill an N×N grid with digits 1..N.
- Every row is a permutation of 1..N.
- Every column is a permutation of 1..N.
- A **BLACK dot (●)** between two horizontally or vertically adjacent cells
  means one value is exactly **twice** the other (e.g. 1/2, 2/4, 3/6, 4/8).
- A **WHITE dot (○)** means the values are **consecutive** integers
  (differ by exactly 1, e.g. 2/3, 4/5).
- **No dot** means NEITHER condition holds.
- "1" never participates in a black dot (no half of 1).

## Top Competitors (web/mobile)
| Game | Publisher | Key feature | Notes |
|------|-----------|-------------|-------|
| **Simon Tatham's Puzzles — "Unequal" / "Keen"** | Tatham | Same latin-square solver family | Gold standard reference impl |
| **Conceptis Kropki** | Conceptis Puzzles | 4x4 → 9x9, weekly pack | Premium puzzle house |
| **BRAINSS Kropki / Sudoku.com Kropki** | Easybrain | Hint + mistake counter + daily | Mobile-first polish |
| **Puzzle Baron's Kropki** | Puzzle Baron | Timed scoring, leaderboards | Stats-rich |
| **Puzzle Page (Dots)** | Puzzling Pixel | Bundled in a daily-puzzle app | Polished art, daily levels |
| **Sudoku.com Kropki variant** | Easybrain | Lives inside 100M-DL Sudoku app | Proven retention |

## Systems to Match (S-grade parity)
1. **Grid sizes**: 4×4, 5×5, 6×6, 7×7 (covers beginner→expert ranges)
2. **Two dot types** (black/white) + explicit "no dot" rendering
3. **Per-level uniqueness**: every published puzzle has a unique solution
4. **Pencil marks / candidate notes** toggle (every cell can hold a set of tentative digits)
5. **Auto-check / conflict highlighting** (same row/col duplicate highlight)
6. **Hint system** (reveal one cell, limited per level)
7. **Undo / reset / restart**
8. **3-star rating** based on hints used and time
9. **Score** with time bonus and hint penalty
10. **Progress persistence**: unlocked levels, best scores per level (localStorage v1)
11. **Tutorial overlay** (skippable) explaining black vs white dot
12. **Difficulty tiers**: Beginner / Easy / Medium / Hard / Expert
13. **BGM + SFX** via Web Audio API
14. **Settings**: sound/music toggles
15. **Level select grid** with star badges

## Numerical Benchmarks
- Conceptis Kropki starter pack: 30 levels, 4 size tiers.
- Sudoku.com Kropki: weekly 5-puzzle packs.
- Best score formula (ours): base 1000 + time_bonus − (hints × 150) − (mistakes × 50).
- 3 stars: hints ≤ 1, time < target; 2 stars: hints ≤ 3; 1 star otherwise.

## Art Direction
- Dark navy gradient background with neon cyan/magenta accents (GZ style).
- White dots = soft glowing circles; black dots = solid filled discs.
- Selected cell = pulsing neon border; same-digit conflict = red shake.
- Digit glyphs: bold rounded sans (Inter / system-ui).

## Music Direction
- "Ambient electronic, mysterious, ethereal, slow tempo, soft synthesizer pads,
  gentle piano, atmospheric puzzle background" (matches GZ puzzle vibe).

## Level Plan
| Tier | Size | Levels | Dots density |
|------|------|--------|--------------|
| Beginner | 4×4 | 5 | high (most relations shown) |
| Easy | 5×5 | 6 | medium-high |
| Medium | 6×6 | 7 | medium |
| Hard | 6×6 | 6 | low (sparser dots) |
| Expert | 7×7 | 5 | low, longer reasoning |
**Total: 29 levels**, each verified to have a unique solution by backtracking solver.
