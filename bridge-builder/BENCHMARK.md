# Bridge Builder — Competitive Benchmark

## Competitors Analyzed

### 1. Poly Bridge (Dry Cactus)
- **Levels**: 100+ across 6 worlds, progressive difficulty
- **Core Mechanics**: Draw bridge with mouse, physics simulation, budget system
- **Materials**: Wood, Steel, Rope, Hydraulic, Spring
- **Scoring**: Stay under budget + bridge survives vehicle crossing = star rating
- **Vehicles**: Cars, trucks, tankers
- **Features**: Undo/redo, hydraulics, split joints, sandbox mode
- **Art Style**: Low-poly 2D side view, clean geometric
- **Music**: Relaxing acoustic guitar loops

### 2. Bridge Builder (CrazyGames/FreePDA)
- **Rating**: 8.9/10 (9,741 votes)
- **Core Mechanics**: Place metal planks to build bridge, limited materials
- **Physics**: Weight simulation, structural integrity
- **Levels**: Progressive difficulty, 3D perspective
- **Features**: Hint system, restart

### 3. Bridge Builder (SilverGames)
- **Rating**: 2.9/10 — basic implementation, room for improvement
- **Core**: Simple 2D bridge building
- **Weaknesses**: Poor physics, limited levels, no progression

## Target Feature Set (S-Grade)

### Core Mechanics
- 2D side-view bridge construction with node-and-beam system
- Tap/click to place nodes, drag between nodes to create beams
- Multiple materials: Wood (cheap, weak), Steel (expensive, strong), Rope (flexible)
- Real-time physics simulation when "test" button pressed
- Vehicle crosses bridge — if it reaches other side = level complete

### Systems to Implement
1. **Level System**: 30 levels across 5 themes (Countryside, Canyon, City, Arctic, Volcano)
2. **Budget System**: Each level has a material budget, star rating based on budget used
3. **Star Rating**: 3 stars = under 60% budget, 2 stars = under 80%, 1 star = completed
4. **Hint System**: Show optimal placement (limited hints)
5. **Undo/Redo**: Full undo/redo of placements
6. **Progress Save**: localStorage with version field
7. **Tutorial**: Interactive 3-step tutorial (place node → connect beam → test)
8. **Sound Effects**: Place, connect, test start, vehicle engine, success, fail, crash
9. **BGM**: Ambient engineering-themed procedural music
10. **Particle Effects**: Stress visualization, debris on collapse, confetti on success

### Level Design Principles
- Early levels: Short gaps, generous budget, single material
- Mid levels: Longer gaps, multiple materials, terrain obstacles
- Late levels: Moving platforms, weak ground, multiple vehicles

### Visual Style
- Dark blueprint-style background with grid
- Neon-colored beams (wood=orange, steel=cyan, rope=yellow)
- Stress visualization: green→yellow→red as load increases
- Clean modern UI, GameZipper dark theme

### Scoring
- Level completion: Base 100 points
- Budget efficiency bonus: Up to 200 points
- Time bonus: Faster = more points
- Total stars: Displayed per level and overall
