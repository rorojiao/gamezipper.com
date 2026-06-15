# BENCHMARK: Unroll Tape — Tape Peeling Puzzle

## Game Concept
Peel overlapping tape strips in the correct order (top-first / LIFO) to reveal hidden geometric patterns. Visual perception puzzle where the challenge is identifying which strip is on top.

## Top Competitors

| Game | Developer | Downloads | Rating | Notes |
|------|-----------|-----------|--------|-------|
| Perfect Slices | SayGames Ltd | 100M+ | 4.2★ | Leading genre title, satisfying peel ASMR |
| Untape | KAYAC Inc | 100K+ | 4.4★ | 700+ levels, the tape-specific leader |
| Tape Tap! | Bravestars Games | 100K+ | 3.7★ | Faster-paced variant |
| Paper Peel | Elven gum | 5K+ | 4.7★ | ASMR art reveal focus |
| Tape Away 3D | Tiny Kraken | 5K+ | 3.6★ | 3D twist on mechanic |

## Core Mechanic (LIFO Untape Stack)
1. Multiple tape strips overlap on a surface, each with a z-order
2. A strip is "peelable" only if no higher-z strip covers any part of it
3. Player taps a peelable strip → it animates peeling away
4. Tapping a covered strip = miss (shake feedback)
5. When all strips removed → hidden pattern revealed → level complete
6. Star rating: 3★ = 0 misses, 2★ = 1-2 misses, 1★ = 3+ misses

## Systems to Replicate
- [x] Level progression (30 levels, 5 tiers)
- [x] Star rating per level (par-based)
- [x] Hint system (highlight next correct strip)
- [x] Undo (restore last peeled strip)
- [x] Progress save (localStorage with version)
- [x] Settings (sound/music toggles)
- [x] Tutorial on first play
- [x] Color-combo bonus (consecutive same-color peels)
- [x] Level select grid with lock/unlock
- [x] Web Audio SFX (peel, error, complete, victory, button)
- [x] Web Audio ambient BGM
- [x] Responsive mobile + desktop
- [x] Particle effects on peel
- [x] Screen feedback (shake on miss)

## Art Style
Clean ASMR aesthetic: pastel cream background, semi-transparent colored tape strips with subtle shadows, vibrant geometric pattern reveals. Dark gradient GameZipper theme for UI panels.

## Pattern Types (revealed underneath)
Tier 1: Heart, Star, Smile — simple iconic shapes
Tier 2: Mandala, Sunburst — radial symmetry
Tier 3: Rainbow, Diamond — gradient/gem
Tier 4: Flower, Spiral — organic geometry
Tier 5: Mosaic, Galaxy — complex multi-element

## Level Difficulty Curve
- Tier 1 (L1-6): 3-4 strips, horizontal/vertical only
- Tier 2 (L7-12): 5-6 strips, +45° diagonal strips
- Tier 3 (L13-18): 6-7 strips, +multiple angles
- Tier 4 (L19-24): 7-9 strips, tight overlaps
- Tier 5 (L25-30): 9-11 strips, maximum complexity
