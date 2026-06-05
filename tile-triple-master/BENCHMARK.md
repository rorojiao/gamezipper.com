# Tile Triple Master — Competitive Benchmark

## Genre
3D Tile Match Triple (Casual Puzzle)

## Top Competitors
1. **Tile Master 3D** — 500M+ downloads. 3D layers of tiles, tap to collect, match 3 in tray. Time-based challenge. Multiple themes (fruit, animal, food). 1000+ levels.
2. **Tile Triple 3D** — 100M+ downloads. Similar mechanic but with boosters (shuffle, undo, hint). Star rating system. Daily challenges.
3. **Match Triple 3D** — 50M+ downloads. Power-up system (bomb, freeze time, extra slots). Combo scoring. Special event levels.

## Core Mechanics (All Competitors Share)
- Stack of 3D layers with tiles on top
- Tap a tile to send it to the tray (bottom of screen)
- When 3 identical tiles are in the tray, they clear
- If the tray fills up (7 slots), game over
- Clear all tiles from the board to win

## Key Systems to Implement
1. **30 levels across 5 tiers**: Starter/Classic/Challenge/Expert/Master
2. **Tray system**: 7-slot tray, match-3 clearing
3. **Scoring**: Base points per clear + combo multiplier + time bonus + level completion bonus
4. **Star rating**: 3-star based on time (under 60s = 3 stars, under 90s = 2 stars, complete = 1 star)
5. **Power-ups**: 3 types — Hint (highlight next match), Shuffle (re-randomize remaining), Undo (return last tile)
6. **Tutorial**: First 2 levels are tutorial with hand-holding overlays
7. **Combo system**: Quick successive clears multiply score
8. **Progress saving**: localStorage with version, best scores, star ratings
9. **Tile themes per tier**: Tier 1 = Fruits, Tier 2 = Animals, Tier 3 = Food, Tier 4 = Vehicles, Tier 5 = Space
10. **Timer**: Optional countdown timer per level, bonus for fast completion

## Difficulty Progression
- Tier 1 (L1-6): 2 layers, 4 tile types, generous time
- Tier 2 (L7-12): 3 layers, 5 tile types, moderate time
- Tier 3 (L13-18): 3 layers, 6 tile types, tight time + locked tiles (need match to unlock adjacent)
- Tier 4 (L19-24): 4 layers, 7 tile types, very tight time
- Tier 5 (L25-30): 4 layers, 8 tile types, minimal time + many tile types

## Visual Design
- Dark gradient background (deep purple to dark blue)
- 3D-tilted perspective for tile layers
- Bright neon-colored tiles with smooth animations
- Tray at bottom with glass-morphism effect
- Particle burst on successful match
- Screen shake on combo

## Audio Design
- Ambient electronic BGM (mystery puzzle feel)
- SFX: tile tap, match clear (3x), combo chime, level complete fanfare, game over buzz, button click
