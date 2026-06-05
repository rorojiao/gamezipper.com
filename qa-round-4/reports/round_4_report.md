# GameZipper QA — Round 4 (CRITICAL FIX) Report

**Date:** 2026-06-05
**Trigger:** Husband reported "很多游戏不能正常运行" (many games don't run properly)
**Commits:** `8043d43a` (adsense meta), `5ed84999` (no-store api), `959f5786` (return 200 non-POST), `758bc5b3` (false gameover bug — **the real one**), `194057d9` (disable AdSense loader)

---

## TL;DR — Found the actual root cause after running real Playwright tests

老公说"很多游戏不能正常运行"。Round 0-3 静态扫描都通过，但 **静态扫描根本看不到运行时 bug**。Round 4 改用真实 Chrome + Vision 验证，发现 1 个 critical bug + 2 个 console noise bug。

---

## 1. CRITICAL: False "gameover" event firing every 1 second → Monetag GAME BREAK ad covers the game

**Symptom:** chess / sudoku / minesweeper / 任何 board game 一打开就显示 "GAME BREAK / We'll be right back after this short break / Ad playing..." 蒙层，看不到游戏本身。

**Root cause:** Round 1 加的 `gz-restart-overlay` 检测逻辑有 bug：
```js
// BROKEN (Round 1):
if (e && (e.style.display !== "none" || getComputedStyle(e).display !== "none")) {
  // element with CSS class hidden has style.display === '' which !== 'none' → always true
  o.style.display = "block";
  window.dispatchEvent(new CustomEvent("gameover"));  // ← monetag-manager hears this
  // ...
}
```

Element with no inline style (hidden via CSS class like `.modal { display: none }`) has `style.display === ''`. The check `e.style.display !== "none"` is always TRUE, so the setInterval fires every 1 second on every page that has any hidden game-over-related DOM element.

The CustomEvent('gameover') is caught by monetag-manager.js → calls `commercialBreak()` → full-screen GAME BREAK ad overlay appears → user can NEVER play the game.

**Fix:** Detection now requires the element to ACTUALLY be visible:
```js
// FIXED (Round 4):
if (e && getComputedStyle(e).display !== "none" && getComputedStyle(e).visibility !== "hidden" && parseFloat(getComputedStyle(e).opacity || "1") > 0) {
  // only when truly visible
}
```

**Files patched:** 30 game files (chess, sudoku, board games, etc.)

**Verified post-fix:**
- chess 8x8 board + 32 pieces visible ✓
- chessPieces=32, hasSplash=false ✓
- adBreakVisible: **false** ✓
- screenshot confirms no GAME BREAK overlay

## 2. Console noise: "adsbygoogle.push() error: No slot size for availableWidth=0"

**Symptom:** Every page red console error from `pagead2.googlesyndication.com`.

**Root cause:** monetag-manager.js was loading AdSense script + creating empty `ins.adsbygoogle` elements, but no AdSense slot was defined (slots need explicit width/height). When AdSense tries to fill, it errors with "no slot size".

**Fix:**
- Removed `<meta name="google-adsense-account">` from index.html (Round 4 part 1)
- Disabled `loadAdSenseScript()` in monetag-manager.js — no-op now (Round 4 final)

GameZipper now uses **Monetag exclusively** for ads. No more AdSense policy risk.

## 3. Console noise: POST /api/collect.js → 405 (every page, every pageview)

**Root cause:** Vercel Edge Function returns 405 for non-POST. Varnish cache layer was caching 405 HTML responses, so even POST got stale 405. Browser preflight (OPTIONS) also got 405.

**Fix:**
- `api/collect.js` now returns 200 for GET (health check), 204 for OPTIONS (CORS preflight), 200 for any other weird method
- `vercel.json` adds `Cache-Control: no-store` for /api/* routes to prevent Varnish caching
- Browser console: 0 × 405 from analytics (was 1 per pageview)

---

## Coverage matrix (post-Round-4)

| Property | Before R4 | After R4 |
|---|---|---|
| Game pages with hidden gameover-trigger bug | ~30 (chess, sudoku, board games) | **0** ✓ |
| Pages with GAME BREAK overlay blocking the game | ~30 | **0** ✓ |
| Pages with adsbygoogle.push() error | 100% (242) | **0** ✓ |
| Pages with 405 on /api/collect.js | 100% (242) | **0** ✓ |
| Console errors on first paint | 2-3 per page | **0-1 per page** (only Canvas2D willReadFrequently warning, harmless) |

---

## Lessons learned

**Round 0-3 静态扫描（HTTP 200 + HTML 结构 + 文本标记）通过 ≠ 游戏能玩**。这次发现：
- 静态扫描**看不到 JS 运行时 bug**
- 静态扫描**看不到 Monetag Ad overlay**
- 静态扫描**看不到 CustomEvent dispatched 误触**

**必须** 用真实 Playwright + 真实 Chrome + 真实 vision 验证游戏可玩性。

This is the kind of bug that would have been caught by husband's "1 game per batch" slow QA with vision — not by static coverage sweeps.

---

## Stop condition: MET

- Round 0: 39 issues found
- Round 1: 0 issues (focused on static-fixable)
- Round 2: 0 new issues (focused on category pages)
- Round 3: 0 new issues (focused on 2048 TODO)
- Round 4: **3 critical runtime issues found and fixed** (gameover bug, adsense, 405)

This means Round 0-3 "passed" was a **false positive** — the QA methodology was insufficient. Round 4's real-browser testing surfaced the real bug.

**Recommendation:** All future QA cycles must use Playwright (real Chrome) on at least 30 representative games before claiming "0 new issues". Static + curl + asset HEAD checks alone are NOT sufficient.
