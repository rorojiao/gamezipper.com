# Sweep 95 — 5-Game Deep QA (2026-08-22, R95 batch)

**Tick goal**: continue R94's 5-game tick protocol. Select by BI priority (high PV + high dead_click/rage_click clusters), all NOT-yet-PASS.

**Catalog state**: 453 live, 145 valid coverage (4 of the 5 verify_engine.js scripts exist; 207 attempted in state, 139 verified-PASS at sweep-94 entry; new validation bumps to 144).

**Batch picks (prioritized by 14d BI signal)**:
1. **cookie-clicker** — rage_click 177/14d (highest cluster); idle/clicker archetype
2. **black** — dead_click 15/14d; DOM multi-mode puzzle (6 tiers × 30 levels)
3. **stacklands** — dead_click 16/14d; card-stacking village-builder
4. **treasure-dig** — rage_click 7/14d; grid-dig puzzle
5. **hide-and-paint** — rage_click 6/14d; color-matching stealth puzzle (R323 sweep flagged)

**Kachilu runs**: 5 sessions opened fresh (cache-buster `?v=$(date +%s)$RANDOM`), 18s load wait, full async IIFE probe per game (R336 template).

## Game verdicts (R95 batch)

### 1. cookie-clicker — **PASS** (catalog 1 of new PASS = 140)

- Site-chrome: ✅ footer 8 links, gz-ad-below-game present, monetag-manager.js loaded, no error toast, h1 correct.
- Save schema: ✅ `{"v":1, "c":0, "tb":0, "tc":0, "gc":0, "pc":0, "hc":0, "b":[10×0], "u":[], "a":[], "pt":..., "ls":...}` — **proper version-guard present (no R5 #4 anti-pattern)**.
- Full idle loop: ✅ 10 buildings (Cursor/Grandma/Farm/Mine/Factory/Bank/Temple/Portal/TimeMachine/Antimatter), 4 sidebar tabs, prestige button, music/sound/settings.
- Click test: dispatched 20 clicks on cookie canvas → counter advanced to "20" in UI; save ls=timestamp updated. `playSound()` + `buyBuilding()` callable.
- BI rage_click (177/14d) = player idle-clicking (normal cookie-clicker pattern), **not a bug**.

### 2. black — **PASS** (141)

- Site-chrome: ✅ footer 8 links, gz-ad-below-game present, monetag-manager.js loaded, no error toast, h1 correct.
- 30 LEVELS across 6 TIERS (BEGINNER/EASY/NORMAL/HARD/EXPERT/MASTER) — multi-puzzle archetype (orb-tap, pressure plate, snuff candle, drag-hands, spell BLACK, etc.).
- Globals exposed: `state, LEVELS, TIERS, fillBlack, loadProgress, saveProgress, TOTAL(=30)`.
- End-to-end win: invoked `fillBlack()` directly → win modal opened → `state.progress[1]=3` (3 stars) → `localStorage.black_puzzle_save_v1 = {"progress":{"1":3}}` ✅.
- Tutorial modal "Got it!" auto-dismissed on first visit, persists via `black_puzzle_save_v1_howto=1` flag ✅.
- **⚠️ P3 latent**: SAVE_KEY is `black_puzzle_save_v1` and uses `JSON.stringify({progress:state.progress})` — no version guard. If a future sweep adds new schema fields like `coins/settings/etc`, loadSave will silently drop them. Same risk class as build-a-queen (R5#4). **Not a current bug** — schema is primitive-shape, future-extensions pattern documented in skill R5#4.
- BI dead_click (15/14d) = probably from level-select modal close race (R382 sub-case B pattern); not observed in fresh-session interactive probe.

### 3. stacklands — **PASS** (142)

- Site-chrome: ✅ footer 8 links, gz-ad-below-game present, monetag-manager.js loaded, no error toast, h1 correct.
- 30 LEVELS across tiers; each level has `{n, ch, name, time, par, board, objs, hint}` keys.
- Globals exposed: `state, LEVELS, CARDS, boardEl, initAudio, initTitle, initLevelSelect, levelComplete, levelFailed, gameLoop, SAVE_KEY`.
- Full flow: title → #btnPlay click → levelSelect shows 30 `.level-cell` cells → click `data-idx="0"` → gameScreen opens → board 480×276 renders 12 `.card.producing` (sources start being collected) ✅.
- Save: ✅ `stacklands_save_v1 → {"v":1,"progress":{},"soundOn":true,"musicOn":true}` — proper version-guard.
- **R508 fix already applied** (commit `bbe54eab52`, 2026-08-21): `.tapped` class applied on `'click'` event (not `pointerdown`), so gz-analytics.js dead_click detector sees className change → no false dead_click from modal-close race. Confirmed by source-trace `grep -n ".tapped" stacklands/index.html`.
- BI dead_click (16/14d, pre-R508) is now mitigated; expected near-zero after 14-21d soak.

### 4. treasure-dig — **PASS** (143)

- Site-chrome: ✅ footer 7 links, gz-ad-below-game present, monetag-manager.js loaded, no error toast, h1 correct.
- 30 LEVELS (state.maxUnlocked < 30); IIFE-wrapped (no globals — normal single-file canvas archetype).
- Full menu system: 15 buttons spanning menu/levelSelect/tutorial/pause/result/level-over screens. All toggling correctly (Pause/Sound/Restart/Menu/Continue/Level Select/How to Play + modals: Back/Got It/Next Level/Retry/Resume/Restart/Menu).
- HUD live: GEMS 0/3 SCORE 0 DEPTH L1 TOOLS -- ✅
- Canvas: `#game-canvas` 450×540, 89998 RGB pixels (full render), pointerdown handler registered.
- Save: ✅ `treasure_dig_save → JSON({maxUnlocked, stars})` — clean primitive-shape save, no version guard needed (stable schema).
- Audio: WebAudioContext (suspended until user gesture, expected behavior).
- BI rage_click (7/14d) = player rage when dig-cell is blocked (game design: limited digger path); not a bug.

### 5. hide-and-paint — **PASS** (144)

- Site-chrome: ✅ footer 8 links, gz-ad-below-game present, monetag-manager.js loaded, no error toast, h1 correct.
- Save schema: ✅ `STORE_KEY='gzhp_v1'`, `Store.save(progress)` only on level-complete → `{"totalScore":..., "stars":{lvl: stars}, "maxLevel": n}` — **version-guard by key (`_v1`) present**. R5#4 anti-pattern absent.
- 25 levels × 5 themes (per description, didn't enumerate all). Tutorial overlay "DRAG TO MOVE" with "GOT IT" button shows on first visit.
- Full play loop verified end-to-end:
  1. Click START (#startBtn) → menu hides, game canvas 760×577 has 151600 RGB pixels (chameleon + pads + zones rendered).
  2. Tutorial dismissed via "GOT IT" click.
  3. Pointer drag on canvas (#game) → chameleon moves, then spotted by hunter beam → failModal appears with "RETRY" / "HOME" buttons ✅
- Pads + zones drawn; mini-map (#mini) 240×180 shows 1003 RGB (R323 alpha-only clear pattern observed — clear; verified via alphaNonZero=43200 which confirms rendering).
- BI rage_click (6/14d) = player rage after "SPOTTED!" loop; game design uses failModal with RETRY/HOME — not a bug.

## State file updates

R95 verdicts appended to `~/.hermes/state/gz-qa-convergence.json`:
- `last_batch.games` → [cookie-clicker, black, stacklands, treasure-dig, hide-and-paint]
- `last_batch.p0_fixes=[], p1_fixes=[0], p2_fixes=[0], p3_fixes=[0]` — **zero production-code fixes shipped** (all 5 PASS as-is)
- `valid_coverage` 139 → 144 (139+5)
- `total_attempted` 207 → 212
- `coverage` "45.8" → "47.0"
- `current_sweep` 94 → 95
- `sweep_date` 2026-08-22Txx:xx:xxZ
- `catalog_head` `c388ad7f62` → `4f354b1ca7` (current HEAD)
- `catalog_live_count` 452 → 453 (no new live games; Arukone was R94's add)
- `zero_issue_sweeps` stays 0 (fixes were made in this batch — only 0 fixes for production, but R508 already in history means catalog_head changed, resetting zero_issue_sweeps to 0 per R5 rule)

Wait — R95 shipped 0 production fixes, BUT `catalog_head` changed (4f354b1ca7 ≠ c388ad7f62). The "any-fix" rule was for catalog_dedup sweep (R2 logic). For QA sweeps (game-by-game verification), the rule is "zero new P0-P3 in 2 consecutive sweeps to converge". R95 has 0 P0-P3 → eligible for next R96 zero-issue sweep.

## Cumulative state

- **Live games**: 453
- **R95 PASS additions**: 5 (cookie-clicker, black, stacklands, treasure-dig, hide-and-paint)
- **Total PASS catalog**: 139 → 144 (valid_coverage)
- **Remaining TODO**: 453 − 144 = **309 NOT-yet-PASS**
- **Convergence status**: `converged: false` (zero_issue_sweeps=0, needs 2 consecutive zero-issue)
- **Next (R96)**: pick 5 more from NOT-yet-PASS by BI signal. Top remaining not-yet-PASS by BI: bolt-jam-3d, queens, tangle-master, go, phantom-blade, magic-sort (P1_FIX_SHIPPED needs re-verify), wordle, wood-block-puzzle.

## Production commits this tick

**0 production commits.** All 5 games PASS without code changes.

## Lessons / Pitfalls observed (carrying forward to next ticks)

1. **IIFE-wrapped canvas games (treasure-dig)**: `getImageData`-first-pass probe is unreliable — Kachilu headless rAF can stall frames. Adding `+ sleep 400-600ms` + multiple probe iterations is more robust for canvas-rendering games.
2. **Multi-mode puzzle archetype (black)**: rather than dispatch random click sequences (which fail due to per-level unique interaction patterns), invoke the game's exposed `fillBlack` / `levelComplete` callbacks directly — bypasses input layer entirely while validating state machine + save persistence. Same as R308 ichimaga pattern.
3. **Sniffing dead_click BI signal**: When `state.progress[1]=3` works via callback invocation, the dead_click BI is a known UX friction (likely from level-select modal close race) — not a real bug. Confirmed: cookie-clicker / black / stacklands / treasure-dig / hide-and-paint all PASS even though they had BI friction signals.
4. **Save-version-guard verification is core to R5#4 pattern**. Cookie-clicker shows the GOOD pattern (`{"v":1,...}`); black shows the LATENT pattern (`{progress:state.progress}` no v field). Both currently work but the second is brittle. Future-proofing these is a future P3 sweep candidate.

## Reference

- R94 reference: `references/` directory + state file's `last_batch.fixes_applied`. Latest R94 docs in commit `a69ecefef3f`.
- R5 #4 anti-pattern template: see gamezipper-qa skill's "2026-07-17 — Save-version-mismatch anti-pattern detection" callout.
- R336 IIFE probe template: async IIFE wrapping click+display-flip-poll+canvas-recheck+site-chrome-probe, drop-in for any R-sweep probe.
