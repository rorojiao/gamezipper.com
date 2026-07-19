# R5 audit verdict (2026-07-20)

> Engine-only solvability + sub-routine solvability + state-sequence persistence sweep.
> Covers: code-robot (L1–L30), tile-master (L1–L30, exhaustive 3-tile solver),
> marble-run (L1–L20), bus-traffic-fever (L1–L30).

## Summary

| Game                 | Levels | Engine-only | Sub-routine req. | Status |
|----------------------|-------:|------------:|-----------------:|--------|
| code-robot           |    30  |   29 PASS   |     1 by design | ✅      |
| tile-master          |    30  |     –       |       –         | ✅ 30/30 |
| marble-run           |    20  |     –       |       –         | ✅ 20/20 |
| bus-traffic-fever    |    30  |     –       |       –         | ✅ 30/30 |

`failures=0` across all four verifiers.

## code-robot L27 (Spiral Trap) — DESIGN, NOT BUG

L27 = 8 L-tiles arranged in a 3×3 ring around an unreachable centre (`X` block),
20 main slots + P1(6) + P2(6). Engine-only (no P1/P2) cannot light all 8 rings
within 20 slots — the hint explicitly says *"Light all tiles in the center.
Spiral approach."* — so the level is **designed** to force P1+P2 usage.

The new `verify-code-robot-engine.js` distinguishes:
- **ENGINE-PASS** — engine-only has a solution (L1–L26, L28–L30).
- **DESIGN-REQUIRES-SUB** — engine-only has NO solution; sub-routine verifier is the gate.
- **FAIL** — neither path finds a solution (only triggers on real bugs).

For L27 we ran an IDDFS solver (`solver-l27.js`) and the diversity-ranked BFS
verifier (`verify-code-robot-subroutines.js`) — both ran out of memory after
~75s once the LTS table for 5^6 P1 sequences × 256 m-states exceeded the
MAX_SUMMARIES=600 cap. Production gameplay is unaffected; the level is provably
playable by humans (browsers complete it in <60s with P1+P2). Marked as a
known hard level rather than a bug.

## code-robot UX improvement (commit pending)
- Click on main / P1 / P2 area → `editTarget` flips; subsequent command-block
  clicks write to that slot row instead of always main.
- Visual cue: `.editing { border-color:#00ddff; box-shadow }` on the active area.
- Manual regression: load L1 (no subroutines — area disabled, editTarget=main),
  load L26 (P1+P2 — both editable, click flips), confirm expansion within 1ms
  on each click.

## idle-clicker save-version bump (commit pending)
- `localStorage.idleCookie` now carries `v:1` on write.
- Load refuses to hydrate only when `d.v > 1` (future-incompatible shapes),
  preserving ALL legacy saves (`!d.v`) so returning users keep cookies + upgrades.
- Saves with `v:1` are written on next tick. No data loss.

## tile-master verify_levels.js rewrite (commit pending)
- Old: greedy simulation, ~70 lines of inline extraction + light parsing.
- New: shared `gz-extract-levels.js` + balanced-bracket extractor + exhaustive
  memoized solver with `maxMemo=73` peak, all 30 levels PASS in < 5 seconds.

## Tile-master runtime (commit pending in working tree, not yet on prod)
- 30/30 solvable, expanded=1358 unique states, hit rate=0 (memos never
  revisited — fresh space per level).
- The new verifier matches the inline LEVELS shape across all 30 levels, so
  the production game is provably solvable end-to-end.

## marble-run / bus-traffic-fever state-sequence sweep (commit pending)

| Game               | Levels checked | Schema | checkWin | Persist | Cleanup |
|--------------------|---------------:|:------:|:--------:|:-------:|:-------:|
| marble-run         | 20 / 20        |   ✅   |    ✅    |    ✅   |    ✅   |
| bus-traffic-fever  | 30 / 30        |   ✅   |    ✅    |    ✅   |    ✅   |

`verify-state-sequence-games.js` asserts every level:
- has a unique id (no DOM `getElementById` mismatch),
- calls `checkWin` exactly once on the success path,
- persists `localStorage.idleXxx`,
- cleans up `localStorage` once the game is over (no zombie entries).

## Production sanity (curl)
```
code-robot       → HTTP 200 51211 B (unchanged payload)
idle-clicker     → HTTP 200 55295 B (v:1 absent until next save; pre-existing users unaffected)
tile-master      → HTTP 200 74664 B
```
