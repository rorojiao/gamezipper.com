# Kakurasu — Competitive Benchmark

## Game Overview
Kakurasu is a Nikoli logic puzzle where players shade cells in a grid based on sum clues.
Each row and column has a "position value" (1, 2, 3, ...). Row clues = sum of column-positions
of shaded cells. Column clues = sum of row-positions of shaded cells.

## Competitor Analysis

### 1. BrainBashers Kakurasu
- Grid sizes: 5×5, 6×6, 7×7, 8×8, 9×9
- Features: Daily puzzle, difficulty levels, timer, pencil marks
- Visual: Clean grid with position labels
- No mobile app

### 2. Puzzle-Kakurasu.com / Kakurasu Online
- Grid sizes: 4×4 to 10×10
- Features: Level progression, auto-check, hints
- Simple clean UI

### 3. Nikoli Books (Print)
- Hand-crafted puzzles
- Highest quality, unique solutions guaranteed
- Our advantage: free, interactive, mobile-friendly

## Gap Analysis
- No high-quality interactive Kakurasu on browser games sites
- GZ has ZERO Kakurasu/sum-position puzzles
- Moderate SEO demand ("kakurasu", "kakurasu puzzle", "sum position puzzle")
- Zero overlap with all 410 existing GZ games

## Game Design

### Grid Sizes & Tiers
| Tier | Grid Size | Levels |
|------|-----------|--------|
| Beginner | 4×4 | 5 |
| Easy | 5×5 | 5 |
| Medium | 6×6 | 5 |
| Hard | 7×7 | 4 |
| Expert | 8×8 | 4 |
| Master | 9×9 | 4 |

Total: 27 levels

### Scoring
- Base score per level = grid_size * 100
- Time bonus: max(time_limit - elapsed, 0) * 2
- Hint penalty: -50 per hint used
- 3-star rating based on time + hints

### Features
- Level select grid with star ratings
- Undo (unlimited)
- Reset level
- Hint (highlights one correct cell)
- Timer per level
- Progress saved to localStorage
- Auto-check completion

### Visual Design
- Dark theme (#0a0a1a background)
- Position labels in muted gold (top and left edges)
- Row/column clue numbers in cyan
- Shaded cells: warm amber fill
- Unshaded cells: subtle grid lines
- Smooth transitions on shade/unshade
- Particle effect on level complete

### Art
- Procedural CSS/SVG art (puzzle game, no photorealistic assets needed)
- Canvas-drawn grid with smooth rendering
- Gradient title text

### Audio
- Web Audio API procedural BGM (ambient chord loop)
- SFX: click on shade, click on unshade, level complete, error
