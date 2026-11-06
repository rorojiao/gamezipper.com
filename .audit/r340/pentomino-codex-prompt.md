You are fixing a real P0 defect in the GameZipper pentomino puzzle game, in the
repo worktree at /tmp/gz-codex-r340-pentomino (git branch codex/r340-pentomino).

DO NOT commit, DO NOT push, DO NOT touch any file outside pentomino/.
Work only inside pentomino/.

## Background (already verified by the auditor - trust these findings)

The pentomino game ships 30 levels in TWO separate files that have drifted apart:

1. `pentomino/levels-data.js`  -> the RUNTIME source actually loaded by the page
   (`const PENTOMINOES_LEVELS = [...]`, compact format: {n, t, c, r, o[], p[], s[]})
2. `pentomino/levels.json`      -> the AUDIT/verifier source
   ({cols, rows, outline[], pieces[], solution[]})

`pentomino/gen_levels.py` generates ONLY levels.json (verified: it reproduces the
shipped levels.json 30/30 with seed 42). levels-data.js is maintained by hand and
has drifted, so runtime and audit disagree and the runtime has an UNSOLVABLE level.

## DEFECT 1 (P0) - the `N` pentomino shape is wrong in 5 files

The engine's shape table has the L-tetromino's mirror image labelled as `N`.
Current (WRONG) N cells, in all 5 files:
    N: [[0,1],[1,1],[2,1],[3,0],[3,1]]
That cell set is identical (up to rotation/reflection) to `L`, so the game only
has 11 distinct free shapes while it claims 12. An independent enumeration of
the 12 free pentominoes proves the true canonical N is:
    N: [[0,0],[1,0],[2,0],[2,1],[3,1]]
(A 4-long column with one cell attached at the bottom-right, i.e. a "staircase"
shape - NOT congruent to L.)

The wrong N appears in these 5 files (all must be fixed):
  - pentomino/index.html           (line ~441, in the PENTOMINOES_LOCAL table)
  - pentomino/verify_engine.js     (line ~17)
  - pentomino/verify_independent.js(line ~18)
  - pentomino/verify_python.py     (line ~21)
  - pentomino/gen_levels.py        (line ~33)

Proof of the defect: `.audit/r340-pentomino-shapes.js` enumerates all 12 free
pentominoes and reports `COLLISION: L === N` today. After your fix it must
report NO collision, and `N` must have 8 orientations.

IMPORTANT: 10 of the 30 shipped levels reference the `N` piece. Because the
shape was wrong, their stored solutions are invalid for the corrected shape.
You MUST regenerate the affected levels rather than hand-editing solutions.

## DEFECT 2 (P0) - runtime/audit drift + an unsolvable runtime level

Current state:
  - levels.json  : 30 levels, 0 unsolvable
  - levels-data.js: 30 levels, 1 UNSOLVABLE
      idx 5  tier=Beginner pieces=["Y"]  outline ["####","...#"]
      -> no exact cover for ["Y"] in ["####","...#"]
    (levels.json has ["####","..#."] at the same index, which IS coverable by Y)
  - 5 levels differ between the two files entirely.

This means a PLAYER can load a level that can never be solved.

## DEFECT 3 (P1) - 4 duplicate level groups in main

Content identity is (region + piece multiset). Current duplicate groups:
    [0,4]   [2,5]   [9,11]   [15,17]
Two levels with the same region and the same pieces are the same puzzle the
player meets twice, even if their names/tiers differ. All 4 must be resolved.

## Required approach

Make `pentomino/gen_levels.py` the SINGLE SOURCE OF TRUTH for BOTH files:

1. Fix the `N` shape in the generator's shape table (and in the other 4 files).
2. Extend the generator so it writes BOTH:
     - pentomino/levels.json      (audit form)
     - pentomino/levels-data.js   (runtime compact form)
   with byte-consistent content: the same level, in the same index order, in
   the two encodings. Add a self-check at the end of the generator that asserts
   the two encodings agree level-for-level, and that every level is solvable.
3. Regenerate the full 30-level catalog so that:
     - every level is solvable under the CORRECTED shape table (exact cover of
       the region by the listed pieces, using the engine's own orientation
       rules);
     - no two levels share (region + piece multiset) - i.e. zero duplicate
       groups, including the 4 currently-duplicate pairs;
     - the difficulty/tier spread is preserved (the game has Beginner/... tiers
       and a growing piece count; keep the existing shape of the progression -
       do not flatten it, and keep the level COUNT at 30);
     - every stored solution is a genuine valid cover for its level.
4. Keep the generator deterministic (it already uses seed 42) and keep its
   existing CLI behaviour working.

## Verification you must run and report (real output, not claims)

From /tmp/gz-codex-r340-pentomino :

  python3 pentomino/gen_levels.py            # must regenerate cleanly, no error
  node pentomino/verify_engine.js            # must PASS
  node pentomino/verify_independent.js       # must PASS
  python3 pentomino/verify_python.py         # must PASS
  (cd pentomino && node qa_checklist.js)     # must PASS (38/38)

Then prove the fixes independently with the auditor's own tools (they exist in
the repo; copy nothing, just run them):
  node .audit/r340-pentomino-shapes.js .     # must show NO "COLLISION" line,
                                             # and N with 8 orientations
  node .audit/r340-pentomino-audit.js .      # must show 0 UNSOLVABLE in BOTH
                                             # files and 0 duplicate groups
                                             # and NO "DIVERGENT" verdict
  node .audit/r338-d21-dup-levels.js pentomino  # must report no duplicate pair
                                             # for pentomino

If any of these tools do not exist in this worktree, write your own equivalent
check using the engine's OWN orientation rules (copy the shape table and the
rotation function from pentomino/index.html - do not invent your own shapes,
that is the bug being fixed).

## Constraints

- Use the ENGINE's orientation rules exactly as implemented in
  pentomino/index.html (allOrientationsLocal). Do not re-implement polyomino
  geometry from scratch; read it out of the engine.
- Do not change the game's rules, the number of levels, the tier names, or any
  gameplay code beyond the shape table entries.
- Do not "fix" a duplicate by renaming a level or by changing its tier label.
- Do not leave the two data files out of sync, even by one index.
- Keep the compact runtime format's existing field meaning
  (n = level number, t = tier, c = cols, r = rows, o = outline 0/1 flattened
  row-major, p = piece indices, s = solution grid flattened row-major).
  The runtime engine reads these fields - read pentomino/index.html to confirm
  the exact meaning before you write them.

## Report back

Return: files changed, the new shape table for N, the regenerated level count
and tier spread, the exact verification commands you ran WITH their real
output, and any remaining risk. Do not commit.
