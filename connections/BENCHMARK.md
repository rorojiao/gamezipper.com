# Connections — Competitive Benchmark

## Game Overview
**Name:** Connections
**Slug:** connections
**Category:** puzzle / word puzzle
**Inspired by:** NYT Connections (launched June 2023, 100M+ players)

## Competitor Analysis: NYT Connections
- **Platform:** NYT Games web + app
- **Players:** 100M+ active, #2 most-played NYT game (after Wordle)
- **Mechanics:** Sort 16 words into 4 groups of 4 that share a theme
- **Difficulty:** 4 color-coded groups (Yellow=easy, Green=medium, Blue=hard, Purple=tricky)
- **Session:** 1 puzzle/day (limited replayability — our version fixes this)
- **Monetization:** NYT subscription wall after archive; we offer free unlimited play

## Our Differentiation
1. **30 handcrafted levels** with progressive difficulty (not just 1/day)
2. **Daily challenge mode** with seeded generation
3. **Unlimited archive** — no paywall, play anytime
4. **Category variety:** Movies, Food, Science, Sports, Geography, Music, etc.
5. **Hint system** — reveal one correct word in a group
6. **Star ratings** — 4 stars = no mistakes, 3 = 1 mistake, etc.
7. **Progress saving** via localStorage

## Game Mechanics
- 4x4 grid of 16 word tiles
- Player selects 4 words they think form a group
- Click "Submit" to check
- Correct: tiles animate to their color group, move to bottom
- Incorrect: "One off" feedback if 3/4 correct (shake animation)
- 4 mistakes allowed before game over
- Groups revealed in difficulty order: Yellow → Green → Blue → Purple

## Technical Spec
- **Single file:** index.html (target ~35-45KB)
- **Rendering:** CSS Grid + DOM (no Canvas needed for word tiles)
- **Input:** Click/tap to select words
- **Audio:** Web Audio API SFX (select, correct, wrong, win)
- **Art:** Procedural CSS (gradient backgrounds, color-coded tiles)
- **Levels:** 30 levels × 4 groups × 4 words = 480 words total

## Difficulty Tiers
- Tier 1 (L1-6): Obvious categories, clear word groups
- Tier 2 (L7-12): Some tricky overlaps, basic wordplay
- Tier 3 (L13-18): Themed wordplay, double meanings
- Tier 4 (L19-24): Complex associations, misdirection
- Tier 5 (L25-30): Expert: subtle themes, red herrings
