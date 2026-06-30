# Camshaft Timing — Design

## Core Mechanic (differentiated)
N cams arranged in a row, each with a single lobe pointing at one of P discrete phase
positions (0..P-1). A global "crank angle" sweeps 0..P-1 repeatedly (the engine cycle).
At crank angle θ, cam i's valve is OPEN iff its lobe phase φ_i satisfies
(φ_i + offset_i) mod P == θ, where offset_i is the cam's adjustable phase.

Wait — that makes every cam always solvable trivially. Instead, use **constrained** puzzle:

## Final Mechanic: Phase-Locked Camshaft Alignment
- N cams, each has an adjustable phase offset ∈ {0..P-1} (P positions).
- Each cam i has a **fixed lobe pattern** — a binary string of length P (some positions
  have a lobe, some don't). The pattern is fixed; only the phase (rotation) is adjustable.
- A shared **timing belt** connects cams in a chain: rotating cam i by Δ also rotates
  cam i+1, i+2, ... by Δ (timing-belt coupling). UNLESS there's an **idler gear** between
  them (breaks the coupling).
- Goal: find phase assignments so that at the **target crank angle θ\***, ALL N valve
  lobes align (every cam's shifted pattern has a lobe at θ\*).
- Constraint source of uniqueness: lobe patterns differ per cam, and the timing-belt
  coupling means choosing one cam's phase fixes downstream cams. Idlers create independent
  sub-chains. The solution is unique when each sub-chain has exactly one valid alignment.

## Why unique solutions exist
Each sub-chain (separated by idlers) shares a single phase variable. Within a sub-chain,
the phase must satisfy: for each cam, shifted_pattern[θ\*] == 1. Since patterns are
fixed per cam, the phase is constrained to the intersection of "positions where cam has
a lobe at θ\*". If that intersection is a single value → unique. Level generator picks
patterns so the intersection is exactly one value per sub-chain.

## Differentiation from prior games
- **gear-chain**: continuous gear rotation, torque transfer. Ours: discrete phase stops,
  lobe-pattern alignment at a target angle. No torque/rotation animation of meshing.
- **ratchet-escapement**: pawl gates rotation direction (CW allowed, CCW blocked).
  Ours: no directional gating; phase alignment puzzle.
- **prism-path**: light-beam routing via rotation. Ours: no beam, no path — abstract
  phase alignment of valve lobe patterns.
- **electromagnet-field**: magnetic field routing. Ours: mechanical camshafts.
- **circuit-logic**: tile rotation to connect paths. Ours: phase offset of fixed patterns.

## Level Structure (30 levels, 6 tiers)
- T1 (L1-5): 3 cams, P=6 positions, 1 sub-chain (no idlers), single-lobe patterns.
- T2 (L6-10): 4 cams, P=8, 1 sub-chain, multi-lobe patterns.
- T3 (L11-15): 4 cams, P=8, 2 sub-chains (1 idler), single-lobe.
- T4 (L16-20): 5 cams, P=8, 2 sub-chains, multi-lobe.
- T5 (L21-25): 6 cams, P=10, 3 sub-chains, multi-lobe.
- T6 (L26-30): 6 cams, P=12, 3 sub-chains, dense multi-lobe, higher par.
