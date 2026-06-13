# Gecko Out — Competitive Benchmark

## Target Game
- **Name**: Gecko Out
- **Publisher**: Rollic Games / Dalak Games
- **Rank**: ~#26 grossing (June 2026)
- **Mechanic**: Color-matching sliding/gecko-routing puzzle — drag geckos through mazes to matching exits (NOT pin-pull)
- **Levels**: 400–1,440+

## Key Competitors

| Game | Publisher | Downloads | Mechanic |
|------|-----------|-----------|----------|
| Pull the Pin | Popcore Games | 210M+ | Pin pull + ball physics |
| Hero Rescue | Multiple | 50M+ | Pin pull + rescue |
| Pin Puzzle | People Lovin Games | 19K/mo | Pin pull + daily levels |
| Save Girl | Gamee | 10M+ | Pin pull + story |

## Our Design Decision
Build a TRUE PIN-PULL game with gecko theme (unique positioning):
- Pin-pull mechanics: Pull pins in correct order to free gecko
- Physics-based: Gravity affects gecko movement
- Obstacles: Bombs, walls, water, gates
- 3-star scoring: Based on moves vs par
- 30 handcrafted levels, progressive difficulty
- Tutorial: First 3 levels guided
- Sound effects via Web Audio API
- Responsive canvas

## Systems to Implement
1. Pin-pull mechanic (drag to pull)
2. Simple gravity physics
3. Level system (30 levels, 5 chapters)
4. 3-star rating (moves vs par)
5. Move counter + undo
6. Obstacles: bombs, walls, colored gates
7. Level progress (localStorage)
8. Tutorial (first 3 levels)
9. Sound effects (Web Audio API)
10. Particle effects
11. Settings (sound toggle)
12. Responsive canvas

## SEO Keywords
- gecko out game, pull the pin game, pin pull puzzle, gecko puzzle
- pin pull online, play gecko out free, free pin pull browser
