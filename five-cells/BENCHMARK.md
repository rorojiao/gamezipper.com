# Five Cells — Competitive Benchmark

## Source
- **Nikoli official**: https://www.nikoli.co.jp/en/puzzles/five_cells/
- **Type**: Region division logic puzzle
- **Category**: Nikoli puzzle (grid-based, binary determination)

## Rules (confirmed from nikoli.co.jp)
1. Divide the grid into blocks of exactly 5 cells (pentomino-shaped regions).
2. A number in a cell shows how many border lines surround that cell — the count includes the outer grid frame.
3. There may be as many as 5 cells with numbers in a block.

## Catalog Gap Verification
- `five-cells`: 0 occurrences in games-data.js (grep verified)
- `fivecells`: 0 occurrences
- `five cells puzzle`: 0 occurrences
- No directory exists at `/home/msdn/gamezipper.com/five-cells/`

## Market Analysis
- Five Cells is a Nikoli original puzzle, published in puzzle books and web editions
- No popular mobile app with significant downloads found
- No browser-based clone exists in the GameZipper catalog
- Similar mechanic to "Fillomino" (area division) but with exact-size-5 constraint and border-count clues
- Difficulty curve: 5×5 (4 regions) beginner → 10×10 (20 regions) expert

## Technical Implementation Plan
- Grid: rectangular grid (R×C where R×C divisible by 5)
- Regions: exactly 5 connected cells each (pentomino shapes)
- Clues: numbers 0-4 indicating border count (0=no borders = interior of a large block, but max is 4 since cells have 4 sides)
  - Actually: border lines = edges between this cell and cells in a different region, PLUS the outer frame edges
  - A cell in the interior of a block surrounded by same-region cells on all sides = border count from outer frame only = 0 or more
  - A corner cell has 2 outer frame edges, so minimum 2 if all neighbors same region
  - An edge cell has 1 outer frame edge, so minimum 1
  - Interior cell with 0 frame edges needs at least 1 border line if surrounded by different regions
  
  Wait, let me reconsider: "how many lines of a block there are around it" — this counts the number of edges of that cell that are borders between different regions OR are on the outer grid frame.
  
  So a cell fully surrounded by same-region cells AND not on the grid edge = 0 border lines.
  A corner cell of the grid = 2 outer frame edges minimum.
  An edge cell = 1 outer frame edge minimum.

## Level Generation Strategy
- Reverse approach: first generate a valid division (place pentominoes to tile the grid), then derive clues from the solution, then minimize clues for difficulty.
- Grid sizes: 5×5 (4 regions), 5×6 (6 regions), 5×8 (8 regions), 10×5 (10 regions), 10×10 (20 regions)
- Tiling: use BFS/DFS pentomino placement with backtracking
- Clue generation: for each cell, count border lines (edges to different regions + outer frame)
- Uniqueness check: solver verifies only one valid division satisfies the clues

## Competitive Advantage
- Zero browser competition for "Five Cells" puzzle
- Nikoli brand recognition among puzzle enthusiasts
- Clean mechanic suitable for mobile touch (tap to draw borders)
