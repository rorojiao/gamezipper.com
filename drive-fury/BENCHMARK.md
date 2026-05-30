# BENCHMARK.md — Drive Fury

**Target**: Physics-based 2D side-scrolling driving game
**Slug**: drive-fury
**Date**: 2026-05-30

## Competitive Analysis

### 1. Drive Mad (Martin Magni / Poki) — 300M+ plays
- **Core mechanic**: Two-button physics (accel/brake), no steering, fixed 2D side-scroll track
- **Physics**: Torque, weight transfer, friction, separate wheel suspension. High center of gravity for exaggerated tilts.
- **Levels**: 200+ handcrafted. Vehicles auto-assigned per level.
- **Vehicles**: 10+ types (pickup truck, monster truck, snowplow, limo, jet airplane, excavator, tank)
- **Scoring**: Binary pass/fail (no stars). Speedrun.com leaderboards.
- **Controls**: Desktop (WASD/arrows), Mobile (tap left/right sides)
- **Visual**: Voxel 3D, toy-like, bright & colorful
- **Audio**: Minimal — toy engine hum, crash sounds, subtle BGM
- **Key**: No tutorial (learn-by-failure), instant restart (no load screens)

### 2. Moto X3M (MadPuffers / CrazyGames)
- **Core mechanic**: 4-key side-view stunt racing (accel/brake/lean L/R). Mid-air rotation for tricks.
- **Physics**: Box2D, rear-wheel boost on landing, wheelie speed trick.
- **Levels**: 22 original + expansion packs (Winter, Pool Party, Spooky Land).
- **Scoring**: **3-star rating per level** based on completion time. Flip bonus: -0.5s per 360° flip.
- **Checkpoints**: Mid-level checkpoints within each level.
- **Vehicles**: 3+ bikes unlocked by spending stars.
- **Controls**: Desktop (arrows), Mobile (on-screen buttons)
- **Visual**: Cartoon 2D, varied environments, ragdoll crash animation
- **Audio**: Engine revving, crash SFX, upbeat rock BGM

### 3. Hill Climb Racing (Fingersoft) — 1B+ downloads
- **Core mechanic**: 2-button (gas/brake), physics-driven tilt, fuel system
- **Vehicles**: 13-20+ purchasable, each with unique physics (weight, grip, power, fuel)
- **Upgrade system**: 4 stats per vehicle (Engine, Suspension, Tires, Fuel) — primary retention mechanic
- **Maps**: 9+ endless environments (Countryside, Desert, Arctic, Moon, Volcano)
- **Scoring**: Distance-based + coin collection. Coins = upgrade currency.
- **Controls**: 2-button only (gas/brake). No lean control.

## Drive Fury Feature Specification

### Must-Have (from competitive analysis)
1. **Simple 2-button controls** (accel + brake) — proven sweet spot for browser physics games
2. **Instant restart** — no load screens, one-more-try loop
3. **Physics-driven tilt** — high center of gravity, suspension bounce, "about to flip" tension
4. **3-star rating per level** — time-based thresholds (Moto X3M model)
5. **Varied vehicles** — 5 vehicles with unique physics, auto-assigned per level group
6. **Checkpoints** in longer levels (Moto X3M model)
7. **Progressive difficulty** — 40 levels from trivial to expert
8. **Endless mode** — distance-based with procedural terrain (Hill Climb Racing model)
9. **Fuel/coin system** — fuel cans + coins scattered on track for retention
10. **Garage** — vehicle display, stats comparison, unlock progress
11. **Flip bonus** — aerial 360° flips give time bonus (Moto X3M mechanic)
12. **All English UI**, dark gradient GameZipper theme

### 40-Level Progression Plan
- **Levels 1-5**: Tutorial (flat terrain, gentle hills, no obstacles). Teaches accel/brake/tilt.
- **Levels 6-10**: Introduce jumps, ramps, basic gaps. First vehicle (Truck).
- **Levels 11-15**: Moving platforms, breakable bridges, narrow passages. Vehicle 2 (Buggy).
- **Levels 16-20**: Loops, steep climbs, ice physics. Vehicle 3 (Monster Truck).
- **Levels 21-25**: Explosive barrels, collapsing terrain, pendulums. Vehicle 4 (Sports Car).
- **Levels 26-30**: Combined mechanics, precision required. Vehicle 5 (Tank).
- **Levels 31-35**: Expert levels — all mechanics, narrow margins.
- **Levels 36-40**: "Final exam" — combination of everything, extreme difficulty.

### 5 Vehicles
1. **Dusty Truck** (starter) — Balanced, forgiving, good grip
2. **Sand Buggy** — Light, fast, low stability, great for jumps
3. **Monster Truck** — Heavy, powerful, huge wheels, slow acceleration
4. **Racer X** — Fast, low center of gravity, fragile
5. **Thunder Tank** — Very heavy, nearly un-flippable, slow but unstoppable

### Core Systems
- Score: time-based 3-star rating + flip bonus + coin count
- Progress: localStorage with version field
- Settings: Sound toggle, fullscreen, controls info
- Tutorial: First 3 levels are implicit tutorial
- Garage: Show unlocked vehicles with stats

### Audio Requirements
- Engine sound per vehicle (pitch varies)
- Crash/impact SFX
- Coin collect SFX
- Flip success SFX
- Level complete celebration
- Ambient BGM (upbeat electronic/rock)
- All via Web Audio API (procedural)

### Visual Requirements
- Dark gradient background (GameZipper dark style)
- Parallax scrolling background layers
- Neon accent colors per vehicle
- Particle effects (exhaust, crash debris, coin sparkle)
- Smooth 60fps Canvas rendering
