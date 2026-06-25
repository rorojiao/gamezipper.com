# Matchstick Puzzle — Competitive Benchmark

## Selected Game: Matchstick Puzzle (Move/Remove Sticks)

**Slug:** matchstick-puzzle  
**Tier:** 1  
**Rank:** Round 37 Top Candidate (23/25 score)

---

## Market Position

### Downloads & Popularity
- **Mobile downloads:** 10M+ (combined across "Matchstick Puzzles", "Matches Puzzle")
- **Genre:** Classic brain-teaser puzzle
- **Legacy:** 50+ years in puzzle books and brain games
- **Playtime:** Long engagement via "one more level" loop

### Core Mechanics
1. **Matchstick manipulation:** Drag sticks to move them OR tap to remove them
2. **Equation solving:** Fix incorrect math equations by moving 1-2 sticks
3. **Shape transformation:** Convert shapes (e.g., turn a house into a fish) by rearranging sticks
4. **Constraint:** Most puzzles allow moving/removing 1-2 sticks only (not arbitrary)

### Monetization Patterns
- **Interstitial ads:** Between levels (typical frequency: every 3-5 levels)
- **Hint system:** Watch ad to reveal solution (stick movement)
- **Skip level:** Watch ad to skip (rare but exists)
- **Banner ads:** On level-select/menu screens

---

## Feature Set (Based on Top Competitors)

### Core Gameplay
- **Two puzzle types:**
  - **Equation puzzles:** Fix math equations (e.g., `6 + 4 = 4` → move stick to make `6 + 4 = 10` or `5 + 4 = 9`)
  - **Shape puzzles:** Transform shapes (e.g., turn 4 squares into 3 squares by moving 2 sticks)
- **Input:** Drag sticks (move) or double-tap (remove)
- **Move count limit:** Each puzzle specifies allowed moves (usually 1-2)
- **Win condition:** Equation correct OR shape matches target silhouette

### UI/UX
- **Title screen:** Game title, "Play" button
- **Level select:** Grid of level buttons, locked until previous completed
- **In-game HUD:**
  - Current level number
  - Moves used / Moves allowed
  - Undo button (rewind last move)
  - Hint button (watch ad or free hints)
  - Menu button (back to level select)
- **Feedback:**
  - Correct: Sticks turn green, particles, "Correct!" text
  - Wrong: Sticks flash red, shake animation
  - Win: Star rating (1-3 based on moves used), level-complete modal

### Difficulty Progression
- **Easy:** 1 move, simple equations (e.g., `6 + 4 = 4` → `5 + 4 = 9`)
- **Medium:** 2 moves, slightly complex equations (e.g., `9 + 2 = 5` → `3 + 2 = 5` or `8 + 2 = 10`)
- **Hard:** Shape transformations, multi-step equations requiring creative thinking

### Level Count Target
- **30 levels** (standard for GZ puzzle games)
- **10 levels per difficulty tier** (Easy/Medium/Hard × 10)

---

## Competitive Gap (GameZipper Opportunity)

### Missing Features in Browser Clones
1. **No drag-drop stick UI:** Most browser versions use click-to-select + click-to-place (clunky)
2. **Poor visual feedback:** No particle effects or smooth stick animations
3. **Limited puzzle variety:** Often equation-only (no shape transformations)
4. **No undo system:** Players can't experiment freely

### GZ Differentiation
- **Canvas-rendered sticks:** Smooth drag-drop, rotation animations
- **Dual puzzle types:** Equations + shapes (double content)
- **Undo + hints:** Low-friction experimentation
- **Responsive design:** Mobile-first touch, desktop mouse support
- **Performance:** Single-file HTML, no external assets

---

## Technical Constraints & Opportunities

### Rendering
- **Canvas 2D API:** Draw sticks as rounded rectangles with glow effects
- **Stick states:** Normal (brown/wood), dragging (highlighted), placed (snap-to-grid), incorrect (red flash)
- **Grid system:** Virtual 5×5 or 6×6 grid for stick endpoints (easier alignment)

### Data Structure
- **Level representation:**
  ```javascript
  {
    type: "equation" | "shape",
    initialSticks: [{x1,y1,x2,y2}, ...],  // Grid coordinates
    target: "equation string" | silhouette shape,
    allowedMoves: 1 | 2,
    hint: "Move the vertical stick..."
  }
  ```
- **Solution validation:**
  - Equation: Parse string → evaluate math → check equality
  - Shape: Compare stick positions to target pattern (exact match)

### Audio
- **Sound effects:**
  - Stick pickup: `click` (short tap)
  - Stick drop: `snap` (wood on wood)
  - Correct: `ding` (success)
  - Wrong: `buzz` (error)
  - Win: `fanfare` (short melody)
- **Music:** Ambient chord loop (same as other puzzle games)

---

## Monetization Integration (GZ Standard)
- **Interstitial ads:** Every 3 levels (using Monetag zones 110122)
- **Hint ads:** 110122 before showing hint
- **Banner ads:** 110120 on title screen (top), 110121 on level-select (native style)

---

## QA Checklist (Game-Specific)
- [ ] Equation validation correctly evaluates arithmetic (order of operations)
- [ ] Shape validation accepts stick rotations and flips (symmetric solutions)
- [ ] Drag-drop constraints: Sticks snap to grid, can't place off-grid
- [ ] Move counter: Decrements on valid move, prevents exceeding allowed moves
- [ ] Undo system: Reverts stick to previous position, restores move counter
- [ ] Hint system: Animates the solution move-by-move
- [ ] Win condition: Only triggers when equation correct AND moves ≤ allowed

---

## Development Timeline Estimate
- **Phase 3 (Game dev):** ~20 min (30 levels, dual puzzle types, Canvas drag-drop)
- **Phase 4 (Art):** ~5 min (RunningHub icon + procedural stick textures)
- **Phase 5 (Music):** ~5 min (Web Audio BGM + SFX)
- **Phase 6 (Level verification):** ~10 min (Parse levels, validate solutions)
- **Phase 7 (QA):** ~10 min (40-point checklist)
- **Phase 8 (Register):** ~5 min (games-data.js + sitemap updates)
- **Phase 9 (Report):** ~5 min

**Total:** ~60 min