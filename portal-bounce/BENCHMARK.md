# Portal Bounce — Competitive Benchmark

## Game Overview
**Portal Bounce** is a grid-based spatial puzzle where the player places a pair of
portal tiles to redirect an auto-launched bouncing ball through stars to a goal.

## Mechanic Analysis
- Ball auto-launches from a fixed position in a fixed direction
- Ball travels in straight lines, bouncing 90° off walls (deterministic)
- Player places exactly 2 portal tiles on empty grid cells before launching
- Ball teleports between portals (direction preserved)
- Win = collect ALL stars + reach goal; Fail = spike / loop / max bounces

## Closest Analogues on GameZipper (427 games)

| Game | Similarity | Difference |
|------|-----------|------------|
| Inertia | Grid ball movement, ice-slide | No portals; ball stops at walls vs bounces |
| Light Beam Puzzle | Place mirrors to redirect laser | Mirrors reflect vs portals teleport; instant ray vs animated ball |
| Pool / Billiards | Ball bouncing off walls | No portal placement; skill-based aiming |
| Roll the Ball | Route planning puzzle | Tile sliding vs portal placement |
| Flow Connect | Place paths on grid | Line drawing vs bouncing ball physics |

**Verdict: The bouncing-ball + portal-placement combination is completely novel.**
No existing GZ game combines deterministic bounce physics with player-placed
teleportation portals. The closest (Inertia) lacks portals entirely.

## Market Gap Evidence
- `grep -c 'portal' games-data.js` = **0 matches** across 427 games
- `grep -c 'teleport' games-data.js` = 1 match (grow-worm tags only, not a portal mechanic)
- Portal-themed puzzles are universally popular (Valve's Portal franchise, Worms, etc.)
- No browser-based "place portals to redirect bouncing ball" puzzle exists on GZ

## Competitor Features to Match
1. 30 handcrafted levels across 6 tiers of escalating difficulty
2. Star rating system (3-star based on bounce efficiency / par)
3. Hint system (flash suggested portal placement)
4. Undo portal placement
5. Level select with progress save (localStorage)
6. Sound effects + procedural BGM (Web Audio API)
7. Mobile-first touch + desktop mouse support
8. Particle effects on bounce, teleport, star collection

## Monetization
- Level-based = ideal for interstitial ads between levels
- Rewarded "show solution" / "skip" ad opportunities
- Short satisfying sessions (plan → launch → result in 10-30s)

## Score: 23/25
- Market gap: 9/9 (completely uncovered portal mechanic)
- Search volume: 3/5 ("portal game" competes with Valve; long-tail OK)
- Monetization: 5/5 (level-based, interstitial-ready)
- Feasibility: 4/5 (grid + bounce physics, 30 levels to design/verify)
- Uniqueness: 2/2 (novel mechanic combination)
