# Chained — Competitive Benchmark

## Game Identity
- **Name**: Chained
- **Slug**: `chained`
- **Number**: #648 (next in catalog)
- **Source**: Nikoli official — https://www.nikoli.co.jp/en/puzzles/chained/
- **Catalog gap**: `chained`, `chained puzzle`, `nikoli chained`, `chained block puzzle` — all 0 (grep verified, true zero-gap)

## Official Rules (Nikoli)
Fill in (blacken) cells under the following rules:
1. **Block**: Consecutive (orthogonally-connected) black cells form a "block".
2. **Number clue**: A number on a cell = the total number of black cells in the block containing that cell.
3. **Unknown size**: A "?" on a cell = the block size is unknown (still must be determined).
4. **One clue per block**: Every block must contain exactly ONE number or ONE "?".
5. **Chain**: When two or more blocks touch at a corner (diagonally adjacent), they form a "chain".
6. **All blocks chained**: ALL blocks must be part of at least one chain.
7. **No duplicate shapes in chain**: A chain cannot contain more than one block of the same size AND shape. Blocks are considered the same shape even under rotation or mirror reflection.

## Core Mechanics
- **Type**: Shading puzzle (blacken cells)
- **Clues**: Numbers (block size) and "?" (unknown size) on cells
- **Constraint layers**: 
  1. Local: connected black regions = blocks with exact sizes
  2. Diagonal: blocks touching diagonally form chains
  3. Global: all blocks must be chained, no duplicate shapes within a chain

## Generation Strategy
**Solution-first generation**:
1. Place seed blocks (random polyomino shapes) on the grid
2. Ensure blocks form connected chains (diagonal adjacency graph is connected)
3. Verify no two blocks in the same chain have identical normalized shape (rotation+reflection invariant)
4. Derive clues: number = block size for each block
5. Optionally replace some numbers with "?" for difficulty

## Difficulty Tiers (30 levels)
| Tier | Grid | Blocks | Difficulty |
|------|------|--------|------------|
| Beginner (L1-6) | 5×5 | 4-5 | Simple shapes, all numbered |
| Easy (L7-12) | 6×6 | 5-7 | Add "?" clues |
| Medium (L13-19) | 7×7 | 7-9 | More "?" + complex shapes |
| Hard (L20-25) | 8×8 | 9-12 | L-shapes, T-shapes |
| Expert (L26-30) | 9×9 | 12-15 | Full variety, minimal clues |

## Systems (matching competitor standard)
- Click-to-shade / right-click or erase mode
- Violation highlighting (block size mismatch, duplicate shapes in chain, unchained blocks)
- Hint system (3 per level — reveals correct cell state)
- Check (Enter), Restart (R), 3-star ratings (time-based)
- Level select grouped by tier
- Keyboard: 1 shade, 2 erase, H hint, R restart, Enter check, Esc menu
- Web Audio: ambient BGM + shade/erase/hint/win/error SFX
- localStorage save + settings (music/sfx/autocheck)
- Confetti win animation, touch support

## Verification (3-method)
1. **Python structural** (gen_levels.py): validates all constraints at generation time
2. **Node.js independent** (verify_independent.js): re-checks from levels.json
3. **In-engine** (verify_engine.js): vm.runInContext loads actual index.html checkWin

## SEO
- VideoGame, FAQPage, BreadcrumbList JSON-LD
- gz-sr-only H1
- Monetag ad + gz-analytics + game-footer integration
