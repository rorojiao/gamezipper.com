# Knotwords vs Waffle — R23 Rule-25 Distinction (DISTINCT_ACTION_VARIANT)

**Cluster 9 from Tier-3 (tag-frequency filter)**: `knotwords` ∪ `waffle`.
Jaccard on `desc`: jd = 0.077 (low). Jaccard on `tags`: jt = 0.714.
**Jaccard alone is not enough to call this a duplicate.** The high tag overlap is driven by
shared Nikoli/Puzzle/Logic/Brain/HTML5/HTML generic tags. The Rule 25 gate requires both WIN
condition AND allowed actions to match.

## Rules (source-extracted)

### Knotwords (knotwords/index.html)
- **Source**: `Knotwords` claims to be a "crossword-sudoku hybrid word logic puzzle"
  (meta description, FAQ, HowTo schema).
- **Advertised rule** (HowTo, L22-23):
  > Tap a cell. Type a letter from the bundle's letter bank. Each colored bundle shares the
  > same set of allowed letters. Fill in all cells so every row and column forms a valid
  > English word.
- **Bundle generation** (L318-367): each level builds 2-10 colored bundles (cell groups),
  each with a bank of 1-3 letters from the pool `'abcdefghilmnoprstuw'`.
- **Solution generation** (L361-364): `solution[cell.r][cell.c] = bank[i % bank.length]`. The
  solution is **the bank letters cycled across each bundle's cells** — not a real per-cell
  word assignment.
- **`isWord(w)` (L187)**: defined and checks `WORDS[w.length].includes(w.toLowerCase())`.
  **Never called by the engine** (grep: only 1 occurrence in the file, the definition itself).
- **`checkSolved()` (L419-425)**: 1:1 cell-vs-solution compare. No row/col word validity
  enforcement. Win triggers when the player types the same bank-cycled letters the engine
  pre-stored.
- **No `checkSolution` / `checkWin` / `isComplete` / `isSolved` references**: the engine
  treats the bank-cycled letters as the canonical solution and checks for exact match.

### Waffle (waffle/index.html)
- **Source**: `Waffle` is a "swap letters in a 5x5 grid to form 6 interconnected words"
  (meta description, HowTo, FAQ).
- **Puzzle generation** (L395-428): exhaustive search over the WORDS pool for 3 horizontal
  + 3 vertical 5-letter words that cross at the 12 odd-row/col positions. 3000-iteration
  budget per seed; fallback to 5 hard-coded crosses if exhausted.
- **`buildSolutionGrid(p)` (L431-436)**: lays the 3 horizontal + 3 vertical words into a
  5x5 grid using cross-intersections.
- **`scrambleGrid(sol, seed)` (L447-457)**: Fisher-Yates shuffle of the 12 active cells
  (positions where `r%2==0 || c%2==0`). Force-swap if shuffle produced the identity.
- **`isSolved(grid, sol)` (L480-483)**: compares active cells of the current grid against
  the original solution.
- **`checkWordsSolved(grid, puzzle)` (L485-490)**: explicitly compares the 3 row strings
  + 3 column strings against `puzzle.h[i]` and `puzzle.v[i]` for content-validity.

## Independent verification

### Knotwords: rule violation rate
Ran the engine's `startLevel(i)` for all 30 levels in a Node VM sandbox with
`isWord`/`startLevel`/`checkSolved`/`__game` exposed. Then for each level read `game.solution`
and asked "is each row+column a valid English word?" (using the game's own `isWord` function).
- Total rows: 146
- Total cols: 146
- Valid words: **1 row + 1 col = 0.7% pass rate**
- Of 30 levels: 0/30 produce a solution where every row + every column spells a valid
  English word.
- The engine's `checkSolved` returns true for all 30 levels when the player types the
  bank-cycled letters, so the in-game loop "works" but the puzzle has no cross-word
  integrity per the rule it advertises.

### Waffle: rule satisfaction rate
Ran `generatePuzzle(seed)` + `buildSolutionGrid(p)` + `scrambleGrid(sol,seed)` for 30 daily
seeds. For each puzzle, asked "do the row/col strings match `puzzle.h[i]` / `puzzle.v[i]`?"
- 30/30 puzzles produce a valid 5x5 word cross
- 0 row mismatches, 0 column mismatches
- 0/30 puzzles fail the scramble identity check (every scramble actually scrambles)

## Rule 25 verdict

| Axis | Knotwords | Waffle | Match? |
|------|-----------|--------|--------|
| Win condition | Every cell's player letter equals engine's bank-cycled solution letter | Every active cell's player letter equals original (pre-scramble) solution letter | **DIFFERENT** (knotwords is a partial-info fill; waffle is a swap-to-restore) |
| Active cells | All `grid[r][c]===1` cells (variable per level, 9-49) | 12 fixed cells (positions where `r%2==0 \|\| c%2==0`) | **DIFFERENT** (knotwords fills a full bundle partition; waffle edits a 12-cell subset) |
| Player action per move | Tap a cell → type a letter from the bundle's bank (1 cell-letter assignment) | Tap two cells → swap their letters (1 swap of 2 cells) | **DIFFERENT** (cell-letter placement vs pair swap) |
| Feedback channel | Per-cell letter (correct/incorrect highlighted only on match; no row/col status) | Per-cell green/yellow/gray on a 9-color Wordle-style scale + per-word "solved" badge | **DIFFERENT** |
| Constraint surface | NxN variable-size grid with row+col word validity (advertised but unenforced) | 5x5 fixed cross of 6 known words (3 across + 3 down) with 4 letter-crossings | **DIFFERENT** |
| State machine | Place letter → check cell → repeat | Tap letter A → tap letter B → check swap → repeat | **DIFFERENT** |
| Move count budget | Unlimited (free-play) | 15 swaps (with star rating based on count) | **DIFFERENT** |

**Verdict**: DISTINCT_ACTION_VARIANT (per Rule 25: "either axis mismatch = distinct variant;
KEEP BOTH"). Knotwords and waffle share the word-game family but have different win
conditions, different active cells, different action verbs, different state machines, and
different feedback channels. A player who has mastered waffle still needs to learn an
entirely different game to play knotwords (and vice versa).

## P0 finding (knotwords)

**Knotwords ships with a P0 data-quality defect**: the engine does not enforce the row/column
word validity rule it advertises. The player can "win" by typing the bank-cycled letters,
but the resulting grid does not satisfy the constraint the HowTo/FAQ/description promises.
Independent validator: 0.7% row+col valid-word rate across 30 levels.

- `isWord` is defined at L187 but **never called** (grep `isWord` = 1 hit, the definition
  only).
- `checkSolved` (L419-425) is a 1:1 cell-vs-solution compare; no word validity check.
- This is a sibling defect to the snake-pit R1 finding ("sol doesn't match the clues") and
  the tapa R22 finding ("29/30 sol rows violate the canonical Tapa clue rule") — both
  precedent cases where the engine compares player state to a precomputed `sol` array
  without independently validating that `sol` satisfies the rule.

**Action**: queue for a separate knotwords-specific fixup (not part of this dedup sweep).
The fix is to add a real crossword-bundle puzzle generator that produces solvable puzzles
where every row+col is a valid English word, then wire `isWord` into the win check. The
current 30 hand-baked levels are not solvable in the spirit of the rule they advertise.

## Production state

- `knotwords` ships to production with fabricated `aggregateRating` 4.8/120 (also a P0 SEO
  spam — separate from this rule defect). R14/R22 sweeps documented that catalog had ~289
  games with this field; knotwords is one of the unswept games.
- `waffle` is free of the aggregateRating issue (the validator probe confirmed
  `aggregate:false` for the production page).
- Both games' pages return HTTP 200 with footer+ad-div+monetag+gz-sr-only h1.
- 30d BI engagement: knotwords 11 events / 3 UV; waffle 15 events / 3 UV (both sub-noise
  on the catalog; engagement not a tiebreaker here since the rule difference is decisive).

## Conclusion

**KEEP BOTH** knotwords and waffle. They are not duplicates under Rule 25. The cluster
flagged by Jaccard/tags is a false positive driven by shared generic tags. Knotwords has
a separate P0 data-quality finding (enqueued for a knotwords-specific fixup) that has no
bearing on the waffle game.
