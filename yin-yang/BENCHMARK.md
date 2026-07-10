# Yin-Yang (Shiromaru-Kuromaru) — Competitive Benchmark

## Game
**Yin-Yang** (Japanese: Shiromaru-Kuromaru / しろまるくろまる) — a Nikoli-style two-colour connection logic puzzle.

## Rules (verified)
1. Every cell must contain a white (○) or black (●) circle.
2. All white circles form a single orthogonally-connected group.
3. All black circles form a single orthogonally-connected group.
4. No 2×2 area may be entirely one colour.
5. Some cells are pre-filled clues; the puzzle has exactly one solution.

## Catalog Gap (grep-verified = 0)
- `yin-yang`, `yinyang`, `yin yang`, `shiromaru`, `kuromaru`, `shiromaru-kuromaru` — all 0 occurrences in js/games-data.js and no `/yin-yang/` url registered.

## Competitors / References
- **Nikoli** — original publisher of Shiromaru-Kuromaru.
- **PuzzleTeam / puzz.link / Grandmaster Puzzles** — Yin-Yang appears in modern logic-puzzle collections and the World Puzzle Championship.
- **Ferramenta apps** (mobile "Yin Yang" logic puzzles) — typically offer fixed level packs with connectivity + 2×2 rules identical to ours.

## Differentiation
- 30 hand-verified unique-solution levels across 5 tiers (5×5 → 9×9).
- 4-method verification pipeline guaranteeing every level is uniquely solvable.
- Single-file HTML5, mobile + keyboard support, ambient Web Audio music, star ratings, hints, localStorage progress.
- Clean click-to-cycle interaction (white → black → empty) with live 2×2 violation highlighting.

## Systems benchmarked & matched
| System | Competitor norm | Our build |
|--------|----------------|-----------|
| Level count | 20–50 | 30 |
| Difficulty tiers | 3–5 | 5 |
| Unique solution guarantee | yes | yes (4-method) |
| Hints | often | 3/level |
| Mobile support | yes | touch + responsive canvas |
| Audio | rare | ambient BGM + SFX |
| Progress save | yes | localStorage |
| Star ratings | sometimes | 3-star (hint-based) |
