# Word Card Sort — Competitive Benchmark

## Core Mechanic
Sort word cards into correct categories. Each level presents a set of word cards that need to be sorted into labeled category slots. Cards are dealt one at a time from a deck into available columns, and the player must organize them by dragging cards into the correct category columns.

## Competitor Analysis

### 1. Words Klondike: Associations (Higgs Studio) — Primary Benchmark
- **Platform:** Android/iOS/PC, 100K+ downloads, 4.5★
- **Mechanic:** Solitaire-style card dealing + word association grouping. Cards are dealt from a stack into columns, player must sort 16 words into 4 groups of 4 by semantic association
- **Levels:** Endless (procedurally generated from word database)
- **Features:** Hints, shuffle, undo, daily puzzle, streak tracking, capybara mascot companion
- **Art:** Clean flat design, soft colors, card-based UI
- **Monetization:** Interstitial ads between levels, rewarded ads for hints

### 2. Card Solitaire: Word Game (Bravestars) — Browser Benchmark
- **Platform:** CrazyGames browser, 8.8/10 rating
- **Mechanic:** Klondike solitaire rules adapted for word cards. Sort cards into foundation piles by category
- **Features:** Undo, hints, timer, scoring
- **Art:** Simple card graphics, minimalist UI

### 3. Word Card Sort: Solitaire (BitEpoch) — Feature Reference
- **Platform:** Android, 10K+ downloads, 4.9★
- **Mechanic:** Deal word cards into columns, drag to sort by category
- **Features:** Daily challenges, power-ups, progress tracking
- **Art:** Colorful card design, gradient backgrounds

### 4. Word Sort Solitaire Journey (MobGame) — Level Design Reference
- **Platform:** Android/PC, 50K+ downloads, 4.4★
- **Mechanic:** Journey-based progression through themed word sort puzzles
- **Features:** World map, themed categories, bonus levels

## Systems to Implement

### Scoring
- Base points per card correctly placed: 10
- Combo bonus: consecutive correct placements multiply (x2, x3, x4)
- Level completion bonus: 100 + (remaining deck × 5)
- Star rating: 1★ (complete), 2★ (≤3 mistakes), 3★ (0 mistakes)

### Levels (50 levels, 5 tiers)
- Tier 1 (L1-10): 3 categories × 4 words, easy associations (animals, colors, fruits)
- Tier 2 (L11-20): 4 categories × 4 words, moderate associations
- Tier 3 (L21-30): 4 categories × 5 words, harder word associations
- Tier 4 (L31-40): 5 categories × 4 words, abstract/tricky categories
- Tier 5 (L41-50): 5 categories × 5 words, challenging semantic groups

### Power-ups
- Hint: Reveals one card's correct category (3 per level max)
- Shuffle: Rearrange dealt cards (2 per level max)
- Undo: Reverse last move (unlimited but costs time)

### Categories (examples)
- Animals: dog, cat, lion, tiger, eagle, dolphin, whale, penguin
- Colors: red, blue, green, yellow, purple, orange, pink, brown
- Sports: soccer, tennis, basketball, swimming, baseball, hockey
- Food: pizza, sushi, burger, pasta, taco, cake, salad, soup
- Countries: France, Japan, Brazil, Canada, Egypt, India, Spain
- Instruments: guitar, piano, drums, violin, flute, trumpet
- Weather: sunny, rainy, snowy, windy, cloudy, foggy, stormy
- Emotions: happy, angry, sad, excited, scared, surprised, bored

### UI/UX
- Card dealing animation (solitaire-style)
- Drag-and-drop cards to category columns
- Visual feedback: correct = green glow + particles, wrong = red shake
- Category labels visible at top of columns
- Remaining deck counter
- Progress bar per level
- Level select screen with stars

### Art Direction
- Dark gradient background (GameZipper style: #0a0a1a to #1a1a3e)
- Neon accent colors for categories
- Card design: rounded corners, subtle shadow, white/light card face
- Smooth flip animations for card dealing
- Particle effects on correct placement
