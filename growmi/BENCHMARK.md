# Growmi - Competitive Benchmark

## Game Overview
Growmi is a puzzle platformer where players control an adorable worm-like creature navigating through obstacle-filled levels. The player has a limited number of moves that increase as they clear more areas. The goal is to collect all stars/food items while avoiding traps and obstacles.

## Slug: growmi
## Slug Alternative: level-eaten

## Competitor Analysis

### 1. Growmi (Original - Carlos Pedroso/itch.io + Poki/CrazyGames/Coolmath)
- **Platform**: Web (Poki, CrazyGames, Coolmath Games)
- **Core Mechanics**: 
  - Control a worm character on a grid-based map
  - Limited moves per level (displayed as move counter)
  - Collect all stars/food to complete each level
  - Traps: spikes, moving enemies, locked doors, buttons/switches
  - The worm grows as it eats, changing shape
- **Level Count**: 50+ levels across multiple worlds/areas
- **Difficulty Curve**: Progressive - early levels teach basic movement, later add switches/doors/enemies
- **Scoring**: Star rating based on moves used (fewer = better), par system
- **Monetization**: Ads between levels (interstitial on level complete)
- **Visual Style**: Cute, colorful pixel art, smooth animations
- **Music**: Catchy chiptune-style BGM
- **Save System**: Auto-save progress, level select with lock/unlock
- **Tutorial**: First few levels serve as tutorial, no separate tutorial screen

### 2. Snake Puzzle Games (Generic)
- **Platform**: Mobile + Web
- **Core Mechanics**: Snake-like movement, grid-based puzzles
- **Key Difference**: Growmi is NOT a traditional snake game - it's a puzzle platformer with limited moves
- **Common Features**: Grid movement, collectibles, obstacles

### 3. Level Eaten (Variant)
- Similar to Growmi but with "grow-to-eat" twist
- Player grows/shrinks to solve puzzles
- Size manipulation as core mechanic

## Systems to Implement

| System | Priority | Details |
|--------|----------|---------|
| Core Movement | P0 | Grid-based WASD/Arrow/Swipe, 4-directional |
| Move Counter | P0 | Limited moves per level, displayed prominently |
| Collectibles | P0 | Stars/food items, collect all to unlock exit |
| Level System | P0 | 30 levels, 5 tiers (6 levels each) |
| Star Rating | P1 | 3-star based on moves used vs par |
| Progress Save | P0 | localStorage with version field |
| Tutorial | P0 | First 3-4 levels teach mechanics |
| Traps/Obstacles | P1 | Spikes, walls, pushable blocks |
| Switches/Doors | P2 | Button-triggered doors |
| Undo | P1 | Undo last move |
| Reset Level | P0 | Restart current level |
| Level Select | P0 | Grid-based level select with lock/unlock |
| Sound FX | P1 | Web Audio procedural SFX |
| BGM | P1 | Ambient puzzle music |
| Animations | P1 | Smooth movement, collect feedback, death animation |

## Difficulty Progression (5 Tiers)

| Tier | Levels | New Mechanic | Grid Size |
|------|--------|-------------|-----------|
| 1 (Beginner) | 1-6 | Basic movement + collect stars | 8x8 |
| 2 (Easy) | 7-12 | Spikes/traps introduced | 8x8 |
| 3 (Medium) | 13-18 | Pushable blocks + switches | 10x10 |
| 4 (Hard) | 19-24 | Moving enemies + doors | 10x10 |
| 5 (Expert) | 25-30 | Combined mechanics, tight move budget | 12x12 |

## Art Style Direction
- Cute, colorful worm character (simple canvas-drawn)
- Clean grid with subtle lines
- Dark GameZipper theme (dark gradient background)
- Neon accent colors for collectibles
- Particle effects on star collection
- Smooth tween animations for movement

## Key Differentiators from GZ Existing Games
- NOT a snake game (limited moves, puzzle focus)
- Grid-based puzzle platformer with worm character
- "Grow" mechanic - character visually grows as it collects items
- Strategic move budget forces planning
- Zero overlap with existing 253+ GZ games

## SEO Keywords
growmi, growmi game, growmi puzzle, worm puzzle game, level eaten, grow puzzle, grid puzzle game, move puzzle, brain puzzle, logic puzzle
