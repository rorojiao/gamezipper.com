# Armillary Align — Ring Rotation Cyclic Coupling Puzzle

## Candidate Selection (Round 17, Phase 0-1)

### Gap Analysis
- grep "armillary" across 514 games = **0** (true zero-gap)
- Total: **1 true zero-gap keyword**

### Mechanic Design

**Theme**: Ancient astronomical instrument — armillary sphere with concentric rings.

**Core Mechanic**: CYCLIC RING COUPLING
- N concentric rings (3-6 depending on tier)
- Each ring has M=8 equidistant positions
- Each ring has a notch marker
- Player rotates each ring to a chosen position (0..M-1)
- **Coupling rule**: alignment_i = (2*setting_i + setting_{(i+1)%N}) mod 8
  - Each ring is coupled to its successor AND the first/last wrap around (cyclic)
- Target: each ring must show its target value
- Solve: unique solution guaranteed by invertible circulant matrix (det ≠ 0 mod 8)

### Differentiation

| Game | Coupling Model |
|------|---------------|
| Spectrometer (#510) | Independent (no coupling) |
| Vortex Valve (#513) | Linear chain (linked) |
| Anemometer (#514) | Tri-diagonal linear (neighbor only) |
| **Armillary (#515)** | **Cyclic tri-diagonal (ring topology)** |

### Tier Structure

| Tier | Rings (N) | Levels |
|------|-----------|--------|
| 1 (Novice) | 3 | 6 |
| 2 (Apprentice) | 4 | 6 |
| 3 (Adept) | 5 | 6 |
| 4 (Expert) | 5 | 6 |
| 5 (Master) | 6 | 6 |

Total: 30 levels