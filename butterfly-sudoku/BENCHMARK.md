# Butterfly Sudoku — Competitor Benchmark

## Game Overview
- **Type**: Multi-grid Sudoku variant
- **Grid**: Four overlapping 9×9 grids in 2×2 pattern (15×15 combined)
- **Levels**: 27 across 6 tiers (4 Beg, 4 Easy, 5 Med, 5 Hard, 5 Expert, 4 Master)

## Competitor Analysis

### samuraisudoku.org / sudokupuzzle.org
- Offers Butterfly Sudoku as one of several multi-grid variants
- Daily puzzles, web-based solver
- Features: pencil marks, error checking, timer

### sudoku-variations.com / crackingthecryptic (YouTube)
- Butterfly layout described as "four grids meeting at center"
- Popular among advanced Sudoku enthusiasts
- Difficulty ranges from moderate to extreme

### Key Systems Implemented (S-grade parity)
- ✅ Multi-grid rendering with distinct color tints per quadrant
- ✅ Cross-shaped shared region highlighted (gold tint)
- ✅ Thick borders delineating each 9×9 grid
- ✅ Standard Sudoku constraints per grid + shared cell consistency
- ✅ Cell selection (click/tap + keyboard arrows)
- ✅ Number input (palette + keyboard 1-9)
- ✅ Notes/pencil marks (toggle mode)
- ✅ Hint system (reveal correct value)
- ✅ Undo (full history)
- ✅ Check (error detection)
- ✅ Reset level
- ✅ Mistake tracking (3-strike game over)
- ✅ Timer
- ✅ Level selector with progress tracking
- ✅ Progress saving (localStorage with version)
- ✅ Same-digit highlighting
- ✅ Procedural BGM (Web Audio API)
- ✅ Sound effects (click, place, error, complete)
- ✅ Confetti celebration on win
- ✅ Responsive (desktop + mobile)
- ✅ SEO (4 JSON-LD schemas, og tags, canonical)

## Generation Strategy
- Canonical cyclic Latin square formula: `G[r][c] = (3*(r%3) + r//3 + c) % 9 + 1`
- Structure-preserving shuffles: band permutations, within-band permutations, digit permutations
- Shared cross region (81 cells) always kept as givens → each grid independently unique
- Independent 9×9 solver verifies uniqueness per grid
- Node.js cross-verification: 27/27 UNIQUE + VALID (0.01s)

## Difficulty Curve
| Tier | Levels | Givens | Unique Cells/Grid |
|------|--------|--------|-------------------|
| Beginner | 4 | 181 | 25/36 |
| Easy | 4 | 161 | 20/36 |
| Medium | 5 | 141 | 15/36 |
| Hard | 5 | 129 | 12/36 |
| Expert | 5 | 121 | 10/36 |
| Master | 4 | 113 | 8/36 |
