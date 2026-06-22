# Nondango — Benchmark & Spec

## Game
**Nondango** (ノンダンゴ, "No Dumplings") — a Nikoli logic puzzle. NEW TYPE on GameZipper (zero overlap with all 408 existing games).

## Rules (CONFIRMED — janko.at authoritative rules archive + Wikipedia)
A rectangular grid in which **every cell contains a circle**. The grid is divided into **regions** (outlined areas). The solver must **color each circle black or white** so that:

1. **Exactly one black per region**: In each region, exactly ONE circle is black (all others white).
2. **No three-in-a-line**: In any horizontal, vertical, or diagonal line, there must not be three circles of the SAME color in a row (consecutive) — they must be broken by a circle of the other color. (Equivalent: no 3 consecutive same-color circles in any of the 8 compass directions.)

**The only givens are the region boundaries.** Every cell is a circle; the player determines black/white.

## Sources
- https://www.janko.at/Raetsel/Nondango/index.htm (German rules: "In jedem Gebiet muss genau ein Kreis schwarz sein" + "In einer horizontalen, vertikalen oder diagonalen Linie dürfen sich keine drei Kreise gleicher Farbe befinden")
- Wikipedia "List of Nikoli puzzle types" lists Nondango; arXiv:2310.11447 "Nondango is NP-Complete" (Ruangwises, 2024)
- Grid sizes seen: 4x4, 6x6, 8x8, 10x10, 12x12, 14x14

## Competitor benchmarking
- **janko.at**: 110 handcrafted Nondango puzzles, 6 difficulty tiers (leicht→schwer), sizes 4x4 to 14x14.
- **Nikoli Puzzle Communication**: occasional Nondango puzzles.
- **Subaru Puzzle / Kumorizora blogs**: community Nondango content.
- SEO demand: niche but dedicated; "nondango" is a unique search term with zero GZ competition.

## Generation approach (binary CSP, tractable — analogous to proven Binairo generator)
1. **Region partition**: random partition of the W×H grid into connected regions of size 2–6.
2. **Solver**: backtracking binary assignment (each cell black/white) satisfying:
   - exactly one black per region
   - no 3 consecutive same-color in any of 8 directions
3. **Uniqueness check**: count solutions; keep puzzle only if exactly 1 solution.
4. If not unique after N attempts, regenerate partition.

## Level structure (27 levels, 6 tiers)
- Beginner (4): 4x4 — 5x5  (small, 4-6 regions)
- Easy (4): 6x6
- Medium (5): 7x7 — 8x8
- Hard (5): 8x8 — 9x9
- Expert (5): 10x10
- Master (4): 11x11 — 12x12

## Player interaction
- Click a circle to toggle: white → black → white (cycle).
- Region boundaries drawn as thick lines.
- Win detection: check all constraints satisfied.
- Tools: Undo, Hint (reveal one correct cell), Check, Reset.
- Progress saved to localStorage (versioned), per-level best time.
