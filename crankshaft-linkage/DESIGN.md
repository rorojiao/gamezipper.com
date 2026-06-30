# Crankshaft Linkage — Slider-Crank Mechanism Puzzle

## Core Mechanic
Rotate discrete crank positions to drive connecting rods that push/pull sliders along linear tracks. Align all sliders to target markers.

## Differentiation (vs existing 494 games)
- **NOT camshaft-timing** (cam-lobe phase alignment at target angle) — this is slider-crank **kinematic position** matching
- **NOT gear-rotation** (torque transfer) — this is pure linkage geometry
- **NOT ratchet-escapement** (one-way gating) — cranks rotate freely both directions
- **NOT balance-scale** (torque equilibrium) — this is position alignment via kinematic chain
- **NOT pulley-lift** (binary rope) — continuous kinematic coupling via rigid rods

## Puzzle Mechanics
- N cranks (1→6), each with M discrete angular positions (6→12)
- Each crank drives a slider via a connecting rod (fixed length L)
- Slider position = crank_center_x + crank_radius * cos(angle)
- Target: all sliders aligned to their respective target markers simultaneously
- Unique-solution constraint: target markers chosen so exactly ONE crank-angle combination satisfies all

## Level Tiers (30 levels)
| Tier | Cranks | Positions | Extra |
|------|--------|-----------|-------|
| 1-5  | 2      | 6         | — |
| 6-10 | 3      | 8         | — |
| 11-15| 4      | 8         | — |
| 16-20| 5      | 10        | shared track conflict |
| 21-25| 6      | 10        | shared track conflict |
| 26-30| 6      | 12        | shared track + offset rods |

## Unique Solution Guarantee
For each level, brute-force all crank-angle combos; pick target set where exactly 1 combo solves. Verified by 3-method BFS.
