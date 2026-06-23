# Slalom Game — Competitive Benchmark

## Game Overview
- **Name**: Slalom
- **Core Mechanic**: Nikoli loop puzzle where you draw a single continuous loop that passes through all checkpoints in the correct direction (based on arrow flags)
- **Type**: Logic puzzle / pathfinding
- **Origin**: Nikoli (Japanese puzzle publisher)

## Competitor Analysis

### 1. Simon Tatham's Slalom
- **URL**: https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/slalom.html
- **Levels**: 15 preset levels + random generator
- **Features**:
  - Undo/Redo (unlimited steps)
  - Auto-complete when solution is unique
  - Timer
  - Move counter
  - Touch-friendly (pointer events)
  - Dark/light theme toggle
  - Mobile responsive
- **Scoring**: Time-based (faster = better)
- **Tutorial**: Built-in help text
- **Assets**: Minimalist geometric style (no external graphics)
- **Audio**: No audio
- **Key Differentiator**: Pure logic puzzle, no fancy graphics

### 2. Janko.at Slalom
- **URL**: https://www.janko.at/Raetsel/Slalom/index.htm
- **Levels**: 20+ handcrafted levels
- **Features**:
  - Difficulty levels (Easy/Medium/Hard)
  - Checkpoint validation (turns arrows red when invalid)
  - Progress tracking
  - Solution hints (available per level)
- **Scoring**: Puzzle completion (no time limit)
- **Tutorial**: Step-by-step visual guide
- **Assets**: Clean UI, vector-style graphics
- **Audio**: Click sounds
- **Key Differentiator**: Educational focus with validation feedback

### 3. Conceptis Slalom
- **URL**: https://www.conceptispuzzles.com/index.aspx?uri=puzzle/slalom
- **Levels**: Weekly puzzles (5 difficulty tiers)
- **Features**:
  - Hints system (progressive reveal)
  - Mistake counter
  - Auto-save progress
  - Puzzle archive
  - Print-friendly export
- **Scoring**: Mistakes count (fewer mistakes = better)
- **Tutorial**: Interactive tutorial
- **Assets**: Professional printed-puzzle aesthetic
- **Audio**: None
- **Key Differentiator**: Premium print-to-digital conversion quality

## Core Mechanics (Common Across All Competitors)

1. **Grid Setup**: N×M grid with arrow checkpoints
2. **Goal**: Draw a single continuous loop through all checkpoints
3. **Constraint 1**: Loop must pass each checkpoint in arrow direction
4. **Constraint 2**: Loop cannot cross itself
5. **Constraint 3**: Each grid cell visited exactly once (except start/end)

## Feature Comparison Matrix

| Feature | Simon Tatham | Janko.at | Conceptis | Our Target |
|---------|--------------|----------|-----------|------------|
| Undo/Redo | ✅ | ✅ | ✅ | ✅ Required |
| Hints | ❌ | ✅ (3/level) | ✅ (progressive) | ✅ (3 per level) |
| Timer | ✅ | ❌ | ❌ | ✅ Required |
| Move Counter | ✅ | ❌ | ❌ | ✅ Required |
| Mistake Tracking | ❌ | ❌ | ✅ | ✅ Required |
| Progress Save | ✅ | ✅ | ✅ | ✅ (localStorage) |
| Tutorial | Text | Visual | Interactive | ✅ (5-step visual) |
| Difficulty Levels | ❌ | 3 tiers | 5 tiers | ✅ (5 tiers: Easy→Master) |
| Dark Theme | ✅ | ❌ | ❌ | ✅ (GameZipper dark style) |
| Audio | ❌ | Click | ❌ | ✅ (BGM + SFX) |
| Touch Support | ✅ | Partial | Partial | ✅ (Pointer events) |
| Animations | Minimal | None | None | ✅ (Particle feedback) |

## Scoring System Target

Based on competitor patterns, our scoring should be:
- **Base Score**: 1000 points per level
- **Time Bonus**: Up to 500 points (fastest = 500, degrades over time)
- **Mistake Penalty**: -50 per mistake
- **Hint Penalty**: -100 per hint used
- **3-Star Rating**: Based on total points (3 stars ≥1200, 2 stars ≥800, 1 star ≥500)

## Level Count & Difficulty Curve

- **Total Levels**: 30 levels minimum (Simon Tatham: 15, Janko.at: 20+, Conceptis: weekly)
- **Distribution by Tier**:
  - Tier 1 (Easy): 6 levels - 5×5 grid, 3-5 checkpoints
  - Tier 2 (Normal): 6 levels - 6×6 grid, 5-7 checkpoints
  - Tier 3 (Hard): 6 levels - 7×7 grid, 7-9 checkpoints
  - Tier 4 (Expert): 6 levels - 8×8 grid, 9-11 checkpoints
  - Tier 5 (Master): 6 levels - 9×9 grid, 11-13 checkpoints

## Art Style Reference

- **Competitors**: Minimalist geometric (Simon Tatham), vector-style (Janko.at)
- **Our Approach**: Dark gradient background + neon accent arrows (GameZipper dark theme)
- **Asset Requirements**:
  - Game icon (256×256, arrow motif)
  - Background (1920×1080, dark gradient with subtle path patterns)
  - Checkpoint arrow graphics (canvas-drawn with glow effects)

## Music Style Reference

- **Competitors**: None (Simon Tatham), minimal clicks (Janko.at)
- **Our Approach**: Ambient electronic BGM (mysterious, ethereal) + 6 interaction SFX

## Unique Selling Points vs Competitors

1. **Better Visuals**: Neon glow effects + particle feedback (competitors have none)
2. **Audio**: Full BGM + SFX (competitors lack or minimal)
3. **Mobile-First**: Touch-optimized UI (competitors are desktop-first)
4. **Scoring Depth**: Multi-factor scoring (time + mistakes + hints) vs simple metrics
5. **Progress System**: 3-star ratings + best scores per level (competitors lack stars)
6. **Accessibility**: Dark theme toggle (competitors light-only)

## Technical Requirements (from competitors)

- Grid rendering: Canvas (Simon Tatham) or SVG (Janko.at) → Canvas for performance
- Touch handling: Pointer events (Simon Tatham) for desktop+mobile
- Loop validation: BFS/DFS path checking
- Arrow rendering: Canvas paths with rotation transforms
- Responsive: CSS grid/flexbox layout

## Notes

- All competitors validate solution uniqueness before presenting
- All have "undo" as the primary power-up
- None use procedural generation - all use handcrafted levels
- Slalom is considered a "medium difficulty" Nikoli puzzle (between Hashiwokakero and Nurikabe)