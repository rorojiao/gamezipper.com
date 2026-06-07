# Hitori — Competitive Benchmark

## Game Overview
Hitori is a Japanese logic puzzle (Japanese: ひとりにしてやる, "leave me alone"). Played on an NxN grid filled with numbers. Goal: shade cells so no row/column contains duplicate numbers, shaded cells are not orthogonally adjacent, and all unshaded cells remain connected.

## Top Competitors

### 1. The Puzzle Labs Hitori
- **Platform**: Web (thepuzzlelabs.com)
- **Grid Sizes**: 5x5, 6x6, 7x7, 8x8, 9x9
- **Levels**: 1500+ puzzles per grid size (6000+ total)
- **Features**: Timer, hint system, undo, error highlighting, auto-check
- **Monetization**: Ads + premium subscription
- **Strengths**: Massive puzzle count, clean UI, difficulty tiers
- **Weaknesses**: Simple visuals, no animations

### 2. Hitori by Nikoli (Official)
- **Platform**: Mobile App (iOS/Android)
- **Grid Sizes**: 5x5 to 9x9
- **Levels**: 500+ puzzles
- **Features**: Daily challenge, hint, undo, pencil marks for elimination
- **Monetization**: Paid app
- **Strengths**: Authentic Nikoli quality, daily puzzles
- **Weaknesses**: No free web version

### 3. BrainBashers Hitori
- **Platform**: Web (brainbashers.com)
- **Grid Sizes**: 5x5 to 10x10
- **Levels**: Random generation
- **Features**: Timer, check solution, new puzzle button
- **Monetization**: Free with ads
- **Strengths**: Random generation (infinite play)
- **Weaknesses**: Minimal UI, no progress save, no difficulty tiers

### 4. Simon Tatham's Portable Puzzle Collection — Hitori
- **Platform**: Web + Desktop (cross-platform)
- **Grid Sizes**: 3x3 to 10x10, configurable
- **Levels**: Random generation
- **Features**: Undo/redo, hint, auto-solve, configurable difficulty
- **Monetization**: Free/open source
- **Strengths**: Clean implementation, cross-platform, solver
- **Weaknesses**: Basic UI, no mobile optimization

## Key Systems to Implement

### Core Mechanics
1. **Grid sizes**: 5x5 (Easy), 6x6 (Medium), 7x7 (Hard), 8x8 (Expert)
2. **Cell states**: Empty → Shaded/Unshaded (toggle on click)
3. **Rules enforcement**: 
   - No duplicate numbers in any row/column (among unshaded cells)
   - No two shaded cells share an edge
   - All unshaded cells must be connected
4. **Immediate feedback**: Highlight conflicts (duplicate + adjacent shade)

### Scoring System
- **Time-based**: Faster completion = higher score
- **Star ratings**: 1-3 stars based on time thresholds
- **Penalty**: Incorrect shading actions add time penalty

### Power-ups
- **Hint**: Auto-solve one cell (3 per puzzle)
- **Undo**: Undo last action (unlimited)
- **Reset**: Clear all shading and restart
- **Check**: Verify current state is valid (highlights errors)

### Progression System
- 30 hand-crafted levels across 4 tiers
- Tier 1 (L1-8): 5x5 grids, gentle intros
- Tier 2 (L9-16): 6x6 grids, moderate difficulty
- Tier 3 (L17-24): 7x7 grids, harder logic chains
- Tier 4 (L25-30): 8x8 grids, expert-level deduction

### Daily Challenge
- Seeded random generation
- Date-based seed for global consistency
- Track streak, best time

### UI/UX
- Dark theme with neon accents (GameZipper style)
- Smooth cell toggle animations
- Conflict highlighting (red glow for duplicates, orange for adjacent shades)
- Connected-cell visual verification (subtle background color for connected group)
- Level select grid with lock/star icons
- Tutorial overlay for first-time players

### SEO Keywords
- "hitori puzzle online", "play hitori free", "hitori logic puzzle", "hitori solver"
- "japanese number puzzle hitori", "hitori daily puzzle"

## Difficulty Curve Design
- L1-3: 5x5, solution has 3-4 shaded cells, obvious duplicates
- L4-8: 5x5, solution has 5-7 shaded cells, requires 2-3 step deduction
- L9-12: 6x6, solution has 6-8 shaded cells, requires chain elimination
- L13-16: 6x6, solution has 8-10 shaded cells, requires corner analysis
- L17-20: 7x7, solution has 9-12 shaded cells, requires connectedness reasoning
- L21-24: 7x7, solution has 11-14 shaded cells, complex deduction chains
- L25-28: 8x8, solution has 13-17 shaded cells, expert-level
- L29-30: 8x8, solution has 15-20 shaded cells, master-level

## Art Direction
- Clean minimalist grid with soft glow effects
- Shaded cells: dark with subtle texture
- Unshaded cells: slightly lighter than background
- Numbers: crisp, high-contrast
- Color palette: Dark navy/slate base, cyan/teal accents, warm orange for conflicts
