# Araf — Competitor Benchmark & Design Doc

## Game: Araf (slug: `araf`)
**Type:** Region-division logic puzzle (Nikoli/GM Puzzles family)
**Origin:** Designed by Serkan Yürekli (Turkey), popularized on gmpuzzles.com (63 published puzzles).

## Core Rules (verified — gmpuzzles Region Division category)
1. Divide the grid into regions (4-connected polyominoes).
2. Every region must contain **exactly two numbered cells**.
3. The **size** (cell count) of each region must be **strictly between** the two numbers it contains.
   - e.g. clues `4` and `8` ⇒ region size ∈ {5,6,7}.
   - Clue pairs are always distinct (equal pair ⇒ impossible).
4. Regions partition the whole grid; no overlap, no gaps.

## Competitors Benchmarked
| Competitor | Levels | Systems | Art | Music |
|------------|--------|---------|-----|-------|
| gmpuzzles.com Araf | 63 | hand-authored, no scoring | b/w print style | none |
| Puzzle Magazine (Japan) | print | region borders via pen | print | none |
| Logic Masters Germany | community | solver verification | — | — |
| Puzzle-Clue / puzzle-loop apps | 50-100 | timer, hint, undo, auto-check | flat clean UI | soft ambient |

## Systems to Implement (S-grade parity + exceed)
- ✅ Region-division via **edge-toggle** interaction (click internal edge to draw/erase border)
- ✅ Connected-component auto-detection (regions = components of non-bordered edges)
- ✅ Live win-check (exactly 2 clues/region + size strictly between)
- ✅ Level system: 24 levels across 5 tiers (Tutorial → Expert) + difficulty curve
- ✅ Scoring: time + moves + hint penalty → star rating (★1-3)
- ✅ Hints (reveal one correct border) with limited count per level
- ✅ Undo / Redo stack
- ✅ Progress save (localStorage, versioned `araf_save_v1`): unlocked levels + best stars/times
- ✅ Tutorial overlay on first level (guided border-draw)
- ✅ Sound (Web Audio API procedural): click, border-draw, region-complete chime, win fanfare, error
- ✅ Animations: border draw pop, region-complete flash, win confetti particles
- ✅ Level select grid with star/lock badges
- ✅ Reset level, mute toggle, pause
- ✅ Mobile-first responsive canvas + touch (min 44px tap targets)
- ✅ Dark neon gradient UI (GameZipper style)

## Construction Strategy (guaranteed-solvable levels)
- **Generate-and-verify-uniqueness** (standard for region-division).
- Random region partition (seeded growth) → place tight clue pairs (s-1, s+1) per region → uniqueness solver (backtracking, count ≤2 solutions) → accept if unique.
- Two independent verifiers: Python generator solver (uniqueness) + Node Phase-6 verifier (parses embedded LEVELS, re-checks uniqueness + that stored solution wins).

## Target Interaction Summary
- Click internal grid edge → toggle border. Adjacent (no border) cells = same region.
- Right-click cell (or long-press) → "mark" helper (dot) for player notes (optional nicety).
- Auto-check on every change; "Check" button for manual verify.
