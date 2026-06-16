# Speed Math Race — Competitive Benchmark

## Game Concept
Fast-paced mental arithmetic game. Solve as many math problems as possible against the clock. Combos, power-ups, progressive difficulty. Race-themed visuals.

## Competitive Analysis (June 2026)

### 1. Mental Math Master (mobile, 10M+ downloads)
- Core: progressive difficulty math problems
- Systems: streak/combo, timer, levels, achievements, daily challenges
- Scoring: speed bonus + streak multiplier
- Retention: 50+ levels, daily challenges, global leaderboards
- Art style: clean flat, dark theme, neon accents

### 2. Maths Race / Math Racer (web + mobile)
- Core: answer correctly to accelerate a car/character forward
- Systems: race track visualization, opponent AI, lap system
- Scoring: position-based + answer speed
- Retention: tournament mode, unlock tracks
- Art style: racing theme, bright colors

### 3. Zetamac Arithmetic (web)
- Core: 2-minute arithmetic sprint, simple +/-/×
- Systems: timer countdown, score counter, best score
- Scoring: 1 point per correct, -1 or no penalty for wrong
- Retention: personal best tracking, leaderboard
- Art style: minimalist, text-focused

### 4. Quick Math (mobile, 5M+ downloads)
- Core: flash cards with multiple choice, gesture answers
- Systems: difficulty modes, combo, timer
- Scoring: combo multiplier, time bonus
- Retention: 120+ challenges, multiplayer

## Systems to Implement (S-grade parity)
1. **3 Game Modes**: Time Attack (60s), Survival (3 lives), Marathon (endless)
2. **4 Difficulty Tiers**: Rookie (1-digit), Pro (2-digit), Expert (×/÷), Insane (mixed + negative)
3. **Combo System**: streak multiplier up to x10, visual feedback
4. **Power-ups**: Freeze (3s), Skip (free answer), Double (2x next 5)
5. **Score System**: base + speed bonus + combo multiplier + difficulty bonus
6. **Progress Save**: localStorage with version, best scores per mode, total solved
7. **Achievements**: First Combo x5, Solve 100, Solve 500, No-miss round, etc.
8. **Tutorial**: interactive first-time guide
9. **Statistics**: total solved, accuracy, best streak, time played
10. **Audio**: Web Audio API procedural SFX (correct, wrong, combo, powerup, levelup)

## Level Design (Marathon mode progression)
- Levels 1-5: single digit addition/subtraction
- Levels 6-10: two digit add/sub, introduce ×
- Levels 11-15: mixed operations, introduce ÷
- Levels 16-20: larger numbers, time pressure increases
- Levels 21-30: negative results, order of operations, speed scaling
- Each level: solve N problems to advance, difficulty scales within level

## Scoring Formula
- base = 10 per correct
- speed_bonus = max(0, (timeLimit - answerTime) * 2)
- combo_mult = min(10, currentStreak)
- difficulty_mult = {1, 1.5, 2, 3}[difficulty]
- score = floor((base + speed_bonus) * combo_mult * difficulty_mult)

## Art Direction
- Dark gradient background (deep blue → purple)
- Neon cyan/magenta accent for correct, orange/red for wrong
- Race track progress visualization at top
- Large bold numbers, satisfying particle bursts on correct
- Glass-morphism panels for score/stats

## Music Direction
- Upbeat electronic / synthwave, driving tempo
- Procedural via Web Audio API (oscillators + arpeggios)
- Correct answer = ascending arpeggio, wrong = descending tone
