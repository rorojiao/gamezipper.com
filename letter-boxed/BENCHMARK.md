# BENCHMARK: Letter Boxed

## Game Overview
- **Slug**: `letter-boxed`
- **Genre**: Word Puzzle
- **Core Mechanic**: 12 letters on 4 sides of a square box. Create words where consecutive letters come from different sides. Chain words by starting each with the last letter of the previous. Use all 12 letters in fewest words.

## Competitors

### 1. NYT Letter Boxed (Original)
- **Platform**: Web + Mobile App (iOS/Android)
- **Creator**: Sam Ezersky
- **Price**: Free daily, $25/yr subscription for archive
- **Rating**: 4.5★, 131K reviews
- **Features**:
  - Hand-crafted daily puzzles
  - Curated dictionary validation
  - Stats tracking (streak, solve rate)
  - Share results (emoji grid)
  - Solution reveal (next day)
  - Clean minimal UI with letter box visual
  - Touch and keyboard input
  - Color-coded sides (4 colors)

### 2. Letter Boxed by Kuantark (Android)
- **Platform**: Android
- **Price**: Free + Ads
- **Features**:
  - 177K word offline dictionary
  - Hint system (reveal letters)
  - Daily puzzles + archive
  - Offline-first mobile-native
  - Dark/light theme

### 3. Stitch-uations by ChazWinter (Web)
- **Platform**: Web (React + AWS)
- **Price**: Free / Open Source
- **Features**:
  - Full NYT puzzle archive
  - 15 language support
  - Custom puzzle creation
  - Solution generator (backtracking)
  - Most feature-rich competitor

### 4. Letter Cubed (Web)
- **Platform**: Web (single HTML file)
- **Price**: Free
- **Features**:
  - 3D rotating cube variant
  - Canvas rendering
  - Minimal single-file implementation

### 5. Letterlike (iOS + Android)
- **Platform**: iOS + Android
- **Price**: Paid
- **Features**:
  - Roguelike + word game hybrid
  - Procedural generation
  - Progression system

## Feature Comparison Matrix

| Feature | NYT | Kuantark | Stitch | Letter Cubed | Ours Target |
|---------|-----|----------|--------|-------------|-------------|
| Daily puzzle | ✅ | ✅ | ✅ | ❌ | ✅ |
| Puzzle archive | ✅ | ✅ | ✅ | ❌ | ✅ (30+) |
| Hint system | ✅ | ✅ | ❌ | ❌ | ✅ |
| Stats tracking | ✅ | ✅ | ❌ | ❌ | ✅ |
| Share results | ✅ | ❌ | ❌ | ❌ | ✅ |
| Solution reveal | ✅ | ✅ | ✅ | ❌ | ✅ |
| Custom puzzles | ❌ | ❌ | ✅ | ❌ | ❌ |
| Multi-language | ❌ | ❌ | ✅ | ❌ | ❌ |
| Tutorial | ❌ | ❌ | ❌ | ❌ | ✅ |
| Sound effects | ❌ | ❌ | ❌ | ❌ | ✅ |
| BGM | ❌ | ❌ | ❌ | ❌ | ✅ |
| Mobile responsive | ✅ | ✅ | ✅ | ❌ | ✅ |
| Animations | ✅ | ✅ | ✅ | ✅ | ✅ |
| Color-coded sides | ✅ | ✅ | ✅ | ❌ | ✅ |
| Word definitions | ❌ | ❌ | ❌ | ❌ | ✅ |
| Combo scoring | ❌ | ❌ | ❌ | ❌ | ✅ |
| Progression system | ❌ | ❌ | ❌ | ✅ | ✅ |

## Implementation Targets

### Must-Have Systems (from all competitors)
1. **Letter Box UI** — 12 letters arranged on 4 sides of a square, each side a different color
2. **Word Validation** — Large embedded dictionary (top 50K English words)
3. **Side Constraint** — Consecutive letters must come from different sides
4. **Word Chaining** — Each word starts with the last letter of previous word
5. **Win Condition** — Use all 12 unique letters across all words in a puzzle
6. **Scoring** — Fewer words = better (2-word solutions = perfect, 3 = excellent, 4+ = good)
7. **Daily Puzzle** — Date-seeded puzzle generation
8. **Puzzle Archive** — 30+ hand-crafted puzzles with difficulty progression
9. **Hint System** — Reveal one letter of the solution
10. **Stats** — Streak, solve rate, best score, puzzles played
11. **Share Results** — Copy emoji grid to clipboard
12. **Tutorial** — Step-by-step interactive tutorial

### Nice-to-Have (differentiators)
1. **Combo scoring** — Bonus points for longer words
2. **Word definitions** — Show definition after each word
3. **Particle effects** — Celebrations on solve
4. **Sound design** — Procedural audio feedback
5. **Star ratings** — 1-3 stars per puzzle based on word count

### Visual Style
- Dark gradient background (GameZipper style)
- 4 distinctly colored sides (neon colors: pink, cyan, lime, amber)
- Smooth letter selection animations
- Word chain visualization
- Particle celebration on puzzle completion

### Scoring Formula
- **Base**: 1000 points per puzzle
- **Word bonus**: 100 × (6 - word_count) for solutions ≤ 5 words
- **Length bonus**: word_length × 10 per word
- **Time bonus**: max(0, 300 - seconds_elapsed)
- **Stars**: 3★ ≤ 2 words, 2★ ≤ 3 words, 1★ ≤ 5 words
