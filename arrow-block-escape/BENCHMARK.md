# BENCHMARK — Arrow Block Escape (Tap Away 3D / Arrow Cube Escape inspired)

## Selected Game
**Arrow Block Escape** (slug: `/arrow-block-escape/`)
**Genre**: 3D directional-block tap puzzle (Tap Away / Arrow Cube Escape family)
**Tier**: 1 (24/25 score)

## Competitor Benchmarks

### 1. Tap Away 3D (Popcore, 2021+)
- 250M+ combined installs across Popcore series
- Mechanic: 3D cube of blocks; tap blocks to make them fly away in their arrow direction
- Each block has an arrow showing its only direction of movement
- Tap = block flies out (and any chained same-color blocks along the path may also fly)
- Camera: rotate the cube freely with drag
- Move limit per level; star rating by remaining moves
- Haptic feedback + pop animation on each clear
- Power-ups: Hint, Shuffle, Bomb (remove any block)

### 2. Arrow Cube Escape (GOODROID, Inc., 2025-2026)
- 2026 trending per NextBigGames Radar #33
- "Directional block removal with color-sorting mechanics"
- Adds: colored blocks must be sorted to matching boxes/bins
- Overflow risk: if you tap a wrong-direction cube you can fail
- Maze-like intertwined arrow puzzles
- "Healing yet mentally stimulating" — clean modern UI
- Thousands of levels

### 3. Block Out - Tap Away (2026)
- 1000+ levels
- Same core: arrows + tap to slide out
- Free, offline, no time limits
- Train your brain marketing angle

## Core Mechanic Spec (must match all competitors)

### Player Goal
Clear every cube on the board within the move limit.

### Cube Properties
- Position (x, y, z) in 3D grid
- Arrow direction (N, S, E, W — i.e. ±X, +Y, -Y) — points in 1 of 4 horizontal directions
- Color (one of 4-6 colors per level)

### Interaction Rules
1. Tap a visible cube
2. Check the immediate cell in the cube's arrow direction
3. If open (no cube blocking or off-grid) → cube slides out in that direction with animation, then disappears
4. If blocked → tap rejected, optionally a small shake feedback
5. Camera can rotate around the cube (drag or arrow buttons) to see hidden faces
6. Move counter increments only on successful removals
7. Level complete when all cubes cleared
8. Level fails if move limit reached and cubes remain

### Difficulty Progression
- Tier 1 (Levels 1-6): 3×3×3 small grids, 1-2 colors, generous move limits, tutorial
- Tier 2 (Levels 7-12): 4×4×3 grids, 3 colors, arrow direction blocked from some angles
- Tier 3 (Levels 13-18): 4×4×4 grids, 4 colors, cubes on multiple Z layers
- Tier 4 (Levels 19-24): 5×5×4 grids, 4-5 colors, intertwined arrow paths
- Tier 5 (Levels 25-30): 5×5×5 grids, 5-6 colors, color-sort bonus objectives, tight move limits

## Systems Checklist (S-grade parity)

- [x] **Score system**: per-cube points + clear bonus + move-saved bonus; running total + best per level
- [x] **Star rating**: 3 stars (≤70% moves used), 2 stars (≤90%), 1 star (≤100%), 0 if fail
- [x] **Levels**: 30 handcrafted levels with progressive difficulty
- [x] **Level select**: grid with lock/unlock (must clear previous), star display
- [x] **Power-ups**: Hint (highlight a valid tappable cube), Bomb (remove any one cube), Shuffle (rotate all arrows randomly — limited use)
- [x] **Progress save**: localStorage v1 key `abe_save` → { unlockedLevel, stars:{}, bestMoves:{}, muted, powerups }
- [x] **Tutorial**: first-time overlay on Level 1 (tap to slide, rotate to see other faces)
- [x] **Sound**: Web Audio procedural — tap, slide, clear, complete, fail, hint, level-up, victory, button
- [x] **BGM**: procedural ambient loop (OscillatorNode + filter sweep)
- [x] **Visual feedback**: cube exit particles, screen-shake on combo clears, level-complete celebration
- [x] **Camera rotation**: smooth drag-rotate + arrow-key rotate buttons
- [x] **Mobile support**: touch-action:none, large tap targets (min 44px cubes), responsive layout
- [x] **Settings**: mute toggle, restart, level select
- [x] **Cleanup**: single entry point cancels rAF, audio nodes, listeners

## Visual Style
- Dark gradient background (#0a0a1a → #1a1a3a)
- Neon accent cube colors (cyan, magenta, lime, orange, purple, gold)
- Soft drop shadows + glow
- Rounded cube corners (isometric rendering with simple shading)
- Orbitron + Inter fonts
- Glass-morphism UI panels

## Anti-bug Standards
- All levels validated (each level has a guaranteed solvable clearing order)
- Save state migration via version field
- Duplicate-tap prevention (block input during slide animation)
- No memory leaks (track rAF id, audio node refs, listener refs)

## SEO
- Slug: `/arrow-block-escape/`
- Title: "Play Arrow Block Escape Online Free - 3D Tap Puzzle | GameZipper"
- Tags: puzzle, 3d, tap away, arrow, cube, block, brain, logic
- JSON-LD: VideoGame + FAQPage + BreadcrumbList
- Canonical: https://gamezipper.com/arrow-block-escape/
