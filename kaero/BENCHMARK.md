# Kaero — Competitive Benchmark

## Puzzle Identity
- **Name**: Kaero (お家へ帰ろう / ouchihekaerō)
- **Meaning**: "Let's go home" — letters travel home to their regions
- **Author**: Daisuke Kobayashi
- **Source**: indi.s58.xrea.com/kaero/ (via janko.at)
- **Published in**: Puzzle Communication Nikoli

## Official Rules (janko.at confirmed)
1. The grid is divided into outlined **areas** (regions).
2. Some cells contain **letters** (a, b, c, ...).
3. **Move** some letters along orthogonal paths so that **all letters in each area become the same letter**.
4. Movement line segments run horizontally or vertically between centers of **orthogonally adjacent** cells.
5. **At most one** movement line may pass through any cell.
6. Every letter must reach a destination cell within its target area.

### Movement Mechanics
- Each letter travels from its start cell to a destination cell via an orthogonal path.
- Path segments connect adjacent cell centers (up/down/left/right).
- Paths cannot cross or overlap — each cell has at most one line segment.
- After movement, each region's letter cells all show the same letter.

## Example (janko.at #1)
```
Grid: 3×3
Areas:
  1 1 2
  3 1 2
  3 3 1

Problem:
  b c b
  - - -
  a - a

Solution (directions of path segments in each cell):
  s - -
  ne ew w
  - e w
```

## Competitor Analysis

| Source | URL | Features | Gap |
|--------|-----|----------|-----|
| janko.at | janko.at/Raetsel/Kaero/ | Interactive solver, printable | Desktop-only, no mobile, no levels system |
| indi.s58.xrea.com | indi.s58.xrea.com/kaero/ | Original author's site | Japanese-only, basic interface |
| Nikoli (print) | nikoli.co.jp | Magazine puzzles | Print only, not free |

## GameZipper Differentiation
- **30 progressive levels** across 5 difficulty tiers (Beginner → Expert)
- **Mobile-first** touch + drag interface
- **Web Audio** ambient BGM + SFX
- **Hints** (3 per level), star ratings, level select, save/load
- **Free** browser play, no download
- **Unique solution** guaranteed for all 30 levels

## Catalog Gap Verification (2026-07-14)
- `kaero` → 0 occurrences in games-data.js
- `kaero puzzle` → 0
- `ouchihekaero` → 0
- **TRUE ZERO-GAP CONFIRMED**
