# Fruit Slash QA Report

**URL**: https://gamezipper.com/fruit-slash/
**Genre**: puzzle (swipe-to-slash)
**Date**: 2026-06-06
**Browser**: kachilu-browser (session: fruit-slash-qa)

## Test Results

| # | Test | Result | Notes |
|---|------|--------|-------|
| 1 | HTTP 200 | ✅ PASS | `curl` returns HTTP 200 |
| 2 | H1 + canvas render | ✅ PASS | H1="Fruit Slash", canvas id="c" 1280×577 |
| 3 | 5+ canvas clicks for fruit slash | ⚠️ PARTIAL | Game starts via Space/Enter; clicks register (60s→52s timer ran); score stayed 0 (game is swipe-based, not click-based) |
| 4 | Console errors | ✅ PASS | Zero errors, zero console logs |
| 5 | gz-restart-overlay (GAME BREAK) | ✅ PASS | Exists, hidden until game over, content="Game Over / Want to play again? / 🔁 Play Again", aria-label="Game over", restart-btn present |
| 6 | 3 ad/footer elements | ✅ PASS | gz-topnav, gz-ad-below-game, 3× [id*=ad] divs, 1× ins.adsbygoogle slot |

## 🐛 CRITICAL BUG

**Auto-redirect to basketball-shoot after ~20s with no user input**

- Fresh load of `https://gamezipper.com/fruit-slash/` silently navigates to `https://gamezipper.com/basketball-shoot/` between T=18s and T=28s after page load.
- Reproduced 3 times in a row with no clicks, no swipes, no input.
- The redirect is **not** the 60s in-game timer (which counts down to 0 then shows Game Over overlay).
- Likely a `setTimeout` in `https://gamezipper.com/fruit-slash/game.js` or `game-footer.js` that does `window.location.href = 'https://gamezipper.com/basketball-shoot/'` after ~20s.
- The fruit-slash game is **unplayable** for any session longer than ~20 seconds — players get yanked to a different game mid-play.

## Other Observations

- Pre-play screenshot shows the proper "TAP TO START" / "🎮" start screen with "Fruit Slash" title, "0 SCORE / x1 COMBO / 60 TIME" HUD. ✅
- After-play screenshot shows the game running with a skull icon and blue dot on canvas; score 0, time 52 (counting down). The "Related Games" bar at the bottom includes "Basketball Shoot" as the first link.
- Fruit-slash is a **swipe-based** game (instructed: "Swipe across fruits to slice them"). The 5+ canvas clicks did not change the score — this is expected because clicks ≠ swipes. (However, an attempted swipe gesture (mouse-down + move + up) was confounded by the auto-redirect, so the swipe-to-slice mechanic could not be fully verified.)
- No visual glitches, no broken images, no console errors.
- `gz-restart-overlay` content reads "Game Over / Want to play again? / 🔁 Play Again" — note: the overlay is labeled "GAME BREAK" in the spec but the actual content uses "Game Over" wording. Minor naming inconsistency.

## Verdict

**FAIL** — auto-redirect to `https://gamezipper.com/basketball-shoot/` after ~20s makes the game unplayable.

## Artifacts

- `/home/msdn/gamezipper.com/qa/fruit-slash-final-pre.png` (35KB) — start screen
- `/home/msdn/gamezipper.com/qa/fruit-slash-final-after.png` (129KB) — game running
- `/home/msdn/gamezipper.com/qa/fruit-slash-after.png` (57KB) — also on fruit-slash
- `/home/msdn/gamezipper.com/qa/fruit-slash-initial.png` (67KB) — earlier capture
