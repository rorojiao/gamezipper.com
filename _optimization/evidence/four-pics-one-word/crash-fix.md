# four-pics-one-word — crash fix evidence

## Before (original)
- Official playtest (pre-fix): verdict **DEGRADED**, 10 × pageErrors: `H is not defined`
- Root cause: `drawSettings(ctx)` used `H` (`const cy=H/2-40;`, orig L1690) without defining it — its first line was `const W=this.W,cx=W/2;`. The render loop's `case 'settings': this.drawSettings(ctx)` then throws `ReferenceError` **every animation frame** once the settings screen opens → settings screen is a permanent crash loop.
- Reproduced on staged original (`node _optimization/scripts/verify-crashfix.js four-pics-one-word orig`, settings opened via menu tap):
  ```
  ReferenceError: H is not defined | at Game.drawSettings (http://127.0.0.1:PORT/four-pics-one-word/:1696:10)   ×134
  ```

## Fix
`four-pics-one-word/index.html`
- L1686: `const W=this.W,H=this.H,cx=W/2;` — added the missing `H=this.H` binding (one-line minimal fix)

## After (fixed)
- `node _optimization/scripts/verify-crashfix.js four-pics-one-word fixed` → `pass: true, pageErrors: 0`
  - `settingsOpened: {opened: true, taps: 1}` (pixel-proven: white back-arrow at canvas (27..40, 33..37))
  - `settingsScreenNoCrash: true`, `settingsAnimating: true` (screen renders and keeps animating)
- Engine verifier (fix touches shared draw code): `node four-pics-one-word/verify_engine.js` →
  ```
  four-pics-one-word in-engine verification: 79/79 levels, verdict=PASS
  {"pass":79,"fail":0,"total":79,"failIdx":[],"verdict":"PASS"}
  ```

Re-run commands:
```
node _optimization/scripts/verify-crashfix.js four-pics-one-word orig|fixed
node four-pics-one-word/verify_engine.js
node _optimization/scripts/playtest.js --only four-pics-one-word --dur 12 --force
```

## Official playtest re-run (post-fix)
Command: `node _optimization/scripts/playtest.js --only four-pics-one-word --dur 12 --force` (run together with all 8)
```
[2/8] four-pics-one-word DEGRADED started=canvas-center(640,400) inputs=25 canvasΔ=1 scoreΔ=0 raf=y err=0 20s
```
`err=0` = **pageErrors 0** (requirement met). Verdict notes: this bot feeds blind random input; menu/tutorial/level-gate driven games (baba, sliding, liquid, black, dunk, who-is) stay DEAD/DEGRADED-classified because the bot cannot navigate into gameplay — identical to their pre-fix DEAD-UNCONFIRMED classification. Real playability is proven by the deterministic state-change checks above. The updated `_optimization/reports/playtest-results.json` records pageErrors: [] for all 8 games.
