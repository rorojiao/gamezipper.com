# Zip Tie Untangle — Competitive Benchmark

## Game #470 — GameZipper.com

## Market Analysis

### Competitor Landscape
- **Tangle Master 3D** (Rollic): 100M+ downloads, top-20 puzzle on Google Play
- **Knots 3D** (Threads/Zip tie variants): 50M+ downloads across multiple titles
- **Untangle (various indie)**: Steady niche with dedicated player base
- **Wire Untangle Master**: 10M+ downloads, viral mechanic

### Why Zero Browser Coverage
Untangle puzzles are heavily mobile-first. No major web portal (Poki, CrazyGames, Kongregate)
has a high-quality untangle/zip-tie puzzle game. This is a clear market gap.

## Core Mechanic
Players drag vertices on a 2D plane to reposition them so that no two edges (lines connecting
vertices) cross each other. Classic planar graph embedding problem.

### Mathematical Foundation
- Based on planar graph theory (Kuratowski's theorem)
- All levels are solvable (every puzzle has at least one planar embedding)
- Difficulty scales with: vertex count, edge density, initial crossing count

## Level Design (30 levels, 5 tiers)
| Tier | Levels | Vertices | Edges | Complexity |
|------|--------|----------|-------|------------|
| 1 (Beginner) | 1-6 | 5-6 | 6-8 | Simple, few crossings |
| 2 (Easy) | 7-12 | 7-8 | 9-12 | Moderate crossings |
| 3 (Medium) | 13-18 | 9-10 | 13-16 | Dense graph |
| 4 (Hard) | 19-24 | 11-12 | 17-22 | Many crossings |
| 5 (Expert) | 25-30 | 13-15 | 23-28 | Complex planar graph |

## Monetization
- ASMR/satisfying category = top ad revenue tier
- Inter-level interstitials (Monetag)
- Hint system (rewarded ads potential)
- High session length (puzzle = longer engagement)

## Technical Specs
- Single-file HTML5 Canvas
- ~30-40KB target size
- Procedural CSS/SVG art (neon wire aesthetic)
- Web Audio API ambient BGM
- Touch + mouse pointer events
