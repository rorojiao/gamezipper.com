# Anti-King Sudoku — Competitive Benchmark

## Game Definition
**Anti-King Sudoku** = Standard Sudoku (rows, columns, 3×3 boxes each contain 1–9 once)
**PLUS** the Anti-King constraint: **no two cells a king's-move apart** (the 8 surrounding
cells — horizontal, vertical, AND diagonal neighbours) may contain the same digit.

Also known as: *King Sudoku*, *Touchless Sudoku (king)*. Popularised by
**Cracking the Cryptic** YouTube channel and the *Sudoku Genius* / *Sudokube* apps.
High SEO demand ("anti king sudoku", "king sudoku rules", "anti king sudoku solver").

## Why it differentiates
- Zero coverage on GameZipper (verified 2026-06-20 — 11 sudoku variants present, none
  anti-king).
- Constraint is **uniform & visual** (no extra givens/clues beyond the base grid), so it
  plays cleanly on mobile and is easy to teach.
- Strong constructive generator exists: backtracking solver enforcing row/col/box/king
  constraints.

## Competitive Reference (3+ titles)
| Competitor | Platform | Levels | Systems | Art | Music |
|------------|----------|--------|---------|-----|-------|
| Cracking the Cryptic: Anti-King Sudoku | Steam/iOS | Curated puzzles | Notes, hints, undo, mistake highlighting, timer | Clean modern | Ambient |
| Sudoku.com (Variant modes) | Web/iOS | Infinite | Notes, hints, undo, daily, streaks, stats | Vibrant modern | Lo-fi |
| Logic Masters Germany (Anti-King) | Web | 100s (community) | Pencil marks, solver-check | Minimal | None |

## Systems to match (S-grade parity)
1. **Scoring** — base + speed bonus + mistake penalty, 3-star per-level rating
2. **Levels** — 27 levels across 6 tiers (4×4 Beg, 6×6 Easy/Med, 9×9 Hard/Exp/Master)
3. **Notes / pencil marks** — candidate digits per cell, toggle
4. **Hints** — reveal one logical step (limited count per level)
5. **Undo / erase** — full move history
6. **Timer** — per-level + best-time leaderboard (localStorage)
7. **Daily challenge** — one seeded puzzle per day
8. **Mistake counter** — wrong placements flagged
9. **King-move highlight** — signature UX: tapping a cell highlights its 8 king-neighbours
10. **Tutorial** — 3-step onboarding (skippable)
11. **Progress save** — localStorage v1, versioned
12. **Audio** — BGM + 8 SFX (Web Audio API procedural)
13. **Win animation** — confetti + completion card

## Difficulty curve (target)
| Tier | Grid | Givens | Notes |
|------|------|--------|-------|
| Beginner | 4×4 | 6–8 | teach king rule |
| Easy | 6×6 | 14–18 | |
| Medium | 6×6 | 10–14 | |
| Hard | 9×9 | 32–40 | |
| Expert | 9×9 | 24–32 | |
| Master | 9×9 | 18–26 | deep king-logic |

All 27 puzzles MUST be uniquely solvable (verified by independent Node.js solver).
