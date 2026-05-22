# Contexto - Competitive Benchmark

## Core Concept
Guess a secret word by entering words. The game ranks each guess by semantic similarity (how close in meaning) to the secret word using AI-powered word embeddings. Color-coded feedback shows proximity: dark red = very close, yellow = moderate, cool blue = far.

## Competitor Analysis

### 1. Contexto.me (Original)
- **Daily puzzle format**: One new puzzle per day
- **Unlimited practice mode**: Free play
- **Color system**: Warm colors (close) → Cool colors (far)
- **Position number**: Shows #1 = exact match, #1000+ = far
- **Word ranking**: Each guess gets ranked among all words
- **Share results**: Social sharing of grid
- **Stats**: Current streak, max streak, guesses distribution
- **No word list shown**: Players discover through guessing
- **5000+ word dictionary**

### 2. Semantle (npmcoleman.github.io/semantle)
- Similar mechanic but different scoring (similarity score -67 to 100)
- Shows exact similarity value
- "Getting warmer/colder" feedback
- No color-coded grid
- Daily + unlimited mode

### 3. Categorle
- Combination of Connections + Contexto
- Players sort words by how close they are to the secret word
- Different twist but same core mechanic

## Systems to Implement (ALL Required)

### Core Systems
1. **Semantic Word Ranking**: Pre-computed word similarity data for 2000+ words
2. **Daily Puzzle**: Seeded random for reproducible daily word (one per day)
3. **Practice/Unlimited Mode**: Random word selection
4. **Guess History**: Visual grid showing position numbers + color coding
5. **Share Results**: Copy emoji grid + stats to clipboard

### Scoring & Feedback
6. **Color-coded proximity**: Position #1-10 = dark red, #11-50 = orange, #51-200 = yellow, #201-500 = green, #501-1000 = blue, #1000+ = gray
7. **Position numbers**: Show exact rank (#1 = perfect)
8. **Guess count**: Track number of guesses
9. **"Getting warmer" animation**: Visual feedback when getting closer

### Progression & Stats
10. **Statistics**: Games played, win %, current streak, max streak, avg guesses
11. **Guess distribution**: Bar chart of how many guesses per game
12. **Streak tracking**: Daily play streaks

### UX Systems
13. **Tutorial**: First-time play guide explaining the mechanic
14. **Hint system**: Reveal the first letter or category of the secret word
15. **Sound effects**: Web Audio API for guess submission, close guess celebration, win fanfare
16. **Dark neon theme**: GameZipper style
17. **Responsive**: Desktop + mobile
18. **Settings**: Sound toggle, dark mode

### SEO & Analytics
19. **JSON-LD structured data**: VideoGame + FAQPage + HowTo + BreadcrumbList
20. **og:title, og:description, og:image**
21. **Analytics tracking**: site-analytics.cap.1ktower.com

## Technical Approach
- Pre-computed similarity data: Hardcoded top-200 most-common-secret-words with their top-100 nearest neighbors
- Cosine similarity mapping to rank positions
- Seeded PRNG for daily word selection (based on date)
- Canvas-based rendering for smooth animations
- All English, no Chinese
