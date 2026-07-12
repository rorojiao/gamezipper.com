# Kuroshuto — Competitive Benchmark

## Game: Kuroshuto (クロシュート)
- **Genre**: Nikoli number-distance shading puzzle
- **Origin**: Nikoli Co., Ltd. (Japan)
- **Rules Source**: janko.at/Raetsel/Kuroshuto/Regeln.htm (confirmed English rules)
- **Catalog Gap**: `kuroshuto`, `kurosh`, `kuroshuto puzzle` — ALL 0 (grep verified, true zero-gap)

## Rules
1. Blacken some cells in the grid.
2. Cells with numbers must NOT be blackened.
3. Black cells must NOT be orthogonally adjacent.
4. For each clue with number N: exactly one of the cells at orthogonal distance N (up/down/left/right, exactly N steps) must be black.
5. All white cells must form a single orthogonally-connected area.

## Competitor Analysis
- **janko.at**: Has 100+ Kuroshuto puzzles with printable PDFs and interactive solver. German-language site, no English UI, no mobile app.
- **Puzzle Team / logicmasters**: Occasional Kuroshuto in collections.
- **Simon Tatham's Puzzle Collection**: Does NOT include Kuroshuto.
- **No dedicated free browser-based English Kuroshuto with progressive levels exists.**

## Differentiation (GameZipper Kuroshuto)
- ✅ 30 progressive levels across 5 difficulty tiers (Beginner → Expert)
- ✅ English UI, mobile-friendly touch support
- ✅ Web Audio API ambient BGM + SFX
- ✅ Hint system (3 per level), 3-star ratings, timer
- ✅ Level select with progress tracking (localStorage)
- ✅ Keyboard support (1/2/H/R/Enter/Esc)
- ✅ Violation highlighting (adjacent blacks, over-constrained clues)
- ✅ Settings panel (music/sfx/autocheck toggles)
- ✅ JSON-LD structured data (VideoGame, FAQPage, BreadcrumbList)

## Technical
- Single-file HTML5 (42KB) with inline levels data
- Canvas-based rendering
- No external dependencies
- Solution-first generation with solver-verified uniqueness (small grids) + full-clue derivation (large grids)
