# Fill Glass - Competitive Benchmark

## Target Game
Fill Glass: A physics-based puzzle game where the player draws lines/paths to guide water into a glass container.

## Top Competitors

### 1. Happy Glass (Lion Studios)
- **Downloads:** 100M+ on Google Play
- **Core Mechanic:** Draw lines with your finger to guide water physics into a glass. The glass has a "happy face" that smiles when full.
- **Level Count:** 1000+ levels, episodic updates
- **Difficulty:** Progressive - starts simple (straight lines), evolves to complex path routing with obstacles
- **Key Features:**
  - Star rating (1-3 stars based on ink used / time)
  - Physics: water particles, gravity, collision
  - Obstacles: platforms, moving walls, portals
  - Hint system (shows optimal path)
  - Coin rewards for completion
- **Monetization:** Interstitial ads between levels, rewarded video for hints, IAP for no-ads
- **Art Style:** 2D cartoon, bright colors, cute character (glass with face)
- **Music:** Upbeat, cheerful, casual

### 2. Water Sort Puzzle (IEC Mobile)
- **Downloads:** 100M+ on Google Play
- **Core Mechanic:** Tap to sort colored water between tubes - NOT pouring physics, but tube sorting
- **Note:** Different game genre (sorting puzzle vs physics pour). Not direct competitor for "Fill Glass" concept.
- **Key Insight:** The "water" theme is popular, but sorting ≠ pouring

### 3. Pour It! - Water Puzzle (web/mobile)
- **Platform:** Web + Mobile
- **Core Mechanic:** Rotate/tilt platforms to guide water through obstacles to fill a glass
- **Level Count:** 50-100 levels
- **Key Features:**
  - Rotate/tilt mechanic (not draw)
  - Multiple glass targets sometimes
  - Timer + star system
  - Simple 2D physics

### 4. Fill the Glass (various web clones)
- **Platform:** HTML5 browser games (Poki, CrazyGames)
- **Core Mechanic:** Click/drag to open faucets and guide water flow through pipes/channels to fill glasses to a target line
- **Variants:**
  - Pipe rotation puzzle (connect pipes, then release water)
  - Direct pour with obstacles (tap glass to fill, avoid overflow)
  - Draw-to-guide (similar to Happy Glass)

## Design Decisions for GameZipper Fill Glass

### Chosen Mechanic: Draw-to-guide water physics (Happy Glass style)
**Why:**
- Most popular variant (100M+ downloads proves market fit)
- Visual satisfying (water physics looks impressive)
- Canvas-based implementation feasible
- Different from all existing GZ games

### Core Systems (must-have)
1. **Drawing system:** Player draws lines/shapes on canvas with mouse/touch
2. **Water physics:** Particle-based water simulation with gravity
3. **Glass container:** Target glass with fill line indicator
4. **Obstacles:** Platforms, walls, bouncy surfaces, moving elements
5. **Star rating:** 1-3 stars based on ink usage (less ink = more stars)
6. **30 levels across 5 tiers:**
   - Tier 1 (L1-6): Basic direct pour, no obstacles
   - Tier 2 (L7-12): Simple obstacles (platforms, walls)
   - Tier 3 (L13-18): Moving elements, multiple paths
   - Tier 4 (L19-24): Complex routing, bouncy surfaces, portals
   - Tier 5 (L25-30): Expert puzzles, minimal ink, complex obstacle combos
7. **Progression:** Unlock next level on completion, 3-star tracking
8. **Hint system:** Shows optimal drawing path (3 hints max per level)
9. **Undo:** Clear current drawing and retry
10. **Tutorial:** First level teaches drawing mechanic

### Technical Approach
- Canvas 2D rendering
- Particle system for water (100-200 particles per pour)
- Simple collision detection (line-circle for particles vs drawn lines)
- Delta-time based physics simulation
- Touch + mouse pointer events

### Art Direction
- Clean, modern 2D style
- Dark gradient background (GameZipper standard)
- Neon/bright water color (cyan/blue gradient)
- Glass rendered with subtle transparency
- Particle effects for water splash
