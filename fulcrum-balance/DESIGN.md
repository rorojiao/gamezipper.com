# Fulcrum Balance — DESIGN.md

## Phase 2: Competitive Benchmark

### Competitor Analysis
| Game | Downloads | Mechanic | Fulcrum Difference |
|------|-----------|----------|-------------------|
| Balance Scale (ours #441) | — | Coin weighing deduction (find fake coin) | NOT physics torque — pure logic |
| Pulley Lift (ours #487) | — | Rope routing through pulley system | NOT lever placement — rope path puzzle |
| Brain It On! | 50M+ | Physics drawing (draw shapes to solve) | Free-form drawing — NOT discrete placement |
| Thinking Blocks | 10M+ | Block stacking balance | Stacking — NOT torque calculation |

### Core Mechanic: Torque Equilibrium
- Beam sits on a fulcrum at position F
- Positions at integer distances: ..., -3, -2, -1, 0, +1, +2, +3, ...
- Torque = weight × distance from fulcrum
- Balance condition: Σ(weight × distance) = 0

### Differentiation
- **vs Balance Scale**: Deduction puzzle (find fake coin) vs our physics torque calculation
- **vs Pulley Lift**: Rope routing vs our weight placement on a lever
- **vs Brain It On**: Free-form drawing vs our discrete slot-based placement
- **Unique keywords**: fulcrum=0, seesaw=0, teeter=0, lever=4(unrelated), torque-balance=0

## Tier Plan (30 levels, 6 tiers × 5)

| Tier | Levels | Mechanic | Difficulty |
|------|--------|----------|------------|
| 1 | L1-5 | Single weight balance — one fixed weight, place one counterweight | Beginner |
| 2 | L6-10 | Multi-weight — place 2-3 weights from tray | Easy |
| 3 | L11-15 | Move the fulcrum — weights fixed, find fulcrum position | Medium |
| 4 | L16-20 | Mixed — some fixed + some to place, multiple constraint | Hard |
| 5 | L21-25 | Constraint — balance + minimum weights, beam with blocks | Expert |
| 6 | L26-30 | Master — complex multi-weight, asymmetric beams | Master |

## Star Rating
- ⭐⭐⭐: Solve using minimum number of weights
- ⭐⭐: Solve with 1 extra weight
- ⭐: Any valid solution

## Art Style
- Dark neon theme (#0a0a1a background, gradient beam)
- Weights as colored rounded rectangles with kg labels
- Fulcrum as CSS triangle with glow
- Beam tilts based on net torque (visual physics feedback)

## Verification
- Pure arithmetic: torque = Σ(weight × distance) = 0
- Brute-force solvable: enumerate all placements, check balance
- 3-method: Python BFS + Node BFS + in-engine
