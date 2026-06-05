# Duck Merge — Competitive Benchmark

## Game Overview
**Slug:** duck-merge  
**Genre:** Merge Puzzle / Casual  
**Core Mechanic:** Drag-and-drop same-type ducks to merge them into higher-tier ducks. Complete level objectives by creating target ducks.  
**Target:** S-grade commercial quality, 30 levels, 5 difficulty tiers  

## Competitor Analysis

### 1. Duck Merge (Poki, 2026)
- **Developer:** Sakkat Studio
- **Platform:** Poki (Web), Mobile
- **Rating:** 4.6/5 (10.7K votes)
- **Status:** #22 Trending on Poki (May 2026)
- **Core Mechanics:**
  - Drag same-tier ducks together to merge into next tier
  - Each level has specific objectives (e.g., "Create 3 Golden Ducks")
  - Duck tiers: Egg → Duckling → Duck → Super Duck → Golden Duck → Diamond Duck
  - Board is a pond with limited space
  - New ducks spawn periodically from eggs
  - Game over when board fills up
- **Progression:** 30+ levels, increasing complexity
- **Monetization:** Interstitial ads, rewarded video for hints/undo
- **Retention Hooks:** Daily challenges, duck collection, achievement badges

### 2. Merge Mansion (Gram Games, 100M+ downloads)
- **Core Mechanics:** Merge same items on board to create higher-tier items
  - Items discovered through merging chains
  - Board has limited grid space
  - Energy system gates play time
- **Progression:** 1000+ levels with story missions
- **Monetization:** IAP (energy, boosters), rewarded ads
- **Key Systems:**
  - Item chain discovery (merge A→B→C→D...)
  - Board management (clear space, strategic merges)
  - Story-driven objectives
  - Decoration/garden building
- **Retention:** Story progression, collection completion, daily tasks

### 3. Watermelon Game (Suika Game, 10M+ downloads)
- **Core Mechanics:** Drop fruits, same fruits merge on collision
  - Physics-based (gravity, bouncing)
  - Chain reactions (merge triggers merges above)
  - Game over when fruits stack above line
- **Progression:** Score-based (no levels, high score focus)
- **GZ Already Has:** watermelon-merge (similar mechanic)
- **Key Difference from Duck Merge:** Gravity-based drop vs. drag-merge on grid

### 4. Merge Dragons! (Gram Games, 50M+ downloads)
- **Core Mechanics:** Merge 3 (not 2) identical items on board
  - Camp building via merged resources
  - Dragon eggs hatch from merges
  - Heal corrupted land by merging
- **Key Systems:**
  - 3-for-1 merge (higher difficulty threshold)
  - Large merge chains (15+ tiers per item type)
  - Camp decoration with merged items
  - Challenge levels with specific goals
- **Monetization:** IAP, rewarded ads for dragon eggs

## Systems to Implement

| System | Priority | Description |
|--------|----------|-------------|
| Merge Core | MUST | Drag same ducks to merge, visual merge animation |
| Duck Tiers | MUST | 7+ evolution tiers with distinct visuals |
| Level Objectives | MUST | "Create X of Duck Tier Y" per level |
| Board Management | MUST | Grid-based board, limited space |
| Spawn System | MUST | New ducks spawn from eggs at intervals |
| Scoring | MUST | Points per merge, combo multiplier for chain merges |
| 3-Star Rating | MUST | Score thresholds for 1/2/3 stars |
| Power-ups | MUST | Shuffle (rearrange board), Hint (highlight merge targets), Clear (remove 3 ducks) |
| Progress Save | MUST | localStorage with level completion + best score |
| Tutorial | MUST | 4-step interactive tutorial for new players |
| Sound Effects | MUST | Merge pop, spawn quack, level complete fanfare, button click |
| BGM | MUST | Ambient pond/nature themed procedural music |
| Achievements | NICE | First merge, chain X5, speed clear, etc. |
| Daily Challenge | NICE | Special seed-based daily puzzle |

## Duck Evolution Chain (7 tiers)
1. **Egg** (tiny, white) → base spawn unit
2. **Duckling** (small, yellow) → first merge
3. **Duck** (medium, green head) → second merge  
4. **Super Duck** (large, blue) → third merge
5. **Golden Duck** (large, gold) → fourth merge
6. **Diamond Duck** (sparkling, cyan) → fifth merge
7. **Rainbow Duck** (rainbow glow, ultimate) → sixth merge

## Level Design (30 levels, 5 tiers)

| Tier | Levels | Board Size | Spawn Rate | Target Ducks | Obstacles |
|------|--------|-----------|------------|--------------|------------|
| Starter (1-5) | 5 | 5x5 | Slow (5s) | Duckling | None |
| Classic (6-10) | 5 | 5x5 | Medium (4s) | Duck | Stone blocks |
| Challenge (11-15) | 5 | 6x6 | Medium (3.5s) | Super Duck | Ice blocks, limited moves |
| Expert (16-20) | 5 | 6x6 | Fast (3s) | Golden Duck | Mixed blocks, faster spawn |
| Master (21-25) | 5 | 7x7 | Fast (2.5s) | Diamond Duck | All obstacles, tight space |

## Art Style
- Cute, round, colorful duck characters (CSS/Canvas drawn)
- Pond background with lily pads, ripples, clouds
- Soft pastel color palette
- Smooth merge animations (scale up, glow, particles)
- Dark GameZipper theme with neon accents for UI

## Technical Notes
- Canvas-based rendering at 60fps
- Frame-rate independent logic (delta time)
- Touch support: pointer events, 44px minimum tap targets
- Responsive: desktop (800x600) and mobile (390x844)
- Single file HTML5, no external dependencies
- Procedural duck drawing (no sprite sheets needed)
- Procedural Web Audio BGM + SFX
- mulberry32 seeded RNG for level generation
