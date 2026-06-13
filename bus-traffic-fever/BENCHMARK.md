# Bus Traffic Fever — Competitive Benchmark

## Game Concept
Bus Traffic Fever is a bus parking/escape puzzle game. Players tap buses in a grid-based parking lot to move them out. Each bus has a color, and passengers waiting at exits must match the bus color. Buses can only move in one direction (their facing direction). Clear all buses to complete the level.

## Competitors
1. **Bus Traffic Fever** (GOODROID) — #12 free Google Play, 5M+ downloads. Color-matched bus dispatching.
2. **Parking Jam 3D** (Popcore) — Genre king, 1000+ levels, city builder meta-game, skins, daily challenges.
3. **Bus Escape / Bus Out** — Browser + mobile. Power-ups: Shuffle, Sort, Secret Bus, Frozen, Bomb.
4. **Parking Master** — Variable vehicle capacities (4/6/10 passengers).

## Core Mechanics
- Grid-based parking lot with buses facing different directions (up/down/left/right)
- Tap a bus to send it sliding in its facing direction until it exits or hits obstacle
- Color matching: passengers at exits must match bus color
- Limited parking slots — poor planning = deadlock
- Strategic sequencing required

## Systems to Implement
- **Scoring**: Base score = Level × 10, move efficiency bonus, star rating (1-3)
- **Levels**: 30 handcrafted levels with progressive difficulty
- **Power-ups**: Undo (undo last move), Hint (show suggested move), Shuffle (rearrange)
- **Progression**: Sequential level unlock, localStorage save with version
- **Tutorial**: First 3 levels teach mechanics with visual arrows
- **Audio**: Web Audio API procedural BGM + SFX (slide, match, win, fail, button, powerup)
- **Animations**: Bus slide animation, particle effects on exit, confetti on level complete

## Difficulty Scaling
- Levels 1-10: 2-4 buses, 2-3 colors, simple grid
- Levels 11-20: 5-8 buses, 3-4 colors, obstacles introduced
- Levels 21-30: 8-12 buses, 4-5 colors, complex layouts

## Art Style
- Top-down/isometric view, bright saturated colors
- Clean, readable grid with clear lane markings
- Distinct bus colors (red, blue, yellow, green, orange, purple)
- Dark gradient background (GameZipper style), neon accents
- Rounded corners, glass-morphism UI

## Music Style
- Upbeat cheerful electronic instrumental (90-120 BPM)
- SFX: slide whoosh, color match chime, level complete fanfare, fail tone, coin clink, UI tap
