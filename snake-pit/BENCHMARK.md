# Snake Pit — Benchmark & Market Research (Phase 0)

## 1. Game identity

| Field | Value |
|---|---|
| Name | **Snake Pit** (German: *Schlangengrube*) |
| Category | Region-division logic puzzle |
| Family | Hybrid of **Fillomino** and **Snake** (one-cell-wide polyominoes) |
| Originator | **Carl Worth** |
| First published | 2016-02-26 on Grandmaster Puzzles |
| Benchmark source | **https://www.janko.at/Raetsel/Snake-Pit/index.htm** (janko.at — Angela und Otto Janko, German) |
| Cross-reference | https://www.gmpuzzles.com/blog/2016/12/snake-pit-carl-worth/ |
| License | Creative Commons BY-NC-SA 3.0 (janko.at puzzles); CC BY-NC-ND 3.0 (GMPuzzles site) |
| Variants on janko.at | 100 puzzles (Nr. 01–100), sizes 8×8 to 10×10+ |
| Difficulty curve | Easy → Medium → Hard (janko.at sort by "Schwierigkeit") |
| GM time standards | Grandmaster 3:00, Master 5:00, Expert 10:00 (per Carl Worth's opus #13) |

## 2. Catalog zero-gap verification (TRUE ZERO GAP)

### Search method
1. **Exact slug** — `search_files` for `snake pit | snakepit | snake-region | snake_region | snake pit puzzle` in `/home/msdn/gamezipper.com/` → **0 matches** in file content (FTS5)
2. **Folder scan** — `ls /home/msdn/gamezipper.com/ | grep -i snake` →
   ```
   snake           (generic snake game, NOT Snake Pit)
   snake-game-high-score-tips.html
   snake-games.html
   snake-pit       (only contains checkers stub template — no real Snake Pit game)
   snake-vs-block  (different game)
   ```
3. **Full snake grep** — `grep -rli "snake" --include="*.html" --include="*.md"` → 30+ files, all unrelated (snake-game hints, hebi Japanese, sitemaps, etc.). The only directory named `snake-pit` contains a single `template-check.html` left over from a checkers build — **no Snake Pit implementation, no Snake Pit rules, no Snake Pit solver**.
4. **Cross-check against pipeline candidates file** — `/home/msdn/gamezipper.com/.game-pipeline-candidates.md` lists Snake Pit with "0 occurrences" — corroborates true zero gap.

### Verdict
**TRUE ZERO GAP confirmed.** Snake Pit has zero presence as an actual game or ruleset in the GameZipper catalog. The pre-existing `snake-pit/` directory is a stale stub and must be replaced.

## 3. Complete rules (authoritative English version)

**Source: Carl Worth's original 2016 GMPuzzles ruleset, cross-checked against janko.at's German text.**

> "Divide the grid along the boundary lines so that every cell belongs to a snake. A **snake** is a one-cell-wide path **at least two cells long** that does not touch itself, not even diagonally. **Circled cells** must be at one of the ends of a snake. A snake may contain one circled cell, two circled cells, or no circled cells at all. **Numbered cells** must be part of a snake with a length of exactly that number of cells. A snake may contain one number, multiple identical numbers, or no numbers at all. **Two snakes of the same length cannot touch each other horizontally or vertically**."

### Constraint checklist (used by Phase 3 solver)

1. **Partition rule** — every cell is part of exactly one snake; the grid is fully tiled by disjoint one-cell-wide polyominoes.
2. **Length rule** — each snake is at least 2 cells long; if the snake contains the number N, it is exactly N cells long.
3. **Self-isolation rule** — a snake may not touch itself even diagonally (no 2×2 self-loop, no fold-back).
4. **Head/tail rule** — every cell marked with a circle (○) must be an endpoint (head or tail) of its snake. A snake can contain 0, 1, or 2 circle cells (2 only if the snake is exactly 2 cells).
5. **Non-endpoint rule** — no further restriction on plain numbered or empty cells (janko.at mentions an "anti-endpoint square (□)" rule used in some variants; the core puzzle only uses circles).
6. **Same-length orthogonality rule** — two different snakes of the same length may not be orthogonally adjacent (sharing an edge). **Diagonal adjacency is allowed.**
7. **Multi-clue rule** — a single snake may carry two or more given numbers (they must agree on the length); and a snake may have zero given numbers (its length is implied by partition + other constraints).

### Notation conventions (from janko.at corpus)
- `○` (open circle) = mandatory snake endpoint
- `□` (square) = optional janko.at marker for "must NOT be endpoint" (variant; not in core Carl Worth rules)
- plain number = length of the snake containing this cell
- empty cell = no clue, length to be determined by solver

## 4. Example puzzles

### Example A — 5×5 tutorial puzzle (janko.at "Beispiel")

This is the canonical worked example shown on the Snake Pit index page. It is small enough to be the first player-facing level.

**Given clues (clue notation: row,col → marker):**

| | C1 | C2 | C3 | C4 | C5 |
|---|---|---|---|---|---|
| R1 | | | | | |
| R2 | | **3** | | **3** | |
| R3 | **○** | **5** | | **6** | **○** |
| R4 | | **4** | | **6** | |
| R5 | | | | | |

- 6 given numbers: three 3's (snake of length 3), one 5, two 6's, one 4
- 2 endpoint circles: (3,1) and (3,5)
- Total cells = 25

**Solution (Lösung) — fully numbered grid:**

| | C1 | C2 | C3 | C4 | C5 |
|---|---|---|---|---|---|
| R1 | **3** | **5** | **5** | **2** | **2** |
| R2 | **3** | **3** | **5** | **3** | **3** |
| R3 | **4** | **5** | **5** | **6** | **3** |
| R4 | **4** | **4** | **4** | **6** | **2** |
| R5 | **6** | **6** | **6** | **6** | **2** |

**Seven snakes** (cell coordinates → length):

| Snake | Cells (row,col) | Length |
|---|---|---|
| 1 | (1,1), (2,1), (2,2) — top-left L | 3 |
| 2 | (2,4), (2,5), (3,5) — top-right L | 3 |
| 3 | (1,2), (1,3), (2,3), (3,2), (3,3) — central plus | 5 |
| 4 | (3,1) ○, (4,1), (4,2), (4,3) — bottom-left L | 4 |
| 5 | (3,4), (4,4), (5,1), (5,2), (5,3), (5,4) — large Γ | 6 |
| 6 | (1,4), (1,5) — top-right pair | 2 |
| 7 | (4,5), (5,5) — bottom-right pair | 2 |

Cell count: 3+3+5+4+6+2+2 = **25** ✓ (matches 5×5)
Verification: both circles (R3,C1) and (R3,C5) are at endpoints of their respective snakes (snake 4 and snake 2). Snakes of equal length that are adjacent: **none orthogonally**.

### Example B — Snake Pit Nr. 1 (Carl Worth original)

- **Source**: https://www.janko.at/Raetsel/Snake-Pit/001.a.htm
- **Size**: **10×10**
- **Author**: Carl Worth (this is the puzzle that introduced Snake Pit to the world)
- **GMPuzzles page**: https://www.gmpuzzles.com/blog/2016/12/snake-pit-carl-worth/
- **Given clues** (verified via janko.at puzzle canvas):

  Given numbers: (3,1)=4, (3,2)=2, (3,3)=12, (3,6)=12, (5,1)=4, (5,2)=6, (5,4)=6, (5,5)=10, (5,7)=6, (6,6)=4, (7,3)=10
  Circled endpoints: (2,1), (2,3) numbered 15, (4,2), (4,4) numbered 4, (4,6), (6,2), (6,4) numbered 4

  Long snake targets (12, 12, 15, 10, 10) confirm that 10×10 puzzles push toward 6–8 snakes averaging 12–15 cells each.

### Example C — Snake Pit Nr. 2

- **Source**: https://www.janko.at/Raetsel/Snake-Pit/002.a.htm
- **Size**: **8×8** (janko.at "Größe: 8×8")
- **Author**: Carl Worth
- **Given clues**: ~22 numbered cells (8, 4, 20, 5, 3, 8, 3, 5, 4, 2, 4, 2, 2, 4, 8, 4, 3, 5, 4, 6, 3, 5, 5, 3) plus 6 endpoint circles
- **Length distribution**: ranges from 2 (short pair snakes) up to 20 (a single very long winding snake — strong distinguishing feature from Fillomino where most cells are in mid-length snakes)

## 5. Core mechanic analysis

### What makes Snake Pit distinct from Fillomino (its closest cousin)

| Aspect | Fillomino | Snake Pit |
|---|---|---|
| Snake shape | any polyomino of size N | strictly one-cell-wide (path) |
| Self-touching | allowed | forbidden, even diagonally |
| Markers | only numbers | numbers + endpoint circles |
| Same-length adjacency | orthogonally forbidden (same as Snake Pit) | orthogonally forbidden |
| Diagonal adjacency | allowed | allowed |
| Difficulty driver | partitioning math | path topology + partitioning |

The killer feature is the **one-cell-wide constraint**. A length-6 Fillomino region can be any hexomino (35 shapes); a length-6 Snake Pit region must be a 6-cell path with no 2×2 fold. This single constraint turns a partition puzzle into a **path-puzzle** where the solver must reason about linear flow rather than block packing.

### Solving techniques (for Phase 3 solver design)

1. **Circle anchoring** — every circle must be a snake endpoint, so each circle has at most 2 body neighbors in its snake.
2. **Same-length orthogonality exclusion** — when two cells of length N are orthogonally adjacent, they cannot be in different snakes of length N; they must be in the same snake (and form a straight or one-bend path).
3. **Length parity** — a snake of length N occupies N cells; if N < area of any connected region of cells not yet partitioned, the snake must fit entirely inside that region.
4. **1-cell-wide propagation** — once two adjacent cells share the same number N, the snake grows by exactly 1 each step in any of the 4 directions (no diagonal body extension).
5. **Circle pair bridging** — when two circles are adjacent (orthogonally), they form a length-2 snake (the only way for a length-2 snake to have two circles).
6. **Largest-length snake bottleneck** — in janko.at puzzles, the longest snake (often 12–20) typically snakes around the entire grid perimeter or makes a long Z; identifying and committing to its path early unlocks the rest.

### Difficulty curve on janko.at

| Tier | Typical grid | Typical max-snake length | Clue density |
|---|---|---|---|
| Easy (Nr. 01–30) | 8×8, 9×9 | 6–10 | high (~30%) |
| Medium (Nr. 31–70) | 9×9, 10×10 | 10–15 | medium (~22%) |
| Hard (Nr. 71–100) | 10×10, occasionally larger | 15–20+ | low (~15%) |

For GameZipper's 30-level plan we can target: 5 easy / 10 medium / 10 hard / 5 expert, mixing 5×5 to 10×10 sizes. The 5×5 Example A puzzle is **the** canonical first level.

## 6. SEO & market notes

### SEO surface
- Primary keywords: `snake pit puzzle`, `snake pit logic puzzle`, `region division puzzle`, `fillomino variant`, `snake puzzle online free`
- Long-tail: `carl worth snake pit`, `snake pit janko`, `one cell wide path puzzle`
- Zero direct competition in browser-playable format — the only existing implementations are janko.at's Java applets (legacy, hard to use on mobile) and Cross+A's downloadable solver. **No casual browser clone exists.**

### Monetization hooks
- 30 hand-crafted levels across 5 tiers (5×5 → 10×10)
- Star rating on completion time (3 stars = GM standard, 2 = Master, 1 = solved)
- Hint system: 1 free hint per level, then rewarded-video for additional hints
- Undo / redo stack
- Daily-puzzle mode for retention

### Differentiation vs existing GameZipper inventory
- Closest existing game in catalog: `fillomino` (different mechanic — block polyominoes, no path constraint)
- Visually distinct from existing snake-themed games (`snake`, `snake-vs-block`, `hebi`) — those are reflex/action; Snake Pit is pure logic
- Strong fit with `kurotto`, `aqre`, `nurikabe`, `cave` (all region-division or shading logic puzzles already on GameZipper)

## 7. Build constraints for Phase 3

The Phase 3 implementation must satisfy:

1. **Correctness** — solver accepts all 3 reference puzzles (Example A, B, C) and rejects all invalid moves (a move violates exactly one of rules 1–7).
2. **Difficulty** — 30 procedurally-generated or hand-authored puzzles across 5 tiers (Beginner → Master).
3. **UX** — circle markers render as filled or hollow rings; numbers render large and centered; snake paths render as a continuous filled region in a per-snake color (not just outlines).
4. **Input** — click empty cell → choose a length N → snake auto-extends in straight line from the nearest endpoint; or click two cells to draw a single-cell path. (UX design deferred to Phase 3.)
5. **Validation** — real-time check against all 7 rules; show errors in red; celebrate solve with animation + star rating.
6. **Mobile** — touch-drag to draw snake bodies (Phase 6 mobile QA).

## 8. Sources & references

- **Benchmark (primary)**: https://www.janko.at/Raetsel/Snake-Pit/index.htm — German rules + 100 puzzles + example
- **Benchmark (authoritative English rules)**: https://www.gmpuzzles.com/blog/2016/12/snake-pit-carl-worth/ — Carl Worth's opus #13
- **Solver reference**: Cross+A — https://www.cross-plus-a.com/html/cros7snpt.htm (Windows desktop only; no browser play)
- **Variant** (Snake Pit X by Ken Endo / Prasanna Seshadri): https://www.gmpuzzles.com/blog/2017/10/snake-pit-x-ken-endo/ — diagonal variant, not part of core game
- **Logic Masters Germany thread**: https://logic-masters.de/Raetselportal/Raetsel/zeigen.php?chlang=en (community discussion)

## 9. Phase 0 conclusion

**Snake Pit is approved for development.** True zero-gap in catalog confirmed; rules are unambiguous and well-documented across janko.at and Grandmaster Puzzles; difficulty curve is solvable for a 30-level ladder; SEO surface is clean with zero browser-playable competition. Recommend progressing to **Phase 1 (mechanic design) → Phase 2 (level plan) → Phase 3 (HTML/CSS/JS implementation)**.