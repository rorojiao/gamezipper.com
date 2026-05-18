# Tower Defense — Competitive Benchmark

## Competitors

### 1. Bloons Tower Defense (BTD)
- **Levels**: 50+ maps, each with multiple difficulty modes
- **Towers**: 20+ tower types (Dart Monkey, Tack Shooter, Sniper, etc.), each with 3 upgrade paths (2 sub-upgrades per path)
- **Enemies**: 10+ bloon types (Red, Blue, Green, Yellow, Pink, Black, White, Zebra, Lead, Ceramic, MOAB)
- **Systems**: Cash economy (pop bloons for cash), lives system, round/wave system, special abilities with cooldowns, hero towers, instamonkey rewards
- **Scoring**: Pop count, cash earned, completion time
- **Art**: Colorful cartoon style, distinct tower/bloon designs
- **Music**: Upbeat, energetic, cheerful

### 2. Kingdom Rush
- **Levels**: 15+ campaign stages + heroic/challenge modes
- **Towers**: 4 base types (Archer, Barracks, Mage, Artillery) × 3 upgrade levels, with 2 final specialization choices per tower
- **Enemies**: 40+ enemy types (goblins, orcs, wolves, trolls, dark knights, boss enemies)
- **Systems**: Gold economy, lives (20), tower selling (70% refund), rally troops, 4 special abilities (Reinforcements, Meteor, Frenzy, Holy Order) with cooldowns, star rating (1-3 stars)
- **Scoring**: Stars based on lives remaining + difficulty
- **Art**: Comic/cartoon fantasy style, hand-drawn
- **Music**: Epic orchestral fantasy

### 3. GemCraft (Chasing Shadows)
- **Levels**: 50+ stages with battle settings (endurance, heroic, etc.)
- **Towers**: Gem-based system (8 gem colors), combining gems for multi-color, 9 skill types
- **Enemies**: 20+ monster types with special abilities
- **Systems**: Mana economy, mana pool, skill tree, gem combining, trap system, banishment, achievements
- **Art**: Dark fantasy, crystals and magic theme
- **Music**: Dark atmospheric electronic

## Required Systems for Our Tower Defense

### Core Systems
1. **Path System**: Pre-defined winding paths on each map, enemies follow waypoints
2. **Tower Placement**: Click on valid grid spots adjacent to paths
3. **Tower Types** (6 types):
   - Arrow Tower (fast, low damage, cheap)
   - Cannon Tower (slow, AOE splash, medium cost)
   - Ice Tower (slows enemies, low damage)
   - Lightning Tower (chain lightning, medium cost)
   - Sniper Tower (long range, high single-target damage)
   - Laser Tower (continuous beam, high DPS)
4. **Upgrade System**: 3 levels per tower (more damage, range, speed)
5. **Sell System**: Sell towers for 60% refund
6. **Wave System**: Pre-defined waves with increasing difficulty, wave counter
7. **Enemy Types** (8 types):
   - Normal, Fast, Tank, Healer, Swarm (many weak), Flying (ignores path, flies straight), Boss, Armored
8. **Economy**: Start gold + gold per kill + bonus per wave completion
9. **Lives**: 20 lives, lose 1 per enemy that reaches the end
10. **Speed Control**: 1x, 2x speed toggle

### Meta Systems
11. **Progress Save**: localStorage with level completion, stars earned
12. **Star Rating**: 1-3 stars based on lives remaining
13. **Tutorial**: Interactive first level tutorial
14. **Score System**: Points per kill + wave bonus + combo multiplier
15. **Sound Effects**: Tower shoot, enemy death, wave start, tower place, tower upgrade, game over, victory
16. **BGM**: Programmatic ambient strategic music

### Level Design
- 20 levels with unique path layouts
- Difficulty progression: more enemies, faster waves, tougher enemy types
- Each level introduces new enemy types gradually
- Boss waves every 5 levels
- Starting gold decreases as levels progress

## Art Style
- Dark gradient background with neon accent colors (GameZipper style)
- Glowing tower effects and projectile trails
- Enemy health bars
- Particle effects on kills
- Range indicators when placing/selecting towers
