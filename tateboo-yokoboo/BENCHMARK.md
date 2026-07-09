# Tateboo-Yokoboo — Competitive Benchmark

## Puzzle Identity
- **Name**: Tateboo-Yokoboo (タテボーヨコボー)
- **Origin**: Nikoli puzzle type
- **Category**: Line drawing / path placement

## Rules (Official, from janko.at)

1. Draw straight lines in the grid — lines run horizontally or vertically through cell centers
2. Every white cell must have exactly ONE line passing through it
3. A number in a **black cell** = how many lines **end** on the four edges of that cell
4. A number in a **white cell** = the **length** of the line passing through it
5. A single line must NOT pass through 2 or more white-numbered cells
6. Lines may end at black cells (one or both ends), or at grid edges

## Core Mechanics
- **Line placement**: horizontal (ew) or vertical (ns) through each white cell
- **Segment grouping**: consecutive same-direction cells = one line segment
- **Black cells** block lines and serve as endpoints
- **Grid edge**: lines can also terminate at the grid boundary

## Catalog Gap Analysis
- `tateboo-yokoboo`: 0 occurrences ✅
- `tateboo`: 0 occurrences ✅  
- `yokoboo`: 0 occurrences ✅
- `tatebo-yokobo`: 0 occurrences ✅
- `tatebo`: 0 occurrences ✅
- `yokobo`: 0 occurrences ✅

## Competitive Landscape
- No English-language web implementation found
- janko.at has print/interactive examples (German/English rules)
- Nikoli publishes in print magazines (Puzzle Communication Nikoli)
- Blog source: bachelor-seal-puzzle (Iwa Daigeki)

## Level Design Approach
- **Solution-first generation**: 
  1. Place black cells (forming the grid structure)
  2. Assign each white cell a direction (H or V) such that connected same-direction runs form valid segments
  3. Derive clues: white-numbered cells get segment length; black-numbered cells get endpoint count
  4. Greedily minimize revealed clues while maintaining unique solution
- **Difficulty tiers**: 5×5 (Beginner) → 10×10 (Expert)

## Game Systems
- Click cell to toggle direction (H ↔ V)
- Right-click or eraser mode
- Violation highlighting (unsatisfied clues in red)
- Hint system (3 per level)
- 3-star ratings
- Level select grouped by tier
- Web Audio BGM + SFX
- localStorage save
- Keyboard support
