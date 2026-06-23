# Creek — Competitor Benchmark

## Game Type
Creek (also "Kuriku") — Nikoli-style grid shading logic puzzle.

## Rules (confirmed via janko.at)
1. Blacken some cells of a W×H grid.
2. **Clues sit at lattice intersection points** (corners shared by up to 4 cells).
3. A circled number at a node = count of BLACK cells among the (up to 4) cells touching that node.
4. All WHITE (non-black) cells must form a single orthogonally-connected region.

## Competitors Benchmarked
| Source | Level count | Systems | Art/Music |
|--------|-------------|---------|-----------|
| janko.at | 100s of puzzles | interactive solver, check, undo | minimal (functional) |
| Simon Tatham's Puzzle Collection | unlimited generated | full solver, hints, redo, timer | clean minimal |
| puzzle-loop / puzzle sites | varies | timer, check, print | varied |
| Puzzle Team app | progressive | hints, timer, stats | modern flat |

## Systems to Implement (full feature parity)
- [x] Level select: 6 tiers (Beginner→Master), 27 hand-verified unique levels
- [x] Tier-gated progression (unlock next tier after completing prior)
- [x] Star rating per level (by time/moves)
- [x] Timer (per-level best time saved)
- [x] Hint (reveal one correct cell)
- [x] Check / validate (highlight errors)
- [x] Undo (full move history)
- [x] Erase single cell / Reset level
- [x] Tutorial overlay (first play, skippable)
- [x] Procedural BGM + SFX (Web Audio API)
- [x] Mute toggle (persisted)
- [x] Progress save (localStorage, versioned)
- [x] Win animation (particles + celebration)
- [x] Mobile touch (tap to cycle empty→black→white)

## Interaction Model
- Click/tap a cell to cycle: empty → black → white → empty.
- Clue nodes at intersections highlight green when satisfied, red when over.
- Auto-detect win when all clues satisfied + all cells filled + white connected.

## Visual Style
- Dark gradient background (indigo→violet), neon cyan/gold accents.
- Circled clue numbers in gold; satisfied clues dim to green.
- Black cells = dark filled; white cells = subtle light; empty = mid-gray.
- Smooth cell transitions, win particle burst.
