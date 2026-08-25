# Sweep 93 — 5-Game Audit (2026-08-21)

**Sweep ID**: 93  
**Catalog head**: `dc56b4c2bb`  
**Live count**: 452  
**Valid coverage after sweep**: 202 / 452 (44.7%) — was 197/452 (43.6%)  
**Test library version**: 1.226.0

**Games audited**: waffle, killer-sudoku, spider-solitaire, mancala, tiny-fishing

---

## waffle (puzzle)

**Verdict**: PASS

### Structural (offline)
- WORDS dictionary: 1931 5-letter words
- `generatePuzzle(seed)`: 50/50 seeds produce self-consistent puzzles (every h/v intersection has matching letter in solution grid)
- Solution grid is built from `h[3] + v[3]`; only 4 inactive cells (1,1), (1,3), (3,1), (3,3) carry empty strings; `isSolved()` correctly checks only active cells
- `scrambleGrid` Fisher-Yates-shuffles letters across active cells using `mulberry32(seed+9999)`; correct unless scrambled == identity (then swap cells 0,1)

### Browser (Kachilu)
- Practice Mode button click → state.mode='practice', state.puzzle populated with h[3] + v[3]
- 25 DOM cells rendered (5×5 grid); solution shows " T E" pattern for empty inactive cells
- Click cell A + cell B → state.grid swaps + state.swapsUsed=1
- Solution injection + renderGrid() → `isSolved(state.grid, state.solution) = true` + `checkWordsSolved = [T,T,T,T,T,T]`
- localStorage key: `waffle_gz_v2` (version-guarded) — saves `{version:2, settings, stats}`; survives reload (state.stats.played=42 confirmed persisted)

---

## killer-sudoku (puzzle)

**Verdict**: PASS

### Structural (offline)
- `generatePuzzle(diff, idx)` for d ∈ {0,1,2,3} × 30 = **120 puzzles**, plus 1 daily
- `generateSolvedGrid` uses backtracking with shuffled candidate order (Mulberry32 seeded)
- `generateCages` partitions 81 cells into cages (minSize 1/2/2/3, maxSize 2/3/4/5 by difficulty); cells contiguous, sums match solution values
- 120/120 puzzles pass: all 81 cells covered exactly once, all solutions valid (rows/cols/3x3 boxes each contain 1-9 exactly once)
- Daily seed = `Math.floor(Date.now() / 86400000)` — same puzzle for everyone on a given day
- `checkWin()` compares G.cells vs G.puzzle.solution element-by-element
- `endGame(true)` writes `ks-done-{diff}` array of completed puzzle indices

### Browser (Kachilu)
- `.diff-btn[data-diff="0"]` click → showPuzzleSelect populates 30 `.puzzle-btn` for Easy
- `.puzzle-btn` (index 0) click → menu-overlay.classList.add('hidden'), `startGame()` invoked
- Canvas 288×288 with 82,944 non-zero pixels; cage borders drawn as dashed lines, cage sums as labels
- Click cell (0,0) area + number-5 button → `placeNumber(5)` called → mistake (cell needed 6) → mistakes=1
- localStorage keys: `ks-board` (full state: cells, notes, mistakes, hintsUsed, timerSec, undoStack, puzzleIndex, ts), `ks-last` (resume hint), `ks-done-0` (completion list)
- `btn-undo` click → mistakes=0 (correctly restores previous value)

---

## spider-solitaire (card)

**Verdict**: PASS

### Structural (offline)
- Standard 2-deck game: 52×2 = 104 cards. Difficulty 1 (1-suit) = 8 K-A same-suit sequences to win
- `initGame()`: 10 columns × (6,6,6,6,5,5,5,5,5,5) cards = 54 in columns + 50 in stock = 104 ✓
- `checkCompletedSequences()`: scans each column for last 13 cards forming K→A same-suit run; if found, removes them and increments `completedSequences`; `handleWin()` fires at 8 sequences
- `deal()`: pops one card per column from stock, flips face-up, decrements stockDeals; auto-checks completed sequences after
- Standard move rules: descend value + same suit; runs of same-suit any length movable

### Browser (Kachilu)
- newGameBtn click → initGame() runs
- Canvas 1235×500 with 617,500 non-zero pixels (cards rendered with suits/ranks)
- Stats update: scoreValue=500 (initial), movesValue=0, timeValue=00:00→00:02 (timer ticks), completedValue=0/8
- Difficulty buttons present (1-suit/2-suit/4-suit modes)
- localStorage `spiderSolitaireGame` (4796 chars) — full gameState with 10 columns × cards, stock[50], gameStarted=false (until first move), elapsedSeconds, isFirstPlay
- All 3 site-chrome present (footer, ad-div, monetag)

---

## mancala (board)

**Verdict**: PASS (P3 observation — no mid-game state persistence)

### Structural (offline)
- Board: 14 cells = 6 P1 pits + 1 P1 store + 6 P2 pits + 1 P2 store
- Kalah rules correctly implemented in `makeMove()`:
  - Sow counter-clockwise starting from clicked pit
  - Skip opponent store (continue around)
  - Extra-turn if last stone lands in own store
  - Capture: last stone lands in empty own pit AND opposite pit has stones → capture both into own store
- Game-over: when one side has no valid moves → collect remaining stones to opposite store → compare stores for winner
- 100/100 random games terminate properly (no infinite loops)
- AI uses minimax with alpha-beta pruning + depth-based randomness

### Browser (Kachilu)
- Canvas 800×350 with 279,906 non-zero pixels (pits + stones + stores rendered)
- Tutorial overlay shown on first load → "Got it!" dismisses (mancala_tutorial_seen='1')
- newGameBtn click → p1Score=0, p2Score=0, p1Indicator visible (P1 turn)
- Click pit 3 (x=503, y=280 in board coords) → p1Score 0→1 (stone reached own store), p2Score 0→1 (capture!), turn flips to P2
- AI responds automatically when in 'ai' mode (default)
- **P3 observation**: Mancala does NOT persist mid-game state. Only stats (`mancala_stats_v1`) and tutorial flag are saved to localStorage. In-memory `this.history` (max 50) provides undo only. Reload loses active game. This is a design choice common to local board games, not a bug — flagged as P3 UX observation.

### Other chrome
- 3 site-chrome present (footer, ad-div, monetag)
- Stats overlay button works
- Undo button functional

---

## tiny-fishing (casual)

**Verdict**: PASS

### Structural (offline)
- 30 fish across 5 zones: Shore [0-50m], Reef [50-150m], Ocean [150-300m], Deep Sea [300-450m], Abyss [450-600m]
- 4 upgrade tracks: rod (hook cap), line (max depth), bait (spawn rate), boat (offline earnings)
- 15 achievements (First Catch through Master Cataloguer / Ocean Tycoon)
- 4-step tutorial: Welcome → Reel It In → Earn & Upgrade → Build Your Collection
- Core loop: cast → hook sinks → fish collision detection (Math.hypot(hx-fx, hy-fy) < fish.size + 12) → reel up → sellCatch → upgrade
- `sellCatch()`: increments caught[idx], totalCaught, dailyCaught, catches legendary, adds coins, updates peakCoins, checks achievements
- Idle offline earnings: only fires if elapsed > 60s AND boat level > 0

### Browser (Kachilu)
- Canvas 1280×536 with 686,080 non-zero pixels (water gradient + boat + hook + fish)
- 5 sibling tabs: Fish, Upgrade, Aquarium, Goals, Stats (casual-idle archetype signature)
- Tutorial overlay on first load → 4× "Got it!" clicks → tutorialDone=true, overlay removed
- Canvas click (x=640, y=268) → handleAction() → tutorialDone branch → hookState='sinking' → hookSpeed=80
- After ~8s wait: totalCasts 0→2→3, coins=45, maxDepth=50m, caughtSpecies=2
- localStorage `tinyFishingSave` v=1 (version-guarded) — full state: coins, totalCasts, totalCaught, dailyCaught, maxDepth, peakCoins, speciesFound, caughtLegendary, caught{}, upgrades{}, tutorialDone, tutorialStep, achievements{}, lastSave, version
- **Reload preserves everything**: coins=45, totalCasts=3, tutorialDone=true, caughtSpecies=2 ✓

---

## Summary

| Slug | Cat | Verdict | Bug Class |
|------|-----|---------|-----------|
| waffle | puzzle | PASS | — |
| killer-sudoku | puzzle | PASS | — |
| spider-solitaire | card | PASS | — |
| mancala | board | PASS | P3 (no mid-game save) |
| tiny-fishing | casual | PASS | — |

No P0/P1/P2 bugs found. Only one P3 observation noted on mancala (design choice, not bug).

**Coverage**: 202/452 = 44.7% (up from 197/452 = 43.6%)

**Next sweep (94)**: pick 5 more unaudited games from live catalog (255 remain).