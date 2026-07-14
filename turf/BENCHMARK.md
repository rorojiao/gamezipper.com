# Turf - Competitive Benchmark

## Turf Puzzle Rules

**Inventor:** John Bulten (USA)
**Sources:**
- cross-plus-a.com/Turf - Rules confirmed
- janko.at/Raetsel/Turf/Regeln.htm - Rules confirmed

### Core Rules

1. **Grid Setup:** A rectangular or square grid contains numbers in some cells.

2. **Goal:** Shade some cells to divide the grid into black and white regions.

3. **Region Size Rule:** Each orthogonally connected region (either black or white) must contain at least one number that indicates the **size** of that region.

4. **3x3 Neighborhood Rule:** If a region contains additional numbers beyond the size clue, each such number indicates how many of the 9 cells in its 3x3 neighborhood (including itself and diagonal neighbors) are **white**.

5. **If a region has multiple size clues:** All but one must be adjacency clues (3x3 count); at least one must be the true size clue. Players must deduce which is which.

6. **Connectivity Rule:** All white cells must form a single orthogonally connected area. All black cells must form a single orthogonally connected area.

### Constraint Summary

- Every region (black or white) has >= 1 clue
- At least one clue per region = region size
- Other clues in same region = white count in 3x3 neighborhood
- White cells are orthogonally connected
- Black cells are orthogonally connected
- No size limit on regions
- Grid sizes typically 5x5 to 10x10

## Competitive Analysis

### Cross-Plus-A.com
- Confirmed rules presence
- Good example puzzles with clear mechanics
- No interactive web implementation found

### Janko.at
- Confirmed German/English/Japanese rules
- 50+ puzzles available
- Good difficulty progression
- JavaScript interactive solver available (can study for logic)

### Uniqueness Value Proposition

**Why Turf stands out:**

1. **Dual-Clue System:** Combination of size clues + 3x3 neighborhood clues creates rich deduction paths
2. **Color Connectivity:** Both black and white must be connected - adds global constraint
3. **Multiple Clues per Region:** Ambiguity handling - players must distinguish size clues from adjacency clues
4. **Novel Invention:** Not a traditional Nikoli puzzle - brings fresh mechanic diversity

**Potential challenges:**
- Multiple clues per region requires clear UI indication (which clue is which type)
- 3x3 neighborhood counting may be confusing for beginners
- Need good tutorial/examples

## Development Strategy

### Level Generation Approach
**Solution-first generation:**

1. Generate two connected sets (black regions, white regions) with known sizes
2. Assign size clue = region size to one cell per region
3. Optionally add 3x3 neighborhood clues to other cells in large regions
4. Verify uniqueness via constraint solver
5. Filter for solvable difficulty tiers

**Constraint Solver for Uniqueness:**
- Region assignment (each cell = black or white)
- Region size constraints
- 3x3 neighborhood constraints
- Global connectivity (BFS for each color)
- MRV backtracking with node budget 200K

### Difficulty Tiers
- **Beginner (5x5):** 3-4 regions, minimal 3x3 clues
- **Easy (6x6):** 4-5 regions, some 3x3 clues
- **Medium (7x7):** 5-6 regions, multiple 3x3 clues per region
- **Hard (8x8):** 6-8 regions, dense clue coverage
- **Expert (10x10):** 8-10 regions, maximum clue density

### UI/UX Considerations
1. **Clue distinction:** Different visual style for size clues vs 3x3 clues
2. **Region coloring:** Light overlay showing current region detection
3. **Violation highlighting:** Red overlay for connectivity violations
4. **Hint system:** Reveal one cell's correct color
5. **3x3 highlight:** When hovering over a 3x3 clue, show the affected neighborhood

## Technical Implementation Notes

- Grid state: `state.grid[r][c] = 0/1` (0=white, 1=black)
- Clues: `state.clues = [{r, c, type: 'size'|'neighbor', val}]`
- Region detection: BFS flood fill
- Connectivity check: Single-component BFS per color
- 3x3 count: Iterate `dr in [-1,0,1], dc in [-1,0,1]` excluding self (when counting white)

## Reference Links
- cross-plus-a.com: http://www.cross-plus-a.com/puzzles.htm#Turf
- janko.at: https://www.janko.at/Raetsel/Turf/Regeln.htm