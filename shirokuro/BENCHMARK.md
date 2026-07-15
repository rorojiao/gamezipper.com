# Shirokuro — Competitive Benchmark

## Source Rules

- **Cross+A**: https://www.cross-plus-a.com/puzzles.htm#Shirokuro
  > "Shirokuro is a logic puzzle invented by Nikoli. It contains white and black circles. The task is to connect each white circle with a black circle by a horizontal or vertical line. Lines are not allowed to cross other lines. The line between two circles may not pass through other circles."

- **Nikoli official**: Published by Nikoli, no numeric hints, pure matching puzzle.

## Game Mechanic

- Place white (W) and black (B) circles on a rectangular grid.
- Each W must be connected to exactly one B by a line.
- Each B must be connected to exactly one W by a line.
- Lines run H/V (Manhattan), can use one or more 90° turns.
- Lines cannot cross.
- Lines cannot pass through any circle (only as endpoints).

## Reference Implementation

- **Gamedesign.jp**: Standard Nikoli implementation (Japanese).
- **Puzzle-mobiles.com**: Web and mobile versions of Shirokuro.

## Differentiation

- **No competing games** with "shirokuro" in the title exist on the GameZipper catalog (verified grep: 0 matches).
- Pure matching puzzle, no numeric hints, no auxiliary constraints.
- Clean, simple rule set: ideal for "casual" puzzle play.

## Validation Plan

- Generator: 30 levels across 5 tiers (5x5 → 9x9).
- Each level solvable (≥1 bijective matching found).
- Verifier: 3-method (independent Node + in-engine vm.runInContext + Python structural via gen_levels.py).
