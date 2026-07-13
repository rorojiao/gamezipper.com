# Nansuke — Competitive Benchmark

## Game
**Nansuke** (ナンスケ, Number Skeleton) — Nikoli official puzzle.
URL: https://www.nikoli.co.jp/en/puzzles/nansuke/

## Rules (confirmed from Nikoli official page)
- Fill all blank cells with the numbers in the list below the grid.
- Numbers are placed either **across** (left-to-right) or **down** (top-to-bottom).
- One cell has only one number (digit).
- Each number in the list is used exactly once.

## Catalog Gap Verification (grep on js/games-data.js)
- `nansuke` — 0 occurrences ✅
- `nansuke puzzle` — 0 occurrences ✅
- `number skeleton` — 0 occurrences ✅

## Competitor Analysis
| Source | Features | Our Edge |
|--------|----------|----------|
| Nikoli official | Print/book puzzles, no interactive | Free, interactive, 30 levels, hints, stars, music |
| Puzzle apps (mobile) | Tap-to-place, hints | No download, browser, keyboard+touch, Web Audio |

## Our Implementation
- **Mechanic**: Number skeleton crossword. Grid with black/white cells; place list numbers across or down.
- **30 levels** across 5 tiers: 6×6 Beginner → 7×7 Easy → 8×8 Medium → 9×9 Hard → 9×9 Expert (denser).
- **Generation**: Random crossword grid → random digit fill → uniqueness verification (number-matching solver with MRV ordering + node budget).
- **Verification**: 3-method — Python structural (gen_levels.py) + independent Node.js + in-engine checkWin.
- **Systems**: click-to-select number chip, click-to-place, erase mode, hint (3/level), check, clear, 3-star ratings (time+hint based), level select grouped by tier, timer, keyboard (E/H/R/Enter/Esc), Web Audio ambient BGM (Cmaj-Dm-Am-G chord progression) + SFX (place/erase/error/hint/win/click), localStorage save+settings, confetti win, touch support.
- **SEO**: VideoGame, FAQPage, BreadcrumbList JSON-LD, gz-sr-only H1.
