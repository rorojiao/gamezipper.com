# Hextris — Competitive Benchmark

## Source Game
**Hextris** by Logan Engstrom & Michael Yang — open-source HTML5 game, 10M+ browser plays, viral on GitHub (3k+ stars), featured on Poki/CrazyGames/hundreds of game portals.

## Core Mechanic
Hexagonal Tetris: 6-sided rotating ring. Colored blocks fall from the outer edge toward the center hexagon. Player rotates the hexagon with LEFT/RIGHT (or A/D or swipe) to align falling blocks with same-colored stacks. When 3+ same-colored blocks connect, they clear. Game speeds up over time. Game ends when blocks reach the center hexagon.

## Competitive Analysis

### Direct Competitor: Hextris (original)
| System | Detail |
|--------|--------|
| Grid | Hexagonal — 6 columns radiating from center, each column has 0-15 stacked blocks |
| Block colors | 5 distinct colors (blue, green, pink, yellow, purple) |
| Falling speed | Increases over time (every ~30s speed +1) |
| Scoring | +1 per block placed; bonus for clearing chains (combo multiplier) |
| Clear condition | 3+ same-color blocks adjacent in a row → cleared, blocks above fall down |
| Game over | Any column fills completely to center |
| Controls | Keyboard: A/D or Left/Right to rotate; mouse/touch: click-and-hold left/right halves |
| Visual style | Flat colors, minimal, dark background, smooth animations, glow on clears |
| Audio | Chiptune BGM + blip sound effects (Web Audio) |
| No levels | Endless survival — score-based |

## GZ Hextris S-Grade Enhancement Plan

### 1. Core Gameplay (must match original)
- Hexagonal ring with 6 columns
- Colored blocks fall from outer edge inward
- Rotate hexagon to align colors
- 3+ same-color adjacent blocks → clear with combo chain
- Increasing speed / difficulty curve
- Game over when blocks reach center

### 2. NEW: Level/Stage System (20 levels — GZ requirement)
- Level 1-5: Tutorial tier — slow speed, 3 colors, small block sets
- Level 6-10: Intermediate — 4 colors, medium speed, combo bonuses
- Level 11-15: Advanced — 5 colors, fast speed, special blocks
- Level 16-20: Expert — max speed, chain reactions, bomb blocks
- Endless Mode: Unlocked after completing Level 5 — classic survival

### 3. Scoring System (commercial grade)
- Base score: +10 per block placed
- Clear bonus: +50 per block cleared
- Combo multiplier: consecutive clears within 3s stack
- Level completion: star rating (1-3 stars)
- Best score per level (localStorage)

### 4. Power-ups / Special Blocks (NEW)
- Bomb block: clears all same-color blocks
- Rainbow block: matches any color
- Slow-mo: time-limited speed reduction
- Column clear: clears an entire column

### 5. Systems (must have all)
- Main menu, Level Select, Game, Win/Lose overlay
- Pause/resume, Settings (sound/music toggle)
- Tutorial overlay (skippable), Progress save (localStorage)
- Star ratings, Achievement popups

### 6. Visual Style
- Dark gradient background, neon-glow hexagonal blocks
- Particle burst on clears, screen shake on combos
- Smooth rotation animation, score popups, combo HUD

### 7. Audio (Web Audio API procedural)
- Block placement blip, clear chime, game over tone
- Level complete fanfare, combo sound, ambient BGM loop
- Button click/hover sounds

### 8. Responsive
- Desktop: 1280x720, keyboard + mouse
- Mobile: 390x844, touch left/right halves + swipe

## Difficulty Parameters per Tier
| Tier | Start Speed | Speed Increase | Colors | Special Blocks |
|------|------------|----------------|--------|----------------|
| 1 (L1-5) | Slow | None | 3 | None |
| 2 (L6-10) | Medium | Every 45s | 4 | Bomb |
| 3 (L11-15) | Fast | Every 30s | 5 | Bomb + Rainbow |
| 4 (L16-20) | Very Fast | Every 20s | 5 | All |
| Endless | Adaptive | Continuous | 5 | All |
