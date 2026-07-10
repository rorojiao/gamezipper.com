# Tilepaint Benchmark

## Source
- Nikoli official: https://www.nikoli.co.jp/en/puzzles/tilepaint/
- Category: Shading puzzle with tile-based constraints

## Rules (Official Nikoli)
1. The areas enclosed by bold lines are called "Tiles"
2. A number in a cell with a diagonal line tells the number of black cells to the right or downward in the line/column of that cell, until the grid edge or another diagonal-number cell
3. The cells of a tile must ALL be colored or ALL be left uncolored (all-or-nothing per tile)
4. The solution shows the outline of a thing or object

## Game Design
- Grid-based puzzle with predefined tile regions (bold-bordered areas)
- Some cells contain diagonal clues with numbers
- Each diagonal clue number = count of black cells to its right (horizontal clue) or below (vertical clue)
- Clue direction determined by diagonal line direction
- Player toggles entire tiles between black and white
- Win when all diagonal clues are satisfied

## Level Generation Strategy
- Solution-first: randomly generate black/white patterns for each tile
- Derive clues from the solution
- Place clues at strategic positions (edges of clue regions)
- Verify uniqueness via solver

## Difficulty Tiers (30 levels)
- Tier 1 Beginner: 5×5 grid, 6-8 tiles
- Tier 2 Easy: 6×6 grid, 8-10 tiles
- Tier 3 Medium: 7×7 grid, 10-12 tiles
- Tier 4 Hard: 8×8 grid, 12-16 tiles
- Tier 5 Expert: 9×9 grid, 16-20 tiles
