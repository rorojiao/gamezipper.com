# Pentopia — Benchmark & Rules

## Source
- **GMPuzzles**: Grandmaster Puzzles (gmpuzzles.com), Object Placement category.
- **Authors**: Prasanna Seshadri, Takeya Saikachi, Bryce Herdt.
- **Category page**: https://www.gmpuzzles.com/blog/category/objectplacement/pentopia/ (29 posts)

## Standard Pentopia Rules

Place some of the given pentominoes in the grid so that:
1. **No two pentominoes are in adjacent cells** that share an edge OR a corner (diagonal adjacency forbidden).
2. **Pentominoes cannot repeat** in the grid — each of the 12 pentomino shapes (F, I, L, N, P, T, U, V, W, X, Y, Z) can be used at most once. Rotations and reflections of a pentomino are considered the same shape.
3. **Arrow clues** indicate all the directions (up, down, left, and right) where the nearest pentominoes are located when looking from that square.
4. **Arrow clue cells cannot contain pentomino shapes** — clues are placed in empty cells.

## Core Mechanics Summary
- Object placement puzzle (place pentomino shapes)
- Arrow clues = directional visibility to nearest placed shape
- No edge/corner contact between shapes
- Shape uniqueness (max 1 of each pentomino type)
- Deductive constraint propagation

## Game Adaptation
- Grid-based: cells are either empty, arrow-clue, or part of a placed pentomino
- Each pentomino occupies exactly 5 connected cells
- The "given pentominoes" subset constrains which shapes are available
- Win condition: all placed shapes match the solution

## Level Design
- 30 levels across 5 tiers (Beginner → Expert)
- Beginner: 6×6 with 2 shapes, generous clues
- Expert: 10×10 with 4-5 shapes, sparse clues
- Solution-first generation: place shapes first, derive arrow clues, verify uniqueness
