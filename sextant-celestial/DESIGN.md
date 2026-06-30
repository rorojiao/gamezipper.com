# Sextant Celestial — Vernier Angle Calibration Puzzle

## Concept

A **sextant** is a navigational instrument that measures the angle between two
celestial objects (or a celestial body and the horizon) using double reflection
through an **index mirror** and a **horizon glass**. A **vernier scale** allows
sub-degree readings.

The player operates a sextant with **three calibration dials** (Index, Vernier,
Filter). Each dial rotates a different arc by a fixed angular increment measured
in `N` vernier divisions. Goal: bring all three arc markers (Sun altitude, Star
altitude, Horizon reference) onto the **same radial line** — i.e. a clean
celestial alignment.

## Mechanic (Modular Arithmetic — Z_N^3 dial matching)

State: `(i, v, h)` ∈ Z_N³ — Index, Vernier, Horizon arc positions.
Dial `k` applies a fixed triple `(Δi_k, Δv_k, Δh_k)` mod N.
Player taps dials; state evolves by adding chosen triple mod N.
Win: `i == v == h` (all three arcs co-aligned).

Because addition is commutative, the **multiset** of dial presses fully
determines the final state. Solutions are order-independent, so we can verify
uniqueness by enumerating bounded multisets.

## Differentiation (vs prior games)

| Prior game | Mechanic axis |
|------------|---------------|
| Orrery Planetary Gear (#504) | epicyclic tooth-ratio **gear** coupling |
| Gyroscope Precession (#505) | angular-momentum **torque** precession |
| Fulcrum Balance (#506) | lever **torque** equilibrium |
| **Sextant Celestial (NEW)** | **vernier** angle calibration — celestial arc co-alignment |

grep zero-gap: sextant, astrolabe, vernier, armillary, celestial-navigation — all = 0.

## Tiers (30 levels, 6 tiers)

| Tier | N | Dials | Max presses |
|------|---|-------|-------------|
| T1   | 6 | 2     | 6           |
| T2   | 8 | 2     | 6           |
| T3   | 8 | 3     | 7           |
| T4   | 10| 3     | 8           |
| T5   | 12| 4     | 9           |
| T6   | 12| 5     | 10          |

## Verification

3-method: (a) Python counting-DP multisets, (b) independent Node BFS,
(c) in-engine Node BFS using exact game rules. All 30/30 UNIQUE + VALID.
