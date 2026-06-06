# Grow Worm — Benchmark Document

## Target Games (Competitive Analysis)

### 1. **Growmi** (Coolmath Games / AntGames) — Primary
- **Platform**: Web, CoolmathGames
- **Genre**: Puzzle-Platformer / Snake-Hybrid
- **Core Loop**: Slither a worm through rooms, collect stars to grow, use body length to solve puzzles
- **Key Mechanics**:
  - Arrow keys: slither in 4 directions
  - Spacebar: drop down (vertical descent)
  - Magnet pickup: attract/repel magnetic objects to activate switches
  - Map teleport: portals between rooms, click 3-dot teleporters
  - Limited moves: per-level move quota
  - Stars: collect to grow longer and unlock new areas
  - Restart (R) and Undo (U): error recovery
  - Body length: shown as squares (e.g. starts at 3, grows to 6+)
- **Levels**: ~40+ hand-crafted levels across multiple rooms
- **Art Style**: Cute, soft pastel backgrounds, simple but charming
- **Audio**: Subtle ambient music, soft SFX
- **3-Star System**: No — but per-level move efficiency is the meta
- **Save System**: Per-level progress (visited rooms, collected stars)

### 2. **Snake VS Block** (GZ has it — different mechanic, reference for snake UX)
- **Platform**: Web, mobile
- **Genre**: Arcade Snake
- **Comparison**: Snake VS Block is endless arcade, ours is puzzle-platformer with growth gate
- **Borrowed UX**: Smooth body rendering, growth animation, responsive touch

### 3. **Nibblers / Little Big Snake** (popular snake games)
- **Platform**: Web, mobile
- **Comparison**: These are multiplayer arenas; ours is single-player puzzle
- **Borrowed UX**: Body-as-snake movement feel, star/coin collection

## GameZipper S-Grade Standards (our bar)

| System | Implementation |
|--------|----------------|
| Levels | 25 puzzles across 5 tiers (5 puzzles each) |
| Move Limit | Each puzzle has a par (3-star based on moves used) |
| Stars | Collectible stars per level (1-3 stars depending on move efficiency) |
| Magnet | Power-up unlocked at tier 2 |
| Teleporters | Room-based maps unlocked at tier 3 |
| Drop | Spacebar/button drops the worm down |
| Restart/Undo | Always available |
| Tutorial | 4-step skippable intro modal |
| Score | Best score per level + total stars + best moves |
| Progress Save | localStorage v2 with version field |
| Pause Menu | Stats + reset + sound toggle |
| Win Modal | Confetti, star rating, next-level CTA |
| Procedural BGM | Lo-fi ambient loop (Web Audio API) |
| SFX | 8 sound effects (move, star, magnet, drop, win, fail, click, hover) |
| Art Style | Dark gradient (GameZipper signature), neon glow worm, star particles |

## Tier Progression

| Tier | Levels | Theme | Mechanic Introduced |
|------|--------|-------|---------------------|
| Tier 1: Spark | 1-5 | Forest | Move + grow on stars |
| Tier 2: Magnet | 6-10 | Caverns | + Magnet pickup |
| Tier 3: Portal | 11-15 | Sky | + Teleporter rooms |
| Tier 4: Hazard | 16-20 | Void | + Spikes (move limit pressure) |
| Tier 5: Master | 21-25 | Cosmos | + Multi-room + magnet + portals combined |

## Per-Level Data Structure

```js
{
  id: 1,
  name: "First Slither",
  tier: 1,
  par: 8,           // moves to 3-star
  star1: 12,        // moves to 1-star (level complete)
  star2: 10,        // moves to 2-star
  star3: 8,         // moves to 3-star
  grid: { w: 12, h: 8 },  // grid dimensions
  walls: [[x,y],...],
  stars: [{x,y},...],     // required stars to clear
  bonusStars: [{x,y}],    // optional stars (count toward total)
  start: {x, y, length: 3},
  goal: {x, y},            // exit tile
  magnets: [{x, y}],       // for tier 2+
  teleporters: [{x, y, id: 'A'}],  // for tier 3+
  hazards: [{x, y, type: 'spike'}],  // for tier 4+
}
```

## Why This Game Wins the Gap

- **Zero overlap with GZ**: No existing grow-to-eat / puzzle-platformer-snake hybrid
- **SEO gold**: "grow worm", "snake puzzle", "growmi" alt-search
- **High retention**: Move-limit creates replay pressure; 3-star rating pulls completionists
- **Mobile-friendly**: Touch arrows + tap-to-drop = full mobile support
- **No-build**: Single-file HTML5 Canvas
- **Ad-friendly**: 25 levels × 3 attempts average = ~75 sessions per player

## Monetization Hooks
- 3-stars-per-level drives retry → ad impressions
- 25 levels × 4 retries avg = 100 sessions per completion
- Pause menu + level select = long dwell time
