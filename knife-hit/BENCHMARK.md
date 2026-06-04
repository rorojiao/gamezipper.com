# Knife Hit - Competitive Benchmark

## Competitor Analysis

### 1. Knife Hit (Ketchapp)
- **Downloads**: 100M+ (Google Play)
- **Rating**: 4.3 stars
- **Core Mechanic**: Tap to throw knives at a rotating log. Knives stick into the log. If a knife hits another knife, game over.
- **Key Features**:
  - Rotating log with varying speed/direction
  - Boss stages (apples at center, break them before time runs out)
  - Knife skin collection (unlockable)
  - Challenge mode (complete specific patterns)
  - Streak counter
  - Apple bonuses (hit apples on log for bonus points)
  - 60+ levels
  - Simple one-tap gameplay

### 2. Flippy Knife (Beresnev Games)
- **Downloads**: 50M+
- **Rating**: 4.2 stars
- **Core Mechanic**: Flip knife in air, stick it into the ground/target
- **Key Features**:
  - Physics-based knife flipping
  - Multiple game modes (Classic, Arcade, Zen)
  - Knife collection (50+ knives)
  - Leaderboard
  - Realistic knife physics

### 3. Knife Throw (VOODOO)
- **Downloads**: 10M+
- **Rating**: 4.1 stars
- **Core Mechanic**: Similar to Knife Hit, throw at rotating targets
- **Key Features**:
  - Various target shapes
  - Multiple stages
  - Minimalist design

## Gap Analysis for GameZipper

- GZ has ZERO knife-throwing games
- High search volume ("knife game", "knife throw", "knife hit")
- Extremely simple mechanic (single tap) = perfect mobile
- High retention potential (addictive "one more try" loop)
- Canvas implementation is trivial (simple physics + rotation)

## Design Decisions for GZ Implementation

1. **Core**: Rotating log, tap-to-throw knife mechanic
2. **Levels**: 30 levels across 5 tiers (speed/direction/obstacles increase)
3. **Boss stages**: Every 5th level - break apple target within time limit
4. **Knife skins**: 6 unlockable skins (earned by completing tiers)
5. **Apple bonuses**: Hit apples on log for +5 bonus knives
6. **Streak system**: Consecutive successful throws = score multiplier
7. **Score**: Knives stuck + apple bonuses x streak multiplier
8. **Difficulty curve**: Rotation speed, direction changes, obstacle zones
9. **Visual**: Dark neon theme, glowing knives, particle burst on impact
10. **Audio**: Satisfying "thunk" on hit, clash sound on failure, BGM
