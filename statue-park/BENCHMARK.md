# Statue Park — Competitive Benchmark

## Game Type
Nikoli-style logic puzzle: Place given polyomino pieces on a grid such that:
1. All pieces are placed (no overlap, fully on grid)
2. Pieces form a single connected group
3. No 2x2 block is fully covered
4. Numbered cells indicate how many of their 4 orthogonal neighbors are occupied

## Market Research
- **Catalog gap**: `statue park` = 0 in GameZipper catalog (591 live games)
- **Directory**: `/statue-park` does not exist
- **Nikoli origin**: Official Nikoli puzzle type, fan-designed
- **Appeal**: Spatial reasoning + constraint satisfaction; appeals to Sudoku/Nurikabe fans

## Competitor Analysis
- **Simon Tatham's Portable Puzzles**: No Statue Park variant
- **Puzzle Baron**: No Statue Park
- **BrainBashers**: No Statue Park
- **Nikoli.com**: Has Statue Park (subscription only, no free browser version)
- **App Store**: Very few apps, mostly low-quality

## Conclusion
Zero browser-based free Statue Park game exists. Strong gap with built-in audience from
Nikoli puzzle fans. Mechanically well-suited for Canvas rendering with click-to-toggle cells.

## Game Spec
- **Slug**: statue-park
- **Grid**: Variable size (5x5 to 10x10) depending on tier
- **Pieces**: Given set of polyominoes (tetrominoes/pentominoes) to place
- **Rules**: Place all pieces → connected → no 2x2 → respect numbered clues
- **Interaction**: Click cell to toggle fill; numbers are fixed clues
- **Levels**: 30 levels across 5 tiers
- **Art**: Temple/ancient ruins theme, golden pieces on stone grid
- **Audio**: Ambient mystic BGM + stone placement SFX

## Tier Design
| Tier | Grid Size | Pieces | Clues | Focus |
|------|-----------|--------|-------|-------|
| 1 Beginner | 5x5 | 2-3 small | 1-2 | Learn placement |
| 2 Easy | 6x6 | 3-4 | 2-3 | Connectivity |
| 3 Medium | 7x7 | 4-5 | 3-4 | No 2x2 rule |
| 4 Hard | 8x8 | 5-6 | 4-5 | All constraints |
| 5 Expert | 9x9-10x10 | 6-8 | 5-6 | Complex deduction |
