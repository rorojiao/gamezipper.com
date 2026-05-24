# Math 24 — Competitive Benchmark

## Overview
Math 24 (also known as "24 Game" or "Make 24") is a classic mathematical card game where players use 4 numbers and basic operations (+, -, ×, ÷) to make exactly 24. Invented by Robert Sun in 1988, it has been used in math education worldwide for decades.

## Top Competitors

### 1. 24 Game by Suntex International (Original)
- **Platform**: Physical cards, iOS/Android apps
- **Downloads**: 10M+ across platforms
- **Mechanics**: 
  - Single digit (1-9), double digit, fractions, variables, algebra
  - 96-card decks organized by difficulty
  - Three levels of difficulty (1 dot = easy, 2 dots = medium, 3 dots = hard)
  - Puzzle/solitaire mode + competitive mode
- **Scoring**: Points based on speed, streak bonuses
- **Monetization**: App sales ($2.99), classroom kits ($30+)

### 2. Math 24 Solver Apps (Various)
- **Platform**: Web, iOS, Android
- **Features**:
  - Auto-solver (brute force all possible combinations)
  - Step-by-step solution display
  - Practice mode with unlimited puzzles
  - Timer + scoring
- **Key difference**: Most are SOLVERS, not playable games

### 3. Coolmath Games "Make 24"
- **Platform**: Web browser
- **Features**:
  - Simple 4-number puzzle
  - Drag-and-drop number placement
  - Operation buttons between numbers
  - Score tracking
- **Weakness**: Minimal UI, no difficulty progression, no tutorial

### 4. Math Playground "Make 24"
- **Platform**: Web browser (educational)
- **Features**:
  - Educational focus
  - Hints system
  - Difficulty levels
- **Weakness**: School-oriented, not game-like enough

## Systems to Implement

### Core Mechanics
- 4 random cards (1-13, representing standard deck values)
- Player arranges operations (+, -, ×, ÷) between numbers
- Parentheses support for operation order
- All 4 numbers must be used exactly once
- Target must equal exactly 24

### Difficulty System
- **Easy**: Numbers 1-9, always solvable, simpler solutions exist
- **Medium**: Numbers 1-13, guaranteed solvable
- **Hard**: Numbers 1-13, multiple valid solutions, time pressure

### Hint System
- Reveal one operation placement
- Show number of solutions
- Auto-solve with step-by-step display

### Scoring & Progression
- Base points per puzzle solved
- Time bonus (faster = more points)
- Streak multiplier (consecutive solves)
- Daily challenge mode
- Statistics (total solved, best streak, avg time)

### UI/UX
- Card-style number display (playing card aesthetic)
- Drag operations between numbers
- Expression builder with parentheses
- Undo/redo expression building
- Solution validation with visual feedback

### Audio
- Card flip sounds
- Correct solution celebration
- Wrong attempt feedback
- Timer tick (optional)

## Key Differentiator
Most Math 24 apps are SOLVERS or basic educational tools. Our version will be a polished GAME with:
- Casino-style card visuals
- Combo scoring system
- Daily challenge + infinite practice
- Star ratings per puzzle
- Achievement system
- Smooth animations and particle effects

## Target Specs
- **Slug**: `math-24`
- **Levels**: 100+ procedurally generated puzzles (guaranteed solvable)
- **Modes**: Classic (4 numbers → 24), Speed Challenge, Daily
- **Size target**: 45-60KB single HTML file
- **Style**: Dark neon casino theme with card-game aesthetics
