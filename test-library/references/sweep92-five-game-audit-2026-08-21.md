# Sweep 92 — 5 games audited (2026-08-21)

## Picks (BI-driven priority)

Selected from BI 7d page_view (TODO games):
- **stickman-swing** (12 PV/7d, swing-physics arcade)
- **lava-rising** (11 PV/7d, vertical-climb survival)
- **neon-dash** (9 PV/7d, rhythm platformer)
- **tower-stacker-3d** (7 PV/7d, history of orphan bugs)
- **suguru** (7 PV/7d, re-audit; sweep-44 had it but state entry never recorded)

All 5 games: status:"live" in `js/games-data.js`, live confirmed on production.

## Per-game findings

### stickman-swing — PASS
- Site-chrome: footer 7 links, gz-ad-below-game present, monetag script present
- Canvas 1280×536 with 686080 RGB (full game render)
- HUD "⏸ Level 1 / 0.00s" advances (1.48s → 2.32s after 5 Space presses)
- Tutorial overlay dismisses on btnTutorialOk.click() → startLevel(1) fires
- localStorage `stickman_swing_save` persists `{version:2, levels:{}, totalStars:0, skin:0, tutorialDone:true}`
- GameOver overlay fires when stickman falls off → Retry + Menu buttons visible
- generateLevels() produces 40 levels with anchors, goals, starts; all structurally valid
- **Static verifier**: `stickman-swing/verify_engine.js` 7/7 checks PASS, 40 levels all valid
- **No P0/P1 defects**

### lava-rising — PASS
- Site-chrome: footer 8 links, gz-ad-below-game present, monetag script present
- Canvas 600×577 — game not yet running (menuScreen)
- Inline `onclick="startChallenge()"` / `startEndless()` — call startEndless() directly bypasses popunder
- Canvas jumps to 346200 RGB pixels after startEndless
- HUD visible: "Score: 0 / Height: 0m / Coins: 0"
- localStorage `lava_rising_v1` persists `{coins:0, bestEndless:0, unlocked:1, selChar:0, stars:{}, tutShown:true}`
- genLevels() generates 30 levels (6 tiers × 5) — all platforms have valid x/y/w/type, lavaSpeed 0.3+, targetH 800+
- genEndlessPlatforms() generates 28+ platforms
- **Static verifier**: `lava-rising/verify_engine.js` 12/12 checks PASS, 30 challenge levels + 28 endless platforms valid
- **No P0/P1 defects**

### neon-dash — PASS
- Site-chrome: footer 7 links, gz-ad-below-game present, monetag script present
- Canvas 800×450 with 360000 RGB (full game render)
- Click Play → startLevel(0) → game runs → gameState='dead' after ~5s (death screen with retry button)
- localStorage `neonDashSave` persists `{unlockedLevel:1, bestAttempts:{}, stars:{}, totalDeaths:3, selectedColor:0}`
- LEVELS array has 30 entries with name/color/speed/obstacles — types include block, spike, orb, portal
- **Static verifier**: `neon-dash/verify_engine.js` 10/10 checks PASS, 30 levels all valid
- **No P0/P1 defects**

### tower-stacker-3d — PASS (with note)
- Site-chrome: footer 8 links, gz-ad-below-game present, monetag script present
- Canvas 1280×720 (full game render)
- Note: `startLevel(0)` is 0-INDEXED in signature but reads `LEVELS[lvl - 1]` — calls must use 1-indexed `startLevel(1)`
- startLevel(1) → state='PLAYING'; canvas stable at 921600 RGB
- Canvas has 2× internal scale (1280×720 attr / 1025×577 display)
- localStorage `tower-stacker-3d-save` persists comprehensive `{highScores:{}, stars:{}, selectedSkin:Wood, achievements:[], totalPerfects:0, dailyCompleted:[], dailyBestScores:{}, settings:{sound:true,music:true,vibration:true}, powerups:{aim:2,extra:1,slow:3}, version:"1"}`
- LEVELS has 30 entries (6 biomes × 5 levels) — biome 0-5, target 8-25, craneSpeed 12-40, level 1-30 all valid
- **Static verifier**: `tower-stacker-3d/verify_engine.js` 11/11 checks PASS, 30 levels all valid
- **No P0/P1 defects**

### suguru — PASS
- Site-chrome: footer 8 links, gz-ad-below-game present, monetag script present
- Canvas 319×319 (puzzle grid + region borders)
- showLevels('easy') opens levelScreen with 10 cells
- pointerdown on cell 0 → startLevel('easy', 0, ...) → gameScreen active, timer 0:07→0:19 advances
- Numpad has 5 buttons (1-5)
- Canvas RGB went from 0 → 101745 after numpad + cell click
- 30/30 levels solvable (per sweep-44 audit `suguru/verify_engine.js`, re-verified today)
- **Static verifier**: `suguru/verify_engine.js` (existing, sweep 44) PASS — 30/30 prod+interactive, givens conflict-free
- **No P0/P1 defects**

## Test-gate hygiene additions (P1)

Per sweep-91 pattern, added per-game `verify_engine.js` for the 4 games that lacked them:
- `stickman-swing/verify_engine.js` (82 lines) — 7 checks PASS, 40 levels verified
- `lava-rising/verify_engine.js` (95 lines) — 12 checks PASS, 30 levels + endless verified
- `neon-dash/verify_engine.js` (78 lines) — 10 checks PASS, 30 levels verified
- `tower-stacker-3d/verify_engine.js` (113 lines) — 11 checks PASS, 30 levels verified

All use the proven balanced-brace extraction + VM stub sandbox (no eval of arbitrary user content). site-chrome checks (monetag + ad-div + footer) are present in every verifier.

## Catalog state

- catalog_head: `dc56b4c2bb` (1 commit ahead of sweep-91 state — magic-sort R444 P4/P3 from sibling cron)
- Total live games: **452** (no deletions in this sweep)
- Sweep 92 audit entries: **5** (stickman-swing, lava-rising, neon-dash, tower-stacker-3d, suguru)
- Cumulative audited: **197/452** (43.6% valid coverage)
- zero_issue_sweeps: still 0 (this sweep added new verifiers — P1 hygiene, not P0)

## Outstanding

- 255 games remain unaudited
- Next sweep (93): pick 5 from next BI priority bucket (medium PV)
- Sweep cadence: continue 5/sweep until 2 zero-issue sweeps → converged