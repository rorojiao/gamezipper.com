# Canal Lock — Competitive Benchmark

## Selected Game: `canal-lock` (Canal Lock — Water Level Boat Passage Puzzle)

## Differentiation vs existing water/flow/route games

| Existing | Mechanic | Canal Lock Difference |
|----------|----------|------------------------|
| valve-network (#485) | Toggle binary valves on a pipe graph; colored fluids BFS-propagate | NO color mixing — single water body; goal is to EQUALIZE water LEVELS to open gates and float a boat through chambers |
| color-sort / sushi-stack | Pour/stack colored units between tubes | Linear chambers with elevation gates, not free pour |
| burn-the-rope / cut-the-rope / rope-rescue | Cut/drag ropes | No ropes — physical lock gate mechanics |
| bridge-builder / draw-bridge | Build/cut bridges | Waterway locks, elevation = water height |
| pipe-connect (many) | Rotate pipe tiles | Gates are binary open/close; the state is the WATER LEVEL equalization, not tile rotation |
| chain-reaction / domino-chain | Sequence triggers | Player-driven gate toggling with reasoning |

## Zero-gap verification (re-confirmed Round 5)
- grep `canal` = 0 across 485 games ✅
- grep `aqueduct` = 0 ✅
- grep `lock-chamber` = 0 ✅
- grep `floodgate` = 0 ✅
- grep `spillway` = 0 ✅
- grep `sluice-gate` = 0 ✅

Note: `lock` substring DOES appear (wood-block-puzzle, unblock-me, hex-block, etc.) but all are BLOCK-unblock mechanic — **none are water lock chambers**. Naming "canal-lock" makes intent clear.

## Core Mechanic Design
- **Linear canal** with N chambers separated by N-1 gates
- Each chamber has a `water level` ∈ {0,1,2,3} (low/mid/high/full) — discrete for clarity
- Gates between chambers only OPEN when both sides have EQUAL level (otherwise pressure blocks them)
- Top inlets: water sources pour into a chamber at fixed rate (raise its level)
- Bottom outlets: drains lower a chamber's level
- **Player actions:** open/close inlet valves (top) and outlet valves (bottom) per chamber. When a gate is "free" (levels equal on both sides), tap it to lift → chambers merge into a single water body; subsequent level changes apply to the merged region
- **Boat goal:** a boat at the START must reach the END. Boat can only move through a chamber if its water level ≥ the boat's required float depth; boat traverses a gate only when gate is lifted
- **Win condition:** boat reaches end; no chamber overflow (water at level 3 must not be at a chamber with no drain safety)

## Tiers (difficulty scaling)
1. **Tier 1 — Single Lock:** 1-2 chambers, basic equalization
2. **Tier 2 — Twin Locks:** 3-4 chambers, sequence
3. **Tier 3 — Sidelocks:** side branches with Y-junctions
4. **Tier 4 — Floodgates:** automatic overflow drains that force planning
5. **Tier 5 — Cargo Weight:** boat draft varies (heavier = needs higher water level)
6. **Tier 6 — Multiboat:** multiple boats with different start/end positions

## Scoring
- ⭐⭐⭐ = solve at par move count
- ⭐⭐ = par+2
- ⭐ = any valid solve
