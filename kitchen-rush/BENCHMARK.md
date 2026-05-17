# Kitchen Rush — Competitive Benchmark

## Target Competitors
1. **Cooking Fever** (Nordcurrent) — 100M+ downloads, mobile + browser
2. **Papa's Pizzeria** (Flipline Studios) — Legendary browser cooking game, multi-station
3. **Kitchen Scramble** (Garden City Games) — 16M+ downloads, food truck theme
4. **Cooking Madness** (Zenith Games) — Fast-paced time management
5. **Cook, Serve, Delicious!** — PC/web, intense restaurant management

## Core Systems to Implement

### 1. Customer Queue System
- Customers arrive with patience timer (shown as progress bar)
- Multiple customers can queue (3-8 based on level)
- Patience depletes over time; if empty → customer leaves → lose hearts/lives
- Customer types: Normal (standard patience), VIP (double tips), Impatient (fast timer)
- Visual: Character sprite + thought bubble showing order

### 2. Multi-Station Cooking
- **Order Station**: See customer's order (dish + ingredients)
- **Prep Station**: Chop/prepare ingredients (tap-based, timing minigame)
- **Cook Station**: Cook on stove/oven (progress bar, can overcook!)
- **Serve Station**: Plate and deliver to customer

### 3. Dish System (at least 8 dishes across levels)
- Burger: Bun + Patty + Cheese + Lettuce + Tomato
- Pizza: Dough + Sauce + Cheese + Toppings
- Pasta: Noodles + Sauce + Meat + Herbs
- Sushi: Rice + Fish + Nori + Avocado
- Pancakes: Batter + Syrup + Berries + Cream
- Fried Rice: Rice + Egg + Veggies + Soy Sauce
- Salad: Lettuce + Tomato + Cucumber + Dressing
- Cake: Batter + Frosting + Decoration

### 4. Scoring System
- Base coins per completed order (10-50 based on complexity)
- Tip multiplier based on speed (serve before 50% patience = 3x, before 75% = 2x, before 100% = 1x)
- Combo bonus: serve consecutive orders without mistakes (2x, 3x, 4x...)
- Daily goal: earn X coins to pass level (stars: 1=goal, 1.5x=2 stars, 2x=3 stars)
- Perfect order bonus: exact ingredients = +20 coins

### 5. Upgrade System
- Kitchen equipment: Faster cooking, more burners, auto-serve
- Ingredients: Premium quality (higher tips)
- Restaurant: More customer slots, faster customer arrival
- Upgrades cost coins earned from levels

### 6. Progression System
- 30 levels across 5 restaurants (Burger Joint → Pizzeria → Asian Kitchen → Sushi Bar → Dessert Cafe)
- Each restaurant: 6 levels, unlocks new dishes
- Difficulty: More customers, less patience, more complex orders per level
- Stars unlock next restaurant

### 7. Tutorial System
- Level 1: Guided tutorial with arrows and highlights
- "Tap here to take order" → "Drag ingredient to pan" → "Serve to customer"
- Can skip tutorial, accessible from settings

### 8. Visual Style Reference
- Top-down isometric kitchen view (2.5D feel)
- Bright, warm colors (orange, yellow, warm wood tones)
- Animated cooking: steam, sizzle particles, chopping motion
- Customer characters with different appearances
- Ingredient icons: clear, colorful, recognizable

### 9. Audio Style Reference
- Upbeat, cheerful BGM (lo-fi kitchen vibes)
- SFX: Chop (knife), Sizzle (cooking), Ding (order ready), Coin (payment), Buzz (warning), Celebration (level complete)

### 10. Key Numerical Values
- Customer patience: 15-30 seconds (decreases with level)
- Cooking time: 3-8 seconds per step
- Burn time: 5 seconds after cooking complete
- Level duration: 90-180 seconds
- Coins per level goal: 100-500 (scales with difficulty)
- Upgrade costs: 100-2000 coins
