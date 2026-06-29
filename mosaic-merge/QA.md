# QA Checklist — Mosaic Tile Merge

## Game: mosaic-merge (Mosaic Tile Merge)
**File:** `index.html` (35KB) | **Levels:** 30 | **Verifier:** 30/30 PASS

## 40-Point Code-Level QA Checklist

### Responsive & Mobile (8 points)
| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | Viewport meta tag | ✅ PASS | `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no` |
| 2 | touch-action:none on body | ✅ PASS | Prevents scroll/zoom interference |
| 3 | Canvas fills viewport | ✅ PASS | `resize()` accounts for topnav + footer |
| 4 | DPR-aware canvas | ✅ PASS | `Math.min(devicePixelRatio, 2)` |
| 5 | pointerdown handler | ✅ PASS | Unified mouse + touch via Pointer Events |
| 6 | touchmove preventDefault | ✅ PASS | Prevents page scroll during play |
| 7 | -webkit-tap-highlight-color | ✅ PASS | Transparent to avoid flash |
| 8 | Grid sizes 3x3→5x5 | ✅ PASS | Cell size computed dynamically per level |

### Game Mechanics (10 points)
| # | Check | Status | Notes |
|---|-------|--------|-------|
| 9 | 30 levels present | ✅ PASS | `var LV=[...]` has 30 entries, verified by verify_independent.js |
| 10 | Merge logic correct | ✅ PASS | Same-tier adjacent tiles → tier+1, score += (tier+1)*10 |
| 11 | Swap logic correct | ✅ PASS | Different tiers swap positions |
| 12 | Move-to-empty works | ✅ PASS | Empty cell → tile slides over |
| 13 | Win condition (tier) | ✅ PASS | `maxTier(grid) >= target` |
| 14 | Win condition (score) | ✅ PASS | `score >= target` |
| 15 | Move counter | ✅ PASS | Increments on each valid move, displayed in HUD |
| 16 | Move limit / lose state | ✅ PASS | `moves >= maxMoves` triggers lose screen |
| 17 | Undo (50 deep) | ✅ PASS | History stack with grid+score+moves snapshot |
| 18 | Reset | ✅ PASS | Reloads level from LV data |

### Audio (5 points)
| # | Check | Status | Notes |
|---|-------|--------|-------|
| 19 | Web Audio API (no external) | ✅ PASS | `AudioContext` initialized on first interaction |
| 20 | BGM loop | ✅ PASS | 16s procedural ambient loop, minor-key chords + arpeggio |
| 21 | SFX: select | ✅ PASS | `sfxSelect()` 500Hz sine |
| 22 | SFX: merge, swap, win, lose | ✅ PASS | 4 additional SFX functions (7 total) |
| 23 | Volume toggle | ✅ PASS | Bottom-right button, persists to localStorage |

### UI/UX (7 points)
| # | Check | Status | Notes |
|---|-------|--------|-------|
| 24 | Menu screen | ✅ PASS | Play, Level Select, How to Play |
| 25 | Level select with tiers | ✅ PASS | 6 tier groups, star ratings, unlock progression |
| 26 | How to Play modal | ✅ PASS | Full instructions with color-coded sections |
| 27 | Win screen | ✅ PASS | Stars, detail, Next/Replay/Menu buttons |
| 28 | Lose screen | ✅ PASS | Retry/Menu options |
| 29 | HUD (goal, moves, undo, reset) | ✅ PASS | Fixed top bar with live info |
| 30 | Confetti on win | ✅ PASS | 30 procedural confetti particles |

### Data & Persistence (4 points)
| # | Check | Status | Notes |
|---|-------|--------|-------|
| 31 | Progress in localStorage | ✅ PASS | Key `mosaic_merge_progress`, stores stars+completed per level |
| 32 | Level unlock chain | ✅ PASS | Must complete previous level to unlock next |
| 33 | Star ratings (1-3) | ✅ PASS | Based on moves/maxMoves ratio |
| 34 | Sound preference persisted | ✅ PASS | Key `mosaic_merge_muted` |

### gz-topnav Interop (2 points)
| # | Check | Status | Notes |
|---|-------|--------|-------|
| 35 | Topnav hidden during play | ✅ PASS | `manageTopnav()` sets pointerEvents='none', opacity=0.5 |
| 36 | Topnav interactive in menus | ✅ PASS | Restored when screen !== 'play' |

### SEO & Meta (3 points)
| # | Check | Status | Notes |
|---|-------|--------|-------|
| 37 | Title, description, keywords | ✅ PASS | Full SEO meta tags |
| 38 | OG + Twitter cards | ✅ PASS | og:image, og:url, twitter:card present |
| 39 | Structured data | ✅ PASS | VideoGame, FAQPage, HowTo, BreadcrumbList schemas |

### Performance & No-Error (1 point)
| # | Check | Status | Notes |
|---|-------|--------|-------|
| 40 | No external deps (except gz-analytics) | ✅ PASS | Self-contained, only `/gz-analytics.js` (site standard) |

## Known Issues
- None. All 30 levels verified solvable with unique solutions by `verify_independent.js`.

## Browser Console Check
- No zombie endpoints (no 1ktower.com or third-party scripts)
- No external audio/image dependencies
- Canvas 2D engine only, no WebGL needed

## Result: 40/40 PASS
