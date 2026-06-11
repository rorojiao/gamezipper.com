# BENCHMARK.md — Gobble Competitive Analysis

## Top 3 Competitors
1. **Gobble (Martin Magni)** - Level-based eat-and-grow puzzle, 40+ levels, 3D WebGL, avoid-people mechanic
2. **Hole.io (Voodoo)** - Black hole eats city objects, timed matches, power-ups (speed/magnet/size-up), skins
3. **Slither.io** - Snake eats pellets, PvP, neon aesthetic, no music, leaderboard

## Key Systems to Implement
- **Level System**: 30 levels across 6 themed environments (5 levels each)
- **Growth Mechanic**: Start small, eat smaller objects, grow to eat bigger ones
- **Size-Gating**: Can only consume objects smaller than current radius
- **Combo System**: Chain rapid eating for score multipliers (2x, 3x, 5x)
- **Power-ups**: Speed Boost, Magnet Pull, Mega Gulp (3 types)
- **Scoring**: Points per object (proportional to size) × combo multiplier
- **Star Rating**: 1-3 stars per level based on score threshold
- **Progression**: localStorage save with version field
- **Tutorial**: Interactive first-level tutorial, skippable
- **Sound**: Web Audio API procedural - eat sounds (x3), power-up, level complete, combo chime, BGM loop

## Visual Style
- Colorful isometric-ish top-down 2D Canvas
- Dark gradient background with neon accents
- Bright, colorful objects categorized by size
- Particle effects on eating, screen shake on big eats
- Smooth 60fps animations

## Level Design
- Levels 1-5: Grassland (easy, small objects)
- Levels 6-10: Desert (medium, cacti hazards)
- Levels 11-15: City (buildings, cars, people to avoid)
- Levels 16-20: Ocean (fish, boats, sharks)
- Levels 21-25: Forest (trees, animals, bears to avoid)
- Levels 26-30: Space (asteroids, planets, black holes)
- Boss levels: 5, 10, 15, 20, 25, 30 (giant final object)
