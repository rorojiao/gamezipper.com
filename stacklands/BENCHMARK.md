# BENCHMARK.md — Stacklands (Card-Stacking Village Builder)

## Competitive Intelligence

### Stacklands (2022, Sokpop Collective)
- **Platform**: Steam (Windows/Mac), iOS (paid)
- **Price**: $4.99 base game + DLCs ($2-5 each)
- **Sales**: "Overwhelmingly Positive" rating, 25K+ reviews, indie hit
- **Awards**: Nominated for various indie game awards
- **Engine**: Unity
- **Team**: Sokpop (4-person Dutch indie studio)

### Core Mechanics
1. **Card deck**: Pull cards from a deck onto the play area (board is a flat 2D plane)
2. **Stack to combine**: Drag a card on top of another to combine via recipes
   - `Villager + Berry Bush = Berry` (gather food)
   - `Villager + Tree = Wood` (gather material)
   - `Villager + House = Baby Villager` (population growth)
   - `Wood + Wood + Wood + Wood = Plank` (refine)
   - `Plank + Plank + Plank + Stone = House` (build)
3. **Auto-gathering**: Each Villager card auto-produces 1 resource per moon cycle if placed on a resource card
4. **Moon cycle / monthly loop**: Game ticks forward automatically; each moon cycle is ~30 seconds
5. **Buy cards with coins**: Spend coins earned from selling resources to pull new cards from Idea/Market decks
6. **At night**: Monsters (rats, slimes, wolves, demons) spawn — villagers fight automatically; if you have a Sword, they equip and deal more damage
7. **Death spiral**: Villagers need food each cycle; if starving, they die; if all die → game over
8. **Goals**: Each "run" has a goal like "build 3 houses" or "have 5 villagers"; complete goal to advance

### Card Categories
- **Villagers**: Villager, Baby (grows into Villager after cycles), Explorer (finds new lands), Soldier
- **Resources**: Berry, Berry Bush, Wood, Tree, Stone, Rock, Coin, Iron, Iron Ore, Plank, Stick, Coal, Meat, Carrot, Coin
- **Ideas/Recipes**: House, Sawmill, Smelter, Forge, Cookpot, Market, Farm, Garden, Warehouse, Sword, Shield, Helmet
- **Enemies**: Rat, Slime, Wolf, Bear, Goblin, Demon, Dragon, Skeleton
- **Special**: Coin (currency for buying from Market/Idea deck)

### What Makes It Work
- **Tiny card stack UI**: Cards literally stack on each other visually, clear feedback
- **Sok-pop aesthetic**: Bold, flat, colorful pixel-art icons on cards
- **Time-pressure loop**: Moon cycle creates natural urgency without micromanagement
- **Discovery via recipes**: Part of the joy is finding new combinations
- **Roguelite progression**: Death resets but unlocks new card ideas for next run
- **Endless mode**: After story, sandbox mode for creative building

### Game Modes
1. **Story**: Linear chapter progression with goal-based missions
2. **Endless/Sandbox**: Free build, no win condition
3. **Monthly Challenge** (DLC): Special seeded runs with modifiers

## Our Clone Design for GameZipper

### Game Title: **Stacklands** (matches user search intent)
**Tagline**: Card-Stacking Village Builder
**Slug**: `stacklands`

### Level Structure (24 levels across 4 chapters)

| Chapter | Theme | Levels | Goals / Mechanics |
|---------|-------|--------|-------------------|
| 1 | Founding | L1-6 | Learn: gather wood/berries, first house, 2 villagers |
| 2 | Prosperity | L7-12 | Build farms, market, sword, defeat first rat/slime |
| 3 | Danger | L13-18 | Wolves/bears at night, need defenses, stone walls |
| 4 | Frontier | L19-24 | Iron age, forge, smelter, dragon boss, advanced recipes |

### Core Systems (must implement to match competitor)

1. **Card deck system**: 
   - Pull N cards per level (limited card count per level = difficulty)
   - Drag from deck slot to board
   - Cards have: id, name, type, icon (emoji for now), category, stackable flag
2. **Stack-to-combine recipes** (~30 recipes across chapters):
   - Resource gathering recipes (Villager + X = Output)
   - Crafting recipes (Wood×4 = Plank, Plank+Stone = House)
   - Population (Villager + House = Baby)
   - Combat (Villager + Sword auto-equip)
3. **Moon cycle timer**: 30s/cycle, visual day/night transition, food consumption at each cycle
4. **Villager auto-tasking**: Each villager on a resource card generates 1 resource per cycle
5. **Enemy waves**: At certain cycles, enemy cards spawn and attack villagers
6. **Combat resolution**: Villagers + sword auto-defeat adjacent enemies; sword damage vs villager HP
7. **Goal-based level completion**: Each level has a target (build X, have Y villagers, defeat Z enemies)
8. **Star rating**: 3 stars = goal + bonus objective; 2 stars = goal; 1 star = minimal completion
9. **Card catalog/recipe book**: In-game reference of discovered recipes
10. **Save progress**: localStorage with version, level unlocks, star ratings, discovered recipes
11. **Tutorial overlay**: First 3 levels have step-by-step hints
12. **Sound system**: Web Audio API procedural BGM + SFX (card place, combine, gather tick, monster spawn, level complete, fail)
13. **Animation**: Card slide-in, combine burst, gather particle, day/night color shift, monster attack shake

### Visual Style
- **GameZipper dark style**: linear-gradient(135deg, #1a1f2e, #2d3748, #1e2a3a)
- **Card design**: rounded 12px corners, subtle shadow, emoji icon center, card name below, count badge top-right
- **Accent colors**: green (#22c55e) for villager, gold (#f59e0b) for resources, red (#ef4444) for enemies, blue (#3b82f6) for buildings
- **Day/night cycle**: Day = warm yellow tint overlay, Night = cool blue tint overlay + star particles
- **Title**: text-shadow (NEVER -webkit-text-stroke), gold gradient "Stacklands"

### Numeric Design

| Card | Cost / Source | Effect |
|------|---------------|--------|
| Villager | Starting / House | Gathers resources |
| Berry Bush | Starter deck | Provides Berries via Villager |
| Tree | Starter deck | Provides Wood via Villager |
| Berry | From gathering | +1 food per cycle |
| Wood | From gathering | Crafting material |
| Stone | From Rock via Villager | Crafting material |
| House | Recipe: 4 Plank + 4 Stone | Spawn new Villager |
| Plank | Recipe: 2 Wood | Crafting material |
| Sword | Recipe: 2 Plank + 1 Iron | Combat boost |
| Coin | From selling resources at Market | Currency for card pulls |
| Rat | Spawns at night | Enemy: HP 1, DMG 1 |
| Slime | Spawns at night | Enemy: HP 2, DMG 1 |
| Wolf | Spawns mid-game night | Enemy: HP 3, DMG 2 |

### Combat Math
- Villager base HP: 3, base DMG: 1
- With Sword: DMG +2 (total 3)
- Combat: at end of night cycle, each villager attacks 1 adjacent enemy; enemies counter-attack
- If villager HP ≤ 0 → villager dies (removed from board)
- If all villagers dead AND no Spawner/Altar → game over

### Difficulty Curve
- L1: 1 villager, 2 trees, 1 bush — just learn gathering (no enemies)
- L6: 2 villagers, 3 resources, 1 rat at cycle 3 — learn combat basics
- L12: 3 villagers, 5 resources, wolves at cycle 4 — combat + crafting
- L18: 4 villagers, stone/iron age, bears + multiple enemies
- L24: 5 villagers, forge, dragon boss — full tech tree + survival

### Why Selected for GameZipper
- **Market gap**: zero card-stacking village builder on GZ (closest is merge games, different mechanic)
- **Proven demand**: 25K+ reviews on Steam, indie darling
- **Fits GZ aesthetic**: tiny pixel art cards = clean Canvas drawing
- **Mobile-first**: drag-and-drop works perfectly with touch
- **Infinite replayability**: recipe discovery + endless mode

### Scoring Criteria
- D (Demand): 4 — strong indie hit but not mobile chart-topper
- S (SEO): 4 — "card village", "stacking builder" — niche but high-intent
- R (Retention): 5 — recipe discovery + endless mode + level unlocks = high replay
- F (Feasibility): 3 — card drag-drop + recipe system + combat = medium-high complexity
- Z (Zero-overlap): 4 — merge-kingdom/merge-arena are merge-3, NOT card-stacking
