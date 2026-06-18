# Domino Chain — Competitor Benchmark

## Selected Game
**Domino Chain** — Place dominoes on a grid, trigger them to topple, and watch the chain reaction hit all goals. Spatial + causal puzzle.

Slug: `domino-chain`
Category: Puzzle
Tier: R32 QUEUE #5 (20/25 — qualified ≥18)

## Why Built Now (R38)
R37 (burger-stack) complete. Remaining queue: logo-quiz (IP risk — skipped), domino-chain (20), zen-garden (19). domino-chain is the next-highest scorable candidate and a true gap (strict grep = 0 for "domino chain|topple|chain reaction topple"; the existing "Dominoes" is a pip-tile game, NOT a topple puzzle).

## Competitors Benchmarked

### 1. Domino Maze (web/Big Fish)
- 50+ hand-crafted levels
- Place dominoes → trigger → chain reaction topples them
- Goal: topple must reach the exit / hit stars
- Hazards: gaps, walls, slopes
- Star rating: 3★ = no hints used
- Tutorial level

### 2. Domino World / Domino Puzzle (mobile, 10M+ downloads)
- Drag domino from tray, snap to grid
- Multiple domino types: standard, heavy (pushes through gaps), bridge (spans gaps), splitter (sends chain two ways)
- Objectives: clear stars, reach flag, activate switch
- 100+ levels across 4 worlds
- Daily challenge mode
- Level select with progress

### 3. Topple / Domino Effect (CrazyGames)
- Physics-based domino toppling
- Time-attack mode
- Combo scoring for long chains
- Particle effects on topple

## Systems Required (competitor parity)
- [x] Grid-based placement (drag from tray → snap to grid cell)
- [x] Topple trigger (click "Go!" to start chain)
- [x] Chain reaction animation (domino falls in direction of push)
- [x] Multiple domino types (standard, heavy, bridge, splitter)
- [x] Goal objectives (target flag/marker that must be reached)
- [x] Collectible stars (3 per level)
- [x] Hazards (walls block topple, gaps need bridges)
- [x] Level select with progress save (localStorage)
- [x] Star rating per level (3★ = no hints)
- [x] Hint system (shows valid placements)
- [x] Reset level button
- [x] 20+ levels with progressive difficulty
- [x] Scoring (chain length, combo, time bonus)
- [x] Best score (localStorage)
- [x] Web Audio API SFX (place, topple, hit goal, error)
- [x] Web Audio API procedural BGM
- [x] Tutorial overlay (first time)
- [x] Settings (sound toggle, reset progress)
- [x] Responsive (desktop 1280×720, mobile 390×844)
- [x] Touch support (pointer events, min 44px targets)

## Visual Style
- Dark gradient background (GameZipper style)
- Neon accent colors (cyan/magenta toppling line, gold stars)
- Glowing chain-reaction line when dominoes topple
- Particle burst when hitting goal
- Smooth CSS transitions for UI

## Difficulty Curve
- L1-5: tutorial basics, single path, 1 goal, no hazards
- L6-10: introduce walls + bridges, 2-3 stars
- L11-15: splitters, multiple paths, gaps
- L16-20: complex layouts, all domino types, tight tray limits

## Scoring Formula
- Base: 100 per goal reached
- Star bonus: 250 per star collected
- Chain length bonus: 10 × chain length²
- Time bonus: max 200, decays over 60s
- Hint penalty: -50 per hint used
- 3★ rating = no hints AND all stars collected
