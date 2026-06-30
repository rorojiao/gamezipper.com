# Ratchet Escapement — Competitive Benchmark

## Game: Ratchet Escapement (#488)
**Mechanism**: Mechanical ratchet + pawl + gear teeth sequencing puzzle
**Core loop**: Click pawls to engage/disengage → ratchet gear rotates in constrained directions → align target teeth to goal positions

## grep Zero-Gap Verification (over 487 games, 2026-06-30)
- `ratchet` = 0 ✅
- `escapement` = 0 ✅
- `pawl` = 0 ✅
- `clutch` = 0 ✅
- `brake` = 0 ✅
- `clicker` = 1 (Cookie Clicker — incremental, not mechanical)
- `gear` = 12 (Gear Logic, Gear Chain Logic — rotation puzzles, NOT ratchet-step)
- `cog` = 0 ✅

→ **True zero-gap**: 5+ mechanical-ratchet keywords completely absent. Differentiated from gear-rotation games by discrete step-wise ratcheting (click = advance 1 tooth, pawl blocks reverse).

## Competitive Landscape (Mechanical Puzzle Genre)
| Game | Mechanism | Differentiation from Ratchet Escapement |
|------|-----------|------------------------------------------|
| Gear Logic (#?) | Continuous gear rotation, mesh ratios | We use DISCRETE tooth-steps with pawl locks |
| Gear Chain Logic (#501) | Chain of gears, rotation direction propagation | We use single ratchet wheel + multi-pawl gating |
| Pulley Lift (#487) | Binary pulley engage, counterweight balance | Different domain (lift vs rotation) |
| Canal Lock (#486) | Water level equalization | Different domain (fluid vs mechanical) |
| Valve Network (#485) | Hydraulic valve switching | Different domain (fluid vs mechanical) |

## Unique Mechanic: "Pawl-Gated Ratchet"
1. **Ratchet wheel** with N teeth (6-12), each tooth carries a symbol/color/number
2. **Multiple pawls** (2-6) at different angular positions; each pawl can be UP (allows rotation) or DOWN (blocks rotation past its position)
3. **Click a pawl** to toggle it; **click the wheel** to advance 1 tooth clockwise (only if no engaged pawl blocks)
4. **Goal**: arrange so specific target teeth align to specific marker positions
5. **Constraint**: pawls only block in ONE direction (ratchet principle) — reverse requires disengaging all blockers

This is mechanically distinct from:
- Gear rotation (continuous, mesh-based) — we're discrete + gated
- Combination locks (free rotation) — we're directional + pawl-locked
- Sliding puzzles (linear) — we're circular + mechanical

## Level Design Tiers
- T1 (L1-5): 6 teeth, 2 pawls, single target — learn ratchet principle
- T2 (L6-10): 8 teeth, 3 pawls, single target — multi-pawl coordination
- T3 (L11-15): 8 teeth, 3 pawls, dual target — sequencing
- T4 (L16-20): 10 teeth, 4 pawls, dual target — advance planning
- T5 (L21-25): 10 teeth, 5 pawls, triple target — complex gating
- T6 (L26-30): 12 teeth, 6 pawls, triple target — mastery

## Verdict
**Ship it.** True zero-gap, mechanically novel, visually distinct (mechanical brass/iron aesthetic vs existing 487 games), 30 levels across 6 tiers, single-file Canvas feasible.
