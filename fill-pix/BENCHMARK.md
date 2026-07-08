# Fill-Pix — Competitive Benchmark

## Game Overview
Fill-Pix is a logic picture puzzle where each cell in a grid contains a number (0-9).
That number tells how many cells in its 3x3 neighbourhood (including itself) should be filled.
The player fills/empties cells to match all clues, revealing a hidden pixel art pattern.

## Market Analysis

### Conceptis Fill-A-Pix
- **Publisher**: Conceptis Puzzles (established puzzle publisher)
- **Platform**: Web, mobile apps, print media
- **Popularity**: Part of the Conceptis puzzle family (Picross, Fill-A-Pix, etc.)
- **Downloads**: Millions across mobile platforms
- **Monetization**: Freemium (free puzzles + paid packs)

### Similar Games in Market
- **Minesweeper** — shares the "number = neighbour count" mechanic but with randomness/guessing
- **Picross/Nonogram** — similar "reveal picture" goal but different rules (row/column clues)
- **Sudoku** — same pure-logic appeal

### Key Differentiators
1. **Pure logic** — no guessing required (unlike Minesweeper)
2. **Unique solution** — every puzzle solvable by deduction alone
3. **Picture reveal** — satisfying visual feedback as cells fill in
4. **Progressive difficulty** — 5x5 beginner to 12x12 expert

## GameZipper Gap Analysis
- `fill-pix`: 0 results (grep verified)
- `fillpix`: 0 results
- `picture-logic`: 0 results
- **Verdict**: True zero-gap, high-value addition

## Feature Comparison

| Feature | Conceptis Fill-A-Pix | GameZipper Fill-Pix |
|---------|---------------------|---------------------|
| Free puzzles | Limited demo | 30 free levels |
| Difficulty progression | Multi-pack | 5 tiers (Beginner→Master) |
| Mistake tracking | Yes | Yes (3 mistakes max) |
| Hints | Paid feature | Free (3 per level) |
| Music | Minimal | Web Audio ambient BGM |
| Cross-platform | Mobile/web | Web (mobile + desktop) |
| Offline play | App only | Works offline (single file) |
| Star ratings | No | Yes (3-star system) |

## Technical Specs
- **Size**: ~54KB single-file HTML
- **Levels**: 30 (6 per tier)
- **Grid sizes**: 5x5 → 6x6 → 8x8 → 10x10 → 12x12
- **Art**: PIL-generated icon.png + og-image.jpg
- **Audio**: Web Audio API (ambient chord BGM + SFX)
- **Rendering**: Canvas 2D
- **Save**: localStorage (progress, settings, stars)
