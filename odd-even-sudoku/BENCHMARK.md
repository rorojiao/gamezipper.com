# Odd-Even Sudoku — Competitor Benchmark

## Game Identity
- **Name:** Odd-Even Sudoku
- **Slug:** `odd-even-sudoku`
- **Family:** Sudoku variant
- **GZ coverage before this run:** NONE (only classic `sudoku`, `color-sudoku`, `killer-sudoku`, `thermo-sudoku`, `x-sudoku` exist)
- **Selection score:** 22/25 — market 5, SEO 5 (high-search niche uncovered), retention 4, feasibility 5 (proven constructive generator), zero-overlap 3 (sudoku family exists but not this variant)

## Rules (100% confident — Cracking the Cryptic, Sudoku Wiki)
1. Standard Sudoku rules: each row, column, and box contains digits 1..N exactly once.
2. **Cells marked with an "Odd" marker** must contain an odd digit (1, 3, 5, 7, 9 on 9x9).
3. **Cells marked with an "Even" marker** must contain an even digit (2, 4, 6, 8 on 9x9).
4. Cells with no marker have no parity constraint.

Parity sets:
- 4x4: Odd={1,3}, Even={2,4}
- 6x6: Odd={1,3,5}, Even={2,4,6}
- 9x9: Odd={1,3,5,7,9}, Even={2,4,6,8}

## Competitor analysis

### 1. Cracking the Cryptic (YouTube + apps)
- Mobile apps ($3-5): "Classic Sudoku", "Thermo Sudoku", "Sandwich Sudoku", "Cages"
- Difficulty curves: Easy → Medium → Hard → Master (4 tiers, ~50 puzzles each)
- Systems: notes (pencil marks), hints, undo, hint-counter, timer
- Style: minimal cream paper, clean grids, contrasting givens

### 2. Sudoku.com (Playrix-style web)
- DAU: tens of millions; puzzle category leader
- Daily challenge, streaks, achievements, mistakes counter, hint system
- Modern flat UI, vibrant colors, satisfying animations
- Difficulty: Easy/Medium/Hard/Expert/Master + Daily

### 3. BrainBashers / SudokuWiki.org
- Free web Sudoku with many variants (odd/even, X, thermo, killer)
- Pure functional UI, mobile responsive, notes + auto-notes
- Difficulty levels with star ratings

## Required feature parity (must implement)
| System | Required | Notes |
|--------|----------|-------|
| Core gameplay | ✅ | Standard Sudoku + parity cell markers |
| Notes / pencil marks | ✅ | Toggle mode, per-cell candidate set |
| Hint system | ✅ | Reveal one correct digit, count used |
| Undo / redo | ✅ | Full history stack |
| Mistake counter | ✅ | Track invalid placements |
| Timer | ✅ | Live timer with pause |
| Level select | ✅ | 6 tiers, locked/unlocked progression |
| Star ratings | ✅ | 1-3 stars based on time + mistakes + hints |
| Progress save | ✅ | localStorage v1, includes per-level best time + stars |
| Daily challenge | ✅ | One puzzle per day (procedural) |
| Sound feedback | ✅ | Web Audio API: place, error, complete, button |
| Tutorial | ✅ | First-time intro modal explaining parity rules |
| Responsive | ✅ | Desktop + mobile (390x844), touch-action:none |
| SEO | ✅ | JSON-LD VideoGame + FAQ + HowTo + Breadcrumb, OG tags |

## Visual reference
- Dark gradient background (GameZipper signature)
- Odd cells: subtle orange/gold tint + circle marker
- Even cells: subtle cyan/blue tint + circle marker
- Strong box borders (3px), thin cell borders (1px)
- Selected cell + same-row/col/box highlighting
- Same-digit highlighting
- Smooth placement animation, error shake

## Music & SFX
- BGM: gentle ambient puzzle music (procedural via Web Audio)
- SFX: click, place-correct, place-error, hint, level-complete, button-tap

## Level plan (27 levels)
| Tier | Grid | Box | Count | Target Clues | Notes |
|------|------|-----|-------|--------------|-------|
| Beginner | 4x4 | 2x2 | 4 | 5 | gentle intro, ~50% cells parity-marked |
| Easy | 6x6 | 2x3 | 4 | 14 | relaxed |
| Medium | 6x6 | 2x3 | 4 | 11 | more parity markers |
| Hard | 9x9 | 3x3 | 6 | 30 | tough |
| Expert | 9x9 | 3x3 | 5 | 26 | very tough |
| Master | 9x9 | 3x3 | 4 | 22 | extreme, maximum parity markers |

**Total: 27 levels**, each verified unique by independent solver.
