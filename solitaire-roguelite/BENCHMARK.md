# BENCHMARK: Solitaire Roguelite

**Slug:** solitaire-roguelite
**Category:** Card / Roguelike / Puzzle
**Date:** 2026-06-11

## Top Competitors

| Game | Platform | Downloads/Users | Rating | Price |
|------|----------|----------------|--------|-------|
| Solitairica | Steam | 432 reviews | Mostly Positive | $7-8 |
| Klondike's Hike | Steam (EA) | 32 reviews | Positive | F2P |
| Card Crawl Adventure | Steam/Mobile | 63 reviews (Steam) | Very Positive | $5 |
| Card Guardians | Google Play | 1M+ | 4.4 (55K reviews) | F2P+Ads |
| Card Thief | Mobile | N/A | 4.4 | Premium |
| Solitomb | itch.io (PICO-8) | N/A | N/A | Free |

## Core Loop Analysis

**Pattern: "Solve Deal to Advance" (Klondike's Hike model)**
- Player plays Klondike solitaire
- Each enemy "stands" while player solves the deal
- Completing the deal = defeating the enemy
- Failed deals cost HP
- Items modify solitaire rules (swap build direction, reveal cards, etc.)
- Permadeath run + meta-progression between runs

**Why it works:**
1. Cards serve multiple roles (HP, mana, attack, puzzle)
2. Solving a deal = same dopamine as defeating a Slay the Spire boss
3. Low-input, high-decision (simple drag/drop, deep strategy)
4. "Just one more run" permadeath loop
5. Rule-bending items = constant novelty

## Our Differentiation

- **Browser-first, free** — No dominant free browser solitaire roguelike exists
- **Klondike + roguelike** — Only Klondike's Hike does this, and it's stale EA
- **3-5 min runs** — Quick sessions for casual portal audience
- **Dark neon aesthetic** — Matches GameZipper visual identity
- **No heavy ads** — Interstitial between runs only, not during

## Design Decisions

1. Use simplified Klondike (7 columns, stock pile, 4 foundations)
2. 3 biomes x 5 enemies + 1 boss each = 18 encounters
3. 12 rule-modifying items (core dopamine source)
4. Single character at launch, meta-currency for upgrades
5. HP system: failed deals damage player, enemies attack per turn
6. Daily challenge seed for replayability

## Competitive Gap

- Klondike's Hike: 17 months stale, only 32 reviews, Early Access
- Card Guardians: mobile-only, excessive ads
- Solitairica: premium ($8), desktop-only
- itch.io games: hobby projects, unpolished
- **Browser gap: WIDE OPEN** — no polished free browser solitaire roguelike exists
