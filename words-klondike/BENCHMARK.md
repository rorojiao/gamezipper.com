# Words Klondike - Benchmark Document

## Competitor Analysis

### 1. Words Klondike: Associations (Higgs Studio)
- **Platform**: iOS/Android (Nov 2025), 100K+ downloads
- **Core Mechanic**: Solitaire card layout + word association sorting
  - Draw cards from deck, place on tableau
  - Category Cards define groups, Word/Picture Cards sorted into matching categories
  - Two card types: Picture Cards (visual) and Word Cards (text)
- **Features**: Progressive levels, relaxing theme, capybara guide, hint system
- **Monetization**: Free with ads/hints

### 2. Solitaire Associations (browser)
- **Core Mechanic**: Solitaire + category sorting, hundreds of levels
- **Features**: Multiple game levels, strategic tips, walkthroughs

### 3. Associations - Word Connect (CrazyGames)
- **Core Mechanic**: Discover hidden relationships between words, link ideas/concepts/meanings
- **Features**: Multiple levels, word riddles, different topics/areas

### 4. Association: Connect Word (RoundGames)
- **Core Mechanic**: Find hidden connections between words, group logically
- **Features**: Themed levels, increasing difficulty, develops thinking/vocabulary/attention

## GZ Implementation Plan

### Core Mechanic (Unique Spin)
Instead of a full solitaire layout (too complex for single-file), implement:
- **Grid-based word association puzzle** with solitaire-inspired card mechanics
- Each level has a set of word cards face-down in a tableau layout
- Players flip cards to reveal words, then drag to matching category zones
- Categories are revealed progressively (like uncovering tableau in solitaire)
- Complete all category piles to "clear the board" (solitaire win condition)

### Systems to Implement
1. **Card Drawing**: Flip cards from tableau (solitaire draw mechanic)
2. **Category Piles**: 4-6 categories per level, drag matching words to each
3. **Star Rating**: 1-3 stars based on speed, mistakes, hints used
4. **Progressive Difficulty**: Easy (4 categories × 3 words) → Hard (6 categories × 5 words)
5. **Hint System**: Reveal a word's category (limited hints)
6. **Undo**: Take back last placed card
7. **Score System**: Points for correct placements, combos for streak
8. **Progress Save**: localStorage with version field
9. **Tutorial**: Interactive walkthrough for first level
10. **Daily Puzzle**: Seeded daily challenge
11. **Sound**: Web Audio API procedural SFX + BGM

### Level Design
- 50+ levels across themed categories (Animals, Food, Colors, Sports, etc.)
- Each level: 4-6 categories with 3-5 words each (12-30 word cards)
- Difficulty curves: more categories, more words, trickier associations

### Visual Style
- Dark neon gradient (GameZipper style)
- Cards with flip animations
- Category zones with color-coded borders
- Particle effects on completion
- Neon glow accents
