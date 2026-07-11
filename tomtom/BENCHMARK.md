# TomTom — Competitive Benchmark

## Game Identity
- **Name**: TomTom
- **Slug**: tomtom
- **Game Number**: #625
- **Category**: Nikoli-style arithmetic grid puzzle (GMPuzzles brand)
- **Designer**: Thomas Snyder ("Dr. Sudoku"), popularized on gmpuzzles.com

## Catalog Gap Verification
- `tomtom`: 0 occurrences in games-data.js ✅
- `tom-tom`: 0 occurrences ✅
- `tom tom puzzle`: 0 occurrences ✅
- Directory `/tomtom/`: does not exist ✅

## Rules (Verbatim from GMPuzzles)

1. Place digits 1 through N into the NxN grid (where N = grid size)
2. Each row and column must contain digits 1-N exactly once (no repeats)
3. The grid is divided into "cages" (outlined regions with a target number and operator)
4. **CRITICAL DIFFERENCE from KenKen**: In TomTom, cells within a cage can repeat digits
   (unlike KenKen where cage cells must be unique). The constraint is row/column uniqueness only.
5. Cage operations: +, -, ×, ÷
   - For subtraction/division cages with >2 cells: **any ordering** of the digits can produce
     the target (e.g., a 3-cell subtraction cage with digits [5,2,1] targeting 2 works because 5-2-1=2)
6. Single-cell cages contain a number with no operation (the cell must equal that number)

## Key Distinctions from KenKen (#627 in catalog)
| Feature | TomTom | KenKen |
|---------|--------|--------|
| Cage digit repeat | ✅ Allowed (only row/col constraint) | ❌ Not allowed |
| Subtraction order | Any ordering works | Fixed (largest - smallest) |
| Division order | Any ordering works | Fixed (largest ÷ smallest) |
| Designer tradition | Thomas Snyder / GMPuzzles | Tetsuya Miyamoto / Nikoli |

## Difficulty Progression (30 levels, 5 tiers)
| Tier | Levels | Grid Size | Cages | Cage Size | Notes |
|------|--------|-----------|-------|-----------|-------|
| Beginner | 1-6 | 4×4 | 5-7 | 1-3 | Simple add/multiply cages |
| Easy | 7-12 | 5×5 | 6-8 | 1-3 | Introduce subtraction |
| Medium | 13-18 | 5×5 | 7-9 | 1-4 | Introduce division |
| Hard | 19-24 | 6×6 | 8-11 | 1-4 | Mixed operations, larger cages |
| Expert | 25-30 | 6×6-7×7 | 10-14 | 1-5 | Complex multi-cell subtraction/division |

## Scoring
- 3-star rating based on time + hints used
- 3 hints per level
- Best time tracked in localStorage

## Monetization
- Monetag MultiTag (banner + native + interstitial)
- Interstitial on level complete (non-intrusive)

## Technical
- Single-file HTML5 Canvas
- Web Audio API BGM + SFX
- Touch + mouse support
- Keyboard input (1-N digits, Backspace erase, H hint, R restart)
- localStorage save
- Responsive design
