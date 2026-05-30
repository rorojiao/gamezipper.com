# Jewel Crush (Match-3) — Competitive Benchmark

## Selected Game
**Jewel Crush** — A match-3 puzzle game with gem/jewel swapping, cascading combos, level progression, and special power-ups.

## Competitive Benchmarks

### 1. Candy Crush Saga (King)
- **Downloads**: 1B+ (most downloaded mobile game ever)
- **Revenue**: $20B+ lifetime
- **Levels**: 15,000+
- **Systems**: 
  - Swap adjacent candies to match 3+
  - Special candies: Striped (4-match), Wrapped (L/T-shape), Color Bomb (5-match), Jelly Fish
  - Combo cascading with chain reactions
  - Level objectives: Clear jelly, Collect ingredients, Reach target score, Clear chocolate
  - Lives system (5 max, regen 1/30min)
  - Boosters: Lollipop Hammer, Free Switch, Wrapped+Striped, Color Bomb, Jelly Fish
  - Episode/map progression with gates
  - Score: 1-3 stars per level
  - Daily spin wheel, events, team features
- **Visuals**: Bright candy colors, smooth animations, juicy effects
- **Audio**: Cheerful BGM, satisfying match/cascade SFX

### 2. Bejeweled Blitz (PopCap/EA)
- **Platform**: Browser (Facebook) + Mobile
- **Gameplay**: 60-second timed match-3
- **Systems**:
  - Swap gems, match 3+, cascading gravity
  - Special gems: Flame (4-match), Star (L/T), Hypercube (5-match)
  - Speed bonus for consecutive fast matches
  - Rare gems (daily/weekly specials)
  - Coin shop for boosts
  - Weekly leaderboard tournaments
- **Visuals**: Rich gem rendering with sparkle effects
- **Audio**: Satisfying chime progression on cascades

### 3. Jewel Shuffle (Browser - AARP/Coolmath)
- **Platform**: Browser
- **Gameplay**: Untimed match-3, level-based
- **Systems**:
  - 8x8 grid of colored jewels
  - Swap adjacent to match 3+
  - Hint system
  - Timer or move-based levels
  - Score multiplier for combos
- **Visuals**: Classic gem/jewel rendering, clean UI

## Systems to Implement

### Core Match-3 Mechanics
1. **Grid**: 8x8 board of colored gems (6-7 colors)
2. **Swap**: Click/swap adjacent gems, must create match of 3+
3. **Gravity**: Gems fall down to fill gaps, new gems spawn from top
4. **Cascade**: Chain reactions when falling gems create new matches
5. **No Valid Moves**: Auto-shuffle when no moves available

### Special Gems (Power-ups)
1. **Striped Gem** (match 4 in a row): Clears entire row or column
2. **Wrapped Gem** (match in L/T shape): Explodes 3x3 area, then again
3. **Color Bomb** (match 5 in a row): Destroys all gems of one color
4. **Combo Specials**: Swap two special gems for enhanced effects

### Level System (50+ levels)
- **Move-based** levels (limited swaps to reach objective)
- **Timed** levels (reach score before time runs out)
- **Objectives**: Target score, Clear all ice/frozen tiles, Collect specific colored gems, Clear all stone blocks
- **Difficulty curve**: Start with 4 colors → 5 → 6 → 7 colors
- **Obstacles**: Ice (match on top to break), Stone (indestructible), Chain (gem locked in place)

### Scoring System
- 3-match: 50 pts, 4-match: 150 pts, 5-match: 500 pts
- Cascade multiplier: x1, x2, x3, x4...
- Level completion bonus: remaining moves × 100
- Star ratings: 1-star (pass), 2-star (good), 3-star (perfect)

### Progression & Meta
- Level map/selector with episode grouping
- Star collection tracking
- High score per level (localStorage)
- Daily bonus (streak-based)
- Tutorial (first 3 levels guided)

### Audio
- BGM: Upbeat electronic/casual loop
- Match SFX: Satisfying chime (pitch rises with cascade depth)
- Special gem activation: Explosion, whoosh
- Level complete: Victory fanfare
- Level fail: Gentle buzz

### Visual Style
- Dark gradient background (GameZipper neon style)
- Gems: Glossy 3D-rendered circles with inner glow and sparkle
- Neon accent colors for 6-7 gem types
- Smooth CSS/Canvas animations for swap, fall, match, cascade
- Particle effects on matches
- Screen shake on big combos
- Glass-morphism UI panels
