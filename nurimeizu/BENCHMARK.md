# Nurimeizu Benchmark

## Source
- Nikoli official: https://www.nikoli.co.jp/en/puzzles/nurimeizu/
- Published: 2021-09-22
- Type: Nikoli maze-shading logic puzzle

## Rules (Official from nikoli.co.jp)
1. **Rooms**: The areas enclosed by bold lines are called "Rooms". All cells in a Room must be painted black or left white — entire room is one color.
2. **S→G Path**: Create a maze from S (start) to G (goal) across only white cells.
3. **White connectivity**: White cells cannot be entirely cut off — all white cells form one connected group.
4. **No loops**: White cells must not form a loop (the white-cell graph is a tree — no cycles).
5. **Protected rooms**: Rooms containing S, G, ○ (circle), or △ (triangle) cannot be painted.
6. **Circle constraint**: All ○ cells are on the shortest path from S to G through white cells.
7. **Triangle constraint**: No △ cells are on the shortest path from S to G.
8. **No 2×2**: Black and white cells cannot cover 2×2 or larger monochromatic squares.

## Mechanic Summary
Paint rooms black (walls) or white (paths) to create a maze. The shortest path through the maze from S to G must pass through every circle and avoid every triangle. White cells form a connected tree with no cycles, and no 2×2 monochromatic block exists.

## Catalog Gap
- `nurimeizu`, `nuru-meizu`, `nuru meizu` — all 0 occurrences (grep verified)

## Difficulty
- Complex: tree constraint + shortest path + room shading
- Implementable as browser Canvas game
- 30 levels across 5 tiers: 5×5 Beginner → 9×9 Expert
