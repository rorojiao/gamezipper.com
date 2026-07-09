# Nawabari — Competitive Benchmark

## Game Identity
- **Name**: Nawabari (領土 / Territory)
- **Type**: Nikoli region-division logic puzzle
- **Catalog gap**: `nawabari`, `nawabari puzzle`, `territory puzzle` all 0 (grep verified 2026-07-10)

## Rules
1. Divide the grid into connected regions along cell borders
2. Each region contains exactly one numbered cell (clue)
3. The number in each clue cell = count of cells in that region that share an edge with a cell from a DIFFERENT region (border cells / perimeter cells)
4. All cells must belong to exactly one region

## Unique Mechanic
Unlike Shikaku (area=size), Araf (sum constraints), or Pentominous (shape constraints), Nawabari's constraint is about counting BORDER CELLS — cells that are adjacent to other regions. This creates a unique solving dynamic focused on region boundaries and adjacency relationships.

## Competitor Analysis
- **Nikoli**: Original publisher, pencil-and-paper only
- **gmpuzzles.com**: Grandmaster Puzzles blog coverage
- **Puzzle Baron**: Has some variants but not Nawabari specifically
- **No browser-based clone exists** — true market gap

## Difficulty Progression
- Tier 1 (Beginner): 4x4 grids, 3-4 regions
- Tier 2 (Easy): 5x5 grids, 4-5 regions
- Tier 3 (Medium): 6x6 grids, 5-6 regions
- Tier 4 (Hard): 7x7 grids, 6-7 regions
- Tier 5 (Expert): 8x8 grids, 7-8 regions

## Technical Spec
- 30 levels across 5 tiers (6 per tier)
- Canvas rendering with region borders
- Click-drag to draw region boundaries
- Web Audio ambient BGM + SFX
- 3 hints per level, undo, restart
- 3-star ratings based on time + hints used
- localStorage progress save
- Keyboard support
