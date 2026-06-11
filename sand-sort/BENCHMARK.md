# Sand Sort Puzzle — Competitive Benchmark

Date: 2026-06-11
Game: Sand Sort Puzzle
Slug: sand-sort
Category: puzzle

## Market Overview

Sand Sort Puzzle is a viral puzzle genre where players pour colored sand between glass bottles
to sort each color into its own container. The sand flows realistically as particles, creating
satisfying visual feedback. It's a variant of the water sort puzzle genre but with distinct
particle physics that differentiates it.

## Top Competitors

### 1. Sand Sort Puzzle (by Gamovation / Homa)
- **Platform:** iOS/Android
- **Downloads:** 50M+
- **Rating:** 4.5/5
- **Key Features:**
  - Particle-based sand simulation
  - 1000+ levels
  - Color sorting mechanics
  - Hint system (limited, IAP)
  - Undo button
  - Daily challenges
- **Monetization:** Interstitial ads between levels, rewarded ads for hints, IAP for ad-free
- **UI/UX:** Bright colors, bottle containers at bottom, tap to select source then tap target
- **Strengths:** Satisfying sand physics, huge level count, simple controls
- **Weaknesses:** Ad-heavy, IAP gates on hints

### 2. Water Sort Puzzle (by IEC Global / Guru Puzzle Game)
- **Platform:** iOS/Android/Web
- **Downloads:** 100M+ (Google Play)
- **Rating:** 4.6/5
- **Key Features:**
  - Liquid-based (not sand) sort puzzle
  - Tube-based containers
  - Color sorting with overflow rules
  - Hint and undo systems
  - Level progression
- **Monetization:** Interstitial ads, rewarded hints
- **Relevance:** Same genre ancestor; sand sort is the physics evolution

### 3. Sand Balls (by SayGames)
- **Platform:** iOS/Android
- **Downloads:** 100M+
- **Key Features:**
  - Swipe to dig through sand
  - Guide balls to truck
  - Particle sand physics
  - NOT a sort puzzle (different mechanic)
- **Relevance:** Shows sand physics appeal, but different game mechanic

### 4. Ball Sort Puzzle (by IEC Global)
- **Platform:** iOS/Android/Web
- **Downloads:** 100M+
- **Key Features:**
  - Sort colored balls between tubes
  - One ball at a time
  - Same rule: only same-color on top of same-color, or empty
  - 5000+ levels
- **Relevance:** Same rule set as sand sort, just different visual

### 5. Browser clones on CrazyGames / Poki
- Water Sort: Multiple browser versions available
- Sand Sort: Very few browser clones with particle physics
- **Gap:** No high-quality sand sort browser game with particle simulation

## Game Mechanics Analysis

### Core Rules (from analyzing multiple clones):
1. Grid of bottles (typically 5-9 bottles)
2. Each bottle holds N units of sand (typically 4 units)
3. Sand is colored (4-6 colors)
4. Player taps source bottle, then target bottle
5. Sand pours from source to target until:
   - Target is full, OR
   - Color changes in source, OR
   - Target has a different color on top
6. Win condition: Each bottle contains only one color (or is empty)
7. One or two empty bottles provided as buffer

### Difficulty Progression:
- Early: 3-4 colors, 2 extra bottles
- Mid: 5-6 colors, 1-2 extra bottles
- Late: 6+ colors, 1 extra bottle (very hard)

### Sand Physics (what makes it unique vs water sort):
- Sand flows as individual particles
- Satisfying pour animation
- Colors can briefly mix at boundary (visual only, logic stays pure)
- Particles settle with gravity

## Implementation Strategy

### Sand Particle System:
- Canvas-based particle simulation
- Each "unit" of sand = ~20-30 small particles
- Particles fall with gravity, collide with bottle walls
- Pour animation: particles arc from source to target bottle
- Color stacking is logical (pure color blocks), visual is particle-based

### Level Design:
- 30 levels, 5 tiers of 6 levels each
- Tier 1: 3 colors, 5 bottles (2 extra), 4-unit capacity
- Tier 2: 4 colors, 6 bottles (2 extra), 4-unit capacity
- Tier 3: 4 colors, 6 bottles (1 extra), 4-unit capacity
- Tier 4: 5 colors, 7 bottles (2 extra), 4-unit capacity
- Tier 5: 5 colors, 7 bottles (1 extra), 4-unit capacity

### Key Features:
- Tap-to-select, tap-to-pour controls
- Undo (full history)
- Reset level
- Hint (highlight next valid move)
- Star rating (based on moves)
- Progress saved to localStorage
- Daily puzzle (seeded by date)

### Monetization:
- Monetag ads (banner + interstitial between levels)
- No IAP (browser game)

## Technical Architecture

- Single HTML file, Canvas rendering
- Sand particle system (~200-400 particles active)
- Bottle collision boundaries (rectangular with rounded bottom)
- Pour arc animation (parabolic trajectory)
- State machine: idle -> selected -> pouring -> settling -> idle
- Move history stack for undo
- BFS solver for hints

## Competitive Advantage
- Only browser sand sort with particle physics
- Smooth 60fps pour animations
- 30 handcrafted levels + daily puzzle
- Dark neon aesthetic (matching GameZipper theme)
- Free, no IAP gates
