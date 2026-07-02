# BENCHMARK: Recoil (Knockback Physics Puzzle)

## Benchmark Games
- **Recoil** (by Martin Magni / popularized on Poki, Coolmath) — top-down grid puzzle where a gun-toting character moves only by recoil: each shot pushes the character backward. Goal: reach the exit while destroying/avoiding enemies and hazards.
- **Gunbrick** (Nitrome) — gun-recoil-driven movement puzzle, block-based grid.
- **Knockback / Blast Off** — variants of the recoil-move mechanic.

## Core Mechanic
The player does NOT move directly. The ONLY way to move is by shooting — firing a bullet in one direction propels the player in the **opposite** direction (Newton's 3rd law / recoil). Bullets travel across the grid and destroy enemies they hit. The player must use recoil pushes to navigate the grid, collect stars, defeat all enemies (bullets kill them), and reach the exit tile.

## Systems Checklist (竞品对标)
| System | Recoil (benchmark) | Our Game |
|--------|-------------------|----------|
| Level count | 30+ progressive | 30 levels, 6 tiers |
| Grid-based movement | Yes (cells) | Yes |
| Recoil physics | Shoot→move backward | Yes (core) |
| Enemies (destructible) | Yes | Yes (3 types) |
| Hazards (walls/spikes) | Yes | Walls + spike traps |
| Star collection | Yes (3 stars/level) | Yes |
| Coins/rewards | Yes | Yes (coins from stars) |
| Progress save | localStorage | localStorage |
| Hints/skip | Coins for hints | Yes (hint reveals safe shot) |
| Tutorial | Level 1-3 | Levels 1-3 |
| Sound effects | Yes | Web Audio procedural |
| BGM | Yes | Web Audio ambient loop |
| Daily bonus | No | Yes (daily coin bonus) |

## Level Design (30 levels)
| Tier | Levels | Grid | Enemies | Hazards | Focus |
|------|--------|------|---------|---------|-------|
| 1 Tutorial | 1-6 | 6×6 | 0-2 | walls only | Learn recoil |
| 2 Easy | 7-12 | 7×7 | 2-3 | walls | Aim + plan |
| 3 Normal | 13-18 | 8×8 | 3-4 | walls | Multi-step |
| 4 Hard | 19-24 | 8×8 | 4-5 | walls + spikes | Efficiency |
| 5 Expert | 25-30 | 9×9 | 5-6 | all | Mastery |

## Differentiation
- GZ has NO knockback/recoil puzzle — zero overlap (verified 3-layer check).
- Theme: neon sci-fi grid arena (glowing player core, plasma bullets).
- Unique enemy types: Drone (static), Turret (shoots back), Shield (armor, needs 2 hits).

## QA Standards
- All 30 levels solvable & verified.
- Win condition: reach exit tile (exit unlocks only after all enemies defeated).
- Par-shot system for star ratings (efficiency scoring).
