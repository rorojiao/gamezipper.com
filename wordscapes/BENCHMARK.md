# Wordscapes Competitive Benchmark

## Target Game: Wordscapes (by PeopleFun)
- **Downloads**: 100M+ on Google Play, 10M+ active players
- **Rating**: 4.7/5 stars
- **Revenue**: Top-grossing word game, $100M+ lifetime revenue

## Core Competitors Analyzed
1. **Wordscapes** (PeopleFun) — 6,000+ levels, crossword + word search hybrid
2. **Word Connect** (ZenLife Games) — 11,508 levels, multiple game modes
3. **Crossword Jam** (PlaySimple Games) — Daily challenges, offline play
4. **Word Cookies** (BitMango) — 2,000+ levels, no time limits
5. **Word Life** (Socialpoint) — 6,000+ levels, word stacks + facts

## Systems to Implement (ALL required)

### 1. Crossword Grid System
- Grid at top with intersecting word slots
- Blank cells show letter count (like newspaper crosswords)
- Cells fill in as words are found
- Grid sizes increase with difficulty: 3x3 → 5x5 → 7x7
- Intersecting words share letters (crossword style)

### 2. Letter Wheel System
- Circular arrangement of 5-7 letters at bottom
- Swipe/drag between letters to form words
- Visual feedback: letters highlight when selected
- Connected path shown with lines/arrows
- Auto-submit when finger lifts (if valid word)

### 3. Word Validation
- Minimum 3-letter words
- Built-in dictionary (3,000+ common English words)
- Visual + audio feedback on valid/invalid words
- Bonus words: valid words not in grid earn extra coins

### 4. Level System (minimum 30 levels)
- **Pack 1: Sunrise** (5x5, 3-4 letter words) — Levels 1-10
- **Pack 2: Forest** (5x6, 3-5 letter words) — Levels 11-20
- **Pack 3: Canyon** (6x6, 3-5 letter words, harder words) — Levels 21-30
- **Pack 4: Ocean** (6x7, 3-6 letter words) — Levels 31-40
- **Pack 5: Mountain** (7x7, 4-7 letter words) — Levels 41-50
- Each pack has a unique theme/background color

### 5. Scoring System
- Base points per word (length-based: 3-letter=10, 4=20, 5=40, 6=80, 7=160)
- Bonus word multiplier (1.5x)
- Level completion bonus (remaining hint coins × 5)
- Brilliance Score: cumulative words found across all levels
- Star rating per level (1-3 stars based on hints used)

### 6. Coin System
- Earn coins: completing levels (+50), bonus words (+10 each), daily puzzle (+100)
- Spend coins: hints (-30 per letter reveal), shuffle (free)
- Persistent coin balance (localStorage)

### 7. Hint System
- **Letter Hint** (30 coins): reveals one random unfilled cell
- **Word Hint** (60 coins): reveals an entire word
- Visual highlight animation when hint is used

### 8. Shuffle System
- Free to use (no coin cost)
- Rearranges letter positions in the wheel
- Smooth rotation animation
- Can be used unlimited times

### 9. Progress System
- localStorage with version field
- Tracks: current level, completed levels, coins, brilliance score, settings
- Pack completion percentage
- Auto-save after every word found

### 10. Tutorial System
- First-time tutorial (3 steps): swipe letters → fill grid → earn coins
- Dismissible, can be replayed from settings
- Hand-holding with animated arrows

### 11. Daily Puzzle
- One puzzle per day (date-seeded random)
- Special coin reward (+100)
- Separate from main progression

### 12. Visual Style
- Relaxing gradient backgrounds per pack (nature themes)
- Clean, modern UI with rounded corners
- Letter wheel with glass-morphism effect
- Smooth animations: letter pop-in, word slide, confetti on completion
- Particle effects on bonus words

### 13. Audio System (Web Audio API)
- BGM: ambient/relaxing procedural music
- SFX: letter tap, word found, bonus word, hint used, level complete, shuffle
- Sound toggle button
- Volume control

### 14. SEO & Analytics
- site-analytics tracking
- JSON-LD: VideoGame + FAQPage + BreadcrumbList
- og:title, og:description, og:image
- Title: Play Wordscapes Online Free | GameZipper

## Key Differentiation from Existing GZ Games
- Different from word-puzzle (Wordle clone): crossword grid + letter wheel vs. daily 5-letter guess
- Different from crossword: uses letter wheel swiping vs. typing clues
- Hybrid mechanic unique to this genre
