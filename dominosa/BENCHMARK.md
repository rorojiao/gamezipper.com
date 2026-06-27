# Dominosa — Competitive Benchmark

## Candidate
- **Game**: Dominosa (Domino Placement Puzzle)
- **Genre**: Nikoli-style logic puzzle, constraint satisfaction
- **Slug**: `dominosa`
- **Score**: 20/25 (Tier 1)
- **Catalog gap**: Confirmed — no `dominosa`, `domino-placement`, or `inequality-grid` slug exists. Sibling domino games (`dominoes`, `domino-chain`) are different mechanics (chain building, not grid partition).

## Top competitors analyzed

| Source | Format | Features | Monetization | Avg. session |
|--------|--------|----------|--------------|--------------|
| **Simon Tatham's Puzzle Collection** (Dominosa) | Desktop + mobile web, free | Click-edge-to-wall interaction, auto-conflict highlight, unlimited procedural levels, difficulty by domino-set size (double-1 → double-9), undo, redo, solver-based hint | Open source, no ads | 5–15 min |
| **Puzzle Madness (dominosa)** | Web | Click two cells to join, daily puzzle, timer, mobile-friendly | Display ads + patreon | 4–8 min |
| **BrainBashers Dominosa** | Web | Multiple sizes, weekly puzzle, print-friendly | Display ads | 6–12 min |
| **Conceptis Dominoes** (paid app) | iOS/Android | Hand-crafted levels, 5 difficulty tiers, star ratings, hints | Paid + IAP | 8–20 min |
| **Dominosa mobile apps** (Google Play: "Dominosa Puzzle") | App | Daily challenge, achievements, 30+ levels per pack, no-ip reminder | Rewarded video + IAP | 5–10 min |

## Required systems (must match)
1. ✅ **Multi-tier difficulty** (5 tiers, 6 levels each = 30 levels)
2. ✅ **Set-size progression**: double-2 → double-6 (12 → 56 cells)
3. ✅ **Two interaction modes**: tap-to-join (mobile) + edge-wall toggle (expert)
4. ✅ **Conflict detection**: highlight duplicate dominoes in real time
5. ✅ **Domino tracker**: visual checklist of all set dominoes (used/unused)
6. ✅ **Unique-solution generator**: backtracking solver verifies uniqueness
7. ✅ **Hint system** (solver-driven, cost a star)
8. ✅ **Undo / reset**
9. ✅ **Star ratings** stored in localStorage
10. ✅ **Daily challenge** (date-seeded)
11. ✅ **Achievements** (8)
12. ✅ **Procedural audio** (Web Audio API)
13. ✅ **OG image + icon** (RunningHub)
14. ✅ **Mobile-first responsive** (touch + mouse)

## Differentiation vs. competitors
- **No download, no ads in the puzzle area** (GameZipper universal banner only)
- **Daily challenge** — most free web competitors only offer static weekly puzzles
- **S-tier polish**: dark neon theme consistent with catalog (Cave/Yosenabe/Numbrix family), animated domino placement, particle effects on completion
- **Verified unique solutions** — many free generators ship ambiguous puzzles; ours guarantees uniqueness

## Risk assessment
- **IP/trademark**: NONE — Dominosa is a public-domain puzzle concept (pre-1900s newspaper puzzle), no brand/IP. ✅ Safe to ship.
- **Sibling collision**: NONE — `dominoes` (block-drafting) and `domino-chain` (chain physics) are different mechanics; tag taxonomy differs.
- **Difficulty curve**: ensure Tier 1 (double-2, 3x4) is genuinely approachable; double-6 Master tier needs a fast solver for hints.
