# R2 cluster rule-based duplicate candidates
> Pairs whose first move-verb function OR first 6 meta-description
> tokens match exactly. These are the most defensible deletion candidates
> from the 5 clusters I read in detail. Other cluster members are not
> listed because they had a different rule signal.
## cluster `merge-11` (11 games)
- (no two games share the same first-verb signature or first-6-noun signature)
## cluster `racing-4` (4 games)
- (no two games share the same first-verb signature or first-6-noun signature)
## cluster `sort-4` (4 games)
- (no two games share the same first-verb signature or first-6-noun signature)
## cluster `word-6` (6 games)
- (no two games share the same first-verb signature or first-6-noun signature)
## cluster `sudoku-5` (5 games)
- **[move-verb]** `thermo-sudoku` ⇔ `x-sudoku`  (sig: `if g muted return switch kind case place`)- **[move-verb]** `consecutive-sudoku` ⇔ `jigsaw-sudoku`  (sig: `if ac initaudio if ac save sound return`)
Total flagged pairs: **2**

## R2 verdict per cluster (from rule read + signature overlap)
- **merge-11**: 4 of 11 (threes / emoji-merge / atomas / hexa-2048) appear duplicate-by-rule "drop 2 same tile on grid → merge to higher tier". R2 should propose keeping **one** (threes = canonical 2048-style) and removing the other 3. The other 7 (kitty-cafe, merge-kingdom, find-n-merge, merge-sweets, coin-machine, duck-merge, veggie-merge) are distinct mechanics.
- **racing-4**: No two share a move-verb signature. **type-racer** is mislabeled (typing game, not racing). mvp=type-racer but the tag says racing. Moto-x3m + monster-truck-madness are real vehicle obstacle racers. duck-life is a minigame collection, not a pure racer. R2 should: relabel type-racer (cat=arcade) and keep all 4.
- **sort-4**: wool-sort and pocket-sort share drop-color-into-tube mechanic, but wool-sort has tubes-count 5 and pocket-sort has slots=2. Different enough. sushi-stack has stacking physics (height-based). nut-sort is the canonical color-on-bolt variant. No signature overlap.
- **word-6**: wordle / quordle / waffle all share noun tokens "free online word guessing game" — but their game logic is different (5-letter vs 4-letter-quad vs 6-letter-grid-tile). contexto shares "guess" with wordle. word-scramble + words-klondike are unrelated (anagram vs solitaire). No two games have identical move-verb or first-6-noun signature. R2: do not delete any.
- **sudoku-5**: All 5 are 9×9 Latin square + one orthogonal constraint added. R2 confirmed by rule-read. Public-domain constraint types (killer, thermo, X, consecutive, jigsaw). KEEP ALL — these are deliberate variant Sudoku family.
