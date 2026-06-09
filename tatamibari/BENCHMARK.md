# Tatamibari — Competitive Benchmark

> Date: 2026-06-10
> Researcher: dev-gamezipper
> Target: `tatamibari` slug on GameZipper

---

## 1. Game Identity

| Field | Value |
|-------|-------|
| **Name** | Tatamibari (タタミバリ) |
| **Origin** | Nikoli (Japan), pre-2009 |
| **Type** | Grid-partitioning logic puzzle |
| **NP-complete** | Yes (Adler et al., 2020 — arXiv:2003.08331) |
| **Family** | Nikoli puzzle family (Akari, Slitherlink, Nurikabe, Fillomino…) |

---

## 2. Authoritative Rules (from Wikipedia + Nikoli archives)

A Tatamibari puzzle is played on a rectangular grid containing three types of symbols: **+**, **-**, and **|**.

The solver must partition the grid into rectangular (or square) regions according to these rules:

1. **One symbol per region** — Every region must contain exactly one symbol.
2. **+ → square** — A `+` symbol must lie in a square region (width = height).
3. **| → tall rectangle** — A `|` symbol must lie in a rectangle taller than wide (height > width).
4. **- → wide rectangle** — A `-` symbol must lie in a rectangle wider than tall (width > height).
5. **No four-corner meeting** — No four regions may share the same corner point (no 4-way junction).

**Additional constraints derived from competitive play:**
- Every cell must belong to exactly one region (complete partition).
- Regions must be axis-aligned rectangles (no L-shapes, diagonals).
- The solution is unique for well-constructed puzzles.

---

## 3. Grid Sizes & Difficulty Scaling

| Level Range | Grid Size | Symbols | Notes |
|-------------|-----------|---------|-------|
| Easy (1-5) | 4×4 to 5×5 | 4-6 | Simple symbol placement, obvious partitions |
| Medium (6-15) | 5×5 to 6×8 | 6-10 | Requires deduction chains |
| Hard (16-25) | 7×7 to 8×10 | 10-16 | Multiple constraint interactions |
| Expert (26-30) | 9×9 to 10×10 | 16-25 | Full NP-complete challenge |

---

## 4. Competitive Landscape

### Existing Implementations

| Competitor | Platform | Features | Gaps |
|------------|----------|----------|------|
| **Nikoli.com** (subscription) | Web | Curated puzzles, daily, hints | Paid subscription, no mobile optimization |
| **Puzzle Kingdom** | Web | Some Tatamibari variants | Small puzzle set, no tutorial |
| **Puzzle collection apps** (various) | Mobile | Bundled Nikoli puzzles | Tatamibari often omitted, no standalone |
| **Kurodoko / Nikoli apps** | Mobile | Similar shade-logic puzzles | Different mechanic entirely |

### SEO Gap

- **"tatamibari puzzle"** — zero dedicated browser-game results on Google
- **"tatamibari online"** — no free-play browser implementation
- **"tatamibari solver"** — academic papers only, no playable game
- **Nikoli puzzle browser** — generic, not tatamibari-specific
- This represents a **complete SEO white-space** for a free browser tatamibari game.

### Why No Browser Clone Exists

1. **NP-complete** — generating solvable puzzles with unique solutions requires backtracking solvers
2. **Nikoli niche** — less mainstream than Sudoku/Kakuro, fewer clones attempted
3. **Grid-partition UX** — drawing rectangles is harder to implement than click-to-toggle (cf. Kuromasu)
4. **No viral app** — unlike Flow Free (Numberlink) or 2048, no breakout app created clone demand

---

## 5. GameZipper Implementation Strategy

### Core Mechanics
- **Player interaction**: Click a cell → drag to define a rectangular region → release to place
- **Region drawing**: Click-and-drag on grid to outline a rectangle; snap to grid edges
- **Symbol display**: +, -, | symbols visible on grid; each must be enclosed in correct-shaped region
- **Validation**: Real-time — regions turn green when valid, red when violating rules
- **Four-corner check**: Highlight any 4-way junction in red

### Features
| Feature | Implementation |
|---------|----------------|
| 30 hand-crafted levels | 4×4 → 10×10 grids, 5 difficulty tiers |
| Daily puzzle | Date-seeded generator for infinite daily content |
| Tutorial | 3-step interactive tutorial for first visit |
| Undo/Redo | Full undo stack for region placement |
| Hint system | Reveals one correct region boundary |
| Timer + scoring | Time-based with 3-star rating |
| Progress save | localStorage with level unlock tracking |
| Dark neon theme | Consistent with GZ design system |

### Monetization
- **Monetag MultiTag**: banner (110120), native (110121), interstitial (110122)
- Interstitial on level completion
- Banner below game area (never overlapping canvas)

---

## 6. Technical Approach

### Puzzle Generation
1. **Hand-crafted levels** (30 levels): Manually designed with verified unique solutions
2. **Solver**: Backtracking algorithm validates uniqueness
3. **Daily generator**: Random grid + random symbol placement → solver verification

### Canvas Rendering
- Grid lines, symbols, regions with color fills
- Smooth drag feedback during rectangle drawing
- Completion animation with particle effects

### Input
- **Desktop**: Mouse click + drag to define rectangles
- **Mobile**: Touch start + drag + release
- Pointer Events API for unified handling

---

## 7. Key Differentiators vs Competitors

| Feature | Nikoli.com | Generic Apps | **GameZipper Tatamibari** |
|---------|-----------|--------------|--------------------------|
| Free to play | No (subscription) | Freemium | **Yes, fully free** |
| No download | Browser only | App download | **Browser, no install** |
| Mobile optimized | Partial | Yes | **Yes, touch-first** |
| Tutorial | No | Rarely | **Interactive 3-step** |
| Daily puzzle | Subscription | No | **Free daily seed** |
| Undo/Hint | No | Limited | **Full undo + hint system** |
| Dark theme | No | Rarely | **Neon dark theme** |
