# Sto-stone — Competitive Benchmark

## Puzzle Identity
- **Name**: Sto-stone (ストストーン)
- **Origin**: Nikoli Co., Ltd. (Japan)
- **Type**: Shading / gravity puzzle
- **Category**: Region Division + Shading (hybrid)

## Rules (verified from nikoli.co.jp official cache)
1. Grid divided into **Rooms** (areas enclosed by bold lines)
2. Each room may contain a number → indicates count of **continuous black cells** in that room
3. Rooms with no number → any number of black cells allowed
4. Black cells **cannot connect** across room borders (vertically or horizontally)
5. When all black cells are **dropped straight down** (gravity), they must fill the **bottom half** of the grid with no empty cells
6. After dropping, stones may cross room borders (only pre-drop placement respects borders)

## Catalog Gap Verification (2026-07-10)
| Search Term | gamezipper.com Results |
|---|---|
| `sto-stone` | 0 |
| `stostone` | 0 (false positive in 'monetag-manager' js var) |
| `sto stone puzzle` | 0 |
| `gravity stones puzzle` | 0 |

**Conclusion**: True zero-gap. No existing coverage.

## Competitive Landscape
| Competitor | Platform | Features |
|---|---|---|
| Nikoli puzzle.nikoli.com | Web (paid) | Original, subscription-only |
| puzz.link | Web (free) | Editor + solver, community puzzles |
| Penpa-Edit | Web (free) | Generic editor, no game UX |

**GameZipper Advantage**: First free browser game with full level system, hints, stars, audio, mobile support.

## Game Design
- **Grid**: R×C where R is always EVEN (bottom half = R/2 rows)
- **Rooms**: Random connected regions (3-8 cells each)
- **Clues**: Numbers on some rooms (continuous black cell count)
- **Interaction**: Click cell to toggle black/white; gravity preview
- **Difficulty Tiers**: 5×4 Beginner → 8×8 Expert
- **Levels**: 30 total (6 per tier)

## Technical Notes
- Gravity simulation: for each column, collect all black cells, stack at bottom
- Validity check: after gravity, bottom R/2 rows fully filled, top R/2 rows fully empty
- Room constraint: no two adjacent black cells from different rooms
- Clue constraint: each numbered room's max connected black group = clue number
