# Sweep 173 — 2026-09-09

## Games tested (5 — all PASS)
1. **crossword** — 30/30 word puzzles via verify_engine.js (real inputs + Check button + Reveal view). Browser Kachilu gz173c: clicked Weather Watch puzzle, filled cells via 21 input.maxlen=1 fields, invoked `revealPuzzle()` + `checkWordCompletion()` → win overlay "Time: 00:00 | Hints: 0 | Stars: ★★★" → `crossword_stars_v1` saved `{0:{stars:3,time:0,date:ts}}`. Reload preserves stars. 7 footer links, ad+monetag all OK, 0 console errors.
2. **futoshiki** — 30/30 puzzles via verify.js (98 assertions; data integrity: latin/equality/hints + daily + flow). Browser Kachilu gz173d: Beginner 4×4 #1, injected full solution [[4,3,1,2],[1,2,3,4],[2,1,4,3],[3,4,2,1]] via cell.click + number-button sequence → `checkSolution()` triggers win "Perfect! ⭐⭐⭐" Stars 3/3, Time 0:49, Hints 0. 8 footer links, 0 console errors.
3. **kurodoko** — 30/30 levels via verify_engine.js (real cell clicks + Check). Browser Kachilu gz173e: clicked 3 black cells (1,3), (2,2), (2,3) per solution_grid → Check → "Correct! Puzzle solved! ★★★" Time 00:25. `kurodoko_save_v1` saved `{progress:{0:{stars:3,time:25}},lastLevel:0}`. 4-screen system (menu/levels/howto/game) clean.
4. **nyt-tiles** — 32/32 procedural boards via verify_engine.js (6 themes × 4/5/6 sizes + 14 seeds). Browser Kachilu gz173f: clicked Animals L1 → canvas 500×504 with 249,932 pixels → click 2 tiles → chainCount=1, score=20 → hint decrements 3→2. `nyt_tiles_save_v1` with proper `version:1` schema. 7 footer links, 0 console errors.
5. **glyph-quest** — 50/50 levels via verify_engine.js (isSolved at solution state). Browser Kachilu gz173g: dismissed splash, `handleClick(520,140)` → civSelect → `handleClick(540,140)` → Greek level 24 → injected 64 rotations to align with `solutionRotation` → `isSolved=true` → screen=`win` with `winAnim` advancing. 7 footer links, 0 console errors.

## Defects found
None. All 5 games clean PASS.

## Fixes shipped
None. (zero_issue_sweeps = 1 this sweep)

## Coverage
- 460/460 live games verified (catalog_head 8ecccb5b37)
- All 5 stale (>23d) games from sweep 172 backlog retested PASS
- zero_issue_sweeps: 1 (sweep 173; sweep 172 had 1 strimko fix → reset to 0 → now 1)
- 151 games remain 14+ days old (queue for sweep 174+)

## Network observations
- Kachilu CLI experienced intermittent `net::ERR_CONNECTION_CLOSED` and `Page.navigate timeout` (max ~7min transient, retry-with-longer-wait recovered). Curl to gamezipper.com HTTP/2 200 OK throughout. Likely CDN-side issue at request rate.

## Next sweep (174) targets
- Continue oldest-stale (age >=23d) sweep: bounce-bot, checkers, solitaire (R70 batch, 24d stale)
- BI hot games if any drift detected