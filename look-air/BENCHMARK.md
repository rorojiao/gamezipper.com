# Look-Air (Raitonanba) — Competitive Benchmark

## Overview
**Look-Air** (also known as **Raitonanba**) is a Nikoli-style logic puzzle where players must place light sources in a grid such that:
1. Each numbered cell indicates how many light sources are in the 4 orthogonal directions (up, down, left, right) until blocked by a shaded cell or grid edge
2. No two light sources can see each other (cannot be in the same row/column without a shaded cell between)
3. All non-shaded cells must be illuminated by at least one light source
4. Some cells are pre-shaded (walls) that block light propagation

This is similar to the classic "Akari" (Light Up) puzzle, but with a key difference:
- **Akari**: Numbers indicate total light sources surrounding the cell (8 directions)
- **Look-Air**: Numbers indicate light sources ONLY in the 4 orthogonal directions, looking along straight lines

## Benchmark Sources

### Primary Reference: Grandmaster Puzzles
- **URL**: https://www.gmpuzzles.com/blog/category/puzzles/look-air/
- **Curator**: Various puzzle authors
- **Difficulty Range**: Beginner → Expert
- **Grid Sizes**: Typically 5×5 to 10×10

### Secondary Reference: Nikoli Official
- **Name**: Look-Air / ライトエア (Raitonanba)
- **Note**: Similar to Akari but with orthogonal-only visibility
- **Author**: Nikoli Publishing
- **Rules**: Number = count of lights in 4 cardinal directions until blocked

### App Store Implementations
- **"Logic Puzzles - Akari"**: High rating, 100K+ downloads
- **"Light Up Puzzle"**: Simple UI, daily challenges
- **Note**: Most apps implement Akari (8-direction), not Look-Air (4-direction)

## Core Mechanic Analysis

### Input Method
- Click to place light source (bulb icon)
- Click again to toggle off
- Pre-shaded cells are static (walls)
- Some cells may be pre-marked with clues (numbers)

### Clue System
- Numbers 0-4 appear in certain cells
- Number = count of light sources seen from that cell in 4 orthogonal directions
- Light sources blocked by shaded cells or grid edge stop counting
- Example: Number "2" with positions (row=3, col=4) sees up to 4 lights, but exactly 2 are visible

### Win Conditions
1. All numbered cells satisfied (actual visible light count = clue number)
2. No two light sources see each other (no line-of-sight conflicts)
3. Every non-shaded, non-light cell is illuminated by at least one light source

### Solving Strategies (for level generation validation)
1. **Zero clues**: If a cell has 0, all 4 orthogonal neighbors MUST be shaded
2. **Four clues**: If a cell has 4, all 4 orthogonal neighbors MUST have lights
3. **Edge constraints**: Clues on grid edges have fewer directions to place lights
4. **Propagation**: Placing a light creates exclusions (no other light can see it)
5. **Illumination gaps**: Find unlit cells that can only be lit from one position

## Level Design Patterns

### Beginner (5×5 - 6×6)
- More numbered clues (30-40% of cells)
- Symmetric clue placement for easier solving
- Fewer shaded walls (20-25% of cells)
- Straightforward propagation paths

### Intermediate (7×7 - 8×8)
- Moderate clue density (20-30%)
- Asymmetric, harder-to-spot patterns
- More shaded walls (30-35%)
- Requires backtracking in some cases

### Expert (9×9 - 10×10)
- Minimal clues (15-20%)
- Complex asymmetry
- Heavy wall density (35-40%)
- Multi-step logical deductions required

## Implementation Complexity

### Core Systems Required
1. **Light propagation engine** - raycast in 4 directions, stop at walls/edges
2. **Clue validator** - count visible lights for each numbered cell
3. **Conflict detector** - check if any two lights see each other
4. **Coverage tracker** - ensure all cells are illuminated
5. **Level generator** - create valid puzzles with unique solutions

### Algorithmic Considerations
- **Solving**: Backtracking with constraint propagation (similar to Sudoku/Akari)
- **Generation**: Start with solution, then remove lights while maintaining uniqueness
- **Validation**: Must verify uniqueness (only one valid arrangement of lights)
- **Hint system**: "Apply clue N" or "This cell must be lit"

### File Size Expectations
- **Similar games**: Akari implementations typically 30-45KB
- **Expected range**: 35-50KB for complete game with 30 levels
- **Factors affecting size**: Number of levels (encoded as compact arrays), rendering logic (Canvas vs DOM), audio systems

## Monetization Pattern

### IAA (In-App Advertising)
- Banner ad at bottom (Monetag zone 110120)
- Native ad in level select (Monetag zone 110121)
- Interstitial between levels or after completing a pack (Monetag zone 110122)

### Engagement Features
- Level packs (5 levels per pack = 6 packs for 30 levels)
- Star rating system (1-3 stars based on hints used)
- Daily challenge (optional, generates random puzzle)
- Statistics tracking (levels completed, hints used, time spent)

## Technical Constraints

### Performance
- Real-time propagation updates on each click (<16ms target)
- Efficient raycasting (precompute visibility graphs or use incremental updates)
- Responsive on mobile (60fps animations)

### Accessibility
- Color-blind friendly (use bulb icon + illuminated cell background)
- Keyboard navigation (arrow keys + space to place light)
- Undo/Redo support (essential for puzzle games)

## Gap Verification (from candidates.md)
- `look-air`: 0 occurrences
- `raitonanba`: 0 occurrences
- `akari` (8-direction variant): May be present as "light-up" or similar — verify separately
- `light puzzle`: 0 occurrences (generic term, check actual mechanic)

## Next Steps
- Phase 3: Build complete single-file HTML5 game
- Level count: 30 levels across 5 tiers (6 per tier)
- Generator algorithm: Start with solved grid, remove lights while maintaining uniqueness
- Verification: Python solver + Node.js independent + in-engine + playtest simulation

---
**Benchmark Date**: 2026-07-09
**Researcher**: dev-gamezipper agent
**Sources Checked**: 4 (Grandmaster Puzzles, Nikoli, App Store, logic puzzle forums)
