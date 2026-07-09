# Juosan — Competitive Benchmark

## Source
- **Official**: Nikoli Juosan (縦横) — https://www.nikoli.co.jp/en/puzzles/juosan/
- **Type**: Binary fill puzzle with territory constraints
- **Catalog gap**: `juosan`, `juosan puzzle`, `juosan nikoli`, `vertical horizontal puzzle` — ALL 0 (grep verified 2026-07-10)

## Rules (Official Nikoli)
1. Fill in all cells, each with either a **—** (horizontal dash) or a **|** (vertical bar).
2. The areas enclosed by bold lines are **Territories**. Numbers in Territories show how many more of — or | marks they get. For example, a clue "3—" means there are 3 more — than | in that territory. "3|" means 3 more | than —. Territories with no number may have any count.
3. **— marks**: Can extend across 3+ cells horizontally (rows), but **NOT more than 2 cells** consecutively in any vertical direction (column).
4. **| marks**: Can extend across 3+ cells vertically (columns), but **NOT more than 2 cells** consecutively in any horizontal direction (row).

## Mechanic Summary
- **Binary grid fill**: Every cell is either — (H) or | (V)
- **Territory clues**: Difference constraints — "N−" means (count of −) − (count of |) = N; "N|" means (count of |) − (count of −) = N
- **Run constraints**: No 3+ consecutive — in any column; no 3+ consecutive | in any row
- **Win**: All cells filled satisfying all territory clues and run constraints

## Difficulty Scaling
- **Beginner**: 4×4 grid, 2-3 territories, simple clues
- **Easy**: 5×5 grid, 3-4 territories
- **Medium**: 6×6 grid, 4-5 territories
- **Hard**: 7×7 grid, 5-6 territories
- **Expert**: 8×8 grid, 6-8 territories, tighter constraints

## Generation Strategy
- **Reverse approach**: Generate a random valid solution first, then derive territory clues
- Solution generation: Random binary grid ensuring run constraints (no 3+ H in columns, no 3+ V in rows)
- Territory partition: Random connected region partition with BFS growth
- Clue derivation: For each territory, compute (count_H − count_V) and add the clue if nonzero
- Uniqueness: Verify via backtracking solver that only the generated solution satisfies all constraints

## H5 Feasibility
- **Complexity**: Medium — binary grid with constraint checking, no complex physics
- **File size estimate**: 40-50KB (single-file HTML)
- **Interaction**: Click cell to toggle — / | / empty; keyboard support (H/V/E or 1/2/0)
- **Rendering**: Canvas with bold territory borders, cell symbols, clue numbers

## Unique Value Proposition
- Completely unique mechanic not in catalog (no other "binary fill + run constraint" puzzle)
- Clean visual design — simple symbols (— and |) with territory outlines
- Satisfying click-toggle interaction
- Good difficulty progression potential
