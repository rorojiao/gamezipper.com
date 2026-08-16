# sliding-puzzle — crash fix evidence

## Before (original)
- Official playtest (pre-fix): verdict **DEAD-UNCONFIRMED**, 4 × pageErrors: `Cannot read properties of undefined (reading 'x')`
- Root cause: `drawTutorial()` (L1212, sets `state.tutorialBtn` at L1251) was **never called** by the render loop — the loop's screen switch had title/levelSelect branches but no `tutorial` branch. So on first visit (tutorial screen shown by default) `state.tutorialBtn` stayed `undefined` and any click hit `state.tutorialBtn.x` at L1268 → TypeError. Game unplayable on first visit.
- Reproduced on staged original (`node _optimization/scripts/verify-crashfix.js sliding-puzzle orig`, "Got It!" click):
  ```
  TypeError: Cannot read properties of undefined (reading 'x') | at handleClick (http://127.0.0.1:PORT/sliding-puzzle/:1268:30)
  ```

## Fix
`sliding-puzzle/index.html`
- L1486-1489 (render loop): added missing branch `else if(state.screen==='tutorial'){ drawTutorial(); }` (root cause)
- L1268-1269 (`handleClick`): defensive `if(state.tutorialBtn&&...)` null-guard on the existing condition

## After (fixed)
- `node _optimization/scripts/verify-crashfix.js sliding-puzzle fixed` → `pass: true, pageErrors: 0`
  - `gotItClickNoCrash: true` (tutorial dismiss now works, advances to title)
  - Core interaction proven with state change: pixel-scanned 3×3 board, empty cell at [2,0], clicked neighbour tile [2,1] → `emptyCellAfterSlide: [2,1]`, `emptyCellMoved: true` (the tile slid into the empty cell)
  - `persistedTutorialSeen: true` (localStorage flag written by the fixed flow)

Re-run commands:
```
node _optimization/scripts/verify-crashfix.js sliding-puzzle orig|fixed
node _optimization/scripts/playtest.js --only sliding-puzzle --dur 12 --force
```

## Official playtest re-run (post-fix)
Command: `node _optimization/scripts/playtest.js --only sliding-puzzle --dur 12 --force` (run together with all 8)
```
[3/8] sliding-puzzle DEAD started=canvas-center(640,462) inputs=25 canvasΔ=0 scoreΔ=0 raf=y err=0 38s
```
`err=0` = **pageErrors 0** (requirement met). Verdict notes: this bot feeds blind random input; menu/tutorial/level-gate driven games (baba, sliding, liquid, black, dunk, who-is) stay DEAD/DEGRADED-classified because the bot cannot navigate into gameplay — identical to their pre-fix DEAD-UNCONFIRMED classification. Real playability is proven by the deterministic state-change checks above. The updated `_optimization/reports/playtest-results.json` records pageErrors: [] for all 8 games.
