# Tasquare (Tasukuea) — Competitive Benchmark

## Game Info
- **Publisher**: Nikoli (Japan)
- **Type**: Square shading logic puzzle
- **Japanese**: たすくえあ (Tasukuea)
- **Source**: janko.at (confirmed DE+EN+JP rules)

## Rules
1. Blacken cells to form square areas (1x1, 2x2, 3x3, etc.)
2. Black squares cannot be orthogonally adjacent (diagonal ok)
3. Numbered cells cannot be blackened
4. Each number = total area of orthogonally adjacent black squares
5. Every unnumbered white cell must have >=1 black neighbor
6. All white cells form a single connected area

## Complexity
- **Grid sizes**: 5x5 (beginner) to 8x8 (expert)
- **Strategy**: Deduction from clue values → square sizes → placement
- **Similar games**: Look-Air (Rukkuea), Sto-stone, Akari

## Competitive MOAT
- First free browser implementation of Tasquare
- 30 unique-solution levels with solver verification
- Full mobile touch support with long-press mode toggle
- Web Audio API ambient music + SFX
