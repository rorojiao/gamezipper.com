# Papa's Freezeria — Benchmark Document

## Competitors Analyzed
1. **Papa's Freezeria (Flipline Studios)** — Poki/SilverGames/Y8, 4.3/5 rating, 56M+ plays on Y8, 145K votes on SilverGames
2. **Papa's Freezeria Deluxe (Steam)** — 90 Steam achievements, enhanced version
3. **Kitchen Rush (GameZipper)** — Our existing cooking game for reference

## Core Mechanic
- Ice cream sundae shop management on Calypso Island
- 4 Stations: Order → Build → Mix → Top
- Time management: serve customers before patience runs out
- Tips based on order accuracy + speed

## Station Details
1. **Order Station**: Read customer order ticket (cup size, ice cream flavors, mixables, syrups, blend time, whipped cream, toppings)
2. **Build Station**: Select cup → pour ice cream flavors (layered) → add mixables (cookies, fruit, candy)
3. **Mix Station**: Add syrup → blend for correct duration (timing minigame)
4. **Top Station**: Add whipped cream → add toppings (sprinkles, cherry, cookie, etc.) → serve

## Systems Required
- **Customer Queue**: Multiple customers waiting, patience meters
- **Order Accuracy Scoring**: % match per station → overall tip percentage
- **Tips/Currency System**: Earn tips based on accuracy and speed
- **Upgrade Shop**: Buy better equipment (faster blender, more flavors, decorations)
- **Day System**: Each day has wave of customers, day summary with earnings
- **Customer Types**: Regular, picky customers, VIP/closers (harder orders)
- **Achievement System**: Complete milestones for rewards
- **Progress Saving**: localStorage with version field
- **Tutorial**: First-day walkthrough
- **Sound Effects**: Web Audio API procedural sounds for all interactions

## Ingredients (Minimum)
- 3 Cup Sizes (Small/Medium/Large)
- 6 Ice Cream Flavors (Vanilla, Chocolate, Strawberry, Mint, Banana, Blueberry)
- 8 Mixables (Cookie dough, Brownie, Strawberry, Banana, Oreo, Marshmallow, Gummy bear, Cherry)
- 6 Syrups (Chocolate, Strawberry, Caramel, Vanilla, Mint, Butterscotch)
- Blend durations: varies per order
- 6 Toppings (Whipped cream, Sprinkles, Cherry, Chocolate chips, Cookie, Nuts)

## Visual Style
- Tropical/beach theme, bright colors
- Character portraits for customers
- Station-switching navigation
- Dark neon GameZipper style for chrome/UI

## Difficulty Progression
- Days get harder: more customers, more complex orders, faster impatience
- Unlock new ingredients as days progress
- VIP customers appear on later days with very specific orders
