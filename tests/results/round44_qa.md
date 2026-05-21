# QA Round 44 — 2026-05-21

## Summary
- **115 actual games** (121 dirs - 6 non-game)
- **New game**: schulte-table (Schulte Table, deployed since Round 43)
- **1 fix applied**: quordle home link, index.html game count 116→115

## Phase 1: Full Site Health
- 112/115 games HTTP 200, all ≥85
- 3 CDN cache 404: schulte-table, quordle, compound-word (Fastly HIT, code correct)
- Below 100 (expected, canvas=0): sudoku, simon-says, tower-of-hanoi, tower-defense, dominoes, connect-four, one-line-puzzle, jewel-coloring(85), escape-manor(92)

## Phase 1.5: HTML Structure (from context window)
- 10/10 checks PASS across all games
- schulte-table fixed: monetag-manager.js + engage.js + game-footer.js + H1 + home link

## Phase 2: Deep Interaction (Kachilu)
- 18/18 games tested, 0 JS errors
- schulte-table + quordle show "Page Not Found" (CDN cache 404)

## Phase 3: Commercial Checks
- Initial: 1 issue — quordle missing home link
- Fixed: added 🏠 fixed-position home link to quordle/index.html
- Regression: 115/115 PASS

## Phase 4: Fixes
1. quordle: added home link (a href="/")
2. index.html: game count 116→115 in meta description, og:description, twitter:description

## Phase 5: Regression
- 115/115 PASS (monetag ✅, engage ✅, footer ✅, home link ✅, H1 ✅, file integrity ✅)

## Data Consistency
- games-data.js: 117 live (115 games + 2 non-game)
- game-footer.js: 117 entries
- ItemList: 117 items, sequential
- Homepage: "Play 115 free" ✅
- H1=1, footer=1, Why Play=1

## CDN 404 (pending cache purge)
- schulte-table, quordle, compound-word — Fastly varnish cache returning stale 404

## Git
- commit 9bd7cf1: "fix: quordle home link + index.html game count 116→115"
