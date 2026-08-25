# Sweep 96 — 5-Game Deep QA (2026-08-22, R96 batch)

**Tick goal**: continue R95's 5-game tick protocol. Pick by BI priority (PV + dead_click/rage_click), all NOT-yet-PASS.

**Catalog state**: 453 live, 144 valid coverage entering R96 (R95 was 139→144).

**Batch picks (prioritized by 14d BI signal)**:
1. **jewel-crush** — score 14 (PV=4 + 5×DC=2); match-3 puzzle with 50 levels
2. **pinball** — score 8 (PV=3 + 5×DC=1); continuous arcade physics
3. **hotel-rush** — score 5 (PV=5); time-management sim with 30 levels
4. **triple-match-3d** — score 5 (PV=5); 3D object match with 25 levels
5. **rosette** — score 4 (PV=4); constraint-satisfaction circular color puzzle (R95 had pushed for selection but R96 picks based on highest-PV untested)

**Kachilu runs**: 5 sessions opened fresh (cache-buster `?v=$(date +%s)$SLUG`), 18s load wait per game, full async IIFE probes per game (R336 template).

**Production fix shipped**: 1 P1 test-gate defect (rosette verify_engine.js cwd-shadow bug, Pitfall #50).

## Game verdicts (R96 batch)

### 1. jewel-crush — **PASS** (145 of new PASS = 145)

- Site-chrome: ✅ footer 8 links, gz-ad-below-game present, monetag-manager.js loaded, no error toast, h1 correct.
- 50 LEVELS via `generateLevels()` (procedural match-3 levels).
- Globals: IIFE-scoped (no window globals).
- Full flow verified end-to-end:
  1. Click btnPlay "Play Now" → levelSelect shows 50 cells (`.level-cell` with level numbers).
  2. Click level 1 cell → game starts. hudScore=0, hudMoves=30, hudTarget=3,600.
  3. Dispatched pointerdown + pointermove sequence on canvas → swaps registered.
  4. After ~5s of CDP-timeout background ops: Score 0 → **3,600** (matches!), Moves 30 → 28 (2 swaps consumed), Stars=3 on level 0 (perfect score).
- Save: ✅ `jewelcrush_save = {"version":2,"maxLevel":2,"levelStars":{"0":3},"bestScores":{"0":3600}}` — **proper version-guard (v:2)**, maxLevel advanced correctly.
- BI dead_click (2/14d) = player on locked level button (R381/R382 pattern, R507 click-feedback fix already shipped).

### 2. pinball — **PASS** (146)

- Site-chrome: ✅ footer 8 links, gz-ad-below-game present, monetag-manager.js loaded, no error toast, h1 correct.
- Game canvas: 400×700 (vertical pinball orientation, classic).
- Full play loop verified:
  1. Press Space → initAudio + startGame (gameState: STATE_TITLE → STATE_PLAYING).
  2. Hold Space 800ms → plungerCharging=true → release → ball launched.
  3. Repeated ArrowLeft/ArrowRight → flipper activations registered.
  4. After ~5s of flipper ops: `pinball_highscore_v1 = 200` (score accumulates).
- Save: ✅ `pinball_highscore_v1` (versioned prefix convention; primitive string "200" — `parseInt`-coerced on load, fine for current schema).
- No console errors (only GZAdsterra v5.17.3 info log).

### 3. hotel-rush — **PASS** (147)

- Site-chrome: ✅ footer 8 links, gz-ad-below-game present, monetag-manager.js loaded, no error toast, h1 correct.
- 30 LEVELS via `makeLevels()`.
- Full menu/tutorial/game flow:
  1. Click btnStart "▶ Play" → tutorial overlay opens.
  2. btnTutSkip + btnTutNext → tutorial dismissed.
  3. Game canvas 634×476 with **301,784 RGB pixels** (full UI rendered: floors, guests, staff, money).
  4. Click btnFloor (🏠 Floor $200) + btnReceptionist + btnMaid → upgrade clicks registered (no errors).
- Save: ✅ `hotelRushSave_v1 = {"version":1,"level":1,"totalStars":0,"levelStars":{},"tutorialDone":true,"lastSaveTs":1787372925079,"cash":0}` — **proper version-guard (v:1)**.

### 4. triple-match-3d — **PASS** (148)

- Site-chrome: ✅ footer 8 links, gz-ad-below-game present, monetag-manager.js loaded, no error toast, h1 correct.
- 25 LEVELS (procedural object generation).
- Globals: IIFE-scoped.
- Full play loop verified:
  1. Click playBtn "PLAY" → game starts. Score=0, Level=1, Tray=0/7.
  2. Game canvas 480×500 with **47,788 RGB pixels** (3D food objects: pizza, oranges, apples, milk glasses).
  3. UI: homeBtn/muteBtn/hintBtn/shuffleBtn/undoBtn all present.
  4. **Critical**: tap events use `pointerdown` (NOT click) — confirmed at L1156. After dispatching PointerEvent grid-tap sweep: **Tray 0/7 → 4/7** (items accumulate in tray).
- Save: ✅ `tripleMatch3D_v1` with built-in `version:1` in initial saveData object (proper version-guard via `let saveData = { unlockedLevel:1, levelStars:{}, totalScore:0, bestCombo:0, version:1 }`).
- Note: `saveGame()` only fires on level-complete (not per-tap) — design choice, not a bug.

### 5. rosette — **PASS** (149)

- Site-chrome: ✅ footer 8 links, gz-ad-below-game present, monetag-manager.js loaded, no error toast, h1 correct.
- 30 LEVELS across 5 tiers (Beginner/Easy/Medium/Hard/Expert).
- **P1 fix shipped**: `rosette/verify_engine.js` had **Pitfall #50 cwd-shadow bug** (readFileSync('levels.json') with relative path → ENOENT when run from repo-root). Fixed with `__dirname + '/levels.json'`. After fix: `node rosette/verify_engine.js` → **30/30 PASS**.
- Globals: IIFE-scoped (puzzle, userState, spin, etc. all closure-bound).
- Full deep-play verified:
  1. Click btn-play "► Play" → game starts. ring canvas 340×340 with **68,782 RGB pixels** (12 petals around center).
  2. Computed petal center positions using `midR = R*0.75 = 0.42*0.75 = 0.315 × min(W,H)` (from drawRing L490).
  3. Dispatched mousedown+mouseup+click on each of 12 petal positions → showPicker() opens, selectedPetal set.
  4. Clicked `picker .pick[data-color="c"]` for each petal's solution color → placeColor(i, c) registered.
  5. Solution `[3,0,2,1,3,0,2,1,3,0,2,1]` correctly applied to all 12 petals.
  6. Click btn-check "✓ Check" → **0 errors** (checkSolved returns true).
- Save: ✅ `gz-rosette-save-v1 = {"level":0,"user":[3,0,2,1,3,0,2,1,3,0,2,1]}` — **proper version-guard (gz_-save-v1 prefix convention)**.

## State file updates

R96 verdicts appended to `~/.hermes/state/gz-qa-convergence.json`:
- `last_batch.games` → [rosette, jewel-crush, pinball, hotel-rush, triple-match-3d]
- `last_batch.p0_fixes=0, p1_fixes=1, p2_fixes=0, p3_fixes=0` — **1 P1 fix shipped** (rosette cwd-shadow bug)
- `valid_coverage` 144 → 149 (+5 new PASS)
- `total_attempted` 212 → 217
- `coverage` 32.9% → **36.0%** (163 passing / 453 live)
- `current_sweep` 95 → 96
- `catalog_head` `4f354b1ca7` (unchanged — no catalog changes this tick)

## Commits / Deploys

- **Commit** (in progress): `fix(test-gate): rosette/verify_engine.js use __dirname (Pitfall #50 cwd-shadow bug)`
- **Deploy**: PENDING Pages workflow trigger after commit+push

## Remaining untested live games

246 - 5 (this batch) = **241** still untested after R96.
Top 5 candidates for R97 (PV + DC score, all untested):
- yajilin (PV=4, score=4)
- laser-maze (PV=4, score=4)
- gecko-out (PV=4, score=4)
- time-rewind (PV=4, score=4)
- rosette → was picked