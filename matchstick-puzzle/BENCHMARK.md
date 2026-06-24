# Matchstick Puzzle — Competitive Benchmark (Phase 2)

**Date:** 2026-06-25  |  **Slug:** `matchstick-puzzle`  |  **Genre:** Logic / Brain Teaser

## 1. Top Competitors (mobile + web)

| # | Title | Platform | Downloads / Installs | Key Mechanics |
|---|-------|----------|---------------------|---------------|
| 1 | **Matches Puzzle** (Joysoul) | Android/iOS | 50M+ | 1000+ levels, move 1-2 matches to fix equations, hint coins, drag-drop |
| 2 | **Matchstick Puzzle Game** (Mobilie) | Android | 10M+ | 600+ levels, equations + shapes, daily challenges, star ratings |
| 3 | **Matchstick: Crossword** | iOS | 5M+ | Equations only, 7-segment style, premium polish |
| 4 | **MATCHSTICK — Puzzle Game** | iOS (2026-05) | New release | Brain-training angle, move matches to fix formula |
| 5 | **Matchstick Logical Puzzle** (9game, v8.5.3 2026-05) | Android CN | Large | Logic puzzles, drag-drop, solution hints |

## 2. Core Mechanic Decomposition

- **7-segment digit rendering** using matchsticks (0=6, 1=2, 2=5, 3=5, 4=4, 5=5, 6=6, 7=3, 8=7, 9=6 matches)
- **Operators:** `+` (2 matches, cross), `-` (1 match), `=` (2 parallel matches)
- **Action:** tap a match to lift it → tap empty segment to place → tap again to discard
- **Move budget:** typically 1-3 matches per level
- **Win:** equation becomes mathematically true AND moves used ≤ budget
- **Validator:** live evaluation of "a op b = c"

## 3. Feature Matrix (competitor parity target)

| Feature | Matches Puzzle | Matchstick Puzzle | GZ Target | Status |
|---------|---------------|-------------------|-----------|--------|
| Equation puzzles | ✅ | ✅ | ✅ | 30 levels |
| Drag/tap interaction | ✅ | ✅ | ✅ (tap-lift/place) | required |
| Move counter | ✅ | ✅ | ✅ | required |
| Hint system | ✅ (coins) | ✅ | ✅ (free, limited) | required |
| Solution reveal | ✅ | ✅ | ✅ (after hint) | required |
| Level select grid | ✅ | ✅ | ✅ | 6 tiers |
| Star rating | ❌ | ✅ | ✅ | by moves used |
| Progress save | ✅ | ✅ | ✅ localStorage | required |
| Daily challenge | ❌ | ✅ | ✅ | rotating level |
| Achievements | ❌ | ✅ | ✅ | 8 badges |
| Reset button | ✅ | ✅ | ✅ | required |
| Tutorial overlay | ❌ | partial | ✅ | first level |
| Sound effects | ✅ | ✅ | ✅ Web Audio | required |
| Background music | ❌ | ❌ | ✅ Web Audio | ambient loop |
| Mobile responsive | ✅ | ✅ | ✅ | required |

## 4. Monetization / Engagement Patterns

- **Competitors:** rewarded-ad hints, coin shop, interstitials between tiers
- **GZ approach:** ad slots (monetagManager already on site), NO coins/paywall, free hints with cooldown
- **Engagement:** 30 levels + daily challenge + achievements + best-moves leaderboard (localStorage)

## 5. Differentiation (why GZ version wins)

1. **No paywalls** — all competitors gate hints behind coins/ads; GZ gives free hints
2. **Verified-unique solutions** — Python solver guarantees each level has exactly ONE solution within move budget (no ambiguity)
3. **Balanced difficulty curve** — 6 tiers × 5 levels, progressive move budgets (1→3)
4. **Polished book/parchment aesthetic** — warm wooden theme vs competitors' flat Material design
5. **Achievements + daily challenge** — replayability hooks competitors lack

## 6. Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Equation parsing edge cases | Strict regex + try/catch in validator |
| Multiple solutions (ambiguous) | Python solver pre-verifies uniqueness |
| Mobile tap precision | Large hit areas (≥32px), visual feedback |
| Color-blind accessibility | Matches are positional, not color-coded |

## 7. Success Metrics

- QA: 40/40 checklist pass
- Levels: 30 verified-solvable
- Performance: <50KB HTML, loads <1s on 3G
- SEO: targets "matchstick puzzle", "matchstick math game", "move matches to fix equation"
