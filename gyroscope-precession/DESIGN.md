# Gyroscope Precession — Angular Momentum Vector Puzzle

> Round 10 market-research selected game. True zero-gap keywords: gyroscope, precession, gimbal, nutation, gyroscopic, spin-axis, angular-momentum, reaction-wheel (8 keywords at grep=0).

## Differentiation (vs existing catalogue)

| Existing theme | Mechanic | Why Gyroscope Precession differs |
|----------------|----------|----------------------------------|
| Rotate/Spin games | continuous rotation to align | We control PRECESSION RATE (torque magnitude sets how fast the spin-axis sweeps), not direct spin |
| Balance Scale (#433) | static torque balance | We balance angular-momentum VECTOR direction over time, not a static lever |
| Crankshaft Linkage (#495) | discrete crank-angle positions | Continuous precession with vector math; no crank/rod/slider |
| Camshaft Timing (#494) | cam-lobe phase alignment | Phase = rotation offset; here we steer a 3D-ish vector via applied torque |

## Core Mechanic

A spinning gyroscope has a **spin-axis vector** `S` (shown as an arrow on a unit circle projection).
Applying a torque perpendicular to `S` causes **precession**: the spin-axis rotates around the vertical at rate `Ω = τ / (I·ω)`.
The player has N torque dials. Each dial applies a torque in a fixed in-plane direction.
Setting dial `i` to level `k` adds a precession-rate contribution `k · unit(i)` to the total Ω vector.
Goal: choose dial levels so that the **net precession rotates S to point at the target direction** after exactly one precession cycle.

Concretely (simplified to a discrete puzzle):
- The spin-axis lives on a clock with `P` discrete positions (P = 6, 8, or 12).
- Each dial `i` has a **direction** `d_i ∈ {+1,-1}` (clockwise/counter-clockwise on the clock) and the dial's level contributes `±level` steps.
- The net displacement = `Σ_i (sign_i · level_i) mod P`.
- Target: make net displacement == `T` (the target offset), with each dial used at least... no — simpler: each dial picks a level 0..3, the sum mod P must equal T. Unique solution enforced by per-dial step granularity.

This keeps it a clean combinatorial modular-arithmetic puzzle (unique solution) with a rich physics narrative.

## Tiers (30 levels)

| Tier | Dials | Positions P | Notes |
|------|-------|-------------|-------|
| 1 (L1-5)   | 2 | 6  | intro, small |
| 2 (L6-10)  | 3 | 6  | more dials |
| 3 (L11-15) | 3 | 8  | finer clock |
| 4 (L16-20) | 4 | 8  | |
| 5 (L21-25) | 4 | 12 | full clock |
| 6 (L26-30) | 5 | 12 | hardest |

## Win condition
Net displacement ≡ Target (mod P). Each level has exactly one solution in the reachable dial-level space (verified by BFS).
