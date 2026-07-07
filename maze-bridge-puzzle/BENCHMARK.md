# Maze Bridge Puzzle — Competitive Benchmark

## Concept
Grid-based maze with gaps (pits/water). Player places limited bridge planks
across gaps to create a path from START to GOAL. Bridges are directional
orientation matters (horizontal gap needs horizontal plank).

## Differentiation from existing GameZipper games
| Existing | Mechanic | Gap |
|----------|----------|-----|
| Bridge Builder (#328) | Physics cantilever construction | No maze/grid logic |
| Draw Bridge (#412) | Draw a line, physics | No discrete bridge placement |
| Maze Runner (#219) | Pure navigation, no bridge mechanic | No bridges |
| Maze Paint (#445) | Paint trail through maze | No bridges |
| Laser Maze (#501) | Mirror light beams | Different mechanic |
| Path Finder (#488) | Find shortest path, no placement | No bridges |

**Verdict**: maze-bridge-puzzle fills the true gap — a logic puzzle where
the player *places* bridge segments (orientation-constrained) over gaps
to connect a fragmented maze. Combines maze navigation + bridge placement
into a fresh single mechanic.

## Competitor analysis (mobile/web market)
- **Maze Ball Puzzle 3D** (mobile, popular): ball-rolling labyrinth, no bridges.
- **Maze Valley Color Paint** (mobile): paint-fill maze, no bridges.
- **Bridge Constructor** (AAA mobile): physics bridges, not grid logic.
- None combine grid-maze + bridge-plank placement as a pure logic puzzle.

## Unique Selling Points
1. Bridge orientation constraint (horizontal plank won't fit vertical gap)
2. Limited plank budget per level (resource management)
3. Bridges are permanent once placed (commitment puzzle)
4. 5-tier difficulty: 5×5 → 9×9 grids, 1-4 gaps, multi-path decoys
5. Undo system, hints, 3-star rating

## Target keywords (SEO)
maze bridge puzzle, bridge maze game, plank puzzle, gap maze, bridge
placement puzzle, grid bridge game, logic maze, brain maze, free maze
puzzle, html5 maze game, browser puzzle, no download.

## Quality bar
- 30 handcrafted/verified levels
- Full Web Audio API BGM + SFX
- Mobile-first responsive canvas
- VideoGame + HowTo + FAQPage + BreadcrumbList schemas
