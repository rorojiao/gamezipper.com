# Hexa Sort — Competitive Benchmark

## Game Overview
Hexa Sort is a casual sorting puzzle where players drag and drop hexagonal pieces onto a hexagonal grid, sorting them by color. When a complete ring of the same color is formed, it clears and scores points. Progressive difficulty with 50 levels across 5 chapters.

## Market Position
- **Hexa Sort by Voodoo**: 10M+ downloads, #1 trending puzzle on App Store 2024-2025
- **Hex FRVR by FRVR**: 50M+ plays on web, hexagonal merge-sort mechanic
- **Hex Sort Puzzle by CrazyLabs**: 5M+ downloads, top casual sorting
- **Color Sort Puzzle (non-hex)**: 100M+ combined downloads across sorting genre

## Core Mechanics Analyzed

### Voodoo Hexa Sort
- Drag hexagonal color pieces from a tray onto hex grid positions
- Stack pieces on matching color cells (max 3-4 stacked)
- When a cell has enough same-color pieces, entire color group clears
- Combo scoring for chain reactions
- Undo power-up (limited uses)
- Extra cell power-up (add temporary space)
- 1000+ levels, color count increases (2→6 colors)

### Hex FRVR
- Hexagonal grid with pre-placed colored pieces
- Match-3 style: connect 3+ adjacent same-color hexes to clear
- Drag to place new pieces from a queue
- Level-based with target scores
- Clean neon visual style

### Key Mechanics to Implement
1. **Hex Grid System**: Flat-top hexagonal grid (axial coordinates)
2. **Piece Stacking**: Drop pieces onto hex cells, stack same-color (max 3)
3. **Clearing**: When 6+ connected same-color pieces form a complete group → clear
4. **Chain Reactions**: Clearing one group can cause adjacent groups to merge and clear
5. **Scoring**: Base points + combo multiplier + chain bonus
6. **Power-ups**: Undo, Extra Space, Color Bomb, Shuffle
7. **Level Goals**: Clear target number of pieces, reach target score, clear within moves

## Difficulty Progression (5 Chapters, 50 Levels)

| Chapter | Levels | Colors | Grid Size | New Mechanic |
|---------|--------|--------|-----------|-------------|
| 1: Basics | 1-10 | 2-3 | Small (3-4 rings) | Tutorial, basic stacking |
| 2: Colors | 11-20 | 3-4 | Medium (4-5 rings) | More colors, limited moves |
| 3: Strategy | 21-30 | 4-5 | Large (5-6 rings) | Obstacles, locked cells |
| 4: Chains | 31-40 | 5-6 | Large+ | Chain reactions required |
| 5: Master | 41-50 | 6-7 | Full | Minimal moves, complex setups |

## Scoring System
- Base clear: 10 points per hex cleared
- Combo: x1.5, x2, x2.5, x3... for consecutive clears
- Chain reaction: +50 bonus per chain link
- Level completion bonus: remaining moves × 20
- Star rating: 1 star = complete, 2 stars = score threshold, 3 stars = high score

## Monetization (IAA Focus)
- Banner ad below game area (Monetag 110120)
- Interstitial ad between chapters (Monetag 110122)
- Native ad in level select (Monetag 110121)
- Rewarded ad for extra power-ups

## Technical Notes
- Hex grid: axial coordinate system (q, r)
- Neighbor lookup: 6 directions for flat-top hexes
- Pathfinding: BFS for connected component detection
- Piece rendering: Canvas hex shapes with gradient fills
- Drag-and-drop: Pointer events with smooth animation
- Performance: requestAnimationFrame, object pooling for pieces

## Visual Style Reference
- Dark neon theme (matching GameZipper dark gradient)
- Glowing hex borders on hover/active
- Particle burst on clear
- Smooth snap animation on drop
- Color palette: vibrant neon colors on dark background
