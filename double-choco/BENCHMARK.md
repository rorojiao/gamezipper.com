# Double Choco — Competitive Benchmark

## Game: Double Choco (ダブルチョコ)
**Developer**: Nikoli Co., Ltd.
**Type**: Region division puzzle

## Rules (from nikoli.co.jp)
1. Divide the grid into blocks by drawing borders along cell edges.
2. Each block must contain a **pair** of areas — one white, one gray — having the **same form** (same size and shape).
3. One area may be a **rotated or mirror image** of the other.
4. A number in a cell indicates the number of cells of **that color** in the block.
5. The number equals half the total cells in the block.
6. A block can contain any number of numbered cells (including zero).

## Key Design Decisions
- Grid pre-shaded with white and gray cells in a pattern
- Player draws borders to divide into valid blocks
- Each block = a pair of congruent polyomino regions (one white, one gray)

## Generation Strategy
1. **Solution-first**: Create valid block pairs first.
2. Each block = two congruent polyominoes (one white, one gray), connected orthogonally.
3. Assign color to each polyomino.
4. Place number clues on some cells.
5. Uniqueness: solver verifies only one valid division exists.

## Competitor Analysis
| Source | Quality | Levels | UI | Mobile |
|--------|---------|--------|----|--------|
| Nikoli books | High | Print | N/A | N/A |
| **Our game** | **S-tier** | **30 unique** | **Canvas** | **✅** |
