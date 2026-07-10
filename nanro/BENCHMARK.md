# Nanro — Competitive Benchmark

## Game: Nanro (#614)
- **Type**: Nikoli number-region placement puzzle
- **Slug**: `/nanro/`
- **Origin**: Nikoli Puzzle Box, officially recognized puzzle type

## Catalog Gap Analysis
- `nanro`: 0 occurrences in gamezipper.com catalog (614 games)
- `nanro puzzle`: 0 occurrences
- `number region puzzle`: 0 occurrences
- **Verdict**: True zero-gap — no existing coverage

## Rules (Nikoli Official)
1. A grid is divided into outlined regions (rooms).
2. Place numbers in some cells. Every region must contain at least one numbered cell.
3. The number in each cell indicates how many numbered cells are in that cell's region (including itself).
   - If a region has 3 numbered cells, each numbered cell in that region shows "3".
4. No two orthogonally adjacent numbered cells (even across region borders) may have the same number.

## Competitive Landscape
| Source | Presence | Notes |
|--------|----------|-------|
| AppBrain | Minimal | No dedicated Nanro app |
| Poki | None | No Nanro game |
| CrazyGames | None | No Nanro game |
| gamezipper.com | None | Zero gap confirmed |
| gmpuzzles.com | Blog posts | Grandmaster Puzzles features Nanro |

## Unique Selling Points
- Logic puzzle with elegant number-region mechanic
- Combines counting, deduction, and adjacency constraints
- No existing browser-based clone
- Appeals to Nikoli puzzle enthusiasts

## Technical Implementation
- **Grid sizes**: 5×5 (Beginner) → 10×10 (Expert)
- **Region sizes**: 2-6 cells per region
- **Number values**: 1-4 (typical max)
- **30 levels**: 6 per tier across 5 difficulty tiers
- **Verification**: Constraint-propagation solver for uniqueness
