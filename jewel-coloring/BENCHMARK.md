# Jewel Coloring — Competitive Benchmark

## Target Game
**Jewel Coloring** (`jewel-coloring`) — A relaxing color-by-number pixel art puzzle game where players tap numbered cells to place sparkling jewels and reveal beautiful artwork.

## Competitor Analysis

### 1. Jewel Coloring (TaTa Game Technology) — Primary Competitor
- **Downloads**: 5.8M total, 2.2M/month (May 2026), #1 Casual on AppBrain
- **Rating**: 4.83/5 (50K ratings)
- **Core Mechanic**: Sort jewels by color + place them on numbered grid cells to complete pixel art
- **Key Systems**:
  - Hundreds of unique levels and themes
  - Pixel art puzzles with multiple categories (animals, flowers, ocean, mandalas)
  - Color sorting mechanic (tap to sort jewels into matching groups)
  - 3D jewel depth and shimmer effects
  - Progress saving
  - New themes/collections added regularly
  - Limited-time events
- **Visual Style**: Glowing jewels, gem-like 3D depth, vibrant colors, dark backgrounds
- **Audio**: Relaxing ambient, satisfying jewel placement sounds

### 2. Happy Color® (X-Flow) — Market Leader Color-by-Number
- **Downloads**: 100M+ (one of the largest color-by-number apps)
- **Rating**: 4.6/5
- **Core Mechanic**: Classic color-by-number on canvas — tap numbered areas to fill with correct color
- **Key Systems**:
  - 40,000+ free coloring pages
  - Categories: nature, animals, mandalas, Disney, original art
  - Clear progress tracking (colored numbers grayed out)
  - Coin economy for power-ups
  - Hint system
  - Share completed artwork
  - Daily new content
- **Visual Style**: Clean, flat colors, modern UI
- **Audio**: Relaxing background music

### 3. Jewel Sort Coloring (Google Play)
- **Core Mechanic**: Sort colorful gems into correct slots to complete pixel art (like digital perler beads)
- **Key Systems**: Gem sorting puzzle + pixel art reveal
- **Visual Style**: Sparkling gems, bright colors

### 4. jewelcoloring.org — Web Version
- **Core Mechanic**: Diamond painting / bead art — place jewels on numbered cells
- **Key Systems**: 1,000+ hand-crafted levels, categories (animals, flowers, ocean)
- **Visual Style**: Free online, instant play, no download required

## Required Systems (Must-Implement)

### Core Gameplay
- [x] Numbered grid cells (pixel art)
- [x] Tap-to-fill mechanic (select color from palette, tap matching numbered cells)
- [x] Jewel/gem visual effects (sparkle, shimmer, 3D depth on cells)
- [x] Multiple level categories (animals, nature, geometric, fantasy, food)
- [x] Progress tracking per level (% complete)

### Progression System
- [x] 30+ levels across 5+ categories
- [x] Difficulty progression (grid size increases: 8x8 → 10x10 → 12x12 → 14x14 → 16x16)
- [x] Level selection screen with completion status
- [x] Star rating (1-3 stars based on time/accuracy)
- [x] Progress saved to localStorage

### Power-up / Hint System
- [x] Hint: highlights all cells of the selected color
- [x] Auto-fill: completes one color group automatically
- [x] Undo: reverse last action
- [x] Power-ups earned through gameplay (complete levels to earn coins)

### Visual & Audio
- [x] Dark gradient background (GameZipper style)
- [x] Jewel shimmer/sparkle animations on placed gems
- [x] Particle effects on level completion
- [x] Color palette with jewel-like appearance
- [x] Satisfying placement sound effects (Web Audio API)
- [x] Relaxing ambient BGM (Web Audio API procedural)
- [x] Level complete celebration animation

### Meta Systems
- [x] Tutorial (interactive, skippable)
- [x] Sound toggle (BGM + SFX)
- [x] Settings
- [x] Total gems placed counter
- [x] Gallery of completed artworks

## Difficulty Curve
| Level Range | Grid Size | Colors | Time Target |
|-------------|-----------|--------|-------------|
| 1-5 | 8x8 | 5-6 | 60s |
| 6-10 | 10x10 | 6-8 | 90s |
| 11-15 | 12x12 | 8-10 | 120s |
| 16-20 | 14x14 | 10-12 | 150s |
| 21-25 | 14x14 | 12-14 | 180s |
| 26-30 | 16x16 | 14-16 | 210s |

## Level Categories (6 categories, 5 levels each)
1. **Animals** — Cat, Dog, Butterfly, Owl, Dolphin
2. **Nature** — Flower, Tree, Mountain, Sunset, Rainbow
3. **Food** — Cake, Ice Cream, Pizza, Fruit Bowl, Donut
4. **Geometric** — Mandala, Diamond, Star, Crystal, Prism
5. **Fantasy** — Castle, Dragon, Unicorn, Crown, Magic Wand
6. **Ocean** — Fish, Seahorse, Coral, Whale, Octopus

## Technical Notes
- Each level is a 2D array of color indices (0 = empty, 1+ = color)
- Level data must be pre-designed pixel art patterns
- Colors assigned per level (each level has its own palette)
- Grid rendered on Canvas with jewel-like cell styling
