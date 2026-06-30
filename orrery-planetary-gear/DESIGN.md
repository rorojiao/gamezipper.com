# Orrery Planetary Gear — Epicyclic Ring Alignment Puzzle

## Concept
A planetary (epicyclic) gearset has three concentric members: **Sun (S)**, **Planet-Carrier (P)**, and **Ring (R)**. They are mechanically coupled: their rotations are not independent. The player turns dials that apply input rotations and must align all three marker dots onto a single radial line.

## Mechanic (unique vs catalog)
- **gear-chain / gear-logic** (serial gear trains): one rotation propagates linearly.
- **gyroscope-precession** (precession): spin-axis torques cause perpendicular precession.
- **gravity-orbit**: gravity-based orbital mechanics.
- **Orrery Planetary Gear**: epicyclic constraint coupling — turning Sun rotates Ring & Carrier in fixed tooth-ratio. The dial inputs are not independent; the coupling itself is the puzzle.

## Physics model (Willis equation)
For a simple planetary with sun teeth `s`, ring teeth `r` (carrier `c = s + r` total), the Willis (fundamental) equation is:
```
(r_w - c_w) / (s_w - c_w) = -s / r
```
Equivalently, with sun rotation `tS` (applied to sun while carrier free), ring rotation `tR` (applied to ring), the resulting carrier rotation `tC` satisfies:
```
tC = (s·tS + r·tR) / (s + r)
```
We work in integer tooth-counts so `tC` is determined mod N by `tS, tR`. The three absolute marker angles are `θS, θR, θC` (each mod N positions around the dial).

## Puzzle
- N = P (positions per ring, e.g. 6..12 across tiers)
- 3 markers: sun marker, ring marker, carrier marker — each at some starting angle (0..N-1)
- Player has K dials (2..5). Each dial applies a fixed `(ΔtS, ΔtR)` pair (the dial's mechanical signature).
- After applying a multiset of dials, the 3 marker angles must all be equal (aligned) mod N.
- Minimize number of dial presses; find unique minimal solution.

## Solvability & uniqueness
State = (θS, θR, θC) ∈ Z_N^3 (up to N^3 = 1728 states max). BFS from initial state; target = any (k,k,k). Dials are bounded (each 0..ceil(N/2) presses, sum ≤ K_max). For each level we BFS-verify:
1. solvable (target reachable)
2. unique minimal (exactly one dial-multiset achieves target at minimal cost)
3. diameter bounded (≤ K_max presses)

## Level tiers
| Tier | N | K dials | Levels |
|------|---|---------|--------|
| 1 | 6 | 2 | 6 |
| 2 | 8 | 3 | 6 |
| 3 | 10 | 3 | 6 |
| 4 | 12 | 4 | 6 |
| 5 | 12 | 5 | 6 |
| Total | | | 30 |

## Differentiation (grep verification, 2026-07-01)
- `orrery` = 0 ✅
- `epicyclic` = 0 ✅
- `planetary` = 0 ✅
- `armillary` = 0 ✅
- (sun/ring/carrier words exist but not as epicyclic-puzzle theme)

## Art
- icon.png: stylized 3-ring planetary gearset (sun dot center, 3 planet dots, ring outline), brass/copper palette
- og-image.jpg: 1200×630 hero with orrery rings, title, "align all three rings" tagline

## Audio
Web Audio API procedural SFX: dial-click (short sine blip), gear-mesh (filtered noise burst), align-chime (major triad arpeggio), win-fanfare (ascending fifth), error-buzz (low square).
