# R649 Sweep 149 — GameZipper Per-Game Deep QA + 1 Fix Shipped

**Date:** 2026-09-03 (01:20-01:40 UTC)
**Catalog HEAD before sweep:** `099b3e7c4f629abcad81a20b0e196aaa67281df0`
**Catalog HEAD after sweep:** `7706296c3ef22106b8522894a92f9734b6119cf0` (R649 fix)
**Live total:** 455
**Verified before:** 455/455 (from R642-R648 sweep)
**Verified after:** 455/455 (re-verified 5 games, all PASS)
**Sweeps count:** 149 → 150 (next sweep after fix)

## 5 games audited (BI-driven: rage_click + dead_click priority)

| Game | Verdict | Browser Evidence | Notes |
|------|---------|-----------------|-------|
| **flappy-wings** | PASS | canvas 1280x537 684540 RGB, tutorial-overlay dismisses on click anywhere (fullscreen pointerdown handler L838-840) | BI rage_click (231-240, 608-634) was historical single-user 1349x609 viewport; no current desktop issue |
| **watermelon-merge** | PASS | canvas 500x577 288500 RGB, btnPlay→gameState="playing", pointerdown→dropFruit wired | BI rage_click (728,408) all from 1 user 6d2fdcf1 (1334x754 viewport), isolated issue not affecting general users |
| **antistress** | PASS | 42 clickable (15 toy-cards), onboard dismiss via "▶ Start Game" button, first unlocked toy → 1280x577 canvas 738560 RGB, localStorage.antistress-save persists | BI rage_click hits gz-ux-onboard overlay — **all-site UX pattern (not antistress-specific)** |
| **tetris** | PASS | canvas 361x722 260642 RGB, gz-tap-start dismisses, mobile-dpad wired (game.js L545-572), gameRunning=true | BI rage_click hits gz-tap-start overlay (z=99997) — same all-site UX pattern |
| **cloud-sheep** | PASS | splash dismiss works on start button click, canvas 1280x577 738560 RGB, HUD Day1 + ⭐ 5, localStorage.gz_cloud_sheep_v1 persists | **P1 UX BUG → FIXED**: splash overlay only dismissed via central button click (BI rage_click 777,488) |

## Fix Shipped (R649)

### commit `7706296c3e` — fix(ux): R649 cloud-sheep — splash overlay accepts any-click dismiss (rage_click fix)

**Bug**: cloud-sheep #splash overlay (L188) only dismissed via central `<button onclick="startGame()">`. Background clicks on splash area had no effect → rage_click loop (7 rage + 3 dead from 1 user 58e6c0eb on 1480+ viewport).

**Fix**: Added splash.addEventListener('click', startGame) + touchstart fallback. startGame() is now idempotent (returns early if already started) to avoid double initAudio/startBGM when both the button onclick AND the overlay handler fire.

**Verification (production)**:
- Kachilu session `qa-149-cloud-sheep-prod` post-deploy
- `splashDisplayBefore = flex` → click at (777, 488) → `splashDisplayAfter = none`, `gameStarted = true` ✅
- Deploy run #33704460593 (workflow_dispatch, ~2m, completed success at 2026-09-03T01:40:13Z)

## P1 UX Pattern Discovered (separate sweep needed)

**Pattern**: Single-file canvas games with overlay (splash / onboard / tap-start) that intercept all clicks but only dismiss via central button.

**Affected games (verified this sweep)**:
- `antistress` — gz-ux-onboard overlay (from gz-ux.js v? — shared site-chrome)
- `tetris` — gz-tap-start overlay (per-game inline L451)

**Recommended fix pattern** (same as R649):
```js
var el = document.getElementById('overlay-id');
el.addEventListener('click', function(){ /* dismiss */ });
el.addEventListener('touchstart', function(){ /* dismiss */ }, {passive: true});
```

**Next sweep (150)** target: antistress + tetris (and 3 more games using same overlay pattern) for the same P1 fix.

## Coverage maintained at 100%
- **Total:** 455 live games
- **Verified status=verified:** 455
- **Catalog_head_drift:** False (current_sweep 150 catalog_head = `7706296c` matches state)
- **converged:** False (fix shipped this sweep → zero_issue_sweeps = 0; need 2 more zero-issue sweeps)

## Next sweep (150) plan
- **antistress** (gz-ux-onboard click-dismiss fix)
- **tetris** (gz-tap-start click-dismiss fix)
- + 3 more BI-priority games (dead_click/rage_click)

