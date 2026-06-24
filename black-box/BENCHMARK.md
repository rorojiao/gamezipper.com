# Black Box — Competitor Benchmark

## Game
**Black Box** (slug: `black-box`) — ray/atom deduction puzzle. Fire rays into a
grid to deduce the locations of hidden "atoms" from hit/reflect/deflect outcomes.

## Origin & Prestige
- Created by **Eric Solomon**; published by Waddingtons (mid-1970s) & Parker
  Brothers (late 1970s). Board game + pen-and-paper + many computer versions.
- Inspired by **Godfrey Hounsfield's CAT scanner** (1979 Nobel Prize in Medicine).
- Listed in *Family Games: The 100 Best* (Green Ronin, 2010) & Games Magazine #8.
- The canonical computer reference is **Simon Tatham's Portable Puzzle Collection**
  (`blackbox`), whose ray-tracing algorithm this game replicates **exactly**
  (verified by reading the authoritative `blackbox.c` source).

## Canonical Rules (Tatham-faithful, source-verified)
Played on an N×N grid with k hidden atoms. There are **4N entry ports** around the
perimeter. Firing a ray from a port yields one of three outcomes:

1. **HIT** — the ray travels straight to an atom directly in its forward path and
   is absorbed. (Also an *instant hit*: the very first interior cell in the firing
   direction holds an atom.)
2. **REFLECTION** — the ray returns to its entry port. Two causes:
   - *Instant reflection*: an atom sits in one of the two forward-diagonal cells
     relative to the entry (i.e. an atom at the edge directly beside the entry).
   - *Path reflection*: after deflections the ray exits back through its entry.
3. **DETOUR** — the ray exits through a *different* port. Its entry & exit ports
   are paired (interchangeable). A clean miss (no atoms touched) is a detour too.

### Deflection geometry (exact, from blackbox.c `isball`/`fire_laser_internal`)
At each cell, before stepping, inspect the three forward cells: straight-ahead
(FORWARD), forward-left diagonal (LEFT = dir−1), forward-right diagonal
(RIGHT = dir+1). Directions numbered clockwise: 0=up,1=right,2=down,3=left.
- Atom FORWARD → **HIT** (absorbed).
- Atom LEFT only → rotate **clockwise** (+1); re-evaluate (do not step).
- Atom RIGHT only → rotate **anti-clockwise** (−1 = +3); re-evaluate.
- (LEFT-then-RIGHT priority; both present handled by the re-evaluate loop — this
  is the Tatham canonical behavior for the "two deflections" case.)
- Otherwise step forward one cell.
- If the ray steps onto a perimeter (range) cell: exit = that port; REFLECT if it
  equals the entry port, else DETOUR to that port.

## Reference competitors
| Source | Grid | Atoms | Notable systems |
|--------|------|-------|-----------------|
| Tatham `blackbox` | 5–15 configurable | user-set | instant hit/reflect priority, exit pairing, guess+score, penalty |
| Wikipedia (Solomon) | 8×8 (also 10/12) | 4–5 | 32 ports, scoring (hit/reflect=1pt, detour=2pt, wrong atom=5pt) |
| Various web impls | 8×8 | 4 | port labels, mark atoms, reveal, score |

## Systems this game must match
- **Port grid** with all 4N entries clickable; outcomes shown as HIT (●), REFLECT
  (◆), or matched DETOUR numbers (1↔1, 2↔2 …).
- **Atom placement**: click interior cells to mark an atom; toggle.
- **Atom count** given as a clue (k atoms hidden).
- **Scoring**: each fired port costs pts (hit/reflect=1, detour=2); each wrong
  atom guess = penalty. Lower = better. Star rating by score threshold.
- **Fire/clear** a port by clicking it; reveal path animation optional.
- **Check** button: validates current atom guesses against clues (consistent?).
- **Reveal/verify** at level end; **hint**; **reset**; **undo**.
- **Progress save** (localStorage, versioned), **level select + lock + stars**.
- **Tutorial**, **mute**, **procedural BGM + SFX** (Web Audio).
- **All English UI**; dark neon theme; mobile-responsive; 60fps Canvas.

## Difficulty curve (27 levels, 6 tiers)
| Tier | Grid | Atoms | Combos (uniqueness brute-force) |
|------|------|-------|---------------------------------|
| Beginner ×4 | 6×6 | 3 | C(36,3)=7,140 |
| Easy ×4 | 7×7 | 3 | C(49,3)=18,424 |
| Medium ×5 | 8×8 | 4 | C(64,4)=635,376 |
| Hard ×4 | 8×8 | 5 | C(64,5)=7,624,512 |
| Expert ×5 | 9×9 | 4 | C(81,4)=1,581,580 |
| Master ×5 | 9×9 | 5 | C(81,5)=25,621,596 |

Every level is **uniquely solvable** (verified: exactly one k-atom placement
reproduces all 4N clue outcomes) so each puzzle is deducible by pure logic.
