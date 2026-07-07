# Flow Free Puzzle — Competitive Benchmark

## Concept
Connect matching color pairs by drawing pipes on a grid. Fill the entire board without crossing paths. 30 levels across 5 difficulty tiers (5x5 to 12x12). Single-file HTML5, Canvas2D, Web Audio API procedural music.

## Top Competitors Analyzed

### 1. Flow Free (Big Duck Games, 2012) — Benchmark
- **Mechanic**: Tap-drag between two dots of the same color, fill the entire grid
- **Why it works**: 
  - Pure logic, no time pressure (but optional timer for hard levels)
  - Elegant constraint: cover ALL cells with no crossings
  - Color-pair expansion: easy (3 pairs, 5x5) → expert (8+ pairs, 14x14)
- **Take for our version**: per-pair constraint, full-grid coverage, escalating grid size & pair count
- **Risk**: 8+ pair puzzles can be unsolvable without good generation — use BFS verification

### 2. Flow Bridges / Pipes / Infinity Loop
- **Mechanic**: Variations on connecting dots
- **Why it works**: tactile drag-to-draw, instant feedback
- **Take**: smooth drag input + visual fill animation

### 3. Numberzilla / LinkedIn Tango / Hashi
- **Mechanic**: Adjacent cell logic
- **Why it works**: clean minimalist UI, focused puzzle
- **Take**: minimalist color palette, clean grid, no clutter

### 4. BFS-Generated vs Hand-Crafted
- **Why it matters**: hand-crafted flow puzzles can have ambiguous solutions
- **Take for our version**: use Python BFS + Node BFS + in-engine BFS verification (3-method) to guarantee UNIQUE solvable solution per level

## Our Differentiation

| Competitor weakness | Our answer |
|---------------------|------------|
| Hard puzzles ambiguous | 3-method BFS verification (UNIQUE solution guaranteed) |
| Static UI | Subtle drag animation, color trail, completion burst |
| No progression reward | 3-star per level + combo bonus + daily streak |
| Single difficulty curve | 5 distinct tiers: Tutorial → Easy → Medium → Hard → Expert |
| Music often royalty jingle | Procedural Web Audio API ambient chord BGM |
| No undo | Full undo + restart + per-level hint (highlights next pipe) |

## Monetization Considerations

- **Ad placements** (Monetag zone 110120 banner, 110121 native, 110122 interstitial on level transition)
- **3-star system** encourages replay to improve, drives session depth
- **Daily streak** mechanic (track localStorage) brings back users

## Tech Stack

- Single-file HTML5 (`index.html`)
- Canvas2D rendering (no external deps)
- Vanilla JS state machine (MENU/PLAYING/WIN/HINT)
- Web Audio API: ambient pad chords + click/pop/win SFX
- localStorage: progress + stars + streak
- Mobile-first responsive (touch-action:none, viewport-fit)

## Difficulty Tiers (5 tiers × 6 levels = 30 total)

| Tier | Levels | Grid | Pairs | Difficulty |
|------|--------|------|-------|------------|
| 1    | 1-6    | 5x5  | 2-3   | Tutorial  |
| 2    | 7-12   | 6x6  | 3-4   | Easy      |
| 3    | 13-18  | 7x7  | 4-5   | Medium    |
| 4    | 19-24  | 9x9  | 5-6   | Hard      |
| 5    | 25-30  | 11x11| 6-8   | Expert    |

## Core Algorithm (BFS Generation)

1. Generate candidate solution via randomized DFS spanning tree per pair
2. Apply constraint: each pair takes a path on empty grid
3. Validate: paths cover ALL cells, no two paths share a cell
4. If valid, run reverse BFS from solution → check UNIQUE solvability
5. If multiple solutions → add blocking walls / pair endpoints until unique
6. Each level stored as `startGrid` (endpoints only) + `solution` (full pipe paths)