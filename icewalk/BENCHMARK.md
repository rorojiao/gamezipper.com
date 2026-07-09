# Icewalk (#607) — Benchmark

## Source
- Nikoli Icewalk (アイスウォーク)
- Reference: nikoli.co.jp/en/puzzles/icewalk/

## Rules
1. Draw a path from Start (S) to Goal (G) visiting every cell exactly once
2. On ice cells (blue): the path slides straight until hitting a non-ice cell or wall
3. On normal cells: the path can change direction
4. The path cannot cross or revisit cells
5. Start and Goal are given positions on the grid

## Solver Strategy
- Backtracking Hamiltonian path finder
- Ice cells force sliding (deterministic direction extension)
- Normal cells allow turning (try all 4 directions, excluding current and reverse)
- Uniqueness verified by counting solutions (max 2)

## Difficulty Tiers
| Tier | Grid Size | Ice % | Levels |
|------|-----------|-------|--------|
| Beginner | 4×4 | 0-10% | 6 |
| Easy | 5×5 | 10-20% | 6 |
| Medium | 6×6 | 20-30% | 6 |
| Hard | 7×7 | 20-30% | 6 |
| Expert | 8×8 | 30-40% | 6 |
