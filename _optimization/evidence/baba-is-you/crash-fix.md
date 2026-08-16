# baba-is-you — crash fix evidence

## Before (original)
- Official playtest (`_optimization/reports/playtest-results.json`, pre-fix run): verdict **DEAD-UNCONFIRMED**, 9 × pageErrors: `Cannot read properties of null (reading 'grid')`
- Root cause: `gameState` is `null` while the chapter menu is shown (it is only created by `loadLevel()`). The global keydown handler calls `step()` and the `h` key calls `showHint()` on the menu; both dereference `gameState.grid` unconditionally → TypeError on every keypress before a level loads.
- Reproduced on staged original (`node _optimization/scripts/verify-crashfix.js baba-is-you orig`):
  ```
  TypeError: Cannot read properties of null (reading 'grid') | at step (http://127.0.0.1:PORT/baba-is-you/:578:33)   ×4
  TypeError: Cannot read properties of null (reading 'grid') | at showHint (.../baba-is-you/:629)                    (earlier run)
  ```

## Fix
`baba-is-you/index.html`
- L576 `step()`: `if(animating||!gameState)return;` — guard added (was `if(animating)return;`)
- L629 `showHint()`: `if(!gameState)return;` — guard added

## After (fixed)
- `node _optimization/scripts/verify-crashfix.js baba-is-you fixed` → `pass: true, pageErrors: 0`
  - `menuKeysNoCrash: true` (ArrowDown/Up/h/z/r/Left on chapter menu, no throw)
  - `gameContainerShown: true`; `stepCounter: "Steps: 0 -> Steps: 3"`; `movesRegistered: true` — core interaction works (chapter 1 → level 1 → arrow moves advance the step counter)
- Official re-run: see final report row.

Re-run commands:
```
node _optimization/scripts/verify-crashfix.js baba-is-you orig|fixed
node _optimization/scripts/playtest.js --only baba-is-you --dur 12 --force
```

## Official playtest re-run (post-fix)
Command: `node _optimization/scripts/playtest.js --only baba-is-you --dur 12 --force` (run together with all 8)
```
[1/8] baba-is-you DEAD started=canvas-center(640,400) inputs=25 canvasΔ=0 scoreΔ=0 raf=y err=0 19s
```
`err=0` = **pageErrors 0** (requirement met). Verdict notes: this bot feeds blind random input; menu/tutorial/level-gate driven games (baba, sliding, liquid, black, dunk, who-is) stay DEAD/DEGRADED-classified because the bot cannot navigate into gameplay — identical to their pre-fix DEAD-UNCONFIRMED classification. Real playability is proven by the deterministic state-change checks above. The updated `_optimization/reports/playtest-results.json` records pageErrors: [] for all 8 games.
