# Merge Sweets — Competitive Benchmark

## Competitors Analyzed
1. **Merge Sweets** (Springcomes, mobile) — direct namesake
2. **Love & Pies** (Trailmix/Supercell) — cafe merge-2, 150+ levels
3. **Merge Mansion** (Metacore/Supercell) — #1 merge-2 game, $700M+ revenue
4. **Piece of Cake: Merge & Bake** (CrazyGames, browser) — closest web competitor, 8.4 rating

## Core Mechanic: Merge-2
- Drag two identical items → one higher-level item
- Generator system: tap generators to produce base items
- Customer orders: merge items to fulfill specific requests → earn coins

## Feature Benchmark (Must Implement)

| Feature | Merge Sweets | Love & Pies | Merge Mansion | Piece of Cake | Our Target |
|---------|-------------|-------------|---------------|---------------|------------|
| Merge-2 mechanic | ✅ | ✅ | ✅ | ✅ | ✅ |
| Generator system | ✅ | ✅ (7 chains) | ✅ (40+ chains) | ✅ | ✅ (5+ chains) |
| Customer orders | ✅ | ✅ | ✅ (tasks) | ✅ | ✅ |
| Level/area system | Progressive | 150+ Days | ~50 Areas | Chapters | 20+ Levels |
| Score system | Coins/profit | Coins + Gems | XP + Coins | Money | Coins + Stars |
| Bakery renovation | ✅ (floors) | ✅ (3 styles) | ✅ (rooms) | ✅ | ✅ |
| Tutorial | Basic | Guided 5-step | Guided | Guided | ✅ (Guided) |
| Power-ups/boosters | Unknown | ✅ (chests) | ✅ | ✅ | ✅ |
| Save progress | ✅ | ✅ | ✅ | ✅ | ✅ (localStorage) |
| Sound effects | Standard | Cafe BGM | Atmospheric | ✅ | ✅ (Web Audio) |
| Animations | ✅ | ✅ | ✅ | ✅ | ✅ (particles, shake) |

## Key Design Targets
- **Item chains**: 5+ chains (Bread, Pastry, Cake, Fruit, Drinks), each 6-10 levels deep
- **20+ levels** with progressive difficulty and new items unlocked
- **Generator system**: tap bakery stations to produce base ingredients
- **Customer order board**: merge specific items → fulfill → earn coins + stars
- **Bakery renovation meta**: upgrade bakery areas between levels
- **No energy gate** (browser standard — remove friction)
- **15-30 second reward loops** (merge → serve → earn → celebrate)
- **Cute, colorful bakery aesthetic** with dark GameZipper theme
- **Full tutorial** (5-step guided intro, skippable)

## Visual Style Reference
- Cute 2D cartoon, bright bakery colors on dark GameZipper gradient background
- Items visually evolve: simpler at low levels → elaborate/decorated at high levels
- Particle effects on merge and serve
- Screen shake + combo animations for chains

## Audio Style Reference
- Relaxing cafe/bakery BGM (light jazz, soft piano)
- Satisfying merge pop sounds
- Customer served celebration jingle
- Level complete fanfare
