# Sohei Sudoku — Competitor Benchmark

## Game Overview
- **Type**: Multi-grid Sudoku variant (4 overlapping grids)
- **Board**: 21×21 with 288 playable cells
- **Layout**: 4 grids forming a ring/square, each overlapping with 2 neighbors
- **Levels**: 27 across 6 tiers (4 Beg, 4 Easy, 5 Med, 5 Hard, 5 Expert, 4 Master)

## Rules (verified from samuraisudoku.org)
Named for the warrior monks of medieval Japan, Sohei Sudoku has four merged grids.
Each grid has **two overlapping areas** — each grid shares exactly two corner 3×3 boxes
with its two neighbors in the ring.

### Grid Positions (board row, col origins)
- **Grid A** (top center): rows 0–8, cols 6–14
- **Grid B** (right center): rows 6–14, cols 12–20
- **Grid C** (bottom center): rows 12–20, cols 6–14
- **Grid D** (left center): rows 6–14, cols 0–8

### Shared 3×3 Boxes (4 total, 36 shared cells)
1. A.box(2,0) ↔ D.box(0,2): board rows 6–8, cols 6–8 (top-center-left)
2. A.box(2,2) ↔ B.box(0,0): board rows 6–8, cols 12–14 (top-center-right)
3. C.box(0,0) ↔ D.box(2,2): board rows 12–14, cols 6–8 (bottom-center-left)
4. C.box(0,2) ↔ B.box(2,0): board rows 12–14, cols 12–14 (bottom-center-right)

### Cell Count
- Each grid: 81 cells → 4 × 81 = 324
- Shared boxes: 4 × 9 = 36 (each counted twice)
- **Total unique cells: 324 − 36 = 288**

## Top Competitors

### 1. samuraisudoku.com / samuraisudoku.org
- Primary keyword owner for "Sohei Sudoku"
- Daily puzzles, web-based interactive solver
- Difficulty: ranges from moderate to extreme (avg solve 58–64 min)
- Features: pencil marks, error checking, timer, keyboard + touchpad input
- Median time: 58:18; Avg steps: 397.8

### 2. sudoku-variations.com
- Offers Sohei as one of several multi-grid variants
- Popular among advanced Sudoku enthusiasts

### Key Systems Implemented (S-grade parity)
- ✅ 4-grid ring rendering with distinct color tints per grid
- ✅ Shared 3×3 corner boxes highlighted (gold/amber tint)
- ✅ Thick borders delineating each 9×9 grid
- ✅ Standard Sudoku constraints per grid + shared cell consistency
- ✅ Cell selection (click/tap + keyboard arrows)
- ✅ Number input (palette + keyboard 1–9)
- ✅ Notes/pencil marks (toggle mode)
- ✅ Hint system (reveal correct value)
- ✅ Undo (full history)
- ✅ Check (error detection)
- ✅ Reset level
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
1. Generate Grid A (complete valid 9×9 Sudoku solution)
2. Extract A.box(2,0) → fix D's box(0,2); extract A.box(2,2) → fix B's box(0,0)
3. Generate Grid D with box(0,2) fixed
4. Generate Grid B with box(0,0) fixed
5. Verify D.box(2,2) and B.box(2,0) are row-compatible (disjoint digits per row)
6. Generate Grid C with box(0,0)=D.box(2,2) and box(0,2)=B.box(2,0) both fixed
7. Keep all 4 shared boxes as givens → grids decouple → independent uniqueness
8. Dig holes in non-shared cells with uniqueness check per grid

## Difficulty Curve
| Tier | Levels | Target Givens/Grid | Unique Cells/Grid |
|------|--------|--------------------|--------------------|
| Beginner | 4 | 40 | 25/36 |
| Easy | 4 | 35 | 20/36 |
| Medium | 5 | 30 | 15/36 |
| Hard | 5 | 27 | 12/36 |
| Expert | 5 | 25 | 10/36 |
| Master | 4 | 22 | 8/36 |
