# Aqre — Competitor Benchmark

## Game Identity
- **Name:** Aqre (アックレ)
- **Author:** Nishiyama (Nikoli)
- **Genre:** Shading logic puzzle (pure deduction, no guessing)
- **Slug:** `aqre`

## Rules (canonical, Nikoli)
1. Shade some cells black (each cell is black or white).
2. The grid is divided into **rooms** (regions bounded by thick borders).
3. A **numbered room** must contain exactly that many black cells. Unnumbered rooms have no count constraint.
4. **No three consecutive black cells** may appear in any row or column (horizontally or vertically). (White runs are unrestricted.)
- There is **no connectivity requirement** for black cells (they may be disconnected).

## Benchmarked Competitors
### 1. Nikoli Aqre (canonical)
- Hand-crafted levels, sizes 6×6 → 10×10+.
- Rooms are arbitrary polyominoes (often irregular), clues sparse (many rooms unnumbered).
- Logic: "X-Wing"-style counting, forced-white from 3-consecutive rule, room-count deductions.
- Pure deduction, fully deterministic.

### 2. Puzzle-AQRE apps / Simon Tatham-style "Unruly" (adjacent concept)
- Unruly = no-3-consecutive for BOTH colors. Aqre is the "rooms + black-only" cousin.
- Proves the 3-consecutive mechanic is engaging on small-medium grids.

### 3. In-house GZ shading suite (kurotto, yajisan-kazusan, norinori)
- Established house style: dark-neon, 5 tiers (Beginner 5×5 → Expert 8×8), 20-30 levels, star rating, hints, undo, tutorial, procedural Web Audio.
- Aqre slots directly into this proven pipeline.

## Systems to Implement (full S-grade parity)
| System | Spec |
|--------|------|
| Core mechanic | Tap cell → toggle black/white; thick room borders drawn |
| Rule enforcement (live) | Optional live 3-consecutive violation highlight (off by default, toggleable) |
| Win check | Every numbered room count satisfied AND no 3-consecutive black run |
| Levels | 24 levels, 5 tiers, difficulty curve Beginner→Expert |
| Solvability | ALL levels verified UNIQUE via backtracking solver (this is the critical integrity gate) |
| Scoring | base 1000 + time bonus − hint penalty |
| Star rating | 3 tiers by time/hints |
| Hints | 3 per level (reveal a cell's correct state) |
| Undo / Reset | full history stack |
| Progress save | localStorage v1, unlock progression |
| Tutorial | skippable 5-step |
| Audio | procedural ambient BGM + 7 SFX (Web Audio API) |
| Art | generated icon (512px) + OG image |
| SEO | 4 JSON-LD blocks, og tags, canonical |

## Difficulty Curve
- Tier 1 Beginner (5×5): mostly filled counts, easy 3-consecutive deductions
- Tier 2 Easy (6×6): some unnumbered rooms
- Tier 3 Medium (7×6): sparser clues
- Tier 4 Hard (7×7): heavier counting logic
- Tier 5 Expert (8×8): minimal clues, deep deduction chains

## Generation Strategy
Solution-first + uniqueness verification:
1. Generate random shading satisfying the 3-consecutive rule.
2. Overlay a rectangular room partition (guillotine cuts).
3. Reveal a subset of room counts as clues.
4. Backtracking solver finds all solutions (cap 2); accept only if unique == generated solution.
