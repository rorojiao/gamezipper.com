# Kakuro Competitive Benchmark

## Game Overview
**Kakuro** (aka Cross Sums) is a number puzzle where players fill a grid with digits 1-9. Each row/column run has a clue number (the sum of digits in that run). Rules:
- Only digits 1-9
- No digit repeats within a run (horizontal or vertical group of white cells)
- Black cells contain clues (diagonal: top-right = horizontal sum, bottom-left = vertical sum)

## Competitors Analyzed

### 1. Kakuro.com (Web)
- Grid sizes: 7x7, 8x8, 9x9, 10x10, 12x12
- Features: Hints, undo, pencil marks (notes), timer, best times
- Difficulty: Easy/Medium/Hard
- Monetization: Banner ads
- UX: Click cell → number pad appears

### 2. Simon Tatham's Portable Puzzle Collection - Kakuro
- Open source, procedural generation
- Grid sizes: 6x6 to 10x10
- Features: Undo, redo, hints (solve step), pencil marks
- No scoring/stars — pure puzzle
- Clean minimal UI

### 3. BrainBashers Kakuro
- Daily puzzles, archive
- Grid: 9x9 standard
- Features: Timer, hints, auto-check errors, pencil marks
- Difficulty levels: Easy, Medium, Hard, Expert

### 4. Conceptis Kakuro (Mobile App)
- 100+ puzzles per difficulty
- Grid: 7x7 to 14x21
- Features: Hints, undo, pencil marks, auto-check, timer, statistics
- Star rating per puzzle
- Premium: Extra puzzles, no ads

## Key Systems to Implement

| System | Priority | Details |
|--------|----------|---------|
| Grid rendering | Critical | Black cells with diagonal clues, white input cells |
| Clue display | Critical | Diagonal line in black cells, sum in top-right/bottom-left |
| Input system | Critical | Click cell + number pad, or keyboard 1-9 |
| Validation | Critical | Check no repeats in run, sums match clues |
| Notes/pencil marks | High | Toggle note mode, show small numbers in cells |
| Undo | High | Stack-based undo for all actions |
| Hints | High | Reveal correct number for selected cell |
| Timer | Medium | Per-puzzle timer, best time per difficulty |
| Progress save | Medium | localStorage: completed puzzles, current progress |
| Level select | Medium | Grid by difficulty/size, lock system |
| Star rating | Medium | Based on time/hints used |
| Tutorial | High | First-time player guide |
| Error highlighting | Medium | Red highlight on invalid entries |
| Daily puzzle | Low | Seed-based daily generation |

## Difficulty Progression

| Difficulty | Grid Size | Runs | Typical Solve Time |
|-----------|-----------|------|-------------------|
| Beginner | 7x7 | Short runs (2-3 cells) | 2-5 min |
| Easy | 8x8 | Mix of short/medium runs | 5-10 min |
| Medium | 9x9 | Longer runs, more constraints | 10-20 min |
| Hard | 10x10 | Complex runs, less given info | 20-40 min |
| Expert | 11x11+ | Very long runs, minimal clues | 30-60 min |

## Target for GameZipper

- **Grid sizes**: 7x7 to 10x10 (4 difficulty tiers)
- **Level count**: 30 levels (6 per tier x 5 tiers, or 5 tiers x 6 levels)
- **Core features**: Notes, undo, hints, timer, star rating, error highlight
- **Unique selling points**: Daily puzzle, clean dark theme, responsive mobile-first
- **Generation**: Procedural (seeded PRNG) — no hand-crafted levels needed
