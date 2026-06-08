# Shakashaka Competitive Benchmark

## 1. Game Overview

Shakashaka (シャカシャカ), also known as "Proof of Quilt", is a Nikoli logic puzzle.
Played on a rectangular grid of white and black cells; some black cells carry numbers 0-4.
Player places black right-triangles into white cells (4 orientations: NW, NE, SW, SE).

Rules:
- White area left uncovered by triangles forms rectangles/squares (no shared edges)
- Each numbered black cell has exactly that many adjacent triangles
- NP-complete to solve (Demaine et al., 2014)

## 2. Competitor Analysis

| Competitor | Platform | Rating | Downloads | Features |
|-----------|----------|--------|-----------|----------|
| zen logic (Android) | Android | 4.6/5 (7 reviews) | 500+ | 7 sizes, 3 difficulties, ad-gated hints |
| puzzle-shakashaka.com | Web+iOS | N/A | N/A | 5 sizes, daily/weekly/monthly, Hall of Fame, Patreon |
| pzl.org.uk | Desktop | N/A | N/A | 500 puzzles, 18 hint algorithms, educational |
| PuzzleMadness | Web | N/A | N/A | Daily puzzle since 2014, leaderboard, archive |
| Yuki Fujimoto (iOS) | iOS | N/A | N/A | Multiple difficulties, basic features |

## 3. Gap Opportunity

- No polished mobile-first browser version
- No unique-solution guarantee on mobile
- No explainable hints on mobile/web (pzl.org.uk has it on desktop only)
- Simon Tatham's collection does NOT include Shakashaka
- No dark mode / theme options in any competitor

## 4. Our Implementation Plan

- 30 handcrafted levels (5x5 to 12x12)
- 5 tiers of 6 levels each
- Daily challenge (seeded)
- Undo, hints, error check
- Star ratings (time-based)
- Dark theme (GameZipper style)
- Web Audio BGM + SFX
- Tutorial for first-time players
- localStorage progress save
