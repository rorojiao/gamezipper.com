# Mahjong Dimensions — Competitive Benchmark

## Competitor Analysis (June 2026)

### 1. Mahjong Dimensions (Arkadium)
- **Platform**: Arkadium.com, MSN Games, Washington Post
- **Core Mechanic**: 3D rotating cube with mahjong tiles on all visible faces. Match pairs of exposed tiles.
- **Tile Count**: 20-40 tiles per cube configuration
- **Timer**: 6-minute countdown per round
- **Scoring**: Time bonus + combo bonus + speed bonus
- **Cube Configs**: Single cube, double stack, diamond, pyramid shapes
- **Monetization**: Interstitial ads between rounds, banner ads
- **Key Feature**: 3D rotation via mouse/touch drag makes it genuinely different from 2D mahjong
- **Difficulty**: Progressive — more tiles, tighter time, more layers

### 2. Mahjong Dimensions 15min (Arkadium variant)
- Same as above but 15-minute timer
- Daily challenge mode
- Leaderboards

### 3. 3D Mahjong on CrazyGames
- Similar concept, 3D rotating board
- Simpler tile matching
- No timer mode available
- Fewer configurations

### 4. Mahjongg Dimensions (GameTop/other portals)
- Clone of Arkadium's game
- Standard 3D cube mahjong

## Feature Matrix to Implement

| Feature | Priority | Description |
|---------|----------|-------------|
| 3D cube rendering | MUST | Canvas-based 3D rotation of mahjong tile layouts |
| Tile matching | MUST | Click two matching exposed tiles to remove them |
| Multiple cube shapes | MUST | At least 5 configurations (cube, tower, cross, diamond, pyramid) |
| Timer mode | MUST | 3:00 / 5:00 / No timer options |
| Combo scoring | MUST | Chain matches within 2s for combo multiplier |
| Hint system | MUST | Highlight a valid pair (3 hints per game) |
| Shuffle | MUST | Reshuffle remaining tiles when stuck (2 per game) |
| Level progression | MUST | Progressive difficulty with more tiles |
| Star ratings | MUST | 1-3 stars based on time remaining |
| Daily challenge | NICE | Same layout for all players daily |
| Settings | MUST | Sound toggle, music toggle |
| Tutorial | MUST | First-time player overlay |
| Progress save | MUST | localStorage for unlocked levels, best scores |

## Technical Approach
- Canvas 2D with 3D projection (isometric/orthographic) — NOT WebGL
- Tile faces: drawn as 3D-looking cards with patterns using Canvas gradients
- 3D rotation: mouse/touch drag to rotate cube around Y-axis
- Tile selection: raycasting from click position to tile planes
- Exposed tile detection: check if tile is not covered by another tile AND has at least one side open
- Tile patterns: traditional mahjong symbols drawn with Canvas shapes (circles, bamboo, characters, winds, dragons, seasons, flowers)

## Scoring Formula
- Base match: 100 points
- Combo: x2, x3, x4... (resets after 2s gap)
- Speed bonus: extra 50 points for matches within 1s of previous
- Level complete: remaining_seconds × 10
- Star 1: Complete level, Star 2: < 70% time used, Star 3: < 40% time used
