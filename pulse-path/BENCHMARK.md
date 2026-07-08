# Pulse Path — Competitive Benchmark

## Phase 0 Candidate Rationale

**Candidate:** Pulse Path (`/pulse-path/`)  
**Benchmark family:** ZHED-style number-extension path puzzles  
**Score:** 23/25

| Criterion | Score | Evidence |
|---|---:|---|
| Market demand | 8/10 | ZHED is distributed on Steam and Nintendo Switch and has Android listings; search results describe it as an “instant classic” pure puzzle with 100 levels and a 4.8 rating on OurPlay listings. |
| Search/SEO gap | 5/5 | GameZipper catalog grep returned 0 for `zhed`, `goal square`, `tap square direction`, `extend path`, and no direct ZHED-like node-extension puzzle exists. |
| Monetization potential | 4/5 | Pure brain teaser, short retry loops, level progression, high dwell time. |
| Feasibility | 3/3 | Single-file Canvas + deterministic graph solver. No external assets required. |
| Uniqueness | 3/2 bonus | Differentiated as a neon pulse relay: numbered energy nodes fire exact-length pulses to the next node/goal; unique-solution generated levels with decoys. |

## Competitor Systems to Match

### ZHED
- Tap square, choose direction.
- Square reacts/extends to build a path toward a goal square.
- Pure logic: no timers required, no tricks, undo/restart.
- 100 handcrafted levels across packs.

### GameZipper S-Grade Additions
- 30 verified unique levels across 5 tiers.
- Exact-length pulse relay mechanic with decoy nodes and wall blockers.
- Hint system, undo, reset, keyboard support, mobile touch support.
- 3-star ratings and localStorage progress.
- Procedural Canvas visuals: neon nodes, glowing paths, animated pulse particles.
- Web Audio API ambient BGM + click/success/error/win SFX.
- SEO blocks: VideoGame, FAQPage, HowTo, BreadcrumbList.
- Generated/procedural art assets: `icon.png` and `og-image.jpg`.

## Differentiation

Pulse Path is **not** Numberlink/Flow Free: paths are not free-drawn between pairs. Each node contains an exact pulse length; the player chooses the direction and the pulse must land exactly on another relay node or the goal. The puzzle is a directed graph of exact-length jumps, with decoys to test planning.

## QA Requirements

- Every level must have exactly one route from start to goal under engine rules.
- All embedded level data must match `levels.json`.
- In-engine verification must replay the known optimal path for all 30 levels.
- Game page must include `adsterra-manager.js`, `monetag-manager.js`, `gz-ad-below-game`, and `game-footer.js`.
