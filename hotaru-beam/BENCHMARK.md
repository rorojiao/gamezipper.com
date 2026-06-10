# BENCHMARK.md — Hotaru Beam Competitive Analysis

**Project:** GameZipper.com — Hotaru Beam Puzzle Game  
**Date:** June 11, 2026  

---

## Game Definition: Hotaru Beam

Hotaru Beam is a Nikoli logic puzzle fundamentally different from Akari/Light Up.

### Rules
- **Grid**: Rectangular grid of dashed lines with circles at intersections
- **Circles**: Each circle has a dot on one grid line (beam start direction) and optionally a number
- **Objective**: Draw beams from each circle to connect ALL circles into a single connected network
- **Beam behavior**: Starts from the dot direction, travels along grid lines, can bend at intersections (90° turns)
- **Number meaning**: Specifies the exact number of bends that beam must make
- **Constraints**: Beams cannot cross; each beam terminates at a different circle; all circles must be connected

### Market Gap
**No dedicated digital implementation exists.** This is a blue ocean opportunity. Only competition is pen-and-paper Nikoli publications.

---

## Competitor Analysis (Adjacent Puzzle Games)

### Competitor 1: Akari: Light Up Your Brain (Mobile)
- Hundreds of puzzles, 5×5 to 12×12+
- Daily challenge, achievements, leaderboards, hints, undo, timer
- Modern mobile UI, warm light theme
- Stats tracking, solving strategies guide

### Competitor 2: Daily Akari (Web - dailyakari.com)
- Daily rotation with difficulty ramping Mon-Sun
- Streak tracking, leaderboards
- Clean web interface, bright colors

### Competitor 3: Simon Tatham's Light Up (Web)
- Infinite procedural puzzles via seed
- Full undo/redo, configurable grid size
- Minimalist: no scoring, no audio

### Competitor 4: Puzzle by Nikoli W Akari (Console)
- 50 handcrafted puzzles, 3 difficulties
- Console-optimized, minimal audio

### Competitor 5: Akari Glow: Light Up Puzzles (iOS)
- 900 handcrafted puzzles + daily
- "Glow" aesthetic, dark background
- Accessibility support

---

## Recommended Systems for Hotaru Beam

| System | Implementation |
|--------|---------------|
| Tutorial | Interactive step-by-step (Hotaru Beam is unfamiliar) |
| Levels | 20+ handcrafted puzzles across 4 difficulty tiers |
| Grid Sizes | 5×5 (tutorial) through 10×10 (expert) |
| Hints | Multi-tier: highlight next circle → show bend → reveal beam |
| Timer | Show after completion only |
| Undo | Full undo/redo stack |
| Progress Save | localStorage with version |
| Art Style | "Firefly" glow aesthetic: dark bg, warm amber/green beams |
| Sound | Ambient nature/firefly sounds; beam-draw SFX |
| Score | Time-based with bonus for fewer undos |

---

## Key Differentiators from Competitors
1. **Unique puzzle type** — no digital competition exists
2. **Firefly theme** — "Hotaru" means firefly in Japanese
3. **Path-drawing mechanic** — distinct from placement puzzles
4. **Satisfying beam animations** — glow effects along paths
