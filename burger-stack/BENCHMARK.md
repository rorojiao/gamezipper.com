# Burger Stack — Competitor Benchmark

## Selected: Burger Stack (21/25)
**Slug**: burger-stack
**Category**: puzzle (ingredient order-matching / time-management hybrid)
**Rationale**: Skipped logo-quiz (22/25, higher score) due to trademark/IP risk — cannot reproduce real brand logos; fictional brands defeat the core "logo quiz" value proposition. Burger-stack is next puzzle-appropriate candidate with zero IP risk.

## Competitors Benchmarked

### 1. Papa's Burgeria (Flipline Studios)
- **Levels**: ~50+ days, each with multiple customers
- **Systems**: Order station (take order) → Grill station (cook patties) → Build station (assemble in order) → toppings
- **Scoring**: Per-station score (grill accuracy, build accuracy, speed), customer tips, star rating
- **Difficulty curve**: More toppings, more customers, tighter timers
- **Art**: Cartoon style, character sprites
- **Music**: Upbeat casual restaurant loop

### 2. Burger Restaurant / Burger Shop (Big Fish / casual portals)
- **Levels**: 20-40 levels, escalating
- **Systems**: Click ingredients in correct sequence, serve before timer, combo multiplier
- **Scoring**: Order accuracy, speed bonus, combo chain
- **Features**: Tips, upgrades (faster grill, more stations), VIP customers

### 3. Cook & Serve / Diner Dash lineage
- **Systems**: Queue management, patience meters, chaining bonuses, upgrades
- **Scoring**: Chain bonuses, tips, level targets

## Systems to Implement (competitor parity)
- [x] Customer order display (visual ingredient sequence)
- [x] Ingredient selection (click/tap to add to stack)
- [x] Order accuracy scoring (correct ingredients, correct order)
- [x] Time/patience system per customer
- [x] Combo multiplier for consecutive perfect orders
- [x] Star rating per level (1-3 stars based on accuracy + speed)
- [x] Progressive difficulty (more ingredients, faster orders, VIPs)
- [x] Tips/cash economy
- [x] Level progression with targets (earn $X to advance)
- [x] 25 levels with difficulty curve
- [x] Progress save (localStorage with version)
- [x] Tutorial / how-to-play
- [x] Web Audio API procedural BGM + SFX (click, correct, wrong, combo, level-complete, coin)
- [x] Settings (sound toggle)
- [x] Responsive desktop + mobile

## Level Design (25 levels)
| Levels | Ingredients | Customers | Time | Special |
|--------|-------------|-----------|------|---------|
| 1-5    | 2-3         | 3-4       | 45s  | Tutorial |
| 6-10   | 4-5         | 5-6       | 50s  | Double patty |
| 11-15  | 5-6         | 6-7       | 55s  | VIP ($2x) |
| 16-20  | 6-7         | 7-8       | 50s  | Rush mode |
| 21-25  | 7-8         | 8-10      | 55s  | Mixed rush + VIP |

## Art Style
- Dark gradient background (GameZipper house style)
- Clean flat-design food icons (procedural PIL for app icon + OG)
- Canvas-drawn ingredients (buns, patty, lettuce, tomato, cheese, etc.) with gradients
- Neon accent for combos, gold for tips

## Music Style
- Upbeat casual restaurant loop (Web Audio procedural: marimba + light percussion)
