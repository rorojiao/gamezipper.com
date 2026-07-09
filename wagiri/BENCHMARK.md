# Wagiri — Competitive Benchmark

## Overview

**Wagiri** (割り切り) is a Nikoli-style border-line logic puzzle in which the player draws paths that pair up circular endpoints. The puzzle combines elegance and simplicity with deeply constrained logical deduction.

## Game Rules

1. **Grid**: R×C rectangular grid.
2. **Endpoints (circles)**: Each puzzle has a fixed set of `2N` circular endpoints placed on specific cells. Cells are pre-paired by the puzzle: each circle has exactly one partner, and the player must draw a single non-branching path that connects them.
3. **Path drawing**: Players mark edges (between two orthogonally adjacent cells) to form paths. Each path uses horizontal or vertical edges only — no diagonals.
4. **No branching**: Each cell may be visited by at most one path. No cell may be shared between two paths (except endpoints).
5. **No intersection**: Paths cannot cross or overlap. Edges are exclusive to one path.
6. **No cycles**: Paths are simple (acyclic).
7. **Connect endpoints exactly once**: Each circle must be connected to its designated partner via exactly one path.
8. **All edges used**: Every horizontal/vertical edge used by any path must be part of one of the N connecting paths — paths must be a "perfect matching" of circles into vertex-disjoint paths.

## Variant Used in This Implementation

To make puzzle solving deterministic and unique:
- The puzzle presents `2N` pre-placed circles, each with a numbered label (1, 2, ..., 2N) and a partner number labeled on it.
- Paths must connect circle `i` to circle `i+N` (i.e. circles paired by label).
- All cells not on any path must remain empty.

## Benchmark Sources

### Primary Reference: Nikoli (Japan)
- **Name**: Wagiri (割り切り)
- **Publisher**: Nikoli Publishing Co.
- **Year**: 2018
- **Format**: Border-line logic puzzle family

### Secondary References
- **Puzzle-Wrapper genres**: Border-line puzzles are a major family in Nikoli's catalogue alongside "Satogaeri", "Sashikazari", "Icel" etc.
- **Mechanic cousins**: Hashiwokakero (Bridges) — also pairs of endpoints, but bridges are straight lines, not paths.

## Solving Strategies

1. **Direct lines**: Two circles on same row/column with no obstacles → draw straight line.
2. **Single obstacle**: Two adjacent cells have only one opening → force path direction.
3. **Box principle**: A 2×2 box with 3-circle endpoints forces the 4th edge direction.
4. **Conservation**: Number of cells minus endpoints equals number of path cells. If only one possibility, draw it.
5. **Constraint propagation**: Each circle has 2-4 possible exits; eliminate via intersection with other paths.

## Level Design Patterns

### Beginner (5×5)
- 4 circles (2 pairs)
- Mostly straight lines
- Few turn cells

### Easy (6×6)
- 4-6 circles (2-3 pairs)
- Simple L-shapes
- Some path interactions

### Medium (7×7)
- 6-8 circles (3-4 pairs)
- Multiple turn patterns
- Forced path intersections

### Hard (8×8)
- 8-10 circles (4-5 pairs)
- Complex turn chains
- Path-blocking interactions

### Expert (9×9)
- 10-12 circles (5-6 pairs)
- Highly intertwined
- Multi-step deduction chains

## Implementation Complexity

### Core Systems
1. **Path validator**: check each path is non-self-intersecting and connects exactly two circles
2. **Edge occupancy**: each edge belongs to at most one path; no crossings
3. **Branch detector**: each interior cell visited must have degree 2 (entry + exit)
4. **Pairing checker**: circle `i` connected to circle `i+N`
5. **Level generator**: place circles with unique solution paths
6. **Unique solution solver**: backtracking BFS to enumerate all solutions

### Algorithmic Notes
- Generator: place endpoints, draw a random valid path system, then remove edges to expose the puzzle
- Verification: independent solver confirms exactly 1 solution
- Solver complexity: O((R*C)^N) worst-case but heavily pruned

### File Size Expectations
- Single-file HTML, similar to look-air/canal-view
- ~30-50KB including 30 levels + audio

## Monetization Pattern (matching sister games)
- Banner: bottom (Monetag zone 110120)
- Native: level select (zone 110121)
- Interstitial: post-level (zone 110122)

## Gap Verification
- `wagiri`: 0 occurrences (verified via grep on js/games-data.js)
- `割り切り`: 0 occurrences
- `wagiri puzzle`: 0 occurrences

## Next Steps
- Phase 3: Build single-file HTML5 game
- 30 levels, 5 tiers
- Generator: random placement + backtracking solver to verify uniqueness
- Verification: 3-method (Python BFS + Node independent + in-engine Node)
---
**Benchmark Date**: 2026-07-09
**Researcher**: dev-gamezipper agent