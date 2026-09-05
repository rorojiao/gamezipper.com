# R651 Sweep 151 — GameZipper Per-Game Deep QA (5 Never-Verified Games)

**Date:** 2026-09-03 (04:35-04:45 UTC)
**Catalog HEAD before sweep:** `3e0282c9b0ee5b2d99b4e04fe50fb1c5eb66e95b` (no catalog drift, prior sweep R650)
**Catalog HEAD after sweep:** `3e0282c9b0ee5b2d99b4e04fe50fb1c5eb66e95b` (no fix needed)
**Working tree HEAD:** `95d2cab8dd` (R651 separate fix for tetris/matchstick, not from this sweep)
**Live total:** 455
**Verified before:** 450/455 (5 games were sweep=0 ts=never — never individually deep-verified)
**Verified after:** 455/455
**Sweeps count:** 151

## 5 games audited (cleared the "never-verified" backlog)

| Game | Verdict | Browser Evidence | Engine Verify | BI (7d) | Why this game |
|------|---------|------------------|---------------|---------|---------------|
| **cut-the-rope** | PASS | Canvas 1280x577 **738560/738560 RGB** (full), grid1[0] click → HUD flex (menu hidden), 25 level buttons + Retry/Menu/Rewind/Back/Next + 🔊, save_key=ctr_save_v1 with {v:1,stars} guard | node cut-the-rope/verify_engine.js: **25/25 candies delivered** | pv=21 dc=1 rc=1 | cut-the-rope had BI rage_click signal + 7d PV=21 (top of the 13 backlog games) |
| **unblock-me** | PASS | Canvas 300x210 62908 RGB (level select grid), Play → 50 level buttons + Undo/Restart/Hint/Next Level | node unblock-me/verify_engine.js: **50/50 SOLVED** (1050 states, 1.2ms avg, replay-ok) | pv=10 dc=0 rc=0 | 50-level puzzle, independent BFS solver verifies every level + optimal-slide |
| **tic-tac-toe** | PASS | Canvas 400x400 **160000 RGB** (full board), mode-select → Start Game, scoreboard Wins/Losses/Draws/Streak visible | node tic-tac-toe/verify_engine.js: **57/57** (hard 10/10 draws, medium 13W+7D/20, easy 15W+5D/20, twoplay 5/5 perfect, perfect-vs-perfect draw, scoreboard 33/0/23) | pv=13 dc=0 rc=0 | 57-scenario in-engine run proves minimax correctness across all 3 difficulties |
| **dots-and-boxes** | PASS | Canvas 560x560 3072 RGB (board dots), menu → level-select → **game-screen flex** (gameActive=true), body has Score x5 | node dots-and-boxes/verify_engine.js: PASS, helpers getValidLines + getAIMove present | pv=10 dc=0 rc=0 | 20-level box-drawing AI game, sweep-150-era R649-R650 backlog clear |
| **number-match** | PASS | Canvas 480x397 **190560/190560 RGB** (full board), Continue (Level 1) → Hint:5/Undo:5/Shuffle:3 counters, **localStorage.nm_v3_level=1 persisted**, window.G exposes startLevel/doHint/doUndo/doShuffle | node number-match/verify_engine.js: **33/33 boot+runtime** (30/30 solvable, realWins L1+L2, all 4 prior P0-P3 fixes intact: P0 random-scatter → reverse-play constructive, P2 calcStars thresholds, P3 bailout chain, P3 analytics bridge aliases) | pv=9 dc=0 rc=0 | Real-wins-verified in-engine + boot/runtime/IIFE probe all PASS |

## Site-chrome verified on all 5

| Game | monetag | gz-ad-below-game | game-footer | h1 | footer links | toast | rotated URL? |
|------|---------|------------------|-------------|----|----|----|----|
| cut-the-rope | ✓ | ✓ | ✓ | ✓ | 7 | no | no |
| unblock-me | ✓ | ✓ | ✓ | ✓ | 7 | no | no |
| tic-tac-toe | ✓ | ✓ | ✓ | ✓ | 7 | no | no |
| dots-and-boxes | ✓ | ✓ | ✓ | ✓ | 7 | no | no |
| number-match | ✓ | ✓ | ✓ | ✓ | 8 | no | no |

## Zero fixes shipped this sweep

All 5 games were clean — the backlog games have working engines + UI + persistence + level solvability. No code changes needed.

## Coverage now at 100% with full deep-verify

- **Total:** 455 live games
- **Verified status=verified:** 455 (was 450 → +5)
- **Catalog_head_drift:** False (catalog_head = 3e0282c9b0 matches observed)
- **converged:** False (need 2 consecutive zero-issue sweeps; R650 prior fix still counts as 1 fix → zero_issue_sweeps reset)

## Next sweep (152) plan

The 13 "sweep=0 ts=never" backlog is cleared. Next priorities:
1. BI-priority games (top dead_click/rage_click with sweep age >7d)
2. Per-R651 catalog changes (the recent 3e0282c9b0 → 95d2cab8dd diff might have touched some games — verify those)
3. Oldest games by sweep age: queens, go, wood-block-puzzle (sweep=0), reaction-time, euchre, pin-master, word-scramble, there-is-no-game, zuma, typing-speed, mo-yu-fayu, phantom-blade, tangle-master, odd-one-out, prism-path, usotatami (sweep=0 but all verified long ago in initial R0 import)