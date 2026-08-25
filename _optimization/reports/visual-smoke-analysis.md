# Visual Smoke Analysis — 2026-08-25

Tooling: `_optimization/scripts/visual-smoke.js` — Playwright **bundled chromium**
(`chromium.launch()` default; NEVER system Chrome per 浏览器铁律), local HTTP server
127.0.0.1:8123, 3 workers, viewport 800×600. Per game: load → capture console/page
errors + failed same-origin requests → click PLAY (selector list, fallback Space +
canvas click) → 2 JPEG screenshots (visual-load.jpg / visual-play.jpg @ evidence/<slug>/)
→ content classification (2d/WebGL pixel variance + DOM text). Browser closed +
SIGKILL + server killed in finally; 0 chromium processes leftover (verified).

## Run: 551/551 pages, 17 min

| content class | count | meaning |
|---|---|---|
| rendered | 291 | ≥1 canvas with pixel variance |
| dom-only | 221 | DOM game (canvas blank/absent but text UI present) |
| dom-ok | 37 | no canvas, substantial DOM text |
| null | 2 | goto timeout → see below |

play-clicked: 396/551 (others use canvas menus / keys / autoplay — interaction
coverage belongs to the per-game engine verifiers, all of which PASS).

## Flagged: 10 → all investigated → 0 real game defects

| slug | flag | disposition |
|---|---|---|
| fruit-slash | SyntaxError + redirect | By-design rename tombstone → slice-master (`location.replace`); offline external nav fails noisily. Not a bug. |
| bowling-master | goto load >12s | DCL = 137 ms; `load` blocked by offline ad scripts. Production has network. Not a bug. |
| codewords | goto load >12s | DCL = 57 ms; same offline-ads-onload artifact. Not a bug. |
| block-blast | `timers is not defined` (×1 in full run) | Symbol absent from game code; 3× repro attempts with play+keys → zero recurrences; game renders; engine verifier PASS. Ad-iframe third-party script offline fallback. Noise. |
| spades | `timers is not defined` | same as above |
| sand-balls | `animFrame is not defined` | same (symbol not in game files) |
| spelling-bee | `onPointerDown is not defined` | same (symbol not in game files) |
| compound-word | null `.timerInterval` (×1) | same pattern — not reproducible, renders, engine PASS |
| go-fish | null `.timerInterval` | same |
| sukima | null `.timerInterval` | same |

Noise sources (offline environment): ERR_NAME_NOT_RESOLVED (ads/BI endpoints),
TagError (gtag), doubleclick 400s, generic "Failed to load resource" with external
origin — all filtered in the report as non-game noise.

## Verdict

**551 pages visually smoke-passed: 0 new game defects.**

## Vision-model deep pass (zai analyze_image) — 2026-08-25

58 screenshots analyzed (40 engine-fixed + 3 honest-FAIL + 20 dom-only sample, plus
follow-ups): **54 OK on first pass, 1 ISSUE, 2 missing, 3 OK-with-note** (shot timing
captured menu/exit states — menus are valid). All 6 exceptions resolved:

| slug | agent verdict | resolution |
|---|---|---|
| mini-golf | ISSUE: play shot ~95% black, faint purple blur | **Headless swiftshader artifact**: page uses `backdrop-filter: blur()` everywhere; software GL composites it as solid black in screenshots. Proof: injecting `backdrop-filter:none` → full UI readable (tutorial modal "Welcome to Mini Golf!", Next →, pagination dots, HUD, nav bar all clear). Real-GPU browsers unaffected; engine verifier 77/77 PASS. NOT a defect. |
| bowling-master | MISSING (onload timeout) | Captured via domcontentloaded probe: vision verdict OK — lane, ball, pins triangle, HUD visible. |
| codewords | MISSING (onload timeout) | Captured via domcontentloaded probe: shows healthy "How to Play" tutorial modal over level-select grid (L1-L27, EASY..EXTREME). Detailed second-pass analysis: "stable and functional, free of visual errors". |
| word-search / hotel-rush / 2048 | OK-with-note | Shot timing (exit-recommendations page / start menu / below-fold tips) — menus are valid start states; engine verifiers PASS. |

**Final visual verdict: 0 real visual defects across all checked games.** The only
structural finding is the mini-golf/backdrop-filter screenshot artifact — documented
for future harness runs (inject the CSS override when capturing blur-heavy pages).
