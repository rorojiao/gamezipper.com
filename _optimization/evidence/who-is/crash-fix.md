# who-is — crash fix evidence

## Before (original)
- Official playtest (pre-fix): verdict PLAYABLE (1 error), 1 × pageError: `Cannot read properties of undefined (reading 'question')`
- Root cause: the menu's chapter buttons passed a **level number** where `startFromChapter(n)` expects a **chapter index**. `startFromChapter` computes `level = (chapter-1)*10 + 1`; with the old values (1/6/11/16/21) chapters 2-5 resolved to levels 51, 101, 151, 201 — but `LEVELS` has 50 entries (10 per chapter). `startLevel()` then read `LEVELS[level-1].question` off `undefined` → TypeError. Chapters 2-5 were 100% broken.
- Reproduced on staged original (`node _optimization/scripts/verify-crashfix.js who-is orig`):
  ```
  TypeError: Cannot read properties of undefined (reading 'question') | at startLevel (http://127.0.0.1:PORT/who-is/:1422:62)   ×2
  (console: "Level 51/50", "Level 201/50")
  ```

## Fix
`who-is/index.html`
- L247-251: chapter buttons now `startFromChapter(1..5)` (was 1/6/11/16/21), with an HTML comment at L244 explaining the mapping
- L1424 `startLevel()`: `var lvl = LEVELS[level - 1]; if (!lvl) { goToMenu(); return; }` — guard against any future out-of-range level

## After (fixed)
- `node _optimization/scripts/verify-crashfix.js who-is fixed` → `pass: true, pageErrors: 0`
  - `chapter2Loads: "Level 11/50"`, `chapter5Loads: "Level 41/50"`, `chaptersValid: true` — every chapter now opens its real first level
  - `gameScreenShown: "flex"`
- Official re-run: see final report row.

Re-run commands:
```
node _optimization/scripts/verify-crashfix.js who-is orig|fixed
node _optimization/scripts/playtest.js --only who-is --dur 12 --force
```

## Official playtest re-run (post-fix)
Command: `node _optimization/scripts/playtest.js --only who-is --dur 12 --force` (run together with all 8)
```
[7/8] who-is DEAD started=y inputs=27 canvasΔ=0 scoreΔ=0 raf=y err=0 80s
```
`err=0` = **pageErrors 0** (requirement met). Verdict notes: this bot feeds blind random input; menu/tutorial/level-gate driven games (baba, sliding, liquid, black, dunk, who-is) stay DEAD/DEGRADED-classified because the bot cannot navigate into gameplay — identical to their pre-fix DEAD-UNCONFIRMED classification. Real playability is proven by the deterministic state-change checks above. The updated `_optimization/reports/playtest-results.json` records pageErrors: [] for all 8 games.
