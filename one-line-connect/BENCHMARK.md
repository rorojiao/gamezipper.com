# One Line Connect — Competitive Benchmark

## Game Overview
**Slug:** one-line-connect
**Genre:** Puzzle (One-Line Drawing / Connect Dots)
**Core Mechanic:** Connect all dots on a grid with a single continuous line without lifting your finger. The line cannot cross itself.

## Competitor Analysis

### 1. One Line: Drawing Puzzle Game (Kidding Box Studio)
- **Downloads:** 10M+ | **Rating:** 4.7 (276K reviews)
- **Mechanic:** Draw shapes with one continuous line, connecting all dots
- **Levels:** Hundreds, ranging from beginner to expert
- **Scoring:** Minimal — focus on completion
- **Monetization:** Free + ads (heavy ad complaints)
- **Art Style:** Abstract casual, clean dots on grid

### 2. 1Line: Connect Dots Puzzle (nixGames)
- **Downloads:** 50K+ | **Rating:** 4.7 (1.31K reviews)
- **Mechanic:** Connect all dots with one line, can't revisit same line
- **Levels:** 200 levels
- **Special:** Hints, custom dot skins, relaxing BGM
- **Art Style:** Abstract minimal

### 3. Draw 1Line Puzzle Game (Getsmart LLC)
- **Downloads:** 1M+ | **Rating:** 4.6 (4.26K reviews)
- **Mechanic:** Complete shapes with single continuous line
- **Special:** Brain training focus, cognitive development angle
- **Art Style:** Casual abstract

### 4. One Line Draw - Connect Dots (NAGameStudio)
- **Downloads:** 100K+ | **Rating:** 4.5 (4.14K reviews)
- **Mechanic:** Connect all dots with single touch
- **Levels:** Hundreds of puzzle packs + daily challenges
- **Special:** Hints, daily challenges, difficulty claim: "Only 2.27% complete hardest"
- **Art Style:** Abstract dot-connecting

## Systems to Implement

| System | Requirement |
|--------|------------|
| **Core Mechanic** | Connect all dots with one continuous line, no crossing |
| **Grid System** | Various grid sizes (3x3 to 7x7), dot patterns |
| **Level Count** | Minimum 50 levels, 5 tiers (10 levels each) |
| **Difficulty Curve** | T1: simple 3x3 → T5: complex 6x6+ with traps |
| **Hint System** | Show next few moves (limited hints, regenerate over time) |
| **Undo** | Undo last N moves |
| **3-Star Rating** | Based on completion (complete = 3 stars, since puzzle is binary) or time-based |
| **Progress Save** | localStorage with version field |
| **Tutorial** | First 2-3 levels serve as tutorial with overlay hints |
| **BGM + SFX** | Web Audio procedural ambient + interaction sounds |
| **Visual Feedback** | Line drawing animation, dot highlight, completion celebration |
| **Particle Effects** | Celebration particles on level complete |

## Game Design Specifications

### Grid & Dot Patterns
- Dots placed on grid intersections
- Player draws a path connecting ALL dots
- Path cannot cross itself (no revisiting edges)
- When all dots are connected → level complete
- Some levels have forced starting points

### Level Tiers
| Tier | Grid Size | Complexity | Special Elements |
|------|-----------|------------|-----------------|
| 1 | 3x3, 3x4 | Simple | Tutorial hints |
| 2 | 4x4 | Medium | Multiple valid solutions |
| 3 | 4x5, 5x5 | Hard | Forced start points |
| 4 | 5x5, 5x6 | Expert | Dead ends (traps) |
| 5 | 6x6, 6x7 | Master | Complex patterns, minimal hints |

### Scoring
- Complete puzzle = base score (100 × level_number)
- No time pressure (relaxing puzzle)
- Stars: Complete = 3 stars (all puzzles solvable by design)
- Track total stars, completed levels, best streak

### Art Direction
- Dark gradient background (GameZipper style)
- Neon-glow dots (cyan/magenta/green palette)
- Smooth line drawing with glow effect
- Particle burst on completion
- Minimal, clean UI

## Technical Approach
- Single-file HTML5 Canvas
- Seeded PRNG for level generation (deterministic)
- Euler path algorithm for level validation (ensure solvable)
- Pointer events for touch/mouse
- Web Audio for BGM + SFX
- Responsive design (mobile-first)
