# Wordle — Competitor Benchmark

## Target Game: Wordle (Daily Word Guess)
**Slug**: `wordle`
**Score**: 23/25

## Competitors

### 1. NYT Wordle (nytimes.com/games/wordle)
- 5-letter word, 6 guesses
- Green/Yellow/Gray color feedback
- Daily puzzle (same word for everyone)
- Hard mode (must use revealed hints)
- Statistics: games played, win %, guess distribution, streak, max streak
- Share results (emoji grid)
- Keyboard with color state
- 11B+ total plays

### 2. Wordle Unlimited (wordleunlimited.org)
- Same mechanics as NYT Wordle
- Unlimited practice mode
- No daily restriction — play as many as you want
- Word lengths: 4-11 letters
- Dark/light theme

### 3. Quordle (quordle.com)
- 4 simultaneous Wordle boards
- 9 guesses to solve all 4
- Daily + practice mode
- Share emoji results

## Systems to Implement

| System | NYT Wordle | Wordle Unlimited | Our Implementation |
|--------|-----------|-----------------|-------------------|
| Daily Puzzle | ✅ | ❌ | ✅ Seeded daily |
| Practice/Unlimited | ❌ | ✅ | ✅ Random practice |
| Hard Mode | ✅ | ✅ | ✅ Must use hints |
| Statistics | ✅ | ✅ | ✅ Full stats |
| Share Results | ✅ | ✅ | ✅ Emoji grid |
| Keyboard Colors | ✅ | ✅ | ✅ Color-coded |
| Streak Tracking | ✅ | ✅ | ✅ Current + Max |
| Guess Distribution | ✅ | ❌ | ✅ Bar chart |
| Tutorial | ❌ | ❌ | ✅ How to play |
| Sound Effects | ❌ | ❌ | ✅ Web Audio |
| Word Length Options | ❌ | ✅ (4-11) | ✅ (4-6 letters) |
| Tile Animations | ✅ | ✅ | ✅ Flip + bounce |
| Timer | ❌ | ❌ | ✅ Optional |
| Dark Mode | ✅ | ✅ | ✅ Default dark |

## Word List
- ~2300 solution words (common 5-letter English words)
- ~10000+ valid guess words (larger dictionary for validation)
- Pre-filtered: no offensive words, no proper nouns

## Scoring
- No score per se — win/loss + number of guesses
- Statistics tracked in localStorage

## Visual Style
- Dark neon GameZipper theme
- Tile flip animation on reveal (like NYT)
- Keyboard with green/yellow/gray states
- Shake animation for invalid words
- Bounce animation on win
- Confetti/particles on win
