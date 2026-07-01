# Interferometer Align — Design Document

## Game Concept
**Optical Path Difference Calibration Puzzle** — A Michelson-style
interferometer. The player adjusts N adjustable mirror stages (dials), each
contributing a signed, step-scaled optical path length. The puzzle is solved
when the cumulative path difference `Σ(level_i × step_i × sign_i) ≡ target
(mod λ)` — i.e. constructive interference at the detector.

## Core Mechanic: Modular-Arithmetic Dial Matching
This belongs to the **modular-arithmetic** constructive pattern (same class as
Gyroscope Precession #505, Orrery Planetary Gear #504, Sextant Celestial #506).

- **Dials (n)**: 2–5 mirror stages
- **Wavelength positions (P = λ)**: 6–12 discrete positions per full fringe cycle
- **Step**: each dial's per-level path contribution (1, 2, or 3 quarter-waves)
- **Sign**: +1 / −1 direction (mirror extends or retracts)
- **Win condition**: `Σ(level_i × step_i × sign_i) mod P == target`

## Differentiation from Existing Pipeline Games

| Game | Mechanic | Keyword | Our Difference |
|------|----------|---------|----------------|
| Sextant Celestial #506 | concentric-arc **CO-ALIGNMENT** (3 arcs to same angle) | sextant/vernier | We use **serial accumulation** (Σ mod λ), not parallel co-alignment |
| Orrery Planetary Gear #504 | epicyclic ring **COUPLING** (each dial moves ALL rings) | orrery/epicyclic | We use **independent contributions** (each dial adds its own path), not vector-coupled |
| Fulcrum Balance (sibling) | lever **TORQUE BALANCE** (Στ = 0) | fulcrum/torque | We target a **non-zero modular residue** (constructive interference), not zero-sum |
| Resonance Lock #507 | CRT oscillator **PHASE LOCK** (Chinese remainder) | resonance/harmonic | We use **single modulus** (one wavelength), not coprime-modulus CRT |
| **Interferometer Align (NEW)** | optical path **ACCUMULATION mod λ** | interferometer/fringe/interference | **Novel**: path-difference accumulation to a non-zero target residue |

**Key novelty**: all prior modular games either co-align (parallel) or couple
(vector). Interferometer Align is the first to frame the puzzle as **accumulating
discrete quarter-wave path segments** to hit a target fringe position — a
serial/sequential framing that matches real interferometer calibration.

## Visual Design
- Dark optics-lab aesthetic: deep navy background, laser-red beam path
- N mirror stages rendered as vertical sliders on a horizontal optical bench
- Beam splitter + detector at right; interference fringe ring at top
- When solved: fringe snaps to bright center, detector glows green
- Web Audio SFX: click (dial tick), fringe-shift (sweep tone), win (chord),
  error (buzz)

## Level Structure (30 levels, 6 tiers)

| Tier | Levels | Dials (n) | Wavelength P | Max Step | Typical Solutions |
|------|--------|-----------|--------------|----------|-------------------|
| 1 | L1-5   | 2 | 6  | 2 | 1-2 (mostly unique) |
| 2 | L6-10  | 3 | 6  | 2 | 1-3 (loose fallback) |
| 3 | L11-15 | 3 | 8  | 3 | 1 (unique) |
| 4 | L16-20 | 4 | 8  | 3 | 1-3 (loose fallback) |
| 5 | L21-25 | 4 | 12 | 3 | 1 (unique) |
| 6 | L26-30 | 5 | 12 | 3 | 1 (unique) |

## Level Generation Method
- **Counting-DP** (convolution) for solution counting — O(n·P·maxLevel)
- **Meet-in-the-middle** for solution recovery — O(√(space))
- **Loose fallback** (≤3 solutions) for small-P tiers where uniqueness is rare
- **3-method verification**: Python DP + independent Node BFS + in-engine Node BFS

## Keyword Zero-Gap Verification (Phase 0, live=507)
```
interferometer: grep = 0 ✅ (true zero-gap)
fringe:         grep = 0 ✅
interference:   grep = 0 ✅
optical-path:   grep = 0 ✅
wavelength:     grep = 0 ✅
```
5 true zero-gap keywords confirmed against 507 live entries.

## Sibling Coexistence Check
- `fulcrum-balance/` — registered live (torque/lever theme) ✅ no collision
- `resonance-lock/` — registered live (CRT oscillator theme) ✅ no collision
- Interferometer theme (optics/path-difference) is distinct from both.
