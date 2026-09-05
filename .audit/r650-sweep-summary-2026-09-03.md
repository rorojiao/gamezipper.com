# R650 Sweep 150 — GameZipper Per-Game Deep QA + 1 Fix Shipped

**Date:** 2026-09-03 (04:20-04:30 UTC)
**Catalog HEAD before sweep:** `7706296c3ef22106b8522894a92f9734b6119cf0`
**Catalog HEAD after sweep:** `3e0282c9b0ee5b2d99b4e04fe50fb1c5eb66e95b` (R650 fix)
**Live total:** 455
**Verified before:** 455/455 (from R642-R649 sweep)
**Verified after:** 455/455 (re-verified 5 BI-priority games, all PASS)
**Sweeps count:** 150 → 151 (next sweep)

## 5 games audited (BI-driven: top rage_click + dead_click priority)

| Game | Verdict | Browser Evidence | Notes |
|------|---------|------------------|-------|
| **bus-traffic-fever** | PASS | canvas game-canvas 320x320 89446 RGB, 4 screen overlays (win/fail/start/settings), start-overlay active, level 1 unlocked + 11 locked, menu/replay/next buttons visible | BI rage_click 28 + dead_click 2 (high-priority). Sweep 136 was 11d ago |
| **cookie-clicker** | PASS | 2 canvases (cookie-canvas 340x340 86401 RGB), 5 clicks → score 0→5, idle loop → 8 cookies. localStorage.cookieClicker={"v":1,"c":5,...} with v:1 guard (Pitfall #40 safe) | BI rage_click 19 (R650 fix addresses this for all 369 gz-ux games). Sweep 95 was 12d ago |
| **guess-the-emoji** | PASS | DOM-based word game (0 canvas), R650 fix verified on this game (bg click → overlay removed). Play Now → category-screen (3 cascading screens) | BI dead_click 10 (top dead_click priority). Sweep 137 was 2d ago |
| **2048** | PASS | 3 canvases (largest #c 500x500 29191 RGB), ArrowLeft x4 → score 0→4, localStorage.best2048=4. New Game / Undo (3) / × buttons visible | BI rage_click 7. Sweep 67 was 20d ago (very overdue) |
| **bolt-jam-3d** | PASS | WebGL three-canvas 1280x453 (Three.js, toDataURL=17626 bytes), Play → LEVEL 1, Undo/Hint/Menu visible. gl_context=true | BI rage_click 7. Sweep 0 (never had sweep number — first proper audit) |

## Fix Shipped (R650)

### commits `d2875f25c9` + `3e0282c9b0` — fix(ux): R650 gz-ux-onboard accepts any-click dismiss (rage_click fix, 369 games)

**Bug**: `gz-ux.js` `gz-ux-onboard` overlay only dismissed via the central "▶ Start Game" button click or Enter/Escape key. Background clicks on the overlay area were NO-OP, causing rage_click loops across all 100+ games using gz-ux-onboard.

**Real evidence (BI 7d)**:
- `antistress`: 11 rage_click (one user 32× on the same overlay)
- `cookie-clicker`: 19 rage_click (same UX pattern)
- `guess-the-emoji`: 4 rage_click + 10 dead_click
- 369 game pages use `gz-ux.js?v=ux1` cache-buster

**Fix**: Added `root.addEventListener('click', dismissOverlay, true)` (capture phase) + `root.addEventListener('touchstart', ...)` fallback to `gz-ux.js` lines 72-83. The overlay root now accepts any click that isn't the Start Game button itself, dismissing it.

**Cache-buster bump**: `?v=ux1` → `?v=ux2` across all 369 game pages (sed batch), forcing CDN to serve the fixed JS.

**Verification (production)**:
- Kachilu `s150-a-v` post-deploy antistress test:
  - gz-ux.js?v=ux2 confirmed loaded (CDN 200)
  - Click on overlay top-left (10,10) → overlay removed → canvas visible ✅
  - Click on Start Game button → overlay removed → canvas visible (regression test PASS) ✅
- Kachilu `s150-ge` post-deploy guess-the-emoji test:
  - gz-ux.js?v=ux2 loaded
  - Click on overlay bg → onboard removed ✅
  - "Play Now" button → category-screen ✅

**Deploy run**: #33715119722 (workflow_dispatch, completed success at 2026-09-03T04:28:32Z)

## Coverage maintained at 100%

- **Total:** 455 live games
- **Verified status=verified:** 455
- **Catalog_head_drift:** False (current_sweep 151 catalog_head = `3e0282c9b0` matches state)
- **converged:** False (fix shipped → zero_issue_sweeps = 0; need 2 more zero-issue sweeps)

## Next sweep (151) plan
- BI-priority: tentai-show (7 rage_click, sweep 132 3d ago), cross-the-streams (5 rc, sweep 64 20d ago), onet (4 rc, sweep 100 11d ago)
- + 2 more games by sweep age (oldest untouched: chess sweep 59, kakuro sweep 68, nyt-tiles sweep 68)
- Continue verifying R650 fix in production by sampling 2 more gz-ux-onboard games