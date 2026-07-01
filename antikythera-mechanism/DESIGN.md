# Antikythera Mechanism -- Design Document

## Game Concept
Turn a single crank to drive multiple coupled astronomical dials. Each dial
rotates at a fixed gear ratio relative to the crank. Find the exact crank
position where all dials simultaneously point to their target markers.

## Mechanic: Single-Crank Coupled-Dial Prediction

### Core Math: CRT with Gear-Ratio Coupling

The player turns ONE crank. Each dial i is driven through a gear train:

  dial_position_i = (crank_turns * gear_ratio_i) mod dial_teeth_i

The player must find crank_turns (0..LCM of all dial_teeth) such that:

  (crank_turns * gear_ratio_i) mod dial_teeth_i = target_i  for all i

This is a system of coupled modular equations -- solvable by CRT when
gcd(gear_ratio_i, dial_teeth_i) divides (target_i).

### Why This is Different
- Orrery: player sets EACH dial independently (N DOFs, N targets)
- Sextant: player rotates EACH arc independently
- Resonance Lock: player sets EACH oscillator phase independently
- Crankshaft: player rotates EACH crank independently
- **Antikythera**: player has ONLY ONE crank (1 DOF), ALL dials are COUPLED

The player must DEDUCE the unique crank position from the coupled constraints.
You can't brute-force each dial -- turning the crank moves ALL dials at once.

### Dial Types (Thematic)
1. **Metonic Cycle** (235 synodic months = 19 years)
2. **Saros Cycle** (223 synodic months = ~18 years, eclipse cycle)
3. **Callippic Cycle** (76 years, 925 months)
4. **Exeligmos Cycle** (669 synodic months = ~54 years, triple Saros)
5. **Zodiac** (12 divisions)
6. **Solar Year** (365 days)

### Difficulty Tiers
| Tier | Levels | Dials | Teeth Range | Gear Ratios | Notes |
|------|--------|-------|-------------|-------------|-------|
| 1 | 1-6 | 2 | 6-8 | 1:1, 1:2 | Gentle intro, small moduli |
| 2 | 7-12 | 2-3 | 8-12 | 1:1, 1:2, 1:3 | Add third dial |
| 3 | 13-18 | 3 | 10-14 | 1:1 to 1:4 | Coprime teeth for CRT |
| 4 | 19-24 | 3-4 | 12-16 | 1:1 to 1:5 | Larger moduli |
| 5 | 25-30 | 4-5 | 12-20 | 1:1 to 1:6 | Expert, multiple CRT steps |

### Win Condition
All dial pointers align with their target markers simultaneously.

### Scoring (3-star)
- Solve in optimal moves (BFS shortest path): 3 stars
- Solve in optimal + ceil(optimal/2) moves: 2 stars
- Solve in any number of moves: 1 star

"Move" = one crank step (+1 or -1). The crank turns in discrete steps.

### Level Generation Algorithm
For each level:
1. Choose N dials with teeth [N1, N2, ..., Nk]
2. Choose gear ratios [r1, r2, ..., rk] coprime to their respective teeth
3. Pick a random crank position x in [0, LCM(N1..Nk))
4. Compute targets: t_i = (x * r_i) mod N_i
5. Verify uniqueness: x must be the unique solution in [0, LCM)
   - LCM should equal product(N_i) when teeth are pairwise coprime
   - If not coprime, verify CRT still gives unique solution
6. BFS to find shortest path from 0 to x

## Visual Design
- Ancient Greek bronze aesthetic: corroded green-blue patina
- Circular dials with Greek astronomical symbols
- Central crank handle
- Engraved gear teeth visible
- Celestial body icons on target markers (moon, sun, eclipse)
- Color palette: dark bronze (#3d3120, #5c4a2e), patina (#4a7c59, #7caa8e),
  gold accents (#c9a84a), parchment text (#e8dcc0)

## UI Layout
- Top: Level number, star rating, move counter
- Center: Main mechanism (dials + crank)
- Bottom: Crank control (tap LEFT to turn CCW, tap RIGHT to turn CW)
- Side: Target indicators showing each dial's target position
- Menu button top-left, Sound/Music toggles top-right

## Technical
- Single-file HTML5 Canvas
- No external dependencies
- localStorage for progress
- Web Audio API for SFX (click, gear, win, error)
- Pointer events for touch + mouse
- Responsive canvas (max 480px width)
