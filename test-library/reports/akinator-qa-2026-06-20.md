# QA Report — akinator (Mind Reader) — puzzle

- **URL**: https://gamezipper.com/akinator/
- **Session**: `qa-akinator-1`
- **Library**: MASTER-TEST-CASES-v1.75.0
- **Date**: 2026-06-20
- **Tool**: kachilu-browser (Chromium via CDP)

## VERDICT: FAIL

Game loads, runs, and Q&A logic works (Q1→Q2 advanced correctly), but a
gameplay-blocking layout bug and a persistence gap force a FAIL.

## Bugs found (≤5)

1. **[G-002/GM-105] Bug #14b — fixed 44px footer bar pushes answer grid below fold (P0, gameplay-blocking).**
   `#game-footer` is `position:fixed`, height 44px, z-index 40, occupying the
   entire bottom band (y=533→577) of the 577px viewport. The `#answersGrid`
   extends to y=609 (32px below fold). As a result, **2 of 5 answer buttons are
   unreachable by pointer**: `Probably Not` and `No` both have centerY=581 >
   viewport 577, and `document.elementFromPoint(center)` returns **null**
   (clickAtCenter=false). Yes!/Probably/Don't Know (centerY=515) are clickable
   but overlap the footer band. Confirmed live.

2. **[GP-100 / GP-103] No game-progress persistence (P0).**
   After completing a full Q&A round (Q1 "Can your character fly?" → Q2
   "Does your character wear a costume or uniform?"), localStorage contains
   ONLY site-level keys (`gz_recent_games`, `gz_vid`, `gz_ab`, `gz_aa`,
   `gz5_ad_ts`, `gz5_zone_backoff_v1`, `gz5_last_commercial_break`). No
   `gz_<game>_v<N>` key and no question/answer-history key. A reload loses
   all in-game progress. Fails GP-100 (level/state save-restore) and GP-103
   (key convention).

3. **[G-012] H1 visually hidden — Bug #7c (P1).**
   The `<h1>` ("Play Mind Reader - Akinator Style Guessing Game | GameZipper")
   is rendered at 1×1px positioned at (-1,-1) (off-screen clip technique),
   so it is not visibly present. The visible title is an `<h2>` "MIND READER".
   G-012 requires a *visible* H1 with the game name. (Accessibility/SEO
   off-screen pattern; de-facto invisible to sighted users.)

4. **[G-002] game-footer.js missing `defer` (P0 spec deviation, low impact).**
   `<script src="/game-footer.js?v=f70e3a9c">` has `defer=false`. G-002
   requires the defer attribute. No observed runtime breakage, but spec fail.

5. **[GX-008 observation, non-blocking] bgCanvas is effectively blank.**
   `#bgCanvas` (1280×577) shows only ~14 non-zero-alpha sampled pixels of
   ~1850. The game is DOM-based (questions + answer buttons are HTML, not
   canvas-rendered) and fully playable, so this is NOT a Bug #20/#17/#12c
   blank-canvas failure — the canvas is a decorative background that happens
   to be ~empty. Noted for transparency.

## Tests that PASS
- G-001: HTTP 200, load 1491ms (<3s). ✓
- G-002 (partial): #gz-ad-below-game present ✓, monetag-manager.js loads ✓, game-footer.js present ✓ (but defer missing).
- G-003: game JS loaded & functional (Q&A advances). ✓
- G-004/G-005/G-006: no 4xx/5xx, no zombie endpoints (1ktower/alwingulla/rye/site-analytics), no dead 1×1 pixel. ✓
- G-009/G-010: input handlers registered, init() ran (start screen → gameplay). ✓
- G-013: layout scales (canvas 1280×577 fills viewport). ✓
- GX-001/GX-002: no autoplay-blocked audio errors; Sound toggle present. ✓
- GP-104/GP-105: no localStorage quota overflow / no corrupt save (nothing to corrupt). ✓
- GM-100/GM-101/GM-102/GM-103/GM-105: ad container present, monetag loads, no gz-cb-overlay commercial-break overlay during play, #gz-ad-below-game has height 0 (does not cover gameplay), no forced blocking video ad. ✓
- PC-001/PC-002/PC-008: no forced video ad blocking gameplay, no auto-redirect, no fake-X button. ✓
- Puzzle CAT GP-001/GP-005/GP-006: grid/category selection works, question advances, win/lose state plumbing present. ✓
