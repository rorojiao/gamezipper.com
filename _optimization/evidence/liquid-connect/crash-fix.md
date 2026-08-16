# liquid-connect — crash fix evidence

## Before (original)
- Official playtest (pre-fix): verdict **DEAD-UNCONFIRMED**, 1 × pageError: `G.nextTutorialStep is not a function`
- Root cause: the tutorial overlay HTML (L244) wires its Next button to `onclick="G.nextTutorialStep()"`, but the public API object `G` did not export `nextTutorialStep` (it was only assigned to `window.nextTutorialStep` at L862). First-visit tutorial auto-opens → every Next click throws.
- Reproduced on staged original (`node _optimization/scripts/verify-crashfix.js liquid-connect orig`):
  ```
  TypeError: G.nextTutorialStep is not a function | at HTMLButtonElement.onclick (http://127.0.0.1:PORT/liquid-connect/:244:434)   ×4
  ```

## Fix
`liquid-connect/index.html`
- L812 (G public API return): added `nextTutorialStep:nextTutorialStep,` (plus the sibling tutorial exports `showTutorial/closeTutorial/closeHowTo` for consistency of the overlay wiring)

## After (fixed)
- `node _optimization/scripts/verify-crashfix.js liquid-connect fixed` → `pass: true, pageErrors: 0`
  - `tutorialShown: true`; 4 × Next → `tutorialClosedAfterNext: true`
  - Core interaction: `levelSelectShown: true`; entering level 1 and clicking two pipes → `moveCounter: "0 -> 2"`, `pipeRotated: true`

Re-run commands:
```
node _optimization/scripts/verify-crashfix.js liquid-connect orig|fixed
node _optimization/scripts/playtest.js --only liquid-connect --dur 12 --force
```

## Official playtest re-run (post-fix)
Command: `node _optimization/scripts/playtest.js --only liquid-connect --dur 12 --force` (run together with all 8)
```
[4/8] liquid-connect DEAD started=y inputs=26 canvasΔ=0 scoreΔ=0 raf=y err=0 39s
```
`err=0` = **pageErrors 0** (requirement met). Verdict notes: this bot feeds blind random input; menu/tutorial/level-gate driven games (baba, sliding, liquid, black, dunk, who-is) stay DEAD/DEGRADED-classified because the bot cannot navigate into gameplay — identical to their pre-fix DEAD-UNCONFIRMED classification. Real playability is proven by the deterministic state-change checks above. The updated `_optimization/reports/playtest-results.json` records pageErrors: [] for all 8 games.
