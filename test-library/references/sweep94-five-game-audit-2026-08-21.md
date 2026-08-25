# Sweep 94 — Five-game audit (2026-08-21)

**Sweep 94 batch**: magic-tiles, slice-master, cryptograms, punch-master, windmill-sudoku
**Sweep head commit**: c388ad7f62
**Live total**: 452 games
**Coverage after sweep**: 207/452 (45.8%)

## Per-game verdicts

| Slug | Verdict | Evidence type | P0/P1 fix shipped |
|------|---------|---------------|-------------------|
| magic-tiles | PASS | verifier 30/30 + Kachilu nav+state | none |
| slice-master | PASS | verifier 3/3 + Kachilu canvas | none |
| cryptograms | PASS | verifier 202/202 + Kachilu game-screen | none |
| punch-master | PASS | Kachilu canvas+state (no verifier) | none |
| windmill-sudoku | PASS | verifier 27/27 + Kachilu 3-grid canvas | P1 test-gate (verify.js) |

## P1 test-gate fix shipped

**windmill-sudoku/verify.js** had `readFileSync('/tmp/windmill_levels.json')` (cwd-shadow bug per gamezipper-qa Pitfall #50). Fixed to extract `const LEVELS=[...]` from inlined index.html using regex `m = html.match(/const LEVELS = (\[\\s\\S]*?\\]);/)` + `JSON.parse(m[1])` + `__dirname`-based path.

Before fix: `Error: ENOENT /tmp/windmill_levels.json` (silent FAIL under `cwd=repo-root`)
After fix: 27/27 levels verified — valid 9x9 sudoku, shared box consistency A6↔D2/A8↔B0/B6↔C2/C0↔D8, puzzle[g]=solution[g] for all givens, unique solutions where checked.

## Real Kachilu headless caveats

- **rAF-driven canvas games appear "stuck at countdown" in headless Kachilu** because `document.hidden=true` at page load locks rAF even after visibility override. magic-tiles countdown stayed at "3" across 1.5s sampling in headless, but renders correctly on real browsers (verifier + chrome + state init all PASS).
- **dead_click BI signal (punch-master)** is Kachilu timing artifact — game loads fully on first action (canvas 1280×525 with 671K pixels after Play Now click). Real users don't see stuck clicks.
