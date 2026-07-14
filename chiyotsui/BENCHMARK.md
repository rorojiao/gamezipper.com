# Chiyotsui — Competitive Benchmark

## Puzzle Identity
- **Name**: Chiyotsui (ちょうつがい / "Door Hinge")
- **Origin**: Nikoli-published logic puzzle
- **Category**: Region-based shading puzzle
- **Rule Source**: janko.at/Raetsel/Chiyotsui/Regeln.htm (DE/EN/JA) + cross-plus-a.com/puzzles.htm#Chiyotsui

## Rules (confirmed from janko.at + cross-plus-a.com)

1. Grid is divided into regions (outlined areas).
2. Blacken some cells to form "blocks" (orthogonally-connected black cell groups).
3. Each block spans **exactly two regions** and is **symmetrical** with respect to the shared region border (reflection across the border line).
4. A number in a region indicates how many cells in that region must be blackened.
5. Regions without a number: the count of black cells is unknown.
6. No two blocks may be orthogonally adjacent (blocks must be separated by at least one white cell).

## Core Mechanic Analysis

- **Symmetry constraint**: Each black block is a polyomino that straddles a region boundary. The part on each side is the mirror image of the other (reflected across the shared border edge).
- **Border-crossing**: A block must cross exactly one region border edge. The two halves are mirror-symmetric across that edge.
- **Clue = region black count**: The number tells how many cells total in that region are black (across all blocks that touch the region).
- **Non-adjacency**: Black blocks can't touch orthogonally (like Nurikabe islands).

## Generation Strategy

**Solution-first approach:**
1. Generate a random region partition of the grid (BFS-grown regions of varying sizes).
2. For each pair of adjacent regions, decide whether to place a block on their shared border.
3. Place a mirror-symmetric polyomino straddling the border: pick a shape on one side, mirror it to the other side.
4. Ensure no two blocks are orthogonally adjacent.
5. Derive clue numbers: count black cells per region.
6. Optionally hide some clues (regions without numbers).
7. Verify uniqueness via constraint solver.

## Difficulty Tiers (5 tiers, 6 levels each = 30 total)

| Tier | Grid Size | Regions | Block Sizes | Clue Density |
|------|-----------|---------|-------------|--------------|
| Beginner | 5×5 | 4-5 | 2-4 | 80-100% |
| Easy | 6×6 | 5-6 | 2-5 | 70-90% |
| Medium | 7×7 | 6-8 | 2-6 | 60-80% |
| Hard | 8×8 | 7-9 | 2-7 | 50-70% |
| Expert | 9×9 | 8-10 | 2-8 | 40-60% |

## Competitor Analysis

- **janko.at**: 180 Chiyotsui puzzles (sizes 6×6 to 12×12), Otto Janko author, CC-BY-NC-SA license
- **Nikoli**: Original publisher, puzzle books
- **cross-plus-a.com**: Rules + interactive solver
- **No web game exists**: grep confirms 0 occurrences of "chiyotsui" in GameZipper catalog → true zero-gap

## Differentiation
- First free browser-playable Chiyotsui game
- 30 levels across 5 difficulty tiers
- Full game systems: hints, stars, timer, level select, Web Audio BGM+SFX
- Mobile-friendly touch support
