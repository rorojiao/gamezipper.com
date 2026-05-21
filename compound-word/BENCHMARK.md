# BENCHMARK — Compound Word Puzzle

## Competitive Analysis

### 1. SEEKING (Bridge Word Game)
- **Platform**: iOS App Store, trending May 2026
- **Core Mechanic**: Find a bridge word that completes two compound words. Example: FIRE ___ SHOP → WORK
- **Systems**: Daily puzzle, streak tracking, timer, hints
- **Levels**: Daily format (1 puzzle/day), but 100+ in archive
- **Art Style**: Clean minimalist, bold typography, warm color palette
- **Music**: Soft lo-fi ambient
- **Engagement**: ~60 seconds per puzzle, high daily retention

### 2. Wordscapes (NG Studios) — Compound Word Levels
- **Platform**: 500M+ downloads, iOS/Android
- **Core Mechanic**: Anagram + word formation, some levels use compound words
- **Systems**: 6000+ levels, daily challenge, tournaments, teams
- **Key Difference**: Primarily anagram, not compound word focused

### 3. Compound Word Puzzles (Web/Coolmath)
- **Platform**: Various web versions
- **Core Mechanic**: Given two word parts, find the connecting word
- **Systems**: Score tracking, timer, categories
- **Levels**: 50-100 levels typical
- **Art Style**: Educational/clean

## Feature Benchmark (Must Implement)

| Feature | SEEKING | Coolmath Web | Target |
|---------|---------|-------------|--------|
| Bridge word mechanic | ✅ | ✅ | ✅ Essential |
| Daily puzzle | ✅ | ❌ | ✅ |
| Timer + scoring | ✅ | ✅ | ✅ |
| Hints | ✅ (3/day) | ✅ | ✅ (coins system) |
| Streak tracking | ✅ | ❌ | ✅ |
| Categories | ❌ | ✅ | ✅ (20 categories) |
| Progressive difficulty | ✅ | ✅ | ✅ (3-7 letter bridges) |
| Stats/achievements | ✅ | ❌ | ✅ |
| Sound effects | ✅ | ❌ | ✅ Web Audio |
| Tutorial | ✅ | ❌ | ✅ |
| Star ratings | ❌ | ❌ | ✅ |
| Undo | ❌ | ❌ | ✅ |

## Game Design Spec

### Core Mechanic
- Player sees: WORD_A ___ WORD_B
- Must find a word X such that WORD_A+X and X+WORD_B are both valid compound words
- Example: FIRE + WORK + SHOP, BATH + ROOM + MATE, BOOK + CASE + WORK

### Difficulty Levels
1. **Easy**: 3-letter bridge words (e.g., SUN + FLOWER + LIGHT → nope... SUN + SET + BACK)
2. **Medium**: 4-letter bridge words (e.g., FIRE + WORK + SHOP)
3. **Hard**: 5-6 letter bridge words (e.g., BREAK + FAST + FOOD)
4. **Expert**: 7+ letter bridge words

### Puzzle Categories (20+)
1. Nature (RAIN, BOW, DROP, STORM, etc.)
2. Home (BED, ROOM, DOOR, KITCHEN, etc.)
3. Food (BREAD, BUTTER, MILK, COFFEE, etc.)
4. Body (HEAD, HAND, FOOT, BACK, etc.)
5. Animals (CAT, FISH, BIRD, HORSE, etc.)
6. Time (DAY, NIGHT, HOUR, WEEK, etc.)
7. Work (JOB, WORK, OFFICE, PAPER, etc.)
8. Sports (BALL, GAME, TEAM, RACE, etc.)
9. Music (SONG, BAND, NOTE, DRUM, etc.)
10. Travel (ROAD, CAR, TRAIN, PLANE, etc.)
11. Weather (RAIN, SNOW, WIND, CLOUD, etc.)
12. Colors (RED, BLUE, GREEN, etc.)
13. Family (MOTHER, FATHER, SISTER, etc.)
14. School (BOOK, CLASS, PEN, TEST, etc.)
15. Money (BANK, COIN, BILL, CASH, etc.)
16. Water (SEA, LAKE, RIVER, POOL, etc.)
17. Fire (FLAME, HEAT, SMOKE, ASH, etc.)
18. Sky (STAR, MOON, SUN, CLOUD, etc.)
19. Tools (HAMMER, NAIL, SAW, DRILL, etc.)
20. Clothing (SHIRT, SHOE, HAT, COAT, etc.)

### Scoring System
- Base: 100 points per correct answer
- Time bonus: +50 if solved within 10 seconds, +25 within 30 seconds
- Streak bonus: +10 per consecutive correct answer
- Hint penalty: -25 points per hint used
- Star rating: 3 stars (no hints, fast), 2 stars (1 hint), 1 star (2+ hints)

### Word Database Target
- Minimum 150 compound word puzzles across 20 categories
- 5 difficulty tiers (Easy/Medium/Hard/Expert/Master)
- Each puzzle: left_word, bridge_word, right_word, category
