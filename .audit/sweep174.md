# Sweep 174 — 2026-09-09

## Games tested (5 — all PASS)
1. **sum-swipe** — 30/30 levels via verify_engine.js (3-mode coverage). Browser Kachilu sw174-sumswipe: clicked ▶ Play → level-select screen active → L1 clicked → canvas 600×600 with 360,000 RGB pixels. Mouse drag mousedown/mousemove/mouseup dispatched (target sum-connect mechanic). localStorage gz_ab/gz_aa/gz_vid persisted. 8 footer links, ad+monetag all OK, 0 console errors.
2. **queens** — 30/30 levels via verify_engine.js (valid stored solution). Browser Kachilu sw174-queens: clicked Play Levels → level-select → L1 7×7 clicked → canvas 212×212 RGB=44,944. 8 footer links, ad+monetag all OK, 0 console errors.
3. **go** — 4/4 PASS on engine (stones + two-pass ending + 16 moves + ko). Browser Kachilu sw174-go: URL stable, h1=Go, canvas 560×560 RGB=298,096 (19×19 board). New Game/Undo/Pass/Resign/How to Play buttons. 8 footer links, ad+monetag all OK, 0 console errors.
4. **bounce-bot** — 30 platformer levels, source checks OK, engine startLevel(1) → state=PLAYING. Browser Kachilu sw174-bounce: URL stable after 1 retry (initial CDP navigate timeout, recovered on second attempt), h1=Bounce Bot, canvas 1280×577 RGB=738,534 (idle menu rendering). 21+ globals (startLevel, hitButton, drawLevel, saveGame, etc.). 7 footer links, ad+monetag all OK, 0 console errors.
5. **wood-block-puzzle** — 25/25 SHAPES placeable + bestScore roundtrip OK (savedValue=114). Browser Kachilu sw174-wbp: URL stable, h1=Wood Block Puzzle, canvas 1280×500 RGB=640,000. 6 globals (initGrid, drawCell, drawGrid, drawPieces, gameLoop, gameActive). 7 footer links, ad+monetag all OK, 0 console errors. (Note: persistence uses `setItem(KEY, bestScore)` primitive per Pitfall #40 — currently works with `parseInt || 0` load; latent risk if future sweep adds `d.v === 1` guard.)

## Defects found
None. All 5 games clean PASS.

## Fixes shipped
None. (zero_issue_sweeps: 2 — sweep 173 had 0 fixes; sweep 174 also 0)

## Coverage
- 460/460 live games verified (catalog_head 90cec65ea5)
- All 5 stale (>24d) games from sweep 172/173 backlog retested PASS
- zero_issue_sweeps: 2 (sweep 173 and sweep 174)
- 174 games remain 14+ days old (queue for sweep 175+)

## Network observations
- bounce-bot first navigation timed out at CDP layer (CDP command timed out: Page.navigate). Reopen with fresh cache-buster recovered cleanly. 4 other games loaded first-try.
- 7 skeleton entries (gomoku, logic-gates, physics-draw-puzzle, pull-the-pin, rope-rescue, tangled-yarn, tower-defense) have index.html on disk but were never individually QA'd — they were added during "test(verifiers): repair production-engine gate across 17 slugs" (commit aea12e91f4, 2026-07-29). state.games still records these as verified via earlier sweeps but they need direct browser verification — queue for sweep 176+.

## Next sweep (175) targets
- Continue oldest-stale queue: t-rex (23.7d arcade), monkey-mart (23.7d arcade), anglers (24.1d puzzle), amibo (24.1d puzzle), akari (24.1d puzzle)
