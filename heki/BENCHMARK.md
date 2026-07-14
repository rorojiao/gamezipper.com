# Heki — Benchmark & Rules

## Source
- **cross-plus-a.com** (http://www.cross-plus-a.com/puzzles.htm#Heki): "Heki is a logic puzzle invented by Nishiyama Yukari (Japan). A rectangular or square grid contains numbers in some cells. The goal is to divide the grid into regions of exactly six cells. Each region contains exactly two numbers. The number indicates how many cells of the same region are orthogonally adjacent to the cell with the number."

## Catalog Gap (grep verified 2026-07-15)
- `heki`, `heki puzzle`, `six cell region puzzle`, `nikoli heki` — all 0 occurrences in js/games-data.js, js/itemlist-schema.js, sitemap.xml, index.html.
- No `heki/` directory exists.

## Rules (confirmed)
1. The grid is a rectangle. R×C must be divisible by 6 (so the grid can be partitioned into 6-cell regions).
2. Some cells contain numbers (the clues). Every region contains **exactly two** numbered cells.
3. Each number indicates how many cells **of the same region** are orthogonally adjacent to that numbered cell (0-4).
4. Goal: draw borders to divide the grid into regions of exactly 6 cells each, where every region has exactly two numbers and the numbers match the orth-adjacency count.

## Mechanic Summary
- **Family**: region division (like Shikaku / Five Cells / Scrin), but with **fixed region size 6** and **exactly 2 clues per region**.
- **Clue meaning**: in-region orthogonal neighbour count (not total neighbours — only those in the SAME region).
- **Interaction**: edge-toggle (click borders between cells, like Scrin/Slitherlink/Five Cells).
- **Win check**: (a) every region has exactly 6 cells, (b) every region has exactly 2 clues, (c) each clue value equals its in-region orth-neighbour count.

## Generation Strategy
- **Solution-first**: random BFS partition of the grid into 6-cell regions (grow regions from seeds, each region is a 6-cell connected polyomino).
- **Clue selection**: for each region, pick 2 cells as clues, compute their in-region orth-neighbour count.
- **Difficulty scaling**: reveal more/fewer clues is NOT an option (rule mandates exactly 2 per region). Instead difficulty scales via grid size and region shape complexity.
- **Uniqueness**: optional solver verification (backtracking edge-variable solver); for larger grids rely on structural verification (solution-match win-check).

## Grid sizes (R×C divisible by 6)
- Beginner: 6×6 (6 regions)
- Easy: 6×8 (8 regions)
- Medium: 6×10 (10 regions)
- Hard: 8×9 (12 regions) — 72 cells
- Expert: 9×12 (18 regions) — 108 cells

## Reference games (for UI/UX patterns)
- Scrin (#663) — region division with edge-toggle, identical interaction model
- Five Cells (#612) — fixed-size region division
