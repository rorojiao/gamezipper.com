# Drive Fury — BENCHMARK.md

## Game Overview
Physics-based 2D side-view driving game. Control unstable vehicles across obstacle courses.

## Competitor Analysis

### Drive Mad (Poki, 300M+ plays)
- **Core Mechanic**: 2D side-view, control vehicle acceleration/braking on hilly terrain
- **Physics**: Realistic vehicle tilt, suspension, momentum
- **Levels**: 100+ levels, increasing difficulty
- **Scoring**: Time-based, 3-star rating per level
- **Vehicles**: Cars, trucks, buses, tanks
- **Visual Style**: Simple colorful 3D-ish, clean
- **Music**: Upbeat background music, engine sounds

### Moto X3M (CrazyGames, long-time top)
- **Core Mechanic**: Motorbike obstacle racing, flip tricks
- **Physics**: Bike tilt, flip rotation, speed control
- **Levels**: 22 levels + unlockable bikes
- **Scoring**: Time + stunts + stars
- **Features**: Checkpoints, explosive obstacles, loops
- **Music**: Rock/energetic soundtrack

### Hill Climb Racing (500M+ downloads)
- **Core Mechanic**: Uphill driving with fuel management
- **Physics**: Vehicle balance (lean forward/backward), terrain grip
- **Levels**: Multiple environments (countryside, desert, arctic, moon)
- **Monetization**: Fuel system, vehicle upgrades, coin collection
- **Vehicles**: Jeep, motocross, tank, truck, snowmobile

### Turbo Dismount (10M+)
- **Core Mechanic**: Vehicle crash physics
- **Physics**: Ragdoll, impact forces
- **Levels**: Various obstacle courses
- **Features**: Slow-motion replay, multiple vehicles

## Systems to Implement

### 1. Physics Engine
- Vehicle body with center of mass
- Wheel physics (rotation, traction, bounce)
- Gravity + terrain collision
- Tilt/rotation based on terrain slope
- Momentum and inertia
- Suspension bounce effect

### 2. Level System (40 levels)
- Terrain: procedurally generated hills, ramps, gaps, loops
- Obstacles: spikes, barriers, moving platforms, breakable walls
- Difficulty curve: flat → hills → ramps → gaps → loops → combos
- Star rating: time-based (3-star = under par time)
- Checkpoints on long levels

### 3. Vehicle System (5 vehicles)
- Jeep (balanced)
- Sports Car (fast, unstable)
- Monster Truck (heavy, powerful)
- Motorcycle (light, agile)
- Tank (slow, indestructible)

### 4. Scoring System
- Time-based scoring per level
- 3-star rating (gold/silver/bronze times)
- Coin collection (bonus points)
- Flip tricks (360° rotation bonus)
- Best time saved (localStorage)

### 5. Progression
- Level select map
- Stars unlock next levels
- Vehicle unlock at milestone levels
- localStorage save with version field

### 6. Tutorial
- First 3 levels serve as tutorial
- Visual hints for controls
- Skip button available

### 7. Audio
- Engine sound (pitch varies with speed)
- Crash/explosion sounds
- Coin pickup sound
- Star achievement sound
- Background music (Web Audio procedural)

### 8. Visual Style
- GameZipper dark gradient theme
- Neon accent colors
- Particle effects (dust, sparks, explosions)
- Screen shake on crashes
- Smooth 60fps Canvas rendering

## Key Numerics
- Max speed per vehicle: Jeep=12, Sports=18, Monster=10, Moto=15, Tank=8
- Gravity: 0.5 per frame
- Flip bonus: 500 points per 360°
- Star times: Gold = par × 1.0, Silver = par × 1.5, Bronze = par × 2.0
- Level par times: Level 1 = 15s, increasing ~2s per level
