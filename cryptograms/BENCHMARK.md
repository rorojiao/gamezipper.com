# Cryptograms — Competitive Benchmark

## Genre Overview
Cryptogram puzzles use letter substitution ciphers where each letter in a quote/phrase is replaced by a different letter. The player must decode the cipher by figuring out which cipher letter maps to which real letter.

## Competitors

### Mobile Apps
1. **Cryptogram by ARTisan** — Most popular mobile cryptogram app
   - 200+ curated quotes across 8 categories
   - Daily puzzle with streak tracking
   - 3 difficulty levels (Easy/Medium/Hard)
   - Hint system: reveal letter, reveal word, check all
   - Statistics: puzzles solved, accuracy, best time, streaks
   - Dark/light themes

2. **Cryptoquote** by Centaur Media
   - Newspaper-style cryptoquote puzzles
   - Daily puzzles from newspapers
   - Clean minimalist interface
   - Auto-fill when letter decoded

3. **Crypto!** by Nikki
   - Classic cryptogram interface
   - Letter frequency display
   - Keyboard-based input

### Browser Games
- Coolmath Games: Cryptograms (featured)
- Various independent sites

## Core Mechanics

### Cipher Generation
- **Random substitution cipher** (industry standard, 95%+ of apps)
  - Each letter A-Z maps to a random different letter
  - Guarantee: A≠A (no letter maps to itself)
  - Consistency: same letter always maps to same cipher letter within a puzzle
- **Keyword-based cipher** (used by some advanced variants)
  - Start with a keyword to fill initial mappings
  - Fill remaining letters in order

### Difficulty Levels
| Level | Features | Description |
|-------|----------|-------------|
| Easy | Word boundaries shown, common patterns | Best for beginners |
| Medium | No word boundaries, spaces shown | Moderate challenge |
| Hard | No spaces, no boundaries | Maximum challenge |

### Quote Sources
- Famous quotes (inspirational, philosophical)
- Proverbs and wisdom
- Jokes and humor
- Science and nature
- History and politics
- Literature excerpts
- Song lyrics

## Key Features to Implement

### 1. Auto-fill System
- When player decodes a cipher letter (e.g., X=A), ALL instances of X update to A
- Visual feedback on the substitution
- Undo capability

### 2. Input Interface
- Click on a cipher letter to select it
- Type or tap the decoded letter
- QWERTY keyboard display on screen
- Highlight all instances of selected letter

### 3. Hint System
| Hint Type | Cost | Description |
|-----------|------|-------------|
| Reveal Letter | Free (limited) | Shows one random letter mapping |
| Check Word | Free (limited) | Highlights incorrect letters in a word |
| Reveal Word | Premium | Reveals an entire word |

### 4. Scoring System
- Base score per puzzle completed
- Time bonus (faster = more points)
- Hint penalty (each hint reduces score)
- Streak multiplier (consecutive daily puzzles)

### 5. Progress Tracking
- Puzzles solved per category
- Current streak (daily puzzles)
- Best streak
- Total time
- Average solve time
- Accuracy rate

### 6. Daily Puzzle
- Seeded puzzle (same puzzle for everyone on same date)
- 24-hour window
- Streak tracking with rewards

## Technical Notes

### Letter Frequency
Standard English letter frequency (for hints and difficulty calibration):
E(12.7%), T(9.1%), A(8.2%), O(7.5%), I(7.0%), N(6.7%), S(6.3%), H(6.1%), R(6.0%)
Common bigrams: TH, HE, IN, ER, AN, RE, ON
Common trigrams: THE, AND, ING, HER

### Common Patterns
- Q is almost always followed by U
- Single-letter words: A, I
- Two-letter words: TO, OF, IN, IT, IS, BE, AT, AS, ON, HE, WE, DO
- Three-letter words: THE, AND, FOR, ARE, BUT, NOT, YOU, ALL

### UI Pattern
- Cipher text displayed in boxes/letter slots
- Selected letter highlighted
- Below each cipher letter, player's guess shown in different color
- Keyboard at bottom for letter selection
- Category and difficulty label at top

## Monetization
- Banner ads (bottom)
- Interstitial ads (between puzzles)
- Rewarded video ads (for hints)
- No IAP (browser game model)

## Visual Style (GameZipper)
- Dark gradient background (#0a0a1a → #1a1a2e)
- Neon accent colors for highlights
- Clean monospace font for cipher text
- Modern sans-serif for UI
- Glass-morphism panels
- Particle effects on puzzle completion
