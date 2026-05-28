# Cover Orange — Competitive Benchmark

## Franchise Overview
- **Developer**: Johnny-K (Anton Koshechkin, Maxim Yurchenko)
- **Total Games**: 10+ (Original, 2, Journey 300+, Space 40, Pirates, Wild West, Gangsters)
- **Combined Plays**: 53K+ votes original, 57K+ Journey on Poki
- **Art Style**: Cute cartoon, vibrant colors, smiley orange character

## Core Mechanics
- Drag-and-drop physics objects (boxes, planks, barrels, wheels) to build shelters
- Protect orange(s) from acid rain cloud
- Physics engine simulates gravity, collisions, stacking
- Rain cloud follows a path, drops acid rain that destroys oranges

## Key Competitors
| Game | Votes | Rating | Core Mechanic |
|------|-------|--------|--------------|
| Cover Orange (original) | 53K | 4.1 | Drag objects to protect from rain |
| Cover Orange: Journey | 57K | 4.0 | 300+ levels, story themes |
| Happy Glass | 553K | 4.4 | Draw lines to fill glass with water |
| Love Balls | 133K | 4.5 | Draw lines to connect two balls |
| Thief Puzzle | 293K | 8.4/10 | Draw shapes to bypass traps |

## Systems to Implement
1. **Physics Engine**: Gravity, collision, stacking (custom 2D physics, no external lib)
2. **Object Placement**: Pre-defined draggable objects per level (boxes, planks, wheels, barrels)
3. **Rain System**: Cloud moves across screen, drops acid rain particles
4. **Win Condition**: Orange survives rain for N seconds after cloud passes
5. **Star Rating**: 3 stars based on time/objects used
6. **Level Progression**: 30 levels, 6 tiers (5 each) with progressive difficulty
7. **Hint System**: Show correct object placement for each level
8. **Tutorial**: First 2-3 levels teach mechanics
9. **Progress Save**: localStorage with level completion + stars
10. **Sound Effects**: Object drop, rain, splash, orange saved, orange destroyed

## Level Design Tiers
- T1 (L1-5): Simple box/plank placement, single orange, slow cloud
- T2 (L6-10): Multiple objects, stacking required, basic timing
- T3 (L11-15): Moving elements, multiple oranges, wheels/barrels
- T4 (L16-20): Complex structures, narrow timing windows
- T5 (L21-25): Multi-object puzzles, trick placements
- T6 (L26-30): Expert puzzles, multiple clouds, advanced physics

## Unique Differentiators vs Competitors
1. Object placement (drag) vs free drawing (Happy Glass)
2. Protection theme (save character) vs fill/connect/smash
3. Physics-based shelter building with gravity/stacking
4. Cute food character (orange) with personality
5. Threat element (acid rain cloud) creates tension

## Art Direction
- Cute cartoon style, bright warm colors
- Orange character with eyes and smile (simple but charming)
- Green background with clouds/sky theme
- Object textures: wooden boxes, metal barrels, wooden planks
- Rain effects: blue droplets, splash particles
