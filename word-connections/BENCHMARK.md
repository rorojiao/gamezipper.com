# Word Connections Game Benchmark

## Game Overview

**Genre**: Word Connections / NYT Connections-style word puzzle
**Mechanic**: 16 words in a 4x4 grid → find 4 hidden groups of 4 related words
**Origin**: NYT Connections (June 2023), 10M+ monthly players

## Core Mechanics

### Grid & Selection
- 4x4 grid of 16 word tiles (ALL CAPS)
- Tap/click to select up to 4 words
- "Submit" button validates selection
- Correct → group animates and locks (removed from grid)
- Wrong → shake animation + mistake consumed
- 4 mistakes = game over

### Color-Coded Difficulty Tiers
| Tier | Color | Difficulty | Example |
|------|-------|------------|---------|
| 1 | Yellow (#F7DF1E) | Easiest | Fruits: APPLE, BANANA, CHERRY, DATE |
| 2 | Green (#8AC926) | Easy | Green things: GRASS, LEAF, EMERALD, CELERY |
| 3 | Blue (#005F99) | Medium | "Blue" synonyms: SAD, SKY, NOTE, WHALE |
| 4 | Purple (#9B5DE5) | Hardest | ___ Roll: DICE, INGREDIENT, JOURNAL, BURGER |

### Key UX Patterns
- Selection tray below grid (selected words slide down)
- Solved groups stack above remaining grid (easy to hard top→bottom)
- Mistake counter: ❌❌❌⭕ visual
- Share result: emoji grid (🟨🟩🟦🟪 rows)
- Word shuffle button
- Deselect by tapping selected word again

## Competitor Analysis

| Competitor | Puzzles | Daily | Hints | Scoring | Monetization |
|------------|---------|-------|-------|---------|--------------|
| NYT Connections | 1/day + archive | Yes | No | Mistake-based | $40/yr subscription |
| cozywordgame.com | Unlimited | No | Yes | Time + mistakes | Ad-supported |
| Mobile clones | Unlimited | Optional | Yes | Points + streaks | Ads + IAP |

## Recommended Feature Set

### Must Have
- 50+ built-in puzzles (4 groups of 4 words each)
- 4-color tier system (Yellow/Green/Blue/Purple)
- Selection mechanic (tap to select, max 4)
- Submit validation with shake animation on wrong
- 4 mistakes = game over
- Solved groups stack above grid
- Win state with confetti
- Loss state revealing all categories
- Share result (copyable emoji grid)

### Should Have
- Hint system (reveal one word from a group)
- Shuffle remaining words
- Progress save (localStorage, completed puzzles)
- Dark neon theme (GameZipper style)
- Stats: games played, win rate, current streak, best streak
- Sound effects (Web Audio API)
- Smooth CSS animations

### Nice to Have
- Daily puzzle mode (date-seeded selection)
- Star rating (0-4 mistakes = stars)
- Tutorial on first play
- Level select grid with completion indicators

## Puzzle Construction Rules
1. Words belong to exactly ONE category (no overlap)
2. Include red herrings (words that could fit wrong groups)
3. Yellow = obvious, Purple = tricky/wordplay
4. Each puzzle must be solvable without guessing
5. Difficulty progression across puzzle numbers

## Difficulty Design
- Puzzles 1-10: Easy (obvious categories)
- Puzzles 11-25: Medium (some wordplay)
- Puzzles 26-40: Hard (tricky connections, double meanings)
- Puzzles 41-50+: Expert (heavy wordplay, niche categories)

## Data Structure
```javascript
const puzzle = {
  id: 1,
  groups: [
    { name: "Fruits", tier: 0, words: ["APPLE","BANANA","CHERRY","DATE"] },
    { name: "Green Things", tier: 1, words: ["GRASS","LEAF","EMERALD","CELERY"] },
    { name: "Synonyms for Sad", tier: 2, words: ["SAD","BLUE","DOWN","GLOOMY"] },
    { name: "___ Roll", tier: 3, words: ["DICE","JOURNAL","BURGER","DRUM"] }
  ]
};
```

## Psychological Hooks
1. "Aha moment" when finding hidden connection
2. Social sharing (emoji grid drives organic growth)
3. Low barrier: 2-5 min per puzzle
4. Forgiving: 4 mistakes still = solved
5. "Just one more puzzle" loop (unlimited mode)
