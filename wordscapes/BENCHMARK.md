# Wordscapes Competitive Benchmark

## Primary Competitor: Wordscapes (PeopleFun)
- **Downloads**: 100M+ on Google Play
- **Levels**: 6,000+ regular levels across 58 packs + Master Levels + Daily Puzzle
- **Rating**: 4.7★ on Google Play

## Competitor 2: Word Connect (Zentertain)
- Similar letter-wheel + crossword mechanic
- Focuses on word finding and bonus rewards

## Competitor 3: Words of Wonders (Fugo Games)
- Crossword puzzle + word discovery
- Adds travel/adventure theme

## Core Mechanics to Implement

### 1. Letter Wheel
- Circular arrangement of 5-7 letters at bottom of screen
- Swipe between letters to form words
- Visual feedback: letters highlight when selected, word preview shown
- **Shuffle button**: Free, unlimited, rearranges letter positions

### 2. Crossword Grid
- Blank squares show word length and position (like a crossword)
- Words fill in automatically when correctly formed
- Grid reveals letter positions as words are found, helping find remaining words
- Grid size increases with difficulty (start 3x3, progress to larger)

### 3. Word Validation
- Built-in dictionary validation (need ~3000-5000 common English words)
- No penalty for wrong guesses (words just bounce back)
- Valid words not in grid = bonus words → earn coins

### 4. Scoring System
- **Bonus words**: Each bonus word found = 1 coin
- **Level completion**: Bonus coins based on performance
- **Star rating**: 1-3 stars per level (based on hints used / time)
- **Coin balance**: Persistent, used for power-ups
- **Total score**: Accumulated across all levels

### 5. Power-ups (cost coins)
- **Bullseye**: Reveals one letter in the grid (30 coins)
- **Lightbulb**: Reveals an entire word (60 coins)  
- **Shuffle**: FREE, unlimited

### 6. Level Structure
- **Minimum 30 levels** for initial release
- Grouped into themed packs (5 levels per pack)
- Difficulty progression:
  - Pack 1-2: 5 letters, 3-letter words, simple grids
  - Pack 3-4: 5-6 letters, 3-4 letter words
  - Pack 5-6: 6 letters, 4-5 letter words
  - Pack 7+: 6-7 letters, longer words, complex grids

### 7. Tutorial
- First level acts as implicit tutorial
- Highlights letter wheel, swipe gesture
- Shows where word appears in grid
- Skip option available

### 8. Progress System
- **localStorage** save with version field
- Tracks: current level, coins, stars per level, bonus words found
- Level select screen showing stars earned
- Daily puzzle concept (optional, if feasible)

### 9. Visual Style
- Relaxing, nature-themed backgrounds per pack
- Clean grid with subtle shadows and rounded cells
- Smooth letter animations (pop in/out)
- Confetti/celebration on level complete
- Dark gradient option for GameZipper consistency

### 10. Audio
- Relaxing ambient BGM (lo-fi / nature sounds)
- Letter tap sounds (soft click)
- Word found: satisfying chime (ascending notes)
- Bonus word found: coin sound
- Level complete: celebration fanfare
- Wrong word: gentle buzz
- Button hover/click feedback

## Key Differentiators for GameZipper Version
- Browser-based, no download required
- Instant play, single-page HTML5
- Clean modern dark theme (GameZipper style)
- Faster session pickup (no ads between levels in free version)
- Mobile-optimized touch controls
