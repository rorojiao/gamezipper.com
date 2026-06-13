# Spin Sort Master — Competitive Benchmark

## Primary Games: Sorting Puzzle Genre
- **Water Sort Puzzle**: 500M+ downloads, ★4.6, #1 sorting puzzle globally
- **Ball Sort Puzzle**: 100M+ downloads, ★4.5, #3 puzzle on Google Play
- **Hexa Sort** (Lion Studios): ★4.5, trending 2025-2026 on CrazyGames
- **Goods Sort**: 50M+ downloads, shelf-based sorting

## What Makes Sorting Puzzles Addictive
1. **Clear visual goal**: Sort all colors — instantly understandable
2. **Satisfying feedback**: Colors filling up, clearing with particle effects
3. **Progressive difficulty**: More colors, more complexity
4. **Strategic depth**: Plan moves ahead, not just reactive
5. **No time pressure** (mostly): Think as long as you want

## Spin Sort Master — Unique Twist
- **Rotation mechanic**: Instead of tubes/shelves, sort by rotating a color-segmented wheel
- **Spatial planning**: Must think about wheel orientation, not just source/destination
- **Sequence preview**: See upcoming balls, plan rotations ahead
- **Capacity management**: Each segment has limited slots, wrong colors waste space

## Common Systems to Implement
- **Scoring**: Points per correct match, combo multiplier for consecutive correct, level completion bonus
- **Star rating**: 3 stars = no mistakes, 2 stars = ≤2 mistakes, 1 star = completed
- **Level progression**: 30 levels, increasing from 4 segments to 8, faster drops
- **Power-ups**: Slow-mo (slow ball drop), Bomb (clear a segment), Undo (reverse last placement)
- **Tutorial**: First 3 levels are guided, showing rotation and matching
- **Progress save**: localStorage with level completion, stars, best scores
- **Settings**: Sound toggle, music toggle, reset progress

## Art Style
- Clean modern flat design with gradient backgrounds (GameZipper dark style)
- Neon accent colors for wheel segments (red, blue, yellow, green, orange, purple, pink, cyan)
- Satisfying particle effects on clear/match
- Smooth rotation animations with easing
- Glass-morphism panels for UI

## Music
- Ambient electronic, upbeat but not frantic, loopable
- SFX: ball drop, correct match (chime), wrong match (buzz), segment clear (celebration), rotation tick, power-up activate

## Difficulty Curve
- Levels 1-5: 4 segments, slow drops, tutorial
- Levels 6-15: 5-6 segments, moderate speed, introduce special balls
- Levels 16-25: 6-7 segments, fast drops, obstacle balls
- Levels 26-30: 8 segments, very fast, complex sequences

## Build Target
- 30 handcrafted levels with pre-defined ball sequences and wheel configurations
- 3-star rating system
- Power-ups: slow-mo, bomb, undo
- Canvas-based rendering with smooth animations
- All English UI
