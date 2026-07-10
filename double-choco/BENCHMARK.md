# Double Choco — Competitive Benchmark

## Puzzle Overview
- **Source**: Nikoli Co., Ltd. (official English rules at nikoli.co.jp/en/puzzles/double_choco/)
- **Type**: Region division puzzle
- **Catalog gap**: `double-choco`, `doublechoco`, `double_choco` all 0 (grep verified, 618-game catalog)

## Rules (from Nikoli EN official)
1. Divide the grid into blocks by drawing solid lines over the dotted lines.
2. A block must contain a pair of areas of white cells and gray cells having the same form (size and shape).
3. One area may be a rotated or mirror image of the other.
4. A number indicates the number of cells of that color in the block; the number corresponds to half the number of cells of the block.
5. A block can contain any number of cells with the number.

## Key Mechanic Analysis
- Grid is pre-colored with gray and white cells (the coloring IS the puzzle input)
- Player must partition the grid into blocks where each block has exactly two polyomino regions (one gray, one white) that are the same shape (rotations/reflections allowed)
- Numbers in cells provide size constraints for that color's region within the block
- The output is border lines between blocks

## Competitive Landscape
- **Nikoli official**: Books and magazine publication (primary source)
- **gmpuzzles.com**: Has Double Choco archive with hand-crafted puzzles by expert authors
- **puzz.link**: Route exists but is a ghost (no implementation in pzprv3 source)
- **App Store/Play Store**: No dedicated app found
- **Browser games**: No browser clone exists (verified via Google search)

## H5 Feasibility: HIGH
- Grid-based puzzle with clear geometric constraints
- Click-between-cells-to-draw-border interaction (proven in Pentominous, Canal View)
- Solver is constraint-propagation + backtracking (similar to Shikaku, Pentominous)
- Level generation: solution-first approach (generate valid coloring + partition, derive clues, verify uniqueness)

## Generation Strategy
1. Generate a random valid solution: partition grid into blocks, each with two matching-shape polyominoes (gray + white)
2. Derive the cell coloring from the solution (gray/white cells)
3. Select clue numbers from solution (place numbers in some cells)
4. Verify unique solution via backtracking solver
5. Minimize clues for difficulty tuning

## Difficulty Tiers
- Tier 1 (Beginner): 4x4, 2-3 blocks, heavy clues
- Tier 2 (Easy): 5x5, 3-4 blocks, moderate clues
- Tier 3 (Medium): 6x6, 4-5 blocks, fewer clues
- Tier 4 (Hard): 7x7, 5-6 blocks, sparse clues
- Tier 5 (Expert): 8x8, 6-8 blocks, minimal clues
