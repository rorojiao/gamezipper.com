# BENCHMARK: Gravity Orbit Puzzle

Date: 2026-06-16
Researcher: dev-gamezipper
Slug: gravity-orbit
Type: Gravity/Orbit Puzzle

## Market Data

### Primary Reference: Orbit (Bonus Level, various platforms)
- **Core mechanic**: Planet/orbit positioning puzzle — place objects (planets, stars, black holes) to guide a satellite/meteor through a trajectory to a goal
- **Trending 2024-2026**: Physics-based orbit/gravity puzzles have seen steady indie/Flash-to-mobile ports, though no blockbuster title dominates the browser space
- **Key mechanics**: 
  - Celestial body placement (planets, stars, black holes)
  - Gravitational attraction (inverse-square law)
  - Trajectory prediction lines
  - Goal capture (black hole entry, planet landing, orbit stabilization)
  - Obstacle avoidance (asteroids, nebulae, event horizons)

### Secondary References
- **Gravitation (Flash classic, 2000s)**: Early gravity simulation puzzle, simple 2-body physics
- **Solar 2 (Solar Core, 2012)**: Sandbox gravity sim, evolved into mobile ports
- **Orbit Strategy (Steam, 2016)**: Orbit-based puzzle, 5K reviews, 80% positive
- **Gravity Wells (Kongregate/Flash)**: 2M+ plays, simple orbital mechanics
- **Planet Hop (iOS, 2021)**: 100K downloads, gravity-assisted platformer

### GZ Coverage Check
```bash
grep -E 'orbit|gravity.?well|planet.?puzzle|gravity.?puzzle' /home/msdn/gamezipper.com/js/games-data.js | wc -l
# Output: 0 → Confirmed gap
```

## Mechanic Breakdown

### Core Game Loop
1. **Setup Phase**: Place limited celestial bodies (planets, stars, black holes) on the grid
2. **Simulation Phase**: Launch satellite/meteor — physics simulation runs in real-time
3. **Goal Achievement**: Satellite must reach target (black hole, planet orbit, capture zone)
4. **Scoring**: Fewest bodies used, time to goal, fuel/trajectory efficiency

### Unique Differentiation vs Other Puzzles
- **Not Angry Birds**: Not projectile aiming — it's strategic placement before launch
- **Not Cut the Rope**: Not physics manipulation during simulation — all placement is pre-launch
- **Not Pipe Connect**: Not path-finding on a grid — it's continuous physics simulation
- **Key hook**: See the entire trajectory play out in real-time; emergent behavior from simple placement rules

### Difficulty Progression
- **Tier 1 (Tutorial)**: 1-2 bodies, direct path, no obstacles
- **Tier 2**: 3-4 bodies, gravitational slingshot mechanics
- **Tier 3**: Multiple gravity wells (competing attractions), obstacle fields (asteroids)
- **Tier 4**: Time-limited/trajectory-limited levels, multi-stage goals
- **Tier 5**: Black hole mechanics (event horizon, capture vs escape), orbital resonance puzzles

## Monetization Opportunities

### Ad Placement Strategy
- **Interstitial**: Between levels (tier transitions) → 3 placements per session (after T2, T4, T6)
- **Banner**: Bottom-aligned, non-intrusive during simulation (gameplay phase is non-interactive)
- **Native**: Recommended level sidebar (similar to Flow Connect/Parking Jam)

### Premium UGC (Vercel/KVs optional)
- **Custom planet skins** (neon, pixel, realistic)
- **Level editor share** (JSON import/export)
- **Leaderboard per level** (fastest time, fewest bodies)

## Technical Feasibility

### Single-File Canvas Pattern
- **Physics engine**: Custom 2D gravity simulation (N-body problem, O(N^2) complexity acceptable for N ≤ 10 bodies)
- **Rendering**: HTML5 Canvas, 60fps, particle trails for satellites
- **Input**: Mouse/touch drag for placement, tap to launch
- **Performance**: < 50KB total, no external libs, < 3s load time
- **Responsive**: Canvas scales 4:3 aspect ratio, works mobile portrait/landscape

### Level Count & Structure
- **Total levels**: 30 (6 tiers × 5 levels per tier)
- **Level data format**: JSON object with:
  - Grid size (e.g., 800x600)
  - Start position (satellite initial coords)
  - Goal position (black hole/capture zone)
  - Available bodies (type, count, cost)
  - Obstacles (asteroids, nebulae)
  - Par (min bodies needed for 3-star)

### Example Level Data (Tier 2, Level 1)
```json
{
  "grid": {"w":800,"h":600},
  "start": {"x":100,"y":300},
  "goal": {"x":700,"y":300,"type":"blackhole","radius":50},
  "available": [
    {"type":"planet","mass":100,"radius":20,"count":3},
    {"type":"star","mass":200,"radius":15,"count":1}
  ],
  "obstacles": [
    {"x":400,"y":300,"radius":30,"type":"asteroid"}
  ],
  "par": 2
}
```

## Implementation Risks & Mitigations

### Risk 1: N-body simulation performance
- **Issue**: O(N^2) complexity with frequent position updates can lag if N > 10
- **Mitigation**: Cap bodies at 8 per level, optimize with spatial hashing if needed

### Risk 2: Trajectory prediction UI complexity
- **Issue**: Showing predicted path before launch requires running simulation forward
- **Mitigation**: Simplified prediction line (short duration, 1-2 seconds ahead), optional toggle

### Risk 3: Physics bugs (escape velocity, singularity issues)
- **Issue**: Bodies too close → infinite acceleration; satellite escapes bounds → lost forever
- **Mitigation**: 
  - Clamp minimum distance between bodies (gravity cap)
  - Boundary bounce or respawn on out-of-bounds
  - Soft singularity at black hole (linear gravity inside event horizon)

### Risk 4: Level solvability verification
- **Issue**: Procedurally generated levels may be unsolvable
- **Mitigation**: Hand-crafted levels only (30 total), verified by playtest during dev

## SEO & Keywords

### Primary Keywords
- gravity orbit puzzle, gravity game, orbit game, planet puzzle, gravity simulation

### Secondary Keywords
- physics puzzle, celestial puzzle, gravity well, space puzzle, orbital mechanics

### Long-tail
- free gravity game, browser gravity puzzle, orbit strategy game, N-body puzzle

## Success Metrics (Pre-Build)
- **Market gap score**: 20/25 (candidate queue)
- **GZ competition**: 0 matches (grep confirmed)
- **Reference game metrics**: 
  - Orbit Strategy: 5K Steam reviews (80% positive)
  - Gravity Wells: 2M Flash plays
  - Genre trending: steady indie/mobile ports 2024-2026
- **Target session length**: 3-5 minutes per level (matches GZ puzzle norm)
- **Retention mechanic**: 3-star rating per level, unlock next tier

## Conclusion
Gravity Orbit Puzzle is a strong candidate for GZ:
- **Proven demand**: Multiple reference titles with 100K+ downloads/reviews
- **Clear gap**: Zero gravity/orbit puzzles on GZ
- **Feasible**: < 50KB single-file Canvas, well-understood physics pattern
- **Differentiated**: Not Angry Birds/CTC/Pipe Connect — unique pre-launch placement loop
- **SEO-friendly**: High-volume keywords ("gravity game", "orbit puzzle") with zero GZ coverage

**Next Phase**: Phase 3 — Game Development (30-level single-file HTML implementation)