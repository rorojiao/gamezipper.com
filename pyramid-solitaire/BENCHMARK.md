# Pyramid Solitaire — Competitive Benchmark

## Competitors Analyzed
1. **Microsoft Solitaire Collection — Pyramid** (Microsoft, millions daily)
   - Pyramid layout: 28 cards in 7 rows, stock pile, waste pile
   - Clear pairs that sum to 13: K+Q removed together (wait, K alone = 13)
   - Score: 2 pts per pair removed, 5 bonus for clearing pyramid
   - Hints, undo, stock recycling (3 passes through stock)
   - Easy mode (draw 1) vs Hard mode (draw 3)

2. **Pyramid Solitaire ( mobilityware / mobilityware+ )** — Top App Store
   - Same core: remove pairs summing to 13 (A=1, J=11, Q=12, K=13 alone)
   - 28-card pyramid, stock pile, waste pile
   - Scoring: Points for speed + cards removed
   - Power-ups: hint, undo, shuffle stock
   - Daily challenges, statistics, achievements
   - Combo bonuses for consecutive pair removals

3. **Pyramid Solitaire (Coolmath Games)**
   - Simple version: pyramid + stock pile
   - Score based on cards cleared
   - Clean UI, no ads interruptions

## Core Systems to Implement
1. **Pyramid Layout**: 7 rows (1-2-3-4-5-6-7 = 28 cards), face-down until uncovered
2. **Card Matching**: Remove pairs summing to 13 (A=1...K=13). K removes alone.
3. **Stock/Waste Pile**: Draw from stock to waste, use waste top card
4. **Scoring**: Base score per pair + combo bonus + time bonus + clear bonus
5. **Stock Recycling**: 3 passes through stock (limited)
6. **Undo System**: Full undo stack
7. **Hints**: Highlight available moves
8. **Tutorial**: First-game tutorial explaining rules
9. **Statistics**: Games played, won, best score, win streak
10. **Daily Challenge**: Seeded daily game
11. **Progress Save**: localStorage with version field

## Visual Style
- Classic solitaire card rendering (Canvas)
- Green felt-like background
- Smooth card flip/removal animations
- Particle effects on successful pair removal

## Music Style
- Relaxing ambient, piano-based BGM
- Card flip sound, pair match sound, error sound, win celebration
