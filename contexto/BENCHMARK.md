# Contexto — Competitor Benchmark

## Core Concept
Guess the secret word using semantic proximity. Each guess is ranked by how close it is in meaning (not letters) to the secret word.

## Competitors Analyzed

### 1. Contexto.me (Original)
- **Mechanic**: Type a word, get a rank number (#1 = secret word, #2 = very close, #3000 = far away)
- **UI**: Minimalist, color-coded bar (green=#1, red=far), guess history list
- **Features**: Daily puzzle, unlimited practice, dark mode
- **Feedback**: Number position + color gradient bar
- **Dictionary**: ~5000+ words, uses AI embeddings (likely word2vec/glove)

### 2. Semantle.com
- **Mechanic**: Similar to Contexto but uses Word2Vec
- **Features**: Daily puzzle, guess history, cold/warm/hot labels
- **Score formula**: cosine similarity displayed as percentage

### 3. ContextoGame.io (Clone)
- **Mechanic**: Same as Contexto.me
- **Features**: Unlimited mode, daily, hints
- **UI**: Cleaner than original

## Systems to Implement
1. **Word Embedding System**: Pre-computed similarity scores (use hardcoded semantic clusters)
2. **Daily Puzzle**: Seeded random from word list (date-based seed)
3. **Practice/Unlimited Mode**: Random word selection
4. **Guess Input**: Text input with autocomplete suggestions
5. **Visual Feedback**: Color-coded proximity bar (gradient green→yellow→orange→red)
6. **Guess History**: Scrollable list showing all guesses with rank numbers
7. **Share Results**: Emoji-based share grid (like Wordle)
8. **Statistics**: Games played, win %, current streak, best streak, avg guesses
9. **Progress Saving**: localStorage with version field
10. **Sound Effects**: Web Audio API (click, correct, wrong, win fanfare)
11. **Dark Neon Theme**: GameZipper consistent style
12. **Responsive**: Desktop + mobile, large touch targets
13. **SEO**: JSON-LD, OG tags, analytics, canonical URL

## Technical Approach
Since we can't use an API, implement semantic similarity via:
- **Pre-built word clusters**: Group ~2000 words into 50+ semantic categories
- **Category distance**: Words in same category = close, adjacent categories = medium, far categories = distant
- **Within-category ranking**: Alphabetical or frequency-based within same cluster
- **Special rules**: Synonyms, antonyms handled via cluster adjacency

This gives a convincing "AI-ranked" feel without actual embeddings.
