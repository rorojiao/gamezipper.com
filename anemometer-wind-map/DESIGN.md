# Anemometer Wind Map — Cup Anemometer Wind Coupling Puzzle

## Mechanic (Differentiation Analysis)

This game introduces **WIND COUPLING** — a tri-diagonal coupled system:

- Grid of cup anemometers, each pointing at one of 8 directions (0–7 = N, NE, E, SE, S, SW, W, NW)
- Each anemometer i has a **setting angle** `s_i` (player-controlled)
- Wind blows from north (external) with magnitude 1, plus contributions from neighbors
- An anemometer's **read value** `r_i = (s_i + upstream_coupling) mod 8`
- Goal: make every `r_i == target_i`

### vs prior games
- **Spectrometer (independent dials)**: each dial is fully independent — `r_i = (s_i) mod N_i`
- **Interferometer (path-accumulation)**: path length adds up along ONE optical path
- **Sextant (co-alignment)**: align everything to the same star angle
- **Trebuchet (projectile physics)**: 2-param coupled ballistics
- **Anemometer (neighbor-coupling)**: EACH cell's reading depends on what its UPWIND neighbor is set to — this is a 2D tri-diagonal-like linear system mod 8. Solving one cell constrains the next, propagating constraints like a constraint-satisfaction problem.

## Simplified gameplay
Each level is a 1-row strip of K anemometers (K = 3 → 6 by tier).
- Strip has external wind direction `W_ext` (0–7)
- Each anemometer i has setting `s_i` (player rotation) and target `t_i`
- Read value `r_i = (s_i + s_{i-1}) mod 8` where `s_0 = W_ext` (the external wind)
- Player rotates each cup-anemometer to satisfy `r_i == t_i`
- This is **linear**: from left to right, each `s_i` is uniquely determined by `s_{i-1}` and `t_i`
  → `s_i = (t_i - s_{i-1}) mod 8`

## Level Generation
For each level:
1. Pick `W_ext` ∈ {0..7}
2. Pick `s_1..s_K` uniformly random ∈ {0..7}
3. Compute `t_i = (s_i + s_{i-1}) mod 8` (with `s_0 = W_ext`)
4. Output `{W_ext, targets:[t_1..t_K], solutions:[s_1..s_K]}`

Each level has a UNIQUE solution because the system is linear and triangular.

## Tiers (6 tiers, 5 levels each = 30 levels)
- T1: K=3 (very easy — 3 dials)
- T2: K=3
- T3: K=4
- T4: K=4
- T5: K=5
- T6: K=6

## Visual Design
- Top strip: weather vane showing external wind `W_ext`
- Row of K cup-anemometer icons (4 cups each, rotating)
- Each anemometer: current rotation arrow + target indicator (yellow ring with arrow showing target)
- Wind streamlines flowing between anemometers (animated)
- When all aligned: green checkmarks + win sequence

## SFX (Web Audio API procedural)
- whoosh (cup rotation)
- click (selection)
- chime (alignment)
- win (ascending arpeggio)
- error (descending tone)
