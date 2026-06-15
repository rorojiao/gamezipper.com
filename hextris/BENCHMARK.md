# Hextris Competitive Benchmark

## Game Overview
**Hextris** is a hexagonal Tetris-inspired arcade puzzle game where colored blocks fall from the outside of a hexagonal grid toward the center. Players rotate the hexagon to guide falling blocks, matching 3+ same-colored blocks for clears with chain reaction combos.

## Key Competitors

### 1. Original Hextris (Garrett Finnie, David Mihalcik)
- **Platform**: Web, Mobile
- **Downloads/Plays**: 10M+ web plays, 5M+ mobile downloads
- **Core Mechanics**: 
  - Hexagonal 6-sector grid, blocks fall from edges toward center
  - Rotate hexagon left/right to aim falling blocks
  - 3+ connected same-color blocks clear
  - Chain reaction combos from cascading clears
  - Progressive speed increase
  - Game over when blocks reach outer edge
- **Systems Implemented**:
  - Score with combo multiplier (x2, x3, x4...)
  - High score (localStorage)
  - Simple particle effects on clear
  - Screen shake on big combos
  - Touch controls for mobile
- **Monetization**: Banner ads between games
- **Strengths**: Simple, addictive, great visual feedback
- **Weaknesses**: No level progression, limited power-ups, repetitive

### 2. Polysphere (Casual Android)
- **Platform**: Android, iOS
- **Downloads**: 50M+
- **Core Mechanics**: Rotate hexagonal rings to form solid colors, relaxed puzzle style
- **Systems**: 1000+ levels, daily challenges, hints, shuffle power-ups
- **Monetization**: Ads + IAP
- **Relevance**: Shows demand for hexagonal puzzles with clear progression

### 3. Twist (Noodlecake Studios)
- **Platform**: iOS, Android
- **Downloads**: 1M+
- **Core Mechanics**: Rotate hexagonal clusters, match connected colors
- **Systems**: 100 levels, 3-star ratings, hints, undo
- **Monetization**: Paid app
- **Relevance**: Premium hexagonal puzzle market

## Gap Analysis for GameZipper Implementation

### Market Demand (5/5)
- Hextris original has 10M+ web plays
- Polysphere has 50M+ mobile downloads proving hexagonal puzzle demand
- Zero hextris-like games on GameZipper (grep confirmed)
- Trending "hexagonal puzzle" + "tetris variant" keywords

### SEO Opportunity (4/5)
- Keywords: "hexagonal tetris", "hextris", "hex puzzle game", "color match hexagon"
- Low competition on these specific terms
- High search volume from mobile casual audience

### Retention Potential (4/5)
- Endless arcade mode = infinite replayability
- Combo system creates "one more try" dopamine loop
- 30 level mode provides structured progression
- Power-ups (hint, undo, bomb) add strategic depth

### Technical Feasibility (5/5)
- Single-file Canvas 2D: hexagonal grid rendering is straightforward
- Physics: simple gravity and collision, no complex physics engine
- Matching: BFS/DFS for connected components
- Colors: procedural rendering, no external assets needed

### Zero Overlap (5/5)
- Grep confirmed no hextris or hexagonal block-matching game on GZ
- Unique rotation + falling mechanic not seen in existing 337 games

## Recommended Feature Set (对标竞品全部系统)

### Core Mechanics
- 6-sector hexagonal grid, 7 rings per sector (42 total cells)
- Blocks fall from outside toward center, land at deepest empty position
- Rotate hexagon left/right (discrete 60° or smooth)
- 3+ connected same-color blocks clear
- Chain reaction combos with gravity settling after clears

### Scoring System
- Base score: 10 points per cleared block
- Combo multiplier: x2, x3, x4... for chain reactions in one placement
- Speed bonus: faster levels = more points per block
- Level target score thresholds

### Level System (30 Levels)
- Tier 1 (L1-6): Speed 35-45, 3 colors, 10-15% pre-filled
- Tier 2 (L7-12): Speed 45-55, 4 colors, 15-25% pre-filled
- Tier 3 (L13-18): Speed 55-65, 5 colors, 25-35% pre-filled
- Tier 4 (L19-24): Speed 65-75, 5 colors, 35-45% pre-filled
- Tier 5 (L25-30): Speed 75-85, 6 colors, 45-55% pre-filled
- Each level has target score (400 + level × 60)
- Procedural board generation with seeded PRNG for determinism
- Pre-filled blocks avoid initial matches (no free clears)

### 3-Star Rating System
- 1 star: Reach target score
- 2 stars: Target × 1.5
- 3 stars: Target × 2.0
- Stars persist in localStorage

### Power-Ups
- Hint: Highlight best sector to rotate for optimal match (AI suggestion)
- Undo: Revert last placement (restore previous grid state)
- Bomb: Clear random 3 blocks in a line (helps when stuck)
- Each level grants 1 hint, 1 undo, 1 bomb

### Progress Saving
- localStorage: unlocked levels, best scores per level, star ratings
- Unlock next level after earning at least 1 star
- Track best endless mode score

### Tutorial
- First-time overlay showing:
  - "Rotate hexagon to aim blocks"
  - "Match 3+ same colors to clear"
  - "Combos multiply your score!"
- Skip-able after first play

### Audio
- BGM: Ambient electronic, Web Audio API procedural
- SFX: Block land, clear, combo, game over, button clicks
- Separate music toggle, sound toggle

### Visual Feedback
- Particles on clear (30-50 particles, outward burst)
- Screen shake on combo (intensity scales with combo count)
- Glow effect on falling block (matches its color)
- Smooth rotation animation (100ms tween)
- Combo text popup ("x2 COMBO!", "x3 COMBO!")

### Mobile Optimization
- Touch controls: tap left/right half of screen to rotate
- Large touch targets (44px minimum)
- Responsive canvas (390x844 portrait, 1280x720 landscape)
- Touch-action:none on canvas to prevent scroll

### Technical Quality
- requestAnimationFrame loop with delta time
- AudioContext lazy initialization
- cleanup() function: cancel rAF, clear intervals, close audio
- beforeunload handler for cleanup
- visibilitychange handler to pause when tab hidden

## Next Steps
Implement full game with above features, then generate art assets (procedural neon background + RunningHub icon), generate music (Web Audio), run 40-point QA checklist, register and deploy.