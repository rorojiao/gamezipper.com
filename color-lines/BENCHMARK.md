# BENCHMARK — Color Lines (Lines 98)

## Target Game
- **Name:** Color Lines
- **Slug:** color-lines
- **Genre:** Classic strategy line-formation puzzle (endless, score-attack)

## Top Competitor Analysis

### 1. "Lines 98" / "Color Lines" (canonical classic, DOS 1992 / Win98)
- **Origin:** Olga Demina (1992, "Color Lines"). Bundled-feel classic alongside Minesweeper/Solitaire.
- **Mechanics:** 9×9 grid. Each turn: move ONE ball from its cell to any empty cell IF a clear
  4-connected path exists (orthogonal only, through empty cells). After a non-scoring move, 3 new
  random colored balls spawn. Form a line (horizontal/vertical/diagonal) of ≥5 same-colored balls →
  those balls clear, you score (no new balls that turn). Game over when board is full.
- **Colors:** 7 classic colors.
- **Scoring:** 2 points per ball in a cleared line (classic); longer lines & combos score more.
- **Next preview:** Shows the 3 upcoming ball colors (essential strategic aid).
- **Appeal:** Office-time-killer, "one more game" addiction, deep positional strategy.

### 2. "Lines 98 Retro / Legend Color Lines" (mobile clones, App Store/9game)
- **Added modes:** Line mode (5-in-line), Square mode (4 same-color forming a rectangle),
  Block mode (7+ same-color clustered). These expand replayability.
- **Features:** Multiple themes (wood/dark/neon), undo, auto-save/resume, leaderboards,
  speed control, share score.
- **Grid sizes:** small / medium / big / very big (configurable).

### 3. truedrcb/color-lines-js (GitHub React clone)
- 9×9, single "hard" mode (no preview). Validates core mechanic is single-file buildable.

## Systems I Must Match (S-tier parity)
1. ✅ **Classic mode** — 9×9, 7 colors, move-with-clear-path, spawn-3, 5-in-line clear.
2. ✅ **Next-3 preview** — show upcoming ball colors (toggleable).
3. ✅ **Multiple game modes** — Lines / Squares / Blocks (match competitor feature set).
4. ✅ **Undo** — at least 1-step undo (competitor parity).
5. ✅ **Difficulty / grid sizes** — 9×9 (Classic), 8×8 (Hard: fewer cells), 10×10 (Easy/Relaxed),
   plus color-count difficulty (5/7 colors).
6. ✅ **Scoring + combos** — bonus for clearing multiple lines / longer lines in one move.
7. ✅ **Level/progression system** — Daily Challenge (seeded) + difficulty tiers + achievements
   + persistent best-score tracking. (Satisfies "complete level system" requirement.)
8. ✅ **Themes** — at least Neon (default GZ style) + Classic.
9. ✅ **Audio** — Web Audio procedural music + SFX (move, clear, spawn, game-over).
10. ✅ **Animations** — ball move easing, clear pop, spawn drop, selected-ball pulse.
11. ✅ **Mobile + desktop** — touch (tap-select then tap-target) + mouse.
12. ✅ **No-path feedback** — shake/flash when move is blocked.

## Monetization / Engagement (for parity & retention)
- Local best scores per mode, achievement unlocks, daily seeded challenge, "personal best" popups.
- (Site-level ads handled by GZ framework; game stays ad-free internally.)

## Key Differentiators vs competitors
- GZ signature neon aesthetic + animated background.
- True no-download, mobile-first, single-file HTML5.
- Full mode set (Lines+Squares+Blocks) in one free game — many clones split these.

## Feasibility verdict: HIGH (5/5)
- Grid model: 2D array of {color|null}.
- Move validation: BFS/DFS over empty orthogonal cells.
- Line detection: scan all rows/cols + 2 diagonals from every ball, count run-length ≥5.
- Square detection (Squares mode): 2×2 same-color blocks.
- Block detection (Blocks mode): flood-fill connected component ≥7.
- All O(N²) on a ≤100-cell grid — trivially fast. No physics engine needed.
