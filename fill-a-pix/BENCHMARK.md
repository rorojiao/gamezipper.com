# Fill-a-Pix Competitive Benchmark

## Game: Fill-a-Pix (#534)
- **Slug**: fill-a-pix
- **Type**: Logic puzzle (neighborhood-number picture reveal)
- **Scoring**: 24/25 (Gap:10, Search:4, Money:5, Tech:3, Unique:2)

## Market Landscape

### Primary Competitors
1. **Conceptis Fill-a-Pix** (iOS/Android/Web)
   - Developer: Conceptis Puzzles
   - Downloads: 5M+ on Google Play
   - Pricing: Free with IAP puzzle packs
   - Features: 100s of puzzles, multi-size grids (5x5 to 25x30), daily free puzzle
   - Mechanics: Each cell shows number 0-9 = count of filled neighbors among 8 surrounding cells

2. **Fill-a-Pix by appsleb**
   - Alternative mobile app, simpler UI
   - 100K+ downloads

3. **Online clones**: Very few quality browser versions exist
   - puzzle-loop.com / puzzle-bar.com: Basic Flash-era implementations, poor mobile UX
   - No modern responsive HTML5 version found

### Key Differentiators for Our Version
- **Free, no download, mobile-first**: All competitors are mobile apps or ancient Flash
- **30 handcrafted levels**: 5 tiers (Beginner → Expert), grid sizes 5x5 to 15x15
- **Unique picture reveal**: Each puzzle reveals a pixel-art image (procedurally designed)
- **Quality of life**: Undo, hints, error highlighting, 3-star ratings, progress saving

## Mechanic Details

### How Fill-a-Pix Works
1. Grid of cells, each cell has a hidden state: filled or empty
2. Numbered cells show how many of their 8 neighbors (including themselves in some variants) are filled
3. In our version: number = count of filled cells among the 8 neighbors ONLY (not self)
4. Solving logic:
   - Cell showing "0": all 8 neighbors are empty
   - Cell showing "8": all 8 neighbors are filled (interior) / fewer for edge cells
   - Cell showing edge count: proportionally constrained
5. When all cells are correctly filled/empty, the pattern reveals a picture

### Distinction from Nonogram/Picross
- **Nonogram**: Row and column number clues (runs of filled cells)
- **Fill-a-Pix**: Per-cell neighbor count clues (0-9 per cell)
- **Different solving logic**: Fill-a-Pix uses local neighborhood deduction, Nonogram uses line-based deduction
- **Different feel**: Fill-a-Pix is more intuitive and visual, Nonogram is more mathematical

## Monetization
- Banner ads between levels (Monetag MultiTag)
- Interstitial after every 5 levels
- No IAP needed (free to play all 30 levels)

## Technical Approach
- Single-file HTML5, Canvas or DOM grid rendering
- Deterministic puzzle generation: design image → compute clues → present to player
- All puzzles guaranteed solvable by logical deduction (no guessing)
- Level data: each level is a 2D array of 0/1 (the solution image), clues computed from it
