# Territory Draw — Competitive Benchmark

## Game Concept
Qix / Xonix style territory-claim arcade puzzle. The player draws lines across an
open play area to partition and claim territory. Enemy entities (Qix, Sparks)
roam the unclaimed area. If an enemy touches the player's trail while drawing,
the player loses a life. Goal: claim ≥75% of the play area to clear the level.

## Origin & Market
- **Qix** (1981, Taito) — one of the most iconic golden-age arcade games
- **Xonix** (1984) — beloved PC/DOS clone, spawned hundreds of variants
- **Volfied** (1989, Taito) — sequel with power-ups and shields
- **Gals Panic** (1990s) — adult arcade variant, very commercially successful
- Modern web clones: "Xonix Online", "Territory War", "Area Capture" — millions of plays
- Mobile: "Jezzball", "Qix Clone" apps — 1M+ downloads collectively
- **Coolmath Games**: multiple territory-claim games in rotation
- Recognized as a CLASSIC arcade puzzle with 40+ years of proven appeal

## Why It's Different from Paper.io (existing GZ game)
| Aspect | Paper.io | Territory Draw (Qix/Xonix) |
|--------|----------|---------------------------|
| Category | Arcade (.io multiplayer) | Puzzle (single-player, levels) |
| Core loop | Expand from base, trail-cut PVP | Partition field, avoid roaming enemies |
| Enemies | AI players (same mechanic as you) | Qix (roams inside field) + Sparks (travel on border) |
| Win condition | Largest territory when time ends | Claim ≥75% of total area |
| Failure | Trail gets cut by opponent | Enemy touches your active trail |
| Progression | Open-ended rounds | 30 discrete puzzle levels with increasing difficulty |

## Competitor Systems to Match
1. **Level progression** — 30 levels, increasing enemy count/speed
2. **Multiple enemy types** — Qix (roamer), Spark/Fuse (border-traveler), optional fast-mover
3. **Claim threshold** — 75% minimum to win, bonus for higher %
4. **Lives system** — 3 lives, lose one when trail is hit
5. **Score system** — points per % claimed, bonus for completing with fewer strokes
6. **Speed control** — fast draw (risk: harder to dodge) vs slow draw (safe: slower progress)
7. **Power-ups** (Volfied-style): shield, slow-time, bomb
8. **Progress save** — localStorage level + high score
9. **Tutorial** — first level teaches mechanics
10. **Visual feedback** — claimed area fills with color/pattern, trail is highlighted

## Implementation Plan
- Canvas-based rendering (grid of cells for territory tracking)
- Player entity on the border; can start drawing inward from any border point
- BFS/flood-fill to determine claimed area after each line completion
- Enemy AI: Qix bounces randomly within unclaimed area; Sparks patrol the border
- 30 levels with scaling: enemy speed, enemy count, area threshold, spark count

## Scoring (20/25)
- Market demand: 3/5 — classic arcade, nostalgic, proven but not top-chart trending
- SEO gap: 5/5 — zero Qix/Xonix/territory-claim puzzle in 433-game catalog
- Session duration: 3/5 — medium sessions, good for ad impressions
- Feasibility: 5/5 — Canvas grid, well-understood mechanics, proven single-file
- Zero overlap: 4/5 — paper.io is arcade .io; this is single-player puzzle with enemies
