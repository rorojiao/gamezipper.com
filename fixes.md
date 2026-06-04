# GameZipper — Fixes Log

Chronological list of every bug fixed in this QA cycle (2026-06-05).

## Round 0 (commit `5a90fe5e`) — 5 P0 fixes

| ID | File | Severity | Change |
|---|---|---|---|
| F-001 | `index.html` | P0 | 23x "19+" → "241+" in title, meta, OG, Twitter, JSON-LD, search placeholder, share text, hero copy |
| F-002 | `index.html` | P0 | 11x "238+" → "241+" (Browse-all link, Reddit share template) |
| F-003 | `index.html` | P0 | 4x "20+ Free Online Games" → "241+ Free Online Games" |
| F-004 | `index.html` | P0 | JSON-LD `ItemList.numberOfItems: 26` → 241 |
| F-005 | `sitemap.xml` | P0 | Added `save-the-doge` URL (was in registry, missing from sitemap) |

## Round 1 (commit `121d0aa1`) — 37 P2/P3 fixes (37 files, +9294 lines)

| ID | File | Severity | Change |
|---|---|---|---|
| F-101 | `black-hole/index.html` | P2 | Added visually-hidden h1 with `aria-label="Black Hole"` |
| F-102 | `chain-reaction/index.html` | P2 | Added visually-hidden h1 |
| F-103 | `color-cascade/index.html` | P2 | Added visually-hidden h1 |
| F-104 | `monster-truck-madness/index.html` | P2 | Added visually-hidden h1 |
| F-105 | `paper-io/index.html` | P2 | Added visually-hidden h1 |
| F-106 | `save-the-doge/index.html` | P2 | Added visually-hidden h1 |
| F-107 | `snake-vs-block/index.html` | P2 | Added visually-hidden h1 |
| F-108 | `mo-yu-fayu/index.html` | P2 | Added `<link rel="canonical">` |
| F-109 | `antistress/index.html` | P2 | Added `gz-restart-overlay` (R-key + 600ms poll) |
| F-110 | `bejeweled/index.html` | P2 | Added `gz-restart-overlay` |
| F-111 | `blocky-blast/index.html` | P2 | Added `gz-restart-overlay` |
| F-112 | `fruit-slash/index.html` | P2 | Added `gz-restart-overlay` |
| F-113 | `jewel-crush/index.html` | P2 | Added `gz-restart-overlay` |
| F-114 | `kakuro/index.html` | P2 | Added `gz-restart-overlay` |
| F-115 | `kitchen-rush/index.html` | P2 | Added `gz-restart-overlay` |
| F-116 | `marble-shooter/index.html` | P2 | Added `gz-restart-overlay` |
| F-117 | `monkey-mart/index.html` | P2 | Added `gz-restart-overlay` |
| F-118 | `moto-x3m/index.html` | P2 | Added `gz-restart-overlay` |
| F-119 | `number-nexus/index.html` | P2 | Added `gz-restart-overlay` |
| F-120 | `onet/index.html` | P2 | Added `gz-restart-overlay` |
| F-121 | `paper-io/index.html` | P2 | Added `gz-restart-overlay` (same file as F-105) |
| F-122 | `stack-ball/index.html` | P2 | Added `gz-restart-overlay` |
| F-123 | `stickman-escape/index.html` | P2 | Added `gz-restart-overlay` |
| F-124 | `tripeaks-solitaire/index.html` | P2 | Added `gz-restart-overlay` |
| F-125 | `triple-tile/index.html` | P2 | Added `gz-restart-overlay` |
| F-126 | `waffle/index.html` | P2 | Added `gz-restart-overlay` |
| F-127 | `word-search/index.html` | P2 | Added `gz-restart-overlay` |
| F-128 | `zuma/index.html` | P2 | Added `gz-restart-overlay` |
| F-129 | `alien-whack/index.html` | P3 | Added `gz-tap-start` overlay |
| F-130 | `basketball-shoot/index.html` | P3 | Added `gz-tap-start` overlay |
| F-131 | `chocolate-bean-storm/index.html` | P3 | Added `gz-tap-start` overlay |
| F-132 | `fruit-slash/index.html` | P3 | Added `gz-tap-start` overlay (same file as F-112) |
| F-133 | `pong/index.html` | P3 | Added `gz-tap-start` overlay |
| F-134 | `sliding-puzzle/index.html` | P3 | Added `gz-tap-start` overlay |
| F-135 | `slope/index.html` | P3 | Added `gz-tap-start` overlay |
| F-136 | `tetris/index.html` | P3 | Added `gz-tap-start` overlay |
| F-137 | `watermelon-merge/index.html` | P3 | Added `gz-tap-start` overlay |

## Round 2 (commit `7e9649bb`) — 1 P1 + 1 P2 + infra (12 files, +5000 lines)

| ID | File | Severity | Change |
|---|---|---|---|
| F-201 | `puzzle-games.html` | P1 | Dynamic loader for full 169-game puzzle category |
| F-202 | `arcade-games.html` | P1 | Dynamic loader for full 39-game arcade category |
| F-203 | `card-games.html` | P1 | Dynamic loader for full 14-game card category |
| F-204 | `idle-games.html` | P1 | Dynamic loader for full 5-game idle category |
| F-205 | `simulation-games.html` | P1 | Dynamic loader for full 1-game simulation category |
| F-206 | `word-typing-games.html` | P1 | Dynamic loader for full 1-game word category |
| F-207 | `casual-games.html` | P1 | Dynamic loader for full 3-game casual category |
| F-208 | `js/categories/*.json` (11 files) | infra | Per-category JSON files (1B–45KB) |
| F-209 | `merge-kingdom/index.html` | P2 | Removed dead `<script src="//cdn.jsdelivr.net/npm/monetag@latest">` (404) |
| F-210 | `.gitignore` | hygiene | Added `magic-sort/gen_log*.txt` |

## Round 3 (commit `721fa8bd`) — 1 P2 + 1 hygiene (1 file + dir remove)

| ID | File | Severity | Change |
|---|---|---|---|
| F-301 | `2048/index.html` | P2 | Removed internal TODO in 2048 strategy section, replaced with concrete corner-stack strategy |
| F-302 | `tidy-up-3d/` (deleted) | hygiene | Orphan directory with no index.html, not in registry, not in sitemap |

---

## Performance Note (from Round 1)

The first version of `gz-restart-overlay` used `MutationObserver(body, {subtree:true, attributes:true})` — this would fire 1000s of times per second in canvas rAF games. Caught during self-review before commit, switched to `setInterval(check, 600ms)` with selector-then-`getComputedStyle` strategy. ~1.7 checks/sec vs per-frame DOM diff.

## Total Commits This Cycle

| SHA | Summary | Files | +/– |
|---|---|---|---|
| `5a90fe5e` | P0: unify homepage game count to 241+ + add save-the-doge to sitemap | 2 | +35/-34 |
| `121d0aa1` | Round 1: h1/canonical/og + restart + tap-to-start overlays | 35 | +9294/-5 |
| `7e9649bb` | Round 2: dynamic category pages + jsDelivr 404 fix | 12 | +5000 |
| `721fa8bd` | Round 3: remove 2048 internal TODO | 1 | +1/-1 |

**Total: 4 commits, 50 files touched, ~+14,300 LOC** (overlays and dynamic loaders are larger than the bug they fix because they're generic and a11y-friendly).
