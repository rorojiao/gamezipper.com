# Nut Sort: Build the City — Competitive Benchmark

## Selected Game: Nut Sort (slug: nut-sort)
- **Score**: 23/25
- **Type**: Sort Puzzle + City Builder Hybrid
- **Target**: Sort colored nuts onto matching bolts, earn resources to build a city

## Competitor Analysis

### 1. Nut Sort: Build the City (CrazyGames)
- **Platform**: Browser (CrazyGames/CrazyGames2)
- **Core Mechanic**: Drag nuts between bolts to sort by color. No time limit.
- **City Builder Meta**: Each completed level earns resources (coins/materials) to construct buildings, parks, homes
- **Levels**: Progressive difficulty, more colors + fewer empty bolts
- **Systems**: Undo, hints, daily challenges
- **Visual Style**: Colorful, polished 2D
- **Audio**: Satisfying click/pop sounds
- **Key Differentiator**: Sort + city building = dual progression loop

### 2. Nut Sort: Color Sorting Game (Google Play — com.zm.nuts)
- **Downloads**: 500K+
- **Core Mechanic**: Drag-and-drop color sorting, nuts onto bolts
- **Levels**: Hundreds of levels, progressive complexity (3→10 colors)
- **Systems**: Hints, undo, no time limit, offline play
- **Visual**: Clean, modern UI with nut/bolt theme
- **Monetization**: Ads + in-app hints

### 3. Nuts Sort! Story Puzzle Game (Google Play)
- **Core Mechanic**: Nut sorting + story rescue twist
- **Features**: Story-driven levels, rescue mechanics, free rewards, offline
- **Levels**: Meticulously designed, hexa sort logic inspired
- **Visual**: Smooth animations, polished effects
- **Key Innovation**: Story/narrative layer on top of sort mechanic

### 4. Nut Sort Puzzle (Google Play — nut.sort.color.puzzle.offline.games)
- **Core Mechanic**: Sort colorful nuts onto matching bolts by color
- **Philosophy**: No time limits, no penalties, relaxing stress-free gameplay
- **Visual**: Clean minimalist
- **Audio**: Relaxing ambient

## Systems to Implement (Competitive Parity)

### Core Sort Systems
- [x] Drag-and-drop nut movement between bolts
- [x] Color matching (nuts must match bolt color)
- [x] Only top nut can be moved
- [x] Bolt can hold max N nuts
- [x] Win when all bolts have single-color nuts
- [x] Undo (multiple steps)
- [x] Restart level
- [x] Hint system (shows optimal next move)

### Progression Systems
- [x] 50+ levels across 5 chapters/worlds
- [x] Progressive difficulty: 3→4→5→6→7→8 colors
- [x] Bolt count varies: 4→12 bolts
- [x] Star rating (1-3 stars based on moves)
- [x] Chapter unlock gates (need X stars to unlock next)
- [x] Daily challenge (seeded random level)
- [x] Level completion rewards (coins + building materials)

### City Builder Meta-Game
- [x] City grid/map with building plots
- [x] Building types: houses, shops, parks, factories, landmarks
- [x] Buildings cost resources earned from levels
- [x] Building upgrades (visual improvement)
- [x] City happiness/population score
- [x] Unlock new city areas with progression

### Scoring & Feedback
- [x] Move counter (fewer moves = more stars)
- [x] Combo multipliers (consecutive correct sorts)
- [x] Particle effects on sort completion
- [x] Celebration animation on level complete
- [x] Screen shake on wrong move
- [x] Sound effects: click, sort, complete, error, city build

### Save & Settings
- [x] localStorage save with version field
- [x] Progress save after each level
- [x] Sound on/off toggle
- [x] Music on/off toggle
- [x] Tutorial (first 3 levels guided)

## Score Formula
- Base score per level = 1000
- Star bonus: 3★ = +500, 2★ = +250, 1★ = +100
- Move efficiency: (optimal_moves / actual_moves) * 500 bonus
- Combo bonus: consecutive_correct * 50

## Level Design Principles
1. Chapter 1 (Levels 1-10): 3-4 colors, 5-6 bolts, tutorial
2. Chapter 2 (Levels 11-20): 4-5 colors, 6-8 bolts
3. Chapter 3 (Levels 21-30): 5-6 colors, 7-9 bolts
4. Chapter 4 (Levels 31-40): 6-7 colors, 8-10 bolts
5. Chapter 5 (Levels 41-50): 7-8 colors, 9-12 bolts
6. Daily levels: Seeded random, 5-8 colors

## Visual Style
- Dark gradient background (GameZipper style)
- Nuts: Colored rings/circles on bolt poles
- Bolts: Vertical poles with base
- City: Isometric pixel art style buildings
- Neon accent colors for UI elements
- Rounded corners, glass-morphism panels
