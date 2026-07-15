# Hiroimono (Goishi Hiroi) — Competitive Benchmark

## Phase 0 selection

- **Candidate:** Hiroimono (拾い物 / 碁石拾い / Goishi Hiroi)
- **Selected from:** Round 122 tiered Phase-0 research, after revalidating the 2026-07-15 catalog at 671 live games.
- **Catalog gap:** `url:"/hiroimono/"` = 0, `hiroimono` = 0, `go stones` = 0, and no `hiroimono/index.html` directory existed before this build.
- **Score:** **21/25** (Market 4, SEO 4, Session/monetization 3, Feasibility 5, verified zero-overlap 5).
- **Why now:** the higher-ranked Round-122 candidates Hakyuu/Ripple Effect and Hebi-Ichigo are already live (`/ripple-effect/`, `/hebi/`). Hiroimono is the next unshipped candidate scoring at least 18/25 with confirmed rules.

## Authoritative benchmark

- Rules and puzzle data: https://www.janko.at/Raetsel/Hiroimono/index.htm
- Rule archive contains 30 interactive puzzles across sizes 5×5 through 12×12.
- The source describes Hiroimono as a Japanese logic puzzle that appeared at the 1999 World Puzzle Championship.
- "Hiroimono" / "Goishi Hiroi" means picking up Go stones one at a time.

## Canonical rules

1. Remove every Go stone by numbering them in removal order.
2. Start with any stone.
3. The next stone must lie on the same row or column as the current stone.
4. You may not skip an **unremoved** stone on that line. Removed positions are empty and may be passed through.
5. After the first move, you may continue straight or turn left/right, but may not reverse directly toward the immediately previous stone.

## GameZipper product benchmark

### Systems matched from mature GameZipper puzzle titles

- Complete 30-level progression grouped into five tiers.
- Timer, move count, hints, three-star result, level select, tutorial/how-to-play panel, settings, keyboard and touch input.
- Persistent progress and settings in localStorage.
- Web Audio procedural ambient music and interaction/win/error SFX.
- Commercial site chrome: Monetag manager, below-game ad slot, analytics, and game footer.
- SEO: canonical URL, Open Graph, VideoGame, FAQPage, BreadcrumbList; no fabricated AggregateRating.

### Differentiation

- First sequential Go-stone pickup puzzle in the catalog.
- Unlike Go, Reversi, Peg Solitaire, and Hiroimono-adjacent path puzzles, the core verb is **select the nearest remaining stone on a row/column without reversing**.
- The board visibly traces the player's route while the remaining legal stones glow, so the rule is understandable without reading a long manual.

## Level strategy

This release uses the 30 canonical CC BY-NC-SA Otto Janko puzzle layouts as benchmark inputs, with attribution in the in-game How to Play panel and source metadata. For each level, the hidden solution order is replayed through an independently implemented legal-move validator before packaging. Sizes naturally scale across tiers:

- Beginner: levels 1–6, 5×5–6×6
- Easy: levels 7–12, 6×6–7×7
- Medium: levels 13–18, 7×7–8×8
- Hard: levels 19–24, 8×8–9×9
- Expert: levels 25–30, 10×10–12×12

## QA acceptance

- All 30 layouts parse and contain unique stone coordinates.
- Stored route visits every stone exactly once.
- Every transition is row/column aligned.
- No move skips an unremoved stone.
- No move reverses directly toward the previous stone.
- The exact same checks run in Python, an independent Node verifier, and the actual in-engine `validateRoute` function.
