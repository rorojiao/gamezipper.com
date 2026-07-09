# Pencils — Competitive Benchmark

## Source
- **Official**: Nikoli Pencils (ペンシルズ) — https://www.nikoli.co.jp/en/puzzles/pencils/
- **Type**: Region-division + path-drawing puzzle
- **Catalog gap**: `pencils`, `pencils puzzle`, `pencils nikoli`, `pencil placement puzzle` — ALL 0 (grep verified 2026-07-10)

## Rules (Official Nikoli)
1. Draw out pencils — a pencil is a **straight group of one or more cells** with a tip (lead) at one end.
2. Draw a **line from the tip** of each pencil going horizontally, vertically, or turning.
3. The cell with a **number** in the pencil shows the **length of the pencil** (the number of cells the pencil body occupies, including the tip cell).
4. One pencil may have **no, one, or several numbers** in its cells.
5. The line from the tip goes through **exactly as many cells as the number** in the pencil.
6. The line from a pencil **cannot cross itself or branch off**.
7. Every cell must belong to exactly one pencil body or one pencil line (full coverage).

## Mechanic Summary
- **Pencil bodies**: straight (H/V) runs of cells, each with a tip and a length indicated by number clues within.
- **Pencil lines**: simple paths (non-self-crossing, non-branching) starting from each tip, of exact length = the pencil's number.
- **Full coverage**: every cell is either part of a pencil body or traversed by exactly one pencil line.

## Difficulty Tiers
- Beginner: 5×5 grids, short pencils (length 2-3)
- Easy: 6×6 grids, medium pencils
- Medium: 7×7 grids, more pencils
- Hard: 8×8 grids, longer lines with turns
- Expert: 9×9 grids, complex path interactions

## Unique Selling Points
- Novel Nikoli type combining region-division with path-drawing
- Full-coverage constraint makes it a satisfying "fill the grid" puzzle
- Visual elegance: pencils with tips and flowing lines
