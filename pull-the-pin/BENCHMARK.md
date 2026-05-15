# Pull the Pin — Benchmark Document

## Core Game Concept
Physics-based puzzle game where the player removes pins in the correct order to guide colored balls into a pipe/bucket at the bottom of the screen.

## Competitor Analysis

### 1. Pull the Pin (Popcore GmbH)
- **Platform**: iOS, Android, Browser (CrazyGames 8.7/10)
- **Downloads**: 100M+ on Google Play, 250K+ ratings (4.36 stars)
- **Core Mechanic**: Tap pins to remove them; balls fall via gravity into pipe
- **Level Count**: 300+ levels (gameonyx walkthrough shows 50+, actual game has hundreds)
- **Difficulty Curve**: Progressive — starts with 1-2 pins, escalates to 6+ pins with hazards
- **Hazards**: Bombs (explode on contact with balls, destroy nearby balls), Gray balls (need coloring before counting)
- **Coloring Mechanic**: Gray balls turn colored when touching colored balls
- **Wall Mechanics**: Platforms/walls that redirect ball flow
- **Scoring**: Coins earned per level, bonus coins for perfect completion
- **Progression**: Level select with 3-star rating, coin rewards
- **Customization**: Ball skins, themes, pin skins, trails (gacha + coin purchase)
- **Meta-Game**: Town builder (passive coin generation)
- **Art Style**: Simple 3D-like spheres, clean UI, minimalistic

### 2. How to Loot! Pin Pull (Poki)
- **Platform**: Browser (Poki)
- **Mechanic**: Pull pins to guide hero to treasure, avoid lava/enemies
- **Variation**: RPG theme instead of pure ball physics
- **Features**: Character movement, enemy avoidance, treasure collection

### 3. Pull the Pin Rescue (CrazyGames)
- **Platform**: Browser
- **Mechanic**: Pull pins to free prisoners, avoid lava, guide hero
- **Variation**: Rescue theme with character and hazards

## Systems to Implement (Mandatory)

### Core Systems
1. **Pin System**: Clickable pins that can be removed (ball drops on removal)
2. **Physics System**: Simple gravity for balls (no need for full physics engine — simple falling + collision with platforms)
3. **Ball Coloring**: Gray balls turn colored on contact with colored balls
4. **Pipe/Bucket**: Goal container at bottom — must collect all colored balls
5. **Bomb Hazard**: Bombs explode on contact with balls, destroy nearby balls
6. **Platform/Wall System**: Horizontal platforms that redirect ball movement

### Progression Systems
7. **Level Select**: Grid of levels with lock/unlock/3-star status
8. **Star Rating**: 1-3 stars based on balls collected (e.g., 3 stars = all balls collected)
9. **Difficulty Progression**: 5 tiers across 30 levels:
   - Tier 1 (Lvl 1-6): Basic pin pulling, 2-3 pins, no hazards
   - Tier 2 (Lvl 7-12): Multiple compartments, gray balls introduced
   - Tier 3 (Lvl 13-18): Bombs introduced, need to route bombs away
   - Tier 4 (Lvl 19-24): Complex multi-path, multiple hazards, walls
   - Tier 5 (Lvl 25-30): Expert puzzles, combination of all mechanics

### Scoring & Feedback
10. **Coin System**: Earn coins per level (bonus for 3-star)
11. **Combo Indicator**: Visual feedback when multiple balls collected
12. **Particle Effects**: Ball collection particles, explosion particles for bombs
13. **Screen Effects**: Subtle shake on bomb explosion, confetti on level complete

### Save & Settings
14. **Progress Save**: localStorage with version field, level completion, stars, coins
15. **Sound Toggle**: Mute/unmute button
16. **Music Toggle**: BGM on/off

### Tutorial
17. **Tutorial**: First 3 levels serve as tutorial with hint overlays ("Tap to pull the pin!")

### Level Design Reference
- Each level = a vertical container with pins, balls, platforms, and a bucket at bottom
- Pins are horizontal bars that hold balls above them
- Removing a pin releases everything above it
- Gray balls = don't count unless colored first
- Bombs = destroy balls on explosion
- Goal: get all colored balls into the bucket

## Art Style Reference
- Dark gradient background (GameZipper style)
- Colorful neon balls (red, blue, green, yellow, purple)
- Metallic/chrome pins
- Glowing pipe/bucket at bottom
- Particle effects on ball collection
- Clean modern UI with rounded corners

## Music Style
- Casual/relaxing electronic
- Soft synth pads, gentle percussion
- Loop-friendly 30-60 second track
- Satisfying sound effects for: pin pull, ball drop, ball color, ball collect, bomb explode, level complete
