# Yahtzee - Competitive Benchmark

## Competitors
1. **playyahtzeegame.com** - Full single player, AI opponent, rules guide
2. **yahtzee-online.com** - Single player + AI, user accounts, progress tracking
3. **playcards.co** - AI opponent with strategic decisions, solo mode
4. **arcadiagames.io** - Expected value strategy, scoring guide
5. **rollmydice.app** - 13 categories, upper bonus, Yahtzee bonus rules

## Core Rules (All Competitors Implement)
- 5 six-sided dice, 13 rounds per game
- 3 rolls per turn, hold/reroll any subset
- Upper Section: Ones through Sixes (bonus at 63+ = 35 points)
- Lower Section: Three of a Kind, Four of a Kind, Full House (25), Small Straight (30), Large Straight (40), Yahtzee (50), Chance
- Yahtzee Bonus: 100 extra points per additional Yahtzee (after first)
- Joker Rules: If Yahtzee rolled and Yahtzee category used, can score in upper/lower with full value

## Key Systems to Implement
1. **Dice rolling** - Animated 3D-ish dice with dots, shake animation
2. **Hold/Reroll** - Click dice to toggle hold, visual indicator (held dice look different)
3. **Scorecard** - Full 13-category card, upper/lower sections, totals, bonus indicators
4. **AI Opponent** - Strategic AI (maximize expected value per roll)
5. **Scoring** - Real-time score preview showing what each category would score
6. **Game modes** - vs AI (Easy/Medium/Hard), Solo (beat your best)
7. **Achievements** - Yahtzee (first time), Yahtzee Bonus, Upper Bonus, Perfect Game (all categories maxed), High Score milestones
8. **Statistics** - Games played, win rate, best score, Yahtzees rolled, average score
9. **Tutorial** - Interactive walkthrough of first roll/hold/score cycle
10. **Settings** - Sound toggle, animation speed, scoring help

## Visual Style Reference
- Dark gradient background, neon accent
- Crisp white dice with dark dots, subtle shadows
- Scorecard: glass-morphism panel
- Held dice: glowing border/elevated
- Score preview: category highlights on hover
- Roll button: large, prominent, animated
- Game over: celebration particles for high scores

## Music Style
- Casino/game night feel: upbeat but not distracting
- Subtle dice rolling SFX, satisfying "click" for hold
- Fanfare for Yahtzee, gentle chime for good scores
