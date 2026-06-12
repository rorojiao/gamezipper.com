# Grass Master — Competitive Benchmark

## Target Game
- **Name**: Grass Master – Cutting Game
- **Publisher**: SayGames Ltd
- **Rank**: ~#17 free Google Play US (June 2026)
- **Downloads**: 500K+ (Android), limited iOS traction
- **Rating**: 4.7 stars, 4.5K reviews
- **Mechanic**: List-fulfillment — drag mower through field, cut items on list, timer pressure
- **Monetization**: Forced interstitial ads + IAP boosters

## Key Competitors

| Game | Publisher | Downloads | Mechanic |
|------|-----------|-----------|----------|
| Mow My Lawn | CASUAL AZUR GAMES | 10M+ | Real-time action mowing |
| Mowing Mazes | Protostar | 100K+ | Maze puzzle swipe |
| Stone Grass | Freeplay | 50M+ | Tycoon + mowing |
| Harvest.io | CASUAL AZUR | 100M+ | IO/snake with tractor |
| Backyard Master | Supersonic | 10M+ | Decoration + mowing |

## Our Game Design Decision
Rather than clone the SayGames action style, we'll build a **TRUE PUZZLE** variant:
- **Grid-based grass field** (top-down 2D)
- **Swipe to mow** lines of grass in any direction
- **Limited moves** per level = puzzle constraint
- **Obstacles**: rocks (can't mow), flowers (must avoid), water patches
- **3-star rating**: stars based on moves used vs par
- **Progressive difficulty**: 30 levels, 5 tiers (6 levels each)
- **ASMR satisfaction**: Canvas particle effects, grass debris, satisfying sounds

## Systems to Implement
1. Grid-based level system with grass/obstacle/flower cells
2. Swipe detection (4 directions)
3. Mowing logic (cut grass cells in swiped direction until blocked)
4. Star rating (par system)
5. Move counter
6. Undo system
7. Level progress (localStorage)
8. Tutorial (first 3 levels guided)
9. Sound effects (Web Audio)
10. Particle effects (grass debris)
11. Settings (sound/music toggle)
12. Responsive canvas

## SEO Keywords
- grass cutting game, lawn mower puzzle, grass master, grass cutter game
- lawn mowing puzzle, grass puzzle, cut the grass game
