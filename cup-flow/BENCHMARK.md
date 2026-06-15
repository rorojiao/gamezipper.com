# Cup Flow — Competitor Benchmark

**Selected game:** Cup Flow (slug: `cup-flow`)
**Genre:** Water Pouring / Jug Measurement Logic Puzzle (classic "Die Hard 3" jug problem)
**Selected score (Round 17):** 19/25 — D4 S3 R3 F5 Z4
**Status:** Verified genuine GZ gap.

## Why this genre (gap verification)

Existing GZ plumbing/liquid games and why Cup Flow is distinct from each:

| Existing GZ game | Mechanic | Cup Flow distinction |
|---|---|---|
| `liquid-sort` | Separate mixed colors in tubes (color logic) | Cup Flow = pure VOLUME arithmetic, no colors |
| `color-sort` / `ball-sort` etc. | Sort objects by type | Cup Flow = reach exact numeric target volumes |
| `pipe-connect` | Rotate pipe pieces source→drain | Cup Flow = no pipes, pour between cups |
| `flow-connect` | Draw paths between colored dots | Cup Flow = no drawing, discrete pours |
| `fill-glass` | Draw lines to guide water (physics) | Cup Flow = discrete logic, no drawing/physics sim |

`grep` confirmed zero GZ coverage of: jug, measure, pouring-puzzle, target-volume.

## Market data (2026)

- **"Water Pouring Puzzle"** — Y8.com web game (active, played globally).
- **"浇水谜题3D / Water Pouring Puzzle"** — Android (1.1, casual/puzzle, 30MB, published 2025-11).
- **Classic "Water Jug Problem"** — Die Hard 3 cultural reference; staple of brain-teaser apps and coding-interview sites; proven broad appeal.
- Genre is **distinct from the saturated "Water Sort"** category (SortPuz 3D, Liquid Sort Puzzle 1200+ levels) which is color-separation, not volume-measurement.

## Competitor systems to match (S-grade bar)

| System | Competitor standard | Cup Flow target |
|---|---|---|
| Levels | 20–1200+ | 30 levels across 5 difficulty tiers |
| Difficulty curve | gentle ramp | Tier1 (2 cups, easy) → Tier5 (4 cups + source, multi-target) |
| Core mechanic | pour/empty/fill to hit exact volume | identical |
| Star rating | 3-star by move efficiency | 3-star (≤optimal×1.0 / ×1.4 / ×1.8) |
| Undo | yes | undo stack |
| Hint | yes | BFS-computed optimal next move |
| Reset/restart | yes | yes |
| Tutorial | first-level overlay | L1 tutorial overlay |
| Progress save | localStorage, versioned | `cf_save_v1` |
| Level select | grid with lock + stars | grid w/ lock + stars |
| Sound | SFX + BGM | Web Audio procedural SFX + ambient BGM, mute toggle |
| Settings | mute, restart | mute, restart |
| Visual style | clean, liquid animation | neon cups, animated liquid fill, particles |

## Design spec

- **Cups:** 2–4 per level, each with fixed integer capacity.
- **Source:** either one cup pre-filled, OR an infinite faucet (fill action) for higher tiers.
- **Actions:** POUR A→B (transfer min(A's content, B's free space)); EMPTY a cup; FILL from faucet (when present).
- **Goal:** reach exact target amount(s) in designated cup(s).
- **Solvable-by-construction:** each level verified solvable via BFS over state space; optimal move count stored for star thresholds.
- **Scoring:** 3★ = solve in ≤ optimal; 2★ = ≤ optimal×1.4; 1★ = else. Par shown.
- **Generation:** seeded LCG → deterministic, reproducible levels (each level ID = fixed puzzle).
