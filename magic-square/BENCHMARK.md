# Magic Square Puzzle — Competitive Benchmark

## Game Identity
- **Slug**: magic-square
- **Type**: Magic Square number placement puzzle
- **Mechanic**: Fill empty cells in a grid so every row, column, and diagonal sums to the same magic constant
- **Catalog position**: #538 (after Train Tracks #537)

## Gap Score: 22/25

| Category | Score | Reasoning |
|----------|-------|-----------|
| Market gap | 8/10 | Magic Square is a globally recognized mathematical puzzle. No browser clone in 539-game catalog. Strong educational + casual appeal. |
| Search volume | 4/5 | "magic square puzzle", "magic square solver", "magic square game" — consistent educational/casual traffic worldwide. |
| Monetization | 5/5 | Casual puzzle, perfect for interstitials+banner. Educational audience = high engagement. |
| Technical feasibility | 3/3 | Pure grid logic, DOM/Canvas, no physics. Deterministic puzzle generation. |
| Uniqueness | 2/2 | No existing magic square game in catalog. Nearest: KenKen (different mechanic). |

## Competitive Landscape

### Top Competitors
1. **Magic Square apps on Google Play** (various developers)
   - Simple UI, 3×3 and 4×4 only
   - No progressive difficulty
   - Ads heavy, poor UX
2. **Educational websites** (mathisfun.com, etc.)
   - Static puzzles, no game mechanics
   - No scoring, hints, or progress
3. **Puzzle books/magazines**
   - Print only, no interactivity

### Our Advantages
- Progressive difficulty: 3×3 → 7×7 across 30 levels
- Star rating system based on hints used
- Hint, undo, reset features
- Beautiful Canvas rendering with animations
- Web Audio BGM + SFX
- Full SEO + structured data
- Mobile-first responsive design

## Technical Design

### Magic Square Generation
- **Odd order (3, 5, 7)**: Siamese method (de la Loubère algorithm)
- **Doubly even (4)**: Swap method (fill 1-N², mirror swap)
- **Singly even (6)**: LUX/Strachey method

### Magic Constants
- 3×3: M = 15 (numbers 1-9)
- 4×4: M = 34 (numbers 1-16)
- 5×5: M = 65 (numbers 1-25)
- 6×6: M = 111 (numbers 1-36)
- 7×7: M = 175 (numbers 1-49)

### Level Structure (5 tiers × 6 levels = 30)
- Tier 1: 3×3, 1-3 blanks per level
- Tier 2: 4×4, 3-5 blanks
- Tier 3: 5×5, 5-8 blanks
- Tier 4: 6×6, 8-12 blanks
- Tier 5: 7×7, 12-16 blanks

## Deployed: 2026-07-04
