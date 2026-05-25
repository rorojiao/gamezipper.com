# Duck Life — Competitive Benchmark

## Competitors Analyzed
1. **Duck Life (Original)** — Coolmath/CrazyGames/Poki — The classic
2. **Duck Life 4** — Coolmath — Training + Racing + Breeding
3. **Duck Life Adventure** — Gamenora — RPG + Racing + Battling
4. **Duck Life 8: Battle** — Coolmath — Training + Turn-based fights

## Core Mechanics (must implement all)

### Stats System
- **Running Speed** — trained via running mini-game
- **Swimming Speed** — trained via swimming mini-game  
- **Flying Skill** — trained via flying mini-game
- **Energy** — decreases during training/races, refills at home/rest
- Stats level up from 1 to 100+ based on training performance

### Training Mini-Games
1. **Running**: Side-scrolling runner — jump over obstacles, collect coins. Speed increases with stat level.
2. **Swimming**: Underwater swimmer — dive/jump to avoid obstacles. Collect coins.
3. **Flying**: Vertical/horizontal flight — steer left/right to collect coins, avoid obstacles.
4. Coins earned in training → used for hats/accessories/upgrades

### Racing System
- Race against AI ducks on a track
- Track combines running + swimming + flying segments
- Duck's stats determine race performance
- Win races to unlock new environments/tiers
- Final boss race in each tier

### Progression
- **4+ Environments**: Grassland, Mountain, Glacier, Volcano (or similar)
- Each environment has qualifying races → tournament
- Beat champion duck to progress to next world
- Story: tornado destroyed farm, train duck to win championship and rebuild

### Systems Checklist
- [x] Stat training (3 mini-games + stat leveling)
- [x] Coin collection during training
- [x] Racing against AI
- [x] Environment progression (4+ worlds)
- [x] Energy system
- [x] Hat/accessory shop
- [x] Save progress (localStorage)
- [x] Tutorial/onboarding
- [x] Score/stats tracking

## Art Style
- Colorful, cartoon-like
- Cute duck character (simple, round)
- Each world has distinct background theme
- Bright, cheerful palette

## Music Style
- Upbeat, adventurous
- Different BGM per environment
- Cheerful training music + intense race music
