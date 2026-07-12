# Amibo — Competitive Benchmark

## Source
- **Nikoli Amibo (アミーボ)** — line crossing puzzle
- **Rules source**: janko.at Amibo Regeln (https://www.janko.at/Raetsel/Amibo/Regeln.htm) — rules confirmed in DE/EN/JA

## Rules (from janko.at)
- Draw horizontal and vertical line segments in the grid
- Each segment runs along cell midpoints, starts/ends at cell borders
- Cells with circles: exactly one segment starts at each circle; number = segment length
- No line passes through a circle cell
- Every segment X must be crossed by at least one segment Y of equal length
- All segments form a single orthogonally-connected network (via crossings)
- Segments must not form a closed loop (crossing graph is a tree)

## Catalog Gap Verification
- `amibo`, `amibo puzzle`, `line crossing puzzle` — all 0 occurrences in games-data.js (grep verified)
- True zero-gap: no existing GameZipper game covers this mechanic

## Competitive Analysis
- janko.at: 1 reference site with rules + examples
- No major web game portal (Poki, CrazyGames, Coolmath) offers Amibo
- This is a pure logic puzzle with no real-time competitor in the browser game space

## Generation Strategy
- **Solution-first tree-grow**: place seed segment, then repeatedly add same-length crossing segments
- **Cycle prevention**: each new segment checked to not create cycle in crossing graph (BFS connectivity check)
- **Circle placement**: each segment gets a circle at one endpoint-adjacent cell
- **Dedup**: segment patterns deduplicated within each tier

## Difficulty Tiers
| Tier | Grid | Segments | Levels |
|------|------|----------|--------|
| Beginner | 5×5 | 3 | 6 |
| Easy | 6×6 | 4 | 6 |
| Medium | 7×7 | 5 | 6 |
| Hard | 8×7 | 6 | 6 |
| Expert | 8×8 | 7 | 6 |

## Verification (3-Method)
1. **Python structural** (gen_levels.py): constraint solver verifies rules
2. **Node.js independent** (verify_independent.js): separate BFS implementation
3. **In-engine** (verify_engine.js): loads actual index.html via vm.runInContext, uses engine's own `segmentsCross`/`isClueSatisfied`
4. **Playtest simulation** (playtest.js): replays solution segments through engine, verifies win conditions

All 30/30 levels pass all methods.
