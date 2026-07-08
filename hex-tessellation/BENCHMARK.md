# Hex Tessellation Puzzle — Competitive Benchmark

## Selected: Hex Tessellation Puzzle (#587)

### Phase 0 Market Research
- **Zero-gap verification**: `tessellation`, `polyhex`, `hexiamond`, `polyiamond` all return 0 matches in 588-game catalog
- **Existing hex games** (all different mechanics):
  - hex-block, hex-haven, hex-minesweeper, hex-path-spin, hexa-2048, hexa-away, hexa-sort, hextris, hexxagon
  - None use polyhex/polyiamond **tile-fitting tessellation** mechanic
- **Mobile market evidence**: 
  - "Poly Art" / "Poly Artbook" (25pp 8.5.0.1) — popular poly-art puzzle
  - Tangram/Polyomino-based puzzles are evergreen
  - Hex-based tile fitting is a proven niche (Hexagonia, Tanzen Hex)

### Core Mechanic (Differentiated)
- Player drags **polyhex pieces** (connected groups of 1-6 hexagons) onto a hex grid
- Goal: fill the entire target silhouette with no gaps, no overlaps
- Pieces cannot rotate (beginner) → can rotate 60° (intermediate) → can rotate+flip (expert)
- Mathematical foundation: hex tiling / polyhex enumeration

### Competitive Edge vs Existing Games
| Game | Mechanic | vs Hex Tessellation |
|------|----------|---------------------|
| hexa-sort | Sort stacked hex by color | Different (sorting not tiling) |
| hexa-away | Remove hex from stack | Different (removal not placement) |
| tangram | Square-grid triangles | Different grid topology |
| pentomino | Square-grid 5-cell pieces | Different grid (hex vs square) |
| shape-fold | Fold hinged panels | Different (fold not place) |

### Unique Selling Points
1. Only hex-grid tessellation puzzle in catalog
2. Polyhex pieces (mathematically rich — 1,3,7,22,82,812 hexominoes)
3. Procedural level generation ensures infinite replayability
4. 5 difficulty tiers with progressive piece complexity
