# Triplace — Competitive Benchmark

## Puzzle Identity
- **Name**: Triplace (トリプレイス)
- **Publisher**: Nikoli
- **Rules Source**: janko.at/Raetsel/Triplace/Regeln.htm (DE/EN/JA confirmed)
- **pzprv3 Reference**: src/variety/triplace.js (sabo2/pzprjs)
- **Catalog Gap**: `triplace`, `triplace puzzle`, `nikoli triplace` all 0 (grep verified, true zero-gap)

## Rules (verified from janko.at EN)
1. Divide the grid along the grid lines into triominoes (1×3 straight blocks).
2. Black cells do not belong to any triomino.
3. A number in a black cell indicates how many 1×3 triominoes exist in the row to the right or column below until the next black cell or grid edge.
4. Every non-black cell must be part of exactly one triomino.

## pzprv3 AnsCheck Analysis (from source)
The pzprv3 engine validates 3 conditions:
1. **checkOverThreeCells**: Every room must have ≥3 cells (no blocks smaller than 3)
2. **checkLessThreeCells**: Every room must have ≤3 cells (no blocks larger than 3)
3. **checkRowsColsTileCount**: For each numbered black cell, the count of 1×3 straight triominoes in the row (rightward) or column (downward) until the next black cell/edge must match the number.

Key insight from source: `is1x3` checks if a room is a straight 1×3 rectangle. Only straight 1×3 blocks count toward the clue number. L-shaped or other 3-cell shapes are invalid.

## Competitive Landscape
- **Poki/CrazyGames**: No Triplace game found
- **App Store/Play Store**: No Triplace app found
- **GitHub**: Only pzprv3 reference implementation (no standalone games)
- **janko.at**: Has puzzle examples but no interactive player

**Verdict**: True zero-gap. No browser-playable Triplace exists.

## Game Design
- **Grid sizes**: 5×5 (Beginner) → 6×6 (Easy) → 7×7 (Medium) → 8×8 (Hard) → 9×9 (Expert)
- **30 levels**: 6 per tier, increasing complexity
- **Interaction**: Click cell to cycle border state; draw borders to divide grid into triominoes
- **Clue type**: Numbers in black cells showing triomino count in row/column

## Generation Strategy
Solution-first approach:
1. Start with a grid, place black cells randomly
2. Fill remaining cells with 1×3 triominoes (straight only)
3. Derive clues from the solution: for each black cell, count triominoes right/down
4. Verify uniqueness via backtracking solver

## Technical Requirements
- Single-file HTML5 Canvas game
- Web Audio API BGM + SFX
- Monetag ads, SEO, structured data
- Mobile-responsive, touch support
