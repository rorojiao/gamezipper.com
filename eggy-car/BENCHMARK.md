# Eggy Car — Competitive Benchmark

## Selected Game: Eggy Car
- **Slug**: `eggy-car`
- **Category**: Physics Driving / Casual Puzzle
- **Score**: 23/25 (Market:5, SEO:5, Retention:4, Feasibility:4, Zero:5)

## Competitor Analysis

### 1. Eggy Car (Coolmath Games #4, 2026)
- **Core Mechanic**: Drive a car over hilly terrain carrying a fragile egg. Physics-based balance challenge.
- **Controls**: Arrow keys / A-D for accelerate/brake. Touch on mobile.
- **Goal**: Travel as far as possible without the egg falling off the car.
- **Features**:
  - Procedurally generated terrain with hills, ramps, valleys
  - Coin collection along the route
  - Multiple vehicle unlockables (purchased with coins)
  - Distance-based scoring
  - Physics simulation: egg rolls and bounces based on car angle/speed
  - Progressive difficulty: terrain gets steeper/more complex
- **Art Style**: Simple 2D cartoon, colorful hills, sky gradient background
- **Monetization**: Coins → vehicle upgrades

### 2. Hill Climb Racing (100M+ downloads)
- **Core Mechanic**: Side-scrolling physics driving with fuel management
- **Features**:
  - Multiple vehicles (jeep, truck, bike, etc.)
  - Fuel system (must collect gas cans)
  - Multiple environments/maps
  - Vehicle upgrades (engine, suspension, tires, 4WD)
  - Coin collection
  - Flip bonus (360° air flips)
- **Key Systems**: Economy, upgrades, maps, physics engine

### 3. Jelly Truck (Browser)
- **Core Mechanic**: Drive a jelly truck over obstacles
- **Features**: Soft body physics, colorful environments, simple controls

## Systems to Implement (对标)

| System | Eggy Car Original | Our Implementation |
|--------|-------------------|-------------------|
| **Physics Engine** | Car suspension + egg rolling | Canvas physics: car body, wheels, egg on top with gravity/friction |
| **Terrain** | Procedural hills | Procedural terrain generation with sine wave composition |
| **Scoring** | Distance-based | Distance + coins + style (air time, near-misses) |
| **Vehicles** | 5+ unlockable cars | 5+ car types with different physics (speed, stability, egg grip) |
| **Coins** | Scattered on route | Coins + gem pickups for bonus points |
| **Progression** | Coins → new vehicles | Coins → vehicles + egg skins |
| **Best Score** | localStorage | localStorage with version field |
| **Tutorial** | Implicit | Interactive tutorial showing controls |
| **Sound** | Basic SFX | Web Audio procedural: engine hum, coin ding, egg wobble, crash |
| **Difficulty** | Progressive terrain | 5 difficulty tiers, each with harder terrain curves |
| **Power-ups** | None | Shield (egg protection), Magnet (coin attract), Boost (speed burst) |

## Level Design (Distance-Based Stages)
- **Stage 1 (0-500m)**: Gentle rolling hills, few obstacles
- **Stage 2 (500-1500m)**: Steeper hills, some gaps, more coins
- **Stage 3 (1500-3000m)**: Sharp peaks, narrow bridges, wind
- **Stage 4 (3000-5000m)**: Extreme terrain, moving platforms
- **Stage 5 (5000m+)**: Endless nightmare mode

## Visual Style Reference
- Colorful 2D cartoon aesthetic
- Gradient sky (sunset colors)
- Green rolling hills
- Cute egg character with expressive face
- Clean UI with distance meter, coin counter
- Particle effects for coin collection, egg crack
- Screen shake on near-falls

## Audio Style
- Cheerful background music (moderate tempo)
- Engine sound (procedural oscillator)
- Coin collection ding
- Egg wobble comedy sound
- Crash/explosion on egg fall
- Achievement jingle for new best distance
