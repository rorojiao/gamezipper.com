# Satogaeri — Competitive Benchmark

## Puzzle Identity
- **Name**: Satogaeri (郷里 / 里帰り, "Homecoming")
- **Origin**: Nikoli official puzzle
- **Source**: https://www.nikoli.co.jp/en/puzzles/satogaeri/
- **Category**: Movement / region logic puzzle

## Rules (confirmed from Nikoli)
1. The grid is divided into "countries" (regions enclosed by bold borders).
2. Move the circles, vertically or horizontally, so each country contains exactly one circle.
3. The numbers in the circles indicate how many cells they have to pass through (exact Manhattan distance for straight-line moves).
4. Circles without numbers may move any distance (including 0 = stay put).
5. Circles cannot cross the tracks (movement paths) of other circles.
6. Circles cannot pass over other circles.

## Catalog Gap Verification
- `satogaeri` in js/games-data.js: **0 occurrences** (verified grep + Node eval)
- `satogaeri` in any */index.html: **0 occurrences**
- No `satogaeri/` directory exists
- **True zero-gap** — this game is not in the catalog.

## Competitive Landscape
- Nikoli.co.jp hosts the canonical version (sample puzzle + rules).
- No major free browser implementation ranks on Google page 1.
- GameZipper opportunity: first free, no-download HTML5 Satogaeri with 30 levels, hints, star ratings, keyboard support.

## Mechanic Summary for Implementation
- **Display**: grid with region borders, circles at start positions, numbered clue circles.
- **Interaction**: player drags a circle along a straight line (H or V) to relocate it.
- **Validation**: after all moves, each region has exactly one circle, numbered circles moved exact distance, no path crossings.
- **Generation strategy**: solution-first (place targets → derive starts → reveal subset of numbered clues).

## Difficulty Tiers
| Tier | Grid | Regions | Levels |
|------|------|---------|--------|
| Beginner | 5×5 | 4-6 | 6 |
| Easy | 5×6 | 5-7 | 6 |
| Medium | 6×6 | 6-8 | 6 |
| Hard | 6×7 | 7-8 | 6 |
| Expert | 7×7 | 8 | 6 |

## Differentiation
- 30 unique levels (Nikoli sample has ~1 demo)
- Web Audio ambient music + SFX
- 3-tier hint system, star ratings, localStorage progress save
- Mobile touch + keyboard support
