# Sweep 172 — 2026-09-08

## Games tested (5)
1. **strimko** — new addition (R460), 30/30 PASS on 3 verifiers. Found P2 layout bug (canvas clipped 39px below viewport on 1280×577 laptops). FIXED in commit b530efebf8, deployed & production-verified (canvas 357×357, clip=0).
2. **chess** — 5/5 PASS on verify_engine.js (420 legal moves, 0 king-in-check violations, scholar's mate to checkmate). Kachilu DOM-click e2→e4 works. Undo/NewGame/PlayAgain buttons all present.
3. **maze-runner** — 9/9 PASS on verify_engine.js (30/30 procedural levels walkable, 3524 steps, 0 fallbacks). Kachilu 4-canvas identified (#game-canvas 1280×516), L1-Easy renders.
4. **magic-tiles** — 30/30 PASS on verify_engine.js (procedural songs). Kachilu Daydream unlocked, tap dispatch updates HUD SCORE/COMBO/HITS.
5. **sokoban-switch** — 30/30 PASS on 3 verifiers (python structural + node BFS unique + engine BFS unique; independent and engine push counts match exactly: 3-6 pushes per level). Kachilu L1 renders with walls/crate/goal/plate/worker.

## Defects found
- **strimko P2**: canvas 524×524 starts at top=92, bottom=616 in 1280×577 viewport → bottom row clipped. Fix: constrain drawBoard() by `min(540, parent.width-8, window.innerHeight-220)`. Floor 220px to prevent canvas too small.

## Fixes shipped
- b530efebf8: fix(ux): strimko canvas fits viewport on short screens (R183)

## Coverage
- 460/460 live games
- zero_issue_sweeps: 0 (1 fix → reset)
- catalog_head: b530efebf8

## Next sweep (173) targets
- 8 skeleton entries (gomoku, logic-gates, physics-draw-puzzle, pull-the-pin, rope-rescue, tangled-yarn, tower-defense) - need re-verification
- BI hot games: /2048/, /snake/, /impossible-quiz/, /sudoku/, /bus-traffic-fever/
