# BENCHMARK.md — Love Balls Competitive Analysis

## Selected Game: Love Balls (love-balls)

## Primary Competitor: Love Balls (Lion Studios)
- **Platform**: iOS / Android
- **Downloads**: 100M+ (Google Play)
- **Rating**: 4.1 stars, 662K reviews
- **Category**: Puzzle / Physics / Drawing

## Core Mechanic
Player draws lines/shapes on screen to create physical barriers and ramps.
Two balls (blue ball + pink/red ball) are placed at different positions.
Gravity pulls them down. The goal is to draw lines so the balls bounce/roll
and meet each other (kiss/touch). Minimal ink usage = 3 stars.

## Competitive Systems Analysis

### 1. Level Design (30 levels planned)
- Difficulty progression: simple free-fall → obstacle avoidance → hazard zones → multi-ball → constrained drawing
- Tier 1 (L1-6): Basic — balls fall directly toward each other, minimal obstacles
- Tier 2 (L7-12): Walls — static walls block direct path, player must redirect
- Tier 3 (L13-18): Hazards — spikes/pits that destroy balls on contact
- Tier 4 (L19-24): Moving obstacles — rotating bars, pendulums
- Tier 5 (L25-30): Complex — multiple hazards, tight spaces, precision drawing

### 2. Scoring System
- 3-star rating based on ink efficiency (total line length drawn)
- Par ink value per level (calculated from optimal solution)
- 3 stars: ink < 50% of par | 2 stars: ink 50-80% | 1 star: ink > 80%
- Level completion always gives at least 1 star

### 3. Physics Engine
- Simple Verlet integration for ball position
- Gravity: constant downward force
- Collision: ball-line segment distance check
- Bounce: velocity reflection with energy loss (restitution ~0.6)
- Ball-ball collision: elastic collision

### 4. Drawing Mechanic
- Player draws by dragging (pointer events)
- Lines stored as polylines (array of points)
- Each segment is a thin physics barrier
- Line length tracked for scoring
- Can draw multiple separate lines

### 5. Progress System
- localStorage save with version field
- Level unlock progression (complete N to unlock N+1)
- Star count tracking (total stars earned)
- Best ink score per level

### 6. UI/UX
- Dark gradient background (GZ style)
- Blue ball with face, pink ball with face (cute style)
- Draw trails with neon glow effect
- Level complete: celebration animation + star reveal
- Level select grid with star indicators
- Tutorial overlay for first-time players

### 7. Audio
- BGM: Ambient/romantic soft melody (Web Audio API procedural)
- SFX: ball bounce, ball kiss (success), ink draw, star earned, level complete jingle
- Separate music/sound toggles

## Competitor Feature Checklist
- [x] Physics-based line drawing
- [x] 30 handcrafted levels
- [x] 3-star scoring (ink efficiency)
- [x] Level progression + unlock
- [x] Star tracking
- [x] Tutorial/onboarding
- [x] BGM + SFX
- [x] Responsive (mobile + desktop)
- [x] Progress save (localStorage)
- [x] Level select grid
- [x] Obstacles (walls, spikes, pits)
- [x] Ink/drawing trail visualization
