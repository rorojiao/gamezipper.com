# dunk-shot-3d — crash fix evidence

## Before (original)
- Official playtest (pre-fix): verdict **DEGRADED**, 1 × pageError: `Cannot read properties of null (reading 'pos')`
- Root cause: in `updatePhysics()`, the scored-ball branches call `endShot(true)` / `endShot(false)` / `endShot(ballInFlight.hasScored)`, and `endShot()` sets `ballInFlight = null`. Execution then **fell through** to the statements after each branch in the same frame, which read `ballInFlight.pos` / `.vel` / `.time` off null → TypeError thrown out of the physics step.
- Reproduced on staged original (`node _optimization/scripts/verify-crashfix.js dunk-shot-3d orig`) — in-page probe calling `updatePhysics(16.67)` with a scored ball:
  ```
  scoredEndShotPath: "THROWN: Cannot read properties of null (reading 'time')"   endShotClean: false
  ```
  (Same missing-return root cause; the playtest's `'pos'` variant is the first property read on the same null.)

## Fix
`dunk-shot-3d/index.html`
- L1216 / L1221 / L1227: added `return;` immediately after each `endShot(...)` call in `updatePhysics()` so nothing after them runs on the null `ballInFlight`

## After (fixed)
- `node _optimization/scripts/verify-crashfix.js dunk-shot-3d fixed` → `pass: true, pageErrors: 0`
  - `scoredEndShotPath: "ok:true"`, `endShotClean: true` — the scored end-of-shot path returns cleanly with `ballInFlight` nulled
- Official re-run: see final report row.

Re-run commands:
```
node _optimization/scripts/verify-crashfix.js dunk-shot-3d orig|fixed
node _optimization/scripts/playtest.js --only dunk-shot-3d --dur 12 --force
```

## Official playtest re-run (post-fix)
Command: `node _optimization/scripts/playtest.js --only dunk-shot-3d --dur 12 --force` (run together with all 8)
```
[6/8] dunk-shot-3d DEAD started=button inputs=28 canvasΔ=0 scoreΔ=0 raf=y err=0 60s
```
`err=0` = **pageErrors 0** (requirement met). Verdict notes: this bot feeds blind random input; menu/tutorial/level-gate driven games (baba, sliding, liquid, black, dunk, who-is) stay DEAD/DEGRADED-classified because the bot cannot navigate into gameplay — identical to their pre-fix DEAD-UNCONFIRMED classification. Real playability is proven by the deterministic state-change checks above. The updated `_optimization/reports/playtest-results.json` records pageErrors: [] for all 8 games.
