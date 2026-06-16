# Gear Logic — Competitive Benchmark

## Selected Game: Gear Logic Puzzle
**Slug:** gear-logic
**Category:** Puzzle / Brain Teaser
**Tagline:** Connect the Gears, Power the Machine

## Competitive Analysis

### Reference 1: Gears Logic (Mobile, 10M+ downloads)
- **Core mechanic:** Place gears on a grid to connect a spinning motor to a target
- **Levels:** 200+ levels across multiple difficulty packs
- **Gear sizes:** Small (1x1), Medium (2x2), Large (3x3) — different tooth counts
- **Power propagation:** Adjacent gears mesh automatically when placed; rotation direction alternates (CW → CCW → CW)
- **Obstacles:** Fixed blocks that can't hold gears, pre-placed gears that must be worked around
- **Visual style:** Clean 2D with metallic gear textures, smooth rotation animation
- **Monetization:** Hints (limited free, watch ad for more), remove ads
- **Progression:** Stars per level (1-3 based on efficiency/moves), unlock packs

### Reference 2: Clockwork Brain Training
- **Core mechanic:** Gear placement with time pressure
- **Levels:** Procedurally generated + curated hand-made levels
- **Additional mechanics:** Direction requirements (target must spin specific direction), speed requirements
- **Visual style:** Steampunk aesthetic, brass/copper gears
- **Progression:** Brain age score, daily challenges

### Reference 3: Incredible Machine / Contraption Maker
- **Core mechanic:** Rube Goldberg machine building
- **Gears as component:** Gears transfer rotational energy to other mechanisms
- **Inspirational element:** Chain reactions, satisfying mechanical feedback

## Systems to Implement

### Core Systems
1. **Grid Board System** — Variable-size grid (6x6 to 8x8), cells can be: empty, motor, target, obstacle, occupied
2. **Gear Placement System** — Drag/click gears from inventory to grid cells, snap-to-grid
3. **Power Propagation Engine** — BFS/DFS from motor through meshed gears, alternating rotation direction
4. **Rotation Animation** — Smooth gear spinning at meshed-speed, direction-aware (CW/CCW)
5. **Win Condition** — All target gears must be spinning (connected to motor via gear chain)

### Progression Systems
6. **Level System** — 20+ hand-designed levels with increasing difficulty
7. **Star Rating** — 1-3 stars based on gears used vs. optimal
8. **Progress Save** — localStorage with completed levels, star ratings, version field
9. **Level Select Screen** — Grid of levels with lock/unlock, star display

### Polish Systems
10. **Sound System** — Web Audio API: gear click (place), mesh (connect), spin (ambient hum), win (chime), error (buzz)
11. **Particle Effects** — Sparks when gears mesh, confetti on win
12. **Hint System** — Highlight one correct gear placement (limited hints)
13. **Tutorial** — First 3 levels with guided instructions
14. **Settings** — Sound toggle, music toggle, reset progress

## Level Design Difficulty Curve

| Level Range | Board Size | Targets | Obstacles | Inventory | New Mechanic |
|-------------|-----------|---------|-----------|-----------|--------------|
| 1-3 | 5x5 | 1 | 0 | Generous | Tutorial: basic placement |
| 4-6 | 6x6 | 1 | 1-2 | Moderate | Obstacle blocks |
| 7-9 | 6x6 | 2 | 2-3 | Moderate | Multiple targets |
| 10-12 | 7x7 | 2 | 3-4 | Limited | Tighter inventory |
| 13-15 | 7x7 | 3 | 3-5 | Limited | Direction requirements |
| 16-18 | 8x8 | 2-3 | 5-7 | Minimal | Complex routing |
| 19-20 | 8x8 | 3 | 6-8 | Minimal | Master levels |

## Visual Design
- **Background:** Dark gradient (#0a0e27 → #1a1f3a), GameZipper style
- **Gears:** Metallic gradient with teeth detail, glowing edges when powered
- **Motor:** Red/orange glowing gear, always spinning
- **Target:** Green/blue glowing gear, pulses when unpowered, spins when powered
- **Grid:** Subtle grid lines, cells glow on hover
- **UI:** Glass-morphism panels, neon accent colors (cyan/purple)
- **Animations:** Smooth gear rotation, satisfying mesh engagement, particle sparks

## Score Formula
- **Stars:** 3 stars if gears_used ≤ optimal; 2 stars if ≤ optimal+1; 1 star if > optimal+1
- **Total Score:** Sum of (level_index × stars) across all completed levels

## Audio Design
- **BGM:** Ambient electronic, mechanical/industrial feel, slow tempo, soft synthesizer (Web Audio API procedural)
- **SFX:** Gear place (click), mesh (clink), spin (low hum), disconnect (thud), win (ascending chime), error (buzz), button (tap), star (sparkle)
