# Pulley Lift — Competitive Benchmark

## Target Niche
Mechanical linkage lifting puzzles (binary engage/disengage pulleys + counterweight balance).

## Differentiation from existing GameZipper catalog
- grep `pulley` = 0 across 486 games ✅ (true gap)
- grep `counterweight`/`fulcrum`/`winch`/`hoist` = 0 ✅
- Existing rope/chain/gear games are CUT or ROTATE
- Existing water (canal-lock) is water-level equalization
- Pulley Lift = **binary torque-balance under gravity**: engage/disengage pulley routes to redistribute mechanical advantage, raising target load to goal height without dropping counterweights below their floor.

## Mechanic Skeleton
- N pulleys arranged along a support beam
- 1 load (mass M) + K counterweights (masses m_i) hanging at variable heights
- Each move: flip ONE pulley's engagement state (engaged = rope routes through it)
- After a flip, heights settle deterministically by torque balance: heavy side goes down, light side up
- Win: load height ≥ target (after settle), AND no counterweight dropped below 0 or above ceiling

## Tier Plan (30 levels)
- T1 (5): 1 load + 1 CW, 1 pulley — basic torque intuition
- T2 (5): 1 load + 2 CW, 2 pulleys — choose route
- T3 (5): 1 load + 2 CW, 3 pulleys with gate pulleys
- T4 (5): 2 loads + 2 CW (one load must stay put)
- T5 (5): constraint pulleys that lock together
- T6 (5): 3 loads + 3 CW, grand mechanical puzzle

## Tech
- Canvas 2D
- BFS verifier: state = (engagement bitmask, heights tuple)
- Unique-solution enforced by BFS minimal-path length == declared par
