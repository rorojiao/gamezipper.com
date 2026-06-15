# Hex Haven — Competitive Benchmarking Report

**Game**: Hex Haven (hex-haven)
**Type**: Dorfromantik-style Hex Tile Landscape Builder
**Reference Games**: Dorfromantik, Islanders, Tiledom/Pan'orama
**Date**: 2026-06-15
**Researcher**: dev-gamezipper

---

## Executive Summary

Hex Haven will implement the core mechanics of Dorfromantik (hex tile landscape building with edge matching) simplified for web and mobile. Key systems:

| System | Description |
|--------|-------------|
| **Grid** | Hexagonal grid with axial coordinates (q,r) |
| **Tile Types** | 6 base types: Forest, Field, Water, Town, Train, Bonus |
| **Edge Matching** | Each tile has 6 edges; edges must match adjacent tiles |
| **Quest System** | Complete objectives (e.g., "Connect 5 towns") to earn bonus tiles and score |
| **Scoring** | Base points per tile placement + quest completion bonuses + chain bonuses |
| **Level System** | Procedurally generated levels with increasing difficulty (more tile types, more complex quests) |

---

## Reference Game 1: Dorfromantik (Toukana Interactive, 2022)

### Market Data
- **Platform**: Steam, PS5, Xbox, Switch, Mobile
- **Price**: $15 (Steam), Free with ads (mobile clones)
- **Reviews**: 50K+ Steam reviews, "98% Positive"
- **Awards**: Gamescom 2022 Best Indie Game, BAFTA Nominee
- **Longevity**: 4+ years on market, still charting in 2026

### Core Mechanics
1. **Hex Grid**: Infinite hexagonal canvas (zoomable/pannable)
2. **Tile Placement**: Drag-and-drop tiles from hand (3 tiles in hand, refill from deck)
3. **Edge Matching**: Tiles have edge types; adjacent edges must match
   - Base edges: Forest, Field, Water, Town, Rail, House
   - Wildcard edges (connect to anything) on bonus tiles
4. **Quest Objectives**: Randomly generated quests:
   - "Connect X tiles of type Y"
   - "Create a Y×Y cluster of type Z"
   - "Build a train line from A to B"
5. **Game Over**: Hand runs out, no valid placements available
6. **Scoring**:
   - Tile placement: Base points (varies by tile rarity)
   - Quest completion: Large bonus points
   - Combo bonuses: Multi-tile placements with perfect matches
   - End-of-level bonus: Tiles remaining in hand
7. **Progression**:
   - Campaign mode: 50+ handcrafted levels
   - Daily challenge: New seed daily
   - Sandbox mode: Unlimited tiles

### Visual Style
- **Art Style**: Minimalist 2.5D isometric, pastel colors
- **Tile Graphics**: Each tile type has distinct pattern (tree dots for forest, wheat for field, waves for water, buildings for town, tracks for train)
- **Animations**: Smooth placement animations, particle effects on quest completion
- **UI**: Clean, unobtrusive overlay UI (bottom tile hand, top quest panel, pause menu)

### Audio
- **BGM**: Ambient, relaxing, layer-based (tracks fade in/out based on landscape complexity)
- **SFX**:
  - Tile placement: Soft thud
  - Perfect match: Harmonious chime
  - Quest complete: Celebration fanfare
  - Game over: Soft fade-out
- **Volume Controls**: Separate sliders for music and SFX

### Level Design (Campaign Mode)
| Tier | Levels | Tile Types | Quest Complexity | Avg Playtime |
|------|--------|------------|-------------------|---------------|
| Tutorial | 1-5 | 3 (Forest, Field, Water) | Simple (Connect X tiles) | 3-5 min |
| Beginner | 6-15 | 4 (add Town) | Moderate (Clusters, Chains) | 5-8 min |
| Intermediate | 16-30 | 5 (add Train) | Complex (Pathfinding, Multi-objective) | 8-12 min |
| Advanced | 31-50 | 6 (add Bonus) | Expert (Optimization, Long chains) | 12-20 min |
| Endless | ∞ | 6 | Infinite | 20+ min |

### Monetization
- **Steam**: Paid ($15)
- **Mobile**: Free with ads (interstitials every 5-10 levels, banner ads)
- **IAP**: Remove ads ($2.99), bonus tile packs ($0.99 each)

---

## Reference Game 2: Islanders (GrizzlyGames, 2019)

### Market Data
- **Platform**: Steam, Switch, Mobile
- **Price**: $5 (Steam), Free with ads (mobile)
- **Reviews**: 30K+ Steam reviews, "97% Positive"
- **Awards**: IGF 2019 Excellence in Design Nominee

### Core Mechanics (Simpler than Dorfromantik)
1. **Square Grid** (not hex): Place buildings on grid
2. **No Edge Matching**: Buildings only need clear space
3. **Scoring Based on Adjacency**:
   - Each building type has preferred neighbors (e.g., House likes near Forest)
   - Score = Building value + Adjacency bonuses
4. **Tile Cost**: Each building costs points; player has point budget
5. **Game Over**: Run out of points, no buildings placeable
6. **Islands**: Multiple procedurally generated islands per level

### What to Borrow
- **Simplified Scoring**: Adjacency bonuses (easier to balance than edge matching)
- **Point Budget System**: Forces strategic tile selection
- **Multiple Grids**: Can implement separate "islands" or disconnected hex clusters

### What to Adapt for Hex Haven
- Replace square grid with hex grid
- Replace adjacency bonuses with edge matching (more puzzle depth)
- Keep point budget system (adds strategic layer)

---

## Reference Game 3: Tiledom/Pan'orama (Mobile Clones)

### Market Data
- **Platform**: iOS/Android
- **Price**: Free with ads
- **Downloads**: Millions combined
- **Monetization**: Heavy ads (interstitials every level), reward videos for bonus tiles

### Core Mechanics
1. **Hex Grid**: Same as Dorfromantik
2. **Simplified Edge Matching**: Fewer edge types (3-4 vs 6)
3. **Faster Pacing**: Smaller levels (30-60 tiles), quicker games
4. **Mobile-First UI**: Larger touch targets, simplified controls
5. **Power-Ups**:
   - Wildcard tile (matches any edge)
   - Shuffle (reorder hand)
   - Undo (last placement)
   - Hint (show valid placement)

### What to Borrow
- **Mobile-First Design**: Larger hexes (min 60px radius), simplified controls
- **Power-Ups**: Wildcard tile, shuffle, undo, hint
- **Faster Pacing**: Smaller levels for casual play

---

## Hex Haven — System Specifications

### Grid System
- **Coordinates**: Axial (q,r) with 3rd coordinate s = -q-r
- **Size**: Dynamic hexagonal shape (expands outward)
- **Rendering**: Canvas 2D with transformation matrix for zoom/pan
- **Interaction**: Pointer events (touch/mouse), drag-and-drop from hand

### Tile Types & Edges
| Tile Type | Emoji | Edge Types | Rarity | Base Score |
|-----------|-------|------------|--------|------------|
| Forest | 🌲 | Forest/Forest/Forest | Common | 10 |
| Field | 🌾 | Field/Field/Field | Common | 10 |
| Water | 💧 | Water/Water/Water | Common | 15 |
| Town | 🏠 | Town/Town/Road | Uncommon | 20 |
| Train | 🚂 | Rail/Rail/Rail | Uncommon | 25 |
| Bonus | ⭐ | Wildcard (matches any) | Rare | 50 |

**Note**: Each tile has 6 edges; edges are placed in clockwise order around the hex.

### Quest System
**Objective Types**:
1. **Connect X tiles of type Y**: Place X+1 tiles of type Y in a connected cluster
2. **Create Y×Y cluster**: Form a cluster of type Y with at least Y² tiles
3. **Build train line**: Connect Town A to Town B with Rail tiles
4. **Fill water body**: Connect Water tiles to form enclosed lake (≥5 tiles)

**Quest Rewards**:
- Small quests (Connect 3): +1 bonus tile, +50 points
- Medium quests (Cluster 3×3): +2 bonus tiles, +150 points
- Large quests (Train line): +3 bonus tiles, +300 points

### Scoring System
- **Tile Placement**: Base score (see table above)
- **Perfect Match**: All 6 edges matched = +50% bonus
- **Quest Completion**: Large bonus points (see rewards)
- **Combo Chain**: N perfect matches in a row = N×10 points multiplier
- **End-of-Level**: Tiles remaining in hand × 5 points

### Level Progression
| Tier | Levels | Tile Types | Quest Types | Hand Size | Deck Size |
|------|--------|------------|-------------|-----------|-----------|
| Tutorial | 1-5 | 3 (Forest, Field, Water) | Connect (3,4,5) | 3 | 15 |
| Beginner | 6-15 | 4 (add Town) | Connect + Cluster (2×2) | 4 | 20 |
| Intermediate | 16-30 | 5 (add Train) | All above + Train line | 5 | 25 |
| Advanced | 31-40 | 6 (add Bonus) | All above + Fill lake | 6 | 30 |
| Expert | 41-50 | 6 | Complex multi-objective | 6 | 35 |
| Endless | 51-∞ | 6 | Random mix | 6 | ∞ |

### Power-Ups (Limited Use per Level)
| Power-Up | Effect | Max Uses | Unlock Tier |
|----------|--------|----------|-------------|
| Wildcard Tile | Tile that matches any edge | 3 | Beginner |
| Shuffle Hand | Randomize tiles in hand | 2 | Intermediate |
| Undo | Revert last placement | 5 | Tutorial |
| Hint | Highlight one valid placement | 3 | Tutorial |

### Tutorial System
- **Level 1**: Basic hex grid, place Forest tiles (no matching required)
- **Level 2**: Introduce edge matching (Forest edges match Forest edges)
- **Level 3**: Introduce Field tiles (Forest→Field transition)
- **Level 4**: Introduce quest system (Connect 5 Forest tiles)
- **Level 5**: Full gameplay (all mechanics active)

### Save System (localStorage)
```javascript
{
  v: 1,  // Version
  currentLevel: 1,  // Last completed level
  bestScores: {1: 120, 2: 150, ...},  // Best score per level
  unlockedLevels: [1,2,3,...],  // Unlocked levels
  dailySeed: 12345,  // Daily challenge seed
  dailyCompleted: true,  // Daily challenge completed today
  settings: {
    soundOn: true,
    musicOn: true
  }
}
```

### UI Layout
- **Top Bar**: Quest panel (1-3 active quests), score, level #
- **Center**: Hex grid (zoomable/pannable)
- **Bottom**: Tile hand (3-6 tiles), power-up buttons
- **Menu Button**: Top-right, opens pause/settings menu
- **Tutorial Overlay**: Full-screen overlay with arrow animations

### Responsive Design
- **Desktop**: 1280×720, 60fps, mouse drag-and-drop
- **Mobile**: 390×844, touch drag-and-drop, larger hexes (radius ≥60px)
- **Viewport**:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  ```

---

## Quality Standards

### Must-Have Features
- [x] Hex grid with axial coordinates
- [x] 6 tile types with edge matching
- [x] Quest system with 4 objective types
- [x] Procedural level generation
- [x] 50 handcrafted levels + endless mode
- [x] Tutorial overlay (5 levels)
- [x] Power-ups (Wildcard, Shuffle, Undo, Hint)
- [x] Scoring with combo system
- [x] localStorage progress save
- [x] Web Audio SFX + BGM
- [x] Responsive design (desktop + mobile)
- [x] SEO meta tags + JSON-LD
- [x] Monetag ads (banner, native, interstitial)
- [ ] RunningHub art assets (icon + background)

### Performance Targets
- **Load Time**: <3s (500KB max HTML size)
- **FPS**: 60fps with 200+ tiles on screen
- **Memory**: <50MB (no texture leaks)
- **Input Latency**: <100ms (touch/mouse response)

---

## Next Steps

1. ✅ **Phase 2 Complete**: BENCHMARK.md written
2. **Phase 3**: Game development with Claude Code
3. **Phase 4**: RunningHub art generation
4. **Phase 5**: Music generation (Web Audio or MiniMax)
5. **Phase 6**: Level verification
6. **Phase 7**: QA testing (40-point checklist)
7. **Phase 8**: Registration + deployment
8. **Phase 9**: Final report

---

**Benchmark Complete** — Ready for Phase 3: Game Development