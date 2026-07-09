# Star Battle — Competitive Benchmark

## Game: Star Battle (#604)
- Slug: `star-battle`
- Type: Nikoli grid placement / constraint logic puzzle
- Tier: 1 (true zero-gap)

## Catalog Gap Verification (2026-07-09)
- `star battle` → 0 occurrences in `js/games-data.js`
- `starbattle` → 0 occurrences
- `star-battle` → 0 occurrences
- Conclusion: **TRUE ZERO-GAP** — no competing entry in catalog

## Rules (Standard Star Battle — gmpuzzles.com)
1. Place stars into some cells of the grid.
2. Each row must contain exactly 2 stars (standard variant: 2-star).
3. Each column must contain exactly 2 stars.
4. Each outlined region must contain exactly 2 stars.
5. Stars may not touch each other, not even diagonally (King-move constraint).

Source: Grandmaster Puzzles (gmpuzzles.com), Thomas Snyder "Dr. Sudoku Prescribes #16"
- Master time: 2:00, Expert: 6:00, Novice: 20:00
- Answer encoding: for each row top→bottom, column index of leftmost star.

## Competitive Landscape
- **gmpuzzles.com**: Daily puzzles, PDF export, themes. No interactive browser game.
- **Puzzle Team / Star Battle apps**: iOS/Android apps with limited free content.
- **bdressman/star_battle_solver** (GitHub): Solver only, no game.
- **Puzzle-Baron, Puzzle-Wikipedia**: Reference, no playable game.
- **No major free browser-based Star Battle** with 30 progressive levels + audio + hints.

## Our Differentiation
- 30 handcrafted levels across 5 tiers (5×5 Beginner → 11×11 Expert)
- Interactive Canvas with click-to-place, violation highlighting, hint system
- Region coloring with distinct palette per region for clarity
- Web Audio API procedural ambient BGM + SFX (place/remove/win/error/hint)
- 3-star rating, level select, keyboard support, localStorage save
- Free, no download, mobile-friendly, single-file HTML

## Generation Strategy
- **Solver-based generation**: Generate random region layouts → solver finds solution → verify uniqueness.
- **Solver**: Row-by-row combinatorial DFS with pruning (column count, region count, adjacency).
- **Uniqueness**: Solver must return exactly 1 solution. Reject if 0 or 2+.
- **Difficulty tiers**: Larger grids + more regions = harder. 5×5 (4 regions) → 11×11 (10+ regions).
