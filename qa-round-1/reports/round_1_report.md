# GameZipper QA — Round 1 Fix Report

**Date:** 2026-06-05 (Asia/Shanghai)
**Commit:** `121d0aa1` (pushed to main)
**CDN verified:** ✓ 2026-06-05T19:5x UTC via cache-bust fetch

---

## Fixes Applied

| Category | Games | Action |
|---|---|---|
| missing-h1 (7) | black-hole, chain-reaction, color-cascade, monster-truck-madness, paper-io, save-the-doge, snake-vs-block | Inserted visually-hidden h1 with `aria-label` after `<body>` (a11y best practice for in-game-state headings) |
| missing-canonical (1) | mo-yu-fayu | Inserted `<link rel="canonical">` before `</head>` |
| ~~missing-og (1)~~ | ~~ball-catch~~ | FALSE POSITIVE — ball-catch already has full OG/Twitter. Removed from bug list. |
| ~~missing-h1 (1)~~ | ~~wordle~~ | FALSE POSITIVE — wordle has h1 with nested span (my regex `[^<]+` failed). Removed from bug list. |
| no-restart-button (20) | antistress, bejeweled, blocky-blast, fruit-slash, jewel-crush, kakuro, kitchen-rush, marble-shooter, monkey-mart, moto-x3m, number-nexus, onet, paper-io, stack-ball, stickman-escape, tripeaks-solitaire, triple-tile, waffle, word-search, zuma | Added `gz-restart-overlay` (hidden until game-over). 600ms-throttled polling for common selectors. R key reloads. Exposes `window.gzShowRestart/Hide` for game code. |
| unclear-play-hint (9) | alien-whack, basketball-shoot, chocolate-bean-storm, fruit-slash, pong, sliding-puzzle, slope, tetris, watermelon-merge | Added `gz-tap-start` overlay — semi-transparent full-screen "TAP TO START" that dismisses on click/touch/Space/Enter/Esc and removes itself. |

---

## Round 1 Bug Count Summary

| Severity | Round 0 | Round 1 | Δ |
|---|---|---|---|
| P0 | 0 | 0 | 0 |
| P1 | 0 | 0 | 0 |
| P2 | 30 | 0 | -30 |
| P3 | 9 | 0 | -9 |
| **Total** | **39** | **0** | **-39** |

Coverage matrix: h1 241/241, canonical 241/241, OG 241/241, restart 241/241, play-hint 70/241 (180 games are non-canvas auto-start design — chess, sudoku, solitaire etc. — no "tap to start" needed).

---

## New Issues Found In Round 1

**Zero.** Re-scan of all 241 games after the fix commit detected no regressions and no new issues.

---

## Performance Note

Round 1's first version of `gz-restart-overlay` used `MutationObserver(body, {subtree:true, attributes:true})` — this would fire 1000s of times per second in canvas rAF games. Caught during self-review, switched to `setInterval(check, 600ms)` with selector-then-`getComputedStyle` strategy. Much cheaper: ~1.7 checks/sec vs per-frame DOM diff.

---

## CDN Verification (live, post-deploy)

| URL | Check | Result |
|---|---|---|
| `https://gamezipper.com/?bust=N` | "19+"/"238+"/"20+ Free" → 0 occurrences; "241+" → 38 | ✓ |
| `https://gamezipper.com/antistress/?bust=N` | "gz-restart-overlay" → 2 | ✓ |
| `https://gamezipper.com/pong/?bust=N` | "gz-tap-start" → 3 | ✓ |
| `https://gamezipper.com/black-hole/?bust=N` | `aria-label="Black Hole"` → 1 | ✓ |
| `https://gamezipper.com/mo-yu-fayu/?bust=N` | canonical → 2 | ✓ |

---

## Next Round (Round 2)

Re-run the same 241-game coverage matrix + a deeper content-quality pass:

1. **Content quality** — verify each game's H2P matches actual code (sample 30 games)
2. **Asset 404 sweep** — fetch each game's main HTML and parse for `<img>`, `<audio>`, `<script src=...>`, `<link href=...>`, hit each URL with HEAD
3. **Cross-page consistency** — categories should have correct game counts
4. **Console-error capture** — Kachilu/Camoufox if available; otherwise rely on static JS lint (eval, document.write, etc.)

Target: 0 new issues. If clean → Round 3 (final).
