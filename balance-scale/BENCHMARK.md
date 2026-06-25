# Competitive Benchmark: Balance Scale (Coin Weighing Puzzle)

## Game Concept
Classic logic deduction puzzle: given N identical-looking coins where one is counterfeit
(different weight), use a balance scale with limited weighings to identify the fake coin.

## Top Competitors

### 1. "Find the Fake Coin" / "Balance Puzzle" (Various)
- **Downloads**: 1M+ combined across app store variants
- **Mechanic**: Drag coins onto balance pans, press weigh, observe tilt, deduce
- **Monetization**: Ads + hint purchases
- **Key features**: Progressive difficulty (3→27+ coins), timer mode, daily challenges
- **Weakness**: Many variants have poor UX, ugly graphics, no level system

### 2. Classic Math Competition / IQ Test Problem
- **Origin**: The "12 coins problem" is a famous mathematical puzzle
- **12 coins, 3 weighings, unknown if fake is heavy or light** = the gold standard
- **27 coins, 3 weighings** = theoretical maximum for 3 weighings
- Popular in: Math competitions, brain teaser books, IQ tests, coding interviews

### 3. "Weighing" Puzzle Apps (Mobile)
- Developer: Various (AppStall, PuzzleGames, etc.)
- Features: Hints, undo, level selection, achievements
- Revenue model: Interstitial ads every 3-5 levels + banner ads
- Rating: 4.0-4.5 stars across variants

## Key Mechanics to Implement
1. **Balance Scale UI**: Visual beam that tilts left/right based on weight comparison
2. **Drag-Drop Coins**: Move coins from supply to left pan / right pan
3. **Weigh Action**: Compare weights, animate tilt, show result (heavier/lighter/equal)
4. **Deduction**: Player tracks weighings mentally (or with notes) to narrow down
5. **Guess**: Tap suspected fake coin → reveal correct/incorrect
6. **Difficulty Scaling**:
   - Known heavy/light (easier) vs unknown (harder)
   - More coins = more deductions needed
   - Fewer weighings allowed = more efficient deduction required

## GZ Differentiation
- **30 hand-crafted levels** across 6 tiers (competitors often have random gen only)
- **Star rating system** (3 stars = used optimal weighings; 1 star = used all allowed)
- **Daily challenge** with seeded random generation
- **8 achievements** for engagement
- **Hint system** (suggest which coins to weigh next)
- **Web Audio API** sound effects (coin drop, scale creak, win chime)
- **Mobile-first responsive** design
- **No ads blocking gameplay** (GZ standard ad placement)

## Scoring Formula
- Star 3: Used ≤ optimal weighings
- Star 2: Used 1 extra weighing
- Star 1: Used all allowed weighings (barely solved)
- 0 stars: Failed (ran out of weighings or guessed wrong)

## Difficulty Tiers
| Tier | Levels | Coins | Fake Type | Max Weighings |
|------|--------|-------|-----------|---------------|
| Beginner | 1-5 | 3-5 | Heavy | 1-2 |
| Easy | 6-10 | 6-9 | Heavy | 2 |
| Medium | 11-15 | 9-12 | Light | 2-3 |
| Hard | 16-20 | 12-15 | Unknown | 3 |
| Expert | 21-25 | 15-20 | Unknown | 3 |
| Master | 26-30 | 20-27 | Unknown | 3 |
