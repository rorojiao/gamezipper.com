# BENCHMARK — Magnets Logic Puzzle

## Selection Score: 21/25

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Market Demand | 3 | Classic Nikoli-style logic puzzle, strong in puzzle magazines/apps |
| SEO Gap | 4 | "magnets puzzle" / "logic puzzle" / "mag-net puzzle" — zero GZ coverage, true gap |
| Retention | 4 | Constraint-satisfaction "aha" loop = high session length |
| Feasibility | 5 | Single-file Canvas, deterministic rules, reliable generation |
| Zero-overlap | 5 | GZ has no magnet/polarity logic puzzle |

## Competitive Benchmark

### Source puzzle type
"Magnets" (a.k.a. Mag-Net) — a Nikoli-style logic puzzle. Each puzzle is a grid
partitioned into dominoes. Each domino holds one `+` and one `-` pole (or is
neutral). Clues around the grid give the count of `+` and `-` per row/column.
Constraint: no two `+` may be orthogonally adjacent, no two `-` may be adjacent.

### Reference implementations analyzed
- **Simon Tatham's Portable Puzzle Collection — "Magnets"**: cleanest reference.
  Generator produces unique-solvable puzzles. Keyboard + mouse. Single undo.
- **Puzzle Baron's Magnets**: timed scoring, star ratings, hint system, difficulty tiers.
- **Conceptis Puzzles "Magnets"**: weekly magazine, progressive grid sizes.

### Systems to match (S-tier parity)
1. **Core mechanic**: tap cells to cycle through + / - / neutral. Domino partition visible.
2. **Live validation**: row/col clue counters update; satisfied clues turn green.
3. **Constraint feedback**: adjacent same-pole cells highlighted as violations.
4. **Hint system**: reveal a cell from the stored solution (limited per level).
5. **Star rating**: 3 tiers by time + hints used.
6. **Scoring**: base + time bonus - hint penalty.
7. **Undo / Reset**.
8. **Check button**: specific feedback (line violation vs count mismatch vs domino error).
9. **Level select** with unlock progression + localStorage save.
10. **Tutorial** (first-visit, skippable).
11. **Web Audio BGM + SFX**.
12. **5 difficulty tiers**, progressive grid size + clue sparsity.

### Win-check design decision (RULE-BASED)
Like Aqre, win-check is RULE-BASED, not solution-matching: a level is "solved"
when all clue counts are satisfied AND no adjacent same-pole violations AND every
non-neutral domino has exactly one + and one -. This is the correct judgment
method for generated puzzles (matches how real Magnets apps judge) and sidesteps
the unique-solvability problem of randomly generated grids. Each stored solution
is verified VALID against its own clues + rules; hints reveal the stored cell.

## Level Design (30 levels, 5 tiers)

| Tier | Levels | Grid | Dominoes | Clue reveal | Difficulty driver |
|------|--------|------|----------|-------------|-------------------|
| Beginner | 5 | 4x4 | 8 | ~100% | Learn mechanic |
| Easy | 5 | 4x5 | 10 | ~90% | + clue sparsity |
| Medium | 5 | 5x5 | ~12 | ~80% | Larger grid |
| Hard | 5 | 5x6 | ~15 | ~70% | Sparse clues |
| Expert | 5 | 6x6 | ~18 | ~60% | Minimal clues |

## Art & Music Direction
- **Art**: Procedural Canvas — neon dark theme, + poles in warm red/amber, - poles
  in cool blue/cyan, domino borders glowing. No external assets (puzzle doesn't
  need photoreal art). SVG/CSS gradients for atmospheric background.
- **Music**: Web Audio API procedural ambient BGM (chord-pad loop) + 8 SFX
  (place +, place -, place neutral, clue-satisfied chime, violation buzz, hint,
  win fanfare, button click).
