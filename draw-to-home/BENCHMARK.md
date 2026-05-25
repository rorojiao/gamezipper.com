# Draw To Home — Competitive Benchmark

## Overview
Draw path puzzle game where players draw lines to guide characters to their homes while avoiding obstacles.

## Competitors

### 1. Draw Home: Rush To Home (Zin Games) — 10M+ downloads, 3.9★
- **Core**: Draw path from character to color-matched home
- **Levels**: 320+ levels across 8+ chapters
- **Obstacles**: Dogs, holes, monsters (Blue Monster, Grimace), thieves, wooden boxes, lifting columns, cars
- **Systems**: Coins, character skins, house appearances, ad-based monetization
- **Art**: Cartoon/stylized, family-friendly

### 2. Home Rush - Draw to Home (Zin Games) — 5M+ downloads, 3.5★
- **Core**: Rescue babies by drawing path from house to buddies
- **Levels**: 200+ levels
- **Obstacles**: Dogs, holes, monsters
- **Systems**: Coin collection, unlockable skins, difficulty progression
- **Art**: Cute cartoon style, bright colors

### 3. Draw To Home (FunSpace) — 1M+ downloads, 3.6★
- **Core**: Draw lines from villains to color-matched houses; avoid collisions
- **Special**: Hercules power-up mechanic
- **Levels**: 100+ levels
- **Obstacles**: Walls, other character paths
- **Systems**: Color matching, collision avoidance

### 4. Home Rush: Draw to Home Puzzle (Sigur Studios) — Emerging
- **Core**: Draw path connecting villains to homes
- **Obstacles**: Villain + wall collisions
- **Systems**: Progressive difficulty

### 5. Draw To Home - Draw The Line (Lighting Studios) — 500K+ downloads
- **Core**: Same villain-to-home drawing mechanic
- **Levels**: 50+ levels

## Key Design Patterns (from all competitors)
1. **Core mechanic**: Draw path from character to destination; characters auto-follow
2. **Failure**: Characters colliding with each other or hitting obstacles
3. **Obstacles**: Dogs, holes, monsters, walls, moving obstacles
4. **Progression**: Collect coins/diamonds to unlock skins
5. **Art**: Cartoon/stylized, family-friendly
6. **Level count**: 40-320+ across competitors
7. **Star rating**: Based on path efficiency / ink usage

## GameZipper Implementation Target
- **Slug**: `draw-to-home`
- **Levels**: 50 levels (5 chapters x 10 levels)
- **Characters**: Color-coded characters matching color-coded homes
- **Obstacles**: Walls, moving enemies, holes, spikes (progressive introduction)
- **Star Rating**: 1-3 stars based on ink/draw length used
- **Hint System**: 3 hints per level, shows optimal path briefly
- **Ink Limit**: Maximum draw length per level (adds challenge)
- **Scoring**: Points based on stars + coins collected + time bonus
- **Progress**: localStorage with save/load
- **Tutorial**: Built-in first 3 levels as tutorial
- **Art**: Dark neon GameZipper theme with cute character designs
- **Audio**: Web Audio BGM + SFX (draw, success, fail, star, hint)

## Systems to Implement
1. Path drawing with ink limit
2. Character auto-follow on drawn path
3. Color matching (character → home)
4. Collision detection (characters, obstacles)
5. Star rating (ink efficiency)
6. Coin collection system
7. Level selection screen
8. Progress saving (localStorage)
9. Hint system
10. Tutorial (first 3 levels)
11. Victory/defeat animations
12. Sound effects + BGM
