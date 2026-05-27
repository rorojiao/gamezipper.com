# Text Twist — Competitive Benchmark

## Game Overview
Text Twist is a classic word puzzle game where players unscramble 6-7 letters to form as many valid English words as possible within a time limit.

## Competitors

### 1. TextTwist (GameHouse/original)
- **Platform**: Web, Mobile (iOS/Android)
- **Downloads**: 50M+ combined
- **Core Mechanic**: 6 letters, find all words (3+ letters), must find the 6-letter word to advance
- **Systems**: Timer (2 min/round), round progression, shuffle button, hint system, score tracking
- **Monetization**: Ads between rounds

### 2. Text Twist 2 (Shockwave/GameHouse)
- **Platform**: Web
- **Core Mechanic**: Enhanced version with multiple game modes
- **Modes**: Timed, Untimed, Lightning (find words fast)
- **Systems**: Progress tracking, achievements, combo bonuses for consecutive words
- **Visual**: Colorful letter wheel, animated word formation

### 3. Word Wipe (Arkadium)
- **Platform**: Web (MSN Games, Arkadium)
- **Plays**: 500K+ monthly
- **Core Mechanic**: Grid of letters, swipe to form words, adjacent letters only
- **Difference**: Grid-based (not wheel), different from Text Twist's letter pool

### 4. Super Text Twist (GameHouse)
- **Platform**: Web, Mobile
- **Core Mechanic**: 7 letters instead of 6, harder difficulty
- **Systems**: Progressive difficulty, themed rounds, bonus words

## Key Systems to Implement

### Core Mechanics
- **Letter Pool**: 6 letters displayed in a circle/wheel
- **Word Length**: 3-letter to 6-letter words (minimum 3 letters)
- **Must-Find Word**: At least one 6-letter word must be found to advance
- **Shuffle**: Re-arrange letter display order (no new letters)

### Scoring
- 3-letter words: 100 pts
- 4-letter words: 400 pts
- 5-letter words: 1000 pts
- 6-letter words: 2000 pts
- Bonus: finding ALL words in a round = 2x multiplier
- Combo: consecutive correct words = bonus multiplier

### Game Modes
- **Classic**: Timed rounds (2 min), advance when 6-letter word found
- **Untimed**: No timer, play at own pace
- **Lightning**: 60 seconds, find as many words as possible

### Progression
- Round counter (endless)
- Progressive difficulty (harder letter combinations at higher rounds)
- Best score per round, all-time best

### UI/UX
- Letter wheel/circle at center
- Word input area at top
- Found words list on the side
- Timer bar at top
- Shuffle and Submit buttons
- Word blanks showing unfound words (e.g., "_ _ _ _ _" for 5-letter word)
- Hint button (reveals a random unfound word, limited uses)

### Technical Requirements
- Dictionary: 5000+ valid English words (3-6 letters)
- Letter generation: guarantee at least one 6-letter anagram exists
- Timer: countdown with visual progress bar
- Touch: tap letters to form words, backspace, submit

## Quality Target
- S-grade commercial quality
- 30KB+ single HTML file
- Canvas or DOM rendering
- Web Audio BGM + SFX
- Dark theme (GameZipper style)
- Full English UI
- localStorage persistence
