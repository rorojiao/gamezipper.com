# Crankshaft Linkage — Phase 9 Final Report

## Overview
**Game:** Crankshaft Linkage — Slider-Crank Mechanism Puzzle  
**Slug:** crankshaft-linkage  
**Mechanic:** Rotate crankshafts to drive connecting rods and position sliders in target zones. Timing belts couple cranks into sub-chains.  
**Release Date:** 2026-07-01  
**Status:** Live (replaced broken sibling implementation)

## Phase Summary

### Phase 0-1: Selection (Completed)
- **Candidate Score:** 19/25 (highest on candidate list)
- **Gap Verification:** 0 results for "crankshaft" in 494-game catalog
- **Tier Selection:** Puzzle (confirmed via `.game-pipeline-status`)
- **Reference Game:** Camshaft Timing (mechanical puzzle theme match)

### Phase 2: Benchmark + Design (Completed)
**Competitors Analyzed:**
- Pipe Connect, Gear Logic, Slider Puzzles
- **USP:** Real slider-crank physics (crank → rod → slider) with timing belt coupling, not simple rotation or sorting
- **Differentiation:** Crank kinematics with cos(θ) symmetry, sub-chain timing belts, target zone matching

**Game Design:**
- 30 handcrafted levels across 6 tiers (T1: 1 crank → T6: 4 cranks)
- Sub-chain coupling via timing belts (1-3 sub-chains per level)
- 8 discrete crank angles (45° increments)
- Tolerance: ±5 units for target zone
- Par values optimized for unique/2-solution levels
- Star rating: 3★ (≤par), 2★ (≤par+2), 1★ (par+3+)

### Phase 3: Game Development (Completed)
**Single-File HTML5 Game:**
- File size: 23,745 bytes (under 30KB budget)
- Canvas-based rendering with dark engineering aesthetic
- CSS color scheme: navy (#0f1419) + amber (#f59e0b) + emerald (#10b981)
- BEM CSS naming, Chinese comments in code
- Level data embedded: 1,932 chars compact JS format
- Controls: Touch (CW/CCW buttons) + Keyboard (arrows/A/D, number keys for sub-chain selection)

**Core Mechanics:**
- `sliderPos(angle, r, L)`: x = r·cos(θ) + √(L² - r²·sin²(θ))
- Start angles never equal solution angles (verified)
- Win detection: all sliders within TOLERANCE of targets
- Progress saved to localStorage (`crankshaft_progress`)

### Phase 4: Art Assets (Completed)
**Generated via Pillow (Python):**
- `og-image.jpg` (67,635 bytes) — 1200x630 thumbnail with two-crank illustration, timing belt, target zones
- `icon.png` (604 bytes) — 64x64 favicon with crank arm + slider
- `apple-touch-icon.png` (1,562 bytes) — 180x180 iOS icon
- Style: Flat engineering aesthetic, dark navy background, amber/emerald accents

### Phase 5: Audio (Completed)
**Web Audio API (procedural):**
- `sfxRotate`: dual-tone mechanical click (220Hz + 280Hz)
- `sfxWin`: ascending arpeggio (523Hz → 659Hz → 784Hz)
- Mute toggle button in topbar
- Audio context initialized on first interaction (per browser policy)

### Phase 6: Level Verification (Completed)
**Verification Method:**
- Node.js solver enumerates all 8^nSubs angle combinations
- Confirms solution exists at TOLERANCE=5 for each level
- Verifies start angles ≠ solution angles

**Results:**
- **30/30 levels solvable**
- Level distribution:
  - T1-T2: 1-2 crank, 1-2 sub-chains
  - T3-T4: 3 cranks, 2-3 sub-chains
  - T5-T6: 4 cranks, 2-3 sub-chains
- Solution counts: 1-4 per level (cos(θ) symmetry acceptable)
- Par values: 1-10 moves optimized

### Phase 7: QA (40-Point Checklist) — 40/40 PASS

**Core Functionality (10/10):**
- ✓ JS loads without errors
- ✓ Level 1 not solved at start
- ✓ All 30 levels have solutions
- ✓ Win detection implemented
- ✓ Progress saves to localStorage
- ✓ Reset button restores start angles
- ✓ Next level button exists
- ✓ Tier-based level selector
- ✓ Star rating system (3/2/1 stars)
- ✓ How to Play help modal

**Mobile Responsiveness (5/5):**
- ✓ viewport meta tag (no zoom, no scale)
- ✓ touch-action: manipulation
- ✓ user-select: none
- ✓ -webkit-tap-highlight-color: transparent
- ✓ Canvas touch event handling

**Audio System (5/5):**
- ✓ Web Audio API (AudioContext)
- ✓ initAudio function
- ✓ sfxRotate implemented
- ✓ sfxWin implemented
- ✓ Mute toggle button

**SEO & Meta (8/8):**
- ✓ title tag
- ✓ meta description
- ✓ og:title, og:description, og:image
- ✓ canonical URL
- ✓ JSON-LD VideoGame schema
- ✓ JSON-LD FAQPage schema
- ✓ JSON-LD HowTo schema
- ✓ JSON-LD BreadcrumbList schema

**Art Assets (4/4):**
- ✓ icon.png (604 bytes)
- ✓ apple-touch-icon.png (1,562 bytes)
- ✓ og-image.jpg (67,635 bytes)
- ✓ All assets within size limits

**Monetization (4/4):**
- ✓ Monetag script reference
- ✓ game-footer.js reference
- ✓ Analytics tracker (cap.1ktower.com)
- ✓ Ad container div

**Performance (2/2):**
- ✓ Single-file (no external deps except monetag/footer)
- ✓ File size 23,745 bytes (under 30KB)

**File Structure (2/2):**
- ✓ Correct slug folder (crankshaft-linkage/)
- ✓ index.html exists

### Phase 8: Register + Deploy (Completed)
**Catalog Registration:**
- Entry exists in `js/games-data.js` (line 509)
- Slug: crankshaft-linkage
- Category: puzzle
- Status: live, isNew: true
- Emoji: 🔧
- Tags: crankshaft, slider crank, connecting rod, linkage, mechanism, kinematics, slider alignment, mechanical puzzle, engine puzzle, crank angle, rod, logic puzzle, brain teaser, free, html5, mobile, browser, no download
- Description: Accurate slider-crank mechanism description

**Deployment:**
- Static site on gamezipper.com
- URL: https://gamezipper.com/crankshaft-linkage/
- Catalog size: 495 games

### Phase 9: Final Report + Git Commit (In Progress)

## Technical Details

### Slider-Crank Physics Formula
```
x(θ) = r·cos(θ) + √(L² - r²·sin²(θ))
```
Where:
- `x` = slider position along track
- `θ` = crank angle (0°, 45°, 90°, ..., 315°)
- `r` = crank radius (25-40 units)
- `L` = connecting rod length (65-100 units)

**Key Properties:**
- Symmetric: x(θ) = x(360°-θ)
- Range: [r-L, r+L] (limited by rod length)
- Non-linear due to √ term (creates puzzle depth)

### Sub-Chain Coupling
- Cranks in same sub-chain rotate together (same angle index)
- Independent sub-chains have separate controls
- Visualized via dashed timing belt lines
- Creates constraint satisfaction complexity

### Level Format (Compact JS)
```javascript
var LEVELS = [
  // [cranks, subchains, targets, start, par]
  [ // cranks: [[r, L], ...]
    [[30, 80], [35, 85]],
    // subchains: [[crank_idx, ...], ...]
    [[0], [1]],
    // targets: [t1, t2, ...]
    [98.3, 56.6],
    // start: [angle_idx, ...]
    [6, 3],
    // par: optimal moves
    1
  ],
  // ... 29 more levels
];
```

## Known Limitations

1. **Cos(θ) Symmetry:** Some levels have 2-4 solutions due to x(θ)=x(360°-θ). This is acceptable for gameplay (easier puzzles) and doesn't break par-based scoring.

2. **Mobile Performance:** Canvas rendering at devicePixelRatio may be heavy on low-end devices. This follows existing GameZipper patterns.

3. **No Background Music:** Only sound effects (rotate + win). Background music not included per GameZipper standard (single-file constraint).

## Replaced Implementation

**Previous Version Issues:**
- 9/30 levels unsolvable (verified via solver)
- Simplified mechanic (direct rotation, not true slider-crank)
- Missing SEO tags, JSON-LD, Monetag integration

**This Version Fixes:**
- True slider-crank physics with connecting rod geometry
- 30/30 verified solvable levels
- Full SEO + JSON-LD + Monetag + analytics
- Proper artifact assets (OG image, icons)
- QA 40/40 checklist pass

## Deliverables

### Files Modified/Created
- `/home/msdn/gamezipper.com/crankshaft-linkage/index.html` (23,745 bytes) — complete game
- `/home/msdn/gamezipper.com/crankshaft-linkage/og-image.jpg` (67,635 bytes) — thumbnail
- `/home/msdn/gamezipper.com/crankshaft-linkage/icon.png` (604 bytes) — favicon
- `/home/msdn/gamezipper.com/crankshaft-linkage/apple-touch-icon.png` (1,562 bytes) — iOS icon

### Catalog Update
- `js/games-data.js` line 509: Crankshaft Linkage entry (already registered)

## Conclusion

Crankshaft Linkage successfully delivers a fresh kinematic puzzle experience with:
- True slider-crank mechanism physics (not simplified rotation)
- 30 handcrafted, verified solvable levels
- Timing belt coupling for constraint complexity
- Full GameZipper integration (SEO, monetization, analytics)
- Mobile-responsive, single-file HTML5 game

The game replaces a broken sibling implementation (9/30 unsolvable levels) with a working, QA-verified version that passes all 40 checkpoint items.

**Phase 9 Complete.**