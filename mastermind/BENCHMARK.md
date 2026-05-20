# Mastermind — Competitive Benchmark

## Competitors
1. **Mastermind (Web browser versions)** - Classic 4-color, 6-8 guess limit
2. **Bulls & Cows** - Number-based variant, 4 digits
3. **Wordle (NYT)** - Same deduction concept, massive 11B+ plays

## Core Systems to Implement
- Color code generation (4 positions, 6 colors = Easy, 8 colors = Medium, 10 colors = Hard)
- Feedback system: Black pegs (correct color+position), White pegs (correct color wrong position)
- Maximum 10 guesses per round
- Score based on: guesses used + time + difficulty bonus
- Statistics: games won, win streak, best scores, guess distribution
- Progress save (localStorage with version)
- Tutorial for new players
- Sound effects: peg placement, guess submit, win celebration, game over

## Key Mechanics
- Player guesses a secret code by selecting 4 colors
- After each guess: N black pegs (exact matches) + M white pegs (color matches, wrong position)
- Win: all 4 positions correct within max guesses
- Lose: exhaust all guesses

## Visual Style
- Dark gradient background (GameZipper style)
- Neon colored pegs with glow effects
- Smooth animations for peg placement and feedback reveal
- Glass-morphism panels

## Difficulty Levels
- Easy: 4 colors, 4 positions, 10 guesses
- Medium: 6 colors, 4 positions, 8 guesses
- Hard: 8 colors, 4 positions, 6 guesses
