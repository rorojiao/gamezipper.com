# Greater-Than Sudoku — Competitive Benchmark

## Game Identity
- **Also known as**: Comparison Sudoku, Futoshiki Sudoku (hybrid), Inequality Sudoku
- **Rules**: Standard Sudoku (rows/cols/boxes contain 1..N once) PLUS greater-than
  (>) / less-than (<) signs between orthogonally-adjacent cells. The open jaw of
  the sign (>) points toward the LARGER digit.
- **Classic form**: Pure Greater-Than Sudoku has NO digit givens — only inequality
  signs between every adjacent pair. Mixed variants add a few givens for an easier
  difficulty curve.

## Market Gap (gamezipper.com)
- **Existing inequality-adjacent games**:
  - `/futoshiki/` — Latin-square inequality puzzle (NO 3x3 boxes, 4x4-7x7). Different
    genre (Futoshiki ≠ Sudoku; no box constraint).
  - `/sandwich-sudoku/`, `/thermo-sudoku/`, `/x-sudoku/`, `/hyper-sudoku/`,
    `/anti-king-sudoku/`, `/anti-knight-sudoku/`, `/consecutive-sudoku/`,
    `/killer-sudoku/`, `/skyscrapers/` — other Sudoku variants. None use the
    pure inter-cell greater-than sign mechanic.
- **Gap**: No Greater-Than / Comparison Sudoku on GZ. High SEO demand
  ("greater than sudoku", "comparison sudoku" — popular on sudoku.com and
  Cracking the Cryptic). Rules 100% confident. Generator feasible (standard
  Sudoku FT + derived inequalities + uniqueness-checked given digging).

## Competitor Analysis
| Source | Grid | Givens | Features | Monetization |
|--------|------|--------|----------|-------------|
| sudoku.com (Greater Than) | 9x9 | 0 (pure) | Hints, notes, timer, mistakes | Banner + interstitial + IAP |
| Cracking the Cryptic apps | 9x9 | 0 (pure) | Campaign, star ratings, hints | Paid app |
| puzzle-kingdom.com | 6x6, 9x9 | mixed | Daily, notes | Banner |
| logic-masters.de | 9x9 | 0 (pure) | Competition-grade | None |

## Our Differentiation
- 27 levels across 6 tiers (Beginner → Master), 6x6 + 9x9.
- Difficulty curve via GIVEN COUNT (not inequality removal): pure Master tier
  (0 givens) through givens-heavy Beginner.
- All 27 levels UNIQUE-verified by an independent inequality-aware solver.
- Dark emerald + slate theme (distinct from anti-king purple/gold and
  anti-knight steel/midnight).
- Full feature set: notes, hints, undo, erase, timer, daily challenge, star
  ratings, localStorage, tutorial, Web Audio BGM + SFX.
- Procedural art (icon + OG image).
