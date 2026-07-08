# Anglers — Competitive Benchmark

## Puzzle Identity
- **Anglers** (釣り針, Tsuribari) is a Nikoli-style path-drawing logic puzzle.
- Mechanic: Numbered anglers sit on the grid border. Fish are placed inside the grid. Draw paths from each angler to fish. Paths move orthogonally, never cross, never share cells. Each angler's number = how many fish they catch.

## Rules (canonical)
1. Anglers (numbered) are on the border.
2. Fish are inside the grid.
3. Draw an orthogonal path from each angler into the grid.
4. Paths cannot cross or share cells.
5. Each angler catches exactly the number of fish shown on their number.
6. Every fish is caught by exactly one angler.

## Competitor Analysis
| Source | Status | Notes |
|--------|--------|-------|
| Nikoli magazine | ✅ exists | Original Japanese print puzzle |
| Simon Tatham | ❌ | Has "Tracks" and "Galaxies" but not Anglers |
| Web (general) | sparse | Few free interactive Anglers implementations |
| Puzzle Baron | ❌ | No Anglers |

## Catalog Gap (GameZipper)
- `anglers`: **0 occurrences** (grep verified 2026-07-09)
- No sibling implements the "border-to-fish path" mechanic.
- Adjacent puzzles: Numberlink (2), Flow Free (1), Hashi/Bridges (7). None use the "numbered border angler + variable catch count" rule.

## Differentiation Strategy
- **Unique mechanic**: Variable-length paths from numbered border anchors.
- **30 handcrafted levels** across 5 tiers (Beginner→Expert).
- **S-grade systems**: hints, undo, restart, 3-star ratings, level select, keyboard, Web Audio, localStorage.
- **3-method verification**: Python BFS + Node BFS + engine playtest.

## Scoring: 23/25
- Mechanic novelty: 9/10 (first border-anchor path puzzle in catalog)
- Implementation quality: 9/10 (full S-grade systems)
- Market timing: 5/5 (zero-gap confirmed)
